(function() {
'use strict';

/* ==========================================================================
   SVG ICONS LIBRARY
   ========================================================================== */
var ICONS = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  calculator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="11.5" cy="14.5" r="2.5"/><path d="m13.5 16.5 2 2"/></svg>',
  ocr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  download: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  launch: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  specs: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
};

/* ==========================================================================
   OFFLINE CATALOG REGISTRY
   ========================================================================== */
var CATALOG = [
  {
    id: 'qscan',
    name: 'QScan',
    tagline: 'Automated OCR Document Renaming & Date Extraction System',
    type: 'desktop',
    category: 'Windows Apps',
    version: '1.8.2',
    fileSize: '189.8 MB',
    description: 'Automated date extraction and intelligent batch PDF renaming engine using high-performance OCR. Features blank page detection, dark-themed PyQt6 review interface, and standardized corporate taxonomy mapping.',
    featured: true,
    icon: 'ocr',
    platform: 'Windows 10 / 11 (64-bit)',
    ram: '4 GB minimum (8 GB recommended)',
    disk: '500 MB free disk space (includes bundled Tesseract OCR)',
    arch: 'x86-64 / x64 Architecture',
    sha256: '4d5f9fe57009afbb4b3f436a853b5c8e845c0bca1c58c10f887d0409d3bdcab6',
    downloadUrl: 'https://github.com/Raymond0627/Automated-System/releases/download/v1.8.2/LumeedQScan_Setup_1.8.2.exe',
    fileName: 'LumeedQScan_Setup_1.8.2.exe',
    status: 'ready',
    features: ['Tesseract OCR Engine', 'Blank Page Detection', 'PyQt6 Review GUI'],
    changelog: [
      { ver: 'v1.8.2', text: 'PDF auto-rename and OCR date extraction pipeline with modern PyQt6 dark desktop UI.' },
      { ver: 'v1.8.2', text: 'Intelligent blank page detection and document preview overlay.' },
      { ver: 'v1.8.2', text: 'Bundled standalone Tesseract OCR distribution for seamless single-step installation.' }
    ]
  },
  {
    id: 'pcount',
    name: 'Pcount',
    tagline: 'High-Performance PDF Page Counting & Volume Audit System',
    type: 'desktop',
    category: 'Windows Apps',
    version: '1.0.0',
    fileSize: '89.3 MB',
    description: 'High-performance PDF page counting and volume audit utility built with .NET 8 and WinUI 3. Features recursive local and network directory scanning, PdfPig memory-efficient page extraction, duplicate detection by content hash, and per-folder breakdown reporting.',
    featured: true,
    icon: 'calculator',
    platform: 'Windows 10 1809+ / Windows 11 (64-bit)',
    ram: '4 GB minimum',
    disk: '250 MB free disk space',
    arch: 'x86-64 / x64 Architecture',
    sha256: 'f6ed8ea903f32c6135ae3db31a1398b98d2fd800b8d60f05cbffb6d55637298b',
    downloadUrl: 'https://github.com/Raymond0627/Page-Counter/releases/download/v1.0.0/Lumeed-Pcount-Setup-1.0.0-x64.exe',
    fileName: 'Lumeed-Pcount-Setup-1.0.0-x64.exe',
    status: 'ready',
    features: ['WinUI 3 & .NET 8', 'PdfPig Page Engine', 'Duplicate Detection'],
    changelog: [
      { ver: 'v1.0.0', text: 'Recursive folder scan of local drives, mapped drives and UNC network paths with live progress.' },
      { ver: 'v1.0.0', text: 'Exact PDF page counting via PdfPig without full document memory loading.' },
      { ver: 'v1.0.0', text: 'Duplicate detection by content hash with separate unique vs. total page metrics.' }
    ]
  },
  {
    id: 'trueput',
    name: 'Trueput',
    tagline: 'Document Processing Throughput & Performance Dashboard',
    type: 'web',
    category: 'Web Tools',
    version: '2026.1',
    fileSize: 'Zero Install (Web)',
    description: 'Enterprise throughput tracking engine and performance dashboard. Features live progress metrics, interactive multi-layer timeline charts, weekly volume logging, and projection calculators.',
    featured: true,
    icon: 'chart',
    platform: 'Web Application (Cross-Platform)',
    ram: 'Standard Modern Browser',
    disk: 'No local installation required',
    arch: 'Client-Side Web Container',
    sha256: 'Client-Side Web App (Local Persistence)',
    downloadUrl: 'trueput/index.html',
    launchUrl: 'trueput/index.html',
    fileName: 'trueput/index.html',
    status: 'ready',
    features: ['Throughput Chart', 'Weekly Tracking', 'Projection Models'],
    changelog: [
      { ver: 'v2026.1', text: 'Document processing throughput tracker integrated with unified Lumeed brand system.' },
      { ver: 'v2026.1', text: 'Interactive multi-phase projection models with automated timeline forecasting.' },
      { ver: 'v2026.1', text: 'Weekly master table logging with instant local data persistence.' }
    ]
  }
];

/* Ingest live release metadata from data/apps.json if present */
try {
  fetch('data/apps.json', { cache: 'no-store' })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && data.apps && Array.isArray(data.apps)) {
        data.apps.forEach(function(remote) {
          var local = CATALOG.find(function(item) { return item.id === remote.id; });
          if (local) {
            if (remote.name) local.name = remote.name;
            if (remote.tagline) local.tagline = remote.tagline;
            if (remote.description) local.description = remote.description;
            if (remote.asset_name) local.fileName = remote.asset_name;
            if (remote.url) {
              local.downloadUrl = remote.url;
              local.launchUrl = remote.url;
            }
            if (remote.version) local.version = remote.version.replace(/^v/, '');
            if (remote.file_size) local.fileSize = remote.file_size;
            if (remote.latest_release) {
              local.version = (remote.latest_release.version || local.version).replace(/^v/, '');
              local.fileSize = remote.latest_release.file_size || local.fileSize;
              local.downloadUrl = remote.latest_release.download_url || local.downloadUrl;
              if (remote.latest_release.sha256) local.sha256 = remote.latest_release.sha256;
            }
          }
        });
        renderCatalog();
        renderFilterChips();
      }
    })
    .catch(function() {
      // Local fallback silently retained
    });
} catch(e) {}

/* ==========================================================================
   WEB AUDIO API SYNTHESIZER (MICRO-SOUNDS)
   ========================================================================== */
var audioEnabled = true;
var audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!audioEnabled) return;
  try {
    var ctx = getAudioContext();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    var now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'open') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.09);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch(e) {}
}

/* ==========================================================================
   APP STATE & SELECTORS
   ========================================================================== */
var currentCategory = 'All';
var currentView = 'grid';
var activeApp = null;
var previousFocusedElement = null;

try {
  currentView = localStorage.getItem('lumeed-portal-view') || 'grid';
  if (currentView !== 'table') currentView = 'grid';
  audioEnabled = localStorage.getItem('lumeed-portal-audio') !== 'false';
} catch(e) {}

var $ = function(sel) { return document.querySelector(sel); };
var $$ = function(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

var catalogOutput = $('#catalogOutput');
var filterChipsEl = $('#filterChips');
var searchInput = $('#searchInput');
var searchContainer = $('#searchContainer');
var searchClearBtn = $('#searchClearBtn');
var heroKbdShortcut = $('#heroKbdShortcut');
var viewGridBtn = $('#viewGridBtn');
var viewTableBtn = $('#viewTableBtn');

/* ==========================================================================
   MULTI-TERM SEARCH & FILTER UTILITY
   ========================================================================== */
function getFilteredApps() {
  var rawQ = (searchInput.value || '').trim();
  var q = rawQ.toLowerCase();

  return CATALOG.map(function(app, index) {
    app._index = index;
    return app;
  }).filter(function(app) {
    // If no search query, filter by category
    if (!q) {
      return currentCategory === 'All' || app.category === currentCategory;
    }

    // When searching with text, search across ALL applications
    var terms = q.split(/\s+/);
    var haystack = [
      app.name,
      app.tagline,
      app.category,
      app.version,
      'v' + app.version,
      app.type,
      app.type === 'desktop' ? 'windows win64 x64 exe desktop' : 'web cloud python fastapi streamlit',
      app.description,
      app.fileName || '',
      (app.features || []).join(' '),
      app.platform,
      app.arch || ''
    ].join(' ').toLowerCase();

    return terms.every(function(term) {
      return haystack.indexOf(term) > -1;
    });
  });
}

/* ==========================================================================
   FILTER CHIPS RENDERING
   ========================================================================== */
function renderFilterChips() {
  var categories = ['All', 'Windows Apps', 'Web Tools'];
  filterChipsEl.innerHTML = categories.map(function(cat) {
    var isSelected = cat === currentCategory;
    var count = CATALOG.filter(function(a) { return cat === 'All' || a.category === cat; }).length;
    return '<button class="filter-chip" aria-pressed="' + isSelected + '" data-cat="' + cat + '">' +
      '<span>' + cat + '</span>' +
      '<span class="chip-count">' + count + '</span>' +
    '</button>';
  }).join('');
}

/* ==========================================================================
   RENDER CATALOG (GRID VS TABLE)
   ========================================================================== */
function renderCatalog() {
  var rawQ = (searchInput.value || '').trim();
  var list = getFilteredApps();

  // Show/hide clear button based on whether user has typed anything
  searchClearBtn.style.display = rawQ.length > 0 ? 'inline-flex' : 'none';

  viewGridBtn.setAttribute('aria-selected', currentView === 'grid');
  viewTableBtn.setAttribute('aria-selected', currentView === 'table');

  if (!list.length) {
    catalogOutput.innerHTML = '<div class="empty-catalog-state">' +
      '<p>No applications match your search query <strong>"' + (searchInput.value || '') + '"</strong>.</p>' +
      '<button class="action-btn-secondary" style="margin-top:14px;" id="clearSearchBtn">Clear Search</button>' +
    '</div>';
    var clearBtn = $('#clearSearchBtn');
    if (clearBtn) {
      clearBtn.onclick = function() {
        searchInput.value = '';
        renderCatalog();
        searchInput.focus();
      };
    }
    return;
  }

  if (currentView === 'grid') {
    catalogOutput.innerHTML = '<div class="bento-grid">' + list.map(function(app, idx) {
      var isWeb = app.type === 'web';
      var isReady = app.status === 'ready';

      var statusBadge = isReady
        ? '<span class="card-status-badge ready"><span class="card-status-dot"></span>Production ' + (isWeb ? 'v' + app.version : 'v' + app.version) + '</span>'
        : '<span class="card-status-badge in_preparation"><span class="card-status-dot"></span>' + app.version + '</span>';

      var featurePills = (app.features || []).map(function(f, fi) {
        var cls = fi === 0 ? 'card-pill brand-accent' : (fi === 1 ? 'card-pill amber-accent' : 'card-pill secondary-accent');
        return '<span class="' + cls + '">' + f + '</span>';
      }).join('');

      var primaryAction = '';
      if (app.type === 'desktop' && isReady) {
        primaryAction = '<a class="action-btn-primary" href="' + app.downloadUrl + '" download data-app-idx="' + app._index + '" aria-label="Download ' + app.name + '">' +
            ICONS.download +
            '<span>Download .EXE</span>' +
            '<span class="btn-size-chip mono">' + app.fileSize + '</span>' +
          '</a>';
      } else if (app.type === 'web' && isReady) {
        primaryAction = '<a class="action-btn-primary" href="' + (app.launchUrl || app.downloadUrl) + '" data-app-idx="' + app._index + '" aria-label="Launch ' + app.name + '">' +
            ICONS.launch +
            '<span>Launch App</span>' +
            '<span class="btn-size-chip mono">Live</span>' +
          '</a>';
      } else {
        primaryAction = '<button class="action-btn-primary" data-inspect-idx="' + app._index + '" style="background:var(--solid-muted); color:var(--text-muted); box-shadow:none;">' +
            ICONS.launch +
            '<span>Preview Sandbox</span>' +
          '</button>';
      }

      return '<div class="app-card' + (app.featured ? ' featured-wide' : '') + '" data-app-idx="' + app._index + '">' +
        '<div class="card-content-wrap">' +
          '<div class="card-top-row">' +
            '<div class="card-app-icon">' + (ICONS[app.icon] || ICONS.shield) + '</div>' +
            statusBadge +
          '</div>' +
          '<div class="card-title-group">' +
            (isWeb && isReady
              ? '<h3 class="card-title"><a href="' + (app.launchUrl || app.downloadUrl) + '" style="color:inherit; text-decoration:none;" class="card-title-link">' + app.name + ' <span style="font-size:0.75em; opacity:0.6; vertical-align:middle;">↗</span></a></h3>'
              : '<h3 class="card-title">' + app.name + '</h3>') +
            '<div class="card-tagline">' + app.tagline + '</div>' +
          '</div>' +
          '<p class="card-description">' + app.description + '</p>' +
          '<div class="card-pills-row">' + featurePills + '</div>' +
          '<div class="card-footer-actions">' +
            primaryAction +
            '<button class="action-btn-secondary" data-inspect-idx="' + app._index + '" aria-label="Inspect ' + app.name + ' Specifications">' +
              ICONS.specs +
              '<span>Inspect</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  } else {
    catalogOutput.innerHTML = '<div class="table-container">' +
      '<table class="systems-table">' +
        '<thead>' +
          '<tr>' +
            '<th>System & Application</th>' +
            '<th>Category</th>' +
            '<th>Platform Architecture</th>' +
            '<th>Release Version</th>' +
            '<th>Payload Size</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + list.map(function(app) {
          var isReady = app.status === 'ready';
          return '<tr tabindex="0" data-inspect-idx="' + app._index + '">' +
            '<td>' +
              '<div class="table-app-cell">' +
                '<div class="table-app-icon">' + (ICONS[app.icon] || ICONS.shield) + '</div>' +
                '<div>' +
                  '<div class="table-app-name">' + app.name + '</div>' +
                  '<div class="table-app-type">' + app.tagline + '</div>' +
                '</div>' +
              '</div>' +
            '</td>' +
            '<td><span class="card-pill">' + app.category + '</span></td>' +
            '<td class="mono" style="font-size:0.82rem;">' + (app.type === 'desktop' ? 'Windows x64' : 'Cloud Web') + '</td>' +
            '<td class="mono font-bold" style="color:var(--brand);">' + (app.type === 'desktop' ? 'v' + app.version : app.version) + '</td>' +
            '<td class="mono">' + app.fileSize + '</td>' +
            '<td>' +
              '<div style="display:flex; gap:6px; align-items:center;">' +
                (isReady
                  ? (app.type === 'desktop'
                      ? '<a class="action-btn-primary" href="' + app.downloadUrl + '" download style="padding:6px 12px; font-size:0.78rem; text-decoration:none;" aria-label="Download ' + app.name + '">' +
                          ICONS.download + '<span style="margin-left:4px;">Download</span>' +
                        '</a>'
                      : '<a class="action-btn-primary" href="' + (app.launchUrl || app.downloadUrl) + '" style="padding:6px 12px; font-size:0.78rem; text-decoration:none;" aria-label="Launch ' + app.name + '">' +
                          ICONS.launch + '<span style="margin-left:4px;">Launch</span>' +
                        '</a>')
                  : '') +
                '<button class="action-btn-secondary" data-inspect-idx="' + app._index + '" style="padding:6px 12px; font-size:0.78rem;">' +
                  'Inspect' +
                '</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>';
  }
}

/* ==========================================================================
   DRAWER INSPECTOR PANELS (SPECS, CHANGELOG, VERIFICATION)
   ========================================================================== */
function renderDrawerPanel(tabName) {
  var app = activeApp;
  if (!app) return;

  var tabs = $$('#drawerTabs button');
  tabs.forEach(function(b) {
    b.setAttribute('aria-selected', b.dataset.tab === tabName);
  });

  var html = '';
  var isDesktop = app.type === 'desktop';

  if (tabName === 'specs') {
    html = '<dl class="specs-grid">' +
      '<dt>Release Version</dt><dd class="mono" style="color:var(--brand);">' + (isDesktop ? 'v' + app.version : app.version) + '</dd>' +
      '<dt>Target Architecture</dt><dd>' + (app.arch || 'x86-64 / x64 Architecture') + '</dd>' +
      '<dt>Supported OS</dt><dd>' + app.platform + '</dd>' +
      '<dt>Certified RAM</dt><dd>' + app.ram + '</dd>' +
      '<dt>Storage Footprint</dt><dd>' + app.disk + '</dd>' +
      '<dt>Payload Size</dt><dd class="mono">' + app.fileSize + '</dd>' +
      '<dt>Release Channel</dt><dd>Official GitHub Releases CDN</dd>' +
      '<dt>Enterprise Scope</dt><dd>' + app.description + '</dd>' +
    '</dl>';
  } else if (tabName === 'changelog') {
    html = '<ul class="changelog-timeline">' + (app.changelog || []).map(function(item) {
      return '<li class="timeline-item">' +
        '<span class="timeline-dot"></span>' +
        '<span class="timeline-version-tag mono">' + item.ver + '</span>' +
        '<div>' + item.text + '</div>' +
      '</li>';
    }).join('') + '</ul>';
  } else if (tabName === 'verify') {
    if (isDesktop) {
      html = '<div class="checksum-box">' +
        '<div class="checksum-title-row">' +
          '<strong style="font-size:0.88rem;">Official SHA-256 Checksum Signature</strong>' +
          '<span class="mono" style="font-size:0.74rem; color:var(--accent-emerald);">Verified Build</span>' +
        '</div>' +
        '<div class="checksum-code mono" id="drawerShaCode">' + app.sha256 + '</div>' +
      '</div>' +

      '<p style="font-size:0.86rem; font-weight:600; margin-bottom:8px;">PowerShell 1-Click Verification Command:</p>' +
      '<div class="command-snippet-block">' +
        '<code class="mono">Get-FileHash .\\' + app.fileName + ' -Algorithm SHA256</code>' +
        '<button class="snippet-copy-btn" id="copySnippetBtn" data-snippet="Get-FileHash .\\' + app.fileName + ' -Algorithm SHA256">Copy</button>' +
      '</div>' +

      '<p style="font-size:0.86rem; font-weight:600; margin-bottom:6px;">Instant In-Browser Drag & Drop Validator:</p>' +
      '<div class="hash-dropzone" id="hashDropzone">' +
        '<div class="dropzone-icon">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
        '</div>' +
        '<div style="font-weight:700; font-size:0.92rem; margin-bottom:4px;">Drag & Drop your ' + app.fileName + ' here</div>' +
        '<div style="font-size:0.78rem; color:var(--text-muted);">Calculated locally via Web Crypto API (100% private, 0-byte upload)</div>' +
        '<input type="file" id="hashFileInput" style="display:none;" accept=".exe">' +
      '</div>' +
      '<div class="hash-result-banner" id="hashResultBanner"></div>' +

      '<div class="smartscreen-notice">' +
        '<strong>Windows Defender SmartScreen Notice</strong>' +
        'Because internal enterprise executables are unsigned with costly commercial certs, Windows may display <em>"Windows protected your PC"</em> on initial launch. Click <strong>More info</strong>, then select <strong>Run anyway</strong>.' +
      '</div>';
    } else {
      html = '<div class="checksum-box">' +
        '<div class="checksum-title-row">' +
          '<strong style="font-size:0.88rem;">Local Web Application Execution</strong>' +
          '<span class="mono" style="font-size:0.74rem; color:var(--accent-emerald);">Verified Engine</span>' +
        '</div>' +
        '<p style="font-size:0.88rem; color:var(--text-muted); line-height:1.6; margin-top:8px;">' +
          'This web application runs directly in the client browser with zero server installation requirements. All document telemetry, weekly tracking metrics, and session calculations are persisted locally.' +
        '</p>' +
      '</div>' +
      '<div style="margin-top:16px;">' +
        '<a href="' + (app.launchUrl || app.downloadUrl) + '" class="action-btn-primary" style="display:inline-flex; width:100%; justify-content:center; text-decoration:none; padding:12px;">' +
          ICONS.launch + '<span style="margin-left:6px;">Launch ' + app.name + ' Dashboard</span>' +
        '</a>' +
      '</div>';
    }
  }

  $('#drawerBody').innerHTML = html;

  // Bind snippet copy
  var copySnippetBtn = $('#copySnippetBtn');
  if (copySnippetBtn) {
    copySnippetBtn.onclick = function() {
      var text = this.dataset.snippet;
      try { navigator.clipboard.writeText(text); } catch(e) {}
      this.textContent = 'Copied!';
      playSound('success');
      setTimeout(function() { copySnippetBtn.textContent = 'Copy'; }, 1500);
    };
  }

  // Bind in-browser hash verifier dropzone
  initHashDropzone();
}

/* ==========================================================================
   INTERACTIVE IN-BROWSER SHA-256 VALIDATOR (WEB CRYPTO API)
   ========================================================================== */
function initHashDropzone() {
  var dropzone = $('#hashDropzone');
  var fileInput = $('#hashFileInput');
  var resultBanner = $('#hashResultBanner');
  if (!dropzone || !fileInput || !resultBanner || !activeApp) return;

  dropzone.onclick = function() { fileInput.click(); };

  fileInput.onchange = function(e) {
    if (e.target.files && e.target.files[0]) {
      processFileHash(e.target.files[0]);
    }
  };

  dropzone.ondragover = function(e) {
    e.preventDefault();
    dropzone.classList.add('dragover');
  };

  dropzone.ondragleave = function(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  };

  dropzone.ondrop = function(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileHash(e.dataTransfer.files[0]);
    }
  };

  function processFileHash(file) {
    resultBanner.className = 'hash-result-banner';
    resultBanner.style.display = 'block';
    resultBanner.textContent = 'Computing SHA-256 checksum in memory...';

    var reader = new FileReader();
    reader.onload = function(evt) {
      var buffer = evt.target.result;
      if (window.crypto && window.crypto.subtle) {
        window.crypto.subtle.digest('SHA-256', buffer).then(function(hashBuffer) {
          var hashArray = Array.from(new Uint8Array(hashBuffer));
          var hashHex = hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');

          var expected = (activeApp.sha256 || '').toLowerCase().trim();
          var computed = hashHex.toLowerCase().trim();

          if (computed === expected) {
            resultBanner.className = 'hash-result-banner success';
            resultBanner.innerHTML = '✓ CHECKSUM MATCH CONFIRMED (100% Authentic Lumeed Build)<br><span class="mono" style="font-size:0.75rem;">' + hashHex.substring(0, 32) + '...</span>';
            playSound('success');
          } else {
            resultBanner.className = 'hash-result-banner fail';
            resultBanner.innerHTML = '✕ CHECKSUM MISMATCH DETECTED!<br><span class="mono" style="font-size:0.75rem;">Computed: ' + hashHex.substring(0, 20) + '...</span>';
          }
        }).catch(function() {
          resultBanner.className = 'hash-result-banner fail';
          resultBanner.textContent = 'Web Crypto calculation error.';
        });
      } else {
        resultBanner.className = 'hash-result-banner fail';
        resultBanner.textContent = 'Web Crypto API not available in current environment.';
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

/* ==========================================================================
   DRAWER CONTROLLER
   ========================================================================== */
function openDrawer(index) {
  previousFocusedElement = document.activeElement;
  activeApp = CATALOG[index];
  if (!activeApp) return;

  var isDesktop = activeApp.type === 'desktop';

  $('#drawerAppName').textContent = activeApp.name;
  $('#drawerAppSub').textContent = (isDesktop ? 'v' + activeApp.version : activeApp.version) + ' • ' + activeApp.fileSize + ' • ' + activeApp.category;
  $('#drawerIconSlot').innerHTML = ICONS[activeApp.icon] || ICONS.shield;

  renderDrawerPanel('specs');

  var primaryBtn = $('#drawerPrimaryActionBtn');
  var copyBtn = $('#drawerCopyHashBtn');

  if (isDesktop) {
    primaryBtn.style.display = 'inline-flex';
    primaryBtn.href = activeApp.downloadUrl;
    primaryBtn.setAttribute('download', '');
    primaryBtn.innerHTML = ICONS.download + '<span>Download ' + activeApp.name + '</span>';
    copyBtn.style.display = 'inline-flex';
  } else {
    primaryBtn.style.display = 'inline-flex';
    primaryBtn.href = activeApp.launchUrl || activeApp.downloadUrl || '#';
    primaryBtn.removeAttribute('download');
    primaryBtn.innerHTML = ICONS.launch + '<span>Launch ' + activeApp.name + '</span>';
    copyBtn.style.display = 'none';
  }

  $('#hardwareDrawer').classList.add('is-active');
  $('#drawerScrim').classList.add('is-active');
  $('#hardwareDrawer').setAttribute('aria-hidden', 'false');

  playSound('open');
  setTimeout(function() { $('#drawerCloseBtn').focus(); }, 80);
}

function closeDrawer() {
  $('#hardwareDrawer').classList.remove('is-active');
  $('#drawerScrim').classList.remove('is-active');
  $('#hardwareDrawer').setAttribute('aria-hidden', 'true');
  playSound('click');
  if (previousFocusedElement) previousFocusedElement.focus();
}

/* ==========================================================================
   COMMAND PALETTE CONTROLLER (CMD+K)
   ========================================================================== */
var paletteOverlay = $('#paletteOverlay');
var paletteInput = $('#paletteInput');
var paletteResults = $('#paletteResults');
var selectedPaletteIndex = 0;
var paletteItemsCache = [];

function openPalette() {
  paletteOverlay.classList.add('is-open');
  paletteOverlay.setAttribute('aria-hidden', 'false');
  paletteInput.value = '';
  renderPaletteResults();
  playSound('open');
  setTimeout(function() { paletteInput.focus(); }, 50);
}

function closePalette() {
  paletteOverlay.classList.remove('is-open');
  paletteOverlay.setAttribute('aria-hidden', 'true');
  playSound('click');
}

function renderPaletteResults() {
  var q = paletteInput.value.trim().toLowerCase();
  var items = [];

  // Software entries
  CATALOG.forEach(function(app, idx) {
    if (!q || fuzzyMatch(q, app.name + ' ' + app.tagline + ' ' + app.category)) {
      items.push({
        type: 'app',
        title: app.name,
        subtitle: app.tagline,
        badge: app.type === 'desktop' ? 'v' + app.version : 'Web',
        icon: ICONS[app.icon] || ICONS.shield,
        action: function() { openDrawer(idx); }
      });

      if (app.type === 'desktop' && app.status === 'ready' && app.downloadUrl && app.downloadUrl !== '#') {
        items.push({
          type: 'download',
          title: 'Download ' + app.name,
          subtitle: 'Direct installer download (' + app.fileSize + ')',
          badge: 'Download',
          icon: ICONS.download,
          action: function() {
            var a = document.createElement('a');
            a.href = app.downloadUrl;
            a.download = app.fileName || '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            playSound('success');
          }
        });
      } else if (app.type === 'web' && app.status === 'ready' && (app.launchUrl || app.downloadUrl) && (app.launchUrl || app.downloadUrl) !== '#') {
        items.push({
          type: 'launch',
          title: 'Launch ' + app.name,
          subtitle: 'Open web application in browser (' + app.tagline + ')',
          badge: 'Launch',
          icon: ICONS.launch,
          action: function() {
            window.location.href = app.launchUrl || app.downloadUrl;
          }
        });
      }
    }
  });

  // Quick Global Actions
  var actions = [
    {
      type: 'action',
      title: 'Toggle Color Theme (Dark / Light)',
      subtitle: 'Switch between Obsidian and Platinum Light interface',
      badge: 'Theme',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
      action: toggleTheme
    },
    {
      type: 'action',
      title: 'Toggle Audio Synthesizer',
      subtitle: 'Enable or disable interactive UI sounds',
      badge: 'Audio',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>',
      action: toggleAudio
    },
    {
      type: 'action',
      title: 'Switch to Grid View',
      subtitle: 'Display interactive cards with cursor spotlight beam',
      badge: 'View',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
      action: function() { setViewMode('grid'); }
    },
    {
      type: 'action',
      title: 'Switch to Compact Table View',
      subtitle: 'High-density enterprise tabular listing',
      badge: 'View',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
      action: function() { setViewMode('table'); }
    }
  ];

  actions.forEach(function(act) {
    if (!q || fuzzyMatch(q, act.title + ' ' + act.subtitle)) {
      items.push(act);
    }
  });

  paletteItemsCache = items;
  selectedPaletteIndex = 0;

  if (!items.length) {
    paletteResults.innerHTML = '<li style="padding:20px; text-align:center; color:var(--text-muted); font-size:0.9rem;">No matching commands found.</li>';
    return;
  }

  paletteResults.innerHTML = items.map(function(item, i) {
    var isSel = i === selectedPaletteIndex;
    return '<li class="palette-item' + (isSel ? ' is-selected' : '') + '" data-idx="' + i + '">' +
      '<div class="palette-item-left">' +
        '<div class="palette-item-icon">' + item.icon + '</div>' +
        '<div>' +
          '<div class="palette-item-title">' + item.title + '</div>' +
          '<div style="font-size:0.76rem; color:var(--text-muted);">' + item.subtitle + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="palette-item-badge">' + item.badge + '</span>' +
    '</li>';
  }).join('');
}

function updatePaletteSelection() {
  var listItems = $$('.palette-item');
  listItems.forEach(function(el, i) {
    if (i === selectedPaletteIndex) {
      el.classList.add('is-selected');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('is-selected');
    }
  });
}

function executeSelectedPaletteItem() {
  if (paletteItemsCache[selectedPaletteIndex]) {
    closePalette();
    paletteItemsCache[selectedPaletteIndex].action();
  }
}

/* ==========================================================================
   THEME TOGGLE
   ========================================================================== */
function toggleTheme() {
  var root = document.documentElement;
  var isDark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  var nextTheme = isDark ? 'light' : 'dark';
  root.dataset.theme = nextTheme;
  try { localStorage.setItem('lumeed-portal-theme', nextTheme); } catch(e) {}
  playSound('click');
}

/* Restore saved theme; dark is the default when the visitor has no preference */
try {
  var savedTheme = localStorage.getItem('lumeed-portal-theme');
  document.documentElement.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';
} catch(e) {}

/* ==========================================================================
   AUDIO TOGGLE
   ========================================================================== */
function toggleAudio() {
  audioEnabled = !audioEnabled;
  try { localStorage.setItem('lumeed-portal-audio', audioEnabled ? 'true' : 'false'); } catch(e) {}
  updateAudioIcon();
  if (audioEnabled) playSound('click');
}

function updateAudioIcon() {
  var onIcon = $('#soundOnIcon');
  var offIcon = $('#soundOffIcon');
  if (onIcon && offIcon) {
    onIcon.style.display = audioEnabled ? 'block' : 'none';
    offIcon.style.display = audioEnabled ? 'none' : 'block';
  }
}
updateAudioIcon();

/* ==========================================================================
   VIEW MODE TOGGLE (GRID / TABLE)
   ========================================================================== */
function setViewMode(mode) {
  currentView = mode;
  try { localStorage.setItem('lumeed-portal-view', mode); } catch(e) {}
  playSound('click');
  renderCatalog();
}

/* ==========================================================================
   EVENT LISTENERS & BINDINGS
   ========================================================================== */

// Category Filter Click
filterChipsEl.addEventListener('click', function(e) {
  var btn = e.target.closest('.filter-chip');
  if (btn) {
    currentCategory = btn.dataset.cat;
    renderFilterChips();
    renderCatalog();
    playSound('click');
  }
});

// Search input interactions
searchInput.addEventListener('input', function() {
  renderCatalog();
});

searchInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    var catEl = $('#catalogOutput');
    if (catEl) {
      catEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (e.key === 'Escape') {
    searchInput.blur();
  }
});

// Clear Search Button
searchClearBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  searchInput.value = '';
  searchClearBtn.style.display = 'none';
  renderCatalog();
  searchInput.focus();
  playSound('click');
});

// Clicking Search Trigger Box focuses input
$('#heroSearchBox').addEventListener('click', function(e) {
  if (e.target !== searchClearBtn && !e.target.closest('#heroKbdShortcut')) {
    searchInput.focus();
  }
});

// Clicking Hero Keyboard Shortcut opens command palette
heroKbdShortcut.addEventListener('click', function(e) {
  e.stopPropagation();
  openPalette();
});

// View switchers
viewGridBtn.onclick = function() { setViewMode('grid'); };
viewTableBtn.onclick = function() { setViewMode('table'); };

// Header buttons
$('#themeToggle').onclick = toggleTheme;
$('#audioToggle').onclick = toggleAudio;
$('#paletteBtn').onclick = openPalette;

// Drawer triggers and direct actions in Catalog
catalogOutput.addEventListener('click', function(e) {
  var inspectBtn = e.target.closest('[data-inspect-idx]');
  if (inspectBtn) {
    openDrawer(+inspectBtn.dataset.inspectIdx);
    return;
  }
  var card = e.target.closest('.app-card');
  if (card && !e.target.closest('a')) {
    var app = CATALOG[+card.dataset.appIdx];
    if (app && app.type === 'web' && (app.launchUrl || app.downloadUrl) && (app.launchUrl || app.downloadUrl) !== '#') {
      playSound('open');
      window.location.href = app.launchUrl || app.downloadUrl;
    } else {
      openDrawer(+card.dataset.appIdx);
    }
  }
});

// Trigger download audio feedback
document.addEventListener('click', function(e) {
  var dl = e.target.closest('a[download]');
  if (dl && dl.getAttribute('href') && dl.getAttribute('href') !== '#') {
    playSound('success');
  }
});

catalogOutput.addEventListener('keydown', function(e) {
  var tr = e.target.closest('tr[data-inspect-idx]');
  if (tr && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    openDrawer(+tr.dataset.inspectIdx);
  }
});

// Interactive Cursor Spotlight tracking for Bento Cards
catalogOutput.addEventListener('pointermove', function(e) {
  var card = e.target.closest('.app-card');
  if (card) {
    var rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
  }
});

// Drawer events
$('#drawerCloseBtn').onclick = closeDrawer;
$('#drawerScrim').onclick = closeDrawer;

$('#drawerTabs').addEventListener('click', function(e) {
  var tabBtn = e.target.closest('button[data-tab]');
  if (tabBtn) {
    renderDrawerPanel(tabBtn.dataset.tab);
    playSound('click');
  }
});

$('#drawerCopyHashBtn').onclick = function() {
  var btn = this;
  if (activeApp && activeApp.sha256) {
    try { navigator.clipboard.writeText(activeApp.sha256); } catch(e) {}
    btn.textContent = 'Copied!';
    playSound('success');
    setTimeout(function() { btn.textContent = 'Copy Hash'; }, 1500);
  }
};

// Command Palette Keyboard Navigation
paletteInput.addEventListener('input', renderPaletteResults);

paletteResults.addEventListener('click', function(e) {
  var itemEl = e.target.closest('.palette-item');
  if (itemEl) {
    selectedPaletteIndex = +itemEl.dataset.idx;
    executeSelectedPaletteItem();
  }
});

paletteOverlay.onclick = function(e) {
  if (e.target === paletteOverlay) closePalette();
};

document.addEventListener('keydown', function(e) {
  var isPaletteOpen = paletteOverlay.classList.contains('is-open');
  var isDrawerOpen = $('#hardwareDrawer').classList.contains('is-active');
  var isTyping = /^(INPUT|TEXTAREA|SELECT)$/i.test(document.activeElement.tagName);

  // Pressing '/' focuses search input
  if (e.key === '/' && !isTyping && !isPaletteOpen && !isDrawerOpen) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    searchInput.focus();
    return;
  }

  // Open Command Palette: CMD+K or Ctrl+K
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (isPaletteOpen) closePalette();
    else openPalette();
    return;
  }

  if (isPaletteOpen) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedPaletteIndex = (selectedPaletteIndex + 1) % paletteItemsCache.length;
      updatePaletteSelection();
      playSound('click');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedPaletteIndex = (selectedPaletteIndex - 1 + paletteItemsCache.length) % paletteItemsCache.length;
      updatePaletteSelection();
      playSound('click');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelectedPaletteItem();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
    return;
  }

  if (e.key === 'Escape') {
    if (isDrawerOpen) {
      closeDrawer();
    } else if (document.activeElement === searchInput) {
      searchInput.value = '';
      searchInput.blur();
      renderCatalog();
    }
  }
});

// Header Scrolled Glass Effect
var headerWrapper = $('#headerWrapper');
window.addEventListener('scroll', function() {
  if (window.scrollY > 20) {
    headerWrapper.classList.add('is-scrolled');
  } else {
    headerWrapper.classList.remove('is-scrolled');
  }
}, { passive: true });

/* ==========================================================================
   INTERACTIVE PARALLAX & ORGANIC SINE UNDULATION FOR HERO SCENE LAYERS
   ========================================================================== */
var sceneLayers = $$('.scene-anchor');
var heroContent = $('#heroContent');
var targetMouseX = 0, targetMouseY = 0;
var smoothMouseX = 0, smoothMouseY = 0;
var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('pointermove', function(e) {
  targetMouseX = e.clientX / window.innerWidth - 0.5;
  targetMouseY = e.clientY / window.innerHeight - 0.5;
}, { passive: true });

function animationLoop(timestamp) {
  var time = timestamp * 0.0014;
  var scrollY = window.scrollY;

  // Ultra-smooth exponential Lerp interpolation for mouse parallax (no stutter)
  smoothMouseX += (targetMouseX - smoothMouseX) * 0.075;
  smoothMouseY += (targetMouseY - smoothMouseY) * 0.075;

  if (scrollY <= 1100 && !reduceMotion) {
    sceneLayers.forEach(function(layer, idx) {
      var speed = +layer.dataset.parallax || 0.2;
      // Organic sine undulation, phase-offset per layer so the scene breathes
      var phase = +layer.dataset.phase || idx;
      var organicX = Math.sin(time + phase * 1.4) * 20 * speed;
      var organicY = Math.cos(time + phase * 1.1) * 16 * speed;
      var posX = smoothMouseX * speed * 65 + organicX;
      var posY = (scrollY * speed * 0.40) + (smoothMouseY * speed * 42) + organicY;
      layer.style.transform = 'translate3d(' + posX + 'px, ' + posY + 'px, 0)';
    });

    if (heroContent) {
      heroContent.style.transform = 'translate3d(0, ' + (scrollY * 0.16) + 'px, 0)';
      heroContent.style.opacity = Math.max(0, 1 - scrollY / 620);
    }
  }

  requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);

/* ==========================================================================
   TYPEWRITER CYCLING EFFECT
   ========================================================================== */
var typewriterEl = $('#typewriterText');
if (typewriterEl) {
  var phrases = [
    'Precision internal utilities',
    'Tools you can trust',
    'Direct cloud delivery.'
  ];
  var phraseIdx = 0;
  var charIdx = phrases[0].length;
  var deleting = false;

  function runTypewriter() {
    var fullText = phrases[phraseIdx];

    if (deleting) {
      charIdx--;
      typewriterEl.textContent = fullText.substring(0, charIdx);
    } else {
      charIdx++;
      typewriterEl.textContent = fullText.substring(0, charIdx);
    }

    var delay = deleting ? 28 : 64;

    if (!deleting && charIdx === fullText.length) {
      delay = 2200;
      deleting = true;
    } else if (deleting && charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      delay = 320;
    }

    setTimeout(runTypewriter, delay);
  }

  setTimeout(function() {
    deleting = true;
    runTypewriter();
  }, 2400);
}

/* Initial Render */
renderFilterChips();
renderCatalog();

})();
