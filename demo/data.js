(function () {
  'use strict';

  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function series(seed, last, changePct, n, noise) {
    const rnd = seeded(seed);
    const first = last / (1 + changePct / 100);
    const amp = noise || .006;
    const waves = [[1.4, 1], [2.9, .62], [5.3, .34], [9.1, .16]].map(([f, a]) => ({
      f: f * (.85 + rnd() * .3), a, phase: rnd() * Math.PI * 2
    }));
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const shape = waves.reduce((s, w) => s + w.a * Math.sin(Math.PI * 2 * w.f * t + w.phase), 0);
      const bridge = Math.sin(Math.PI * t);
      const jitter = (rnd() - .5) * .28;
      out.push((first + (last - first) * t) * (1 + amp * (shape + jitter) * bridge));
    }
    out[n - 1] = last;
    return out;
  }

  const raw = [
    ['btc', 'Bitcoin', 'BTC', 64250.4, 2.14, '#f7931a', 1.27e12, 28.4e9],
    ['eth', 'Ethereum', 'ETH', 3180.25, -.86, '#627eea', 382e9, 14.2e9],
    ['ton', 'Gram', 'GRAM', 1.22, 4.61, '#0098ea', 13.7e9, 318e6],
    ['sol', 'Solana', 'SOL', 148.7, -2.35, '#8a5cf0', 68.1e9, 3.1e9],
    ['bnb', 'BNB', 'BNB', 590.1, .73, '#d9a514', 86.4e9, 1.4e9],
    ['xrp', 'XRP', 'XRP', .524, 1.92, '#4a5563', 29.3e9, 980e6],
    ['doge', 'Dogecoin', 'DOGE', .1243, -3.14, '#b89a35', 18e9, 740e6],
    ['not', 'Notcoin', 'NOT', .0071, 6.4, '#3a3a40', 730e6, 96e6],
    ['usdt', 'Tether', 'USDT', 1, .01, '#26a17b', 112e9, 41.6e9]
  ];

  const coins = raw.map((r, i) => ({
    id: r[0], name: r[1], sym: r[2], price: r[3], change: r[4], color: r[5], cap: r[6], volume: r[7],
    favorite: i < 3,
    series: series(100 + i * 7, r[3], r[4], 24, r[0] === 'usdt' ? .0004 : .007)
  }));
  const byId = Object.fromEntries(coins.map((c) => [c.id, c]));

  const FRAMES = [
    { value: '1h', label: CK.tr('tf.1h'), mult: .18, points: 48, noise: .0012 },
    { value: '1d', label: CK.tr('tf.1d'), mult: 1, points: 64, noise: .005 },
    { value: '1w', label: CK.tr('tf.1w'), mult: 2.6, points: 64, noise: .012 },
    { value: '1m', label: CK.tr('tf.1m'), mult: 5.1, points: 72, noise: .022 },
    { value: '1y', label: CK.tr('tf.1y'), mult: 13, points: 84, noise: .05 }
  ];

  const finite = (v) => typeof v === 'number' && Number.isFinite(v);


  function setRealPrice(c, price) {
    c.priced = true;
    c.price = price;
    c.series[c.series.length - 1] = price;
  }

  function setRealSum(c, key, value) {
    if (finite(value) && value > 0) {
      c[key] = value;
      c[key + 'Real'] = true;
    } else if (!c[key + 'Real']) {
      c[key] = null;
    }
  }

  const DEMO_NETWORKS = [['ton', 'TON', 'ton'], ['eth', 'Ethereum', 'eth'], ['bsc', 'BNB Chain', 'bnb'], ['sol', 'Solana', 'sol']];
  const DEMO_TOKENS = [
    ['ton', 'gram', 'GRAM', 'Gram', 1.22, 4.61, 318e6, 42e6, 'none', 'ton'],
    ['ton', 'usdt', 'USDT', 'Tether', 1, .01, 416e6, 88e6, 'none', 'usdt'],
    ['ton', 'not', 'NOT', 'Notcoin', .0071, 6.4, 96e6, 12e6, 'none', 'not'],
    ['ton', 'pearl', 'DPEARL', 'Demo Pearl', 3.418, 12.3, 8.4e6, 2.1e6, 'none'],
    ['ton', 'anchor', 'DANCHOR', 'Demo Anchor', .8421, -3.2, 5.2e6, 1.6e6, 'none'],
    ['ton', 'gull', 'DGULL', 'Demo Gull', .0412, 22.7, 3.9e6, 840e3, 'none'],
    ['ton', 'wave', 'DWAVE', 'Demo Wave', .00318, -8.1, 2.7e6, 610e3, 'none'],
    ['ton', 'fish', 'DFISH', 'Demo Fish', .0000000123, 41.2, 1.9e6, 380e3, 'none'],
    ['ton', 'crab', 'DCRAB', 'Demo Crab', .000367, -14.6, 1.4e6, 290e3, 'none'],
    ['ton', 'whale', 'DWHALE', 'Demo Whale', 18.74, 1.9, 1.1e6, 4.2e6, 'none'],
    ['ton', 'sail', 'DSAIL', 'Demo Sail', .2291, 5.5, 920e3, 410e3, 'none'],
    ['ton', 'storm', 'DSTORM', 'Demo Storm', .0089, -27.4, 780e3, 120e3, 'none'],
    ['ton', 'beacon', 'DBEACON', 'Demo Beacon', 1.067, .4, 610e3, 530e3, 'none'],
    ['ton', 'compass', 'DCOMP', 'Demo Compass', .1534, -1.3, 450e3, 220e3, 'none'],
    ['ton', 'shell', 'DSHELL', 'Demo Shell', .00062, 9.8, 310e3, 94e3, 'none'],
    ['ton', 'jelly', 'DJELLY', 'Demo Jelly', .0000041, 63.5, 240e3, 41e3, 'none'],
    ['ton', 'tide', 'DTIDE', 'Demo Tide', .0627, -5.9, 160e3, 73e3, 'none'],
    ['ton', 'buoy', 'DBUOY', 'Demo Buoy', .0143, -2.2, 900, 410, 'low_liquidity'],
    ['ton', 'fake', 'USDT', 'Demo Fake', .98, -.4, 1200, 800, 'suspicious'],
    ['ton', 'quiet', 'DQUIET', 'Demo Quiet', null, null, null, 0, 'no_liquidity'],
    ['ton', 'sleep', 'DSLEEP', 'Demo Sleep', null, null, null, null, 'none'],
    ['eth', 'eth', 'ETH', 'Ethereum', 3180.25, -.86, 14.2e9, 2.1e9, 'none', 'eth'],
    ['eth', 'wbtc', 'WBTC', 'Wrapped Bitcoin', 64250.4, 2.14, 412e6, 980e6, 'none', 'btc'],
    ['eth', 'dusk', 'DDUSK', 'Demo Dusk', .4418, 3.3, 2.6e6, 1.2e6, 'none'],
    ['bsc', 'bnb', 'BNB', 'BNB', 590.1, .73, 1.4e9, 610e6, 'none', 'bnb'],
    ['bsc', 'xrp', 'XRP', 'XRP', .524, 1.92, 980e6, 190e6, 'none', 'xrp'],
    ['bsc', 'dune', 'DDUNE', 'Demo Dune', .0731, -6.4, 1.3e6, 520e3, 'none'],
    ['sol', 'sol', 'SOL', 'Solana', 148.7, -2.35, 3.1e9, 720e6, 'none', 'sol'],
    ['sol', 'doge', 'DOGE', 'Dogecoin', .1243, -3.14, 740e6, 88e6, 'none', 'doge'],
    ['sol', 'sun', 'DSUN', 'Demo Sun', .00214, 18.2, 2.2e6, 660e3, 'none']
  ].map((r, i) => ({
    id: `${r[0]}:DEMO-${r[1]}`, network: r[0], address: `DEMO-${r[1]}`, symbol: r[2], name: r[3], logoKey: r[9] || null,
    price: r[4], change24h: r[5], volume24h: r[6], liquidity: r[7], risk: r[8], listed: i
  }));
  const demoLogo = (key) => (key && CK.COIN_LOGOS[key]) || null;
  const demoCopy = (t) => ({
    id: t.id, network: t.network, address: t.address, symbol: t.symbol, name: t.name, logo: demoLogo(t.logoKey),
    price: t.price, change24h: t.change24h, volume24h: t.volume24h, liquidity: t.liquidity, risk: t.risk
  });
  let demoDriftAt = Date.now();
  function demoDrift() {
    if (Date.now() - demoDriftAt < 20000) return;
    demoDriftAt = Date.now();
    DEMO_TOKENS.forEach((t) => {
      if (t.price && t.symbol !== 'USDT') t.price *= 1 + (Math.random() - .5) * .006;
    });
  }
  const byNumber = (key, dir) => (a, b) => {
    if (a[key] === null) return b[key] === null ? 0 : 1;
    if (b[key] === null) return -1;
    return dir * (b[key] - a[key]);
  };
  const DEMO_SORTS = { popular: byNumber('volume24h', 1), gainers: byNumber('change24h', 1), losers: byNumber('change24h', -1), new: (a, b) => b.listed - a.listed };
  const tokenApi = {
    networks() {
      return Promise.resolve(DEMO_NETWORKS.map(([id, name, key]) => ({ id, name, logo: demoLogo(key), total: DEMO_TOKENS.filter((t) => t.network === id).length })));
    },
    tokens(p) {
      demoDrift();
      const q = String(p.q || '').trim().toLowerCase();
      const rows = DEMO_TOKENS
        .filter((t) => t.network === (p.network || 'ton'))
        .filter((t) => !q || t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.address.toLowerCase() === q)
        .sort(DEMO_SORTS[p.sort] || DEMO_SORTS.popular);
      const start = Number(p.cursor) || 0, limit = Number(p.limit) || 40;
      const next = start + limit < rows.length ? String(start + limit) : null;
      return Promise.resolve({ network: p.network, total: rows.length, nextCursor: next, stale: false, tokens: rows.slice(start, start + limit).map(demoCopy) });
    },
    item(id) {
      demoDrift();
      const t = DEMO_TOKENS.find((row) => row.id === id);
      return t ? Promise.resolve({ token: demoCopy(t), pool: null }) : Promise.reject(new Error('not_found'));
    },
    klines(id, tf) {
      const t = DEMO_TOKENS.find((row) => row.id === id);
      const frame = FRAMES.find((f) => f.value === tf);
      if (!t || !frame) return Promise.reject(new Error('bad_request'));
      if (!t.price) return Promise.resolve({ points: [], stale: false, noTrades: true });
      const seed = Array.from(id).reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) + frame.points;
      const values = series(seed, t.price, (t.change24h || 0) * frame.mult, frame.points, frame.noise);
      const span = { '1h': 36e5, '1d': 864e5, '1w': 6048e5, '1m': 2592e6, '1y': 31536e6 }[tf];
      const now = Date.now();
      return Promise.resolve({ stale: false, points: values.map((c, i) => [Math.round(now - (values.length - 1 - i) * span / (values.length - 1)), c]) });
    }
  };

  const CANONICAL = new Map(Object.entries({
    'ton:EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c': 'ton',
    'ton:EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs': 'usdt',
    'ton:EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT': 'not',
    'eth:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'eth',
    'bsc:0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': 'bnb',
    'solana:So11111111111111111111111111111111111111112': 'sol',
    'ton:DEMO-gram': 'ton', 'ton:DEMO-usdt': 'usdt', 'ton:DEMO-not': 'not',
    'eth:DEMO-eth': 'eth', 'bsc:DEMO-bnb': 'bnb', 'bsc:DEMO-xrp': 'xrp', 'sol:DEMO-sol': 'sol', 'sol:DEMO-doge': 'doge'
  }).map(([id, coin]) => [id.toLowerCase(), coin]));
  const canonicalCoin = (token) => byId[CANONICAL.get(String(token.id).toLowerCase())] || null;

  const instruments = new Map();
  const hueOf = (id) => Array.from(id).reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 360, 7);
  function applyFloor(inst, floor, at) {
    if (!(at > 0) || (inst.floorAt > 0 && at < inst.floorAt)) return;
    inst.floor = finite(floor) && floor > 0 ? floor : null;
    inst.floorAt = at;
  }
  function applyToken(inst, t) {
    inst.token = t;
    if (t.floor !== undefined) applyFloor(inst, t.floor, t.floorAt);
    if (t.price > 0) inst.price = t.price;
    if (t.change24h !== null) inst.change = t.change24h;
    if (t.logo) inst.logo = t.logo;
    if (t.logoAlt) inst.logoAlt = t.logoAlt;
  }
  function instrumentOf(x) {
    if (x.sym) return x;
    const coin = canonicalCoin(x);
    if (coin) return coin;
    let inst = instruments.get(x.id);
    if (!inst) {
      inst = { id: x.id, isToken: true, neutral: true, sym: x.symbol, name: x.name, color: `hsl(${hueOf(x.id)} 55% 55%)`, price: null, change: null, logo: null, token: x };
      instruments.set(x.id, inst);
    }
    applyToken(inst, x);
    return inst;
  }

  if (CK.market && typeof CK.market.onTokenFloor === 'function') {
    CK.market.onTokenFloor((id, floor) => {
      const inst = instruments.get(id);
      if (inst) applyFloor(inst, floor, Date.now());
    });
  }

  const NATIVE_RAW = '0:' + '0'.repeat(64);
  let balances = null;
  let balancesKept = false, balancesFor = null, balancesAt = 0;
  let onOrders = [];
  let onNets = [];
  let keptNets = [];
  const balanceSubs = new Set();
  function notify() {
    balanceSubs.forEach((fn) => {
      try { fn(); } catch (err) { console.error(err); }
    });
  }
  function feedAddress(text) {
    const raw = CK.ton.rawAddress(text);
    if (!raw) return null;
    if (/^EQ/.test(text)) return text;
    const bytes = Uint8Array.from(atob(CK.ton.friendlyAddress(raw).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    bytes[0] = 0x11;
    let crc = 0;
    bytes.subarray(0, 34).forEach((byte) => {
      crc ^= byte << 8;
      for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    });
    bytes[34] = crc >> 8;
    bytes[35] = crc & 0xff;
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
  }
  function cleanBalance(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const units = typeof raw.units === 'bigint' ? raw.units : CK.ton.parseUnits(raw.units);
    if (units === null || units < 0n || !Number.isInteger(raw.decimals) || raw.decimals < 0 || raw.decimals > 30) return null;
    const line = { units, decimals: raw.decimals, chainUsd: typeof raw.usd === 'number' && Number.isFinite(raw.usd) && raw.usd >= 0 ? raw.usd : null, flagged: raw.risk === 'suspicious' };
    if (raw.native === true || raw.id === 'TON' || CK.ton.rawAddress(raw.id) === NATIVE_RAW) return { ...line, coin: byId.ton };
    const address = feedAddress(raw.token || raw.id);
    if (!address) return null;
    const id = `ton:${address}`;
    const official = canonicalCoin({ id });
    if (!official) {
      if (CK.market.passesForCoin(raw.symbol || raw.sym, raw.name, raw.listed)) line.flagged = true;
      if (raw.listed === false) {
        line.chainUsd = null;
        line.unlisted = true;
      }
    }
    const known = official || instruments.get(id);
    if (known) return { ...line, coin: known };
    const token = CK.market.cleanToken({ id, network: 'ton', address, symbol: raw.symbol || raw.sym, name: raw.name, risk: line.flagged ? 'suspicious' : 'none' });
    return token ? { ...line, coin: instrumentOf(token) } : null;
  }
  function heldRow(line) {
    const { coin } = line;
    const amount = CK.ton.fromUnits(line.units, line.decimals);
    const risk = line.flagged || (coin.token && coin.token.risk === 'suspicious') ? 'suspicious' : 'none';
    const live = coin.isToken ? coin.price > 0 : coin.priced === true;
    const priced = risk !== 'suspicious' && (live || line.chainUsd !== null);
    const change = live || line.keptChange === undefined ? coin.change : line.keptChange;
    let usd = !priced ? 0 : live ? amount * coin.price : line.chainUsd;
    const pooled = coin.token && coin.token.liquidity;
    if (line.unlisted && typeof pooled === 'number' && pooled > 0) usd = Math.min(usd, pooled);
    return { coin, amount, usd, risk, priced, units: line.units, decimals: line.decimals, net: line.net || null, change };
  }
  function netLines() {
    if (!keptNets.length) return onNets;
    const fresh = new Set(onNets.map((line) => line.net));
    return onNets.concat(keptNets.filter((line) => !fresh.has(line.net)));
  }

  const KEPT_KEY = 'ck-folio-kept';
  const KEPT_VERSION = 1;
  const KEPT_WALLETS = 10;
  const KEPT_ROWS = 60;
  const KEPT_CHARS_MAX = 64000;
  const KEEP_EVERY_MS = 10000;
  const KEPT_ID = /^[\w.:-]{1,160}$/;
  const KEPT_COLOR = /^(#[0-9a-f]{3,8}|hsl\(\d{1,3} \d{1,3}% \d{1,3}%\))$/i;
  function readKept() {
    try {
      const kept = JSON.parse(localStorage.getItem(KEPT_KEY));
      if (!kept || kept.v !== KEPT_VERSION || !Array.isArray(kept.wallets)) return [];
      return kept.wallets.filter((w) => w && typeof w.a === 'string' && Array.isArray(w.rows));
    } catch (_) {
      return [];
    }
  }
  function keptCoin(row) {
    if (Object.prototype.hasOwnProperty.call(byId, row.id)) return byId[row.id];
    const known = instruments.get(row.id);
    if (known) return known;
    const at = row.id.indexOf(':');
    const token = at > 0 ? CK.market.cleanToken({ id: row.id, network: row.id.slice(0, at), address: row.id.slice(at + 1), symbol: row.sym, name: row.name, risk: row.flagged === true ? 'suspicious' : 'none' }) : null;
    if (!token) return null;
    if (row.gas !== true) return instrumentOf(token);
    const sym = token.symbol;
    return {
      id: token.id, isToken: true, neutral: true, viewOnly: true, gas: true, sym, name: sym,
      color: KEPT_COLOR.test(row.color) ? row.color : `hsl(${hueOf(token.id)} 55% 55%)`, price: null, change: null,
      logo: CK.COIN_LOGOS[sym.toLowerCase()] || null, token: { id: token.id, symbol: sym, name: sym, risk: 'none', change24h: null }
    };
  }
  function keptLine(row) {
    if (!row || typeof row.id !== 'string' || !KEPT_ID.test(row.id)) return null;
    const units = CK.ton.parseUnits(row.units);
    if (units === null || !(units > 0n) || !Number.isInteger(row.decimals) || row.decimals < 0 || row.decimals > 30) return null;
    const coin = keptCoin(row);
    if (!coin) return null;
    return {
      coin, units, decimals: row.decimals,
      chainUsd: finite(row.usd) && row.usd >= 0 ? row.usd : null,
      flagged: row.flagged === true || (row.id.startsWith('ton:') && !canonicalCoin({ id: row.id }) && CK.market.passesForCoin(row.sym, row.name, true)),
      keptChange: finite(row.change) ? row.change : null,
      net: typeof row.net === 'string' && row.net && row.net.length <= 32 ? row.net : null
    };
  }
  let keptAt = 0, keepTimer = 0, keptText = '';
  function writeKept() {
    const wallet = CK.ton.wallet;
    if (!wallet || !balances || balancesFor !== wallet.address) return;
    const rows = balances.concat(netLines()).filter((line) => line.units > 0n).map(heldRow);
    if (rows.some((h) => !h.coin.isToken && !h.priced && h.risk !== 'suspicious')) return;
    keptAt = Date.now();
    const kept = rows.sort((a, b) => b.usd - a.usd).slice(0, KEPT_ROWS).map((h) => {
      const row = { id: h.coin.id, units: h.units.toString(), decimals: h.decimals, usd: h.priced ? h.usd : null, change: finite(h.change) ? h.change : null, sym: h.coin.sym, name: h.coin.name };
      if (h.net) row.net = h.net;
      if (h.risk === 'suspicious') row.flagged = true;
      if (h.coin.gas) {
        row.gas = true;
        row.color = h.coin.color;
      }
      return row;
    });
    const wallets = [{ a: wallet.address, rows: kept }].concat(readKept().filter((w) => w.a !== wallet.address)).slice(0, KEPT_WALLETS);
    let text = JSON.stringify({ v: KEPT_VERSION, wallets });
    while (text.length > KEPT_CHARS_MAX && wallets.length > 1) {
      wallets.pop();
      text = JSON.stringify({ v: KEPT_VERSION, wallets });
    }
    if (text.length > KEPT_CHARS_MAX || text === keptText) return;
    try {
      localStorage.setItem(KEPT_KEY, text);
      keptText = text;
    } catch (_) { }
  }

  const FORGOTTEN_KEY = 'ck-virtual-forgotten';
  const VIRTUAL_KEY = /^(dt-account:|ck-swap-history:|ck-account$)/;
  function forgetVirtualAccount() {
    try {
      if (localStorage.getItem(FORGOTTEN_KEY)) return;
      const old = [];
      for (let i = 0; i < localStorage.length; i++) {
        if (VIRTUAL_KEY.test(localStorage.key(i))) old.push(localStorage.key(i));
      }
      old.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(FORGOTTEN_KEY, '1');
    } catch (_) { }
  }
  forgetVirtualAccount();

  window.DemoData = {
    coins,
    byId,
    FRAMES,
    tokenApi,
    instruments,
    applyToken,
    instrumentOf,
    canonicalCoin,
    qty(v) {
      const a = Math.abs(v);
      if (!Number.isFinite(a) || a === 0) return '0';
      if (a >= 1e9) return CK.fmt.compact(v);
      const digits = a >= 1000 ? 2 : a >= 1 ? 4 : Math.min(12, Math.ceil(-Math.log10(a)) + 3);
      const point = CK.fmt.decimal();
      const [whole, part] = CK.fmt.num(v, digits).split(point);
      const trimmed = (part || '').replace(/0+$/, '');
      if (a >= 1) return `${whole}${point}${trimmed.padEnd(2, '0')}`;
      return trimmed ? `${whole}${point}${trimmed}` : whole;
    },
    setBalances(rows) {
      balances = Array.isArray(rows) ? rows.map(cleanBalance).filter(Boolean) : null;
      balancesKept = false;
      balancesFor = balances && CK.ton.wallet ? CK.ton.wallet.address : null;
      balancesAt = balances ? Date.now() : 0;
      if (!balances) keptNets = [];
      notify();
    },
    keptTotal(address) {
      const kept = readKept().find((w) => w.a === address);
      return kept ? kept.rows.reduce((sum, row) => sum + (finite(row.usd) && row.usd > 0 && row.flagged !== true ? row.usd : 0), 0) : null;
    },
    restoreKept(address) {
      const kept = readKept().find((w) => w.a === address);
      const lines = kept ? kept.rows.map(keptLine) : [];
      if (!kept || lines.some((line) => !line)) return false;
      balances = lines.filter((line) => !line.net);
      keptNets = lines.filter((line) => line.net);
      balancesKept = true;
      balancesFor = address;
      balancesAt = 0;
      notify();
      return true;
    },
    keep() {
      if (keepTimer) return;
      keepTimer = setTimeout(() => {
        keepTimer = 0;
        writeKept();
      }, Math.max(0, keptAt + KEEP_EVERY_MS - Date.now()));
    },
    get balancesKnown() { return balances !== null; },
    get balancesKept() { return balancesKept; },
    get balancesWallet() { return balances ? balancesFor : null; },
    get balancesAt() { return balancesAt; },
    onBalances(fn) {
      balanceSubs.add(fn);
      return () => balanceSubs.delete(fn);
    },
    holdings() {
      return (balances || []).concat(netLines()).filter((line) => line.units > 0n).map(heldRow).sort((a, b) => b.usd - a.usd);
    },
    setNets(lines) {
      onNets = lines.map((line) => ({ ...line, chainUsd: null, flagged: false }));
      notify();
    },
    settleNets(answered) {
      if (!keptNets.length) return;
      const names = new Set(answered());
      const left = keptNets.filter((line) => !names.has(line.net));
      if (left.length === keptNets.length) return;
      keptNets = left;
      notify();
    },
    free(coin) {
      const row = this.holdings().find((h) => h.coin === coin);
      return row ? row.amount : 0;
    },
    setOrdered(rows) {
      onOrders = rows.map(cleanBalance).filter(Boolean);
      notify();
    },
    ordered() {
      return onOrders.filter((line) => line.units > 0n).map(heldRow);
    },
    counted() {
      const lines = new Map();
      (balances || []).concat(onOrders, netLines()).forEach((line) => {
        if (!(line.units > 0n)) return;
        const had = lines.get(line.coin);
        lines.set(line.coin, had ? { ...had, units: had.units + line.units, chainUsd: had.chainUsd === null || line.chainUsd === null ? null : had.chainUsd + line.chainUsd } : line);
      });
      return Array.from(lines.values()).map(heldRow).sort((a, b) => b.usd - a.usd);
    },
    coinOfAddress(raw) {
      const address = feedAddress(raw);
      if (!address) return null;
      const id = `ton:${address}`;
      return canonicalCoin({ id }) || instruments.get(id) || null;
    },
    tokenIdOf(raw) {
      const address = feedAddress(raw);
      return address ? `ton:${address}` : null;
    },
    totals() {
      const rows = this.counted();
      const value = rows.reduce((s, r) => s + r.usd, 0);
      const moved = rows.reduce((s, r) => (r.change > -100 ? s + r.usd * (1 - 1 / (1 + r.change / 100)) : s), 0);
      const before = value - moved;
      const partial = rows.some((r) => !r.priced && r.risk !== 'suspicious');
      return { value, pnl: moved, pnlPct: before > 0 ? moved / before * 100 : 0, known: balances !== null && rows.every((r) => r.priced || r.risk === 'suspicious' || r.net), partial };
    },
    applyCoin(raw) {
      const c = byId[raw.id];
      if (!c) return;
      if (Array.isArray(raw.spark) && raw.spark.length > 1 && raw.spark.every(finite)) c.series = raw.spark.slice();
      if (finite(raw.price) && raw.price > 0) setRealPrice(c, raw.price);
      if (finite(raw.change24h)) c.change = raw.change24h;
      if (c.change > -100) c.series[0] = c.price / (1 + c.change / 100);
      if (finite(raw.high24h)) c.high24h = raw.high24h;
      if (finite(raw.low24h)) c.low24h = raw.low24h;
      setRealSum(c, 'volume', raw.volume24h);
      setRealSum(c, 'cap', raw.marketCap);
      if (typeof raw.logo === 'string' && /^[\w-]+(\/[\w.-]+)*\.(svg|png|webp)$/.test(raw.logo)) CK.COIN_LOGOS[c.id] = raw.logo;
    },
    applyTick(c, t) {
      if (!finite(t.price) || t.price <= 0) return;
      if (CK.market.mode !== 'live') {
        c.price = t.price;
        return;
      }
      setRealPrice(c, t.price);
      if (finite(t.change24h)) c.change = t.change24h;
      if (finite(t.high24h)) c.high24h = t.high24h;
      if (finite(t.low24h)) c.low24h = t.low24h;
      setRealSum(c, 'volume', t.volume24h);
    },
    frameSeries(coin, frame) {
      return series(coin.id.charCodeAt(0) * 31 + frame.points + Math.round(frame.mult * 10), coin.price, coin.change * frame.mult, frame.points, coin.id === 'usdt' ? .0004 : frame.noise);
    }
  };
})();
