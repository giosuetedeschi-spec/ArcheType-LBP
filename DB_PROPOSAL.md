# Database Structure Proposal — ArcheType-LBP

## Overview

This document describes the relational database structure for ArcheType-LBP, based on the ER diagram (db 1.jpeg), logical modeling (db 2.jpeg), and pivot table requirements (db 4.jpeg).

## Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   developers  │     │    games      │     │  publishers  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │<---┐│ id (PK)      │┌--->│ id (PK)      │
│ name (UQ)    │    ││ appid (UQ)   ││    │ name (UQ)    │
└──────────────┘    ││ name         ││    └──────────────┘
                    ││ price        ││
                    ││ release_date ││
                    ││ developer_id ││
                    ││ publisher_id ││
                    ││ rating       ││
                    ││ description  ││
                    ││ header_image ││
                    ││ multiplayer  ││
                    │└──────┬───────┘│
                    │       │        │
┌──────────────┐    │  ┌────┴────┐   │  ┌──────────────┐
│   genres     │    │  │game_    │   │  │  categories  │
├──────────────┤    │  │genres   │   │  ├──────────────┤
│ id (PK)      │<---+  │(pivot)  │   +->│ id (PK)      │
│ name (UQ)    │       └─────────┘   │  │ name (UQ)    │
└──────────────┘                     │  └──────────────┘
                                     │
┌──────────────┐     ┌──────────────┐│  ┌──────────────┐
│   users      │     │  wishlist    ││  │game_categories│
├──────────────┤     ├──────────────┤│  │(pivot)       │
│ id (PK)      │────>│ id (PK)      ││  ├──────────────┤
│ username(UQ) │     │ user_id (FK) ││  │ game_id (FK) │
│ email (UQ)   │     │ game_id (FK) ││  │ category_id  │
│ password     │     │ priority     ││  └──────────────┘
│ avatar_url   │     │ notes        ││
│ status       │     │ added_at     ││  ┌──────────────┐
│ bio          │     └──────────────┘│  │game_developers│
│ created_at   │                     │  │(conditional) │
│ updated_at   │     ┌──────────────┐│  ├──────────────┤
└──────────────┘     │   backlog    ││  │ game_id (FK) │
                     ├──────────────┤│  │ developer_id │
                     │ id (PK)      ││  └──────────────┘
                     │ user_id (FK) ││
                     │ game_id (FK) ││  ┌──────────────┐
                     │ status       ││  │ game_sessions │
                     │ play_time_min││  ├──────────────┤
                     │ notes        ││  │ id (PK)      │
                     │ added_at     │└──│ user_id (FK) │
                     │ updated_at   │   │ game_id (FK) │
                     └──────────────┘   │ session_start│
                                        │ session_end  │
┌──────────────┐     ┌──────────────┐   │ duration_min │
│   friends     │     │user_settings │   └──────────────┘
├──────────────┤     ├──────────────┤
│ id (PK)      │     │ user_id (PK) │
│ user_id (FK) │     │ theme        │
│ friend_id(FK)│     │ language     │
│ status       │     │ colorblind   │
│ created_at   │     │ items_per_pg │
└──────────────┘     │ show_wishlist│
                     └──────────────┘
```

## Table Definitions

### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| username | VARCHAR(50) | UNIQUE NOT NULL | Display name |
| email | VARCHAR(100) | UNIQUE NOT NULL | Login email |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| avatar_url | VARCHAR(500) | NULL | Profile picture |
| status | VARCHAR(20) | DEFAULT 'online' | online/offline/playing/away |
| bio | TEXT | NULL | User biography |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

### `developers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| name | VARCHAR(255) | UNIQUE NOT NULL | Developer name |

### `publishers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| name | VARCHAR(255) | UNIQUE NOT NULL | Publisher name |

### `genres`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| name | VARCHAR(100) | UNIQUE NOT NULL | Genre name |

### `categories`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| name | VARCHAR(100) | UNIQUE NOT NULL | Category name |

### `games`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| appid | INTEGER | UNIQUE NOT NULL | Steam App ID |
| name | VARCHAR(255) | NOT NULL | Game title |
| price | DECIMAL(10,2) | DEFAULT 0.00 | Current price |
| release_date | DATE | NULL | Release date |
| developer_id | INTEGER | FK→developers(id) | Main developer |
| publisher_id | INTEGER | FK→publisher(id) | Publisher |
| rating | DECIMAL(3,2) | NULL | User rating (0-5) |
| description | TEXT | NULL | Game description |
| header_image_url | VARCHAR(500) | NULL | Cover image |
| multiplayer | BOOLEAN | DEFAULT FALSE | Has multiplayer |
| created_at | TIMESTAMP | DEFAULT NOW() | DB insert |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

### `game_genres` (Pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| game_id | INTEGER | FK→games(id) CASCADE, PK |
| genre_id | INTEGER | FK→genres(id) CASCADE, PK |

### `game_categories` (Pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| game_id | INTEGER | FK→games(id) CASCADE, PK |
| category_id | INTEGER | FK→categories(id) CASCADE, PK |

### `game_developers` (Conditional Pivot)
*Only needed if a game can have multiple developers.*

| Column | Type | Constraints |
|--------|------|-------------|
| game_id | INTEGER | FK→games(id) CASCADE, PK |
| developer_id | INTEGER | FK→developers(id) CASCADE, PK |

### `wishlist`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| user_id | INTEGER | FK→users(id) CASCADE | Owner |
| game_id | INTEGER | FK→games(id) CASCADE | Desired game |
| priority | INTEGER | DEFAULT 0 | 0=low, 1=medium, 2=high |
| notes | TEXT | NULL | Personal notes |
| added_at | TIMESTAMP | DEFAULT NOW() | When added |

**UNIQUE(user_id, game_id)**

### `backlog`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| user_id | INTEGER | FK→users(id) CASCADE | Owner |
| game_id | INTEGER | FK→games(id) CASCADE | Game |
| status | VARCHAR(20) | NOT NULL | wishlist/playing/finished/abandoned |
| play_time_min | INTEGER | DEFAULT 0 | Minutes played |
| notes | TEXT | NULL | Personal notes |
| added_at | TIMESTAMP | DEFAULT NOW() | When added |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last status change |

**UNIQUE(user_id, game_id)**

### `game_sessions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| user_id | INTEGER | FK→users(id) CASCADE | Player |
| game_id | INTEGER | FK→games(id) CASCADE | Game played |
| session_start | TIMESTAMP | NOT NULL | When started |
| session_end | TIMESTAMP | NULL | When ended |
| duration_min | INTEGER | NULL | Calculated duration |
| created_at | TIMESTAMP | DEFAULT NOW() | DB insert |

### `friends`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| user_id | INTEGER | FK→users(id) CASCADE | Requester |
| friend_id | INTEGER | FK→users(id) CASCADE | Target |
| status | VARCHAR(20) | DEFAULT 'pending' | pending/accepted/blocked |
| created_at | TIMESTAMP | DEFAULT NOW() | Request date |

**UNIQUE(user_id, friend_id)**

### `user_settings`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INTEGER | PK, FK→users(id) CASCADE | User |
| theme | VARCHAR(20) | DEFAULT 'dark' | dark/light |
| language | VARCHAR(5) | DEFAULT 'en' | ISO 639-1 |
| colorblind_mode | BOOLEAN | DEFAULT FALSE | Accessibility |
| items_per_page | INTEGER | DEFAULT 20 | Pagination |
| show_wishlist | BOOLEAN | DEFAULT TRUE | Show in profile |

## Verification Queries (from db 3.jpeg)

```sql
-- Verify games table structure and data
SELECT * FROM games;

-- Verify conditional evaluation of foreign key relationships
SELECT * FROM wishlist WHERE user_id = 1;

-- Verify proper functionality of multi-table JOIN operations over pivot tables
SELECT * FROM games g JOIN game_genres gg ON g.appid = gg.game_id;

-- Verify user-game relationships
SELECT * FROM backlog WHERE user_id = 1;
SELECT * FROM wishlist WHERE user_id = 1;

-- Verify game sessions
SELECT * FROM game_sessions WHERE user_id = 1 ORDER BY session_start DESC;

-- Verify friends
SELECT * FROM friends WHERE user_id = 1 AND status = 'accepted';
```

## Test Data Summary

| Entity | Count | Notes |
|--------|-------|-------|
| users | 2 | alice, bob |
| games | 5 | CS2, BG3, Elden Ring, GTA V, Dota 2 |
| genres | 3 | Action, RPG, Strategy |
| categories | 4 | Singleplayer, Multiplayer, Co-op, Open World |
| developers | 4 | Valve, CDPR, FromSoftware, Rockstar |
| publishers | 4 | Valve, CD Projekt, Bandai Namco, Rockstar |
| wishlist | 2 | User 1 has BG3 + Elden Ring |
| backlog | 5 | Various statuses per user |

## Design Decisions

1. **Separate `developers` and `publishers` tables** — Normalized from the ER diagram's 1:N relationships. A game has one main developer and one publisher, but the `game_developers` pivot table allows multiple developers per game.

2. **`game_genres` and `game_categories` are mandatory pivots** — Games have many genres and categories (N:N relationships).

3. **`wishlist` is separate from `backlog`** — A game can be in both (wishlist before purchase, backlog after). Different semantics: wishlist = "want to play", backlog = "own and tracking".

4. **`game_sessions` tracks play time** — Each session records start/end time. Aggregated for stats.

5. **`backlog.status` replaces the old single-status model** — Four states: wishlist, playing, finished, abandoned.

6. **`friends` is directional with symmetric entries** — When accepted, create two rows for efficient querying of "all friends of user X".
