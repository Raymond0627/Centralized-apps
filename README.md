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
├── firestore.rules            # Firestore security rules (Trueput dataset)
├── trueput/                   # Embedded throughput dashboard web application
│   ├── index.html
│   ├── styles.css
│   ├── app.js                 # Dashboard controller, charts & projections
│   ├── store.js               # Local-first data layer + Firestore sync
│   ├── firebase-config.js     # Firebase Web App configuration
│   └── vendor/                # Vendored Firebase compat SDK (no CDN)
├── scripts/
│   ├── fetch_releases.py      # GitHub Releases sync script
│   ├── seed_throughput.js     # Migrate a backup into Firestore (--admin)
│   └── probe_throughput.js    # Read-only Firestore readiness check
└── .github/
    └── workflows/
        ├── build-and-sync.yml # Portal auto-sync on push / cron / dispatch
        ├── on-release.yml.example # Copy into QScan & Pcount repos (instant sync)
        └── notify-portal-example.md # Setup notes for the above
```

> The `.example` suffix matters: GitHub runs every `*.yml` under
> `.github/workflows/`, so the template is deliberately not executable here.

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

## 3.1 Trueput Shared Database (Firebase Firestore, Free)

Trueput works immediately with **localStorage only** — the header badge shows
`Local only`. It shares one live dataset across machines and teammates through
**Cloud Firestore**, with **real-time** updates (no refresh needed).

**Already configured** for project `centralized-system-d378f`. To finish:

1. **Create the Firestore database**
   Firebase console → **Build** → **Firestore Database** → **Create database**
   → Start in **production mode**.
2. **Publish the security rules**
   Firebase console → **Firestore Database** → **Rules** → paste the contents
   of [`firestore.rules`](firestore.rules) → **Publish**.
   Firestore creates a database with **deny-all** rules, so until you publish
   these the dashboard can only run in `Local only` mode.
3. **Deploy** (push to `main`). The header badge switches to
   `Live · Cloud synced`.

**Firestore document layout**

Firestore requires a **collection path to have an odd number of segments**, so
the dataset uses root-level collections holding documents:

```
lumeed_meta/state                     { paperTypes, updatedAt }
lumeed_processes/groom|scan|valid|audit   { rate, unit, records[] }
lumeed_weeks/2026-06-02               { date, groom, scan, valid, audit, total, … }
```

Splitting by process/week (instead of one large document) means two people
editing different rows never overwrite each other — Firestore merges
per document.

**Behaviour**
- Writes hit `localStorage` first, so the dashboard stays fully functional
  offline, on `file://`, and before the database exists.
- Firestore `onSnapshot` listeners push teammate changes into every open
  dashboard live, and the app re-renders automatically.
- Data tools were removed from the dashboard UI to keep it focused. They remain
  on the store API and can be run from the browser console or Node:
  - `TPStore.exportPayload()` — download a JSON backup of the current dataset
  - `TPStore.importPayload(obj)` — restore from a parsed backup
  - `TPStore.resetAll()` — clear local data (does not delete cloud documents)
  - `node scripts/seed_throughput.js <backup.json> --commit --admin` — migrate
    or restore from a file (see §3.2)
- The `apiKey` in `trueput/firebase-config.js` is **not** a secret (it is public
  in every Firebase web app) — `firestore.rules` is the real boundary. It is
  currently open by design; enable **App Check** to restrict writes to your
  deployed site without any code changes.

**Free-tier headroom:** 1 GiB stored, 50k reads/day, 20k writes/day. A busy
team's throughput log uses a tiny fraction of this.

### 3.1.1 Firebase SDK is vendored locally

`trueput/vendor/` contains the **compat** SDK builds
(`firebase-app-compat.js`, `firebase-firestore-compat.js`) rather than loading
them from `gstatic.com`. Two reasons:

- The modular gstatic files are **ES modules**. Loaded with a plain
  `<script src>` they throw a `SyntaxError`, `window.firebase` is never
  defined, and the dashboard silently falls back to local-only with empty
  charts. The compat builds attach `window.firebase`, which `store.js` uses.
- Vendoring removes the CDN dependency entirely, so cloud sync also works
  behind a corporate proxy or fully offline.

**Where to run it from:** Firestore requires a secure context, so open the
dashboard over `https://` (the deployed portal) or `http://localhost` — a
`file://` path cannot reach Firestore and will stay local-only. For a quick
local check:

```bash
python -m http.server 8770
# then browse to http://localhost:8770/trueput/index.html
```

**Diagnosing sync from the console**

The dashboard no longer shows a status badge, so open DevTools → Console. Sync
problems are logged automatically as `[trueput] …` warnings:

| Console warning | Meaning | Fix |
|---|---|---|
| `rules are blocking this browser` | Firestore rules deny the client | Publish `firestore.rules`, then reload |
| `SDK or firebase-config.js did not load` | Vendored SDK/config missing | Check `trueput/vendor/` is deployed |
| `Could not reach Firestore` | Network/proxy issue | Data is safe locally; it syncs when connectivity returns |

You can also inspect state directly at any time:

```js
TPStore.getSyncState()   // { remoteOk, live, confirmed, pending, reason, lastError }
TPStore.exportPayload()  // JSON backup of the current dataset
```

### 3.2 Migrating existing dashboard data

Throughput data lives in the browser's `localStorage` — it is never written to a
file on disk. To move data you already entered into a browser into the shared
dataset:

1. In that browser's DevTools console, run `TPStore.exportPayload()` and save
   the output as `throughput-<year>.json` (or use
   `copy(JSON.stringify(TPStore.exportPayload()))`).
2. Preview the migration (writes nothing):
   ```bash
   npm install firebase firebase-admin
   node scripts/seed_throughput.js ~/Downloads/throughput-2026.json
   ```
3. Perform it:
   ```bash
   node scripts/seed_throughput.js ~/Downloads/throughput-2026.json --commit --admin
   ```
   `--admin` uses a service account key and **bypasses security rules**, so it
   works even while the rules still deny access. Save the key as
   `scripts/serviceAccountKey.json` (already gitignored — never commit it), or
   pass a path explicitly: `--admin path/to/key.json`.
   Drop `--admin` to write through the browser config instead, which requires
   published rules that permit writes. Add `--reset` to wipe existing
   documents first; otherwise values merge per document.

Either backup layout is accepted — the current flat map and the older
array-shaped export. To restore a backup in a browser, run
`TPStore.importPayload(obj)` in the DevTools console.

Two helper scripts:

| Script | Purpose |
|---|---|
| `scripts/seed_throughput.js` | Migrate a backup into Firestore (dry run by default, `--admin` supported) |
| `scripts/probe_throughput.js` | Read-only check: database created, rules published, current contents (`--admin` supported) |

---

## 4. Releasing a New Version (Fully Automatic)

Every time you release an update for **QScan** or **Pcount**, the portal picks up
the new version, file size, download URL and changelog on its own.

1. **Build the `.exe`** installer using your standard build script (PyInstaller / Inno Setup).
2. Go to your repo on GitHub:
   - `https://github.com/Raymond0627/Automated-System/releases/new` (QScan)
   - `https://github.com/Raymond0627/Page-Counter/releases/new` (Pcount)
3. Enter tag version: `v1.9.0` (semantic versioning).
4. Write your changelog in the release description box — anything longer than
   40 characters is published on the portal verbatim.
5. Attach the `.exe` installer. **Versioned filenames are fine**, e.g.
   `LumeedQScan_Setup_1.9.0.exe` or `Lumeed-Pcount-Setup-1.0.1-x64.exe`.
6. **Wait for the upload to finish, then** click **Publish release**.

> Publish only *after* the installer finishes uploading. Publishing first lets
> the sync run before the asset is attached, which would leave the previous
> version linked.

### How the update happens

```
publish release  ->  notify workflow (if installed)  ->  repository_dispatch
                 ->  portal Actions: fetch_releases.py
                 ->  commits data/apps.json
                 ->  push to main  ->  site redeploys with the new link
```

The sync reads the installer URL straight from the GitHub API, so it always
points at the exact file for that release. (It deliberately does **not** use
`releases/latest/download/<name>`, which 404s as soon as the filename changes.)

| Path | Latency | Setup |
|---|---|---|
| Instant (`repository_dispatch`) | ~1 minute | One-time install below |
| Cron fallback | up to 6 hours | None — already active |

### One-time setup for instant updates

In **each** repo that publishes releases (QScan, Pcount):

1. Create a token with `repo` scope: <https://github.com/settings/tokens>
2. **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `PORTAL_TRIGGER_TOKEN`
   - Value: the token you just created
3. Copy [`.github/workflows/on-release.yml.example`](.github/workflows/on-release.yml.example)
   from this repo into that repo's `.github/workflows/on-release.yml` and commit it.

Verify it worked: after publishing a release, check the **Actions** tab of
`Raymond0627/Centralized-apps` for a `Sync Releases & Deploy Portal` run
triggered by `repository_dispatch`.

### Manually trigger a sync

No setup needed — use the Actions tab → **Sync Releases & Deploy Portal** →
**Run workflow**, or:

```bash
python scripts/fetch_releases.py
git add data/apps.json && git commit -m "chore(data): sync releases"
```

---

## 5. Adding Future Python Web Apps (Phase 4)

To add another hosted web tool (the current suite is **QScan**, **Pcount** and
**Trueput**):

1. Open `data/apps.json`.
2. Locate the app entry under `"apps"`, or add a new object with
   `"type": "web"`.
3. When deployed (Render, Hugging Face, Streamlit, or a subfolder of this repo),
   set:
   ```json
   "status": "ready",
   "url": "https://your-app.onrender.com"
   ```
4. The card button becomes a live **"Launch App"** button, and clicking the card
   navigates straight to the app.

---

## 6. Windows SmartScreen Advisory

Because internal software does not have a commercial EV Code Signing certificate ($400+/year), Windows Defender SmartScreen will show:
> *"Windows protected your PC: Unknown publisher"*

The portal includes an interactive built-in guide modal instructing team members:
1. Click **"More info"**
2. Click **"Run anyway"**
3. Optional verification: run `Get-FileHash -Algorithm SHA256 .\<app>-Setup.exe` in PowerShell and compare with the SHA-256 hash displayed directly in the portal.
