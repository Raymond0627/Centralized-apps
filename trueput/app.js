
/* ============================
   CONFIG
============================ */
const TOTAL_PAGES = 2_000_000;
const WD_PER_WEEK = 4;
const WD_PER_MONTH = 17;

const PROCESSES = [
  { id: 'groom', name: 'Grooming',   icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { id: 'scan',  name: 'Scanning',   icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>' },
  { id: 'valid', name: 'Validation', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>' },
  { id: 'audit', name: 'Audit',      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v3l2 2"/></svg>' }
];

/* ============================
   DATES
============================ */
let today = new Date();
today.setHours(0,0,0,0);
let projectYear = today.getFullYear();
const sDate = () => new Date(projectYear, 0, 1);
const eDate = () => { const d = new Date(projectYear, 11, 31); d.setHours(0,0,0,0); return d; };

function refreshDateIfChanged() {
  const newToday = new Date();
  newToday.setHours(0,0,0,0);
  const newYear = newToday.getFullYear();
  if (newToday.getTime() === today.getTime() && newYear === projectYear) return false;
  today = newToday;
  projectYear = newYear;
  return true;
}

function fullRerender() {
  PROCESSES.forEach(p => { renderRecordsList(p.id); updateProcessDisplay(p.id); });

  updateTabDots();
  renderMasterTable();
  renderProjections();
  if (mainChart) {
    mainChart.options.scales.x.min = sDate();
    mainChart.options.scales.x.max = eDate();
    if (mainChart.options.plugins.zoom) {
      mainChart.options.plugins.zoom.limits.x.min = new Date(projectYear - 1, 0, 1).getTime();
      mainChart.options.plugins.zoom.limits.x.max = new Date(projectYear + 1, 11, 31).getTime();
    }
  }
  updateMainChart();
  updateZoomLabelFromChart();
  initCalc1Date(false);
  calc1Update();
}

// Re-check the date when the tab becomes visible again (e.g. user returns next day)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && refreshDateIfChanged()) fullRerender();
});

// Backup: poll every 30 minutes in case the tab stays open
setInterval(() => { if (refreshDateIfChanged()) fullRerender(); }, 30 * 60 * 1000);

function isWeekday(d) { const x = d.getDay(); return x >= 1 && x <= 4; }
function workingDaysBetween(a, b) {
  if (b < a) return 0;
  let count = 0;
  const cur = new Date(a); cur.setHours(0,0,0,0);
  const end = new Date(b); end.setHours(0,0,0,0);
  while (cur <= end) {
    if (isWeekday(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
function addCalendarDays(start, n) {
  const d = new Date(start);
  d.setDate(d.getDate() + Math.ceil(n));
  return d;
}
function addWorkingDays(start, n) {
  const d = new Date(start);
  d.setHours(0,0,0,0);
  let remaining = Math.max(0, Math.ceil(n));
  if (isWeekday(d)) {
    remaining -= 1;
    if (remaining <= 0) return d;
  }
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (isWeekday(d)) remaining--;
  }
  return d;
}
function fmt(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtLong(d) { return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function num(v) { return (Number(v) || 0).toLocaleString(); }

/* ============================
   STORAGE (local-first + shared D1 mirror)
============================ */
function loadData(id) {
  return TPStore.getProcess(id);
}
function saveData(id, data) { TPStore.setProcess(id, data); }
function getCompleted(data) { return (data.records || []).reduce((s, r) => s + (Number(r.pages) || 0), 0); }

/* ============================
   WEEKLY TRACKING STORAGE
============================ */
function loadWeeklyEntries() {
  return TPStore.getWeekly();
}
function saveWeeklyEntries(entries) {
  TPStore.setWeekly(entries);
}
function loadPaperTypes() {
  return TPStore.getPaperTypes();
}
function savePaperTypes(types) {
  TPStore.setPaperTypes(types);
}

/* ============================
   COMPUTATIONS
============================ */
function computeProcess(proc) {
  const data = loadData(proc.id);
  const rate = Math.max(0, Number(data.rate) || 0);
  const unit = data.unit || 'daily';
  const records = data.records || [];
  const completed = getCompleted(data);

  const elapsedWD  = workingDaysBetween(sDate(), today);
  const totalWD    = workingDaysBetween(sDate(), eDate());
  const remainingWD = Math.max(0, totalWD - elapsedWD);

  const expected = (elapsedWD / totalWD) * TOTAL_PAGES;
  const pctComplete = (completed / TOTAL_PAGES) * 100;

  let dailyRate = 0;
  if (rate > 0) {
    if (unit === 'daily')        dailyRate = rate;
    else if (unit === 'weekly')  dailyRate = rate / WD_PER_WEEK;
    else if (unit === 'monthly') dailyRate = rate / WD_PER_MONTH;
  }

  // Current pace: based on records
  let currentPace = 0;
  if (records.length > 0) {
    const sorted = [...records].sort((a,b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sorted[0].date);
    const refDate = (sorted[sorted.length - 1].date >= toISODate(today)) ? today : firstDate;
    const wd = Math.max(1, workingDaysBetween(sDate(), new Date(sorted[sorted.length-1].date)));
    currentPace = completed / wd;
  }

  const requiredPace = remainingWD > 0 ? (TOTAL_PAGES - completed) / remainingWD : Infinity;

  // Projected finish
  let projectedFinish = null;
  if (dailyRate > 0) {
    const remainingPages = Math.max(0, TOTAL_PAGES - completed);
    const refPoint = records.length > 0 ? new Date(records[records.length-1].date) : today;
    const daysToFinish = remainingPages / dailyRate;
    projectedFinish = addCalendarDays(refPoint, daysToFinish);
  }

  // Status
  let status = 'green';
  if (dailyRate <= 0) {
    status = completed >= TOTAL_PAGES ? 'green' : 'red';
  } else if (projectedFinish) {
    const daysLate = Math.round((projectedFinish - eDate()) / 86400000);
    if (daysLate <= 0)       status = 'green';
    else if (daysLate <= 14) status = 'amber';
    else                     status = 'red';
  }

  const remainingPages = Math.max(0, TOTAL_PAGES - completed);
  const daysToComplete   = dailyRate > 0 ? Math.ceil(remainingPages / dailyRate) : null;
  const weeksToComplete  = daysToComplete != null ? (daysToComplete / 7) : null;
  const monthsToComplete = daysToComplete != null ? (daysToComplete / 30) : null;

  // Days to complete based on current pace
  const daysToCompleteAtCurrentPace = currentPace > 0
    ? Math.ceil(remainingPages / currentPace)
    : null;

  // Months to complete based on current pace (22 working days per month)
  const monthsToCompleteAtCurrentPace = daysToCompleteAtCurrentPace != null
    ? (daysToCompleteAtCurrentPace / 22)
    : null;

  return {
    completed, expected, pctComplete, records,
    currentPace, requiredPace,
    dailyRate, weeklyRate: dailyRate * WD_PER_WEEK, monthlyRate: dailyRate * WD_PER_MONTH,
    daysToComplete, weeksToComplete, monthsToComplete,
    remainingPages, remainingWD, elapsedWD, totalWD,
    projectedFinish, status,
    daysToCompleteAtCurrentPace, monthsToCompleteAtCurrentPace  // NEW
  };
}

/* ============================
   CHART DATA
============================ */
function getViewRange() {
  return { min: sDate(), max: eDate(), unit: 'month', display: 'MMM yyyy' };
}

function getPlannedSeries(r) {
  const pts = [];
  for (let m = 0; m <= 12; m++) {
    const d = new Date(projectYear, m, 1);
    if (d > eDate()) d.setTime(eDate().getTime());
    const wd = workingDaysBetween(sDate(), d);
    pts.push({ x: d, y: (wd / r.totalWD) * TOTAL_PAGES });
  }
  return pts;
}
function getActualSeries(records) {
  if (!records || records.length === 0) {
    return [
      { x: sDate(), y: 0 },
      { x: today,     y: 0 }
    ];
  }
  const sorted = [...records].sort((a,b) => new Date(a.date) - new Date(b.date));
  const pts = [{ x: sDate(), y: 0 }];
  let cum = 0;
  for (const rec of sorted) {
    cum += Number(rec.pages) || 0;
    pts.push({ x: new Date(rec.date), y: cum });
  }
  // extend flat to today
  const last = new Date(sorted[sorted.length-1].date);
  if (last < today) pts.push({ x: today, y: cum });
  return pts;
}
function getProjectedSeries(records, completed, dailyRate) {
  if (dailyRate <= 0) return [];
  const remainingPages = Math.max(0, TOTAL_PAGES - completed);
  if (remainingPages <= 0) return [];
  const refDate = records.length > 0 ? new Date(records[records.length-1].date) : today;
  const refY    = records.length > 0 ? completed : 0;
  const daysNeeded = remainingPages / dailyRate;
  const endFinish  = addCalendarDays(refDate, daysNeeded);
  return [
    { x: refDate,   y: refY },
    { x: endFinish, y: TOTAL_PAGES }
  ];
}

/* ============================
   HELPERS
============================ */
function statusColor(s) { return s === 'green' ? 'var(--green)' : s === 'amber' ? 'var(--amber)' : 'var(--red)'; }
function statusBg(s)   { return s === 'green' ? 'var(--green-bg)' : s === 'amber' ? 'var(--amber-bg)' : 'var(--red-bg)'; }
function statusLabel(s){ return s === 'green' ? 'On Track' : s === 'amber' ? 'At Risk' : 'Behind'; }
function daysLateText(finish) {
  if (!finish) return 'no rate set';
  const d = Math.round((finish - eDate()) / 86400000);
  if (d <= 0) return `${Math.abs(d)} day${Math.abs(d)===1?'':'s'} early`;
  return `${d} day${d===1?'':'s'} late`;
}
function getLatestWeeklyDailyRate(procId) {
  const entries = loadWeeklyEntries();
  if (entries.length === 0) return 0;
  const fieldMap = { groom: 'groom', scan: 'scan', valid: 'valid', audit: 'audit' };
  const field = fieldMap[procId];
  const latest = entries[entries.length - 1];
  const output = Number(latest[field]) || 0;
  return output / WD_PER_WEEK;
}

/* ============================
   BUILD UI (once)
============================ */
function buildProcessCards() {
  const grid = document.getElementById('process-grid');
  if (!grid) return;
  const todayISO = toISODate(today);

  grid.innerHTML = PROCESSES.map(p => {
    const data = loadData(p.id);
    return `
    <div class="process-card" data-id="${p.id}">
      <div class="process-head">
        <div style="display:flex;gap:10px;align-items:center">
          <div class="process-icon">${p.icon}</div>
          <div>
            <div class="process-name">${p.name}</div>
            <span class="status-badge" data-role="status-badge"><span class="dot"></span><span data-role="status-text">—</span></span>
          </div>
        </div>
      </div>



      <div class="total-row">
        <div class="lbl">Total Completed (from records)</div>
        <div class="val" data-role="completed-val">0</div>
        <div class="progress-bar"><div class="progress-fill" data-role="progress-fill" style="width:0%"></div></div>
        <div class="progress-labels">
          <span data-role="progress-done">0 pages</span>
          <span data-role="progress-pct">0%</span>
        </div>
      </div>

      <div class="records-section">
        <div class="head">
          <span class="label">Weekly Records</span>
        </div>
        <form class="add-form" data-role="add-form" autocomplete="off">
          <input type="date" data-role="add-date" value="${todayISO}" required />
          <input type="number" data-role="add-pages" min="0" step="1" placeholder="Pages this week" required />
          <button type="submit">+ Add</button>
        </form>
        <div class="records-list" data-role="records-list"></div>
      </div>

      <div class="metric-row">
        <div class="metric">
          <div class="label">Current Pace</div>
          <div class="value" data-role="current-pace">—</div>
          <div class="sub" data-role="required-pace">—</div>
        </div>
        <div class="metric">
          <div class="label">Remaining</div>
          <div class="value" data-role="remaining">—</div>
          <div class="sub" data-role="remaining-wd">—</div>
        </div>
      </div>
    </div>
    `;
  }).join('');

  // Bind events ONCE
  grid.querySelectorAll('.process-card').forEach(card => {
    const id = card.dataset.id;

    // Add record form
    card.querySelector('[data-role="add-form"]').addEventListener('submit', (e) => {
      e.preventDefault();
      const date = card.querySelector('[data-role="add-date"]').value;
      const pages = card.querySelector('[data-role="add-pages"]').value;
      if (!date || pages === '' || Number(pages) < 0) return;
      const cur = loadData(id);
      if (!cur.records) cur.records = [];
      cur.records.push({ date, pages: Number(pages) || 0 });
      saveData(id, cur);
      card.querySelector('[data-role="add-pages"]').value = '';
      renderRecordsList(id);
      onProcessChange(id);
    });
  });
}

function renderRecordsList(id) {
  const card = document.querySelector(`.process-card[data-id="${id}"]`);
  if (!card) return;
  const data = loadData(id);
  const list = card.querySelector('[data-role="records-list"]');
  const records = (data.records || []).slice().sort((a,b) => new Date(a.date) - new Date(b.date));

  if (records.length === 0) {
    list.innerHTML = '<div class="empty">No records yet. Add weekly entries above to plot the actual line.</div>';
    return;
  }

  let cum = 0;
  const rows = records.map((r, idx) => {
    cum += Number(r.pages) || 0;
    return `<tr>
      <td>${fmt(new Date(r.date))}</td>
      <td class="num">${num(r.pages)}</td>
      <td class="num"><strong>${num(cum)}</strong></td>
      <td><button class="del-btn" data-idx="${idx}" title="Delete">✕</button></td>
    </tr>`;
  }).join('');

  list.innerHTML = `<table>
    <thead><tr><th>Date</th><th class="num">Pages</th><th class="num">Cumulative</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;

  // Bind delete buttons
  list.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const cur = loadData(id);
      cur.records.splice(idx, 1);
      saveData(id, cur);
      renderRecordsList(id);
      onProcessChange(id);
    });
  });
}

/* ============================
   DISPLAY UPDATES
============================ */
function updateProcessDisplay(id) {
  const proc = PROCESSES.find(p => p.id === id);
  const card = document.querySelector(`.process-card[data-id="${id}"]`);
  if (!card) return;
  const r = computeProcess(proc);

  // Status badge
  const badge = card.querySelector('[data-role="status-badge"]');
  badge.classList.remove('green','amber','red');
  badge.classList.add(r.status);
  card.querySelector('[data-role="status-text"]').textContent = statusLabel(r.status);

  // Card accent
  card.classList.remove('status-green','status-amber','status-red');
  card.classList.add('status-' + r.status);

  // Total & progress
  card.querySelector('[data-role="completed-val"]').textContent = num(r.completed) + ' pages';
  card.querySelector('[data-role="progress-fill"]').style.width = Math.min(100, r.pctComplete).toFixed(2) + '%';
  card.querySelector('[data-role="progress-done"]').textContent = num(r.completed) + ' of ' + num(TOTAL_PAGES);
  card.querySelector('[data-role="progress-pct"]').textContent = r.pctComplete.toFixed(1) + '%';

  // Metrics
  card.querySelector('[data-role="current-pace"]').innerHTML = `${num(Math.round(r.currentPace))}<span style="font-size:11px;color:var(--text-soft);font-weight:500"> /day</span>`;
  card.querySelector('[data-role="required-pace"]').textContent = `need ${num(Math.round(r.requiredPace))}/day`;

  card.querySelector('[data-role="remaining"]').textContent = num(r.remainingPages);
  card.querySelector('[data-role="remaining-wd"]').textContent = `${num(r.remainingWD)} work days left`;
}

function updateTabDots() {
  PROCESSES.forEach(p => {
    const r = computeProcess(p);
    const dot = document.getElementById('tab-dot-' + p.id);
    if (dot) { dot.classList.remove('green','amber','red'); dot.classList.add(r.status); }
  });
}

function updateSelectedMetrics(procId) {
  const proc = PROCESSES.find(p => p.id === procId);
  const r = computeProcess(proc);
  const proj = computeProcessProjection(procId);
  const el = document.getElementById('selectedMetrics');
  el.innerHTML = `
    <div class="metric-tile">
      <div class="label">Projected Finish Date</div>
      <div class="value ${proj.status}">${proj.projectedDate ? fmt(proj.projectedDate) : '—'}</div>
      <div class="sub">${proj.remaining > 0 && proj.projectedDate ? '~' + proj.weeksNeeded + ' weeks · ~' + proj.monthsNeeded + ' months' : proj.remaining <= 0 ? 'Complete!' : 'no weekly data'}</div>
    </div>
    <div class="metric-tile">
      <div class="label">Current Pace</div>
      <div class="value">${num(Math.round(r.currentPace))} <span style="font-size:11px;color:var(--text-soft);font-weight:500">/day</span></div>
      <div class="sub">need ${num(Math.round(r.requiredPace))}/day</div>
    </div>
    <div class="metric-tile">
      <div class="label">Team Size</div>
      <div class="value">${proj.teamSize > 0 ? proj.teamSize + ' people' : '—'}</div>
      <div class="sub">${proj.teamSize > 0 ? 'from latest weekly entry' : 'no team data'}</div>
    </div>
    <div class="metric-tile">
      <div class="label">Remaining</div>
      <div class="value">${num(r.remainingPages)}</div>
      <div class="sub">${num(r.remainingWD)} working days left</div>
    </div>
    <div class="metric-tile">
      <div class="label">Total Completed</div>
      <div class="value">${num(r.completed)}</div>
      <div class="sub">${r.pctComplete.toFixed(2)}% of target</div>
    </div>
    <div class="metric-tile">
      <div class="label">Records Logged</div>
      <div class="value">${r.records.length}</div>
      <div class="sub">weekly entries</div>
    </div>
  `;
}

/* ============================
   MAIN CHART
============================ */
let mainChart = null;
let currentChartProc = 'groom';
let projectionMode = 'average';

function updateChartScale() {
  if (!mainChart) return;
  const xMin = mainChart.scales.x.min;
  const xMax = mainChart.scales.x.max;
  const visibleDays = (xMax - xMin) / 86400000;

  let unit, maxRotation, tooltipFmt;
  if (visibleDays < 30) {
    unit = 'day';
    maxRotation = 45;
    tooltipFmt = 'EEE, MMM d, yyyy';
  } else if (visibleDays < 180) {
    unit = 'week';
    maxRotation = 0;
    tooltipFmt = 'MMM d, yyyy';
  } else {
    unit = 'month';
    maxRotation = 0;
    tooltipFmt = 'MMM yyyy';
  }

  if (mainChart.options.scales.x.time.unit !== unit) {
    mainChart.options.scales.x.time.unit = unit;
    mainChart.options.scales.x.time.tooltipFormat = tooltipFmt;
    mainChart.options.scales.x.ticks.maxRotation = maxRotation;
    mainChart.update('none');
  }
}

function updateZoomLabelFromChart() {
  if (!mainChart) return;
  const fullRange = eDate().getTime() - sDate().getTime();
  const visibleRange = mainChart.scales.x.max - mainChart.scales.x.min;
  const pct = Math.round((fullRange / visibleRange) * 100);
  document.getElementById('zoomLabel').textContent = pct + '%';
}

function createMainChart() {
  const canvas = document.getElementById('mainChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = '<div class="chart-error">Chart.js failed to load. Check your internet connection.</div>';
    return;
  }

  try {
    mainChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Planned',
            data: [],
            borderColor: '#cbd5e1',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#94a3b8',
            fill: false,
            tension: 0.1,
            order: 5
          },
          {
            label: 'Actual',
            data: [],
            borderColor: '#6C5CC8',
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#6C5CC8',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#5848B8',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3,
            fill: {
              target: 'origin',
              above: 'rgba(108, 92, 200, 0.08)'
            },
            tension: 0.15,
            order: 2
          },
          {
            label: 'Projected (current)',
            data: [],
            borderColor: '#64748b',
            borderWidth: 2.5,
            borderDash: [8, 5],
            pointRadius: 4,
            pointBackgroundColor: '#64748b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1,
            order: 1
          },
          {
            label: 'Grooming proj.',
            data: [],
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            fill: false,
            tension: 0.1,
            hidden: true,
            order: 4
          },
          {
            label: 'Scanning proj.',
            data: [],
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            fill: false,
            tension: 0.1,
            hidden: true,
            order: 3
          },
          {
            label: 'Validation proj.',
            data: [],
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            fill: false,
            tension: 0.1,
            hidden: true,
            order: 3
          },
          {
            label: 'Audit proj.',
            data: [],
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            fill: false,
            tension: 0.1,
            hidden: true,
            order: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeOutQuart' },
        interaction: { mode: 'nearest', axis: 'xy', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.96)',
            titleColor: '#1F1D2B',
            bodyColor: '#6B6A78',
            borderColor: '#EAEAED',
            borderWidth: 1,
            padding: 14,
            cornerRadius: 10,
            boxPadding: 4,
            displayColors: true,
            titleFont: { weight: '700', size: 13 },
            bodyFont: { size: 12 },
            callbacks: {
              title: items => {
                const d = new Date(items[0].parsed.x);
                return fmtLong(d);
              },
              label: ctx => ' ' + ctx.dataset.label + ': ' + num(Math.round(ctx.parsed.y)) + ' pages'
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              modifierKey: null,
              onPan: () => { updateChartScale(); updateZoomLabelFromChart(); }
            },
            zoom: {
              wheel: { enabled: true, speed: 0.05 },
              pinch: { enabled: true },
              drag: { enabled: false },
              mode: 'x',
              onZoom: () => { updateChartScale(); updateZoomLabelFromChart(); }
            },
            limits: {
              x: { min: new Date(projectYear - 1, 0, 1).getTime(), max: new Date(projectYear + 1, 11, 31).getTime() }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              tooltipFormat: 'MMM yyyy',
              displayFormats: { month: 'MMM yyyy', week: 'MMM dd', day: 'MMM dd' }
            },
            min: sDate(),
            max: eDate(),
            border: { color: 'rgba(108, 92, 200, 0.2)' },
            grid: { color: 'rgba(108, 92, 200, 0.07)', drawTicks: false },
            ticks: { color: '#6B6A78', maxRotation: 45, autoSkipPadding: 20, padding: 8, font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            max: TOTAL_PAGES,
            border: { color: 'rgba(108, 92, 200, 0.2)' },
            grid: { color: 'rgba(108, 92, 200, 0.07)', drawTicks: false },
            ticks: {
              color: '#64748b',
              padding: 8,
              font: { size: 11 },
              callback: function(v) {
                if (v >= 1000000) return (v/1000000).toFixed(1) + 'M';
                if (v >= 1000)    return (v/1000).toFixed(0) + 'K';
                return v;
              }
            }
          }
        }
      }
    });
    updateChartColorsForTheme(document.documentElement.getAttribute('data-theme') || 'light');
  } catch (e) {
    console.error('Chart init failed:', e);
    canvas.parentElement.innerHTML = '<div class="chart-error">Chart failed to render: ' + e.message + '</div>';
    return;
  }

  // Tab handlers
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentChartProc = tab.dataset.pid;
      updateMainChart();
    });
  });

  // Zoom controls
  document.getElementById('zoomIn').addEventListener('click', () => {
    mainChart.zoom(1.2);
    updateZoomLabelFromChart();
  });
  document.getElementById('zoomOut').addEventListener('click', () => {
    mainChart.zoom(0.8);
    updateZoomLabelFromChart();
  });
  document.getElementById('zoomReset').addEventListener('click', () => {
    mainChart.resetZoom();
    mainChart.options.scales.x.min = sDate();
    mainChart.options.scales.x.max = eDate();
    mainChart.options.scales.x.time.unit = 'month';
    mainChart.options.scales.x.ticks.maxRotation = 0;
    mainChart.update('none');
    updateZoomLabelFromChart();
  });

  updateMainChart();
}

function updateMainChart() {
  if (!mainChart) return;
  const proc = PROCESSES.find(p => p.id === currentChartProc);
  const r = computeProcess(proc);
  const color = r.status === 'green' ? '#10b981' : r.status === 'amber' ? '#f59e0b' : '#ef4444';

  const modeLabel = projectionMode === 'currentPhase' ? 'Current Phase' : 'Avg Projection';
  document.getElementById('mainChartTitle').textContent = proc.name + ' — ' + modeLabel;
  document.getElementById('mainChartStatus').innerHTML = `<span class="status-badge ${r.status}"><span class="dot"></span>${statusLabel(r.status)}</span>`;

  mainChart.options.scales.x.min = sDate();
  mainChart.options.scales.x.max = eDate();
  mainChart.options.scales.y.max = TOTAL_PAGES;

  mainChart.data.datasets[0].data = getPlannedSeries(r);
  mainChart.data.datasets[1].data = getActualSeries(r.records);
  const isCurrentPhase = projectionMode === 'currentPhase';
  const projRate = isCurrentPhase ? getLatestWeeklyDailyRate(currentChartProc) : r.dailyRate;
  mainChart.data.datasets[2].data = getProjectedSeries(r.records, r.completed, projRate);
  mainChart.data.datasets[2].hidden = isCurrentPhase;
  mainChart.data.datasets[2].borderColor = color;
  mainChart.data.datasets[2].pointBackgroundColor = color;

  // Compute projection series for all 4 processes based on weekly entries
  PROCESSES.forEach((p, i) => {
    const proj = computeProcessProjection(p.id, projectionMode);
    const dsIdx = 3 + i;
    const projColor = proj.status === 'done' || proj.status === 'green' ? '#10b981'
                    : proj.status === 'amber' ? '#f59e0b'
                    : '#ef4444';
    mainChart.data.datasets[dsIdx].borderColor = projColor;
    mainChart.data.datasets[dsIdx].pointBackgroundColor = projColor;
    if (proj.avgWeekly > 0 && proj.remaining > 0 && proj.projectedDate) {
      mainChart.data.datasets[dsIdx].data = [
        { x: today, y: proj.completed },
        { x: proj.projectedDate, y: TOTAL_PAGES }
      ];
      mainChart.data.datasets[dsIdx].hidden = (p.id !== currentChartProc);
      mainChart.data.datasets[dsIdx].label = p.name + ' proj.';
    } else {
      mainChart.data.datasets[dsIdx].data = [];
      mainChart.data.datasets[dsIdx].hidden = true;
    }
  });

  mainChart.update();

  updateSelectedMetrics(currentChartProc);
}

/* ============================
   ON-CHANGE HANDLER
============================ */
function onProcessChange(id) {
  updateProcessDisplay(id);

  updateTabDots();
  if (id === currentChartProc) updateMainChart();
}

/* ============================
   HEADER + EVENTS + INIT
============================ */
/* ============================
   CALCULATORS
============================ */
const DAYS_PER_MONTH = 17;

function getLatestTrackedDate() {
  const entries = loadWeeklyEntries();
  let latest = null;
  if (Array.isArray(entries)) {
    for (const e of entries) {
      if (e && e.date && (!latest || e.date > latest)) latest = e.date;
    }
  }
  PROCESSES.forEach(p => {
    const data = loadData(p.id);
    if (data && Array.isArray(data.records)) {
      for (const r of data.records) {
        if (r && r.date && (!latest || r.date > latest)) latest = r.date;
      }
    }
  });
  return latest;
}

function updateCalc1PresetButtons(selectedDate) {
  const latest = getLatestTrackedDate();
  const todayISO = toISODate(today);
  const btnLatest = document.getElementById('calc1-preset-latest');
  const btnToday = document.getElementById('calc1-preset-today');

  if (btnLatest) {
    const isLatest = Boolean(latest && selectedDate === latest);
    btnLatest.classList.toggle('active', isLatest);
    if (btnToday) {
      btnToday.classList.toggle('active', selectedDate === todayISO && !isLatest);
    }
  } else if (btnToday) {
    btnToday.classList.toggle('active', selectedDate === todayISO);
  }
}

function initCalc1Date(forceDefault = false) {
  const startEl = document.getElementById('calc1-start-date');
  if (!startEl) return;
  const latest = getLatestTrackedDate();
  const defaultDate = latest || toISODate(today);
  if (forceDefault || !startEl.value) {
    startEl.value = defaultDate;
  }
  updateCalc1PresetButtons(startEl.value);
}

function calc1Update() {
  const outputEl = document.getElementById('calc1-daily-output');
  const output = Math.max(0, Number(outputEl ? outputEl.value : 0) || 0);
  const target = Math.max(0, Number(document.getElementById('calc1-target').value) || 0);
  const startEl = document.getElementById('calc1-start-date');

  const activeBtn = document.querySelector('[data-role="calc1-toggle"] button.active');
  const unit = activeBtn ? activeBtn.dataset.unit : 'day';

  const daysEl = document.getElementById('calc1-days');
  const weeksEl = document.getElementById('calc1-weeks');
  const monthsEl = document.getElementById('calc1-months');
  const dateEl = document.getElementById('calc1-date');
  const summaryEl = document.getElementById('calc1-summary');
  const hintEl = document.getElementById('calc1-date-hint');

  // Daily rate: 4 working days per week
  const daily = unit === 'week' ? (output / WD_PER_WEEK) : output;

  const startStr = (startEl && startEl.value) ? startEl.value : (getLatestTrackedDate() || toISODate(today));
  const startDate = new Date(startStr + 'T00:00:00');

  if (hintEl) {
    if (!isWeekday(startDate)) {
      hintEl.style.display = 'block';
      hintEl.textContent = `${fmt(startDate)} is a non-working day (working days: Mon–Thu). Work starts on the next working day.`;
    } else {
      hintEl.style.display = 'none';
      hintEl.textContent = '';
    }
  }

  if (daily > 0 && target > 0) {
    const days = Math.ceil(target / daily);
    const weeks = days / WD_PER_WEEK;
    const months = days / DAYS_PER_MONTH;
    const finish = addWorkingDays(startDate, days);

    if (daysEl) daysEl.textContent = num(days);
    if (weeksEl) weeksEl.textContent = weeks.toFixed(1);
    if (monthsEl) monthsEl.textContent = months.toFixed(1);
    if (dateEl) dateEl.textContent = fmt(finish);

    if (unit === 'week') {
      summaryEl.textContent = `At ${num(output)} pages/week (~${num(Math.round(daily))} pages/day across ${WD_PER_WEEK} working days/wk), you need ${num(days)} working days (~${weeks.toFixed(1)} weeks / ~${months.toFixed(1)} months) starting ${fmt(startDate)}, finishing by ${fmt(finish)}.`;
    } else {
      const weeklyEquivalent = Math.round(output * WD_PER_WEEK);
      summaryEl.textContent = `At ${num(output)} pages/day (~${num(weeklyEquivalent)} pages/week across ${WD_PER_WEEK} working days/wk), you need ${num(days)} working days (~${weeks.toFixed(1)} weeks / ~${months.toFixed(1)} months) starting ${fmt(startDate)}, finishing by ${fmt(finish)}.`;
    }
  } else {
    if (daysEl) daysEl.textContent = '—';
    if (weeksEl) weeksEl.textContent = '—';
    if (monthsEl) monthsEl.textContent = '—';
    if (dateEl) dateEl.textContent = '—';
    if (summaryEl) summaryEl.textContent = '';
  }
}

function calc2Update() {
  const perPerson = Math.max(0, Number(document.getElementById('calc2-per-person').value) || 0);
  const target = Math.max(0, Number(document.getElementById('calc2-target').value) || 0);

  const peopleEl = document.getElementById('calc2-people');
  const crossEl = document.getElementById('calc2-crosscheck');
  const summaryEl = document.getElementById('calc2-summary');

  const activeBtn = document.querySelector('[data-role="calc2-toggle"] button.active');
  const unit = activeBtn ? activeBtn.dataset.unit : 'days';

  const startEl = document.getElementById('calc2-start');
  const endEl = document.getElementById('calc2-end');
  const hintEl = document.getElementById('calc2-date-hint');
  const errorEl = document.getElementById('calc2-date-error');
  let daysInput = 0;
  let labelText = unit;

  if (unit === 'date') {
    hintEl.style.display = 'none';
    errorEl.style.display = 'none';
    const startStr = startEl.value || toISODate(today);
    const endStr = endEl.value || '';
    if (endStr) {
      const startDate = new Date(startStr + 'T00:00:00');
      const endDate = new Date(endStr + 'T00:00:00');
      if (endDate < startDate) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'End date is before the start date.';
      } else {
        daysInput = workingDaysBetween(startDate, endDate);
        hintEl.style.display = 'block';
        hintEl.textContent = `${fmt(startDate)} → ${fmt(endDate)} is ${daysInput} working days (Mon–Thu, ${WD_PER_WEEK} days/week).`;
      }
    }
  } else {
    daysInput = Math.max(0, Number(document.getElementById('calc2-days').value) || 0);
    if (unit === 'months') labelText = 'months';
  }

  if (perPerson > 0 && target > 0 && daysInput > 0) {
    let totalDays = unit === 'months' ? daysInput * DAYS_PER_MONTH : daysInput;
    const people = Math.ceil(target / (perPerson * totalDays));
    const crossDays = Math.ceil(target / (people * perPerson));
    const crossMonths = crossDays / DAYS_PER_MONTH;

    peopleEl.textContent = num(people);
    crossEl.textContent = `${num(crossDays)} days (~${crossMonths.toFixed(1)} months)`;
    summaryEl.textContent = `You need ${num(people)} people at ${num(perPerson)} pages/day each to finish ${num(target)} pages in ${daysInput} ${labelText === 'months' ? 'months' : 'working days'}. With ${num(people)} people, it will take ~${crossDays} working days.`;
  } else {
    peopleEl.textContent = '—';
    crossEl.textContent = '—';
    summaryEl.textContent = '';
  }
}

// Bind calculator inputs
const calc1OutputEl = document.getElementById('calc1-daily-output');
if (calc1OutputEl) calc1OutputEl.addEventListener('input', calc1Update);

const calc1TargetEl = document.getElementById('calc1-target');
if (calc1TargetEl) calc1TargetEl.addEventListener('input', calc1Update);

const calc1StartDateEl = document.getElementById('calc1-start-date');
if (calc1StartDateEl) {
  calc1StartDateEl.addEventListener('input', () => {
    updateCalc1PresetButtons(calc1StartDateEl.value);
    calc1Update();
  });
  calc1StartDateEl.addEventListener('change', () => {
    updateCalc1PresetButtons(calc1StartDateEl.value);
    calc1Update();
  });
}

document.querySelectorAll('[data-role="calc1-toggle"] button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-role="calc1-toggle"] button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const unit = btn.dataset.unit;
    const labelEl = document.getElementById('calc1-output-label');
    const inputEl = document.getElementById('calc1-daily-output');
    if (unit === 'week') {
      if (labelEl) labelEl.textContent = 'Team Output per Week (pages)';
      if (inputEl) inputEl.placeholder = 'e.g. 20000';
    } else {
      if (labelEl) labelEl.textContent = 'Team Output per Day (pages)';
      if (inputEl) inputEl.placeholder = 'e.g. 5000';
    }
    calc1Update();
  });
});

const calc1PresetLatestBtn = document.getElementById('calc1-preset-latest');
if (calc1PresetLatestBtn) {
  calc1PresetLatestBtn.addEventListener('click', () => {
    const latest = getLatestTrackedDate();
    const dateVal = latest || toISODate(today);
    const startEl = document.getElementById('calc1-start-date');
    if (startEl) {
      startEl.value = dateVal;
      updateCalc1PresetButtons(dateVal);
      calc1Update();
    }
  });
}

const calc1PresetTodayBtn = document.getElementById('calc1-preset-today');
if (calc1PresetTodayBtn) {
  calc1PresetTodayBtn.addEventListener('click', () => {
    const dateVal = toISODate(today);
    const startEl = document.getElementById('calc1-start-date');
    if (startEl) {
      startEl.value = dateVal;
      updateCalc1PresetButtons(dateVal);
      calc1Update();
    }
  });
}
document.getElementById('calc2-per-person').addEventListener('input', calc2Update);
document.getElementById('calc2-target').addEventListener('input', calc2Update);
document.getElementById('calc2-days').addEventListener('input', calc2Update);
document.getElementById('calc2-start').addEventListener('input', (ev) => {
  const endEl = document.getElementById('calc2-end');
  if (endEl) endEl.min = ev.target.value || '';
  calc2Update();
});
document.getElementById('calc2-end').addEventListener('input', calc2Update);

function calc2SetUnit(unit) {
  const numEl = document.getElementById('calc2-days');
  const dateFields = document.getElementById('calc2-date-fields');
  const startEl = document.getElementById('calc2-start');
  const endEl = document.getElementById('calc2-end');
  const hintEl = document.getElementById('calc2-date-hint');
  const errorEl = document.getElementById('calc2-date-error');
  if (unit === 'date') {
    if (dateFields) dateFields.style.display = '';
    if (numEl) numEl.style.display = 'none';
    if (startEl) {
      if (!startEl.value) startEl.value = toISODate(today);
    }
    if (endEl) {
      endEl.min = startEl ? startEl.value : toISODate(today);
    }
  } else {
    if (dateFields) dateFields.style.display = 'none';
    if (hintEl) hintEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (numEl) numEl.style.display = '';
  }
}

// Calculator 2 toggle
document.querySelectorAll('[data-role="calc2-toggle"] button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-role="calc2-toggle"] button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calc2SetUnit(btn.dataset.unit);
    calc2Update();
  });
});

/* ============================
   WEEKLY TRACKING
============================ */
let bulkWeekDate = new Date();
bulkWeekDate.setHours(0,0,0,0);

function initBulkWeekDate() {
  // Default to the most recent Thursday (or today if it's Mon-Thu)
  const d = new Date(today);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() + 4);
  else if (day === 5) d.setDate(d.getDate() + 3);
  else if (day === 6) d.setDate(d.getDate() + 2);
  else if (day === 1) d.setDate(d.getDate() - 3); // Monday -> previous Thu
  else if (day >= 2 && day <= 4) d.setDate(d.getDate() - (day - 4)); // Tue-Thu -> same week Thu
  bulkWeekDate = d;
  document.getElementById('bulk-week-date').value = toISODate(d);
}

function getBulkEntriesForDate(dateStr) {
  const entries = loadWeeklyEntries();
  return entries.find(e => e.date === dateStr);
}

function addBulkEntry() {
  const dateStr = document.getElementById('bulk-week-date').value;
  if (!dateStr) return;

  const groom = Math.max(0, Number(document.getElementById('bulk-groom').value) || 0);
  const scan = Math.max(0, Number(document.getElementById('bulk-scan').value) || 0);
  const valid = Math.max(0, Number(document.getElementById('bulk-valid').value) || 0);
  const audit = Math.max(0, Number(document.getElementById('bulk-audit').value) || 0);
  const boxes = Math.max(0, Number(document.getElementById('bulk-boxes').value) || 0);
  const paperType = document.getElementById('bulk-paper-type').value.trim();
  const teamGroom = Math.max(0, Number(document.getElementById('bulk-team-groom').value) || 0);
  const teamScan = Math.max(0, Number(document.getElementById('bulk-team-scan').value) || 0);
  const teamValid = Math.max(0, Number(document.getElementById('bulk-team-valid').value) || 0);
  const teamAudit = Math.max(0, Number(document.getElementById('bulk-team-audit').value) || 0);

  if (groom === 0 && scan === 0 && valid === 0 && audit === 0) return;

  const entries = loadWeeklyEntries();
  const existing = entries.findIndex(e => e.date === dateStr);

  const entry = {
    date: dateStr,
    groom, scan, valid, audit,
    total: groom + scan + valid + audit,
    boxes, paperType,
    teamGroom, teamScan, teamValid, teamAudit,
    createdAt: existing >= 0 ? entries[existing].createdAt : new Date().toISOString()
  };

  if (existing >= 0) {
    entries[existing] = entry;
  } else {
    entries.push(entry);
  }
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveWeeklyEntries(entries);

  // Enrich individual process records
  if (groom > 0) enrichProcessRecord('groom', dateStr, groom);
  if (scan > 0) enrichProcessRecord('scan', dateStr, scan);
  if (valid > 0) enrichProcessRecord('valid', dateStr, valid);
  if (audit > 0) enrichProcessRecord('audit', dateStr, audit);

  // Save paper type to history
  if (paperType) {
    const types = loadPaperTypes();
    if (!types.includes(paperType)) {
      types.push(paperType);
      savePaperTypes(types);
    }
  }

  // Clear form
  document.getElementById('bulk-groom').value = '';
  document.getElementById('bulk-scan').value = '';
  document.getElementById('bulk-valid').value = '';
  document.getElementById('bulk-audit').value = '';
  document.getElementById('bulk-boxes').value = '';
  document.getElementById('bulk-paper-type').value = '';
  document.getElementById('bulk-team-groom').value = '';
  document.getElementById('bulk-team-scan').value = '';
  document.getElementById('bulk-team-valid').value = '';
  document.getElementById('bulk-team-audit').value = '';

  renderMasterTable();
  renderProjections();
  PROCESSES.forEach(p => { renderRecordsList(p.id); updateProcessDisplay(p.id); });

  updateTabDots();
  if (mainChart) updateMainChart();
  const latestBtn = document.getElementById('calc1-preset-latest');
  if (latestBtn && latestBtn.classList.contains('active')) {
    initCalc1Date(true);
    calc1Update();
  }
}

function enrichProcessRecord(procId, dateStr, pages) {
  const data = loadData(procId);
  if (!data.records) data.records = [];
  const existing = data.records.find(r => r.date === dateStr);
  if (existing) {
    existing.pages = pages;
  } else {
    data.records.push({ date: dateStr, pages });
  }
  saveData(procId, data);
}

function deleteBulkEntry(dateStr) {
  const entries = loadWeeklyEntries();
  const idx = entries.findIndex(e => e.date === dateStr);
  if (idx < 0) return;

  const entry = entries[idx];
  entries.splice(idx, 1);
  saveWeeklyEntries(entries);

  // Remove from individual process records
  ['groom', 'scan', 'valid', 'audit'].forEach(pid => {
    const data = loadData(pid);
    if (data.records) {
      data.records = data.records.filter(r => r.date !== dateStr);
      saveData(pid, data);
    }
  });

  renderMasterTable();
  renderProjections();
  PROCESSES.forEach(p => { renderRecordsList(p.id); updateProcessDisplay(p.id); });

  updateTabDots();
  if (mainChart) updateMainChart();
  const latestBtn = document.getElementById('calc1-preset-latest');
  if (latestBtn && latestBtn.classList.contains('active')) {
    initCalc1Date(true);
    calc1Update();
  }
}

/* ============================
   PROJECTIONS GRID
============================ */
function computeProcessProjection(procId, mode) {
  const entries = loadWeeklyEntries();
  const proc = PROCESSES.find(p => p.id === procId);
  const data = loadData(procId);
  const completed = getCompleted(data);
  const remaining = Math.max(0, TOTAL_PAGES - completed);

  const fieldMap = { groom: 'groom', scan: 'scan', valid: 'valid', audit: 'audit' };
  const field = fieldMap[procId];

  let avgWeekly = 0;
  if (mode === 'currentPhase') {
    const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    avgWeekly = latestEntry ? (Number(latestEntry[field]) || 0) : 0;
  } else {
    const weeklyOutputs = entries
      .map(e => Number(e[field]) || 0)
      .filter(v => v > 0);
    if (weeklyOutputs.length > 0) {
      avgWeekly = weeklyOutputs.reduce((s, v) => s + v, 0) / weeklyOutputs.length;
    }
  }

  const now = new Date();
  now.setHours(0,0,0,0);

  let projectedDate = null;
  let weeksNeeded = 0;
  let daysNeeded = 0;
  let monthsNeeded = 0;
  if (avgWeekly > 0 && remaining > 0) {
    weeksNeeded = remaining / avgWeekly;
    daysNeeded = Math.ceil(weeksNeeded * 7);
    monthsNeeded = weeksNeeded / (WD_PER_MONTH / WD_PER_WEEK);
    projectedDate = new Date(now);
    projectedDate.setDate(projectedDate.getDate() + daysNeeded);
  }

  const hasEntries = entries.some(e => (Number(e[field]) || 0) > 0);
  let status = 'green';
  if (remaining <= 0) {
    status = 'done';
  } else if (projectedDate) {
    if (projectedDate <= eDate()) status = 'green';
    else if (projectedDate <= addCalendarDays(eDate(), 14)) status = 'amber';
    else status = 'red';
  } else {
    status = hasEntries ? 'red' : 'amber';
  }

  const teamFieldMap = { groom: 'teamGroom', scan: 'teamScan', valid: 'teamValid', audit: 'teamAudit' };
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const teamSize = latestEntry ? (latestEntry[teamFieldMap[procId]] || 0) : 0;

  return {
    procId,
    name: proc.name,
    completed,
    remaining,
    avgWeekly: Math.round(avgWeekly),
    weeksNeeded: weeksNeeded.toFixed(1),
    monthsNeeded: monthsNeeded.toFixed(1),
    daysNeeded,
    projectedDate,
    status,
    teamSize,
    entriesCount: entries.length,
    isCurrentPhase: mode === 'currentPhase'
  };
}

function renderProjections() {
  const grid = document.getElementById('projections-grid');
  const procs = PROCESSES.map(p => computeProcessProjection(p.id, projectionMode));

  grid.innerHTML = procs.map(p => {
    const pct = p.completed / TOTAL_PAGES * 100;
    const dateStr = p.projectedDate ? fmt(p.projectedDate) : '—';
    const weeklyLabel = p.isCurrentPhase ? 'Current Weekly' : 'Avg Weekly';

    return `
      <div class="proj-card status-${p.status}">
        <div class="proj-head">
          <div class="proj-name">${p.name}</div>
          <span class="proj-badge ${p.status}">${p.status === 'done' ? 'Done' : statusLabel(p.status)}</span>
        </div>
        <div class="proj-body">
          <div class="proj-row">
            <span class="lbl">Remaining</span>
            <span class="val">${num(p.remaining)} pages</span>
          </div>
          <div class="proj-row">
            <span class="lbl">${weeklyLabel}</span>
            <span class="val">${num(p.avgWeekly)} pages/wk</span>
          </div>
          <div class="proj-row">
            <span class="lbl">Weeks Needed</span>
            <span class="val">${p.remaining > 0 ? p.weeksNeeded : '—'}</span>
          </div>
          <div class="proj-row">
            <span class="lbl">Months Needed</span>
            <span class="val">${p.remaining > 0 ? p.monthsNeeded : '—'}</span>
          </div>
          <div class="proj-row">
            <span class="lbl">Projected Finish</span>
            <span class="val ${p.status}">${dateStr}</span>
          </div>
          ${p.teamSize > 0 ? `<div class="proj-row"><span class="lbl">Team Size</span><span class="val">${p.teamSize} people</span></div>` : ''}
          <div class="proj-progress">
            <div class="proj-progress-fill ${p.status}" style="width:${Math.min(100, pct).toFixed(1)}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================
   MASTER TABLE
============================ */
let expandedRows = new Set();

function renderMasterTable() {
  const entries = loadWeeklyEntries();
  const tbody = document.getElementById('master-tbody');
  const empty = document.getElementById('master-empty');

  if (entries.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map((e, idx) => {
    const isExpanded = expandedRows.has(e.date);
    const teams = [e.teamGroom, e.teamScan, e.teamValid, e.teamAudit].filter(v => v > 0);
    const teamsStr = teams.length > 0 ? teams.join('/') : '—';
    return `
      <tr class="${isExpanded ? 'detail-open' : ''}" data-date="${e.date}" data-toggle-row>
        <td><span class="expand-icon">&#9654;</span></td>
        <td><strong>${fmt(new Date(e.date))}</strong></td>
        <td class="num">${num(e.groom)}</td>
        <td class="num">${num(e.scan)}</td>
        <td class="num">${num(e.valid)}</td>
        <td class="num">${num(e.audit)}</td>
        <td class="num"><strong>${num(e.total)}</strong></td>
        <td>${e.paperType || '—'}</td>
        <td class="num" style="font-size:11px">${teamsStr}</td>
        <td><div class="row-actions"><button class="edit-week-btn" data-date="${e.date}" title="Edit week">&#9998;</button><button class="del-week-btn" data-date="${e.date}" title="Delete week">&#10005;</button></div></td>
      </tr>
      ${isExpanded ? `
      <tr class="detail-row" data-date="${e.date}">
        <td colspan="10">
          <div class="detail-grid">
            <div class="detail-item">
              <div class="d-label">Grooming (${e.teamGroom || 0} ppl)</div>
              <div class="d-value">${num(e.groom)}</div>
            </div>
            <div class="detail-item">
              <div class="d-label">Scanning (${e.teamScan || 0} ppl)</div>
              <div class="d-value">${num(e.scan)}</div>
            </div>
            <div class="detail-item">
              <div class="d-label">Validation (${e.teamValid || 0} ppl)</div>
              <div class="d-value">${num(e.valid)}</div>
            </div>
            <div class="detail-item">
              <div class="d-label">Audit (${e.teamAudit || 0} ppl)</div>
              <div class="d-value">${num(e.audit)}</div>
            </div>
          </div>
          <div style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-soft)">
            <span>Boxes: <strong>${num(e.boxes)}</strong></span>
            <span>Paper: <strong>${e.paperType || '—'}</strong></span>
            <span>Total: <strong>${num(e.total)} pages</strong></span>
          </div>
        </td>
      </tr>` : ''}
    `;
  }).join('');

  // Bind toggle
  tbody.querySelectorAll('[data-toggle-row]').forEach(row => {
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('.del-week-btn') || ev.target.closest('.edit-week-btn')) return;
      const date = row.dataset.date;
      if (expandedRows.has(date)) expandedRows.delete(date);
      else expandedRows.add(date);
      renderMasterTable();
    });
  });

  // Bind delete
  tbody.querySelectorAll('.del-week-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this weekly entry?')) deleteBulkEntry(btn.dataset.date);
    });
  });

  // Bind edit
  tbody.querySelectorAll('.edit-week-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const date = btn.dataset.date;
      const entries = loadWeeklyEntries();
      const entry = entries.find(e => e.date === date);
      if (!entry) return;
      // Populate the bulk form with this entry's data
      document.getElementById('bulk-week-date').value = entry.date;
      document.getElementById('bulk-groom').value = entry.groom || '';
      document.getElementById('bulk-scan').value = entry.scan || '';
      document.getElementById('bulk-valid').value = entry.valid || '';
      document.getElementById('bulk-audit').value = entry.audit || '';
      document.getElementById('bulk-boxes').value = entry.boxes || '';
      document.getElementById('bulk-paper-type').value = entry.paperType || '';
      document.getElementById('bulk-team-groom').value = entry.teamGroom || '';
      document.getElementById('bulk-team-scan').value = entry.teamScan || '';
      document.getElementById('bulk-team-valid').value = entry.teamValid || '';
      document.getElementById('bulk-team-audit').value = entry.teamAudit || '';
      bulkWeekDate = new Date(entry.date + 'T00:00:00');
      // Scroll to form
      document.querySelector('.bulk-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

/* ============================
   PAPER TYPE AUTOCOMPLETE
============================ */
function initPaperAutocomplete() {
  const input = document.getElementById('bulk-paper-type');
  const list = document.getElementById('paper-ac-list');
  let activeIdx = -1;

  function showSuggestions() {
    const val = input.value.trim().toLowerCase();
    const types = loadPaperTypes();
    const filtered = val ? types.filter(t => t.toLowerCase().includes(val)) : types;

    if (filtered.length === 0) { list.classList.remove('show'); return; }

    list.innerHTML = filtered.map((t, i) =>
      `<div class="ac-item" data-value="${t}">${t}</div>`
    ).join('');
    list.classList.add('show');
    activeIdx = -1;

    list.querySelectorAll('.ac-item').forEach(item => {
      item.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        input.value = item.dataset.value;
        list.classList.remove('show');
      });
    });
  }

  input.addEventListener('input', showSuggestions);
  input.addEventListener('focus', showSuggestions);
  input.addEventListener('blur', () => setTimeout(() => list.classList.remove('show'), 150));
  input.addEventListener('keydown', (ev) => {
    const items = list.querySelectorAll('.ac-item');
    if (!items.length) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); activeIdx = Math.min(items.length - 1, activeIdx + 1); items.forEach((it, i) => it.classList.toggle('active', i === activeIdx)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); items.forEach((it, i) => it.classList.toggle('active', i === activeIdx)); }
    else if (ev.key === 'Enter' && activeIdx >= 0) { ev.preventDefault(); input.value = items[activeIdx].dataset.value; list.classList.remove('show'); }
  });
}

/* ============================
   PREV / NEXT WEEK NAVIGATION
============================ */
document.getElementById('prev-week-btn').addEventListener('click', () => {
  bulkWeekDate.setDate(bulkWeekDate.getDate() - 7);
  document.getElementById('bulk-week-date').value = toISODate(bulkWeekDate);
});
document.getElementById('next-week-btn').addEventListener('click', () => {
  bulkWeekDate.setDate(bulkWeekDate.getDate() + 7);
  document.getElementById('bulk-week-date').value = toISODate(bulkWeekDate);
});
document.getElementById('bulk-week-date').addEventListener('change', (ev) => {
  bulkWeekDate = new Date(ev.target.value + 'T00:00:00');
});

// Bind bulk add button
document.getElementById('bulk-add-btn').addEventListener('click', addBulkEntry);

// Bind Enter key in bulk form inputs
document.querySelectorAll('.bulk-grid input').forEach(inp => {
  inp.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); addBulkEntry(); }
  });
});

/* ============================
   SHARED DATABASE SYNC
   Streams the shared Firestore copy and pushes local edits.
   Data tools (export / import / reset) remain available on TPStore for
   recovery from the console, e.g. TPStore.exportPayload().
============================ */
/* No on-page badge any more, so surface sync problems in the console only. */
const SYNC_WARNINGS = {
  rules: 'Firestore security rules are blocking this browser — publish firestore.rules (allow read, write: if true), then reload.',
  config: 'The Firebase SDK or firebase-config.js did not load.',
  network: 'Could not reach Firestore. Data is safe locally and will sync when the connection returns.'
};

let lastWarnedReason = null;
TPStore.onStatus(state => {
  const advice = SYNC_WARNINGS[state.reason];
  if (!advice || state.reason === lastWarnedReason) return;
  lastWarnedReason = state.reason;
  console.warn('[trueput] ' + advice + (state.lastError ? '\n  Last error: ' + state.lastError : ''));
});

// A teammate saved from another machine/brower — refresh every view.
TPStore.onChange(origin => {
  if (origin !== 'remote') return;
  buildProcessCards();
  fullRerender();
});

/*
 * Connect and stream. There is deliberately NO "push whatever is in memory" on
 * load: a snapshot can arrive before the process documents do, and pushing at
 * that moment would overwrite good records with empty placeholders. Writes are
 * only ever triggered by an explicit edit (TPStore.setProcess/setWeekly/...).
 */
TPStore.pull();

/* ============================
   UI: THEME + NAVIGATION
============================ */
function updateChartColorsForTheme(theme) {
  if (!mainChart || !mainChart.options) return;
  const isDark = theme === 'dark';
  if (mainChart.options.scales && mainChart.options.scales.x) {
    mainChart.options.scales.x.grid.color = isDark ? 'rgba(234, 234, 237, 0.08)' : 'rgba(108, 92, 200, 0.07)';
    mainChart.options.scales.x.border.color = isDark ? 'rgba(234, 234, 237, 0.16)' : 'rgba(108, 92, 200, 0.2)';
    mainChart.options.scales.x.ticks.color = isDark ? '#9593A5' : '#6B6A78';
  }
  if (mainChart.options.scales && mainChart.options.scales.y) {
    mainChart.options.scales.y.grid.color = isDark ? 'rgba(234, 234, 237, 0.08)' : 'rgba(108, 92, 200, 0.07)';
    mainChart.options.scales.y.border.color = isDark ? 'rgba(234, 234, 237, 0.16)' : 'rgba(108, 92, 200, 0.2)';
    mainChart.options.scales.y.ticks.color = isDark ? '#9593A5' : '#6B6A78';
  }
  if (mainChart.options.plugins && mainChart.options.plugins.tooltip) {
    mainChart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(22, 21, 34, 0.96)' : 'rgba(255, 255, 255, 0.96)';
    mainChart.options.plugins.tooltip.titleColor = isDark ? '#F5F4FA' : '#1F1D2B';
    mainChart.options.plugins.tooltip.bodyColor = isDark ? '#C8C5D8' : '#6B6A78';
    mainChart.options.plugins.tooltip.borderColor = isDark ? 'rgba(234, 234, 237, 0.16)' : '#EAEAED';
  }
  mainChart.update('none');
}

function initTheme() {
  const saved = localStorage.getItem('lumeed-portal-theme') || localStorage.getItem('tp_theme');
  const dark = saved ? saved === 'dark' : true;
  const theme = dark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('lumeed-portal-theme', theme);
  localStorage.setItem('tp_theme', theme);
}
initTheme();

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('lumeed-portal-theme', nextTheme);
    localStorage.setItem('tp_theme', nextTheme);
    updateChartColorsForTheme(nextTheme);
  });
}

const navLinks = Array.prototype.slice.call(document.querySelectorAll('.topnav-link[data-goto]'));
const navSections = navLinks.map(l => document.getElementById(l.dataset.goto)).filter(Boolean);

navLinks.forEach(link => {
  link.addEventListener('click', (ev) => {
    ev.preventDefault();
    const target = document.getElementById(link.dataset.goto);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navLinks.forEach(l => l.classList.toggle('active', l === link));
    }
  });
});

function updateActiveNav() {
  const probe = window.scrollY + 120;
  let current = navLinks.length ? navLinks[0].dataset.goto : null;
  navSections.forEach(sec => { if (sec.offsetTop <= probe) current = sec.id; });
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.goto === current));
}
updateActiveNav();

window.addEventListener('scroll', () => {
  const topBtn = document.getElementById('scroll-top');
  if (topBtn) topBtn.classList.toggle('show', window.scrollY > 420);
  updateActiveNav();
}, { passive: true });

const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

buildProcessCards();
PROCESSES.forEach(p => { renderRecordsList(p.id); updateProcessDisplay(p.id); });
updateTabDots();
createMainChart();
initBulkWeekDate();
renderMasterTable();
renderProjections();
initPaperAutocomplete();
updateZoomLabelFromChart();
initCalc1Date(true);
calc1Update();

// Projection mode toggle
document.querySelectorAll('#projectionToggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#projectionToggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    projectionMode = btn.dataset.mode;
    updateMainChart();
    renderProjections();
  });
});

