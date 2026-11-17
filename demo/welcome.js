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
    'welcome.refTitle': ['Реферальная программа', 'Referral program', 'Реферальна програма', 'Рефералдық бағдарлама'],
    'welcome.refText': ['Пригласите друзей по своей ссылке', 'Invite friends with your link', 'Запросіть друзів за своїм посиланням', 'Достарды өз сілтемеңізбен шақырыңыз']
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
  const SCALE_MAX = 1.14;
  const SCALE_MIN = .86;
  const FIT_PASSES = 4;
  const LAYOUT_MIN = 360;
  const BLOCK_DROP = .4;
  const DEMO_AFTER = 250;
  const TOUCH_MS = 420;
  const PRESS_MS = 240;
  const AFTER_PRESS = 160;
  const SHEET_MS = 560;
  const LOOK_MS = 800;
  const DEMO_PAUSE = 2400;
  const COPIED_MS = 1600;
  const STOP = { stop: true };

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
  const NOT_MASTER = 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';
  const feeBps = () => (CK.ton && Number.isInteger(CK.ton.FEE_BPS) ? CK.ton.FEE_BPS : 100);
  const pctText = (bps) => `${CK.fmt.num(bps / 100, bps % 100 ? (bps % 10 ? 2 : 1) : 0)}${CK.i18n.lang === 'en' ? '' : ' '}%`;
  const need = (ok, what) => { if (!ok) throw new Error('welcome: no ' + what); };
  const coinOf = (id) => {
    const d = D();
    const c = d && d.byId ? d.byId[id] : null;
    need(c && c.price > 0, id);
    return c;
  };
  function fade(el) {
    if (!el || reduced() || typeof el.animate !== 'function') return;
    try { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' }); } catch (_) { }
  }

  const HELD = [['ton', 120], ['eth', .05], ['sol', .5], ['bnb', .1]];
  const ACTIONS = [['deposit', 'action.deposit', 'deposit'], ['withdraw', 'action.withdraw', 'withdraw'], ['exchange', 'action.swap', ''], ['history', 'common.history', 'history']];
  const CHIPS = { stop: [5, 10, 20], take: [10, 20, 50] };
  function depositNets() {
    const N = window.DemoNets;
    if (!N || typeof N.chains !== 'function') return null;
    const mark = (key, name) => { const logo = typeof N.netMark === 'function' ? N.netMark(key) : null; return logo ? { id: 'net:' + key, sym: name, neutral: true, logo } : null; };
    const nets = [{ key: 'ton', name: 'TON', inst: mark('ton', 'TON') || coinOf('ton') }];
    N.chains().filter((c) => c && c.deposit !== false).forEach((c) => { const inst = mark(c.key, c.name) || c.inst; if (inst) nets.push({ key: c.key, name: c.name, inst }); });
    return nets;
  }

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
      const nets = depositNets();
      const sheet = nets ? {
        title: tx('action.deposit'),
        cls: '',
        html: `<div class="group w-nets">${nets.map((n) => `<button class="cell press-row w-netrow" type="button" data-wc-net="${esc(n.key)}"><span class="w-netmark">${CK.coinLogo(n.inst, 30)}</span><b class="w-netname">${esc(n.name)}</b>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`).join('')}</div>`
      } : null;
      return {
        scope: 'screen--wallet wc-real--wallet',
        cuts: 2,
        ground: true,
        minScale: .97,
        sheet,
        html: `
          <div class="wallet-top">
            <div class="screen-pad">${cards.balance({ label: '', value: 0, pnl: 0, pnlPct: 0, eyeBy: true })}</div>
            <div class="screen-pad action-row pf-actions" data-n="${ACTIONS.length}">${actions}</div>
          </div>
          <div class="wallet-main" data-wc-cut-at="2"><section class="section"><div class="group list--free pf-assets">${assets}</div></section></div>`,
        setup(real, body) {
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
            },
            demo: sheet ? async (d) => {
              await d.tap($('[data-action="deposit"]', real));
              await d.sheet(true);
              await d.wait(LOOK_MS);
              await d.tap($('.w-netrow', body));
              await d.wait(LOOK_MS / 2);
              d.away();
              await d.sheet(false);
            } : null
          };
        }
      };
    },

    swap() {
      const X = window.DemoExchange && DemoExchange._test;
      need(X && typeof X.htmlOf === 'function', 'Обмен');
      const ton = coinOf('ton'), usdt = coinOf('usdt');
      const from = { key: 'ton:TON', engine: 'ton', id: 'TON', sym: ton.sym, name: ton.name, decimals: 9, inst: ton, logo: null };
      const asUsdt = { key: 'ton:' + USDT_RAW, engine: 'ton', id: USDT_RAW, sym: usdt.sym, name: usdt.name, decimals: 6, inst: usdt, logo: null };
      const other = D().byId.not && D().byId.not.price > 0 ? D().byId.not : null;
      const asOther = other ? { key: 'ton:' + NOT_MASTER, engine: 'ton', id: NOT_MASTER, sym: other.sym, name: other.name, decimals: 9, inst: other, logo: null } : null;
      const bps = feeBps();
      const give = 10, have = HELD[0][1];
      const nano = (v) => BigInt(Math.round(v * 1e9));
      const modelOf = (to) => {
        const rate = ton.price / to.inst.price;
        return {
          mode: 'pair', from, to, route: { ok: true, engine: 'ton' }, legs: [{ engine: 'ton', from, to }],
          units: nano(give), have: nano(have), max: nano(have - .35), block: null, routeBlock: null, pairBlocked: false,
          out: give * rate * (1 - bps / 10000), rate, usdFrom: give * ton.price, sale: false, bps, feeSteps: 1, details: true, buttons: []
        };
      };
      const formHtml = (to) => `<div class="screen-pad ex-tab">${X.htmlOf(modelOf(to), false)}</div>`;
      const word = (key) => { const row = X.S && X.S[key]; const at = ['ru', 'en', 'uk', 'kk'].indexOf(CK.i18n.lang); return row ? row[at < 0 ? 1 : at] : ''; };
      const picks = [from, asUsdt].concat(asOther ? [asOther] : []);
      const pickRow = (a) => {
        const on = a === asUsdt;
        const right = a === from ? `<span class="asset-right"><b>${esc(D().qty(have))}</b></span>` : '';
        return `<button class="cell market-row press-row" type="button" role="radio" data-wc-pick="${esc(a.sym)}" aria-checked="${on}">${CK.coinLogo(a.inst, 40)}<span class="market-name"><b>${esc(a.name)}</b><span class="w-row-sub"><span>${esc(a.sym)}</span></span></span>${right}<span class="ex-check${on ? '' : ' ex-check--off'}">${on ? icon('check', { size: 20 }) : ''}</span></button>`;
      };
      const sheet = word('pickGet') ? {
        title: word('pickGet'),
        cls: 'ex-pick',
        html: `<label class="search ex-search">${icon('search', { size: 16 })}<input type="search" autocomplete="off" placeholder="${esc(word('search'))}" readonly></label>
          <section class="ex-sec"><h3 class="ex-group">${esc(word('groupTon'))}</h3><div class="group sheet-list list--free" role="radiogroup">${picks.map(pickRow).join('')}</div></section>`
      } : null;
      return {
        scope: 'wc-real--swap',
        cuts: 1,
        sheet,
        html: formHtml(asUsdt),
        setup(real, body) {
          let out = null, text = '', now = asUsdt;
          function dress() {
            const input = $('.ex-input', real), toggle = $('.fold-toggle', real), fold = $('.fold-body', real), next = $('.ex-next', real);
            out = $('[data-ex-out]', real);
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
            text = out.textContent;
          }
          dress();
          out.classList.add('is-empty');
          CK.roll(out, '0');
          function choose(to) {
            if (to === now) return;
            now = to;
            $$('[data-wc-pick]', body).forEach((row) => {
              const on = row.getAttribute('data-wc-pick') === to.sym, mark = $('.ex-check', row);
              row.setAttribute('aria-checked', String(on));
              if (mark) { mark.classList.toggle('ex-check--off', !on); mark.innerHTML = on ? icon('check', { size: 20 }) : ''; }
            });
            const was = text;
            real.innerHTML = formHtml(to);
            seal(real);
            dress();
            CK.roll(out, was);
            CK.roll(out, text, 2);
          }
          return {
            alive() {
              out.classList.remove('is-empty');
              CK.roll(out, text, 2);
            },
            demo: sheet && asOther ? async (d) => {
              const to = now === asUsdt ? asOther : asUsdt;
              await d.tap($('[data-ex="pick-to"]', real));
              await d.sheet(true);
              await d.wait(LOOK_MS);
              await d.tap($(`[data-wc-pick="${to.sym}"]`, body));
              choose(to);
              await d.wait(AFTER_PRESS);
              d.away();
              await d.sheet(false);
            } : null
          };
        }
      };
    },

    stop() {
      need(typeof CK.chart === 'function', 'chart');
      const inst = coinOf('not'), ton = coinOf('ton');
      const series = (Array.isArray(inst.series) ? inst.series : []).filter((v) => v > 0);
      need(series.length > 1, 'price line');
      const last = series[series.length - 1], low = Math.min(...series);
      const inside = (price) => price > low + (last - low) * .12;
      const pct = CHIPS.stop.find((p) => inside(last * (1 - p / 100))) || 0;
      const stopAt = pct ? last * (1 - pct / 100) : low + (last - low) * .45;
      const tile = (act, glyph, key) => `<button class="tk-act press-row" type="button" data-act="${act}">${icon(glyph, { size: 22 })}<span>${esc(tx(key))}</span></button>`;
      const point = CK.fmt.decimal ? CK.fmt.decimal() : ',';
      const above = CK.fmt.price(Number((last * 1.15).toPrecision(2))).replace(new RegExp(`\\${point}00(?!\\d)`), '');
      const unit = ton.sym;
      const rowHtml = (kind) => {
        const name = tx(`orders.${kind}`);
        return `
          <div class="or-row" data-kind="${kind}">
            <span class="or-cap"><span class="or-name">${esc(name)}</span><span class="or-usd"></span></span>
            <div class="or-ctl">
              <div class="or-chips" role="group"><i class="or-thumb"></i>${CHIPS[kind].map((p) => `<button class="or-chip" type="button" aria-pressed="false" data-pct="${p}">${kind === 'stop' ? '−' : '+'}${p}%</button>`).join('')}</div>
              <span class="or-box"><input class="or-field" inputmode="decimal" autocomplete="off" placeholder="${esc(tx('orders.price'))}, ${esc(unit)}" readonly><i class="or-unit">${esc(unit)}</i></span>
            </div>
          </div>`;
      };
      return {
        scope: 'tk-card wc-real--stop',
        cuts: 1,
        sheet: { title: tx('detail.orders'), cls: 'sw-status', still: true, html: `<div class="sw-terms"><div class="or-rows">${rowHtml('stop')}${rowHtml('take')}</div></div>` },
        html: `
          <div class="detail-chart"></div>
          <div class="screen-pad tk-acts">
            <button class="cell press-row tk-orders" type="button"><span class="cell-main"><span class="cell-title">${esc(tx('detail.orders'))}</span></span>${icon('shield', { size: 22 })}</button>
            ${tile('share', 'share', 'share.aria')}
          </div>
          <div class="pa-page" data-wc-cut-at="1"><div class="group pa-list pa-all list--free">
            <div class="cell pa-item">${CK.coinLogo(inst, 36)}<span class="pa-main"><b class="pa-sym">${esc(inst.sym)}</b></span><span class="cell-value pa-line">${esc(tx('alerts.above', { price: above }))}</span></div>
          </div></div>`,
        setup(real, body) {
          const chart = CK.chart($('.detail-chart', real), { points: series.slice() });
          const can = chart && typeof chart.levels === 'function';
          const level = (price) => [{ price, kind: 'stop', label: tx('chart.tipStop', { price: CK.fmt.price(stopAt) }) }];
          if (can) chart.levels(level(last));
          const row = body ? $('.or-row[data-kind="stop"]', body) : null;
          const chip = row && pct ? $(`.or-chip[data-pct="${pct}"]`, row) : null;
          let set = false;
          function setStop(on) {
            if (set === on) return;
            set = on;
            if (chip) {
              const thumb = $('.or-thumb', row), field = $('.or-field', row);
              chip.setAttribute('aria-pressed', String(on));
              if (thumb) {
                thumb.style.transform = `translate3d(${CHIPS.stop.indexOf(pct) * 100}%,0,0)`;
                thumb.classList.toggle('is-on', on);
              }
              row.classList.toggle('has-price', on);
              if (field) {
                const price = on ? D().qty(stopAt / ton.price) : '';
                field.value = price;
                field.setAttribute('value', price);
              }
            }
            real.classList.toggle('is-set', on);
            if (can) chart.levels(level(on ? stopAt : last));
          }
          return {
            alive() { if (!chip) setStop(true); },
            demo: async (d, n) => {
              if (chip) setStop(false);
              await d.tap($('.tk-orders', real));
              await d.sheet(true);
              await d.wait(LOOK_MS);
              if (chip) {
                await d.tap(chip);
                setStop(true);
              }
              await d.wait(LOOK_MS);
              d.away();
              await d.sheet(false);
            },
            shown() { setStop(true); },
            destroy() { if (chart && typeof chart.destroy === 'function') chart.destroy(); }
          };
        }
      };
    },

    cheques() {
      const usdt = coinOf('usdt');
      need(typeof CK.tile === 'function', 'tiles');
      const row = (glyph, tone, key) => `<button class="cell cell-tile press-row" type="button"><span>${CK.tile(glyph, { tone })}</span><span class="cell-main"><span class="cell-title">${esc(tx(key))}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`;
      const amount = `${CK.fmt.num(10, 0)} ${usdt.sym}`;
      return {
        scope: 'wc-real--cheque',
        cuts: 1,
        minWidth: 300,
        html: `
          <div class="w-step sw-status cq-claim wc-sheet">
            <div class="cq-claim-card"><div class="cq-claim-head">${CK.coinLogo(usdt, 56)}<b class="cq-claim-amount">${esc(amount)}</b><span class="cq-claim-from"></span></div></div>
            <div class="cq-actions"><button class="btn btn--wide press cq-go" type="button">${esc(tx('cheque.claim'))}</button><button class="btn btn--tinted btn--wide press cq-explore" type="button" hidden>${icon('arrow-up-right', { size: 20 })}<span>${esc(tx('cheque.explorer'))}</span></button></div>
          </div>
          <div class="group" data-wc-cut-at="1">${row('gift', 'orange', 'cheque.mine')}${row('doc', 'teal', 'inv.row')}</div>`,
        setup(real) {
          const text = $('.cq-claim-amount', real), go = $('.cq-go', real), explore = $('.cq-explore', real), card = $('.cq-claim', real);
          let got = false;
          function setGot(on) {
            if (got === on) return;
            got = on;
            text.textContent = on ? tx('cheque.got', { amount }) : amount;
            if (on) { go.setAttribute('hidden', ''); explore.removeAttribute('hidden'); } else { explore.setAttribute('hidden', ''); go.removeAttribute('hidden'); }
            fade(card);
          }
          return {
            demo: async (d) => {
              setGot(false);
              await d.wait(AFTER_PRESS);
              await d.tap(go);
              setGot(true);
              d.away();
              await d.wait(LOOK_MS);
            }
          };
        }
      };
    },

    ref(b) {
      const B = window.DemoBonus;
      let html = '';
      if (B && typeof B.referralHtml === 'function') html = String(B.referralHtml(b.facts || null) || '');
      if (!html) {
        const I = window.DemoApp && DemoApp.invite;
        need(I && typeof I.buttonsHtml === 'function', 'invite');
        const capText = tx('bonus.shareCap'), cap = capText && capText !== 'bonus.shareCap' ? `<span class="bonus-share-cap">${esc(capText)}</span>` : '';
        const share = b.share === '' ? '' : `<p class="bonus-share"><b class="bonus-share-pct">${b.share ? esc(b.share) : '<i class="skel bonus-share-skel"></i>'}</b>${cap}</p>`;
        html = `
          <div class="group bonus-invite">
            <div class="bonus-inv-head"><h2 class="bonus-inv-title">${esc(tx('invite.row'))}</h2></div>
            ${share}
            <div class="bonus-stats" data-n="1"><div class="bonus-stat"><span class="bonus-stat-name">${esc(tx('invite.joined'))}</span><b class="bonus-stat-value">${esc(CK.fmt.num(0, 0))}</b></div></div>
            <div class="bonus-invite-foot">${I.buttonsHtml()}</div>
          </div>`;
      }
      return {
        scope: 'bonus-screen wc-real--ref',
        cuts: 0,
        html,
        setup(real) {
          const copy = $('[data-copy]', real);
          const plain = copy ? Array.from(copy.childNodes) : [];
          function setCopied(on) {
            if (!copy || copy.classList.contains('is-done') === on) return;
            copy.classList.toggle('is-done', on);
            copy.innerHTML = on ? `${icon('check', { size: 20 })}<span>${esc(tx('share.copiedShort'))}</span>` : '';
            if (!on) plain.forEach((n) => copy.appendChild(n));
            Array.from(copy.children).forEach(fade);
          }
          return {
            demo: copy ? async (d) => {
              setCopied(false);
              await d.tap(copy);
              setCopied(true);
              await d.wait(COPIED_MS);
              d.away();
              setCopied(false);
            } : null
          };
        }
      };
    }
  };

  const WORDS = {
    wallet: () => ['welcome.walletTitle', tx('welcome.walletText')],
    swap: () => ['welcome.swapTitle', tx('welcome.swapText', { pct: pctText(feeBps()) })],
    stop: () => ['welcome.stopTitle', tx('welcome.stopText')],
    cheques: () => ['welcome.chequesTitle', tx('welcome.chequesText')],
    ref: (b) => ['welcome.refTitle', b.share === undefined ? '' : tx('welcome.refText')]
  };
  const ORDER = ['wallet', 'swap', 'stop', 'cheques', 'ref'];

  let refKnown = null;
  const canAskShare = () => { const F = window.DemoFees; return !!(F && typeof F.loadFacts === 'function' && typeof F.pctOf === 'function'); };
  const refFirst = () => refKnown || (canAskShare() ? { share: undefined, facts: null } : { share: '', facts: null });
  const refHere = () => !!(CK.tg && CK.tg.inside && CK.market && CK.market.mode === 'live');
  function askShare() {
    const F = window.DemoFees;
    return Promise.resolve().then(() => F.loadFacts()).then((f) => ({ share: f && f.server && f.refShareBps > 0 ? F.pctOf(f.refShareBps) : '', facts: f || null })).catch(() => ({ share: '', facts: null }));
  }

  function blockOf(id, ref) {
    try {
      return BLOCKS[id](ref);
    } catch (err) {
      console.warn(err && err.message ? err.message : err);
      return null;
    }
  }
  const sheetHtml = (sheet) => `
          <div class="sheet-root"><div class="sheet-scrim"></div>
            <div class="sheet wc-panel">
              <div class="sheet-top"><div class="sheet-grabber"></div><div class="sheet-head"><h2 class="sheet-title">${esc(sheet.title)}</h2><button class="navbtn navbtn--flat press" type="button">${icon('close', { size: 20 })}</button></div></div>
              <div class="sheet-body${sheet.cls ? ' ' + sheet.cls : ''}" data-wc-sheet-body>${sheet.html}</div>
            </div>
          </div>`;
  const frameHtml = (block) => `<div class="wc-frame" data-wc-frame><div class="wc-real ${block.scope}" data-wc-real data-wc-cut="0" inert>${block.html}</div><div class="wc-sheets" data-wc-sheets inert>${block.sheet ? sheetHtml(block.sheet) : ''}</div><span class="wc-touch" data-wc-touch><i></i></span></div>`;
  function seal(el) {
    if (el) $$('button, input, a, [tabindex]', el).forEach((n) => n.setAttribute('tabindex', '-1'));
  }

  function markup(list) {
    const n = list.length;
    const slides = list.map((s, i) => `
        <section class="wc-slide${s.block.ground ? ' wc-slide--ground' : ''}" data-wc-slide="${s.id}" role="group" aria-roledescription="slide" aria-label="${esc(tx('welcome.slide', { n: i + 1, count: n }))}"${i ? ' aria-hidden="true"' : ''}>
          <div class="wc-words">
            <h2 class="wc-title" data-motion="row"></h2>
            <p class="wc-text" data-motion="row"></p>
          </div>
          <div class="wc-art" aria-hidden="true">${frameHtml(s.block)}</div>
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
    let ref = { ...refFirst() };
    const list = ORDER.filter((id) => id !== 'ref' || refHere()).map((id) => ({ id, block: blockOf(id, ref), live: null, wasAlive: false })).filter((s) => s.block);
    if (!list.length) return Promise.resolve({ done: false, slide: 0 });
    remember();
    const root = CK.el(markup(list));
    const viewport = $('.wc-viewport', root), track = $('.wc-track', root);
    const slides = $$('.wc-slide', root);
    const nextBtn = $('[data-wc="next"]', root), skipBtn = $('[data-wc="skip"]', root);
    const label = $('.wc-next-label', root), ind = $('.wc-dot-ind', root);
    const stage = document.getElementById('stage');
    const before = document.activeElement;
    let index = 0, pos = 0, slideAnim = null, closing = false, aliveTimer = 0, finish, demo = null;
    const closed = new Promise((resolve) => { finish = resolve; });

    const hidStage = !!stage && stage.getAttribute('aria-hidden') !== 'true';
    if (hidStage) stage.setAttribute('aria-hidden', 'true');
    if (reduced()) root.classList.add('is-still');
    host.appendChild(root);

    const width = () => viewport.clientWidth || host.clientWidth || 1;
    const place = (x) => { pos = x; track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`; };

    const painted = new Set();
    function paintWords(i) {
      const [key, line] = WORDS[list[i].id](ref);
      const title = $('.wc-title', slides[i]), text = $('.wc-text', slides[i]);
      CK.i18n.setKey(title, key);
      if (text.textContent === line) { painted.add(i); return; }
      const late = painted.has(i) && !text.textContent && !!line && i === index && !closing;
      painted.add(i);
      text.textContent = line;
      const m = M();
      if (late && m) m.rows([text], { force: true, fresh: true });
    }
    function fitOne(i) {
      const slide = slides[i], block = list[i].block;
      const art = $('.wc-art', slide), frame = $('[data-wc-frame]', slide), real = $('[data-wc-real]', slide), sheets = $('[data-wc-sheets]', slide);
      const w = width();
      const roomW = art.clientWidth || w, roomH = art.clientHeight || 0;
      real.style.marginTop = '';
      real.style.paddingTop = '';
      const least = block.minScale || SCALE_MIN;
      const sized = () => {
        const down = (v) => Math.floor(v * 1e4 + 1e-6) / 1e4;
        let s = down(Math.min(SCALE_MAX, Math.max(1, roomW / (block.minWidth || LAYOUT_MIN)))), tall = 0;
        const lay = () => { real.style.width = `${Math.ceil(roomW / s - 1e-6)}px`; tall = real.offsetHeight || 0; };
        for (let pass = 0; pass < FIT_PASSES; pass++) {
          lay();
          if (!(tall > 0 && roomH > 0) || tall * s <= roomH + .5) return [s, tall];
          s = down(Math.min(s, roomH / tall));
        }
        lay();
        return [s, tall];
      };
      let cut = 0, h = 0, scale = SCALE_MAX;
      for (;;) {
        real.setAttribute('data-wc-cut', String(cut));
        [scale, h] = sized();
        if (scale >= least || cut >= block.cuts) break;
        cut += 1;
      }
      const spare = Math.max(0, roomH - h * scale);
      const drop = Math.round(spare * BLOCK_DROP);
      let lift = 0;
      if (block.ground && typeof art.getBoundingClientRect === 'function') {
        lift = Math.max(0, Math.ceil((art.getBoundingClientRect().top - slide.getBoundingClientRect().top + drop) / scale));
        if (lift) {
          real.style.marginTop = `${-lift}px`;
          real.style.paddingTop = `${lift}px`;
        }
      }
      real.style.transform = `scale(${scale.toFixed(4)})`;
      real.style.top = `${Math.round(drop + lift * (1 - scale))}px`;
      frame.style.width = `${roomW}px`;
      sheets.style.width = real.style.width;
      sheets.style.height = roomH > 0 ? `${Math.round(roomH / scale)}px` : '';
      sheets.style.transform = `scale(${scale.toFixed(4)})`;
    }
    const fit = () => slides.forEach((_, i) => fitOne(i));
    function setUp(i) {
      const s = list[i], real = $('[data-wc-real]', slides[i]), sheets = $('[data-wc-sheets]', slides[i]);
      seal(real);
      seal(sheets);
      try {
        s.live = s.block.setup ? s.block.setup(real, $('[data-wc-sheet-body]', sheets)) || null : null;
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

    function director(i) {
      const slide = slides[i], frame = $('[data-wc-frame]', slide), touch = $('[data-wc-touch]', slide), sheets = $('[data-wc-sheets]', slide);
      let dead = false, timer = 0, held = null, out = false;
      const at = (el) => {
        const r = el.getBoundingClientRect(), f = frame.getBoundingClientRect();
        return [r.left + r.width / 2 - f.left, r.top + r.height / 2 - f.top];
      };
      const put = (x, y) => { touch.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; };
      const d = {
        get dead() { return dead; },
        wait(ms) {
          return new Promise((resolve, reject) => {
            if (dead) { reject(STOP); return; }
            timer = setTimeout(() => { timer = 0; if (dead) reject(STOP); else resolve(); }, ms);
          });
        },
        async tap(el) {
          if (!el) return;
          const [x, y] = at(el);
          if (!out) {
            put(x + 26, y + 40);
            void touch.offsetWidth;
            out = true;
            touch.classList.add('is-on');
          }
          put(x, y);
          await d.wait(TOUCH_MS);
          touch.classList.remove('is-ring');
          void touch.offsetWidth;
          touch.classList.add('is-down', 'is-ring');
          el.classList.add('wc-down');
          held = el;
          await d.wait(PRESS_MS);
          d.lift();
          await d.wait(AFTER_PRESS);
        },
        lift() {
          touch.classList.remove('is-down');
          if (held) held.classList.remove('wc-down');
          held = null;
        },
        away() { out = false; touch.classList.remove('is-on'); },
        async sheet(up) {
          sheets.classList.toggle('is-up', !!up);
          await d.wait(SHEET_MS);
        },
        stop() {
          dead = true;
          clearTimeout(timer);
          timer = 0;
          d.lift();
          d.away();
          touch.classList.remove('is-ring');
          sheets.classList.remove('is-up');
        }
      };
      return d;
    }
    function stopDemo() {
      if (demo) demo.stop();
      demo = null;
    }
    function play(i) {
      stopDemo();
      const live = list[i].live;
      if (closing || !live) return;
      if (reduced()) {
        if (list[i].block.sheet && list[i].block.sheet.still) $('[data-wc-sheets]', slides[i]).classList.add('is-up');
        try { if (live.shown) live.shown(); } catch (err) { console.warn(err && err.message ? err.message : err); }
        return;
      }
      if (!live.demo) return;
      const d = director(i);
      demo = d;
      (async () => {
        await d.wait(DEMO_AFTER);
        for (let n = 0; ; n++) {
          await live.demo(d, n);
          d.away();
          await d.wait(DEMO_PAUSE);
        }
      })().catch((err) => { if (err !== STOP) console.warn(err && err.message ? err.message : err); });
    }

    function hold() {
      clearTimeout(aliveTimer);
      aliveTimer = 0;
      stopDemo();
      slides.forEach((s) => s.classList.remove('is-live'));
    }
    function land(i) {
      aliveTimer = 0;
      if (closing || i !== index) return;
      slides[i].classList.add('is-live');
      const s = list[i];
      if (!s.wasAlive && s.live && s.live.alive) {
        s.wasAlive = true;
        try { s.live.alive(!reduced()); } catch (err) { console.warn(err && err.message ? err.message : err); }
      }
      play(i);
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


    const refAt = list.findIndex((s) => s.id === 'ref');
    function showRef(next) {
      const was = ref;
      ref = { ...ref, ...next };
      if (closing || refAt < 0) return;
      const block = blockOf('ref', ref);
      if (!block) { ref = was; return; }
      const here = index === refAt && slides[refAt].classList.contains('is-live');
      if (here) stopDemo();
      const real = $('[data-wc-real]', slides[refAt]);
      tearDown(refAt);
      list[refAt].block = block;
      real.setAttribute('class', `wc-real ${block.scope}`);
      real.innerHTML = block.html;
      fitOne(refAt);
      setUp(refAt);
      fitOne(refAt);
      paintWords(refAt);
      if (index === refAt) fade($('.bonus-share-pct', real));
      if (here) play(refAt);
    }
    if (refAt >= 0 && ref.share === undefined) {
      askShare().then((got) => {
        refKnown = got;
        showRef(got);
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
