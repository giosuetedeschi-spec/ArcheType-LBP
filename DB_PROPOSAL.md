# Database Structure Proposal — ArcheType-LBP

## Overview

This document describes the proposed relational database structure for the ArcheType-LBP platform. The database stores Steam game catalog data, user accounts, and user-game relationships (library, wishlist, status tracking).

## Current State

The existing `db/init.sql` defines 3 tables:
- `users` — basic user accounts
- `games` — Steam game catalog
- `user_games` — many-to-many relationship with status

## Proposed Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     users       │       │    user_games     │       │     games       │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)          │    ┌──│ id (PK)         │
│ username (UQ)   │  └───>│ user_id (FK)     │    │  │ steam_app_id(UQ)│
│ email (UQ)      │       │ game_id (FK)     │<───┘  │ name            │
│ password_hash   │       │ status           │       │ release_date    │
│ created_at      │       │ added_at         │       │ developer       │
│ updated_at      │       │ updated_at       │       │ publisher       │
└─────────────────┘       │ play_time_min    │       │ price           │
                          │ notes            │       │ rating          │
                          └──────────────────┘       │ genres          │
                                                     │ description     │
┌─────────────────┐                                  │ header_image_url│
│     friends     │                                  │ created_at      │
├─────────────────┤                                  │ updated_at      │
│ id (PK)         │                                  └─────────────────┘
│ user_id (FK)    │──>
│ friend_id (FK)  │──>
│ status          │       ┌──────────────────┐
│ created_at      │       │   game_genres    │
└─────────────────┘       ├──────────────────┤
                          │ id (PK)          │
                          │ game_id (FK)     │
                          │ genre_name       │
                          └──────────────────┘

┌─────────────────┐       ┌──────────────────┐
│   wishlist      │       │  user_settings   │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ user_id (PK,FK)  │
│ user_id (FK)    │       │ theme            │
│ game_id (FK)    │       │ language         │
│ added_at        │       │ colorblind_mode  │
│ priority        │       │ items_per_page   │
│ notes           │       │ show_wishlist    │
└─────────────────┘       └──────────────────┘
```

### Table Definitions

#### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| username | VARCHAR(50) | UNIQUE NOT NULL | Display name |
| email | VARCHAR(100) | UNIQUE NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| avatar_url | VARCHAR(500) | NULL | Profile picture URL |
| bio | TEXT | NULL | User biography |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last profile update |

#### `games`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| steam_app_id | INTEGER | UNIQUE NOT NULL | Steam platform ID |
| name | VARCHAR(255) | NOT NULL | Game title |
| release_date | DATE | NULL | Original release date |
| developer | VARCHAR(255) | NULL | Developer name |
| publisher | VARCHAR(255) | NULL | Publisher name |
| price | DECIMAL(10,2) | DEFAULT 0 | Current price |
| rating | DECIMAL(3,2) | NULL | User rating (0-5) |
| genres | TEXT | NULL | Comma-separated genres |
| description | TEXT | NULL | Game description |
| header_image_url | VARCHAR(500) | NULL | Cover image URL |
| multiplayer | BOOLEAN | DEFAULT FALSE | Has multiplayer |
| play_time_avg | INTEGER | NULL | Average playtime (min) |
| created_at | TIMESTAMP | DEFAULT NOW() | DB insert time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

#### `user_games`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| user_id | INTEGER | FK→users(id) CASCADE | Owner user |
| game_id | INTEGER | FK→games(id) CASCADE | Associated game |
| status | VARCHAR(20) | NOT NULL CHECK | wishlist/playing/finished/abandoned |
| play_time_min | INTEGER | DEFAULT 0 | Minutes played |
| notes | TEXT | NULL | Personal notes |
| added_at | TIMESTAMP | DEFAULT NOW() | When added to library |
| updated_at | TIMESTAMP | DEFAULT NOW() | Status last changed |

**UNIQUE(user_id, game_id)** — each game appears once per user

#### `friends`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| user_id | INTEGER | FK→users(id) CASCADE | Requester |
| friend_id | INTEGER | FK→users(id) CASCADE | Target friend |
| status | VARCHAR(20) | DEFAULT 'pending' | pending/accepted/blocked |
| created_at | TIMESTAMP | DEFAULT NOW() | Request date |

**UNIQUE(user_id, friend_id)** — no duplicate friend requests

#### `wishlist`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| user_id | INTEGER | FK→users(id) CASCADE | Owner user |
| game_id | INTEGER | FK→games(id) CASCADE | Desired game |
| priority | INTEGER | DEFAULT 0 | 0=low, 1=medium, 2=high |
| notes | TEXT | NULL | Personal notes |
| added_at | TIMESTAMP | DEFAULT NOW() | When added |

**UNIQUE(user_id, game_id)** — no duplicates in wishlist

#### `user_settings`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INTEGER | PK, FK→users(id) CASCADE | User ID |
| theme | VARCHAR(20) | DEFAULT 'dark' | dark/light |
| language | VARCHAR(5) | DEFAULT 'en' | ISO 639-1 code |
| colorblind_mode | BOOLEAN | DEFAULT FALSE | Accessibility |
| items_per_page | INTEGER | DEFAULT 20 | Pagination size |
| show_wishlist | BOOLEAN | DEFAULT TRUE | Show in profile |

### Indexes

```sql
-- Games search indexes
CREATE INDEX idx_games_name ON games(name);
CREATE INDEX idx_games_steam_app_id ON games(steam_app_id);
CREATE INDEX idx_games_release_date ON games(release_date);
CREATE INDEX idx_games_rating ON games(rating);
CREATE INDEX idx_games_price ON games(price);

-- User games lookup
CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_user_games_status ON user_games(status);
CREATE INDEX idx_user_games_composite ON user_games(user_id, status);

-- Friends lookup
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_status ON friends(status);

-- Wishlist lookup
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
```

### Design Decisions

1. **Separate `wishlist` table from `user_games`** — A game can be in wishlist AND in user_games (bought but still tracking). Separate table allows independent priority/notes for wishlist items.

2. **`genres` as comma-separated text** — For simplicity. If genre-based filtering becomes complex, migrate to normalized `game_genres` junction table.

3. **`friends` is directional with status** — Allows pending/blocked states. A friendship acceptance creates two rows (user→friend, friend→user) for efficient querying.

4. **`user_settings` is 1:1 with users** — Separate table to avoid bloating users table with settings columns.

5. **Soft deletes** — Use `status` fields rather than `DELETE` to preserve data history.

### Migration from Current Schema

```sql
-- Add new columns to existing tables
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE games ADD COLUMN multiplayer BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN play_time_avg INTEGER;
ALTER TABLE games ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_games ADD COLUMN play_time_min INTEGER DEFAULT 0;
ALTER TABLE user_games ADD COLUMN notes TEXT;

-- Create new tables
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(5) DEFAULT 'en',
    colorblind_mode BOOLEAN DEFAULT FALSE,
    items_per_page INTEGER DEFAULT 20,
    show_wishlist BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX idx_games_release_date ON games(release_date);
CREATE INDEX idx_games_rating ON games(rating);
CREATE INDEX idx_games_price ON games(price);
CREATE INDEX idx_user_games_composite ON user_games(user_id, status);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
```


---
*Last project status update: 2026-07-03*