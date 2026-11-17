(function () {
  'use strict';
  const { icon, t: tx } = CK;
  const { L } = CK.i18n;
  const esc = CK.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  CK.i18n.add({
    'welcome.aria': ['Знакомство с приложением', 'App tour', 'Знайомство із застосунком', 'Қосымшамен танысу'],
    'welcome.slide': ['{n} из {count}', '{n} of {count}', '{n} з {count}', '{count} ішінен {n}'],
    'welcome.next': ['Далее', 'Next', 'Далі', 'Әрі қарай'],
    'welcome.start': ['Начать', 'Start', 'Почати', 'Бастау'],
    'welcome.skip': ['Пропустить', 'Skip', 'Пропустити', 'Өткізіп жіберу'],
    'welcome.walletTitle': ['Ваш кошелёк в Telegram', 'Your wallet in Telegram', 'Ваш гаманець у Telegram', 'Telegram-дағы әмияныңыз'],
    'welcome.walletText': ['Тут лежат ваши монеты из TON, Ethereum, Solana и BNB Chain', 'Your coins from TON, Ethereum, Solana and BNB Chain are right here', 'Тут лежать ваші монети з TON, Ethereum, Solana і BNB Chain', 'TON, Ethereum, Solana және BNB Chain монеталарыңыз осында'],
    'welcome.swapTitle': ['Обмен монет', 'Swap coins', 'Обмін монет', 'Монета айырбасы'],
    'welcome.swapText': ['Наша комиссия {pct}, и вы видите её до подтверждения', 'Our fee is {pct}, and you see it before you confirm', 'Наша комісія {pct}, і ви бачите її до підтвердження', 'Біздің комиссия {pct}, оны растағанға дейін көресіз'],
    'welcome.stopTitle': ['Стоп на токенах TON', 'Stops on TON tokens', 'Стоп на токенах TON', 'TON токендеріндегі стоп'],
    'welcome.stopText': ['Цена дошла до стопа, токен продастся сам, а бот напишет', 'The price hits your stop, the token sells and the bot tells you', 'Ціна дійшла до стопу, токен продасться сам, а бот напише', 'Баға стопқа жетсе, токен өзі сатылады, бот хабарлайды'],
    'welcome.chequesTitle': ['Чеки и счета', 'Checks and invoices', 'Чеки та рахунки', 'Чектер мен шоттар'],
    'welcome.chequesText': ['Отправьте другу монеты ссылкой или выставьте счёт, чтобы вам заплатили', 'Send a friend coins by link, or send an invoice to get paid', 'Надішліть другу монети посиланням або виставте рахунок, щоб вам заплатили', 'Монеталарды сілтемемен жіберіңіз немесе шот жазыңыз'],
    'welcome.bonusTitle': ['Обмен без нашей комиссии', 'A swap without our fee', 'Обмін без нашої комісії', 'Біздің комиссиясыз айырбас'],
    'welcome.bonusText': ['Один обмен в TON до ${max} пройдёт без нашей комиссии', 'One swap on TON up to ${max} goes through without our fee', 'Один обмін у TON до ${max} пройде без нашої комісії', 'TON-дағы ${max} дейінгі бір айырбас біздің комиссиясыз өтеді'],
    'welcome.inviteTitle': ['Зовите друзей', 'Invite friends', 'Кличте друзів', 'Достарды шақырыңыз'],
    'welcome.inviteText': ['Отправьте другу свою ссылку', 'Send a friend your link', 'Надішліть другу своє посилання', 'Досыңызға сілтемеңізді жіберіңіз'],
    'welcome.inviteShare': ['Вы получаете {share} от нашей комиссии с их обменов в TON', 'You get {share} of our fee on their TON swaps', 'Ви отримуєте {share} від нашої комісії з їхніх обмінів у TON', 'Олардың TON-дағы айырбастарынан біздің комиссияның {share} сізге тиеді']
  });

  const CLOUD_KEY = 'welcome';
  const LOCAL_KEY = 'ck-welcome';
  const SEEN = '1';
  const CLOUD_WAIT_MS = 2500;
  const SDK_WAIT_MS = 1500;
  const WALLET_WAIT_MS = 4000;
  const POLL_MS = 100;
  const FLICK = 380;
  const TURN_SHARE = .22;
  const TRACK = { stiffness: 170, damping: 26.077, ms: 560 };
  const PARTS_DELAY = 70;
  const WORDS_DELAY = 150;
  const OPEN_MS = 240;
  const ALIVE_AFTER = 80;
  const SCALE_MAX = .84;
  const SCALE_MIN = .68;
  const FRAME_AIR = 16;

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
  const pctText = (bps) => `${CK.fmt.num(bps / 100, bps % 100 ? (bps % 10 ? 2 : 1) : 0)}${CK.i18n.lang === 'en' ? '' : ' '}%`;
  const need = (ok, what) => { if (!ok) throw new Error('welcome: no ' + what); };
  const coinOf = (id) => {
    const d = D();
    const c = d && d.byId ? d.byId[id] : null;
    need(c && c.price > 0, id);
    return c;
  };

  const HELD = [['ton', 120], ['eth', .05], ['sol', .5], ['bnb', .1]];
  const ACTIONS = [['deposit', 'action.deposit', 'deposit'], ['withdraw', 'action.withdraw', 'withdraw'], ['exchange', 'action.swap', ''], ['history', 'common.history', 'history']];

  const BLOCKS = {
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
      const assets = rows.map((r, i) => `
            <button class="cell asset-row press-row" type="button" data-coin="${esc(r.coin.id)}"${i > 1 ? ' data-wc-cut-at="1"' : ''}>
              <span class="coin-with-net">${CK.coinLogo(r.coin, 40)}</span>
              <span class="market-name"><b class="asset-name"><span>${esc(r.coin.name)}</span></b><span class="asset-amount">${esc(D().qty(r.amount))} ${esc(r.coin.sym)}</span></span>
              <span class="asset-right"><b>${esc(CK.fmt.usd(r.usd))}</b></span>
            </button>`).join('');
      return {
        scope: 'screen--wallet wc-real--wallet',
        cuts: 2,
        html: `
          <div class="wallet-top">
            <div class="screen-pad">${cards.balance({ label: '', value: 0, pnl: 0, pnlPct: 0, eyeBy: true })}</div>
            <div class="screen-pad action-row pf-actions" data-n="${ACTIONS.length}">${actions}</div>
          </div>
          <div class="wallet-main" data-wc-cut-at="2"><section class="section"><div class="group list--free pf-assets">${assets}</div></section></div>`,
        setup(real) {
          const card = $('.balance', real), value = $('.balance-value', real);
          const eye = $('.balance-eye', real);
          if (eye) eye.remove();
          const dress = () => { if (cards.dressBalance) cards.dressBalance(value); };
          CK.roll(value, CK.fmt.usd(0));
          dress();
          return {
            alive(animate) {
              const text = CK.fmt.usd(total);
              if (animate && cards.rollBalance) cards.rollBalance(value, text);
              else CK.roll(value, text);
              dress();
              if (cards.setBalanceDay) cards.setBalanceDay(card, day);
            }
          };
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
        scope: 'wc-real--swap',
        cuts: 1,
        html: `<div class="screen-pad ex-tab">${X.htmlOf(model, false)}</div>`,
        setup(real) {
          const input = $('.ex-input', real), out = $('[data-ex-out]', real), toggle = $('.fold-toggle', real), fold = $('.fold-body', real), next = $('.ex-next', real);
          need(input && out, 'Обмен form');
          const typed = CK.fmt.num(give, 0);
          input.value = typed;
          input.setAttribute('value', typed);
          input.setAttribute('readonly', '');
          if (toggle && fold) {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.removeAttribute('aria-controls');
            fold.removeAttribute('hidden');
            fold.removeAttribute('id');
          }
          if (next) next.setAttribute('data-wc-cut-at', '1');
          const text = out.textContent;
          out.classList.add('is-empty');
          CK.roll(out, '0');
          return {
            alive() {
              out.classList.remove('is-empty');
              CK.roll(out, text, 2);
            }
          };
        }
      };
    },

    stop() {
      need(typeof CK.chart === 'function', 'chart');
      const inst = coinOf('not');
      const series = (Array.isArray(inst.series) ? inst.series : []).filter((v) => v > 0);
      need(series.length > 1, 'price line');
      const last = series[series.length - 1], low = Math.min(...series);
      let stopAt = last * .96;
      if (!(stopAt > low + (last - low) * .12)) stopAt = low + (last - low) * .45;
      const tile = (act, glyph, key) => `<button class="tk-act press-row" type="button" data-act="${act}">${icon(glyph, { size: 22 })}<span>${esc(tx(key))}</span></button>`;
      const point = CK.fmt.decimal ? CK.fmt.decimal() : ',';
      const above = CK.fmt.price(Number((last * 1.15).toPrecision(2))).replace(new RegExp(`\\${point}00(?!\\d)`), '');
      return {
        scope: 'tk-card wc-real--stop',
        cuts: 1,
        html: `
          <div class="detail-chart"></div>
          <div class="screen-pad tk-acts">
            <button class="cell press-row tk-orders" type="button"><span class="cell-main"><span class="cell-title">${esc(tx('detail.orders'))}</span></span>${icon('shield', { size: 22 })}</button>
            ${tile('share', 'share', 'share.aria')}
          </div>
          <div class="pa-page" data-wc-cut-at="1"><div class="group pa-list pa-all list--free">
            <div class="cell pa-item">${CK.coinLogo(inst, 36)}<span class="pa-main"><b class="pa-sym">${esc(inst.sym)}</b></span><span class="cell-value pa-line">${esc(tx('alerts.above', { price: above }))}</span></div>
          </div></div>`,
        setup(real) {
          const chart = CK.chart($('.detail-chart', real), { points: series.slice() });
          const can = chart && typeof chart.levels === 'function';
          const level = (price) => [{ price, kind: 'stop', label: tx('chart.tipStop', { price: CK.fmt.price(stopAt) }) }];
          if (can) chart.levels(level(last));
          return {
            alive() {
              real.classList.add('is-set');
              if (can) chart.levels(level(stopAt));
            },
            destroy() { if (chart && typeof chart.destroy === 'function') chart.destroy(); }
          };
        }
      };
    },

    cheques() {
      const usdt = coinOf('usdt');
      need(typeof CK.tile === 'function', 'tiles');
      const row = (glyph, tone, key) => `<button class="cell cell-tile press-row" type="button"><span>${CK.tile(glyph, { tone })}</span><span class="cell-main"><span class="cell-title">${esc(tx(key))}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`;
      return {
        scope: 'wc-real--cheque',
        cuts: 1,
        html: `
          <div class="w-step sw-status cq-claim wc-sheet">
            <div class="cq-claim-card"><div class="cq-claim-head">${CK.coinLogo(usdt, 56)}<b class="cq-claim-amount">${esc(`${CK.fmt.num(10, 0)} ${usdt.sym}`)}</b><span class="cq-claim-from"></span></div></div>
            <div class="cq-actions"><button class="btn btn--wide press cq-go" type="button">${esc(tx('cheque.claim'))}</button></div>
          </div>
          <div class="group" data-wc-cut-at="1">${row('gift', 'orange', 'cheque.mine')}${row('doc', 'teal', 'inv.row')}</div>`
      };
    },

    bonus(b) {
      if (b.gift) {
        need(window.DemoBonus, 'Бонусы');
        return {
          scope: 'bonus-screen wc-real--bonus',
          cuts: 0,
          html: `
            <div class="group bonus-free is-ready">
              <div class="bonus-art">${GIFT}<span class="bonus-zero">${esc(pctText(0))}</span></div>
              <span class="tag bonus-state">${esc(tx('bonus.ready'))}</span>
              <h2 class="bonus-title">${esc(tx('bonus.free'))}</h2>
              <p class="bonus-line">${esc(tx('bonus.freeLine', { min: b.min, max: b.max }))}</p>
              <button class="btn btn--wide bonus-go" type="button"><span>${esc(tx('bonus.go'))}</span></button>
            </div>`
        };
      }
      const I = window.DemoApp && DemoApp.invite;
      need(I && typeof I.buttonsHtml === 'function', 'invite');
      return {
        scope: 'bonus-screen wc-real--bonus',
        cuts: 0,
        html: `
          <div class="group bonus-invite">
            <div class="bonus-inv-head"><h2 class="bonus-inv-title">${esc(tx('invite.row'))}</h2>${FRIENDS}</div>
            <div class="bonus-stats" data-n="1"><div class="bonus-stat"><span class="bonus-stat-name">${esc(tx('invite.joined'))}</span><b class="bonus-stat-value">${esc(CK.fmt.num(0, 0))}</b></div></div>
            <div class="bonus-invite-foot">${I.buttonsHtml()}</div>
          </div>`
      };
    }
  };

  const spark = (cx, cy, r) => {
    const k = r * 0.24;
    return `M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}z`;
  };
  const GIFT = `<svg class="bonus-gift" viewBox="0 0 160 128" aria-hidden="true" focusable="false">
    <circle class="bg-halo" cx="80" cy="66" r="54"/>
    <path class="bg-spark" d="${spark(128, 30, 9)}"/><path class="bg-spark bg-soft" d="${spark(29, 88, 6.5)}"/>
    <circle class="bg-dot" cx="35" cy="38" r="4"/><circle class="bg-ring" cx="133" cy="86" r="4.5"/><circle class="bg-dot bg-soft" cx="107" cy="15" r="2.6"/>
    <ellipse class="bg-floor" cx="80" cy="116.5" rx="36" ry="4.5"/>
    <g class="bg-box">
      <rect class="bg-body" x="50" y="64" width="60" height="48" rx="11"/>
      <rect class="bg-shade" x="50" y="70" width="60" height="6"/>
      <rect class="bg-band" x="74" y="64" width="12" height="48"/>
      <g class="bg-top">
        <g transform="translate(80 53) scale(5.4) translate(-12 -7.9)"><path class="bg-bow" d="M12 7.9c-.5-2.6-1.95-4.4-3.75-4.4a2.2 2.2 0 0 0 0 4.4zM12 7.9c.5-2.6 1.95-4.4 3.75-4.4a2.2 2.2 0 0 1 0 4.4z"/></g>
        <rect class="bg-lid" x="44" y="52" width="72" height="18" rx="7.5"/>
        <rect class="bg-band" x="73" y="52" width="14" height="18"/>
      </g>
    </g>
  </svg>`;
  const person = (cx) => `<circle class="bf-disc" cx="${cx}" cy="20" r="18"/><circle class="bf-man" cx="${cx}" cy="15.6" r="5.4"/><path class="bf-man" d="M${cx - 10} 31.2a10.6 9.4 0 0 1 20 0a15 15 0 0 1-20 0z"/>`;
  const FRIENDS = `<svg class="bonus-friends" viewBox="0 0 84 40" aria-hidden="true" focusable="false">
    <g class="bf bf-free"><circle class="bf-disc" cx="64" cy="20" r="18"/><path class="bf-plus" d="M70.5 15v10M65.5 20h10"/></g>
    <g class="bf bf-two">${person(42)}</g><g class="bf bf-one">${person(20)}</g></svg>`;

  const WORDS = {
    wallet: () => ['welcome.walletTitle', tx('welcome.walletText')],
    swap: () => ['welcome.swapTitle', tx('welcome.swapText', { pct: pctText(feeBps()) })],
    stop: () => ['welcome.stopTitle', tx('welcome.stopText')],
    cheques: () => ['welcome.chequesTitle', tx('welcome.chequesText')],
    bonus: (b) => (b.gift
      ? ['welcome.bonusTitle', tx('welcome.bonusText', { max: b.max })]
      : ['welcome.inviteTitle', b.share ? tx('welcome.inviteShare', { share: b.share }) : tx('welcome.inviteText')])
  };
  const ORDER = ['wallet', 'swap', 'stop', 'cheques', 'bonus'];

  let bonusKnown = null;
  const bonusFirst = () => bonusKnown || { gift: false, min: 10, max: 50, share: '' };
  const bonusHere = () => !!(CK.tg && CK.tg.inside && CK.market && CK.market.mode === 'live');
  function askBonus() {
    const B = window.DemoBonus;
    if (!B || typeof B.load !== 'function') return Promise.resolve(null);
    return Promise.resolve().then(() => B.load()).then((d) => {
      if (!d || !d.free) return null;
      return { gift: !d.forgotten && d.free.state === 'ready', min: d.free.minUsd, max: d.free.maxUsd };
    }).catch(() => ({ gift: false, min: 10, max: 50 }));
  }
  function askShare() {
    const F = window.DemoFees;
    if (!F || typeof F.loadFacts !== 'function' || typeof F.pctOf !== 'function') return Promise.resolve('');
    return Promise.resolve().then(() => F.loadFacts()).then((f) => (f && f.server && f.refShareBps > 0 ? F.pctOf(f.refShareBps) : '')).catch(() => '');
  }

  function blockOf(id, bonus) {
    try {
      return BLOCKS[id](bonus);
    } catch (err) {
      console.warn(err && err.message ? err.message : err);
      return null;
    }
  }
  const frameHtml = (block) => `<div class="wc-frame" data-wc-frame><div class="wc-real ${block.scope}" data-wc-real data-wc-cut="0" inert>${block.html}</div></div>`;
  function seal(real) {
    $$('button, input, a, [tabindex]', real).forEach((el) => el.setAttribute('tabindex', '-1'));
  }

  function markup(list) {
    const n = list.length;
    const slides = list.map((s, i) => `
        <section class="wc-slide" data-wc-slide="${s.id}" role="group" aria-roledescription="slide" aria-label="${esc(tx('welcome.slide', { n: i + 1, count: n }))}"${i ? ' aria-hidden="true"' : ''}>
          <div class="wc-art" aria-hidden="true">${frameHtml(s.block)}</div>
          <div class="wc-words">
            <h2 class="wc-title" data-motion="row"></h2>
            <p class="wc-text" data-motion="row"></p>
          </div>
        </section>`).join('');
    return `
      <div class="welcome" role="dialog" aria-modal="true" aria-label="${esc(tx('welcome.aria'))}" data-i18n-aria="welcome.aria" tabindex="-1">
        <div class="wc-top"><button class="wc-skip press" type="button" data-wc="skip" ${L('welcome.skip')}>${esc(tx('welcome.skip'))}</button></div>
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
    let bonus = { ...bonusFirst() };
    const list = ORDER.filter((id) => id !== 'bonus' || bonusHere()).map((id) => ({ id, block: blockOf(id, bonus), live: null, wasAlive: false })).filter((s) => s.block);
    if (!list.length) return Promise.resolve({ done: false, slide: 0 });
    remember();
    const root = CK.el(markup(list));
    const viewport = $('.wc-viewport', root), track = $('.wc-track', root);
    const slides = $$('.wc-slide', root);
    const nextBtn = $('[data-wc="next"]', root), skipBtn = $('[data-wc="skip"]', root);
    const label = $('.wc-next-label', root), ind = $('.wc-dot-ind', root);
    const stage = document.getElementById('stage');
    const before = document.activeElement;
    let index = 0, pos = 0, slideAnim = null, closing = false, aliveTimer = 0, finish;
    const closed = new Promise((resolve) => { finish = resolve; });

    const hidStage = !!stage && stage.getAttribute('aria-hidden') !== 'true';
    if (hidStage) stage.setAttribute('aria-hidden', 'true');
    host.appendChild(root);

    const width = () => viewport.clientWidth || host.clientWidth || 1;
    const place = (x) => { pos = x; track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`; };

    function paintWords(i) {
      const [key, line] = WORDS[list[i].id](bonus);
      const title = $('.wc-title', slides[i]), text = $('.wc-text', slides[i]);
      CK.i18n.setKey(title, key);
      if (text.textContent !== line) text.textContent = line;
    }
    function fitOne(i) {
      const slide = slides[i], block = list[i].block;
      const art = $('.wc-art', slide), frame = $('[data-wc-frame]', slide), real = $('[data-wc-real]', slide);
      const w = width();
      const roomW = art.clientWidth || w, roomH = Math.max(0, (art.clientHeight || 0) - FRAME_AIR);
      real.style.width = `${w}px`;
      let cut = 0, h = 0, scale = SCALE_MAX;
      for (;;) {
        real.setAttribute('data-wc-cut', String(cut));
        h = real.offsetHeight || 0;
        scale = Math.min(SCALE_MAX, roomW / w, h > 0 && roomH > 0 ? roomH / h : SCALE_MAX);
        if (scale >= SCALE_MIN || cut >= block.cuts) break;
        cut += 1;
      }
      real.style.transform = `scale(${scale.toFixed(4)})`;
      frame.style.width = `${Math.round(w * scale)}px`;
      frame.style.height = h > 0 ? `${Math.round(h * scale)}px` : '';
    }
    const fit = () => slides.forEach((_, i) => fitOne(i));
    function setUp(i) {
      const s = list[i], real = $('[data-wc-real]', slides[i]);
      seal(real);
      try {
        s.live = s.block.setup ? s.block.setup(real) || null : null;
      } catch (err) {
        console.warn(err && err.message ? err.message : err);
        s.live = null;
      }
    }
    function tearDown(i) {
      const live = list[i].live;
      list[i].live = null;
      try { if (live && live.destroy) live.destroy(); } catch (_) { }
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

    function hold() {
      clearTimeout(aliveTimer);
      aliveTimer = 0;
      slides.forEach((s) => s.classList.remove('is-live'));
    }
    function land(i) {
      aliveTimer = 0;
      if (closing || i !== index) return;
      slides[i].classList.add('is-live');
      const s = list[i];
      if (s.wasAlive || !s.live || !s.live.alive) return;
      s.wasAlive = true;
      try { s.live.alive(!reduced()); } catch (err) { console.warn(err && err.message ? err.message : err); }
    }
    function landSoon(i, ms) {
      hold();
      aliveTimer = setTimeout(() => land(i), reduced() ? 0 : ms + ALIVE_AFTER);
    }
    function enter(i) {
      const slide = slides[i], m = M();
      if (!slide || !m) return;
      m.blocks([$('[data-wc-frame]', slide)], { force: true, fresh: true, delay: PARTS_DELAY });
      m.rows([$('.wc-title', slide), $('.wc-text', slide)], { force: true, fresh: true, delay: WORDS_DELAY });
    }
    function paintFoot(i, from) {
      const last = i === slides.length - 1;
      const key = last ? 'welcome.start' : 'welcome.next';
      if (label.getAttribute('data-i18n') !== key) {
        CK.i18n.setKey(label, key);
        const m = M();
        if (m && from != null) m.rows([label], { force: true, fresh: true });
      }
      skipBtn.classList.toggle('is-gone', last);
      skipBtn.tabIndex = last ? -1 : 0;
      skipBtn.setAttribute('aria-hidden', last ? 'true' : 'false');
      const m = M();
      if (m) m.indicator(ind, from == null ? null : from, i, { force: true });
      else ind.style.transform = `translate3d(${i * 100}%, 0, 0)`;
    }
    function go(i, o) {
      const next = Math.max(0, Math.min(slides.length - 1, i));
      const from = index;
      if (next === index) {
        moveTo(index);
        landSoon(index, TRACK.ms);
        return;
      }
      index = next;
      slides.forEach((s, k) => s.setAttribute('aria-hidden', k === index ? 'false' : 'true'));
      moveTo(index);
      paintFoot(index, from);
      enter(index);
      landSoon(index, TRACK.ms);
      if (!(o && o.quiet) && CK.haptic) CK.haptic.selection();
    }

    function close(done) {
      if (closing) return;
      closing = true;
      current = null;
      hold();
      window.removeEventListener('resize', onResize);
      const out = () => {
        list.forEach((_, i) => tearDown(i));
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
    skipBtn.addEventListener('click', () => { if (!closing) close(false); });
    root.addEventListener('keydown', (e) => {
      if (closing) return;
      if (e.key === 'Escape') { e.preventDefault(); close(false); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); return; }
      if (e.key === 'Tab') {
        const stops = [skipBtn, nextBtn].filter((b) => b.tabIndex >= 0);
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
        onStart() { stopSlide(); hold(); base = pos; },
        onMove(s) {
          const w = width();
          let x = base + s.dx;
          const min = -(slides.length - 1) * w;
          if (x > 0) x /= 3;
          else if (x < min) x = min + (x - min) / 3;
          place(x);
        },
        onEnd(s, cancelled) {
          if (cancelled) { moveTo(index); landSoon(index, TRACK.ms); return; }
          const w = width();
          const moved = -(pos + index * w) / w;
          let to = index;
          if (s.v < -FLICK || moved > TURN_SHARE) to = index + 1;
          else if (s.v > FLICK || moved < -TURN_SHARE) to = index - 1;
          go(to);
        }
      });
    }
    function onResize() { stopSlide(); fit(); place(-index * width()); }
    window.addEventListener('resize', onResize);

    const bonusAt = list.findIndex((s) => s.id === 'bonus');
    function showBonus(next) {
      const was = bonus;
      bonus = { ...bonus, ...next };
      if (closing || bonusAt < 0) return;
      if (bonus.gift !== was.gift || bonus.min !== was.min || bonus.max !== was.max) {
        const block = blockOf('bonus', bonus);
        if (!block) { bonus = was; return; }
        const real = $('[data-wc-real]', slides[bonusAt]);
        tearDown(bonusAt);
        list[bonusAt].block = block;
        list[bonusAt].wasAlive = false;
        real.setAttribute('class', `wc-real ${block.scope}`);
        real.innerHTML = block.html;
        fitOne(bonusAt);
        setUp(bonusAt);
        fitOne(bonusAt);
        paintWords(bonusAt);
        if (index === bonusAt) {
          enter(bonusAt);
          landSoon(bonusAt, OPEN_MS + PARTS_DELAY);
        }
        return;
      }
      paintWords(bonusAt);
    }
    if (bonusAt >= 0) {
      askBonus().then((got) => {
        if (!got) return;
        bonusKnown = { ...bonusFirst(), ...got, share: bonus.share };
        showBonus(got);
      });
      askShare().then((share) => {
        if (!share) return;
        if (bonusKnown) bonusKnown.share = share;
        showBonus({ share });
      });
    }

    slides.forEach((slide, i) => {
      paintWords(i);
      if (CK.i18n.bind) CK.i18n.bind(slide, () => paintWords(i));
    });
    fit();
    slides.forEach((_, i) => setUp(i));
    fit();
    place(0);
    paintFoot(0, null);
    if (typeof root.animate === 'function') {
      try { root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced() ? 120 : OPEN_MS, easing: 'ease-out' }); } catch (_) { }
    }
    enter(0);
    landSoon(0, OPEN_MS + PARTS_DELAY);
    const m = M();
    if (m) m.blocks([skipBtn, $('.wc-dots', root), nextBtn], { force: true, fresh: true, delay: WORDS_DELAY + 60 });
    try { nextBtn.focus({ preventScroll: true }); } catch (_) { }

    current = {
      root, closed,
      get index() { return index; },
      get slides() { return list.map((s) => s.id); },
      go: (i) => go(i),
      close: () => close(false)
    };
    return closed;
  }

  let decided = null;
  function maybeShow(opts) {
    if (current) return Promise.resolve(false);
    if (!decided) {
      decided = decide(opts || {}).catch(() => false).then((show) => {
        if (show && !current) open();
        return !!show;
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
    CLOUD_KEY,
    LOCAL_KEY
  };
})();
