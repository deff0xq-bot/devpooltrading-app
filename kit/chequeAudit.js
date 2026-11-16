(function() {
  "use strict";
  const CK = window.CK;
  const GAS_GRAM = 1500000n;
  const GAS_USDT = 65000000n;
  const CREATE_USDT_ATTACH = 115000000n;
  const CLAIM_ATTACH = 10000000n;
  const FLOOR_USDT = 11200000n;
  const FLOOR_GRAM = 1500000n;
  const MIN_GRAM = 10000000n;
  const MIN_USDT = 100000n;
  const GAS_JETTON = 100000000n;
  const CREATE_JETTON_ATTACH = 50000000n;
  const JETTON_ATTACH = 50000000n;
  const FLOOR_JETTON = 60000000n;
  const MIN_JETTON = 1n;
  const MULTI_MIN = 2;
  const MULTI_MAX = 100;
  const FLOOR = Object.freeze({ gram: FLOOR_GRAM, usdt: FLOOR_USDT, jetton: FLOOR_JETTON });
  const SIGN_VALID_S = 600;
  const REFUND_GRACE_S = 30 * 86400;
  const EXPIRY_DAYS = Object.freeze([1, 7, 30]);
  const OPEN_MAX = 200;
  const CLOUD_MAX = 250;
  const PENDING_MAX = 3;
  const NOTE_MAX = 120;
  const WALLET_ID = 2147483409;
  const USDT = "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe";
  const BOT = "DevpoolTrading_bot";
  const LINK_BASE = "https://t.me/" + BOT + "?startapp=";
  const OP_SIGNED_EXTERNAL = 1936287598;
  const OP_SEND_MSG = 247711853;
  const OP_JETTON_TRANSFER = 260734629;
  const SIGNATURE_BITS = 512;
  const MODE_SWEEP = 130;
  const MODE_PAY = 3;
  const RAW = /^0:[0-9a-f]{64}$/;
  const REF = /^[a-z0-9]{8}$/;
  const CODE = /^k_([A-Za-z0-9_-]{43})(?:-r([a-z0-9]{8}))?$/;
  const LAST = "AEIMQUYcgkosw048";
  const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const fromB64u = (text) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/") + "="), (c) => c.charCodeAt(0));
  const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  function parseLink(text) {
    if (typeof text !== "string" || text.length > 512) return null;
    let code = text.trim();
    const at = code.indexOf("startapp=");
    if (at >= 0) {
      if (!/^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}(\/[A-Za-z0-9_]{1,64})?\?startapp=/.test(code)) return null;
      code = code.slice(at + "startapp=".length);
      const end = code.search(/[&#]/);
      if (end >= 0) code = code.slice(0, end);
    }
    const m = CODE.exec(code);
    if (!m || LAST.indexOf(m[1][42]) < 0) return null;
    const k = fromB64u(m[1]);
    if (k.length !== 32) return null;
    return { k, ref: m[2] || null };
  }
  function startCode(k, ref) {
    if (!ArrayBuffer.isView(k) || k.length !== 32) throw new Error("bad_key");
    return "k_" + b64u(k) + (typeof ref === "string" && REF.test(ref) ? "-r" + ref : "");
  }
  const formatLink = (k, ref) => LINK_BASE + startCode(k, ref);
  async function lidOf(k) {
    const key = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("devpool-cheque-lookup-v1"))));
  }
  const SALT = /^[0-9a-f]{64}$/;
  async function slotKeyOf(m, i, salt) {
    if (!ArrayBuffer.isView(m) || m.length !== 32 || !Number.isInteger(i) || i < 0 || i >= MULTI_MAX || typeof salt !== "string" || !SALT.test(salt)) throw new Error("bad_slot");
    const key = await crypto.subtle.importKey("raw", m, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("devpool-cheque-slot-v1\n" + i + "\n" + salt)));
  }
  const big = (v) => {
    try {
      return typeof v === "bigint" ? v : v === null || v === void 0 || v === "" ? null : BigInt(v);
    } catch (_) {
      return null;
    }
  };
  function classify(chain, record, nowS) {
    if (!chain || typeof chain !== "object" || !chain.sources || !Number.isInteger(chain.seqno) || chain.seqno < 0) return "unknown";
    const gram = big(chain.gram), jet = big(chain.jetton) || 0n;
    if (gram === null) return "unknown";
    const asset = record ? record.asset : jet > 0n ? "usdt" : "gram";
    if (!FLOOR[asset]) return "unknown";
    const usdt = asset !== "gram";
    const units = record ? big(record.units) : usdt ? 1n : MIN_GRAM;
    if (units === null) return "unknown";
    const floor = FLOOR[asset];
    let name;
    if (chain.seqno === 0) {
      const there = usdt ? jet >= units : gram >= units + GAS_GRAM;
      name = !there ? "pending" : gram >= floor ? "open" : "short";
    } else {
      const there = usdt ? jet > 0n : gram >= FLOOR_GRAM;
      if (there) name = gram >= floor ? "open" : "short";
      else if (chain.byCreator === true || !!record && typeof chain.to === "string" && chain.to === record.wallet) name = "returned";
      else name = typeof chain.to === "string" ? "claimed" : "unknown";
    }
    if ((name === "open" || name === "short") && record && Number.isInteger(record.expiresAt) && nowS > record.expiresAt) return "expired";
    return name;
  }
  const transferBody = (lib, { units, dest, response, forward }) => lib.beginCell().storeUint(OP_JETTON_TRANSFER, 32).storeUint(0, 64).storeCoins(units).storeAddress(lib.Address.parseRaw(dest)).storeAddress(lib.Address.parseRaw(response)).storeBit(0).storeCoins(forward).storeBit(0).endCell();
  function expectFunding(lib, { asset, units, cheque, owner, ownWallet }) {
    if (asset === "jetton") {
      if (typeof ownWallet !== "string" || !RAW.test(ownWallet)) throw new Error("jetton_wallet");
      return [
        { to: ownWallet, value: CREATE_JETTON_ATTACH, bounce: true, mode: MODE_PAY, jetton: { units, dest: cheque, response: owner, forward: 0n } },
        { to: cheque, value: GAS_JETTON, bounce: false, mode: MODE_PAY, jetton: null }
      ];
    }
    if (asset === "usdt") return [{ to: CK.swapAudit.jettonWalletOf(lib, USDT, owner), value: CREATE_USDT_ATTACH, bounce: true, mode: MODE_PAY, jetton: { units, dest: cheque, response: owner, forward: GAS_USDT } }];
    return [{ to: cheque, value: units + GAS_GRAM, bounce: false, mode: MODE_PAY, jetton: null }];
  }
  function expectSweep(lib, { asset, cheque, to, jettonUnits, jettonWallet }) {
    const sweep = { to, value: 0n, bounce: false, mode: MODE_SWEEP, jetton: null };
    if (asset === "jetton") {
      if (typeof jettonWallet !== "string" || !RAW.test(jettonWallet)) throw new Error("jetton_wallet");
      return [{ to: jettonWallet, value: JETTON_ATTACH, bounce: true, mode: MODE_PAY, jetton: { units: jettonUnits, dest: to, response: to, forward: 1n } }, sweep];
    }
    if (asset !== "usdt") return [sweep];
    return [{ to: CK.swapAudit.jettonWalletOf(lib, USDT, cheque), value: CLAIM_ATTACH, bounce: true, mode: MODE_PAY, jetton: { units: jettonUnits, dest: to, response: to, forward: 1n } }, sweep];
  }
  function sweepActions(lib, o) {
    return expectSweep(lib, o).map((a) => ({
      type: "sendMsg",
      mode: a.mode === MODE_SWEEP ? MODE_SWEEP : 1,
      outMsg: lib.internal({ to: lib.Address.parseRaw(a.to), value: a.value, bounce: a.bounce, body: a.jetton ? transferBody(lib, a.jetton) : void 0 })
    }));
  }
  function readJetton(lib, body) {
    const s = body.beginParse();
    if (s.loadUint(32) !== OP_JETTON_TRANSFER) return null;
    if (s.loadUintBig(64) !== 0n) return null;
    const units = s.loadCoins();
    const dest = s.loadAddress().toRawString();
    const response = s.loadAddress().toRawString();
    if (s.loadBit()) return null;
    const forward = s.loadCoins();
    if (s.loadBit()) return null;
    if (s.remainingBits || s.remainingRefs) return null;
    return { units, dest, response, forward };
  }
  function readAction(lib, a, want) {
    const m = lib.loadMessageRelaxed(a.loadRef().beginParse());
    if (m.info.type !== "internal" || m.init) return "message";
    const other = m.info.value.other;
    if (other && other.size) return "currency";
    if (m.info.dest.toRawString() !== want.to) return "to";
    if (m.info.value.coins !== want.value) return "value";
    if (m.info.bounce !== want.bounce) return "bounce";
    const body = m.body;
    if (!want.jetton) return body.bits.length || body.refs.length ? "body" : null;
    const j = readJetton(lib, body);
    if (!j) return "body";
    if (j.units !== want.jetton.units) return "jetton_units";
    if (j.dest !== want.jetton.dest || j.response !== want.jetton.response) return "jetton_to";
    if (j.forward !== want.jetton.forward) return "forward";
    return null;
  }
  function audit(lib, boc, expected) {
    try {
      const root = lib.Cell.fromBase64(boc);
      const msg = lib.loadMessage(root.beginParse());
      if (msg.info.type !== "external-in") return "external";
      if (msg.info.dest.toRawString() !== expected.address) return "dest";
      const pk = typeof expected.publicKey === "string" ? Uint8Array.from(expected.publicKey.match(/../g), (h) => parseInt(h, 16)) : expected.publicKey;
      const contract = lib.WalletContractV5R1.create({ workChain: 0, publicKey: lib.Buffer ? lib.Buffer.from(pk) : pk });
      if (contract.address.toRawString() !== expected.address) return "dest";
      if (expected.init) {
        if (!msg.init || !msg.init.code || !msg.init.data || hex(msg.init.code.hash()) !== hex(contract.init.code.hash()) || hex(msg.init.data.hash()) !== hex(contract.init.data.hash())) return "init";
        if (msg.init.splitDepth !== void 0 && msg.init.splitDepth !== null) return "init";
        if (msg.init.special) return "init";
        if (msg.init.libraries && msg.init.libraries.size) return "init";
      } else if (msg.init) return "init";
      const s = msg.body.beginParse();
      if (s.loadUint(32) !== OP_SIGNED_EXTERNAL) return "op";
      if (s.loadUint(32) !== WALLET_ID) return "wallet_id";
      const validUntil = s.loadUint(32);
      if (validUntil !== expected.validUntil) return "valid_until";
      const seqno = s.loadUint(32);
      if (seqno !== expected.seqno) return "seqno";
      const list = s.loadMaybeRef();
      if (s.loadBit()) return "extended";
      if (s.remainingBits !== SIGNATURE_BITS || s.remainingRefs) return "shape";
      const signature = s.loadBuffer(64);
      const signed = lib.beginCell().storeUint(OP_SIGNED_EXTERNAL, 32).storeUint(WALLET_ID, 32).storeUint(validUntil, 32).storeUint(seqno, 32).storeMaybeRef(list).storeBit(0).endCell();
      if (!lib.signVerify(signed.hash(), signature, lib.Buffer ? lib.Buffer.from(pk) : pk)) return "signature";
      const actions = [];
      let cell = list;
      while (cell) {
        const a = cell.beginParse();
        if (!a.remainingBits && !a.remainingRefs) break;
        if (actions.length > expected.actions.length) return "count";
        const prev = a.loadRef();
        if (a.loadUint(32) !== OP_SEND_MSG) return "action";
        const mode = a.loadUint(8);
        actions.unshift({ a, mode });
        cell = prev;
      }
      if (actions.length !== expected.actions.length) return "count";
      for (let i = 0; i < actions.length; i++) {
        const want = expected.actions[i];
        if (actions[i].mode !== want.mode) return "mode";
        const wrong = readAction(lib, actions[i].a, want);
        if (wrong) return wrong;
        if (actions[i].a.remainingBits || actions[i].a.remainingRefs) return "shape";
      }
      return null;
    } catch (_) {
      return "shape";
    }
  }
  CK.chequeAudit = {
    parseLink,
    formatLink,
    startCode,
    lidOf,
    slotKeyOf,
    classify,
    GAS_JETTON,
    CREATE_JETTON_ATTACH,
    JETTON_ATTACH,
    FLOOR_JETTON,
    MIN_JETTON,
    MULTI_MIN,
    MULTI_MAX,
    FLOOR,
    expectFunding,
    expectSweep,
    sweepActions,
    audit,
    GAS_GRAM,
    GAS_USDT,
    CREATE_USDT_ATTACH,
    CLAIM_ATTACH,
    FLOOR_USDT,
    FLOOR_GRAM,
    MIN_GRAM,
    MIN_USDT,
    SIGN_VALID_S,
    REFUND_GRACE_S,
    EXPIRY_DAYS,
    OPEN_MAX,
    CLOUD_MAX,
    PENDING_MAX,
    NOTE_MAX,
    WALLET_ID,
    USDT,
    BOT,
    LINK_BASE
  };
  Object.defineProperty(CK, "chequeAudit", { value: Object.freeze(CK.chequeAudit), writable: false, configurable: false, enumerable: true });
})();
