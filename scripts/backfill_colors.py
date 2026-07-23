"""
scripts/backfill_colors.py
Versione "bulk" di analyze_colors.py: calcola il colore dominante della
cover per TUTTI i giochi che non ce l'hanno ancora (color_r IS NULL),
invece di uno alla volta.

Perché serve: la migrazione V5 assegna il colore a mano solo ai 5 giochi
demo del seed — per gli altri ~122k del dataset reale non è mai stato
calcolato, quindi la maggior parte dei filtri colore in catalogo non
restituisce risultati.

Uso:
    python scripts/backfill_colors.py                # tutti i mancanti
    python scripts/backfill_colors.py --limit 50      # solo i primi 50 (test)
    python scripts/backfill_colors.py --workers 24    # più/meno paralleli (default 16)
    python scripts/backfill_colors.py --force         # ricalcola anche chi ce l'ha già

Sicuro da interrompere e rilanciare: aggiorna riga per riga (non in una
transazione unica), quindi al riavvio riparte solo dai giochi ancora
NULL invece di ricominciare da zero.
"""
import argparse
import io
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import psycopg2
import requests
from PIL import Image, ImageStat
from tqdm import tqdm

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "archetype"),
    "user": os.getenv("DB_USER", "archetype"),
    "password": os.getenv("DB_PASSWORD", "archetype_secret"),
}

REQUEST_TIMEOUT = 10


def fetch_pending(conn, limit: int | None, force: bool) -> list[tuple[int, str]]:
    """Legge (appid, header_image_url) dei giochi da elaborare."""
    where = "header_image_url IS NOT NULL"
    if not force:
        where += " AND color_r IS NULL"
    query = f"SELECT appid, header_image_url FROM games WHERE {where} ORDER BY appid"
    if limit:
        query += f" LIMIT {limit}"
    with conn.cursor() as cur:
        cur.execute(query)
        return cur.fetchall()


def dominant_rgb(image_url: str) -> tuple[int, int, int]:
    """Stessa logica di analyze_colors.py: resize 32x32, media dei pixel."""
    resp = requests.get(image_url, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    img = img.resize((32, 32))
    r, g, b = (int(v) for v in ImageStat.Stat(img).mean)
    return r, g, b


def process_one(appid: int, url: str) -> tuple[int, tuple[int, int, int] | None, str | None]:
    """Worker di thread: scarica+calcola, non tocca il DB (fatto dal thread principale)."""
    try:
        rgb = dominant_rgb(url)
        return appid, rgb, None
    except Exception as e:  # URL rotta, timeout, immagine corrotta, ecc. — non blocca il resto
        return appid, None, f"{type(e).__name__}: {e}"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--limit", type=int, default=None, help="Elabora solo i primi N giochi (utile per un test veloce)")
    parser.add_argument("--workers", type=int, default=16, help="Richieste HTTP in parallelo (default 16)")
    parser.add_argument("--force", action="store_true", help="Ricalcola anche i giochi che hanno già un colore")
    args = parser.parse_args()

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False

    try:
        pending = fetch_pending(conn, args.limit, args.force)
    except Exception as e:
        print(f"Errore leggendo dal DB: {e}")
        return

    total = len(pending)
    if total == 0:
        print("Nessun gioco da elaborare (tutti i colori sono già calcolati — usa --force per ricalcolare).")
        conn.close()
        return

    print(f"Da elaborare: {total} giochi, {args.workers} richieste in parallelo")
    start = time.time()

    success = 0
    failed = 0
    failed_samples: list[str] = []

    with conn.cursor() as cur, ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(process_one, appid, url): appid for appid, url in pending}

        for i, future in enumerate(tqdm(as_completed(futures), total=total, unit="gioco"), start=1):
            appid, rgb, error = future.result()

            if rgb is not None:
                r, g, b = rgb
                cur.execute(
                    "UPDATE games SET color_r = %s, color_g = %s, color_b = %s WHERE appid = %s",
                    (r, g, b, appid),
                )
                success += 1
            else:
                failed += 1
                if len(failed_samples) < 10:
                    failed_samples.append(f"appid {appid}: {error}")

            # Commit ogni 200 righe invece che una per una — molto più veloce,
            # e se lo script viene interrotto qui si perde al massimo l'ultimo
            # batch parziale, non tutto il lavoro fatto finora.
            if i % 200 == 0:
                conn.commit()

        conn.commit()

    elapsed = time.time() - start
    print(f"\nCompletato in {elapsed/60:.1f} minuti")
    print(f"  Riusciti: {success}")
    print(f"  Falliti:  {failed}")
    if failed_samples:
        print("\nEsempi di errori (primi 10):")
        for line in failed_samples:
            print(f"  - {line}")

    conn.close()


if __name__ == "__main__":
    main()
