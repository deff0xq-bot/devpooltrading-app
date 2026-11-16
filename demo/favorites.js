(function() {
  "use strict";
  const D = window.DemoData;
  const LOCAL_KEY = "ck-favorites";
  const CLOUD_KEY = "favorites";
  const VERSION = 1;
  const MAX = 40;
  const TOKENS_MAX = 25;
  const CLOUD_CHARS_MAX = 4e3;
  const COIN_ID = /^[a-z0-9]{1,16}$/;
  const TOKEN_ID = /^[a-z0-9-]{1,24}:[\w.:-]{1,128}$/;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const isCoinId = (id) => typeof id === "string" && COIN_ID.test(id) && own(D.byId, id);
  const isTokenId = (id) => typeof id === "string" && TOKEN_ID.test(id);
  const finite = (v) => typeof v === "number" && Number.isFinite(v);
  const text = (v, max) => typeof v === "string" ? Array.from(v).slice(0, max).join("") : "";
  let ids = D.coins.filter((c) => c.favorite).map((c) => c.id);
  let at = 0;
  const records =   new Map();
  const subs =   new Set();
  function cleanIds(list) {
    if (!Array.isArray(list)) return null;
    const out = [];
    let tokens = 0;
    list.forEach((id) => {
      if (out.length >= MAX || out.includes(id)) return;
      if (isCoinId(id)) out.push(id);
      else if (isTokenId(id) && tokens < TOKENS_MAX) {
        out.push(id);
        tokens++;
      }
    });
    return out;
  }
  function cleanRecord(id, r) {
    if (!r || typeof r !== "object") return null;
    const colon = id.indexOf(":");
    const sym = text(r.sym, 24);
    if (!sym) return null;
    return {
      sym,
      name: text(r.name, 64) || sym,
      network: id.slice(0, colon),
      address: id.slice(colon + 1),
      price: finite(r.price) && r.price > 0 ? r.price : null,
      change: finite(r.change) ? r.change : null
    };
  }
  function readLocal() {
    try {
      const kept = JSON.parse(localStorage.getItem(LOCAL_KEY));
      if (!kept || kept.v !== VERSION) return;
      const list = cleanIds(kept.ids);
      if (!list) return;
      ids = list;
      at = finite(kept.at) ? kept.at : 0;
      if (kept.tokens && typeof kept.tokens === "object") {
        ids.forEach((id) => {
          const r = isTokenId(id) && own(kept.tokens, id) ? cleanRecord(id, kept.tokens[id]) : null;
          if (r) records.set(id, r);
        });
      }
    } catch (_) {
    }
  }
  function writeLocal() {
    const tokens = {};
    ids.forEach((id) => {
      if (records.has(id)) tokens[id] = records.get(id);
    });
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ v: VERSION, at, ids, tokens }));
    } catch (_) {
    }
  }
  function cloud() {
    try {
      const app = CK.tg.app;
      return app && app.CloudStorage && app.isVersionAtLeast && app.isVersionAtLeast("6.9") ? app.CloudStorage : null;
    } catch (_) {
      return null;
    }
  }
  function cloudText() {
    const list = ids.slice();
    let value = JSON.stringify({ v: VERSION, at, ids: list });
    while (value.length > CLOUD_CHARS_MAX && list.length) {
      list.pop();
      value = JSON.stringify({ v: VERSION, at, ids: list });
    }
    return value;
  }
  function writeCloud() {
    const store = cloud();
    try {
      if (store) store.setItem(CLOUD_KEY, cloudText(), () => {
      });
    } catch (_) {
    }
  }
  function markCoins() {
    D.coins.forEach((c) => {
      c.favorite = ids.includes(c.id);
    });
  }
  function changed() {
    markCoins();
    subs.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    });
  }
  const asking =   new Set();
  function learn(id) {
    if (records.has(id) || asking.has(id) || D.instruments.has(id)) return;
    asking.add(id);
    CK.market.tokenItem(id).then((body) => {
      if (!ids.includes(id)) return;
      remember(D.instrumentOf(body.token));
      writeLocal();
      changed();
    }, () => {
    }).then(() => asking.delete(id));
  }
  function remember(inst) {
    if (!inst || !inst.isToken) return;
    records.set(inst.id, cleanRecord(inst.id, { sym: inst.sym, name: inst.name, price: inst.price, change: inst.change }) || records.get(inst.id));
  }
  let synced = false;
  function sync() {
    const store = cloud();
    if (synced || !store) return;
    synced = true;
    try {
      store.getItem(CLOUD_KEY, (err, value) => {
        if (err) return;
        let theirs = null;
        try {
          theirs = value ? JSON.parse(value) : null;
        } catch (_) {
        }
        const list = theirs && theirs.v === VERSION ? cleanIds(theirs.ids) : null;
        const theirAt = theirs && finite(theirs.at) ? theirs.at : 0;
        if (list && theirAt > at) {
          ids = list;
          at = theirAt;
          writeLocal();
          ids.forEach((id) => {
            if (isTokenId(id)) learn(id);
          });
          changed();
        } else if (at > theirAt) {
          writeCloud();
        }
      });
    } catch (_) {
    }
  }
  readLocal();
  markCoins();
  window.DemoFavorites = {

    can(inst) {
      if (!inst || inst.viewOnly || inst.gas) return false;
      return inst.isToken ? isTokenId(inst.id) : isCoinId(inst.id) && D.byId[inst.id] === inst;
    },
    has(inst) {
      return !!inst && ids.includes(inst.id);
    },

    toggle(inst) {
      if (!this.can(inst)) return null;
      if (ids.includes(inst.id)) {
        ids = ids.filter((id) => id !== inst.id);
        records.delete(inst.id);
      } else {
        if (cleanIds(ids.concat(inst.id)).length === ids.length) return null;
        ids = ids.concat(inst.id);
        remember(inst);
      }
      at = Date.now();
      writeLocal();
      writeCloud();
      changed();
      return ids.includes(inst.id);
    },

    tokens() {
      const out = [];
      ids.forEach((id) => {
        if (!isTokenId(id)) return;
        let inst = D.instruments.get(id);
        if (!inst) {
          const r = records.get(id);
          if (!r) {
            learn(id);
            return;
          }
          const token = CK.market.cleanToken({ id, network: r.network, address: r.address, symbol: r.sym, name: r.name });
          inst = token ? D.instrumentOf(token) : null;
        } else if (!records.has(id)) {
          remember(inst);
          writeLocal();
        }
        if (inst && inst.isToken) out.push(inst);
      });
      return out;
    },

    lastPrice(id) {
      const r = records.get(id);
      return r ? { price: r.price, change: r.change } : null;
    },

    keepPrices() {
      let moved = false;
      ids.forEach((id) => {
        const inst = records.has(id) && D.instruments.get(id);
        const r = inst && records.get(id);
        if (!r || !(inst.price > 0) || inst.price === r.price && inst.change === r.change) return;
        r.price = inst.price;
        r.change = finite(inst.change) ? inst.change : r.change;
        moved = true;
      });
      if (moved) writeLocal();
    },
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },

    start() {
      CK.tg.whenInitData().then(sync, sync);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.keepPrices();
      });
      addEventListener("pagehide", () => this.keepPrices());
    }
  };
})();
