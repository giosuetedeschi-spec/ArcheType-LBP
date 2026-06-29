# VirtualZ Frontend — proposta alternativa

Frontend alternativo a `archetype-frontend/`, stesso backend
(ArcheType-LBP), stack tecnico compatibile (TanStack Router/Query,
stessa lettura della busta `{success, data, message}`), brand e colori
propri (VirtualZ).

## Perché esiste

Sviluppato in parallelo da Marguerite, con l'obiettivo di restare
tecnicamente compatibile con il backend del team senza richiedere
modifiche al backend stesso. Stack:

- React + TypeScript (parziale: strato dati tipizzato, pagine ancora .jsx)
- TanStack Router + TanStack Query
- Axios (con interceptor che spacchetta automaticamente la busta del backend)
- Tailwind CSS, palette/brand VirtualZ

## Come provarlo

```bash
cd virtualz-frontend
npm install
npm run dev
```

Richiede il backend attivo su `localhost:8080` (vedi `docker-compose.yml`
nella radice del repo). Variabile d'ambiente opzionale:
`VITE_API_BASE_URL` (default: `http://localhost:8080`).

## Stato attuale, onestamente

- ✅ Home, Catalogo: testati contro il backend reale, funzionanti
- ✅ Libreria/Backlog: endpoint e bug (entry.id vs game.id) corretti e verificati con build
- ⚠️ Login/Registrazione: non funzionano — il backend non ha ancora
  autenticazione implementata (endpoint `/auth/login` risponde 500)
- ⚠️ Classifiche, Amici: pagine segnaposto, non ancora collegate a dati reali
- ⚠️ Solo lo strato dati (services/, 2 Context) è tipizzato in TypeScript;
  pagine e componenti visivi sono ancora `.jsx`

## Decisione da prendere insieme

Questa PR non sostituisce `archetype-frontend/` — propone un'alternativa
da valutare. Il team decide se: tenere entrambi temporaneamente, fondere
le parti migliori di ciascuno, o scegliere uno dei due come definitivo.
