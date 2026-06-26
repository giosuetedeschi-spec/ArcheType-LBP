# Profilo Utente — Design Doc

## Contesto

Il model `User` ha dati (`username`, `email`, `avatarUrl`, `status`, `bio`) ma nessuna pagina li mostra né permette di modificarli. Issue #43 richiede la pagina Profilo.

**Goals:**
- Mostrare username, email, status, bio, avatar
- Permettere modifica (bio, status, avatarrare statistiche aggregate (giochi totali, ore, distribuzione per genere)
- Stile gamer coerente con il resto del sito

## Backend changes

### 1. Aggiornare `UserResponse`
Campi attuali: `id`, `username`, `email`, `createdAt`.
Da aggiungere: `avatarUrl`, `status`, `bio`.
Campo sensibibile (`password`) resta escluso.

### 2. Nuovo endpoint `PUT /api/users/{id}`
Body: `{ avatarUrl, status, bio }`.
Validazione: `status` ∈ `{online, offline, busy, away}` (max 20 chars).
Ritorna `UserResponse` aggiornato.

## Frontend changes

### Nuova route `/profile`

Layout:
```
┌──────────────────────────────────────────────────┐
│  ┌──────────┐  Username            [Edit]        │
│  │ Avatar   │  Status badge       Member since   │
│  │  128px   │  online · 42 games                 │
│  └──────────┘                                     │
├──────────────────────────────────────────────────┤
│  Stat cards:  Totali  Ore  In corso  Wishlist    │
├──────────────────────────────────────────────────┤
│  Bio section                                     │
│  ─────────────────────────────────────────────── │
│  Lorem ipsum dolor sit amet...                   │
├──────────────────────────────────────────────────┤
│  Distribuzione per genere (bar chart)            │
│  ██████████ FPS (12)                             │
│  ██████ RPG (8)                                  │
│  ████ Strategy (5)                               │
└──────────────────────────────────────────────────�
```

**Data fetching:**
- `userApi.get(USER_ID)` → info profilo
- `statsApi.get(USER_ID)` → statistiche (giochi per genere, totali)
- `userApi.update(USER_ID, body)` → aggiorna profilo

## File da creare/modificare

```
archetype-frontend/src/routes/profile.tsx       # NEW — main page
archetype-frontend/src/lib/api.ts               # MOD — add userApi.update
archetype-frontend/src/components/AppLayout.tsx  # MOD — add nav link
```

Ponytail: singono file route, nessun componente separato. Unico `useMutation` per PUT.

## Colori

Stessi token del sito:
- Avatar placeholder: gradient `--color-brand` → `--color-accent`
- Status badge: `--status-playing` per online, muted per offline
- Barre genere: palette ciclica (da `leaderboard.tsx`)

## Commit plan

1. `docs(profile): add user-profile design doc`
2. `feat(user-profile): add /profile route with stats, bio, genre chart`

## Rollback

Rimuovere `src/routes/profile.tsx` e il link nella navbar. Endpoint PUT in backend rimane.
