(function () {
  'use strict';
  const CK = window.CK = window.CK || {};

  const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 1.2}" fill="currentColor" stroke="none"/>`;
  const solid = (d) => `<path d="${d}" fill="currentColor"/>`;
  const soft = (d, o) => `<path d="${d}" fill="currentColor" stroke="none" opacity="${o || .32}"/>`;
  const p = (d) => `<path d="${d}"/>`;
  const circle = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  const rect = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const rectF = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="currentColor"/>`;
  const n2 = (v) => +v.toFixed(2);
  const GEAR = (function softGear(teeth, outer, inner, duty, ease, per) {
    const c = 12, n = teeth * per, pts = [];
    for (let k = 0; k < n; k++) {
      const t = k / n * Math.PI * 2;
      const ph = ((t / (Math.PI * 2)) * teeth) % 1;
      const x = Math.min(ph, 1 - ph), lo = duty / 2 - ease / 2, hi = duty / 2 + ease / 2;
      const w = x < lo ? 1 : x > hi ? 0 : .5 + .5 * Math.cos((x - lo) / ease * Math.PI);
      const r = inner + (outer - inner) * w, a = t - Math.PI / 2;
      pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]);
    }
    let d = 'M' + n2(pts[0][0]) + ' ' + n2(pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += 'C' + n2(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n2(p1[1] + (p2[1] - p0[1]) / 6)
        + ' ' + n2(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n2(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n2(p2[0]) + ' ' + n2(p2[1]);
    }
    return d + 'Z';
  })(6, 9.5, 7.3, .5, .3, 8);
  function sparkle(cx, cy, r) {
    const k = r * .16;
    return `M${cx} ${n2(cy - r)}Q${n2(cx + k)} ${n2(cy - k)} ${n2(cx + r)} ${cy}Q${n2(cx + k)} ${n2(cy + k)} ${cx} ${n2(cy + r)}`
      + `Q${n2(cx - k)} ${n2(cy + k)} ${n2(cx - r)} ${cy}Q${n2(cx - k)} ${n2(cy - k)} ${cx} ${n2(cy - r)}z`;
  }

  const STAR = 'M12 3.4l2.65 5.45 6 .85-4.35 4.2 1.03 5.98L12 17.05l-5.33 2.83 1.03-5.98L3.35 9.7l6-.85z';
  const PERSON_BODY = 'M4.6 20.6c.55-3.75 3.6-6 7.4-6s6.85 2.25 7.4 6';
  const SHIELD = 'M12 2.9l7.6 2.75v5.75c0 4.65-3.05 8-7.6 9.7-4.55-1.7-7.6-5.05-7.6-9.7V5.65z';
  const BELL = 'M12 3.2a6.2 6.2 0 0 0-6.2 6.2v3.5c0 .9-.3 1.75-.85 2.45l-.75.95c-.4.5-.05 1.2.6 1.2h14.4c.65 0 1-.7.6-1.2l-.75-.95a3.9 3.9 0 0 1-.85-2.45V9.4A6.2 6.2 0 0 0 12 3.2z';
  const BOLT = 'M13.2 2.6L4.9 13.3a.5.5 0 0 0 .4.8h5.5l-1 7.3 8.3-10.7a.5.5 0 0 0-.4-.8h-5.5z';
  const MOON = 'M20.3 14.6A8.6 8.6 0 0 1 9.4 3.7a8.6 8.6 0 1 0 10.9 10.9z';
  const FLAME = 'M12.2 2.8c.4 3.6 5.6 5.7 5.6 11.2a5.8 5.8 0 0 1-11.6 0c0-2.3 1.05-3.8 2.3-5 .2 1.5.95 2.4 1.85 2.7-.1-3 .6-6.6 1.85-8.9z';
  const WALLET = 'M6.5 6.4h11a3.5 3.5 0 0 1 3.5 3.5v7.2a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 17.1V9.9a3.5 3.5 0 0 1 3.5-3.5z';
  const PIE_A = 'M10.6 4.3a8.6 8.6 0 1 0 9.1 9.1h-9.1z';
  const PIE_B = 'M14.6 2.9a6.9 6.9 0 0 1 6.5 6.5h-6.5z';
  const BUBBLE = 'M12 3.6c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.9 0-1.8-.1-2.6-.3L5.2 20.6c-.4.2-.9-.1-.8-.6l.5-3.2C3.7 15.4 3 13.4 3 11.3c0-4.3 4-7.7 9-7.7z';
  const ARROW_RIGHT = 'M3.75 8.25h16.5M15.75 3.75l4.5 4.5-4.5 4.5';
  const ARROW_LEFT = 'M20.25 15.75H3.75M8.25 11.25l-4.5 4.5 4.5 4.5';
  const PIN_BODY = 'M15.98 4.52L9.58 10.91C8.9 11.6 8.17 11.64 7.22 11.6L5.55 11.6C4.82 11.56 4.25 11.75 3.79 12.21C3.3 12.7 3.3 13.47 3.79 13.96L6.92 17.08L10.04 20.21C10.53 20.7 11.3 20.7 11.79 20.21C12.25 19.75 12.44 19.18 12.4 18.45L12.4 16.78C12.36 15.83 12.4 15.1 13.09 14.42L19.48 8.02';
  const PIN_HEAD = 'M14.76 3.3L20.7 9.24';
  const PIN_NEEDLE = 'M6.92 17.08L3.57 20.43';
  const PIN_CUT = 'M14.76 3.3L20.7 9.24M15.98 4.52L12 8.5M19.48 8.02L15.5 12'
    + 'M9.58 10.91C8.9 11.6 8.17 11.64 7.22 11.6L5.55 11.6C4.82 11.56 4.25 11.75 3.79 12.21C3.3 12.7 3.3 13.47 3.79 13.96L6.92 17.08'
    + 'M13.09 14.42C12.4 15.1 12.36 15.83 12.4 16.78L12.4 18.45C12.44 19.18 12.25 19.75 11.79 20.21C11.3 20.7 10.53 20.7 10.04 20.21L6.92 17.08L3.57 20.43';
  const TG_PLANE = 'M20.5 4.3L3.6 10.9c-.6.25-.55 1.1.05 1.3l4.45 1.45 1.7 5.35c.18.58.92.74 1.34.3l2.45-2.55 4.35 3.2c.5.37 1.22.1 1.36-.5l3.1-13.4c.16-.7-.52-1.3-1.2-1.05z';

  const ICONS = {
    markets: {
      o: p('M3.6 3.6v13.6a3.2 3.2 0 0 0 3.2 3.2h13.6') + p('M7.6 14.8l3.9-4.5 3.2 3 5-6.1'),
      f: soft('M7.6 14.8l3.9-4.5 3.2 3 5-6.1V17H7.6z', .34) + p('M3.6 3.6v13.6a3.2 3.2 0 0 0 3.2 3.2h13.6') + p('M7.6 14.8l3.9-4.5 3.2 3 5-6.1')
    },
    trade: {
      o: rect(3.6, 8.6, 4.2, 7.8, 1.3) + p('M5.7 4.6v4M5.7 16.4v3') + rect(9.9, 5.6, 4.2, 9.4, 1.3) + p('M12 2.8v2.8M12 15v6.2') + rect(16.2, 10, 4.2, 6.6, 1.3) + p('M18.3 6v4M18.3 16.6v3.4'),
      f: rectF(3.6, 8.6, 4.2, 7.8, 1.3) + p('M5.7 4.6v4M5.7 16.4v3') + rectF(9.9, 5.6, 4.2, 9.4, 1.3) + p('M12 2.8v2.8M12 15v6.2') + rectF(16.2, 10, 4.2, 6.6, 1.3) + p('M18.3 6v4M18.3 16.6v3.4')
    },
    portfolio: { o: p(PIE_A) + p(PIE_B), f: solid(PIE_A) + solid(PIE_B) },
    person: {
      o: circle(12, 7.9, 4.2) + p(PERSON_BODY),
      f: `<circle cx="12" cy="7.9" r="4.2" fill="currentColor"/>` + solid(PERSON_BODY + 'z')
    },
    grid: {
      o: rect(3.4, 3.4, 7.3, 7.3, 2.1) + rect(13.3, 3.4, 7.3, 7.3, 2.1) + rect(3.4, 13.3, 7.3, 7.3, 2.1) + rect(13.3, 13.3, 7.3, 7.3, 2.1),
      f: rectF(3.4, 3.4, 7.3, 7.3, 2.1) + rectF(13.3, 3.4, 7.3, 7.3, 2.1) + rectF(3.4, 13.3, 7.3, 7.3, 2.1) + rectF(13.3, 13.3, 7.3, 7.3, 2.1)
    },
    wallet: {
      o: p(WALLET) + p('M6 6.4l9.3-3a1.8 1.8 0 0 1 2.3 1.7v1.3') + p('M21 11.4h-3.6a2.1 2.1 0 0 0 0 4.2H21'),
      f: solid(WALLET) + p('M6 6.4l9.3-3a1.8 1.8 0 0 1 2.3 1.7v1.3') + dot(17.2, 13.5, 1.3).replace('currentColor', 'var(--icon-knock, #fff)')
    },

    'chevron-left': { o: p('M14.8 5.2L8 12l6.8 6.8') },
    'chevron-right': { o: p('M9.2 5.2L16 12l-6.8 6.8') },
    'chevron-up': { o: p('M5.2 15L12 8.2l6.8 6.8') },
    'chevron-down': { o: p('M5.2 9l6.8 6.8L18.8 9') },
    'chevron-updown': { o: p('M7.5 9.5L12 5l4.5 4.5M7.5 14.5L12 19l4.5-4.5') },
    close: { o: p('M6 6l12 12M18 6L6 18') },
    check: { o: p('M4.6 12.8l5 5L19.4 6.6') },
    plus: { o: p('M12 4.8v14.4M4.8 12h14.4') },
    minus: { o: p('M4.8 12h14.4') },
    more: { o: dot(5.4, 12, 1.65) + dot(12, 12, 1.65) + dot(18.6, 12, 1.65) },
    search: { o: circle(10.7, 10.7, 6.9) + p('M15.8 15.8l4.8 4.8') },
    list: { o: p('M8.6 6.2h11.8M8.6 12h11.8M8.6 17.8h11.8') + dot(4.5, 6.2) + dot(4.5, 12) + dot(4.5, 17.8) },
    filter: { o: p('M3.8 6.8h16.4M7.2 12h9.6M10.4 17.2h3.2') },
    sort: { o: p('M8 4.8v14.4M4.2 15.4L8 19.2l3.8-3.8M16 19.2V4.8M12.2 8.6L16 4.8l3.8 3.8') },
    sliders: { o: p('M3.8 7.2h9M18.6 7.2h1.6') + circle(15.7, 7.2, 2.5) + p('M3.8 16.8h1.6M11.2 16.8h9') + circle(8.3, 16.8, 2.5) },
    drag: { o: p('M5 8.2h14M5 12h14M5 15.8h14') },

    'arrow-up-right': { o: p('M6.8 17.2L17.2 6.8M8.4 6.8h8.8v8.8') },
    'arrow-down-left': { o: p('M17.2 6.8L6.8 17.2M15.6 17.2H6.8V8.4') },
    'arrow-up': { o: p('M12 19.6V4.6M5.4 11.2L12 4.6l6.6 6.6') },
    'arrow-down': { o: p('M12 4.4v15M5.4 12.8l6.6 6.6 6.6-6.6') },
    swap: { o: p('M3.4 8.6h15.8M15.4 4.8l3.8 3.8-3.8 3.8M20.6 15.4H4.8M8.6 11.6l-3.8 3.8 3.8 3.8') },
    exchange: { o: p('M4.3 11A7.8 7.8 0 0 1 18.2 7.2M18.9 3.5v3.9H15') + p('M19.7 13a7.8 7.8 0 0 1-13.9 3.8M5.1 20.5v-3.9H9'), f: '<path d="M4.3 11A7.8 7.8 0 0 1 18.2 7.2M18.9 3.5v3.9H15" stroke-width="2.4"/><path d="M19.7 13a7.8 7.8 0 0 1-13.9 3.8M5.1 20.5v-3.9H9" stroke-width="2.4"/>' },
    p2p: {
      o: '<circle cx="7.75" cy="7.75" r="3.1"/><path d="M2.58 19.5A5.25 5.25 0 0 1 12.92 19.5z"/><path d="M16.25 19.5V5H17.75a2.75 2.75 0 0 1 0 5.5H16.25"/><path d="M14.25 14.25H20.25"/>',
      f: '<path d="M3.77 7.75A3.98 3.98 0 0 1 7.75 3.77A3.98 3.98 0 0 1 11.72 7.75A3.98 3.98 0 0 1 7.75 11.72A3.98 3.98 0 0 1 3.77 7.75z" fill="currentColor" stroke="none" fill-rule="evenodd"/><path d="M1.63 20.38A6.13 6.13 0 0 1 13.87 20.38z" fill="currentColor" stroke="none" fill-rule="evenodd"/><path d="M16.25 19.5V5H17.75a2.75 2.75 0 0 1 0 5.5H16.25" stroke-width="2.5"/><path d="M14.25 14.25H20.25" stroke-width="2.5"/>'
    },
    'tab-wallet': {
      o: rect(3, 4.6, 18, 14.8, 5) + p('M15.4 9.6h1.8a2.4 2.4 0 0 1 0 4.8h-1.8a2.4 2.4 0 0 1 0-4.8z'),
      f: '<path d="M8 4.6h8a5 5 0 0 1 5 5v4.8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V9.6a5 5 0 0 1 5-5zM15.4 9.2h1.8a2.8 2.8 0 0 1 0 5.6h-1.8a2.8 2.8 0 0 1 0-5.6z" fill="currentColor" stroke="none" fill-rule="evenodd"/>'
        + '<circle cx="16.3" cy="12" r="1.15" fill="currentColor" stroke="none"/>'
    },
    'tab-exchange': {
      o: circle(12, 12, 9) + p('M7.6 9.8h8.4l-2.4-2.4') + p('M16.4 14.2H8l2.4 2.4'),
      f: '<circle cx="12" cy="12" r="9.8" fill="currentColor" stroke="none"/>'
        + '<path d="M7.4 9.8h8.8l-2.5-2.5" fill="none" style="stroke:var(--bg)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M16.6 14.2H7.8l2.5 2.5" fill="none" style="stroke:var(--bg)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    'tab-p2p': {
      o: rect(3, 3, 18, 18, 6) + circle(8.8, 8.8, 1.9) + circle(15.2, 15.2, 1.9) + p('M13.4 6.9a5.4 5.4 0 0 1 3.7 3.7M17.1 8.3v2.3h-2.3') + p('M10.6 17.1a5.4 5.4 0 0 1-3.7-3.7M6.9 15.7v-2.3h2.3'),
      f: '<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="6.2" fill="currentColor" stroke="none"/>'
        + '<circle cx="8.8" cy="8.8" r="2.1" style="fill:var(--bg)" stroke="none"/>'
        + '<circle cx="15.2" cy="15.2" r="2.1" style="fill:var(--bg)" stroke="none"/>'
        + '<path d="M13.4 6.9a5.4 5.4 0 0 1 3.7 3.7M17.1 8.3v2.3h-2.3" fill="none" style="stroke:var(--bg)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M10.6 17.1a5.4 5.4 0 0 1-3.7-3.7M6.9 15.7v-2.3h2.3" fill="none" style="stroke:var(--bg)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    'tab-profile': {
      o: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9.4" r="3.25"/><path d="M6.11 18.81A6.9 6.9 0 0 1 17.89 18.81"/>',
      f: '<circle cx="12" cy="12" r="9" stroke-width="2.25"/><circle cx="12" cy="9.4" r="3.25" fill="currentColor"/><path d="M6.11 18.81A6.9 6.9 0 0 1 17.89 18.81A9 9 0 0 1 6.11 18.81z" fill="currentColor"/>'
    },
    'tab-gift': {
      o: rect(3.2, 7.9, 17.6, 4.5, 2) + p('M5 12.4v5.2a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5.2M12 7.9v12.7')
        + p('M12 7.9c-.5-2.6-1.95-4.4-3.75-4.4a2.2 2.2 0 0 0 0 4.4M12 7.9c.5-2.6 1.95-4.4 3.75-4.4a2.2 2.2 0 0 1 0 4.4'),
      f: '<path d="M4.6 13.6h6.5v7.6H8a3.4 3.4 0 0 1-3.4-3.4zM12.9 13.6h6.5v4.2a3.4 3.4 0 0 1-3.4 3.4h-3.1z" fill="currentColor" stroke="none"/>'
        + '<path d="M5.2 8.2h5.9v4.4H5.2a2.2 2.2 0 0 1 0-4.4zM12.9 8.2h5.9a2.2 2.2 0 0 1 0 4.4h-5.9z" fill="currentColor" stroke="none"/>'
        + '<path d="M11.1 7.2C10.6 4.9 9.4 2.9 7.8 2.9a2.15 2.15 0 0 0 0 4.3zM12.9 7.2c.5-2.3 1.7-4.3 3.3-4.3a2.15 2.15 0 0 1 0 4.3z" fill="currentColor" stroke="none"/>'
    },
    deposit: { o: p('M17 7 7 17M7 8.6V17h8.4') },
    withdraw: { o: p('M7 17 17 7M8.6 7H17v8.4') },
    send: { o: p('M12 19V5.2M6.1 11.1L12 5.2l5.9 5.9') },
    receive: { o: p('M12 5v13.8M6.1 12.9l5.9 5.9 5.9-5.9') },
    'swap-circle': { o: p('M5.4 8.7H18l-3.6-3.6') + p('M18.6 15.3H6l3.6 3.6') },
    refresh: { o: p('M20 12a8 8 0 1 1-2.45-5.77L20 8.6M20 3.8v4.8h-4.8') },
    history: { o: rect(4, 4, 16, 16, 5) + p('M12 8.4V12l2.6 1.6') },
    percent: { o: p('M18.8 5.2L5.2 18.8') + circle(7.4, 7.4, 2.6) + circle(16.6, 16.6, 2.6) },
    gauge: { o: p('M4.1 17.6a9 9 0 1 1 15.8 0') + p('M12 14.2l4.2-4.8') + dot(12, 14.2, 1.5) },
    target: { o: circle(12, 12, 9) + circle(12, 12, 4.8) + dot(12, 12, 1.3) },
    activity: { o: p('M2.8 12.4h4l2.6-7 5 14 2.8-7h3.9') },
    bars: {
      o: rect(3.6, 8.6, 4.2, 7.8, 1.3) + p('M5.7 4.6v4M5.7 16.4v3') + rect(9.9, 5.6, 4.2, 9.4, 1.3) + p('M12 2.8v2.8M12 15v6.2') + rect(16.2, 10, 4.2, 6.6, 1.3) + p('M18.3 6v4M18.3 16.6v3.4'),
      f: rectF(3.6, 8.6, 4.2, 7.8, 1.3) + p('M5.7 4.6v4M5.7 16.4v3') + rectF(9.9, 5.6, 4.2, 9.4, 1.3) + p('M12 2.8v2.8M12 15v6.2') + rectF(16.2, 10, 4.2, 6.6, 1.3) + p('M18.3 6v4M18.3 16.6v3.4')
    },
    candle: { o: rect(9.4, 6.8, 5.2, 10.4, 1.6) + p('M12 2.8v4M12 17.2v4'), f: rectF(9.4, 6.8, 5.2, 10.4, 1.6) + p('M12 2.8v4M12 17.2v4') },
    'chart-candles': { o: p('M7 3.4V7M6 7h2a1.4 1.4 0 0 1 1.4 1.4v4.8a1.4 1.4 0 0 1-1.4 1.4H6a1.4 1.4 0 0 1-1.4-1.4V8.4A1.4 1.4 0 0 1 6 7zM7 14.6v4') + p('M17 5.4v4M16 9.4h2a1.4 1.4 0 0 1 1.4 1.4v4.8a1.4 1.4 0 0 1-1.4 1.4h-2a1.4 1.4 0 0 1-1.4-1.4v-4.8a1.4 1.4 0 0 1 1.4-1.4zM17 17v3.6') },
    'chart-line': { o: p('M3.4 17.1l4.8-5.2 3.8 3.4 8.6-8.4') },
    layers: { o: p('M12 3.2l9 4.9-9 4.9-9-4.9z') + p('M3.6 12.4L12 17l8.4-4.6M3.6 16.4L12 21l8.4-4.6'), f: solid('M12 3.2l9 4.9-9 4.9-9-4.9z') + p('M3.6 12.4L12 17l8.4-4.6M3.6 16.4L12 21l8.4-4.6') },
    bolt: { o: p(BOLT), f: solid(BOLT) },
    flame: { o: p(FLAME), f: solid(FLAME) },
    star: { o: p(STAR), f: solid(STAR) },
    sparkles: {
      o: p(sparkle(9.6, 13.8, 7.6)) + p(sparkle(18, 5.6, 3.6)) + dot(19, 18.6, 1.3),
      f: solid(sparkle(9.6, 13.8, 7.6)) + solid(sparkle(18, 5.6, 3.6)) + dot(19, 18.6, 1.5)
    },
    pin: { o: p(PIN_BODY) + p(PIN_HEAD) + p(PIN_NEEDLE), f: solid(PIN_BODY + 'Z') + p(PIN_HEAD) + p(PIN_NEEDLE) },
    'pin-off': { o: p(PIN_CUT) + p('M4.35 3.25l16.4 16.4') },
    bank: { o: p('M12 3.2L3.4 8v1.6h17.2V8z') + p('M6 12.6v4.6M10 12.6v4.6M14 12.6v4.6M18 12.6v4.6M3.8 20.6h16.4'), f: solid('M12 3.2L3.4 8v1.6h17.2V8z') + p('M6 12.6v4.6M10 12.6v4.6M14 12.6v4.6M18 12.6v4.6M3.8 20.6h16.4') },
    card: { o: rect(2.8, 5, 18.4, 14, 3.4) + p('M2.8 9.8h18.4M6.6 15.2h3.6') },
    gift: { o: rect(3.4, 7.8, 17.2, 4.2, 1.3) + p('M5 12v6.4a2.2 2.2 0 0 0 2.2 2.2h9.6a2.2 2.2 0 0 0 2.2-2.2V12M12 7.8v12.8') + p('M12 7.8S11 3.4 8 3.4a2.2 2.2 0 0 0 0 4.4zM12 7.8s1-4.4 4-4.4a2.2 2.2 0 0 1 0 4.4z') },

    gear: { o: p(GEAR) + circle(12, 12, 3) },
    bell: { o: p(BELL) + p('M9.8 20.4a2.4 2.4 0 0 0 4.4 0'), f: solid(BELL) + p('M9.8 20.4a2.4 2.4 0 0 0 4.4 0') },
    shield: { o: p(SHIELD) + p('M8.6 12l2.5 2.5 4.3-4.8'), f: solid(SHIELD) + `<path d="M8.6 12l2.5 2.5 4.3-4.8" stroke="var(--icon-knock, #fff)"/>` },
    lock: { o: rect(5, 10.4, 14, 10.2, 3) + p('M8 10.4V7.4a4 4 0 0 1 8 0v3'), f: rectF(5, 10.4, 14, 10.2, 3) + p('M8 10.4V7.4a4 4 0 0 1 8 0v3') },
    key: { o: circle(8.2, 15.8, 4.6) + p('M11.5 12.5l8.3-8.3M16.2 7.8l3 3M13.4 10.6l2 2') },
    'face-scan': { o: p('M3.8 8.4V6.6a2.8 2.8 0 0 1 2.8-2.8h1.8M15.6 3.8h1.8a2.8 2.8 0 0 1 2.8 2.8v1.8M20.2 15.6v1.8a2.8 2.8 0 0 1-2.8 2.8h-1.8M8.4 20.2H6.6a2.8 2.8 0 0 1-2.8-2.8v-1.8') + p('M8.8 9.6v1.4M15.2 9.6v1.4M8.8 15.2c1.9 1.4 4.5 1.4 6.4 0') },
    scan: { o: p('M3.8 8.4V6.6a2.8 2.8 0 0 1 2.8-2.8h1.8M15.6 3.8h1.8a2.8 2.8 0 0 1 2.8 2.8v1.8M20.2 15.6v1.8a2.8 2.8 0 0 1-2.8 2.8h-1.8M8.4 20.2H6.6a2.8 2.8 0 0 1-2.8-2.8v-1.8M3.8 12h16.4') },
    qr: { o: rect(3.6, 3.6, 6.8, 6.8, 1.8) + rect(13.6, 3.6, 6.8, 6.8, 1.8) + rect(3.6, 13.6, 6.8, 6.8, 1.8) + p('M13.8 13.8h2.6v2.6M20.4 13.8v.01M13.8 20.2v.01M20.2 20.2h-1.6v-1.8') },
    copy: { o: rect(8.6, 8.6, 12, 12, 3) + p('M15.4 8.6V6.4a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h2.2') },
    share: { o: p('M12 14.8V3.2M8 7.2l4-4 4 4') + p('M8 10.6H7a2.6 2.6 0 0 0-2.6 2.6v5.2A2.6 2.6 0 0 0 7 21h10a2.6 2.6 0 0 0 2.6-2.6v-5.2a2.6 2.6 0 0 0-2.6-2.6h-1') },
    link: { o: p('M10.2 13.8a4 4 0 0 0 5.65 0l3.3-3.3a4 4 0 0 0-5.65-5.65l-1 1M13.8 10.2a4 4 0 0 0-5.65 0l-3.3 3.3a4 4 0 0 0 5.65 5.65l1-1') },
    clock: { o: circle(12, 12, 9) + p('M12 6.8v5.4l3.4 2.1') },
    globe: { o: circle(12, 12, 9) + `<ellipse cx="12" cy="12" rx="3.9" ry="9"/>` + p('M3 12h18') },
    'telegram-plane': { o: p(TG_PLANE) + p('M8.1 13.65l8.9-5.75-5.8 6.1-1.4 4.95') },
    'x-social': { o: p('M4.4 3.8h4.4l10.8 16.4h-4.4z') + p('M19.2 3.8l-5.94 6.77M10.74 13.43L4.8 20.2') },
    code: { o: p('M8.2 7.2L3.4 12l4.8 4.8M15.8 7.2l4.8 4.8-4.8 4.8M13.8 4.6l-3.6 14.8') },
    moon: { o: p(MOON), f: solid(MOON) },
    sun: { o: circle(12, 12, 4.1) + p('M12 2.8v1.8M12 19.4v1.8M2.8 12h1.8M19.4 12h1.8M5.5 5.5l1.3 1.3M17.2 17.2l1.3 1.3M18.5 5.5l-1.3 1.3M6.8 17.2l-1.3 1.3') },
    eye: { o: p('M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12z') + circle(12, 12, 2.9) },
    'eye-solid': { o: p('M12 5.2c-5.2 0-8.7 4.3-9.8 6.1a1.3 1.3 0 0 0 0 1.4c1.1 1.8 4.6 6.1 9.8 6.1s8.7-4.3 9.8-6.1a1.3 1.3 0 0 0 0-1.4C20.7 9.5 17.2 5.2 12 5.2z') + circle(12, 12, 3.7), f: '<path d="M12 5.2c-5.2 0-8.7 4.3-9.8 6.1a1.3 1.3 0 0 0 0 1.4c1.1 1.8 4.6 6.1 9.8 6.1s8.7-4.3 9.8-6.1a1.3 1.3 0 0 0 0-1.4C20.7 9.5 17.2 5.2 12 5.2zM12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z" fill="currentColor" stroke="none" fill-rule="evenodd"/><circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none"/>' },
    'eye-solid-off': { o: p('M12 5.2c-5.2 0-8.7 4.3-9.8 6.1a1.3 1.3 0 0 0 0 1.4c1.1 1.8 4.6 6.1 9.8 6.1s8.7-4.3 9.8-6.1a1.3 1.3 0 0 0 0-1.4C20.7 9.5 17.2 5.2 12 5.2z'), f: '<path d="M12 5.2c-5.2 0-8.7 4.3-9.8 6.1a1.3 1.3 0 0 0 0 1.4c1.1 1.8 4.6 6.1 9.8 6.1s8.7-4.3 9.8-6.1a1.3 1.3 0 0 0 0-1.4C20.7 9.5 17.2 5.2 12 5.2zM12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z" fill="currentColor" stroke="none" fill-rule="evenodd" opacity=".35"/><path d="M4.2 4.2l15.6 15.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' },
    'eye-off': { o: p('M9.6 5.9c.75-.2 1.55-.3 2.4-.3 6 0 9.4 6.4 9.4 6.4a15 15 0 0 1-2.9 3.6M6.1 7.3A15.4 15.4 0 0 0 2.6 12S6 18.4 12 18.4c1.8 0 3.3-.55 4.6-1.35M9.9 9.9a2.9 2.9 0 0 0 4.1 4.1M3.8 3.8l16.4 16.4') },
    info: { o: circle(12, 12, 9) + p('M12 11v5.4') + dot(12, 7.8, 1.15) },
    warning: { o: p('M10.5 4.4a1.7 1.7 0 0 1 3 0l7.2 13a1.7 1.7 0 0 1-1.5 2.5H4.8a1.7 1.7 0 0 1-1.5-2.5z') + p('M12 9.6v4.4') + dot(12, 16.8, 1.1) },
    'check-circle': {
      o: circle(12, 12, 9) + p('M7.9 12.3l2.8 2.8 5.4-6'),
      f: `<circle cx="12" cy="12" r="9" fill="currentColor"/>` + `<path d="M7.9 12.3l2.8 2.8 5.4-6" stroke="var(--icon-knock, #fff)"/>`
    },
    'close-circle': {
      o: circle(12, 12, 9) + p('M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4'),
      f: `<circle cx="12" cy="12" r="9" fill="currentColor"/>` + `<path d="M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4" stroke="var(--icon-knock, #fff)"/>`
    },
    'plus-circle': { o: circle(12, 12, 9) + p('M12 8v8M8 12h8') },
    trash: { o: p('M4.4 6.4h15.2M9.4 6.4V5a1.6 1.6 0 0 1 1.6-1.6h2A1.6 1.6 0 0 1 14.6 5v1.4M6.4 6.4l.9 12.2a2.1 2.1 0 0 0 2.1 2h5.2a2.1 2.1 0 0 0 2.1-2l.9-12.2') },
    pencil: { o: p('M4 20l1-4.6L16.4 4a2.1 2.1 0 0 1 3 0l.6.6a2.1 2.1 0 0 1 0 3L8.6 19z') },
    doc: { o: p('M6.8 2.9h7.4l5 5v11a2.2 2.2 0 0 1-2.2 2.2H6.8a2.2 2.2 0 0 1-2.2-2.2v-13.8a2.2 2.2 0 0 1 2.2-2.2z') + p('M14 3v5h5M8.4 13h7.2M8.4 16.8h4.6') },
    support: { o: p('M4.8 13.6v-1.8a7.2 7.2 0 0 1 14.4 0v1.8') + rect(3, 13.2, 4, 5.8, 1.7) + rect(17, 13.2, 4, 5.8, 1.7) + p('M19 19c0 1.5-1.5 2.4-3 2.4h-2.6') },
    users: { o: circle(9, 8.2, 3.7) + p('M2.8 19.8c.5-3.3 3-5.2 6.2-5.2s5.7 1.9 6.2 5.2') + p('M15.4 4.9a3.7 3.7 0 0 1 0 6.6M17.8 14.9c2 .7 3.2 2.5 3.5 4.9') },
    plane: { o: p('M20.9 3.1L10.4 13.6M20.9 3.1l-6.2 17.5a.6.6 0 0 1-1.1 0l-3.2-7-7-3.2a.6.6 0 0 1 0-1.1z') },
    chat: { o: p(BUBBLE), f: solid(BUBBLE) },
    tag: { o: p('M3.4 11.4V5.2a1.8 1.8 0 0 1 1.8-1.8h6.2c.5 0 .95.2 1.3.55l7.3 7.3a1.8 1.8 0 0 1 0 2.55l-6.2 6.2a1.8 1.8 0 0 1-2.55 0L3.95 12.7a1.8 1.8 0 0 1-.55-1.3z') + dot(8, 8, 1.35) }
  };
  ICONS['info-circle'] = ICONS.info;

  CK.ICONS = ICONS;

  CK.icon = function (name, opts) {
    const o = opts || {};
    const def = ICONS[name];
    if (!def) throw new Error('Unknown icon: ' + name);
    const body = o.fill && def.f ? def.f : def.o;
    const size = o.size ? ` style="width:${o.size}px;height:${o.size}px"` : '';
    return `<svg class="icon ${o.className || ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"${size}>${body}</svg>`;
  };

  CK.emptyState = function (o) {
    const esc = CK.esc;
    return `<div class="empty${o.className ? ' ' + o.className : ''}"${o.attrs ? ' ' + o.attrs : ''}>`
      + `<span class="tile tile--${o.tone && o.tone !== 'gray' ? o.tone : (/^(warning|close-circle|wifi-off|lock)$/.test(o.icon || '') ? 'orange' : 'blue')} empty-mark" aria-hidden="true">${CK.icon(o.icon || 'search', { fill: true })}</span>`
      + `<b class="empty-title">${esc(o.title)}</b>`
      + (o.text ? `<span class="empty-text">${esc(o.text)}</span>` : '')
      + (o.actions || '') + '</div>';
  };
})();
