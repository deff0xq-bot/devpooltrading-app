(function () {
  'use strict';
  const CK = window.CK;

  const HEALTH_MS = 2500;
  const COINS_MS = 4000;
  const PRICES_MS = 3000;
  const PRICE_IDS_MAX = 40;
  const REQUEST_MS = 8000;
  const POLL_MS = 60000;
  const POLL_RETRY_MS = 15000;
  const POLL_NO_STREAM_MS = 10000;
  const STREAM_DOWN_MS = 15000;
  const STREAM_DEAD_MS = 30000;
  const BACKOFF_S = [1, 2, 4, 8, 16, 30];
  const KLINES_TTL_MS = 20000;
  const FRAME_MS = { '1h': 36e5, '1d': 864e5, '1w': 6048e5, '1m': 2592e6, '1y': 31536e6 };

  const script = document.currentScript;
  const canGoLive = /^https?:$/.test(location.protocol) && !!(script && script.src);
  const alwaysLive = canGoLive && location.protocol === 'https:';

  const tickerSubs = new Set();
  const tokenPriceSubs = new Set();
  const tokenFloorSubs = new Set();
  const tokenTickSubs = new Set();
  const streamSubs = new Set();
  const coinSubs = new Set();
  let status = canGoLive ? 'pending' : 'demo';

  function notify(subs, ...args) {
    subs.forEach((fn) => {
      try { fn(...args); } catch (err) { console.error(err); }
    });
  }

  function getJson(path, o) {
    const opts = o || {};
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), opts.timeout || REQUEST_MS);
    if (opts.signal) opts.signal.addEventListener('abort', () => abort.abort(), { once: true });
    return fetch('api/' + path, { headers: opts.headers, signal: abort.signal, cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => {
        if (!body || body.ok !== true) {
          const err = new Error((body && body.error) || 'bad_response');
          err.body = body;
          throw err;
        }
        return body;
      })
      .finally(() => clearTimeout(timer));
  }

  const MARKET_TEXT = { demo: 'market.demo', down: 'market.down' };
  function paintPill(pill) {
    const account = pill.dataset.kind === 'account';
    const state = account ? 'account' : status;
    if (pill.dataset.state === state) return;
    pill.dataset.state = state;
    pill.textContent = !account && MARKET_TEXT[status] ? CK.t(MARKET_TEXT[status]) : '';
    if (state === 'down') {
      const dot = document.createElement('i');
      dot.className = 'data-dot';
      pill.prepend(dot);
    }
  }
  const paintPills = () => document.querySelectorAll('[data-data-status]').forEach(paintPill);
  new MutationObserver((records) => {
    records.forEach((r) => r.addedNodes.forEach((n) => {
      if (n.nodeType !== 1 || n.classList.contains('roll-d') || n.classList.contains('roll-c')) return;
      if (n.hasAttribute('data-data-status')) paintPill(n);
      n.querySelectorAll('[data-data-status]').forEach(paintPill);
    }));
  }).observe(document.body, { childList: true, subtree: true });
  paintPills();
  CK.i18n.on(() => {
    document.querySelectorAll('[data-data-status]').forEach((pill) => { delete pill.dataset.state; });
    paintPills();
  });

  function setStatus(next) {
    if (next === status) return;
    status = next;
    paintPills();
  }

  const root = document.documentElement;
  let settled = !canGoLive;
  if (canGoLive) root.classList.add('market-pending');
  function settle() {
    if (settled) return;
    settled = true;
    root.classList.remove('market-pending');
    root.classList.add('market-reveal');
    setTimeout(() => root.classList.remove('market-reveal'), 400);
  }

  let haveData = false, serverStale = false, pollTimer = 0;
  let stream = null, retryTimer = 0, retries = 0, connectedAt = 0, streamMark = 0, lastTickTs = null;
  const lastTick = {};

  let pollMark = 0, pollDueAt = 0;
  const streamOpen = () => !!stream && stream.readyState === 1;

  function checkLink() {
    if (!settled || document.hidden) return;
    const silent = Date.now() - streamMark;
    const fresh = Date.now() - Math.max(streamMark, pollMark);
    setStatus(!haveData || serverStale || fresh > STREAM_DOWN_MS ? 'down' : 'live');
    if (stream && silent > STREAM_DEAD_MS && Date.now() - connectedAt > STREAM_DEAD_MS) {
      disconnect();
      connect();
    }
  }

  function schedulePoll() {
    clearTimeout(pollTimer);
    if (document.hidden) return;
    const ms = !haveData || serverStale ? POLL_RETRY_MS : streamOpen() ? POLL_MS : POLL_NO_STREAM_MS;
    pollDueAt = Date.now() + ms;
    pollTimer = setTimeout(loadCoins, ms);
  }
  function pollSooner() {
    if (haveData && !serverStale && pollDueAt - Date.now() > POLL_NO_STREAM_MS) schedulePoll();
  }
  function loadCoins() {
    return getJson('coins', { timeout: COINS_MS })
      .then((body) => {
        if (!Array.isArray(body.coins)) throw new Error('bad_response');
        haveData = true;
        serverStale = !!body.stale;
        if (!streamOpen()) pollMark = Date.now();
        notify(coinSubs, body);
      })
      .catch(() => { })
      .then(() => {
        settle();
        checkLink();
        schedulePoll();
      });
  }

  const heldTicks = [];
  function releaseTicks() {
    heldTicks.splice(0).forEach((held) => held[0](held[1]));
  }
  function holdInFlight(handler, event) {
    if (!CK.inFlight()) return false;
    if (heldTicks.push([handler, event]) === 1) CK.afterFlight(releaseTicks);
    return true;
  }
  let streamSid = null;
  function onHello(event) {
    let data;
    try { data = JSON.parse(event.data); } catch (_) { return; }
    streamSid = data && typeof data.sid === 'string' && /^[A-Za-z0-9_-]{16}$/.test(data.sid) ? data.sid : null;
    notify(streamSubs, streamSid);
  }
  function onPrices(event) {
    if (holdInFlight(onPrices, event)) return;
    let data;
    try { data = JSON.parse(event.data); } catch (_) { return; }
    if (!data || !Array.isArray(data.p)) return;
    streamMark = Date.now();
    data.p.forEach((row) => {
      const clean = Array.isArray(row) ? cleanPrice(row.length > 3 ? { id: row[0], price: row[1], change24h: row[2], floor: row[3] } : { id: row[0], price: row[1], change24h: row[2] }) : null;
      if (!clean) return;
      if (clean.floor !== undefined) notify(tokenFloorSubs, clean.id, clean.floor);
      if (!clean.price) return;
      notify(tokenPriceSubs, clean.id, clean.price);
      notify(tokenTickSubs, clean.id, clean);
    });
  }
  function onTickers(event) {
    if (holdInFlight(onTickers, event)) return;
    let data;
    try { data = JSON.parse(event.data); } catch (_) { return; }
    if (!data || !data.coins) return;
    retries = 0;
    if (data.ts !== lastTickTs) {
      lastTickTs = data.ts;
      streamMark = Date.now();
      haveData = true;
    }
    Object.keys(data.coins).forEach((id) => {
      const t = data.coins[id];
      const prev = lastTick[id];
      if (!t || (prev && prev.price === t.price && prev.change24h === t.change24h)) return;
      lastTick[id] = t;
      notify(tickerSubs, id, t);
    });
    checkLink();
  }
  function connect() {
    if (stream || document.hidden) return;
    clearTimeout(retryTimer);
    connectedAt = Date.now();
    const es = new EventSource('api/stream');
    stream = es;
    es.addEventListener('tickers', onTickers);
    es.addEventListener('hello', onHello);
    es.addEventListener('prices', onPrices);
    es.onerror = () => {
      if (stream !== es) return;
      disconnect();
      const delay = BACKOFF_S[Math.min(retries++, BACKOFF_S.length - 1)];
      retryTimer = setTimeout(connect, delay * 1000 * (.8 + Math.random() * .4));
      pollSooner();
    };
  }
  function disconnect() {
    clearTimeout(retryTimer);
    if (stream) stream.close();
    stream = null;
    if (streamSid) {
      streamSid = null;
      notify(streamSubs, null);
    }
  }

  const FX_MS = 60 * 60 * 1000;
  const FX_RETRY_MS = 60 * 1000;
  let fxDue = 0;
  function loadRates() {
    if (document.hidden || Date.now() < fxDue) return;
    fxDue = Date.now() + FX_MS;
    getJson('fx')
      .then((body) => CK.currency.setRates(body.rates, body.at))
      .catch(() => { fxDue = Date.now() + FX_RETRY_MS; });
  }

  function goLive() {
    streamMark = Date.now();
    loadCoins().then(connect);
    loadRates();
    setInterval(loadRates, FX_RETRY_MS);
    setInterval(checkLink, 2000);
    setInterval(sendWaits, BEACON_CHECK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        disconnect();
        clearTimeout(pollTimer);
        waitsLeft();
        return;
      }
      waitsBack();
      streamMark = Date.now();
      retries = 0;
      connect();
      loadCoins();
    });
  }

  const klineCache = new Map();
  const klineJobs = new Map();

  function demoKlines(coinId, tf) {
    const D = window.DemoData;
    const coin = D && D.byId[coinId];
    const frame = D && D.FRAMES.find((f) => f.value === tf);
    if (!coin || !frame) return Promise.reject(new Error('bad_request'));
    const series = D.frameSeries(coin, frame);
    const now = Date.now();
    const step = FRAME_MS[tf] / (series.length - 1);
    return Promise.resolve({
      points: series.map((c, i) => [Math.round(now - (series.length - 1 - i) * step), c]),
      stale: false
    });
  }
  const cleanCandles = (rows) => (Array.isArray(rows) ? rows.filter((r) => Array.isArray(r) && r.length >= 5 && r.slice(0, 5).every(Number.isFinite)) : []);
  function liveKlines(coinId, tf) {
    const query = 'klines?coin=' + encodeURIComponent(coinId) + '&tf=' + encodeURIComponent(tf);
    return getJson(query).then((body) => {
      const points = (Array.isArray(body.points) ? body.points : []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      if (points.length < 2) throw new Error('no_points');
      const asOf = Number.isFinite(body.ts) && body.ts > 0 ? body.ts : null;
      const source = typeof body.source === 'string' ? body.source : null;
      return { points, candles: cleanCandles(body.candles), stale: !!body.stale, live: coinId, asOf, source };
    });
  }
  let coinRun = null;
  function coinShown(coinId) {
    if (!coinRun) {
      coinRun = new Set();
      Promise.resolve().then(() => { coinRun = null; });
    }
    if (coinRun.has(coinId)) return false;
    coinRun.add(coinId);
    return true;
  }
  const coinWanted = new Set();
  const MADE_UP_SOURCES = new Set(['fallback']);
  function keepCoin(coinId, tf, value) {
    if (MADE_UP_SOURCES.has(value.source)) return;
    if (lineCurrent(value.points, tf, value.asOf)) keepChart(COIN_STORE + coinId + ':' + tf, value, true);
  }
  const coinHeld = (hit, tf) => !!hit && (hit.at > 0 || lineCurrent(hit.value.points, tf, hit.value.asOf));
  const heldCoinCopy = (hit, coinId) => ({ points: hit.value.points, candles: hit.value.candles, stale: true, live: coinId });

  const TOKEN_ID = /^[a-z0-9-]{1,24}:[\w.:-]{1,128}$/;
  const RISKS = new Set(['none', 'low_liquidity', 'no_liquidity', 'suspicious']);
  const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180f\u200b-\u200f\u2028-\u202e\u2060-\u206f\u2800\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb\u{1bca0}-\u{1bca3}\u{1d173}-\u{1d17a}\u{e0000}-\u{e0fff}]/gu;
  const MARKUP = /[<>&"'`]/g;
  function cleanText(v, max) {
    if (typeof v !== 'string') return '';
    return Array.from(v.replace(INVISIBLE, '').replace(MARKUP, '').trim()).slice(0, max).join('');
  }
  const CONFUSABLE = new Map(Object.entries({
  а: 'a', в: 'b', г: 'r', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o', п: 'n', р: 'p', с: 'c', т: 't', у: 'y', х: 'x', ь: 'b', і: 'l', ј: 'j', ѕ: 's',
  ԁ: 'd', ԛ: 'q', ԝ: 'w', һ: 'h', ӏ: 'l', ү: 'y', ұ: 'y', ғ: 'f', ԍ: 'g', ԃ: 'd', ѡ: 'w', ѵ: 'v', ҷ: 'y',
  Α: 'a', Β: 'b', Ε: 'e', Ζ: 'z', Η: 'h', Ι: 'l', Κ: 'k', Μ: 'm', Ν: 'n', Ο: 'o', Ρ: 'p', Τ: 't', Υ: 'y', Χ: 'x',
  α: 'a', β: 'b', γ: 'y', ε: 'e', η: 'n', ι: 'l', κ: 'k', μ: 'u', ν: 'v', ο: 'o', ρ: 'p', σ: 'o', τ: 't', υ: 'u', χ: 'x', ω: 'w', ϲ: 'c', ϳ: 'j', ϱ: 'p',
  Ս: 'u', ս: 'u', Օ: 'o', օ: 'o', հ: 'h', ո: 'n', Լ: 'l', զ: 'q', ց: 'g', Տ: 's', Ւ: 'l', ա: 'w',
  Ꭺ: 'a', Ᏼ: 'b', Ꮯ: 'c', Ꭰ: 'd', Ꭼ: 'e', Ꮐ: 'g', Ꮋ: 'h', Ꭵ: 'l', Ꭻ: 'j', Ꮶ: 'k', Ꮮ: 'l', Ꮇ: 'm', Ꮻ: 'o', Ꮎ: 'o', Ꮲ: 'p', Ꭱ: 'r', Ꮪ: 's', Ꮥ: 's', Ꭲ: 't', Ꮩ: 'v', Ꮃ: 'w', Ꮤ: 'w', Ꮓ: 'z', Ꮍ: 'y',
  Ⲁ: 'a', Ⲃ: 'b', Ⲥ: 'c', Ⲇ: 'd', Ⲉ: 'e', Ⲏ: 'h', Ⲓ: 'l', Ⲕ: 'k', Ⲙ: 'm', Ⲛ: 'n', Ⲟ: 'o', Ⲣ: 'p', Ⲧ: 't', Ⲩ: 'y', Ⲭ: 'x', Ⲱ: 'w',
  ᴀ: 'a', ʙ: 'b', ᴄ: 'c', ᴅ: 'd', ᴇ: 'e', ꜰ: 'f', ɢ: 'g', ʜ: 'h', ɪ: 'l', ᴊ: 'j', ᴋ: 'k', ʟ: 'l', ᴍ: 'm', ɴ: 'n', ᴏ: 'o', ᴘ: 'p', ʀ: 'r', ꜱ: 's', ᴛ: 't', ᴜ: 'u', ᴠ: 'v', ᴡ: 'w', ʏ: 'y', ᴢ: 'z',
  ɑ: 'a', ɐ: 'a', ɡ: 'g', ɩ: 'l', ɵ: 'o', ɔ: 'c', ʋ: 'v', ı: 'l', ȷ: 'j', ɾ: 'r', ʂ: 's', ʐ: 'z',
  ø: 'o', đ: 'd', ð: 'd', ħ: 'h', ł: 'l', ƀ: 'b', ɨ: 'l', ŧ: 't', ƶ: 'z', ɇ: 'e', ɍ: 'r', ƚ: 'l', ɏ: 'y', ǥ: 'g', ȼ: 'c', ƒ: 'f',
  ƭ: 't', ƫ: 't', ʈ: 't', ɓ: 'b', ɗ: 'd', ƙ: 'k', ŋ: 'n', ɦ: 'h', ɱ: 'm', ƈ: 'c', ɠ: 'g', ƥ: 'p', ʠ: 'q', ƴ: 'y', ȥ: 'z', ꞵ: 'b',
  $: 's', '₮': 't', '₿': 'b', '¢': 'c', '€': 'e', '¥': 'y', '@': 'a', '|': 'l', '0': 'o', '1': 'l', '5': 's', i: 'l'
}));
  function skeletonOf(text) {
    let out = '';
    for (const ch of String(text).normalize('NFKD').replace(INVISIBLE, '').replace(/\p{M}/gu, '')) {
      const lower = ch.toLowerCase();
      out += CONFUSABLE.get(ch) || CONFUSABLE.get(ch.toUpperCase()) || CONFUSABLE.get(lower) || lower;
    }
    return out.replace(/[^\p{L}\p{N}]/gu, '').replace(/rn/g, 'm').replace(/vv/g, 'w');
  }
  const RESERVED_COINS = new Map([
    ['ton', ['ton', 'toncoin', 'gram', 'tongram', 'gramcoin']],
    ['usdt', ['usdt', 'tether', 'tetherusd', 'usdtether', 'tetherusdt']],
    ['not', ['not', 'notcoin']],
    ['btc', ['btc', 'bitcoin']],
    ['eth', ['eth', 'ethereum', 'ether']],
    ['sol', ['sol', 'solana']],
    ['bnb', ['bnb', 'binancecoin']],
    ['xrp', ['xrp', 'ripple']],
    ['doge', ['doge', 'dogecoin']],
    ['usdc', ['usdc', 'usdcoin']],
    ['trx', ['trx', 'tron']]
  ].flatMap(([coin, words]) => words.map((word) => [skeletonOf(word), coin])));
  const reservedCoinOf = (text) => RESERVED_COINS.get(skeletonOf(text)) || null;
  function mixedScript(text) {
    const letters = String(text).normalize('NFKD').replace(/\p{M}/gu, '').match(/\p{L}/gu) || [];
    const latin = letters.some((ch) => /[A-Za-z]/.test(ch));
    return latin && letters.some((ch) => !/\p{Script=Latin}/u.test(ch) && /^[a-z]$/.test(CONFUSABLE.get(ch) || CONFUSABLE.get(ch.toUpperCase()) || CONFUSABLE.get(ch.toLowerCase()) || ''));
  }
  function passesForCoin(symbol, name, listed) {
    const sym = typeof symbol === 'string' ? symbol : '';
    if (reservedCoinOf(sym) || mixedScript(sym)) return true;
    return listed !== true && typeof name === 'string' && !!reservedCoinOf(name);
  }
  const numberOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  function httpsUrl(v) {
    if (typeof v !== 'string' || v.length > 2048) return null;
    try { return new URL(v).protocol === 'https:' ? v : null; } catch (_) { return null; }
  }
  const cachedLogo = (id) => 'api/logos?id=' + encodeURIComponent(id);
  const hasLogoCache = () => status !== 'demo';
  const ROUGH_POINTS = 25;
  function cleanSpark(raw) {
    if (!raw || !Array.isArray(raw.v) || raw.v.length < 2 || raw.v.length > 64 || !raw.v.every((p) => numberOrNull(p) > 0)) return null;
    if (Array.isArray(raw.at)) {
      const at = raw.at, n = at.length;
      if (n !== raw.v.length || !at.every((t, i) => numberOrNull(t) !== null && (!i || t > at[i - 1]))) return null;
      const points = [];
      for (let i = 0, j = 0; i < ROUGH_POINTS; i++) {
        const t = at[0] + (at[n - 1] - at[0]) * i / (ROUGH_POINTS - 1);
        while (j < n - 2 && at[j + 1] < t) j++;
        points.push([t, raw.v[j] + (raw.v[j + 1] - raw.v[j]) * (t - at[j]) / (at[j + 1] - at[j])]);
      }
      return points;
    }
    const from = numberOrNull(raw.from), to = numberOrNull(raw.to);
    if (from === null || to === null || to <= from) return null;
    const step = (to - from) / (raw.v.length - 1);
    return raw.v.map((p, i) => [from + i * step, p]);
  }
  function cleanToken(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !TOKEN_ID.test(raw.id)) return null;
    const address = cleanText(raw.address, 128);
    const symbol = cleanText(raw.symbol, 24) || cleanText(raw.name, 24) || address.slice(0, 6) || '?';
    const price = numberOrNull(raw.price);
    return {
      id: raw.id,
      network: cleanText(raw.network, 24),
      address,
      symbol,
      name: cleanText(raw.name, 64) || symbol,
      logo: hasLogoCache() ? cachedLogo(raw.id) : httpsUrl(raw.logo),
      logoAlt: hasLogoCache() ? null : httpsUrl(raw.logoAlt),
      spark: cleanSpark(raw.spark),
      price: price > 0 ? price : null,
      change24h: numberOrNull(raw.change24h),
      volume24h: numberOrNull(raw.volume24h),
      liquidity: numberOrNull(raw.liquidity),
      risk: RISKS.has(raw.risk) ? raw.risk : 'none',
      ...(raw.unverified === true ? { unverified: true } : {}),
      ...floorField(raw)
    };
  }
  function floorField(raw) {
    if (!raw || raw.floor === undefined) return {};
    const floor = numberOrNull(raw.floor);
    return { floor: floor > 0 ? floor : null, floorAt: Date.now() };
  }
  function cleanPrice(raw) {
    if (!raw || typeof raw.id !== 'string' || !TOKEN_ID.test(raw.id)) return null;
    const price = numberOrNull(raw.price);
    return { id: raw.id, price: price > 0 ? price : null, change24h: numberOrNull(raw.change24h), ...floorField(raw) };
  }
  function cleanNetwork(raw) {
    const id = raw && typeof raw.id === 'string' && /^[a-z0-9-]{1,24}$/.test(raw.id) ? raw.id : null;
    if (!id) return null;
    return { id, name: cleanText(raw.name, 32) || id, logo: hasLogoCache() ? cachedLogo('network:' + id) : httpsUrl(raw.logo), total: numberOrNull(raw.total) };
  }
  function cleanTokenChart(body) {
    return {
      points: (Array.isArray(body.points) ? body.points : []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])),
      candles: cleanCandles(body.candles),
      stale: !!body.stale,
      rough: body.rough === true,
      noTrades: body.noTrades === true,
      asOf: Number.isFinite(body.asOf) && body.asOf > 0 ? body.asOf : null,
      serverNow: Number.isFinite(body.serverNow) && body.serverNow > 0 ? body.serverNow : null
    };
  }
  const tokenQuery = (params) => {
    const query = new URLSearchParams();
    ['network', 'sort', 'q', 'cursor', 'limit'].forEach((key) => {
      const v = params[key];
      const text = key === 'q' ? cleanText(String(v === undefined || v === null ? '' : v), SEARCH_MAX).slice(0, SEARCH_MAX) : v;
      if (text !== undefined && text !== null && text !== '') query.set(key, String(text));
    });
    return query.toString();
  };
  function demoTokens() {
    const api = window.DemoData && window.DemoData.tokenApi;
    if (!api) throw new Error('no_demo_data');
    return api;
  }
  const tokenKlineCache = new Map();
  const tokenKlineJobs = new Map();
  const tokenKlinePrefetches = new Set();
  const TOKEN_KLINES_KEPT = 120;

  const RETRY_WAIT_MS = 2 * 60000;
  const MARKS_KEPT = 200;
  const staleAnswered = new Map();
  const pendingFrames = new Map();
  function mark(marks, key) {
    marks.delete(key);
    marks.set(key, Date.now());
    if (marks.size > MARKS_KEPT) marks.delete(marks.keys().next().value);
  }
  const marked = (marks, key) => {
    const at = marks.get(key);
    return !!at && Date.now() - at < RETRY_WAIT_MS;
  };

  const WAIT_MAX_MS = 60000;
  const WAITS_OPEN_MAX = 40;
  const BEACON_MAX = 10;
  const BEACON_GAP_MS = 30000;
  const BEACON_CHECK_MS = 5000;
  const chartWaits = new Map();
  const waitsEnded = new Map();
  const waitSamples = [];
  let beaconAt = -Infinity;
  function waitAsked(key) {
    if (market.mode !== 'live') return;
    const open = chartWaits.get(key);
    if (open && Date.now() - open.at <= WAIT_MAX_MS) return;
    if (open) endWait(key, open);
    if (marked(waitsEnded, key)) {
      mark(waitsEnded, key);
      return;
    }
    waitsEnded.delete(key);
    chartWaits.set(key, { at: Date.now(), first: null });
    if (chartWaits.size > WAITS_OPEN_MAX) {
      const [oldest, held] = chartWaits.entries().next().value;
      endWait(oldest, held);
    }
  }
  function waitAnswered(key, value) {
    const open = chartWaits.get(key);
    if (!open) return;
    const ms = Date.now() - open.at;
    if (ms < 0) {
      chartWaits.delete(key);
      return;
    }
    if (ms > WAIT_MAX_MS) {
      endWait(key, open);
      return;
    }
    const drawn = value.points.length >= 2;
    if (drawn && open.first === null) open.first = ms;
    if (drawn && !value.stale && !value.rough) {
      chartWaits.delete(key);
      queueWait(open.first, ms);
      if (waitSamples.length >= BEACON_MAX) sendWaits();
    } else if (!drawn && value.noTrades) {
      chartWaits.delete(key);
    }
  }
  function endWait(key, open) {
    chartWaits.delete(key);
    mark(waitsEnded, key);
    queueWait(open.first, null);
  }
  function queueWait(first, fresh) {
    waitSamples.push([first, fresh]);
    if (waitSamples.length > BEACON_MAX * 2) waitSamples.shift();
  }
  function sendWaits(leaving) {
    const now = Date.now();
    chartWaits.forEach((open, key) => {
      if (leaving === true || now - open.at > WAIT_MAX_MS) endWait(key, open);
    });
    if (!waitSamples.length || market.mode !== 'live') return;
    if (leaving !== true && now - beaconAt < BEACON_GAP_MS) return;
    beaconAt = now;
    do {
      const body = JSON.stringify({ s: waitSamples.splice(0, BEACON_MAX) });
      try {
        fetch('api/metrics/chart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
      } catch (_) { }
    } while (leaving === true && waitSamples.length);
  }
  let leftAt = 0;
  function waitsLeft() {
    leftAt = Date.now();
    sendWaits(true);
  }
  function waitsBack() {
    if (!leftAt) return;
    const now = Date.now();
    waitsEnded.forEach((at, key) => {
      if (leftAt - at < RETRY_WAIT_MS) waitsEnded.set(key, now);
    });
    leftAt = 0;
  }
  const LINE_LAG_MS = { '1h': 15 * 60000, '1d': 3 * 3600000, '1w': 18 * 3600000, '1m': 4 * 864e5, '1y': 8 * 864e5 };
  let clockSkew = 0, clockHeard = false;
  function noteServerClock(at) {
    if (!(Number.isFinite(at) && at > 0)) return;
    clockSkew = at - Date.now();
    clockHeard = true;
  }
  const serverNow = () => Date.now() + clockSkew;
  const currentAt = (points, lag, asOf, now) => {
    if (asOf > 0) return now - asOf <= lag;
    if (!points || points.length < 2) return true;
    return now - points[points.length - 1][0] <= lag;
  };
  const lineCurrent = (points, tf, asOf) => {
    const lag = LINE_LAG_MS[tf];
    if (!lag || !currentAt(points, lag, asOf, serverNow())) return false;
    return clockHeard || !clockSkew || currentAt(points, lag, asOf, Date.now());
  };
  const heldCurrent = (hit, tf) => !!hit && (hit.value.rough || lineCurrent(hit.value.points, tf, hit.value.asOf));

  const CHART_STORE_KEY = 'ck-charts1:';
  const CHART_STORE_MAX = 18;
  const CHART_STORE_COINS = 9;
  const COIN_STORE = 'coin:';
  const coinKey = /^coin:([a-z0-9-]{1,24}):(1h|1d|1w|1m|1y)$/;
  const storeCap = (key) => (key.startsWith(COIN_STORE) ? CHART_STORE_COINS : CHART_STORE_MAX);
  const CHART_STORE_PER_TOKEN = 3;
  const CHART_STORE_BYTES = 240 * 1024;
  const CHART_STORE_ROOM = 32 * 1024;
  const CHART_STORE_WRITE_MS = 1500;
  const CHART_STORE_RENEW_MS = 60 * 1000;
  let chartStore = null, chartStoreMode = null, chartStoreTimer = 0;
  const chartKey = /^([a-z0-9-]{1,24}:[\w.:-]{1,128}):(1h|1d|1w|1m|1y)$/;
  const cleanPoints = (rows) => (Array.isArray(rows) ? rows.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) : []);
  function loadChartStore() {
    if (chartStore && chartStoreMode === market.mode) return;
    chartStore = new Map();
    chartStoreMode = market.mode;
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(CHART_STORE_KEY + market.mode) || 'null'); } catch (_) { raw = null; }
    if (!raw || raw.v !== 1 || raw.mode !== market.mode || !Array.isArray(raw.items)) return;
    if (!clockHeard && Number.isFinite(raw.skew)) clockSkew = raw.skew;
    const counted = { coin: 0, token: 0 };
    const items = raw.items.filter((item) => Array.isArray(item) && typeof item[0] === 'string').reverse().filter((item) => {
      const kind = item[0].startsWith(COIN_STORE) ? 'coin' : 'token';
      return ++counted[kind] <= storeCap(item[0]);
    }).reverse();
    items.forEach((item) => {
      if (item.length < 4) return;
      const coin = coinKey.exec(item[0]);
      const m = coin ? null : chartKey.exec(item[0]);
      const points = cleanPoints(item[2]);
      const asOf = Number.isFinite(item[1]) && item[1] > 0 ? item[1] : null;
      if (!(coin || (m && TOKEN_ID.test(m[1]))) || points.length < 2 || !asOf) return;
      const candles = cleanCandles(item[3]);
      const value = coin ? { points, candles, stale: true, live: coin[1], asOf } : { points, candles, stale: true, rough: false, noTrades: false, live: m[1], asOf };
      const cache = coin ? klineCache : tokenKlineCache;
      const at = coin ? coin[1] + ':' + coin[2] : item[0];
      chartStore.set(item[0], value);
      if (!cache.has(at)) cache.set(at, { at: 0, value });
    });
  }
  function keepChart(key, value, coin) {
    if (!chartStore || chartStoreMode !== market.mode || !value.asOf || value.rough || value.points.length < 2) return;
    if (key.startsWith(COIN_STORE) !== !!coin) return;
    const had = chartStore.get(key);
    if (had && (had === value || value.asOf - had.asOf < CHART_STORE_RENEW_MS)) return;
    chartStore.delete(key);
    chartStore.set(key, value);
    const token = key.slice(0, key.lastIndexOf(':') + 1);
    const own = [...chartStore.keys()].filter((k) => k.startsWith(token));
    own.slice(0, Math.max(0, own.length - CHART_STORE_PER_TOKEN)).forEach((k) => chartStore.delete(k));
    const kin = [...chartStore.keys()].filter((k) => k.startsWith(COIN_STORE) === !!coin);
    kin.slice(0, Math.max(0, kin.length - storeCap(key))).forEach((k) => chartStore.delete(k));
    if (chartStoreTimer) return;
    const mode = chartStoreMode, store = chartStore;
    chartStoreTimer = setTimeout(() => {
      chartStoreTimer = 0;
      const items = [];
      store.forEach((v, k) => items.push([k, v.asOf, v.points, v.candles || []]));
      let text = '';
      while (items.length) {
        text = JSON.stringify({ v: 1, mode, skew: Math.round(clockSkew), items });
        if (text.length <= CHART_STORE_BYTES) break;
        store.delete(items.shift()[0]);
      }
      try {
        if (items.length) {
          localStorage.setItem(CHART_STORE_KEY + mode, text + ' '.repeat(CHART_STORE_ROOM));
          localStorage.setItem(CHART_STORE_KEY + mode, text);
        } else localStorage.removeItem(CHART_STORE_KEY + mode);
      } catch (_) {
        try { localStorage.removeItem(CHART_STORE_KEY + mode); } catch (_) { }
      }
    }, CHART_STORE_WRITE_MS);
  }
  function holdChart(key, value, shown) {
    tokenKlineCache.delete(key);
    tokenKlineCache.set(key, { at: value.stale || value.rough ? 0 : Date.now(), value });
    if (tokenKlineCache.size > TOKEN_KLINES_KEPT) tokenKlineCache.delete(tokenKlineCache.keys().next().value);
    if (shown || (chartStore && chartStore.has(key))) keepChart(key, value);
    if (!value.stale && !value.rough) {
      staleAnswered.delete(key);
      pendingFrames.delete(key);
      waitsEnded.delete(key);
    }
  }
  function drawableNow(id, tf) {
    const hit = tokenKlineCache.get(id + ':' + tf);
    return !!hit && hit.value.points.length >= 2 && !hit.value.rough && heldCurrent(hit, tf);
  }
  function holdFrames(id, frames) {
    if (!frames || typeof frames !== 'object') return;
    Object.keys(FRAME_MS).forEach((tf) => {
      const raw = frames[tf];
      if (!raw || typeof raw !== 'object') return;
      const key = id + ':' + tf;
      if (raw.pending === true || raw.rough === true) mark(pendingFrames, key);
      else pendingFrames.delete(key);
      const value = cleanTokenChart(raw);
      if (value.points.length < 2 || value.rough || !lineCurrent(value.points, tf, value.asOf)) return;
      const hit = tokenKlineCache.get(key);
      if (hit && hit.at && value.stale && Date.now() - hit.at < KLINES_TTL_MS) return;
      holdChart(key, { points: value.points, candles: value.candles, stale: value.stale, rough: false, noTrades: false, live: id, asOf: value.asOf });
    });
  }
  const SEARCH_MAX = 70;
  const CLOSED_NET = 'tron';
  const onClosedNet = (t) => t.network === CLOSED_NET || t.id.startsWith(CLOSED_NET + ':');
  const networkNames = new Map();
  function rememberNetworks(list) {
    list.forEach((n) => networkNames.set(n.id, n.name));
    return list;
  }

  const ready = new Promise((resolve) => {
    if (!canGoLive) { resolve(); return; }
    const decide = () => {
      if (alwaysLive) {
        resolve();
        goLive();
        getJson('health', { timeout: HEALTH_MS }).catch(() => { if (!haveData) setStatus('down'); });
        return;
      }
      getJson('health', { timeout: HEALTH_MS })
        .then(() => {
          market.mode = 'live';
          resolve();
          goLive();
        })
        .catch(() => {
          setStatus('demo');
          settle();
          resolve();
        });
    };
    CK.appBuilt.then(decide);
  });

  let mePromise = null;

  const market = CK.market = {
    mode: alwaysLive ? 'live' : 'demo',
    ready,
    get status() { return status; },
    cleanToken,
    reservedCoinOf,
    mixedScript,
    passesForCoin,

    klines(coinId, tf) {
      const key = coinId + ':' + tf;
      const shown = coinShown(coinId);
      loadChartStore();
      const hit = klineCache.get(key);
      if (hit && Date.now() - hit.at < KLINES_TTL_MS) {
        if (shown) keepCoin(coinId, tf, hit.value);
        return Promise.resolve(hit.value);
      }
      if (shown) coinWanted.add(key);
      const started = !klineJobs.has(key);
      if (started) {
        const job = ready
          .then(() => (market.mode === 'live' ? liveKlines(coinId, tf) : demoKlines(coinId, tf)))
          .then((value) => {
            klineCache.set(key, { at: Date.now(), value });
            const kept = chartStore && chartStore.has(COIN_STORE + key);
            if (coinWanted.delete(key) || kept) keepCoin(coinId, tf, value);
            return value;
          })
          .catch((err) => {
            coinWanted.delete(key);
            const held = klineCache.get(key);
            if (coinHeld(held, tf)) return heldCoinCopy(held, coinId);
            throw err;
          })
          .finally(() => klineJobs.delete(key));
        klineJobs.set(key, job);
      }
      if (started && hit && !hit.at && coinHeld(hit, tf)) return Promise.resolve(heldCoinCopy(hit, coinId));
      return klineJobs.get(key);
    },

    networks() {
      return ready.then(() => {
        if (market.mode !== 'live') return demoTokens().networks().then(rememberNetworks);
        return getJson('tokens/networks').then((body) => {
          const list = rememberNetworks((Array.isArray(body.networks) ? body.networks : []).map(cleanNetwork).filter((n) => n && n.id !== CLOSED_NET));
          list.warming = body.warming === true;
          return list;
        });
      });
    },
    networkName(id) {
      return networkNames.get(id) || null;
    },
    tokens(params, signal) {
      return ready.then(() => {
        if (market.mode !== 'live') return demoTokens().tokens(params);
        return getJson('tokens?' + tokenQuery(params), { signal }).then((body) => {
          const rows = (Array.isArray(body.tokens) ? body.tokens : []).map(cleanToken).filter(Boolean);
          const tokens = rows.filter((t) => !onClosedNet(t));
          const total = numberOrNull(body.total);
          return {
            network: params.network,
            total: total === null ? null : Math.max(0, total - (rows.length - tokens.length)),
            nextCursor: typeof body.nextCursor === 'string' && body.nextCursor ? body.nextCursor : null,
            stale: !!body.stale,
            warming: body.warming === true,
            pending: body.pending === true,
            tokens
          };
        });
      });
    },
    tokenPrices(ids) {
      if (market.mode !== 'live' || !ids.length) return Promise.resolve([]);
      const sid = streamSid ? '&sid=' + streamSid : '';
      return getJson('tokens/prices?ids=' + ids.slice(0, PRICE_IDS_MAX).map(encodeURIComponent).join(',') + sid, { timeout: PRICES_MS })
        .then((body) => {
          const rows = (Array.isArray(body.prices) ? body.prices : []).map(cleanPrice).filter(Boolean);
          rows.forEach((row) => {
            if (row.floor !== undefined) notify(tokenFloorSubs, row.id, row.floor);
            if (row.price) notify(tokenPriceSubs, row.id, row.price);
          });
          return rows;
        });
    },
    tokenItem(id) {
      return ready.then(() => {
        if (market.mode !== 'live') return demoTokens().item(id);
        return getJson('tokens/item?id=' + encodeURIComponent(id)).then((body) => {
          if (body.token === null) throw new Error('not_found');
          const token = cleanToken(body.token);
          if (!token) throw new Error('bad_response');
          return { token, pool: body.pool };
        });
      });
    },
    tokenQuote(id, side, usd) {
      return ready.then(() => {
        if (market.mode !== 'live') throw new Error('demo');
        return getJson('tokens/quote?id=' + encodeURIComponent(id) + '&side=' + side + '&usd=' + encodeURIComponent(Number(usd.toFixed(6))));
      }).then((body) => {
        if (body.none) return { none: true };
        const price = numberOrNull(body.price), spot = numberOrNull(body.spot), impact = numberOrNull(body.impact);
        if (!(price > 0) || !(spot > 0) || impact === null) throw new Error('bad_response');
        return { price, spot, impact, moved: numberOrNull(body.moved), estimate: body.estimate === true, unsure: body.unsure === true };
      });
    },
    tokenKlines(id, tf, o) {
      const key = id + ':' + tf;
      loadChartStore();
      const hit = tokenKlineCache.get(key);
      if (hit && Date.now() - hit.at < KLINES_TTL_MS) {
        keepChart(key, hit.value);
        waitAnswered(key, hit.value);
        return Promise.resolve(hit.value);
      }
      waitAsked(key);
      if (tokenKlineJobs.has(key)) return tokenKlineJobs.get(key);
      const want = o && o.frames ? Object.keys(FRAME_MS).filter((f) => f !== tf && !drawableNow(id, f)) : [];
      const all = want.length > 0;
      const wait = marked(staleAnswered, key) ? '&wait=1' : '';
      const job = ready.then(() => {
        if (market.mode !== 'live') return demoTokens().klines(id, tf);
        return getJson('tokens/klines?id=' + encodeURIComponent(id) + '&tf=' + encodeURIComponent(tf) + (all ? '&frames=all&want=' + want.join(',') : '') + wait).then((body) => {
          noteServerClock(body.serverNow);
          if (all) holdFrames(id, body.frames);
          return cleanTokenChart(body);
        }, (err) => {
          if (all && err.body) {
            noteServerClock(err.body.serverNow);
            holdFrames(id, err.body.frames);
          }
          throw err;
        });
      }).then((value) => {
        noteServerClock(value.serverNow);
        const points = value.points || [];
        if (points.length < 2 && value.noTrades !== true) throw new Error('busy');
        if (points.length >= 2 && !value.rough && !lineCurrent(points, tf, value.asOf)) throw new Error('busy');
        const result = { points, candles: value.candles || [], stale: !!value.stale, rough: !!value.rough, noTrades: value.noTrades === true, live: id, asOf: value.asOf || null };
        holdChart(key, result, true);
        if (points.length >= 2 && (result.stale || result.rough)) mark(staleAnswered, key);
        waitAnswered(key, result);
        return result;
      }).catch((err) => {
        if (hit && hit.value.points.length && heldCurrent(hit, tf)) return { points: hit.value.points, candles: hit.value.candles, stale: true, rough: !!hit.value.rough, live: id };
        throw err;
      }).finally(() => tokenKlineJobs.delete(key));
      tokenKlineJobs.set(key, job);
      return job;
    },
    tokenChartNow(id, tf) {
      loadChartStore();
      return drawableNow(id, tf) ? tokenKlineCache.get(id + ':' + tf).value.points : null;
    },
    tokenCandlesNow(id, tf) {
      loadChartStore();
      const hit = tokenKlineCache.get(id + ':' + tf);
      return hit && !hit.value.rough && heldCurrent(hit, tf) ? hit.value.candles : null;
    },
    lineCurrent,
    serverNow,
    prefetchToken(id, tf) {
      const key = id + ':' + tf;
      const hit = tokenKlineCache.get(key);
      if (market.mode !== 'live' || tokenKlineJobs.has(key) || tokenKlinePrefetches.has(key) || (hit && Date.now() - hit.at < KLINES_TTL_MS)) return;
      tokenKlinePrefetches.add(key);
      getJson('tokens/klines?prefetch=1&id=' + encodeURIComponent(id) + '&tf=' + encodeURIComponent(tf)).then((body) => {
        const value = cleanTokenChart(body);
        noteServerClock(value.serverNow);
        if (value.points.length < 2 || value.rough || !lineCurrent(value.points, tf, value.asOf)) return;
        holdChart(key, { points: value.points, candles: value.candles, stale: value.stale, rough: false, noTrades: false, live: id, asOf: value.asOf });
      }).catch(() => {}).finally(() => tokenKlinePrefetches.delete(key));
    },
    prefetchFrames(id, tf) {
      loadChartStore();
      const missing = () => Object.keys(FRAME_MS).filter((f) => !drawableNow(id, f));
      const key = id + ':frames';
      const want = missing();
      if (market.mode !== 'live' || !want.length || tokenKlinePrefetches.has(key)) return Promise.resolve(want);
      tokenKlinePrefetches.add(key);
      const wait = want.some((f) => marked(pendingFrames, id + ':' + f)) ? '&wait=1' : '';
      return getJson('tokens/klines?prefetch=1&frames=all&want=' + want.join(',') + '&id=' + encodeURIComponent(id) + '&tf=' + encodeURIComponent(tf) + wait).then((body) => {
        noteServerClock(body.serverNow);
        holdFrames(id, body.frames);
      }).catch(() => {}).finally(() => tokenKlinePrefetches.delete(key)).then(missing);
    },

    onLive(id, fn) {
      const coin = (coinId, tick) => { if (coinId === id && tick.price > 0) fn(tick.price); };
      const token = (tokenId, price) => { if (tokenId === id) fn(price); };
      tickerSubs.add(coin);
      tokenPriceSubs.add(token);
      return () => {
        tickerSubs.delete(coin);
        tokenPriceSubs.delete(token);
      };
    },
    onTicker(fn) {
      tickerSubs.add(fn);
      return () => tickerSubs.delete(fn);
    },
    onTokenFloor(fn) {
      tokenFloorSubs.add(fn);
      return () => tokenFloorSubs.delete(fn);
    },
    onTokenTick(fn) {
      tokenTickSubs.add(fn);
      return () => tokenTickSubs.delete(fn);
    },
    get streamId() { return streamSid; },
    onStream(fn) {
      streamSubs.add(fn);
      return () => streamSubs.delete(fn);
    },
    emit(coinId, tick) { notify(tickerSubs, coinId, tick); },

    onCoins(fn) {
      coinSubs.add(fn);
      return () => coinSubs.delete(fn);
    },

    me() {
      if (mePromise) return mePromise;
      mePromise = ready
        .then(() => CK.tg.whenInitData())
        .then((initData) => {
          if (market.mode !== 'live' || !initData) return null;
          return getJson('me', { headers: { Authorization: 'tma ' + initData } }).then((body) => body.user || null);
        })
        .catch(() => {
          mePromise = null;
          return null;
        });
      return mePromise;
    }
  };
})();
