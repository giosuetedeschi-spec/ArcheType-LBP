"""Popolamento database da dataset Steam CSV/JSON.

Legge il dataset Steam (CSV o JSON), lo pulisce/normalizza e lo inserisce nel
database PostgreSQL: giochi, developer/publisher (lookup), generi e categorie
(entrambe relazioni molti-a-molti, tramite genres + game_genres e
categories + game_categories rispettivamente).

Fa parte dei servizi avviati di default da "docker compose up": si auto-salta
(exit rapido) se il database risulta già popolato, così ogni avvio successivo
resta veloce. Per forzare un nuovo giro (es. backfill di colonne aggiunte
dopo il primo import) imposta FORCE_REPOPULATE=true:
    docker compose run --rm -e FORCE_REPOPULATE=true populate
"""

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

# init.sql inserisce esattamente 5 giochi seed: superata questa soglia il
# dataset reale è già stato importato, quindi un successivo avvio automatico
# (docker compose up) può saltare l'intero giro invece di rileggere ogni
# volta un CSV da ~389 MB.
SEED_GAME_COUNT_THRESHOLD = 10
FORCE_REPOPULATE = os.getenv("FORCE_REPOPULATE", "false").strip().lower() in {"1", "true", "yes"}


def get_connection():
    """Apre una nuova connessione al database PostgreSQL.

    I parametri di connessione vengono letti da DB_CONFIG, popolato a sua
    volta dalle variabili d'ambiente (DB_HOST, DB_PORT, DB_NAME, DB_USER,
    DB_PASSWORD), così lo stesso script funziona sia dentro Docker Compose
    (host "db") sia in locale (default "localhost") senza modifiche.

    Returns:
        psycopg2.extensions.connection: connessione aperta e pronta all'uso.
        Il chiamante è responsabile di chiuderla (conn.close()) a fine lavoro.
    """
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
    """Carica il dataset Steam da file (CSV o JSON) in un DataFrame pandas.

    Punto di ingresso unico per il caricamento: dispatcha al parser corretto
    in base all'estensione del file e uniforma i nomi di colonna (minuscoli,
    "appid" rinominato in "steam_app_id") indipendentemente dal formato.

    Args:
        path: percorso del file dataset (.csv o .json). Se non esiste,
            l'esecuzione termina con sys.exit(1) dopo aver loggato l'errore.

    Returns:
        pd.DataFrame: dataset caricato, con nomi di colonna normalizzati in
        minuscolo. Per i CSV, l'header malformato viene corretto
        automaticamente se necessario (vedi _load_csv_with_corrected_header).
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
    """Legge il CSV Steam correggendo l'header malformato, se rilevato.

    Usa il modulo csv standard (non pandas.read_csv) per leggere header e
    righe separatamente: questo permette di contare con certezza il numero
    di campi per riga e decidere se applicare _CORRECTED_CSV_HEADER, invece
    di lasciare che pandas indovini l'allineamento (comportamento fragile
    quando header e dati hanno un numero di colonne diverso).

    La correzione è puramente empirica: se il numero di campi nelle righe
    dati combacia con la lunghezza di _CORRECTED_CSV_HEADER (40), quell'header
    viene usato al posto di quello dichiarato nel file (che ne ha solo 39).
    Se non combacia, si usa l'header originale del file così com'è, accettando
    il rischio di disallineamento (con relativo warning nei log) — questo
    rende la funzione tollerante anche verso futuri CSV già corretti a monte
    o con struttura diversa, senza doverla modificare.

    Args:
        path: percorso del file CSV da leggere.

    Returns:
        pd.DataFrame: righe con lunghezza coerente con l'header scelto
        (le righe con un numero di campi anomalo vengono scartate, non
        troncate/paddate — vedi log "Righe scartate per numero di campi
        anomalo"). Nomi di colonna normalizzati in minuscolo, "appid"
        rinominato in "steam_app_id".
    """
    import csv as csv_module

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv_module.reader(f)
        declared_header = next(reader)
        rows = list(reader)

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
    """Normalizza i nomi di colonna e scarta le righe senza un nome valido.

    Applica una mappa di alias (column_map) per far confluire varianti di
    nome colonna viste in dataset diversi (es. "developer"/"developers",
    "user score"/"rating") verso un unico set di nomi canonici usati dal
    resto della pipeline. Righe con "name" mancante, vuoto o solo spazi
    vengono scartate: sono record senza informazione utile da mostrare
    all'utente finale.

    Args:
        df: DataFrame grezzo così come restituito da load_dataset(), con
            nomi di colonna già in minuscolo.

    Returns:
        pd.DataFrame: dataset con colonne rinominate secondo column_map e
        senza righe a "name" vuoto/mancante.

    Raises:
        KeyError: se dopo la normalizzazione non esiste alcuna colonna
            "name" nel dataset (dataset con struttura del tutto inattesa).
    """
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
        "required age": "required_age",
        "required_age": "required_age",
    }
    # NOTA: "required_age" qui è solo un nome di colonna intermedio (il
    # valore grezzo del CSV, es. 17/18); insert_games() lo riduce subito a
    # un booleano "mature" (>= 18) con _parse_mature(), vedi commento lì.
    df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})

    if "name" not in df.columns:
        raise KeyError("Nel dataset non è presente la colonna 'name'.")

    df = df.dropna(subset=["name"])
    df["name"] = df["name"].astype(str).str.strip()
    df = df[df["name"] != ""]

    log.info(f"Dati puliti: {len(df)} righe")
    return df


def _clean_text(value):
    """Normalizza un valore di testo generico, filtrando i "vuoti impliciti".

    Utility condivisa da più parser: tratta NaN/None e le stringhe letterali
    "nan"/"none" (residuo comune quando pandas converte valori mancanti in
    stringa) come assenza di valore, restituendo None in modo uniforme.

    Args:
        value: valore grezzo proveniente da una cella del DataFrame (può
            essere NaN, None, stringa, numero: pandas non garantisce un
            tipo fisso per colonne con valori misti/mancanti).

    Returns:
        str | None: testo ripulito (spazi ai bordi rimossi), oppure None se
        il valore è mancante o rappresenta un vuoto implicito.
    """
    if pd.isna(value):
        return None
    text = str(value).strip()
    if text in {"", "nan", "none"}:
        return None
    return text


def _truncate_text(value, max_len: int):
    """Come _clean_text, ma tronca il risultato a una lunghezza massima.

    Serve per rispettare i vincoli di lunghezza delle colonne VARCHAR nel
    database (es. name VARCHAR(255)): senza questo troncamento, un valore
    più lungo del previsto farebbe fallire l'INSERT con un errore SQL invece
    di essere salvato (troncato) in modo controllato.

    Args:
        value: valore grezzo da normalizzare (stesso dominio di _clean_text).
        max_len: numero massimo di caratteri consentiti nel risultato.

    Returns:
        str | None: testo ripulito e troncato a max_len caratteri, oppure
        None se il valore è mancante/vuoto.
    """
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return None
    return text[:max_len]


def _parse_app_id(value):
    """Valida e converte l'AppID Steam in un intero utilizzabile come chiave.

    L'AppID è la chiave con cui il database identifica univocamente un
    gioco (colonna "appid" UNIQUE): un valore non numerico o fuori dal range
    di un INTEGER Postgres (max 2^31-1) renderebbe l'INSERT inutilizzabile
    o lo farebbe fallire, quindi viene scartato a monte (None) invece di
    propagare un valore inservibile fino alla query.

    Args:
        value: valore grezzo dalla colonna AppID/steam_app_id del dataset.

    Returns:
        int | None: l'AppID come intero, oppure None se il valore è
        mancante, non è una sequenza di sole cifre, oppure eccede il range
        valido per una colonna INTEGER (0 .. 2_147_483_647).
    """
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
    """Estrae il prezzo numerico da un campo che può contenere testo libero.

    Il dataset Steam rappresenta i giochi gratuiti in modi non uniformi
    (numero 0, stringa "Free", "Free to Play", campo vuoto): tutti questi
    casi vengono normalizzati a 0.0 invece di propagare valori testuali in
    una colonna DECIMAL del database.

    Args:
        value: valore grezzo dalla colonna prezzo (numero, stringa, o NaN).

    Returns:
        float: prezzo come numero decimale. 0.0 se il valore è mancante,
        rappresenta un gioco gratuito, o non contiene alcun numero
        riconoscibile.
    """
    if pd.isna(value):
        return 0.0
    text = str(value).strip()
    if not text or text.lower() in {"free", "free to play", "free-to-play", "nan", "none"}:
        return 0.0
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    return float(match.group(1)) if match else 0.0


def _parse_rating(value):
    """Estrae e normalizza il rating su una scala 0-9.99 (vincolo colonna DB).

    Il dataset può esprimere il voto su scale diverse (es. 0-5 stelle oppure
    0-100 come "User score" percentuale): questa funzione riconosce la scala
    in base al valore letto (>5 implica una scala più ampia, tipicamente
    0-100) e la riporta a un intervallo unico compatibile con la colonna
    `rating DECIMAL(3,2)` del database, il cui massimo rappresentabile è
    9.99 — da cui il cap finale con min(result, 9.99).

    Args:
        value: valore grezzo dalla colonna rating/user score.

    Returns:
        float | None: rating normalizzato in [0, 9.99], oppure None se il
        valore è mancante o non contiene alcun numero riconoscibile.
    """
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
    """Normalizza una data di rilascio in formato ISO (YYYY-MM-DD).

    Il dataset Steam esprime le date in formati non uniformi: già in ISO,
    con "/" al posto di "-", o a volte solo l'anno. Questa funzione tenta,
    in ordine, i pattern più specifici (data completa) prima di ripiegare su
    quelli più permissivi (solo anno, o un anno trovato ovunque nel testo),
    assumendo 1° gennaio quando manca il giorno/mese esatto.

    Args:
        value: valore grezzo dalla colonna data di rilascio.

    Returns:
        str | None: data in formato "YYYY-MM-DD", oppure None se il valore
        è mancante o non contiene alcun anno riconoscibile.
    """
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


def _parse_genres(value) -> list:
    """Estrae la lista di generi da un campo CSV tipo "Action,RPG,Indie".

    Il dataset Steam rappresenta i generi come un'unica stringa con valori
    separati da virgola. Questa funzione è il pezzo mancante scoperto
    durante il fix: il dato arrivava già pulito fino a clean_data(), ma
    prima di questo fix non veniva mai estratto/inserito nel database
    (colonna "genres" scartata silenziosamente in insert_games).

    Args:
        value: valore grezzo dalla colonna genres (es. "Action,RPG,Indie",
            stringa vuota, o NaN se il campo manca per quella riga).

    Returns:
        list[str]: nomi di genere puliti (spazi ai bordi rimossi), senza
        duplicati e nell'ordine di prima apparizione nella riga originale.
        Lista vuota se il campo è mancante o vuoto.
    """
    if pd.isna(value):
        return []
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none"}:
        return []
    seen = set()
    result = []
    for part in text.split(","):
        name = part.strip()
        if name and name not in seen:
            seen.add(name)
            result.append(name)
    return result


def _parse_bool(value) -> bool:
    """Normalizza un valore di colonna booleana (es. Windows/Mac/Linux) in bool.

    Il dataset CSV viene letto con il modulo csv standard (non pandas), quindi
    ogni valore arriva come stringa letterale ("True"/"False"), mai come bool
    Python; il dataset JSON invece può già contenere veri booleani. Questa
    funzione gestisce entrambi i casi in modo uniforme.

    Args:
        value: valore grezzo dalla cella (bool, stringa, o NaN/None).

    Returns:
        bool: True solo se il valore rappresenta esplicitamente vero
        ("true"/"1"/"yes", case-insensitive, o il bool True); False in ogni
        altro caso, incluso mancante.
    """
    if pd.isna(value):
        return False
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"true", "1", "yes"}


ADULT_GENRE_NAMES = {"Nudity", "Sexual Content", "Gore", "Violent"}


def _parse_mature(required_age_value, genres: list, name: str) -> bool:
    """Deriva il flag unico "contenuto sensibile/per adulti" da tre segnali del dataset.

    Nessuno dei tre segnali da solo copre abbastanza giochi per essere
    affidabile, quindi si combinano in un solo booleano (OR):

    1. "Required age" Steam >= 18 (il campo age-rating vero e proprio, ma
       presente per meno dell'1% dei giochi).
    2. Genere "Nudity", "Sexual Content", "Gore" o "Violent" (issue #87,
       poi esteso a Gore/Violent su richiesta esplicita — 257 giochi Gore,
       414 Violent nel dataset reale, ~569 dei quali non ancora coperti
       dagli altri due segnali).
    3. Il nome del gioco contiene "hentai" (case-insensitive). Verificato sul
       dataset reale: 807 giochi hanno "hentai" nel nome, di cui solo 9 sono
       già coperti dai due segnali sopra — gli altri 798 sfuggirebbero del
       tutto altrimenti. Nessun segnale aggiuntivo utile trovato nella
       colonna "Tags" del CSV (mai importata finora): dove valorizzata,
       contiene solo "Nudity"/"Sexual Content" con gli stessi identici
       conteggi già presenti in "Genres", nessun tag "Hentai"/"NSFW" a sé.
       Euristica sul nome scelta perché ad alta precisione (un titolo con
       "hentai" esplicito è quasi sempre davvero contenuto per adulti) — non
       si usano altre parole più ambigue (es. "adult", "mature") per evitare
       falsi positivi su titoli legittimi.

    Args:
        required_age_value: valore grezzo dalla colonna required_age
            (numero, stringa, o NaN/None).
        genres: lista di nomi di genere già estratta per questa riga (vedi
            _parse_genres) — evita un secondo parsing del campo CSV.
        name: nome del gioco già pulito (vedi _clean_text).

    Returns:
        bool: True se almeno uno dei tre segnali indica contenuto per
        adulti, False altrimenti.
    """
    if not pd.isna(required_age_value):
        text = str(required_age_value).strip()
        if text and text.lower() not in {"nan", "none"}:
            match = re.search(r"(\d+)", text)
            if match and int(match.group(1)) >= 18:
                return True

    if genres and ADULT_GENRE_NAMES.intersection(genres):
        return True

    if name and "hentai" in name.lower():
        return True

    return False


def _ensure_lookup(cur, table_name: str, values: list) -> dict:
    """Upsert di valori unici in una tabella lookup (id, name) e ritorna la mappa.

    Funzione generica riusata per popolare sia "developers"/"publishers"
    (schema preesistente) sia "genres" (aggiunto in questo fix): tutte e tre
    le tabelle condividono la stessa forma (id BIGSERIAL, name VARCHAR
    UNIQUE), quindi la stessa logica di upsert vale per tutte senza
    duplicare codice. L'operazione è idempotente: ON CONFLICT (name) DO
    NOTHING permette di rilanciare lo script più volte senza errori né
    righe duplicate.

    Args:
        cur: cursore psycopg2 su una connessione già aperta.
        table_name: nome della tabella lookup su cui operare (deve avere
            colonne "id" e "name UNIQUE").
        values: lista di stringhe (anche con duplicati/vuoti misti) da cui
            derivare i valori unici da inserire.

    Returns:
        dict[str, int]: mappa nome -> id, per tutti i valori richiesti che
        risultano presenti in tabella dopo l'upsert (inclusi quelli già
        esistenti da esecuzioni precedenti). Dizionario vuoto se `values`
        non contiene alcun valore utilizzabile.
    """
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


def _ensure_os_columns(cur) -> None:
    """Aggiunge a "games" le colonne windows/mac/linux/mature se mancanti.

    init.sql viene eseguito da Postgres solo alla creazione del volume dati:
    su un database già esistente (creato prima dell'introduzione di queste
    colonne) lo schema non si aggiorna da solo. Questo ALTER TABLE
    idempotente (IF NOT EXISTS) permette di rilanciare semplicemente questo
    script per portare lo schema a livello, senza comandi SQL manuali. Se le
    colonne esistono già (database creato dopo l'introduzione di init.sql
    aggiornato, o script già rilanciato in precedenza), non ha alcun effetto.

    Include anche il DROP di "required_age": una versione precedente di
    questo script teneva l'età numerica esatta in una colonna a parte, poi
    sostituita dal solo booleano "mature" (>= 18) perché il valore
    granulare non serviva a nessuna feature reale.

    Args:
        cur: cursore psycopg2 su una connessione già aperta.

    Returns:
        None.
    """
    cur.execute("""
        ALTER TABLE games
          ADD COLUMN IF NOT EXISTS windows BOOLEAN NOT NULL DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS mac BOOLEAN NOT NULL DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS linux BOOLEAN NOT NULL DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS mature BOOLEAN NOT NULL DEFAULT FALSE,
          DROP COLUMN IF EXISTS required_age
    """)


def insert_games(df: pd.DataFrame) -> None:
    """Inserisce i giochi e le relazioni genere/categoria (molti-a-molti) nel database.

    Pipeline in tre fasi:
      1. Parsing riga per riga: valida l'AppID (scarta righe non valide),
         raccoglie i nomi di developer/publisher/genere/categoria per il
         lookup batch, e prepara i valori normalizzati per l'INSERT.
      2. Upsert dei lookup (developers, publishers, genres, categories) via
         _ensure_lookup, poi INSERT batch dei giochi in "games" con
         ON CONFLICT (appid) DO NOTHING (idempotente).
      3. Collegamento gioco-genere e gioco-categoria: recupera la mappa
         appid -> id interno del DB (necessaria perché ON CONFLICT DO
         NOTHING non restituisce gli id delle righe, incluse quelle già
         esistenti), costruisce le coppie (game_id, genre_id) e
         (game_id, category_id) e le inserisce rispettivamente in
         "game_genres" e "game_categories" con ON CONFLICT DO NOTHING.

    Questa terza fase è il cuore del fix: prima della sua introduzione, i
    campi "genres"/"categories" venivano raccolti durante il parsing ma mai
    scritti in alcuna tabella — arrivavano puliti fino a un passo dalla fine
    e venivano scartati. Risultato verificato dopo il fix (dataset completo,
    123k giochi): 33 generi distinti (329.320 associazioni gioco-genere) e
    59 categorie distinte (510.673 associazioni gioco-categoria, dopo aver
    unificato i doppioni di naming "Singleplayer"/"Single-player" e
    "Multiplayer"/"Multi-player" tra seed manuale e dataset reale — vedi
    db/init.sql).

    Args:
        df: DataFrame già pulito da clean_data(), con le colonne
            "steam_app_id", "name", "release_date", "developer",
            "publisher", "price", "rating", "description",
            "header_image_url", "genres", "categories", "windows", "mac",
            "linux", "required_age" (quest'ultima ridotta al booleano
            "mature" — vedi _parse_mature) (quelle assenti
            vengono trattate come mancanti riga per riga, senza sollevare
            errori).

    Returns:
        None. Logga il totale giochi e associazioni genere/categoria
        presenti in database a fine esecuzione, per verifica rapida via log.
    """
    conn = get_connection()
    cur = conn.cursor()

    _ensure_os_columns(cur)
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM games")
    existing = cur.fetchone()[0]
    log.info(f"Giochi esistenti: {existing}")

    parsed_rows = []
    developer_names = []
    publisher_names = []
    all_genre_names = []
    all_category_names = []
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

        name = _clean_text(row.get("name")) or ""

        genres = _parse_genres(row.get("genres"))
        all_genre_names.extend(genres)

        # Stessa struttura comma-separated dei generi (es. "Co-op,Single-player"),
        # quindi si riusa lo stesso parser invece di duplicarne la logica.
        categories = _parse_genres(row.get("categories"))
        all_category_names.extend(categories)

        parsed_rows.append({
            "appid": app_id,
            "name": name,
            "release_date": _parse_date(row.get("release_date")),
            "developer": developer,
            "publisher": publisher,
            "price": _parse_price(row.get("price")),
            "rating": _parse_rating(row.get("rating")),
            "description": _clean_text(row.get("description")),
            "header_image_url": _clean_text(row.get("header_image_url")),
            "genres": genres,
            "categories": categories,
            "windows": _parse_bool(row.get("windows")),
            "mac": _parse_bool(row.get("mac")),
            "linux": _parse_bool(row.get("linux")),
            "mature": _parse_mature(row.get("required_age"), genres, name),
        })

    if skipped:
        log.info(f"Record saltati per AppID non valido: {skipped}")

    developer_map = _ensure_lookup(cur, "developers", developer_names)
    publisher_map = _ensure_lookup(cur, "publishers", publisher_names)
    genre_map = _ensure_lookup(cur, "genres", all_genre_names)
    category_map = _ensure_lookup(cur, "categories", all_category_names)
    log.info(f"Generi distinti trovati nel dataset: {len(genre_map)}")
    log.info(f"Categorie distinte trovate nel dataset: {len(category_map)}")

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
            item["windows"],
            item["mac"],
            item["linux"],
            item["mature"],
        ))

    # Su conflitto (gioco già esistente) si aggiornano solo windows/mac/linux/
    # mature: permette di rilanciare lo script per fare il backfill di
    # questi campi su un database già popolato (es. dopo l'aggiunta delle
    # colonne via ALTER TABLE) senza toccare gli altri campi né duplicare righe.
    sql = """
        INSERT INTO games (appid, name, release_date, developer_id, publisher_id,
                          price, rating, description, header_image_url,
                          windows, mac, linux, mature)
        VALUES %s
        ON CONFLICT (appid) DO UPDATE SET
            windows = EXCLUDED.windows,
            mac = EXCLUDED.mac,
            linux = EXCLUDED.linux,
            mature = EXCLUDED.mature
    """

    for i in tqdm(range(0, len(game_records), BATCH_SIZE), desc="Inserting"):
        batch = game_records[i:i + BATCH_SIZE]
        execute_values(cur, sql, batch, page_size=BATCH_SIZE)
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM games")
    total = cur.fetchone()[0]
    log.info(f"Insert completati. Totale giochi: {total}")

    # --- Popolamento relazione game_genres (molti-a-molti) ---
    # I giochi sono già stati inseriti (o esistevano già per ON CONFLICT).
    # Serve mappare appid -> id interno del DB per costruire le coppie
    # (game_id, genre_id) da inserire nella tabella ponte: ON CONFLICT DO
    # NOTHING sull'INSERT precedente non restituisce gli id, quindi vanno
    # recuperati con una SELECT esplicita (a blocchi, per non superare
    # eventuali limiti di query su liste molto lunghe di AppID).
    all_appids = [item["appid"] for item in parsed_rows]
    appid_to_gameid = {}
    for i in range(0, len(all_appids), BATCH_SIZE):
        chunk = all_appids[i:i + BATCH_SIZE]
        cur.execute("SELECT id, appid FROM games WHERE appid = ANY(%s)", [chunk])
        for game_id, appid in cur.fetchall():
            appid_to_gameid[appid] = int(game_id)

    pairs = set()
    for item in parsed_rows:
        game_id = appid_to_gameid.get(item["appid"])
        if game_id is None:
            continue
        for genre_name in item["genres"]:
            genre_key = _truncate_text(genre_name, 255)
            genre_id = genre_map.get(genre_key)
            if genre_id is not None:
                pairs.add((game_id, genre_id))

    pairs = list(pairs)
    log.info(f"Associazioni gioco-genere da inserire: {len(pairs)}")

    genre_sql = """
        INSERT INTO game_genres (game_id, genre_id)
        VALUES %s
        ON CONFLICT (game_id, genre_id) DO NOTHING
    """
    for i in tqdm(range(0, len(pairs), BATCH_SIZE), desc="Linking genres"):
        batch = pairs[i:i + BATCH_SIZE]
        execute_values(cur, genre_sql, batch, page_size=BATCH_SIZE)
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM game_genres")
    total_links = cur.fetchone()[0]
    log.info(f"Associazioni gioco-genere totali nel DB: {total_links}")

    # --- Popolamento relazione game_categories (molti-a-molti) ---
    # Stessa logica della sezione game_genres sopra, applicata a "categories".
    category_pairs = set()
    for item in parsed_rows:
        game_id = appid_to_gameid.get(item["appid"])
        if game_id is None:
            continue
        for category_name in item["categories"]:
            category_key = _truncate_text(category_name, 255)
            category_id = category_map.get(category_key)
            if category_id is not None:
                category_pairs.add((game_id, category_id))

    category_pairs = list(category_pairs)
    log.info(f"Associazioni gioco-categoria da inserire: {len(category_pairs)}")

    category_sql = """
        INSERT INTO game_categories (game_id, category_id)
        VALUES %s
        ON CONFLICT (game_id, category_id) DO NOTHING
    """
    for i in tqdm(range(0, len(category_pairs), BATCH_SIZE), desc="Linking categories"):
        batch = category_pairs[i:i + BATCH_SIZE]
        execute_values(cur, category_sql, batch, page_size=BATCH_SIZE)
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM game_categories")
    total_category_links = cur.fetchone()[0]
    log.info(f"Associazioni gioco-categoria totali nel DB: {total_category_links}")

    cur.close()
    conn.close()


def _count_games() -> int:
    """Conta i giochi già presenti, per decidere se saltare l'import.

    Apre e chiude una connessione dedicata: viene chiamata prima di
    qualunque altra operazione, quando non è ancora chiaro se serva aprire
    la pipeline completa di lettura/pulizia/insert.

    Returns:
        int: numero di righe in "games" al momento della chiamata.
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM games")
        return cur.fetchone()[0]
    finally:
        conn.close()


def main() -> None:
    """Entry point: carica il dataset, lo pulisce e popola il database.

    Chiamato ad ogni "docker compose up" (il servizio "populate" non è più
    dietro un profilo opzionale): per restare veloce sugli avvii successivi,
    salta l'intero giro se il database risulta già popolato oltre i soli
    dati seed di init.sql, a meno che FORCE_REPOPULATE non sia impostato
    (usato per backfillare colonne aggiunte dopo il primo import, come
    windows/mac/linux). Se il CSV/JSON del dataset non è presente (es. non
    ancora scaricato manualmente, essendo troppo grande per il repo), salta
    l'import con un warning invece di interrompere l'avvio dell'intero
    stack: l'app resta comunque utilizzabile con i soli dati seed.
    """
    log.info("=== Popolamento Database ArcheType ===")

    if not FORCE_REPOPULATE:
        existing = _count_games()
        if existing > SEED_GAME_COUNT_THRESHOLD:
            log.info(
                f"Database già popolato ({existing} giochi), salto l'import. "
                "Imposta FORCE_REPOPULATE=true per forzare un nuovo giro."
            )
            return

    if not Path(DATASET_PATH).exists():
        log.warning(
            f"Dataset non trovato: {DATASET_PATH}. Salto l'import: l'app "
            "partirà con i soli dati seed di init.sql. Scarica il dataset "
            "in data/games.csv per popolare il catalogo completo (vedi README)."
        )
        return

    df = load_dataset(DATASET_PATH)
    df = clean_data(df)
    insert_games(df)
    log.info("=== Completato ===")


if __name__ == "__main__":
    main()
