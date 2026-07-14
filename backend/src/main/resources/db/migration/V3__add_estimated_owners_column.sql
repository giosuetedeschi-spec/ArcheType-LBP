-- Aggiunta colonna estimated_owners per ordinamento per popolarita' (PR #212)
ALTER TABLE games ADD COLUMN IF NOT EXISTS estimated_owners INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_games_estimated_owners ON games(estimated_owners);
