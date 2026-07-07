# scripts/

Python scripts per popolare il database e ispezionare dati Steam. Unica cartella
(sostituisce la precedente coppia `populate/` + `scripts/`).

```bash
pip install -r scripts/requirements.txt
```

## scripts/populate_db.py
Legge il dataset Steam (`data/games.csv` o `data/games.json`), lo pulisce/normalizza
e popola le tabelle `games`, `developers`, `publishers`, `genres`, `categories` (+ le
relazioni many-to-many). È lo script usato dal servizio Docker Compose `populate`
(`docker compose --profile init run --rm populate`), idempotente (`ON CONFLICT DO NOTHING`).

### Variabili d'ambiente
| Var | Default | Descrizione |
|---|---|---|
| `DB_HOST` | `localhost` | Host PostgreSQL (`db` dentro Docker Compose) |
| `DB_PORT` | `5432` | Porta PostgreSQL |
| `DB_NAME` | `archetype` | Nome database |
| `DB_USER` | `archetype` | Utente database |
| `DB_PASSWORD` | `archetype_secret` | Password database |
| `STEAM_DATASET_PATH` | `/data/steam_games.csv` | Percorso del dataset (CSV o JSON) |

## scripts/seed_test_data.py
Crea utenti di test e assegna loro backlog/wishlist casuali, per lo sviluppo locale.
Va eseguito **dopo** `populate_db.py` (serve che la tabella `games` sia già popolata).
Usa le stesse variabili d'ambiente `DB_*` di `populate_db.py`.

```bash
python scripts/seed_test_data.py
```

## scripts/steam_api.py
Utility (senza DB) per interrogare la Steam Web API — usato come modulo condiviso
o lanciato direttamente per uno smoke-test dell'API:
- `fetch_app_details(app_id, lang)` — dettagli completi di un gioco
- `search_games(query)` — ricerca giochi per nome
- `fetch_top_free_games(count)` — top giochi free-to-play

```bash
python scripts/steam_api.py [app_id]   # default: 570 (Dota 2)
```

## scripts/analyze_colors.py
Dato un `appid` già presente in DB, legge `header_image_url` dalla tabella `games`,
scarica l'immagine in memoria e ne calcola il colore dominante (media RGB su 32x32).
Non scrive nulla nel DB — stampa solo il risultato.

```bash
python scripts/analyze_colors.py <appid>
```

Usa le stesse variabili d'ambiente `DB_*` di `populate_db.py`.

---
*Last project status update: 2026-07-07*
