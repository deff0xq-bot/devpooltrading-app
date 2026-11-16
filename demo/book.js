(function() {
  "use strict";
  const { icon, t: tx, esc } = CK;
  const T = CK.ton;
  const $ = (s, r) => (r || document).querySelector(s);
  const CLOUD_KEY = "ck_book_v1";
  const MAX = 20;
  const NAME_MAX = 32;
  const MEMO_MAX = 120;
  const CALL_MS = 5e3;
  const VERSION = 1;
  const NETS =   new Set(["ton"]);
  let state = "off", entries = [], book = null, job = null;
  const subs =   new Set();
  const changed = () => subs.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  });
  const fail = (code) => Object.assign(new Error(code), { code });
  const toB64 = (bytes) => btoa(String.fromCharCode(...bytes));
  const fromB64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  const plain = (text, max) => typeof text === "string" ? Array.from(text.replace(/[\p{C}]/gu, "").trim()).slice(0, max).join("") : "";
  const bound = (user) => new TextEncoder().encode(`book:v${VERSION}:${user}`);
  function cloud(method, ...args) {
    const store = CK.tg.app && CK.tg.app.CloudStorage;
    if (!store || typeof store[method] !== "function") return Promise.reject(fail("no_cloud"));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(fail("cloud_timeout")), CALL_MS);
      try {
        store[method](...args, (err, value) => {
          clearTimeout(timer);
          if (err) reject(fail("cloud_failed"));
          else resolve(value);
        });
      } catch (_) {
        clearTimeout(timer);
        reject(fail("cloud_failed"));
      }
    });
  }
  function clean(raw) {
    if (!raw || typeof raw !== "object" || !NETS.has(raw.net)) return null;
    const typed = T.parseRecipient(raw.address);
    const name = plain(raw.name, NAME_MAX);
    if (!typed || !name) return null;
    const memo = plain(raw.memo, MEMO_MAX);
    return { net: raw.net, address: typed.friendly, raw: typed.address, name, ...memo ? { memo } : {}, at: Number.isFinite(raw.at) ? raw.at : 0 };
  }
  const outOf = (e) => ({ net: e.net, address: e.address, name: e.name, ...e.memo ? { memo: e.memo } : {}, at: e.at });
  async function keyOf() {
    if (book) return book;
    await T.config();
    const answer = await T.api("wallet/book-key", { body: {} });
    const raw = fromB64(String(answer.key || ""));
    try {
      if (raw.length !== 32 || !Number.isSafeInteger(answer.user) || !/^[0-9a-f]{16}$/.test(answer.kid)) throw fail("book_refused");
      book = { key: await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]), kid: answer.kid, user: answer.user };
      return book;
    } finally {
      raw.fill(0);
    }
  }
  async function read() {
    const k = await keyOf();
    const text = await cloud("getItem", CLOUD_KEY);
    if (!text) return { list: [], other: false };
    let held = null;
    try {
      held = JSON.parse(text);
    } catch (_) {
      held = null;
    }
    if (!held || held.v !== VERSION || typeof held.iv !== "string" || typeof held.ct !== "string") return { list: [], other: true };
    if (held.kid !== k.kid) return { list: [], other: true };
    try {
      const open = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(held.iv), additionalData: bound(k.user) }, k.key, fromB64(held.ct));
      const list = JSON.parse(new TextDecoder().decode(open));
      return { list: (Array.isArray(list) ? list : []).map(clean).filter(Boolean).slice(0, MAX), other: false };
    } catch (_) {
      return { list: [], other: true };
    }
  }
  async function write(list) {
    if (state !== "ready") throw fail("book_off");
    const k = await keyOf();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealed = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: bound(k.user) }, k.key, new TextEncoder().encode(JSON.stringify(list.map(outOf))));
    const text = JSON.stringify({ v: VERSION, kid: k.kid, iv: toB64(iv), ct: toB64(new Uint8Array(sealed)) });
    if (text.length > 4096) throw fail("book_full");
    await cloud("setItem", CLOUD_KEY, text);
    entries = list;
    changed();
  }
  function load() {
    if (job) return job;
    const kind = CK.wallet && CK.wallet.status ? CK.wallet.status.kind : "none";
    if (!CK.tg.inside || CK.market.mode !== "live" || kind !== "signer" && kind !== "readonly") return Promise.resolve(state);
    state = "loading";
    job = read().then(({ list, other }) => {
      entries = list;
      state = other ? "other" : "ready";
    }, (err) => {
      if (err.code !== "not_found") console.warn("address book:", err.code || err.message);
      state = "fail";
    }).then(() => {
      job = null;
      changed();
      return state;
    });
    return job;
  }
  const sameAs = (net, address) => {
    const raw = T.rawAddress(address);
    return (e) => e.net === net && !!raw && e.raw === raw;
  };
  function rowHtml(e, i) {
    return `
      <div class="bk-row">
        <button class="cell press-row bk-pick" type="button" data-i="${i}">
          <span class="bk-ava" aria-hidden="true">${esc(Array.from(e.name)[0].toUpperCase())}</span>
          <span class="cell-main"><b class="bk-name">${esc(e.name)}</b><span class="bk-sub">${esc(T.shortAddress(e.address))}${e.memo ? ` \xB7 ${esc(e.memo)}` : ""}</span></span>
        </button>
        <button class="bk-edit press" type="button" data-edit="${i}" aria-label="${esc(tx("book.edit"))}">${icon("pencil", { size: 18 })}</button>
      </div>`;
  }
  function pickStep(o) {
    return {
      title: tx("book.title"),
      render(body, flow) {
        let shown = [];
        function paint() {
          shown = entries.filter((e) => e.net === o.net);
          body.innerHTML = shown.length ? `<div class="group bk-list">${shown.map(rowHtml).join("")}</div><p class="w-note">${esc(tx("book.note", { max: MAX }))}</p>` : CK.emptyState({ icon: "users", title: tx("book.empty"), className: "w-empty" });
        }
        const onClick = (e) => {
          const edit = e.target.closest("[data-edit]");
          if (edit) {
            CK.haptic.selection();
            flow.push(editStep(shown[Number(edit.dataset.edit)]));
            return;
          }
          const row = e.target.closest("[data-i]");
          if (!row) return;
          CK.haptic.selection();
          o.onPick(shown[Number(row.dataset.i)], flow);
        };
        body.addEventListener("click", onClick);
        const off = DemoBook.onChange(paint);
        paint();
        return () => {
          off();
          body.removeEventListener("click", onClick);
        };
      }
    };
  }
  function formStep(o) {
    return {
      title: o.title,
      render(body, flow) {
        body.innerHTML = `
          <div class="group summary bk-what"><div class="summary-row">${esc(tx("walletFlow.recipient"))}<b class="bk-addr"></b></div>${o.memo ? `<div class="summary-row">${esc(tx("walletFlow.comment"))}<b class="bk-memo"></b></div>` : ""}</div>
          <input class="w-memo bk-name-input" type="text" autocomplete="off" maxlength="${NAME_MAX}" enterkeyhint="done" placeholder="${esc(tx("book.namePh"))}" aria-label="${esc(tx("book.namePh"))}">
          <p class="sw-line bk-line" role="status"></p>
          <button class="btn btn--wide press bk-keep" type="button">${esc(tx("book.keep"))}</button>
          ${o.entry ? `<button class="tk-link bk-remove" type="button">${esc(tx("book.remove"))}</button>` : ""}`;
        $(".bk-addr", body).textContent = T.shortAddress(o.address);
        if (o.memo) $(".bk-memo", body).textContent = o.memo;
        const name = $(".bk-name-input", body), line = $(".bk-line", body), keep = $(".bk-keep", body);
        name.value = o.name || "";
        let busy = false;
        const say = (key, params) => {
          line.textContent = key ? tx(key, params) : "";
        };
        const paint = () => {
          keep.disabled = busy || !plain(name.value, NAME_MAX);
        };
        name.addEventListener("input", () => {
          say("");
          paint();
        });
        name.addEventListener("keydown", (e) => {
          if (e.key === "Enter") name.blur();
        });
        async function save(next, done) {
          busy = true;
          paint();
          try {
            await write(next);
            CK.haptic.success();
            CK.toast(tx(done), { icon: "check-circle", tone: "up" });
            flow.back();
          } catch (err) {
            console.warn("address book:", err.code || err.message);
            busy = false;
            say(err.code === "book_full" ? "book.full" : "book.saveFail", { max: MAX });
            paint();
          }
        }
        keep.addEventListener("click", () => {
          const label = plain(name.value, NAME_MAX);
          if (!label || busy) return;
          const rest = entries.filter((e) => !sameAs(o.net, o.address)(e) && e !== o.entry);
          if (rest.length >= MAX) return say("book.full", { max: MAX });
          const entry = clean({ net: o.net, address: o.address, name: label, memo: o.memo, at: Date.now() });
          if (!entry) return say("book.saveFail");
          save([entry].concat(rest), o.entry ? "book.changed" : "book.saved");
        });
        const remove = $(".bk-remove", body);
        if (remove) remove.addEventListener("click", () => {
          if (!busy) save(entries.filter((e) => e !== o.entry), "book.removed");
        });
        paint();
        if (!o.name) setTimeout(() => {
          if (body.contains(name)) name.focus({ preventScroll: true });
        }, 60);
      }
    };
  }
  const saveStep = (o) => formStep({ title: tx("book.save"), net: o.net, address: o.address, memo: plain(o.memo, MEMO_MAX), name: plain(o.name, NAME_MAX) });
  const editStep = (entry) => formStep({ title: tx("book.edit"), net: entry.net, address: entry.address, memo: entry.memo || "", name: entry.name, entry });
  if (CK.market && CK.market.ready && CK.wallet && CK.wallet.ready) Promise.all([CK.market.ready, CK.wallet.ready]).then(() => load(), () => {
  });
  window.DemoBook = {
    MAX,
    get state() {
      return state;
    },
    available: () => state === "ready",
    has: (net, address) => entries.some(sameAs(net, address)),
    list: (net) => entries.filter((e) => !net || e.net === net),
    load,
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    pickStep,
    saveStep,
    editStep,

    _seal: { clean, read, write }
  };
})();
