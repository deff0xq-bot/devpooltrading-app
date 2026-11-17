(function () {
  'use strict';
  const CK = window.CK;
  const { fmt, t } = CK;
  const TICK_HOLD_MAX_MS = 3000;
  const TICK_SLICE_MS = 4;
  const HIDE_KEY = 'ck.balanceHidden';
  function hiddenKept() {
    try { return localStorage.getItem(HIDE_KEY) === '1'; } catch (_) { return false; }
  }

  CK.COIN_LOGOS = CK.COIN_LOGOS || {};

  CK.initials = (sym) => Array.from(String(sym || '?')).slice(0, 2).join('').toUpperCase();

  CK.logos = (function () {
    const MEMORY_MAX = 400;
    const DEVICE_MAX = 300;
    const RESTORED_AT_LAUNCH = 150;
    const STORE = 'ck-logos-v1';
    const INDEX_KEY = 'ck.logos.v1';
    const SAVE_INDEX_MS = 1500;
    const kept = (u) => typeof u === 'string' && u.startsWith('api/logos?');
    const memory = new Map();
    const waiting = new Map();
    let index = [];
    try { index = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]').filter(kept).slice(-DEVICE_MAX); } catch (_) { index = []; }
    let indexTimer = 0;
    const store = (() => {
      try { return window.caches && window.isSecureContext ? caches.open(STORE) : null; } catch (_) { return null; }
    })();
    if (store) store.catch(() => {});
    const remember = (u, entry) => {
      memory.delete(u);
      memory.set(u, entry);
      if (memory.size > MEMORY_MAX) memory.delete(memory.keys().next().value);
    };
    function writeIndex() {
      clearTimeout(indexTimer);
      indexTimer = 0;
      try { localStorage.setItem(INDEX_KEY, JSON.stringify(index)); } catch (_) { }
    }
    function saveIndex() {
      if (!indexTimer) indexTimer = setTimeout(writeIndex, SAVE_INDEX_MS);
    }
    addEventListener('pagehide', () => { if (indexTimer) writeIndex(); });
    function onDevice(u) {
      const at = index.indexOf(u);
      if (at >= 0) index.splice(at, 1);
      index.push(u);
      const dropped = index.length > DEVICE_MAX ? index.splice(0, index.length - DEVICE_MAX) : [];
      saveIndex();
      if (!store) return;
      store.then((c) => {
        dropped.forEach((d) => c.delete(d).catch(() => {}));
        if (at >= 0) return undefined;
        return fetch(u, { cache: 'force-cache', credentials: 'omit', referrerPolicy: 'no-referrer' }).then((res) => (res.status === 200 ? c.put(u, res) : undefined));
      }).catch(() => {});
    }
    function decode(u, src) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.decoding = 'async';
      if ('fetchPriority' in img) img.fetchPriority = 'high';
      img.src = src;
      return (img.decode ? img.decode() : new Promise((ok, no) => { img.onload = ok; img.onerror = no; })).then(() => {
        if (!img.naturalWidth) throw new Error('empty');
        remember(u, { src, img });
        return true;
      });
    }
    if (store && index.length) {
      store.then((c) => Promise.all(index.slice(-RESTORED_AT_LAUNCH).reverse().map((u) => c.match(u).then((res) => {
        if (!res || memory.has(u)) return undefined;
        return res.blob().then((blob) => (memory.has(u) ? undefined : decode(u, URL.createObjectURL(blob))));
      }).catch(() => {})))).catch(() => {});
    }
    return {
      ready: (u) => !!u && memory.has(u),
      src(u) {
        const e = u && memory.get(u);
        if (!e) return u;
        remember(u, e);
        return e.src;
      },
      hold(u) {
        if (!u) return Promise.resolve(false);
        if (memory.has(u)) return Promise.resolve(true);
        let p = waiting.get(u);
        if (p) return p;
        p = decode(u, u).then(() => {
          if (kept(u)) onDevice(u);
          return true;
        }, () => false).finally(() => waiting.delete(u));
        waiting.set(u, p);
        return p;
      }
    };
  })();

  CK.coinLogo = function (c, size) {
    const s = size || 40;
    const src = CK.COIN_LOGOS[c.id] || c.logo;
    const tile = c.neutral ? CK.initials(c.sym) : c.sym;
    const ready = !!src && CK.logos.ready(src);
    if (src && !ready) CK.logos.hold(src);
    if (src) return `<span class="coin coin--tile coin--neutral coin--stack" style="--coin-size:${s}px" aria-hidden="true"><i>${CK.esc(tile)}</i><img class="coin--logo${ready ? ' is-on' : ''}" src="${CK.esc(ready ? CK.logos.src(src) : src)}" alt="" width="${s}" height="${s}" draggable="false" decoding="${ready ? 'sync' : 'async'}" referrerpolicy="no-referrer" data-tile="${CK.esc(tile)}"${c.logoAlt && c.logoAlt !== src ? ` data-alt="${CK.esc(c.logoAlt)}"` : ''}></span>`;
    if (c.neutral) return `<span class="coin coin--tile coin--neutral" style="--coin-size:${s}px" aria-hidden="true"><b>${CK.esc(tile)}</b></span>`;
    return `<span class="coin coin--tile" style="--c:${c.color};--coin-size:${s}px" aria-hidden="true"><b>${CK.esc(tile)}</b></span>`;
  };
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.dataset.tile) return;
    if (img.dataset.alt) {
      const alt = img.dataset.alt;
      delete img.dataset.alt;
      img.src = alt;
      return;
    }
    img.remove();
  }, true);
  document.addEventListener('load', (e) => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.dataset.tile) img.classList.add('is-on');
  }, true);

  CK.tile = function (icon, o) {
    const opts = o || {};
    const size = opts.size || 29;
    return `<span class="tile tile--${opts.tone || 'blue'}" style="--tile-size:${size}px" aria-hidden="true">${CK.icon(icon, { fill: opts.fill !== false, size: Math.round(size * .62) })}</span>`;
  };

  let uid = 0;
  function smoothPath(pts) {
    let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  }
  function toPoints(series, w, h, padTop, padBottom) {
    const lo = Math.min(...series), hi = Math.max(...series);
    const span = hi - lo || 1;
    return series.map((v, i) => [
      (i / (series.length - 1)) * w,
      padTop + (1 - (v - lo) / span) * (h - padTop - padBottom)
    ]);
  }

  CK.sparkline = function (series, o) {
    const opts = o || {};
    const w = opts.width || 100, h = opts.height || 32;
    const pad = Array.isArray(opts.pad) ? opts.pad : [opts.pad != null ? opts.pad : 3, opts.pad != null ? opts.pad : 3];
    const pts = toPoints(series, w, h, pad[0], pad[1]);
    const line = smoothPath(pts);
    const id = opts.id || 'spark' + (++uid);
    const up = opts.up != null ? !!opts.up : series[series.length - 1] >= series[0];
    const end = pts[pts.length - 1];
    return `<span class="${opts.cls || 'spark'} ${up ? 'is-up' : 'is-down'}" aria-hidden="true" style="--end-y:${(end[1] / h * 100).toFixed(1)}%">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".26"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
        <path d="${line}L${w} ${h}L0 ${h}Z" fill="url(#${id})"/>
        <path d="${line}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      </svg>${opts.dot === false ? '' : `
      <i class="spark-dot"></i>`}
    </span>`;
  };

  CK.changeFlat = (v) => Math.round(Math.abs(v) * 100) === 0;
  CK.changeText = (v) => {
    const flat = CK.changeFlat(v);
    return `${flat ? '' : v >= 0 ? '+' : '−'}${fmt.pctAbs(v)}`;
  };

  CK.changePill = function (v, o) {
    const flat = CK.changeFlat(v), up = v >= 0 || flat;
    return `<span class="change ${up ? 'is-up' : 'is-down'}${flat ? ' is-flat' : ''} ${o && o.plain ? 'change--plain' : ''}" data-change><span>${CK.changeText(v)}</span></span>`;
  };

  CK.cards = {
    coin(c) {
      return `
      <button class="card coin-card press" type="button" data-coin="${c.id}" aria-label="${c.name}, ${fmt.price(c.price)}">
        <span class="coin-card-top">${CK.coinLogo(c, 36)}${CK.changePill(c.change)}</span>
        <span class="coin-card-name">${c.name}</span>
        <span class="coin-card-price" data-price>${fmt.price(c.price)}</span>
      </button>`;
    },

    balance(b) {
      const eye = `<button class="balance-eye press" type="button" aria-label="${t('balance.hide')}" aria-pressed="false">
            <span class="balance-eye-a">${CK.icon('eye-solid', { size: 20, fill: true })}</span><span class="balance-eye-b">${CK.icon('eye-solid-off', { size: 20, fill: true })}</span>
          </button>`;
      const total = `<div class="balance-total">
          <span class="balance-value" data-roll="${fmt.usd(b.value)}"></span>
          <span class="balance-mask" aria-hidden="true">••••••</span>
        </div>`;
      return `
      <article class="balance">
        <div class="balance-top">
          ${b.head || `<span class="balance-label">${b.label}</span>`}
          ${b.eyeBy ? '' : eye}
        </div>
        ${b.eyeBy ? `<div class="balance-line">${total}${eye}</div>` : total}
        <div class="balance-bottom">
          <div class="balance-day" hidden><span class="balance-day-pill"><b></b></span><span class="balance-day-label" data-i18n="alloc.day24">${t('alloc.day24')}</span></div>
          ${b.address ? `<button class="balance-address press" type="button" data-copy-address aria-label="${t('common.copyAddress')}"><span></span>${CK.icon('copy', { size: 14 })}</button>` : ''}
        </div>
        ${b.foot || ''}
      </article>`;
    },
    setBalanceDay(card, day) {
      const line = card && card.querySelector('.balance-day');
      if (!line) return;
      line.hidden = !day;
      if (!day) return;
      const flat = CK.changeFlat(day.pnlPct) && Math.round(Math.abs(day.pnl) * 100) === 0;
      const down = !flat && day.pnl < 0;
      const text = `${flat ? '' : down ? '−' : '+'}${fmt.pctAbs(day.pnlPct)}`;
      const b = line.querySelector('b');
      if (b.textContent !== text) b.textContent = text;
      line.classList.toggle('is-down', down);
      line.classList.toggle('is-flat', flat);
    },
    dressBalance(value) {
      const text = value.getAttribute('aria-label') || '';
      const sep = fmt.num(1.5, 1).replace(/\d/g, '').charAt(0);
      const kids = value.children;
      let at = -1;
      for (let i = kids.length - 1; i >= 0; i--) {
        if (kids[i].classList.contains('roll-c') && sep && kids[i].textContent === sep) { at = i; break; }
      }
      for (let i = 0; i < kids.length; i++) kids[i].classList.toggle('roll-frac', at >= 0 && i >= at);
      const total = value.parentElement;
      if (total) total.classList.toggle('is-long', Array.from(text).length > 13);
    },
    rollBalance(value, text) {
      if (!value || (value.getAttribute('aria-label') === text && value.childElementCount)) return;
      const partOf = (n) => (n.classList.contains('roll-d') && n.firstElementChild ? n.firstElementChild._d : n.textContent);
      const before = new Map(Array.from(value.children, (n) => [n, partOf(n)]));
      CK.roll(value, text);
      if (!before.size) return;
      const changed = Array.from(value.children).filter((n) => {
        if (before.has(n) && before.get(n) === partOf(n)) return false;
        n.classList.remove('roll-enter');
        return true;
      });
      if (changed.length && CK.motion) CK.motion.rows(changed, { fresh: true, stagger: 14 });
    },
    wireBalance(root) {
      root.querySelectorAll('.balance').forEach((card) => {
        const value = card.querySelector('.balance-value');
        CK.roll(value, value.dataset.roll);
        CK.cards.dressBalance(value);
        if (window.MutationObserver) new MutationObserver(() => CK.cards.dressBalance(value)).observe(value, { attributes: true, attributeFilter: ['aria-label'] });
        const eye = card.querySelector('.balance-eye');
        const paintEye = () => eye.setAttribute('aria-label', t(eye.getAttribute('aria-pressed') === 'true' ? 'balance.show' : 'balance.hide'));
        const set = (hide) => {
          eye.setAttribute('aria-pressed', String(hide));
          card.classList.toggle('is-hidden', hide);
          document.documentElement.classList.toggle('balances-hidden', hide);
        };
        set(hiddenKept());
        eye.addEventListener('click', () => {
          const hide = eye.getAttribute('aria-pressed') !== 'true';
          set(hide);
          try { localStorage.setItem(HIDE_KEY, hide ? '1' : ''); } catch (_) { }
          paintEye();
          CK.haptic.light();
        });
        CK.i18n.bind(eye, paintEye);
      });
    },

    market(c, o) {
      const opts = o || {};
      return `
      <button class="cell market-row press-row" type="button" data-coin="${c.id}" aria-label="${c.name}, ${fmt.price(c.price)}">
        ${CK.coinLogo(c, 40)}
        <span class="market-name"><b>${c.name}</b><span>${c.sym}${opts.sub ? ' · ' + opts.sub : ''}</span></span>
        <span class="market-price"><b data-price>${fmt.price(c.price)}</b>${CK.changePill(c.change, { plain: true })}</span>
      </button>`;
    }
  };

  CK.changeTick = function (el, v) {
    const flat = CK.changeFlat(v), up = v >= 0 || flat;
    el.classList.toggle('is-flat', flat);
    el.classList.toggle('is-up', up);
    el.classList.toggle('is-down', !up);
    const glyph = el.querySelector(':scope > svg, :scope > .icon');
    if (glyph) glyph.remove();
    const text = CK.changeText(v), num = el.querySelector(':scope > .change-num') || el.lastElementChild;
    if (!num) {
      if (el.textContent !== text) el.textContent = text;
      return;
    }
    if (num.classList.contains('roll')) CK.roll(num, text);
    else if (num.textContent !== text) num.textContent = text;
  };

  function tickRest(el, text) {
    if (el.classList.contains('roll')) {
      el.classList.remove('roll');
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
    }
    if (el.firstElementChild || el.textContent !== text) el.textContent = text;
  }
  const wheeled = (el) => el.classList.contains('roll') && el.childElementCount > 0;
  function landTick(el, text, up) {
    const shown = wheeled(el) ? el.getAttribute('aria-label') : el.textContent;
    if (shown === text) return;
    if ((up !== true && up !== false) || typeof CK.roll !== 'function' || !el.animate || (CK.reducedMotion && CK.reducedMotion())) {
      tickRest(el, text);
      return;
    }
    if (!wheeled(el)) CK.roll(el, shown);
    CK.roll(el, text, undefined, up);
  }

  const tickQueue = new Map();
  let tickFrame = 0, tickTimer = 0, tickHeldAt = 0;
  function scheduleTicks() {
    if (tickFrame || tickTimer) return;
    if (!tickQueue.size) return;
    tickFrame = requestAnimationFrame(flushTicks);
  }
  function flushTicks() {
    tickFrame = 0;
    const now = performance.now();
    const left = Math.max(CK.scrollLeft(), CK.sheet ? CK.sheet.motionLeft : 0, CK.inFlight() ? 50 : 0);
    if (!left) tickHeldAt = 0;
    else if (!tickHeldAt) tickHeldAt = now;
    if (left && now - tickHeldAt < TICK_HOLD_MAX_MS) {
      tickTimer = setTimeout(() => { tickTimer = 0; scheduleTicks(); }, left);
      return;
    }
    const sliceEnd = now + TICK_SLICE_MS;
    let more = false;
    for (const [el, tick] of tickQueue) {
      if (el._inView === null) continue;
      tickQueue.delete(el);
      if (!el.isConnected) continue;
      if (!el._inView) {
        el._late = tick.text;
        continue;
      }
      landTick(el, tick.text, tick.up);
      if (performance.now() >= sliceEnd) {
        more = true;
        break;
      }
    }
    if (more) scheduleTicks();
  }
  const tickWatch = window.IntersectionObserver ? new IntersectionObserver((entries) => {
    entries.forEach(({ target: el, isIntersecting }) => {
      el._inView = isIntersecting;
      if (!isIntersecting) return;
      if (el._late !== undefined) {
        if (!tickQueue.has(el)) tickQueue.set(el, { text: el._late, up: null });
        el._late = undefined;
      }
    });
    scheduleTicks();
  }) : null;

  CK.priceTick = function (el, text, up) {
    if (el._inView === undefined) {
      el._inView = tickWatch ? null : true;
      if (tickWatch) tickWatch.observe(el);
    }
    if (up === true || up === false) {
      tickQueue.set(el, { text, up });
      scheduleTicks();
      return;
    }
    tickQueue.delete(el);
    if (el._inView === false && el.hasAttribute('data-price')) {
      el._late = text;
      return;
    }
    el._late = undefined;
    tickRest(el, text);
  };
})();
