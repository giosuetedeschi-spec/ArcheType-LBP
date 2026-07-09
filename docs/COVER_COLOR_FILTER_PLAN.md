# Cover Color Filter — Data Plan

Plan for how to get a "dominant cover color" value per game so the catalog can
filter/sort by it. Tracks issue #11 (`docs/FEATURE_STATUS.md`: "colore
copertina — script esistente ma non integrato, richiederebbe elaborare le
immagini di 122k giochi").

## Building block that already exists

`scripts/analyze_colors.py` already does the hard part for one game: reads
`header_image_url` from `games`, downloads the image, resizes to 32x32, and
averages RGB into a `#rrggbb` string. It doesn't write to the DB and doesn't
batch — this plan is about how to run that logic (or something like it) for
all ~122k games and serve the result to the filter.

## Approaches considered

### 1. On-the-fly, computed per request
Filter endpoint downloads+analyzes images live for whatever page of results is being returned.
- Pro: zero migration, zero batch job, always reflects the current image.
- Con: 122k games means most catalog browsing would trigger fresh downloads; adds network I/O + image decode to the request path; pagination/sorting by color is impossible without having already computed every row (you can't sort what you haven't measured yet). Not viable as the primary mechanism — at best a per-item fallback.

### 2. Precompute once, store in `games`
Add a `cover_color` column (e.g. `VARCHAR(7)`), run a one-off batch script (extending `analyze_colors.py`) over all games with a `header_image_url`, backfill the column, then treat it like `windows`/`mac`/`linux` (regular indexed column, filterable/sortable in SQL, no runtime cost).
- Pro: matches how the repo already solved the identical shape of problem (OS flags backfill, 2026-07-09 per `FEATURE_STATUS.md`); reuses `populate_db.py`'s existing pattern of a backfill script; filtering becomes a plain `WHERE`/`ORDER BY`; one-time cost, paid in CI/dev machine time, not user-facing latency.
- Con: batch run takes a while for 122k HTTP downloads (needs concurrency + retry/skip-on-404 handling); stale if `header_image_url` changes later (mitigated by re-running the backfill with `FORCE_REPOPULATE`-style skip-if-already-set logic, same idiom as `populate_db.py`).

### 3. Live background worker while users are logged in
A long-running process computes colors continuously/opportunistically during active sessions instead of at startup/import time.
- Con: color is a static property of a static image — it doesn't change based on user activity, so tying the computation to "is anyone logged in" adds a scheduling/liveness problem (what if no one logs in for a week? what if the process dies mid-run and there's no session to resume it?) for no benefit over a batch job. This is solving a problem the data doesn't have.

### 4. Lazy compute + cache on first access
Don't backfill upfront; when a game is fetched and `cover_color` is `NULL`, compute it synchronously (or via the existing Caffeine cache layer, `config/CacheConfig.java`) and persist it to the row so it's never recomputed.
- Pro: spreads the 122k-image cost over real traffic instead of one big batch; no separate job to schedule.
- Con: filter/sort-by-color is only ever complete for games someone has already viewed — a brand-new/rarely-viewed game silently has no color and gets excluded or misordered in a "filter by color" UI, which is exactly the feature being built. Same objection as #1 for the filtering use case, just amortized.

### 5. Compute at import time, inside `populate_db.py`
Fold the color calculation into the existing Steam dataset import step, so every game gets `cover_color` set as part of the same pass that already sets `windows`/`mac`/`linux`/genres/etc.
- Pro: single pipeline, single source of truth for "when does a game's derived data get computed," no second script to maintain or remember to run.
- Con: couples an image-processing step (network-bound, slow, flaky) to the CSV/JSON import step (currently fast, local, deterministic) — one failing image download shouldn't be able to fail or slow down the whole catalog import. Better kept as its own script even if triggered from the same Compose flow.

## Selected approach: #2, precompute once and store in `games`

Store a `cover_color` column and populate it with a standalone batch script, run once (then re-run only for new/changed games) — same shape as the `windows`/`mac`/`linux` backfill this repo already did.

Why this one over the others:
- Filtering by color needs every row to already have a value before the query runs — options 1, 3, and 4 can't guarantee that, so they're disqualified for this specific feature regardless of their other tradeoffs.
- Option 5 is the same storage outcome as #2 but with worse failure isolation (image downloads inside the import path).
- #2 reuses code and idiom already in the repo (`analyze_colors.py`'s dominant-color logic, `populate_db.py`'s idempotent/backfill pattern, the OS-flags precedent), so it's the smallest real change, not a new pattern to learn.

### Implementation sketch
1. **Migration**: add `cover_color VARCHAR(7)` to `games` in `db/init.sql` (nullable — dataset image quality is inconsistent, see issue #101 on missing `header_image_url`).
2. **Batch script**: new `scripts/backfill_cover_colors.py` (or extend `analyze_colors.py` with a `--all` batch mode) — selects `id, header_image_url FROM games WHERE cover_color IS NULL AND header_image_url IS NOT NULL`, computes color, `UPDATE`s the row. Use a thread/async pool for the HTTP downloads (122k sequential requests is the main cost); skip and log games with missing/broken image URLs rather than failing the run.
3. **Idempotency**: re-running only touches rows still missing a color, same `ON CONFLICT`/skip-if-populated idiom as `populate_db.py`; add a `FORCE_RECOLOR`-style env flag if a full recompute is ever needed (e.g. after changing the averaging algorithm).
4. **Wiring**: run manually or as a one-off `docker compose run --rm populate python scripts/backfill_cover_colors.py` after the main `populate_db.py` pass — kept as a separate invocation, not merged into `populate_db.py`'s own run (see rejected option #5).
5. **API/frontend**: expose `coverColor` on `GameResponse`, add it as a filter dimension in `GameFilterRequest` (bucket into a small fixed palette server-side, e.g. nearest of ~8-12 named colors, rather than filtering on exact hex — matches how price/rating ranges are already bucketed for filtering).
