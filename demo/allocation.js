(function () {
  'use strict';
  const { fmt, icon, esc, t: tx, tr } = CK;
  const { L, LA } = CK.i18n;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);

  const OTHER_COLOR = 'var(--al-other)';
  const BLUES = ['#0a5bd9', '#2f7cff', '#5596ff', '#7aafff', '#9fc6ff', '#bcd8ff'];
  const blueAt = (i) => BLUES[Math.min(i, BLUES.length - 1)];
  const MAX_SLICES = 6;
  const REPAINT_MS = 120;
  const FIRST_ROWS = 6, ROWS_PER_FRAME = 3;
  const STEPS_WAIT_MS = 170;
  const LANDED_MS = 620;
  const MIN_CONTRAST = 2;

  const VIEW = 240, MID = VIEW / 2, R = 98, STROKE = 22, LIFT = 7;
  const CIRCLE = Math.PI * 2;
  const CAP = (STROKE / 2) / R;
  const GAP = 5.5 / R;
  const MIN_SPAN = CAP * 2 + GAP + .004;
  const BAND_IN = R - STROKE / 2 - 9, BAND_OUT = R + STROKE / 2 + 12;

  let ctx = null;

  const shareText = (v) => `${fmt.num(v, 1)}${CK.i18n.lang === 'en' ? '' : ' '}%`;
  const partText = (o) => (o.priced === false ? `0${CK.i18n.lang === 'en' ? '' : ' '}%` : o.share === 0 && o.usd > 0 ? `<${shareText(.1)}` : shareText(o.share));
  const usdText = (o) => (o.priced === false ? fmt.money('0') : fmt.usd(o.usd));
  const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  const tile = (o, size) => `<span class="al-tile${o.color === OTHER_COLOR ? ' al-tile--other' : ''}" style="--c:${o.color};--s:${size}px" aria-hidden="true">${icon(o.tile, { size: Math.round(size * .56), fill: true })}</span>`;
  const logoOf = (o, size) => (o.coin ? CK.coinLogo(o.coin, size) : tile(o, size));

  function assignShares(rows) {
    const base = rows.reduce((s, r) => s + Math.max(0, r.usd), 0);
    const exact = rows.map((r) => (base > 0 ? Math.max(0, r.usd) / base * 1000 : 0));
    const whole = exact.map(Math.floor);
    let left = base > 0 ? 1000 - whole.reduce((s, v) => s + v, 0) : 0;
    exact.map((v, i) => [v - whole[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
      if (left > 0) { whole[i] += 1; left -= 1; }
    });
    rows.forEach((r, i) => { r.tenths = whole[i]; r.share = whole[i] / 10; });
    return base;
  }

  const counted = () => D.counted().filter((h) => h.risk !== 'suspicious');
  function readModel() {
    const totals = D.totals();
    const held = counted();
    const twice = new Set(held.map((h) => h.coin.name).filter((name, i, all) => all.indexOf(name) !== i));
    const rows = held.map((h) => ({ id: h.coin.id, name: twice.has(h.coin.name) ? `${h.coin.name} · ${h.net || 'TON'}` : h.coin.name, usd: h.usd, priced: h.priced !== false, color: h.coin.color, coin: h.coin }));
    rows.sort((a, b) => b.usd - a.usd);
    rows.forEach((r, i) => { r.color = blueAt(i); });
    const base = assignShares(rows);

    const positive = rows.filter((r) => r.usd > 0);
    const folded = positive.length > MAX_SLICES ? positive.slice(MAX_SLICES - 1) : [];
    const slices = positive.slice(0, positive.length - folded.length);
    slices.forEach((r) => { r.slice = r.id; });
    if (folded.length) {
      folded.forEach((r) => { r.slice = '@other'; });
      slices.push({
        id: '@other', slice: '@other', name: tx('portfolio.other'), color: OTHER_COLOR, tile: 'more',
        usd: folded.reduce((s, r) => s + r.usd, 0),
        share: folded.reduce((s, r) => s + r.tenths, 0) / 10
      });
    }
    return { totals, rows, slices, base, held: held.length };
  }

  function ringLayout(slices, base) {
    if (slices.length === 1) return [{ a0: 0, a1: CIRCLE, v0: 0, v1: CIRCLE, closed: true }];
    const raw = slices.map((s) => s.usd / base * CIRCLE);
    const small = raw.filter((a) => a < MIN_SPAN);
    const large = raw.reduce((s, a) => s + (a < MIN_SPAN ? 0 : a), 0);
    const room = CIRCLE - small.length * MIN_SPAN;
    let at = 0;
    return raw.map((a) => {
      const span = a < MIN_SPAN ? MIN_SPAN : a / large * room;
      const part = { a0: at, a1: at + span, v0: at + GAP / 2 + CAP, v1: at + span - GAP / 2 - CAP };
      at += span;
      return part;
    });
  }

  const luminance = (c) => {
    const [r, g, b] = c.map((v) => {
      const x = v / 255;
      return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
    });
    return .2126 * r + .7152 * g + .0722 * b;
  };
  const contrast = (a, b) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  };
  function colorReader(probe) {
    const rgb = (color) => {
      probe.style.color = '';
      probe.style.color = color;
      return getComputedStyle(probe).color.match(/[\d.]+/g).slice(0, 3).map(Number);
    };
    return (color, cardCss) => {
      const card = cardCss.match(/[\d.]+/g).slice(0, 3).map(Number);
      const toward = luminance(card) < .4 ? 255 : 0;
      let c = rgb(color);
      for (let i = 0; i < 10 && contrast(c, card) < MIN_CONTRAST; i++) c = c.map((v) => v + (toward - v) * .12);
      return `rgb(${c.map(Math.round).join(',')})`;
    };
  }

  function open() {
    if (CK.sheet.top || document.documentElement.classList.contains('market-pending')) return;
    let selected = null, closed = false;
    let model = null, lastShape = '', timer = 0, sheet = null;
    let revealAnims = [], mixAnim = null, popAnim = null, mix = 0, shownLogo = null;
    let sliceState = new Map(), rowEls = new Map();
    let steps = [], stepFrame = 0, landTimer = 0;
    const followed = new Set();
    let els = null, readColor = null;
    const hideRow = !!(ctx && typeof ctx.hideSmall === 'function' && typeof ctx.setHideSmall === 'function');

    const sliceOf = (id) => {
      if (!id) return null;
      if (id === '@other') return id;
      const row = model.rows.find((r) => r.id === id);
      return row ? row.slice || null : null;
    };
    const entryOf = (id) => model.rows.find((r) => r.id === id) || model.slices.find((s) => s.id === id) || null;

    function paintSlice(s) {
      const g = s.geom;
      const mid = (g.a0 + g.a1) / 2 - Math.PI / 2;
      s.el.setAttribute('stroke-dasharray', `${Math.max(.01, (g.v1 - g.v0) * R).toFixed(2)} ${(CIRCLE * R).toFixed(2)}`);
      s.el.setAttribute('stroke-dashoffset', (-g.v0 * R).toFixed(2));
      const lift = g.closed ? 0 : s.lift * LIFT;
      s.el.setAttribute('transform', `translate(${(Math.cos(mid) * lift).toFixed(2)} ${(Math.sin(mid) * lift).toFixed(2)}) rotate(-90 ${MID} ${MID})`);
      s.el.style.opacity = (1 - s.dim * .72).toFixed(3);
    }
    function paintMix() {
      els.total.style.opacity = (1 - mix).toFixed(3);
      els.total.style.transform = `scale(${(1 - mix * .1).toFixed(4)})`;
      els.chosen.style.opacity = mix.toFixed(3);
      els.chosen.style.transform = `scale(${(.9 + mix * .1).toFixed(4)})`;
    }
    function spring(s, key, to) {
      const running = s.anims[key];
      const velocity = running ? running.velocity : 0;
      if (running) running.stop();
      s.anims[key] = CK.spring({
        from: s[key], to, velocity, precision: .002, ...(key === 'lift' ? CK.springs.jelly : CK.springs.smooth),
        onUpdate(v) { s[key] = v; paintSlice(s); }
      });
    }
    function paintCenter() {
      const m = model.totals;
      const text = fmt.usd(m.value);
      els.value.dataset.len = text.length <= 10 ? 's' : text.length <= 12 ? 'm' : text.length <= 15 ? 'l' : 'xl';
      CK.roll(els.value, text);
      const entry = entryOf(selected);
      if (!entry) return;
      if (shownLogo !== entry.id) {
        shownLogo = entry.id;
        els.logo.innerHTML = logoOf(entry, 32);
        if (popAnim) popAnim.stop();
        popAnim = CK.spring({ from: .72, to: 1, precision: .002, ...CK.springs.jelly, onUpdate(v) { els.logo.style.transform = `scale(${v.toFixed(4)})`; } });
      }
      CK.roll(els.share, partText(entry));
      CK.roll(els.usd, usdText(entry));
    }
    function applySelection() {
      const onSlice = sliceOf(selected);
      sliceState.forEach((s) => {
        const on = s.id === onSlice;
        spring(s, 'lift', on ? 1 : 0);
        spring(s, 'dim', onSlice && !on ? 1 : 0);
      });
      rowEls.forEach((row, id) => {
        const on = id === selected || (selected === '@other' && row.slice === '@other');
        row.el.classList.toggle('is-on', on);
        row.el.setAttribute('aria-pressed', String(on));
      });
      paintCenter();
      els.chosen.setAttribute('aria-hidden', String(!selected));
      els.total.setAttribute('aria-hidden', String(!!selected));
      if (mixAnim) mixAnim.stop();
      mixAnim = CK.spring({ from: mix, to: selected ? 1 : 0, precision: .002, ...CK.springs.smooth, onUpdate(v) { mix = v; paintMix(); } });
    }
    function select(id) {
      if (id === selected) return;
      selected = id;
      if (!id) shownLogo = null;
      CK.haptic.selection();
      applySelection();
    }

    function rebuildRing(colors) {
      const before = sliceState;
      sliceState = new Map();
      els.slices.replaceChildren();
      model.slices.forEach((slice) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ['cx', 'cy'].forEach((a) => el.setAttribute(a, MID));
        el.setAttribute('r', R);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', colors(slice.color));
        el.setAttribute('stroke-width', STROKE);
        el.setAttribute('stroke-linecap', 'round');
        el.classList.add('al-slice');
        els.slices.appendChild(el);
        const old = before.get(slice.id);
        if (old) Object.values(old.anims).forEach((a) => a.stop());
        sliceState.set(slice.id, { id: slice.id, el, lift: old ? old.lift : 0, dim: old ? old.dim : 0, anims: {}, geom: null });
      });
      before.forEach((old, id) => { if (!sliceState.has(id)) Object.values(old.anims).forEach((a) => a.stop()); });
    }
    function rebuildRows(colors, gradual) {
      rowEls = new Map();
      if (!model.rows.length) {
        els.rows.innerHTML = CK.emptyState({ icon: 'wallet', title: tx('picker.none') });
        return;
      }
      const made = model.rows.map((r) => {
        const el = CK.el(`
        <button class="cell press-row al-row" type="button" data-id="${esc(r.id)}" style="--c:${colors(r.color)}" aria-pressed="false">
          <i class="al-dot" aria-hidden="true"></i>
          <span class="al-name">${esc(r.name)}</span>
          <b class="al-share" data-share></b>
        </button>`);
        rowEls.set(r.id, { el, slice: r.slice, share: r.share, shareEl: $('[data-share]', el) });
        return el;
      });
      els.rows.replaceChildren();
      if (gradual) queueRows(made);
      else els.rows.append(...made);
    }
    function queueRows(made) {
      els.rows.append(...made.slice(0, FIRST_ROWS));
      for (let i = FIRST_ROWS; i < made.length; i += ROWS_PER_FRAME) {
        const part = made.slice(i, i + ROWS_PER_FRAME);
        steps.push(() => els.rows.append(...part));
      }
    }
    function nextStep() {
      stepFrame = 0;
      if (closed) return;
      if (CK.sheet.motionLeft <= STEPS_WAIT_MS) {
        const step = steps.shift();
        if (step) step();
      }
      if (steps.length) stepFrame = requestAnimationFrame(nextStep);
    }
    function runSteps() {
      cancelAnimationFrame(stepFrame);
      stepFrame = requestAnimationFrame(nextStep);
    }
    function paintValues() {
      model.rows.forEach((r) => {
        const row = rowEls.get(r.id);
        row.slice = r.slice;
        row.share = r.share;
        setText(row.shareEl, partText(r));
      });
    }
    function render(force, gradual) {
      model = readModel();
      const card = getComputedStyle(sheet.el).backgroundColor;
      const colors = (c) => readColor(c, card);
      const shape = [card, model.rows.map((r) => r.id).join(), model.slices.map((s) => s.id).join()].join('|');
      const changed = force || shape !== lastShape;
      if (changed) {
        lastShape = shape;
        steps = [];
        rebuildRing(colors);
        rebuildRows(colors, gradual);
      }
      const layout = ringLayout(model.slices, model.base);
      model.slices.forEach((slice, i) => { sliceState.get(slice.id).geom = layout[i]; });
      paintValues();
      if (selected && !entryOf(selected)) selected = null;
      paintCenter();
      sliceState.forEach(paintSlice);
      els.trackArt.style.opacity = model.slices.length ? '0' : '1';
      if (changed && (selected || mix > 0)) applySelection();
      syncFollowed();
    }
    function syncFollowed() {
      counted().forEach((h) => {
        if (!h.coin.isToken || followed.has(h.coin)) return;
        followed.add(h.coin);
        DemoTrade.watch(h.coin);
        DemoTrade.refreshToken(h.coin);
      });
    }
    function drawIn() {
      revealAnims.forEach((a) => a.cancel());
      revealAnims = [];
      if (!model.slices.length || CK.reducedMotion()) return;
      const timing = { duration: 560, easing: 'cubic-bezier(.22, 1, .36, 1)' };
      revealAnims = [
        els.art.animate([{ opacity: 0, transform: 'rotate(-48deg) scale(.93)' }, { opacity: 1, transform: 'none' }], timing),
        els.trackArt.animate([{ opacity: 1 }, { opacity: 0 }], timing)
      ];
    }
    function buildContent() {
      render(true, true);
      drawIn();
      runSteps();
    }
    function polar(e) {
      const box = els.ring.getBoundingClientRect();
      const unit = box.width / VIEW;
      const x = (e.clientX - box.left) / unit - MID, y = (e.clientY - box.top) / unit - MID;
      let angle = Math.atan2(y, x) + Math.PI / 2;
      if (angle < 0) angle += CIRCLE;
      return { dist: Math.hypot(x, y), angle };
    }
    function sliceAt(angle) {
      const hit = Array.from(sliceState.values()).find((s) => angle >= s.geom.a0 && angle < s.geom.a1);
      return hit ? hit.id : null;
    }
    let scrub = null, bandPress = false;
    function wireRing() {
      const ring = els.ring;
      ring.addEventListener('pointerdown', (e) => {
        bandPress = false;
        if (e.button !== 0 || !e.isPrimary || !sliceState.size) return;
        const at = polar(e);
        if (at.dist < BAND_IN || at.dist > BAND_OUT) return;
        e.stopPropagation();
        bandPress = true;
        scrub = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
        const done = () => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up);
          document.removeEventListener('pointercancel', cancel);
          scrub = null;
        };
        const move = (ev) => {
          if (ev.pointerId !== scrub.id) return;
          if (!scrub.moved && Math.hypot(ev.clientX - scrub.x0, ev.clientY - scrub.y0) < 6) return;
          scrub.moved = true;
          const id = sliceAt(polar(ev).angle);
          if (id && id !== sliceOf(selected)) select(id);
        };
        const up = (ev) => {
          if (ev.pointerId !== scrub.id) return;
          const tapped = !scrub.moved;
          done();
          if (tapped) {
            const id = sliceAt(polar(ev).angle);
            if (id) select(id === selected ? null : id);
          }
        };
        const cancel = (ev) => { if (ev.pointerId === scrub.id) done(); };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', cancel);
      });
      ring.addEventListener('touchstart', (e) => { if (scrub) e.stopPropagation(); }, { passive: true });
      ring.addEventListener('touchmove', (e) => {
        if (!scrub) return;
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      ring.addEventListener('click', (e) => {
        if (!bandPress && selected && polar(e).dist < BAND_IN) select(null);
        bandPress = false;
      });
    }

    function schedule() {
      if (timer || closed) return;
      timer = setTimeout(() => {
        timer = 0;
        if (!closed) render();
      }, REPAINT_MS);
    }
    const onTick = () => schedule();

    function dispose() {
      closed = true;
      clearTimeout(timer);
      clearTimeout(landTimer);
      cancelAnimationFrame(stepFrame);
      ctx.tickListeners.delete(onTick);
      followed.forEach((c) => DemoTrade.unwatch(c));
      revealAnims.forEach((a) => a.cancel());
      [mixAnim, popAnim].forEach((a) => { if (a) a.stop(); });
      sliceState.forEach((s) => Object.values(s.anims).forEach((a) => a.stop()));
    }

    CK.sheet.open({
      title: tr('portfolio.alloc'),
      detents: [CK.sheet.overviewDetent()],
      onClose: dispose,
      build(body, api) {
        sheet = api;
        body.classList.add('al-sheet');
        body.innerHTML = `
          <div class="al-ring">
            <svg class="al-track-art" viewBox="0 0 ${VIEW} ${VIEW}" aria-hidden="true"><circle class="al-track" cx="${MID}" cy="${MID}" r="${R}" fill="none" stroke-width="${STROKE}"></circle></svg>
            <svg class="al-art" viewBox="0 0 ${VIEW} ${VIEW}" role="img" ${LA('portfolio.allocAria')}><g class="al-slices"></g></svg>
            <div class="al-center">
              <div class="al-c al-total">
                <span class="al-value"></span>
              </div>
              <div class="al-c al-chosen">
                <span class="al-logo"></span>
                <span class="al-chosen-share"></span>
                <span class="al-chosen-usd"></span>
              </div>
            </div>
          </div>
          <div class="al-fade">
            <div class="group al-rows list--free"></div>
            ${hideRow ? `<div class="cell al-hide"><span class="cell-title al-hide-title" ${L('portfolio.hideSmall')}>${tx('portfolio.hideSmall')}</span><span class="cell-value" ${L('portfolio.hideSmallSub')}>${tx('portfolio.hideSmallSub')}</span><button class="al-hide-switch"></button></div>` : ''}
          </div>
          <i class="al-probe" aria-hidden="true"></i>`;
        els = {
          ring: $('.al-ring', body), trackArt: $('.al-track-art', body), art: $('.al-art', body), slices: $('.al-slices', body),
          total: $('.al-total', body), chosen: $('.al-chosen', body), value: $('.al-value', body),
          logo: $('.al-logo', body), share: $('.al-chosen-share', body), usd: $('.al-chosen-usd', body),
          rows: $('.al-rows', body)
        };
        if (hideRow) CK.toggle($('.al-hide-switch', body), { label: tr('portfolio.hideSmall'), value: ctx.hideSmall(), onChange: (on) => ctx.setHideSmall(on) });
        readColor = colorReader($('.al-probe', body));
        els.rows.addEventListener('click', (e) => {
          const row = e.target.closest('[data-id]');
          if (!row) return;
          const id = row.dataset.id;
          select(id === selected ? null : id);
          const ring = els.ring.getBoundingClientRect(), top = body.getBoundingClientRect().top;
          if (selected && ring.top + ring.height / 2 < top) body.scrollTo({ top: 0, behavior: CK.reducedMotion() ? 'auto' : 'smooth' });
        });
        wireRing();
        paintMix();
        els.chosen.setAttribute('aria-hidden', 'true');
        model = readModel();
        paintCenter();
        CK.i18n.bind(body, () => { if (!closed) render(true); });
      }
    });
    requestAnimationFrame(() => { if (!closed) buildContent(); });
    landTimer = setTimeout(() => { if (!closed) ctx.tickListeners.add(onTick); }, LANDED_MS);
  }

  const SHORT_NET = { Ethereum: 'Eth', Arbitrum: 'Arb', 'BNB Chain': 'BNB', Polygon: 'Pol', Optimism: 'OP', Avalanche: 'Avax', Monad: 'Mon', Unichain: 'Uni', Solana: 'Sol' };
  let blockProbe = null, blockRead = null;
  const blockColors = new Map();
  function blockColor(color) {
    const host = document.getElementById('alloc');
    if (!host || !color) return color;
    const card = getComputedStyle(host).backgroundColor;
    const parts = card.match(/[\d.]+/g);
    if (!parts || parts.length < 3 || (parts.length > 3 && Number(parts[3]) === 0)) return color;
    const key = color + '|' + card;
    let out = blockColors.get(key);
    if (out) return out;
    if (!blockProbe) {
      blockProbe = document.createElement('i');
      blockProbe.className = 'al-probe';
      blockProbe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(blockProbe);
      blockRead = colorReader(blockProbe);
    }
    try { out = blockRead(color, card); } catch (e) { out = color; }
    blockColors.set(key, out);
    return out;
  }
  window.DemoAllocation = {
    build(context) { ctx = context; },
    open,
    parts() {
      const held = counted().filter((h) => h.usd > 0);
      const twice = new Set(held.map((h) => h.coin.sym).filter((sym, i, all) => all.indexOf(sym) !== i));
      const short = (net) => SHORT_NET[net] || net || 'TON';
      const rows = held.map((h) => ({ sym: twice.has(h.coin.sym) ? `${h.coin.sym} · ${short(h.net)}` : h.coin.sym, v: h.usd }));
      rows.sort((a, b) => b.v - a.v);
      rows.forEach((r, i) => { r.color = blockColor(blueAt(i)); });
      return rows;
    }
  };
})();
