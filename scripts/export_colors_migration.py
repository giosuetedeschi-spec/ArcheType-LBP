"""
scripts/export_colors_migration.py
Esporta i colori dominanti gia' calcolati (da backfill_colors.py) nel DB
locale in un'unica migrazione Flyway, cosi' che si applichi da sola su
qualsiasi database esistente al prossimo avvio del backend -- stesso
principio di V6__backfill_avatar_url.sql (Anna), applicato ai colori:
un file di migrazione con i dati gia' dentro, zero chiamate di rete a
runtime, funziona su volume vuoto E su volume gia' popolato, con un
semplice "docker compose up --build".

Uso (dopo aver fatto girare backfill_colors.py fino alla fine):
    python scripts/export_colors_migration.py

Genera backend/src/main/resources/db/migration/V7__backfill_dominant_colors.sql
Si rifiuta di sovrascrivere se il file esiste gia' -- usa --force per farlo comunque.
"""
import argparse
import os
from datetime import date
from pathlib import Path

import psycopg2

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "archetype"),
    "user": os.getenv("DB_USER", "archetype"),
    "password": os.getenv("DB_PASSWORD", "archetype_secret"),
}

# Percorso calcolato relativo a questo file, non alla working directory
# da cui lo lanci -- funziona sia da scripts/ che dalla root del repo.
REPO_ROOT = Path(__file__).resolve().parent.parent
MIGRATION_DIR = REPO_ROOT / "backend" / "src" / "main" / "resources" / "db" / "migration"
MIGRATION_VERSION = "V7"
MIGRATION_NAME = "backfill_dominant_colors"


def fetch_colors(conn) -> list[tuple[int, int, int, int]]:
    """Legge (appid, color_r, color_g, color_b) di tutti i giochi con colore calcolato."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT appid, color_r, color_g, color_b FROM games "
            "WHERE color_r IS NOT NULL AND color_g IS NOT NULL AND color_b IS NOT NULL "
            "ORDER BY appid"
        )
        return cur.fetchall()


def build_migration_sql(rows: list[tuple[int, int, int, int]]) -> str:
    """Un unico UPDATE con VALUES invece di uno statement per gioco --
    molto piu' veloce da applicare (un solo giro di query planning invece
    di N), e un file piu' piccolo (niente 'UPDATE games SET ... WHERE'
    ripetuto per ogni riga)."""
    header = f"""-- Backfill del colore dominante per {len(rows)} giochi, gia' calcolato
-- localmente con scripts/backfill_colors.py e poi esportato qui con
-- scripts/export_colors_migration.py il {date.today().isoformat()}.
-- File generato automaticamente -- non modificare a mano, rigenera invece
-- con lo script se servono altri giochi.
--
-- Un solo UPDATE con VALUES invece di {len(rows)} statement separati:
-- molto piu' veloce da applicare, e si comporta come V6 (Anna) --
-- si applica da sola su QUALSIASI database esistente al prossimo avvio
-- del backend, volume vuoto o gia' popolato che sia. Nessuna chiamata
-- di rete qui dentro: solo dati gia' pronti.

UPDATE games AS g
SET color_r = v.r, color_g = v.g, color_b = v.b
FROM (VALUES
"""
    value_lines = ",\n".join(f"  ({appid}, {r}, {g}, {b})" for appid, r, g, b in rows)
    footer = "\n) AS v(appid, r, g, b)\nWHERE g.appid = v.appid;\n"
    return header + value_lines + footer


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--force", action="store_true", help="Sovrascrive V7 anche se esiste gia'")
    args = parser.parse_args()

    target = MIGRATION_DIR / f"{MIGRATION_VERSION}__{MIGRATION_NAME}.sql"
    if target.exists() and not args.force:
        print(f"Errore: {target} esiste gia'. Usa --force per sovrascriverlo, "
              f"o rinomina lo script se serve una versione diversa (es. V8).")
        return

    if not MIGRATION_DIR.exists():
        print(f"Errore: cartella migrazioni non trovata: {MIGRATION_DIR}\n"
              f"Lancia questo script dalla root del repo o da scripts/.")
        return

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        rows = fetch_colors(conn)
    finally:
        conn.close()

    if not rows:
        print("Nessun gioco con colore calcolato trovato -- lancia prima "
              "scripts/backfill_colors.py, poi riprova.")
        return

    sql = build_migration_sql(rows)
    target.write_text(sql, encoding="utf-8")

    size_kb = target.stat().st_size / 1024
    print(f"Scritto {target}")
    print(f"  Giochi inclusi: {len(rows)}")
    print(f"  Dimensione file: {size_kb:.0f} KB")
    print()
    print("Prossimi passi:")
    print("  1. Controlla il file (prime righe, poi fidati del resto)")
    print("  2. docker compose down   # SENZA -v, il volume resta intatto")
    print("  3. docker compose up --build   # Flyway applica V7 in automatico")
    print("  4. Verifica: SELECT count(*) FROM games WHERE color_r IS NOT NULL;")
    print("  5. Commit + PR di backend/src/main/resources/db/migration/V7__backfill_dominant_colors.sql")


if __name__ == "__main__":
    main()
