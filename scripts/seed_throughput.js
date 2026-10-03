#!/usr/bin/env node
/**
 * Lumeed Trueput — migrate a dashboard backup into Cloud Firestore.
 *
 * Reads a throughput backup and writes it into the shared Firestore dataset
 * using the same document layout the browser client uses, so both stay in sync.
 *
 * Produce a backup from the dashboard console with TPStore.exportPayload().
 *
 * Because the dataset rules deny anonymous access by default, the Admin SDK is
 * the reliable path for a one-off migration: a service account private key
 * BYPASSES security rules entirely.
 *
 * Two authentication modes:
 *   Client SDK (default) — public web config, no secret, but requires published
 *                          rules that permit writes.
 *   Admin SDK (--admin)  — service account key, ignores rules entirely.
 *
 * Usage:
 *   npm install firebase firebase-admin
 *   node scripts/seed_throughput.js <backup.json>                          # dry run
 *   node scripts/seed_throughput.js <backup.json> --commit --admin          # admin
 *
 * Options:
 *   --commit        Perform the write (omitted = dry run, nothing is modified)
 *   --reset         Delete existing throughput documents before writing
 *   --admin [file]  Service account key. Falls back to $FIREBASE_SERVICE_ACCOUNT
 *                   then scripts/serviceAccountKey.json when present.
 */

const fs = require('fs');
const path = require('path');

/*
 * Firestore requires collection paths to have an ODD number of segments, so
 * these are root-level collections (1 segment) holding documents (2 segments).
 * A layout like `throughput/processes/groom` is invalid and would throw.
 */
const COL_PROCESSES = 'lumeed_processes';
const COL_WEEKS = 'lumeed_weeks';
const COL_META = 'lumeed_meta';
const DOC_META = 'state';
const BATCH_LIMIT = 400;

const args = process.argv.slice(2);

function flagValue(name) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const adminFlag = flagValue('--admin');
const backupPath = args.find((a, i) =>
  !a.startsWith('--') && a !== adminFlag && !(i > 0 && args[i - 1] === '--admin'));
const shouldCommit = args.includes('--commit');
const shouldReset = args.includes('--reset');

function fail(message) {
  console.error('\nERROR: ' + message + '\n');
  process.exit(1);
}

/**
 * Resolve the Admin SDK key path: explicit flag, then environment variable,
 * then the conventional local location. The conventional default may fall back
 * silently; an explicitly requested key that is missing is an error, because
 * silently downgrading to the client SDK would fail later on denied rules.
 */
function resolveAdminKeyPath() {
  const explicit = adminFlag || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (explicit) {
    if (!fs.existsSync(explicit)) {
      fail('Service account key not found: ' + explicit);
    }
    return explicit;
  }
  const conventional = path.join(__dirname, 'serviceAccountKey.json');
  return fs.existsSync(conventional) ? conventional : null;
}

if (!backupPath) {
  fail('Usage: node scripts/seed_throughput.js <backup.json> [--commit] [--reset] [--admin <key.json>]');
}
if (!fs.existsSync(backupPath)) {
  fail('Backup file not found: ' + backupPath);
}

/* Load the web config from the dashboard so there is a single source of truth. */
function loadFirebaseConfig() {
  const configPath = path.join(__dirname, '..', 'trueput', 'firebase-config.js');
  if (!fs.existsSync(configPath)) fail('Missing ' + configPath);
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', fs.readFileSync(configPath, 'utf8'))(sandbox.window);
  const cfg = sandbox.window.LUMEED_FIREBASE;
  if (!cfg || !cfg.projectId) fail('Could not read LUMEED_FIREBASE from ' + configPath);
  return cfg;
}

/**
 * Build a Firestore handle plus a uniform path adapter.
 *
 * The two SDKs differ: Admin exposes db.collection()/db.doc() instance methods,
 * while the modular client SDK requires the collection()/doc() module functions
 * and has no such methods on the Firestore instance. Both accept a
 * slash-separated path, so the write logic below stays identical either way.
 */
function connect() {
  const adminKeyPath = resolveAdminKeyPath();

  if (adminKeyPath) {
    /* Use the documented subpath entry points: the bare "firebase-admin" entry
       in v14 is a slim build without firestore()/credential. */
    let adminAppModule;
    let adminFirestore;
    try {
      adminAppModule = require('firebase-admin/app');
      adminFirestore = require('firebase-admin/firestore');
    } catch (err) {
      fail('Missing dependency. Run: npm install firebase-admin');
    }
    try {
      const serviceAccount = require(path.resolve(adminKeyPath));
      const missing = ['project_id', 'client_email', 'private_key'].filter((k) => !serviceAccount || !serviceAccount[k]);
      if (missing.length) {
        fail('Not a valid service account key — missing field(s): ' + missing.join(', ') +
          '\n       Download a fresh key from Firebase console → Project settings → Service accounts.');
      }
      const adminApp = adminAppModule.initializeApp({ credential: adminAppModule.cert(serviceAccount) }, 'lumeed-migration');
      const db = adminFirestore.getFirestore(adminApp);
      return {
        db,
        col: (p) => db.collection(p),
        doc: (col, id) => db.collection(col).doc(id),
        getAll: (col) => db.collection(col).get(),
        batch: () => db.batch(),
        mode: 'admin',
        label: 'Admin SDK (' + path.basename(adminKeyPath) + ' — rules bypassed)',
        projectId: serviceAccount.project_id
      };
    } catch (err) {
      fail('Could not initialise Admin SDK with ' + adminKeyPath + ': ' + err.message);
    }
  }

  let firebase;
  try {
    firebase = require('firebase/app');
    require('firebase/firestore');
  } catch (err) {
    fail('Missing dependency. Run: npm install firebase');
  }
  const config = loadFirebaseConfig();
  const app = firebase.initializeApp(config);
  const fdb = require('firebase/firestore');
  const db = fdb.getFirestore(app);
  return {
    db,
    doc: (col, id) => fdb.doc(db, col, id),
    getAll: (col) => fdb.getDocs(fdb.collection(db, col)),
    batch: () => fdb.writeBatch(db),
    mode: 'client',
    label: 'Client SDK (web config — rules must permit writes)',
    projectId: config.projectId
  };
}

function normalizeProcess(data) {
  const d = data && typeof data === 'object' ? data : {};
  return {
    rate: typeof d.rate === 'number' ? d.rate : 0,
    unit: d.unit || 'daily',
    records: Array.isArray(d.records) ? d.records : []
  };
}

/* Accept both the current flat map and the legacy array-shaped export. */
function readBackup(raw) {
  const source = raw && raw.processes ? raw.processes : raw;
  const processes = {};

  if (Array.isArray(source)) {
    source.forEach((entry) => {
      if (entry && entry.id) processes[entry.id] = normalizeProcess(entry);
    });
  } else if (source && typeof source === 'object') {
    for (const id of Object.keys(source)) {
      if (id === 'project') continue;
      processes[id] = normalizeProcess(source[id]);
    }
  }

  const weeklyEntries = Array.isArray(raw && raw.weeklyEntries)
    ? raw.weeklyEntries.filter((e) => e && e.date)
    : [];
  const paperTypes = Array.isArray(raw && raw.paperTypes) ? raw.paperTypes : [];

  if (!Object.keys(processes).length) {
    fail('No process records found in the backup file.');
  }
  return { processes, weeklyEntries, paperTypes };
}

function summarize(backup) {
  const ids = Object.keys(backup.processes);
  let records = 0;
  ids.forEach((id) => { records += backup.processes[id].records.length; });
  console.log('  Source file     : ' + path.resolve(backupPath));
  console.log('  Processes       : ' + ids.length + ' (' + ids.join(', ') + ')');
  console.log('  Dated records   : ' + records);
  console.log('  Weekly rows     : ' + backup.weeklyEntries.length);
  console.log('  Paper types     : ' + backup.paperTypes.length);
}

/* Tolerate a UTF-8 BOM, which Windows tooling often adds to JSON files. */
function readJsonFile(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  try {
    return JSON.parse(text);
  } catch (err) {
    fail('Could not parse ' + file + ' as JSON: ' + err.message);
  }
  return null;
}

const backup = readBackup(readJsonFile(backupPath));

console.log('\n============================================================');
console.log(' Lumeed Trueput — Firestore migration');
console.log('============================================================\n');
console.log('Backup contents:');
summarize(backup);

if (!shouldCommit) {
  const adminKeyPath = resolveAdminKeyPath();
  console.log('\n  MODE            : DRY RUN (nothing written)');
  console.log('  Auth            : ' + (adminKeyPath
    ? 'Admin SDK (' + path.basename(adminKeyPath) + ')'
    : 'Client SDK (web config)'));
  if (adminKeyPath) {
    console.log('                     rules will be bypassed');
  } else {
    console.log('                     requires published rules that permit writes');
  }
  console.log('  Target project  : ' + loadFirebaseConfig().projectId);
  console.log('  Documents to write:');
  console.log('    ' + COL_PROCESSES + '/<id>        x' + Object.keys(backup.processes).length);
  console.log('    ' + COL_WEEKS + '/<date>      x' + backup.weeklyEntries.length);
  console.log('    ' + COL_META + '/' + DOC_META + '          x1');
  console.log('\n  Re-run with --commit to perform the migration.\n');
  process.exit(0);
}

const conn = connect();
const api = conn;

async function clearExisting() {
  const processes = await api.getAll(COL_PROCESSES);
  const weeks = await api.getAll(COL_WEEKS);
  const total = processes.size + weeks.size;
  if (!total) return 0;
  for (let i = 0; i < processes.size; i += BATCH_LIMIT) {
    const batch = api.batch();
    processes.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  for (let i = 0; i < weeks.size; i += BATCH_LIMIT) {
    const batch = api.batch();
    weeks.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return total;
}

async function main() {
  console.log('  MODE            : COMMIT');
  console.log('  Auth            : ' + conn.label);
  console.log('  Target project  : ' + conn.projectId + '\n');

  if (shouldReset) {
    process.stdout.write('  Clearing existing dataset... ');
    const removed = await clearExisting();
    console.log(removed + ' document(s) removed');
  }

  const now = new Date().toISOString();
  const ops = [];

  Object.keys(backup.processes).forEach((id) => {
    ops.push(() => ({
      ref: api.doc(COL_PROCESSES, id),
      data: Object.assign({}, backup.processes[id], { updatedAt: now })
    }));
  });
  backup.weeklyEntries.forEach((entry) => {
    ops.push(() => ({
      ref: api.doc(COL_WEEKS, String(entry.date)),
      data: entry
    }));
  });
  ops.push(() => ({
    ref: api.doc(COL_META, DOC_META),
    data: { paperTypes: backup.paperTypes, updatedAt: now }
  }));

  let written = 0;
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = api.batch();
    ops.slice(i, i + BATCH_LIMIT).forEach((make) => {
      const op = make();
      batch.set(op.ref, op.data, { merge: true });
    });
    await batch.commit();
    written += Math.min(BATCH_LIMIT, ops.length - i);
    console.log('  committed batch: ' + written + '/' + ops.length);
  }

  const verifyProcesses = await api.getAll(COL_PROCESSES);
  const verifyWeeks = await api.getAll(COL_WEEKS);

  console.log('\n  Migration complete.');
  console.log('  Verified in Firestore: ' + verifyProcesses.size + ' process doc(s), ' +
    verifyWeeks.size + ' week doc(s).');
  console.log('\n  Open the dashboard — the header badge should read "Live · Cloud synced".\n');
  process.exit(0);
}

main().catch((err) => fail('Migration failed: ' + (err && err.message ? err.message : err)));
