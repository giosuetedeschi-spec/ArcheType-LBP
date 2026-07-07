-- ArcheType-LBP Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Password per entrambi gli utenti demo: "password123"
-- (hash bcrypt generato con lo stesso BCryptPasswordEncoder usato dal backend)
INSERT INTO users (username, email, password) VALUES
    ('gamer_alice', 'alice@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_bob', 'bob@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe')
ON CONFLICT (username) DO NOTHING;

INSERT INTO developers (name) VALUES
    ('Valve'), ('CD Projekt Red'), ('FromSoftware'), ('Rockstar Games')
ON CONFLICT (name) DO NOTHING;

INSERT INTO publishers (name) VALUES
    ('Valve'), ('CD Projekt'), ('Bandai Namco'), ('Rockstar Games')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name) VALUES
    ('Action'), ('RPG'), ('Strategy')
ON CONFLICT (name) DO NOTHING;

-- Nomi allineati alla dicitura reale del dataset Steam ("Single-player",
-- "Multi-player" con trattino) per evitare doppioni quando lo stesso valore
-- viene reimportato dal CSV tramite populate_db.py (findOrCreate per nome).
INSERT INTO categories (name) VALUES
    ('Single-player'), ('Multi-player'), ('Co-op'), ('Open World')
ON CONFLICT (name) DO NOTHING;

INSERT INTO games (appid, name, price, release_date, developer_id, publisher_id, rating, description) VALUES
    (730, 'Counter-Strike 2', 0.00, '2012-08-21', 1, 1, 4.50, 'Counter-Strike 2 is the next chapter of the world''s favorite competitive FPS.'),
    (1086940, 'Baldur''s Gate 3', 59.99, '2023-08-03', 2, 2, 4.80, 'An epic RPG from the creators of Divinity: Original Sin 2.'),
    (1245620, 'ELDEN RING', 39.99, '2022-02-25', 3, 3, 4.70, 'A vast fantasy world crafted by Hidetaka Miyazaki and George R. R. Martin.'),
    (271590, 'Grand Theft Auto V', 29.99, '2013-09-17', 4, 4, 4.60, 'When a young street hustler, a retired bank robber and a terrifying psychopath find themselves entangled with some of the most frightening and deranged elements of the criminal underworld...'),
    (570, 'Dota 2', 0.00, '2013-07-09', 1, 1, 4.20, 'Every day, millions of players worldwide enter battle as one of over a hundred Dota heroes.')
ON CONFLICT (appid) DO NOTHING;

INSERT INTO game_genres (game_id, genre_id) VALUES
    (1, 1), (2, 2), (2, 1), (3, 2), (3, 1), (4, 1), (4, 3), (5, 3)
ON CONFLICT DO NOTHING;

INSERT INTO game_categories (game_id, category_id) VALUES
    (1, 2), (1, 3), (2, 1), (2, 3), (3, 1), (3, 4), (4, 1), (4, 2), (4, 4), (5, 2), (5, 3)
ON CONFLICT DO NOTHING;

INSERT INTO wishlist (user_id, game_id, priority) VALUES
    (1, 2, 2), (1, 3, 1)
ON CONFLICT DO NOTHING;

INSERT INTO backlog (user_id, game_id, status, play_time_min) VALUES
    (1, 1, 'playing', 1200),
    (1, 4, 'finished', 3600),
    (1, 5, 'abandoned', 45)
ON CONFLICT DO NOTHING;

INSERT INTO backlog (user_id, game_id, status, play_time_min) VALUES
    (2, 1, 'finished', 2400),
    (2, 2, 'playing', 800)
ON CONFLICT DO NOTHING;
