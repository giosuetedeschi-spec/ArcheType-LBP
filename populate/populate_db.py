"""Popolamento database da dataset Steam CSV/JSON."""

import os
import sys
import time
import json
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

    if p.suffix == ".csv":
        df = pd.read_csv(path)
    elif p.suffix == ".json":
        df = pd.read_json(path)
    else:
        log.error(f"Formato non supportato: {p.suffix}")
        sys.exit(1)

    log.info(f"Dataset caricato: {len(df)} righe")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Pulisce e normalizza i dati."""
    # Rimuovi duplicati
    if "steam_app_id" in df.columns:
        df = df.drop_duplicates(subset=["steam_app_id"])
    elif "appid" in df.columns:
        df = df.rename(columns={"appid": "steam_app_id"})
        df = df.drop_duplicates(subset=["steam_app_id"])

    # Normalizza nomi colonne
    column_map = {
        "name": "name",
        "title": "name",
        "release_date": "release_date",
        "release date": "release_date",
        "developer": "developer",
        "publisher": "publisher",
        "price": "price",
        "rating": "rating",
        "genres": "genres",
        "description": "description",
        "header_image": "header_image_url",
        "header_image_url": "header_image_url",
    }
    df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})

    # Rimuovi righe senza nome
    df = df.dropna(subset=["name"])

    log.info(f"Dati puliti: {len(df)} righe")
    return df


def insert_games(df: pd.DataFrame):
    """Inserisce i giochi nel database."""
    conn = get_connection()
    cur = conn.cursor()

    # Conta giochi esistenti
    cur.execute("SELECT COUNT(*) FROM games")
    existing = cur.fetchone()[0]
    log.info(f"Giochi esistenti: {existing}")

    # Prepara dati
    records = []
    for _, row in df.iterrows():
        records.append((
            int(row.get("steam_app_id", 0)),
            str(row.get("name", ""))[:255],
            str(row.get("release_date", ""))[:10] or None,
            str(row.get("developer", ""))[:255] or None,
            str(row.get("publisher", ""))[:255] or None,
            float(row.get("price", 0)) if pd.notna(row.get("price")) else 0,
            float(row.get("rating", 0)) if pd.notna(row.get("rating")) else None,
            str(row.get("genres", "")) or None,
            str(row.get("description", "")) or None,
            str(row.get("header_image_url", "")) or None,
        ))

    # Insert in batch
    sql = """
        INSERT INTO games (steam_app_id, name, release_date, developer, publisher,
                          price, rating, genres, description, header_image_url)
        VALUES %s
        ON CONFLICT (steam_app_id) DO NOTHING
    """

    total_inserted = 0
    for i in tqdm(range(0, len(records), BATCH_SIZE), desc="Inserting"):
        batch = records[i:i + BATCH_SIZE]
        execute_values(cur, sql, batch, page_size=BATCH_SIZE)
        conn.commit()
        total_inserted += len(batch)

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
