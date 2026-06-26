"""
scripts/load_steam_data.py

Fetches Steam games, analyzes cover image dominant colors,
and loads everything into the PostgreSQL database.

Requires: requests, Pillow, psycopg2-binary (pip install -r requirements.txt)
Requires: DB connection parameters (env vars or .env)

Usage:
    python scripts/load_steam_data.py --mode seed   # Load new games
    python scripts/load_steam_data.py --mode update # Refresh existing data
    python scripts/load_steam_data  # Re-analyze colors only
"""
import os
import io
import sys
import time
import json
import logging
import argparse
from pathlib import Path

import requests
from PIL import Image
from psycopg2 import connect, sql

# Add scripts/ to path for shared module
sys.path.insert(0, str(Path(__file__).parent))
from steam_api import fetch_app_details, app_to_db_row, fetch_top_free_games

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("steam_loader")

# ── DB config ────────────────────────────────────────────────────────────────
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://archetype:archetype_secret@localhost:5432/archetype",
)
# ponytail: single connection string, no ORM, raw SQL

COLOR_KEYWORDS = {
    "red": (255, 0, 0),
    "green": (0, 200, 0),
    "blue": (0, 80, 200),
    "yellow": (255, 200, 0),
    "purple": (160, 50, 200),
    "orange": (255, 120, 0),
    "pink": (255, 100, 180),
    "cyan": (0, 200, 200),
    "brown": (139, 69, 19),
    "white": (255, 255, 255),
    "black": (0, 0, 0),
}

COLOR_NAMES = list(COLOR_KEYWORDS.keys())


def download_image_colors(image_url: str) -> str | None:
    """Fetch image and calcola i 3 colori dominanti (media bucket 32x32)."""
    try:
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
        # ponytail: downsample to 32x32 for fast average color
        img = img.resize((32, 32))
        pixels = list(img.getdata())
        r = sum(p[0] for p in pixels) // len(pixels)
        g = sum(p[1] for p in pixels) // len(pixels)
        b = sum(p[2] for p in pixels) // len(pixels)
        return f"{r // 32},{g // 32},{b // 32}"
    except Exception as e:
        log.warning(f"color analysis failed: {e}")
        return None


# ── DB helpers ───────────────────────────────────────────────────────────────
def db_connect():
    return connect(DB_URL)


def upsert_game(cur, row: dict, analyze_color: bool = False):
    """INSERT ON CONFLICT UPDATE for games table."""
    cur.execute(
        """
        INSERT INTO games (steam_appid, name, short_description, header_image,
                          background_image, price, release_date, genres, developer,
                          publisher, rating, recommendations, platforms_windows,
                          platforms_mac, platforms_linux, dominant_color)
        VALUES (%(steam_appid)s, %(name)s, %(short_description)s, %(header_image)s,
                %(background_image)s, %(price)s, %(release_date)s, %(genres)s,
                %(developer)s, %(publisher)s, %(rating)s, %(recommendations)s,
                %(platforms_windows)s, %(platforms_mac)s, %(platforms_linux)s,
                %(dominant_color)s)
        ON CONFLICT (steam_appid) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            rating = EXCLUDED.rating,
            recommendations = EXCLUDED.recommendations
        """,
        row,
    )


# ── Mode: seed ───────────────────────────────────────────────────────────────
def mode_seed(limit: int = 100):
    log.info(f"Seeding {limit} top Steam games...")
    top = fetch_top_free_games(count=limit)
    inserted = skipped = errored = 0

    with db_connect() as conn:
        with conn.cursor() as cur:
            for i, game_info in enumerate(top):
                app_id = game_info["app_id"]
                log.info(f"[{i+1}/{limit}] Fetching {game_info['name']} ({app_id})...")
                try:
                    details = fetch_app_details(app_id, lang="en")
                    if not details or details.get("type") != "game":
                        skipped += 1
                        continue

                    row = app_to_db_row(details)
                    row["dominant_color"] = None
                    if details.get("header_image"):
                        row["dominant_color"] = download_image_colors(details["header_image"])
                        time.sleep(0.2)  # rate-limit

                    upsert_game(cur, row)
                    inserted += 1
                except Exception as e:
                    log.error(f"Error on {app_id}: {e}")
                    errored += 1

                conn.commit()

    log.info(f"Done. Inserted: {inserted}, Skipped: {skipped}, Errors: {errored}")


#  update ─────────────────────────────────────────────────────────────
def mode_update():
    """Refresh data for existing games."""
    with db_connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT steam_appid FROM games")
            app_ids = [r[0] for r in cur.fetchall()]

    updated = errored = 0
    for i, app_id in enumerate(app_ids):
        log.info(f"[{i+1}/{len(app_ids)}] Updating {app_id}...")
        try:
            details = fetch_app_details(app_id)
            if not details:
                continue
            row = app_to_db_row(details)

            with db_connect() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE games SET
                            name = %(name)s, price = %(price)s,
                            rating = %(rating)s, recommendations = %(recommendations)s
                        WHERE steam_appid = %(steam_appid)s
                        """,
                        row,
                    )
                    conn.commit()
            updated += 1
            time.sleep(0.15)
        except Exception as e:
            log.error(f"Error on {app_id}: {e}")
            errored += 1

    log.info(f"Done. Updated: {updated}, Errors: {errored}")


# ── Mode: color ──────────────────────────────────────────────────────────────
def mode_color():
    """Re-analyze dominant colors for games that have images."""
    with db_connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT steam_appid, header_image FROM games WHERE dominant_color IS NULL")
            rows = cur.fetchall()

    updated = errored = 0
    for i, (app_id, header_image) in enumerate(rows):
        if not header_image:
            continue
        log.info(f"[{i+1}{len(rows)}] Analyzing color for {app_id}...")
        try:
            color = download_image_colors(header_image)
            if color:
                with db_connect() as conn:
                    with conn.cursor() as cur:
                        cur.execute("UPDATE games SET dominant_color = %s WHERE steam_appid = %s", (color, app_id))
                        conn.commit()
                updated += 1
            time.sleep(0.1)
        except Exception as e:
            log.error(f"Error on {app_id}: {e}")
            errored += 1

    log.info(f"Done. Colors updated: {updated}, Errors: {errored}")


# ── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load Steam games data into DB")
    parser.add_argument("--mode", choices=["seed", "update", "color"], default="seed")
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()

    if args.mode == "seed":
        mode_seed(args.limit)
    elif args.mode == "update":
        mode_update()
    elif args.mode == "color":
        mode_color()
