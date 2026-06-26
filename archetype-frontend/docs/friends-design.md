# Friends — Design Doc

## Contesto

Issue #42 richiede la pagina Amici. Il model `Friend` e `FriendRepository` esistono già in backend ma mancano controller, service e frontend. L'amicizia è bidirezionale: user → friend con stato `pending`.

## Backend design

### Endpoints

| Method | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/api/users/{userId}/friends` | Lista amici (accepted) |
| `GET` | `/api/users/{userId}/friends/pending` | Richieste in sospeso |
| `POST` | `/api/users/{userId}/friends` | Invia richiesta (body: `{ friendId }`) |
| `PUT` | `/api/users/{userId}/friends/{friendId}` | Accetta/rifiuta (body: `{ action: "accept" \| "reject" }`) |
| `DELETE` | `/api/users/{userId}/friends/{friendId}` | Rimuovi amico |

### DTO

- `FriendRequest` — `friendId` (richiesta), `action` (accept/reject)
- `FriendResponse` — `friendId`, `username`, `avatarUrl`, `status`, `createdAt` (nessun campo sensibile)

### Validazione
- Non puoi aggiungere te stesso
- Non puoi duplicare una richiesta esistente
- `friendId` deve corrispondere a un utente esistente

## Frontend design

### Route `/friends`

```
┌──────────────────────────────────────────────────┐
│  Amici                              [+ Aggiungi]  │
├──────────────────────────────────────────────────�
│  Tab: [Amici] [Richieste]                         │
├──────────────────────────────────────────────────┤
│  ┌──┐ Player_2          online    [Rimuovi]      │
│  │P2│ Member since Mar 2026                     │
│  └──┘                                            │
│  ┌──┐ Gamer_X         away      [Rimuovi]       │
│  │GX│ 42 games · 120h played                    │
│  └──�                                            │
├──────────────────────────────────────────────────┤
│  (quando tab "Richieste")                         │
│  ┌──┐ Wants_play     [Accetta] [Rifiuta]      │
│  │Wp│ New member                                │
│  └──�                                            │
└──────────────────────────────────────────────────┘
```

**Data fetching:**
- `GET /api/users/{userId}/friends` → lista amici
- `GET /api/users/{userId}/friends/pending` → richieste
- Mutations: POST aggiungi, PUT accetta/rifiuta, DELETE rimuovi

## Files to create/modify

### Backend
- `backend/.../controller/FriendController.java` — NEW
- `backend/.../dto/FriendRequest.java` — NEW
- `backend/.../dto/FriendResponse.java` — NEW
- `backend/.../service/FriendService.java` — NEW

### Frontend
- `archetype-frontend/src/routes/friends.tsx` — NEW
- `archetype-frontend/src/lib/api.ts` — MOD — add friendsApi
- `archetype-frontend/src/components/AppLayout.tsx` — MOD — add nav link

## Commit plan

1. `docs(friends): add friends feature design doc`
2. `feat(backend): add FriendController + FriendService + DTOs`
3. `feat(friends): add /friends route with list, requests, add modal`

## Color palette

- Status dot: online=green, offline=muted, busy=red, away=gold
- Accept button: brand color
- Reject button: destructive
- Cards: card-surface standard
