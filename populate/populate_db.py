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


def load_dataset(path: str) -> pd.DataFrame:
    """Carica il dataset Steam."""
    p = Path(path)
    if not p.exists():
        log.error(f"Dataset non trovato: {path}")
        sys.exit(1)

    # Carica come stringhe per evitare cast indesiderati. Il dataset Steam
    # ha già una colonna AppID reale, quindi evitiamo di trattarla come indice.
    if p.suffix == ".csv":
        df = pd.read_csv(path, dtype=str, keep_default_na=False)
    elif p.suffix == ".json":
        # pd.read_json does not support index_col; load then decide
        df = pd.read_json(path)
        # Ensure all columns are strings to keep behavior consistent
        try:
            df = df.astype(str)
        except Exception:
            pass
    else:
        log.error(f"Formato non supportato: {p.suffix}")
        sys.exit(1)

    # Normalize column names before any AppID detection.
    df.columns = [str(col).strip().lower() for col in df.columns]

    # If the dataset has an unnamed first column that pandas exposed as
    # a generic 'index' column, rename it to steam_app_id only when it looks
    # like the real AppID column (numeric values).
    if "index" in df.columns and df["index"].astype(str).str.match(r"^\d+$", na=False).mean() > 0.95:
        df = df.rename(columns={"index": "steam_app_id"})

    if "appid" in df.columns:
        df = df.rename(columns={"appid": "steam_app_id"})
    elif "app id" in df.columns:
        df = df.rename(columns={"app id": "steam_app_id"})

    log.info(f"Dataset caricato: {len(df)} righe, colonne: {list(df.columns)[:10]}")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Pulisce e normalizza i dati."""
    df.columns = [str(col).strip().lower() for col in df.columns]

    # Normalizza possibili nomi di colonna per l'app id
    if "appid" in df.columns:
        df = df.rename(columns={"appid": "steam_app_id"})
    elif "app id" in df.columns:
        df = df.rename(columns={"app id": "steam_app_id"})
    elif "steam_app_id" in df.columns:
        df = df.rename(columns={"steam_app_id": "steam_app_id"})

    # If we loaded the CSV with the default headers, the first column is still
    # named 'appid' (lowercase) and should be treated as the real AppID.
    if "appid" in df.columns and "steam_app_id" not in df.columns:
        df = df.rename(columns={"appid": "steam_app_id"})

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

    # Detect AppID column automatically if present but non-numeric
    def numeric_fraction(series: pd.Series) -> float:
        s = series.dropna().astype(str)
        if len(s) == 0:
            return 0.0
        return float(s.str.match(r"^\s*\d+\s*$").sum()) / len(s)

    # If there is an explicit-looking column name, prefer it
    name_candidates = [col for col in df.columns if re.search(r"app.*id|appid|app id|steam", col, re.I)]
    if name_candidates:
        pick = name_candidates[0]
        if pick != "steam_app_id":
            log.info(f"Rilevata colonna AppID da nome: '{pick}', rinomino in 'steam_app_id'.")
            df = df.rename(columns={pick: "steam_app_id"})
    else:
        # If steam_app_id exists but is mostly non-numeric, try to find better column
        candidate = "steam_app_id" if "steam_app_id" in df.columns else None

        best_col = candidate
        best_frac = numeric_fraction(df[candidate]) if candidate else 0.0

        # Search all columns for the highest numeric fraction, but only switch
        # when the current candidate is very non-numeric (low confidence).
        for col in df.columns:
            frac = numeric_fraction(df[col])
            if candidate and best_frac < 0.2 and frac > best_frac + 0.5 and frac > 0.8:
                best_col = col
                best_frac = frac

        if best_col and candidate and best_col != "steam_app_id":
            log.info(f"Rilevata colonna AppID come '{best_col}' (numeric_fraction={best_frac:.2f}), rinomino in 'steam_app_id'.")
            df = df.rename(columns={best_col: "steam_app_id"})

    log.info(f"Dati puliti: {len(df)} righe")
    return df


def _clean_text(value) -> str | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if text in {"", "nan", "none", "none"}:
        return None
    return text


def _truncate_text(value: str | None, max_len: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return None
    return text[:max_len]


def _parse_app_id(value) -> int | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text:
        return None
    match = re.search(r"(\d+)", text)
    if not match:
        return None

    app_id = int(match.group(1))
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


def _parse_rating(value) -> float | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    value_num = float(match.group(1))
    return value_num if value_num <= 5 else round(value_num / 10, 2)


def _parse_date(value) -> str | None:
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


def _ensure_lookup(cur, table_name: str, values: list[str]) -> dict[str, int]:
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
        raw_app = row.get("steam_app_id", "")
        # If duplicate column names or pandas weirdness returned a Series,
        # pick the first non-null scalar value
        if isinstance(raw_app, pd.Series):
            non_null = raw_app.dropna()
            raw_app = non_null.iloc[0] if len(non_null) > 0 else raw_app.iloc[0]

        app_id = _parse_app_id(raw_app)
        if app_id is None:
            skipped += 1
            continue

        raw_dev = row.get("developer")
        if isinstance(raw_dev, pd.Series):
            raw_dev = raw_dev.dropna().iloc[0] if len(raw_dev.dropna()) > 0 else raw_dev.iloc[0]
        developer = _clean_text(raw_dev)

        raw_pub = row.get("publisher")
        if isinstance(raw_pub, pd.Series):
            raw_pub = raw_pub.dropna().iloc[0] if len(raw_pub.dropna()) > 0 else raw_pub.iloc[0]
        publisher = _clean_text(raw_pub)
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
