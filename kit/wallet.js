(function () {
  'use strict';
  const CK = window.CK;
  const T = CK.ton;

  const NET_API = { evm: true, sol: true, tron: true };
  const netFns = {};
  function netApi(name) {
    if (netFns[name]) return netFns[name];
    const held = NET_API[name] === true ? Object.getOwnPropertyDescriptor(CK, name) : null;
    const api = held && held.value;
    if (!api || held.writable || held.configurable || !Object.isFrozen(api) || typeof api.bundle !== 'function' || typeof api.keyOf !== 'function' || typeof api.deriveAddress !== 'function') throw fail('bad_intent');
    const fns = {};
    ['bundle', 'keyOf', 'deriveAddress', 'altAddresses', 'holderFill', 'holderShort', 'auditBuy', 'depositBody', 'pins'].forEach((key) => { if (typeof api[key] === 'function') fns[key] = api[key]; });
    netFns[name] = Object.freeze(fns);
    return netFns[name];
  }
  const keyTaken = new Set();
  let keyClosed = false;
  if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', () => {
      keyClosed = true;
      Object.keys(NET_API).forEach((name) => {
        try { netApi(name); } catch (_) { }
      });
    }, { once: true });
  }

  const BUNDLE = 'kit/vendor/ton-wallet-16.3.0.min.js';
  const BUNDLE_SRI = 'sha384-/AFTSubaxg2Gxq8Ohi9Dp1bssk2oLZocNkVEE8hMi+2fV2m1r5EFlJtCUrkklF9i';
  const SECRET_KEY = 'ck_wallet_v1';
  const CLOUD_KEY = 'ck_wallet_address';
  const MARKS_KEY = 'ck_wallet_backup';
  const BACKUP_KEY = 'ck_wallet_cloud_v1';
  const PROBE_KEY = 'ck_wallet_cloud_v1_probe';
  const BACKUP_FAILS_LOCAL = 'ck-wallet-backup-fails:';
  const KID_LOCAL = 'ck-wallet-backup-kid';
  const KID_AT_LOCAL = 'ck-wallet-backup-kid-at';
  const KID_FORMAT = /^[0-9a-f]{16}$/;
  const KID_CHECK_MS = 24 * 60 * 60 * 1000;
  const BACKUP_FAILING_AFTER = 3;
  const BACKUP_WAIT_MS = 10000;
  const KEPT_REFUSED_LOCAL = 'ck-wallet-kept-refused';
  const KEPT_ASKS = 2;
  const MARKS_LOCAL = 'ck-wallet-backup:';
  const PENDING_KEY = 'ck-wallet-pending:';
  const EPOCH = 2;
  const EPOCH_KEY = 'ck_wallet_epoch';
  const ARCHIVE_KEY = 'ck_wallet_archive_v1';
  const SWAP_KEY = 'ck_wallet_swap_v1';
  const MOVE_DUST_NANO = 10000000n;
  const MOVE_JETTONS_MAX = 8;
  const MOVE_TOPUP_MAX = 500000000n;
  const MOVE_TOPUP_ROOM = 5000000n;
  const MOVE_WAIT_MS = 90000;
  const MOVE_VALID_S = 300;
  const CLOUD_PATIENT_MS = 8000;
  const RETRY_MS = [2000, 5000, 10000, 20000, 40000];
  const PHONES = new Set(['ios', 'android', 'android_x']);
  const RECORD_SETTLE_MS = 700;
  const STORAGE_MS = 3000;
  const LATE_WRITE_MS = 15000;
  const SDK_WAIT_MS = 5000;
  const PROMPT_MS = 120000;
  const WORDS = 24;
  const PASSWORD_MIN = 12;
  const PBKDF2_ITERATIONS = 220000;
  const SEND_MODE = 3;
  const VALID_S = 120;
  const SWAP_UNLOCK_MS = 60000;
  const CHAIN_FRESH_MS = 5000;
  const EXPIRY_MARGIN_S = 15;
  const GAS_NANO = 5000000n;
  const SWAP_RESERVE_NANO = 20000000n;
  const JETTON_GAS_NANO = 50000000n;
  const JETTON_TRANSFER_OP = 0x0f8a7ea5;
  const COMMENT_MAX = 120;
  const PAYLOAD_MAX = 4096;
  const SEND_TRIES = 3;
  const SEND_PAUSE_MS = 1500;
  const SEND_FINAL = new Set(['bad_boc', 'bad_request']);

  function fail(code, extra) {
    const err = new Error(code);
    err.code = code;
    return extra ? Object.assign(err, extra) : err;
  }

  const utf8 = (text) => new TextEncoder().encode(text);
  const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
  const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
  const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  let bundleJob = null;
  const LIB_NAME = 'TonWallet';
  let libClaimed = false;
  try {
    Object.defineProperty(window, LIB_NAME, { value: undefined, writable: true, configurable: false, enumerable: false });
    libClaimed = true;
  } catch (_) { }
  function takeLib() {
    const held = libClaimed ? Object.getOwnPropertyDescriptor(window, LIB_NAME) : null;
    const lib = held && 'value' in held && held.value && typeof held.value === 'object' ? held.value : null;
    if (!lib) return null;
    Object.freeze(lib);
    if (held.writable) Object.defineProperty(window, LIB_NAME, { value: lib, writable: false });
    return lib;
  }
  function bundle() {
    if (bundleJob) return bundleJob;
    bundleJob = new Promise((resolve, reject) => {
      if (!libClaimed) return reject(fail('bundle_failed'));
      const tag = document.createElement('script');
      tag.src = BUNDLE;
      tag.integrity = BUNDLE_SRI;
      tag.onload = () => { const lib = takeLib(); return lib ? resolve(lib) : reject(fail('bundle_failed')); };
      tag.onerror = () => reject(fail('bundle_failed'));
      document.head.appendChild(tag);
    }).catch((err) => {
      bundleJob = null;
      throw err;
    });
    return bundleJob;
  }
  const contractOf = (lib, publicKey, subwallet) => lib.WalletContractV5R1.create(subwallet
    ? { workChain: 0, publicKey, walletId: { networkGlobalId: -239, context: { walletVersion: 'v5r1', workchain: 0, subwalletNumber: subwallet } } }
    : { workChain: 0, publicKey });
  const KINDS = new Set(['ton', 'bip39']);
  const kindOf = (held) => (held && held.d === 'bip39' ? 'bip39' : 'ton');
  const TON_BIP39_PATH = [44, 607, 0];
  async function hmacSha512(key, data) {
    const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
  }
  async function bip39Seed(words) {
    const plain = utf8(words.join(' ').normalize('NFKD'));
    try {
      const base = await crypto.subtle.importKey('raw', plain, 'PBKDF2', false, ['deriveBits']);
      return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-512', salt: utf8('mnemonic'), iterations: 2048 }, base, 512));
    } finally {
      plain.fill(0);
    }
  }
  async function slip10Ed25519(seed, path) {
    let node = await hmacSha512(utf8('ed25519 seed'), seed);
    for (const index of path) {
      const data = new Uint8Array(37);
      data.set(node.subarray(0, 32), 1);
      const n = (index | 0x80000000) >>> 0;
      data[33] = n >>> 24;
      data[34] = (n >>> 16) & 255;
      data[35] = (n >>> 8) & 255;
      data[36] = n & 255;
      const next = await hmacSha512(node.subarray(32), data);
      data.fill(0);
      node.fill(0);
      node = next;
    }
    const key = node.slice(0, 32);
    node.fill(0);
    return key;
  }
  async function keysOf(lib, words, kind) {
    if (kind === undefined || kind === 'ton') return lib.mnemonicToPrivateKey(words);
    if (kind !== 'bip39') throw fail('bad_intent');
    const seed = await bip39Seed(words);
    let key = null;
    try {
      key = await slip10Ed25519(seed, TON_BIP39_PATH);
      return lib.keyPairFromSeed(key);
    } finally {
      seed.fill(0);
      if (key) key.fill(0);
    }
  }
  const addressOf = (lib, publicKey) => contractOf(lib, publicKey).address.toRawString();

  const WORD_COUNTS = Object.freeze([12, 15, 18, 21, 24]);
  const firstHashByte = async (entropy) => new Uint8Array(await crypto.subtle.digest('SHA-256', entropy))[0];
  function bip39Words(dictionary, entropy, checksum) {
    const words = [];
    let buffer = 0, bits = 0;
    for (const byte of [...entropy, checksum]) {
      buffer = (buffer << 8) | byte;
      bits += 8;
      if (bits >= 11) {
        bits -= 11;
        words.push(dictionary[buffer >>> bits]);
        buffer &= (1 << bits) - 1;
      }
    }
    return words;
  }
  const multiNet = (dictionary, words) => Array.isArray(words) && WORD_COUNTS.includes(words.length) && words.every((word) => dictionary.indexOf(word) >= 0);
  async function passesBip39(dictionary, words) {
    const n = words.length;
    if (!WORD_COUNTS.includes(n)) return false;
    const checksumBits = n / 3;
    const entropyBytes = (n * 11 - checksumBits) / 8;
    const bytes = [];
    let buffer = 0, bits = 0;
    for (const word of words) {
      const index = dictionary.indexOf(word);
      if (index < 0) return false;
      buffer = (buffer << 11) | index;
      bits += 11;
      while (bits >= 8) {
        bits -= 8;
        bytes.push(buffer >>> bits);
        buffer &= (1 << bits) - 1;
      }
    }
    const checksum = (bytes.length > entropyBytes ? bytes[entropyBytes] << bits : 0) | buffer;
    const entropy = Uint8Array.from(bytes.slice(0, entropyBytes));
    const passed = ((await firstHashByte(entropy)) >>> (8 - checksumBits)) === checksum;
    entropy.fill(0);
    bytes.fill(0);
    buffer = 0;
    return passed;
  }
  async function keychainRoot(words) {
    const plain = utf8(words.join(' '));
    let mark = null, out = null;
    try {
      mark = await hmacSha512(utf8('TON Keychain'), plain);
      const base = await crypto.subtle.importKey('raw', mark, 'PBKDF2', false, ['deriveBits']);
      out = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-512', salt: utf8('TON Keychain Version'), iterations: 1 }, base, 512));
      return out[0] === 0;
    } finally {
      plain.fill(0);
      if (mark) mark.fill(0);
      if (out) out.fill(0);
    }
  }
  async function classifyWords(lib, words) {
    const n = words.length;
    const inDictionary = words.every((word) => lib.mnemonicWordList.indexOf(word) >= 0);
    const ton = n === 24 && inDictionary && (await lib.mnemonicValidate(words));
    const bip39 = await passesBip39(lib.mnemonicWordList, words);
    const root = n === 24 && inDictionary && !ton && !bip39 && (await keychainRoot(words));
    return { ton, bip39, keychainRoot: root };
  }
  function refuseWords(words, c) {
    if (!WORD_COUNTS.includes(words.length)) throw fail('bad_words', { reason: 'count' });
    if (c.keychainRoot) throw fail('bad_words', { reason: 'keychain' });
    if (!c.ton && !c.bip39) throw fail('bad_words', { reason: 'check' });
  }
  async function evmOfWords(words) {
    try {
      const api = netApi('evm');
      return await api.deriveAddress(await api.bundle(), words);
    } catch (err) {
      console.warn('wallet: the EVM address of typed words was not read', err && (err.code || err.message));
      return null;
    }
  }
  async function keyUsed(lib, publicKey) {
    const addresses = [addressOf(lib, publicKey), ...legacyAddressesOf(lib, publicKey).map((one) => one.address)];
    for (const address of addresses) {
      const chain = await chainState(address);
      if (chain.balance === null) throw fail('balance_unknown');
      if (chain.seqno > 0 || chain.balance > 0n || (chain.status !== 'uninit' && chain.status !== 'nonexist')) return true;
      const rows = await tokenRows(address);
      if (rows.some((row) => row && !row.native && (T.parseUnits(String(row.units)) || 0n) > 0n)) return true;
    }
    return false;
  }
  async function chooseKind(lib, words, c, given, record, known) {
    if (given !== undefined && given !== null) {
      if (!KINDS.has(given)) throw fail('bad_intent');
      if (given === 'ton' ? !c.ton : !c.bip39) throw fail('bad_words', { reason: 'check' });
      return given;
    }
    const keys = {};
    try {
      if (record) {
        for (const kind of KINDS) {
          if (kind === 'ton' ? words.length !== 24 : !c.bip39) continue;
          keys[kind] = await keysOf(lib, words, kind);
          if (addressOf(lib, keys[kind].publicKey) === record) return kind;
        }
      }
      if (!c.ton) return 'bip39';
      if (!c.bip39) return 'ton';
      for (const kind of KINDS) if (!keys[kind]) keys[kind] = await keysOf(lib, words, kind);
      const here = [...KINDS].find((kind) => known && known.has(addressOf(lib, keys[kind].publicKey)));
      if (here) return here;
      try {
        const [ton, bip39] = [await keyUsed(lib, keys.ton.publicKey), await keyUsed(lib, keys.bip39.publicKey)];
        if (ton !== bip39) return ton ? 'ton' : 'bip39';
      } catch (err) {
        console.warn('wallet: the chain did not say which phrase this is', err && (err.code || err.message));
      }
      return null;
    } finally {
      Object.values(keys).forEach((one) => one.secretKey.fill(0));
    }
  }
  async function newWords(lib) {
    for (;;) {
      const entropy = randomBytes(32);
      const words = bip39Words(lib.mnemonicWordList, entropy, await firstHashByte(entropy));
      entropy.fill(0);
      if (await lib.mnemonicValidate(words)) return words;
    }
  }

  const sdkTag = document.getElementById ? document.getElementById('tg-sdk') : null;
  const sdkReady = new Promise((resolve) => {
    if (CK.tg.app || !CK.tg.inside || !sdkTag) {
      resolve();
      return;
    }
    sdkTag.addEventListener('load', resolve, { once: true });
    sdkTag.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, SDK_WAIT_MS);
  });
  const atLeast = (version) => {
    const app = CK.tg.app;
    try { return !!(app && app.isVersionAtLeast && app.isVersionAtLeast(version)); } catch (_) { return false; }
  };
  const onPhone = () => !!CK.tg.app && PHONES.has(CK.tg.app.platform);
  const LAUNCH_MS = 8000;
  const FOREIGN_ERRORS = new Set(['bad_signature', 'no_user', 'no_init_data', 'bad_init_data']);
  let launchState = 'unknown', launchUser = null, launchJob = null;
  let launchData = null;
  const launchOk = () => launchState === 'ok' && !!CK.tg.app;
  function namedUser(app) {
    const user = app && app.initDataUnsafe && app.initDataUnsafe.user;
    return user && user.id !== undefined ? user.id : null;
  }
  async function askLaunch() {
    await sdkReady;
    const app = CK.tg.app;
    if (!app) return 'unknown';
    const data = await CK.tg.whenInitData();
    let copies = 0;
    try { copies = new URLSearchParams(String(location.hash || '').slice(1)).getAll('tgWebAppData').length; } catch (_) { }
    if (!data || copies > 1 || (typeof app.initData === 'string' && app.initData && app.initData !== data)) return 'foreign';
    let body = null;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), LAUNCH_MS);
    try {
      const res = await fetch('api/me', { headers: { Authorization: 'tma ' + data }, cache: 'no-store', signal: abort.signal });
      body = await res.json();
    } catch (_) {
      return 'unknown';
    } finally {
      clearTimeout(timer);
    }
    if (body && body.ok === true) {
      const id = body.user && body.user.id;
      const named = namedUser(app);
      if (!Number.isSafeInteger(id) || id <= 0 || (named !== null && named !== id)) return 'foreign';
      launchUser = id;
      launchData = data;
      return 'ok';
    }
    return body && FOREIGN_ERRORS.has(body.error) ? 'foreign' : 'unknown';
  }
  function verifyLaunch() {
    if (launchState !== 'unknown') return Promise.resolve(launchState);
    if (!launchJob) {
      launchJob = askLaunch().catch(() => 'unknown').then((state) => {
        launchState = state;
        launchJob = null;
        return state;
      });
    }
    return launchJob;
  }
  async function requireLaunch() {
    const state = await verifyLaunch();
    if (state !== 'ok' && CK.tg.app) throw fail(state === 'foreign' ? 'foreign_launch' : 'launch_unknown');
  }
  function tgCall(start, ms, timeoutCode) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(fail(timeoutCode || 'storage_timeout')), ms || STORAGE_MS);
      try {
        start((...args) => {
          clearTimeout(timer);
          resolve(args);
        });
      } catch (_) {
        clearTimeout(timer);
        reject(fail('storage_failed'));
      }
    });
  }

  const DEVICE_API = (() => {
    const held = Object.getOwnPropertyDescriptor(CK, 'deviceStore');
    const api = held && held.value;
    return api && !held.writable && !held.configurable && Object.isFrozen(api) && typeof api.create === 'function' ? api : null;
  })();
  let deviceFor = null, deviceHeld = null;
  function deviceStore() {
    const app = CK.tg.app;
    if (!DEVICE_API || !app || !launchOk()) return null;
    if (deviceFor !== app) {
      deviceFor = app;
      try { deviceHeld = DEVICE_API.create(app, EPOCH, launchUser); } catch (_) { deviceHeld = null; }
    }
    return deviceHeld;
  }
  const onDevice = () => !!CK.tg.app && !(onPhone() && atLeast('9.0')) && atLeast('6.9') && !!deviceStore();
  const holdsHere = () => onPhone() || onDevice();
  const secureStore = () => (!launchOk() ? null : onDevice() ? deviceStore() : atLeast('9.0') ? CK.tg.app.SecureStorage : null);
  async function slotRead(key) {
    const store = secureStore();
    if (!store) return { ok: false, text: null, blob: null, kept: false };
    const [err, value, canRestore] = await tgCall((done) => store.getItem(key, done));
    if (err) return { ok: false, text: null, blob: null, kept: false };
    return { ok: true, text: value || null, blob: readBlob(value), kept: !value && !!canRestore };
  }
  async function slotWrite(key, text, opts) {
    const store = secureStore();
    if (!store) throw fail('no_secure_storage');
    const o = opts || {};
    const before = await slotRead(key);
    if (!before.ok) throw fail('storage_timeout');
    if (before.kept && !o.overKept) throw fail('slot_kept');
    if ('expect' in o && before.text !== o.expect && before.text !== text) throw fail('storage_timeout');
    let answered = null;
    const landed = new Promise((resolve) => { answered = resolve; });
    let err;
    try {
      [err] = await tgCall((done) => store.setItem(key, text, (...args) => { answered(); done(...args); }));
    } catch (timedOut) {
      unanswered.add(Promise.race([landed, new Promise((resolve) => setTimeout(resolve, LATE_WRITE_MS))]));
      throw timedOut;
    }
    if (err) throw fail('storage_failed');
    const back = await slotRead(key);
    if (back.text !== text) throw fail('storage_failed');
  }
  const unanswered = new Set();
  let slotQueue = Promise.resolve();
  function slotJob(fn) {
    const run = slotQueue.then(() => fn());
    slotQueue = run.catch(() => null).then(async () => {
      while (unanswered.size) {
        const waits = [...unanswered];
        unanswered.clear();
        await Promise.all(waits);
      }
    });
    return run;
  }
  async function slotRemove(key) {
    const store = secureStore();
    if (!store) return;
    const [err] = await tgCall((done) => store.removeItem(key, done));
    if (err) throw fail('storage_failed');
  }
  const keptAsked = new Set();
  async function slotRestore(key) {
    const slot = await slotRead(key);
    if (!slot.ok) throw fail('storage_timeout');
    if (!slot.kept) return slot;
    if (keptAsked.has(key)) throw fail('slot_kept');
    keptAsked.add(key);
    let value = null;
    try {
      const [err, restored] = await tgCall((done) => secureStore().restoreItem(key, done), PROMPT_MS);
      value = err ? null : restored || null;
    } catch (_) { }
    if (!value) throw fail('slot_kept');
    const now = await slotRead(key);
    if (!now.ok) throw fail('storage_timeout');
    if (now.text !== value) await slotWrite(key, value, { overKept: true, expect: null });
    keptAsked.delete(key);
    return slotRead(key);
  }
  async function secureRead() {
    const slot = await slotRead(SECRET_KEY);
    return { ok: slot.ok, value: slot.text, canRestore: slot.kept };
  }
  async function secureWrite(value, overKept) {
    await slotWrite(SECRET_KEY, value, { overKept: overKept === true });
  }
  async function secureRemove() {
    const store = secureStore();
    if (!store) return;
    const [err] = await tgCall((done) => store.removeItem(SECRET_KEY, done));
    if (err) throw fail('storage_failed');
  }

  const cloudStore = () => (launchOk() && atLeast('6.9') ? CK.tg.app.CloudStorage : null);
  let patient = false;
  const cloudMs = () => (patient ? CLOUD_PATIENT_MS : STORAGE_MS);
  async function cloudRead() {
    const store = cloudStore();
    if (!store) return { ok: false, address: null };
    const [err, value] = await tgCall((done) => store.getItem(CLOUD_KEY, done), cloudMs());
    if (err) return { ok: false, address: null };
    const address = value ? T.rawAddress(value) : null;
    return { ok: true, address: address && address.startsWith('0:') ? address : null };
  }
  async function cloudWrite(address) {
    const store = cloudStore();
    if (!store) return false;
    const [err] = await tgCall((done) => store.setItem(CLOUD_KEY, address, done), cloudMs());
    return !err;
  }
  function readEpoch(text) {
    if (!text) return null;
    let rec;
    try { rec = JSON.parse(text); } catch (_) { return null; }
    if (!rec || !Number.isInteger(rec.e) || rec.e < EPOCH || T.rawAddress(rec.a) !== rec.a || !String(rec.a).startsWith('0:')) return null;
    const from = rec.from && T.rawAddress(rec.from) === rec.from ? rec.from : null;
    return { e: rec.e, a: rec.a, from, done: rec.done === true };
  }
  async function epochRead() {
    const store = cloudStore();
    if (!store) return { ok: false, value: null };
    const [err, text] = await tgCall((done) => store.getItem(EPOCH_KEY, done), cloudMs());
    return err ? { ok: false, value: null } : { ok: true, value: readEpoch(text) };
  }
  async function epochWrite(rec) {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const text = JSON.stringify({ e: EPOCH, a: rec.a, from: rec.from || null, done: rec.done === true });
    const [err] = await tgCall((done) => store.setItem(EPOCH_KEY, text, done), cloudMs());
    if (err) throw fail('storage_failed');
    const back = await epochRead();
    if (!back.ok) throw fail('storage_timeout');
    return back.value;
  }
  const archiveRead = () => slotRead(ARCHIVE_KEY);
  const archiveWrite = (text, opts) => slotWrite(ARCHIVE_KEY, text, opts);
  async function cloudRemove(address) {
    const store = cloudStore();
    if (!store) return;
    const record = await cloudRead();
    if (!record.ok || record.address !== address) return;
    await tgCall((done) => store.removeItem(CLOUD_KEY, done));
    await tgCall((done) => store.removeItem(MARKS_KEY, done));
  }
  function readBackup(text) {
    if (!text) return null;
    let backup;
    try { backup = JSON.parse(text); } catch (_) { return null; }
    if (!backup || backup.v !== 1 || typeof backup.iv !== 'string' || typeof backup.ct !== 'string') return null;
    if (backup.d !== undefined && backup.d !== 'bip39') return null;
    const address = T.rawAddress(backup.a);
    return address && address === backup.a ? backup : null;
  }
  function foreignBackup(text) {
    if (!text) return null;
    let backup;
    try { backup = JSON.parse(text); } catch (_) { return null; }
    if (!backup || backup.v !== 1 || backup.d === undefined || backup.d === 'bip39') return null;
    const address = T.rawAddress(backup.a);
    return address && address === backup.a ? address : null;
  }
  const localGet = (key) => {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  };
  const localSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch (_) { }
  };
  let kidMemory = null;
  const knownKid = () => kidMemory || localGet(KID_LOCAL);
  function heardKid(kid) {
    kidMemory = kid;
    localSet(KID_LOCAL, kid);
  }
  const backupCurrent = (backup) => !knownKid() || backup.kid === knownKid();
  const backedUp = (address) => backupRead().then((held) => held.ok && !!held.value && held.value.a === address && backupCurrent(held.value), () => false);
  async function backupRead() {
    const store = cloudStore();
    if (!store) return { ok: false, value: null };
    const [err, text] = await tgCall((done) => store.getItem(BACKUP_KEY, done), cloudMs());
    return err ? { ok: false, value: null } : { ok: true, value: readBackup(text), foreign: foreignBackup(text) };
  }

  async function biometrics() {
    if (!launchOk() || !atLeast('7.2')) return null;
    const manager = CK.tg.app.BiometricManager;
    if (!manager) return null;
    if (!manager.isInited) await tgCall((done) => manager.init(done));
    return manager.isBiometricAvailable ? manager : null;
  }
  async function biometricKeySave(manager, token) {
    if (!manager.isAccessRequested) {
      const [granted] = await tgCall((done) => manager.requestAccess({ reason: CK.t('walletKey.bioAccess') }, done), PROMPT_MS, 'biometric_cancelled');
      if (!granted) throw fail('biometric_denied');
    }
    if (!manager.isAccessGranted) throw fail('biometric_denied');
    const [saved] = await tgCall((done) => manager.updateBiometricToken(token, done), PROMPT_MS, 'biometric_cancelled');
    if (!saved) throw fail('biometric_cancelled');
  }
  async function biometricKeyRead(manager) {
    if (!manager) throw fail('biometric_unknown');
    if (manager.isAccessRequested && !manager.isAccessGranted) throw fail('biometric_denied');
    if (!manager.isBiometricTokenSaved) throw fail('biometric_lost');
    const [ok, token] = await tgCall((done) => manager.authenticate({ reason: CK.t('walletKey.bioSign') }, done), PROMPT_MS, 'biometric_cancelled');
    if (!ok) throw fail('biometric_cancelled');
    if (!token) throw fail('biometric_lost');
    return fromBase64(token);
  }

  function readBlob(text) {
    if (!text) return null;
    let blob;
    try { blob = JSON.parse(text); } catch (_) { return null; }
    if (!blob || blob.v !== 1 || typeof blob.iv !== 'string' || typeof blob.ct !== 'string' || !/^[0-9a-f]{64}$/.test(blob.pk)) return null;
    if (blob.w === 'pass' && !(Number.isInteger(blob.n) && typeof blob.s === 'string' && typeof blob.wiv === 'string' && typeof blob.wk === 'string')) return null;
    if (blob.w === 'keychain' && typeof blob.k !== 'string') return null;
    if (blob.w !== 'bio' && blob.w !== 'pass' && blob.w !== 'keychain') return null;
    if (blob.d !== undefined && blob.d !== 'bip39') return null;
    const address = T.rawAddress(blob.a);
    return address && address.startsWith('0:') && address === blob.a ? blob : null;
  }
  const boundData = (blob) => utf8(`${blob.a}|${blob.pk}`);
  const aesKey = (raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function passwordKey(password, salt, iterations) {
    const base = await crypto.subtle.importKey('raw', utf8(password.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-512', salt, iterations }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  function checkPassword(password) {
    if (typeof password !== 'string' || Array.from(password).length < PASSWORD_MIN) throw fail('password_short');
  }

  async function setupMethod(secureOk) {
    if (!secureOk) return null;
    if (onDevice()) return 'keychain';
    const manager = await biometrics().catch(() => null);
    return manager && !(manager.isAccessRequested && !manager.isAccessGranted) ? 'biometric' : 'password';
  }

  async function sealAndStore(lib, words, publicKey, options) {
    const opts = options || {};
    const first = await secureRead();
    if (!first.ok) throw fail('no_secure_storage');
    const method = opts.keychain ? 'keychain' : opts.password ? 'password' : await setupMethod(true);
    if (method === 'password') checkPassword(opts.password);
    const address = addressOf(lib, publicKey);
    const kind = opts.kind === 'bip39' ? 'bip39' : 'ton';
    const bip39 = kind === 'bip39' || (await passesBip39(lib.mnemonicWordList, words));
    const secretKey = randomBytes(32);
    const blob = { v: 1, a: address, pk: toHex(publicKey), w: { biometric: 'bio', password: 'pass', keychain: 'keychain' }[method] };
    if (bip39) blob.bip39 = true;
    if (kind === 'bip39') blob.d = 'bip39';
    if (opts.typed === true) blob.typed = true;
    if (opts.epoch >= EPOCH) blob.e = opts.epoch;
    try {
      const iv = randomBytes(12);
      const plain = utf8(words.join(' '));
      const sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: boundData(blob) }, await aesKey(secretKey), plain);
      plain.fill(0);
      Object.assign(blob, { iv: toBase64(iv), ct: toBase64(new Uint8Array(sealed)) });
      if (method === 'password') {
        const salt = randomBytes(16);
        const wiv = randomBytes(12);
        const wrap = await passwordKey(opts.password, salt, PBKDF2_ITERATIONS);
        const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: wiv, additionalData: boundData(blob) }, wrap, secretKey);
        Object.assign(blob, { n: PBKDF2_ITERATIONS, s: toBase64(salt), wiv: toBase64(wiv), wk: toBase64(new Uint8Array(wrapped)) });
      } else if (method === 'keychain') {
        blob.k = toBase64(secretKey);
      } else {
        await archiveOffFinger();
        await biometricKeySave(await biometrics(), toBase64(secretKey));
      }
      await secureWrite(JSON.stringify(blob), opts.overKept === true);
    } finally {
      secretKey.fill(0);
    }
    return address;
  }
  async function archiveOffFinger() {
    const arch = await archiveRead();
    if (!arch.ok) throw fail('storage_timeout');
    if (!arch.blob || arch.blob.w !== 'bio') return;
    try {
      await openSealed(arch.blob, undefined, ({ words }) => archiveReseal(words, arch.blob, arch.text));
    } catch (err) {
      if (err.code !== 'biometric_lost') throw err;
    }
  }
  async function archiveReseal(words, old, seen) {
    const blob = { v: 1, a: old.a, pk: old.pk, w: 'keychain' };
    if (old.bip39) blob.bip39 = true;
    if (old.d === 'bip39') blob.d = 'bip39';
    const secretKey = randomBytes(32);
    try {
      const iv = randomBytes(12);
      const plain = utf8(words.join(' '));
      const sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: boundData(blob) }, await aesKey(secretKey), plain);
      plain.fill(0);
      Object.assign(blob, { iv: toBase64(iv), ct: toBase64(new Uint8Array(sealed)), k: toBase64(secretKey) });
    } finally {
      secretKey.fill(0);
    }
    await archiveWrite(JSON.stringify(blob), { expect: seen });
  }

  let passwordAsker = null;
  let protectJob = null;
  function protect(options) {
    if (protectJob) return protectJob;
    protectJob = slotJob(async () => {
      const blob = await currentBlob();
      if (blob.w !== 'keychain' || onDevice()) return status;
      const opts = options || {};
      if ((await setupMethod(true)) === 'password') checkPassword(opts.password);
      await openSealed(blob, undefined, async ({ lib, words, keys, kind }) => {
        if (status.address === blob.a && status.backup !== 'have' && !status.mismatch) {
          await Promise.race([backUp(words, blob.a, false, kind), new Promise((resolve) => setTimeout(resolve, BACKUP_WAIT_MS))]);
        }
        return sealAndStore(lib, words, keys.publicKey, { password: opts.password, epoch: blob.e, typed: blob.typed === true, kind });
      });
      return load();
    }).finally(() => { protectJob = null; });
    return protectJob;
  }
  async function protectFirst(held) {
    const password = passwordAsker ? await passwordAsker() : null;
    if (!password) throw fail('biometric_cancelled', { protect: true });
    if (held && extras.has(held.a)) return { blob: await extraProtect(held, password), password };
    await protect({ password });
    return { blob: await currentBlob(), password };
  }
  let bioJob = null;
  function useBiometrics(on) {
    if (bioJob) return Promise.reject(fail('busy'));
    bioJob = (async () => {
      const blob = await currentBlob();
      if (blob.w === (on ? 'bio' : 'keychain')) return status;
      if (blob.w === 'pass') throw fail('bad_intent');
      if (on) {
        const manager = await biometrics().catch(() => null);
        if (!manager) throw fail('biometric_unknown');
        if (manager.isAccessRequested && !manager.isAccessGranted) throw fail('biometric_denied');
        return protect();
      }
      await slotJob(async () => {
        const held = await currentBlob();
        if (held.ct !== blob.ct) throw fail('busy');
        await openSealed(held, undefined, ({ lib, words, keys, kind }) => sealAndStore(lib, words, keys.publicKey, { keychain: true, epoch: held.e, typed: held.typed === true, kind }));
      });
      return load();
    })().finally(() => { bioJob = null; });
    return bioJob;
  }

  async function withSecret(blob, password, fn) {
    if (extras.has(blob.a)) return withExtraSecret(blob, password, fn);
    if (blob.w !== 'keychain' || onDevice() || (await biometrics().catch(() => null))) return openSealed(blob, password, fn);
    const opened = await protectFirst();
    return openSealed(opened.blob, opened.password, fn);
  }
  const OWNER_KINDS = new Set(['transfer', 'jetton', 'payout', 'p2pJetton']);
  async function confirmOwner(blob, password, reason) {
    if (blob.w !== 'keychain' || onDevice()) return { blob, password };
    if (await fingerOwner(reason)) {
      ownerFresh = { a: blob.a, at: Date.now() };
      return { blob, password };
    }
    return protectFirst(blob);
  }
  async function fingerOwner(reason) {
    const manager = await biometrics().catch(() => null);
    if (!manager || (manager.isAccessRequested && !manager.isAccessGranted)) return false;
    if (!manager.isAccessRequested) await tgCall((done) => manager.requestAccess({ reason: CK.t('walletKey.bioAccess') }, done), PROMPT_MS, 'biometric_cancelled');
    if (!manager.isAccessGranted) return false;
    const [ok] = await tgCall((done) => manager.authenticate({ reason: CK.t(reason || 'walletKey.ownerSend') }, done), PROMPT_MS, 'biometric_cancelled');
    if (ok !== true) throw fail('biometric_cancelled');
    return true;
  }
  async function confirmHeldOwner(held, reason) {
    if (held.w !== 'keychain' || onDevice()) return;
    if (!(await fingerOwner(reason))) throw fail('owner_unconfirmed');
  }
  async function openSealed(blob, password, fn, quiet) {
    const lib = await bundle();
    let key = null, plain = null, keys = null;
    try {
      if (blob.w === 'keychain') {
        key = fromBase64(blob.k);
      } else if (blob.w === 'bio') {
        key = await biometricKeyRead(await biometrics().catch(() => null));
      } else {
        if (typeof password !== 'string' || !password) throw fail('password_needed');
        const wrap = await passwordKey(password, fromBase64(blob.s), blob.n);
        try {
          key = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(blob.wiv), additionalData: boundData(blob) }, wrap, fromBase64(blob.wk)));
        } catch (_) {
          throw fail('wrong_password');
        }
      }
      try {
        plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(blob.iv), additionalData: boundData(blob) }, await aesKey(key), fromBase64(blob.ct)));
      } catch (_) {
        if (blob.w === 'bio') {
          deadToken = blob.a;
          if (!quiet) ensure().catch((err) => console.error(err)).then(tellBackup);
        }
        throw fail(blob.w === 'bio' ? 'biometric_lost' : blob.w === 'pass' ? 'wrong_password' : 'storage_failed');
      }
      const words = new TextDecoder().decode(plain).split(' ');
      const kind = kindOf(blob);
      keys = await keysOf(lib, words, kind);
      if (addressOf(lib, keys.publicKey) !== blob.a || toHex(keys.publicKey) !== blob.pk) throw fail('address_mismatch');
      if (!quiet && status.kind === 'signer' && status.address === blob.a && status.backup === 'none' && !status.mismatch && !status.legacy) backUp(words, blob.a, false, kind);
      if (blob.w !== 'keychain' && (holdShort(blob.a) || (kind === 'bip39' ? !netAltRead(blob.a) : !Object.keys(NET_OWN).every((net) => netOwnRead(net, blob.a))))) altAtUnlock(words, blob.a);
      if (!quiet) directoryAtUnlock(lib, keys, blob);
      if (!quiet) invoiceAtUnlock(lib, keys, blob);
      return await fn({ lib, words, keys, kind });
    } finally {
      if (key) key.fill(0);
      if (plain) plain.fill(0);
      if (keys) keys.secretKey.fill(0);
    }
  }

  const extras = new Map();
  let activeExtra = null;
  let extrasLooked = false;
  let ownerFresh = null;
  let status = { kind: 'unknown', address: null, friendly: '', method: null, setup: null, bioType: null, secure: false, phone: false, oldClient: false, canRestore: false, lost: false, denied: false, bioUnknown: false, mismatch: false, tonOnly: false, phrase: null, typed: false, asked: false, makeFailed: null, backup: 'unknown', backupFailing: false, restoring: false, wordsEntry: false, legacy: false, adoptFor: null, recoverFrom: null, moveFrom: null, moveMethod: null, oldElsewhere: false, why: null, retrying: false, moving: null };
  const BLANK_STATUS = Object.freeze({ ...status });
  let loadRun = 0, shownRun = 0;
  let hadAtLaunch = null;
  let makeFailed = null;
  const METHODS = { bio: 'biometric', pass: 'password', keychain: 'keychain' };
  async function load() {
    const run = ++loadRun;
    await sdkReady;
    await CK.tg.whenInitData();
    const inside = !!CK.tg.app;
    const verified = inside ? await verifyLaunch() : null;
    if (inside && verified !== 'ok') {
      const next = { ...BLANK_STATUS, kind: verified === 'foreign' ? 'foreign' : 'unknown', why: verified === 'foreign' ? 'foreign' : 'launch', phone: onPhone(), retrying: !!retryTimer };
      if (run > shownRun) {
        shownRun = run;
        status = next;
        T.setWallet(null);
      }
      return next;
    }
    const phone = onPhone();
    const device = onDevice();
    const keeps = phone || device;
    const oldClient = inside && !secureStore();
    const [secure, cloud, held, epoch, archive] = inside
      ? await Promise.all([
        secureRead().catch(() => null), cloudRead().catch(() => ({ ok: false, address: null })), backupRead().catch(() => ({ ok: false, value: null })),
        epochRead().catch(() => ({ ok: false, value: null })), archiveRead().catch(() => ({ ok: false, text: null, blob: null }))
      ])
      : [{ ok: false, value: null, canRestore: false }, { ok: false, address: null }, { ok: false, value: null }, { ok: false, value: null }, { ok: false, text: null, blob: null }];
    const blob = readBlob(secure && secure.value);
    const stampedHere = !!blob && blob.e >= EPOCH;
    const backupWallet = held.ok && held.value ? held.value.a : null;
    const recoverFrom = backupWallet && !!epoch.value
      && ((epoch.value.from === backupWallet && epoch.value.a !== backupWallet) || (epoch.value.a === backupWallet && stampedHere && blob.a !== backupWallet)) ? backupWallet : null;
    if (stampedHere && !recoverFrom && cloud.ok && cloud.address && cloud.address !== blob.a && archive.blob && archive.blob.a === cloud.address && backupWallet !== cloud.address) {
      cloudWrite(blob.a).catch(() => false);
      cloud.address = blob.a;
    }
    if (stampedHere && epoch.ok && !epoch.value && cloud.ok && (cloud.address === blob.a || !cloud.address)) {
      epoch.value = { e: EPOCH, a: blob.a, from: archive.blob && archive.blob.a !== blob.a ? archive.blob.a : null, done: false };
      epochWrite(epoch.value).catch(() => null);
    }
    let kind = 'none', address = null;
    if (blob) {
      kind = 'signer';
      address = blob.a;
      if (cloud.ok && !cloud.address) cloudWrite(address).catch(() => false);
    } else if (cloud.address) {
      kind = 'readonly';
      address = cloud.address;
    } else if (held.ok && held.value) {
      kind = 'readonly';
      address = held.value.a;
    } else if (inside ? (!cloud.ok && !!cloudStore()) || (keeps && !oldClient && !(secure && secure.ok)) : CK.tg.inside) {
      kind = 'unknown';
    }
    if (hadAtLaunch === null && inside && kind !== 'unknown') {
      hadAtLaunch = !!(blob || (cloud.ok && cloud.address) || (held.ok && held.value) || archive.blob || (epoch.ok && epoch.value));
    }
    const manager = secure && secure.ok && !device ? await biometrics().catch(() => null) : null;
    const marks = blob && blob.w === 'keychain' ? await marksOf(blob.a, cloud.ok) : null;
    const lost = !!blob && blob.w === 'bio' && (deadToken === blob.a || (!!manager && !manager.isBiometricTokenSaved));
    const noSecretHere = keeps && !!(secure && secure.ok) && !!address && (kind === 'readonly' || (lost && blob.a === cloud.address));
    const backup = !held.ok ? 'unknown' : held.value && held.value.a === address && backupCurrent(held.value) ? 'have' : held.value && !blob ? 'other' : 'none';
    const mismatch = !!(blob && cloud.address && cloud.address !== blob.a);
    const next = {
      kind,
      address,
      friendly: address ? T.friendlyAddress(address) : '',
      method: blob ? METHODS[blob.w] : null,
      setup: await setupMethod(!!(secure && secure.ok)),
      bioType: manager ? (manager.biometricType === 'face' || manager.biometricType === 'finger' ? manager.biometricType : 'unknown') : null,
      secure: !!(secure && secure.ok),
      phone,
      oldClient,
      asked: !!marks && marks.asked,
      backup,
      backupFailing: false,
      restoring: noSecretHere && backup === 'have' && (restoreTriedFor !== address || !!restoreJob),
      wordsEntry: noSecretHere && (backup === 'none' || backup === 'other' || (backup === 'have' && brokenBackupOf === address)),
      makeFailed: blob || address ? null : makeFailed,
      canRestore: !blob && !!(secure && secure.canRestore),
      lost,
      bioUnknown: !!blob && blob.w === 'bio' && !manager,
      denied: !!blob && blob.w === 'bio' && !!manager && manager.isAccessRequested && !manager.isAccessGranted,
      mismatch,
      tonOnly: false,
      phrase: blob ? kindOf(blob) : null,
      typed: !!blob && blob.typed === true
    };
    const stampedFor = (a) => (stampedHere && blob.a === a) || (!!epoch.value && epoch.value.a === a);
    next.legacy = !!address && epoch.ok && !stampedFor(address);
    next.replacedElsewhere = !!epoch.value && epoch.value.from === address && epoch.value.a !== address;
    next.adoptFor = !!blob && !stampedHere && !!epoch.value && epoch.value.from === blob.a && epoch.value.a !== blob.a ? epoch.value.a : null;
    next.recoverFrom = recoverFrom;
    next.moveFrom = kind === 'signer' && (stampedHere || (!!epoch.value && epoch.value.a === blob.a)) && archive.blob && archive.blob.a !== blob.a ? archive.blob.a : null;
    next.moveMethod = next.moveFrom ? METHODS[archive.blob.w] : null;
    next.moveTyped = !!next.moveFrom && blob.typed === true;
    next.oldElsewhere = !next.moveFrom && !!address && !next.adoptFor && !next.wordsEntry
      && !!epoch.value && epoch.value.a === address && !!epoch.value.from && !epoch.value.done;
    next.why = kind === 'unknown' || next.makeFailed ? whyNot(inside, keeps, secure, cloud, next) : null;
    next.retrying = !!retryTimer;
    next.moving = next.moveFrom && oldSeen && oldSeen.a === next.moveFrom ? oldSeen : null;
    next.backupFailing = backupStuck(next, backupFails(address));
    if (device && blob && blob.w === 'keychain' && backup === 'have') deviceBackedUp();
    if (!extrasLooked && launchOk() && activeLocal()) await extrasLook(address).catch(() => null);
    if (run > shownRun) {
      shownRun = run;
      status = next;
      showWallet(address, kind);
    }
    return next;
  }
  let createJob = null;
  const refresh = () => (createJob ? createJob.catch(() => null).then(load) : load());

  async function currentBlob() {
    await sdkReady;
    const read = await secureRead();
    const blob = read.ok ? readBlob(read.value) : null;
    if (!blob) throw fail('no_secret');
    return blob;
  }
  async function activeBlob(expected) {
    const entry = activeExtra ? extras.get(activeExtra) : null;
    if (activeExtra && (!entry || !entry.here)) throw fail(expected && expected !== activeExtra ? 'wallet_changed' : 'no_secret');
    let blob;
    if (entry) {
      await sdkReady;
      const slot = await slotRead(entry.key);
      blob = slot.ok && slot.blob && slot.blob.a === entry.a ? slot.blob : null;
      if (!blob) throw fail('no_secret');
    } else {
      blob = await currentBlob();
    }
    if (expected && expected !== blob.a) throw fail('wallet_changed');
    return blob;
  }
  const activeIs = (address) => (activeExtra ? activeExtra === address : !extras.has(address));
  function stillActive(blob) {
    if (!activeIs(blob.a)) throw fail('wallet_changed');
  }

  let marksCache = null;
  const backupSubs = new Set();
  const tellBackup = () => backupSubs.forEach((fn) => {
    try { fn(); } catch (err) { console.error(err); }
  });
  function marksLocal(address) {
    try { return JSON.parse(localStorage.getItem(MARKS_LOCAL + address) || 'null'); } catch (_) { return null; }
  }
  async function marksOf(address, cloudOk) {
    if (marksCache && marksCache.a === address) return marksCache;
    const local = marksLocal(address) || {};
    let saved = {}, known = cloudOk;
    if (cloudOk) {
      try {
        const [err, value] = await tgCall((done) => cloudStore().getItem(MARKS_KEY, done));
        if (err) known = false;
        else {
          const record = value ? JSON.parse(value) : null;
          if (record && record.a === address) saved = record;
        }
      } catch (_) {
        known = false;
      }
    }
    const marks = { a: address, asked: !!(local.asked || saved.asked) };
    if (known) marksCache = marks;
    return known ? marks : { ...marks, asked: true };
  }
  function writeMarks(address, asked) {
    marksCache = { a: address, asked };
    const text = JSON.stringify(marksCache);
    try { localStorage.setItem(MARKS_LOCAL + address, text); } catch (_) { }
    const store = cloudStore();
    if (store) tgCall((done) => store.setItem(MARKS_KEY, text, done)).catch(() => null);
  }
  function markAsked() {
    if (!status.address || status.method !== 'keychain') return;
    writeMarks(status.address, true);
    status = { ...status, asked: true };
    tellBackup();
  }

  const backupBound = (address, user) => utf8(`v1|${address}|${user}`);
  function backupFails(address) {
    try { return Number(localStorage.getItem(BACKUP_FAILS_LOCAL + address)) || 0; } catch (_) { return 0; }
  }
  function backupStuck(s, fails) {
    if (!s.address || s.backup === 'have' || s.legacy) return false;
    if (fails >= (onDevice() && s.method === 'keychain' ? 1 : BACKUP_FAILING_AFTER)) return true;
    return s.kind === 'signer' && s.backup === 'none' && (s.method !== 'keychain' || s.mismatch);
  }
  function noteBackup(address, written) {
    const fails = written ? 0 : backupFails(address) + 1;
    try {
      if (written) localStorage.removeItem(BACKUP_FAILS_LOCAL + address);
      else localStorage.setItem(BACKUP_FAILS_LOCAL + address, String(fails));
    } catch (_) { }
    if (written) deviceBackedUp();
    if (status.address !== address) return;
    const next = { ...status, backup: written ? 'have' : status.backup };
    status = { ...next, backupFailing: backupStuck(next, fails) };
    tellBackup();
  }
  function deviceBackedUp() {
    const store = onDevice() ? deviceStore() : null;
    if (store && typeof store.markBackedUp === 'function') store.markBackedUp().catch(() => null);
  }
  async function askBackupKey(sealedUnder) {
    await T.config();
    const asked = typeof sealedUnder === 'string' && KID_FORMAT.test(sealedUnder) ? sealedUnder : null;
    const answer = await T.api(`wallet/backup-key${asked ? `?kid=${asked}` : ''}`, { body: {} });
    const raw = fromBase64(answer.key);
    try {
      if (raw.length !== 32 || !Number.isSafeInteger(answer.user) || !KID_FORMAT.test(answer.kid)) throw fail('backup_refused');
      if (!asked) heardKid(answer.kid);
      return { key: await aesKey(raw), user: answer.user, kid: answer.kid };
    } finally {
      raw.fill(0);
    }
  }
  async function kidChanged() {
    if (Date.now() - (Number(localGet(KID_AT_LOCAL)) || 0) < KID_CHECK_MS) return false;
    await T.config();
    const answer = await T.api('wallet/backup-kid');
    if (!KID_FORMAT.test(answer.kid)) return false;
    localSet(KID_AT_LOCAL, String(Date.now()));
    const before = knownKid();
    heardKid(answer.kid);
    return before !== answer.kid;
  }
  const BACKUP_ASIDE_PREFIX = 'ck_wallet_cloud_old_';
  async function backupAside(store, other) {
    const [err, text] = await tgCall((done) => store.getItem(BACKUP_KEY, done), cloudMs());
    const backup = err ? null : readBackup(text);
    const a = backup ? backup.a : err ? null : foreignBackup(text);
    if (!a || a !== other) throw fail('storage_timeout');
    const key = BACKUP_ASIDE_PREFIX + other.slice(2);
    const [wrote] = await tgCall((done) => store.setItem(key, text, done), cloudMs());
    if (wrote) throw fail('storage_failed');
    const [readErr, back] = await tgCall((done) => store.getItem(key, done), cloudMs());
    if (readErr || back !== text) throw fail('storage_failed');
  }
  async function backupText(words, address, { key, user, kid, kind }) {
    const iv = randomBytes(12);
    const plain = utf8(words.join(' '));
    let sealed;
    try {
      sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: backupBound(address, user) }, key, plain);
    } finally {
      plain.fill(0);
    }
    const out = { v: 1, a: address, kid, iv: toBase64(iv), ct: toBase64(new Uint8Array(sealed)) };
    if (kind === 'bip39') out.d = 'bip39';
    return JSON.stringify(out);
  }
  async function backupKeys(lib, words, address, backup) {
    const first = kindOf(backup);
    for (const kind of [first, first === 'ton' ? 'bip39' : 'ton']) {
      if (kind === 'bip39' && !(await passesBip39(lib.mnemonicWordList, words))) continue;
      const keys = await keysOf(lib, words, kind);
      if (addressOf(lib, keys.publicKey) === address) return { keys, kind };
      keys.secretKey.fill(0);
    }
    return null;
  }
  const CANNOT_OPEN = new Set(['password_needed', 'wrong_password', 'biometric_lost', 'biometric_cancelled', 'biometric_denied', 'biometric_unknown', 'address_mismatch']);
  async function backupKeep(blob, keyOf) {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const slot = BACKUP_ASIDE_PREFIX + blob.a.slice(2);
    const [err, have] = await tgCall((done) => store.getItem(slot, done), cloudMs());
    if (err) throw fail('storage_timeout');
    const held = readBackup(have);
    if (held && held.a === blob.a) return true;
    if (have) throw fail('backup_other');
    let keyAsked = false;
    let text;
    try {
      text = await openSealed(blob, undefined, async ({ words, kind }) => {
        keyAsked = true;
        return backupText(words, blob.a, { ...(await keyOf(words)), kind });
      }, true);
    } catch (e) {
      if (!keyAsked && e && CANNOT_OPEN.has(e.code)) return false;
      throw e;
    }
    const [wrote] = await tgCall((done) => store.setItem(slot, text, done), cloudMs());
    if (wrote) throw fail('storage_failed');
    const [readErr, back] = await tgCall((done) => store.getItem(slot, done), cloudMs());
    if (readErr || back !== text) throw fail('storage_failed');
    return true;
  }
  async function writeBackup(words, address, displace, kind) {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [record, held] = await Promise.all([cloudRead(), backupRead()]);
    if (!record.ok || !held.ok || record.address !== address) throw fail('storage_timeout');
    if (held.value && held.value.a !== address) {
      if (!displace) throw fail('backup_other');
      await backupAside(store, held.value.a);
    }
    if (held.foreign) {
      if (!displace) throw fail('backup_other');
      await backupAside(store, held.foreign);
    }
    if (held.value && held.value.a === address && backupCurrent(held.value)) return;
    if (held.value || backupFails(address) > 0) {
      const [probeErr] = await tgCall((done) => store.setItem(PROBE_KEY, '1', done));
      tgCall((done) => store.removeItem(PROBE_KEY, done)).catch(() => null);
      if (probeErr) throw fail('storage_failed');
    }
    const text = await backupText(words, address, { ...(await askBackupKey()), kind });
    const [wrote] = await tgCall((done) => store.setItem(BACKUP_KEY, text, done));
    if (wrote) throw fail('storage_failed');
    const [readErr, back] = await tgCall((done) => store.getItem(BACKUP_KEY, done));
    if (readErr || back !== text) throw fail('storage_failed');
  }
  let backupJob = null;
  function backUp(words, address, displace, kind) {
    if (backupJob) return backupJob;
    if (status.legacy && status.address === address) return Promise.resolve();
    const own = words.slice();
    backupJob = writeBackup(own, address, displace === true, kind).then(() => noteBackup(address, true), (err) => {
      console.warn('wallet backup: try again later', err && (err.code || err.message));
      noteBackup(address, false);
    }).finally(() => {
      own.fill('');
      backupJob = null;
    });
    return backupJob;
  }

  let restoreJob = null, restoreTriedFor = null, brokenBackupOf = null, deadToken = null;
  async function bringBack(address, keepText, keyOf) {
    const held = await backupRead();
    if (!held.ok || !held.value || held.value.a !== address) return;
    const before = await slotRead(SECRET_KEY);
    if (!before.ok) throw fail('storage_timeout');
    const main = before.kept ? await slotRestore(SECRET_KEY) : before;
    if (before.kept && main.blob && main.blob.a === address) return;
    if (main.text && main.text !== keepText && !(main.blob && main.blob.a === address)) {
      const arch = await archiveRead();
      if (!arch.ok) throw fail('storage_timeout');
      if (arch.text !== main.text) throw fail('wallet_exists');
    }
    const lib = await bundle();
    let keyJob = null;
    const keyOfHere = keyOf || (() => keyJob || (keyJob = askBackupKey()));
    const keep = keepText ? readBlob(keepText) : null;
    if (keep) await backupKeep(keep, keyOfHere);
    let { key, user, kid } = await keyOfHere();
    if (KID_FORMAT.test(held.value.kid || '') && held.value.kid !== kid) ({ key, user, kid } = await askBackupKey(held.value.kid));
    let plain = null, keys = null;
    try {
      try {
        plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(held.value.iv), additionalData: backupBound(address, user) }, key, fromBase64(held.value.ct)));
      } catch (_) {
        brokenBackupOf = address;
        return;
      }
      const words = new TextDecoder().decode(plain).split(' ');
      const opened = await backupKeys(lib, words, address, held.value);
      if (!opened) {
        words.fill('');
        brokenBackupOf = address;
        return;
      }
      keys = opened.keys;
      if (keepText) await archiveKeep(keepText);
      await sealAndStore(lib, words, keys.publicKey, { keychain: true, epoch: EPOCH, kind: opened.kind, typed: opened.kind === 'bip39' });
      deriveOthers(words, address);
      words.fill('');
    } finally {
      if (plain) plain.fill(0);
      if (keys) keys.secretKey.fill(0);
    }
    deadToken = null;
    writeMarks(address, false);
    orderScanJob = scanOrderWallets().then((rows) => rows.filter((row) => row.funds), () => null);
  }
  function restoreFromBackup(address, keepText) {
    restoreTriedFor = address;
    restoreJob = slotJob(() => bringBack(address, keepText)).catch((err) => {
      console.warn('wallet restore: try again later', err && (err.code || err.message));
    }).then(() => {
      restoreJob = null;
      return load();
    }).finally(tellBackup);
    return restoreJob;
  }

  async function makeWallet() {
    const now = await load();
    if (now.kind === 'unknown') throw fail('storage_timeout');
    if (now.kind !== 'none' || (now.canRestore && !keptGivenUp())) throw fail('wallet_exists');
    if (!now.secure) throw fail('no_secure_storage');
    const lib = await bundle();
    const words = await newWords(lib);
    const keys = await keysOf(lib, words, 'ton');
    const address = addressOf(lib, keys.publicKey);
    const sealed = () => sealAndStore(lib, words, keys.publicKey, { keychain: true, epoch: EPOCH, overKept: keptGivenUp() });
    const takeBack = async () => {
      const held = await secureRead().catch(() => null);
      const blob = held && held.ok ? readBlob(held.value) : null;
      if (blob && blob.a === address) await secureRemove().catch(() => null);
    };
    try {
      const [secure, cloud, onAccount, epoch] = await Promise.all([secureRead(), cloudRead(), backupRead(), epochRead()]);
      if (!secure.ok || !cloud.ok || !onAccount.ok || !epoch.ok) throw fail('storage_timeout');
      if (secure.value || (secure.canRestore && !keptGivenUp()) || cloud.address || onAccount.value || epoch.value) throw fail('wallet_exists');
      try {
        await sealed();
      } catch (err) {
        await takeBack();
        throw err;
      }
      const wrote = await cloudWrite(address).catch(() => null);
      if (wrote) await new Promise((resolve) => setTimeout(resolve, RECORD_SETTLE_MS));
      const back = wrote === null ? { ok: false, address: null } : await cloudRead().catch(() => ({ ok: false, address: null }));
      if (wrote !== null && back.ok && back.address && back.address !== address) {
        await takeBack();
        throw fail('wallet_exists');
      }
      const held = await secureRead();
      const blob = held.ok ? readBlob(held.value) : null;
      if (!blob || (back.address === address && blob.a !== address)) {
        await sealed().catch(async (err) => {
          await cloudRemove(address).catch(() => null);
          throw err;
        });
      }
      await epochWrite({ a: address, from: null }).catch(() => null);
      backUp(words, address);
      deriveOthers(words, address);
    } finally {
      words.fill('');
      keys.secretKey.fill(0);
    }
    makeFailed = null;
    await load();
    return T.wallet;
  }
  function create() {
    if (createJob) return createJob;
    createJob = slotJob(async () => {
      await requireLaunch();
      if (status.canRestore && !keptGivenUp()) {
        if (await takeKept()) {
          await load();
          return T.wallet;
        }
        giveUpKept();
      }
      return makeWallet();
    }).finally(() => { createJob = null; });
    return createJob;
  }
  let keptRefusedHere = 0;
  const keptRefusals = () => Math.max(keptRefusedHere, Number(localGet(KEPT_REFUSED_LOCAL)) || 0);
  const keptGivenUp = () => keptRefusals() >= KEPT_ASKS;
  function giveUpKept() {
    keptRefusedHere = KEPT_ASKS;
    localSet(KEPT_REFUSED_LOCAL, String(KEPT_ASKS));
  }
  async function takeKept() {
    let unreadable = false;
    try {
      const [err, value] = await tgCall((done) => secureStore().restoreItem(SECRET_KEY, done), PROMPT_MS);
      const blob = err ? null : readBlob(value);
      if (blob) {
        await cloudWrite(blob.a).catch(() => false);
        return true;
      }
      unreadable = !err && !!value;
    } catch (_) { }
    keptRefusedHere = unreadable ? KEPT_ASKS : keptRefusals() + 1;
    localSet(KEPT_REFUSED_LOCAL, String(keptRefusedHere));
    return false;
  }
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function archiveKeep(text) {
    const arch = await slotRestore(ARCHIVE_KEY);
    if (arch.text === text) return;
    if (arch.text) throw fail('archive_busy');
    await archiveWrite(text, { expect: null });
  }
  async function setAside(incoming) {
    const main = await slotRestore(SECRET_KEY);
    const arch = await slotRestore(ARCHIVE_KEY);
    if (!main.text) return;
    const blob = main.blob;
    if (!blob) throw fail('wallet_exists');
    if (arch.text === main.text) return;
    if (arch.text && !(arch.blob && (arch.blob.a === incoming || arch.blob.a === blob.a))) throw fail('archive_busy');
    await archiveWrite(main.text, { expect: arch.text });
  }
  async function adoptLegacy(address) {
    const [cloud, epoch] = await Promise.all([cloudRead(), epochRead()]);
    if (!cloud.ok || !epoch.ok) throw fail('storage_timeout');
    if (cloud.address !== address || epoch.value) return;
    await epochWrite({ a: address, from: null });
  }
  async function settleSwap() {
    const [main, arch, swap] = await Promise.all([slotRead(SECRET_KEY), archiveRead(), slotRead(SWAP_KEY)]);
    if (!main.ok || !arch.ok || !swap.ok) throw fail('storage_timeout');
    if (!swap.text) return;
    if (swap.text !== main.text && swap.text !== arch.text) {
      if (arch.text && arch.text !== main.text) throw fail('archive_busy');
      await archiveWrite(swap.text, { expect: arch.text });
    }
    await slotRemove(SWAP_KEY);
  }
  let recoverJob = null;
  function recoverOld(target) {
    if (recoverJob) return recoverJob;
    recoverJob = slotJob(async () => {
      for (const key of [SECRET_KEY, ARCHIVE_KEY, SWAP_KEY]) await slotRestore(key);
      await settleSwap();
      const [main, arch, cloud, epoch, backup] = await Promise.all([slotRead(SECRET_KEY), archiveRead(), cloudRead(), epochRead(), backupRead()]);
      if (!main.ok || !arch.ok || !cloud.ok || !epoch.ok || !backup.ok) throw fail('storage_timeout');
      if (!backup.value || backup.value.a !== target) return;
      const current = main.blob;
      if (main.text && !current) throw fail('wallet_exists');
      const aside = current && current.a !== target ? current : null;
      const oldText = arch.blob && arch.blob.a === target ? arch.text : null;
      let keyJob = null;
      const keyOf = () => keyJob || (keyJob = askBackupKey());
      if (aside) {
        if (arch.text && !oldText && !(arch.blob && arch.blob.a === aside.a)) throw fail('archive_busy');
        await backupKeep(aside, keyOf);
        if (oldText) {
          await slotWrite(SWAP_KEY, oldText, { expect: null });
          await archiveWrite(main.text, { expect: oldText });
          await slotWrite(SECRET_KEY, oldText, { expect: main.text });
          await slotRemove(SWAP_KEY);
        } else {
          if (arch.text && arch.text !== main.text) throw fail('archive_busy');
          if (!arch.text) await archiveWrite(main.text, { expect: null });
          await bringBack(target, null, keyOf);
        }
      } else if (!current) {
        if (oldText) await slotWrite(SECRET_KEY, oldText, { expect: null });
        else await bringBack(target, null, keyOf);
      }
      const now = await secureRead();
      const back = now.ok ? readBlob(now.value) : null;
      if (!back || back.a !== target) throw fail('storage_timeout');
      if (!(await cloudWrite(target).catch(() => false))) throw fail('storage_timeout');
      const named = !!epoch.value && epoch.value.a === target;
      const from = aside ? aside.a : !epoch.value ? null : named ? epoch.value.from || null : epoch.value.a;
      if (!(named && (epoch.value.from || null) === from)) await epochWrite({ a: target, from, done: false });
      deadToken = null;
      makeFailed = null;
    }).finally(() => { recoverJob = null; });
    return recoverJob;
  }

  let oldSeen = null, oldCheckJob = null;
  const holds = (native, tokens) => {
    const units = T.parseUnits(String(native));
    if (units === null) throw fail('balance_unknown');
    return units > 0n || (Array.isArray(tokens) && tokens.some((one) => one && (T.parseUnits(String(one.units)) || 0n) > 0n));
  };
  const NET_READS = {
    evm: (a) => T.api('xchain/balances?evm=' + encodeURIComponent(a)).then((body) => (Array.isArray(body.chains) ? body.chains : []).some((row) => {
      if (!row) throw fail('balance_unknown');
      return holds(row.native, row.tokens);
    })),
    sol: (a) => T.api('xchain/sol/balances?owner=' + encodeURIComponent(a)).then((body) => holds(body.lamports, body.tokens)),
    tron: (a) => T.api('xchain/tron/balances?owner=' + encodeURIComponent(a)).then((body) => holds(body.sun, body.tokens))
  };
  const oldNetAddress = (net, a) => (net === 'evm' ? evmOwnRead(a) : netOwnRead(net, a));
  async function oldHoldings(lib, old, options) {
    const strict = !!(options && options.strict);
    await T.config();
    const main = await chainState(old.a);
    const jettons = (await tokenRows(old.a)).filter((row) => !row.native && row.token !== 'ton' && (T.parseUnits(String(row.units)) || 0n) > 0n);
    const pk = publicKeyOf(old);
    const wallets = subwalletList().map((subwallet) => ({ subwallet, address: orderWalletOf(lib, pk, subwallet) }));
    let rows;
    try {
      rows = await readOrderWallets(wallets);
    } catch (_) {
      throw fail('state_unknown');
    }
    const orders = [];
    wallets.forEach((one) => {
      const row = rows.get(one.address);
      if (!row || !Number.isInteger(row.seqno) || row.seqno < 0) throw fail('state_unknown');
      const balance = T.parseUnits(String(row.balance)) || 0n;
      const held = (Array.isArray(row.jettons) ? row.jettons : []).map((j) => ({ token: T.rawAddress(j.token), wallet: T.rawAddress(j.wallet), units: T.parseUnits(String(j.units)) || 0n })).filter((j) => j.token && j.units > 0n);
      if (held.length || balance > MOVE_DUST_NANO) orders.push({ ...one, balance, seqno: row.seqno, status: row.status, busy: !!row.busy, jettons: held });
    });
    const nets = [], unknown = [];
    {
      for (const net of Object.keys(NET_READS)) {
        const at = oldNetAddress(net, old.a);
        if (!at && old.bip39 !== true && !strict) continue;
        const has = at ? await NET_READS[net](at).catch(() => null) : null;
        if (has === null) unknown.push(net);
        else if (has) nets.push(net);
      }
    }
    const pending = !!pendingAgainst(old.a, main);
    const gram = main.balance || 0n;
    const any = gram > MOVE_DUST_NANO || jettons.length > 0 || orders.length > 0 || nets.length > 0;
    return { a: old.a, main, gram, jettons, orders, nets, unknown, pending, frozen: main.status === 'frozen', any, empty: !any && !unknown.length && !pending };
  }
  async function forgetOld(old) {
    const arch = await archiveRead();
    if (!arch.ok || !arch.blob || arch.blob.a !== old.a) return;
    pendingClear(old.a);
    const epoch = await epochRead().catch(() => ({ ok: false }));
    if (epoch.ok && epoch.value && epoch.value.from === old.a && !epoch.value.done) await epochWrite({ ...epoch.value, done: true }).catch(() => null);
  }
  function checkOld(from) {
    if (oldCheckJob) return oldCheckJob;
    oldCheckJob = (async () => {
      const arch = await archiveRead();
      if (!arch.ok || !arch.blob || arch.blob.a !== from) return null;
      const seen = await oldHoldings(await bundle(), arch.blob);
      oldSeen = seen;
      if (seen.empty) await forgetOld(arch.blob);
      await load();
      tellBackup();
      return seen;
    })().catch((err) => {
      console.warn('wallet move: looked at again on the next launch', err && (err.code || err.message));
      return null;
    }).finally(() => { oldCheckJob = null; });
    return oldCheckJob;
  }

  function moveTonPlan(lib, old, to, seen, left, room) {
    const returns = [];
    seen.orders.forEach((row) => {
      if (row.status === 'frozen' || row.busy || pendingAgainst(row.address, row)) {
        left.push({ what: 'orders', why: row.busy ? 'pending' : 'frozen' });
        return;
      }
      const tokens = row.jettons.slice(0, RETURN_TOKENS_MAX).map((j) => {
        const known = CK.swapAudit.orderOffer(j.token);
        const from = known ? CK.swapAudit.provenWalletOf(lib, j.token, row.address) : CK.swapAudit.auditReturn(lib, j.wallet, { owner: old.a, orderWallet: row.address, offer: j.token });
        return from ? { ...j, from, known, gas: known ? CK.swapAudit.returnGas(j.token) : null } : null;
      });
      if (tokens.some((one) => !one)) left.push({ what: 'orders', why: 'token' });
      const sure = tokens.filter(Boolean);
      const needs = !sure.length ? 1n : sure.reduce((sum, one) => sum + returnGasOf(one), RETURN_FEE_ROOM);
      const topup = row.balance < needs ? needs - row.balance + RETURN_TOPUP_ROOM : 0n;
      returns.push({ ...row, tokens: sure, needs, topup });
    });
    const jettons = seen.jettons.slice(0, MOVE_JETTONS_MAX).map((row) => {
      const token = T.rawAddress(row.token);
      const known = Boolean(token && CK.swapAudit.orderOffer(token));
      const from = known ? CK.swapAudit.provenWalletOf(lib, token, old.a) : T.rawAddress(row.wallet);
      return from ? { what: row.symbol || '?', from, units: T.parseUnits(String(row.units)), known } : null;
    }).filter(Boolean);
    seen.jettons.slice(MOVE_JETTONS_MAX).forEach((row) => left.push({ what: row.symbol || '?', why: 'later' }));
    let gram = seen.gram;
    const cost = () => returns.reduce((sum, r) => sum + r.topup, 0n) + BigInt(jettons.length) * JETTON_GAS_NANO + GAS_NANO;
    const extra = !seen.frozen && !seen.pending && typeof room === 'bigint' && room > 0n ? room : 0n;
    const short = () => (gram < cost() ? cost() - gram + MOVE_TOPUP_ROOM : 0n);
    while (short() > MOVE_TOPUP_ROOM && jettons.some((j) => !j.known)) {
      const dropped = jettons.splice(jettons.findLastIndex((j) => !j.known), 1)[0];
      left.push({ what: dropped.what, why: 'gas' });
    }
    while ((jettons.length || returns.some((r) => r.topup)) && short() > extra + MOVE_TOPUP_ROOM) {
      const dropped = jettons.length ? jettons.pop() : returns.splice(returns.findIndex((r) => r.topup > 0n), 1)[0];
      left.push({ what: dropped.what || 'orders', why: 'gas' });
    }
    const first = jettons.length > 0 || returns.some((r) => r.topup > 0n);
    const topup = first ? short() : 0n;
    const needs = first ? cost() : 0n;
    if (first) gram += topup - cost();
    const sweep = !seen.frozen && !seen.pending && gram > MOVE_DUST_NANO && !left.length;
    return { returns, jettons, first, sweep, topup, needs };
  }
  async function topupRoom(blob, old) {
    const none = { room: 0n, chain: null };
    if (!(blob.w === 'keychain' || (blob.w === 'bio' && old.w === 'keychain'))) return none;
    const chain = await chainState(blob.a).catch(() => null);
    if (!chain || chain.status === 'frozen' || chain.balance === null || pendingAgainst(blob.a, chain)) return none;
    const spare = chain.balance - GAS_NANO - SWAP_RESERVE_NANO;
    const room = (spare < MOVE_TOPUP_MAX ? spare : MOVE_TOPUP_MAX) - MOVE_TOPUP_ROOM;
    return room > 0n ? { room, chain } : none;
  }
  function signTonMove(lib, keys, old, to, seen, plan, validUntil = nowSeconds() + MOVE_VALID_S) {
    const toCell = lib.Address.parseRaw(to);
    const jettonTo = (from, units, value) => lib.internal({ to: lib.Address.parseRaw(from), value, bounce: true, body: bodyOf(lib, { kind: 'jetton', units, recipient: to, owner: to }) });
    let seqno = seen.main.seqno;
    const out = { first: null, returns: [], sweep: null, validUntil };
    if (plan.first) {
      const messages = [
        ...plan.returns.filter((r) => r.topup > 0n).map((r) => lib.internal({ to: lib.Address.parseRaw(r.address), value: r.topup, bounce: false })),
        ...plan.jettons.map((j) => jettonTo(j.from, j.units, JETTON_GAS_NANO))
      ];
      out.first = { seqno, boc: externalOf(lib, keys, undefined, SEND_MODE, messages, seen.main, validUntil) };
      seqno += 1;
    }
    plan.returns.forEach((r) => {
      let messages, mode = SEND_MODE;
      if (!r.tokens.length) {
        messages = [lib.internal({ to: toCell, value: 0n, bounce: false })];
        mode = SWEEP_MODE;
      } else if (r.tokens.length === 1 && r.tokens[0].known) {
        messages = [jettonTo(r.tokens[0].from, r.tokens[0].units, 0n)];
        mode = SWEEP_MODE;
      } else {
        messages = r.tokens.map((one) => jettonTo(one.from, one.units, returnGasOf(one)));
        const rest = r.balance + r.topup - r.needs - RETURN_TOPUP_ROOM;
        if (r.tokens.every((one) => one.known) && rest > RETURN_FEE_ROOM) messages.push(lib.internal({ to: toCell, value: rest, bounce: false }));
      }
      out.returns.push({ ...r, boc: externalOf(lib, keys, r.subwallet, mode, messages, { seqno: r.seqno, status: r.status }, validUntil) });
    });
    if (plan.sweep) {
      out.sweep = { seqno, boc: externalOf(lib, keys, undefined, SWEEP_MODE, [lib.internal({ to: toCell, value: 0n, bounce: false })], plan.first ? { seqno, status: 'active' } : seen.main, validUntil) };
    }
    return out;
  }
  async function seqnoPassed(address, seqno, until) {
    while (Date.now() < until) {
      const chain = await chainState(address).catch(() => null);
      if (chain && chain.seqno > seqno) return true;
      await pause(GAS_POLL_MS);
    }
    return false;
  }
  async function oldNetsFrom(words, old) {
    if (!multiNet((await bundle()).mnemonicWordList, words)) return;
    for (const name of Object.keys(NET_API)) {
      try {
        const api = netApi(name);
        const derived = await api.deriveAddress(await api.bundle(), words);
        if (name === 'evm') evmOwnWrite(old.a, derived);
        else netOwnWrite(name, old.a, derived);
      } catch (err) {
        console.warn(`wallet move: the old ${name} address waits`, err && (err.code || err.message));
      }
    }
  }

  async function moveOld(options, onStep) {
    if (signing) throw fail('busy');
    signing = true;
    const step = (name) => { try { if (onStep) onStep(name); } catch (_) { } };
    try {
      if (activeExtra) throw fail('wallet_changed');
      const arch = await archiveRead();
      const old = arch.blob;
      if (!old) throw fail('no_secret');
      const blob = await currentBlob();
      const lib = await bundle();
      const to = addressOf(lib, publicKeyOf(blob));
      const epoch = blob.e >= EPOCH ? null : await epochRead();
      if (!(blob.e >= EPOCH || (epoch.ok && epoch.value && epoch.value.a === blob.a)) || blob.a === old.a || to !== blob.a) throw fail('bad_intent');
      const record = await cloudRead();
      if (!record.ok) throw fail('storage_timeout');
      if (record.address !== to) throw fail('address_mismatch');
      if (blob.typed === true) await confirmHeldOwner(old, 'walletKey.ownerMove');
      if (!(await backedUp(to))) {
        if (blob.w === 'keychain') await openSealed(blob, undefined, ({ words, kind }) => backUp(words, to, false, kind)).catch(() => null);
        if (!(await backedUp(to))) throw fail('backup_first');
      }
      const seen = await oldHoldings(lib, old);
      oldSeen = seen;
      if (seen.empty) {
        await forgetOld(old);
        return { moved: [], left: [], empty: true };
      }
      const left = [];
      if (seen.frozen) left.push({ what: 'GRAM', why: 'frozen' });
      else if (seen.pending) left.push({ what: 'GRAM', why: 'pending' });
      const gas = seen.jettons.length || seen.orders.length ? await topupRoom(blob, old) : { room: 0n, chain: null };
      const plan = moveTonPlan(lib, old, to, seen, left, gas.room);
      const signed = await openSealed(old, (options || {}).password, async ({ keys, words }) => {
        if (old.w === 'bio') await archiveReseal(words, old, arch.text).catch((err) => console.warn('wallet move: archive stays behind the finger', err && err.code));
        if (seen.unknown.length) await oldNetsFrom(words, old);
        const moveUntil = nowSeconds() + MOVE_VALID_S;
        for (const r of plan.returns) await orderRecordWrite(r.subwallet, r.seqno, moveUntil);
        const out = signTonMove(lib, keys, old, to, seen, plan, moveUntil);
        if (plan.topup > 0n) {
          if (!gas.chain || plan.topup > gas.room + MOVE_TOPUP_ROOM || plan.topup > MOVE_TOPUP_MAX) throw fail('bad_intent');
          const message = lib.internal({ to: lib.Address.parseRaw(old.a), value: plan.topup, bounce: false });
          out.topup = await openSealed(blob, undefined, ({ keys: own }) => ({ seqno: gas.chain.seqno, boc: externalOf(lib, own, undefined, SEND_MODE, [message], gas.chain, out.validUntil) }));
        }
        return out;
      });
      step('signed');
      const moved = [];
      const until = Date.now() + MOVE_WAIT_MS;
      let mainOk = true;
      if (signed.topup) {
        pendingWrite(blob.a, { seqno: signed.topup.seqno, hash: (await T.messageHash(signed.topup.boc)) || '', validUntil: signed.validUntil, boc: signed.topup.boc });
        await broadcast(signed.topup.boc).catch((err) => { if (SEND_FINAL.has(err.code)) pendingClear(blob.a); });
        mainOk = await gasArrived(old.a, plan.needs).then(() => true, () => false);
        if (!mainOk) plan.jettons.forEach((j) => left.push({ what: j.what, why: 'wait' }));
      }
      if (signed.first && mainOk) {
        pendingWrite(old.a, { seqno: signed.first.seqno, hash: (await T.messageHash(signed.first.boc)) || '', validUntil: signed.validUntil, boc: signed.first.boc });
        await broadcast(signed.first.boc).catch((err) => { if (SEND_FINAL.has(err.code)) pendingClear(old.a); });
        mainOk = await seqnoPassed(old.a, signed.first.seqno, until);
        if (mainOk) plan.jettons.forEach((j) => moved.push(j.what));
        else plan.jettons.forEach((j) => left.push({ what: j.what, why: 'wait' }));
      }
      step('sent');
      for (const r of signed.returns) {
        const fed = !r.topup || (mainOk && await gasArrived(r.address, r.needs).then(() => true, () => false));
        if (!fed) {
          left.push({ what: 'orders', why: 'wait' });
          continue;
        }
        pendingWrite(r.address, { seqno: r.seqno, hash: (await T.messageHash(r.boc)) || '', validUntil: signed.validUntil, boc: r.boc });
        const sent = await broadcast(r.boc).then(() => true, () => false);
        if (sent) moved.push('orders');
        else left.push({ what: 'orders', why: 'wait' });
      }
      if (signed.sweep) {
        if (!mainOk) left.push({ what: 'GRAM', why: 'wait' });
        else {
          pendingWrite(old.a, { seqno: signed.sweep.seqno, hash: (await T.messageHash(signed.sweep.boc)) || '', validUntil: signed.validUntil, boc: signed.sweep.boc });
          const sent = await broadcast(signed.sweep.boc).then(() => true, (err) => {
            if (SEND_FINAL.has(err.code)) pendingClear(old.a);
            return false;
          });
          if (sent) moved.unshift('GRAM');
          else left.push({ what: 'GRAM', why: 'wait' });
        }
      }
      step('landed');
      const after = await oldHoldings(lib, old).catch(() => null);
      if (after) {
        oldSeen = after;
        after.nets.forEach((net) => left.push({ what: net, why: 'net' }));
        if (after.empty) await forgetOld(old);
      }
      return { moved: Array.from(new Set(moved)), left, empty: !!after && after.empty };
    } finally {
      signing = false;
      load().then(tellBackup, () => null);
    }
  }

  let lastMakeError = null;
  function whyNot(inside, phone, secure, cloud, s) {
    if (CK.tg.inside && !inside) return 'sdk';
    if (s.makeFailed === 'store') return 'store';
    if (inside && phone && !secureStore()) return 'old';
    if (inside && phone && !(secure && secure.ok)) return 'secure';
    if (inside && !cloud.ok) return 'cloud';
    return lastMakeError || 'retry';
  }
  let retryTimer = null, retries = 0;
  function scheduleRetry(now) {
    const stuck = now.kind === 'unknown' || now.makeFailed === 'retry' || (now.legacy && now.phone && now.secure) || (!!now.recoverFrom && now.secure);
    if (!stuck) {
      retries = 0;
      return;
    }
    if (retryTimer || retries >= RETRY_MS.length) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      patient = true;
      ensure().catch((err) => console.error(err)).then(tellBackup);
    }, RETRY_MS[retries++]);
    if (retryTimer && typeof retryTimer.unref === 'function') retryTimer.unref();
    status = { ...status, retrying: true };
  }

  function backupAtLaunch(now) {
    if (now.kind === 'signer' && now.method === 'keychain' && now.backup === 'none' && !now.mismatch) {
      currentBlob().then((blob) => openSealed(blob, undefined, () => null)).catch((err) => console.warn('wallet backup: try again later', err && err.code));
    }
  }
  function othersAtLaunch(now) {
    if (now.kind !== 'signer' || now.method !== 'keychain' || now.mismatch || !now.address) return;
    const own = now.address;
    if (evmOwnRead(own) && Object.keys(NET_OWN).every((net) => netOwnRead(net, own)) && (now.phrase !== 'bip39' || netAltRead(own)) && !holdShort(own)) return;
    currentBlob().then((blob) => (blob.a === own ? openSealed(blob, undefined, ({ words }) => { deriveOthers(words, own); }) : null))
      .catch((err) => console.warn('wallet: other addresses wait for an unlock', err && (err.code || err.message)));
  }
  function kidAtLaunch(now) {
    if (now.kind !== 'signer' || now.backup !== 'have' || now.mismatch) return;
    kidChanged().then((changed) => (changed ? load().then((next) => {
      tellBackup();
      backupAtLaunch(next);
    }) : null)).catch((err) => console.warn('wallet backup check: try again later', err && (err.code || err.message)));
  }
  async function ensure() {
    const now = await launch();
    scheduleRetry(now);
    extrasSync();
    await dirLoginRead().catch(() => null);
    directoryAtLaunch(now).catch((err) => console.warn('directory: published at a later launch', err && (err.code || err.message)))
      .then(() => invoiceAtLaunch(now)).catch((err) => console.warn('invoices: published at a later launch', err && (err.code || err.message)));
    directoryUnlistAtLaunch(now).catch((err) => console.warn('directory: unlisted at a later launch', err && (err.code || err.message)));
    return now;
  }
  async function launch() {
    let now = await load();
    if (!now.secure || !holdsHere()) return now;
    await slotJob(settleSwap).catch((err) => console.warn('wallet: the swap slot is put back on a later launch', err && (err.code || err.message)));
    if (now.recoverFrom) {
      await recoverOld(now.recoverFrom).catch((err) => console.warn('wallet: the account wallet comes back on a later launch', err && (err.code || err.message)));
      now = await load();
      if (now.recoverFrom) return now;
    }
    if (now.adoptFor) {
      const held = await secureRead().catch(() => null);
      if (held && held.ok && held.value && !restoreJob) {
        createJob = restoreFromBackup(now.adoptFor, held.value).finally(() => { createJob = null; });
        await createJob;
      }
      if (status.moveFrom) checkOld(status.moveFrom);
      return status;
    }
    if (now.legacy && !now.replacedElsewhere && (now.kind === 'signer' || now.kind === 'readonly') && !now.mismatch) {
      await adoptLegacy(now.address).catch((err) => console.warn('wallet: the epoch record is written on a later launch', err && (err.code || err.message)));
      now = await load();
    }
    if (now.restoring && !restoreJob) {
      createJob = restoreFromBackup(now.address).finally(() => { createJob = null; });
      await createJob;
      return status;
    }
    backupAtLaunch(now);
    othersAtLaunch(now);
    kidAtLaunch(now);
    if (now.moveFrom) checkOld(now.moveFrom);
    if (now.kind !== 'none') return now;
    if (now.canRestore && !keptGivenUp()) {
      if (await takeKept()) return load();
      if (!keptGivenUp()) return load();
    }
    try {
      await create();
    } catch (err) {
      console.error(err);
      makeFailed = err.code === 'storage_failed' || err.code === 'no_secure_storage' ? 'store' : 'retry';
      lastMakeError = err.code === 'bundle_failed' ? 'bundle' : null;
      await load();
    }
    return status;
  }

  async function importWords(given, options) {
    await requireLaunch();
    const lib = await bundle();
    const words = (Array.isArray(given) ? given : String(given || '').split(/\s+/)).map((w) => String(w).trim().toLowerCase()).filter(Boolean);
    const opts = options || {};
    const c = await classifyWords(lib, words);
    refuseWords(words, c);
    if (createJob) await createJob.catch(() => null);
    const record = await cloudRead();
    if (!record.ok && c.ton && c.bip39 && opts.kind == null) throw fail('storage_timeout');
    const kind = await chooseKind(lib, words, c, opts.kind, record.ok ? record.address : null, new Set(extras.keys()));
    if (!kind) return { need: 'source' };
    let checked = null;
    if (opts.replace === true) {
      const main = await slotRead(SECRET_KEY);
      if (!main.ok) throw fail('storage_timeout');
      const keys = await keysOf(lib, words, kind);
      const address = addressOf(lib, keys.publicKey);
      keys.secretKey.fill(0);
      if (extras.has(address)) throw fail('wallet_added');
      const evm = await evmOfWords(words);
      if (evm && [...extras.keys()].some((one) => evmOwnRead(one) === evm)) throw fail('already_added');
      if (main.blob && main.blob.a !== address) await confirmHeldOwner(main.blob, 'walletKey.ownerReplace');
      checked = main.blob ? main.blob.a : null;
    }
    return slotJob(() => importHeld(lib, words, options, checked, kind));
  }
  async function importHeld(lib, words, options, checked, kind) {
    let now = await load();
    if (now.kind === 'unknown') throw fail('storage_timeout');
    if (!now.secure) throw fail('no_secure_storage');
    if (now.canRestore) {
      await slotRestore(SECRET_KEY);
      now = await load();
    }
    const main = await slotRead(SECRET_KEY);
    if (!main.ok) throw fail('storage_timeout');
    if (main.text && !main.blob) throw fail('wallet_exists');
    const opts = options || {};
    const keys = await keysOf(lib, words, kind);
    try {
      const address = addressOf(lib, keys.publicKey);
      const replacing = !!now.address && address !== now.address;
      if (replacing) {
        await extrasLook(now.address).catch(() => null);
        if (extras.has(address)) throw fail('wallet_added');
      }
      if (replacing && opts.replace !== true) throw fail('address_mismatch');
      if (replacing && (main.blob ? main.blob.a : null) !== checked) throw fail('busy');
      const sealOpts = { password: opts.password, keychain: !opts.password && (now.setup === 'biometric' || now.setup === 'keychain'), typed: true, kind };
      if (replacing) {
        const held = main.blob;
        const onAccount = await backupRead();
        if (!onAccount.ok) throw fail('storage_timeout');
        if (held && held.a !== address && !(onAccount.value && onAccount.value.a === held.a)) await backupKeep(held, () => askBackupKey());
        await setAside(address);
        await sealAndStore(lib, words, keys.publicKey, sealOpts);
        if (!(await cloudWrite(address).catch(() => false))) throw fail('storage_timeout');
        await epochWrite({ a: address, from: null });
        await load();
      } else {
        await sealAndStore(lib, words, keys.publicKey, sealOpts);
        await cloudWrite(address).catch(() => false);
        await load();
      }
      deadToken = null;
      if (replacing) await backUp(words, address, true, kind);
      else backUp(words, address, false, kind);
      deriveOthers(words, address);
    } finally {
      keys.secretKey.fill(0);
    }
    orderScanJob = scanOrderWallets().then((rows) => rows.filter((row) => row.funds), () => null);
    return T.wallet;
  }

  async function restore(options) {
    const opts = options || {};
    await requireLaunch();
    const store = secureStore();
    if (!store) throw fail('no_secure_storage');
    const cloud = await cloudRead();
    if (!cloud.ok) throw fail('storage_timeout');
    if (!cloud.address) throw fail('address_mismatch');
    let value = (await secureRead()).value;
    if (!value) {
      const [err, restored] = await tgCall((done) => store.restoreItem(SECRET_KEY, done));
      if (err || !restored) throw fail('storage_failed');
      value = restored;
    }
    const blob = readBlob(value);
    if (!blob || blob.a !== cloud.address) {
      await refresh();
      throw fail('address_mismatch');
    }
    await (blob.w === 'keychain' ? openSealed : withSecret)(blob, opts.password, ({ words }) => { deriveOthers(words, blob.a); });
    await refresh();
    return T.wallet;
  }

  async function unlock(options) {
    await withSecret(await activeBlob(), (options || {}).password, () => null);
    return true;
  }
  async function saveBackup(options) {
    if (activeExtra) return extraSaveBackup(options);
    const blob = await currentBlob();
    await withSecret(blob, (options || {}).password, ({ words, kind }) => backUp(words, blob.a, false, kind));
    if (status.backup !== 'have') throw fail('backup_failed');
    return true;
  }

  async function depositAddress() {
    await sdkReady;
    if (CK.tg.app) await requireLaunch();
    const blob = await activeBlob().catch(() => null);
    if (blob) {
      const lib = await bundle();
      const derived = addressOf(lib, Uint8Array.from(blob.pk.match(/../g), (h) => parseInt(h, 16)));
      if (derived !== blob.a) throw fail('address_mismatch');
      return { address: derived, friendly: T.friendlyAddress(derived), verified: true };
    }
    const now = shownStatus(await refresh());
    if (!now.address) throw fail('no_wallet');
    return { address: now.address, friendly: now.friendly, verified: false };
  }

  const pendingMemory = {};
  function pendingRead(address) {
    let text = pendingMemory[address] || null;
    if (!text) {
      try { text = localStorage.getItem(PENDING_KEY + address); } catch (_) { }
    }
    if (!text) return null;
    try {
      const rec = JSON.parse(text);
      return rec && Number.isInteger(rec.seqno) && Number.isInteger(rec.validUntil) && typeof rec.boc === 'string' ? rec : null;
    } catch (_) {
      return null;
    }
  }
  function pendingWrite(address, rec) {
    const text = JSON.stringify(rec);
    pendingMemory[address] = text;
    try { localStorage.setItem(PENDING_KEY + address, text); } catch (_) { }
  }
  function pendingClear(address) {
    delete pendingMemory[address];
    try { localStorage.removeItem(PENDING_KEY + address); } catch (_) { }
  }
  const nowSeconds = () => Math.floor(Date.now() / 1000);
  function pendingAgainst(address, chain) {
    const rec = pendingRead(address);
    if (!rec) return null;
    if (chain.seqno > rec.seqno || nowSeconds() > rec.validUntil + EXPIRY_MARGIN_S) {
      pendingClear(address);
      return null;
    }
    return rec;
  }

  async function chainState(address) {
    await T.config();
    let body;
    try {
      body = await T.api('wallet/state?address=' + encodeURIComponent(address));
    } catch (_) {
      throw fail('state_unknown');
    }
    if (!Number.isInteger(body.seqno) || body.seqno < 0 || typeof body.status !== 'string') throw fail('state_unknown');
    return { seqno: body.seqno, status: body.status, balance: T.parseUnits(body.balance) };
  }

  const TRANSFER_FIELDS = new Set(['to', 'amount', 'bounce', 'comment']);
  const JETTON_FIELDS = new Set(['to', 'recipient', 'units', 'comment']);
  const JETTON_COMMENT = /^[A-Za-z0-9_-]{1,24}$/;
  const onlyFields = (message, allowed) => Object.keys(message).every((key) => allowed.has(key));
  function readIntent(messages, own) {
    if (!Array.isArray(messages) || messages.length !== 1) throw fail('bad_intent');
    const m = messages[0];
    if (!m || typeof m !== 'object') throw fail('bad_intent');
    const contract = (text) => {
      const raw = T.rawAddress(text);
      if (!raw || !raw.startsWith('0:')) throw fail('bad_address');
      return raw;
    };
    if (m.recipient !== undefined) {
      if (!onlyFields(m, JETTON_FIELDS)) throw fail('bad_intent');
      const typed = T.parseRecipient(m.recipient);
      const units = T.parseUnits(m.units);
      if (!typed) throw fail('bad_address');
      if (!units) throw fail('bad_intent');
      if (m.comment !== undefined && (typeof m.comment !== 'string' || !JETTON_COMMENT.test(m.comment))) throw fail('bad_intent');
      return { kind: 'jetton', to: contract(m.to), amount: JETTON_GAS_NANO, bounce: true, recipient: typed.address, units, owner: own, needs: JETTON_GAS_NANO + GAS_NANO, ...(m.comment ? { comment: m.comment } : {}) };
    }
    if (!onlyFields(m, TRANSFER_FIELDS)) throw fail('bad_intent');
    const typed = T.parseRecipient(m.to);
    const amount = T.parseUnits(m.amount);
    if (!typed) throw fail('bad_address');
    if (!amount || (m.bounce !== undefined && m.bounce !== typed.bounce)) throw fail('bad_intent');
    if (m.comment !== undefined && (typeof m.comment !== 'string' || Array.from(m.comment).length > COMMENT_MAX)) throw fail('bad_intent');
    return { kind: 'transfer', to: typed.address, amount, bounce: typed.bounce, comment: m.comment || '', needs: amount + GAS_NANO };
  }
  function readAudited(lib, built, intent, own) {
    const audited = CK.swapAudit.audit(lib, built, { ...intent, owner: own });
    if (audited.reason) throw fail('swap_refused', { reason: audited.reason });
    const m = built.messages[0];
    if (m.payload.length > PAYLOAD_MAX) throw fail('bad_intent');
    return { kind: 'swap', to: T.rawAddress(m.address), amount: audited.attached, bounce: true, payload: m.payload, needs: audited.attached + SWAP_RESERVE_NANO };
  }
  function bodyOf(lib, intent) {
    if (intent.kind === 'swap') {
      let cell;
      try { cell = lib.Cell.fromBase64(intent.payload); } catch (_) { throw fail('bad_intent'); }
      if (cell.isExotic) throw fail('bad_intent');
      return cell;
    }
    if (intent.kind === 'p2pJetton') {
      return lib.beginCell().storeUint(JETTON_TRANSFER_OP, 32).storeUint(0, 64).storeCoins(intent.units)
        .storeAddress(lib.Address.parseRaw(intent.recipient)).storeAddress(lib.Address.parseRaw(intent.owner))
        .storeBit(0).storeCoins(intent.forward).storeBit(0).storeUint(0, 32).storeStringTail(intent.memo).endCell();
    }
    if (intent.kind === 'chequeJetton') {
      return lib.beginCell().storeUint(JETTON_TRANSFER_OP, 32).storeUint(0, 64).storeCoins(intent.units)
        .storeAddress(lib.Address.parseRaw(intent.recipient)).storeAddress(lib.Address.parseRaw(intent.owner))
        .storeBit(0).storeCoins(intent.forward).storeBit(0).endCell();
    }
    if (intent.kind === 'jetton') {
      const head = lib.beginCell().storeUint(JETTON_TRANSFER_OP, 32).storeUint(0, 64).storeCoins(intent.units)
        .storeAddress(lib.Address.parseRaw(intent.recipient)).storeAddress(lib.Address.parseRaw(intent.owner))
        .storeBit(0).storeCoins(intent.forward || 1n).storeBit(0);
      return intent.comment ? head.storeUint(0, 32).storeStringTail(intent.comment).endCell() : head.endCell();
    }
    return intent.comment ? lib.beginCell().storeUint(0, 32).storeStringTail(intent.comment).endCell() : undefined;
  }
  function externalOf(lib, keys, subwallet, sendMode, messages, chain, validUntil) {
    const contract = contractOf(lib, keys.publicKey, subwallet);
    const transfer = contract.createTransfer({ seqno: chain.seqno, secretKey: keys.secretKey, sendMode, timeout: validUntil, messages });
    const init = chain.seqno === 0 && chain.status !== 'active' ? contract.init : undefined;
    const external = lib.external({ to: contract.address, init, body: transfer });
    return lib.beginCell().store(lib.storeMessage(external)).endCell().toBoc().toString('base64');
  }
  function buildSigned(lib, keys, intent, chain, validUntil) {
    if (intent.kind === 'payout') return payoutSigned(lib, keys, intent.plan, chain, validUntil);
    const message = lib.internal({ to: lib.Address.parseRaw(intent.to), value: intent.amount, bounce: intent.bounce, body: bodyOf(lib, intent) });
    return externalOf(lib, keys, intent.subwallet, intent.mode || SEND_MODE, [message], chain, validUntil);
  }
  function payoutSigned(lib, keys, plan, chain, validUntil) {
    const messages = plan.lines.map((line) => lib.internal({ to: lib.Address.parseRaw(line.to), value: line.amount, bounce: false, body: plan.comment }));
    const contract = contractOf(lib, keys.publicKey);
    const transfer = contract.createTransfer({ seqno: chain.seqno, secretKey: keys.secretKey, sendMode: SEND_MODE, timeout: validUntil, messages });
    const wrong = CK.payoutAudit.auditTransfer(lib, transfer, plan, { seqno: chain.seqno, validUntil });
    if (wrong) throw fail('payout_refused', { reason: wrong });
    const init = chain.seqno === 0 && chain.status !== 'active' ? contract.init : undefined;
    return lib.beginCell().store(lib.storeMessage(lib.external({ to: contract.address, init, body: transfer }))).endCell().toBoc().toString('base64');
  }

  let signing = false;
  async function chainForSend(address, needs) {
    const chain = await chainState(address);
    if (chain.status === 'frozen') throw fail('frozen');
    const open = pendingAgainst(address, chain);
    if (open) throw fail('pending', { pending: open });
    if (chain.balance === null) throw fail('balance_unknown');
    if (chain.balance < needs) throw fail('insufficient_gas', { short: [{ units: (needs - chain.balance).toString(), decimals: 9, symbol: 'GRAM' }] });
    return chain;
  }
  async function chainForIntent(address, intent) {
    const chain = await chainForSend(address, intent.needs);
    if (intent.seqno !== undefined && chain.seqno !== intent.seqno) throw fail('payout_refused', { reason: 'stale' });
    return chain;
  }
  async function signOne(read, options, afterUnlock, coinShort) {
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      const lib = await bundle();
      const intent = read(lib, blob.a);
      bodyOf(lib, intent);
      const coin = coinShort ? await coinShort(blob.a) : null;
      let chain;
      try {
        chain = await chainForIntent(blob.a, intent);
      } catch (err) {
        if (coin && err.code === 'insufficient_gas') throw fail('insufficient_balance', { short: [coin].concat(err.short || []) });
        throw err;
      }
      if (coin) throw fail('insufficient_balance', { short: [coin] });
      const owner = OWNER_KINDS.has(intent.kind) ? await confirmOwner(blob, (options || {}).password, 'walletKey.ownerSend') : { blob, password: (options || {}).password };
      if (owner.blob.a !== blob.a) throw fail('busy');
      const checkedAt = Date.now();
      return await withSecret(owner.blob, owner.password, async ({ keys }) => {
        stillActive(blob);
        if (afterUnlock) afterUnlock(lib, blob.a);
        if (Date.now() - checkedAt > CHAIN_FRESH_MS) chain = await chainForIntent(blob.a, intent);
        const validUntil = intent.validUntil ? Math.min(nowSeconds() + VALID_S, intent.validUntil) : nowSeconds() + VALID_S;
        const boc = buildSigned(lib, keys, intent, chain, validUntil);
        const hash = (await T.messageHash(boc)) || '';
        pendingWrite(blob.a, { seqno: chain.seqno, hash, validUntil, boc });
        return { boc, hash, seqno: chain.seqno, validUntil };
      });
    } finally {
      signing = false;
    }
  }

  const quotedFor = (intent, options) => {
    const wallet = (options && options.wallet) || (intent && intent.wallet);
    return wallet ? { ...(options || {}), wallet } : options;
  };
  const unlockAndSign = (messages, options) => signOne((_, own) => readIntent(messages, own), options);
  const signP2PDeposit = (plan, options) => signOne((lib, own) => CK.p2pAudit.intentOf(lib, plan, own), options, (lib, own) => CK.p2pAudit.intentOf(lib, plan, own), (own) => p2pCoinShort(plan, own));
  async function p2pCoinShort(plan, own) {
    const coin = CK.p2pAudit.pins.coins[plan.coin];
    if (!coin || !coin.master) return null;
    const want = BigInt(plan.units) + BigInt(plan.fee);
    const row = (await tokenRows(own)).find((one) => one && T.rawAddress(one.token) === coin.master);
    const have = row ? T.parseUnits(String(row.units)) || 0n : 0n;
    return have < want ? { units: (want - have).toString(), decimals: coin.decimals, symbol: coin.symbol } : null;
  }
  async function signP2PText(text, options) {
    if (!CK.p2pAudit.textOk(text)) throw fail('bad_intent');
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      const lib = await bundle();
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
      const owner = await confirmOwner(blob, (options || {}).password, 'walletKey.ownerSend');
      if (owner.blob.a !== blob.a) throw fail('busy');
      return await withSecret(owner.blob, owner.password, async ({ keys }) => {
        stillActive(blob);
        const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return { signature: hex(lib.sign(lib.Buffer ? lib.Buffer.from(hash) : hash, keys.secretKey)), publicKey: hex(keys.publicKey) };
      });
    } finally {
      signing = false;
    }
  }
  function signSwap(built, intent, options) {
    const read = (lib, own) => readAudited(lib, built, intent, own);
    const swipedAt = (intent && intent.swipedAt) || Date.now();
    return signOne(read, quotedFor(intent, options), (lib, own) => {
      if (Date.now() - swipedAt > SWAP_UNLOCK_MS) throw fail('swap_refused', { reason: 'stale' });
      read(lib, own);
    });
  }
  function signPayout(plan, shown, options) {
    const read = (lib, own) => {
      if (activeExtra || own !== status.address) throw fail('payout_refused', { reason: 'wallet' });
      const audited = CK.payoutAudit.readPlan(plan, shown, own, nowSeconds());
      if (audited.reason) throw fail('payout_refused', { reason: audited.reason });
      return { kind: 'payout', plan: audited, needs: audited.needs, seqno: audited.seqno, validUntil: audited.validUntil };
    };
    return signOne(read, options, (lib, own) => read(lib, own));
  }

  const EVM_RECORD_KEY = 'ck_evm_address';
  const perWalletKey = (base, own) => (own && extras.has(own) ? `${base}_x_${own.slice(2)}` : base);
  async function evmRecordRead(own) {
    const store = cloudStore();
    if (!store || !own) return null;
    const [err, value] = await tgCall((done) => store.getItem(perWalletKey(EVM_RECORD_KEY, own), done));
    if (err || !value) return null;
    try {
      const record = JSON.parse(value);
      return record && record.ton === own && /^0x[0-9a-f]{40}$/.test(record.evm) ? record.evm : null;
    } catch (_) {
      return null;
    }
  }
  async function evmRecordWrite(own, evm) {
    const store = cloudStore();
    if (!store) return;
    await tgCall((done) => store.setItem(perWalletKey(EVM_RECORD_KEY, own), JSON.stringify({ ton: own, evm }), done));
  }
  async function withEvmWords(fn, options) {
    if (signing) throw fail('busy');
    signing = true;
    try {
      const opts = options || {};
      const blob = await activeBlob(opts.wallet);
      const owner = opts.owner === true ? await confirmOwner(blob, opts.password, 'walletKey.ownerSend') : { blob, password: opts.password };
      if (owner.blob.a !== blob.a) throw fail('busy');
      return await withSecret(owner.blob, owner.password, async ({ lib, words }) => {
        stillActive(blob);
        if (!multiNet(lib.mnemonicWordList, words)) throw fail('ton_only');
        return fn(words, blob.a);
      });
    } finally {
      signing = false;
    }
  }
  const EVM_OWN_KEY = 'ck-evm-own:';
  function evmOwnRead(own) {
    try {
      const value = own ? localStorage.getItem(EVM_OWN_KEY + own) : null;
      return value && /^0x[0-9a-f]{40}$/.test(value) ? value : null;
    } catch (_) {
      return null;
    }
  }
  function evmOwnWrite(own, evm) {
    try { if (own) localStorage.setItem(EVM_OWN_KEY + own, evm); } catch (_) { }
  }
  const withEvmKey = (fn, options, ordered) => withEvmWords(async (words, own) => {
    const evm = netApi('evm');
    const lib = await evm.bundle();
    const key = await evm.keyOf(lib, words);
    const ctx = orderContext('evm', lib, words, own);
    try {
      evmOwnWrite(own, key.address);
      const wanted = orderWanted.has('evm:' + own);
      const top = wanted ? orderWanted.get('evm:' + own) : -1;
      if ((ordered === true || wanted) && evmAheadShort(own, key.address, top)) {
        await evmAheadFill(lib, words, own, key.address, top).then(() => orderWanted.delete('evm:' + own)).catch(() => null);
      }
      return await fn(key, own, orderTools(ctx));
    } finally {
      ctx.close();
      key.privateKey.fill(0);
    }
  }, options);
  const deriveOwn = (evmLib) => async (words, own) => {
    const evm = await netApi('evm').deriveAddress(evmLib, words);
    evmOwnWrite(own, evm);
    return evm;
  };
  async function evmAddress(options) {
    const opts = options || {};
    const own = (T.wallet && T.wallet.address) || null;
    const stored = await evmRecordRead(own).catch(() => null);
    if (stored || !opts.unlock) return stored;
    const evm = await withEvmWords(deriveOwn(await netApi('evm').bundle()), opts);
    await evmRecordWrite(own, evm).catch(() => null);
    return evm;
  }
  async function evmDepositAddress(options) {
    const opts = options || {};
    const own = (T.wallet && T.wallet.address) || null;
    const local = evmOwnRead(own);
    const stored = await evmRecordRead(own).catch(() => null);
    if (local && (!stored || stored === local)) return local;
    if (!opts.unlock) return null;
    const evm = await withEvmWords(deriveOwn(await netApi('evm').bundle()), opts);
    if (stored !== evm) await evmRecordWrite(own, evm).catch(() => null);
    return evm;
  }

  const NET_OWN = { sol: 'ck-sol-own:', tron: 'ck-tron-own:' };
  const NET_ADDRESS = { sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/ };
  function netOwnRead(net, own) {
    try {
      const value = own && NET_OWN[net] ? localStorage.getItem(NET_OWN[net] + own) : null;
      return value && NET_ADDRESS[net].test(value) ? value : null;
    } catch (_) {
      return null;
    }
  }
  function netOwnWrite(net, own, address) {
    try { if (own && NET_OWN[net]) localStorage.setItem(NET_OWN[net] + own, address); } catch (_) { }
  }
  const NET_ALT = 'ck-sol-alt:';
  const SOL_ALT_PATHS = new Set(['trust', 'root']);
  const SOL_HOLD_PATH = /^holder:(0|[1-9]\d{0,9})$/;
  function holdShort(own) {
    try {
      const sol = netOwnRead('sol', own);
      const api = netApi('sol');
      return !!sol && typeof api.holderShort === 'function' && api.holderShort(own, sol) === true;
    } catch (_) {
      return false;
    }
  }
  async function holdFill(api, netLib, words, own, sol) {
    if (own && typeof api.holderFill === 'function') await api.holderFill(netLib, words, own, sol);
  }
  function netAltRead(own) {
    try {
      const rec = own ? JSON.parse(localStorage.getItem(NET_ALT + own) || 'null') : null;
      if (!rec || !NET_ADDRESS.sol.test(rec.sol || '') || !Array.isArray(rec.alts)) return null;
      const alts = rec.alts.filter((one) => one && SOL_ALT_PATHS.has(one.path) && NET_ADDRESS.sol.test(one.address || '')).map((one) => ({ path: one.path, address: one.address }));
      return alts.length ? { sol: rec.sol, alts } : null;
    } catch (_) {
      return null;
    }
  }
  async function netAltWrite(api, netLib, words, own, sol) {
    if (!own || typeof api.altAddresses !== 'function') return;
    const alts = await api.altAddresses(netLib, words);
    try { localStorage.setItem(NET_ALT + own, JSON.stringify({ sol, alts: alts.map((one) => ({ path: one.path, address: one.address })) })); } catch (_) { }
  }
  function netAlt(net) {
    const own = (T.wallet && T.wallet.address) || null;
    if (net !== 'sol' || !own) return null;
    const rec = netAltRead(own);
    if (!rec || rec.sol !== netOwnRead('sol', own)) return null;
    return Object.freeze({ own, sol: rec.sol, alts: Object.freeze(rec.alts.map((one) => Object.freeze(one))), kind: shownStatus(status).phrase || null });
  }
  const altHeard = [];
  function onSolAlt(fn) {
    if (typeof fn === 'function' && altHeard.length < 8) altHeard.push(fn);
  }
  const altFilling = new Set();
  function altAtUnlock(words, own) {
    if (altFilling.has(own)) return;
    altFilling.add(own);
    Promise.resolve(deriveOthers(words, own)).catch(() => null).then(() => {
      if (!netAltRead(own)) return;
      altHeard.forEach((fn) => { try { fn(own); } catch (err) { console.warn('wallet: a Solana look waits for the next launch', err && err.message); } });
    }).finally(() => altFilling.delete(own));
  }
  let altFillJob = null;
  function netAltFill(net) {
    if (net !== 'sol') return Promise.resolve(null);
    const now = netAlt('sol');
    const own = (T.wallet && T.wallet.address) || null;
    if (now && !holdShort(own)) return Promise.resolve(now);
    if (altFillJob) return altFillJob;
    altFillJob = (async () => {
      const blob = await activeBlob();
      if (blob.w !== 'keychain' || (kindOf(blob) !== 'bip39' && !holdShort(blob.a)) || signing) return null;
      await openSealed(blob, undefined, ({ words }) => { deriveOthers(words, blob.a); }, true);
      await Promise.resolve(othersJob).catch(() => null);
      return netAlt('sol');
    })().catch(() => null).finally(() => { altFillJob = null; });
    return altFillJob;
  }
  const withNetKey = (net, fn, options, ordered) => {
    if (!NET_OWN[net]) return Promise.reject(fail('bad_intent'));
    let api;
    try { api = netApi(net); } catch (err) { return Promise.reject(err); }
    return withEvmWords(async (words, own) => {
      const netLib = await api.bundle();
      const key = await api.keyOf(netLib, words);
      const others = [];
      let open = true;
      const ctx = net === 'sol' ? orderContext('sol', netLib, words, own) : null;
      const tools = ctx ? orderTools(ctx) : null;
      const more = net === 'sol' ? Object.freeze({
        alt: async (path) => {
          if (!open || typeof path !== 'string') throw fail('bad_intent');
          if (SOL_ORDER_PATH.test(path)) return tools.order(Number(SOL_ORDER_PATH.exec(path)[1]));
          if (!(SOL_ALT_PATHS.has(path) || SOL_HOLD_PATH.test(path))) throw fail('bad_intent');
          const one = await api.keyOf(netLib, words, path);
          if (!open) {
            one.privateKey.fill(0);
            throw fail('bad_intent');
          }
          others.push(one);
          return one;
        },
        ...tools
      }) : undefined;
      try {
        netOwnWrite(net, own, key.address);
        if (net === 'sol' && (netAltRead(own) || {}).sol !== key.address) await netAltWrite(api, netLib, words, own, key.address).catch(() => null);
        if (net === 'sol' && holdShort(own)) await holdFill(api, netLib, words, own, key.address).catch(() => null);
        if (net === 'sol' && (ordered === true || orderWanted.has('sol:' + own)) && solAheadShort(own, key.address)) {
          await solAheadFill(netLib, words, own, key.address).then(() => orderWanted.delete('sol:' + own)).catch(() => null);
        }
        return await fn(key, own, more);
      } finally {
        open = false;
        if (ctx) ctx.close();
        key.privateKey.fill(0);
        others.forEach((one) => one.privateKey.fill(0));
      }
    }, options);
  };
  const ORDER_ACCESS = Object.freeze({ evmOrders: 'evm', solOrders: 'sol' });
  const ORDER_FILES = Object.freeze({ evmOrders: 'evmOrders.js', solOrders: 'solOrders.js' });
  const runningScript = (() => {
    try {
      const bound = (proto, name) => Function.prototype.call.bind(Object.getOwnPropertyDescriptor(proto, name).get);
      const current = bound(Document.prototype, 'currentScript');
      const srcOf = bound(HTMLScriptElement.prototype, 'src');
      const doc = document;
      const Url = URL;
      const origin = String(location.origin);
      const path = () => {
        try {
          const script = current(doc);
          if (!script) return null;
          const url = new Url(srcOf(script));
          return url.origin === origin ? url.pathname : null;
        } catch (_) {
          return null;
        }
      };
      const self = path();
      if (!self) return null;
      return Object.freeze({ path, folder: self.slice(0, self.lastIndexOf('/') + 1) });
    } catch (_) {
      return null;
    }
  })();
  function askedByOwnFile(net) {
    if (!runningScript) return false;
    const path = runningScript.path();
    return path !== null && path === runningScript.folder + ORDER_FILES[net];
  }
  function keyAccess(net) {
    if (keyClosed || typeof net !== 'string' || keyTaken.has(net)) return null;
    if (Object.prototype.hasOwnProperty.call(ORDER_ACCESS, net)) {
      if (!askedByOwnFile(net)) return null;
      keyTaken.add(net);
      const family = ORDER_ACCESS[net];
      return Object.freeze(family === 'evm' ? (fn, options) => withEvmKey(fn, options, true) : (fn, options) => withNetKey(family, fn, options, true));
    }
    if (!Object.prototype.hasOwnProperty.call(NET_API, net)) return null;
    keyTaken.add(net);
    return Object.freeze(net === 'evm' ? (fn, options) => withEvmKey(fn, options) : (fn, options) => withNetKey(net, fn, options));
  }
  async function netAddress(net, options) {
    const own = (T.wallet && T.wallet.address) || null;
    const local = netOwnRead(net, own);
    if (local || !(options || {}).unlock) return local;
    return withNetKey(net, (key) => key.address, options);
  }

  const EVM_ORDER_BRANCH = Object.freeze([0x8000002c, 0x8000003c, 0x800003e8, 0]);
  const EVM_ORDER_SLOTS = 128;
  const SOL_ORDER_ACCOUNT = 2000;
  const SOL_ORDER_LIMIT = 0x80000000;
  const SOL_ORDER_PATH = /^order:(0|[1-9]\d{0,9})$/;
  const EVM_ORDER_CHAINS = Object.freeze({ eth: 1, base: 8453, arbitrum: 42161, bsc: 56, polygon: 137, optimism: 10, avalanche: 43114, ink: 57073, monad: 143, unichain: 130 });
  const ORDER_AHEAD = 16;
  const ORDER_LOW = 4;
  const ORDER_LIST_MAX = 64;
  const SOL_ORDER_KEYS_MAX = 16;
  const SOL_ORDER_LOCAL_KEEP = 64;
  const EVM_ORDER_CLOUD = 'ck_evm_o_';
  const SOL_ORDER_CLOUD = 'ck_sol_o_';
  const EVM_ORDER_LOCAL = 'ck-evm-o:';
  const EVM_AHEAD_LOCAL = 'ck-evm-oa:';
  const SOL_ORDER_LOCAL = 'ck-sol-o:';
  const SOL_AHEAD_LOCAL = 'ck-sol-oa:';
  const ORDER_LIVE = /^[A-Za-z0-9_-]{1,64}$/;
  const ORDER_UNITS = /^[1-9]\d{0,39}$/;
  const ORDER_OUT = /^[a-z]{2,8}$/;
  const EVM_ADDRESS = /^0x[0-9a-f]{40}$/;
  const EVM_SLOT_TEXT = /^(0|[1-9]\d?|1[01]\d|12[0-7])$/;
  const SOL_INDEX_TEXT = /^(0|[1-9]\d{0,9})$/;
  const evmOrderSlot = (n) => Number.isInteger(n) && n >= 0 && n < EVM_ORDER_SLOTS;
  const solOrderIndex = (n) => Number.isInteger(n) && n >= 0 && n < SOL_ORDER_LIMIT;
  const orderFamily = (family) => (family === 'evm' ? 'evm' : family === 'sol' || family === 'solana' ? 'sol' : null);
  function orderPath(family, n) {
    const f = orderFamily(family);
    if (f === 'evm' && evmOrderSlot(n)) return `m/44'/60'/1000'/0/${n}`;
    if (f === 'sol' && solOrderIndex(n)) return `m/44'/501'/2000'/${n}'`;
    return null;
  }
  function orderNet(chain) {
    if (chain === 'sol' || chain === 'solana') return { family: 'sol', chain: 'sol' };
    if (typeof chain === 'string' && Object.prototype.hasOwnProperty.call(EVM_ORDER_CHAINS, chain)) return { family: 'evm', chain };
    const key = Number.isSafeInteger(chain) ? Object.keys(EVM_ORDER_CHAINS).find((name) => EVM_ORDER_CHAINS[name] === chain) : null;
    return key ? { family: 'evm', chain: key } : null;
  }
  const orderHexOf = (own) => (typeof own === 'string' && /^0:[0-9a-f]{64}$/.test(own) ? own.slice(2) : null);
  const evmOrderCloudKey = (hex, chain) => EVM_ORDER_CLOUD + hex + '_' + chain;
  const solOrderCloudKey = (hex, n) => SOL_ORDER_CLOUD + hex + '_' + n;
  const orderLocalGet = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const orderLocalPut = (key, text) => { try { localStorage.setItem(key, text); } catch (_) { } };

  const wipeNode = (node) => {
    node.wipePrivateData();
    if (node.chainCode instanceof Uint8Array) node.chainCode.fill(0);
  };
  async function evmOrderDerive(lib, words, list, keep) {
    const seed = await lib.mnemonicToSeedWebcrypto(words.join(' '));
    let node = null;
    const out = [];
    try {
      node = lib.HDKey.fromMasterSeed(seed);
      for (const index of EVM_ORDER_BRANCH) {
        const child = node.deriveChild(index);
        wipeNode(node);
        node = child;
      }
      for (const n of list) {
        const child = node.deriveChild(n);
        try {
          const privateKey = Uint8Array.from(child.privateKey);
          const address = lib.addr.fromPrivateKey(privateKey).toLowerCase();
          if (!keep) privateKey.fill(0);
          out.push(keep ? { n, address, privateKey } : { n, address });
        } finally {
          wipeNode(child);
        }
      }
      return out;
    } catch (err) {
      out.forEach((one) => { if (one.privateKey) one.privateKey.fill(0); });
      throw err;
    } finally {
      seed.fill(0);
      if (node) wipeNode(node);
    }
  }
  function slipStep(netLib, I, index) {
    const data = new Uint8Array(37);
    data.set(I.subarray(0, 32), 1);
    data[33] = ((index >>> 24) & 0x7f) | 0x80;
    data[34] = (index >>> 16) & 0xff;
    data[35] = (index >>> 8) & 0xff;
    data[36] = index & 0xff;
    const code = I.slice(32);
    try {
      return netLib.hmac(netLib.sha512, code, data);
    } finally {
      code.fill(0);
      data.fill(0);
    }
  }
  async function solOrderDerive(netLib, words, list, keep) {
    const seed = await netLib.mnemonicToSeedWebcrypto(words.join(' '));
    let branch = null;
    const out = [];
    try {
      branch = netLib.hmac(netLib.sha512, utf8('ed25519 seed'), seed);
      for (const index of [44, 501, SOL_ORDER_ACCOUNT]) {
        const next = slipStep(netLib, branch, index);
        branch.fill(0);
        branch = next;
      }
      for (const n of list) {
        const I = slipStep(netLib, branch, n);
        try {
          const privateKey = Uint8Array.from(I.subarray(0, 32));
          const address = netLib.base58.encode(netLib.ed25519.getPublicKey(privateKey));
          if (!keep) privateKey.fill(0);
          out.push(keep ? { n, address, privateKey } : { n, address });
        } finally {
          I.fill(0);
        }
      }
      return out;
    } catch (err) {
      out.forEach((one) => { if (one.privateKey) one.privateKey.fill(0); });
      throw err;
    } finally {
      seed.fill(0);
      if (branch) branch.fill(0);
    }
  }

  function orderContext(family, lib, words, own) {
    const keys = [];
    const ctx = {
      family, lib, words, own, open: true,
      hold(privateKey) { keys.push(privateKey); },
      close() {
        ctx.open = false;
        keys.forEach((one) => one.fill(0));
        keys.length = 0;
        ctx.words = null;
        ctx.lib = null;
      }
    };
    return ctx;
  }
  function orderTools(ctx) {
    const evm = ctx.family === 'evm';
    const derive = evm ? evmOrderDerive : solOrderDerive;
    const valid = evm ? evmOrderSlot : solOrderIndex;
    const order = async (n) => {
      if (!ctx.open || !valid(n)) throw fail('bad_intent');
      const [one] = await derive(ctx.lib, ctx.words, [n], true);
      if (!ctx.open) {
        one.privateKey.fill(0);
        throw fail('bad_intent');
      }
      ctx.hold(one.privateKey);
      return Object.freeze({ family: ctx.family, n, path: orderPath(ctx.family, n), address: one.address, privateKey: one.privateKey });
    };
    const inside = (job) => async (...args) => {
      if (!ctx.open) throw fail('bad_intent');
      return job(...args);
    };
    const tools = {
      order,
      orderKey: (family, n) => (orderFamily(family) === ctx.family ? order(n) : Promise.reject(fail('bad_intent'))),
      orderAddressList: inside(async (from, count) => {
        if (!valid(from) || !Number.isInteger(count) || count < 1 || count > ORDER_LIST_MAX || !valid(from + count - 1)) throw fail('bad_intent');
        const list = await derive(ctx.lib, ctx.words, Array.from({ length: count }, (_, i) => from + i), false);
        return Object.freeze(list.map((one) => Object.freeze({ n: one.n, path: orderPath(ctx.family, one.n), address: one.address })));
      }),
      orderRecord: inside((entry) => (evm ? evmOrderTake(ctx, entry) : solOrderTake(ctx, entry))),
      orderSlots: inside(() => (evm ? evmOrderFound(ctx) : solOrderFound(ctx)))
    };
    if (!evm) tools.orderDrop = inside((n) => solOrderDrop(ctx, n));
    return Object.freeze(tools);
  }

  let orderWrites = Promise.resolve();
  function orderSerial(job) {
    const run = orderWrites.then(job, job);
    orderWrites = run.catch(() => null);
    return run;
  }
  const orderLastWrite = new Map();
  async function orderCloudGet(key) {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [err, value] = await tgCall((done) => store.getItem(key, done), cloudMs());
    if (err) throw fail('storage_failed');
    return typeof value === 'string' ? value : '';
  }
  async function orderCloudSet(key, text) {
    const store = cloudStore();
    if (!store || text.length > CLOUD_VALUE_MAX) throw fail('storage_failed');
    const [err] = await tgCall((done) => store.setItem(key, text, done), cloudMs());
    if (err) throw fail('storage_failed');
    return (await orderCloudGet(key)) === text;
  }
  async function orderCloudPut(key, text) {
    if (!(await orderCloudSet(key, text))) throw fail('storage_failed');
  }
  async function orderCloudDrop(key) {
    const store = cloudStore();
    if (!store || typeof store.removeItem !== 'function') throw fail('storage_failed');
    const [err] = await tgCall((done) => store.removeItem(key, done), cloudMs());
    if (err) throw fail('storage_failed');
  }
  async function orderCloudValues(keys) {
    const store = cloudStore();
    if (!store) return null;
    try {
      const out = {};
      if (typeof store.getItems === 'function') {
        for (let i = 0; i < keys.length; i += 50) {
          const part = keys.slice(i, i + 50);
          const [err, values] = await tgCall((done) => store.getItems(part, done), cloudMs());
          if (err || !values || typeof values !== 'object') return null;
          part.forEach((key) => { out[key] = typeof values[key] === 'string' ? values[key] : ''; });
        }
        return out;
      }
      const got = await Promise.all(keys.map((key) => orderCloudGet(key)));
      keys.forEach((key, i) => { out[key] = got[i]; });
      return out;
    } catch (_) {
      return null;
    }
  }

  function evmSlotsParse(text) {
    if (!text) return {};
    let rec;
    try { rec = JSON.parse(text); } catch (_) { return null; }
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return null;
    const out = {};
    for (const n of Object.keys(rec)) {
      const v = rec[n];
      if (!EVM_SLOT_TEXT.test(n) || !Array.isArray(v) || v.length < 1 || v.length > 2 || !Number.isSafeInteger(v[0]) || v[0] < 0) return null;
      if (v.length === 2 && !(typeof v[1] === 'string' && ORDER_LIVE.test(v[1]))) return null;
      out[n] = { hi: v[0], live: v.length === 2 ? v[1] : null };
    }
    return out;
  }
  const evmSlotsText = (slots) => JSON.stringify(Object.fromEntries(Object.keys(slots).map((n) => [n, slots[n].live ? [slots[n].hi, slots[n].live] : [slots[n].hi]])));
  function evmLocalAll(own) {
    let rec = null;
    try { rec = JSON.parse(orderLocalGet(EVM_ORDER_LOCAL + own) || 'null'); } catch (_) { rec = null; }
    const out = {};
    if (rec && typeof rec === 'object') {
      Object.keys(EVM_ORDER_CHAINS).forEach((chain) => {
        const slots = typeof rec[chain] === 'string' ? evmSlotsParse(rec[chain]) : null;
        if (slots && Object.keys(slots).length) out[chain] = slots;
      });
    }
    return out;
  }
  const evmLocalSlots = (own, chain) => evmLocalAll(own)[chain] || {};
  function evmLocalSave(own, chain, slots) {
    const all = evmLocalAll(own);
    all[chain] = slots;
    const kept = Object.keys(all).filter((name) => Object.keys(all[name]).length).map((name) => [name, evmSlotsText(all[name])]);
    orderLocalPut(EVM_ORDER_LOCAL + own, JSON.stringify(Object.fromEntries(kept)));
  }
  function evmSlotsMerge(cloud, local, marks) {
    const out = {};
    const ns = new Set([...Object.keys(cloud || {}), ...Object.keys(local), ...(marks ? [...marks.keys()].map(String) : [])]);
    [...ns].map(Number).sort((a, b) => a - b).forEach((n) => {
      const hi = Math.max(cloud && cloud[n] ? cloud[n].hi : -1, local[n] ? local[n].hi : -1, marks && marks.has(n) ? marks.get(n) : -1);
      const live = cloud ? (cloud[n] ? cloud[n].live : null) : local[n] ? local[n].live : null;
      out[n] = { hi, live };
    });
    return out;
  }
  function evmTop(own) {
    const all = evmLocalAll(own);
    return Math.max(-1, ...Object.keys(all).flatMap((chain) => Object.keys(all[chain]).map(Number)));
  }
  function evmMarks(marks, ahead) {
    const out = new Map();
    if (!marks || typeof marks !== 'object') return out;
    const rows = Array.isArray(marks) ? marks : marks instanceof Map ? [...marks].map(([address, hi]) => ({ address, hi })) : Object.keys(marks).map((address) => ({ address, hi: marks[address] }));
    rows.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const hi = typeof row.hi === 'string' && /^\d{1,15}$/.test(row.hi) ? Number(row.hi) : row.hi;
      const n = Number.isInteger(row.n) ? row.n : typeof row.address === 'string' ? ahead.indexOf(row.address.toLowerCase()) : -1;
      if (evmOrderSlot(n) && Number.isSafeInteger(hi) && hi >= 0) out.set(n, Math.max(out.has(n) ? out.get(n) : -1, hi));
    });
    return out;
  }
  function evmAheadRead(own, m) {
    let rec = null;
    try { rec = JSON.parse(orderLocalGet(EVM_AHEAD_LOCAL + own) || 'null'); } catch (_) { rec = null; }
    if (!rec || !m || rec.m !== m || !Array.isArray(rec.a) || rec.a.length > EVM_ORDER_SLOTS) return [];
    return rec.a.every((one) => typeof one === 'string' && EVM_ADDRESS.test(one) && one !== m) ? rec.a : [];
  }
  const evmAheadWant = (own, room, top) => Math.min(EVM_ORDER_SLOTS, Math.max(evmTop(own), evmOrderSlot(top) ? top : -1) + 1 + room);
  const evmAheadShort = (own, m, top) => evmAheadRead(own, m).length < evmAheadWant(own, ORDER_LOW, top);
  async function evmAheadFill(lib, words, own, m, top) {
    const have = evmAheadRead(own, m);
    const want = evmAheadWant(own, ORDER_AHEAD, top);
    if (have.length >= want) return;
    const got = await evmOrderDerive(lib, words, Array.from({ length: want - have.length }, (_, i) => have.length + i), false);
    orderLocalPut(EVM_AHEAD_LOCAL + own, JSON.stringify({ m, a: have.concat(got.map((one) => one.address)) }));
  }

  function solRecParse(text) {
    let v = null;
    try { v = JSON.parse(text || 'null'); } catch (_) { return null; }
    if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.a !== 'string' || !NET_ADDRESS.sol.test(v.a) || !Number.isSafeInteger(v.t) || v.t < 0) return null;
    const field = (value, re) => (value === undefined ? '' : typeof value === 'string' && re.test(value) ? value : null);
    const mint = field(v.m, NET_ADDRESS.sol), units = field(v.u, ORDER_UNITS), out = field(v.o, ORDER_OUT), live = field(v.l, ORDER_LIVE);
    if (mint === null || units === null || out === null || live === null || !(v.x === undefined || v.x === 1)) return null;
    return { address: v.a, at: v.t, mint, units, out, live: live || null, void: v.x === 1 };
  }
  function solRecText(rec) {
    const out = { a: rec.address, t: rec.at };
    if (rec.mint) out.m = rec.mint;
    if (rec.units) out.u = rec.units;
    if (rec.out) out.o = rec.out;
    if (rec.live) out.l = rec.live;
    if (rec.void) out.x = 1;
    return JSON.stringify(out);
  }
  function solLocal(own) {
    let rec = null;
    try { rec = JSON.parse(orderLocalGet(SOL_ORDER_LOCAL + own) || 'null'); } catch (_) { rec = null; }
    const out = { n: 0, h: {} };
    if (!rec || typeof rec !== 'object') return out;
    if (Number.isInteger(rec.n) && rec.n >= 0 && rec.n <= SOL_ORDER_LIMIT) out.n = rec.n;
    if (rec.h && typeof rec.h === 'object') {
      Object.keys(rec.h).forEach((k) => {
        const one = SOL_INDEX_TEXT.test(k) && solOrderIndex(Number(k)) && typeof rec.h[k] === 'string' ? solRecParse(rec.h[k]) : null;
        if (!one) return;
        out.h[k] = one;
        out.n = Math.max(out.n, Number(k) + 1);
      });
    }
    return out;
  }
  function solLocalSave(own, rec) {
    const kept = Object.keys(rec.h).map(Number).sort((a, b) => a - b).slice(-SOL_ORDER_LOCAL_KEEP).map((n) => [n, solRecText(rec.h[n])]);
    orderLocalPut(SOL_ORDER_LOCAL + own, JSON.stringify({ n: rec.n, h: Object.fromEntries(kept) }));
  }
  async function solOrderList(own) {
    const store = cloudStore();
    const hex = orderHexOf(own);
    const none = { heard: false, indexes: [] };
    if (!store || !hex || typeof store.getKeys !== 'function') return none;
    try {
      const [err, keys] = await tgCall((done) => store.getKeys(done), cloudMs());
      if (err || !Array.isArray(keys)) return none;
      const head = SOL_ORDER_CLOUD + hex + '_';
      const indexes = new Set();
      keys.forEach((key) => {
        const rest = typeof key === 'string' && key.startsWith(head) ? key.slice(head.length) : '';
        if (SOL_INDEX_TEXT.test(rest) && solOrderIndex(Number(rest))) indexes.add(Number(rest));
      });
      return { heard: true, indexes: [...indexes].sort((a, b) => a - b) };
    } catch (_) {
      return none;
    }
  }
  const solNext = (local, indexes) => Math.max(local.n, indexes.length ? indexes[indexes.length - 1] + 1 : 0);
  function solAheadRead(own, sol) {
    let rec = null;
    try { rec = JSON.parse(orderLocalGet(SOL_AHEAD_LOCAL + own) || 'null'); } catch (_) { rec = null; }
    if (!rec || !sol || rec.sol !== sol || !solOrderIndex(rec.from) || !Array.isArray(rec.a) || !rec.a.length || rec.a.length > ORDER_LIST_MAX) return null;
    return rec.a.every((one) => typeof one === 'string' && NET_ADDRESS.sol.test(one) && one !== sol) ? rec : null;
  }
  function solAheadShort(own, sol) {
    const rec = solAheadRead(own, sol);
    const next = solLocal(own).n;
    return !rec || next < rec.from || next + ORDER_LOW > rec.from + rec.a.length;
  }
  async function solAheadFill(netLib, words, own, sol) {
    if (!solAheadShort(own, sol)) return;
    const from = solLocal(own).n;
    const count = Math.min(ORDER_AHEAD, SOL_ORDER_LIMIT - from);
    if (count < 1) return;
    const list = await solOrderDerive(netLib, words, Array.from({ length: count }, (_, i) => from + i), false);
    orderLocalPut(SOL_AHEAD_LOCAL + own, JSON.stringify({ sol, from, a: list.map((one) => one.address) }));
  }

  function orderTicket(family, chain, n, planAt, slot, undo) {
    const token = {};
    orderLastWrite.set(slot, token);
    let state = 'open';
    let gone = null;
    const stale = () => Date.now() - planAt > PLAN_LIFE_MS;
    const forget = () => {
      if (state === 'sent') return Promise.resolve();
      if (!gone) {
        state = 'gone';
        gone = orderSerial(async () => {
          if (orderLastWrite.get(slot) !== token) return;
          await undo();
          orderLastWrite.delete(slot);
        }).catch(() => null);
      }
      return gone.then(() => undefined);
    };
    return Object.freeze({
      family, chain, n,
      stale,
      sent: () => state === 'sent',
      async keep() {
        if (state === 'gone') throw fail('quote_stale');
        if (stale()) {
          if (state === 'open') await forget();
          throw fail('quote_stale');
        }
        state = 'sent';
      },
      forget
    });
  }
  function orderPlanAt(entry) {
    const planAt = entry.planAt;
    if (typeof planAt !== 'number' || !Number.isFinite(planAt) || planAt > Date.now() + 1000) throw fail('bad_intent');
    if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale');
    return planAt;
  }
  async function evmOrderTake(ctx, entry) {
    const e = entry && typeof entry === 'object' ? entry : {};
    const c = orderNet(e.chain);
    const { n, hi, from } = e;
    if (!c || c.family !== 'evm' || !evmOrderSlot(n) || !Number.isSafeInteger(hi) || hi < 0) throw fail('bad_intent');
    if (!(e.live === undefined || e.live === null || (typeof e.live === 'string' && ORDER_LIVE.test(e.live)))) throw fail('bad_intent');
    if (!(from === undefined || (Number.isSafeInteger(from) && from >= 0 && from <= hi))) throw fail('bad_intent');
    const planAt = orderPlanAt(e);
    const own = ctx.own;
    const hex = orderHexOf(own);
    if (!hex) throw fail('no_wallet');
    const key = evmOrderCloudKey(hex, c.chain);
    return orderSerial(async () => {
      if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale');
      const cloud = evmSlotsParse(await orderCloudGet(key));
      if (!cloud) throw fail('storage_failed');
      const local = evmLocalSlots(own, c.chain);
      const was = { cloud: cloud[n] || null, local: local[n] || null };
      const signed = Math.max(was.cloud ? was.cloud.hi : -1, was.local ? was.local.hi : -1);
      if (from !== undefined && signed >= from) throw fail('xorder_no_slot', { reason: 'used' });
      const put = { hi: Math.max(hi, signed), live: e.live === undefined ? (was.cloud ? was.cloud.live : null) : e.live };
      cloud[n] = put;
      const text = evmSlotsText(cloud);
      if (text.length > CLOUD_VALUE_MAX) throw fail('xorder_no_slot', { reason: 'full' });
      await orderCloudPut(key, text);
      evmLocalSave(own, c.chain, { ...local, [n]: put });
      return orderTicket('evm', c.chain, n, planAt, 'evm:' + c.chain + ':' + n, async () => {
        const mine = evmLocalSlots(own, c.chain);
        if (mine[n] && mine[n].hi === put.hi && mine[n].live === put.live) {
          if (was.local) mine[n] = was.local;
          else delete mine[n];
          evmLocalSave(own, c.chain, mine);
        }
        const now = evmSlotsParse(await orderCloudGet(key));
        if (!now || !now[n] || now[n].hi !== put.hi || now[n].live !== put.live) return;
        if (was.cloud) now[n] = was.cloud;
        else delete now[n];
        if (Object.keys(now).length) await orderCloudPut(key, evmSlotsText(now));
        else await orderCloudDrop(key);
      });
    });
  }
  async function solOrderTake(ctx, entry) {
    const e = entry && typeof entry === 'object' ? entry : {};
    const n = e.n;
    const field = (value, re) => (value === undefined || value === null || value === '' ? '' : typeof value === 'string' && re.test(value) ? value : null);
    const fields = { mint: field(e.mint, NET_ADDRESS.sol), units: field(typeof e.units === 'bigint' ? e.units.toString() : e.units, ORDER_UNITS), out: field(e.out, ORDER_OUT), live: field(e.live, ORDER_LIVE) };
    if (!solOrderIndex(n) || Object.values(fields).some((one) => one === null)) throw fail('bad_intent');
    const planAt = orderPlanAt(e);
    const own = ctx.own;
    const hex = orderHexOf(own);
    if (!hex) throw fail('no_wallet');
    const [one] = await solOrderDerive(ctx.lib, ctx.words, [n], false);
    const key = solOrderCloudKey(hex, n);
    return orderSerial(async () => {
      if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale');
      const list = await solOrderList(own);
      if (!list.heard) throw fail('storage_failed');
      const local = solLocal(own);
      if (list.indexes.includes(n) || local.h[n]) throw fail('xorder_no_slot', { reason: 'taken' });
      if (n < solNext(local, list.indexes)) throw fail('xorder_no_slot', { reason: 'used' });
      if (list.indexes.length >= SOL_ORDER_KEYS_MAX) throw fail('xorder_no_slot', { reason: 'full' });
      const rec = { address: one.address, at: nowSeconds(), mint: fields.mint, units: fields.units, out: fields.out, live: fields.live || null, void: false };
      local.h[n] = rec;
      local.n = Math.max(local.n, n + 1);
      solLocalSave(own, local);
      if (!(await orderCloudSet(key, solRecText(rec)))) throw fail('xorder_no_slot', { reason: 'taken' });
      return orderTicket('sol', 'sol', n, planAt, 'sol:' + n, async () => {
        const gave = { ...rec, live: null, void: true };
        const mine = solLocal(own);
        if (mine.h[n] && mine.h[n].address === rec.address && mine.h[n].at === rec.at) {
          mine.h[n] = gave;
          solLocalSave(own, mine);
        }
        const now = solRecParse(await orderCloudGet(key));
        if (now && now.address === rec.address && now.at === rec.at && !now.void) await orderCloudPut(key, solRecText(gave));
      });
    });
  }
  async function solOrderDrop(ctx, n) {
    if (!solOrderIndex(n)) throw fail('bad_intent');
    const hex = orderHexOf(ctx.own);
    if (!hex) throw fail('no_wallet');
    return orderSerial(async () => {
      const list = await solOrderList(ctx.own);
      if (!list.heard) throw fail('storage_failed');
      if (!list.indexes.includes(n)) return false;
      if (n === list.indexes[list.indexes.length - 1]) throw fail('bad_intent', { reason: 'newest' });
      const key = solOrderCloudKey(hex, n);
      const rec = solRecParse(await orderCloudGet(key));
      if (rec && rec.live) throw fail('bad_intent', { reason: 'live' });
      await orderCloudDrop(key);
      const local = solLocal(ctx.own);
      delete local.h[n];
      solLocalSave(ctx.own, local);
      return true;
    });
  }

  async function evmOrderFound(ctx) {
    const hex = orderHexOf(ctx.own);
    const chains = Object.keys(EVM_ORDER_CHAINS);
    const values = hex ? await orderCloudValues(chains.map((chain) => evmOrderCloudKey(hex, chain))) : null;
    let heard = !!values;
    const found = [];
    chains.forEach((chain) => {
      const cloud = values ? evmSlotsParse(values[evmOrderCloudKey(hex, chain)]) : null;
      if (values && !cloud) heard = false;
      const slots = evmSlotsMerge(cloud, evmLocalSlots(ctx.own, chain), null);
      Object.keys(slots).forEach((n) => found.push({ chain, n: Number(n), hi: slots[n].hi, live: slots[n].live }));
    });
    const ns = [...new Set(found.map((one) => one.n))].sort((a, b) => a - b);
    if (!ctx.open) throw fail('bad_intent');
    const derived = new Map((ns.length ? await evmOrderDerive(ctx.lib, ctx.words, ns, false) : []).map((one) => [one.n, one.address]));
    return Object.freeze({ heard, slots: Object.freeze(found.map((one) => Object.freeze({ ...one, path: orderPath('evm', one.n), address: derived.get(one.n) }))) });
  }
  async function solOrderFound(ctx) {
    const hex = orderHexOf(ctx.own);
    const list = await solOrderList(ctx.own);
    const values = list.heard ? (list.indexes.length ? await orderCloudValues(list.indexes.map((n) => solOrderCloudKey(hex, n))) : {}) : null;
    const local = solLocal(ctx.own);
    const recs = new Map(Object.keys(local.h).map((k) => [Number(k), local.h[k]]));
    if (values) {
      list.indexes.forEach((n) => {
        const one = solRecParse(values[solOrderCloudKey(hex, n)]);
        if (one || !recs.has(n)) recs.set(n, one);
      });
    }
    const ns = [...recs.keys()].sort((a, b) => a - b);
    if (!ctx.open) throw fail('bad_intent');
    const derived = new Map((ns.length ? await solOrderDerive(ctx.lib, ctx.words, ns, false) : []).map((one) => [one.n, one.address]));
    const slots = ns.map((n) => {
      const rec = recs.get(n) || { mint: '', units: '', out: '', live: null, at: 0, void: false };
      return Object.freeze({ n, path: orderPath('sol', n), address: derived.get(n), mint: rec.mint, units: rec.units, out: rec.out, live: rec.live, at: rec.at, void: rec.void });
    });
    return Object.freeze({ heard: list.heard && !!values, slots: Object.freeze(slots) });
  }

  const orderWanted = new Map();
  const orderWant = (family, own, top) => {
    const name = family + ':' + own;
    orderWanted.set(name, Math.max(orderWanted.has(name) ? orderWanted.get(name) : -1, Number.isInteger(top) ? top : -1));
  };
  async function orderFill(family, own, top) {
    try {
      const blob = await activeBlob();
      if (blob.a !== own) return false;
      if (blob.w !== 'keychain' || signing) {
        orderWant(family, own, top);
        return false;
      }
      let read = false;
      await openSealed(blob, undefined, async ({ lib, words }) => {
        if (!multiNet(lib.mnemonicWordList, words)) return;
        const api = netApi(family);
        const netLib = await api.bundle();
        const main = (family === 'evm' ? evmOwnRead(own) : netOwnRead('sol', own)) || (await api.deriveAddress(netLib, words));
        if (family === 'evm') {
          evmOwnWrite(own, main);
          await evmAheadFill(netLib, words, own, main, top);
        } else {
          netOwnWrite('sol', own, main);
          await solAheadFill(netLib, words, own, main);
        }
        read = true;
      }, true);
      return read;
    } catch (_) {
      orderWant(family, own, top);
      return false;
    }
  }
  async function evmOrderLook(own, chain, marks) {
    const hex = orderHexOf(own);
    const cloud = await orderCloudGet(evmOrderCloudKey(hex, chain)).then(evmSlotsParse, () => null);
    let local = evmLocalSlots(own, chain);
    if (cloud) {
      local = evmSlotsMerge(cloud, local, null);
      evmLocalSave(own, chain, local);
    }
    const m = evmOwnRead(own);
    const ahead = evmAheadRead(own, m);
    const slots = evmSlotsMerge(cloud, local, evmMarks(marks, ahead));
    const used = Object.keys(slots).map(Number).map((n) => (slots[n].live ? { n, address: ahead[n] || null, hi: slots[n].hi, live: slots[n].live } : { n, address: ahead[n] || null, hi: slots[n].hi }));
    const free = [];
    for (let n = 0; n < ahead.length && free.length < ORDER_AHEAD; n++) if (!slots[n]) free.push({ n, address: ahead[n] });
    const top = Math.max(-1, ...used.map((row) => row.n));
    const short = !m || ahead.length < evmAheadWant(own, ORDER_LOW, top);
    return { rows: Object.freeze([...used, ...free].map((row) => Object.freeze(row))), short, top };
  }
  async function solOrderLook(own) {
    const hex = orderHexOf(own);
    const list = await solOrderList(own);
    const local = solLocal(own);
    const recs = new Map(Object.keys(local.h).map((k) => [Number(k), local.h[k]]));
    const missing = list.indexes.filter((n) => !recs.has(n));
    const values = missing.length ? await orderCloudValues(missing.map((n) => solOrderCloudKey(hex, n))) : null;
    missing.forEach((n) => {
      const one = values ? solRecParse(values[solOrderCloudKey(hex, n)]) : null;
      recs.set(n, one);
      if (one) local.h[n] = one;
    });
    const next = solNext(local, list.indexes);
    if (list.heard && (next !== local.n || missing.length)) {
      local.n = next;
      solLocalSave(own, local);
    }
    const sol = netOwnRead('sol', own);
    const ahead = solAheadRead(own, sol);
    const used = [...recs.keys()].sort((a, b) => a - b).map((n) => {
      const rec = recs.get(n);
      return rec && rec.live ? { n, address: rec.address, live: rec.live } : { n, address: rec ? rec.address : null };
    });
    const free = [];
    if (ahead) for (let i = 0; i < ahead.a.length && free.length < ORDER_AHEAD; i++) if (ahead.from + i >= next && !recs.has(ahead.from + i)) free.push({ n: ahead.from + i, address: ahead.a[i] });
    return { rows: Object.freeze([...used, ...free].map((row) => Object.freeze(row))), short: !sol || solAheadShort(own, sol), top: -1 };
  }
  async function orderAddresses(chain, options) {
    const opts = options || {};
    const c = orderNet(chain);
    if (!c) throw fail('bad_intent');
    const own = (T.wallet && T.wallet.address) || null;
    if (!orderHexOf(own)) throw fail('no_wallet');
    if (opts.wallet && opts.wallet !== own) throw fail('wallet_changed');
    const look = () => (c.family === 'evm' ? evmOrderLook(own, c.chain, opts.marks) : solOrderLook(own));
    let seen = await look();
    if (seen.short && opts.fill !== false && (await orderFill(c.family, own, seen.top))) seen = await look();
    return seen.rows;
  }
  function orderLive(chain, n, id, options) {
    const c = orderNet(chain);
    const own = (T.wallet && T.wallet.address) || null;
    const hex = orderHexOf(own);
    const opts = options || {};
    if (!c || !(id === null || (typeof id === 'string' && ORDER_LIVE.test(id))) || !(c.family === 'evm' ? evmOrderSlot(n) : solOrderIndex(n))) return Promise.reject(fail('bad_intent'));
    if (!hex) return Promise.reject(fail('no_wallet'));
    if (opts.wallet && opts.wallet !== own) return Promise.reject(fail('wallet_changed'));
    return orderSerial(async () => {
      if (c.family === 'evm') {
        const key = evmOrderCloudKey(hex, c.chain);
        const cloud = evmSlotsParse(await orderCloudGet(key));
        if (!cloud) throw fail('storage_failed');
        const local = evmLocalSlots(own, c.chain);
        if (!cloud[n] && !local[n]) throw fail('bad_intent');
        const put = { hi: Math.max(cloud[n] ? cloud[n].hi : -1, local[n] ? local[n].hi : -1), live: id };
        orderLastWrite.set('evm:' + c.chain + ':' + n, {});
        if (!cloud[n] || cloud[n].hi !== put.hi || cloud[n].live !== id) {
          cloud[n] = put;
          const text = evmSlotsText(cloud);
          if (text.length > CLOUD_VALUE_MAX) throw fail('xorder_no_slot', { reason: 'full' });
          await orderCloudPut(key, text);
        }
        evmLocalSave(own, c.chain, { ...local, [n]: put });
        return;
      }
      const key = solOrderCloudKey(hex, n);
      const rec = solRecParse(await orderCloudGet(key));
      if (!rec || (rec.void && id)) throw fail('bad_intent');
      const put = { ...rec, live: id };
      orderLastWrite.set('sol:' + n, {});
      if (rec.live !== id) await orderCloudPut(key, solRecText(put));
      const local = solLocal(own);
      local.h[n] = put;
      local.n = Math.max(local.n, n + 1);
      solLocalSave(own, local);
    });
  }

  let othersJob = null;
  function deriveOthers(words, own) {
    if (!own || !Array.isArray(words) || !WORD_COUNTS.includes(words.length)) return othersJob;
    const copy = words.slice();
    const size = copy.length;
    const whole = () => copy.length === size && copy.every((word) => typeof word === 'string' && word.length > 0);
    othersJob = (async () => {
      const lib = await bundle();
      if (!whole() || !multiNet(lib.mnemonicWordList, copy)) return;
      for (const name of Object.keys(NET_API)) {
        try {
          const api = netApi(name);
          const netLib = await api.bundle();
          if (!whole()) return;
          const derived = await api.deriveAddress(netLib, copy);
          if (name === 'evm') {
            evmOwnWrite(own, derived);
            await evmRecordWrite(own, derived).catch(() => null);
          } else netOwnWrite(name, own, derived);
          if (name === 'sol' && whole()) await netAltWrite(api, netLib, copy, own, derived);
          if (name === 'sol' && whole() && holdShort(own)) await holdFill(api, netLib, copy, own, derived).catch(() => null);
        } catch (err) {
          console.warn(`wallet: the ${name} address waits for an unlock`, err && (err.code || err.message));
        }
      }
    })().catch((err) => console.warn('wallet: other addresses wait for an unlock', err && (err.code || err.message))).finally(() => copy.fill(''));
    return othersJob;
  }

  function relayAudit(lib, plan, owner) {
    const sol = !!plan && plan.chain === 'solana';
    const net = netApi(sol ? 'sol' : 'evm');
    const evm = netApi('evm');
    if (!net.auditBuy || !evm.depositBody || !evm.pins) throw fail('relay_refused', { reason: 'plan' });
    const audited = net.auditBuy(plan, { owner, maxUsd: plan && plan.maxUsd }, Date.now());
    if (audited.reason) throw fail('relay_refused', { reason: audited.reason });
    const body = evm.depositBody(lib, audited.body);
    if (!body) throw fail('relay_refused', { reason: 'body' });
    return { sol, net, audited, body };
  }
  async function relayRecipient(lib, r, plan, words, own) {
    const still = r.net.auditBuy(plan, { owner: own, maxUsd: plan && plan.maxUsd }, Date.now());
    if (still.reason) throw fail('relay_refused', { reason: still.reason });
    if (!multiNet(lib.mnemonicWordList, words)) throw fail('ton_only');
    const derived = await r.net.deriveAddress(await r.net.bundle(), words);
    if (r.sol) netOwnWrite('sol', own, derived);
    else evmOwnWrite(own, derived);
    if (derived !== r.audited.recipient) {
      if (!r.sol) await evmRecordWrite(own, derived).catch(() => null);
      throw fail('relay_refused', { reason: 'recipient' });
    }
    return derived;
  }
  const relayMessages = (lib, r) => [
    lib.internal({ to: lib.Address.parseRaw(netApi('evm').pins().depositoryRaw), value: r.audited.deposit, bounce: false, body: r.body }),
    lib.internal({ to: lib.Address.parseRaw(T.FEE_ADDRESS), value: r.audited.fee, bounce: false })
  ];
  async function signRelayDeposit(plan, options) {
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      const lib = await bundle();
      const r = relayAudit(lib, plan, blob.a);
      await r.net.bundle();
      const chain = await chainState(blob.a);
      if (chain.status === 'frozen') throw fail('frozen');
      const open = pendingAgainst(blob.a, chain);
      if (open) throw fail('pending', { pending: open });
      if (chain.balance === null) throw fail('balance_unknown');
      if (chain.balance < r.audited.total + SWAP_RESERVE_NANO) throw fail('insufficient_balance');
      return await withSecret(blob, (options || {}).password, async ({ keys, words }) => {
        stillActive(blob);
        const recipient = await relayRecipient(lib, r, plan, words, blob.a);
        const validUntil = nowSeconds() + VALID_S;
        const boc = externalOf(lib, keys, undefined, SEND_MODE, relayMessages(lib, r), chain, validUntil);
        const hash = (await T.messageHash(boc)) || '';
        pendingWrite(blob.a, { seqno: chain.seqno, hash, validUntil, boc });
        return { boc, hash, seqno: chain.seqno, validUntil, recipient, deposit: r.audited.deposit, fee: r.audited.fee };
      });
    } finally {
      signing = false;
    }
  }

  const USDT_MASTER_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const TWO_STEP_WAIT_MS = 150000;
  const TWO_STEP_VALID_S = 180;
  const TWO_STEP_FEE_ROOM = 50000000n;
  async function swapOutcome(hash) {
    try {
      const body = await T.api('swap/status?hash=' + encodeURIComponent(hash));
      return body && (body.status === 'success' || body.status === 'refunded') ? body.status : 'pending';
    } catch (_) {
      return 'pending';
    }
  }
  const STATUS_FALLBACK_MS = 45000;
  const jettonHeld = (own, master) => tokenRows(own).then((rows) => {
    const row = rows.find((one) => one && T.rawAddress(one.token) === master);
    return row ? T.parseUnits(String(row.units)) : rows.length ? 0n : null;
  }, () => null);
  async function twoSteps(first, then, options, onStep, names) {
    if (signing) throw fail('busy');
    signing = true;
    const step = (name, info) => { try { if (onStep) onStep(name, info); } catch (_) { } };
    const failed = (left, firstHash) => fail(names.failed, { left: left === 'offer' ? names.offerLeft : left, [names.firstHashKey]: firstHash });
    try {
      const intent = first && first.intent;
      if (!intent || intent.ask !== 'TON' || typeof intent.minOut !== 'bigint' || intent.minOut <= 0n) throw fail('swap_refused', { reason: 'pair' });
      if (names.check) names.check(intent);
      const blob = await activeBlob((quotedFor(intent, options) || {}).wallet);
      const lib = await bundle();
      const swap = readAudited(lib, first.built, intent, blob.a);
      bodyOf(lib, swap);
      let r = null, second = null, secondUnits;
      if (then && then.kind === 'relay') {
        r = relayAudit(lib, then.plan, blob.a);
        secondUnits = r.audited.total;
        if (secondUnits > intent.minOut) throw fail('relay_refused', { reason: 'not_covered' });
        await r.net.bundle();
      } else if (then && then.kind === 'swap') {
        const next = then.intent;
        if (!next || next.offer !== 'TON' || next.ask === 'TON' || typeof next.units !== 'bigint') throw fail('swap_refused', { reason: 'pair' });
        if (next.units > intent.minOut) throw fail('swap_refused', { reason: 'amount' });
        second = readAudited(lib, then.built, next, blob.a);
        bodyOf(lib, second);
        secondUnits = next.units;
      } else throw fail('bad_intent');
      if (secondUnits <= swap.amount + TWO_STEP_FEE_ROOM) throw fail(r ? 'relay_refused' : 'swap_refused', { reason: 'amount' });
      const swipedAt = intent.swipedAt || Date.now();
      let chain = await chainForSend(blob.a, swap.needs + SWAP_RESERVE_NANO);
      const offerBefore = await jettonHeld(blob.a, intent.offer);
      const checkedAt = Date.now();
      const signed = await withSecret(blob, (options || {}).password, async ({ keys, words }) => {
        stillActive(blob);
        if (Date.now() - swipedAt > SWAP_UNLOCK_MS) throw fail('swap_refused', { reason: 'stale' });
        readAudited(lib, first.built, intent, blob.a);
        const recipient = r ? await relayRecipient(lib, r, then.plan, words, blob.a) : null;
        if (second) readAudited(lib, then.built, then.intent, blob.a);
        if (Date.now() - checkedAt > CHAIN_FRESH_MS) chain = await chainForSend(blob.a, swap.needs + SWAP_RESERVE_NANO);
        const one = { seqno: chain.seqno, validUntil: nowSeconds() + VALID_S };
        one.boc = buildSigned(lib, keys, swap, chain, one.validUntil);
        const two = { seqno: chain.seqno + 1, validUntil: nowSeconds() + TWO_STEP_VALID_S };
        const nextChain = { seqno: two.seqno, status: 'active' };
        two.boc = r ? externalOf(lib, keys, undefined, SEND_MODE, relayMessages(lib, r), nextChain, two.validUntil) : buildSigned(lib, keys, second, nextChain, two.validUntil);
        one.hash = (await T.messageHash(one.boc)) || '';
        two.hash = (await T.messageHash(two.boc)) || '';
        pendingWrite(blob.a, { seqno: one.seqno, hash: one.hash, validUntil: one.validUntil, boc: one.boc });
        return { first: one, second: two, recipient, before: chain.balance };
      });
      const sent1 = signed.first, sent2 = signed.second;
      try {
        await broadcast(sent1.boc);
      } catch (err) {
        if (SEND_FINAL.has(err.code)) {
          pendingClear(blob.a);
          throw failed('offer', sent1.hash);
        }
      }
      step(names.firstSent, { hash: sent1.hash, seqno: sent1.seqno, validUntil: sent1.validUntil });
      const floor = signed.before - swap.amount - TWO_STEP_FEE_ROOM + secondUnits;
      const need = r ? secondUnits + SWAP_RESERVE_NANO : second.needs;
      const end = Math.min(Date.now() + TWO_STEP_WAIT_MS, (sent2.validUntil - EXPIRY_MARGIN_S) * 1000);
      const fallbackAt = Date.now() + STATUS_FALLBACK_MS;
      let landed = false, ready = false, outcome = 'pending';
      while (Date.now() < end) {
        await new Promise((resolve) => setTimeout(resolve, GAS_POLL_MS));
        const now = await chainState(blob.a).catch(() => null);
        if (!now || now.balance === null) continue;
        if (now.seqno > sent2.seqno) break;
        if (now.seqno > sent1.seqno) landed = true;
        else if (nowSeconds() > sent1.validUntil + EXPIRY_MARGIN_S) break;
        if (!landed) continue;
        outcome = await swapOutcome(sent1.hash);
        if (outcome === 'refunded') break;
        const grown = now.balance >= floor && now.balance >= need;
        if (outcome === 'success' && grown) {
          ready = true;
          break;
        }
        if (grown && offerBefore !== null && Date.now() >= fallbackAt) {
          const offerNow = await jettonHeld(blob.a, intent.offer);
          if (offerNow !== null && offerBefore - offerNow >= intent.units) {
            ready = true;
            break;
          }
        }
      }
      if (!ready) {
        if (!landed) {
          const after = await chainState(blob.a).catch(() => null);
          landed = !!after && after.seqno > sent1.seqno;
        }
        const gone = outcome === 'refunded' || (!landed && nowSeconds() > sent1.validUntil + EXPIRY_MARGIN_S);
        throw failed(gone ? 'offer' : 'unknown', sent1.hash);
      }
      step(names.landed);
      if (!activeIs(blob.a)) throw failed('gram', sent1.hash);
      if (typeof (options || {}).beforeSecond === 'function') {
        let go = false;
        try { go = (await options.beforeSecond()) === true; } catch (_) { go = false; }
        if (!go) throw fail(names.held || names.failed, { left: 'gram', [names.firstHashKey]: sent1.hash });
      }
      pendingWrite(blob.a, { seqno: sent2.seqno, hash: sent2.hash, validUntil: sent2.validUntil, boc: sent2.boc });
      try {
        await broadcast(sent2.boc);
      } catch (err) {
        if (SEND_FINAL.has(err.code)) {
          pendingClear(blob.a);
          throw failed('gram', sent1.hash);
        }
        throw fail(err.code || 'send_unsure', { [names.firstHashKey]: sent1.hash, hash: sent2.hash });
      }
      step(names.secondSent, { hash: sent2.hash, seqno: sent2.seqno, validUntil: sent2.validUntil });
      const out = { hash: sent2.hash, [names.firstHashKey]: sent1.hash, seqno: sent2.seqno };
      if (r) Object.assign(out, { requestId: (then.plan.view && then.plan.view.requestId) || null, recipient: signed.recipient, deposit: r.audited.deposit, fee: r.audited.fee });
      else Object.assign(out, { units: secondUnits, minOut: then.intent.minOut, validUntil: sent2.validUntil });
      return out;
    } finally {
      signing = false;
    }
  }
  function payRelayWithUsdt(built, intent, plan, options, onStep) {
    return twoSteps({ built, intent }, { kind: 'relay', plan }, options, onStep, {
      failed: 'usdt_step_failed', offerLeft: 'usdt', firstHashKey: 'swapHash', firstSent: 'swap_sent', landed: 'swapped', secondSent: 'deposit_sent',
      check(one) {
        if (one.offer !== USDT_MASTER_RAW) throw fail('swap_refused', { reason: 'pair' });
        if (one.feeBps !== 0) throw fail('swap_refused', { reason: 'fee_bps' });
      }
    });
  }
  function signRoute(first, then, options, onStep) {
    return twoSteps(first, then, options, onStep, {
      failed: 'route_step_failed', held: 'route_step_held', offerLeft: 'offer', firstHashKey: 'firstHash', firstSent: 'first_sent', landed: 'first_landed', secondSent: 'second_sent',
      check(one) {
        if (one.feeBps !== 0 && one.feeBps !== T.FEE_BPS) throw fail('swap_refused', { reason: 'fee_bps' });
      }
    });
  }

  const ORDER_RECORD_KEY = 'ck_order_seqnos';
  const ORDER_UNTIL_KEY = 'ck_order_until';
  const REUSE_AFTER_S = 3600;
  const publicKeyOf = (blob) => Uint8Array.from(blob.pk.match(/../g), (h) => parseInt(h, 16));
  const orderWalletOf = (lib, publicKey, subwallet) => contractOf(lib, publicKey, subwallet).address.toRawString();
  const subwalletList = () => Array.from({ length: CK.swapAudit.subwalletMax }, (_, i) => i + 1);
  const SWEEP_MODE = 130;
  const PLAN_LIFE_MS = 110000;
  const CREATE_UNSURE = new Set(['upstream', 'rate_limited', 'bad_response']);
  const RETURN_GAS_UNLISTED = 100000000n;
  const returnGasOf = (one) => (one.known && one.gas ? one.gas.each : RETURN_GAS_UNLISTED);
  const RETURN_FEE_ROOM = 10000000n;
  const RETURN_TOPUP_ROOM = 20000000n;
  const RETURN_TOKENS_MAX = 3;
  const GAS_WAIT_MS = 60000;
  const GAS_POLL_MS = 2500;
  let orderScanJob = null;

  async function orderRecordRead() {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [err, value] = await tgCall((done) => store.getItem(perWalletKey(ORDER_RECORD_KEY, activeExtra), done));
    if (err) throw fail('storage_failed');
    if (!value) return {};
    let record;
    try { record = JSON.parse(value); } catch (_) { throw fail('storage_failed'); }
    if (!record || typeof record !== 'object' || Object.values(record).some((seqno) => !Number.isInteger(seqno) || seqno < 0)) throw fail('storage_failed');
    return record;
  }
  async function orderUntilRead() {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [err, value] = await tgCall((done) => store.getItem(perWalletKey(ORDER_UNTIL_KEY, activeExtra), done));
    if (err) throw fail('storage_failed');
    if (!value) return {};
    let until;
    try { until = JSON.parse(value); } catch (_) { throw fail('storage_failed'); }
    if (!until || typeof until !== 'object' || Object.values(until).some((at) => !Number.isInteger(at) || at < 0)) throw fail('storage_failed');
    return until;
  }
  async function orderRecordWrite(subwallet, seqno, validUntil) {
    const store = cloudStore();
    const record = await orderRecordRead();
    if (!Number.isInteger(validUntil)) throw fail('storage_failed');
    const until = await orderUntilRead();
    const undated = record[subwallet] !== undefined && until[subwallet] === undefined;
    if (record[subwallet] === undefined || record[subwallet] < seqno) {
      record[subwallet] = seqno;
      const [err] = await tgCall((done) => store.setItem(perWalletKey(ORDER_RECORD_KEY, activeExtra), JSON.stringify(record), done));
      if (err) throw fail('storage_failed');
      if ((await orderRecordRead())[subwallet] !== seqno) throw fail('storage_failed');
    }
    if (undated || (until[subwallet] !== undefined && until[subwallet] >= validUntil)) return;
    until[subwallet] = validUntil;
    const [err] = await tgCall((done) => store.setItem(perWalletKey(ORDER_UNTIL_KEY, activeExtra), JSON.stringify(until), done));
    if (err) throw fail('storage_failed');
    if ((await orderUntilRead())[subwallet] !== validUntil) throw fail('storage_failed');
  }

  const ORDER_PRICES_KEY = 'ck_order_prices';
  const PRICES_HASH = /^[A-Za-z0-9_-]{16}$/;
  async function orderPricesHash({ offer, units, stopOut, takeOut }) {
    const text = [T.rawAddress(offer), units, stopOut || 0n, takeOut || 0n].map(String).join('|');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', utf8(text)));
    return btoa(String.fromCharCode(...digest.subarray(0, 12))).replace(/\+/g, '-').replace(/\//g, '_');
  }
  async function orderPricesRead() {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [err, value] = await tgCall((done) => store.getItem(perWalletKey(ORDER_PRICES_KEY, activeExtra), done));
    if (err) throw fail('storage_failed');
    if (!value) return {};
    let prices;
    try { prices = JSON.parse(value); } catch (_) { throw fail('storage_failed'); }
    if (!prices || typeof prices !== 'object' || Object.values(prices).some((hash) => typeof hash !== 'string' || !PRICES_HASH.test(hash))) throw fail('storage_failed');
    return prices;
  }
  async function orderPricesWrite(subwallet, hash) {
    const prices = await orderPricesRead();
    if (prices[subwallet] === hash) return;
    prices[subwallet] = hash;
    const [err] = await tgCall((done) => cloudStore().setItem(perWalletKey(ORDER_PRICES_KEY, activeExtra), JSON.stringify(prices), done));
    if (err) throw fail('storage_failed');
    if ((await orderPricesRead())[subwallet] !== hash) throw fail('storage_failed');
  }
  async function ownPricesHeld(subwallet, hash) {
    if ((await orderPricesRead())[subwallet] !== hash) throw fail('order_refused', { reason: 'prices' });
  }
  const pastItsDates = (subwallet, record, until) => record[subwallet] !== undefined && Number.isInteger(until[subwallet]) && nowSeconds() > until[subwallet] + REUSE_AFTER_S;
  function slotIsFree(row, signed, until) {
    if (row.busy || row.status === 'frozen' || row.jettons.length) return false;
    if (signed === undefined && row.seqno === 0) return true;
    return pastItsDates(row.subwallet, { [row.subwallet]: signed }, until || {});
  }

  async function orderRecordForget(subwallet, prior) {
    const was = prior || {};
    const store = cloudStore();
    const record = await orderRecordRead();
    if (record[subwallet] !== was.seqno) {
      if (was.seqno === undefined) delete record[subwallet];
      else record[subwallet] = was.seqno;
      await tgCall((done) => store.setItem(perWalletKey(ORDER_RECORD_KEY, activeExtra), JSON.stringify(record), done));
    }
    const until = await orderUntilRead();
    if (until[subwallet] !== was.until) {
      if (was.until === undefined) delete until[subwallet];
      else until[subwallet] = was.until;
      await tgCall((done) => store.setItem(perWalletKey(ORDER_UNTIL_KEY, activeExtra), JSON.stringify(until), done));
    }
    const prices = await orderPricesRead();
    if (prices[subwallet] !== was.prices) {
      if (was.prices === undefined) delete prices[subwallet];
      else prices[subwallet] = was.prices;
      await tgCall((done) => store.setItem(perWalletKey(ORDER_PRICES_KEY, activeExtra), JSON.stringify(prices), done));
    }
  }

  async function orderWallets() {
    const blob = await activeBlob();
    const lib = await bundle();
    const publicKey = publicKeyOf(blob);
    return subwalletList().map((subwallet) => {
      const address = orderWalletOf(lib, publicKey, subwallet);
      return { subwallet, address, friendly: T.friendlyAddress(address) };
    });
  }

  async function probeRows(wallets, timeout) {
    const body = await T.api('orders/slots', { body: { wallets: wallets.map((one) => one.address), probe: true }, timeout });
    return new Map((Array.isArray(body.slots) ? body.slots : []).filter((row) => row && typeof row.status === 'string').map((row) => [T.rawAddress(row.wallet), row]));
  }
  async function probeOrderWallets(wallets, timeout) {
    const rows = await probeRows(wallets, timeout);
    return wallets.map((one) => {
      const row = rows.get(one.address);
      if (!row) throw fail('state_unknown');
      return { ...one, status: row.status, balance: T.parseUnits(String(row.balance)) || 0n, busy: !!row.busy };
    });
  }

  const SCAN_PAGE = 4;
  const SCAN_PAGE_MS = 30000;
  async function readOrderWallets(wallets) {
    const probed = await probeOrderWallets(wallets, SCAN_PAGE_MS);
    const rows = await fullOrderRead(probed.filter((one) => one.status !== 'nonexist'));
    probed.forEach((one) => {
      if (one.status === 'nonexist') rows.set(one.address, { wallet: one.address, status: 'nonexist', balance: '0', seqno: 0, confirmed: true, jettons: [], busy: one.busy });
    });
    return rows;
  }
  async function fullOrderRead(wallets) {
    const rows = new Map();
    for (let at = 0; at < wallets.length; at += SCAN_PAGE) {
      const body = await T.api('orders/slots', { body: { wallets: wallets.slice(at, at + SCAN_PAGE).map((one) => one.address) }, timeout: SCAN_PAGE_MS });
      (Array.isArray(body.slots) ? body.slots : []).forEach((row) => { if (row) rows.set(T.rawAddress(row.wallet), row); });
    }
    return rows;
  }
  const fullRowKnown = (row) => !!row && Number.isInteger(row.seqno) && row.seqno >= 0;
  function slotOf(one, row, record, until) {
    if (!fullRowKnown(row)) throw fail('state_unknown');
    const held = (Array.isArray(row.jettons) ? row.jettons : []).filter((j) => T.parseUnits(j.units) > 0n);
    const signed = record[one.subwallet];
    const jettons = held.filter((j) => CK.swapAudit.orderOffer(T.rawAddress(j.token)) || signed !== undefined || row.seqno > 0);
    const balance = T.parseUnits(String(row.balance)) || 0n;
    const out = { ...one, status: row.status, balance, seqno: row.seqno, confirmed: row.confirmed === true, jettons, held, signed, busy: !!row.busy };
    return { ...out, funds: balance > 0n || jettons.length > 0, free: slotIsFree(out, signed, until) };
  }

  const PROBE_SIZE = 4;
  async function freeOrderSlots(blob, lib) {
    const record = await orderRecordRead();
    const until = await orderUntilRead();
    const publicKey = publicKeyOf(blob);
    const unused = subwalletList().filter((subwallet) => record[subwallet] === undefined).map((subwallet) => ({ subwallet, address: orderWalletOf(lib, publicKey, subwallet) }));
    let unknown = false;
    const onChain = [];
    for (const page of [unused.slice(0, PROBE_SIZE), unused.slice(PROBE_SIZE)]) {
      if (!page.length) continue;
      const rows = await probeRows(page, page.length > PROBE_SIZE ? SCAN_PAGE_MS : undefined);
      const free = [];
      page.forEach((one) => {
        const row = rows.get(one.address);
        if (!row) unknown = true;
        else if (!row.busy) (row.status === 'nonexist' ? free : onChain).push(one);
      });
      if (free.length) return free.slice(0, PROBE_SIZE);
    }
    const used = subwalletList().filter((subwallet) => pastItsDates(subwallet, record, until)).map((subwallet) => ({ subwallet, address: orderWalletOf(lib, publicKey, subwallet) }));
    for (const list of [onChain, used]) {
      for (let at = 0; at < list.length; at += SCAN_PAGE) {
        const page = list.slice(at, at + SCAN_PAGE);
        const rows = await fullOrderRead(page);
        const free = [];
        page.forEach((one) => {
          const row = rows.get(one.address);
          if (!fullRowKnown(row)) unknown = true;
          else {
            const slot = slotOf(one, row, record, until);
            if (slot.free) free.push(slot);
          }
        });
        if (free.length) return free;
      }
    }
    if (unknown) throw fail('state_unknown');
    return [];
  }

  async function scanOrderWallets() {
    await T.config();
    const wallets = await orderWallets();
    const rows = await readOrderWallets(wallets);
    const record = await orderRecordRead();
    const until = await orderUntilRead();
    return wallets.map((one) => slotOf(one, rows.get(one.address), record, until));
  }

  async function tokenRows(address) {
    try {
      const body = await T.api('wallet/balances?address=' + encodeURIComponent(address));
      return Array.isArray(body.balances) ? body.balances : [];
    } catch (_) {
      throw fail('balance_unknown');
    }
  }

  async function signOrder(plan, intent, options) {
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      const lib = await bundle();
      const own = blob.a;
      const publicKey = publicKeyOf(blob);
      const orderWallet = plan && Number.isInteger(plan.subwallet) && plan.subwallet >= 1 && plan.subwallet <= CK.swapAudit.subwalletMax ? orderWalletOf(lib, publicKey, plan.subwallet) : null;
      if (!orderWallet) throw fail('order_refused', { reason: 'subwallet' });
      const rows = await tokenRows(own);
      const offerRow = rows.find((row) => T.rawAddress(row.token) === intent.offer);
      const otherWallets = rows.filter((row) => row !== offerRow && row.wallet).map((row) => T.rawAddress(row.wallet));
      const audited = CK.swapAudit.auditOrder(lib, plan, { ...intent, owner: own, orderWallet, otherWallets }, nowSeconds());
      if (audited.reason) throw fail('order_refused', { reason: audited.reason });
      if (!offerRow || (T.parseUnits(offerRow.units) || 0n) < intent.units) throw fail('insufficient_balance');

      const chain = await chainState(own);
      if (chain.status === 'frozen') throw fail('frozen');
      const open = pendingAgainst(own, chain);
      if (open) throw fail('pending', { pending: open });
      if (chain.balance === null) throw fail('balance_unknown');
      if (chain.balance < audited.fundingValue + SWAP_RESERVE_NANO) throw fail('insufficient_gas');

      const orderChain = await chainState(orderWallet);
      if (orderChain.status === 'frozen') throw fail('frozen');
      if (orderChain.seqno !== plan.seqno) throw fail('order_refused', { reason: 'seqno' });
      const record = await orderRecordRead();
      if (record[plan.subwallet] !== undefined || orderChain.seqno !== 0) {
        if (!pastItsDates(plan.subwallet, record, await orderUntilRead())) throw fail('subwallet_busy');
        if (pendingAgainst(orderWallet, orderChain)) throw fail('subwallet_busy');
        const row = (await fullOrderRead([{ address: orderWallet }])).get(orderWallet);
        if (!fullRowKnown(row)) throw fail('state_unknown');
        if (row.busy || (Array.isArray(row.jettons) ? row.jettons : []).some((j) => T.parseUnits(j.units) > 0n)) throw fail('subwallet_busy');
      }
      const prices = await orderPricesHash(intent);

      return await withSecret(blob, (options || {}).password, async ({ keys }) => {
        stillActive(blob);
        await orderRecordWrite(plan.subwallet, plan.seqno, plan.validUntil);
        await orderPricesWrite(plan.subwallet, prices);
        const validUntil = nowSeconds() + VALID_S;
        const funding = buildSigned(lib, keys, {
          kind: 'jetton', to: audited.fundingWallet, amount: audited.fundingValue, bounce: true,
          recipient: orderWallet, owner: own, units: intent.units, forward: audited.walletGas
        }, chain, validUntil);
        const hash = (await T.messageHash(funding)) || '';
        pendingWrite(own, { seqno: chain.seqno, hash, validUntil, boc: funding });

        const orderBoc = (message) => buildSigned(lib, keys, {
          kind: 'swap', subwallet: plan.subwallet, to: T.rawAddress(message.address), amount: audited.attached, bounce: true, payload: message.payload
        }, orderChain, plan.validUntil);
        return {
          funding: { boc: funding, hash, seqno: chain.seqno, validUntil },
          stops: plan.stops.map(orderBoc),
          take: plan.take ? orderBoc(plan.take) : null,
          floors: audited.floors,
          takeOut: audited.take,
          jettonWallet: audited.jettonWallet,
          seqno: plan.seqno,
          validUntil: plan.validUntil
        };
      });
    } finally {
      signing = false;
    }
  }

  async function placeOrder(intent, options) {
    await T.config();
    const blob = await activeBlob((options || {}).wallet);
    const free = await freeOrderSlots(blob, await bundle());
    if (!free.length) throw fail('no_free_slot');
    let plan = null, slot = null, planAt = 0;
    for (const one of free) {
      planAt = Date.now();
      try {
        plan = await T.api('orders/plan', {
          body: {
            wallet: blob.a,
            publicKey: blob.pk,
            subwallet: one.subwallet,
            offer: intent.offer,
            units: intent.units.toString(),
            stopOut: intent.stopOut ? intent.stopOut.toString() : null,
            takeOut: intent.takeOut ? intent.takeOut.toString() : null
          }
        });
        slot = one;
        break;
      } catch (err) {
        if (!(err && err.detail && err.detail.error === 'slot_busy') || one === free[free.length - 1]) throw err;
      }
    }
    const prior = { seqno: (await orderRecordRead())[plan.subwallet], until: (await orderUntilRead())[plan.subwallet], prices: (await orderPricesRead())[plan.subwallet] };
    const signed = await signOrder(plan, intent, { ...(options || {}), wallet: blob.a });
    if (Date.now() - planAt > PLAN_LIFE_MS) {
      pendingClear(blob.a);
      await orderRecordForget(plan.subwallet, prior).catch(() => null);
      throw fail('quote_stale');
    }
    let created;
    try {
      created = await T.api('orders/create', { body: { planId: plan.planId, stops: signed.stops, take: signed.take } });
    } catch (err) {
      const refused = err && err.detail && err.detail.error;
      if (refused && !CREATE_UNSURE.has(refused)) pendingClear(blob.a);
      throw err;
    }
    const sent = await broadcast(signed.funding.boc);
    return { id: created.id, hash: sent.hash || signed.funding.hash, floors: signed.floors, takeOut: signed.takeOut, validUntil: signed.validUntil, subwallet: slot.subwallet };
  }

  async function returnTokens(lib, own, wallet, order) {
    let body;
    try {
      body = await T.api('orders/slots', { body: { wallets: [wallet] } });
    } catch (_) {
      throw fail('state_unknown');
    }
    const row = (Array.isArray(body.slots) ? body.slots : []).find((one) => T.rawAddress(one.wallet) === wallet);
    if (!row) throw fail('state_unknown');
    const offer = T.rawAddress(order.offer);
    const listed = (Array.isArray(row.jettons) ? row.jettons : [])
      .map((j) => ({ token: T.rawAddress(j.token), wallet: T.rawAddress(j.wallet), units: T.parseUnits(j.units), seen: true }))
      .filter((j) => j.token && j.units > 0n && (j.token === offer || CK.swapAudit.orderOffer(j.token)));
    const claimed = order.units ? T.parseUnits(String(order.units)) : null;
    if (claimed && offer && !listed.some((j) => j.token === offer)) listed.unshift({ token: offer, wallet: T.rawAddress(order.jettonWallet), units: claimed, seen: false });
    return listed.slice(0, RETURN_TOKENS_MAX).map((j) => {
      const known = CK.swapAudit.orderOffer(j.token);
      const to = known ? CK.swapAudit.provenWalletOf(lib, j.token, wallet) : CK.swapAudit.auditReturn(lib, j.wallet, { owner: own, orderWallet: wallet, offer: j.token });
      if (!to) throw fail('order_refused', { reason: 'offer_wallet' });
      return { ...j, to, known, gas: known ? CK.swapAudit.returnGas(j.token) : null };
    });
  }

  async function signOrderCancel(order, options) {
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      const lib = await bundle();
      const own = blob.a;
      const subwallet = order && order.subwallet;
      if (!Number.isInteger(subwallet) || subwallet < 1 || subwallet > CK.swapAudit.subwalletMax) throw fail('bad_intent');
      const wallet = orderWalletOf(lib, publicKeyOf(blob), subwallet);
      const chain = await chainState(wallet);
      if (chain.status === 'frozen') throw fail('frozen');
      const open = pendingAgainst(wallet, chain);
      if (open) throw fail('pending', { pending: open, publicKey: blob.pk });
      if (chain.balance === null) throw fail('state_unknown');
      const tokens = await returnTokens(lib, own, wallet, order);
      const sweep = tokens.length === 1 && tokens[0].known;
      const gasOf = returnGasOf;
      const needs = !tokens.length ? 1n : sweep ? tokens[0].gas.sweep : tokens.reduce((sum, one) => sum + gasOf(one), RETURN_FEE_ROOM);
      let topup = 0n, ownChain = null;
      if (chain.balance < needs) {
        if (!tokens.some((one) => one.seen)) throw fail('insufficient_gas');
        topup = needs - chain.balance + RETURN_TOPUP_ROOM;
        ownChain = await chainState(own);
        if (ownChain.status === 'frozen') throw fail('frozen');
        if (pendingAgainst(own, ownChain)) throw fail('busy');
        if (ownChain.balance === null || ownChain.balance < topup + SWAP_RESERVE_NANO) throw fail('no_main_gas');
      }
      return await withSecret(blob, (options || {}).password, async ({ keys }) => {
        stillActive(blob);
        const validUntil = nowSeconds() + VALID_S;
        await orderRecordWrite(subwallet, chain.seqno, validUntil);
        const transfer = (one, value) => lib.internal({ to: lib.Address.parseRaw(one.to), value, bounce: true, body: bodyOf(lib, { kind: 'jetton', units: one.units, recipient: own, owner: own }) });
        let messages;
        let mode = SEND_MODE;
        if (!tokens.length) {
          messages = [lib.internal({ to: lib.Address.parseRaw(own), value: 0n, bounce: false })];
          mode = SWEEP_MODE;
        } else if (sweep) {
          messages = [transfer(tokens[0], 0n)];
          mode = SWEEP_MODE;
        } else {
          messages = tokens.map((one) => transfer(one, gasOf(one)));
          const left = chain.balance + topup - needs - RETURN_TOPUP_ROOM;
          if (tokens.every((one) => one.known) && left > RETURN_FEE_ROOM) messages.push(lib.internal({ to: lib.Address.parseRaw(own), value: left, bounce: false }));
        }
        const boc = externalOf(lib, keys, subwallet, mode, messages, chain, validUntil);
        const hash = (await T.messageHash(boc)) || '';
        pendingWrite(wallet, { seqno: chain.seqno, hash, validUntil, boc });
        let gas = null;
        if (topup > 0n) {
          const gasBoc = externalOf(lib, keys, undefined, SEND_MODE, [lib.internal({ to: lib.Address.parseRaw(wallet), value: topup, bounce: false })], ownChain, validUntil);
          pendingWrite(own, { seqno: ownChain.seqno, hash: (await T.messageHash(gasBoc)) || '', validUntil, boc: gasBoc });
          gas = { boc: gasBoc, needs };
        }
        return { boc, hash, seqno: chain.seqno, validUntil, wallet, gas, publicKey: blob.pk };
      });
    } finally {
      signing = false;
    }
  }

  async function gasArrived(wallet, needs) {
    const end = Date.now() + GAS_WAIT_MS;
    for (;;) {
      const chain = await chainState(wallet).catch(() => null);
      if (chain && chain.balance !== null && chain.balance >= needs) return;
      if (Date.now() > end) throw fail('send_unsure');
      await new Promise((resolve) => setTimeout(resolve, GAS_POLL_MS));
    }
  }

  async function cancelOrder(order, options) {
    const signed = await signOrderCancel(order, options).catch((err) => {
      if (err.code === 'pending' && err.pending) return { ...err.pending, publicKey: err.publicKey };
      throw err;
    });
    if (signed.gas) {
      await broadcast(signed.gas.boc);
      await gasArrived(signed.wallet, signed.gas.needs);
    }
    if (order.id) await T.api('orders/cancel', { body: { id: order.id, boc: signed.boc, publicKey: signed.publicKey || null } }).catch(() => null);
    const sent = await broadcast(signed.boc);
    return { hash: sent.hash || signed.hash, seqno: signed.seqno };
  }

  const EDIT_KINDS = new Set(['extend', 'rearm', 'change']);
  const EDIT_FEE_ROOM = 5000000n;
  const BUMP_FEE_ROOM = 5000000n;
  const BUMP_VALID_S = 300;
  const ORDER_ID = /^[0-9a-f]{32}$/;
  function editIntentOf(order, edit) {
    if (!order || typeof order.id !== 'string' || !ORDER_ID.test(order.id) || !edit || !EDIT_KINDS.has(edit.kind)) throw fail('bad_intent');
    const subwallet = order.subwallet;
    if (!Number.isInteger(subwallet) || subwallet < 1 || subwallet > CK.swapAudit.subwalletMax) throw fail('bad_intent');
    const offer = T.rawAddress(order.offer);
    const units = T.parseUnits(typeof order.units === 'bigint' ? order.units : String(order.units));
    if (!offer || !units) throw fail('bad_intent');
    const price = (v) => {
      if (v === null || v === undefined) return null;
      const out = T.parseUnits(typeof v === 'bigint' ? v : String(v));
      if (!out) throw fail('bad_intent');
      return out;
    };
    const keep = edit.kind === 'extend' || (edit.kind === 'rearm' && edit.stopOut === undefined && edit.takeOut === undefined);
    const stopOut = price(keep ? order.stopOut : edit.stopOut);
    const takeOut = price(keep ? order.takeOut : edit.takeOut);
    if (!stopOut && !takeOut) throw fail('bad_intent');
    return { id: order.id, kind: edit.kind, keep, subwallet, offer, units, stopOut, takeOut };
  }
  async function orderPricesKnown(order) {
    try {
      const want = editIntentOf(order, { kind: 'extend' });
      return (await orderPricesRead())[want.subwallet] === await orderPricesHash(want);
    } catch (_) {
      return false;
    }
  }

  async function signOrderEdit(order, edit, plan, options) {
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      const lib = await bundle();
      const own = blob.a;
      const want = editIntentOf(order, edit);
      const prices = await orderPricesHash(want);
      if (want.keep) await ownPricesHeld(want.subwallet, prices);
      const orderWallet = orderWalletOf(lib, publicKeyOf(blob), want.subwallet);
      const audited = CK.swapAudit.auditOrderEdit(lib, plan, { ...want, owner: own, orderWallet }, nowSeconds());
      if (audited.reason) throw fail('order_refused', { reason: audited.reason });
      const chain = await chainState(orderWallet);
      if (chain.status === 'frozen') throw fail('frozen');
      if (chain.balance === null) throw fail('state_unknown');
      if (chain.seqno !== (audited.bump ? audited.bump.seqno : plan.seqno)) throw fail('order_refused', { reason: 'seqno' });
      if (pendingAgainst(orderWallet, chain)) throw fail('busy');
      const needs = audited.attached + EDIT_FEE_ROOM + (audited.bump ? audited.bump.amount + BUMP_FEE_ROOM : 0n);
      let topup = 0n, ownChain = null;
      if (chain.balance < needs) {
        topup = needs - chain.balance + RETURN_TOPUP_ROOM;
        ownChain = await chainState(own);
        if (ownChain.status === 'frozen') throw fail('frozen');
        if (pendingAgainst(own, ownChain)) throw fail('busy');
        if (ownChain.balance === null || ownChain.balance < topup + SWAP_RESERVE_NANO) throw fail('no_main_gas');
      }
      return await withSecret(blob, (options || {}).password, async ({ keys }) => {
        stillActive(blob);
        await orderRecordWrite(want.subwallet, plan.seqno, plan.validUntil);
        await orderPricesWrite(want.subwallet, prices);
        const ladderChain = audited.bump ? { seqno: plan.seqno, status: 'active' } : chain;
        const orderBoc = (message) => buildSigned(lib, keys, {
          kind: 'swap', subwallet: want.subwallet, to: T.rawAddress(message.address), amount: audited.attached, bounce: true, payload: message.payload
        }, ladderChain, plan.validUntil);
        const stops = plan.stops.map(orderBoc);
        const take = plan.take ? orderBoc(plan.take) : null;
        const bump = audited.bump
          ? externalOf(lib, keys, want.subwallet, SEND_MODE, [lib.internal({ to: lib.Address.parseRaw(orderWallet), value: audited.bump.amount, bounce: false })], chain, nowSeconds() + BUMP_VALID_S)
          : null;
        let gas = null;
        if (topup > 0n) {
          const validUntil = nowSeconds() + VALID_S;
          const gasBoc = externalOf(lib, keys, undefined, SEND_MODE, [lib.internal({ to: lib.Address.parseRaw(orderWallet), value: topup, bounce: false })], ownChain, validUntil);
          pendingWrite(own, { seqno: ownChain.seqno, hash: (await T.messageHash(gasBoc)) || '', validUntil, boc: gasBoc });
          gas = { boc: gasBoc, needs };
        }
        return { kind: want.kind, stops, take, bump, gas, wallet: orderWallet, floors: audited.floors, takeOut: audited.take, seqno: plan.seqno, validUntil: plan.validUntil };
      });
    } finally {
      signing = false;
    }
  }

  async function editOrder(order, edit, options) {
    await T.config();
    const blob = await activeBlob((options || {}).wallet);
    const want = editIntentOf(order, edit);
    if (want.keep) await ownPricesHeld(want.subwallet, await orderPricesHash(want));
    const planAt = Date.now();
    const plan = await T.api('orders/plan', {
      body: {
        wallet: blob.a,
        publicKey: blob.pk,
        edit: { id: want.id, kind: want.kind, stopOut: want.stopOut ? want.stopOut.toString() : null, takeOut: want.takeOut ? want.takeOut.toString() : null }
      }
    });
    const prior = { seqno: (await orderRecordRead())[want.subwallet], until: (await orderUntilRead())[want.subwallet], prices: (await orderPricesRead())[want.subwallet] };
    const signed = await signOrderEdit(order, edit, plan, { ...(options || {}), wallet: blob.a });
    if (Date.now() - planAt > PLAN_LIFE_MS) {
      if (signed.gas) pendingClear(blob.a);
      await orderRecordForget(want.subwallet, prior).catch(() => null);
      throw fail('quote_stale');
    }
    if (signed.gas) {
      await broadcast(signed.gas.boc);
      await gasArrived(signed.wallet, signed.gas.needs);
    }
    const created = await T.api('orders/create', { body: { planId: plan.planId, stops: signed.stops, take: signed.take, bump: signed.bump } });
    return { id: want.id, kind: want.kind, state: created.state, floors: signed.floors, takeOut: signed.takeOut, validUntil: signed.validUntil, seqno: signed.seqno };
  }

  async function listOrders() {
    await T.config();
    const body = await T.api('orders');
    const rows = Array.isArray(body.orders) ? body.orders : [];
    if (!extras.size) return rows;
    const lib = await bundle();
    const inSet = (set, row) => set.has(T.rawAddress(row.orderWallet));
    if (activeExtra) {
      const mine = orderSetOf(lib, extras.get(activeExtra));
      return rows.filter((row) => inSet(mine, row));
    }
    const others = [...extras.values()].map((entry) => orderSetOf(lib, entry));
    return rows.filter((row) => !others.some((set) => inSet(set, row)));
  }

  const GASLESS_REASONS = new Set(['balance', 'refused']);
  const GASLESS_CONFIG_MS = 60000;
  let gaslessConfigHeld = null;
  const gaslessBocs = new Map();
  function gaslessKeyOf(boc) {
    if (gaslessBocs.has(boc)) return gaslessBocs.get(boc);
    const address = T.wallet && T.wallet.address;
    const rec = address ? pendingRead(address) : null;
    return rec && rec.boc === boc && typeof rec.gasless === 'string' && /^[0-9a-f]{64}$/.test(rec.gasless) ? rec.gasless : null;
  }
  function gaslessAuditor() {
    const held = Object.getOwnPropertyDescriptor(CK, 'gaslessAudit');
    const audit = held && held.value;
    if (!audit || held.writable || held.configurable || !Object.isFrozen(audit)) throw fail('gasless_refused', { reason: 'audit' });
    return audit;
  }
  function gaslessIntent(lib, message, own) {
    const intent = readIntent([message], own);
    if (intent.kind !== 'jetton' || intent.comment || intent.to !== CK.swapAudit.jettonWalletOf(lib, USDT_MASTER_RAW, own)) throw fail('gasless_refused', { reason: 'asset' });
    return intent;
  }
  const gaslessFailure = (err) => {
    const said = err && err.detail && err.detail.error;
    if (said === 'gasless_refused') return fail('gasless_refused', { reason: GASLESS_REASONS.has(err.detail.reason) ? err.detail.reason : 'refused' });
    return fail('gasless_unavailable');
  };
  const gaslessExpect = (blob, intent, relay) => ({ owner: blob.a, jettonWallet: intent.to, recipient: intent.recipient, units: intent.units, relay, nowS: nowSeconds() });
  async function chainForGasless(address) {
    const chain = await chainState(address);
    if (chain.status === 'frozen') throw fail('frozen');
    const open = pendingAgainst(address, chain);
    if (open) throw fail('pending', { pending: open });
    return chain;
  }

  async function gaslessQuote(message, options) {
    const blob = await activeBlob((options || {}).wallet);
    const lib = await bundle();
    const A = gaslessAuditor();
    const intent = gaslessIntent(lib, message, blob.a);
    const chain = await chainForGasless(blob.a);
    if (chain.balance === null) throw fail('balance_unknown');
    if (chain.balance >= intent.needs) return Object.freeze({ gasless: false });
    let config = gaslessConfigHeld && Date.now() - gaslessConfigHeld.at < GASLESS_CONFIG_MS ? gaslessConfigHeld.config : null;
    let answer;
    if (!config) {
      try {
        config = await T.api('wallet/gasless/config');
      } catch (err) {
        throw gaslessFailure(err);
      }
    }
    const relay = A.relayOf(config);
    if (relay && (!gaslessConfigHeld || gaslessConfigHeld.config !== config)) gaslessConfigHeld = { at: Date.now(), config };
    if (!relay) throw fail('gasless_refused', { reason: 'relay' });
    const boc = A.requestMessage(lib, { jettonWallet: intent.to, recipient: intent.recipient, units: intent.units, relay });
    try {
      answer = await T.api('wallet/gasless/estimate', { body: { master: USDT_MASTER_RAW, wallet_address: blob.a, wallet_public_key: blob.pk, messages: [{ boc }] } });
    } catch (err) {
      throw gaslessFailure(err);
    }
    const audited = A.audit(lib, answer.estimate, gaslessExpect(blob, intent, relay));
    if (audited.reason) throw fail('gasless_refused', { reason: audited.reason });
    return Object.freeze({
      gasless: true, wallet: blob.a, to: intent.to, recipient: message.recipient, units: intent.units.toString(), relay,
      commission: audited.commission, total: audited.total, validUntil: audited.validUntil, estimate: answer.estimate
    });
  }

  async function gaslessSign(quote, options) {
    if (!quote || quote.gasless !== true || typeof quote.commission !== 'bigint') throw fail('bad_intent');
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      if (quote.wallet !== blob.a) throw fail('wallet_changed');
      const lib = await bundle();
      const A = gaslessAuditor();
      const intent = gaslessIntent(lib, { to: quote.to, recipient: quote.recipient, units: quote.units }, blob.a);
      const check = () => {
        const audited = A.audit(lib, quote.estimate, gaslessExpect(blob, intent, quote.relay));
        if (audited.reason) throw fail('gasless_refused', { reason: audited.reason });
        if (audited.commission !== quote.commission) throw fail('gasless_refused', { reason: 'commission' });
        return audited;
      };
      check();
      let chain = await chainForGasless(blob.a);
      const owner = await confirmOwner(blob, (options || {}).password, 'walletKey.ownerSend');
      if (owner.blob.a !== blob.a) throw fail('busy');
      const checkedAt = Date.now();
      return await withSecret(owner.blob, owner.password, async ({ keys }) => {
        stillActive(blob);
        if (Date.now() - checkedAt > CHAIN_FRESH_MS) chain = await chainForGasless(blob.a);
        const audited = check();
        const validUntil = Math.min(nowSeconds() + VALID_S, audited.validUntil);
        const contract = contractOf(lib, keys.publicKey);
        const messages = audited.messages.map((m) => lib.internal({ to: lib.Address.parseRaw(m.to), value: m.amount, bounce: true, body: m.body }));
        const body = contract.createTransfer({ seqno: chain.seqno, secretKey: keys.secretKey, sendMode: SEND_MODE, timeout: validUntil, messages, authType: 'internal' });
        const init = chain.seqno === 0 && chain.status !== 'active' ? contract.init : undefined;
        const boc = lib.beginCell().store(lib.storeMessage(lib.external({ to: contract.address, init, body }))).endCell().toBoc().toString('base64');
        const wrong = A.auditSigned(lib, boc, { address: blob.a, publicKey: blob.pk, init: !!init, seqno: chain.seqno, validUntil, messages: audited.messages });
        if (wrong) throw fail('gasless_refused', { reason: wrong });
        gaslessBocs.set(boc, blob.pk);
        pendingWrite(blob.a, { seqno: chain.seqno, hash: '', validUntil, boc, gasless: blob.pk });
        return { boc, hash: '', seqno: chain.seqno, validUntil, commission: audited.commission, total: audited.total };
      });
    } finally {
      signing = false;
    }
  }
  const gasless = Object.freeze({ quote: gaslessQuote, sign: gaslessSign });

  async function broadcast(boc, notice = null) {
    await T.config();
    let lastError = null;
    let refused = null;
    const relayKey = gaslessKeyOf(boc);
    const sendBody = { boc, ...(relayKey ? { wallet_public_key: relayKey } : {}), ...(notice && typeof notice === 'object' ? { notice } : {}) };
    for (let i = 0; i < SEND_TRIES; i++) {
      if (i) await new Promise((resolve) => setTimeout(resolve, SEND_PAUSE_MS * i));
      try {
        const body = await T.api(relayKey ? 'wallet/gasless/send' : 'wallet/send', { body: sendBody });
        return { hash: typeof body.hash === 'string' ? body.hash : '' };
      } catch (err) {
        const code = err && err.detail && err.detail.error;
        if (code && SEND_FINAL.has(code)) throw fail(code);
        if (code && !refused) refused = code;
        lastError = err;
      }
    }
    console.error(lastError);
    throw fail('send_unsure', refused ? { refused } : null);
  }
  async function pending() {
    const address = T.wallet && T.wallet.address;
    if (!address) return null;
    return pendingAgainst(address, await chainState(address));
  }
  async function resend() {
    const open = await pending();
    if (!open) return null;
    return broadcast(open.boc);
  }

  const EXTRA_SLOT = (n) => `ck_wallet_x${n}`;
  const PHONE_EXTRA_SLOTS = 7;
  const DEVICE_EXTRA_SLOTS = 9;
  const WALLETS_MAX = 10;
  const WALLETS_KEY = 'ck_wallets_v1';
  const EXTRA_BACKUP_PREFIX = 'ck_wallet_cloud_x_';
  const EXTRA_GONE_PREFIX = 'ck_wallet_gone_x_';
  const ACTIVE_LOCAL = 'ck-wallet-active:';
  const NAME_MAX = 24;
  const ACCOUNT_KEY_MS = 5 * 60 * 1000;
  const CLOUD_VALUE_MAX = 4096;
  const extraSlotCount = () => (onDevice() ? DEVICE_EXTRA_SLOTS : PHONE_EXTRA_SLOTS);
  const extraBackupKey = (address) => EXTRA_BACKUP_PREFIX + address.slice(2);
  const activeLocal = () => (launchUser ? localGet(ACTIVE_LOCAL + launchUser) : null);
  let mainHidden = false;
  const firstOtherHere = () => {
    const entry = [...extras.values()].find((one) => one.here);
    return entry ? entry.a : null;
  };
  let mainName = null, extrasDirty = false, extrasPicked = false, walletWork = null, accountKey = null, extrasJob = null;

  function showWallet(address, kind) {
    const entry = activeExtra ? extras.get(activeExtra) : null;
    if (entry && address) T.setWallet({ address: entry.a, readOnly: !entry.here });
    else T.setWallet(address ? { address, readOnly: kind !== 'signer' } : null);
  }
  function shownStatus(now) {
    const entry = activeExtra ? extras.get(activeExtra) : null;
    if (!entry || !now || !now.address) return now;
    return {
      ...now, address: entry.a, friendly: T.friendlyAddress(entry.a), kind: entry.here ? 'signer' : 'readonly', mainMethod: now.method, mainAddress: now.address, mainFriendly: now.friendly, method: entry.here ? METHODS[entry.w] : null,
      mismatch: false, tonOnly: false, phrase: entry.here ? entry.kind || 'ton' : null, typed: entry.here && entry.typed === true, lost: false, denied: false, bioUnknown: false, canRestore: false, legacy: false, adoptFor: null, recoverFrom: null,
      moveFrom: null, moveMethod: null, moveTyped: false, moving: null, oldElsewhere: false, restoring: false, wordsEntry: false,
      backup: entry.backup || 'unknown', backupFailing: entry.here && entry.backup === 'none', asked: true
    };
  }

  async function sealWords(lib, words, address, pk, { password, typed, kind }) {
    const blob = { v: 1, a: address, pk, w: password ? 'pass' : 'keychain', e: EPOCH };
    if (kind === 'bip39' || (await passesBip39(lib.mnemonicWordList, words))) blob.bip39 = true;
    if (kind === 'bip39') blob.d = 'bip39';
    if (typed === true) blob.typed = true;
    const secretKey = randomBytes(32);
    try {
      const iv = randomBytes(12);
      const plain = utf8(words.join(' '));
      let sealed;
      try {
        sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: boundData(blob) }, await aesKey(secretKey), plain);
      } finally {
        plain.fill(0);
      }
      Object.assign(blob, { iv: toBase64(iv), ct: toBase64(new Uint8Array(sealed)) });
      if (password) {
        const salt = randomBytes(16);
        const wiv = randomBytes(12);
        const wrap = await passwordKey(password, salt, PBKDF2_ITERATIONS);
        const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: wiv, additionalData: boundData(blob) }, wrap, secretKey);
        Object.assign(blob, { n: PBKDF2_ITERATIONS, s: toBase64(salt), wiv: toBase64(wiv), wk: toBase64(new Uint8Array(wrapped)) });
      } else {
        blob.k = toBase64(secretKey);
      }
    } finally {
      secretKey.fill(0);
    }
    return JSON.stringify(blob);
  }
  async function withExtraSecret(blob, password, fn) {
    if (blob.w !== 'keychain' || onDevice()) return openSealed(blob, password, fn, true);
    const manager = await biometrics().catch(() => null);
    const first = await slotRead(SECRET_KEY);
    const firstHow = first.blob ? first.blob.w : 'keychain';
    if (manager && firstHow === 'keychain') return openSealed(blob, password, fn, true);
    if (manager && firstHow === 'bio') {
      const fresh = ownerFresh && ownerFresh.a === blob.a && Date.now() - ownerFresh.at < CHAIN_FRESH_MS;
      ownerFresh = null;
      if (!fresh && !(await fingerOwner('walletKey.bioSign'))) throw fail('biometric_denied');
      return openSealed(blob, password, fn, true);
    }
    const opened = await protectFirst(blob);
    return openSealed(opened.blob, opened.password, fn, true);
  }
  async function extraProtect(held, password) {
    checkPassword(password);
    return slotJob(async () => {
      const entry = extras.get(held.a);
      const slot = entry && entry.key ? await slotRead(entry.key) : null;
      if (!slot || !slot.ok || !slot.blob || slot.blob.a !== held.a) throw fail('no_secret');
      if (slot.blob.w !== 'keychain') return slot.blob;
      const text = await openSealed(slot.blob, undefined, ({ lib, words, kind }) => sealWords(lib, words, held.a, held.pk, { password, typed: slot.blob.typed === true, kind }), true);
      await slotWrite(entry.key, text, { expect: slot.text });
      entry.w = 'pass';
      tellBackup();
      return readBlob(text);
    });
  }

  async function cloudGet(key) {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [err, text] = await tgCall((done) => store.getItem(key, done), cloudMs());
    if (err) throw fail('storage_timeout');
    return text || null;
  }
  async function cloudPut(key, text) {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [err] = await tgCall((done) => store.setItem(key, text, done), cloudMs());
    if (err) throw fail('storage_failed');
    if ((await cloudGet(key)) !== text) throw fail('storage_failed');
  }
  async function cloudDrop(key) {
    const store = cloudStore();
    if (!store) throw fail('storage_failed');
    const [err] = await tgCall((done) => store.removeItem(key, done), cloudMs());
    if (err) throw fail('storage_failed');
  }
  const cleanName = (name) => {
    const text = Array.from(String(name === null || name === undefined ? '' : name).replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, '').trim()).slice(0, NAME_MAX).join('').trim();
    return text || null;
  };
  async function walletsRead() {
    try {
      const text = await cloudGet(WALLETS_KEY);
      if (!text) return { ok: true, rows: [] };
      const rec = JSON.parse(text);
      if (!rec || rec.v !== 1 || !Array.isArray(rec.w)) return { ok: true, rows: [] };
      const rows = rec.w.filter((row) => row && T.rawAddress(row.a) === row.a && String(row.a).startsWith('0:')).map((row) => ({ a: row.a, n: cleanName(row.n), p: /^[0-9a-f]{64}$/.test(row.p) ? row.p : null, m: row.m === 1, h: row.h === 1 }));
      return { ok: true, rows };
    } catch (err) {
      return err instanceof SyntaxError ? { ok: true, rows: [] } : { ok: false, rows: [] };
    }
  }
  function walletsText(main) {
    const row = (entry) => {
      const out = { a: entry.a };
      if (entry.name) out.n = entry.name;
      if (entry.pk) out.p = entry.pk;
      return out;
    };
    const first = { a: main, m: 1 };
    if (mainName) first.n = mainName;
    if (mainHidden) first.h = 1;
    return JSON.stringify({ v: 1, w: [first, ...[...extras.values()].map(row)] });
  }
  async function walletsWrite(main) {
    const text = walletsText(main);
    if (text.length > CLOUD_VALUE_MAX) throw fail('storage_failed');
    await cloudPut(WALLETS_KEY, text);
    extrasDirty = false;
  }
  async function backupKeysRead() {
    const store = cloudStore();
    if (!store || typeof store.getKeys !== 'function') return [];
    try {
      const [err, keys] = await tgCall((done) => store.getKeys(done), cloudMs());
      if (err || !Array.isArray(keys)) return [];
      return keys.filter((key) => typeof key === 'string' && key.startsWith(EXTRA_BACKUP_PREFIX) && /^[0-9a-f]{64}$/.test(key.slice(EXTRA_BACKUP_PREFIX.length))).map((key) => '0:' + key.slice(EXTRA_BACKUP_PREFIX.length));
    } catch (_) {
      return [];
    }
  }
  async function extrasLook(main) {
    if (!secureStore() || !main) return [];
    const names = Array.from({ length: extraSlotCount() }, (_, i) => EXTRA_SLOT(i + 1));
    const slots = await Promise.all(names.map((key) => slotRead(key)));
    if (slots.some((slot) => !slot.ok)) throw fail('storage_timeout');
    const [record, onAccount] = await Promise.all([walletsRead(), backupKeysRead()]);
    const next = new Map();
    let dirty = false;
    if (record.ok) {
      record.rows.forEach((row) => {
        if (row.a === main) {
          mainName = row.n;
          mainHidden = row.h;
        } else if (!row.m && !next.has(row.a)) next.set(row.a, { a: row.a, key: null, here: false, w: null, bip39: false, kind: null, pk: row.p, name: row.n, backup: 'unknown' });
      });
    } else {
      extras.forEach((entry) => next.set(entry.a, { ...entry, key: null, here: false, w: null, kind: null }));
    }
    slots.forEach((slot, i) => {
      if (!slot.blob || slot.blob.a === main) return;
      let entry = next.get(slot.blob.a);
      if (entry && entry.here) return;
      if (!entry) {
        const known = extras.get(slot.blob.a);
        entry = { a: slot.blob.a, name: known ? known.name : null, backup: 'unknown' };
        next.set(slot.blob.a, entry);
        dirty = true;
      }
      if (entry.pk !== slot.blob.pk) dirty = true;
      Object.assign(entry, { key: names[i], here: true, w: slot.blob.w, bip39: slot.blob.bip39 === true, kind: kindOf(slot.blob), typed: slot.blob.typed === true, pk: slot.blob.pk });
    });
    onAccount.forEach((address) => {
      if (address === main || next.has(address) || T.rawAddress(address) !== address) return;
      next.set(address, { a: address, key: null, here: false, w: null, bip39: false, kind: null, pk: null, name: null, backup: 'unknown' });
      dirty = true;
    });
    next.forEach((entry) => {
      const known = extras.get(entry.a);
      if (known && known.orderSet && known.pk === entry.pk) entry.orderSet = known.orderSet;
      if (known && entry.backup === 'unknown') entry.backup = known.backup;
    });
    extras.clear();
    next.forEach((entry, address) => extras.set(address, entry));
    extrasDirty = dirty && record.ok;
    extrasLooked = true;
    if (activeExtra && !extras.has(activeExtra)) activeExtra = null;
    if (!extrasPicked) {
      extrasPicked = true;
      const wanted = activeLocal();
      if (wanted && extras.has(wanted)) activeExtra = wanted;
    }
    if (mainHidden && !activeExtra) activeExtra = firstOtherHere();
    return names.filter((_, i) => !slots[i].text && !slots[i].kept);
  }
  const accountKeyFresh = () => !!accountKey && Date.now() - accountKey.at < ACCOUNT_KEY_MS;
  function extraKeyOf(first, password) {
    if (accountKeyFresh()) return accountKey.job;
    const job = openSealed(first, password, () => askBackupKey(), true);
    const held = { job, at: Date.now() };
    accountKey = held;
    job.catch(() => { if (accountKey === held) accountKey = null; });
    return job;
  }
  async function extraBackupRead(address) {
    const text = await cloudGet(extraBackupKey(address));
    if (!text) return null;
    const held = readBackup(text);
    if (!held || held.a !== address) throw fail('backup_other');
    return held;
  }
  async function extraBackupKeep(address) {
    const text = await cloudGet(extraBackupKey(address));
    if (!text) throw fail('wallet_unsure');
    await cloudPut(EXTRA_GONE_PREFIX + address.slice(2), text);
  }
  const extraBackupPut = async (words, address, account, kind) => cloudPut(extraBackupKey(address), await backupText(words, address, { ...account, kind }));
  async function extrasRepair(opts) {
    const main = status.address;
    if (!launchOk() || !main || !secureStore()) return;
    const free = await extrasLook(main);
    if (!extras.size && !extrasDirty) return;
    const firstSlot = status.kind === 'signer' ? await slotRead(SECRET_KEY) : null;
    const first = firstSlot && firstSlot.blob && firstSlot.blob.a === main ? firstSlot.blob : null;
    const canAsk = !!first && !status.lost && !status.recoverFrom && !status.adoptFor && (first.w === 'keychain' || opts.ask === true);
    for (const entry of [...extras.values()]) {
      let held;
      try {
        held = await extraBackupRead(entry.a);
      } catch (err) {
        entry.backup = 'unknown';
        continue;
      }
      entry.backup = held && backupCurrent(held) ? 'have' : 'none';
      if (!entry.here && !held) {
        extras.delete(entry.a);
        if (activeExtra === entry.a) pickActive(null);
        extrasDirty = true;
        continue;
      }
      try {
        if (!entry.here && canAsk && free.length) {
          await extraBringBack(entry, held, free.shift(), await extraKeyOf(first, opts.password));
        } else if (entry.here && entry.backup === 'none' && canAsk && entry.w === 'keychain') {
          const slot = await slotRead(entry.key);
          if (slot.blob && slot.blob.a === entry.a) {
            const account = await extraKeyOf(first, opts.password);
            await openSealed(slot.blob, undefined, ({ words, kind }) => extraBackupPut(words, entry.a, account, kind), true);
            entry.backup = 'have';
          }
        }
      } catch (err) {
        console.warn('wallets: tried again on the next launch', err && (err.code || err.message));
      }
    }
    if (extrasDirty) await walletsWrite(main).catch((err) => console.warn('wallets: the list is written on the next launch', err && (err.code || err.message)));
  }
  async function extraBringBack(entry, held, key, { key: account, user }) {
    const lib = await bundle();
    let plain = null, keys = null;
    try {
      plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(held.iv), additionalData: backupBound(entry.a, user) }, account, fromBase64(held.ct)));
      const words = new TextDecoder().decode(plain).split(' ');
      const opened = await backupKeys(lib, words, entry.a, held);
      if (!opened) throw fail('address_mismatch');
      keys = opened.keys;
      const pk = toHex(keys.publicKey);
      const text = await sealWords(lib, words, entry.a, pk, { kind: opened.kind, typed: opened.kind === 'bip39' });
      await slotWrite(key, text, { expect: null });
      const blob = readBlob(text);
      Object.assign(entry, { key, here: true, w: blob.w, bip39: blob.bip39 === true, kind: kindOf(blob), typed: blob.typed === true, pk });
      extrasDirty = true;
      deriveOthers(words, entry.a);
      words.fill('');
    } finally {
      if (plain) plain.fill(0);
      if (keys) keys.secretKey.fill(0);
    }
  }
  function extrasSync(options) {
    if (extrasJob) return extrasJob;
    const job = slotJob(() => extrasRepair(options || {})).catch((err) => console.warn('wallets: looked at again on the next launch', err && (err.code || err.message))).then(() => {
      showWallet(status.address, status.kind);
      tellBackup();
      mainHiddenLook().catch((err) => console.warn('wallets: the hidden wallet is read on the next launch', err && (err.code || err.message)));
    }).finally(() => { if (extrasJob === job) extrasJob = null; });
    extrasJob = job;
    return job;
  }
  function pickActive(address) {
    activeExtra = address;
    if (launchUser) localSet(ACTIVE_LOCAL + launchUser, address || '');
    orderScanJob = null;
  }
  function switchTo(address) {
    const raw = T.rawAddress(address);
    if (signing || walletWork) throw fail('busy');
    if (!status.address) throw fail('no_wallet');
    if (raw !== status.address && !extras.has(raw)) throw fail('no_wallet');
    pickActive(raw === status.address ? null : raw);
    showWallet(status.address, status.kind);
    tellBackup();
    return T.wallet;
  }
  function walletJob(fn) {
    if (walletWork) return Promise.reject(fail('busy'));
    const job = (async () => fn())().finally(() => { if (walletWork === job) walletWork = null; });
    walletWork = job;
    return job;
  }
  const walletRow = (entry) => ({ address: entry.a, friendly: T.friendlyAddress(entry.a), name: entry.name || null, main: false, active: activeExtra === entry.a, here: entry.here, backup: entry.backup, method: entry.here ? METHODS[entry.w] || null : null, kind: entry.here ? entry.kind || 'ton' : null, typed: entry.here && entry.typed === true });
  function walletRows() {
    if (!status.address) return [];
    const others = [...extras.values()].map(walletRow);
    if (mainHidden && activeExtra && extras.get(activeExtra) && extras.get(activeExtra).here) return others;
    return [{ address: status.address, friendly: status.friendly, name: mainName, main: true, active: !activeExtra, here: status.kind === 'signer', backup: status.backup, method: status.kind === 'signer' ? status.method : null, kind: status.kind === 'signer' ? status.phrase || 'ton' : null, typed: status.kind === 'signer' && status.typed === true }, ...others];
  }
  async function mainHiddenLook() {
    if (!mainHidden || status.kind !== 'signer') return;
    const seen = await oldHoldings(await bundle(), await currentBlob());
    if (!seen.any) return;
    mainHidden = false;
    await walletsWrite(status.address);
    tellBackup();
  }
  const LEGACY = Object.freeze({
    v4R2: Object.freeze({ make: (lib, publicKey) => lib.WalletContractV4.create({ workchain: 0, publicKey }), code: 'feb5ff6820e2ff0d9483e7e0d62c817d846789fb4ae580c878866d959dabd5c0', op: true }),
    v3R2: Object.freeze({ make: (lib, publicKey) => lib.WalletContractV3R2.create({ workchain: 0, publicKey }), code: '84dafa449f98a6987789ba232358072bc0f76dc4524002a5d0918b9a75d2d599', op: false })
  });
  const LEGACY_WALLET_ID = 698983191;
  const LEGACY_MESSAGES_MAX = 4;
  const LEGACY_FWD_NANO = 1000000n;
  const LEGACY_DONE_LOCAL = 'ck-wallet-legacy-done:';
  const LEGACY_SETTLE_READS = 3;
  const legacyKey = (lib, publicKey) => lib.beginCell().storeUint(BigInt('0x' + toHex(publicKey)), 256).endCell().beginParse().loadBuffer(32);
  function legacyContractOf(lib, publicKey, version) {
    const kind = LEGACY[version];
    if (!kind) throw fail('bad_intent');
    const contract = kind.make(lib, legacyKey(lib, publicKey));
    if (contract.walletId !== LEGACY_WALLET_ID || toHex(contract.init.code.hash()) !== kind.code) throw fail('bundle_failed');
    return contract;
  }
  const legacyAddressesOf = (lib, publicKey) => Object.keys(LEGACY).map((version) => ({ version, address: legacyContractOf(lib, publicKey, version).address.toRawString() }));
  async function legacyBlobOf(raw) {
    const entry = extras.get(raw);
    if (entry) {
      if (!entry.here) return null;
      const slot = await slotRead(entry.key).catch(() => null);
      return slot && slot.ok && slot.blob && slot.blob.a === raw ? slot.blob : null;
    }
    if (raw !== status.address) return null;
    return currentBlob().catch(() => null);
  }
  async function legacyHoldings(one) {
    const main = await chainState(one.address);
    if (main.balance === null) throw fail('balance_unknown');
    const rows = await tokenRows(one.address);
    const vetted = (row) => row.listed === true || CK.swapAudit.swappable(T.rawAddress(row.token) || '');
    const jettons = rows.filter((row) => row && !row.native && row.token !== 'ton' && row.risk !== 'suspicious' && vetted(row) && (T.parseUnits(String(row.units)) || 0n) > 0n);
    const gram = main.balance;
    return { ...one, main, gram, jettons, pending: !!pendingAgainst(one.address, main), frozen: main.status === 'frozen', any: gram > MOVE_DUST_NANO + GAS_NANO || jettons.length > 0, history: main.seqno > 0 };
  }
  const legacyView = (seen) => ({ version: seen.version, address: seen.address, friendly: T.friendlyAddress(seen.address), gram: seen.gram.toString(), tokens: seen.jettons.length, seqno: seen.main.seqno, status: seen.main.status, frozen: seen.frozen, pending: seen.pending });
  const legacySeen = new Map();
  const legacyJobs = new Map();
  function legacyLook(address, options) {
    const raw = T.rawAddress(address);
    const launch = !!(options && options.launch);
    if (!raw) return Promise.resolve(null);
    if (launch && legacySeen.has(raw)) return Promise.resolve(legacySeen.get(raw));
    if (legacyJobs.has(raw)) return legacyJobs.get(raw);
    const job = (async () => {
      const blob = await legacyBlobOf(raw);
      if (!blob || typeof blob.pk !== 'string' || !/^[0-9a-f]{64}$/.test(blob.pk)) return null;
      if (launch && (blob.typed !== true || localGet(LEGACY_DONE_LOCAL + raw) === '1')) return null;
      const lib = await bundle();
      const pk = publicKeyOf(blob);
      if (addressOf(lib, pk) !== raw) return null;
      await T.config();
      const found = [], unknown = [], history = [], stuck = [];
      for (const one of legacyAddressesOf(lib, pk)) {
        try {
          const seen = await legacyHoldings(one);
          if (seen.any && seen.pending) found.push(legacyView(seen));
          else if (seen.pending) unknown.push(one.version);
          else if (seen.any && !seen.frozen && legacyPlan(lib, seen, [])) found.push(legacyView(seen));
          else if (seen.any) stuck.push(one.version);
          else if (seen.history) history.push(one.version);
        } catch (err) {
          console.warn('wallet: an older version was not read', err && (err.code || err.message));
          unknown.push(one.version);
        }
      }
      const result = { found, unknown, history, stuck, empty: !found.length && !unknown.length };
      legacySeen.set(raw, result);
      if (result.empty) localSet(LEGACY_DONE_LOCAL + raw, '1');
      else {
        try { localStorage.removeItem(LEGACY_DONE_LOCAL + raw); } catch (_) { }
      }
      tellBackup();
      return result;
    })().finally(() => legacyJobs.delete(raw));
    legacyJobs.set(raw, job);
    return job;
  }
  const legacyLast = (address) => legacySeen.get(T.rawAddress(address)) || null;
  const legacyFunds = (address) => legacyLook(address).then((result) => (result ? result.found : []));

  function legacyPlan(lib, seen, left) {
    const version = seen.version;
    if (seen.frozen) {
      left.push({ what: 'GRAM', why: 'frozen', version });
      return null;
    }
    if (seen.pending) {
      left.push({ what: 'GRAM', why: 'pending', version });
      return null;
    }
    const mine = [];
    const rows = seen.jettons.map((row) => {
      const token = T.rawAddress(row.token);
      return { row, proven: token ? CK.swapAudit.provenWalletOf(lib, token, seen.address) : null };
    });
    rows.sort((a, b) => Number(!!b.proven) - Number(!!a.proven));
    rows.slice(MOVE_JETTONS_MAX).forEach(({ row }) => mine.push({ what: row.symbol || '?', why: 'later', version }));
    const all = [];
    rows.slice(0, MOVE_JETTONS_MAX).forEach(({ row, proven }) => {
      const from = proven || T.rawAddress(row.wallet);
      const units = T.parseUnits(String(row.units));
      if (from && from.startsWith('0:') && units) all.push({ what: row.symbol || '?', token: T.rawAddress(row.token), from, units, known: !!proven });
      else mine.push({ what: row.symbol || '?', why: 'token', version });
    });
    const requests = (n) => Math.ceil(n / LEGACY_MESSAGES_MAX);
    const cost = (n) => BigInt(n) * (JETTON_GAS_NANO + LEGACY_FWD_NANO) + BigInt(requests(n)) * GAS_NANO;
    const jettons = all.slice();
    while (jettons.length && seen.gram < cost(jettons.length)) {
      const dropped = jettons.pop();
      mine.push({ what: dropped.what, why: dropped.known ? 'gas' : 'token', version });
    }
    const proven = all.filter((j) => j.known).length;
    let need = 0n;
    if (jettons.length < proven) {
      const short = cost(proven) + GAS_NANO + MOVE_DUST_NANO - seen.gram;
      need = short > 0n ? ((short + MOVE_DUST_NANO - 1n) / MOVE_DUST_NANO) * MOVE_DUST_NANO : MOVE_DUST_NANO;
    }
    const rest = seen.gram - cost(jettons.length);
    const sweep = !mine.some((one) => one.why === 'gas' || one.why === 'later') && rest > MOVE_DUST_NANO + GAS_NANO;
    left.push(...mine);
    if (!jettons.length && !sweep) return need ? { version, address: seen.address, seen, jettons: [], sweep: false, need } : null;
    return { version, address: seen.address, seen, jettons, sweep, need };
  }
  function signLegacy(lib, keys, plan, to, validUntil) {
    const contract = legacyContractOf(lib, keys.publicKey, plan.version);
    if (contract.address.toRawString() !== plan.address) throw fail('address_mismatch');
    const jettonMessage = (j) => lib.internal({ to: lib.Address.parseRaw(j.from), value: JETTON_GAS_NANO, bounce: true, body: bodyOf(lib, { kind: 'jetton', units: j.units, recipient: to, owner: to }) });
    const groups = [];
    for (let i = 0; i < plan.jettons.length; i += LEGACY_MESSAGES_MAX) {
      const part = plan.jettons.slice(i, i + LEGACY_MESSAGES_MAX);
      groups.push({ mode: SEND_MODE, messages: part.map(jettonMessage), jettons: part, sweep: false });
    }
    if (plan.sweep) groups.push({ mode: SWEEP_MODE, messages: [lib.internal({ to: lib.Address.parseRaw(to), value: 0n, bounce: false })], jettons: [], sweep: true });
    const main = plan.seen.main;
    const fresh = main.seqno === 0 && main.status !== 'active';
    return groups.map((group, i) => {
      const seqno = main.seqno + i;
      const body = contract.createTransfer({ seqno, secretKey: keys.secretKey, sendMode: group.mode, timeout: validUntil, messages: group.messages });
      const init = i === 0 && fresh ? contract.init : undefined;
      const boc = lib.beginCell().store(lib.storeMessage(lib.external({ to: contract.address, init, body }))).endCell().toBoc().toString('base64');
      return { seqno, boc, jettons: group.jettons, sweep: group.sweep };
    });
  }
  function auditLegacy(lib, signed, plan, to, publicKey, validUntil) {
    const kind = LEGACY[plan.version];
    if (!kind) return 'version';
    const contract = legacyContractOf(lib, publicKey, plan.version);
    const fresh = plan.seen.main.seqno === 0 && plan.seen.main.status !== 'active';
    const planned = new Map(plan.jettons.map((j) => [j.from, j]));
    const used = new Set();
    let sweeps = 0;
    for (let i = 0; i < signed.length; i++) {
      let message;
      try {
        message = lib.loadMessage(lib.Cell.fromBase64(signed[i].boc).beginParse());
      } catch (_) {
        return 'boc';
      }
      if (message.info.type !== 'external-in' || message.info.dest.toRawString() !== plan.address) return 'dest';
      const init = message.init;
      if (i === 0 && fresh) {
        if (!init || !init.code || !init.data || init.splitDepth || init.special || init.libraries) return 'init';
        if (toHex(init.code.hash()) !== kind.code || toHex(init.data.hash()) !== toHex(contract.init.data.hash())) return 'init';
        if (lib.contractAddress(0, init).toRawString() !== plan.address) return 'init';
      } else if (init) return 'init';
      try {
        const s = message.body.beginParse();
        const signature = s.loadBuffer(64);
        if (!lib.signVerify(s.asCell().hash(), signature, publicKey)) return 'signature';
        if (s.loadUint(32) !== LEGACY_WALLET_ID) return 'wallet_id';
        if (s.loadUint(32) !== validUntil) return 'valid_until';
        if (s.loadUint(32) !== plan.seen.main.seqno + i || signed[i].seqno !== plan.seen.main.seqno + i) return 'seqno';
        if (kind.op && s.loadUint(8) !== 0) return 'op';
        const refs = s.remainingRefs;
        if (refs < 1 || refs > LEGACY_MESSAGES_MAX || s.remainingBits !== refs * 8) return 'shape';
        for (let r = 0; r < refs; r++) {
          const mode = s.loadUint(8);
          const out = lib.loadMessageRelaxed(s.loadRef().beginParse());
          if (out.info.type !== 'internal' || out.init) return 'message';
          const dest = out.info.dest.toRawString();
          if (mode === SWEEP_MODE) {
            if (refs !== 1 || dest !== to || out.info.value.coins !== 0n || out.info.bounce || out.body.bits.length || out.body.refs.length) return 'sweep';
            sweeps += 1;
            continue;
          }
          const j = planned.get(dest);
          if (mode !== SEND_MODE || !j || used.has(dest) || out.info.value.coins !== JETTON_GAS_NANO || !out.info.bounce || out.body.refs.length) return 'jetton';
          used.add(dest);
          const b = out.body.beginParse();
          if (b.loadUint(32) !== JETTON_TRANSFER_OP || b.loadUintBig(64) !== 0n || b.loadCoins() !== j.units) return 'jetton';
          if (b.loadAddress().toRawString() !== to || b.loadAddress().toRawString() !== to) return 'recipient';
          if (b.loadBit() || b.loadCoins() !== 1n || b.loadBit() || b.remainingBits || b.remainingRefs) return 'jetton';
        }
        if (s.remainingBits || s.remainingRefs) return 'shape';
      } catch (_) {
        return 'body';
      }
    }
    if (used.size !== planned.size || sweeps !== (plan.sweep ? 1 : 0)) return 'count';
    return null;
  }
  async function moveLegacy(address, options, onStep) {
    if (signing) throw fail('busy');
    signing = true;
    const step = (name, extra) => { try { if (onStep) onStep(name, extra); } catch (_) { } };
    try {
      const blob = await activeBlob(address ? T.rawAddress(address) : undefined);
      const lib = await bundle();
      const to = addressOf(lib, publicKeyOf(blob));
      if (to !== blob.a) throw fail('address_mismatch');
      await T.config();
      const left = [], plans = [];
      for (const one of legacyAddressesOf(lib, publicKeyOf(blob))) {
        let seen;
        try {
          seen = await legacyHoldings(one);
        } catch (_) {
          left.push({ what: one.version, why: 'unknown', version: one.version });
          continue;
        }
        if (!seen.any) continue;
        const plan = legacyPlan(lib, seen, left);
        if (plan) plans.push(plan);
      }
      const gasOf = (list) => list.filter((plan) => plan.need > 0n).map((plan) => ({ version: plan.version, address: plan.address, friendly: T.friendlyAddress(plan.address), need: plan.need.toString() }));
      const work = plans.filter((plan) => plan.jettons.length || plan.sweep);
      if (!work.length) {
        legacySeen.delete(to);
        const after = await legacyLook(to).catch(() => null);
        return { moved: [], left, empty: !!after && after.empty, gas: gasOf(plans) };
      }
      const validUntil = nowSeconds() + MOVE_VALID_S;
      const signed = await withSecret(blob, (options || {}).password, async ({ keys }) => {
        stillActive(blob);
        if (addressOf(lib, keys.publicKey) !== to || toHex(keys.publicKey) !== blob.pk) throw fail('address_mismatch');
        return work.map((plan) => {
          const requests = signLegacy(lib, keys, plan, to, validUntil);
          const wrong = auditLegacy(lib, requests, plan, to, keys.publicKey, validUntil);
          if (wrong) throw fail('bad_intent', { reason: wrong });
          return { plan, requests };
        });
      });
      const of = signed.reduce((sum, one) => sum + one.requests.length, 0);
      let done = 0;
      step('signed', { done, of });
      const landedOf = [];
      for (const { plan, requests } of signed) {
        let going = true;
        const landed = { plan, jettons: [], sweep: false };
        landedOf.push(landed);
        for (const request of requests) {
          const what = request.sweep ? ['GRAM'] : request.jettons.map((j) => j.what);
          if (!going) {
            what.forEach((one) => left.push({ what: one, why: 'wait', version: plan.version }));
            continue;
          }
          pendingWrite(plan.address, { seqno: request.seqno, hash: (await T.messageHash(request.boc)) || '', validUntil, boc: request.boc });
          const sent = await broadcast(request.boc).then(() => true, (err) => {
            if (SEND_FINAL.has(err.code)) pendingClear(plan.address);
            return false;
          });
          step('sent', { done, of });
          const passed = sent && (await seqnoPassed(plan.address, request.seqno, Math.min(Date.now() + MOVE_WAIT_MS, (validUntil + EXPIRY_MARGIN_S) * 1000)));
          if (passed) {
            done += 1;
            if (request.sweep) landed.sweep = true;
            else landed.jettons.push(...request.jettons);
            step('landed', { done, of });
          } else {
            going = false;
            what.forEach((one) => left.push({ what: one, why: 'wait', version: plan.version }));
          }
        }
      }
      const moved = [];
      for (const landed of landedOf) {
        if (!landed.jettons.length && !landed.sweep) continue;
        let now = null;
        const gone = (j) => {
          const row = now.jettons.find((one) => T.rawAddress(one.token) === j.token);
          return !row || (T.parseUnits(String(row.units)) || 0n) < j.units;
        };
        const swept = () => now.gram <= MOVE_DUST_NANO + GAS_NANO;
        for (let i = 0; i < LEGACY_SETTLE_READS; i++) {
          if (i) await pause(GAS_POLL_MS);
          now = await legacyHoldings({ version: landed.plan.version, address: landed.plan.address }).catch(() => null);
          if (now && landed.jettons.every(gone) && (!landed.sweep || swept())) break;
        }
        landed.jettons.forEach((j) => {
          if (now && gone(j)) moved.push(j.what);
          else left.push({ what: j.what, why: 'wait', version: landed.plan.version });
        });
        if (landed.sweep) {
          if (now && swept()) moved.push('GRAM');
          else left.push({ what: 'GRAM', why: 'wait', version: landed.plan.version });
        }
      }
      legacySeen.delete(to);
      const after = await legacyLook(to).catch(() => null);
      return { moved: Array.from(new Set(moved)), left, empty: !!after && after.empty, gas: gasOf(plans) };
    } finally {
      signing = false;
    }
  }
  function addWallet(given, options) {
    return walletJob(async () => {
      await requireLaunch();
      const lib = await bundle();
      const opts = options || {};
      const typed = given !== null;
      const words = typed ? (Array.isArray(given) ? given : String(given || '').split(/\s+/)).map((w) => String(w).trim().toLowerCase()).filter(Boolean) : await newWords(lib);
      let keys = null;
      try {
        let kind = 'ton';
        if (typed) {
          const c = await classifyWords(lib, words);
          refuseWords(words, c);
          kind = await chooseKind(lib, words, c, opts.kind, null, new Set([status.address, ...extras.keys()].filter(Boolean)));
          if (!kind) return { need: 'source' };
        }
        if (createJob) await createJob.catch(() => null);
        keys = await keysOf(lib, words, kind);
        const address = addressOf(lib, keys.publicKey);
        const publicKey = toHex(keys.publicKey);
        const evm = typed ? await evmOfWords(words) : null;
        const entry = await slotJob(() => addHeld(lib, words, address, publicKey, typed, opts, kind, evm));
        tellBackup();
        return walletRow(entry);
      } finally {
        words.fill('');
        if (keys) keys.secretKey.fill(0);
      }
    });
  }
  async function addHeld(lib, words, address, publicKey, typed, opts, kind, evm) {
    const now = await load();
    if (now.kind !== 'signer') throw fail('no_wallet');
    if (now.recoverFrom || now.adoptFor || now.legacy || now.mismatch) throw fail('wallets_wait');
    const firstSlot = await slotRead(SECRET_KEY);
    if (!firstSlot.ok || !firstSlot.blob) throw fail('storage_timeout');
    const main = firstSlot.blob.a;
    if (address === main) throw fail('wallet_same');
    const free = await extrasLook(main);
    const known = extras.get(address);
    if (known && known.here) throw fail('wallet_added');
    if (evm && [main, ...extras.keys()].some((one) => one !== address && evmOwnRead(one) === evm)) throw fail('already_added');
    const limit = Math.min(WALLETS_MAX, 1 + extraSlotCount());
    if (1 + extras.size + (known ? 0 : 1) > WALLETS_MAX || !free.length) throw fail('wallets_full', { limit });
    if (opts.password && firstSlot.blob.w !== 'pass') checkPassword(opts.password);
    if (firstSlot.blob.w === 'pass' && !opts.password) throw fail('password_needed');
    const onAccount = await extraBackupRead(address);
    const needsBackup = !onAccount || !backupCurrent(onAccount);
    if (firstSlot.blob.w === 'pass' && !(needsBackup && !accountKeyFresh())) await openSealed(firstSlot.blob, opts.password, () => null, true);
    const account = needsBackup ? await extraKeyOf(firstSlot.blob, opts.password) : null;
    const key = free[0];
    const text = await sealWords(lib, words, address, publicKey, { password: opts.password, typed, kind });
    await slotWrite(key, text, { expect: null });
    const blob = readBlob(text);
    const entry = known || { a: address, name: null };
    Object.assign(entry, { key, here: true, w: blob.w, bip39: blob.bip39 === true, kind: kindOf(blob), typed: blob.typed === true, pk: publicKey, backup: needsBackup ? 'none' : 'have' });
    extras.set(address, entry);
    if (needsBackup) {
      try {
        await extraBackupPut(words, address, account, kind);
        entry.backup = 'have';
      } catch (err) {
        console.warn('wallets: no backup, so no wallet', err && (err.code || err.message));
        extras.delete(address);
        await slotRemove(key).catch(() => null);
        throw fail('backup_failed');
      }
    }
    await walletsWrite(main).catch((err) => {
      extrasDirty = true;
      console.warn('wallets: the list is written on the next launch', err && (err.code || err.message));
    });
    deriveOthers(words, address);
    return entry;
  }
  function renameWallet(address, name) {
    return walletJob(() => slotJob(async () => {
      const raw = T.rawAddress(address);
      const clean = cleanName(name);
      const entry = extras.get(raw);
      if (raw !== status.address && !entry) throw fail('no_wallet');
      const before = entry ? entry.name : mainName;
      if (entry) entry.name = clean;
      else mainName = clean;
      try {
        await walletsWrite(status.address);
      } catch (err) {
        if (entry) entry.name = before;
        else mainName = before;
        throw err;
      }
      tellBackup();
    }));
  }
  const OPEN_ORDER = new Set(['funding', 'active', 'firing', 'cancelling']);
  function orderSetOf(lib, entry) {
    if (!entry) return new Set();
    if (entry.orderSet) return entry.orderSet;
    let set = new Set();
    if (entry.pk) {
      const pk = Uint8Array.from(entry.pk.match(/../g), (h) => parseInt(h, 16));
      if (addressOf(lib, pk) === entry.a) set = new Set(subwalletList().map((subwallet) => orderWalletOf(lib, pk, subwallet)));
    }
    entry.orderSet = set;
    return set;
  }
  async function removalOpen(blob, opts) {
    const missing = Object.keys(NET_READS).some((net) => !oldNetAddress(net, blob.a));
    const derive = ({ words }) => (missing ? deriveOthers(words, blob.a) : null);
    if (blob.w === 'keychain') {
      if (missing) await openSealed(blob, undefined, derive, true).catch(() => null);
      return false;
    }
    if (!opts.unlock || (!missing && blob.w !== 'pass')) return false;
    await openSealed(blob, opts.password, derive, true);
    return true;
  }
  const strictFor = (blob, opts) => ({ strict: blob.w === 'keychain' || opts.unlock === true });
  async function mainRemovalCheck(opts) {
    if (!firstOtherHere()) throw fail('wallet_last');
    if (status.kind !== 'signer') throw fail('no_secret');
    const lib = await bundle();
    const blob = await currentBlob();
    const opened = await removalOpen(blob, opts);
    let seen, orders;
    try {
      seen = await oldHoldings(lib, blob, strictFor(blob, opts));
      const body = await T.api('orders');
      const mine = orderSetOf(lib, { a: blob.a, pk: blob.pk });
      orders = (Array.isArray(body.orders) ? body.orders : []).filter((row) => mine.has(T.rawAddress(row.orderWallet)) && OPEN_ORDER.has(row.state));
    } catch (err) {
      console.warn('wallets: nobody can say what the first wallet holds', err && (err.code || err.message));
      throw fail('wallet_unsure');
    }
    if (seen.any || orders.length) throw fail('wallet_has_funds');
    if (!seen.empty) throw fail('wallet_unsure');
    return { entry: null, opened };
  }
  async function removalCheck(address, options) {
    const opts = options || {};
    const raw = T.rawAddress(address);
    if (raw === status.address) return mainRemovalCheck(opts);
    const entry = extras.get(raw);
    if (!entry) throw fail('no_wallet');
    if (!entry.here) throw fail('no_secret');
    if (mainHidden && [...extras.values()].filter((one) => one.here).length < 2) throw fail('wallet_last');
    const slot = await slotRead(entry.key);
    if (!slot.ok || !slot.blob || slot.blob.a !== raw) throw fail('storage_timeout');
    if (!(await extraBackupRead(raw).catch(() => null))) throw fail('wallet_unsure');
    const lib = await bundle();
    const opened = await removalOpen(slot.blob, opts);
    let seen, orders;
    try {
      seen = await oldHoldings(lib, slot.blob, strictFor(slot.blob, opts));
      const body = await T.api('orders');
      const mine = orderSetOf(lib, entry);
      orders = (Array.isArray(body.orders) ? body.orders : []).filter((row) => mine.has(T.rawAddress(row.orderWallet)) && OPEN_ORDER.has(row.state));
    } catch (err) {
      console.warn('wallets: nobody can say what this wallet holds', err && (err.code || err.message));
      throw fail('wallet_unsure');
    }
    if (seen.any || orders.length) throw fail('wallet_has_funds');
    if (!seen.empty) throw fail('wallet_unsure');
    return { entry, opened };
  }
  function removeWallet(address, options) {
    return walletJob(async () => {
      await requireLaunch();
      if (signing) throw fail('busy');
      const { entry, opened } = await removalCheck(address, { ...(options || {}), unlock: true });
      if (!opened && onPhone() && !onDevice() && (await biometrics().catch(() => null)) && !(await fingerOwner('walletKey.ownerRemove'))) throw fail('owner_unconfirmed');
      if (!entry) {
        const before = activeExtra;
        const next = activeExtra || firstOtherHere();
        if (!next) throw fail('wallet_last');
        mainHidden = true;
        try {
          await walletsWrite(status.address);
        } catch (err) {
          mainHidden = false;
          throw err;
        }
        if (next !== before) pickActive(next);
        showWallet(status.address, status.kind);
        tellBackup();
        return;
      }
      await slotJob(async () => {
        const main = status.address;
        const slot = await slotRead(entry.key);
        if (!slot.ok) throw fail('storage_timeout');
        if (!slot.blob || slot.blob.a !== entry.a) throw fail('busy');
        const evmKey = perWalletKey(EVM_RECORD_KEY, entry.a);
        extras.delete(entry.a);
        if (activeExtra === entry.a) {
          pickActive(mainHidden ? firstOtherHere() : null);
          showWallet(main, status.kind);
        }
        try {
          await walletsWrite(main);
          await extraBackupKeep(entry.a);
          await cloudDrop(extraBackupKey(entry.a));
          await slotRemove(entry.key);
        } catch (err) {
          await extrasLook(main).catch(() => extras.set(entry.a, entry));
          throw err;
        }
        pendingClear(entry.a);
        const store = cloudStore();
        await tgCall((done) => store.removeItem(evmKey, done), cloudMs()).catch(() => null);
      });
      tellBackup();
    });
  }
  async function bringBackWallets(options) {
    const opts = options || {};
    while (extrasJob) await extrasJob.catch(() => null);
    const first = await currentBlob();
    if (first.w === 'pass') await openSealed(first, opts.password, () => null, true);
    while (extrasJob) await extrasJob.catch(() => null);
    const hereNow = () => [...extras.values()].filter((one) => one.here).length;
    const before = hereNow();
    await extrasSync({ ...opts, ask: true });
    return hereNow() - before;
  }
  async function extraSaveBackup(options) {
    const opts = options || {};
    const entry = extras.get(activeExtra);
    const blob = await activeBlob();
    const first = await currentBlob();
    const account = await extraKeyOf(first, opts.password);
    await withSecret(blob, opts.password, ({ words, kind }) => extraBackupPut(words, blob.a, account, kind));
    entry.backup = 'have';
    tellBackup();
    return true;
  }
  const wallets = Object.freeze({
    list: walletRows,
    ready: () => Promise.resolve(extrasJob).then(() => slotQueue).then(() => undefined),
    limit: () => (secureStore() ? Math.min(WALLETS_MAX, 1 + extraSlotCount()) : 1),
    switchTo,
    add: (options) => addWallet(null, options),
    import: (words, options) => addWallet(words, options),
    rename: renameWallet,
    removable: (address) => removalCheck(address).then(() => true),
    remove: removeWallet,
    bringBack: bringBackWallets,
    legacyFunds,
    legacyLook,
    legacyLast,
    moveLegacy,
    isExtra: (address) => extras.has(address)
  });

  const DIR_DOMAIN = 'devpool-directory-v1';
  const DIR_MAX_AGE_S = 8 * 24 * 60 * 60;
  const DIR_FUTURE_S = 10 * 60;
  const DIR_REPUBLISH_MS = 7 * 24 * 60 * 60 * 1000;
  const DIR_PUB_LOCAL = 'ck-dir-pub:';
  const DIR_OFF_LOCAL = 'ck-dir-off:';
  const DIR_PIN_LOCAL = 'ck-dir-pin:';
  const DIR_USERNAME = /^[a-z0-9_]{4,32}$/;
  const DIR_ADDRESS = Object.freeze({ ton: /^0:[0-9a-f]{64}$/, evm: /^0x[0-9a-f]{40}$/, sol: NET_ADDRESS.sol, tron: NET_ADDRESS.tron });
  const DIR_NETS = ['evm', 'sol', 'tron'];
  const DIR_PHOTO = /^https:\/\/t\.me\/i\/userpic\/\d{2,4}\/[A-Za-z0-9_=-]{8,128}\.(jpe?g|svg)$/;
  const DIR_CACHE_MS = 60000;
  const DIR_MS = 8000;
  const dirName = (text) => {
    const value = typeof text === 'string' ? text.trim().replace(/^@/, '').toLowerCase() : '';
    return DIR_USERNAME.test(value) ? value : null;
  };
  function directoryCanonical(record) {
    return [DIR_DOMAIN, `tg:${record.tg}`, `u:${record.u}`, `ton:${record.ton}`, `evm:${record.evm || ''}`, `sol:${record.sol || ''}`, `tron:${record.tron || ''}`, `ts:${record.ts}`].join('\n');
  }
  function dirClean(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const allowed = new Set(['tg', 'u', 'ton', 'ts', ...DIR_NETS]);
    if (Object.keys(raw).some((key) => !allowed.has(key))) return null;
    if (!Number.isSafeInteger(raw.tg) || raw.tg <= 0 || typeof raw.u !== 'string' || !DIR_USERNAME.test(raw.u) || typeof raw.ton !== 'string' || !DIR_ADDRESS.ton.test(raw.ton) || !Number.isSafeInteger(raw.ts) || raw.ts <= 0) return null;
    const out = { tg: raw.tg, u: raw.u, ton: raw.ton, ts: raw.ts };
    for (const net of DIR_NETS) {
      if (raw[net] === undefined || raw[net] === '') continue;
      if (typeof raw[net] !== 'string' || !DIR_ADDRESS[net].test(raw[net])) return null;
      out[net] = raw[net];
    }
    return out;
  }
  const fromHex = (hex) => Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16));
  const libBytes = (lib, bytes) => (lib.Buffer ? lib.Buffer.from(bytes) : bytes);
  let dirLogin = null;
  async function dirLoginRead() {
    if (dirLogin) return dirLogin;
    if (!launchOk() || !launchData) return null;
    let user = null;
    try { user = JSON.parse(new URLSearchParams(launchData).get('user') || 'null'); } catch (_) { user = null; }
    if (!user || !Number.isSafeInteger(user.id) || user.id !== launchUser) return null;
    const face = [user.first_name, user.last_name, user.photo_url].map((v) => (typeof v === 'string' ? v : '')).join('\n');
    dirLogin = { id: user.id, username: dirName(user.username || ''), face };
    return dirLogin;
  }
  const dirOff = () => !!launchUser && localGet(DIR_OFF_LOCAL + launchUser) === '1';
  async function dirCall(pathName, body) {
    const data = await CK.tg.whenInitData();
    if (!data || !launchOk()) throw fail('tg_only');
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), DIR_MS);
    let res, json = null;
    try {
      res = await fetch('api/' + pathName, {
        method: body ? 'POST' : 'GET',
        headers: body ? { Authorization: 'tma ' + data, 'Content-Type': 'application/json' } : { Authorization: 'tma ' + data },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: abort.signal
      });
      json = await res.json().catch(() => null);
    } catch (_) {
      throw fail('directory_unknown');
    } finally {
      clearTimeout(timer);
    }
    if (json && json.ok === true) return json;
    const code = json && typeof json.error === 'string' ? json.error : 'directory_unknown';
    throw fail(code === 'not_found' || code === 'rate_limited' || code === 'opted_out' || code === 'bad_username' ? code : 'directory_unknown', { server: code });
  }
  function dirFields(own) {
    if (!dirLogin || !dirLogin.username || !own || !DIR_ADDRESS.ton.test(own)) return null;
    return { tg: dirLogin.id, u: dirLogin.username, ton: own };
  }
  const dirShape = (fields) => `${directoryCanonical({ ...fields, ts: 0 })}\nface:${(dirLogin && dirLogin.face) || ''}`;
  function dirNeeds(own) {
    if (!launchOk() || !launchUser || dirOff() || mainHidden || !status.address || own !== status.address || status.mismatch || status.legacy) return null;
    const fields = dirFields(own);
    if (!fields) return null;
    let mark = null;
    try { mark = JSON.parse(localGet(DIR_PUB_LOCAL + launchUser) || 'null'); } catch (_) { mark = null; }
    if (mark && mark.h === dirShape(fields) && Date.now() - Number(mark.at) < DIR_REPUBLISH_MS) return null;
    return fields;
  }
  let dirPublishing = false;
  function dirSignNow(lib, keys, own, fields) {
    if (dirPublishing || !fields || addressOf(lib, keys.publicKey) !== own) return;
    const record = { ...fields, ts: Math.floor(Date.now() / 1000) };
    let sig;
    try {
      sig = toHex(lib.sign(libBytes(lib, utf8(directoryCanonical(record))), keys.secretKey));
    } catch (err) {
      console.warn('directory: published at a later unlock', err && err.message);
      return;
    }
    const pk = toHex(keys.publicKey);
    dirPublishing = true;
    dirCall('directory/publish', { record, sig, pk }).then(() => {
      localSet(DIR_PUB_LOCAL + launchUser, JSON.stringify({ h: dirShape(fields), at: Date.now() }));
    }, (err) => {
      if (err.code === 'opted_out') localSet(DIR_OFF_LOCAL + launchUser, '1');
      else console.warn('directory: published at a later launch', err && (err.server || err.code));
    }).finally(() => { dirPublishing = false; });
  }
  function directoryAtUnlock(lib, keys, blob) {
    try {
      if (blob.w === 'keychain' || dirPublishing) return;
      const fields = dirNeeds(blob.a);
      if (fields) dirSignNow(lib, keys, blob.a, fields);
    } catch (err) {
      console.warn('directory: published at a later unlock', err && err.message);
    }
  }
  async function directoryUnlistAtLaunch(now) {
    if (!launchOk() || !launchUser || dirOff() || !localGet(DIR_PUB_LOCAL + launchUser)) return;
    const login = await dirLoginRead().catch(() => null);
    if (!login) return;
    if (login.username && !mainHidden && now.kind !== 'none') return;
    await dirCall('directory/unlist', {});
    localSet(DIR_PUB_LOCAL + launchUser, '');
  }
  async function directoryAtLaunch(now) {
    if (now.kind !== 'signer' || now.method !== 'keychain' || now.mismatch || now.legacy || !now.address || signing || !launchOk()) return;
    await dirLoginRead().catch(() => null);
    const fields = dirNeeds(now.address);
    if (!fields || dirPublishing) return;
    const blob = await currentBlob();
    if (blob.a !== now.address || blob.w !== 'keychain') return;
    await openSealed(blob, undefined, ({ lib, keys }) => dirSignNow(lib, keys, blob.a, dirNeeds(blob.a)), true);
  }
  const dirCache = new Map();
  async function dirResolve(text) {
    const u = dirName(text);
    if (!u) throw fail('bad_username');
    const cached = dirCache.get(u);
    if (cached && Date.now() - cached.at < DIR_CACHE_MS) return cached.value;
    let body;
    try {
      body = await dirCall('directory/resolve', { u });
    } catch (err) {
      if (err.code !== 'not_found') throw err;
      const none = Object.freeze({ found: false, username: u });
      dirCache.set(u, { at: Date.now(), value: none });
      return none;
    }
    const record = dirClean(body.record);
    const nowS = Math.floor(Date.now() / 1000);
    if (!record || record.u !== u || body.tgId !== record.tg || DIR_NETS.some((net) => record[net]) || typeof body.pk !== 'string' || !/^[0-9a-f]{64}$/.test(body.pk) || typeof body.sig !== 'string' || !/^[0-9a-f]{128}$/.test(body.sig)) throw fail('directory_unverified');
    if (record.ts < nowS - DIR_MAX_AGE_S || record.ts > nowS + DIR_FUTURE_S) throw fail('directory_unverified');
    const lib = await bundle();
    const pk = fromHex(body.pk);
    if (addressOf(lib, libBytes(lib, pk)) !== record.ton) throw fail('directory_unverified');
    let ok = false;
    try { ok = lib.signVerify(libBytes(lib, utf8(directoryCanonical(record))), libBytes(lib, fromHex(body.sig)), libBytes(lib, pk)) === true; } catch (_) { ok = false; }
    if (!ok) throw fail('directory_unverified');
    const name = typeof body.name === 'string' ? Array.from(body.name.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').trim()).slice(0, 64).join('') : '';
    const photo = typeof body.photoUrl === 'string' && DIR_PHOTO.test(body.photoUrl) ? body.photoUrl : null;
    const pinKey = DIR_PIN_LOCAL + await sha256Hex(`${launchUser}:${u}`);
    const pinH = await sha256Hex(`${body.pk}:${record.tg}`);
    let pinned = dirPinRead(pinKey);
    if (!pinned) {
      let old = null;
      try { old = JSON.parse(localGet(DIR_PIN_LOCAL + u) || 'null'); } catch (_) { old = null; }
      if (old && typeof old.pk === 'string' && Number.isSafeInteger(old.tg)) pinned = { h: await sha256Hex(`${old.pk}:${old.tg}`), ts: 0 };
      try { localStorage.removeItem(DIR_PIN_LOCAL + u); } catch (_) { }
    }
    if (pinned && record.ts < pinned.ts) throw fail('directory_unverified');
    if (!pinned || (pinned.h === pinH && record.ts > pinned.ts)) localSet(pinKey, JSON.stringify({ h: pinH, ts: record.ts }));
    const keyChanged = !!pinned && pinned.h !== pinH;
    const value = Object.freeze({ found: true, tgId: record.tg, username: u, name, photoUrl: photo, address: record.ton, friendly: T.friendlyAddress(record.ton), evm: null, sol: null, tron: null, ts: record.ts, keyChanged });
    dirPks.set(value, { key: pinKey, h: pinH, ts: record.ts });
    dirCache.set(u, { at: Date.now(), value });
    return value;
  }
  const dirPks = new WeakMap();
  function dirPinRead(key) {
    let one = null;
    try { one = JSON.parse(localGet(key) || 'null'); } catch (_) { one = null; }
    return one && typeof one.h === 'string' && Number.isSafeInteger(one.ts) ? one : null;
  }
  async function sha256Hex(text) {
    return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', utf8(text))));
  }
  function dirPin(found) {
    const pin = found ? dirPks.get(found) : null;
    if (!pin) return false;
    const was = dirPinRead(pin.key);
    if (was && was.ts > pin.ts) return false;
    localSet(pin.key, JSON.stringify({ h: pin.h, ts: pin.ts }));
    dirCache.delete(found.username);
    return true;
  }
  function dirForgot() {
    if (!launchUser) return;
    localSet(DIR_OFF_LOCAL + launchUser, '1');
    localSet(DIR_PUB_LOCAL + launchUser, '');
  }
  async function dirSetFindable(on) {
    if (typeof on !== 'boolean') throw fail('bad_intent');
    await requireLaunch();
    const answer = await dirCall('directory/settings', { on });
    if (launchUser) {
      localSet(DIR_OFF_LOCAL + launchUser, on ? '' : '1');
      localSet(DIR_PUB_LOCAL + launchUser, '');
    }
    if (on) directoryAtLaunch(status).catch((err) => console.warn('directory: published at a later launch', err && (err.code || err.message)));
    return { on: answer.on === true, listed: answer.listed === true };
  }
  async function dirLook() {
    const answer = await dirCall('directory/me');
    if (launchUser) localSet(DIR_OFF_LOCAL + launchUser, answer.on === false ? '1' : '');
    return { on: answer.on !== false, listed: answer.listed === true, username: dirName(answer.username || '') };
  }
  const directory = Object.freeze({
    resolve: dirResolve,
    state: () => ({ on: !dirOff(), username: dirLogin ? dirLogin.username : null }),
    look: dirLook,
    setFindable: dirSetFindable,
    pin: dirPin,
    forgot: dirForgot,
    canonical: (record) => directoryCanonical(record)
  });

  const INV_DOMAIN = 'devpool-invoice-v1';
  const INV_PUB_LOCAL = 'ck-inv-pub:';
  const INV_REPUBLISH_MS = 7 * 24 * 60 * 60 * 1000;
  const INV_MAX_AGE_S = 30 * 24 * 60 * 60;
  function invoiceCanonical(record) {
    return [INV_DOMAIN, `tg:${record.tg}`, `ton:${record.ton}`, `ts:${record.ts}`].join('\n');
  }
  function invNeeds(own) {
    if (!launchOk() || !Number.isSafeInteger(launchUser) || !status.address || own !== status.address || status.mismatch || status.legacy || !DIR_ADDRESS.ton.test(own || '')) return false;
    let mark = null;
    try { mark = JSON.parse(localGet(INV_PUB_LOCAL + launchUser) || 'null'); } catch (_) { mark = null; }
    return !(mark && mark.a === own && Date.now() - Number(mark.at) < INV_REPUBLISH_MS);
  }
  let invPublishing = null;
  function invSignNow(lib, keys, own) {
    if (invPublishing) return invPublishing;
    if (addressOf(lib, keys.publicKey) !== own) return Promise.reject(fail('address_mismatch'));
    const record = { tg: launchUser, ton: own, ts: Math.floor(Date.now() / 1000) };
    const sig = toHex(lib.sign(libBytes(lib, utf8(invoiceCanonical(record))), keys.secretKey));
    const pk = toHex(keys.publicKey);
    invPublishing = dirCall('invoices/wallet', { record, sig, pk }).then((answer) => {
      localSet(INV_PUB_LOCAL + launchUser, JSON.stringify({ a: own, at: Date.now() }));
      return { ts: answer.ts || record.ts };
    }).finally(() => { invPublishing = null; });
    return invPublishing;
  }
  function invoiceAtUnlock(lib, keys, blob) {
    try {
      if (invPublishing || !invNeeds(blob.a)) return;
      invSignNow(lib, keys, blob.a).catch((err) => console.warn('invoices: published at a later unlock', err && (err.server || err.code)));
    } catch (err) {
      console.warn('invoices: published at a later unlock', err && err.message);
    }
  }
  async function invoiceAtLaunch(now) {
    if (now.kind !== 'signer' || now.method !== 'keychain' || now.mismatch || now.legacy || !now.address || signing || !launchOk() || !invNeeds(now.address) || invPublishing) return;
    const blob = await currentBlob();
    if (blob.a !== now.address || blob.w !== 'keychain') return;
    await openSealed(blob, undefined, ({ lib, keys }) => { invSignNow(lib, keys, blob.a).catch((err) => console.warn('invoices: published at a later launch', err && (err.server || err.code))); }, true);
  }
  async function invPublish(options) {
    await requireLaunch();
    const blob = await activeBlob((options || {}).wallet);
    const password = (options || {}).password;
    const run = ({ lib, keys }) => invSignNow(lib, keys, blob.a);
    return extras.has(blob.a) ? withSecret(blob, password, run) : openSealed(blob, password, run, true);
  }
  async function invVerify(inv) {
    const bad = () => fail('invoice_unverified');
    const proof = inv && inv.proof;
    const record = proof && proof.record;
    if (!record || typeof record !== 'object' || record.tg !== inv.creatorId || record.ton !== inv.to || !DIR_ADDRESS.ton.test(inv.to || '')) throw bad();
    if (!Number.isSafeInteger(record.ts) || record.ts < Math.floor(Date.now() / 1000) - INV_MAX_AGE_S) throw bad();
    if (typeof proof.pk !== 'string' || !/^[0-9a-f]{64}$/.test(proof.pk) || typeof proof.sig !== 'string' || !/^[0-9a-f]{128}$/.test(proof.sig)) throw bad();
    let words;
    if (proof.kind === 'inv') {
      if (Object.keys(record).length !== 3) throw bad();
      words = invoiceCanonical(record);
    } else if (proof.kind === 'dir') {
      const card = dirClean(record);
      if (!card || DIR_NETS.some((net) => card[net])) throw bad();
      words = directoryCanonical(card);
    } else throw bad();
    const lib = await bundle();
    const pk = fromHex(proof.pk);
    if (addressOf(lib, libBytes(lib, pk)) !== inv.to) throw bad();
    let ok = false;
    try { ok = lib.signVerify(libBytes(lib, utf8(words)), libBytes(lib, fromHex(proof.sig)), libBytes(lib, pk)) === true; } catch (_) { ok = false; }
    if (!ok) throw bad();
    return { address: inv.to, friendly: lib.Address.parseRaw(inv.to).toString({ bounceable: false, urlSafe: true, testOnly: false }) };
  }
  const invoice = Object.freeze({
    publish: invPublish,
    verify: invVerify,
    canonical: (record) => invoiceCanonical(record)
  });

  const CHEQUE_LABEL = 'devpool-cheque-v1\nton\n';
  const CHEQUE_NONCE = /^[0-9a-f]{16}$/;
  const CHEQUE_RAW = /^0:[0-9a-f]{64}$/;
  const CHEQUE_REF = /^[a-z0-9]{8}$/;
  const CHEQUE_TOPUP_NANO = 60000000n;
  const CHEQUE_FIELDS = new Set(['asset', 'units', 'expiresAt', 'kind', 'note', 'ref', 'jetton', 'count']);
  const CHEQUE_MULTI_LABEL = 'devpool-cheque-v1\nton-multi\n';
  const CHEQUE_SALT_LABEL = 'devpool-cheque-salt-v1\n';
  const CHEQUE_MSG_FEE_NANO = 1000000n;
  const CHEQUE_FUNDING_MAX_BYTES = 60000;
  const CHEQUE_EXPIRY_SLACK_S = 600;
  const CHEQUE_STATUS = new Set(['uninit', 'nonexist', 'active']);
  const CHEQUE_NOTE_BAD = /https?:|www\.|t\.me|tg:|@|[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/i;
  const chequeFundings = new Map();
  function chequeApi() {
    const held = Object.getOwnPropertyDescriptor(CK, 'chequeAudit');
    const api = held && held.value;
    if (!api || held.writable || held.configurable || !Object.isFrozen(api) || typeof api.audit !== 'function') throw fail('bad_intent');
    return api;
  }
  function readChequeIntent(CA, intent, nowS) {
    if (!intent || typeof intent !== 'object' || !onlyFields(intent, CHEQUE_FIELDS)) throw fail('bad_intent');
    const asset = intent.asset;
    if (asset !== 'gram' && asset !== 'usdt' && asset !== 'jetton') throw fail('bad_intent');
    const jetton = asset === 'jetton' ? T.rawAddress(intent.jetton) : null;
    if (asset === 'jetton' ? !jetton || !CHEQUE_RAW.test(jetton) || jetton === CA.USDT : intent.jetton !== undefined && intent.jetton !== null) throw fail('bad_intent');
    const count = intent.count === undefined || intent.count === null ? 1 : intent.count;
    if (!Number.isInteger(count) || count < 1 || count > CA.MULTI_MAX) throw fail('bad_intent', { reason: 'count' });
    const units = T.parseUnits(typeof intent.units === 'bigint' ? intent.units : String(intent.units));
    if (!units || units < (asset === 'usdt' ? CA.MIN_USDT : asset === 'jetton' ? CA.MIN_JETTON : CA.MIN_GRAM)) throw fail('bad_intent', { reason: 'min' });
    const expiresAt = intent.expiresAt;
    if (!Number.isInteger(expiresAt) || !CA.EXPIRY_DAYS.some((d) => Math.abs(expiresAt - nowS - d * 86400) <= CHEQUE_EXPIRY_SLACK_S)) throw fail('bad_intent', { reason: 'expiry' });
    const kind = intent.kind === undefined ? 'cheque' : intent.kind;
    if (kind !== 'cheque' && kind !== 'gift') throw fail('bad_intent');
    const note = intent.note === undefined || intent.note === null || intent.note === '' ? null : intent.note;
    if (note !== null && (kind !== 'gift' || typeof note !== 'string' || Array.from(note).length > CA.NOTE_MAX || CHEQUE_NOTE_BAD.test(note))) throw fail('bad_intent', { reason: 'note' });
    const ref = intent.ref === undefined || intent.ref === null ? null : intent.ref;
    if (ref !== null && (typeof ref !== 'string' || !CHEQUE_REF.test(ref))) throw fail('bad_intent');
    return { asset, units, expiresAt, kind, note, ref, jetton, count };
  }
  function readChequeRecord(record) {
    if (!record || typeof record !== 'object' || typeof record.address !== 'string' || !CHEQUE_RAW.test(record.address) || typeof record.nonce !== 'string' || !CHEQUE_NONCE.test(record.nonce)) throw fail('bad_intent');
    const slot = record.slot === undefined || record.slot === null ? null : record.slot;
    if (slot !== null && (!Number.isInteger(slot) || slot < 0 || slot >= chequeApi().MULTI_MAX)) throw fail('bad_intent');
    return { address: record.address, nonce: record.nonce, slot: slot !== null ? slot : record.multi === true ? 0 : null };
  }
  function readChequeChain(chain) {
    if (!chain || typeof chain !== 'object' || !Number.isInteger(chain.seqno) || chain.seqno < 0 || !CHEQUE_STATUS.has(chain.status)) throw fail('cheque_state');
    const gram = T.parseUnits(chain.gram);
    const jetton = chain.jetton === null || chain.jetton === undefined ? 0n : T.parseUnits(chain.jetton);
    if (gram === null || jetton === null) throw fail('cheque_state');
    const master = typeof chain.master === 'string' && CHEQUE_RAW.test(chain.master) ? chain.master : null;
    return { seqno: chain.seqno, status: chain.status, gram, jetton, master };
  }
  function sweepOf(lib, CA, ch, address, spec) {
    let asset = 'gram', jettonWallet = null;
    if (ch.jetton > 0n) {
      const master = ch.master || CA.USDT;
      if (master === CA.USDT) asset = 'usdt';
      else {
        if (!spec || typeof spec !== 'object' || T.rawAddress(spec.master) !== master) throw fail('cheque_state');
        const proven = CK.swapAudit.provenWalletOf(lib, master, address);
        const named = spec.wallet ? T.rawAddress(spec.wallet) : null;
        if (proven && named && proven !== named) throw fail('cheque_refused', { reason: 'jetton_wallet' });
        jettonWallet = proven || named;
        if (!jettonWallet || !CHEQUE_RAW.test(jettonWallet) || jettonWallet === address) throw fail('cheque_state');
        asset = 'jetton';
      }
    }
    if (ch.gram < CA.FLOOR[asset]) throw fail('cheque_short');
    return { asset, jettonWallet };
  }
  function sweepFloor(CA, ch) {
    const asset = ch.jetton > 0n ? (ch.master && ch.master !== CA.USDT ? 'jetton' : 'usdt') : 'gram';
    if (ch.gram < CA.FLOOR[asset]) throw fail('cheque_short');
  }
  async function confirmedJettonWallet(master, owner) {
    let body;
    try {
      await T.config();
      body = await T.api('wallet/jetton-wallet?address=' + encodeURIComponent(owner) + '&token=' + encodeURIComponent(master));
    } catch (_) {
      throw fail('cheque_refused', { reason: 'jetton_wallet' });
    }
    const wallet = body && T.rawAddress(body.wallet);
    if (!body || T.rawAddress(body.token) !== master || !wallet || !CHEQUE_RAW.test(wallet) || wallet === owner || wallet === master) throw fail('cheque_refused', { reason: 'jetton_wallet' });
    return wallet;
  }
  async function seedHmac(keys, text) {
    const seed = Uint8Array.from(keys.secretKey.subarray(0, 32));
    try {
      const key = await crypto.subtle.importKey('raw', seed, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(text)));
    } finally {
      seed.fill(0);
    }
  }
  const chequeKey = (keys, nonce) => seedHmac(keys, CHEQUE_LABEL + nonce);
  const multiKey = (keys, nonce) => seedHmac(keys, CHEQUE_MULTI_LABEL + nonce);
  const saltOf = async (keys, nonce, i) => {
    const bytes = await seedHmac(keys, CHEQUE_SALT_LABEL + nonce + '\n' + i);
    try { return toHex(bytes); } finally { bytes.fill(0); }
  };
  async function recordKey(CA, keys, rec) {
    if (rec.slot === null) return chequeKey(keys, rec.nonce);
    const m = await multiKey(keys, rec.nonce);
    try {
      return await CA.slotKeyOf(m, rec.slot, await saltOf(keys, rec.nonce, rec.slot));
    } finally {
      m.fill(0);
    }
  }
  function chequeOf(lib, k) {
    const seed = libBytes(lib, k);
    try {
      const pair = lib.keyPairFromSeed(seed);
      const contract = contractOf(lib, pair.publicKey);
      return { pair, contract, address: contract.address.toRawString(), publicKey: toHex(pair.publicKey) };
    } finally {
      if (seed !== k) seed.fill(0);
    }
  }
  const wipeCheque = (c) => { if (c && c.pair && c.pair.secretKey) c.pair.secretKey.fill(0); };
  function chequeRequest(lib, c, ch, actions, validUntil) {
    const body = c.contract.createRequest({ seqno: ch.seqno, secretKey: c.pair.secretKey, timeout: validUntil, actions });
    const init = ch.status !== 'active' ? c.contract.init : undefined;
    return lib.beginCell().store(lib.storeMessage(lib.external({ to: c.contract.address, init, body }))).endCell().toBoc().toString('base64');
  }
  async function signSweep(lib, CA, c, ch, asset, to, validUntil, jettonWallet) {
    const plan = { asset, cheque: c.address, to, jettonUnits: ch.jetton, jettonWallet: jettonWallet || null };
    const boc = chequeRequest(lib, c, ch, CA.sweepActions(lib, plan), validUntil);
    const wrong = CA.audit(lib, boc, { address: c.address, publicKey: c.pair.publicKey, init: ch.status !== 'active', seqno: ch.seqno, validUntil, actions: CA.expectSweep(lib, plan) });
    if (wrong) throw fail('cheque_refused', { reason: wrong });
    return { boc, hash: (await T.messageHash(boc)) || '', seqno: ch.seqno, validUntil, to, address: c.address, publicKey: c.publicKey, asset, units: (asset !== 'gram' ? ch.jetton : ch.gram).toString(), gram: ch.gram.toString() };
  }

  async function chequeCreate(intent, options) {
    const CA = chequeApi();
    const opts = options || {};
    const want = readChequeIntent(CA, intent, nowSeconds());
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob(opts.wallet);
      const lib = await bundle();
      const own = blob.a;
      const n = want.count;
      const total = want.units * BigInt(n);
      let ownJetton = null, jetton = null;
      if (want.asset === 'usdt') {
        ownJetton = CK.swapAudit.jettonWalletOf(lib, CA.USDT, own);
        const rows = await tokenRows(own);
        const row = rows.find((one) => one && T.rawAddress(one.token) === CA.USDT);
        if (!row || (T.parseUnits(String(row.units)) || 0n) < total) throw fail('insufficient_balance');
        if (row.wallet && T.rawAddress(row.wallet) !== ownJetton) throw fail('cheque_refused', { reason: 'jetton_wallet' });
      } else if (want.asset === 'jetton') {
        const rows = await tokenRows(own);
        const row = rows.find((one) => one && T.rawAddress(one.token) === want.jetton);
        if (!row || (T.parseUnits(String(row.units)) || 0n) < total) throw fail('insufficient_balance');
        if (row.risk === 'suspicious' || !Number.isInteger(row.decimals) || row.decimals < 0 || row.decimals > 18) throw fail('cheque_refused', { reason: 'token' });
        const proven = CK.swapAudit.provenWalletOf(lib, want.jetton, own);
        const named = row.wallet ? T.rawAddress(row.wallet) : null;
        if (proven) {
          if (named && named !== proven) throw fail('cheque_refused', { reason: 'jetton_wallet' });
          ownJetton = proven;
        } else {
          if (n > 1) throw fail('cheque_refused', { reason: 'jetton_multi' });
          if (!named || (await confirmedJettonWallet(want.jetton, own)) !== named) throw fail('cheque_refused', { reason: 'jetton_wallet' });
          ownJetton = named;
        }
        jetton = { master: want.jetton, decimals: row.decimals, proven: !!proven };
      }
      const perSlot = want.asset === 'usdt' ? CA.CREATE_USDT_ATTACH : want.asset === 'jetton' ? CA.CREATE_JETTON_ATTACH + CA.GAS_JETTON : want.units + CA.GAS_GRAM;
      const messageCount = n * (want.asset === 'jetton' ? 2 : 1);
      const needs = perSlot * BigInt(n) + GAS_NANO + BigInt(messageCount - 1) * CHEQUE_MSG_FEE_NANO;
      let chain = await chainForSend(own, needs);
      const owner = await confirmOwner(blob, opts.password, 'walletKey.ownerSend');
      if (owner.blob.a !== blob.a) throw fail('busy');
      const checkedAt = Date.now();
      return await withSecret(owner.blob, owner.password, async ({ keys }) => {
        stillActive(blob);
        if (Date.now() - checkedAt > CHAIN_FRESH_MS) chain = await chainForSend(own, needs);
        const nonce = toHex(randomBytes(8));
        const slots = [];
        let m = null;
        try {
          if (n === 1) {
            const k = await chequeKey(keys, nonce);
            slots.push({ k, c: chequeOf(lib, k), salt: null });
          } else {
            m = await multiKey(keys, nonce);
            for (let i = 0; i < n; i++) {
              const salt = await saltOf(keys, nonce, i);
              const k = await CA.slotKeyOf(m, i, salt);
              slots.push({ k, c: chequeOf(lib, k), salt });
            }
          }
          for (const one of slots) {
            one.jw = want.asset === 'usdt' ? CK.swapAudit.jettonWalletOf(lib, CA.USDT, one.c.address)
              : jetton ? (jetton.proven ? CK.swapAudit.provenWalletOf(lib, jetton.master, one.c.address) : await confirmedJettonWallet(jetton.master, one.c.address)) : null;
            if (want.asset !== 'gram' && !one.jw) throw fail('cheque_refused', { reason: 'jetton_wallet' });
          }
          const validUntil = nowSeconds() + VALID_S;
          const plan = slots.flatMap((one) => CA.expectFunding(lib, { asset: want.asset, units: want.units, cheque: one.c.address, owner: own, ownWallet: ownJetton }));
          const messages = slots.flatMap((one) => {
            if (want.asset === 'gram') return [lib.internal({ to: lib.Address.parseRaw(one.c.address), value: want.units + CA.GAS_GRAM, bounce: false })];
            const forward = want.asset === 'usdt' ? CA.GAS_USDT : 0n;
            const attach = want.asset === 'usdt' ? CA.CREATE_USDT_ATTACH : CA.CREATE_JETTON_ATTACH;
            const body = bodyOf(lib, { kind: 'chequeJetton', units: want.units, recipient: one.c.address, owner: own, forward });
            const out = [lib.internal({ to: lib.Address.parseRaw(ownJetton), value: attach, bounce: true, body })];
            if (want.asset === 'jetton') out.push(lib.internal({ to: lib.Address.parseRaw(one.c.address), value: CA.GAS_JETTON, bounce: false }));
            return out;
          });
          const fundingBoc = externalOf(lib, keys, undefined, SEND_MODE, messages, chain, validUntil);
          if (atob(fundingBoc).length > CHEQUE_FUNDING_MAX_BYTES) throw fail('cheque_refused', { reason: 'too_big' });
          const wrongFunding = CA.audit(lib, fundingBoc, { address: own, publicKey: keys.publicKey, init: chain.seqno === 0 && chain.status !== 'active', seqno: chain.seqno, validUntil, actions: plan });
          if (wrongFunding) throw fail('cheque_refused', { reason: 'funding_' + wrongFunding });
          const refundUntil = want.expiresAt + CA.REFUND_GRACE_S;
          const refunds = [];
          for (const one of slots) refunds.push((await signSweep(lib, CA, one.c, { seqno: 0, status: 'uninit', gram: 0n, jetton: want.asset !== 'gram' ? want.units : 0n }, want.asset, own, refundUntil, one.jw)).boc);
          const linkKey = n === 1 ? slots[0].k : m;
          const lid = await CA.lidOf(linkKey);
          const link = CA.formatLink(linkKey, want.ref);
          const funding = Object.freeze({ boc: fundingBoc, hash: (await T.messageHash(fundingBoc)) || '', seqno: chain.seqno, validUntil });
          chequeFundings.set(fundingBoc, { own, funding });
          const gas = want.asset === 'usdt' ? CA.GAS_USDT : want.asset === 'jetton' ? CA.GAS_JETTON : CA.GAS_GRAM;
          return {
            address: slots[0].c.address, publicKey: slots[0].c.publicKey, nonce, lid, link, wallet: own,
            asset: want.asset, units: want.units.toString(), gas: gas.toString(),
            kind: want.kind, note: want.note, expiresAt: want.expiresAt, funding, refundBoc: refunds[0], count: n,
            jetton: jetton ? { master: jetton.master, decimals: jetton.decimals, wallet: slots[0].jw } : null,
            slots: n > 1 ? slots.map((one, i) => ({ address: one.c.address, publicKey: one.c.publicKey, salt: one.salt, refundBoc: refunds[i], ...(jetton ? { jettonWallet: one.jw } : {}) })) : null
          };
        } finally {
          if (m) m.fill(0);
          slots.forEach((one) => { one.k.fill(0); wipeCheque(one.c); });
        }
      });
    } finally {
      signing = false;
    }
  }
  async function chequeSend(created) {
    const held = created && created.funding && typeof created.funding.boc === 'string' ? chequeFundings.get(created.funding.boc) : null;
    if (!held) throw fail('bad_intent');
    chequeFundings.delete(created.funding.boc);
    const f = held.funding;
    if (nowSeconds() > f.validUntil) throw fail('cheque_stale');
    const chain = await chainState(held.own);
    if (pendingAgainst(held.own, chain)) throw fail('pending');
    if (chain.seqno !== f.seqno) throw fail('cheque_stale');
    pendingWrite(held.own, { seqno: f.seqno, hash: f.hash, validUntil: f.validUntil, boc: f.boc });
    let sent;
    try {
      sent = await broadcast(f.boc);
    } catch (err) {
      if (SEND_FINAL.has(err.code)) pendingClear(held.own);
      throw err;
    }
    return { hash: sent.hash || f.hash };
  }
  const chequeDrop = (created) => { if (created && created.funding) chequeFundings.delete(created.funding.boc); };
  async function chequeAddressOf(link) {
    const CA = chequeApi();
    const parsed = CA.parseLink(link);
    if (!parsed) throw fail('cheque_link');
    const lib = await bundle();
    let c = null;
    try {
      c = chequeOf(lib, parsed.k);
      return { address: c.address, publicKey: c.publicKey, lid: await CA.lidOf(parsed.k), ref: parsed.ref };
    } finally {
      parsed.k.fill(0);
      wipeCheque(c);
    }
  }
  const CLAIM_OPTIONS = new Set(['to', 'chain', 'slot', 'jetton']);
  async function chequeClaim(link, options) {
    const CA = chequeApi();
    if (!options || typeof options !== 'object' || !onlyFields(options, CLAIM_OPTIONS)) throw fail('bad_intent');
    const parsed = CA.parseLink(link);
    if (!parsed) throw fail('cheque_link');
    let c = null, k = parsed.k;
    try {
      const ch = readChequeChain(options.chain);
      sweepFloor(CA, ch);
      const own = await depositAddress();
      if (!own.verified || typeof options.to !== 'string' || options.to !== own.address) throw fail('bad_intent');
      const lib = await bundle();
      if (options.slot !== undefined && options.slot !== null) {
        const slot = options.slot;
        if (!slot || typeof slot !== 'object' || !Number.isInteger(slot.i) || typeof slot.salt !== 'string' || typeof slot.address !== 'string' || !CHEQUE_RAW.test(slot.address)) throw fail('bad_intent');
        try {
          k = await CA.slotKeyOf(parsed.k, slot.i, slot.salt);
        } catch (_) {
          throw fail('cheque_link');
        }
        c = chequeOf(lib, k);
        if (c.address !== slot.address) throw fail('cheque_link');
      } else c = chequeOf(lib, k);
      const { asset, jettonWallet } = sweepOf(lib, CA, ch, c.address, options.jetton);
      return await signSweep(lib, CA, c, ch, asset, own.address, nowSeconds() + CA.SIGN_VALID_S, jettonWallet);
    } finally {
      parsed.k.fill(0);
      if (k !== parsed.k) k.fill(0);
      wipeCheque(c);
    }
  }
  async function withFunder(options, owner, fn) {
    const CA = chequeApi();
    if (signing) throw fail('busy');
    signing = true;
    try {
      const blob = await activeBlob((options || {}).wallet);
      const lib = await bundle();
      const opened = owner ? await confirmOwner(blob, (options || {}).password, 'walletKey.ownerSend') : { blob, password: (options || {}).password };
      if (opened.blob.a !== blob.a) throw fail('busy');
      return await withSecret(opened.blob, opened.password, async ({ keys }) => {
        stillActive(blob);
        return fn({ CA, lib, keys, own: blob.a });
      });
    } finally {
      signing = false;
    }
  }
  async function withChequeKey(record, options, owner, fn) {
    const rec = readChequeRecord(record);
    return withFunder(options, owner, async ({ CA, lib, keys, own }) => {
      let k = null, c = null, m = null;
      try {
        k = await recordKey(CA, keys, rec);
        c = chequeOf(lib, k);
        if (c.address !== rec.address) throw fail('cheque_not_mine');
        if (rec.slot !== null) m = await multiKey(keys, rec.nonce);
        return await fn({ CA, lib, keys, k, m, c, own });
      } finally {
        if (k) k.fill(0);
        if (m) m.fill(0);
        wipeCheque(c);
      }
    });
  }
  async function chequeReturn(record, options) {
    const ch = readChequeChain((options || {}).chain);
    sweepFloor(chequeApi(), ch);
    return withChequeKey(record, options, false, ({ CA, lib, c, own }) => {
      const { asset, jettonWallet } = sweepOf(lib, CA, ch, c.address, (options || {}).jetton);
      return signSweep(lib, CA, c, ch, asset, own, nowSeconds() + CA.SIGN_VALID_S, jettonWallet);
    });
  }
  async function chequeReturnSlots(group, options) {
    const o = options || {};
    if (!group || typeof group.nonce !== 'string' || !CHEQUE_NONCE.test(group.nonce) || !Array.isArray(o.slots) || !o.slots.length || o.slots.length > chequeApi().MULTI_MAX) throw fail('bad_intent');
    const wanted = o.slots.map((one) => ({ rec: readChequeRecord({ address: one && one.address, nonce: group.nonce, slot: one && one.i }), chain: one && one.chain }));
    return withFunder(o, false, async ({ CA, lib, keys, own }) => {
      const out = [];
      for (const { rec, chain } of wanted) {
        let k = null, c = null;
        try {
          const ch = readChequeChain(chain);
          k = await recordKey(CA, keys, rec);
          c = chequeOf(lib, k);
          if (c.address !== rec.address) throw fail('cheque_not_mine');
          const { asset, jettonWallet } = sweepOf(lib, CA, ch, c.address, o.jetton);
          out.push({ i: rec.slot, ...(await signSweep(lib, CA, c, ch, asset, own, nowSeconds() + CA.SIGN_VALID_S, jettonWallet)) });
        } catch (err) {
          out.push({ i: rec.slot, address: rec.address, error: err.code || 'cheque_state' });
        } finally {
          if (k) k.fill(0);
          wipeCheque(c);
        }
      }
      return out;
    });
  }
  function chequeRelink(record, options) {
    const ref = (options || {}).ref;
    if (ref !== undefined && ref !== null && (typeof ref !== 'string' || !CHEQUE_REF.test(ref))) return Promise.reject(fail('bad_intent'));
    return withChequeKey(record, options, true, ({ CA, k, m }) => CA.formatLink(m || k, ref || null));
  }
  const chequeTopUps = new Map();
  async function chequeTopUp(record, options) {
    const own = (await activeBlob((options || {}).wallet)).a;
    await chainForSend(own, CHEQUE_TOPUP_NANO + GAS_NANO);
    return withChequeKey(record, options, true, async ({ CA, lib, keys, c }) => {
      const chain = await chainForSend(own, CHEQUE_TOPUP_NANO + GAS_NANO);
      const validUntil = nowSeconds() + VALID_S;
      const boc = buildSigned(lib, keys, { kind: 'transfer', to: c.address, amount: CHEQUE_TOPUP_NANO, bounce: false, comment: '' }, chain, validUntil);
      const wrong = CA.audit(lib, boc, { address: own, publicKey: keys.publicKey, init: chain.seqno === 0 && chain.status !== 'active', seqno: chain.seqno, validUntil, actions: [{ to: c.address, value: CHEQUE_TOPUP_NANO, bounce: false, mode: SEND_MODE, jetton: null }] });
      if (wrong) throw fail('cheque_refused', { reason: wrong });
      const hash = (await T.messageHash(boc)) || '';
      pendingWrite(own, { seqno: chain.seqno, hash, validUntil, boc });
      chequeTopUps.set(boc, own);
      return { boc, hash, seqno: chain.seqno, validUntil };
    });
  }
  async function chequeTopUpSend(top) {
    const own = top && typeof top.boc === 'string' ? chequeTopUps.get(top.boc) : null;
    if (!own) throw fail('bad_intent');
    chequeTopUps.delete(top.boc);
    try {
      const sent = await broadcast(top.boc);
      return { hash: sent.hash || top.hash };
    } catch (err) {
      if (SEND_FINAL.has(err.code)) pendingClear(own);
      throw err;
    }
  }
  const cheque = Object.freeze({
    create: chequeCreate,
    send: chequeSend,
    drop: chequeDrop,
    addressOf: chequeAddressOf,
    claim: chequeClaim,
    returnSigned: chequeReturn,
    relink: chequeRelink,
    returnSlots: chequeReturnSlots,
    topUpGas: chequeTopUp,
    sendTopUp: chequeTopUpSend,
    TOPUP_NANO: CHEQUE_TOPUP_NANO
  });

  const ready = ensure().catch((err) => {
    console.error(err);
    return status;
  }).then(shownStatus);
  if (sdkTag && !CK.tg.app) sdkTag.addEventListener('load', () => { if (status.kind === 'unknown') ensure().catch((err) => console.error(err)); }, { once: true });

  CK.wallet = {
    ready,
    get status() { return shownStatus(status); },
    get hadAtLaunch() { return hadAtLaunch; },
    refresh: () => refresh().then(shownStatus),
    ensure: () => ensure().then(shownStatus),
    wallets,
    create,
    protect,
    useBiometrics,
    askPassword(fn) { passwordAsker = fn; },
    markAsked,
    onBackup(fn) {
      backupSubs.add(fn);
      return () => backupSubs.delete(fn);
    },
    import: importWords,
    restore,
    unlock,
    saveBackup,
    moveOld,
    checkOld: () => (status.moveFrom ? checkOld(status.moveFrom) : Promise.resolve(null)),
    hasSecret: () => sdkReady.then(() => activeBlob()).then(() => true, () => false),
    canSign: () => refresh().then(shownStatus).then((now) => now.kind === 'signer' && now.secure && !now.lost && !now.denied && !now.bioUnknown).catch(() => false),
    depositAddress,
    unlockAndSign,
    signP2PDeposit,
    signP2PText,
    signSwap,
    signPayout,
    evmAddress,
    evmDepositAddress,
    evmRecordRepair: (evm) => evmRecordWrite((T.wallet && T.wallet.address) || null, evm).catch(() => null),
    keyAccess,
    orderAddresses,
    orderLive,
    orderPath,
    netAddress,
    netAlt,
    netAltFill,
    onSolAlt,
    othersReady: () => Promise.resolve(othersJob).then(() => undefined),
    signRelayDeposit,
    payRelayWithUsdt,
    signRoute,
    orderWallets,
    scanOrderWallets,
    orderScan: () => orderScanJob,
    signOrder,
    signOrderCancel,
    placeOrder,
    cancelOrder,
    signOrderEdit,
    editOrder,
    orderPricesKnown,
    listOrders,
    broadcast,
    pending,
    resend,
    gasless,
    directory,
    invoice,
    cheque,
    isRejection: (err) => !!err && err.code === 'biometric_cancelled',
    protectRefused: (err) => !!err && err.protect === true,
    neverSent: (err) => !!err && SEND_FINAL.has(err.code),
    openBiometricSettings() {
      try { CK.tg.app.BiometricManager.openSettings(); } catch (_) { }
    }
  };
  Object.defineProperty(CK, 'wallet', { value: Object.freeze(CK.wallet), writable: false, configurable: false, enumerable: true });
})();
