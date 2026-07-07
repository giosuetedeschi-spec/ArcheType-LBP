# Perche' e come usare Supabase come backend di ArcheType-LBP

## Indice
1. [Cos'e' Supabase](#cosè-supabase)
2. [Perche' Supabase per ArcheType-LBP](#perché-supabase-per-archetype-lbp)
3. [Confronto: Spring Boot + PostgreSQL vs Supabase](#confronto-spring-boot--postgresql-vs-supabase)
4. [Architettura con Supabase](#architettura-con-supabase)
5. [Come migrare da PostgreSQL a Supabase](#come-migrare-da-postgresql-a-supabase)
6. [Configurazione](#configurazione)
7. [Sicurezza e RLS](#sicurezza-e-rls)
8. [Real-time](#real-time)
9. [Deploy](#deploy)
10. [Pro e Contro](#pro-e-contro)
11. [Decisione raccomandata](#decisione-raccomandata)

---

## Cos'e' Supabase

Supabase e' una piattaforma **Backend-as-a-Service (BaaS)** open-source costruita su PostgreSQL. Offre:

- **Database PostgreSQL** gestito (con estensioni)
- **Autenticazione** (email/password, OAuth, magic link, SSO)
- **API REST e GraphQL** auto-generate dal database
- **Realtime** (WebSocket) per aggiornamenti in tempo reale
- **Storage** per file/blob
- **Edge Functions** (Deno/TypeScript) per logica serverless
- **Row Level Security (RLS)** per permessi granulari

Alternativa open-source a Firebase, ma con SQL invece di NoSQL.

---

## Perche' Supabase per ArcheType-LBP

ArcheType-LBP e' un'applicazione per gestire una libreria giochi (collegamento Steam, wishlist, stato giochi). Lo stack attuale e':

- **Backend**: Java Spring Boot (complesso, overhead alto)
- **Database**: PostgreSQL 17 (self-hosted)
- **Frontend**: React/Next.js con Nginx

**Problemi dello stack attuale:**
1. Spring Boot richiede molta RAM (~501MB+ per un'app base)
2. Il backend Java e' sovrastrutturato per un CRUD semplice
3. Deploy complesso (JAR + JVM + container)
4. Autenticazione da zero (JWT, sessioni, hashing password)
5. API REST manuale (controller, service, repository per ogni entita)
6. Niente real-time nativo

**Vantaggi di Supabase:**
1. **Elimina il backend Java**: le API REST/GraphQL sono auto-generate
2. **Auth integrata**: login, registrazione, OAuth (Google, GitHub) in 5 righe
3. **Real-time**: WebSocket nativo per aggiornamenti live
4. **Meno codice**: niente controller, service, repository
5. **Deploy semplice**: frontend statico + Supabase cloud
6. **Gratuito**: tier generoso (500MB DB, 50K auth users, 2GB bandwidth)

---

## Confronto: Spring Boot + PostgreSQL vs Supabase

| Aspetto | Spring Boot + PostgreSQL | Supabase |
|---------|-------------------------|----------|
| RAM necessaria | ~512MB (JVM) | 0 (serverless) |
| Tempo setup | Giorni | Minuti |
| API REST | Scritte a mano | Auto-generate |
| Autenticazione | JWT da zero | Integrata |
| Real-time | Da implementare | Nativo |
| Deploy | Docker + Vercel/Railway | Frontend statico |
| Complessita' | Alta | Bassa |
| Vendor lock-in | No | Medio (ma e' open-source) |
| SQL pieno | Si | Si (e' PostgreSQL) |
| Costo | Vercel Pro + Railway | Free tier |

---

## Architettura con Supabase

```
+------------------+       +------------------+       +------------------+
|                  |       |                  |       |                  |
|   Frontend       |<----->|    Supabase      |<----->|   PostgreSQL     |
|   (Next.js)      |  API  |    (BaaS)        |  SQL  |   (gestito)      |
|                  |       |                  |       |                  |
+------------------+       +------------------+       +------------------+
                                  |
                          +------------------+
                          |                  |
                          |  Auth            |
                          |  (email, OAuth)  |
                          |                  |
                          +------------------+
                                  |
                          +------------------+
                          |                  |
                          |  Realtime        |
                          |  (WebSocket)     |
                          |                  |
                          +------------------+
```

Il backend Spring Boot viene **completamente eliminato**. Il frontend comunica direttamente con Supabase.

---

## Come migrare da PostgreSQL a Supabase

### Step 1: Creare il progetto Supabase
1. Verci su supabase.com, crea progetto
2. Ottieni URL e chiavi API (anon + service_role)

### Step 2: Migrare lo schema
Lo schema attuale (users, games, user_games) si ricrea identico:

```sql
-- In Supabase SQL Editor
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    steam_app_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    release_date DATE,
    developer VARCHAR(255),
    publisher VARCHAR(255),
    price DECIMAL(10,2),
    rating DECIMAL(3,2),
    genres TEXT,
    description TEXT,
    header_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_games (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'wishlist'
        CHECK (status IN ('wishlist', 'playing', 'finished', 'abandoned')),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);
```

### Step 3: Abilitare RLS
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
```

### Step 4: Sostituire il frontend
Da chiamate API a Spring Boot a chiamate Supabase client:

```typescript
// Prima (Spring Boot)
const res = await fetch('http://localhost:8080/api/games');
const games = await res.json();

// Dopo (Supabase)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data: games } = await supabase.from('games').select('*');
```

---

## Configurazione

### Variabili ambiente frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Installazione client
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Client Supabase (lib/supabase.ts)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Esempi operazioni CRUD
```typescript
// Login
await supabase.auth.signInWithPassword({ email, password });

// Registrazione
await supabase.auth.signUp({ email, password });

// Lista giochi
const { data } = await supabase.from('games').select('*');

// Aggiungi a wishlist
await supabase.from('user_games').insert({
    user_id: user.id,
    game_id: gameId,
    status: 'wishlist'
});

// Aggiorna stato
await supabase.from('user_games')
    .update({ status: 'playing' })
    .eq('user_id', user.id)
    .eq('game_id', gameId);
```

---

## Sicurezza e RLS

Row Level Security (RLS) garantisce che ogni utente veda SOLO i propri dati:

```sql
-- Ogni utente vede solo il proprio profilo
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Ogni utente gestisce solo i propri giochi
CREATE POLICY "Users can manage own games"
    ON user_games FOR ALL
    USING (auth.uid() = user_id);

-- I giochi sono pubblici (tutti possono leggerli)
CREATE POLICY "Games are public"
    ON games FOR SELECT
    USING (true);
```

Con RLS, anche se un utente manipola il client, NON puo' accedere ai dati di altri utenti.

---

## Real-time

Supabase offre WebSocket nativo. Per esempio, aggiornare la wishlist in tempo reale:

```typescript
// Ascolta cambiamenti in tempo reale
supabase
    .channel('user-games')
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_games',
        filter: `user_id=eq.${user.id}`
    }, (payload) => {
        console.log('Cambiamento!', payload);
        // Aggiorna UI
    })
    .subscribe();
```

Utile per: notifiche, aggiornamenti live della libreria, sincronizzazione tra tab.

---

## Deploy

### Opzione A: Supabase Cloud (piu' semplice)
1. Frontend: deploy su Vercel (gratuito)
2. Backend: Supabase cloud (free tier)
3. Database: incluso in Supabase

### Opzione B: Supabase Self-Hosted (su Proxmox)
1. Creare CT con Docker
2. Seguire la guida self-hosted di Supabase
3. Frontend su stesso CT o separato

### Opzione C: Ibrida
1. Supabase cloud per auth + database
2. Edge Functions per logica custom
3. Frontend su Vercel

---

## Pro e Contro

### Pro
- Elimina il backend Java (meno RAM, meno complessita')
- Auth integrata (zero codice per login/registrazione)
- API auto-generate (zero codice per CRUD)
- Real-time nativo
- Tier gratuito generoso
- Open-source (puoi self-hostare)
- PostgreSQL pieno (niente limiti NoSQL)

### Contro
- Vendor lock-in (ma e' open-source, puoi migrare)
- Meno flessibile di un backend custom per logica complessa
- Latenza leggermente maggiore (API REST vs connessione diretta)
- Dipendenza da servizio esterno (se usi cloud)

---

## Decisione raccomandata

Per ArcheType-LBP, **Supabase e' la scelta migliore** perche':

1. L'app e' un CRUD semplice (gestione libreria giochi)
2. Non serve logica backend complessa
3. L'auth e' gia' inclusa (login/registrazione utenti)
4. Il real-time e' un valore aggiunto (aggiornamenti live)
5. Il deploy e' piu' semplice (solo frontend + Supabase)
6. Il costo e' zero (free tier sufficiente)

**Migrazione consigliata:**
1. Crea progetto Supabase
2. Ricrea lo schema (identico a quello attuale)
3. Abilita RLS
4. Riscrivi il frontend per usare Supabase client
5. Elimina il backend Spring Boot
6. Deploy su Vercel

Tempo stimato: 2-4 ore per la migrazione completa.


---
*Last project status update: 2026-07-03*