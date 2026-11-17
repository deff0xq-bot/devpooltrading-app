(function () {
  'use strict';
  const { icon, t: tx } = CK;

  if (CK.i18n && typeof CK.i18n.add === 'function') CK.i18n.add({
    'fees.heroTitle': ['Наша комиссия за обмен и покупку', 'Our fee on swaps and purchases', 'Наша комісія за обмін і купівлю', 'Айырбас пен сатып алуға біздің комиссия'],
    'fees.heroSub': ['Вы видите её до подписи', 'You see it before you sign', 'Ви бачите її до підпису', 'Оны қол қоюдан бұрын көресіз'],
    'fees.partPaid': ['С нашей комиссией', 'With our fee', 'З нашою комісією', 'Біздің комиссиямен'],
    'fees.partFree': ['Без нашей комиссии', 'No fee of ours', 'Без нашої комісії', 'Біздің комиссиясыз'],
    'fees.subTon': ['Плюс газ сети TON', 'Plus TON network gas', 'Плюс газ мережі TON', 'Оған қоса TON желісінің газы'],
    'fees.subBuy': ['Плюс комиссия сети', 'Plus the network fee', 'Плюс комісія мережі', 'Оған қоса желі комиссиясы'],
    'fees.subRoute': ['Два шага, продажа вне TON без комиссии', 'Two steps; a sale outside TON has no fee', 'Два кроки, продаж поза TON без комісії', 'Екі қадам, TON-нан тыс сату комиссиясыз'],
    'fees.step': ['за шаг', 'per step', 'за крок', 'қадамына'],
    'fees.subOrders': ['Когда ордер сработал', 'When the order fires', 'Коли ордер спрацював', 'Ордер орындалғанда'],
    'fees.subP2p': ['Платит продавец', 'Paid by the seller', 'Платить продавець', 'Сатушы төлейді'],
    'fees.subSell': ['Газ сети, в её монете', 'Network gas, in its own coin', 'Газ мережі, в її монеті', 'Желі газы, өз монетасымен'],
    'fees.subWithdraw': ['Только газ сети', 'Only network gas', 'Лише газ мережі', 'Тек желі газы'],
    'forget.bonusMarks': ['Отметки о бонусах, без сумм', 'Bonus marks, without amounts', 'Позначки про бонуси, без сум', 'Бонус белгілері, сомаларсыз'],
    'forget.bonusDrop': ['Пропадёт начисленное, но ещё не готовое к выплате: {sum}', 'Credit not yet ready for payout is lost: {sum}', 'Пропаде нараховане, але ще не готове до виплати: {sum}', 'Төлемге әлі дайын емес есептелген сома жойылады: {sum}'],
    'forget.settling': ['Обмен ещё идёт, попробуйте позже', 'A swap is still going, try later', 'Обмін ще триває, спробуйте пізніше', 'Айырбас әлі жүріп жатыр, кейінірек көріңіз'],
    'forget.bonusUnreadable': ['Бонусы не читаются, попробуйте позже', 'Bonuses can’t be read, try later', 'Бонуси не читаються, спробуйте пізніше', 'Бонустар оқылмайды, кейінірек көріңіз'],
    'forget.payDetails': ['Реквизиты для оплаты: {n}', 'Payment details: {n}', 'Реквізити для оплати: {n}', 'Төлем деректемелері: {n}'],
    'forget.dealProfile': ['Профиль для сделок', 'Profile for deals', 'Профіль для угод', 'Мәмілелерге арналған профиль'],
    'forget.dealsKept': ['Завершённые сделки: {n}, для споров', 'Finished deals: {n}, for disputes', 'Завершені угоди: {n}, для спорів', 'Аяқталған мәмілелер: {n}, даулар үшін'],
    'forget.dealsOpen': ['Сначала закройте сделки и объявления', 'Close your deals and ads first', 'Спершу закрийте угоди й оголошення', 'Алдымен мәмілелер мен хабарландыруларды жабыңыз']
  });
  const p2pMode = () => (window.DemoApp && DemoApp.p2pMode) || 'open';
  const p2pShown = () => p2pMode() === 'open';
  const canOpenP2P = () => p2pShown() && !!(window.DemoApp && typeof DemoApp.openP2PMine === 'function');
  const T = CK.ton;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => CK.esc(String(s));
  const NANO = /^\d{1,30}$/;
  const validBps = (v) => Number.isInteger(v) && v >= 0 && v <= 10000;

  function pctOf(bps) {
    const whole = Math.floor(bps / 100);
    const rest = String(bps % 100).padStart(2, '0').replace(/0+$/, '');
    const en = CK.i18n.lang === 'en';
    const number = rest ? `${whole}${en ? '.' : ','}${rest}` : String(whole);
    return en ? `${number}%` : `${number} %`;
  }

  const loginData = () => CK.market.ready.then(() => (CK.market.mode === 'live' ? CK.tg.whenInitData() : ''));


  let facts = null;
  let factsJob = null;
  function loadFacts() {
    if (facts) return Promise.resolve(facts);
    if (!factsJob) {
      factsJob = CK.market.ready.then(() => {
        if (CK.market.mode !== 'live') return null;
        return fetch('api/fees', { cache: 'no-store' }).then((res) => res.json()).then((body) => {
          if (!body || body.ok !== true || !validBps(body.feeBps)) return null;
          facts = { feeBps: body.feeBps, refShareBps: validBps(body.refShareBps) ? body.refShareBps : 0, p2pFeeBps: validBps(body.p2pFeeBps) ? body.p2pFeeBps : null, server: true };
          return facts;
        });
      }).catch(() => null).finally(() => { factsJob = null; });
    }
    return factsJob.then((got) => got || { feeBps: T.FEE_BPS, refShareBps: 0, server: false });
  }

  const SOFT = 'cubic-bezier(.22, 1, .36, 1)';
  const figure = (name, text, waiting) => `<span class="fee-figure${waiting ? ' skel' : ''}" data-fee="${name}">${esc(text)}</span>`;
  function cell(titleKey, o, waiting) {
    if (!o.text) return '';
    return `<div class="group fee-item" data-motion="block">
        <span class="fee-icon" aria-hidden="true">${icon(o.icon, { size: 20 })}</span>
        <span class="fee-main"><span class="fee-title">${esc(tx(titleKey))}</span><span class="fee-sub">${esc(tx(o.sub))}</span></span>
        <span class="fee-side">${figure(o.name, o.text, waiting)}${o.note ? `<span class="fee-step">${esc(tx(o.note))}</span>` : ''}</span>
      </div>`;
  }
  function figuresOf(f) {
    const p2pBps = CK.feeConfig ? CK.feeConfig.bps : f.p2pFeeBps;
    return { main: pctOf(f.feeBps), tonSwap: pctOf(f.feeBps), buyOther: pctOf(T.FEE_BPS), route: pctOf(T.FEE_BPS), orders: pctOf(f.feeBps), p2p: validBps(p2pBps) ? pctOf(p2pBps) : '', sellOther: pctOf(0), withdraw: pctOf(0) };
  }
  function paintFees(body, f) {
    const v = figuresOf(f);
    const waiting = f.server === null;
    const paid = [
      cell('fees.tonSwap', { icon: 'swap', sub: 'fees.subTon', name: 'tonSwap', text: v.tonSwap }, waiting),
      cell('fees.buyOther', { icon: 'arrow-down-left', sub: 'fees.subBuy', name: 'buyOther', text: v.buyOther }, waiting),
      cell('fees.route', { icon: 'layers', sub: 'fees.subRoute', name: 'route', text: v.route, note: 'fees.step' }, waiting),
      cell('fees.orders', { icon: 'target', sub: 'fees.subOrders', name: 'orders', text: v.orders }, waiting),
      p2pShown() ? cell('fees.p2p', { icon: 'users', sub: 'fees.subP2p', name: 'p2p', text: v.p2p }, waiting) : ''
    ];
    const free = [
      cell('fees.sellOther', { icon: 'arrow-up-right', sub: 'fees.subSell', name: 'sellOther', text: v.sellOther }, waiting),
      cell('fees.withdraw', { icon: 'arrow-up', sub: 'fees.subWithdraw', name: 'withdraw', text: v.withdraw }, waiting)
    ];
    const note = f.server === false ? tx('fees.offline') : '';
    body.innerHTML = `<div class="fee-page">
        <div class="group fee-hero" data-motion="block">
          <span class="fee-hero-top"><span class="fee-hero-figure">${figure('main', v.main, waiting)}</span><span class="tag fee-hero-note" aria-live="polite"${note ? '' : ' hidden'}>${esc(note)}</span><span class="fee-hero-mark" aria-hidden="true">${icon('shield', { size: 22 })}</span></span>
          <span class="fee-hero-title">${esc(tx('fees.heroTitle'))}</span>
          <span class="fee-hero-sub">${esc(tx('fees.heroSub'))}</span>
        </div>
        <section class="section fee-part"><h2 class="section-title" data-motion="block">${esc(tx('fees.partPaid'))}</h2><div class="fee-list">${paid.join('')}</div></section>
        <section class="section fee-part"><h2 class="section-title" data-motion="block">${esc(tx('fees.partFree'))}</h2><div class="fee-list">${free.join('')}</div></section>
      </div>`;
  }
  function fillFees(body, f) {
    const v = figuresOf(f);
    const calm = CK.reducedMotion();
    body.querySelectorAll('[data-fee]').forEach((el) => {
      const text = v[el.getAttribute('data-fee')];
      if (text) el.textContent = text;
      if (!el.classList.contains('skel')) return;
      el.classList.remove('skel');
      if (!calm && el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: SOFT });
    });
    const note = body.querySelector('.fee-hero-note');
    if (!note) return;
    note.textContent = f.server === false ? tx('fees.offline') : '';
    note.hidden = !note.textContent;
    if (note.textContent && !calm && note.animate) note.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: SOFT });
  }

  function openFees(from, stack) {
    if (CK.sheet.top) return;
    const screen = CK.screen({ title: () => tx('fees.row') });
    screen.el.classList.add('no-tabbar', 'screen--fees');
    stack.push(screen, { returnFocus: from });
    let shown = { feeBps: T.FEE_BPS, refShareBps: 0, server: null };
    paintFees(screen.body, shown);
    if (CK.motion && CK.motion.blocks) CK.motion.blocks(Array.from(screen.body.querySelectorAll('[data-motion="block"]')));
    loadFacts().then((f) => {
      shown = f;
      if (p2pShown() && figuresOf(f).p2p && !screen.body.querySelector('[data-fee="p2p"]')) paintFees(screen.body, f);
      else fillFees(screen.body, f);
    });
    CK.i18n.bind(screen.el, () => paintFees(screen.body, shown));
  }


  function call(method) {
    return loginData().then((initData) => {
      if (!initData) throw Object.assign(new Error('tg_only'), { code: 'tg_only' });
      return fetch('api/me/forget', { method, headers: { Authorization: 'tma ' + initData }, cache: 'no-store' })
        .then((res) => res.json().catch(() => null))
        .then((json) => {
          if (!json || json.ok !== true) throw Object.assign(new Error((json && json.error) || 'bad_response'), { code: (json && typeof json.error === 'string' && json.error) || 'bad_response', detail: json || null });
          return json;
        });
    });
  }

  const gramText = (nano) => {
    const v = T.fromUnits(BigInt(nano), 9);
    return CK.fmt.num(v, v === 0 ? 0 : Math.min(CK.fmt.priceDigits(v), 9)) + ' GRAM';
  };
  function blockerText(b) {
    if (b.code === 'open_orders') return tx('forget.openOrders', { n: Number.isInteger(b.count) ? b.count : 1 });
    if (b.code === 'ref_unpaid') {
      const sum = NANO.test(String(b.owedNano)) ? gramText(b.owedNano) : '';
      return NANO.test(String(b.minNano)) ? tx('forget.unpaidSmall', { sum, min: gramText(b.minNano) }) : tx('forget.unpaid', { sum });
    }
    if (b.code === 'orders_unreadable') return tx('forget.unreadable');
    if (b.code === 'p2p_open') return tx(p2pShown() ? 'forget.p2pOpen' : 'forget.dealsOpen');
    if (b.code === 'ref_settling' || b.code === 'bonus_settling') return tx('forget.settling');
    if (b.code === 'bonus_unreadable') return tx('forget.bonusUnreadable');
    return tx('forget.fail');
  }
  const SAID = { ref_settling: 'forget.settling', bonus_settling: 'forget.settling', bonus_unreadable: 'forget.bonusUnreadable' };
  const errorText = (code, loading) => (code === 'tg_only' ? tx('forget.tgOnly') : code === 'expired' ? tx('forget.stale') : SAID[code] ? tx(SAID[code]) : tx(loading ? 'forget.loadFail' : 'forget.fail'));

  function linesOf(plan) {
    const by = new Map((plan.stores || []).map((row) => [row.name, row]));
    const n = (name, field) => (by.get(name) && Number.isInteger(by.get(name)[field]) ? by.get(name)[field] : 0);
    const goes = [];
    const wallet = tx('forget.wallet');
    const stays = [wallet];
    if (n('alerts', 'remove')) goes.push(tx('forget.alerts', { n: n('alerts', 'remove') }));
    if (n('orders', 'remove')) goes.push(tx('forget.orders', { n: n('orders', 'remove') }));
    if (n('referral', 'remove')) goes.push(tx('forget.referral'));
    const named = p2pShown();
    if (n('p2p', 'methods')) goes.push(tx(named ? 'forget.p2p' : 'forget.payDetails', { n: n('p2p', 'methods') }));
    if (n('p2p', 'person')) goes.push(tx(named ? 'forget.p2pName' : 'forget.dealProfile'));
    if (n('bot', 'remove')) goes.push(tx('forget.bot'));
    if (n('botPrefs', 'remove')) goes.push(tx('forget.botPrefs'));
    if (n('directory', 'remove')) goes.push(tx('forget.directory'));
    if (n('cheques', 'remove')) goes.push(tx('forget.cheques', { n: n('cheques', 'remove') }));
    const bonus = by.get('bonus');
    if (bonus && NANO.test(String(bonus.dropNano)) && BigInt(bonus.dropNano) > 0n) goes.push(tx('forget.bonusDrop', { sum: gramText(bonus.dropNano) }));
    if (n('orders', 'keep')) stays.push(tx('forget.ordersKept', { n: n('orders', 'keep') }));
    const ref = by.get('referral');
    if (bonus && bonus.note === 'bonus_marks') stays.push(tx('forget.bonusMarks'));
    if (ref && ref.note === 'payout_record') stays.push(tx('forget.payouts'));
    if (ref && ref.note === 'not_supported') stays.push(tx('forget.referralKept'));
    if (n('p2p', 'keep')) stays.push(tx(named ? 'forget.p2pDeals' : 'forget.dealsKept', { n: n('p2p', 'keep') }));
    if (n('backup_guard', 'keep')) stays.push(tx('forget.guard'));
    if (n('directory', 'keep')) stays.push(tx('forget.directoryOff'));
    const open = n('cheques', 'open') || (by.get('cheques') && by.get('cheques').note === 'open_cheques') ? tx('forget.chequesOpen', { n: n('cheques', 'open') || 1 }) : '';
    if (open) stays.push(open);
    return { goes, stays, wallet, open };
  }

  function openForget() {
    if (CK.sheet.top) return;
    CK.haptic.light();
    loginData().then((initData) => {
      if (!initData) {
        CK.toast(tx('forget.tgOnly'), { icon: 'info', tone: 'accent' });
        return;
      }
      if (CK.sheet.top) return;
      CK.sheet.open({
        title: tx('forget.title'),
        detents: [CK.sheet.fixedDetent(FORGET_HEIGHT + CK.sheet.safeBottom())],
        build(b, sheet) { fillForget(b, sheet); }
      });
    });
  }
  const FORGET_HEIGHT = 466;
  function fillForget(b, sheet) {
    b.innerHTML = `
      <div class="fg-wrap vstack vstack--24">
        <div class="fg-body"><div class="group"><div class="wallet-skel"></div><div class="wallet-skel"></div></div></div>
        <div class="vstack vstack--8">
          <p class="fold-line fg-keep" hidden></p>
          <p class="fold-line fg-open" hidden></p>
        </div>
      </div>`;
    const dock = CK.el(`<div class="sheet-dock fg-dock vstack vstack--8">
        <p class="fold-line fold-line--danger fg-line" role="alert" hidden></p>
        <button class="btn btn--wide btn--sell press fg-go" type="button" disabled><span></span></button>
      </div>`);
    sheet.el.appendChild(dock);
    const bodyEl = $('.fg-body', b), line = $('.fg-line', dock), go = $('.fg-go', dock), keep = $('.fg-keep', b), openEl = $('.fg-open', b);
    $('span', go).textContent = tx('forget.go');
    let busy = false;
    const say = (text) => {
      line.textContent = text || '';
      line.hidden = !text;
    };
    const sayBlockers = (blockers) => {
      line.replaceChildren();
      blockers.forEach((b, i) => {
        if (i) line.append(' ');
        if (b.code !== 'p2p_open' || !canOpenP2P()) return void line.append(blockerText(b));
        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'fg-link';
        link.textContent = blockerText(b);
        link.addEventListener('click', () => {
          CK.haptic.selection();
          DemoApp.openP2PMine();
        });
        line.append(link);
      });
      line.hidden = !blockers.length;
    };
    const show = (el, text) => {
      el.textContent = text || '';
      el.hidden = !text;
    };
    const fold = (id, label, rows) => `
      <div class="fg-fold">
        <button class="fold-toggle fold-toggle--row" type="button" aria-expanded="false" aria-controls="${id}"><span>${esc(label)} · ${rows.length}</span>${icon('chevron-down')}</button>
        <div class="fold-body" id="${id}" hidden>${rows.map((text) => `<p class="fold-line">${esc(text)}</p>`).join('')}</div>
      </div>`;
    bodyEl.addEventListener('click', (e) => {
      const toggle = e.target.closest('.fold-toggle');
      if (!toggle) return;
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      const part = b.querySelector('#' + toggle.getAttribute('aria-controls'));
      if (part) part.hidden = !open;
      CK.haptic.selection();
    });
    function paint(plan) {
      const { goes, stays, wallet, open } = linesOf(plan);
      const folded = stays.filter((text) => text !== wallet && text !== open);
      bodyEl.className = 'fg-body vstack vstack--8';
      bodyEl.innerHTML = (goes.length ? fold('fg-goes', tx('forget.goes'), goes) : `<p class="fold-line">${esc(tx('forget.nothing'))}</p>`) + (folded.length ? fold('fg-stays', tx('forget.stays'), folded) : '');
      show(keep, wallet);
      show(openEl, open);
      const blockers = Array.isArray(plan.blockers) ? plan.blockers : [];
      sayBlockers(blockers);
      go.hidden = !goes.length;
      go.disabled = blockers.length > 0;
    }
    const settle = () => {
      if (!CK.reducedMotion()) [bodyEl, keep, openEl, line].forEach((el) => { if (!el.hidden) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); });
    };
    function load() {
      call('GET').then((plan) => {
        if (!b.isConnected) return;
        paint(plan);
        settle();
      }, (err) => {
        if (!b.isConnected) return;
        bodyEl.innerHTML = '';
        say(errorText(err.code, true));
        go.hidden = true;
        settle();
      });
    }
    go.addEventListener('click', () => {
      if (busy || go.disabled) return;
      busy = true;
      go.disabled = true;
      CK.haptic.medium();
      call('POST').then(() => {
        CK.haptic.success();
        sheet.close();
        CK.toast(tx('forget.done'), { icon: 'check-circle' });
        if (CK.wallet && CK.wallet.directory && CK.wallet.directory.forgot) CK.wallet.directory.forgot();
        if (window.DemoAlerts) DemoAlerts.load().catch(() => {});
      }, (err) => {
        CK.haptic.error();
        busy = false;
        if (!b.isConnected) return;
        const blockers = err.detail && Array.isArray(err.detail.blockers) ? err.detail.blockers : null;
        if (blockers && blockers.length) {
          sayBlockers(blockers);
          return;
        }
        go.disabled = false;
        say(errorText(err.code));
      });
    });
    load();
  }

  window.DemoFees = { openFees, openForget, pctOf, linesOf, blockerText, loadFacts };
})();
