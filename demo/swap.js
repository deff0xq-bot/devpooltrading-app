(function () {
  'use strict';
  const { fmt, icon, clamp, t: tx } = CK;
  const T = CK.ton;
  const Audit = CK.swapAudit;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);

  const PENDING_KEY = 'ck-swap-pending';
  const NATIVE = 'TON';
  const NATIVE_RAW = '0:' + '0'.repeat(64);
  const USDT_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const NOT_RAW = T.rawAddress('EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT');
  const TON_DECIMALS = 9;
  const USDT_DECIMALS = 6;
  const knownDecimals = Audit.knownDecimals;
  const GAS_RESERVE = 350000000n;
  if (CK.i18n && typeof CK.i18n.add === 'function') {
    CK.i18n.add({
      'swap.stopNext': ['После покупки можно поставить стоп', 'You can set a stop after buying', 'Після купівлі можна поставити стоп', 'Сатып алғаннан кейін стоп қоюға болады'],
      'swap.stopCap': ['Стоп закроет до {sum}', 'A stop covers up to {sum}', 'Стоп закриє до {sum}', 'Стоп {sum} дейін қамтиды'],
      'swap.stopGas': ['Оставьте {sum} на газ и стоп', 'Keep {sum} for gas and the stop', 'Залиште {sum} на газ і стоп', 'Газ бен стопқа {sum} қалдырыңыз'],
      'swap.stopLater': ['Стоп сейчас не поставить', 'A stop can’t be set right now', 'Стоп зараз не поставити', 'Қазір стоп қою мүмкін емес'],
      'orders.pickLevel': ['Выберите стоп или тейк', 'Choose a stop or a take-profit', 'Оберіть стоп або тейк', 'Стопты не тейкті таңдаңыз']
    });
  }
  const SWAP_RESERVE = 20000000n;
  const PLACE_MESSAGE_FEE = 10000000n;
  const TWO_STEP_FEE_ROOM = 50000000n;
  const QUOTE_DELAY_MS = 120;
  const QUOTE_MIN_LEFT_MS = 2000;
  const QUOTE_REFRESH_LEFT_MS = 15000;
  const BUILT_MAX_AGE_MS = 20000;
  const BUILD_AHEAD_DELAY_MS = 150;
  const AFTER_RISE_MS = 350;
  const QUOTES_KEPT = 6;
  const STOPS_PER_MILLE = [250n, 500n, 750n, 1000n];
  const QUOTE_RETRY_MS = 5000;
  const BALANCE_RETRY_MS = 5000;
  const BOUGHT_AGAIN_MS = 1000;
  const BOUGHT_LOOKS_MAX = 4;
  const IMPACT_WARN_PCT = 3;
  const MARKET_WARN_PCT = 3;
  function marketLossPct(t) {
    if (!t || !(t.offerPrice > 0) || !(t.askPrice > 0) || typeof t.units !== 'bigint' || typeof t.out !== 'bigint' || t.units <= 0n || t.out < 0n) return null;
    if (!Number.isInteger(t.offerDecimals) || !Number.isInteger(t.askDecimals) || t.offerDecimals < 0 || t.askDecimals < 0 || t.offerDecimals > 30 || t.askDecimals > 30) return null;
    const worthIn = T.fromUnits(t.units, t.offerDecimals) * t.offerPrice;
    const worthOut = T.fromUnits(t.out, t.askDecimals) * t.askPrice;
    if (!(worthIn > 0) || !Number.isFinite(worthIn) || !Number.isFinite(worthOut)) return null;
    return (worthIn - worthOut) / worthIn * 100;
  }
  const POLL_MS = 2500;
  const POLL_FIRST_MS = [1000, 1500];
  const POLL_QUICK_MS = 1100;
  const POLL_QUICK_FOR_MS = 30000;
  const pollAfter = (age) => (age < POLL_FIRST_MS[0] ? POLL_FIRST_MS[0] : age < POLL_QUICK_FOR_MS ? POLL_QUICK_MS : POLL_MS);
  const POLL_SLOW_MS = 15000;
  const SLOW_AFTER_MS = 5 * 60 * 1000;
  const GIVE_UP_AFTER_MS = 30 * 60 * 1000;
  const CONFIG_RETRY_MS = 15000;
  const EXPIRY_MARGIN_S = 15;
  const LOST_GRACE_S = 30;
  const EXPLORER = 'https://tonviewer.com/';
  const EXPLORER_LINK = /^https:\/\/tonviewer\.com\/[\w/-]+$/;
  const FORM_FLOOR_PX = 500;
  let foldIds = 0;
  const foldId = (name) => `sw-${name}-${++foldIds}`;
  const FOLD_ROOM_PX = 20;
  const HEAD_CLEAR_PX = 8;
  function openFolds(body, folds) {
    const list = Array.isArray(folds) ? folds : !body.querySelectorAll ? [] : Array.from(body.querySelectorAll('.fold-toggle.sw-more')).filter((toggle) => !toggle.hidden)
      .map((toggle) => (toggle.getAttribute && toggle.getAttribute('aria-controls') ? body.querySelector(`#${toggle.getAttribute('aria-controls')}`) : null));
    const opened = list.filter((box) => box && box.hidden === true);
    opened.forEach((box) => { box.hidden = false; });
    const close = () => opened.forEach((box) => { box.hidden = true; });
    close.opened = opened.length;
    return close;
  }
  function safeTopPx() {
    if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') return 0;
    const probe = document.createElement('div');
    if (!probe || !probe.style) return 0;
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.height = 'var(--safe-top)';
    document.body.appendChild(probe);
    const px = probe.offsetHeight || 0;
    if (typeof probe.remove === 'function') probe.remove();
    return px > 0 ? px : 0;
  }
  function headRoom(panel) {
    const host = panel && panel.parentElement;
    const hostH = host && host.clientHeight > 0 ? host.clientHeight : typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 0;
    return hostH > 0 ? hostH - safeTopPx() - HEAD_CLEAR_PX : Infinity;
  }
  function pinHeight(o, sheet, floor, folds, room) {
    const panel = sheet && sheet.el, body = sheet && sheet.body;
    if (!o || !Array.isArray(o.detents) || !panel || !body || !panel.querySelector) return 0;
    const top = panel.querySelector('.sheet-top');
    const dock = panel.querySelector(':scope > .sheet-dock');
    const style = body.style || {};
    const was = style.maxHeight;
    style.maxHeight = 'none';
    const close = openFolds(body, folds);
    const wrap = close.opened ? (room >= 0 ? room : FOLD_ROOM_PX) : 0;
    const natural = (top ? top.offsetHeight || 0 : 0) + (body.scrollHeight || 0) + (dock ? dock.offsetHeight || 0 : 0) + wrap;
    close();
    style.maxHeight = was || '';
    if (!(natural > 0)) return 0;
    o.detents.length = 1;
    o.detents[0] = Math.min(Math.max(natural, floor > 0 ? floor : 0), headRoom(panel));
    return o.detents[0];
  }
  function reveal(sheet, toggle, box) {
    const body = sheet && sheet.body;
    if (!body || !box || box.hidden || typeof body.scrollTo !== 'function' || !box.getBoundingClientRect || !toggle || !toggle.getBoundingClientRect) return;
    const css = typeof getComputedStyle === 'function' ? getComputedStyle : null;
    const b = body.getBoundingClientRect(), r = box.getBoundingClientRect(), t = toggle.getBoundingClientRect();
    let limit = b.bottom - (css ? parseFloat(css(body).paddingBottom) || 0 : 0);
    const foot = body.lastElementChild;
    if (css && foot && foot !== box && !box.contains(foot) && css(foot).position === 'sticky') limit = Math.min(limit, foot.getBoundingClientRect().top);
    let by = Math.min(r.bottom - limit, t.top - b.top);
    const card = typeof body.querySelector === 'function' ? body.querySelector(':scope > .sw-card') : null;
    if (card && typeof card.getBoundingClientRect === 'function') by = Math.min(by, card.getBoundingClientRect().top - b.top - (css ? parseFloat(css(body).paddingTop) || 0 : 0));
    if (by > 1) body.scrollTo({ top: body.scrollTop + by, behavior: CK.reducedMotion && CK.reducedMotion() ? 'auto' : 'smooth' });
  }
  function edgeFade(body) {
    if (!body || typeof body.addEventListener !== 'function' || !body.classList) return;
    const paint = () => {
      const top = body.scrollTop > 1;
      const bottom = body.scrollTop + body.clientHeight < body.scrollHeight - 1;
      body.classList.toggle('is-cut-top', top);
      body.classList.toggle('is-cut-bottom', bottom);
    };
    body.addEventListener('scroll', paint, { passive: true });
    if (typeof ResizeObserver === 'function') {
      const watch = new ResizeObserver(paint);
      watch.observe(body);
      Array.from(body.children || []).forEach((el) => watch.observe(el));
    }
    paint();
  }

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { } }
  };

  let cfg = null, ctx = null, state = 'loading';
  const subs = new Set();
  const emit = () => subs.forEach((fn) => {
    try { fn(); } catch (err) { console.error(err); }
  });

  const isSuspicious = (inst) => !!inst.token && inst.token.risk === 'suspicious';
  const sameWallet = (rec) => !!(rec && T.wallet && rec.wallet === T.wallet.address);
  function assetIdOf(inst) {
    if (!inst) return null;
    if (inst === D.byId.ton) return NATIVE;
    if (inst === D.byId.usdt) return USDT_RAW;
    if (inst === D.byId.not) return NOT_RAW;
    if (!inst.isToken || !inst.token || inst.token.network !== 'ton') return null;
    const raw = T.rawAddress(inst.token.address);
    if (!raw || !raw.startsWith('0:')) return null;
    return raw === NATIVE_RAW ? NATIVE : raw;
  }
  const sameAsset = (given, id) => T.rawAddress(given) === (id === NATIVE ? NATIVE_RAW : id);
  const logoOf = (a, size) => (a.inst ? CK.coinLogo(a.inst, size) : CK.coinLogo({ id: a.id === NATIVE ? 'ton' : a.id, sym: a.sym, neutral: true, logo: a.logo || null }, size));
  const flipIn = (chip) => {
    if (CK.reducedMotion() || !chip.animate) return;
    [...chip.children].forEach((el, i) => el.animate([{ opacity: 0, transform: 'translate3d(0,8px,0) scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 30, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
  };
  const qtySym =(units, asset) => `${D.qty(T.fromUnits(units, asset.decimals))} ${asset.sym}`;
  const fieldText = (v) => (v > 0 ? D.qty(v).replace(/\s/g, '') : '');
  const shortDown = (units) => {
    const step = 10n ** BigInt(Math.max(0, units.toString().length - 4));
    return units - (units % step);
  };
  const unitsText = (units, decimals) => (window.DemoWallet ? DemoWallet.unitsText(units, decimals) : fieldText(T.fromUnits(units, decimals)));
  const typedUnits = (text, decimals) => (window.DemoWallet ? DemoWallet.typedUnits(text, decimals) : T.toUnits(Math.max(0, fmt.parse(text)), decimals));
  function tidyField(input, units, decimals) {
    if (window.DemoWallet && DemoWallet.typedUnits(input.value, decimals) === units) input.value = DemoWallet.unitsText(units, decimals);
  }
  function shakePass(el, buzz) {
    if (buzz) CK.haptic.error();
    if (!el || !el.animate || CK.reducedMotion()) return;
    el.animate([{ transform: 'none' }, { transform: 'translate3d(-8px,0,0)' }, { transform: 'translate3d(7px,0,0)' }, { transform: 'translate3d(-5px,0,0)' }, { transform: 'translate3d(3px,0,0)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
  }
  const pctText = (bps) => `${fmt.num(bps / 100, bps % 100 ? (bps % 10 ? 2 : 1) : 0)}${CK.i18n.lang === 'en' ? '' : '\u00a0'}%`;
  function sig4(v, down) {
    const a = Math.abs(v);
    if (!(a > 0) || !Number.isFinite(a) || a >= 1e9) return D.qty(v);
    const digits = Math.max(0, 3 - Math.floor(Math.log10(a)));
    const scale = Math.pow(10, digits);
    const text = fmt.num((down ? Math.floor(v * scale) : Math.round(v * scale)) / scale, digits);
    const point = fmt.decimal ? fmt.decimal() : ',';
    return digits > 0 && text.includes(point) ? text.replace(/0+$/, '').replace(new RegExp(`\\${point}$`), '') : text;
  }
  const sig4Sym = (units, asset, down) => `${sig4(T.fromUnits(units, asset.decimals), down)} ${asset.sym}`;
  const feeMoney = (usd) => (fmt.shown(usd) < 0.005 ? `< ${fmt.money(fmt.num(0.01, 2))}` : fmt.usd(usd));
  const whyButton = (key) => `<button class="sw-why press" type="button" data-why="${key}" aria-label="${CK.esc(tx(key))}">${icon('info', { size: 16 })}</button>`;
  const WHY = { 'orders.lineShort': 'orders.line', 'swapSheet.unverified': 'detail.unverified' };
  const tonAsset = () => ({ id: NATIVE, sym: D.byId.ton.sym, name: D.byId.ton.name, decimals: TON_DECIMALS, inst: D.byId.ton });
  const usdtAsset = () => ({ id: USDT_RAW, sym: D.byId.usdt.sym, name: D.byId.usdt.name, decimals: USDT_DECIMALS, inst: D.byId.usdt });

  let balances = null, balancesJob = null;
  function cleanBalance(raw) {
    if (!raw) return null;
    const units = T.parseUnits(raw.units);
    if (units === null) return null;
    if (raw.native === true) {
      const price = D.byId.ton.price;
      return { id: NATIVE, units, decimals: TON_DECIMALS, usd: price > 0 ? T.fromUnits(units, TON_DECIMALS) * price : null, sym: D.byId.ton.sym, name: D.byId.ton.name, logo: null, risk: 'none' };
    }
    const id = T.rawAddress(raw.token);
    if (!id || !(units > 0n) || !Number.isInteger(raw.decimals) || raw.decimals < 0 || raw.decimals > 30) return null;
    const known = knownDecimals(id);
    if (known !== null && known !== raw.decimals) return null;
    const names = CK.market.cleanToken({ id: 'ton:x', symbol: raw.symbol, name: raw.name, address: id });
    const wallet = T.rawAddress(raw.wallet);
    return { id, units, decimals: raw.decimals, wallet: wallet && wallet.startsWith('0:') ? wallet : null, usd: typeof raw.usd === 'number' && Number.isFinite(raw.usd) ? raw.usd : null, sym: names.symbol, name: names.name, logo: typeof raw.logo === 'string' && raw.logo.startsWith('api/logos?') ? raw.logo : null, risk: raw.risk === 'suspicious' || (!Audit.orderable(id) && CK.market.passesForCoin(raw.symbol, raw.name, raw.listed)) ? 'suspicious' : 'none' };
  }
  const cleanBalances = (body) => (Array.isArray(body.balances) ? body.balances : []).map(cleanBalance).filter(Boolean);
  const AGED_AGAIN_MS = 3000, AGED_LOOKS_MAX = 3;
  const STOP_AGAIN_MS = 16000, ROWS_AGAIN_MS = 16000;
  let agedLooks = 0;
  function loadBalances() {
    const wallet = T.wallet;
    if (!wallet) return Promise.resolve(null);
    if (balancesJob) return balancesJob;
    balancesJob = T.api('wallet/balances?address=' + encodeURIComponent(wallet.address)).then((body) => {
      if (!T.wallet || T.wallet.address !== wallet.address) return null;
      balances = { wallet: wallet.address, rows: cleanBalances(body), at: Date.now(), aged: body.aged === true };
      if (body.aged === true && agedLooks < AGED_LOOKS_MAX) {
        agedLooks += 1;
        setTimeout(() => { if (T.wallet && T.wallet.address === wallet.address) loadBalances().then(emit, () => {}); }, AGED_AGAIN_MS);
      } else if (body.aged !== true) agedLooks = 0;
      return balances;
    }).finally(() => { balancesJob = null; });
    return balancesJob;
  }
  function takeBalances(address, body) {
    if (!T.wallet || T.wallet.address !== address || !body) return;
    balances = { wallet: address, rows: cleanBalances(body), at: Date.now(), aged: body.aged === true };
  }
  const rowOf = (id) => (balances && T.wallet && balances.wallet === T.wallet.address ? balances.rows.find((r) => r.id === id) || null : null);
  const sellable = (id) => {
    if (!balances || !T.wallet || balances.wallet !== T.wallet.address) return true;
    const row = rowOf(id);
    return !!(row && row.wallet && row.risk !== 'suspicious');
  };
  function offerWalletConfirmed(id, owner, wallet) {
    return T.api('wallet/jetton-wallet?address=' + encodeURIComponent(owner) + '&token=' + encodeURIComponent(id)).then(
      (body) => T.rawAddress(body.token) === id && T.rawAddress(body.wallet) === wallet,
      (err) => {
        if (err.message === 'wallet_disagree') return false;
        throw err;
      }
    );
  }
  const unitsOf = (id) => { const r = rowOf(id); return r ? r.units : 0n; };
  function worthText(asset, amount) {
    const row = rowOf(asset.id);
    const inst = asset.id === NATIVE ? D.byId.ton : asset.id === USDT_RAW ? D.byId.usdt : asset.id === NOT_RAW ? D.byId.not : asset.inst;
    const price = inst && inst.price > 0 ? inst.price : row && row.usd !== null && row.units > 0n ? row.usd / T.fromUnits(row.units, row.decimals) : 0;
    return amount > 0 && price > 0 ? ` (${fmt.usd(amount * price)})` : '';
  }
  function instOf(asset) {
    if (asset.id === NATIVE) return D.byId.ton;
    if (asset.id === USDT_RAW) return D.byId.usdt;
    if (asset.id === NOT_RAW) return D.byId.not;
    if (asset.inst) return asset.inst;
    try { return typeof D.coinOfAddress === 'function' ? D.coinOfAddress(asset.id) || null : null; } catch (_) { return null; }
  }
  function coinIdOf(asset) {
    const inst = instOf(asset);
    return inst && typeof inst.id === 'string' ? inst.id : null;
  }
  function heldBefore(asset) {
    try {
      if (!balances || !T.wallet || balances.wallet !== T.wallet.address || balances.aged) return {};
      const inst = instOf(asset);
      const row = rowOf(asset.id);
      let held = row ? T.fromUnits(row.units, row.decimals) : 0;
      if (inst && typeof D.ordered === 'function') D.ordered().filter((h) => h.coin === inst).forEach((h) => { held += h.amount; });
      return Number.isFinite(held) ? { held, heldAt: balances.at } : {};
    } catch (_) {
      return {};
    }
  }
  function rememberCost(rec) {
    const c = rec.cost;
    if (!window.DemoCost || !c) return;
    const gave = T.fromUnits(BigInt(rec.offer.units), rec.offer.decimals);
    const got = T.fromUnits(rec.got ? BigInt(rec.got) : BigInt(rec.ask.expected), rec.ask.decimals);
    const usd = c.offerUsd > 0 ? gave * c.offerUsd : got * (c.askUsd || 0);
    const offer = c.offer || coinIdOf(rec.offer);
    const ask = c.ask || coinIdOf(rec.ask);
    const before = Number.isFinite(c.held) && Number.isFinite(c.heldAt) ? { held: c.held, at: c.heldAt } : undefined;
    if (offer) DemoCost.sold(rec.wallet, offer, gave);
    if (ask) DemoCost.bought(rec.wallet, ask, got, usd, before);
  }
  function marketPrice(asset) {
    const inst = asset.id === NATIVE ? D.byId.ton : asset.id === USDT_RAW ? D.byId.usdt : asset.id === NOT_RAW ? D.byId.not : asset.inst;
    if (!inst || !(inst.price > 0)) return 0;
    return inst.isToken || inst.priced === true ? inst.price : 0;
  }
  const FLOOR_KEPT_MS = 5 * 60 * 1000;
  const tickerPriced = (id) => id === NATIVE || id === USDT_RAW || id === NOT_RAW;
  const freshFloor = (inst) => (inst && inst.floor > 0 && Number.isFinite(inst.floor) && inst.floorAt > 0 && Date.now() - inst.floorAt <= FLOOR_KEPT_MS ? inst.floor : 0);
  const floorInst = (asset) => asset.inst || D.coinOfAddress(asset.id);
  const askedFloors = new Map();
  function floorOf(asset) {
    if (tickerPriced(asset.id)) return marketPrice(asset);
    return freshFloor(floorInst(asset)) || freshFloor(askedFloors.get(asset.id));
  }
  function loadFloors(assets) {
    const asked = new Map();
    assets.forEach((a) => {
      if (tickerPriced(a.id) || floorOf(a) > 0) return;
      const inst = floorInst(a);
      const id = inst ? (inst.isToken ? inst.id : null) : D.tokenIdOf(a.id);
      if (id) asked.set(id, a.id);
    });
    if (!asked.size || !CK.market || CK.market.mode !== 'live') return Promise.resolve();
    return CK.market.tokenPrices(Array.from(asked.keys())).then((rows) => {
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const key = asked.get(row.id);
        if (key && row.floor !== undefined) askedFloors.set(key, { floor: row.floor, floorAt: row.floorAt });
      });
    }).catch(() => null).then(() => undefined);
  }
  function withWorth(b, worth) {
    if (!worth) return;
    const main = document.createElement('span');
    main.textContent = b.textContent;
    const val = document.createElement('span');
    val.className = 'sw-worth-val';
    val.textContent = worth;
    b.classList.add('sw-worth');
    b.replaceChildren(main, val);
  }
  const usdtToPayWith = () => { const r = rowOf(USDT_RAW); return r && r.units > 0n && r.risk !== 'suspicious' ? r : null; };

  if (CK.i18n && typeof CK.i18n.add === 'function') CK.i18n.add({
    'swap.slipOwn': ['Своё', 'Custom', 'Своє', 'Өзім'],
    'swap.slipOwnAria': ['Своё проскальзывание, %', 'Custom slippage, %', 'Своє прослизання, %', 'Өз сырғуыңыз, %'],
    'swapSheet.slipRefused': ['Такое проскальзывание пока недоступно', 'This slippage is not available yet', 'Таке прослизання поки недоступне', 'Мұндай сырғу әзірге қолжетімсіз'],
    'orders.feeValue': ['{pct} + газ {gas}', '{pct} + gas {gas}', '{pct} + газ {gas}', '{pct} + газ {gas}'],
    'route.steps': ['{n} шага через GRAM', '{n} steps via GRAM', '{n} кроки через GRAM', 'GRAM арқылы {n} қадам'],
    'route.step': ['Шаг {i} из {n} · {a} → {b}', 'Step {i} of {n} · {a} → {b}', 'Крок {i} з {n} · {a} → {b}', '{n} қадамның {i}-сі · {a} → {b}'],
    'route.keepOpen': ['Не закрывайте приложение до конца обмена', 'Keep the app open until the swap ends', 'Не закривайте застосунок до кінця обміну', 'Айырбас аяқталғанша қосымшаны жаппаңыз'],
    'route.leftover': ['Остаток на балансе', 'Left in balance', 'Залишок на балансі', 'Баланста қалады'],
    'route.kept': ['Шаг 2 не сделан · {v} на балансе', 'Step 2 not done · {v} in your balance', 'Крок 2 не зроблено · {v} на балансі', '2-қадам жасалмады · {v} балансыңызда'],
    'route.needGram': ['Для обмена через GRAM нужно {sum} на балансе', 'A swap via GRAM needs {sum} in your balance', 'Для обміну через GRAM потрібно {sum} на балансі', 'GRAM арқылы айырбасқа балансыңызда {sum} керек']
  });

  function feeLine(el) {
    const words = tx('common.fee', { sum: '{sum}' }).split('{sum}');
    el.innerHTML = '<span class="sw-fee-pre"></span><span class="sw-fee-val"><i class="skel sw-fee-skel"></i></span><span class="sw-fee-post"></span>';
    $('.sw-fee-pre', el).textContent = words[0] || '';
    $('.sw-fee-post', el).textContent = words.length > 1 ? words.slice(1).join('') : '';
    const val = $('.sw-fee-val', el);
    let shown = '';
    return {
      set(text) {
        if (text === null || text === undefined || text === shown) return;
        shown = text;
        CK.roll(val, text);
      },
      get shown() { return shown; }
    };
  }
  const SKEL = '<i class="skel sw-val-skel" aria-hidden="true"></i>';
  const holdOrSkel = (el) => { if (el && !el.textContent && !el.querySelector('.skel')) el.innerHTML = SKEL; };
  const skelOn = (el) => { if (el && !el.querySelector('.skel')) el.innerHTML = SKEL; };
  const slipPresets = () => (Array.isArray(T.SLIPPAGES) ? T.SLIPPAGES.slice() : cfg.slippages.slice());
  const slipOk = (bps) => (typeof T.slippageOk === 'function' ? T.slippageOk(bps) : cfg.slippages.includes(bps));
  function slipPicker(host, value, presets, own, onChange) {
    const ownMax = typeof own === 'number' && own > 0 ? Math.min(own, T.SLIPPAGE_MAX_BPS || 2000) : own ? T.SLIPPAGE_MAX_BPS || 2000 : 0;
    if (typeof CK.slippagePicker === 'function') {
      return CK.slippagePicker(host, {
        value, presets, max: own ? ownMax : Math.max(...presets), step: 10, ok: (bps) => (own ? slipOk(bps) && bps <= ownMax : presets.includes(bps)), format: pctText,
        label: tx('swap.slippage'), ownLabel: own ? tx('swap.slipOwn') : '', ownAria: tx('swap.slipOwnAria'), onChange
      });
    }
    return CK.segmented(host, { label: tx('swap.slippage'), size: 'small', value: String(value), items: presets.map((bps) => ({ value: String(bps), label: pctText(bps) })), onChange: (v) => onChange(Number(v)) });
  }

  let record = null, pollTimer = 0, holdTimer = 0, active = null, building = false;
  let handing = false, handedResult = null;
  const pendingKey = () => (T.wallet && CK.wallet.wallets.isExtra(T.wallet.address) ? `${PENDING_KEY}:${T.wallet.address}` : PENDING_KEY);
  function saveRecord() {
    if (record) store.set(pendingKey(), JSON.stringify(record));
    else store.del(pendingKey());
  }
  function loadRecord() {
    const text = store.get(pendingKey());
    if (!text) return null;
    try {
      const rec = JSON.parse(text);
      if (rec && typeof rec.wallet === 'string' && typeof rec.phase === 'string' && Number.isInteger(rec.seqno) && Number.isInteger(rec.validUntil) && rec.offer && rec.ask) return rec;
    } catch (_) { }
    store.del(pendingKey());
    return null;
  }
  const isOpenPhase = (phase) => phase === 'sending' || phase === 'unsure' || phase === 'sent';
  const pastValid = (rec, grace) => Math.floor(Date.now() / 1000) > rec.validUntil + grace;

  const explorerLink = (rec) => {
    if (rec && EXPLORER_LINK.test(rec.explorer || '')) return rec.explorer;
    if (rec && rec.hash) return `${EXPLORER}transaction/${rec.hash}`;
    return T.wallet ? EXPLORER + T.wallet.friendly : EXPLORER;
  };

  function finish(phase, patch) {
    if (!record) return;
    Object.assign(record, patch || {}, { phase });
    clearTimeout(pollTimer);
    const done = record;
    record = null;
    saveRecord();
    if (phase === 'success') {
      CK.haptic.success();
      try { rememberCost(done); } catch (e) { console.error(e); }
    } else if (phase === 'failed' || phase === 'rejected') CK.haptic.error();
    else CK.haptic.medium();
    if (active && active.status) paintState(done);
    else if (handing) handedResult = done;
    else if (phase === 'success') CK.toast(tx(doneTitle(done)), { icon: 'check-circle', tone: 'up' });
    else CK.toast(tx(STATES[phase].title), { icon: 'warning', tone: phase === 'failed' || phase === 'rejected' ? 'down' : 'accent' });
    emit();
    loadBalances().then(emit, emit);
  }

  function markSent(rec) {
    rec.phase = 'sent';
    saveRecord();
    if (active && active.status) paintState(rec);
    track();
  }
  function track() {
    clearTimeout(pollTimer);
    if (!record || record.phase !== 'sent') return;
    const rec = record;
    const age = Date.now() - rec.sentAt;
    if (age > GIVE_UP_AFTER_MS) {
      finish('unknown');
      return;
    }
    const again = () => {
      if (record === rec) pollTimer = setTimeout(track, age > SLOW_AFTER_MS ? POLL_SLOW_MS : pollAfter(age));
    };
    T.api('swap/status?hash=' + encodeURIComponent(rec.hash)).then((body) => {
      if (record !== rec) return;
      const status = body.status;
      const got = T.parseUnits(body.outUnits);
      const gave = T.parseUnits(body.offerUnits);
      const amounts = { explorer: typeof body.explorer === 'string' ? body.explorer : '', got: got === null ? '' : got.toString(), gave: gave === null || rec.route ? rec.offer.units : gave.toString() };
      if (status === 'success' || status === 'failed' || status === 'refunded') {
        finish(status, amounts);
        return;
      }
      if (active && active.status && age > SLOW_AFTER_MS && !active.slowShown) {
        active.slowShown = true;
        paintState(rec);
      }
      if (pastValid(rec, EXPIRY_MARGIN_S + LOST_GRACE_S)) {
        T.api('wallet/state?address=' + encodeURIComponent(rec.wallet)).then((chain) => {
          if (record !== rec) return;
          if (chain.seqno === rec.seqno) finish('expired');
          else again();
        }, again);
        return;
      }
      again();
    }, again);
  }
  function settle() {
    clearTimeout(pollTimer);
    const rec = record;
    if (!rec || rec.phase === 'sent') return;
    const again = () => {
      if (record === rec) pollTimer = setTimeout(settle, POLL_MS);
    };
    T.api('wallet/state?address=' + encodeURIComponent(rec.wallet)).then((chain) => {
      if (record !== rec) return undefined;
      if (!Number.isInteger(chain.seqno)) {
        again();
        return undefined;
      }
      if (chain.seqno > rec.seqno) {
        markSent(rec);
        return undefined;
      }
      if (pastValid(rec, EXPIRY_MARGIN_S)) {
        finish('expired');
        return undefined;
      }
      return CK.wallet.resend().then((sent) => {
        if (record !== rec) return;
        if (sent) markSent(rec);
        else again();
      });
    }).catch((err) => {
      if (record !== rec) return;
      if (CK.wallet.neverSent(err)) finish('rejected');
      else again();
    });
  }
  function relay(rec, boc) {
    CK.wallet.broadcast(boc).then((sent) => {
      if (record !== rec) return;
      if (!rec.hash) rec.hash = sent.hash;
      markSent(rec);
    }, (err) => {
      if (record !== rec) return;
      if (CK.wallet.neverSent(err)) {
        console.error(err);
        finish('rejected');
        return;
      }
      rec.phase = 'unsure';
      saveRecord();
      if (active && active.status) paintState(rec);
      settle();
    });
  }
  function resume() {
    const rec = loadRecord();
    if (!rec || record) return;
    if (!sameWallet(rec) || !isOpenPhase(rec.phase)) {
      if (!isOpenPhase(rec.phase) || pastValid(rec, EXPIRY_MARGIN_S + LOST_GRACE_S)) store.del(pendingKey());
      return;
    }
    record = rec;
    if (rec.phase === 'sent') track();
    else settle();
    emit();
    if (!CK.sheet.top) openTrack();
  }

  function stopAfter(side, pair, askId, gramLeft) {
    return side === 'buy' && !pair && !!window.DemoOrders && (DemoOrders.canPlace(askId) || DemoOrders.okLately(askId)) && typeof gramLeft === 'bigint' && gramLeft >= DemoOrders.GRAM_NEEDED;
  }
  const boughtUnits = (rec) => T.parseUnits(rec.got) || T.parseUnits(rec.ask.min) || 0n;
  const keyCanSign = () => {
    const status = (CK.wallet && CK.wallet.status) || {};
    return !status.lost && !status.denied && !status.bioUnknown;
  };
  const canStopNow = (rec) => rec.phase === 'success' && rec.stop === true && !!cfg && sameWallet(rec) && !T.wallet.readOnly && keyCanSign() && Audit.orderOffer(rec.ask.id) && !!window.DemoOrders && boughtUnits(rec) > 0n && orderReady(rec.ask.id, boughtUnits(rec), () => {
    if (active && active.status) paintState(rec);
  });
  function stopStep(rec, mine) {
    const view = STATES[rec.phase] || STATES.unknown;
    if (rec.phase !== 'success') return { step: view.final ? 'off' : 'wait', why: '' };
    const id = rec.ask.id;
    if (!cfg || !sameWallet(rec) || T.wallet.readOnly || !keyCanSign() || !Audit.orderOffer(id) || !window.DemoOrders || boughtUnits(rec) <= 0n) return { step: 'no', why: '' };
    if (DemoOrders.canPlace(id)) return { step: 'go', why: '' };
    const answer = DemoOrders.answer(id);
    if (answer && !answer.ok) {
      const why = DemoOrders.trouble({ code: answer.reason });
      return { step: 'no', why: why.block ? why.key : 'orderErr.noToken' };
    }
    if (mine.stopSilent) return { step: 'no', why: '' };
    if (!mine.stopAsking) {
      mine.stopAsking = true;
      DemoOrders.check(id, boughtUnits(rec)).then((next) => {
        mine.stopAsking = false;
        if (!next) mine.stopSilent = true;
        if (active === mine && active.status) paintState(rec);
      });
    }
    return { step: 'wait', why: '' };
  }
  function orderReady(id, units, then) {
    if (DemoOrders.canPlace(id)) return true;
    DemoOrders.check(id, units).then((answer) => {
      if (answer && answer.ok) then();
    });
    return false;
  }
  function openStop(rec) {
    const id = rec.ask.id;
    const opts = { orders: true, units: boughtUnits(rec) };
    const inst = id === USDT_RAW ? D.byId.usdt : id === NOT_RAW ? D.byId.not : D.coinOfAddress(id);
    if (inst && assetIdOf(inst) === id) open(inst, 'sell', null, null, opts);
    else open(null, 'sell', { id, sym: rec.ask.sym, name: rec.ask.sym, decimals: rec.ask.decimals }, null, opts);
  }

  const STATES = {
    sending: { title: 'swap.sent', text: '', mark: 'spin' },
    sent: { title: 'swap.sent', text: '', mark: 'spin' },
    unsure: { title: 'swapSheet.unsure', text: 'swapSheet.unsureText', mark: 'info', tone: 'hint', hold: true },
    success: { title: 'swap.doneSwap', text: '', mark: 'check-circle', tone: 'up', final: true },
    failed: { title: 'swap.failed', text: 'swap.failedText', mark: 'close-circle', tone: 'down', final: true },
    refunded: { title: 'swap.refunded', text: 'swapSheet.refundedText', mark: 'refresh', tone: 'accent', final: true },
    rejected: { title: 'swapSheet.rejected', text: 'swapSheet.fundsKept', mark: 'close-circle', tone: 'down', final: true },
    expired: { title: 'swapSheet.expired', text: 'swapSheet.fundsKept', mark: 'info', tone: 'hint', final: true },
    unknown: { title: 'swap.unknown', text: 'swap.unknownText', mark: 'info', tone: 'hint', final: true }
  };
  const DONE_TITLE = { buy: 'swap.doneBuy', sell: 'swap.doneSell', swap: 'swap.doneSwap' };
  const doneTitle = (rec) => DONE_TITLE[rec && (rec.kind || (rec.stop === true ? 'buy' : ''))] || DONE_TITLE.swap;

  const RECEIPT = '<div class="sw-receipt" role="status"><span class="sw-receipt-mark"></span><b class="sw-receipt-title"></b><span class="sw-receipt-text"></span><b class="sw-receipt-big"></b><span class="sw-receipt-sub"></span></div>';
  function paintReceipt(box, o) {
    box.dataset.tone = o.tone || 'accent';
    const mark = $('.sw-receipt-mark', box);
    mark.className = `sw-receipt-mark${o.final ? ' receipt-pop' : ''}`;
    mark.innerHTML = o.mark === 'spin' ? '<i class="sw-spin"></i>' : icon(o.mark, { fill: true, size: 40 });
    [['.sw-receipt-title', o.title], ['.sw-receipt-text', o.text], ['.sw-receipt-big', o.big], ['.sw-receipt-sub', o.sub]].forEach(([sel, text]) => {
      const el = $(sel, box);
      el.textContent = text || '';
      el.hidden = !text;
    });
  }
  const moreHtml = (id) => `<button class="fold-toggle sw-more" type="button" aria-expanded="false" aria-controls="${id}" hidden><span>${tx('common.more')}</span>${icon('chevron-down', { size: 16 })}</button><div class="fold-body sw-more-body" id="${id}" hidden></div>`;
  function moreRows(body, mine) {
    const toggle = $('.sw-more', body), box = $('.sw-more-body', body);
    const set = (open) => {
      mine.moreOpen = open;
      toggle.setAttribute('aria-expanded', String(open));
      box.hidden = !open || toggle.hidden;
    };
    toggle.addEventListener('click', () => {
      CK.haptic.selection();
      set(!mine.moreOpen);
      if (mine.moreOpen) reveal(mine.sheet, toggle, box);
    });
    const api = {
      row(label, value) {
        const r = CK.el('<div class="fold-row"><span></span><b></b></div>');
        r.firstElementChild.textContent = label;
        r.lastElementChild.textContent = value;
        box.appendChild(r);
        toggle.hidden = false;
        set(!!mine.moreOpen);
        return r.lastElementChild;
      }
    };
    set(!!mine.moreOpen);
    return api;
  }

  function paintState(rec) {
    if (!active || !active.status) return;
    const { body, sheet } = active;
    const view = STATES[rec.phase] || STATES.unknown;
    clearInterval(holdTimer);
    const slow = rec.phase === 'sent' && Date.now() - rec.sentAt > SLOW_AFTER_MS;
    const got = rec.got ? T.parseUnits(rec.got) : null;
    const gave = BigInt(rec.gave || rec.offer.units);
    const forStop = rec.stop === true && rec.stopNext === true;
    const next = forStop ? stopStep(rec, active) : null;
    const stopNow = rec.stop === true && !forStop && canStopNow(rec);
    const stopMain = !!next && next.step === 'go';
    const stopSlot = !forStop ? `<button class="sw-stop press" type="button"${stopNow ? '' : ' hidden'}>${tx('swap.setStop')}</button>`
      : next.step === 'no' ? `<p class="sw-stop sw-stop--note">${tx('swap.stopLater')}${next.why ? whyButton(next.why) : ''}</p>`
        : `<button class="sw-stop press" type="button" hidden>${tx('swap.setStop')}</button>`;
    body.innerHTML = `
      ${RECEIPT}
      ${rec.stop === true ? stopSlot : ''}
      ${moreHtml(active.moreId)}
      <div class="sw-actions">
        <button class="btn btn--wide press sw-done" type="button"></button>
        <button class="btn btn--tinted press sw-open" type="button" aria-label="${tx('swap.explorer')}" title="${tx('swap.explorer')}">${icon('arrow-up-right', { size: 22 })}</button>
      </div>`;
    let big = '', sub;
    if (rec.phase === 'success') {
      big = got === null ? `≈ +${sig4Sym(BigInt(rec.ask.expected), rec.ask)}` : `+${qtySym(got, rec.ask)}`;
      sub = `−${qtySym(gave, rec.offer)}`;
    } else if (view.final) sub = `${qtySym(BigInt(rec.offer.units), rec.offer)} → ${rec.ask.sym}`;
    else sub = `${qtySym(BigInt(rec.offer.units), rec.offer)} → ≈ ${sig4Sym(BigInt(rec.ask.expected), rec.ask)}`;
    paintReceipt($('.sw-receipt', body), { mark: view.mark, tone: view.tone, final: view.final, title: tx(rec.phase === 'success' ? doneTitle(rec) : view.title), text: view.text ? tx(slow ? 'swap.slow' : view.text) : slow ? tx('swap.slow') : '', big, sub });
    const stopBtn = $('.sw-stop', body);
    if (stopBtn && forStop && next.step === 'no' && next.why) {
      stopBtn.addEventListener('click', (e) => {
        if (!(e && e.target && e.target.closest && e.target.closest('[data-why]'))) return;
        CK.haptic.light();
        CK.toast(tx(next.why), { icon: 'info', tone: 'accent' });
      });
    } else if (stopBtn && stopNow) {
      stopBtn.addEventListener('click', () => {
        CK.haptic.light();
        active.then = () => openStop(rec);
        sheet.close();
      });
    }
    const more = moreRows(body, active);
    if (rec.phase === 'success') {
      if (rec.feeBps > 0) more.row(tx('swap.serviceFee', { pct: pctText(rec.feeBps) }), `≈ ${sig4Sym(BigInt(rec.feeUnits), rec.ask)}`);
      more.row(tx('swap.networkFee'), `≈ ${sig4Sym(BigInt(rec.gasUnits), tonAsset())}`);
      if (rec.venue === 'dedust') more.row(tx('swap.venue'), 'DeDust');
    } else if (!view.final) {
      more.row(tx('swap.min'), sig4Sym(BigInt(rec.ask.min), rec.ask, true));
    }
    if (view.hold) {
      const clock = more.row(tx('swap.holdLeft'), '');
      const tick = () => {
        if (!clock.isConnected) {
          clearInterval(holdTimer);
          return;
        }
        const left = Math.max(0, rec.validUntil + EXPIRY_MARGIN_S - Math.floor(Date.now() / 1000));
        clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      };
      tick();
      holdTimer = setInterval(tick, 1000);
    }
    const done = $('.sw-done', body);
    const stopWaits = !!next && next.step === 'wait';
    if (stopWaits) done.innerHTML = `<span>${tx('swap.setStop')}</span><i class="sw-spin sw-spin--small" aria-hidden="true"></i>`;
    else done.textContent = tx(stopMain ? 'swap.setStop' : next ? 'common.done' : view.final ? 'common.done' : 'nav.close');
    done.disabled = stopWaits;
    if (stopWaits) done.setAttribute('aria-busy', 'true');
    done.classList.toggle('btn--tinted', next ? false : !view.final);
    if (next && active.stopStep && active.stopStep !== next.step && !CK.reducedMotion() && typeof done.animate === 'function') done.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 200, easing: 'ease' });
    if (next) active.stopStep = next.step;
    done.addEventListener('click', () => {
      if (stopMain) {
        CK.haptic.light();
        active.then = () => openStop(rec);
      }
      sheet.close();
    });
    const link = $('.sw-open', body);
    link.hidden = !rec.hash;
    link.addEventListener('click', () => T.openLink(explorerLink(rec)));
    if (active.moreOpen) reveal(sheet, $('.sw-more', body), $('.sw-more-body', body));
    if (active.phase && active.phase !== rec.phase && CK.motion && typeof CK.motion.blocks === 'function') CK.motion.blocks($('.sw-receipt', body), { force: true });
    active.phase = rec.phase;
  }
  function openTrack(result) {
    const shown = result || record;
    if (CK.sheet.top || !shown) return;
    let mine = null;
    CK.sheet.open({
      title: tx('swap.sent'),
      detents: ['fit'],
      onClose() {
        clearInterval(holdTimer);
        if (active === mine) active = null;
        if (mine && mine.then) mine.then();
      },
      build(body, sheet) {
        mine = { body, sheet, status: true, moreId: foldId('more'), moreOpen: false };
        active = mine;
        body.classList.add('sw-status', 'sw-status--receipt');
        sheet.el.classList.add('sw-receipt-sheet');
        $('.sheet-title', sheet.el).textContent = '';
        paintState(shown);
        pinHeight(this, sheet);
      }
    });
  }

  function cleanQuote(body, wallet, asked) {
    const quoteId = body.quoteId;
    const offer = asked.offer;
    const expectedOut = T.parseUnits(body.expectedOut);
    const minOut = T.parseUnits(body.minOut);
    const feeUnits = T.parseUnits(body.feeUnits);
    const gasUnits = T.parseUnits(body.gasUnits);
    const estimate = T.parseUnits(body.gasEstimate);
    const units = T.parseUnits(body.units);
    const impact = Number(body.priceImpact) * 100;
    const expiresAt = Number(body.expiresAt) * 1000;
    const routers = Array.isArray(body.routers) ? body.routers.map(T.rawAddress) : [];
    if (typeof quoteId !== 'string' || !quoteId || expectedOut === null || minOut === null || feeUnits === null || gasUnits === null || units === null) return null;
    if (!Number.isFinite(impact) || !(expiresAt > Date.now()) || routers.length !== 2 || !routers[1] || !Number.isInteger(body.askDecimals) || body.askDecimals < 0 || body.askDecimals > 30) return null;
    const known = knownDecimals(asked.ask);
    if (known !== null && body.askDecimals !== known) return null;
    if (body.feeBps !== T.FEE_BPS && body.feeBps !== 0) return null;
    const venue = body.venue === undefined ? 'stonfi' : body.venue;
    if (venue !== 'stonfi' && venue !== 'dedust') return null;
    if (venue === 'dedust' && (body.feeBps !== 0 || asked.ask !== NATIVE || offer === NATIVE)) return null;
    if (units !== asked.units || body.slippageBps !== asked.slippageBps || !sameAsset(body.offer, offer) || !sameAsset(body.ask, asked.ask)) return null;
    if (minOut <= 0n || minOut !== expectedOut * BigInt(10000 - asked.slippageBps) / 10000n) return null;
    return { quoteId, expectedOut, minOut, feeUnits, feeBps: body.feeBps, gasUnits, networkFee: estimate ? estimate : gasUnits, attached: gasUnits + (offer === NATIVE ? units : 0n), impact, expiresAt, destination: routers[1], askDecimals: body.askDecimals, wallet, venue };
  }

  function feeSumOf(q, to) {
    const gram = tonAsset();
    const ask = { decimals: q.askDecimals, sym: to.sym };
    const askUsd = marketPrice(to), gramUsd = marketPrice(gram);
    const ours = T.fromUnits(q.feeUnits, q.askDecimals), net = T.fromUnits(q.networkFee, TON_DECIMALS);
    if ((q.feeUnits === 0n || askUsd > 0) && gramUsd > 0) return feeMoney(ours * askUsd + net * gramUsd);
    if (q.feeUnits === 0n || to.id === NATIVE) return sig4Sym(q.networkFee + (to.id === NATIVE ? q.feeUnits : 0n), gram);
    return `${sig4Sym(q.feeUnits, ask)} + ${sig4Sym(q.networkFee, gram)}`;
  }
  async function floorCheck(leg, q) {
    const { from, to, units } = leg;
    const known = knownDecimals(to.id);
    const toRow = rowOf(to.id);
    const floorDecimals = known !== null ? known : toRow ? toRow.decimals : q.askDecimals;
    if (!(floorOf(from) > 0) || !(floorOf(to) > 0)) {
      await loadFloors([from, to]);
      if ((!tickerPriced(from.id) && !(floorOf(from) > 0)) || (!tickerPriced(to.id) && !(floorOf(to) > 0))) return { key: 'alerts.noPrice' };
    }
    if (Audit.belowMarket({ units, offerDecimals: from.decimals, offerPrice: floorOf(from), out: q.expectedOut, askDecimals: floorDecimals, askPrice: floorOf(to), feeBps: q.feeBps, offer: from.id, ask: to.id })) return { key: 'swap.belowMarket', block: true };
    return null;
  }
  const noWorse = (was, now) => !!was && !!now && now.minOut >= was.minOut && now.feeUnits <= was.feeUnits && now.feeBps === was.feeBps && now.networkFee <= was.networkFee
    && now.attached <= was.attached && now.venue === was.venue && now.destination === was.destination;

  const QUOTE_ERRORS = {
    no_liquidity: 'swapSheet.noPool', router_unknown: 'swapSheet.noPool', no_price: 'swapSheet.noPool',
    over_limit: 'swap.quoteLimit', token_suspicious: 'swap.refusedToken', insufficient_gas: 'swap.noGasShort', insufficient_balance: 'order.notHeld', impact_over_limit: 'swap.impactTooHigh', fee_rounding: 'swap.tooSmall',
    slippage_over_limit: 'swapSheet.slipRefused'
  };
  const SIGN_ERRORS = {
    insufficient_gas: 'swap.noGasShort', frozen: 'swapSheet.frozen', pending: 'swapSheet.pendingLock', busy: 'swapSheet.pendingLock',
    biometric_denied: 'swapSheet.bioDenied', biometric_lost: 'swapSheet.bioLost', no_secret: 'swapSheet.noSign', no_secure_storage: 'swapSheet.noSign', password_needed: 'swapSheet.noSign',
    bad_intent: 'swapSheet.stopped', bad_address: 'swapSheet.stopped', address_mismatch: 'swapSheet.stopped', swap_refused: 'swapSheet.stopped', biometric_unknown: 'wallet.bioWait',
    wallet_changed: 'swapSheet.stopped'
  };

  function open(inst, side, fromAsset, toAsset, opts) {
    if (CK.sheet.top || !cfg || !T.wallet || T.wallet.readOnly) return;
    if (record) {
      openTrack();
      return;
    }
    const id = inst ? assetIdOf(inst) : null;
    if (inst && !id) return;
    const token = fromAsset || { id, sym: inst.sym, name: inst.name, inst, decimals: knownDecimals(id) || 0 };
    const st = { side: side === 'sell' || !inst ? 'sell' : 'buy', units: 0n, pct: 0, slippageBps: cfg.slippageBps, quote: null, estimate: null, loading: false, trouble: null, sending: false, payWith: NATIVE, note: '', walletAt: T.wallet ? T.wallet.address : null, quote2: null, units2: 0n };
    const via = !!(opts && opts.via) && !!toAsset && (fromAsset || {}).id !== NATIVE && toAsset.id !== NATIVE && typeof CK.wallet.signRoute === 'function';
    const decimalsOf = (asset) => {
      const known = knownDecimals(asset.id);
      if (known !== null) return known;
      const row = rowOf(asset.id);
      return row ? row.decimals : asset.decimals;
    };
    const pairOf = () => {
      if (st.side === 'sell') return { from: { ...token, decimals: decimalsOf(token) }, to: toAsset || (token.id === NATIVE ? usdtAsset() : tonAsset()) };
      const payUsdt = token.id === NATIVE || (token.id !== USDT_RAW && st.payWith === USDT_RAW);
      return { from: payUsdt ? usdtAsset() : tonAsset(), to: token };
    };
    const pairProven = () => { const { from, to } = pairOf(); return (Audit.swappable(from.id) || sellable(from.id)) && Audit.swappable(to.id); };
    const orderable = st.side === 'sell' && !toAsset && token.id !== NATIVE && !!window.DemoOrders && Audit.orderOffer(token.id) && DemoOrders.canPlace(token.id);
    const NO_ORDER_POOL = new Set(['pool_unsupported', 'no_gram_pool', 'router_unknown', 'no_liquidity', 'no_price', 'order_token_unlisted', 'order_too_small', 'order_token_closed', 'order_gas']);
    const forOrder = !!(opts && opts.orders) && st.side === 'sell' && !toAsset && token.id !== NATIVE && !!window.DemoOrders && Audit.orderOffer(token.id);
    const rowsHere = orderable || forOrder;
    const orderCap = () => (rowsHere ? DemoOrders.maxUnits(token.id) : null);
    const stopNext = st.side === 'buy' && !toAsset && !!(opts && opts.stopNext) && !!window.DemoOrders && Audit.orderOffer(token.id) && token.id !== USDT_RAW;
    const stopAsked = st.side === 'buy' && !toAsset && !!window.DemoOrders && token.id !== NATIVE && DemoOrders.asked(token.id);
    let orderRows = null, afterClose = null, rowsWhy = '';
    let timer = 0, abort = null, gen = 0, quoteTimer = 0, buildTimer = 0, mine = null, passDone = null, balanceTryAt = 0;
    let boughtWait = null, boughtLooks = 0, boughtTimer = 0;
    const kept = new Map();
    let anchor = null, askedAhead = '', askedAt = 0;
    let netSeen = null, aheadBusy = 0, aheadRounds = 0;
    const stopQuotes = () => {
      clearTimeout(quoteTimer);
      clearTimeout(buildTimer);
      gen++;
      if (abort) abort.abort();
    };
    const onVisible = () => {
      if (!document.hidden && !st.sending) refreshQuote();
    };
    let refreshQuote = () => {};

    CK.sheet.open({
      title: tx('order.title'),
      detents: ['fit'],
      onClose() {
        mine.dispose();
        if (inst && window.DemoTrade) DemoTrade.unwatch(inst);
        if (active === mine) active = null;
        if (afterClose) afterClose();
        if (handing) {
          const result = handedResult;
          handing = false;
          handedResult = null;
          openTrack(result);
        }
      },
      build(body, sheet) {
        mine = { body, sheet };
        active = mine;
        const closing = () => active !== mine || sheet.el.hasAttribute('inert');
        const headTitle = toAsset ? `${token.sym} → ${toAsset.sym}` : forOrder ? (token.id === USDT_RAW ? tx('orders.gramLimit', { sym: D.byId.ton.sym }) : tx('orders.stop')) : tx(st.side === 'buy' ? 'swapSheet.buyTitle' : 'swapSheet.sellTitle', { sym: token.sym });
        const head = CK.el(`<div class="tk-sheet-token">${logoOf(token, 36)}<span class="tk-sheet-name"><b></b>${via ? '<span class="sw-route-note"></span>' : ''}</span></div>`);
        $('.tk-sheet-name b', head).textContent = headTitle;
        if (via) $('.sw-route-note', head).textContent = tx('route.steps', { n: 2 });
        $('.sheet-title', sheet.el).replaceWith(head);
        if (inst && window.DemoTrade) DemoTrade.watch(inst);

        body.classList.add('tk-order', 'sw-order', 'sw-min');
        sheet.el.classList.add('sw-form-sheet');
        const moreId = foldId('more');
        const ordersLabel = token.id === USDT_RAW ? tx('orders.gramLimit', { sym: D.byId.ton.sym }) : `${tx('orders.stop')} / ${tx('orders.take')}`;
        const ordersOut = forOrder;
        const orderBlock = rowsHere ? `<div class="or-fold${ordersOut ? ' or-fold--out' : ''}">${ordersOut ? '' : `<p class="sw-more-label">${ordersLabel}</p>`}<div class="or-rows"></div></div>` : '';
        body.innerHTML = `
          <div class="w-card sw-card">
            <div class="w-card-top sw-card-top"><button class="sw-max press" type="button" aria-label="${tx('common.max')}" disabled>${icon('wallet', { size: 14 })}<b class="sw-balance">${SKEL}</b></button></div>
            <div class="w-card-main"><button class="w-token press sw-from" type="button"></button><input class="w-amt sw-amount" inputmode="decimal" autocomplete="off" placeholder="0" aria-label="${tx('common.amount')}"></div>
          </div>
          <div class="sw-sum">
            <p class="sw-get"><span class="sw-get-label">${tx('swapSheet.youGet')}</span><b class="sw-out"><span class="sw-out-main"><span class="sw-out-num"></span><span class="sw-out-sym"></span></span><span class="sw-out-val"></span></b></p>
            <p class="sw-fee-line"></p>
          </div>
          ${ordersOut ? orderBlock : ''}
          <button class="fold-toggle sw-more sw-more--form" type="button" aria-expanded="false" aria-controls="${moreId}"><span>${tx('common.more')}</span>${icon('chevron-down', { size: 16 })}</button>
          <div class="fold-body sw-more-body sw-more-form" id="${moreId}" hidden>
            <div class="tk-order-slider"></div>
            <div class="fold-row sw-fee-ours"><span class="sw-fee-pct">${tx('swap.serviceFee', { pct: pctText(T.FEE_BPS) })}</span><b class="sw-fee-cost">${SKEL}</b></div>
            <div class="fold-row sw-fee-netrow"><span>${tx('swap.networkFee')}</span><b class="sw-fee-net">${SKEL}</b></div>
            <div class="fold-row sw-fee-minrow"><span>${tx('swap.min')}</span><b class="sw-fee-min">${SKEL}</b></div>
            ${via ? `<div class="fold-row sw-route-leftrow"><span>${tx('route.leftover')}</span><b class="sw-route-left">${SKEL}</b></div>` : ''}
            ${rowsHere ? `<div class="fold-row sw-or-gas" hidden><span>${tx('orders.gas')}</span><b>${qtySym(DemoOrders.GAS_ON_ORDER || 0n, tonAsset())}</b></div><div class="sw-term or-term" hidden><span>${tx('orders.now')}</span></div>` : ''}
            <div class="sw-slip-row"><span>${tx('swap.slippage')}</span><div class="sw-slip"></div></div>
            ${ordersOut ? '' : orderBlock}
          </div>`;
        const input = $('.sw-amount', body);
        const out = $('.sw-out', body);
        const outNum = $('.sw-out-num', body);
        const outSym = $('.sw-out-sym', body);
        const outVal = $('.sw-out-val', body);
        const feeText = feeLine($('.sw-fee-line', body));
        const feeMin = $('.sw-fee-min', body);
        const feeCost = $('.sw-fee-cost', body);
        const feeNet = $('.sw-fee-net', body);
        const feePct = $('.sw-fee-pct', body);
        const maxBtn = $('.sw-max', body);
        const moreToggle = $('.sw-more', body), moreBox = $('.sw-more-body', body);
        const fold = (toggle, box, open) => {
          toggle.setAttribute('aria-expanded', String(open));
          box.hidden = !open;
          if (open) reveal(sheet, toggle, box);
        };
        moreToggle.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          CK.haptic.selection();
          fold(moreToggle, moreBox, moreBox.hidden);
        });
        edgeFade(body);
        const dock = CK.el(`<div class="sheet-dock sw-dock">
          <p class="sw-line" role="status"></p>
          <div class="tk-swipe"></div>
          <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
        </div>`);
        sheet.el.appendChild(dock);
        const lineEl = $('.sw-line', dock);
        const swipeHost = $('.tk-swipe', dock);
        const passBox = $('.sw-pass', dock);
        const passInput = $('.sw-pass-input', dock);
        const swipe = CK.swipeConfirm(swipeHost, { tone: toAsset ? 'accent' : st.side, label: '', onConfirm: confirm, resetAfter: 60000, reportsOwnResult: true });
        passBox.addEventListener('submit', (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });
        lineEl.addEventListener('click', (e) => {
          const why = e.target.closest && e.target.closest('[data-why]');
          if (!why) return;
          CK.haptic.light();
          CK.toast(tx(why.dataset.why), { icon: 'info', tone: 'accent' });
        });

        const maxUnits = () => {
          const { from } = pairOf();
          const have = unitsOf(from.id);
          if (from.id !== NATIVE) return have;
          const kept = GAS_RESERVE + (stopNext ? DemoOrders.GRAM_NEEDED : 0n);
          return have > kept ? have - kept : 0n;
        };
        const stopGasLine = (sum) => ({ key: 'swap.stopGas', params: { sum: qtySym(sum, tonAsset()) } });
        const stopLine = (to, q) => {
          const answer = DemoOrders.answer(token.id);
          if (answer && !answer.ok) return { key: 'swap.stopLater' };
          const cap = DemoOrders.maxUnits(token.id);
          if (q && cap !== null && q.expectedOut > cap) {
            const out = DemoOrders.maxOut(token.id);
            return { key: 'swap.stopCap', params: { sum: out ? qtySym(out, tonAsset()) : `${unitsText(shortDown(cap), to.decimals)} ${to.sym}` } };
          }
          return { key: 'swap.stopNext' };
        };
        let stopSeen;
        const askStop = () => {
          if (!stopAsked) return;
          DemoOrders.check(token.id, 0n).then((answer) => {
            if (answer === stopSeen) return;
            stopSeen = answer;
            if (stopNext && !st.sending && !closing()) paint();
          });
        };
        const usdOf = (from, units) => {
          const amount = T.fromUnits(units, from.decimals);
          const row = rowOf(from.id);
          if (row && row.usd !== null && row.units > 0n) return amount * row.usd / T.fromUnits(row.units, row.decimals);
          if (from.id === NATIVE) return amount * D.byId.ton.price;
          return from.inst && from.inst.price > 0 ? amount * from.inst.price : null;
        };
        const builtOld = (q) => !!q.ahead && Date.now() - q.ahead.at > BUILT_MAX_AGE_MS;
        const freshOne = (q) => !!q && q.expiresAt - Date.now() > QUOTE_MIN_LEFT_MS && !builtOld(q);
        const fresh = () => freshOne(st.quote) && (!via || (freshOne(st.quote2) && st.units2 > 0n));
        const pairKey = (from, to) => `${from.id}>${to.id}`;
        const keepKey = (from, to, units) => `${pairKey(from, to)}/${units}/${st.slippageBps}`;
        function learn(q, from, to, units) {
          if (kept.size >= QUOTES_KEPT) kept.delete(kept.keys().next().value);
          kept.set(keepKey(from, to, units), q);
          anchor = { pair: pairKey(from, to), units: Number(units), out: T.fromUnits(q.expectedOut, q.askDecimals), impact: q.impact / 100 };
          netSeen = { pair: pairKey(from, to), units: q.networkFee };
        }
        const netOf = (from, to) => (netSeen && netSeen.pair === pairKey(from, to) ? netSeen.units : null);
        function estimateOut(from, to) {
          if (!anchor || anchor.pair !== pairKey(from, to) || st.units <= 0n) return null;
          const units = Number(st.units);
          const rate = anchor.out / anchor.units;
          if (!(anchor.impact > 0.0001 && anchor.impact < 0.9)) return rate * units;
          const depth = anchor.units * (1 - anchor.impact) / anchor.impact;
          return rate * units * (1 + anchor.units / depth) / (1 + units / depth);
        }
        const balanceRead = () => !!balances && boughtWait === null;
        const overBalance = () => balanceRead() && st.units > maxUnits();
        const overCap = () => overCap.of(pairOf().from, st.units);
        overCap.of = (from, units) => {
          const usd = usdOf(from, units);
          const cap = Audit.unitCap(from.id);
          return (usd !== null && usd > cfg.maxUsd) || (cap !== undefined && units > cap);
        };

        function paintTokens(flip) {
          const { from } = pairOf();
          const canPayOther = st.side === 'buy' && token.id !== USDT_RAW && token.id !== NATIVE && !!usdtToPayWith();
          const btn = $('.sw-from', body);
          btn.innerHTML = `${logoOf(from, 28)}<b></b>`;
          $(':scope > b', btn).textContent = from.sym;
          btn.disabled = !canPayOther;
          if (canPayOther) btn.setAttribute('aria-label', tx('swapSheet.payWith', { sym: from.sym }));
          else btn.removeAttribute('aria-label');
          if (flip) flipIn(btn);
        }
        function setLine(key, params, tone) {
          const text = key ? tx(key, params) : '';
          const why = key ? WHY[key] || '' : '';
          if (lineEl.dataset.shape !== `${text}|${why}`) {
            lineEl.dataset.shape = `${text}|${why}`;
            lineEl.textContent = text;
            if (why) lineEl.appendChild(CK.el(whyButton(why)));
          }
          lineEl.dataset.tone = tone || 'bad';
        }
        const flooredPairs = new Set();
        function lossOf(from, to, q) {
          if (!(floorOf(from) > 0) || !(floorOf(to) > 0)) {
            const key = `${from.id}>${to.id}`;
            if (!flooredPairs.has(key)) {
              flooredPairs.add(key);
              loadFloors([from, to]).then(() => { if (!closing()) paint(); });
            }
            return null;
          }
          const known = knownDecimals(to.id);
          const toRow = rowOf(to.id);
          return marketLossPct({ units: st.units, offerDecimals: from.decimals, offerPrice: floorOf(from), out: q.expectedOut, askDecimals: known !== null ? known : toRow ? toRow.decimals : q.askDecimals, askPrice: floorOf(to) });
        }
        let shownFor = 0n, wasPlacing = false;
        const orderGas = () => qtySym(window.DemoOrders && DemoOrders.GAS_ON_ORDER ? DemoOrders.GAS_ON_ORDER : 0n, tonAsset());
        function routeFeeOf(q1, q2, to) {
          const gram = tonAsset();
          const gramUsd = marketPrice(gram), toUsd = marketPrice(to);
          const net = q1.networkFee + q2.networkFee;
          const ours1 = q1.feeUnits, ours2 = q2.feeUnits;
          if (gramUsd > 0 && (ours2 === 0n || toUsd > 0)) return feeMoney(T.fromUnits(net + ours1, TON_DECIMALS) * gramUsd + T.fromUnits(ours2, q2.askDecimals) * toUsd);
          return ours2 === 0n ? sig4Sym(net + ours1, gram) : `${sig4Sym(net + ours1, gram)} + ${sig4Sym(ours2, { decimals: q2.askDecimals, sym: to.sym })}`;
        }
        const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
        const zeroOf = (asset) => qtySym(0n, asset);
        let idleOut = false, idleRows = false;
        function paintIdle(from, to, ours) {
          CK.roll(outNum, D.qty(0));
          outSym.textContent = ` ${to.sym}`;
          CK.roll(outVal, '');
          shownFor = 0n;
          idleOut = true;
          feeText.set(pctText(ours));
        }
        function dimFigures(typing, unanswered) {
          [out, $('.sw-fee-line', body), moreBox].forEach((el) => {
            el.classList.toggle('is-loading', typing);
            el.classList.toggle('is-void', !typing && unanswered);
          });
        }
        function waitIdle() {
          if (idleOut) {
            idleOut = false;
            outNum.removeAttribute('aria-label');
            outNum.innerHTML = SKEL;
            outSym.textContent = '';
            CK.roll(outVal, '');
          }
          if (idleRows) {
            idleRows = false;
            [feeCost, feeMin, $('.sw-route-left', body)].forEach(skelOn);
          }
        }
        function paintIdleRows(from, to, ours) {
          idleRows = true;
          setText(feePct, tx('swap.serviceFee', { pct: pctText(ours) }));
          setText(feeCost, zeroOf(to));
          const net = netOf(from, to);
          if (net !== null) setText(feeNet, `≈ ${sig4Sym(net, tonAsset())}`);
          else if (aheadBusy || !balanceRead()) holdOrSkel(feeNet);
          else setText(feeNet, zeroOf(tonAsset()));
          setText(feeMin, zeroOf(to));
          const leftEl = $('.sw-route-left', body);
          if (leftEl) setText(leftEl, zeroOf(tonAsset()));
        }
        function paintRoute(from, to) {
          const q1 = st.quote, q2 = st.quote2;
          const leftEl = $('.sw-route-left', body);
          if (q1 && q2) {
            const amount = T.fromUnits(q2.expectedOut, q2.askDecimals);
            CK.roll(outNum, `≈ ${sig4(amount)}`);
            outSym.textContent = ` ${to.sym}`;
            CK.roll(outVal, worthText(to, amount));
            shownFor = st.units;
            feeText.set(routeFeeOf(q1, q2, to));
            const ask = { decimals: q2.askDecimals, sym: to.sym };
            setText(feePct, tx('swap.serviceFee', { pct: pctText(q1.feeBps + q2.feeBps) }));
            const gramUsd = marketPrice(tonAsset()), toUsd = marketPrice(to);
            setText(feeCost, gramUsd > 0 && (q2.feeUnits === 0n || toUsd > 0) ? `≈ ${feeMoney(T.fromUnits(q1.feeUnits, TON_DECIMALS) * gramUsd + T.fromUnits(q2.feeUnits, q2.askDecimals) * toUsd)}` : `≈ ${sig4Sym(q1.feeUnits, tonAsset())} + ${sig4Sym(q2.feeUnits, ask)}`);
            setText(feeNet, `≈ ${sig4Sym(q1.networkFee + q2.networkFee, tonAsset())}`);
            setText(feeMin, sig4Sym(q2.minOut, ask, true));
            if (leftEl) setText(leftEl, `≈ ${sig4Sym(q1.expectedOut > st.units2 ? q1.expectedOut - st.units2 : 0n, tonAsset())}`);
            idleOut = idleRows = false;
          } else if (st.loading && st.estimate > 0) {
            CK.roll(outNum, `≈ ${sig4(st.estimate)}`);
            outSym.textContent = ` ${to.sym}`;
            CK.roll(outVal, worthText(to, st.estimate));
            idleOut = false;
            waitIdle();
          } else if (!st.loading) {
            paintIdle(from, to, 2 * T.FEE_BPS);
            paintIdleRows(from, to, 2 * T.FEE_BPS);
          } else waitIdle();
          const typing = st.units > 0n && st.units !== shownFor && st.loading;
          dimFigures(typing, st.units > 0n && !st.loading && !(q1 && q2));
        }
        function paintFigures(from, to, q, placing) {
          if (via) {
            paintRoute(from, to);
            return;
          }
          if (placing) {
            const text = orderRows.outText();
            if (text || !st.loading) {
              CK.roll(outNum, text || D.qty(0));
              outSym.textContent = ` ${to.sym}`;
              CK.roll(outVal, text ? worthText(to, orderRows.outGram()) : '');
              if (text) shownFor = st.units;
            }
          } else if (q) {
            const amount = T.fromUnits(q.expectedOut, q.askDecimals);
            CK.roll(outNum, `≈ ${sig4(amount)}`);
            outSym.textContent = ` ${to.sym}`;
            CK.roll(outVal, worthText(to, amount));
            shownFor = st.units;
            idleOut = false;
          } else if (st.loading && st.estimate > 0) {
            CK.roll(outNum, `≈ ${sig4(st.estimate)}`);
            outSym.textContent = ` ${to.sym}`;
            CK.roll(outVal, worthText(to, st.estimate));
            idleOut = false;
          } else if (!st.loading) paintIdle(from, to, T.FEE_BPS);
          const typing = st.units > 0n && st.units !== shownFor && st.loading;
          dimFigures(typing, st.units > 0n && !st.loading && !q && !placing);
          if (placing) feeText.set(tx('orders.feeValue', { pct: pctText(T.FEE_BPS), gas: orderGas() }));
          else if (q) feeText.set(feeSumOf(q, to));
          if (q && !placing) {
            const ask = { decimals: q.askDecimals, sym: to.sym };
            setText(feePct, tx('swap.serviceFee', { pct: pctText(q.feeBps) }));
            setText(feeCost, q.feeBps > 0 ? `≈ ${sig4Sym(q.feeUnits, ask)}` : '0');
            setText(feeNet, `≈ ${sig4Sym(q.networkFee, tonAsset())}`);
            setText(feeMin, sig4Sym(q.minOut, ask, true));
            idleRows = false;
          } else if (placing || !st.loading) paintIdleRows(from, to, T.FEE_BPS);
          else waitIdle();
          if (placing) setText(feeNet, `≈ ${sig4Sym(DemoOrders.GRAM_NEEDED - SWAP_RESERVE - DemoOrders.GAS_ON_ORDER + PLACE_MESSAGE_FEE, tonAsset())}`);
          if (placing !== wasPlacing) {
            wasPlacing = placing;
            ['.sw-fee-ours', '.sw-fee-minrow', '.sw-slip-row'].forEach((sel) => { $(sel, body).hidden = placing; });
            const gas = $('.sw-or-gas', body);
            if (gas) gas.hidden = !placing;
          }
        }
        function paint() {
          const { from, to } = pairOf();
          const q = st.quote;
          const row = rowOf(from.id);
          const placing = !!orderRows && orderRows.active();
          if (orderRows) orderRows.paint();
          askStop();
          const known = !balances && from.id === token.id && typeof token.units === 'bigint' && token.units > 0n ? token.units : null;
          const balanceEl = $('.sw-balance', body);
          if (balanceRead() || known !== null) setText(balanceEl, qtySym(balanceRead() ? (row ? row.units : 0n) : known, from));
          else skelOn(balanceEl);
          maxBtn.disabled = !balanceRead() || maxUnits() <= 0n || st.sending;
          if (!st.sending) paintFigures(from, to, q, placing);
          $('.tk-order-slider', body).classList.toggle('is-empty', balanceRead() && maxUnits() <= 0n);

          let line = st.trouble, blocked = !!(st.trouble && st.trouble.block);
          const lossQ = via ? (st.quote2 ? { expectedOut: st.quote2.expectedOut, askDecimals: st.quote2.askDecimals } : null) : q;
          if (!pairProven()) {
            line = { key: 'swap.refusedToken' };
            blocked = true;
          }
          if (!line && st.units <= 0n && from.id === NATIVE && unitsOf(NATIVE) > 0n && maxUnits() <= 0n) line = stopNext ? stopGasLine(GAS_RESERVE + DemoOrders.GRAM_NEEDED) : { key: 'swap.noGasShort' };
          if (st.units > 0n && !blocked) {
            if (overBalance()) {
              line = st.units > unitsOf(from.id) ? { key: 'walletFlow.overBalance' } : stopNext && from.id === NATIVE ? stopGasLine(GAS_RESERVE + DemoOrders.GRAM_NEEDED) : { key: 'swap.noGasShort' };
              blocked = true;
            } else if (overCap()) {
              line = { key: 'swap.limit', params: { sum: fmt.usd(cfg.maxUsd) } };
              blocked = true;
            } else if (placing) {
              const cap = orderCap();
              const problem = cap !== null && st.units > cap ? { key: 'orders.maxUnits', params: { max: unitsText(shortDown(cap), from.decimals), sym: from.sym } } : orderRows.problem(unitsOf(NATIVE));
              if (problem) {
                line = problem;
                blocked = true;
              }
            } else if (q && unitsOf(NATIVE) < q.attached + SWAP_RESERVE + (via ? TWO_STEP_FEE_ROOM : 0n)) {
              line = { key: 'swap.noGas', params: { sum: qtySym(q.attached + SWAP_RESERVE + (via ? TWO_STEP_FEE_ROOM : 0n), tonAsset()) } };
              blocked = true;
            } else if (stopNext && q && unitsOf(NATIVE) - q.attached < DemoOrders.GRAM_NEEDED) {
              line = stopGasLine(from.id === NATIVE ? GAS_RESERVE + DemoOrders.GRAM_NEEDED : q.attached + DemoOrders.GRAM_NEEDED);
              blocked = true;
            } else if (via && q && !st.quote2 && !st.loading && !line) {
              const per = Number(q.minOut) / Number(st.units);
              const least = per > 0 ? BigInt(Math.ceil(Number(q.attached + TWO_STEP_FEE_ROOM + 300000000n + SWAP_RESERVE) / per * 1.1)) : 0n;
              line = least > 0n ? { key: 'swap.tooSmallFrom', params: { sum: qtySym(least, from) } } : { key: 'swap.tooSmall' };
              blocked = true;
            } else if (!line && lossQ && lossOf(from, to, lossQ) > MARKET_WARN_PCT) {
              line = { key: 'swapSheet.belowMarketBy', params: { pct: `${fmt.num(lossOf(from, to, lossQ), 1)}${CK.i18n.lang === 'en' ? '' : '\u00a0'}%` } };
            } else if (!line && q && q.impact > IMPACT_WARN_PCT) {
              line = { key: 'swapSheet.impact', params: { pct: `${fmt.num(q.impact, 1)}${CK.i18n.lang === 'en' ? '' : '\u00a0'}%` } };
            }
          }
          if (st.note) setLine(st.note.key || st.note, st.note.params || null, 'note');
          else if (line) setLine(line.key, line.params, line.tone);
          else if ([from, to].some((a) => a && a.inst && a.inst.token && a.inst.token.unverified)) setLine('swapSheet.unverified', null, 'warn');
          else if (placing) setLine('orders.lineShort', null, 'note');
          else if (orderRows && orderRows.unavailable() && (forOrder || unitsOf(token.id) > 0n)) setLine(rowsWhy || 'orderErr.noToken', null, 'note');
          else if (stopNext) {
            const last = stopLine(to, q);
            setLine(last.key, last.params || null, 'note');
          } else setLine('');

          const pick = forOrder && !!orderRows && !placing;
          const ready = balanceRead() && st.units > 0n && !blocked && fresh() && !pick;
          let label = st.side === 'buy' ? 'swapSheet.swipeBuy' : toAsset ? 'swapSheet.swipeSwap' : placing || pick ? 'orders.swipe' : 'swapSheet.swipeSell';
          if (!balanceRead()) label = 'swap.waitBalance';
          else if (st.units <= 0n && maxUnits() <= 0n) label = from.id === token.id ? 'order.notHeld' : 'swapSheet.noPay';
          else if (st.units <= 0n) label = 'order.needAmount';
          else if (pick) label = orderRows.unavailable() || orderRows.waiting() ? 'orders.swipe' : 'orders.pickLevel';
          else if (!blocked && !fresh()) label = 'swap.waitQuote';
          swipe.setDisabled(!ready || st.sending);
          swipe.update({ label: tx(label, { sym: from.sym }), tone: toAsset || placing || pick ? 'accent' : st.side });
        }

        function routeUnits(q1, gas2) {
          const spare = unitsOf(NATIVE) - (q1.attached + SWAP_RESERVE + TWO_STEP_FEE_ROOM);
          if (spare >= gas2 + SWAP_RESERVE) return q1.minOut;
          const units = q1.minOut - gas2 - SWAP_RESERVE;
          return units > 0n ? units : 0n;
        }
        function quoteLeg(asked, wallet, extra, signal) {
          return T.api('swap/quote', { signal, body: { offer: asked.offer, ask: asked.ask, units: asked.units.toString(), slippageBps: asked.slippageBps, wallet, ...(extra || {}) } }).then((res) => cleanQuote(res, wallet, asked));
        }
        async function quoteRoute(units, wallet, signal) {
          const { from, to } = pairOf();
          const q1 = await quoteLeg({ offer: from.id, ask: NATIVE, units, slippageBps: st.slippageBps }, wallet, null, signal);
          if (!q1) throw new Error('bad_quote');
          const leg2 = (amount) => quoteLeg({ offer: NATIVE, ask: to.id, units: amount, slippageBps: st.slippageBps }, wallet, { leg: 2, incoming: q1.minOut.toString() }, signal).catch((err) => {
            throw Object.assign(err, { leg: 2, need: q1.minOut + 300000000n + SWAP_RESERVE });
          });
          let units2 = q1.minOut;
          let q2 = await leg2(units2);
          if (!q2) throw new Error('bad_quote');
          const gas2 = q2.attached - units2;
          const sized = routeUnits(q1, gas2);
          if (sized <= q1.attached + TWO_STEP_FEE_ROOM) return { q1, q2: null, units2: 0n };
          if (sized !== units2) {
            units2 = sized;
            const smaller = await leg2(units2);
            if (!smaller || smaller.attached - units2 > gas2) throw new Error('bad_quote');
            q2 = smaller;
          }
          return { q1, q2, units2 };
        }
        function fetchQuote() {
          clearTimeout(quoteTimer);
          const { from, to } = pairOf();
          const g = ++gen;
          if (abort) abort.abort();
          if (st.units <= 0n || !pairProven() || overBalance() || overCap() || boughtWait !== null || !T.wallet) {
            st.quote = null;
            st.estimate = null;
            st.loading = false;
            paint();
            return;
          }
          abort = new AbortController();
          if (!fresh()) st.quote = null;
          st.loading = !st.quote;
          paint();
          const wallet = T.wallet.address;
          const asked = { offer: from.id, ask: to.id, units: st.units, slippageBps: st.slippageBps };
          askedAt = Date.now();
          if (via) {
            quoteRoute(st.units, wallet, abort.signal).then((r) => {
              if (g !== gen) return;
              st.loading = false;
              st.estimate = null;
              st.quote = r.q1;
              st.quote2 = r.q2;
              st.units2 = r.units2;
              if (st.trouble && st.trouble.fromQuote) st.trouble = null;
              if (r.q2) {
                anchor = { pair: pairKey(from, to), units: Number(st.units), out: T.fromUnits(r.q2.expectedOut, r.q2.askDecimals), impact: r.q2.impact / 100 };
                netSeen = { pair: pairKey(from, to), units: r.q1.networkFee + r.q2.networkFee };
                buildAhead(r.q1);
                buildAhead(r.q2, true);
              }
              paint();
            }, (err) => {
              if (g !== gen) return;
              st.loading = false;
              st.quote = null;
              st.quote2 = null;
              st.estimate = null;
              const unpriced = err.message === 'no_price';
              const gate = err.leg === 2 && (err.message === 'insufficient_balance' || err.message === 'insufficient_gas') && typeof err.need === 'bigint';
              const reason = gate ? 'route.needGram' : unpriced ? 'alerts.noPrice' : QUOTE_ERRORS[err.message];
              st.trouble = { key: reason || 'swap.quoteFail', params: gate ? { sum: sig4Sym(err.need, tonAsset()) } : undefined, block: true, fromQuote: true, retryAt: reason && !unpriced && !gate ? 0 : Date.now() + QUOTE_RETRY_MS };
              paint();
            });
            return;
          }
          T.api('swap/quote', { signal: abort.signal, body: { offer: from.id, ask: to.id, units: st.units.toString(), slippageBps: st.slippageBps, wallet } }).then((res) => {
            if (g !== gen) return;
            const q = cleanQuote(res, wallet, asked);
            st.loading = false;
            st.quote = q;
            st.estimate = null;
            if (!q) st.trouble = { key: 'swap.quoteFail', block: true };
            else {
              if (st.trouble && st.trouble.fromQuote) st.trouble = null;
              learn(q, from, to, asked.units);
              buildAhead(q);
            }
            paint();
          }, (err) => {
            if (g !== gen) return;
            st.loading = false;
            st.quote = null;
            st.estimate = null;
            const unpriced = err.message === 'no_price';
            const reason = unpriced ? 'alerts.noPrice' : QUOTE_ERRORS[err.message];
            st.trouble = { key: reason === 'swapSheet.noPool' && st.side === 'sell' ? 'swap.noBuyers' : reason || 'swap.quoteFail', block: true, fromQuote: true, retryAt: reason && !unpriced ? 0 : Date.now() + QUOTE_RETRY_MS };
            paint();
          });
        }
        refreshQuote = () => {
          if (!fresh() && !st.loading && st.units > 0n) fetchQuote();
          else paint();
        };
        function amountChanged() {
          stopQuotes();
          const { from, to } = pairOf();
          const held = via ? null : kept.get(keepKey(from, to, st.units));
          st.quote2 = null;
          st.units2 = 0n;
          st.quote = held && held.expiresAt - Date.now() > QUOTE_REFRESH_LEFT_MS && !overBalance() && !overCap() ? held : null;
          st.trouble = null;
          const over = overBalance() || boughtWait !== null;
          st.loading = st.units > 0n && !st.quote && !over;
          st.estimate = st.quote || over ? null : estimateOut(from, to);
          paint();
          if (st.quote) {
            if (!st.quote.ahead) buildAhead(st.quote);
          } else {
            quoteTimer = setTimeout(fetchQuote, QUOTE_DELAY_MS);
          }
        }
        function buildAhead(q, second) {
          if (!second) clearTimeout(buildTimer);
          const run = () => {
            if ((second ? st.quote2 : st.quote) !== q || q.ahead || st.sending || closing() || (orderRows && orderRows.active())) return;
            const job = T.api('swap/build?ahead=1', { body: { quoteId: q.quoteId, wallet: q.wallet } });
            job.catch(() => {});
            q.ahead = { at: Date.now(), job };
          };
          if (second) setTimeout(run, BUILD_AHEAD_DELAY_MS * 2);
          else buildTimer = setTimeout(run, BUILD_AHEAD_DELAY_MS);
        }
        function askAhead() {
          const { from, to } = pairOf();
          const key = pairKey(from, to);
          const max = maxUnits();
          if (via || askedAhead === key || max <= 0n || !T.wallet || closing()) return;
          askedAhead = key;
          const wallet = T.wallet.address;
          const slippageBps = st.slippageBps;
          const amounts = STOPS_PER_MILLE.map((share) => max * share / 1000n).filter((units) => units > 0n && !overCap.of(from, units));
          if (!amounts.length) {
            let units = max / 4n;
            for (let i = 0; i < 6 && overCap.of(from, units); i++) units /= 2n;
            if (units > 0n) amounts.push(units);
          }
          const round = ++aheadRounds;
          const over = () => {
            if (aheadBusy !== round) return;
            aheadBusy = 0;
            if (!closing()) paint();
          };
          const next = (i) => {
            const now = pairOf();
            if (i >= amounts.length || closing() || st.sending || pairKey(now.from, now.to) !== key || st.slippageBps !== slippageBps) return over();
            const units = amounts[i];
            const asked = { offer: from.id, ask: to.id, units, slippageBps };
            T.api('swap/quote?ahead=1', { body: { offer: from.id, ask: to.id, units: units.toString(), slippageBps, wallet } }).then((res) => {
              const q = cleanQuote(res, wallet, asked);
              const after = pairOf();
              if (!q || closing() || pairKey(after.from, after.to) !== key || st.slippageBps !== slippageBps) return over();
              if (!anchor) learn(q, from, to, units);
              else {
                if (kept.size >= QUOTES_KEPT) kept.delete(kept.keys().next().value);
                kept.set(keepKey(from, to, units), q);
                netSeen = { pair: key, units: q.networkFee };
              }
              if (st.loading && !st.quote) {
                if (st.units === units) {
                  stopQuotes();
                  st.quote = q;
                  st.loading = false;
                  st.estimate = null;
                  buildAhead(q);
                } else if (st.estimate === null) st.estimate = estimateOut(from, to);
                paint();
              } else if (!st.quote && st.units <= 0n) paint();
              next(i + 1);
            }, over);
          };
          aheadBusy = round;
          next(0);
        }

        const slider = CK.slider($('.tk-order-slider', body), {
          label: tx('order.shareAria'), min: 0, max: 100, step: .5, value: st.pct,
          stops: [.25, .5, .75, 1],
          format: (v) => qtySym(maxUnits() * BigInt(Math.round(v * 10)) / 1000n, pairOf().from),
          onInput(v) {
            st.pct = v;
            st.units = maxUnits() * BigInt(Math.round(v * 10)) / 1000n;
            input.value = fieldText(T.fromUnits(st.units, pairOf().from.decimals));
            amountChanged();
          }
        });
        if (window.DemoWallet) DemoWallet.amountField(input);
        input.addEventListener('input', () => {
          const { from } = pairOf();
          const max = maxUnits();
          if (window.DemoWallet) DemoWallet.fitFraction(input, from.decimals);
          st.units = typedUnits(input.value, from.decimals);
          st.pct = max > 0n ? clamp(T.fromUnits(st.units, from.decimals) / T.fromUnits(max, from.decimals) * 100, 0, 100) : 0;
          slider.set(st.pct);
          amountChanged();
        });
        input.addEventListener('blur', () => { tidyField(input, st.units, pairOf().from.decimals); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
        maxBtn.addEventListener('click', () => {
          const max = maxUnits();
          if (maxBtn.disabled || st.sending || !balanceRead() || max <= 0n) return;
          CK.haptic.selection();
          input.value = unitsText(max, pairOf().from.decimals);
          input.dispatchEvent(new Event('input'));
        });
        if (opts && typeof opts.amount === 'string' && opts.amount) {
          input.value = opts.amount;
          input.dispatchEvent(new Event('input'));
        }
        $('.sw-from', body).addEventListener('click', () => {
          if (st.sending) return;
          CK.haptic.selection();
          st.payWith = st.payWith === NATIVE && usdtToPayWith() ? USDT_RAW : NATIVE;
          st.units = 0n;
          st.pct = 0;
          input.value = '';
          slider.set(0);
          paintTokens(true);
          amountChanged();
          askAhead();
        });
        slipPicker($('.sw-slip', body), st.slippageBps, slipPresets(), true, (bps) => {
          if (!slipOk(bps) || st.sending) return;
          st.slippageBps = bps;
          amountChanged();
        });
        if (rowsHere) {
          orderRows = DemoOrders.attach($('.or-rows', body), {
            token,
            term: $('.or-term', body),
            decimals: () => pairOf().from.decimals,
            units: () => st.units,
            quote: () => st.quote,
            held: () => (balanceRead() ? unitsOf(token.id) : null),
            onChange() {
              if (st.trouble && !st.trouble.fromQuote) st.trouble = null;
              if (!st.quote && !st.loading && st.units > 0n) fetchQuote();
              else paint();
            }
          });
        }
        let wholeWhenRead = false;
        const setAmount = (units) => {
          input.value = units > 0n ? unitsText(units, pairOf().from.decimals) : '';
          input.dispatchEvent(new Event('input'));
        };
        const fillForOrder = (units) => {
          const cap = orderCap();
          if (units > 0n) setAmount(cap !== null && units > cap ? cap : units);
        };
        if (orderRows && !DemoOrders.canPlace(token.id)) {
          orderRows.hold(true);
          const askRows = () => DemoOrders.check(token.id, 0n).then((answer) => {
            if (closing()) return;
            if (answer && answer.ok) {
              orderRows.hold(false);
              const cap = orderCap();
              if (cap !== null && st.units > cap && !st.sending) setAmount(cap);
              else paint();
            } else if (answer) {
              const why = DemoOrders.trouble({ code: answer.reason });
              rowsWhy = why.block ? why.key : 'orderErr.noToken';
              orderRows.turnOff();
              orderRows.hold(false);
              paint();
            } else setTimeout(askRows, ROWS_AGAIN_MS);
          });
          askRows();
        }
        if (opts && opts.orders && orderRows) {
          if (typeof opts.units === 'bigint' && opts.units > 0n) {
            if (!(balances && unitsOf(token.id) >= opts.units)) boughtWait = opts.units;
            fillForOrder(opts.units);
          } else if (balances) fillForOrder(maxUnits());
          else wholeWhenRead = true;
          orderRows.call();
        }
        function balancesLanded() {
          if (closing()) return;
          paintTokens();
          if (boughtWait !== null && !st.sending) {
            const have = unitsOf(token.id);
            if ((balances && have >= boughtWait) || boughtLooks >= BOUGHT_LOOKS_MAX) {
              const units = balances && have < boughtWait ? have : boughtWait;
              const untouched = st.units === boughtWait;
              boughtWait = null;
              if (untouched && units !== st.units) setAmount(units);
              else amountChanged();
            } else {
              boughtLooks += 1;
              clearTimeout(boughtTimer);
              boughtTimer = setTimeout(() => {
                if (!closing()) loadBalances().then(balancesLanded, balancesLanded);
              }, BOUGHT_AGAIN_MS);
              paint();
            }
          } else if (st.units > 0n && !st.quote && !st.loading && !st.trouble && !st.sending) {
            amountChanged();
          } else paint();
          if (wholeWhenRead && !st.sending) {
            wholeWhenRead = false;
            fillForOrder(maxUnits());
          }
          if (boughtWait === null) askAhead();
          if (!orderable && st.side === 'sell' && !toAsset && window.DemoOrders && Audit.orderOffer(token.id) && unitsOf(token.id) > 0n) DemoOrders.check(token.id, unitsOf(token.id));
        }

        function askPassword() {
          return new Promise((resolve) => {
            swipeHost.hidden = true;
            passBox.hidden = false;
            passInput.value = '';
            passInput.focus({ preventScroll: true });
            if (st.trouble && st.trouble.key === 'swapSheet.passwordWrong') shakePass(passBox, true);
            passDone = (value) => {
              passDone = null;
              passInput.value = '';
              passBox.hidden = true;
              swipeHost.hidden = false;
              resolve(value);
            };
          });
        }
        function release(trouble) {
          st.sending = false;
          st.note = '';
          st.quote = null;
          st.trouble = trouble || null;
          input.disabled = false;
          body.classList.remove('is-busy');
          if (trouble && trouble.block) paint();
          else fetchQuote();
          return false;
        }
        const note = (key) => {
          st.note = key;
          paint();
        };

        function confirm() {
          const q = st.quote;
          if (st.sending || building || record || !fresh() || !T.wallet || T.wallet.readOnly) return false;
          st.sending = true;
          st.trouble = null;
          building = true;
          stopQuotes();
          kept.clear();
          input.blur();
          input.disabled = true;
          body.classList.add('is-busy');
          note('swap.building');
          return (orderRows && orderRows.active() ? signAndPlace() : via ? signRouteNow(q, st.quote2, st.units2) : signAndSend(q)).finally(() => { building = false; });
        }
        async function requoteRoute(units2) {
          const wallet = T.wallet && T.wallet.address;
          if (!wallet) return null;
          try {
            const r = await quoteRoute(st.units, wallet);
            return r.q2 && r.units2 === units2 ? r : null;
          } catch (_) {
            return null;
          }
        }
        async function signRouteNow(q1, q2, units2, carry = {}) {
          const { from, to } = pairOf();
          const gram = tonAsset();
          const units = st.units;
          const owner = T.wallet.address;
          if (!q2 || units2 <= 0n) return release();
          const otherWallets = balances ? balances.rows.filter((r) => r.id !== from.id && r.wallet).map((r) => r.wallet) : [];
          const intent1 = { owner, wallet: st.walletAt, offer: from.id, ask: NATIVE, units, minOut: q1.minOut, feeBps: q1.feeBps, destination: q1.destination, otherWallets, venue: q1.venue, swipedAt: Date.now() };
          const intent2 = { owner, wallet: st.walletAt, offer: NATIVE, ask: to.id, units: units2, minOut: q2.minOut, feeBps: q2.feeBps, destination: q2.destination, otherWallets: otherWallets.concat(balances ? balances.rows.filter((r) => r.id === from.id && r.wallet).map((r) => r.wallet) : []), venue: q2.venue, swipedAt: Date.now() };
          for (const [leg, q] of [[{ from, to: gram, units }, q1], [{ from: gram, to, units: units2 }, q2]]) {
            const floor = await floorCheck(leg, q);
            if (closing()) return false;
            if (floor) return release(floor);
          }
          if (!Audit.swappable(from.id)) {
            const row = rowOf(from.id);
            let confirmed = false;
            try {
              confirmed = !!(row && row.wallet && row.wallet === q1.destination) && await offerWalletConfirmed(from.id, owner, row.wallet);
            } catch (err) {
              console.error(err);
              if (closing()) return false;
              return release({ key: 'swapSheet.tryAgain' });
            }
            if (closing()) return false;
            if (!confirmed) return release({ key: 'swapSheet.stopped', block: true });
            intent1.offerWallet = row.wallet;
          }
          const again = async (password) => {
            if (carry.again) return null;
            const next = await requoteRoute(units2);
            if (closing()) return false;
            if (!next || !noWorse(q1, next.q1) || !noWorse(q2, next.q2)) return null;
            return signRouteNow(next.q1, next.q2, next.units2, { again: true, password });
          };
          let built1, built2;
          try {
            if (!(await CK.wallet.canSign())) {
              const now = CK.wallet.status;
              return release(now.bioUnknown ? { key: 'wallet.bioWait' } : { key: now.denied ? 'swapSheet.bioDenied' : now.lost ? 'swapSheet.bioLost' : 'swapSheet.noSign', block: true });
            }
            const own = await CK.wallet.depositAddress();
            if (!own.verified || own.address !== owner) return release({ key: 'swapSheet.stopped', block: true });
            const built = (q) => (q.ahead && !builtOld(q) ? q.ahead.job.catch(() => null) : Promise.resolve(null)).then((b) => b || T.api('swap/build', { body: { quoteId: q.quoteId, wallet: owner } }));
            [built1, built2] = await Promise.all([built(q1), built(q2)]);
          } catch (err) {
            if (err.message === 'quote_stale' || err.message === 'price_moved') {
              const went = await again(carry.password);
              if (went !== null) return went;
              CK.toast(tx('swap.priceMoved'), { icon: 'info', tone: 'accent' });
              return release();
            }
            if (err.message === 'insufficient_balance' || err.message === 'insufficient_gas') return release({ key: 'route.needGram', params: { sum: sig4Sym(q1.minOut + 300000000n + SWAP_RESERVE, gram) }, block: true });
            console.error(err);
            return release({ key: 'swap.buildFail' });
          }
          if (closing()) return false;
          const lib = window.TonWallet;
          const usePassword = CK.wallet.status.method === 'password';
          let password = carry.password;
          if (usePassword && !password) {
            st.note = '';
            paint();
            password = await askPassword();
            if (password === null || closing()) return false;
          }
          if (!carry.again && Math.min(q1.expiresAt, q2.expiresAt) - Date.now() < QUOTE_SOON_MS) {
            const went = await again(password);
            if (went !== null) return went;
          }
          for (const [built, intent] of [[built1, intent1], [built2, intent2]]) {
            const audited = Audit.audit(lib, built, intent);
            if (audited.reason) {
              console.error('route refused:', audited.reason);
              if (audited.reason === 'deadline') {
                const went = await again(password);
                if (went !== null) return went;
                if (usePassword) return release();
              }
              return release({ key: 'swapSheet.stopped', block: true });
            }
          }
          const beforeSecond = async () => {
            const wallet = T.wallet && T.wallet.address;
            if (!wallet) return false;
            const look = await quoteLeg({ offer: NATIVE, ask: to.id, units: units2, slippageBps: st.slippageBps }, wallet, { leg: 2, incoming: q1.minOut.toString() }).catch(() => null);
            if (!look || look.expectedOut < q2.minOut) return false;
            return (await floorCheck({ from: gram, to, units: units2 }, look)) === null;
          };
          const stepLine = (i, a, b) => { st.note = { key: 'route.step', params: { i, n: 2, a, b } }; paint(); };
          let first = null, res;
          for (;;) {
            note('swap.signing');
            try {
              res = await CK.wallet.signRoute({ built: built1, intent: intent1 }, { kind: 'swap', built: built2, intent: intent2 }, { ...(password ? { password } : {}), wallet: st.walletAt, beforeSecond }, (name, info) => {
                if (name === 'first_sent') {
                  first = info || {};
                  record = routeRecord('sent', first, from, gram, units, q1, false);
                  saveRecord();
                  emit();
                  stepLine(1, from.sym, gram.sym);
                  CK.toast(tx('route.keepOpen'), { icon: 'info', tone: 'accent' });
                } else if (name === 'first_landed') stepLine(2, gram.sym, to.sym);
              });
              break;
            } catch (err) {
              if (err.code === 'wrong_password') {
                st.trouble = { key: 'swapSheet.passwordWrong' };
                password = await askPassword();
                if (password === null || closing()) return false;
                continue;
              }
              return routeFailed(err, { first, from, to, gram, units, q1, q2, password });
            }
          }
          password = undefined;
          record = routeRecord('sent', { hash: res.hash, seqno: res.seqno, validUntil: res.validUntil }, from, to, units, q2, true);
          saveRecord();
          CK.haptic.success();
          const gone = active !== mine;
          handing = !gone;
          emit();
          sheet.close();
          track();
          if (gone) openTrack();
          return undefined;
        }
        function routeRecord(phase, sent, from, to, units, q, whole) {
          return {
            wallet: T.wallet.address, phase, at: Date.now(), sentAt: Date.now(), hash: sent.hash || '', seqno: Number.isInteger(sent.seqno) ? sent.seqno : 0, validUntil: Number.isInteger(sent.validUntil) ? sent.validUntil : Math.floor(Date.now() / 1000) + 180,
            offer: { id: from.id, sym: from.sym, decimals: from.decimals, units: units.toString() },
            ask: { id: to.id, sym: to.sym, decimals: q.askDecimals, expected: q.expectedOut.toString(), min: q.minOut.toString() },
            feeBps: q.feeBps, feeUnits: q.feeUnits.toString(), gasUnits: q.networkFee.toString(), venue: q.venue, kind: 'swap', stop: false,
            route: whole === true,
            cost: { offer: coinIdOf(from), ask: coinIdOf(to), offerUsd: marketPrice(from), askUsd: marketPrice(to), ...(whole ? heldBefore(to) : {}) }
          };
        }
        function routeFailed(err, ctx) {
          const left = err && err.left;
          if (err && (err.code === 'route_step_failed' || err.code === 'route_step_held') && left === 'offer') {
            record = null;
            saveRecord();
            emit();
            return release({ key: 'swapSheet.fundsKept', tone: 'note', block: true });
          }
          if (err && (err.code === 'route_step_failed' || err.code === 'route_step_held') && left === 'gram') {
            const got = ctx.q1.minOut;
            if (record) {
              const done = record;
              record = null;
              saveRecord();
              try { rememberCost(done); } catch (e) { console.error(e); }
              emit();
            }
            CK.toast(tx('route.kept', { v: sig4Sym(got, ctx.gram, true) }), { icon: 'info', tone: 'accent' });
            afterClose = () => open(null, 'sell', ctx.gram, toAsset, { amount: unitsText(got, TON_DECIMALS) });
            sheet.close();
            return false;
          }
          if (err && err.code === 'send_unsure' && ctx.first) {
            record = routeRecord('unsure', { hash: err.hash, seqno: (ctx.first.seqno || 0) + 1 }, ctx.from, ctx.to, ctx.units, ctx.q2, true);
            saveRecord();
            const gone = active !== mine;
            handing = !gone;
            emit();
            sheet.close();
            settle();
            if (gone) openTrack();
            return undefined;
          }
          if (err && (err.code === 'route_step_failed' || err.code === 'route_step_held') && record) {
            const gone = active !== mine;
            handing = !gone;
            sheet.close();
            track();
            if (gone) openTrack();
            return undefined;
          }
          if (CK.wallet.isRejection(err)) {
            CK.toast(tx(CK.wallet.protectRefused(err) ? 'wallet.needProtect' : 'swap.rejected'), { icon: 'info', tone: 'accent' });
            return release();
          }
          console.error(err);
          if (err && err.code === 'swap_refused' && (err.reason === 'stale' || err.reason === 'deadline')) {
            CK.toast(tx('swap.priceMoved'), { icon: 'info', tone: 'accent' });
            return release();
          }
          const key = SIGN_ERRORS[err && err.code];
          return release(key ? { key, block: true } : { key: 'swapSheet.tryAgain' });
        }
        async function signAndPlace() {
          const { from } = pairOf();
          const intent = orderRows.intent();
          let placed;
          try {
            if (!(await CK.wallet.canSign())) {
              const now = CK.wallet.status;
              return release(now.bioUnknown ? { key: 'wallet.bioWait' } : { key: now.denied ? 'swapSheet.bioDenied' : now.lost ? 'swapSheet.bioLost' : 'swapSheet.noSign', block: true });
            }
          } catch (err) {
            console.error(err);
            return release({ key: 'swap.buildFail' });
          }
          const usePassword = CK.wallet.status.method === 'password';
          for (;;) {
            let password;
            if (usePassword) {
              st.note = '';
              paint();
              password = await askPassword();
              if (password === null || closing()) return false;
            }
            note('orders.placing');
            try {
              placed = await DemoOrders.place(intent, { ...(password ? { password } : {}), wallet: st.walletAt });
              break;
            } catch (err) {
              if (err.code === 'wrong_password') {
                st.trouble = { key: 'swapSheet.passwordWrong' };
                continue;
              }
              if (CK.wallet.isRejection(err)) {
                CK.toast(tx(CK.wallet.protectRefused(err) ? 'wallet.needProtect' : 'swap.rejected'), { icon: 'info', tone: 'accent' });
                return release();
              }
              console.error(err);
              if (DemoOrders.reason(err) === 'order_too_big' && !closing()) {
                const most = err.detail ? T.parseUnits(err.detail.maxUnits) : null;
                if (most && most > 0n) {
                  st.units = most;
                  input.value = fieldText(T.fromUnits(most, from.decimals));
                  const max = maxUnits();
                  st.pct = max > 0n ? clamp(T.fromUnits(most, from.decimals) / T.fromUnits(max, from.decimals) * 100, 0, 100) : 0;
                  slider.set(st.pct);
                  return release({ key: 'orders.tooBigTo', params: { sum: qtySym(most, from) }, tone: 'note' });
                }
              }
              if (NO_ORDER_POOL.has(DemoOrders.reason(err)) && !closing()) {
                orderRows.turnOff();
                return release();
              }
              return release(DemoOrders.reason(err) === 'order_too_big' ? { key: 'orderErr.tooBig', block: true } : DemoOrders.trouble(err));
            }
          }
          CK.haptic.success();
          const shown = () => DemoOrders.openPlaced(from, intent, placed);
          DemoOrders.refresh();
          if (active === mine) {
            afterClose = shown;
            sheet.close();
          } else {
            shown();
          }
          return undefined;
        }
        const QUOTE_SOON_MS = QUOTE_MIN_LEFT_MS + 8000;
        async function requote() {
          const { from, to } = pairOf();
          const wallet = T.wallet && T.wallet.address;
          if (!wallet || !slipOk(st.slippageBps)) return null;
          const asked = { offer: from.id, ask: to.id, units: st.units, slippageBps: st.slippageBps };
          try {
            const res = await T.api('swap/quote', { body: { offer: from.id, ask: to.id, units: st.units.toString(), slippageBps: st.slippageBps, wallet } });
            return cleanQuote(res, wallet, asked);
          } catch (_) {
            return null;
          }
        }
        async function again(q, carry, password) {
          if (carry.again) return null;
          const next = await requote();
          if (closing()) return false;
          if (!noWorse(q, next)) return null;
          return signAndSend(next, { again: true, password });
        }
        async function signAndSend(q, carry = {}) {
          const { from, to } = pairOf();
          const units = st.units;
          const owner = T.wallet.address;
          const otherWallets = balances ? balances.rows.filter((r) => r.id !== from.id && r.wallet).map((r) => r.wallet) : [];
          const intent = { owner, wallet: st.walletAt, offer: from.id, ask: to.id, units, minOut: q.minOut, feeBps: q.feeBps, destination: q.destination, otherWallets, venue: q.venue, swipedAt: Date.now() };
          const floor = await floorCheck({ from, to, units }, q);
          if (closing()) return false;
          if (floor) return release(floor);
          if (!Audit.swappable(from.id)) {
            const row = rowOf(from.id);
            let confirmed = false;
            try {
              confirmed = !!(row && row.wallet && row.wallet === q.destination) && await offerWalletConfirmed(from.id, owner, row.wallet);
            } catch (err) {
              console.error(err);
              if (closing()) return false;
              return release({ key: 'swapSheet.tryAgain' });
            }
            if (closing()) return false;
            if (!confirmed) return release({ key: 'swapSheet.stopped', block: true });
            intent.offerWallet = row.wallet;
          }
          let built, audited, signed;
          try {
            if (!(await CK.wallet.canSign())) {
              const now = CK.wallet.status;
              return release(now.bioUnknown ? { key: 'wallet.bioWait' } : { key: now.denied ? 'swapSheet.bioDenied' : now.lost ? 'swapSheet.bioLost' : 'swapSheet.noSign', block: true });
            }
            const own = await CK.wallet.depositAddress();
            if (!own.verified || own.address !== owner) return release({ key: 'swapSheet.stopped', block: true });
            built = q.ahead && !builtOld(q) ? await q.ahead.job.catch(() => null) : null;
            if (!built) built = await T.api('swap/build', { body: { quoteId: q.quoteId, wallet: owner } });
          } catch (err) {
            if (err.message === 'quote_stale' || err.message === 'price_moved') {
              const went = await again(q, carry, carry.password);
              if (went !== null) return went;
              CK.toast(tx('swap.priceMoved'), { icon: 'info', tone: 'accent' });
              return release();
            }
            console.error(err);
            return release({ key: 'swap.buildFail' });
          }
          if (closing()) return false;
          const lib = window.TonWallet;
          const usePassword = CK.wallet.status.method === 'password';
          let password = carry.password;
          for (;;) {
            if (usePassword && !password) {
              st.note = '';
              paint();
              password = await askPassword();
              if (password === null || closing()) return false;
            }
            if (!carry.again && q.expiresAt - Date.now() < QUOTE_SOON_MS) {
              const went = await again(q, carry, password);
              if (went !== null) return went;
            }
            audited = Audit.audit(lib, built, intent);
            if (audited.reason) {
              console.error('swap refused:', audited.reason);
              if (audited.reason === 'deadline') {
                const went = await again(q, carry, password);
                if (went !== null) return went;
                if (usePassword) return release();
              }
              return release({ key: 'swapSheet.stopped', block: true });
            }
            note('swap.signing');
            try {
              signed = await CK.wallet.signSwap(built, intent, password ? { password } : undefined);
              break;
            } catch (err) {
              if (err.code === 'wrong_password') {
                st.trouble = { key: 'swapSheet.passwordWrong' };
                password = undefined;
                continue;
              }
              if (CK.wallet.isRejection(err)) {
                CK.toast(tx(CK.wallet.protectRefused(err) ? 'wallet.needProtect' : 'swap.rejected'), { icon: 'info', tone: 'accent' });
                return release();
              }
              console.error(err);
              if (err.code === 'swap_refused' && (err.reason === 'stale' || err.reason === 'deadline')) {
                const went = await again(q, carry, password);
                if (went !== null) return went;
                CK.toast(tx('swap.priceMoved'), { icon: 'info', tone: 'accent' });
                return release();
              }
              const key = SIGN_ERRORS[err.code];
              return release(key ? { key, block: true } : { key: 'swapSheet.tryAgain' });
            }
          }
          password = undefined;
          record = {
            wallet: owner, phase: 'sending', at: Date.now(), sentAt: Date.now(), hash: signed.hash || '', seqno: signed.seqno, validUntil: signed.validUntil,
            offer: { id: from.id, sym: from.sym, decimals: from.decimals, units: audited.units.toString() },
            ask: { id: to.id, sym: to.sym, decimals: q.askDecimals, expected: q.expectedOut.toString(), min: audited.minOut.toString() },
            feeBps: q.feeBps, feeUnits: q.feeUnits.toString(), gasUnits: q.networkFee.toString(), venue: q.venue,
            kind: toAsset ? 'swap' : st.side,
            stop: stopAfter(st.side, !!toAsset, to.id, unitsOf(NATIVE) - q.attached),
            ...(stopNext ? { stopNext: true } : {}),
            cost: { offer: coinIdOf(from), ask: coinIdOf(to), offerUsd: marketPrice(from), askUsd: marketPrice(to), ...heldBefore(to) }
          };
          saveRecord();
          CK.haptic.success();
          const gone = active !== mine;
          handing = !gone;
          relay(record, signed.boc);
          emit();
          sheet.close();
          if (gone) openTrack();
          return undefined;
        }

        timer = setInterval(() => {
          if (document.hidden || st.sending) return;
          if (!balances && Date.now() >= balanceTryAt) {
            balanceTryAt = Date.now() + BALANCE_RETRY_MS;
            loadBalances().then(balancesLanded, () => {});
          }
          if (!st.quote) {
            if (st.trouble && st.trouble.retryAt && Date.now() >= st.trouble.retryAt && !st.loading) fetchQuote();
            return;
          }
          const soonest = via && st.quote2 ? Math.min(st.quote.expiresAt, st.quote2.expiresAt) : st.quote.expiresAt;
          if (soonest - Date.now() <= QUOTE_REFRESH_LEFT_MS && Date.now() - askedAt >= QUOTE_RETRY_MS) fetchQuote();
          else paint();
        }, 1000);
        document.addEventListener('visibilitychange', onVisible);
        mine.dispose = () => {
          stopQuotes();
          clearInterval(timer);
          clearTimeout(boughtTimer);
          document.removeEventListener('visibilitychange', onVisible);
          if (passDone) passDone(null);
        };
        paintTokens();
        paint();
        pinHeight(this, sheet, FORM_FLOOR_PX, undefined, via ? FOLD_ROOM_PX : 0);
        balanceTryAt = Date.now() + BALANCE_RETRY_MS;
        if (balanceRead()) askAhead();
        loadBalances().then(balancesLanded, () => {
          if (closing()) return;
          CK.toast(tx('swap.loadFail'), { icon: 'warning', tone: 'down' });
          if (boughtWait !== null) balancesLanded();
        });
        setTimeout(() => {
          if (!closing() && CK.wallet) CK.wallet.depositAddress().catch(() => {});
        }, AFTER_RISE_MS);
      }
    });
  }

  function walletChanged(wallet) {
    balances = null;
    if (record && !sameWallet(record)) {
      clearTimeout(pollTimer);
      record = null;
    }
    if (!wallet && active) active.sheet.close();
    if (wallet) resume();
    emit();
    if (wallet && cfg) loadBalances().then(emit, () => {});
  }
  function loadConfig() {
    T.config().then((config) => {
      state = config.state;
      cfg = config.state === 'open' ? config : null;
      emit();
      if (cfg && T.wallet && !balances) loadBalances().then(emit, () => {});
      if (config.state === 'failed') setTimeout(loadConfig, CONFIG_RETRY_MS);
    });
  }
  function forgetOldKeys() {
    try {
      localStorage.removeItem('ck-account');
      Object.keys(localStorage).filter((key) => key.startsWith('ck-swap-history:')).forEach((key) => localStorage.removeItem(key));
    } catch (_) { }
  }

  const eligible = (inst) => !!assetIdOf(inst) && !isSuspicious(inst);
  const buyable = (inst) => eligible(inst) && Audit.swappable(assetIdOf(inst));
  const canTrade = (inst) => !!cfg && !!T.wallet && !T.wallet.readOnly && eligible(inst);
  function canOrder(inst) {
    if (!canTrade(inst) || record || !window.DemoOrders) return false;
    const id = assetIdOf(inst);
    if (!Audit.orderOffer(id) || !keyCanSign()) return false;
    const row = rowOf(id);
    if (!row || !(row.units > 0n) || row.risk === 'suspicious') return false;
    return orderReady(id, row.units, emit);
  }

  const stopAsking = new Set();
  const stopRetries = new Set();
  let balancesAskedAt = 0;
  function stopMode(inst) {
    if (!inst || !window.DemoOrders) return null;
    const id = assetIdOf(inst);
    if (!id || id === NATIVE || isSuspicious(inst) || !Audit.orderOffer(id)) return null;
    if (DemoOrders.asked(id) && DemoOrders.refused(id)) return null;
    if (!T.wallet) return CK.wallet && CK.wallet.status && CK.wallet.status.kind === 'unknown' ? 'wait' : null;
    if (T.wallet.readOnly || !keyCanSign()) return null;
    if (state === 'loading') return 'wait';
    if (!canTrade(inst)) return null;
    if (!balances || balances.wallet !== T.wallet.address) {
      if (!balancesJob && Date.now() - balancesAskedAt > STOP_AGAIN_MS) {
        balancesAskedAt = Date.now();
        loadBalances().then(emit, () => {});
      }
      return 'wait';
    }
    const row = rowOf(id);
    if (row && row.risk === 'suspicious') return null;
    const have = row ? row.units : 0n;
    if (have <= 0n && (!buyable(inst) || id === USDT_RAW)) return null;
    const mode = record ? 'wait' : have > 0n ? 'sell' : 'buy';
    if (!DemoOrders.asked(id)) return mode;
    const answer = DemoOrders.answer(id);
    if (answer) return answer.ok ? mode : null;
    const lately = DemoOrders.okLately(id);
    if (!stopAsking.has(id)) {
      stopAsking.add(id);
      DemoOrders.check(id, have).then((next) => {
        stopAsking.delete(id);
        if (next) {
          if (!(lately && next.ok)) emit();
        } else if (!stopRetries.has(id)) {
          stopRetries.add(id);
          setTimeout(() => {
            stopRetries.delete(id);
            emit();
          }, STOP_AGAIN_MS);
        }
      });
    }
    return lately ? mode : 'wait';
  }
  function stopWhy(inst) {
    const id = inst ? assetIdOf(inst) : null;
    if (!id || !window.DemoOrders || !DemoOrders.asked(id)) return '';
    const answer = DemoOrders.answer(id) || (DemoOrders.refused(id) ? { ok: false, reason: DemoOrders.refused(id) } : null);
    if (!answer || answer.ok) return '';
    const why = DemoOrders.trouble({ code: answer.reason });
    return why.block ? why.key : 'orderErr.noToken';
  }

  window.DemoSwap = {
    build(context) {
      ctx = context;
      forgetOldKeys();
      T.onWallet(walletChanged);
      loadConfig();
      if (T.wallet) walletChanged(T.wallet);
    },
    get state() { return state; },
    eligible,
    buyable,
    canTrade,
    canOrder,
    stopMode,
    stopWhy,
    open,
    openPair: (from, to, opts) => open(null, 'sell', from, to, opts),
    get pending() { return record; },
    openTrack: () => openTrack(),
    worthText,
    withWorth,
    receipt: { html: RECEIPT, paint: paintReceipt, more: moreHtml, moreRows, sig4, sig4Sym },
    feeLine,
    skel: { html: SKEL, hold: holdOrSkel, on: skelOn },
    slip: { picker: slipPicker, presets: slipPresets, ok: slipOk },
    route: { cleanQuote, marketPrice, floorOf, loadFloors, knownDecimals, feeSumOf, floorCheck, offerWalletConfirmed, noWorse, rowOf, unitsOf, tonAsset, usdtAsset, pctText, explorerLink: (hash) => `${EXPLORER}transaction/${hash}`, QUOTE_MIN_LEFT_MS, SWAP_RESERVE, GAS_RESERVE },
    pinHeight,
    reveal,
    edgeFade,
    FORM_FLOOR_PX,
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    loadBalances,
    takeBalances,
    cleanBalance,
    marketLossPct,
    stopAfter,
  };
})();
