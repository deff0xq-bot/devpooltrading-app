(function () {
  'use strict';
  const CK = window.CK;
  const { icon } = CK;
  const esc = CK.esc;
  const $ = (s, r) => (r || document).querySelector(s);

  const NATIVE = 'TON';
  const USDT_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const NOT_FRIENDLY = 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';
  const GAS_RESERVE = 350000000n;
  const LANGS = ['ru', 'en', 'uk', 'kk'];

  const S = {
    give: ['Отдаёте', 'You give', 'Віддаєте', 'Бересіз'],
    get: ['Получаете', 'You get', 'Отримуєте', 'Аласыз'],
    flip: ['Поменять местами', 'Swap sides', 'Поміняти місцями', 'Орындарын ауыстыру'],
    rateLine: ['1 {a} ≈ {v} {b}', '1 {a} ≈ {v} {b}', '1 {a} ≈ {v} {b}', '1 {a} ≈ {v} {b}'],
    next: ['Продолжить', 'Continue', 'Продовжити', 'Жалғастыру'],
    feeShort: ['комиссия {pct}', 'fee {pct}', 'комісія {pct}', 'комиссия {pct}'],
    feeSteps: ['комиссия {pct} · {step} за шаг', 'fee {pct} · {step} per step', 'комісія {pct} · {step} за крок', 'комиссия {pct} · қадамына {step}'],
    btnNoBalance: ['Нет {sym}', 'No {sym}', 'Немає {sym}', '{sym} жоқ'],
    btnTooMuch: ['Недостаточно {sym}', 'Not enough {sym}', 'Недостатньо {sym}', '{sym} жеткіліксіз'],
    btnGas: ['Оставьте GRAM на газ', 'Leave GRAM for gas', 'Залиште GRAM на газ', 'Газға GRAM қалдырыңыз'],
    btnPair: ['Пара недоступна', 'Pair unavailable', 'Пара недоступна', 'Жұп қолжетімсіз'],
    btnClosed: ['Обмен закрыт', 'Swaps closed', 'Обмін закритий', 'Айырбас жабық'],
    btnWait: ['Загрузка…', 'Loading…', 'Завантаження…', 'Жүктелуде…'],
    pickGive: ['Что отдаёте', 'What you give', 'Що віддаєте', 'Не бересіз'],
    pickGet: ['Что получаете', 'What you get', 'Що отримуєте', 'Не аласыз'],
    pickGiveAria: ['Выбрать, что отдаёте', 'Choose what you pay with', 'Вибрати, що віддаєте', 'Не беретініңізді таңдау'],
    pickGetAria: ['Выбрать, что получаете', 'Choose what you get', 'Вибрати, що отримуєте', 'Не алатыныңызды таңдау'],
    search: ['Поиск', 'Search', 'Пошук', 'Іздеу'],
    groupTon: ['Сеть TON', 'TON network', 'Мережа TON', 'TON желісі'],
    groupOther: ['Другие сети', 'Other networks', 'Інші мережі', 'Басқа желілер'],
    noPairWith: ['нет пары', 'no pair', 'немає пари', 'жұп жоқ'],
    noPair: ['Пару не обменять', 'Pair can’t be swapped', 'Пару не обміняти', 'Жұп айырбасталмайды'],
    whyTonClosed: ['Обмен в TON закрыт', 'TON swaps closed', 'Обмін у TON закритий', 'TON айырбасы жабық'],
    whyTonWait: ['Обмен загружается', 'Swaps loading', 'Обмін завантажується', 'Айырбас жүктелуде'],
    noBalance: ['Нет на балансе', 'Not in your balance', 'Немає на балансі', 'Балансында жоқ'],
    tooMuch: ['Больше, чем на балансе', 'More than your balance', 'Більше, ніж на балансі', 'Баланстан көп'],
    gasLeft: ['Оставьте {v} на газ', 'Leave {v} for gas', 'Залиште {v} на газ', 'Газға {v} қалдырыңыз'],
    busy: ['Сейчас недоступно', 'Unavailable now', 'Зараз недоступно', 'Қазір қолжетімсіз'],
    createWords: ['Ввести 24 слова', 'Enter 24 words', 'Ввести 24 слова', '24 сөзді енгізу'],
    none: ['Ничего не найдено', 'Nothing found', 'Нічого не знайдено', 'Ештеңе табылмады'],
    stepOf: ['Шаг {i} из {n}', 'Step {i} of {n}', 'Крок {i} з {n}', '{n} қадамның {i}-сі'],
    stepReady: ['Шаг 1 готов', 'Step 1 done', 'Крок 1 готовий', '1-қадам дайын'],
    got: ['Получено {v}', 'Received {v}', 'Отримано {v}', '{v} алынды'],
    gotAtLeast: ['Получено от {v}', 'Received at least {v}', 'Отримано від {v}', 'Кемінде {v} алынды'],
    stepGo: ['{a} → {b}', '{a} → {b}', '{a} → {b}', '{a} → {b}'],
    keep: ['Оставить {sym}', 'Keep {sym}', 'Залишити {sym}', '{sym} қалдыру'],
    keptTitle: ['Шаг 2 не сделан', 'Step 2 not done', 'Крок 2 не зроблено', '2-қадам жасалмады'],
    keptText: ['{v} на балансе', '{v} in your balance', '{v} на балансі', '{v} балансыңызда'],
    stepLine: ['Шаг {i}: {a} → {b}', 'Step {i}: {a} → {b}', 'Крок {i}: {a} → {b}', '{i}-қадам: {a} → {b}'],
    status: ['Статус', 'Status', 'Статус', 'Күйі']
  };
  const col = () => Math.max(0, LANGS.indexOf(CK.i18n.lang));
  function t(key, params) {
    const row = S[key];
    if (!row) return key;
    const text = row[col()];
    return params ? text.replace(/\{(\w+)\}/g, (whole, name) => (Object.prototype.hasOwnProperty.call(params, name) ? params[name] : whole)) : text;
  }
  const appText = (key, params) => (CK.t ? CK.t(key, params) : key);
  const buzz = (kind) => { if (CK.haptic && typeof CK.haptic[kind] === 'function') CK.haptic[kind](); };
  const still = () => (typeof CK.reducedMotion === 'function' ? CK.reducedMotion() : false);

  const D = () => window.DemoData;
  const T = () => CK.ton;
  let notRaw = null;
  const notId = () => notRaw || (notRaw = T().rawAddress(NOT_FRIENDLY));
  function tonCoin(inst) {
    const d = D();
    if (inst === d.byId.ton) return { key: 'ton:' + NATIVE, engine: 'ton', id: NATIVE, sym: inst.sym, name: inst.name, decimals: 9, inst, logo: null };
    if (inst === d.byId.usdt) return { key: 'ton:' + USDT_RAW, engine: 'ton', id: USDT_RAW, sym: inst.sym, name: inst.name, decimals: 6, inst, logo: null };
    if (inst === d.byId.not) return { key: 'ton:' + notId(), engine: 'ton', id: notId(), sym: inst.sym, name: inst.name, decimals: 9, inst, logo: null };
    return null;
  }
  const isGram = (a) => !!a && a.engine === 'ton' && a.id === NATIVE;
  const isUsdt = (a) => !!a && a.engine === 'ton' && a.id === USDT_RAW;
  const swappable = (id) => !CK.swapAudit || typeof CK.swapAudit.swappable !== 'function' || CK.swapAudit.swappable(id);
  const netListed = (inst) => !!window.DemoNets && typeof DemoNets.listed === 'function' && DemoNets.listed(inst);

  function catalog() {
    const d = D();
    const held = d.holdings().filter((h) => h.risk !== 'suspicious' && h.units > 0n);
    const ton = [d.byId.ton, d.byId.usdt, d.byId.not].filter(Boolean).map(tonCoin).filter((a) => swappable(a.id));
    held.filter((h) => !h.net && h.coin && h.coin.token && !tonCoin(h.coin)).forEach((h) => {
      const id = T().rawAddress(h.coin.token.address);
      if (!id || !id.startsWith('0:') || ton.some((a) => a.id === id)) return;
      const asset = { key: 'ton:' + id, engine: 'ton', id, sym: h.coin.sym, name: h.coin.name, decimals: h.decimals, inst: h.coin, logo: `api/logos?id=${encodeURIComponent(h.coin.id)}` };
      if (!swappable(id)) asset.sellOnly = true;
      ton.push(asset);
    });
    const net = [];
    const addNet = (inst, decimals) => {
      if (!inst || tonCoin(inst) || !netListed(inst) || net.some((a) => a.inst === inst)) return;
      net.push({ key: 'net:' + inst.id, engine: 'net', id: inst.id, sym: inst.sym, name: inst.name, decimals: Number.isInteger(decimals) ? decimals : null, inst, logo: inst.logo || null });
    };
    (d.coins || []).forEach((c) => addNet(c));
    held.filter((h) => h.net).forEach((h) => addNet(h.coin, h.decimals));
    return { ton, net };
  }

  function heldUnits(a) {
    const d = D();
    if (!a || !d.balancesKnown) return null;
    const rows = d.holdings().filter((h) => h.coin === a.inst && (a.engine === 'ton' ? !h.net : !!h.net));
    return rows.reduce((sum, h) => sum + h.units, 0n);
  }
  const decimalsOf = (a) => {
    if (Number.isInteger(a.decimals)) return a.decimals;
    const row = D().holdings().find((h) => h.coin === a.inst);
    return row && Number.isInteger(row.decimals) ? row.decimals : null;
  };

  function buildRoute(from, to, o) {
    const gram = o && o.gram;
    if (!from || !to || from.key === to.key || to.sellOnly) return { ok: false, reason: 'noPair' };
    if (from.engine === 'ton' && to.engine === 'ton' && (isGram(from) || isGram(to))) return { ok: true, engine: 'ton' };
    if (from.engine === 'ton' && to.engine === 'net' && isGram(from)) return { ok: true, engine: 'net', side: 'buy', inst: to.inst, pay: 'gram' };
    if (from.engine === 'ton' && to.engine === 'net' && isUsdt(from) && o && o.usdtPays) return { ok: true, engine: 'net', side: 'buy', inst: to.inst, pay: 'usdt' };
    if (from.engine === 'net' && to.engine === 'ton' && isGram(to)) return { ok: true, engine: 'net', side: 'sell', inst: from.inst };
    if (!isGram(gram)) return { ok: false, reason: 'noPair' };
    const first = from.engine === 'ton' ? { engine: 'ton', from, to: gram } : { engine: 'net', side: 'sell', inst: from.inst };
    const second = to.engine === 'ton' ? { engine: 'ton', from: gram, to } : { engine: 'net', side: 'buy', inst: to.inst };
    return { ok: true, engine: 'route', path: [from, gram, to], steps: [first, second] };
  }
  const usdtPays = () => !!(CK.wallet && typeof CK.wallet.payRelayWithUsdt === 'function');
  const routeOf = (from, to) => buildRoute(from, to, { gram: gramOf(), usdtPays: usdtPays() });
  function legsOf(route, from, to) {
    if (!route.ok) return [];
    if (route.engine === 'route') return route.steps;
    if (route.engine === 'ton') return [{ engine: 'ton', from, to }];
    return [{ engine: 'net', side: route.side, inst: route.inst, ...(route.pay === 'usdt' ? { pay: 'usdt' } : {}) }];
  }
  const feeLegs = (legs) => legs.filter((leg) => leg.engine === 'ton' || leg.side === 'buy').length;

  const st = { from: null, to: null, text: '', turn: 0, details: false, run: null };
  function defaults() {
    const { ton } = catalog();
    const gram = ton.find(isGram) || null, usdt = ton.find(isUsdt) || null;
    if (!st.from) st.from = gram && !(heldUnits(gram) === 0n && usdt && heldUnits(usdt) > 0n) ? gram : usdt || gram;
    if (!st.to || st.to.key === st.from.key) st.to = isGram(st.from) ? usdt : gram;
  }
  const unitsTyped = (a) => {
    const decimals = decimalsOf(a);
    if (decimals === null || !st.text) return 0n;
    return window.DemoWallet && DemoWallet.typedUnits ? DemoWallet.typedUnits(st.text, decimals) : T().toUnits(String(st.text).replace(',', '.'), decimals);
  };
  const fieldOf = (units, decimals) => (window.DemoWallet && DemoWallet.unitsText ? DemoWallet.unitsText(units, decimals) : T().fromUnits(units, decimals).toString());
  const qtyOf = (units, a) => `${D().qty(T().fromUnits(units, decimalsOf(a) || 0))} ${a.sym}`;
  function maxOf(a) {
    const have = heldUnits(a);
    if (have === null) return null;
    return isGram(a) ? (have > GAS_RESERVE ? have - GAS_RESERVE : 0n) : have;
  }

  function walletState() {
    const W = CK.wallet, status = (W && W.status) || {};
    const setup = window.DemoWalletSetup;
    const wallet = T().wallet;
    if (!wallet) {
      if (status.kind === 'unknown') return { kind: 'wait' };
      if (status.makeFailed === 'store') return { kind: 'card', mark: 'lock', title: appText('wallet.createTitle'), text: appText('walletAuto.noStore'), buttons: [] };
      if (!setup || !status.setup) return { kind: 'card', mark: 'wallet', title: appText('wallet.createTitle'), text: appText(status.phone && status.oldClient ? 'walletAuto.update' : 'walletAuto.phoneLine'), buttons: [] };
      return { kind: 'card', mark: 'wallet', title: appText('wallet.createTitle'), text: '', buttons: [{ act: 'create', label: appText('wallet.create'), primary: true }, { act: 'words', label: t('createWords') }] };
    }
    if (wallet.readOnly) return { kind: 'card', mark: 'lock', title: appText('wallet.readOnly'), text: '', buttons: setup && status.wordsEntry ? [{ act: 'words', label: t('createWords') }] : [] };
    if (status.lost) return { kind: 'card', mark: 'warning', title: appText('wallet.lost'), text: '', buttons: setup && status.wordsEntry ? [{ act: 'words', label: t('createWords') }] : [] };
    if (status.denied) return { kind: 'card', mark: 'warning', title: appText('wallet.denied'), text: '', buttons: [] };
    if (status.bioUnknown) return { kind: 'card', mark: 'warning', title: appText('wallet.bioWait'), text: '', buttons: [] };
    return null;
  }

  const PAIR_BLOCKS = ['noPair'];
  const gramOf = () => catalog().ton.find(isGram) || null;

  function model() {
    const w = walletState();
    if (w) return { mode: w.kind === 'wait' ? 'wait' : 'wallet', wallet: w, buttons: w.buttons || [] };
    if (st.run) return runModel(st.run);
    defaults();
    const from = st.from, to = st.to;
    const route = routeOf(from, to);
    const legs = legsOf(route, from, to);
    const units = unitsTyped(from);
    const have = heldUnits(from);
    const max = maxOf(from);
    let routeBlock = null;
    if (!route.ok) routeBlock = route.reason;
    else if (legs.some((leg) => leg.engine === 'ton') && DemoSwapState() !== 'open') routeBlock = DemoSwapState() === 'loading' ? 'whyTonWait' : 'whyTonClosed';
    let block = routeBlock;
    if (!block && have !== null && have === 0n) block = 'noBalance';
    else if (!block && have !== null && units > have) block = 'tooMuch';
    else if (!block && have !== null && isGram(from) && max !== null && units > max) block = 'gasLeft';
    const pairBlocked = PAIR_BLOCKS.includes(routeBlock);
    const sale = route.ok && route.engine === 'net' && route.side === 'sell';
    const bps = Number.isInteger(T().FEE_BPS) ? T().FEE_BPS : 100;
    const feeSteps = feeLegs(legs);
    const fp = priceOf(from), tp = priceOf(to);
    const amount = units > 0n ? T().fromUnits(units, decimalsOf(from) || 0) : 0;
    const out = !pairBlocked && amount > 0 && fp > 0 && tp > 0 ? amount * fp / tp * Math.pow(1 - bps / 10000, feeSteps) : 0;
    const rate = fp > 0 && tp > 0 ? fp / tp : 0;
    const usdFrom = amount > 0 && fp > 0 ? amount * fp : 0;
    const buttons = [{ act: 'pick-from' }, { act: 'pick-to' }, { act: 'flip' }];
    if (max !== null && max > 0n) buttons.push({ act: 'max' });
    const details = route.ok && !pairBlocked && (route.engine === 'route' || (rate > 0 && feeSteps > 0));
    if (details) buttons.push({ act: 'details' });
    buttons.push({ act: 'next', disabled: !!block });
    return { mode: 'pair', from, to, route, legs, units, have, max, block, routeBlock, pairBlocked, out, rate, usdFrom, sale, bps, feeSteps, details, buttons };
  }
  function runModel(run) {
    const buttons = [];
    if (run.phase === 'work') buttons.push({ act: 'track' });
    if (run.phase === 'ready' || run.phase === 'kept') buttons.push({ act: 'step2', primary: true }, { act: 'keep' });
    if (run.phase === 'unknown') buttons.push({ act: 'track', primary: true }, { act: 'keep', close: true });
    return { mode: 'route', run, buttons };
  }
  const DemoSwapState = () => (window.DemoSwap ? DemoSwap.state : 'failed');
  const priceOf = (a) => {
    const i = a && a.inst;
    return i && Number(i.price) > 0 && (i.isToken || i.priced === true) ? Number(i.price) : 0;
  };

  function usdText(v) {
    const f = CK.fmt;
    if (f && f.compactUsd && Math.abs(f.shown ? f.shown(v) : v) >= 1e6) return f.compactUsd(v);
    return f && f.usd ? f.usd(v) : `${(Math.round(v * 100) / 100).toFixed(2).replace('.', ',')} $`;
  }
  const pctText = (bps) => `${CK.fmt && CK.fmt.num ? CK.fmt.num(bps / 100, bps % 100 ? (bps % 10 ? 2 : 1) : 0) : String(bps / 100).replace('.', ',')}${CK.i18n && CK.i18n.lang === 'en' ? '' : '\u00a0'}%`;
  function sig4(v) {
    const f = CK.fmt;
    const a = Math.abs(v);
    if (!f || !f.num || !(a > 0) || !Number.isFinite(a) || a >= 1e9) return D().qty(v);
    const digits = Math.max(0, 3 - Math.floor(Math.log10(a)));
    const text = f.num(Math.round(v * Math.pow(10, digits)) / Math.pow(10, digits), digits);
    const point = f.decimal ? f.decimal() : ',';
    return digits > 0 && text.includes(point) ? text.replace(/0+$/, '').replace(new RegExp(`\\${point}$`), '') : text;
  }
  const PEGGED = /^(USDT|USDC|DAI|USDE|FDUSD|PYUSD|USDS|TUSD)$/;
  const pegged = (a) => isUsdt(a) || (!!a && PEGGED.test(String(a.sym || '').toUpperCase()));
  function amtText(v, a) {
    const abs = Math.abs(v);
    if (pegged(a) && abs >= 0.01 && abs < 1e9 && CK.fmt && CK.fmt.num) return CK.fmt.num(v, 2);
    return sig4(v);
  }
  const outText = (m) => (m.out > 0 ? `≈ ${amtText(m.out, m.to)}` : '0');
  const rateText = (m) => (m.rate > 0 ? t('rateLine', { a: m.from.sym, v: amtText(m.rate, m.to), b: m.to.sym }) : '');
  const isRoute = (m) => !!m.route && m.route.engine === 'route';
  const routeFeeText = (m) => {
    if (!isRoute(m) || !m.feeSteps) return '';
    return m.feeSteps > 1 ? t('feeSteps', { pct: pctText(m.bps * m.feeSteps), step: pctText(m.bps) }) : t('feeShort', { pct: pctText(m.bps) });
  };
  const SAID_BY_BUTTON = ['noBalance', 'tooMuch', 'whyTonWait', 'whyTonClosed'];
  const reasonShown = (m) => !!m.block && !SAID_BY_BUTTON.includes(m.block);
  function reasonText(m) {
    if (!reasonShown(m)) return '';
    if (m.block === 'gasLeft') return t('gasLeft', { v: qtyOf(GAS_RESERVE, m.from) });
    return t(m.block);
  }
  const reasonAria = (m) => (PAIR_BLOCKS.includes(m.block) ? t('noPair') : reasonText(m));
  const reasonIcon = (m) => (m.block === 'gasLeft' ? 'warning' : 'info');
  function nextLabel(m) {
    const sym = m.from.sym;
    if (!m.block) return t('next');
    if (m.block === 'noBalance') return t('btnNoBalance', { sym });
    if (m.block === 'tooMuch') return t('btnTooMuch', { sym });
    if (m.block === 'gasLeft') return t('btnGas');
    if (m.block === 'whyTonClosed') return t('btnClosed');
    if (m.block === 'whyTonWait') return t('btnWait');
    return t('btnPair');
  }
  const sizeOf = (text) => { const n = Array.from(String(text || '')).length; return n <= 8 ? 1 : n <= 11 ? 2 : n <= 14 ? 3 : 4; };
  function sizeTo(el, text) {
    let size = sizeOf(text);
    el.dataset.size = String(size);
    while (size < 5 && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) el.dataset.size = String(++size);
  }

  const logoOf = (a, size) => (a.inst && !a.logo ? CK.coinLogo(a.inst, size) : CK.coinLogo({ id: a.id === NATIVE ? 'ton' : a.id, sym: a.sym, neutral: true, logo: a.logo || null }, size));
  const balanceInner = (have, a) => (have === null ? '<i class="skel ex-bal-skel"></i>' : `${icon('wallet', { size: 14 })}<span>${esc(qtyOf(have, a))}</span>`);
  function balanceHtml(m) {
    if (m.max !== null && m.max > 0n) return `<button class="ex-bal ex-max press" type="button" data-ex="max" data-ex-bal aria-label="${esc(appText('common.max'))}">${balanceInner(m.have, m.from)}</button>`;
    return `<span class="ex-bal" data-ex-bal>${balanceInner(m.have, m.from)}</span>`;
  }
  function cardHtml(side, m) {
    const a = m[side];
    const from = side === 'from';
    return `
      <div class="ex-side ex-side--${side}">
        <div class="ex-top"><span class="ex-label">${esc(t(from ? 'give' : 'get'))}</span>${from ? balanceHtml(m) : ''}</div>
        <div class="ex-amt">${from
    ? `<input class="ex-input" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="0" aria-label="${esc(t('give'))}" value="${esc(st.text)}" data-size="${sizeOf(st.text)}">`
    : `<b class="ex-out${m.out > 0 ? '' : ' is-empty'}" data-ex-out aria-live="polite" data-size="${sizeOf(outText(m))}">${esc(outText(m))}</b>`}</div>
        <button class="ex-chip press" type="button" data-ex="pick-${side}" aria-label="${esc(t(from ? 'pickGiveAria' : 'pickGetAria'))}">${logoOf(a, 28)}<b>${esc(a.sym)}</b>${icon('chevron-down', { size: 16 })}</button>
        ${from ? `<div class="ex-foot"><span class="ex-usd" data-ex-usd="from">${m.usdFrom > 0 ? esc(`≈ ${usdText(m.usdFrom)}`) : ''}</span></div>` : ''}
      </div>`;
  }
  function rateHtml(m) {
    const priced = m.rate > 0;
    if (m.pairBlocked || (!priced && !m.details)) return '';
    const line = priced ? `<span data-ex-rate>${esc(rateText(m))}</span>` : '';
    if (!m.details) return `<p class="ex-rate">${line}</p>`;
    const open = !!st.details;
    const fee = m.feeSteps ? `<div class="fold-row"><span>${esc(appText('swap.serviceFee', { pct: '' }).trim())}</span><b data-ex-fee>${esc(pctText(m.bps * m.feeSteps))}</b></div>` : '';
    const steps = isRoute(m) ? m.route.steps.map((leg, i) => `<p class="fold-line ex-step">${esc(`${m.route.path[i].sym} → ${m.route.path[i + 1].sym}`)}</p>`).join('') : '';
    const routeFee = routeFeeText(m);
    return `
        <button class="fold-toggle ex-rate${routeFee ? ' ex-rate--route' : ''}${priced ? '' : ' ex-rate--bare'}" type="button" data-ex="details" aria-expanded="${open}" aria-controls="ex-details-body">${line}${icon('chevron-down', { size: 16 })}${routeFee ? `<small class="ex-dfee" data-ex-dfee>${esc(routeFee)}</small>` : ''}</button>
        <div class="fold-body ex-details-body" id="ex-details-body"${open ? '' : ' hidden'}>${fee}${steps}</div>`;
  }
  function reasonHtml(m) {
    const shown = reasonShown(m);
    return `<div class="ex-reason" data-ex-reason role="status"${shown ? ` aria-label="${esc(reasonAria(m))}"` : ' hidden'}><span class="ex-reason-icon" data-icon-name="${reasonIcon(m)}">${icon(reasonIcon(m), { size: 18 })}</span><div class="ex-reason-main"><p class="ex-reason-text" data-ex-why>${esc(reasonText(m))}</p></div></div>`;
  }
  function htmlOf(m, enter) {
    const form = `ex-form${enter ? ' ex-form--in' : ''}`;
    if (m.mode === 'wait') return `<div class="${form} ex-form--wait" aria-busy="true"><div class="ex-pair"><div class="ex-skel skel"></div><div class="ex-skel skel"></div></div><div class="ex-skel-rate skel"></div><div class="ex-skel-btn skel"></div></div>`;
    if (m.mode === 'wallet') {
      const w = m.wallet;
      const buttons = w.buttons.map((b) => (b.primary
        ? `<button class="btn btn--wide press" type="button" data-ex="${b.act}">${esc(b.label)}</button>`
        : `<button class="tk-link wallet-note-link press" type="button" data-ex="${b.act}">${esc(b.label)}</button>`)).join('');
      return `<div class="${form}"><div class="group wallet-card ex-wallet"><span class="wallet-card-mark">${icon(w.mark, { size: 26, fill: true })}</span><b>${esc(w.title)}</b>${w.text ? `<span>${esc(w.text)}</span>` : ''}${buttons}</div></div>`;
    }
    if (m.mode === 'route') return `<div class="${form}">${runHtml(m.run)}</div>`;
    return `
      <div class="${form}">
        <div class="ex-pair">
          ${cardHtml('from', m)}
          <button class="ex-flip press" type="button" data-ex="flip" aria-label="${esc(t('flip'))}">${icon('exchange', { size: 30, fill: true })}</button>
          ${cardHtml('to', m)}
        </div>
        ${rateHtml(m)}
        ${reasonHtml(m)}
        <button class="btn btn--wide press ex-next" type="button" data-ex="next"${m.block ? ' disabled' : ''}>${esc(nextLabel(m))}</button>
      </div>`;
  }

  const legText = (run, i) => `${run.path[i]} → ${run.path[i + 1]}`;
  function runHtml(run) {
    const n = run.steps.length;
    const gram = run.path[1];
    const got = run.got !== null && run.got !== undefined ? `${fieldOf(run.got, 9)} ${gram}` : '';
    let mark = 'clock', title = t('stepOf', { i: run.at + 1, n }), text = legText(run, run.at);
    if (run.phase === 'ready') {
      mark = 'check-circle';
      title = t('stepReady');
      text = got ? t(run.atLeast ? 'gotAtLeast' : 'got', { v: got }) : legText(run, 0);
    } else if (run.phase === 'kept') {
      mark = 'info';
      title = t('keptTitle');
      text = got ? t('keptText', { v: got }) : '';
    } else if (run.phase === 'unknown') {
      mark = 'info';
      title = appText('swap.unknown');
      text = t('stepLine', { i: run.at + 1, a: run.path[run.at], b: run.path[run.at + 1] });
    }
    const buttons = runModel(run).buttons.map((b) => {
      if (b.act === 'step2') return `<button class="btn btn--wide press" type="button" data-ex="step2">${esc(t('stepGo', { a: run.path[1], b: run.path[2] }))}</button>`;
      if (b.act === 'keep') return `<button class="tk-link wallet-note-link press" type="button" data-ex="keep">${esc(b.close ? appText('nav.close') : t('keep', { sym: gram }))}</button>`;
      if (b.primary) return `<button class="btn btn--wide press" type="button" data-ex="${b.act}">${esc(t('status'))}</button>`;
      return `<button class="tk-link wallet-note-link press" type="button" data-ex="${b.act}">${esc(t('status'))}</button>`;
    }).join('');
    return `<div class="group wallet-card ex-wallet ex-run" role="status"><span class="wallet-card-mark" data-run="${run.phase}">${icon(mark, { size: 28 })}</span><b>${esc(title)}</b>${text ? `<span class="ex-run-path">${esc(text)}</span>` : ''}${buttons}</div>`;
  }

  let place = null, shape = '', shown = false, drawnTurn = 0, waitTimer = 0, paintedBlock = null, paintedMode = null;
  const shapeOf = (m) => {
    if (m.mode === 'pair') return `pair|${m.from.key}|${m.to.key}|${m.max !== null && m.max > 0n}|${m.rate > 0}|${m.details}|${m.routeBlock || 'none'}|${m.route.engine || ''}`;
    if (m.mode === 'route') return `route|${m.run.phase}|${m.run.at}|${m.run.got === null || m.run.got === undefined ? '' : String(m.run.got)}`;
    return `${m.mode}|${JSON.stringify(m.wallet || {})}`;
  };
  function paint() {
    if (!place) return;
    checkRun();
    const m = model();
    const now = shapeOf(m);
    if (now !== shape) {
      shape = now;
      const enter = m.mode !== paintedMode;
      paintedMode = m.mode;
      place.innerHTML = htmlOf(m, enter);
      paintedBlock = m.block || null;
      const flip = $('.ex-flip', place);
      if (flip) {
        const turned = st.turn !== drawnTurn;
        flip.style.setProperty('--turns', String(turned ? drawnTurn : st.turn));
        if (turned && window.requestAnimationFrame) requestAnimationFrame(() => flip.style.setProperty('--turns', String(st.turn)));
        else flip.style.setProperty('--turns', String(st.turn));
        const pair = $('.ex-pair', place);
        if (turned && pair && !still()) {
          pair.classList.add('is-flipping');
          const done = () => pair.classList.remove('is-flipping');
          pair.addEventListener('animationend', done, { once: true });
          setTimeout(done, 400);
        }
        drawnTurn = st.turn;
      }
      const input = $('.ex-input', place);
      if (input) {
        if (window.DemoWallet && DemoWallet.amountField) DemoWallet.amountField(input);
        input.addEventListener('input', () => {
          if (window.DemoWallet && DemoWallet.fitFraction) DemoWallet.fitFraction(input, decimalsOf(st.from));
          st.text = input.value;
          const before = paintedBlock;
          const after = paintFigures();
          if (after && (after.block === 'tooMuch' || after.block === 'gasLeft') && after.block !== before) buzz('soft');
        });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
      }
    }
    clearTimeout(waitTimer);
    if (m.mode === 'wait') waitTimer = setTimeout(paint, 1500);
    paintFigures(m);
  }
  const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
  function setBalance(el, have, a) {
    if (!el) return;
    const key = have === null ? '' : String(have);
    if (el.dataset.v === key && el.childNodes.length) return;
    el.dataset.v = key;
    el.innerHTML = balanceInner(have, a);
  }
  function paintFigures(given) {
    if (!place) return null;
    const m = given || model();
    if (m.mode !== 'pair') return m;
    if (shapeOf(m) !== shape) { paint(); return m; }
    const out = $('[data-ex-out]', place), input = $('.ex-input', place), next = $('.ex-next', place);
    if (out) {
      const text = outText(m);
      out.classList.toggle('is-empty', !(m.out > 0));
      if (CK.roll) CK.roll(out, text, m.out > 0 ? 2 : undefined);
      else out.textContent = text;
      sizeTo(out, text);
    }
    if (input) sizeTo(input, input.value);
    setText($('[data-ex-usd="from"]', place), m.usdFrom > 0 ? `≈ ${usdText(m.usdFrom)}` : '');
    setBalance($('[data-ex-bal]', place), m.have, m.from);
    setText($('[data-ex-rate]', place), rateText(m));
    const reason = $('[data-ex-reason]', place);
    if (reason) {
      const on = reasonShown(m);
      reason.hidden = !on;
      if (on) reason.setAttribute('aria-label', reasonAria(m));
      else reason.removeAttribute('aria-label');
      setText($('[data-ex-why]', reason), reasonText(m));
      const mark = $('.ex-reason-icon', reason), name = reasonIcon(m);
      if (mark && mark.dataset.iconName !== name) {
        mark.dataset.iconName = name;
        mark.innerHTML = icon(name, { size: 18 });
      }
    }
    if (next) {
      next.disabled = !!m.block;
      setText(next, nextLabel(m));
    }
    paintedBlock = m.block || null;
    return m;
  }

  function pick(side) {
    const all = catalog();
    const ton = side === 'to' ? all.ton.filter((a) => !a.sellOnly) : all.ton, net = all.net;
    const list = ton.concat(net);
    const other = st[side === 'from' ? 'to' : 'from'];
    const current = st[side];
    const usdOf = (a) => { const have = heldUnits(a); return have ? T().fromUnits(have, decimalsOf(a) || 0) * priceOf(a) : 0; };
    const ordered = (items, start) => {
      const rows = items.map((a, i) => ({ a, i: start + i, have: heldUnits(a), usd: usdOf(a) }));
      const held = rows.filter((r) => r.have);
      return held.sort((x, y) => y.usd - x.usd || x.i - y.i).concat(rows.filter((r) => !r.have));
    };
    const subOf = (a) => {
      if (other && other.key !== a.key && !(side === 'from' ? routeOf(a, other) : routeOf(other, a)).ok) return `${a.sym} · ${t('noPairWith', { sym: other.sym })}`;
      return a.sym;
    };
    CK.sheet.open({
      title: () => t(side === 'from' ? 'pickGive' : 'pickGet'),
      detents: [CK.sheet.overviewDetent()],
      build(b, sheet) {
        const row = ({ a, i, have }) => {
          const on = !!current && current.key === a.key;
          const right = have ? `<span class="asset-right"><b>${esc(qtyOf(have, a))}</b></span>` : '';
          const dim = side === 'from' && have === 0n;
          return `<button class="cell market-row press-row${dim ? ' is-dim' : ''}" type="button" role="radio" data-i="${i}" data-find="${esc(`${a.sym} ${a.name}`.toLowerCase())}" aria-checked="${on}">${logoOf(a, 40)}<span class="market-name"><b>${esc(a.name)}</b><span class="w-row-sub"><span>${esc(subOf(a))}</span></span></span>${right}<span class="ex-check${on ? '' : ' ex-check--off'}" aria-hidden="true">${on ? icon('check', { size: 20 }) : ''}</span></button>`;
        };
        const group = (title, items, start) => (items.length ? `<section class="ex-sec" data-ex-sec><h3 class="ex-group">${esc(t(title))}</h3><div class="group sheet-list list--free" role="radiogroup" aria-label="${esc(t(title))}">${ordered(items, start).map(row).join('')}</div></section>` : '');
        const search = `<label class="search ex-search">${icon('search', { size: 16 })}<input type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}" data-ex-find><button class="tk-clear" type="button" aria-label="${esc(CK.t('token.clear'))}" data-ex-clear hidden>${icon('close-circle', { fill: true, size: 18 })}</button></label>`;
        const empty = CK.emptyState({ icon: 'search', title: t('none'), attrs: `data-ex-empty${list.length ? ' hidden' : ''}` });
        b.classList.add('ex-pick');
        b.innerHTML = list.length ? search + group('groupTon', ton, 0) + group('groupOther', net, ton.length) + empty : empty;
        b.addEventListener('click', (e) => {
          const clear = e.target.closest('[data-ex-clear]');
          if (clear && clear.dataset && 'exClear' in clear.dataset) {
            e.preventDefault();
            const field = b.querySelector('[data-ex-find]');
            if (!field) return;
            field.value = '';
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.focus();
            return;
          }
          const hit = e.target.closest('[data-i]');
          if (!hit) return;
          const a = list[Number(hit.dataset.i)];
          if (!a) return;
          buzz('selection');
          choose(side, a);
          sheet.close();
        });
        b.addEventListener('input', (e) => {
          const field = e.target;
          if (!field || !field.matches || !field.matches('[data-ex-find]')) return;
          const q = field.value.trim().toLowerCase();
          const clearBtn = b.querySelector('[data-ex-clear]');
          if (clearBtn) clearBtn.hidden = !field.value;
          let any = false;
          b.querySelectorAll('[data-ex-sec]').forEach((sec) => {
            let left = 0;
            sec.querySelectorAll('[data-find]').forEach((r) => {
              const hit = !q || r.dataset.find.includes(q);
              r.hidden = !hit;
              if (hit) left += 1;
            });
            sec.hidden = !left;
            if (left) any = true;
          });
          const none = b.querySelector('[data-ex-empty]');
          if (none) none.hidden = any;
        });
      }
    });
  }
  const receivable = (a, from) => (a && a.sellOnly ? (isGram(from) ? catalog().ton.find(isUsdt) || null : gramOf()) : a);
  function choose(side, a) {
    const other = side === 'from' ? 'to' : 'from';
    const was = `${st.from && st.from.key}|${st.to && st.to.key}`;
    if (st[other] && st[other].key === a.key) st[other] = st[side];
    if (side === 'from' && (!st.from || st.from.key !== a.key)) st.text = '';
    st[side] = a;
    st.to = receivable(st.to, st.from);
    if (`${st.from && st.from.key}|${st.to && st.to.key}` !== was) st.details = false;
    paint();
  }

  function opened(before) {
    if (CK.sheet.top && CK.sheet.top !== before) return true;
    CK.toast(esc(t('busy')), { icon: 'info', tone: 'accent' });
    return false;
  }
  const actions = {
    'pick-from': () => pick('from'),
    'pick-to': () => pick('to'),
    flip() {
      buzz('selection');
      const was = st.from;
      st.from = st.to;
      st.to = receivable(was, st.from);
      st.turn += 1;
      const dec = decimalsOf(st.from);
      if (st.text && Number.isInteger(dec)) st.text = dec > 0 ? st.text.replace(new RegExp(`([.,]\\d{${dec}})\\d+$`), '$1') : st.text.replace(/[.,]\d*$/, '');
      st.details = false;
      paint();
    },
    max() {
      const max = maxOf(st.from);
      if (max === null || max <= 0n) return;
      buzz('selection');
      st.text = fieldOf(max, decimalsOf(st.from));
      const input = place && $('.ex-input', place);
      if (input) input.value = st.text;
      paintFigures();
    },
    details() {
      buzz('selection');
      st.details = !st.details;
      const btn = place && $('button.ex-rate', place), body = place && $('.ex-details-body', place);
      if (!btn || !body) { paint(); return; }
      btn.setAttribute('aria-expanded', String(st.details));
      const next = $('.ex-next', place);
      const before = next && !still() ? next.getBoundingClientRect().top : null;
      body.hidden = !st.details;
      if (before !== null && next.animate) {
        const dy = before - next.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) next.animate([{ transform: `translate3d(0,${dy}px,0)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    },
    next() {
      const m = model();
      if (m.mode !== 'pair' || m.block) return;
      buzz('light');
      const amount = m.units > 0n ? st.text : '';
      if (!isRoute(m)) {
        const before = CK.sheet.top;
        openLeg(m.legs[0], amount);
        opened(before);
        return;
      }
      const one = oneSheet(m.route);
      if (one) {
        const before = CK.sheet.top;
        one(amount);
        opened(before);
        return;
      }
      startRoute(m, amount);
    },
    step2() {
      const run = st.run;
      if (!run || (run.phase !== 'ready' && run.phase !== 'kept') || run.reading) return;
      buzz('light');
      const got = run.got;
      if (got === null || got === undefined) {
        launch(1, '');
        return;
      }
      const go = (have) => launch(1, fieldOf(step2Units(got, have), decimalsOf(run.gram) || 9));
      if (D().balancesAt > run.doneAt) {
        go(heldUnits(run.gram));
        return;
      }
      run.reading = true;
      const job = window.DemoSwap && typeof DemoSwap.loadBalances === 'function' ? DemoSwap.loadBalances() : null;
      Promise.resolve(job).catch(() => null).then((b) => {
        if (st.run !== run) return;
        run.reading = false;
        const row = b && Array.isArray(b.rows) ? b.rows.find((r) => r && r.id === NATIVE) : null;
        go(row && typeof row.units === 'bigint' ? row.units : null);
      });
    },
    keep() {
      buzz('selection');
      endRun();
    },
    track() {
      const run = st.run;
      if (!run) return;
      const eng = engineOf(run.steps[run.at]);
      if (eng && typeof eng.openTrack === 'function') eng.openTrack(run.phase === 'unknown' && !eng.pending ? run.done || undefined : undefined);
    },
    create: () => window.DemoWalletSetup && DemoWalletSetup.openCreate(),
    words: () => window.DemoWalletSetup && DemoWalletSetup.openImport(true)
  };

  function step2Units(got, have) {
    if (typeof have !== 'bigint' || have < got) return got;
    const max = have > GAS_RESERVE ? have - GAS_RESERVE : 0n;
    return max > 0n && got > max ? max : got;
  }

  const engineOf = (leg) => (leg.engine === 'ton' ? window.DemoSwap : window.DemoNets);
  const legAsset = (a) => ({ id: a.id, sym: a.sym, name: a.name, logo: a.logo, decimals: decimalsOf(a) || 0, inst: a.inst });
  function openLeg(leg, amount) {
    const opts = amount ? { amount } : undefined;
    if (leg.engine === 'ton') DemoSwap.openPair(legAsset(leg.from), legAsset(leg.to), opts);
    else DemoNets.open(leg.inst, leg.side, { ...(opts || {}), ...(leg.pay === 'usdt' ? { pay: 'usdt' } : {}) });
  }

  function oneSheet(route) {
    if (!CK.wallet || typeof CK.wallet.signRoute !== 'function') return null;
    const [first, second] = route.steps;
    if (first.engine !== 'ton' || isGram(first.from)) return null;
    if (second.engine === 'ton' && window.DemoSwap) return (amount) => DemoSwap.openPair(legAsset(first.from), legAsset(second.to), { ...(amount ? { amount } : {}), via: true });
    if (second.engine === 'net' && second.side === 'buy' && window.DemoNets) return (amount) => DemoNets.open(second.inst, 'buy', { ...(amount ? { amount } : {}), pay: legAsset(first.from) });
    return null;
  }
  const RUN_LOOK_MS = 500;
  const NOT_MOVED = new Set(['failed', 'rejected', 'expired', 'refunded']);
  let runTimer = 0;
  function startRoute(m, amount) {
    const leg = m.route.steps[0];
    const eng = engineOf(leg);
    if (eng && eng.pending) {
      const before = CK.sheet.top;
      openLeg(leg, amount);
      opened(before);
      return;
    }
    st.run = { steps: m.route.steps, path: m.route.path.map((a) => a.sym), gram: m.route.path[1], at: 0, phase: 'open', got: null, atLeast: false, watch: null, done: null, doneAt: 0, reading: false };
    launch(0, amount);
  }
  function launch(i, amount) {
    const run = st.run;
    if (!run) return;
    const leg = run.steps[i];
    const eng = engineOf(leg);
    const before = CK.sheet.top;
    if (eng && eng.pending) {
      openLeg(leg, amount);
      opened(before);
      return;
    }
    run.at = i;
    run.phase = 'open';
    openLeg(leg, amount);
    if (!opened(before)) {
      leftStep();
      paint();
      return;
    }
    run.watch = { eng, sheet: CK.sheet.top, rec: null };
    paint();
    lookAgain();
  }
  function leftStep() {
    const run = st.run;
    if (!run) return;
    run.watch = null;
    if (run.at === 0) st.run = null;
    else run.phase = 'kept';
  }
  function endRun() {
    clearTimeout(runTimer);
    st.run = null;
    st.text = '';
    st.details = false;
    paint();
  }
  function receivedOf(leg, rec) {
    const units = (v) => (typeof v === 'string' && /^[1-9]\d*$/.test(v) ? BigInt(v) : null);
    if (leg.engine === 'ton') {
      const got = units(rec.got);
      return { got: got !== null ? got : units(rec.ask && rec.ask.min), atLeast: got === null };
    }
    return { got: units(rec.got && rec.got.min), atLeast: true };
  }
  const matches = (leg, rec) => (leg.engine === 'ton'
    ? !!rec.offer && !!rec.ask && rec.offer.id === leg.from.id && rec.ask.id === leg.to.id
    : rec.kind === leg.side);
  const sheetGone = (sheet) => !sheet || (CK.sheet.top !== sheet && !(sheet.el && sheet.el.isConnected));
  function checkRun() {
    const run = st.run;
    const w = run && run.watch;
    if (!w) return false;
    const rec = (w.eng && w.eng.pending) || null;
    const leg = run.steps[run.at];
    if (!w.rec) {
      if (rec && matches(leg, rec)) {
        w.rec = rec;
        run.phase = 'work';
        return true;
      }
      if (!rec && sheetGone(w.sheet)) {
        leftStep();
        return true;
      }
      return false;
    }
    if (rec === w.rec) return false;
    const ok = w.rec.phase === 'success';
    run.watch = null;
    if (!ok && !NOT_MOVED.has(w.rec.phase)) {
      run.phase = 'unknown';
      run.done = w.rec;
      st.text = '';
      return true;
    }
    if (run.at === 0) {
      if (!ok) { st.run = null; return true; }
      const got = receivedOf(leg, w.rec);
      run.phase = 'ready';
      run.got = got.got;
      run.atLeast = got.atLeast;
      run.doneAt = Date.now();
      st.text = '';
      return true;
    }
    if (ok) {
      st.run = null;
      st.text = '';
      st.details = false;
    } else run.phase = 'kept';
    return true;
  }
  function lookAgain() {
    clearTimeout(runTimer);
    if (!st.run || !st.run.watch) return;
    runTimer = setTimeout(() => {
      if (checkRun()) paint();
      lookAgain();
    }, RUN_LOOK_MS);
  }

  function mount(pane, ctx) {
    const screen = CK.screen({ title: CK.tr ? CK.tr('tab.exchange') : t('give'), compactTop: true, avatar: ctx.openProfile, headExtra: ctx.statusHtml });
    screen.el.classList.add('ex-screen');
    screen.body.innerHTML = '<div class="screen-pad ex-tab"></div>';
    place = screen.body.firstElementChild;
    place.addEventListener('click', (e) => {
      const hit = e.target.closest('[data-ex]');
      if (!hit) {
        if (e.target.closest('.ex-side--from') && !e.target.closest('.ex-input')) {
          const input = $('.ex-input', place);
          if (input) input.focus();
        }
        return;
      }
      if (hit.disabled) return;
      const fn = actions[hit.dataset.ex];
      if (fn) fn();
    });
    CK.i18n.bind(place, () => { shape = ''; paint(); });
    ctx.makeStack(ctx.id || 'exchange', screen);
    return { onShow };
  }
  function onShow() {
    if (!shown) {
      shown = true;
      const again = () => { if (place && place.isConnected !== false) paint(); };
      if (D() && D().onBalances) D().onBalances(again);
      if (T() && T().onWallet) T().onWallet(() => { clearTimeout(runTimer); st.run = null; st.from = null; st.to = null; st.text = ''; st.details = false; shape = ''; again(); });
      if (window.DemoSwap && DemoSwap.onChange) DemoSwap.onChange(again);
      if (window.DemoNets && DemoNets.onChange) DemoNets.onChange(again);
      if (CK.wallet && CK.wallet.ready) CK.wallet.ready.then(again, again);
      let tick = 0;
      if (CK.market && CK.market.onTicker) CK.market.onTicker(() => { if (!tick) tick = setTimeout(() => { tick = 0; paintFigures(); }, 250); });
    }
    paint();
  }

  window.DemoExchange = {
    mount,
    routeOf,
    buildRoute,
    _test: { S, st, catalog, model, htmlOf, actions, choose, heldUnits, maxOf, checkRun, legsOf, feeLegs, step2Units, setPlace: (el) => { place = el; shape = ''; } }
  };
})();
