(function () {
  'use strict';
  const CK = window.CK;
  const { clamp } = CK;
  const THUMB = 28;
  const INPUT_EVERY_MS = 90;

  CK.slider = function (host, o) {
    const min = o.min == null ? 0 : o.min, max = o.max == null ? 100 : o.max;
    const floor = o.floor == null ? min : o.floor;
    const step = o.step || 1;
    const stops = o.stops || [.25, .5, .75, 1];
    const format = o.format || ((v) => String(v));
    const stopLabel = o.stopLabel || ((p) => Math.round(p * 100) + (CK.i18n && CK.i18n.lang === 'en' ? '' : '\u00a0') + '%');
    host.classList.add('slider');
    if (o.risk) host.classList.add('slider--risk');
    host.innerHTML = `
      <div class="slider-control" role="slider" tabindex="0" aria-label="${o.label}" aria-valuemin="${floor}" aria-valuemax="${max}">
        <div class="slider-track">
          <div class="slider-fill"><div class="slider-fill-in"></div></div>
          ${stops.filter((s) => s < 1).map((s) => `<i class="slider-tick" data-p="${s}" style="left:calc(${THUMB / 2}px + ${s} * (100% - ${THUMB}px))"></i>`).join('')}
        </div>
        <div class="slider-thumb"><span class="slider-bubble" aria-hidden="true"></span></div>
      </div>
      <div class="slider-stops">
        ${stops.map((s) => `<button class="slider-stop" type="button" data-p="${s}" aria-label="${stopLabel(s)}" style="left:calc(${THUMB / 2}px + ${s} * (100% - ${THUMB}px));width:44px;min-width:0;height:28px;padding:0"></button>`).join('')}
      </div>`;
    const control = host.querySelector('.slider-control');
    const fill = host.querySelector('.slider-fill');
    const fillIn = host.querySelector('.slider-fill-in');
    const thumb = host.querySelector('.slider-thumb');
    const bubble = host.querySelector('.slider-bubble');
    const ticks = Array.from(host.querySelectorAll('.slider-tick'));
    const stopButtons = Array.from(host.querySelectorAll('.slider-stop'));

    let width = 0, p = valueToP(o.value == null ? min : o.value), shown = p, anim = null, lastStop = null;

    function valueToP(v) { return clamp((v - min) / (max - min), 0, 1); }
    function pToValue(x) {
      const raw = min + x * (max - min);
      return clamp(Math.round(raw / step) * step, floor, max);
    }
    function paint() {
      const center = THUMB / 2 + shown * (width - THUMB);
      thumb.style.transform = `translate3d(${center - THUMB / 2}px,0,0)`;
      fill.style.transform = `translate3d(${center - width}px,0,0)`;
      fillIn.style.transform = `translate3d(${width - center}px,0,0)`;
    }
    function renderState() {
      const value = pToValue(p);
      const text = format(value);
      control.setAttribute('aria-valuenow', String(value));
      control.setAttribute('aria-valuetext', text);
      bubble.textContent = text;
      ticks.forEach((t) => t.classList.toggle('is-on', Number(t.dataset.p) <= p + .0005));
      stopButtons.forEach((b) => b.classList.toggle('is-on', Math.abs(Number(b.dataset.p) - p) < .0005));
    }
    function setP(next, opts) {
      const a = opts || {};
      p = clamp(next, 0, 1);
      renderState();
      if (a.animate) {
        if (anim) anim.stop();
        anim = CK.spring({ from: shown, to: p, precision: .0005, ...CK.springs.settle, onUpdate(v) { shown = clamp(v, 0, 1); paint(); } });
      } else {
        if (anim) anim.stop();
        shown = p;
        paint();
      }
      if (a.silent) holdInput();
      else if (!a.paced || performance.now() - inputAt >= INPUT_EVERY_MS) sendInput();
      else if (!inputTimer) inputTimer = setTimeout(sendInput, INPUT_EVERY_MS);
    }
    let inputAt = 0, inputTimer = 0;
    function holdInput() {
      clearTimeout(inputTimer);
      inputTimer = 0;
    }
    function sendInput() {
      holdInput();
      inputAt = performance.now();
      o.onInput && o.onInput(pToValue(p));
    }
    function pFromPointer(x) {
      const r = control.getBoundingClientRect();
      return clamp((x - r.left - THUMB / 2) / (r.width - THUMB), 0, 1);
    }
    function withMagnet(raw) {
      const windowSize = .018;
      const hit = [0].concat(stops).find((s) => Math.abs(s - raw) < windowSize);
      if (hit !== undefined) {
        if (lastStop !== hit) { lastStop = hit; CK.haptic.selection(); }
        return hit;
      }
      lastStop = null;
      return raw;
    }

    const measure = () => { width = control.clientWidth; paint(); };
    new ResizeObserver(measure).observe(control);

    CK.drag(control, {
      axis: 'x',
      threshold: 3,
      onPress() { control.classList.add('is-pressed'); },
      onStart() { control.classList.add('is-active'); lastStop = null; },
      onMove(s) { setP(withMagnet(pFromPointer(s.x)), { paced: true }); },
      onEnd() {
        control.classList.remove('is-active', 'is-pressed');
        if (inputTimer) sendInput();
        o.onChange && o.onChange(pToValue(p));
      },
      onRelease(s, tap) {
        control.classList.remove('is-pressed');
        if (!tap) return;
        setP(withMagnet(pFromPointer(s.x)), { animate: true });
        CK.haptic.selection();
        o.onChange && o.onChange(pToValue(p));
      }
    });
    stopButtons.forEach((b) => b.addEventListener('click', () => {
      setP(Number(b.dataset.p), { animate: true });
      CK.haptic.selection();
      o.onChange && o.onChange(pToValue(p));
    }));
    control.addEventListener('keydown', (e) => {
      const unit = step / (max - min);
      const moves = { ArrowRight: unit, ArrowUp: unit, ArrowLeft: -unit, ArrowDown: -unit, PageUp: .1, PageDown: -.1 };
      let next = null;
      if (moves[e.key] !== undefined) next = p + moves[e.key];
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = 1;
      if (next === null) return;
      e.preventDefault();
      setP(next, { animate: true });
      o.onChange && o.onChange(pToValue(p));
    });
    width = control.clientWidth;
    renderState();
    paint();

    return {
      get value() { return pToValue(p); },
      set(v, opts) { setP(valueToP(v), { animate: true, silent: true, ...(opts || {}) }); },
      setMax(m) { o.max = m; },
      setDisabled(d) { host.classList.toggle('is-disabled', d); },
      setText(text) {
        control.setAttribute('aria-valuetext', text);
        bubble.textContent = text;
      }
    };
  };

  CK.carousel = function (host, o) {
    const opts = o || {};
    const mode = opts.mode || 'start';
    const gutter = opts.gutter == null ? 16 : opts.gutter;
    host.classList.add('carousel', 'carousel--' + mode);
    host.setAttribute('role', 'group');
    const paintLabels = () => {
      if (host.hasAttribute('aria-roledescription')) host.setAttribute('aria-roledescription', CK.t('carousel.role'));
      host.setAttribute('aria-label', CK.i18n.text(opts.label) || CK.t('carousel.cards'));
    };
    host.setAttribute('aria-roledescription', '');
    paintLabels();
    CK.i18n.bind(host, paintLabels);
    host.tabIndex = 0;
    const track = host.querySelector('.carousel-track');
    let items = [], snaps = [], minX = 0, maxX = 0, x = 0, index = 0, anim = null;
    let dots = null;

    let hostW = 0, centers = [];
    function measure() {
      items = Array.from(track.children);
      const W = hostW = host.clientWidth;
      const left = (el) => el.offsetLeft;
      centers = mode === 'cover' ? items.map((el) => left(el) + el.offsetWidth / 2) : [];
      if (mode === 'cover') {
        snaps = items.map((el) => W / 2 - (left(el) + el.offsetWidth / 2));
        maxX = snaps[0] || 0;
        minX = snaps[snaps.length - 1] || 0;
      } else {
        const last = items[items.length - 1];
        const contentW = last ? left(last) + last.offsetWidth + gutter : 0;
        maxX = 0;
        minX = Math.min(0, W - contentW);
        snaps = items.map((el) => clamp(gutter - left(el), minX, 0));
        snaps = snaps.filter((s, i) => i === 0 || Math.abs(s - snaps[i - 1]) > .5);
      }
      x = clamp(snaps[clamp(index, 0, snaps.length - 1)] || 0, minX, maxX);
      paint();
      renderDots();
    }
    let edge = '';
    function paint() {
      const now = `${x >= maxX - 1 ? 's' : ''}${x <= minX + 1 ? 'e' : ''}`;
      if (now !== edge) {
        edge = now;
        host.classList.toggle('at-start', now.includes('s'));
        host.classList.toggle('at-end', now.includes('e'));
      }
      track.style.transform = `translate3d(${x}px,0,0)`;
      if (mode === 'cover') {
        items.forEach((el, i) => {
          const d = clamp(Math.abs(centers[i] + x - hostW / 2) / hostW, 0, 1);
          el.style.transform = `scale(${(1 - d * .1).toFixed(4)})`;
          el.style.opacity = (1 - d * .38).toFixed(3);
        });
      }
    }
    function nearest(target) {
      let best = 0;
      snaps.forEach((s, i) => { if (Math.abs(s - target) < Math.abs(snaps[best] - target)) best = i; });
      return best;
    }
    function setIndex(i) {
      if (i === index) return;
      index = i;
      renderDots();
      opts.onChange && opts.onChange(i);
    }
    function glideTo(i, velocity) {
      if (anim) anim.stop();
      setIndex(i);
      anim = CK.spring({
        from: x, to: snaps[i], velocity: velocity || 0, precision: .08, ...CK.springs.glide,
        onUpdate(v) { x = clamp(v, minX, maxX); paint(); }
      });
    }
    function renderDots() {
      if (!dots) return;
      const n = snaps.length;
      dots.style.setProperty('--n', n);
      if (dots.childElementCount !== n + 1) {
        dots.innerHTML = '<b></b>' + Array.from({ length: n }, () => '<i></i>').join('');
      }
      dots.firstElementChild.style.transform = `translate3d(${index * 14}px,0,0)`;
    }
    if (opts.dots) {
      dots = CK.el('<div class="dots" aria-hidden="true"></div>');
      host.after(dots);
    }

    let startX = 0;
    CK.drag(host, {
      axis: 'x',
      threshold: 5,
      onStart() {
        if (anim) anim.stop();
        startX = x;
        host.classList.add('is-dragging');
      },
      onMove(s) {
        x = clamp(startX + s.dx, minX, maxX);
        paint();
      },
      onEnd(s) {
        host.classList.remove('is-dragging');
        const target = clamp(x + CK.project(s.v, .9965), minX, maxX);
        const i = nearest(target);
        if (i !== index) CK.haptic.selection();
        glideTo(i, s.v);
      }
    });
    let wheelTimer = 0;
    host.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (anim) anim.stop();
      x = clamp(x - e.deltaX, minX, maxX);
      paint();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => glideTo(nearest(x)), 90);
    }, { passive: false });
    host.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      glideTo(clamp(index + d, 0, snaps.length - 1));
    });
    host.addEventListener('focusin', (e) => {
      host.scrollLeft = 0;
      const item = e.target.closest('.carousel-track > *');
      if (item && item.parentElement === track) {
        const i = items.indexOf(item);
        if (i >= 0) glideTo(clamp(i, 0, snaps.length - 1));
      }
    });
    new ResizeObserver(measure).observe(host);
    measure();
    return {
      go: (i) => glideTo(clamp(i, 0, snaps.length - 1)),
      refresh: measure,
      get index() { return index; }
    };
  };

  const SLIP_WARN_BPS = 500;
  const SLIP_BAD_BPS = 1000;
  CK.slippagePicker = function (host, o) {
    const presets = (o.presets || []).slice();
    const step = o.step || 10;
    const max = o.max || 2000;
    const ok = typeof o.ok === 'function' ? o.ok : (bps) => Number.isInteger(bps) && bps >= step && bps <= max && bps % step === 0;
    const format = o.format || ((bps) => `${bps / 100}%`);
    let value = o.value;
    host.classList.add('slip');
    host.setAttribute('role', 'radiogroup');
    if (o.label) host.setAttribute('aria-label', o.label);
    const unit = (/\s*%\s*$/.exec(format(presets[0] || step)) || ['%'])[0];
    host.innerHTML = presets.map((bps) => `<button class="slip-chip" type="button" role="radio" aria-checked="false" data-bps="${bps}">${format(bps)}</button>`).join('')
      + (o.ownLabel ? `<label class="slip-own"><input class="slip-field" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="${o.ownLabel}" aria-label="${o.ownAria || o.ownLabel}"><i class="slip-unit"></i></label>` : '');
    const field = o.ownLabel ? host.querySelector('.slip-field') : null;
    const own = field ? host.querySelector('.slip-own') : null;
    if (own) own.querySelector('.slip-unit').textContent = unit;
    const percentText = (bps) => format(bps).replace(/\s*%\s*$/, '').trim();
    const toneOf = (bps) => (bps > SLIP_BAD_BPS ? 'bad' : bps > SLIP_WARN_BPS ? 'warn' : '');
    const fit = () => {
      if (!field) return;
      const n = String(field.value || '').length;
      if (field.style) field.style.width = n ? `${n + .25}ch` : '';
      own.classList.toggle('has-value', n > 0);
    };
    function paint() {
      const custom = !presets.includes(value);
      host.querySelectorAll('.slip-chip').forEach((chip) => chip.setAttribute('aria-checked', String(Number(chip.dataset.bps) === value)));
      host.dataset.tone = toneOf(value);
      if (!field) return;
      own.classList.toggle('is-on', custom);
      if (custom && document.activeElement !== field) field.value = percentText(value);
      if (!custom && document.activeElement !== field) field.value = '';
      own.classList.remove('is-wrong');
      fit();
    }
    function choose(bps) {
      if (!ok(bps) || bps === value) { paint(); return; }
      value = bps;
      paint();
      if (o.onChange) o.onChange(bps);
    }
    const typed = () => {
      const text = String(field.value || '').trim().replace(',', '.');
      if (!/^\d{1,2}(\.\d)?$/.test(text)) return null;
      const bps = Math.round(Number(text) * 100);
      return ok(bps) ? bps : null;
    };
    host.addEventListener('click', (e) => {
      const chip = e.target.closest('.slip-chip');
      if (!chip) return;
      if (CK.haptic) CK.haptic.selection();
      if (field) field.blur();
      choose(Number(chip.dataset.bps));
    });
    if (field) field.addEventListener('input', () => {
      const bps = typed();
      fit();
      own.classList.toggle('is-wrong', !!field.value && bps === null);
      if (bps !== null) {
        own.classList.add('is-on');
        if (bps !== value) {
          value = bps;
          host.querySelectorAll('.slip-chip').forEach((chip) => chip.setAttribute('aria-checked', String(Number(chip.dataset.bps) === value)));
          host.dataset.tone = toneOf(value);
          if (o.onChange) o.onChange(bps);
        }
      }
    });
    if (field) {
      field.addEventListener('blur', paint);
      field.addEventListener('keydown', (e) => { if (e.key === 'Enter') field.blur(); });
    }
    paint();
    return {
      get value() { return value; },
      set(bps) { if (ok(bps)) { value = bps; paint(); } }
    };
  };

  const SWIPE_TICKS = 4;
  const TICK_BACKLASH = .03;
  CK.swipeConfirm = function (host, o) {
    host.classList.add('swipe');
    const state = { tone: o.tone || 'accent', label: o.label };
    host.innerHTML = `
      <div class="swipe-fill"><i class="swipe-fill-face" data-face="accent"></i><i class="swipe-fill-face" data-face="buy"></i><i class="swipe-fill-face" data-face="sell"></i></div>
      <div class="swipe-text"><span class="swipe-label"></span><span class="swipe-sheen" aria-hidden="true"><span class="swipe-sheen-in"><span class="swipe-sheen-text"></span></span></span></div>
      <div class="swipe-done" aria-hidden="true"></div>
      <button class="swipe-thumb" type="button">
        <span class="swipe-thumb-icon swipe-thumb-arrow">${CK.icon('chevron-right', { size: 24 })}</span>
        <span class="swipe-thumb-icon swipe-thumb-check">${CK.icon('check', { size: 24 })}</span>
      </button>`;
    const fill = host.querySelector('.swipe-fill');
    const faces = Array.from(host.querySelectorAll('.swipe-fill-face'));
    const text = host.querySelector('.swipe-text');
    const label = host.querySelector('.swipe-label');
    const sheenText = host.querySelector('.swipe-sheen-text');
    const done = host.querySelector('.swipe-done');
    const thumb = host.querySelector('.swipe-thumb');
    let width = 0, x = 0, anim = null, locked = false, thumbW = 56;
    const PAD = 4;

    const range = () => Math.max(1, width - thumbW - PAD * 2);
    function paint() {
      const p = clamp(x / range(), 0, 1);
      thumb.style.transform = `translate3d(${x}px,0,0)`;
      fill.style.transform = `translate3d(${x + thumbW + PAD * 2 - width}px,0,0)`;
      text.style.opacity = (1 - clamp(p * 1.7, 0, 1)).toFixed(3);
    }
    function render() {
      faces.forEach((f) => f.classList.toggle('is-on', f.dataset.face === state.tone));
      host.dataset.tone = state.tone;
      label.textContent = state.label;
      sheenText.textContent = state.label;
      thumb.setAttribute('aria-label', CK.t('swipe.enter', { label: state.label }));
    }
    function moveTo(target, velocity, done2) {
      if (anim) anim.stop();
      anim = CK.spring({
        from: x, to: target, velocity: velocity || 0, precision: .2, ...CK.springs.smooth,
        onUpdate(v) { x = clamp(v, 0, range()); paint(); },
        onDone: done2
      });
    }
    let confirming = false, refused = false;
    function confirm() {
      if (locked) return;
      locked = true;
      host.classList.add('is-confirmed');
      moveTo(range(), 0, () => {
        confirming = true;
        refused = false;
        const result = o.onConfirm && o.onConfirm();
        confirming = false;
        if (refused) {
          CK.haptic.error();
          return;
        }
        Promise.resolve(result).then((ok) => {
          if (ok === false) {
            CK.haptic.error();
            reset();
            return;
          }
          if (!o.reportsOwnResult) CK.haptic.success();
          setTimeout(reset, o.resetAfter || 1400);
        }, () => {
          CK.haptic.error();
          reset();
        });
      });
    }
    function reset() {
      if (confirming) refused = true;
      host.classList.remove('is-confirmed');
      locked = false;
      moveTo(0, 0);
    }

    let start = 0, passedEnd = false, tick = 0;
    function feelTravel(raw) {
      const p = clamp(raw / range(), 0, 1);
      const quarter = Math.min(Math.floor(p * SWIPE_TICKS), SWIPE_TICKS - 1);
      if (quarter > tick) {
        tick = quarter;
        CK.haptic.selection();
      } else if (quarter < tick && p < tick / SWIPE_TICKS - TICK_BACKLASH) {
        tick = quarter;
      }
      const atEnd = raw >= range() - 2;
      if (atEnd && !passedEnd) CK.haptic.soft();
      passedEnd = atEnd;
    }
    CK.drag(thumb, {
      axis: 'x',
      threshold: 2,
      filter: () => !locked,
      onPress() { host.classList.add('is-pressed'); },
      onStart() { if (anim) anim.stop(); start = x; passedEnd = false; tick = Math.min(Math.floor(clamp(x / range(), 0, 1) * SWIPE_TICKS), SWIPE_TICKS - 1); },
      onMove(s) {
        const raw = start + s.dx;
        x = clamp(raw, 0, range());
        paint();
        feelTravel(raw);
      },
      onEnd(s, cancelled) {
        host.classList.remove('is-pressed');
        const projected = x + CK.project(s.v, .985);
        if (!cancelled && projected >= range() * .92) confirm();
        else moveTo(0, s.v);
      },
      onRelease(s, tap) {
        host.classList.remove('is-pressed');
        if (tap && !locked) {
          CK.haptic.light();
          moveTo(0, 620);
        }
      }
    });
    thumb.addEventListener('click', (e) => {
      if (e.detail === 0) confirm();
    });
    const measure = () => {
      width = host.clientWidth;
      thumbW = thumb.offsetWidth || thumbW;
      host.style.setProperty('--swipe-w', width + 'px');
      if (locked) x = range();
      paint();
    };
    new ResizeObserver(measure).observe(host);
    measure();
    render();
    done.remove();
    return {
      update(next) { Object.assign(state, next); render(); },
      setDisabled(d) { host.classList.toggle('is-disabled', d); thumb.disabled = d; },
      reset
    };
  };
})();
