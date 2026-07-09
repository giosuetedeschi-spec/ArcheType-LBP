# 🎮 VirtualZ

> Gestione intelligente della tua libreria di videogiochi.

ArcheType-LBP è un'applicazione web per organizzare, esplorare e gestire la tua collezione di videogiochi. Collega il tuo account Steam, importa la tua libreria, aggiungi giochi alla wishlist, monitora le statistiche di utilizzo e scopri nuovi titoli grazie a filtri avanzati.

---

## ✨ Funzionalità

| Funzionalità | Descrizione |
|---|---|
| 📚 **Libreria Personale** | Importa e visualizza tutti i tuoi giochi Steam |
| ❤️ **Wishlist** | Tieni traccia dei giochi che desideri |
| 📊 **Grafici di Utilizzo** | Visualizza le tue statistiche di gioco |
| 🏆 **Classifiche** | Ranking dei tuoi giochi più giocati |
| 🔍 **Filtri Avanzati** | Filtra per genere,anno, tempo di gioco, rating... |
| 👥 **Amici** | Scegli amici e condividi le vostre librerie |
| 👤 **Profilo** | Gestisci account, preferenze e impostazioni |
| 🎨 **Modalità Colorblind** | Palette accessibili per daltonici |
| 🌐 **Multilingua** | Supporto internazionalizzazione (i18n) |
| 🔐 **Login immediato** | Accesso rapido e sicuro |

---

## 🛠️ Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| **Frontend** | React + Vite + TypeScript, shadcn/ui, Tailwind CSS |
| **Backend** | Java Spring Boot |
| **Database** | PostgreSQL 17 |
| **API** | REST API
| **Auth** | JWT + session management |
| **Container** | Docker Compose (frontend + backend + DB + populate) |

---

## 📁 Struttura del Progetto

```
ArcheType-LBP/
├── virtualz-frontend/      # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── components/      # Componenti UI (shadcn/ui + custom)
│   │   ├── routes/          # Pagine dell'app (catalog, library, ...)
│   │   ├── lib/             # Utilities, API client, store
│   │   └── hooks/           # Custom React hooks
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                 # Spring Boot API
│   └── src/main/java/com/archetype/lbp/
│       ├── controller/     # REST controllers
│       ├── service/        # Business logic
│       ├── repository/     # JPA repositories
│       └── model/          # Entità JPA
├── db/                      # Database schema (init.sql)
├── scripts/                 # Popolamento DB, test Steam API, analisi colori
├── docker-compose.yml
├
└── Palette colori proposta.md # Design system colori
```

---

## 🚀 Avvio Rapido

### Prerequisiti

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/) 18+ (npm incluso) per lo sviluppo frontend
- JDK 21+ per lo sviluppo backend
- Maven 3.9+

### Dataset (obbligatorio prima di popolare il database)

Il dataset Steam (~389 MB) non è incluso nel repository — va scaricato a parte:

1. Scarica da: https://drive.google.com/file/d/1jkWhz5HU8KaJmOZSfJPgKDvUg7uELaDf/view?usp=drive_link
2. Copialo in `data/games.csv` (nome esatto)

### Reset di Docker e della cache (consigliato prima del primo avvio o in caso di problemi)

Docker può servire immagini "stantie" (build cachate da versioni precedenti del codice), causando comportamenti strani come un frontend che non riesce a parlare col backend pur avendo il codice corretto. Prima del primo `docker compose up`, o ogni volta che qualcosa non torna, conviene ripulire tutto:

```bash
# Ferma tutti i container del progetto e rimuove anche i volumi (dati DB inclusi)
docker compose down -v

# Rimuove le immagini già costruite del progetto, per forzare una rebuild completa
docker compose rm -f
docker image rm archetype-lbp-frontend archetype-lbp-backend 2>/dev/null || true

# Svuota la cache di build di Docker (BuildKit) — elimina i layer cachati
docker builder prune -af
```

Poi ricostruisci tutto da zero, senza cache:

```bash
docker compose build --no-cache
docker compose up -d
```

**Windows (PowerShell o Git Bash):**
- I comandi sopra sono identici sia in Git Bash che in PowerShell (Docker Desktop con backend WSL2 gestisce la compatibilità).
- Verifica che Docker Desktop sia avviato e il daemon raggiungibile prima di lanciare i comandi: `docker info`. Se fallisce, avvia Docker Desktop e attendi che l'icona nella system tray indichi "Running".
- Dopo un reset pesante della cache, a volte serve un riavvio completo di Docker Desktop (system tray → tasto destro sull'icona → **Restart**) prima che la build torni ad essere veloce e affidabile.

**macOS:**
- Stessi comandi, nessuna differenza di sintassi (bash/zsh nativi).
- Se il reset da terminale non risolve, apri Docker Desktop → **Troubleshoot** (icona a forma di insetto, in alto) → **Clean / Purge data** per un reset più aggressivo (rimuove tutte le immagini/cache locali di Docker, non solo quelle di questo progetto — usalo con cautela se hai altri progetti Docker attivi).
- Su Apple Silicon (M1/M2/M3): se un'immagine era stata costruita in precedenza per `linux/amd64` (es. scaricata o buildata su una macchina Intel), la rebuild potrebbe risultare lenta per via dell'emulazione. In tal caso rimuovi esplicitamente l'immagine (`docker image rm ...`) e lascia che `docker compose build --no-cache` la ricostruisca nativamente per `linux/arm64`.

> Nota: `docker compose down -v` elimina anche il volume Postgres (`pgdata`). Non serve ripopolare manualmente: il servizio `populate` gira in automatico al successivo `docker compose up` e importa di nuovo il dataset da `data/games.csv` (se presente — vedi sezione Dataset sopra).

### Con Docker (consigliato)

```bash
# Clona il repository (se non lo hai già fatto) e entra nella cartella
git clone https://github.com/giosuetedeschi-spec/ArcheType-LBP.git
cd ArcheType-LBP

# Assicurati di aver scaricato il dataset come descritto sopra

# Avvia tutti i servizi (frontend su http://localhost:5173)
# Un solo comando: schema DB, import del dataset, backend e frontend.
docker compose up --build
```

Il servizio `populate` importa il dataset automaticamente ad ogni avvio, ma
si auto-salta (in pochi secondi) se il database è già popolato — quindi i
riavvii successivi al primo restano veloci. Per forzare un nuovo import (es.
dopo aver aggiunto colonne che richiedono un backfill):

```bash
docker compose run --rm -e FORCE_REPOPULATE=true populate
```

| Servizio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| Database | localhost:5432 |

### Sviluppo Locale

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (terminale separato)
cd virtualz-frontend
npm install
npm run dev
```

---

## 📋 Stato del Progetto

Questo progetto è in **sviluppo attivo**. Le funzionalità sono implementate incrementalmente secondo il [GitHub Project](https://github.com/users/giosuetedeschi-spec/projects/3).

| Fase | Stato |
|---|---|
| 🗄️ Database & Modellazione | 🟠 In corso |
| 🔧 Backend API | 🟠 In corso |
| 🎨 Frontend Pagine | ⏳ Pianificato |
| 🔐 Autenticazione | ⏳ Pianificato |
| 🌐 i18n & Accessibilità | 🟠 In corso |

Legend: ✅ Completato | 🟠 In corso | ⏳ Pianificato

---

## 🗺️ Roadmap

1. **Database modellato** → tabelle Users, Games, UserGames, Wishlist, Friends
2. **Backend API** → CRUD completi + business logic per statistiche
3. **Autenticazione** → login/register con JWT
4. **Frontend pagine** → Homepage, Catalogo, Libreria, Profilo, Wishlist, Classifiche, Grafici, Filtri, Amici, Loading
5. **UX & Polish** → animazioni, colorblind mode, responsive, i18n
6. **Deploy** → containerizzazione e messa in produzione



---

## 📄 Licenza

Vedi [LICENSE](./LICENSE).

---

## 📬 Contatto

Giosue Tedeschi — giosuetedeschi-spec
Anna Digiglio — annadigiglio-lgtm
Lorenzo Vurchio — LorVur
Joshua Gino Galarza — Joshua BID
Girelle Beni Benj — 
Marguerite Deido III El Mbimbey — MDL CNAKE
