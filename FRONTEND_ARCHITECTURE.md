# Frontend Architecture & Flow — ArcheType-LBP

## Overview

The frontend is a React SPA built with Vite, TypeScript, and Tailwind CSS. It communicates with the Spring Boot backend via REST API calls.

**Wireframe source**: `my frontend.jpeg` — paper wireframe sketches showing the exact screen flow.

## Screen Flow (from wireframe)

```
Loading Page
    │
    ▼ (auto-redirect)
Login Page
    │ [Steam OAuth] [Google OAuth]
    ▼
Home Page
    │ [Game card click] ──────────────────────► Game Page
    │ [Game card click] ──────────────────────► Game Page
    │ [Search] [Filters] [Tags] [Grid/Cards]
    │ [Profile icon click]
    ▼
User Profile
    │ [Click "wishlist"]
    ▼
Wishlist Page
    │ [Game card] [Heart icon] [Steam buy link]
    ▼
Leaderboard (Classifiche)
    │ [Friends ranking] [Highscore] [Stats]
```

## Detailed Screen Descriptions

### 1. Loading Page
- Centered logo placeholder
- Auto-redirects to Login after check

### 2. Login Page
- Logo placeholder
- "Welcome" header
- **Steam sign-in button** (primary)
- **Google sign-in button**
- Error display field (hidden by default)

### 3. Home Page (Dashboard)
- **Top nav**: Search bar (center), Profile shortcut (right)
- **Hero section**: "What to play?" header
- **Layout toggle**: Grid view / Cards view
- **Filters panel**: Expandable filter chips
- **Tags**: Quick-filter tags as toggle buttons
- **Game cards grid**: Clickable → navigates to Game Page

### 4. Game Page
- Game title
- Rating/stars (vote)
- Tags display
- **Wishlist toggle button**: Add/remove from wishlist
- **Back button**: Return to previous page
- **User account section**: Played hours
- **"Funny graphs"**: Interactive data breakdowns (charts)

### 5. User Profile
- Status indicator: "Ready" / "Playing" / custom
- Wishlist preview section
- Custom analytical graphs (Graph 1, Graph 2)
- Click trigger: "click profile to wish list" → Wishlist page
- Friend profiles clickable → navigate to friend profile

### 6. Wishlist Page
- Header: "Wishlist" title
- **"Yes, Master" prompt** (maybe a motivational/random prompt)
- Game item cards layout:
  - Game image (thumbnail)
  - Little game info (title, developer, genres)
  - Date added
  - Heart icon (add/remove from favorites)
  - Direct button: "Open in Steam" (external link)

### 7. Leaderboard (Classifiche)
- Top rankings among friends
- Sections: Highscore, "boss!", "Top 1 Friends"
- Score statistics (e.g., 91%)
- Friend profile links

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18+ | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | latest | Component library (Radix-based) |
| React Router | 6.x | Client-side routing |
| Recharts | latest | Charts (funny graphs on Game Page) |
| Sonner | latest | Toast notifications |
| Zustand | latest | Local state (library store, user prefs) |
| TanStack Query | latest | Server state, caching |
| Bun | 1.x | Package manager |

## Color Palette (from Palette colori proposta.md)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Vivid Royal | `#141aad` | rgb(20, 26, 173) | Primary actions, links, brand |
| Midnight Violet | `#32213a` | rgb(50, 33, 58) | Backgrounds, dark surfaces |
| Golden Glow | `#ead94c` | rgb(234, 217, 76) | Accents, highlights, stars/ratings |
| Tangerine Dream | `#ff9b71` | rgb(255, 155, 113) | CTAs, warnings, active states |

## Component Hierarchy

```
App
├── LoadingPage
├── LoginPage
├── AppLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── SearchBar
│   │   └── ProfileShortcut
│   ├── NavLinks
│   └── Footer
├── HomePage
│   ├── WelcomeBanner ("What to play?")
│   ├── LayoutToggle (Grid/Cards)
│   ├── FiltersPanel
│   ├── TagsRow
│   └── GameGrid → GameCard[]
├── GamePage
│   ├── GameHeader (image + title)
│   ├── RatingStars
│   ├── TagsDisplay
│   ├── WishlistToggle
│   ├── BackButton
│   ├── UserAccountSection (played hours)
│   └── FunnyGraphs (recharts)
├── ProfilePage
│   ├── Avatar + Status
│   ├── WishlistPreview
│   ├── AnalyticalGraphs (Graph1, Graph2)
│   └── FriendLinks
├── WishlistPage
│   ├── Title + YesMaster prompt
│   └── WishlistItem[] (img, info, date, heart, Steam link)
└── LeaderboardPage
    ├── Highscore section
    ├── Boss section
    ├── Top1Friends section
    └── ScoreStats
```

## API Integration

### API Client Types (matching backend DTOs)

```typescript
// GET /api/games → list all games
// GET /api/games/filter → filtered + paginated
// GET /api/games/{id} → single game detail
// GET /api/users/{id}/stats → user statistics
// GET /api/users/{id}/games → user backlog
// POST /api/users/{id}/games → add to backlog
// PUT /api/users/{id}/games/{id} → update status
// DELETE /api/users/{id}/games/{id} → remove from backlog
```

### State Management

| Layer | Tool | What it manages |
|---|---|---|
| Server State | TanStack Query | API data, caching, refetching |
| UI State | React useState/useReducer | Modals, sidebar toggle, filters |
| Global State | React Context | Auth, theme, user preferences |
| Local Store | Zustand + persist | Library status, user game data |
| Form State | React Hook Form + Zod | Form validation |

## Responsive Design

| Breakpoint | Layout |
|---|---|
| Mobile (< 640px) | Single column, hamburger menu, filters in bottom sheet |
| Tablet (640-1024px) | Collapsible sidebar, 2-column grid |
| Desktop (> 1024px) | Full sidebar, grid/cards toggle, 3-4 columns |

## Key Decisions

1. **Separate Wishlist from Backlog** — Per the wireframe and DB proposal, they're independent. A game can be in both.
2. **"What to play?" hero** — The home page starts with this question, prompting action.
3. **Profile has custom graphs** — The wireframe shows "funny graphs" and 91% stats on profile.
4. **Wishlist has Steam buy button** — Direct external link to Steam store.
5. **Leaderboard among friends** — Social competition feature.
