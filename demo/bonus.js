(function () {
  'use strict';
  const { icon, t: tx } = CK;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => CK.esc(String(s));

  CK.i18n.add({
    'bonus.free': ['Обмен без нашей комиссии', 'A swap without our fee', 'Обмін без нашої комісії', 'Біздің комиссиясыз айырбас'],
    'bonus.freeLine': ['Один раз, в сети TON от ${min} до ${max}', 'Once, on TON, from ${min} to ${max}', 'Один раз, у мережі TON від ${min} до ${max}', 'Бір рет, TON желісінде, кемінде ${min}, ең көбі ${max}'],
    'bonus.ready': ['Доступен', 'Available', 'Доступний', 'Қолжетімді'],
    'bonus.busy': ['Обмен идёт', 'Swap in progress', 'Обмін триває', 'Айырбас жүріп жатыр'],
    'bonus.tomorrow': ['Завтра', 'Tomorrow', 'Завтра', 'Ертең'],
    'bonus.go': ['Перейти к обмену', 'Go to Swap', 'Перейти до обміну', 'Айырбасқа өту'],
    'bonus.used': ['Обмен без нашей комиссии использован', 'The swap without our fee is used', 'Обмін без нашої комісії використано', 'Біздің комиссиясыз айырбас пайдаланылды'],
    'bonus.shareCap': ['доля нашей комиссии с обменов друзей в TON', 'share of our fee on your friends\' TON swaps', 'частка нашої комісії з обмінів друзів у TON', 'достарыңыздың TON-дағы айырбастарынан түсетін комиссиямыздың үлесі'],
    'bonus.note': ['Начисленное выплачиваем в GRAM на ваш кошелёк', 'We pay what you earn in GRAM to your wallet', 'Нараховане виплачуємо в GRAM на ваш гаманець', 'Есептелгенді GRAM түрінде әмияныңызға төлейміз'],
    'swap.feeFreeTag': ['Бонус', 'Bonus', 'Бонус', 'Бонус']
  });

  const FRESH_MS = 60000;
  const VALUE_OF = { ready: 'bonus.ready', busy: 'bonus.busy', full: 'bonus.tomorrow' };
  const STATES = ['ready', 'busy', 'full', 'used', 'off'];
  const KEPT_KEY = 'ck-bonus-free';
  const JOINED_KEY = 'ck-bonus-joined';
  const SHARE_KEY = 'ck-bonus-share';
  const UNIT = 'GRAM';
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const SKEL = '<i class="skel bonus-skel" aria-hidden="true"></i>';


  let data = null, dataAt = 0, job = null, epoch = 0;
  const heard = [];
  const whole = (v, fallback) => (Number.isInteger(v) && v > 0 && v <= 100000 ? v : fallback);
  const nano = (v) => (typeof v === 'string' && /^\d{1,30}$/.test(v) ? BigInt(v) : 0n);
  function clean(body) {
    if (!body || body.ok !== true) return null;
    const free = body.free && typeof body.free === 'object' ? body.free : {};
    const on = body.on === true;
    return {
      on,
      forgotten: body.forgotten === true,
      free: { state: on && STATES.includes(free.state) ? free.state : 'off', minUsd: whole(free.minUsd, 10), maxUsd: whole(free.maxUsd, 50) },
      earned: nano(body.earned),
      paid: nano(body.paid)
    };
  }
  function keptState() {
    try { return localStorage.getItem(KEPT_KEY) || ''; } catch (_) { return ''; }
  }
  function keepState(state) {
    try { localStorage.setItem(KEPT_KEY, state); } catch (_) { }
  }
  function keptJoined() {
    try {
      const v = localStorage.getItem(JOINED_KEY);
      return v !== null && /^\d{1,9}$/.test(v) ? Number(v) : null;
    } catch (_) {
      return null;
    }
  }
  function keepJoined(n) {
    try {
      if (Number.isInteger(n) && n >= 0) localStorage.setItem(JOINED_KEY, String(n));
      else localStorage.removeItem(JOINED_KEY);
    } catch (_) { }
  }
  function keptShare() {
    try {
      const v = localStorage.getItem(SHARE_KEY);
      return v !== null && /^\d{1,5}$/.test(v) && Number(v) <= 10000 ? Number(v) : null;
    } catch (_) {
      return null;
    }
  }
  function keepShare(bps) {
    try { localStorage.setItem(SHARE_KEY, String(bps)); } catch (_) { }
  }
  function expire() {
    dataAt = 0;
    epoch += 1;
    if (keptState() === 'ready') keepState('busy');
  }
  function load(force) {
    if (!force && data && Date.now() - dataAt < FRESH_MS) return Promise.resolve(data);
    if (job) return job;
    job = CK.market.ready
      .then(() => (CK.market.mode === 'live' ? CK.tg.whenInitData() : ''))
      .then((initData) => {
        if (!initData) return null;
        return fetch('api/bonus', { headers: { Authorization: 'tma ' + initData }, cache: 'no-store' })
          .then((res) => (res && res.status === 404 ? undefined : res.json().catch(() => null)))
          .then((body) => {
            if (body === undefined) return null;
            const got = clean(body);
            if (!got) throw Object.assign(new Error((body && body.error) || 'bad_response'), { code: (body && body.error) || 'bad_response' });
            data = got;
            dataAt = Date.now();
            keepState(got.forgotten ? 'off' : got.free.state);
            heard.slice().forEach((fn) => fn(got));
            return got;
          });
      })
      .finally(() => { job = null; });
    return job;
  }
  const freeShown = (d) => !!d && !d.forgotten && !!VALUE_OF[d.free.state];


  const fade = (el) => {
    if (el && el.animate && !CK.reducedMotion()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  };
  const blocks = (els, opts) => {
    const list = els.filter((el) => el && !el.hidden);
    if (list.length && CK.motion) CK.motion.blocks(list, opts);
  };
  const gram = (v) => (window.DemoPayouts && DemoPayouts.gramText ? DemoPayouts.gramText(v) : `${v} nano`).replace(/\s*GRAM$/, '');


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

  function build(body, ctx) {
    const I = ctx.invite || (window.DemoApp && DemoApp.invite) || null;
    const P = ctx.p2p || (window.DemoApp && DemoApp.p2pRow) || null;
    body.innerHTML = `
      <div class="group bonus-p2p" hidden><button class="cell press-row" type="button" data-p2p><span class="cell-main"><span class="cell-title" data-t="tab.p2p"></span></span><span class="cell-value" data-p2p-deals></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>
      <div class="group bonus-free" hidden>
        <div class="bonus-art" aria-hidden="true">${GIFT}<span class="bonus-zero" data-zero></span></div>
        <span class="tag bonus-state" data-free-value></span>
        <h2 class="bonus-title" data-t="bonus.free"></h2>
        <p class="bonus-line" data-free-line></p>
        <button class="btn btn--wide bonus-go" type="button" data-free><span data-t="bonus.go"></span></button>
      </div>
      <div class="group bonus-used" hidden><div class="cell"><span class="bonus-used-mark" aria-hidden="true">${icon('tab-gift', { size: 22 })}</span><span class="cell-main"><span class="cell-title" data-t="bonus.used"></span></span></div></div>
      <div class="group bonus-fail" hidden><div class="cell"><span class="cell-main"><span class="cell-title bonus-dim" data-t="common.loadFail"></span></span><button class="section-link press" type="button" data-retry data-t="common.retry"></button></div></div>
      <div class="group bonus-invite">
        <div class="bonus-inv-head"><h2 class="bonus-inv-title" data-t="invite.row"></h2>${FRIENDS}</div>
        <p class="bonus-share" data-share hidden><b class="bonus-share-pct" data-share-pct></b><span class="bonus-share-cap" data-t="bonus.shareCap"></span></p>
        <div class="bonus-stats" data-stats>
          <div class="bonus-stat" data-joined-row><span class="bonus-stat-name" data-t="invite.joined"></span><b class="bonus-stat-value" data-joined></b></div>
        </div>
        <div class="bonus-invite-foot">${I ? I.fieldHtml('invite-link') + I.buttonsHtml() : ''}</div>
        <div class="bonus-stats bonus-sums" data-sums hidden>
          <div class="bonus-stat" data-earned-row hidden><span class="bonus-stat-name" data-unit="invite.earned"></span><b class="bonus-stat-value" data-earned></b></div>
          <div class="bonus-stat" data-paid-row hidden><span class="bonus-stat-name" data-unit="invite.paid"></span><b class="bonus-stat-value" data-paid></b></div>
        </div>
        <p class="bonus-note" data-note data-t="bonus.note" hidden></p>
      </div>`;
    const p2pGroup = $('.bonus-p2p', body), freeGroup = $('.bonus-free', body), usedGroup = $('.bonus-used', body), failGroup = $('.bonus-fail', body), inviteGroup = $('.bonus-invite', body);
    const freeValue = $('[data-free-value]', body), freeGo = $('[data-free]', body), joinedRow = $('[data-joined-row]', body), joined = $('[data-joined]', body), shareLine = $('[data-share]', body);
    const stats = $('[data-stats]', body), sums = $('[data-sums]', body), foot = $('.bonus-invite-foot', body), sharePct = $('[data-share-pct]', body), earnedRow = $('[data-earned-row]', body), paidRow = $('[data-paid-row]', body), note = $('[data-note]', body);
    const link = I ? $('.invite-link', inviteGroup) : null, send = I ? $('[data-send]', inviteGroup) : null, copy = I ? $('[data-copy]', inviteGroup) : null;
    const st = { invite: 'wait', bonus: null, failed: false, asking: false, share: keptShare(), shareWait: false, kept: keptState(), joined: keptJoined(), shown: false };
    if (link) link.hidden = true;

    const topOf = (el) => (el && !el.hidden && el.getBoundingClientRect ? el.getBoundingClientRect().top : null);
    const slide = (el, dy) => {
      if (Math.abs(dy) > 1 && el.animate) el.animate([{ transform: `translate3d(0,${dy}px,0)` }, { transform: 'none' }], { duration: 380, easing: EASE });
    };
    function glide(change) {
      if (!st.shown || CK.reducedMotion()) return void change();
      const parts = [stats, foot, sums, note];
      const g0 = topOf(inviteGroup), k0 = parts.map(topOf);
      change();
      const g1 = topOf(inviteGroup);
      if (g0 === null || g1 === null) return;
      const k1 = parts.map(topOf);
      slide(inviteGroup, g0 - g1);
      parts.forEach((el, i) => {
        if (k0[i] !== null && k1[i] !== null) slide(el, (k0[i] - g0) - (k1[i] - g1));
      });
    }

    function words() {
      body.querySelectorAll('[data-t]').forEach((el) => { el.textContent = tx(el.dataset.t); });
      body.querySelectorAll('[data-unit]').forEach((el) => { el.textContent = `${tx(el.dataset.unit)}, ${UNIT}`; });
      $('[data-zero]', body).textContent = `${CK.fmt.num(0, 0)}${CK.i18n.lang === 'en' ? '' : '\u00a0'}%`;
    }
    function paintP2P() {
      const shown = P ? P.shown : null;
      const appearing = p2pGroup.hidden && !!shown;
      p2pGroup.hidden = !shown;
      $('[data-p2p-deals]', p2pGroup).textContent = shown && shown.deals ? String(shown.deals) : '';
      if (appearing && st.shown) blocks([p2pGroup]);
    }
    function paintFree() { glide(drawFree); }
    function drawFree() {
      const d = st.bonus;
      const wasHidden = freeGroup.hidden, wasWait = freeGroup.classList.contains('is-wait'), failWas = failGroup.hidden;
      const known = d ? (d.forgotten ? 'off' : d.free.state) : st.failed ? '' : st.kept;
      const state = VALUE_OF[known] ? known : '';
      const wait = !state && !d && !st.failed && !st.kept && st.asking;
      const show = !!state || wait;
      freeGroup.hidden = !show;
      freeGroup.classList.toggle('is-wait', wait);
      freeGroup.setAttribute('aria-busy', String(wait));
      failGroup.hidden = !(st.failed && !d);
      const used = known === 'used', usedWas = usedGroup.hidden;
      usedGroup.hidden = !used;
      const free = d ? d.free : { minUsd: 10, maxUsd: 50 };
      $('[data-free-line]', freeGroup).textContent = tx('bonus.freeLine', { min: free.minUsd, max: free.maxUsd });
      const value = state ? tx(VALUE_OF[state]) : '';
      if (freeValue.textContent !== value) {
        const changing = !!freeValue.textContent && !freeGroup.hidden && !wasHidden;
        freeValue.textContent = value;
        if (changing && value) fade(freeValue);
      }
      const ready = state === 'ready';
      freeGroup.classList.toggle('is-ready', ready);
      freeGroup.classList.toggle('is-full', state === 'full');
      freeGo.disabled = !ready;
      freeGo.setAttribute('aria-disabled', String(!ready));
      if (wasWait && !wait && show) Array.from(freeGroup.children).forEach(fade);
      if (show && wasHidden && st.shown) blocks([freeGroup]);
      const after = (el) => (wasHidden ? blocks([el]) : fade(el));
      if (used && usedWas && st.shown) after(usedGroup);
      if (!failGroup.hidden && failWas && st.shown) after(failGroup);
    }
    function paintInvite() {
      const mine = I ? I.now : null;
      const next = st.invite;
      if (link) {
        const cannot = next !== 'ok' && next !== 'wait';
        link.classList.toggle('is-wait', next !== 'ok');
        link.hidden = !cannot;
        if (next === 'ok' && mine) I.show(link, I.link(mine.code));
        else link.textContent = !cannot ? '' : next === 'outside' ? tx('invite.inTelegram') : next === 'forgotten' ? tx('invite.forgotten') : tx('common.loadFail');
      }
      const fresh = next === 'ok' && mine && Number.isInteger(Number(mine.joined)) && Number(mine.joined) >= 0 ? Number(mine.joined) : null;
      if (fresh !== null) st.joined = fresh;
      if (next === 'forgotten') st.joined = null;
      if (fresh !== null || next === 'forgotten') keepJoined(st.joined);
      const known = I && (next === 'ok' || next === 'wait' || next === 'failed') ? st.joined : null;
      joinedRow.hidden = !I || (known === null && next !== 'wait');
      const count = known !== null ? CK.fmt.compact(known) : '';
      if (known === null) {
        if (!joinedRow.hidden && !joined.querySelector('.skel')) joined.innerHTML = SKEL;
      } else if (joined.textContent !== count || joined.querySelector('.skel')) {
        const filling = !!joined.querySelector('.skel');
        joined.textContent = count;
        if (filling) fade(joined);
      }
      const canShare = !!(window.DemoFees && DemoFees.pctOf);
      const shareOn = canShare && (st.share > 0 || (st.share === null && st.shareWait));
      const drawShare = () => {
        shareLine.hidden = !shareOn;
        if (!shareOn) return;
        if (st.share > 0) {
          const pct = DemoFees.pctOf(st.share), filling = !!sharePct.querySelector('.skel');
          if (sharePct.textContent !== pct || filling) sharePct.textContent = pct;
          if (filling) fade(sharePct);
        } else if (!sharePct.querySelector('.skel')) sharePct.innerHTML = '<i class="skel bonus-share-skel" aria-hidden="true"></i>';
      };
      if (shareLine.hidden === shareOn) glide(drawShare);
      else drawShare();
      if (send) {
        send.disabled = next !== 'ok' && next !== 'failed';
        $('span', send).textContent = tx(next === 'failed' ? 'common.retry' : 'common.send');
      }
      if (copy) copy.disabled = next !== 'ok';
      paintMoney();
    }
    function paintMoney() {
      const mine = I ? I.now : null;
      const earned = st.bonus ? st.bonus.earned : mine && mine.earned !== null ? mine.earned : 0n;
      const paid = st.bonus ? st.bonus.paid : mine && mine.paid !== null ? mine.paid : 0n;
      const has = earned > 0n && st.invite !== 'forgotten';
      const appearing = earnedRow.hidden && has;
      earnedRow.hidden = !has;
      paidRow.hidden = !(has && paid > 0n);
      note.hidden = !has;
      if (has) {
        $('[data-earned]', earnedRow).textContent = gram(earned);
        $('[data-paid]', paidRow).textContent = gram(paid);
      }
      stats.hidden = joinedRow.hidden;
      const n = [earnedRow, paidRow].filter((el) => !el.hidden).length;
      sums.hidden = !n;
      sums.setAttribute('data-n', String(n));
      sums.removeAttribute('data-wide');
      if (n > 1 && [earnedRow, paidRow].some((row) => { const v = $('.bonus-stat-value', row); return v.scrollWidth > v.clientWidth; })) sums.setAttribute('data-wide', '');
      if (appearing && st.shown) [earnedRow, paidRow, note].forEach((el) => { if (!el.hidden) fade(el); });
    }

    function loadInvite(again) {
      if (!I) return;
      if (I.now && !again) {
        st.invite = 'ok';
        paintInvite();
      } else if (!I.now) {
        st.invite = 'wait';
        paintInvite();
      }
      I.reload().then((mine) => {
        st.invite = mine ? 'ok' : 'outside';
        paintInvite();
      }, (err) => {
        st.invite = err && err.message === 'forgotten' ? 'forgotten' : I.now ? 'ok' : 'failed';
        paintInvite();
      });
      if (window.DemoFees && DemoFees.loadFacts) {
        st.shareWait = true;
        paintInvite();
        DemoFees.loadFacts().then((f) => {
          st.shareWait = false;
          st.share = f && f.server && f.refShareBps > 0 ? f.refShareBps : 0;
          if (f && f.server) keepShare(st.share);
          paintInvite();
        }, () => {
          st.shareWait = false;
          paintInvite();
        });
      }
    }
    function loadBonus(force) {
      st.asking = true;
      if (!st.bonus) paintFree();
      load(force).then((d) => {
        st.asking = false;
        st.failed = false;
        st.bonus = d;
        if (!d) st.kept = '';
        if (d && d.forgotten && st.invite !== 'ok') st.invite = 'forgotten';
        paintFree();
        paintInvite();
      }, (err) => {
        console.warn('bonus:', err && err.code);
        st.asking = false;
        st.failed = true;
        paintFree();
      });
    }

    body.addEventListener('click', (e) => {
      if (e.target.closest('[data-p2p]')) {
        CK.haptic.selection();
        if (P) P.open(ctx.stack());
        return;
      }
      const free = e.target.closest('[data-free]');
      if (free && free.getAttribute('aria-disabled') !== 'true') {
        CK.haptic.selection();
        if (ctx.goTab) ctx.goTab('exchange');
        return;
      }
      if (e.target.closest('[data-retry]')) {
        CK.haptic.light();
        st.failed = false;
        paintFree();
        loadBonus(true);
        return;
      }
      if (send && e.target.closest('[data-send]') && st.invite === 'failed') {
        CK.haptic.light();
        loadInvite(true);
      }
    });
    if (I && link) I.wire(inviteGroup, () => (st.invite === 'ok' && I.now ? I.link(I.now.code) : null), () => tx('invite.text'));
    if (P) P.onChange(paintP2P);
    const hear = (d) => {
      if (!body.isConnected) return void heard.splice(heard.indexOf(hear), 1);
      st.asking = false;
      st.failed = false;
      st.bonus = d;
      paintFree();
      paintInvite();
    };
    heard.push(hear);
    CK.i18n.bind(body, () => { words(); paintFree(); paintInvite(); });
    words();
    paintP2P();
    paintFree();
    paintInvite();

    let shownAt = 0, seen = epoch;
    return {
      show() {
        if (P) P.ask();
        const first = !st.shown;
        if (!first && Date.now() - shownAt < FRESH_MS && seen === epoch) return;
        shownAt = Date.now();
        seen = epoch;
        loadInvite(!first);
        loadBonus(!first);
        if (first) {
          st.shown = true;
          blocks([p2pGroup, freeGroup, usedGroup, failGroup, inviteGroup]);
        }
      }
    };
  }

  function mount(pane, ctx) {
    const screen = CK.screen({ title: CK.tr ? CK.tr('tab.bonus') : tx('tab.bonus'), compactTop: true, avatar: ctx.openProfile, headExtra: ctx.statusHtml });
    screen.el.classList.add('bonus-screen');
    let stack = null;
    const part = build(screen.body, { ...ctx, stack: () => stack });
    stack = ctx.makeStack(ctx.id || 'bonus', screen);
    return { onShow: () => part.show() };
  }
  function push(stack, ctx) {
    const c = ctx || {};
    const screen = CK.screen({ title: () => tx('tab.bonus') });
    screen.el.classList.add('no-tabbar', 'bonus-screen');
    const part = build(screen.body, { ...c, stack: () => stack });
    stack.push(screen, { returnFocus: c.from });
    part.show();
  }

  const MARK = 'data-bonus';
  const flat = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  function zeroFee() {
    const pct = `${CK.fmt.num(0, 0)}${CK.i18n.lang === 'en' ? '' : ' '}%`;
    return flat(tx('swap.serviceFee', { pct }));
  }
  const tagged = new Map();
  function feeSpot(root) {
    const line = $('.sw-fee-line', root);
    if (line) return { put: (tag) => line.appendChild(tag) };
    const sum = $('.sw-fee-sum', root);
    return sum ? { put: (tag) => sum.after(tag) } : null;
  }
  function tagSheet(root) {
    if (tagged.has(root)) return;
    const spot = feeSpot(root), pct = $('.sw-fee-pct', root);
    if (!spot || !pct) return void waitFor(root);
    const make = () => CK.el(`<span class="tag bonus-tag" hidden>${esc(tx('swap.feeFreeTag'))}</span>`);
    const tags = [make(), make()];
    spot.put(tags[0]);
    pct.after(tags[1]);
    let showed = false;
    const update = () => {
      const on = pct.getAttribute(MARK) === 'free' && flat(pct.textContent) === zeroFee();
      if (on) showed = true;
      tags.forEach((tag) => { tag.textContent = tx('swap.feeFreeTag'); tag.hidden = !on; });
    };
    const watch = new MutationObserver(update);
    watch.observe(pct, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: [MARK] });
    tagged.set(root, () => {
      watch.disconnect();
      if (showed) expire();
    });
    update();
  }
  const waiting = new Map();
  function waitFor(root) {
    if (waiting.has(root) || !window.MutationObserver) return;
    const watch = new MutationObserver(() => {
      if (!$('.sw-fee-pct', root) || !feeSpot(root)) return;
      watch.disconnect();
      waiting.delete(root);
      tagSheet(root);
    });
    watch.observe(root, { childList: true, subtree: true });
    waiting.set(root, () => watch.disconnect());
  }
  function watchSheets() {
    const app = document.getElementById('app');
    if (!app || !window.MutationObserver) return;
    new MutationObserver((records) => {
      records.forEach((r) => {
        r.addedNodes.forEach((node) => { if (node.nodeType === 1 && node.classList.contains('sheet-root')) tagSheet(node); });
        r.removedNodes.forEach((node) => {
          const stop = waiting.get(node);
          if (stop) {
            stop();
            waiting.delete(node);
          }
          const off = tagged.get(node);
          if (!off) return;
          off();
          tagged.delete(node);
        });
      });
    }).observe(app, { childList: true });
  }
  watchSheets();

  window.DemoBonus = { mount, push, load, tagSheet };
})();
