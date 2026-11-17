(function () {
  'use strict';
  const D = window.DemoData;
  const { fmt, icon, t: tx } = CK;
  const $ = (s, r) => (r || document).querySelector(s);
  const MAX = 30;
  const CHIPS = [-10, -5, 5, 10];
  const BELL_HEIGHT = 400;
  const COIN_ID = /^[a-z0-9]{1,16}$/;
  const TOKEN_ID = /^[a-z0-9-]{1,24}:[\w.:-]{1,128}$/;
  const ALERT_ID = /^[0-9a-f]{12}$/;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const finite = (v) => typeof v === 'number' && Number.isFinite(v);

  let list = [];
  let job = null;
  const subs = new Set();

  function clean(a) {
    if (!a || !ALERT_ID.test(a.id) || typeof a.token !== 'string' || !(COIN_ID.test(a.token) || TOKEN_ID.test(a.token))) return null;
    if (!finite(a.target) || !(a.target > 0) || (a.dir !== 'above' && a.dir !== 'below')) return null;
    return { id: a.id, token: a.token, symbol: typeof a.symbol === 'string' ? Array.from(a.symbol).slice(0, 16).join('') : '', target: a.target, dir: a.dir, at: finite(a.at) ? a.at : 0 };
  }
  function changed() {
    subs.forEach((fn) => {
      try { fn(); } catch (err) { console.error(err); }
    });
  }

  const loginData = () => CK.market.ready.then(() => (CK.market.mode === 'live' ? CK.tg.whenInitData() : ''));
  function call(path, body) {
    return loginData().then((initData) => {
      if (!initData) throw Object.assign(new Error('tg_only'), { code: 'tg_only' });
      const init = body
        ? { method: 'POST', headers: { Authorization: 'tma ' + initData, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' }
        : { headers: { Authorization: 'tma ' + initData }, cache: 'no-store' };
      return fetch(path, init).then((res) => res.json().catch(() => null)).then((json) => {
        if (!json || json.ok !== true) {
          const code = (json && typeof json.error === 'string' && json.error) || 'bad_response';
          throw Object.assign(new Error(code), { code });
        }
        list = (Array.isArray(json.alerts) ? json.alerts : []).map(clean).filter(Boolean);
        changed();
        return json;
      });
    });
  }
  function load() {
    if (!job) job = call('api/alerts').finally(() => { job = null; });
    return job;
  }

  const sign = () => fmt.money('').trim();
  const toShown = (usd) => fmt.shown(usd);
  const fromShown = (v) => v / fmt.shown(1);
  const pctText = (pct) => (pct > 0 ? '+' : '−') + Math.abs(pct) + (CK.i18n.lang === 'en' ? '%' : ' %');
  const thresholdText = (v) => {
    const text = fmt.price(v);
    const point = fmt.decimal ? fmt.decimal() : ',';
    return text.replace(new RegExp(`\\${point}00(?!\\d)`), '');
  };
  const lineOf = (a) => tx(a.dir === 'above' ? 'alerts.above' : 'alerts.below', { price: thresholdText(a.target) });
  const distanceOf = (a, price) => (price > 0 ? fmt.pct((a.target / price - 1) * 100) : '');
  const errorText = (code) => (code === 'full' ? tx('alerts.full', { max: MAX }) : code === 'no_price' ? tx('alerts.noPrice') : code === 'at_price' ? tx('alerts.atPrice') : code === 'tg_only' ? tx('alerts.tgOnly') : tx('alerts.fail'));

  function rowHtml(a, o) {
    const logo = o.logo ? CK.coinLogo(o.logo(a), 36) : `<span class="pa-dir" data-dir="${a.dir}">${icon(a.dir === 'above' ? 'withdraw' : 'deposit', { size: 18 })}</span>`;
    const main = o.logo
      ? `<span class="pa-main"><b class="pa-sym">${CK.esc(a.symbol)}</b></span><span class="cell-value pa-line">${CK.esc(lineOf(a))}</span>`
      : `<span class="pa-main"><b class="pa-sym">${CK.esc(lineOf(a))}</b></span>`;
    return `
      <div class="cell pa-item${o.tap ? ' press-row' : ''}" data-alert="${a.id}"${o.tap ? ' role="button" tabindex="0"' : ''}>
        ${logo}
        ${main}
        ${o.edit ? `<button class="pa-x press" type="button" data-remove aria-label="${CK.esc(tx('alerts.remove'))}">${icon('close', { size: 14 })}</button>` : ''}
      </div>`;
  }
  function editButton(onFlip) {
    const btn = CK.el('<button class="head-link pa-edit" type="button" hidden></button>');
    let on = false;
    const paint = () => { btn.textContent = tx(on ? 'common.done' : 'common.edit'); };
    btn.addEventListener('click', () => {
      on = !on;
      CK.haptic.selection();
      paint();
      onFlip();
    });
    paint();
    CK.i18n.bind(btn, paint);
    return {
      el: btn,
      get on() { return on; },
      show(any) {
        btn.hidden = !any;
        if (!any && on) { on = false; paint(); }
      }
    };
  }
  const intoHead = (sheetEl, el) => {
    const head = sheetEl && sheetEl.querySelector('.sheet-head');
    if (head) head.insertBefore(el, head.querySelector(':scope > .navbtn'));
  };
  function swapRows(host, ids, html, then) {
    const going = Array.from(host.querySelectorAll('[data-alert]')).filter((row) => !ids.includes(row.dataset.alert));
    const put = () => {
      if (!host.isConnected) return;
      const before = new Set(Array.from(host.querySelectorAll('[data-alert]'), (row) => row.dataset.alert));
      const had = before.size > 0;
      host.innerHTML = html;
      if (had) host.querySelectorAll('[data-alert]').forEach((row) => { if (!before.has(row.dataset.alert)) row.classList.add('list-in'); });
      then();
    };
    if (!going.length || CK.reducedMotion()) return put();
    if (host.dataset.going === '1') return undefined;
    host.dataset.going = '1';
    Promise.all(going.map((row) => row.animate([{ opacity: getComputedStyle(row).opacity }, { opacity: 0, transform: 'scale(.97)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished))
      .catch(() => {}).then(() => {
        delete host.dataset.going;
        put();
      });
    return undefined;
  }
  function removeFrom(host, id) {
    const row = host.querySelector(`[data-alert="${id}"]`);
    if (row) row.classList.add('is-going');
    CK.haptic.light();
    return call('api/alerts/delete', { id }).then(() => {
      CK.toast(tx('alerts.removed'), { icon: 'bell', tone: 'accent' });
    }, (err) => {
      if (row) row.classList.remove('is-going');
      CK.haptic.error();
      CK.toast(errorText(err.code), { icon: 'warning', tone: 'down' });
    });
  }

  function openSheet(inst) {
    CK.sheet.open({
      title: tx('alerts.bell'),
      detents: [CK.sheet.fixedDetent(BELL_HEIGHT + CK.sheet.safeBottom())],
      build(b, sheet) {
        b.innerHTML = `
          <div class="pa-head">${CK.coinLogo(inst, 20)}<b class="pa-head-name"></b><span class="pa-now">${tx('alerts.now')} <b class="pa-now-price"></b></span></div>
          <div class="pa-form">
            <span class="pa-box"><input class="pa-field" inputmode="decimal" autocomplete="off" enterkeyhint="done" aria-label="${CK.esc(tx('alerts.field'))}"><i class="pa-unit"></i><i class="pa-far"></i></span>
            <div class="pa-chips" role="group" aria-label="${CK.esc(tx('alerts.field'))}">${CHIPS.map((pct) => `<button class="pa-chip press" type="button" aria-pressed="false" data-pct="${pct}">${pctText(pct)}</button>`).join('')}</div>
            <button class="btn btn--wide press pa-add" type="button" disabled>${icon('bell', { size: 20 })}<span>${tx('alerts.add')}</span></button>
          </div>
          <section class="pa-mine" hidden><h3 class="pa-title"></h3><div class="group pa-list"></div></section>`;
        $('.pa-head-name', b).textContent = inst.sym;
        const field = $('.pa-field', b), unit = $('.pa-unit', b), far = $('.pa-far', b), add = $('.pa-add', b);
        const nowEl = $('.pa-now-price', b), mine = $('.pa-mine', b), listEl = $('.pa-list', b), title = $('.pa-title', b);
        const edit = editButton(() => paintList());
        intoHead(sheet.el, edit.el);
        unit.textContent = sign();
        field.placeholder = `${tx('alerts.field')}, ${sign()}`;
        let target = null, chip = null, busy = false;
        const price = () => (inst.price > 0 ? inst.price : 0);
        const atPrice = () => target > 0 && price() > 0 && Math.abs(target / price() - 1) < 1e-9;
        function paintForm() {
          b.querySelectorAll('.pa-chip').forEach((el) => el.setAttribute('aria-pressed', String(Number(el.dataset.pct) === chip)));
          b.querySelectorAll('.pa-chip').forEach((el) => { el.disabled = !price(); });
          const away = target > 0 && price() ? distanceOf({ target }, price()) : '';
          if (far.textContent !== away) far.textContent = away;
          far.dataset.dir = away && !atPrice() ? (target > price() ? 'above' : 'below') : '';
          add.disabled = busy || !(target > 0) || !price() || atPrice() || list.length >= MAX;
          const box = field.closest('.pa-box');
          box.classList.toggle('has-value', !!field.value);
          box.classList.toggle('has-far', !!away);
        }
        function paintNow() {
          const text = price() ? fmt.price(price()) : nowEl.textContent || fmt.money('0');
          if (nowEl.textContent !== text) nowEl.textContent = text;
        }
        function paintList() {
          const rows = list.filter((a) => a.token === inst.id);
          mine.hidden = !rows.length;
          edit.show(rows.length > 0);
          title.textContent = `${tx('alerts.active')} · ${rows.length}`;
          swapRows(listEl, rows.map((a) => a.id), rows.map((a) => rowHtml(a, { edit: edit.on })).join(''), () => {
            paintNow();
            paintForm();
          });
        }
        field.addEventListener('input', () => {
          const v = fmt.parse(field.value);
          target = v > 0 ? fromShown(v) : null;
          chip = null;
          paintForm();
        });
        field.addEventListener('keydown', (e) => { if (e.key === 'Enter') field.blur(); });
        $('.pa-chips', b).addEventListener('click', (e) => {
          const el = e.target.closest('.pa-chip');
          if (!el || !price()) return;
          CK.haptic.selection();
          chip = Number(el.dataset.pct);
          target = price() * (1 + chip / 100);
          const shown = toShown(target);
          field.value = fmt.num(shown, fmt.priceDigits(shown));
          paintForm();
        });
        add.addEventListener('click', () => {
          if (add.disabled) return;
          busy = true;
          paintForm();
          call('api/alerts', { token: inst.id, target, currency: CK.currency.shown, language: CK.i18n.lang }).then(() => {
            CK.haptic.success();
            CK.toast(tx('alerts.added'), { icon: 'bell', tone: 'accent' });
            field.value = '';
            target = null;
            chip = null;
          }, (err) => {
            CK.haptic.error();
            CK.toast(errorText(err.code), { icon: 'warning', tone: 'down' });
          }).finally(() => {
            busy = false;
            paintForm();
          });
        });
        listEl.addEventListener('click', (e) => {
          const x = e.target.closest('[data-remove]');
          const row = x && x.closest('[data-alert]');
          if (row) removeFrom(listEl, row.dataset.alert);
        });
        const off = DemoAlerts.onChange(() => {
          if (!b.isConnected) return off();
          paintList();
        });
        const timer = setInterval(() => {
          if (!b.isConnected) return clearInterval(timer);
          paintNow();
          paintForm();
        }, 1000);
        paintList();
        load().catch(() => { });
      }
    });
  }

  function openNote() {
    CK.sheet.open({
      title: tx('alerts.bell'),
      build(b) {
        b.innerHTML = `<div class="group pa-all">${CK.emptyState({ icon: 'bell', title: tx('alerts.tgOnly') })}</div>`;
      }
    });
  }

  function openList(o) {
    if (CK.sheet.top) return;
    if (o.stack) {
      const screen = CK.screen({ title: () => tx('alerts.row') });
      o.stack.push(screen, { returnFocus: o.from });
      fillList(screen.body, null, o, (el) => { const trail = screen.el && screen.el.querySelector && screen.el.querySelector('.navbar-trail'); if (trail) trail.appendChild(el); });
      return;
    }
    CK.sheet.open({
      title: tx('alerts.row'),
      detents: [CK.sheet.overviewDetent()],
      build(b, sheet) { fillList(b, sheet, o, (el) => intoHead(sheet.el, el)); }
    });
  }
  function fillList(b, sheet, o, place) {
    b.innerHTML = `<div class="pa-page"><div class="group pa-list pa-all list--free"></div></div>`;
    const listEl = $('.pa-list', b);
    const edit = editButton(() => paint());
    if (place) place(edit.el);
    let failed = '', settled = list.length > 0;
    const learned = new Map();
    const instOf = (id) => (own(D.byId, id) && COIN_ID.test(id) ? D.byId[id] : D.instruments.get(id) || learned.get(id) || null);
    const logoOf = (a) => instOf(a.token) || { id: a.token, sym: a.symbol || '?', neutral: true, logo: null };
    const asked = new Set();
    function learn() {
      list.forEach((a) => {
        if (instOf(a.token) || asked.has(a.token) || !TOKEN_ID.test(a.token)) return;
        asked.add(a.token);
        CK.market.tokenItem(a.token).then((body) => {
          if (!body || !body.token || !b.isConnected) return;
          learned.set(a.token, D.instrumentOf(body.token));
          paint();
        }, () => { });
      });
    }
    function paint() {
      edit.show(list.length > 0);
      if (!list.length && !settled) {
        listEl.innerHTML = '<div class="wallet-skel"></div><div class="wallet-skel"></div>';
        return;
      }
      if (!list.length) {
        const text = failed === 'tg_only' ? tx('alerts.tgOnly') : failed ? tx('alerts.loadFail') : tx('alerts.none');
        const pick = !failed && o.pick ? `<button class="btn btn--tinted btn--small press pa-pick" type="button">${tx('alerts.pick')}</button>` : '';
        const retry = failed && failed !== 'tg_only' ? `<button class="btn btn--tinted btn--small press pa-retry" type="button">${tx('common.retry')}</button>` : pick;
        const empty = CK.emptyState({ icon: failed && failed !== 'tg_only' ? 'warning' : 'bell', title: text, actions: retry });
        if (listEl.querySelector('[data-alert]')) swapRows(listEl, [], empty, () => {});
        else listEl.innerHTML = empty;
        return;
      }
      const fromSkel = !listEl.querySelector('[data-alert]');
      swapRows(listEl, list.map((a) => a.id), list.map((a) => rowHtml(a, { logo: logoOf, tap: true, edit: edit.on })).join(''), () => {
        if (fromSkel && !CK.reducedMotion()) listEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
        learn();
      });
    }
    function ask() {
      load().then(() => { failed = ''; settled = true; paint(); }, (err) => {
        failed = err.code || 'bad_response';
        settled = true;
        paint();
      });
    }
    listEl.addEventListener('click', (e) => {
      if (e.target.closest('.pa-pick')) {
        CK.haptic.light();
        if (sheet) sheet.close();
        o.pick();
        return undefined;
      }
      if (e.target.closest('.pa-retry')) {
        CK.haptic.light();
        failed = '';
        settled = false;
        paint();
        ask();
        return undefined;
      }
      const row = e.target.closest('[data-alert]');
      if (!row) return undefined;
      if (e.target.closest('[data-remove]')) return removeFrom(listEl, row.dataset.alert);
      const a = list.find((one) => one.id === row.dataset.alert);
      if (!a) return;
      CK.haptic.selection();
      if (sheet) {
        sheet.close();
        o.open(a.token, o.from);
      } else o.open(a.token, row);
    });
    listEl.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-alert]')) {
        e.preventDefault();
        e.target.click();
      }
    });
    const off = DemoAlerts.onChange(() => {
      if (!b.isConnected) return off();
      paint();
    });
    paint();
    ask();
  }

  window.DemoAlerts = {
    MAX,
    can(inst) {
      if (!inst || inst.viewOnly || inst.gas || !CK.tg.inside) return false;
      if (String(inst.id).startsWith('tron:')) return false;
      return inst.isToken ? TOKEN_ID.test(String(inst.id)) : COIN_ID.test(String(inst.id)) && D.byId[inst.id] === inst;
    },
    has(inst) { return !!inst && list.some((a) => a.token === inst.id); },
    get count() { return list.length; },
    open(inst) {
      if (CK.sheet.top) return;
      CK.haptic.light();
      loginData().then((initData) => {
        if (CK.sheet.top) return;
        if (!initData) openNote();
        else openSheet(inst);
      });
    },
    openList,
    load,
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    start() {
      load().catch(() => { });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) load().catch(() => {});
      });
    }
  };
})();
