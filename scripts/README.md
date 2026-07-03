# scripts/

Data pipeline scripts for fetching, processing, and loading Steam game data.

## scripts/steam_api.py
Shared utility for interacting with the Steam Web API (`store.steampowered.com/api`):
- `fetch_app_details(app_id, lang)` — Full game details (images, genres, price, etc.)
- `app_to_db_row(data)` — API response → DB column mapping
- `search_games(query)` — Search games by name via Steam search page
- `fetch_top_free_games(count)` — Top free games for seeding

## scripts/load_steam_data.py
CLI script for loading Steam data into PostgreSQL:
- `--mode seed --limit 100` — Load top 100 free Steam games (default)
- `--mode update` — Refresh all existing games
- `--mode color` — Re-analyze dominant colors from cover images

### Usage
```bash
pip install -r scripts/requirements.txt

export DATABASE_URL="postgresql://archetype:secret@localhost:5432/archetype"

python scripts/load_steam_data.py --mode seed --limit 50
```

## scripts/analyze_colors.py
Standalone script for color analysis demo/testing.

### Environment Variables
| Var | Default | Description |
|-----|---------|-------------|
| `DATABASE_URL` | `postgresql://archetype:secret@localhost:5432/archetype` | PostgreSQL connection string |
| `STEAM_API_KEY` | (not required) | Optional key for higher rate limits |


---
*Last project status update: 2026-07-03*