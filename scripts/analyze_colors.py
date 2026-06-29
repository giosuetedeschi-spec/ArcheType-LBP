"""
scripts/analyze_colors.py
Standalone dominant-color analyzer for Steam game cover images.
Downloads image, resizes to 32x32, computes per-bucket average colors.

Usage:
    python scripts/analyze_colors.py <steam_appid>
"""
import sys
sys.path.insert(0, "scripts")
from steam_api import fetch_app_details, download_image_colors

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_colors.py <steam_appid>")
        sys.exit(1)

    app_id = int(sys.argv[1])
    details = fetch_app_details(app_id)
    if not details:
        print(f"App {app_id} not found")
        sys.exit(1)

    print(f"Game: {details.get('name')}")
    print(f"Header image: {details.get('header_image', 'N/A')}")
    color = download_image_colors(details.get("header_image", ""))
    print(f"Dominant color (R,G,B / bucket 32): {color}")