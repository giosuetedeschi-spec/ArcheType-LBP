"""Seed test users, backlog e wishlist per sviluppo locale."""

import os
import random
import logging

import bcrypt
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

# Cost factor 10, per combaciare con l'hash bcrypt già usato per gli utenti
# seed di init.sql (vedi commento lì: "hash bcrypt generato con lo stesso
# BCryptPasswordEncoder usato dal backend"). Un cost factor diverso non
# romperebbe la verifica (bcrypt lo legge dall'hash stesso), ma tenerlo
# identico evita differenze di costo computazionale ingiustificate tra
# utenti seed creati da fonti diverse.
BCRYPT_COST_FACTOR = 10

# Stati ammessi dal CHECK constraint su backlog.status
BACKLOG_STATUSES = ["playing", "finished", "abandoned"]
BACKLOG_GAMES_PER_USER = (3, 12)
WISHLIST_GAMES_PER_USER = (2, 8)

# Servizio di foto segnaposto (Flickr, tag "cat") usato anche dalla
# registrazione reale (UserService.buildCatAvatarUrl lato backend):
# ?lock=<id> restituisce sempre la stessa foto per quell'id, quindi ogni
# utente ha un gatto distinto e stabile, senza dover gestire un elenco
# di URL a mano.
def build_cat_avatar_url(user_id: int) -> str:
    return f"https://loremflickr.com/200/200/cat?lock={user_id}"


def get_connection():
    """Apre una connessione al database, con gli stessi parametri
    (letti da variabili d'ambiente) usati dal resto degli script del
    progetto, per funzionare sia dentro Docker Compose sia in locale.

    Returns:
        psycopg2.extensions.connection: connessione aperta.
    """
    return psycopg2.connect(**DB_CONFIG)


def hash_password(plain_password: str) -> str:
    """Genera un hash bcrypt della password, compatibile con
    BCryptPasswordEncoder di Spring Security (stesso backend usato per
    verificare le password al login).

    NOTA IMPORTANTE (bug corretto qui): prima di questo fix, lo script
    scriveva la password in chiaro direttamente nella colonna `password`,
    senza alcun hashing. BCryptPasswordEncoder, trovando un valore che non
    è un hash bcrypt valido, rifiuta SEMPRE il login per quell'utente
    (log: "Encoded password does not look like BCrypt" -> BadCredentialsException),
    indipendentemente dalla password realmente digitata. Gli utenti creati
    da questo script erano quindi utilizzabili per popolare dati (backlog,
    wishlist) ma non per testare il login reale end-to-end.

    Args:
        plain_password: password in chiaro da hashare.

    Returns:
        str: hash bcrypt (formato "$2b$10$...", 60 caratteri), pronto per
        essere salvato nella colonna `password` e verificato dal backend.
    """
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_COST_FACTOR))
    return hashed.decode("utf-8")


def seed_users(conn):
    """Crea utenti di test se non esistono già (ON CONFLICT DO NOTHING:
    se un utente con questo username esiste già, es. da init.sql, questo
    insert non lo tocca).

    Le password vengono hashate con bcrypt prima dell'insert (vedi
    hash_password): la password in chiaro "password123" resta identica
    per tutti gli utenti di test, così da poterla usare per login manuali
    durante lo sviluppo, ma il valore salvato nel database è sempre un
    hash valido, mai testo in chiaro.

    Args:
        conn: connessione al database.

    Returns:
        list[tuple[int, str]]: coppie (id, username) di tutti gli utenti
        presenti nel database dopo l'insert (inclusi quelli preesistenti).
    """
    cur = conn.cursor()

    test_users = [
        ("gamer_alice", "alice@example.com", "password123"),
        ("gamer_bob", "bob@example.com", "password123"),
        ("gamer_carlo", "carlo@example.com", "password123"),
        ("gamer_diana", "diana@example.com", "password123"),
        ("gamer_marco", "marco@example.com", "password123"),
        ("gamer_sara", "sara@example.com", "password123"),
        ("gamer_luca", "luca@example.com", "password123"),
        ("gamer_elena", "elena@example.com", "password123"),
        ("gamer_paolo", "paolo@example.com", "password123"),
        ("gamer_giulia", "giulia@example.com", "password123"),
        ("gamer_matteo", "matteo@example.com", "password123"),
        ("gamer_valentina", "valentina@example.com", "password123"),
    ]

    sql = """
        INSERT INTO users (username, email, password)
        VALUES %s
        ON CONFLICT (username) DO NOTHING
    """
    records = [(u, e, hash_password(p)) for u, e, p in test_users]
    execute_values(cur, sql, records)
    conn.commit()

    cur.execute("SELECT id, username FROM users")
    users = cur.fetchall()
    log.info(f"Users in DB: {len(users)}")

    # Avatar segnaposto per chi non ne ha ancora uno (utenti appena creati
    # qui sopra, o preesistenti da un run parziale precedente) — stessa
    # logica della registrazione reale, per non lasciare mai un utente
    # senza foto dopo un re-seed da zero.
    cur.execute("SELECT id FROM users WHERE avatar_url IS NULL OR avatar_url = ''")
    missing_avatar_ids = [row[0] for row in cur.fetchall()]
    for user_id in missing_avatar_ids:
        cur.execute(
            "UPDATE users SET avatar_url = %s WHERE id = %s",
            (build_cat_avatar_url(user_id), user_id),
        )
    conn.commit()
    if missing_avatar_ids:
        log.info(f"Avatar assegnato a {len(missing_avatar_ids)} utenti senza foto")

    cur.close()
    return users


def seed_backlog(conn, users, game_ids):
    """Assegna giochi casuali al backlog di ciascun utente, con stato e
    tempo di gioco casuali (tempo più basso per lo stato "abandoned",
    per coerenza narrativa dei dati demo).

    Args:
        conn: connessione al database.
        users: coppie (id, username) per cui generare voci di backlog.
        game_ids: id dei giochi disponibili tra cui scegliere casualmente.
    """
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

    Args:
        conn: connessione al database.
        users: coppie (id, username) per cui generare voci di wishlist.
        game_ids: id dei giochi disponibili tra cui scegliere casualmente.
        exclude_per_user: mappa user_id -> set di game_id già nel backlog
            di quell'utente, da escludere dalla selezione per la wishlist.
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
    """Ritorna, per ciascun utente, l'insieme dei game_id già presenti
    nel suo backlog — usato da seed_wishlist per evitare sovrapposizioni.

    Args:
        conn: connessione al database.
        users: coppie (id, username) di cui recuperare il backlog.

    Returns:
        dict[int, set[int]]: mappa user_id -> insieme di game_id nel
        backlog di quell'utente.
    """
    cur = conn.cursor()
    result = {}
    for user_id, _ in users:
        cur.execute("SELECT game_id FROM backlog WHERE user_id = %s", (user_id,))
        result[user_id] = {row[0] for row in cur.fetchall()}
    cur.close()
    return result


def main():
    """Entry point: crea utenti di test (con password correttamente
    hashate), poi popola backlog e wishlist con giochi casuali per
    ciascuno. Richiede che games.py sia già stato popolato (populate_db.py),
    altrimenti esce senza fare nulla oltre alla creazione utenti.
    """
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
