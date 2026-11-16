(function() {
  "use strict";
  const { icon, t: tx } = CK;
  if (CK.i18n && typeof CK.i18n.add === "function") CK.i18n.add({
    "forget.bonusMarks": ["\u041E\u0442\u043C\u0435\u0442\u043A\u0438 \u043E \u0431\u043E\u043D\u0443\u0441\u0430\u0445, \u0431\u0435\u0437 \u0441\u0443\u043C\u043C", "Bonus marks, without amounts", "\u041F\u043E\u0437\u043D\u0430\u0447\u043A\u0438 \u043F\u0440\u043E \u0431\u043E\u043D\u0443\u0441\u0438, \u0431\u0435\u0437 \u0441\u0443\u043C", "\u0411\u043E\u043D\u0443\u0441 \u0431\u0435\u043B\u0433\u0456\u043B\u0435\u0440\u0456, \u0441\u043E\u043C\u0430\u043B\u0430\u0440\u0441\u044B\u0437"],
    "forget.bonusDrop": ["\u041F\u0440\u043E\u043F\u0430\u0434\u0451\u0442 \u043D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u043E\u0435, \u043D\u043E \u0435\u0449\u0451 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u043E\u0435 \u043A \u0432\u044B\u043F\u043B\u0430\u0442\u0435: {sum}", "Credit not yet ready for payout is lost: {sum}", "\u041F\u0440\u043E\u043F\u0430\u0434\u0435 \u043D\u0430\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u0435, \u0430\u043B\u0435 \u0449\u0435 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u0435 \u0434\u043E \u0432\u0438\u043F\u043B\u0430\u0442\u0438: {sum}", "\u0422\u04E9\u043B\u0435\u043C\u0433\u0435 \u04D9\u043B\u0456 \u0434\u0430\u0439\u044B\u043D \u0435\u043C\u0435\u0441 \u0435\u0441\u0435\u043F\u0442\u0435\u043B\u0433\u0435\u043D \u0441\u043E\u043C\u0430 \u0436\u043E\u0439\u044B\u043B\u0430\u0434\u044B: {sum}"],
    "forget.settling": ["\u041E\u0431\u043C\u0435\u043D \u0435\u0449\u0451 \u0438\u0434\u0451\u0442, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435", "A swap is still going, try later", "\u041E\u0431\u043C\u0456\u043D \u0449\u0435 \u0442\u0440\u0438\u0432\u0430\u0454, \u0441\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u0456\u0437\u043D\u0456\u0448\u0435", "\u0410\u0439\u044B\u0440\u0431\u0430\u0441 \u04D9\u043B\u0456 \u0436\u04AF\u0440\u0456\u043F \u0436\u0430\u0442\u044B\u0440, \u043A\u0435\u0439\u0456\u043D\u0456\u0440\u0435\u043A \u043A\u04E9\u0440\u0456\u04A3\u0456\u0437"],
    "forget.bonusUnreadable": ["\u0411\u043E\u043D\u0443\u0441\u044B \u043D\u0435 \u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435", "Bonuses can\u2019t be read, try later", "\u0411\u043E\u043D\u0443\u0441\u0438 \u043D\u0435 \u0447\u0438\u0442\u0430\u044E\u0442\u044C\u0441\u044F, \u0441\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u0456\u0437\u043D\u0456\u0448\u0435", "\u0411\u043E\u043D\u0443\u0441\u0442\u0430\u0440 \u043E\u049B\u044B\u043B\u043C\u0430\u0439\u0434\u044B, \u043A\u0435\u0439\u0456\u043D\u0456\u0440\u0435\u043A \u043A\u04E9\u0440\u0456\u04A3\u0456\u0437"]
  });
  const p2pMode = () => window.DemoApp && DemoApp.p2pMode || "open";
  const p2pShown = () => p2pMode() === "open" || !!(window.DemoApp && DemoApp.p2pRow && DemoApp.p2pRow.shown);
  const canOpenP2P = () => p2pMode() !== "off" && !!(window.DemoApp && typeof DemoApp.openP2PMine === "function");
  const T = CK.ton;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => CK.esc(String(s));
  const NANO = /^\d{1,30}$/;
  const validBps = (v) => Number.isInteger(v) && v >= 0 && v <= 1e4;
  function pctOf(bps) {
    const whole = Math.floor(bps / 100);
    const rest = String(bps % 100).padStart(2, "0").replace(/0+$/, "");
    const en = CK.i18n.lang === "en";
    const number = rest ? `${whole}${en ? "." : ","}${rest}` : String(whole);
    return en ? `${number}%` : `${number}\xA0%`;
  }
  const loginData = () => CK.market.ready.then(() => CK.market.mode === "live" ? CK.tg.whenInitData() : "");
  let facts = null;
  let factsJob = null;
  function loadFacts() {
    if (facts) return Promise.resolve(facts);
    if (!factsJob) {
      factsJob = CK.market.ready.then(() => {
        if (CK.market.mode !== "live") return null;
        return fetch("api/fees", { cache: "no-store" }).then((res) => res.json()).then((body) => {
          if (!body || body.ok !== true || !validBps(body.feeBps)) return null;
          facts = { feeBps: body.feeBps, refShareBps: validBps(body.refShareBps) ? body.refShareBps : 0, p2pFeeBps: validBps(body.p2pFeeBps) ? body.p2pFeeBps : null, server: true };
          return facts;
        });
      }).catch(() => null).finally(() => {
        factsJob = null;
      });
    }
    return factsJob.then((got) => got || { feeBps: T.FEE_BPS, refShareBps: 0, server: false });
  }
  function cell(titleKey, value) {
    return `<div class="cell fee-row"><span class="cell-main"><span class="cell-title">${esc(tx(titleKey))}</span></span><span class="cell-value fee-value">${esc(value)}</span></div>`;
  }
  function paintFees(body, f) {
    const fee = pctOf(f.feeBps);
    const relayFee = pctOf(T.FEE_BPS);
    const p2pBps = CK.feeConfig ? CK.feeConfig.bps : f.p2pFeeBps;
    const p2pFee = validBps(p2pBps) ? pctOf(p2pBps) : "\u2014";
    const rows = [
      cell("fees.tonSwap", fee),
      cell("fees.buyOther", tx("fees.plusNet", { fee: relayFee })),
      cell("fees.sellOther", tx("fees.plusNet", { fee: pctOf(0) })),

      cell("fees.route", tx("fees.perStep", { fee: pctOf(T.FEE_BPS) })),
      cell("fees.orders", fee),
      p2pShown() ? cell("fees.p2p", `${p2pFee} \xB7 ${tx("fees.p2pSeller")}`) : "",
      cell("fees.withdraw", tx("fees.netOnly"))
    ].filter(Boolean);
    const note = f.server === false ? tx("fees.offline") : "";
    body.innerHTML = `<section class="section fee-page"><div class="group">${rows.join("")}</div>${note ? `<p class="section-note">${esc(note)}</p>` : ""}</section>`;
  }
  function openFees(from, stack) {
    if (CK.sheet.top) return;
    const screen = CK.screen({ title: () => tx("fees.row") });
    screen.el.classList.add("no-tabbar");
    stack.push(screen, { returnFocus: from });
    let shown = null;
    const paint = () => {
      if (shown) paintFees(screen.body, shown);
    };
    paintFees(screen.body, shown = { feeBps: T.FEE_BPS, refShareBps: 0, server: null });
    loadFacts().then((f) => {
      shown = f;
      paint();
      const note = screen.body.querySelector(".section-note");
      if (note && !CK.reducedMotion()) note.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    });
    CK.i18n.bind(screen.el, paint);
  }
  function call(method) {
    return loginData().then((initData) => {
      if (!initData) throw Object.assign(new Error("tg_only"), { code: "tg_only" });
      return fetch("api/me/forget", { method, headers: { Authorization: "tma " + initData }, cache: "no-store" }).then((res) => res.json().catch(() => null)).then((json) => {
        if (!json || json.ok !== true) throw Object.assign(new Error(json && json.error || "bad_response"), { code: json && typeof json.error === "string" && json.error || "bad_response", detail: json || null });
        return json;
      });
    });
  }
  const gramText = (nano) => {
    const v = T.fromUnits(BigInt(nano), 9);
    return CK.fmt.num(v, v === 0 ? 0 : Math.min(CK.fmt.priceDigits(v), 9)) + " GRAM";
  };
  function blockerText(b) {
    if (b.code === "open_orders") return tx("forget.openOrders", { n: Number.isInteger(b.count) ? b.count : 1 });
    if (b.code === "ref_unpaid") {
      const sum = NANO.test(String(b.owedNano)) ? gramText(b.owedNano) : "";
      return NANO.test(String(b.minNano)) ? tx("forget.unpaidSmall", { sum, min: gramText(b.minNano) }) : tx("forget.unpaid", { sum });
    }
    if (b.code === "orders_unreadable") return tx("forget.unreadable");
    if (b.code === "p2p_open") return tx("forget.p2pOpen");
    if (b.code === "ref_settling" || b.code === "bonus_settling") return tx("forget.settling");
    if (b.code === "bonus_unreadable") return tx("forget.bonusUnreadable");
    return tx("forget.fail");
  }
  const SAID = { ref_settling: "forget.settling", bonus_settling: "forget.settling", bonus_unreadable: "forget.bonusUnreadable" };
  const errorText = (code, loading) => code === "tg_only" ? tx("forget.tgOnly") : code === "expired" ? tx("forget.stale") : SAID[code] ? tx(SAID[code]) : tx(loading ? "forget.loadFail" : "forget.fail");
  function linesOf(plan) {
    const by = new Map((plan.stores || []).map((row) => [row.name, row]));
    const n = (name, field) => by.get(name) && Number.isInteger(by.get(name)[field]) ? by.get(name)[field] : 0;
    const goes = [];
    const wallet = tx("forget.wallet");
    const stays = [wallet];
    if (n("alerts", "remove")) goes.push(tx("forget.alerts", { n: n("alerts", "remove") }));
    if (n("orders", "remove")) goes.push(tx("forget.orders", { n: n("orders", "remove") }));
    if (n("referral", "remove")) goes.push(tx("forget.referral"));
    if (n("p2p", "methods")) goes.push(tx("forget.p2p", { n: n("p2p", "methods") }));
    if (n("p2p", "person")) goes.push(tx("forget.p2pName"));
    if (n("bot", "remove")) goes.push(tx("forget.bot"));
    if (n("botPrefs", "remove")) goes.push(tx("forget.botPrefs"));
    if (n("directory", "remove")) goes.push(tx("forget.directory"));
    if (n("cheques", "remove")) goes.push(tx("forget.cheques", { n: n("cheques", "remove") }));
    const bonus = by.get("bonus");
    if (bonus && NANO.test(String(bonus.dropNano)) && BigInt(bonus.dropNano) > 0n) goes.push(tx("forget.bonusDrop", { sum: gramText(bonus.dropNano) }));
    if (n("orders", "keep")) stays.push(tx("forget.ordersKept", { n: n("orders", "keep") }));
    const ref = by.get("referral");
    if (bonus && bonus.note === "bonus_marks") stays.push(tx("forget.bonusMarks"));
    if (ref && ref.note === "payout_record") stays.push(tx("forget.payouts"));
    if (ref && ref.note === "not_supported") stays.push(tx("forget.referralKept"));
    if (n("p2p", "keep")) stays.push(tx("forget.p2pDeals", { n: n("p2p", "keep") }));
    if (n("backup_guard", "keep")) stays.push(tx("forget.guard"));
    if (n("directory", "keep")) stays.push(tx("forget.directoryOff"));
    const open = n("cheques", "open") || by.get("cheques") && by.get("cheques").note === "open_cheques" ? tx("forget.chequesOpen", { n: n("cheques", "open") || 1 }) : "";
    if (open) stays.push(open);
    return { goes, stays, wallet, open };
  }
  function openForget() {
    if (CK.sheet.top) return;
    CK.haptic.light();
    loginData().then((initData) => {
      if (!initData) {
        CK.toast(tx("forget.tgOnly"), { icon: "info", tone: "accent" });
        return;
      }
      if (CK.sheet.top) return;
      CK.sheet.open({
        title: tx("forget.title"),

        detents: [CK.sheet.fixedDetent(FORGET_HEIGHT + CK.sheet.safeBottom())],
        build(b, sheet) {
          fillForget(b, sheet);
        }
      });
    });
  }
  const FORGET_HEIGHT = 466;
  function fillForget(b, sheet) {
    b.innerHTML = `
      <div class="fg-wrap vstack vstack--24">
        <div class="fg-body"><div class="group"><div class="wallet-skel"></div><div class="wallet-skel"></div></div></div>
        <div class="vstack vstack--8">
          <p class="fold-line fg-keep" hidden></p>
          <p class="fold-line fg-open" hidden></p>
        </div>
      </div>`;
    const dock = CK.el(`<div class="sheet-dock fg-dock vstack vstack--8">
        <p class="fold-line fold-line--danger fg-line" role="alert" hidden></p>
        <button class="btn btn--wide btn--sell press fg-go" type="button" disabled><span></span></button>
      </div>`);
    sheet.el.appendChild(dock);
    const bodyEl = $(".fg-body", b), line = $(".fg-line", dock), go = $(".fg-go", dock), keep = $(".fg-keep", b), openEl = $(".fg-open", b);
    $("span", go).textContent = tx("forget.go");
    let busy = false;
    const say = (text) => {
      line.textContent = text || "";
      line.hidden = !text;
    };
    const sayBlockers = (blockers) => {
      line.replaceChildren();
      blockers.forEach((b2, i) => {
        if (i) line.append(" ");
        if (b2.code !== "p2p_open" || !canOpenP2P()) return void line.append(blockerText(b2));
        const link = document.createElement("button");
        link.type = "button";
        link.className = "fg-link";
        link.textContent = blockerText(b2);
        link.addEventListener("click", () => {
          CK.haptic.selection();
          DemoApp.openP2PMine();
        });
        line.append(link);
      });
      line.hidden = !blockers.length;
    };
    const show = (el, text) => {
      el.textContent = text || "";
      el.hidden = !text;
    };
    const fold = (id, label, rows) => `
      <div class="fg-fold">
        <button class="fold-toggle fold-toggle--row" type="button" aria-expanded="false" aria-controls="${id}"><span>${esc(label)} \xB7 ${rows.length}</span>${icon("chevron-down")}</button>
        <div class="fold-body" id="${id}" hidden>${rows.map((text) => `<p class="fold-line">${esc(text)}</p>`).join("")}</div>
      </div>`;
    bodyEl.addEventListener("click", (e) => {
      const toggle = e.target.closest(".fold-toggle");
      if (!toggle) return;
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      const part = b.querySelector("#" + toggle.getAttribute("aria-controls"));
      if (part) part.hidden = !open;
      CK.haptic.selection();
    });
    function paint(plan) {
      const { goes, stays, wallet, open } = linesOf(plan);
      const folded = stays.filter((text) => text !== wallet && text !== open);
      bodyEl.className = "fg-body vstack vstack--8";
      bodyEl.innerHTML = (goes.length ? fold("fg-goes", tx("forget.goes"), goes) : `<p class="fold-line">${esc(tx("forget.nothing"))}</p>`) + (folded.length ? fold("fg-stays", tx("forget.stays"), folded) : "");
      show(keep, wallet);
      show(openEl, open);
      const blockers = Array.isArray(plan.blockers) ? plan.blockers : [];
      sayBlockers(blockers);
      go.hidden = !goes.length;
      go.disabled = blockers.length > 0;
    }
    const settle = () => {
      if (!CK.reducedMotion()) [bodyEl, keep, openEl, line].forEach((el) => {
        if (!el.hidden) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
      });
    };
    function load() {
      call("GET").then((plan) => {
        if (!b.isConnected) return;
        paint(plan);
        settle();
      }, (err) => {
        if (!b.isConnected) return;
        bodyEl.innerHTML = "";
        say(errorText(err.code, true));
        go.hidden = true;
        settle();
      });
    }
    go.addEventListener("click", () => {
      if (busy || go.disabled) return;
      busy = true;
      go.disabled = true;
      CK.haptic.medium();
      call("POST").then(() => {
        CK.haptic.success();
        sheet.close();
        CK.toast(tx("forget.done"), { icon: "check-circle" });
        if (CK.wallet && CK.wallet.directory && CK.wallet.directory.forgot) CK.wallet.directory.forgot();
        if (window.DemoAlerts) DemoAlerts.load().catch(() => {
        });
      }, (err) => {
        CK.haptic.error();
        busy = false;
        if (!b.isConnected) return;
        const blockers = err.detail && Array.isArray(err.detail.blockers) ? err.detail.blockers : null;
        if (blockers && blockers.length) {
          sayBlockers(blockers);
          return;
        }
        go.disabled = false;
        say(errorText(err.code));
      });
    });
    load();
  }
  window.DemoFees = { openFees, openForget, pctOf, linesOf, loadFacts };
})();
