# Game Detail Page — Implementation

## Overview

The game detail page is the central hub for a single game. It shows game info, rating, tags, wishlist toggle, play time tracking, and the "Buy on Steam" CTA.

**Wireframe reference**: `my frontend.jpeg` — Game Page shows title, rating, tags, wishlist toggle, Back button, user account played hours, "funny graphs".

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]                                                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              [Cover Image Banner]                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────┐ ┌──────────────────────────┐   │
│  │ [Genre] [Genre] · 2022  │ │ My Library               │   │
│  │ Game Title Here        │ │                          │   │
│  │                        │ │ [Wishlist][Playing]      │   │
│  │ Long description text  │ │ [Finished][Abandoned]    │   │
│  │ that wraps multiple    │ │                          │   │
│  │ lines...               │ │ [♥ Wishlist]             │   │
│  │                        │ │                          │   │
│  │ ★★★★☆ 4.5/5.0         │ │ Played Hours: [____]     │   │
│  │ €29.99  [🛒 Buy Steam]  │ │ [🗑 Remove]             │   │
│  └────────────────────────┘ └──────────────────────────┘   │
│                                                              │
│  [📊 Funny Graphs section — Recharts placeholder]           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Elements

| Element | Source | Behavior |
|---------|--------|----------|
| Cover image | `game.headerImageUrl` | Full-width banner, gradient fallback |
| Title | `game.name` | H1, large bold |
| Genres | `game.genres` (comma-separated → split) | Tag chips |
| Release date | `game.releaseDate` | Text alongside developer |
| Developer | `game.developer` | Text |
| Description | `game.description` | Paragraph |
| Rating | `game.rating` | Stars + numeric /5.0 |
| Price | `game.price` | Formatted € or "Free" |
| Buy on Steam | `game.steamAppId` → `store.steampowered.com/app/{id}` | External link, new tab, Steam-themed button |
| Status buttons | 4-state: wishlist/playing/finished/abandoned | Visual active state |
| Wishlist toggle | Heart icon toggle | Add/remove from wishlist |
| Played hours | Library store | Number input, min=0 |
| Remove | Delete icon | Removes from library entirely |
| Funny graphs | Placeholder for Recharts | Separate section below |

## Implementation Details

### API Calls

| When | Endpoint | Purpose |
|------|----------|---------|
| Page load | `GET /api/games/{id}` | Fetch game details |
| Page load | (local state) | Get library entry from Zustand store |
| Status click | (local) | Update Zustand store → calls `POST /api/users/{id}/games` |
| Wishlist toggle | (local) | Update Zustand store |
| Played hours | (local) | Update Zustand store → calls `PUT /api/users/{id}/games/{id}` |

### State Management

- **Server state**: Game details fetched via `useQuery` (cached by game ID)
- **Local state**: Library entries in Zustand store (persisted to localStorage)
- Sync strategy: Zustand store is source of truth for "ownership"; backend sync happens async

### Buy Button

```tsx
<a
  href={`https://store.steampowered.com/app/${game.steamAppId}/`}
  target="_blank"
  rel="noopener noreferrer"
  className="bg-[#1b2838] text-white hover:bg-[#2a475e]"
>
  🛒 Buy on Steam
</a>
```

Styled to match Steam's brand colors (`#1b2838` dark, `#2a475e` hover).

### Edge Cases

| State | What Shows |
|-------|-----------|
| Not in library | No status active, no hours input, no remove button |
| In wishlist only | Status "wishlist" active, heart filled |
| Playing/finished/abandoned | Status active, hours shown, remove visible |
| Free game | Price shows "Free", Buy button says "Free on Steam" |
| Missing image | Gradient fallback with brand colors |

## Related GitHub Issues

| Issue | Task | Status |
|-------|------|--------|
| #43 | FE - Implementare pagina Profilo | Profile has game links |
| #46 | FE - Implementare pagina Grafici di utilizzo | "Funny graphs" on game page |
| #34 | FE - Verificare che tutti i filtri siano intuitivi | Filters affect catalog → leads here |
| #35 | FE - Login immediato | Landing here after login |

## Tasks This Enables

- **Buy on Steam flow** → Links to Steam store
- **Library tracking** → All status changes from this page
- **Wishlist integration** → Heart toggle feeds wishlist page
- **Play time tracking** → Feeds stats/charts
