(function () {
  'use strict';
  const CK = window.CK;
  const T = CK.ton;
  const keyCap = CK.wallet && typeof CK.wallet.keyAccess === 'function' ? CK.wallet.keyAccess('tron') : null;
  const withKey = (fn, options) => (keyCap ? keyCap(fn, options) : Promise.reject(fail('no_wallet')));

  const BUNDLE = 'kit/vendor/tron-wallet-2.4.0.min.js';
  const BUNDLE_SRI = 'sha384-HCphDLezhhv85Xpkzscj/qsppIcyaORHVmHlcjInwher4RsnLgXRB9Mv6PFzfTTz';
  const CHAIN = 'tron';
  const NATIVE = 'TRX';
  const DERIVATION = [0x8000002c, 0x800000c3, 0x80000000, 0, 0];
  const ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
  const OTHER_NETWORK = [/^0x[0-9a-fA-F]{40}$/, /^(EQ|UQ|kQ|0Q|Ef|Uf)[A-Za-z0-9_-]{46}$/, /^-?[01]:[0-9a-fA-F]{64}$/, /^(bc1|tb1)[0-9a-z]{20,80}$/i, /^[1-9A-HJ-NP-Za-km-z]{43,44}$/];
  const DIGITS = /^\d{1,40}$/;
  const BLOCK_ID = /^[0-9a-f]{64}$/;
  const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  const NEVER_TO = new Set([USDT, 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', 'TXtEs6t2oUWQsNos7m68gbHdE9Q5n6x2oN', 'TYVWGh8XkmU49Hi9PkGAZXiiJPB3J5zJZy']);
  const SEL_TRANSFER = 'a9059cbb';
  const CHAIN_ID = 728126428;
  const KNOWN_DECIMALS = { [NATIVE]: 6, [USDT]: 6 };
  const FEE_LIMIT_MIN = 10000000n;
  const FEE_LIMIT_MAX = 60000000n;
  const EXPIRY_MS = 120000;
  const CLOCK_SKEW_MS = 60000;
  const QUOTE_TTL_MS = 120000;
  const SEND_TRIES = 3;
  const SEND_PAUSE_MS = 1500;

  function fail(code, extra) {
    const err = new Error(code);
    err.code = code;
    return extra ? Object.assign(err, extra) : err;
  }
  const units = (text) => (typeof text === 'string' && DIGITS.test(text) ? BigInt(text) : null);
  const hexBytes = (hex) => Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16));
  const bytesHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const concat = (...parts) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    parts.forEach((p) => { out.set(p, at); at += p.length; });
    return out;
  };

  const LIB_NAME = 'TronWallet';
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

  let bundleJob = null;
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

  const checksum = (lib, payload) => lib.sha256(lib.sha256(payload)).slice(0, 4);
  const fromHex = (lib, hex21) => {
    const payload = hexBytes(hex21);
    return lib.base58.encode(concat(payload, checksum(lib, payload)));
  };
  const toBytes = (lib, text) => {
    if (typeof text !== 'string' || !ADDRESS.test(text)) return null;
    let raw;
    try { raw = lib.base58.decode(text); } catch (_) { return null; }
    if (raw.length !== 25 || raw[0] !== 0x41) return null;
    const sum = checksum(lib, raw.slice(0, 21));
    return sum.every((b, i) => b === raw[21 + i]) ? raw.slice(0, 21) : null;
  };
  const toHex = (lib, text) => {
    const bytes = toBytes(lib, text);
    return bytes ? bytesHex(bytes) : null;
  };

  async function keyOf(lib, words) {
    const seed = await lib.mnemonicToSeedWebcrypto(words.join(' '));
    let node = null, privateKey = null;
    try {
      node = lib.HDKey.fromMasterSeed(seed);
      for (const index of DERIVATION) {
        const child = node.deriveChild(index);
        node.wipePrivateData();
        node = child;
      }
      privateKey = Uint8Array.from(node.privateKey);
      const pub = lib.secp256k1.getPublicKey(privateKey, false);
      const hash = lib.keccak_256(pub.slice(1));
      return { privateKey, address: fromHex(lib, '41' + bytesHex(hash.slice(12))) };
    } catch (err) {
      if (privateKey) privateKey.fill(0);
      throw err;
    } finally {
      seed.fill(0);
      if (node) node.wipePrivateData();
    }
  }
  async function deriveAddress(lib, words) {
    const key = await keyOf(lib, words);
    key.privateKey.fill(0);
    return key.address;
  }

  const varint = (value) => {
    let v = BigInt(value);
    const out = [];
    do {
      let b = Number(v & 0x7fn);
      v >>= 7n;
      if (v) b |= 0x80;
      out.push(b);
    } while (v);
    return Uint8Array.from(out);
  };
  const fieldVarint = (num, value) => concat(varint(num << 3), varint(value));
  const fieldBytes = (num, bytes) => concat(varint((num << 3) | 2), varint(bytes.length), bytes);
  function encodeRaw(tx, block) {
    const text = (s) => new TextEncoder().encode(s);
    const contract = tx.kind === 'trx'
      ? concat(fieldVarint(1, 1), fieldBytes(2, concat(fieldBytes(1, text('type.googleapis.com/protocol.TransferContract')), fieldBytes(2, concat(fieldBytes(1, hexBytes(tx.owner)), fieldBytes(2, hexBytes(tx.to)), fieldVarint(3, tx.amount))))))
      : concat(fieldVarint(1, 31), fieldBytes(2, concat(fieldBytes(1, text('type.googleapis.com/protocol.TriggerSmartContract')), fieldBytes(2, concat(fieldBytes(1, hexBytes(tx.owner)), fieldBytes(2, hexBytes(tx.contract)), fieldBytes(4, hexBytes(tx.data)))))));
    const number = BigInt(block.number);
    const refBytes = Uint8Array.of(Number((number >> 8n) & 0xffn), Number(number & 0xffn));
    const refHash = hexBytes(block.id.slice(16, 32));
    const parts = [fieldBytes(1, refBytes), fieldBytes(4, refHash), fieldVarint(8, block.timestamp + EXPIRY_MS), fieldBytes(11, contract), fieldVarint(14, block.timestamp)];
    if (tx.kind === 'trc20') parts.push(fieldVarint(18, tx.feeLimit));
    return concat(...parts);
  }

  async function ownTon() {
    const wallet = T.wallet;
    if (!wallet || !wallet.address) throw fail('no_wallet');
    if (wallet.readOnly) throw fail('read_only');
    return wallet.address;
  }
  const address = () => CK.wallet.netAddress('tron');
  const ensureAddress = (options) => CK.wallet.netAddress('tron', { ...(options || {}), unlock: true });

  async function state(owner, extra) {
    await T.config();
    let body;
    try {
      body = await T.api('xchain/tron/state?owner=' + encodeURIComponent(owner) + (extra || ''));
    } catch (_) {
      throw fail('state_unknown');
    }
    const b = body && body.block;
    const sun = units(body && body.sun);
    if (!b || !Number.isSafeInteger(b.number) || !Number.isSafeInteger(b.timestamp) || typeof b.id !== 'string' || !BLOCK_ID.test(b.id) || sun === null) throw fail('state_unknown');
    return { block: { number: b.number, id: b.id, timestamp: b.timestamp }, sun, body };
  }
  const plainName = (text, max) => {
    if (typeof text !== 'string') return null;
    const clean = text.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, '').trim().slice(0, max);
    return clean || null;
  };
  async function balances(known) {
    const own = await address();
    if (!own) throw fail('no_tron_address');
    await T.config();
    const extra = (Array.isArray(known) ? known : []).filter((one) => typeof one === 'string' && ADDRESS.test(one)).slice(0, 40);
    let body;
    try {
      body = await T.api('xchain/tron/balances?owner=' + encodeURIComponent(own) + (extra.length ? '&known=' + encodeURIComponent(extra.join(',')) : ''));
    } catch (_) {
      throw fail('balance_unknown');
    }
    const native = units(body && body.sun);
    if (native === null || !Array.isArray(body.tokens)) throw fail('balance_unknown');
    const held = [];
    body.tokens.forEach((one) => {
      const amount = one ? units(one.units) : null;
      if (!one || !ADDRESS.test(one.address || '') || !amount || held.some((h) => h.address === one.address)) return;
      const decimals = Number.isInteger(one.decimals) && one.decimals >= 0 && one.decimals <= 36 ? one.decimals : null;
      held.push({ chain: CHAIN, address: one.address, units: amount, decimals, symbol: plainName(one.symbol, 16), name: plainName(one.name, 40), flagged: one.address === USDT ? false : one.flagged !== false });
    });
    return { address: own, native, held };
  }

  async function checkAddress(text, token) {
    const typed = typeof text === 'string' ? text.trim() : '';
    if (OTHER_NETWORK.some((re) => re.test(typed))) return { reason: 'network' };
    if (!ADDRESS.test(typed)) return { reason: 'format' };
    const lib = await bundle();
    if (!toBytes(lib, typed)) return { reason: 'checksum' };
    if (typed === 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb') return { reason: 'zero' };
    if (NEVER_TO.has(typed) || typed === token) return { reason: 'contract' };
    const own = await address();
    if (own && typed === own) return { reason: 'self' };
    return { address: typed };
  }

  function auditWithdraw(lib, plan, nowMs) {
    const no = (reason) => ({ reason });
    if (!plan || plan.kind !== 'withdraw' || plan.chain !== CHAIN) return no('plan');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    if (typeof plan.units !== 'bigint' || plan.units <= 0n || plan.units >= (plan.token === NATIVE ? 1n << 62n : 1n << 256n)) return no('amount');
    const owner = toHex(lib, plan.from);
    const to = toHex(lib, plan.to);
    if (!owner) return no('owner');
    if (!to || NEVER_TO.has(plan.to) || plan.to === plan.from || plan.to === plan.token) return no('to');
    if (plan.token === NATIVE) return { reason: null, tx: { kind: 'trx', owner, to, amount: plan.units }, native: true };
    const contract = toHex(lib, plan.token);
    if (!contract) return no('token');
    if (typeof plan.feeLimit !== 'bigint' || plan.feeLimit < FEE_LIMIT_MIN || plan.feeLimit > FEE_LIMIT_MAX) return no('gas');
    const data = SEL_TRANSFER + to.slice(2).padStart(64, '0') + plan.units.toString(16).padStart(64, '0');
    return { reason: null, tx: { kind: 'trc20', owner, contract, data, feeLimit: plan.feeLimit }, native: false };
  }

  function feeOf(body, native) {
    const n = (v) => (Number.isSafeInteger(v) && v >= 0 ? BigInt(v) : null);
    const bytes = native ? 270n : 350n;
    const freeBw = n(body.bandwidthFree), bwPrice = n(body.bandwidthPrice), energy = n(body.energyNeeded), freeEnergy = n(body.energyFree), energyPrice = n(body.energyPrice);
    if (freeBw === null || bwPrice === null || (!native && (!energy || freeEnergy === null || !energyPrice))) return null;
    let fee = freeBw >= bytes ? 0n : bytes * bwPrice;
    if (native && body.toExists === false) fee += 1100000n;
    let energySun = 0n, allEnergySun = 0n;
    if (!native) {
      energySun = (energy > freeEnergy ? energy - freeEnergy : 0n) * energyPrice;
      allEnergySun = energy * energyPrice;
    }
    return { feeSun: fee + energySun, energySun, allEnergySun };
  }

  async function quoteWithdraw(input) {
    const opts = input || {};
    if (typeof opts.units !== 'bigint' || opts.units <= 0n || (opts.token !== NATIVE && !ADDRESS.test(opts.token || ''))) throw fail('bad_intent');
    if (!(opts.decimals === undefined || (Number.isInteger(opts.decimals) && opts.decimals >= 0 && opts.decimals <= 36))) throw fail('bad_intent');
    const known = KNOWN_DECIMALS[opts.token];
    if (known === undefined && opts.decimals === undefined) throw fail('bad_intent');
    if (known !== undefined && opts.decimals !== undefined && opts.decimals !== known) throw fail('relay_refused', { reason: 'decimals' });
    await ownTon();
    const from = await address();
    if (!from) throw fail('no_tron_address');
    const checked = await checkAddress(opts.to, opts.token);
    if (checked.reason) throw fail('bad_address', { reason: checked.reason });
    const native = opts.token === NATIVE;
    const st = await state(from, '&to=' + encodeURIComponent(checked.address) + (native ? '' : '&token=' + encodeURIComponent(opts.token) + '&units=' + opts.units.toString()));
    const held = native ? st.sun : units(st.body.held);
    const fee = feeOf(st.body, native);
    if (held === null || !fee || typeof st.body.toExists !== 'boolean') throw fail('state_unknown');
    if (st.body.toContract === true) throw fail('bad_address', { reason: 'contract' });
    if (known === undefined && !CK.evm.decimalsAgree(opts.decimals, await CK.evm.relayDecimals(CHAIN_ID, opts.token), Number.isInteger(st.body.decimals) ? st.body.decimals : null)) throw fail('relay_refused', { reason: 'decimals' });
    if (fee.allEnergySun > FEE_LIMIT_MAX) throw fail('relay_refused', { reason: 'gas' });
    let feeLimit = fee.allEnergySun + fee.allEnergySun / 2n;
    if (feeLimit < FEE_LIMIT_MIN) feeLimit = FEE_LIMIT_MIN;
    if (feeLimit > FEE_LIMIT_MAX) feeLimit = FEE_LIMIT_MAX;
    const plan = { kind: 'withdraw', chain: CHAIN, token: opts.token, to: checked.address, from, units: opts.units, feeLimit: native ? null : feeLimit, at: Date.now() };
    const lib = await bundle();
    const audited = auditWithdraw(lib, plan, plan.at);
    if (audited.reason) throw fail('relay_refused', { reason: audited.reason });
    if (opts.units > held) throw fail('too_much', { have: held });
    const needs = fee.feeSun + (native ? opts.units : 0n);
    const short = st.sun < needs ? needs - st.sun : 0n;
    plan.view = { units: opts.units, to: checked.address, feeSun: fee.feeSun, gasWei: fee.feeSun, native: st.sun, held, short, maxNative: native ? st.sun - fee.feeSun : null, decimals: known !== undefined ? known : opts.decimals, needsTrx: !native && short > 0n, from };
    return plan;
  }

  const PENDING_KEY = 'ck-tron-pending:';
  const pendingMemory = {};
  function pendingRead(id) {
    let text = pendingMemory[id] || null;
    if (!text) {
      try { text = localStorage.getItem(PENDING_KEY + id); } catch (_) { }
    }
    try {
      const rec = text ? JSON.parse(text) : null;
      return rec && typeof rec.raw === 'string' && /^[0-9a-f]+$/.test(rec.raw) && typeof rec.hash === 'string' && Number.isSafeInteger(rec.until) && Number.isSafeInteger(rec.signedAt) ? rec : null;
    } catch (_) {
      return null;
    }
  }
  function pendingWrite(id, rec) {
    const text = JSON.stringify(rec);
    pendingMemory[id] = text;
    try { localStorage.setItem(PENDING_KEY + id, text); } catch (_) { }
  }
  function pendingClear(id) {
    delete pendingMemory[id];
    try { localStorage.removeItem(PENDING_KEY + id); } catch (_) { }
  }
  async function pendingGate(from, st) {
    const rec = pendingRead(from);
    const other = typeof st.body.pending === 'string' && st.body.pending ? st.body.pending : null;
    if (other && !(rec && rec.hash === other)) throw fail('pending', { hash: other });
    if (!rec) return;
    const landed = await T.api('xchain/tron/status?tx=' + encodeURIComponent(rec.hash)).catch(() => null);
    if (landed && landed.landed === true) {
      pendingClear(from);
      if (landed.failed === true) throw fail('withdraw_failed', { hash: rec.hash });
      return;
    }
    if (st.block.timestamp > rec.until && Date.now() > rec.signedAt + EXPIRY_MS + CLOCK_SKEW_MS) {
      pendingClear(from);
      return;
    }
    await sendRaw(rec.raw, from).catch(() => null);
    throw fail('pending', { hash: rec.hash });
  }
  async function sendRaw(raw, from) {
    let lastError = null;
    for (let i = 0; i < SEND_TRIES; i++) {
      if (i) await new Promise((resolve) => setTimeout(resolve, SEND_PAUSE_MS * i));
      try {
        await T.api('xchain/tron/send', { body: { raw } });
        return;
      } catch (err) {
        const refused = err && err.detail && err.detail.error;
        if (refused === 'send_rejected' && !i) {
          const rec = pendingRead(from);
          if (rec && rec.raw === raw) pendingClear(from);
          throw fail('send_rejected');
        }
        if (refused === 'pending' && !i) {
          const rec = pendingRead(from);
          if (rec && rec.raw === raw) pendingClear(from);
          throw fail('pending');
        }
        lastError = err;
      }
    }
    console.error(lastError);
    throw fail('send_unsure');
  }
  async function withdraw(plan, options) {
    const lib = await bundle();
    const audited = auditWithdraw(lib, plan, Date.now());
    if (audited.reason) throw fail('relay_refused', { reason: audited.reason });
    await ownTon();
    const st = await state(plan.from);
    if (Math.abs(st.block.timestamp - Date.now()) > CLOCK_SKEW_MS) throw fail('state_unknown');
    await pendingGate(plan.from, st);
    const feeSun = plan.view && typeof plan.view.feeSun === 'bigint' && plan.view.feeSun > 0n ? plan.view.feeSun : 0n;
    const needs = feeSun + (audited.native ? plan.units : 0n);
    if (st.sun < needs) throw fail('no_gas', { needs, have: st.sun });
    const signed = await withKey(async (key) => {
      if (key.address !== plan.from) throw fail('relay_refused', { reason: 'owner' });
      const raw = encodeRaw(audited.tx, st.block);
      const id = lib.sha256(raw);
      const sig = lib.secp256k1.sign(id, key.privateKey, { prehash: false, format: 'recovered' });
      const tronSig = concat(sig.slice(1, 65), Uint8Array.of(27 + sig[0]));
      const whole = concat(concat(Uint8Array.of(0x0a), varint(raw.length), raw), concat(Uint8Array.of(0x12, 65), tronSig));
      const tx = { raw: bytesHex(whole), hash: bytesHex(id) };
      pendingWrite(plan.from, { raw: tx.raw, hash: tx.hash, until: st.block.timestamp + EXPIRY_MS, signedAt: Date.now() });
      return tx;
    }, { ...(options || {}), owner: true });
    await sendRaw(signed.raw, plan.from);
    return { hash: signed.hash };
  }
  CK.tron = {
    chain: CHAIN,
    native: NATIVE,
    usdt: USDT,
    bundle,
    keyOf,
    deriveAddress,
    address,
    ensureAddress,
    balances,
    checkAddress,
    quoteWithdraw,
    withdraw,
    auditWithdraw,
    encodeRaw,
    fromHex,
    toHex
  };
  Object.defineProperty(CK, 'tron', { value: Object.freeze(CK.tron), writable: false, configurable: false, enumerable: true });
})();
