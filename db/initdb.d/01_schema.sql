-- ArcheType-LBP Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Issue #21: abilita pg_prewarm per precaricare tabelle grandi (es. games con 122k+ righe)
-- in memoria RAM all'avvio. Migliora le performance delle query successive evitando letture da disco.
-- In un DO block con gestione eccezioni: questo script gira con ON_ERROR_STOP=1
-- (entrypoint ufficiale dell'immagine postgres), quindi un CREATE EXTENSION che
-- fallisce (es. modulo contrib non installato su un Postgres gestito/minimale)
-- interromperebbe l'intero init.sql prima ancora di creare le tabelle sotto,
-- invece di degradare correttamente (il prewarm da Python è già opzionale,
-- vedi scripts/populate_db.py::prewarm_games_table).
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_prewarm;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'pg_prewarm non disponibile, skip (il prewarm allo startup sarà un no-op): %', SQLERRM;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'playing', 'away')),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS developers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publishers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS genres (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    appid INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    release_date DATE,
    developer_id BIGINT REFERENCES developers(id) ON DELETE SET NULL,
    publisher_id BIGINT REFERENCES publishers(id) ON DELETE SET NULL,
    rating DECIMAL(3,2),
    description TEXT,
    header_image_url VARCHAR(500),
    multiplayer BOOLEAN DEFAULT FALSE,
    windows BOOLEAN NOT NULL DEFAULT FALSE,
    mac BOOLEAN NOT NULL DEFAULT FALSE,
    linux BOOLEAN NOT NULL DEFAULT FALSE,
    mature BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_owners INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_genres (
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    genre_id BIGINT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE IF NOT EXISTS game_categories (
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, category_id)
);

CREATE TABLE IF NOT EXISTS game_developers (
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    developer_id BIGINT REFERENCES developers(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, developer_id)
);

CREATE TABLE IF NOT EXISTS wishlist (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0 CHECK (priority IN (0, 1, 2)),
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS backlog (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'wishlist'
        CHECK (status IN ('wishlist', 'playing', 'finished', 'abandoned')),
    play_time_min INTEGER DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    duration_min INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recensioni/voti degli utenti: scala 1-5, del tutto separata dalla
-- colonna games.rating (quella è importata da Steam, non scritta dagli
-- utenti). UNIQUE(user_id, game_id): una sola recensione per utente per
-- gioco — un nuovo invio aggiorna la propria, non ne crea un'altra.
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS friends (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    friend_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(5) DEFAULT 'en',
    colorblind_mode BOOLEAN DEFAULT FALSE,
    items_per_page INTEGER DEFAULT 20,
    show_wishlist BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_games_appid ON games(appid);
CREATE INDEX idx_games_name ON games(name);
CREATE INDEX idx_games_release_date ON games(release_date);
CREATE INDEX idx_games_rating ON games(rating);
CREATE INDEX idx_games_estimated_owners ON games(estimated_owners);
CREATE INDEX idx_games_developer ON games(developer_id);
CREATE INDEX idx_games_publisher ON games(publisher_id);
CREATE INDEX idx_game_genres_game ON game_genres(game_id);
CREATE INDEX idx_game_genres_genre ON game_genres(genre_id);
CREATE INDEX idx_game_categories_game ON game_categories(game_id);
CREATE INDEX idx_game_categories_cat ON game_categories(category_id);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_backlog_user ON backlog(user_id);
CREATE INDEX idx_backlog_user_status ON backlog(user_id, status);
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_reviews_game ON reviews(game_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Password per entrambi gli utenti demo: "password123"
-- (hash bcrypt generato con lo stesso BCryptPasswordEncoder usato dal backend)
