/**
 * Lumeed Trueput — readiness probe for the shared throughput dataset.
 * Read-only: verifies the SDK is reachable, the database exists, rules allow
 * access, and reports current contents. Writes nothing.
 *
 * Because Firestore ships with deny-all rules, add --admin to bypass them:
 *
 *   node scripts/probe_throughput.js                 # client SDK (needs open rules)
 *   node scripts/probe_throughput.js --admin         # service account, rules bypassed
 *
 * Options:
 *   --admin [file]  Service account key. Falls back to $FIREBASE_SERVICE_ACCOUNT
 *                   then scripts/serviceAccountKey.json when present.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function flagValue(name) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] && !String(args[i + 1]).startsWith('--') ? args[i + 1] : null;
}

function loadFirebaseConfig() {
  const sandbox = { window: {} };
  new Function('window', fs.readFileSync(path.join(__dirname, '..', 'trueput', 'firebase-config.js'), 'utf8'))(sandbox.window);
  return sandbox.window.LUMEED_FIREBASE;
}

function resolveAdminKeyPath() {
  const explicit = flagValue('--admin') || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (explicit) {
    if (!fs.existsSync(explicit)) {
      console.error('\nERROR: Service account key not found: ' + explicit + '\n');
      process.exit(1);
    }
    return explicit;
  }
  const conventional = path.join(__dirname, 'serviceAccountKey.json');
  return fs.existsSync(conventional) ? conventional : null;
}

/*
 * Firestore requires collection paths to have an ODD number of segments, so
 * these are root-level collections (1 segment) holding documents (2 segments).
 */
const COL_PROCESSES = 'lumeed_processes';
const COL_WEEKS = 'lumeed_weeks';
const COL_META = 'lumeed_meta';
const DOC_META = 'state';

/*
 * Path adapter: Admin exposes db.collection() and instance methods, while the
 * modular client SDK has neither on the Firestore instance — reads/writes go
 * through module functions (getDoc/getDocs/writeBatch).
 */
function connect() {
  const adminKeyPath = resolveAdminKeyPath();
  if (adminKeyPath) {
    /* Use the documented subpath entry points: the bare "firebase-admin" entry
       in v14 is a slim build without firestore()/credential. */
    const { initializeApp, cert } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const serviceAccount = require(path.resolve(adminKeyPath));
    const missing = ['project_id', 'client_email', 'private_key']
      .filter((k) => !serviceAccount || !serviceAccount[k]);
    if (missing.length) {
      console.error('\nERROR: Not a valid service account key — missing: ' + missing.join(', ') + '\n');
      process.exit(1);
    }
    const app = initializeApp({ credential: cert(serviceAccount) }, 'lumeed-probe');
    const db = getFirestore(app);
    return {
      getDoc: async (col, id) => db.collection(col).doc(id).get(),
      getDocs: (col) => db.collection(col).get(),
      label: 'Admin SDK (' + path.basename(adminKeyPath) + ' — rules bypassed)',
      projectId: serviceAccount.project_id
    };
  }
  const config = loadFirebaseConfig();
  const { initializeApp } = require('firebase/app');
  const fdb = require('firebase/firestore');
  const db = fdb.getFirestore(initializeApp(config));
  return {
    getDoc: (col, id) => fdb.getDoc(fdb.doc(db, col, id)),
    getDocs: (col) => fdb.getDocs(fdb.collection(db, col)),
    label: 'Client SDK (web config — subject to rules)',
    projectId: config.projectId
  };
}

const api = connect();

(async () => {
  console.log('\n============================================================');
  console.log(' Lumeed Trueput — Firestore readiness probe (read-only)');
  console.log('============================================================');
console.log('  Project : ' + api.projectId);
  console.log('  Auth    : ' + api.label + '\n');

  try {
    const metaSnap = await api.getDoc(COL_META, DOC_META);
    console.log('  ' + COL_META + '/' + DOC_META + ' exists : ' + metaSnap.exists);
    if (metaSnap.exists) {
      const data = metaSnap.data() || {};
      console.log('  paperTypes                  : ' + JSON.stringify(data.paperTypes || []));
      console.log('  updatedAt                   : ' + (data.updatedAt || '—'));
    }

    const processes = await api.getDocs(COL_PROCESSES);
    const weeks = await api.getDocs(COL_WEEKS);

    console.log('  process documents           : ' + processes.size +
      (processes.size ? ' (' + processes.docs.map((d) => d.id).join(', ') + ')' : ''));
    console.log('  week documents              : ' + weeks.size);

    let records = 0;
    processes.forEach((d) => {
      const r = (d.data() && d.data().records) || [];
      records += r.length;
    });
    console.log('  dated records         : ' + records);

    console.log('\n  RESULT: Firestore is reachable and access is permitted.');
    if (processes.size === 0) {
      console.log('  The dataset is empty — use scripts/seed_throughput.js to migrate a backup.');
    }
    console.log('');
    process.exit(0);
  } catch (err) {
    const msg = (err && err.message) || String(err);
    console.error('\n  RESULT: NOT READY\n');
    console.error('  ' + msg);
    if (/permission|insufficient/i.test(msg)) {
      console.error('\n  Firestore rules deny this request. Either:');
      console.error('   a) publish firestore.rules (allow read, write) for browser sync, or');
      console.error('   b) re-run with --admin <key.json> to bypass rules for tooling.\n');
    } else {
      console.error('\n  If this mentions the database not existing, create it in the');
      console.error('  Firebase console: Build -> Firestore Database -> Create (production mode).\n');
    }
    process.exit(1);
  }
})();
