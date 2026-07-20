-- Filtro colore (design doc: virtualz-frontend/docs/color-filter-design.md).
-- Tre colonne INT invece di un'unica stringa CSV "r,g,b" come proposto nel
-- doc: il doc stesso segnala che il formato CSV non si presta a un filtro
-- per range (servirebbe un parsing SQL ad hoc) -- con colonne numeriche
-- separate un BETWEEN per canale nella Specification JPA basta.
ALTER TABLE games ADD COLUMN IF NOT EXISTS color_r SMALLINT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS color_g SMALLINT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS color_b SMALLINT;

CREATE INDEX IF NOT EXISTS idx_games_color ON games(color_r, color_g, color_b);

-- Colore dominante approssimativo per i 5 giochi demo del seed (V1), a
-- occhio dalla cover reale -- non c'è ancora un job che calcola il colore
-- dominante vero dalle immagini per l'import di massa (scripts/populate_db.py),
-- resta un TODO separato.
UPDATE games SET color_r = 255, color_g = 140, color_b = 0   WHERE appid = 730;      -- Counter-Strike 2 (arancione)
UPDATE games SET color_r = 178, color_g = 34,  color_b = 34  WHERE appid = 1086940;  -- Baldur's Gate 3 (rosso)
UPDATE games SET color_r = 139, color_g = 69,  color_b = 19  WHERE appid = 1245620;  -- ELDEN RING (marrone)
UPDATE games SET color_r = 128, color_g = 0,   color_b = 128 WHERE appid = 271590;   -- GTA V (viola)
UPDATE games SET color_r = 178, color_g = 34,  color_b = 34  WHERE appid = 570;      -- Dota 2 (rosso)
