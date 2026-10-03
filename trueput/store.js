/* ==========================================================================
   LUMEED TRUEPUT — DATA STORE
   Local-first persistence (localStorage) mirrored to Cloud Firestore for
   real-time multi-device sync. Everything keeps working offline, on file://,
   or when Firebase is unreachable — sync simply stays off.
   ========================================================================== */
(function (global) {
  'use strict';

  /*
   * Firestore requires collection paths to have an ODD number of segments, so
   * these are root-level collections (1 segment) holding documents (2 segments).
   * A layout like `throughput/processes/groom` is invalid and would throw.
   */
  var COL_PROCESSES = 'lumeed_processes';
  var COL_WEEKS = 'lumeed_weeks';
  var COL_META = 'lumeed_meta';
  var DOC_META = 'state';

  var PREFIX = 'tp_';
  var RESERVED = { weekly_entries: 1, paper_types: 1, theme: 1, sync_meta: 1 };
  var SYNC_DEBOUNCE_MS = 900;

  var state = { processes: {}, weeklyEntries: [], paperTypes: [] };
var syncMeta = {
    remoteOk: null,
    live: false,
    confirmed: false,
    updatedAt: null,
    pending: false,
    reason: 'unknown',
    lastError: ''
  };

  var listeners = [];
  var changeListeners = [];
  var pushTimer = null;
  var unsubscribers = [];
  var localWriteAt = 0;

  var app = null;
  var db = null;

  /* ------------------------------ local I/O ------------------------------ */

  function readRaw(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeRaw(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {}
  }

  function blankProcess() {
    return { rate: 0, unit: 'daily', records: [] };
  }

  function normalizeProcess(data) {
    var d = data && typeof data === 'object' ? data : {};
    return {
      rate: typeof d.rate === 'number' ? d.rate : 0,
      unit: d.unit || 'daily',
      records: Array.isArray(d.records) ? d.records : []
    };
  }

  function isEmpty() {
    var recordCount = 0;
    for (var id in state.processes) {
      if (Object.prototype.hasOwnProperty.call(state.processes, id)) {
        recordCount += state.processes[id].records.length;
      }
    }
    return Object.keys(state.processes).length === 0 && recordCount === 0 && state.weeklyEntries.length === 0;
  }

  function touchLocal() {
    localWriteAt = Date.now();
  }

  /* Discover every tp_* process key so existing browser data is preserved. */
  function hydrateLocal() {
    var processes = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(PREFIX) !== 0) continue;
        var name = key.slice(PREFIX.length);
        if (RESERVED[name]) continue;
        var value = readRaw(name, null);
        if (value && typeof value === 'object') processes[name] = normalizeProcess(value);
      }
    } catch (e) {}

    state.processes = processes;
    state.weeklyEntries = readRaw('weekly_entries', []) || [];
    state.paperTypes = readRaw('paper_types', []) || [];
    syncMeta = readRaw('sync_meta', syncMeta) || syncMeta;
  }

  function persistLocal() {
    for (var id in state.processes) {
      if (Object.prototype.hasOwnProperty.call(state.processes, id)) {
        writeRaw(id, state.processes[id]);
      }
    }
    writeRaw('weekly_entries', state.weeklyEntries);
    writeRaw('paper_types', state.paperTypes);
    writeRaw('sync_meta', syncMeta);
  }

  /* ------------------------------- getters ------------------------------- */

/*
   * Returns a blank shape when a process is unknown, but deliberately does NOT
   * store it. Writing the placeholder back into state let a not-yet-loaded
   * process be treated as real data and pushed to Firestore, which wiped the
   * stored records.
   */
  function getProcess(id) {
    return Object.prototype.hasOwnProperty.call(state.processes, id)
      ? state.processes[id]
      : blankProcess();
  }

  function getWeekly() {
    return state.weeklyEntries;
  }

  function getPaperTypes() {
    return state.paperTypes;
  }

  /* ------------------------------- setters ------------------------------- */

  function setProcess(id, data) {
    state.processes[id] = normalizeProcess(data);
    touchLocal();
    persistLocal();
    schedulePush();
  }

  function setWeekly(entries) {
    state.weeklyEntries = Array.isArray(entries) ? entries : [];
    touchLocal();
    persistLocal();
    schedulePush();
  }

  function setPaperTypes(types) {
    state.paperTypes = Array.isArray(types) ? types : [];
    touchLocal();
    persistLocal();
    schedulePush();
  }

  /* -------------------------------- events ------------------------------- */

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](getSyncState());
      } catch (e) {}
    }
  }

  function emitChange(origin) {
    for (var j = 0; j < changeListeners.length; j++) {
      try {
        changeListeners[j](origin);
      } catch (e) {}
    }
  }

  /**
   * Classify a failure so the UI can explain *why* it is offline instead of
   * silently showing "Local only". The most common cause by far is Firestore
   * security rules still denying anonymous access.
   */
  function classifyError(message) {
    const msg = String(message || '');
    if (/permission|insufficient|unauthenticated|forbidden/i.test(msg)) return 'rules';
    if (/offline|network|unavailable|failed to fetch|timeout|disconnect|grpc/i.test(msg)) return 'network';
    if (/not configured|unavailable \(app\)|api key|invalid-api-key/i.test(msg)) return 'config';
    return 'error';
  }

function getSyncState() {
    return {
      remoteOk: syncMeta.remoteOk,
      live: syncMeta.live,
      confirmed: syncMeta.confirmed,
      pending: syncMeta.pending,
      reason: syncMeta.reason,
      updatedAt: syncMeta.updatedAt,
      lastError: syncMeta.lastError
    };
  }

  /**
   * A delivered snapshot proves the server is reachable — unless it came from
   * the local cache, which Firestore serves first and which would otherwise make
   * an unreachable database look connected.
   */
  function markConfirmed(snap) {
    if (snap && snap.metadata && snap.metadata.fromCache) return;
    syncMeta.remoteOk = true;
    syncMeta.confirmed = true;
    syncMeta.reason = 'ok';
    syncMeta.lastError = '';
  }

  /** A failure invalidates any "live" claim we were still showing. */
  function markFailed(message) {
    syncMeta.remoteOk = false;
    syncMeta.live = false;
    syncMeta.confirmed = false;
    syncMeta.lastError = String(message || '');
    syncMeta.reason = classifyError(syncMeta.lastError);
  }

  function onStatus(fn) {
    if (typeof fn === 'function') listeners.push(fn);
    emit();
  }

  function onChange(fn) {
    if (typeof fn === 'function') changeListeners.push(fn);
  }

  /* --------------------------- firebase bootstrap ------------------------ */

  function connect() {
    if (db) return true;

    var cfg = global.LUMEED_FIREBASE;
    var fb = global.firebase;
    if (!cfg || !fb || !fb.firestore || typeof fb.initializeApp !== 'function') {
      syncMeta.remoteOk = false;
      syncMeta.lastError = 'Firebase SDK or config unavailable';
      syncMeta.reason = 'config';
      persistLocal();
      emit();
      return false;
    }

    try {
      app = fb.apps && fb.apps.length ? fb.app() : fb.initializeApp(cfg);
      db = fb.firestore(app);
      // Keep the dashboard usable on flaky links; snapshots resume when back.
      if (db.enableMultiTabIndexedDbPersistence) {
        db.enableMultiTabIndexedDbPersistence(app).catch(function () {});
      } else if (db.enableIndexedDbPersistence) {
        db.enableIndexedDbPersistence(app).catch(function () {});
      }
// Initialising the SDK proves nothing about connectivity — stay
      // unconfirmed until the first snapshot (or write) actually succeeds.
      syncMeta.remoteOk = true;
      syncMeta.confirmed = false;
      syncMeta.reason = 'connecting';
      syncMeta.lastError = '';
      persistLocal();
      emit();
      return true;
    } catch (err) {
      db = null;
      syncMeta.remoteOk = false;
      syncMeta.lastError = String((err && err.message) || err);
        syncMeta.reason = classifyError(syncMeta.lastError);
      persistLocal();
      emit();
      return false;
    }
  }

  /* -------------------------------- writes ------------------------------- */

  function schedulePush() {
    syncMeta.pending = true;
    persistLocal();
    emit();
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(push, SYNC_DEBOUNCE_MS);
  }

  function push() {
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    if (!connect()) {
      syncMeta.pending = false;
      persistLocal();
      emit();
      return Promise.resolve(false);
    }

    // Snapshot the payloads BEFORE issuing any write. Each set() can trigger a
    // local snapshot that mutates `state`, so reading state while writing would
    // silently drop rows (e.g. weekly entries lost on the same save).
    var now = new Date().toISOString();
var processDocs = [];
    var weekDocs = [];
    var skippedProcesses = [];

for (var id in state.processes) {
      if (!Object.prototype.hasOwnProperty.call(state.processes, id)) continue;
      var proc = state.processes[id];
      var procRecords = Array.isArray(proc.records) ? proc.records : [];
      // Safety: an empty, zero-rate process holds no information and could only
      // destroy a good document, so never write it over real data.
      if (procRecords.length === 0 && !proc.rate) {
        skippedProcesses.push(id);
        continue;
      }
      processDocs.push({ id: id, data: Object.assign({}, proc, { updatedAt: now }) });
    }
    if (skippedProcesses.length) {
      console.warn('[trueput] skipped empty placeholder process(es): ' + skippedProcesses.join(', '));
    }
    state.weeklyEntries.forEach(function(entry) {
      if (entry && entry.date) weekDocs.push({ id: String(entry.date), data: entry });
    });

    var paperTypes = state.paperTypes.slice();
    var writes = [];

    processDocs.forEach(function(d) {
      writes.push(db.collection(COL_PROCESSES).doc(d.id).set(d.data, { merge: true }));
    });
    weekDocs.forEach(function(d) {
      writes.push(db.collection(COL_WEEKS).doc(d.id).set(d.data, { merge: true }));
    });
    writes.push(
      db.collection(COL_META).doc(DOC_META).set({ paperTypes: paperTypes, updatedAt: now }, { merge: true })
    );

return Promise.all(writes)
      .then(function () {
        markConfirmed(snap);
        syncMeta.pending = false;
        syncMeta.updatedAt = new Date().toISOString();
        persistLocal();
        emit();
        return true;
      })
      .catch(function (err) {
        syncMeta.remoteOk = false;
        syncMeta.pending = false;
        syncMeta.lastError = String((err && err.message) || err);
        syncMeta.reason = classifyError(syncMeta.lastError);
        persistLocal();
        emit();
        return false;
      });
  }

  /* ------------------------------- realtime ------------------------------ */

  function applySnapshot(processes, weeks, paperTypes) {
    var next = {};
    processes.forEach(function(doc) {
      next[doc.id] = normalizeProcess(doc.data);
    });
    state.processes = next;
    state.weeklyEntries = weeks.map(function(doc) {
      return Object.assign({ date: doc.id }, doc.data);
    }).sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    if (Array.isArray(paperTypes)) state.paperTypes = paperTypes;
  }

  function subscribe() {
    if (!connect()) return;

    var flushTimer = null;

    function scheduleFlush() {
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(flushRemote, 30);
    }

function onStreamError(err) {
      markFailed((err && err.message) || err);
      emit();
    }

    // An empty incoming snapshot must never wipe data the browser already has
    // (e.g. worked offline, remote still empty) — we push instead.
    function remoteIsEmpty(processesCount, weeksCount) {
      return processesCount === 0 && weeksCount === 0 && isEmpty();
    }

var unsubMeta = db.collection(COL_META).doc(DOC_META)
      .onSnapshot(function(snap) {
        markConfirmed(snap);
        /* In the compat SDK `exists` is a boolean property, not a method. */
        if (!snap.exists) return;
        var data = snap.data() || {};
        if (data.updatedAt) syncMeta.updatedAt = data.updatedAt;
        if (Array.isArray(data.paperTypes) &&
            JSON.stringify(data.paperTypes) !== JSON.stringify(state.paperTypes)) {
          state.paperTypes = data.paperTypes;
          writeRaw('paper_types', state.paperTypes);
        }
        emit();
      }, onStreamError);

var unsubProcesses = db.collection(COL_PROCESSES)
      .onSnapshot(function(snap) {
        markConfirmed(snap);
        if (snap.empty && !isEmpty()) { schedulePush(); return; }

        var next = {};
        snap.forEach(function(doc) {
          next[doc.id] = normalizeProcess(doc.data());
          writeRaw(doc.id, next[doc.id]);
        });
        state.processes = next;
        scheduleFlush();
        emit();
      }, onStreamError);

var unsubWeeks = db.collection(COL_WEEKS)
      .onSnapshot(function(snap) {
        markConfirmed(snap);
        if (snap.empty && !isEmpty()) { schedulePush(); return; }

        var weeks = [];
        snap.forEach(function(doc) {
          weeks.push(Object.assign({ date: doc.id }, doc.data()));
        });
        state.weeklyEntries = weeks.sort(function(a, b) {
          return new Date(a.date) - new Date(b.date);
        });
        writeRaw('weekly_entries', state.weeklyEntries);
        scheduleFlush();
        emit();
      }, onStreamError);

    unsubscribers = [unsubMeta, unsubProcesses, unsubWeeks];

    function flushRemote() {
      // Ignore the echo of our own write so we don't thrash re-renders.
      if (Date.now() - localWriteAt < 1500) return;

      syncMeta.live = true;
      persistLocal();
      emit();
      emitChange('remote');
    }
  }

  function pull() {
    if (!connect()) return Promise.resolve(false);
    if (!unsubscribers.length) subscribe();
    return Promise.resolve(true);
  }

  /* --------------------------- import / export --------------------------- */

  function exportPayload() {
    return {
      project: { year: new Date().getFullYear() },
      processes: state.processes,
      weeklyEntries: state.weeklyEntries,
      paperTypes: state.paperTypes
    };
  }

  function importPayload(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Unrecognized backup file.');

    var source = payload.processes ? payload.processes : payload;
    var processes = {};

    // Support both the flat { id, rate, unit, records } map and the older
    // export shape: { processes: [{ id, rate, unit, records }] }
    if (Array.isArray(source)) {
      source.forEach(function(entry) {
        if (entry && entry.id) processes[entry.id] = normalizeProcess(entry);
      });
    } else {
      for (var id in source) {
        if (Object.prototype.hasOwnProperty.call(source, id) && id !== 'project') {
          processes[id] = normalizeProcess(source[id]);
        }
      }
    }

    if (!Object.keys(processes).length) throw new Error('No process records found in backup.');

    state.processes = processes;
    state.weeklyEntries = Array.isArray(payload.weeklyEntries) ? payload.weeklyEntries : [];
    state.paperTypes = Array.isArray(payload.paperTypes) ? payload.paperTypes : [];
    touchLocal();
    persistLocal();
    schedulePush();
    return Object.keys(processes).length;
  }

  function resetAll() {
    try {
      var doomed = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(PREFIX) === 0 && !RESERVED[key.slice(PREFIX.length)]) doomed.push(key);
      }
      doomed.forEach(function(key) {
        localStorage.removeItem(key);
      });
    } catch (e) {}
    state = { processes: {}, weeklyEntries: [], paperTypes: [] };
    syncMeta.updatedAt = null;
    touchLocal();
    persistLocal();
    emit();
  }

  /* --------------------------------- init -------------------------------- */

  hydrateLocal();

  global.TPStore = {
    getProcess: getProcess,
    setProcess: setProcess,
    getWeekly: getWeekly,
    setWeekly: setWeekly,
    getPaperTypes: getPaperTypes,
    setPaperTypes: setPaperTypes,
    getSyncState: getSyncState,
    onStatus: onStatus,
    onChange: onChange,
    pull: pull,
    push: push,
    exportPayload: exportPayload,
    importPayload: importPayload,
    resetAll: resetAll,
    hasData: function () {
      return !isEmpty();
    }
  };
})(window);
