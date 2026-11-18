(function () {
  'use strict';
  const CK = window.CK = window.CK || {};

  const inputRoot = document.documentElement;
  inputRoot.dataset.input = 'pointer';
  window.addEventListener('pointerdown', () => { inputRoot.dataset.input = 'pointer'; }, { capture: true, passive: true });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow')) inputRoot.dataset.input = 'keyboard';
  }, { capture: true, passive: true });

  const agent = navigator.userAgent;
  const telegramClass = (agent.match(/Telegram-Android\/.*\b(LOW|AVERAGE|HIGH)\)/) || [])[1];
  if (telegramClass ? telegramClass !== 'HIGH' : !/iPhone|iPad|Macintosh/.test(agent) && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4)) inputRoot.classList.add('lite-glass');

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  CK.reducedMotion = () => motionQuery.matches;
  CK.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  CK.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  CK.el = function (html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  CK.project = function (v, decay) {
    const d = decay || .998;
    return (v / 1000) * d / (1 - d);
  };

  CK.springs = {
    snappy: { stiffness: 560, damping: 40 },
    smooth: { stiffness: 300, damping: 33 },
    jelly: { stiffness: 420, damping: 40.988 },
    settle: { stiffness: 420, damping: 41 },
    sheet: { stiffness: 300, damping: 33 },
    glide: { stiffness: 170, damping: 26 }
  };

  const SCROLL_REST_MS = 160;
  let scrolledAt = -SCROLL_REST_MS;
  document.addEventListener('scroll', () => { scrolledAt = performance.now(); }, { capture: true, passive: true });
  CK.scrollLeft = () => Math.max(0, scrolledAt + SCROLL_REST_MS - performance.now());

  let flights = 0, landing = [];
  CK.inFlight = () => flights > 0;
  CK.afterFlight = function (fn) {
    if (!flights) fn();
    else landing.push(fn);
  };
  function landed() {
    if (--flights > 0 || !landing.length) return;
    const held = landing;
    landing = [];
    setTimeout(() => {
      if (flights) landing = held.concat(landing);
      else held.forEach((fn) => fn());
    }, 60);
  }

  CK.spring = function (o) {
    const k = o.stiffness || 300, c = o.damping || 30, m = o.mass || 1;
    const precision = o.precision || .02;
    const to = o.to;
    const self = { value: o.from, velocity: o.velocity || 0, stop() { alive = false; cancelAnimationFrame(raf); land(); } };
    let alive = true, raf = 0, last = 0, started = 0, flying = false;
    function land() {
      if (flying) { flying = false; landed(); }
    }

    if (CK.reducedMotion()) {
      self.value = to;
      self.velocity = 0;
      o.onUpdate && o.onUpdate(to, 0);
      o.onDone && o.onDone();
      return self;
    }
    if (o.flight) { flying = true; flights++; }

    function frame(now) {
      if (!alive) return;
      let left = started === 0 ? 1 / 120 : Math.min((now - last) / 1000, started === 1 ? 1 / 60 : .034);
      started++;
      last = now;
      const h = 1 / 240;
      while (left > 0) {
        const step = Math.min(h, left);
        const a = (-k * (self.value - to) - c * self.velocity) / m;
        self.velocity += a * step;
        self.value += self.velocity * step;
        left -= h;
      }
      if (Math.abs(self.value - to) < precision && Math.abs(self.velocity) < precision * 12) {
        self.value = to;
        self.velocity = 0;
        alive = false;
        land();
        o.onUpdate && o.onUpdate(to, 0);
        o.onDone && o.onDone();
        return;
      }
      o.onUpdate && o.onUpdate(self.value, self.velocity);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return self;
  };

  const PATH_STEP = 1 / 60;
  CK.springPath = function (o) {
    const k = o.stiffness || 300, c = o.damping || 30, m = o.mass || 1;
    const precision = o.precision || .02;
    const to = o.to;
    const values = [o.from], speeds = [o.velocity || 0];
    let value = o.from, velocity = o.velocity || 0;
    while (values.length < 180) {
      for (let i = 0; i < 4; i++) {
        velocity += ((-k * (value - to) - c * velocity) / m) * (PATH_STEP / 4);
        value += velocity * (PATH_STEP / 4);
      }
      values.push(value);
      speeds.push(velocity);
      if (Math.abs(value - to) < precision && Math.abs(velocity) < precision * 12) break;
    }
    values[values.length - 1] = to;
    speeds[speeds.length - 1] = 0;
    return { values, speeds, duration: (values.length - 1) * PATH_STEP * 1000 };
  };
  CK.flight = function (o) {
    if (CK.reducedMotion() || !Element.prototype.animate) return CK.spring({ ...o, flight: true });
    const to = o.to;
    const { values, speeds, duration } = CK.springPath(o);
    const animations = o.tracks.map(([el, frame]) => el.animate(values.map((v, i) => frame(v, speeds[i])), { duration, easing: 'linear', fill: 'both', id: 'flight' }));
    const at = (list) => {
      const i = CK.clamp((animations[0].currentTime || 0) / (PATH_STEP * 1000), 0, list.length - 1), a = Math.floor(i);
      return a + 1 < list.length ? list[a] + (list[a + 1] - list[a]) * (i - a) : list[a];
    };
    let alive = true;
    flights++;
    const end = (v, vel) => {
      alive = false;
      landed();
      o.onUpdate && o.onUpdate(v, vel);
      animations.forEach((a) => a.cancel());
    };
    animations[0].onfinish = () => {
      if (!alive) return;
      end(to, 0);
      o.onDone && o.onDone();
    };
    return {
      get value() { return alive ? at(values) : to; },
      get velocity() { return alive ? at(speeds) : 0; },
      stop() { if (alive) end(at(values), at(speeds)); }
    };
  };

  function velocityTracker() {
    const samples = [];
    return {
      add(v) {
        const t = performance.now();
        samples.push([t, v]);
        while (samples.length > 2 && t - samples[0][0] > 100) samples.shift();
      },
      get() {
        if (samples.length < 2) return 0;
        const a = samples[0], b = samples[samples.length - 1];
        const dt = b[0] - a[0];
        return dt > 0 ? ((b[1] - a[1]) / dt) * 1000 : 0;
      }
    };
  }
  CK.velocityTracker = velocityTracker;

  function suppressNextClick() {
    const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
    window.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 32);
  }
  CK.suppressNextClick = suppressNextClick;

  CK.drag = function (el, o) {
    const axis = o.axis || 'x';
    const threshold = o.threshold == null ? 6 : o.threshold;
    const slop = Math.max(threshold, o.slop || 0);

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      if (o.filter && !o.filter(e)) return;
      const tracker = velocityTracker();
      const pick = (ev) => (axis === 'x' ? ev.clientX : ev.clientY);
      const s = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, dx: 0, dy: 0, v: 0, type: e.pointerType, active: false, target: e.target };
      tracker.add(pick(e));
      o.onPress && o.onPress(s);

      const finish = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', cancel);
      };
      const move = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        s.x = ev.clientX; s.y = ev.clientY;
        s.dx = ev.clientX - s.x0; s.dy = ev.clientY - s.y0;
        tracker.add(pick(ev));
        if (!s.active) {
          const main = Math.abs(axis === 'x' ? s.dx : s.dy);
          const cross = Math.abs(axis === 'x' ? s.dy : s.dx);
          if (Math.max(main, cross) < threshold) return;
          if (main < cross && cross < slop) return;
          if (main < cross || (o.onStart && o.onStart(s) === false)) {
            finish();
            o.onRelease && o.onRelease(s, false);
            return;
          }
          s.active = true;
          try { el.setPointerCapture(e.pointerId); } catch (_) { }
        }
        if (ev.cancelable) ev.preventDefault();
        s.v = tracker.get();
        o.onMove && o.onMove(s);
      };
      const up = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        finish();
        s.v = tracker.get();
        if (s.active) {
          suppressNextClick();
          o.onEnd && o.onEnd(s, false);
        } else {
          o.onRelease && o.onRelease(s, true);
        }
      };
      const cancel = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        finish();
        if (s.active) o.onEnd && o.onEnd(s, true);
        else o.onRelease && o.onRelease(s, false);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', cancel);
    });
    el.addEventListener('dragstart', (e) => e.preventDefault());
  };

  const SDK_WAIT_MS = 5000;
  const FIRST_FRAME_WAIT_MS = 250;
  const HEX = /^#[0-9a-f]{6}$/i;
  const root = document.documentElement;
  const launch = new URLSearchParams(location.hash.slice(1));
  const launched = launch.has('tgWebAppVersion') || launch.has('tgWebAppData');
  const searchAtLaunch = new URLSearchParams(location.search);
  let webApp = null, pageReady = false, back = null;
  const atLeast = (v) => !!webApp && webApp.isVersionAtLeast && webApp.isVersionAtLeast(v);

  function post(eventType, eventData) {
    const data = eventData || {};
    try {
      if (window.TelegramWebviewProxy) window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(data));
      else if (window.parent !== window) window.parent.postMessage(JSON.stringify({ eventType, eventData: data }), '*');
    } catch (_) { }
  }

  let headerTint = null;
  function splashTint() {
    if (!root.classList.contains('sp-on') || (CK.launch && CK.launch.headerHeld === false)) return null;
    const c = getComputedStyle(root).getPropertyValue('--sp-a').trim();
    return HEX.test(c) ? c : null;
  }
  function paintBars() {
    const color = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (!HEX.test(color)) return;
    const head = headerTint || splashTint() || color;
    if (!webApp) {
      post('web_app_set_header_color', { color_key: 'secondary_bg_color' });
      post('web_app_set_header_color', { color: head });
      post('web_app_set_background_color', { color });
      post('web_app_set_bottom_bar_color', { color });
      return;
    }
    try {
      if (atLeast('6.9')) webApp.setHeaderColor(head);
      else if (atLeast('6.1')) webApp.setHeaderColor('secondary_bg_color');
    } catch (_) { }
    [['6.1', 'setBackgroundColor'], ['7.10', 'setBottomBarColor']].forEach(([version, method]) => {
      try { if (atLeast(version)) webApp[method](color); } catch (_) { }
    });
  }

  function applyLaunchTheme() {
    let theme = {};
    try { theme = JSON.parse(launch.get('tgWebAppThemeParams')) || {}; } catch (_) { }
    Object.keys(theme).forEach((key) => {
      if (/^[a-z_]+$/.test(key) && HEX.test(theme[key])) root.style.setProperty('--tg-theme-' + key.replace(/_/g, '-'), theme[key]);
    });
    if (HEX.test(theme.bg_color)) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(theme.bg_color.slice(i, i + 2), 16));
      root.dataset.theme = Math.sqrt(.299 * r * r + .587 * g * g + .114 * b * b) < 120 ? 'dark' : 'light';
    }
    root.classList.add('tg-launch');
  }

  let forcedTheme = null;
  try { forcedTheme = /^(light|dark)$/.test(localStorage.getItem('ck-theme2')) ? localStorage.getItem('ck-theme2') : null; } catch (_) { }

  const SWIPE_LOCK_KEY = 'ck-swipe-lock';
  let swipeLocked = true;
  try { swipeLocked = localStorage.getItem(SWIPE_LOCK_KEY) !== '0'; } catch (_) { }
  function applySwipe() {
    if (webApp && atLeast('7.7')) {
      try {
        if (swipeLocked) webApp.disableVerticalSwipes();
        else webApp.enableVerticalSwipes();
        return;
      } catch (_) { }
    }
    if (launched) post('web_app_setup_swipe_behavior', { allow_vertical_swipe: !swipeLocked });
  }
  let uprightLocked = false;
  const upright = () => window.innerHeight >= window.innerWidth;
  function lockUpright() {
    if (uprightLocked || !upright()) return;
    if (webApp) {
      if (!atLeast('8.0') || typeof webApp.lockOrientation !== 'function') return;
      try {
        webApp.lockOrientation();
        uprightLocked = true;
      } catch (_) { }
      return;
    }
    if (launched) post('web_app_toggle_orientation_lock', { locked: true });
  }

  function stripTelegramColors() {
    Array.from(root.style).filter((name) => name.startsWith('--tg-theme-')).forEach((name) => root.style.removeProperty(name));
  }

  function applyScheme() {
    if (forcedTheme) {
      stripTelegramColors();
      root.dataset.theme = forcedTheme;
    } else if (webApp) {
      const theme = webApp.themeParams || {};
      Object.keys(theme).forEach((key) => root.style.setProperty('--tg-theme-' + key.replace(/_/g, '-'), theme[key]));
      root.dataset.theme = webApp.colorScheme;
    } else {
      applyLaunchTheme();
    }
    paintBars();
  }

  function requestFullscreen() {
    if (!atLeast('8.0') || !/^(ios|android|android_x)$/.test(webApp.platform)) return;
    try { if (!webApp.isFullscreen) webApp.requestFullscreen(); } catch (_) { }
  }

  function syncBack() {
    if (!atLeast('6.1')) return;
    if (back) webApp.BackButton.show();
    else webApp.BackButton.hide();
  }

  CK.tg = {
    get inside() { return launched || !!webApp; },
    tintHeader(c) {
      const next = c && HEX.test(c) ? c : null;
      if (next === headerTint) return;
      headerTint = next;
      paintBars();
    },
    repaint() { paintBars(); },
    get swipeLocked() { return swipeLocked; },
    setSwipeLock(on) {
      swipeLocked = on !== false;
      try { localStorage.setItem(SWIPE_LOCK_KEY, swipeLocked ? '1' : '0'); } catch (_) { }
      applySwipe();
    },
    get app() { return webApp; },
    init() {
      const sdk = window.Telegram && window.Telegram.WebApp;
      if (webApp || !sdk || sdk.initData === undefined || !sdk.platform || sdk.platform === 'unknown') return;
      webApp = sdk;
      root.classList.add('in-telegram');
      if (atLeast('6.1')) root.classList.add('tg-back');
      if (pageReady) webApp.ready();
      webApp.expand();
      requestFullscreen();
      applySwipe();
      lockUpright();
      applyScheme();
      CK.i18n.adoptTelegram();
      webApp.onEvent('themeChanged', applyScheme);
      if (back && atLeast('6.1')) webApp.BackButton.onClick(back);
      syncBack();
    },
    forceTheme(mode) {
      forcedTheme = mode;
      applyScheme();
    },
    ready() {
      if (pageReady) return;
      pageReady = true;
      if (webApp) webApp.ready();
      else if (launched) post('web_app_ready');
    },
    whenInitData() {
      const known = launch.get('tgWebAppData');
      if (known) return Promise.resolve(known);
      return sdkSettled.then(() => (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '');
    },
    get startParam() {
      let value = '';
      const signed = launch.get('tgWebAppData') || (webApp && typeof webApp.initData === 'string' ? webApp.initData : '');
      try { value = new URLSearchParams(signed || '').get('start_param') || ''; } catch (_) { }
      return typeof value === 'string' ? value : '';
    },
    launchSearch: Object.freeze({ get: (name) => searchAtLaunch.get(name) }),
    canShareMessage: () => atLeast('8.0') && typeof webApp.shareMessage === 'function',
    shareMessage(id) {
      if (!CK.tg.canShareMessage()) return Promise.reject(Object.assign(new Error('unsupported'), { code: 'unsupported' }));
      return new Promise((resolve, reject) => {
        try { webApp.shareMessage(id, (sent) => resolve(sent === true)); } catch (err) { reject(Object.assign(new Error('share_failed'), { code: 'share_failed' })); }
      });
    },
    shareMessageResult(id) {
      if (!CK.tg.canShareMessage()) return Promise.reject(Object.assign(new Error('unsupported'), { code: 'unsupported' }));
      return new Promise((resolve, reject) => {
        let error = null;
        const failed = (event) => { error = event && typeof event.error === 'string' ? event.error : 'UNKNOWN_ERROR'; };
        const off = () => { try { if (typeof webApp.offEvent === 'function') webApp.offEvent('shareMessageFailed', failed); } catch (_) { } };
        try { if (typeof webApp.onEvent === 'function') webApp.onEvent('shareMessageFailed', failed); } catch (_) { }
        try {
          webApp.shareMessage(id, (sent) => setTimeout(() => {
            off();
            resolve({ sent: sent === true, error: sent === true ? null : error });
          }, 0));
        } catch (err) {
          off();
          reject(Object.assign(new Error('share_failed'), { code: 'share_failed' }));
        }
      });
    },
    switchInlineQuery(query) {
      if (!atLeast('6.7') || typeof webApp.switchInlineQuery !== 'function') return false;
      try {
        webApp.switchInlineQuery(query);
        return true;
      } catch (_) {
        return false;
      }
    },
    backButton(handler) {
      if (atLeast('6.1') && back) webApp.BackButton.offClick(back);
      back = handler;
      if (atLeast('6.1') && back) webApp.BackButton.onClick(back);
      syncBack();
    }
  };

  if (launched) {
    root.classList.add('tg-launch');
    applyScheme();
    post('web_app_expand');
    if (/^(ios|android)/.test(launch.get('tgWebAppPlatform') || '')) {
      post('web_app_request_fullscreen');
      root.classList.add('tg-settling');
      const began = Date.now();
      const inset = (name) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
      const settled = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('tg-settling')));
      (function wait() {
        if ((inset('--tg-safe-area-inset-top') > 0 && inset('--tg-content-safe-area-inset-top') > 0) || Date.now() - began > 700) settled();
        else setTimeout(wait, 40);
      })();
    }
    applySwipe();
    lockUpright();
    window.addEventListener('resize', lockUpright);
  }
  function afterFirstFrame(fn) {
    let ran = false;
    const run = () => {
      if (ran) return;
      ran = true;
      fn();
    };
    requestAnimationFrame(() => setTimeout(run));
    setTimeout(run, FIRST_FRAME_WAIT_MS);
  }
  document.addEventListener('DOMContentLoaded', () => afterFirstFrame(() => CK.tg.ready()), { once: true });
  let appBuilt;
  CK.appBuilt = new Promise((resolve) => { appBuilt = resolve; });
  CK.buildApp = (build) => afterFirstFrame(() => {
    try { build(); } finally { appBuilt(); }
  });

  const initOnce = () => {
    try { CK.tg.init(); } catch (err) { console.error('telegram init', err); }
  };
  const sdkSettled = new Promise((resolve) => {
    const tag = document.getElementById('tg-sdk');
    if (window.Telegram && window.Telegram.WebApp) {
      initOnce();
      resolve();
    } else if (tag) {
      tag.addEventListener('load', () => { initOnce(); resolve(); });
      tag.addEventListener('error', resolve);
      setTimeout(resolve, SDK_WAIT_MS);
    } else {
      resolve();
    }
  });

  const HAPTIC_KEY = 'ck-haptic';
  let hapticOn = true;
  try { hapticOn = localStorage.getItem(HAPTIC_KEY) !== 'off'; } catch (_) { }
  CK.haptic = {
    get enabled() { return hapticOn; },
    set enabled(on) {
      hapticOn = !!on;
      try { localStorage.setItem(HAPTIC_KEY, hapticOn ? 'on' : 'off'); } catch (_) { }
    },
    _call(kind, arg, ms) {
      if (!hapticOn) return;
      if (atLeast('6.1')) {
        try {
          const h = webApp.HapticFeedback;
          if (kind === 'impact') h.impactOccurred(arg);
          else if (kind === 'notify') h.notificationOccurred(arg);
          else h.selectionChanged();
        } catch (_) { }
        return;
      }
      if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(ms);
    },
    selection() { this._call('selection', null, 5); },
    light() { this._call('impact', 'light', 8); },
    soft() { this._call('impact', 'soft', 10); },
    medium() { this._call('impact', 'medium', 14); },
    success() { this._call('notify', 'success', [10, 50, 18]); },
    error() { this._call('notify', 'error', [16, 45, 16, 45, 16]); }
  };

  CK.copyText = function (text) {
    const legacy = () => {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (_) { }
      field.remove();
      return copied;
    };
    if (!navigator.clipboard) return Promise.resolve(legacy());
    return navigator.clipboard.writeText(text).then(() => true, legacy);
  };
  const WHEEL = '0123456789'.repeat(2).split('').join('\n');
  const wheelAt = (i) => `translate3d(0,${-i * 5}%,0)`;
  const SPIN = { duration: 600, easing: 'cubic-bezier(.22, 1, .36, 1)' };
  const isRollDigit = (ch) => ch.length === 1 && /\d/.test(ch);
  function makeRollChar(ch, entering) {
    const isDigit = isRollDigit(ch);
    const node = document.createElement('span');
    node.className = (isDigit ? 'roll-d' : 'roll-c') + (entering ? ' roll-enter' : '');
    if (isDigit) {
      const col = document.createElement('span');
      col.className = 'roll-col';
      col.textContent = WHEEL;
      col.style.transform = wheelAt(Number(ch));
      col._d = Number(ch);
      node.appendChild(col);
    } else {
      node.textContent = ch;
    }
    return node;
  }
  function spinWheel(col, digit, up) {
    let at = col._d;
    const run = col._run;
    if (run) {
      const p = run.effect.getComputedTiming().progress;
      if (p !== null) at = run.from + (run.to - run.from) * p;
      run.cancel();
    }
    at = ((at % 10) + 10) % 10;
    const from = up ? at : at + 10;
    let to = up ? digit : digit + 10;
    if (up && to <= from) to += 10;
    if (!up && to >= from) to -= 10;
    col._d = digit;
    col.style.transition = 'none';
    col.style.transform = wheelAt(digit);
    col._run = col.animate([{ transform: wheelAt(from) }, { transform: wheelAt(to) }], SPIN);
    col._run.from = from;
    col._run.to = to;
  }
  function setWheel(col, digit) {
    if (col._run) {
      col._run.cancel();
      col._run = null;
      col.style.transition = '';
    }
    col._d = digit;
    col.style.transform = wheelAt(digit);
  }
  function rollParts(text, keep) {
    const chars = Array.from(text), parts = [];
    let i = 0;
    if (keep > 1) {
      parts.push(chars.slice(0, keep).join(''));
      i = keep;
    }
    for (; i < chars.length; i++) {
      const last = parts[parts.length - 1];
      if (last === undefined || isRollDigit(chars[i]) || isRollDigit(last)) parts.push(chars[i]);
      else parts[parts.length - 1] = last + chars[i];
    }
    return parts;
  }
  CK.roll = function (el, text, keep, up) {
    if (el.getAttribute('aria-label') === text && el.childElementCount) return;
    if (!el.classList.contains('roll')) {
      el.classList.add('roll');
      el.setAttribute('role', 'text');
    }
    el.setAttribute('aria-label', text);
    const parts = rollParts(text, keep);
    const old = el.children;
    const spin = (up === true || up === false) && !CK.reducedMotion() && !!Element.prototype.animate;
    const entering = old.length > 0;
    const fresh = new Array(parts.length);
    let same = old.length === parts.length;
    for (let i = parts.length - 1, j = old.length - 1; i >= 0; i--, j--) {
      const part = parts[i], prev = j >= 0 ? old[j] : null;
      if (prev && isRollDigit(part) && prev.classList.contains('roll-d')) {
        const col = prev.firstElementChild, digit = Number(part);
        if (col._d !== digit) {
          if (spin) spinWheel(col, digit, up);
          else setWheel(col, digit);
        }
        fresh[i] = prev;
      } else if (prev && !isRollDigit(part) && prev.classList.contains('roll-c')) {
        if (prev.textContent !== part) prev.textContent = part;
        fresh[i] = prev;
      } else {
        fresh[i] = makeRollChar(part, entering);
        same = false;
      }
    }
    if (!same) el.replaceChildren(...fresh);
  };

  const NBSP = String.fromCharCode(0xa0);
  const isEn = () => CK.i18n.lang === 'en';
  const numLocale = () => (isEn() ? 'en-US' : 'ru-RU');
  const numFormats = new Map();
  function numFormat(key, options) {
    const id = numLocale() + '|' + key;
    let f = numFormats.get(id);
    if (!f) {
      f = new Intl.NumberFormat(numLocale(), options);
      numFormats.set(id, f);
    }
    return f;
  }

  const CURRENCY_KEY = 'ck-currency';
  const CURRENCY_CLOUD_KEY = 'currency';
  const CURRENCY_SIGNS = { USD: '$', EUR: '€', RUB: '₽' };
  const RATE_BOUNDS = { EUR: [.3, 3], RUB: [10, 1000] };
  const knownCurrency = (code) => typeof code === 'string' && Object.prototype.hasOwnProperty.call(CURRENCY_SIGNS, code);
  const goodRate = (code, v) => typeof v === 'number' && Number.isFinite(v) && v >= RATE_BOUNDS[code][0] && v <= RATE_BOUNDS[code][1];
  function cleanRates(rates) {
    const out = {};
    if (rates && typeof rates === 'object') Object.keys(RATE_BOUNDS).forEach((code) => { if (goodRate(code, rates[code])) out[code] = rates[code]; });
    return out;
  }
  const money = { code: 'USD', rates: {}, at: 0, picked: false };
  try {
    const kept = JSON.parse(localStorage.getItem(CURRENCY_KEY) || 'null');
    if (kept && knownCurrency(kept.code)) money.code = kept.code;
    if (kept) {
      money.rates = cleanRates(kept.rates);
      money.at = Number(kept.at) || 0;
    }
  } catch (_) { }
  function keepMoney() {
    try { localStorage.setItem(CURRENCY_KEY, JSON.stringify({ code: money.code, rates: money.rates, at: money.at })); } catch (_) { }
  }
  const shownCurrency = () => (money.code !== 'USD' && money.rates[money.code] ? money.code : 'USD');
  const shownRate = () => (shownCurrency() === 'USD' ? 1 : money.rates[money.code]);
  const currencyCloud = () => (atLeast('6.9') && webApp.CloudStorage ? webApp.CloudStorage : null);
  function cloudCurrencyWrite(code) {
    const store = currencyCloud();
    try { if (store) store.setItem(CURRENCY_CLOUD_KEY, code, () => {}); } catch (_) { }
  }
  function useCurrency(code) {
    if (code === money.code) return;
    money.code = code;
    keepMoney();
    if (CK.i18n.refresh) CK.i18n.refresh();
  }
  CK.currency = {
    LIST: ['USD', 'EUR', 'RUB'],
    get code() { return money.code; },
    get shown() { return shownCurrency(); },
    set(code) {
      if (!knownCurrency(code)) return;
      money.picked = true;
      cloudCurrencyWrite(code);
      useCurrency(code);
    },
    setRates(rates, at) {
      const next = cleanRates(rates);
      if (!Object.keys(next).length) return;
      const before = shownRate();
      const wasShown = shownCurrency();
      money.rates = { ...money.rates, ...next };
      money.at = Number(at) || Date.now();
      keepMoney();
      if (shownCurrency() !== wasShown || shownRate() !== before) CK.i18n.refresh();
    }
  };
  sdkSettled.then(() => {
    const store = currencyCloud();
    if (!store) return;
    try {
      store.getItem(CURRENCY_CLOUD_KEY, (err, value) => {
        if (err || money.picked) return;
        if (knownCurrency(value)) useCurrency(value);
        else if (!value && money.code !== 'USD') cloudCurrencyWrite(money.code);
      });
    } catch (_) { }
  });

  CK.fmt = {
    decimal() { return isEn() ? '.' : ','; },
    parse(s) {
      let raw = String(s).replace(/\s/g, '');
      const comma = raw.lastIndexOf(','), dot = raw.lastIndexOf('.');
      if (comma >= 0 && dot >= 0) raw = comma > dot ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
      else if (comma >= 0) raw = isEn() && /^[1-9]\d{0,2}(,\d{3})+$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
      const v = parseFloat(raw);
      return Number.isFinite(v) ? v : 0;
    },
    money(text) {
      const sign = CURRENCY_SIGNS[shownCurrency()];
      if (!isEn()) return text + NBSP + sign;
      return text.startsWith('−') || text.startsWith('-') ? '−' + sign + text.slice(1) : sign + text;
    },
    shown(usd) { return usd * shownRate(); },
    num(v, digits) {
      return numFormat('num' + digits, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(v)).replace(/ /g, ' ');
    },
    priceDigits(v) {
      const a = Math.abs(v);
      if (a === 0 || !Number.isFinite(a)) return 2;
      if (a >= 10 || Math.abs(a - 1) < .005) return 2;
      const band = (x) => (x >= 10 ? 2 : x >= 1 ? 3 : x >= .1 ? 4 : x >= .01 ? 5 : 6);
      if (a >= .001) return band(Number(a.toFixed(band(a))));
      return Math.min(Math.ceil(-Math.log10(a)) + 3, 12);
    },
    compact(v) {
      if (v === null || v === undefined || !Number.isFinite(Number(v))) return '0';
      const sign = Number(v) < 0 ? '−' : '';
      const a = Math.abs(Number(v));
      if (a < 1e3) {
        const most = a >= 100 ? 0 : a >= 10 ? 1 : 2;
        return sign + numFormat('small' + most, { maximumFractionDigits: most }).format(a).replace(/ /g, ' ');
      }
      const units = [[1e3, 'unit.k'], [1e6, 'unit.m'], [1e9, 'unit.b'], [1e12, 'unit.t']];
      let i = units.length - 1;
      while (i > 0 && a < units[i][0]) i--;
      const round = (x) => (x < 10 ? Math.round(x * 10) / 10 : Math.round(x));
      let n = round(a / units[i][0]);
      if (n >= 1000 && i < units.length - 1) { i++; n = round(a / units[i][0]); }
      return sign + numFormat(n < 10 ? 'unit1' : 'unit0', { maximumFractionDigits: n < 10 ? 1 : 0, useGrouping: false }).format(n) + CK.t(units[i][1]);
    },
    compactUsd(v) {
      return CK.fmt.money(CK.fmt.compact(v === null || v === undefined ? v : CK.fmt.shown(Number(v))));
    },
    price(usd) {
      const v = CK.fmt.shown(usd);
      const a = Math.abs(v);
      if (a > 0 && a < 1e-6) {
        const [mantissa, exp] = a.toExponential(3).split('e');
        const zeros = String(-Number(exp) - 1).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
        return CK.fmt.money(`${v < 0 ? '−' : ''}0${CK.fmt.decimal()}0${zeros}${mantissa.replace('.', '').replace(/0+$/, '')}`);
      }
      const digits = Math.abs(Math.abs(usd) - 1) < .005 ? 2 : CK.fmt.priceDigits(v);
      return CK.fmt.money(CK.fmt.num(v, digits));
    },
    usd(v) { return CK.fmt.money(CK.fmt.num(CK.fmt.shown(v), 2)); },
    signedUsd(v) { return (v >= 0 ? '+' : '−') + CK.fmt.money(CK.fmt.num(Math.abs(CK.fmt.shown(v)), 2)); },
    pctAbs(v) { return CK.fmt.num(Math.abs(v), 2) + (isEn() ? '%' : NBSP + '%'); },
    pct(v) { return (v >= 0 ? '+' : '−') + CK.fmt.pctAbs(v); }
  };
})();
