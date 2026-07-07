"""
scripts/analyze_colors.py
Dominant-color analyzer for a game's cover image: reads header_image_url
straight from the DB, downloads the image in memory, returns its average color.

Usage:
    python scripts/analyze_colors.py <appid>
"""
import io
import os
import sys

import psycopg2
import requests
from PIL import Image, ImageStat

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "archetype"),
    "user": os.getenv("DB_USER", "archetype"),
    "password": os.getenv("DB_PASSWORD", "archetype_secret"),
}


def get_header_image_url(appid: int) -> str | None:
    """Legge header_image_url per un appid dalla tabella games."""
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        cur = conn.cursor()
        cur.execute("SELECT header_image_url FROM games WHERE appid = %s", (appid,))
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def dominant_color(image_url: str) -> str:
    """Scarica l'immagine in memoria e ne calcola il colore medio come #rrggbb."""
    resp = requests.get(image_url, timeout=10)
    resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    img = img.resize((32, 32))
    r, g, b = (int(v) for v in ImageStat.Stat(img).mean)
    return f"#{r:02x}{g:02x}{b:02x}"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/analyze_colors.py <appid>")
        sys.exit(1)

    appid = int(sys.argv[1])
    url = get_header_image_url(appid)
    if not url:
        print(f"Nessun header_image_url trovato per appid {appid}")
        sys.exit(1)

    print(f"header_image_url: {url}")
    print(f"Colore dominante: {dominant_color(url)}")
