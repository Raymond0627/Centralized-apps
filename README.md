# Lumeed Central Portal

A modern, minimalist corporate software distribution hub for **Lumeed** internal applications, desktop executables, and automated tools.

![Lumeed Portal](assets/images/logo.png)

## 1. Overview & Architecture

- **Base Theme:** Modern Minimalist Corporate White (`#FFFFFF`, `#FAFAFC`, `#E5E7EB`).
- **Brand Palette:** Derived directly from the official Lumeed logo:
  - Primary Purple: `#6C5CC8`
  - Deep Purple: `#5458C4`
  - Amber Accent: `#F0C878`
- **Zero-Cost Hosting:** Cloudflare Pages (Free tier, no credit card required, unlimited bandwidth).
- **Executable Storage:** GitHub Releases CDN (up to 2 GB per file, permanent latest download links).
- **Build-Time Release Ingestion:** `scripts/fetch_releases.py` queries GitHub Releases at build time and compiles metadata into `data/apps.json`, completely circumventing client-side rate limits (60 req/hr).

---

## 2. Directory Structure

```
Centralized systems/
├── index.html                 # Main corporate portal interface
├── favicon.ico                # Multi-size enterprise favicon
├── assets/
│   ├── css/
│   │   └── styles.css         # Modern minimalist styling system
│   ├── js/
│   │   └── app.js             # Client controller, search/filter & modals
│   └── images/
│       ├── logo.png           # Master high-res Lumeed logo
│       ├── logo-mark.png      # Trimmed high-contrast emblem
│       ├── favicon-32x32.png  # Browser tab icon
│       └── icon-192.png       # PWA / high-DPI icon
├── data/
│   └── apps.json              # App catalog registry & release cache
├── scripts/
│   └── fetch_releases.py      # GitHub Releases sync script
└── .github/
    └── workflows/
        ├── build-and-sync.yml # Portal build & auto-sync workflow
        └── notify-portal-example.yml # Template for Qcheck & Pcount repos
```

---

## 3. How to Deploy on Cloudflare Pages (100% Free, 2 Minutes)

1. **Push this repo to your GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete Lumeed Central Portal initial release"
   git push origin main
   ```
2. **Open [dash.cloudflare.com](https://dash.cloudflare.com/)** and navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select your repository.
4. **Build settings:**
   - **Framework preset:** `None`
   - **Build command:** `python scripts/fetch_releases.py`
   - **Build output directory:** `.` (root directory)
5. Click **Save and Deploy**. Your site will be live on `https://<project-name>.pages.dev` with free SSL and worldwide CDN caching!

---

## 4. Releasing a New Version (Zero Drive Links)

Every time you release an update for **Qcheck** or **Pcount**:

1. **Build the `.exe`** installer using your standard build script (PyInstaller / Inno Setup).
2. Go to your repo on GitHub:
   - `https://github.com/Raymond0627/Qcheck/releases/new` or
   - `https://github.com/Raymond0627/Pcount/releases/new`
3. Enter tag version: `v1.1.0` (semantic versioning).
4. Write your changelog in the release description box.
5. Attach the `.exe` using the **fixed asset name**:
   - `Qcheck-Setup.exe` for Qcheck
   - `Pcount-Setup.exe` for Pcount
6. Click **Publish release**.

The permanent download links will automatically point to the new file:
- `https://github.com/Raymond0627/Qcheck/releases/latest/download/Qcheck-Setup.exe`
- `https://github.com/Raymond0627/Pcount/releases/latest/download/Pcount-Setup.exe`

---

## 5. Adding Future Python Web Apps (Phase 4)

To add or update internal web apps (e.g. `Doc Auditor`, `PDF OCR Renamer`, `PDF Counter`):

1. Open `data/apps.json`.
2. Locate the app entry under `"apps"`.
3. When deployed to a free host (Render, Hugging Face, Streamlit Community Cloud), update:
   ```json
   "status": "ready",
   "url": "https://your-app.onrender.com"
   ```
4. The card button will automatically update to a live **"Launch Application"** button.

---

## 6. Windows SmartScreen Advisory

Because internal software does not have a commercial EV Code Signing certificate ($400+/year), Windows Defender SmartScreen will show:
> *"Windows protected your PC: Unknown publisher"*

The portal includes an interactive built-in guide modal instructing team members:
1. Click **"More info"**
2. Click **"Run anyway"**
3. Optional verification: run `Get-FileHash -Algorithm SHA256 .\<app>-Setup.exe` in PowerShell and compare with the SHA-256 hash displayed directly in the portal.
