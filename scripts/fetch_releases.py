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
    """Fetch releases from GitHub API for a repo (e.g. Raymond0627/Automated-System)."""
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

        for index, rel in enumerate(releases_api):
            tag = rel.get("tag_name", "")
            name = rel.get("name") or tag
            published_at = rel.get("published_at")
            body = rel.get("body", "")
            sha256 = extract_sha256(body)

            # Match this release's own installer asset. Prefer an exact filename
            # match; otherwise take the first .exe so the choice is deterministic
            # instead of depending on API ordering.
            assets = rel.get("assets", [])
            matched_asset = None
            first_exe = None
            for a in assets:
                a_name = (a.get("name") or "").lower()
                if asset_target and a_name == asset_target:
                    matched_asset = a
                    break
                if first_exe is None and a_name.endswith(".exe"):
                    first_exe = a
            if matched_asset is None:
                matched_asset = first_exe

            if matched_asset:
                # Version-pinned URL taken from the API: it always resolves for
                # this release, unlike releases/latest/download/<name>, which
                # 404s as soon as the asset is renamed on a newer release.
                dl_url = matched_asset.get("browser_download_url")
                fsize = format_file_size(matched_asset.get("size", 0))
                asset_real_name = matched_asset.get("name") or ""
            else:
                # No asset on this release (rare) — fall back to the tag URL.
                dl_url = f"https://github.com/{repo}/releases/download/{tag}/{app.get('asset_name', '')}"
                fsize = "Under 500 MB"
                asset_real_name = ""
            # Use the release body as the changelog when it looks like real
            # content. Placeholder notes ("link will be available…") and very
            # short bodies are ignored so a hand-written description from an
            # earlier release is not silently replaced by filler.
            #
            # The curated fallback only applies to the newest release, so that
            # historical entries always resolve from their own body. Otherwise
            # re-running the sync would rewrite the changelog of every older
            # release with the newest release's text (not idempotent).
            is_latest = index == 0
            existing_cl = app.get("latest_release", {}).get("changelog", "") if is_latest else ""
            placeholder_markers = (
                "link will be available",
                "to be added",
                "coming soon",
                "tbd",
            )
            body_text = (body or "").strip()
            is_placeholder = any(marker in body_text.lower() for marker in placeholder_markers)
            if body_text and len(body_text) > 40 and not is_placeholder:
                final_cl = body_text
            elif existing_cl:
                final_cl = existing_cl
            else:
                final_cl = body_text or "Bug fixes and routine performance improvements."

            parsed_releases.append({
                "version": tag,
                "tag": tag,
                "name": name,
                "published_at": published_at,
                "file_size": fsize,
                "download_url": dl_url,
                "asset_name": asset_real_name,
                "sha256": sha256 or app.get("latest_release", {}).get("sha256", ""),
                "changelog": final_cl
            })

        if parsed_releases:
            # GitHub returns releases newest-first, so [0] is the latest.
            # Its download_url/asset_name were captured from THIS release's own
            # asset inside the loop. Never reuse a loop-scoped asset variable
            # here: after the loop it refers to the oldest release, which would
            # pin the site to an old installer while showing the new version.
            latest = parsed_releases[0]
            app["latest_release"] = latest
            app["releases"] = parsed_releases
            app["status"] = "ready"
            if latest.get("asset_name"):
                app["asset_name"] = latest["asset_name"]
            updated_count += 1
            print(f"  ✓ Updated {app.get('name')} to {latest.get('version')} "
                  f"({latest.get('file_size')}) → {latest.get('asset_name') or 'no asset'}")

    data["portal"]["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(APPS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print("-" * 60)
    print(f"Sync complete. {updated_count} apps refreshed from GitHub.")
    print("Portal data written to:", APPS_JSON_PATH)

if __name__ == "__main__":
    main()
