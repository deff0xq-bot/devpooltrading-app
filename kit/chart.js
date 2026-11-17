(function () {
  'use strict';
  const CK = window.CK;
  const { clamp, fmt } = CK;

  const N = 120;
  const LINE = { stiffness: 280, damping: 33.466 };
  const STAGGER = .14, RAMP = .09;
  const INSET_RIGHT = 14, PAD_Y = 24;
  const TAG_H = 14, TAG_GAP = 6, EDGE = 8;
  const WAIT_AFTER = 150;
  const ROUNDING_ONLY = 2e-5;
  const TAU = Math.PI * 2;
  const BAR_SLOT = 4, BAR_WIDE = 14;
  const BAR_FRAME_WIDE = 28;
  const FRAMES_MS = [1, 24, 24 * 7, 24 * 30, 24 * 365].map((hours) => hours * 3600000);
  const BAR_BODY = .7;
  const LIVE_MAX_GAP = .3;
  const LIVE_MAX_NEW = 16;
  const FULL_FRAME_BARS = 40, LIVE_MAX_BARS = 100;
  const DAY_MS = 864e5;
  const TYPE_KEY = 'ck-chart-type';
  const BAR_K = 7;
  const REVEAL_DELAY = .12, REVEAL_STAGGER = .42, REVEAL_RAMP = .22;
  const FORM = { stiffness: 81, damping: 18 };
  const FORM_WAVE = .45;
  const LINE_W = 2, AREA_TOP = .24;
  const LEVEL_TAG_H = 17, LEVEL_GAP = 3, LEVEL_EDGE = 4, LEVELS_MAX = 4;
  const LEVEL_K = 4;
  const LEVEL_TICK_H = 10;
  const LEVEL_TICKED = new Set(['stop', 'take']);
  const LEVEL_KINDS = new Set(['stop', 'take', 'entry']);
  const LEVEL_QUIET = new Set(['entry', 'stop', 'take']);
  const LEVEL_HIT = 12, LEVEL_TOLD_MS = 2000, TAP_MS = 400;
  const smoothstep = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const settleOf = (k) => smoothstep(k / .5);
  const growOf = (k) => smoothstep((k - .3) / .7);
  const fadeOf = (k) => smoothstep((k - .45) / .5);

  let uid = 0;
  let wantBars = false;
  try { wantBars = localStorage.getItem(TYPE_KEY) === 'candles'; } catch (_) { }
  const liveCharts = new Set();

  const bank = (n) => ({ p: new Float64Array(n), v: new Float64Array(n), g: new Float64Array(n) });
  function integrate(s, spring, dt, eps) {
    const k = spring.stiffness, c = spring.damping;
    const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
    const vEps = eps * 20;
    let moving = false;
    for (let i = 0; i < s.p.length; i++) {
      let p = s.p[i], v = s.v[i];
      const g = s.g[i];
      for (let j = 0; j < steps; j++) {
        v += (k * (g - p) - c * v) * h;
        p += v * h;
      }
      s.p[i] = p;
      s.v[i] = v;
      if (Math.abs(g - p) > eps || Math.abs(v) > vEps) moving = true;
    }
    return moving;
  }
  function settle(s) {
    s.p.set(s.g);
    s.v.fill(0);
  }

  const UNEVEN = 3;
  const clockNow = () => (CK.market && typeof CK.market.serverNow === 'function' ? CK.market.serverNow() : Date.now());
  function byTime(values, times) {
    const n = values.length;
    if (!times || n < 3) return null;
    const gaps = [];
    for (let i = 1; i < n; i++) {
      const gap = times[i] - times[i - 1];
      if (!Number.isFinite(gap) || gap < 0) return null;
      gaps.push(gap);
    }
    const sorted = gaps.slice().sort((a, b) => a - b);
    const typical = Math.max(sorted[(n - 1) >> 1], 1);
    const t0 = times[0], span = times[n - 1] - t0;
    if (!(sorted[n - 2] > UNEVEN * typical) || !(span > 0)) return null;
    const m = Math.min(Math.max(n, N), 4 * N);
    const outV = new Array(m), outT = new Array(m);
    let j = 0;
    for (let i = 0; i < m; i++) {
      const t = i === m - 1 ? times[n - 1] : t0 + (span * i) / (m - 1);
      while (j < n - 2 && times[j + 1] < t) j++;
      const a = times[j], b = times[j + 1];
      if (b - a > UNEVEN * typical) {
        outV[i] = t >= b ? values[j + 1] : values[j];
      } else {
        const f = b > a ? clamp((t - a) / (b - a), 0, 1) : 1;
        outV[i] = values[j] + (values[j + 1] - values[j]) * f;
      }
      outT[i] = t;
    }
    let hiAt = 0, loAt = 0;
    for (let i = 1; i < n; i++) {
      if (values[i] > values[hiAt]) hiAt = i;
      if (values[i] < values[loAt]) loAt = i;
    }
    [hiAt, loAt].forEach((at) => { outV[Math.round(((times[at] - t0) / span) * (m - 1))] = values[at]; });
    outV[0] = values[0];
    outV[m - 1] = values[n - 1];
    return { values: outV, times: outT };
  }

  function parse(points) {
    if (!Array.isArray(points) || !points.length) return null;
    const paired = Array.isArray(points[0]);
    let values = [], times = paired ? [] : null;
    for (let i = 0; i < points.length; i++) {
      const c = Number(paired ? points[i][1] : points[i]);
      if (!Number.isFinite(c)) continue;
      values.push(c);
      if (paired) times.push(points[i][0]);
    }
    const even = byTime(values, times);
    if (even) ({ values, times } = even);
    const n = values.length;
    if (n < 2) return null;
    let hi = -Infinity, lo = Infinity, hiAt = 0, loAt = 0;
    for (let i = 0; i < n; i++) {
      if (values[i] > hi) { hi = values[i]; hiAt = i; }
      if (values[i] < lo) { lo = values[i]; loAt = i; }
    }
    const first = values[0], last = values[n - 1];
    return { values, times, n, hi, lo, hiF: hiAt / (n - 1), loF: loAt / (n - 1), first, last, change: first ? (last / first - 1) * 100 : 0 };
  }

  function parseBars(rows) {
    if (!Array.isArray(rows)) return null;
    const out = [];
    let hi = -Infinity, lo = Infinity;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row) || row.length < 5) continue;
      const [t, o, h, l, c] = row;
      if (!row.slice(0, 5).every(Number.isFinite) || !(o > 0 && h > 0 && l > 0 && c > 0)) continue;
      const bar = { t, o, h: Math.max(h, o, c), l: Math.min(l, o, c), c };
      if (bar.h > hi) hi = bar.h;
      if (bar.l < lo) lo = bar.l;
      out.push(bar);
    }
    if (out.length < 2) return null;
    out.hi = hi;
    out.lo = lo;
    out.step = Infinity;
    for (let i = 1; i < out.length; i++) out.step = Math.min(out.step, out[i].t - out[i - 1].t);
    out.keep = out.length >= FULL_FRAME_BARS ? out.length : LIVE_MAX_BARS;
    return out;
  }
  function pushPrice(rows, price, at) {
    const last = rows[rows.length - 1];
    if (!(price > 0) || Math.abs(price / last.c - 1) > LIVE_MAX_GAP) return null;
    const ahead = Math.floor((at - last.t) / rows.step);
    if (ahead > LIVE_MAX_NEW || (ahead <= 0 && price === last.c)) return null;
    for (let i = 1; i <= ahead; i++) rows.push({ t: last.t + i * rows.step, o: last.c, h: last.c, l: last.c, c: last.c });
    const bar = rows[rows.length - 1];
    bar.c = price;
    if (price > bar.h) bar.h = price;
    if (price < bar.l) bar.l = price;
    if (rows.length > rows.keep) rows.splice(0, rows.length - rows.keep);
    rows.hi = -Infinity;
    rows.lo = Infinity;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].h > rows.hi) rows.hi = rows[i].h;
      if (rows[i].l < rows.lo) rows.lo = rows[i].l;
    }
    return bar;
  }
  const screenScale = () => Math.min(window.devicePixelRatio || 1, 3);
  function coversFrame(rows) {
    const span = rows[rows.length - 1].t - rows[0].t + rows.step;
    return FRAMES_MS.some((frame) => span >= frame * .9 && span <= frame * 1.1);
  }
  function fitBars(rows, plotW) {
    const dpr = screenScale();
    const widthPx = Math.round(plotW * dpr);
    const each = Math.ceil(rows.length / Math.max(2, Math.floor(plotW / BAR_SLOT)));
    const n = Math.ceil(rows.length / each);
    const head = rows.length - (n - 1) * each;
    const list = [];
    let hi = -Infinity, lo = Infinity, hiAt = 0, loAt = 0;
    for (let i = 0; i < n; i++) {
      const a = i ? head + (i - 1) * each : 0, b = head + i * each;
      const bar = { t: rows[a].t, o: rows[a].o, h: rows[a].h, l: rows[a].l, c: rows[b - 1].c };
      for (let j = a + 1; j < b; j++) {
        if (rows[j].h > bar.h) bar.h = rows[j].h;
        if (rows[j].l < bar.l) bar.l = rows[j].l;
      }
      list.push(bar);
      if (bar.h > hi) { hi = bar.h; hiAt = i; }
      if (bar.l < lo) { lo = bar.l; loAt = i; }
    }
    const slotPx = clamp(Math.floor(widthPx / n), 1, Math.round((coversFrame(rows) ? BAR_FRAME_WIDE : BAR_WIDE) * dpr));
    const wickPx = Math.max(1, Math.round(dpr));
    let bodyPx = Math.max(wickPx, Math.round(slotPx * BAR_BODY));
    if ((bodyPx - wickPx) % 2) bodyPx += bodyPx < slotPx - 1 ? 1 : -1;
    const leftPx = widthPx - n * slotPx;
    const fit = { list, n, hi, lo, dpr, leftPx, slotPx, wickPx, bodyPx, stepMs: rows.step * each };
    fit.hiF = barCentre(fit, hiAt) / plotW;
    fit.loF = barCentre(fit, loAt) / plotW;
    return fit;
  }
  const barBodyPx = (fit, i) => fit.leftPx + i * fit.slotPx + ((fit.slotPx - fit.bodyPx) >> 1);
  const barCentre = (fit, i) => (barBodyPx(fit, i) + fit.bodyPx / 2) / fit.dpr;

  function resample(values, out) {
    const n = values.length;
    const smooth = n < N;
    for (let i = 0; i < N; i++) {
      const pos = (i / (N - 1)) * (n - 1);
      const a = Math.min(Math.floor(pos), n - 2), t = pos - a;
      const p1 = values[a], p2 = values[a + 1];
      if (!smooth) { out[i] = p1 + (p2 - p1) * t; continue; }
      const p0 = a > 0 ? values[a - 1] : p1, p3 = a + 2 < n ? values[a + 2] : p2;
      out[i] = p1 + .5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
    }
  }

  function amplitude(s) {
    const rel = (s.hi - s.lo) / (Math.abs(s.hi + s.lo) / 2 || 1);
    if (!(rel > ROUNDING_ONLY)) return 0;
    return clamp(.62 + .38 * (Math.log10(rel) + 3) / 2.7, .62, 1);
  }

  const plainPrice = (v) => fmt.price(v).replace(/[^\d.,\s\u2080-\u2089]/g, '').trim();

  CK.chart = function (host, o) {
    const id = 'chart' + (++uid);
    host.classList.add('chart');
    host.setAttribute('role', 'img');
    host.innerHTML = `
      <div class="chart-plot">
        <canvas class="chart-bars" aria-hidden="true"></canvas>
        <div class="chart-wipe"><div class="chart-wipe-in">
          <svg class="chart-svg chart-fill" aria-hidden="true">
            <defs>
              <linearGradient id="${id}u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="chart-stop chart-stop--up"/><stop offset="1" class="chart-stop chart-stop--up chart-stop--end"/></linearGradient>
              <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="chart-stop chart-stop--down"/><stop offset="1" class="chart-stop chart-stop--down chart-stop--end"/></linearGradient>
            </defs>
            <g class="chart-area-tone chart-tone--up"><path fill="url(#${id}u)"/></g>
            <g class="chart-area-tone chart-tone--down" style="opacity:0"><path fill="url(#${id}d)"/></g>
          </svg>
          <svg class="chart-svg" aria-hidden="true">
            <g class="chart-tone chart-tone--up"><path class="chart-line"/></g>
            <g class="chart-tone chart-tone--down" style="opacity:0"><path class="chart-line"/></g>
          </svg>
        </div></div>
        <div class="chart-levels" aria-hidden="true"></div>
        <i class="chart-end" aria-hidden="true"></i>
        <span class="chart-tag" aria-hidden="true"></span>
        <span class="chart-tag" aria-hidden="true"></span>
      </div>
      <div class="chart-cursor" aria-hidden="true"><i class="chart-cursor-line"></i><i class="chart-cursor-dot"></i></div>
      <span class="chart-ohlc" aria-hidden="true"><span><b>O</b><i></i></span><span><b>H</b><i></i></span><span><b>L</b><i></i></span><span><b>C</b><i></i></span></span>
      <span class="chart-time" aria-hidden="true"></span>
      <span class="chart-note" role="status"></span>`;

    const plot = host.querySelector('.chart-plot');
    const svgs = Array.from(host.querySelectorAll('.chart-svg'));
    const tones = Array.from(host.querySelectorAll('.chart-tone'));
    const areaTones = Array.from(host.querySelectorAll('.chart-area-tone'));
    const paths = tones.map((g, t) => ({ area: areaTones[t].lastElementChild, line: g.lastElementChild }));
    const endDot = host.querySelector('.chart-end');
    const tagEls = Array.from(host.querySelectorAll('.chart-tag'));
    const cursor = host.querySelector('.chart-cursor');
    const cursorDot = host.querySelector('.chart-cursor-dot');
    const timeEl = host.querySelector('.chart-time');
    const noteEl = host.querySelector('.chart-note');
    const canvas = host.querySelector('.chart-bars');
    const ohlcEls = Array.from(host.querySelectorAll('.chart-ohlc i'));
    let barRows = null, bars = null, candleOn = false, backing = '';
    let liveId = null, stopLive = null, lastLive = null;
    let cs = null, csMoving = false, csAt = 0, csEnd = 0, csSpring = LINE, colors = null;
    const form = bank(1);
    let formOn = false, formFromLine = true;

    let series = null, tf = o.tf || null, rough = false;
    let W = 0, H = 0, plotW = 1, span = 1;
    const xPoint = new Array(N), xMid = new Array(N - 1);

    const line = bank(N);
    const goal = new Float64Array(N), from = new Float64Array(N), shaped = new Float64Array(N), px = new Float64Array(N);
    let morphing = false, morphAt = 0;

    const reveal = bank(1);
    let drawn = false, revealAt = 0;
    const mix = bank(1);
    let toneOn = [true, false];

    const tags = bank(4);
    let tagsMoving = false;
    const tagW = [0, 0];
    let hiLevel = 0, loLevel = 1;

    const levelsBox = host.querySelector('.chart-levels');
    let levelList = [], levelKey = '', levelY = bank(0), levelsMoving = false;
    let toldLv = null, toldTimer = 0, pressAt = 0;

    let raf = 0, lastT = 0, dead = false, dirty = false;
    let waiting = false, breath = 1, phase = 0;
    let scrubbing = false, scrubF = 0, lastPx = 0, hostLeft = 0, lastI = -1, timeShape = '', timeW = 0;
    let loadToken = 0, waitTimer = 0;

    const round1 = (v) => Math.round(v * 10) / 10;

    function layout(width, height) {
      W = width;
      H = height;
      plotW = Math.max(1, W - INSET_RIGHT);
      span = Math.max(1, H - PAD_Y * 2);
      svgs.forEach((svg) => {
        svg.setAttribute('width', W);
        svg.setAttribute('height', H);
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      });
      const step = plotW / (N - 1);
      for (let i = 0; i < N; i++) {
        xPoint[i] = String(round1(i * step));
        if (i < N - 1) xMid[i] = String(round1((i + .5) * step));
      }
      if (barRows) bars = fitBars(barRows, plotW);
    }

    function sizeCanvas() {
      const dpr = screenScale();
      const size = `${W}x${H}x${dpr}`;
      if (size === backing) return;
      backing = size;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    }
    function barSet(m) {
      const k = m * BAR_K;
      return {
        n: 0, m, dpr: screenScale(), wickPx: 1,
        p: new Float64Array(k), v: new Float64Array(k), g: new Float64Array(k), from: new Float64Array(k), goal: new Float64Array(k),
        delay: new Float64Array(m), ramp: new Float64Array(m).fill(1), w: new Float64Array(m).fill(1),
        upFrom: new Uint8Array(m), upGoal: new Uint8Array(m), t: new Float64Array(m)
      };
    }
    function restOf(fit, i, out, k) {
      const bar = fit.list[i], o = k * BAR_K;
      const range = fit.hi - fit.lo || 1, mid = (fit.hi + fit.lo) / 2, amp = amplitude(fit);
      const y = (v) => PAD_Y + (.5 - ((v - mid) / range) * amp) * span;
      out[o] = barBodyPx(fit, i);
      out[o + 1] = fit.bodyPx;
      out[o + 2] = y(bar.o);
      out[o + 3] = y(bar.c);
      out[o + 4] = y(bar.h);
      out[o + 5] = y(bar.l);
      out[o + 6] = 1;
    }
    function aimSet(set, fit) {
      set.n = fit.n;
      set.dpr = fit.dpr;
      set.wickPx = fit.wickPx;
      for (let i = 0; i < fit.n; i++) {
        restOf(fit, i, set.goal, i);
        set.t[i] = fit.list[i].t;
        set.upGoal[i] = fit.list[i].c >= fit.list[i].o ? 1 : 0;
      }
    }
    const lineY = (f) => {
      const pos = clamp(f, 0, 1) * (N - 1), a = Math.min(Math.floor(pos), N - 2);
      return PAD_Y + (line.p[a] + (line.p[a + 1] - line.p[a]) * (pos - a)) * span;
    };
    function wave(set, stagger, ramp, delay) {
      csEnd = 0;
      for (let k = 0; k < set.m; k++) {
        const centre = (set.goal[k * BAR_K] + set.goal[k * BAR_K + 1] / 2) / set.dpr;
        set.delay[k] = (delay || 0) + clamp(centre / plotW, 0, 1) * stagger;
        set.ramp[k] = ramp;
        csEnd = Math.max(csEnd, set.delay[k] + ramp);
      }
    }
    function easeBars(t) {
      const s = cs;
      for (let k = 0; k < s.m; k++) {
        let w = (t - s.delay[k]) / s.ramp[k];
        w = w <= 0 ? 0 : w >= 1 ? 1 : w * w * (3 - 2 * w);
        s.w[k] = w;
        for (let j = k * BAR_K, end = j + BAR_K; j < end; j++) s.g[j] = s.from[j] + (s.goal[j] - s.from[j]) * w;
      }
    }
    function startBars(set, spring) {
      cs = set;
      csSpring = spring;
      csAt = performance.now();
      csMoving = true;
      host.classList.add('has-bars');
      easeBars(0);
      wake();
    }
    function snapBars() {
      const set = barSet(bars.n);
      aimSet(set, bars);
      set.p.set(set.goal);
      set.g.set(set.goal);
      set.from.set(set.goal);
      set.upFrom.set(set.upGoal);
      cs = set;
      csMoving = false;
      host.classList.add('has-bars');
      sizeCanvas();
      paintBars();
    }
    function hideBars() {
      cs = null;
      csMoving = false;
      host.classList.remove('has-bars');
    }
    function revealBars() {
      if (CK.reducedMotion()) return snapBars();
      sizeCanvas();
      const set = barSet(bars.n);
      aimSet(set, bars);
      for (let i = 0; i < set.n; i++) {
        const o = i * BAR_K, y = i ? set.goal[o - BAR_K + 3] : set.goal[o + 2];
        set.from.set([set.goal[o], set.goal[o + 1], y, y, y, y, 0], o);
      }
      set.p.set(set.from);
      set.upFrom.set(set.upGoal);
      wave(set, REVEAL_STAGGER, REVEAL_RAMP, REVEAL_DELAY);
      startBars(set, LINE);
    }
    function turnForm(on) {
      const instant = !drawn || !W || CK.reducedMotion() || (!on && !cs);
      if (instant) {
        formOn = false;
        form.p[0] = form.g[0] = on ? 1 : 0;
        form.v[0] = 0;
        host.classList.remove('is-morph');
        host.classList.toggle('is-xfade', drawn && CK.reducedMotion());
        endDot.style.opacity = '';
        if (!on) hideBars();
        else if (drawn && W) snapBars();
        return;
      }
      host.classList.remove('is-xfade');
      if (!formOn) formFromLine = on;
      if (reveal.p[0] < 1) {
        reveal.p[0] = reveal.g[0] = 1;
        reveal.v[0] = 0;
        host.classList.add('is-started', 'is-drawn');
      }
      form.g[0] = on ? 1 : 0;
      form.v[0] = Math.sqrt(FORM.stiffness) * (form.g[0] - form.p[0]);
      formOn = true;
      host.classList.add('is-morph');
      if (on && cs) morphBars(true);
      else if (on) snapBars();
      paintBars();
      wake();
    }
    function endForm() {
      formOn = false;
      settle(form);
      host.classList.remove('is-morph');
      endDot.style.opacity = '';
      if (form.p[0] > .5) return;
      const g = canvas.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      hideBars();
      dirty = true;
    }
    function morphBars(live) {
      if (!cs || CK.reducedMotion()) return snapBars();
      const old = cs, fit = bars, n = fit.n;
      if (csMoving) easeBars((performance.now() - csAt) / 1000);
      const next = barSet(n);
      aimSet(next, fit);
      if (old.n === n && old.dpr === fit.dpr) {
        let same = true;
        for (let i = 0; i < n && same; i++) same = old.t[i] === next.t[i];
        if (same) {
          let still = true;
          for (let j = 0; j < n * BAR_K && still; j++) still = Math.abs(old.goal[j] - next.goal[j]) < .01;
          if (still) return;
          if (csMoving && live) {
            old.goal.set(next.goal);
            old.upGoal.set(next.upGoal);
            return;
          }
        }
      }
      const nOld = old.n, pair = new Int32Array(n).fill(-1);
      const index = new Map();
      for (let j = 0; j < nOld; j++) index.set(old.t[j], j);
      let hits = 0;
      for (let i = 0; i < n; i++) {
        const j = index.get(next.t[i]);
        if (j !== undefined) { pair[i] = j; hits++; }
      }
      if (hits < Math.min(n, nOld) / 2) {
        pair.fill(-1);
        if (n >= nOld) for (let j = 0; j < nOld; j++) pair[nOld === 1 ? n - 1 : Math.round(j * (n - 1) / (nOld - 1))] = j;
        else for (let i = 0; i < n; i++) pair[i] = n === 1 ? nOld - 1 : Math.round(i * (nOld - 1) / (n - 1));
      }
      const taken = new Uint8Array(nOld);
      for (let i = 0; i < n; i++) if (pair[i] >= 0) taken[pair[i]] = 1;
      const leaving = [];
      for (let j = 0; j < nOld; j++) if (!taken[j]) leaving.push(j);
      for (let j = nOld; j < old.m; j++) if (old.p[j * BAR_K + 6] > .01) leaving.push(j);
      const set = barSet(n + leaving.length);
      aimSet(set, fit);
      const colourOf = (j) => (old.w[j] < .5 ? old.upFrom[j] : old.upGoal[j]);
      const take = (k, j) => {
        set.from.set(old.p.subarray(j * BAR_K, j * BAR_K + BAR_K), k * BAR_K);
        set.v.set(old.v.subarray(j * BAR_K, j * BAR_K + BAR_K), k * BAR_K);
        set.upFrom[k] = colourOf(j);
      };
      for (let i = 0; i < n; i++) if (pair[i] >= 0) take(i, pair[i]);
      const after = new Int32Array(n).fill(-1);
      for (let i = n - 1, seen = -1; i >= 0; i--) { after[i] = seen; if (pair[i] >= 0) seen = i; }
      for (let i = 0, before = -1; i < n; i++) {
        if (pair[i] >= 0) { before = i; continue; }
        const o = i * BAR_K, nx = after[i];
        const mid = (k) => set.from[k * BAR_K] + set.from[k * BAR_K + 1] / 2;
        let x = set.goal[o] + set.goal[o + 1] / 2;
        if (before >= 0 && nx >= 0) x = mid(before) + (mid(nx) - mid(before)) * (i - before) / (nx - before);
        x -= set.wickPx / 2;
        const y = i ? set.from[o - BAR_K + 3] : set.goal[o + 2];
        set.from.set([x, set.wickPx, y, y, y, y, 0], o);
        set.upFrom[i] = set.upGoal[i];
      }
      const near = new Int32Array(nOld).fill(-1);
      for (let i = 0; i < n; i++) if (pair[i] >= 0 && pair[i] < nOld) near[pair[i]] = i;
      leaving.forEach((j, l) => {
        const k = n + l, o = k * BAR_K;
        take(k, j);
        if (j >= nOld) {
          set.goal.set(old.goal.subarray(j * BAR_K, j * BAR_K + BAR_K), o);
        } else {
          let d = 1, i = -1;
          while (i < 0 && (j - d >= 0 || j + d < nOld)) {
            if (j - d >= 0 && near[j - d] >= 0) i = near[j - d];
            else if (j + d < nOld && near[j + d] >= 0) i = near[j + d];
            d++;
          }
          const shift = i >= 0 ? set.goal[i * BAR_K] - set.from[i * BAR_K] : 0;
          const y = i >= 0 ? set.goal[i * BAR_K + 3] : set.from[o + 3];
          set.goal.set([set.from[o] + shift + (set.from[o + 1] - set.wickPx) / 2, set.wickPx, y, y, y, y, 0], o);
        }
        set.upGoal[k] = set.upFrom[k];
      });
      set.p.set(set.from);
      if (live) {
        csEnd = 0;
        set.delay.fill(0);
        set.ramp.fill(1e-3);
      } else {
        wave(set, STAGGER, RAMP);
      }
      startBars(set, live ? CK.springs.smooth : LINE);
    }
    function refitBars() {
      if (!cs) return;
      if (csMoving && cs.n === bars.n && cs.dpr === bars.dpr && cs.t[0] === bars.list[0].t && cs.t[cs.n - 1] === bars.list[bars.n - 1].t) {
        sizeCanvas();
        const set = barSet(bars.n);
        aimSet(set, bars);
        cs.goal.set(set.goal.subarray(0, Math.min(cs.goal.length, set.goal.length)));
        return;
      }
      snapBars();
    }

    const formP = { p: new Float64Array(0), x: new Float64Array(0), y: new Float64Array(0), alpha: new Float64Array(0), s: null, sFor: -1, lx: null, ly: null };
    function formStops(n) {
      if (formP.sFor === n) return formP.s;
      const s = [];
      for (let i = 0, k = 0; i < N || k < n;) {
        const a = i < N ? i / (N - 1) : 2, b = k < n ? k / (n - 1) : 2;
        if (Math.abs(a - b) < 1e-9) { s.push(a); i++; k++; } else if (a < b) { s.push(a); i++; } else { s.push(b); k++; }
      }
      formP.s = Float64Array.from(s);
      formP.sFor = n;
      formP.lx = new Float64Array(s.length);
      formP.ly = new Float64Array(s.length);
      return formP.s;
    }
    const stageAt = (x) => clamp(form.p[0] * (1 + FORM_WAVE) - FORM_WAVE * (formFromLine ? x : 1 - x), 0, 1);
    function lineColour(alpha) {
      const c = colors.rgb[host.classList.contains('is-flat') ? 2 : mix.p[0] < .5 ? 0 : 1];
      return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] * alpha).toFixed(3)})`;
    }
    function shapeForm(g) {
      const s = cs, p = s.p, dpr = s.dpr, n = s.n, m = s.m;
      if (formP.p.length < m * BAR_K) formP.p = new Float64Array(m * BAR_K);
      if (formP.x.length < m) {
        formP.x = new Float64Array(m);
        formP.y = new Float64Array(m);
        formP.alpha = new Float64Array(m);
      }
      const kx = formP.x, ky = formP.y, q = formP.p;
      for (let k = 0; k < m; k++) {
        kx[k] = (p[k * BAR_K] + p[k * BAR_K + 1] / 2) / dpr;
        ky[k] = p[k * BAR_K + 3];
      }
      const fx = smoothstep(form.p[0]), x0 = kx[0], wide = kx[n - 1] - x0 || 1;
      const stops = formStops(n), lx = formP.lx, ly = formP.ly;
      for (let j = 0; j < stops.length; j++) {
        const at = stops[j], pos = at * (n - 1), a = Math.min(Math.floor(pos), n - 2), t = pos - a;
        const tx = kx[a] + (kx[a + 1] - kx[a]) * t, ty = ky[a] + (ky[a + 1] - ky[a]) * t;
        const sx = at * plotW, sy = lineY(at);
        lx[j] = sx + (tx - sx) * fx;
        ly[j] = sy + (ty - sy) * settleOf(stageAt(tx / plotW));
      }
      for (let k = 0; k < m; k++) {
        const o = k * BAR_K, at = clamp((kx[k] - x0) / wide, 0, 1), stage = stageAt(kx[k] / plotW);
        const sx = at * plotW, sy = lineY(at), grow = growOf(stage);
        const x = sx + (kx[k] - sx) * fx, y = sy + (ky[k] - sy) * settleOf(stage);
        const w = s.wickPx + (p[o + 1] - s.wickPx) * grow;
        q[o] = x * dpr - w / 2;
        q[o + 1] = w;
        q[o + 2] = y + (p[o + 2] - ky[k]) * grow;
        q[o + 3] = y;
        q[o + 4] = y + (p[o + 4] - ky[k]) * grow;
        q[o + 5] = y + (p[o + 5] - ky[k]) * grow;
        q[o + 6] = grow > .001 ? p[o + 6] : 0;
        formP.alpha[k] = 1 - fadeOf(stage);
        kx[k] = x;
      }
      const areaAlpha = 1 - smoothstep(form.p[0] / .5);
      if (areaAlpha > .002) {
        let top = H;
        for (let j = 0; j < stops.length; j++) top = Math.min(top, ly[j]);
        const last = stops.length - 1, areaX = (lx[last] / plotW) * W;
        const fill = g.createLinearGradient(0, top, 0, H);
        fill.addColorStop(0, lineColour(AREA_TOP));
        fill.addColorStop(1, lineColour(0));
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.globalAlpha = areaAlpha;
        g.fillStyle = fill;
        g.beginPath();
        traceCurve(g, lx, ly, stops.length);
        g.lineTo(areaX, ly[last]);
        g.lineTo(areaX, H);
        g.lineTo(0, H);
        g.closePath();
        g.fill();
        g.globalAlpha = 1;
        g.setTransform(1, 0, 0, 1, 0, 0);
      }
      return q;
    }
    function traceCurve(g, xs, ys, count) {
      g.moveTo(xs[0], ys[0]);
      for (let j = 1; j < count; j++) {
        const mx = (xs[j - 1] + xs[j]) / 2, my = (ys[j - 1] + ys[j]) / 2;
        if (j === 1) g.lineTo(mx, my);
        else g.quadraticCurveTo(xs[j - 1], ys[j - 1], mx, my);
      }
      g.quadraticCurveTo(xs[count - 1], ys[count - 1], xs[count - 1], ys[count - 1]);
    }
    function paintFormLine(g) {
      const n = cs.n, dpr = cs.dpr, kx = formP.x, alpha = formP.alpha, lx = formP.lx, ly = formP.ly, count = formP.s.length;
      let lo = 1, hi = 0;
      for (let k = 0; k < n; k++) {
        lo = Math.min(lo, alpha[k]);
        hi = Math.max(hi, alpha[k]);
      }
      endDot.style.transform = `translate3d(${lx[count - 1].toFixed(2)}px,${ly[count - 1].toFixed(2)}px,0)`;
      endDot.style.opacity = alpha[n - 1].toFixed(3);
      if (hi < .002) return;
      let stroke;
      if (lo > .998) {
        stroke = lineColour(1);
      } else {
        stroke = g.createLinearGradient(0, 0, W, 0);
        for (let k = 0, last = 0; k < n; k++) {
          last = Math.max(last, clamp(kx[k] / W, 0, 1));
          stroke.addColorStop(last, lineColour(alpha[k]));
        }
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.strokeStyle = stroke;
      g.lineWidth = LINE_W;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      traceCurve(g, lx, ly, count);
      g.stroke();
      g.setTransform(1, 0, 0, 1, 0, 0);
    }

    function paintBars() {
      if (!cs || !W) return;
      if (cs.dpr !== screenScale() && bars && candleOn && !formOn) {
        bars = fitBars(barRows, plotW);
        return snapBars();
      }
      const g = canvas.getContext('2d');
      if (!colors) {
        const style = getComputedStyle(host);
        colors = ['--green', '--red', '--hint'].map((name) => style.getPropertyValue(name).trim());
        colors.rgb = colors.map((c) => {
          g.fillStyle = '#000';
          g.fillStyle = c;
          const v = String(g.fillStyle);
          if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16)).concat(1);
          const parts = v.match(/[\d.]+/g).map(Number);
          return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
        });
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      const s = cs, dpr = s.dpr, wickPx = s.wickPx;
      const p = formOn && s.n > 1 ? shapeForm(g) : s.p;
      const trace = (k) => {
        const o = k * BAR_K;
        const bodyW = Math.max(wickPx, Math.round(p[o + 1]));
        const bodyX = Math.round(p[o] + (p[o + 1] - bodyW) / 2);
        const yo = Math.round(p[o + 2] * dpr), yc = Math.round(p[o + 3] * dpr);
        const top = Math.min(yo, yc), bottom = Math.max(yo, yc);
        const wickTop = Math.min(Math.round(p[o + 4] * dpr), top), wickBottom = Math.max(Math.round(p[o + 5] * dpr), bottom);
        g.rect(bodyX + ((bodyW - wickPx) >> 1), wickTop, wickPx, Math.max(wickPx, wickBottom - wickTop));
        g.rect(bodyX, top, bodyW, Math.max(wickPx, bottom - top));
      };
      for (let side = 0; side < 2; side++) {
        const want = side === 0 ? 1 : 0;
        let faint = false;
        g.beginPath();
        for (let k = 0; k < s.m; k++) {
          if ((s.w[k] < .5 ? s.upFrom[k] : s.upGoal[k]) !== want) continue;
          if (p[k * BAR_K + 6] < .995) { faint = true; continue; }
          trace(k);
        }
        g.fillStyle = colors[side];
        g.fill();
        if (!faint) continue;
        for (let k = 0; k < s.m; k++) {
          const a = p[k * BAR_K + 6];
          if (a >= .995 || a < .01 || (s.w[k] < .5 ? s.upFrom[k] : s.upGoal[k]) !== want) continue;
          g.globalAlpha = a;
          g.beginPath();
          trace(k);
          g.fill();
        }
        g.globalAlpha = 1;
      }
      if (p !== s.p) paintFormLine(g);
    }
    function endBars() {
      csMoving = false;
      const s = cs, n = s.n, k = n * BAR_K;
      ['p', 'v', 'g', 'from', 'goal'].forEach((key) => { s[key] = s[key].subarray(0, k); });
      ['delay', 'ramp', 'w', 'upFrom', 'upGoal', 't'].forEach((key) => { s[key] = s[key].subarray(0, n); });
      s.m = n;
      s.p.set(s.goal);
      s.g.set(s.goal);
      s.v.fill(0);
      s.w.fill(1);
      s.upFrom.set(s.upGoal);
    }
    let heldLine = null;
    function tickLine(price, at) {
      if (!series || rough || !series.times || !(price > 0)) return;
      if (scrubbing) {
        heldLine = { price, at };
        return;
      }
      const n = series.n, times = series.times, values = series.values;
      const lastT = times[n - 1], lastV = values[n - 1];
      if (Math.abs(price / lastV - 1) > LIVE_MAX_GAP) return;
      const step = barRows ? barRows.step : (lastT - times[0]) / (n - 1);
      if (!(step > 0)) return;
      const ahead = Math.floor((at - lastT) / step);
      if (ahead > LIVE_MAX_NEW || (ahead <= 0 && price === lastV)) return;
      const points = new Array(n);
      for (let i = 0; i < n; i++) points[i] = [times[i], values[i]];
      if (ahead <= 0) {
        points[n - 1] = [lastT, price];
      } else {
        for (let i = 1; i <= ahead; i++) points.push([lastT + i * step, i === ahead ? price : lastV]);
        const span = lastT - times[0];
        if (FRAMES_MS.some((frame) => span >= frame * .9 && span <= frame * 1.1)) points.splice(0, ahead);
        else if (points.length > LIVE_MAX_BARS * 4) points.splice(0, points.length - LIVE_MAX_BARS * 4);
      }
      const was = series, next = parse(points);
      if (!next) return;
      series = next;
      resample(series.values, shaped);
      const amp = amplitude(series), range = series.hi - series.lo || 1, mid = (series.hi + series.lo) / 2;
      for (let i = 0; i < N; i++) goal[i] = .5 - ((shaped[i] - mid) / range) * amp;
      hiLevel = .5 - amp / 2;
      loLevel = .5 + amp / 2;
      const up = series.last >= series.first;
      if (up !== (was.last >= was.first)) {
        host.classList.toggle('is-up', up);
        host.classList.toggle('is-down', !up);
        mix.g[0] = up ? 0 : 1;
      }
      host.classList.toggle('is-flat', CK.changeFlat(series.change));
      if (!barRows && (was.hi !== series.hi || was.lo !== series.lo)) paintBounds();
      if ((candleOn && !formOn) || !drawn || CK.reducedMotion()) {
        line.p.set(goal);
        line.g.set(goal);
        line.v.fill(0);
        if (!candleOn && drawn) paint();
      } else {
        const done = (STAGGER + RAMP) * 1000;
        if (!morphing || performance.now() - morphAt > done) {
          from.set(goal);
          morphAt = performance.now() - done;
        }
        morphing = true;
      }
      if (!candleOn && (was.hiF !== series.hiF || was.loF !== series.loF || was.hi !== series.hi || was.lo !== series.lo)) aimTags(false);
      wake();
    }
    let pulseAt = 0, pulseB = false;
    function pulseEnd() {
      const now = performance.now();
      if (candleOn || CK.reducedMotion() || now - pulseAt < 2400) return;
      pulseAt = now;
      pulseB = !pulseB;
      endDot.classList.toggle('is-pulse-a', !pulseB);
      endDot.classList.toggle('is-pulse-b', pulseB);
    }
    function tickBars(price) {
      const at = clockNow();
      const moved = !!lastLive && lastLive.price !== price;
      lastLive = { price, at };
      tickLine(price, at);
      if (moved) pulseEnd();
      if (!barRows || rough || !pushPrice(barRows, price, at) || !W) return;
      const was = bars;
      bars = fitBars(barRows, plotW);
      if (!candleOn) {
        if (!was || was.hi !== bars.hi || was.lo !== bars.lo) paintBounds();
        return;
      }
      morphBars(true);
      if (!was || was.hi !== bars.hi || was.lo !== bars.lo) {
        paintBounds();
        aimLevels(false);
      }
      if (!was || was.hiF !== bars.hiF || was.loF !== bars.loF) {
        aimTags(false);
        wake();
      }
      if (!scrubbing) return;
      if (!was || was.n !== bars.n || was.list[0].t !== bars.list[0].t) {
        lastI = -1;
        emit(lastPx);
      } else if (lastI === bars.n - 1) {
        paintOhlc(bars.list[lastI]);
        if (o.onScrub) o.onScrub(bars.list[lastI].c, lastI, bars.n, bars.list[lastI].t);
      }
    }
    function followLive(id) {
      if (id === liveId || !CK.market || !CK.market.onLive) return;
      if (stopLive) stopLive();
      liveId = id;
      lastLive = null;
      stopLive = CK.market.onLive(id, tickBars);
    }
    function syncType(fresh, live) {
      const on = wantBars && !!bars && !rough;
      if (on === candleOn) {
        if (on && drawn) {
          if (fresh) morphBars(!!live);
          else refitBars();
        }
      } else {
        candleOn = on;
        host.classList.toggle('is-candles', on);
        if (!on && drawn && W) paint();
        turnForm(on);
        paintBounds();
        aimTags(!drawn || CK.reducedMotion());
        wake();
        if (scrubbing) {
          lastI = -1;
          emit(lastPx);
        }
      }
      if (typeBtn) {
        const none = !!series && !rough && !bars;
        paintTypeBtn(wantBars && !none);
        if (bars) typeKept = true;
        typeBox.classList.toggle('is-kept', typeKept);
        typeBox.classList.toggle('is-off', typeKept ? none : !bars);
      }
    }
    let typeBtn = null, typeBox = null, typeKept = false, typeShows = null;
    const say = (key, fallback) => () => { const v = CK.t(key); return v === key ? fallback : v; };
    function paintTypeBtn(candles) {
      if (typeShows === candles) return;
      typeShows = candles;
      typeBtn.innerHTML = CK.icon(candles ? 'chart-line' : 'chart-candles', { size: 20 });
      typeBtn.setAttribute('aria-label', (candles ? say('chart.line', 'Линия') : say('chart.candles', 'Свечи'))());
    }
    if (o.typeHome) {
      o.typeHome.classList.add('chart-type-home');
      typeBox = CK.el('<div class="chart-type is-off"><button class="chart-type-btn press" type="button"></button></div>');
      o.typeHome.appendChild(typeBox);
      typeBtn = typeBox.firstElementChild;
      requestAnimationFrame(() => requestAnimationFrame(() => { if (typeBox) typeBox.classList.add('is-live'); }));
      paintTypeBtn(wantBars);
      typeBtn.addEventListener('click', () => {
        CK.haptic.selection();
        CK.chart.setType(!wantBars);
      });
      CK.i18n.bind(typeBox, () => { const was = typeShows; typeShows = null; paintTypeBtn(was); });
    }
    const instance = { syncType, repaint() { colors = null; paintBars(); } };
    liveCharts.add(instance);

    function paint() {
      const head = clamp(reveal.p[0], 0, 1) * (N - 1);
      const full = Math.floor(head);
      for (let i = 0; i <= Math.min(full + 1, N - 1); i++) px[i] = PAD_Y + line.p[i] * span;
      let d = 'M0 ' + round1(px[0]);
      for (let i = 1; i <= full; i++) {
        const mid = xMid[i - 1] + ' ' + round1((px[i - 1] + px[i]) / 2);
        d += i === 1 ? 'L' + mid : 'Q' + xPoint[i - 1] + ' ' + round1(px[i - 1]) + ' ' + mid;
      }
      let headX, headY;
      if (full >= N - 1) {
        headX = plotW;
        headY = px[N - 1];
      } else {
        const f = head - full;
        headX = (head / (N - 1)) * plotW;
        headY = px[full] + (px[full + 1] - px[full]) * f;
      }
      if (full >= 1) d += 'Q' + xPoint[full] + ' ' + round1(px[full]) + ' ';
      else d += 'L';
      d += round1(headX) + ' ' + round1(headY);
      const areaX = round1((headX / plotW) * W);
      const area = d + 'L' + areaX + ' ' + round1(headY) + 'L' + areaX + ' ' + H + 'L0 ' + H + 'Z';
      const areaAlpha = reveal.p[0] < 1 ? clamp(reveal.p[0], 0, 1) ** 2 : 1;
      for (let t = 0; t < 2; t++) {
        if (!toneOn[t]) continue;
        paths[t].line.setAttribute('d', d);
        paths[t].area.setAttribute('d', area);
        paths[t].area.setAttribute('opacity', areaAlpha.toFixed(3));
      }
      endDot.style.transform = `translate3d(${headX.toFixed(2)}px,${headY.toFixed(2)}px,0)`;
    }

    function paintMix() {
      const m = clamp(mix.p[0], 0, 1);
      const up = Math.cos(m * Math.PI / 2), down = Math.sin(m * Math.PI / 2);
      toneOn = [m < .999, m > .001];
      [tones, areaTones].forEach((groups) => {
        groups[0].style.opacity = up.toFixed(3);
        groups[1].style.opacity = down.toFixed(3);
      });
    }

    function aimTags(snap) {
      if (!series || !W) return;
      tagW[0] = tagEls[0].offsetWidth;
      tagW[1] = tagEls[1].offsetWidth;
      const mark = candleOn ? bars : series;
      const amp = candleOn ? amplitude(bars) : 0;
      tags.g[0] = clamp(mark.hiF * plotW - tagW[0] / 2, EDGE, Math.max(EDGE, W - tagW[0] - EDGE));
      tags.g[1] = PAD_Y + (candleOn ? .5 - amp / 2 : hiLevel) * span - TAG_GAP - TAG_H;
      tags.g[2] = clamp(mark.loF * plotW - tagW[1] / 2, EDGE, Math.max(EDGE, W - tagW[1] - EDGE));
      tags.g[3] = PAD_Y + (candleOn ? .5 + amp / 2 : loLevel) * span + TAG_GAP;
      if (snap) {
        settle(tags);
        tagsMoving = false;
        paintTags();
      } else {
        tagsMoving = true;
      }
      aimLevels(snap);
    }
    function paintTags() {
      for (let t = 0; t < 2; t++) {
        const x = tags.p[t * 2], y = tags.p[t * 2 + 1];
        tagEls[t].style.transform = tagsMoving
          ? `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`
          : `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
      }
    }

    function levelF(price) {
      const fit = candleOn && bars ? bars : series;
      const amp = amplitude(fit), range = fit.hi - fit.lo || 1, mid = (fit.hi + fit.lo) / 2;
      if (amp > 0) return .5 - ((price - mid) / range) * amp;
      if (Math.abs(price / mid - 1) <= ROUNDING_ONLY) return .5;
      return price > mid ? -Infinity : Infinity;
    }
    function aimLevels(snap) {
      if (!levelList.length || !series || !W) return;
      const top = LEVEL_EDGE + LEVEL_TAG_H / 2, bottom = H - LEVEL_EDGE - LEVEL_TAG_H / 2;
      const order = [], quiet = [];
      let placed = false;
      levelList.forEach((lv, i) => {
        const y = PAD_Y + levelF(lv.price) * span;
        const place = y < LEVEL_EDGE ? 'above' : y > H - LEVEL_EDGE ? 'below' : 'in';
        if (place !== lv.place) {
          lv.place = place;
          lv.el.classList.toggle('is-above', place === 'above');
          lv.el.classList.toggle('is-below', place === 'below');
          lv.w = 0;
          lv.tickW = 0;
          placed = true;
        }
        levelY.g[i * LEVEL_K] = clamp(y, 0, H);
        (lv.quiet ? quiet : order).push({ i, y: clamp(y, top, bottom) });
      });
      order.sort((a, b) => a.y - b.y);
      for (let k = 1; k < order.length; k++) order[k].y = Math.max(order[k].y, order[k - 1].y + LEVEL_TAG_H + LEVEL_GAP);
      for (let k = order.length - 1; k >= 0; k--) order[k].y = Math.min(order[k].y, k === order.length - 1 ? bottom : order[k + 1].y - LEVEL_TAG_H - LEVEL_GAP);
      const marks = [0, 1].filter((t) => !(t === 1 && tagEls[1].style.visibility === 'hidden'))
        .map((t) => ({ x0: tags.g[t * 2], x1: tags.g[t * 2] + tagW[t], y0: tags.g[t * 2 + 1], y1: tags.g[t * 2 + 1] + TAG_H }));
      const slide = (tag) => {
        const lv = levelList[tag.i];
        if (!lv.w) {
          lv.w = lv.tag.offsetWidth;
          lv.left = lv.tag.offsetLeft || 0;
        }
        let shift = 0;
        const y0 = tag.y - LEVEL_TAG_H / 2, y1 = tag.y + LEVEL_TAG_H / 2;
        marks.forEach((m) => {
          const x0 = lv.left + shift;
          if (y1 <= m.y0 - 2 || y0 >= m.y1 + 2 || x0 + lv.w <= m.x0 - TAG_GAP || x0 >= m.x1 + TAG_GAP) return;
          const right = m.x1 + TAG_GAP - lv.left, left = m.x0 - TAG_GAP - lv.w - lv.left;
          if (lv.left + right + lv.w <= W - EDGE) shift = right;
          else if (lv.left + left >= 0) shift = left;
        });
        levelY.g[tag.i * LEVEL_K + 1] = tag.y;
        levelY.g[tag.i * LEVEL_K + 2] = shift;
        return { x0: lv.left + shift, x1: lv.left + shift + lv.w, y0, y1 };
      };
      const tickRight = { above: Infinity, below: Infinity };
      for (let i = levelList.length - 1; i >= 0; i--) {
        const lv = levelList[i];
        if (!lv.ticked || lv.place === 'in') continue;
        if (!lv.tickW) {
          lv.tickW = lv.tick.offsetWidth;
          lv.tickLeft = lv.tick.offsetLeft || 0;
        }
        const y0 = lv.place === 'above' ? LEVEL_EDGE : H - LEVEL_EDGE - LEVEL_TICK_H, y1 = y0 + LEVEL_TICK_H;
        let x1 = Math.min(lv.tickLeft + lv.tickW, tickRight[lv.place]);
        marks.slice().sort((a, b) => b.x0 - a.x0).forEach((m) => {
          if (y1 <= m.y0 - 2 || y0 >= m.y1 + 2 || x1 - lv.tickW >= m.x1 + TAG_GAP || x1 <= m.x0 - TAG_GAP) return;
          x1 = m.x0 - TAG_GAP;
        });
        tickRight[lv.place] = x1 - lv.tickW - LEVEL_GAP * 2;
        levelY.g[i * LEVEL_K + 3] = Math.max(-lv.tickLeft, x1 - lv.tickW - lv.tickLeft);
      }
      const shown = order.map(slide);
      if (quiet.length) {
        marks.push(...shown);
        quiet.forEach(slide);
      }
      if (placed) paintAria();
      if (snap || CK.reducedMotion()) {
        settle(levelY);
        levelsMoving = false;
        paintLevels();
        return;
      }
      let far = false;
      for (let j = 0; j < levelY.p.length && !far; j++) far = Math.abs(levelY.g[j] - levelY.p[j]) > .1;
      if (!far) return;
      levelsMoving = true;
      wake();
    }
    function tickYOf(y) { return clamp(y - LEVEL_TICK_H / 2, LEVEL_EDGE, H - LEVEL_EDGE - LEVEL_TICK_H); }
    function paintLevels() {
      for (let i = 0; i < levelList.length; i++) {
        const lv = levelList[i], o = i * LEVEL_K;
        const y = levelY.p[o], tagY = levelY.p[o + 1] - LEVEL_TAG_H / 2, tagX = levelY.p[o + 2];
        lv.line.style.transform = levelsMoving ? `translate3d(0,${y.toFixed(2)}px,0)` : `translate3d(0,${Math.round(y)}px,0)`;
        lv.tag.style.transform = levelsMoving ? `translate3d(${tagX.toFixed(2)}px,${tagY.toFixed(2)}px,0)` : `translate3d(${Math.round(tagX)}px,${Math.round(tagY)}px,0)`;
        if (!lv.ticked) continue;
        const tickY = tickYOf(y), tickX = levelY.p[o + 3];
        lv.tick.style.transform = levelsMoving ? `translate3d(${tickX.toFixed(2)}px,${tickY.toFixed(2)}px,0)` : `translate3d(${Math.round(tickX)}px,${Math.round(tickY)}px,0)`;
      }
    }
    function setLevels(list) {
      const next = (Array.isArray(list) ? list : [])
        .filter((lv) => lv && Number.isFinite(lv.price) && lv.price > 0)
        .slice(0, LEVELS_MAX)
        .map((lv) => ({ price: lv.price, kind: LEVEL_KINDS.has(lv.kind) ? lv.kind : 'entry', label: String(lv.label || '') }));
      const key = next.map((lv) => `${lv.kind}|${lv.price}|${lv.label}`).join('~');
      if (key === levelKey) return;
      levelKey = key;
      const same = next.map((lv) => lv.kind).join() === levelList.map((lv) => lv.kind).join();
      if (!same) {
        untell();
        levelList.forEach((lv) => lv.el.remove());
        levelList = next.map((lv) => {
          const arrow = `<span class="chart-level-arrow">${CK.icon('arrow-up', { size: 10 })}</span>`;
          const el = CK.el(`<div class="chart-level"><i class="chart-level-line"></i><i class="chart-level-tick"><i class="chart-level-dash"></i>${arrow}</i><span class="chart-level-tag">${arrow}<span class="chart-level-text"></span></span></div>`);
          el.dataset.kind = lv.kind;
          const quiet = LEVEL_QUIET.has(lv.kind), ticked = LEVEL_TICKED.has(lv.kind);
          if (quiet) el.classList.add('is-quiet');
          levelsBox.appendChild(el);
          return { el, line: el.firstElementChild, tick: el.querySelector('.chart-level-tick'), tag: el.lastElementChild, text: el.querySelector('.chart-level-text'), place: 'in', kind: lv.kind, quiet, ticked, price: 0, label: '', w: 0, left: 0, tickW: 0, tickLeft: 0 };
        });
        levelY = bank(levelList.length * LEVEL_K);
        levelsMoving = false;
      }
      next.forEach((lv, i) => {
        const shown = levelList[i];
        shown.price = lv.price;
        shown.label = lv.label;
        if (shown.text.textContent !== lv.label) {
          shown.text.textContent = lv.label;
          shown.w = 0;
        }
      });
      aimLevels(!same || !drawn);
      paintAria();
    }
    function untell() {
      clearTimeout(toldTimer);
      if (toldLv) toldLv.el.classList.remove('is-told');
      toldLv = null;
    }
    function tell(lv) {
      untell();
      toldLv = lv;
      lv.el.classList.add('is-told');
      toldTimer = setTimeout(untell, LEVEL_TOLD_MS);
    }
    function crossLevels(from, to) {
      if (!drawn || rough || !levelList.length || !(from > 0) || !(to > 0) || from === to) return;
      const lo = Math.min(from, to), hi = Math.max(from, to);
      let near = null;
      levelList.forEach((lv) => {
        if (!lv.quiet || lv.place !== 'in' || lv.price < lo || lv.price > hi) return;
        if (!near || Math.abs(lv.price - to) < Math.abs(near.price - to)) near = lv;
      });
      if (near && near !== toldLv) tell(near);
    }
    function tapLevels(clientY) {
      if (!drawn || rough || !levelList.some((lv) => lv.quiet)) return;
      const y = clientY - host.getBoundingClientRect().top;
      let near = null, best = LEVEL_HIT;
      levelList.forEach((lv, i) => {
        const at = levelY.p[i * LEVEL_K];
        const d = Math.abs((lv.ticked && lv.place !== 'in' ? tickYOf(at) + LEVEL_TICK_H / 2 : at) - y);
        if (lv.quiet && d <= best) {
          best = d;
          near = lv;
        }
      });
      if (!near || near === toldLv) {
        untell();
        return;
      }
      tell(near);
      CK.haptic.selection();
    }

    function ease(t) {
      for (let i = 0; i < N; i++) {
        let w = (t - (i / (N - 1)) * STAGGER) / RAMP;
        w = w <= 0 ? 0 : w >= 1 ? 1 : w * w * (3 - 2 * w);
        line.g[i] = from[i] + (goal[i] - from[i]) * w;
      }
    }

    function wake() {
      if (raf || dead) return;
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function frame(now) {
      raf = 0;
      if (dead) return;
      const dt = clamp((now - lastT) / 1000, 0, .064);
      lastT = now;
      let busy = false;

      if (drawn && reveal.p[0] < 1 && now >= revealAt) {
        host.classList.add('is-started');
        reveal.g[0] = 1;
        if (integrate(reveal, CK.springs.glide, dt, .002)) busy = true;
        else settle(reveal);
        if (reveal.p[0] > .68) host.classList.add('is-drawn');
        dirty = true;
      } else if (drawn && reveal.p[0] < 1) {
        busy = true;
      }

      if (morphing) {
        const t = (now - morphAt) / 1000;
        ease(t);
        const moving = integrate(line, LINE, dt, .0008);
        if (moving || t < STAGGER + RAMP) {
          busy = true;
        } else {
          settle(line);
          morphing = false;
        }
        dirty = true;
      }

      if (mix.p[0] !== mix.g[0]) {
        if (integrate(mix, CK.springs.smooth, dt, .002)) busy = true;
        else settle(mix);
        paintMix();
        dirty = true;
      }

      let barsMoved = false;
      if (csMoving) {
        const t = (now - csAt) / 1000;
        easeBars(t);
        if (integrate(cs, csSpring, dt, .02) || t < csEnd) busy = true;
        else endBars();
        barsMoved = true;
      }

      if (formOn) {
        if (integrate(form, FORM, dt, .003)) busy = true;
        else endForm();
        barsMoved = true;
      }

      if (tagsMoving) {
        if (integrate(tags, CK.springs.smooth, dt, .1)) {
          busy = true;
        } else {
          settle(tags);
          tagsMoving = false;
        }
        paintTags();
      }

      if (levelsMoving) {
        if (integrate(levelY, CK.springs.smooth, dt, .1)) {
          busy = true;
        } else {
          settle(levelY);
          levelsMoving = false;
        }
        paintLevels();
      }

      if (waiting || breath < 1) {
        if (waiting) {
          phase += dt * TAU / 1.5;
          breath = .74 + .26 * Math.cos(phase);
          busy = true;
        } else {
          phase = 0;
          breath = Math.min(1, breath + dt * 3.2);
          if (breath < 1) busy = true;
        }
        plot.style.opacity = breath < 1 ? breath.toFixed(3) : '';
      }

      if (dirty) {
        dirty = false;
        if (!candleOn) {
          paint();
          if (scrubbing) placeCursorDot();
        }
      }
      if (cs && barsMoved) paintBars();
      if (busy) raf = requestAnimationFrame(frame);
    }

    const SPRUNG_MS = 560;
    let sprungTimer = 0;
    function startDrawing() {
      drawn = true;
      const sprung = !candleOn && !CK.reducedMotion() && !!CK.motion && typeof CK.motion.chart === 'function';
      if (sprung) {
        reveal.p[0] = reveal.g[0] = 1;
        host.classList.add('is-started', 'is-springing');
        clearTimeout(sprungTimer);
        sprungTimer = setTimeout(() => host.classList.replace('is-springing', 'is-drawn'), SPRUNG_MS);
      } else if (CK.reducedMotion() || candleOn) {
        reveal.p[0] = reveal.g[0] = 1;
        host.classList.add('is-started', 'is-drawn');
      } else {
        reveal.p[0] = 0;
        revealAt = performance.now() + 120;
      }
      aimTags(true);
      paint();
      if (candleOn) revealBars();
      if (sprung) CK.motion.chart(host, { force: true, width: W });
      wake();
    }

    let boundsAria = null;
    function paintAria() {
      if (!boundsAria) return;
      const words = [CK.t('chart.aria', boundsAria)];
      levelList.forEach((lv) => words.push(lv.place === 'in' ? lv.label : CK.t(lv.place === 'above' ? 'chart.levelAbove' : 'chart.levelBelow', { label: lv.label })));
      host.setAttribute('aria-label', words.join('. '));
    }
    function paintBounds() {
      const hi = barRows ? barRows.hi : series.hi, lo = barRows ? barRows.lo : series.lo;
      boundsAria = { hi: fmt.price(hi), lo: fmt.price(lo) };
      paintAria();
      CK.roll(tagEls[0], fmt.price(hi));
      CK.roll(tagEls[1], fmt.price(lo));
      tagEls[1].style.visibility = fmt.price(hi) === fmt.price(lo) ? 'hidden' : '';
    }
    let failure = null;
    const noteText = () => CK.i18n.text((failure && failure.note) || o.emptyText) || CK.t('chart.noData');
    CK.i18n.bind(host, () => {
      if (series) paintBounds();
      noteEl.textContent = noteText();
    });
    noteEl.textContent = noteText();

    function setSeries(points, animate, meta) {
      const next = parse(points);
      if (!next) return false;
      const sameFrame = !!(series && drawn && !rough && !(meta && meta.rough) && (!meta || !meta.tf || meta.tf === tf));
      setPending(false);
      series = next;
      heldLine = null;
      if (meta && meta.tf) tf = meta.tf;
      rough = !!(meta && meta.rough);
      barRows = parseBars(meta && meta.candles);
      if (barRows && series.times) pushPrice(barRows, series.last, series.times[series.n - 1]);
      if (barRows && lastLive) pushPrice(barRows, lastLive.price, lastLive.at);
      bars = barRows && W ? fitBars(barRows, plotW) : null;
      host.classList.toggle('is-rough', rough);
      resample(series.values, shaped);
      const amp = amplitude(series);
      const range = series.hi - series.lo || 1;
      const mid = (series.hi + series.lo) / 2;
      for (let i = 0; i < N; i++) goal[i] = .5 - ((shaped[i] - mid) / range) * amp;
      hiLevel = .5 - amp / 2;
      loLevel = .5 + amp / 2;

      const up = series.last >= series.first;
      host.classList.toggle('is-up', up);
      host.classList.toggle('is-down', !up);
      host.classList.toggle('is-flat', CK.changeFlat(series.change));
      paintBounds();

      const wasCandles = candleOn;
      if (wasCandles) {
        morphing = false;
        line.p.set(goal);
        line.g.set(goal);
        line.v.fill(0);
      }
      syncType(true, sameFrame);
      const smooth = animate !== false && drawn && !CK.reducedMotion() && !candleOn && !wasCandles;
      mix.g[0] = up ? 0 : 1;
      if (smooth && sameFrame) {
        const now = performance.now(), done = (STAGGER + RAMP) * 1000;
        if (!morphing || now - morphAt > done) {
          from.set(goal);
          morphAt = now - done;
        }
        morphing = true;
        aimTags(false);
        wake();
      } else if (smooth) {
        const now = performance.now();
        if (morphing) {
          ease((now - morphAt) / 1000);
          from.set(line.g);
        } else {
          from.set(line.p);
          line.g.set(line.p);
        }
        morphAt = now;
        morphing = true;
        aimTags(false);
        wake();
      } else {
        morphing = false;
        line.p.set(goal);
        line.g.set(goal);
        line.v.fill(0);
        settle(mix);
        paintMix();
        aimTags(true);
        if (drawn && W) {
          if (!candleOn) paint();
        } else if (W) {
          startDrawing();
        }
      }

      if (o.onSeries) {
        o.onSeries({
          tf, first: series.first, last: series.last, hi: barRows ? barRows.hi : series.hi, lo: barRows ? barRows.lo : series.lo,
          change: series.change, stale: !!(meta && meta.stale), rough,
          from: series.times ? series.times[0] : null, to: series.times ? series.times[series.n - 1] : null
        });
      }
      if (scrubbing) {
        lastI = -1;
        emit(lastPx);
      }
      return true;
    }

    function show(nextTf) {
      if (!o.load) return;
      const token = ++loadToken;
      clearTimeout(waitTimer);
      host.classList.remove('is-failed');
      waitTimer = setTimeout(() => { if (token === loadToken && !pendingOn && !(series && nextTf === tf && !rough)) setWaiting(true); }, WAIT_AFTER);
      const failed = (err) => {
        if (token !== loadToken || dead) return;
        clearTimeout(waitTimer);
        setWaiting(false);
        if (!err || !err.note) return;
        failure = err;
        noteEl.textContent = noteText();
        host.classList.add('is-failed');
      };
      let pending;
      try { pending = Promise.resolve(o.load(nextTf)); } catch (err) { pending = Promise.reject(err); }
      pending.then((res) => {
        if (token !== loadToken || dead) return;
        clearTimeout(waitTimer);
        if (res && res.keep) {
          setWaiting(false);
          return;
        }
        if (res && res.live) followLive(res.live);
        if (!res || !setSeries(res.points, true, { tf: nextTf, stale: res.stale, rough: res.rough, candles: res.candles })) failed();
        else setWaiting(rough);
      }, failed);
    }
    let pendingOn = false;
    function setPending(on) {
      if (pendingOn === on) return;
      pendingOn = on;
      host.classList.toggle('is-pending', on);
      if (on) setWaiting(false);
    }
    function setWaiting(on) {
      if (waiting === on) return;
      waiting = on;
      if (CK.reducedMotion()) plot.style.opacity = on ? '.6' : '';
      else wake();
    }

    function placeCursorDot() {
      const pos = scrubF * (N - 1);
      const a = Math.min(Math.floor(pos), N - 2);
      const v = line.p[a] + (line.p[a + 1] - line.p[a]) * (pos - a);
      cursorDot.style.transform = `translate3d(0,${(PAD_Y + v * span).toFixed(2)}px,0)`;
    }
    function emit(clientX) {
      if (!series) return;
      lastPx = clientX;
      const f = clamp((clientX - hostLeft) / plotW, 0, 1);
      if (candleOn) {
        const at = clamp(Math.floor((f * plotW * bars.dpr - bars.leftPx) / bars.slotPx), 0, bars.n - 1);
        const bar = bars.list[at], barX = barCentre(bars, at);
        cursor.style.transform = `translate3d(${barX.toFixed(2)}px,0,0)`;
        placeTime(barX, bar.t, CK.chart.barScale(bars.stepMs, bars.list[bars.n - 1].t - bars.list[0].t));
        if (at !== lastI) {
          const was = lastI;
          lastI = at;
          if (was >= 0) crossLevels(bars.list[was].c, bar.c);
          paintOhlc(bar);
          CK.haptic.selection();
          if (o.onScrub) o.onScrub(bar.c, at, bars.n, bar.t);
        }
        return;
      }
      const i = Math.round(f * (series.n - 1));
      scrubF = i / (series.n - 1);
      const x = scrubF * plotW;
      cursor.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      placeCursorDot();
      placeTime(x, series.times ? series.times[i] : null, CK.chart.timeScale(series.times ? series.times[series.n - 1] - series.times[0] : 0, tf));
      if (i !== lastI) {
        const was = lastI;
        lastI = i;
        if (was >= 0) crossLevels(series.values[was], series.values[i]);
        CK.haptic.selection();
        if (o.onScrub) o.onScrub(series.values[i], i, series.n, series.times ? series.times[i] : null);
      }
    }
    function paintOhlc(bar) {
      ohlcEls[0].textContent = plainPrice(bar.o);
      ohlcEls[1].textContent = plainPrice(bar.h);
      ohlcEls[2].textContent = plainPrice(bar.l);
      ohlcEls[3].textContent = plainPrice(bar.c);
    }
    function placeTime(x, at, scale) {
      if (at === null) {
        timeEl.classList.add('is-empty');
        return;
      }
      timeEl.classList.remove('is-empty');
      const text = CK.chart.time(at, scale);
      CK.roll(timeEl, text);
      const shape = text.replace(/\d/g, '0');
      if (shape !== timeShape) {
        timeShape = shape;
        timeW = timeEl.offsetWidth;
      }
      timeEl.style.transform = `translate3d(${clamp(x - timeW / 2, 4, Math.max(4, W - timeW - 4)).toFixed(2)}px,0,0)`;
    }
    function begin(clientX) {
      hostLeft = host.getBoundingClientRect().left;
      scrubbing = true;
      host.classList.add('is-scrubbing');
      lastI = -1;
      emit(clientX);
    }
    function end() {
      scrubbing = false;
      host.classList.remove('is-scrubbing');
      if (o.onScrub) o.onScrub(null);
      if (heldLine) {
        const held = heldLine;
        heldLine = null;
        tickLine(held.price, Math.max(held.at, clockNow() - 1));
      }
    }
    CK.drag(host, {
      axis: 'x',
      threshold: 3,
      slop: 10,
      onPress() { pressAt = performance.now(); },
      onStart(s) { untell(); begin(s.x); },
      onMove(s) { emit(s.x); },
      onEnd: end,
      onRelease(s, ok) { if (ok && performance.now() - pressAt < TAP_MS) tapLevels(s.y0); }
    });
    host.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && e.buttons === 0) {
        if (!scrubbing) begin(e.clientX);
        else emit(e.clientX);
      }
    });
    host.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && scrubbing) end();
    });
    host.addEventListener('contextmenu', (e) => {
      if (e.pointerType === 'touch' || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) e.preventDefault();
    });

    const resize = new ResizeObserver((entries) => {
      const r = entries[entries.length - 1].contentRect;
      if (!r.width || !r.height || (r.width === W && r.height === H)) return;
      layout(r.width, r.height);
      if (!series) return;
      syncType(false);
      if (!drawn) { startDrawing(); return; }
      aimTags(true);
      if (!candleOn) paint();
      if (scrubbing) {
        lastI = -1;
        hostLeft = host.getBoundingClientRect().left;
        emit(lastPx);
      }
    });
    resize.observe(host);

    if (o.points) setSeries(o.points, false, { rough: o.rough, candles: o.candles });
    if (o.tf && o.load) show(o.tf);

    return {
      show,
      setSeries,
      levels: setLevels,
      pending(on) { setPending(!!on && !!series); },
      destroy() {
        dead = true;
        loadToken++;
        clearTimeout(waitTimer);
        clearTimeout(toldTimer);
        clearTimeout(sprungTimer);
        cancelAnimationFrame(raf);
        resize.disconnect();
        liveCharts.delete(instance);
        if (stopLive) stopLive();
        if (typeBox) typeBox.remove();
      }
    };
  };

  CK.chart.setType = function (candles) {
    wantBars = !!candles;
    try { localStorage.setItem(TYPE_KEY, wantBars ? 'candles' : 'line'); } catch (_) { }
    liveCharts.forEach((chart) => chart.syncType(false));
  };
  const repaintCandles = () => liveCharts.forEach((chart) => chart.repaint());
  new MutationObserver(repaintCandles).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaintCandles);

  CK.chart.byTime = byTime;

  CK.chart.timeScale = function (spanMs, tf) {
    if (spanMs > 200 * 864e5) return '1y';
    if (spanMs > 1.5 * 864e5 && (tf === '1h' || tf === '1d')) return '1w';
    return tf;
  };

  CK.chart.barScale = function (stepMs, spanMs) {
    if (stepMs >= DAY_MS) return spanMs > 200 * DAY_MS ? '1y' : '1m';
    return spanMs > 1.5 * DAY_MS ? '1w' : '1d';
  };

  CK.chart.time = function (t, tf) {
    const clock = CK.i18n.clock(t);
    const day = CK.i18n.dayShort(t);
    if (tf === '1h' || tf === '1d') return clock;
    if (tf === '1w') return `${day}, ${clock}`;
    if (tf === '1y') return `${day}${CK.i18n.lang === 'en' ? ',' : ''} ${new Date(t).getFullYear()}`;
    return day;
  };

  CK.chart.pill = function (host, value) {
    host.innerHTML = '<span class="change change--live" data-change><span class="change-num"></span></span>';
    const pill = host.firstElementChild, num = pill.lastElementChild;
    let last = value;
    function set(v) {
      last = v;
      const flat = CK.changeFlat(v), up = v >= 0 || flat;
      pill.classList.toggle('is-up', up);
      pill.classList.toggle('is-down', !up);
      pill.classList.toggle('is-flat', flat);
      CK.roll(num, flat ? fmt.pctAbs(0) : fmt.pct(v));
    }
    set(value);
    CK.i18n.bind(host, () => set(last));
    return { set };
  };

  CK.chart.swapText = function (el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    if (CK.reducedMotion() || !el.animate) return;
    el.animate(
      [{ opacity: 0, transform: 'translate3d(0,.35em,0)' }, { opacity: 1, transform: 'none' }],
      { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' }
    );
  };
})();
