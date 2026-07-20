iltro Colore — Design Doc

## Contesto

Issue aggiuntivo: permettere di cercare/filtrare giochi per colore prevalente della copertina. Es. "giochi verdi" mostra tutti i giochi con copertina dominante nel verde.

## Backend

### 1. Tabella `game_colors`
Colonne: `steam_appid INT FK`, `dominant_color VARCHAR(12)` (es. "0,128,0")

### 2. Endpoint
- `GET /api/games/color/<color_name>` — Ritorna giochi per colore (green, red, blue, yellow, purple, orange, cyan, brown, pink, white, black)
- `GET /api/games/color/custom?r=0&g=128&b=0` — Filtra per RGB approssimativo (±30 per canale)

### 3. Logica
Il client invia un color name OU i tre canali RGB. Il server confronta
con il `dominant_color` calcolato durante lo seed/caricamento.
Per colore "nome" si usa un mapping prefissato (es. green → "50,205,50") con approssimazione.

## Frontend

### Componente nel catalog filter sidebar
Aggiungere un nuovo filtro "Colore" con:
- Swatches circolari cliccabili (11 colori palette)
- Nessun filtro = tutti i giochi
- Selezione multipla NON supportata (solo uno, semplicità)

### Route query parameter
`?color=green` — impostare il filtro dall'URL per sharing.

## Commit

1. `feat(color-filter): add color filter to catalog - backend + frontend`

## Ultima nota

Se `dominant_color` non è il formato giusto per un filtro RGB preciso,
si può creare una funzione SQL che decide la "colour bucket" con
una CASE WHEN sui range di RGB. Oppure usiamo un approccio "nearest color".
