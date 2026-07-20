-- Supporto login Steam, issue #102 / docs/OAUTH_LOGIN_PLAN.md.
-- password diventa opzionale: un account creato via Steam non ne ha una
-- propria (fa login tramite il provider), a differenza degli account
-- registrati col form classico che continuano ad averla obbligatoria a
-- livello applicativo (validata in AuthController/UserService, non qui).
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Indipendente da password: un utente può avere entrambe, il collegamento
-- Steam non è esclusivo. Steam non ha email, quindi il collegamento avviene
-- solo come azione esplicita da un account già autenticato ("Collega
-- Steam" nel Profilo), mai per auto-match al login — vedi
-- docs/OAUTH_LOGIN_PLAN.md per il ragionamento completo. steam_id =
-- SteamID64.
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id)
    WHERE steam_id IS NOT NULL;
