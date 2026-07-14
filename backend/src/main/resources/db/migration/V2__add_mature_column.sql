-- Aggiunta colonna mature per filtrare contenuti adulti (PR #208)
ALTER TABLE games ADD COLUMN IF NOT EXISTS mature BOOLEAN NOT NULL DEFAULT FALSE;
