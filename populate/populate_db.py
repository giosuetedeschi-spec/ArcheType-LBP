"""Popolamento database da dataset Steam CSV/JSON."""

import os
import re
import sys
import logging
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "archetype"),
    "user": os.getenv("DB_USER", "archetype"),
    "password": os.getenv("DB_PASSWORD", "archetype_secret"),
}

DATASET_PATH = os.getenv("STEAM_DATASET_PATH", "/data/steam_games.csv")
BATCH_SIZE = 1000


def get_connection():
    """Connessione al database."""
    return psycopg2.connect(**DB_CONFIG)


# L'header dichiarato nel file CSV ha 39 nomi di colonna, ma OGNI riga dati ha
# 40 campi. La causa: la colonna "DiscountDLC count" nell'header è in realtà
# la fusione (per un bug nell'export originale del dataset) di due colonne
# distinte: "Discount" e "DLC count". Una volta separate, righe e header
# tornano ad avere lo stesso numero di campi (40) e tutti i valori successivi
# (Developers, Publishers, Categories, Genres, ecc.) si allineano
# correttamente. Senza questa correzione, pandas legge "Developers" al posto
# di "Publishers", "Name" al posto del "Release date", ecc., causando lo
# scarto del 91% delle righe durante il cleaning (campi numerici attesi
# contenevano testo, e viceversa).
_CORRECTED_CSV_HEADER = [
    "AppID", "Name", "Release date", "Estimated owners", "Peak CCU", "Required age",
    "Price", "Discount", "DLC count", "About the game", "Supported languages",
    "Full audio languages", "Reviews", "Header image", "Website", "Support url",
    "Support email", "Windows", "Mac", "Linux", "Metacritic score", "Metacritic url",
    "User score", "Positive", "Negative", "Score rank", "Achievements", "Recommendations",
    "Notes", "Average playtime forever", "Average playtime two weeks",
    "Median playtime forever", "Median playtime two weeks", "Developers", "Publishers",
    "Categories", "Genres", "Tags", "Screenshots", "Movies",
]


def load_dataset(path: str) -> pd.DataFrame:
    """Carica il dataset Steam, correggendo l'header CSV malformato (vedi
    _CORRECTED_CSV_HEADER) se il numero di campi nei dati combacia.
    """
    p = Path(path)
    if not p.exists():
        log.error(f"Dataset non trovato: {path}")
        sys.exit(1)

    if p.suffix == ".csv":
        df = _load_csv_with_corrected_header(path)
    elif p.suffix == ".json":
        df = pd.read_json(path)
        df.columns = [str(col).strip().lower() for col in df.columns]
        if "appid" in df.columns:
            df = df.rename(columns={"appid": "steam_app_id"})
    else:
        log.error(f"Formato non supportato: {p.suffix}")
        sys.exit(1)

    log.info(f"Dataset caricato: {len(df)} righe, colonne: {list(df.columns)[:10]}")
    return df


def _load_csv_with_corrected_header(path: str) -> pd.DataFrame:
    import csv as csv_module

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv_module.reader(f)
        declared_header = next(reader)
        rows = list(reader)

    # Verifica empirica: se il numero di campi nelle righe dati combacia con
    # l'header corretto (40), usalo. Altrimenti torna al fallback "best
    # effort" col solo header dichiarato (e accetta possibili
    # disallineamenti, loggando un avviso).
    if rows and len(rows[0]) == len(_CORRECTED_CSV_HEADER):
        header = _CORRECTED_CSV_HEADER
        log.info(
            "Rilevato header CSV malformato (39 colonne dichiarate vs 40 campi "
            "dati). Applicata correzione: 'DiscountDLC count' -> 'Discount' + "
            "'DLC count'."
        )
    else:
        header = declared_header
        log.warning(
            "Numero di campi nelle righe non corrisponde all'header corretto "
            "atteso; uso l'header originale del file (possibili disallineamenti)."
        )

    good_rows = [r for r in rows if len(r) == len(header)]
    malformed = len(rows) - len(good_rows)
    if malformed:
        log.warning(f"Righe scartate per numero di campi anomalo: {malformed}")

    df = pd.DataFrame(good_rows, columns=header)
    df.columns = [str(col).strip().lower() for col in df.columns]
    if "appid" in df.columns:
        df = df.rename(columns={"appid": "steam_app_id"})
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Pulisce e normalizza i dati."""
    df.columns = [str(col).strip().lower() for col in df.columns]

    if "appid" in df.columns and "steam_app_id" not in df.columns:
        df = df.rename(columns={"appid": "steam_app_id"})
    elif "app id" in df.columns and "steam_app_id" not in df.columns:
        df = df.rename(columns={"app id": "steam_app_id"})

    column_map = {
        "name": "name",
        "title": "name",
        "release date": "release_date",
        "release_date": "release_date",
        "developer": "developer",
        "developers": "developer",
        "publisher": "publisher",
        "publishers": "publisher",
        "price": "price",
        "rating": "rating",
        "user score": "rating",
        "genres": "genres",
        "genre": "genres",
        "categories": "categories",
        "category": "categories",
        "about the game": "description",
        "description": "description",
        "header image": "header_image_url",
        "header_image": "header_image_url",
        "header_image_url": "header_image_url",
    }
    df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})

    if "name" not in df.columns:
        raise KeyError("Nel dataset non è presente la colonna 'name'.")

    df = df.dropna(subset=["name"])
    df["name"] = df["name"].astype(str).str.strip()
    df = df[df["name"] != ""]

    log.info(f"Dati puliti: {len(df)} righe")
    return df


def _clean_text(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    if text in {"", "nan", "none"}:
        return None
    return text


def _truncate_text(value, max_len: int):
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return None
    return text[:max_len]


def _parse_app_id(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text:
        return None
    match = re.match(r"^\d+$", text)
    if not match:
        return None
    app_id = int(text)
    if app_id < 0 or app_id > 2_147_483_647:
        return None
    return app_id


def _parse_price(value) -> float:
    if pd.isna(value):
        return 0.0
    text = str(value).strip()
    if not text or text.lower() in {"free", "free to play", "free-to-play", "nan", "none"}:
        return 0.0
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    return float(match.group(1)) if match else 0.0


def _parse_rating(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    value_num = float(match.group(1))
    result = value_num if value_num <= 5 else round(value_num / 10, 2)
    return min(result, 9.99)


def _parse_date(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return None
    text = text.replace("/", "-")
    if re.match(r"^\d{4}-\d{2}-\d{2}$", text):
        return text
    if re.match(r"^\d{4}$", text):
        return f"{text}-01-01"
    match = re.search(r"(\d{4})", text)
    return f"{match.group(1)}-01-01" if match else None


def _ensure_lookup(cur, table_name: str, values: list) -> dict:
    if not values:
        return {}

    unique_values = sorted({v for v in values if v})
    if not unique_values:
        return {}

    truncated_values = [_truncate_text(v, 255) for v in unique_values]
    filtered_values = [v for v in truncated_values if v]
    if not filtered_values:
        return {}

    insert_sql = f"INSERT INTO {table_name} (name) VALUES %s ON CONFLICT (name) DO NOTHING"
    execute_values(cur, insert_sql, [(v,) for v in filtered_values], page_size=1000)

    cur.execute(f"SELECT id, name FROM {table_name} WHERE name = ANY(%s)", [filtered_values])
    rows = cur.fetchall()
    return {name: int(row_id) for row_id, name in rows}


def insert_games(df: pd.DataFrame):
    """Inserisce i giochi nel database."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM games")
    existing = cur.fetchone()[0]
    log.info(f"Giochi esistenti: {existing}")

    parsed_rows = []
    developer_names = []
    publisher_names = []
    skipped = 0

    for _, row in df.iterrows():
        app_id = _parse_app_id(row.get("steam_app_id"))
        if app_id is None:
            skipped += 1
            continue

        developer = _clean_text(row.get("developer"))
        publisher = _clean_text(row.get("publisher"))
        if developer:
            developer_names.append(developer)
        if publisher:
            publisher_names.append(publisher)

        parsed_rows.append({
            "appid": app_id,
            "name": _clean_text(row.get("name")) or "",
            "release_date": _parse_date(row.get("release_date")),
            "developer": developer,
            "publisher": publisher,
            "price": _parse_price(row.get("price")),
            "rating": _parse_rating(row.get("rating")),
            "description": _clean_text(row.get("description")),
            "header_image_url": _clean_text(row.get("header_image_url")),
        })

    if skipped:
        log.info(f"Record saltati per AppID non valido: {skipped}")

    developer_map = _ensure_lookup(cur, "developers", developer_names)
    publisher_map = _ensure_lookup(cur, "publishers", publisher_names)

    game_records = []
    for item in parsed_rows:
        game_records.append((
            item["appid"],
            _truncate_text(item["name"], 255) or "",
            item["release_date"],
            developer_map.get(_truncate_text(item["developer"], 255)) if item["developer"] else None,
            publisher_map.get(_truncate_text(item["publisher"], 255)) if item["publisher"] else None,
            item["price"],
            item["rating"],
            _truncate_text(item["description"], 5000),
            _truncate_text(item["header_image_url"], 500),
        ))

    sql = """
        INSERT INTO games (appid, name, release_date, developer_id, publisher_id,
                          price, rating, description, header_image_url)
        VALUES %s
        ON CONFLICT (appid) DO NOTHING
    """

    for i in tqdm(range(0, len(game_records), BATCH_SIZE), desc="Inserting"):
        batch = game_records[i:i + BATCH_SIZE]
        execute_values(cur, sql, batch, page_size=BATCH_SIZE)
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM games")
    total = cur.fetchone()[0]
    log.info(f"Insert completati. Totale giochi: {total}")

    cur.close()
    conn.close()


def main():
    log.info("=== Popolamento Database ArcheType ===")
    df = load_dataset(DATASET_PATH)
    df = clean_data(df)
    insert_games(df)
    log.info("=== Completato ===")


if __name__ == "__main__":
    main()
