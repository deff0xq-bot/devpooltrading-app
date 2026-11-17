(function () {
  'use strict';
  const { icon, t: tx } = CK;
  const { L, LA } = CK.i18n;
  const esc = CK.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  CK.i18n.add({
    'welcome.aria': ['Знакомство с приложением', 'App tour', 'Знайомство із застосунком', 'Қосымшамен танысу'],
    'welcome.slide': ['{n} из {count}', '{n} of {count}', '{n} з {count}', '{count} ішінен {n}'],
    'welcome.next': ['Далее', 'Next', 'Далі', 'Әрі қарай'],
    'welcome.start': ['Начать', 'Start', 'Почати', 'Бастау'],
    'welcome.tradeTitle': ['Мультичейн-торговля', 'Multichain trading', 'Мультичейн-торгівля', 'Мультичейн сауда'],
    'welcome.tradeText': [
      'Торгуйте токенами в TON, Ethereum, Solana, BNB Chain и других сетях',
      'Trade tokens on TON, Ethereum, Solana, BNB Chain and other networks',
      'Торгуйте токенами в TON, Ethereum, Solana, BNB Chain та інших мережах',
      'TON, Ethereum, Solana, BNB Chain және басқа желілерде токен саудалаңыз'
    ],
    'welcome.walletTitle': ['Ваш кошелёк в Telegram', 'Your wallet in Telegram', 'Ваш гаманець у Telegram', 'Әмияныңыз Telegram-да'],
    'welcome.walletText': ['Ключ хранится только на вашем устройстве', 'Your key stays on your device only', 'Ключ зберігається лише на вашому пристрої', 'Кілт тек сіздің құрылғыңызда сақталады'],
    'welcome.swapTitle': ['Обмен монет', 'Swap coins', 'Обмін монет', 'Монета айырбасы'],
    'welcome.swapText': ['Наша комиссия {pct}, и вы видите её до подтверждения', 'Our fee is {pct}, and you see it before you confirm', 'Наша комісія {pct}, і ви бачите її до підтвердження', 'Біздің комиссия {pct}, оны растағанға дейін көресіз'],
    'welcome.stopTitle': ['Стоп на токенах TON', 'Stops on TON tokens', 'Стоп на токенах TON', 'TON токендеріндегі стоп'],
    'welcome.stopText': ['Цена дошла до стопа, токен продастся сам, а бот напишет', 'The price hits your stop, the token sells and the bot tells you', 'Ціна дійшла до стопу, токен продасться сам, а бот напише', 'Баға стопқа жетсе, токен өзі сатылады, бот хабарлайды'],
    'welcome.refTitle': ['Реферальная программа', 'Referral program', 'Реферальна програма', 'Рефералдық бағдарлама'],
    'welcome.refShare': [
      'Вы получаете {pct} нашей комиссии с обменов друзей в сети TON',
      'You get {pct} of our fee on your friends\' TON swaps',
      'Ви отримуєте {pct} нашої комісії з обмінів друзів у мережі TON',
      'Достар TON-да айырбастаса, комиссиямыздың {pct} сізге түседі'
    ],
    'welcome.refText': ['Пригласите друзей по своей ссылке', 'Invite friends with your link', 'Запросіть друзів за своїм посиланням', 'Достарды өз сілтемеңізбен шақырыңыз']
  });

  const CLOUD_KEY = 'welcome';
  const LOCAL_KEY = 'ck-welcome';
  const SEEN = '1';
  const CLOUD_WAIT_MS = 2500;
  const SDK_WAIT_MS = 1500;
  const WALLET_WAIT_MS = 4000;
  const POLL_MS = 100;
  const SPLASH_WAIT_MS = 5000;
  const FLICK = 380;
  const TURN_SHARE = .22;
  const TRACK = { stiffness: 170, damping: 26.077, ms: 560 };
  const WORDS_DELAY = 60;
  const PHONE_DELAY = 130;
  const FOCUS_DELAY = 230;
  const OPEN_MS = 240;
  const LAYOUT = 390;
  const PHONE_SHARE = .78;
  const PHONE_MIN = 248;
  const PHONE_MAX = 320;
  const BEZEL = 8;
  const FOCUS_SHARE = .9;
  const FOCUS_MAX = .92;
  const FOCUS_TOP_MIN = 36;
  const FOOT_LAP = 6;
  const FOCUS_GAP = 10;
  const FIT_MIN = .7;
  const WORDS_GAP = 8;

  const M = () => CK.motion || null;
  const reduced = () => {
    const m = M();
    if (m) return !!m.reduce;
    return !!(CK.reducedMotion && CK.reducedMotion());
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


  function localSeen() {
    try { return localStorage.getItem(LOCAL_KEY) === SEEN; } catch (_) { return false; }
  }
  function keepLocal() {
    try { localStorage.setItem(LOCAL_KEY, SEEN); } catch (_) { }
  }
  function cloud() {
    const app = CK.tg && CK.tg.app;
    try { return app && app.CloudStorage && typeof app.isVersionAtLeast === 'function' && app.isVersionAtLeast('6.9') ? app.CloudStorage : null; } catch (_) { return null; }
  }
  async function sdkCloud() {
    const until = Date.now() + SDK_WAIT_MS;
    while (!cloud() && CK.tg && CK.tg.inside && !(CK.tg.app) && Date.now() < until) await wait(POLL_MS);
    return cloud();
  }
  function cloudSeen(store) {
    if (!store) return Promise.resolve(null);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), CLOUD_WAIT_MS);
      const answer = (v) => { clearTimeout(timer); resolve(v); };
      try { store.getItem(CLOUD_KEY, (err, value) => answer(err ? null : value === SEEN)); } catch (_) { answer(null); }
    });
  }
  function keepCloud() {
    const store = cloud();
    try { if (store) store.setItem(CLOUD_KEY, SEEN, () => {}); } catch (_) { }
  }
  function remember() {
    keepLocal();
    keepCloud();
  }
  async function hadWallet() {
    const W = CK.wallet;
    if (!W) return null;
    let settled = false;
    if (W.ready && typeof W.ready.then === 'function') W.ready.then(() => { settled = true; }, () => { settled = true; });
    const until = Date.now() + WALLET_WAIT_MS;
    for (;;) {
      const had = W.hadAtLaunch;
      if (had === true || had === false) return had;
      if (settled || Date.now() >= until) return null;
      await wait(POLL_MS);
    }
  }
  async function decide(o) {
    if (localSeen()) return false;
    const seen = await cloudSeen(await sdkCloud());
    if (seen === true) {
      keepLocal();
      return false;
    }
    if (o.newcomersOnly !== false && (await hadWallet()) === true) {
      keepLocal();
      return false;
    }
    return !localSeen();
  }


  const D = () => window.DemoData;
  const USDT_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const feeBps = () => (CK.ton && Number.isInteger(CK.ton.FEE_BPS) ? CK.ton.FEE_BPS : 100);
  const pctText = (bps) => `${CK.fmt.num(bps / 100, bps % 100 ? (bps % 10 ? 2 : 1) : 0)}${CK.i18n.lang === 'en' ? '' : ' '}%`;
  const need = (ok, what) => { if (!ok) throw new Error('welcome: no ' + what); };
  const coinOf = (id) => {
    const d = D();
    const c = d && d.byId ? d.byId[id] : null;
    need(c && c.price > 0, id);
    return c;
  };

  const HELD = [['ton', 120], ['eth', .05], ['sol', .5]];
  const ACTIONS = [['deposit', 'action.deposit', 'deposit'], ['withdraw', 'action.withdraw', 'withdraw'], ['exchange', 'action.swap', ''], ['history', 'common.history', 'history']];
  const CHIPS = { stop: [5, 10, 20], take: [10, 20, 50] };
  const NETS = [['ton', 'TON', 'ton'], ['eth', 'Ethereum', 'eth'], ['solana', 'Solana', 'sol'], ['bsc', 'BNB Chain', 'bnb']];
  const SORTS = ['sort.top', 'trade.segUp', 'trade.segDown', 'filter.fav'];
  const CHART_H = 200;

  const netMark = (id, file) => {
    const N = window.DemoNets;
    const own = N && typeof N.netMark === 'function' ? N.netMark(id) : null;
    return own || (CK.COIN_LOGOS && CK.COIN_LOGOS[file]) || `kit/logos/${file}.svg`;
  };
  const netName = (id, name) => (CK.market && typeof CK.market.networkName === 'function' && CK.market.networkName(id)) || name;
  const markHtml = (url, name) => `<span class="tk-logo"><span class="tk-tile" aria-hidden="true">${esc(CK.initials(name))}</span><img class="tk-img is-on is-instant" alt="" draggable="false" decoding="sync" src="${esc(url)}"></span>`;

  const SCREENS = {
    trade() {
      need(typeof CK.sparkline === 'function' && typeof CK.changePill === 'function' && typeof CK.initials === 'function', 'Торговля');
      const d = D();
      need(d && Array.isArray(d.coins), 'coins');
      const nets = NETS.map(([id, name, file]) => ({ name: netName(id, name), mark: netMark(id, file) }));
      const movers = d.coins.filter((c) => c.id !== 'usdt' && c.price > 0 && typeof c.change === 'number' && Array.isArray(c.series) && c.series.length > 1)
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
      need(movers.length > 1, 'movers');
      const tone = (c) => (CK.changeFlat && CK.changeFlat(c.change) ? 'flat' : c.change > 0 ? 'up' : 'down');
      const moverHtml = (c, i) => `
              <button class="card coin-card tk-mover press" type="button">
                <span class="tk-mover-top">${CK.coinLogo(c, 36)}<span class="tk-mover-sym">${esc(c.sym)}</span>${CK.changePill(c.change, { plain: true })}</span>
                <span class="coin-card-price">${esc(CK.fmt.price(c.price))}</span>
                <span class="tk-mover-chart is-${tone(c)}" aria-hidden="true">${CK.sparkline(c.series, { width: 200, height: 58, pad: [6, 14], cls: 'tk-mover-line', id: `wc-mover-${i}`, dot: false })}</span>
              </button>`;
      const sorts = SORTS.map((key, i) => `<button class="tk-sort-btn" type="button" aria-checked="${!i}"><span class="tk-sort-label" data-text="${esc(tx(key))}">${esc(tx(key))}</span></button>`).join('');
      const netRow = (n, i) => `<div class="cell tk-net-row${i ? '' : ' is-selected'}">${markHtml(n.mark, n.name)}<span class="cell-main"><span class="cell-title">${esc(n.name)}</span></span>${icon('check', { size: 20, className: 'cell-check' })}</div>`;
      return {
        scope: 'tk-feed',
        title: tx('tab.trade'),
        html: `
          <div class="tk-head">
            <div class="screen-pad tk-find">
              <label class="search">${icon('search', { size: 19 })}<input class="tk-search" type="search" placeholder="${esc(tx('token.searchPh'))}" readonly tabindex="-1"></label>
              <button class="tk-netchip press" type="button">${markHtml(nets[0].mark, nets[0].name)}<span class="tk-netchip-label">${esc(tx('common.network'))}</span>${icon('chevron-down', { size: 16 })}</button>
            </div>
            <div class="tk-blocks"><section class="tk-movers"><div class="tk-movers-car carousel carousel--start at-start"><div class="carousel-track">${movers.map(moverHtml).join('')}</div></div></section></div>
          </div>
          <div class="screen-pad tk-sort-pad"><div class="tk-sort"><span class="tk-sort-pill" aria-hidden="true"></span>${sorts}</div></div>`,
        focus: { from: '.tk-sort-pad', rise: 4, at: .5, html: `<div class="group wc-card"><b class="wc-card-title">${esc(tx('common.network'))}</b><div class="sheet-list tk-net-list">${nets.map(netRow).join('')}</div></div>` },
        setup(real) {
          const pill = $('.tk-sort-pill', real), first = $('.tk-sort-btn', real);
          if (pill && first && first.offsetWidth > 0) {
            pill.style.width = `${first.offsetWidth}px`;
            pill.style.transform = `translate3d(${first.offsetLeft}px, 0, 0)`;
          }
        }
      };
    },

    wallet() {
      const cards = CK.cards;
      need(cards && typeof cards.balance === 'function' && typeof CK.roll === 'function', 'balance card');
      const rows = HELD.map(([id, amount]) => { const coin = coinOf(id); return { coin, amount, usd: amount * coin.price }; });
      const total = rows.reduce((sum, r) => sum + r.usd, 0);
      const before = rows.reduce((sum, r) => sum + r.usd / (1 + (Number(r.coin.change) || 0) / 100), 0);
      const day = { pnl: total - before, pnlPct: before > 0 ? (total / before - 1) * 100 : 0 };
      const swapGlyph = CK.ICONS && CK.ICONS.exchange ? 'exchange' : 'swap';
      const actions = ACTIONS.map(([id, key, glyph]) => `
            <button class="action press" type="button" data-action="${id}"><span class="action-disc">${icon(glyph || swapGlyph)}</span><span class="action-label">${esc(tx(key))}</span></button>`).join('');
      const assets = rows.map((r) => `
            <button class="cell asset-row press-row" type="button" data-coin="${esc(r.coin.id)}">
              <span class="coin-with-net">${CK.coinLogo(r.coin, 40)}</span>
              <span class="market-name"><b class="asset-name"><span>${esc(r.coin.name)}</span></b><span class="asset-amount">${esc(D().qty(r.amount))} ${esc(r.coin.sym)}</span></span>
              <span class="asset-right"><b>${esc(CK.fmt.usd(r.usd))}</b></span>
            </button>`).join('');
      return {
        scope: 'screen--wallet',
        html: `
          <div class="wallet-top">
            <div class="screen-pad">${cards.balance({ label: '', value: 0, pnl: 0, pnlPct: 0, eyeBy: true })}</div>
            <div class="screen-pad action-row pf-actions" data-n="${ACTIONS.length}">${actions}</div>
          </div>
          <div class="wallet-main"><section class="section"><div class="group list--free pf-assets">${assets}</div></section></div>`,
        focus: { clone: '.pf-assets', rise: -10, at: .5 },
        setup(real) {
          const card = $('.balance', real), value = $('.balance-value', real);
          const eye = $('.balance-eye', real);
          if (eye) eye.remove();
          CK.roll(value, CK.fmt.usd(total));
          if (cards.dressBalance) cards.dressBalance(value);
          if (cards.setBalanceDay) cards.setBalanceDay(card, day);
        }
      };
    },

    swap() {
      const X = window.DemoExchange && DemoExchange._test;
      need(X && typeof X.htmlOf === 'function', 'Обмен');
      const ton = coinOf('ton'), usdt = coinOf('usdt');
      const from = { key: 'ton:TON', engine: 'ton', id: 'TON', sym: ton.sym, name: ton.name, decimals: 9, inst: ton, logo: null };
      const to = { key: 'ton:' + USDT_RAW, engine: 'ton', id: USDT_RAW, sym: usdt.sym, name: usdt.name, decimals: 6, inst: usdt, logo: null };
      const bps = feeBps();
      const give = 10, have = HELD[0][1];
      const nano = (v) => BigInt(Math.round(v * 1e9));
      const rate = ton.price / usdt.price;
      const model = {
        mode: 'pair', from, to, route: { ok: true, engine: 'ton' }, legs: [{ engine: 'ton', from, to }],
        units: nano(give), have: nano(have), max: nano(have - .35), block: null, routeBlock: null, pairBlocked: false,
        out: give * rate * (1 - bps / 10000), rate, usdFrom: give * ton.price, sale: false, bps, feeSteps: 1, details: true, buttons: []
      };
      return {
        scope: 'ex-screen',
        title: tx('tab.exchange'),
        html: `<div class="screen-pad ex-tab">${X.htmlOf(model, false)}</div>`,
        focus: {
          from: '.ex-next', below: true, at: .6,
          make(real) {
            const rate = $('.ex-rate', real), fold = $('.fold-body', real);
            if (!rate || !fold) return null;
            const el = CK.el('<div class="group wc-card"><div class="ex-form"></div></div>');
            const line = rate.cloneNode(true), open = fold.cloneNode(true);
            const toggle = line.matches('.fold-toggle') ? line : $('.fold-toggle', line);
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'true');
              toggle.removeAttribute('aria-controls');
            }
            open.removeAttribute('hidden');
            el.firstElementChild.append(line, open);
            return el;
          }
        },
        setup(real) {
          const input = $('.ex-input', real);
          need(input, 'Обмен form');
          const typed = CK.fmt.num(give, 0);
          input.value = typed;
          input.setAttribute('value', typed);
          input.setAttribute('readonly', '');
        }
      };
    },

    stop() {
      const T = window.DemoTrade;
      need(typeof CK.chart === 'function' && typeof CK.changePill === 'function' && typeof CK.segmented === 'function', 'card');
      need(T && typeof T.cardLevels === 'function', 'levels');
      const inst = coinOf('not'), ton = coinOf('ton');
      const series = (Array.isArray(inst.series) ? inst.series : []).filter((v) => v > 0);
      need(series.length > 1, 'price line');
      const last = series[series.length - 1], low = Math.min(...series);
      const inside = (price) => price > low + (last - low) * .12;
      const chipPct = CHIPS.stop.find((p) => inside(last * (1 - p / 100))) || 0;
      const stopAt = chipPct ? last * (1 - chipPct / 100) : low + (last - low) * .45;
      const drawn = T.cardLevels({ order: { stop: stopAt / ton.price, now: last / ton.price }, cost: null, price: last, gramUsd: ton.price });
      const change = Number(inst.change) || 0;
      const delta = last - last / (1 + change / 100);
      const unit = ton.sym;
      const frames = D() && Array.isArray(D().FRAMES) ? D().FRAMES.map((f) => ({ value: f.value, label: f.label })) : [];
      need(frames.length > 1, 'periods');
      const rowHtml = (kind) => `
          <div class="or-row" data-kind="${kind}">
            <span class="or-cap"><span class="or-name">${esc(tx(`orders.${kind}`))}</span><span class="or-usd"></span></span>
            <div class="or-ctl">
              <div class="or-chips" role="group"><i class="or-thumb"></i>${CHIPS[kind].map((p) => `<button class="or-chip" type="button" aria-pressed="false" data-pct="${p}">${kind === 'stop' ? '−' : '+'}${p}%</button>`).join('')}</div>
              <span class="or-box"><input class="or-field" inputmode="decimal" autocomplete="off" placeholder="${esc(tx('orders.price'))}, ${esc(unit)}" readonly><i class="or-unit">${esc(unit)}</i></span>
            </div>
          </div>`;
      return {
        scope: 'tk-card',
        html: `
          <div class="wc-nav">
            <span class="navbtn navbtn-back">${icon('chevron-left', { size: 22 })}</span>
            <span class="detail-title"><span class="detail-logo">${CK.coinLogo(inst, 28)}</span><span class="detail-names"><span class="detail-name">${esc(inst.sym)}</span><span class="detail-net">${esc(netName(NETS[0][0], NETS[0][1]))}</span></span></span>
            <span class="navbtn">${icon('star', { size: 22 })}</span>
          </div>
          <div class="screen-pad detail-head">
            <div class="detail-price-slot"><div class="detail-price"><span class="detail-roll">${esc(CK.fmt.price(last))}</span></div></div>
            <div class="detail-meta"><span class="detail-change">${CK.changePill(change)}</span><span class="detail-delta ${delta < 0 ? 'is-down' : 'is-up'}">${delta < 0 ? '−' : '+'}${esc(CK.fmt.price(Math.abs(delta)))}</span><span class="detail-frame">${esc(tx('tk.per1d'))}</span></div>
          </div>
          <div class="detail-chart"></div>
          <div class="screen-pad detail-frames-row"><div class="detail-frames"></div></div>`,
        focus: { from: '.detail-frames-row', rise: 2, at: .58, html: `<div class="group wc-card sw-status"><b class="wc-card-title">${esc(tx('detail.orders'))}</b><div class="sw-terms"><div class="or-rows">${rowHtml('stop')}${rowHtml('take')}</div></div></div>` },
        setup(real, front) {
          const host = $('.detail-chart', real);
          host.style.height = `${CHART_H}px`;
          const chart = CK.chart(host, { points: series.slice() });
          if (chart && typeof chart.levels === 'function' && drawn.levels.length) chart.levels(drawn.levels);
          CK.segmented($('.detail-frames', real), { label: tx('chart.period'), size: 'small', value: '1d', items: frames });
          const row = front ? $('.or-row[data-kind="stop"]', front) : null;
          const chip = row && chipPct ? $(`.or-chip[data-pct="${chipPct}"]`, row) : null;
          if (chip) {
            const thumb = $('.or-thumb', row), field = $('.or-field', row);
            chip.setAttribute('aria-pressed', 'true');
            if (thumb) {
              thumb.style.transform = `translate3d(${CHIPS.stop.indexOf(chipPct) * 100}%,0,0)`;
              thumb.classList.add('is-on');
            }
            row.classList.add('has-price');
            if (field) {
              const price = D().qty(stopAt / ton.price);
              field.value = price;
              field.setAttribute('value', price);
            }
          }
          return { destroy() { if (chart && typeof chart.destroy === 'function') chart.destroy(); } };
        }
      };
    },

    ref(facts) {
      const B = window.DemoBonus;
      need(B && typeof B.heroHtml === 'function' && typeof B.referralHtml === 'function', 'Бонусы');
      const invite = String(B.referralHtml(facts, { share: false }) || '');
      need(/data-send/.test(invite), 'invite');
      return {
        scope: 'bonus-screen',
        title: tx('tab.bonus'),
        html: `${B.heroHtml(facts)}${invite}`,
        focus: { clone: '.bonus-invite', at: .64 }
      };
    }
  };

  const WORDS = {
    trade: () => ['welcome.tradeTitle', tx('welcome.tradeText')],
    wallet: () => ['welcome.walletTitle', tx('welcome.walletText')],
    swap: () => ['welcome.swapTitle', tx('welcome.swapText', { pct: pctText(feeBps()) })],
    stop: () => ['welcome.stopTitle', tx('welcome.stopText')],
    ref: (share) => ['welcome.refTitle', share === undefined ? '' : share ? tx('welcome.refShare', { pct: share }) : tx('welcome.refText')]
  };
  const ORDER = ['trade', 'wallet', 'swap', 'stop', 'ref'];

  let known = null;
  const canAskShare = () => { const F = window.DemoFees; return !!(F && typeof F.loadFacts === 'function' && typeof F.pctOf === 'function'); };
  const firstKnown = () => known || (canAskShare() ? { share: undefined, facts: null } : { share: '', facts: false });
  const refHere = () => !!(CK.tg && CK.tg.inside && CK.market && CK.market.mode === 'live');
  function askShare() {
    const F = window.DemoFees;
    return Promise.resolve().then(() => F.loadFacts())
      .then((f) => ({ share: f && f.server && f.refShareBps > 0 ? F.pctOf(f.refShareBps) : '', facts: f || false }))
      .catch(() => ({ share: '', facts: false }));
  }

  function screenOf(id, ref) {
    try {
      return SCREENS[id](id === 'ref' ? ref.facts : undefined);
    } catch (err) {
      console.warn('welcome:', id, err && err.message);
      return null;
    }
  }
  const screenHtml = (screen) => `${screen.title ? `<div class="wc-bar"><b>${esc(screen.title)}</b><span class="navbtn hd-avatar"><span class="hd-face" data-hd-face></span></span></div>` : ''}${screen.html}`;
  const stageHtml = (screen) => `
          <div class="wc-stage" aria-hidden="true" inert>
            <div class="wc-phone"><div class="wc-glass ${esc(screen.scope)}"><i class="wc-island"></i><div class="wc-screen" data-wc-real>${screenHtml(screen)}</div></div></div>
            ${screen.focus ? `<div class="wc-focus ${esc(screen.scope)}" data-wc-focus></div>` : ''}
          </div>`;

  function markup(list, screens) {
    const n = list.length;
    const slides = list.map((id, i) => `
        <section class="wc-slide" data-wc-slide="${id}" role="group" aria-roledescription="slide" aria-label="${esc(tx('welcome.slide', { n: i + 1, count: n }))}"${i ? ' aria-hidden="true"' : ''}>
          <div class="wc-words">
            <h2 class="wc-title" data-motion="row"></h2>
            <p class="wc-text" data-motion="row"></p>
          </div>
          ${stageHtml(screens[i])}
        </section>`).join('');
    return `
      <div class="welcome" role="dialog" aria-modal="true" aria-label="${esc(tx('welcome.aria'))}" data-i18n-aria="welcome.aria" tabindex="-1">
        <div class="wc-top"><button class="wc-close press" type="button" data-wc="close" ${LA('nav.close')}>${icon('close', { size: 20 })}</button></div>
        <div class="wc-viewport"><div class="wc-track">${slides}</div></div>
        <div class="wc-foot">
          <div class="wc-dots" aria-hidden="true"><span class="wc-dot-ind"></span>${'<i class="wc-dot"></i>'.repeat(n)}</div>
          <button class="btn btn--wide wc-next" type="button" data-wc="next"><span class="wc-next-label" ${L('welcome.next')}>${esc(tx('welcome.next'))}</span></button>
        </div>
      </div>`;
  }


  let current = null;

  function open() {
    if (current) return current.closed;
    const host = document.getElementById('app');
    if (!host) return Promise.resolve({ done: false, slide: 0 });
    let ref = firstKnown();
    const built = ORDER.filter((id) => id !== 'ref' || refHere()).map((id) => [id, screenOf(id, ref)]).filter(([, screen]) => screen);
    if (!built.length) return Promise.resolve({ done: false, slide: 0 });
    const list = built.map(([id]) => id);
    const screens = built.map(([, screen]) => screen);
    remember();
    const root = CK.el(markup(list, screens));
    const viewport = $('.wc-viewport', root), track = $('.wc-track', root);
    const slides = $$('.wc-slide', root);
    const nextBtn = $('[data-wc="next"]', root), closeBtn = $('[data-wc="close"]', root);
    const label = $('.wc-next-label', root), ind = $('.wc-dot-ind', root);
    const stage = document.getElementById('stage');
    const before = document.activeElement;
    let index = 0, pos = 0, slideAnim = null, closing = false, finish;
    const closed = new Promise((resolve) => { finish = resolve; });

    const hidStage = !!stage && stage.getAttribute('aria-hidden') !== 'true';
    if (hidStage) stage.setAttribute('aria-hidden', 'true');
    host.appendChild(root);
    const tint = (on) => {
      try {
        if (on) {
          const top = getComputedStyle(root).getPropertyValue('--wc-a').trim();
          if (top && CK.tg && typeof CK.tg.tintHeader === 'function') CK.tg.tintHeader(top);
        } else document.dispatchEvent(new Event('ck:launch-header'));
      } catch (_) { }
    };
    tint(true);

    const width = () => viewport.clientWidth || host.clientWidth || 1;
    const place = (x) => { pos = x; track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`; };

    const scale = { k: 1, kf: 1 };
    function size(s) {
      const w = width();
      const phone = Math.round(Math.max(PHONE_MIN, Math.min(PHONE_MAX, w * PHONE_SHARE)) * s);
      scale.k = Number(((phone - 2 * BEZEL) / LAYOUT).toFixed(4));
      scale.kf = Number((Math.min(FOCUS_MAX, (w * FOCUS_SHARE) / LAYOUT) * s).toFixed(4));
      root.style.setProperty('--wc-pw', `${phone}px`);
      root.style.setProperty('--wc-k', String(scale.k));
      root.style.setProperty('--wc-kf', String(scale.kf));
    }
    function fitWords() {
      let tall = 0;
      slides.forEach((slide) => {
        const title = $('.wc-title', slide), text = $('.wc-text', slide);
        const h = (title.offsetHeight || 0) + (text.offsetHeight || 0);
        if (h > tall) tall = h;
      });
      if (tall > 0) root.style.setProperty('--wc-words', `${tall + WORDS_GAP}px`);
    }
    function fit() {
      size(1);
      const worst = Math.max(0, ...slides.map((_, i) => seat(i)));
      if (worst > 1) {
        size(Math.max(FIT_MIN, 1 / worst));
        seatAll();
      }
    }

    const hooks = [];
    const anchors = [];
    function mount(i) {
      const screen = screens[i], slide = slides[i];
      const real = $('[data-wc-real]', slide), holder = $('[data-wc-focus]', slide);
      const f = screen.focus || null;
      let front = null;
      try {
        front = f && f.html ? CK.el(f.html) : null;
      } catch (_) {
        front = null;
      }
      try {
        hooks[i] = (screen.setup ? screen.setup(real, front) : null) || null;
      } catch (err) {
        console.warn('welcome:', list[i], err && err.message);
        hooks[i] = null;
      }
      try { if (typeof CK.paintProfile === 'function') CK.paintProfile(real); } catch (_) { }
      anchors[i] = null;
      if (!holder) return;
      if (f && !f.html) {
        try {
          if (typeof f.make === 'function') front = f.make(real) || null;
          else if (f.clone) {
            const part = $(f.clone, real);
            front = part ? part.cloneNode(true) : null;
            if (part) part.classList.add('wc-lifted');
          }
        } catch (err) {
          console.warn('welcome:', list[i], err && err.message);
          front = null;
        }
      }
      holder.textContent = '';
      holder.hidden = !front;
      if (!front) return;
      const where = f.from || f.clone || '';
      anchors[i] = { from: where ? $(where, real) : null, below: f.below === true, rise: Number(f.rise) || 0, at: f.at > 0 ? f.at : 0 };
      [front].concat($$('[id]', front)).forEach((el) => el.removeAttribute('id'));
      holder.appendChild(front);
      seat(i);
    }
    function placeOf(part, real) {
      let y = 0, el = part;
      while (el && el !== real) {
        y += el.offsetTop || 0;
        el = el.offsetParent;
      }
      return el === real ? y : null;
    }
    function seat(i) {
      const slide = slides[i], a = anchors[i];
      const holder = $('[data-wc-focus]', slide), room = $('.wc-stage', slide), real = $('[data-wc-real]', slide);
      if (!a || !holder || holder.hidden || !room || typeof room.getBoundingClientRect !== 'function') return 0;
      const box = room.getBoundingClientRect();
      let top = null;
      const at = a.from && real ? placeOf(a.from, real) : null;
      if (at !== null && a.from.offsetHeight > 0) top = Math.round(BEZEL + scale.k * (at + (a.below ? a.from.offsetHeight : 0)) + (a.below ? FOCUS_GAP : 0) - a.rise);
      if (top === null && a.at > 0) {
        const h = room.clientHeight;
        if (h > 0) top = Math.round(h * a.at);
      }
      if (top === null) return 0;
      let reach = 0;
      const foot = $('.wc-foot', root);
      if (foot && typeof foot.getBoundingClientRect === 'function') {
        const floor = foot.getBoundingClientRect().top - box.top + FOOT_LAP;
        const tall = (holder.offsetHeight || 0) * scale.kf;
        if (floor > 0 && tall > 0) {
          reach = (top + tall) / floor;
          top = Math.min(top, Math.round(floor - tall));
        }
      }
      holder.style.top = `${Math.max(FOCUS_TOP_MIN, top)}px`;
      return reach;
    }
    const seatAll = () => slides.forEach((_, i) => seat(i));

    const painted = new Set();
    function paintWords(i) {
      const [key, line] = WORDS[list[i]](ref.share);
      const title = $('.wc-title', slides[i]), text = $('.wc-text', slides[i]);
      CK.i18n.setKey(title, key);
      if (text.textContent === line) { painted.add(i); return; }
      const late = painted.has(i) && !text.textContent && !!line && i === index && !closing;
      painted.add(i);
      text.textContent = line;
      const m = M();
      if (late && m) m.rows([text], { force: true, fresh: true });
    }

    function shownX() {
      if (!slideAnim || slideAnim.playState === 'finished' || slideAnim.playState === 'idle') return pos;
      try { return new DOMMatrixReadOnly(getComputedStyle(track).transform).m41; } catch (_) { return pos; }
    }
    function stopSlide() {
      if (!slideAnim) return;
      const x = shownX();
      try { slideAnim.cancel(); } catch (_) { }
      slideAnim = null;
      place(x);
    }
    function moveTo(i) {
      const from = shownX(), to = -i * width();
      stopSlide();
      place(to);
      if (reduced() || Math.abs(from - to) < .5 || typeof track.animate !== 'function') return;
      const m = M();
      const easing = m ? m.springEasing(TRACK.stiffness, TRACK.damping) : 'cubic-bezier(.22, 1, .36, 1)';
      try {
        slideAnim = track.animate([{ transform: `translate3d(${from.toFixed(2)}px, 0, 0)` }, { transform: `translate3d(${to.toFixed(2)}px, 0, 0)` }], { duration: TRACK.ms, easing });
      } catch (_) {
        slideAnim = null;
      }
    }

    function enter(i) {
      const slide = slides[i], m = M();
      if (!slide || !m) return;
      m.rows([$('.wc-title', slide), $('.wc-text', slide)], { force: true, fresh: true, delay: WORDS_DELAY });
      m.blocks([$('.wc-phone', slide)], { force: true, fresh: true, delay: PHONE_DELAY, base: 'none' });
      const front = $('[data-wc-focus]', slide);
      if (front && !front.hidden) m.blocks([front], { force: true, fresh: true, delay: FOCUS_DELAY, base: `scale(${scale.kf})` });
    }
    function paintFoot(i, from) {
      const last = i === slides.length - 1;
      const key = last ? 'welcome.start' : 'welcome.next';
      const m = M();
      if (label.getAttribute('data-i18n') !== key) {
        CK.i18n.setKey(label, key);
        if (m && from != null) m.rows([label], { force: true, fresh: true });
      }
      if (m) m.indicator(ind, from == null ? null : from, i, { force: true });
      else ind.style.transform = `translate3d(${i * 100}%, 0, 0)`;
    }
    function go(i) {
      const next = Math.max(0, Math.min(slides.length - 1, i));
      const from = index;
      if (next === index) {
        moveTo(index);
        return;
      }
      const seen = Math.abs(shownX() + next * width()) < width() - 1;
      index = next;
      slides.forEach((s, k) => s.setAttribute('aria-hidden', k === index ? 'false' : 'true'));
      moveTo(index);
      paintFoot(index, from);
      if (!seen) enter(index);
      if (CK.haptic) CK.haptic.selection();
    }

    function close(done) {
      if (closing) return;
      closing = true;
      current = null;
      window.removeEventListener('resize', onResize);
      tint(false);
      const out = () => {
        hooks.forEach((h) => { try { if (h && typeof h.destroy === 'function') h.destroy(); } catch (_) { } });
        root.remove();
        if (hidStage && !(CK.sheet && CK.sheet.top)) stage.removeAttribute('aria-hidden');
        try { if (before && before.isConnected && typeof before.focus === 'function') before.focus({ preventScroll: true }); } catch (_) { }
        finish({ done: !!done, slide: index });
      };
      if (typeof root.animate !== 'function') { out(); return; }
      let a = null;
      try {
        a = root.animate(reduced() ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.98)' }],
          { duration: reduced() ? 120 : 240, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' });
      } catch (_) { a = null; }
      if (a && a.finished) a.finished.then(out, out);
      else out();
    }

    nextBtn.addEventListener('click', () => {
      if (closing) return;
      if (index >= slides.length - 1) {
        if (CK.haptic) CK.haptic.light();
        close(true);
      } else go(index + 1);
    });
    closeBtn.addEventListener('click', () => { if (!closing) close(false); });
    root.addEventListener('keydown', (e) => {
      if (closing) return;
      if (e.key === 'Escape') { e.preventDefault(); close(false); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); return; }
      if (e.key === 'Tab') {
        const stops = [closeBtn, nextBtn];
        const at = stops.indexOf(document.activeElement);
        e.preventDefault();
        stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
      }
    });

    if (CK.drag) {
      let base = 0;
      CK.drag(viewport, {
        axis: 'x',
        filter: () => !closing,
        onStart() { stopSlide(); base = pos; },
        onMove(s) {
          const w = width();
          let x = base + s.dx;
          const min = -(slides.length - 1) * w;
          if (x > 0) x /= 3;
          else if (x < min) x = min + (x - min) / 3;
          place(x);
        },
        onEnd(s, cancelled) {
          if (cancelled) { moveTo(index); return; }
          const w = width();
          const moved = -(pos + index * w) / w;
          let to = index;
          if (s.v < -FLICK || moved > TURN_SHARE) to = index + 1;
          else if (s.v > FLICK || moved < -TURN_SHARE) to = index - 1;
          go(to);
        }
      });
    }
    function onResize() { fitWords(); fit(); stopSlide(); place(-index * width()); }
    window.addEventListener('resize', onResize);

    const refAt = list.indexOf('ref');
    if (refAt >= 0 && ref.share === undefined) {
      askShare().then((got) => {
        known = got;
        ref = got;
        if (closing) return;
        paintWords(refAt);
        const again = screenOf('ref', ref);
        if (!again) return;
        screens[refAt] = again;
        $('[data-wc-real]', slides[refAt]).innerHTML = screenHtml(again);
        mount(refAt);
        fitWords();
        fit();
      });
    }

    size(1);
    slides.forEach((slide, i) => {
      mount(i);
      paintWords(i);
      if (CK.i18n.bind) CK.i18n.bind(slide, () => { paintWords(i); fitWords(); fit(); });
    });
    fitWords();
    fit();
    place(0);
    paintFoot(0, null);
    try { if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') document.fonts.ready.then(() => { if (!closing) { fitWords(); fit(); } }, () => {}); } catch (_) { }
    if (typeof root.animate === 'function') {
      try { root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced() ? 120 : OPEN_MS, easing: 'ease-out' }); } catch (_) { }
    }
    enter(0);
    const m = M();
    if (m) m.blocks([closeBtn, $('.wc-dots', root), nextBtn], { force: true, fresh: true, delay: FOCUS_DELAY + 60 });
    try { nextBtn.focus({ preventScroll: true }); } catch (_) { }

    current = {
      root, closed,
      get index() { return index; },
      get slides() { return list.slice(); },
      go: (i) => go(i),
      close: () => close(false)
    };
    return closed;
  }

  async function splashGone() {
    const until = Date.now() + SPLASH_WAIT_MS;
    while (document.getElementById('dp-splash') && Date.now() < until) await wait(POLL_MS);
  }

  let decided = null;
  function maybeShow(opts) {
    if (current) return Promise.resolve(false);
    if (!decided) {
      decided = decide(opts || {}).catch(() => false).then(async (show) => {
        if (!show) return false;
        await splashGone();
        if (!current) open();
        return true;
      });
    }
    return decided;
  }

  window.DemoWelcome = {
    open,
    maybeShow,
    get isOpen() { return !!current; },
    get view() { return current; },
    SLIDES: ORDER.slice(),
    LOCAL_KEY,
    CLOUD_KEY
  };
}());
