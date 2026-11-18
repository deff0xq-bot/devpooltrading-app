(function () {
  'use strict';
  const CK = window.CK;
  const T = CK.ton;
  const keyCap = CK.wallet && typeof CK.wallet.keyAccess === 'function' ? CK.wallet.keyAccess('sol') : null;
  const withKey = (fn, options) => (keyCap ? keyCap(fn, options) : Promise.reject(fail('no_wallet')));

  const BUNDLE = 'kit/vendor/sol-wallet-2.4.0.min.js';
  const BUNDLE_SRI = 'sha384-KlJZN72hRjtoN+39DKfSV4M3cMOrLDuDENYlQV3GRWWD6sqJDl6JmxzwXtnGg9ux';
  const CHAIN = 'solana';
  const CHAIN_ID = 792703809;
  const TON_CHAIN_ID = 224235520;
  const GRAM_CURRENCY = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
  const DEPOSITORY_RAW = T.rawAddress('EQCrdGsDTqA2t6xRR4N6V4J705F7w_VQbUdHnofsh-8lVIPs');
  const NATIVE = '11111111111111111111111111111111';
  const SYSTEM = NATIVE;
  const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
  const TOKEN_PROGRAMS = new Set([TOKEN_PROGRAM, TOKEN_2022]);
  const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
  const COMPUTE_BUDGET = 'ComputeBudget111111111111111111111111111111';
  const RELAY_PROGRAM = '99vQwtBwYtrqqD9YSXbdum3KBdxPAVxYTaQ3cfnJSrN2';
  const RELAY_VAULT = '7uTT8Xi5RWXzy7h9XL244GRgEycDYDhLjr3ZyNdXi8pZ';
  const RELAY_CONFIG = 'Dodg2HifwU8rmaVVyMyUZDGTRbqAJTyVYxXPwcbNpBKc';
  const DEPOSIT_NATIVE = '0d9e0ddf5fd51c06';
  const DEPOSIT_TOKEN = '0b9c60da27a3b413';
  const JUPITER = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
  const JUP_SHARED = 'c1209b3341d69c81';
  const JUP_EVENTS = 'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf';
  const FORWARDER_PROGRAM = 'DPArtTLbEqa6EuXHfL5UFLBZhFjiEXWRudhvXDrjwXUr';
  const FORWARDER = '6GpvpHXBJA7pW8gP9KEXBJ2spNyydmbY5Q4nbdoo5TeT';
  const FORWARD = '9d537021bf32ab25';
  const MEMO = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
  const MIDS = new Set(['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']);
  const RELAY_TABLE = 'Hm9fUgcn7qwDaiNTFiGh6pNtVATgnaRcmK6Bbx6EMZfP';
  const RELAY_TABLE_KEYS = Object.freeze(['99vQwtBwYtrqqD9YSXbdum3KBdxPAVxYTaQ3cfnJSrN2', 'Dodg2HifwU8rmaVVyMyUZDGTRbqAJTyVYxXPwcbNpBKc', '7uTT8Xi5RWXzy7h9XL244GRgEycDYDhLjr3ZyNdXi8pZ',
    '6GpvpHXBJA7pW8gP9KEXBJ2spNyydmbY5Q4nbdoo5TeT', 'DPArtTLbEqa6EuXHfL5UFLBZhFjiEXWRudhvXDrjwXUr', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    '4nvJ5zWdVspxJiNZzB127U6amPH98SFFkBx2JZrAduia', '58uq9pWmY52bqZrnJ6JQBv4wRQZWZrBWdBHjwhGmFJxF', 'F7p3dFrjRTbtRp8FRF6qHLomXbKRBzpvBLjtQcfcgmNe', 'Q4UmPB9hKMw3ERqksavS9oEpNo2eWG4ffkWg7wHa9j6',
    'A2sPEp16HY5pqxrSeyb78wevY1UQtuoBAGXmG3TNmaU9', 'H2DG3qk1cRqBUmRNjJ2fsGrGs47NQk5VRBLt1AevW8m2', '6xzryoSxj7bFHRuEJj9CwTCiWtuDTMm8v178tEZubRoD', '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr', 'DF1ow4tspfHX9JwWJsAb9epbkA8hmpSEAtxXy1V27QBH',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', '4QjpJDWpae3Gx8mL5ER3g1c3XVpSufh9LDYeHd344xSd', 'Q4UmPB9hKMw3ERqksavS9oEpNo2eWG4ffkWg7wHa9j6', 'DF1ow4tspfHX9JwWJsAb9epbkA8hmpSEAtxXy1V27QBH',
    'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', 'So11111111111111111111111111111111111111112', 'HEkY3qZJf74vxWQvK8HdQmye6MbEQBoGETsVuMJeBwr9', '4j5AnUUc6fWZPBAMiRyKjHrJUQCpr8XKaXsorGvFW8eo',
    '8KiZbuD4hKJvkwusw93QwmiaxYUUDUCstPHqWmmBzAvj', 'BpeKU6jjmdXeECar8XUJJAkPp2poyDG6ZsXFc84yEyku']);
  const TABLES_MAX = 8;
  const NEVER_TO = new Set([SYSTEM, TOKEN_PROGRAM, TOKEN_2022, ATA_PROGRAM, COMPUTE_BUDGET, RELAY_PROGRAM, RELAY_VAULT, RELAY_CONFIG,
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'So11111111111111111111111111111111111111112']);
  const DERIVATION = [44, 501, 0, 0];
  const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const OTHER_NETWORK = [/^0x[0-9a-fA-F]{40}$/, /^(EQ|UQ|kQ|0Q|Ef|Uf)[A-Za-z0-9_-]{46}$/, /^-?[01]:[0-9a-fA-F]{64}$/, /^T[1-9A-HJ-NP-Za-km-z]{33}$/, /^(bc1|tb1)[0-9a-z]{20,80}$|^(BC1|TB1)[0-9A-Z]{20,80}$/];
  const REQUEST_ID = /^0x[0-9a-f]{64}$/;
  const BODY_BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
  const DIGITS = /^\d{1,30}$/;
  const HEX = /^[0-9a-f]*$/;

  const RENT_MIN = 890880n;
  const ATA_RENT = 2039280n;
  const ATA_RENT_2022 = 2157600n;
  const ataRent = (program) => (program === TOKEN_2022 ? ATA_RENT_2022 : ATA_RENT);
  const SIG_FEE = 5000n;
  const CU_SOL = 1000;
  const CU_TOKEN = 60000;
  const CU_SALE = 120000;
  const CU_ROUTE = 800000;
  const CU_PER_IX = 200000;
  const CU_MAX = 1400000;
  const SOL_TX_MAX = 1232;
  const PRIORITY_MAX = 1000000n;
  const MAX_USD_GRACE = 1.01;
  const overMaxUsd = (intent, inUsd, outUsd) => Number.isFinite(intent.maxUsd) && intent.maxUsd > 0 && Math.max(inUsd, outUsd) > intent.maxUsd * MAX_USD_GRACE;
  const VALUE_FLOOR = 0.85;
  const MIN_OUT_FLOOR = 90n;
  const marketOf = (plan) => (plan && typeof plan.marketUsd === 'number' && Number.isFinite(plan.marketUsd) && plan.marketUsd > 0 ? plan.marketUsd : null);
  function tokenUsd(plan, amount, decimals, relayText) {
    const price = marketOf(plan);
    if (price !== null && typeof amount === 'bigint' && Number.isInteger(decimals) && decimals >= 0 && decimals <= 36) return Number(amount) / 10 ** decimals * price;
    const relay = usdOf(relayText);
    return relay > 0 ? relay : null;
  }
  const RELAY_FLOOR = 0.5;
  function relayLost(d) {
    const inUsd = usdOf(d.currencyIn && d.currencyIn.amountUsd), outUsd = usdOf(d.currencyOut && d.currencyOut.amountUsd);
    return inUsd > 0 && outUsd > 0 && outUsd < inUsd * RELAY_FLOOR ? { inUsd, outUsd } : null;
  }
  function feesOf(answer) {
    const f = answer && answer.fees;
    if (!f || typeof f !== 'object') return null;
    const fee = (key) => (f[key] && typeof f[key].amountUsd === 'string' ? usdOf(f[key].amountUsd) || 0 : 0);
    return fee('relayer') + fee('app');
  }
  const LEAST_MAX = 1000;
  function floorRefusal(answer, inUsd, outUsd) {
    const fees = feesOf(answer);
    if (fees === null) return { reason: 'value_floor', impact: false };
    const route = inUsd - outUsd - fees;
    if (route > fees) return { reason: 'value_floor', impact: true };
    const room = inUsd > 0 ? (1 - VALUE_FLOOR) - Math.max(0, route) / inUsd : 0;
    const least = room > 0 ? fees / (room * inUsd) : NaN;
    return Number.isFinite(least) && least > 1 && least <= LEAST_MAX ? { reason: 'value_floor', impact: false, least } : { reason: 'value_floor', impact: false };
  }
  const refused = (audited) => fail('relay_refused', audited.impact ? { reason: audited.reason, impact: true } : audited.least ? { reason: audited.reason, least: audited.least } : { reason: audited.reason });
  const marketGiven = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined);
  const QUOTE_TTL_MS = 30000;
  const BLOCKHASH_LIFE_MS = 120000;
  const SEND_TRIES = 3;
  const SEND_PAUSE_MS = 1500;
  const BUY_REQUEST = new Set(['user', 'recipient', 'refundTo', 'originChainId', 'destinationChainId', 'originCurrency', 'destinationCurrency', 'amount', 'tradeType', 'slippageTolerance']);
  const SELL_REQUEST = BUY_REQUEST;
  const ROUTE_REQUEST = new Set([...SELL_REQUEST, 'depositFeePayer']);
  const SLIPPAGES = new Set(['50', '100', '300']);
  const slippageHolds = (asked, out, minOut) => asked === undefined || (SLIPPAGES.has(asked) && minOut + 1n >= out * BigInt(10000 - Number(asked) - Math.max(1, Math.ceil(Number(asked) / 20))) / 10000n);

  function fail(code, extra) {
    const err = new Error(code);
    err.code = code;
    return extra ? Object.assign(err, extra) : err;
  }
  const units = (text) => (typeof text === 'string' && DIGITS.test(text) ? BigInt(text) : null);
  const usdOf = (text) => {
    const value = typeof text === 'string' && /^\d{1,15}(\.\d{1,18})?$/.test(text) ? Number(text) : NaN;
    return Number.isFinite(value) ? value : null;
  };
  const sameKeys = (object, allowed) => !!object && typeof object === 'object' && Object.keys(object).every((key) => allowed.has(key));
  const hexBytes = (hex) => Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16));
  const bytesHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const u64 = (value) => {
    const out = new Uint8Array(8);
    let v = BigInt(value);
    for (let i = 0; i < 8; i++) { out[i] = Number(v & 0xffn); v >>= 8n; }
    return out;
  };
  const u32 = (value) => Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
  const concat = (...parts) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    parts.forEach((p) => { out.set(p, at); at += p.length; });
    return out;
  };
  const shortvec = (n) => {
    const out = [];
    for (;;) {
      const b = n & 0x7f;
      n >>= 7;
      if (!n) { out.push(b); return Uint8Array.from(out); }
      out.push(b | 0x80);
    }
  };

  const LIB_NAME = 'SolWallet';
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

  const PATHS = Object.freeze({ phantom: DERIVATION, trust: Object.freeze([44, 501, 0]), root: Object.freeze([44, 501]) });
  const ALT_PATHS = Object.freeze(['trust', 'root']);
  const HOLD_ACCOUNT = 1000;
  const HOLD_LIMIT = 0x80000000;
  const HOLD_PATH = /^holder:(0|[1-9]\d{0,9})$/;
  const holderPath = (index) => 'holder:' + index;
  const holderIndex = (path) => {
    const m = typeof path === 'string' ? HOLD_PATH.exec(path) : null;
    const n = m ? Number(m[1]) : -1;
    return n >= 0 && n < HOLD_LIMIT ? n : null;
  };
  const holderLevels = (index) => Object.freeze([44, 501, HOLD_ACCOUNT, index]);
  const levelsOf = (path) => {
    if (path === undefined) return DERIVATION;
    if (Object.prototype.hasOwnProperty.call(PATHS, path)) return PATHS[path];
    const n = holderIndex(path);
    return n === null ? null : holderLevels(n);
  };
  function slip10(lib, seed, levels) {
    let I = null;
    try {
      I = lib.hmac(lib.sha512, new TextEncoder().encode('ed25519 seed'), seed);
      for (const index of levels) {
        const data = concat(Uint8Array.of(0), I.slice(0, 32), Uint8Array.of(((index >>> 24) & 0x7f) | 0x80, (index >>> 16) & 0xff, (index >>> 8) & 0xff, index & 0xff));
        const next = lib.hmac(lib.sha512, I.slice(32), data);
        I.fill(0);
        data.fill(0);
        I = next;
      }
      const privateKey = Uint8Array.from(I.slice(0, 32));
      return { privateKey, address: lib.base58.encode(lib.ed25519.getPublicKey(privateKey)) };
    } finally {
      if (I) I.fill(0);
    }
  }
  async function keyOf(lib, words, path) {
    const levels = levelsOf(path);
    if (!levels) throw fail('bad_intent');
    const seed = await lib.mnemonicToSeedWebcrypto(words.join(' '));
    try {
      return slip10(lib, seed, levels);
    } finally {
      seed.fill(0);
    }
  }
  async function deriveAddress(lib, words) {
    const key = await keyOf(lib, words);
    key.privateKey.fill(0);
    return key.address;
  }
  async function altAddresses(lib, words) {
    const seed = await lib.mnemonicToSeedWebcrypto(words.join(' '));
    try {
      return ALT_PATHS.map((path) => {
        const key = slip10(lib, seed, PATHS[path]);
        key.privateKey.fill(0);
        return { path, address: key.address };
      });
    } finally {
      seed.fill(0);
    }
  }
  async function holderAddresses(lib, words, from, count) {
    if (!Number.isSafeInteger(from) || from < 0 || !Number.isSafeInteger(count) || count < 1 || count > 64 || from + count > HOLD_LIMIT) throw fail('bad_intent');
    const seed = await lib.mnemonicToSeedWebcrypto(words.join(' '));
    try {
      return Array.from({ length: count }, (_, i) => {
        const key = slip10(lib, seed, holderLevels(from + i));
        key.privateKey.fill(0);
        return { index: from + i, address: key.address };
      });
    } finally {
      seed.fill(0);
    }
  }

  const keyBytes = (lib, text) => {
    if (typeof text !== 'string' || !BASE58.test(text)) return null;
    try {
      const bytes = lib.base58.decode(text);
      return bytes.length === 32 ? bytes : null;
    } catch (_) {
      return null;
    }
  };
  const onCurve = (lib, bytes) => {
    try {
      lib.ed25519.Point.fromBytes(bytes, true);
      return true;
    } catch (_) {
      return false;
    }
  };
  function pdaOf(lib, seeds, program) {
    const tail = concat(lib.base58.decode(program), new TextEncoder().encode('ProgramDerivedAddress'));
    for (let bump = 255; bump >= 0; bump--) {
      const hash = lib.sha256(concat(...seeds, Uint8Array.of(bump), tail));
      if (!onCurve(lib, hash)) return lib.base58.encode(hash);
    }
    throw fail('bad_intent');
  }
  const ataOf = (lib, owner, mint, program) => pdaOf(lib, [lib.base58.decode(owner), lib.base58.decode(program), lib.base58.decode(mint)], ATA_PROGRAM);

  function compile(lib, payer, instructions, blockhash) {
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
    const all = Array.from(metas.entries());
    const rank = ([key, m]) => (key === payer ? 0 : m.signer ? (m.writable ? 1 : 2) : (m.writable ? 3 : 4));
    const keys = all.map((entry, i) => ({ entry, i })).sort((a, b) => rank(a.entry) - rank(b.entry) || a.i - b.i).map((x) => x.entry);
    const signers = keys.filter(([, m]) => m.signer);
    if (signers.length !== 1) throw fail('bad_intent');
    const index = new Map(keys.map(([key], i) => [key, i]));
    const header = Uint8Array.of(1, signers.filter(([, m]) => !m.writable).length, keys.filter(([, m]) => !m.signer && !m.writable).length);
    const body = instructions.map((ix) => concat(Uint8Array.of(index.get(ix.programId)), shortvec(ix.keys.length), Uint8Array.from(ix.keys.map((k) => index.get(k.pubkey))), shortvec(ix.data.length), ix.data));
    return concat(header, shortvec(keys.length), ...keys.map(([key]) => lib.base58.decode(key)), lib.base58.decode(blockhash), shortvec(instructions.length), ...body);
  }
  const budget = (cu, price) => [
    { programId: COMPUTE_BUDGET, keys: [], data: concat(Uint8Array.of(2), u32(cu)) },
    { programId: COMPUTE_BUDGET, keys: [], data: concat(Uint8Array.of(3), u64(price)) }
  ];
  const feeOf = (cu, price) => SIG_FEE + (BigInt(cu) * price + 999999n) / 1000000n;
  function signMessage(lib, privateKey, message) {
    const signature = lib.ed25519.sign(message, privateKey);
    const raw = concat(shortvec(1), signature, message);
    return { raw: btoa(String.fromCharCode(...raw)), hash: lib.base58.encode(signature) };
  }

  const decimalsHold = (chosen, given) => Number.isInteger(given) && given >= 0 && given <= 36 && (chosen === undefined || chosen === null || given === chosen);
  const currencyIs = (side, chainId, address) => !!side && !!side.currency && side.currency.chainId === chainId && side.currency.address === address;
  const PROGRAMS = new Set([TOKEN_PROGRAM, TOKEN_2022, ATA_PROGRAM, COMPUTE_BUDGET, RELAY_PROGRAM, RELAY_VAULT, RELAY_CONFIG]);
  const tokenOk = (token) => typeof token === 'string' && BASE58.test(token) && !PROGRAMS.has(token);

  function auditBuy(plan, intent, nowMs) {
    const no = (reason) => ({ reason });
    if (!plan || plan.kind !== 'buy' || plan.chain !== CHAIN) return no('plan');
    if (!tokenOk(plan.token)) return no('token');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    const total = plan.total;
    if (typeof total !== 'bigint' || total <= 0n) return no('amount');
    const { deposit, fee } = CK.evm.splitBuy(total);
    if (fee <= 0n) return no('amount');
    const owner = intent && intent.owner;
    if (!owner) return no('owner');
    const r = plan.request;
    if (!sameKeys(r, BUY_REQUEST)) return no('request');
    if (T.rawAddress(r.user) !== owner) return no('owner');
    if (T.rawAddress(r.refundTo) !== owner) return no('refund');
    if (typeof r.recipient !== 'string' || !BASE58.test(r.recipient)) return no('recipient');
    if (r.originChainId !== TON_CHAIN_ID || r.destinationChainId !== CHAIN_ID) return no('chain_id');
    if (r.originCurrency !== GRAM_CURRENCY || r.destinationCurrency !== plan.token) return no('token');
    if (r.amount !== deposit.toString() || r.tradeType !== 'EXACT_INPUT') return no('amount');
    const a = plan.answer;
    if (!a || typeof a !== 'object' || !Array.isArray(a.steps) || a.steps.length !== 1) return no('steps');
    const step = a.steps[0];
    if (!step || step.id !== 'deposit' || step.kind !== 'transaction' || !Array.isArray(step.items) || step.items.length !== 1) return no('steps');
    const messages = step.items[0] && step.items[0].data && step.items[0].data.messages;
    if (!Array.isArray(messages) || messages.length !== 1) return no('messages');
    const m = messages[0];
    if (!m || T.rawAddress(m.to) !== DEPOSITORY_RAW) return no('depository');
    if (T.rawAddress(m.from) !== owner) return no('owner');
    if (m.value !== deposit.toString()) return no('value');
    if (m.bounce !== false) return no('bounce');
    if (m.mode !== 1) return no('mode');
    if (typeof m.body !== 'string' || !BODY_BASE64.test(m.body)) return no('body');
    if (typeof a.requestId !== 'string' || !REQUEST_ID.test(a.requestId)) return no('request_id');
    const d = a.details;
    if (!d || typeof d !== 'object') return no('details');
    if (d.recipient !== r.recipient) return no('recipient');
    if (T.rawAddress(d.sender) !== owner) return no('owner');
    if (!currencyIs(d.currencyIn, TON_CHAIN_ID, GRAM_CURRENCY) || d.currencyIn.amount !== deposit.toString()) return no('value');
    if (!currencyIs(d.currencyOut, CHAIN_ID, plan.token) || !decimalsHold(plan.decimals, d.currencyOut.currency.decimals)) return no('token');
    if (plan.token === NATIVE && d.currencyOut.currency.decimals !== 9) return no('token');
    if (!currencyIs(d.refundCurrency, TON_CHAIN_ID, GRAM_CURRENCY)) return no('refund');
    const out = units(d.currencyOut.amount);
    const minOut = units(d.currencyOut.minimumAmount);
    if (!out || !minOut || minOut > out || minOut * 100n < out * MIN_OUT_FLOOR) return no('min_out');
    if (!slippageHolds(r.slippageTolerance, out, minOut)) return no('slippage');
    const inUsd = usdOf(d.currencyIn.amountUsd);
    const outUsd = tokenUsd(plan, out, d.currencyOut.currency.decimals, d.currencyOut.amountUsd);
    if (inUsd === null || outUsd === null || !(inUsd > 0)) return no('no_price');
    if (overMaxUsd(intent, inUsd, outUsd)) return no('cap');
    const g = d.currencyGasTopup;
    if (g && g.amount !== '0') return no('topup');
    if (outUsd < inUsd * VALUE_FLOOR) return floorRefusal(a, inUsd, outUsd);
    const lost = relayLost(d);
    if (lost) return floorRefusal(a, lost.inUsd, lost.outUsd);
    const seconds = Number.isFinite(d.timeEstimate) ? d.timeEstimate : null;
    return { reason: null, total, deposit, fee, recipient: r.recipient, body: m.body, out, minOut, decimals: d.currencyOut.currency.decimals, inUsd, outUsd, topupWei: 0n, topupUsd: 0, feesUsd: feesOf(a), seconds, requestId: a.requestId };
  }

  async function ownTon() {
    const wallet = T.wallet;
    if (!wallet || !wallet.address) throw fail('no_wallet');
    if (wallet.readOnly) throw fail('read_only');
    return wallet.address;
  }
  const address = () => CK.wallet.netAddress('sol');
  const ensureAddress = (options) => CK.wallet.netAddress('sol', { ...(options || {}), unlock: true });

  async function quoteBuy(input) {
    const settings = await T.config();
    if (settings.state !== 'open') throw fail('not_allowed');
    const opts = input || {};
    if (!tokenOk(opts.token) || typeof opts.total !== 'bigint' || opts.total <= 0n || !(opts.decimals === undefined || decimalsHold(undefined, opts.decimals))) throw fail('bad_intent');
    if (opts.risk === 'suspicious') throw fail('flagged');
    const [live, recipient] = await Promise.all([CK.evm.config(), address()]);
    if (!live.buying) throw fail(live.reason === 'unknown' ? 'relay_down' : 'buying_off', { reason: live.reason });
    const owner = await ownTon();
    if (!recipient) throw fail('no_sol_address');
    const { deposit } = CK.evm.splitBuy(opts.total);
    const friendly = T.friendlyAddress(owner);
    const request = { user: friendly, recipient, refundTo: friendly, originChainId: TON_CHAIN_ID, destinationChainId: CHAIN_ID, originCurrency: GRAM_CURRENCY, destinationCurrency: opts.token, amount: deposit.toString(), tradeType: 'EXACT_INPUT' };
    if (opts.slippageBps !== undefined) {
      if (!SLIPPAGES.has(String(opts.slippageBps))) throw fail('bad_intent');
      request.slippageTolerance = String(opts.slippageBps);
    }
    const answer = await CK.evm.relayQuote(request);
    const plan = { kind: 'buy', chain: CHAIN, token: opts.token, decimals: opts.decimals, total: opts.total, request, answer, at: Date.now() };
    if (marketGiven(opts.marketUsd)) plan.marketUsd = opts.marketUsd;
    const audited = auditBuy(plan, { owner, maxUsd: settings.maxUsd }, plan.at);
    if (audited.reason) throw refused(audited);
    const { reason, body, recipient: _r, ...view } = audited;
    plan.view = view;
    plan.maxUsd = settings.maxUsd;
    return plan;
  }
  const quoteGas = (input) => quoteBuy({ token: NATIVE, total: input && input.total });
  async function buy(plan, options) {
    const signed = await CK.wallet.signRelayDeposit(plan, options);
    const sent = await CK.wallet.broadcast(signed.boc);
    return { hash: sent.hash || signed.hash, requestId: plan.view.requestId, seqno: signed.seqno };
  }

  async function state(owner, extra) {
    await T.config();
    let body;
    try {
      body = await T.api('xchain/sol/state?owner=' + encodeURIComponent(owner) + (extra || ''));
    } catch (_) {
      throw fail('state_unknown');
    }
    const lamports = units(body.lamports);
    const priority = units(body.priority);
    if (lamports === null || priority === null || typeof body.blockhash !== 'string' || !BASE58.test(body.blockhash) || !Number.isSafeInteger(body.height)) throw fail('state_unknown');
    const until = Number.isSafeInteger(body.lastValid) && body.lastValid >= body.height ? body.lastValid : body.height + 160;
    return { lamports, priority: priority > PRIORITY_MAX ? PRIORITY_MAX : priority, blockhash: body.blockhash, height: body.height, until, body };
  }
  const plainName = (text, max) => {
    if (typeof text !== 'string') return null;
    const clean = text.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, '').trim().slice(0, max);
    return clean || null;
  };
  async function balances(known) {
    const own = await address();
    if (!own) throw fail('no_sol_address');
    return holdingsOf(own, known);
  }
  async function holdingsOf(own, known) {
    await T.config();
    const extra = (Array.isArray(known) ? known : []).filter((one) => typeof one === 'string' && BASE58.test(one)).slice(0, 40);
    let body;
    try {
      body = await T.api('xchain/sol/balances?owner=' + encodeURIComponent(own) + (extra.length ? '&known=' + encodeURIComponent(extra.join(',')) : ''));
    } catch (_) {
      throw fail('balance_unknown');
    }
    const native = units(body.lamports);
    if (native === null || !Array.isArray(body.tokens)) throw fail('balance_unknown');
    const held = [];
    body.tokens.forEach((one) => {
      const amount = one ? units(one.units) : null;
      if (!one || !BASE58.test(one.mint || '') || !amount || !TOKEN_PROGRAMS.has(one.program) || held.some((h) => h.mint === one.mint)) return;
      const decimals = Number.isInteger(one.decimals) && one.decimals >= 0 && one.decimals <= 36 ? one.decimals : null;
      held.push({ chain: CHAIN, mint: one.mint, address: one.mint, units: amount, decimals, program: one.program, symbol: plainName(one.symbol, 16), name: plainName(one.name, 40), flagged: one.flagged !== false });
    });
    return { address: own, native, held };
  }

  const ROUTED_MS = 10 * 60 * 1000;
  const routedUntil = new Map();
  const planShape = (answer) => {
    const step = answer && Array.isArray(answer.steps) && answer.steps.length === 1 ? answer.steps[0] : null;
    const item = step && Array.isArray(step.items) && step.items.length === 1 ? step.items[0] : null;
    const ixs = item && item.data ? item.data.instructions : null;
    if (!Array.isArray(ixs) || !ixs.length || !ixs.every((ix) => ix && typeof ix === 'object')) return 'unknown';
    return ixs.length === 1 && ixs[0].programId === RELAY_PROGRAM ? 'direct' : 'swap';
  };
  async function quoteSell(input) {
    const settings = await T.config();
    if (settings.state !== 'open') throw fail('not_allowed');
    const opts = input || {};
    if (!tokenOk(opts.token) || typeof opts.units !== 'bigint' || opts.units <= 0n || opts.units >= 1n << 64n) throw fail('bad_intent');
    const live = await CK.evm.config();
    if (!live.selling) throw fail(live.reason === 'unknown' ? 'relay_down' : 'selling_off', { reason: live.reason });
    const owner = await ownTon();
    const from = await address();
    if (!from) throw fail('no_sol_address');
    const friendly = T.friendlyAddress(owner);
    const request = { user: from, recipient: friendly, refundTo: from, originChainId: CHAIN_ID, destinationChainId: TON_CHAIN_ID, originCurrency: opts.token, destinationCurrency: GRAM_CURRENCY, amount: opts.units.toString(), tradeType: 'EXACT_INPUT' };
    const native = opts.token === NATIVE;
    const stateJob = state(from, native ? '' : '&mint=' + encodeURIComponent(opts.token) + '&to=' + RELAY_VAULT);
    const libJob = bundle();
    stateJob.catch(() => {});
    libJob.catch(() => {});
    const cached = !native && (routedUntil.get(opts.token) || 0) > Date.now();
    let answer = cached ? null : await CK.evm.relayQuote(request);
    if (!native && (cached || planShape(answer) === 'swap')) {
      routedUntil.set(opts.token, Date.now() + ROUTED_MS);
      const viaSwap = await quoteThroughSwap(opts, from, friendly, { owner, maxUsd: settings.maxUsd }, stateJob, libJob);
      if (viaSwap) return viaSwap;
      routedUntil.delete(opts.token);
      answer = await CK.evm.relayQuote(request);
    }
    const st = await stateJob;
    const program = native ? null : st.body.program;
    const plan = { kind: 'sell', chain: CHAIN, token: opts.token, decimals: opts.decimals, units: opts.units, from, program, request, answer, at: Date.now() };
    if (marketGiven(opts.marketUsd)) plan.marketUsd = opts.marketUsd;
    const lib = await libJob;
    const audited = auditSell(lib, plan, { owner, maxUsd: settings.maxUsd }, plan.at);
    if (audited.reason) throw refused(audited);
    const fee = feeOf(CU_SALE, st.priority);
    const rent = native ? 0n : saleRent(lib, plan, st.body);
    const view = { units: opts.units, out: audited.out, minOut: audited.minOut, inUsd: audited.inUsd, outUsd: audited.outUsd, feesUsd: audited.feesUsd, gasWei: fee + rent, feeLamports: fee, rentLamports: rent, approves: 0, seconds: audited.seconds, requestId: audited.requestId };
    view.short = saleShort(st.lamports, fee + rent, native ? opts.units : 0n);
    view.maxUnits = native ? (st.lamports > fee ? st.lamports - fee : 0n) : null;
    plan.view = view;
    return plan;
  }
  function saleRent(lib, plan, body) {
    const vaultAta = ataOf(lib, RELAY_VAULT, plan.token, plan.program);
    return Array.isArray(body.toAccounts) && body.toAccounts.includes(vaultAta) ? 0n : ataRent(plan.program);
  }
  function saleShort(lamports, costs, sold) {
    const left = lamports - costs - sold;
    if (left < 0n) return -left;
    return left > 0n && left < RENT_MIN ? RENT_MIN - left : 0n;
  }
  function auditSell(lib, plan, intent, nowMs) {
    if (plan && plan.holder !== undefined) return auditRoute(lib, plan, intent, nowMs);
    const no = (reason) => ({ reason });
    if (!plan || plan.kind !== 'sell' || plan.chain !== CHAIN || !tokenOk(plan.token)) return no('plan');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    if (typeof plan.units !== 'bigint' || plan.units <= 0n || plan.units >= 1n << 64n) return no('amount');
    const owner = intent && intent.owner;
    const from = plan.from;
    if (!owner || !keyBytes(lib, from)) return no('owner');
    const native = plan.token === NATIVE;
    if (!native && !TOKEN_PROGRAMS.has(plan.program)) return no('program');
    const r = plan.request;
    if (!sameKeys(r, SELL_REQUEST) || r.user !== from || r.refundTo !== from || T.rawAddress(r.recipient) !== owner) return no('request');
    if (r.originChainId !== CHAIN_ID || r.destinationChainId !== TON_CHAIN_ID || r.originCurrency !== plan.token || r.destinationCurrency !== GRAM_CURRENCY) return no('chain_id');
    if (r.amount !== plan.units.toString() || r.tradeType !== 'EXACT_INPUT') return no('amount');
    const a = plan.answer;
    if (!a || !Array.isArray(a.steps) || a.steps.length !== 1) return no('steps');
    const step = a.steps[0];
    if (!step || step.id !== 'deposit' || step.kind !== 'transaction' || !Array.isArray(step.items) || step.items.length !== 1) return no('steps');
    const ixs = step.items[0] && step.items[0].data && step.items[0].data.instructions;
    if (!Array.isArray(ixs) || ixs.length !== 1) return no('route');
    const ix = ixs[0];
    if (!ix || ix.programId !== RELAY_PROGRAM || typeof ix.data !== 'string' || !HEX.test(ix.data) || ix.data.length !== 96) return no('route');
    const expect = native
      ? [[RELAY_CONFIG, false, false], [from, true, true], [from, false, false], [RELAY_VAULT, false, true], [SYSTEM, false, false]]
      : [[RELAY_CONFIG, false, false], [from, true, true], [from, false, false], [RELAY_VAULT, false, false], [plan.token, false, false],
        [ataOf(lib, from, plan.token, plan.program), false, true], [ataOf(lib, RELAY_VAULT, plan.token, plan.program), false, true],
        [plan.program, false, false], [ATA_PROGRAM, false, false], [SYSTEM, false, false]];
    if (!Array.isArray(ix.keys) || ix.keys.length !== expect.length) return no('keys');
    for (let i = 0; i < expect.length; i++) {
      const k = ix.keys[i];
      if (!k || k.pubkey !== expect[i][0] || k.isSigner !== expect[i][1] || k.isWritable !== expect[i][2]) return no('keys');
    }
    if (ix.data.slice(0, 16) !== (native ? DEPOSIT_NATIVE : DEPOSIT_TOKEN) || ix.data.slice(16, 32) !== bytesHex(u64(plan.units))) return no('data');
    const worth = saleWorth(plan, intent, a, from);
    if (worth.reason) return worth;
    const instruction = { programId: RELAY_PROGRAM, keys: expect.map(([pubkey, isSigner, isWritable]) => ({ pubkey, isSigner, isWritable })), data: hexBytes(ix.data) };
    return { ...worth, instruction };
  }
  function saleWorth(plan, intent, a, sender) {
    const no = (reason) => ({ reason });
    const native = plan.token === NATIVE;
    if (typeof a.requestId !== 'string' || !REQUEST_ID.test(a.requestId)) return no('request_id');
    const d = a.details;
    if (!d || d.sender !== sender || T.rawAddress(d.recipient) !== intent.owner) return no('details');
    if (!currencyIs(d.currencyIn, CHAIN_ID, plan.token) || d.currencyIn.amount !== plan.units.toString()) return no('token');
    if (!decimalsHold(plan.decimals, d.currencyIn.currency.decimals) || (native && d.currencyIn.currency.decimals !== 9)) return no('token');
    if (!currencyIs(d.currencyOut, TON_CHAIN_ID, GRAM_CURRENCY)) return no('token');
    const out = units(d.currencyOut.amount);
    const minOut = units(d.currencyOut.minimumAmount);
    if (!out || !minOut || minOut > out || minOut * 100n < out * MIN_OUT_FLOOR) return no('min_out');
    const inUsd = tokenUsd(plan, plan.units, d.currencyIn.currency.decimals, d.currencyIn.amountUsd);
    const outUsd = usdOf(d.currencyOut.amountUsd);
    if (inUsd === null || outUsd === null || !(inUsd > 0)) return no('no_price');
    if (overMaxUsd(intent, inUsd, outUsd)) return no('cap');
    if (outUsd < inUsd * VALUE_FLOOR) return floorRefusal(a, inUsd, outUsd);
    const lost = relayLost(d);
    if (lost) return floorRefusal(a, lost.inUsd, lost.outUsd);
    return { reason: null, out, minOut, inUsd, outUsd, feesUsd: feesOf(a), seconds: Number.isFinite(d.timeEstimate) ? d.timeEstimate : null, requestId: a.requestId };
  }


  const HOLD_AHEAD = 16;
  const HOLD_LOW = 4;
  const HOLD_KEEP = 50;
  const HOLD_CLOUD = 'ck_sol_h_';
  const HOLD_CLOUD_OLD = 'ck_sol_hold_';
  const HOLD_KEYS_KEEP = 24;
  const HOLD_KEYS_MAX = 40;
  const HOLD_CHUNK = 50;
  const HOLD_LOCAL = 'ck-sol-hold:';
  const HOLD_NEXT_LOCAL = 'ck-sol-hold-next:';
  const HOLD_CLOUD_MS = 3000;
  const HOLD_FRESH_MS = 60000;
  const HOLD_LOOK_MS = 30 * 24 * 3600 * 1000;
  const HOLD_RECHECK_MS = 10 * 60 * 1000;
  const localRead = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const localWrite = (key, value) => { try { localStorage.setItem(key, value); return true; } catch (_) { return false; } };
  const holdId = (own) => {
    const hex = typeof own === 'string' ? own.slice(own.indexOf(':') + 1) : '';
    return /^[0-9a-fA-F]{64}$/.test(hex) ? hex : null;
  };
  const holdKey = (id, index) => HOLD_CLOUD + id + '_' + index;
  function holdCloud() {
    try {
      const app = CK.tg && CK.tg.app;
      return app && app.CloudStorage && typeof app.isVersionAtLeast === 'function' && app.isVersionAtLeast('6.9') ? app.CloudStorage : null;
    } catch (_) {
      return null;
    }
  }
  const cloudCall = (start) => new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ err: 'timeout' }), HOLD_CLOUD_MS);
    try {
      start((err, value) => {
        clearTimeout(timer);
        resolve({ err: err || null, value });
      });
    } catch (_) {
      clearTimeout(timer);
      resolve({ err: 'failed' });
    }
  });
  function holdParse(text) {
    let rec = null;
    try { rec = JSON.parse(text || 'null'); } catch (_) { return null; }
    if (!rec || typeof rec !== 'object' || !Number.isSafeInteger(rec.n) || rec.n < 0 || rec.n > HOLD_LIMIT || !Array.isArray(rec.h)) return null;
    const h = rec.h.filter((one) => Array.isArray(one) && Number.isSafeInteger(one[0]) && one[0] >= 0 && one[0] < HOLD_LIMIT && typeof one[1] === 'string' && BASE58.test(one[1])
      && Number.isSafeInteger(one[2]) && one[2] >= 0 && (one[3] === '' || (typeof one[3] === 'string' && REQUEST_ID.test(one[3]))))
      .map((one) => ({ index: one[0], address: one[1], at: one[2], requestId: one[3] }));
    return { n: rec.n, h };
  }
  function holdMerge(...recs) {
    const seen = new Map();
    let n = 0;
    recs.filter(Boolean).forEach((rec) => {
      n = Math.max(n, rec.n);
      rec.h.forEach((one) => {
        const id = one.index + ':' + one.address;
        if (!seen.has(id) || (!seen.get(id).requestId && one.requestId)) seen.set(id, one);
      });
    });
    const h = Array.from(seen.values()).sort((a, b) => a.at - b.at || a.index - b.index);
    h.forEach((one) => { if (one.index >= n) n = one.index + 1; });
    return { n: Math.min(n, HOLD_LIMIT), h: h.slice(-HOLD_KEEP) };
  }
  function holdText(rec) {
    return JSON.stringify({ n: rec.n, h: rec.h.map((one) => [one.index, one.address, one.at, one.requestId || '']) });
  }
  const holdLocal = (own) => holdParse(localRead(HOLD_LOCAL + own)) || { n: 0, h: [] };
  const holdSave = (own, rec) => {
    const text = holdText(rec);
    if (text !== holdText(holdLocal(own))) localWrite(HOLD_LOCAL + own, text);
  };
  const holdSeen = new Map();
  const holdValue = (one) => JSON.stringify([one.address, one.at, one.requestId || '', one.token || '']);
  function holdValueParse(index, text) {
    let v = null;
    try { v = JSON.parse(text || 'null'); } catch (_) { return null; }
    if (!Array.isArray(v) || typeof v[0] !== 'string' || !BASE58.test(v[0]) || !Number.isSafeInteger(v[1]) || v[1] < 0) return null;
    if (!(v[2] === '' || (typeof v[2] === 'string' && REQUEST_ID.test(v[2]))) || !(v[3] === undefined || v[3] === '' || (typeof v[3] === 'string' && BASE58.test(v[3])))) return null;
    return { index, address: v[0], at: v[1], requestId: v[2], token: v[3] || '' };
  }
  async function cloudValues(store, keys) {
    const out = {};
    if (typeof store.getItems === 'function') {
      for (let i = 0; i < keys.length; i += HOLD_CHUNK) {
        const part = keys.slice(i, i + HOLD_CHUNK);
        const got = await cloudCall((done) => store.getItems(part, done));
        if (got.err || !got.value || typeof got.value !== 'object') return null;
        part.forEach((key) => { out[key] = typeof got.value[key] === 'string' ? got.value[key] : ''; });
      }
      return out;
    }
    const got = await Promise.all(keys.map((key) => cloudCall((done) => store.getItem(key, done))));
    if (got.some((one) => one.err)) return null;
    keys.forEach((key, i) => { out[key] = typeof got[i].value === 'string' ? got[i].value : ''; });
    return out;
  }
  async function cloudDrop(store, keys) {
    if (typeof store.removeItems === 'function') return cloudCall((done) => store.removeItems(keys, done));
    if (typeof store.removeItem !== 'function') return { err: 'failed' };
    const got = await Promise.all(keys.map((key) => cloudCall((done) => store.removeItem(key, done))));
    return got.find((one) => one.err) || { err: null };
  }
  async function holdList(store, id) {
    const none = { heard: false, indexes: [], old: false };
    if (!store || !id || typeof store.getKeys !== 'function') return none;
    const got = await cloudCall((done) => store.getKeys(done));
    if (got.err || !Array.isArray(got.value)) return none;
    const head = HOLD_CLOUD + id + '_';
    const indexes = new Set();
    got.value.forEach((key) => {
      const n = typeof key === 'string' && key.startsWith(head) ? holderIndex('holder:' + key.slice(head.length)) : null;
      if (n !== null) indexes.add(n);
    });
    return { heard: true, indexes: [...indexes].sort((a, b) => a - b), old: got.value.includes(HOLD_CLOUD_OLD + id) };
  }
  async function holdMigrate(store, id, listed) {
    const key = HOLD_CLOUD_OLD + id;
    const got = await cloudCall((done) => store.getItem(key, done));
    if (got.err) return null;
    const old = got.value ? holdParse(got.value) : { n: 0, h: [] };
    if (!old) return null;
    const byIndex = new Map();
    old.h.forEach((one) => { if (!listed.includes(one.index)) byIndex.set(one.index, one); });
    const room = Math.max(0, HOLD_KEYS_MAX - listed.length);
    const moving = room ? [...byIndex.values()].sort((a, b) => a.index - b.index).slice(-room) : [];
    const put = await Promise.all(moving.map((one) => cloudCall((done) => store.setItem(holdKey(id, one.index), holdValue(one), done))));
    if (!put.some((one) => one.err)) await cloudDrop(store, [key]);
    return old;
  }
  async function holdRead(own) {
    const store = holdCloud();
    const id = holdId(own);
    const list = await holdList(store, id);
    let heard = list.heard, old = null;
    if (heard && list.old) {
      old = await holdMigrate(store, id, list.indexes);
      if (!old) heard = false;
    }
    const top = list.indexes.length ? list.indexes[list.indexes.length - 1] + 1 : 0;
    const rec = holdMerge(holdLocal(own), old, { n: top, h: [] });
    holdSave(own, rec);
    holdSeen.set(own, Date.now());
    return { ...rec, heard, listed: list.indexes };
  }
  async function holdCommit(own, index, address, requestId, token) {
    const store = holdCloud();
    const id = holdId(own);
    const rec = await holdRead(own);
    if (store && !(id && rec.heard)) return 'unheard';
    if (index < rec.n) return 'taken';
    const sold = typeof token === 'string' && BASE58.test(token) ? token : '';
    let count = rec.listed.length;
    if (store && count >= HOLD_KEYS_MAX) {
      if ((await holdPrune(own, true, sold)) === null) return 'unheard';
      const again = await holdRead(own);
      if (!again.heard) return 'unheard';
      if (index < again.n) return 'taken';
      if (again.listed.length >= HOLD_KEYS_MAX) return 'full';
      count = again.listed.length;
    }
    const one = { index, address, at: Math.floor(Date.now() / 1000), requestId, token: sold };
    const local = localWrite(HOLD_LOCAL + own, holdText(holdMerge(holdLocal(own), rec, { n: index + 1, h: [one] })));
    if (!store) return local ? 'kept' : 'lost';
    const key = holdKey(id, index);
    const text = holdValue(one);
    const put = await cloudCall((done) => store.setItem(key, text, done));
    if (put.err) return 'unheard';
    const back = await cloudCall((done) => store.getItem(key, done));
    if (back.err) return 'unheard';
    if (back.value !== text) return 'taken';
    if (count + 1 > HOLD_KEYS_KEEP) holdPrune(own, false, sold).catch(() => null);
    return 'kept';
  }
  const holdLooked = new Map();
  async function holdLook(address, sold) {
    const id = address + ':' + sold.join(',');
    const was = holdLooked.get(id);
    if (was && Date.now() - was.at < HOLD_RECHECK_MS) return was.kind;
    let seen;
    try {
      seen = await holdingsOf(address, sold);
    } catch (_) {
      return null;
    }
    const spam = seen.held.length > 0 && seen.held.every((one) => one.flagged && !sold.includes(one.mint));
    const bare = seen.native <= SOL_DUST || (spam && seen.native <= MOVE_KEEP);
    const kind = bare && !seen.held.length ? 'empty' : bare && spam ? 'airdrop' : 'held';
    holdLooked.set(id, { at: Date.now(), kind });
    return kind;
  }
  async function holdPrune(own, full, token) {
    const store = holdCloud();
    const id = holdId(own);
    const list = await holdList(store, id);
    if (!list.heard) return null;
    const older = list.indexes.slice(0, Math.max(0, list.indexes.length - HOLD_KEYS_KEEP));
    if (!older.length) return list.indexes.length;
    const values = await cloudValues(store, (full ? list.indexes : older).map((n) => holdKey(id, n)));
    if (!values) return list.indexes.length;
    const sold = [token, ...list.indexes.map((n) => { const one = holdValueParse(n, values[holdKey(id, n)]); return one ? one.token : ''; })]
      .filter((mint, i, all) => typeof mint === 'string' && BASE58.test(mint) && all.indexOf(mint) === i);
    const local = holdLocal(own).h;
    const since = Math.floor((Date.now() - HOLD_LOOK_MS) / 1000);
    const gone = [];
    for (const n of older) {
      const shared = holdValueParse(n, values[holdKey(id, n)]);
      const named = local.filter((one) => one.index === n).map((one) => ({ address: one.address, at: one.at, token: shared && shared.address === one.address ? shared.token : '' }));
      if (shared && !named.some((one) => one.address === shared.address)) named.push({ address: shared.address, at: shared.at, token: shared.token });
      if (!full && named.some((one) => one.at >= since)) continue;
      let free = true;
      for (const one of named) {
        const kind = await holdLook(one.address, one.token ? [one.token] : sold);
        if (!(kind === 'empty' || (full && kind === 'airdrop'))) {
          free = false;
          break;
        }
      }
      if (free) gone.push(n);
    }
    if (!gone.length) return list.indexes.length;
    const dropped = await cloudDrop(store, gone.map((n) => holdKey(id, n)));
    if (dropped.err) return list.indexes.length;
    return list.indexes.length - gone.length;
  }
  async function holdFetch(own, listed) {
    const store = holdCloud();
    const id = holdId(own);
    const have = new Set(holdLocal(own).h.map((one) => one.index));
    const missing = listed.filter((n) => !have.has(n));
    if (!store || !id || !missing.length) return holdLocal(own);
    const values = await cloudValues(store, missing.map((n) => holdKey(id, n)));
    if (!values) return holdLocal(own);
    const rec = holdMerge(holdLocal(own), { n: 0, h: missing.map((n) => holdValueParse(n, values[holdKey(id, n)])).filter(Boolean) });
    holdSave(own, rec);
    return rec;
  }
  async function holdNext(own) {
    if (!holdSeen.has(own) || Date.now() - holdSeen.get(own) > HOLD_FRESH_MS) await holdRead(own);
    return holdLocal(own).n;
  }
  function aheadRead(own, sol) {
    let rec = null;
    try { rec = JSON.parse(localRead(HOLD_NEXT_LOCAL + own) || 'null'); } catch (_) { rec = null; }
    if (!rec || rec.sol !== sol || !Number.isSafeInteger(rec.from) || rec.from < 0 || !Array.isArray(rec.a) || !rec.a.length || rec.a.length > 64) return null;
    return rec.a.every((one) => typeof one === 'string' && BASE58.test(one) && one !== sol) ? rec : null;
  }
  const aheadAt = (own, sol, index) => {
    const rec = aheadRead(own, sol);
    return rec && index >= rec.from && index < rec.from + rec.a.length ? rec.a[index - rec.from] : null;
  };
  function holderShort(own, sol) {
    if (typeof own !== 'string' || !own || typeof sol !== 'string' || !BASE58.test(sol)) return false;
    const rec = aheadRead(own, sol);
    const next = holdLocal(own).n;
    return !rec || next < rec.from || next + HOLD_LOW > rec.from + rec.a.length;
  }
  async function holderFill(lib, words, own, sol) {
    if (!holderShort(own, sol) || !Array.isArray(words)) return;
    const from = holdLocal(own).n;
    const list = await holderAddresses(lib, words, from, Math.min(HOLD_AHEAD, HOLD_LIMIT - from));
    if (list.some((one) => one.address === sol)) return;
    localWrite(HOLD_NEXT_LOCAL + own, JSON.stringify({ sol, from, a: list.map((one) => one.address) }));
  }
  function holderFor(lib, own, sol, index) {
    const address = aheadAt(own, sol, index);
    if (address) return { index, address };
    const secret = crypto.getRandomValues(new Uint8Array(32));
    try {
      return { index, address: lib.base58.encode(lib.ed25519.getPublicKey(secret)), draft: true };
    } finally {
      secret.fill(0);
    }
  }
  async function holderAlts(own, sol, launch) {
    const read = await holdRead(own).catch(() => null);
    const rec = read ? await holdFetch(own, read.listed).catch(() => holdLocal(own)) : holdLocal(own);
    const since = Math.floor((Date.now() - HOLD_LOOK_MS) / 1000);
    const out = [];
    rec.h.filter((one) => !launch || one.at >= since).forEach((one) => {
      if (one.address !== sol && !out.some((alt) => alt.address === one.address)) out.push({ path: holderPath(one.index), address: one.address });
    });
    return out;
  }
  const committed = new WeakMap();
  const spent = new WeakSet();
  const utf8 = (text) => new TextEncoder().encode(text);
  const JUP_SWAPS = '00000000100010011110010110011g0004000001043a550.000000000010110010000002000.000008800129010000110000000.1011001.00001191.1g.01h10100100a1000010001.000011102090815101112101110100110011.1..201.2111011010001111g11.';
  const JUP_SWAPS_BIG = { 123: 48, 185: 57, 186: 65, 190: 81 };
  const JUP_CANDIDATES = '9190010111.0101...01111';
  const JUP_CANDIDATES_BIG = { 15: 57, 16: 65, 17: 81 };
  function planEnd(bytes) {
    const n = bytes.length;
    const count = (at) => (at + 4 <= n ? readU32(bytes, at) : -1);
    const accountsInfo = (at) => { const k = count(at); return k < 0 ? -1 : at + 4 + 2 * k; };
    const option = (at, then) => (bytes[at] === 0 ? at + 1 : bytes[at] === 1 ? then(at + 1) : -1);
    const many = (at, item) => {
      let k = count(at);
      if (k < 0) return -1;
      for (at += 4; k > 0 && at !== null && at >= 0 && at <= n; k--) at = item(at);
      return at;
    };
    const after = (at, then) => (at === null || at < 0 ? at : then(at));
    const candidate = (at) => {
      if (at >= n) return -1;
      const id = bytes[at], size = JUP_CANDIDATES[id];
      if (size === undefined) return null;
      if (size !== '.') return at + 1 + parseInt(size, 36);
      return id === 10 ? option(at + 2, accountsInfo) : at + 1 + JUP_CANDIDATES_BIG[id];
    };
    const swap = (at) => {
      if (at >= n) return -1;
      const id = bytes[at], size = JUP_SWAPS[id];
      if (size === undefined) return null;
      at += 1;
      if (size !== '.') return at + parseInt(size, 36);
      if (id === 47 || id === 103) return option(at + 1, accountsInfo);
      if (id === 75 || id === 210) return accountsInfo(at);
      if (id === 111) return after(many(at, candidate), (end) => option(end, (x) => x + 1));
      if (id === 120) { const k = count(at + 1); return k < 0 ? -1 : at + 5 + k; }
      if (id === 146) return after(many(at, (x) => after(candidate(x), (end) => end + 4)), (end) => end + 2);
      if (id === 183) return option(at + 1, (x) => x + 1);
      return at + JUP_SWAPS_BIG[id];
    };
    let at = 13;
    for (let k = count(9); k > 0 && at !== null && at >= 0 && at <= n; k--) at = after(swap(at), (end) => end + 3);
    return count(9) < 0 ? -1 : at;
  }
  function sharedRoute(lib, ix, plan) {
    const no = (why) => (why === 'payer' ? { reason: why } : { reason: 'route', detail: why });
    if (ix.programId !== JUPITER || ix.data.slice(0, 16) !== JUP_SHARED || ix.keys.length < 13) return no('route');
    if (ix.keys.some((k, i) => k.pubkey === plan.from || (k.pubkey === plan.holder && i !== 2 && k.isWritable))) return no('payer');
    const bytes = hexBytes(ix.data);
    const n = bytes.length;
    if (n < 8 + 1 + 4 + 19) return no('data');
    const mid = ix.keys[8].pubkey;
    if (!MIDS.has(mid)) return no('route');
    const authority = pdaOf(lib, [utf8('authority'), Uint8Array.of(bytes[8])], JUPITER);
    const held = ataOf(lib, plan.holder, plan.token, plan.program);
    const expect = [[ix.keys[0].pubkey === TOKEN_PROGRAM ? TOKEN_PROGRAM : null, false, false], [authority, false, false], [plan.holder, true, false], [held, false, true],
      [ix.keys[4].pubkey === held ? held : ataOf(lib, authority, plan.token, plan.program), false, true], [ataOf(lib, authority, mid, TOKEN_PROGRAM), false, true], [ataOf(lib, FORWARDER, mid, TOKEN_PROGRAM), false, true],
      [plan.token, false, false], [mid, false, false], [JUPITER, false, false], [plan.program === TOKEN_2022 ? TOKEN_2022 : ix.keys[10].pubkey === TOKEN_2022 ? TOKEN_2022 : JUPITER, false, false],
      [JUP_EVENTS, false, false], [JUPITER, false, false]];
    for (let i = 0; i < expect.length; i++) {
      const k = ix.keys[i];
      if (k.pubkey !== expect[i][0] || k.isSigner !== expect[i][1] || k.isWritable !== expect[i][2]) return no('keys');
    }
    const end = planEnd(bytes);
    if (end !== null && end + 19 !== n) return no('data');
    const inAmount = readU64(bytes, n - 19);
    const quoted = readU64(bytes, n - 11);
    const slippage = bytes[n - 3] | (bytes[n - 2] << 8);
    if (inAmount !== plan.units || quoted <= 0n || slippage > 100 * (100 - Number(MIN_OUT_FLOOR)) || bytes[n - 1] !== 0) return no('data');
    const refund = plan.answer && plan.answer.details && plan.answer.details.refundCurrency;
    const least = quoted * BigInt(10000 - slippage) / 10000n;
    const refundMin = currencyIs(refund, CHAIN_ID, mid) ? units(refund.minimumAmount) : null;
    if (refundMin === null || units(refund.amount) !== quoted || refundMin < least || refundMin > least + 1n) return no('data');
    return { mid, least, loose: ix.keys.slice(13).map((k) => k.pubkey) };
  }
  const MID_UNIT = 1e6;
  function routeHolds(least, worth) {
    const leastUsd = Number(least) / MID_UNIT;
    const guaranteedUsd = worth.outUsd * Number(worth.minOut) / Number(worth.out);
    return leastUsd >= worth.inUsd * VALUE_FLOOR && leastUsd >= guaranteedUsd;
  }
  const ROUTE_LAYOUT = new Set(['program', 'keys', 'data', 'route']);
  function auditRoute(lib, plan, intent, nowMs) {
    const no = (why) => (ROUTE_LAYOUT.has(why) ? { reason: 'route', detail: why } : { reason: why });
    if (!plan || plan.kind !== 'sell' || plan.chain !== CHAIN || !tokenOk(plan.token) || plan.token === NATIVE) return no('plan');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    if (typeof plan.units !== 'bigint' || plan.units <= 0n || plan.units >= 1n << 64n) return no('amount');
    const owner = intent && intent.owner;
    const from = plan.from, holder = plan.holder;
    if (!owner || !keyBytes(lib, from)) return no('owner');
    const held = keyBytes(lib, holder);
    if (!held || holder === from || !onCurve(lib, held)) return no('holder');
    if (!TOKEN_PROGRAMS.has(plan.program) || !Number.isInteger(plan.mintDecimals) || plan.mintDecimals < 0 || plan.mintDecimals > 36) return no('program');
    const r = plan.request;
    if (!sameKeys(r, ROUTE_REQUEST) || r.user !== holder || r.depositFeePayer !== holder || r.refundTo !== from || T.rawAddress(r.recipient) !== owner) return no('request');
    if (r.originChainId !== CHAIN_ID || r.destinationChainId !== TON_CHAIN_ID || r.originCurrency !== plan.token || r.destinationCurrency !== GRAM_CURRENCY) return no('chain_id');
    if (r.amount !== plan.units.toString() || r.tradeType !== 'EXACT_INPUT') return no('amount');
    const a = plan.answer;
    if (!a || !Array.isArray(a.steps) || a.steps.length !== 1) return no('steps');
    const step = a.steps[0];
    if (!step || step.id !== 'deposit' || step.kind !== 'transaction' || !Array.isArray(step.items) || step.items.length !== 1) return no('steps');
    const data = step.items[0] && step.items[0].data;
    const ixs = data && data.instructions;
    const named = data && data.addressLookupTableAddresses !== undefined ? data.addressLookupTableAddresses : [];
    if (!Array.isArray(ixs) || ixs.length < 3 || ixs.length > 7) return no('route');
    if (!Array.isArray(named) || named.length > TABLES_MAX || !named.every((t) => keyBytes(lib, t))) return no('route');
    for (const ix of ixs) {
      if (!ix || !keyBytes(lib, ix.programId) || typeof ix.data !== 'string' || !HEX.test(ix.data) || ix.data.length % 2 || ix.data.length > 2048 || !Array.isArray(ix.keys) || ix.keys.length > 64) return no('route');
      if (ix.keys.some((k) => !k || !keyBytes(lib, k.pubkey) || typeof k.isSigner !== 'boolean' || typeof k.isWritable !== 'boolean' || (k.isSigner && k.pubkey !== holder))) return no('keys');
    }
    if (typeof a.requestId !== 'string' || !REQUEST_ID.test(a.requestId)) return no('request_id');
    const [swap, forward, memo] = ixs.slice(-3);
    if (memo.programId !== MEMO || memo.keys.length || memo.data !== bytesHex(utf8(a.requestId))) return no('route');
    if (swap.programId !== JUPITER) return no('route');
    const route = sharedRoute(lib, swap, plan);
    if (route.reason) return route;
    const mid = route.mid;
    const fwdAta = ataOf(lib, FORWARDER, mid, TOKEN_PROGRAM);
    const expect = [[holder, true, true], [holder, false, false], [FORWARDER, false, true], [RELAY_CONFIG, false, false], [RELAY_VAULT, false, false], [mid, false, false],
      [fwdAta, false, true], [ataOf(lib, RELAY_VAULT, mid, TOKEN_PROGRAM), false, true], [RELAY_PROGRAM, false, false], [TOKEN_PROGRAM, false, false], [ATA_PROGRAM, false, false], [SYSTEM, false, false]];
    if (forward.programId !== FORWARDER_PROGRAM) return no('route');
    if (forward.keys.length !== expect.length || forward.keys.some((k, i) => k.pubkey !== expect[i][0] || k.isSigner !== expect[i][1] || k.isWritable !== expect[i][2])) return no('keys');
    if (forward.data.length !== 80 || forward.data.slice(0, 16) !== FORWARD) return no('data');
    const holderAta = ataOf(lib, holder, plan.token, plan.program);
    const kept = [];
    for (const make of ixs.slice(0, -3)) {
      if (make.programId !== ATA_PROGRAM || make.data !== '01' || make.keys.length !== 6) return no('route');
      const [payer, account, who, mint, system, program] = make.keys;
      if (payer.pubkey !== holder || !payer.isSigner || !payer.isWritable || !account.isWritable || system.pubkey !== SYSTEM || !TOKEN_PROGRAMS.has(program.pubkey)) return no('keys');
      if ([who, mint, system, program].some((k) => k.isSigner || k.isWritable) || account.pubkey !== ataOf(lib, who.pubkey, mint.pubkey, program.pubkey)) return no('keys');
      if (who.pubkey === FORWARDER && account.pubkey === fwdAta && !kept.length) kept.push(make);
      else if (who.pubkey !== holder || (account.pubkey !== holderAta && [swap, forward].some((ix) => ix.keys.some((k) => k.pubkey === account.pubkey)))) return no('route');
    }
    const d = a.details;
    if (!d || !d.currencyIn || !d.currencyIn.currency || d.currencyIn.currency.decimals !== plan.mintDecimals) return no('token');
    const worth = saleWorth(plan, intent, a, holder);
    if (worth.reason) return worth;
    if (!routeHolds(route.least, worth)) return { reason: 'value_floor', impact: true };
    const rebuilt = (keys, programId, bytes) => ({ programId, keys: keys.map(([pubkey, isSigner, isWritable]) => ({ pubkey, isSigner, isWritable })), data: bytes });
    const instructions = [
      ...kept.map((make) => rebuilt(make.keys.map((k) => [k.pubkey, k.isSigner, k.isWritable]), ATA_PROGRAM, Uint8Array.of(1))),
      { programId: JUPITER, keys: swap.keys.map((k) => ({ pubkey: k.pubkey, isSigner: k.isSigner, isWritable: k.isWritable })), data: hexBytes(swap.data) },
      rebuilt(expect, FORWARDER_PROGRAM, hexBytes(forward.data)),
      { programId: MEMO, keys: [], data: utf8(a.requestId) }
    ];
    const checked = new Set([from, holder, holderAta, ataOf(lib, from, plan.token, plan.program), ...expect.map((e) => e[0]), ...swap.keys.slice(0, 13).map((k) => k.pubkey),
      ...kept.flatMap((make) => make.keys.map((k) => k.pubkey)), ATA_PROGRAM, TOKEN_PROGRAM, TOKEN_2022, MEMO, JUPITER, FORWARDER_PROGRAM, COMPUTE_BUDGET]);
    const loose = new Set(route.loose.filter((key) => !checked.has(key)));
    loose.add(plan.token);
    return { ...worth, instructions, tables: named.slice(), loose };
  }
  async function routeTables(lib, from, named) {
    const others = named.filter((t) => t !== RELAY_TABLE);
    if (!others.length) return Object.freeze([]);
    const st = await state(from, '&tables=' + others.map(encodeURIComponent).join(','));
    const read = st.body.tables && typeof st.body.tables === 'object' ? st.body.tables : {};
    return Object.freeze(others.map((address) => {
      const keys = Object.prototype.hasOwnProperty.call(read, address) ? read[address] : null;
      return Array.isArray(keys) && keys.length <= 256 && keys.every((key) => keyBytes(lib, key)) ? Object.freeze({ address, keys: Object.freeze(keys.slice()) }) : null;
    }).filter(Boolean));
  }
  function compileV0(lib, payer, instructions, blockhash, tables, loose) {
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
    const programs = new Set(instructions.map((ix) => ix.programId));
    const lookups = tables.map((t) => ({ address: t.address, own: t.address === RELAY_TABLE, keys: t.address === RELAY_TABLE ? RELAY_TABLE_KEYS : t.keys, writable: [], readonly: [] }));
    const statics = [];
    Array.from(metas.entries()).forEach(([key, m], i) => {
      if (!m.signer && !programs.has(key)) {
        for (const l of lookups) {
          const at = l.own || loose.has(key) ? l.keys.indexOf(key) : -1;
          if (at >= 0 && at < 256) {
            (m.writable ? l.writable : l.readonly).push({ key, at });
            return;
          }
        }
      }
      statics.push({ key, m, i });
    });
    const rank = ({ key, m }) => (key === payer ? 0 : m.signer ? (m.writable ? 1 : 2) : (m.writable ? 3 : 4));
    statics.sort((a, b) => rank(a) - rank(b) || a.i - b.i);
    const order = [...statics.map((s) => s.key), ...lookups.flatMap((l) => l.writable.map((x) => x.key)), ...lookups.flatMap((l) => l.readonly.map((x) => x.key))];
    if (order.length > 256) return null;
    const index = new Map(order.map((key, i) => [key, i]));
    const signers = statics.filter((s) => s.m.signer);
    const header = Uint8Array.of(signers.length, signers.filter((s) => !s.m.writable).length, statics.filter((s) => !s.m.signer && !s.m.writable).length);
    const body = instructions.map((ix) => concat(Uint8Array.of(index.get(ix.programId)), shortvec(ix.keys.length), Uint8Array.from(ix.keys.map((k) => index.get(k.pubkey))), shortvec(ix.data.length), ix.data));
    const used = lookups.filter((l) => l.writable.length || l.readonly.length);
    const tail = used.map((l) => concat(lib.base58.decode(l.address), shortvec(l.writable.length), Uint8Array.from(l.writable.map((x) => x.at)), shortvec(l.readonly.length), Uint8Array.from(l.readonly.map((x) => x.at))));
    const message = concat(Uint8Array.of(0x80), header, shortvec(statics.length), ...statics.map((s) => lib.base58.decode(s.key)), lib.base58.decode(blockhash), shortvec(instructions.length), ...body, shortvec(used.length), ...tail);
    return { message, signers: signers.map((s) => s.key) };
  }
  function routeMessage(lib, plan, audited, blockhash, priority) {
    const k = (pubkey, isSigner, isWritable) => ({ pubkey, isSigner, isWritable });
    const own = ataOf(lib, plan.from, plan.token, plan.program);
    const held = ataOf(lib, plan.holder, plan.token, plan.program);
    const body = [
      { programId: ATA_PROGRAM, keys: [k(plan.from, true, true), k(held, false, true), k(plan.holder, false, false), k(plan.token, false, false), k(SYSTEM, false, false), k(plan.program, false, false)], data: Uint8Array.of(1) },
      { programId: plan.program, keys: [k(own, false, true), k(plan.token, false, false), k(held, false, true), k(plan.from, true, false)], data: concat(Uint8Array.of(12), u64(plan.units), Uint8Array.of(plan.mintDecimals)) },
      ...audited.instructions,
      { programId: plan.program, keys: [k(held, false, true), k(plan.from, false, true), k(plan.holder, true, false)], data: Uint8Array.of(9) }
    ];
    const tables = [...(audited.tables.includes(RELAY_TABLE) ? [{ address: RELAY_TABLE }] : []), ...(Array.isArray(plan.tables) ? plan.tables : []).filter((t) => t && t.address !== RELAY_TABLE && Array.isArray(t.keys))];
    for (const cu of [CU_ROUTE, 0]) {
      const ixs = cu ? [...budget(cu, priority), ...body] : [budget(0, priority)[1], ...body];
      const built = compileV0(lib, plan.from, ixs, blockhash, tables, audited.loose);
      if (built && 1 + 64 * built.signers.length + built.message.length <= SOL_TX_MAX) {
        const limit = BigInt(cu || Math.min(CU_MAX, CU_PER_IX * body.length));
        return { ...built, fee: SIG_FEE * BigInt(built.signers.length) + (limit * priority + 999999n) / 1000000n };
      }
    }
    return null;
  }
  function routeShort(lamports, fee, hold) {
    const during = fee + hold > lamports ? fee + hold - lamports : 0n;
    const after = saleShort(lamports, fee, 0n);
    return during > after ? during : after;
  }
  const ROUTE_ASKS = 2;
  const askAgain = (reason) => reason === 'payer' || reason === 'size';
  async function quoteThroughSwap(opts, from, friendly, intent, stateJob, libJob) {
    const lib = await libJob;
    const own = intent.owner;
    const start = await holdNext(own);
    let filled = false;
    for (let ask = 1; ; ask++) {
      const index = start + ask - 1;
      if (index >= HOLD_LIMIT) throw fail('relay_refused', { reason: 'holder' });
      if (!aheadAt(own, from, index) && !filled && CK.wallet && typeof CK.wallet.netAltFill === 'function') {
        filled = true;
        await CK.wallet.netAltFill('sol').catch(() => null);
      }
      const holder = holderFor(lib, own, from, index);
      const request = { user: holder.address, recipient: friendly, refundTo: from, depositFeePayer: holder.address, originChainId: CHAIN_ID, destinationChainId: TON_CHAIN_ID, originCurrency: opts.token, destinationCurrency: GRAM_CURRENCY, amount: opts.units.toString(), tradeType: 'EXACT_INPUT' };
      let answer;
      try {
        answer = await CK.evm.relayQuote(request);
      } catch (err) {
        if (ask < ROUTE_ASKS && err && err.code === 'no_route' && err.relay === 'SOLANA_TX_TOO_LARGE') continue;
        throw err;
      }
      if (planShape(answer) === 'direct') return null;
      const st = await stateJob;
      const plan = { kind: 'sell', chain: CHAIN, token: opts.token, decimals: opts.decimals, units: opts.units, from, program: st.body.program, mintDecimals: st.body.decimals, holder: holder.address, holderIndex: index, request, answer, at: Date.now() };
      if (holder.draft) plan.draft = true;
      if (marketGiven(opts.marketUsd)) plan.marketUsd = opts.marketUsd;
      const audited = auditSell(lib, plan, intent, plan.at);
      if (audited.reason) {
        if (ask < ROUTE_ASKS && askAgain(audited.reason)) continue;
        throw refused(audited);
      }
      plan.tables = await routeTables(lib, from, audited.tables);
      const built = routeMessage(lib, plan, audited, st.blockhash, st.priority);
      if (!built) {
        if (ask < ROUTE_ASKS) continue;
        throw fail('relay_refused', { reason: 'size' });
      }
      const hold = ataRent(plan.program);
      plan.view = { units: opts.units, out: audited.out, minOut: audited.minOut, inUsd: audited.inUsd, outUsd: audited.outUsd, feesUsd: audited.feesUsd, gasWei: built.fee, feeLamports: built.fee, rentLamports: 0n, holdLamports: hold, approves: 0, seconds: audited.seconds, requestId: audited.requestId, short: routeShort(st.lamports, built.fee, hold), maxUnits: null };
      return plan;
    }
  }
  const TOUCH_READ_MS = 2500;
  let touchRead = null;
  function warmSell(plan) {
    if (!plan || plan.kind !== 'sell' || plan.chain !== CHAIN || typeof plan.from !== 'string' || !BASE58.test(plan.from)) return;
    if (touchRead && touchRead.from === plan.from && Date.now() - touchRead.at < TOUCH_READ_MS) return;
    const job = state(plan.from);
    job.catch(() => {});
    touchRead = { from: plan.from, at: Date.now(), job };
  }
  function swipeState(from) {
    const held = touchRead;
    touchRead = null;
    return held && held.from === from && Date.now() - held.at < TOUCH_READ_MS ? held.job.catch(() => state(from)) : state(from);
  }
  async function sell(plan, options, onStep) {
    const settings = await T.config();
    const owner = await ownTon();
    const lib = await bundle();
    const intent = { owner, maxUsd: settings.maxUsd };
    if (plan && plan.holder !== undefined) return sellThroughSwap(lib, plan, intent, options, onStep);
    const audited = auditSell(lib, plan, intent, Date.now());
    if (audited.reason) throw refused(audited);
    const st = await swipeState(plan.from);
    await pendingGate(plan.from, st);
    const fee = feeOf(CU_SALE, st.priority);
    const rent = plan.view && typeof plan.view.rentLamports === 'bigint' && plan.view.rentLamports > 0n ? plan.view.rentLamports : 0n;
    const sold = plan.token === NATIVE ? plan.units : 0n;
    if (st.lamports < fee + rent + sold) throw fail('no_gas', { needs: fee + rent, have: st.lamports });
    if (saleShort(st.lamports, fee + rent, sold) > 0n) throw fail('too_much', { have: st.lamports - fee - rent });
    const signed = await withKey(async (key) => {
      if (key.address !== plan.from) throw fail('relay_refused', { reason: 'owner' });
      const still = auditSell(lib, plan, intent, Date.now());
      if (still.reason) throw refused(still);
      const message = compile(lib, key.address, [...budget(CU_SALE, st.priority), still.instruction], st.blockhash);
      const tx = signMessage(lib, key.privateKey, message);
      pendingWrite(plan.from, { raw: tx.raw, hash: tx.hash, until: st.until, signedAt: Date.now() });
      return tx;
    }, options);
    try {
      if (onStep) onStep('signed', { hash: signed.hash, requestId: audited.requestId });
    } catch (_) { }
    await sendRaw(signed.raw, plan.from);
    return { hash: signed.hash, requestId: audited.requestId };
  }
  async function sellThroughSwap(lib, plan, intent, options, onStep) {
    if (spent.has(plan)) throw fail('relay_refused', { reason: 'holder' });
    const audited = auditSell(lib, plan, intent, Date.now());
    if (audited.reason) throw refused(audited);
    const index = plan.holderIndex;
    const own = intent.owner;
    if (!Number.isSafeInteger(index) || index < 0 || index >= HOLD_LIMIT) throw fail('relay_refused', { reason: 'holder' });
    if (plan.draft === true) {
      await withKey(async (key) => {
        if (key.address !== plan.from) throw fail('relay_refused', { reason: 'owner' });
      }, options);
      throw fail('relay_refused', { reason: aheadAt(own, plan.from, holdLocal(own).n) ? 'stale' : 'holder' });
    }
    const st = await swipeState(plan.from);
    await pendingGate(plan.from, st);
    const built = routeMessage(lib, plan, audited, st.blockhash, st.priority);
    if (!built) throw fail('relay_refused', { reason: 'size' });
    const hold = ataRent(plan.program);
    if (st.lamports < built.fee + hold) throw fail('no_gas', { needs: built.fee + hold, have: st.lamports });
    if (saleShort(st.lamports, built.fee, 0n) > 0n) throw fail('no_gas', { needs: built.fee + RENT_MIN, have: st.lamports });
    if (committed.get(plan) !== index) {
      const kept = await holdCommit(own, index, plan.holder, audited.requestId, plan.token);
      if (kept === 'taken') throw fail('relay_refused', { reason: 'stale' });
      if (kept !== 'kept') throw fail('relay_refused', { reason: 'holder' });
      committed.set(plan, index);
    }
    const signed = await withKey(async (key, keyOwn, more) => {
      if (key.address !== plan.from) throw fail('relay_refused', { reason: 'owner' });
      if (keyOwn !== undefined && keyOwn !== own) throw fail('relay_refused', { reason: 'owner' });
      if (spent.has(plan)) throw fail('relay_refused', { reason: 'holder' });
      const still = auditSell(lib, plan, intent, Date.now());
      if (still.reason) throw refused(still);
      if (!more || typeof more.alt !== 'function') throw fail('relay_refused', { reason: 'holder' });
      const holder = await more.alt(holderPath(index));
      try {
        if (!holder || holder.address !== plan.holder || holder.address === key.address) throw fail('relay_refused', { reason: 'holder' });
        const tx = routeMessage(lib, plan, still, st.blockhash, st.priority);
        if (!tx || tx.signers.length !== 2 || tx.signers[0] !== plan.from || tx.signers[1] !== plan.holder) throw fail('relay_refused', { reason: 'size' });
        const raw = concat(shortvec(2), lib.ed25519.sign(tx.message, key.privateKey), lib.ed25519.sign(tx.message, holder.privateKey), tx.message);
        const out = { raw: btoa(String.fromCharCode(...raw)), hash: lib.base58.encode(raw.slice(1, 65)) };
        spent.add(plan);
        pendingWrite(plan.from, { raw: out.raw, hash: out.hash, until: st.until, signedAt: Date.now() });
        return out;
      } finally {
        if (holder && holder.privateKey) holder.privateKey.fill(0);
      }
    }, options);
    try {
      if (onStep) onStep('signed', { hash: signed.hash, requestId: audited.requestId });
    } catch (_) { }
    await sendRaw(signed.raw, plan.from);
    return { hash: signed.hash, requestId: audited.requestId };
  }

  async function checkAddress(text, token) {
    const typed = typeof text === 'string' ? text.trim() : '';
    if (OTHER_NETWORK.some((re) => re.test(typed))) return { reason: 'network' };
    const lib = await bundle();
    const bytes = keyBytes(lib, typed);
    if (!bytes) return { reason: 'format' };
    if (NEVER_TO.has(typed) || typed === token || !onCurve(lib, bytes)) return { reason: 'contract' };
    const own = await address();
    if (own && typed === own) return { reason: 'self' };
    return { address: typed };
  }
  function auditWithdraw(lib, plan, nowMs) {
    const no = (reason) => ({ reason });
    if (!plan || plan.kind !== 'withdraw' || plan.chain !== CHAIN) return no('plan');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS * 4 || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    if (typeof plan.units !== 'bigint' || plan.units <= 0n || plan.units >= 1n << 64n) return no('amount');
    const to = keyBytes(lib, plan.to);
    if (!to || NEVER_TO.has(plan.to) || plan.to === plan.token || plan.to === plan.from || !onCurve(lib, to)) return no('to');
    if (!keyBytes(lib, plan.from)) return no('owner');
    if (typeof plan.priority !== 'bigint' || plan.priority < 0n || plan.priority > PRIORITY_MAX) return no('gas');
    const native = plan.token === NATIVE;
    let instructions, cu, rent = 0n;
    if (native) {
      if (!plan.toExists && plan.units < RENT_MIN) return no('rent');
      cu = CU_SOL;
      instructions = [{ programId: SYSTEM, keys: [{ pubkey: plan.from, isSigner: true, isWritable: true }, { pubkey: plan.to, isSigner: false, isWritable: true }], data: concat(u32(2), u64(plan.units)) }];
    } else {
      if (!keyBytes(lib, plan.token) || !TOKEN_PROGRAMS.has(plan.program) || !Number.isInteger(plan.decimals) || plan.decimals < 0 || plan.decimals > 36) return no('token');
      cu = CU_TOKEN;
      const source = ataOf(lib, plan.from, plan.token, plan.program);
      const dest = ataOf(lib, plan.to, plan.token, plan.program);
      if (!plan.toAtaExists) rent = ataRent(plan.program);
      instructions = [
        { programId: ATA_PROGRAM, keys: [{ pubkey: plan.from, isSigner: true, isWritable: true }, { pubkey: dest, isSigner: false, isWritable: true }, { pubkey: plan.to, isSigner: false, isWritable: false }, { pubkey: plan.token, isSigner: false, isWritable: false }, { pubkey: SYSTEM, isSigner: false, isWritable: false }, { pubkey: plan.program, isSigner: false, isWritable: false }], data: Uint8Array.of(1) },
        { programId: plan.program, keys: [{ pubkey: source, isSigner: false, isWritable: true }, { pubkey: plan.token, isSigner: false, isWritable: false }, { pubkey: dest, isSigner: false, isWritable: true }, { pubkey: plan.from, isSigner: true, isWritable: false }], data: concat(Uint8Array.of(12), u64(plan.units), Uint8Array.of(plan.decimals)) }
      ];
    }
    return { reason: null, instructions: [...budget(cu, plan.priority), ...instructions], fee: feeOf(cu, plan.priority), rent, native };
  }
  async function quoteWithdraw(input) {
    const opts = input || {};
    if (!tokenOk(opts.token) || typeof opts.units !== 'bigint' || opts.units <= 0n || !(opts.decimals === undefined || decimalsHold(undefined, opts.decimals))) throw fail('bad_intent');
    await ownTon();
    const from = await address();
    if (!from) throw fail('no_sol_address');
    const checked = await checkAddress(opts.to, opts.token);
    if (checked.reason) throw fail('bad_address', { reason: checked.reason });
    const native = opts.token === NATIVE;
    const st = await state(from, '&to=' + encodeURIComponent(checked.address) + (native ? '' : '&mint=' + encodeURIComponent(opts.token)));
    const b = st.body;
    const held = native ? st.lamports : units(b.held);
    if (held === null || typeof b.toExists !== 'boolean' || (!native && (typeof b.toAtaExists !== 'boolean' || !TOKEN_PROGRAMS.has(b.program) || !Number.isInteger(b.decimals)))) throw fail('state_unknown');
    if (b.toExists && (typeof b.toOwner !== 'string' || typeof b.toExecutable !== 'boolean')) throw fail('state_unknown');
    if (b.toExists && (b.toExecutable || b.toOwner !== SYSTEM)) throw fail('bad_address', { reason: 'contract' });
    const decimals = native ? 9 : b.decimals;
    if (opts.decimals !== undefined && opts.decimals !== decimals) throw fail('relay_refused', { reason: 'decimals' });
    const lib = await bundle();
    const toAtaExists = native ? null : (Array.isArray(b.toAccounts) ? b.toAccounts.includes(ataOf(lib, checked.address, opts.token, b.program)) : false);
    const plan = { kind: 'withdraw', chain: CHAIN, token: opts.token, to: checked.address, from, units: opts.units, priority: st.priority, toExists: b.toExists, toAtaExists, program: native ? null : b.program, decimals, at: Date.now() };
    const audited = auditWithdraw(lib, plan, plan.at);
    if (audited.reason === 'rent') throw fail('too_small', { needs: RENT_MIN });
    if (audited.reason) throw fail('relay_refused', { reason: audited.reason });
    if (opts.units > held) throw fail('too_much', { have: held });
    const short = saleShort(st.lamports, audited.fee + audited.rent, native ? opts.units : 0n);
    plan.view = { units: opts.units, to: checked.address, feeLamports: audited.fee, rentLamports: audited.rent, gasWei: audited.fee + audited.rent, native: st.lamports, held, short, maxNative: native ? st.lamports - audited.fee : null, decimals };
    return plan;
  }

  const PENDING_KEY = 'ck-sol-pending:';
  const pendingMemory = {};
  function pendingRead(id) {
    let text = pendingMemory[id] || null;
    if (!text) {
      try { text = localStorage.getItem(PENDING_KEY + id); } catch (_) { }
    }
    try {
      const rec = text ? JSON.parse(text) : null;
      return rec && typeof rec.raw === 'string' && typeof rec.hash === 'string' && Number.isSafeInteger(rec.until) && Number.isSafeInteger(rec.signedAt) ? rec : null;
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
    const landed = await T.api('xchain/sol/status?sig=' + encodeURIComponent(rec.hash)).catch(() => null);
    if ((landed && landed.landed === true) || (st.height > rec.until && Date.now() > rec.signedAt + BLOCKHASH_LIFE_MS)) {
      pendingClear(from);
      return;
    }
    await sendRaw(rec.raw, from, rec.move === true).catch(() => null);
    throw fail('pending', { hash: rec.hash });
  }
  async function sendRaw(raw, from, move) {
    let lastError = null;
    for (let i = 0; i < SEND_TRIES; i++) {
      if (i) await new Promise((resolve) => setTimeout(resolve, SEND_PAUSE_MS * i));
      try {
        await T.api('xchain/sol/send', { body: move ? { raw, move: true } : { raw } });
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
    await pendingGate(plan.from, st);
    const needs = audited.fee + audited.rent + (audited.native ? plan.units : 0n);
    if (st.lamports < needs) throw fail('no_gas', { needs, have: st.lamports });
    if (saleShort(st.lamports, audited.fee + audited.rent, audited.native ? plan.units : 0n) > 0n) {
      if (audited.native) throw fail('too_much', { have: st.lamports - audited.fee });
      throw fail('no_gas', { needs: needs + RENT_MIN, have: st.lamports });
    }
    const signed = await withKey(async (key) => {
      if (key.address !== plan.from) throw fail('relay_refused', { reason: 'owner' });
      const tx = signMessage(lib, key.privateKey, compile(lib, key.address, audited.instructions, st.blockhash));
      pendingWrite(plan.from, { raw: tx.raw, hash: tx.hash, until: st.until, signedAt: Date.now() });
      return tx;
    }, { ...(options || {}), owner: true });
    await sendRaw(signed.raw, plan.from);
    return { hash: signed.hash };
  }

  const SOL_DUST = 1000000n;
  const CU_MOVE = 70000;
  const MOVE_TOKENS_MAX = 8;
  const MOVE_NEED_STEP = 1000000n;
  const MOVE_WAIT_MS = 75000;
  const MOVE_POLL_MS = 1500;
  const MOVE_KEEP = 1300000n;
  const ALT_DONE_LOCAL = 'ck-sol-alt-done:';
  const ALT_RELOOK_MS = 7 * 24 * 3600 * 1000;
  const ALT_STUCK_LOCAL = 'ck-sol-alt-stuck:';
  const ALT_STUCK_MS = 30 * 24 * 3600 * 1000;
  const localGet = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const localSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) { } };
  const localDrop = (key) => { try { localStorage.removeItem(key); } catch (_) { } };
  function stuckRead(address) {
    let rec = null;
    try { rec = JSON.parse(localGet(ALT_STUCK_LOCAL + address) || 'null'); } catch (_) { rec = null; }
    const out = {};
    if (!rec || typeof rec !== 'object') return out;
    const since = Date.now() - ALT_STUCK_MS;
    Object.keys(rec).forEach((mint) => {
      const one = rec[mint];
      if (BASE58.test(mint) && one && typeof one.units === 'string' && /^\d+$/.test(one.units) && Number.isSafeInteger(one.at) && one.at > since) out[mint] = { units: one.units, at: one.at };
    });
    return out;
  }
  function stuckAdd(address, mint, amount) {
    const rec = stuckRead(address);
    if (amount > 0n) rec[mint] = { units: amount.toString(), at: Date.now() };
    else delete rec[mint];
    localSet(ALT_STUCK_LOCAL + address, JSON.stringify(rec));
  }
  const doneRecently = (own) => {
    const at = Number(localGet(ALT_DONE_LOCAL + own));
    return Number.isSafeInteger(at) && at > Date.now() - ALT_RELOOK_MS && at <= Date.now() + 60000;
  };
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const shortMint = (mint) => mint.slice(0, 4) + '…' + mint.slice(-4);
  function knownOf(known) {
    const mints = [], names = new Map();
    (Array.isArray(known) ? known : []).forEach((one) => {
      const mint = typeof one === 'string' ? one : one && one.address;
      if (typeof mint !== 'string' || !BASE58.test(mint) || mints.includes(mint)) return;
      mints.push(mint);
      const sym = one && typeof one === 'object' ? plainName(one.sym, 16) : null;
      if (sym) names.set(mint, sym);
    });
    return { mints: mints.slice(0, 40), names };
  }
  function altRecord() {
    let rec = null;
    try { rec = CK.wallet && typeof CK.wallet.netAlt === 'function' ? CK.wallet.netAlt('sol') : null; } catch (_) { rec = null; }
    if (!rec || typeof rec.sol !== 'string' || !BASE58.test(rec.sol) || !Array.isArray(rec.alts)) return null;
    const alts = rec.alts.filter((one) => one && ALT_PATHS.includes(one.path) && typeof one.address === 'string' && BASE58.test(one.address) && one.address !== rec.sol);
    return { own: rec.own, sol: rec.sol, kind: rec.kind, alts };
  }
  async function altHoldings(alt, known) {
    const k = knownOf(known);
    const seen = await holdingsOf(alt.address, k.mints);
    const stuck = stuckRead(alt.address);
    const tokens = seen.held.filter((one) => one.flagged === false && !(stuck[one.mint] && stuck[one.mint].units === one.units.toString())).map((one) => ({ mint: one.mint, units: one.units, program: one.program, what: one.symbol || k.names.get(one.mint) || shortMint(one.mint) }));
    const stays = seen.held.length - tokens.length;
    const keep = stays > 0 ? MOVE_KEEP : 0n;
    const movable = seen.native > keep ? seen.native - keep : 0n;
    return { path: alt.path, address: alt.address, lamports: seen.native, keep, movable, stays, tokens, any: movable > SOL_DUST || tokens.length > 0 };
  }
  const altView = (seen) => ({ path: seen.path, address: seen.address, sol: (seen.movable > SOL_DUST ? seen.movable : 0n).toString(), tokens: seen.tokens.length });
  const altSeen = new Map();
  const altJobs = new Map();
  async function altsOf(rec, own, launch) {
    const holds = await holderAlts(own, rec.sol, launch).catch(() => []);
    return { alts: [...(rec.kind === 'bip39' ? rec.alts : []), ...holds.filter((one) => !rec.alts.some((alt) => alt.address === one.address))], holds };
  }
  const ORDERS_FILE = 'solOrders.js';
  const ORDER_PATH = /^order:(0|[1-9]\d{0,9})$/;
  const ordersScript = (() => {
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
  let ordersHooked = null;
  let ordersClosed = false;
  if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', () => { ordersClosed = true; }, { once: true });
  }
  function ordersHook(api) {
    if (ordersClosed || ordersHooked || !ordersScript) return false;
    const path = ordersScript.path();
    if (path === null || path !== ordersScript.folder + ORDERS_FILE) return false;
    const fns = api && typeof api === 'object' ? { endedFor: api.endedFor, endedLook: api.endedLook, endedSweep: api.endedSweep } : null;
    if (!fns || Object.keys(fns).some((name) => typeof fns[name] !== 'function')) return false;
    ordersHooked = Object.freeze(fns);
    return true;
  }
  const ordersApi = () => ordersHooked;
  async function endedOrders(own) {
    const api = ordersApi();
    if (!api) return [];
    try {
      const list = await api.endedFor(own);
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }
  function altLook(options) {
    const opts = options || {};
    const wallet = T.wallet;
    const own = wallet && wallet.address;
    if (!own || wallet.readOnly || (opts.wallet && opts.wallet !== own)) return Promise.resolve(null);
    if (opts.launch && altSeen.has(own)) return Promise.resolve(altSeen.get(own));
    if (altJobs.has(own)) return altJobs.get(own);
    const job = (async () => {
      if (CK.wallet && typeof CK.wallet.othersReady === 'function') await CK.wallet.othersReady().catch(() => null);
      let rec = altRecord();
      if (!rec && CK.wallet && typeof CK.wallet.netAltFill === 'function') {
        await CK.wallet.netAltFill('sol').catch(() => null);
        rec = altRecord();
      }
      if (!rec || (rec.own && rec.own !== own)) return null;
      const { alts, holds } = await altsOf(rec, own, opts.launch);
      const ended = await endedOrders(own);
      if (!alts.length && !ended.length) return null;
      if (opts.launch && doneRecently(own) && !holds.length && !ended.length) return null;
      const found = [], unknown = [];
      let stays = false;
      for (const alt of alts) {
        try {
          const seen = await altHoldings(alt, opts.known);
          if (seen.stays) stays = true;
          if (seen.any) found.push(altView(seen));
        } catch (err) {
          console.warn('sol: another address was not read', err && (err.code || err.message));
          unknown.push(alt.path);
        }
      }
      if (ended.length) {
        const seen = await ordersApi().endedLook(ended).catch(() => null);
        if (!seen) ended.forEach((one) => unknown.push(one.path));
        else {
          (Array.isArray(seen.found) ? seen.found : []).forEach((one) => found.push(one));
          (Array.isArray(seen.unknown) ? seen.unknown : []).forEach((path) => unknown.push(path));
        }
      }
      const result = { found, unknown, empty: !found.length && !unknown.length };
      altSeen.set(own, result);
      if (result.empty && !stays) localSet(ALT_DONE_LOCAL + own, String(Date.now()));
      else localDrop(ALT_DONE_LOCAL + own);
      return result;
    })().finally(() => altJobs.delete(own));
    altJobs.set(own, job);
    return job;
  }
  const altLast = () => (T.wallet && T.wallet.address ? altSeen.get(T.wallet.address) || null : null);

  async function altPlan(lib, seen, to, left) {
    const path = seen.path;
    const st = await state(seen.address, '&to=' + encodeURIComponent(to));
    if (typeof st.body.pending === 'string' && st.body.pending && !(pendingRead(seen.address) || {}).hash) {
      left.push({ what: 'SOL', why: 'pending', path });
      return null;
    }
    const tokens = [];
    let keep = seen.stays > 0;
    for (const one of seen.tokens.slice(0, MOVE_TOKENS_MAX)) {
      let b;
      try {
        b = (await state(seen.address, '&to=' + encodeURIComponent(to) + '&mint=' + encodeURIComponent(one.mint))).body;
      } catch (_) {
        left.push({ what: one.what, why: 'unknown', path });
        keep = true;
        continue;
      }
      if (!TOKEN_PROGRAMS.has(b.program) || !Number.isInteger(b.decimals) || b.decimals < 0 || b.decimals > 36 || b.program !== one.program) {
        left.push({ what: one.what, why: 'unknown', path });
        keep = true;
        continue;
      }
      const sourceAta = ataOf(lib, seen.address, one.mint, b.program);
      const destAta = ataOf(lib, to, one.mint, b.program);
      const accounts = Array.isArray(b.heldAccounts) ? b.heldAccounts.filter((a) => a && typeof a.address === 'string' && units(a.units) !== null) : null;
      const inAta = accounts ? accounts.filter((a) => a.address === sourceAta).reduce((sum, a) => sum + units(a.units), 0n) : units(b.held) || 0n;
      const elsewhere = !!accounts && accounts.some((a) => a.address !== sourceAta && units(a.units) > 0n);
      const valid = inAta > 0n && inAta < 1n << 64n;
      if (elsewhere) {
        left.push({ what: one.what, why: 'token', path });
        stuckAdd(seen.address, one.mint, one.units - (valid ? inAta : 0n));
        keep = true;
      }
      if (!valid) {
        if (!elsewhere) {
          left.push({ what: one.what, why: 'unknown', path });
          keep = true;
        }
        continue;
      }
      const destExists = Array.isArray(b.toAccounts) && b.toAccounts.includes(destAta);
      const close = b.program === TOKEN_PROGRAM && !!accounts;
      tokens.push({ what: one.what, mint: one.mint, program: b.program, decimals: b.decimals, units: inAta, total: one.units, destExists, close, cost: feeOf(CU_MOVE, st.priority) + (destExists ? 0n : ataRent(b.program)) });
    }
    seen.tokens.slice(MOVE_TOKENS_MAX).forEach((one) => left.push({ what: one.what, why: 'later', path }));
    const kept = keep ? MOVE_KEEP : 0n;
    let lamports = st.lamports;
    const moving = [], stays = [];
    tokens.forEach((t) => {
      if (lamports >= t.cost + RENT_MIN) {
        moving.push(t);
        lamports -= t.cost;
      } else stays.push(t);
    });
    stays.forEach((t) => left.push({ what: t.what, why: 'gas', path }));
    const toExists = st.body.toExists === true;
    const sweepFee = feeOf(CU_SOL, st.priority);
    let need = 0n;
    if (stays.length) {
      const short = tokens.reduce((sum, t) => sum + t.cost, 0n) + (keep ? MOVE_KEEP : RENT_MIN) + sweepFee + (toExists ? 0n : RENT_MIN) - st.lamports;
      need = short > 0n ? ((short + MOVE_NEED_STEP - 1n) / MOVE_NEED_STEP) * MOVE_NEED_STEP : MOVE_NEED_STEP;
    }
    const rest = lamports - sweepFee - kept;
    const later = left.some((one) => one.path === path && one.why === 'later');
    const sweep = !stays.length && !later && (moving.length > 0 || (st.lamports - kept > SOL_DUST && rest > 0n && (toExists || rest >= RENT_MIN)));
    if (!stays.length && !sweep && lamports - kept > SOL_DUST) left.push({ what: 'SOL', why: 'later', path });
    if (!moving.length && !sweep) return need ? { path, address: seen.address, tokens: [], sweep: false, need, keep } : null;
    return { path, address: seen.address, tokens: moving, sweep, need, keep };
  }

  function moveInstructions(lib, e) {
    if (e.kind === 'sol') return [{ programId: SYSTEM, keys: [{ pubkey: e.from, isSigner: true, isWritable: true }, { pubkey: e.to, isSigner: false, isWritable: true }], data: concat(u32(2), u64(e.amount)) }];
    const t = e.token;
    const source = ataOf(lib, e.from, t.mint, t.program);
    const dest = ataOf(lib, e.to, t.mint, t.program);
    const out = [
      { programId: ATA_PROGRAM, keys: [{ pubkey: e.from, isSigner: true, isWritable: true }, { pubkey: dest, isSigner: false, isWritable: true }, { pubkey: e.to, isSigner: false, isWritable: false }, { pubkey: t.mint, isSigner: false, isWritable: false }, { pubkey: SYSTEM, isSigner: false, isWritable: false }, { pubkey: t.program, isSigner: false, isWritable: false }], data: Uint8Array.of(1) },
      { programId: t.program, keys: [{ pubkey: source, isSigner: false, isWritable: true }, { pubkey: t.mint, isSigner: false, isWritable: false }, { pubkey: dest, isSigner: false, isWritable: true }, { pubkey: e.from, isSigner: true, isWritable: false }], data: concat(Uint8Array.of(12), u64(t.units), Uint8Array.of(t.decimals)) }
    ];
    if (t.close) out.push({ programId: TOKEN_PROGRAM, keys: [{ pubkey: source, isSigner: false, isWritable: true }, { pubkey: e.from, isSigner: false, isWritable: true }, { pubkey: e.from, isSigner: true, isWritable: false }], data: Uint8Array.of(9) });
    return out;
  }
  const moveCu = (e) => (e.kind === 'sol' ? CU_SOL : CU_MOVE);
  function signMove(lib, privateKey, e, blockhash) {
    return signMessage(lib, privateKey, compile(lib, e.from, [...budget(moveCu(e), e.priority), ...moveInstructions(lib, e)], blockhash));
  }
  function readShortvec(bytes, at) {
    let value = 0, shift = 0;
    for (;;) {
      if (at >= bytes.length || shift > 14) return null;
      const b = bytes[at++];
      value |= (b & 0x7f) << shift;
      if (!(b & 0x80)) return { value, at };
      shift += 7;
    }
  }
  function readTx(lib, raw) {
    let bytes;
    try {
      bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    } catch (_) {
      return null;
    }
    const sigs = readShortvec(bytes, 0);
    if (!sigs || sigs.value !== 1 || bytes.length < sigs.at + 64 + 3) return null;
    const signature = bytes.slice(sigs.at, sigs.at + 64);
    const message = bytes.slice(sigs.at + 64);
    if (message[0] & 0x80) return null;
    const [nSig, roSigned, roUnsigned] = message;
    const count = readShortvec(message, 3);
    if (!count || message.length < count.at + count.value * 32 + 32) return null;
    const n = count.value;
    let at = count.at;
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(lib.base58.encode(message.slice(at + i * 32, at + i * 32 + 32)));
    at += n * 32;
    const blockhash = lib.base58.encode(message.slice(at, at + 32));
    at += 32;
    const ixCount = readShortvec(message, at);
    if (!ixCount) return null;
    at = ixCount.at;
    const ixs = [];
    for (let i = 0; i < ixCount.value; i++) {
      if (at >= message.length) return null;
      const program = message[at++];
      const a = readShortvec(message, at);
      if (!a || a.at + a.value > message.length) return null;
      const indexes = Array.from(message.slice(a.at, a.at + a.value));
      const d = readShortvec(message, a.at + a.value);
      if (!d || d.at + d.value > message.length) return null;
      if (program >= n || indexes.some((x) => x >= n)) return null;
      ixs.push({ program: keys[program], accounts: indexes.map((x) => keys[x]), data: message.slice(d.at, d.at + d.value) });
      at = d.at + d.value;
    }
    if (at !== message.length || nSig > n || roSigned > nSig || roUnsigned > n - nSig) return null;
    const metas = keys.map((key, i) => ({ key, signer: i < nSig, writable: i < nSig ? i < nSig - roSigned : i < n - roUnsigned }));
    return { signature, message, metas, blockhash, ixs, nSig };
  }
  const readU32 = (data, at) => (data[at] | (data[at + 1] << 8) | (data[at + 2] << 16) | (data[at + 3] << 24)) >>> 0;
  const readU64 = (data, at) => {
    let v = 0n;
    for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(data[at + i]);
    return v;
  };
  const sameList = (got, want) => got.length === want.length && got.every((key, i) => key === want[i]);
  function auditMove(lib, raw, expect) {
    const e = expect || {};
    if (!keyBytes(lib, e.from) || !keyBytes(lib, e.to) || e.from === e.to) return 'plan';
    const tx = readTx(lib, raw);
    if (!tx) return 'shape';
    if (tx.nSig !== 1 || tx.metas[0].key !== e.from || !tx.metas[0].writable) return 'signer';
    if (new Set(tx.metas.map((m) => m.key)).size !== tx.metas.length) return 'keys';
    let verified = false;
    try { verified = lib.ed25519.verify(tx.signature, tx.message, lib.base58.decode(e.from)); } catch (_) { verified = false; }
    if (!verified) return 'signature';
    if (typeof e.blockhash === 'string' && tx.blockhash !== e.blockhash) return 'blockhash';
    if (tx.ixs.length < 3) return 'count';
    const [limit, price, ...rest] = tx.ixs;
    if (limit.program !== COMPUTE_BUDGET || limit.accounts.length || limit.data.length !== 5 || limit.data[0] !== 2 || readU32(limit.data, 1) !== moveCu(e)) return 'budget';
    if (price.program !== COMPUTE_BUDGET || price.accounts.length || price.data.length !== 9 || price.data[0] !== 3 || readU64(price.data, 1) > PRIORITY_MAX) return 'budget';
    let writable;
    if (e.kind === 'sol') {
      if (typeof e.amount !== 'bigint' || e.amount <= 0n || e.amount >= 1n << 64n) return 'plan';
      if (rest.length !== 1) return 'count';
      const ix = rest[0];
      if (ix.program !== SYSTEM || !sameList(ix.accounts, [e.from, e.to])) return 'to';
      if (ix.data.length !== 12 || readU32(ix.data, 0) !== 2 || readU64(ix.data, 4) !== e.amount) return 'amount';
      writable = new Set([e.from, e.to]);
    } else if (e.kind === 'token') {
      const t = e.token;
      if (!t || !TOKEN_PROGRAMS.has(t.program) || !keyBytes(lib, t.mint) || PROGRAMS.has(t.mint) || typeof t.units !== 'bigint' || t.units <= 0n || t.units >= 1n << 64n || !Number.isInteger(t.decimals)) return 'plan';
      const source = ataOf(lib, e.from, t.mint, t.program);
      const dest = ataOf(lib, e.to, t.mint, t.program);
      const closing = rest.length === 3;
      if (rest.length !== 2 && !(closing && t.close === true && t.program === TOKEN_PROGRAM)) return 'count';
      const [create, move, close] = rest;
      if (create.program !== ATA_PROGRAM || !sameList(create.accounts, [e.from, dest, e.to, t.mint, SYSTEM, t.program]) || create.data.length !== 1 || create.data[0] !== 1) return 'create';
      if (move.program !== t.program || !sameList(move.accounts, [source, t.mint, dest, e.from])) return 'to';
      if (move.data.length !== 10 || move.data[0] !== 12 || readU64(move.data, 1) !== t.units || move.data[9] !== t.decimals) return 'amount';
      if (closing && (close.program !== TOKEN_PROGRAM || !sameList(close.accounts, [source, e.from, e.from]) || close.data.length !== 1 || close.data[0] !== 9)) return 'close';
      writable = new Set([e.from, source, dest]);
    } else return 'plan';
    const used = new Set([e.from, COMPUTE_BUDGET]);
    rest.forEach((ix) => {
      used.add(ix.program);
      ix.accounts.forEach((key) => used.add(key));
    });
    if (used.size !== tx.metas.length || tx.metas.some((m) => !used.has(m.key))) return 'keys';
    if (tx.metas.some((m) => m.writable !== writable.has(m.key))) return 'writable';
    return null;
  }
  async function landing(hash) {
    const until = Date.now() + MOVE_WAIT_MS;
    for (let i = 0; ; i++) {
      if (i) await pause(MOVE_POLL_MS);
      const seen = await T.api('xchain/sol/status?sig=' + encodeURIComponent(hash)).catch(() => null);
      if (seen && seen.failed === true) return 'failed';
      if (seen && seen.landed === true) return 'landed';
      if (Date.now() > until) return 'wait';
    }
  }
  async function runAlt(lib, plan, source, to, out, tick) {
    const from = plan.address;
    const path = plan.path;
    const one = async (e, st) => {
      const tx = signMove(lib, source.privateKey, e, st.blockhash);
      const wrong = auditMove(lib, tx.raw, { ...e, blockhash: st.blockhash });
      if (wrong) throw fail('bad_intent', { reason: wrong });
      pendingWrite(from, { raw: tx.raw, hash: tx.hash, until: st.until, signedAt: Date.now(), move: true });
      try {
        await sendRaw(tx.raw, from, true);
      } catch (err) {
        return err && err.code === 'send_rejected' ? 'refused' : 'wait';
      }
      tick('sent');
      return landing(tx.hash);
    };
    const fresh = async (extra) => {
      const st = await state(from, extra);
      await pendingGate(from, st);
      return st;
    };
    let going = true, short = false, keep = plan.keep === true;
    const shortNow = () => {
      short = true;
      if (!(plan.need > 0n)) plan.need = MOVE_NEED_STEP;
    };
    for (const t of plan.tokens) {
      if (!going) {
        out.left.push({ what: t.what, why: 'wait', path });
        continue;
      }
      let st;
      try {
        st = await fresh();
      } catch (err) {
        going = false;
        out.left.push({ what: t.what, why: err && err.code === 'pending' ? 'wait' : 'unknown', path });
        continue;
      }
      const cost = feeOf(CU_MOVE, st.priority) + (t.destExists ? 0n : ataRent(t.program));
      if (st.lamports < cost + RENT_MIN) {
        shortNow();
        out.left.push({ what: t.what, why: 'gas', path });
        continue;
      }
      let r = await one({ kind: 'token', from, to, priority: st.priority, token: t }, st);
      if (r === 'refused') {
        try {
          const again = await fresh();
          r = await one({ kind: 'token', from, to, priority: again.priority, token: t }, again);
        } catch (_) { }
      }
      if (r === 'landed') {
        out.moved.push(t.what);
        tick('landed');
      } else if (r === 'refused' || r === 'failed') {
        out.left.push({ what: t.what, why: 'token', path });
        stuckAdd(from, t.mint, typeof t.total === 'bigint' ? t.total : t.units);
        keep = true;
      } else {
        going = false;
        out.left.push({ what: t.what, why: 'wait', path });
      }
    }
    if (keep) out.kept.add(path);
    if (!plan.sweep) return;
    if (!going || short) {
      out.left.push({ what: 'SOL', why: going ? 'gas' : 'wait', path });
      return;
    }
    let st;
    try {
      st = await fresh('&to=' + encodeURIComponent(to));
    } catch (err) {
      out.left.push({ what: 'SOL', why: err && err.code === 'pending' ? 'wait' : 'unknown', path });
      return;
    }
    const kept = keep ? MOVE_KEEP : 0n;
    const amount = st.lamports - feeOf(CU_SOL, st.priority) - kept;
    if (amount <= 0n || (st.body.toExists !== true && amount < RENT_MIN)) {
      if (st.lamports - kept > SOL_DUST) out.left.push({ what: 'SOL', why: 'later', path });
      return;
    }
    const r = await one({ kind: 'sol', from, to, priority: st.priority, amount }, st);
    if (r === 'landed') {
      out.moved.push('SOL');
      tick('landed');
    } else out.left.push({ what: 'SOL', why: r === 'wait' ? 'wait' : 'unknown', path });
  }
  let altMoving = false;
  async function moveAlt(options, onStep) {
    if (altMoving) throw fail('busy');
    altMoving = true;
    const step = (name, extra) => { try { if (onStep) onStep(name, extra); } catch (_) { } };
    try {
      const opts = options || {};
      const wallet = T.wallet;
      const own = wallet && wallet.address;
      if (!own) throw fail('no_wallet');
      if (wallet.readOnly) throw fail('read_only');
      if (opts.wallet && opts.wallet !== own) throw fail('wallet_changed');
      const rec = altRecord();
      if (!rec || (rec.own && rec.own !== own)) throw fail('no_sol_address');
      const { alts } = await altsOf(rec, own, false);
      const ended = await endedOrders(own);
      if (!alts.length && !ended.length) throw fail('no_sol_address');
      const to = rec.sol;
      const lib = await bundle();
      const left = [], plans = [];
      for (const alt of alts) {
        let seen;
        try {
          seen = await altHoldings(alt, opts.known);
        } catch (_) {
          left.push({ what: 'SOL', why: 'unknown', path: alt.path });
          continue;
        }
        if (!seen.any) continue;
        try {
          const plan = await altPlan(lib, seen, to, left);
          if (plan) plans.push(plan);
        } catch (_) {
          left.push({ what: 'SOL', why: 'unknown', path: alt.path });
        }
      }
      const gasOf = () => plans.filter((plan) => plan.need > 0n).map((plan) => ({ path: plan.path, address: plan.address, need: plan.need.toString() }));
      const after = async () => {
        altSeen.delete(own);
        const seen = await altLook({ known: opts.known }).catch(() => null);
        return !!seen && seen.empty;
      };
      const work = plans.filter((plan) => plan.tokens.length || plan.sweep);
      if (!work.length && !ended.length) return { moved: [], left, empty: await after(), gas: gasOf(), kept: [] };
      const of = work.reduce((sum, plan) => sum + plan.tokens.length + (plan.sweep ? 1 : 0), 0) + ended.length;
      let done = 0;
      const out = { moved: [], left, kept: new Set() };
      await withKey(async (key, keyOwn, more) => {
        if (keyOwn !== undefined && keyOwn !== own) throw fail('wallet_changed');
        if (key.address !== to) throw fail('address_mismatch');
        if (!more || typeof more.alt !== 'function') throw fail('bad_intent', { reason: 'key' });
        step('signed', { done, of });
        const tick = (name) => {
          if (name === 'landed') done += 1;
          step(name, { done, of });
        };
        for (let i = 0; i < work.length; i++) {
          const plan = work[i];
          try {
            const source = await more.alt(plan.path);
            if (source.address !== plan.address) throw fail('address_mismatch');
            await runAlt(lib, plan, source, to, out, tick);
          } catch (err) {
            if (!out.moved.length) throw err;
            console.warn('sol: the move stopped part way', err && (err.code || err.message));
            work.slice(i).forEach((rest) => left.push({ what: 'SOL', why: 'unknown', path: rest.path }));
            ended.forEach((rest) => left.push({ what: 'SOL', why: 'unknown', path: rest.path }));
            return;
          }
        }
        if (ended.length) {
          const paths = new Map(ended.map((one) => [one && one.path, one && one.n]));
          const keyFor = async (path) => {
            if (typeof path !== 'string' || !ORDER_PATH.test(path) || !paths.has(path)) throw fail('bad_intent');
            return more.alt(path);
          };
          const drop = async (n) => {
            if (!Number.isInteger(n) || paths.get('order:' + n) !== n || typeof more.orderDrop !== 'function') return false;
            return more.orderDrop(n);
          };
          try {
            await ordersApi().endedSweep(Object.freeze({ lib, keyFor, drop, to, own, list: ended, out, tick }));
          } catch (err) {
            if (!out.moved.length) throw err;
            console.warn('sol: the ended stops were not all cleaned', err && (err.code || err.message));
            ended.forEach((rest) => left.push({ what: 'SOL', why: 'unknown', path: rest.path }));
          }
        }
      }, { password: opts.password, wallet: own });
      return { moved: Array.from(new Set(out.moved)), left, empty: await after(), gas: gasOf(), kept: Array.from(out.kept) };
    } finally {
      altMoving = false;
    }
  }

  CK.sol = {
    chain: CHAIN,
    native: NATIVE,
    bundle,
    keyOf,
    deriveAddress,
    altAddresses,
    altPaths: ALT_PATHS,
    holderAddresses,
    holderFill,
    holderShort,
    address,
    ensureAddress,
    balances,
    quoteBuy,
    quoteGas,
    buy,
    quoteSell,
    warmSell,
    sell,
    checkAddress,
    quoteWithdraw,
    withdraw,
    altLook,
    altLast,
    moveAlt,
    auditMove,
    signMove,
    auditBuy,
    auditSell,
    auditWithdraw,
    ataOf,
    compile,
    parts: Object.freeze({ concat, shortvec, readShortvec, u32, u64, readU32, readU64, hexBytes, bytesHex, keyBytes, onCurve, pdaOf, ataOf, ataRent, compile, compileV0, budget, feeOf, readTx, state, holdingsOf, landing, RENT_MIN, ATA_RENT, ATA_RENT_2022, SIG_FEE, PRIORITY_MAX, CU_MAX, SOL_TX_MAX }),
    ordersHook,
    topupUsd: 1,
    gasLow: (lamports) => typeof lamports === 'bigint' && lamports < ATA_RENT + RENT_MIN,
    pins: () => ({ program: RELAY_PROGRAM, vault: RELAY_VAULT, config: RELAY_CONFIG, depositoryRaw: DEPOSITORY_RAW, forwarder: FORWARDER_PROGRAM, forwarderAccount: FORWARDER, jupiter: JUPITER, relayTable: RELAY_TABLE, relayTableKeys: RELAY_TABLE_KEYS })
  };
  Object.defineProperty(CK, 'sol', { value: Object.freeze(CK.sol), writable: false, configurable: false, enumerable: true });
})();
