"""Seed test users, backlog e wishlist per sviluppo locale."""

import os
import random
import logging

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

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

# Stati ammessi dal CHECK constraint su backlog.status
BACKLOG_STATUSES = ["playing", "finished", "abandoned"]
NUM_USERS = 5
BACKLOG_GAMES_PER_USER = (3, 12)
WISHLIST_GAMES_PER_USER = (2, 8)


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def seed_users(conn):
    """Crea utenti di test se non esistono già."""
    cur = conn.cursor()

    test_users = [
        ("gamer_alice", "alice@example.com", "password123"),
        ("gamer_bob", "bob@example.com", "password123"),
        ("gamer_carol", "carol@example.com", "password123"),
        ("gamer_dave", "dave@example.com", "password123"),
        ("gamer_eve", "eve@example.com", "password123"),
    ]

    sql = """
        INSERT INTO users (username, email, password)
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


def seed_backlog(conn, users, game_ids):
    """Assegna giochi casuali al backlog di ciascun utente."""
    cur = conn.cursor()

    total = 0
    for user_id, username in users:
        num = random.randint(*BACKLOG_GAMES_PER_USER)
        selected = random.sample(game_ids, min(num, len(game_ids)))

        records = []
        for game_id in selected:
            status = random.choice(BACKLOG_STATUSES)
            play_time = random.randint(0, 6000) if status != "abandoned" else random.randint(0, 300)
            records.append((user_id, game_id, status, play_time))

        sql = """
            INSERT INTO backlog (user_id, game_id, status, play_time_min)
            VALUES %s
            ON CONFLICT (user_id, game_id) DO NOTHING
        """
        execute_values(cur, sql, records)
        conn.commit()
        total += len(records)
        log.info(f"  {username}: {len(records)} giochi nel backlog")

    log.info(f"Totale righe inserite in backlog: {total}")
    cur.close()


def seed_wishlist(conn, users, game_ids, exclude_per_user):
    """Aggiunge giochi casuali alla wishlist di ciascun utente.

    Evita di duplicare giochi già presenti nel backlog dello stesso utente
    (non obbligatorio a livello di DB, ma più realistico).
    """
    cur = conn.cursor()

    total = 0
    for user_id, username in users:
        already_in_backlog = exclude_per_user.get(user_id, set())
        available = [g for g in game_ids if g not in already_in_backlog]

        num = random.randint(*WISHLIST_GAMES_PER_USER)
        selected = random.sample(available, min(num, len(available)))

        records = []
        for game_id in selected:
            priority = random.choice([0, 1, 2])
            records.append((user_id, game_id, priority))

        sql = """
            INSERT INTO wishlist (user_id, game_id, priority)
            VALUES %s
            ON CONFLICT (user_id, game_id) DO NOTHING
        """
        execute_values(cur, sql, records)
        conn.commit()
        total += len(records)
        log.info(f"  {username}: {len(records)} giochi in wishlist")

    log.info(f"Totale righe inserite in wishlist: {total}")
    cur.close()


def get_backlog_by_user(conn, users):
    """Ritorna {user_id: set(game_id)} per i giochi già nel backlog di ciascun utente."""
    cur = conn.cursor()
    result = {}
    for user_id, _ in users:
        cur.execute("SELECT game_id FROM backlog WHERE user_id = %s", (user_id,))
        result[user_id] = {row[0] for row in cur.fetchall()}
    cur.close()
    return result


def main():
    log.info("=== Seed Test Data ===")
    conn = get_connection()

    users = seed_users(conn)

    cur = conn.cursor()
    cur.execute("SELECT id FROM games")
    game_ids = [row[0] for row in cur.fetchall()]
    cur.close()

    if not game_ids:
        log.warning("Nessun gioco trovato. Esegui prima populate_db.py.")
        conn.close()
        return

    seed_backlog(conn, users, game_ids)

    exclude_per_user = get_backlog_by_user(conn, users)
    seed_wishlist(conn, users, game_ids, exclude_per_user)

    conn.close()
    log.info("=== Completato ===")


if __name__ == "__main__":
    main()
