(function() {
  "use strict";
  const CK = window.CK;
  const T = CK.ton;
  const D = window.DemoData;
  const tx = CK.t;
  const icon = CK.icon;
  const $ = (sel, root) => root.querySelector(sel);
  const NANO = /^\d{1,30}$/;
  const POLL_MS = 5e3;
  const SIGN_ERRORS = {
    insufficient_gas: "payouts.noGram",
    frozen: "swapSheet.frozen",
    pending: "swapSheet.pendingLock",
    busy: "swapSheet.pendingLock",
    payout_refused: "swapSheet.stopped",
    biometric_denied: "swapSheet.bioDenied",
    biometric_lost: "swapSheet.bioLost",
    biometric_unknown: "wallet.bioWait",
    no_secret: "swapSheet.noSign",
    no_secure_storage: "swapSheet.noSign",
    password_needed: "swapSheet.noSign"
  };
  const PLAN_ERRORS = { insufficient_balance: "payouts.noGram", batch_pending: "payouts.inFlight", nothing_owed: "payouts.nothing" };
  let last = null;
  let job = null;
  const gramOf = (nano) => T.fromUnits(nano, 9);
  function gramText(nano) {
    const v = gramOf(nano);
    return (D && D.qty ? D.qty(v) : CK.fmt.num(v, v === 0 ? 0 : 2)) + " GRAM";
  }
  function moneyText(nano) {
    const price = D && D.byId && D.byId.ton ? D.byId.ton.price : 0;
    return price > 0 ? CK.fmt.usd(gramOf(nano) * price) : "";
  }
  function read(body) {
    if (!body || !NANO.test(body.total) || !Number.isInteger(body.count) || body.count < 0) throw new Error("bad_response");
    const pending = body.pending && NANO.test(body.pending.total) && Number.isInteger(body.pending.count) ? { id: String(body.pending.id), total: BigInt(body.pending.total), count: body.pending.count } : null;
    return { total: BigInt(body.total), count: body.count, pending };
  }
  function load() {
    if (job) return job;
    const wallet = T.wallet ? "?wallet=" + encodeURIComponent(T.wallet.address) : "";
    job = T.config().then(() => T.api("ref/payouts" + wallet)).then((body) => {
      last = read(body);
      return last;
    }).finally(() => {
      job = null;
    });
    return job;
  }
  function open(onPaint) {
    if (CK.sheet.top) return;
    let gone = false, poll = 0, passDone = null;
    let shown = last ? { total: last.total, count: last.count } : null;
    let plan = null;
    let reviewed = null;
    let largeAgreed = null;
    let busy = false;
    CK.sheet.open({
      title: tx("payouts.row"),

      detents: [CK.sheet.overviewDetent()],
      onClose() {
        gone = true;
        clearTimeout(poll);
        if (passDone) passDone(null);
      },
      build(b, sheet) {
        b.classList.add("sw-order");
        b.innerHTML = `
          <div class="invite-money">
            <div><span>${tx("payouts.owed")}</span><p><b data-total></b><i data-money></i></p></div>
            <div><span>${tx("payouts.people")}</span><p><b data-count></b></p></div>
          </div>
          <div class="invite-money" data-lines hidden></div>
          <div class="invite-money" data-large hidden></div>
          <button class="btn btn--tinted btn--wide press" type="button" data-large-ok hidden>${tx("payouts.largeOk")}</button>`;
        const dock = CK.el(`<div class="sheet-dock sw-dock">
          <p class="sw-line" role="status"></p>
          <div class="tk-swipe"></div>
          <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx("swapSheet.password")}" aria-label="${tx("swapSheet.password")}"><button class="btn press" type="submit" aria-label="${tx("swapSheet.passwordGo")}">${icon("check", { size: 22 })}</button></form>
        </div>`);
        sheet.el.appendChild(dock);
        const line = $(".sw-line", dock), swipeHost = $(".tk-swipe", dock), passBox = $(".sw-pass", dock), passInput = $(".sw-pass-input", dock);
        const swipe = CK.swipeConfirm(swipeHost, { tone: "accent", label: tx("payouts.swipe"), onConfirm: confirm, resetAfter: 6e4, reportsOwnResult: true });
        passBox.addEventListener("submit", (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });
        function say(key, tone) {
          line.textContent = key ? tx(key) : "";
          line.dataset.tone = tone || "note";
        }
        let painted = !!shown;
        function paint() {
          const total = shown ? shown.total : 0n, count = shown ? shown.count : 0;
          const totalEl = $("[data-total]", b), countEl = $("[data-count]", b);
          if (!shown) {
            totalEl.innerHTML = '<span class="w-skel-bal"></span>';
            countEl.innerHTML = '<span class="w-skel-bal w-skel-bal--short"></span>';
          } else {
            totalEl.textContent = gramText(total);
            countEl.textContent = CK.fmt.num(count, 0);
            if (!painted && !CK.reducedMotion()) [totalEl, countEl].forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" }));
            painted = true;
          }
          $("[data-money]", b).textContent = shown ? moneyText(total) : "";
          const inFlight = !!(last && last.pending);
          swipe.setDisabled(busy || inFlight || !count || !T.wallet || T.wallet.readOnly);
          if (!busy && inFlight) say("payouts.inFlight");
          if (onPaint) onPaint();
        }
        function refresh() {
          clearTimeout(poll);
          return load().then((now) => {
            if (gone) return;
            if (!busy) {
              shown = { total: now.total, count: now.count };
              plan = null;
            }
            if (!busy && !now.pending && line.dataset.key === "sent") {
              say("payouts.done");
              line.dataset.key = "";
            }
            paint();
            if (now.pending) poll = setTimeout(refresh, POLL_MS);
          }, (err) => {
            console.error(err);
            if (gone) return;
            if (!busy) say("common.loadFail", "error");
            poll = setTimeout(refresh, POLL_MS);
          });
        }
        function askPassword() {
          return new Promise((resolve) => {
            swipeHost.hidden = true;
            passBox.hidden = false;
            passInput.value = "";
            passInput.focus({ preventScroll: true });
            passDone = (value) => {
              passDone = null;
              passInput.value = "";
              passBox.hidden = true;
              swipeHost.hidden = false;
              resolve(value);
            };
          });
        }
        function fillLines(box, list) {
          box.textContent = "";
          for (const one of list) {
            if (!one || typeof one.to !== "string" || !NANO.test(String(one.amount))) continue;
            const row = document.createElement("div");
            const who = document.createElement("span");
            who.textContent = one.to.length > 14 ? one.to.slice(0, 8) + "\u2026" + one.to.slice(-4) : one.to;
            const p = document.createElement("p");
            const amount = document.createElement("b");
            amount.textContent = gramText(BigInt(one.amount));
            p.appendChild(amount);
            row.append(who, p);
            box.appendChild(row);
          }
          box.hidden = false;
        }
        function showLines(next) {
          fillLines($("[data-lines]", b), next.lines);
          hideLarge();
          reviewed = { id: next.id, lines: next.lines.map((one) => ({ to: one && one.to, amount: String(one && one.amount) })) };
        }
        function isReviewed(next) {
          if (!reviewed || reviewed.id !== next.id || reviewed.lines.length !== next.lines.length) return false;
          return next.lines.every((one, i) => !!one && one.to === reviewed.lines[i].to && String(one.amount) === reviewed.lines[i].amount);
        }
        function hideLarge() {
          const box = $("[data-large]", b);
          if (box.hidden) return;
          box.hidden = true;
          $("[data-large-ok]", b).hidden = true;
        }
        function askLarge(next, large) {
          const lines = large.lines.length ? large.lines : next.lines;
          fillLines($("[data-large]", b), lines);
          const button = $("[data-large-ok]", b);
          button.hidden = false;
          button.onclick = () => {
            largeAgreed = { id: next.id, total: next.total, lines: lines.map((one) => ({ to: one.to, amount: String(one.amount) })) };
            hideLarge();
            say("payouts.largeSwipe");
          };
        }
        function release(key) {
          busy = false;
          say(key || "", key ? "error" : "note");
          paint();
          return false;
        }
        function confirm() {
          if (busy || !shown || !shown.count || !T.wallet || T.wallet.readOnly || last && last.pending) return false;
          busy = true;
          say("swap.signing");
          paint();
          return pay();
        }
        async function pay() {
          let own;
          try {
            if (!await CK.wallet.canSign()) return release("swapSheet.noSign");
            own = await CK.wallet.depositAddress();
            if (!own.verified || own.address !== T.wallet.address || CK.wallet.wallets.isExtra(own.address)) return release("swapSheet.stopped");
            plan = (await T.api("ref/payouts/plan", { body: { wallet: own.address } })).plan;
          } catch (err) {
            console.error(err);
            const code = err && err.detail && err.detail.error;
            if (code === "nothing_owed" || code === "batch_pending") refresh();
            return release(PLAN_ERRORS[code] || "swapSheet.tryAgain");
          }
          if (gone) return false;
          const agreed = shown;
          if (!plan || plan.total !== agreed.total.toString() || !Array.isArray(plan.lines) || plan.lines.length !== agreed.count) {
            if (plan && NANO.test(String(plan.total)) && Array.isArray(plan.lines)) {
              shown = { total: BigInt(plan.total), count: plan.lines.length };
              showLines(plan);
            }
            busy = false;
            say("payouts.changed");
            paint();
            return false;
          }
          if (!isReviewed(plan)) {
            showLines(plan);
            busy = false;
            say("payouts.check");
            paint();
            return false;
          }
          let large;
          try {
            large = CK.payoutAudit.largeOf(plan.lines, plan.total);
          } catch (_) {
            return release("swapSheet.stopped");
          }
          const largeOk = large && largeAgreed && largeAgreed.id === plan.id && largeAgreed.total === plan.total ? largeAgreed : null;
          if (large && !largeOk) {
            askLarge(plan, large);
            busy = false;
            say("payouts.large", "error");
            paint();
            return false;
          }
          const usePassword = CK.wallet.status.method === "password";
          let signed, password;
          for (; ; ) {
            if (usePassword) {
              password = await askPassword();
              if (password === null || gone) return release();
            }
            say("swap.signing");
            try {
              signed = await CK.wallet.signPayout(plan, { total: agreed.total.toString(), count: agreed.count, lines: reviewed.lines, large: largeOk || void 0 }, { ...password ? { password } : {}, wallet: own.address });
              break;
            } catch (err) {
              if (err.code === "wrong_password") {
                say("swapSheet.passwordWrong", "error");
                continue;
              }
              if (CK.wallet.protectRefused(err)) return release("wallet.needProtect");
              if (CK.wallet.isRejection(err)) return release();
              console.error(err);
              return release(SIGN_ERRORS[err.code] || "swapSheet.tryAgain");
            } finally {
              password = void 0;
            }
          }
          CK.haptic.success();
          try {
            await CK.wallet.broadcast(signed.boc);
          } catch (err) {
            console.error(err);
          }
          busy = false;
          say("payouts.sent");
          line.dataset.key = "sent";
          last = last ? { ...last, pending: { id: plan.id, total: agreed.total, count: agreed.count } } : last;
          paint();
          poll = setTimeout(refresh, POLL_MS);
          return void 0;
        }
        paint();
        refresh();
      }
    });
  }
  window.DemoPayouts = { load, open, gramText, moneyText, get last() {
    return last;
  } };
})();
