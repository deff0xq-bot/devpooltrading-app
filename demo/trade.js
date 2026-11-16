(function() {
  "use strict";
  const { fmt, icon, t: tx, tr } = CK;
  const { L, LA, LP } = CK.i18n;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);
  if (CK.i18n && typeof CK.i18n.add === "function") {
    CK.i18n.add({
      "tk.yourBalance": ["\u0412\u0430\u0448 \u0431\u0430\u043B\u0430\u043D\u0441", "Your balance", "\u0412\u0430\u0448 \u0431\u0430\u043B\u0430\u043D\u0441", "\u0421\u0456\u0437\u0434\u0456\u04A3 \u0431\u0430\u043B\u0430\u043D\u0441\u044B\u04A3\u044B\u0437"],
      "tk.seeAll": ["\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0432\u0441\u0435", "See all", "\u0414\u0438\u0432\u0438\u0442\u0438\u0441\u044F \u0432\u0441\u0456", "\u0411\u0430\u0440\u043B\u044B\u0493\u044B\u043D \u043A\u04E9\u0440\u0443"],
      "tk.about": ["\u041E \u0442\u043E\u043A\u0435\u043D\u0435", "About", "\u041F\u0440\u043E \u0442\u043E\u043A\u0435\u043D", "\u0422\u043E\u043A\u0435\u043D \u0442\u0443\u0440\u0430\u043B\u044B"],
      "tk.expand": ["\u0415\u0449\u0451", "More", "\u0429\u0435", "\u0422\u0430\u0493\u044B"],
      "tk.collapse": ["\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C", "Less", "\u0417\u0433\u043E\u0440\u043D\u0443\u0442\u0438", "\u0416\u0438\u044E"],
      "tk.overview": ["\u041E\u0431\u0437\u043E\u0440", "Overview", "\u041E\u0433\u043B\u044F\u0434", "\u0428\u043E\u043B\u0443"],
      "tk.supply": ["\u041E\u0431\u0449\u0435\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435", "Total supply", "\u0417\u0430\u0433\u0430\u043B\u044C\u043D\u0430 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044F", "\u0416\u0430\u043B\u043F\u044B \u04B1\u0441\u044B\u043D\u044B\u0441"],
      "tk.circulating": ["\u0412 \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0438", "Circulating", "\u0412 \u043E\u0431\u0456\u0433\u0443", "\u0410\u0439\u043D\u0430\u043B\u044B\u043C\u0434\u0430"],
      "tk.activity": ["\u0422\u043E\u0440\u0433\u043E\u0432\u0430\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u0437\u0430 24 \u0447", "Trading activity, 24h", "\u0422\u043E\u0440\u0433\u043E\u0432\u0430 \u0430\u043A\u0442\u0438\u0432\u043D\u0456\u0441\u0442\u044C \u0437\u0430 24 \u0433\u043E\u0434", "\u0421\u0430\u0443\u0434\u0430 \u0431\u0435\u043B\u0441\u0435\u043D\u0434\u0456\u043B\u0456\u0433\u0456, 24 \u0441\u0430\u0493"],
      "tk.buys": ["\u041F\u043E\u043A\u0443\u043F\u043A\u0438 \xB7 {sum}", "Buys \xB7 {sum}", "\u041A\u0443\u043F\u0456\u0432\u043B\u0456 \xB7 {sum}", "\u0421\u0430\u0442\u044B\u043F \u0430\u043B\u0443 \xB7 {sum}"],
      "tk.sells": ["\u041F\u0440\u043E\u0434\u0430\u0436\u0438 \xB7 {sum}", "Sells \xB7 {sum}", "\u041F\u0440\u043E\u0434\u0430\u0436\u0456 \xB7 {sum}", "\u0421\u0430\u0442\u0443 \xB7 {sum}"],
      "tk.lastTrades": ["\u041F\u043E \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C {n} \u0441\u0434\u0435\u043B\u043A\u0430\u043C", "Last {n} trades", "\u0417\u0430 \u043E\u0441\u0442\u0430\u043D\u043D\u0456\u043C\u0438 {n} \u0443\u0433\u043E\u0434\u0430\u043C\u0438", "\u0421\u043E\u04A3\u0493\u044B {n} \u043C\u04D9\u043C\u0456\u043B\u0435 \u0431\u043E\u0439\u044B\u043D\u0448\u0430"],
      "tk.buysPct": ["\u041F\u043E\u043A\u0443\u043F\u043A\u0438 \xB7 {pct}", "Buys \xB7 {pct}", "\u041A\u0443\u043F\u0456\u0432\u043B\u0456 \xB7 {pct}", "\u0421\u0430\u0442\u044B\u043F \u0430\u043B\u0443 \xB7 {pct}"],
      "tk.sellsPct": ["\u041F\u0440\u043E\u0434\u0430\u0436\u0438 \xB7 {pct}", "Sells \xB7 {pct}", "\u041F\u0440\u043E\u0434\u0430\u0436\u0456 \xB7 {pct}", "\u0421\u0430\u0442\u0443 \xB7 {pct}"],
      "tk.srcBinance": ["\u041F\u043E \u0434\u0430\u043D\u043D\u044B\u043C Binance", "Binance data", "\u0417\u0430 \u0434\u0430\u043D\u0438\u043C\u0438 Binance", "Binance \u0434\u0435\u0440\u0435\u043A\u0442\u0435\u0440\u0456"],
      "tk.srcPool": ["\u041F\u043E \u043A\u0440\u0443\u043F\u043D\u0435\u0439\u0448\u0435\u043C\u0443 \u043F\u0443\u043B\u0443", "Deepest pool", "\u0417\u0430 \u043D\u0430\u0439\u0431\u0456\u043B\u044C\u0448\u0438\u043C \u043F\u0443\u043B\u043E\u043C", "\u0415\u04A3 \u0456\u0440\u0456 \u043F\u0443\u043B \u0431\u043E\u0439\u044B\u043D\u0448\u0430"],
      "tk.links": ["\u0421\u0441\u044B\u043B\u043A\u0438", "Links", "\u041F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F", "\u0421\u0456\u043B\u0442\u0435\u043C\u0435\u043B\u0435\u0440"],
      "tk.opIn": ["\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E", "Received", "\u041E\u0442\u0440\u0438\u043C\u0430\u043D\u043E", "\u0410\u043B\u044B\u043D\u0434\u044B"],
      "tk.opOut": ["\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E", "Sent", "\u041D\u0430\u0434\u0456\u0441\u043B\u0430\u043D\u043E", "\u0416\u0456\u0431\u0435\u0440\u0456\u043B\u0434\u0456"],
      "tk.per1h": ["\u0437\u0430 \u0447\u0430\u0441", "past hour", "\u0437\u0430 \u0433\u043E\u0434\u0438\u043D\u0443", "\u0441\u043E\u04A3\u0493\u044B \u0441\u0430\u0493\u0430\u0442\u0442\u0430"],
      "tk.per1d": ["\u0437\u0430 \u0441\u0443\u0442\u043A\u0438", "past day", "\u0437\u0430 \u0434\u043E\u0431\u0443", "\u0442\u04D9\u0443\u043B\u0456\u043A\u0442\u0435"],
      "tk.per1w": ["\u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E", "past week", "\u0437\u0430 \u0442\u0438\u0436\u0434\u0435\u043D\u044C", "\u0430\u043F\u0442\u0430\u0434\u0430"],
      "tk.per1m": ["\u0437\u0430 \u043C\u0435\u0441\u044F\u0446", "past month", "\u0437\u0430 \u043C\u0456\u0441\u044F\u0446\u044C", "\u0430\u0439\u0434\u0430"],
      "tk.per1y": ["\u0437\u0430 \u0433\u043E\u0434", "past year", "\u0437\u0430 \u0440\u0456\u043A", "\u0436\u044B\u043B\u0434\u0430"],

      "trade.allNets": ["\u0412\u0441\u0435 \u0441\u0435\u0442\u0438", "All networks", "\u0423\u0441\u0456 \u043C\u0435\u0440\u0435\u0436\u0456", "\u0411\u0430\u0440\u043B\u044B\u049B \u0436\u0435\u043B\u0456\u043B\u0435\u0440"],
      "trade.favNoneNet": ["\u0412 \u0441\u0435\u0442\u0438 {net} \u043D\u0435\u0442 \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E", "No favorites on {net}", "\u0423 \u043C\u0435\u0440\u0435\u0436\u0456 {net} \u043D\u0435\u043C\u0430\u0454 \u043E\u0431\u0440\u0430\u043D\u043E\u0433\u043E", "{net} \u0436\u0435\u043B\u0456\u0441\u0456\u043D\u0434\u0435 \u0442\u0430\u04A3\u0434\u0430\u0443\u043B\u044B \u0436\u043E\u049B"]
    });
  }
  const ROW_H = 72;
  const SLOT_TRANSLATE = typeof CSS !== "undefined" && !!CSS.supports && CSS.supports("translate", "0 1px");
  const OVERSCAN = 6;
  const PAGE_SIZE = 60;
  const FIRST_SKELETONS = 12;
  const TAIL_SKELETONS = 24;
  const AHEAD_ROWS = 120;
  const KEEP_PAGES = 8;
  const FAST_PX_PER_FRAME = 70;
  const SETTLE_MS = 120;
  const SEARCH_MS = 300;
  const SEARCH_PENDING_MS = 1200;
  const SEARCH_PENDING_TRIES = 2;
  const SKELETONS_AFTER_MS = 240;
  const LOGOS_WAIT_MS = 120;
  const FIRST_PAGE_FOR_MS = 3e5;
  const FIRST_PAGES_KEPT = 40;
  const LOGOS_WARMED = 11;
  const WARM_NETWORKS = 2;
  const OFFSCREEN_ROWS_PER_FRAME = 6;
  const REFRESH_MS = 3e4;
  const TICK_MS = 3500;
  const TICK_MIN_GAP_MS = 1500;
  const POLL_PARALLEL = 3;
  const POLL_MIN_GAP_MS = 1e4;
  const UNPRICED_AGAIN_MS = 6e4;
  const UP_BUTTON_AFTER_PX = 1600;
  const FAILED_LOGOS_KEPT = 2e3;
  const LOGO_RETRY_MS = 6e4;
  const RETRY_PAGE_MS = 5e3;
  const WARMING_RETRY_MS = 4e3;
  const WARMING_SLOW_RETRY_MS = 2e4;
  const WARMING_TRIES = 10;
  const CHART_RETRY_MS = [700, 1200, 2e3, 3500, 6e3, 1e4];
  const CHART_FINAL_ERRORS =   new Set(["bad_request", "not_found", "bad_id", "bad_tf"]);
  const FRAME_MS = { "1h": 36e5, "1d": 864e5, "1w": 6048e5, "1m": 2592e6, "1y": 31536e6 };
  const FRAME_FITS = [0.6, 1.25];
  const chartNow = () => CK.market && typeof CK.market.serverNow === "function" ? CK.market.serverNow() : Date.now();
  const SHORTER_LINE = 1.1;
  const PIN_MAX_GAP = 0.3;
  const PIN_REPLACE_MS = 6e4;
  const PREFETCH_FRAMES_MS = 400;
  const PREFETCH_ROUNDS_MS = [900, 1500, 2500, 4e3, 8e3];
  const PENDING_MAX_MS = 2500;
  const RAIL_RETRY_MS = 5e3;
  const RAIL_RETRY_SLOW_MS = 2e4;
  const RAIL_QUICK_TRIES = 24;
  const PREFETCH_ROWS = 6;
  const PREFETCH_AGAIN_MS = 6e4;
  const PREFETCHED_KEPT = 500;
  const POOL_PROBE_USD = 100;
  const POOL_RETRY_MS = 5e3;
  const POOL_WAIT_MS = 1500;
  const POOL_KEPT_MS = 3e5;
  let ctx = null;
  const FAV = "fav";
  const ALL_NETS = "all";
  const SORTS = [
    { value: "popular", key: "sort.top", aria: "sort.popular" },
    { value: "gainers", key: "trade.segUp", aria: "filter.up" },
    { value: "losers", key: "trade.segDown", aria: "filter.down" },
    { value: FAV, key: "filter.fav" }
  ];
  const NET_SHEET_H = 360;
  function safeBottom() {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;visibility:hidden;height:var(--safe-bottom)";
    document.body.appendChild(probe);
    const px = probe.offsetHeight;
    probe.remove();
    return px;
  }
  const HOME_NET = { eth: "eth", sol: "solana", bnb: "bsc", btc: "bitcoin", trx: "tron", ton: "ton" };
  const signedPct = (v) => CK.changeFlat(v) ? fmt.pctAbs(0) : fmt.pct(v);
  function chosenFirst(tokens, network) {
    const lead = (t) => t.network === network && t.price > 0;
    const mine = tokens.filter(lead);
    return mine.length && mine.length < tokens.length ? mine.concat(tokens.filter((t) => !lead(t))) : tokens;
  }
  function rowTag(t) {
    if (t.risk === "suspicious") return { key: "risk.bad", tone: "down" };
    if (t.unverified) return { key: "token.unverified", tone: "warn" };
    return null;
  }
  function sellOnlyMode(inst, holdings, buyable) {
    if (!inst || !inst.isToken || buyable(inst)) return null;
    return holdings.some((h) => h.coin === inst && !h.net && h.risk === "none") ? "sell" : "swap.refusedToken";
  }
  function noPriceKey(t) {
    if (t.risk === "no_liquidity") return "token.noTrades";
    const onTon = t.network === "ton" || String(t.id || "").startsWith("ton:");
    const audit = CK.swapAudit, ton = CK.ton;
    if (!onTon || !audit || typeof audit.swappable !== "function" || !ton || typeof ton.rawAddress !== "function") return "token.canBuy";
    const raw = ton.rawAddress(t.address);
    return raw && audit.swappable(raw) ? "token.canBuy" : null;
  }
  const noPriceText = (t) => {
    const key = noPriceKey(t);
    return key ? tx(key) : fmt.money("0");
  };
  function cardLevels({ order, cost, price, gramUsd }) {
    const levels = [];
    let row = null;
    if (order) {
      const now = price > 0 && gramUsd > 0 ? price / gramUsd : order.now;
      const pct = (p) => `${p < 0 ? "\u2212" : "+"}${fmt.num(Math.abs(p), Math.abs(p) >= 9.95 ? 0 : 1)}${CK.i18n.lang === "en" ? "%" : "\xA0%"}`;
      const parts = [];
      ["stop", "take"].forEach((kind) => {
        const at = order[kind];
        if (!(at > 0)) return;
        const name = tx(`orders.${kind}`);
        if (gramUsd > 0) levels.push({ price: at * gramUsd, kind, label: tx(kind === "stop" ? "chart.tipStop" : "chart.tipTake", { price: fmt.price(at * gramUsd) }) });
        if (order.quiet || !(now > 0)) {
          parts.push(name);
          return;
        }
        const p = (at / now - 1) * 100;
        parts.push(kind === "stop" && p >= 0 ? tx("orders.atStop") : `${name} ${pct(p)}`);
      });
      if (order.quiet) parts.push(tx(order.quiet === "halted" ? "orders.halted" : "orders.stalled"));
      row = parts.length ? parts.join(" \xB7 ") : null;
    }
    if (cost && cost.price > 0) levels.push({ price: cost.price, kind: "entry", label: tx("chart.tipEntry", { price: fmt.price(cost.price) }) });
    return { levels, row };
  }
  function shortAddress(a) {
    const chars = Array.from(a || "");
    return chars.length > 12 ? `${chars.slice(0, 5).join("")}\u2026${chars.slice(-4).join("")}` : chars.join("");
  }
  function logoSlot(url, sym, cls) {
    const slot = CK.el(`<span class="tk-logo ${cls || ""}"><span class="tk-tile" aria-hidden="true"></span><img class="tk-img" alt="" draggable="false" decoding="async" referrerpolicy="no-referrer"></span>`);
    slot.firstElementChild.textContent = CK.initials(sym);
    const img = slot.lastElementChild;
    img.addEventListener("load", () => img.classList.add("is-on"));
    img.addEventListener("error", () => img.removeAttribute("src"));
    if (url && CK.logos.ready(url)) {
      img.classList.add("is-on", "is-instant");
      img.decoding = "sync";
      img.src = CK.logos.src(url);
    } else if (url) {
      CK.logos.hold(url);
      img.src = url;
    }
    return slot;
  }
  const { instruments, applyToken, instrumentOf } = D;
  const watched =   new Map();
  function watch(inst) {
    if (inst.isToken) watched.set(inst.id, (watched.get(inst.id) || 0) + 1);
  }
  function unwatch(inst) {
    if (!inst.isToken) return;
    const n = (watched.get(inst.id) || 0) - 1;
    if (n > 0) watched.set(inst.id, n);
    else watched.delete(inst.id);
  }
  const priceAsked =   new Set(), askedListeners =   new Set();
  function markAsked(ids) {
    const fresh = ids.filter((id) => !priceAsked.has(id));
    if (!fresh.length) return;
    fresh.forEach((id) => priceAsked.add(id));
    askedListeners.forEach((fn) => fn(fresh));
  }
  const PRICE_SKEL = '<i class="skel tk-price-skel" aria-hidden="true"></i>';
  function refreshToken(inst) {
    return CK.market.tokenItem(inst.id).then((body) => {
      const before = inst.price;
      applyToken(inst, body.token);
      ctx.paintCoin(inst, !(inst.price < before));
    }).catch(() => {
    }).then(() => markAsked([inst.id]));
  }
  const poolAnswers =   new Map(), poolJobs =   new Map();
  function askPool(inst) {
    if (poolJobs.has(inst.id)) return poolJobs.get(inst.id);
    const job = CK.market.tokenQuote(inst.id, "buy", POOL_PROBE_USD).then((q) => {
      if (q.none) return false;
      if (!(inst.price > 0)) {
        applyToken(inst, { ...inst.token, price: q.spot });
        ctx.paintCoin(inst, true);
      }
      return q.unsure ? null : !q.estimate;
    }, () => null).then((found) => {
      poolJobs.delete(inst.id);
      if (found !== null) {
        if (poolAnswers.size >= PREFETCHED_KEPT) poolAnswers.clear();
        poolAnswers.set(inst.id, { found, at: Date.now() });
      }
      return found;
    });
    poolJobs.set(inst.id, job);
    return job;
  }
  function knownPool(inst) {
    const hit = poolAnswers.get(inst.id);
    return hit && Date.now() - hit.at < POOL_KEPT_MS ? hit.found : void 0;
  }
  let pollRunning = false, pollAt = 0;
  const unpricedAskedAt =   new Map();
  function pollTokens(onlyUnpriced) {
    if (document.hidden || pollRunning) return;
    const at = Date.now();
    if (onlyUnpriced !== true && at - pollAt < POLL_MIN_GAP_MS) return;
    const held = new Set(onlyUnpriced === true ? [] : watched.keys());
    D.holdings().forEach((h) => {
      if (!h.coin.isToken || h.coin.viewOnly) return;
      if (onlyUnpriced === true && (h.coin.price > 0 || at - (unpricedAskedAt.get(h.coin.id) || 0) < UNPRICED_AGAIN_MS)) return;
      held.add(h.coin.id);
    });
    const queue = Array.from(held).filter((id) => instruments.get(id));
    if (!queue.length) return;
    pollRunning = true;
    if (onlyUnpriced !== true) pollAt = at;
    queue.forEach((id) => {
      const inst = instruments.get(id);
      if (!(inst.price > 0)) unpricedAskedAt.set(id, at);
    });
    const worker = () => {
      const id = queue.shift();
      return id ? refreshToken(instruments.get(id)).then(worker) : Promise.resolve();
    };
    const workers = [];
    for (let i = 0; i < POLL_PARALLEL; i++) workers.push(worker());
    Promise.all(workers).then(() => ctx.valuesChanged()).finally(() => {
      pollRunning = false;
    });
  }
  function landTokenPrice(r) {
    const inst = instruments.get(r.id);
    if (!inst || !inst.isToken) return false;
    const price = r.price || inst.price;
    const change = r.change24h === null ? inst.change : r.change24h;
    if (price === inst.price && change === inst.change) return false;
    const before = inst.price;
    applyToken(inst, { ...inst.token, price, change24h: change });
    ctx.paintCoin(inst, !(inst.price < before));
    return true;
  }
  const STREAM_RENEW_MS = 12e3;
  function askedRecently(memo, ids) {
    const sid = CK.market.streamId;
    const key = ids.join(",") + "|" + (sid || "");
    if (sid && memo.key === key && Date.now() - memo.at < STREAM_RENEW_MS) return true;
    memo.key = key;
    memo.at = Date.now();
    return false;
  }
  const watchedAsk = { key: "", at: 0 };
  function tickWatched() {
    if (document.hidden) return;
    const ids = new Set(watched.keys());
    D.holdings().forEach((h) => {
      if (h.coin.isToken && !h.coin.viewOnly) ids.add(h.coin.id);
    });
    const asked = Array.from(ids);
    if (!ids.size || askedRecently(watchedAsk, asked)) return;
    CK.market.tokenPrices(asked).then((rows) => {
      let moved = false;
      rows.forEach((r) => {
        if (landTokenPrice(r)) moved = true;
      });
      if (moved) ctx.valuesChanged();
    }).catch(() => {
      watchedAsk.at = 0;
    }).then(() => markAsked(asked));
  }
  let pushedMoved = false;
  function onPushedPrice(id, r) {
    if (!landTokenPrice(r) || pushedMoved) return;
    pushedMoved = true;
    requestAnimationFrame(() => {
      pushedMoved = false;
      ctx.valuesChanged();
    });
  }
  function favTokenRow(t) {
    const kept = t.price > 0 ? null : DemoFavorites.lastPrice(t.id);
    const price = t.price > 0 ? t.price : kept && kept.price;
    const change = t.price > 0 ? t.change : kept && kept.change;
    const shown = price > 0 ? fmt.price(price) : priceAsked.has(t.id) ? fmt.money("0") : "";
    return `
      <button class="cell market-row press-row" type="button" data-coin="${CK.esc(t.id)}" aria-label="${CK.esc(t.name)}${shown ? `, ${shown}` : ""}">
        ${CK.coinLogo(t, 40)}
        <span class="market-name"><b>${CK.esc(t.name)}</b><span>${CK.esc(t.sym)}</span></span>
        <span class="market-price"><b data-price>${shown || PRICE_SKEL}</b>${typeof change === "number" ? CK.changePill(change, { plain: true }) : ""}</span>
      </button>`;
  }
  const instRow = (c) => c.isToken ? favTokenRow(c) : CK.cards.market(c);
  const favRows = () => D.coins.filter((c) => c.favorite).concat(DemoFavorites.tokens());
  function onNetwork(inst, net) {
    if (inst.isToken) return (inst.token && inst.token.network || String(inst.id).split(":")[0]) === net.id;
    const home = COIN_HOME[inst.id];
    return !!home && (home === net.id || NET_WORDS[home] === net.name);
  }
  const nameMatches = (c, q) => (c.name || "").toLowerCase().includes(q) || (c.sym || "").toLowerCase().includes(q);
  function favShown(all, q, net) {
    if (!q) return net ? all.filter((c) => onNetwork(c, net)) : all;
    const found = all.filter((c) => nameMatches(c, q));
    return net ? found.filter((c) => onNetwork(c, net)).concat(found.filter((c) => !onNetwork(c, net))) : found;
  }
  function follow(before, rows) {
    const now = rows.filter((c) => c.isToken);
    now.forEach(watch);
    before.forEach(unwatch);
    return now;
  }
  function setRows(host, html) {
    if (host._html === html) return;
    const filling = !host._html;
    host._html = html;
    if (!html || !CK.motion) {
      host.innerHTML = html ? `<div${filling ? ' class="list-in"' : ""}>${html}</div>` : "";
      return;
    }
    let wrap = host.firstElementChild;
    if (!wrap) {
      wrap = document.createElement("div");
      host.appendChild(wrap);
    }
    wrap.innerHTML = html;
    CK.motion.rows(wrap);
  }
  function openInst(id, row) {
    if (Object.prototype.hasOwnProperty.call(D.byId, id)) ctx.openCoin(D.byId[id], row);
    else openHeldToken(id, row);
  }
  function buildBlocks(f) {
    const body = f.body;
    const blocksEl = $(".tk-blocks", body);
    const moversTrack = $(".tk-movers .carousel-track", body);
    const favsEl = $(".tk-favs", body), favList = $(".tk-fav-list", body), favEmpty = $(".tk-fav-empty", body);
    const coinsEl = $(".tk-coins", body), coinsList = $(".tk-coins-list", body);
    const query = () => f.input.value.trim().toLowerCase();
    const searching = () => !!query();
    const movers = () => D.coins.filter((c) => c.id !== "usdt").sort((a, b) => Math.abs(b.change || 0) - Math.abs(a.change || 0));
    const moversCarousel = CK.carousel($(".tk-movers-car", body), { label: tr("markets.leaders") });
    const moverCard = (c) => `
      <button class="card coin-card tk-mover press" type="button" data-coin="${CK.esc(c.id)}" aria-label="${CK.esc(c.name)}, ${fmt.price(c.price)}">
        <span class="tk-mover-top">${CK.coinLogo(c, 36)}${typeof c.change === "number" ? CK.changePill(c.change, { plain: true }) : ""}</span>
        <span class="coin-card-price" data-price>${fmt.price(c.price)}</span>
      </button>`;
    function paintMovers() {
      const html = movers().map(moverCard).join("");
      if (moversTrack._html === html) return;
      moversTrack._html = html;
      moversTrack.innerHTML = html;
      moversCarousel.refresh();
    }
    let favFollowed = [];
    let favLive = false;
    const matches = nameMatches;
    function paintFav() {
      const on = f.favMode();
      favsEl.hidden = !on;
      const all = on ? favRows() : [];
      const q = query();
      const net = on ? f.favNet() : null;
      const rows = favShown(all, q, net);
      favLive = on && f.inView();
      favFollowed = follow(favFollowed, favLive ? rows : []);
      favEmpty.hidden = !on || !!rows.length;
      if (on && !rows.length) {
        const key = !all.length ? "markets.noFav" : q ? "common.notFound" : "trade.favNoneNet";
        const title = key === "trade.favNoneNet" ? tx(key, { net: net.name }) : tx(key);
        if (favEmpty.dataset.key !== title) {
          favEmpty.dataset.key = title;
          favEmpty.innerHTML = CK.emptyState({ icon: key === "common.notFound" ? "search" : "star", title });
        }
      }
      setRows(favList, rows.map(instRow).join(""));
    }
    DemoFavorites.onChange(paintFav);
    ctx.tickListeners.add((c) => {
      if (!c.isToken || typeof c.change !== "number") return;
      const row = favList.querySelector(`[data-coin="${CSS.escape(c.id)}"]`);
      if (row && !row.querySelector("[data-change]")) paintFav();
    });
    askedListeners.add((ids) => {
      if (ids.some((id) => favList.querySelector(`[data-coin="${CSS.escape(id)}"] .tk-price-skel`))) paintFav();
    });
    function paintCoins() {
      const q = f.favMode() ? "" : query();
      const rows = q ? D.coins.filter((c) => matches(c, q)) : [];
      coinsEl.hidden = !rows.length;
      setRows(coinsList, rows.map((c) => CK.cards.market(c)).join(""));
    }
    let blocksOut = null;
    function setBlocksHidden(h) {
      if (CK.reducedMotion() || !blocksEl.animate) {
        blocksEl.hidden = h;
        return;
      }
      if (h) {
        if (blocksEl.hidden || blocksOut) return;
        blocksOut = blocksEl.animate([{ opacity: 1 }, { opacity: 0, transform: "translate3d(0,-6px,0)" }], { duration: 150, easing: "ease-in" });
        blocksOut.onfinish = () => {
          blocksOut = null;
          blocksEl.hidden = true;
        };
        return;
      }
      if (blocksOut) {
        blocksOut.cancel();
        blocksOut = null;
      }
      if (!blocksEl.hidden) return;
      blocksEl.hidden = false;
      blocksEl.animate([{ opacity: 0, transform: "translate3d(0,-6px,0)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    function searchChanged() {
      setBlocksHidden(searching());
      paintCoins();
      if (f.favMode()) paintFav();
    }
    body.addEventListener("click", (e) => {
      const row = e.target.closest(".tk-blocks [data-coin], .tk-coins [data-coin], .tk-favs [data-coin]");
      if (row) openInst(row.dataset.coin, row);
    });
    paintMovers();
    paintFav();
    return {
      searchChanged,

      modeChanged() {
        paintCoins();
        paintFav();
      },

      coinsShown: () => !coinsEl.hidden,

      viewChanged() {
        if (favLive !== (f.favMode() && f.inView())) paintFav();
      },

      reloadMarket() {
        paintMovers();
        paintFav();
        paintCoins();
      },
      repaint() {
        moversTrack._html = null;
        favList._html = null;
        coinsList._html = null;
        favEmpty.dataset.key = "";
        paintMovers();
        paintFav();
        paintCoins();
      }
    };
  }
  function buildFeed() {
    const screen = CK.screen({ title: tr("tab.trade"), compactTop: true, headExtra: ctx.STATUS_ACCOUNT, avatar: ctx.openProfile });
    screen.el.classList.add("tk-feed");
    screen.body.innerHTML = `
      <div class="tk-head">
        <div class="screen-pad tk-find">
          <label class="search">${icon("search", { size: 19 })}<input class="tk-search" type="search" ${LP("token.searchPh")} ${LA("token.searchAria")} autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" maxlength="70"><button class="tk-clear" type="button" ${LA("token.clear")} hidden>${icon("close-circle", { fill: true, size: 18 })}</button></label>
          <button class="tk-netchip press" type="button"></button>
        </div>
        <div class="tk-blocks">
          <section class="tk-movers">
            <div class="tk-movers-car"><div class="carousel-track"></div></div>
          </section>
        </div>
        <section class="tk-coins" hidden>
          <div class="group list--free tk-coins-list"></div>
        </section>
        <div class="screen-pad tk-count"><span class="tk-total"></span><span data-data-status data-kind="market"></span></div>
      </div>
      <div class="screen-pad tk-sort-pad"><div class="tk-sort" role="radiogroup"></div></div>
      <div class="tk-favs" hidden>
        <div class="group list--free tk-fav-list"></div>
        <div class="tk-fav-empty" hidden></div>
      </div>
      <div class="group list--free tk-list" role="list" ${LA("token.list")}></div>
      <div class="tk-state" hidden></div>`;
    const body = screen.body, scroll = screen.scroll;
    const head = $(".tk-head", body), list = $(".tk-list", body), stateEl = $(".tk-state", body);
    const totalEl = $(".tk-total", body), input = $(".tk-search", body), clearBtn = $(".tk-clear", body);
    const upBtn = CK.el(`<button class="tk-up press" type="button" ${LA("common.toTop")}>${icon("chevron-up", { size: 22 })}</button>`);
    screen.el.insertBefore(upBtn, $(".screen-dim", screen.el));
    const filters = { network: "ton", sort: "popular", q: "" };
    let view = filters.sort;
    const favMode = () => view === FAV;
    let favAll = false;
    const favNetwork = () => favAll ? ALL_NETS : filters.network;
    let feedStale = false;
    let blocks = null;
    let gen = 0, pages = [], known = 0, nextCursor = null, more = true, tailBusy = false, tailFailed = false, firstLoading = true;
    let total = null, stale = false, rowsShown = 0, listTop = 0, lastY = 0, fast = false;
    let framePending = false, settleTimer = 0, searchTimer = 0, warmingTries = 0;
    let viewH = 0, replacing = false, skeletonTimer = 0, tailAbort = null, listChanged = false;
    const slots = [];
    const failedLogos =   new Map();
    const firstPages =   new Map();
    const logoShown = (u) => CK.logos.ready(u);
    const holdLogo = (u) => CK.logos.hold(u);
    const rowLogo = (t) => {
      const coin = D.canonicalCoin(t);
      return coin && CK.COIN_LOGOS[coin.id] || t.logo;
    };
    function logosReady(tokens) {
      const rows = Math.ceil((viewH || scroll.clientHeight) / ROW_H);
      const waits = tokens.slice(0, rows).map((t) => usableLogo(rowLogo(t))).filter((u) => u && !logoShown(u)).map(holdLogo);
      tokens.slice(rows, rows * 2).forEach((t) => holdLogo(usableLogo(rowLogo(t))));
      if (!waits.length) return Promise.resolve();
      return Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, LOGOS_WAIT_MS))]);
    }
    let lastPage = null;
    function pageAt(i) {
      if (lastPage && i >= lastPage.start && i < lastPage.start + lastPage.count) return lastPage;
      let a = 0, b = pages.length - 1;
      while (a <= b) {
        const m = a + b >> 1, p = pages[m];
        if (i < p.start) b = m - 1;
        else if (i >= p.start + p.count) a = m + 1;
        else {
          lastPage = p;
          return p;
        }
      }
      return null;
    }
    function tokenAt(i) {
      const p = pageAt(i);
      return p && p.tokens ? p.tokens[i - p.start] || null : null;
    }
    function viewOf(t) {
      if (t.view && t.view.lang === CK.i18n.lang) return t.view;
      const priced = t.price > 0;
      const hasChange = priced && t.change24h !== null;
      t.view = {
        lang: CK.i18n.lang,

        price: priced ? fmt.price(t.price) : noPriceText(t),
        priced,
        change: hasChange ? signedPct(t.change24h) : "",
        flat: hasChange && CK.changeFlat(t.change24h),
        up: !hasChange || t.change24h >= 0 || CK.changeFlat(t.change24h),
        tag: rowTag(t) ? tx(rowTag(t).key) : "",
        tagTone: rowTag(t) ? rowTag(t).tone : "",
        risky: t.risk === "suspicious"
      };
      return t.view;
    }
    function makeSlot() {
      const el = CK.el(`
        <button class="cell market-row tk-row press-row" type="button" role="listitem" hidden>
          <span class="tk-logo-wrap"><span class="tk-logo"><span class="tk-tile" aria-hidden="true"></span><img class="tk-img" alt="" draggable="false" decoding="async" referrerpolicy="no-referrer"></span><span class="tk-netbadge" hidden><img alt="" draggable="false" decoding="async" referrerpolicy="no-referrer"></span></span>
          <span class="market-name"><b class="tk-name"></b><span class="tk-sub"><span class="tk-sym"></span><span class="tag tk-tag" hidden></span></span></span>
          <span class="market-price"><b class="tk-price"></b><span class="tk-change"><span class="tk-change-num"></span></span></span>
        </button>`);
      const slot = {
        el,
        i: -1,
        t: null,
        view: null,
        url: null,
        tile: $(".tk-tile", el),
        img: $(".tk-img", el),
        name: $(".tk-name", el),
        sym: $(".tk-sym", el),
        tag: $(".tk-tag", el),
        price: $(".tk-price", el),
        change: $(".tk-change", el),
        changeNum: $(".tk-change-num", el),
        netBadge: $(".tk-netbadge", el)
      };
      slot.img.addEventListener("load", () => {
        slot.img.classList.add("is-on");
        holdLogo(slot.url);
      });
      slot.img.addEventListener("error", () => {
        slot.img.classList.remove("is-on");
        if (failedLogos.size >= FAILED_LOGOS_KEPT) failedLogos.clear();
        if (slot.url) failedLogos.set(slot.url, Date.now());
        const alt = usableLogo(slot.alt);
        slot.alt = null;
        slot.url = alt;
        if (alt) slot.img.src = alt;
        else slot.img.removeAttribute("src");
      });
      list.appendChild(el);
      slots.push(slot);
      return slot;
    }
    function usableLogo(u) {
      if (!u) return null;
      const at = failedLogos.get(u);
      if (at === void 0) return u;
      if (Date.now() - at < LOGO_RETRY_MS) return null;
      failedLogos.delete(u);
      return u;
    }
    function setSlotLogo(slot, url, alt) {
      const next = usableLogo(url) || usableLogo(alt);
      slot.alt = next === usableLogo(alt) ? null : usableLogo(alt);
      if (slot.url === next) return;
      slot.url = next;
      const ready = !!next && logoShown(next);
      slot.img.classList.toggle("is-on", ready);
      slot.img.classList.toggle("is-instant", ready);
      slot.img.decoding = ready ? "sync" : "async";
      slot.img.removeAttribute("src");
      slot.img.fetchPriority = slot.i * ROW_H < viewH ? "high" : "auto";
      if (next && (ready || !fast)) slot.img.src = ready ? CK.logos.src(next) : next;
    }
    function fillSlot(slot, i) {
      const stayed = slot.i === i;
      if (!stayed) {
        slot.i = i;
        if (SLOT_TRANSLATE) slot.el.style.translate = `0 ${i * ROW_H}px`;
        else slot.el.style.transform = `translate3d(0,${i * ROW_H}px,0)`;
        slot.el.classList.toggle("is-first", i === 0);
      }
      const t = tokenAt(i);
      if (!t) {
        if (slot.t || !slot.el.classList.contains("is-skel")) {
          slot.t = null;
          slot.view = null;
          slot.el.classList.add("is-skel");
          slot.el.disabled = true;
          slot.el.style.setProperty("--i", String(i % 12));
          setSlotLogo(slot, null, null);
          CK.priceTick(slot.price, "");
        }
        return;
      }
      const view2 = viewOf(t);
      if (slot.t === t && slot.view === view2) return;
      const last = slot.view;
      const moved = stayed && slot.t === t && !!last && last.lang === view2.lang && last.priced && view2.priced && last.price !== view2.price;
      if (slot.t === t && last && last.price !== view2.price) slot.el.setAttribute("aria-label", `${t.name}, ${view2.price}`);
      if (slot.t !== t) {
        slot.el.classList.remove("is-skel");
        slot.el.disabled = false;
        slot.tile.textContent = CK.initials(t.symbol);
        slot.name.textContent = t.name;
        slot.sym.textContent = t.symbol;
        slot.tag.hidden = !view2.tag;
        slot.tag.textContent = view2.tag;
        slot.tag.classList.toggle("tag--down", view2.tagTone === "down");
        slot.tag.classList.toggle("tag--warn", view2.tagTone === "warn");
        const across = searchAcross();
        const home = across && (() => {
          const coin = D.canonicalCoin(t);
          return !!coin && HOME_NET[coin.id] === t.network;
        })();
        slot.netBadge.hidden = !across || home;
        const badgeLogo = across && !home ? netLogos.get(t.network) || null : null;
        const badgeImg = slot.netBadge.firstElementChild;
        if (badgeLogo) badgeImg.src = badgeLogo;
        else badgeImg.removeAttribute("src");
        slot.el.setAttribute("aria-label", across ? `${t.name}, ${netNames.get(t.network) || t.network}, ${view2.price}` : `${t.name}, ${view2.price}`);
        setSlotLogo(slot, rowLogo(t), t.logoAlt);
      }
      CK.priceTick(slot.price, view2.price, moved ? !(t.price < t.lastPrice) : null);
      slot.price.classList.toggle("is-none", !view2.priced);
      slot.change.hidden = !view2.change;
      slot.change.classList.toggle("is-down", !view2.up);
      slot.change.classList.toggle("is-flat", view2.flat);
      slot.changeNum.textContent = view2.change;
      slot.t = t;
      slot.view = view2;
    }
    function paint() {
      const h = scroll.clientHeight;
      if (!h) return;
      if (favMode()) {
        upBtn.classList.toggle("is-on", scroll.scrollTop > UP_BUTTON_AFTER_PX);
        return;
      }
      viewH = h;
      const scrolled = scroll.scrollTop;
      const need = Math.ceil(h / ROW_H) + OVERSCAN * 2 + 2;
      while (slots.length < need) makeSlot();
      const y = scrolled - listTop;
      const first = Math.max(0, Math.floor(y / ROW_H) - OVERSCAN);
      const last = Math.min(rowsShown - 1, first + slots.length - 1);
      const n = slots.length;
      let spare = OFFSCREEN_ROWS_PER_FRAME, putOff = false;
      for (let k = 0; k < n; k++) {
        const slot = slots[k];
        const i = first + (k - first % n + n) % n;
        if (i <= last) {
          if (listChanged && slot.t !== tokenAt(i) && ((i + 1) * ROW_H <= y || i * ROW_H >= y + h) && spare-- <= 0) {
            putOff = true;
            continue;
          }
          if (slot.el.hidden) slot.el.hidden = false;
          fillSlot(slot, i);
        } else if (!slot.el.hidden) {
          slot.el.hidden = true;
          slot.i = -1;
        }
      }
      const bottom = Math.floor((y + h) / ROW_H);
      if (more && !tailFailed && bottom + AHEAD_ROWS > known) fetchTail();
      if (!fast && !firstLoading) refillAround(Math.max(0, first - OVERSCAN), Math.min(known - 1, last + OVERSCAN));
      upBtn.classList.toggle("is-on", scrolled > UP_BUTTON_AFTER_PX);
      listChanged = putOff;
      if (putOff) requestPaint();
      enterRows(y, h);
    }
    function enterRows(y, h) {
      if (!rowsEnter || firstLoading) return;
      const shown = slots.filter((s) => !s.el.hidden && s.t && (s.i + 1) * ROW_H > y && s.i * ROW_H < y + h).sort((a, b) => a.i - b.i);
      if (!shown.length) return;
      rowsEnter = false;
      CK.motion.rows(shown.map((s) => s.el), { fresh: true });
    }
    function requestPaint() {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(() => {
        framePending = false;
        paint();
      });
    }
    function setRowsShown() {
      const left = more ? total === null ? TAIL_SKELETONS : Math.min(TAIL_SKELETONS, Math.max(0, total - known)) : 0;
      rowsShown = firstLoading ? FIRST_SKELETONS : known + (tailFailed ? 0 : left);
      list.style.height = rowsShown * ROW_H + "px";
      list.hidden = rowsShown === 0;
    }
    const coinsOnly = () => !!filters.q && total === 0 && !!blocks && blocks.coinsShown();
    function paintCount() {
      totalEl.textContent = favMode() || total === null || coinsOnly() || !stale ? "" : tx("feed.stale");
    }
    let stateKind = null;
    function showState(kind) {
      stateKind = kind;
      stateEl.hidden = !kind;
      if (!kind) {
        stateEl.replaceChildren();
        return;
      }
      if (kind === "empty" && filters.q && blocks && blocks.coinsShown()) {
        stateEl.innerHTML = `<p class="tk-none-net">${tx("trade.noMatchHere")}</p>`;
      } else if (kind === "empty") {
        stateEl.innerHTML = CK.emptyState({ icon: "search", title: tx(filters.q ? "common.notFound" : "feed.empty") });
      } else {
        stateEl.innerHTML = CK.emptyState({ icon: "warning", title: tx("common.loadFail"), actions: `<button class="btn btn--tinted btn--small press tk-retry" type="button">${tx("common.retry")}</button>` });
      }
    }
    CK.i18n.bind(screen.el, () => {
      slots.forEach((slot) => {
        slot.t = null;
        slot.view = null;
        slot.tag.textContent = "";
        slot.price.textContent = "";
        slot.el.removeAttribute("aria-label");
      });
      paintCount();
      if (stateKind) showState(stateKind);
      paintSort();
      paintChip();
      requestPaint();
      if (blocks) blocks.repaint();
    });
    const searchAcross = () => !!filters.q;
    const baseParams = () => ({ network: searchAcross() ? "all" : filters.network, sort: filters.q ? "popular" : filters.sort, q: filters.q, limit: PAGE_SIZE });
    const netLogos =   new Map(), netNames =   new Map();
    function fetchPage(params, signal) {
      return DemoNets.withListed(params, signal).then((res) => {
        if (!params.q || params.network !== "all") return res;
        const ordered = chosenFirst(res.tokens, filters.network);
        return ordered === res.tokens ? res : { ...res, tokens: ordered };
      });
    }
    let pendingTries = 0;
    function askAgainIfPending(res, g) {
      if (!res || !res.pending || !filters.q || pendingTries >= SEARCH_PENDING_TRIES) return;
      pendingTries++;
      setTimeout(() => {
        if (g !== gen || tailBusy || !filters.q) return;
        revalidateFirstPage();
      }, SEARCH_PENDING_MS);
    }
    function fetchTail() {
      if (tailBusy || !more) return;
      tailBusy = true;
      const g = gen, cursor = nextCursor;
      const aborter = new AbortController();
      tailAbort = aborter;
      const job = fetchPage({ ...baseParams(), cursor }, aborter.signal);
      job.then((res) => {
        if (g !== gen) return null;
        if (res.warming && !res.tokens.length && firstLoading) {
          warmingTries++;
          setTimeout(() => {
            if (g !== gen) return;
            tailBusy = false;
            fetchTail();
          }, warmingTries < WARMING_TRIES ? WARMING_RETRY_MS : WARMING_SLOW_RETRY_MS);
          return null;
        }
        if (!cursor) rememberFirstPage(res);
        return (firstLoading ? logosReady(res.tokens) : Promise.resolve()).then(() => {
          if (g !== gen) return;
          tailBusy = false;
          tailAbort = null;
          acceptPage(res, cursor);
          requestPaint();
          prefetchVisibleSoon();
          if (!cursor) askAgainIfPending(res, g);
        });
      }, (err) => {
        if (g !== gen) return;
        if (err && err.message === "loading" && warmingTries < WARMING_TRIES) {
          warmingTries++;
          setTimeout(() => {
            if (g !== gen) return;
            tailBusy = false;
            fetchTail();
          }, WARMING_RETRY_MS);
          return;
        }
        clearTimeout(skeletonTimer);
        if (replacing) dropRows();
        tailBusy = false;
        tailAbort = null;
        firstLoading = false;
        tailFailed = true;
        if (!known) total = null;
        list.classList.remove("is-reloading");
        setRowsShown();
        paintCount();
        showState("error");
        requestPaint();
      });
    }
    function dropRows() {
      replacing = false;
      pages = [];
      lastPage = null;
      known = 0;
      listChanged = true;
    }
    let fadeNext = false, rowsEnter = false;
    function fadeList() {
      if (!fadeNext) return;
      fadeNext = false;
      if (CK.motion && SLOT_TRANSLATE) {
        rowsEnter = true;
        return;
      }
      if (CK.reducedMotion() || !list.animate) return;
      list.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    }
    function acceptPage(res, cursor) {
      clearTimeout(skeletonTimer);
      if (replacing) dropRows();
      if (!cursor) fadeList();
      firstLoading = false;
      warmingTries = 0;
      const count = res.tokens.length;
      if (count) {
        pages.push({ start: known, count, cursor, tokens: res.tokens, busy: false, failedAt: 0 });
        known += count;
      }
      nextCursor = res.nextCursor;
      more = !!nextCursor && count > 0;
      total = more ? res.total : known;
      stale = res.stale;
      list.classList.remove("is-reloading");
      setRowsShown();
      paintCount();
      showState(known ? null : "empty");
      dropFarPages();
    }
    const firstPageKey = () => filters.q ? null : `${filters.network}|${filters.sort}`;
    function rememberFirstPage(res, key) {
      const k = key || firstPageKey();
      if (!k || !res.tokens.length) return;
      if (firstPages.size >= FIRST_PAGES_KEPT && !firstPages.has(k)) firstPages.clear();
      firstPages.set(k, { at: Date.now(), res });
    }
    function revalidateFirstPage() {
      tailBusy = true;
      const g = gen;
      const aborter = new AbortController();
      tailAbort = aborter;
      fetchPage(baseParams(), aborter.signal).then((res) => {
        if (g !== gen) return;
        tailBusy = false;
        tailAbort = null;
        askAgainIfPending(res, g);
        if (!pages.length && res.tokens.length) {
          acceptPage(res, null);
          requestPaint();
          return;
        }
        const page = pages[0];
        if (pages.length !== 1 || !page.tokens) return;
        const old = page.tokens;
        const same = old.length === res.tokens.length && old.every((t, i) => t.id === res.tokens[i].id);
        if (same) {
          old.forEach((t, i) => {
            const n = res.tokens[i];
            if (n.price === t.price && n.change24h === t.change24h) return;
            t.lastPrice = t.price;
            t.price = n.price;
            t.change24h = n.change24h;
            t.volume24h = n.volume24h;
            t.liquidity = n.liquidity;
            t.view = null;
          });
          rememberFirstPage({ ...res, tokens: old });
          nextCursor = res.nextCursor;
          more = !!nextCursor && old.length > 0;
          total = more ? res.total : known;
          stale = res.stale;
          setRowsShown();
          paintCount();
        } else {
          rememberFirstPage(res);
          replacing = true;
          acceptPage(res, null);
        }
        requestPaint();
      }, () => {
        if (g !== gen) return;
        tailBusy = false;
        tailAbort = null;
        requestPaint();
      });
    }
    function dropFarPages() {
      if (favMode()) return;
      const row = Math.max(0, Math.floor((lastY - listTop) / ROW_H));
      const at = pages.indexOf(pageAt(row));
      if (at < 0) return;
      pages.forEach((p, n) => {
        if (Math.abs(n - at) > KEEP_PAGES) p.tokens = null;
      });
    }
    function refillAround(firstRow, lastRow) {
      for (let i = firstRow; i <= lastRow; ) {
        const p = pageAt(i);
        if (!p) return;
        if (!p.tokens && !p.busy && Date.now() - p.failedAt > RETRY_PAGE_MS) {
          p.busy = true;
          const g = gen;
          fetchPage({ ...baseParams(), cursor: p.cursor }).then((res) => {
            p.busy = false;
            if (g !== gen) return;
            p.tokens = res.tokens;
            requestPaint();
          }, () => {
            p.busy = false;
            p.failedAt = Date.now();
          });
        }
        i = p.start + p.count;
      }
    }
    function showSkeletons() {
      dropRows();
      total = null;
      paintCount();
      setRowsShown();
      paint();
    }
    function reload() {
      gen++;
      if (tailAbort) tailAbort.abort();
      tailAbort = null;
      clearTimeout(skeletonTimer);
      nextCursor = null;
      more = true;
      tailBusy = false;
      tailFailed = false;
      firstLoading = true;
      warmingTries = 0;
      pendingTries = 0;
      fadeNext = true;
      showState(null);
      toControls();
      const key = firstPageKey();
      const seen = key && firstPages.get(key);
      if (seen && Date.now() - seen.at < FIRST_PAGE_FOR_MS) {
        replacing = true;
        acceptPage(seen.res, null);
        revalidateFirstPage();
        paint();
        return;
      }
      list.classList.add("is-reloading");
      if (known) {
        replacing = true;
        skeletonTimer = setTimeout(showSkeletons, SKELETONS_AFTER_MS);
      } else {
        showSkeletons();
      }
      fetchTail();
    }
    const warmed =   new Set();
    const roomyLink = () => {
      const link = navigator.connection;
      return !link || !link.saveData && (!link.effectiveType || link.effectiveType === "4g");
    };
    let feedSeen = false, warmPending = null;
    function warmNetworks(networks) {
      feedSeen = feedSeen || ctx.feedInView();
      if (!feedSeen) {
        warmPending = networks;
        return;
      }
      warmPending = null;
      const open = Math.max(0, networks.findIndex((n) => n.id === filters.network));
      const beside = networks.map((n, i) => ({ n, d: Math.abs(i - open) })).filter(({ n }) => n.id !== filters.network).sort((a, b) => a.d - b.d).slice(0, WARM_NETWORKS).map(({ n }) => n);
      const next = beside.find((n) => !warmed.has(n.id));
      if (!next) return;
      warmed.add(next.id);
      const sort = filters.sort;
      const key = `${next.id}|${sort}`;
      const later = () => warmNetworks(networks);
      const whenIdle = (fn) => window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2e3 }) : setTimeout(fn, 300);
      if (firstPages.has(key) || next.id === filters.network) {
        later();
        return;
      }
      whenIdle(() => {
        if (document.hidden) {
          warmed.delete(next.id);
          return;
        }
        CK.market.tokens({ network: next.id, sort, q: "", limit: PAGE_SIZE }).then((res) => {
          rememberFirstPage(res, key);
          if (roomyLink()) res.tokens.slice(0, LOGOS_WARMED).forEach((t) => holdLogo(usableLogo(rowLogo(t))));
          whenIdle(later);
        }, () => {
        });
      });
    }
    let tickBusy = false, tickedAt = 0;
    function tickVisible() {
      if (warmPending && !document.hidden && ctx.feedInView()) warmNetworks(warmPending);
      if (blocks) blocks.viewChanged();
      if (favMode() || tickBusy || fast || document.hidden || firstLoading || !ctx.feedInView() || !scroll.clientHeight) return;
      if (Date.now() - tickedAt < TICK_MIN_GAP_MS) return;
      const y = scroll.scrollTop - listTop;
      const firstRow = Math.max(0, Math.floor(y / ROW_H));
      const lastRow = Math.max(0, Math.floor((y + scroll.clientHeight) / ROW_H));
      const asked =   new Map();
      for (let i = firstRow; i <= lastRow; i++) {
        const t = tokenAt(i);
        if (t) asked.set(t.id, t);
      }
      const ids = Array.from(asked.keys());
      if (!ids.length || askedRecently(visibleAsk, ids)) return;
      tickBusy = true;
      tickedAt = Date.now();
      const g = gen;
      CK.market.tokenPrices(ids).then((rows) => {
        if (g !== gen) return;
        const changed =   new Set();
        rows.forEach((r) => {
          const t = asked.get(r.id);
          if (!t) return;
          const price = r.price === null ? t.price : r.price;
          const change = r.change24h === null ? t.change24h : r.change24h;
          if (price === t.price && change === t.change24h) return;
          t.lastPrice = t.price;
          t.price = price;
          t.change24h = change;
          t.view = null;
          changed.add(t);
        });
        if (changed.size) slots.forEach((slot) => {
          if (changed.has(slot.t) && !slot.el.hidden) fillSlot(slot, slot.i);
        });
      }).catch(() => {
        visibleAsk.at = 0;
      }).finally(() => {
        tickBusy = false;
      });
    }
    const visibleAsk = { key: "", at: 0 };
    const pushedRows =   new Map();
    let pushPending = false;
    function landPushed() {
      if (fast) {
        setTimeout(() => requestAnimationFrame(landPushed), SETTLE_MS);
        return;
      }
      pushPending = false;
      slots.forEach((slot) => {
        const r = slot.t && !slot.el.hidden ? pushedRows.get(slot.t.id) : null;
        if (!r) return;
        const t = slot.t;
        const change = r.change24h === null ? t.change24h : r.change24h;
        if (r.price === t.price && change === t.change24h) return;
        t.lastPrice = t.price;
        t.price = r.price;
        t.change24h = change;
        t.view = null;
        fillSlot(slot, slot.i);
      });
      pushedRows.clear();
    }
    CK.market.onTokenTick((id, r) => {
      pushedRows.set(id, { ...r, id });
      if (pushPending) return;
      pushPending = true;
      requestAnimationFrame(landPushed);
    });
    CK.market.onStream((sid) => {
      if (sid) {
        tickedAt = 0;
        tickVisible();
      }
    });
    function refreshVisible() {
      if (favMode() || document.hidden || firstLoading || !ctx.feedInView() || !scroll.clientHeight) return;
      const y = scroll.scrollTop - listTop;
      const firstRow = Math.max(0, Math.floor(y / ROW_H));
      const lastRow = Math.max(0, Math.floor((y + scroll.clientHeight) / ROW_H));
      const seen =   new Set();
      for (let i = firstRow; i <= lastRow; i++) {
        const p = pageAt(i);
        if (!p || !p.tokens || seen.has(p)) continue;
        seen.add(p);
        const g = gen;
        CK.market.tokens({ ...baseParams(), cursor: p.cursor }).then((res) => {
          if (g !== gen || !p.tokens) return;
          const fresh = new Map(res.tokens.map((t) => [t.id, t]));
          p.tokens.forEach((t) => {
            const n = fresh.get(t.id);
            if (!n || n.price === t.price && n.change24h === t.change24h) return;
            t.lastPrice = t.price;
            t.price = n.price;
            t.change24h = n.change24h;
            t.volume24h = n.volume24h;
            t.liquidity = n.liquidity;
            t.view = null;
          });
          if (res.total !== null && more) {
            total = res.total;
            paintCount();
          }
          stale = res.stale;
          requestPaint();
        }).catch(() => {
        });
      }
    }
    function settled() {
      fast = false;
      requestPaint();
      slots.forEach((slot) => {
        if (slot.url && slot.img.getAttribute("src") !== slot.url) slot.img.src = slot.url;
      });
      dropFarPages();
      prefetchVisibleSoon();
      tickVisible();
    }
    const prefetched =   new Map();
    function prefetchRow(t) {
      if (!t || !(t.price > 0)) return;
      if (Date.now() - (prefetched.get(t.id) || 0) < PREFETCH_AGAIN_MS) return;
      if (prefetched.size >= PREFETCHED_KEPT) prefetched.clear();
      prefetched.set(t.id, Date.now());
      CK.market.prefetchToken(t.id, "1d");
    }
    function prefetchVisible() {
      if (favMode() || document.hidden || !ctx.feedInView() || !scroll.clientHeight) return;
      const first = Math.max(0, Math.floor((scroll.scrollTop - listTop) / ROW_H));
      for (let i = first; i < first + PREFETCH_ROWS; i++) prefetchRow(tokenAt(i));
    }
    function prefetchVisibleSoon() {
      if (window.requestIdleCallback) requestIdleCallback(prefetchVisible, { timeout: 1e3 });
      else setTimeout(prefetchVisible, 200);
    }
    list.addEventListener("pointerdown", (e) => {
      const row = e.target.closest(".tk-row");
      const slot = row && slots.find((s) => s.el === row);
      if (slot) prefetchRow(tokenAt(slot.i));
    }, { passive: true });
    scroll.addEventListener("scroll", () => {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(() => {
        framePending = false;
        const y = scroll.scrollTop;
        if (!scroll.clientHeight) return;
        if (Math.abs(y - lastY) > FAST_PX_PER_FRAME) fast = true;
        lastY = y;
        markStuck();
        paint();
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settled, SETTLE_MS);
      });
    }, { passive: true });
    function measureTop() {
      let el = list, top = 0;
      while (el && el !== scroll) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      listTop = top;
    }
    let controlsAt = 0, stuckTop = null;
    function remeasure(y) {
      if (favMode()) return y;
      const before = listTop;
      measureTop();
      const moved = listTop - before, controlsWas = controlsAt;
      controlsAt = controlsY();
      return moved && before && y >= controlsWas ? Math.max(0, y + moved) : y;
    }
    new ResizeObserver(() => {
      if (!scroll.clientHeight) return;
      stuckTop = null;
      if (sortBar) sortBar.style.top = "";
      keepRoom();
      lastY = remeasure(lastY);
      if (lastY && Math.abs(scroll.scrollTop - lastY) > 1) scroll.scrollTop = lastY;
      paint();
    }).observe(scroll);
    const sortBar = $(".tk-sort-pad", body);
    const blocksMoved = new ResizeObserver(() => {
      if (!scroll.clientHeight) return;
      keepRoom();
      const y = scroll.scrollTop, next = remeasure(y);
      if (next !== y) {
        scroll.scrollTop = next;
        lastY = next;
      }
      markStuck();
      requestPaint();
    });
    blocksMoved.observe(head);
    blocksMoved.observe(sortBar);
    const sortEl = $(".tk-sort", body), chip = $(".tk-netchip", body);
    let networksKnown = [{ id: "ton", name: "TON", logo: null }];
    const netMarkOf = (n) => (window.DemoNets && typeof DemoNets.netMark === "function" ? DemoNets.netMark(n.id) : null) || n.logo;
    const chosenNetwork = () => networksKnown.find((n) => n.id === filters.network) || { id: filters.network, name: netNames.get(filters.network) || String(filters.network).toUpperCase(), logo: null };
    function paintChip() {
      const all = favMode() && favAll;
      const n = chosenNetwork();
      const mark = all ? allNetsMark() : logoSlot(netMarkOf(n), n.name);
      chip.replaceChildren(mark, CK.el(`<span class="tk-netchip-label">${CK.esc(tx("common.network"))}</span>`), CK.el(icon("chevron-down", { size: 16 })));
      chip.setAttribute("aria-label", `${tx("common.network")}: ${all ? tx("trade.allNets") : n.name}`);
      chip.setAttribute("aria-haspopup", "dialog");
    }
    function allNetsMark() {
      return CK.el(`<span class="tk-logo tk-logo--all" aria-hidden="true">${icon("layers", { size: 16 })}</span>`);
    }
    function renderRail(networks) {
      networks.forEach((n) => {
        if (n.logo) netLogos.set(n.id, n.logo);
        netNames.set(n.id, n.name);
      });
      networksKnown = networks;
      paintChip();
    }
    renderRail(networksKnown);
    let openNetworkTotal = null;
    function loadRail(tries) {
      const again = () => setTimeout(() => loadRail(tries + 1), tries < RAIL_QUICK_TRIES ? RAIL_RETRY_MS : RAIL_RETRY_SLOW_MS);
      CK.market.networks().then((networks) => {
        if (networks.length && (networks.length !== networksKnown.length || networks.some((n, i) => n.id !== networksKnown[i].id))) renderRail(networks);
        const open = networks.find((n) => n.id === filters.network);
        const grew = open && openNetworkTotal !== null && open.total > openNetworkTotal;
        openNetworkTotal = open ? open.total : null;
        if (grew && favMode()) feedStale = true;
        else if (grew && !filters.q && scroll.scrollTop <= listTop && !CK.sheet.top) reload();
        warmNetworks(networks);
        if (networks.warming) again();
      }).catch(again);
    }
    loadRail(0);
    function pickNetwork(id) {
      const all = id === ALL_NETS;
      if (all ? favAll : !favAll && id === filters.network) return;
      CK.haptic.selection();
      favAll = all;
      const moved = !all && id !== filters.network;
      if (moved) filters.network = id;
      paintChip();
      if (favMode()) {
        if (moved) feedStale = true;
        blocks.modeChanged();
        return;
      }
      if (moved) reload();
    }
    chip.addEventListener("click", () => {
      if (CK.sheet.top) return;
      CK.haptic.light();
      CK.sheet.open({
        title: tx("common.network"),
        detents: [CK.sheet.fixedDetent(NET_SHEET_H + safeBottom())],
        build(b, sheet) {
          const rows = CK.el('<div class="sheet-list tk-net-list" role="radiogroup"></div>');
          let chosen = null;
          const shown = favNetwork();
          const choices = favMode() ? [{ id: ALL_NETS, name: tx("trade.allNets") }].concat(networksKnown) : networksKnown;
          choices.forEach((n) => {
            const on = n.id === (favMode() ? shown : filters.network);
            const row = CK.el(`<button class="cell press-row tk-net-row${on ? " is-selected" : ""}" type="button" role="radio" aria-checked="${on}"></button>`);
            row.dataset.network = n.id;
            const main = CK.el('<span class="cell-main"><span class="cell-title"></span></span>');
            main.firstElementChild.textContent = n.name;
            row.append(n.id === ALL_NETS ? allNetsMark() : logoSlot(netMarkOf(n), n.name), main, CK.el(icon("check", { size: 20, className: "cell-check" })));
            rows.appendChild(row);
            if (on) chosen = row;
          });
          rows.addEventListener("click", (e) => {
            const row = e.target.closest(".tk-net-row");
            if (!row) return;
            pickNetwork(row.dataset.network);
            sheet.close();
          });
          b.appendChild(rows);
          if (chosen) {
            requestAnimationFrame(() => {
              const below = chosen.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom;
              if (below > 0) b.scrollTop += below + chosen.offsetHeight;
            });
          }
        }
      });
    });
    sortEl.setAttribute("aria-label", tx("sort.aria"));
    sortEl.innerHTML = `<span class="tk-sort-pill" aria-hidden="true"></span>${SORTS.map((o) => `<button class="tk-sort-btn" type="button" role="radio" data-value="${o.value}"><span class="tk-sort-label"></span></button>`).join("")}`;
    const sortPill = sortEl.firstElementChild;
    const sortBtns = Array.from(sortEl.querySelectorAll(".tk-sort-btn"));
    function paintSort() {
      sortEl.setAttribute("aria-label", tx("sort.aria"));
      sortBtns.forEach((b, i) => {
        const o = SORTS[i], on = o.value === view;
        b.setAttribute("aria-checked", String(on));
        b.tabIndex = on ? 0 : -1;
        b.setAttribute("aria-label", tx(o.aria || o.key));
        const labelEl = b.firstElementChild;
        labelEl.textContent = tx(o.key);
        labelEl.dataset.text = labelEl.textContent;
      });
    }
    let pillOn = null;
    function placePill(move) {
      const b = sortBtns[SORTS.findIndex((o) => o.value === view)];
      if (!b || !b.offsetWidth) return;
      const to = { x: b.offsetLeft, width: b.offsetWidth };
      const from = move && pillOn ? { x: pillOn.offsetLeft, width: pillOn.offsetWidth } : null;
      pillOn = b;
      if (CK.motion && typeof CK.motion.indicator === "function") {
        CK.motion.indicator(sortPill, from, to);
        return;
      }
      sortPill.style.transform = `translate3d(${to.x}px, 0, 0)`;
      sortPill.style.width = `${to.width}px`;
    }
    if (typeof ResizeObserver === "function") {
      const sortSized = new ResizeObserver(() => placePill(false));
      sortSized.observe(sortEl);
      sortBtns.forEach((b) => sortSized.observe(b));
    }
    function chooseSort(i) {
      const v = SORTS[i].value;
      if (v === view) return;
      CK.haptic.selection();
      pickView(v);
    }
    sortEl.addEventListener("click", (e) => {
      const b = e.target.closest(".tk-sort-btn");
      if (b) chooseSort(sortBtns.indexOf(b));
    });
    sortEl.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = (SORTS.findIndex((o) => o.value === view) + d + SORTS.length) % SORTS.length;
      chooseSort(next);
      sortBtns[next].focus();
    });
    let feedY = 0;
    function pickView(v) {
      const was = view;
      if (v === FAV && was !== FAV) feedY = scroll.scrollTop;
      view = v;
      screen.el.classList.toggle("is-fav", favMode());
      paintChip();
      paintSort();
      placePill(true);
      markSort();
      blocks.modeChanged();
      blocks.viewChanged();
      if (favMode()) {
        toControls();
        paintCount();
        paint();
        return;
      }
      const resort = filters.sort !== v || feedStale;
      filters.sort = v;
      feedStale = false;
      if (was === FAV && !resort) {
        measureTop();
        scroll.scrollTop = feedY;
        lastY = scroll.scrollTop;
        paintCount();
        requestPaint();
        tickedAt = 0;
        tickVisible();
        return;
      }
      reload();
    }
    function markSort() {
      sortBar.hidden = !!input.value.trim();
    }
    function searchShown() {
      markSort();
      paintCount();
      if (stateKind) showState(stateKind);
    }
    function applySearch() {
      const q = input.value.trim();
      if (q === filters.q) return;
      filters.q = q;
      if (favMode()) feedStale = true;
      else reload();
    }
    input.addEventListener("input", () => {
      clearBtn.hidden = !input.value;
      blocks.searchChanged();
      searchShown();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applySearch, SEARCH_MS);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      clearTimeout(searchTimer);
      applySearch();
      input.blur();
    });
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      input.value = "";
      clearBtn.hidden = true;
      blocks.searchChanged();
      searchShown();
      clearTimeout(searchTimer);
      applySearch();
      input.focus();
    });
    stateEl.addEventListener("click", (e) => {
      if (!e.target.closest(".tk-retry")) return;
      if (known) {
        tailFailed = false;
        showState(null);
        setRowsShown();
        fetchTail();
      } else {
        reload();
      }
    });
    list.addEventListener("click", (e) => {
      const row = e.target.closest(".tk-row");
      if (!row) return;
      const slot = slots.find((s) => s.el === row);
      const t = slot && tokenAt(slot.i);
      if (t) openToken(t, row);
    });
    upBtn.addEventListener("click", () => {
      CK.haptic.light();
      if (CK.reducedMotion() || !scroll.scrollTo) scroll.scrollTop = 0;
      else scroll.scrollTo({ top: 0, behavior: "smooth" });
      lastY = 0;
    });
    function controlsY() {
      const style = getComputedStyle(sortBar);
      let el = head, top = head.offsetHeight + (parseFloat(style.marginTop) || 0);
      while (el && el !== scroll) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      const bar = $(".navbar", screen.el);
      const cssTop = parseFloat(style.top);
      const stuckAt = stuckTop !== null ? stuckTop : Number.isFinite(cssTop) ? cssTop : bar ? bar.offsetHeight : 0;
      return Math.max(0, top - stuckAt);
    }
    function readStuckTop() {
      if (stuckTop !== null || sortBar.hidden || !(controlsAt > 0) || scroll.scrollTop < controlsAt + 24) return;
      if (getComputedStyle(sortBar).position !== "sticky") return;
      const scrollTop = scroll.getBoundingClientRect().top;
      let at = Math.round(sortBar.getBoundingClientRect().top - scrollTop);
      const bar = $(".navbar", screen.el);
      const want = bar ? Math.round(bar.getBoundingClientRect().bottom - scrollTop) : at;
      if (Math.abs(at - want) > 2) {
        const cssTop = parseFloat(getComputedStyle(sortBar).top) || 0;
        sortBar.style.top = `${cssTop + (want - at)}px`;
        at = want;
      }
      stuckTop = at;
      controlsAt = controlsY();
      keepRoom();
    }
    function keepRoom() {
      if (sortBar.hidden || !scroll.clientHeight) {
        body.style.minHeight = "";
        return;
      }
      const padBottom = parseFloat(getComputedStyle(scroll).paddingBottom) || 0;
      const need = Math.ceil(scroll.clientHeight + controlsY() - body.offsetTop - padBottom);
      body.style.minHeight = getComputedStyle(sortBar).position === "sticky" && need > 0 ? `${need}px` : "";
    }
    let stuck = false;
    function markStuck() {
      readStuckTop();
      const now = !sortBar.hidden && controlsAt > 0 && scroll.scrollTop >= controlsAt - 0.5;
      if (now === stuck) return;
      stuck = now;
      sortBar.classList.toggle("is-stuck", now);
    }
    function toControls() {
      const y = controlsY();
      if (scroll.scrollTop > y) {
        scroll.scrollTop = y;
        lastY = y;
      }
    }
    blocks = buildBlocks({
      body,
      scroll,
      input,
      viewOf,
      rowLogo,
      usableLogo,
      openToken,

      inView: () => {
        try {
          return !!ctx.feedInView();
        } catch (err) {
          return false;
        }
      },
      favMode,

      favNet: () => favNetwork() === ALL_NETS ? null : chosenNetwork()
    });
    setRowsShown();
    ctx.makeStack("trade", screen);
    if (ctx.onViewChange) ctx.onViewChange(() => blocks.viewChanged());
    blocks.viewChanged();
    measureTop();
    controlsAt = controlsY();
    keepRoom();
    paintSort();
    placePill(false);
    fetchTail();
    setInterval(refreshVisible, REFRESH_MS);
    setInterval(tickVisible, TICK_MS);
    document.addEventListener("visibilitychange", tickVisible);
    return {
      reloadMarket: () => blocks.reloadMarket(),

      onShow: () => blocks.viewChanged(),
      stats: () => ({ rowsInDom: list.childElementCount, pages: pages.length, pagesHeld: pages.filter((p) => p.tokens).length, tokensHeld: pages.reduce((s, p) => s + (p.tokens ? p.tokens.length : 0), 0), known, total, rowsShown, filters: { ...filters } })
    };
  }
  const COIN_HOME = { btc: "bitcoin", eth: "eth", ton: "ton", sol: "solana", bnb: "bsc", xrp: "xrp", doge: "dogecoin", not: "ton", usdt: "ton" };
  const NET_WORDS = { bitcoin: "Bitcoin", eth: "Ethereum", ton: "TON", solana: "Solana", bsc: "BNB Chain", xrp: "XRP Ledger", dogecoin: "Dogecoin", tron: "Tron" };
  function networkLabel(inst) {
    const id = inst.isToken ? inst.token && inst.token.network : COIN_HOME[inst.id];
    if (!id) return "";
    const named = CK.market && typeof CK.market.networkName === "function" ? CK.market.networkName(id) : null;
    return named || NET_WORDS[id] || String(id).toUpperCase();
  }
  const positive = (v) => typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
  const compactUsd = (v) => typeof fmt.compactUsd === "function" ? fmt.compactUsd(v) : fmt.usd(v);
  function sharePcts(buyPct) {
    const whole = buyPct >= 1 && buyPct <= 99;
    const buy = whole ? Math.round(buyPct) : Math.round(buyPct * 10) / 10;
    const sell = whole ? 100 - buy : Math.round((100 - buy) * 10) / 10;
    const text = (v) => `${fmt.num(v, whole ? 0 : 1)}${CK.i18n.lang === "en" ? "" : "\xA0"}%`;
    return { buy: text(buy), sell: text(sell) };
  }
  const compactNum = (v) => typeof fmt.compact === "function" ? fmt.compact(v) : fmt.num(v, 0);
  function overviewOf(inst) {
    const t = inst.isToken ? inst.token || {} : null;
    const cap = t ? positive(t.marketCap) : inst.capReal ? positive(inst.cap) : null;
    const supply = positive(t ? t.totalSupply : inst.totalSupply);
    const circulating = positive(t ? t.circulatingSupply : inst.circulatingSupply);
    const liquidity = t ? positive(t.liquidity) : null;
    return [
      ["coin.cap", cap && compactUsd(cap)],
      ["tk.supply", supply && compactNum(supply)],
      ["tk.circulating", circulating && compactNum(circulating)],
      ["stat.liquidity", liquidity && compactUsd(liquidity)]
    ].filter((row) => row[1]);
  }
  const volumeOf = (inst) => inst.isToken ? positive(inst.token && inst.token.volume24h) : inst.volumeReal ? positive(inst.volume) : null;
  const ABOUT_MAX = 1200;
  function aboutOf(inst) {
    const raw = inst.isToken ? inst.token && inst.token.description : inst.description;
    if (typeof raw !== "string") return "";
    return raw.replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, "").trim().slice(0, ABOUT_MAX);
  }
  const LINKS_MAX = 8;
  const LINK_ICONS = { telegram: "telegram-plane", x: "x-social", twitter: "x-social", github: "code", code: "code", docs: "doc", whitepaper: "doc" };
  function linksOf(inst) {
    const raw = inst.isToken ? inst.token && inst.token.links : inst.links;
    if (!Array.isArray(raw)) return [];
    const out = [], seen =   new Set();
    raw.forEach((l) => {
      if (out.length >= LINKS_MAX || !l || typeof l.url !== "string") return;
      let url;
      try {
        url = new URL(l.url);
      } catch (_) {
        return;
      }
      if (url.protocol !== "https:" || seen.has(url.href)) return;
      seen.add(url.href);
      const kind = typeof l.kind === "string" ? l.kind.toLowerCase() : "";
      out.push({ url: url.href, icon: LINK_ICONS[kind] || "globe", label: url.hostname.replace(/^www\./, "") });
    });
    return out;
  }
  const FLOW_POLL_MS = 2e4;
  const FLOW_TIMEOUT_MS = 8e3;
  function cleanFlow(body) {
    if (body && body.ok === true && body.none === true) return { none: true };
    if (body && body.ok === false && body.error === "busy") return { busy: true };
    if (!body || body.ok !== true) throw new Error("bad_response");
    const pct = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
    const usd = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
    if (!pct(body.buyPct) || !pct(body.sellPct) || !usd(body.buyUsd) || !usd(body.sellUsd) || !(body.buyUsd + body.sellUsd > 0)) throw new Error("bad_response");
    const trades = Number.isInteger(body.trades) && body.trades > 0 ? body.trades : null;
    if (body.window !== "24h" && !(body.window === "trades" && trades)) return { none: true };
    const source = body.source === "binance" || body.source === "binance-vision" ? "binance" : body.source === "geckoterminal" ? "pool" : null;
    return { buyPct: body.buyPct, sellPct: body.sellPct, buyUsd: body.buyUsd, sellUsd: body.sellUsd, window: body.window, trades, source };
  }
  function fetchFlow(inst) {
    const query = inst.isToken ? `id=${encodeURIComponent(inst.id)}` : `coin=${encodeURIComponent(inst.id)}`;
    const abort = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => {
      if (abort) abort.abort();
    }, FLOW_TIMEOUT_MS);
    return fetch(`api/tokens/flow?${query}`, { cache: "no-store", signal: abort ? abort.signal : void 0 }).then((res) => res.json()).then(cleanFlow).finally(() => clearTimeout(timer));
  }
  const OPS_FRESH_MS = 3e4;
  const OPS_SHOWN = 3;
  let opsMemo = null, opsJob = null;
  function walletOps(address) {
    if (opsMemo && opsMemo.address === address && Date.now() - opsMemo.at < OPS_FRESH_MS) return Promise.resolve(opsMemo.items);
    if (opsJob && opsJob.address === address) return opsJob.p;
    const T = CK.ton;
    const p = T.config().then(() => T.api(`wallet/history?address=${encodeURIComponent(address)}`)).then((answer) => {
      const items = DemoWallet.withoutPoison(DemoWallet.cleanEvents(answer.rows));
      opsMemo = { address, at: Date.now(), items };
      return items;
    }).finally(() => {
      if (opsJob && opsJob.p === p) opsJob = null;
    });
    opsJob = { address, p };
    return p;
  }
  const isTonAsset = (inst) => inst.isToken ? !!inst.token && inst.token.network === "ton" : COIN_HOME[inst.id] === "ton";
  function growFromRow(screen, row, under, parts) {
    const M = CK.motion;
    if (!M || typeof M.cardFromRow !== "function" || M.reduce || !M.armed || document.hidden || !screen.el.isConnected) return false;
    if (!row || !row.isConnected || !row.getBoundingClientRect || !under || !under.el || !under.el.contains(row)) return false;
    const r = row.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom <= 0 || r.top >= window.innerHeight) return false;
    screen.el.classList.add("tk-grow");
    under.el.classList.add("tk-grow-under");
    const rowLogo = row.querySelector("[data-motion-logo], .tk-logo, .coin");
    const cardLogo = screen.el.querySelector(".detail-logo");
    let watch2 = null, timer = 0;
    const release = () => {
      if (watch2) watch2.disconnect();
      clearTimeout(timer);
      screen.el.classList.remove("tk-grow");
      under.el.classList.remove("tk-grow-under");
    };
    watch2 = new MutationObserver(() => {
      if (!screen.el.classList.contains("is-moving")) release();
    });
    watch2.observe(screen.el, { attributes: true, attributeFilter: ["class"] });
    timer = setTimeout(release, 1500);
    M.cardFromRow(row, screen.el, { logo: rowLogo && cardLogo ? [rowLogo, cardLogo] : [null, null], parts });
    return true;
  }
  let cardSeq = 0;
  function openMenu(title, items, from) {
    if (CK.sheet.top) return;
    CK.haptic.light();
    let chosen = null;
    const words = (a) => typeof a.label === "function" ? a.label() : a.label;
    CK.sheet.open({
      title,
      build(b, sheet) {
        const rows = CK.el('<div class="sheet-list tk-menu"></div>');
        items.forEach((a, i) => {
          const row = CK.el(`<button class="cell press-row tk-menu-row" type="button"><span class="tk-menu-icon">${icon(a.icon, { size: 22, fill: typeof a.lit === "function" ? a.lit() : false })}</span><span class="cell-main"><span class="cell-title"></span></span></button>`);
          row.dataset.i = String(i);
          row.querySelector(".cell-title").textContent = words(a);
          rows.appendChild(row);
        });
        rows.addEventListener("click", (e) => {
          const row = e.target.closest(".tk-menu-row");
          if (!row) return;
          chosen = items[Number(row.dataset.i)];
          sheet.close();
        });
        b.appendChild(rows);
      },
      onClose() {
        if (chosen && chosen.onClick) chosen.onClick(from);
      }
    });
  }
  function openDetail(o) {
    const inst = o.inst;
    const fav = ctx.favAction ? ctx.favAction(inst) : null;
    const bell = ctx.alertAction ? ctx.alertAction(inst) : null;
    if (bell && window.DemoAlerts && typeof DemoAlerts.has === "function") bell.lit = () => DemoAlerts.has(inst);
    const share = ctx.shareAction ? ctx.shareAction(inst) : null;
    const copyItem = o.address ? { icon: "copy", label: tr("common.copyAddress"), onClick: () => copyAddress() } : null;
    const rare = [bell].concat(o.actions || [], copyItem).filter(Boolean);
    const menu = rare.length ? { icon: "more", label: tr("common.menu"), onClick(btn) {
      openMenu(o.title, rare, btn);
    } } : null;
    const actions = [menu, fav].filter(Boolean);
    const screen = CK.screen({ title: "", large: false, titleHtml: '<span class="detail-title"></span>', actions });
    const foldId = `tk-about-${++cardSeq}`;
    screen.el.setAttribute("aria-label", o.title);
    const titleEl = $(".detail-title", screen.el);
    titleEl.innerHTML = `<span class="detail-logo" data-motion-logo>${CK.coinLogo(inst, 28)}</span><span class="detail-names"><span class="detail-name" data-dock-anchor></span><span class="detail-net"></span></span>`;
    $(".detail-name", titleEl).textContent = o.title;
    const netEl = $(".detail-net", titleEl);
    const paintNet = () => {
      const name = networkLabel(inst);
      if (netEl.textContent !== name) netEl.textContent = name;
      netEl.hidden = !name;
    };
    paintNet();
    screen.el.classList.add("has-bar", "tk-card");
    screen.body.innerHTML = `
      <div class="screen-pad detail-head">
        <div class="detail-price-slot"><div class="detail-price"><span class="detail-roll roll"></span></div></div>
        <div class="detail-meta"><span class="detail-change"></span><span class="detail-delta" hidden></span><span class="detail-frame"></span>${ctx.STATUS_MARKET}</div>
      </div>
      <button class="tk-warn" type="button" hidden>${icon("warning", { size: 16 })}<span></span></button>
      <div class="detail-chart"></div>
      <div class="screen-pad detail-frames-row"><div class="detail-frames"></div></div>
      <section class="section tk-sec tk-held" hidden>
        <h2 class="section-title" ${L("tk.yourBalance")}>${tx("tk.yourBalance")}</h2>
        <div class="group tk-held-group">
          <div class="cell asset-row tk-held-row" hidden>${CK.coinLogo(inst, 40)}<span class="market-name"><b class="tk-held-amt"></b><span class="tk-held-usd"></span></span><span class="asset-right"><span class="tk-held-gain" hidden></span></span></div>
          <button class="cell press-row tk-levels-row" type="button" hidden><span class="cell-main"><span class="cell-title tk-levels-text"></span></span>${icon("chevron-right", { size: 16, className: "cell-chevron" })}</button>
        </div>
      </section>
      <div class="screen-pad tk-acts" hidden>
        <button class="tk-act press-row" type="button" data-act="buy" hidden>${icon("plus", { size: 22 })}<span ${L("common.buy")}>${tx("common.buy")}</span></button>
        <button class="tk-act press-row" type="button" data-act="sell" hidden>${icon("minus", { size: 22 })}<span ${L("common.sell")}>${tx("common.sell")}</span></button>
        <button class="cell press-row tk-orders" type="button" hidden><span class="cell-main"><span class="cell-title" ${L("detail.orders")}>${tx("detail.orders")}</span></span>${icon("shield", { size: 22 })}</button>
        <button class="tk-act press-row" type="button" data-act="share" hidden>${icon("share", { size: 22 })}<span ${L("share.aria")}>${tx("share.aria")}</span></button>
      </div>
      <section class="section tk-sec tk-ops" hidden>
        <div class="section-head"><h2 class="section-title" ${L("common.history")}>${tx("common.history")}</h2><button class="section-link tk-ops-all" type="button" ${L("tk.seeAll")}>${tx("tk.seeAll")}</button></div>
        <div class="group tk-ops-list" role="list"></div>
      </section>
      <section class="section tk-sec tk-about" hidden>
        <h2 class="section-title" ${L("tk.about")}>${tx("tk.about")}</h2>
        <div class="group tk-about-box"><p class="tk-about-text is-folded" id="${foldId}"></p><button class="tk-about-more" type="button" aria-expanded="false" aria-controls="${foldId}" hidden></button></div>
      </section>
      <section class="section tk-sec tk-overview" hidden>
        <h2 class="section-title" ${L("tk.overview")}>${tx("tk.overview")}</h2>
        <div class="group tk-facts"></div>
      </section>
      <section class="section tk-sec tk-activity" hidden>
        <h2 class="section-title" ${L("tk.activity")}>${tx("tk.activity")}</h2>
        <div class="group tk-activity-box">
          <div class="tk-fact tk-volume" hidden><span ${L("coin.volume")}>${tx("coin.volume")}</span><span class="tk-volume-value"></span></div>
          <div class="tk-flow" hidden>
            <div class="tk-flow-bar" aria-hidden="true"><i class="tk-flow-buy"></i><i class="tk-flow-sell"></i></div>
            <div class="tk-flow-legend"><span class="tk-flow-buys"></span><span class="tk-flow-sells"></span></div>
            <p class="tk-flow-note" hidden></p>
          </div>
        </div>
      </section>
      <section class="section tk-sec tk-links" hidden>
        <h2 class="section-title" ${L("tk.links")}>${tx("tk.links")}</h2>
        <div class="screen-pad tk-chips"></div>
      </section>`;
    const body = screen.body;
    const priceEl = $(".detail-roll", body), priceBox = $(".detail-price", body), frameLabel = $(".detail-frame", body), deltaEl = $(".detail-delta", body);
    const changeEl = $(".detail-change", body), chartHost = $(".detail-chart", body);
    screen.dock(priceBox, priceBox.parentNode, $(".detail-meta", body));
    const showSection = (el, on) => {
      if (el.hidden === !on) return;
      el.hidden = !on;
      if (on && CK.motion) CK.motion.blocks(el);
    };
    const CHART_SHARE = 0.3, CHART_FIT = [190, 260];
    const scroll = screen.scroll;
    function fitChart() {
      const ch = scroll.clientHeight;
      if (!ch) return;
      const h = Math.round(Math.min(CHART_FIT[1], Math.max(CHART_FIT[0], ch * CHART_SHARE)));
      if (Math.abs(chartHost.offsetHeight - h) >= 1) chartHost.style.height = h + "px";
      paintAboutFold();
    }
    const fitter = new ResizeObserver(fitChart);
    fitter.observe(scroll);
    const heldBox = $(".tk-held", body), heldRow = $(".tk-held-row", body), gainEl = $(".tk-held-gain", body);
    let levelsOrder = null;
    const levelsRow = $(".tk-levels-row", body), levelsText = $(".tk-levels-text", body);
    function paintGroup() {
      showSection(heldBox, !(heldRow.hidden && levelsRow.hidden));
    }
    const heldNow = () => D.balancesKnown ? D.holdings().find((row) => row.coin === inst && row.risk !== "suspicious") : null;
    function paintHeld() {
      const h = heldNow();
      heldRow.hidden = !h;
      if (h) {
        $(".tk-held-amt", heldRow).textContent = `${D.qty(h.amount)} ${inst.sym}`;
        $(".tk-held-usd", heldRow).textContent = h.priced ? fmt.usd(h.usd) : fmt.money("0");
      }
      paintGain(h);
      paintGroup();
    }
    function paintGain(h) {
      const wallet = CK.ton.wallet;
      const cost = h && wallet && window.DemoCost ? DemoCost.of(wallet.address, inst.id) : null;
      const now = inst.price > 0 ? inst.price : 0;
      gainEl.hidden = !cost || !(now > 0);
      if (gainEl.hidden) return;
      const amount = Math.min(h.amount, cost.amount);
      const diff = (now - cost.price) * amount;
      const pct = (now / cost.price - 1) * 100;
      const flat = Math.round(Math.abs(diff) * 100) === 0;
      gainEl.textContent = `${flat ? fmt.usd(0) : fmt.signedUsd(diff)} \xB7 ${flat ? fmt.pctAbs(0) : fmt.pct(pct)}`;
      gainEl.classList.toggle("is-up", !flat && diff > 0);
      gainEl.classList.toggle("is-down", !flat && diff < 0);
    }
    const acts = $(".tk-acts", body);
    const buyAct = $('[data-act="buy"]', acts), sellAct = $('[data-act="sell"]', acts), shareAct = $('[data-act="share"]', acts);
    const ordersRow = $(".tk-orders", acts);
    let actsMode = "wait";
    function paintActs() {
      const waiting = actsMode === "wait";
      const buy = waiting || actsMode === "trade" || actsMode === "create";
      const sell = waiting || actsMode === "trade" || actsMode === "sell";
      if (buyAct.hidden === buy) buyAct.hidden = !buy;
      if (sellAct.hidden === sell) sellAct.hidden = !sell;
      buyAct.disabled = waiting;
      sellAct.disabled = waiting;
      shareAct.hidden = !share;
      showSection(acts, !(buyAct.hidden && sellAct.hidden && ordersRow.hidden && shareAct.hidden));
    }
    acts.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      if (b.dataset.act === "share") {
        if (share) share.onClick(b);
        return;
      }
      if (actsMode === "trade" || actsMode === "sell") {
        (onOtherNet ? DemoNets : DemoSwap).open(inst, b.dataset.act);
        return;
      }
      if (actsMode === "create" && b.dataset.act === "buy") {
        CK.haptic.light();
        DemoWalletSetup.openCreate();
      }
    });
    const paintOrders = () => {
      const can = !!window.DemoSwap && typeof DemoSwap.canOrder === "function" && DemoSwap.canOrder(inst);
      const show = can && !levelsOrder;
      if (ordersRow.hidden === show) ordersRow.hidden = !show;
      paintActs();
    };
    ordersRow.addEventListener("click", () => {
      if (!DemoSwap.canOrder(inst)) return;
      CK.haptic.light();
      DemoSwap.open(inst, "sell", null, null, { orders: true });
    });
    const paintHeldAndCost = () => {
      paintHeld();
      paintOrders();
    };
    paintHeldAndCost();
    const stopBalances = D.onBalances(paintHeldAndCost);
    const stopCost = window.DemoCost ? DemoCost.onChange(paintHeldAndCost) : () => {
    };
    const stopOrdersWatch = window.DemoSwap ? DemoSwap.onChange(paintOrders) : () => {
    };
    const costTimer = setInterval(() => {
      if (!heldRow.hidden) paintHeldAndCost();
    }, 2e3);
    const stopHeld = () => {
      stopBalances();
      stopCost();
      stopOrdersWatch();
      clearInterval(costTimer);
    };
    const copyAddress = () => {
      CK.copyText(o.address.address).then((copied) => {
        if (copied) CK.toast(tx("common.addressCopied"), { icon: "check-circle", tone: "up" });
        else CK.toast(tx("common.copyFail"), { icon: "warning", tone: "down" });
      });
    };
    const overviewBox = $(".tk-overview", body), factsEl = $(".tk-facts", body);
    function paintOverview() {
      const rows = overviewOf(inst);
      const key = `${CK.i18n.lang}|${rows.map((r) => r.join("=")).join("|")}|${o.address ? o.address.address : ""}`;
      if (factsEl.dataset.key !== key) {
        factsEl.dataset.key = key;
        factsEl.innerHTML = "";
        rows.forEach(([label, value]) => {
          const row = CK.el('<div class="tk-fact"><span></span><span></span></div>');
          row.firstElementChild.textContent = tx(label);
          row.lastElementChild.textContent = value;
          factsEl.appendChild(row);
        });
        if (o.address) {
          const row = CK.el(`<button class="tk-fact tk-addr" type="button"><span></span><span class="tk-addr-value"><span class="tk-addr-text"></span>${icon("copy", { size: 15 })}</span></button>`);
          row.firstElementChild.textContent = tx("common.address");
          $(".tk-addr-text", row).textContent = shortAddress(o.address.address);
          row.setAttribute("aria-label", `${tx("common.copyAddress")}: ${o.address.network}, ${shortAddress(o.address.address)}`);
          row.addEventListener("click", () => {
            CK.haptic.light();
            copyAddress();
          });
          factsEl.appendChild(row);
        }
      }
      showSection(overviewBox, rows.length > 0 || !!o.address);
    }
    const activityBox = $(".tk-activity", body), volumeRow = $(".tk-volume", body), volumeValue = $(".tk-volume-value", body);
    const flowBox = $(".tk-flow", body);
    const flowOn = !!(CK.market && CK.market.mode === "live" && typeof fetch === "function");
    let flow = null, flowTimer = 0, flowSettled = !flowOn;
    const flowDay = () => !!flow && flow.window === "24h";
    function flowNote() {
      if (!flow) return "";
      if (flow.window !== "24h") return tx("tk.lastTrades", { n: flow.trades });
      return flow.source === "binance" ? tx("tk.srcBinance") : flow.source === "pool" ? tx("tk.srcPool") : "";
    }
    function paintFlow() {
      const on = !!flow;
      if (flowBox.hidden === on) {
        flowBox.hidden = !on;
        if (on && !activityBox.hidden && CK.motion) CK.motion.blocks(flowBox);
      }
      if (!on) return;
      $(".tk-flow-buy", flowBox).style.flexGrow = String(flow.buyPct);
      $(".tk-flow-sell", flowBox).style.flexGrow = String(flow.sellPct);
      const day = flowDay(), shares = day ? null : sharePcts(flow.buyPct);
      $(".tk-flow-buys", flowBox).textContent = day ? tx("tk.buys", { sum: compactUsd(flow.buyUsd) }) : tx("tk.buysPct", { pct: shares.buy });
      $(".tk-flow-sells", flowBox).textContent = day ? tx("tk.sells", { sum: compactUsd(flow.sellUsd) }) : tx("tk.sellsPct", { pct: shares.sell });
      const note = $(".tk-flow-note", flowBox), noteText = flowNote();
      note.hidden = !noteText;
      if (noteText) note.textContent = noteText;
    }
    function paintActivity() {
      const v = !flowSettled ? null : flowDay() ? flow.buyUsd + flow.sellUsd : volumeOf(inst);
      volumeRow.hidden = !v;
      if (v) volumeValue.textContent = compactUsd(v);
      paintFlow();
      showSection(activityBox, !!v || !!flow);
    }
    function askFlow() {
      flowTimer = 0;
      if (closed) return;
      const again = () => {
        if (!closed) flowTimer = setTimeout(askFlow, FLOW_POLL_MS);
      };
      if (document.hidden) {
        again();
        return;
      }
      const settle = () => {
        if (closed || flowSettled) return;
        flowSettled = true;
        paintActivity();
      };
      fetchFlow(inst).then((answer) => {
        if (closed) return;
        if (answer.busy) {
          settle();
          return;
        }
        flow = answer.none ? null : answer;
        flowSettled = true;
        paintActivity();
      }, settle).then(again);
    }
    const aboutBox = $(".tk-about", body), aboutText = $(".tk-about-text", body), aboutMore = $(".tk-about-more", body);
    let aboutOpen = false;
    function paintAboutFold() {
      if (aboutBox.hidden) return;
      aboutText.classList.toggle("is-folded", !aboutOpen);
      const more = aboutOpen || aboutText.scrollHeight > aboutText.clientHeight + 1;
      if (aboutMore.hidden === more) aboutMore.hidden = !more;
      aboutMore.textContent = tx(aboutOpen ? "tk.collapse" : "tk.expand");
      aboutMore.setAttribute("aria-expanded", String(aboutOpen));
    }
    function paintAbout() {
      const text = aboutOf(inst);
      if (text && aboutText.textContent !== text) aboutText.textContent = text;
      showSection(aboutBox, !!text);
      paintAboutFold();
    }
    aboutMore.addEventListener("click", () => {
      aboutOpen = !aboutOpen;
      CK.haptic.selection();
      paintAboutFold();
    });
    const linksBox = $(".tk-links", body), chipsEl = $(".tk-chips", body);
    function paintLinks() {
      const list = linksOf(inst);
      const key = list.map((l) => l.url).join(" ");
      if (chipsEl.dataset.key !== key) {
        chipsEl.dataset.key = key;
        chipsEl.innerHTML = "";
        list.forEach((l) => {
          const chip = CK.el(`<button class="tk-chip press" type="button">${icon(l.icon, { size: 18 })}<span></span></button>`);
          chip.lastElementChild.textContent = l.label;
          chip.addEventListener("click", () => {
            CK.haptic.light();
            CK.ton.openLink(l.url);
          });
          chipsEl.appendChild(chip);
        });
      }
      showSection(linksBox, list.length > 0);
    }
    const paintFacts = () => {
      paintOverview();
      paintActivity();
      paintAbout();
      paintLinks();
    };
    paintFacts();
    const opsBox = $(".tk-ops", body), opsList = $(".tk-ops-list", body);
    const sideIsThis = (token) => token === "ton" ? inst === D.byId.ton : typeof D.coinOfAddress === "function" && D.coinOfAddress(token) === inst;
    const opOfThis = (e) => e.kind === "swap" ? sideIsThis(e.gave.token) || sideIsThis(e.got.token) : sideIsThis(e.token);
    let opsItems = null;
    function historyToken() {
      if (inst === D.byId.ton) return "ton";
      const e = (opsItems || []).find(opOfThis);
      if (e) return e.kind === "swap" ? sideIsThis(e.got.token) ? e.got.token : e.gave.token : e.token;
      return inst.token && inst.token.network === "ton" && inst.token.address ? inst.token.address : null;
    }
    $(".tk-ops-all", body).addEventListener("click", () => {
      CK.haptic.light();
      if (window.DemoManage && typeof DemoManage.openHistory === "function") {
        const token = historyToken();
        DemoManage.openHistory(token ? { token } : void 0);
      } else DemoWallet.openHistory();
    });
    function opRow(e) {
      const swap = e.kind === "swap";
      const gotThis = swap && sideIsThis(e.got.token);
      const side = swap ? gotThis ? e.got : e.gave : e;
      const plus = swap ? gotThis : e.kind === "in";
      const cheque = !swap && e.kind === "out" && window.DemoCheques && typeof DemoCheques.isCheque === "function" && DemoCheques.isCheque(e.counterparty);
      const state = e.pending ? tx("walletFlow.pending") : e.failed ? tx("walletFlow.failed") : "";
      const glyph = swap ? "swap-circle" : cheque ? "gift" : plus ? "receive" : "send";
      const row = CK.el(`<div class="cell tk-op" role="listitem"><span class="tk-op-tile" aria-hidden="true">${icon(glyph, { size: 20 })}</span><span class="cell-main"><span class="tk-op-title"></span><span class="tk-op-sub"></span></span><span class="tk-op-amount"></span></div>`);
      row.dataset.key = e.key;
      $(".tk-op-title", row).textContent = swap ? tx("action.swap") : cheque ? tx("cheque.row") : tx(plus ? "tk.opIn" : "tk.opOut");
      $(".tk-op-sub", row).textContent = state || `${CK.i18n.dayShort(e.at)}, ${CK.i18n.clock(e.at)}`;
      const amount = $(".tk-op-amount", row);
      amount.textContent = `${plus ? "+" : "\u2212"}${D.qty(CK.ton.fromUnits(side.units, side.decimals))} ${side.sym}`;
      amount.classList.toggle("is-up", plus && !state);
      return row;
    }
    function paintOps() {
      const mine = (opsItems || []).filter(opOfThis).slice(0, OPS_SHOWN);
      if (!mine.length) {
        showSection(opsBox, false);
        return;
      }
      const key = `${CK.i18n.lang}|${mine.map((e) => `${e.key}${e.pending ? "p" : ""}${e.failed ? "f" : ""}`).join("|")}`;
      if (opsList.dataset.key === key) return;
      opsList.dataset.key = key;
      const appearing = opsBox.hidden;
      opsList.innerHTML = "";
      mine.forEach((e) => opsList.appendChild(opRow(e)));
      showSection(opsBox, true);
      if (CK.motion) CK.motion.rows(opsList, appearing ? { delay: 120 } : {});
    }
    const opsOn = isTonAsset(inst);
    function loadOps() {
      const wallet = CK.ton && CK.ton.wallet;
      if (closed || !opsOn || !wallet || !CK.market || CK.market.mode !== "live" || !window.DemoWallet || typeof DemoWallet.cleanEvents !== "function") return;
      walletOps(wallet.address).then((items) => {
        if (closed || CK.ton.wallet !== wallet) return;
        opsItems = items;
        paintOps();
      }, () => {
      });
    }
    const stopOpsBalances = opsOn ? D.onBalances(loadOps) : () => {
    };
    let scrubbing = false, frameId = "1d", hasSeries = false, hadPrice = inst.price > 0, noTradesProven = false, frameText = "", lastSeries = null;
    const hasPrice = () => inst.price > 0;
    const paintPrice = (v, up) => {
      priceBox.classList.toggle("is-none", !(v > 0));
      if (!(v > 0) && !noTradesProven && inst.isToken && !priceAsked.has(inst.id)) {
        if (!priceEl.querySelector(".tk-price-skel")) priceEl.innerHTML = PRICE_SKEL;
        return;
      }
      CK.priceTick(priceEl, v > 0 ? fmt.price(v) : noTradesProven ? tx("token.noTrades") : fmt.money("0"), up);
    };
    const periodOf = (tf) => FRAME_MS[tf] ? tx(`tk.per${tf}`) : "";
    const rangeOf = (s) => {
      if (s.rough || !s.from || !s.to) return "";
      const span = s.to - s.from, whole = FRAME_MS[s.tf];
      if (span >= whole * FRAME_FITS[0] && span <= whole * FRAME_FITS[1]) return "";
      const { clock, dayShort } = CK.i18n;
      if (span >= 1.5 * FRAME_MS["1d"]) return `${dayShort(s.from)} \u2013 ${dayShort(s.to)}`;
      return dayShort(s.from) === dayShort(s.to) ? `${clock(s.from)} \u2013 ${clock(s.to)}` : `${dayShort(s.from)} ${clock(s.from)} \u2013 ${dayShort(s.to)} ${clock(s.to)}`;
    };
    const frameTextOf = (s) => rangeOf(s) || periodOf(s.tf);
    const dayChange = (tf) => inst.isToken && tf === "1d" && inst.change !== null && inst.change !== void 0 ? inst.change : null;
    const pill = CK.chart.pill(changeEl, inst.change || 0);
    function paintDelta(pct, at) {
      const now = at > 0 ? at : inst.price;
      const shown = now > 0 && typeof pct === "number" && Number.isFinite(pct) && pct > -100 && !CK.changeFlat(pct);
      deltaEl.hidden = !shown;
      if (!shown) return;
      const d = now - now / (1 + pct / 100);
      deltaEl.textContent = `${d >= 0 ? "+" : "\u2212"}${fmt.price(Math.abs(d))}`;
      deltaEl.classList.toggle("is-up", d >= 0);
      deltaEl.classList.toggle("is-down", d < 0);
    }
    const setChange = (pct, at) => {
      pill.set(pct);
      paintDelta(pct, at);
    };
    let restChange = inst.change || 0;
    const setRestChange = (v) => {
      restChange = v;
      if (!scrubbing) setChange(v);
    };
    let frameWaiting = false;
    const metaEl = changeEl.parentNode;
    function paintMeta() {
      const show = hasSeries || inst.change !== null && inst.change !== void 0 && hasPrice();
      changeEl.hidden = !show;
      frameLabel.hidden = !show;
      if (!show) deltaEl.hidden = true;
      else if (!scrubbing) paintDelta(restChange);
      metaEl.classList.toggle("is-waiting", show && frameWaiting);
    }
    frameText = periodOf(frameId);
    frameLabel.textContent = frameText;
    paintPrice(inst.price);
    paintMeta();
    if (o.warning) {
      const warn = $(".tk-warn", body);
      warn.hidden = false;
      warn.classList.toggle("is-soft", o.warning === "detail.unverified");
      CK.i18n.setKey(warn.lastElementChild, o.warning);
      warn.addEventListener("click", () => {
        if (CK.sheet.top || !o.address) return;
        CK.haptic.light();
        CK.sheet.open({
          title: tx(o.warning),
          build(b) {
            b.innerHTML = `<div class="tk-why"><p class="tk-why-net"></p><p class="tk-why-addr"></p><button class="btn btn--tinted press tk-why-copy" type="button" ${L("common.copy")}>${tx("common.copy")}</button></div>`;
            $(".tk-why-net", b).textContent = o.address.network;
            $(".tk-why-addr", b).textContent = o.address.address;
            $(".tk-why-copy", b).addEventListener("click", copyAddress);
          }
        });
      });
    }
    const ROUGH_WAIT_MS = 3e4;
    const firstAsked = {};
    const firstPoints = o.rough ? void 0 : o.points;
    const LOADER_AFTER_MS = 1e3;
    let loaderTimer = 0;
    const loadingLater = () => {
      clearTimeout(loaderTimer);
      loaderTimer = setTimeout(() => {
        if (!closed && !hasSeries && !noTradesProven) chartHost.classList.add("tk-chart-loading");
      }, LOADER_AFTER_MS);
    };
    const markEmpty = () => {
      noTradesProven = true;
      clearTimeout(loaderTimer);
      chartHost.classList.remove("tk-chart-loading");
      chartHost.classList.add("tk-chart-empty");
      const typeBox = $(".chart-type", body);
      if (typeBox) typeBox.classList.add("is-off");
      hasSeries = false;
      paintPrice(inst.price);
      paintMeta();
      renderBar();
    };
    let closed = false, loadRun = 0, againTimer = 0, pendingTimer = 0;
    const refreshes = {};
    const retryDelay = (tries) => CHART_RETRY_MS[Math.min(tries, CHART_RETRY_MS.length - 1)] * (0.85 + Math.random() * 0.3);
    const showAgain = (tf) => {
      const tries = refreshes[tf] || 0;
      refreshes[tf] = tries + 1;
      clearTimeout(againTimer);
      againTimer = setTimeout(() => {
        if (!closed && tf === frameId) chart.show(tf);
      }, retryDelay(tries));
    };
    const attempt = (tf, run, tries) => {
      const current = () => !closed && run === loadRun;
      const wait = () => new Promise((resolve) => {
        setTimeout(resolve, retryDelay(tries));
      }).then(() => current() ? attempt(tf, run, tries + 1) : { keep: true });
      return o.load(tf).then((res) => {
        if (!current()) return { keep: true };
        const drawable = res && res.points && res.points.length >= 2;
        if (!(tf in firstAsked)) firstAsked[tf] = Date.now();
        if (drawable && res.rough && (hasSeries || Date.now() - firstAsked[tf] < ROUGH_WAIT_MS)) return wait();
        if (drawable && res.stale && lastSeries && lastSeries.tf === tf && !lastSeries.rough) {
          const answered = Math.min(res.points[res.points.length - 1][0] - res.points[0][0], FRAME_MS[tf]);
          const shown = Math.min(lastSeries.to - lastSeries.from, FRAME_MS[tf]);
          if (shown > answered * SHORTER_LINE) return wait();
        }
        if (drawable) {
          if (res.stale || res.rough) showAgain(tf);
          else refreshes[tf] = 0;
          return res;
        }
        if (res && res.noTrades && !hasPrice() && !(inst.token && inst.token.volume24h > 0)) {
          markEmpty();
          return { keep: true };
        }
        return wait();
      }, (err) => {
        if (!current() || CHART_FINAL_ERRORS.has(err && err.message)) return { keep: true };
        return wait();
      });
    };
    const load = (tf) => {
      clearTimeout(againTimer);
      return attempt(tf, ++loadRun, 0);
    };
    if (!firstPoints) loadingLater();
    const chart = CK.chart(chartHost, {
      points: firstPoints,
      rough: false,
      candles: firstPoints ? o.candles : void 0,
      tf: frameId,
      load,
      emptyText: o.emptyText,
      typeHome: $(".detail-frames-row", body),
      onSeries(s) {
        frameId = s.tf;
        hasSeries = true;
        frameWaiting = false;
        noTradesProven = false;
        clearTimeout(loaderTimer);
        chartHost.classList.remove("tk-chart-empty", "tk-chart-loading");
        if (!s.rough) {
          setRestChange(dayChange(s.tf) === null ? s.change : dayChange(s.tf));
        } else if (dayChange(s.tf) !== null) {
          setRestChange(dayChange(s.tf));
        }
        paintMeta();
        lastSeries = s;
        frameText = frameTextOf(s);
        if (scrubbing) return;
        paintPrice(inst.price);
        CK.chart.swapText(frameLabel, frameText);
      },
      onScrub(value) {
        if (frameWaiting && value !== null) return;
        scrubbing = value !== null;
        paintPrice(value === null ? inst.price : value);
        const start = lastSeries && lastSeries.first;
        if (value !== null && start > 0) setChange((value / start - 1) * 100, value);
        else setChange(restChange);
      }
    });
    const livePrice = (c) => c && c.price > 0 && (c.isToken || c.priced === true) ? c.price : 0;
    function paintLevels() {
      if (closed) return;
      const wallet = CK.ton.wallet;
      const order = window.DemoOrders && typeof DemoOrders.forToken === "function" ? DemoOrders.forToken(inst) : null;
      const own = !!order || D.balancesKnown && D.holdings().some((row) => row.coin === inst && row.risk !== "suspicious");
      const cost = own && wallet && window.DemoCost ? DemoCost.of(wallet.address, inst.id) : null;
      const view = cardLevels({ order, cost, price: livePrice(inst), gramUsd: livePrice(D.byId.ton) });
      chart.levels(view.levels);
      levelsOrder = view.row ? order.id : null;
      if (levelsRow.hidden === !!view.row) levelsRow.hidden = !view.row;
      if (view.row && levelsText.textContent !== view.row) levelsText.textContent = view.row;
      paintGroup();
      paintOrders();
      const aria = view.row ? `${view.row}, ${tx("chart.levelsOpen")}` : "";
      if (aria && levelsRow.getAttribute("aria-label") !== aria) levelsRow.setAttribute("aria-label", aria);
    }
    levelsRow.addEventListener("click", () => {
      if (!levelsOrder) return;
      CK.haptic.light();
      DemoOrders.open(levelsOrder);
    });
    const stopLevelsFollow = window.DemoOrders && typeof DemoOrders.drawable === "function" && DemoOrders.drawable(inst) ? DemoOrders.follow(paintLevels) : () => {
    };
    const stopLevelsBalances = D.onBalances(paintLevels);
    const stopLevelsCost = window.DemoCost ? DemoCost.onChange(paintLevels) : () => {
    };
    const onLevelTick = (c) => {
      if (c === inst || c === D.byId.ton) paintLevels();
    };
    ctx.tickListeners.add(onLevelTick);
    paintLevels();
    if (o.prefetch) D.FRAMES.forEach((f) => {
      o.load(f.value).catch(() => {
      });
    });
    if (o.prefetchFrames) {
      let round = 0;
      const again = () => {
        if (closed) return;
        o.prefetchFrames(frameId).then((missing) => {
          if (!closed && missing.length && ++round < PREFETCH_ROUNDS_MS.length) setTimeout(again, PREFETCH_ROUNDS_MS[round]);
        });
      };
      setTimeout(again, PREFETCH_ROUNDS_MS[0]);
    } else if (o.prefetchFrame) {
      setTimeout(() => {
        if (!closed) D.FRAMES.forEach((f) => {
          if (f.value !== frameId) o.prefetchFrame(f.value);
        });
      }, PREFETCH_FRAMES_MS);
    }
    CK.segmented($(".detail-frames", body), {
      label: tr("chart.period"),
      size: "small",
      value: "1d",
      items: D.FRAMES.map((f) => ({ value: f.value, label: f.label })),
      onChange(v) {
        frameId = v;
        const held = o.lineNow && o.lineNow(v);
        if (held) chart.setSeries(held, true, { tf: v, stale: true, candles: o.candlesNow && o.candlesNow(v) });
        else if (o.lineNow && hasSeries && !noTradesProven) {
          frameWaiting = true;
          chart.pending(true);
          paintMeta();
          clearTimeout(pendingTimer);
          pendingTimer = setTimeout(() => {
            if (closed || !frameWaiting || frameId !== v) return;
            chart.pending(false);
            chartHost.classList.add("tk-chart-loading");
          }, PENDING_MAX_MS);
        }
        chart.show(v);
      }
    });
    const bar = CK.el('<div class="detail-bar"></div>');
    screen.el.insertBefore(bar, $(".screen-dim", screen.el));
    const onOtherNet = DemoNets.listed(inst);
    if (onOtherNet) {
      DemoNets.loadBalances();
      DemoNets.ensurePrice(inst);
    }
    let route = inst.isToken && !onOtherNet ? knownPool(inst) : true, routeAsked = false, routeWaited = false, routeTimer = 0, routeWaitTimer = 0;
    function askRoute() {
      askPool(inst).then((found) => {
        if (closed) return;
        if (found === null) {
          routeWaited = true;
          routeTimer = setTimeout(askRoute, POOL_RETRY_MS);
        } else {
          route = found;
        }
        renderBar();
      });
    }
    function startRoute() {
      routeAsked = true;
      routeWaitTimer = setTimeout(() => {
        routeWaited = true;
        renderBar();
      }, POOL_WAIT_MS);
      askRoute();
    }
    function barMode() {
      if (!inst.isToken && !hasPrice()) return "wait";
      if (!onOtherNet && !DemoSwap.eligible(inst)) {
        if (inst.token && inst.token.risk === "suspicious") return "trade.suspect";
        return DemoNets.networkOf(inst) === "tron" ? "xnet.tronOnly" : "swapSheet.noPool";
      }
      const swaps = DemoSwap.state;
      if (swaps === "closed") return "trade.closed";
      if (swaps === "failed") return "market.down";
      if (swaps !== "open") return "wait";
      const wallet = CK.ton.wallet, status = CK.wallet.status;
      if (!wallet && status.kind === "unknown") return walletAsked ? "market.down" : "wait";
      if (wallet && wallet.readOnly) return "trade.noSign";
      if (status.lost) return "wallet.lost";
      if (status.denied) return "wallet.denied";
      if (status.bioUnknown) return "wallet.bioWait";
      if (onOtherNet && status.tonOnly) return "xnet.tonOnly";
      if (!wallet && !(window.DemoWalletSetup && status.setup)) return "wallet.phoneOnly";
      if (route === false) return "swapSheet.noPool";
      if (route === void 0) {
        if (!routeAsked) startRoute();
        if (!routeWaited) return "wait";
      }
      const only = onOtherNet ? null : sellOnlyMode(inst, D.balancesKnown ? D.holdings() : [], DemoSwap.buyable);
      if (only) return only;
      return wallet ? "trade" : "create";
    }
    function renderBar() {
      if (closed) return;
      const mode = barMode();
      if (actsMode !== mode) {
        actsMode = mode;
        paintActs();
      }
      if (bar.dataset.mode === mode) return;
      const replaces = !!bar.dataset.mode;
      bar.dataset.mode = mode;
      bar.classList.toggle("is-waiting", mode === "wait");
      const button = (side, key) => `<button class="btn btn--${side} press" type="button" data-side="${side}" ${L(key)}>${tx(key)}</button>`;
      if (mode === "wait") bar.innerHTML = '<div class="tk-bar-wait"></div>';
      else if (mode === "trade") bar.innerHTML = `<div class="btn-row">${button("buy", "common.buy")}${button("sell", "common.sell")}</div>`;
      else if (mode === "create") bar.innerHTML = `<div class="btn-row">${button("buy", "common.buy")}</div>`;
      else if (mode === "sell") bar.innerHTML = `<div class="btn-row">${button("sell", "common.sell")}</div>`;
      else bar.innerHTML = `<p class="tk-notice" ${L(mode)}>${tx(mode)}</p>`;
      if (replaces) bar.firstElementChild.classList.add("tk-bar-in");
    }
    renderBar();
    const stopSwapWatch = DemoSwap.onChange(renderBar);
    const stopBarBalances = D.onBalances(renderBar);
    CK.wallet.ready.then(renderBar);
    CK.wallet.ready.then(paintOrders);
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-side]");
      if (!b) return;
      if (bar.dataset.mode === "trade" || bar.dataset.mode === "sell") {
        (onOtherNet ? DemoNets : DemoSwap).open(inst, b.dataset.side);
        return;
      }
      CK.haptic.light();
      DemoWalletSetup.openCreate();
    });
    const onTick = (c, up) => {
      if (c !== inst) return;
      if (!scrubbing) paintPrice(inst.price, hadPrice ? up : null);
      renderBar();
      if (!hadPrice && hasPrice()) {
        hadPrice = true;
        noTradesProven = false;
        chartHost.classList.remove("tk-chart-empty");
        if (!hasSeries) loadingLater();
        chart.show(frameId);
      }
      if (dayChange(frameId) !== null) setRestChange(dayChange(frameId));
      paintMeta();
      paintHeld();
      paintFacts();
    };
    ctx.tickListeners.add(onTick);
    const onAsked = (ids) => {
      if (!scrubbing && ids.includes(inst.id)) paintPrice(inst.price);
    };
    askedListeners.add(onAsked);
    watch(inst);
    if (inst.isToken && !hasPrice() && !priceAsked.has(inst.id)) tickWatched();
    loadOps();
    if (flowOn) askFlow();
    CK.i18n.bind(screen.el, () => {
      if (!scrubbing) {
        paintPrice(inst.price);
        paintDelta(restChange);
      }
      frameText = lastSeries ? frameTextOf(lastSeries) : periodOf(frameId);
      frameLabel.textContent = frameText;
      paintNet();
      paintHeld();
      paintLevels();
      paintFacts();
      paintOps();
    });
    const under = o.stack.top;
    o.stack.push(screen, {
      returnFocus: o.from,
      onClose() {
        closed = true;
        clearTimeout(againTimer);
        clearTimeout(pendingTimer);
        clearTimeout(routeTimer);
        clearTimeout(routeWaitTimer);
        clearTimeout(loaderTimer);
        clearTimeout(flowTimer);
        stopSwapWatch();
        stopBarBalances();
        stopHeld();
        stopOpsBalances();
        stopLevelsFollow();
        stopLevelsBalances();
        stopLevelsCost();
        ctx.tickListeners.delete(onLevelTick);
        ctx.tickListeners.delete(onTick);
        askedListeners.delete(onAsked);
        unwatch(inst);
        fitter.disconnect();
        chart.destroy();
      }
    });
    growFromRow(screen, o.from, under, Array.from(body.children).filter((el) => !el.hidden && el !== chartHost && !el.classList.contains("detail-head")));
    return screen;
  }
  function openToken(token, from) {
    const inst = instrumentOf(token);
    if (!inst.isToken) {
      ctx.openCoin(inst, from);
      return;
    }
    const networkName = (id) => CK.market.networkName(id) || (id ? id.toUpperCase() : "");
    const pinned = (points) => {
      if (!points || points.length < 2 || !(inst.price > 0)) return points;
      const last = points[points.length - 1];
      if (Math.abs(inst.price / last[1] - 1) > PIN_MAX_GAP) return points;
      const now = chartNow();
      const head = now - last[0] < PIN_REPLACE_MS ? points.slice(0, -1) : points;
      return head.concat([[Math.max(now, last[0]), inst.price]]);
    };
    const rowLine = inst.token.spark;
    const realLine = CK.market.tokenChartNow(inst.id, "1d");
    openDetail({
      inst,
      title: inst.sym,
      from,
      stack: ctx.currentStack(),
      points: realLine ? pinned(realLine) : void 0,
      rough: false,
      candles: realLine ? CK.market.tokenCandlesNow(inst.id, "1d") : void 0,
      load: (tf) => CK.market.tokenKlines(inst.id, tf, { frames: true }).then((res) => {
        if (res.points.length < 2) return res;
        return { ...res, points: pinned(res.rough && tf === "1d" && rowLine ? rowLine : res.points) };
      }),
      lineNow: (tf) => {
        const line = CK.market.tokenChartNow(inst.id, tf);
        return line ? pinned(line) : null;
      },
      candlesNow: (tf) => CK.market.tokenCandlesNow(inst.id, tf),
      prefetchFrames: (tf) => CK.market.prefetchFrames(inst.id, tf),
      emptyText: tr("detail.noDeals"),
      warning: inst.token.risk === "suspicious" ? "detail.fake" : inst.token.unverified ? "detail.unverified" : "",

      address: { network: networkName(inst.token.network), address: inst.token.address }
    });
    refreshToken(inst).then(() => {
      if (!(inst.price > 0)) askPool(inst);
    });
  }
  function openHeldToken(id, from) {
    const inst = instruments.get(id);
    if (inst) openToken(inst.token, from);
  }
  let feed = null, walletAsked = false;
  window.DemoTrade = {

    chosenFirst,
    rowTag,
    sellOnlyMode,
    noPriceKey,

    onNetwork,
    favShown,

    cardLevels,
    build(context) {
      ctx = context;
      feed = buildFeed();
      setInterval(() => pollTokens(), REFRESH_MS);
      setInterval(tickWatched, TICK_MS);
      CK.market.onTokenTick(onPushedPrice);
      CK.market.onStream((sid) => {
        if (sid) tickWatched();
      });
      CK.wallet.ready.then(() => {
        walletAsked = true;
      });
      D.onBalances(() => {
        if (D.holdings().some((h) => h.coin.isToken && !(h.coin.price > 0))) pollTokens(true);
      });
      document.addEventListener("visibilitychange", () => pollTokens());
      return { openDetail, openHeldToken, reloadMarket: () => feed.reloadMarket(), onShow: () => feed.onShow() };
    },
    watch,
    unwatch,
    refreshToken,
    feedStats: () => feed.stats()
  };
})();
