"""
scripts/steam_api.py
Fetch and inspect Steam game data from the free Web API — no DB involved.

API docs (unofficial): https://wiki.steamgriddb.com/wiki/Steam_Web_API
Endpoint: https://store.steampowered.com/api/appdetails?appids=<id>

Usage (smoke-tests the API against a real app id):
    python scripts/steam_api.py [app_id]   # default: 570 (Dota 2)
"""
import re
import sys
import requests

STEAM_API_BASE = "https://store.steampowered.com/api"


def fetch_app_details(app_id: int, lang: str = "en") -> dict | None:
    """Fetch full details for a single app from Steam store API."""
    url = f"{STEAM_API_BASE}/appdetails?appids={app_id}&l={lang}"
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json().get(str(app_id), {})
    if not data.get("success"):
        return None
    return data["data"]


# BROKEN: regex no longer matches store.steampowered.com/search/ HTML (returns 0
# results as of 2026-07-07, confirmed via steam_api.py's own CLI smoke test). Steam
# changed the search page's embedded JSON structure; needs a new scraping strategy
# or a real API endpoint before this is usable again.
def search_games(query: str, limit: int = 10) -> list[dict]:
    """
    Use Steam search page to find games by name.
    Not an official endpoint but widely used and reliable.
    """
    resp = requests.get(
        "https://store.steampowered.com/search/",
        params={"term": query, "force_suggest": "1"},
        headers={"Accept": "application/json"},
        timeout=10,
    )
    resp.raise_for_status()
    matches = re.findall(r'"appid":(\d+),"name":"([^"]+)"', resp.text)
    return [{"app_id": int(a), "name": n} for a, n in matches[:limit]]


# BROKEN: same cause as search_games() above — 0 results as of 2026-07-07.
def fetch_top_free_games(count: int = 50) -> list[dict]:
    """Fetch top free-to-play games from Steam search."""
    resp = requests.get(
        "https://store.steampowered.com/search/",
        params={"specials": "1", "force_suggest": "1"},
        timeout=10,
    )
    resp.raise_for_status()
    matches = re.findall(r'"appid":(\d+),"name":"([^"]+)"', resp.text)
    return [{"app_id": int(a), "name": n} for a, n in matches[:count]]


if __name__ == "__main__":
    app_id = int(sys.argv[1]) if len(sys.argv) > 1 else 570  # Dota 2

    details = fetch_app_details(app_id)
    if not details:
        print(f"fetch_app_details({app_id}): FAILED — no data returned")
        sys.exit(1)
    print(f"fetch_app_details({app_id}): OK — {details.get('name')!r}, header_image={details.get('header_image')}")

    results = search_games("portal")
    print(f"search_games('portal'): OK — {len(results)} results" if results else "search_games('portal'): FAILED — no results")

    top = fetch_top_free_games(count=5)
    print(f"fetch_top_free_games(5): OK — {len(top)} games" if top else "fetch_top_free_games(5): FAILED — no results")