(function() {
  "use strict";
  const CK = window.CK = window.CK || {};
  CK.ICONS = CK.ICONS || {};
  const KNOCK = "var(--icon-knock, #fff)";
  const p = (d) => `<path d="${d}"/>`;
  const solid = (d) => `<path d="${d}" fill="currentColor"/>`;
  const circle = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  const disc = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`;
  const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 1.2}" fill="currentColor" stroke="none"/>`;
  const rect = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const rectF = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="currentColor"/>`;
  const bar = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r === void 0 ? Math.min(w, h) / 2 : r}" fill="currentColor" stroke="none"/>`;
  const faint = (d, o) => `<path d="${d}" opacity="${o || 0.4}"/>`;
  const softArea = (d, o) => `<path d="${d}" fill="currentColor" opacity="${o || 0.32}"/>`;
  const knock = (d) => `<path d="${d}" stroke="${KNOCK}"/>`;
  const knockF = (d) => `<path d="${d}" fill="${KNOCK}" stroke="none"/>`;
  const knockDot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 1.2}" fill="${KNOCK}" stroke="none"/>`;
  const knockRing = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" stroke="${KNOCK}"/>`;
  const halo = (d, w) => `<path d="${d}" stroke="${KNOCK}" stroke-width="${w || 4.2}"/>`;
  const scaled = (d, k) => `<path d="${d}" style="stroke-width:calc(var(--icon-w, 1.75) * ${k})"/>`;
  const coinArc = (x, y, r) => {
    const a = +(r * (r < 6 ? 0.47 : 0.55)).toFixed(1);
    return `M${+(x - a).toFixed(2)} ${y}a${a} ${a} 0 0 1 ${a}-${a}`;
  };
  const coinO = (x, y, r) => circle(x, y, r) + (r < 6 ? scaled(coinArc(x, y, r), 0.8) : p(coinArc(x, y, r)));
  const coinF = (x, y, r) => disc(x, y, r) + knock(coinArc(x, y, r));
  const LONG = "M8.3 15.7l7.4-7.4M9.4 8.3h6.3v6.3";
  const SHORT = "M8.3 8.3l7.4 7.4M15.7 9.4v6.3H9.4";
  const OCTAGON = "M8.4 3h7.2c.5 0 1 .2 1.4.6l3.4 3.4c.4.4.6.9.6 1.4v7.2c0 .5-.2 1-.6 1.4L17 20.4c-.4.4-.9.6-1.4.6H8.4c-.5 0-1-.2-1.4-.6L3.6 17c-.4-.4-.6-.9-.6-1.4V8.4c0-.5.2-1 .6-1.4L7 3.6c.4-.4.9-.6 1.4-.6z";
  const STOP_ARROW = "M12 7.4v8.8M8.6 12.8l3.4 3.4 3.4-3.4";
  const LIMIT_TAG = "M8.6 3.6h6.8a1.6 1.6 0 0 1 1.6 1.6v6.2c0 .45-.2.9-.5 1.2l-3.3 3.3a1.7 1.7 0 0 1-2.4 0l-3.3-3.3a1.7 1.7 0 0 1-.5-1.2V5.2a1.6 1.6 0 0 1 1.6-1.6z";
  const MARKET_CHEVRONS = "M8.1 8.5l3.5 3.5-3.5 3.5M12.4 8.5l3.5 3.5-3.5 3.5";
  const STAIR_L = "M3.4 5.4h2.3v4.4H8v4.4h2.3";
  const STAIR_R = "M20.6 5.4h-2.3v4.4H16v4.4h-2.3";
  const SPREAD_ARROW = "M12 6.8v10.4M9.4 9.4L12 6.8l2.6 2.6M9.4 14.6l2.6 2.6 2.6-2.6";
  const BROKEN_L = "M9.6 4.47A8.4 8.4 0 0 0 11.3 21.1";
  const BROKEN_R = "M12.7 2.9A8.4 8.4 0 0 1 14.4 19.53";
  const CRACK = "M12.7 2.9l-2.1 5.7 3 3.4-3.2 4 .9 5.1";
  const CUP = "M3.5 10.4v3.4a6 6 0 0 0 6 6h5a6 6 0 0 0 6-6v-3.4";
  const LEVER_BEAM = "M3 19l18-10";
  const FULCRUM = "M8.4 16.8l2.4 3.6H6z";
  const CYCLE_ARCS = "M4 8.2A9 9 0 0 1 19.6 7.2M20 15.8A9 9 0 0 1 4.4 16.8";
  const CYCLE_HEADS = "M19.9 3.9v3.4h-3.4M4.1 20.1v-3.4h3.4";
  const CYCLE_HEADS_F = "M19.9 3.9v3.4h-1.2M4.1 20.1v-3.4h1.2";
  const FUNDING_SLASH = "M15.3 8.7l-6.6 6.6";
  const PNL_UP = "M4.6 12.6V4.8a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v7.8";
  const PNL_DOWN = "M14.2 12.6v5.6a1.2 1.2 0 0 0 1.2 1.2h2.8a1.2 1.2 0 0 0 1.2-1.2v-5.6";
  const BREAK_SHAFT = "M5 19L19.5 4.5";
  const BREAK_HEAD = "M12.3 4.5h7.2v7.2";
  const DCA_TIMELINE = "M3 15.4h18M5 15.4v3M12 15.4v3M19 15.4v3";
  const BOT_ANTENNA = "M12 8V5";
  const BOT_EYES = "M9.2 12.4v3.2M14.8 12.4v3.2";
  const SIGNAL_TREND = "M3.2 20.2l4.2-5 2.8 3L14 10";
  const SIGNAL_INNER = "M14.8 5.47A4.6 4.6 0 0 1 18.53 9.2";
  const SIGNAL_OUTER = "M15.92 2.85A7.4 7.4 0 0 1 21.15 8.08";
  const BELL = "M12 3.2a6.2 6.2 0 0 0-6.2 6.2v3.5c0 .9-.3 1.75-.85 2.45l-.75.95c-.4.5-.05 1.2.6 1.2h14.4c.65 0 1-.7.6-1.2l-.75-.95a3.9 3.9 0 0 1-.85-2.45V9.4A6.2 6.2 0 0 0 12 3.2z";
  const BELL_CLAPPER = "M9.8 20.4a2.4 2.4 0 0 0 4.4 0";
  const BELL_TICK = "M9.2 13.6l2.8-3.4 2.8 3.4";
  const SLIP_PLAN = "M2.8 5.4h18.4";
  const SLIP_PATH = "M3.2 5.4c7 0 11.4 5 16.4 13.6M19.6 12.9V19h-6.1";
  const GRID_BUY = "M7.4 14.9l2 3.1h-4z";
  const GRID_SELL = "M16.6 9.1l-2-3.1h4z";
  const WATCH_STAR = "M15.8 9.4l1.64 3.38 3.72.53-2.7 2.6.64 3.71-3.3-1.75-3.3 1.75.64-3.71-2.7-2.6 3.72-.53z";
  const WATCH_LINES = "M3.4 4.6h17.2M3.4 10.4h5.6M3.4 16.2h3.4";
  const TRADING = {
    long: {
      o: circle(12, 12, 9) + p(LONG),
      f: disc(12, 12, 9) + knock(LONG)
    },
    short: {
      o: circle(12, 12, 9) + p(SHORT),
      f: disc(12, 12, 9) + knock(SHORT)
    },
    "stop-loss": {
      o: p(OCTAGON) + p(STOP_ARROW),
      f: solid(OCTAGON) + knock(STOP_ARROW)
    },
    "take-profit": {
      o: p("M19.2 11.2A8.4 8.4 0 1 1 12.8 4.8") + dot(11, 13, 1.7) + p("M11 13l6-6M17 7V3.2M17 7h3.8"),
      f: disc(11, 13, 7.9) + knockRing(11, 13, 3.8) + knock("M11 13l5.6-5.6") + p("M18.4 5.6V2.6M18.4 5.6h3")
    },
    "limit-order": {
      o: p(LIMIT_TAG) + dot(12, 7.8, 1.3) + p("M2.6 19.6h18.8"),
      f: solid(LIMIT_TAG) + knockDot(12, 7.8, 1.4) + p("M2.6 19.6h18.8")
    },
    "market-order": {
      o: circle(12, 12, 9) + p(MARKET_CHEVRONS),
      f: disc(12, 12, 9) + knock(MARKET_CHEVRONS)
    },
    "order-book": {
      o: p("M10.2 4.2H6.7M10.2 9.4H5.5M10.2 14.6H4.2M10.2 19.8H3") + p("M13.8 4.2H21M13.8 9.4h6M13.8 14.6h4.7M13.8 19.8h3.5"),
      f: p("M10.2 4.2H6.7M10.2 9.4H5.5M10.2 14.6H4.2M10.2 19.8H3") + faint("M13.8 4.2H21M13.8 9.4h6M13.8 14.6h4.7M13.8 19.8h3.5")
    },
    "depth-chart": {
      o: p(STAIR_L) + p(STAIR_R) + p("M3.4 18.6h17.2"),
      f: solid(STAIR_L + "v4.4H3.4z") + softArea(STAIR_R + "v4.4h6.9z")
    },
    spread: {
      o: p("M13.4 3.8H21M3 20.2h7.6") + p(SPREAD_ARROW),
      f: bar(13, 2.4, 8.6, 3, 1.2) + bar(2.4, 18.6, 8.6, 3, 1.2) + p(SPREAD_ARROW)
    },
    liquidation: {
      o: p(BROKEN_L) + p(BROKEN_R) + p(CRACK),
      f: solid("M10.2 4.37L8.3 8.6l3 3.4-3.2 4 .9 4.78A8.4 8.4 0 0 1 10.2 4.37z") + solid("M15 3.22A8.4 8.4 0 0 1 13.6 19.65L12.7 16l3.2-4-3-3.4z")
    },
    margin: {
      o: p(CUP) + coinO(12, 8.6, 4.8),
      f: solid(CUP + "z") + knockDot(12, 8.6, 6.9) + coinF(12, 8.6, 4.4)
    },
    leverage: {
      o: circle(15.6, 6.4, 3.2) + p(LEVER_BEAM) + solid(FULCRUM),
      f: disc(15.6, 6.4, 3.2) + p(LEVER_BEAM) + solid(FULCRUM)
    },
    "funding-rate": {
      o: p(CYCLE_ARCS) + p(CYCLE_HEADS) + p(FUNDING_SLASH) + dot(8.9, 8.9, 1.3) + dot(15.1, 15.1, 1.3),
      f: dot(12, 12, 6.6) + p(CYCLE_ARCS) + p(CYCLE_HEADS_F) + knock("M14.9 9.1l-5.8 5.8") + knockDot(9.2, 9.2, 1.25) + knockDot(14.8, 14.8, 1.25)
    },
    pnl: {
      o: p("M3.5 12.6h17") + p(PNL_UP) + p(PNL_DOWN),
      f: solid(PNL_UP + "z") + softArea(PNL_DOWN + "z") + p("M3.5 12.6h17")
    },
    "candles-up": {
      o: rect(3.2, 13.4, 4.2, 5, 1.3) + p("M5.3 10.8v2.6M5.3 18.4v2.4") + rect(9.9, 8.8, 4.2, 6, 1.3) + p("M12 6v2.8M12 14.8v3") + rect(16.6, 4.6, 4.2, 6.2, 1.3) + p("M18.7 2.6v2M18.7 10.8v3"),
      f: rectF(3.2, 13.4, 4.2, 5, 1.3) + p("M5.3 10.8v2.6M5.3 18.4v2.4") + rectF(9.9, 8.8, 4.2, 6, 1.3) + p("M12 6v2.8M12 14.8v3") + rectF(16.6, 4.6, 4.2, 6.2, 1.3) + p("M18.7 2.6v2M18.7 10.8v3")
    },
    "candles-down": {
      o: rect(3.2, 4.6, 4.2, 6.2, 1.3) + p("M5.3 2.6v2M5.3 10.8v3") + rect(9.9, 8.8, 4.2, 6, 1.3) + p("M12 6v2.8M12 14.8v3") + rect(16.6, 13.4, 4.2, 5, 1.3) + p("M18.7 10.8v2.6M18.7 18.4v2.4"),
      f: rectF(3.2, 4.6, 4.2, 6.2, 1.3) + p("M5.3 2.6v2M5.3 10.8v3") + rectF(9.9, 8.8, 4.2, 6, 1.3) + p("M12 6v2.8M12 14.8v3") + rectF(16.6, 13.4, 4.2, 5, 1.3) + p("M18.7 10.8v2.6M18.7 18.4v2.4")
    },
    "volume-bars": {
      o: p("M4.2 20.6v-8.6M9.4 20.6V6.8M14.6 20.6v-6.8M19.8 20.6V3.6"),
      f: bar(2.4, 11.2, 3.6, 10.3, 1.1) + bar(7.6, 6, 3.6, 15.5, 1.1) + bar(12.8, 13, 3.6, 8.5, 1.1) + bar(18, 2.8, 3.6, 18.7, 1.1)
    },
    breakout: {
      o: faint("M2.8 12h18.4") + p(BREAK_SHAFT) + p(BREAK_HEAD),
      f: p("M2.8 12h18.4") + halo(BREAK_SHAFT) + p(BREAK_SHAFT) + solid("M12.3 4.5h7.2v7.2z")
    },
    "grid-strategy": {
      o: p("M3.5 6h17M3.5 12h17M3.5 18h17") + solid(GRID_BUY) + solid(GRID_SELL),
      f: p("M3.5 6h17M3.5 12h17M3.5 18h17") + solid("M7.4 13.6l3 4.4h-6z") + solid("M16.6 10.4l-3-4.4h6z")
    },
    "dca-strategy": {
      o: dot(5, 7.6, 2.6) + dot(12, 7.6, 2.6) + dot(19, 7.6, 2.6) + p(DCA_TIMELINE),
      f: dot(5, 7.6, 3.1) + dot(12, 7.6, 3.1) + dot(19, 7.6, 3.1) + p(DCA_TIMELINE)
    },
    "trading-bot": {
      o: rect(4, 8, 16, 12.4, 4) + p(BOT_ANTENNA) + dot(12, 3.8, 1.5) + p(BOT_EYES),
      f: rectF(4, 8, 16, 12.4, 4) + p(BOT_ANTENNA) + dot(12, 3.8, 1.5) + knock(BOT_EYES)
    },
    signal: {
      o: p(SIGNAL_TREND) + dot(14, 10, 2.4) + p(SIGNAL_INNER) + faint(SIGNAL_OUTER, 0.45),
      f: p(SIGNAL_TREND) + dot(14, 10, 3.1) + p(SIGNAL_INNER) + p(SIGNAL_OUTER)
    },
    "alert-price": {
      o: p(BELL) + p(BELL_CLAPPER) + p(BELL_TICK),
      f: solid(BELL) + p(BELL_CLAPPER) + knock(BELL_TICK)
    },
    slippage: {
      o: faint(SLIP_PLAN) + p(SLIP_PATH),
      f: `<path d="M3.2 5.4c7 0 11.4 5 16.4 13.6V5.4z" fill="currentColor" stroke="none" opacity=".32"/>` + p(SLIP_PLAN) + p(SLIP_PATH)
    },
    watchlist: {
      o: p(WATCH_LINES) + p(WATCH_STAR),
      f: p(WATCH_LINES) + solid(WATCH_STAR)
    }
  };
  const HEX = "M10.9 3.3a2.2 2.2 0 0 1 2.2 0l6 3.45a2.2 2.2 0 0 1 1.1 1.9v6.7a2.2 2.2 0 0 1-1.1 1.9l-6 3.45a2.2 2.2 0 0 1-2.2 0l-6-3.45a2.2 2.2 0 0 1-1.1-1.9v-6.7a2.2 2.2 0 0 1 1.1-1.9z";
  const CUBE_EDGES = "M4.3 7.6L12 12l7.7-4.4M12 12v8.9";
  const HEX_CHECK = "M8 12.2l2.8 2.8 5.2-5.8";
  const CHAIN_LINKS = "M7.6 16.4l2.3-2.3M14.1 9.9l2.3-2.3";
  const HASH_GRID = "M9.6 8v8M14.4 8v8M8 9.6h8M8 14.4h8";
  const NODE_SPOKES = "M12 10.8V5.3M14.94 15.9l4.66 2.7M9.06 15.9L4.4 18.6";
  const PUMP = "M4.2 20.8V5.8a2.6 2.6 0 0 1 2.6-2.6h5a2.6 2.6 0 0 1 2.6 2.6v15";
  const PUMP_HOSE = "M14.4 12.6h1.5a1.9 1.9 0 0 1 1.9 1.9v2.4a1.7 1.7 0 0 0 3.4 0V9.4a1.9 1.9 0 0 0-.55-1.35L17.8 5.2";
  const HOURGLASS = "M7 3.9h10a1.2 1.2 0 0 1 1.2 1.2c0 3-1.8 5-3.8 6.9 2 1.9 3.8 3.9 3.8 6.9a1.2 1.2 0 0 1-1.2 1.2H7a1.2 1.2 0 0 1-1.2-1.2c0-3 1.8-5 3.8-6.9-2-1.9-3.8-3.9-3.8-6.9A1.2 1.2 0 0 1 7 3.9z";
  const RECEIPT = "M7.2 3.3h9.6a2 2 0 0 1 2 2v15.4l-3.4-2.2-3.4 2.2-3.4-2.2-3.4 2.2V5.3a2 2 0 0 1 2-2z";
  const RECEIPT_ARROW = "M8.4 11h7M12.4 8l3 3-3 3";
  const ARC_DONE = "M14.4 3.33A9 9 0 0 1 20.71 14.25M18.31 18.42A9 9 0 0 1 5.69 18.42";
  const ARC_NEXT = "M3.29 14.25A9 9 0 0 1 9.6 3.33";
  const CONFIRM_CHECK = "M8 12.3l2.8 2.8 5.2-5.8";
  const BRIDGE_DECK = "M2.6 5.6h18.8";
  const BRIDGE_ARCH = "M4.6 5.6v13M19.4 5.6v13M4.6 15.9a7.4 7.4 0 0 1 14.8 0";
  const SWAP_WAVE = "M3.6 12c2.8-3 5.6-3 8.4 0s5.6 3 8.4 0";
  const SWAP_WAVE_SHORT = "M8.2 12c1.27-1.5 2.53-1.5 3.8 0s2.53 1.5 3.8 0";
  const DROP = "M12 2.8c3.7 4.1 6.9 7.6 6.9 11.4a6.9 6.9 0 0 1-13.8 0c0-3.8 3.2-7.3 6.9-11.4z";
  const DROP_LEVEL = "M5.1 14.2c2.3-2 4.6-2 6.9 0s4.6 2 6.9 0";
  const TRAY = "M3.5 15.8v.8a4 4 0 0 0 4 4h9a4 4 0 0 0 4-4v-.8";
  const STAKE_DOWN = "M17.4 3.4V13M14.8 10.4l2.6 2.6 2.6-2.6";
  const STAKE_UP = "M17.4 13V3.4M14.8 6l2.6-2.6L20 6";
  const LEAF_L = "M12 11.4c0-3-2.4-5-6.6-5 0 3.2 2.4 5 6.6 5z";
  const LEAF_R = "M12 8.8c0-3.2 2.4-5.6 6.6-5.8 0 3.8-2.4 5.8-6.6 5.8z";
  const HALF_COIN = "M4 21a8 8 0 0 1 16 0";
  const HALF_COIN_ARC = "M7.6 21a4.4 4.4 0 0 1 4.4-4.4";
  const LEND_OUT = "M3.6 18.6h16.8M17.8 16l2.6 2.6-2.6 2.6";
  const LEND_IN = "M20.4 18.6H3.6M6.2 16l-2.6 2.6 2.6 2.6";
  const VAULT_TICK = "M14.12 9.18l1.7-1.7";
  const VAULT_FEET = "M7.4 19.6v1.6M16.6 19.6v1.6";
  const BALLOT_BOX = "M3.4 15h17.2v3.2a2.6 2.6 0 0 1-2.6 2.6H6a2.6 2.6 0 0 1-2.6-2.6z";
  const BALLOT_SHEET = "M7 15V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10";
  const BALLOT_CHECK = "M9.2 8.6l2 2 3.6-4";
  const CANOPY = "M3.2 10.6a8.8 7.6 0 0 1 17.6 0c-1.9-2-3.96-2-5.87 0-1.9-2-3.96-2-5.87 0-1.9-2-3.96-2-5.86 0z";
  const CHUTE_LINES = "M3.2 10.6l6.6 4.4M20.8 10.6l-6.6 4.4";
  const PICK_HEAD = "M6.6 5.2C11.6 2.4 17 3 18.9 5.1c2.1 1.9 2.7 7.3-.1 12.3-.6-4.2-2-7-3.9-8.9S10.8 5.8 6.6 5.2z";
  const PICK_HANDLE = "M14.4 9.6L3.8 20.2";
  const ART_FRAME = "M7 3.5h8.4l5.1 5.1V17a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5z";
  const ART_RIDGE = "M7.6 17l4.6-5.8 4.6 5.8";
  const NET_ARROWS = "M6.8 8.4C8.6 4.8 13 4.6 16 7.6M16 4.6v3h-3M17.2 15.6c-1.8 3.6-6.2 3.8-9.2.8M8 19.4v-3h3";
  const CHAIN = {
    block: { o: p(HEX) + p(CUBE_EDGES), f: solid(HEX) + knock(CUBE_EDGES) },
    blockchain: {
      o: rect(3, 16, 5, 5, 1.6) + rect(9.5, 9.5, 5, 5, 1.6) + rect(16, 3, 5, 5, 1.6) + p(CHAIN_LINKS),
      f: rectF(3, 16, 5, 5, 1.6) + rectF(9.5, 9.5, 5, 5, 1.6) + rectF(16, 3, 5, 5, 1.6) + p(CHAIN_LINKS)
    },
    hash: {
      o: rect(3.5, 3.5, 17, 17, 4.4) + p(HASH_GRID),
      f: rectF(3.5, 3.5, 17, 17, 4.4) + knock(HASH_GRID)
    },
    node: {
      o: circle(12, 14.2, 3.4) + p(NODE_SPOKES) + dot(12, 5.3, 1.9) + dot(19.6, 18.6, 1.9) + dot(4.4, 18.6, 1.9),
      f: disc(12, 14.2, 3.4) + p(NODE_SPOKES) + dot(12, 5.3, 2.4) + dot(19.6, 18.6, 2.4) + dot(4.4, 18.6, 2.4)
    },
    validator: { o: p(HEX) + p(HEX_CHECK), f: solid(HEX) + knock(HEX_CHECK) },
    "gas-fee": {
      o: p(PUMP) + p("M2.8 20.8h13M7.4 8.6h4.2") + p(PUMP_HOSE),
      f: solid(PUMP + "z") + p("M2.8 20.8h13") + knock("M7.4 8.6h4.2") + p(PUMP_HOSE)
    },
    mempool: {
      o: p(HOURGLASS) + dot(9.6, 7, 1.4) + dot(14.4, 7, 1.4) + dot(12, 9.7, 1.4) + dot(12, 14.6, 1.4),
      f: solid(HOURGLASS) + knockDot(9.6, 7, 1.4) + knockDot(14.4, 7, 1.4) + knockDot(12, 9.7, 1.4) + knockDot(12, 14.6, 1.4)
    },
    transaction: {
      o: p(RECEIPT) + p(RECEIPT_ARROW),
      f: solid(RECEIPT) + knock(RECEIPT_ARROW)
    },
    confirmations: {
      o: p(ARC_DONE) + faint(ARC_NEXT, 0.32) + p(CONFIRM_CHECK),
      f: p(ARC_DONE) + faint(ARC_NEXT, 0.32) + dot(12, 12, 5.2) + knock("M9.4 12.1l1.8 1.8 3.4-3.7")
    },
    bridge: {
      o: p(BRIDGE_DECK) + p(BRIDGE_ARCH),
      f: solid("M3.6 5.6h16.8v13h-2.8V16a5.6 5.6 0 0 0-11.2 0v2.6H3.6z") + p(BRIDGE_DECK)
    },
    "swap-pool": {
      o: p(CYCLE_ARCS) + p(CYCLE_HEADS) + p(SWAP_WAVE),
      f: dot(12, 12, 6.2) + p(CYCLE_ARCS) + p(CYCLE_HEADS_F) + knock(SWAP_WAVE_SHORT)
    },
    "liquidity-pool": {
      o: p(DROP) + p(DROP_LEVEL),
      f: softArea(DROP) + solid(DROP_LEVEL + "a6.9 6.9 0 0 1-13.8 0z")
    },
    staking: {
      o: coinO(8, 8.4, 5) + p(STAKE_DOWN) + p(TRAY),
      f: coinF(8, 8.4, 5) + p(STAKE_DOWN) + solid(TRAY + "z")
    },
    unstaking: {
      o: coinO(8, 8.4, 5) + p(STAKE_UP) + p(TRAY),
      f: coinF(8, 8.4, 5) + p(STAKE_UP) + solid(TRAY + "z")
    },
    "yield-farm": {
      o: p(HALF_COIN) + p(HALF_COIN_ARC) + p("M12 13V8.8") + p(LEAF_L) + p(LEAF_R),
      f: solid(HALF_COIN + "z") + knock(HALF_COIN_ARC) + p("M12 13V8.8") + solid(LEAF_L) + solid(LEAF_R)
    },
    lending: {
      o: coinO(9.6, 8.1, 5.4) + p(LEND_OUT),
      f: coinF(9.6, 8.1, 5.4) + p(LEND_OUT)
    },
    borrow: {
      o: coinO(9.6, 8.1, 5.4) + p(LEND_IN),
      f: coinF(9.6, 8.1, 5.4) + p(LEND_IN)
    },
    vault: {
      o: rect(3.2, 3, 17.6, 16.6, 3.8) + circle(12, 11.3, 3) + p(VAULT_TICK) + p(VAULT_FEET),
      f: rectF(3.2, 3, 17.6, 16.6, 3.8) + knockRing(12, 11.3, 3) + knock(VAULT_TICK) + p(VAULT_FEET)
    },
    "governance-vote": {
      o: p(BALLOT_BOX) + p(BALLOT_SHEET) + p(BALLOT_CHECK),
      f: solid(BALLOT_BOX) + solid("M9 3h6a2 2 0 0 1 2 2v7.2H7V5a2 2 0 0 1 2-2z") + knock(BALLOT_CHECK)
    },
    airdrop: {
      o: p(CANOPY) + p(CHUTE_LINES) + dot(12, 19, 2.7),
      f: solid(CANOPY) + p(CHUTE_LINES) + dot(12, 19, 2.7)
    },
    mining: {
      o: p(PICK_HEAD) + p(PICK_HANDLE),
      f: solid(PICK_HEAD) + p(PICK_HANDLE)
    },
    nft: {
      o: p(ART_FRAME) + p(ART_RIDGE) + dot(9.2, 8.8, 1.5),
      f: solid(ART_FRAME) + knock(ART_RIDGE) + knockDot(9.2, 8.8, 1.5)
    },
    token: {
      o: coinO(12, 12, 9),
      f: coinF(12, 12, 9)
    },
    stablecoin: {
      o: coinO(12, 10.7, 6.5) + p("M3 19.5h18"),
      f: coinF(12, 10.7, 6.5) + p("M3 19.5h18")
    },
    "network-switch": {
      o: circle(5.4, 12, 2.8) + circle(18.6, 12, 2.8) + p(NET_ARROWS),
      f: disc(5.4, 12, 2.8) + disc(18.6, 12, 2.8) + p(NET_ARROWS)
    }
  };
  const PURSE = "M6.5 6.4h11a3.5 3.5 0 0 1 3.5 3.5v7.2a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 17.1V9.9a3.5 3.5 0 0 1 3.5-3.5z";
  const PURSE_BROKEN = "M21 9.6a3.5 3.5 0 0 0-3.5-3.2h-11A3.5 3.5 0 0 0 3 9.9v7.2a3.5 3.5 0 0 0 3.5 3.5h4.1";
  const FLAP = "M6 6.4l9.3-3a1.8 1.8 0 0 1 2.3 1.7v1.3";
  const SHIELD = "M12 2.9l7.6 2.75v5.75c0 4.65-3.05 8-7.6 9.7-4.55-1.7-7.6-5.05-7.6-9.7V5.65z";
  const BUBBLE = "M12 3.6c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.9 0-1.8-.1-2.6-.3L5.2 20.6c-.4.2-.9-.1-.8-.6l.5-3.2C3.7 15.4 3 13.4 3 11.3c0-4.3 4-7.7 9-7.7z";
  const SIGN_BUBBLE = "M6.4 3.8h11.2a3.4 3.4 0 0 1 3.4 3.4v7a3.4 3.4 0 0 1-3.4 3.4H11.4l-3.3 2.5c-.4.3-.9 0-.9-.5v-2h-.8A3.4 3.4 0 0 1 3 14.2v-7a3.4 3.4 0 0 1 3.4-3.4z";
  const SIGNATURE = "M7 11.8c2.6-.8 6-3 6-4.8 0-1.4-2-1.2-2.4.6-.4 1.9.4 3.8 2 3.8 1.4 0 1.8-1.2 3.8-1.2";
  const PAGE = "M6.8 2.9h7.4l5 5v11a2.2 2.2 0 0 1-2.2 2.2H6.8a2.2 2.2 0 0 1-2.2-2.2V5.1a2.2 2.2 0 0 1 2.2-2.2z";
  const FLAME_SMALL = "M12.5 8.4c.2 2.4 3.1 3.6 3.1 6.2a3.6 3.6 0 0 1-7.2 0c0-2.5 2.3-3.4 4.1-6.2z";
  const ASTERISK = "M12 9.25v8.5M8.32 11.38l7.36 4.25M15.68 11.38l-7.36 4.25";
  const SEED_ROWS = "M11 12h4.6M11 15h4.6M11 18h4.6";
  const KEY_SHAFT = "M11.8 10.2l7.4-7.4M16 6l2.6 2.6M13.8 8.2l1.8 1.8";
  const FISH = "M7.2 11.6c2-3.6 5.8-3.6 7.6 0l2-2v4l-2-2c-1.8 3.6-5.6 3.6-7.6 0z";
  const SEND_ARROW = "M14.6 14.2H17a2 2 0 0 0 2-2V3M16.8 5.2L19 3l2.2 2.2";
  const CHIP_DASHES = "M13.4 10.1h4.4M13.4 13.9h2.6";
  const PERCENT = "M14.9 11.4l-5.8 5.8";
  const LOOP_BACK = "M3.6 12a8.4 8.4 0 1 0 2.5-6L3.6 8.4M3.6 3.8v4.6h4.6";
  const SMALL_STAR = "M18.1 3.1l.94 2.41 2.58.15-2 1.63.65 2.5-2.17-1.39-2.17 1.39.65-2.5-2-1.63 2.58-.15z";
  const REBALANCE_A = "M4.21 7.5A9 9 0 0 1 19.79 7.5M20.62 4.41L19.79 7.5 16.7 6.67";
  const REBALANCE_B = "M20.99 12.31A9 9 0 0 1 10.44 20.86";
  const REBALANCE_C = "M6.21 18.89A9 9 0 0 1 3 12";
  const WHITELIST_LINES = "M7.6 7.8h8.8M7.6 11.4h4.4";
  const WHITELIST_CHECK = "M7.8 15.4l2.6 2.4 5.8-6";
  const HISTORY_RAIL = "M6 7.5v1.8M6 14.7v1.8";
  const HISTORY_DASHES = "M11 4.8h9M11 12h9M11 19.2h9";
  const EARN_CHEVRON = "M7.4 14.2L12 9.6l4.6 4.6";
  const WALLET = {
    "crypto-wallet": {
      o: p(PURSE_BROKEN) + p(FLAP) + coinO(16.6, 15.6, 4.4),
      f: solid(PURSE) + p(FLAP) + knockDot(16.6, 15.6, 6.5) + coinF(16.6, 15.6, 4.4)
    },
    "cold-storage": {
      o: p(PURSE) + p(FLAP) + p(ASTERISK),
      f: solid(PURSE) + p(FLAP) + knock(ASTERISK)
    },
    "hot-wallet": {
      o: p(PURSE) + p(FLAP) + `<path d="${FLAME_SMALL}" fill="currentColor" stroke="none"/>`,
      f: solid(PURSE) + p(FLAP) + knockF(FLAME_SMALL)
    },
    "seed-phrase": {
      o: p(PAGE) + p("M14 3v5h5") + dot(8, 12, 1.3) + dot(8, 15, 1.3) + dot(8, 18, 1.3) + p(SEED_ROWS),
      f: solid(PAGE) + knock("M14 3v5h5") + knockDot(8, 12, 1.3) + knockDot(8, 15, 1.3) + knockDot(8, 18, 1.3) + knock(SEED_ROWS)
    },
    "private-key": {
      o: circle(9.4, 12.6, 3.4) + p(KEY_SHAFT) + dot(7.5, 19.8, 1.35) + dot(12, 19.8, 1.35) + dot(16.5, 19.8, 1.35),
      f: disc(9.4, 12.6, 3.4) + knockDot(9.4, 12.6, 1.2) + p(KEY_SHAFT) + dot(7.5, 19.8, 1.35) + dot(12, 19.8, 1.35) + dot(16.5, 19.8, 1.35)
    },
    "public-address": {
      o: rect(2.9, 6.9, 18.2, 10.2, 5.1) + circle(8, 12, 2.6) + p(CHIP_DASHES),
      f: rectF(2.9, 6.9, 18.2, 10.2, 5.1) + knockRing(8, 12, 2.6) + knock(CHIP_DASHES)
    },
    "address-book": {
      o: rect(5.4, 3, 15.2, 18, 3.2) + p("M3.2 8.4h3.6M3.2 15.6h3.6") + circle(13, 9.6, 2) + p("M9.6 16.4c.4-1.8 1.8-2.8 3.4-2.8s3 1 3.4 2.8"),
      f: rectF(5.4, 3, 15.2, 18, 3.2) + p("M3.2 8.4h3.6M3.2 15.6h3.6") + knockRing(13, 9.6, 2) + knock("M9.6 16.4c.4-1.8 1.8-2.8 3.4-2.8s3 1 3.4 2.8")
    },
    "receive-qr": {
      o: rect(3.6, 3.6, 6.8, 6.8, 1.1) + dot(7, 7, 1.05) + rect(13.6, 3.6, 6.8, 6.8, 1.1) + dot(17, 7, 1.05) + rect(3.6, 13.6, 6.8, 6.8, 1.1) + dot(7, 17, 1.05) + p("M17 13.6v6.8M13.9 17.3l3.1 3.1 3.1-3.1"),
      f: rectF(3.6, 3.6, 6.8, 6.8, 1.1) + knockDot(7, 7, 1.2) + rectF(13.6, 3.6, 6.8, 6.8, 1.1) + knockDot(17, 7, 1.2) + rectF(3.6, 13.6, 6.8, 6.8, 1.1) + knockDot(7, 17, 1.2) + p("M17 13.6v6.8M13.9 17.3l3.1 3.1 3.1-3.1")
    },
    "send-crypto": {
      o: coinO(8.6, 14.2, 6) + p(SEND_ARROW),
      f: coinF(8.6, 14.2, 6) + p(SEND_ARROW)
    },
    multisig: {
      o: circle(7, 6.6, 3.4) + p("M7 10v11.2M7 15.6H4.4M7 19.6H4.4") + circle(17, 6.6, 3.4) + p("M17 10v11.2M17 15.6h2.6M17 19.6h2.6"),
      f: disc(7, 6.6, 3.4) + knockDot(7, 6.6, 1.1) + p("M7 10v11.2M7 15.6H4.4M7 19.6H4.4") + disc(17, 6.6, 3.4) + knockDot(17, 6.6, 1.1) + p("M17 10v11.2M17 15.6h2.6M17 19.6h2.6")
    },
    "two-factor": {
      o: rect(6.2, 2.8, 11.6, 18.4, 3.2) + p("M9 11l2.2 2.2 3.8-4.4") + p("M10.6 18h2.8"),
      f: rectF(6.2, 2.8, 11.6, 18.4, 3.2) + knock("M9 11l2.2 2.2 3.8-4.4") + knock("M10.6 18h2.8")
    },
    whitelist: {
      o: rect(3.5, 3, 17, 18, 4) + p(WHITELIST_LINES) + p(WHITELIST_CHECK),
      f: rectF(3.5, 3, 17, 18, 4) + knock(WHITELIST_LINES) + knock(WHITELIST_CHECK)
    },
    kyc: {
      o: rect(2.8, 5, 18.4, 14, 3.4) + circle(8.4, 10.2, 1.9) + p("M5.4 15.8c.3-1.5 1.5-2.3 3-2.3s2.7.8 3 2.3") + p("M14.6 10h3M14.6 14h3"),
      f: rectF(2.8, 5, 18.4, 14, 3.4) + knockRing(8.4, 10.2, 1.9) + knock("M5.4 15.8c.3-1.5 1.5-2.3 3-2.3s2.7.8 3 2.3") + knock("M14.6 10h3M14.6 14h3")
    },
    "proof-of-reserves": {
      o: p("M8.4 5.2l2.4 2.4 4.6-5") + bar(4.5, 10.2, 16, 3) + bar(3.5, 14.5, 16, 3) + bar(4.5, 18.8, 16, 3),
      f: scaled("M8.4 5.5l2.4 2.3 4.6-4.8", 1.5) + bar(4.5, 10.2, 16, 3) + bar(3.5, 14.5, 16, 3) + bar(4.5, 18.8, 16, 3)
    },
    "audit-check": {
      o: circle(10.7, 10.7, 6.9) + p("M15.8 15.8l4.8 4.8") + p("M7.8 10.9l2.1 2.1 3.7-4.2"),
      f: disc(10.7, 10.7, 6.9) + p("M15.8 15.8l4.8 4.8") + knock("M7.8 10.9l2.1 2.1 3.7-4.2")
    },
    "scam-warning": {
      o: p(BUBBLE) + p("M12 7.6v4.4") + dot(12, 15, 1.2),
      f: solid(BUBBLE) + knock("M12 7.6v4.4") + knockDot(12, 15, 1.2)
    },
    "phishing-shield": {
      o: p(SHIELD) + p(FISH),
      f: solid(SHIELD) + knockF(FISH)
    },
    recovery: {
      o: p(LOOP_BACK) + dot(12, 10.6, 1.8) + p("M12 11v3.8"),
      f: dot(12, 12, 6.2) + p("M3.6 12a8.4 8.4 0 1 0 2.5-6L3.6 8.4M3.6 3.8v4.6h1.4") + knockDot(12, 10.6, 1.8) + knock("M12 11v3.4")
    },
    "sign-message": {
      o: p(SIGN_BUBBLE) + p(SIGNATURE) + p("M8.4 14.4h7.2"),
      f: solid(SIGN_BUBBLE) + knock(SIGNATURE) + knock("M8.4 14.4h7.2")
    },
    "tx-history": {
      o: p(HISTORY_RAIL) + scaled("M6 2.8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM6 17.2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z", 0.8) + p(HISTORY_DASHES),
      f: p("M6 4.8v14.4") + dot(6, 4.8, 2.7) + dot(6, 12, 2.7) + dot(6, 19.2, 2.7) + p(HISTORY_DASHES)
    },
    "portfolio-rebalance": {
      o: p(REBALANCE_A) + p(REBALANCE_B) + p(REBALANCE_C),
      f: solid("M5.28 7.47A8.1 8.1 0 0 1 18.55 7.24L18.39 9.67 16.45 8.77A5.5 5.5 0 0 0 7.44 8.92z") + `<path d="M20.08 12.57A8.1 8.1 0 0 1 10.87 20.02L11.23 17.45A5.5 5.5 0 0 0 17.49 12.38z" fill="currentColor" opacity=".6"/>` + softArea("M7.24 18.55A8.1 8.1 0 0 1 3.9 11.72L6.5 11.81A5.5 5.5 0 0 0 8.77 16.45z")
    },
    "tax-report": {
      o: p(PAGE) + p("M14 3v5h5") + p(PERCENT) + dot(9.6, 12, 1.15) + dot(14.4, 16.6, 1.15),
      f: solid(PAGE) + knock("M14 3v5h5") + knock(PERCENT) + knockDot(9.6, 12, 1.15) + knockDot(14.4, 16.6, 1.15)
    },
    "referral-reward": {
      o: circle(9, 8.4, 3.7) + p("M2.8 20.4c.45-3.3 3-5.3 6.2-5.3s5.75 2 6.2 5.3") + `<path d="${SMALL_STAR}" fill="currentColor" stroke-width=".7"/>`,
      f: disc(9, 8.4, 3.7) + solid("M2.8 20.4c.45-3.3 3-5.3 6.2-5.3s5.75 2 6.2 5.3z") + `<path d="${SMALL_STAR}" fill="currentColor" stroke-width=".7"/>`
    },
    earn: {
      o: circle(12, 12, 9) + p(EARN_CHEVRON),
      f: disc(12, 12, 9) + knock(EARN_CHEVRON)
    },
    "on-ramp": {
      o: p("M3 19h18v-9z") + circle(10.43, 8.86, 3.6),
      f: solid("M3 19h18v-9z") + disc(10.43, 8.86, 3.6)
    }
  };
  Object.assign(CK.ICONS, TRADING, CHAIN, WALLET);
  CK.CRYPTO_ICONS = {
    trading: Object.keys(TRADING),
    chain: Object.keys(CHAIN),
    wallet: Object.keys(WALLET)
  };
})();
