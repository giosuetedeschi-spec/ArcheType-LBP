# Steam Purchase Flow — "Buy" Games Integration

## Overview

ArcheType-LBP does **not** process payments directly. All purchases are handled by **Steam**. The platform's role is to:
1. Link users to the correct Steam store page
2. Track which games a user has "acquired" (after purchase)
3. Update the user's library/backlog accordingly

## The Core Question: Keep User on Site or Redirect to Steam?

### Answer: **Redirect to Steam. No in-app purchase possible.**

Steam's platform rules and technical limitations make in-app purchases impossible:

| Approach | Possible? | Why |
|----------|-----------|-----|
| In-app checkout (keep user on site) | ❌ No | Steam has no API for third-party checkout. Purchases MUST go through Steam's store. |
| Steam microtransactions API | ❌ No | Only Valve can use this. Not available to third parties. |
| Redirect to Steam store page | ✅ Yes | Official, supported, required by Steam ToS |
| Steam cart link (add to cart) | ✅ Yes | Can pre-fill cart but still redirects to Steam |
| Steam gift link | ✅ Yes | For gifting scenarios |

## Purchase Flow Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME PAGE                                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  [Game Image]                                            │     │
│  │  Game Title                                              │     │
│  │  Rating: ★★★★☆                                           │     │
│  │  Tags: Action, RPG, Open World                           │     │
│  │                                                          │     │
│  │  [❤️ Wishlist]  [🛒 Buy on Steam]  [← Back]             │     │
│  │                                                          │     │
│  │  Played hours: 42                                        │     │
│  │  [Funny graphs...]                                       │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  User clicks "Buy on Steam"                                       │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Modal: "Ready to buy?"                                  │     │
│  │                                                          │     │
│  │  You'll be redirected to Steam to complete the purchase. │     │
│  │                                                          │     │
│  │  [Cancel]  [Continue →]                                  │     │
│  └─────────────────────────────────────────────────────────┘     │
│       │                                                           │
│       ▼                                                           │
│  Redirect to: https://store.steampowered.com/app/{appid}/         │
│       │                                                           │
│       ▼                                                           │
│  User completes purchase on Steam                                 │
│       │                                                           │
│       ▼                                                           │
│  User returns to site (or we detect via Steam API)               │
│       │                                                           │
│       ▼                                                           │
│  Game automatically added to user's backlog                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Steam Store URL Formats

| Type | URL Format | Example |
|------|-----------|---------|
| App page | `https://store.steampowered.com/app/{appid}/` | `https://store.steampowered.com/app/730/Counter-Strike_2/` |
| Add to cart | `https://store.steampowered.com/app/{appid}/addtocart` | Redirects to cart |
| Gift | `https://store.steampowered.com/app/{appid}/?snr=1_5_9__403` | Gift purchase flow |
| Bundle | `https://store.steampowered.com/bundle/{bundleid}/` | For bundles |

## Implementation

### Frontend: Buy Button Component

```tsx
interface BuyButtonProps {
  appId: number;
  gameName: string;
  price?: number;
}

export function BuyButton({ appId, gameName, price }: BuyButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBuy = () => {
    setShowConfirm(true);
  };

  const confirmBuy = () => {
    // Option 1: Simple redirect (new tab)
    window.open(`https://store.steampowered.com/app/${appId}/`, '_blank', 'noopener,noreferrer');

    // Option 2: Same tab
    // window.location.href = `https://store.steampowered.com/app/${appId}/`;

    setShowConfirm(false);

    // Track click event
    analytics.track('purchase_click', { appId, gameName });
  };

  return (
    <>
      <button
        onClick={handleBuy}
        className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90"
      >
        <ShoppingCart className="h-4 w-4" />
        {price === 0 ? "Free on Steam" : `Buy on Steam — ${price.toFixed(2)} €`}
      </button>

      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)}>
          <h3 className="text-lg font-bold">Buy on Steam</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You'll be redirected to Steam to purchase <strong>{gameName}</strong>.
            After purchase, your game will appear in your library automatically.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowConfirm(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={confirmBuy} className="btn-brand">
              Continue to Steam →
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
```

### Backend: Purchase Tracking

Since we can't detect a Steam purchase in real-time, we use **Steam Web API** to sync the user's owned games:

```java
@Service
@RequiredArgsConstructor
public class SteamSyncService {

    @Value("${steam.api.key}")
    private String steamApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final BacklogRepository backlogRepo;
    private final GameRepository gameRepo;

    /**
     * Fetches user's owned games from Steam API and syncs with our backlog.
     * Called on login and/or manually via "Sync Library" button.
     */
    public SyncResult syncUserLibrary(Long userId, String steamId) {
        // 1. Fetch owned games from Steam
        String url = String.format(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=%s&steamid=%s&include_appinfo=1&format=json",
            steamApiKey, steamId
        );

        SteamOwnedGamesResponse response = restTemplate.getForObject(url, SteamOwnedGamesResponse.class);
        List<SteamGame> steamGames = response.getResponse().getGames();

        // 2. Cross-reference with our games table
        int added = 0;
        for (SteamGame sg : steamGames) {
            Game game = gameRepo.findByAppid(sg.getAppid()).orElse(null);
            if (game != null && !backlogRepo.existsByUserIdAndGameId(userId, game.getId())) {
                Backlog b = new Backlog();
                b.setUser(new User(userId));
                b.setGame(game);
                b.setStatus("playing"); // Assume owned = playing
                b.setPlayTimeMin(sg.getPlaytimeForever() / 60); // Convert minutes
                backlogRepo.save(b);
                added++;
            }
        }

        return new SyncResult(added, steamGames.size());
    }
}
```

### API Endpoint for Manual Sync

```java
@RestController
@RequestMapping("/api/users/{userId}/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SteamSyncService syncService;

    @PostMapping("/steam")
    public ResponseEntity<ApiResponse<SyncResult>> syncSteam(
            @PathVariable Long userId,
            @RequestBody SteamSyncRequest request) {
        SyncResult result = syncService.syncUserLibrary(userId, request.getSteamId());
        return ResponseEntity.ok(ApiResponse.ok(result, "Library synced with Steam"));
    }
}
```

### Database: Track Steam ID per User

```sql
-- Steam ID is already stored via auth_provider/provider_id
-- But for users who sign in with Google (not Steam), we need a separate link:

CREATE TABLE IF NOT EXISTS user_steam_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    steam_id VARCHAR(20) UNIQUE NOT NULL,
    steam_profile_url VARCHAR(255),
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_steam_links_steam_id ON user_steam_links(steam_id);
```

## Wishlist "Buy" Flow

The Wishlist page has a special flow — items here are games the user *wants* but doesn't own:

```
Wishlist Item Card:
┌─────────────────────────────────────────────┐
│  [Game Image]                                │
│  Game Title                                  │
│  Developer: FromSoftware                     │
│  Added: 2026-06-20                           │
│                                              │
│  [❤️ Remove]  [🛒 Buy on Steam]  [🔗 Steam] │
│                                              │
└─────────────────────────────────────────────┘

After purchase (detected via sync):
┌─────────────────────────────────────────────┐
│  [Game Image]                                │
│  Game Title                                  │
│  Developer: FromSoftware                     │
│  Status: ✅ Owned                            │
│                                              │
│  [📖 Open in Library]  [📊 View Stats]       │
│                                              │
└─────────────────────────────────────────────┘
```

When a game is detected as owned (via Steam sync), it's automatically:
1. Removed from wishlist
2. Added to backlog with status "playing"

## Alternative: Steam Cart Links

For a slightly better UX, you can pre-fill the Steam cart:

```tsx
// Direct add-to-cart (still redirects to Steam checkout)
const cartUrl = `https://store.steampowered.com/app/${appId}/addtocart`;

// Or use the Steam cart page with app ID
const steamCartUrl = `https://store.steampowered.com/cart/?snr=1_5_9__403&appid=${appId}`;
```

**Note**: Steam's cart API is not officially documented for third-party use. The safest approach is the simple app page URL.

## Steam API Rate Limits

| Endpoint | Rate Limit | Notes |
|----------|-----------|-------|
| GetOwnedGames | ~100 requests/minute | Per API key |
| GetPlayerSummaries | ~100 requests/minute | Per API key |
| GetAppInfo | ~200 requests/minute | Per API key |

**Recommendation**: Sync on login + manual "Sync Library" button. Don't poll automatically.

## Implementation Checklist

- [ ] Add `user_steam_links` table migration
- [ ] Add `steamId` field to User entity (or separate table)
- [ ] Implement `SteamSyncService.syncUserLibrary()`
- [ ] Implement `POST /api/users/{userId}/sync/steam` endpoint
- [ ] Add `BuyButton` component to Game Page
- [ ] Add confirmation modal before redirect
- [ ] Add "Sync Library" button to Library page
- [ ] Auto-move wishlist → backlog on Steam sync detection
- [ ] Handle case: user signs in with Google (not Steam) — offer Steam link
- [ ] Track purchase clicks for analytics
- [ ] Add "Free to Play" handling (no purchase needed, just add to backlog)
- [ ] Handle bundles (multiple appids in one purchase)
- [ ] Handle regional pricing differences (show local currency if possible)

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Game is free-to-play | "Play on Steam" button instead of "Buy" |
| Game is already owned | Show "In Library" badge, no buy button |
| Game is in cart but not purchased | Still redirects to Steam (user completes there) |
| User doesn't have Steam account | Show "Create Steam Account" link |
| Steam API is down | Graceful fallback: "Unable to verify ownership. Try again later." |
| Regional restrictions | Show "Not available in your region" if Steam returns error |
| User refunds on Steam | Next sync removes from backlog (configurable) |


---
*Last project status update: 2026-07-03*