(function() {
  "use strict";
  const CK = window.CK = window.CK || {};
  const DB_NAME = "ck-wallet-device";
  const DB_STORE = "keys";
  const LOCAL_PREFIX = "ck-device:";
  const DEVICE_PREFIX = "ck_device_v1_";
  const VERSION = 1;
  const CALL_MS = 3e3;
  const utf8 = (text) => new TextEncoder().encode(text);
  const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
  const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  const failed = (code) => Object.assign(new Error(code), { code });
  function timed(promise, code) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(failed(code)), CALL_MS);
      promise.then((value) => {
        clearTimeout(timer);
        resolve(value);
      }, (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
  function accountOf(app) {
    const user = app && app.initDataUnsafe && app.initDataUnsafe.user;
    if (user && Number.isSafeInteger(user.id) && user.id > 0) return user.id;
    try {
      const parsed = JSON.parse(new URLSearchParams(app && app.initData || "").get("user") || "null");
      if (parsed && Number.isSafeInteger(parsed.id) && parsed.id > 0) return parsed.id;
    } catch (_) {
    }
    return null;
  }
  const hasCrypto = () => typeof crypto === "object" && !!crypto && !!crypto.subtle && typeof crypto.getRandomValues === "function";
  const newKey = () => crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  function dbOpen() {
    const idb = typeof indexedDB === "object" && indexedDB ? indexedDB : null;
    if (!idb) return Promise.resolve(null);
    return timed(new Promise((resolve, reject) => {
      let req;
      try {
        req = idb.open(DB_NAME, VERSION);
      } catch (_) {
        reject(failed("idb_failed"));
        return;
      }
      req.onupgradeneeded = () => {
        req.result.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => {
        req.result.onversionchange = () => req.result.close();
        resolve(req.result);
      };
      req.onerror = () => reject(failed("idb_failed"));
      req.onblocked = () => reject(failed("idb_failed"));
    }), "idb_timeout").catch(() => null);
  }
  function dbRun(db, mode, work) {
    return timed(new Promise((resolve, reject) => {
      let tx, req;
      try {
        tx = db.transaction(DB_STORE, mode);
        req = work(tx.objectStore(DB_STORE));
      } catch (_) {
        reject(failed("idb_failed"));
        return;
      }
      tx.oncomplete = () => resolve(req ? req.result : void 0);
      tx.onerror = (event) => {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        reject(failed("idb_failed"));
      };
      tx.onabort = () => reject(failed("idb_failed"));
    }), "idb_timeout");
  }
  const recordId = (account) => `a:${account}`;
  function deviceBackend(app) {
    const store = app && typeof app.isVersionAtLeast === "function" && app.isVersionAtLeast("9.0") ? app.DeviceStorage : null;
    if (!store || typeof store.getItem !== "function") return null;
    const call = (start) => timed(new Promise((resolve, reject) => {
      try {
        start((err, value) => err ? reject(failed("device_failed")) : resolve(value));
      } catch (_) {
        reject(failed("device_failed"));
      }
    }), "device_timeout");
    return {
      kind: "device",
      get: (name) => call((done) => store.getItem(DEVICE_PREFIX + name, done)).then((value) => value || null),
      set: (name, text) => call((done) => store.setItem(DEVICE_PREFIX + name, text, done)),
      remove: (name) => call((done) => store.removeItem(DEVICE_PREFIX + name, done))
    };
  }
  function localBackend(account) {
    const own = `${LOCAL_PREFIX}${account}:`;
    try {
      localStorage.setItem(own + "probe", "1");
      localStorage.removeItem(own + "probe");
    } catch (_) {
      return null;
    }
    const guard = (fn) => new Promise((resolve, reject) => {
      try {
        resolve(fn());
      } catch (_) {
        reject(failed("local_failed"));
      }
    });
    return {
      kind: "local",
      get: (name) => guard(() => localStorage.getItem(own + name)),
      set: (name, text) => guard(() => localStorage.setItem(own + name, text)),
      remove: (name) => guard(() => localStorage.removeItem(own + name))
    };
  }
  function hasLocalCopy(account) {
    const own = `${LOCAL_PREFIX}${account}:`;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(own) && key !== own + "probe") return true;
      }
    } catch (_) {
    }
    return false;
  }
  async function forgetOthers(db, account) {
    const ids = await dbRun(db, "readonly", (store) => store.getAllKeys()).catch(() => []);
    const gone = [];
    for (const id of ids || []) {
      if (typeof id !== "string" || !id.startsWith("a:") || id === recordId(account)) continue;
      const record = await dbRun(db, "readonly", (store) => store.get(id)).catch(() => null);
      if (record && record.kind === "local" && record.b === true) gone.push(id);
    }
    if (!gone.length) return;
    try {
      const prefixes = gone.map((id) => `${LOCAL_PREFIX}${id.slice(2)}:`);
      const copies = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && prefixes.some((prefix) => key.startsWith(prefix))) copies.push(key);
      }
      copies.forEach((key) => localStorage.removeItem(key));
    } catch (_) {
    }
    await dbRun(db, "readwrite", (store) => {
      gone.forEach((id) => store.delete(id));
      return null;
    }).catch(() => null);
  }
  function create(app, epoch, verified) {
    const named = accountOf(app);
    const account = verified === void 0 ? named : Number.isSafeInteger(verified) && verified > 0 && named === verified ? verified : null;
    if (!account || !hasCrypto() || !Number.isInteger(epoch)) return null;
    const bound = (name) => utf8(`ck-device|${VERSION}|${account}|${epoch}|${name}`);
    let setup = null;
    function ready() {
      if (setup) return setup;
      const job = (async () => {
        const db = await dbOpen();
        let backend = null;
        if (db) {
          const device = deviceBackend(app);
          let own = null, ownFailed = null;
          if (device) own = await dbRun(db, "readonly", (store) => store.get(recordId(account))).catch((err) => {
            ownFailed = err;
            return null;
          });
          const keptLocal = !!own && own.e === epoch && (own.kind === "local" || !own.kind && hasLocalCopy(account));
          const probe = device && !keptLocal ? await device.get("probe").then(() => "ok", (err) => err && err.code || "device_failed") : null;
          if (keptLocal) backend = localBackend(account);
          else if (probe === "ok") backend = device;
          else {
            if (device) {
              if (ownFailed) throw ownFailed;
              const sealedIn = own ? own.kind || (hasLocalCopy(account) ? "local" : "device") : null;
              if (probe === "device_timeout" && own || sealedIn === "device") throw failed(probe);
            }
            backend = localBackend(account);
          }
        }
        if (!db || !backend) throw failed("no_store");
        if (backend.kind === "local") await forgetOthers(db, account);
        return { db, backend, key: null };
      })();
      setup = job;
      job.catch(() => {
        if (setup === job) setup = null;
      });
      return job;
    }
    async function stamp(state, fields) {
      if (!state.db) return;
      const id = recordId(account);
      const record = await dbRun(state.db, "readonly", (store) => store.get(id));
      if (!record || record.e !== epoch || !record.key || Object.keys(fields).every((name) => record[name] === fields[name])) return;
      await dbRun(state.db, "readwrite", (store) => store.put({ ...record, ...fields }, id));
    }
    async function keyOf(state, make) {
      if (state.key) return state.key;
      const id = recordId(account);
      const record = await dbRun(state.db, "readonly", (store) => store.get(id));
      if (record && record.e === epoch && record.key && typeof record.key === "object") return record.key;
      if (record && Number.isInteger(record.e) && record.e > epoch) {
        if (make) throw failed("epoch_newer");
        return null;
      }
      if (record) await dbRun(state.db, "readwrite", (store) => store.delete(id));
      if (!make) return null;
      const key = await newKey();
      await dbRun(state.db, "readwrite", (store) => store.add({ key, e: epoch, kind: state.backend.kind }, id)).catch(() => null);
      const kept = await dbRun(state.db, "readonly", (store) => store.get(id));
      if (!kept || kept.e !== epoch || !kept.key) throw failed("idb_failed");
      return kept.key;
    }
    async function read(name) {
      const state = await ready();
      const text = await state.backend.get(name);
      if (!text) return null;
      let sealed = null;
      try {
        sealed = JSON.parse(text);
      } catch (_) {
      }
      const shaped = !!sealed && sealed.v === VERSION && sealed.u === account && sealed.e === epoch && typeof sealed.iv === "string" && typeof sealed.ct === "string";
      const key = await keyOf(state, false);
      if (key && shaped) {
        try {
          const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(sealed.iv), additionalData: bound(name) }, key, fromBase64(sealed.ct));
          return new TextDecoder().decode(plain);
        } catch (_) {
        }
      }
      if (sealed && sealed.u === account && Number.isInteger(sealed.e) && sealed.e < epoch) await state.backend.remove(name).catch(() => null);
      return null;
    }
    async function write(name, value) {
      const state = await ready();
      const key = await keyOf(state, true);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plain = utf8(String(value));
      let ct;
      try {
        ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: bound(name) }, key, plain));
      } finally {
        plain.fill(0);
      }
      await state.backend.set(name, JSON.stringify({ v: VERSION, u: account, e: epoch, iv: toBase64(iv), ct: toBase64(ct) }));
      if (state.db) await stamp(state, { kind: state.backend.kind }).catch(() => null);
    }
    let backedUpSaid = false;
    function markBackedUp() {
      if (backedUpSaid) return Promise.resolve();
      return ready().then((state) => stamp(state, { b: true })).then(() => {
        backedUpSaid = true;
      }, () => null);
    }
    const answer = (job, cb, shape) => {
      job.then((value) => cb(null, ...shape(value)), (err) => cb(err && err.code || "STORAGE_FAILED", null, false));
    };
    return Object.freeze({
      getItem: (name, cb) => answer(read(String(name)), cb, (value) => [value, false]),
      setItem: (name, value, cb) => answer(write(String(name), value), cb, () => [true]),
      removeItem: (name, cb) => answer(ready().then((state) => state.backend.remove(String(name))), cb, () => [true]),
      restoreItem: (name, cb) => setTimeout(() => cb("UNSUPPORTED", null), 0),
      kind: () => ready().then((state) => state.backend.kind),
      markBackedUp
    });
  }
  Object.defineProperty(CK, "deviceStore", { value: Object.freeze({ create }), writable: false, configurable: false, enumerable: true });
})();
