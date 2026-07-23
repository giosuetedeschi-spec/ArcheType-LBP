-- Backfill per utenti già esistenti senza avatar_url (creati prima che
-- UserService.buildCatAvatarUrl assegnasse sempre una foto, o inseriti da
-- db/initdb.d/03_demo_data.sql, che popola solo i dati per un volume
-- Postgres nuovo). A differenza di initdb.d, una migrazione Flyway viene
-- applicata anche ai database già esistenti al prossimo avvio del backend,
-- quindi risolve il problema per chi ha già un volume popolato (es. dopo
-- un `git pull`, senza bisogno di un `docker compose down -v`).
UPDATE users
SET avatar_url = 'https://loremflickr.com/200/200/cat?lock=' || id
WHERE avatar_url IS NULL OR avatar_url = '';
