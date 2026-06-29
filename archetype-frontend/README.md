# Color Palette Pages (SteamStats)

Dashboard per il tracking del backlog Steam. Catalogo giochi con filtri avanzati, gestione stato (playing/finished/abandoned/wishlist), e pagina dettaglio per ogni gioco.

## Funzionalità

- **Dashboard**: panoramica giochi in corso, finiti, abbandonati, wishlist
- **Catalogo**: lista completa con filtri per genere, prezzo, anno, piattaforma, rating
- **Dettaglio gioco**: pagina dedicata con info complete
- **Libreria personale**: salva lo stato dei giochi (playing/finished/abandoned/wishlist)
- **Design**: stile Pop Art con colori vivaci e ombrette nere

## Stack

- TanStack Start (React + SSR)
- TypeScript
- Tailwind CSS v4
- TanStack Router (file-based)
- Bun (package manager)

## Setup

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # Build produzione
```

## Struttura

```
src/
├── routes/
│   ├── index.tsx         # Dashboard
│   ├── catalog.tsx       # Catalogo con filtri
│   ├── game.$id.tsx      # Dettaglio gioco
│   └── library.tsx       # Libreria personale
├── components/
│   ├── AppLayout.tsx     # Layout principale
│   ├── GameCard.tsx      # Card gioco
│   ├── StatusBadge.tsx   # Badge stato
│   └── CatalogFilters.tsx # Filtri catalogo
├── lib/
│   ├── games-data.ts     # Dati giochi (mock)
│   └── library-store.ts  # Stato libreria (Zustand)
└── styles.css            # Tema + variabili CSS
```

## Routes

| Path | Descrizione |
|------|-------------|
| `/` | Dashboard con riepilogo |
| `/catalog` | Catalogo completo con filtri |
| `/game/:id` | Dettaglio singolo gioco |
| `/library` | Libreria personale |
