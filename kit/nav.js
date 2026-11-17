(function () {
  'use strict';
  const CK = window.CK;
  const { clamp } = CK;
  const label = (x) => CK.i18n.text(x);
  const motionSpring = (name, fallback) => (CK.motion && CK.motion.springs && CK.motion.springs[name]) || fallback;

  const GLYPH_SPRING = { stiffness: 360, damping: 37.947, precision: .02 };
  const GLYPH_WIPE = { stiffness: 300, damping: 35, precision: .005 };
  const GLYPH_STAGGER_MS = 45;
  const n3 = (v) => +v.toFixed(3);
  const GLYPHS = {
    markets: {
      clip: [6.6, 21.4],
      parts: [
        { of: [1] },
        { of: [0], wipe: true, fade: true, origin: '7.6px 17px', pose: (v) => `scale(${n3(1 - .1 * v)})` },
        { of: [2], wipe: true, origin: '7.6px 17px', pose: (v) => `scale(${n3(1 - .1 * v)})` }
      ]
    },
    trade: {
      parts: [
        { of: [0, 1], origin: '5.7px 12.5px', pose: (v) => `scale(1,${n3(1 - .5 * v)})` },
        { of: [2, 3], origin: '12px 10.3px', pose: (v) => `scale(1,${n3(1 - .5 * v)})`, delay: 1 },
        { of: [4, 5], origin: '18.3px 13.3px', pose: (v) => `scale(1,${n3(1 - .5 * v)})`, delay: 2 }
      ]
    },
    portfolio: {
      parts: [
        { of: [0], origin: '11.1px 12.9px', pose: (v) => `rotate(${n3(-28 * v)}deg)` },
        { of: [1], origin: '14.6px 9.4px', pose: (v) => `translate(${n3(-3 * v)}px,${n3(3 * v)}px) scale(${n3(1 - .4 * v)})`, delay: 2 }
      ]
    },
    exchange: {
      parts: [
        { of: [0], origin: '12px 12px', pose: (v) => `rotate(${n3(-120 * v)}deg)` },
        { of: [1], origin: '12px 12px', pose: (v) => `rotate(${n3(-120 * v)}deg)`, delay: 1 }
      ]
    },
    p2p: {
      parts: [
        { of: [1], origin: '7.75px 20.4px', pose: (v) => `scale(${n3(1 + .08 * v)},${n3(1 - .18 * v)})` },
        { of: [0], origin: '7.75px 7.75px', pose: (v) => `translateY(${n3(2.6 * v)}px)`, delay: 1 },
        { of: [2, 3], origin: '17.25px 19.5px', fade: true, pose: (v) => `translateY(${n3(-4 * v)}px) scale(${n3(1 - .12 * v)})`, delay: 2 }
      ]
    },
    'tab-wallet': {
      parts: [
        { of: [0], origin: '12px 12px', pose: (v) => `scale(${n3(1 - .14 * v)})` },
        { of: [1], origin: '16.3px 12px', pose: (v) => `translateX(${n3(-3.5 * v)}px) scale(${n3(1 - .5 * v)})`, delay: 2 }
      ]
    },
    'tab-p2p': {
      parts: [
        { of: [0], origin: '12px 12px', pose: (v) => `scale(${n3(1 - .14 * v)})` },
        { of: [1, 2], origin: '12px 12px', pose: (v) => `scale(${n3(1 - .5 * v)})`, delay: 1 },
        { of: [3, 4], origin: '12px 12px', pose: (v) => `rotate(${n3(-90 * v)}deg)`, delay: 2 }
      ]
    },
    'tab-profile': {
      parts: [
        { of: [0, 2], origin: '12px 12px', pose: (v) => `scale(${n3(1 - .14 * v)})` },
        { of: [1], origin: '12px 9.4px', pose: (v) => `translateY(${n3(1.6 * v)}px) scale(${n3(1 - .4 * v)})`, delay: 2 }
      ]
    },
    'tab-gift': {
      parts: [
        { of: [0], origin: '12px 17.4px', pose: (v) => `scale(${n3(1 - .14 * v)})` },
        { of: [1], origin: '12px 12.6px', pose: (v) => `translateY(${n3(-2.6 * v)}px) rotate(${n3(-8 * v)}deg)`, delay: 1 },
        { of: [2], origin: '12px 7.2px', pose: (v) => `scale(${n3(1 - .5 * v)})`, delay: 2 }
      ]
    },
    person: {
      parts: [
        { of: [1], origin: '12px 20.6px', pose: (v) => `scale(${n3(1 + .08 * v)},${n3(1 - .18 * v)})` },
        { of: [0], origin: '12px 7.9px', pose: (v) => `translateY(${n3(3.2 * v)}px)`, delay: 1 }
      ]
    }
  };
  const glyphOrder = (g) => g.parts.filter((part) => !part.wipe).concat(g.parts.filter((part) => part.wipe));

  function glyphHtml(name) {
    const g = GLYPHS[name], def = CK.ICONS[name];
    const bits = (def && def.f && def.f.match(/<[^>]+\/>/g)) || [];
    const used = g ? g.parts.flatMap((part) => part.of) : [];
    if (!g || used.length !== bits.length || new Set(used).size !== bits.length || used.some((i) => !bits[i])) return CK.icon(name, { fill: true });
    const svg = (part) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${part.of.map((i) => bits[i]).join('')}</svg>`;
    const order = glyphOrder(g), wiped = order.filter((part) => part.wipe);
    const clip = wiped.length ? `<i class="tab-glyph-clip" style="left:${g.clip[0]}px;width:${n3(g.clip[1] - g.clip[0])}px"><i style="left:${-g.clip[0]}px">${wiped.map(svg).join('')}</i></i>` : '';
    return `<i class="tab-glyph" aria-hidden="true">${order.filter((part) => !part.wipe).map(svg).join('')}${clip}</i>`;
  }

  let glyphPaths = null;
  const glyphRuns = new WeakMap();
  function playGlyph(button, name) {
    const g = GLYPHS[name], glyph = button.querySelector('.tab-glyph');
    if (!g || !glyph || !glyph.animate || CK.reducedMotion()) return;
    (glyphRuns.get(button) || []).forEach((a) => a.cancel());
    if (!glyphPaths) glyphPaths = { bounce: CK.springPath({ from: 1, to: 0, ...GLYPH_SPRING }), wipe: CK.springPath({ from: 1, to: 0, ...GLYPH_WIPE }) };
    const { bounce, wipe } = glyphPaths;
    const run = [];
    const go = (el, frames, path, delay) => run.push(el.animate(frames, { duration: path.duration, delay: delay || 0, easing: 'linear', fill: 'backwards' }));
    const svgs = glyph.querySelectorAll('svg');
    glyphOrder(g).forEach((part, i) => {
      if (part.pose) {
        svgs[i].style.transformOrigin = part.origin;
        go(svgs[i], bounce.values.map((v) => ({ transform: part.pose(v) })), bounce, (part.delay || 0) * GLYPH_STAGGER_MS);
      }
      if (part.fade) run.push(svgs[i].animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: (part.delay || 0) * GLYPH_STAGGER_MS, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' }));
    });
    const clip = glyph.querySelector('.tab-glyph-clip');
    if (clip) {
      const width = g.clip[1] - g.clip[0];
      go(clip, wipe.values.map((v) => ({ transform: `translateX(${n3(-width * v)}px)` })), wipe);
      go(clip.firstElementChild, wipe.values.map((v) => ({ transform: `translateX(${n3(width * v)}px)` })), wipe);
    }
    glyphRuns.set(button, run);
  }

  CK.tabBar = function (host, o) {
    const items = o.items;
    let index = Math.max(0, items.findIndex((t) => t.id === o.value));
    host.classList.add('tabbar');
    host.setAttribute('role', 'tablist');
    host.setAttribute('aria-label', label(o.label) || CK.t('nav.sections'));
    host.style.setProperty('--n', items.length);
    host.dataset.n = String(items.length);
    host.innerHTML = '<div class="tabbar-lens"></div>' + items.map((t, i) => `
      <button class="tabbar-item" type="button" role="tab" id="tab-${t.id}" data-i="${i}" aria-selected="${i === index}" tabindex="${i === index ? 0 : -1}">
        <span class="tabbar-face tabbar-off">${CK.icon(t.icon)}<span>${label(t.label)}</span></span>
        <span class="tabbar-face tabbar-on">${glyphHtml(t.icon)}<span>${label(t.label)}</span></span>
        ${t.badge ? `<span class="badge" aria-label="${CK.t('nav.new', { count: t.badge })}">${t.badge}</span>` : ''}
      </button>`).join('');
    const lens = host.querySelector('.tabbar-lens');
    const buttons = Array.from(host.querySelectorAll('.tabbar-item'));
    CK.i18n.bind(host, () => {
      host.setAttribute('aria-label', label(o.label) || CK.t('nav.sections'));
      buttons.forEach((b, i) => {
        b.querySelectorAll('.tabbar-face > span').forEach((face) => { face.textContent = label(items[i].label); });
      });
    });

    let x = index, anim = null;
    const poseOf = (at) => `translate3d(${at * 100}%,0,0)`;
    function paint() { lens.style.transform = poseOf(x); }
    function moveTo(target, velocity) {
      const speed = velocity || (anim ? anim.velocity : 0);
      if (anim) anim.stop();
      if (target === x && !speed) {
        paint();
        return;
      }
      anim = CK.flight({
        from: x, to: target, velocity: speed, precision: .001, ...motionSpring('spring', CK.springs.settle),
        tracks: [[lens, (v) => ({ transform: poseOf(clamp(v, 0, items.length - 1)) })]],
        onUpdate(v) { x = clamp(v, 0, items.length - 1); paint(); },
        onDone() { x = target; paint(); }
      });
    }
    function markNear(i) {
      buttons.forEach((b, j) => b.classList.toggle('is-near', j === i));
    }
    function render() {
      buttons.forEach((b, i) => {
        b.setAttribute('aria-selected', String(i === index));
        b.tabIndex = i === index ? 0 : -1;
      });
      markNear(index);
    }
    function panelOf(i) {
      if (o.panelOf) return o.panelOf(items[i].id) || null;
      const scope = host.parentElement, id = buttons[i].id;
      if (!scope || !id || !scope.querySelectorAll) return null;
      return Array.prototype.find.call(scope.querySelectorAll('[role="tabpanel"]'), (p) => p.getAttribute('aria-labelledby') === id) || null;
    }
    function crossMove(from, to) {
      if (!CK.motion || !CK.motion.tabSwitch) return;
      const out = panelOf(from), into = panelOf(to);
      if (!out || !into || out === into) return;
      Promise.resolve().then(() => CK.motion.tabSwitch(out, into, to > from ? 1 : -1));
    }
    function select(i, silent) {
      i = clamp(i, 0, items.length - 1);
      const changed = i !== index, was = index;
      const shown = buttons[i].classList.contains('is-near');
      index = i;
      render();
      moveTo(i);
      if (changed) {
        if (!shown) playGlyph(buttons[i], items[i].icon);
        if (!silent) CK.haptic.selection();
        crossMove(was, i);
        if (!silent && o.onChange) o.onChange(items[i].id, i);
      }
    }
    let pressed = null;
    let compact = false, growing = 0;
    function setCompact(on) {
      on = !!on;
      if (on && host.classList.contains('is-hidden')) return;
      if (on === compact) return;
      compact = on;
      clearTimeout(growing);
      host.classList.toggle('is-compact', on);
      host.classList.toggle('is-growing', !on);
      if (!on) growing = setTimeout(() => host.classList.remove('is-growing'), 560);
    }
    host.addEventListener('focusin', () => setCompact(false));
    function press(b) {
      if (pressed) pressed.classList.remove('is-pressed');
      pressed = b;
      if (b) b.classList.add('is-pressed');
    }
    host.addEventListener('pointerdown', (e) => {
      setCompact(false);
      press(e && e.target && typeof e.target.closest === 'function' ? e.target.closest('.tabbar-item') : null);
    }, { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => host.addEventListener(type, () => press(null), { passive: true }));
    host.addEventListener('click', (e) => {
      const b = e.target.closest('.tabbar-item');
      if (b) select(Number(b.dataset.i));
    });
    host.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = (index + d + items.length) % items.length;
      select(next);
      buttons[next].focus();
    });
    render();
    paint();
    return {
      select: (id, silent) => select(items.findIndex((t) => t.id === id), silent),
      setHidden(hidden) {
        if (hidden) { setCompact(false); clearTimeout(growing); host.classList.remove('is-growing'); }
        host.style.willChange = hidden ? 'transform, opacity' : '';
        host.classList.toggle('is-hidden', hidden);
        host.toggleAttribute('inert', hidden);
      },
      setCompact,
      get compact() { return compact; },
      followScroll(root, getScroller) {
        const SHRINK_AT = 28, GROW_AT = 16, TOP = 72, MIN_ROOM = 160;
        const INPUT_MS = 120, CHAIN_MS = 100;
        let lastY = 0, acc = 0, lastEl = null, raf = 0, lastInput = -Infinity, lastScroll = -Infinity, byPerson = false;
        const clock = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
        const scroller = () => { try { return getScroller() || null; } catch (e) { return null; } };
        const felt = () => { lastInput = clock(); };
        ['touchstart', 'touchmove', 'touchend', 'wheel', 'keydown', 'pointerdown'].forEach((type) => root.addEventListener(type, felt, { capture: true, passive: true }));
        function read() {
          raf = 0;
          const el = scroller();
          if (!el) return;
          if (host.classList.contains('is-hidden')) { lastEl = null; acc = 0; return; }
          const y = el.scrollTop, room = el.scrollHeight - el.clientHeight;
          if (el !== lastEl) { lastEl = el; lastY = y; acc = 0; return; }
          if (!byPerson) { lastY = y; acc = 0; return; }
          if (y < 0 || y > room) return;
          const dy = y - lastY;
          lastY = y;
          if (!dy) return;
          if (room < MIN_ROOM || y <= TOP) { acc = 0; setCompact(false); return; }
          acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
          if (acc >= SHRINK_AT) setCompact(true);
          else if (acc <= -GROW_AT) setCompact(false);
        }
        root.addEventListener('scroll', (e) => {
          if (e.target !== scroller()) return;
          const t = clock();
          if (t - lastInput <= INPUT_MS) byPerson = true;
          else if (t - lastScroll > CHAIN_MS) byPerson = false;
          lastScroll = t;
          if (!raf) raf = requestAnimationFrame(read);
        }, { capture: true, passive: true });
        return () => {
          if (raf) { cancelAnimationFrame(raf); raf = 0; }
          lastEl = null;
          acc = 0;
          setCompact(false);
        };
      },
      get value() { return items[index].id; }
    };
  };

  CK.segmented = function (host, o) {
    const items = o.items;
    let index = Math.max(0, items.findIndex((t) => t.value === o.value));
    host.classList.add('seg');
    if (o.size) host.classList.add('seg--' + o.size);
    host.setAttribute('role', 'radiogroup');
    host.setAttribute('aria-label', label(o.label) || '');
    host.style.setProperty('--n', items.length);
    const tones = items.map((t) => t.tone).filter(Boolean);
    host.innerHTML = `<div class="seg-thumb"><i class="seg-thumb-face"></i>${items.map((t) => (t.tone ? `<i class="seg-thumb-face seg-tone" data-tone="${t.tone}"></i>` : '')).join('')}</div>` +
      items.map((t, i) => `
      <button class="seg-btn" type="button" role="radio" data-i="${i}" aria-checked="${i === index}" tabindex="${i === index ? 0 : -1}" aria-label="${label(t.aria) || label(t.label) || ''}">
        <span class="seg-label">${t.icon ? CK.icon(t.icon, { size: 18 }) : ''}${t.lead || ''}${label(t.label) || ''}</span>
        <span class="seg-label seg-label-on${t.tone ? ' seg-on-tone' : ''}">${t.icon ? CK.icon(t.icon, { size: 18 }) : ''}${t.lead || ''}${label(t.label) || ''}</span>
      </button>`).join('');
    if (tones.length) host.classList.add('seg--toned');
    const thumb = host.querySelector('.seg-thumb');
    const buttons = Array.from(host.querySelectorAll('.seg-btn'));
    CK.i18n.bind(host, () => {
      host.setAttribute('aria-label', label(o.label) || '');
      buttons.forEach((b, i) => {
        const t = items[i];
        b.setAttribute('aria-label', label(t.aria) || label(t.label) || '');
        if (t.label) b.querySelectorAll('.seg-label').forEach((n) => CK.i18n.setText(n, label(t.label)));
      });
    });
    let x = index, anim = null;

    function paint() {
      thumb.style.transform = `translate3d(${x * 100}%,0,0)`;
    }
    function moveTo(target) {
      const v = anim ? anim.velocity : 0;
      if (anim) anim.stop();
      anim = CK.spring({
        from: x, to: target, velocity: v, precision: .001, ...CK.springs.settle,
        onUpdate(val) { x = clamp(val, 0, items.length - 1); paint(); },
        onDone() { paint(); }
      });
    }
    function render() {
      buttons.forEach((b, i) => {
        b.setAttribute('aria-checked', String(i === index));
        b.tabIndex = i === index ? 0 : -1;
      });
      const tone = items[index].tone;
      host.querySelectorAll('.seg-tone').forEach((f) => f.classList.toggle('is-on', f.dataset.tone === tone));
    }
    function select(i, silent) {
      i = clamp(i, 0, items.length - 1);
      if (buttons[i].disabled) i = index;
      const changed = i !== index;
      index = i;
      render();
      moveTo(i);
      if (changed && !silent) {
        CK.haptic.selection();
        o.onChange && o.onChange(items[i].value, i);
      }
    }
    const fromPointer = (px) => {
      const r = host.getBoundingClientRect();
      return ((px - r.left) / r.width) * items.length - .5;
    };
    let near = index;
    CK.drag(host, {
      axis: 'x',
      threshold: 4,
      filter: (e) => e.target.closest('.seg-btn') && Number(e.target.closest('.seg-btn').dataset.i) === index,
      onStart() { near = index; if (anim) anim.stop(); },
      onMove(s) {
        const raw = clamp(fromPointer(s.x), 0, items.length - 1);
        x = raw;
        paint();
        const n = clamp(Math.round(raw), 0, items.length - 1);
        if (n !== near) { near = n; CK.haptic.selection(); }
      },
      onEnd(s, cancelled) {
        select(cancelled ? index : clamp(Math.round(fromPointer(s.x)), 0, items.length - 1));
      }
    });
    host.addEventListener('click', (e) => {
      const b = e.target.closest('.seg-btn');
      if (b) select(Number(b.dataset.i));
    });
    host.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      let next = (index + d + items.length) % items.length;
      if (buttons[next].disabled) next = (next + d + items.length) % items.length;
      select(next);
      buttons[next].focus();
    });
    render();
    paint();
    return {
      set(value, silent) { select(items.findIndex((t) => t.value === value), silent !== false); },
      setDisabled(value, off) { buttons[items.findIndex((t) => t.value === value)].disabled = !!off; },
      get value() { return items[index].value; }
    };
  };

  CK.toggle = function (host, o) {
    host.classList.add('switch');
    host.setAttribute('role', 'switch');
    host.setAttribute('type', 'button');
    if (o.label) host.setAttribute('aria-label', label(o.label));
    if (typeof o.label === 'function') CK.i18n.bind(host, () => host.setAttribute('aria-label', o.label()));
    host.innerHTML = '<span class="switch-on"></span><span class="switch-thumb"></span>';
    let on = !!o.value;
    const render = () => { host.setAttribute('aria-checked', String(on)); };
    host.addEventListener('click', () => {
      on = !on;
      render();
      CK.haptic.light();
      o.onChange && o.onChange(on);
    });
    render();
    return { get value() { return on; }, set(v) { on = !!v; render(); } };
  };

  const AVATAR_COLORS = [['#ff885e', '#ff516a'], ['#ffcd6a', '#ffa85c'], ['#82b1ff', '#665fff'], ['#a0de7e', '#54cb68'], ['#53edd6', '#28c9b7'], ['#e0a2f3', '#d669ed'], ['#72d5fd', '#2a9ef1']];
  const avatar = { url: null, initials: '' };
  const heroText = { name: '', username: '' };
  function httpsOnly(url) {
    try { return new URL(url).protocol === 'https:' ? url : null; } catch (_) { return null; }
  }
  const initialsOf = (name) => String(name || '').trim().split(/[\s-]+/).slice(0, 2).map((w) => Array.from(w)[0] || '').join('').toUpperCase();

  function paintFace(face) {
    face.classList.toggle('is-filled', !!(avatar.url || avatar.initials));
    if (avatar.url) {
      const url = avatar.url;
      const img = new Image();
      img.alt = '';
      img.draggable = false;
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => { if (avatar.url === url) CK.setHeaderAvatar(null, avatar.initials); });
      img.src = url;
      if (img.complete && img.naturalWidth) face.replaceChildren(img);
      else img.addEventListener('load', () => {
        if (avatar.url !== url || !face.isConnected) return;
        face.replaceChildren(img);
        fadeSwap(img);
      }, { once: true });
    } else if (avatar.initials) {
      if (face.textContent !== avatar.initials && face.firstChild) fadeSwap(face);
      face.textContent = avatar.initials;
    } else {
      face.innerHTML = CK.icon('person', { fill: true, size: 22 });
    }
  }
  CK.setHeaderAvatar = function (url, initials) {
    avatar.url = httpsOnly(url);
    avatar.initials = Array.from(String(initials || '').trim()).slice(0, 2).join('').toUpperCase();
    const root = document.documentElement.style;
    if (avatar.initials) {
      const sum = Array.from(avatar.initials).reduce((s, ch) => s + ch.codePointAt(0), 0);
      const pair = AVATAR_COLORS[sum % AVATAR_COLORS.length];
      root.setProperty('--avatar-c1', pair[0]);
      root.setProperty('--avatar-c2', pair[1]);
    } else {
      root.removeProperty('--avatar-c1');
      root.removeProperty('--avatar-c2');
    }
    document.querySelectorAll('[data-hd-face]').forEach(paintFace);
  };
  function fadeSwap(el) {
    if (CK.reducedMotion() || !el.animate) return;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) return;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }
  function paintHeroText(scope) {
    scope.querySelectorAll('[data-hd-name]').forEach((n) => {
      if (n.textContent && n.textContent !== heroText.name) fadeSwap(n);
      n.textContent = heroText.name;
    });
    scope.querySelectorAll('[data-hd-username]').forEach((n) => {
      if (heroText.username && n.textContent !== '@' + heroText.username) fadeSwap(n);
      n.textContent = heroText.username ? '@' + heroText.username : '';
      n.hidden = !heroText.username;
    });
  }
  CK.paintProfile = function (scope) {
    scope.querySelectorAll('[data-hd-face]').forEach(paintFace);
    paintHeroText(scope);
  };
  CK.profileHero = () => ({ name: heroText.name, username: heroText.username });
  CK.setProfileHero = function (o) {
    heroText.name = String(o.name || '');
    heroText.username = String(o.username || '').replace(/^@/, '');
    paintHeroText(document);
    CK.setHeaderAvatar(o.photoUrl, initialsOf(o.name));
  };

  CK.logoMark = (size) => `<svg class="logo-mark" viewBox="0 0 512 512" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="M236 454.35V179.65A6.5 6.5 0 0 0 229.19 173.16A144 144 0 0 0 229.19 460.84A6.5 6.5 0 0 0 236 454.35ZM276 57.65V332.35A6.5 6.5 0 0 0 282.81 338.84A144 144 0 0 0 282.81 51.16A6.5 6.5 0 0 0 276 57.65Z"/></svg>`;

  const BAR_TITLE_SIZE = 17;
  const DOCK_SIZE = 14;
  const DOCK_DROP = 21;
  const DOCK_GAP = 6, DOCK_FIT = 12, DOCK_RISE = 4;
  const smooth = (t) => t * t * (3 - 2 * t);
  const toDevicePixel = (v) => {
    const d = window.devicePixelRatio || 1;
    return Math.round(v * d) / d;
  };
  const dockPath = (p) => ({ px: 1 - Math.pow(1 - p, 2.4), py: Math.pow(p, 2.4) });
  CK.dockFits = (tw, room, was) => tw > 0 && tw + (was ? 0 : DOCK_FIT) <= room;
  CK.dockFrame = function (m, p, calm) {
    const { px, py } = m.docked ? dockPath(p) : { px: p, py: p };
    const s = 1 + (m.s1 - 1) * px, x = m.x0 + (m.x1 - m.x0) * px, y = m.y0 + (m.y1 - m.y0) * py;
    const f = { x, y, s };
    if (!m.docked) return f;
    f.meta = 1 - clamp((p - .1) / .6, 0, 1);
    f.line = 1 - smooth(clamp((p - .25) / .4, 0, 1));
    if (m.tw > 0) {
      f.tailO = m.tailOn ? smooth(clamp((p - .5) / .5, 0, 1)) : 0;
      f.tailX = x + m.w * s + DOCK_GAP;
      f.tailY = y + m.h * s / 2 - m.th / 2 + (calm ? 0 : (1 - f.tailO) * DOCK_RISE);
      if (p >= 1) {
        const d = window.devicePixelRatio || 1;
        f.tailX = Math.ceil(f.tailX * d - 1e-6) / d;
        f.tailY = toDevicePixel(f.tailY);
      }
    }
    return f;
  };
  CK.screen = function (o) {
    const hasHero = !!o.hero;
    const hasLarge = o.large !== false && !hasHero;
    const head = hasHero
      ? `<div class="screen-head hd-hero"><div class="hd-hero-face"><span class="hd-face" data-hd-face></span></div><div class="hd-slot hd-slot--hero"></div><p class="hd-hero-user" data-hd-username></p></div>`
      : hasLarge ? `<div class="screen-head"><div class="hd-slot hd-slot--large"></div>${o.headExtra ? `<div class="hd-meta">${o.headExtra}</div>` : ''}</div>` : '';
    const title = hasHero
      ? '<h1 class="hd-glide hd-hero-name" data-hd-name></h1>'
      : hasLarge ? `<h1 class="hd-glide large-title">${CK.esc(label(o.title))}</h1>` : '';
    const el = CK.el(`
      <section class="screen${o.large === false ? ' screen--inline' : ' screen--glides'}${o.compactTop ? ' screen--compact' : ''}${o.className ? ' ' + o.className : ''}" aria-label="${CK.esc(label(o.title))}">
        <header class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-row">
            <div class="navbar-side navbar-lead"></div>
            ${title ? '' : `<div class="navbar-center"><div class="navbar-title">${o.titleHtml || CK.esc(label(o.title))}</div></div>`}
            <div class="navbar-side navbar-trail"></div>
          </div>
          ${title}
        </header>
        <div class="screen-scroll" tabindex="-1">
          ${head}
          <div class="screen-body"></div>
        </div>
        <div class="screen-dim"></div>
      </section>`);
    const scroll = el.querySelector('.screen-scroll');
    const body = el.querySelector('.screen-body');
    const edge = el.querySelector('.navbar-bg');
    const row = el.querySelector('.navbar-row');
    const navbar = el.querySelector('.navbar');
    const inlineTitle = el.querySelector('.navbar-title');
    const headEl = el.querySelector('.screen-head');
    const heroFace = el.querySelector('.hd-hero-face');
    const heroUser = el.querySelector('.hd-hero-user');
    let glider = el.querySelector('.hd-glide');
    let slot = el.querySelector('.hd-slot');
    let meta = el.querySelector('.hd-meta');
    let docked = false;
    let dockLine = null, dockTail = null, tailWas = false;
    const trail = el.querySelector('.navbar-trail');
    const lead = el.querySelector('.navbar-lead');

    if (typeof o.title === 'function') {
      CK.i18n.bind(el, () => {
        el.setAttribute('aria-label', o.title());
        if (hasLarge && !docked) glider.textContent = o.title();
        else if (inlineTitle && !o.titleHtml) inlineTitle.textContent = o.title();
      });
    }

    if (o.avatar) {
      const b = CK.el(`<button class="navbtn hd-avatar press" type="button" ${CK.i18n.LA('tab.profile')}><span class="hd-face" data-hd-face></span></button>`);
      b.addEventListener('click', () => { CK.haptic.selection(); o.avatar(); });
      trail.appendChild(b);
    }
    (o.actions || []).forEach((a) => {
      const b = CK.el(`<button class="navbtn press${a.className ? ' ' + a.className : ''}" type="button" aria-label="${label(a.label)}"${a.pressed !== undefined ? ` aria-pressed="${a.pressed}"` : ''}>${CK.icon(a.icon, { fill: a.fill, size: a.size || 22 })}</button>`);
      b.addEventListener('click', () => a.onClick && a.onClick(b));
      if (typeof a.label === 'function') CK.i18n.bind(b, () => b.setAttribute('aria-label', a.label()));
      trail.appendChild(b);
      if (a.mount) a.mount(b);
    });
    if (hasHero) {
      heroText.name = String(o.hero.name || '');
      heroText.username = String(o.hero.username || '').replace(/^@/, '');
      if (!avatar.initials && !avatar.url) CK.setHeaderAvatar(o.hero.photoUrl, initialsOf(o.hero.name));
      paintHeroText(el);
    }
    el.querySelectorAll('[data-hd-face]').forEach(paintFace);

    let m = null;
    function measure() {
      m = null;
      if (!glider || !scroll.clientHeight) return;
      let y0 = 0, x0 = 0;
      for (let n = slot; n && n !== scroll; n = n.offsetParent) { y0 += n.offsetTop; x0 += n.offsetLeft; }
      const w = glider.offsetWidth, h = glider.offsetHeight;
      const barW = navbar.offsetWidth, barMid = row.offsetTop + row.offsetHeight / 2;
      const look = getComputedStyle(glider);
      const s1 = (docked ? DOCK_SIZE : BAR_TITLE_SIZE) / parseFloat(look.fontSize);
      if (hasHero) x0 = (barW - w) / 2;
      let x1 = toDevicePixel((barW - w * s1) / 2);
      const barBox = docked ? navbar.getBoundingClientRect() : null;
      const buttons = docked ? (trail.firstElementChild ? trail.getBoundingClientRect().left - barBox.left - 8 : barW) : barW;
      if (docked && inlineTitle) {
        const anchor = (inlineTitle.querySelector('[data-dock-anchor]') || inlineTitle).getBoundingClientRect().left - barBox.left;
        x1 = toDevicePixel(Math.max(inlineTitle.getBoundingClientRect().left - barBox.left, Math.min(anchor, buttons - w * s1)));
      }
      let mid = barMid + (docked ? DOCK_DROP : 0);
      if (docked && dockLine && dockLine.getClientRects().length) {
        const r = dockLine.getBoundingClientRect();
        mid = r.top - barBox.top + r.height / 2;
      }
      const y1 = toDevicePixel(mid - h * s1 / 2);
      const travel = y0 - y1;
      m = { x0, y0, x1, y1, s1, w, h, docked };
      if (docked && dockTail) {
        m.w = parseFloat(look.width) || w;
        m.tw = dockTail.offsetWidth;
        m.th = dockTail.offsetHeight;
        m.tailOn = CK.dockFits(m.tw, buttons - (x1 + m.w * s1 + DOCK_GAP), tailWas);
        tailWas = m.tailOn;
      }
      if (hasHero) {
        m.end = Math.max(travel, 1);
        m.barFrom = m.end * .55;
        m.barTo = m.end;
      } else if (docked) {
        const room = scroll.scrollHeight - scroll.clientHeight;
        m.end = Math.max(travel + 8, 40);
        if (room > 0) m.end = Math.min(m.end, room);
        m.barFrom = m.end * .4;
        m.barTo = room > 0 ? Math.min(m.end + 24, room) : m.end + 24;
      } else {
        const under = headEl.offsetTop + headEl.offsetHeight - (row.offsetTop + row.offsetHeight);
        m.end = Math.max(travel, under + 20, 44);
        m.barFrom = Math.max(0, under - 14);
        m.barTo = m.end;
      }
    }

    let painted = '', scrolled = false;
    function markScrolled(barOpacity) {
      const on = barOpacity > 0;
      if (on === scrolled) return;
      scrolled = on;
      el.classList.toggle('is-scrolled', on);
    }
    function update() {
      const y = scroll.scrollTop;
      if (!glider) {
        const o = clamp(y / 14, 0, 1);
        edge.style.opacity = o.toFixed(3);
        markScrolled(o);
        return;
      }
      if (!m) return;
      const calm = CK.reducedMotion();
      const p = clamp(y / m.end, 0, 1);
      const f = CK.dockFrame(m, p, calm);
      const flying = p > 0 && p < 1;
      const transform = `translate(${f.x.toFixed(2)}px,${f.y.toFixed(2)}px) scale(${f.s.toFixed(4)})`;
      if (transform !== painted) {
        painted = transform;
        glider.style.transform = transform;
        glider.classList.toggle('is-gliding', flying);
      }
      const bar = smooth(clamp((y - m.barFrom) / (m.barTo - m.barFrom), 0, 1));
      edge.style.opacity = bar.toFixed(3);
      markScrolled(bar);
      if (meta) meta.style.opacity = (m.docked ? f.meta : 1 - clamp(p / .35, 0, 1)).toFixed(3);
      if (m.docked && dockLine) dockLine.style.opacity = f.line.toFixed(3);
      if (dockTail && f.tailO !== undefined) {
        dockTail.style.opacity = f.tailO.toFixed(3);
        dockTail.style.visibility = f.tailO > 0 ? 'visible' : 'hidden';
        dockTail.style.transform = `translate(${f.tailX.toFixed(2)}px,${f.tailY.toFixed(2)}px)`;
        dockTail.classList.toggle('is-gliding', flying && f.tailO > 0);
      }
      if (hasHero) {
        heroFace.style.opacity = (1 - clamp((p - .25) / .5, 0, 1)).toFixed(3);
        if (!calm) heroFace.style.transform = `scale(${(1 - p * .3).toFixed(4)})`;
        heroUser.style.opacity = (1 - clamp((y - (m.end - 50)) / 30, 0, 1)).toFixed(3);
      }
    }
    function layout() {
      measure();
      update();
    }
    scroll.addEventListener('scroll', update, { passive: true });
    let settleTimer = 0, fingerDown = false;
    function settleSoon() {
      if (!docked || !m) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const y = scroll.scrollTop, room = scroll.scrollHeight - scroll.clientHeight;
        if (fingerDown || !m || y <= 0 || y >= m.end || room <= 0) return;
        scroll.scrollTo({ top: y < m.end / 2 ? 0 : Math.min(m.end, room), behavior: CK.reducedMotion() ? 'auto' : 'smooth' });
      }, 140);
    }
    scroll.addEventListener('touchstart', () => { fingerDown = true; }, { passive: true });
    const lift = () => { fingerDown = false; settleSoon(); };
    scroll.addEventListener('touchend', lift, { passive: true });
    scroll.addEventListener('touchcancel', lift, { passive: true });
    scroll.addEventListener('scroll', settleSoon, { passive: true });
    const sizes = new ResizeObserver(layout);
    sizes.observe(scroll);
    if (glider) sizes.observe(glider);
    if (headEl) sizes.observe(headEl);
    update();

    if (o.pull !== false) {
      let touch = null;
      scroll.addEventListener('touchstart', (e) => {
        touch = e.touches.length === 1 ? { x0: e.touches[0].clientX, y0: e.touches[0].clientY, held: null } : null;
      }, { passive: true });
      const onMove = (e) => {
        if (!touch) return;
        const dx = e.touches[0].clientX - touch.x0, dy = e.touches[0].clientY - touch.y0;
        if (touch.held === null) {
          if (Math.hypot(dx, dy) < 5) return;
          const fits = scroll.scrollHeight <= scroll.clientHeight;
          touch.held = Math.abs(dy) > Math.abs(dx) && (dy > 0 ? scroll.scrollTop <= 0 : fits) && e.cancelable;
          if (touch.held) touch.y0 = e.touches[0].clientY;
        }
        if (!touch.held) return;
        e.preventDefault();
        scroll.scrollTop = touch.y0 - e.touches[0].clientY;
      };
      let claiming = false;
      const syncClaim = () => {
        const want = touch ? !!touch.held : scroll.scrollTop <= 0;
        if (want === claiming) return;
        claiming = want;
        if (want) scroll.addEventListener('touchmove', onMove, { passive: false });
        else scroll.removeEventListener('touchmove', onMove);
      };
      syncClaim();
      scroll.addEventListener('scroll', syncClaim, { passive: true });
      const endTouch = () => {
        touch = null;
        syncClaim();
      };
      scroll.addEventListener('touchend', endTouch, { passive: true });
      scroll.addEventListener('touchcancel', endTouch, { passive: true });
    }

    return {
      el, body, scroll, lead, trail, update, title: label(o.title),
      setTint() {},
      dock(value, valueSlot, valueMeta, extra) {
        docked = true;
        el.classList.add('screen--glides', 'screen--docked');
        glider = value;
        slot = valueSlot;
        meta = valueMeta;
        glider.classList.add('hd-glide');
        navbar.appendChild(glider);
        sizes.observe(glider);
        sizes.observe(slot);
        sizes.observe(body);
        dockLine = (extra && extra.line) || null;
        dockTail = (extra && extra.tail) || null;
        if (dockLine) sizes.observe(dockLine);
        if (dockTail) {
          dockTail.classList.add('hd-glide', 'hd-dock-tail');
          navbar.appendChild(dockTail);
          sizes.observe(dockTail);
        }
        sizes.observe(navbar);
      }
    };
  };

  const HELD_MAX_MS = 900;
  const HELD_MOTION_MS = 620;
  let heldEnd = 0;
  CK.stack = function (host, root, o) {
    const opts = o || {};
    const screens = [root];
    host.classList.add('stack');
    host.appendChild(root.el);
    let anim = null, busy = false, popQueued = false;

    function cover(screen, on) {
      screen.el.classList.toggle('is-covered', on);
      if (on) screen.el.setAttribute('aria-hidden', 'true');
      else screen.el.removeAttribute('aria-hidden');
    }
    host.addEventListener('focusin', (e) => {
      const covered = screens.find((s) => s.el.classList.contains('is-covered') && s.el.contains(e.target));
      if (covered) e.target.blur();
    });

    function paint(top, under, p) {
      if (CK.reducedMotion()) {
        top.el.style.opacity = p;
        under.el.style.transform = '';
        under.el.querySelector('.screen-dim').style.opacity = 0;
        return;
      }
      top.el.style.transform = `translate3d(${(1 - p) * 100}%,0,0)`;
      under.el.style.transform = `translate3d(${-p * 26}%,0,0)`;
      under.el.querySelector('.screen-dim').style.opacity = p * .22;
    }
    function settle(top, under, pushed) {
      if (anim) anim = null;
      busy = false;
      top.el.classList.remove('is-moving');
      under.el.classList.remove('is-moving');
      top.el.style.transform = '';
      top.el.style.opacity = '';
      under.el.style.transform = '';
      const dim = under.el.querySelector('.screen-dim');
      dim.style.opacity = 0;
      dim.style.willChange = '';
      if (pushed) {
        under.el.hidden = true;
        cover(under, true);
        top.el.querySelector('.screen-scroll').focus({ preventScroll: true });
      } else {
        top.el.remove();
        screens.pop();
        cover(under, false);
        if (top.onClose) top.onClose();
        if (top.returnFocus && document.contains(top.returnFocus)) top.returnFocus.focus({ preventScroll: true });
      }
      emit();
      if (popQueued) {
        popQueued = false;
        api.pop();
      }
    }
    function emit() {
      const depth = screens.length;
      opts.onDepth && opts.onDepth(depth);
      if (host.dataset.active !== 'false') CK.tg.backButton(depth > 1 ? back : null);
    }
    function back() {
      const sheet = CK.sheet && CK.sheet.top;
      if (sheet) sheet.close();
      else api.pop();
    }
    function animate(top, under, from, to, velocity, landed) {
      if (anim) anim.stop();
      const held = !!landed;
      const W = held ? 0 : host.clientWidth;
      if (!held) {
        top.el.classList.add('is-moving');
        under.el.classList.add('is-moving');
      }
      under.el.hidden = false;
      const dim = under.el.querySelector('.screen-dim');
      const dimTrack = [dim, (v) => ({ opacity: clamp(v, 0, 1) * .22 })];
      anim = CK.flight({
        from, to, velocity: velocity || 0, precision: .003, stiffness: 300, damping: to === 1 ? 33 : 36,
        tracks: held ? [dimTrack] : [
          [top.el, (v) => ({ transform: `translate3d(${(1 - clamp(v, 0, 1)) * W}px,0,0)` })],
          [under.el, (v) => ({ transform: `translate3d(${-clamp(v, 0, 1) * W * .26}px,0,0)` })],
          dimTrack
        ],
        onUpdate(v) {
          if (held) dim.style.opacity = clamp(v, 0, 1) * .22;
          else paint(top, under, clamp(v, 0, 1));
        },
        onDone() {
          if (!held) {
            settle(top, under, to === 1);
            return;
          }
          let over = false;
          const land = () => {
            if (over) return;
            over = true;
            clearTimeout(late);
            heldEnd = 0;
            settle(top, under, true);
          };
          const late = setTimeout(land, HELD_MAX_MS);
          Promise.resolve(landed).then(land, land);
        }
      });
    }

    const api = {
      push(screen, pushOpts) {
        if (busy) return;
        busy = true;
        const under = screens[screens.length - 1];
        const po = pushOpts || {};
        screen.returnFocus = po.returnFocus || document.activeElement;
        screen.onClose = po.onClose;
        const back = CK.el(`<button class="navbtn navbtn-back press" type="button" ${CK.i18n.LA('nav.back')}>${CK.icon('chevron-left', { size: 22 })}</button>`);
        back.addEventListener('click', () => api.pop());
        screen.lead.prepend(back);
        const edge = CK.el('<div class="screen-edge"></div>');
        screen.el.appendChild(edge);
        host.appendChild(screen.el);
        screens.push(screen);
        attachEdgeSwipe(edge, screen, under);
        const held = !!po.held && !CK.reducedMotion();
        if (held) {
          const dim = under.el.querySelector('.screen-dim');
          dim.style.opacity = 0;
          dim.style.willChange = 'opacity';
          heldEnd = performance.now() + HELD_MOTION_MS;
        } else paint(screen, under, 0);
        emit();
        CK.haptic.light();
        const slide = () => {
          if (screens[screens.length - 1] === screen) animate(screen, under, 0, 1, 0, held ? po.landed || true : null);
          else busy = false;
        };
        if (!held) {
          screen.el.classList.add('is-moving');
          under.el.classList.add('is-moving');
        }
        if (CK.reducedMotion()) slide();
        else requestAnimationFrame(() => requestAnimationFrame(slide));
      },
      pop() {
        if (busy) { popQueued = screens.length > 1; return; }
        if (screens.length < 2) return;
        busy = true;
        const top = screens[screens.length - 1], under = screens[screens.length - 2];
        animate(top, under, 1, 0);
      },
      get depth() { return screens.length; },
      get top() { return screens[screens.length - 1]; },
      sync: emit,
      replaceRoot(next) {
        if (busy || screens.length !== 1 || !next || !next.el || next === root) return false;
        root.el.replaceWith(next.el);
        screens[0] = next;
        root = next;
        emit();
        return true;
      },
      popToRoot() {
        while (screens.length > 1) {
          const top = screens.pop();
          top.el.remove();
        }
        root.el.hidden = false;
        cover(root, false);
        root.el.style.transform = '';
        emit();
      }
    };

    function attachEdgeSwipe(edge, top, under) {
      let start = 0, width = 1;
      CK.drag(edge, {
        axis: 'x',
        threshold: 4,
        onStart(s) {
          if (busy || s.dx < 0) return false;
          busy = true;
          width = host.clientWidth;
          if (anim) anim.stop();
          top.el.classList.add('is-moving');
          under.el.classList.add('is-moving');
          under.el.hidden = false;
          cover(under, false);
          start = s.x0;
        },
        onMove(s) {
          paint(top, under, clamp(1 - (s.x - start) / width, 0, 1));
        },
        onEnd(s, cancelled) {
          const p = clamp(1 - (s.x - start) / width, 0, 1);
          const projected = (s.x - start + CK.project(s.v, .99)) / width;
          const leave = !cancelled && projected > .5;
          if (leave) CK.haptic.light();
          animate(top, under, p, leave ? 0 : 1, -s.v / width);
        }
      });
    }
    return api;
  };

  const CLOSE_PRECISION_PX = 6;
  const sheets = [];
  let surface = null;
  CK.setSheetSurface = function (appEl, stageEl) {
    surface = { app: appEl, stage: stageEl, corners: CK.el('<div class="stage-corners" aria-hidden="true"></div>') };
    stageEl.appendChild(surface.corners);
  };
  const SHEET_MOTION_MS = 480;
  let motionEnd = 0;

  const stagePose = (p) => `translate3d(0,${p * 6}px,0) scale(${1 - p * .03})`;
  const OVERSHOOT_PX = 14;
  const pastTop = (v, ceiling) => Math.max(v, ceiling);
  const cornersOf = (p) => Math.min(1, p * 3);
  function setStagePresentation(p) {
    if (p <= .001) {
      surface.stage.style.transform = '';
      surface.corners.style.opacity = '';
      return;
    }
    if (CK.reducedMotion()) return;
    surface.stage.style.transform = stagePose(p);
    surface.corners.style.opacity = cornersOf(p);
  }

  CK.sheet = {
    get top() { return sheets[sheets.length - 1] || null; },
    get motionLeft() { return Math.max(0, Math.max(motionEnd, heldEnd) - performance.now()); },
    overviewDetent() { return Math.min(.92, Math.max(.7, 470 / surface.app.clientHeight)); },
    fixedDetent(px) { return px; },
    safeBottom() {
      const probe = CK.el('<div style="position:fixed;visibility:hidden;height:var(--safe-bottom)"></div>');
      document.body.appendChild(probe);
      const px = probe.offsetHeight;
      probe.remove();
      return px;
    },
    open(o) {
      motionEnd = performance.now() + SHEET_MOTION_MS;
      const root = CK.el(`
        <div class="sheet-root">
          <div class="sheet-scrim"></div>
          <div class="sheet" role="dialog" aria-modal="true" aria-label="${CK.esc(label(o.title))}" tabindex="-1">
            <div class="sheet-top">
              <div class="sheet-grabber" aria-hidden="true"></div>
              <div class="sheet-head">
                <h2 class="sheet-title">${CK.esc(label(o.title))}</h2>
                <button class="navbtn navbtn--flat press" type="button" ${CK.i18n.LA('nav.close')}>${CK.icon('close', { size: 20 })}</button>
              </div>
            </div>
            <div class="sheet-body is-arriving"></div>
          </div>
        </div>`);
      const scrim = root.querySelector('.sheet-scrim');
      const panel = root.querySelector('.sheet');
      const top = root.querySelector('.sheet-top');
      const body = root.querySelector('.sheet-body');
      const closeBtn = root.querySelector('.sheet-head .navbtn');
      const previousFocus = document.activeElement;
      const first = sheets.length === 0;
      const detentSpec = o.detents || ['fit'];
      if (typeof o.title === 'function') {
        CK.i18n.bind(panel, () => {
          panel.setAttribute('aria-label', o.title());
          const titleEl = panel.querySelector('.sheet-title');
          if (titleEl) titleEl.textContent = o.title();
        });
      }

      surface.app.appendChild(root);
      let measured = false;
      const api = {
        el: panel, body,
        close: () => close(),
        expand: () => goTo(detents[detents.length - 1]),
        refit: () => { if (measured) refit(); }
      };
      if (o.build) o.build(body, api);
      setTimeout(() => body.classList.remove('is-arriving'), 420);

      let hostH = 0, H = 0, detents = [], y = 0, closedY = 0, anim = null, open = true, keyboard = 0, refitTimer = 0, fitH = 0;
      const showsSomething = () => Array.prototype.some.call(body.children, (child) => child.offsetHeight > 0);

      function measure() {
        hostH = surface.app.clientHeight;
        const topInset = 12 + parseFloat(getComputedStyle(root).getPropertyValue('--sheet-top-gap') || 0);
        const maxH = Math.max(120, hostH - topInset - keyboard);
        panel.style.height = '';
        panel.style.bottom = keyboard ? `${keyboard}px` : '';
        if (detentSpec.length === 1 && detentSpec[0] === 'fit') {
          if (fitH) H = Math.min(fitH, maxH);
          else {
            body.style.maxHeight = 'none';
            const dock = panel.querySelector(':scope > .sheet-dock');
            const natural = top.offsetHeight + body.scrollHeight + (dock ? dock.offsetHeight : 0);
            body.style.maxHeight = '';
            const fit = Math.min(natural, o.fitMax > 0 ? o.fitMax : Infinity);
            if (showsSomething()) fitH = fit;
            H = Math.min(fit, maxH);
          }
          detents = [H];
        } else {
          const heightOf = (d) => (d > 1 ? d : d * hostH);
          H = Math.round(Math.min(maxH, Math.max(...detentSpec.map(heightOf))));
          detents = detentSpec.map((d) => Math.round(Math.min(H, heightOf(d)))).sort((a, b) => a - b);
        }
        panel.style.height = H + 'px';
        closedY = H + 40;
      }
      function refit() {
        clearTimeout(refitTimer);
        if (!open || fitH || detentSpec.length !== 1 || detentSpec[0] !== 'fit') return;
        if (panel.classList.contains('is-dragging') || CK.sheet.motionLeft > 0) {
          refitTimer = setTimeout(refit, CK.sheet.motionLeft + 40);
          return;
        }
        const was = H, from = panel.offsetHeight;
        measure();
        if (H === was) return;
        y = minY();
        paint();
        if (CK.reducedMotion()) return;
        panel.style.transition = 'none';
        panel.style.height = from + 'px';
        void panel.offsetHeight;
        panel.style.transition = 'height .32s var(--ease-out)';
        panel.style.height = H + 'px';
        panel.addEventListener('transitionend', function done(e) {
          if (e.target !== panel || e.propertyName !== 'height') return;
          panel.removeEventListener('transitionend', done);
          panel.style.transition = '';
        });
      }
      const yFor = (visible) => H - visible;
      const minY = () => yFor(detents[detents.length - 1]);
      const smallestY = () => yFor(detents[0]);
      const atLargest = () => y <= minY() + 1;

      const presenceAt = (at) => clamp(1 - (at - smallestY()) / Math.max(1, closedY - smallestY()), 0, 1);
      function paint() {
        panel.style.transform = `translate3d(0,${y}px,0)`;
        const p = presenceAt(y);
        scrim.style.opacity = p;
        if (first) setStagePresentation(p);
        body.classList.toggle('is-locked', !atLargest());
      }
      function springTo(target, velocity, done, precision = .1) {
        if (anim) anim.stop();
        motionEnd = performance.now() + SHEET_MOTION_MS;
        const ceiling = minY();
        const tracks = [
          [panel, (v) => ({ transform: `translate3d(0,${pastTop(v, ceiling)}px,0)` })],
          [scrim, (v) => ({ opacity: presenceAt(Math.max(v, ceiling)) })]
        ];
        if (first) {
          tracks.push(
            [surface.stage, (v) => ({ transform: stagePose(presenceAt(Math.max(v, ceiling))) })],
            [surface.corners, (v) => ({ opacity: cornersOf(presenceAt(Math.max(v, ceiling))) })]
          );
        }
        anim = CK.flight({
          from: y, to: target, velocity: velocity == null ? 0 : velocity, precision, tracks, ...motionSpring('sheet', CK.springs.sheet),
          onUpdate(v) { y = Math.max(v, minY()); paint(); },
          onDone() {
            y = target;
            paint();
            if (first && open) surface.stage.setAttribute('aria-hidden', 'true');
            done && done();
          }
        });
      }
      function goTo(visible) { springTo(yFor(visible), 0); }

      function close() {
        if (!open) return;
        open = false;
        panel.setAttribute('inert', '');
        document.removeEventListener('keydown', onKey);
        resizeObserver.disconnect();
        if (window.visualViewport) window.visualViewport.removeEventListener('resize', onViewport);
        const i = sheets.indexOf(api);
        if (i >= 0) sheets.splice(i, 1);
        springTo(closedY, anim ? anim.velocity : 0, () => {
          if (first) {
            setStagePresentation(0);
            surface.stage.classList.remove('is-receded');
            surface.stage.removeAttribute('aria-hidden');
          }
          root.remove();
          if (previousFocus && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
          o.onClose && o.onClose();
        }, CLOSE_PRECISION_PX);
      }

      let startY = 0;
      function dragStart() {
        if (anim) anim.stop();
        startY = y;
        panel.classList.add('is-dragging');
      }
      function dragMove(dy) {
        y = Math.max(startY + dy, minY());
        paint();
      }
      function dragEnd(v) {
        panel.classList.remove('is-dragging');
        const projected = y + CK.project(v, .992);
        const candidates = detents.map(yFor);
        const dismissAt = smallestY() + Math.min(detents[0] * .45, 180);
        if (projected > dismissAt) {
          CK.haptic.light();
          close();
          return;
        }
        let best = candidates[0];
        candidates.forEach((c) => { if (Math.abs(c - projected) < Math.abs(best - projected)) best = c; });
        if (best !== yFor(detents[detents.length - 1]) || candidates.length > 1) {
          if (Math.abs(best - y) > 8) CK.haptic.selection();
        }
        springTo(best, v);
      }

      CK.drag(top, {
        axis: 'y',
        threshold: 2,
        filter: (e) => !e.target.closest('button'),
        onStart: dragStart,
        onMove: (s) => dragMove(s.dy),
        onEnd: (s) => dragEnd(s.v)
      });
      CK.drag(body, {
        axis: 'y',
        threshold: 4,
        filter: (e) => e.pointerType === 'mouse' && !e.target.closest('button,input,a,[role="slider"],.carousel,.swipe'),
        onStart(s) {
          if (s.dy > 0 ? body.scrollTop > 0 : atLargest()) return false;
          dragStart();
        },
        onMove: (s) => dragMove(s.dy),
        onEnd: (s) => dragEnd(s.v)
      });
      let t = null;
      const scrolledWithin = (node) => {
        for (let n = node; n && n !== body; n = n.parentElement) if (n.scrollTop > 0) return true;
        return false;
      };
      body.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { t = null; return; }
        t = { x0: e.touches[0].clientX, y0: e.touches[0].clientY, decided: false, dragging: false, tracker: CK.velocityTracker() };
        t.tracker.add(t.y0);
      }, { passive: true });
      body.addEventListener('touchmove', (e) => {
        if (!t) return;
        const dx = e.touches[0].clientX - t.x0, dy = e.touches[0].clientY - t.y0;
        t.tracker.add(e.touches[0].clientY);
        if (!t.decided) {
          if (Math.hypot(dx, dy) < 6) return;
          t.decided = true;
          const vertical = Math.abs(dy) > Math.abs(dx);
          const blocked = e.target.closest('[role="slider"],.carousel,.swipe') || (dy > 0 && scrolledWithin(e.target));
          if (vertical && !blocked && ((dy > 0 && body.scrollTop <= 0) || (dy < 0 && !atLargest()))) {
            t.dragging = true;
            t.origin = e.touches[0].clientY;
            dragStart();
          }
        }
        if (t.dragging && e.cancelable) {
          e.preventDefault();
          dragMove(e.touches[0].clientY - t.origin);
        }
      }, { passive: false });
      const touchEnd = () => {
        if (t && t.dragging) {
          CK.suppressNextClick();
          dragEnd(t.tracker.get());
        }
        t = null;
      };
      body.addEventListener('touchend', touchEnd, { passive: true });
      body.addEventListener('touchcancel', touchEnd, { passive: true });
      body.addEventListener('wheel', (e) => {
        if (!atLargest() && e.deltaY > 0) {
          e.preventDefault();
          goTo(detents[detents.length - 1]);
        } else if (detents.length > 1 && e.deltaY < -40 && body.scrollTop <= 0) {
          goTo(detents[0]);
        }
      }, { passive: false });

      function onKey(e) {
        if (CK.sheet.top !== api) return;
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key !== 'Tab') return;
        const focusable = Array.from(panel.querySelectorAll('button,input,a[href],[tabindex="0"]')).filter((n) => !n.disabled && n.offsetParent !== null);
        if (!focusable.length) return;
        const a = focusable[0], b = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
        else if (!panel.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
      }
      document.addEventListener('keydown', onKey);
      scrim.addEventListener('click', close);
      closeBtn.addEventListener('click', close);
      body.addEventListener('click', (e) => {
        const toggle = e.target.closest && e.target.closest('[aria-controls]');
        if (!toggle || !body.contains(toggle)) return;
        requestAnimationFrame(() => {
          if (!open || !toggle.isConnected || toggle.getAttribute('aria-expanded') !== 'true' || body.classList.contains('is-locked')) return;
          const id = toggle.getAttribute('aria-controls');
          const box = id && panel.querySelector('#' + CSS.escape(id));
          if (!box || box.hidden || !body.contains(box)) return;
          const view = body.getBoundingClientRect(), line = toggle.getBoundingClientRect(), last = box.getBoundingClientRect();
          const by = Math.min(last.bottom - (view.bottom - 12), line.top - (view.top + 8));
          if (by > 1) body.scrollTo({ top: body.scrollTop + by, behavior: CK.reducedMotion() ? 'auto' : 'smooth' });
        });
      });

      measure();
      measured = true;
      y = closedY;
      const startVisible = o.start === 'large' ? detents[detents.length - 1] : detents[0];
      if (first) surface.stage.classList.add('is-receded');
      paint();
      sheets.push(api);
      panel.focus({ preventScroll: true });
      CK.haptic.light();
      const rise = () => {
        if (!open || anim || panel.classList.contains('is-dragging')) return;
        springTo(yFor(startVisible), 0);
        if (CK.motion && CK.motion.sheet) {
          if (body.children.length) body.classList.remove('is-arriving');
          CK.motion.sheet(root, body);
        }
      };
      if (CK.reducedMotion()) rise();
      else requestAnimationFrame(rise);

      let seenW = surface.app.clientWidth;
      const resizeObserver = new ResizeObserver(() => {
        if (!open) return;
        if (surface.app.clientWidth === seenW && surface.app.clientHeight === hostH) return;
        seenW = surface.app.clientWidth;
        const wasLargest = atLargest();
        const prevH = H;
        measure();
        if (H !== prevH || wasLargest) {
          if (anim) anim.stop();
          y = wasLargest ? minY() : yFor(detents[0]);
          closedY = H + 40;
          paint();
        }
        keepFieldInView();
      });
      resizeObserver.observe(surface.app);
      function keepFieldInView() {
        const field = document.activeElement;
        if (field && field.tagName === 'INPUT' && panel.contains(field)) field.scrollIntoView({ block: 'nearest' });
      }

      function onViewport() {
        const vv = window.visualViewport;
        const covered = window.innerHeight - vv.height;
        const next = covered > 120 && vv.scale === 1 ? Math.round(covered) : 0;
        if (next === keyboard) return;
        keyboard = next;
        if (keyboard) window.scrollTo(0, 0);
        if (anim) anim.stop();
        measure();
        y = minY();
        paint();
        keepFieldInView();
      }
      if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewport);
      return api;
    }
  };

  let toastHost = null, toastTimer = 0;
  CK.setToastHost = function (el) { toastHost = el; };
  CK.toastDismiss = function () {
    const t = toastHost && toastHost.lastElementChild;
    if (!t || t.classList.contains('is-out')) return;
    clearTimeout(toastTimer);
    t.classList.remove('is-in');
    setTimeout(() => t.remove(), 320);
  };
  CK.toast = function (text, o) {
    const opts = o || {};
    Array.from(toastHost.children).forEach((old) => {
      if (old.classList.contains('is-out')) return;
      old.classList.add('is-out');
      old.classList.remove('is-in');
      setTimeout(() => old.remove(), 240);
    });
    const t = CK.el(`<div class="toast ${opts.tone ? 'toast--' + opts.tone : ''}" role="status">${opts.icon ? CK.icon(opts.icon, { fill: true, size: 20 }) : ''}<span>${text}</span></div>`);
    toastHost.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-in')));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('is-in');
      setTimeout(() => t.remove(), 320);
    }, opts.ms || 1900);
  };
})();
