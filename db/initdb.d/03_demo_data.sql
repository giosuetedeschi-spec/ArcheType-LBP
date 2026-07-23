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

-- header_image_url usa il CDN reale di Steam (stesso host/percorso dei valori
-- importati da populate_db.py) — su conflitto quella colonna non viene mai
-- aggiornata dal reimport CSV (vedi populate_db.py), quindi va popolata già
-- qui o resta NULL per sempre anche dopo un populate reale (issue #101).
INSERT INTO games (appid, name, price, release_date, developer_id, publisher_id, rating, description, header_image_url, windows, mac, linux) VALUES
    (730, 'Counter-Strike 2', 0.00, '2012-08-21', 1, 1, 4.50, 'Counter-Strike 2 is the next chapter of the world''s favorite competitive FPS.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg', TRUE, TRUE, TRUE),
    (1086940, 'Baldur''s Gate 3', 59.99, '2023-08-03', 2, 2, 4.80, 'An epic RPG from the creators of Divinity: Original Sin 2.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg', TRUE, TRUE, FALSE),
    (1245620, 'ELDEN RING', 39.99, '2022-02-25', 3, 3, 4.70, 'A vast fantasy world crafted by Hidetaka Miyazaki and George R. R. Martin.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg', TRUE, FALSE, FALSE),
    (271590, 'Grand Theft Auto V', 29.99, '2013-09-17', 4, 4, 4.60, 'When a young street hustler, a retired bank robber and a terrifying psychopath find themselves entangled with some of the most frightening and deranged elements of the criminal underworld...', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg', TRUE, FALSE, FALSE),
    (570, 'Dota 2', 0.00, '2013-07-09', 1, 1, 4.20, 'Every day, millions of players worldwide enter battle as one of over a hundred Dota heroes.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570/header.jpg', TRUE, TRUE, TRUE)
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

-- Utenti demo aggiuntivi, per popolare in modo realistico la pagina Amici
-- (ricerca, richieste in sospeso, lista amici con statistiche). Stessa
-- password "password123" di gamer_alice/gamer_bob. A differenza dei blocchi
-- sopra, qui si usano subquery per username/appid invece di id numerici
-- hardcoded: più robusto, non assume che l'auto-increment riparta sempre
-- dagli stessi valori.
INSERT INTO users (username, email, password) VALUES
    ('gamer_carlo', 'carlo@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_diana', 'diana@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_marco', 'marco@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_sara', 'sara@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_luca', 'luca@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_elena', 'elena@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_paolo', 'paolo@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_giulia', 'giulia@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_matteo', 'matteo@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe'),
    ('gamer_valentina', 'valentina@example.com', '$2a$10$T5SEaBOczJnj0xwJoBAh2O.90waCnYLX7UFScIpiFUZQZUjpv1Upe')
ON CONFLICT (username) DO NOTHING;

INSERT INTO backlog (user_id, game_id, status, play_time_min)
SELECT u.id, g.id, v.status, v.playtime
FROM (VALUES
    ('gamer_carlo',  730,     'playing',   1500),
    ('gamer_carlo',  1086940, 'finished',  4200),
    ('gamer_carlo',  1245620, 'wishlist',  0),
    ('gamer_diana',  1086940, 'playing',   900),
    ('gamer_diana',  271590,  'finished',  3000),
    ('gamer_diana',  570,     'abandoned', 120),
    ('gamer_marco',  1245620, 'playing',   2200),
    ('gamer_marco',  730,     'finished',  1800),
    ('gamer_marco',  570,     'wishlist',  0),
    ('gamer_sara',   271590,  'playing',   600),
    ('gamer_sara',   1086940, 'wishlist',  0),
    ('gamer_sara',   730,     'finished',  2500),
    ('gamer_luca',   570,     'playing',   3300),
    ('gamer_luca',   1245620, 'finished',  5000),
    ('gamer_luca',   271590,  'wishlist',  0),
    ('gamer_elena',  730,     'playing',   450),
    ('gamer_elena',  570,     'finished',  1600),
    ('gamer_elena',  1086940, 'abandoned', 90),
    ('gamer_paolo',  1086940, 'playing',   1200),
    ('gamer_paolo',  271590,  'wishlist',  0),
    ('gamer_paolo',  1245620, 'finished',  2800),
    ('gamer_giulia', 1245620, 'playing',   1900),
    ('gamer_giulia', 570,     'finished',  700),
    ('gamer_giulia', 730,     'wishlist',  0),
    ('gamer_matteo', 271590,  'playing',   1100),
    ('gamer_matteo', 730,     'abandoned', 300),
    ('gamer_matteo', 570,     'wishlist',  0),
    ('gamer_valentina', 570,     'playing',   2000),
    ('gamer_valentina', 271590,  'finished',  1400),
    ('gamer_valentina', 1245620, 'abandoned', 60)
) AS v(username, appid, status, playtime)
JOIN users u ON u.username = v.username
JOIN games g ON g.appid = v.appid
ON CONFLICT (user_id, game_id) DO NOTHING;

-- 5 amicizie accettate per gamer_alice (che ha già gamer_bob, per un totale
-- di 6): bidirezionali, una riga per lato, come richiede il modello reale
-- (vedi FriendService.java — updateStatus crea sempre la riga reciproca).
INSERT INTO friends (user_id, friend_id, status)
SELECT a.id, b.id, 'accepted' FROM users a, users b
WHERE a.username = 'gamer_alice' AND b.username IN
    ('gamer_carlo', 'gamer_diana', 'gamer_marco', 'gamer_sara', 'gamer_luca')
ON CONFLICT DO NOTHING;

INSERT INTO friends (user_id, friend_id, status)
SELECT b.id, a.id, 'accepted' FROM users a, users b
WHERE a.username = 'gamer_alice' AND b.username IN
    ('gamer_carlo', 'gamer_diana', 'gamer_marco', 'gamer_sara', 'gamer_luca')
ON CONFLICT DO NOTHING;

-- Richieste pending di esempio tra altri utenti (una sola riga, come le
-- crea davvero addFriend: solo il mittente ha la riga finché non accettata
-- — utile per testare la sezione "richieste ricevute" della pagina Amici).
INSERT INTO friends (user_id, friend_id, status)
SELECT s.id, r.id, 'pending' FROM users s, users r
WHERE (s.username = 'gamer_elena' AND r.username = 'gamer_paolo')
   OR (s.username = 'gamer_giulia' AND r.username = 'gamer_matteo')
   OR (s.username = 'gamer_valentina' AND r.username = 'gamer_carlo')
ON CONFLICT DO NOTHING;

-- Avatar segnaposto per gli utenti demo sopra, con la stessa logica
-- deterministica della registrazione reale (UserService.buildCatAvatarUrl
-- e scripts/seed_test_data.py: ?lock=<id> restituisce sempre lo stesso
-- gatto per quell'id). Gli INSERT sopra non impostano avatar_url perché
-- l'id è assegnato solo dopo l'insert stesso; senza questo backfill, ogni
-- avvio a volume vuoto lascia gli utenti demo senza foto (solo cerchio a
-- iniziale) finché non si lancia manualmente scripts/seed_test_data.py.
UPDATE users
SET avatar_url = 'https://loremflickr.com/200/200/cat?lock=' || id
WHERE avatar_url IS NULL OR avatar_url = '';