(function() {
  "use strict";
  const { fmt, icon, t: tx } = CK;
  const T = CK.ton;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);
  const CHIPS = { stop: [5, 10, 20], take: [10, 20, 50] };
  const GRAM_DECIMALS = 9;
  const USDT_RAW = "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe";
  const WORST_FLOOR = 90n;
  const GRAM_NEEDED = 400000000n;
  const GAS_ON_ORDER = 320000000n;
  const GAS_DUST = 100000000n;
  const TAKE_FAR = 100n;
  const POLL_MS = 15e3;
  const POLL_BUSY_MS = 4e3;
  const RESEND_AFTER_MS = 2e4;
  const CANCEL_SHOWN_MS = 5 * 60 * 1e3;
  const NEAR_STOP_PCT = 3;
  const ENDED_SHOWN = 5;
  const STEPS_MIN_HEIGHT = 400;
  const HIDDEN_KEY = "ck-orders-hidden";
  const COUNT_KEY = "ck-orders-count:";
  const ID_FORMAT = /^[0-9a-f]{32}$/;
  const EVENT_FORMAT = /^[\w-]{10,128}$/;
  const EXPLORER = "https://tonviewer.com/";
  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (_) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (_) {
      }
    }
  };
  const gram = () => D.byId.ton.sym;
  const gramOf = (units) => T.fromUnits(units, GRAM_DECIMALS);
  const fieldText = (v) => {
    if (!(v > 0)) return "";
    return v >= 1e9 ? String(Math.round(v)) : D.qty(v).replace(/\s/g, "");
  };
  const sumText = (v) => v >= 1 ? fmt.num(v, 2) : D.qty(v);
  const worstFloor = (stopOut) => stopOut * WORST_FLOOR / 100n;
  const canSign = () => {
    const status = CK.wallet.status;
    return !!T.wallet && !T.wallet.readOnly && !status.lost && !status.bioUnknown;
  };
  const priceOf = (out, units, decimals) => {
    const amount = T.fromUnits(units, decimals);
    return amount > 0 ? gramOf(out) / amount : 0;
  };
  const isUsdt = (offer) => offer === USDT_RAW;
  const kindName = (kind, offer) => isUsdt(offer) ? tx(kind === "stop" ? "orders.buyHigher" : "orders.buyLower", { sym: gram() }) : tx(`orders.${kind}`);
  const unitOf = (offer) => isUsdt(offer) ? D.byId.usdt.sym : gram();
  const shownPrice = (out, units, decimals, offer) => {
    if (!isUsdt(offer)) return priceOf(out, units, decimals);
    const got = gramOf(out);
    return got > 0 ? T.fromUnits(units, decimals) / got : 0;
  };
  const outAt = (price, units, decimals, offer) => {
    const scaled = T.toUnits(price, 18);
    if (!isUsdt(offer)) return scaled * units / 10n ** BigInt(18 - GRAM_DECIMALS + decimals);
    return scaled > 0n ? units * 10n ** BigInt(18 + GRAM_DECIMALS - decimals) / scaled : 0n;
  };
  const unitUsd = (offer) => {
    const coin = isUsdt(offer) ? D.byId.usdt : D.byId.ton;
    return coin && coin.priced === true && coin.price > 0 ? coin.price : 0;
  };
  const approxText = (price, offer) => {
    const usd = unitUsd(offer);
    if (!(price > 0) || !(usd > 0)) return "";
    const shown = fmt.shown(price * usd);
    if (!(shown > 0) || !Number.isFinite(shown)) return "";
    const digits = shown >= 1 ? 2 : Math.min(10, Math.ceil(-Math.log10(shown)) + 1);
    return tx("orders.approx", { sum: fmt.money(fmt.num(shown, digits)) });
  };
  const TROUBLES = {
    order_refused: "orderErr.refused",
    no_free_slot: "orderErr.noSlot",
    subwallet_busy: "orderErr.noSlot",
    slot_busy: "orderErr.noSlot",
    no_main_gas: "orderErr.noMainGas",
    pool_cap: "orderErr.poolCap",
    no_second_price: "orderErr.noPrice",
    price_disagrees: "orderErr.noPrice",
    pool_unsupported: "orderErr.noPool",
    no_gram_pool: "orderErr.noPool",
    router_unknown: "orderErr.noPool",
    no_liquidity: "orderErr.noPool",
    no_price: "orderErr.noPool",
    pool_locked: "orderErr.noPool",
    router_changing: "orderErr.routerChanging",
    order_token_closed: "orderErr.noToken",
    order_gas: "orderErr.noToken",
    stop_above_price: "orders.stopAbove",
    take_below_price: "orders.takeBelow",
    orders_off: "orders.off",
    order_busy: "orderErr.busy",
    order_moved: "orderErr.busy",
    route_changed: "orderErr.noPool",
    over_limit: "swap.quoteLimit",
    token_suspicious: "swap.refusedToken",
    impact_over_limit: "swap.impactTooHigh",
    insufficient_gas: "swap.noGasShort",
    insufficient_balance: "order.notHeld",
    frozen: "swapSheet.frozen",
    pending: "swapSheet.pendingLock",
    busy: "swapSheet.pendingLock",
    biometric_denied: "swapSheet.bioDenied",
    biometric_lost: "swapSheet.bioLost",
    no_secret: "swapSheet.noSign",
    no_secure_storage: "swapSheet.noSign",
    password_needed: "swapSheet.noSign",
    biometric_unknown: "wallet.bioWait",
    storage_failed: "swapSheet.noSign",
    bad_boc: "swapSheet.rejected",
    bad_request: "swapSheet.rejected"
  };
  const reasonOf = (err) => err && (err.code || err.message) || "";
  function troubleOf(err) {
    const key = TROUBLES[reasonOf(err)];
    return key ? { key, block: true } : { key: "swapSheet.tryAgain" };
  }
  const CHECK_KEEP_MS = 6e4;
  const CHECK_RETRY_MS = 15e3;
  const checks =   new Map();
  const checkKey = (raw) => `${T.wallet ? T.wallet.address : ""}|${raw}`;
  function checked(raw) {
    const kept = checks.get(checkKey(raw));
    return kept && kept.answer && Date.now() - kept.at < CHECK_KEEP_MS ? kept.answer : null;
  }
  function check(raw, units) {
    if (!T.wallet || !raw || CK.swapAudit.orderable(raw) || !CK.swapAudit.orderOffer(raw)) return Promise.resolve(null);
    const key = checkKey(raw);
    const kept = checks.get(key);
    if (kept && kept.job) return kept.job;
    if (kept && Date.now() - kept.at < (kept.answer ? CHECK_KEEP_MS : CHECK_RETRY_MS)) return Promise.resolve(kept.answer);
    if (typeof units !== "bigint" || units <= 0n) return Promise.resolve(null);
    const one = { at: Date.now(), answer: null, job: null };
    const query = `orders/check?offer=${encodeURIComponent(raw)}&wallet=${encodeURIComponent(T.wallet.address)}&units=${units}`;
    one.job = Promise.resolve().then(() => T.api(query)).then((body) => {
      const most = T.parseUnits(String(body.maxUnits));
      one.answer = most && most > 0n ? { ok: true, maxUnits: most } : { ok: false, reason: "pool_cap" };
    }, (err) => {
      const reason = err && err.detail && err.detail.error;
      if (reason && reason !== "upstream" && reason !== "rate_limited") one.answer = { ok: false, reason };
    }).then(() => {
      one.at = Date.now();
      one.job = null;
      return one.answer;
    });
    checks.set(key, one);
    return one.job;
  }
  const canPlace = (raw) => CK.swapAudit.orderable(raw) || CK.swapAudit.orderOffer(raw) && !!(checked(raw) || {}).ok;
  const capOf = (raw) => {
    if (CK.swapAudit.orderable(raw)) return null;
    const answer = checked(raw);
    return answer && answer.ok ? answer.maxUnits : null;
  };
  function attach(host, o) {
    const newKind = () => ({ pct: null, typed: null, anchor: null, x: 0, anim: null });
    const kinds = { stop: newKind(), take: newKind() };
    const offer = o.token.id;
    const unit = unitOf(offer);
    const rowHtml2 = (kind) => {
      const falls = isUsdt(offer) ? kind === "take" : kind === "stop";
      const sign = falls ? "\u2212" : "+";
      const name = kindName(kind, offer);
      return `
        <div class="or-row" data-kind="${kind}">
          <span class="or-cap"><span class="or-name">${name}</span><span class="or-usd"></span></span>
          <div class="or-ctl">
            <div class="or-chips" role="group" aria-label="${name}"><i class="or-thumb"></i>${CHIPS[kind].map((pct) => `<button class="or-chip" type="button" aria-pressed="false" data-pct="${pct}">${sign}${pct}%</button>`).join("")}</div>
            <span class="or-box"><input class="or-field" inputmode="decimal" autocomplete="off" placeholder="${tx("orders.price")}, ${unit}" aria-label="${name}, ${tx("orders.price")}, ${unit}"><i class="or-unit">${unit}</i></span>
          </div>
        </div>`;
    };
    host.innerHTML = rowHtml2("stop") + rowHtml2("take");
    if (window.DemoWallet) host.querySelectorAll(".or-field").forEach((field) => DemoWallet.amountField(field));
    let off = !CK.swapAudit.orderOffer(o.token.id);
    const paintOff = () => {
      const none = off || !!o.held && o.held() === 0n;
      host.classList.toggle("is-off", none);
      host.querySelectorAll(".or-chip, .or-field").forEach((el) => {
        el.disabled = none;
      });
    };
    paintOff();
    const now = CK.el('<b class="or-now" hidden><span class="or-now-main"><span class="or-now-num"></span><span class="or-now-sym"></span></span><span class="or-now-val"></span></b>');
    o.term.appendChild(now);
    let wasOn = false;
    const units = () => o.units();
    const isSet = (kind) => kinds[kind].pct !== null || kinds[kind].typed !== null;
    const livePriceOf = (coin) => coin && coin.price > 0 && (coin.isToken || coin.priced === true) ? coin.price : 0;
    const marketNow = () => {
      const gramUsd = livePriceOf(D.byId.ton);
      if (isUsdt(offer)) return gramUsd > 0 && livePriceOf(D.byId.usdt) > 0 ? gramUsd / livePriceOf(D.byId.usdt) : 0;
      const inst = o.token.inst || (typeof D.coinOfAddress === "function" ? D.coinOfAddress(offer) : null);
      return gramUsd > 0 && livePriceOf(inst) > 0 ? livePriceOf(inst) / gramUsd : 0;
    };
    function outOf(kind) {
      const k = kinds[kind];
      const amount = units();
      if (amount <= 0n) return null;
      if (k.typed !== null) return outAt(k.typed, amount, o.decimals(), offer);
      if (k.pct === null) return null;
      if (k.anchor && k.anchor.units === amount) return k.anchor.out;
      const q = o.quote();
      if (!q) return null;
      const pct = BigInt(k.pct);
      const out = isUsdt(offer) ? q.expectedOut * 100n / (kind === "stop" ? 100n + pct : 100n - pct) : q.expectedOut * (kind === "stop" ? 100n - pct : 100n + pct) / 100n;
      k.anchor = { units: amount, out };
      return out;
    }
    function moveThumb(kind, i, animate) {
      const k = kinds[kind];
      const thumb = $(`.or-row[data-kind="${kind}"] .or-thumb`, host);
      if (k.anim) k.anim.stop();
      k.anim = null;
      const write = (v) => {
        k.x = v;
        thumb.style.transform = `translate3d(${(v * 100).toFixed(2)}%,0,0)`;
      };
      if (!animate) {
        write(i);
        return;
      }
      k.anim = CK.flight({
        from: k.x,
        to: i,
        precision: 2e-3,
        ...CK.springs.settle,
        tracks: [[thumb, (v) => ({ transform: `translate3d(${(v * 100).toFixed(2)}%,0,0)` })]],
        onUpdate: write,
        onDone() {
          k.anim = null;
        }
      });
    }
    function paintChips(kind) {
      const k = kinds[kind];
      const row = $(`.or-row[data-kind="${kind}"]`, host);
      const thumb = $(".or-thumb", row);
      const wasShown = thumb.classList.contains("is-on");
      row.querySelectorAll(".or-chip").forEach((chip) => chip.setAttribute("aria-pressed", String(Number(chip.dataset.pct) === k.pct)));
      thumb.classList.toggle("is-on", k.pct !== null);
      if (k.pct !== null) moveThumb(kind, CHIPS[kind].indexOf(k.pct), wasShown);
    }
    host.addEventListener("click", (e) => {
      const chip = e.target.closest(".or-chip");
      if (!chip) return;
      const focused = document.activeElement;
      if (focused && focused.classList.contains("or-field")) focused.blur();
      const kind = chip.closest(".or-row").dataset.kind;
      const k = kinds[kind];
      const pct = Number(chip.dataset.pct);
      CK.haptic.selection();
      k.typed = null;
      k.anchor = null;
      k.pct = k.pct === pct ? null : pct;
      paintChips(kind);
      $(`.or-row[data-kind="${kind}"] .or-field`, host).value = "";
      o.onChange();
    });
    host.addEventListener("input", (e) => {
      if (!e.target.classList.contains("or-field")) return;
      const kind = e.target.closest(".or-row").dataset.kind;
      const k = kinds[kind];
      const value = fmt.parse(e.target.value);
      k.pct = null;
      k.anchor = null;
      k.typed = value > 0 ? value : null;
      paintChips(kind);
      o.onChange();
    });
    host.addEventListener("focusout", (e) => {
      if (!e.target.classList.contains("or-field")) return;
      const k = kinds[e.target.closest(".or-row").dataset.kind];
      if (k.typed !== null) e.target.value = fieldText(k.typed);
      else if (k.pct === null) e.target.value = "";
    });
    host.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.classList.contains("or-field")) e.target.blur();
    });
    return {

      turnOff() {
        off = true;
        ["stop", "take"].forEach((kind) => {
          kinds[kind] = newKind();
          $(`.or-row[data-kind="${kind}"] .or-field`, host).value = "";
          paintChips(kind);
        });
        paintOff();
      },
      unavailable: () => off,
      active: () => isSet("stop") || isSet("take"),

      call() {
        const box = host.closest ? host.closest(".sheet-body") : null;
        if (box && box.scrollHeight > box.clientHeight && host.getBoundingClientRect) {
          const below = host.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
          if (below > 0) box.scrollTop += below + 8;
        }
        host.classList.add("is-called");
      },
      paint() {
        const on = isSet("stop") || isSet("take");
        const amount = units();
        ["stop", "take"].forEach((kind) => {
          const k = kinds[kind];
          if (k.pct === null) return;
          const out = outOf(kind);
          const field = $(`.or-row[data-kind="${kind}"] .or-field`, host);
          if (out !== null) {
            const text = fieldText(shownPrice(out, amount, o.decimals(), offer));
            if (field.value !== text) field.value = text;
          }
        });
        paintOff();
        if (host.classList.contains("is-off") && (isSet("stop") || isSet("take"))) {
          ["stop", "take"].forEach((kind) => {
            kinds[kind] = newKind();
            $(`.or-row[data-kind="${kind}"] .or-field`, host).value = "";
            paintChips(kind);
          });
        }
        const shown = (kind) => !!$(`.or-row[data-kind="${kind}"] .or-field`, host).value;
        ["stop", "take"].forEach((kind) => {
          $(`.or-row[data-kind="${kind}"]`, host).classList.toggle("has-price", shown(kind));
          const k = kinds[kind];
          const out = k.typed === null ? outOf(kind) : null;
          const price = k.typed !== null ? k.typed : out !== null ? shownPrice(out, amount, o.decimals(), offer) : 0;
          const usd = $(`.or-row[data-kind="${kind}"] .or-usd`, host);
          const text = shown(kind) ? approxText(price, offer) : "";
          if (usd.textContent !== text) usd.textContent = text;
        });
        if (on !== wasOn) {
          wasOn = on;
          o.term.hidden = !on;
          now.hidden = !on;
        }
        if (on) {
          const q = o.quote();
          const val = $(".or-now-val", now);
          if (q && amount > 0n) {
            const price = shownPrice(q.expectedOut, amount, o.decimals(), offer);
            CK.roll($(".or-now-num", now), D.qty(price));
            $(".or-now-sym", now).textContent = ` ${unit}`;
            const text = approxText(price, offer);
            val.textContent = text ? ` ${text}` : "";
          } else if (!$(".or-now-num", now).childElementCount || $(".or-now-num", now).querySelector(".skel")) {
            const price = marketNow();
            if (price > 0) {
              CK.roll($(".or-now-num", now), D.qty(price));
              $(".or-now-sym", now).textContent = ` ${unit}`;
              const text = approxText(price, offer);
              val.textContent = text ? ` ${text}` : "";
            } else if (!$(".or-now-num", now).querySelector(".skel")) {
              $(".or-now-num", now).removeAttribute("aria-label");
              $(".or-now-num", now).innerHTML = '<i class="skel sw-val-skel" aria-hidden="true"></i>';
              $(".or-now-sym", now).textContent = "";
              val.textContent = "";
            }
          }
        }
      },

      outText() {
        const stop = outOf("stop");
        const take = outOf("take");
        const stopText = stop !== null ? sumText(gramOf(worstFloor(stop))) : "";
        const takeText = take !== null ? sumText(gramOf(take)) : "";
        if (stopText && takeText) return tx("orders.outBoth", { stop: stopText, take: takeText });
        if (stopText) return tx("orders.outOne", { sum: stopText });
        return takeText ? tx("orders.outOne", { sum: takeText }) : "";
      },

      outGram() {
        const stop = outOf("stop");
        const take = outOf("take");
        if (stop !== null && take !== null) return 0;
        if (stop !== null) return gramOf(worstFloor(stop));
        return take !== null ? gramOf(take) : 0;
      },

      problem(gramHeld) {
        const q = o.quote();
        const stop = outOf("stop");
        const take = outOf("take");
        if (isSet("stop") && stop === 0n || isSet("take") && take === 0n) return { key: "swap.tooSmall" };
        const priceText = (out) => D.qty(shownPrice(out, units(), o.decimals(), offer));
        if (isUsdt(offer)) {
          if (q && stop !== null && stop >= q.expectedOut) return { key: "alerts.above", params: { price: `${priceText(q.expectedOut)} ${unit}` } };
          if (q && take !== null && take <= q.expectedOut) return { key: "alerts.below", params: { price: `${priceText(q.expectedOut)} ${unit}` } };
          if (q && take !== null && take > q.expectedOut * TAKE_FAR) return { key: "alerts.above", params: { price: `${priceText(q.expectedOut * TAKE_FAR)} ${unit}` } };
        } else {
          if (q && stop !== null && stop >= q.expectedOut) return { key: "orders.stopUnder", params: { price: priceText(q.expectedOut), sym: gram() } };
          if (q && take !== null && take <= q.expectedOut) return { key: "orders.takeOver", params: { price: priceText(q.expectedOut), sym: gram() } };
          if (q && take !== null && take > q.expectedOut * TAKE_FAR) return { key: "orders.takeFar" };
        }
        if (gramHeld < GRAM_NEEDED) return { key: "swap.noGas", params: { sum: `${D.qty(gramOf(GRAM_NEEDED))} ${gram()}` } };
        return null;
      },
      intent: () => ({ offer: o.token.id, units: units(), stopOut: outOf("stop"), takeOut: outOf("take") })
    };
  }
  async function place(intent, options) {
    try {
      return await CK.wallet.placeOrder(intent, options);
    } catch (err) {
      if (err.code === "send_unsure") return { unsure: true };
      throw err;
    }
  }
  function openPlaced(token, intent, placed) {
    if (CK.sheet.top) return;
    const unsure = !!placed.unsure;
    const decimals = token.decimals;
    CK.sheet.open({
      title: tx("orders.placed"),
      detents: ["fit"],
      build(body, sheet) {
        body.classList.add("sw-status", "sw-status--receipt");
        sheet.el.classList.add("sw-receipt-sheet");
        $(".sheet-title", sheet.el).textContent = "";
        body.innerHTML = `${DemoSwap.receipt.html}<div class="sw-rows summary"></div><div class="sw-actions"><button class="btn btn--wide press sw-done" type="button">${tx("common.done")}</button></div>`;
        const box = $(".sw-receipt", body);
        DemoSwap.receipt.paint(box, { mark: unsure ? "info" : "check-circle", tone: unsure ? "hint" : "up", final: true, title: tx(unsure ? "swapSheet.unsure" : "orders.placed"), text: tx(unsure ? "swapSheet.unsureText" : "orders.lineShort"), sub: `${amountText({ units: intent.units, decimals })} ${token.sym || ""}`.trim() });
        if (!unsure) $(".sw-receipt-text", box).appendChild(CK.el(`<button class="sw-why press" type="button" data-why="orders.line" aria-label="${CK.esc(tx("orders.line"))}">${icon("info", { size: 16 })}</button>`));
        box.addEventListener("click", (e) => {
          if (!e.target.closest || !e.target.closest("[data-why]")) return;
          CK.haptic.light();
          CK.toast(tx("orders.line"), { icon: "info", tone: "accent" });
        });
        const rows = $(".sw-rows", body);
        const row = (name, value) => {
          const r = CK.el('<div class="summary-row"><span></span><b></b></div>');
          r.firstElementChild.textContent = name;
          r.lastElementChild.textContent = value;
          rows.appendChild(r);
          return r.lastElementChild;
        };
        const priceRow = (kind, out) => {
          const price = shownPrice(out, intent.units, decimals, intent.offer);
          const approx = approxText(price, intent.offer);
          DemoSwap.withWorth(row(kindName(kind, intent.offer), `${D.qty(price)} ${unitOf(intent.offer)}`), approx ? ` ${approx}` : "");
        };
        if (intent.stopOut) {
          priceRow("stop", intent.stopOut);
          const floor = gramOf(worstFloor(intent.stopOut));
          DemoSwap.withWorth(row(tx("orders.floor"), `${sumText(floor)} ${gram()}`), DemoSwap.worthText({ id: "TON" }, floor));
        }
        if (intent.takeOut) priceRow("take", intent.takeOut);
        row(tx("orders.gas"), `${D.qty(gramOf(GAS_ON_ORDER))} ${gram()}`);
        $(".sw-done", body).addEventListener("click", () => sheet.close());
      }
    });
  }
  let orders = [], stranded = [], loaded = false, failed = false, slot = null, shownFn = () => true, movedFn = () => null, pollTimer = 0, job = null, shape = null, scannedFor = null, heldKey = null;
  const cancelSent =   new Map();
  const returnsSent =   new Set();
  const hidden =   new Set();
  const followers =   new Set();
  function changed() {
    followers.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    });
  }
  (() => {
    try {
      const list = JSON.parse(store.get(HIDDEN_KEY) || "[]");
      if (Array.isArray(list)) list.forEach((id) => {
        if (typeof id === "string") hidden.add(id);
      });
    } catch (_) {
    }
  })();
  let ordersFor = null;
  function cleanOrder(raw) {
    if (!raw || typeof raw.id !== "string" || !ID_FORMAT.test(raw.id) || typeof raw.state !== "string") return null;
    const units = T.parseUnits(raw.units);
    const offer = T.rawAddress(raw.offer);
    if (!units || !offer || !Number.isInteger(raw.decimals) || raw.decimals < 0 || raw.decimals > 30 || !Number.isInteger(raw.subwallet)) return null;
    const known = CK.swapAudit.knownDecimals(offer);
    const names = CK.market.cleanToken({ id: "ton:x", symbol: raw.symbol, name: raw.symbol, address: offer });
    const num = (v) => v === null || v === void 0 ? null : T.parseUnits(v);
    return {
      id: raw.id,
      state: raw.state,
      subwallet: raw.subwallet,
      offer,
      jettonWallet: T.rawAddress(raw.jettonWallet),
      decimals: known === null ? raw.decimals : known,
      oddDecimals: known !== null && known !== raw.decimals,
      units,
      symbol: names ? names.symbol : "?",
      stopOut: num(raw.stopOut),
      takeOut: num(raw.takeOut),
      expected: num(raw.expected),
      lastOut: num(raw.lastOut),
      outUnits: num(raw.outUnits),
      createdAt: Number(raw.createdAt) || 0,
      stalled: raw.stalled ? String(raw.stalled) : null,
      halted: raw.halted === true,
      firedKind: raw.firedKind === "take" ? "take" : "stop",
      failure: raw.failure === "funding" ? "funding" : null,
      freed: raw.freed === true,
      explorer: typeof raw.explorer === "string" && EVENT_FORMAT.test(raw.explorer) ? raw.explorer : null,
      validUntil: Number.isInteger(raw.validUntil) ? raw.validUntil : 0,

      feeBps: Number.isInteger(raw.feeBps) && raw.feeBps >= 0 && raw.feeBps <= 1e4 ? raw.feeBps : null
    };
  }
  const ratePct = (bps) => `${fmt.num(bps / 100, bps % 100 ? bps % 10 ? 2 : 1 : 0)}${CK.i18n.lang === "en" ? "%" : "\xA0%"}`;
  function feeTerms(o) {
    const now = T.FEE_BPS;
    const was = Number.isInteger(o.feeBps) ? o.feeBps : null;
    if (was === null || was === now) return { rate: ratePct(now), note: "" };
    return { rate: `${ratePct(was)} \u2192 ${ratePct(now)}`, note: tx("orders.feeNew", { now: ratePct(now), was: ratePct(was) }) };
  }
  const isOpen = (o) => o.state === "funding" || o.state === "active" || o.state === "firing" || o.state === "cancelling" || o.state === "replacing";
  const needsReturn = (o) => o.state === "found" || (o.state === "expired" || o.state === "failed" && o.failure !== "funding") && !o.freed;
  const holdsTokens = (o) => o.state === "active" || o.state === "firing" || o.state === "cancelling" || o.state === "replacing" || needsReturn(o);
  const EXPIRING_MS = 24 * 3600 * 1e3;
  const expiresSoon = (o) => o.state === "active" && o.validUntil > 0 && o.validUntil * 1e3 - Date.now() <= EXPIRING_MS;
  const rearmable = (o) => o.state === "expired" && !o.freed && ID_FORMAT.test(o.id) && !o.oddDecimals;
  const CHANGE_STUCK_MS = 12 * 60 * 1e3;
  const REPLACING_KEY = "ck-orders-replacing";
  const replacingSince =   new Map();
  (() => {
    try {
      const seen = JSON.parse(store.get(REPLACING_KEY) || "{}");
      if (seen && typeof seen === "object") Object.keys(seen).forEach((id) => {
        if (ID_FORMAT.test(id) && Number.isFinite(seen[id])) replacingSince.set(id, seen[id]);
      });
    } catch (_) {
    }
  })();
  function noteReplacing(rows) {
    let touched = false;
    rows.forEach((o) => {
      if (o.state === "replacing" && !replacingSince.has(o.id)) {
        replacingSince.set(o.id, Date.now());
        touched = true;
      } else if (o.state !== "replacing" && replacingSince.delete(o.id)) {
        touched = true;
      }
    });
    if (touched) store.set(REPLACING_KEY, JSON.stringify(Object.fromEntries(Array.from(replacingSince).slice(-32))));
  }
  const changeStuck = (o) => o.state === "replacing" && replacingSince.has(o.id) && Date.now() - replacingSince.get(o.id) >= CHANGE_STUCK_MS;
  const cancelShown = (o) => cancelSent.has(o.id) && (o.state === "active" || o.state === "cancelling" || o.state === "replacing");
  const untilText = (s) => {
    const at = s * 1e3;
    try {
      return `${CK.i18n.dayMonth(at)}, ${CK.i18n.clock(at)}`;
    } catch (_) {
      return new Date(at).toLocaleString();
    }
  };
  const coinOf = (o) => D.coinOfAddress(o.offer);
  const logoOf = (o, size) => CK.coinLogo(coinOf(o) || { id: o.offer, sym: o.symbol, neutral: true }, size);
  function amountText(o) {
    const v = T.fromUnits(o.units, o.decimals);
    return v >= 1e3 ? fmt.num(v, 0) : D.qty(v);
  }
  const worthOf = (o) => gramOf(o.lastOut || o.expected || 0n) * D.byId.ton.price;
  function viewOf(o) {
    if (cancelShown(o)) return { sub: tx("orders.cancelling"), spin: true };
    if (returnsSent.has(o.id) && needsReturn(o)) return { sub: tx("orders.returning"), spin: true };
    switch (o.state) {
      case "funding":
        return { sub: tx("orders.placing"), spin: true };
      case "firing":
        return { sub: tx("orders.firing"), spin: true };

      case "replacing":
        return changeStuck(o) ? { sub: tx("orders.halted"), tone: "accent", end: "cancel", tap: "cancel" } : { sub: tx("orders.changing"), spin: true };
      case "cancelling":
        return { sub: tx("orders.cancelling"), spin: true };
      case "cancelled":
        return { sub: tx("orders.cancelled"), end: "hide" };
      case "filled":
        return { sub: tx(o.firedKind === "take" ? "orders.filledTake" : "orders.filledStop", { sum: o.outUnits ? `+${sumText(gramOf(o.outUnits))} ${gram()}` : "" }).trim(), tone: "up", end: "hide", tap: o.explorer ? "explorer" : null };

      case "missed":
        return canSign() ? { sub: tx("orders.missedSell"), tone: "accent", end: "hide", tap: "sell" } : { sub: tx("orders.missed"), end: "hide" };
      case "expired":
        if (!needsReturn(o)) return { sub: tx("orders.expiredBack"), end: "hide" };
        if (canSign() && rearmable(o)) return { sub: tx("orders.expiredRearm"), tone: "accent", end: "return", tap: "manage" };
        return canSign() ? { sub: tx("orders.expired"), tone: "accent", end: "return", tap: "return" } : { sub: tx("orders.expiredHere") };
      case "failed":
        if (o.failure === "funding") return { sub: tx("orders.notPlaced"), end: "hide" };
        if (!needsReturn(o)) return { sub: tx("orders.expiredBack"), end: "hide" };
        return canSign() ? { sub: tx("orders.failed"), tone: "accent", end: "return", tap: "return" } : { sub: tx("orders.failedHere") };
      case "found":
        return canSign() ? { sub: tx("orders.found"), tone: "accent", end: "return", tap: "return" } : { sub: tx("orders.foundHere") };
      case "ended":
        return { sub: tx("orders.ended"), end: "hide", tap: "explorer" };

      default:
        return { end: "cancel", kinds: true, tap: o.oddDecimals ? "cancel" : "manage" };
    }
  }
  const kindsOf = (o) => ["stop", "take"].filter((kind) => !!(kind === "stop" ? o.stopOut : o.takeOut));
  function kindText(o, kind, fig) {
    if (fig.text && fig.text === tx("orders.atStop")) return fig.text;
    const name = isUsdt(o.offer) ? tx(kind === "stop" ? "alerts.above" : "alerts.below", { price: fig.text || "" }).trim() : `${tx(`orders.${kind}`)} ${fig.text || ""}`.trim();
    return name;
  }
  function figuresOf(o) {
    const quiet = o.halted || o.stalled;
    const head = o.halted ? { text: tx("orders.halted"), tone: "near" } : o.stalled ? { text: tx("orders.stalled"), tone: "near" } : expiresSoon(o) ? { text: tx("orders.expiresSoon"), tone: "near" } : { text: isUsdt(o.offer) ? tx("orders.gramLimit", { sym: gram() }) : "", tone: "" };
    const out = gramOf(o.lastOut || o.expected || 0n);
    const pctText = (p) => `${p < 0 ? "\u2212" : "+"}${fmt.num(Math.abs(p), 1)}${CK.i18n.lang === "en" ? "%" : "\xA0%"}`;
    const kinds = {};
    kindsOf(o).forEach((kind) => {
      const target = kind === "stop" ? o.stopOut : o.takeOut;
      const usdt = isUsdt(o.offer);
      const fig = { usd: approxText(shownPrice(target, o.units, o.decimals, o.offer), o.offer), text: "", tone: "", label: "" };
      if (!quiet && out > 0 && gramOf(target) > 0) {
        const p = (usdt ? out / gramOf(target) - 1 : gramOf(target) / out - 1) * 100;
        const reached = kind === "stop" && (usdt ? p <= 0 : p >= 0);
        if (reached && !usdt) {
          fig.text = tx("orders.atStop");
          fig.tone = "near";
        } else {
          fig.text = pctText(reached ? 0 : p);
          fig.tone = kind === "stop" && (reached || Math.abs(p) < NEAR_STOP_PCT) ? "near" : "";
          fig.label = usdt ? `${kindName(kind, o.offer)}, ${fig.text}` : tx(kind === "stop" ? "orders.toStop" : "orders.toTake", { pct: fig.text });
        }
      }
      kinds[kind] = fig;
    });
    return { head, kinds };
  }
  const rawKept =   new WeakMap();
  function rawOf(offer) {
    if (typeof offer === "string") return T.rawAddress(offer);
    if (!offer || typeof offer !== "object") return null;
    if (offer.isToken) return offer.token && offer.token.network === "ton" ? T.rawAddress(offer.token.address) : null;
    if (!rawKept.has(offer)) rawKept.set(offer, CK.swapAudit.masters().concat(CK.swapAudit.listedMasters().filter(CK.swapAudit.orderOffer)).find((raw) => D.coinOfAddress(raw) === offer) || null);
    return rawKept.get(offer);
  }
  function forToken(offer) {
    if (!loaded || !T.wallet || ordersFor !== T.wallet.address) return null;
    const raw = rawOf(offer);
    if (!raw || isUsdt(raw)) return null;
    const views = orders.filter((o) => o.state === "active" && !cancelSent.has(o.id) && o.offer === raw).map((o) => {
      const per = (out) => out ? priceOf(out, o.units, o.decimals) : null;
      const view = { id: o.id, stop: per(o.stopOut), take: per(o.takeOut), now: per(o.lastOut || o.expected) || 0, quiet: o.halted ? "halted" : o.stalled ? "stalled" : null, at: o.createdAt };
      const away = (price) => price && view.now > 0 ? Math.abs(price / view.now - 1) : Infinity;
      view.near = Math.min(away(view.stop), away(view.take));
      return view;
    });
    if (!views.length) return null;
    views.sort((a, b) => a.near - b.near || b.at - a.at);
    const { id, stop, take, now, quiet } = views[0];
    return { id, stop, take, now, quiet };
  }
  function flagOf(o) {
    if (needsReturn(o)) return { rank: 0, key: "orders.returnGo" };
    if (changeStuck(o) || o.state === "active" && o.halted) return { rank: 1, key: "orders.halted" };
    if (o.state === "active" && o.stalled) return { rank: 2, key: "orders.stalled" };
    if (expiresSoon(o)) return { rank: 3, key: "orders.expiresSoon" };
    return null;
  }
  function visibleRows() {
    const rank = (o) => {
      const f = flagOf(o);
      return f ? f.rank : 9;
    };
    const open = orders.filter((o) => isOpen(o) || needsReturn(o)).concat(stranded);
    const first = open.filter((o) => flagOf(o)).sort((x, y) => rank(x) - rank(y));
    const ended = orders.filter((o) => !isOpen(o) && !needsReturn(o) && !hidden.has(o.id)).slice(0, ENDED_SHOWN);
    return first.concat(open.filter((o) => !flagOf(o)), ended);
  }
  function reportTotals() {
    const held = orders.concat(stranded).filter(holdsTokens);
    const lines = held.filter((o) => o.units > 0n).map((o) => ({ token: o.offer, units: o.units, decimals: o.decimals, symbol: o.symbol, name: o.symbol, usd: worthOf(o) }));
    if (held.length) lines.push({ native: true, units: GAS_ON_ORDER * BigInt(held.length), decimals: GRAM_DECIMALS });
    D.setOrdered(lines);
  }
  const rowTap = (o, view) => view.tap && (view.tap === "explorer" || canSign()) ? view.tap : null;
  function rowHtml(o) {
    const view = viewOf(o);
    const tap = rowTap(o, view);
    const kinds = view.kinds ? kindsOf(o) : [];
    const below = view.kinds ? `<span class="or-kinds">${kinds.map((kind) => `<span class="or-kind" data-kind="${kind}"></span>`).join("")}</span>` : `<span class="or-sub"${view.tone ? ` data-tone="${view.tone}"` : ""}>${CK.esc(view.sub)}</span>`;
    return `
      <div class="cell or-item${tap ? " press-row" : ""}" data-order="${CK.esc(o.id)}"${tap ? ` data-act="${tap}" role="button" tabindex="0"` : ""}>
        ${logoOf(o, 40)}
        <span class="or-main">
          <span class="or-line"><b class="or-sym">${CK.esc(o.units > 0n ? `${amountText(o)} ${o.symbol}` : `${D.qty(gramOf(o.gramHeld || GAS_ON_ORDER))} ${gram()}`)}</b>${view.kinds ? '<span class="or-head"></span>' : ""}</span>
          ${below}
        </span>
        ${view.spin ? '<span class="or-end"><i class="sw-spin sw-spin--small"></i></span>' : ""}
      </div>`;
  }
  const setText = (el, text) => {
    if (el && el.textContent !== text) el.textContent = text;
  };
  const setTone = (el, tone) => {
    if (el && el.dataset.tone !== tone) el.dataset.tone = tone;
  };
  function paintFigures(rows) {
    const box = listView && listView.body;
    if (!box) return;
    rows.forEach((o) => {
      const row = box.querySelector(`[data-order="${CSS.escape(o.id)}"]`);
      const headEl = row && row.querySelector(".or-head");
      if (!headEl) return;
      const fig = figuresOf(o);
      setText(headEl, fig.head.text);
      setTone(headEl, fig.head.tone);
      Object.keys(fig.kinds).forEach((kind) => {
        const line = row.querySelector(`.or-kind[data-kind="${kind}"]`);
        if (!line) return;
        const k = fig.kinds[kind];
        setText(line, kindText(o, kind, k));
        setTone(line, k.tone);
        if (k.label) line.setAttribute("aria-label", k.label);
        else line.removeAttribute("aria-label");
      });
    });
  }
  function paintSummary() {
    if (!slot) return;
    const address = T.wallet && T.wallet.address;
    if (!loaded) {
      const kept = Number(String(store.get(COUNT_KEY + address) || "").split(":")[0]) || 0;
      if (failed && kept) {
        if (shape === "failed") return;
        slot.hidden = false;
        slot.innerHTML = `<div class="group list--free or-list"><button class="cell press-row or-summary" type="button" data-act="reload"><span class="cell-main"><span class="cell-title">${tx("orders.loadFail")}</span></span><span class="cell-value or-retry">${tx("common.retry")}</span></button></div>`;
        shape = "failed";
        return;
      }
      if (shape === `wait:${kept}` && (slot.childElementCount || !kept)) return;
      shape = `wait:${kept}`;
      slot.hidden = !kept;
      slot.innerHTML = kept ? '<div class="group list--free or-list"><div class="wallet-skel or-skel"></div></div>' : "";
      return;
    }
    const rows = visibleRows();
    store.set(COUNT_KEY + address, String(rows.length));
    const count = orders.filter(isOpen).length;
    const flag = rows.map(flagOf).filter(Boolean).sort((x, y) => x.rank - y.rank)[0] || null;
    const next = [CK.i18n.lang, rows.length, count, flag ? flag.key : ""].join("~");
    if (next === shape && slot.childElementCount) return;
    const appearing = slot.hidden && rows.length > 0;
    shape = next;
    slot.hidden = !rows.length;
    slot.innerHTML = rows.length ? `<div class="group list--free or-list"><button class="cell press-row or-summary" type="button" data-act="list"><span class="cell-main"><span class="cell-title">${tx("orders.title")}${count ? ` <span class="or-count">${count}</span>` : ""}</span></span>${flag ? `<span class="cell-value or-flag"><i class="or-dot" aria-hidden="true"></i>${tx(flag.key)}</span>` : ""}${icon("chevron-right", { size: 16, className: "cell-chevron" })}</button></div>` : "";
    if (appearing) {
      slot.classList.remove("list-in");
      void slot.offsetWidth;
      slot.classList.add("list-in");
    }
  }
  let listView = null;
  function paintList() {
    const v = listView;
    if (!v) return;
    const rows = visibleRows();
    const next = [CK.i18n.lang, canSign(), rows.map((o) => [o.id, o.state, o.freed, !!cancelSent.get(o.id), returnsSent.has(o.id), o.units, o.outUnits, !!flagOf(o)].join("|")).join()].join("~");
    if (next !== v.shape) {
      v.shape = next;
      v.body.innerHTML = rows.length ? `<div class="group list--free or-list">${rows.map(rowHtml).join("")}</div>` : "";
    }
    paintFigures(rows);
  }
  function paint() {
    paintSummary();
    paintList();
  }
  function schedule() {
    clearTimeout(pollTimer);
    if (!T.wallet) return;
    const busy = orders.some((o) => o.state === "funding" || o.state === "firing" || o.state === "cancelling" || o.state === "replacing") || cancelSent.size > 0 || returnsSent.size > 0;
    pollTimer = setTimeout(refresh, busy ? POLL_BUSY_MS : POLL_MS);
  }
  function resendFunding() {
    if (!canSign() || DemoSwap.pending) return;
    if (!orders.some((o) => o.state === "funding" && Date.now() - o.createdAt > RESEND_AFTER_MS)) return;
    CK.wallet.resend().catch((err) => console.error(err));
  }
  function lookForStranded() {
    const address = T.wallet && T.wallet.address;
    const imported = CK.wallet.orderScan();
    const reason = imported || orders.some((o) => o.state === "failed" && o.failure === "funding");
    if (!address || scannedFor === address || !reason || !canSign()) return;
    scannedFor = address;
    Promise.resolve(imported || CK.wallet.scanOrderWallets()).then((rows) => {
      if (!Array.isArray(rows) || !T.wallet || T.wallet.address !== address) return;
      stranded = rows.filter((row) => !row.busy && (row.jettons.length > 0 || row.balance >= GAS_DUST) && !orders.some((o) => o.subwallet === row.subwallet && (isOpen(o) || needsReturn(o)))).map((row) => {
        const token = row.jettons.find((j) => CK.swapAudit.orderOffer(T.rawAddress(j.token))) || row.jettons[0];
        const offer = token ? T.rawAddress(token.token) : null;
        const known = offer ? CK.swapAudit.knownDecimals(offer) : null;
        const names = CK.market.cleanToken({ id: "ton:x", symbol: token && token.symbol || gram(), name: "", address: offer || "" });
        return { id: `found-${row.subwallet}`, state: "found", subwallet: row.subwallet, offer: offer || row.address, jettonWallet: token ? T.rawAddress(token.wallet) : null, decimals: known === null ? 9 : known, units: token ? T.parseUnits(token.units) : 0n, symbol: names ? names.symbol : "?", gramHeld: row.balance, stopOut: null, takeOut: null, expected: null, lastOut: null, outUnits: null, freed: false };
      });
      reportTotals();
      paint();
    }, (err) => console.error(err));
  }
  let launchOrder = (() => {
    try {
      const id = CK.tg && CK.tg.launchSearch ? CK.tg.launchSearch.get("order") : null;
      return typeof id === "string" && ID_FORMAT.test(id) ? id : null;
    } catch (_) {
      return null;
    }
  })();
  function openLaunched() {
    if (!launchOrder) return;
    const o = orders.find((one) => one.id === launchOrder);
    launchOrder = null;
    if (!o || !slot) return;
    if (o.state === "active" || rearmable(o)) openOrder(o);
  }
  function refresh() {
    clearTimeout(pollTimer);
    const wallet = T.wallet;
    if (!wallet) return Promise.resolve();
    if (document.hidden || !(shownFn() || followers.size)) {
      schedule();
      return Promise.resolve();
    }
    if (job) return job;
    job = CK.wallet.listOrders().then((rows) => {
      if (!T.wallet || T.wallet.address !== wallet.address) return;
      ordersFor = wallet.address;
      orders = rows.map(cleanOrder).filter(Boolean);
      noteReplacing(orders);
      const now = Date.now();
      cancelSent.forEach((at, id) => {
        const o = orders.find((one) => one.id === id);
        if (!o || !(o.state === "active" || o.state === "cancelling" || o.state === "replacing") || now - at > CANCEL_SHOWN_MS) cancelSent.delete(id);
      });
      returnsSent.forEach((id) => {
        const o = orders.find((one) => one.id === id);
        if (o && !needsReturn(o)) returnsSent.delete(id);
      });
      loaded = true;
      failed = false;
      const held = orders.filter(holdsTokens).map((o) => o.id).join();
      const moved = heldKey !== null && held !== heldKey;
      heldKey = held;
      if (moved) {
        Promise.resolve(movedFn()).catch(() => null).then(() => {
          reportTotals();
          paint();
        });
      } else {
        reportTotals();
      }
      resendFunding();
      lookForStranded();
      paint();
      openLaunched();
      changed();
    }, (err) => {
      if (reasonOf(err) === "not_allowed" || reasonOf(err) === "orders_off") loaded = true;
      else failed = true;
      paint();
    }).finally(() => {
      job = null;
      schedule();
    });
    return job;
  }
  function openSteps(first, title) {
    if (CK.sheet.top) return null;
    const stack = [];
    let sheet = null, body = null, slotEl = null, back = null, dispose = null, then = null, built2 = false;
    function show(dir) {
      if (dispose) dispose();
      dispose = null;
      if (document.activeElement && sheet.el.contains && sheet.el.contains(document.activeElement)) document.activeElement.blur();
      body.className = `sheet-body${built2 ? "" : " is-arriving"}`;
      body.scrollTop = 0;
      body.innerHTML = "";
      const step = stack[stack.length - 1];
      back.hidden = stack.length < 2;
      slotEl.innerHTML = "";
      if (step.head) step.head(slotEl);
      else slotEl.textContent = step.title;
      sheet.el.setAttribute("aria-label", step.title);
      dispose = step.build(body, nav) || null;
      if (!built2) return;
      if (dir && body.animate && !CK.reducedMotion()) body.animate([{ opacity: 0.4, transform: `translate3d(${dir * 16}px,0,0)` }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    const nav = {
      push(step) {
        if (step) {
          stack.push(step);
          show(1);
        }
      },
      back() {
        if (stack.length > 1) {
          stack.pop();
          show(-1);
        }
      },

      done() {
        if (stack.length > 1 && stack[0].list) {
          stack.length = 1;
          show(-1);
        } else sheet.close();
      },

      close(fn) {
        then = fn || null;
        sheet.close();
      },
      get sheet() {
        return sheet;
      }
    };
    CK.sheet.open({
      title: title || first.title,
      detents: ["fit"],
      onClose() {
        if (dispose) dispose();
        dispose = null;
        if (then) then();
      },
      build(b, api) {
        sheet = api;
        body = b;
        back = CK.el(`<button class="navbtn navbtn--flat press or-back" type="button" aria-label="${tx("nav.back")}" hidden>${icon("chevron-left", { size: 20 })}</button>`);
        slotEl = CK.el('<div class="or-step-title"></div>');
        const wrap = CK.el('<div class="or-step-head"></div>');
        $(".sheet-title", api.el).replaceWith(wrap);
        wrap.append(back, slotEl);
        back.addEventListener("click", () => nav.back());
        stack.push(first);
        show(0);
        if (window.DemoSwap && typeof DemoSwap.pinHeight === "function") DemoSwap.pinHeight(this, api, STEPS_MIN_HEIGHT);
      }
    });
    built2 = true;
    return nav;
  }
  const tokenHead = (o, title, sub) => (el) => {
    const head = CK.el(`<div class="tk-sheet-token">${logoOf(o, 36)}<span class="tk-sheet-name"><b></b>${sub ? "<span></span>" : ""}</span></div>`);
    $(".tk-sheet-name b", head).textContent = title;
    if (sub) $(".tk-sheet-name span", head).textContent = sub;
    el.appendChild(head);
  };
  function cancelStep(o) {
    if (!canSign()) {
      CK.toast(tx("swapSheet.noSign"), { icon: "warning", tone: "down" });
      return null;
    }
    const back = needsReturn(o);
    const title = tx(back ? "orders.returnTitle" : "orders.cancelTitle");
    return {
      title,
      head: tokenHead(o, title, o.symbol),
      build(body, nav) {
        body.classList.add("sw-status", "or-cancel");
        body.innerHTML = `
          <div class="sw-rows summary"></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            <button class="btn btn--wide press or-go" type="button"></button>
            <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx("swapSheet.password")}" aria-label="${tx("swapSheet.password")}"><button class="btn press" type="submit" aria-label="${tx("swapSheet.passwordGo")}">${icon("check", { size: 22 })}</button></form>
          </div>`;
        const rows = $(".sw-rows", body);
        const row = (name, value) => {
          const r = CK.el('<div class="summary-row"><span></span><b></b></div>');
          r.firstElementChild.textContent = name;
          r.lastElementChild.textContent = value;
          rows.appendChild(r);
          return r.lastElementChild;
        };
        ["stop", "take"].forEach((kind) => {
          const out = kind === "stop" ? o.stopOut : o.takeOut;
          if (!out) return;
          const price = shownPrice(out, o.units, o.decimals, o.offer);
          const approx = approxText(price, o.offer);
          DemoSwap.withWorth(row(kindName(kind, o.offer), `${D.qty(price)} ${unitOf(o.offer)}`), approx ? ` ${approx}` : "");
        });
        if (o.units > 0n) row(tx("orders.back"), `${amountText(o)} ${o.symbol}`);
        row(tx("orders.backGas"), `\u2248 ${D.qty(gramOf(GAS_ON_ORDER))} ${gram()}`);
        const line = $(".sw-line", body);
        const go = $(".or-go", body);
        const form = $(".sw-pass", body);
        const input = $(".sw-pass-input", body);
        go.textContent = tx(back ? "orders.returnGo" : "orders.cancelGo");
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || "bad";
        };
        let passDone = null, busy = false;
        let shakeNext = false;
        const askPassword = () => new Promise((resolve) => {
          go.hidden = true;
          form.hidden = false;
          input.value = "";
          input.focus({ preventScroll: true });
          if (shakeNext && !CK.reducedMotion()) form.animate([{ transform: "none" }, { transform: "translate3d(-8px,0,0)" }, { transform: "translate3d(7px,0,0)" }, { transform: "translate3d(-4px,0,0)" }, { transform: "translate3d(2px,0,0)" }, { transform: "none" }], { duration: 320, easing: "ease-out" });
          shakeNext = false;
          passDone = (value) => {
            passDone = null;
            input.value = "";
            form.hidden = true;
            go.hidden = false;
            resolve(value);
          };
        });
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          if (input.value && passDone) passDone(input.value);
        });
        async function run() {
          if (busy) return;
          busy = true;
          go.disabled = true;
          setLine("", "note");
          try {
            if (!await CK.wallet.canSign()) {
              setLine(tx("swapSheet.noSign"));
              return;
            }
            let password;
            for (; ; ) {
              if (CK.wallet.status.method === "password") {
                password = await askPassword();
                if (password === null) return;
              }
              setLine(tx("swap.signing"), "note");
              try {
                await CK.wallet.cancelOrder({ id: ID_FORMAT.test(o.id) ? o.id : void 0, subwallet: o.subwallet, offer: o.offer, jettonWallet: o.jettonWallet, units: o.units > 0n ? o.units.toString() : null }, { ...password ? { password } : {}, wallet: ordersFor });
                break;
              } catch (err) {
                if (err.code === "wrong_password") {
                  setLine(tx("swapSheet.passwordWrong"));
                  CK.haptic.error();
                  shakeNext = true;
                  continue;
                }
                throw err;
              } finally {
                password = void 0;
              }
            }
            CK.haptic.success();
            if (o.state === "found") stranded = stranded.filter((one) => one !== o);
            else if (back) returnsSent.add(o.id);
            else cancelSent.set(o.id, Date.now());
            reportTotals();
            nav.done();
            paint();
            changed();
            refresh();
          } catch (err) {
            if (CK.wallet.protectRefused(err)) {
              setLine(tx("wallet.needProtect"));
            } else if (CK.wallet.isRejection(err)) {
              setLine("", "note");
            } else if (err.code === "insufficient_gas") {
              console.error(err);
              setLine(tx("orders.notThere"));
            } else if (err.code === "send_unsure") {
              setLine(tx("swapSheet.tryAgain"));
            } else {
              console.error(err);
              setLine(tx(troubleOf(err).key));
            }
          } finally {
            busy = false;
            go.disabled = false;
          }
        }
        go.addEventListener("click", run);
        return () => {
          if (passDone) passDone(null);
        };
      }
    };
  }
  function signStep(body, setLine) {
    const form = $(".sw-pass", body);
    const input = $(".sw-pass-input", body);
    const buttons = () => Array.from(body.querySelectorAll(".sw-actions > [data-edit], .sw-actions > .btn"));
    let passDone = null, shakeNext = false;
    const ask = () => new Promise((resolve) => {
      const shown = buttons().filter((b) => !b.hidden);
      shown.forEach((b) => {
        b.hidden = true;
      });
      form.hidden = false;
      input.value = "";
      input.focus({ preventScroll: true });
      if (shakeNext && !CK.reducedMotion()) form.animate([{ transform: "none" }, { transform: "translate3d(-8px,0,0)" }, { transform: "translate3d(7px,0,0)" }, { transform: "translate3d(-4px,0,0)" }, { transform: "translate3d(2px,0,0)" }, { transform: "none" }], { duration: 320, easing: "ease-out" });
      shakeNext = false;
      passDone = (value) => {
        passDone = null;
        input.value = "";
        form.hidden = true;
        shown.forEach((b) => {
          b.hidden = false;
        });
        resolve(value);
      };
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.value && passDone) passDone(input.value);
    });
    return {
      dispose() {
        if (passDone) passDone(null);
      },
      async sign(call) {
        for (; ; ) {
          let password;
          if (CK.wallet.status.method === "password") {
            password = await ask();
            if (password === null) return false;
          }
          setLine(tx("swap.signing"), "note");
          try {
            await call({ ...password ? { password } : {}, wallet: ordersFor });
            return true;
          } catch (err) {
            if (err.code !== "wrong_password") throw err;
            setLine(tx("swapSheet.passwordWrong"));
            CK.haptic.error();
            shakeNext = true;
          } finally {
            password = void 0;
          }
        }
      }
    };
  }
  const passwordForm = () => `<form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx("swapSheet.password")}" aria-label="${tx("swapSheet.password")}"><button class="btn press" type="submit" aria-label="${tx("swapSheet.passwordGo")}">${icon("check", { size: 22 })}</button></form>`;
  function editTrouble(err, setLine) {
    if (CK.wallet.protectRefused(err)) setLine(tx("wallet.needProtect"));
    else if (CK.wallet.isRejection(err)) setLine("", "note");
    else if (err.code === "send_unsure") setLine(tx("swapSheet.tryAgain"));
    else {
      console.error(err);
      setLine(tx(troubleOf(err).key));
    }
  }
  const current = (o) => orders.find((one) => one.id === o.id) || o;
  function openOrder(o) {
    if (CK.sheet.top) return;
    const step = orderStep(o);
    if (step) openSteps(step, o.symbol);
  }
  function orderStep(o) {
    if (!canSign()) {
      CK.toast(tx("swapSheet.noSign"), { icon: "warning", tone: "down" });
      return null;
    }
    const expired = o.state === "expired";
    if (o.oddDecimals || (expired ? !rearmable(o) : o.state !== "active")) return null;
    let step = null;
    const title = `${amountText(o)} ${o.symbol}`;
    return {
      title,

      head: tokenHead(o, title, isUsdt(o.offer) ? tx("orders.gramLimit", { sym: gram() }) : ""),
      build(body, nav) {
        body.classList.add("sw-status", "or-cancel");
        const soon = expiresSoon(o);
        const acts = expired ? [["rearm", "orders.rearm", true], ["return", "orders.returnTitle", false]] : [["extend", "orders.extend", soon], ["change", "orders.change", !soon], ["cancel", "common.cancel", false]];
        if (!expired && !soon) acts.unshift(acts.splice(1, 1)[0]);
        body.innerHTML = `
          <div class="sw-rows summary"></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            ${acts.map(([act, key, main]) => act === "cancel" ? `<button class="or-link-danger press" type="button" data-edit="${act}">${tx(key)}</button>` : `<button class="btn btn--wide press${main ? "" : " btn--tinted"}" type="button" data-edit="${act}">${tx(key)}</button>`).join("")}
            ${passwordForm()}
          </div>`;
        const rows = $(".sw-rows", body);
        const row = (name, value) => {
          const r = CK.el('<div class="summary-row"><span></span><b></b></div>');
          r.firstElementChild.textContent = name;
          r.lastElementChild.textContent = value;
          rows.appendChild(r);
          return r.lastElementChild;
        };
        ["stop", "take"].forEach((kind) => {
          const out = kind === "stop" ? o.stopOut : o.takeOut;
          if (!out) return;
          const price = shownPrice(out, o.units, o.decimals, o.offer);
          const approx = approxText(price, o.offer);
          DemoSwap.withWorth(row(kindName(kind, o.offer), `${D.qty(price)} ${unitOf(o.offer)}`), approx ? ` ${approx}` : "");
        });
        if (o.validUntil > 0) row(tx("orders.until"), expired ? tx("orders.untilPast") : untilText(o.validUntil));
        const fee = feeTerms(o);
        row(tx("orders.fee"), fee.rate);
        const line = $(".sw-line", body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || "bad";
        };
        const feeLine = () => fee.note ? setLine(fee.note, "warn") : setLine("", "note");
        feeLine();
        step = signStep(body, setLine);
        let busy = false;
        const typeAgain = (kind) => nav.push(changeStep(current(o), kind === "rearm" ? "rearm" : "change", tx("orders.pricesAgain")));
        const edit = async (kind) => {
          if (busy) return;
          busy = true;
          body.querySelectorAll("[data-edit]").forEach((b) => {
            b.disabled = true;
          });
          feeLine();
          try {
            if (!await CK.wallet.canSign()) {
              setLine(tx("swapSheet.noSign"));
              return;
            }
            if (!await CK.wallet.orderPricesKnown(current(o))) {
              typeAgain(kind);
              return;
            }
            let done = null;
            const went = await step.sign(async (options) => {
              done = await CK.wallet.editOrder(current(o), { kind }, options);
            });
            if (!went) return;
            CK.haptic.success();
            CK.toast(kind === "extend" ? tx("orders.extended", { date: untilText(done.validUntil) }) : tx("orders.rearmed"), { icon: "check-circle", tone: "up" });
            nav.done();
            refresh();
          } catch (err) {
            if (kind === "rearm" && (reasonOf(err) === "stop_above_price" || reasonOf(err) === "take_below_price")) {
              nav.push(changeStep(current(o), "rearm", tx("orders.newPrices")));
              return;
            }
            if (err && err.code === "order_refused" && err.reason === "prices") {
              typeAgain(kind);
              return;
            }
            editTrouble(err, setLine);
          } finally {
            busy = false;
            body.querySelectorAll("[data-edit]").forEach((b) => {
              b.disabled = false;
            });
            if (!line.textContent) feeLine();
          }
        };
        body.addEventListener("click", (e) => {
          const button = e.target.closest("[data-edit]");
          if (!button || button.disabled) return;
          const act = button.dataset.edit;
          CK.haptic.light();
          if (act === "extend" || act === "rearm") {
            edit(act);
            return;
          }
          nav.push(act === "change" ? changeStep(current(o), "change") : cancelStep(current(o)));
        });
        return () => {
          if (step) step.dispose();
        };
      }
    };
  }
  function changeStep(o, kind, note) {
    if (!canSign() || o.oddDecimals) return null;
    let step = null;
    let closed = false;
    return {
      title: tx("orders.changeTitle"),
      head: tokenHead(o, tx("orders.changeTitle"), `${amountText(o)} ${o.symbol}`),
      build(body, nav) {
        body.classList.add("sw-status", "or-cancel");
        body.innerHTML = `
          <div class="sw-terms"><div class="or-rows"></div><div class="sw-term" hidden><span>${tx("orders.now")}</span></div></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            <button class="btn btn--wide press" type="button" data-edit="${kind}">${tx(kind === "rearm" ? "orders.rearm" : "orders.changeGo")}</button>
            ${passwordForm()}
          </div>`;
        const line = $(".sw-line", body);
        const go = $("[data-edit]", body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || "bad";
        };
        let busy = false;
        const now = o.lastOut || o.expected;
        const fee = feeTerms(o);
        let rows = null;
        let filling = true;
        const paint2 = () => {
          rows.paint();
          const problem = rows.active() ? rows.problem(GRAM_NEEDED) : { key: "orders.newPrices" };
          go.disabled = !!problem;
          if (busy) return;
          if (note) setLine(note, "note");
          else if (problem && rows.active()) setLine(tx(problem.key, problem.params), "note");
          else setLine(fee.note, fee.note ? "warn" : "note");
        };
        rows = attach($(".or-rows", body), {
          token: { id: o.offer },
          term: $(".sw-term", body),

          decimals: () => o.decimals,
          units: () => o.units,
          quote: () => now ? { expectedOut: now } : null,
          held: () => o.units,
          onChange() {
            if (!filling) note = "";
            paint2();
          }
        });
        filling = false;
        step = signStep(body, setLine);
        paint2();
        CK.wallet.orderPricesKnown(o).then((known) => {
          if (closed || busy) return;
          if (!known) {
            if (!note && !rows.active()) note = tx("orders.pricesAgain");
            paint2();
            return;
          }
          filling = true;
          ["stop", "take"].forEach((kindOf) => {
            const out = kindOf === "stop" ? o.stopOut : o.takeOut;
            const field = $(`.or-row[data-kind="${kindOf}"] .or-field`, body);
            if (!out || !field || field.value) return;
            field.value = fieldText(shownPrice(out, o.units, o.decimals, o.offer));
            field.dispatchEvent(new Event("input", { bubbles: true }));
          });
          filling = false;
          paint2();
        }, () => null);
        go.addEventListener("click", async () => {
          if (busy || go.disabled) return;
          busy = true;
          go.disabled = true;
          setLine(fee.note, fee.note ? "warn" : "note");
          try {
            if (!await CK.wallet.canSign()) {
              setLine(tx("swapSheet.noSign"));
              return;
            }
            const chosen = rows.intent();
            const went = await step.sign((options) => CK.wallet.editOrder(current(o), { kind, stopOut: chosen.stopOut, takeOut: chosen.takeOut }, options));
            if (!went) return;
            CK.haptic.success();
            CK.toast(tx(kind === "rearm" ? "orders.rearmed" : "orders.changed"), { icon: "check-circle", tone: "up" });
            nav.done();
            refresh();
          } catch (err) {
            editTrouble(err, setLine);
          } finally {
            busy = false;
            go.disabled = false;
            if (!line.textContent && fee.note) setLine(fee.note, "warn");
          }
        });
        return () => {
          closed = true;
          if (step) step.dispose();
        };
      }
    };
  }
  function openList() {
    if (CK.sheet.top) return;
    openSteps({
      title: tx("orders.title"),
      list: true,
      build(body, nav) {
        body.classList.add("or-sheet");
        const view = { body, nav, shape: null };
        listView = view;
        paintList();
        const act = (e) => onRowAct(e, nav);
        body.addEventListener("click", act);
        body.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " " || !e.target.getAttribute || e.target.getAttribute("role") !== "button") return;
          e.preventDefault();
          act(e);
        });
        return () => {
          if (listView === view) listView = null;
        };
      }
    });
  }
  const ACTIONS = {
    cancel: (o, nav) => nav.push(cancelStep(o)),
    return: (o, nav) => nav.push(cancelStep(o)),
    manage: (o, nav) => nav.push(orderStep(o)),
    sell(o, nav) {
      if (DemoSwap.state !== "open") return;
      const coin = coinOf(o);
      nav.close(() => DemoSwap.open(null, "sell", { id: o.offer, sym: coin ? coin.sym : o.symbol, name: coin ? coin.name : o.symbol, inst: coin || void 0, logo: coin ? coin.logo : null, decimals: o.decimals }));
    },
    explorer(o) {
      T.openLink(o.explorer ? `${EXPLORER}transaction/${o.explorer}` : EXPLORER + T.wallet.friendly);
    }
  };
  function onRowAct(e, nav) {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const id = el.closest("[data-order]") && el.closest("[data-order]").dataset.order;
    const o = orders.concat(stranded).find((one) => one.id === id);
    if (!o || !ACTIONS[el.dataset.act]) return;
    CK.haptic.light();
    ACTIONS[el.dataset.act](current(o), nav);
  }
  function onSlotClick(e) {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    if (el.dataset.act === "reload") {
      failed = false;
      refresh();
      return;
    }
    if (el.dataset.act !== "list") return;
    CK.haptic.light();
    openList();
  }
  function walletChanged() {
    orders = [];
    stranded = [];
    loaded = false;
    failed = false;
    shape = null;
    scannedFor = null;
    heldKey = null;
    cancelSent.clear();
    returnsSent.clear();
    clearTimeout(pollTimer);
    D.setOrdered([]);
    paint();
    changed();
    if (T.wallet) refresh();
  }
  let built = false;
  window.DemoOrders = {

    GRAM_NEEDED,

    GAS_ON_ORDER,
    attach,

    figures: (raw) => {
      const o = cleanOrder(raw);
      return o ? figuresOf(o) : null;
    },
    place,
    openPlaced,
    forToken,

    drawable: (offer) => {
      const raw = rawOf(offer);
      return !!raw && !isUsdt(raw) && CK.swapAudit.orderOffer(raw);
    },

    check,
    canPlace,
    maxUnits: capOf,

    open(id) {
      const o = orders.find((one) => one.id === id);
      if (o && o.state === "active") openOrder(o);
    },

    editable: (raw) => {
      const o = cleanOrder(raw);
      return o ? { rearm: rearmable(o), soon: expiresSoon(o), view: viewOf(o) } : null;
    },

    feeTerms: (raw) => {
      const o = cleanOrder(raw);
      return o ? feeTerms(o) : null;
    },

    follow(fn) {
      followers.add(fn);
      if (!job) refresh();
      return () => {
        followers.delete(fn);
      };
    },
    reason: reasonOf,
    trouble: troubleOf,

    mount(section, shown, moved) {
      if (!built) {
        built = true;
        T.onWallet(walletChanged);
      }
      shownFn = shown;
      movedFn = moved;
      if (section !== slot) {
        slot = section;
        shape = null;
        slot.addEventListener("click", onSlotClick);
      }
      paint();
      if (!loaded && !job) refresh();
    },
    refresh
  };
})();
