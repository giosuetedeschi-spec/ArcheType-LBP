# API Reference — ArcheType-LBP

## Base URL

```
http://localhost:8080/api
```

## Response Format

All responses follow the `ApiResponse<T>` wrapper:

```json
{
  "success": true,
  "data": { ... },
  "message": null
}
```

Error response:
```json
{
  "success": false,
  "data": null,
  "message": "Resource not found"
}
```

---

## Games

### `GET /api/games`

List all games.

**Response:** `ApiResponse<List<GameResponse>>`

---

### `GET /api/games/filter`

Filter games with multiple criteria (Steam-like filters).

**Query Parameters:**

| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `name` | string | Search by name (partial, case-insensitive) | — |
| `genre` | string | Filter by genre | — |
| `developer` | string | Filter by developer | — |
| `minPrice` | decimal | Minimum price | — |
| `maxPrice` | decimal | Maximum price | — |
| `minRating` | decimal | Minimum rating (0-5) | — |
| `releasedAfter` | date | Release date >= (YYYY-MM-DD) | — |
| `releasedBefore` | date | Release date <= (YYYY-MM-DD) | — |
| `sortBy` | string | Sort field (name, price, rating, releaseDate) | name |
| `sortDir` | string | asc or desc | asc |
| `page` | int | Page number (0-based) | 0 |
| `size` | int | Page size | 20 |

**Response:** `ApiResponse<PagedResponse<GameResponse>>`

**Example:**
```
GET /api/games/filter?genre=action&minRating=4&sortBy=rating&sortDir=desc&page=0&size=10
```

---

### `GET /api/games/{id}`

Get game by ID.

**Response:** `ApiResponse<GameResponse>`

---

### `POST /api/games`

Create a new game.

**Body:** `GameRequest`
```json
{
  "steamAppId": 730,
  "name": "Counter-Strike 2",
  "releaseDate": "2012-08-21",
  "developer": "Valve",
  "publisher": "Valve",
  "price": 0.00,
  "rating": 4.50,
  "genres": "FPS,Action,Multi-player",
  "description": "Counter-Strike 2 is the next chapter of the world's favorite competitive FPS.",
  "headerImageUrl": "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg"
}
```

**Response:** `ApiResponse<GameResponse>` (201 Created)

---

### `PUT /api/games/{id}`

Update a game.

**Body:** `GameRequest`

**Response:** `ApiResponse<GameResponse>`

---

### `DELETE /api/games/{id}`

Delete a game.

**Response:** `ApiResponse<Void>`

---

### `GET /api/games/search?q={query}`

Search games by name.

**Response:** `ApiResponse<List<GameResponse>>`

---

### `GET /api/games/genre/{genre}`

List games by genre.

**Response:** `ApiResponse<List<GameResponse>>`

---

## Users

### `GET /api/users`

List all users.

**Response:** `ApiResponse<List<UserResponse>>`

---

### `GET /api/users/{id}`

Get user by ID.

**Response:** `ApiResponse<UserResponse>`

---

### `POST /api/users`

Register a new user.

**Body:** `UserRequest`
```json
{
  "username": "gamer_alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

**Response:** `ApiResponse<UserResponse>` (201 Created)

---

## User Games (Library)

### `GET /api/users/{userId}/games`

Get all games in user's library.

**Response:** `ApiResponse<List<UserGameResponse>>`

---

### `POST /api/users/{userId}/games`

Add a game to user's library.

**Body:** `UserGameRequest`
```json
{
  "gameId": 1,
  "status": "wishlist"
}
```

Valid statuses: `wishlist`, `playing`, `finished`, `abandoned`

**Response:** `ApiResponse<UserGameResponse>` (201 Created)

---

### `PUT /api/users/{userId}/games/{id}`

Update game status in user's library.

**Body:**
```json
{
  "status": "playing"
}
```

**Response:** `ApiResponse<UserGameResponse>`

---

### `DELETE /api/users/{userId}/games/{id}`

Remove a game from user's library.

**Response:** `ApiResponse<Void>`

---

## Statistics

### `GET /api/users/{userId}/stats`

Get user statistics (for Grafici di Utilizzo page).

**Response:** `ApiResponse<UserStatsResponse>`

```json
{
  "totalGames": 42,
  "wishlistCount": 10,
  "playingCount": 5,
  "finishedCount": 22,
  "abandonedCount": 5,
  "gamesByGenre": { "Action": 15, "RPG": 12, "FPS": 8 },
  "gamesByDeveloper": { "Valve": 5, "CD Projekt": 3 },
  "gamesByYear": { "2023": 8, "2024": 12 },
  "averageRating": 4.2,
  "totalSpent": 299.99
}
```

---

## Health

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "timestamp": "2026-06-24T10:30:00",
    "version": "1.0.0",
    "database": "UP"
  }
}
```

---

## Error Codes

| HTTP Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Internal Server Error |

---

## DTO Schemas

### GameResponse
```json
{
  "id": 1,
  "steamAppId": 730,
  "name": "Counter-Strike 2",
  "releaseDate": "2012-08-21",
  "developer": "Valve",
  "publisher": "Valve",
  "price": 0.00,
  "rating": 4.50,
  "genres": "FPS,Action,Multi-player",
  "description": "...",
  "headerImageUrl": "https://...",
  "createdAt": "2026-06-24T10:00:00"
}
```

### UserResponse
```json
{
  "id": 1,
  "username": "gamer_alice",
  "email": "alice@example.com",
  "createdAt": "2026-06-24T10:00:00"
}
```

### UserGameResponse
```json
{
  "id": 1,
  "userId": 1,
  "status": "wishlist",
  "addedAt": "2026-06-24T10:00:00",
  "updatedAt": "2026-06-24T10:00:00",
  "game": {
    "id": 1,
    "name": "Counter-Strike 2",
    "headerImageUrl": "https://...",
    "genres": "FPS,Action,Multi-player"
  }
}
```
