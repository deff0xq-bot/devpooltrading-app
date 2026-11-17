(function () {
  'use strict';
  const { fmt, icon, t: tx, tr } = CK;
  const { L, LA, LP } = CK.i18n;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);

  if (CK.i18n && typeof CK.i18n.add === 'function') {
    CK.i18n.add({
      'tk.yourBalance': ['Ваш баланс', 'Your balance', 'Ваш баланс', 'Сіздің балансыңыз'],
      'tk.seeAll': ['Смотреть все', 'See all', 'Дивитися всі', 'Барлығын көру'],
      'tk.buyFirst': ['сначала покупка', 'buy first', 'спершу купівля', 'алдымен сатып алу'],
      'tk.about': ['О токене', 'About', 'Про токен', 'Токен туралы'],
      'tk.expand': ['Ещё', 'More', 'Ще', 'Тағы'],
      'tk.collapse': ['Свернуть', 'Less', 'Згорнути', 'Жию'],
      'tk.overview': ['Обзор', 'Overview', 'Огляд', 'Шолу'],
      'tk.supply': ['Общее предложение', 'Total supply', 'Загальна пропозиція', 'Жалпы ұсыныс'],
      'tk.circulating': ['В обращении', 'Circulating', 'В обігу', 'Айналымда'],
      'tk.activity': ['Торговая активность за 24 ч', 'Trading activity, 24h', 'Торгова активність за 24 год', 'Сауда белсенділігі, 24 сағ'],
      'tk.buys': ['Покупки · {sum}', 'Buys · {sum}', 'Купівлі · {sum}', 'Сатып алу · {sum}'],
      'tk.sells': ['Продажи · {sum}', 'Sells · {sum}', 'Продажі · {sum}', 'Сату · {sum}'],
      'tk.lastTrades': ['По последним {n} сделкам', 'Last {n} trades', 'За останніми {n} угодами', 'Соңғы {n} мәміле бойынша'],
      'tk.buysPct': ['Покупки · {pct}', 'Buys · {pct}', 'Купівлі · {pct}', 'Сатып алу · {pct}'],
      'tk.sellsPct': ['Продажи · {pct}', 'Sells · {pct}', 'Продажі · {pct}', 'Сату · {pct}'],
      'tk.srcBinance': ['По данным Binance', 'Binance data', 'За даними Binance', 'Binance деректері'],
      'tk.srcPool': ['По крупнейшему пулу', 'Deepest pool', 'За найбільшим пулом', 'Ең ірі пул бойынша'],
      'tk.links': ['Ссылки', 'Links', 'Посилання', 'Сілтемелер'],
      'tk.opIn': ['Получено', 'Received', 'Отримано', 'Алынды'],
      'tk.opOut': ['Отправлено', 'Sent', 'Надіслано', 'Жіберілді'],
      'tk.per1h': ['за час', 'past hour', 'за годину', 'соңғы сағатта'],
      'tk.per1d': ['за сутки', 'past day', 'за добу', 'тәулікте'],
      'tk.per1w': ['за неделю', 'past week', 'за тиждень', 'аптада'],
      'tk.per1m': ['за месяц', 'past month', 'за місяць', 'айда'],
      'tk.per1y': ['за год', 'past year', 'за рік', 'жылда'],
      'trade.allNets': ['Все сети', 'All networks', 'Усі мережі', 'Барлық желілер'],
      'trade.favNoneNet': ['В сети {net} нет избранного', 'No favorites on {net}', 'У мережі {net} немає обраного', '{net} желісінде таңдаулы жоқ']
    });
  }

  const ROW_H = 72;
  const SLOT_TRANSLATE = typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('translate', '0 1px');
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
  const FIRST_PAGE_FOR_MS = 300000;
  const FIRST_PAGES_KEPT = 40;
  const LOGOS_WARMED = 11;
  const WARM_NETWORKS = 2;
  const OFFSCREEN_ROWS_PER_FRAME = 6;
  const REFRESH_MS = 30000;
  const TICK_MS = 3500;
  const TICK_MIN_GAP_MS = 1500;
  const POLL_PARALLEL = 3;
  const POLL_MIN_GAP_MS = 10000;
  const UNPRICED_AGAIN_MS = 60000;
  const UP_BUTTON_AFTER_PX = 1600;
  const FAILED_LOGOS_KEPT = 2000;
  const LOGO_RETRY_MS = 60000;
  const RETRY_PAGE_MS = 5000;
  const WARMING_RETRY_MS = 4000;
  const WARMING_SLOW_RETRY_MS = 20000;
  const WARMING_TRIES = 10;
  const CHART_RETRY_MS = [700, 1200, 2000, 3500, 6000, 10000];
  const CHART_FINAL_ERRORS = new Set(['bad_request', 'not_found', 'bad_id', 'bad_tf']);
  const FRAME_MS = { '1h': 36e5, '1d': 864e5, '1w': 6048e5, '1m': 2592e6, '1y': 31536e6 };
  const FRAME_FITS = [.6, 1.25];
  const chartNow = () => (CK.market && typeof CK.market.serverNow === 'function' ? CK.market.serverNow() : Date.now());
  const SHORTER_LINE = 1.1;
  const PIN_MAX_GAP = .3;
  const PIN_REPLACE_MS = 60000;
  const PREFETCH_FRAMES_MS = 400;
  const PREFETCH_ROUNDS_MS = [900, 1500, 2500, 4000, 8000];
  const PENDING_MAX_MS = 2500;
  const OPEN_RISE_MS = 160, OPEN_STAGGER_MS = 38;
  const RAIL_RETRY_MS = 5000;
  const RAIL_RETRY_SLOW_MS = 20000;
  const RAIL_QUICK_TRIES = 24;
  const PREFETCH_ROWS = 6;
  const PREFETCH_AGAIN_MS = 60000;
  const PREFETCHED_KEPT = 500;
  const POOL_PROBE_USD = 100;
  const POOL_RETRY_MS = 5000;
  const POOL_WAIT_MS = 1500;
  const POOL_KEPT_MS = 300000;

  let ctx = null;

  const FAV = 'fav';
  const ALL_NETS = 'all';
  const SORTS = [
    { value: 'popular', key: 'sort.top', aria: 'sort.popular' },
    { value: 'gainers', key: 'trade.segUp', aria: 'filter.up' },
    { value: 'losers', key: 'trade.segDown', aria: 'filter.down' },
    { value: FAV, key: 'filter.fav' }
  ];
  const NET_SHEET_H = 360;
  function safeBottom() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;height:var(--safe-bottom)';
    document.body.appendChild(probe);
    const px = probe.offsetHeight;
    probe.remove();
    return px;
  }
  const HOME_NET = { eth: 'eth', sol: 'solana', bnb: 'bsc', btc: 'bitcoin', trx: 'tron', ton: 'ton' };
  const signedPct = (v) => (CK.changeFlat(v) ? fmt.pctAbs(0) : fmt.pct(v));
  function chosenFirst(tokens, network) {
    const lead = (t) => t.network === network && t.price > 0;
    const mine = tokens.filter(lead);
    return mine.length && mine.length < tokens.length ? mine.concat(tokens.filter((t) => !lead(t))) : tokens;
  }
  function rowTag(t) {
    if (t.risk === 'suspicious') return { key: 'risk.bad', tone: 'down' };
    if (t.unverified) return { key: 'token.unverified', tone: 'warn' };
    return null;
  }
  function sellOnlyMode(inst, holdings, buyable) {
    if (!inst || !inst.isToken || buyable(inst)) return null;
    return holdings.some((h) => h.coin === inst && !h.net && h.risk === 'none') ? 'sell' : 'swap.refusedToken';
  }
  function noPriceKey(t) {
    if (t.risk === 'no_liquidity') return 'token.noTrades';
    const onTon = t.network === 'ton' || String(t.id || '').startsWith('ton:');
    const audit = CK.swapAudit, ton = CK.ton;
    if (!onTon || !audit || typeof audit.swappable !== 'function' || !ton || typeof ton.rawAddress !== 'function') return 'token.canBuy';
    const raw = ton.rawAddress(t.address);
    return raw && audit.swappable(raw) ? 'token.canBuy' : null;
  }
  const noPriceText = (t) => { const key = noPriceKey(t); return key ? tx(key) : fmt.money('0'); };

  function cardLevels({ order, cost, price, gramUsd }) {
    const levels = [];
    let row = null;
    if (order) {
      const now = price > 0 && gramUsd > 0 ? price / gramUsd : order.now;
      const pct = (p) => `${p < 0 ? '−' : '+'}${fmt.num(Math.abs(p), Math.abs(p) >= 9.95 ? 0 : 1)}${CK.i18n.lang === 'en' ? '%' : ' %'}`;
      const parts = [];
      ['stop', 'take'].forEach((kind) => {
        const at = order[kind];
        if (!(at > 0)) return;
        const name = tx(`orders.${kind}`);
        if (gramUsd > 0) levels.push({ price: at * gramUsd, kind, label: tx(kind === 'stop' ? 'chart.tipStop' : 'chart.tipTake', { price: fmt.price(at * gramUsd) }) });
        if (order.quiet || !(now > 0)) {
          parts.push(name);
          return;
        }
        const p = (at / now - 1) * 100;
        parts.push(kind === 'stop' && p >= 0 ? tx('orders.atStop') : `${name} ${pct(p)}`);
      });
      if (order.quiet) parts.push(tx(order.quiet === 'halted' ? 'orders.halted' : 'orders.stalled'));
      row = parts.length ? parts.join(' · ') : null;
    }
    if (cost && cost.price > 0) levels.push({ price: cost.price, kind: 'entry', label: tx('chart.tipEntry', { price: fmt.price(cost.price) }) });
    return { levels, row };
  }

  function shortAddress(a) {
    const chars = Array.from(a || '');
    return chars.length > 12 ? `${chars.slice(0, 5).join('')}…${chars.slice(-4).join('')}` : chars.join('');
  }
  function logoSlot(url, sym, cls) {
    const slot = CK.el(`<span class="tk-logo ${cls || ''}"><span class="tk-tile" aria-hidden="true"></span><img class="tk-img" alt="" draggable="false" decoding="async" referrerpolicy="no-referrer"></span>`);
    slot.firstElementChild.textContent = CK.initials(sym);
    const img = slot.lastElementChild;
    img.addEventListener('load', () => img.classList.add('is-on'));
    img.addEventListener('error', () => img.removeAttribute('src'));
    if (url && CK.logos.ready(url)) {
      img.classList.add('is-on', 'is-instant');
      img.decoding = 'sync';
      img.src = CK.logos.src(url);
    } else if (url) {
      CK.logos.hold(url);
      img.src = url;
    }
    return slot;
  }

  const { instruments, applyToken, instrumentOf } = D;

  const watched = new Map();
  function watch(inst) {
    if (inst.isToken) watched.set(inst.id, (watched.get(inst.id) || 0) + 1);
  }
  function unwatch(inst) {
    if (!inst.isToken) return;
    const n = (watched.get(inst.id) || 0) - 1;
    if (n > 0) watched.set(inst.id, n);
    else watched.delete(inst.id);
  }
  const priceAsked = new Set(), askedListeners = new Set();
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
    }).catch(() => { }).then(() => markAsked([inst.id]));
  }
  const poolAnswers = new Map(), poolJobs = new Map();
  function askPool(inst) {
    if (poolJobs.has(inst.id)) return poolJobs.get(inst.id);
    const job = CK.market.tokenQuote(inst.id, 'buy', POOL_PROBE_USD).then((q) => {
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
    return hit && Date.now() - hit.at < POOL_KEPT_MS ? hit.found : undefined;
  }
  let pollRunning = false, pollAt = 0;
  const unpricedAskedAt = new Map();
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
    queue.forEach((id) => { const inst = instruments.get(id); if (!(inst.price > 0)) unpricedAskedAt.set(id, at); });
    const worker = () => {
      const id = queue.shift();
      return id ? refreshToken(instruments.get(id)).then(worker) : Promise.resolve();
    };
    const workers = [];
    for (let i = 0; i < POLL_PARALLEL; i++) workers.push(worker());
    Promise.all(workers).then(() => ctx.valuesChanged()).finally(() => { pollRunning = false; });
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
  const STREAM_RENEW_MS = 12000;
  function askedRecently(memo, ids) {
    const sid = CK.market.streamId;
    const key = ids.join(',') + '|' + (sid || '');
    if (sid && memo.key === key && Date.now() - memo.at < STREAM_RENEW_MS) return true;
    memo.key = key;
    memo.at = Date.now();
    return false;
  }
  const watchedAsk = { key: '', at: 0 };
  function tickWatched() {
    if (document.hidden) return;
    const ids = new Set(watched.keys());
    D.holdings().forEach((h) => { if (h.coin.isToken && !h.coin.viewOnly) ids.add(h.coin.id); });
    const asked = Array.from(ids);
    if (!ids.size || askedRecently(watchedAsk, asked)) return;
    CK.market.tokenPrices(asked).then((rows) => {
      let moved = false;
      rows.forEach((r) => { if (landTokenPrice(r)) moved = true; });
      if (moved) ctx.valuesChanged();
    }).catch(() => { watchedAsk.at = 0; }).then(() => markAsked(asked));
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
    const shown = price > 0 ? fmt.price(price) : priceAsked.has(t.id) ? fmt.money('0') : '';
    return `
      <button class="cell market-row press-row" type="button" data-coin="${CK.esc(t.id)}" aria-label="${CK.esc(t.name)}${shown ? `, ${shown}` : ''}">
        ${CK.coinLogo(t, 40)}
        <span class="market-name"><b>${CK.esc(t.name)}</b><span>${CK.esc(t.sym)}</span></span>
        <span class="market-price"><b data-price>${shown || PRICE_SKEL}</b>${typeof change === 'number' ? CK.changePill(change, { plain: true }) : ''}</span>
      </button>`;
  }
  const instRow = (c) => (c.isToken ? favTokenRow(c) : CK.cards.market(c));
  const favRows = () => D.coins.filter((c) => c.favorite).concat(DemoFavorites.tokens());
  function onNetwork(inst, net) {
    if (inst.isToken) return ((inst.token && inst.token.network) || String(inst.id).split(':')[0]) === net.id;
    const home = COIN_HOME[inst.id];
    return !!home && (home === net.id || NET_WORDS[home] === net.name);
  }
  const nameMatches = (c, q) => (c.name || '').toLowerCase().includes(q) || (c.sym || '').toLowerCase().includes(q);
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
      host.innerHTML = html ? `<div${filling ? ' class="list-in"' : ''}>${html}</div>` : '';
      return;
    }
    let wrap = host.firstElementChild;
    if (!wrap) {
      wrap = document.createElement('div');
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
    const blocksEl = $('.tk-blocks', body);
    const moversTrack = $('.tk-movers .carousel-track', body);
    const favsEl = $('.tk-favs', body), favList = $('.tk-fav-list', body), favEmpty = $('.tk-fav-empty', body);
    const coinsEl = $('.tk-coins', body), coinsList = $('.tk-coins-list', body);
    const query = () => f.input.value.trim().toLowerCase();
    const searching = () => !!query();

    const movers = () => D.coins.filter((c) => c.id !== 'usdt').sort((a, b) => Math.abs(b.change || 0) - Math.abs(a.change || 0));
    const moversCarousel = CK.carousel($('.tk-movers-car', body), { label: tr('markets.leaders') });
    const MOVER_W = 200, MOVER_CHART_H = 58, MOVER_PAD = [6, 14];
    const lineOpts = (id) => ({ width: MOVER_W, height: MOVER_CHART_H, pad: MOVER_PAD, cls: 'tk-mover-line', id, dot: false });
    const lineId = (kind, c) => `tk-mover-${kind}-${String(c.id).replace(/[^\w-]/g, '_')}`;
    const SKEL_SERIES = Array.from({ length: 24 }, (_, i) => Math.sin(i / 23 * Math.PI * 1.6 + .5) + i / 30);
    const skelLine = (id) => CK.sparkline(SKEL_SERIES, lineOpts(id));
    let moverLines = !document.documentElement.classList.contains('market-pending');
    const moverTone = (c) => (typeof c.change === 'number'
      ? (CK.changeFlat(c.change) ? 'flat' : c.change > 0 ? 'up' : 'down')
      : (c.series[c.series.length - 1] >= c.series[0] ? 'up' : 'down'));
    const moverChart = (c) => (moverLines && c.series && c.series.length > 1
      ? CK.sparkline(c.series, lineOpts(lineId('line', c)))
      : skelLine(lineId('skel', c)));
    const moverShown = new Map();
    const moverCard = (c) => `
      <button class="card coin-card tk-mover press" type="button" data-coin="${CK.esc(c.id)}" aria-label="${CK.esc(c.name)}, ${fmt.price(c.price)}">
        <span class="tk-mover-top">${CK.coinLogo(c, 36)}<span class="tk-mover-sym">${CK.esc(c.sym)}</span>${typeof c.change === 'number' ? CK.changePill(c.change, { plain: true }) : ''}</span>
        <span class="coin-card-price" data-price>${fmt.price(c.price)}</span>
        <span class="tk-mover-chart is-${moverLines ? moverTone(c) : 'skel'}" aria-hidden="true">${moverChart(c)}</span>
      </button>`;
    function paintMovers() {
      const list = movers();
      const html = list.map(moverCard).join('');
      if (moversTrack._html === html) return;
      const drawOn = moverLines && moversTrack._skel;
      const breath = drawOn ? moversTrack.querySelector('.tk-mover-chart.is-skel .tk-mover-line') : null;
      const from = breath ? Math.min(1, +getComputedStyle(breath).opacity || 1) : 1;
      moversTrack._html = html;
      moversTrack._skel = !moverLines;
      moversTrack.innerHTML = html;
      moverShown.clear();
      list.forEach((c) => moverShown.set(c.id, { series: c.series, key: moverLines ? c.series.join() : '', tone: moverTone(c) }));
      moversCarousel.refresh();
      if (drawOn) drawMoverLines(from);
    }
    function drawMoverLines(from) {
      if (!CK.motion || document.visibilityState === 'hidden') return;
      const quick = CK.reducedMotion();
      const ease = 'cubic-bezier(.22,1,.36,1)';
      const box = moversTrack.parentElement.getBoundingClientRect();
      const seen = Array.from(moversTrack.querySelectorAll('.tk-mover-chart svg')).filter((svg) => {
        const r = svg.getBoundingClientRect();
        return r.width > 0 && r.right > box.left && r.left < box.right;
      });
      seen.forEach((svg) => {
        if (typeof svg.animate !== 'function') return;
        CK.motion.chart(svg);
        const drawn = typeof svg.getAnimations === 'function' && svg.getAnimations().length > 0;
        if (!drawn) svg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: quick ? 120 : 320, easing: ease });
        const ghost = CK.el(skelLine(lineId('ghost', { id: svg.closest('.tk-mover').dataset.coin })));
        ghost.classList.add('is-ghost');
        svg.closest('.tk-mover-chart').appendChild(ghost);
        const fade = quick ? { duration: 120 } : drawn ? { duration: 560, delay: 140 } : { duration: 320 };
        const a = ghost.animate([{ opacity: from }, { opacity: 0 }], Object.assign(fade, { easing: ease, fill: 'both' }));
        a.finished.then(() => ghost.remove(), () => ghost.remove());
      });
    }
    ctx.tickListeners.add((c) => {
      const shown = moverShown.get(c.id);
      if (!shown || !moverLines) return;
      const tone = moverTone(c);
      const fresh = c.series !== shown.series;
      if (tone === shown.tone && !fresh) return;
      const host = moversTrack.querySelector(`[data-coin="${CSS.escape(c.id)}"] .tk-mover-chart`);
      if (!host) return;
      if (tone !== shown.tone) {
        host.classList.replace('is-' + shown.tone, 'is-' + tone);
        shown.tone = tone;
      }
      if (!fresh) return;
      shown.series = c.series;
      const key = c.series.join();
      if (key === shown.key) return;
      shown.key = key;
      host.innerHTML = moverChart(c);
    });
    if (!moverLines && CK.market && CK.market.ready) {
      CK.market.ready.then(() => {
        if (CK.market.mode !== 'live') showMoverLines();
      });
    }
    function showMoverLines() {
      if (moverLines) return;
      moverLines = true;
      paintMovers();
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
        const key = !all.length ? 'markets.noFav' : q ? 'common.notFound' : 'trade.favNoneNet';
        const title = key === 'trade.favNoneNet' ? tx(key, { net: net.name }) : tx(key);
        if (favEmpty.dataset.key !== title) {
          favEmpty.dataset.key = title;
          favEmpty.innerHTML = CK.emptyState({ icon: key === 'common.notFound' ? 'search' : 'star', title });
        }
      }
      setRows(favList, rows.map(instRow).join(''));
    }
    DemoFavorites.onChange(paintFav);
    ctx.tickListeners.add((c) => {
      if (!c.isToken || typeof c.change !== 'number') return;
      const row = favList.querySelector(`[data-coin="${CSS.escape(c.id)}"]`);
      if (row && !row.querySelector('[data-change]')) paintFav();
    });
    askedListeners.add((ids) => {
      if (ids.some((id) => favList.querySelector(`[data-coin="${CSS.escape(id)}"] .tk-price-skel`))) paintFav();
    });

    function paintCoins() {
      const q = f.favMode() ? '' : query();
      const rows = q ? D.coins.filter((c) => matches(c, q)) : [];
      coinsEl.hidden = !rows.length;
      setRows(coinsList, rows.map((c) => CK.cards.market(c)).join(''));
    }
    let blocksOut = null;
    function setBlocksHidden(h) {
      if (CK.reducedMotion() || !blocksEl.animate) {
        blocksEl.hidden = h;
        return;
      }
      if (h) {
        if (blocksEl.hidden || blocksOut) return;
        blocksOut = blocksEl.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate3d(0,-6px,0)' }], { duration: 150, easing: 'ease-in' });
        blocksOut.onfinish = () => { blocksOut = null; blocksEl.hidden = true; };
        return;
      }
      if (blocksOut) { blocksOut.cancel(); blocksOut = null; }
      if (!blocksEl.hidden) return;
      blocksEl.hidden = false;
      blocksEl.animate([{ opacity: 0, transform: 'translate3d(0,-6px,0)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    function searchChanged() {
      setBlocksHidden(searching());
      paintCoins();
      if (f.favMode()) paintFav();
    }

    body.addEventListener('click', (e) => {
      const row = e.target.closest('.tk-blocks [data-coin], .tk-coins [data-coin], .tk-favs [data-coin]');
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
        moverLines = true;
        paintMovers();
        paintFav();
        paintCoins();
      },
      repaint() {
        moversTrack._html = null;
        favList._html = null;
        coinsList._html = null;
        favEmpty.dataset.key = '';
        paintMovers();
        paintFav();
        paintCoins();
      }
    };
  }

  function buildFeed() {
    const screen = CK.screen({ title: tr('tab.trade'), compactTop: true, headExtra: ctx.STATUS_ACCOUNT, avatar: ctx.openProfile });
    screen.el.classList.add('tk-feed');
    screen.body.innerHTML = `
      <div class="tk-head">
        <div class="screen-pad tk-find">
          <label class="search">${icon('search', { size: 19 })}<input class="tk-search" type="search" ${LP('token.searchPh')} ${LA('token.searchAria')} autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" maxlength="70"><button class="tk-clear" type="button" ${LA('token.clear')} hidden>${icon('close-circle', { fill: true, size: 18 })}</button></label>
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
      <div class="group list--free tk-list" role="list" ${LA('token.list')}></div>
      <div class="tk-state" hidden></div>`;
    const body = screen.body, scroll = screen.scroll;
    const head = $('.tk-head', body), list = $('.tk-list', body), stateEl = $('.tk-state', body);
    const totalEl = $('.tk-total', body), input = $('.tk-search', body), clearBtn = $('.tk-clear', body);
    const upBtn = CK.el(`<button class="tk-up press" type="button" ${LA('common.toTop')}>${icon('chevron-up', { size: 22 })}</button>`);
    screen.el.insertBefore(upBtn, $('.screen-dim', screen.el));

    const filters = { network: 'ton', sort: 'popular', q: '' };
    let view = filters.sort;
    const favMode = () => view === FAV;
    let favAll = false;
    const favNetwork = () => (favAll ? ALL_NETS : filters.network);
    let feedStale = false;
    let blocks = null;
    let gen = 0, pages = [], known = 0, nextCursor = null, more = true, tailBusy = false, tailFailed = false, firstLoading = true;
    let total = null, stale = false, rowsShown = 0, listTop = 0, lastY = 0, fast = false;
    let framePending = false, settleTimer = 0, searchTimer = 0, warmingTries = 0;
    let viewH = 0, replacing = false, skeletonTimer = 0, tailAbort = null, listChanged = false;
    const slots = [];
    const failedLogos = new Map();
    const firstPages = new Map();
    const logoShown = (u) => CK.logos.ready(u);
    const holdLogo = (u) => CK.logos.hold(u);
    const rowLogo = (t) => {
      const coin = D.canonicalCoin(t);
      return (coin && CK.COIN_LOGOS[coin.id]) || t.logo;
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
        const m = (a + b) >> 1, p = pages[m];
        if (i < p.start) b = m - 1;
        else if (i >= p.start + p.count) a = m + 1;
        else { lastPage = p; return p; }
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
        change: hasChange ? signedPct(t.change24h) : '',
        flat: hasChange && CK.changeFlat(t.change24h),
        up: !hasChange || t.change24h >= 0 || CK.changeFlat(t.change24h),
        tag: rowTag(t) ? tx(rowTag(t).key) : '',
        tagTone: rowTag(t) ? rowTag(t).tone : '',
        risky: t.risk === 'suspicious'
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
        el, i: -1, t: null, view: null, url: null,
        tile: $('.tk-tile', el), img: $('.tk-img', el), name: $('.tk-name', el), sym: $('.tk-sym', el), tag: $('.tk-tag', el),
        price: $('.tk-price', el), change: $('.tk-change', el), changeNum: $('.tk-change-num', el), netBadge: $('.tk-netbadge', el)
      };
      slot.img.addEventListener('load', () => {
        slot.img.classList.add('is-on');
        holdLogo(slot.url);
      });
      slot.img.addEventListener('error', () => {
        slot.img.classList.remove('is-on');
        if (failedLogos.size >= FAILED_LOGOS_KEPT) failedLogos.clear();
        if (slot.url) failedLogos.set(slot.url, Date.now());
        const alt = usableLogo(slot.alt);
        slot.alt = null;
        slot.url = alt;
        if (alt) slot.img.src = alt;
        else slot.img.removeAttribute('src');
      });
      list.appendChild(el);
      slots.push(slot);
      return slot;
    }
    function usableLogo(u) {
      if (!u) return null;
      const at = failedLogos.get(u);
      if (at === undefined) return u;
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
      slot.img.classList.toggle('is-on', ready);
      slot.img.classList.toggle('is-instant', ready);
      slot.img.decoding = ready ? 'sync' : 'async';
      slot.img.removeAttribute('src');
      slot.img.fetchPriority = slot.i * ROW_H < viewH ? 'high' : 'auto';
      if (next && (ready || !fast)) slot.img.src = ready ? CK.logos.src(next) : next;
    }
    function fillSlot(slot, i) {
      const stayed = slot.i === i;
      if (!stayed) {
        slot.i = i;
        if (SLOT_TRANSLATE) slot.el.style.translate = `0 ${i * ROW_H}px`;
        else slot.el.style.transform = `translate3d(0,${i * ROW_H}px,0)`;
        slot.el.classList.toggle('is-first', i === 0);
      }
      const t = tokenAt(i);
      if (!t) {
        if (slot.t || !slot.el.classList.contains('is-skel')) {
          slot.t = null;
          slot.view = null;
          slot.el.classList.add('is-skel');
          slot.el.disabled = true;
          slot.el.style.setProperty('--i', String(i % 12));
          setSlotLogo(slot, null, null);
          CK.priceTick(slot.price, '');
        }
        return;
      }
      const view = viewOf(t);
      if (slot.t === t && slot.view === view) return;
      const last = slot.view;
      const moved = stayed && slot.t === t && !!last && last.lang === view.lang && last.priced && view.priced && last.price !== view.price;
      if (slot.t === t && last && last.price !== view.price) slot.el.setAttribute('aria-label', `${t.name}, ${view.price}`);
      if (slot.t !== t) {
        slot.el.classList.remove('is-skel');
        slot.el.disabled = false;
        slot.tile.textContent = CK.initials(t.symbol);
        slot.name.textContent = t.name;
        slot.sym.textContent = t.symbol;
        slot.tag.hidden = !view.tag;
        slot.tag.textContent = view.tag;
        slot.tag.classList.toggle('tag--down', view.tagTone === 'down');
        slot.tag.classList.toggle('tag--warn', view.tagTone === 'warn');
        const across = searchAcross();
        const home = across && (() => { const coin = D.canonicalCoin(t); return !!coin && HOME_NET[coin.id] === t.network; })();
        slot.netBadge.hidden = !across || home;
        const badgeLogo = across && !home ? netLogos.get(t.network) || null : null;
        const badgeImg = slot.netBadge.firstElementChild;
        if (badgeLogo) badgeImg.src = badgeLogo;
        else badgeImg.removeAttribute('src');
        slot.el.setAttribute('aria-label', across ? `${t.name}, ${netNames.get(t.network) || t.network}, ${view.price}` : `${t.name}, ${view.price}`);
        setSlotLogo(slot, rowLogo(t), t.logoAlt);
      }
      CK.priceTick(slot.price, view.price, moved ? !(t.price < t.lastPrice) : null);
      slot.price.classList.toggle('is-none', !view.priced);
      slot.change.hidden = !view.change;
      slot.change.classList.toggle('is-down', !view.up);
      slot.change.classList.toggle('is-flat', view.flat);
      slot.changeNum.textContent = view.change;
      slot.t = t;
      slot.view = view;
    }
    function paint() {
      const h = scroll.clientHeight;
      if (!h) return;
      if (favMode()) {
        upBtn.classList.toggle('is-on', scroll.scrollTop > UP_BUTTON_AFTER_PX);
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
        const i = first + ((k - first % n + n) % n);
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
      upBtn.classList.toggle('is-on', scrolled > UP_BUTTON_AFTER_PX);
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
      const left = more ? (total === null ? TAIL_SKELETONS : Math.min(TAIL_SKELETONS, Math.max(0, total - known))) : 0;
      rowsShown = firstLoading ? FIRST_SKELETONS : known + (tailFailed ? 0 : left);
      list.style.height = rowsShown * ROW_H + 'px';
      list.hidden = rowsShown === 0;
    }
    const coinsOnly = () => !!filters.q && total === 0 && !!blocks && blocks.coinsShown();
    function paintCount() {
      totalEl.textContent = favMode() || total === null || coinsOnly() || !stale ? '' : tx('feed.stale');
    }
    let stateKind = null;
    function showState(kind) {
      stateKind = kind;
      stateEl.hidden = !kind;
      if (!kind) { stateEl.replaceChildren(); return; }
      if (kind === 'empty' && filters.q && blocks && blocks.coinsShown()) {
        stateEl.innerHTML = `<p class="tk-none-net">${tx('trade.noMatchHere')}</p>`;
      } else if (kind === 'empty') {
        stateEl.innerHTML = CK.emptyState({ icon: 'search', title: tx(filters.q ? 'common.notFound' : 'feed.empty') });
      } else {
        stateEl.innerHTML = CK.emptyState({ icon: 'warning', title: tx('common.loadFail'), actions: `<button class="btn btn--tinted btn--small press tk-retry" type="button">${tx('common.retry')}</button>` });
      }
    }
    CK.i18n.bind(screen.el, () => {
      slots.forEach((slot) => {
        slot.t = null;
        slot.view = null;
        slot.tag.textContent = '';
        slot.price.textContent = '';
        slot.el.removeAttribute('aria-label');
      });
      paintCount();
      if (stateKind) showState(stateKind);
      paintSort();
      paintChip();
      requestPaint();
      if (blocks) blocks.repaint();
    });
    const searchAcross = () => !!filters.q;
    const baseParams = () => ({ network: searchAcross() ? 'all' : filters.network, sort: filters.q ? 'popular' : filters.sort, q: filters.q, limit: PAGE_SIZE });
    const netLogos = new Map(), netNames = new Map();
    function fetchPage(params, signal) {
      return DemoNets.withListed(params, signal).then((res) => {
        if (!params.q || params.network !== 'all') return res;
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
        if (err && err.message === 'loading' && warmingTries < WARMING_TRIES) {
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
        list.classList.remove('is-reloading');
        setRowsShown();
        paintCount();
        showState('error');
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
      list.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
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
      list.classList.remove('is-reloading');
      setRowsShown();
      paintCount();
      showState(known ? null : 'empty');
      dropFarPages();
    }
    const firstPageKey = () => (filters.q ? null : `${filters.network}|${filters.sort}`);
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
      pages.forEach((p, n) => { if (Math.abs(n - at) > KEEP_PAGES) p.tokens = null; });
    }
    function refillAround(firstRow, lastRow) {
      for (let i = firstRow; i <= lastRow;) {
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
      list.classList.add('is-reloading');
      if (known) {
        replacing = true;
        skeletonTimer = setTimeout(showSkeletons, SKELETONS_AFTER_MS);
      } else {
        showSkeletons();
      }
      fetchTail();
    }
    const warmed = new Set();
    const roomyLink = () => {
      const link = navigator.connection;
      return !link || (!link.saveData && (!link.effectiveType || link.effectiveType === '4g'));
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
      const beside = networks
        .map((n, i) => ({ n, d: Math.abs(i - open) }))
        .filter(({ n }) => n.id !== filters.network)
        .sort((a, b) => a.d - b.d)
        .slice(0, WARM_NETWORKS)
        .map(({ n }) => n);
      const next = beside.find((n) => !warmed.has(n.id));
      if (!next) return;
      warmed.add(next.id);
      const sort = filters.sort;
      const key = `${next.id}|${sort}`;
      const later = () => warmNetworks(networks);
      const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300));
      if (firstPages.has(key) || next.id === filters.network) { later(); return; }
      whenIdle(() => {
        if (document.hidden) { warmed.delete(next.id); return; }
        CK.market.tokens({ network: next.id, sort, q: '', limit: PAGE_SIZE }).then((res) => {
          rememberFirstPage(res, key);
          if (roomyLink()) res.tokens.slice(0, LOGOS_WARMED).forEach((t) => holdLogo(usableLogo(rowLogo(t))));
          whenIdle(later);
        }, () => { });
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
      const asked = new Map();
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
        const changed = new Set();
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
        if (changed.size) slots.forEach((slot) => { if (changed.has(slot.t) && !slot.el.hidden) fillSlot(slot, slot.i); });
      }).catch(() => { visibleAsk.at = 0; }).finally(() => { tickBusy = false; });
    }
    const visibleAsk = { key: '', at: 0 };
    const pushedRows = new Map();
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
    CK.market.onStream((sid) => { if (sid) { tickedAt = 0; tickVisible(); } });

    function refreshVisible() {
      if (favMode() || document.hidden || firstLoading || !ctx.feedInView() || !scroll.clientHeight) return;
      const y = scroll.scrollTop - listTop;
      const firstRow = Math.max(0, Math.floor(y / ROW_H));
      const lastRow = Math.max(0, Math.floor((y + scroll.clientHeight) / ROW_H));
      const seen = new Set();
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
            if (!n || (n.price === t.price && n.change24h === t.change24h)) return;
            t.lastPrice = t.price;
            t.price = n.price;
            t.change24h = n.change24h;
            t.volume24h = n.volume24h;
            t.liquidity = n.liquidity;
            t.view = null;
          });
          if (res.total !== null && more) { total = res.total; paintCount(); }
          stale = res.stale;
          requestPaint();
        }).catch(() => { });
      }
    }

    function settled() {
      fast = false;
      requestPaint();
      slots.forEach((slot) => {
        if (slot.url && slot.img.getAttribute('src') !== slot.url) slot.img.src = slot.url;
      });
      dropFarPages();
      prefetchVisibleSoon();
      tickVisible();
    }
    const prefetched = new Map();
    function prefetchRow(t) {
      if (!t || !(t.price > 0)) return;
      if (Date.now() - (prefetched.get(t.id) || 0) < PREFETCH_AGAIN_MS) return;
      if (prefetched.size >= PREFETCHED_KEPT) prefetched.clear();
      prefetched.set(t.id, Date.now());
      CK.market.prefetchToken(t.id, '1d');
    }
    function prefetchVisible() {
      if (favMode() || document.hidden || !ctx.feedInView() || !scroll.clientHeight) return;
      const first = Math.max(0, Math.floor((scroll.scrollTop - listTop) / ROW_H));
      for (let i = first; i < first + PREFETCH_ROWS; i++) prefetchRow(tokenAt(i));
    }
    function prefetchVisibleSoon() {
      if (window.requestIdleCallback) requestIdleCallback(prefetchVisible, { timeout: 1000 });
      else setTimeout(prefetchVisible, 200);
    }
    list.addEventListener('pointerdown', (e) => {
      const row = e.target.closest('.tk-row');
      const slot = row && slots.find((s) => s.el === row);
      if (slot) prefetchRow(tokenAt(slot.i));
    }, { passive: true });
    scroll.addEventListener('scroll', () => {
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
      if (sortBar) sortBar.style.top = '';
      keepRoom();
      lastY = remeasure(lastY);
      if (lastY && Math.abs(scroll.scrollTop - lastY) > 1) scroll.scrollTop = lastY;
      paint();
    }).observe(scroll);
    const sortBar = $('.tk-sort-pad', body);
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

    const sortEl = $('.tk-sort', body), chip = $('.tk-netchip', body);
    let networksKnown = [{ id: 'ton', name: 'TON', logo: null }];
    const netMarkOf = (n) => (window.DemoNets && typeof DemoNets.netMark === 'function' ? DemoNets.netMark(n.id) : null) || n.logo;
    const chosenNetwork = () => networksKnown.find((n) => n.id === filters.network) || { id: filters.network, name: netNames.get(filters.network) || String(filters.network).toUpperCase(), logo: null };
    function paintChip() {
      const all = favMode() && favAll;
      const n = chosenNetwork();
      const mark = all ? allNetsMark() : logoSlot(netMarkOf(n), n.name);
      chip.replaceChildren(mark, CK.el(`<span class="tk-netchip-label">${CK.esc(tx('common.network'))}</span>`), CK.el(icon('chevron-down', { size: 16 })));
      chip.setAttribute('aria-label', `${tx('common.network')}: ${all ? tx('trade.allNets') : n.name}`);
      chip.setAttribute('aria-haspopup', 'dialog');
    }
    function allNetsMark() {
      return CK.el(`<span class="tk-logo tk-logo--all" aria-hidden="true">${icon('layers', { size: 16 })}</span>`);
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
    chip.addEventListener('click', () => {
      if (CK.sheet.top) return;
      CK.haptic.light();
      CK.sheet.open({
        title: tx('common.network'),
        detents: [CK.sheet.fixedDetent(NET_SHEET_H + safeBottom())],
        build(b, sheet) {
          const rows = CK.el('<div class="sheet-list tk-net-list" role="radiogroup"></div>');
          let chosen = null;
          const shown = favNetwork();
          const choices = favMode() ? [{ id: ALL_NETS, name: tx('trade.allNets') }].concat(networksKnown) : networksKnown;
          choices.forEach((n) => {
            const on = n.id === (favMode() ? shown : filters.network);
            const row = CK.el(`<button class="cell press-row tk-net-row${on ? ' is-selected' : ''}" type="button" role="radio" aria-checked="${on}"></button>`);
            row.dataset.network = n.id;
            const main = CK.el('<span class="cell-main"><span class="cell-title"></span></span>');
            main.firstElementChild.textContent = n.name;
            row.append(n.id === ALL_NETS ? allNetsMark() : logoSlot(netMarkOf(n), n.name), main, CK.el(icon('check', { size: 20, className: 'cell-check' })));
            rows.appendChild(row);
            if (on) chosen = row;
          });
          rows.addEventListener('click', (e) => {
            const row = e.target.closest('.tk-net-row');
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
    sortEl.setAttribute('aria-label', tx('sort.aria'));
    sortEl.innerHTML = `<span class="tk-sort-pill" aria-hidden="true"></span>${SORTS.map((o) => `<button class="tk-sort-btn" type="button" role="radio" data-value="${o.value}"><span class="tk-sort-label"></span></button>`).join('')}`;
    const sortPill = sortEl.firstElementChild;
    const sortBtns = Array.from(sortEl.querySelectorAll('.tk-sort-btn'));
    function paintSort() {
      sortEl.setAttribute('aria-label', tx('sort.aria'));
      sortBtns.forEach((b, i) => {
        const o = SORTS[i], on = o.value === view;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
        b.setAttribute('aria-label', tx(o.aria || o.key));
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
      if (CK.motion && typeof CK.motion.indicator === 'function') {
        CK.motion.indicator(sortPill, from, to);
        return;
      }
      sortPill.style.transform = `translate3d(${to.x}px, 0, 0)`;
      sortPill.style.width = `${to.width}px`;
    }
    if (typeof ResizeObserver === 'function') {
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
    sortEl.addEventListener('click', (e) => {
      const b = e.target.closest('.tk-sort-btn');
      if (b) chooseSort(sortBtns.indexOf(b));
    });
    sortEl.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
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
      screen.el.classList.toggle('is-fav', favMode());
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
    function markSort() { sortBar.hidden = !!input.value.trim(); }
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
    input.addEventListener('input', () => {
      clearBtn.hidden = !input.value;
      blocks.searchChanged();
      searchShown();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applySearch, SEARCH_MS);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      clearTimeout(searchTimer);
      applySearch();
      input.blur();
    });
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = '';
      clearBtn.hidden = true;
      blocks.searchChanged();
      searchShown();
      clearTimeout(searchTimer);
      applySearch();
      input.focus();
    });
    stateEl.addEventListener('click', (e) => {
      if (!e.target.closest('.tk-retry')) return;
      if (known) {
        tailFailed = false;
        showState(null);
        setRowsShown();
        fetchTail();
      } else {
        reload();
      }
    });
    list.addEventListener('click', (e) => {
      const row = e.target.closest('.tk-row');
      if (!row) return;
      const slot = slots.find((s) => s.el === row);
      const t = slot && tokenAt(slot.i);
      if (t) openToken(t, row);
    });
    upBtn.addEventListener('click', () => {
      CK.haptic.light();
      if (CK.reducedMotion() || !scroll.scrollTo) scroll.scrollTop = 0;
      else scroll.scrollTo({ top: 0, behavior: 'smooth' });
      lastY = 0;
    });

    function controlsY() {
      const style = getComputedStyle(sortBar);
      let el = head, top = head.offsetHeight + (parseFloat(style.marginTop) || 0);
      while (el && el !== scroll) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      const bar = $('.navbar', screen.el);
      const cssTop = parseFloat(style.top);
      const stuckAt = stuckTop !== null ? stuckTop : Number.isFinite(cssTop) ? cssTop : bar ? bar.offsetHeight : 0;
      return Math.max(0, top - stuckAt);
    }
    function readStuckTop() {
      if (stuckTop !== null || sortBar.hidden || !(controlsAt > 0) || scroll.scrollTop < controlsAt + 24) return;
      if (getComputedStyle(sortBar).position !== 'sticky') return;
      const scrollTop = scroll.getBoundingClientRect().top;
      let at = Math.round(sortBar.getBoundingClientRect().top - scrollTop);
      const bar = $('.navbar', screen.el);
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
        body.style.minHeight = '';
        return;
      }
      const padBottom = parseFloat(getComputedStyle(scroll).paddingBottom) || 0;
      const need = Math.ceil(scroll.clientHeight + controlsY() - body.offsetTop - padBottom);
      body.style.minHeight = getComputedStyle(sortBar).position === 'sticky' && need > 0 ? `${need}px` : '';
    }
    let stuck = false;
    function markStuck() {
      readStuckTop();
      const now = !sortBar.hidden && controlsAt > 0 && scroll.scrollTop >= controlsAt - .5;
      if (now === stuck) return;
      stuck = now;
      sortBar.classList.toggle('is-stuck', now);
    }
    function toControls() {
      const y = controlsY();
      if (scroll.scrollTop > y) {
        scroll.scrollTop = y;
        lastY = y;
      }
    }
    blocks = buildBlocks({
      body, scroll, input, viewOf, rowLogo, usableLogo, openToken,
      inView: () => {
        try {
          return !!ctx.feedInView();
        } catch (err) {
          return false;
        }
      },
      favMode,
      favNet: () => (favNetwork() === ALL_NETS ? null : chosenNetwork())
    });

    setRowsShown();
    ctx.makeStack('trade', screen);
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
    document.addEventListener('visibilitychange', tickVisible);

    return {
      reloadMarket: () => blocks.reloadMarket(),
      onShow: () => blocks.viewChanged(),
      stats: () => ({ rowsInDom: list.childElementCount, pages: pages.length, pagesHeld: pages.filter((p) => p.tokens).length, tokensHeld: pages.reduce((s, p) => s + (p.tokens ? p.tokens.length : 0), 0), known, total, rowsShown, filters: { ...filters } })
    };
  }

  const COIN_HOME = { btc: 'bitcoin', eth: 'eth', ton: 'ton', sol: 'solana', bnb: 'bsc', xrp: 'xrp', doge: 'dogecoin', not: 'ton', usdt: 'ton' };
  const NET_WORDS = { bitcoin: 'Bitcoin', eth: 'Ethereum', ton: 'TON', solana: 'Solana', bsc: 'BNB Chain', xrp: 'XRP Ledger', dogecoin: 'Dogecoin', tron: 'Tron' };
  function networkLabel(inst) {
    const id = inst.isToken ? inst.token && inst.token.network : COIN_HOME[inst.id];
    if (!id) return '';
    const named = CK.market && typeof CK.market.networkName === 'function' ? CK.market.networkName(id) : null;
    return named || NET_WORDS[id] || String(id).toUpperCase();
  }
  const positive = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  const compactUsd = (v) => (typeof fmt.compactUsd === 'function' ? fmt.compactUsd(v) : fmt.usd(v));
  function sharePcts(buyPct) {
    const whole = buyPct >= 1 && buyPct <= 99;
    const buy = whole ? Math.round(buyPct) : Math.round(buyPct * 10) / 10;
    const sell = whole ? 100 - buy : Math.round((100 - buy) * 10) / 10;
    const text = (v) => `${fmt.num(v, whole ? 0 : 1)}${CK.i18n.lang === 'en' ? '' : ' '}%`;
    return { buy: text(buy), sell: text(sell) };
  }
  const compactNum = (v) => (typeof fmt.compact === 'function' ? fmt.compact(v) : fmt.num(v, 0));
  function overviewOf(inst) {
    const t = inst.isToken ? inst.token || {} : null;
    const cap = t ? positive(t.marketCap) : inst.capReal ? positive(inst.cap) : null;
    const supply = positive(t ? t.totalSupply : inst.totalSupply);
    const circulating = positive(t ? t.circulatingSupply : inst.circulatingSupply);
    const liquidity = t ? positive(t.liquidity) : null;
    return [
      ['coin.cap', cap && compactUsd(cap)],
      ['tk.supply', supply && compactNum(supply)],
      ['tk.circulating', circulating && compactNum(circulating)],
      ['stat.liquidity', liquidity && compactUsd(liquidity)]
    ].filter((row) => row[1]);
  }
  const volumeOf = (inst) => (inst.isToken ? positive(inst.token && inst.token.volume24h) : inst.volumeReal ? positive(inst.volume) : null);
  const ABOUT_MAX = 1200;
  function aboutOf(inst) {
    const raw = inst.isToken ? inst.token && inst.token.description : inst.description;
    if (typeof raw !== 'string') return '';
    return raw.replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').trim().slice(0, ABOUT_MAX);
  }
  const LINKS_MAX = 8;
  const LINK_ICONS = { telegram: 'telegram-plane', x: 'x-social', twitter: 'x-social', github: 'code', code: 'code', docs: 'doc', whitepaper: 'doc' };
  function linksOf(inst) {
    const raw = inst.isToken ? inst.token && inst.token.links : inst.links;
    if (!Array.isArray(raw)) return [];
    const out = [], seen = new Set();
    raw.forEach((l) => {
      if (out.length >= LINKS_MAX || !l || typeof l.url !== 'string') return;
      let url;
      try { url = new URL(l.url); } catch (_) { return; }
      if (url.protocol !== 'https:' || seen.has(url.href)) return;
      seen.add(url.href);
      const kind = typeof l.kind === 'string' ? l.kind.toLowerCase() : '';
      out.push({ url: url.href, icon: LINK_ICONS[kind] || 'globe', label: url.hostname.replace(/^www\./, '') });
    });
    return out;
  }

  const FLOW_POLL_MS = 20000;
  const FLOW_TIMEOUT_MS = 8000;
  function cleanFlow(body) {
    if (body && body.ok === true && body.none === true) return { none: true };
    if (body && body.ok === false && body.error === 'busy') return { busy: true };
    if (!body || body.ok !== true) throw new Error('bad_response');
    const pct = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
    const usd = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
    if (!pct(body.buyPct) || !pct(body.sellPct) || !usd(body.buyUsd) || !usd(body.sellUsd) || !(body.buyUsd + body.sellUsd > 0)) throw new Error('bad_response');
    const trades = Number.isInteger(body.trades) && body.trades > 0 ? body.trades : null;
    if (body.window !== '24h' && !(body.window === 'trades' && trades)) return { none: true };
    const source = body.source === 'binance' || body.source === 'binance-vision' ? 'binance' : body.source === 'geckoterminal' ? 'pool' : null;
    return { buyPct: body.buyPct, sellPct: body.sellPct, buyUsd: body.buyUsd, sellUsd: body.sellUsd, window: body.window, trades, source };
  }
  function fetchFlow(inst) {
    const query = inst.isToken ? `id=${encodeURIComponent(inst.id)}` : `coin=${encodeURIComponent(inst.id)}`;
    const abort = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => { if (abort) abort.abort(); }, FLOW_TIMEOUT_MS);
    return fetch(`api/tokens/flow?${query}`, { cache: 'no-store', signal: abort ? abort.signal : undefined })
      .then((res) => res.json())
      .then(cleanFlow)
      .finally(() => clearTimeout(timer));
  }

  const OPS_FRESH_MS = 30000;
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
    }).finally(() => { if (opsJob && opsJob.p === p) opsJob = null; });
    opsJob = { address, p };
    return p;
  }
  const isTonAsset = (inst) => (inst.isToken ? !!inst.token && inst.token.network === 'ton' : COIN_HOME[inst.id] === 'ton');

  function growPlan(row, stack) {
    const M = CK.motion;
    if (!M || typeof M.cardFromRow !== 'function' || typeof M.flyLogo !== 'function' || M.reduce || !M.armed || document.hidden) return null;
    const under = stack && stack.top;
    if (!row || !row.isConnected || typeof row.getBoundingClientRect !== 'function' || !under || !under.el || !under.el.contains(row)) return null;
    const host = under.el.parentElement;
    if (!host) return null;
    const r = row.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom <= 0 || r.top >= window.innerHeight) return null;
    const card = host.getBoundingClientRect();
    if (!card.width || !card.height) return null;
    const logoEl = row.querySelector('[data-motion-logo], .tk-logo, .coin');
    const logo = logoEl ? logoEl.getBoundingClientRect() : null;
    return { row: r, card, logo: logo && logo.width ? logo : null };
  }

  const GROW_RELEASE_MS = 200, GROW_HOLD_MAX_MS = 1500;
  function growFromRow(screen, row, under, plan, parts) {
    const M = CK.motion;
    screen.el.classList.add('tk-grow', 'tk-logo-wait');
    under.el.classList.add('tk-grow-under');
    let timer = 0;
    const release = () => {
      clearTimeout(timer);
      if (screen.el.isConnected && screen.el.classList.contains('is-moving')) {
        timer = setTimeout(release, GROW_RELEASE_MS);
        return;
      }
      screen.el.classList.remove('tk-grow', 'tk-logo-wait');
      under.el.classList.remove('tk-grow-under');
    };
    timer = setTimeout(release, GROW_HOLD_MAX_MS);
    if (parts.length) M.blocks(parts, { force: true, fresh: true, blur: false, base: 'none', delay: OPEN_RISE_MS });
    const grown = M.cardFromRow(row, screen.el, { rects: plan, logo: false });
    const releaseSoon = () => setTimeout(release, GROW_RELEASE_MS);
    grown.then(releaseSoon, releaseSoon);
    return grown;
  }

  let cardSeq = 0;
  function openMenu(title, items, from) {
    if (CK.sheet.top) return;
    CK.haptic.light();
    let chosen = null;
    const words = (a) => (typeof a.label === 'function' ? a.label() : a.label);
    CK.sheet.open({
      title,
      build(b, sheet) {
        const rows = CK.el('<div class="sheet-list tk-menu"></div>');
        items.forEach((a, i) => {
          const row = CK.el(`<button class="cell press-row tk-menu-row" type="button"><span class="tk-menu-icon">${icon(a.icon, { size: 22, fill: typeof a.lit === 'function' ? a.lit() : false })}</span><span class="cell-main"><span class="cell-title"></span></span></button>`);
          row.dataset.i = String(i);
          row.querySelector('.cell-title').textContent = words(a);
          rows.appendChild(row);
        });
        rows.addEventListener('click', (e) => {
          const row = e.target.closest('.tk-menu-row');
          if (!row) return;
          chosen = items[Number(row.dataset.i)];
          sheet.close();
        });
        b.appendChild(rows);
      },
      onClose() { if (chosen && chosen.onClick) chosen.onClick(from); }
    });
  }

  function openDetail(o) {
    const inst = o.inst;
    if (closedTron(inst && inst.id)) return null;
    const plan = growPlan(o.from, o.stack);
    const tapAt = plan ? performance.now() : 0;
    const fav = ctx.favAction ? ctx.favAction(inst) : null;
    const bell = ctx.alertAction ? ctx.alertAction(inst) : null;
    const share = ctx.shareAction ? ctx.shareAction(inst) : null;
    const copyItem = o.address ? { icon: 'copy', label: tr('common.copyAddress'), onClick: () => copyAddress() } : null;
    const rare = (o.actions || []).concat(copyItem).filter(Boolean);
    const menu = rare.length ? { icon: 'more', label: tr('common.menu'), onClick(btn) { openMenu(o.title, rare, btn); } } : null;
    const actions = [menu, fav].filter(Boolean);
    const screen = CK.screen({ title: '', large: false, titleHtml: '<span class="detail-title"></span>', actions });
    const win = CK.el('<div class="tk-win"><div class="tk-win-in"><div class="tk-win-body"></div></div></div>');
    const winBody = win.querySelector('.tk-win-body');
    winBody.appendChild(screen.el.querySelector('.navbar'));
    winBody.appendChild(screen.scroll);
    screen.el.insertBefore(win, screen.el.querySelector('.screen-dim'));
    const foldId = `tk-about-${++cardSeq}`;
    screen.el.setAttribute('aria-label', o.title);
    const titleEl = $('.detail-title', screen.el);
    titleEl.innerHTML = `<span class="detail-logo" data-motion-logo>${CK.coinLogo(inst, 28)}</span><span class="detail-names"><span class="detail-name" data-dock-anchor></span><span class="detail-net" data-dock-line></span></span>`;
    $('.detail-name', titleEl).textContent = o.title;
    const netEl = $('.detail-net', titleEl);
    const paintNet = () => {
      const name = networkLabel(inst);
      if (netEl.textContent !== name) netEl.textContent = name;
      netEl.hidden = !name;
    };
    paintNet();
    screen.el.classList.add('has-bar', 'tk-card');
    screen.body.innerHTML = `
      <div class="screen-pad detail-head">
        <div class="detail-price-slot"><div class="detail-price"><span class="detail-roll roll"></span></div></div>
        <div class="detail-meta"><span class="detail-change"></span><span class="detail-delta" hidden></span><span class="detail-frame"></span>${ctx.STATUS_MARKET}</div>
      </div>
      <button class="tk-warn" type="button" hidden>${icon('warning', { size: 16 })}<span></span></button>
      <div class="detail-chart"></div>
      <div class="screen-pad detail-frames-row"><div class="detail-frames"></div></div>
      <section class="section tk-sec tk-held" hidden>
        <h2 class="section-title" ${L('tk.yourBalance')}>${tx('tk.yourBalance')}</h2>
        <div class="group tk-held-group">
          <div class="cell asset-row tk-held-row" hidden>${CK.coinLogo(inst, 40)}<span class="market-name"><b class="tk-held-amt"></b><span class="tk-held-usd"></span></span><span class="asset-right"><span class="tk-held-gain" hidden></span></span></div>
          <button class="cell press-row tk-levels-row" type="button" hidden><span class="cell-main"><span class="cell-title tk-levels-text"></span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>
        </div>
      </section>
      <div class="screen-pad tk-acts" hidden>
        <button class="cell press-row tk-orders" type="button" hidden><span class="cell-main"><span class="cell-title" ${L('detail.orders')}>${tx('detail.orders')}</span><span class="tk-orders-sub" ${L('tk.buyFirst')} hidden>${tx('tk.buyFirst')}</span></span>${icon('shield', { size: 22 })}</button>
        <button class="tk-act press-row" type="button" data-act="share" hidden>${icon('share', { size: 22 })}<span ${L('share.aria')}>${tx('share.aria')}</span></button>
        <button class="tk-act press-row" type="button" data-act="alert" aria-pressed="false" hidden>${icon('bell', { size: 22 })}<span ${L('alerts.tile')}>${tx('alerts.tile')}</span></button>
      </div>
      <section class="section tk-sec tk-ops" hidden>
        <div class="section-head"><h2 class="section-title" ${L('common.history')}>${tx('common.history')}</h2><button class="section-link tk-ops-all" type="button" ${L('tk.seeAll')}>${tx('tk.seeAll')}</button></div>
        <div class="group tk-ops-list" role="list"></div>
      </section>
      <section class="section tk-sec tk-about" hidden>
        <h2 class="section-title" ${L('tk.about')}>${tx('tk.about')}</h2>
        <div class="group tk-about-box"><p class="tk-about-text is-folded" id="${foldId}"></p><button class="tk-about-more" type="button" aria-expanded="false" aria-controls="${foldId}" hidden></button></div>
      </section>
      <section class="section tk-sec tk-overview" hidden>
        <h2 class="section-title" ${L('tk.overview')}>${tx('tk.overview')}</h2>
        <div class="group tk-facts"></div>
      </section>
      <section class="section tk-sec tk-activity" hidden>
        <h2 class="section-title" ${L('tk.activity')}>${tx('tk.activity')}</h2>
        <div class="group tk-activity-box">
          <div class="tk-fact tk-volume" hidden><span ${L('coin.volume')}>${tx('coin.volume')}</span><span class="tk-volume-value"></span></div>
          <div class="tk-flow" hidden>
            <div class="tk-flow-bar" aria-hidden="true"><i class="tk-flow-buy"></i><i class="tk-flow-sell"></i></div>
            <div class="tk-flow-legend"><span class="tk-flow-buys"></span><span class="tk-flow-sells"></span></div>
            <p class="tk-flow-note" hidden></p>
          </div>
        </div>
      </section>
      <section class="section tk-sec tk-links" hidden>
        <h2 class="section-title" ${L('tk.links')}>${tx('tk.links')}</h2>
        <div class="screen-pad tk-chips"></div>
      </section>`;
    const body = screen.body;
    const priceEl = $('.detail-roll', body), priceBox = $('.detail-price', body), frameLabel = $('.detail-frame', body), deltaEl = $('.detail-delta', body);
    const changeEl = $('.detail-change', body), chartHost = $('.detail-chart', body);
    const dockChange = CK.el('<span class="detail-dock-change" aria-hidden="true"><span class="change change--plain"></span></span>');
    const dockPct = dockChange.firstElementChild;
    screen.dock(priceBox, priceBox.parentNode, $('.detail-meta', body), { line: netEl, tail: dockChange });
    let opening = !!plan, risen = 0;
    const riseDelay = () => Math.max(0, OPEN_RISE_MS + risen++ * OPEN_STAGGER_MS - (performance.now() - tapAt));
    const showSection = (el, on) => {
      if (el.hidden === !on) return;
      el.hidden = !on;
      if (!on || !CK.motion) return;
      if (!opening) CK.motion.blocks(el, { blur: false });
      else if (screen.el.isConnected) CK.motion.blocks(el, { force: true, fresh: true, blur: false, base: 'none', delay: riseDelay() });
    };
    const afterOpen = [];
    const later = (step, fn) => {
      if (plan) afterOpen.push([step, fn]);
      else fn();
    };
    const CHART_SHARE = .3, CHART_FIT = [190, 260];
    const scroll = screen.scroll;
    const chartHeight = (ch) => Math.round(Math.min(CHART_FIT[1], Math.max(CHART_FIT[0], ch * CHART_SHARE)));
    function fitChart() {
      const ch = scroll.clientHeight;
      if (!ch) return;
      const h = chartHeight(ch);
      if (Math.abs(chartHost.offsetHeight - h) >= 1) chartHost.style.height = h + 'px';
      paintAboutFold();
    }
    if (plan) chartHost.style.height = chartHeight(plan.card.height) + 'px';
    const fitter = new ResizeObserver(fitChart);
    fitter.observe(scroll);

    const heldBox = $('.tk-held', body), heldRow = $('.tk-held-row', body), gainEl = $('.tk-held-gain', body);
    let levelsOrder = null, levelsSeen = !plan;
    const levelsRow = $('.tk-levels-row', body), levelsText = $('.tk-levels-text', body);
    function paintGroup() {
      showSection(heldBox, !(heldRow.hidden && levelsRow.hidden));
    }
    const heldNow = () => (D.balancesKnown ? D.holdings().find((row) => row.coin === inst && row.risk !== 'suspicious') : null);
    function paintHeld() {
      const h = heldNow();
      heldRow.hidden = !h;
      if (h) {
        $('.tk-held-amt', heldRow).textContent = `${D.qty(h.amount)} ${inst.sym}`;
        $('.tk-held-usd', heldRow).textContent = h.priced ? fmt.usd(h.usd) : fmt.money('0');
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
      gainEl.textContent = `${flat ? fmt.usd(0) : fmt.signedUsd(diff)} · ${flat ? fmt.pctAbs(0) : fmt.pct(pct)}`;
      gainEl.classList.toggle('is-up', !flat && diff > 0);
      gainEl.classList.toggle('is-down', !flat && diff < 0);
    }

    const acts = $('.tk-acts', body);
    const shareAct = $('[data-act="share"]', acts);
    const alertAct = $('[data-act="alert"]', acts);
    const ordersRow = $('.tk-orders', acts), ordersWord = $('.cell-title', ordersRow), ordersSub = $('.tk-orders-sub', ordersRow);
    const alertWaits = () => !!(bell && window.DemoAlerts && typeof DemoAlerts.has === 'function' && DemoAlerts.has(inst));
    let bellLit = false;
    const paintBell = () => {
      const on = alertWaits();
      if (on === bellLit) return;
      bellLit = on;
      alertAct.setAttribute('aria-pressed', String(on));
      alertAct.innerHTML = `${icon('bell', { fill: on, size: 22 })}<span ${L('alerts.tile')}>${tx('alerts.tile')}</span>`;
    };
    function paintActs() {
      shareAct.hidden = !share;
      alertAct.hidden = !bell;
      showSection(acts, !(ordersRow.hidden && shareAct.hidden && alertAct.hidden));
    }
    acts.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'share' && share) share.onClick(b);
      else if (b.dataset.act === 'alert' && bell) bell.onClick(b);
    });
    paintBell();
    paintActs();
    const stopBell = bell && window.DemoAlerts && typeof DemoAlerts.onChange === 'function' ? DemoAlerts.onChange(paintBell) : () => {};
    const stopMode = () => {
      const S = window.DemoSwap;
      if (!S) return null;
      if (typeof S.stopMode === 'function') return S.stopMode(inst) || null;
      return typeof S.canOrder === 'function' && S.canOrder(inst) ? 'sell' : null;
    };
    const stopTap = (mode) => {
      if (mode === 'sell') return 'sell';
      if (levelsOrder) return 'order';
      return mode === 'buy' ? 'buy' : null;
    };
    const setWord = (el, key) => {
      if (el.getAttribute('data-i18n') === key) return;
      el.setAttribute('data-i18n', key);
      el.textContent = tx(key);
    };
    let stopDrawn = false;
    const paintOrders = () => {
      if (!levelsSeen) return;
      const mode = stopMode();
      const show = mode !== null || stopDrawn;
      if (mode !== null) stopDrawn = true;
      const tap = stopTap(mode);
      if (mode !== null || tap) {
        const buyFirst = tap === 'buy' || (!tap && !heldNow());
        setWord(ordersWord, buyFirst ? 'orders.stop' : 'detail.orders');
        if (ordersSub.hidden === buyFirst) ordersSub.hidden = !buyFirst;
        ordersRow.classList.toggle('has-sub', buyFirst);
      }
      const off = !tap;
      ordersRow.classList.toggle('is-off', off);
      if (off) ordersRow.setAttribute('aria-disabled', 'true');
      else ordersRow.removeAttribute('aria-disabled');
      if (ordersRow.hidden === show) ordersRow.hidden = !show;
      paintActs();
    };
    ordersRow.addEventListener('click', () => {
      const mode = stopMode();
      const tap = stopTap(mode);
      if (!tap) {
        const S = window.DemoSwap;
        const why = mode === null && S && typeof S.stopWhy === 'function' ? S.stopWhy(inst) : '';
        if (!why) return;
        CK.haptic.light();
        CK.toast(tx(why), { icon: 'info', tone: 'accent' });
        return;
      }
      CK.haptic.light();
      if (tap === 'sell') DemoSwap.open(inst, 'sell', null, null, { orders: true });
      else if (tap === 'order') DemoOrders.open(levelsOrder);
      else DemoSwap.open(inst, 'buy', null, null, { stopNext: true });
    });
    const paintHeldAndCost = () => {
      paintHeld();
      paintOrders();
    };
    later(2, paintHeld);
    const stopBalances = D.onBalances(paintHeldAndCost);
    const stopCost = window.DemoCost ? DemoCost.onChange(paintHeldAndCost) : () => {};
    const stopOrdersWatch = window.DemoSwap ? DemoSwap.onChange(paintOrders) : () => {};
    const costTimer = setInterval(() => { if (!heldRow.hidden) paintHeldAndCost(); }, 2000);
    const stopHeld = () => { stopBalances(); stopCost(); stopOrdersWatch(); stopBell(); clearInterval(costTimer); };

    const copyAddress = () => {
      CK.copyText(o.address.address).then((copied) => {
        if (copied) CK.toast(tx('common.addressCopied'), { icon: 'check-circle', tone: 'up' });
        else CK.toast(tx('common.copyFail'), { icon: 'warning', tone: 'down' });
      });
    };
    const overviewBox = $('.tk-overview', body), factsEl = $('.tk-facts', body);
    function paintOverview() {
      const rows = overviewOf(inst);
      const key = `${CK.i18n.lang}|${rows.map((r) => r.join('=')).join('|')}|${o.address ? o.address.address : ''}`;
      if (factsEl.dataset.key !== key) {
        factsEl.dataset.key = key;
        factsEl.innerHTML = '';
        rows.forEach(([label, value]) => {
          const row = CK.el('<div class="tk-fact"><span></span><span></span></div>');
          row.firstElementChild.textContent = tx(label);
          row.lastElementChild.textContent = value;
          factsEl.appendChild(row);
        });
        if (o.address) {
          const row = CK.el(`<button class="tk-fact tk-addr" type="button"><span></span><span class="tk-addr-value"><span class="tk-addr-text"></span>${icon('copy', { size: 15 })}</span></button>`);
          row.firstElementChild.textContent = tx('common.address');
          $('.tk-addr-text', row).textContent = shortAddress(o.address.address);
          row.setAttribute('aria-label', `${tx('common.copyAddress')}: ${o.address.network}, ${shortAddress(o.address.address)}`);
          row.addEventListener('click', () => { CK.haptic.light(); copyAddress(); });
          factsEl.appendChild(row);
        }
      }
      showSection(overviewBox, rows.length > 0 || !!o.address);
    }

    const activityBox = $('.tk-activity', body), volumeRow = $('.tk-volume', body), volumeValue = $('.tk-volume-value', body);
    const flowBox = $('.tk-flow', body);
    const flowOn = !!(CK.market && CK.market.mode === 'live' && typeof fetch === 'function');
    let flow = null, flowTimer = 0, flowSettled = !flowOn;
    const flowDay = () => !!flow && flow.window === '24h';
    function flowNote() {
      if (!flow) return '';
      if (flow.window !== '24h') return tx('tk.lastTrades', { n: flow.trades });
      return flow.source === 'binance' ? tx('tk.srcBinance') : flow.source === 'pool' ? tx('tk.srcPool') : '';
    }
    function paintFlow() {
      const on = !!flow;
      if (flowBox.hidden === on) {
        flowBox.hidden = !on;
        if (on && !activityBox.hidden && CK.motion) CK.motion.blocks(flowBox, { blur: false });
      }
      if (!on) return;
      $('.tk-flow-buy', flowBox).style.flexGrow = String(flow.buyPct);
      $('.tk-flow-sell', flowBox).style.flexGrow = String(flow.sellPct);
      const day = flowDay(), shares = day ? null : sharePcts(flow.buyPct);
      $('.tk-flow-buys', flowBox).textContent = day ? tx('tk.buys', { sum: compactUsd(flow.buyUsd) }) : tx('tk.buysPct', { pct: shares.buy });
      $('.tk-flow-sells', flowBox).textContent = day ? tx('tk.sells', { sum: compactUsd(flow.sellUsd) }) : tx('tk.sellsPct', { pct: shares.sell });
      const note = $('.tk-flow-note', flowBox), noteText = flowNote();
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
      const again = () => { if (!closed) flowTimer = setTimeout(askFlow, FLOW_POLL_MS); };
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

    const aboutBox = $('.tk-about', body), aboutText = $('.tk-about-text', body), aboutMore = $('.tk-about-more', body);
    let aboutOpen = false;
    function paintAboutFold() {
      if (aboutBox.hidden) return;
      aboutText.classList.toggle('is-folded', !aboutOpen);
      const more = aboutOpen || aboutText.scrollHeight > aboutText.clientHeight + 1;
      if (aboutMore.hidden === more) aboutMore.hidden = !more;
      aboutMore.textContent = tx(aboutOpen ? 'tk.collapse' : 'tk.expand');
      aboutMore.setAttribute('aria-expanded', String(aboutOpen));
    }
    function paintAbout() {
      const text = aboutOf(inst);
      if (text && aboutText.textContent !== text) aboutText.textContent = text;
      showSection(aboutBox, !!text);
      paintAboutFold();
    }
    aboutMore.addEventListener('click', () => {
      aboutOpen = !aboutOpen;
      CK.haptic.selection();
      paintAboutFold();
    });

    const linksBox = $('.tk-links', body), chipsEl = $('.tk-chips', body);
    function paintLinks() {
      const list = linksOf(inst);
      const key = list.map((l) => l.url).join(' ');
      if (chipsEl.dataset.key !== key) {
        chipsEl.dataset.key = key;
        chipsEl.innerHTML = '';
        list.forEach((l) => {
          const chip = CK.el(`<button class="tk-chip press" type="button">${icon(l.icon, { size: 18 })}<span></span></button>`);
          chip.lastElementChild.textContent = l.label;
          chip.addEventListener('click', () => {
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
    later(6, paintOverview);
    later(7, paintActivity);
    later(5, paintAbout);
    later(8, paintLinks);

    const opsBox = $('.tk-ops', body), opsList = $('.tk-ops-list', body);
    const sideIsThis = (token) => (token === 'ton' ? inst === D.byId.ton : typeof D.coinOfAddress === 'function' && D.coinOfAddress(token) === inst);
    const opOfThis = (e) => (e.kind === 'swap' ? sideIsThis(e.gave.token) || sideIsThis(e.got.token) : sideIsThis(e.token));
    let opsItems = null;
    function historyToken() {
      if (inst === D.byId.ton) return 'ton';
      const e = (opsItems || []).find(opOfThis);
      if (e) return e.kind === 'swap' ? (sideIsThis(e.got.token) ? e.got.token : e.gave.token) : e.token;
      return inst.token && inst.token.network === 'ton' && inst.token.address ? inst.token.address : null;
    }
    $('.tk-ops-all', body).addEventListener('click', () => {
      CK.haptic.light();
      if (window.DemoManage && typeof DemoManage.openHistory === 'function') {
        const token = historyToken();
        DemoManage.openHistory(token ? { token } : undefined);
      } else DemoWallet.openHistory();
    });
    function opRow(e) {
      const swap = e.kind === 'swap';
      const gotThis = swap && sideIsThis(e.got.token);
      const side = swap ? (gotThis ? e.got : e.gave) : e;
      const plus = swap ? gotThis : e.kind === 'in';
      const cheque = !swap && e.kind === 'out' && window.DemoCheques && typeof DemoCheques.isCheque === 'function' && DemoCheques.isCheque(e.counterparty);
      const state = e.pending ? tx('walletFlow.pending') : e.failed ? tx('walletFlow.failed') : '';
      const glyph = swap ? 'exchange' : cheque ? 'gift' : plus ? 'deposit' : 'withdraw';
      const row = CK.el(`<div class="cell tk-op" role="listitem"><span class="tk-op-tile" aria-hidden="true">${icon(glyph, { size: 20 })}</span><span class="cell-main"><span class="tk-op-title"></span><span class="tk-op-sub"></span></span><span class="tk-op-amount"></span></div>`);
      row.dataset.key = e.key;
      $('.tk-op-title', row).textContent = swap ? tx('action.swap') : cheque ? tx('cheque.row') : tx(plus ? 'tk.opIn' : 'tk.opOut');
      $('.tk-op-sub', row).textContent = state || `${CK.i18n.dayShort(e.at)}, ${CK.i18n.clock(e.at)}`;
      const amount = $('.tk-op-amount', row);
      amount.textContent = `${plus ? '+' : '−'}${D.qty(CK.ton.fromUnits(side.units, side.decimals))} ${side.sym}`;
      amount.classList.toggle('is-up', plus && !state);
      return row;
    }
    function paintOps() {
      const mine = (opsItems || []).filter(opOfThis).slice(0, OPS_SHOWN);
      if (!mine.length) {
        showSection(opsBox, false);
        return;
      }
      const key = `${CK.i18n.lang}|${mine.map((e) => `${e.key}${e.pending ? 'p' : ''}${e.failed ? 'f' : ''}`).join('|')}`;
      if (opsList.dataset.key === key) return;
      opsList.dataset.key = key;
      const appearing = opsBox.hidden;
      opsList.innerHTML = '';
      mine.forEach((e) => opsList.appendChild(opRow(e)));
      showSection(opsBox, true);
      if (!CK.motion) return;
      if (opening && appearing) CK.motion.quiet(() => CK.motion.rows(opsList));
      else CK.motion.rows(opsList, appearing ? { delay: 120 } : {});
    }
    const opsOn = isTonAsset(inst);
    function loadOps() {
      const wallet = CK.ton && CK.ton.wallet;
      if (closed || !opsOn || !wallet || !CK.market || CK.market.mode !== 'live' || !window.DemoWallet || typeof DemoWallet.cleanEvents !== 'function') return;
      walletOps(wallet.address).then((items) => {
        if (closed || CK.ton.wallet !== wallet) return;
        opsItems = items;
        paintOps();
      }, () => { });
    }
    const stopOpsBalances = opsOn ? D.onBalances(loadOps) : () => {};

    let scrubbing = false, frameId = '1d', hasSeries = false, hadPrice = inst.price > 0, noTradesProven = false, frameText = '', lastSeries = null;
    const hasPrice = () => inst.price > 0;
    const paintPrice = (v, up) => {
      priceBox.classList.toggle('is-none', !(v > 0));
      if (!(v > 0) && !noTradesProven && inst.isToken && !priceAsked.has(inst.id)) {
        if (!priceEl.querySelector('.tk-price-skel')) priceEl.innerHTML = PRICE_SKEL;
        return;
      }
      CK.priceTick(priceEl, v > 0 ? fmt.price(v) : noTradesProven ? tx('token.noTrades') : fmt.money('0'), up);
    };
    const periodOf = (tf) => (FRAME_MS[tf] ? tx(`tk.per${tf}`) : '');
    const rangeOf = (s) => {
      if (s.rough || !s.from || !s.to) return '';
      const span = s.to - s.from, whole = FRAME_MS[s.tf];
      if (span >= whole * FRAME_FITS[0] && span <= whole * FRAME_FITS[1]) return '';
      const { clock, dayShort } = CK.i18n;
      if (span >= 1.5 * FRAME_MS['1d']) return `${dayShort(s.from)} – ${dayShort(s.to)}`;
      return dayShort(s.from) === dayShort(s.to)
        ? `${clock(s.from)} – ${clock(s.to)}`
        : `${dayShort(s.from)} ${clock(s.from)} – ${dayShort(s.to)} ${clock(s.to)}`;
    };
    const frameTextOf = (s) => rangeOf(s) || periodOf(s.tf);
    const dayChange = (tf) => (inst.isToken && tf === '1d' && inst.change !== null && inst.change !== undefined ? inst.change : null);
    const pill = CK.chart.pill(changeEl, inst.change || 0);
    function paintDelta(pct, at) {
      const now = at > 0 ? at : inst.price;
      const shown = now > 0 && typeof pct === 'number' && Number.isFinite(pct) && pct > -100 && !CK.changeFlat(pct);
      deltaEl.hidden = !shown;
      if (!shown) return;
      const d = now - now / (1 + pct / 100);
      deltaEl.textContent = `${d >= 0 ? '+' : '−'}${fmt.price(Math.abs(d))}`;
      deltaEl.classList.toggle('is-up', d >= 0);
      deltaEl.classList.toggle('is-down', d < 0);
    }
    function paintDockChange(v) {
      const flat = CK.changeFlat(v), up = v >= 0 || flat;
      dockPct.classList.toggle('is-up', up);
      dockPct.classList.toggle('is-down', !up);
      dockPct.classList.toggle('is-flat', flat);
      const text = flat ? fmt.pctAbs(0) : fmt.pct(v);
      if (dockPct.textContent !== text) dockPct.textContent = text;
    }
    paintDockChange(inst.change || 0);
    const setChange = (pct, at) => {
      pill.set(pct);
      paintDockChange(pct);
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
      const show = hasSeries || (inst.change !== null && inst.change !== undefined && hasPrice());
      changeEl.hidden = !show;
      frameLabel.hidden = !show;
      if (!show) deltaEl.hidden = true;
      else if (!scrubbing) paintDelta(restChange);
      metaEl.classList.toggle('is-waiting', show && frameWaiting);
      dockChange.hidden = !show;
      dockPct.classList.toggle('is-waiting', show && frameWaiting);
    }
    frameText = periodOf(frameId);
    frameLabel.textContent = frameText;
    paintPrice(inst.price);
    paintMeta();
    if (o.warning) {
      const warn = $('.tk-warn', body);
      warn.hidden = false;
      warn.classList.toggle('is-soft', o.warning === 'detail.unverified');
      CK.i18n.setKey(warn.lastElementChild, o.warning);
      warn.addEventListener('click', () => {
        if (CK.sheet.top || !o.address) return;
        CK.haptic.light();
        CK.sheet.open({
          title: tx(o.warning),
          build(b) {
            b.innerHTML = `<div class="tk-why"><p class="tk-why-net"></p><p class="tk-why-addr"></p><button class="btn btn--tinted press tk-why-copy" type="button" ${L('common.copy')}>${tx('common.copy')}</button></div>`;
            $('.tk-why-net', b).textContent = o.address.network;
            $('.tk-why-addr', b).textContent = o.address.address;
            $('.tk-why-copy', b).addEventListener('click', copyAddress);
          }
        });
      });
    }
    const ROUGH_WAIT_MS = 30000;
    const firstAsked = {};
    const firstPoints = o.rough ? undefined : o.points;

    const LOADER_AFTER_MS = 1000;
    let loaderTimer = 0;
    const loadingLater = () => {
      clearTimeout(loaderTimer);
      loaderTimer = setTimeout(() => {
        if (!closed && !hasSeries && !noTradesProven) chartHost.classList.add('tk-chart-loading');
      }, LOADER_AFTER_MS);
    };

    const markEmpty = () => {
      noTradesProven = true;
      clearTimeout(loaderTimer);
      chartHost.classList.remove('tk-chart-loading');
      chartHost.classList.add('tk-chart-empty');
      const typeBox = $('.chart-type', body);
      if (typeBox) typeBox.classList.add('is-off');
      hasSeries = false;
      paintPrice(inst.price);
      paintMeta();
      renderBar();
    };
    let closed = false, loadRun = 0, againTimer = 0, pendingTimer = 0;
    const refreshes = {};
    const retryDelay = (tries) => CHART_RETRY_MS[Math.min(tries, CHART_RETRY_MS.length - 1)] * (.85 + Math.random() * .3);
    const showAgain = (tf) => {
      const tries = refreshes[tf] || 0;
      refreshes[tf] = tries + 1;
      clearTimeout(againTimer);
      againTimer = setTimeout(() => { if (!closed && tf === frameId && chart) chart.show(tf); }, retryDelay(tries));
    };
    const attempt = (tf, run, tries) => {
      const current = () => !closed && run === loadRun;
      const wait = () => new Promise((resolve) => { setTimeout(resolve, retryDelay(tries)); }).then(() => (current() ? attempt(tf, run, tries + 1) : { keep: true }));
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
    let chart = null;
    const makeChart = () => { chart = CK.chart(chartHost, {
      points: firstPoints,
      rough: false,
      candles: firstPoints ? o.candles : undefined,
      tf: frameId,
      load,
      emptyText: o.emptyText,
      typeHome: $('.detail-frames-row', body),
      onSeries(s) {
        frameId = s.tf;
        hasSeries = true;
        frameWaiting = false;
        noTradesProven = false;
        clearTimeout(loaderTimer);
        chartHost.classList.remove('tk-chart-empty', 'tk-chart-loading');
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
    }); };
    later(1, makeChart);
    const livePrice = (c) => (c && c.price > 0 && (c.isToken || c.priced === true) ? c.price : 0);
    function paintLevels() {
      if (closed) return;
      const wallet = CK.ton.wallet;
      const order = window.DemoOrders && typeof DemoOrders.forToken === 'function' ? DemoOrders.forToken(inst) : null;
      const own = !!order || (D.balancesKnown && D.holdings().some((row) => row.coin === inst && row.risk !== 'suspicious'));
      const cost = own && wallet && window.DemoCost ? DemoCost.of(wallet.address, inst.id) : null;
      const view = cardLevels({ order, cost, price: livePrice(inst), gramUsd: livePrice(D.byId.ton) });
      if (chart) chart.levels(view.levels);
      levelsOrder = view.row ? order.id : null;
      levelsSeen = true;
      if (levelsRow.hidden === !!view.row) levelsRow.hidden = !view.row;
      if (view.row && levelsText.textContent !== view.row) levelsText.textContent = view.row;
      paintGroup();
      paintOrders();
      const aria = view.row ? `${view.row}, ${tx('chart.levelsOpen')}` : '';
      if (aria && levelsRow.getAttribute('aria-label') !== aria) levelsRow.setAttribute('aria-label', aria);
    }
    levelsRow.addEventListener('click', () => {
      if (!levelsOrder) return;
      CK.haptic.light();
      DemoOrders.open(levelsOrder);
    });
    const stopLevelsFollow = window.DemoOrders && typeof DemoOrders.drawable === 'function' && DemoOrders.drawable(inst) ? DemoOrders.follow(paintLevels) : () => {};
    const stopLevelsBalances = D.onBalances(paintLevels);
    const stopLevelsCost = window.DemoCost ? DemoCost.onChange(paintLevels) : () => {};
    const onLevelTick = (c) => { if (c === inst || c === D.byId.ton) paintLevels(); };
    ctx.tickListeners.add(onLevelTick);
    later(2, paintLevels);
    if (o.prefetch) D.FRAMES.forEach((f) => { o.load(f.value).catch(() => {}); });
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
        if (!closed) D.FRAMES.forEach((f) => { if (f.value !== frameId) o.prefetchFrame(f.value); });
      }, PREFETCH_FRAMES_MS);
    }
    CK.segmented($('.detail-frames', body), {
      label: tr('chart.period'), size: 'small', value: '1d',
      items: D.FRAMES.map((f) => ({ value: f.value, label: f.label })),
      onChange(v) {
        frameId = v;
        if (!chart) return;
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
            chartHost.classList.add('tk-chart-loading');
          }, PENDING_MAX_MS);
        }
        chart.show(v);
      }
    });

    const bar = CK.el('<div class="detail-bar"></div>');
    winBody.appendChild(bar);
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
      if (!inst.isToken && !hasPrice()) return 'wait';
      if (!onOtherNet && !DemoSwap.eligible(inst)) {
        if (inst.token && inst.token.risk === 'suspicious') return 'trade.suspect';
        return 'swapSheet.noPool';
      }
      const swaps = DemoSwap.state;
      if (swaps === 'closed') return 'trade.closed';
      if (swaps === 'failed') return 'market.down';
      if (swaps !== 'open') return 'wait';
      const wallet = CK.ton.wallet, status = CK.wallet.status;
      if (!wallet && status.kind === 'unknown') return walletAsked ? 'market.down' : 'wait';
      if (wallet && wallet.readOnly) return 'trade.noSign';
      if (status.lost) return 'wallet.lost';
      if (status.denied) return 'wallet.denied';
      if (status.bioUnknown) return 'wallet.bioWait';
      if (onOtherNet && status.tonOnly) return 'xnet.tonOnly';
      if (!wallet && !(window.DemoWalletSetup && status.setup)) return 'wallet.phoneOnly';
      if (route === false) return 'swapSheet.noPool';
      if (route === undefined) {
        if (!routeAsked) startRoute();
        if (!routeWaited) return 'wait';
      }
      const only = onOtherNet ? null : sellOnlyMode(inst, D.balancesKnown ? D.holdings() : [], DemoSwap.buyable);
      if (only) return only;
      return wallet ? 'trade' : 'create';
    }
    function renderBar() {
      if (closed) return;
      const mode = barMode();
      if (bar.dataset.mode === mode) return;
      const replaces = !!bar.dataset.mode;
      bar.dataset.mode = mode;
      bar.classList.toggle('is-waiting', mode === 'wait');
      const button = (side, key) => `<button class="btn btn--${side} press" type="button" data-side="${side}" ${L(key)}>${tx(key)}</button>`;
      if (mode === 'wait') bar.innerHTML = '<div class="tk-bar-wait"></div>';
      else if (mode === 'trade') bar.innerHTML = `<div class="btn-row">${button('buy', 'common.buy')}${button('sell', 'common.sell')}</div>`;
      else if (mode === 'create') bar.innerHTML = `<div class="btn-row">${button('buy', 'common.buy')}</div>`;
      else if (mode === 'sell') bar.innerHTML = `<div class="btn-row">${button('sell', 'common.sell')}</div>`;
      else bar.innerHTML = `<p class="tk-notice" ${L(mode)}>${tx(mode)}</p>`;
      if (replaces) bar.firstElementChild.classList.add('tk-bar-in');
    }
    renderBar();
    const stopSwapWatch = DemoSwap.onChange(renderBar);
    const stopBarBalances = D.onBalances(renderBar);
    CK.wallet.ready.then(renderBar);
    CK.wallet.ready.then(paintOrders);
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-side]');
      if (!b) return;
      if (bar.dataset.mode === 'trade' || bar.dataset.mode === 'sell') {
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
        chartHost.classList.remove('tk-chart-empty');
        if (!hasSeries) loadingLater();
        if (chart) chart.show(frameId);
      }
      if (dayChange(frameId) !== null) setRestChange(dayChange(frameId));
      paintMeta();
      paintHeld();
      paintFacts();
    };
    ctx.tickListeners.add(onTick);
    const onAsked = (ids) => { if (!scrubbing && ids.includes(inst.id)) paintPrice(inst.price); };
    askedListeners.add(onAsked);
    watch(inst);
    if (inst.isToken && !hasPrice() && !priceAsked.has(inst.id)) tickWatched();
    later(4, loadOps);
    if (flowOn) later(7, askFlow);
    CK.i18n.bind(screen.el, () => {
      if (!scrubbing) {
        paintPrice(inst.price);
        paintDockChange(restChange);
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
    let land = null;
    const landed = plan ? new Promise((resolve) => { land = resolve; }) : null;
    o.stack.push(screen, {
      returnFocus: o.from,
      held: !!plan,
      landed,
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
        if (chart) chart.destroy();
      }
    });
    if (plan && screen.el.isConnected) {
      const parts = Array.from(body.children).filter((el) => !el.hidden && el !== chartHost && !el.classList.contains('detail-head'));
      risen = parts.length;
      const done = () => {
        opening = false;
        land();
      };
      growFromRow(screen, o.from, under, plan, parts).then(done, done);
      openSteps();
    } else if (land) land();
    return screen;

    function openSteps() {
      requestAnimationFrame(() => {
        if (closed) return;
        screen.el.classList.remove('tk-logo-wait');
        const logo = $('.detail-logo', titleEl);
        if (plan.logo && logo) CK.motion.flyLogo(plan.logo, logo, { with: win });
        if (afterOpen.length) afterFrame(step);
      });
      afterOpen.sort((a, b) => a[0] - b[0]);
      let i = 0;
      const step = () => {
        if (closed) return;
        const at = afterOpen[i][0];
        try {
          while (i < afterOpen.length && afterOpen[i][0] === at) afterOpen[i++][1]();
        } finally {
          if (i < afterOpen.length) afterFrame(step);
        }
      };
    }
  }
  let framePort = null;
  const frameQueue = [];
  function afterFrame(fn) {
    requestAnimationFrame(() => {
      if (typeof MessageChannel !== 'function') {
        setTimeout(fn, 0);
        return;
      }
      if (!framePort) {
        const ch = new MessageChannel();
        ch.port1.onmessage = () => { const next = frameQueue.shift(); if (next) next(); };
        framePort = ch.port2;
      }
      frameQueue.push(fn);
      framePort.postMessage(0);
    });
  }

  function closedTron(id) {
    if (typeof id !== 'string' || !id.startsWith('tron:')) return false;
    const nets = window.DemoNets;
    const row = (nets && typeof nets.withdrawRowOf === 'function' ? nets.withdrawRowOf(id) : null) || null;
    const held = !!row || D.holdings().some((h) => h.coin && h.coin.id === id);
    if (held && window.DemoWallet && typeof DemoWallet.openWithdraw === 'function') DemoWallet.openWithdraw({ chain: 'tron', row });
    return true;
  }
  function openToken(token, from) {
    if (closedTron(token && token.id)) return;
    const inst = instrumentOf(token);
    if (!inst.isToken) {
      ctx.openCoin(inst, from);
      return;
    }
    const networkName = (id) => CK.market.networkName(id) || (id ? id.toUpperCase() : '');
    const pinned = (points) => {
      if (!points || points.length < 2 || !(inst.price > 0)) return points;
      const last = points[points.length - 1];
      if (Math.abs(inst.price / last[1] - 1) > PIN_MAX_GAP) return points;
      const now = chartNow();
      const head = now - last[0] < PIN_REPLACE_MS ? points.slice(0, -1) : points;
      return head.concat([[Math.max(now, last[0]), inst.price]]);
    };
    const rowLine = inst.token.spark;
    const realLine = CK.market.tokenChartNow(inst.id, '1d');
    openDetail({
      inst,
      title: inst.sym,
      from,
      stack: ctx.currentStack(),
      points: realLine ? pinned(realLine) : undefined,
      rough: false,
      candles: realLine ? CK.market.tokenCandlesNow(inst.id, '1d') : undefined,
      load: (tf) => CK.market.tokenKlines(inst.id, tf, { frames: true }).then((res) => {
        if (res.points.length < 2) return res;
        return { ...res, points: pinned(res.rough && tf === '1d' && rowLine ? rowLine : res.points) };
      }),
      lineNow: (tf) => {
        const line = CK.market.tokenChartNow(inst.id, tf);
        return line ? pinned(line) : null;
      },
      candlesNow: (tf) => CK.market.tokenCandlesNow(inst.id, tf),
      prefetchFrames: (tf) => CK.market.prefetchFrames(inst.id, tf),
      emptyText: tr('detail.noDeals'),
      warning: inst.token.risk === 'suspicious' ? 'detail.fake' : inst.token.unverified ? 'detail.unverified' : '',
      address: { network: networkName(inst.token.network), address: inst.token.address }
    });
    refreshToken(inst).then(() => {
      if (!(inst.price > 0)) askPool(inst);
    });
  }
  function openHeldToken(id, from) {
    if (closedTron(id)) return;
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
      CK.market.onStream((sid) => { if (sid) tickWatched(); });
      CK.wallet.ready.then(() => { walletAsked = true; });
      D.onBalances(() => {
        if (D.holdings().some((h) => h.coin.isToken && !(h.coin.price > 0))) pollTokens(true);
      });
      document.addEventListener('visibilitychange', () => pollTokens());
      return { openDetail, openHeldToken, reloadMarket: () => feed.reloadMarket(), onShow: () => feed.onShow() };
    },
    watch,
    unwatch,
    refreshToken,
    feedStats: () => feed.stats()
  };
})();
