"""
scripts/steam_api.py
Utility functions for fetching and processing Steam game data from the free Web API.

API docs (unofficial): https://wiki.steamgriddb.com/wiki/Steam_Web_API
Endpoint: https://store.steampowered.com/api/appdetails?appids=<id>
"""
import re
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


def app_to_db_row(data: dict) -> dict:
    """Map Steam app details to our DB columns."""
    return {
        "steam_appid": data.get("steam_appid"),
        "name": data.get("name", ""),
        "short_description": data.get("short_description", ""),
        "header_image": data.get("header_image", ""),
        "background_image": data.get("background", ""),
        "price": data.get("price_overview", {}).get("final_formatted", "Free"),
        "release_date": data.get("release_date", {}).get("date", None),
        "genres": ", ".join(g["description"] for g in data.get("genres", [])),
        "developer": ", ".join(data.get("developers", [])),
        "publisher": ", ".join(data.get("publishers", [])),
        "rating": data.get("metacritic", {}).get("score"),
        "recommendations": data.get("recommendations", {}).get("total", 0),
        "platforms_windows": data.get("platforms", {}).get("windows", False),
        "platforms_mac": data.get("platforms", {}).get("mac", False),
        "platforms_linux": data.get("platforms", {}).get("linux", False),
    }


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