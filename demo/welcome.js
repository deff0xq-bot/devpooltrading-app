(function() {
  "use strict";
  const { icon, t: tx } = CK;
  const { L } = CK.i18n;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  CK.i18n.add({
    "welcome.aria": ["\u0417\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u043E \u0441 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C", "App tour", "\u0417\u043D\u0430\u0439\u043E\u043C\u0441\u0442\u0432\u043E \u0456\u0437 \u0437\u0430\u0441\u0442\u043E\u0441\u0443\u043D\u043A\u043E\u043C", "\u049A\u043E\u0441\u044B\u043C\u0448\u0430\u043C\u0435\u043D \u0442\u0430\u043D\u044B\u0441\u0443"],
    "welcome.slide": ["{n} \u0438\u0437 {count}", "{n} of {count}", "{n} \u0437 {count}", "{count} \u0456\u0448\u0456\u043D\u0435\u043D {n}"],
    "welcome.next": ["\u0414\u0430\u043B\u0435\u0435", "Next", "\u0414\u0430\u043B\u0456", "\u04D8\u0440\u0456 \u049B\u0430\u0440\u0430\u0439"],
    "welcome.start": ["\u041D\u0430\u0447\u0430\u0442\u044C", "Start", "\u041F\u043E\u0447\u0430\u0442\u0438", "\u0411\u0430\u0441\u0442\u0430\u0443"],
    "welcome.skip": ["\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C", "Skip", "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u0438", "\u04E8\u0442\u043A\u0456\u0437\u0456\u043F \u0436\u0456\u0431\u0435\u0440\u0443"],
    "welcome.fee": ["\u041A\u043E\u043C\u0438\u0441\u0441\u0438\u044F", "Fee", "\u041A\u043E\u043C\u0456\u0441\u0456\u044F", "\u041A\u043E\u043C\u0438\u0441\u0441\u0438\u044F"],
    "welcome.walletTitle": ["\u041A\u043E\u0448\u0435\u043B\u0451\u043A \u0432 Telegram", "A wallet in Telegram", "\u0413\u0430\u043C\u0430\u043D\u0435\u0446\u044C \u0443 Telegram", "Telegram-\u0434\u0430\u0493\u044B \u04D9\u043C\u0438\u044F\u043D"],
    "welcome.walletText": ["TON, Ethereum, Solana \u0438 Tron \u0432 \u043E\u0434\u043D\u043E\u043C \u043C\u0435\u0441\u0442\u0435", "TON, Ethereum, Solana and Tron in one place", "TON, Ethereum, Solana \u0456 Tron \u0432 \u043E\u0434\u043D\u043E\u043C\u0443 \u043C\u0456\u0441\u0446\u0456", "TON, Ethereum, Solana \u0436\u04D9\u043D\u0435 Tron \u0431\u0456\u0440 \u0436\u0435\u0440\u0434\u0435"],
    "welcome.swapTitle": ["\u041E\u0431\u043C\u0435\u043D \u0432 \u043E\u0434\u0438\u043D \u0448\u0430\u0433", "Swap in one step", "\u041E\u0431\u043C\u0456\u043D \u0432 \u043E\u0434\u0438\u043D \u043A\u0440\u043E\u043A", "\u0411\u0456\u0440 \u049B\u0430\u0434\u0430\u043C\u0434\u0430 \u0430\u0439\u044B\u0440\u0431\u0430\u0441"],
    "welcome.swapText": ["\u041A\u043E\u043C\u0438\u0441\u0441\u0438\u044E \u0432\u0438\u0434\u043D\u043E \u0434\u043E \u043F\u043E\u0434\u043F\u0438\u0441\u0438", "See the fee before you sign", "\u041A\u043E\u043C\u0456\u0441\u0456\u044E \u0432\u0438\u0434\u043D\u043E \u0434\u043E \u043F\u0456\u0434\u043F\u0438\u0441\u0443", "\u041A\u043E\u043C\u0438\u0441\u0441\u0438\u044F \u049B\u043E\u043B \u049B\u043E\u0439\u043C\u0430\u0439 \u0442\u04B1\u0440\u044B\u043F \u043A\u04E9\u0440\u0456\u043D\u0435\u0434\u0456"],
    "welcome.ordersTitle": ["\u0421\u0442\u043E\u043F-\u043B\u043E\u0441\u0441 \u0438\xA0\u0442\u0435\u0439\u043A-\u043F\u0440\u043E\u0444\u0438\u0442", "Stop-loss and\xA0take-profit", "\u0421\u0442\u043E\u043F-\u043B\u043E\u0441 \u0456\xA0\u0442\u0435\u0439\u043A-\u043F\u0440\u043E\u0444\u0456\u0442", "\u0421\u0442\u043E\u043F-\u043B\u043E\u0441\u0441 \u0436\u04D9\u043D\u0435\xA0\u0442\u0435\u0439\u043A-\u043F\u0440\u043E\u0444\u0438\u0442"],
    "welcome.ordersText": ["\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u0446\u0435\u043D\u0443, \u043F\u0440\u043E\u0434\u0430\u0436\u0430 \u0441\u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441\u0430\u043C\u0430", "Set a price and the sale runs by itself", "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u0446\u0456\u043D\u0443, \u043F\u0440\u043E\u0434\u0430\u0436 \u0441\u043F\u0440\u0430\u0446\u044E\u0454 \u0441\u0430\u043C", "\u0411\u0430\u0493\u0430\u043D\u044B \u049B\u043E\u0439\u044B\u04A3\u044B\u0437, \u0441\u0430\u0442\u0443 \u04E9\u0437\u0456 \u043E\u0440\u044B\u043D\u0434\u0430\u043B\u0430\u0434\u044B"],
    "welcome.alertsTitle": ["\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0446\u0435\u043D\u0435", "Price alerts", "\u0421\u043F\u043E\u0432\u0456\u0449\u0435\u043D\u043D\u044F \u043F\u0440\u043E \u0446\u0456\u043D\u0443", "\u0411\u0430\u0493\u0430 \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430\u043B\u0430\u0440\u044B"],
    "welcome.alertsText": ["\u0411\u043E\u0442 \u043D\u0430\u043F\u0438\u0448\u0435\u0442, \u043A\u043E\u0433\u0434\u0430 \u0446\u0435\u043D\u0430 \u0434\u043E\u0439\u0434\u0451\u0442 \u0434\u043E \u0446\u0435\u043B\u0438", "The bot writes when the price gets there", "\u0411\u043E\u0442 \u043D\u0430\u043F\u0438\u0448\u0435, \u043A\u043E\u043B\u0438 \u0446\u0456\u043D\u0430 \u0434\u0456\u0439\u0434\u0435 \u0434\u043E \u043C\u0435\u0442\u0438", "\u0411\u0430\u0493\u0430 \u043C\u0435\u0436\u0435\u0433\u0435 \u0436\u0435\u0442\u043A\u0435\u043D\u0434\u0435 \u0431\u043E\u0442 \u0436\u0430\u0437\u0430\u0434\u044B"],
    "welcome.chequesTitle": ["\u0427\u0435\u043A\u0438 \u0438 \u0441\u0447\u0435\u0442\u0430", "Checks and invoices", "\u0427\u0435\u043A\u0438 \u0442\u0430 \u0440\u0430\u0445\u0443\u043D\u043A\u0438", "\u0427\u0435\u043A\u0442\u0435\u0440 \u043C\u0435\u043D \u0448\u043E\u0442\u0442\u0430\u0440"],
    "welcome.chequesText": ["\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u043C\u043E\u043D\u0435\u0442\u044B \u0441\u0441\u044B\u043B\u043A\u043E\u0439 \u0438 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0439\u0442\u0435 \u043E\u043F\u043B\u0430\u0442\u0443", "Send coins by link and get paid", "\u041D\u0430\u0434\u0441\u0438\u043B\u0430\u0439\u0442\u0435 \u043C\u043E\u043D\u0435\u0442\u0438 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F\u043C \u0456 \u043F\u0440\u0438\u0439\u043C\u0430\u0439\u0442\u0435 \u043E\u043F\u043B\u0430\u0442\u0443", "\u041C\u043E\u043D\u0435\u0442\u0430\u043B\u0430\u0440\u0434\u044B \u0441\u0456\u043B\u0442\u0435\u043C\u0435\u043C\u0435\u043D \u0436\u0456\u0431\u0435\u0440\u0456\u043F, \u0442\u04E9\u043B\u0435\u043C \u049B\u0430\u0431\u044B\u043B\u0434\u0430\u04A3\u044B\u0437"],
    "welcome.inviteTitle": ["\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0430\u0439\u0442\u0435 \u0434\u0440\u0443\u0437\u0435\u0439", "Invite friends", "\u0417\u0430\u043F\u0440\u043E\u0448\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0437\u0456\u0432", "\u0414\u043E\u0441\u0442\u0430\u0440\u0434\u044B \u0448\u0430\u049B\u044B\u0440\u044B\u04A3\u044B\u0437"],
    "welcome.inviteText": ["\u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0441\u0432\u043E\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u0432 \u0447\u0430\u0442", "Send your link to a chat", "\u041D\u0430\u0434\u0456\u0448\u043B\u0456\u0442\u044C \u0441\u0432\u043E\u0454 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0432 \u0447\u0430\u0442", "\u0421\u0456\u043B\u0442\u0435\u043C\u0435\u04A3\u0456\u0437\u0434\u0456 \u0447\u0430\u0442\u049B\u0430 \u0436\u0456\u0431\u0435\u0440\u0456\u04A3\u0456\u0437"],

    "welcome.inviteShare": ["\u0412\u0430\u043C {share} \u043D\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438 \u0441 \u0438\u0445 \u043E\u0431\u043C\u0435\u043D\u043E\u0432 \u0432 TON", "You get {share} of our fee on their TON swaps", "\u0412\u0430\u043C {share} \u043D\u0430\u0448\u043E\u0457 \u043A\u043E\u043C\u0456\u0441\u0456\u0457 \u0437 \u0457\u0445\u043D\u0456\u0445 \u043E\u0431\u043C\u0456\u043D\u0456\u0432 \u0443 TON", "\u041E\u043B\u0430\u0440\u0434\u044B\u04A3 TON-\u0434\u0430\u0493\u044B \u0430\u0439\u044B\u0440\u0431\u0430\u0441\u0442\u0430\u0440\u044B\u043D\u0430\u043D \u0431\u0456\u0437\u0434\u0456\u04A3 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u044F\u043D\u044B\u04A3 {share} \u0441\u0456\u0437\u0433\u0435"]
  });
  const CLOUD_KEY = "welcome";
  const LOCAL_KEY = "ck-welcome";
  const SEEN = "1";
  const CLOUD_WAIT_MS = 2500;
  const SDK_WAIT_MS = 1500;
  const WALLET_WAIT_MS = 4e3;
  const POLL_MS = 100;
  const FLICK = 380;
  const TURN_SHARE = 0.22;
  const TRACK = { stiffness: 170, damping: 26.077, ms: 560 };
  const PARTS_DELAY = 70;
  const WORDS_DELAY = 150;
  const M = () => CK.motion || null;
  const reduced = () => {
    const m = M();
    if (m) return !!m.reduce;
    return !!(CK.reducedMotion && CK.reducedMotion());
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function localSeen() {
    try {
      return localStorage.getItem(LOCAL_KEY) === SEEN;
    } catch (_) {
      return false;
    }
  }
  function keepLocal() {
    try {
      localStorage.setItem(LOCAL_KEY, SEEN);
    } catch (_) {
    }
  }
  function cloud() {
    const app = CK.tg && CK.tg.app;
    try {
      return app && app.CloudStorage && typeof app.isVersionAtLeast === "function" && app.isVersionAtLeast("6.9") ? app.CloudStorage : null;
    } catch (_) {
      return null;
    }
  }
  async function sdkCloud() {
    const until = Date.now() + SDK_WAIT_MS;
    while (!cloud() && CK.tg && CK.tg.inside && !CK.tg.app && Date.now() < until) await wait(POLL_MS);
    return cloud();
  }
  function cloudSeen(store) {
    if (!store) return Promise.resolve(null);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), CLOUD_WAIT_MS);
      const answer = (v) => {
        clearTimeout(timer);
        resolve(v);
      };
      try {
        store.getItem(CLOUD_KEY, (err, value) => answer(err ? null : value === SEEN));
      } catch (_) {
        answer(null);
      }
    });
  }
  function keepCloud() {
    const store = cloud();
    try {
      if (store) store.setItem(CLOUD_KEY, SEEN, () => {
      });
    } catch (_) {
    }
  }
  function remember() {
    keepLocal();
    keepCloud();
  }
  async function hadWallet() {
    const W = CK.wallet;
    if (!W) return null;
    let settled = false;
    if (W.ready && typeof W.ready.then === "function") W.ready.then(() => {
      settled = true;
    }, () => {
      settled = true;
    });
    const until = Date.now() + WALLET_WAIT_MS;
    for (; ; ) {
      const had = W.hadAtLaunch;
      if (had === true || had === false) return had;
      if (settled || Date.now() >= until) return null;
      await wait(POLL_MS);
    }
  }
  async function decide(o) {
    if (localSeen()) return false;
    const seen = await cloudSeen(await sdkCloud());
    if (seen === true) {
      keepLocal();
      return false;
    }
    if (o.newcomersOnly !== false && await hadWallet() === true) {
      keepLocal();
      return false;
    }
    return !localSeen();
  }
  const part = (cls, inner) => `<div class="wc-part ${cls}" data-wc-part>${inner || ""}</div>`;
  const bar = (cls) => `<i class="wc-bar ${cls || ""}"></i>`;
  const lines = (a, b) => `<span class="wc-lines">${bar(a)}${bar(b)}</span>`;
  const coin = (id, sym, size) => CK.coinLogo ? CK.coinLogo({ id, sym }, size) : `<span class="coin" aria-hidden="true"></span>`;
  const ART = {

    wallet: () => part("wc-blob wc-wallet-blob") + part("wc-disc wc-wallet-disc", icon("wallet", { fill: true, size: 46 })) + part("wc-coin wc-wallet-ton", coin("ton", "GRAM", 52)) + part("wc-coin wc-wallet-eth", coin("eth", "ETH", 44)) + part("wc-coin wc-wallet-sol", coin("sol", "SOL", 44)) + part("wc-coin wc-wallet-trx", coin("trx", "TRX", 52)),

    swap: () => part("wc-card wc-row wc-swap-a", coin("usdt", "USDT", 40) + lines("wc-bar--strong wc-w64", "wc-w92") + bar("wc-bar--strong wc-w44 wc-bar--end")) + part("wc-card wc-row wc-swap-b", coin("ton", "GRAM", 40) + lines("wc-bar--strong wc-w56", "wc-w80") + bar("wc-bar--strong wc-w52 wc-bar--end")) + part("wc-disc wc-disc--ring wc-swap-flip", icon("swap-circle", { size: 22 })) + part("wc-fee wc-swap-fee", `${icon("percent", { size: 18 })}<span class="wc-fee-label" ${L("welcome.fee")}>${CK.esc(tx("welcome.fee"))}</span>${bar("wc-bar--accent wc-w44 wc-bar--end")}`) + part("wc-swipe wc-swap-swipe", `<span class="wc-swipe-knob">${icon("chevron-right", { size: 22 })}</span>${bar("wc-bar--accent wc-w92")}`),

    orders: () => part("wc-card wc-orders-card", `<svg class="wc-chart" viewBox="0 0 248 200" aria-hidden="true" focusable="false"><line class="wc-level wc-level--take" x1="16" y1="48" x2="232" y2="48"/><line class="wc-level wc-level--stop" x1="16" y1="160" x2="232" y2="160"/><defs><linearGradient id="wc-area-fill" x1="0" y1="0" x2="0" y2="1"><stop class="wc-area-top" offset="0"/><stop class="wc-area-end" offset="1"/></linearGradient></defs><path class="wc-area" d="M0 128C24 116 46 136 72 120S104 86 126 98 158 132 180 108 214 70 232 76V200H0Z"/><path class="wc-line" data-motion-line d="M0 128C24 116 46 136 72 120S104 86 126 98 158 132 180 108 214 70 232 76"/></svg><i class="wc-chart-dot"></i>`) + part("wc-pill wc-pill--take wc-orders-take", `<span ${L("orders.take")}>${CK.esc(tx("orders.take"))}</span>`) + part("wc-pill wc-pill--stop wc-orders-stop", `<span ${L("orders.stop")}>${CK.esc(tx("orders.stop"))}</span>`),

    alerts: () => part("wc-disc wc-alerts-bell", icon("bell", { fill: true, size: 42 })) + part("wc-badge wc-alerts-badge", icon("arrow-up", { size: 15 })) + part("wc-card wc-row wc-bubble wc-alerts-msg", `<span class="wc-avatar">${CK.logoMark ? CK.logoMark(22) : ""}</span>${lines("wc-bar--strong wc-w80", "wc-w104")}<span class="wc-up">${icon("arrow-up-right", { size: 16 })}</span>`),

    cheques: () => part("wc-card wc-sheetcard wc-cheq-back", `<span class="wc-disc wc-disc--soft wc-disc--sm">${icon("doc", { size: 20 })}</span>${lines("wc-bar--strong wc-w88", "wc-w64")}`) + part("wc-card wc-sheetcard wc-card--accent wc-cheq-front", `<span class="wc-disc wc-disc--on wc-disc--sm">${icon("gift", { size: 20 })}</span>${lines("wc-bar--on wc-w96", "wc-bar--on-soft wc-w56")}`) + part("wc-disc wc-disc--soft wc-disc--ring wc-cheq-link", icon("link", { size: 20 })),

    invite: () => part("wc-face wc-face--friend tile--purple wc-inv-a", icon("person", { fill: true, size: 30 })) + part("wc-face wc-face--friend tile--green wc-inv-b", icon("person", { fill: true, size: 30 })) + part("wc-face wc-inv-me", icon("person", { fill: true, size: 38 })) + part("wc-card wc-row wc-inv-link", `<span class="wc-disc wc-disc--soft wc-disc--sm">${icon("link", { size: 20 })}</span>${lines("wc-bar--strong wc-w92", "wc-w64")}<span class="wc-disc wc-disc--sm wc-bar--end">${icon("telegram-plane", { size: 18 })}</span>`)
  };
  const SLIDES = [
    { id: "wallet", title: "welcome.walletTitle", text: "welcome.walletText" },
    { id: "swap", title: "welcome.swapTitle", text: "welcome.swapText" },
    { id: "orders", title: "welcome.ordersTitle", text: "welcome.ordersText" },
    { id: "alerts", title: "welcome.alertsTitle", text: "welcome.alertsText" },
    { id: "cheques", title: "welcome.chequesTitle", text: "welcome.chequesText" },
    { id: "invite", title: "welcome.inviteTitle", text: "welcome.inviteText" }
  ];
  function markup() {
    const n = SLIDES.length;
    const slides = SLIDES.map((s, i) => `
        <section class="wc-slide" data-wc-slide="${s.id}" role="group" aria-roledescription="slide" aria-label="${CK.esc(tx("welcome.slide", { n: i + 1, count: n }))}"${i ? ' aria-hidden="true"' : ""}>
          <div class="wc-art" aria-hidden="true"><div class="wc-stage">${ART[s.id]()}</div></div>
          <div class="wc-words">
            <h2 class="wc-title" data-motion="row" ${L(s.title)}>${CK.esc(tx(s.title))}</h2>
            <p class="wc-text" data-motion="row" ${L(s.text)}>${CK.esc(tx(s.text))}</p>
          </div>
        </section>`).join("");
    return `
      <div class="welcome" role="dialog" aria-modal="true" aria-label="${CK.esc(tx("welcome.aria"))}" data-i18n-aria="welcome.aria" tabindex="-1">
        <div class="wc-top"><button class="wc-skip press" type="button" data-wc="skip" ${L("welcome.skip")}>${CK.esc(tx("welcome.skip"))}</button></div>
        <div class="wc-viewport"><div class="wc-track">${slides}</div></div>
        <div class="wc-foot">
          <div class="wc-dots" aria-hidden="true"><span class="wc-dot-ind"></span>${'<i class="wc-dot"></i>'.repeat(n)}</div>
          <button class="btn btn--wide wc-next" type="button" data-wc="next"><span class="wc-next-label" ${L("welcome.next")}>${CK.esc(tx("welcome.next"))}</span></button>
        </div>
      </div>`;
  }
  let current = null;
  function open() {
    if (current) return current.closed;
    const host = document.getElementById("app");
    if (!host) return Promise.resolve({ done: false, slide: 0 });
    remember();
    const root = CK.el(markup());
    const viewport = $(".wc-viewport", root), track = $(".wc-track", root);
    const slides = $$(".wc-slide", root);
    const nextBtn = $('[data-wc="next"]', root), skipBtn = $('[data-wc="skip"]', root);
    const label = $(".wc-next-label", root), ind = $(".wc-dot-ind", root);
    const stage = document.getElementById("stage");
    const before = document.activeElement;
    let index = 0, pos = 0, slideAnim = null, closing = false, finish;
    const closed = new Promise((resolve) => {
      finish = resolve;
    });
    const hidStage = !!stage && stage.getAttribute("aria-hidden") !== "true";
    if (hidStage) stage.setAttribute("aria-hidden", "true");
    host.appendChild(root);
    const width = () => viewport.clientWidth || host.clientWidth || 1;
    const place = (x) => {
      pos = x;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    };
    function shownX() {
      if (!slideAnim || slideAnim.playState === "finished" || slideAnim.playState === "idle") return pos;
      try {
        return new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
      } catch (_) {
        return pos;
      }
    }
    function stopSlide() {
      if (!slideAnim) return;
      const x = shownX();
      try {
        slideAnim.cancel();
      } catch (_) {
      }
      slideAnim = null;
      place(x);
    }
    function moveTo(i) {
      const from = shownX(), to = -i * width();
      stopSlide();
      place(to);
      if (reduced() || Math.abs(from - to) < 0.5 || typeof track.animate !== "function") return;
      const m2 = M();
      const easing = m2 ? m2.springEasing(TRACK.stiffness, TRACK.damping) : "cubic-bezier(.22, 1, .36, 1)";
      try {
        slideAnim = track.animate([{ transform: `translate3d(${from.toFixed(2)}px, 0, 0)` }, { transform: `translate3d(${to.toFixed(2)}px, 0, 0)` }], { duration: TRACK.ms, easing });
      } catch (_) {
        slideAnim = null;
      }
    }
    const EXTRA = {
      orders(slide) {
        const m2 = M();
        if (m2) m2.chart($(".wc-chart", slide), { force: true, delay: PARTS_DELAY });
        const dot = $(".wc-chart-dot", slide);
        if (dot && !reduced() && typeof dot.animate === "function") {
          dot.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "none" }], { duration: TRACK.ms, delay: PARTS_DELAY + 820, easing: m2 ? m2.springEasing(TRACK.stiffness, TRACK.damping) : "ease-out", fill: "backwards" });
        }
      },
      alerts(slide) {
        const bell = $(".wc-alerts-bell .icon", slide);
        if (!bell || reduced() || typeof bell.animate !== "function") return;
        bell.animate([
          { transform: "rotate(0deg)" },
          { transform: "rotate(16deg)", offset: 0.18 },
          { transform: "rotate(-12deg)", offset: 0.38 },
          { transform: "rotate(7deg)", offset: 0.58 },
          { transform: "rotate(-3deg)", offset: 0.78 },
          { transform: "rotate(0deg)" }
        ], { duration: 820, delay: PARTS_DELAY + 380, easing: "ease-in-out" });
      },
      swap(slide) {
        const knob = $(".wc-swipe-knob", slide);
        if (!knob || reduced() || typeof knob.animate !== "function") return;
        knob.animate([{ transform: "none" }, { transform: "translate3d(14px, 0, 0)", offset: 0.45 }, { transform: "none" }], { duration: 900, delay: PARTS_DELAY + 640, easing: "cubic-bezier(.45, 0, .2, 1)" });
      }
    };
    function enter(i) {
      const slide = slides[i], m2 = M();
      if (!slide || !m2) return;
      m2.blocks($$("[data-wc-part]", slide), { force: true, fresh: true, delay: PARTS_DELAY });
      m2.rows([$(".wc-title", slide), $(".wc-text", slide)], { force: true, fresh: true, delay: WORDS_DELAY });
      const extra = EXTRA[SLIDES[i].id];
      if (extra) extra(slide);
    }
    function paintFoot(i, from) {
      const last = i === slides.length - 1;
      const key = last ? "welcome.start" : "welcome.next";
      if (label.getAttribute("data-i18n") !== key) {
        CK.i18n.setKey(label, key);
        const m3 = M();
        if (m3 && from != null) m3.rows([label], { force: true, fresh: true });
      }
      skipBtn.classList.toggle("is-gone", last);
      skipBtn.tabIndex = last ? -1 : 0;
      skipBtn.setAttribute("aria-hidden", last ? "true" : "false");
      const m2 = M();
      if (m2) m2.indicator(ind, from == null ? null : from, i, { force: true });
      else ind.style.transform = `translate3d(${i * 100}%, 0, 0)`;
    }
    function go(i, o) {
      const next = Math.max(0, Math.min(slides.length - 1, i));
      const from = index;
      if (next === index) {
        moveTo(index);
        return;
      }
      index = next;
      slides.forEach((s, k) => s.setAttribute("aria-hidden", k === index ? "false" : "true"));
      moveTo(index);
      paintFoot(index, from);
      enter(index);
      if (!(o && o.quiet) && CK.haptic) CK.haptic.selection();
    }
    function close(done) {
      if (closing) return;
      closing = true;
      current = null;
      window.removeEventListener("resize", onResize);
      const out = () => {
        root.remove();
        if (hidStage && !(CK.sheet && CK.sheet.top)) stage.removeAttribute("aria-hidden");
        try {
          if (before && before.isConnected && typeof before.focus === "function") before.focus({ preventScroll: true });
        } catch (_) {
        }
        finish({ done: !!done, slide: index });
      };
      if (typeof root.animate !== "function") {
        out();
        return;
      }
      let a = null;
      try {
        a = root.animate(
          reduced() ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.98)" }],
          { duration: reduced() ? 120 : 240, easing: "cubic-bezier(.32, .72, 0, 1)", fill: "forwards" }
        );
      } catch (_) {
        a = null;
      }
      if (a && a.finished) a.finished.then(out, out);
      else out();
    }
    nextBtn.addEventListener("click", () => {
      if (closing) return;
      if (index >= slides.length - 1) {
        if (CK.haptic) CK.haptic.light();
        close(true);
      } else go(index + 1);
    });
    skipBtn.addEventListener("click", () => {
      if (!closing) close(false);
    });
    root.addEventListener("keydown", (e) => {
      if (closing) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
        return;
      }
      if (e.key === "Tab") {
        const stops = [skipBtn, nextBtn].filter((b) => b.tabIndex >= 0);
        const at = stops.indexOf(document.activeElement);
        e.preventDefault();
        stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
      }
    });
    if (CK.drag) {
      let base = 0;
      CK.drag(viewport, {
        axis: "x",
        filter: () => !closing,
        onStart() {
          stopSlide();
          base = pos;
        },
        onMove(s) {
          const w = width();
          let x = base + s.dx;
          const min = -(slides.length - 1) * w;
          if (x > 0) x /= 3;
          else if (x < min) x = min + (x - min) / 3;
          place(x);
        },
        onEnd(s, cancelled) {
          if (cancelled) {
            moveTo(index);
            return;
          }
          const w = width();
          const moved = -(pos + index * w) / w;
          let to = index;
          if (s.v < -FLICK || moved > TURN_SHARE) to = index + 1;
          else if (s.v > FLICK || moved < -TURN_SHARE) to = index - 1;
          go(to);
        }
      });
    }
    function onResize() {
      stopSlide();
      place(-index * width());
    }
    window.addEventListener("resize", onResize);
    const inviteText = $('[data-wc-slide="invite"] .wc-text', root);
    if (inviteText && window.DemoFees && typeof DemoFees.loadFacts === "function") {
      Promise.resolve().then(() => DemoFees.loadFacts()).then((f) => {
        if (!f || !f.server || !(f.refShareBps > 0) || !inviteText.isConnected) return;
        const paint = () => {
          inviteText.textContent = tx("welcome.inviteShare", { share: DemoFees.pctOf(f.refShareBps) });
        };
        inviteText.removeAttribute("data-i18n");
        paint();
        CK.i18n.bind(inviteText, paint);
      }).catch(() => {
      });
    }
    place(0);
    paintFoot(0, null);
    if (typeof root.animate === "function") {
      try {
        root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced() ? 120 : 240, easing: "ease-out" });
      } catch (_) {
      }
    }
    enter(0);
    const m = M();
    if (m) m.blocks([skipBtn, $(".wc-dots", root), nextBtn], { force: true, fresh: true, delay: WORDS_DELAY + 60 });
    try {
      nextBtn.focus({ preventScroll: true });
    } catch (_) {
    }
    current = {
      root,
      closed,
      get index() {
        return index;
      },
      go: (i) => go(i),
      close: () => close(false)
    };
    return closed;
  }
  let decided = null;
  function maybeShow(opts) {
    if (current) return Promise.resolve(false);
    if (!decided) {
      decided = decide(opts || {}).catch(() => false).then((show) => {
        if (show && !current) open();
        return !!show;
      });
    }
    return decided;
  }
  window.DemoWelcome = {
    open,
    maybeShow,
    get isOpen() {
      return !!current;
    },

    get view() {
      return current;
    },
    SLIDES: SLIDES.map((s) => s.id),
    CLOUD_KEY,
    LOCAL_KEY
  };
})();
