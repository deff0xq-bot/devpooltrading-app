(function () {
  'use strict';
  const CK = window.CK;
  const keyCap = CK && CK.wallet && typeof CK.wallet.keyAccess === 'function' ? CK.wallet.keyAccess('solOrders') : null;
  const withKey = (fn, options) => (keyCap ? keyCap(fn, options) : Promise.reject(fail('no_wallet')));
  const T = CK.ton;
  const S = CK.sol || null;
  const P = S && S.parts ? S.parts : null;

  const FEE_SOL = '';
  const FEE_BPS = 100;
  const SYSTEM = '11111111111111111111111111111111';
  const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
  const TOKEN_PROGRAMS = new Set([TOKEN_PROGRAM, TOKEN_2022]);
  const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
  const RECENT_HASHES = 'SysvarRecentB1ockHashes11111111111111111111';
  const RENT_SYSVAR = 'SysvarRent111111111111111111111111111111111';
  const JUPITER = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
  const JUP_EVENTS = 'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf';
  const ROUTE_V2 = 'bb64facc31c4af14';
  const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
  const WSOL = 'So11111111111111111111111111111111111111112';
  const OUTS = Object.freeze({ usdc: USDC, usdt: USDT, sol: WSOL });
  const MIDS = Object.freeze([USDC, USDT, WSOL]);
  const SWAPS = Object.freeze({ 7: 0, 19: 0, 46: 0, 72: 0, 73: 0, 77: 0, 92: 0, 93: 0, 99: 0, 100: 0, 105: 0, 108: 0 });
  const STEPS_MAX = 3;
  const ROUTE_ACCOUNTS_MAX = 48;
  const DONT_FRONT = 'jitodontfront111111111111111111111111111111';
  const JITO_TIPS = Object.freeze(['96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5', 'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe', 'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49', 'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', 'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL', '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT']);
  const DONT_FRONT_ON = 'nonce';
  const MIN_AFTER_FEE = true;

  const FLOORS_PER_MILLE = Object.freeze([980n, 965n, 950n]);
  const NONCES = 6;
  const NONCE_SEED = 'dpo';
  const RETURN_NONCES = Object.freeze([0, 5]);
  const SALE_NONCES = Object.freeze([1, 2, 3, 4]);
  const NONCE_SPACE = 80n;
  const NONCE_RENT = 1447680n;
  const SIG_FEE = 5000n;
  const RENT_MIN = 890880n;
  const ATA_RENT = 2039280n;
  const ATA_RENT_2022 = 2157600n;
  const ataRent = (program) => (program === TOKEN_2022 ? ATA_RENT_2022 : ATA_RENT);
  const SOL_ORDER_FEE_CAP = 2000000n;
  const COPY_FLOOR = 10000n;
  const TIP_MIN = 1000n;
  const TIP_MAX = 1000000n;
  const TOP_PER_MILLE = 5n;
  const CU_MAX = 1400000;
  const CU_SALE_MIN = 200000;
  const CU_RETURN = 100000;
  const CU_RETIRE = 10000;
  const CU_SETUP = 60000;
  const CU_SWEEP = 150000;
  const CU_MOVE = 2000;
  const PAGE = 32768;
  const DATA_MAX = 8 * 1024 * 1024;
  const DATA_SALE = 4 * 1024 * 1024;
  const DATA_RETURN = 4 * 1024 * 1024;
  const DATA_RETIRE = 256 * 1024;
  const TX_MAX = 4096;
  const LEGACY_MAX = 1232;
  const KEYS_MAX = 64;
  const IXS_MAX = 64;
  const V1 = 0x81;
  const CONFIG_MASK = 0b1111;
  const PLAN_LIFE_MS = 110000;
  const CHANGE_MARGIN_MS = 30000;
  const SIGN_MARGIN_MS = 15000;
  const ENDED_AFTER_MS = 15 * 60 * 1000;
  const EMPTY_LOCAL = 'ck-sol-oe:';
  const EMPTY_FOR_MS = 7 * 24 * 3600 * 1000;
  const NONCE_TRIES = 8;
  const NONCE_PAUSE_MS = 1500;
  const SEND_TRIES = 3;
  const SEND_PAUSE_MS = 1500;
  const SOL_PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';
  const RPC_MS = 10000;
  const LANDING_WAIT_MS = 75000;
  const LANDING_POLL_MS = 1500;
  const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const DIGITS = /^\d{1,30}$/;
  const U64_MAX = (1n << 64n) - 1n;

  function fail(code, extra) {
    const err = new Error(code);
    err.code = code;
    return extra ? Object.assign(err, extra) : err;
  }
  const utf8 = (text) => new TextEncoder().encode(text);
  const toBase64 = (bytes) => {
    let text = '';
    for (let i = 0; i < bytes.length; i += 4096) text += String.fromCharCode(...bytes.subarray(i, i + 4096));
    return btoa(text);
  };
  const fromBase64 = (text) => {
    try {
      return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
    } catch (_) {
      return null;
    }
  };
  const isBytes = (x) => ArrayBuffer.isView(x) && !(x instanceof DataView) && x.BYTES_PER_ELEMENT === 1;
  const bytesEqual = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const u16 = (value) => Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
  const readU16 = (data, at) => data[at] | (data[at + 1] << 8);
  const unitsOf = (value) => (typeof value === 'bigint' ? value : typeof value === 'string' && DIGITS.test(value) ? BigInt(value) : null);
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const parts = () => {
    if (!P) throw fail('bundle_failed');
    return P;
  };
  const keyOk = (lib, text) => !!parts().keyBytes(lib, text);

  function encodeV1(m) {
    const P_ = parts();
    const values = m.values.map((v) => (v.kind === 'u64' ? P_.u64(v.value) : P_.u32(Number(v.value))));
    const headers = m.instructions.map((ix) => P_.concat(Uint8Array.of(ix.program, ix.accounts.length), u16(ix.data.length)));
    const payloads = m.instructions.map((ix) => P_.concat(Uint8Array.from(ix.accounts), ix.data));
    return P_.concat(Uint8Array.of(V1), Uint8Array.from(m.header), P_.u32(m.mask), m.lifetime, Uint8Array.of(m.instructions.length, m.addresses.length), ...m.addresses, ...values, ...headers, ...payloads);
  }
  function compileV1(lib, payer, instructions, lifetime, config) {
    const P_ = parts();
    const metas = new Map();
    const add = (key, signer, writable) => {
      const m = metas.get(key) || { signer: false, writable: false };
      m.signer = m.signer || signer;
      m.writable = m.writable || writable;
      metas.set(key, m);
    };
    add(payer, true, true);
    instructions.forEach((ix) => {
      ix.keys.forEach((k) => add(k.pubkey, k.isSigner, k.isWritable));
      add(ix.programId, false, false);
    });
    const rank = ([key, m]) => (key === payer ? 0 : m.signer ? (m.writable ? 1 : 2) : (m.writable ? 3 : 4));
    const keys = Array.from(metas.entries()).map((entry, i) => ({ entry, i })).sort((a, b) => rank(a.entry) - rank(b.entry) || a.i - b.i).map((x) => x.entry);
    if (keys.length > KEYS_MAX || instructions.length > IXS_MAX) return null;
    if (instructions.some((ix) => ix.keys.length > 255 || ix.data.length > 0xffff)) return null;
    const c = config || {};
    if (typeof c.fee !== 'bigint' || c.fee < 0n || c.fee > U64_MAX || !Number.isSafeInteger(c.cu) || c.cu < 0 || c.cu > 0xffffffff || !Number.isSafeInteger(c.data) || c.data < 0 || c.data > 0xffffffff) return null;
    const life = P_.keyBytes(lib, lifetime);
    if (!life) return null;
    const signers = keys.filter(([, m]) => m.signer);
    const index = new Map(keys.map(([key], i) => [key, i]));
    const message = encodeV1({
      header: [signers.length, signers.filter(([, m]) => !m.writable).length, keys.filter(([, m]) => !m.signer && !m.writable).length],
      mask: CONFIG_MASK,
      values: [{ kind: 'u64', value: c.fee }, { kind: 'u32', value: c.cu }, { kind: 'u32', value: c.data }],
      lifetime: life,
      addresses: keys.map(([key]) => lib.base58.decode(key)),
      instructions: instructions.map((ix) => ({ program: index.get(ix.programId), accounts: ix.keys.map((k) => index.get(k.pubkey)), data: ix.data }))
    });
    if (message.length + 64 * signers.length > TX_MAX) return null;
    return { message, signers: signers.map(([key]) => key) };
  }
  function signV1(lib, compiled, keysBySigner) {
    const sigs = compiled.signers.map((address) => {
      const key = keysBySigner.find((one) => one.address === address);
      if (!key) throw fail('bad_intent', { reason: 'signer' });
      return lib.ed25519.sign(compiled.message, key.privateKey);
    });
    const raw = parts().concat(compiled.message, ...sigs);
    return { raw: toBase64(raw), hash: lib.base58.encode(sigs[0]) };
  }
  function readV1(lib, raw) {
    const P_ = parts();
    const bytes = typeof raw === 'string' ? fromBase64(raw) : isBytes(raw) ? raw : null;
    if (!bytes || bytes.length < 42 || bytes.length > TX_MAX || bytes[0] !== V1) return null;
    const [nSig, roSigned, roUnsigned] = [bytes[1], bytes[2], bytes[3]];
    const mask = P_.readU32(bytes, 4);
    const lifetime = lib.base58.encode(bytes.slice(8, 40));
    const nIx = bytes[40], n = bytes[41];
    if (nSig < 1 || roSigned >= nSig || n < nSig + roUnsigned || n > KEYS_MAX || nIx > IXS_MAX) return null;
    if ((mask & ~0x1f) !== 0 || ((mask & 1) !== ((mask >>> 1) & 1))) return null;
    let at = 42;
    if (bytes.length < at + n * 32) return null;
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(lib.base58.encode(bytes.slice(at + i * 32, at + i * 32 + 32)));
    at += n * 32;
    if (new Set(keys).size !== keys.length) return null;
    const config = { fee: null, cu: null, data: null, heap: null };
    const need = ((mask & 3) ? 8 : 0) + ((mask & 4) ? 4 : 0) + ((mask & 8) ? 4 : 0) + ((mask & 16) ? 4 : 0);
    if (bytes.length < at + need) return null;
    if (mask & 3) { config.fee = P_.readU64(bytes, at); at += 8; }
    if (mask & 4) { config.cu = P_.readU32(bytes, at); at += 4; }
    if (mask & 8) { config.data = P_.readU32(bytes, at); at += 4; }
    if (mask & 16) { config.heap = P_.readU32(bytes, at); at += 4; }
    if (bytes.length < at + nIx * 4) return null;
    const headers = [];
    for (let i = 0; i < nIx; i++) headers.push({ program: bytes[at + i * 4], count: bytes[at + i * 4 + 1], size: readU16(bytes, at + i * 4 + 2) });
    at += nIx * 4;
    const ixs = [];
    for (const h of headers) {
      if (h.program >= n || bytes.length < at + h.count + h.size) return null;
      const indexes = Array.from(bytes.slice(at, at + h.count));
      if (indexes.some((x) => x >= n)) return null;
      ixs.push({ program: keys[h.program], accounts: indexes.map((x) => keys[x]), data: bytes.slice(at + h.count, at + h.count + h.size) });
      at += h.count + h.size;
    }
    if (bytes.length !== at + nSig * 64) return null;
    const message = bytes.slice(0, at);
    const signatures = [];
    for (let i = 0; i < nSig; i++) signatures.push(bytes.slice(at + i * 64, at + i * 64 + 64));
    const metas = keys.map((key, i) => ({ key, signer: i < nSig, writable: i < nSig ? i < nSig - roSigned : i < n - roUnsigned }));
    return { message, signatures, nSig, metas, lifetime, mask, config, ixs };
  }

  const meta = (pubkey, isSigner, isWritable) => ({ pubkey, isSigner, isWritable });
  const sys = (n) => parts().u32(n);
  function nonceAddress(lib, base, k) {
    if (!Number.isInteger(k) || k < 0 || k >= NONCES) throw fail('bad_intent');
    return lib.base58.encode(lib.sha256(parts().concat(lib.base58.decode(base), utf8(NONCE_SEED + k), lib.base58.decode(SYSTEM))));
  }
  const nonceAddresses = (lib, base) => Array.from({ length: NONCES }, (_, k) => nonceAddress(lib, base, k));
  const advanceIx = (nonce, authority, extra) => ({ programId: SYSTEM, keys: [meta(nonce, false, true), meta(RECENT_HASHES, false, false), meta(authority, true, false), ...(extra || []).map((key) => meta(key, false, false))], data: sys(4) });
  const withdrawNonceIx = (nonce, to, authority, lamports) => ({ programId: SYSTEM, keys: [meta(nonce, false, true), meta(to, false, true), meta(RECENT_HASHES, false, false), meta(RENT_SYSVAR, false, false), meta(authority, true, false)], data: parts().concat(sys(5), parts().u64(lamports)) });
  const initNonceIx = (lib, nonce, authority) => ({ programId: SYSTEM, keys: [meta(nonce, false, true), meta(RECENT_HASHES, false, false), meta(RENT_SYSVAR, false, false)], data: parts().concat(sys(6), lib.base58.decode(authority)) });
  const createWithSeedIx = (lib, from, to, base, seed, lamports, space, owner) => ({
    programId: SYSTEM,
    keys: [meta(from, true, true), meta(to, false, true), meta(base, true, false)],
    data: parts().concat(sys(3), lib.base58.decode(base), parts().u64(BigInt(utf8(seed).length)), utf8(seed), parts().u64(lamports), parts().u64(space), lib.base58.decode(owner))
  });
  const transferIx = (from, to, lamports) => ({ programId: SYSTEM, keys: [meta(from, true, true), meta(to, false, true)], data: parts().concat(sys(2), parts().u64(lamports)) });
  const ataCreateIx = (lib, payer, owner, mint, program) => ({ programId: ATA_PROGRAM, keys: [meta(payer, true, true), meta(parts().ataOf(lib, owner, mint, program), false, true), meta(owner, false, false), meta(mint, false, false), meta(SYSTEM, false, false), meta(program, false, false)], data: Uint8Array.of(1) });
  const transferCheckedIx = (source, mint, dest, authority, amount, decimals, program) => ({ programId: program, keys: [meta(source, false, true), meta(mint, false, false), meta(dest, false, true), meta(authority, true, false)], data: parts().concat(Uint8Array.of(12), parts().u64(amount), Uint8Array.of(decimals)) });
  const closeIx = (account, dest, owner, program) => ({ programId: program, keys: [meta(account, false, true), meta(dest, false, true), meta(owner, true, false)], data: Uint8Array.of(9) });
  const harvestIx = (mint, accounts) => ({ programId: TOKEN_2022, keys: [meta(mint, false, true), ...accounts.map((a) => meta(a, false, true))], data: Uint8Array.of(26, 4) });

  const EXT = Object.freeze({ 1: 'transferFee', 3: 'closeAuthority', 4: 'confidential', 6: 'defaultState', 9: 'nonTransferable', 10: 'interestBearing', 12: 'permanentDelegate', 14: 'transferHook', 16: 'confidentialFee', 18: 'metadataPointer', 19: 'metadata', 20: 'groupPointer', 21: 'group', 22: 'memberPointer', 23: 'member', 24: 'confidentialMint', 25: 'scaledUi', 26: 'pausable' });
  const EXT_ALLOWED = new Set([3, 18, 19, 20, 21, 22, 23]);
  function mintRules(program, data, decimals) {
    const no = (detail) => ({ reason: 'mint', detail });
    if (!isBytes(data) || data.length < 82) return no('data');
    if (data[45] !== 1) return no('uninitialized');
    if (Number.isInteger(decimals) && data[44] !== decimals) return no('decimals');
    const freezable = parts().readU32(data, 46) === 1;
    if (program === TOKEN_PROGRAM) return data.length === 82 ? { reason: null, freezable, transferFee: false } : no('data');
    if (program !== TOKEN_2022) return no('program');
    if (data.length === 82) return { reason: null, freezable, transferFee: false };
    if (data.length < 166 || data[165] !== 1 || data.subarray(82, 165).some((b) => b !== 0)) return no('data');
    let at = 166, transferFee = false;
    while (at + 4 <= data.length) {
      const type = readU16(data, at), size = readU16(data, at + 2);
      if (type === 0 && size === 0) break;
      if (at + 4 + size > data.length) return no('data');
      const value = data.subarray(at + 4, at + 4 + size);
      if (type === 1) {
        if (size !== 108) return no('data');
        const fee = (from) => ({ max: parts().readU64(value, from + 8), bps: readU16(value, from + 16) });
        const older = fee(72), newer = fee(90);
        if (older.bps || older.max || newer.bps || newer.max) return no('transferFee');
        transferFee = true;
      } else if (type === 6) {
        if (size !== 1) return no('data');
        if (value[0] === 2) return no('defaultFrozen');
      } else if (!EXT_ALLOWED.has(type)) return no(EXT[type] || 'unknown');
      at += 4 + size;
    }
    return { reason: null, freezable, transferFee };
  }

  function routeOf(lib, ix, want) {
    const no = (detail) => ({ reason: 'route', detail });
    const P_ = parts();
    if (!ix || ix.programId !== JUPITER) return no('program');
    const accounts = ix.keys || ix.accounts;
    const data = ix.data;
    if (!Array.isArray(accounts) || !isBytes(data)) return no('shape');
    if (data.length < 34 || P_.bytesHex(data.subarray(0, 8)) !== ROUTE_V2) return no('instruction');
    if (accounts.length < 11 || accounts.length > ROUTE_ACCOUNTS_MAX) return no('accounts');
    const destination = want.sol ? JUPITER : P_.ataOf(lib, want.main, want.outMint, TOKEN_PROGRAM);
    const fixed = [[want.orderKey, true, false, 'authority'], [P_.ataOf(lib, want.orderKey, want.mint, want.program), false, true, 'source'], [P_.ataOf(lib, want.orderKey, want.outMint, TOKEN_PROGRAM), false, true, 'own_destination'],
      [want.mint, false, false, 'mint'], [want.outMint, false, false, 'out_mint'], [want.program, false, false, 'program'], [TOKEN_PROGRAM, false, false, 'out_program'],
      [destination, false, !want.sol, 'destination'], [JUP_EVENTS, false, false, 'events'], [JUPITER, false, false, 'self'], [want.feeAccount, false, true, 'fee_account']];
    for (let i = 0; i < fixed.length; i++) {
      const k = accounts[i];
      if (!k || k.pubkey !== fixed[i][0] || k.isSigner !== fixed[i][1] || k.isWritable !== fixed[i][2]) return no(fixed[i][3]);
    }
    const mainAccounts = new Set([want.main, P_.ataOf(lib, want.main, want.mint, want.program), P_.ataOf(lib, want.main, want.outMint, TOKEN_PROGRAM)]);
    const nonceSet = new Set(want.nonces || []);
    const mids = [];
    for (const k of accounts.slice(fixed.length)) {
      if (!k || typeof k.pubkey !== 'string' || !keyOk(lib, k.pubkey) || typeof k.isSigner !== 'boolean' || typeof k.isWritable !== 'boolean') return no('accounts');
      if (k.isSigner) return no('signer');
      if (k.pubkey === want.orderKey && k.isWritable) return no('payer');
      if (mainAccounts.has(k.pubkey)) return no('main');
      if (nonceSet.has(k.pubkey) || k.pubkey === want.feeAccount) return no('accounts');
      if (k.pubkey === DONT_FRONT || JITO_TIPS.includes(k.pubkey)) return no('accounts');
      MIDS.forEach((mid) => {
        if (mid !== want.outMint && !mids.includes(mid) && k.pubkey === P_.ataOf(lib, want.orderKey, mid, TOKEN_PROGRAM)) mids.push(mid);
      });
    }
    const inAmount = P_.readU64(data, 8);
    const quoted = P_.readU64(data, 16);
    const slippage = readU16(data, 24), fee = readU16(data, 26), positive = readU16(data, 28);
    if (inAmount !== want.units) return no('in_amount');
    if (fee !== FEE_BPS) return no('fee_bps');
    const count = P_.readU32(data, 30);
    if (count < 1 || count > STEPS_MAX) return no('steps');
    let at = 34;
    const steps = [];
    for (let i = 0; i < count; i++) {
      if (at >= data.length) return no('steps');
      const id = data[at];
      const size = Object.prototype.hasOwnProperty.call(SWAPS, id) ? SWAPS[id] : null;
      if (size === null) return no('swap');
      at += 1 + size;
      if (at + 4 > data.length) return no('steps');
      const bps = readU16(data, at);
      if (bps < 1 || bps > 10000) return no('steps');
      steps.push({ id, bps });
      at += 4;
    }
    if (at !== data.length) return no('steps');
    return { reason: null, in: inAmount, quoted, slippage, fee, positive, steps, mids };
  }
  function rewriteRoute(ix, minimum) {
    const data = Uint8Array.from(ix.data);
    data.set(parts().u64(minimum), 16);
    data.set(u16(0), 24);
    data.set(u16(0), 28);
    return { programId: ix.programId, keys: (ix.keys || ix.accounts).map((k) => meta(k.pubkey, k.isSigner, k.isWritable)), data };
  }

  const floorsOf = (stopOut) => FLOORS_PER_MILLE.map((perMille) => (unitsOf(stopOut) * perMille) / 1000n);
  const minimumFor = (floor) => (MIN_AFTER_FEE ? floor : (floor * 10000n + BigInt(10000 - FEE_BPS) - 1n) / BigInt(10000 - FEE_BPS));
  const pageUp = (bytes) => Math.ceil(bytes / PAGE) * PAGE;
  function saleLimits(route) {
    const cu = Number.isSafeInteger(route && route.cu) && route.cu > 0 ? Math.min(CU_MAX, Math.max(CU_SALE_MIN, Math.ceil(route.cu * 1.5))) : CU_SALE_MIN * 3;
    const data = Number.isSafeInteger(route && route.dataSize) && route.dataSize > 0 ? Math.min(DATA_MAX, pageUp(route.dataSize) + PAGE) : DATA_SALE;
    return { cu, data };
  }
  function copiesOf(sol, cu) {
    const s = sol || {};
    const priority = unitsOf(s.priority) || 0n;
    const cap = (x) => (x > SOL_ORDER_FEE_CAP ? SOL_ORDER_FEE_CAP : x);
    const p75 = (priority * BigInt(cu) + 999999n) / 1000000n;
    const c1 = cap(p75 > COPY_FLOOR ? p75 : COPY_FLOOR);
    const c2 = cap(c1 * 4n);
    const value = unitsOf(s.value);
    const share = value ? (value * TOP_PER_MILLE) / 1000n : SOL_ORDER_FEE_CAP;
    const c3 = cap(share > c2 ? share : c2);
    const tipAsked = unitsOf(s.tip) || TIP_MIN;
    const tip = tipAsked < TIP_MIN ? TIP_MIN : tipAsked > TIP_MAX ? TIP_MAX : tipAsked;
    return { c1, c2, c3, tip };
  }

  function saleInstructions(lib, o, k, minimum, tip) {
    const P_ = parts();
    const ixs = [advanceIx(o.nonces[k], o.orderKey, DONT_FRONT_ON === 'nonce' ? [DONT_FRONT] : [])];
    const own = ataCreateIx(lib, o.orderKey, o.orderKey, o.outMint, TOKEN_PROGRAM);
    if (DONT_FRONT_ON !== 'nonce') own.keys.push(meta(DONT_FRONT, false, false));
    ixs.push(own);
    (o.mids || []).forEach((mid) => ixs.push(ataCreateIx(lib, o.orderKey, o.orderKey, mid, TOKEN_PROGRAM)));
    if (!o.sol) ixs.push(ataCreateIx(lib, o.orderKey, o.main, o.outMint, TOKEN_PROGRAM));
    ixs.push(ataCreateIx(lib, o.orderKey, o.feeOwner, o.outMint, TOKEN_PROGRAM));
    ixs.push(rewriteRoute(o.route, minimum));
    if (o.sol) ixs.push(closeIx(P_.ataOf(lib, o.orderKey, WSOL, TOKEN_PROGRAM), o.main, o.orderKey, TOKEN_PROGRAM));
    if (tip) ixs.push(transferIx(o.orderKey, JITO_TIPS[k % JITO_TIPS.length], tip));
    return ixs;
  }
  function returnInstructions(lib, o, k) {
    const P_ = parts();
    return [
      advanceIx(o.nonces[k], o.orderKey),
      ataCreateIx(lib, o.orderKey, o.main, o.mint, o.program),
      transferCheckedIx(P_.ataOf(lib, o.orderKey, o.mint, o.program), o.mint, P_.ataOf(lib, o.main, o.mint, o.program), o.orderKey, o.units, o.decimals, o.program),
      ...SALE_NONCES.map((j) => advanceIx(o.nonces[j], o.orderKey))
    ];
  }
  const retireInstructions = (o, k) => [advanceIx(o.nonces[k], o.orderKey)];

  function rowsOf(lib, o, values, copies, limits, only) {
    const rows = [];
    const floors = floorsOf(o.stopOut);
    const sale = (kind, k, floor, minimum, list) => list.forEach(([copy, fee, tip]) => rows.push({ kind, floor, nonce: k, copy, fee, tip: tip || 0n, minimum, instructions: saleInstructions(lib, o, k, minimum, tip), lifetime: values[k], config: { fee, cu: limits.cu, data: limits.data } }));
    const all = [[1, copies.c1], [2, copies.c2], [3, copies.c3], [4, copies.c3, copies.tip]];
    floors.forEach((floor, i) => sale('stop', i + 1, i + 1, minimumFor(floor), all));
    if (o.takeOut) sale('take', 4, null, minimumFor(o.takeOut), [[1, copies.c1], [3, copies.c3]]);
    if (only !== 'sale') {
      RETURN_NONCES.forEach((k) => rows.push({ kind: 'return', floor: null, nonce: k, copy: 3, fee: copies.c3, tip: 0n, minimum: null, instructions: returnInstructions(lib, o, k), lifetime: values[k], config: { fee: copies.c3, cu: CU_RETURN, data: DATA_RETURN } }));
    }
    if (only !== 'sale' || o.retire) {
      SALE_NONCES.forEach((k) => rows.push({ kind: 'retire', floor: null, nonce: k, copy: 1, fee: copies.c1, tip: 0n, minimum: null, instructions: retireInstructions(o, k), lifetime: values[k], config: { fee: copies.c1, cu: CU_RETIRE, data: DATA_RETIRE } }));
    }
    return rows;
  }

  const PROGRAMS_ALLOWED = new Set([SYSTEM, ATA_PROGRAM, TOKEN_PROGRAM, TOKEN_2022, JUPITER]);
  const sameIx = (read, want) => read.program === want.programId && read.accounts.length === want.keys.length && read.accounts.every((key, i) => key === want.keys[i].pubkey) && bytesEqual(read.data, want.data);
  const ixReason = (want, i) => {
    if (i === 0) return 'nonce';
    if (want.programId === ATA_PROGRAM) return 'create';
    if (want.programId === JUPITER) return 'route';
    if (TOKEN_PROGRAMS.has(want.programId)) return want.data[0] === 12 ? 'amount' : 'close';
    return parts().readU32(want.data, 0) === 2 ? 'tip' : 'advance';
  };
  function auditRow(lib, raw, o, row) {
    if (!FEE_SOL || o.feeOwner !== FEE_SOL) return 'fee_unset';
    const bytes = typeof raw === 'string' ? fromBase64(raw) : raw;
    if (!bytes || bytes[0] !== V1) return 'version';
    const tx = readV1(lib, bytes);
    if (!tx) return 'shape';
    if (tx.nSig !== 1 || tx.metas[0].key !== o.orderKey || !tx.metas[0].writable) return 'signer';
    let verified = false;
    try { verified = lib.ed25519.verify(tx.signatures[0], tx.message, lib.base58.decode(o.orderKey)); } catch (_) { verified = false; }
    if (!verified) return 'signature';
    if (tx.mask !== CONFIG_MASK || tx.config.heap !== null) return 'config';
    if (tx.config.fee > SOL_ORDER_FEE_CAP || tx.config.fee !== row.fee) return 'fee';
    if (tx.config.cu > CU_MAX || tx.config.data > DATA_MAX || tx.config.cu !== row.config.cu || tx.config.data !== row.config.data) return 'config';
    if (!tx.ixs.length) return 'count';
    if (tx.ixs.some((ix) => !PROGRAMS_ALLOWED.has(ix.program))) return 'program';
    const first = tx.ixs[0];
    if (first.program !== SYSTEM || first.data.length !== 4 || parts().readU32(first.data, 0) !== 4 || first.accounts.length < 3) return 'nonce';
    if (first.accounts[0] !== o.nonces[row.nonce] || first.accounts[1] !== RECENT_HASHES) return 'nonce';
    if (first.accounts[2] !== o.orderKey) return 'authority';
    const extras = first.accounts.slice(3);
    if (extras.some((key) => key !== DONT_FRONT) || (row.kind !== 'stop' && row.kind !== 'take' && extras.length)) return 'extra';
    if (tx.metas.some((m) => m.key === DONT_FRONT && m.writable)) return 'extra';
    if (tx.lifetime !== row.lifetime) return 'lifetime';
    const want = row.kind === 'return' ? returnInstructions(lib, o, row.nonce) : row.kind === 'retire' ? retireInstructions(o, row.nonce) : saleInstructions(lib, o, row.nonce, row.minimum, row.tip);
    if (tx.ixs.length !== want.length) return 'count';
    if (row.kind === 'stop' || row.kind === 'take') {
      const at = want.findIndex((ix) => ix.programId === JUPITER);
      const read = tx.ixs[at];
      if (!read || read.program !== JUPITER) return 'count';
      const flags = o.route.keys;
      const route = routeOf(lib, { programId: read.program, keys: read.accounts.map((key, i) => ({ pubkey: key, isSigner: flags[i] ? flags[i].isSigner : false, isWritable: flags[i] ? flags[i].isWritable : false })), data: read.data }, o);
      if (route.reason) return route.detail;
      if (route.quoted !== row.minimum) return 'minimum';
      if (route.slippage !== 0 || route.positive !== 0) return 'minimum';
      const tipIx = row.tip ? tx.ixs[tx.ixs.length - 1] : null;
      if (row.tip && (!tipIx || tipIx.program !== SYSTEM || tipIx.data.length !== 12 || tipIx.accounts.length !== 2 || tipIx.accounts[0] !== o.orderKey || !JITO_TIPS.includes(tipIx.accounts[1]))) return 'tip';
      if (row.tip && (parts().readU64(tipIx.data, 4) < TIP_MIN || parts().readU64(tipIx.data, 4) > TIP_MAX)) return 'tip';
    }
    for (let i = 0; i < want.length; i++) if (!sameIx(tx.ixs[i], want[i])) return ixReason(want[i], i);
    const named = new Set([o.orderKey]);
    want.forEach((ix) => { named.add(ix.programId); ix.keys.forEach((k) => named.add(k.pubkey)); });
    if (tx.metas.some((m) => !named.has(m.key))) return 'extra';
    const mainMeta = tx.metas.find((m) => m.key === o.main);
    if (mainMeta && mainMeta.writable && !(o.sol && (row.kind === 'stop' || row.kind === 'take'))) return 'main';
    return null;
  }

  function auditPlan(lib, answer, want, nowMs) {
    const no = (reason, detail) => ({ reason, detail: detail || null });
    if (!FEE_SOL) return no('fee_unset');
    const P_ = parts();
    const a = answer || {};
    const plan = a.plan;
    if (!plan || typeof plan !== 'object' || typeof a.sig !== 'string' || !a.sig) return no('plan', 'shape');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > PLAN_LIFE_MS || plan.at > nowMs + 30000) return no('stale');
    if (plan.wallet !== want.own || plan.n !== want.n || plan.orderKey !== want.orderKey || plan.main !== want.main || plan.mint !== want.mint || plan.out !== want.out) return no('plan', 'identity');
    if (unitsOf(plan.units) !== want.units || unitsOf(plan.stopOut) !== want.stopOut || (want.takeOut ? unitsOf(plan.takeOut) !== want.takeOut : plan.takeOut !== null && plan.takeOut !== undefined)) return no('plan', 'figures');
    if ((want.change || null) !== (plan.change || null) || (want.refresh || null) !== (plan.refresh || null)) return no('plan', 'kind');
    if (!TOKEN_PROGRAMS.has(plan.program) || !Number.isInteger(plan.decimals) || plan.decimals < 0 || plan.decimals > 36) return no('mint', 'program');
    if (MIDS.includes(want.mint) || want.mint === OUTS[want.out]) return no('plan', 'mint');
    const rules = mintRules(plan.program, fromBase64(typeof plan.mintData === 'string' ? plan.mintData : ''), plan.decimals);
    if (rules.reason) return rules;
    const expected = unitsOf(a.expected);
    if (expected === null || expected <= want.stopOut || (want.takeOut && expected >= want.takeOut)) return no('plan', 'expected');
    const r = a.route;
    if (!r || typeof r !== 'object' || r.programId !== JUPITER || !Array.isArray(r.accounts) || typeof r.data !== 'string') return no('route', 'shape');
    const data = fromBase64(r.data);
    if (!data) return no('route', 'shape');
    const outMint = OUTS[want.out];
    const o = {
      own: want.own, n: want.n, orderKey: want.orderKey, main: want.main, mint: want.mint, program: plan.program, decimals: plan.decimals, units: want.units,
      out: want.out, outMint, sol: want.out === 'sol', stopOut: want.stopOut, takeOut: want.takeOut || null, feeOwner: FEE_SOL,
      feeAccount: P_.ataOf(lib, FEE_SOL, outMint, TOKEN_PROGRAM), nonces: nonceAddresses(lib, want.orderKey)
    };
    const route = routeOf(lib, { programId: r.programId, keys: r.accounts, data }, o);
    if (route.reason) return route;
    o.route = { programId: JUPITER, keys: r.accounts.map((k) => meta(k.pubkey, k.isSigner, k.isWritable)), data };
    o.mids = route.mids;
    o.limits = saleLimits(r);
    o.copies = copiesOf(a.sol, o.limits.cu);
    const sol = a.sol || {};
    return {
      reason: null, o, freezable: rules.freezable, transferFee: rules.transferFee,
      view: { expected, floors: floorsOf(want.stopOut), takeOut: want.takeOut || null, legs: route.steps.length, freezable: rules.freezable, ...fundingOf(o, { mainAta: sol.mainAta === true, feeAta: sol.feeAta === true }) }
    };
  }

  function fundingOf(o, have) {
    const h = have || {};
    const c = o.copies;
    let fund = RENT_MIN + ATA_RENT * BigInt(1 + (o.mids || []).length);
    if (!o.sol && !h.mainAta) fund += ATA_RENT;
    if (!h.feeAta) fund += ATA_RENT;
    if (!h.mainTokenAta) fund += ataRent(o.program);
    fund += 3n * (SIG_FEE + c.c3 + c.tip) + (o.takeOut ? SIG_FEE + c.c3 : 0n) + 2n * (SIG_FEE + c.c3) + 4n * (SIG_FEE + c.c1);
    const nonces = NONCE_RENT * BigInt(NONCES);
    const needs = fund + nonces + ataRent(o.program) + 2n * (2n * SIG_FEE + SOL_ORDER_FEE_CAP);
    return { fund, nonces, needs };
  }

  const fundInstructions = (o, amount, priority) => [...parts().budget(CU_MOVE, priority), transferIx(o.main, o.orderKey, amount)];
  function nonceSetupInstructions(lib, o, priority) {
    const P_ = parts();
    const body = (ks) => [...P_.budget(CU_SETUP, priority), ...ks.flatMap((k) => [createWithSeedIx(lib, o.orderKey, o.nonces[k], o.orderKey, NONCE_SEED + k, NONCE_RENT, NONCE_SPACE, SYSTEM), initNonceIx(lib, o.nonces[k], o.orderKey)])];
    const fits = (ks) => 1 + 64 + P_.compile(lib, o.orderKey, body(ks), SYSTEM).length <= LEGACY_MAX;
    const groups = [];
    let current = [];
    for (let k = 0; k < NONCES; k++) {
      if (fits([...current, k])) current.push(k);
      else {
        if (!current.length) throw fail('bad_intent', { reason: 'size' });
        groups.push(current);
        current = [k];
      }
    }
    if (current.length) groups.push(current);
    return groups.map(body);
  }
  const setupBInstructions = (lib, o) => [
    ataCreateIx(lib, o.main, o.orderKey, o.mint, o.program),
    transferCheckedIx(parts().ataOf(lib, o.main, o.mint, o.program), o.mint, parts().ataOf(lib, o.orderKey, o.mint, o.program), o.main, o.units, o.decimals, o.program)
  ];
  function signLegacy(lib, key, instructions, blockhash) {
    const P_ = parts();
    const message = P_.compile(lib, key.address, instructions, blockhash);
    if (1 + 64 + message.length > LEGACY_MAX) throw fail('bad_intent', { reason: 'size' });
    const sig = lib.ed25519.sign(message, key.privateKey);
    return { raw: toBase64(P_.concat(P_.shortvec(1), sig, message)), hash: lib.base58.encode(sig) };
  }

  function sweepPlan(lib, s) {
    const P_ = parts();
    const priority = unitsOf(s.priority) || 0n;
    const nonceIxs = (s.nonces || []).filter((one) => unitsOf(one.lamports) > 0n).map((one) => withdrawNonceIx(one.address, s.main, s.orderKey, unitsOf(one.lamports)));
    const tokenIxs = [];
    let creates = 0n;
    (s.tokens || []).forEach((t) => {
      const amount = unitsOf(t.units) || 0n;
      if (amount > 0n) {
        if (!t.mainHas) creates += ataRent(t.program);
        tokenIxs.push(ataCreateIx(lib, s.orderKey, s.main, t.mint, t.program));
        tokenIxs.push(transferCheckedIx(t.account, t.mint, P_.ataOf(lib, s.main, t.mint, t.program), s.orderKey, amount, t.decimals, t.program));
      }
      if (t.harvest && t.program === TOKEN_2022) tokenIxs.push(harvestIx(t.mint, [t.account]));
      tokenIxs.push(closeIx(t.account, s.main, s.orderKey, t.program));
    });
    const lamports = unitsOf(s.lamports) || 0n;
    const fee = P_.feeOf(CU_SWEEP, priority);
    if (!nonceIxs.length && !tokenIxs.length && lamports <= fee) return { topUp: 0n, txs: [] };
    const tx = (body, nonces) => ({ payer: s.orderKey, instructions: [...P_.budget(CU_SWEEP, priority), ...body], nonces });
    const fits = (body) => 1 + 64 + P_.compile(lib, s.orderKey, tx(body).instructions, SYSTEM).length <= LEGACY_MAX;
    const probe = transferIx(s.orderKey, s.main, 1n);
    const split = !fits([...nonceIxs, ...tokenIxs, probe]);
    if (split && (!nonceIxs.length || !tokenIxs.length || !fits(nonceIxs) || !fits([...tokenIxs, probe]))) throw fail('bad_intent', { reason: 'size' });
    const need = split ? (fee * 2n + creates > fee + RENT_MIN ? fee * 2n + creates : fee + RENT_MIN) : fee + creates;
    const topUp = lamports >= need ? 0n : (need > RENT_MIN ? need : RENT_MIN) - lamports;
    const rest = lamports + topUp - (split ? fee * 2n : fee) - creates;
    const closing = rest > 0n ? [transferIx(s.orderKey, s.main, rest)] : [];
    const txs = split ? [tx(nonceIxs, nonceIxs.length), tx([...tokenIxs, ...closing], 0)] : [tx([...nonceIxs, ...tokenIxs, ...closing], nonceIxs.length)];
    return { topUp, txs };
  }
  const topUpNeeds = (topUp, priority) => topUp + parts().feeOf(CU_MOVE, unitsOf(priority) || 0n) + RENT_MIN;
  function sweepSign(lib, mainKey, orderKey, plan, blockhash, priority) {
    const out = [];
    if (plan.topUp > 0n) {
      if (!mainKey) throw fail('no_gas');
      out.push({ kind: 'topup', nonces: 0, ...signLegacy(lib, mainKey, [...parts().budget(CU_MOVE, unitsOf(priority) || 0n), transferIx(mainKey.address, orderKey.address, plan.topUp)], blockhash) });
    }
    plan.txs.forEach((one) => {
      if (one.payer !== orderKey.address) throw fail('bad_intent', { reason: 'signer' });
      out.push({ kind: 'sweep', nonces: one.nonces, ...signLegacy(lib, orderKey, one.instructions, blockhash) });
    });
    return out;
  }
  async function sweepSend(signed, io) {
    const hashes = [];
    for (const one of signed) {
      await io.send(one.raw);
      const landed = await io.landing(one.hash);
      if (landed !== 'landed') throw fail('send_unsure', { hash: one.hash, failed: landed === 'failed' });
      hashes.push(one.hash);
    }
    return hashes;
  }

  async function api(path, body) {
    try {
      return await T.api(path, body ? { body } : undefined);
    } catch (err) {
      const code = err && err.detail && typeof err.detail.error === 'string' ? err.detail.error : null;
      if (code) throw fail(code, { detail: err.detail, reason: err.detail.reason || undefined });
      throw fail('server_unknown');
    }
  }
  async function send(raw, move) {
    let last = null;
    for (let i = 0; i < SEND_TRIES; i++) {
      if (i) await pause(SEND_PAUSE_MS * i);
      try {
        const answer = await T.api('xchain/sol/send', { body: move ? { raw, move: true } : { raw } });
        return answer && typeof answer.hash === 'string' ? answer.hash : null;
      } catch (err) {
        const refused = err && err.detail && err.detail.error;
        if (refused === 'send_rejected' || refused === 'bad_tx' || refused === 'pending') throw fail(refused);
        last = err;
      }
    }
    console.warn('solOrders: a send went unanswered', last && last.message);
    throw fail('send_unsure');
  }
  async function nonceRead(owner, nonces) {
    const st = await parts().state(owner, '&nonces=' + nonces.map(encodeURIComponent).join(','));
    const got = st.body && st.body.nonces && typeof st.body.nonces === 'object' ? st.body.nonces : null;
    if (!got) throw fail('state_unknown');
    return {
      st,
      list: nonces.map((address) => {
        const one = Object.prototype.hasOwnProperty.call(got, address) ? got[address] : null;
        if (!one) return { address, exists: false, lamports: 0n, authority: null, value: null };
        return { address, exists: true, lamports: unitsOf(one.lamports) || 0n, authority: typeof one.authority === 'string' ? one.authority : null, value: typeof one.nonce === 'string' && BASE58.test(one.nonce) ? one.nonce : null };
      })
    };
  }
  async function nonceValues(orderKey, nonces, moved) {
    const wanted = nonces.map((_, k) => k);
    for (let i = 0; i < NONCE_TRIES; i++) {
      if (i) await pause(NONCE_PAUSE_MS);
      let read;
      try { read = await nonceRead(orderKey, nonces); } catch (_) { continue; }
      if (wanted.some((k) => read.list[k].exists && read.list[k].authority && read.list[k].authority !== orderKey)) throw fail('bad_intent', { reason: 'authority' });
      if (!wanted.every((k) => read.list[k].exists && read.list[k].authority === orderKey && read.list[k].value)) continue;
      if (moved && moved.some((old, k) => old && read.list[k].value === old)) continue;
      return read.list.map((one) => one.value);
    }
    throw fail('state_unknown');
  }
  const ownNonce = (one, orderKey) => one.exists && one.authority === orderKey && !!one.value;

  async function rpc(method, params) {
    const control = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = control ? setTimeout(() => control.abort(), RPC_MS) : null;
    try {
      const res = await fetch(SOL_PUBLIC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), ...(control ? { signal: control.signal } : {}) });
      if (!res || res.ok === false || typeof res.json !== 'function') throw fail('state_unknown');
      const body = await res.json();
      if (body && body.error) throw fail('rpc_refused', { detail: String(body.error.message || '').slice(0, 200) });
      if (!body || !Object.prototype.hasOwnProperty.call(body, 'result')) throw fail('state_unknown');
      return body.result;
    } catch (err) {
      if (err && (err.code === 'rpc_refused' || err.code === 'state_unknown')) throw err;
      throw fail('state_unknown');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  const lamportsOf = (value) => (Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null);
  async function rpcAccounts(keys) {
    const out = [];
    for (let i = 0; i < keys.length; i += 100) {
      const answer = await rpc('getMultipleAccounts', [keys.slice(i, i + 100), { encoding: 'base64', commitment: 'confirmed' }]);
      const list = answer && Array.isArray(answer.value) ? answer.value : null;
      if (!list || list.length !== Math.min(100, keys.length - i)) throw fail('state_unknown');
      list.forEach((one) => {
        if (!one) return out.push(null);
        const lamports = lamportsOf(one.lamports);
        const data = Array.isArray(one.data) && typeof one.data[0] === 'string' ? fromBase64(one.data[0]) : null;
        if (lamports === null || typeof one.owner !== 'string' || !data) throw fail('state_unknown');
        out.push({ lamports, owner: one.owner, data });
      });
    }
    return out;
  }
  function readNonce(lib, address, account) {
    if (!account) return { address, exists: false, lamports: 0n, authority: null, value: null };
    const ok = account.owner === SYSTEM && account.data.length === Number(NONCE_SPACE) && parts().readU32(account.data, 4) === 1;
    return { address, exists: true, lamports: account.lamports, authority: ok ? lib.base58.encode(account.data.slice(8, 40)) : null, value: ok ? lib.base58.encode(account.data.slice(40, 72)) : null };
  }
  function hasTransferFee(data) {
    if (!isBytes(data) || data.length < 166 || data[165] !== 1) return false;
    for (let at = 166; at + 4 <= data.length;) {
      const type = readU16(data, at), size = readU16(data, at + 2);
      if (type === 1) return true;
      if ((type === 0 && size === 0) || at + 4 + size > data.length) return false;
      at += 4 + size;
    }
    return false;
  }
  async function rpcPriority(address) {
    try {
      const list = await rpc('getRecentPrioritizationFees', [[address]]);
      const fees = (Array.isArray(list) ? list : []).map((one) => lamportsOf(one && one.prioritizationFee)).filter((x) => x !== null).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      if (!fees.length) return 0n;
      const p75 = fees[Math.min(fees.length - 1, Math.floor(fees.length * 0.75))];
      return p75 > parts().PRIORITY_MAX ? parts().PRIORITY_MAX : p75;
    } catch (_) {
      return 0n;
    }
  }
  const direct = Object.freeze({
    direct: true,
    async holds(lib, orderKey, main, mint) {
      const nonces = nonceAddresses(lib, orderKey);
      const mints = [...new Set([...(mint && BASE58.test(mint) ? [mint] : []), ...MIDS])];
      const first = await rpcAccounts([orderKey, ...nonces, ...mints]);
      const list = nonces.map((address, k) => readNonce(lib, address, first[1 + k]));
      const known = mints.map((m, i) => {
        const a = first[1 + NONCES + i];
        return a && TOKEN_PROGRAMS.has(a.owner) && a.data.length >= 82 ? { mint: m, program: a.owner, decimals: a.data[44], transferFee: a.owner === TOKEN_2022 && hasTransferFee(a.data) } : null;
      }).filter(Boolean);
      const accounts = await rpcAccounts(known.flatMap((t) => [parts().ataOf(lib, orderKey, t.mint, t.program), parts().ataOf(lib, main, t.mint, t.program)]));
      const tokens = [];
      known.forEach((t, i) => {
        const mine = accounts[2 * i];
        if (!mine || mine.owner !== t.program || mine.data.length < 72) return;
        tokens.push({ mint: t.mint, program: t.program, decimals: t.decimals, units: parts().readU64(mine.data, 64), account: parts().ataOf(lib, orderKey, t.mint, t.program), mainHas: !!accounts[2 * i + 1], harvest: t.transferFee });
      });
      return { orderKey, nonces: list.filter((one) => ownNonce(one, orderKey)).map((one) => ({ address: one.address, lamports: one.lamports })), tokens, lamports: first[0] ? first[0].lamports : 0n, priority: await rpcPriority(orderKey) };
    },
    async state(owner) {
      const [one] = await rpcAccounts([owner]);
      const latest = await rpc('getLatestBlockhash', [{ commitment: 'confirmed' }]);
      const blockhash = latest && latest.value && typeof latest.value.blockhash === 'string' && BASE58.test(latest.value.blockhash) ? latest.value.blockhash : null;
      if (!blockhash) throw fail('state_unknown');
      return { lamports: one ? one.lamports : 0n, priority: await rpcPriority(owner), blockhash };
    },
    async send(raw) {
      try {
        await rpc('sendTransaction', [raw, { encoding: 'base64', preflightCommitment: 'confirmed', maxRetries: 5 }]);
      } catch (err) {
        if (err && err.code === 'rpc_refused') {
          if (/already been processed/i.test(err.detail || '')) return;
          throw fail('send_rejected');
        }
        throw fail('send_unsure');
      }
    },
    async landing(hash) {
      const until = Date.now() + LANDING_WAIT_MS;
      for (let i = 0; ; i++) {
        if (i) await pause(LANDING_POLL_MS);
        const answer = await rpc('getSignatureStatuses', [[hash], { searchTransactionHistory: false }]).catch(() => null);
        const one = answer && Array.isArray(answer.value) ? answer.value[0] : null;
        if (one && one.err) return 'failed';
        if (one && (one.confirmationStatus === 'confirmed' || one.confirmationStatus === 'finalized')) return 'landed';
        if (Date.now() > until) return 'wait';
      }
    }
  });
  const viaServer = Object.freeze({
    direct: false,
    holds: (lib, orderKey, main, mint) => keyHolds(lib, orderKey, main, mint),
    state: (owner) => parts().state(owner),
    send: (raw) => send(raw, true),
    landing: (hash) => parts().landing(hash)
  });
  const SERVER_DOWN = new Set(['state_unknown', 'server_unknown']);

  function closedCheck() {
    if (!FEE_SOL) throw fail('xorder_closed', { reason: 'fee_unset' });
    if (!keyCap) throw fail('no_wallet');
    if (!P || !S) throw fail('bundle_failed');
  }
  function intentOf(intent) {
    const i = intent || {};
    const units = unitsOf(i.units), stopOut = unitsOf(i.stopOut), takeOut = i.takeOut === null || i.takeOut === undefined ? null : unitsOf(i.takeOut);
    if (typeof i.mint !== 'string' || !BASE58.test(i.mint) || !Object.prototype.hasOwnProperty.call(OUTS, i.out)) throw fail('bad_intent');
    if (!units || units >= 1n << 64n || !stopOut || stopOut >= 1n << 64n || (takeOut !== null && (!takeOut || takeOut <= stopOut || takeOut >= 1n << 64n))) throw fail('bad_intent');
    return { mint: i.mint, units, out: i.out, stopOut, takeOut };
  }
  function ownTon() {
    const wallet = T.wallet;
    if (!wallet || !wallet.address) throw fail('no_wallet');
    if (wallet.readOnly) throw fail('read_only');
    return wallet.address;
  }
  function localOrders(own) {
    let rec = null;
    try { rec = JSON.parse(localStorage.getItem('ck-sol-o:' + own) || 'null'); } catch (_) { rec = null; }
    const out = { n: 0, h: {} };
    if (!rec || typeof rec !== 'object') return out;
    if (Number.isSafeInteger(rec.n) && rec.n >= 0) out.n = rec.n;
    if (rec.h && typeof rec.h === 'object') {
      Object.keys(rec.h).forEach((k) => {
        let one = null;
        try { one = JSON.parse(rec.h[k]); } catch (_) { one = null; }
        if (/^(0|[1-9]\d{0,9})$/.test(k) && one && typeof one.a === 'string' && BASE58.test(one.a)) {
          out.h[k] = { n: Number(k), address: one.a, at: Number.isSafeInteger(one.t) ? one.t : 0, mint: typeof one.m === 'string' ? one.m : '', out: typeof one.o === 'string' ? one.o : '', live: typeof one.l === 'string' ? one.l : null, void: one.x === 1 };
          out.n = Math.max(out.n, Number(k) + 1);
        }
      });
    }
    return out;
  }
  function emptyMarks(own) {
    try {
      const marks = JSON.parse(localStorage.getItem(EMPTY_LOCAL + own) || '{}');
      return marks && typeof marks === 'object' && !Array.isArray(marks) ? marks : {};
    } catch (_) {
      return {};
    }
  }
  const markedEmpty = (marks, address) => Object.prototype.hasOwnProperty.call(marks, address) && Number.isFinite(marks[address]) && Date.now() - marks[address] < EMPTY_FOR_MS;
  function markEmpty(own, address, on) {
    try {
      const marks = emptyMarks(own);
      const known = new Set(Object.values(localOrders(own).h).map((one) => one.address));
      Object.keys(marks).forEach((key) => { if (!known.has(key)) delete marks[key]; });
      if (on) marks[address] = Date.now();
      else delete marks[address];
      localStorage.setItem(EMPTY_LOCAL + own, JSON.stringify(marks));
    } catch (_) { }
  }
  const settled = (one) => Number.isFinite(one && one.at) && Date.now() / 1000 - one.at > ENDED_AFTER_MS / 1000;
  async function tidy(more, own) {
    if (!more || typeof more.orderDrop !== 'function') return;
    const marks = emptyMarks(own);
    for (const one of Object.values(localOrders(own).h)) {
      if (!markedEmpty(marks, one.address) || !settled(one)) continue;
      await forgetKey(more, own, one);
    }
  }
  async function forgetKey(more, own, one) {
    if (one.live) await CK.wallet.orderLive('sol', one.n, null, { wallet: own }).catch(() => null);
    const gone = typeof more.orderDrop === 'function' ? await more.orderDrop(one.n).catch(() => false) : false;
    if (gone) markEmpty(own, one.address, false);
    return gone;
  }
  async function nextSlot(own) {
    const rows = await CK.wallet.orderAddresses('sol', { wallet: own });
    const next = localOrders(own).n;
    const row = rows.find((one) => one.n === next) || null;
    return { n: next, address: row && typeof row.address === 'string' ? row.address : null };
  }
  const planBody = (want) => ({
    wallet: want.own, n: want.n, orderKey: want.orderKey, main: want.main, mint: want.mint, units: want.units.toString(), out: want.out,
    stopOut: want.stopOut.toString(), takeOut: want.takeOut ? want.takeOut.toString() : null, ...(want.change ? { change: want.change } : {}), ...(want.refresh ? { refresh: want.refresh } : {})
  });
  const refusedPlan = (audited) => {
    if (audited.reason === 'fee_unset') return fail('xorder_closed', { reason: 'fee_unset' });
    if (audited.reason === 'mint') return fail('sol_order_mint', { reason: audited.detail });
    if (audited.reason === 'route') return fail('sol_order_no_pool', { reason: audited.detail });
    if (audited.reason === 'stale') return fail('quote_stale');
    return fail('order_refused', { reason: audited.detail || audited.reason });
  };
  async function quote(intent) {
    closedCheck();
    const i = intentOf(intent);
    await T.config().catch(() => null);
    const own = ownTon();
    const main = await S.address();
    if (!main) throw fail('no_sol_address');
    const lib = await S.bundle();
    const slot = await nextSlot(own);
    if (!slot.address) throw fail('xorder_no_slot', { reason: 'ahead' });
    const want = { own, n: slot.n, orderKey: slot.address, main, ...i };
    const answer = await api('sol-orders/plan', planBody(want));
    const audited = auditPlan(lib, answer, want, Date.now());
    if (audited.reason) throw refusedPlan(audited);
    const st = await parts().state(main);
    const short = st.lamports < audited.view.needs + RENT_MIN ? audited.view.needs + RENT_MIN - st.lamports : 0n;
    return { view: { ...audited.view, short, n: slot.n, address: slot.address } };
  }

  function signRows(lib, o, rows, orderKey) {
    return rows.map((row) => {
      const compiled = compileV1(lib, o.orderKey, row.instructions, row.lifetime, row.config);
      if (!compiled || compiled.signers.length !== 1 || compiled.signers[0] !== o.orderKey) throw fail('bad_intent', { reason: 'size' });
      const signed = signV1(lib, compiled, [orderKey]);
      const wrong = auditRow(lib, signed.raw, o, row);
      if (wrong) throw fail('bad_intent', { reason: wrong });
      return { kind: row.kind, floor: row.floor, nonce: row.nonce, copy: row.copy, fee: row.fee.toString(), tip: row.tip.toString(), minimum: row.minimum === null ? null : row.minimum.toString(), raw: signed.raw, hash: signed.hash };
    });
  }
  const step = (onStep, name, extra) => { try { if (onStep) onStep(name, extra || {}); } catch (_) { } };

  async function placeInside(lib, key, more, own, main, slot, i, onStep) {
    let n = slot.n, ahead = slot.address, orderKey = null, pre = null;
    for (let tries = 0; ; tries++) {
      orderKey = await more.order(n);
      if (ahead && ahead !== orderKey.address) throw fail('bad_intent', { reason: 'ahead' });
      pre = await nonceRead(orderKey.address, nonceAddresses(lib, orderKey.address));
      if (!pre.list.some((one) => one.exists || one.lamports > 0n)) break;
      if (tries >= 2) throw fail('xorder_no_slot', { reason: 'prefunded' });
      const given = await more.orderRecord({ n, planAt: Date.now() });
      await given.forget();
      n += 1;
      ahead = null;
    }
    const want = { own, n, orderKey: orderKey.address, main, ...i };
    const planAt = Date.now();
    const answer = await api('sol-orders/plan', planBody(want));
    const audited = auditPlan(lib, answer, want, Date.now());
    if (audited.reason) throw refusedPlan(audited);
    const o = audited.o;
    const mainState = await parts().state(main, '&mint=' + encodeURIComponent(o.mint) + '&to=' + encodeURIComponent(main));
    const have = { mainAta: answer.sol && answer.sol.mainAta === true, feeAta: answer.sol && answer.sol.feeAta === true, mainTokenAta: true };
    const funding = fundingOf(o, have);
    const held = unitsOf(mainState.body.held);
    if (held === null || held < o.units) throw fail('insufficient_balance');
    if (mainState.lamports < funding.needs + RENT_MIN) throw fail('sol_order_no_sol', { needs: funding.needs + RENT_MIN, have: mainState.lamports });
    const ticket = await more.orderRecord({ n, planAt, mint: o.mint, units: o.units, out: o.out });
    let stA, setupA, nonceTxs;
    try {
      stA = await parts().state(main);
      const groups = nonceSetupInstructions(lib, o, stA.priority);
      const toOrder = funding.fund + funding.nonces + BigInt(groups.length) * parts().feeOf(CU_SETUP, stA.priority);
      setupA = signLegacy(lib, key, fundInstructions(o, toOrder, stA.priority), stA.blockhash);
      nonceTxs = groups.map((ixs) => signLegacy(lib, orderKey, ixs, stA.blockhash));
    } catch (err) {
      await ticket.forget();
      throw err;
    }
    await ticket.keep();
    step(onStep, 'setup', { hash: setupA.hash });
    for (const one of [setupA, ...nonceTxs]) {
      await send(one.raw, true);
      const landed = await parts().landing(one.hash);
      if (landed !== 'landed') throw fail(landed === 'failed' ? 'setup_failed' : 'send_unsure', { hash: one.hash, setup: setupA.hash });
    }
    const values = await nonceValues(o.orderKey, o.nonces);
    const rows = signRows(lib, o, rowsOf(lib, o, values, o.copies, o.limits), orderKey);
    step(onStep, 'signed', { rows: rows.length });
    if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale', { setup: setupA.hash });
    const created = await api('sol-orders/create', { plan: answer.plan, sig: answer.sig, setup: setupA.hash, nonceSetup: nonceTxs.map((one) => one.hash), rows });
    if (!created || typeof created.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(created.id)) throw fail('server_unknown');
    step(onStep, 'created', { id: created.id });
    const stB = await parts().state(main);
    const b = parts().compile(lib, main, [...parts().budget(CU_SETUP, stB.priority), ...setupBInstructions(lib, o)], stB.blockhash);
    const sigB = lib.ed25519.sign(b, key.privateKey);
    const rawB = toBase64(parts().concat(parts().shortvec(1), sigB, b));
    const hashB = lib.base58.encode(sigB);
    try {
      await send(rawB, true);
    } catch (err) {
      throw Object.assign(err, { orderId: created.id, n, address: o.orderKey, raw: rawB, hash: hashB });
    }
    step(onStep, 'funded', { hash: hashB });
    return { orderId: created.id, n, address: o.orderKey, setup: setupA.hash, hash: hashB };
  }
  async function place(intent, options, onStep) {
    closedCheck();
    const i = intentOf(intent);
    const opts = options || {};
    await T.config().catch(() => null);
    const own = ownTon();
    if (opts.wallet && opts.wallet !== own) throw fail('wallet_changed');
    const main = await S.address();
    if (!main) throw fail('no_sol_address');
    const lib = await S.bundle();
    const slot = await nextSlot(own);
    const result = await withKey(async (key, keyOwn, more) => {
      if (keyOwn !== undefined && keyOwn !== own) throw fail('wallet_changed');
      if (key.address !== main) throw fail('address_mismatch');
      if (!more || typeof more.order !== 'function' || typeof more.orderRecord !== 'function') throw fail('bad_intent', { reason: 'key' });
      await tidy(more, own);
      return placeInside(lib, key, more, own, main, slot, i, onStep);
    }, { password: opts.password, wallet: own });
    await CK.wallet.orderLive('sol', result.n, result.orderId, { wallet: own }).catch(() => null);
    return result;
  }

  function orderOf(order) {
    const x = order || {};
    if (typeof x.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(x.id) || !Number.isInteger(x.n) || x.n < 0) throw fail('bad_intent');
    return x;
  }
  async function recordOf(more, x, address) {
    const found = typeof more.orderSlots === 'function' ? await more.orderSlots() : null;
    const slot = found && Array.isArray(found.slots) ? found.slots.find((one) => one.n === x.n) || null : null;
    const no = () => fail('bad_intent', { reason: 'order' });
    if (slot && slot.address !== address) throw fail('address_mismatch');
    if (slot && (slot.void || (slot.live && slot.live !== x.id))) throw no();
    const given = (value) => value !== undefined && value !== null && value !== '';
    if (given(x.units) && unitsOf(x.units) === null) throw no();
    const pick = (theirs, mine) => {
      if (given(theirs) && given(mine) && theirs !== mine) throw no();
      return given(theirs) ? theirs : given(mine) ? mine : null;
    };
    const mint = pick(slot ? slot.mint : null, x.mint);
    const units = pick(slot ? unitsOf(slot.units) : null, given(x.units) ? unitsOf(x.units) : null);
    const out = pick(slot ? slot.out : null, x.out);
    if (mint !== null && (typeof mint !== 'string' || !BASE58.test(mint))) throw no();
    return { slot, mint, units, out };
  }

  async function resign(kind, order, intent, options) {
    closedCheck();
    const x = orderOf(order);
    const i = intentOf(intent);
    const opts = options || {};
    await T.config().catch(() => null);
    const own = ownTon();
    const main = await S.address();
    if (!main) throw fail('no_sol_address');
    const lib = await S.bundle();
    return withKey(async (key, keyOwn, more) => {
      if (keyOwn !== undefined && keyOwn !== own) throw fail('wallet_changed');
      if (key.address !== main) throw fail('address_mismatch');
      const orderKey = await more.order(x.n);
      const r = await recordOf(more, x, orderKey.address);
      if (r.mint !== i.mint || r.units !== i.units || r.out !== i.out) throw fail('bad_intent', { reason: 'order' });
      const want = { own, n: x.n, orderKey: orderKey.address, main, ...i, ...(kind === 'change' ? { change: x.id } : { refresh: x.id }) };
      let planAt = Date.now();
      let answer = await api('sol-orders/plan', planBody(want));
      let audited = auditPlan(lib, answer, want, Date.now());
      if (audited.reason) throw refusedPlan(audited);
      if (kind === 'refresh') {
        const o = audited.o;
        o.retire = true;
        const values = await nonceValues(o.orderKey, o.nonces);
        const rows = signRows(lib, o, rowsOf(lib, o, values, o.copies, o.limits, 'sale'), orderKey);
        if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale');
        const done = await api('sol-orders/refresh', { id: x.id, plan: answer.plan, sig: answer.sig, rows });
        return { orderId: done && typeof done.id === 'string' ? done.id : x.id };
      }
      const first = audited.o;
      const before = await nonceRead(first.orderKey, first.nonces);
      if (SALE_NONCES.some((k) => !ownNonce(before.list[k], first.orderKey))) throw fail('state_unknown');
      if (Date.now() - planAt > PLAN_LIFE_MS - CHANGE_MARGIN_MS) throw fail('quote_stale');
      const advance = signLegacy(lib, orderKey, [...parts().budget(CU_RETIRE * 2, before.st.priority), ...SALE_NONCES.map((k) => advanceIx(first.nonces[k], first.orderKey))], before.st.blockhash);
      await api('sol-orders/change', { id: x.id, step: 'advance', raw: advance.raw });
      try {
        await send(advance.raw, true);
        const landed = await parts().landing(advance.hash);
        if (landed !== 'landed') throw fail('send_unsure', { failed: landed === 'failed' });
        const values = await nonceValues(first.orderKey, first.nonces, before.list.map((one, k) => (SALE_NONCES.includes(k) ? one.value : null)));
        if (Date.now() - planAt > PLAN_LIFE_MS - SIGN_MARGIN_MS) {
          planAt = Date.now();
          answer = await api('sol-orders/plan', planBody(want));
          audited = auditPlan(lib, answer, want, Date.now());
          if (audited.reason) throw refusedPlan(audited);
        }
        const o = audited.o;
        o.retire = true;
        const rows = signRows(lib, o, rowsOf(lib, o, values, o.copies, o.limits, 'sale'), orderKey);
        if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale');
        const done = await api('sol-orders/change', { id: x.id, step: 'rows', plan: answer.plan, sig: answer.sig, rows, advance: advance.hash });
        return { orderId: done && typeof done.id === 'string' ? done.id : x.id, hash: advance.hash };
      } catch (err) {
        throw Object.assign(err && typeof err === 'object' ? err : fail('send_unsure'), { orderId: x.id, hash: advance.hash });
      }
    }, { password: opts.password, wallet: own });
  }
  const change = (order, intent, options) => resign('change', order, intent, options);
  const refresh = (order, options) => resign('refresh', order, { mint: order && order.mint, units: order && order.units, out: order && order.out, stopOut: order && order.stopOut, takeOut: order && order.takeOut }, options);

  async function keyHolds(lib, orderKey, main, mint) {
    const P_ = parts();
    const nonces = nonceAddresses(lib, orderKey);
    const read = await nonceRead(orderKey, nonces);
    const mints = [...new Set([...(mint && BASE58.test(mint) ? [mint] : []), ...MIDS])];
    const tokens = [];
    for (const m of mints) {
      const st = await P_.state(orderKey, '&mint=' + encodeURIComponent(m) + '&to=' + encodeURIComponent(main));
      const b = st.body;
      if (!TOKEN_PROGRAMS.has(b.program) || !Number.isInteger(b.decimals)) throw fail('state_unknown');
      const account = P_.ataOf(lib, orderKey, m, b.program);
      const row = (Array.isArray(b.heldAccounts) ? b.heldAccounts : []).find((one) => one && one.address === account);
      if (!row) continue;
      tokens.push({ mint: m, program: b.program, decimals: b.decimals, units: unitsOf(row.units) || 0n, account, mainHas: Array.isArray(b.toAccounts) && b.toAccounts.includes(P_.ataOf(lib, main, m, b.program)), harvest: b.program === TOKEN_2022 && b.transferFee === true });
    }
    return { orderKey, nonces: read.list.filter((one) => ownNonce(one, orderKey)).map((one) => ({ address: one.address, lamports: one.lamports })), tokens, lamports: read.st.lamports, priority: read.st.priority };
  }
  const dustOf = (priority) => 2n * parts().feeOf(CU_SWEEP, unitsOf(priority) || 0n);
  const holdsAnything = (h) => h.nonces.length > 0 || h.tokens.length > 0 || h.lamports > dustOf(h.priority);
  async function sweepHome(lib, key, orderKey, h, io, tell) {
    const mainState = await io.state(key.address);
    const plan = sweepPlan(lib, { ...h, orderKey: orderKey.address, main: key.address });
    if (!plan.txs.length) return [];
    if (plan.topUp > 0n && mainState.lamports < topUpNeeds(plan.topUp, h.priority)) throw fail('no_gas', { needs: topUpNeeds(plan.topUp, h.priority) });
    let hashes = [];
    let blockhash = mainState.blockhash;
    if (plan.topUp > 0n) {
      hashes = await sweepSend(sweepSign(lib, key, orderKey, { topUp: plan.topUp, txs: [] }, blockhash, h.priority), io);
      blockhash = (await io.state(orderKey.address)).blockhash;
    }
    const signed = sweepSign(lib, null, orderKey, { topUp: 0n, txs: plan.txs }, blockhash, h.priority);
    const kill = signed.find((one) => one.kind === 'sweep' && one.nonces > 0);
    if (tell && kill && !io.direct) {
      await api('sol-orders/cancel', { id: tell, orderKey: orderKey.address, raw: kill.raw }).catch((err) => {
        console.warn('solOrders: the cancel was not heard first', err && err.code);
      });
    }
    return hashes.concat(await sweepSend(signed, io));
  }
  async function settleKey(lib, more, own, main, slot, io) {
    if (!slot || !settled(slot)) return false;
    const again = await io.holds(lib, slot.address, main, slot.mint).catch(() => null);
    if (!again || holdsAnything(again)) return false;
    markEmpty(own, slot.address, true);
    return forgetKey(more, own, slot);
  }

  async function cancel(order, options) {
    if (!keyCap) throw fail('no_wallet');
    if (!P || !S) throw fail('bundle_failed');
    const x = orderOf(order);
    const opts = options || {};
    await T.config().catch(() => null);
    const own = ownTon();
    const main = await S.address();
    if (!main) throw fail('no_sol_address');
    const lib = await S.bundle();
    return withKey(async (key, keyOwn, more) => {
      if (keyOwn !== undefined && keyOwn !== own) throw fail('wallet_changed');
      if (key.address !== main) throw fail('address_mismatch');
      const orderKey = await more.order(x.n);
      const r = await recordOf(more, x, orderKey.address);
      if (!r.mint) throw fail('bad_intent', { reason: 'order' });
      const h = await keyHolds(lib, orderKey.address, main, r.mint);
      const hashes = holdsAnything(h) ? await sweepHome(lib, key, orderKey, h, viaServer, x.id) : [];
      if (r.slot && r.slot.live) await CK.wallet.orderLive('sol', x.n, null, { wallet: own }).catch(() => null);
      if (r.slot) await settleKey(lib, more, own, main, { ...r.slot, mint: r.mint }, viaServer);
      return { orderId: x.id, hashes };
    }, { password: opts.password, wallet: own });
  }

  async function returnAll(options, onStep) {
    if (!keyCap) throw fail('no_wallet');
    if (!P || !S) throw fail('bundle_failed');
    const opts = options || {};
    await T.config().catch(() => null);
    const own = ownTon();
    const main = await S.address();
    if (!main) throw fail('no_sol_address');
    const lib = await S.bundle();
    return withKey(async (key, keyOwn, more) => {
      if (keyOwn !== undefined && keyOwn !== own) throw fail('wallet_changed');
      if (key.address !== main) throw fail('address_mismatch');
      const found = await more.orderSlots();
      const returned = [], left = [];
      let io = viaServer;
      for (const slot of found.slots) {
        if (!slot.address) continue;
        try {
          const orderKey = await more.order(slot.n);
          if (orderKey.address !== slot.address) throw fail('address_mismatch');
          let h;
          try {
            h = await io.holds(lib, orderKey.address, main, slot.mint);
          } catch (err) {
            if (io.direct || !SERVER_DOWN.has(err && err.code)) throw err;
            io = direct;
            h = await io.holds(lib, orderKey.address, main, slot.mint);
          }
          if (holdsAnything(h)) {
            const hashes = await sweepHome(lib, key, orderKey, h, io, slot.live || null);
            if (slot.live && hashes.length) await CK.wallet.orderLive('sol', slot.n, null, { wallet: own }).catch(() => null);
            if (hashes.length) {
              returned.push({ n: slot.n, address: slot.address, hashes });
              step(onStep, 'returned', { n: slot.n });
            }
          }
          await settleKey(lib, more, own, main, slot, io);
        } catch (err) {
          left.push({ n: slot.n, address: slot.address, why: (err && err.code) || 'unknown' });
        }
      }
      return { returned, left, heard: found.heard };
    }, { password: opts.password, wallet: own });
  }

  async function endedFor(own) {
    if (!P || !S || !own) return [];
    const marks = emptyMarks(own);
    const recs = Object.values(localOrders(own).h).filter((one) => settled(one) && !markedEmpty(marks, one.address));
    if (!recs.length) return [];
    let listed;
    try {
      listed = await T.api('sol-orders/list');
    } catch (_) {
      return [];
    }
    if (!listed || !Array.isArray(listed.orders)) return [];
    const live = new Set();
    listed.orders.forEach((one) => {
      if (!one || one.final === true) return;
      [one.id, one.orderAddress, one.address].forEach((value) => { if (typeof value === 'string' && value) live.add(value); });
    });
    return recs.filter((one) => !live.has(one.address) && !(one.live && live.has(one.live))).map((one) => ({ path: 'order:' + one.n, n: one.n, address: one.address, mint: one.mint, live: one.live }));
  }
  async function endedLook(list) {
    const lib = await S.bundle();
    const main = await S.address();
    const own = T.wallet && T.wallet.address;
    const found = [], unknown = [];
    for (const one of list) {
      try {
        const h = await keyHolds(lib, one.address, main, one.mint);
        if (!holdsAnything(h)) {
          if (own) markEmpty(own, one.address, true);
          continue;
        }
        const sol = h.lamports + h.nonces.reduce((sum, nonce) => sum + nonce.lamports, 0n);
        found.push({ path: one.path, address: one.address, sol: sol.toString(), tokens: h.tokens.filter((t) => t.units > 0n).length });
      } catch (_) {
        unknown.push(one.path);
      }
    }
    return { found, unknown };
  }
  async function endedSweep(c) {
    const lib = c.lib;
    for (const one of c.list) {
      const path = one.path;
      try {
        const source = await c.keyFor(path);
        if (!source || source.address !== one.address) throw fail('address_mismatch');
        const h = await keyHolds(lib, one.address, c.to, one.mint);
        if (holdsAnything(h)) {
          const plan = sweepPlan(lib, { ...h, orderKey: one.address, main: c.to });
          if (plan.topUp > 0n) {
            c.out.left.push({ what: 'SOL', why: 'gas', path });
            continue;
          }
          if (plan.txs.length) {
            const st = await parts().state(one.address);
            await sweepSend(sweepSign(lib, null, source, plan, st.blockhash, h.priority), viaServer);
            c.tick('landed');
            c.out.moved.push('SOL');
          }
          const again = await keyHolds(lib, one.address, c.to, one.mint).catch(() => null);
          if (!again || holdsAnything(again)) continue;
        }
        markEmpty(c.own, one.address, true);
        if (one.live) await CK.wallet.orderLive('sol', one.n, null, { wallet: c.own }).catch(() => null);
        if (await c.drop(one.n).catch(() => false)) markEmpty(c.own, one.address, false);
      } catch (err) {
        c.out.left.push({ what: 'SOL', why: (err && err.code) === 'pending' ? 'wait' : 'unknown', path });
      }
    }
  }

  if (S && typeof S.ordersHook === 'function') S.ordersHook({ endedFor, endedLook, endedSweep });

  CK.solOrders = Object.freeze({
    open: () => !!FEE_SOL && !!keyCap && !!P,
    quote,
    place,
    cancel,
    change,
    refresh,
    returnAll,
    endedFor,
    endedLook,
    endedSweep,
    compileV1,
    encodeV1,
    signV1,
    readV1,
    nonceAddress,
    nonceAddresses,
    advanceIx,
    withdrawNonceIx,
    initNonceIx,
    createWithSeedIx,
    transferIx,
    mintRules,
    routeOf,
    rewriteRoute,
    floorsOf,
    minimumFor,
    copiesOf,
    saleLimits,
    saleInstructions,
    returnInstructions,
    retireInstructions,
    rowsOf,
    nonceSetupInstructions,
    setupBInstructions,
    fundingOf,
    auditPlan,
    auditRow,
    sweepPlan,
    readNonce,
    pins: () => Object.freeze({ feeOwner: FEE_SOL, feeBps: FEE_BPS, jupiter: JUPITER, jupEvents: JUP_EVENTS, routeV2: ROUTE_V2, outs: OUTS, swaps: SWAPS, tips: JITO_TIPS, dontFront: DONT_FRONT, dontFrontOn: DONT_FRONT_ON, seed: NONCE_SEED, nonces: NONCES, nonceRent: NONCE_RENT.toString(), feeCap: SOL_ORDER_FEE_CAP.toString(), floorsPerMille: FLOORS_PER_MILLE.map(String), minAfterFee: MIN_AFTER_FEE, planLifeMs: PLAN_LIFE_MS })
  });
  Object.defineProperty(CK, 'solOrders', { value: CK.solOrders, writable: false, configurable: false, enumerable: true });
})();
