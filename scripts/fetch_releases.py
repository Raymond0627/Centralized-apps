#!/usr/bin/env python3
"""
Lumeed Central Portal - Release Fetcher Script
Fetches latest release information and version history from GitHub API
for all configured desktop apps, with zero-dependency fallback.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
from datetime import datetime, timezone

APPS_JSON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "apps.json")

def format_file_size(size_bytes):
    """Format raw byte count into human readable MB/GB string."""
    if not size_bytes or size_bytes <= 0:
        return "Unknown size"
    mb = size_bytes / (1024 * 1024)
    if mb >= 1024:
        return f"{mb / 1024:.2f} GB"
    return f"{mb:.1f} MB"

def extract_sha256(text):
    """Try to extract a 64-char SHA256 hash from release body if present."""
    if not text:
        return ""
    # Look for sha256: [hash] or SHA-256 [hash]
    m = re.search(r'(?:sha-?256|checksum)[\s:=]+([a-fA-F0-9]{64})', text, re.IGNORECASE)
    if m:
        return m.group(1).lower()
    # General 64 hex characters
    m2 = re.search(r'\b([a-fA-F0-9]{64})\b', text)
    if m2:
        return m2.group(1).lower()
    return ""

def fetch_repo_releases(repo_path, token=None):
    """Fetch releases from GitHub API for a repo (e.g. Raymond0627/Qcheck)."""
    url = f"https://api.github.com/repos/{repo_path}/releases"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Lumeed-Portal-Builder"
    }
    if token:
        headers["Authorization"] = f"token {token}"
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data
    except urllib.error.HTTPError as e:
        print(f"  [Notice] GitHub API HTTP {e.code} for {repo_path}: {e.reason}")
        return None
    except Exception as e:
        print(f"  [Notice] Connection error fetching {repo_path}: {e}")
        return None

def main():
    print("=" * 60)
    print(" Lumeed Portal - Release Synchronization")
    print("=" * 60)

    if not os.path.exists(APPS_JSON_PATH):
        print(f"Error: {APPS_JSON_PATH} not found.")
        sys.exit(1)

    with open(APPS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        print("✓ Authenticated with GITHUB_TOKEN for high rate limit")
    else:
        print("ℹ Running unauthenticated (using public API limits)")

    updated_count = 0
    apps = data.get("apps", [])

    for app in apps:
        if app.get("type") != "desktop":
            continue
        
        repo = app.get("repo")
        if not repo:
            continue
        
        print(f"Checking releases for {app.get('name')} ({repo})...")
        releases_api = fetch_repo_releases(repo, token=token)

        if not releases_api or not isinstance(releases_api, list) or len(releases_api) == 0:
            print(f"  → Retaining current cached metadata for {app.get('name')}")
            continue

        asset_target = app.get("asset_name", "").lower()
        parsed_releases = []

        for rel in releases_api:
            tag = rel.get("tag_name", "")
            name = rel.get("name") or tag
            published_at = rel.get("published_at")
            body = rel.get("body", "")
            sha256 = extract_sha256(body)

            # Match installer asset
            assets = rel.get("assets", [])
            matched_asset = None
            for a in assets:
                a_name = a.get("name", "").lower()
                if asset_target and a_name == asset_target:
                    matched_asset = a
                    break
                elif a_name.endswith(".exe"):
                    matched_asset = a

            if matched_asset:
                dl_url = matched_asset.get("browser_download_url")
                fsize = format_file_size(matched_asset.get("size", 0))
            else:
                # Permanent fallback URL
                dl_url = f"https://github.com/{repo}/releases/download/{tag}/{app.get('asset_name', '')}"
                fsize = "Under 500 MB"

            parsed_releases.append({
                "version": tag,
                "tag": tag,
                "name": name,
                "published_at": published_at,
                "file_size": fsize,
                "download_url": dl_url,
                "sha256": sha256 or app.get("latest_release", {}).get("sha256", ""),
                "changelog": body or "Bug fixes and routine performance improvements."
            })

        if parsed_releases:
            latest = parsed_releases[0]
            # Ensure latest points to permanent download link if preferred
            permanent_latest = f"https://github.com/{repo}/releases/latest/download/{app.get('asset_name', '')}"
            latest_copy = dict(latest)
            latest_copy["download_url"] = permanent_latest

            app["latest_release"] = latest_copy
            app["releases"] = parsed_releases
            app["status"] = "ready"
            updated_count += 1
            print(f"  ✓ Updated {app.get('name')} to {latest.get('version')} ({latest.get('file_size')})")

    data["portal"]["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(APPS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print("-" * 60)
    print(f"Sync complete. {updated_count} apps refreshed from GitHub.")
    print("Portal data written to:", APPS_JSON_PATH)

if __name__ == "__main__":
    main()
