"""Seed test users and user_games for local development."""

import os
import sys
import random
import logging
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] % (message)s")
log = logging.getLogger(__name__)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "archetype"),
    "user": os.getenv("DB_USER", "archetype"),
    "password": os.getenv("DB_PASSWORD", "archetype_secret"),
}

STATUSES = ["wishlist", "playing", "finished", "abandoned"]
NUM_USERS = 5
GAMES_PER_USER = (3, 15)


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def seed_users(conn):
    """Create test users if they don't exist."""
    cur = conn.cursor()

    test_users = [
        ("gamer_alice", "alice@example.com", "password123"),
        ("gamer_bob", "bob@example.com", "password123"),
        ("gamer_carol", "carol@example.com", "password123"),
        ("gamer_dave", "dave@example.com", "password123"),
        ("gamer_eve", "eve@example.com", "password123"),
    ]

    sql = """
        INSERT INTO users (username, email, password_hash)
        VALUES %s
        ON CONFLICT (username) DO NOTHING
    """
    records = [(u, e, p) for u, e, p in test_users]
    execute_values(cur, sql, records)
    conn.commit()

    cur.execute("SELECT id, username FROM users")
    users = cur.fetchall()
    log.info(f"Users in DB: {len(users)}")
    cur.close()
    return users


def seed_user_games(conn, users):
    """Assign random games to users."""
    cur = conn.cursor()

    # Get all game IDs
    cur.execute("SELECT id FROM games")
    game_ids = [row[0] for row in cur.fetchall()]
    if not game_ids:
        log.warning("No games found. Run populate_db.py first.")
        cur.close()
        return

    total = 0
    for user_id, username in users:
        num = random.randint(*GAMES_PER_USER)
        selected = random.sample(game_ids, min(num, len(game_ids)))

        records = []
        for game_id in selected:
            status = random.choice(STATUSES)
            records.append((user_id, game_id, status))

        sql = """
            INSERT INTO user_games (user_id, game_id, status)
            VALUES %s
            ON CONFLICT (user_id, game_id) DO NOTHING
        """
        execute_values(cur, sql, records)
        conn.commit()
        total += len(records)
        log.info(f"  {username}: {len(records)} games assigned")

    log.info(f"Total user-game links created: {total}")
    cur.close()


def main():
    log.info("=== Seed Test Data ===")
    conn = get_connection()

    users = seed_users(conn)
    seed_user_games(conn, users)

    conn.close()
    log.info("=== Completato ===")


if __name__ == "__main__":
    main()
