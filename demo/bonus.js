(function () {
  'use strict';
  const { t: tx } = CK;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => CK.esc(String(s));

  CK.i18n.add({
    'bonus.title': ['Приглашайте друзей', 'Invite friends', 'Запрошуйте друзів', 'Достарыңызды шақырыңыз'],
    'bonus.shareCap': [
      'ваша доля нашей комиссии с обменов друзей в сети TON',
      'your share of our fee on your friends\' TON swaps',
      'ваша частка нашої комісії з обмінів друзів у мережі TON',
      'достарыңыздың TON-дағы айырбастарынан түсетін комиссиямыздан үлесіңіз'
    ],
    'bonus.lineOff': ['Сейчас за приглашения ничего не начисляется', 'Invites earn nothing right now', 'Зараз за запрошення нічого не нараховується', 'Қазір шақырулар үшін ештеңе есептелмейді'],
    'bonus.linePlain': ['Отправьте друзьям ссылку на приложение', 'Send your friends a link to the app', 'Надішліть друзям посилання на застосунок', 'Достарыңызға қолданбаның сілтемесін жіберіңіз']
  });

  const FRESH_MS = 60000;
  const JOINED_KEY = 'ck-bonus-joined';
  const SHARE_KEY = 'ck-bonus-share';
  const UNIT = 'GRAM';
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const SKEL = '<i class="skel bonus-skel" aria-hidden="true"></i>';
  const SHARE_SKEL = '<i class="skel bonus-share-skel" aria-hidden="true"></i>';

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

  function pct(bps) {
    const whole = Math.floor(bps / 100);
    const rest = String(bps % 100).padStart(2, '0').replace(/0+$/, '');
    const en = CK.i18n.lang === 'en';
    const number = rest ? `${whole}${en ? '.' : ','}${rest}` : String(whole);
    return en ? `${number}%` : `${number} %`;
  }
  function shareOf(facts) {
    if (!facts || facts.server !== true) return null;
    const bps = facts.refShareBps;
    return Number.isInteger(bps) && bps > 0 && bps <= 10000 ? bps : 0;
  }
  const shareHtml = (share) => `<p class="bonus-share"><b class="bonus-share-pct">${share > 0 ? esc(pct(share)) : SHARE_SKEL}</b><span class="bonus-share-cap">${esc(tx('bonus.shareCap'))}</span></p>`;
  const shareOn = (share, waiting) => share > 0 || (share === null && waiting);
  function sayHtml(share, waiting) {
    if (shareOn(share, waiting)) return shareHtml(share);
    return `<p class="bonus-line">${esc(tx(share === 0 ? 'bonus.lineOff' : 'bonus.linePlain'))}</p>`;
  }
  const ART = `<div class="bonus-art" aria-hidden="true"><picture><source srcset="kit/brand/gift-3d.webp" type="image/webp"><img class="bonus-gift" src="kit/brand/gift-3d.png" width="208" height="208" alt="" decoding="async" draggable="false"></picture></div>`;
  const heroHtml = (share, waiting) => `<div class="bonus-hero">${ART}<h2 class="bonus-title" data-t="bonus.title">${esc(tx('bonus.title'))}</h2><div class="bonus-say" data-line>${sayHtml(share, waiting)}</div></div>`;
  const inviteHtml = (I, field, top) => `<div class="group bonus-invite${field ? '' : ' bonus-ref'}">${top || ''}${I ? (field ? I.fieldHtml('invite-link') : '') + I.buttonsHtml() : ''}</div>`;

  function referralHtml(facts, opts) {
    const I = window.DemoApp && DemoApp.invite && typeof DemoApp.invite.buttonsHtml === 'function' ? DemoApp.invite : null;
    const share = shareOf(facts);
    const on = !(opts && opts.share === false) && shareOn(share, facts === null || facts === undefined);
    return inviteHtml(I, false, on ? shareHtml(share) : '');
  }


  const fade = (el) => {
    if (el && el.animate && !CK.reducedMotion()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  };
  const blocks = (els, opts) => {
    const list = els.filter((el) => el && !el.hidden);
    if (list.length && CK.motion) CK.motion.blocks(list, opts);
  };
  const gram = (v) => (window.DemoPayouts && DemoPayouts.gramText ? DemoPayouts.gramText(v) : `${v} nano`).replace(/\s*GRAM$/, '');

  function build(body, ctx) {
    const I = ctx.invite || (window.DemoApp && DemoApp.invite) || null;
    const st = { invite: 'wait', share: keptShare(), shareWait: false, asked: false, joined: keptJoined(), shown: false };
    body.innerHTML = `
      ${heroHtml(st.share, true)}
      ${inviteHtml(I, true)}
      <div class="bonus-stats" data-stats>
        <div class="bonus-stat" data-joined-row><span class="bonus-stat-name" data-t="invite.joined"></span><b class="bonus-stat-value" data-joined></b></div>
        <div class="bonus-stat" data-earned-row hidden><span class="bonus-stat-name" data-unit="invite.earned"></span><b class="bonus-stat-value" data-earned></b></div>
        <div class="bonus-stat" data-paid-row hidden><span class="bonus-stat-name" data-unit="invite.paid"></span><b class="bonus-stat-value" data-paid></b></div>
      </div>`;
    const hero = $('.bonus-hero', body), line = $('[data-line]', body), inviteGroup = $('.bonus-invite', body), stats = $('[data-stats]', body);
    const joinedRow = $('[data-joined-row]', body), joined = $('[data-joined]', body), earnedRow = $('[data-earned-row]', body), paidRow = $('[data-paid-row]', body);
    const link = I ? $('.invite-link', inviteGroup) : null, send = I ? $('[data-send]', inviteGroup) : null, copy = I ? $('[data-copy]', inviteGroup) : null;

    const topOf = (el) => (el && !el.hidden && el.getBoundingClientRect ? el.getBoundingClientRect().top : null);
    function glide(change) {
      if (!st.shown || CK.reducedMotion()) return void change();
      const parts = [inviteGroup, stats];
      const was = parts.map(topOf);
      change();
      parts.forEach((el, i) => {
        const now = topOf(el);
        if (was[i] === null || now === null || Math.abs(was[i] - now) <= 1 || !el.animate) return;
        el.animate([{ transform: `translate3d(0,${was[i] - now}px,0)` }, { transform: 'none' }], { duration: 380, easing: EASE });
      });
    }

    function words() {
      body.querySelectorAll('[data-t]').forEach((el) => { el.textContent = tx(el.dataset.t); });
      body.querySelectorAll('[data-unit]').forEach((el) => { el.textContent = `${tx(el.dataset.unit)}, ${UNIT}`; });
    }
    let said = '', kindWas = '';
    function paintShare() {
      const waiting = st.shareWait || !st.asked;
      const html = sayHtml(st.share, waiting);
      const kind = shareOn(st.share, waiting) ? 'share' : st.share === 0 ? 'off' : 'plain';
      const draw = () => {
        if (html !== said) {
          const filling = !!line.querySelector('.skel') && st.share > 0;
          line.innerHTML = html;
          if (st.shown && said) fade(filling ? line.querySelector('.bonus-share-pct') : line);
          said = html;
        }
      };
      if (kindWas && kind !== kindWas) glide(draw);
      else draw();
      kindWas = kind;
    }
    function paintInvite() {
      const mine = I ? I.now : null;
      const next = st.invite;
      if (link) {
        const waitingLink = next === 'wait';
        link.classList.toggle('is-wait', next !== 'ok');
        link.setAttribute('aria-busy', String(waitingLink));
        if (next === 'ok' && mine) I.show(link, I.link(mine.code));
        else if (waitingLink) link.innerHTML = '<i class="skel bonus-link-skel" aria-hidden="true"></i>';
        else link.textContent = next === 'outside' ? tx('invite.inTelegram') : next === 'forgotten' ? tx('invite.forgotten') : tx('common.loadFail');
      }
      const fresh = next === 'ok' && mine && Number.isInteger(Number(mine.joined)) && Number(mine.joined) >= 0 ? Number(mine.joined) : null;
      if (fresh !== null) st.joined = fresh;
      if (next === 'forgotten') st.joined = null;
      if (fresh !== null || next === 'forgotten') keepJoined(st.joined);
      const known = I && (next === 'ok' || next === 'wait' || next === 'failed') ? st.joined : null;
      const joinedOn = !!I && (known !== null || next === 'wait');
      const count = known !== null ? CK.fmt.compact(known) : '';
      const drawJoined = () => {
        joinedRow.hidden = !joinedOn;
        if (known === null) {
          if (joinedOn && !joined.querySelector('.skel')) joined.innerHTML = SKEL;
        } else if (joined.textContent !== count || joined.querySelector('.skel')) {
          const filling = !!joined.querySelector('.skel');
          joined.textContent = count;
          if (filling) fade(joined);
        }
        drawMoney();
      };
      if (send) {
        send.disabled = next !== 'ok' && next !== 'failed';
        $('span', send).textContent = tx(next === 'failed' ? 'common.retry' : 'common.send');
      }
      if (copy) copy.disabled = next !== 'ok';
      drawJoined();
    }
    const earnedNow = () => { const mine = I ? I.now : null; return mine && typeof mine.earned === 'bigint' ? mine.earned : 0n; };
    const paidNow = () => { const mine = I ? I.now : null; return mine && typeof mine.paid === 'bigint' ? mine.paid : 0n; };
    const hasMoney = () => earnedNow() > 0n && (st.invite === 'ok' || st.invite === 'wait');
    function drawMoney() {
      const has = hasMoney(), paid = paidNow();
      const stood = [earnedRow, paidRow].filter((el) => !el.hidden);
      earnedRow.hidden = !has;
      paidRow.hidden = !(has && paid > 0n);
      if (has) {
        $('[data-earned]', earnedRow).textContent = gram(earnedNow());
        $('[data-paid]', paidRow).textContent = gram(paid);
      }
      const tiles = [joinedRow, earnedRow, paidRow].filter((el) => !el.hidden);
      stats.hidden = !tiles.length;
      stats.setAttribute('data-n', String(tiles.length));
      stats.removeAttribute('data-wide');
      if (tiles.length > 1 && tiles.some((row) => Array.from(row.children).some((v) => v.scrollWidth > v.clientWidth))) stats.setAttribute('data-wide', '');
      if (st.shown) [earnedRow, paidRow].forEach((el) => { if (!el.hidden && !stood.includes(el)) fade(el); });
    }

    function loadInvite(again) {
      if (!I) return;
      if (I.now && !again) st.invite = 'ok';
      else if (!I.now) st.invite = 'wait';
      paintInvite();
      I.reload().then((mine) => {
        st.invite = mine ? 'ok' : 'outside';
        paintInvite();
      }, (err) => {
        st.invite = err && err.message === 'forgotten' ? 'forgotten' : I.now ? 'ok' : 'failed';
        paintInvite();
      });
    }
    function loadShare() {
      st.asked = true;
      if (!window.DemoFees || !DemoFees.loadFacts) return void paintShare();
      st.shareWait = true;
      paintShare();
      DemoFees.loadFacts().then((f) => {
        st.shareWait = false;
        const got = shareOf(f);
        if (got !== null) {
          st.share = got;
          keepShare(got);
        }
        paintShare();
      }, () => {
        st.shareWait = false;
        paintShare();
      });
    }

    body.addEventListener('click', (e) => {
      if (send && e.target.closest('[data-send]') && st.invite === 'failed') {
        CK.haptic.light();
        loadInvite(true);
      }
    });
    if (I && link) I.wire(inviteGroup, () => (st.invite === 'ok' && I.now ? I.link(I.now.code) : null), () => tx('invite.text'));
    CK.i18n.bind(body, () => { words(); paintShare(); paintInvite(); });
    words();
    paintShare();
    paintInvite();

    let shownAt = 0;
    return {
      show() {
        const first = !st.shown;
        if (!first && Date.now() - shownAt < FRESH_MS) return;
        shownAt = Date.now();
        loadInvite(!first);
        loadShare();
        if (first) {
          st.shown = true;
          blocks([hero, inviteGroup, stats]);
        }
      }
    };
  }

  const BAR_TITLE = 17, RIDE_MIN = 44, RIDE_UNDER = 20;
  const RIDE_SPARE = 2;
  function rideOf(el, scroll) {
    const glider = $('.hd-glide', el), slot = $('.hd-slot', el), head = $('.screen-head', el), row = $('.navbar-row', el);
    if (!glider || !slot || !head || !row) return 0;
    let y0 = 0;
    for (let n = slot; n && n !== scroll; n = n.offsetParent) y0 += n.offsetTop;
    const s1 = BAR_TITLE / (parseFloat(getComputedStyle(glider).fontSize) || BAR_TITLE);
    const y1 = row.offsetTop + row.offsetHeight / 2 - glider.offsetHeight * s1 / 2;
    const under = head.offsetTop + head.offsetHeight - (row.offsetTop + row.offsetHeight);
    return Math.max(y0 - y1, under + RIDE_UNDER, RIDE_MIN);
  }
  function roomForRide(screen) {
    const el = screen.el, scroll = screen.scroll, body = screen.body;
    if (!el || !scroll || !body || typeof window.ResizeObserver !== 'function') return;
    let added = 0;
    const fit = () => {
      if (!scroll.clientHeight) return;
      const room = scroll.scrollHeight - scroll.clientHeight - added;
      const want = Math.ceil(rideOf(el, scroll)) + RIDE_SPARE;
      const next = room > 0 && room < want ? want - room : 0;
      if (next === added) return;
      added = next;
      body.style.setProperty('--bonus-ride', `${next}px`);
    };
    const sizes = new ResizeObserver(fit);
    sizes.observe(scroll);
    sizes.observe(body);
    const head = $('.screen-head', el);
    if (head) sizes.observe(head);
    let timer = 0, finger = false;
    const settleSoon = () => {
      if (!added) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const y = scroll.scrollTop, end = scroll.scrollHeight - scroll.clientHeight;
        if (finger || !added || y <= 0 || y >= end - 1) return;
        scroll.scrollTo({ top: y < end / 2 ? 0 : end, behavior: CK.reducedMotion() ? 'auto' : 'smooth' });
      }, 140);
    };
    const lift = () => { finger = false; settleSoon(); };
    scroll.addEventListener('touchstart', () => { finger = true; }, { passive: true });
    scroll.addEventListener('touchend', lift, { passive: true });
    scroll.addEventListener('touchcancel', lift, { passive: true });
    scroll.addEventListener('scroll', settleSoon, { passive: true });
  }

  function mount(pane, ctx) {
    const screen = CK.screen({ title: CK.tr ? CK.tr('tab.bonus') : tx('tab.bonus'), compactTop: true, avatar: ctx.openProfile, headExtra: ctx.statusHtml });
    screen.el.classList.add('bonus-screen');
    const part = build(screen.body, ctx);
    roomForRide(screen);
    ctx.makeStack(ctx.id || 'bonus', screen);
    return { onShow: () => part.show() };
  }
  function push(stack, ctx) {
    const c = ctx || {};
    const screen = CK.screen({ title: () => tx('tab.bonus') });
    screen.el.classList.add('no-tabbar', 'bonus-screen');
    const part = build(screen.body, c);
    roomForRide(screen);
    stack.push(screen, { returnFocus: c.from });
    part.show();
  }

  try { localStorage.removeItem('ck-bonus-free'); } catch (_) { }

  window.DemoBonus = { mount, push, referralHtml, heroHtml: (facts) => heroHtml(shareOf(facts), facts === null || facts === undefined) };
})();
