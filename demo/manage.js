(function() {
  "use strict";
  const { icon, t: tx } = CK;
  const T = CK.ton;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = CK.esc;
  const W = () => window.DemoWallet;
  CK.i18n.add({
    "manage.open": ["\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435", "Manage", "\u041A\u0435\u0440\u0443\u0432\u0430\u043D\u043D\u044F", "\u0411\u0430\u0441\u049B\u0430\u0440\u0443"],
    "manage.assets": ["\u0410\u043A\u0442\u0438\u0432\u044B", "Assets", "\u0410\u043A\u0442\u0438\u0432\u0438", "\u0410\u043A\u0442\u0438\u0432\u0442\u0435\u0440"],
    "manage.pinned": ["\u0417\u0430\u043A\u0440\u0435\u043F\u043B\u0451\u043D\u043D\u044B\u0435", "Pinned", "\u0417\u0430\u043A\u0440\u0456\u043F\u043B\u0435\u043D\u0456", "\u0411\u0435\u043A\u0456\u0442\u0456\u043B\u0433\u0435\u043D\u0434\u0435\u0440"],
    "manage.all": ["\u0412\u0441\u0435 \u0430\u043A\u0442\u0438\u0432\u044B", "All assets", "\u0423\u0441\u0456 \u0430\u043A\u0442\u0438\u0432\u0438", "\u0411\u0430\u0440\u043B\u044B\u049B \u0430\u043A\u0442\u0438\u0432\u0442\u0435\u0440"],
    "manage.pin": ["\u0417\u0430\u043A\u0440\u0435\u043F\u0438\u0442\u044C", "Pin", "\u0417\u0430\u043A\u0440\u0456\u043F\u0438\u0442\u0438", "\u0411\u0435\u043A\u0456\u0442\u0443"],
    "manage.unpin": ["\u041E\u0442\u043A\u0440\u0435\u043F\u0438\u0442\u044C", "Unpin", "\u0412\u0456\u0434\u043A\u0440\u0456\u043F\u0438\u0442\u0438", "\u0411\u043E\u0441\u0430\u0442\u0443"],
    "manage.hide": ["\u0421\u043A\u0440\u044B\u0442\u044C", "Hide", "\u041F\u0440\u0438\u0445\u043E\u0432\u0430\u0442\u0438", "\u0416\u0430\u0441\u044B\u0440\u0443"],
    "manage.show": ["\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C", "Show", "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438", "\u041A\u04E9\u0440\u0441\u0435\u0442\u0443"],
    "manage.move": ["\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C", "Reorder", "\u041F\u0435\u0440\u0435\u043C\u0456\u0441\u0442\u0438\u0442\u0438", "\u041E\u0440\u043D\u044B\u043D \u0430\u0443\u044B\u0441\u0442\u044B\u0440\u0443"],
    "manage.allHidden": ["\u0412\u0441\u0435 \u0430\u043A\u0442\u0438\u0432\u044B \u0441\u043A\u0440\u044B\u0442\u044B", "All assets are hidden", "\u0423\u0441\u0456 \u0430\u043A\u0442\u0438\u0432\u0438 \u043F\u0440\u0438\u0445\u043E\u0432\u0430\u043D\u0456", "\u0411\u0430\u0440\u043B\u044B\u049B \u0430\u043A\u0442\u0438\u0432\u0442\u0435\u0440 \u0436\u0430\u0441\u044B\u0440\u044B\u043B\u0493\u0430\u043D"],
    "history.sent": ["\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E", "Sent", "\u041D\u0430\u0434\u0456\u0441\u043B\u0430\u043D\u043E", "\u0416\u0456\u0431\u0435\u0440\u0456\u043B\u0434\u0456"],
    "history.received": ["\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E", "Received", "\u041E\u0442\u0440\u0438\u043C\u0430\u043D\u043E", "\u0410\u043B\u044B\u043D\u0434\u044B"],
    "history.swaps": ["\u041E\u0431\u043C\u0435\u043D\u044B", "Swaps", "\u041E\u0431\u043C\u0456\u043D\u0438", "\u0410\u0439\u044B\u0440\u0431\u0430\u0441\u0442\u0430\u0440"],
    "history.spam": ["\u0421\u043F\u0430\u043C", "Spam", "\u0421\u043F\u0430\u043C", "\u0421\u043F\u0430\u043C"],
    "history.emptySpam": ["\u0421\u043F\u0430\u043C\u0430 \u043D\u0435\u0442", "No spam", "\u0421\u043F\u0430\u043C\u0443 \u043D\u0435\u043C\u0430\u0454", "\u0421\u043F\u0430\u043C \u0436\u043E\u049B"],
    "history.spamNote": ["\u041F\u043E\u0445\u043E\u0436\u0435 \u043D\u0430 \u0441\u043F\u0430\u043C. \u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u043D\u0430 \u044D\u0442\u043E\u0442 \u0430\u0434\u0440\u0435\u0441", "Looks like spam. Send nothing to this address", "\u0421\u0445\u043E\u0436\u0435 \u043D\u0430 \u0441\u043F\u0430\u043C. \u041D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u043D\u0430\u0434\u0441\u0438\u043B\u0430\u0439\u0442\u0435 \u043D\u0430 \u0446\u044E \u0430\u0434\u0440\u0435\u0441\u0443", "\u0421\u043F\u0430\u043C\u0493\u0430 \u04B1\u049B\u0441\u0430\u0439\u0434\u044B. \u0411\u04B1\u043B \u043C\u0435\u043A\u0435\u043D\u0436\u0430\u0439\u0493\u0430 \u0435\u0448\u0442\u0435\u04A3\u0435 \u0436\u0456\u0431\u0435\u0440\u043C\u0435\u04A3\u0456\u0437"],
    "month.1": ["\u042F\u043D\u0432\u0430\u0440\u044C", "January", "\u0421\u0456\u0447\u0435\u043D\u044C", "\u049A\u0430\u04A3\u0442\u0430\u0440"],
    "month.2": ["\u0424\u0435\u0432\u0440\u0430\u043B\u044C", "February", "\u041B\u044E\u0442\u0438\u0439", "\u0410\u049B\u043F\u0430\u043D"],
    "month.3": ["\u041C\u0430\u0440\u0442", "March", "\u0411\u0435\u0440\u0435\u0437\u0435\u043D\u044C", "\u041D\u0430\u0443\u0440\u044B\u0437"],
    "month.4": ["\u0410\u043F\u0440\u0435\u043B\u044C", "April", "\u041A\u0432\u0456\u0442\u0435\u043D\u044C", "\u0421\u04D9\u0443\u0456\u0440"],
    "month.5": ["\u041C\u0430\u0439", "May", "\u0422\u0440\u0430\u0432\u0435\u043D\u044C", "\u041C\u0430\u043C\u044B\u0440"],
    "month.6": ["\u0418\u044E\u043D\u044C", "June", "\u0427\u0435\u0440\u0432\u0435\u043D\u044C", "\u041C\u0430\u0443\u0441\u044B\u043C"],
    "month.7": ["\u0418\u044E\u043B\u044C", "July", "\u041B\u0438\u043F\u0435\u043D\u044C", "\u0428\u0456\u043B\u0434\u0435"],
    "month.8": ["\u0410\u0432\u0433\u0443\u0441\u0442", "August", "\u0421\u0435\u0440\u043F\u0435\u043D\u044C", "\u0422\u0430\u043C\u044B\u0437"],
    "month.9": ["\u0421\u0435\u043D\u0442\u044F\u0431\u0440\u044C", "September", "\u0412\u0435\u0440\u0435\u0441\u0435\u043D\u044C", "\u049A\u044B\u0440\u043A\u04AF\u0439\u0435\u043A"],
    "month.10": ["\u041E\u043A\u0442\u044F\u0431\u0440\u044C", "October", "\u0416\u043E\u0432\u0442\u0435\u043D\u044C", "\u049A\u0430\u0437\u0430\u043D"],
    "month.11": ["\u041D\u043E\u044F\u0431\u0440\u044C", "November", "\u041B\u0438\u0441\u0442\u043E\u043F\u0430\u0434", "\u049A\u0430\u0440\u0430\u0448\u0430"],
    "month.12": ["\u0414\u0435\u043A\u0430\u0431\u0440\u044C", "December", "\u0413\u0440\u0443\u0434\u0435\u043D\u044C", "\u0416\u0435\u043B\u0442\u043E\u049B\u0441\u0430\u043D"]
  });
  const motion = () => window.CK && CK.motion ? CK.motion : null;
  const PREFS_PREFIX = "ck-assets:";
  const PREFS_MAX = 300;
  const keyOf = (h) => `${h.coin.id}${h.net ? "@" + h.net : ""}`;
  const cleanKeys = (list) => Array.isArray(list) ? Array.from(new Set(list.filter((k) => typeof k === "string" && k.length > 0 && k.length <= 200))).slice(0, PREFS_MAX) : [];
  const memo =   new Map();
  function prefsOf(address) {
    if (!address) return { pin: [], hide: [], show: [] };
    if (memo.has(address)) return memo.get(address);
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(PREFS_PREFIX + address) || "null");
    } catch (_) {
      raw = null;
    }
    const p = { pin: cleanKeys(raw && raw.pin), hide: cleanKeys(raw && raw.hide), show: cleanKeys(raw && raw.show) };
    memo.set(address, p);
    return p;
  }
  function savePrefs(address, p) {
    const next = { pin: cleanKeys(p.pin), hide: cleanKeys(p.hide), show: cleanKeys(p.show) };
    memo.set(address, next);
    try {
      localStorage.setItem(PREFS_PREFIX + address, JSON.stringify(next));
    } catch (_) {
    }
    return next;
  }
  const quietByDefault = (h) => h.risk === "suspicious" || !!h.coin.isToken && !h.priced;
  const flagged = (h) => h.risk === "suspicious";
  function hiddenBy(p, h) {
    const k = keyOf(h);
    if (!flagged(h) && p.pin.includes(k)) return false;
    if (p.hide.includes(k)) return true;
    if (p.show.includes(k)) return false;
    return quietByDefault(h);
  }
  const pinnedBy = (p, h) => !flagged(h) && p.pin.includes(keyOf(h));
  function arrange(holdings, address, opts) {
    const p = prefsOf(address);
    const small = !!(opts && opts.small);
    const pinned = [], rest = [];
    let hidden = 0;
    holdings.forEach((h) => {
      if (hiddenBy(p, h)) {
        hidden += 1;
        return;
      }
      if (pinnedBy(p, h)) pinned.push(h);
      else if (!(small && h.priced && h.usd < 1)) rest.push(h);
    });
    pinned.sort((a, b) => p.pin.indexOf(keyOf(a)) - p.pin.indexOf(keyOf(b)));
    return { rows: pinned.concat(rest), hidden };
  }
  function openManage(ctx) {
    if (CK.sheet.top || !ctx || !ctx.address) return;
    const address = ctx.address;
    const nameHtml = (h) => flagged(h) ? `<span>${esc(tx("portfolio.unknownToken"))}</span>` : `<span>${esc(h.coin.name)}</span>`;
    const amountText = (h) => `${D.qty(h.amount)}${flagged(h) ? "" : " " + h.coin.sym}`;
    const pinBtn = (on) => `<button class="mg-btn mg-pin${on ? " is-on" : ""}" type="button" data-act="pin" aria-pressed="${on}" aria-label="${esc(tx(on ? "manage.unpin" : "manage.pin"))}">${icon("pin", { size: 22, fill: on })}</button>`;
    const eyeBtn = (shown) => `<button class="mg-btn mg-eye${shown ? " is-on" : ""}" type="button" data-act="eye" aria-pressed="${!shown}" aria-label="${esc(tx(shown ? "manage.hide" : "manage.show"))}">${icon(shown ? "eye" : "eye-off", { size: 22 })}</button>`;
    function rowHtml(h, kind, p) {
      const k = keyOf(h);
      const shown = !hiddenBy(p, h);
      const tail = kind === "pinned" ? pinBtn(true) + `<button class="mg-btn mg-drag" type="button" data-act="drag" aria-label="${esc(tx("manage.move"))}">${icon("drag", { size: 22 })}</button>` : (flagged(h) ? "" : pinBtn(false)) + eyeBtn(shown);
      return `<div class="cell mg-row${shown ? "" : " is-off"}" data-key="${esc(k)}">
          <span class="mg-logo">${ctx.logo ? ctx.logo(h) : CK.coinLogo(h.coin, 40)}</span>
          <span class="cell-main mg-main"><b class="mg-name">${nameHtml(h)}</b><span class="mg-amount">${esc(amountText(h))}</span></span>
          <span class="mg-tail">${tail}</span>
        </div>`;
    }
    let off = null;
    const app = document.getElementById("app");
    const room = Math.round((app ? app.clientHeight : 700) * 0.72);
    const wanted = 84 + 2 * 38 + 24 + 20 + 64 * Math.max(1, ctx.holdings().length);
    CK.sheet.open({
      title: () => tx("manage.open"),
      detents: [CK.sheet.fixedDetent(Math.min(room, wanted) + (CK.sheet.safeBottom ? CK.sheet.safeBottom() : 0))],
      build(body) {
        body.classList.add("mg-body");
        body.innerHTML = `
          <section class="mg-sec" data-sec="pinned"><h3 class="mg-head" ${CK.i18n.L("manage.pinned")}>${esc(tx("manage.pinned"))}</h3><div class="group mg-list" data-list="pinned"></div></section>
          <section class="mg-sec" data-sec="all"><h3 class="mg-head" ${CK.i18n.L("manage.all")}>${esc(tx("manage.all"))}</h3><div class="group mg-list" data-list="all"></div></section>`;
        const pinnedSec = $('[data-sec="pinned"]', body), allSec = $('[data-sec="all"]', body);
        const pinnedList = $('[data-list="pinned"]', body), allList = $('[data-list="all"]', body);
        let rowsNow = [];
        function paint() {
          const p = prefsOf(address);
          rowsNow = ctx.holdings();
          const pinned = rowsNow.filter((h) => pinnedBy(p, h)).sort((a, b) => p.pin.indexOf(keyOf(a)) - p.pin.indexOf(keyOf(b)));
          const rest = rowsNow.filter((h) => !pinnedBy(p, h));
          pinnedSec.hidden = !pinned.length;
          allSec.hidden = !rest.length;
          pinnedList.innerHTML = pinned.map((h) => rowHtml(h, "pinned", p)).join("");
          allList.innerHTML = rest.map((h) => rowHtml(h, "all", p)).join("");
          const m2 = motion();
          if (m2) {
            m2.rows(pinnedList);
            m2.rows(allList);
          }
        }
        const find = (k) => rowsNow.find((h) => keyOf(h) === k);
        function change(fn) {
          const p = prefsOf(address);
          const next = { pin: p.pin.slice(), hide: p.hide.slice(), show: p.show.slice() };
          fn(next);
          savePrefs(address, next);
          CK.haptic.selection();
          paint();
          if (ctx.onChange) ctx.onChange();
        }
        const drop = (list, k) => {
          const at = list.indexOf(k);
          if (at >= 0) list.splice(at, 1);
        };
        body.addEventListener("click", (e) => {
          const btn = e.target.closest("[data-act]");
          if (!btn || btn.dataset.act === "drag") return;
          const row = btn.closest("[data-key]");
          const h = row && find(row.dataset.key);
          if (!h) return;
          const k = keyOf(h);
          if (btn.dataset.act === "pin") {
            if (flagged(h)) return;
            change((p) => {
              if (p.pin.includes(k)) drop(p.pin, k);
              else {
                p.pin.push(k);
                drop(p.hide, k);
                if (quietByDefault(h)) p.show.push(k);
              }
            });
          } else if (btn.dataset.act === "eye") {
            const shown = !hiddenBy(prefsOf(address), h);
            change((p) => {
              drop(p.hide, k);
              drop(p.show, k);
              if (shown) {
                drop(p.pin, k);
                if (!quietByDefault(h)) p.hide.push(k);
              } else if (quietByDefault(h)) p.show.push(k);
            });
          }
        });
        function reorder(from, to) {
          if (from === to) return;
          change((p) => {
            const order = $$(".mg-row", pinnedList).map((r) => r.dataset.key);
            const [k] = order.splice(from, 1);
            order.splice(to, 0, k);
            p.pin = order.concat(p.pin.filter((x) => !order.includes(x)));
          });
        }
        wireDrag(pinnedList, reorder);
        pinnedList.addEventListener("keydown", (e) => {
          const handle = e.target.closest(".mg-drag");
          if (!handle || e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const rows = $$(".mg-row", pinnedList);
          const from = rows.indexOf(handle.closest(".mg-row"));
          const to = Math.max(0, Math.min(rows.length - 1, from + (e.key === "ArrowUp" ? -1 : 1)));
          if (to === from) return;
          const k = rows[from].dataset.key;
          reorder(from, to);
          const again = $(`.mg-row[data-key="${CSS.escape(k)}"] .mg-drag`, pinnedList);
          if (again) again.focus();
        });
        const m = motion();
        if (m && m.quiet) m.quiet(paint);
        else paint();
        off = D.onBalances(() => {
          if (body.isConnected && !pinnedList.classList.contains("is-dragging")) paint();
        });
      },
      onClose() {
        if (off) off();
      }
    });
  }
  function wireDrag(list, done) {
    ["touchstart", "touchmove"].forEach((type) => list.addEventListener(type, (e) => {
      if (e.target.closest(".mg-drag")) e.stopPropagation();
    }, { passive: true }));
    list.addEventListener("pointerdown", (e) => {
      const handle = e.target.closest(".mg-drag");
      if (!handle || e.pointerType === "mouse" && e.button !== 0) return;
      const row = handle.closest(".mg-row");
      const rows = $$(".mg-row", list);
      if (!row || rows.length < 2) return;
      e.preventDefault();
      e.stopPropagation();
      const from = rows.indexOf(row);
      const tops = rows.map((r) => r.offsetTop);
      const height = row.offsetHeight;
      const bottoms = rows.map((r, i) => tops[i] + r.offsetHeight);
      const minDy = tops[0] - tops[from], maxDy = tops[rows.length - 1] - tops[from];
      const y0 = e.clientY;
      let at = from, dy = 0;
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (_) {
      }
      list.classList.add("is-dragging");
      row.classList.add("is-lifted");
      CK.haptic.light();
      function move(ev) {
        dy = Math.max(minDy, Math.min(maxDy, ev.clientY - y0));
        row.style.transform = `translate3d(0, ${dy}px, 0)`;
        const centre = tops[from] + height / 2 + dy;
        let next = rows.length - 1;
        for (let i = 0; i < rows.length; i++) {
          if (centre < bottoms[i]) {
            next = i;
            break;
          }
        }
        if (next !== at) {
          at = next;
          CK.haptic.selection();
          rows.forEach((r, i) => {
            if (r === row) return;
            const shift = from < at && i > from && i <= at ? -height : from > at && i >= at && i < from ? height : 0;
            r.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : "";
          });
        }
      }
      function end() {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
        handle.removeEventListener("lostpointercapture", end);
        const lifted = row.getBoundingClientRect().top;
        list.classList.remove("is-dragging");
        rows.forEach((r) => {
          r.style.transform = "";
        });
        row.classList.remove("is-lifted");
        if (at !== from) done(from, at);
        const now = $(`.mg-row[data-key="${CSS.escape(row.dataset.key)}"]`, list);
        if (now && now.animate && !CK.reducedMotion()) {
          const by = lifted - now.getBoundingClientRect().top;
          if (Math.abs(by) > 1) now.animate([{ transform: `translate3d(0, ${by}px, 0)` }, { transform: "none" }], { duration: 420, easing: motion() ? motion().springEasing(170, 26.077) : "ease-out" });
        }
      }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
      handle.addEventListener("lostpointercapture", end);
    });
  }
  const HISTORY_FILL = 10;
  const HISTORY_PAGES_MAX = 6;
  const DUST_NANO = 10000000n;
  const EXPLORER = "https://tonviewer.com/";
  const HEX_HASH = /^[0-9a-f]{64}$/i;
  const PAID_KEY = "ck-sent-to:";
  function paidAddresses(wallet) {
    try {
      const list = JSON.parse(localStorage.getItem(PAID_KEY + wallet) || "[]");
      return Array.isArray(list) ? list.filter((a) => typeof a === "string") : [];
    } catch (_) {
      return [];
    }
  }
  const FILTERS = [
    { value: "all", key: "filter.all", empty: "walletFlow.emptyAll" },
    { value: "out", key: "history.sent", empty: "history.emptyOut" },
    { value: "in", key: "history.received", empty: "history.emptyIn" },
    { value: "swap", key: "history.swaps", empty: "history.emptySwap" },
    { value: "spam", key: "history.spam", empty: "history.emptySpam" }
  ];
  const sideText = (sign, s) => `${sign}${D.qty(T.fromUnits(s.units, s.decimals))} ${s.sym}`;
  const sideParts = (sign, s) => ({ amount: sideText(sign, s), num: `${sign}${D.qty(T.fromUnits(s.units, s.decimals))}`, sym: String(s.sym || "") });
  const shortOf = (raw) => {
    try {
      return T.shortAddress(T.friendlyAddress(raw));
    } catch (_) {
      return "";
    }
  };
  function describe(e) {
    if (e.kind === "swap") return { icon: "exchange", kind: "swap", title: tx("action.swap"), full: tx("tx.exchangeFull", { from: e.gave.sym, to: e.got.sym }), ...sideParts("+", e.got), sub: `${e.gave.sym} \u2192 ${e.got.sym}`, up: true };
    if (e.kind === "in") return { icon: "receive", kind: "in", title: tx("history.received"), full: tx("tx.depositFull", { sym: e.sym }), ...sideParts("+", e), sub: shortOf(e.counterparty), up: true };
    if (window.DemoCheques && DemoCheques.isCheque(e.counterparty)) return { icon: "gift", kind: "out", title: tx("cheque.row"), full: tx("cheque.row"), ...sideParts("\u2212", e), sub: "", up: false };
    return { icon: "send", kind: "out", title: tx("history.sent"), full: tx("tx.withdrawFull", { sym: e.sym }), ...sideParts("\u2212", e), sub: shortOf(e.counterparty), up: false };
  }
  const ROW_FITS = [[], ["is-snug"], ["is-tight"], ["is-tight", "is-snug"], ["is-tight", "is-small"]];
  const cutIn = (row, sel) => {
    const t = row.querySelector(sel);
    return !!t && t.clientWidth > 0 && t.scrollWidth > t.clientWidth;
  };
  function subHtml(d) {
    const at = d.kind === "swap" ? -1 : d.sub.indexOf("\u2026");
    if (at <= 0) return esc(d.sub);
    return `<span class="hs-sub-head">${esc(d.sub.slice(0, at))}</span><span class="hs-sub-tail">${esc(d.sub.slice(at))}</span>`;
  }
  function fitHistoryRows(rows) {
    const all = Array.from(rows);
    all.forEach((row) => row.classList.remove("is-snug", "is-small", "is-tight", "is-brief"));
    let left = all;
    for (let i = 0; i < ROW_FITS.length && left.length; i++) {
      if (i) left.forEach((row) => {
        row.classList.remove("is-snug", "is-small", "is-tight");
        ROW_FITS[i].forEach((c) => row.classList.add(c));
      });
      left = left.filter((row) => cutIn(row, ".hs-title"));
    }
    all.filter((row) => row.querySelector(".hs-sub-head") && cutIn(row, ".hs-sub")).forEach((row) => row.classList.add("is-brief"));
  }
  const stateWord = (e) => e.pending ? tx("walletFlow.pending") : e.failed ? tx("walletFlow.failed") : "";
  function flaggedTokens() {
    const out =   new Set();
    try {
      (D.balancesKnown ? D.holdings() : []).forEach((h) => {
        if (h.risk === "suspicious" && h.coin.token && h.coin.token.address) out.add(T.rawAddress(h.coin.token.address));
      });
    } catch (_) {
    }
    return out;
  }
  function fakeToken(e, flaggedSet) {
    if (e.kind === "swap" || !e.token || e.token === "ton") return false;
    if (flaggedSet.has(e.token)) return true;
    const known = CK.swapAudit && typeof CK.swapAudit.swappable === "function" && CK.swapAudit.swappable(e.token);
    return !known && !!(CK.market && CK.market.passesForCoin && CK.market.passesForCoin(e.sym));
  }
  function intake(rows) {
    const clean = W().cleanEvents(rows);
    const kept = new Set(clean.map((e) => e.key));
    const incoming =   new Map();
    const flipped = (Array.isArray(rows) ? rows : []).map((row) => {
      if (!row || !Array.isArray(row.actions)) return row;
      return {
        ...row,
        actions: row.actions.map((a, i) => {
          if (!a || a.kind !== "in") return a;
          incoming.set(`${row.id}:${i}`, a.status !== "ok");
          return { ...a, kind: "out", status: "ok" };
        })
      };
    });
    const spam = W().cleanEvents(flipped).filter((e) => !kept.has(e.key) && incoming.has(e.key)).map((e) => ({ ...e, kind: "in", failed: incoming.get(e.key), spam: true }));
    return clean.concat(spam);
  }
  const monthKey = (at) => {
    const d = new Date(at);
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  };
  function monthName(at) {
    const d = new Date(at);
    const name = tx("month." + (d.getMonth() + 1));
    return d.getFullYear() === (  new Date()).getFullYear() ? name : `${name} ${d.getFullYear()}`;
  }
  const whenText = (at) => `${CK.i18n.dayShort ? CK.i18n.dayShort(at) : CK.i18n.dayMonth(at)}, ${CK.i18n.clock(at)}`;
  function historyStep(opts) {
    const o = opts || {};
    const wallet = T.wallet.address;
    const token = o.token ? o.token === "ton" ? "ton" : T.rawAddress(o.token) : null;
    const seen =   new Set();
    const st = { filter: "all", items: [], next: null, started: false, ended: false, loading: false, failed: false, pages: 0, scroll: 0 };
    const touches = (e) => !token || (e.kind === "swap" ? e.gave.token === token || e.got.token === token : e.token === token);
    function lists() {
      const flaggedSet = flaggedTokens();
      const mine = st.items.filter(touches);
      const spamNow =   new Set();
      const plain = [];
      mine.forEach((e) => {
        if (e.spam || fakeToken(e, flaggedSet) || e.kind === "in" && e.token === "ton" && e.units < DUST_NANO) spamNow.add(e);
        else plain.push(e);
      });
      const clean = W().withoutPoison(plain);
      const kept = new Set(clean);
      plain.forEach((e) => {
        if (!kept.has(e)) spamNow.add(e);
      });
      return { clean, spam: mine.filter((e) => spamNow.has(e)) };
    }
    return {
      title: tx("common.history"),
      render(body, flow) {
        body.classList.add("hs-body");
        body.innerHTML = `<div class="hs-chips-wrap"><div class="hs-chips" role="radiogroup" aria-label="${esc(tx("history.filterAria"))}"><i class="hs-chip-ind" aria-hidden="true"></i>${FILTERS.map((f) => `<button class="hs-chip press" type="button" role="radio" data-filter="${f.value}" aria-checked="${f.value === st.filter}">${esc(tx(f.key))}</button>`).join("")}</div></div><div class="hs-log"></div>`;
        const log = $(".hs-log", body);
        const chipsEl = $(".hs-chips", body);
        const ind = $(".hs-chip-ind", body);
        const chipOf = (v) => $(`.hs-chip[data-filter="${v}"]`, chipsEl);
        let shown = [], gone = false;
        const months =   new Map();
        function placeIndicator(from) {
          const to = chipOf(st.filter);
          if (!to) return;
          if (motion() && motion().indicator) motion().indicator(ind, from || null, to);
          else {
            ind.style.width = `${to.offsetWidth}px`;
            ind.style.transform = `translateX(${to.offsetLeft}px)`;
          }
        }
        function rowHtml(e, i, spam) {
          const d = describe(e);
          const word = stateWord(e);
          const tone = word || spam ? "flat" : d.up ? "up" : "plain";
          return `<button class="cell hs-row press-row" type="button" data-key="${esc(e.key)}" data-i="${i}">
              <span class="hs-tile" data-kind="${d.kind}" aria-hidden="true">${icon(d.icon, { size: 22 })}</span>
              <span class="cell-main hs-main">
                <span class="hs-line"><span class="hs-title">${esc(d.title)}</span> <span class="hs-amount is-${tone}">${esc(d.num)}<span class="hs-sym"> ${esc(d.sym)}</span></span></span>
                <span class="hs-line hs-line--sub">${d.sub ? `<span class="hs-sub">${subHtml(d)}</span> ` : ""}<span class="hs-when"><span class="hs-unit" aria-hidden="true"><span class="hs-unit-sym">${esc(d.sym)}</span> \xB7 </span><span class="hs-stamp${word ? " is-state" : ""}${word && !e.pending ? " is-failed" : ""}">${esc(word || whenText(e.at))}</span></span></span>
              </span>
            </button>`;
        }
        function paint(fresh) {
          const filter = FILTERS.find((f) => f.value === st.filter);
          const { clean, spam: spamRows } = lists();
          shown = st.filter === "spam" ? spamRows : st.filter === "all" ? clean : clean.filter((e) => e.kind === st.filter);
          if (!shown.length) {
            months.clear();
            if (!st.started || st.loading) log.innerHTML = '<div class="group hs-skel"><div class="wallet-skel"></div><div class="wallet-skel"></div><div class="wallet-skel"></div></div>';
            else if (st.failed) log.innerHTML = CK.emptyState({ icon: "warning", title: tx("common.loadFail"), className: "w-empty", actions: `<button class="btn btn--small btn--tinted press w-retry" type="button">${esc(tx("common.retry"))}</button>` });
            else log.innerHTML = CK.emptyState({ icon: "history", title: tx(filter.empty), className: "w-empty" });
            return;
          }
          if (!log.querySelector(":scope > .hs-month")) log.replaceChildren();
          const groups = [];
          const spam = st.filter === "spam";
          shown.forEach((e, i) => {
            const k = monthKey(e.at);
            if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, at: e.at, rows: [] });
            groups[groups.length - 1].rows.push(rowHtml(e, i, spam));
          });
          const want = new Set(groups.map((g) => g.k));
          months.forEach((sec, k) => {
            if (!want.has(k)) {
              sec.remove();
              months.delete(k);
            }
          });
          const more = log.querySelector(":scope > .w-retry--more");
          if (more) more.remove();
          let before = 0;
          groups.forEach((g, gi) => {
            let sec = months.get(g.k);
            if (!sec) {
              sec = CK.el(`<section class="hs-month"><h3 class="hs-month-name"></h3><div class="group hs-list"></div></section>`);
              months.set(g.k, sec);
            }
            $(".hs-month-name", sec).textContent = monthName(g.at);
            if (log.children[gi] !== sec) log.insertBefore(sec, log.children[gi] || null);
            const list = $(".hs-list", sec);
            const html = g.rows.join("");
            if (list._html !== html) {
              list._html = html;
              const had = new Map(Array.from(list.children, (r) => [r.dataset.key, r]));
              const tmp = document.createElement("div");
              tmp.innerHTML = html;
              const next = Array.from(tmp.children, (r) => {
                const old = had.get(r.dataset.key);
                if (!old || old.innerHTML !== r.innerHTML) return r;
                had.delete(r.dataset.key);
                old.dataset.i = r.dataset.i;
                return old;
              });
              had.forEach((r) => r.remove());
              next.forEach((r, i) => {
                if (list.children[i] !== r) list.insertBefore(r, list.children[i] || null);
              });
            }
            const m = motion();
            if (m) {
              m.rows([$(".hs-month-name", sec)], { fresh: !!fresh, delay: Math.min(before, 12) * 38 });
              m.rows(list, { fresh: !!fresh, key: (el) => el.dataset.key, delay: Math.min(before, 12) * 38 });
            }
            before += g.rows.length;
          });
          if (st.failed) log.appendChild(CK.el(`<button class="btn btn--tinted btn--small press w-retry w-retry--more" type="button">${esc(tx("common.retry"))}</button>`));
          fitHistoryRows($$(".hs-row", log));
        }
        let fitWidth = 0;
        const fitAgain = () => {
          if (!gone) fitHistoryRows($$(".hs-row", log));
        };
        const sizeWatch = typeof ResizeObserver === "function" ? new ResizeObserver(() => {
          if (log.clientWidth === fitWidth) return;
          fitWidth = log.clientWidth;
          fitAgain();
        }) : null;
        if (sizeWatch) sizeWatch.observe(log);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAgain, () => {
        });
        function load() {
          if (st.loading || st.ended) return;
          st.loading = true;
          st.started = true;
          st.failed = false;
          st.pages++;
          paint();
          T.config().then(() => T.api(`wallet/history?address=${encodeURIComponent(wallet)}${st.next ? `&before=${st.next}` : ""}`)).then((answer) => {
            intake(answer.rows).forEach((e) => {
              if (seen.has(e.key)) return;
              seen.add(e.key);
              st.items.push(e);
            });
            st.items.sort((a, b) => b.at - a.at);
            st.next = typeof answer.next === "string" && /^\d{1,20}$/.test(answer.next) ? answer.next : null;
            st.ended = !st.next;
          }, (err) => {
            console.error(err);
            st.failed = true;
          }).finally(() => {
            st.loading = false;
            if (gone) return;
            paint();
            if (!st.failed && !st.ended && shown.length < HISTORY_FILL && st.pages < HISTORY_PAGES_MAX) load();
          });
        }
        const onScroll = () => {
          st.scroll = body.scrollTop;
          if (!st.failed && !st.ended && body.scrollTop + body.clientHeight * 2 > body.scrollHeight) {
            st.pages = 0;
            load();
          }
        };
        body.addEventListener("scroll", onScroll, { passive: true });
        chipsEl.addEventListener("click", (e) => {
          const chip = e.target.closest(".hs-chip");
          if (!chip || chip.dataset.filter === st.filter) return;
          CK.haptic.selection();
          const was = chipOf(st.filter);
          st.filter = chip.dataset.filter;
          $$(".hs-chip", chipsEl).forEach((c) => c.setAttribute("aria-checked", String(c === chip)));
          placeIndicator(was);
          chip.scrollIntoView({ block: "nearest", inline: "nearest", behavior: CK.reducedMotion() ? "auto" : "smooth" });
          st.pages = 0;
          const rows = $$(".hs-row", log);
          const swap = () => {
            if (gone) return;
            months.clear();
            log.replaceChildren();
            body.scrollTop = 0;
            paint(true);
            if (!st.failed && !st.ended && shown.length < HISTORY_FILL) load();
          };
          if (motion() && rows.length) motion().leave(rows.slice(0, 12)).then(swap);
          else swap();
        });
        log.addEventListener("click", (e) => {
          if (e.target.closest(".w-retry")) {
            st.pages = 0;
            load();
            return;
          }
          const row = e.target.closest("[data-i]");
          if (!row) return;
          CK.haptic.selection();
          flow.push(detailStep(shown[Number(row.dataset.i)], st.filter === "spam"));
        });
        if (st.started) {
          if (motion() && motion().quiet) motion().quiet(() => paint());
          else paint();
          body.scrollTop = st.scroll;
        } else {
          paint();
          load();
        }
        const edge = () => chipsEl.classList.toggle("has-more", chipsEl.scrollLeft + chipsEl.clientWidth < chipsEl.scrollWidth - 2);
        chipsEl.addEventListener("scroll", edge, { passive: true });
        requestAnimationFrame(() => {
          placeIndicator(null);
          edge();
        });
        return () => {
          gone = true;
          if (sizeWatch) sizeWatch.disconnect();
          body.removeEventListener("scroll", onScroll);
          body.classList.remove("hs-body");
        };
      }
    };
  }
  function detailStep(e, listedAsSpam) {
    const d = describe(e);
    const spam = !!e.spam || !!listedAsSpam;
    const rows = [[tx("tx.date"), `${CK.i18n.dayMonthYear(e.at)}, ${CK.i18n.clock(e.at)}`]];
    if (e.kind === "swap") rows.push([tx("exchange.gave"), sideText("", e.gave)], [tx("exchange.got"), sideText("", e.got)]);
    if (stateWord(e)) rows.push([tx("walletFlow.status"), stateWord(e)]);
    return {
      title: d.full,
      render(body, flow) {
        body.innerHTML = `
          <div class="w-detail-hero hs-detail-hero"><span class="hs-tile hs-tile--big" data-kind="${d.kind}" aria-hidden="true">${icon(d.icon, { size: 30 })}</span><b class="w-is-${stateWord(e) || spam ? "flat" : d.up ? "up" : "plain"}"></b></div>
          <div class="group"><div class="summary w-rows"></div></div>`;
        $(".w-detail-hero b", body).textContent = d.amount;
        const host = $(".w-rows", body);
        rows.forEach(([label, value]) => {
          const r = CK.el('<div class="summary-row"><b></b></div>');
          r.prepend(label);
          r.lastElementChild.textContent = value;
          host.appendChild(r);
        });
        if (e.counterparty) {
          const block = CK.el('<div class="w-party"><span class="w-party-label"></span><span class="w-party-address"></span></div>');
          $(".w-party-label", block).textContent = tx(e.kind === "in" ? "walletFlow.sender" : "walletFlow.recipient");
          $(".w-party-address", block).textContent = T.friendlyAddress(e.counterparty);
          host.appendChild(block);
          if (!spam && e.kind === "out" && T.wallet && paidAddresses(T.wallet.address).includes(e.counterparty)) {
            const copy = CK.el(`<button class="w-copy" type="button" aria-label="${esc(tx("common.copyAddress"))}">${icon("copy", { size: 15 })}<span>${esc(tx("common.copy"))}</span></button>`);
            copy.addEventListener("click", () => CK.copyText(T.friendlyAddress(e.counterparty)).then((copied) => {
              if (copied) CK.toast(tx("common.addressCopied"), { icon: "check-circle", tone: "up" });
              else CK.toast(tx("common.copyFail"), { icon: "warning", tone: "down" });
            }));
            block.appendChild(copy);
            if (window.DemoBook && DemoBook.available() && !DemoBook.has("ton", T.friendlyAddress(e.counterparty)) && flow) {
              const keep = CK.el(`<button class="w-copy w-keep" type="button">${icon("plus", { size: 15 })}<span>${esc(tx("book.save"))}</span></button>`);
              keep.addEventListener("click", () => {
                CK.haptic.selection();
                flow.push(DemoBook.saveStep({ net: "ton", address: T.friendlyAddress(e.counterparty), memo: e.comment || "" }));
              });
              block.appendChild(keep);
            }
          }
        }
        if (e.comment) {
          const block = CK.el(`<div class="w-party"><span class="w-party-label">${esc(tx("walletFlow.comment"))}</span><span class="w-party-text"></span></div>`);
          $(".w-party-text", block).textContent = e.comment;
          host.appendChild(block);
        }
        if (spam) body.appendChild(CK.el(`<div class="hs-spam-note">${icon("warning", { size: 18 })}<span>${esc(tx("history.spamNote"))}</span></div>`));
        if (HEX_HASH.test(e.id)) {
          const open = CK.el(`<button class="tk-link" type="button">${esc(tx("swap.explorer"))}</button>`);
          open.addEventListener("click", () => T.openLink(`${EXPLORER}transaction/${e.id}`));
          body.appendChild(open);
        }
      }
    };
  }
  const historyHeight = () => {
    const app = document.getElementById("app");
    return Math.round((app ? app.clientHeight : 700) * 0.88);
  };
  function openHistory(opts) {
    if (!T.wallet || !W() || typeof W().openFlow !== "function") return null;
    const step = historyStep(opts);
    return W().openFlow(step, null, historyHeight() - (CK.sheet.safeBottom ? CK.sheet.safeBottom() : 0));
  }
  window.DemoManage = { arrange, openManage, openHistory, keyOf, prefsOf, intake, describe };
})();
