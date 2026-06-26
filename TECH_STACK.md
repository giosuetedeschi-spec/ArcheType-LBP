# Tech Stack — ArcheType-LBP

## Overview

ArcheType-LBP is a full-stack web application for managing personal video game libraries.

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
│              React + Vite + Tailwind CSS                  │
│              shadcn/ui components                        │
│              Runs in Docker (Nginx)                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST JSON
┌──────────────────────▼──────────────────────────────────┐
│                     Backend                              │
│              Java 21 + Spring Boot 3.3                   │
│              Spring Data JPA + Hibernate                 │
│              Spring Web + Validation                     │
│              Lombok for boilerplate reduction             │
│              Runs in Docker (JAR)                        │
└──────────────────────┬──────────────────────────────────┘
                       │ JDBC
┌──────────────────────▼──────────────────────────────────┐
│                     Database                             │
│              PostgreSQL 17                               │
│              Managed via Docker Compose                  │
│              Python populate script for test data        │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18+ | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool & dev server |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **shadcn/ui** | latest | Component library (Radix-based) |
| **React Router** | 6.x | Client-side routing |
| **Bun** | 1.x | Package manager & runtime |
| **Nginx** | latest | Production static file server |

**Key dependencies:**
- `react-router-dom` — routing
- `recharts` — charts/graphs (Grafici di Utilizzo)
- `sonner` — toast notifications
- `zod` — form validation

**Location:** `archetype-frontend/`

---

## Backend

| Technology | Version | Purpose |
|---|---|---|
| **Java** | 21 | Language |
| **Spring Boot** | 3.3.0 | Application framework |
| **Spring Data JPA** | 3.3.0 | ORM / Database access |
| **Spring Web** | 3.3.0 | REST controllers |
| **Spring Validation** | 3.3.0 | Input validation |
| **Hibernate** | (via JPA) | Object-relational mapping |
| **Lombok** | latest | Reduce boilerplate (getters, setters, constructors) |
| **Maven** | 3.9+ | Build tool & dependency management |

**Key dependencies (pom.xml):**
- `spring-boot-starter-web` — HTTP server + REST
- `spring-boot-starter-data-jpa` — JPA + Hibernate
- `spring-boot-starter-validation` — Bean validation
- `postgresql` — JDBC driver
- `lombok` — Code generation

**Location:** `backend/`

### Package Structure

```
com.archetype.lbp/
├── Application.java          # Entry point
├── controller/               # REST endpoints
│   ├── GameController.java
│   ├── UserController.java
│   └── UserGameController.java
├── service/                  # Business logic
│   ├── GameService.java
│   └── UserGameService.java
├── repository/               # Data access (JPA)
│   ├── GameRepository.java
│   ├── UserRepository.java
│   └── UserGameRepository.java
├── model/                    # JPA entities
│   ├── Game.java
│   ├── User.java
│   └── UserGame.java
├── dto/                      # Data transfer objects
├── exception/                # Error handling
└── config/                   # Configuration classes
```

---

## Database

| Technology | Version | Purpose |
|---|---|---|
| **PostgreSQL** | 17 | Primary database |
| **Python** | 3.11 | Populate/test data scripts |
| **psycopg2** | latest | Python PostgreSQL adapter |
| **Docker Compose** | latest | Container orchestration |

**Schema tables:**
- `users` — User accounts
- `games` — Game catalog (Steam data)
- `user_games` — User-game relationship (status, timestamps)

**Location:** `db/init.sql` (schema), `populate/` (test data)

---

## Infrastructure

| Component | Configuration |
|---|---|
| **Docker Compose** | Orchestrates frontend + backend + db + populate |
| **Backend container** | OpenJDK 21, runs JAR |
| **Frontend container** | Alpine Nginx, serves static build |
| **Database container** | PostgreSQL 17, persistent volume |
| **Populate container** | Python 3.11, runs once to seed DB |

**Location:** `docker-compose.yml`

---

## API Architecture

```
GET    /api/games              → List all games
GET    /api/games/{id}         → Get game by ID
GET    /api/games/search?name= → Search games by name
GET    /api/users              → List users
POST   /api/users              → Register user
GET    /api/users/{id}         → Get user profile
GET    /api/user-games         → Get user's games
POST   /api/user-games         → Add game to library
PUT    /api/user-games/{id}    → Update game status
DELETE /api/user-games/{id}    → Remove game from library
```

---

## Development Tools

| Tool | Purpose |
|---|---|
| **Maven** | `mvn spring-boot:run` for backend |
| **Bun** | `bun run dev` for frontend |
| **Docker Compose** | `docker compose up` for full stack |
| **pgAdmin** / **DBeaver** | Database management |
| **Postman** / **curl** | API testing |

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | JDBC connection string | `jdbc:postgresql://db:5432/archetype` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `archetype_user` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `veryStrongpassword!` |
| `SERVER_PORT` | Backend port | `8080` |
| `VITE_API_URL` | Frontend API base | `http://localhost:8080/api` |
