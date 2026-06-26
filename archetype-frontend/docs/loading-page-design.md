# Loading Page — Design Doc

## Contesto

Issue #38 richiede una pagina di caricamento. Attualmente TanStack Router gestisce il loading con `Loader2` spinner basilare. Vogliamo una landing/loading page animata che dia il benvenuto prima del redirect alla dashboard.

## Obiettivo

Una **splash screen** animata che:
1. Appare al primo caricamento (o dopo login)
2. Dura 2-3 secondi con animazioni fluida
3. Redirige automaticamente alla homepage
4. Cliccabile per saltare
5. Usa palette + animazioni già definite (gradient, glow)

## Tecnica

Una singola route `/loading` con:
- Background: `body::before` gradient shift già attivo (ereditato da `data-animations`)
- Logo centrato: Gamepad2 icon con `glow-pulse` animation
- Testo "SteamStats" con stagger lettere (opzionale, glow)
- Barra di progresso animata (width 0→100% in 2.5s)
- Auto-redirect con `useEffect` + `useNavigate` dopo 2.5s o click
- Link "Entra" per skip

## Layout

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│              [Gamepad2 icon glowing]             │
│                                                  │
│                 SteamStats                       │
│           La tua collezione gaming              │
│                                                  │
│         ████████████████████████░░░░             │
│                                                  │
│                  [Entra →]                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Files

- `archetype-frontend/src/routes/loading.tsx` — NEW
- `archetype-frontend/src/routes/__root.tsx` — MOD — redirect `/loading` → `/` dopo animazione

## Animazioni

- Logo: `glow-pulse` (già in glow.css)
- Barra progresso: CSS width transition `transition: width 2.5s ease-out`
- Background: `gradient-shift` ereditato da body::before
- Sfondo orbs: `orb-drift` per profondità

## Colori

- Brand: vivid-royal `#141aad`
- Accent: golden-glow `#ead94c`
- Testo: foreground standard
- Barra: gradient brand→accent

## Commit

1. `feat(loading): add animated splash/loading page with auto-redirect`

## Nota

Questa non è una "loading state" per le route — quella resta TanStack. � una landing iniziale che dà atmosfera gaming.
