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
├── populate/                # Script per popolare il DB con dati di test
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
2. Copialo in `data/steam_games.csv` (nome esatto)

### Con Docker (consigliato)

```bash
# Clona il repository
git clone https://github.com/giosuetedeschi-spec/ArcheType-LBP.git
cd ArcheType-LBP

# Avvia tutti i servizi
docker compose up --build
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


---

## 📋 Stato del Progetto

Questo progetto è in **sviluppo attivo**. Le funzionalità sono implementate incrementalmente secondo il [GitHub Project](https://github.com/users/giosuetedeschi-spec/projects/3).

| Fase | Stato |
|---|---|
| 🗄️ Database & Modellazione | 🟠 In corso |
| 🔧 Backend API | 🟠 In corso |
| 🎨 Frontend Pagine | ⏳ Pianificato |
| 🔐 Autenticazione | ⏳ Pianificato |
| 🌐 i18n & Accessibilità | ⏳ Pianificato |

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
