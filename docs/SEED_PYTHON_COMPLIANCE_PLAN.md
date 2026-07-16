# Seed del Database — Ripristinare Python come Procedura Reale

Plan per riconciliare il boot veloce/deterministico introdotto da PR #218
(Flyway + pg_dump da GitHub Releases) con il requisito esplicito del
capitolato: "Popolamento del Database: procedura automatizzata sviluppata in
Python, che legga il dataset originale e inserisca correttamente i dati nel
DB" (`docs/UR LbP BID.docx`, Python è anche elencato tra le "Tecnologie
richieste").

## Contesto

PR #218 ha unito due modifiche indipendenti:

1. **Schema versionato con Flyway** — `backend/src/main/resources/db/migration/V1__*.sql`,
   `V2__*.sql`, `V3__*.sql`. Risolve un problema reale (prima ogni nuova
   colonna richiedeva `docker compose down -v` su ogni macchina) e non ha
   nulla a che fare con **come** i dati vengono inseriti — è ortogonale al
   punto sotto, non in discussione in questo piano.
2. **Sostituzione del servizio `populate`** (che eseguiva
   `scripts/populate_db.py`) con il download di un pg_dump precompilato
   (`db/initdb.d/02_download_seed.sh`, scarica `seed_games.sql.gz` da GitHub
   Releases `v1.0-seed`). Risultato: nell'uso normale del progetto
   (`git clone && docker compose up`) non gira più nessuna riga di Python —
   il popolamento "vero" via Python è stato eseguito una volta sola, offline,
   da chi ha generato quel dump.

Il secondo punto risolve un problema più piccolo di quanto la PR lasci
intendere: `populate_db.py.main()` aveva già una logica di skip automatico
(`if existing > SEED_GAME_COUNT_THRESHOLD: return`) — un riavvio normale
(senza `down -v`) era già veloce, una semplice query di conteggio. I 137s
citati nella PR si verificano solo su volume vuoto (`down -v` o dataset
scaricato la prima volta), non nel caso d'uso quotidiano.

`README.md` non è stato aggiornato dopo PR #218: descrive ancora il vecchio
flusso (scarica il CSV in `data/games.csv`, il servizio `populate` lo importa
in automatico) — quel servizio non esiste più, va corretto in ogni caso.

## Cosa già esiste (riusabile, non da riscrivere da zero)

- `scripts/populate_db.py` — la procedura Python originale, ancora presente e
  funzionante nel repo, solo non più richiamata da `docker-compose.yml`.
- `scripts/generate_seed.py` — introdotto dalla stessa PR #218, pulisce il CSV
  Steam grezzo (righe malformate, senza nome, contenuti per adulti) in
  `games_clean.csv`. Pensato per alimentare il pg_dump, ma può alimentare
  altrettanto bene `populate_db.py` direttamente.

## Approcci considerati

### 1. Lasciare la situazione attuale (pg_dump da GitHub Releases)
- Pro: già implementato, avvio più veloce in assoluto (~12s anche a freddo).
- Con: nessuna riga di Python gira nell'uso normale del progetto — rischio
  concreto di non essere considerato conforme al capitolato.

### 2. Versionare il CSV pulito (non il pg_dump) + far girare `populate_db.py`
- Pro: stesso beneficio di determinismo per il team (un solo file identico
  per tutti, niente più dipendenza dal dataset grezzo da 389 MB), ma la
  procedura che scrive nel DB resta `populate_db.py` — soddisfa il
  capitolato alla lettera. `generate_seed.py` fa già questo lavoro di
  pulizia, serve solo pubblicarne l'output invece del pg_dump derivato.
- Con: più lento del pg_dump puro (si passa comunque da pandas + insert a
  batch), anche se il file pulito è più piccolo del CSV grezzo (niente righe
  scartate) quindi più veloce dell'originale.

### 3. Come #2, ma con `COPY` invece di INSERT a batch in `populate_db.py`
- Pro: stesso di #2, con boot quasi alla pari del pg_dump attuale — `COPY` è
  nativamente più veloce (tipicamente 5-10x) di `execute_values` a batch per
  bulk-load di questa dimensione.
- Con: richiede riscrivere la parte di insert di `insert_games()` (oggi usa
  `execute_values` a batch) — lavoro aggiuntivo ma contenuto, la logica di
  parsing/validazione righe resta identica.

### 4. Ibrido: pg_dump per l'avvio di default, `populate_db.py` solo "disponibile e documentato"
- Pro: mantiene la velocità attuale senza toccare nulla.
- Con: `populate_db.py` diventerebbe script morto nella pratica — mai
  eseguito automaticamente, difficile da dimostrare come "la" procedura di
  popolamento in una review/demo. Non risolve il problema di conformità,
  lo maschera soltanto.

## Approccio scelto: #3 (CSV pulito versionato + `populate_db.py` con `COPY`)

Perché: è l'unico che mantiene `populate_db.py` come procedura realmente
**eseguita** (non solo presente nel repo) ad ogni `docker compose up` su
volume vuoto, soddisfacendo il capitolato senza ambiguità, con un boot quasi
alla pari del pg_dump attuale grazie a `COPY`.

### Implementazione

1. **Pubblicare il CSV pulito**: eseguire `scripts/generate_seed.py` una
   volta, caricare l'output (`games_clean.csv`) su GitHub Releases (stesso
   meccanismo già usato per `v1.0-seed`, es. tag `v1.1-clean-csv`) al posto
   del pg_dump.
2. **`docker-compose.yml`**: ripristinare il servizio `populate` (rimosso da
   PR #218), puntato però al CSV pulito scaricato da Releases invece che al
   CSV grezzo locale `data/games.csv` — elimina anche il vincolo "scarica
   389 MB a mano prima di partire" per i nuovi contributor.
3. **`populate_db.py`**: sostituire l'INSERT a batch in `insert_games()` con
   `cur.copy_expert()` su un buffer CSV in memoria, mantenendo identica la
   logica di parsing/validazione già presente (inclusi i fix già fatti su
   `mature`, `estimated_owners`, `rating`) — cambia solo il meccanismo di
   scrittura, non i dati prodotti.
4. **Flyway resta invariato**: la parte di PR #218 relativa allo schema
   versionato non è in discussione, risolve un problema reale ed è
   ortogonale al popolamento dati.
5. **`README.md`**: aggiornare in ogni caso la sezione Dataset/setup, oggi
   disallineata sia dalla situazione attuale sia da questa proposta.

### Nota per la review

Il servizio `populate` originale aveva già lo skip automatico per i riavvii
normali (vedi Contesto sopra) — questa proposta non reintroduce il problema
di lentezza che PR #218 voleva risolvere per l'uso quotidiano, lo risolve
diversamente solo per il caso "volume vuoto".
