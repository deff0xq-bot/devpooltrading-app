(function() {
  "use strict";
  const CK = window.CK = window.CK || {};
  const doc = document, root = doc.documentElement;
  const noop = () => {
  };
  const done = () => Promise.resolve();
  const SOFT = Object.freeze({ ms: 380, ease: "cubic-bezier(.22, 1, .36, 1)", rise: 12, blur: 6, scale: 0.985, stagger: 38 });
  const SPRING = Object.freeze({ stiffness: 170, damping: 26.077, ms: 460, rise: 12, scale: 0.985, stagger: 38, fallback: "cubic-bezier(.22, 1, .36, 1)" });
  const SHEET = Object.freeze({ stiffness: 190, damping: 27.568, ms: 520, fallback: "cubic-bezier(.22, 1, .36, 1)" });
  const CHART = Object.freeze({ ms: 900, from: 0.82, delay: 84, areaMs: 700, areaDelay: 400 });
  const TAB = Object.freeze({ outMs: 220, outEase: "cubic-bezier(.4, 0, 1, 1)", away: 28.8, toward: 36, delay: 140 });
  const LEAVE = Object.freeze({ ms: 171, ease: "cubic-bezier(.4, 0, 1, 1)", rise: 6, stagger: 12 });
  const CARD_BACK = Object.freeze({ ease: "cubic-bezier(.4, 0, .2, 1)" });
  const REDUCED_MS = 120;
  const MAX_STEPS = 12;
  const BOOT_MS = 500;
  const SHEET_CONTENT_DELAY = 90;
  const SPAN_S = 1.1, POINTS = 48;
  const valuesCache =   new Map();
  function springValues(k, d) {
    const id = k + "/" + d;
    if (valuesCache.has(id)) return valuesCache.get(id);
    const w0 = Math.sqrt(k), zeta = d / (2 * w0);
    const out = [];
    for (let i = 0; i <= POINTS; i++) {
      const t = i / POINTS * SPAN_S;
      let v;
      if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        v = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + zeta * w0 / wd * Math.sin(wd * t));
      } else {
        v = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      }
      out.push(+v.toFixed(4));
    }
    out[POINTS] = 1;
    valuesCache.set(id, out);
    return out;
  }
  let linearOk = null;
  function linearSupported() {
    if (linearOk === null) {
      try {
        linearOk = !!(window.CSS && CSS.supports && CSS.supports("transition-timing-function", "linear(0, 1)"));
      } catch (e) {
        linearOk = false;
      }
    }
    return linearOk;
  }
  function springEasing(k, d, fallback) {
    return linearSupported() ? `linear(${springValues(k, d).join(", ")})` : fallback || SPRING.fallback;
  }
  const springEase = () => SOFT.ease;
  const sheetEase = () => SOFT.ease;
  function physics(k, d, ms) {
    const s = SPAN_S * 1e3 / ms;
    return Object.freeze({ stiffness: +(k * s * s).toFixed(2), damping: +(d * s).toFixed(3) });
  }
  const springs = Object.freeze({
    spring: physics(SPRING.stiffness, SPRING.damping, SPRING.ms),
    sheet: physics(SHEET.stiffness, SHEET.damping, SHEET.ms)
  });
  const reduced = () => {
    if (CK.reducedMotion) return !!CK.reducedMotion();
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };
  const blurOk = () => !root.classList.contains("lite-glass");
  const now = () => window.performance && performance.now ? performance.now() : Date.now();
  let bootAt = doc.readyState === "complete" ? now() : -1, settledAt = -1;
  const booted = () => {
    if (bootAt < 0) bootAt = now();
  };
  if (bootAt < 0) {
    doc.addEventListener("DOMContentLoaded", booted, { once: true });
    window.addEventListener("load", booted, { once: true });
  }
  if (window.MutationObserver) {
    let settling = root.classList.contains("tg-settling");
    new MutationObserver(() => {
      const on = root.classList.contains("tg-settling");
      if (settling && !on) settledAt = now();
      settling = on;
    }).observe(root, { attributes: true, attributeFilter: ["class"] });
  }
  function armed() {
    if (bootAt < 0 || root.classList.contains("tg-settling")) return false;
    return now() - Math.max(bootAt, settledAt) >= BOOT_MS;
  }
  let quietDepth = 0;
  const hiddenPage = () => doc.visibilityState === "hidden" || doc.hidden === true;
  const allowed = (o) => !(quietDepth > 0 || o.restored || hiddenPage() || !o.force && !armed());
  const UNSEEN = '[hidden], [role="tabpanel"][aria-hidden="true"], .is-covered, .app-stage[aria-hidden="true"]';
  function inSight(els) {
    const h = window.innerHeight || root.clientHeight || 0;
    return els.filter((el) => {
      if (!el || el.isConnected === false) return false;
      if (el.closest && el.closest(UNSEEN)) return false;
      if (typeof el.checkVisibility === "function" && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
      if (typeof el.getBoundingClientRect !== "function") return true;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return false;
      return r.bottom > 0 && (!h || r.top < h);
    });
  }
  const seenEls =   new WeakSet();
  const seenKeys =   new WeakMap();
  function keyOf(el, o, index) {
    let k = null;
    if (o.key) k = o.key(el);
    else if (el.dataset) k = el.dataset.motionKey || el.dataset.key || el.dataset.coin || el.dataset.id || null;
    return k == null || k === "" ? "@" + index : "k:" + k;
  }
  function takeFresh(els, o, wholeList) {
    const byParent =   new Map();
    const fresh = [];
    els.forEach((el) => {
      const parent = el.parentElement || null;
      if (o.fresh) seenEls.delete(el);
      if (!parent) {
        if (!seenEls.has(el)) fresh.push(el);
        seenEls.add(el);
        return;
      }
      if (!byParent.has(parent)) byParent.set(parent, { before: o.fresh ? null : seenKeys.get(parent) || null, now:   new Set() });
      const p = byParent.get(parent);
      const index = Array.prototype.indexOf.call(parent.children, el);
      const key = keyOf(el, o, index);
      const known = p.before ? p.before.has(key) : seenEls.has(el);
      p.now.add(key);
      seenEls.add(el);
      if (!known) fresh.push(el);
    });
    byParent.forEach((p, parent) => {
      if (!wholeList && p.before) p.before.forEach((key) => p.now.add(key));
      seenKeys.set(parent, p.now);
    });
    return fresh;
  }
  const running =   new WeakMap();
  function stop(el) {
    const list = running.get(el);
    if (!list) return;
    running.delete(el);
    list.forEach((a) => {
      try {
        a.cancel();
      } catch (e) {
      }
    });
  }
  function isRunning(el) {
    const list = running.get(el);
    return !!list && list.some((a) => a.playState === "running" || a.playState === "pending");
  }
  function poseNow(el) {
    if (!isRunning(el) || !window.getComputedStyle) return null;
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform && cs.transform !== "none" ? cs.transform : "none" };
  }
  function play(el, frames, timing, keepOthers) {
    if (!el || typeof el.animate !== "function") return null;
    if (!keepOthers) stop(el);
    const t = Object.assign({ fill: "backwards" }, timing);
    let a = null;
    try {
      a = el.animate(frames, t);
    } catch (e) {
      if (!/^linear\(/.test(t.easing || "")) return null;
      try {
        a = el.animate(frames, Object.assign({}, t, { easing: SPRING.fallback }));
      } catch (_) {
        return null;
      }
    }
    const list = running.get(el) || [];
    list.push(a);
    running.set(el, list);
    const forget = () => {
      const now2 = running.get(el);
      if (!now2) return;
      const left = now2.filter((x) => x !== a);
      if (left.length) running.set(el, left);
      else running.delete(el);
    };
    if (a && a.finished) a.finished.then(forget, forget);
    return a;
  }
  const settled = (anims) => Promise.all(anims.filter(Boolean).map((a) => a.finished ? a.finished.then(noop, noop) : null)).then(noop);
  const LET_GO_MS = 1500;
  function letGoLater(el, a) {
    if (!a || !a.finished) return;
    a.finished.then(() => setTimeout(() => {
      if (el.isConnected !== false && a.playState === "finished") {
        try {
          a.cancel();
        } catch (e) {
        }
      }
    }, LET_GO_MS), noop);
  }
  function baseTransform(el) {
    stop(el);
    if (!window.getComputedStyle) return "none";
    const t = getComputedStyle(el).transform;
    return t && t !== "none" ? t : "none";
  }
  const over = (base, offset) => base === "none" ? offset : base + " " + offset;
  const ROW = '[data-motion="row"], .row, .list-row, li, [role="listitem"], [role="option"], [role="row"]';
  const isRow = (el) => !(el.dataset && el.dataset.motion === "block") && !!(el.matches && el.matches(ROW));
  function riseFrames(kind, el) {
    if (reduced()) return [{ opacity: 0 }, { opacity: 1 }];
    if (kind === "row") {
      const f02 = { opacity: 0, transform: `translate3d(0, ${SOFT.rise}px, 0) scale(${SOFT.scale})` }, f12 = { opacity: 1, transform: "none" };
      if (blurOk()) {
        f02.filter = `blur(${SOFT.blur}px)`;
        f12.filter = "blur(0px)";
      }
      return [f02, f12];
    }
    const base = baseTransform(el);
    const f0 = { opacity: 0, transform: over(base, `translate3d(0, ${SOFT.rise}px, 0) scale(${SOFT.scale})`) }, f1 = { opacity: 1, transform: base };
    if (blurOk()) {
      f0.filter = `blur(${SOFT.blur}px)`;
      f1.filter = "blur(0px)";
    }
    return [f0, f1];
  }
  function riseTiming(kind, step, o) {
    if (reduced()) return { duration: REDUCED_MS, delay: 0, easing: "ease-out" };
    const at = Math.min(step, MAX_STEPS);
    const base = o.delay || 0;
    if (kind === "row") return { duration: SOFT.ms, delay: base + at * (o.stagger != null ? o.stagger : SOFT.stagger), easing: SOFT.ease };
    return { duration: SOFT.ms, delay: base + at * (o.stagger != null ? o.stagger : SOFT.stagger), easing: SOFT.ease };
  }
  function gather(target, childrenOfOne) {
    if (!target) return { els: [], whole: false };
    if (target.nodeType === 1) {
      return childrenOfOne ? { els: Array.from(target.children), whole: true } : { els: [target], whole: false };
    }
    return { els: Array.from(target).filter((el) => el && el.nodeType === 1), whole: false };
  }
  function enter(els, o, kind, whole) {
    const fresh = takeFresh(els, o, whole);
    if (!fresh.length || !allowed(o)) return done();
    const list = o.force ? fresh.filter((el) => el.isConnected !== false && !el.hidden) : inSight(fresh);
    const anims = list.map((el, i) => {
      const k = kind === "auto" ? isRow(el) ? "row" : "block" : kind;
      return play(el, riseFrames(k, el), riseTiming(k, i, o));
    });
    return settled(anims);
  }
  function rows(target, opts) {
    const g = gather(target, true);
    return enter(g.els, opts || {}, "row", g.whole);
  }
  function blocks(target, opts) {
    const g = gather(target, false);
    return enter(g.els, opts || {}, "block", false);
  }
  function enterAuto(target, opts) {
    const g = gather(target, false);
    return enter(g.els, opts || {}, "auto", false);
  }
  function balance(el, opts) {
    const o = opts || {};
    if (!el) return done();
    const before = el.textContent;
    if (o.text != null && String(o.text) !== before) el.textContent = String(o.text);
    const from = o.from != null ? String(o.from) : o.text != null ? before : null;
    const first = !seenEls.has(el);
    seenEls.add(el);
    if (!allowed(o) || !o.force && !inSight([el]).length) return done();
    if (first) return settled([play(el, riseFrames("row", el), riseTiming("row", 0, o))]);
    if (from == null || from === el.textContent) return done();
    return roll(el, from);
  }
  function roll(el, from) {
    const text = el.textContent;
    if (reduced() || el.children.length) return settled([play(el, [{ opacity: 0.4 }, { opacity: 1 }], { duration: REDUCED_MS, easing: "ease-out" })]);
    const chars = Array.from(text), old = Array.from(from);
    const changed = chars.map((ch, i) => old[old.length - chars.length + i] !== ch);
    const label = el.getAttribute("aria-label");
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const spans = chars.map((ch) => {
      const s = doc.createElement("span");
      s.style.display = "inline-block";
      s.textContent = ch === " " ? "\xA0" : ch;
      el.appendChild(s);
      return s;
    });
    const blur = blurOk() ? `blur(${SOFT.blur / 2}px)` : "blur(0px)";
    let step = 0;
    const anims = spans.map((s, i) => changed[i] ? play(s, [{ opacity: 0, transform: "translate3d(0, 60%, 0)", filter: blur }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: SOFT.ms, delay: 14 * step++, easing: SOFT.ease }) : null);
    const restore = () => {
      if (el.childNodes.length !== spans.length || !spans.every((s) => s.parentNode === el)) return;
      el.textContent = text;
      if (label == null) el.removeAttribute("aria-label");
      else el.setAttribute("aria-label", label);
    };
    return settled(anims).then(restore);
  }
  function chart(target, opts) {
    const o = opts || {};
    if (!target) return done();
    const tag = (n) => String(n && n.tagName || "").toLowerCase();
    const svg = tag(target) === "svg" ? target : target.ownerSVGElement || target.querySelector && target.querySelector("svg");
    if (!svg) return done();
    if (!allowed(o) || !o.force && !inSight([svg]).length) return done();
    if (reduced()) return settled([play(svg, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, easing: "ease-out" })]);
    const onePath = tag(target) === "path";
    const fillOf = (p) => (p.getAttribute("fill") || (window.getComputedStyle ? getComputedStyle(p).fill : "") || "").trim();
    let lines = onePath ? [target] : Array.from(svg.querySelectorAll(".chart-line, [data-motion-line]"));
    if (!onePath && !lines.length) lines = Array.from(svg.querySelectorAll("path")).filter((p) => fillOf(p) === "none");
    const areas = onePath ? [] : Array.from(svg.querySelectorAll("path")).filter((p) => lines.indexOf(p) < 0 && fillOf(p) !== "none");
    const delay = (o.delay || 0) + CHART.delay;
    const values = springValues(SPRING.stiffness, SPRING.damping);
    const anims = [];
    lines.forEach((line) => {
      let len = 0;
      try {
        len = line.getTotalLength();
      } catch (e) {
        len = 0;
      }
      if (!(len > 0)) return;
      const kept = line.style.strokeDasharray;
      line.style.strokeDasharray = `${len} ${len}`;
      const frames = values.map((v) => ({ strokeDashoffset: `${(len * (1 - Math.min(1, v))).toFixed(2)}px` }));
      const a = play(line, frames, { duration: CHART.ms, delay, easing: "linear" });
      const restore = () => {
        line.style.strokeDasharray = kept;
      };
      if (!a) {
        restore();
        return;
      }
      a.finished.then(restore, restore);
      anims.push(a);
    });
    let grow = o.scale;
    if (!grow) {
      const plot = svg.parentElement;
      grow = target !== svg && !onePath && plot && plot !== target && target.contains && target.contains(plot) ? plot : svg;
    }
    anims.push(play(grow, [{ transform: `scaleY(${CHART.from})`, transformOrigin: "50% 100%" }, { transform: "none", transformOrigin: "50% 100%" }], { duration: CHART.ms, delay, easing: springEase() }));
    areas.forEach((area) => {
      const to = window.getComputedStyle ? getComputedStyle(area).opacity : "1";
      anims.push(play(area, [{ opacity: 0 }, { opacity: to }], { duration: CHART.areaMs, delay: (o.delay || 0) + CHART.areaDelay, easing: "ease-out" }));
    });
    return settled(anims);
  }
  function cardFromRow(rowEl, cardEl, opts) {
    const o = opts || {};
    if (!rowEl || !cardEl || typeof cardEl.animate !== "function") return done();
    if (hiddenPage()) return done();
    if (reduced()) {
      const a = play(cardEl, o.reverse ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, easing: "ease-out", fill: o.reverse ? "forwards" : "backwards" });
      if (o.reverse) letGoLater(cardEl, a);
      return settled([a]);
    }
    const r = rowEl.getBoundingClientRect(), c = cardEl.getBoundingClientRect();
    if (!c.width || !c.height || !r.width && !r.height) return done();
    const px = (v) => `${Math.max(0, v).toFixed(1)}px`;
    const radius = o.radius != null ? o.radius : window.getComputedStyle && parseFloat(getComputedStyle(rowEl).borderTopLeftRadius) || 18;
    const shut = `inset(${px(r.top - c.top)} ${px(c.right - r.right)} ${px(c.bottom - r.bottom)} ${px(r.left - c.left)} round ${radius}px)`;
    const open = `inset(0px 0px 0px 0px round ${o.cardRadius || 0}px)`;
    if (o.reverse) {
      const a = play(cardEl, [{ clipPath: open }, { clipPath: shut }], { duration: SPRING.ms, easing: CARD_BACK.ease, fill: "forwards" });
      const b = play(cardEl, [{ opacity: 1 }, { opacity: 0 }], { duration: SPRING.ms / 2, delay: SPRING.ms / 2, easing: "ease-in", fill: "forwards" }, true);
      letGoLater(cardEl, a);
      letGoLater(cardEl, b);
      return settled([a, b]);
    }
    const anims = [play(cardEl, [{ clipPath: shut }, { clipPath: open }], { duration: SHEET.ms, easing: sheetEase() })];
    const pair = o.logo || [rowEl.querySelector("[data-motion-logo]"), cardEl.querySelector("[data-motion-logo]")];
    if (pair && pair[0] && pair[1]) {
      const a = pair[0].getBoundingClientRect(), b = pair[1].getBoundingClientRect();
      if (b.width) {
        const flown = `translate3d(${(a.left - b.left).toFixed(1)}px, ${(a.top - b.top).toFixed(1)}px, 0) scale(${(a.width / b.width).toFixed(3)})`;
        anims.push(play(pair[1], [{ transform: flown, transformOrigin: "0 0" }, { transform: "none", transformOrigin: "0 0" }], { duration: SHEET.ms, easing: sheetEase() }));
      }
    }
    if (o.parts) anims.push(blocks(o.parts, { force: true, fresh: true, delay: 160 }));
    return settled(anims);
  }
  function toast(el, opts) {
    const o = opts || {};
    if (!el) return done();
    if (reduced()) {
      const a = play(el, o.out ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, easing: "ease-out", fill: o.out ? "forwards" : "backwards" });
      if (o.out) letGoLater(el, a);
      return settled([a]);
    }
    const base = baseTransform(el);
    if (o.out) {
      const a = play(el, [{ opacity: 1, transform: base }, { opacity: 0, transform: over(base, "scale(.94)") }], { duration: 220, easing: "cubic-bezier(.32, .72, 0, 1)", fill: "forwards" });
      letGoLater(el, a);
      return settled([a]);
    }
    return settled([play(el, [{ opacity: 0, transform: over(base, "translate3d(0, -12px, 0) scale(.96)") }, { opacity: 1, transform: base }], { duration: SPRING.ms, easing: springEase() })]);
  }
  function indicator(el, from, to, opts) {
    const o = opts || {};
    if (!el || to == null) return done();
    const parent = el.offsetParent || el.parentElement;
    const place = (p) => {
      if (p == null) return null;
      if (typeof p === "number") return { transform: `translate3d(${p * 100}%, 0, 0)` };
      if (p.nodeType === 1) {
        const r = p.getBoundingClientRect(), pr = parent ? parent.getBoundingClientRect() : { left: 0 };
        const x = r.left - pr.left + (parent ? parent.scrollLeft - (parent.clientLeft || 0) : 0);
        return { transform: `translate3d(${x.toFixed(1)}px, 0, 0)`, width: `${r.width.toFixed(1)}px` };
      }
      return { transform: `translate3d(${(+p.x || 0).toFixed(1)}px, 0, 0)`, width: p.width != null ? `${(+p.width).toFixed(1)}px` : void 0 };
    };
    const end = place(to);
    const mid = poseNow(el);
    const from0 = mid ? { transform: mid.transform, width: window.getComputedStyle ? getComputedStyle(el).width : void 0 } : place(from);
    stop(el);
    el.style.transform = end.transform;
    if (end.width) el.style.width = end.width;
    if (!from0 || !allowed(o)) return done();
    const first = { transform: from0.transform }, last = { transform: end.transform };
    if (end.width) {
      first.width = from0.width || end.width;
      last.width = end.width;
    }
    const timing = reduced() ? { duration: REDUCED_MS, easing: "ease-out" } : { duration: SPRING.ms, easing: springEase() };
    return settled([play(el, [first, last], timing)]);
  }
  function leave(target, opts) {
    const o = opts || {};
    const g = gather(target, true);
    if (!g.els.length || !allowed(o)) return done();
    const list = o.force ? g.els : inSight(g.els);
    const anims = list.map((el, i) => {
      const a = reduced() ? play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, easing: "ease-out", fill: "forwards" }) : play(el, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translate3d(0, ${-LEAVE.rise}px, 0)` }], { duration: LEAVE.ms, delay: Math.min(i, MAX_STEPS) * LEAVE.stagger, easing: LEAVE.ease, fill: "forwards" });
      letGoLater(el, a);
      return a;
    });
    return settled(anims);
  }
  function tabSwitch(from, to, dir) {
    if (!from || !to || from === to) return done();
    if (hiddenPage() || !armed() || quietDepth > 0) return done();
    if (to.getAttribute("aria-hidden") === "true") return done();
    const leaving = poseNow(from), coming = poseNow(to);
    if (reduced()) {
      return settled([
        play(from, [{ opacity: leaving ? leaving.opacity : 1 }, { opacity: 0 }], { duration: REDUCED_MS, easing: "ease-out" }),
        play(to, [{ opacity: coming ? coming.opacity : 0 }, { opacity: 1 }], { duration: REDUCED_MS, easing: "ease-out" })
      ]);
    }
    const d = dir < 0 ? -1 : 1;
    return settled([
      play(from, [leaving || { opacity: 1, transform: "none" }, { opacity: 0, transform: `translate3d(${-d * TAB.away}px, 0, 0) scale(${SPRING.scale})` }], { duration: TAB.outMs, easing: TAB.outEase }),
      play(to, [coming || { opacity: 0, transform: `translate3d(${d * TAB.toward}px, 0, 0) scale(${SPRING.scale})` }, { opacity: 1, transform: "none" }], { duration: SPRING.ms, delay: coming ? 0 : TAB.delay, easing: springEase() })
    ]);
  }
  function sheet(rootEl, body) {
    if (reduced()) return settled([play(rootEl, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, easing: "ease-out" })]);
    if (!body) return done();
    let parts = Array.from(body.children).filter((el) => !el.hidden);
    if (parts.length === 1 && parts[0].children.length > 1 && !isRow(parts[0])) parts = Array.from(parts[0].children).filter((el) => !el.hidden);
    return enterAuto(parts, { force: true, fresh: true, delay: SHEET_CONTENT_DELAY });
  }
  function quiet(fn) {
    quietDepth++;
    try {
      return fn();
    } finally {
      quietDepth--;
    }
  }
  root.classList.add("ck-motion");
  CK.motion = {
    rows,
    blocks,
    enter: enterAuto,
    balance,
    chart,
    cardFromRow,
    toast,
    indicator,
    leave,
    tabSwitch,
    sheet,
    quiet,
    springEasing: (k, d, fallback) => springEasing(k, d, fallback),
    physics,
    springs,
    SOFT,
    SPRING,
    SHEET,
    CHART,
    TAB,
    REDUCED_MS,
    get reduce() {
      return reduced();
    },
    get armed() {
      return armed();
    }
  };
  const LAUNCH_MAX_MS = 1800;
  (function launchEntrance() {
    const raf = typeof window.requestAnimationFrame === "function" ? window.requestAnimationFrame.bind(window) : null;
    if (!raf || typeof setTimeout !== "function" || !root || !root.classList || reduced() || hiddenPage()) return;
    root.classList.add("motion-launch");
    const started = now();
    let over2 = false;
    const soft = (rise) => {
      const f0 = { opacity: 0, transform: `translate3d(0, ${rise}px, 0) scale(${SOFT.scale})` }, f1 = { opacity: 1, transform: "none" };
      if (blurOk()) {
        f0.filter = `blur(${SOFT.blur}px)`;
        f1.filter = "blur(0px)";
      }
      return [f0, f1];
    };
    const play1 = (el, frames, timing) => {
      try {
        el.animate(frames, Object.assign({ easing: SOFT.ease, fill: "backwards" }, timing));
      } catch (_) {
      }
    };
    function finish(animate) {
      if (over2) return;
      over2 = true;
      const panes = doc.getElementById("panes"), bar = doc.getElementById("tabbar");
      const screen = animate && panes ? Array.from(panes.querySelectorAll(".screen")).find((s) => !s.hidden && s.getAttribute("aria-hidden") !== "true" && s.offsetParent !== null) : null;
      const parts = [];
      if (screen) {
        const nav = screen.querySelector(".navbar");
        if (nav) parts.push(nav);
        const scroll = screen.querySelector(".screen-scroll");
        let items = scroll ? Array.from(scroll.children) : [];
        if (items.length === 1 && items[0].children.length > 1) items = Array.from(items[0].children);
        const bottom = window.innerHeight || 800;
        parts.push(...items.filter((el) => el.offsetHeight > 0 && el.getBoundingClientRect().top < bottom).slice(0, 12));
      }
      root.classList.remove("motion-launch");
      if (!screen) return;
      parts.forEach((el, i) => play1(el, soft(SOFT.rise + 6), { duration: 520, delay: 40 + i * 55 }));
      if (bar) play1(bar, [{ opacity: 0, transform: "translate3d(0, 18px, 0)" }, { opacity: 1, transform: "none" }], { duration: 560, delay: 160 });
    }
    function tick() {
      if (over2) return;
      const panes = doc.getElementById("panes");
      if (panes && panes.querySelector(".screen .screen-scroll") && !root.classList.contains("tg-settling")) {
        raf(() => finish(true));
        return;
      }
      if (now() - started > LAUNCH_MAX_MS) return finish(false);
      raf(tick);
    }
    raf(tick);
    setTimeout(() => finish(false), LAUNCH_MAX_MS + 400);
  })();
})();
