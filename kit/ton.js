(function() {
  "use strict";
  const CK = window.CK;
  const MAINNET = "-239";
  const FEE_BPS = 100;
  const FEE_ADDRESS = "0:29962731d4d7c639572e70bc6f5d75f44fb88535bf8f15de00b09dd09fddd228";
  const SLIPPAGES = [50, 100, 300, 500, 1e3];
  const SLIPPAGE_STEP_BPS = 10;
  const SLIPPAGE_MAX_BPS = 2e3;
  const slippageOk = (bps) => Number.isInteger(bps) && bps >= SLIPPAGE_STEP_BPS && bps <= SLIPPAGE_MAX_BPS && bps % SLIPPAGE_STEP_BPS === 0;
  const REQUEST_MS = 12e3;
  const RAW_ADDRESS = /^(-?\d+):([0-9a-fA-F]{64})$/;
  const FRIENDLY_ADDRESS = /^[A-Za-z0-9_-]{48}$/;
  const TAG_BOUNCEABLE = 17;
  const TAG_NON_BOUNCEABLE = 81;
  const TAG_TEST_ONLY = 128;
  function crc16(bytes) {
    let crc = 0;
    bytes.forEach((byte) => {
      crc ^= byte << 8;
      for (let i = 0; i < 8; i++) crc = crc & 32768 ? (crc << 1 ^ 4129) & 65535 : crc << 1 & 65535;
    });
    return crc;
  }
  function rawAddress(text) {
    if (typeof text !== "string") return null;
    const raw = RAW_ADDRESS.exec(text);
    if (raw) return `${Number(raw[1])}:${raw[2].toLowerCase()}`;
    if (!FRIENDLY_ADDRESS.test(text)) return null;
    let bytes;
    try {
      bytes = Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    } catch (_) {
      return null;
    }
    if (bytes.length !== 36 || bytes[0] & TAG_TEST_ONLY) return null;
    const tag = bytes[0];
    if (tag !== TAG_BOUNCEABLE && tag !== TAG_NON_BOUNCEABLE) return null;
    if (crc16(bytes.subarray(0, 34)) !== (bytes[34] << 8 | bytes[35])) return null;
    const workchain = bytes[1] === 255 ? -1 : bytes[1];
    const hash = Array.from(bytes.subarray(2, 34), (b) => b.toString(16).padStart(2, "0")).join("");
    return `${workchain}:${hash}`;
  }
  const tagOf = (friendly) => atob(friendly.slice(0, 4).replace(/-/g, "+").replace(/_/g, "/")).charCodeAt(0);
  function friendlyAddress(raw) {
    const m = RAW_ADDRESS.exec(raw || "");
    if (!m) return "";
    const bytes = new Uint8Array(36);
    bytes[0] = TAG_NON_BOUNCEABLE;
    bytes[1] = Number(m[1]) & 255;
    for (let i = 0; i < 32; i++) bytes[2 + i] = parseInt(m[2].substr(i * 2, 2), 16);
    const crc = crc16(bytes.subarray(0, 34));
    bytes[34] = crc >> 8;
    bytes[35] = crc & 255;
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_");
  }
  function shortAddress(text) {
    return text && text.length > 12 ? `${text.slice(0, 4)}\u2026${text.slice(-4)}` : text || "";
  }
  function parseRecipient(text) {
    const value = typeof text === "string" ? text.trim() : "";
    if (!FRIENDLY_ADDRESS.test(value)) return null;
    const address = rawAddress(value);
    if (!address || !address.startsWith("0:")) return null;
    return { address, friendly: value, bounce: tagOf(value) === TAG_BOUNCEABLE };
  }
  function toUnits(value, decimals) {
    if (decimals === void 0 || decimals === null) return 0n;
    const text = typeof value === "number" ? value.toFixed(Math.min(decimals, 12)) : String(value);
    const m = /^(\d+)(?:\.(\d+))?$/.exec(text);
    if (!m) return 0n;
    return BigInt(m[1] + (m[2] || "").slice(0, decimals).padEnd(decimals, "0"));
  }
  function fromUnits(units, decimals) {
    const text = BigInt(units).toString().padStart(decimals + 1, "0");
    const cut = text.length - decimals;
    return Number(decimals ? `${text.slice(0, cut)}.${text.slice(cut)}` : text);
  }
  function parseUnits(v) {
    if (typeof v === "bigint") return v >= 0n ? v : null;
    if (typeof v !== "string" || !/^\d{1,60}$/.test(v)) return null;
    return BigInt(v);
  }
  function readBoc(base64) {
    const b = Uint8Array.from(atob(base64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    if (b[0] !== 181 || b[1] !== 238 || b[2] !== 156 || b[3] !== 114) throw new Error("bad_boc");
    let at = 4;
    const flags = b[at++];
    const refSize = flags & 7;
    const offSize = b[at++];
    const int = (n) => {
      let v = 0;
      for (let i = 0; i < n; i++) v = v * 256 + b[at++];
      return v;
    };
    const count = int(refSize);
    int(refSize);
    int(refSize);
    int(offSize);
    const root = int(refSize);
    if (flags & 128) at += count * offSize;
    const raws = [];
    for (let i = 0; i < count; i++) {
      const d1 = b[at++], d2 = b[at++];
      if (d1 >> 3) throw new Error("special_cell");
      const size = Math.ceil(d2 / 2);
      const data = b.subarray(at, at + size);
      at += size;
      let bits = (d2 >> 1) * 8;
      if (d2 & 1) {
        const last = data[size - 1];
        let tail = 0;
        while (!(last >> tail & 1) && tail < 8) tail++;
        bits = (size - 1) * 8 + (7 - tail);
      }
      const refs = [];
      for (let r = 0; r < (d1 & 7); r++) refs.push(int(refSize));
      raws.push({ data, bits, refs });
    }
    const made = new Array(count);
    const cell = (i) => {
      if (made[i]) return made[i];
      const raw = raws[i];
      made[i] = { bits: Array.from({ length: raw.bits }, (_, n) => raw.data[n >> 3] >> 7 - (n & 7) & 1), refs: raw.refs.map(cell), hash: null, depth: 0 };
      return made[i];
    };
    return cell(root);
  }
  async function hashCell(c) {
    if (c.hash) return c.hash;
    for (const ref of c.refs) await hashCell(ref);
    const size = Math.ceil(c.bits.length / 8);
    const data = new Uint8Array(size);
    c.bits.forEach((bit, n) => {
      if (bit) data[n >> 3] |= 1 << 7 - (n & 7);
    });
    if (c.bits.length % 8) data[size - 1] |= 1 << 7 - c.bits.length % 8;
    const repr = [c.refs.length, (c.bits.length >> 3) + size];
    data.forEach((v) => repr.push(v));
    c.refs.forEach((ref) => repr.push(ref.depth >> 8, ref.depth & 255));
    c.refs.forEach((ref) => ref.hash.forEach((v) => repr.push(v)));
    c.depth = c.refs.length ? Math.max(...c.refs.map((ref) => ref.depth)) + 1 : 0;
    c.hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(repr))));
    return c.hash;
  }
  async function messageHash(boc) {
    try {
      const root = readBoc(boc);
      let at = 0;
      const take = (n) => {
        const out = root.bits.slice(at, at + n);
        at += n;
        return out;
      };
      const num = (n) => take(n).reduce((v, bit) => v * 2 + bit, 0);
      let ref = 0;
      if (num(2) !== 2) return null;
      const srcKind = num(2);
      if (srcKind === 1) take(num(9));
      else if (srcKind !== 0) return null;
      const dest = take(267);
      if (dest[0] !== 1 || dest[1] !== 0 || dest[2] !== 0) return null;
      take(num(4) * 8);
      if (num(1)) {
        if (num(1)) ref++;
        else {
          if (num(1)) take(5);
          if (num(1)) take(2);
          for (let i = 0; i < 3; i++) if (num(1)) ref++;
        }
      }
      let body;
      if (num(1)) body = root.refs[ref];
      else body = { bits: root.bits.slice(at), refs: root.refs.slice(ref), hash: null, depth: 0 };
      if (!body) return null;
      const bits = [1, 0, 0, 0].concat(dest, [0, 0, 0, 0, 0, 1]);
      const hash = await hashCell({ bits, refs: [body], hash: null, depth: 0 });
      return hash.map((v) => v.toString(16).padStart(2, "0")).join("");
    } catch (_) {
      return null;
    }
  }
  let initData = "";
  function api(path, o) {
    const opts = o || {};
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), opts.timeout || REQUEST_MS);
    if (opts.signal) opts.signal.addEventListener("abort", () => abort.abort(), { once: true });
    const headers = { Authorization: "tma " + initData };
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch("api/" + path, { method: opts.body ? "POST" : "GET", headers, body: opts.body ? JSON.stringify(opts.body) : void 0, signal: abort.signal, cache: "no-store" }).then((res) => res.json()).then((body) => {
      if (!body || body.ok !== true) {
        const err = new Error(body && body.error || "bad_response");
        err.detail = body;
        throw err;
      }
      return body;
    }).finally(() => clearTimeout(timer));
  }
  function readConfig(body) {
    const mode = body.mode;
    if (mode !== "allowlist" && mode !== "all" || body.allowed !== true) return { state: "closed" };
    const maxUsd = Number(body.maxUsd);
    const slippageBps = body.slippageBps;
    const slippages = SLIPPAGES.includes(slippageBps) ? SLIPPAGES : [];
    if (body.feeBps !== FEE_BPS || rawAddress(body.feeAddress) !== FEE_ADDRESS || !(maxUsd > 0) || !slippages.length) return { state: "failed" };
    return { state: "open", mode, feeBps: FEE_BPS, feeAddress: FEE_ADDRESS, maxUsd, slippageBps, slippages };
  }
  let configJob = null;
  const CONFIG_WAIT_MS = 1e3;
  const CONFIG_WAITS = 8;
  function askConfig(waits) {
    return api("swap/config").then((body) => {
      if (body.reason !== "fee_wallet_unverified") return readConfig(body);
      if (!waits) throw new Error("not_ready");
      return new Promise((resolve) => setTimeout(resolve, CONFIG_WAIT_MS)).then(() => askConfig(waits - 1));
    });
  }
  function config() {
    if (configJob) return configJob;
    configJob = CK.market.ready.then(() => CK.market.mode === "live" ? CK.tg.whenInitData() : "").then((data) => {
      if (!data) return { state: "closed" };
      initData = data;
      return askConfig(CONFIG_WAITS);
    }).catch(() => {
      configJob = null;
      return { state: "failed" };
    });
    return configJob;
  }
  let wallet = null;
  const walletSubs =   new Set();
  function setWallet(next) {
    const address = next ? rawAddress(next.address) : null;
    const readOnly = !!(next && next.readOnly);
    if ((address || null) === (wallet && wallet.address) && (!wallet || wallet.readOnly === readOnly)) return;
    wallet = address && address.startsWith("0:") ? { address, friendly: friendlyAddress(address), readOnly } : null;
    walletSubs.forEach((fn) => {
      try {
        fn(wallet);
      } catch (err) {
        console.error(err);
      }
    });
  }
  function openLink(url) {
    const app = CK.tg.app;
    let modern = false;
    try {
      modern = !!(app && app.isVersionAtLeast && app.isVersionAtLeast("6.1"));
    } catch (_) {
    }
    try {
      if (modern && /^https:\/\/t\.me\//.test(url) && app.openTelegramLink) return app.openTelegramLink(url);
      if (modern && app.openLink) return app.openLink(url);
    } catch (err) {
      console.warn("telegram link: a new window instead", err && err.message);
    }
    window.open(url, "_blank", "noopener");
  }
  CK.ton = {
    MAINNET,
    FEE_BPS,
    FEE_ADDRESS,

    SLIPPAGES: Object.freeze(SLIPPAGES.slice()),
    SLIPPAGE_MAX_BPS,
    slippageOk,
    config,
    api,
    openLink,
    rawAddress,
    friendlyAddress,
    shortAddress,
    parseRecipient,
    toUnits,
    fromUnits,
    parseUnits,
    messageHash,
    setWallet,
    get wallet() {
      return wallet;
    },

    onWallet(fn) {
      walletSubs.add(fn);
      return () => walletSubs.delete(fn);
    }
  };
  Object.defineProperty(CK, "ton", { value: Object.freeze(CK.ton), writable: false, configurable: false, enumerable: true });
})();
