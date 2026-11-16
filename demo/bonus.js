(function() {
  "use strict";
  const { icon, t: tx } = CK;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => CK.esc(String(s));
  CK.i18n.add({
    "bonus.free": ["\u041E\u0431\u043C\u0435\u043D \u0431\u0435\u0437 \u043D\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438", "A swap without our fee", "\u041E\u0431\u043C\u0456\u043D \u0431\u0435\u0437 \u043D\u0430\u0448\u043E\u0457 \u043A\u043E\u043C\u0456\u0441\u0456\u0457", "\u0411\u0456\u0437\u0434\u0456\u04A3 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u044F\u0441\u044B\u0437 \u0430\u0439\u044B\u0440\u0431\u0430\u0441"],
    "bonus.freeLine": ["\u041E\u0434\u0438\u043D \u0440\u0430\u0437, \u0432 \u0441\u0435\u0442\u0438 TON \u043E\u0442 ${min} \u0434\u043E ${max}", "Once, on TON, from ${min} to ${max}", "\u041E\u0434\u0438\u043D \u0440\u0430\u0437, \u0443 \u043C\u0435\u0440\u0435\u0436\u0456 TON \u0432\u0456\u0434 ${min} \u0434\u043E ${max}", "\u0411\u0456\u0440 \u0440\u0435\u0442, TON \u0436\u0435\u043B\u0456\u0441\u0456\u043D\u0434\u0435, \u043A\u0435\u043C\u0456\u043D\u0434\u0435 ${min}, \u0435\u04A3 \u043A\u04E9\u0431\u0456 ${max}"],
    "bonus.ready": ["\u0414\u043E\u0441\u0442\u0443\u043F\u0435\u043D", "Available", "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u0438\u0439", "\u049A\u043E\u043B\u0436\u0435\u0442\u0456\u043C\u0434\u0456"],
    "bonus.busy": ["\u041E\u0431\u043C\u0435\u043D \u0438\u0434\u0451\u0442", "Swap in progress", "\u041E\u0431\u043C\u0456\u043D \u0442\u0440\u0438\u0432\u0430\u0454", "\u0410\u0439\u044B\u0440\u0431\u0430\u0441 \u0436\u04AF\u0440\u0456\u043F \u0436\u0430\u0442\u044B\u0440"],
    "bonus.tomorrow": ["\u0417\u0430\u0432\u0442\u0440\u0430", "Tomorrow", "\u0417\u0430\u0432\u0442\u0440\u0430", "\u0415\u0440\u0442\u0435\u04A3"],
    "bonus.share": ["{share} \u043D\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438 \u0441 \u0438\u0445 \u043E\u0431\u043C\u0435\u043D\u043E\u0432 \u0432 TON", "{share} of our fee on their TON swaps", "{share} \u043D\u0430\u0448\u043E\u0457 \u043A\u043E\u043C\u0456\u0441\u0456\u0457 \u0437 \u0457\u0445\u043D\u0456\u0445 \u043E\u0431\u043C\u0456\u043D\u0456\u0432 \u0443 TON", "\u041E\u043B\u0430\u0440\u0434\u044B\u04A3 TON-\u0434\u0430\u0493\u044B \u0430\u0439\u044B\u0440\u0431\u0430\u0441\u0442\u0430\u0440\u044B\u043D\u0430\u043D \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u044F\u043C\u044B\u0437\u0434\u044B\u04A3 {share}"],
    "bonus.note": ["\u041D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u043E\u0435 \u0432\u044B\u043F\u043B\u0430\u0447\u0438\u0432\u0430\u0435\u043C \u0432 GRAM \u043D\u0430 \u0432\u0430\u0448 \u043A\u043E\u0448\u0435\u043B\u0451\u043A", "We pay what you earn in GRAM to your wallet", "\u041D\u0430\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u0435 \u0432\u0438\u043F\u043B\u0430\u0447\u0443\u0454\u043C\u043E \u0432 GRAM \u043D\u0430 \u0432\u0430\u0448 \u0433\u0430\u043C\u0430\u043D\u0435\u0446\u044C", "\u0415\u0441\u0435\u043F\u0442\u0435\u043B\u0433\u0435\u043D\u0434\u0456 GRAM \u0442\u04AF\u0440\u0456\u043D\u0434\u0435 \u04D9\u043C\u0438\u044F\u043D\u044B\u04A3\u044B\u0437\u0493\u0430 \u0442\u04E9\u043B\u0435\u0439\u043C\u0456\u0437"],
    "swap.feeFreeTag": ["\u0411\u043E\u043D\u0443\u0441", "Bonus", "\u0411\u043E\u043D\u0443\u0441", "\u0411\u043E\u043D\u0443\u0441"]
  });
  const FRESH_MS = 6e4;
  const VALUE_OF = { ready: "bonus.ready", busy: "bonus.busy", full: "bonus.tomorrow" };
  const STATES = ["ready", "busy", "full", "used", "off"];
  const KEPT_KEY = "ck-bonus-free";
  const JOINED_KEY = "ck-bonus-joined";
  const SKEL = '<i class="skel bonus-skel" aria-hidden="true"></i>';
  let data = null, dataAt = 0, job = null, epoch = 0;
  const heard = [];
  const whole = (v, fallback) => Number.isInteger(v) && v > 0 && v <= 1e5 ? v : fallback;
  const nano = (v) => typeof v === "string" && /^\d{1,30}$/.test(v) ? BigInt(v) : 0n;
  function clean(body) {
    if (!body || body.ok !== true) return null;
    const free = body.free && typeof body.free === "object" ? body.free : {};
    const on = body.on === true;
    return {
      on,
      forgotten: body.forgotten === true,
      free: { state: on && STATES.includes(free.state) ? free.state : "off", minUsd: whole(free.minUsd, 10), maxUsd: whole(free.maxUsd, 50) },
      earned: nano(body.earned),
      paid: nano(body.paid)
    };
  }
  function keptState() {
    try {
      return localStorage.getItem(KEPT_KEY) || "";
    } catch (_) {
      return "";
    }
  }
  function keepState(state) {
    try {
      localStorage.setItem(KEPT_KEY, state);
    } catch (_) {
    }
  }
  function keptJoined() {
    try {
      const v = localStorage.getItem(JOINED_KEY);
      return v !== null && /^\d{1,9}$/.test(v) ? Number(v) : null;
    } catch (_) {
      return null;
    }
  }
  function keepJoined(n) {
    try {
      if (Number.isInteger(n) && n >= 0) localStorage.setItem(JOINED_KEY, String(n));
      else localStorage.removeItem(JOINED_KEY);
    } catch (_) {
    }
  }
  function expire() {
    dataAt = 0;
    epoch += 1;
  }
  function load(force) {
    if (!force && data && Date.now() - dataAt < FRESH_MS) return Promise.resolve(data);
    if (job) return job;
    job = CK.market.ready.then(() => CK.market.mode === "live" ? CK.tg.whenInitData() : "").then((initData) => {
      if (!initData) return null;
      return fetch("api/bonus", { headers: { Authorization: "tma " + initData }, cache: "no-store" }).then((res) => res && res.status === 404 ? void 0 : res.json().catch(() => null)).then((body) => {
        if (body === void 0) return null;
        const got = clean(body);
        if (!got) throw Object.assign(new Error(body && body.error || "bad_response"), { code: body && body.error || "bad_response" });
        data = got;
        dataAt = Date.now();
        keepState(got.forgotten ? "off" : got.free.state);
        heard.slice().forEach((fn) => fn(got));
        return got;
      });
    }).finally(() => {
      job = null;
    });
    return job;
  }
  const freeShown = (d) => !!d && !d.forgotten && !!VALUE_OF[d.free.state];
  const fade = (el) => {
    if (el && el.animate && !CK.reducedMotion()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
  };
  const blocks = (els, opts) => {
    const list = els.filter((el) => el && !el.hidden);
    if (list.length && CK.motion) CK.motion.blocks(list, opts);
  };
  const gram = (v) => window.DemoPayouts && DemoPayouts.gramText ? DemoPayouts.gramText(v) : `${v} nano`;
  function build(body, ctx) {
    const I = ctx.invite || window.DemoApp && DemoApp.invite || null;
    const P = ctx.p2p || window.DemoApp && DemoApp.p2pRow || null;
    body.innerHTML = `
      <div class="group bonus-p2p" hidden><button class="cell press-row" type="button" data-p2p><span class="cell-main"><span class="cell-title" data-t="tab.p2p"></span></span><span class="cell-value" data-p2p-deals></span>${icon("chevron-right", { size: 16, className: "cell-chevron" })}</button></div>
      <div class="group bonus-free" hidden><button class="cell press-row bonus-row" type="button" data-free>
        <span class="cell-main"><span class="cell-title" data-t="bonus.free"></span><span class="cell-sub" data-free-line></span><span class="tag bonus-state" data-free-value></span></span>
        ${icon("chevron-right", { size: 16, className: "cell-chevron bonus-chevron" })}</button></div>
      <div class="group bonus-fail" hidden><div class="cell"><span class="cell-main"><span class="cell-title bonus-dim" data-t="common.loadFail"></span></span><button class="section-link press" type="button" data-retry data-t="common.retry"></button></div></div>
      <div class="group bonus-invite">
        <div class="cell"><span class="cell-main"><span class="cell-title" data-t="invite.row"></span><span class="cell-sub" data-share hidden></span></span></div>
        <div class="cell" data-joined-row><span class="cell-main"><span class="cell-title" data-t="invite.joined"></span></span><span class="cell-value" data-joined></span></div>
        <div class="bonus-invite-foot">${I ? I.fieldHtml("invite-link is-wait") + I.buttonsHtml() : ""}</div>
      </div>
      <section class="bonus-money" hidden>
        <div class="group">
          <div class="cell"><span class="cell-main"><span class="cell-title" data-t="invite.earned"></span></span><span class="cell-value" data-earned></span></div>
          <div class="cell" data-paid-row hidden><span class="cell-main"><span class="cell-title" data-t="invite.paid"></span></span><span class="cell-value" data-paid></span></div>
        </div>
        <p class="section-note bonus-note" data-t="bonus.note"></p>
      </section>`;
    const p2pGroup = $(".bonus-p2p", body), freeGroup = $(".bonus-free", body), failGroup = $(".bonus-fail", body), inviteGroup = $(".bonus-invite", body), money = $(".bonus-money", body);
    const freeValue = $("[data-free-value]", body), joinedRow = $("[data-joined-row]", body), joined = $("[data-joined]", body), shareLine = $("[data-share]", body);
    const link = I ? $(".invite-link", inviteGroup) : null, send = I ? $("[data-send]", inviteGroup) : null, copy = I ? $("[data-copy]", inviteGroup) : null;
    const st = { invite: "wait", bonus: null, failed: false, shareBps: 0, kept: keptState(), joined: keptJoined(), shown: false };
    function words() {
      body.querySelectorAll("[data-t]").forEach((el) => {
        el.textContent = tx(el.dataset.t);
      });
    }
    function paintP2P() {
      const shown = P ? P.shown : null;
      const appearing = p2pGroup.hidden && !!shown;
      p2pGroup.hidden = !shown;
      $("[data-p2p-deals]", p2pGroup).textContent = shown && shown.deals ? String(shown.deals) : "";
      if (appearing && st.shown) blocks([p2pGroup]);
    }
    function paintFree() {
      const d = st.bonus;
      const wasHidden = freeGroup.hidden;
      const state = d ? freeShown(d) ? d.free.state : "" : st.failed ? "" : st.kept;
      const show = !!VALUE_OF[state];
      freeGroup.hidden = !show;
      failGroup.hidden = !(st.failed && !d);
      const free = d ? d.free : { minUsd: 10, maxUsd: 50 };
      $("[data-free-line]", freeGroup).textContent = tx("bonus.freeLine", { min: free.minUsd, max: free.maxUsd });
      const value = show ? tx(VALUE_OF[state]) : "";
      if (freeValue.textContent !== value) {
        const changing = !!freeValue.textContent && !freeGroup.hidden && !wasHidden;
        freeValue.textContent = value;
        if (changing && value) fade(freeValue);
      }
      const ready = state === "ready";
      freeGroup.classList.toggle("is-ready", ready);
      $("[data-free]", freeGroup).setAttribute("aria-disabled", String(!ready));
      if (show && wasHidden && st.shown) blocks([freeGroup]);
      if (!failGroup.hidden && st.shown) blocks([failGroup]);
    }
    function paintInvite() {
      const mine = I ? I.now : null;
      const next = st.invite;
      if (link) {
        link.classList.toggle("is-wait", next !== "ok");
        link.hidden = next === "ok";
        if (next === "ok" && mine) I.show(link, I.link(mine.code));
        else if (next === "wait") {
          if (!link.querySelector(".skel")) link.innerHTML = SKEL;
        } else link.textContent = next === "outside" ? tx("invite.inTelegram") : next === "forgotten" ? tx("invite.forgotten") : tx("common.loadFail");
      }
      const fresh = next === "ok" && mine && Number.isInteger(Number(mine.joined)) && Number(mine.joined) >= 0 ? Number(mine.joined) : null;
      if (fresh !== null) st.joined = fresh;
      if (next === "forgotten") st.joined = null;
      if (fresh !== null || next === "forgotten") keepJoined(st.joined);
      const known = I && (next === "ok" || next === "wait" || next === "failed") ? st.joined : null;
      joinedRow.hidden = !I || known === null && next !== "wait";
      const count = known !== null ? CK.fmt.compact(known) : "";
      if (known === null) {
        if (!joinedRow.hidden && !joined.querySelector(".skel")) joined.innerHTML = SKEL;
      } else if (joined.textContent !== count || joined.querySelector(".skel")) {
        const filling = !!joined.querySelector(".skel");
        joined.textContent = count;
        if (filling) fade(joined);
      }
      shareLine.hidden = !(st.shareBps > 0 && window.DemoFees && DemoFees.pctOf);
      if (!shareLine.hidden) shareLine.textContent = tx("bonus.share", { share: DemoFees.pctOf(st.shareBps) });
      if (send) {
        send.disabled = next !== "ok" && next !== "failed";
        $("span", send).textContent = tx(next === "failed" ? "common.retry" : "common.send");
      }
      if (copy) copy.disabled = next !== "ok";
      paintMoney();
    }
    function paintMoney() {
      const mine = I ? I.now : null;
      const earned = st.bonus ? st.bonus.earned : mine && mine.earned !== null ? mine.earned : 0n;
      const paid = st.bonus ? st.bonus.paid : mine && mine.paid !== null ? mine.paid : 0n;
      const appearing = money.hidden && earned > 0n;
      money.hidden = !(earned > 0n) || st.invite === "forgotten";
      if (money.hidden) return;
      $("[data-earned]", money).textContent = gram(earned);
      $("[data-paid]", money).textContent = gram(paid);
      $("[data-paid-row]", money).hidden = !(paid > 0n);
      if (appearing && st.shown) blocks([money]);
    }
    function loadInvite(again) {
      if (!I) return;
      if (I.now && !again) {
        st.invite = "ok";
        paintInvite();
      } else if (!I.now) {
        st.invite = "wait";
        paintInvite();
      }
      I.reload().then((mine) => {
        st.invite = mine ? "ok" : "outside";
        paintInvite();
      }, (err) => {
        st.invite = err && err.message === "forgotten" ? "forgotten" : I.now ? "ok" : "failed";
        paintInvite();
      });
      if (window.DemoFees && DemoFees.loadFacts) {
        DemoFees.loadFacts().then((f) => {
          st.shareBps = f && f.server && f.refShareBps > 0 ? f.refShareBps : 0;
          paintInvite();
        }, () => {
        });
      }
    }
    function loadBonus(force) {
      load(force).then((d) => {
        st.failed = false;
        st.bonus = d;
        if (!d) st.kept = "";
        if (d && d.forgotten && st.invite !== "ok") st.invite = "forgotten";
        paintFree();
        paintInvite();
      }, (err) => {
        console.warn("bonus:", err && err.code);
        st.failed = true;
        paintFree();
      });
    }
    body.addEventListener("click", (e) => {
      if (e.target.closest("[data-p2p]")) {
        CK.haptic.selection();
        if (P) P.open(ctx.stack());
        return;
      }
      const free = e.target.closest("[data-free]");
      if (free && free.getAttribute("aria-disabled") !== "true") {
        CK.haptic.selection();
        if (ctx.goTab) ctx.goTab("exchange");
        return;
      }
      if (e.target.closest("[data-retry]")) {
        CK.haptic.light();
        st.failed = false;
        paintFree();
        loadBonus(true);
        return;
      }
      if (send && e.target.closest("[data-send]") && st.invite === "failed") {
        CK.haptic.light();
        loadInvite(true);
      }
    });
    if (I && link) I.wire(inviteGroup, () => st.invite === "ok" && I.now ? I.link(I.now.code) : null, () => tx("invite.text"));
    if (P) P.onChange(paintP2P);
    const hear = (d) => {
      if (!body.isConnected) return void heard.splice(heard.indexOf(hear), 1);
      st.failed = false;
      st.bonus = d;
      paintFree();
      paintInvite();
    };
    heard.push(hear);
    CK.i18n.bind(body, () => {
      words();
      paintFree();
      paintInvite();
    });
    words();
    paintP2P();
    paintFree();
    paintInvite();
    let shownAt = 0, seen = epoch;
    return {

      show() {
        if (P) P.ask();
        const first = !st.shown;
        if (first) {
          st.shown = true;
          blocks([p2pGroup, freeGroup, inviteGroup, money]);
        }
        if (!first && Date.now() - shownAt < FRESH_MS && seen === epoch) return;
        shownAt = Date.now();
        seen = epoch;
        loadInvite(!first);
        loadBonus(!first);
      }
    };
  }
  function mount(pane, ctx) {
    const screen = CK.screen({ title: CK.tr ? CK.tr("tab.bonus") : tx("tab.bonus"), compactTop: true, avatar: ctx.openProfile, headExtra: ctx.statusHtml });
    screen.el.classList.add("bonus-screen");
    let stack = null;
    const part = build(screen.body, { ...ctx, stack: () => stack });
    stack = ctx.makeStack(ctx.id || "bonus", screen);
    return { onShow: () => part.show() };
  }
  function push(stack, ctx) {
    const c = ctx || {};
    const screen = CK.screen({ title: () => tx("tab.bonus") });
    screen.el.classList.add("no-tabbar", "bonus-screen");
    const part = build(screen.body, { ...c, stack: () => stack });
    stack.push(screen, { returnFocus: c.from });
    part.show();
  }
  const MARK = "data-bonus";
  const flat = (s) => String(s || "").replace(/\s+/g, " ").trim();
  function zeroFee() {
    const pct = `${CK.fmt.num(0, 0)}${CK.i18n.lang === "en" ? "" : " "}%`;
    return flat(tx("swap.serviceFee", { pct }));
  }
  const tagged =   new Map();
  function feeSpot(root) {
    const line = $(".sw-fee-line", root);
    if (line) return { put: (tag) => line.appendChild(tag) };
    const sum = $(".sw-fee-sum", root);
    return sum ? { put: (tag) => sum.after(tag) } : null;
  }
  function tagSheet(root) {
    if (tagged.has(root)) return;
    const spot = feeSpot(root), pct = $(".sw-fee-pct", root);
    if (!spot || !pct) return void waitFor(root);
    const make = () => CK.el(`<span class="tag bonus-tag" hidden>${esc(tx("swap.feeFreeTag"))}</span>`);
    const tags = [make(), make()];
    spot.put(tags[0]);
    pct.after(tags[1]);
    let showed = false;
    const update = () => {
      const on = pct.getAttribute(MARK) === "free" && flat(pct.textContent) === zeroFee();
      if (on) showed = true;
      tags.forEach((tag) => {
        tag.textContent = tx("swap.feeFreeTag");
        tag.hidden = !on;
      });
    };
    const watch = new MutationObserver(update);
    watch.observe(pct, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: [MARK] });
    tagged.set(root, () => {
      watch.disconnect();
      if (showed) expire();
    });
    update();
  }
  const waiting =   new Map();
  function waitFor(root) {
    if (waiting.has(root) || !window.MutationObserver) return;
    const watch = new MutationObserver(() => {
      if (!$(".sw-fee-pct", root) || !feeSpot(root)) return;
      watch.disconnect();
      waiting.delete(root);
      tagSheet(root);
    });
    watch.observe(root, { childList: true, subtree: true });
    waiting.set(root, () => watch.disconnect());
  }
  function watchSheets() {
    const app = document.getElementById("app");
    if (!app || !window.MutationObserver) return;
    new MutationObserver((records) => {
      records.forEach((r) => {
        r.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList.contains("sheet-root")) tagSheet(node);
        });
        r.removedNodes.forEach((node) => {
          const stop = waiting.get(node);
          if (stop) {
            stop();
            waiting.delete(node);
          }
          const off = tagged.get(node);
          if (!off) return;
          off();
          tagged.delete(node);
        });
      });
    }).observe(app, { childList: true });
  }
  watchSheets();
  window.DemoBonus = { mount, push, load, tagSheet };
})();
