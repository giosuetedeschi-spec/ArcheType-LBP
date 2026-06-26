# 🎮 ArcheType-LBP — Complete Recap

## What It Is

**ArcheType-LBP** is a full-stack web application for managing personal video game libraries. It connects to Steam, lets you import your game library, maintain a wishlist, track play status, monitor usage stats, and discover new titles via advanced filters. The project is by **Giosue Tedeschi** and is in **active development**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TypeScript, Tailwind CSS 4, shadcn/ui, React Router 6 |
| **Backend** | Java 21 + Spring Boot 3.3 (Spring Data JPA, Spring Web, Validation) |
| **Database** | PostgreSQL 17 |
| **ORM** | Hibernate (via JPA), Lombok for boilerplate reduction |
| **Auth** | JWT (planned, not yet implemented) |
| **Infra** | Docker Compose (4 services: db, backend, frontend, populate) |
| **Package Mgmt** | Maven (backend), Bun (frontend) |

---

## Project Structure

```
ArcheType-LBP/
├── archetype-frontend/     # React SPA (served via Nginx in Docker)
│   ├── src/
│   │   ├── components/     # UI components (shadcn/ui + custom)
│   │   ├── routes/         # Pages: catalog, library, game/:id, wishlist, stats, profile, friends, leaderboard
│   │   ├── lib/            # API client, utilities, filter options
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # ColorblindContext, I18nContext
│   │   └── i18n/locales/   # en.json, fr.json, it.json
│   └── Dockerfile + nginx.conf
├── backend/                # Spring Boot REST API
│   └── src/main/java/com/archetype/lbp/
│       ├── controller/     # GameController, UserController, BacklogController, UserGameController, FriendController, StatsController, HealthController
│       ├── service/        # GameService, UserService, BacklogService, FriendService, StatsService, UserGameService
│       ├── repository/     # JPA repositories for all entities
│       ├── model/          # JPA entities: Game, User, UserGame, Backlog, Friend, GameSession, GameCategory, GameGenre, Genre, Category, Developer, Publisher
│       ├── dto/            # Request/Response DTOs with Lombok
│       ├── exception/      # GlobalExceptionHandler, ResourceNotFoundException
│       └── config/         # CorsConfig
├── db/init.sql             # Full DDL + test seed data
├── populate/               # Python script to seed DB from Steam CSV/JSON dataset
├── Marguerite_Datasets/    # Original dataset exploration (games.csv ~390MB, games.json, steam_games.db)
├── docs/                   # Feature-specific docs (auth, colorblind, wishlist, steam purchase, game detail)
├── SUPABASE.md             # Migration guide: Spring Boot → Supabase BaaS
├── FRONTEND_ARCHITECTURE.md # Layout, component hierarchy, data flow
├── docker-compose.yml      # 4-service orchestration
└── API_REFERENCE.md        # Full REST endpoint documentation
```

---

## 🗄️ Database — Logical Planning (Deep Dive)

### Current State: 13 Tables (fully implemented in `db/init.sql`)

The database has **evolved significantly** from the original proposal (which had 6 tables) to a **fully normalized schema with 13 tables**:

#### Core Entity Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **`users`** | User accounts | id, username (UQ), email (UQ), password_hash, avatar_url, status (online/offline/playing/away), bio |
| **`games`** | Steam game catalog | id, steam_app_id (UQ), name, release_date, developer_id (FK), publisher_id (FK), price, rating (0-5), description, header_image_url, multiplayer |
| **`developers`** | Normalized developer names | id, name (UQ) |
| **`publishers`** | Normalized publisher names | id, name (UQ) |
| **`genres`** | Genre taxonomy | id, name (UQ) |
| **`categories`** | Game categories (Singleplayer, Multiplayer, etc.) | id, name (UQ) |

#### Pivot Tables (Many-to-Many)

| Table | Relationship | PK |
|-------|-------------|-----|
| **`game_genres`** | Game ↔ Genre | (game_id, genre_id) |
| **`game_categories`** | Game ↔ Category | (game_id, category_id) |
| **`game_developers`** | Game ↔ Developer (for multi-dev games) | (game_id, developer_id) |

#### User-Game Relationship Tables

| Table | Purpose | Key Constraints |
|-------|---------|-----------------|
| **`backlog`** | User's game library with status | UNIQUE(user_id, game_id), status ∈ {wishlist, playing, finished, abandoned}, play_time_min, notes |
| **`wishlist`** | Separate wishlist (independent from backlog) | UNIQUE(user_id, game_id), priority (0/1=low, 2=high), notes |
| **`game_sessions`** | Individual play session tracking | session_start, session_end, duration_min |

#### Social Tables

| Table | Purpose | Constraints |
|-------|---------|-------------|
| **`friends`** | Friend relationships | UNIQUE(user_id, friend_id), status ∈ {pending, accepted, blocked} |

#### Settings

| Table | Purpose | Relationship |
|-------|---------|-------------|
| **`user_settings`** | Per-user preferences | 1:1 with users (user_id is PK+FK), theme, language, colorblind_mode, items_per_page, show_wishlist |

### Key Design Decisions

1. **Normalized developers/publishers/genres/categories** — Instead of comma-separated strings in the `games` table, these are proper foreign-keyed tables. This is a **step beyond** the original `DB_PROPOSAL.md` which used `genres TEXT`.

2. **Separate `wishlist` and `backlog` tables** — A game can exist in both (e.g., bought but still tracking as wishlist). This allows independent priority/notes for wishlist items vs. library items.

3. **`game_sessions` for time tracking** — Enables accurate playtime analytics beyond the simple `play_time_min` on the backlog. Sessions can be aggregated for reports.

4. **Directional friendships** — The `friends` table stores one row per direction (user→friend). Acceptance creates two rows for efficient querying in both directions.

5. **Soft deletes via status** — No hard deletion; status fields preserve data history.

6. **CASCADE on all FKs** — Deleting a user removes their backlog, wishlist, sessions, settings, and friend entries automatically.

### Indexing Strategy

13 indexes covering:
- **Game search**: name, steam_app_id, release_date, rating, developer_id, publisher_id
- **Pivot lookups**: game_genres(game_id, genre_id), game_categories(game_id, category_id)
- **User-scoped queries**: backlog(user_id, status), wishlist(user_id), game_sessions(user_id), friends(user_id)

### Data Flow / Architecture Diagram

```
Frontend (React SPA)
    │  HTTP/REST JSON
    ▼
Backend (Spring Boot)
    │  Spring Data JPA (Hibernate)
    ▼
PostgreSQL 17
    ├── 6 normalized entity tables
    ├── 3 M:N pivot tables
    ├── 4 user-game relationship tables
    └── 1 settings table (1:1 with users)
```

### Populate Pipeline

The `populate/` directory contains a Python script (`populate_db.py`) that:
1. Reads the Steam dataset (CSV ~390MB or JSON)
2. Cleans data (dedup by steam_app_id, normalizes column names)
3. Batch-inserts games into the `games` table using `psycopg2.extras.execute_values`
4. Uses `ON CONFLICT DO NOTHING` for idempotent inserts

### Supabase Migration Path

There's a detailed migration plan (`SUPABASE.md`) to replace the Spring Boot backend entirely with **Supabase** (PostgreSQL BaaS), which would:
- Eliminate the Java backend (~512MB RAM → 0)
- Auto-generate REST/GraphQL APIs from the schema
- Provide built-in auth, real-time WebSocket, and row-level security
- Deploy frontend to Vercel with Supabase free tier

---

## API Surface (Current)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/games` | GET | List all games |
| `/api/games/filter` | GET | Multi-criteria filtering (name, genre, price range, rating, date range, pagination, sorting) |
| `/api/games/{id}` | GET | Single game details |
| `/api/games/search?q=` | GET | Search by name |
| `/api/games/genre/{genre}` | GET | Filter by genre |
| `/api/games` | POST | Create game |
| `/api/games/{id}` | PUT | Update game |
| `/api/games/{id}` | DELETE | Delete game |
| `/api/users/{userId}/games` | GET | User's backlog |
| `/api/users/{userId}/games` | POST | Add to backlog |
| `/api/users/{userId}/games/{id}` | PUT | Update status |
| `/api/users/{userId}/games/{id}` | DELETE | Remove from backlog |
| `/api/users/{userId}/stats` | GET | User statistics (by genre, developer, year, rating, total spent) |
| `/api/friends` | GET/POST | Friend management |

---

## Current Status

- ✅ Database fully modeled (13 tables, normalized, indexed)
- ✅ Backend API operational (CRUD + filtering + stats)
- ✅ Frontend routes and components scaffolded
- 🟠 Authentication (planned, not implemented)
- 🟠 i18n & accessibility (components exist, in progress)
- ⏳ Frontend pages (some implemented, others planned)
