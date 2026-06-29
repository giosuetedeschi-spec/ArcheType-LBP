# Wishlist Page — Implementation

## Overview

The wishlist page shows games the user wants to buy. Each card has a game thumbnail, info, heart icon to remove, and a Steam cart link to buy.

**Wireframe reference**: `my frontend.jpeg` — Wishlist page with "Yes, Master" prompt, game cards (image, info, date), heart icon, Steam buy button.

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Wishlist                                                     │
│ "Yes, Master"                                                │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ [Game Image] │ │ [Game Image] │ │ [Game Image] │         │
│ │ Game Title   │ │ Game Title   │ │ Game Title   │         │
│ │ Developer    │ │ Developer    │ │ Developer    │         │
│ │ [♥] [🛒]    │ │ [♥] [🛒]    │ │ [♥] [🛒]    │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐                           │
│ │ [Game Image] │ │ [Game Image] │                           │
│ │ ...          │ │ ...          │                           │
│ └──────────────┘ └──────────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Elements

| Element | Source | Behavior |
|---------|--------|----------|
| Title | i18n `wishlist.title` | Static "Wishlist" |
| Subtitle | i18n `wishlist.yesMaster` | Italic motivational prompt |
| Game cards | Library store (status=wishlist) × Games API | Grid of cards |
| Game image | `game.headerImageUrl` | Thumbnail, gradient fallback |
| Game info | `game.name`, `game.developer` | Text |
| Date added | Library entry `addedAt` | Formatted date |
| Heart icon | Toggle button | Remove from wishlist (sets status=null) |
| Steam cart | `game.steamAppId` → external link | Opens Steam store in new tab |
| Empty state | When no wishlist games | Message + "Explore Catalog" link |

## Implementation Details

### Data Sources

| Data | Source | Cache |
|------|--------|-------|
| All games | `GET /api/games` | React Query `["games"]` |
| Wishlist entries | Zustand store `entries[id].status === "wishlist"` | localStorage |

The wishlist page cross-references the API games list with the local library store to find which games are wishlisted.

### Card Component

```tsx
<WishlistCard
  game={game}
  onRemove={() => setStatus(game.id, null)}
  onBuy={() => window.open(`https://store.steampowered.com/app/${game.steamAppId}/`, "_blank")}
/>
```

### Actions

| Action | Local State | API Call |
|--------|-------------|----------|
| Remove from wishlist | `setStatus(id, null)` | `DELETE /api/users/{id}/games/{id}` |
| Buy on Steam | External redirect | None (Steam handles purchase) |

### Edge Cases

| State | What Shows |
|-------|-----------|
| No wishlist games | Empty state + "Explore Catalog" link |
| Game removed from wishlist | Card disappears on next render |
| Game purchased on Steam | Next sync moves to backlog, removes from wishlist |
| Missing image | Gradient fallback |

## Related GitHub Issues

| Issue | Task | Relation |
|-------|------|----------|
| #47 | FE - Implementare pagina Wishlist | Direct implementation |
| #43 | FE - Implementare pagina Profilo | Profile links to wishlist |
| #37 | FE - Implementare la modalità Colorblind | Applied to wishlist cards |
| #48 | FE - Traduzione in più lingua | i18n keys used here |

## Tasks This Enables

- **Buy flow** → Steam redirect from wishlist card
- **Library sync** → Auto-remove from wishlist on Steam purchase detection
- **Profile page** → Wishlist preview section links here
