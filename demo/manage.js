(function () {
  'use strict';
  const { icon, t: tx } = CK;
  const T = CK.ton;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = CK.esc;
  const W = () => window.DemoWallet;

  CK.i18n.add({
    'manage.open': ['Управление', 'Manage', 'Керування', 'Басқару'],
    'manage.assets': ['Активы', 'Assets', 'Активи', 'Активтер'],
    'manage.pinned': ['Закреплённые', 'Pinned', 'Закріплені', 'Бекітілгендер'],
    'manage.all': ['Все активы', 'All assets', 'Усі активи', 'Барлық активтер'],
    'manage.pin': ['Закрепить', 'Pin', 'Закріпити', 'Бекіту'],
    'manage.unpin': ['Открепить', 'Unpin', 'Відкріпити', 'Босату'],
    'manage.hide': ['Скрыть', 'Hide', 'Приховати', 'Жасыру'],
    'manage.show': ['Показать', 'Show', 'Показати', 'Көрсету'],
    'manage.move': ['Переместить', 'Reorder', 'Перемістити', 'Орнын ауыстыру'],
    'manage.allHidden': ['Все активы скрыты', 'All assets are hidden', 'Усі активи приховані', 'Барлық активтер жасырылған'],
    'history.sent': ['Отправлено', 'Sent', 'Надіслано', 'Жіберілді'],
    'history.received': ['Получено', 'Received', 'Отримано', 'Алынды'],
    'history.swaps': ['Обмены', 'Swaps', 'Обміни', 'Айырбастар'],
    'history.spamNote': ['Похоже на спам. Ничего не отправляйте на этот адрес', 'Looks like spam. Send nothing to this address', 'Схоже на спам. Нічого не надсилайте на цю адресу', 'Спамға ұқсайды. Бұл мекенжайға ештеңе жібермеңіз'],
    'month.1': ['Январь', 'January', 'Січень', 'Қаңтар'],
    'month.2': ['Февраль', 'February', 'Лютий', 'Ақпан'],
    'month.3': ['Март', 'March', 'Березень', 'Наурыз'],
    'month.4': ['Апрель', 'April', 'Квітень', 'Сәуір'],
    'month.5': ['Май', 'May', 'Травень', 'Мамыр'],
    'month.6': ['Июнь', 'June', 'Червень', 'Маусым'],
    'month.7': ['Июль', 'July', 'Липень', 'Шілде'],
    'month.8': ['Август', 'August', 'Серпень', 'Тамыз'],
    'month.9': ['Сентябрь', 'September', 'Вересень', 'Қыркүйек'],
    'month.10': ['Октябрь', 'October', 'Жовтень', 'Қазан'],
    'month.11': ['Ноябрь', 'November', 'Листопад', 'Қараша'],
    'month.12': ['Декабрь', 'December', 'Грудень', 'Желтоқсан']
  });

  const motion = () => window.CK && CK.motion ? CK.motion : null;


  const PREFS_PREFIX = 'ck-assets:';
  const PREFS_MAX = 300;
  const keyOf = (h) => `${h.coin.id}${h.net ? '@' + h.net : ''}`;
  const cleanKeys = (list) => (Array.isArray(list) ? Array.from(new Set(list.filter((k) => typeof k === 'string' && k.length > 0 && k.length <= 200))).slice(0, PREFS_MAX) : []);
  const memo = new Map();
  function prefsOf(address) {
    if (!address) return { pin: [], hide: [], show: [] };
    if (memo.has(address)) return memo.get(address);
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(PREFS_PREFIX + address) || 'null'); } catch (_) { raw = null; }
    const p = { pin: cleanKeys(raw && raw.pin), hide: cleanKeys(raw && raw.hide), show: cleanKeys(raw && raw.show) };
    memo.set(address, p);
    return p;
  }
  function savePrefs(address, p) {
    const next = { pin: cleanKeys(p.pin), hide: cleanKeys(p.hide), show: cleanKeys(p.show) };
    memo.set(address, next);
    try { localStorage.setItem(PREFS_PREFIX + address, JSON.stringify(next)); } catch (_) { }
    return next;
  }
  const quietByDefault = (h) => h.risk === 'suspicious' || (!!h.coin.isToken && !h.priced && h.net !== 'Tron');
  const flagged = (h) => h.risk === 'suspicious';
  function hiddenBy(p, h) {
    const k = keyOf(h);
    if (!flagged(h) && p.pin.includes(k)) return false;
    if (p.hide.includes(k)) return true;
    if (p.show.includes(k)) return false;
    return quietByDefault(h);
  }
  const pinnedBy = (p, h) => !flagged(h) && p.pin.includes(keyOf(h));
  function arrange(holdings, address, opts) {
    const p = prefsOf(address);
    const small = !!(opts && opts.small);
    const pinned = [], rest = [];
    let hidden = 0;
    holdings.forEach((h) => {
      if (hiddenBy(p, h)) {
        hidden += 1;
        return;
      }
      if (pinnedBy(p, h)) pinned.push(h);
      else if (!(small && h.priced && h.usd < 1)) rest.push(h);
    });
    pinned.sort((a, b) => p.pin.indexOf(keyOf(a)) - p.pin.indexOf(keyOf(b)));
    return { rows: pinned.concat(rest), hidden };
  }


  function openManage(ctx) {
    if (CK.sheet.top || !ctx || !ctx.address) return;
    const address = ctx.address;
    const nameHtml = (h) => (flagged(h) ? `<span>${esc(tx('portfolio.unknownToken'))}</span>` : `<span>${esc(h.coin.name)}</span>`);
    const amountText = (h) => `${D.qty(h.amount)}${flagged(h) ? '' : ' ' + h.coin.sym}`;
    const pinBtn = (on) => `<button class="mg-btn mg-pin${on ? ' is-on' : ''}" type="button" data-act="pin" aria-pressed="${on}" aria-label="${esc(tx(on ? 'manage.unpin' : 'manage.pin'))}">${icon('pin', { size: 22, fill: on })}</button>`;
    const eyeBtn = (shown) => `<button class="mg-btn mg-eye${shown ? ' is-on' : ''}" type="button" data-act="eye" aria-pressed="${!shown}" aria-label="${esc(tx(shown ? 'manage.hide' : 'manage.show'))}">${icon(shown ? 'eye' : 'eye-off', { size: 22 })}</button>`;
    function rowHtml(h, kind, p) {
      const k = keyOf(h);
      const shown = !hiddenBy(p, h);
      const tail = kind === 'pinned'
        ? pinBtn(true) + `<button class="mg-btn mg-drag" type="button" data-act="drag" aria-label="${esc(tx('manage.move'))}">${icon('drag', { size: 22 })}</button>`
        : (flagged(h) ? '' : pinBtn(false)) + eyeBtn(shown);
      return `<div class="cell mg-row${shown ? '' : ' is-off'}" data-key="${esc(k)}">
          <span class="mg-logo">${ctx.logo ? ctx.logo(h) : CK.coinLogo(h.coin, 40)}</span>
          <span class="cell-main mg-main"><b class="mg-name">${nameHtml(h)}</b><span class="mg-amount">${esc(amountText(h))}</span></span>
          <span class="mg-tail">${tail}</span>
        </div>`;
    }
    let off = null;
    const app = document.getElementById('app');
    const room = Math.round((app ? app.clientHeight : 700) * .72);
    const wanted = 84 + 2 * 38 + 24 + 20 + 64 * Math.max(1, ctx.holdings().length);
    CK.sheet.open({
      title: () => tx('manage.open'),
      detents: [CK.sheet.fixedDetent(Math.min(room, wanted) + (CK.sheet.safeBottom ? CK.sheet.safeBottom() : 0))],
      build(body) {
        body.classList.add('mg-body');
        body.innerHTML = `
          <section class="mg-sec" data-sec="pinned"><h3 class="mg-head" ${CK.i18n.L('manage.pinned')}>${esc(tx('manage.pinned'))}</h3><div class="group mg-list" data-list="pinned"></div></section>
          <section class="mg-sec" data-sec="all"><h3 class="mg-head" ${CK.i18n.L('manage.all')}>${esc(tx('manage.all'))}</h3><div class="group mg-list" data-list="all"></div></section>`;
        const pinnedSec = $('[data-sec="pinned"]', body), allSec = $('[data-sec="all"]', body);
        const pinnedList = $('[data-list="pinned"]', body), allList = $('[data-list="all"]', body);
        let rowsNow = [];
        function paint() {
          const p = prefsOf(address);
          rowsNow = ctx.holdings();
          const pinned = rowsNow.filter((h) => pinnedBy(p, h)).sort((a, b) => p.pin.indexOf(keyOf(a)) - p.pin.indexOf(keyOf(b)));
          const rest = rowsNow.filter((h) => !pinnedBy(p, h));
          pinnedSec.hidden = !pinned.length;
          allSec.hidden = !rest.length;
          pinnedList.innerHTML = pinned.map((h) => rowHtml(h, 'pinned', p)).join('');
          allList.innerHTML = rest.map((h) => rowHtml(h, 'all', p)).join('');
          const m = motion();
          if (m) {
            m.rows(pinnedList);
            m.rows(allList);
          }
        }
        const find = (k) => rowsNow.find((h) => keyOf(h) === k);
        function change(fn) {
          const p = prefsOf(address);
          const next = { pin: p.pin.slice(), hide: p.hide.slice(), show: p.show.slice() };
          fn(next);
          savePrefs(address, next);
          CK.haptic.selection();
          paint();
          if (ctx.onChange) ctx.onChange();
        }
        const drop = (list, k) => { const at = list.indexOf(k); if (at >= 0) list.splice(at, 1); };
        body.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-act]');
          if (!btn || btn.dataset.act === 'drag') return;
          const row = btn.closest('[data-key]');
          const h = row && find(row.dataset.key);
          if (!h) return;
          const k = keyOf(h);
          if (btn.dataset.act === 'pin') {
            if (flagged(h)) return;
            change((p) => {
              if (p.pin.includes(k)) drop(p.pin, k);
              else {
                p.pin.push(k);
                drop(p.hide, k);
                if (quietByDefault(h)) p.show.push(k);
              }
            });
          } else if (btn.dataset.act === 'eye') {
            const shown = !hiddenBy(prefsOf(address), h);
            change((p) => {
              drop(p.hide, k);
              drop(p.show, k);
              if (shown) {
                drop(p.pin, k);
                if (!quietByDefault(h)) p.hide.push(k);
              } else if (quietByDefault(h)) p.show.push(k);
            });
          }
        });
        function reorder(from, to) {
          if (from === to) return;
          change((p) => {
            const order = $$('.mg-row', pinnedList).map((r) => r.dataset.key);
            const [k] = order.splice(from, 1);
            order.splice(to, 0, k);
            p.pin = order.concat(p.pin.filter((x) => !order.includes(x)));
          });
        }
        wireDrag(pinnedList, reorder);
        pinnedList.addEventListener('keydown', (e) => {
          const handle = e.target.closest('.mg-drag');
          if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
          e.preventDefault();
          const rows = $$('.mg-row', pinnedList);
          const from = rows.indexOf(handle.closest('.mg-row'));
          const to = Math.max(0, Math.min(rows.length - 1, from + (e.key === 'ArrowUp' ? -1 : 1)));
          if (to === from) return;
          const k = rows[from].dataset.key;
          reorder(from, to);
          const again = $(`.mg-row[data-key="${CSS.escape(k)}"] .mg-drag`, pinnedList);
          if (again) again.focus();
        });
        const m = motion();
        if (m && m.quiet) m.quiet(paint);
        else paint();
        off = D.onBalances(() => { if (body.isConnected && !pinnedList.classList.contains('is-dragging')) paint(); });
      },
      onClose() { if (off) off(); }
    });
  }

  function wireDrag(list, done) {
    ['touchstart', 'touchmove'].forEach((type) => list.addEventListener(type, (e) => { if (e.target.closest('.mg-drag')) e.stopPropagation(); }, { passive: true }));
    list.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest('.mg-drag');
      if (!handle || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const row = handle.closest('.mg-row');
      const rows = $$('.mg-row', list);
      if (!row || rows.length < 2) return;
      e.preventDefault();
      e.stopPropagation();
      const from = rows.indexOf(row);
      const tops = rows.map((r) => r.offsetTop);
      const height = row.offsetHeight;
      const bottoms = rows.map((r, i) => tops[i] + r.offsetHeight);
      const minDy = tops[0] - tops[from], maxDy = tops[rows.length - 1] - tops[from];
      const y0 = e.clientY;
      let at = from, dy = 0;
      try { handle.setPointerCapture(e.pointerId); } catch (_) { }
      list.classList.add('is-dragging');
      row.classList.add('is-lifted');
      CK.haptic.light();
      function move(ev) {
        dy = Math.max(minDy, Math.min(maxDy, ev.clientY - y0));
        row.style.transform = `translate3d(0, ${dy}px, 0)`;
        const centre = tops[from] + height / 2 + dy;
        let next = rows.length - 1;
        for (let i = 0; i < rows.length; i++) {
          if (centre < bottoms[i]) {
            next = i;
            break;
          }
        }
        if (next !== at) {
          at = next;
          CK.haptic.selection();
          rows.forEach((r, i) => {
            if (r === row) return;
            const shift = from < at && i > from && i <= at ? -height : from > at && i >= at && i < from ? height : 0;
            r.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : '';
          });
        }
      }
      function end() {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        handle.removeEventListener('lostpointercapture', end);
        const lifted = row.getBoundingClientRect().top;
        list.classList.remove('is-dragging');
        rows.forEach((r) => { r.style.transform = ''; });
        row.classList.remove('is-lifted');
        if (at !== from) done(from, at);
        const now = $(`.mg-row[data-key="${CSS.escape(row.dataset.key)}"]`, list);
        if (now && now.animate && !CK.reducedMotion()) {
          const by = lifted - now.getBoundingClientRect().top;
          if (Math.abs(by) > 1) now.animate([{ transform: `translate3d(0, ${by}px, 0)` }, { transform: 'none' }], { duration: 420, easing: motion() ? motion().springEasing(170, 26.077) : 'ease-out' });
        }
      }
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
      handle.addEventListener('lostpointercapture', end);
    });
  }


  const HISTORY_FILL = 10;
  const HISTORY_PAGES_MAX = 6;
  const DUST_NANO = 10000000n;
  const EXPLORER = 'https://tonviewer.com/';
  const HEX_HASH = /^[0-9a-f]{64}$/i;
  const PAID_KEY = 'ck-sent-to:';
  function paidAddresses(wallet) {
    try {
      const list = JSON.parse(localStorage.getItem(PAID_KEY + wallet) || '[]');
      return Array.isArray(list) ? list.filter((a) => typeof a === 'string') : [];
    } catch (_) {
      return [];
    }
  }
  const FILTERS = [
    { value: 'all', key: 'filter.all', empty: 'walletFlow.emptyAll' },
    { value: 'out', key: 'history.sent', empty: 'history.emptyOut' },
    { value: 'in', key: 'history.received', empty: 'history.emptyIn' },
    { value: 'swap', key: 'history.swaps', empty: 'history.emptySwap' }
  ];
  const sideText = (sign, s) => `${sign}${D.qty(T.fromUnits(s.units, s.decimals))} ${s.sym}`;
  const sideParts = (sign, s) => ({ amount: sideText(sign, s), num: `${sign}${D.qty(T.fromUnits(s.units, s.decimals))}`, sym: String(s.sym || '') });
  const shortOf = (raw) => {
    try { return T.shortAddress(T.friendlyAddress(raw)); } catch (_) { return ''; }
  };
  function describe(e) {
    if (e.kind === 'swap') return { icon: 'exchange', kind: 'swap', title: tx('action.swap'), full: tx('tx.exchangeFull', { from: e.gave.sym, to: e.got.sym }), ...sideParts('+', e.got), sub: `${e.gave.sym} → ${e.got.sym}`, up: true };
    if (e.kind === 'in') return { icon: 'deposit', kind: 'in', title: tx('history.received'), full: tx('tx.depositFull', { sym: e.sym }), ...sideParts('+', e), sub: shortOf(e.counterparty), up: true };
    if (window.DemoCheques && DemoCheques.isCheque(e.counterparty)) return { icon: 'gift', kind: 'out', title: tx('cheque.row'), full: tx('cheque.row'), ...sideParts('−', e), sub: '', up: false };
    return { icon: 'withdraw', kind: 'out', title: tx('history.sent'), full: tx('tx.withdrawFull', { sym: e.sym }), ...sideParts('−', e), sub: shortOf(e.counterparty), up: false };
  }
  const ROW_FITS = [[], ['is-snug'], ['is-tight'], ['is-tight', 'is-snug'], ['is-tight', 'is-small']];
  const cutIn = (row, sel) => {
    const t = row.querySelector(sel);
    return !!t && t.clientWidth > 0 && t.scrollWidth > t.clientWidth;
  };
  function subHtml(d) {
    const at = d.kind === 'swap' ? -1 : d.sub.indexOf('…');
    if (at <= 0) return esc(d.sub);
    return `<span class="hs-sub-head">${esc(d.sub.slice(0, at))}</span><span class="hs-sub-tail">${esc(d.sub.slice(at))}</span>`;
  }
  function fitHistoryRows(rows) {
    const all = Array.from(rows);
    all.forEach((row) => row.classList.remove('is-snug', 'is-small', 'is-tight', 'is-brief'));
    let left = all;
    for (let i = 0; i < ROW_FITS.length && left.length; i++) {
      if (i) left.forEach((row) => { row.classList.remove('is-snug', 'is-small', 'is-tight'); ROW_FITS[i].forEach((c) => row.classList.add(c)); });
      left = left.filter((row) => cutIn(row, '.hs-title'));
    }
    all.filter((row) => row.querySelector('.hs-sub-head') && cutIn(row, '.hs-sub')).forEach((row) => row.classList.add('is-brief'));
  }
  const stateWord = (e) => (e.pending ? tx('walletFlow.pending') : e.failed ? tx('walletFlow.failed') : '');
  function flaggedTokens() {
    const out = new Set();
    try {
      (D.balancesKnown ? D.holdings() : []).forEach((h) => {
        if (h.risk === 'suspicious' && h.coin.token && h.coin.token.address) out.add(T.rawAddress(h.coin.token.address));
      });
    } catch (_) { }
    return out;
  }
  function fakeToken(e, flaggedSet) {
    if (e.kind === 'swap' || !e.token || e.token === 'ton') return false;
    if (flaggedSet.has(e.token)) return true;
    const known = CK.swapAudit && typeof CK.swapAudit.swappable === 'function' && CK.swapAudit.swappable(e.token);
    return !known && !!(CK.market && CK.market.passesForCoin && CK.market.passesForCoin(e.sym));
  }
  function intake(rows) {
    const clean = W().cleanEvents(rows);
    const kept = new Set(clean.map((e) => e.key));
    const incoming = new Map();
    const flipped = (Array.isArray(rows) ? rows : []).map((row) => {
      if (!row || !Array.isArray(row.actions)) return row;
      return {
        ...row,
        actions: row.actions.map((a, i) => {
          if (!a || a.kind !== 'in') return a;
          incoming.set(`${row.id}:${i}`, a.status !== 'ok');
          return { ...a, kind: 'out', status: 'ok' };
        })
      };
    });
    const spam = W().cleanEvents(flipped)
      .filter((e) => !kept.has(e.key) && incoming.has(e.key))
      .map((e) => ({ ...e, kind: 'in', failed: incoming.get(e.key), spam: true }));
    return clean.concat(spam);
  }
  const monthKey = (at) => { const d = new Date(at); return `${d.getFullYear()}-${d.getMonth() + 1}`; };
  function monthName(at) {
    const d = new Date(at);
    const name = tx('month.' + (d.getMonth() + 1));
    return d.getFullYear() === new Date().getFullYear() ? name : `${name} ${d.getFullYear()}`;
  }
  const whenText = (at) => `${CK.i18n.dayShort ? CK.i18n.dayShort(at) : CK.i18n.dayMonth(at)}, ${CK.i18n.clock(at)}`;
  const txIdOf = (e) => (e.id && e.id !== 'undefined' && e.id !== 'null' ? String(e.id) : String(e.key));
  function historyBlocks(list) {
    const months = [];
    const byMonth = new Map();
    (Array.isArray(list) ? list : []).forEach((e, i) => {
      const k = monthKey(e.at);
      let month = byMonth.get(k);
      if (!month) {
        month = { k, at: e.at, blocks: [], byId: new Map() };
        byMonth.set(k, month);
        months.push(month);
      }
      const id = txIdOf(e);
      let block = month.byId.get(id);
      if (!block) {
        block = { id, rows: [] };
        month.byId.set(id, block);
        month.blocks.push(block);
      }
      block.rows.push({ e, i });
    });
    return months.map(({ k, at, blocks }) => ({ k, at, blocks }));
  }

  function historyStep(opts) {
    const o = opts || {};
    const wallet = T.wallet.address;
    const token = o.token ? (o.token === 'ton' ? 'ton' : T.rawAddress(o.token)) : null;
    const seen = new Set();
    const st = { filter: 'all', items: [], next: null, started: false, ended: false, loading: false, failed: false, pages: 0, scroll: 0 };
    const touches = (e) => !token || (e.kind === 'swap' ? e.gave.token === token || e.got.token === token : e.token === token);
    function lists() {
      const flaggedSet = flaggedTokens();
      const mine = st.items.filter(touches);
      const spamNow = new Set();
      const plain = [];
      mine.forEach((e) => {
        if (e.spam || fakeToken(e, flaggedSet) || (e.kind === 'in' && e.token === 'ton' && e.units < DUST_NANO)) spamNow.add(e);
        else plain.push(e);
      });
      const clean = W().withoutPoison(plain);
      const kept = new Set(clean);
      plain.forEach((e) => { if (!kept.has(e)) spamNow.add(e); });
      return { clean, spam: mine.filter((e) => spamNow.has(e)) };
    }
    return {
      title: tx('common.history'),
      render(body, flow) {
        body.classList.add('hs-body');
        body.innerHTML = `<div class="hs-chips-wrap"><div class="hs-chips" role="radiogroup" aria-label="${esc(tx('history.filterAria'))}"><i class="hs-chip-ind" aria-hidden="true"></i>${FILTERS.map((f) => `<button class="hs-chip press" type="button" role="radio" data-filter="${f.value}" aria-checked="${f.value === st.filter}">${esc(tx(f.key))}</button>`).join('')}</div></div><div class="hs-log"></div>`;
        const log = $('.hs-log', body);
        const chipsEl = $('.hs-chips', body);
        const ind = $('.hs-chip-ind', body);
        const chipOf = (v) => $(`.hs-chip[data-filter="${v}"]`, chipsEl);
        let shown = [], gone = false;
        const months = new Map();
        function placeIndicator(from) {
          const to = chipOf(st.filter);
          if (!to) return;
          if (motion() && motion().indicator) motion().indicator(ind, from || null, to);
          else {
            ind.style.width = `${to.offsetWidth}px`;
            ind.style.transform = `translateX(${to.offsetLeft}px)`;
          }
        }
        function rowHtml(e, i, spam) {
          const d = describe(e);
          const word = stateWord(e);
          const tone = word || spam ? 'flat' : d.up ? 'up' : 'plain';
          return `<button class="cell hs-row press-row" type="button" data-key="${esc(e.key)}" data-i="${i}">
              <span class="hs-tile" data-kind="${d.kind}" aria-hidden="true">${icon(d.icon, { size: 22 })}</span>
              <span class="cell-main hs-main">
                <span class="hs-line"><span class="hs-title">${esc(d.title)}</span> <span class="hs-amount is-${tone}">${esc(d.num)}<span class="hs-sym"> ${esc(d.sym)}</span></span></span>
                <span class="hs-line hs-line--sub">${d.sub ? `<span class="hs-sub">${subHtml(d)}</span> ` : ''}<span class="hs-when"><span class="hs-unit" aria-hidden="true"><span class="hs-unit-sym">${esc(d.sym)}</span> · </span><span class="hs-stamp${word ? ' is-state' : ''}${word && !e.pending ? ' is-failed' : ''}">${esc(word || whenText(e.at))}</span></span></span>
              </span>
            </button>`;
        }
        function keepRows(host, html) {
          const had = new Map(Array.from(host.children, (r) => [r.dataset.key, r]));
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          const next = Array.from(tmp.children, (r) => {
            const old = had.get(r.dataset.key);
            if (!old || old.innerHTML !== r.innerHTML) return r;
            had.delete(r.dataset.key);
            old.dataset.i = r.dataset.i;
            return old;
          });
          had.forEach((r) => r.remove());
          next.forEach((r, i) => { if (host.children[i] !== r) host.insertBefore(r, host.children[i] || null); });
        }
        const childOf = (host, cls) => Array.from(host.children).find((c) => c.classList.contains(cls)) || null;
        const txKey = (el) => el.dataset.tx;
        const rowKey = (el) => el.dataset.key;
        const STAGGER_MS = 38, STAGGER_MAX = 12;
        const clock = () => (window.performance && performance.now ? performance.now() : Date.now());
        let staggerEnd = 0;
        let held = false;
        function pick() {
          const { clean } = lists();
          return st.filter === 'all' ? clean : clean.filter((e) => e.kind === st.filter);
        }
        const waiting = () => !st.started || st.loading || (!st.failed && !st.ended && st.pages < HISTORY_PAGES_MAX);
        const SKELETON = '<div class="hs-skel" aria-hidden="true"><div class="group"><div class="wallet-skel"></div></div><div class="group"><div class="wallet-skel"></div></div><div class="group"><div class="wallet-skel"></div></div></div>';
        function paint(fresh) {
          if (held) return;
          const filter = FILTERS.find((f) => f.value === st.filter);
          shown = pick();
          if (!shown.length) {
            months.clear();
            if (waiting()) {
              const skel = childOf(log, 'hs-skel');
              if (!skel || skel._out) log.innerHTML = SKELETON;
              return;
            }
            const state = st.failed ? 'failed' : filter.value;
            const had = childOf(log, 'w-empty');
            if (had && had.dataset.state === state) return;
            log.innerHTML = st.failed
              ? CK.emptyState({ icon: 'warning', title: tx('common.loadFail'), className: 'w-empty', actions: `<button class="btn btn--small btn--tinted press w-retry" type="button">${esc(tx('common.retry'))}</button>` })
              : CK.emptyState({ icon: 'history', title: tx(filter.empty), className: 'w-empty' });
            const empty = childOf(log, 'w-empty');
            if (empty) {
              empty.dataset.state = state;
              if (motion()) motion().rows([empty], { fresh: true });
            }
            return;
          }
          const anew = !!fresh || !childOf(log, 'hs-month');
          if (!childOf(log, 'hs-month')) log.replaceChildren();
          const spam = false;
          const groups = historyBlocks(shown);
          const want = new Set(groups.map((g) => g.k));
          months.forEach((sec, k) => { if (!want.has(k)) { sec.remove(); months.delete(k); } });
          const more = childOf(log, 'w-retry--more');
          if (more) more.remove();
          const m = motion();
          const t0 = clock();
          const carry = anew ? 0 : Math.round(Math.min(Math.max(0, staggerEnd - t0), STAGGER_MAX * STAGGER_MS));
          let before = 0;
          groups.forEach((g, gi) => {
            let sec = months.get(g.k);
            if (!sec) {
              sec = CK.el(`<section class="hs-month"><h3 class="hs-month-name"></h3><div class="hs-list"></div></section>`);
              months.set(g.k, sec);
            }
            $('.hs-month-name', sec).textContent = monthName(g.at);
            if (log.children[gi] !== sec) log.insertBefore(sec, log.children[gi] || null);
            const list = $('.hs-list', sec);
            const had = new Map(Array.from(list.children, (b) => [b.dataset.tx, b]));
            let made = 0;
            const next = g.blocks.map((b) => {
              const html = b.rows.map(({ e, i }) => rowHtml(e, i, spam)).join('');
              let block = had.get(b.id);
              if (block) {
                had.delete(b.id);
                if (block._html !== html) {
                  block._html = html;
                  keepRows(block, html);
                  if (m) m.rows(block, { key: rowKey });
                }
              } else {
                block = CK.el(`<div class="group hs-tx" data-tx="${esc(b.id)}"></div>`);
                block._html = html;
                block.innerHTML = html;
                made += 1;
                if (m && m.quiet) m.quiet(() => m.rows(block, { key: rowKey }));
              }
              block.classList.toggle('is-multi', b.rows.length > 1);
              return block;
            });
            had.forEach((b) => b.remove());
            next.forEach((b, i) => { if (list.children[i] !== b) list.insertBefore(b, list.children[i] || null); });
            if (m) {
              const delay = carry + Math.min(before, STAGGER_MAX) * STAGGER_MS;
              m.rows([$('.hs-month-name', sec)], { fresh: !!fresh, delay });
              m.rows(list, { fresh: !!fresh, key: txKey, delay });
            }
            before += made;
          });
          if (before) staggerEnd = t0 + carry + Math.min(before, STAGGER_MAX) * STAGGER_MS;
          if (st.failed) log.appendChild(CK.el(`<button class="btn btn--tinted btn--small press w-retry w-retry--more" type="button">${esc(tx('common.retry'))}</button>`));
          fitHistoryRows($$('.hs-row', log));
        }
        let fitWidth = 0;
        const fitAgain = () => { if (!gone) fitHistoryRows($$('.hs-row', log)); };
        const sizeWatch = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
          if (log.clientWidth === fitWidth) return;
          fitWidth = log.clientWidth;
          fitAgain();
        }) : null;
        if (sizeWatch) sizeWatch.observe(log);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAgain, () => {});
        function load() {
          if (st.loading || st.ended) return;
          st.loading = true;
          st.started = true;
          st.failed = false;
          st.pages++;
          paint();
          T.config().then(() => T.api(`wallet/history?address=${encodeURIComponent(wallet)}${st.next ? `&before=${st.next}` : ''}`)).then((answer) => {
            intake(answer.rows).forEach((e) => {
              if (seen.has(e.key)) return;
              seen.add(e.key);
              st.items.push(e);
            });
            st.items.sort((a, b) => b.at - a.at);
            st.next = typeof answer.next === 'string' && /^\d{1,20}$/.test(answer.next) ? answer.next : null;
            st.ended = !st.next;
          }, (err) => {
            console.error(err);
            st.failed = true;
          }).finally(() => {
            st.loading = false;
            if (gone || held) return;
            settle(() => {
              paint();
              fill();
            });
          });
        }
        function fill() {
          if (!gone && !st.failed && !st.ended && shown.length < HISTORY_FILL && st.pages < HISTORY_PAGES_MAX) load();
        }
        function settle(then) {
          const skel = childOf(log, 'hs-skel');
          const stays = !pick().length && waiting();
          const seen = skel && !stays && !skel._out && typeof skel.animate === 'function' && typeof window.getComputedStyle === 'function'
            ? parseFloat(getComputedStyle(skel).opacity) || 0 : 0;
          if (seen <= .02) {
            then();
            return;
          }
          skel._out = true;
          held = true;
          const m = motion();
          const timing = m && m.reduce
            ? { duration: m.REDUCED_MS || 120, easing: 'ease-out', fill: 'forwards' }
            : { duration: 171, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' };
          let a = null;
          try { a = skel.animate([{ opacity: seen }, { opacity: 0 }], timing); } catch (e) { a = null; }
          const after = () => {
            held = false;
            if (!gone) then();
          };
          if (a && a.finished) a.finished.then(after, after);
          else after();
        }
        const onScroll = () => {
          st.scroll = body.scrollTop;
          if (!st.failed && !st.ended && body.scrollTop + body.clientHeight * 2 > body.scrollHeight) {
            st.pages = 0;
            load();
          }
        };
        body.addEventListener('scroll', onScroll, { passive: true });
        chipsEl.addEventListener('click', (e) => {
          const chip = e.target.closest('.hs-chip');
          if (!chip || chip.dataset.filter === st.filter) return;
          CK.haptic.selection();
          const was = chipOf(st.filter);
          st.filter = chip.dataset.filter;
          $$('.hs-chip', chipsEl).forEach((c) => c.setAttribute('aria-checked', String(c === chip)));
          placeIndicator(was);
          chip.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: CK.reducedMotion() ? 'auto' : 'smooth' });
          st.pages = 0;
          if (held) return;
          const going = $$('.hs-month-name, .hs-tx, .w-empty, .w-retry--more', log);
          const swap = () => {
            held = false;
            if (gone) return;
            months.clear();
            Array.from(log.children).forEach((c) => { if (!c.classList.contains('hs-skel')) c.remove(); });
            body.scrollTop = 0;
            settle(() => {
              paint(true);
              fill();
            });
          };
          if (motion() && going.length) {
            held = true;
            motion().leave(going).then(swap, swap);
          } else swap();
        });
        log.addEventListener('click', (e) => {
          if (e.target.closest('.w-retry')) {
            st.pages = 0;
            load();
            return;
          }
          const row = e.target.closest('[data-i]');
          if (!row) return;
          CK.haptic.selection();
          flow.push(detailStep(shown[Number(row.dataset.i)], false));
        });
        if (st.started) {
          if (motion() && motion().quiet) motion().quiet(() => paint());
          else paint();
          staggerEnd = 0;
          body.scrollTop = st.scroll;
        } else {
          paint();
          load();
        }
        const edge = () => chipsEl.classList.toggle('has-more', chipsEl.scrollLeft + chipsEl.clientWidth < chipsEl.scrollWidth - 2);
        chipsEl.addEventListener('scroll', edge, { passive: true });
        requestAnimationFrame(() => {
          placeIndicator(null);
          edge();
        });
        return () => {
          gone = true;
          if (sizeWatch) sizeWatch.disconnect();
          body.removeEventListener('scroll', onScroll);
          body.classList.remove('hs-body');
        };
      }
    };
  }
  function detailStep(e, listedAsSpam) {
    const d = describe(e);
    const spam = !!e.spam || !!listedAsSpam;
    const rows = [[tx('tx.date'), `${CK.i18n.dayMonthYear(e.at)}, ${CK.i18n.clock(e.at)}`]];
    if (e.kind === 'swap') rows.push([tx('exchange.gave'), sideText('', e.gave)], [tx('exchange.got'), sideText('', e.got)]);
    if (stateWord(e)) rows.push([tx('walletFlow.status'), stateWord(e)]);
    return {
      title: d.full,
      render(body, flow) {
        body.innerHTML = `
          <div class="w-detail-hero hs-detail-hero"><span class="hs-tile hs-tile--big" data-kind="${d.kind}" aria-hidden="true">${icon(d.icon, { size: 30 })}</span><b class="w-is-${stateWord(e) || spam ? 'flat' : d.up ? 'up' : 'plain'}"></b></div>
          <div class="group"><div class="summary w-rows"></div></div>`;
        $('.w-detail-hero b', body).textContent = d.amount;
        const host = $('.w-rows', body);
        rows.forEach(([label, value]) => {
          const r = CK.el('<div class="summary-row"><b></b></div>');
          r.prepend(label);
          r.lastElementChild.textContent = value;
          host.appendChild(r);
        });
        if (e.counterparty) {
          const block = CK.el('<div class="w-party"><span class="w-party-label"></span><span class="w-party-address"></span></div>');
          $('.w-party-label', block).textContent = tx(e.kind === 'in' ? 'walletFlow.sender' : 'walletFlow.recipient');
          $('.w-party-address', block).textContent = T.friendlyAddress(e.counterparty);
          host.appendChild(block);
          if (!spam && e.kind === 'out' && T.wallet && paidAddresses(T.wallet.address).includes(e.counterparty)) {
            const copy = CK.el(`<button class="w-copy" type="button" aria-label="${esc(tx('common.copyAddress'))}">${icon('copy', { size: 15 })}<span>${esc(tx('common.copy'))}</span></button>`);
            copy.addEventListener('click', () => CK.copyText(T.friendlyAddress(e.counterparty)).then((copied) => {
              if (copied) CK.toast(tx('common.addressCopied'), { icon: 'check-circle', tone: 'up' });
              else CK.toast(tx('common.copyFail'), { icon: 'warning', tone: 'down' });
            }));
            block.appendChild(copy);
            if (window.DemoBook && DemoBook.available() && !DemoBook.has('ton', T.friendlyAddress(e.counterparty)) && flow) {
              const keep = CK.el(`<button class="w-copy w-keep" type="button">${icon('plus', { size: 15 })}<span>${esc(tx('book.save'))}</span></button>`);
              keep.addEventListener('click', () => {
                CK.haptic.selection();
                flow.push(DemoBook.saveStep({ net: 'ton', address: T.friendlyAddress(e.counterparty), memo: e.comment || '' }));
              });
              block.appendChild(keep);
            }
          }
        }
        if (e.comment) {
          const block = CK.el(`<div class="w-party"><span class="w-party-label">${esc(tx('walletFlow.comment'))}</span><span class="w-party-text"></span></div>`);
          $('.w-party-text', block).textContent = e.comment;
          host.appendChild(block);
        }
        if (spam) body.appendChild(CK.el(`<div class="hs-spam-note">${icon('warning', { size: 18 })}<span>${esc(tx('history.spamNote'))}</span></div>`));
        if (HEX_HASH.test(e.id)) {
          const open = CK.el(`<button class="tk-link" type="button">${esc(tx('swap.explorer'))}</button>`);
          open.addEventListener('click', () => T.openLink(`${EXPLORER}transaction/${e.id}`));
          body.appendChild(open);
        }
      }
    };
  }
  const historyHeight = () => {
    const app = document.getElementById('app');
    return Math.round((app ? app.clientHeight : 700) * .88);
  };
  function openHistory(opts) {
    if (!T.wallet || !W() || typeof W().openFlow !== 'function') return null;
    const step = historyStep(opts);
    return W().openFlow(step, null, historyHeight() - (CK.sheet.safeBottom ? CK.sheet.safeBottom() : 0));
  }

  window.DemoManage = { arrange, openManage, openHistory, keyOf, prefsOf, intake, describe, historyBlocks };
})();
