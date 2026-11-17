(function () {
  'use strict';
  const KEY = 'ck-cost:';
  const CLOUD = 'ck_cost_';
  const VERSION = 1;
  const MAX_COINS = 40;
  const CLOUD_MAX_CHARS = 4096;
  const SETTLED_MS = 2 * 60 * 1000;
  const subs = new Set();
  const cache = new Map();
  const finite = (v) => typeof v === 'number' && Number.isFinite(v);
  const ID = /^[a-z0-9]{2,12}$|^[a-z0-9-]{2,20}:[A-Za-z0-9_:+\-/=]{10,90}$/;

  const cloud = () => {
    try {
      const app = window.Telegram && window.Telegram.WebApp;
      return app && app.isVersionAtLeast && app.isVersionAtLeast('6.9') ? app.CloudStorage : null;
    } catch (_) { return null; }
  };
  const cloudKey = (wallet) => CLOUD + String(wallet).replace(/^-?\d+:/, '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);

  function clean(raw) {
    const out = { v: VERSION, at: 0, c: {} };
    if (!raw || raw.v !== VERSION || typeof raw.c !== 'object' || !raw.c) return out;
    out.at = finite(raw.at) ? raw.at : 0;
    Object.keys(raw.c).forEach((id) => {
      const e = raw.c[id];
      if (!ID.test(id) || !e || !finite(e.a) || !finite(e.u)) return;
      const t = finite(e.t) ? e.t : 0;
      if (e.a > 0 && e.u >= 0) out.c[id] = { a: e.a, u: e.u, t };
      else if (e.a === 0 && e.u === 0 && t > 0) out.c[id] = { a: 0, u: 0, t };
    });
    return out;
  }
  const live = (e) => (e && e.a > 0 ? e : null);
  function merge(mine, theirs) {
    const out = { v: VERSION, at: Math.max(mine.at, theirs.at), c: { ...mine.c } };
    Object.keys(theirs.c).forEach((id) => {
      if (!out.c[id] || theirs.c[id].t > out.c[id].t) out.c[id] = theirs.c[id];
    });
    return out;
  }
  const newestFirst = (doc) => Object.keys(doc.c).sort((x, y) => (doc.c[y].a > 0) - (doc.c[x].a > 0) || doc.c[y].t - doc.c[x].t);
  const same = (x, y) => JSON.stringify(x.c) === JSON.stringify(y.c);
  function cloudText(doc) {
    const ids = newestFirst(doc);
    for (let n = ids.length; n >= 0; n--) {
      const c = {};
      ids.slice(0, n).forEach((id) => { c[id] = doc.c[id]; });
      const text = JSON.stringify({ v: doc.v, at: doc.at, c });
      if (text.length <= CLOUD_MAX_CHARS) return text;
    }
    return '';
  }
  const tell = () => subs.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  function keep(wallet, doc) {
    newestFirst(doc).slice(MAX_COINS).forEach((id) => { delete doc.c[id]; });
    cache.set(wallet, doc);
    try { localStorage.setItem(KEY + wallet, JSON.stringify(doc)); } catch (_) { }
  }
  function read(wallet) {
    if (cache.has(wallet)) return cache.get(wallet);
    let doc;
    try { doc = clean(JSON.parse(localStorage.getItem(KEY + wallet) || 'null')); } catch (_) { doc = clean(null); }
    cache.set(wallet, doc);
    sync(wallet);
    return doc;
  }
  function write(wallet, doc) {
    doc.at = Date.now();
    keep(wallet, doc);
    tell();
    sync(wallet);
  }
  function sync(wallet) {
    const cs = cloud();
    if (!cs) return;
    try {
      cs.getItem(cloudKey(wallet), (err, text) => {
        if (err) return;
        let theirs = clean(null);
        if (text) try { theirs = clean(JSON.parse(text)); } catch (_) { }
        const mine = cache.get(wallet) || clean(null);
        const both = merge(mine, theirs);
        if (!same(both, mine)) {
          keep(wallet, both);
          tell();
        }
        const now = cache.get(wallet);
        const out = Object.keys(now.c).length ? cloudText(now) : '';
        if (out && out !== text) try { cs.setItem(cloudKey(wallet), out, () => {}); } catch (_) { }
      });
    } catch (_) { }
  }

  window.DemoCost = {
    bought(wallet, coinId, amount, usd, before) {
      if (!wallet || !ID.test(String(coinId)) || !finite(amount) || !(amount > 0) || !finite(usd) || !(usd > 0)) return;
      const doc = read(wallet);
      let e = live(doc.c[coinId]);
      if (e && before && finite(before.held) && before.held >= 0 && finite(before.at) && before.at - e.t >= SETTLED_MS && before.held < e.a) {
        e = before.held > e.a * 1e-6 ? { a: before.held, u: e.u * (before.held / e.a) } : null;
      }
      doc.c[coinId] = { a: (e ? e.a : 0) + amount, u: (e ? e.u : 0) + usd, t: Date.now() };
      write(wallet, doc);
    },
    sold(wallet, coinId, amount) {
      if (!wallet || !ID.test(String(coinId)) || !finite(amount) || !(amount > 0)) return;
      const doc = read(wallet);
      const e = live(doc.c[coinId]);
      if (!e) return;
      const left = e.a - amount;
      if (left <= e.a * 1e-6) doc.c[coinId] = { a: 0, u: 0, t: Date.now() };
      else doc.c[coinId] = { a: left, u: e.u * (left / e.a), t: Date.now() };
      write(wallet, doc);
    },
    of(wallet, coinId) {
      if (!wallet) return null;
      const e = read(wallet).c[coinId];
      return e && e.a > 0 && e.u > 0 ? { amount: e.a, usd: e.u, price: e.u / e.a } : null;
    },
    gain(cost, held, price) {
      if (!cost || !finite(cost.amount) || !(cost.amount > 0) || !finite(cost.price) || !(cost.price > 0)) return null;
      if (!finite(held) || !(held > 0) || !finite(price) || !(price > 0)) return null;
      const amount = Math.min(held, cost.amount);
      return { amount, usd: (price - cost.price) * amount, pct: (price / cost.price - 1) * 100 };
    },
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    }
  };
})();
