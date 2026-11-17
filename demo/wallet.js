(function () {
  'use strict';
  const { fmt, icon, clamp, esc, t: tx, tr } = CK;
  const T = CK.ton;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);

  const NATIVE = 'TON';
  const NATIVE_RAW = '0:' + '0'.repeat(64);
  const USDT_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const NOT_RAW = T.rawAddress('EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT');
  const TON_DECIMALS = 9;
  const knownDecimals = CK.swapAudit.knownDecimals;
  const MAX_KEEP = 10000000n;
  const JETTON_NEEDS = 55000000n;
  const BALANCE_RETRY_MS = 5000;
  const POLL_MS = 4000;
  const POLL_FIRST_MS = [1000, 1500, 2000, 3000];
  let pollOf = null, pollStep = 0;
  const EXPIRY_MARGIN_S = 15;
  const LOST_GRACE_S = 30;
  const OPEN_KEY = 'ck-send-open';
  const PAID_KEY = 'ck-sent-to:';
  const PAID_KEPT = 50;
  const EXPLORER = 'https://tonviewer.com/';
  const HEX_HASH = /^[0-9a-f]{64}$/i;
  const DUST_NANO = 10000000n;
  const SEARCH_MS = 300;
  const USER_LOOK_MS = 450;
  const USER_NAME = /^[A-Za-z0-9_]{4,32}$/;
  const USER_LINK = /^(?:https?:\/\/)?(?:t|telegram)\.me\/([A-Za-z0-9_]{4,32})\/?$/i;
  const USER_FAILS = { directory_unverified: 'withdraw.userUnverified', rate_limited: 'withdraw.userWait', tg_only: 'forget.tgOnly' };
  const INVITE_FALLBACK = 'https://t.me/DevpoolTrading_bot';
  const MEMO_MAX = 120;
  const JETTON_MEMO = /^[A-Za-z0-9_-]{1,24}$/;
  const cleanMemo = (text) => String(text || '').replace(/[\p{C}]/gu, '').trim();
  function memoProblem(assetId, memo) {
    if (!memo) return null;
    if (assetId !== NATIVE) return JETTON_MEMO.test(memo) ? null : 'withdraw.memoToken';
    return Array.from(memo).length <= MEMO_MAX ? null : 'withdraw.memoLong';
  }
  const DNS_NAME = /^(?=.{5,127}$)([a-z0-9_-]{1,63}\.)+(ton|t\.me)$/;
  function dnsTyped(text) {
    const name = String(text || '').trim().toLowerCase();
    return DNS_NAME.test(name) && !name.startsWith('-') ? name : null;
  }
  function userTyped(text) {
    const link = USER_LINK.exec(text);
    if (!link && !text.startsWith('@')) return null;
    const name = link ? link[1] : text.slice(1);
    return { name: name.toLowerCase(), valid: USER_NAME.test(name), early: name.length < 4 && /^[A-Za-z0-9_]*$/.test(name) };
  }
  const SAMPLE_USER = Object.freeze({ found: true, tgId: 1, username: 'devpool_example', name: 'Пример', photoUrl: null, address: '0:' + '5a'.repeat(32), friendly: T.friendlyAddress('0:' + '5a'.repeat(32)), keyChanged: false });
  function lookUser(name) {
    if (CK.market.mode !== 'live' && !CK.tg.inside) return Promise.resolve(name === SAMPLE_USER.username ? SAMPLE_USER : { found: false, username: name });
    return CK.wallet.directory.resolve(name);
  }
  function lookDns(name) {
    return T.config().then(() => T.api('wallet/dns?name=' + encodeURIComponent(name))).then((answer) => {
      if (!answer || answer.name !== name) throw Object.assign(new Error('dns_other'), { code: 'dns_other' });
      if (answer.address === null) return null;
      const raw = T.rawAddress(answer.address);
      if (!raw || !raw.startsWith('0:')) throw Object.assign(new Error('dns_bad'), { code: 'dns_bad' });
      return raw;
    });
  }
  function lookalikeOf(raw) {
    if (!raw || !T.wallet) return null;
    const known = new Set(paidAddresses(T.wallet.address).filter((a) => T.rawAddress(a) === a));
    if (window.DemoBook) DemoBook.list('ton').forEach((e) => known.add(e.raw));
    if (known.has(raw)) return null;
    const look = addressLook(raw);
    for (const one of known) if (addressLook(one) === look) return one;
    return null;
  }
  const looksLikeDomain = (text) => /\.\p{L}/u.test(String(text).normalize('NFKC'));
  function lookRecipient(raw) {
    return T.config().then(() => T.api('wallet/recipient?address=' + encodeURIComponent(raw))).then((answer) => {
      if (!answer || T.rawAddress(answer.address) !== raw) throw Object.assign(new Error('recipient_other'), { code: 'recipient_other' });
      const whole = typeof answer.name === 'string' ? answer.name.replace(/[\p{C}]/gu, '').trim() : '';
      const label = whole && !looksLikeDomain(whole) ? Array.from(whole).slice(0, 40).join('').trim() : null;
      return { scam: answer.scam === true, memoRequired: answer.memoRequired === true, label };
    });
  }
  const SEARCH_LIMIT = 12;
  const HISTORY_FILL = 10;
  const HISTORY_PAGES_MAX = 6;
  const SHEET_HEIGHT = 466;
  const HEIGHT = { deposit: SHEET_HEIGHT, withdraw: SHEET_HEIGHT, exchange: 360, status: SHEET_HEIGHT };

  const reduced = () => CK.reducedMotion();
  function safeBottom() {
    const probe = CK.el('<div style="position:fixed;visibility:hidden;height:var(--safe-bottom)"></div>');
    document.body.appendChild(probe);
    const px = probe.offsetHeight;
    probe.remove();
    return px;
  }

  const qtySym = (units, asset) => `${D.qty(T.fromUnits(units, asset.decimals))} ${asset.sym}`;
  function unitsText(units, decimals) {
    if (units <= 0n) return '';
    const text = units.toString().padStart(decimals + 1, '0');
    const cut = text.length - decimals;
    const part = text.slice(cut).replace(/0+$/, '');
    return part ? `${text.slice(0, cut)}${fmt.decimal()}${part}` : text.slice(0, cut);
  }
  function typedUnits(text, decimals) {
    let raw = String(text).replace(/\s/g, '');
    const comma = raw.lastIndexOf(','), dot = raw.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) raw = comma > dot ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
    else if (comma >= 0) raw = fmt.decimal() === '.' && /^\d{1,3}(,\d{3})+$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
    if (!/^\d*\.?\d*$/.test(raw) || !/\d/.test(raw)) return 0n;
    return T.toUnits(`0${raw}`.replace(/\.$/, ''), decimals);
  }
  function fitFraction(input, decimals) {
    if (!Number.isInteger(decimals) || decimals <= 0) return;
    const text = input.value;
    const at = Math.max(text.lastIndexOf(','), text.lastIndexOf('.'));
    if (at < 0 || (text.indexOf('.') < 0 && fmt.decimal() === '.' && /^\d{1,3}(,\d{3})+$/.test(text.replace(/\s/g, '')))) return;
    let seen = 0, end = text.length;
    for (let i = at + 1; i < text.length; i++) {
      if (text[i] >= '0' && text[i] <= '9' && ++seen > decimals) { end = i; break; }
    }
    if (end === text.length) return;
    const caret = input.selectionStart;
    input.value = text.slice(0, end);
    const at2 = Math.min(caret === null ? end : caret, end);
    try { input.setSelectionRange(at2, at2); } catch (_) { }
  }
  const OTHER_DIGITS = /[\u0660-\u0669\u06f0-\u06f9]/g;
  const cleanAmount = (text) => text.replace(OTHER_DIGITS, (d) => String(d.charCodeAt(0) & 15)).replace(/[^0-9.,\s]/g, '');
  function amountField(input) {
    let focusedAt = -1e9, swapSep = false;
    input.addEventListener('beforeinput', (e) => {
      if (e.inputType !== 'insertText' || typeof e.data !== 'string' || e.data.length !== 1 || /[0-9\u0660-\u0669\u06f0-\u06f9]/.test(e.data)) return;
      const text = input.value, from = input.selectionStart, to = input.selectionEnd;
      const rest = from === null ? text : text.slice(0, from) + text.slice(to);
      if ((e.data !== ',' && e.data !== '.') || /[.,]/.test(rest)) e.preventDefault();
      else if (e.data !== fmt.decimal()) swapSep = true;
    });
    const tidy = () => {
      const text = input.value;
      if (/^[0-9.,\s]*$/.test(text)) return false;
      const caret = input.selectionStart;
      input.value = cleanAmount(text);
      if (caret !== null) {
        const at = cleanAmount(text.slice(0, caret)).length;
        try { input.setSelectionRange(at, at); } catch (_) { }
      }
      return true;
    };
    input.addEventListener('input', (e) => {
      if (swapSep) {
        swapSep = false;
        const at = input.selectionStart, text = input.value;
        if (at > 0 && /[.,]/.test(text[at - 1])) {
          input.value = text.slice(0, at - 1) + fmt.decimal() + text.slice(at);
          try { input.setSelectionRange(at, at); } catch (_) { }
        }
      }
      if (!e.isComposing) tidy();
    });
    input.addEventListener('compositionend', () => { if (tidy()) input.dispatchEvent(new Event('input', { bubbles: true })); });
    const toEnd = () => {
      const n = input.value.length;
      if (document.activeElement !== input || input.selectionStart !== input.selectionEnd || input.selectionStart === n) return;
      try { input.setSelectionRange(n, n); } catch (_) { }
    };
    input.addEventListener('focus', () => {
      focusedAt = performance.now();
      requestAnimationFrame(toEnd);
    });
    input.addEventListener('click', () => {
      if (performance.now() - focusedAt > 600) return;
      toEnd();
      requestAnimationFrame(toEnd);
    });
  }
  const SQUEEZE = ['is-squeezed', 'is-squeezed-more', 'is-squeezed-most'];
  function squeezeAware(body) {
    if (!window.ResizeObserver) return () => {};
    let need = 0;
    const rowsHeight = () => {
      const top = body.getBoundingClientRect().top - body.scrollTop;
      let bottom = 0;
      for (const el of body.children) bottom = Math.max(bottom, el.getBoundingClientRect().bottom - top);
      return bottom + parseFloat(getComputedStyle(body).paddingBottom);
    };
    const observer = new ResizeObserver(() => {
      if (!body.classList.contains(SQUEEZE[0])) need = rowsHeight();
      body.classList.remove(...SQUEEZE);
      if (body.clientHeight + 1 >= need) return;
      for (const mark of SQUEEZE) {
        body.classList.add(mark);
        if (body.clientHeight + 1 >= rowsHeight()) break;
      }
    });
    observer.observe(body);
    return () => {
      observer.disconnect();
      body.classList.remove(...SQUEEZE);
    };
  }

  let ctx = null;
  const accountChanged = () => { if (ctx) ctx.accountChanged(); };

  function openFlow(first, onClosed, height, over) {
    if (CK.sheet.top && !over) return null;
    const stack = [];
    let dispose = null, built = false, sheet = null, body = null, titleEl = null, backBtn = null;
    function revealFold(toggle) {
      if (!body || !toggle.isConnected || toggle.getAttribute('aria-expanded') !== 'true') return;
      const id = toggle.getAttribute('aria-controls');
      const panel = id ? Array.from(body.querySelectorAll('[id]')).find((n) => n.id === id) : null;
      if (!panel || panel.hidden || !panel.getClientRects().length) return;
      const room = body.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(body).paddingBottom) || 0;
      const below = panel.getBoundingClientRect().bottom - (room.bottom - pad);
      const above = toggle.getBoundingClientRect().top - room.top - 8;
      const by = Math.min(below, above);
      if (by > 1) body.scrollBy({ top: by, behavior: reduced() ? 'auto' : 'smooth' });
    }
    function clearStep() {
      if (dispose) dispose();
      dispose = null;
      if (document.activeElement && sheet.el.contains(document.activeElement)) document.activeElement.blur();
      const dock = sheet.el.querySelector(':scope > .sheet-dock');
      if (dock) dock.remove();
      body.className = 'sheet-body w-step';
      body.scrollTop = 0;
      body.replaceChildren();
    }
    function show(dir) {
      clearStep();
      const step = stack[stack.length - 1];
      titleEl.textContent = step.title;
      sheet.el.setAttribute('aria-label', step.title);
      backBtn.hidden = stack.length < 2;
      dispose = step.render(body, flow) || null;
      if (!built) return;
      if (dir && !reduced()) body.animate([{ opacity: .4, transform: `translate3d(${dir * 16}px,0,0)` }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    const flow = {
      push(step) { stack.push(step); show(1); },
      back() { if (stack.length > 1) { stack.pop(); show(-1); } },
      replace(step) { stack.length = 0; stack.push(step); show(1); },
      close() { sheet.close(); },
      get closing() { return !sheet || sheet.el.hasAttribute('inert'); },
      get sheet() { return sheet; }
    };
    CK.sheet.open({
      title: first.title,
      detents: height ? [CK.sheet.fixedDetent(height + safeBottom())] : [CK.sheet.overviewDetent()],
      onClose() {
        if (dispose) dispose();
        dispose = null;
        if (onClosed) onClosed();
      },
      build(b, api) {
        sheet = api;
        body = b;
        const head = $('.sheet-head', api.el);
        titleEl = $('.sheet-title', api.el);
        backBtn = CK.el(`<button class="navbtn navbtn--flat press w-back" type="button" aria-label="${tx('nav.back')}" hidden>${icon('chevron-left', { size: 20 })}</button>`);
        const wrap = CK.el('<div class="w-title-wrap"></div>');
        head.insertBefore(wrap, titleEl);
        wrap.append(backBtn, titleEl);
        backBtn.addEventListener('click', () => flow.back());
        api.el.addEventListener('click', (e) => {
          const toggle = e.target.closest && e.target.closest('[aria-expanded][aria-controls]');
          if (toggle && body.contains(toggle)) requestAnimationFrame(() => revealFold(toggle));
        });
        stack.push(first);
        show(0);
      }
    });
    built = true;
    return flow;
  }

  const copyWithToast = (text) => CK.copyText(text).then((copied) => {
    if (copied) CK.toast(tx('common.addressCopied'), { icon: 'check-circle', tone: 'up' });
    else CK.toast(tx('common.copyFail'), { icon: 'warning', tone: 'down' });
  });

  function cleanRow(raw) {
    if (!raw) return null;
    const units = T.parseUnits(raw.units);
    if (units === null) return null;
    if (raw.native === true) {
      const coin = D.byId.ton;
      return { id: NATIVE, units, decimals: TON_DECIMALS, sym: coin.sym, name: coin.name, inst: coin, logo: null, wallet: null, risk: 'none' };
    }
    const id = T.rawAddress(raw.token);
    if (!id || !id.startsWith('0:') || units <= 0n || !Number.isInteger(raw.decimals) || raw.decimals < 0 || raw.decimals > 30) return null;
    if (knownDecimals(id) !== null && knownDecimals(id) !== raw.decimals) return null;
    const inst = id === USDT_RAW ? D.byId.usdt : id === NOT_RAW ? D.byId.not : null;
    const names = CK.market.cleanToken({ id: 'ton:x', symbol: raw.symbol, name: raw.name, address: id });
    const wallet = T.rawAddress(raw.wallet);
    return {
      id, units, decimals: raw.decimals, sym: inst ? inst.sym : names.symbol, name: inst ? inst.name : names.name, inst,
      logo: typeof raw.logo === 'string' && raw.logo.startsWith('api/logos?') ? raw.logo : null,
      wallet: wallet && wallet.startsWith('0:') ? wallet : null,
      risk: raw.risk === 'suspicious' || (!inst && CK.market.passesForCoin(raw.symbol, raw.name, raw.listed)) ? 'suspicious' : 'none'
    };
  }
  let seenRows = null, rowsJob = null;
  function loadRows(since) {
    const wallet = T.wallet;
    if (!wallet) return Promise.reject(new Error('no_wallet'));
    if (since && seenRows && seenRows.address === wallet.address && seenRows.began >= since) return Promise.resolve(seenRows.rows);
    if (rowsJob && rowsJob.address === wallet.address && rowsJob.at >= (since || 0)) return rowsJob.job;
    const began = Date.now();
    const job = T.config()
      .then(() => T.api('wallet/balances?address=' + encodeURIComponent(wallet.address)))
      .then((body) => {
        if (!T.wallet || T.wallet.address !== wallet.address) throw new Error('no_wallet');
        const rows = (Array.isArray(body.balances) ? body.balances : []).map(cleanRow).filter((r) => r && r.risk !== 'suspicious');
        seenRows = { address: wallet.address, rows, began, at: Date.now() };
        if (window.DemoSwap && DemoSwap.takeBalances) DemoSwap.takeBalances(wallet.address, body);
        return rows;
      });
    const entry = { address: wallet.address, at: began, job };
    const done = () => { if (rowsJob === entry) rowsJob = null; };
    rowsJob = entry;
    job.then(done, done);
    return job;
  }
  function rowOfHeld(h) {
    const coin = h.coin;
    if (coin === D.byId.ton) return { id: NATIVE, units: h.units, decimals: TON_DECIMALS, sym: coin.sym, name: coin.name, inst: coin, logo: null, wallet: null, risk: 'none' };
    const inst = coin === D.byId.usdt || coin === D.byId.not ? coin : null;
    const id = inst ? (inst === D.byId.usdt ? USDT_RAW : NOT_RAW) : coin.token ? T.rawAddress(coin.token.address) : null;
    if (!id || !id.startsWith('0:') || !(h.units > 0n) || (knownDecimals(id) !== null && knownDecimals(id) !== h.decimals)) return null;
    return { id, units: h.units, decimals: h.decimals, sym: coin.sym, name: coin.name, inst, logo: inst ? null : `api/logos?id=${encodeURIComponent(coin.id)}`, wallet: null, risk: 'none' };
  }
  function knownRows() {
    const wallet = T.wallet;
    if (!wallet) return null;
    const folio = D.balancesWallet === wallet.address;
    if (seenRows && seenRows.address === wallet.address && (!folio || seenRows.at >= D.balancesAt)) return seenRows.rows;
    if (!folio) return null;
    const rows = D.holdings().filter((h) => !h.net && h.risk !== 'suspicious').map(rowOfHeld).filter(Boolean);
    const gramAt = rows.findIndex((r) => r.id === NATIVE);
    const gram = gramAt >= 0 ? rows.splice(gramAt, 1)[0] : rowOfHeld({ coin: D.byId.ton, units: 0n, decimals: TON_DECIMALS });
    return [gram].concat(rows);
  }
  const logoOf = (a, size) => (a.inst ? CK.coinLogo(a.inst, size) : CK.coinLogo({ id: a.id === NATIVE ? 'ton' : a.id, sym: a.sym, neutral: true, logo: a.logo || null }, size));
  const firstHeld = (rows) => rows.find((r) => r.id === NATIVE && r.units > 0n) || rows.find((r) => r.units > 0n) || rows[0] || null;

  function assetRowHtml(i, a) {
    return `
      <button class="cell market-row press-row" type="button" data-i="${i}">
        ${logoOf(a, 40)}
        <span class="market-name"><b>${esc(a.name)}</b><span class="w-row-sub"><span>${esc(a.sym)}</span>${a.net ? `<em class="tag">${esc(a.net)}</em>` : ''}</span></span>
        ${a.units > 0n ? `<span class="asset-right"><b>${esc(D.qty(T.fromUnits(a.units, a.decimals)))}</b></span>` : ''}
      </button>`;
  }
  function pickerStep(o) {
    return {
      title: o.title,
      render(body, flow) {
        const parts = [];
        if (o.search) parts.push(`<button class="search w-find" type="button">${icon('search', { size: 19 })}${tx('picker.find')}</button>`);
        parts.push(o.list.length ? `<div class="sheet-list w-list">${o.list.map((a, i) => assetRowHtml(i, a)).join('')}</div>` : CK.emptyState({ icon: 'wallet', title: tx('picker.none'), className: 'w-empty' }));
        body.innerHTML = parts.join('');
        const onClick = (e) => {
          if (e.target.closest('.w-find')) {
            flow.push(searchStep(o));
            return;
          }
          const row = e.target.closest('[data-i]');
          if (!row) return;
          CK.haptic.selection();
          o.onPick(o.list[Number(row.dataset.i)], flow);
        };
        body.addEventListener('click', onClick);
        return () => body.removeEventListener('click', onClick);
      }
    };
  }
  function assetOf(inst) {
    if (inst === D.byId.ton) return { id: NATIVE, sym: inst.sym, name: inst.name, decimals: TON_DECIMALS, inst, logo: null };
    if (inst === D.byId.usdt) return { id: USDT_RAW, sym: inst.sym, name: inst.name, decimals: 6, inst, logo: null };
    if (inst === D.byId.not) return { id: NOT_RAW, sym: inst.sym, name: inst.name, decimals: 9, inst, logo: null };
    if (!DemoSwap.eligible(inst)) return null;
    const raw = T.rawAddress(inst.token.address);
    return { id: raw === NATIVE_RAW ? NATIVE : raw, sym: inst.sym, name: inst.name, decimals: 0, inst, logo: inst.logo };
  }
  const GET_FRESH_MS = 60000;
  const WARM_AFTER_MS = 2500;
  const WARM_IDLE_MS = 2000;
  const QUERIES_KEPT = 20;
  const LOGOS_HELD = 48;
  let getKept = null, getJob = null;
  const foundKept = new Map();
  const heldLogos = new Map();
  const logoSrc = (a) => (a.inst ? CK.COIN_LOGOS[a.inst.id] || a.inst.logo : a.logo) || null;
  function holdLogos(list) {
    list.forEach((a) => {
      const src = logoSrc(a);
      if (!src || heldLogos.has(src) || heldLogos.size >= LOGOS_HELD) return;
      heldLogos.set(src, true);
      CK.logos.hold(src);
    });
  }
  function assetsOfTokens(tokens) {
    const seen = new Set();
    return tokens.map((t) => assetOf(D.instrumentOf(t))).filter((a) => {
      if (!a || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }
  function findAssets(q) {
    if (!q && getJob) return getJob;
    const job = CK.market.tokens({ network: 'ton', sort: 'popular', q: q || undefined, limit: SEARCH_LIMIT }).then((res) => {
      const found = assetsOfTokens(res.tokens);
      if (q) {
        foundKept.delete(q);
        if (foundKept.size >= QUERIES_KEPT) foundKept.delete(foundKept.keys().next().value);
        foundKept.set(q, found);
      } else {
        getKept = { at: Date.now(), list: found };
      }
      holdLogos(found);
      return found;
    });
    if (!q) {
      getJob = job;
      const done = () => { if (getJob === job) getJob = null; };
      job.then(done, done);
    }
    return job;
  }
  function warmExchange() {
    if (!T.wallet || T.wallet.readOnly) return;
    if (!getKept || Date.now() - getKept.at > GET_FRESH_MS) findAssets('').catch(() => {});
    const held = knownRows();
    if (held) holdLogos(held);
  }
  function searchStep(o) {
    return {
      title: tx('token.searchAria'),
      render(body, flow) {
        body.innerHTML = `
          <label class="search">${icon('search', { size: 19 })}<input class="w-search" type="search" placeholder="${tx('token.searchPh')}" aria-label="${tx('token.searchAria')}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" maxlength="128"></label>
          <div class="w-results"></div>`;
        const input = $('.w-search', body), results = $('.w-results', body);
        let gen = 0, timer = 0, rows = [], shown = null;
        function paint(next, emptyText) {
          const key = `${next.map((a) => a.id).join()}|${emptyText}`;
          if (key === shown) return;
          shown = key;
          rows = next;
          results.innerHTML = rows.length ? `<div class="sheet-list w-list">${rows.map((a, i) => assetRowHtml(i, a)).join('')}</div>` : CK.emptyState({ icon: 'search', title: emptyText, className: 'w-empty' });
        }
        const keptFor = (q) => (q ? foundKept.get(q) : getKept && getKept.list) || null;
        function run() {
          const q = input.value.trim();
          const g = ++gen;
          const kept = keptFor(q);
          if (!q && kept && Date.now() - getKept.at <= GET_FRESH_MS) return;
          findAssets(q).then((found) => {
            if (g === gen) paint(found, tx('common.notFound'));
          }, () => {
            if (g === gen && !kept) paint([], tx('common.loadFail'));
          });
        }
        const onInput = () => {
          clearTimeout(timer);
          const kept = keptFor(input.value.trim());
          if (kept) paint(kept, tx('common.notFound'));
          timer = setTimeout(run, SEARCH_MS);
        };
        const onClick = (e) => {
          const row = e.target.closest('[data-i]');
          if (!row) return;
          CK.haptic.selection();
          o.onPick(rows[Number(row.dataset.i)], flow);
        };
        input.addEventListener('input', onInput);
        results.addEventListener('click', onClick);
        if (keptFor('')) paint(keptFor(''), tx('common.notFound'));
        run();
        return () => {
          gen++;
          clearTimeout(timer);
        };
      }
    };
  }

  function qrMatrix(text) {
    const SIZE = 33, DATA = 32, EC = 18, BLOCKS = 2;
    const bytes = Array.from(new TextEncoder().encode(text));
    if (bytes.length > 62) return null;
    const bits = [];
    const push = (value, count) => { for (let i = count - 1; i >= 0; i--) bits.push((value >> i) & 1); };
    push(4, 4);
    push(bytes.length, 8);
    bytes.forEach((b) => push(b, 8));
    push(0, Math.min(4, DATA * BLOCKS * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((v, b) => v * 2 + b, 0));
    for (let pad = 0xec; data.length < DATA * BLOCKS; pad ^= 0xec ^ 0x11) data.push(pad);
    const exp = new Array(512), log = new Array(256);
    for (let i = 0, x = 1; i < 255; i++) {
      exp[i] = x;
      log[x] = i;
      x = x << 1 ^ (x & 0x80 ? 0x11d : 0);
    }
    for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
    let gen = [1];
    for (let i = 0; i < EC; i++) {
      const next = new Array(gen.length + 1).fill(0);
      gen.forEach((c, j) => {
        next[j] ^= c;
        next[j + 1] ^= c ? exp[log[c] + i] : 0;
      });
      gen = next;
    }
    const blocks = [data.slice(0, DATA), data.slice(DATA)];
    const parity = blocks.map((block) => {
      const rest = block.concat(new Array(EC).fill(0));
      for (let i = 0; i < block.length; i++) {
        const c = rest[i];
        if (c) gen.forEach((g, j) => { rest[i + j] ^= g ? exp[log[g] + log[c]] : 0; });
      }
      return rest.slice(block.length);
    });
    const stream = [];
    for (let i = 0; i < DATA; i++) blocks.forEach((b) => stream.push(b[i]));
    for (let i = 0; i < EC; i++) parity.forEach((p) => stream.push(p[i]));

    const base = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
    const fixed = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
    const put = (x, y, dark) => {
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
      base[y][x] = dark ? 1 : 0;
      fixed[y][x] = true;
    };
    [[0, 0], [SIZE - 7, 0], [0, SIZE - 7]].forEach(([ox, oy]) => {
      for (let y = -1; y <= 7; y++) {
        for (let x = -1; x <= 7; x++) {
          const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
          put(ox + x, oy + y, ring !== 2 && ring !== 4);
        }
      }
    });
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) put(26 + x, 26 + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }
    for (let i = 8; i < SIZE - 8; i++) {
      put(i, 6, i % 2 === 0);
      put(6, i, i % 2 === 0);
    }
    put(8, SIZE - 8, true);
    const formatCells = [];
    for (let i = 0; i < 15; i++) {
      const a = i < 6 ? [8, i] : i < 8 ? [8, i + 1] : i === 8 ? [7, 8] : [14 - i, 8];
      const b = i < 8 ? [SIZE - 1 - i, 8] : [8, SIZE - 15 + i];
      formatCells.push([a, b]);
      fixed[a[1]][a[0]] = true;
      fixed[b[1]][b[0]] = true;
    }
    const slots = [];
    for (let right = SIZE - 1, up = true; right >= 1; right -= 2, up = !up) {
      if (right === 6) right = 5;
      for (let v = 0; v < SIZE; v++) {
        const y = up ? SIZE - 1 - v : v;
        for (let d = 0; d < 2; d++) {
          if (!fixed[y][right - d]) slots.push([right - d, y]);
        }
      }
    }
    const MASKS = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
      (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
    ];
    function withMask(m) {
      const grid = base.map((row) => row.slice());
      slots.forEach(([x, y], i) => {
        const bit = i >> 3 < stream.length ? (stream[i >> 3] >> (7 - (i & 7))) & 1 : 0;
        grid[y][x] = bit ^ (MASKS[m](x, y) ? 1 : 0);
      });
      let rest = m << 10;
      for (let i = 14; i >= 10; i--) if ((rest >> i) & 1) rest ^= 0x537 << (i - 10);
      const format = ((m << 10) | rest) ^ 0x5412;
      formatCells.forEach(([a, b], i) => {
        const bit = (format >> i) & 1;
        grid[a[1]][a[0]] = bit;
        grid[b[1]][b[0]] = bit;
      });
      return grid;
    }
    function penalty(grid) {
      let score = 0, dark = 0;
      const line = (cells) => {
        let run = 1;
        for (let i = 1; i <= cells.length; i++) {
          if (i < cells.length && cells[i] === cells[i - 1]) run++;
          else {
            if (run >= 5) score += run - 2;
            run = 1;
          }
        }
        const text = cells.join('');
        score += 40 * ((text.match(/(?=10111010000)/g) || []).length + (text.match(/(?=00001011101)/g) || []).length);
      };
      for (let i = 0; i < SIZE; i++) {
        line(grid[i]);
        line(grid.map((row) => row[i]));
        dark += grid[i].reduce((s, c) => s + c, 0);
      }
      for (let y = 0; y < SIZE - 1; y++) {
        for (let x = 0; x < SIZE - 1; x++) {
          const c = grid[y][x];
          if (c === grid[y][x + 1] && c === grid[y + 1][x] && c === grid[y + 1][x + 1]) score += 3;
        }
      }
      return score + 10 * Math.floor(Math.abs(dark * 100 / (SIZE * SIZE) - 50) / 5);
    }
    let best = null, bestScore = Infinity;
    MASKS.forEach((_, m) => {
      const grid = withMask(m);
      const score = penalty(grid);
      if (score < bestScore) {
        best = grid;
        bestScore = score;
      }
    });
    return best;
  }
  function qrSvg(text) {
    const grid = qrMatrix(text);
    if (!grid) return '';
    const QUIET = 4;
    let path = '';
    grid.forEach((row, y) => row.forEach((dark, x) => { if (dark) path += `M${x + QUIET} ${y + QUIET}h1v1h-1z`; }));
    const side = grid.length + QUIET * 2;
    return `<svg viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges" role="img" aria-label="${tx('common.address')}"><path d="${path}"/></svg>`;
  }

  function openDeposit() {
    if (!T.wallet || T.wallet.readOnly) return;
    if (!netLogos.size) {
      CK.market.networks().then((list) => list.forEach((n) => { if (n.logo) netLogos.set(n.id, n.logo); }), () => {});
    }
    openFlow(depositNetStep(), null, HEIGHT.deposit);
  }
  function depositNetStep() {
    return {
      title: tx('action.deposit'),
      render(body, flow) {
        const nets = depositNets();
        body.innerHTML = `<div class="group w-nets">${nets.map((n, i) => `<button class="cell press-row w-netrow" type="button" data-i="${i}"><span class="w-netmark">${netLogo(n, 30)}</span><b class="w-netname"></b>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`).join('')}</div>`;
        Array.from(body.querySelectorAll('.w-netrow')).forEach((row, i) => { $('.w-netname', row).textContent = nets[i].name; });
        const onClick = (e) => {
          const row = e.target.closest('.w-netrow');
          if (!row) return;
          CK.haptic.selection();
          flow.push(depositStep({ net: nets[Number(row.dataset.i)].key, fixed: true }));
        };
        body.addEventListener('click', onClick);
        return () => body.removeEventListener('click', onClick);
      }
    };
  }
  const netLogos = new Map();
  const netIcon = (c) => {
    const logo = (window.DemoNets ? DemoNets.netMark(c.key) : null) || netLogos.get(c.key);
    return logo ? { id: 'net:' + c.key, sym: c.name, neutral: true, logo } : null;
  };
  const depositNets = () => [{ key: 'ton', name: 'TON', gas: D.byId.ton.sym, inst: netIcon({ key: 'ton', name: 'TON' }) || D.byId.ton }].concat(window.DemoNets ? DemoNets.chains().filter((c) => c.deposit !== false).map((c) => ({ key: c.key, name: c.name, gas: c.gas, inst: netIcon(c) || c.inst, net: c.net || null })) : []);
  const otherAddress = (net, unlock) => (net.net ? CK.wallet.netAddress(net.net, unlock ? { unlock: true } : undefined) : DemoNets.depositAddress(unlock));
  const netLogo = (n, size) => (n.inst ? CK.coinLogo(n.inst, size) : CK.coinLogo({ id: 'net:' + n.key, sym: n.name, neutral: true, logo: null }, size));
  function depositStep(state) {
    const netOf = () => depositNets().find((n) => n.key === state.net) || depositNets()[0];
    return {
      get title() { return state.fixed ? netOf().name : tx('action.deposit'); },
      render(body, flow) {
        const net = netOf();
        const isTon = net.key === 'ton';
        body.classList.add('w-deposit');
        body.innerHTML = `
          <div class="w-netchips" role="tablist" aria-label="${tx('xnet.pickNet')}"${state.fixed ? ' hidden' : ''}>${depositNets().map((n) => `<button class="w-chip press${n.key === net.key ? ' is-on' : ''}" type="button" role="tab" aria-selected="${n.key === net.key}" data-net="${esc(n.key)}">${esc(n.name)}</button>`).join('')}</div>
          <div class="w-qr"></div>
          <span class="wallet-address" aria-live="polite"></span>
          <p class="w-note"></p>
          <p class="w-note w-backup-note" role="alert" hidden></p>
          <button class="btn btn--wide press w-copy-address" type="button" disabled>${icon('copy', { size: 20 })}${tx('common.copy')}</button>`;
        $('.w-note', body).textContent = isTon ? tx('walletFlow.depositNote') : tx('xnet.depositNote', { net: net.name });
        const backupNote = $('.w-backup-note', body);
        backupNote.textContent = tx('walletFlow.depositBackup');
        backupNote.hidden = !CK.wallet.status.backupFailing;
        const copy = $('.w-copy-address', body);
        const shown = $('.wallet-address', body);
        let friendly = '', gone = false;
        const qr = $('.w-qr', body);
        const fadeIn = (el) => { if (el && el.animate && !reduced()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); };
        const showAddress = (text) => {
          friendly = text;
          shown.textContent = text;
          qr.classList.remove('is-failed');
          qr.innerHTML = qrSvg(text);
          fadeIn(qr.firstElementChild);
          fadeIn(shown);
          copy.disabled = false;
          copy.dataset.way = 'copy';
          copy.innerHTML = `${icon('copy', { size: 20 })}${tx('common.copy')}`;
        };
        const failAddress = (err) => {
          console.error(err);
          if (gone) return;
          shown.textContent = tx('walletFlow.noAddress');
          qr.classList.add('is-failed');
          copy.disabled = false;
          copy.dataset.way = 'retry';
          copy.textContent = tx('common.retry');
        };
        copy.addEventListener('click', () => {
          if (copy.dataset.way === 'retry') {
            CK.haptic.light();
            fetchAddress();
            return;
          }
          if (copy.dataset.way === 'unlock') {
            unlockEvm();
            return;
          }
          if (friendly) copyWithToast(friendly);
        });
        const chips = $('.w-netchips', body);
        chips.addEventListener('click', (e) => {
          const chip = e.target.closest('[data-net]');
          if (!chip || chip.dataset.net === net.key) return;
          CK.haptic.selection();
          state.net = chip.dataset.net;
          flow.replace(depositStep(state));
        });
        const on = $('.w-chip.is-on', chips);
        if (on) chips.scrollLeft = Math.max(0, on.offsetLeft - 16);
        function unlockEvm() {
          copy.disabled = true;
          otherAddress(net, true).then((evm) => {
            if (gone) return;
            if (evm) showAddress(evm);
            else copy.disabled = false;
          }, (err) => {
            if (gone) return;
            if (!CK.wallet.isRejection(err)) console.error(err);
            copy.disabled = false;
          });
        }
        function fetchAddress() {
          shown.textContent = '';
          qr.classList.remove('is-failed');
          copy.disabled = true;
          copy.dataset.way = 'copy';
          copy.innerHTML = `${icon('copy', { size: 20 })}${tx('common.copy')}`;
          if (isTon) {
            CK.wallet.depositAddress().then((own) => {
              if (gone) return;
              if (!T.wallet || own.address !== T.wallet.address) throw new Error('address_mismatch');
              if (T.wallet.readOnly || own.verified !== true) throw new Error('address_unverified');
              showAddress(own.friendly);
            }).catch(failAddress);
          } else {
            otherAddress(net, false).then((evm) => {
              if (gone) return;
              if (evm) {
                showAddress(evm);
                return;
              }
              shown.textContent = '—';
              copy.dataset.way = 'unlock';
              copy.disabled = !!(T.wallet && T.wallet.readOnly);
              copy.textContent = tx('xnet.showAddress');
            }, failAddress);
          }
        }
        fetchAddress();
        return () => { gone = true; };
      }
    };
  }

  let sending = null, pollTimer = 0, statusBody = null, statusSheet = null;
  let handingOver = false, handedResult = null;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { } }
  };
  const openKey = () => (T.wallet && CK.wallet.wallets.isExtra(T.wallet.address) ? `${OPEN_KEY}:${T.wallet.address}` : OPEN_KEY);
  function saveSend() {
    if (sending) store.set(openKey(), JSON.stringify(sending));
    else store.del(openKey());
  }
  function loadSend() {
    const text = store.get(openKey());
    if (!text) return null;
    try {
      const rec = JSON.parse(text);
      if (rec && typeof rec.wallet === 'string' && typeof rec.phase === 'string' && Number.isInteger(rec.seqno) && Number.isInteger(rec.validUntil) && typeof rec.units === 'string' && typeof rec.sym === 'string' && Number.isInteger(rec.decimals) && typeof rec.to === 'string') return rec;
    } catch (_) { }
    store.del(openKey());
    return null;
  }
  const pastValid = (rec, grace) => Math.floor(Date.now() / 1000) > rec.validUntil + grace;
  const STATES = {
    sending: { title: 'walletFlow.sending', text: '', mark: 'spin' },
    sent: { title: 'walletFlow.sending', text: '', mark: 'spin' },
    unsure: { title: 'swapSheet.unsure', text: 'walletFlow.unsureText', mark: 'info', tone: 'hint' },
    success: { title: 'walletFlow.sentTitle', text: '', mark: 'check-circle', tone: 'up', final: true },
    rejected: { title: 'swapSheet.rejected', text: 'swapSheet.fundsKept', mark: 'close-circle', tone: 'down', final: true },
    expired: { title: 'walletFlow.expired', text: 'swapSheet.fundsKept', mark: 'info', tone: 'hint', final: true }
  };
  function paintStatus(rec) {
    if (!statusSheet) return;
    const sig = `${rec.phase}|${rec.hash || ''}`;
    if (statusBody.dataset.sig === sig) return;
    statusBody.dataset.sig = sig;
    const view = STATES[rec.phase] || STATES.expired;
    const head = $('.sw-state', statusBody);
    head.dataset.tone = view.tone || 'accent';
    const mark = $('.sw-state-mark', head);
    if (mark.dataset.mark !== view.mark) {
      mark.dataset.mark = view.mark;
      mark.className = `sw-state-mark${view.final ? ' receipt-pop' : ''}`;
      mark.innerHTML = view.mark === 'spin' ? '<i class="sw-spin"></i>' : icon(view.mark, { fill: true, size: 40 });
    }
    $('.sw-state-title', head).textContent = tx(view.title);
    $('.w-st-amount', head).textContent = `${D.qty(T.fromUnits(BigInt(rec.units), rec.decimals))} ${rec.sym}`;
    $('.w-st-to', head).textContent = `${tx('walletFlow.recipient')} ${rec.to.slice(0, 6)}…${rec.to.slice(-6)}`;
    const text = $('.sw-state-text', head);
    text.textContent = view.text ? tx(view.text) : '';
    text.hidden = !view.text;
    $('.sw-actions', statusBody).innerHTML = `
        <button class="btn btn--wide press sw-done" type="button"></button>
        <button class="btn btn--tinted press sw-open" type="button" aria-label="${tx('swap.explorer')}" title="${tx('swap.explorer')}">${icon('arrow-up-right', { size: 22 })}</button>`;
    const done = $('.sw-done', statusBody);
    done.textContent = tx(view.final ? 'common.done' : 'nav.close');
    done.classList.toggle('btn--tinted', !view.final);
    done.addEventListener('click', () => statusSheet.close());
    $('.sw-open', statusBody).addEventListener('click', () => {
      T.openLink(HEX_HASH.test(rec.hash || '') ? `${EXPLORER}transaction/${rec.hash}` : EXPLORER + rec.wallet);
    });
  }
  function openStatus(shown) {
    const rec = shown || sending;
    if (CK.sheet.top || !rec) return;
    CK.sheet.open({
      title: tx('walletFlow.sending'),
      detents: [CK.sheet.fixedDetent(HEIGHT.status + safeBottom())],
      onClose() {
        statusBody = null;
        statusSheet = null;
      },
      build(body, sheet) {
        statusBody = body;
        statusSheet = sheet;
        body.classList.add('sw-status', 'w-status');
        $('.sheet-title', sheet.el).textContent = '';
        body.innerHTML = `
          <div class="sw-state w-st"><span class="sw-state-mark"></span><b class="sw-state-title"></b><b class="w-st-amount"></b><span class="w-st-to"></span><span class="sw-state-text" hidden></span></div>
          <div class="sw-actions"></div>`;
        paintStatus(rec);
      }
    });
  }
  function finishSend(phase) {
    if (!sending) return;
    clearTimeout(pollTimer);
    const done = { ...sending, phase };
    sending = null;
    saveSend();
    if (phase === 'success') CK.haptic.success();
    else CK.haptic.error();
    if (statusSheet) paintStatus(done);
    else if (handingOver) handedResult = done;
    else CK.toast(tx(STATES[phase].title), { icon: phase === 'success' ? 'check-circle' : 'warning', tone: phase === 'success' ? 'up' : 'down' });
    accountChanged();
  }
  function setPhase(rec, phase) {
    rec.phase = phase;
    saveSend();
    if (statusSheet) paintStatus(rec);
  }
  function followSend() {
    clearTimeout(pollTimer);
    const rec = sending;
    if (!rec) return;
    const again = () => {
      if (pollOf !== rec) {
        pollOf = rec;
        pollStep = 0;
      }
      if (sending === rec) pollTimer = setTimeout(followSend, rec.phase === 'sent' ? POLL_FIRST_MS[pollStep++] || POLL_MS : POLL_MS);
    };
    T.api('wallet/state?address=' + encodeURIComponent(rec.wallet)).then((chain) => {
      if (sending !== rec) return undefined;
      if (!Number.isInteger(chain.seqno)) {
        again();
        return undefined;
      }
      if (chain.seqno > rec.seqno) {
        finishSend('success');
        return undefined;
      }
      if (pastValid(rec, EXPIRY_MARGIN_S + (rec.phase === 'sent' ? LOST_GRACE_S : 0))) {
        finishSend('expired');
        return undefined;
      }
      if (rec.phase === 'sent') {
        again();
        return undefined;
      }
      return CK.wallet.resend().then((sent) => {
        if (sending !== rec) return;
        if (sent) setPhase(rec, 'sent');
        again();
      });
    }).catch((err) => {
      if (sending !== rec) return;
      if (CK.wallet.neverSent(err)) finishSend('rejected');
      else again();
    });
  }
  function paidAddresses(wallet) {
    try {
      const list = JSON.parse(store.get(PAID_KEY + wallet) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }
  function rememberPaid(wallet, to) {
    const raw = T.rawAddress(to);
    if (raw) store.set(PAID_KEY + wallet, JSON.stringify([raw, ...paidAddresses(wallet).filter((a) => a !== raw)].slice(0, PAID_KEPT)));
  }
  function sendNotice(asset, units, to, user) {
    if (!asset || typeof units !== 'bigint' || units <= 0n || !Number.isInteger(asset.decimals)) return null;
    const text = units.toString().padStart(asset.decimals + 1, '0');
    const cut = text.length - asset.decimals;
    const part = text.slice(cut).replace(/0+$/, '');
    const notice = { kind: 'withdrawal', symbol: String(asset.sym || ''), amount: part ? `${text.slice(0, cut)}.${part}` : text.slice(0, cut) };
    const found = user && user.phase === 'found' && user.found ? user.found : null;
    if (found && found.friendly === to && typeof found.username === 'string' && found.username) notice.username = found.username;
    return notice;
  }
  function startSend(rec, boc, notice = null) {
    sending = rec;
    rememberPaid(rec.wallet, rec.to);
    saveSend();
    accountChanged();
    CK.wallet.broadcast(boc, notice).then((sent) => {
      if (sending !== rec) return;
      if (!rec.hash) rec.hash = sent.hash;
      setPhase(rec, 'sent');
      followSend();
    }, (err) => {
      if (sending !== rec) return;
      if (CK.wallet.neverSent(err)) {
        console.error(err);
        finishSend('rejected');
        return;
      }
      setPhase(rec, 'unsure');
      followSend();
    });
  }
  function resumeSend() {
    if (sending || !T.wallet) return;
    const rec = loadSend();
    if (!rec) return;
    if (rec.wallet !== T.wallet.address) {
      if (pastValid(rec, EXPIRY_MARGIN_S + LOST_GRACE_S)) store.del(openKey());
      return;
    }
    if (rec.phase === 'sending') rec.phase = 'unsure';
    sending = rec;
    followSend();
    if (!CK.sheet.top) openStatus();
  }

  function jettonWalletProblem(lib, asset, rows, owner, recipient) {
    if (!asset.wallet) return 'missing';
    const pinned = new Map(CK.swapAudit.masters().map((master) => [master, CK.swapAudit.jettonWalletOf(lib, master, owner)]));
    if (pinned.has(asset.id)) return pinned.get(asset.id) === asset.wallet ? null : 'pinned';
    const proven = CK.swapAudit.provenWalletOf(lib, asset.id, owner);
    if (proven) return proven === asset.wallet ? null : 'pinned';
    if ([...pinned.values()].includes(asset.wallet)) return 'other_asset';
    if (rows.some((r) => r !== asset && r.wallet === asset.wallet)) return 'shared';
    if (asset.wallet === owner || asset.wallet === recipient) return 'self';
    return null;
  }
  function isContractRecipient(rows, recipient, lib, owner) {
    const masters = CK.swapAudit.masters();
    const pins = CK.swapAudit.pins();
    if (masters.includes(recipient) || pins.v1.includes(recipient) || pins.v2.flat().includes(recipient)) return true;
    if ((rows || []).some((row) => row.id === recipient || row.wallet === recipient)) return true;
    return !!lib && masters.some((master) => CK.swapAudit.jettonWalletOf(lib, master, owner) === recipient);
  }

  function jettonWalletConfirmed(asset, owner) {
    if (CK.swapAudit.orderable(asset.id)) return Promise.resolve(true);
    return T.api('wallet/jetton-wallet?address=' + encodeURIComponent(owner) + '&token=' + encodeURIComponent(asset.id)).then(
      (body) => T.rawAddress(body.token) === asset.id && T.rawAddress(body.wallet) === asset.wallet,
      (err) => {
        if (err.message === 'wallet_disagree') return false;
        throw err;
      }
    );
  }

  const SIGN_ERRORS = {
    insufficient_gas: 'swap.noGasShort', frozen: 'swapSheet.frozen', pending: 'swapSheet.pendingLock', busy: 'swapSheet.pendingLock',
    biometric_denied: 'swapSheet.bioDenied', biometric_lost: 'swapSheet.bioLost', biometric_unknown: 'wallet.bioWait', no_secret: 'swapSheet.noSign', no_secure_storage: 'swapSheet.noSign', password_needed: 'swapSheet.noSign',
    bad_intent: 'swapSheet.stopped', bad_address: 'swapSheet.stopped', address_mismatch: 'swapSheet.stopped'
  };

  function openWithdraw(preset) {
    const tron = !!preset && typeof preset === 'object' && preset.chain === 'tron';
    if (!T.wallet || T.wallet.readOnly) {
      if (tron && T.wallet) CK.toast(tx('wallet.readOnly'), { icon: 'info' });
      return false;
    }
    if (sending) {
      openStatus();
      return false;
    }
    if (DemoSwap.pending) {
      DemoSwap.openTrack();
      return false;
    }
    let handing = null;
    const netsRead = window.DemoNets ? DemoNets.loadBalances() : Promise.resolve();
    const ton = { rows: null, fresh: false, since: Date.now(), asset: null, picked: false, units: 0n, pct: 0, text: '', address: '', memo: '', touched: false, sending: false, note: '', trouble: null, user: null, dns: null, walletAt: T.wallet.address };
    const filled = preset && typeof preset === 'object' && (preset.asset === 'gram' || preset.asset === 'usdt') && typeof preset.units === 'bigint' && typeof preset.to === 'string';
    if (filled) {
      ton.prefer = preset.asset === 'usdt' ? USDT_RAW : NATIVE;
      ton.units = preset.units;
      ton.text = unitsText(preset.units, preset.asset === 'usdt' ? 6 : TON_DECIMALS);
      ton.address = preset.to;
      ton.picked = true;
    }
    const tronRow = tron && preset.row && typeof preset.row === 'object' && preset.row.chain === 'tron' ? preset.row : null;
    if (tron && !tronRow) ton.autoNet = 'tron';
    const known = knownRows();
    if (known) takeTonRows(ton, known);
    const flow = openFlow(withdrawNetStep(ton, netsRead, (rec) => { handing = rec; }), () => {
      if (!handing) return;
      const result = handedResult;
      handingOver = false;
      handedResult = null;
      openStatus(result);
    }, HEIGHT.withdraw);
    if (flow && filled) flow.push(withdrawStep(ton, (rec) => { handing = rec; }));
    else if (flow && tronRow && window.DemoNets) flow.push(DemoNets.withdrawStep(tronRow));
    return !!flow;
  }
  function takeTonRows(st, rows) {
    const was = st.asset;
    const same = was && rows.find((r) => r.id === was.id && r.decimals === was.decimals);
    st.rows = rows;
    const preferred = !was && st.prefer ? rows.find((r) => r.id === st.prefer && r.units > 0n) : null;
    if (preferred) {
      st.asset = preferred;
      return false;
    }
    if (!was || same) {
      st.asset = same || firstHeld(rows);
      return false;
    }
    const chosen = st.picked || st.units > 0n || st.text !== '';
    st.asset = rows.find((r) => r.id === was.id) || (chosen ? { ...was, units: 0n, wallet: null } : firstHeld(rows));
    if (st.asset && st.asset.id === was.id && st.asset.decimals === was.decimals) return false;
    st.units = 0n;
    st.pct = 0;
    st.text = '';
    return true;
  }
  const netMarkOf = (key) => {
    const mark = netIcon({ key, name: key });
    return mark ? mark.logo : null;
  };
  const livePrice = (inst) => (!inst ? 0 : inst.isToken ? (inst.price > 0 ? inst.price : 0) : inst.priced === true && inst.price > 0 ? inst.price : 0);
  function withdrawNetStep(ton, netsRead, handOff) {
    return {
      title: tx('action.withdraw'),
      render(body, flow) {
        const nets = [{ key: 'ton', name: 'TON' }].concat(window.DemoNets ? DemoNets.chains().map((c) => ({ key: c.key, name: c.name })) : []);
        body.classList.add('w-netstep');
        body.innerHTML = `<div class="group list--free w-nets">${nets.map((n, i) => `<button class="cell press-row w-netrow" type="button" data-i="${i}"><span class="w-netmark"></span><b class="w-netname"></b><span class="w-netheld"></span></button>`).join('')}</div>
          <button class="fold-toggle w-nets-toggle" type="button" aria-expanded="false" aria-controls="w-nets-more" hidden><span class="w-nets-count"></span>${icon('chevron-down', { size: 16 })}</button>
          <div class="group list--free w-nets w-nets-more" id="w-nets-more" hidden></div>`;
        const list = $('.w-nets', body), more = $('.w-nets-more', body), toggle = $('.w-nets-toggle', body);
        const rows = Array.from(list.querySelectorAll('.w-netrow'));
        let chequeRow = null;
        if (window.DemoCheques && CK.wallet.status.kind === 'signer') {
          chequeRow = CK.el(`<button class="cell press-row w-netrow w-netrow--cheque" type="button" data-cheque><span class="w-netmark">${CK.tile('gift', { tone: 'blue' })}</span><b class="w-netname"></b>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`);
          $('.w-netname', chequeRow).textContent = tx('cheque.row');
        }
        rows.forEach((row, i) => { $('.w-netname', row).textContent = nets[i].name; });
        const same = (el, want) => {
          const have = el.children ? Array.from(el.children) : null;
          return !!have && have.length === want.length && have.every((child, i) => child === want[i]);
        };
        function place(folded, absent) {
          const main = rows.slice(0, 1).concat(chequeRow ? [chequeRow] : [], rows.filter((row, i) => i > 0 && !absent[i] && !folded[i]));
          const rest = rows.filter((row, i) => i > 0 && !absent[i] && folded[i]);
          if (!same(list, main)) list.replaceChildren(...main);
          if (!same(more, rest)) more.replaceChildren(...rest);
          toggle.hidden = !rest.length;
          const open = !!ton.netsOpen && rest.length > 0;
          more.hidden = !open;
          toggle.setAttribute('aria-expanded', String(open));
          const count = tx('withdraw.otherNets', { n: rest.length });
          const label = $('.w-nets-count', toggle);
          if (label.textContent !== count) label.textContent = count;
        }
        let gone = false, retry = 0, othersKnown = false;
        function paintMarks() {
          rows.forEach((row, i) => {
            const logo = netMarkOf(nets[i].key) || '';
            const slot = $('.w-netmark', row);
            if (slot.dataset.logo === logo && slot.firstChild) return;
            slot.dataset.logo = logo;
            slot.innerHTML = CK.coinLogo({ id: 'net:' + nets[i].key, sym: nets[i].name, neutral: true, logo: logo || null }, 30);
          });
        }
        function assetsOn(key) {
          if (key === 'ton') return ton.rows ? ton.rows.filter((r) => r.units > 0n) : null;
          const list = DemoNets.held().filter((r) => r.chain === key).map((r) => ({ ...r, id: `${r.chain}:${r.address}`, logo: null, net: null }));
          return list.length || othersKnown || DemoNets.nativeWei(key) !== undefined ? list : null;
        }
        function heldText(list) {
          const usd = list.reduce((sum, a) => sum + T.fromUnits(a.units, a.decimals) * livePrice(a.inst || (a.chain ? null : D.coinOfAddress(a.id))), 0);
          return usd >= .01 ? fmt.usd(usd) : list.length === 1 ? qtySym(list[0].units, list[0]) : '';
        }
        function keptText(name) {
          const lines = D.holdings().filter((h) => h.net === name && h.risk !== 'suspicious');
          if (!lines.length) return '';
          const usd = lines.reduce((sum, h) => sum + (h.priced ? h.usd : 0), 0);
          return usd >= .01 ? fmt.usd(usd) : qtySym(lines[0].units, { sym: lines[0].coin.sym, decimals: lines[0].decimals });
        }
        function paint() {
          const folded = [], absent = [];
          rows.forEach((row, i) => {
            const list = assetsOn(nets[i].key);
            absent[i] = nets[i].key === 'tron' && !(list && list.length) && !keptText(nets[i].name);
            const quiet = !!list && !list.length;
            row.classList.toggle('is-quiet', quiet);
            row.setAttribute('aria-disabled', String(quiet));
            const held = $('.w-netheld', row);
            const text = list && list.length ? heldText(list) : !list && nets[i].key !== 'ton' ? keptText(nets[i].name) : '';
            held.classList.toggle('is-wait', !list && !text);
            if (held.textContent !== text) held.textContent = text;
            folded[i] = i > 0 && !(list && list.length) && !text;
          });
          place(folded, absent);
        }
        function loadTon() {
          clearTimeout(retry);
          loadRows(ton.since).then((list) => {
            if (gone) return;
            ton.fresh = true;
            takeTonRows(ton, list);
            paint();
          }, (err) => {
            if (gone) return;
            console.error(err);
            retry = setTimeout(loadTon, BALANCE_RETRY_MS);
          });
        }
        const onClick = (e) => {
          if (e.target.closest('[data-cheque]')) {
            CK.haptic.selection();
            flow.push(DemoCheques.createStep({ rows: ton.rows }));
            return;
          }
          if (e.target.closest('.w-nets-toggle')) {
            CK.haptic.selection();
            ton.netsOpen = !ton.netsOpen;
            paint();
            return;
          }
          const row = e.target.closest('.w-netrow');
          if (!row) return;
          const net = nets[Number(row.dataset.i)];
          const list = assetsOn(net.key);
          const empty = () => CK.toast(tx('withdraw.netEmpty', { net: net.name }), { icon: 'info' });
          if (net.key === 'ton') {
            if (list && !list.length) return empty();
            CK.haptic.selection();
            flow.push(withdrawStep(ton, handOff));
            return;
          }
          if (list && !list.length) return empty();
          if (!list) return;
          CK.haptic.selection();
          openAssets(net, list);
        };
        function openAssets(net, list) {
          if (list.length === 1) flow.push(DemoNets.withdrawStep(list[0]));
          else flow.push(pickerStep({ title: net.name, list, onPick: (next, f) => f.push(DemoNets.withdrawStep(next)) }));
        }
        function openAsked() {
          const key = ton.autoNet;
          ton.autoNet = null;
          const net = key ? nets.find((n) => n.key === key) : null;
          const list = net ? assetsOn(net.key) : null;
          if (list && list.length) openAssets(net, list);
        }
        body.addEventListener('click', onClick);
        CK.i18n.bind($('.w-nets', body), paint);
        const stopNets = window.DemoNets ? DemoNets.onChange(paint) : () => {};
        netsRead.then(() => {
          othersKnown = true;
          if (gone) return;
          paint();
          openAsked();
        });
        if (!netLogos.size && nets.some((n) => !netMarkOf(n.key))) {
          CK.market.networks().then((list) => {
            list.forEach((n) => { if (n.logo) netLogos.set(n.id, n.logo); });
            if (!gone) paintMarks();
          }, () => {});
        }
        const stopFolio = D.onBalances(() => {
          const known = !gone && !ton.fresh && !ton.sending ? knownRows() : null;
          if (known) takeTonRows(ton, known);
          if (!gone) paint();
        });
        paintMarks();
        paint();
        if (!ton.fresh) loadTon();
        return () => {
          gone = true;
          ton.autoNet = null;
          clearTimeout(retry);
          stopNets();
          stopFolio();
          body.removeEventListener('click', onClick);
        };
      }
    };
  }
  function withdrawStep(state, handOff) {
    return {
      title: tx('action.withdraw'),
      render(body, flow) {
        body.classList.add('tk-order', 'sw-order', 'w-send');
        body.innerHTML = `
          <div class="w-card">
            <div class="w-card-top w-card-top--max"><button class="w-max press" type="button" aria-label="${tx('common.max')}">${icon('wallet', { size: 16 })}<b class="w-from-bal"></b></button></div>
            <div class="w-card-main"><button class="w-token press w-pick-asset" type="button" aria-label="${tx('exchange.pickGiveAria')}"></button><input class="w-amt w-qty" inputmode="decimal" autocomplete="off" placeholder="0" aria-label="${tx('common.amount')}"></div>
          </div>
          <div class="tk-order-slider"></div>
          <div class="w-addr-wrap"><textarea class="w-addr" rows="2" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="128" placeholder="${tx('withdraw.addressOrUser')}" aria-label="${tx('withdraw.addressAria')}"></textarea><button class="w-book-open press" type="button" aria-label="${tx('book.title')}" hidden>${icon('users', { size: 20 })}</button></div>
          <div class="w-dir" hidden></div>
          <div class="w-dir-menu" hidden><button class="w-tool w-dir-share press" type="button">${icon('share', { size: 16 })}<span>${tx('withdraw.userInvite')}</span></button></div>
          <input class="w-memo" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="${MEMO_MAX}" placeholder="${tx('withdraw.memo')}" aria-label="${tx('withdraw.memo')}" hidden>
          <div class="w-addr-tools"><button class="w-tool w-memo-add press" type="button">${icon('plus', { size: 16 })}<span>${tx('withdraw.memoAdd')}</span></button><button class="w-tool w-book-save press" type="button" hidden>${icon('plus', { size: 16 })}<span>${tx('book.save')}</span></button></div>`;
        const dock = CK.el(`<div class="sheet-dock sw-dock">
          <p class="sw-line" role="status"></p>
          <div class="tk-swipe"></div>
          <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
        </div>`);
        flow.sheet.el.appendChild(dock);
        const input = $('.w-qty', body), addr = $('.w-addr', body), chip = $('.w-pick-asset', body), userCard = $('.w-dir', body), memoEl = $('.w-memo', body);
        const bookOpen = $('.w-book-open', body), bookSave = $('.w-book-save', body), memoAdd = $('.w-memo-add', body), maxBtn = $('.w-max', body);
        const userMenu = $('.w-dir-menu', body);
        $('.w-dir-share', userMenu).addEventListener('click', () => invite());
        const paintMemo = () => {
          const open = !!state.memoOpen || !!state.memo;
          if (memoEl.hidden === open) memoEl.hidden = !open;
          if (memoAdd.hidden !== open) memoAdd.hidden = open;
        };
        memoAdd.addEventListener('click', () => {
          CK.haptic.selection();
          state.memoOpen = true;
          paintMemo();
          memoEl.focus({ preventScroll: true });
        });
        const lineEl = $('.sw-line', dock), swipeHost = $('.tk-swipe', dock), passBox = $('.sw-pass', dock), passInput = $('.sw-pass-input', dock);
        const swipe = CK.swipeConfirm(swipeHost, { tone: 'accent', label: '', onConfirm: confirm, resetAfter: 60000, reportsOwnResult: true });
        let passDone = null, retry = 0, gone = false;
        passBox.addEventListener('submit', (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });

        const gram = () => (state.rows ? state.rows.find((r) => r.id === NATIVE) || null : null);
        const GASLESS_LOOK_MS = 600;
        const GASLESS_FRESH_S = 45;
        const GASLESS_RETRY_MS = 8000;
        let gaslessTimer = 0, gaslessRun = 0;
        const gaslessWanted = () => {
          const a = state.asset, g = gram();
          return !!a && a.id === USDT_RAW && a.units > 0n && !!a.wallet && !state.memo && (!g || g.units < JETTON_NEEDS) && !!CK.wallet.gasless;
        };
        const gaslessReady = () => !!state.gasless && state.gasless.phase === 'ready' && state.gasless.key === gaslessKey();
        function gaslessKey() {
          const a = state.asset, typed = recipient();
          if (!gaslessWanted() || !typed || state.units <= 0n || state.units > a.units) return null;
          if (T.wallet && typed.address === T.wallet.address) return null;
          if (isContractRecipient(state.rows, typed.address)) return null;
          return `${state.walletAt || ''}|${a.wallet}|${typed.address}|${state.units}`;
        }
        const exactSym = (units, asset) => `${unitsText(units, asset.decimals)} ${asset.sym}`;
        function gaslessPhaseOf(err) {
          const reason = err && err.code === 'gasless_refused' ? err.reason : null;
          if (reason === 'commission_high') return 'high';
          if (reason === 'balance') return 'short';
          if (err && (err.code === 'gasless_unavailable' || reason === 'refused' || reason === 'valid_until')) return 'fail';
          return err && err.code === 'gasless_refused' ? 'stop' : 'fail';
        }
        function refreshGasless() {
          const key = state.sending ? null : gaslessKey();
          if (!key) {
            if (!state.sending && state.gasless && !gaslessWanted()) state.gasless = null;
            return;
          }
          if (state.gasless && state.gasless.key === key) return;
          clearTimeout(gaslessTimer);
          const run = ++gaslessRun;
          state.gasless = { key, phase: 'look', quote: null, changed: false };
          const a = state.asset, typed = recipient();
          gaslessTimer = setTimeout(() => {
            CK.wallet.gasless.quote({ to: a.wallet, recipient: typed.friendly, units: state.units.toString() }, { wallet: state.walletAt }).then((quote) => {
              if (gone || run !== gaslessRun) return;
              state.gasless = { key, phase: quote.gasless ? 'ready' : 'off', quote: quote.gasless ? quote : null, changed: false };
              paint();
            }, (err) => {
              if (gone || run !== gaslessRun) return;
              console.warn('gasless quote:', err.code || err.message, err.reason || '');
              state.gasless = { key, phase: gaslessPhaseOf(err), quote: null, changed: false };
              paint();
              if (state.gasless.phase === 'fail') {
                gaslessTimer = setTimeout(() => {
                  if (gone || run !== gaslessRun || !state.gasless || state.gasless.key !== key || state.sending) return;
                  state.gasless = null;
                  paint();
                }, GASLESS_RETRY_MS);
              }
            });
          }, GASLESS_LOOK_MS);
        }
        function gaslessLine() {
          if (!gaslessWanted()) return null;
          const g = state.gasless;
          if (!g || g.key !== gaslessKey()) return null;
          if (g.phase === 'look') return { key: 'withdraw.gaslessLooking', tone: 'note' };
          if (g.phase === 'ready') return { key: g.changed ? 'withdraw.gaslessFeeNew' : 'withdraw.gaslessFee', tone: 'note', params: { amount: exactSym(g.quote.commission, state.asset) } };
          if (g.phase === 'off') return null;
          return { key: { high: 'withdraw.gaslessHigh', short: 'withdraw.gaslessShort', stop: 'swapSheet.stopped' }[g.phase] || 'withdraw.gaslessFail', tone: 'bad' };
        }
        const maxUnits = () => {
          const a = state.asset;
          if (!a) return 0n;
          if (a.id !== NATIVE) {
            const quote = gaslessWanted() && state.gasless && state.gasless.quote;
            return quote && a.units > quote.commission ? a.units - quote.commission : a.units;
          }
          return a.units > MAX_KEEP ? a.units - MAX_KEEP : 0n;
        };
        const noGas = () => {
          const a = state.asset, g = gram();
          if (!a) return false;
          if (a.id === NATIVE) return a.units > 0n && maxUnits() <= 0n;
          if (gaslessWanted()) return false;
          return a.units > 0n && (!g || g.units < JETTON_NEEDS);
        };
        function setLine(key, tone, params) {
          const text = key ? tx(key, params) : '';
          if (lineEl.textContent !== text) lineEl.textContent = text;
          lineEl.dataset.tone = tone || 'bad';
        }
        const heldRows = () => (state.rows ? state.rows.filter((r) => r.units > 0n) : []);
        function paintChip() {
          const a = state.asset;
          chip.disabled = !heldRows().some((r) => r !== a);
          const shape = a ? `${a.id}|${a.logo || ''}|${chip.disabled}` : 'wait';
          if (chip.dataset.shape !== shape) {
            chip.dataset.shape = shape;
            chip.innerHTML = a ? `${logoOf(a, 28)}<b></b>${chip.disabled ? '' : icon('chevron-down', { size: 16 })}` : '<span class="w-skel w-skel-dot"></span><b class="w-skel w-skel-text">&nbsp;</b><span class="w-skel-chev"></span>';
          }
          if (a) $(':scope > b', chip).textContent = a.sym;
        }
        function paint() {
          const a = state.asset;
          const bal = $('.w-from-bal', body);
          bal.classList.toggle('w-skel-bal', !a);
          bal.textContent = a ? qtySym(a.units, a) : '';
          maxBtn.disabled = !a || !!state.sending;
          const typed = recipient();
          const user = state.user, dns = state.dns;
          const badAddress = !user && !dns && !!state.address && !typed;
          const memoBad = a ? memoProblem(a.id, state.memo) : null;
          takeRisk(typed);
          const risk = state.risk && typed && state.risk.address === typed.address && state.risk.phase === 'done' ? state.risk : null;
          const memoNeeded = !!risk && risk.memoRequired && !state.memo;
          const lookalike = typed ? lookalikeOf(typed.address) : null;
          paintBook(typed);
          paintMemo();
          const own = !!typed && !!T.wallet && typed.address === T.wallet.address;
          const contract = !!typed && isContractRecipient(state.rows, typed.address);
          const noPath = !!a && a.id !== NATIVE && a.units > 0n && !a.wallet && state.fresh;
          const over = !!a && state.units > maxUnits();
          refreshGasless();
          let line = '';
          if (state.note) setLine(state.note, 'note');
          else {
            if (state.trouble) line = state.trouble;
            else if (noPath) line = 'walletFlow.noJettonWallet';
            else if (a && noGas()) line = 'swap.noGasShort';
            else if (over) line = state.units <= a.units ? (gaslessWanted() ? 'withdraw.gaslessShort' : 'swap.noGasShort') : 'walletFlow.overBalance';
            else if (own) line = 'walletFlow.ownAddress';
            else if (contract) line = 'xnet.contractAddress';
            else if (badAddress && state.touched) line = 'walletFlow.badAddress';
            else if (dns && dns.phase === 'none') line = 'withdraw.dnsNone';
            else if (dns && dns.phase === 'fail') line = 'withdraw.dnsFail';
            else if (memoBad) line = memoBad;
            else if (memoNeeded) line = 'withdraw.memoNeeded';
            else if (risk && risk.scam) line = 'withdraw.scam';
            else if (lookalike) line = 'withdraw.lookalike';
            else if (user && user.phase === 'bad' && state.touched) line = 'withdraw.userBad';
            else if (user && user.phase === 'fail') line = USER_FAILS[user.code] || 'withdraw.userFail';
            const fee = line ? null : gaslessLine();
            if (fee && fee.tone === 'bad') line = fee.key;
            if (!line && fee) setLine(fee.key, 'note', fee.params);
            else if (!line && user && user.phase === 'found' && user.found.keyChanged) setLine('withdraw.userKeyChanged', 'note');
            else if (!line && user && user.phase === 'found') setLine('send.nameShown', 'note');
            else if (!line && risk && risk.label) setLine('withdraw.knownAs', 'note', { name: risk.label });
            else setLine(line);
          }
          let label = 'withdraw.swipe';
          if (!state.rows) label = 'swap.waitBalance';
          else if (!a || maxUnits() <= 0n) label = 'order.notHeld';
          else if (user && !typed) label = user.phase === 'look' ? 'withdraw.userLooking' : user.phase === 'wait' ? 'withdraw.needUser' : 'withdraw.checkUser';
          else if (dns && !typed) label = dns.phase === 'look' ? 'withdraw.dnsLooking' : 'withdraw.checkAddress';
          else if (!state.address) label = 'withdraw.needAddress';
          else if (badAddress || own || contract) label = 'withdraw.checkAddress';
          else if (memoBad) label = 'withdraw.checkMemo';
          else if (memoNeeded) label = 'withdraw.needMemo';
          else if (state.units <= 0n) label = 'order.needAmount';
          const gaslessHeld = gaslessWanted() && !(gaslessReady() || (!!state.gasless && state.gasless.phase === 'off' && state.gasless.key === gaslessKey()));
          swipe.setDisabled(label !== 'withdraw.swipe' || noPath || noGas() || over || gaslessHeld || state.sending);
          const total = label === 'withdraw.swipe' && gaslessReady() ? state.gasless.quote.total : null;
          swipe.update({ label: total ? tx('withdraw.swipeTotal', { amount: exactSym(total, a) }) : tx(label) });
        }
        const slider = CK.slider($('.tk-order-slider', body), {
          label: tx('order.shareAria'), min: 0, max: 100, step: .5, value: state.pct,
          stops: [.25, .5, .75, 1],
          format: (v) => (state.asset ? qtySym(maxUnits() * BigInt(Math.round(v * 10)) / 1000n, state.asset) : ''),
          onInput(v) {
            state.pct = v;
            state.units = maxUnits() * BigInt(Math.round(v * 10)) / 1000n;
            state.text = state.asset ? unitsText(state.units, state.asset.decimals) : '';
            input.value = state.text;
            state.trouble = null;
            paint();
          }
        });
        maxBtn.addEventListener('click', () => {
          const a = state.asset, max = maxUnits();
          if (state.sending || !a || max <= 0n) return;
          CK.haptic.selection();
          state.pct = 100;
          state.units = max;
          state.text = unitsText(max, a.decimals);
          input.value = state.text;
          slider.set(100);
          state.trouble = null;
          paint();
        });
        function recipient() {
          const user = state.user, dns = state.dns;
          if (dns) return dns.phase === 'found' ? T.parseRecipient(dns.friendly) : null;
          if (!user) return T.parseRecipient(state.address);
          return user.phase === 'found' ? T.parseRecipient(user.found.friendly) : null;
        }
        let riskTimer = 0, riskRun = 0;
        function takeRisk(typed) {
          const raw = typed ? typed.address : null;
          if (state.risk && state.risk.address === raw) return;
          clearTimeout(riskTimer);
          const run = ++riskRun;
          state.risk = raw ? { address: raw, phase: 'look' } : null;
          if (!raw) return;
          riskTimer = setTimeout(() => {
            lookRecipient(raw).then((found) => {
              if (gone || run !== riskRun) return;
              state.risk = { address: raw, phase: 'done', ...found };
              if (found.memoRequired) state.memoOpen = true;
              paint();
            }, (err) => {
              if (gone || run !== riskRun) return;
              if (err.message !== 'not_found') console.warn('recipient look:', err.code || err.message);
              state.risk = { address: raw, phase: 'fail' };
            });
          }, USER_LOOK_MS);
        }
        let dnsTimer = 0, dnsRun = 0;
        function takeDns() {
          const name = dnsTyped(state.address);
          if (!name) {
            if (!state.dns) return;
            state.dns = null;
            clearTimeout(dnsTimer);
            dnsRun += 1;
            paintUser();
            return;
          }
          if (state.dns && state.dns.name === name && state.dns.phase !== 'fail') return;
          clearTimeout(dnsTimer);
          const run = ++dnsRun;
          state.dns = { name, phase: 'look', friendly: null };
          paintUser();
          dnsTimer = setTimeout(() => {
            lookDns(name).then((raw) => {
              if (gone || run !== dnsRun) return;
              state.dns = raw ? { name, phase: 'found', friendly: T.friendlyAddress(raw) } : { name, phase: 'none', friendly: null };
              paintUser();
              paint();
            }, (err) => {
              if (gone || run !== dnsRun) return;
              console.warn('dns look:', err.code || err.message);
              state.dns = { name, phase: 'fail', friendly: null };
              paintUser();
              paint();
            });
          }, USER_LOOK_MS);
        }
        function paintBook(typed) {
          const book = window.DemoBook && DemoBook.available() ? DemoBook : null;
          bookOpen.hidden = !book;
          const keep = !!book && !!typed && !state.user && !(T.wallet && typed.address === T.wallet.address) && !book.has('ton', typed.friendly) && !state.sending;
          if (bookSave.hidden === keep) bookSave.hidden = !keep;
        }
        bookOpen.addEventListener('click', () => {
          if (!window.DemoBook || state.sending) return;
          CK.haptic.selection();
          flow.push(DemoBook.pickStep({
            net: 'ton',
            onPick(entry, f) {
              addr.value = entry.address;
              state.address = entry.address;
              if (entry.memo !== undefined) {
                memoEl.value = entry.memo || '';
                state.memo = cleanMemo(memoEl.value);
              }
              state.touched = false;
              state.trouble = null;
              f.back();
            }
          }));
        });
        bookSave.addEventListener('click', () => {
          const typed = recipient();
          if (!window.DemoBook || !typed) return;
          CK.haptic.selection();
          flow.push(DemoBook.saveStep({ net: 'ton', address: typed.friendly, memo: state.memo, name: state.dns && state.dns.phase === 'found' ? state.dns.name : '' }));
        });
        let lookTimer = 0, lookRun = 0;
        function takeUser() {
          const typed = userTyped(state.address);
          if (!typed) {
            if (!state.user) return;
            state.user = null;
            clearTimeout(lookTimer);
            lookRun += 1;
            paintUser();
            return;
          }
          if (state.user && state.user.name === typed.name && state.user.phase !== 'fail') return;
          clearTimeout(lookTimer);
          lookRun += 1;
          const phase = typed.valid ? 'look' : typed.early ? 'wait' : 'bad';
          state.user = { name: typed.name, phase, found: null, code: null };
          if (phase === 'bad') state.touched = true;
          paintUser();
          if (phase !== 'look') return;
          const run = lookRun;
          lookTimer = setTimeout(() => {
            lookUser(typed.name).then((found) => {
              if (gone || run !== lookRun) return;
              state.user = found.found ? { name: typed.name, phase: 'found', found, code: null } : { name: typed.name, phase: 'none', found: null, code: null };
              paintUser();
              paint();
            }, (err) => {
              if (gone || run !== lookRun) return;
              if (err.code !== 'tg_only' && err.code !== 'rate_limited') console.warn('recipient look:', err.code || err.message);
              state.user = { name: typed.name, phase: err.code === 'bad_username' ? 'bad' : 'fail', found: null, code: err.code || null };
              paintUser();
              paint();
            });
          }, USER_LOOK_MS);
        }
        function paintUser() {
          const dns = state.dns;
          if (dns && (dns.phase === 'look' || dns.phase === 'found')) {
            const key = `dns|${dns.phase}|${dns.name}|${dns.friendly || ''}`;
            userCard.hidden = false;
            userMenu.hidden = true;
            if (userCard.dataset.key === key) return;
            userCard.dataset.key = key;
            userCard.dataset.phase = dns.phase;
            userCard.innerHTML = dns.phase === 'look'
              ? '<span class="w-dir-ava w-skel"></span><span class="w-dir-main"><b class="w-dir-name"></b><span class="w-dir-sub w-skel w-skel-text w-skel-text--sub">&nbsp;</span></span>'
              : `<span class="w-dir-ava is-empty">${icon('globe', { size: 20 })}</span><span class="w-dir-main"><b class="w-dir-name"></b><span class="w-dir-sub"></span></span>`;
            $('.w-dir-name', userCard).textContent = dns.name;
            if (dns.phase === 'found') $('.w-dir-sub', userCard).textContent = T.shortAddress(dns.friendly);
            return;
          }
          const user = state.user;
          const show = !!user && (user.phase === 'look' || user.phase === 'found' || user.phase === 'none');
          userCard.hidden = !show;
          if (!show) {
            userMenu.hidden = true;
            userCard.replaceChildren();
            delete userCard.dataset.phase;
            delete userCard.dataset.key;
            return;
          }
          const key = `${user.phase}|${user.name}`;
          if (userCard.dataset.key === key) return;
          userMenu.hidden = true;
          if (!reduced()) {
            userCard.animate(userCard.dataset.key
              ? [{ opacity: .35 }, { opacity: 1 }]
              : [{ opacity: 0, transform: 'translate3d(0,6px,0)' }, { opacity: 1, transform: 'none' }], { duration: userCard.dataset.key ? 200 : 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
          }
          userCard.dataset.key = key;
          userCard.dataset.phase = user.phase;
          if (user.phase === 'look') {
            userCard.innerHTML = '<span class="w-dir-ava w-skel"></span><span class="w-dir-main"><b class="w-dir-name"></b><span class="w-dir-sub w-skel w-skel-text w-skel-text--sub">&nbsp;</span></span>';
            $('.w-dir-name', userCard).textContent = '@' + user.name;
            return;
          }
          if (user.phase === 'none') {
            const byCheque = !!window.DemoCheques && CK.wallet.status.kind === 'signer';
            userCard.innerHTML = `<span class="w-dir-ava is-empty">${icon('person', { fill: true, size: 20 })}</span><span class="w-dir-main"><b class="w-dir-name"></b><span class="w-dir-sub"></span></span>${byCheque
              ? `<button class="w-dir-invite w-dir-cheque press" type="button">${icon('gift', { size: 16 })}<span></span></button><button class="w-dir-more press" type="button" aria-expanded="false" aria-label="${tx('common.menu')}">${icon('more', { size: 20 })}</button>`
              : `<button class="w-dir-invite press" type="button">${icon('share', { size: 16 })}<span></span></button>`}`;
            $('.w-dir-name', userCard).textContent = '@' + user.name;
            $('.w-dir-sub', userCard).textContent = tx('withdraw.userNotHere');
            const inviteBtn = byCheque ? null : $('.w-dir-invite', userCard);
            if (inviteBtn) {
              $('span', inviteBtn).textContent = tx('withdraw.userInvite');
              inviteBtn.setAttribute('aria-label', tx('withdraw.userInvite'));
              inviteBtn.addEventListener('click', invite);
            }
            const moreBtn = $('.w-dir-more', userCard);
            if (moreBtn) {
              moreBtn.addEventListener('click', () => {
                CK.haptic.selection();
                userMenu.hidden = !userMenu.hidden;
                moreBtn.setAttribute('aria-expanded', String(!userMenu.hidden));
                if (!userMenu.hidden && userMenu.scrollIntoView) requestAnimationFrame(() => userMenu.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }));
              });
            }
            const chequeBtn = $('.w-dir-cheque', userCard);
            if (chequeBtn) {
              $('span', chequeBtn).textContent = tx('cheque.byCheck');
              chequeBtn.setAttribute('aria-label', tx('cheque.byCheck'));
              chequeBtn.addEventListener('click', () => {
                CK.haptic.light();
                const a = state.asset;
                const asset = a && a.id === USDT_RAW ? 'usdt' : 'gram';
                const units = a && (a.id === NATIVE || a.id === USDT_RAW) ? state.units : 0n;
                flow.push(DemoCheques.createStep({ rows: state.rows, asset, units }));
              });
            }
            return;
          }
          const found = user.found;
          userCard.innerHTML = '<span class="w-dir-ava"></span><span class="w-dir-main"><b class="w-dir-name"></b><span class="w-dir-sub w-dir-subrow"><span class="w-dir-handle"></span><span class="w-dir-addr"></span></span></span>';
          const ava = $('.w-dir-ava', userCard);
          const initials = Array.from((found.name || found.username).trim()).slice(0, 1).join('').toUpperCase();
          ava.textContent = initials;
          if (found.photoUrl) {
            const img = new Image();
            img.alt = '';
            img.decoding = 'async';
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('load', () => { if (userCard.contains(ava)) ava.replaceChildren(img); }, { once: true });
            img.src = found.photoUrl;
          }
          $('.w-dir-name', userCard).textContent = found.name || '@' + found.username;
          $('.w-dir-handle', userCard).textContent = '@' + found.username;
          $('.w-dir-addr', userCard).textContent = T.shortAddress(found.friendly);
        }
        function invite() {
          CK.haptic.light();
          const link = window.DemoApp && typeof DemoApp.inviteLink === 'function' ? DemoApp.inviteLink() || INVITE_FALLBACK : INVITE_FALLBACK;
          CK.ton.openLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(tx('withdraw.userInviteText'))}`);
        }

        function amountTyped() {
          const a = state.asset;
          if (!a) return;
          const max = maxUnits();
          fitFraction(input, a.decimals);
          state.units = typedUnits(input.value, a.decimals);
          state.text = input.value;
          state.pct = max > 0n ? clamp(T.fromUnits(state.units, a.decimals) / T.fromUnits(max, a.decimals) * 100, 0, 100) : 0;
          slider.set(state.pct);
          state.trouble = null;
          paint();
        }
        amountField(input);
        input.addEventListener('input', amountTyped);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
        addr.addEventListener('input', () => {
          state.address = addr.value.replace(/\s/g, '');
          state.trouble = null;
          if (T.parseRecipient(state.address)) state.touched = false;
          else if (state.address.length >= 48) state.touched = true;
          takeUser();
          takeDns();
          paint();
        });
        memoEl.addEventListener('input', () => {
          state.memo = cleanMemo(memoEl.value);
          state.trouble = null;
          paint();
        });
        memoEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') memoEl.blur(); });
        addr.addEventListener('blur', () => {
          state.touched = true;
          paint();
        });
        addr.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addr.blur();
          }
        });
        chip.addEventListener('click', () => {
          if (chip.disabled) return;
          flow.push(pickerStep({
            title: 'TON',
            list: heldRows(),
            onPick(next, f) {
              state.picked = true;
              if (next !== state.asset) {
                state.asset = next;
                state.units = 0n;
                state.pct = 0;
                state.text = '';
              }
              f.back();
            }
          }));
        });

        function askPassword() {
          return new Promise((resolve) => {
            swipeHost.hidden = true;
            passBox.hidden = false;
            passInput.value = '';
            passInput.focus({ preventScroll: true });
            passDone = (value) => {
              passDone = null;
              passInput.value = '';
              passBox.hidden = true;
              swipeHost.hidden = false;
              resolve(value);
            };
          });
        }
        function release(key) {
          state.sending = false;
          state.note = '';
          state.trouble = key || null;
          input.disabled = false;
          addr.disabled = false;
          memoEl.disabled = false;
          body.classList.remove('is-busy');
          paint();
          return false;
        }
        function note(key) {
          state.note = key;
          paint();
        }
        function confirm() {
          const typed = recipient();
          if (state.sending || sending || DemoSwap.pending || !typed || state.units <= 0n || state.units > maxUnits() || !T.wallet || T.wallet.readOnly) return false;
          state.sending = true;
          state.trouble = null;
          input.blur();
          addr.blur();
          memoEl.blur();
          input.disabled = true;
          addr.disabled = true;
          memoEl.disabled = true;
          body.classList.add('is-busy');
          if (!state.fresh) return checkFresh(typed);
          note('swap.signing');
          return signAndSend(typed);
        }
        function checkFresh(typed) {
          const was = state.asset;
          note('swap.waitBalance');
          return loadRows(state.since).then((rows) => {
            if (gone || flow.closing) {
              state.sending = false;
              state.note = '';
              return false;
            }
            clearTimeout(retry);
            state.fresh = true;
            takeRows(rows);
            const a = state.asset;
            if (!a || a.id !== was.id || a.decimals !== was.decimals || state.units <= 0n || state.units > maxUnits() || noGas() || (a.id !== NATIVE && !a.wallet)) return release();
            note('swap.signing');
            return signAndSend(typed);
          }, (err) => {
            console.error(err);
            if (gone || flow.closing) {
              state.sending = false;
              state.note = '';
              return false;
            }
            return release('swap.loadFail');
          });
        }
        async function signAndSend(typed) {
          const asset = state.asset, units = state.units, owner = T.wallet.address;
          let signed;
          try {
            if (!(await CK.wallet.canSign())) {
              const now = CK.wallet.status;
              return release(now.bioUnknown ? 'wallet.bioWait' : now.denied ? 'swapSheet.bioDenied' : now.lost ? 'swapSheet.bioLost' : 'swapSheet.noSign');
            }
            const own = await CK.wallet.depositAddress();
            if (!own.verified || own.address !== owner) return release('swapSheet.stopped');
            if (isContractRecipient(state.rows, typed.address, window.TonWallet, owner)) return release('xnet.contractAddress');
            if (asset.id !== NATIVE) {
              const problem = jettonWalletProblem(window.TonWallet, asset, state.rows, owner, typed.address);
              if (problem) {
                console.error('withdrawal refused:', problem);
                return release('swapSheet.stopped');
              }
              if (!(await jettonWalletConfirmed(asset, owner))) {
                console.error('withdrawal refused: unconfirmed');
                return release('swapSheet.stopped');
              }
            }
          } catch (err) {
            console.error(err);
            return release('swapSheet.tryAgain');
          }
          if (flow.closing) return false;
          const memo = memoProblem(asset.id, state.memo) ? null : state.memo;
          const message = asset.id === NATIVE
            ? { to: typed.friendly, amount: units.toString(), ...(memo ? { comment: memo } : {}) }
            : { to: asset.wallet, recipient: typed.friendly, units: units.toString(), ...(memo ? { comment: memo } : {}) };
          let quote = null;
          if (asset.id === USDT_RAW && gaslessWanted() && !(state.gasless && state.gasless.phase === 'off')) {
            const key = gaslessKey();
            const held = gaslessReady() ? state.gasless.quote : null;
            let fresh = held && held.validUntil - Math.floor(Date.now() / 1000) >= GASLESS_FRESH_S ? held : null;
            if (!fresh) {
              note('withdraw.gaslessLooking');
              try {
                fresh = await CK.wallet.gasless.quote(message, { wallet: state.walletAt });
              } catch (err) {
                console.error(err);
                state.gasless = { key, phase: gaslessPhaseOf(err), quote: null, changed: false };
                return release();
              }
              if (fresh.gasless && (!held || fresh.commission !== held.commission)) {
                state.gasless = { key, phase: 'ready', quote: fresh, changed: true };
                CK.haptic.error();
                return release();
              }
            }
            if (flow.closing) return false;
            quote = fresh.gasless ? fresh : null;
          }
          const usePassword = CK.wallet.status.method === 'password';
          let password;
          for (;;) {
            if (usePassword) {
              state.note = '';
              paint();
              password = await askPassword();
              if (password === null || flow.closing) return false;
            }
            note('swap.signing');
            try {
              const signOptions = { ...(password ? { password } : {}), wallet: state.walletAt };
              signed = quote ? await CK.wallet.gasless.sign(quote, signOptions) : await CK.wallet.unlockAndSign([message], signOptions);
              break;
            } catch (err) {
              if (err.code === 'wrong_password') {
                state.trouble = 'swapSheet.passwordWrong';
                continue;
              }
              if (err.code === 'gasless_refused' || err.code === 'gasless_unavailable') {
                console.error(err);
                state.gasless = err.reason === 'valid_until' || err.reason === 'commission' ? null : { key: gaslessKey(), phase: gaslessPhaseOf(err), quote: null, changed: false };
                return release();
              }
              if (CK.wallet.protectRefused(err)) return release('wallet.needProtect');
              if (CK.wallet.isRejection(err)) return release();
              console.error(err);
              return release(SIGN_ERRORS[err.code] || 'swapSheet.tryAgain');
            } finally {
              password = undefined;
            }
          }
          const rec = {
            wallet: owner, phase: 'sending', hash: signed.hash || '', seqno: signed.seqno, validUntil: signed.validUntil,
            units: units.toString(), decimals: asset.decimals, sym: asset.sym, to: typed.friendly
          };
          if (state.user && state.user.phase === 'found' && state.user.found.friendly === typed.friendly && CK.market.mode === 'live') CK.wallet.directory.pin(state.user.found);
          CK.haptic.success();
          const alreadyClosed = flow.closing;
          handingOver = !alreadyClosed;
          startSend(rec, signed.boc, sendNotice(asset, units, typed.friendly, state.user));
          if (alreadyClosed) openStatus();
          else {
            handOff(rec);
            flow.close();
          }
          return undefined;
        }

        function takeRows(rows) {
          if (takeTonRows(state, rows)) input.value = '';
          const a = state.asset, max = maxUnits();
          state.pct = a && max > 0n ? clamp(T.fromUnits(state.units, a.decimals) / T.fromUnits(max, a.decimals) * 100, 0, 100) : 0;
          slider.set(state.pct);
          paintChip();
          paint();
        }
        function load() {
          clearTimeout(retry);
          loadRows(state.since).then((rows) => {
            if (gone) return;
            state.fresh = true;
            if (state.trouble === 'swap.loadFail') state.trouble = null;
            takeRows(rows);
          }, (err) => {
            if (gone) return;
            console.error(err);
            retry = setTimeout(load, BALANCE_RETRY_MS);
          });
        }
        const stopFolio = D.onBalances(() => {
          const known = !gone && !state.fresh && !state.sending ? knownRows() : null;
          if (known) takeRows(known);
        });
        input.value = state.text;
        addr.value = state.address;
        memoEl.value = state.memo || '';
        if (state.user && state.user.phase === 'look') state.user = null;
        if (state.dns && state.dns.phase === 'look') state.dns = null;
        if (state.gasless && state.gasless.phase === 'look') state.gasless = null;
        takeUser();
        takeDns();
        paintUser();
        paintChip();
        paint();
        if (state.rows) slider.set(state.pct);
        if (!state.fresh) load();
        return () => {
          gone = true;
          clearTimeout(retry);
          clearTimeout(lookTimer);
          clearTimeout(dnsTimer);
          clearTimeout(riskTimer);
          clearTimeout(gaslessTimer);
          stopFolio();
          if (passDone) passDone(null);
        };
      }
    };
  }

  function openExchange() {
    if (!T.wallet || T.wallet.readOnly || DemoSwap.state !== 'open') {
      CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
      return;
    }
    if (sending) {
      openStatus();
      return;
    }
    if (DemoSwap.pending) {
      DemoSwap.openTrack();
      return;
    }
    let chosen = null;
    warmExchange();
    openFlow(exchangeStep({ rows: knownRows(), fresh: false, since: Date.now(), picked: false, from: null, to: null, turn: 0 }, (pair) => { chosen = pair; }), () => {
      if (chosen) DemoSwap.openPair(chosen.from, chosen.to);
    }, HEIGHT.exchange);
  }
  function exchangeStep(state, choose) {
    return {
      title: tx('action.swap'),
      render(body, flow) {
        body.innerHTML = `
          <div class="w-swap">
            <button class="w-card w-pair press" type="button" data-pick="from"><span class="w-card-top"><span>${tx('exchange.give')}</span><span class="w-pair-bal"></span></span><span class="w-card-main w-pair-asset"></span></button>
            <button class="w-flip press" type="button" aria-label="${tx('exchange.flip')}"><span style="transform:rotate(${state.turn}deg)">${icon('exchange', { size: 20 })}</span></button>
            <button class="w-card w-pair press" type="button" data-pick="to"><span class="w-card-top"><span>${tx('exchange.get')}</span><span class="w-pair-bal"></span></span><span class="w-card-main w-pair-asset"></span></button>
          </div>`;
        const dock = CK.el(`<div class="sheet-dock sw-dock"><p class="sw-line" role="status"></p><button class="btn btn--wide press w-go" type="button"></button></div>`);
        flow.sheet.el.appendChild(dock);
        const go = $('.w-go', dock), lineEl = $('.sw-line', dock);
        let gone = false, retry = 0;
        const heldOf = (a) => (state.rows && a ? state.rows.find((r) => r.id === a.id) || null : null);
        function paintSide(side) {
          const a = state[side];
          const card = $(`[data-pick="${side}"]`, body);
          const slot = $('.w-pair-asset', card), bal = $('.w-pair-bal', card);
          const shape = a ? `${a.id}|${a.logo || ''}` : state.rows ? '' : 'wait';
          if (slot.dataset.shape !== shape) {
            slot.dataset.shape = shape;
            slot.innerHTML = a ? `${logoOf(a, 36)}<span class="w-pair-name"><b></b><span></span></span>${icon('chevron-down', { size: 18 })}`
              : shape ? '<span class="w-skel w-skel-dot"></span><span class="w-pair-name w-skel"><b class="w-skel-text">&nbsp;</b><span class="w-skel-text w-skel-text--sub">&nbsp;</span></span>' : '';
          }
          if (a) {
            $('.w-pair-name b', slot).textContent = a.sym;
            $('.w-pair-name span', slot).textContent = a.name;
          }
          const held = heldOf(a);
          bal.classList.toggle('w-skel-bal', !state.rows && side === 'from');
          bal.textContent = held && held.units > 0n ? qtySym(held.units, held) : '';
        }
        function paint() {
          paintSide('from');
          paintSide('to');
          const held = heldOf(state.from);
          const ready = !!held && held.units > 0n && !!state.to;
          go.disabled = !ready;
          go.textContent = tx(!state.rows ? 'swap.waitBalance' : ready ? 'walletFlow.next' : 'order.notHeld');
        }
        const gramAsset = () => assetOf(D.byId.ton);
        const usdtAsset = () => assetOf(D.byId.usdt);
        function take(rows) {
          const was = state.from;
          state.rows = rows;
          if (!state.picked) {
            state.from = (was && rows.find((r) => r.id === was.id && r.units > 0n)) || null;
            state.to = null;
          }
          if (!state.from) state.from = firstHeld(rows) || gramAsset();
          if (!state.to) state.to = state.from.id === NATIVE ? usdtAsset() : gramAsset();
          paint();
        }
        function load() {
          loadRows(state.since).then((rows) => {
            if (gone) return;
            state.fresh = true;
            lineEl.textContent = '';
            take(rows);
          }, (err) => {
            if (gone) return;
            console.error(err);
            retry = setTimeout(load, BALANCE_RETRY_MS);
          });
        }
        const stopFolio = D.onBalances(() => {
          const rows = !gone && !state.fresh ? knownRows() : null;
          if (rows) take(rows);
        });
        function pick(side) {
          if (!state.rows) return;
          const held = state.rows.filter((r) => r.units > 0n);
          const list = side === 'from' ? held : [gramAsset(), usdtAsset(), assetOf(D.byId.not)].map((a) => heldOf(a) || a)
            .concat(held.filter((r) => r.id !== NATIVE && r.id !== USDT_RAW && r.id !== NOT_RAW));
          flow.push(pickerStep({
            title: tx(side === 'from' ? 'exchange.pickGive' : 'exchange.pickGet'),
            list,
            search: side === 'to',
            onPick(asset, f) {
              const other = side === 'from' ? 'to' : 'from';
              if (asset.id === state[other].id) state[other] = state[side];
              state[side] = heldOf(asset) || asset;
              state.picked = true;
              f.replace(exchangeStep(state, choose));
            }
          }));
        }
        body.addEventListener('click', (e) => {
          if (e.target.closest('.w-flip')) {
            if (!state.from || !state.to) return;
            CK.haptic.light();
            [state.from, state.to] = [state.to, state.from];
            state.picked = true;
            state.turn += 180;
            $('.w-flip span', body).style.transform = `rotate(${state.turn}deg)`;
            paint();
            return;
          }
          const card = e.target.closest('[data-pick]');
          if (card) pick(card.dataset.pick);
        });
        go.addEventListener('click', () => {
          if (go.disabled) return;
          CK.haptic.light();
          choose({ from: heldOf(state.from), to: state.to });
          flow.close();
        });
        if (state.rows && !state.from) take(state.rows);
        else paint();
        if (!state.fresh) load();
        return () => {
          gone = true;
          clearTimeout(retry);
          stopFolio();
        };
      }
    };
  }

  const FILTERS = [
    { value: 'all', label: tr('filter.all'), kinds: null },
    { value: 'in', label: tr('history.in'), aria: tr('history.inAria'), kinds: ['in'] },
    { value: 'out', label: tr('history.out'), aria: tr('history.outAria'), kinds: ['out'] },
    { value: 'swap', label: tr('action.swap'), aria: tr('history.swapAria'), kinds: ['swap'] }
  ];
  const EMPTY_TEXT = { all: 'walletFlow.emptyAll', in: 'history.emptyIn', out: 'history.emptyOut', swap: 'history.emptySwap' };
  const plain = (text, max) => (typeof text === 'string' ? text.replace(/[\p{C}]/gu, '').trim().slice(0, max) : '');
  function cleanSide(raw) {
    if (!raw) return null;
    const units = T.parseUnits(raw.units);
    if (units === null || units <= 0n || !Number.isInteger(raw.decimals) || raw.decimals < 0 || raw.decimals > 30) return null;
    return { token: raw.token === 'ton' ? 'ton' : T.rawAddress(raw.token), units, decimals: raw.decimals, sym: plain(raw.symbol, 16) || '?' };
  }
  function cleanEvents(rows) {
    const out = [];
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (!row || !Array.isArray(row.actions)) return;
      const at = Number(row.at) * 1000;
      if (!(at > 0)) return;
      row.actions.forEach((action, index) => {
        if (!action) return;
        const base = { key: `${row.id}:${index}`, id: String(row.id), at, pending: row.pending === true, failed: action.status !== 'ok', kind: action.kind };
        if (action.kind === 'swap') {
          const gave = cleanSide(action.gave), got = cleanSide(action.got);
          if (gave && got) out.push({ ...base, gave, got });
          return;
        }
        if (action.kind !== 'in' && action.kind !== 'out') return;
        const side = cleanSide(action);
        const counterparty = T.rawAddress(action.counterparty);
        if (!side || !counterparty) return;
        if (action.kind === 'in' && (base.failed || (side.token === 'ton' && side.units < DUST_NANO))) return;
        out.push({ ...base, ...side, counterparty, comment: plain(action.comment, 120) });
      });
    });
    return out;
  }
  const addressLook = (raw) => {
    const friendly = T.friendlyAddress(raw);
    return `${friendly.slice(3, 6)}…${friendly.slice(-4)}`;
  };
  function withoutPoison(items) {
    const paid = new Set(items.filter((e) => e.kind === 'out').map((e) => e.counterparty));
    if (T.wallet) paidAddresses(T.wallet.address).forEach((raw) => { if (T.rawAddress(raw) === raw) paid.add(raw); });
    const looks = new Set(Array.from(paid, addressLook));
    return items.filter((e) => e.kind !== 'in' || paid.has(e.counterparty) || !looks.has(addressLook(e.counterparty)));
  }
  const sideText = (sign, s) => `${sign}${D.qty(T.fromUnits(s.units, s.decimals))} ${s.sym}`;
  function describe(e) {
    if (e.kind === 'swap') return { icon: 'exchange', title: tx('action.swap'), full: tx('tx.exchangeFull', { from: e.gave.sym, to: e.got.sym }), amount: sideText('+', e.got), sub: sideText('−', e.gave), dir: 'up' };
    if (e.kind === 'in') return { icon: 'deposit', title: tx('deposit.kind'), full: tx('tx.depositFull', { sym: e.sym }), amount: sideText('+', e), sub: '', dir: 'up' };
    if (window.DemoCheques && DemoCheques.isCheque(e.counterparty)) return { icon: 'gift', title: tx('cheque.row'), full: tx('cheque.row'), amount: sideText('−', e), sub: '', dir: 'down' };
    return { icon: 'withdraw', title: tx('withdraw.kind'), full: tx('tx.withdrawFull', { sym: e.sym }), amount: sideText('−', e), sub: '', dir: 'down' };
  }
  const stateWord = (e) => (e.pending ? tx('walletFlow.pending') : e.failed ? tx('walletFlow.failed') : '');
  const CSV_FORMULA = /^[=+\-@\t\r]/;
  function csvCell(value, sep) {
    let text = value === null || value === undefined ? '' : String(value);
    text = text.replace(/([,;\t|])(?=[=+\-@])/g, '$1 ');
    if (CSV_FORMULA.test(text)) text = `'${text}`;
    return text.includes(sep) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
  const exactAmount = (units, decimals) => unitsText(units, decimals).replace(',', '.');
  function historyCsv(items, lang, opts) {
    const sep = lang === 'en' ? ',' : ';';
    const kindWord = (e) => (e.kind === 'swap' ? tx('action.swap') : e.kind === 'in' ? tx('deposit.kind') : window.DemoCheques && DemoCheques.isCheque(e.counterparty) ? tx('cheque.row') : tx('withdraw.kind'));
    const head = ['history.csvDate', 'history.csvKind', 'exchange.gave', 'history.csvCoin', 'exchange.got', 'history.csvCoin', 'history.csvAddress', 'walletFlow.comment', 'walletFlow.status', 'history.csvHash'].map((k) => tx(k));
    const lines = [head];
    items.forEach((e) => {
      const at = new Date(e.at).toISOString().replace('T', ' ').slice(0, 19);
      const status = stateWord(e) || 'OK';
      const gave = e.kind === 'swap' ? e.gave : e.kind === 'out' ? e : null;
      const got = e.kind === 'swap' ? e.got : e.kind === 'in' ? e : null;
      lines.push([
        at, kindWord(e),
        gave ? exactAmount(gave.units, gave.decimals) : '', gave ? gave.sym : '',
        got ? exactAmount(got.units, got.decimals) : '', got ? got.sym : '',
        e.counterparty ? T.friendlyAddress(e.counterparty) : '', e.comment || '', status, HEX_HASH.test(e.id) ? e.id : ''
      ]);
    });
    if (opts && opts.cutAt) lines.push([new Date(opts.cutAt).toISOString().replace('T', ' ').slice(0, 19), tx('history.csvCut'), '', '', '', '', '', '', '', '']);
    return '\ufeff' + lines.map((row) => row.map((cell) => csvCell(cell, sep)).join(sep)).join('\r\n') + '\r\n';
  }
  async function deliverCsv(name, csv) {
    let status = 0, error = '';
    try {
      const initData = await CK.tg.whenInitData();
      if (initData) {
        const res = await fetch('api/wallet/history-file', { method: 'POST', headers: { Authorization: 'tma ' + initData, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, csv }), cache: 'no-store' });
        status = res.status;
        const body = await res.json().catch(() => null);
        if (body && body.ok === true) return 'chat';
        error = body && typeof body.error === 'string' ? body.error : '';
      }
    } catch (_) { }
    if (error === 'rate_limited' || status === 429) return 'wait';
    if (error === 'bot_blocked') return 'blocked';
    const big = status === 413;
    const file = typeof File === 'function' ? new File([csv], name, { type: 'text/csv' }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch (err) {
        if (err && err.name === 'AbortError') return 'cancel';
      }
    }
    const phone = !!CK.tg.app && /^(ios|android|android_x)$/.test(CK.tg.app.platform);
    if (!phone && typeof URL !== 'undefined' && URL.createObjectURL) {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return big ? 'bigSaved' : 'saved';
    }
    return (await CK.copyText(csv)) ? (big ? 'bigCopied' : 'copied') : big ? 'big' : 'fail';
  }
  const EXPORT_SAID = {
    chat: ['history.exportSent', 'check-circle', 'up'], shared: null, cancel: null, saved: ['history.exportSaved', 'check-circle', 'up'], copied: ['history.exportCopied', 'check-circle', 'up'],
    bigSaved: ['history.exportBigSaved', 'info', 'accent'], bigCopied: ['history.exportBigCopied', 'info', 'accent'], big: ['history.exportBig', 'warning', 'down'],
    wait: ['history.exportWait', 'info', 'accent'], blocked: ['history.exportBlocked', 'warning', 'down'], fail: ['history.exportFail', 'warning', 'down']
  };
  const HISTORY_EXPORT_PAGES = 40;
  const EXPORT_PAGE_TRIES = 3;
  const EXPORT_PAGE_PAUSE_MS = [1500, 4000];
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const txTile = (d, size) => `<span class="w-tile" data-kind="${d.icon}" style="--s:${size}px" aria-hidden="true">${icon(d.icon, { size: Math.round(size * .58) })}</span>`;
  const dayStart = (at) => new Date(at).setHours(0, 0, 0, 0);
  function dayName(at) {
    const today = dayStart(Date.now());
    const day = dayStart(at);
    if (day === today) return tx('day.today');
    if (day === new Date(today).setDate(new Date(today).getDate() - 1)) return tx('day.yesterday');
    return new Date(at).getFullYear() === new Date(today).getFullYear() ? CK.i18n.dayMonth(at) : CK.i18n.dayMonthYear(at);
  }

  function historyStep() {
    const wallet = T.wallet.address;
    const seen = new Set();
    const st = { filter: 'all', items: [], next: null, started: false, ended: false, loading: false, failed: false, pages: 0, scroll: 0, painted: new Set() };
    return {
      title: tx('common.history'),
      render(body, flow) {
        body.innerHTML = '<div class="w-filter"></div><div class="w-log"></div>';
        const log = $('.w-log', body);
        let shown = [], gone = false, exporting = false;
        const exportBtn = CK.el(`<button class="navbtn navbtn--flat press w-export" type="button" aria-label="${tx('history.export')}">${icon('share', { size: 20 })}</button>`);
        exportBtn.addEventListener('click', () => exportAll());
        async function exportAll() {
          if (exporting) return;
          exporting = true;
          exportBtn.disabled = true;
          CK.haptic.light();
          try {
            const whole = await loadAll();
            if (gone) return;
            if (whole === 'failed') return CK.toast(tx('history.exportIncomplete'), { icon: 'warning', tone: 'down' });
            const items = withoutPoison(st.items);
            if (!items.length) return CK.toast(tx('history.exportNone'), { icon: 'info' });
            const cutAt = whole === 'cut' ? Math.min(...items.map((e) => e.at)) : null;
            const name = `devpool-wallet-${new Date().toISOString().slice(0, 10)}.csv`;
            const said = EXPORT_SAID[await deliverCsv(name, historyCsv(items, CK.i18n.lang, { cutAt }))];
            const from = cutAt ? tx('history.exportFrom', { date: CK.i18n.dayMonthYear(cutAt) }) : '';
            if (said) CK.toast(from ? `${tx(said[0])}. ${from}` : tx(said[0]), { icon: said[1], tone: said[2] });
            else if (from) CK.toast(from, { icon: 'info' });
          } finally {
            exporting = false;
            exportBtn.disabled = false;
          }
        }
        function rowHtml(e, i) {
          const d = describe(e);
          const word = stateWord(e);
          const tone = word ? 'flat' : d.dir;
          return `
            <button class="cell w-tx press-row${st.painted.has(e.key) ? '' : ' list-in'}" type="button" data-i="${i}">
              ${txTile(d, 36)}
              <span class="cell-main"><span class="w-tx-title">${esc(d.title)}</span><span class="w-tx-time">${esc(CK.i18n.clock(e.at))}${e.comment ? ` · ${esc(e.comment)}` : ''}</span></span>
              <span class="w-tx-right"><span class="w-tx-amount w-is-${tone}">${esc(d.amount)}</span><span class="w-tx-sub">${esc(word || d.sub)}</span></span>
            </button>`;
        }
        function paint() {
          const filter = FILTERS.find((f) => f.value === st.filter);
          shown = withoutPoison(st.items).filter((e) => !filter.kinds || filter.kinds.includes(e.kind));
          if (!shown.length) {
            if (!st.started || st.loading) log.innerHTML = '<div class="group"><div class="wallet-skel"></div><div class="wallet-skel"></div><div class="wallet-skel"></div></div>';
            else if (st.failed) log.innerHTML = CK.emptyState({ icon: 'warning', title: tx('common.loadFail'), className: 'w-empty', actions: `<button class="btn btn--small btn--tinted press w-retry" type="button">${tx('common.retry')}</button>` });
            else log.innerHTML = CK.emptyState({ icon: 'tx-history', title: tx(EMPTY_TEXT[st.filter]), className: 'w-empty' });
            return;
          }
          const days = [];
          shown.forEach((e, i) => {
            const name = dayName(e.at);
            if (!days.length || days[days.length - 1].name !== name) days.push({ name, rows: [] });
            days[days.length - 1].rows.push(rowHtml(e, i));
          });
          log.innerHTML = days.map((day) => `<section class="w-day"><h3 class="w-day-name">${esc(day.name)}</h3><div class="group">${day.rows.join('')}</div></section>`).join('')
            + (st.failed ? `<button class="btn btn--tinted btn--small press w-retry w-retry--more list-in" type="button">${tx('common.retry')}</button>` : '');
          shown.forEach((e) => st.painted.add(e.key));
        }
        function loadPage() {
          return load(true) || Promise.resolve();
        }
        async function loadAll() {
          for (let i = 0; i < HISTORY_EXPORT_PAGES && !st.ended && !gone; i++) {
            while (st.loading && !gone) await pause(150);
            if (st.ended || gone) break;
            for (let tries = 1; ; tries++) {
              st.pages = 0;
              await loadPage();
              if (!st.failed || gone) break;
              if (tries >= EXPORT_PAGE_TRIES) return 'failed';
              await pause(EXPORT_PAGE_PAUSE_MS[tries - 1]);
            }
          }
          return st.ended ? 'whole' : 'cut';
        }
        function load(once) {
          if (st.loading || st.ended) return null;
          st.loading = true;
          st.started = true;
          st.failed = false;
          st.pages++;
          paint();
          return T.config().then(() => T.api(`wallet/history?address=${encodeURIComponent(wallet)}${st.next ? `&before=${st.next}` : ''}`)).then((answer) => {
            cleanEvents(answer.rows).forEach((e) => {
              if (seen.has(e.key)) return;
              seen.add(e.key);
              st.items.push(e);
            });
            st.next = typeof answer.next === 'string' && /^\d{1,20}$/.test(answer.next) ? answer.next : null;
            st.ended = !st.next;
          }, (err) => {
            console.error(err);
            st.failed = true;
          }).finally(() => {
            st.loading = false;
            if (gone) return;
            paint();
            if (!once && !st.failed && !st.ended && shown.length < HISTORY_FILL && st.pages < HISTORY_PAGES_MAX) load();
          });
        }
        const onScroll = () => {
          st.scroll = body.scrollTop;
          if (!st.failed && !st.ended && body.scrollTop + body.clientHeight * 2 > body.scrollHeight) {
            st.pages = 0;
            load();
          }
        };
        body.addEventListener('scroll', onScroll, { passive: true });
        CK.segmented($('.w-filter', body), {
          label: tx('history.filterAria'), size: 'small', value: st.filter,
          items: FILTERS.map(({ value, label, aria }) => ({ value, label, aria })),
          onChange(v) {
            st.filter = v;
            st.pages = 0;
            paint();
            log.classList.remove('w-log-swap');
            void log.offsetWidth;
            log.classList.add('w-log-swap');
            if (!st.failed && !st.ended && shown.length < HISTORY_FILL) load();
          }
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
          flow.push(detailStep(shown[Number(row.dataset.i)]));
        });
        paint();
        if (!st.started) load();
        else body.scrollTop = st.scroll;
        return () => {
          gone = true;
          exportBtn.remove();
          body.removeEventListener('scroll', onScroll);
        };
      }
    };
  }
  function detailStep(e) {
    const d = describe(e);
    const rows = [[tx('tx.date'), `${CK.i18n.dayMonthYear(e.at)}, ${CK.i18n.clock(e.at)}`]];
    if (e.kind === 'swap') rows.push([tx('exchange.gave'), sideText('', e.gave)], [tx('exchange.got'), sideText('', e.got)]);
    if (stateWord(e)) rows.push([tx('walletFlow.status'), stateWord(e)]);
    return {
      title: d.full,
      render(body, flow) {
        body.innerHTML = `
          <div class="w-detail-hero">${txTile(d, 56)}<b class="w-is-${stateWord(e) ? 'flat' : d.dir}"></b></div>
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
          const block = CK.el(`<div class="w-party"><span class="w-party-label"></span><span class="w-party-address"></span></div>`);
          $('.w-party-label', block).textContent = tx(e.kind === 'in' ? 'walletFlow.sender' : 'walletFlow.recipient');
          $('.w-party-address', block).textContent = T.friendlyAddress(e.counterparty);
          host.appendChild(block);
          if (e.kind === 'out' && T.wallet && paidAddresses(T.wallet.address).includes(e.counterparty)) {
            const copy = CK.el(`<button class="w-copy" type="button" aria-label="${tx('common.copyAddress')}">${icon('copy', { size: 15 })}<span>${tx('common.copy')}</span></button>`);
            copy.addEventListener('click', () => copyWithToast(T.friendlyAddress(e.counterparty)));
            block.appendChild(copy);
            if (window.DemoBook && DemoBook.available() && !DemoBook.has('ton', T.friendlyAddress(e.counterparty)) && flow) {
              const keep = CK.el(`<button class="w-copy w-keep" type="button">${icon('plus', { size: 15 })}<span>${tx('book.save')}</span></button>`);
              keep.addEventListener('click', () => {
                CK.haptic.selection();
                flow.push(DemoBook.saveStep({ net: 'ton', address: T.friendlyAddress(e.counterparty), memo: e.comment || '' }));
              });
              block.appendChild(keep);
            }
          }
        }
        if (e.comment) {
          const block = CK.el(`<div class="w-party"><span class="w-party-label">${tx('walletFlow.comment')}</span><span class="w-party-text"></span></div>`);
          $('.w-party-text', block).textContent = e.comment;
          host.appendChild(block);
        }
        if (HEX_HASH.test(e.id)) {
          const open = CK.el(`<button class="tk-link" type="button">${tx('swap.explorer')}</button>`);
          open.addEventListener('click', () => T.openLink(`${EXPLORER}transaction/${e.id}`));
          body.appendChild(open);
        }
      }
    };
  }
  function openHistory() {
    if (T.wallet) openFlow(historyStep());
  }

  window.DemoWallet = {
    build(context) {
      ctx = context;
      T.onWallet((wallet) => {
        if (sending && (!wallet || wallet.address !== sending.wallet)) {
          clearTimeout(pollTimer);
          sending = null;
        }
        if (wallet) resumeSend();
      });
      CK.wallet.ready.then(resumeSend);
      let warmed = false, stopWarm = null;
      const warmWhenOpen = () => {
        if (warmed || !T.wallet || T.wallet.readOnly || DemoSwap.state !== 'open') return;
        warmed = true;
        if (stopWarm) stopWarm();
        setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(warmExchange, { timeout: WARM_IDLE_MS }) : warmExchange()), WARM_AFTER_MS);
      };
      if (window.DemoSwap) {
        stopWarm = DemoSwap.onChange(warmWhenOpen);
        warmWhenOpen();
      }
    },
    openDeposit,
    openWithdraw,
    openExchange,
    openHistory,
    openFlow,
    safeBottom,
    qrMatrix,
    cleanRow,
    isContractRecipient,
    jettonWalletProblem,
    jettonWalletConfirmed,
    memoProblem,
    cleanMemo,
    historyCsv,
    deliverCsv,
    lookalikeOf,
    lookRecipient,
    looksLikeDomain,
    dnsTyped,
    lookDns,
    cleanEvents,
    withoutPoison,
    typedUnits,
    sendNotice,
    fitFraction,
    amountField,
    unitsText,
    squeezeAware,
    loadRows,
    SIGN_ERRORS,
    pickerStep,
    logoOf
  };
})();
