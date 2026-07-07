# ArcheType-LBP — Project Context

## Stack
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui + TanStack Query/Router/Start
- Backend: Java 21 + Spring Boot 3.3 + Spring Data JPA + Maven
- Database: PostgreSQL 17
- Auth: Steam OpenID + Google OAuth + JWT
- i18n: EN/IT/FR (JSON files + React context)
- Colorblind: CSS custom properties (protanopia/deuteranopia/tritanopia)
- Tests: JUnit 5 + Mockito + H2 (backend), Vitest + React Testing Library (frontend)

## Database Schema (10 tables)
users, developers, publishers, genres, categories, games, game_genres (pivot), game_categories (pivot), backlog, wishlist, game_sessions, friends, user_settings
- games has FK to developer_id and publisher_id
- game_genres/game_categories are N:N pivot tables
- backlog has status: wishlist/playing/finished/abandoned + play_time_min
- wishlist has priority (0/1/2) + notes

## Key Features
- Catalog: multi-criteria filters (name, genre, developer, price range, rating, date) + pagination
- Game detail: wishlist toggle, play time tracking, Buy on Steam external link
- Wishlist: game cards, heart remove, Steam buy link
- Stats: status counts, genre/developer/year breakdowns, avg rating, total spent
- Health check endpoint
- Steam-like filter system with JPA Specifications

## Screen Flow
Loading → Login (Steam/Google OAuth) → Home ("What to play?") → Game Page → Profile → Wishlist → Leaderboard

## Paths
- Repo: C:\Cose Nuove\Code\Code of 2026\ArcheType-LBP
- Branch: bobu-branch (all 17 feature branches merged)
- 186 files, +23.9k lines

## Environment
- Windows 10 (26200), MSYS/Git-Bash
- Hermes Agent venv: C:\Users\gioma\AppData\Local\hermes\hermes-agent\venv
- Python 3.11.15, Node 18+

## User
- Giosue "Bobu" Tedeschi, Italian
- GitHub: giosuetedeschi-spec
- Style: caveman (short, direct, no frills)

## Git Rules
- Never rewrite history on GitHub
- Never force push to main branches
- Sign commits as giosuetedeschi-spec <giosue.tedeschi@edu-its.it>

---
*Last project status update: 2026-07-03*