# Frontend Architecture & Flow — ArcheType-LBP

## Overview

The frontend is a React SPA built with Vite, TypeScript, and Tailwind CSS. It communicates with the Spring Boot backend via REST API calls.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18+ | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | latest | Component library (Radix-based) |
| React Router | 6.x | Client-side routing |
| Recharts | latest | Charts (Grafici di Utilizzo) |
| Sonner | latest | Toast notifications |
| Zod | latest | Form validation |
| Bun | 1.x | Package manager |

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Vivid Royal | `#141aad` | Primary actions, links |
| Midnight Violet | `#32213a` | Backgrounds, dark surfaces |
| Golden Glow | `#ead94c` | Accents, highlights, badges |
| Tangerine Dream | `#ff9b71` | CTAs, warnings, active states |

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER / NAVBAR                                            │
│  [Logo] [Search ] [ Wishlist ] [ Library ] [ Profile ]     │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  SIDEBAR     │  MAIN CONTENT AREA                           │
│  (Filters)   │                                              │
│              │  ┌─────────────────────────────────────┐     │
│  □ Genre     │  │ Page-specific content               │     │
│  □ Price     │  │                                      │     │
│  □ Rating    │  │  - Game cards grid                  │     │
│  □ Status    │  │  - Statistics charts                │     │
│  □ Year      │  │  - User profile                     │     │
│  □ Dev       │  │  - etc.                             │     │
│              │  │                                      │     │
│  [Apply]     │  └─────────────────────────────────────┘     │
│  [Reset]     │                                              │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  FOOTER                                                     │
└─────────────────────────────────────────────────────────────┘
```

## Page Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Landing / dashboard overview |
| `/catalog` | `CatalogPage` | Full game catalog with filters |
| `/game/:id` | `GameDetailPage` | Single game details |
| `/library` | `LibraryPage` | User's game library |
| `/wishlist` | `WishlistPage` | User's wishlist |
| `/stats` | `StatsPage` | Usage statistics & charts |
| `/profile` | `ProfilePage` | User profile & settings |
| `/friends` | `FriendsPage` | Friends list & search |
| `/login` | `LoginPage` | Authentication |
| `/loading` | `LoadingPage` | Initial app loading state |

## Component Hierarchy

```
App
├── AppLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── SearchBar
│   │   └── NavLinks
│   ├── Sidebar (collapsible on catalog/filters pages)
│   │   ├── FilterSection (genre, price, rating, etc.)
│   │   └── SortControls
│   └── Footer
├── Routes
│   ├── HomePage
│   │   ├── WelcomeBanner
│   │   ├── RecentGames
│   │   └── QuickStats
│   ├── CatalogPage
│   │   ├── GameGrid
│   │   ├── GameCard
│   │   └── Pagination
│   ├── GameDetailPage
│   │   ├── GameHeader
│   │   ├── GameInfo
│   │   ├── AddToLibraryButton
│   │   └── AddToWishlistButton
│   ├── LibraryPage
│   │   ├── StatusTabs (wishlist/playing/finished/abandoned)
│   │   ├── GameList
│   │   └── GameCard (with status badge)
│   ├── StatsPage
│   │   ├── StatusChart (pie/bar)
│   │   ├── GenreChart
│   │   ├── TimelineChart
│   │   └── SummaryCards
│   ├── ProfilePage
│   │   ├── Avatar
│   │   ├── UserInfo
│   │   └── SettingsForm
│   └── FriendsPage
│       ├── FriendSearch
│       ├── FriendList
│       └── FriendCard
└── Shared
    ├── GameCard
    ├── StatusBadge
    ├── LoadingSpinner
    ├── EmptyState
    └── ErrorBoundary
```

## Data Flow

```
┌─────────────┐     HTTP/REST      ┌──────────────┐
│   React     │ ◄──────────────►  │  Spring Boot  │
│   Frontend  │     JSON          │   Backend     │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │  State Management                │
       │  ┌─────────────┐                │
       │  │ React Query │                │
       │  │ (TanStack)  │                │
       │  └─────────────┘                │
       │                                  │
       │  Local Storage                   │
       │  ┌─────────────┐                │
       │  │ user prefs  │                │
       │  │ auth token  │                │
       │  └─────────────┘                │
       │                                  │
┌──────▼──────┐                    ┌──────▼───────┐
│  Context    │                    │  PostgreSQL   │
│  Providers  │                    │  Database     │
│ - AuthCtx   │                    └──────────────┘
│ - ThemeCtx  │
│ - FilterCtx │
└─────────────┘
```

## API Integration

### API Client (`lib/api.ts`)

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// GET requests
fetchGames(filter: GameFilterRequest): Promise<PagedResponse<GameResponse>>
fetchGame(id: number): Promise<GameResponse>
fetchUserStats(userId: number): Promise<UserStatsResponse>
fetchUserGames(userId: number, status?: string): Promise<UserGameResponse[]>

// POST requests
createUser(data: UserRequest): Promise<UserResponse>
addGameToLibrary(userId: number, data: UserGameRequest): Promise<UserGameResponse>
addToWishlist(userId: number, gameId: number): Promise<void>

// PUT requests
updateGameStatus(userId: number, gameId: number, status: string): Promise<UserGameResponse>
updateProfile(userId: number, data: Partial<UserRequest>): Promise<UserResponse>

// DELETE requests
removeGameFromLibrary(userId: number, gameId: number): Promise<void>
removeFromWishlist(userId: number, gameId: number): Promise<void>
```

### React Query Keys

```typescript
const queryKeys = {
  games: ['games'] as const,
  game: (id: number) => ['game', id] as const,
  userGames: (userId: number) => ['user-games', userId] as const,
  userStats: (userId: number) => ['user-stats', userId] as const,
  wishlist: (userId: number) => ['wishlist', userId] as const,
  friends: (userId: number) => ['friends', userId] as const,
};
```

## State Management

| Layer | Tool | What it manages |
|---|---|---|
| Server State | TanStack Query | API data, caching, refetching |
| UI State | React useState/useReducer | Modals, sidebar toggle, filters |
| Global State | React Context | Auth, theme, user preferences |
| Form State | React Hook Form + Zod | Form validation |
| URL State | React Router | Pagination, route params |

## Authentication Flow

```
1. User visits app → check localStorage for token
2. If no token → redirect to /login
3. Login form → POST /api/auth/login → receive JWT
4. Store token in localStorage
5. Attach token to all API requests via interceptor
6. On 401 response → clear token, redirect to /login
```

## Loading States

```
App Init → LoadingPage (check auth, fetch initial data)
  ↓
Homepage → fetch recent games + stats (parallel)
  ↓
CatalogPage → fetch games with filters (cached by query key)
  ↓
GameDetailPage → fetch single game + user-game status
```

## Responsive Design

| Breakpoint | Layout |
|---|---|
| Mobile (< 640px) | Single column, hamburger menu, filters in bottom sheet |
| Tablet (640-1024px) | Collapsible sidebar, 2-column grid |
| Desktop (> 1024px) | Full sidebar, 3-4 column grid |

## Key Features per Page

### Homepage
- Welcome banner with user stats summary
- Recently added games carousel
- Quick action buttons (Browse Catalog, View Wishlist)
- Mini stats preview

### Catalog
- Full filter sidebar (genre, price range, rating, year, developer, multiplayer)
- Sort controls (name, price, rating, release date)
- Paginated game grid
- Search bar in header

### Library
- Status tabs: All / Wishlist / Playing / Finished / Abandoned
- Game cards with status badge
- Quick status change dropdown
- Play time tracking

### Stats
- Status distribution pie chart
- Genre distribution bar chart
- Play time over time (line chart)
- Top developers (horizontal bar)
- Summary cards (total games, total spent, avg rating)

### Profile
- Avatar upload
- Username/email editing
- Theme toggle (dark/light)
- Language selector
- Colorblind mode toggle
- Friends visibility toggle


---
*Last project status update: 2026-07-03*