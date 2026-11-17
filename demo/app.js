CK.buildApp(function () {
  'use strict';
  const { fmt, cards, icon, t: tx, tr } = CK;
  const { L, LA, LP } = CK.i18n;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const STATUS_MARKET = '<span data-data-status data-kind="market"></span>';
  const STATUS_ACCOUNT = '<span data-data-status data-kind="account"></span>';

  const app = $('#app'), stage = $('#stage'), panes = $('#panes');
  CK.setSheetSurface(app, stage);
  CK.setToastHost($('#toast'));
  CK.tg.init();

  CK.i18n.add({
    'tab.bonus': ['Бонусы', 'Bonuses', 'Бонуси', 'Бонустар'],
    'profile.howto': ['Как пользоваться', 'How to use', 'Як користуватися', 'Қалай пайдалану']
  });

  const P2P_MODE = (() => {
    const said = (document.querySelector('meta[name="dp-p2p"]') || {}).content;
    return said === 'hidden' || said === 'off' ? said : 'open';
  })();
  try {
    localStorage.removeItem('ck-p2p-row');
    localStorage.removeItem('ck-p2p-hint');
  } catch (_) { }

  const tabIcon = (name, near) => (CK.ICONS && CK.ICONS[name] ? name : near);
  const TABS = [
    { id: 'portfolio', icon: 'portfolio', label: tr('tab.portfolio') },
    { id: 'trade', icon: 'trade', label: tr('tab.trade') },
    { id: 'exchange', icon: tabIcon('exchange', 'swap'), label: tr('tab.exchange') },
    P2P_MODE === 'open' ? { id: 'p2p', icon: tabIcon('p2p', 'users'), label: tr('tab.p2p') } : { id: 'bonus', icon: tabIcon('tab-gift', 'gift'), label: tr('tab.bonus') },
    { id: 'profile', icon: 'tab-profile', label: tr('tab.profile') }
  ];
  const onShow = {};
  const viewChanged = [];
  const stacks = {};
  const paneOf = {};
  TABS.forEach((t) => {
    const pane = CK.el(`<div class="tab-pane" id="pane-${t.id}" role="tabpanel" aria-labelledby="tab-${t.id}"></div>`);
    panes.appendChild(pane);
    paneOf[t.id] = pane;
    pane.addEventListener('focusin', (e) => { if (t.id !== currentTab) e.target.blur(); });
  });

  const LAUNCH_VIEWS = {
    portfolio: { tab: 'portfolio' },
    deposit: { tab: 'portfolio', open: () => DemoWallet.openDeposit() },
    withdraw: { tab: 'portfolio', open: () => DemoWallet.openWithdraw() },
    history: { tab: 'portfolio', open: () => openHistory() },
    orders: {
      tab: 'portfolio',
      open: () => {
        const pane = paneOf.portfolio;
        const go = () => { const at = $('#orders-section', pane); if (!at || at.hidden || !at.childElementCount) return false; at.scrollIntoView({ block: 'start' }); return true; };
        if (!pane || go()) return;
        let timer = 0;
        const watch = new MutationObserver(() => { if (go()) { watch.disconnect(); clearTimeout(timer); } });
        watch.observe(pane, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
        timer = setTimeout(() => watch.disconnect(), 15000);
      }
    },
    cheque: { tab: 'portfolio', open: () => DemoCheques.openCreate({}) },
    exchange: { tab: 'exchange' },
    trade: { tab: 'trade' },
    p2p: P2P_MODE === 'open' ? { tab: 'p2p' } : { tab: 'portfolio' },
    profile: { tab: 'profile' },
    alerts: { tab: 'profile', open: () => openAlerts(null) },
    bonus: P2P_MODE === 'open' ? { tab: 'profile', open: () => openBonus() } : { tab: 'bonus' },
    invite: P2P_MODE === 'open' ? { tab: 'profile', open: () => openBonus() } : { tab: 'bonus' },
    fees: { tab: 'profile', open: () => DemoFees.openFees(null, stacks.profile) },
    checks: { tab: 'profile', open: () => DemoCheques.openList(null, stacks.profile) },
    invoices: { tab: 'profile', open: () => DemoInvoices.openList(null, stacks.profile) }
  };
  const launchView = (() => {
    const fromStart = /^v_([a-z0-9]{2,16})$/.exec(CK.tg.startParam || '');
    const asked = CK.tg.launchSearch.get('view') || (fromStart ? fromStart[1] : '');
    if (!asked) return null;
    return Object.prototype.hasOwnProperty.call(LAUNCH_VIEWS, asked) ? asked : 'portfolio';
  })();

  function initialTab() {
    const h = location.hash.replace('#', '').split('-')[0];
    if (h === 'kit') return 'profile';
    if (h === 'markets') return 'trade';
    if (TABS.some((t) => t.id === h)) return h;
    if (new URLSearchParams(location.search).has('p2p')) return P2P_MODE === 'open' ? 'p2p' : 'portfolio';
    if (launchView) return LAUNCH_VIEWS[launchView].tab;
    return 'portfolio';
  }
  let currentTab = initialTab();
  const tabBar = CK.tabBar($('#tabbar'), { items: TABS, value: currentTab, onChange: showTab });
  const resetBarScroll = tabBar.followScroll
    ? tabBar.followScroll(panes, () => stacks[currentTab] && stacks[currentTab].top && stacks[currentTab].top.scroll)
    : () => {};
  const PARK_AFTER_MS = 260;
  let parkTimer = 0;
  function parkHidden() {
    TABS.forEach((t) => paneOf[t.id].classList.toggle('is-parked', t.id !== currentTab));
  }
  function showTab(id) {
    currentTab = id;
    TABS.forEach((t) => {
      paneOf[t.id].classList.toggle('is-active', t.id === id);
      paneOf[t.id].setAttribute('aria-hidden', String(t.id !== id));
      paneOf[t.id].dataset.active = String(t.id === id);
    });
    paneOf[id].classList.remove('is-parked');
    resetBarScroll();
    clearTimeout(parkTimer);
    parkTimer = setTimeout(parkHidden, PARK_AFTER_MS);
    if (stacks[id]) {
      stacks[id].sync();
      tabBar.setHidden(stacks[id].depth > 1);
    }
    if (onShow[id]) onShow[id]();
    viewChanged.forEach((fn) => fn());
  }
  function goTab(id) {
    tabBar.select(id, true);
    showTab(id);
  }
  let launchSheetPending = false;
  const openProfile = () => goTab('profile');
  function mountTab(id, mod, extra) {
    let made = null;
    if (mod && typeof mod.mount === 'function') {
      try {
        made = mod.mount(paneOf[id], { ...extra, id, makeStack, goTab, openProfile, openCoin, statusHtml: STATUS_ACCOUNT });
      } catch (err) {
        console.error(err);
      }
    }
    if (!stacks[id]) {
      const screen = CK.screen({ title: tr('tab.' + id), compactTop: true, avatar: openProfile, headExtra: STATUS_ACCOUNT });
      screen.body.innerHTML = CK.emptyState({ icon: 'warning', title: tx('tab.unavailable') }).replace('<b class="empty-title"', `<b class="empty-title" ${L('tab.unavailable')}`);
      makeStack(id, screen);
      made = null;
    }
    if (made && typeof made.onShow === 'function') onShow[id] = made.onShow;
  }
  const lazyJobs = {};
  function loadLazy(id) {
    if (lazyJobs[id]) return lazyJobs[id];
    const tpl = document.getElementById(id);
    if (!tpl || !tpl.content) return Promise.reject(new Error('no_files'));
    const compat = document.querySelector('link[href^="kit/compat.css"]');
    let last = Promise.resolve();
    Array.from(tpl.content.children).forEach((node) => {
      if (node.tagName === 'LINK' || node.tagName === 'STYLE') {
        const href = node.getAttribute('href');
        if (href && document.querySelector(`link[href="${href}"]`)) return;
        document.head.insertBefore(node.cloneNode(true), compat && compat.parentNode === document.head ? compat : null);
        return;
      }
      if (node.tagName !== 'SCRIPT') return;
      const script = document.createElement('script');
      if (node.getAttribute('src')) {
        script.src = node.getAttribute('src');
        script.async = false;
        last = new Promise((resolve, reject) => {
          script.addEventListener('load', resolve, { once: true });
          script.addEventListener('error', () => reject(new Error('load_failed')), { once: true });
        });
      } else script.textContent = node.textContent;
      document.body.appendChild(script);
    });
    lazyJobs[id] = last.catch((err) => {
      delete lazyJobs[id];
      throw err;
    });
    return lazyJobs[id];
  }
  const loadP2P = () => (P2P_MODE !== 'open' ? Promise.reject(new Error('no_p2p')) : window.DemoP2P ? Promise.resolve(window.DemoP2P) : loadLazy('lazy-p2p').then(() => {
    if (!window.DemoP2P) throw new Error('no_p2p');
    return window.DemoP2P;
  }));
  let p2pStandIn = null;
  function lazyP2P() {
    let ctx = null, real = null, standIn = null, job = null;
    function swapIn(mod) {
      if (real) return real;
      const made = mod.mount(paneOf.p2p, { ...ctx, makeStack: (id, screen) => (stacks[id] && stacks[id].replaceRoot(screen) ? stacks[id] : ctx.makeStack(id, screen)) });
      real = made || {};
      if (typeof real.onShow === 'function') onShow.p2p = real.onShow;
      return real;
    }
    function fetchIt() {
      if (job) return job;
      standIn.body.innerHTML = '<div class="screen-pad"><div class="group"><div class="wallet-skel"></div><div class="wallet-skel"></div><div class="wallet-skel"></div></div></div>';
      job = loadP2P().then((mod) => {
        const made = swapIn(mod);
        if (currentTab === 'p2p' && typeof made.onShow === 'function') made.onShow();
      }, (err) => {
        console.error('p2p load:', err);
        job = null;
        standIn.body.innerHTML = `<div class="screen-pad">${CK.emptyState({ icon: 'warning', title: tx('common.loadFail'), actions: `<button class="btn btn--small btn--tinted press p2p-load-retry" type="button">${tx('common.retry')}</button>` })}</div>`;
        $('.p2p-load-retry', standIn.body).addEventListener('click', () => fetchIt());
      });
      return job;
    }
    p2pStandIn = {
      ready() {
        if (real) return Promise.resolve();
        if (!standIn) return Promise.reject(new Error('no_p2p'));
        return fetchIt().then(() => { if (!real) throw new Error('no_p2p'); });
      },
      mount(pane, c) {
        ctx = c;
        standIn = CK.screen({ title: tr('tab.p2p'), compactTop: true, avatar: c.openProfile, headExtra: c.statusHtml });
        c.makeStack(c.id || 'p2p', standIn);
        if (new URLSearchParams(location.search).has('p2p') || location.hash.startsWith('#kit-p2p')) fetchIt();
        return { onShow: fetchIt };
      }
    };
    return p2pStandIn;
  }
  function makeStack(id, root) {
    stacks[id] = CK.stack(paneOf[id], root, {
      onDepth(depth) {
        if (currentTab !== id) return;
        tabBar.setHidden(depth > 1);
        resetBarScroll();
        viewChanged.forEach((fn) => fn());
      }
    });
    return stacks[id];
  }

  function openHistory(opts) {
    if (window.DemoManage) return DemoManage.openHistory(opts);
    return DemoWallet.openHistory();
  }

  function sectionHtml(title, inner, note) {
    return `<section class="section"><h2 class="section-title">${title}</h2>${inner}${note ? `<p class="section-note">${note}</p>` : ''}</section>`;
  }
  const cellTitle = (o) => (o.key ? `<span class="cell-title" ${L(o.key)}>${tx(o.key)}</span>` : `<span class="cell-title">${o.title}</span>`);
  function tileCell(o) {
    return `<button class="cell cell-tile press-row" type="button" id="${o.id || ''}"><span>${o.tile || CK.tile(o.icon, { tone: o.tone })}</span><span class="cell-main">${cellTitle(o)}</span>${o.value ? `<span class="cell-value" data-value>${o.value}</span>` : ''}${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`;
  }
  function switchCell(o) {
    return `<div class="cell cell-tile"><span>${CK.tile(o.icon, { tone: o.tone })}</span><span class="cell-main">${cellTitle(o)}</span><button id="${o.id}"></button></div>`;
  }

  function coinPickerSheet(title, selectedId, onPick) {
    CK.sheet.open({
      title,
      detents: [.56, .92],
      build(body, sheet) {
        body.innerHTML = `
          <label class="search">${icon('search', { size: 19 })}<input id="pair-search" type="search" placeholder="Поиск монеты" aria-label="Поиск монеты" autocomplete="off"></label>
          <div class="sheet-list"><div class="pick-list"></div></div>`;
        const list = $('.pick-list', body);
        const render = (q) => {
          const needle = (q || '').trim().toLowerCase();
          const rows = D.coins.filter((c) => c.id !== 'usdt' && (!needle || c.name.toLowerCase().includes(needle) || c.sym.toLowerCase().includes(needle)));
          list.innerHTML = rows.length ? rows.map((c) => `
            <button class="cell market-row press-row ${c.id === selectedId ? 'is-selected' : ''}" type="button" data-coin="${c.id}">
              ${CK.coinLogo(c, 40)}
              <span class="market-name"><b>${c.name}</b><span>${c.sym}</span></span>
              <span class="market-price"><b data-price>${fmt.price(c.price)}</b>${CK.changePill(c.change, { plain: true })}</span>
              ${icon('check', { size: 20, className: 'cell-check' })}
            </button>`).join('') : CK.emptyState({ icon: 'search', title: 'Такой монеты нет в списке' });
        };
        render();
        $('#pair-search', body).addEventListener('input', (e) => render(e.target.value));
        $('#pair-search', body).addEventListener('focus', () => sheet.expand());
        list.addEventListener('click', (e) => {
          const row = e.target.closest('[data-coin]');
          if (!row) return;
          CK.haptic.selection();
          onPick(D.byId[row.dataset.coin]);
          sheet.close();
        });
      }
    });
  }

  function infoSheet(title, html, wire) {
    return CK.sheet.open({
      title,
      build(body, sheet) {
        body.innerHTML = html;
        if (wire) wire(body, sheet);
      }
    });
  }

  function fadeIn(nodes) {
    if (CK.reducedMotion()) return;
    nodes.filter(Boolean).forEach((n, i) => {
      const delay = Math.min(i, 8) * 45;
      n.style.setProperty('--in-delay', `${delay}ms`);
      n.classList.remove('list-in');
      void n.offsetWidth;
      n.classList.add('list-in');
      setTimeout(() => {
        n.classList.remove('list-in');
        n.style.removeProperty('--in-delay');
      }, delay + 560 + 270 + 60);
    });
  }
  function fadeKids(el) {
    if (CK.reducedMotion() || !el.animate) return;
    Array.from(el.children).forEach((n) => n.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' }));
  }
  function popIcon(btn, on) {
    btn.classList.toggle('is-pop', !!on && !CK.reducedMotion());
  }
  function favAction(inst) {
    if (!DemoFavorites.can(inst)) return null;
    const on = DemoFavorites.has(inst);
    return {
      icon: 'star', label: () => tx(DemoFavorites.has(inst) ? 'coin.unfav' : 'coin.fav'), fill: on, pressed: on,
      onClick(btn) {
        const now = DemoFavorites.toggle(inst);
        if (now === null) {
          CK.haptic.light();
          CK.toast(tx('coin.favFull'), { icon: 'star', tone: 'down' });
          return;
        }
        btn.setAttribute('aria-pressed', String(now));
        btn.setAttribute('aria-label', tx(now ? 'coin.unfav' : 'coin.fav'));
        btn.innerHTML = icon('star', { fill: now, size: 22 });
        popIcon(btn, now);
        CK.haptic.light();
        CK.toast(tx(now ? 'coin.favDone' : 'coin.unfavDone'), { icon: 'star', tone: 'accent' });
      }
    };
  }
  function alertAction(inst) {
    if (!DemoAlerts.can(inst)) return null;
    const on = DemoAlerts.has(inst);
    return {
      icon: 'bell', className: 'navbtn--bell', label: tr('alerts.bell'), fill: on, pressed: on,
      mount(btn) {
        let lit = on;
        const off = DemoAlerts.onChange(() => {
          if (!btn.isConnected) return off();
          const now = DemoAlerts.has(inst);
          if (now === lit) return;
          lit = now;
          btn.setAttribute('aria-pressed', String(now));
          btn.innerHTML = icon('bell', { fill: now, size: 22 });
          popIcon(btn, now);
        });
      },
      onClick() { DemoAlerts.open(inst); }
    };
  }
  function openAlerts(from) {
    DemoAlerts.openList({
      from,
      stack: stacks.profile,
      pick: () => goTab('trade'),
      open(id, row) {
        if (Object.prototype.hasOwnProperty.call(D.byId, id)) return openCoin(D.byId[id], row);
        if (D.instruments.has(id)) return trade.openHeldToken(id, row);
        CK.market.tokenItem(id).then((body) => {
          if (!body || !body.token) throw new Error('unknown token');
          const inst = D.instrumentOf(body.token);
          if (!inst.isToken) openCoin(inst, row);
          else trade.openHeldToken(id, row);
        }).catch(() => CK.toast(tx('alerts.fail'), { icon: 'warning', tone: 'down' }));
      }
    });
  }
  function openCoin(coin, from) {
    trade.openDetail({
      inst: coin,
      title: coin.sym,
      from,
      stack: stacks[currentTab],
      points: coin.series,
      prefetch: true,
      load: (tf) => CK.market.klines(coin.id, tf),
      stats: [['coin.cap', () => fmt.compactUsd(coin.cap)], ['coin.volume', () => fmt.compactUsd(coin.volume)]]
    });
  }

  const SHARE_LINK = 'https://t.me/DevpoolTrading_bot?startapp=';
  const SHARE_CODE = /^[A-Za-z0-9_-]{1,512}$/;
  const evmAddress = (a) => /^0x[0-9a-f]{40}$/.test(a);
  const SHARE_ADDRESS = {
    ton: (a) => /^[A-Za-z0-9_-]{48}$/.test(a) && !!CK.ton.rawAddress(a),
    eth: evmAddress, bsc: evmAddress, base: evmAddress, arbitrum: evmAddress, polygon: evmAddress,
    optimism: evmAddress, avalanche: evmAddress, ink: evmAddress, monad: evmAddress, unichain: evmAddress,
    solana: (a) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)
  };
  const shareAddressFits = (net, address) => Object.prototype.hasOwnProperty.call(SHARE_ADDRESS, net) && SHARE_ADDRESS[net](address);
  function shareCode(inst) {
    let code = null;
    if (!inst.isToken) code = D.byId[inst.id] === inst ? `c_${inst.id}` : null;
    else if (inst.gas) code = Object.prototype.hasOwnProperty.call(D.byId, String(inst.sym).toLowerCase()) ? `c_${String(inst.sym).toLowerCase()}` : null;
    else {
      const id = String(inst.id), at = id.indexOf(':');
      code = at > 0 && shareAddressFits(id.slice(0, at), id.slice(at + 1)) ? `t_${id.slice(0, at)}_${id.slice(at + 1)}` : null;
    }
    return code && SHARE_CODE.test(code) ? code : null;
  }
  const REF_TAIL = /-r[a-z0-9]{8}$/;
  function readShareCode(code) {
    if (typeof code !== 'string' || !SHARE_CODE.test(code)) return null;
    return readPlainShareCode(code) || (REF_TAIL.test(code) ? readPlainShareCode(code.slice(0, -10)) : null);
  }
  function readPlainShareCode(code) {
    const coin = /^c_([a-z0-9]{1,16})$/.exec(code);
    if (coin) return Object.prototype.hasOwnProperty.call(D.byId, coin[1]) ? { coin: D.byId[coin[1]] } : null;
    const token = /^t_([a-z]+)_(.+)$/.exec(code);
    return token && shareAddressFits(token[1], token[2]) ? { id: `${token[1]}:${token[2]}` } : null;
  }
  const COPIED_MS = 1600;
  const linkFieldHtml = (extra) => `<div class="wallet-address share-link${extra ? ' ' + extra : ''}" role="textbox" aria-readonly="true" tabindex="0" aria-label="${tx('share.linkAria')}"></div>`;
  const linkButtonsHtml = () => `<div class="btn-row share-buttons">
    <button class="btn press" type="button" data-copy>${icon('copy', { size: 20 })}<span>${tx('share.copy')}</span></button>
    <button class="btn btn--tinted press" type="button" data-send>${icon('plane', { size: 20 })}<span>${tx('common.send')}</span></button></div>`;
  function showLink(field, link) {
    const at = link.indexOf('?');
    const text = document.createElement('span');
    text.append(link.slice(0, at), document.createElement('wbr'), link.slice(at));
    field.replaceChildren(text);
  }
  function wireLinkParts(b, link, text) {
    const field = $('.share-link', b), copy = $('[data-copy]', b);
    const selectAll = () => {
      const sel = window.getSelection && window.getSelection();
      if (sel && !field.classList.contains('is-wait')) sel.selectAllChildren(field);
    };
    field.addEventListener('click', selectAll);
    field.addEventListener('focus', selectAll);
    let timer = 0;
    copy.addEventListener('click', () => {
      const now = link();
      if (!now) return;
      CK.copyText(now).then((copied) => {
        if (!copied) {
          CK.toast(tx('common.copyFail'), { icon: 'warning', tone: 'down' });
          return;
        }
        CK.haptic.light();
        clearTimeout(timer);
        copy.classList.add('is-done');
        copy.innerHTML = `${icon('check', { size: 20 })}<span>${tx('share.copiedShort')}</span>`;
        fadeKids(copy);
        timer = setTimeout(() => {
          copy.classList.remove('is-done');
          copy.innerHTML = `${icon('copy', { size: 20 })}<span>${tx('share.copy')}</span>`;
          fadeKids(copy);
        }, COPIED_MS);
      });
    });
    $('[data-send]', b).addEventListener('click', () => {
      const now = link();
      if (!now) return;
      CK.haptic.light();
      CK.ton.openLink(`https://t.me/share/url?url=${encodeURIComponent(now)}&text=${encodeURIComponent(text())}`);
    });
  }
  function shareAction(inst) {
    const code = shareCode(inst);
    if (!code) return null;
    const linkNow = () => SHARE_LINK + code;
    return {
      icon: 'share', label: tr('share.aria'),
      onClick() {
        if (CK.sheet.top) return;
        CK.haptic.light();
        CK.sheet.open({
          title: tx('share.aria'),
          build(b) {
            b.innerHTML = `
              <div class="share-head">${CK.coinLogo(inst, 40)}<span class="market-name"><b></b><span></span></span></div>
              ${linkFieldHtml()}
              ${linkButtonsHtml()}`;
            $('.share-head b', b).textContent = inst.name;
            $('.share-head .market-name span', b).textContent = inst.sym;
            const link = linkNow();
            showLink($('.share-link', b), link);
            wireLinkParts(b, () => link, () => tx('share.text', { sym: inst.sym }));
          }
        });
      }
    };
  }

  const INVITE_CODE = /^[a-z0-9]{8}$/;
  let invite = null;
  let inviteJob = null;
  let inviteStale = false;
  let inviteEra = 0;
  const INVITE_WALLET_WAIT_MS = 10000;
  function knownBefore() {
    if (CK.wallet.hadAtLaunch === true) return true;
    const st = CK.wallet.status || {};
    return st.kind === 'readonly' || !!(st.legacy || st.moveFrom || st.oldElsewhere || st.adoptFor || st.replacedElsewhere);
  }
  function loadInvite() {
    if (inviteJob) return inviteJob;
    const era = inviteEra;
    inviteJob = CK.market.ready
      .then(() => (CK.market.mode === 'live' ? CK.tg.whenInitData() : ''))
      .then((initData) => {
        if (!initData) return null;
        return Promise.race([CK.wallet.ready.catch(() => null), new Promise((ok) => setTimeout(ok, INVITE_WALLET_WAIT_MS))]).then(() => initData);
      })
      .then((initData) => {
        if (!initData) return null;
        return fetch('api/ref' + (knownBefore() ? '?known=1' : ''), { headers: { Authorization: 'tma ' + initData }, cache: 'no-store' })
          .then((res) => res.json())
          .then((body) => {
            if (!body || body.ok !== true || !INVITE_CODE.test(body.code)) throw new Error((body && body.error) || 'bad_response');
            const nano = (v) => (typeof v === 'string' && /^\d{1,30}$/.test(v) ? BigInt(v) : null);
            const earned = nano(body.accrued);
            invite = {
              code: body.code, joined: Math.max(0, Math.floor(Number(body.joined)) || 0), earned, paid: earned === null ? null : nano(body.paid) || 0n,
              wallet: typeof body.wallet === 'string' ? body.wallet : null, payTo: Object.prototype.hasOwnProperty.call(body, 'wallet'), payouts: body.payouts === true
            };
            reportPayoutWallet();
            return invite;
          });
      })
      .then((mine) => {
        if (mine && era === inviteEra) inviteStale = false;
        return mine;
      })
      .catch((err) => {
        inviteJob = null;
        if (err && err.message === 'forgotten') {
          invite = null;
          inviteStale = false;
        }
        console.error(err);
        throw err;
      });
    return inviteJob;
  }
  Promise.resolve().then(() => loadInvite().catch(() => {}));
  let walletReport = null;
  function reportPayoutWallet() {
    const here = CK.ton.wallet;
    if (walletReport || !invite || !invite.payTo || !here || here.address === invite.wallet || CK.wallet.wallets.isExtra(here.address)) return;
    walletReport = CK.wallet.depositAddress()
      .then((own) => {
        if (!own.verified || own.address === invite.wallet) return null;
        return CK.tg.whenInitData()
          .then((initData) => fetch('api/ref/wallet', { method: 'POST', headers: { Authorization: 'tma ' + initData, 'Content-Type': 'application/json' }, body: JSON.stringify({ address: own.address }), cache: 'no-store' }))
          .then((res) => res.json())
          .then((body) => { if (body && body.ok === true) invite.wallet = own.address; });
      })
      .catch((err) => console.error(err))
      .finally(() => { walletReport = null; });
  }
  CK.ton.onWallet(() => reportPayoutWallet());

  const invitePart = {
    get now() { return invite && !inviteStale ? invite : null; },
    reload() {
      inviteJob = null;
      return loadInvite();
    },
    link: (code) => INVITE_LINK + code,
    fieldHtml: linkFieldHtml,
    buttonsHtml: linkButtonsHtml,
    wire: wireLinkParts,
    show: showLink
  };

  function openP2PTab(dealId) {
    goTab('p2p');
    return (p2pStandIn ? p2pStandIn.ready() : Promise.resolve())
      .then(() => loadP2P())
      .then((mod) => {
        if (typeof mod.openMine !== 'function') throw new Error('no_p2p');
        return mod.openMine({ goTab, id: 'p2p' }, dealId || null);
      })
      .catch((err) => {
        console.error('p2p:', err);
        CK.toast(tx('common.loadFail'), { icon: 'warning', tone: 'down' });
      });
  }
  function openBonus(from) {
    if (!window.DemoBonus || !stacks.profile || stacks.profile.depth > 1) return;
    DemoBonus.push(stacks.profile, { from, goTab, invite: invitePart });
  }

  const ALLOC_ROWS = 6;
  const BALANCES_MS = 30000;
  const EMPTY_BALANCES_MS = 10000;
  const AGED_LOOK_MS = 3000;
  const UNKNOWN_BALANCES_MS = 5000;
  const REREAD_AFTER_MS = 5000;
  const RETRY_FIRST_MS = 1000;
  const RETRY_MAX_MS = 15000;
  const FAILS_SHOWN = 4;
  const EXPLORER = 'https://tonviewer.com/';
  const T = CK.ton;
  function setHtml(el, html) {
    if (el._html === html) return;
    el._html = html;
    el.innerHTML = html;
  }
  function copyAddress() {
    if (!T.wallet) return;
    CK.copyText(T.wallet.friendly).then((copied) => {
      if (copied) CK.toast(tx('common.addressCopied'), { icon: 'check-circle', tone: 'up' });
      else CK.toast(tx('common.copyFail'), { icon: 'warning', tone: 'down' });
    });
  }
  const openExplorer = () => { if (T.wallet) T.openLink(EXPLORER + T.wallet.friendly); };
  const PF_SKEL_ROW = '<div class="pf-skel-row"><span class="skel pf-skel-logo"></span><span class="pf-skel-lines"><span class="skel pf-skel-a"></span><span class="skel pf-skel-b"></span></span><span class="pf-skel-lines pf-skel-right"><span class="skel pf-skel-c"></span><span class="skel pf-skel-d"></span></span></div>';
  const HERO_TOP = '#0a1a3d';
  let hideSmallMem = null;
  function hideSmall() {
    if (hideSmallMem === null) {
      try { hideSmallMem = localStorage.getItem('ck-hide-small') === '1'; } catch (_) { hideSmallMem = false; }
    }
    return hideSmallMem;
  }
  let repaintAssets = () => {};
  function setHideSmall(on) {
    try { localStorage.setItem('ck-hide-small', on ? '1' : '0'); } catch (_) { }
    hideSmallMem = !!on;
    repaintAssets();
  }
  function buildPortfolio() {
    const screen = CK.screen({ title: tr('tab.portfolio'), titleHtml: `<button class="wl-switch press" type="button" data-wallet="switch" aria-haspopup="dialog"><span class="wl-ava wl-ava--title">${CK.logoMark ? CK.logoMark(20) : icon('wallet', { fill: true })}</span><b class="wl-switch-name"></b>${icon('chevron-down', { className: 'wl-switch-chev' })}</button>`, large: false, className: 'screen--wallet', actions: [{ icon: 'portfolio', fill: true, size: 20, className: 'navbtn--alloc', label: () => tx('alloc.open'), onClick: () => { CK.haptic.selection(); if (window.DemoAllocation) DemoAllocation.open(); } }] });
    const body = screen.body;
    let config = null, walletAsked = false, shownState = '', listShape = null, shownAddress = null;
    let loadFailed = false, loadTimer = 0, loadJob = null, fails = 0, sendOpen = false, pendingAskedFor = null;

    function stateNow() {
      if (T.wallet) return 'wallet';
      if (!walletAsked) return 'loading';
      const status = CK.wallet.status;
      if (status.kind === 'foreign') return 'foreign';
      return status.kind === 'unknown' || status.makeFailed === 'retry' ? 'failed' : 'create';
    }
    const canSign = () => !!T.wallet && !T.wallet.readOnly && !CK.wallet.status.lost && !CK.wallet.status.bioUnknown;
    const walletEmpty = () => D.balancesKnown && !D.holdings().length;
    const noticeText = (key) => `<span class="cell-main"><span class="cell-title notice-text" ${L(key)}>${tx(key)}</span></span>`;
    const noticeRow = (key, action, word) => (action
      ? `<button class="cell press-row notice-row" type="button" data-wallet="${action}">${noticeText(key)}${word ? `<span class="cell-value notice-act" ${L(word)}>${tx(word)}</span>` : icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`
      : `<div class="cell notice-row">${noticeText(key)}</div>`);
    const walletCard = (mark, title, text, buttons) => `
      <div class="group wallet-card">
        <span class="wallet-card-mark">${mark === 'wallet' && CK.logoMark ? CK.logoMark(30) : icon(mark, { size: 26, fill: true })}</span>
        <b>${title}</b>
        ${text ? `<span>${text}</span>` : ''}
        ${buttons || ''}
      </div>`;
    function createCard() {
      const setup = window.DemoWalletSetup;
      const status = CK.wallet.status;
      if (status.makeFailed === 'store') return walletCard('lock', tx('wallet.createTitle'), tx('walletAuto.noStore'));
      if (!setup || !status.setup) return walletCard('wallet', tx('wallet.createTitle'), tx(status.phone && status.oldClient ? 'walletAuto.update' : 'walletAuto.phoneLine'));
      return walletCard('wallet', tx('wallet.createTitle'), '', `<button class="btn btn--wide press" type="button" data-wallet="create">${tx('wallet.create')}</button><button class="tk-link wallet-note-link" type="button" data-wallet="import-words">${tx('wallet.enterWords')}</button>`);
    }
    function walletNote() {
      const status = CK.wallet.status;
      if (status.restoring) return '';
      if (status.oldElsewhere) return '';
      const words = window.DemoWalletSetup && status.wordsEntry ? 'import' : null;
      if (status.lost) return noticeRow('wallet.lost', words);
      if (status.bioUnknown) return noticeRow('wallet.bioWait', 'recheck', 'common.retry');
      if (status.mismatch) return noticeRow('wallet.mismatch', null);
      if (status.denied) return noticeRow('wallet.denied', 'settings');
      if (T.wallet.readOnly) return noticeRow('wallet.readOnly', status.canRestore && status.wordsEntry ? 'restore' : words);
      return '';
    }
    const ACTION_GLYPHS = { deposit: 'deposit', withdraw: 'withdraw', exchange: tabIcon('exchange', 'swap'), history: 'history' };
    function walletActions() {
      const signs = canSign();
      const list = T.wallet && !T.wallet.readOnly ? [['deposit', 'action.deposit']] : [];
      if (signs && !walletEmpty()) list.push(['withdraw', 'action.withdraw']);
      list.push(['exchange', 'action.swap'], ['history', 'common.history']);
      return `<div class="screen-pad action-row pf-actions" id="wallet-actions" data-n="${list.length}" data-list="${list.map(([i]) => i).join()}">${list.map(([i, key]) => `
        <button class="action press" type="button" data-action="${i}" data-motion-key="${i}"><span class="action-disc">${icon(ACTION_GLYPHS[i] || i)}</span><span class="action-label" ${L(key)}>${tx(key)}</span></button>`).join('')}</div>`;
    }
    function paintActions() {
      const row = $('#wallet-actions', body);
      if (!row || !T.wallet) return;
      const html = walletActions();
      if (row.dataset.list === /data-list="([^"]*)"/.exec(html)[1]) return;
      const was = row.dataset.list.split(',');
      row.outerHTML = html;
      const now = $('#wallet-actions', body);
      if (now && CK.motion) CK.motion.blocks($$('.action', now).filter((b) => !was.includes(b.dataset.action)));
    }
    const pendingPill = () => `<button class="pf-pending press" type="button" id="wallet-pending" data-wallet="pending" hidden><i class="sw-spin sw-spin--small"></i><span ${L('wallet.pendingRow')}>${tx('wallet.pendingRow')}</span></button>`;
    function walletScreen() {
      const note = walletNote();
      const noteSlot = `<div id="wallet-note"${note ? '' : ' hidden'}>${note}</div>`;
      const signs = canSign();
      return `
        <div class="wallet-top">
          <div class="screen-pad">${cards.balance({ label: '', value: 0, pnl: 0, pnlPct: 0, eyeBy: true, foot: pendingPill() })}</div>
          ${walletActions()}
        </div>
        <div class="wallet-main">
          <div class="wallet-notices">
            <div id="wallet-backup-line" hidden></div>
            ${signs ? '' : noteSlot}
            <div id="wallet-legacy-line" hidden></div>
            <div id="wallet-solalt-line" hidden></div>
            <div id="nets-own-line" hidden>${noticeRow('xnet.ownOpen', 'nets-own')}</div>
            ${signs ? noteSlot : ''}
            <div id="tron-closed-line" hidden>${noticeRow('xnet.tronClosed', 'tron-closed')}</div>
          </div>
          <section class="section" id="assets-section">
            <div class="pf-assets-head" id="pf-assets-head" hidden>
              <button class="pf-assets-title press" type="button" data-wallet="alloc"><span ${L('manage.assets')}>${tx('manage.assets')}</span>${icon('chevron-right', { size: 18 })}</button>
              <button class="pf-manage press" type="button" data-wallet="manage"><span ${L('manage.open')}>${tx('manage.open')}</span>${icon('sliders', { size: 18 })}</button>
            </div>
            <div id="assets-slot"></div>
          </section>
          <section class="section or-section" id="orders-section" hidden></section>
        </div>`;
    }
    const SCREENS = {
      loading: () => `<div class="pf-skel" aria-hidden="true">
          <div class="screen-pad pf-skel-top"><span class="skel pf-skel-total"></span><span class="skel pf-skel-day"></span></div>
          <div class="screen-pad action-row" data-n="3">${'<span class="pf-skel-act"><span class="skel pf-skel-disc"></span><span class="skel pf-skel-label"></span></span>'.repeat(3)}</div>
          <div class="section"><div class="group list--free">${PF_SKEL_ROW.repeat(3)}</div></div>
        </div>`,
      failed: () => walletCard('warning', tx('market.down'), tx(CK.wallet.status.why && CK.wallet.status.why !== 'old' && CK.wallet.status.why !== 'store' ? 'walletWhy.' + CK.wallet.status.why : 'wallet.failedText'), `<button class="btn btn--wide btn--tinted press" type="button" data-wallet="retry">${tx('common.retry')}</button>`),
      create: createCard,
      foreign: () => walletCard('warning', tx('wallet.foreignTitle'), tx('wallet.foreignText')),
      wallet: walletScreen
    };
    function paintScreen(force) {
      const state = stateNow();
      const status = CK.wallet.status;
      const key = [state, T.wallet && T.wallet.address, T.wallet && T.wallet.readOnly, status.lost, status.denied, status.bioUnknown, status.mismatch, status.setup, status.canRestore, status.makeFailed, status.oldClient, status.restoring, status.wordsEntry, status.oldElsewhere, status.why].join('|');
      if (key === shownState && !force) return;
      const stateChanged = !!shownState && shownState.split('|')[0] !== state;
      shownState = key;
      listShape = null;
      const wasValue = $('.balance-value', body);
      const was = wasValue && shownAddress && T.wallet && shownAddress !== T.wallet.address ? wasValue.getAttribute('aria-label') : null;
      shownAddress = T.wallet ? T.wallet.address : null;
      body.innerHTML = SCREENS[state]();
      const entering = stateChanged || !!was;
      if (entering && state !== 'wallet') {
        if (CK.motion) CK.motion.blocks(Array.from(body.querySelectorAll('.wallet-card, .group, .pf-skel > *')));
        else fadeIn(Array.from(body.children));
      }
      screen.el.querySelectorAll('.navbar-lead .balance-eye').forEach((one) => one.remove());
      if (state !== 'wallet') return;
      if (entering && CK.motion) CK.motion.balance($('.balance-total', body));
      else if (entering) fadeIn(Array.from(body.children));
      const addressChip = $('.balance-address span', body);
      if (addressChip) addressChip.textContent = T.shortAddress(T.wallet.friendly);
      paintSwitch();
      const now = totalText();
      const value = $('.balance-value', body);
      value.dataset.roll = was || now;
      cards.wireBalance(body);
      const eye = $('.balance-eye', body);
      const lead = $('.navbar-lead', screen.el);
      if (eye && lead) {
        eye.classList.add('navbar-eye');
        lead.appendChild(eye);
      }
      carried = !!was && !D.balancesKnown;
      value.classList.toggle('is-pending', !D.balancesKnown);
      $('.balance', body).classList.toggle('is-loading', !D.balancesKnown && !carried);
      if (was && was !== now && !carried) rollTotal(value, now);
      paintAssets();
      if (entering && CK.motion) CK.motion.blocks([...$$('.action', body), ...$$('.wallet-notices > :not([hidden]), #pf-assets-head', body)]);
      paintValues();
      paintPending();
      paintGuard();
      DemoOrders.mount($('#orders-section', body), () => currentTab === 'portfolio', refresh);
    }

    function paintSwitch() {
      const shown = window.DemoWalletList && T.wallet ? DemoWalletList.current() : null;
      const btn = $('.wl-switch', screen.el);
      if (!btn) return;
      $('.wl-switch-name', btn).textContent = shown ? shown.name : tx('wallets.default', { n: 1 });
      $('.wl-ava', btn).style.setProperty('--c', shown ? shown.hue : 'var(--accent)');
      btn.setAttribute('aria-label', `${shown ? shown.name : tx('wallets.default', { n: 1 })}, ${tx('wallets.title')}`);
    }
    let launched = false;
    function paintGuard() {
      const promptsOk = !launchSheetPending;
      const status = CK.wallet.status;
      const line = $('#wallet-backup-line', body);
      if (line) {
        line.hidden = !status.backupFailing;
        const passive = status.mismatch || !canSign();
        line.classList.toggle('is-passive', passive);
        setHtml(line, noticeRow('wallet.backupFailing', passive ? null : 'backup'));
      }
      if (window.DemoWalletList) DemoWalletList.paintLegacy($('#wallet-legacy-line', body));
      if (window.DemoWalletList) DemoWalletList.paintSolAlt($('#wallet-solalt-line', body));
      const held = D.balancesKnown ? D.holdings() : [];
      if (promptsOk && currentTab === 'portfolio' && launched && status.moving && status.moving.any) DemoWalletSetup.openMove();
      if (promptsOk && currentTab === 'portfolio' && held.some((h) => h.risk !== 'suspicious') && status.method === 'keychain' && !status.bioType && status.setup === 'password' && !status.asked && launched) DemoWalletSetup.openProtect();
    }
    Promise.resolve().then(() => {
      launched = true;
      paintGuard();
    });
    CK.wallet.onBackup(() => {
      paintScreen();
      paintSwitch();
      paintGuard();
    });

    const totalText = () => fmt.usd(D.totals().value);
    const rollTotal = (value, text) => (cards.rollBalance ? cards.rollBalance(value, text) : CK.roll(value, text));
    let carried = false;
    function paintAlloc() {
      if (!$('#alloc-section', body)) return;
      const sorted = DemoAllocation.parts();
      $('#alloc-section', body).hidden = sorted.length < 2;
      const fold = sorted.length > ALLOC_ROWS;
      const rows = fold ? sorted.slice(0, ALLOC_ROWS - 1) : sorted.slice();
      const rest = fold ? sorted.slice(ALLOC_ROWS - 1).reduce((s, r) => s + r.v, 0) : 0;
      if (rest > 0) rows.push({ color: 'var(--al-other)', sym: tx('portfolio.other'), v: rest });
      const total = rows.reduce((s, r) => s + r.v, 0) || 1;
      setHtml($('#alloc', body), `
        <div class="alloc-bar" role="img" aria-label="${tx('portfolio.allocAria')}">${rows.map((r) => `<i style="--c:${r.color};flex:${(r.v / total).toFixed(3)} 1 0"></i>`).join('')}</div>
        <div class="alloc-legend">${rows.map((r) => `<span style="--c:${r.color}"><i></i><em>${CK.esc(r.sym)}</em><b>${Math.round(r.v / total * 100)}%</b></span>`).join('')}</div>
        ${icon('chevron-right', { size: 16, className: 'cell-chevron alloc-chevron' })}`);
    }
    const HOME_NET = { eth: 'Ethereum', sol: 'Solana', bnb: 'BNB Chain', btc: 'Bitcoin', trx: 'Tron', ton: 'TON' };
    const MANY_NETS = new Set(['USDT', 'USDC']);
    function netBadge(h) {
      const name = h.net || 'TON';
      if (!MANY_NETS.has(String(h.coin.sym || '').toUpperCase()) && (!h.net || HOME_NET[h.coin.id] === h.net)) return '';
      if (name === 'TON') return D.byId.ton ? `<span class="net-badge" title="TON">${CK.coinLogo(D.byId.ton, 18)}</span>` : '';
      const chain = window.DemoNets ? DemoNets.chains().find((c) => c.name === name) : null;
      if (!chain || !chain.mark) return `<em class="tag">${CK.esc(name)}</em>`;
      return `<span class="net-badge" title="${CK.esc(name)}">${CK.coinLogo({ id: 'net:' + chain.key, sym: name, neutral: true, logo: chain.mark }, 18)}</span>`;
    }
    const rowKey = (h) => (window.DemoManage ? DemoManage.keyOf(h) : `${h.coin.id}${h.net ? '@' + h.net : ''}`);
    function assetRow(h) {
      const flagged = h.risk === 'suspicious';
      const mark = netBadge(h);
      const badge = mark.startsWith('<span') ? mark : '';
      const plain = flagged || (h.coin.viewOnly && !(window.DemoNets && typeof DemoNets.marketCoinOf === 'function' && DemoNets.marketCoinOf(h.coin)));
      const tag = plain ? 'div' : 'button';
      return `
        <${tag} class="cell asset-row ${plain ? '' : 'press-row'}" ${plain ? '' : 'type="button"'} data-coin="${CK.esc(h.coin.id)}" data-motion-key="${CK.esc(rowKey(h))}">
          <span class="coin-with-net">${CK.coinLogo(h.coin, 40)}${badge}</span>
          <span class="market-name"><b class="asset-name"><span>${flagged ? tx('portfolio.unknownToken') : CK.esc(h.coin.name)}</span>${flagged ? `<em class="tag tag--down">${tx('risk.bad')}</em>` : ''}${badge ? '' : mark}</b><span class="asset-amount">${D.qty(h.amount)}${flagged ? '' : ' ' + CK.esc(h.coin.sym)}</span></span>
          ${flagged ? '' : `<span class="asset-right"><b>${h.priced ? fmt.usd(h.usd) : '—'}</b></span>`}
        </${tag}>`;
    }
    const arranged = (small) => (window.DemoManage && T.wallet
      ? DemoManage.arrange(D.holdings(), T.wallet.address, { small })
      : { rows: D.holdings().filter((h) => h.risk !== 'suspicious' && (h.priced || !h.coin.isToken || h.net === 'Tron') && !(small && h.priced && h.usd < 1)), hidden: 0 });
    function openManage() {
      if (!window.DemoManage || !T.wallet || CK.sheet.top) return;
      DemoManage.openManage({
        address: T.wallet.address,
        holdings: () => (D.balancesKnown ? D.holdings() : []),
        logo: (h) => {
          const mark = netBadge(h);
          return `<span class="coin-with-net">${CK.coinLogo(h.coin, 40)}${mark.startsWith('<span') ? mark : ''}</span>`;
        },
        onChange: () => repaintAssets()
      });
    }
    function paintAssets() {
      const slot = $('#assets-slot', body);
      if (!slot) return;
      const small = hideSmall();
      const known = D.balancesKnown;
      const held = known ? D.holdings() : [];
      const { rows, hidden } = arranged(small);
      const hiddenSmall = small ? arranged(false).rows.length - rows.length : 0;
      const prefs = window.DemoManage && T.wallet ? DemoManage.prefsOf(T.wallet.address) : null;
      const shape = [CK.i18n.lang, known, small, hiddenSmall, held.length, loadFailed && !known, hidden, prefs ? JSON.stringify(prefs) : '', rows.map((r) => `${rowKey(r)}|${r.units}|${r.risk}`).join()].join('~');
      if (shape === listShape) return;
      listShape = shape;
      const head = $('#pf-assets-head', body);
      if (head) {
        const appearing = head.hidden && held.length > 0;
        head.hidden = !held.length;
        if (appearing && CK.motion) CK.motion.blocks([head], { fresh: true });
      }
      const hadSkel = !!$('.wallet-skel, .pf-skel-list', slot);
      if (!known) {
        slot.innerHTML = loadFailed
          ? noticeRow('wallet.loadFail', 'reload', 'common.retry')
          : `<div class="group list--free pf-skel-list">${PF_SKEL_ROW.repeat(3)}</div>`;
      } else if (rows.length) {
        let group = $('.pf-assets', slot);
        if (!group) {
          slot.innerHTML = '<div class="group list--free pf-assets"></div>';
          group = $('.pf-assets', slot);
        }
        group.innerHTML = rows.map(assetRow).join('');
        if (CK.motion) CK.motion.rows(group);
      } else if (hiddenSmall) {
        slot.innerHTML = `<div class="group list--free"><div class="cell pf-small"><span class="cell-main"><span class="cell-title">${tx('portfolio.hideSmall')}</span><span class="cell-sub"></span></span><button class="pf-small-switch"></button></div></div>`;
        $('.pf-small .cell-sub', slot).textContent = `${tx('portfolio.hideSmallSub')} · ${hiddenSmall}`;
        CK.toggle($('.pf-small-switch', slot), { label: tx('portfolio.hideSmall'), value: true, onChange: (on) => setHideSmall(on) });
      } else if (hidden) {
        slot.innerHTML = `<div class="group list--free"><button class="cell press-row pf-hidden" type="button" data-wallet="manage"><span class="cell-main"><span class="cell-title" ${L('manage.allHidden')}>${tx('manage.allHidden')}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>`;
      } else {
        const unpriced = held.some((h) => h.risk !== 'suspicious');
        slot.innerHTML = `<div class="group list--free"><button class="cell press-row pf-empty" type="button" data-copy-address aria-label="${CK.esc(tx('common.copyAddress'))}"><span class="cell-main"><span class="cell-title">${tx(unpriced ? 'wallet.row' : 'wallet.empty')}</span></span><span class="cell-value pf-empty-address"></span>${icon('copy', { size: 18, className: 'cell-chevron' })}</button></div>`;
        $('.pf-empty-address', slot).textContent = T.wallet ? T.shortAddress(T.wallet.friendly) : '';
      }
      if (hadSkel && !$('.pf-skel-list, .pf-assets', slot)) {
        if (CK.motion) CK.motion.blocks(Array.from(slot.children));
        else fadeIn(Array.from(slot.children));
      }
    }
    repaintAssets = () => {
      listShape = null;
      paintAssets();
    };

    let valuesBehind = false;
    onShow.portfolio = () => {
      if (valuesBehind) paintValues();
      paintGuard();
      loadBalances();
      DemoNets.loadBalances();
      DemoOrders.refresh();
    };
    function paintValues() {
      D.keep();
      if (!T.wallet || !$('.balance', body) || T.wallet.address !== shownAddress) return;
      if (currentTab !== 'portfolio') {
        valuesBehind = true;
        return;
      }
      valuesBehind = false;
      const card = $('.balance', body);
      const value = $('.balance-value', card);
      value.classList.toggle('is-pending', !D.balancesKnown);
      if (card.classList.contains('is-loading') && (D.balancesKnown || loadFailed)) {
        card.classList.remove('is-loading');
        if (CK.motion) CK.motion.rows([$('.balance-total', card)], { fresh: true });
        else if (!CK.reducedMotion() && value.animate) value.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
      if (carried && !D.balancesKnown && !loadFailed) {
      } else if (carried) {
        carried = false;
        rollTotal(value, totalText());
      } else rollTotal(value, totalText());
      const totals = D.totals();
      if (cards.setBalanceDay) cards.setBalanceDay(card, D.balancesKnown && !carried && totals.value > 0 ? totals : null);
      paintAlloc();
      D.holdings().forEach((h) => {
        if (!h.priced) return;
        $$(`.asset-row[data-motion-key="${CSS.escape(rowKey(h))}"]`, body).forEach((row) => {
          const b = $('.asset-right b', row);
          if (b && b.textContent !== fmt.usd(h.usd)) b.textContent = fmt.usd(h.usd);
        });
      });
    }
    function paintPending() {
      const row = $('#wallet-pending', body);
      if (row) row.hidden = !sendOpen && !DemoSwap.pending && !DemoNets.pending;
      const own = $('#nets-own-line', body);
      if (own) {
        const missing = typeof DemoNets.ownMissing === 'function' ? DemoNets.ownMissing() : [];
        own.hidden = !missing.length;
        const and = { ru: ' и ', en: ' and ', uk: ' і ', kk: ' және ' }[CK.i18n.lang] || ', ';
        const names = missing.filter((n) => n !== 'Tron');
        const text = $('.notice-text', own);
        text.removeAttribute('data-i18n');
        text.textContent = missing.length ? tx('xnet.ownMissing', { net: names.length ? names.join(and) : tx('xnet.otherNets') }) : '';
        $('.notice-row', own).disabled = !!DemoNets.ownOpening;
      }
      paintTronLine();
    }
    function paintTronLine() {
      const line = $('#tron-closed-line', body);
      if (line) line.hidden = !D.holdings().some((h) => h.net === 'Tron' && h.risk !== 'suspicious');
    }
    const answered = () => D.balancesKnown && !D.balancesKept;
    function nextLookMs() {
      if (fails) return Math.min(RETRY_FIRST_MS * 2 ** (fails - 1), RETRY_MAX_MS);
      if (!answered()) return UNKNOWN_BALANCES_MS;
      return D.holdings().length ? BALANCES_MS : EMPTY_BALANCES_MS;
    }
    let readAfterJob = false;
    function loadBalances(force, aged) {
      clearTimeout(loadTimer);
      const wallet = T.wallet;
      if (!wallet) return;
      const known = answered();
      loadTimer = setTimeout(loadBalances, nextLookMs());
      if (loadJob && force === true) readAfterJob = true;
      if (document.hidden || loadJob || (force !== true && aged !== true && currentTab !== 'portfolio' && known)) return;
      const still = () => !!T.wallet && T.wallet.address === wallet.address;
      const again = (soon) => {
        clearTimeout(loadTimer);
        loadTimer = setTimeout(soon ? () => loadBalances(false, true) : loadBalances, soon ? AGED_LOOK_MS : nextLookMs());
      };
      loadJob = T.config().then((now) => {
        setConfig(now);
        return T.api('wallet/balances?address=' + encodeURIComponent(wallet.address) + (aged === true || (known && force !== true) ? '&poll=1' : ''));
      }).then((answer) => {
        if (!still()) return;
        fails = 0;
        loadFailed = false;
        D.setBalances(answer.balances);
        again(answer.aged === true && aged !== true);
      }, (err) => {
        console.error(err);
        if (!still()) return;
        fails += 1;
        loadFailed = fails >= FAILS_SHOWN;
        paintAssets();
        paintValues();
        again();
      }).finally(() => {
        loadJob = null;
        if (!readAfterJob) return;
        readAfterJob = false;
        if (still()) loadBalances(true);
      });
      if (canSign() && (sendOpen || pendingAskedFor !== wallet.address)) checkPending(wallet);
    }
    function checkPending(wallet) {
      pendingAskedFor = wallet.address;
      CK.wallet.pending().then((open) => {
        sendOpen = !!open;
        paintPending();
      }, () => { });
    }
    function setConfig(next) {
      if (next === config) return;
      config = next;
      paintScreen();
    }
    function retry() {
      config = null;
      walletAsked = false;
      paintScreen();
      T.config().then(setConfig);
      CK.wallet.ensure().catch((err) => console.error(err)).then(() => {
        walletAsked = true;
        paintScreen();
      });
    }

    body.addEventListener('keydown', (e) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || e.target.id !== 'alloc') return;
      e.preventDefault();
      DemoAllocation.open();
    });
    const WALLET_ACTIONS = {
      switch: () => DemoWalletList.open(totalText),
      alloc: () => DemoAllocation.open(),
      manage: () => openManage(),
      create: () => DemoWalletSetup.openCreate(),
      import: () => DemoWalletSetup.openImport(),
      'import-words': () => DemoWalletSetup.openImport(true),
      backup: () => DemoWalletSetup.openBackup(),
      restore: () => DemoWalletSetup.openRestore(),
      settings: () => CK.wallet.openBiometricSettings(),
      recheck: () => CK.wallet.refresh().then(() => paintScreen()),
      retry,
      reload: () => {
        fails = 0;
        loadFailed = false;
        paintAssets();
        loadBalances();
      },
      'nets-own': () => DemoNets.openOwn(),
      'tron-closed': () => openTronWithdraw(),
      explorer: openExplorer,
      pending: () => {
        if (DemoSwap.pending) DemoSwap.openTrack();
        else if (DemoNets.pending) DemoNets.openTrack();
        else openExplorer();
      }
    };
    $('.navbar', screen.el).addEventListener('click', (e) => {
      if (!e.target.closest('.wl-switch') || !T.wallet) return;
      CK.haptic.light();
      WALLET_ACTIONS.switch();
    });
    function openTronWithdraw(id) {
      if (T.wallet && T.wallet.readOnly) {
        CK.toast(tx('wallet.readOnly'), { icon: 'warning', tone: 'down' });
        return;
      }
      const row = id && typeof DemoNets.withdrawRowOf === 'function' ? DemoNets.withdrawRowOf(id) : null;
      DemoWallet.openWithdraw(row ? { chain: 'tron', row } : { chain: 'tron' });
    }
    function openHeld(id, row) {
      if (String(id).startsWith('tron:')) {
        openTronWithdraw(id);
        return;
      }
      if (D.byId[id]) {
        openCoin(D.byId[id], row);
        return;
      }
      const held = D.holdings().find((h) => h.coin.id === id);
      const inst = held ? held.coin : null;
      if (!inst) return;
      if (inst.viewOnly) {
        const coin = typeof DemoNets.marketCoinOf === 'function' ? DemoNets.marketCoinOf(inst) : null;
        if (coin) openCoin(coin, row);
        return;
      }
      if (DemoNets.listed(inst)) {
        trade.openHeldToken(id, row);
        return;
      }
      const unlisted = inst.token.volume24h === null && inst.token.liquidity === null;
      if (unlisted && canSign() && config && config.state === 'open') {
        DemoSwap.open(null, 'sell', { id: T.rawAddress(inst.token.address), sym: inst.sym, name: inst.name, logo: inst.logo, decimals: held.decimals });
        return;
      }
      trade.openHeldToken(id, row);
    }
    body.addEventListener('click', (e) => {
      if (e.target.closest('#alloc')) {
        DemoAllocation.open();
        return;
      }
      if (e.target.closest('[data-copy-address]')) {
        copyAddress();
        return;
      }
      const walletAction = e.target.closest('[data-wallet]');
      if (walletAction) {
        CK.haptic.light();
        WALLET_ACTIONS[walletAction.dataset.wallet]();
        return;
      }
      const action = e.target.closest('[data-action]');
      if (action) {
        CK.haptic.light();
        ({ deposit: DemoWallet.openDeposit, withdraw: DemoWallet.openWithdraw, exchange: () => goTab('exchange'), history: () => openHistory() })[action.dataset.action]();
        return;
      }
      const row = e.target.closest('button[data-coin]');
      if (row) openHeld(row.dataset.coin, row);
    });
    makeStack('portfolio', screen);

    D.onBalances(() => {
      paintAssets();
      paintValues();
      paintGuard();
      paintActions();
      paintTronLine();
    });
    T.onWallet((wallet) => {
      D.setBalances(null);
      if (wallet) D.restoreKept(wallet.address);
      fails = 0;
      loadFailed = false;
      sendOpen = false;
      pendingAskedFor = null;
      paintScreen();
      loadBalances();
    });
    T.config().then(setConfig);
    CK.wallet.ready.then(() => {
      walletAsked = true;
      if (T.wallet && !D.balancesKnown) D.restoreKept(T.wallet.address);
      paintScreen();
      loadBalances();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && currentTab === 'portfolio') loadBalances();
    });
    CK.i18n.bind(screen.el, () => paintScreen(true));
    const TINTED_TABS = { trade: 1, exchange: 1, bonus: 1, profile: 1 };
    let tabTint = null, tabTintTheme = null;
    function tabTintNow() {
      const dark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const theme = `${document.documentElement.dataset.theme || ''}|${dark ? 1 : 0}`;
      if (theme !== tabTintTheme) {
        tabTintTheme = theme;
        tabTint = getComputedStyle(document.documentElement).getPropertyValue('--tab-top').trim() || null;
      }
      return tabTint;
    }
    function syncHero() {
      if (currentTab !== 'portfolio') {
        const own = !!TINTED_TABS[currentTab] && (stacks[currentTab] ? stacks[currentTab].depth <= 1 : true);
        CK.tg.tintHeader(own && !(CK.launch && CK.launch.headerHeld) ? tabTintNow() : null);
        return;
      }
      const heroEl = $('.wallet-hero', body);
      const bar = $('.navbar', screen.el);
      const gone = !heroEl || screen.scroll.scrollTop > heroEl.offsetHeight - (bar ? bar.offsetHeight : 56);
      screen.el.classList.toggle('has-hero', !!heroEl);
      screen.el.classList.toggle('hero-gone', !!heroEl && gone);
      const top = stacks.portfolio ? stacks.portfolio.depth <= 1 : true;
      const pfTop = getComputedStyle(document.documentElement).getPropertyValue('--pf-top').trim();
      const held = !!(CK.launch && CK.launch.headerHeld);
      CK.tg.tintHeader(top && currentTab === 'portfolio' && pfTop && !held ? pfTop : null);
    }
    screen.scroll.addEventListener('scroll', syncHero, { passive: true });
    document.addEventListener('ck:launch-header', syncHero);
    viewChanged.push(syncHero);
    new MutationObserver(syncHero).observe(body, { childList: true });
    new MutationObserver(syncHero).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    paintScreen();
    syncHero();
    (function splashBackstop() {
      const drop = (late) => {
        const s = document.getElementById('dp-splash');
        if (!s || (late && s.classList.contains('is-out'))) return;
        s.remove();
        document.documentElement.classList.remove('sp-on', 'motion-launch');
        if (CK.tg && typeof CK.tg.repaint === 'function') CK.tg.repaint();
      };
      const look = () => {
        const s = document.getElementById('dp-splash');
        if (!s || s.classList.contains('is-out')) return;
        const shown = CK.launch && typeof CK.launch.shownAt === 'number' ? CK.launch.shownAt : 0;
        const t = typeof performance !== 'undefined' && performance && typeof performance.now === 'function' ? performance.now() : Infinity;
        const left = shown < 0 ? (t < 13000 ? 1000 : 0) : Math.min(3000, shown + 3000 - t);
        if (left > 0) setTimeout(look, left);
        else drop(true);
      };
      if (!CK.launch) drop(false);
      else setTimeout(look, 3000);
    })();
    function refresh() {
      if (T.wallet) pendingAskedFor = null;
      loadBalances(true);
      paintValues();
      return loadJob;
    }
    function reread() {
      if (Date.now() - D.balancesAt > REREAD_AFTER_MS) loadBalances(true);
    }
    let swapRunning = false;
    DemoSwap.onChange(() => {
      paintPending();
      const running = !!DemoSwap.pending;
      if (swapRunning && !running) refresh();
      swapRunning = running;
      paintScreen();
    });
    function answeredNets() {
      try {
        return DemoNets.chains().filter((chain) => DemoNets.nativeWei(chain.key) !== undefined).map((chain) => chain.name);
      } catch (err) {
        console.error(err);
        return [];
      }
    }
    let netsRunning = false;
    DemoNets.onChange(() => {
      paintPending();
      D.settleNets(answeredNets);
      const was = netsRunning;
      netsRunning = !!DemoNets.pending;
      if (was && !netsRunning) refresh();
    });
    return { refresh, reread, paintValues };
  }

  const PRESETS = {
    ios: { key: 'preset.ios', vars: null },
    day: {
      key: 'preset.day', scheme: 'light',
      vars: { 'bg-color': '#ffffff', 'secondary-bg-color': '#efeff3', 'section-bg-color': '#ffffff', 'text-color': '#000000', 'hint-color': '#8e8e93', 'subtitle-text-color': '#8e8e93', 'link-color': '#3390ec', 'accent-text-color': '#3390ec', 'button-color': '#3390ec', 'button-text-color': '#ffffff', 'header-bg-color': '#f7f7f7', 'section-separator-color': '#e0e0e4', 'destructive-text-color': '#e53935' }
    },
    night: {
      key: 'preset.night', scheme: 'dark',
      vars: { 'bg-color': '#17212b', 'secondary-bg-color': '#0e1621', 'section-bg-color': '#17212b', 'text-color': '#f5f5f5', 'hint-color': '#7f91a4', 'subtitle-text-color': '#7f91a4', 'link-color': '#6ab3f3', 'accent-text-color': '#6ab3f3', 'button-color': '#5288c1', 'button-text-color': '#ffffff', 'header-bg-color': '#17212b', 'section-separator-color': '#0b1219', 'destructive-text-color': '#ec3942' }
    },
    violet: {
      key: 'preset.violet', scheme: null,
      vars: { 'button-color': '#7a5cf0', 'button-text-color': '#ffffff', 'link-color': '#7a5cf0', 'accent-text-color': '#7a5cf0' }
    }
  };
  const VAR_NAMES = ['bg-color', 'secondary-bg-color', 'section-bg-color', 'text-color', 'hint-color', 'subtitle-text-color', 'link-color', 'accent-text-color', 'button-color', 'button-text-color', 'header-bg-color', 'section-separator-color', 'destructive-text-color'];
  const store = {
    get(k) { try { return localStorage.getItem('ck-' + k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem('ck-' + k, v); } catch (_) { } }
  };
  const themeControls = [];
  const presetControls = [];
  let themeMode = store.get('theme2') || 'auto';
  let presetId = store.get('preset') || 'ios';

  const THEME_CALM_MS = 600;
  let themeCalmTimer = 0;
  function applyTheme(mode, fromControl) {
    if (fromControl && mode !== themeMode && typeof document.startViewTransition === 'function' && !CK.reducedMotion()) {
      try {
        document.startViewTransition(() => setTheme(mode, fromControl));
        return;
      } catch (_) { }
    }
    setTheme(mode, fromControl);
  }
  function setTheme(mode, fromControl) {
    themeMode = mode;
    document.documentElement.classList.add('is-theming');
    clearTimeout(themeCalmTimer);
    themeCalmTimer = setTimeout(() => document.documentElement.classList.remove('is-theming'), THEME_CALM_MS);
    if (CK.tg.inside) {
      CK.tg.forceTheme(mode === 'auto' ? null : mode);
    } else if (mode === 'auto') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = mode;
    }
    store.set('theme2', mode);
    themeControls.forEach((c) => { if (c !== fromControl) c.set(mode); });
  }
  function applyPreset(id, fromControl) {
    presetId = id;
    const root = document.documentElement.style;
    VAR_NAMES.forEach((n) => root.removeProperty('--tg-theme-' + n));
    const preset = PRESETS[id];
    if (preset.vars) Object.entries(preset.vars).forEach(([n, v]) => root.setProperty('--tg-theme-' + n, v));
    if (preset.scheme) applyTheme(preset.scheme);
    store.set('preset', id);
    presetControls.forEach((c) => { if (c !== fromControl) c.set(id); });
    $$('[data-preset-value]').forEach((n) => { n.textContent = tx(preset.key); });
  }
  function themeSegment(host, size) {
    const ctl = CK.segmented(host, {
      label: tr('theme.aria'), value: themeMode, size,
      items: [{ value: 'auto', label: tr('theme.auto') }, { value: 'light', label: tr('theme.light') }, { value: 'dark', label: tr('theme.dark') }],
      onChange(v) {
        if (presetId !== 'ios' && PRESETS[presetId].scheme) applyPreset('ios');
        applyTheme(v, ctl);
      }
    });
    themeControls.push(ctl);
    return ctl;
  }

  function showUser(user) {
    const text = (v) => (typeof v === 'string' ? v.trim() : '');
    const username = text(user.username);
    const name = [text(user.firstName), text(user.lastName)].filter(Boolean).join(' ') || username;
    if (name) CK.setProfileHero({ name, username, photoUrl: text(user.photoUrl) });
  }

  function openAccount() {
    if (CK.sheet.top) return;
    CK.haptic.light();
    const who = CK.profileHero();
    CK.sheet.open({
      title: tx('account.title'),
      build(b) {
        b.innerHTML = `
          <div class="account-head"><span class="hd-face account-face account-face--big" data-hd-face></span><b class="account-name" data-hd-name></b><span class="account-user" data-hd-username></span></div>
          ${T.wallet ? `<div class="account-wallet">
            <div class="group"><button class="cell press-row" type="button" data-copy-wallet><span class="cell-main"><span class="cell-title">${tx('wallet.row')}</span></span><span class="cell-value" data-v="wallet"></span>${icon('copy', { size: 18, className: 'cell-chevron' })}</button></div>
            <button class="tk-link account-explorer" type="button" data-explorer>${tx('wallet.explorer')}</button>
          </div>` : ''}`;
        const w = $('[data-v="wallet"]', b);
        if (w) w.textContent = T.shortAddress(T.wallet.friendly);
        const copy = $('[data-copy-wallet]', b);
        if (copy) copy.addEventListener('click', copyAddress);
        const explorer = $('[data-explorer]', b);
        if (explorer) explorer.addEventListener('click', openExplorer);
        CK.paintProfile(b);
        if (!who.name) $('.account-head .account-name', b).textContent = tx('account.title');
      }
    });
  }

  function openWalletInfo() {
    if (CK.sheet.top || !T.wallet) return;
    CK.haptic.light();
    CK.sheet.open({
      title: tx('wallet.row'),
      build(b) {
        b.innerHTML = `
          <span class="wallet-address"></span>
          <button class="btn btn--wide press" type="button" data-copy>${icon('copy', { size: 20 })}${tx('common.copyAddress')}</button>
          <button class="tk-link" type="button" data-explorer>${tx('wallet.explorer')}</button>`;
        $('.wallet-address', b).textContent = T.wallet.friendly;
        $('[data-copy]', b).addEventListener('click', copyAddress);
        $('[data-explorer]', b).addEventListener('click', openExplorer);
      }
    });
  }

  const INVITE_LINK = 'https://t.me/DevpoolTrading_bot?startapp=r_';

  const CURRENCY_SIGN = { USD: '$', EUR: '€', RUB: '₽' };
  const currencySign = () => CURRENCY_SIGN[CK.currency.code] || CK.currency.code;
  const THEME_MODES = ['auto', 'light', 'dark'];
  themeControls.push({ set(mode) { $$('[data-theme-value]').forEach((n) => { n.textContent = tx('theme.' + mode); }); } });
  function openThemeSheet() {
    if (CK.sheet.top) return;
    const fromSheet = { set() {} };
    CK.sheet.open({
      title: tx('profile.appearance'),
      build(b, sheet) {
        b.innerHTML = `<div class="sheet-list">${THEME_MODES.map((mode) => `
          <button class="cell press-row ${themeMode === mode ? 'is-selected' : ''}" type="button" data-mode="${mode}"><span class="cell-main"><span class="cell-title">${tx('theme.' + mode)}</span></span>${icon('check', { size: 20, className: 'cell-check' })}</button>`).join('')}</div>`;
        b.addEventListener('click', (ev) => {
          const row = ev.target.closest('[data-mode]');
          if (!row) return;
          CK.haptic.selection();
          $$('.cell', b).forEach((n) => n.classList.toggle('is-selected', n === row));
          if (presetId !== 'ios' && PRESETS[presetId].scheme) applyPreset('ios');
          applyTheme(row.dataset.mode, fromSheet);
          sheet.close();
        });
      }
    });
  }

  function buildProfile() {
    const who = CK.profileHero();
    const screen = CK.screen({
      title: tr('tab.profile'), className: 'screen--profile', hero: { name: who.name, username: who.username },
      actions: [{ icon: 'gear', size: 22, className: 'navbtn--settings', label: tr('profile.settings'), onClick: (btn) => openSettings(btn) }]
    });
    screen.body.innerHTML = `
      <div class="group" id="profile-wallet" hidden></div>
      <div class="group">${tileCell({ id: 'row-cheques', icon: 'gift', tone: 'orange', key: 'cheque.mine', value: '<span data-cheques-count></span>' })}${tileCell({ id: 'row-invoices', icon: 'doc', tone: 'teal', key: 'inv.row' })}${tileCell({ id: 'row-alerts', icon: 'bell', tone: 'red', key: 'alerts.row' })}</div>
      ${P2P_MODE === 'open' ? `<div class="group">${tileCell({ id: 'row-bonus', icon: tabIcon('tab-gift', 'gift'), tone: 'green', key: 'tab.bonus' })}</div>` : ''}
      <div class="group" id="profile-payouts" hidden></div>
      <div id="profile-settings">
      <div class="group">
        ${tileCell({ id: 'row-theme', icon: 'sun', tone: 'orange', key: 'profile.appearance', value: `<span data-theme-value>${tx('theme.' + themeMode)}</span>` })}
        ${tileCell({ id: 'row-lang', icon: 'globe', tone: 'teal', key: 'profile.lang', value: CK.esc(CK.i18n.name) })}
        ${tileCell({ id: 'row-currency', icon: 'bank', tone: 'green', key: 'profile.currency', value: CK.esc(currencySign()) })}
        ${switchCell({ id: 'sw-haptic', icon: 'activity', tone: 'purple', key: 'profile.haptic' })}
      </div>
      <div class="group">
        ${tileCell({ id: 'row-fees', icon: 'percent', tone: 'blue', key: 'fees.row' })}
        ${window.DemoWelcome ? tileCell({ id: 'row-howto', icon: 'info', tone: 'indigo', key: 'profile.howto' }) : ''}
      </div>
      <div class="group settings-forget"><button class="cell press-row" type="button" id="row-forget"><span class="cell-main"><span class="cell-title" ${L('forget.row')}>${tx('forget.row')}</span></span></button></div>
      </div>`;
    const body = screen.body;
    const head = $('.hd-hero', screen.el);
    head.classList.add('hd-hero--tap');
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    const nameFallback = () => {
      const name = $('[data-hd-name]', screen.el);
      if (name && !CK.profileHero().name) name.textContent = tx('account.title');
      head.setAttribute('aria-label', `${CK.profileHero().name || tx('account.title')}, ${tx('account.title')}`);
    };
    nameFallback();
    head.addEventListener('click', openAccount);
    head.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openAccount();
    });
    const settings = $('#profile-settings', body);
    const walletMore = CK.el('<div class="group" id="profile-wallet-more" hidden></div>');
    settings.insertBefore(walletMore, settings.children[1]);
    const walletGroup = $('#profile-wallet', body);
    function paintWalletRows() {
      const wallet = T.wallet;
      walletGroup.hidden = !wallet;
      if (!wallet) {
        setHtml(walletGroup, '');
        walletMore.replaceChildren();
        walletMore.hidden = true;
        return;
      }
      const shown = window.DemoWalletList && DemoWalletList.current();
      const face = CK.logoMark ? `<span class="wl-ava wl-ava--row" style="--c:${shown ? shown.hue : 'var(--accent)'}" aria-hidden="true">${CK.logoMark(24)}</span>` : '';
      setHtml(walletGroup, tileCell({ id: 'row-wallet', icon: 'wallet', tone: 'blue', tile: face, key: 'wallet.row', value: CK.esc(T.shortAddress(wallet.friendly)) }));
      const status = CK.wallet.status;
      const firstMethod = status.mainMethod || status.method;
      const bio = status.kind === 'signer' && !!status.bioType && (firstMethod === 'keychain' || firstMethod === 'biometric');
      const words = !!window.DemoWalletSetup && status.secure && !!status.setup;
      readFindName();
      walletMore.hidden = !(words || bio || findName);
      walletMore.innerHTML = (words ? tileCell({ id: 'row-words', icon: 'key', tone: 'orange', key: 'wallet.enterWords' }) : '')
        + (bio ? switchCell({ id: 'sw-bio', icon: 'lock', tone: 'green', title: CK.esc(bioName(status.bioType)) }) : '')
        + (findName ? switchCell({ id: 'sw-find', icon: 'person', tone: 'indigo', title: CK.esc(tx('profile.findable', { u: findName })) }) : '');
      if (findName) paintFindable();
      if (!bio) return;
      const sw = $('#sw-bio', walletMore);
      const ctl = CK.toggle(sw, { label: bioName(status.bioType), value: firstMethod === 'biometric', onChange: (on) => switchBio(on, ctl, sw) });
      sw.disabled = bioBusy;
    }
    let findName = null, findBusy = false, findLooked = false;
    function readFindName() {
      const st = CK.wallet.directory.state();
      findName = CK.market.mode === 'live' && CK.tg.inside && st.username ? st.username : null;
    }
    function paintFindable() {
      const sw = $('#sw-find', walletMore);
      if (!sw) return;
      const ctl = CK.toggle(sw, { label: tx('profile.findable', { u: findName }), value: CK.wallet.directory.state().on, onChange: (on) => switchFindable(on, ctl, sw) });
      sw.disabled = findBusy;
      if (findLooked) return;
      findLooked = true;
      CK.wallet.directory.look().then((now) => {
        if (!findBusy && document.contains(sw)) ctl.set(now.on);
      }, () => { findLooked = false; });
    }
    function switchFindable(on, ctl, sw) {
      if (findBusy) return ctl.set(!on);
      findBusy = true;
      sw.disabled = true;
      CK.wallet.directory.setFindable(on).catch((err) => {
        console.warn('findable:', err.code || err.message);
        CK.haptic.error();
        CK.toast(tx('profile.findableFail'), { icon: 'warning', tone: 'down' });
      }).finally(() => {
        findBusy = false;
        paintWalletRows();
      });
    }
    const bioName = (type) => {
      const apple = /^(ios|macos)$/.test((CK.tg.app && CK.tg.app.platform) || '');
      if (type === 'face' && apple) return 'Face ID';
      if (type === 'finger') return apple ? 'Touch ID' : tx('profile.bioFinger');
      return tx('profile.bioOther');
    };
    const BIO_ERRORS = { biometric_denied: 'swapSheet.bioDenied', biometric_lost: 'wallet.lost', biometric_unknown: 'wallet.bioWait' };
    let bioBusy = false;
    function switchBio(on, ctl, sw) {
      if (bioBusy) return ctl.set(!on);
      bioBusy = true;
      sw.disabled = true;
      CK.wallet.useBiometrics(on).then(() => CK.haptic.success(), (err) => {
        if (CK.wallet.isRejection(err)) return;
        console.error(err);
        CK.haptic.error();
        if (err.code === 'biometric_denied') CK.wallet.openBiometricSettings();
        CK.toast(tx(BIO_ERRORS[err.code] || 'wallet.unlockFail'), { icon: 'warning', tone: 'down' });
      }).finally(() => {
        bioBusy = false;
        paintWalletRows();
      });
    }
    CK.paintProfile(screen.el);
    nameFallback();
    walletMore.addEventListener('click', (e) => {
      if (e.target.closest('#row-words')) DemoWalletSetup.openImport(true);
    });
    walletGroup.addEventListener('click', (e) => {
      if (e.target.closest('#row-wallet')) openWalletInfo();
    });
    const bonusRow = $('#row-bonus', body);
    if (bonusRow) bonusRow.addEventListener('click', (e) => openBonus(e.currentTarget));
    const chequesRow = $('#row-cheques', body);
    chequesRow.addEventListener('click', (e) => DemoCheques.openList(e.currentTarget, stacks.profile));
    $('#row-invoices', body).addEventListener('click', (e) => DemoInvoices.openList(e.currentTarget, stacks.profile));
    const paintChequeCount = (n) => { $('[data-cheques-count]', chequesRow).textContent = n ? String(n) : ''; };
    DemoCheques.onCount(paintChequeCount);
    CK.wallet.ready.then(() => {
      if (DemoCheques.isSample() || T.wallet) DemoCheques.loadCount().catch(() => null);
    });
    $('#row-alerts', body).addEventListener('click', (e) => openAlerts(e.currentTarget));
    $('#row-fees', settings).addEventListener('click', (e) => DemoFees.openFees(e.currentTarget, stacks.profile));
    $('#row-forget', settings).addEventListener('click', () => {
      inviteStale = true;
      inviteEra += 1;
      inviteJob = null;
      DemoFees.openForget();
    });
    const howto = $('#row-howto', settings);
    if (howto) howto.addEventListener('click', () => { CK.haptic.selection(); DemoWelcome.open(); });
    const payoutsGroup = $('#profile-payouts', body);
    function paintPayoutsRow() {
      if (!invite || !invite.payouts) return;
      let row = $('#row-payouts', payoutsGroup);
      if (!row) {
        payoutsGroup.innerHTML = tileCell({ id: 'row-payouts', icon: 'gift', tone: 'orange', key: 'payouts.row', value: '<span data-payouts-total></span>' });
        payoutsGroup.hidden = false;
        row = $('#row-payouts', payoutsGroup);
        row.addEventListener('click', () => DemoPayouts.open(paintPayoutsRow));
      }
      const last = DemoPayouts.last;
      $('[data-payouts-total]', row).textContent = last ? DemoPayouts.gramText(last.total) : '';
    }
    loadInvite().then((mine) => {
      if (!mine || !mine.payouts) return;
      paintPayoutsRow();
      DemoPayouts.load().then(paintPayoutsRow, (err) => console.error(err));
    }, () => {});
    CK.i18n.bind(payoutsGroup, paintPayoutsRow);
    T.onWallet(paintWalletRows);
    let profileShown = !!T.wallet;
    const showProfile = () => {
      if (profileShown) return;
      profileShown = true;
      body.style.visibility = '';
    };
    if (!profileShown) {
      body.style.visibility = 'hidden';
      setTimeout(showProfile, 1500);
    }
    CK.wallet.ready.then(() => { paintWalletRows(); showProfile(); }, showProfile);
    CK.market.me().then((user) => {
      if (user) showUser(user);
      nameFallback();
    });
    CK.toggle($('#sw-haptic', settings), { label: tr('profile.haptic'), value: CK.haptic.enabled, onChange(v) { CK.haptic.enabled = v; } });
    CK.i18n.bind(screen.el, () => {
      $('#row-lang [data-value]', settings).textContent = CK.i18n.name;
      $('#row-currency [data-value]', settings).textContent = currencySign();
      $$('[data-theme-value]', settings).forEach((n) => { n.textContent = tx('theme.' + themeMode); });
      nameFallback();
      paintWalletRows();
    });

    $('#row-theme', settings).addEventListener('click', openThemeSheet);
    $('#row-lang', settings).addEventListener('click', () => {
      CK.sheet.open({
        title: tr('profile.lang'),
        build(b, sheet) {
          b.innerHTML = `<div class="sheet-list">${CK.i18n.LANGS.map((l) => `
            <button class="cell press-row ${CK.i18n.lang === l.id ? 'is-selected' : ''}" type="button" data-lang="${l.id}"><span class="cell-main"><span class="cell-title">${l.name}</span></span>${icon('check', { size: 20, className: 'cell-check' })}</button>`).join('')}</div>`;
          b.addEventListener('click', (ev) => {
            const row = ev.target.closest('[data-lang]');
            if (!row) return;
            CK.haptic.selection();
            CK.i18n.set(row.dataset.lang);
            $$('.cell', b).forEach((n) => n.classList.toggle('is-selected', n === row));
            sheet.close();
          });
        }
      });
    });
    $('#row-currency', settings).addEventListener('click', () => {
      CK.sheet.open({
        title: tr('profile.currency'),
        build(b, sheet) {
          b.innerHTML = `<div class="sheet-list">${CK.currency.LIST.map((code) => `
            <button class="cell press-row ${CK.currency.code === code ? 'is-selected' : ''}" type="button" data-currency="${code}"><span class="cell-main"><span class="cell-title">${tx('currency.' + code)}</span></span>${icon('check', { size: 20, className: 'cell-check' })}</button>`).join('')}</div>`;
          b.addEventListener('click', (ev) => {
            const row = ev.target.closest('[data-currency]');
            if (!row) return;
            CK.haptic.selection();
            CK.currency.set(row.dataset.currency);
            $$('.cell', b).forEach((n) => n.classList.toggle('is-selected', n === row));
            sheet.close();
          });
        }
      });
    });
    makeStack('profile', screen);
    body.removeChild(settings);
    function openSettings(btn) {
      if (stacks.profile.depth > 1) return;
      CK.haptic.selection();
      const page = CK.screen({ title: tr('profile.settings'), className: 'screen--settings' });
      page.body.appendChild(settings);
      stacks.profile.push(page, { returnFocus: btn });
    }
    return body;
  }

  function openKit(from) {
    const screen = buildKit();
    stacks.profile.push(screen, { returnFocus: from });
    screen.startPanel();
  }
  function buildKit() {
    const screen = CK.screen({ title: 'Набор' });
    screen.el.classList.add('no-tabbar');
    const sections = [
      { value: 'nav', label: 'Навигация' }, { value: 'sliders', label: 'Слайдеры' },
      { value: 'cards', label: 'Карточки' }, { value: 'icons', label: 'Иконки' }
    ];
    const hashPart = location.hash.split('-')[1];
    const firstSection = sections.some((s) => s.value === hashPart) ? hashPart : 'nav';
    const btc = D.byId.btc, ton = D.byId.ton, sol = D.byId.sol, eth = D.byId.eth;
    const SAMPLE_USD = 12000;
    const coinIcons = Object.keys(CK.ICONS);
    const tones = ['blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'gray', 'ink'];
    const toneIcons = ['wallet', 'layers', 'gift', 'flame', 'bell', 'bolt', 'star', 'shield', 'globe', 'gear', 'trade'];

    screen.body.innerHTML = `
      <div class="screen-pad"><div id="kit-sections"></div></div>

      <div class="kit-panel" data-panel="nav">
        ${sectionHtml('Таб-бар', `<div class="screen-pad"><div class="kit-box"><div id="kit-tabbar" class="tabbar--static"></div></div></div>`, 'Нажмите или ведите пальцем по панели.')}
        ${sectionHtml('Сегменты', `<div class="screen-pad kit-col">
          <div id="kit-seg-trade"></div><div id="kit-seg-2"></div><div id="kit-seg-3"></div><div id="kit-seg-icons"></div><div id="kit-seg-5"></div>
        </div>`)}
        ${sectionHtml('Шапка', `<div class="screen-pad kit-col">
          <div class="hd-preview" id="kit-header"></div>
          <button class="btn btn--wide btn--tinted press" type="button" id="kit-push">Открыть экран</button>
        </div>`, 'Прокрутите пример: заголовок уходит в верхнюю строку. Назад: кнопка или свайп от левого края.')}
        ${sectionHtml('Нижний лист', `<div class="screen-pad kit-col">
          <button class="btn btn--wide btn--tinted press" type="button" id="kit-sheet-fit">По содержимому</button>
          <button class="btn btn--wide btn--tinted press" type="button" id="kit-sheet-detents">Две высоты</button>
          <button class="btn btn--wide btn--tinted press" type="button" id="kit-sheet-long">Длинный список</button>
        </div>`, 'Тяните за верх или за пустое место. Резкий свайп вниз закрывает лист.')}
        ${sectionHtml('Переключатель и поиск', `<div class="group">
          ${switchCell({ id: 'kit-switch', icon: 'bell', tone: 'red', title: 'Уведомления' })}
          <div class="cell"><label class="search" style="flex:1">${icon('search', { size: 19 })}<input id="kit-search" type="search" placeholder="Поиск" aria-label="Поиск, пример"></label></div>
        </div>`)}
        ${sectionHtml('Кнопки', `<div class="screen-pad kit-col">
          <button class="btn btn--wide press" type="button" id="kit-toast">Показать уведомление</button>
          <div class="btn-row"><button class="btn btn--buy press" type="button">Купить</button><button class="btn btn--sell press" type="button">Продать</button></div>
        </div>`)}
      </div>

      <div class="kit-panel" data-panel="sliders">
        ${sectionHtml('Сумма', `<div class="group order-form"><div class="lev-head"><span>Доступно ${fmt.usd(SAMPLE_USD)}</span><span class="lev-value" id="kit-amount-value"></span></div><div id="kit-amount"></div></div>`)}
        ${sectionHtml('Карусель с привязкой', `<div id="kit-car-1"><div class="carousel-track">${D.coins.slice(0, 7).map(cards.coin).join('')}</div></div>`)}
        ${sectionHtml('Карусель по центру', `<div class="section"><div id="kit-car-2"><div class="carousel-track">
          ${[{ label: 'Всего', value: 48210.4, pnl: 612.4, pnlPct: 1.42 }, { label: 'GRAM', value: 34960, pnl: 361.7, pnlPct: 1.04 }, { label: 'USDT', value: 13250.4, pnl: 0, pnlPct: 0 }].map(cards.balance).join('')}
        </div></div></div>`)}
        ${sectionHtml('Свайп-подтверждение', `<div class="screen-pad kit-col"><div id="kit-swipe-buy"></div><div id="kit-swipe-sell"></div><div id="kit-swipe-accent"></div></div>`, 'Отпустите раньше конца, и ползунок вернётся.')}
      </div>

      <div class="kit-panel" data-panel="cards">
        ${sectionHtml('Баланс', `<div class="screen-pad">${cards.balance({ label: 'Всего', value: 48210.4, pnl: 612.4, pnlPct: 1.42 })}</div>`)}
        ${sectionHtml('Монета', `<div id="kit-card-coin"><div class="carousel-track">${[btc, ton, sol].map(cards.coin).join('')}</div></div>`)}
        ${sectionHtml('Рынок', `<div class="group">${[btc, eth, ton].map((c) => cards.market(c)).join('')}</div>`)}
      </div>

      <div class="kit-panel" data-panel="icons">
        ${sectionHtml('Символы', `<div class="screen-pad kit-col"><div id="kit-icon-weight"></div><div id="kit-icon-fill"></div></div>
          <div class="group icon-grid" id="kit-icon-grid"></div>`, `${coinIcons.length} символов на сетке 24. Свои рисунки, скруглённые концы, три толщины.`)}
        ${sectionHtml('Плитки', `<div class="group tile-row">${[29, 40, 60, 76].map((s) => CK.tile('trade', { size: s, tone: 'blue' })).join('')}</div>
          <div class="group tile-palette">${tones.map((t, i) => CK.tile(toneIcons[i], { size: 44, tone: t })).join('')}</div>`, 'Скругление 22,5%.')}
      </div>`;

    const body = screen.body;
    const panels = $$('.kit-panel', body);
    const showPanel = (v) => panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === v));
    const inited = {};
    function initPanel(v) {
      if (inited[v]) return;
      inited[v] = true;
      PANEL_INIT[v]();
    }
    const PANEL_INIT = {
      nav() {
        CK.tabBar($('#kit-tabbar', body), {
          label: 'Пример таб-бара', value: 'a',
          items: [{ id: 'a', icon: 'portfolio', label: 'Портфель' }, { id: 'b', icon: 'trade', label: 'Торговля' }, { id: 'c', icon: tabIcon('exchange', 'swap'), label: 'Обмен' }, P2P_MODE === 'open' ? { id: 'd', icon: tabIcon('p2p', 'users'), label: 'P2P' } : { id: 'd', icon: tabIcon('tab-gift', 'gift'), label: 'Бонусы' }, { id: 'e', icon: 'tab-profile', label: 'Профиль' }]
        });
        $$('#kit-tabbar [role="tab"]', body).forEach((t) => t.removeAttribute('id'));
        CK.segmented($('#kit-seg-trade', body), { label: 'Покупка или продажа', size: 'large', value: 'buy', items: [{ value: 'buy', label: 'Купить', tone: 'buy' }, { value: 'sell', label: 'Продать', tone: 'sell' }] });
        CK.segmented($('#kit-seg-2', body), { label: 'Тип ордера', value: 'a', items: [{ value: 'a', label: 'Рыночный' }, { value: 'b', label: 'Лимитный' }] });
        CK.segmented($('#kit-seg-3', body), { label: 'Счёт', value: 'b', items: [{ value: 'a', label: 'Спот' }, { value: 'b', label: 'Фьючерсы' }, { value: 'c', label: 'Заработок' }] });
        CK.segmented($('#kit-seg-icons', body), { label: 'Вид графика', value: 'a', items: [{ value: 'a', icon: 'activity', aria: 'Линия' }, { value: 'b', icon: 'candle', aria: 'Свечи' }, { value: 'c', icon: 'bars', aria: 'Бары' }] });
        CK.segmented($('#kit-seg-5', body), { label: 'Период', size: 'small', value: '1d', items: D.FRAMES.map((f) => ({ value: f.value, label: f.label })) });
        CK.toggle($('#kit-switch', body), { label: 'Уведомления, пример', value: true });
        const headerDemo = CK.screen({ title: 'Монеты', compactTop: true, pull: false, avatar: openProfile, headExtra: STATUS_MARKET });
        headerDemo.body.innerHTML = `<div class="group">${D.coins.slice(0, 6).map((c) => cards.market(c)).join('')}</div>`;
        $('#kit-header', body).appendChild(headerDemo.el);
        $('#kit-push', body).addEventListener('click', (e) => {
          const s = CK.screen({ title: 'Новый экран', headExtra: STATUS_MARKET });
          s.el.classList.add('no-tabbar');
          s.body.innerHTML = `<div class="group">${D.coins.concat(D.coins).map((c) => cards.market(c)).join('')}</div>`;
          s.body.addEventListener('click', (ev) => {
            const row = ev.target.closest('[data-coin]');
            if (row) openCoin(D.byId[row.dataset.coin], row);
          });
          stacks.profile.push(s, { returnFocus: e.currentTarget });
        });
        $('#kit-sheet-fit', body).addEventListener('click', () => {
          infoSheet('Высота по содержимому', `
            <div class="group"><div class="order-form summary">
              <div class="summary-row">Пара<b>BTC/USDT</b></div>
              <div class="summary-row">Комиссия<b>1\u00a0%</b></div>
            </div></div>
            <button class="btn btn--wide press" type="button" data-dismiss>Готово</button>`, (b, sheet) => {
            $('[data-dismiss]', b).addEventListener('click', () => sheet.close());
          });
        });
        $('#kit-sheet-detents', body).addEventListener('click', () => coinPickerSheet('Две высоты', 'btc', () => {}));
        $('#kit-sheet-long', body).addEventListener('click', () => {
          CK.sheet.open({
            title: 'Длинный список',
            detents: [.92],
            build(b) {
              b.innerHTML = `<div class="sheet-list">${D.coins.concat(D.coins, D.coins).map((c) => cards.market(c)).join('')}</div>`;
            }
          });
        });
        $('#kit-toast', body).addEventListener('click', () => CK.toast('Ордер исполнен', { icon: 'check-circle', tone: 'up' }));
      },
      sliders() {
        const amountValue = $('#kit-amount-value', body);
        CK.roll(amountValue, fmt.usd(SAMPLE_USD * .5));
        CK.slider($('#kit-amount', body), {
          label: 'Сумма', min: 0, max: 100, step: .5, value: 50,
          format: (v) => fmt.usd(SAMPLE_USD * v / 100),
          onInput(v) { CK.roll(amountValue, fmt.usd(SAMPLE_USD * v / 100)); }
        });
        CK.carousel($('#kit-car-1', body), { label: 'Монеты' });
        CK.carousel($('#kit-car-2', body), { mode: 'cover', dots: true, label: 'Счета' });
        cards.wireBalance($('#kit-car-2', body));
        CK.swipeConfirm($('#kit-swipe-buy', body), { tone: 'buy', label: 'Смахните, чтобы купить', onConfirm() { CK.toast('Покупка подтверждена', { icon: 'check-circle', tone: 'up' }); } });
        CK.swipeConfirm($('#kit-swipe-sell', body), { tone: 'sell', label: 'Смахните, чтобы продать', onConfirm() { CK.toast('Продажа подтверждена', { icon: 'check-circle', tone: 'down' }); } });
        CK.swipeConfirm($('#kit-swipe-accent', body), { tone: 'accent', label: 'Смахните, чтобы вывести', onConfirm() { CK.toast('Вывод подтверждён', { icon: 'check-circle', tone: 'accent' }); } });
      },
      cards() {
        cards.wireBalance($('[data-panel="cards"]', body));
        CK.carousel($('#kit-card-coin', body), { label: 'Карточки монет' });
        $('[data-panel="cards"]', body).addEventListener('click', (e) => {
          if (e.target.closest('[data-demo-close]')) CK.toast('Образец: действие не выполняется', { icon: 'info', tone: 'accent' });
        });
      },
      icons() {
        const grid = $('#kit-icon-grid', body);
        let fill = false;
        const render = () => {
          grid.innerHTML = coinIcons.map((n) => `<button class="icon-cell" type="button" data-icon="${n}" aria-label="${n}">${icon(n, { fill })}</button>`).join('');
        };
        render();
        grid.addEventListener('click', (e) => {
          const b = e.target.closest('[data-icon]');
          if (b) { CK.haptic.selection(); CK.toast(b.dataset.icon, { ms: 1200 }); }
        });
        CK.segmented($('#kit-icon-weight', body), {
          label: 'Толщина линии', value: '1.75',
          items: [{ value: '1.4', label: 'Тонкие' }, { value: '1.75', label: 'Обычные' }, { value: '2.2', label: 'Жирные' }],
          onChange(v) { grid.style.setProperty('--icon-w', v); }
        });
        CK.segmented($('#kit-icon-fill', body), {
          label: 'Стиль', value: 'o',
          items: [{ value: 'o', label: 'Контур' }, { value: 'f', label: 'Заливка' }],
          onChange(v) { fill = v === 'f'; render(); }
        });
      }
    };
    CK.segmented($('#kit-sections', body), {
      label: 'Раздел набора', value: firstSection, items: sections,
      onChange(v) { showPanel(v); initPanel(v); screen.scroll.scrollTop = 0; }
    });
    showPanel(firstSection);
    screen.startPanel = () => initPanel(firstSection);
    body.addEventListener('click', (e) => {
      if (e.target.closest('#kit-push,#kit-sheet-fit,#kit-sheet-detents,#kit-sheet-long')) return;
      const row = e.target.closest('.kit-panel [data-coin]');
      if (row) openCoin(D.byId[row.dataset.coin], row);
    });
    return screen;
  }

  const tickListeners = new Set();
  function paintChange(root, c) {
    if (c.change === null) return;
    $$('[data-change]', root).forEach((el) => CK.changeTick(el, c.change));
  }
  function paintSpark(root, c) {
    $$('.spark', root).forEach((el) => {
      el.replaceWith(CK.el(CK.sparkline(c.series, { height: $('svg', el).viewBox.baseVal.height })));
    });
  }
  let rowsInView = null;
  function readRowsInView() {
    const seen = new Set();
    $$('.tab-pane.is-active > .screen:not([hidden]) [data-coin], .sheet [data-coin]').forEach((row) => {
      const r = row.getBoundingClientRect();
      if (r.width && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) seen.add(row);
    });
    rowsInView = seen;
  }
  function paintCoin(c, up, quiet) {
    const text = fmt.price(c.price);
    $$(`[data-coin="${c.id}"]`).forEach((row) => {
      if (row.hasAttribute('aria-label')) row.setAttribute('aria-label', `${c.name}, ${text}`);
      paintChange(row, c);
      const el = $('[data-price]', row);
      if (el) CK.priceTick(el, text, quiet || (rowsInView && !rowsInView.has(row)) ? null : up);
    });
    tickListeners.forEach((fn) => fn(c, quiet ? null : up));
  }

  let accountTimer = 0;
  function scheduleAccount() {
    if (accountTimer) return;
    const wait = Math.max(CK.sheet.motionLeft, CK.scrollLeft());
    const paint = () => {
      accountTimer = 0;
      if (CK.sheet.motionLeft || CK.scrollLeft()) scheduleAccount();
      else portfolio.paintValues();
    };
    accountTimer = wait ? setTimeout(paint, wait) : requestAnimationFrame(paint);
  }
  function applyTicker(id, t, quiet) {
    const c = D.byId[id];
    if (!c) return;
    const before = c.price;
    D.applyTick(c, t);
    paintCoin(c, c.price >= before, quiet);
    scheduleAccount();
  }
  const SCROLL_HOLD_MAX_MS = 3000;
  const TICK_SLICE_MS = 5;
  const heldTicks = new Map();
  let ticksQueued = false, heldAt = 0;
  function releaseTicks() {
    const scrolling = CK.scrollLeft();
    const left = Math.max(CK.sheet.motionLeft, performance.now() - heldAt < SCROLL_HOLD_MAX_MS ? scrolling : 0);
    if (left) {
      setTimeout(() => requestAnimationFrame(releaseTicks), left);
      return;
    }
    readRowsInView();
    const shown = new Set(Array.from(rowsInView, (row) => row.dataset.coin));
    const order = Array.from(heldTicks.keys()).sort((a, b) => shown.has(b) - shown.has(a));
    const sliceEnd = performance.now() + TICK_SLICE_MS;
    for (const id of order) {
      const t = heldTicks.get(id);
      heldTicks.delete(id);
      applyTicker(id, t, scrolling > 0);
      if (performance.now() >= sliceEnd) break;
    }
    rowsInView = null;
    heldAt = performance.now();
    if (heldTicks.size) requestAnimationFrame(releaseTicks);
    else ticksQueued = false;
  }
  function onTicker(id, t) {
    if (!heldTicks.size) heldAt = performance.now();
    heldTicks.set(id, t);
    if (ticksQueued) return;
    ticksQueued = true;
    requestAnimationFrame(releaseTicks);
  }

  let coinsLoaded = false;
  const sparksShown = new Map();
  function onCoins(body) {
    const first = !coinsLoaded;
    const wait = first ? 0 : Math.max(CK.sheet.motionLeft, CK.scrollLeft());
    if (wait) {
      setTimeout(() => onCoins(body), wait);
      return;
    }
    coinsLoaded = true;
    const before = new Map(D.coins.map((c) => [c.id, c.price]));
    body.coins.forEach((raw) => D.applyCoin(raw));
    if (first) trade.reloadMarket();
    if (!first) readRowsInView();
    D.coins.forEach((c) => {
      const line = c.series.join();
      if (sparksShown.get(c.id) !== line) {
        sparksShown.set(c.id, line);
        $$(`[data-coin="${c.id}"]`).forEach((row) => paintSpark(row, c));
      }
      paintCoin(c, c.price >= before.get(c.id), first);
    });
    rowsInView = null;
    portfolio.paintValues();
  }

  function randomTick() {
    if (document.hidden) return;
    const volatile = D.coins.filter((c) => c.id !== 'usdt');
    for (let n = 0; n < 2; n++) {
      const c = volatile[Math.floor(Math.random() * volatile.length)];
      CK.market.emit(c.id, { price: c.price * (1 + (Math.random() - .5) * .0016) });
    }
  }

  DemoFavorites.start();
  DemoAlerts.start();
  const trade = DemoTrade.build({
    STATUS_ACCOUNT, STATUS_MARKET, tickListeners, paintCoin, makeStack, goTab, openProfile, openCoin, shareAction, favAction, alertAction,
    currentStack: () => stacks[currentTab],
    feedInView: () => currentTab === 'trade' && stacks.trade.depth === 1,
    onViewChange: (fn) => viewChanged.push(fn),
    valuesChanged: () => portfolio.paintValues()
  });
  DemoWallet.build({ tickListeners, accountChanged: () => portfolio.refresh() });
  DemoAllocation.build({ tickListeners, hideSmall, setHideSmall });
  const portfolio = buildPortfolio();
  buildProfile();
  DemoSwap.build({ tickListeners });
  DemoNets.build({ tickListeners, paintCoin });
  onShow.trade = trade.onShow;
  mountTab('exchange', window.DemoExchange);
  const exShow = onShow.exchange;
  onShow.exchange = () => {
    portfolio.reread();
    if (exShow) exShow();
  };
  if (P2P_MODE === 'open') mountTab('p2p', window.DemoP2P || lazyP2P());
  else mountTab('bonus', window.DemoBonus, { invite: invitePart });
  const shared = readShareCode(CK.tg.startParam) || readShareCode(CK.tg.launchSearch.get('coin') || '');
  if (shared && currentTab !== 'trade') {
    currentTab = 'trade';
    tabBar.select('trade', true);
  }
  showTab(currentTab);
  if (location.hash.startsWith('#kit')) CK.market.ready.then(() => { if (CK.market.mode !== 'live') openKit(); });
  CK.market.onTicker(onTicker);
  CK.market.onCoins(onCoins);
  CK.market.ready.then(() => {
    if (CK.market.mode === 'demo') setInterval(randomTick, 2400);
  });

  const panel = $('#stage-panel');
  CK.segmented($('#stage-width', panel), {
    label: tr('stage.widthAria'), value: '390', size: 'small',
    items: [{ value: '390', label: '390' }, { value: '360', label: '360' }, { value: '320', label: '320' }],
    onChange(v) { document.documentElement.style.setProperty('--device-w', v + 'px'); }
  });
  themeSegment($('#stage-theme', panel), 'small');
  const presetCtl = CK.segmented($('#stage-preset', panel), {
    label: tr('profile.tgColors'), value: presetId, size: 'small',
    items: [{ value: 'ios', label: 'iOS' }, { value: 'day', label: tr('stage.day') }, { value: 'night', label: tr('stage.night') }, { value: 'violet', label: tr('stage.own') }],
    onChange(v) { applyPreset(v, presetCtl); }
  });
  presetControls.push(presetCtl);
  if (themeMode !== 'auto') applyTheme(themeMode);
  if (presetId !== 'ios' && !CK.tg.inside) applyPreset(presetId);

  const sellLink = T.rawAddress(new URLSearchParams(location.search).get('sell') || '');
  if (sellLink) {
    launchSheetPending = true;
    Promise.all([CK.wallet.ready, T.config()]).then(async ([, settings]) => {
      if (settings.state !== 'open' || !T.wallet || T.wallet.readOnly) return;
      const { balances } = await T.api('wallet/balances?address=' + encodeURIComponent(T.wallet.address));
      const row = balances.find((one) => T.rawAddress(one.token) === sellLink);
      if (row) DemoSwap.open(null, 'sell', { id: sellLink, sym: row.symbol, name: row.name, logo: row.logo, decimals: row.decimals });
    }).catch((err) => console.error(err)).then(() => { launchSheetPending = false; });
  }

  if (shared) {
    const launchTab = 'trade';
    const COIN_WAIT_MS = 4000;
    const coinIn = (c) => (coinsLoaded || c.priced ? Promise.resolve(c) : CK.market.ready.then(() => (CK.market.mode !== 'live' || coinsLoaded ? c : new Promise((res) => {
      const off = CK.market.onCoins(() => { off(); clearTimeout(timer); res(c); });
      const timer = setTimeout(() => { off(); res(c); }, COIN_WAIT_MS);
    }))));
    const target = shared.coin ? coinIn(shared.coin) : CK.market.tokenItem(shared.id).then(({ token }) => D.instrumentOf(token));
    target.then((inst) => {
      if (CK.sheet.top || currentTab !== launchTab || stacks[currentTab].depth > 1) return;
      if (inst.isToken) trade.openHeldToken(inst.id);
      else openCoin(inst);
    }).catch((err) => {
      const missing = !!err && err.message === 'not_found';
      if (!missing) console.error(err);
      if (currentTab !== launchTab || CK.sheet.top) return;
      CK.toast(tx(missing ? 'token.notFound' : 'common.loadFail'), { icon: 'warning', tone: 'down' });
    });
  }

  const chequeCode = CK.tg.startParam;
  const invoiceId = DemoInvoices.codeOf(chequeCode);
  if (invoiceId) {
    launchSheetPending = true;
    CK.wallet.ready.catch(() => null).then(() => {
      launchSheetPending = false;
      DemoInvoices.openPay(invoiceId);
    });
  } else if (CK.tg.launchSearch.get('invoice') === 'demo') {
    CK.market.ready.then(() => { if (DemoInvoices.isSample()) DemoInvoices.openPay(null, true); });
  } else if (CK.cheques.parseStart(chequeCode)) {
    launchSheetPending = true;
    CK.wallet.ready.catch(() => null).then(() => {
      launchSheetPending = false;
      if (CK.chequeAudit.parseLink(chequeCode)) DemoCheques.openClaim(chequeCode);
      else CK.toast(tx('cheque.badLink'), { icon: 'warning', tone: 'down' });
    });
  } else if (CK.tg.launchSearch.get('send')) {
    CK.wallet.ready.catch(() => null).then(() => DemoCheques.openFromInline(CK.tg.launchSearch.get('send')));
  } else if (launchView && LAUNCH_VIEWS[launchView].open) {
    launchSheetPending = true;
    CK.wallet.ready.catch(() => null).then(() => {
      launchSheetPending = false;
      if (CK.sheet.top || currentTab !== LAUNCH_VIEWS[launchView].tab) return;
      const status = CK.wallet.status || {};
      if (status.kind === 'none') return;
      try {
        LAUNCH_VIEWS[launchView].open();
      } catch (err) {
        console.error(err);
      }
    });
  } else if (/^(demo|gift|multi)$/.test(CK.tg.launchSearch.get('cheque') || '')) {
    CK.market.ready.then(() => { if (DemoCheques.isSample()) DemoCheques.openClaim(null, CK.tg.launchSearch.get('cheque')); });
  }
  const p2pLink = new URLSearchParams(location.search).has('p2p');

  const linkOpens = !!(launchView || shared || sellLink || invoiceId || p2pLink || CK.cheques.parseStart(chequeCode) || ['send', 'invoice', 'cheque'].some((key) => CK.tg.launchSearch.get(key)));
  if (!linkOpens && !location.hash.startsWith('#kit') && window.DemoWelcome && typeof DemoWelcome.maybeShow === 'function') {
    Promise.resolve().then(() => DemoWelcome.maybeShow()).catch((err) => console.error(err));
  }

  (function syncBotPrefs() {
    if (/^k_/i.test(CK.tg.startParam || '')) return;
    const KEY = 'ck-bot-prefs';
    let sending = false;
    const wanted = () => ({ lang: CK.i18n.lang, currency: CK.currency.code });
    const sent = () => {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; }
    };
    const same = (a, b) => !!a && !!b && a.lang === b.lang && a.currency === b.currency;
    function sync() {
      const want = wanted();
      if (sending || same(sent(), want)) return;
      sending = true;
      CK.market.ready
        .then(() => (CK.market.mode === 'live' ? CK.tg.whenInitData() : ''))
        .then((initData) => {
          if (!initData) return false;
          return fetch('api/bot/prefs', { method: 'POST', headers: { Authorization: 'tma ' + initData, 'Content-Type': 'application/json' }, body: JSON.stringify(want), cache: 'no-store' })
            .then((res) => {
              if (!res.ok) return false;
              try { localStorage.setItem(KEY, JSON.stringify(want)); } catch (_) { }
              return true;
            });
        })
        .catch(() => false)
        .then((ok) => {
          sending = false;
          if (ok && !same(wanted(), want)) sync();
        });
    }
    sync();
    CK.i18n.on(sync);
  })();

  const inviteLink = () => (invite && !inviteStale ? INVITE_LINK + invite.code : null);
  window.DemoApp = {
    goTab, applyTheme, applyPreset, inviteLink, invite: invitePart, p2pMode: P2P_MODE,
    loadP2P: P2P_MODE === 'open' ? loadP2P : null,
    openP2PMine: P2P_MODE === 'open' ? (dealId) => {
      if (CK.sheet.top) CK.sheet.top.close();
      return openP2PTab(dealId);
    } : null
  };
});
