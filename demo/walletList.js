(function() {
  "use strict";
  const { icon, t: tx } = CK;
  const T = CK.ton;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const W = () => CK.wallet.wallets;
  const HEIGHT = 470;
  const WORD_COUNTS = [12, 15, 18, 21, 24];
  const NAME_MAX = 24;
  const ERRORS = {
    bad_words: "walletSetup.badPhrase",
    wallet_same: "wallets.same",
    wallet_added: "wallets.already",
    backup_failed: "wallets.failed",
    backup_other: "wallets.failed",
    wrong_password: "wallet.wrongPassword",
    password_needed: "wallets.password",
    password_short: "walletSetup.passShort",
    biometric_cancelled: "walletSetup.bioCancelled",
    biometric_lost: "wallet.lost",
    biometric_denied: "wallet.denied",
    biometric_unknown: "wallet.bioWait",
    owner_unconfirmed: "walletOwner.unconfirmed",
    wallets_wait: "wallets.wait",
    rate_limited: "wallets.limited",
    wallet_last: "wallets.lastStays",
    already_added: "wallets.alreadyAdded",
    storage_timeout: "walletSetup.storeWait",
    wallet_has_funds: "wallets.hasFunds",
    wallet_unsure: "wallets.unsure",
    no_secret: "wallets.elsewhere",
    wallet_p2p: "wallets.p2pOpen"
  };
  async function canRemove(address) {
    await W().removable(address);
    const p2p = window.DemoP2P || (window.DemoApp && DemoApp.loadP2P ? await DemoApp.loadP2P().catch(() => null) : null);
    if (!p2p && window.DemoApp && DemoApp.loadP2P) throw Object.assign(new Error("wallet_unsure"), { code: "wallet_unsure" });
    if (p2p && typeof p2p.usesWallet === "function" && await p2p.usesWallet(address)) throw Object.assign(new Error("wallet_p2p"), { code: "wallet_p2p" });
  }
  const nameOf = (row, i) => row.name || tx("wallets.default", { n: i + 1 });
  const HUES = ["#2F80ED", "#AF52DE", "#34C759", "#FF9500", "#30B0C7", "#FF2D55", "#5856D6", "#A2845E"];
  const hueOf = (i) => HUES[Math.max(0, i) % HUES.length];
  const avatar = (i, on) => `<span class="wl-ava" style="--c:${hueOf(i)}">${icon("wallet", { fill: true })}${on ? `<i class="wl-on">${icon("check")}</i>` : ""}</span>`;
  const sourceOf = (row) => row.kind === "bip39" ? tx("wallets.kindBip39") : "";
  const needsPassword = () => {
    const status = CK.wallet.status;
    return (status.mainMethod || status.method) === "password";
  };
  const whyNot = (err, n) => {
    if (err && err.code === "wallets_full") return tx("wallets.full", { n: err.limit });
    const key = err && err.code === "bad_words" && window.DemoWalletSetup && DemoWalletSetup.errorKey(err, n) || ERRORS[err && (err.code || err.message)];
    if (!key) console.error(err);
    return tx(key || "wallets.failed");
  };
  function dock(flow, label) {
    const el = CK.el('<div class="sheet-dock sw-dock"><p class="sw-line" role="status"></p><button class="btn btn--wide press w-go" type="button"></button></div>');
    $(".w-go", el).textContent = label;
    flow.sheet.el.appendChild(el);
    return { line: $(".sw-line", el), go: $(".w-go", el) };
  }
  const passwordField = () => `<label class="search"><input class="wl-pass" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx("wallets.password"))}" aria-label="${CK.esc(tx("wallets.password"))}"></label>`;
  function readPassword(body) {
    const field = $(".wl-pass", body);
    if (!field) return void 0;
    const value = field.value;
    field.value = "";
    return value ? { password: value } : null;
  }
  const asked =   new Map();
  const ASKED_MS = 6e4;
  function keptNetsUsd(address) {
    try {
      const kept = JSON.parse(localStorage.getItem("ck-folio-kept"));
      const one = kept && Array.isArray(kept.wallets) ? kept.wallets.find((w) => w && w.a === address && Array.isArray(w.rows)) : null;
      return one ? one.rows.reduce((sum, r) => sum + (r && r.net && Number.isFinite(r.usd) && r.usd > 0 && r.flagged !== true ? r.usd : 0), 0) : 0;
    } catch (_) {
      return 0;
    }
  }
  function askedText(one, address) {
    if (!one || !one.at) return "";
    const price = window.DemoData.byId.ton.price || 0;
    if (one.gram > 0 && !price) return "";
    return CK.fmt.usd(one.usd + one.gram * price + keptNetsUsd(address));
  }
  function sumOf(row, totalNow, onAnswer) {
    if (row.active) return totalNow();
    const kept = window.DemoData.keptTotal(row.address);
    const seen = asked.get(row.address);
    const now = () => {
      const text = askedText(asked.get(row.address), row.address);
      return !text && kept !== null ? CK.fmt.usd(kept) : text;
    };
    if (seen && (seen.asking || Date.now() - seen.at < ASKED_MS)) return now();
    asked.set(row.address, seen ? { ...seen, asking: true } : { at: 0, asking: true });
    T.api("wallet/balances?address=" + encodeURIComponent(row.address)).then((body) => {
      const rows = Array.isArray(body.balances) ? body.balances : [];
      let gram = 0, usd = 0;
      rows.forEach((one) => {
        if (one.native) gram += T.fromUnits(T.parseUnits(String(one.units)) || 0n, 9);
        else if (typeof one.usd === "number" && one.usd > 0 && one.risk !== "suspicious") usd += one.usd;
      });
      asked.set(row.address, { at: Date.now(), gram, usd });
      onAnswer();
    }, () => {
      if (seen) asked.set(row.address, { ...seen, asking: false });
      else asked.delete(row.address);
    });
    return now();
  }
  function listStep(totalNow) {
    return {
      title: tx("wallets.title"),
      render(body, flow) {
        body.classList.add("wl");
        const el = CK.el('<div class="sheet-dock sw-dock"><p class="sw-line" role="status"></p><button class="btn btn--tinted btn--wide press wl-add" type="button"></button></div>');
        flow.sheet.el.appendChild(el);
        const line = $(".sw-line", el), add = $(".wl-add", el);
        add.append(CK.el(icon("plus", { size: 18 })), tx("common.add"));
        const head = $(".sheet-head", flow.sheet.el);
        const editBtn = CK.el('<button class="tk-link wl-edit-mode" type="button"></button>');
        head.insertBefore(editBtn, $(":scope > .navbtn", head));
        let editing = false, gone = false;
        const tagOf = (row) => row.here ? sourceOf(row) : tx("wallets.elsewhere");
        const paint = () => {
          if (gone || flow.closing) return;
          const rows = W().list();
          const firstHere = rows.length && rows[0].here;
          const elsewhere = firstHere && rows.some((row) => !row.here);
          editBtn.hidden = !rows.length;
          editBtn.textContent = tx(editing ? "common.done" : "common.edit");
          const sumHtml = (row) => {
            const sum = sumOf(row, totalNow, paint);
            return sum ? `<span class="wl-sum">${CK.esc(sum)}</span>` : '<span class="wl-sum w-skel-bal"></span>';
          };
          body.innerHTML = `<div class="group wl-list list--free">${rows.map((row, i) => `
            <div class="wl-row" data-address="${CK.esc(row.address)}">
              <button class="cell press-row wl-line" type="button" aria-pressed="${row.active}">
                ${avatar(i, row.active)}
                <span class="wl-main"><span class="wl-title"><b>${CK.esc(nameOf(row, i))}</b>${tagOf(row) ? `<i class="wl-tag">${CK.esc(tagOf(row))}</i>` : ""}</span><span class="wl-sub">${CK.esc(T.shortAddress(row.friendly))}</span></span>
                ${sumHtml(row)}
              </button>
              ${editing ? `<button class="wl-edit press" type="button" aria-label="${CK.esc(tx("wallets.manage"))}">${icon("pencil", { size: 18 })}</button>` : ""}
            </div>`).join("")}</div>${elsewhere ? `<button class="tk-link wl-bring" type="button">${tx("wallets.bringBack")}</button>` : ""}`;
          const full = rows.length >= W().limit();
          add.hidden = !firstHere;
          add.disabled = full || !firstHere;
          if (!firstHere) line.textContent = tx("wallets.mainElsewhere");
          else if (full) line.textContent = tx("wallets.full", { n: W().limit() });
          else line.textContent = "";
        };
        const stop = CK.wallet.onBackup(paint);
        editBtn.addEventListener("click", () => {
          editing = !editing;
          CK.haptic.selection();
          paint();
        });
        const onClick = (e) => {
          const row = e.target.closest(".wl-row");
          if (e.target.closest(".wl-bring")) {
            if (needsPassword()) flow.push(passwordStep((options) => W().bringBack(options).then(cameBack), flow));
            else {
              line.textContent = "";
              W().bringBack().then(cameBack).catch((err) => {
                CK.haptic.error();
                line.textContent = whyNot(err);
              });
            }
            return;
          }
          if (!row) return;
          CK.haptic.light();
          if (editing || e.target.closest(".wl-edit")) {
            flow.push(manageStep(row.dataset.address, totalNow));
            return;
          }
          try {
            W().switchTo(row.dataset.address);
            flow.close();
          } catch (err) {
            CK.haptic.error();
            line.textContent = whyNot(err);
          }
        };
        body.addEventListener("click", onClick);
        add.addEventListener("click", () => {
          if (!add.disabled) flow.push(addStep(totalNow));
        });
        paint();
        return () => {
          gone = true;
          stop();
          editBtn.remove();
          body.removeEventListener("click", onClick);
        };
      }
    };
  }
  function addStep(totalNow) {
    return {
      title: tx("wallets.importTitle"),
      render(body, flow) {
        body.classList.add("wl");
        body.innerHTML = `<div class="group wl-ways">
            <button class="cell cell-tile press-row" type="button" data-add="new"><span>${CK.tile("plus", { tone: "blue" })}</span><span class="cell-main"><span class="cell-title">${tx("wallets.new")}</span></span></button>
            <button class="cell cell-tile press-row" type="button" data-add="import"><span>${CK.tile("key", { tone: "gray" })}</span><span class="cell-main"><span class="cell-title">${tx("wallets.import")}</span></span>${icon("chevron-right", { size: 16, className: "cell-chevron" })}</button>
          </div>`;
        const el = CK.el('<div class="sheet-dock sw-dock"><p class="sw-line" role="status"></p></div>');
        flow.sheet.el.appendChild(el);
        const line = $(".sw-line", el), make = $('[data-add="new"]', body), bring = $('[data-add="import"]', body);
        let busy = false;
        const paint = () => {
          make.disabled = busy;
          bring.disabled = busy;
        };
        const addNew = (options) => {
          busy = true;
          line.dataset.tone = "note";
          line.textContent = tx("wallets.making");
          paint();
          W().add(options).then((row) => {
            W().switchTo(row.address);
            CK.haptic.success();
            CK.toast(tx("wallets.added"), { icon: "check-circle", tone: "up" });
            flow.close();
          }, (err) => {
            busy = false;
            CK.haptic.error();
            delete line.dataset.tone;
            line.textContent = whyNot(err);
            paint();
          });
        };
        make.addEventListener("click", () => {
          if (busy) return;
          CK.haptic.light();
          if (needsPassword()) flow.push(passwordStep((options) => W().add(options).then((row) => W().switchTo(row.address)), flow, true));
          else addNew();
        });
        bring.addEventListener("click", () => {
          if (busy) return;
          CK.haptic.light();
          flow.push(importStep());
        });
        paint();
        return null;
      }
    };
  }
  const cameBack = (n) => {
    if (!(n > 0)) throw Object.assign(new Error("none came back"), { code: "backup_failed" });
  };
  function passwordStep(run, flowOf, closes) {
    return {
      title: tx("wallets.password"),
      render(body, flow) {
        body.classList.add("w-setup", "wl");
        body.innerHTML = passwordField();
        const { line, go } = dock(flow, tx("common.done"));
        go.addEventListener("click", () => {
          const options = readPassword(body);
          if (!options) {
            line.textContent = tx("wallets.password");
            return;
          }
          go.disabled = true;
          Promise.resolve(run(options)).then(() => {
            CK.haptic.success();
            if (closes) flow.close();
            else flow.back();
          }, (err) => {
            go.disabled = false;
            CK.haptic.error();
            line.textContent = whyNot(err);
          });
        });
      }
    };
  }
  const wordsIn = (text) => String(text).toLowerCase().match(/[a-z]+/g) || [];
  const retypeIn = (flow) => (text, err) => {
    flow.back();
    DemoWalletSetup.refill(flow, text, whyNot(err));
  };
  function importStep() {
    return {
      title: tx("walletSetup.importTitle"),
      render(body, flow) {
        body.classList.add("w-setup", "w-import");
        body.innerHTML = `
          <div class="w-card-top"><span></span><span class="w-count"></span></div>
          <textarea class="w-words-field" rows="5" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="${CK.esc(tx("walletSetup.importPh"))}" aria-label="${CK.esc(tx("walletSetup.importPh"))}"></textarea>
          <p class="w-note w-note--left w-more" hidden>${tx("walletSetup.phraseMore")}</p>
          <p class="w-note w-note--left w-help" hidden>${tx("walletSetup.phraseHelp")}</p>
          <p class="w-note w-note--left w-fits" hidden>${tx("walletSetup.importText")}</p>
          ${needsPassword() ? passwordField() : ""}`;
        const field = $(".w-words-field", body), count = $(".w-count", body), fits = $(".w-fits", body);
        const { line, go } = dock(flow, tx("wallets.importGo"));
        let busy = false;
        const longest = WORD_COUNTS[WORD_COUNTS.length - 1];
        const paint = DemoWalletSetup.phraseWatch(field, count, $(".w-more", body), go, () => busy);
        const sayCount = (ended) => {
          const n = wordsIn(field.value).length;
          if (n > longest || ended && n && !WORD_COUNTS.includes(n)) line.textContent = tx("walletSetup.phraseCount");
        };
        field.addEventListener("blur", () => sayCount(true));
        const conceal = () => field.classList.add("is-concealed");
        const reveal = () => field.classList.remove("is-concealed");
        const app = CK.tg.app;
        const onVisibility = () => {
          if (document.hidden) conceal();
        };
        document.addEventListener("visibilitychange", onVisibility);
        if (app && app.onEvent) app.onEvent("deactivated", conceal);
        field.addEventListener("focus", reveal);
        const help = $(".w-help", body);
        field.addEventListener("input", () => {
          line.textContent = "";
          fits.hidden = true;
          reveal();
          sayCount();
          help.hidden = wordsIn(field.value).length !== longest + 1;
        });
        const run = (words, options) => W().import(words, options).then((row) => {
          if (row && row.need === "source") {
            field.value = "";
            const kept = words.slice();
            flow.push(DemoWalletSetup.sourceStep(kept, (kind) => run(kept, { ...options || {}, kind }), whyNot, retypeIn(flow)));
            return;
          }
          field.value = "";
          W().switchTo(row.address);
          CK.haptic.success();
          CK.toast(tx("wallets.added"), { icon: "check-circle", tone: "up" });
          flow.close();
          legacyLook(row.address, null);
        });
        go.addEventListener("click", () => {
          const words = wordsIn(field.value);
          if (busy || !WORD_COUNTS.includes(words.length)) return;
          const options = readPassword(body);
          if (options === null) {
            line.textContent = tx("wallets.password");
            return;
          }
          busy = true;
          field.blur();
          paint();
          line.textContent = "";
          run(words, options).then(() => {
            busy = false;
          }, (err) => {
            busy = false;
            paint();
            CK.haptic.error();
            line.textContent = whyNot(err, words.length);
            fits.hidden = !(err && err.code === "bad_words");
          }).finally(() => words.fill(""));
        });
        paint();
        return () => {
          document.removeEventListener("visibilitychange", onVisibility);
          if (app && app.offEvent) app.offEvent("deactivated", conceal);
          field.value = "";
        };
      }
    };
  }
  function manageStep(address, totalNow) {
    return {
      title: tx("wallets.manage"),
      render(body, flow) {
        const rows = W().list();
        const at = rows.findIndex((row2) => row2.address === address);
        const row = rows[at];
        if (!row) {
          flow.back();
          return null;
        }
        body.classList.add("w-setup", "wl");
        const kind = row.here ? sourceOf(row) : tx("wallets.elsewhere");
        body.innerHTML = `
          <label class="search"><input class="wl-name" type="text" autocomplete="off" maxlength="${NAME_MAX}" aria-label="${CK.esc(tx("wallets.nameLabel"))}" placeholder="${CK.esc(nameOf({ name: null }, at))}"></label>
          <span class="wallet-address"></span>
          ${kind ? `<p class="w-note wl-kind">${CK.esc(kind)}</p>` : ""}
          <button class="tk-link wl-remove" type="button"${row.here ? "" : " disabled"}>${tx("wallets.remove")}</button>`;
        const input = $(".wl-name", body);
        input.value = row.name || "";
        $(".wallet-address", body).textContent = row.friendly;
        const { line, go } = dock(flow, tx("wallets.save"));
        const same = () => input.value.trim() === (row.name || "").trim();
        go.disabled = same();
        input.addEventListener("input", () => {
          go.disabled = same();
          line.textContent = "";
        });
        go.addEventListener("click", () => {
          if (same()) return;
          go.disabled = true;
          W().rename(address, input.value).then(() => {
            CK.haptic.success();
            flow.back();
          }, (err) => {
            go.disabled = same();
            CK.haptic.error();
            line.textContent = whyNot(err);
          });
        });
        const remove = $(".wl-remove", body);
        if (remove) {
          remove.addEventListener("click", () => {
            remove.disabled = true;
            line.textContent = "";
            canRemove(address).then(() => flow.push(removeStep(row, at, totalNow)), (err) => {
              remove.disabled = false;
              CK.haptic.error();
              line.textContent = whyNot(err);
            });
          });
        }
        return null;
      }
    };
  }
  function removeStep(row, at, totalNow) {
    const { address } = row;
    return {
      title: tx("wallets.removeTitle"),
      render(body, flow) {
        body.classList.add("w-setup", "w-setup--middle");
        const withPassword = row.method === "password";
        body.innerHTML = `<div class="w-setup-mark w-setup-mark--accent">${icon("warning", { fill: true, size: 44 })}</div><b class="wl-remove-name"></b><p class="w-note"></p>${withPassword ? `<label class="search"><input class="wl-pass" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx("wallet.password"))}" aria-label="${CK.esc(tx("wallet.password"))}"></label>` : ""}`;
        $(".wl-remove-name", body).textContent = nameOf(row, at);
        $(".w-note", body).textContent = tx(row.main ? "wallets.removeMainText" : "wallets.removeText");
        const cheques = window.DemoCheques ? DemoCheques.openOn(address) : 0;
        if (cheques) {
          const warn = CK.el('<p class="w-note w-backup-note"></p>');
          warn.textContent = tx("cheque.removeWarn", { n: cheques });
          $(".w-note", body).after(warn);
        }
        const { line, go } = dock(flow, tx("wallets.removeGo"));
        go.classList.add("wl-danger");
        let busy = false;
        go.addEventListener("click", () => {
          if (busy) return;
          const options = withPassword ? readPassword(body) : void 0;
          if (options === null) {
            line.textContent = tx("wallet.password");
            return;
          }
          busy = true;
          go.disabled = true;
          W().remove(address, options).then(() => {
            CK.haptic.success();
            CK.toast(tx("wallets.removed"), { icon: "check-circle", tone: "up" });
            flow.replace(listStep(totalNow));
          }, (err) => {
            busy = false;
            go.disabled = false;
            if (!CK.wallet.isRejection(err)) CK.haptic.error();
            line.textContent = whyNot(err);
          });
        });
      }
    };
  }
  const gramText = (nano) => {
    const v = T.fromUnits(BigInt(nano), 9);
    const digits = v >= 1 ? 2 : Math.min(CK.fmt.priceDigits(v), 9);
    const point = CK.fmt.decimal();
    let text = CK.fmt.num(v, digits);
    if (text.includes(point)) text = text.replace(/0+$/, "").replace(new RegExp(`\\${point}$`), "");
    return `${text} GRAM`;
  };
  const LEGACY_BIP39 =   new Set(["wallets.legacyTitle", "wallets.legacyHas", "wallets.legacyWhere", "wallets.legacyLeft", "wallets.legacyGas", "wallets.legacyFail", "wallets.legacyUnknown", "wallets.legacyTonkeeper"]);
  const isBip39 = (address) => {
    const row = W().list().find((one) => one.address === address);
    return row ? row.kind === "bip39" : CK.wallet.status.phrase === "bip39";
  };
  const legacyText = (bip, key, params) => tx(bip && LEGACY_BIP39.has(key) ? `${key}Bip39` : key, params);
  function legacySummary(one, bip) {
    const parts = [];
    if (BigInt(one.gram) > 10000000n) parts.push(gramText(one.gram));
    if (one.tokens) parts.push(tx("wallets.legacyTokens", { n: one.tokens }));
    return legacyText(bip, "wallets.legacyHas", { version: one.version, what: parts.join(tx("wallets.legacyAnd")) });
  }
  const LEGACY_ERRORS = { bad_intent: "wallets.legacyFail", address_mismatch: "wallets.legacyFail", state_unknown: "wallets.legacyUnknown", balance_unknown: "wallets.legacyUnknown", send_unsure: "wallets.legacyWait" };
  function legacyStep(found, address) {
    const bip = isBip39(address);
    const lt = (key, params) => legacyText(bip, key, params);
    return {
      title: lt("wallets.legacyTitle"),
      render(body, flow) {
        body.classList.add("w-setup", "w-setup--middle", "wl-legacy");
        const withPassword = CK.wallet.status.method === "password";
        body.innerHTML = `<div class="w-setup-mark">${icon("wallet", { fill: true, size: 52 })}</div>
          ${found.map(() => '<p class="w-note wl-legacy-has"></p>').join("")}
          <p class="w-note wl-legacy-where"></p>
          <p class="w-note wl-legacy-moved" hidden></p>
          <p class="w-note wl-legacy-left" hidden></p>
          ${withPassword ? `<label class="search"><input class="wl-pass" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx("wallet.password"))}" aria-label="${CK.esc(tx("wallet.password"))}"></label>` : ""}`;
        $$(".wl-legacy-has", body).forEach((el, i) => {
          el.textContent = legacySummary(found[i], bip);
        });
        $(".wl-legacy-where", body).textContent = lt("wallets.legacyWhere");
        const show = (el, text) => {
          el.hidden = !text;
          el.textContent = text || "";
        };
        const paintGas = (list) => {
          let at = $(".wl-legacy-left", body);
          list.forEach((gas) => {
            const one = document.createElement("div");
            one.className = "wl-legacy-gas";
            one.innerHTML = `<p class="w-note"></p><span class="wallet-address"></span><button class="tk-link" type="button">${CK.esc(tx("wallets.legacyCopyOld"))}</button>`;
            $(".w-note", one).textContent = lt("wallets.legacyGas", { version: gas.version, need: gramText(gas.need).replace(/ GRAM$/, "") });
            $(".wallet-address", one).textContent = gas.friendly;
            $(".tk-link", one).addEventListener("click", () => {
              CK.copyText(gas.friendly).then((copied) => {
                if (copied) {
                  CK.haptic.success();
                  CK.toast(tx("common.addressCopied"), { icon: "check-circle", tone: "up" });
                } else CK.toast(tx("common.copyFail"));
              });
            });
            at.after(one);
            at = one;
          });
        };
        const { line, go } = dock(flow, tx("wallets.legacyMove"));
        let busy = false, finished = false;
        go.addEventListener("click", () => {
          if (finished) {
            flow.close();
            return;
          }
          if (busy) return;
          const options = withPassword ? readPassword(body) : {};
          if (options === null) {
            line.textContent = tx("wallet.password");
            return;
          }
          try {
            if (!T.wallet || T.wallet.address !== address) W().switchTo(address);
          } catch (err) {
            line.textContent = whyNot(err);
            return;
          }
          busy = true;
          go.disabled = true;
          line.textContent = tx("wallets.legacyMoving", { done: 0, of: "\u2026" });
          W().moveLegacy(address, options, (name, at) => {
            if (at && at.of) line.textContent = tx("wallets.legacyMoving", { done: at.done, of: at.of });
          }).then((result) => {
            const again = !result.empty && Array.isArray(result.gas) && result.gas.length > 0;
            finished = !again;
            const later = result.left.filter((one) => one.why !== "gas");
            const moved = result.moved.length > 0;
            if (moved) CK.haptic.success();
            show($(".wl-legacy-moved", body), moved ? tx("wallets.legacyMoved", { list: result.moved.join(", ") }) : "");
            const lines = [];
            if (later.some((one) => one.why === "wait" || one.why === "pending")) lines.push(tx("wallets.legacyWait"));
            if (later.some((one) => one.why === "unknown")) lines.push(lt("wallets.legacyUnknown"));
            const stays = later.filter((one) => !["wait", "pending", "unknown"].includes(one.why));
            if (stays.length) lines.push(lt("wallets.legacyLeft", { list: Array.from(new Set(stays.map((one) => one.what))).join(", ") }));
            if (stays.some((one) => one.why === "token" || one.why === "frozen")) lines.push(lt("wallets.legacyTonkeeper"));
            show($(".wl-legacy-left", body), lines.join(" "));
            paintGas(result.gas);
            $$(".wl-legacy-has", body).forEach((el) => {
              el.hidden = true;
            });
            const pass = $(".wl-pass", body);
            if (pass && !again) pass.closest("label").hidden = true;
            line.textContent = result.empty ? tx("wallets.legacyDone") : "";
            go.textContent = again ? tx("wallets.legacyMove") : tx("common.done");
            if (window.DemoWalletList) DemoWalletList.legacyChanged();
          }, (err) => {
            if (CK.wallet.isRejection(err)) {
              line.textContent = "";
              return;
            }
            CK.haptic.error();
            const key = LEGACY_ERRORS[err && err.code];
            line.textContent = key ? lt(key) : whyNot(err);
          }).finally(() => {
            busy = false;
            go.disabled = false;
          });
        });
      }
    };
  }
  function legacyLook(address, flowOpen) {
    W().legacyLook(address).then((seen) => {
      if (!seen || !seen.found.length) {
        solAltLook(address, flowOpen);
        return;
      }
      if (flowOpen && !flowOpen.closing) flowOpen.replace(legacyStep(seen.found, address));
      else if (!CK.sheet.top) DemoWallet.openFlow(legacyStep(seen.found, address), null, HEIGHT);
      solAltLook(address, null);
    }, (err) => {
      console.warn("wallets: the older versions are read at the next launch", err && (err.code || err.message));
      solAltLook(address, flowOpen);
    });
  }
  const noticeRow = `<button class="cell press-row notice-row" type="button"><span class="cell-main"><span class="cell-title notice-text"></span></span>${icon("chevron-right", { size: 16, className: "cell-chevron" })}</button>`;
  const legacyAsked =   new Set();
  let legacyLine = null;
  function paintLegacy(el) {
    if (!el) return;
    legacyLine = el;
    const wallet = T.wallet;
    const seen = wallet ? W().legacyLast(wallet.address) : null;
    if (wallet && !wallet.readOnly && !seen && !legacyAsked.has(wallet.address)) {
      legacyAsked.add(wallet.address);
      W().legacyLook(wallet.address, { launch: true }).catch(() => null);
    }
    const found = seen && !wallet.readOnly ? seen.found : [];
    el.hidden = !found.length;
    if (!found.length) {
      el.textContent = "";
      return;
    }
    el.innerHTML = noticeRow;
    const bip = isBip39(wallet.address);
    $(".notice-text", el).textContent = found.map((one) => legacySummary(one, bip)).join(". ");
    $(".notice-row", el).onclick = () => {
      if (CK.sheet.top) return;
      CK.haptic.light();
      DemoWallet.openFlow(legacyStep(found, wallet.address), null, HEIGHT);
    };
  }
  const solText = (lamports) => {
    const v = T.fromUnits(BigInt(lamports), 9);
    const digits = v >= 1 ? 2 : Math.min(CK.fmt.priceDigits(v), 9);
    const point = CK.fmt.decimal();
    let text = CK.fmt.num(v, digits);
    if (text.includes(point)) text = text.replace(/0+$/, "").replace(new RegExp(`\\${point}$`), "");
    return `${text} SOL`;
  };
  const knownSol = () => window.DemoNets && typeof DemoNets.known === "function" ? DemoNets.known("solana") : [];
  const solAltReady = () => !!(CK.sol && typeof CK.sol.altLook === "function");
  function solAltSummary(one) {
    const parts = [];
    if (BigInt(one.sol) > 0n) parts.push(solText(one.sol));
    if (one.tokens) parts.push(tx("wallets.legacyTokens", { n: one.tokens }));
    const key = one.path === "root" ? "wallets.solAltHasRoot" : /^holder:\d+$/.test(String(one.path)) ? "wallets.solAltHasHolder" : "wallets.solAltHas";
    return tx(key, { what: parts.join(tx("wallets.legacyAnd")) });
  }
  const SOL_ALT_ERRORS = { bad_intent: "wallets.solAltFail", address_mismatch: "wallets.solAltFail", no_sol_address: "wallets.solAltUnknown", state_unknown: "wallets.solAltUnknown", balance_unknown: "wallets.solAltUnknown", send_unsure: "wallets.legacyWait", pending: "wallets.legacyWait" };
  function solAltStep(found, address) {
    return {
      title: tx("wallets.solAltTitle"),
      render(body, flow) {
        body.classList.add("w-setup", "w-setup--middle", "wl-legacy");
        const withPassword = CK.wallet.status.method === "password";
        body.innerHTML = `<div class="w-setup-mark">${icon("wallet", { fill: true, size: 52 })}</div>
          ${found.map(() => '<p class="w-note wl-legacy-has"></p>').join("")}
          <p class="w-note wl-legacy-where"></p>
          <p class="w-note wl-legacy-moved" hidden></p>
          <p class="w-note wl-legacy-left" hidden></p>
          ${withPassword ? `<label class="search"><input class="wl-pass" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx("wallet.password"))}" aria-label="${CK.esc(tx("wallet.password"))}"></label>` : ""}`;
        $$(".wl-legacy-has", body).forEach((el, i) => {
          el.textContent = solAltSummary(found[i]);
        });
        const trustOf = (list) => list.some((one) => one.path === "trust");
        $(".wl-legacy-where", body).textContent = tx(trustOf(found) ? "wallets.solAltWhere" : "wallets.solAltWhereRoot");
        const show = (el, text) => {
          el.hidden = !text;
          el.textContent = text || "";
        };
        let gasBlocks = [];
        const paintGas = (list) => {
          gasBlocks.forEach((one) => one.remove());
          gasBlocks = [];
          let at = $(".wl-legacy-left", body);
          list.forEach((gas) => {
            const one = document.createElement("div");
            one.className = "wl-legacy-gas";
            one.innerHTML = `<p class="w-note"></p><span class="wallet-address"></span><button class="tk-link" type="button">${CK.esc(tx("wallets.legacyCopyOld"))}</button>`;
            $(".w-note", one).textContent = tx("wallets.solAltGas", { need: solText(gas.need).replace(/ SOL$/, "") });
            $(".wallet-address", one).textContent = gas.address;
            $(".tk-link", one).addEventListener("click", () => {
              CK.copyText(gas.address).then((copied) => {
                if (copied) {
                  CK.haptic.success();
                  CK.toast(tx("common.addressCopied"), { icon: "check-circle", tone: "up" });
                } else CK.toast(tx("common.copyFail"));
              });
            });
            at.after(one);
            at = one;
            gasBlocks.push(one);
          });
        };
        const { line, go } = dock(flow, tx("wallets.legacyMove"));
        let busy = false, finished = false;
        go.addEventListener("click", () => {
          if (finished) {
            flow.close();
            return;
          }
          if (busy) return;
          const options = withPassword ? readPassword(body) : {};
          if (options === null) {
            line.textContent = tx("wallet.password");
            return;
          }
          try {
            if (!T.wallet || T.wallet.address !== address) W().switchTo(address);
          } catch (err) {
            line.textContent = whyNot(err);
            return;
          }
          busy = true;
          go.disabled = true;
          line.textContent = tx("wallets.legacyMoving", { done: 0, of: "\u2026" });
          CK.sol.moveAlt({ ...options, wallet: address, known: knownSol() }, (name, at) => {
            if (at && at.of) line.textContent = tx("wallets.legacyMoving", { done: at.done, of: at.of });
          }).then((result) => {
            const more = result.left.some((one) => one.why === "later");
            const again = !result.empty && (Array.isArray(result.gas) && result.gas.length > 0 || more);
            const kept = Array.isArray(result.kept) ? result.kept : [];
            finished = !again;
            const gasPaths = new Set((result.gas || []).map((one) => one.path));
            const later = result.left.filter((one) => one.why !== "gas" || !gasPaths.has(one.path));
            const moved = result.moved.length > 0;
            if (moved) CK.haptic.success();
            show($(".wl-legacy-moved", body), moved ? tx("wallets.legacyMoved", { list: result.moved.join(", ") }) : "");
            const lines = [];
            if (later.some((one) => one.why === "wait" || one.why === "pending")) lines.push(tx("wallets.legacyWait"));
            if (later.some((one) => one.why === "unknown")) lines.push(tx("wallets.solAltUnknown"));
            const stays = later.filter((one) => !["wait", "pending", "unknown"].includes(one.why));
            if (stays.length) lines.push(tx("wallets.solAltLeft", { list: Array.from(new Set(stays.map((one) => one.what))).join(", ") }));
            const stuck = stays.filter((one) => one.why === "token");
            if (stuck.length) lines.push(tx(trustOf(stuck) ? "wallets.solAltTrust" : "wallets.solAltStuck"));
            if (kept.length) lines.push(tx("wallets.solAltKept"));
            if (more) lines.push(tx("wallets.solAltAgain"));
            show($(".wl-legacy-left", body), lines.join(" "));
            paintGas(result.gas);
            $$(".wl-legacy-has", body).forEach((el) => {
              el.hidden = true;
            });
            const pass = $(".wl-pass", body);
            if (pass && !again) pass.closest("label").hidden = true;
            line.textContent = result.empty && !kept.length ? tx("wallets.legacyDone") : "";
            go.textContent = again ? tx("wallets.legacyMove") : tx("common.done");
            if (window.DemoWalletList) DemoWalletList.solAltChanged();
          }, (err) => {
            if (CK.wallet.isRejection(err)) {
              line.textContent = "";
              return;
            }
            CK.haptic.error();
            const key = SOL_ALT_ERRORS[err && err.code];
            line.textContent = key ? tx(key) : whyNot(err);
          }).finally(() => {
            busy = false;
            go.disabled = false;
          });
        });
      }
    };
  }
  function solAltLook(address, flowOpen) {
    if (!solAltReady()) return;
    CK.sol.altLook({ wallet: address, known: knownSol() }).then((seen) => {
      if (solAltLine) paintSolAlt(solAltLine);
      if (!seen || !seen.found.length) return;
      if (flowOpen && !flowOpen.closing) flowOpen.replace(solAltStep(seen.found, address));
      else if (!CK.sheet.top) DemoWallet.openFlow(solAltStep(seen.found, address), null, HEIGHT);
    }, (err) => console.warn("wallets: the other Solana address is read at the next launch", err && (err.code || err.message)));
  }
  const solAltAsked =   new Set();
  let solAltLine = null;
  if (CK.wallet && typeof CK.wallet.onSolAlt === "function") {
    CK.wallet.onSolAlt((own) => {
      solAltAsked.delete(own);
      if (solAltLine && T.wallet && T.wallet.address === own) paintSolAlt(solAltLine);
    });
  }
  function paintSolAlt(el) {
    if (!el) return;
    solAltLine = el;
    const wallet = T.wallet;
    if (!solAltReady() || !wallet) {
      el.hidden = true;
      return;
    }
    const seen = CK.sol.altLast();
    if (!wallet.readOnly && !seen && !solAltAsked.has(wallet.address)) {
      solAltAsked.add(wallet.address);
      CK.sol.altLook({ launch: true, wallet: wallet.address, known: knownSol() }).then((result) => {
        if (result && solAltLine) paintSolAlt(solAltLine);
      }, () => null);
    }
    const found = seen && !wallet.readOnly ? seen.found : [];
    el.hidden = !found.length;
    if (!found.length) {
      el.textContent = "";
      return;
    }
    el.innerHTML = noticeRow;
    $(".notice-text", el).textContent = found.map(solAltSummary).join(". ");
    $(".notice-row", el).onclick = () => {
      if (CK.sheet.top) return;
      CK.haptic.light();
      DemoWallet.openFlow(solAltStep(found, wallet.address), null, HEIGHT);
    };
  }
  window.DemoWalletList = {
    legacyLook,
    paintLegacy,

    legacyChanged() {
      if (legacyLine) paintLegacy(legacyLine);
    },
    paintSolAlt,

    solAltChanged() {
      if (solAltLine) paintSolAlt(solAltLine);
    },

    canAdd() {
      if (!T.wallet) return false;
      const rows = W().list();
      return rows.length > 0 && !!rows[0].here && !!rows[0].address;
    },
    openImport() {
      if (CK.sheet.top || !T.wallet) return;
      DemoWallet.openFlow(importStep(), null, HEIGHT);
    },

    current() {
      const rows = W().list();
      const at = rows.findIndex((row) => row.active);
      return at < 0 ? null : { name: nameOf(rows[at], at), address: rows[at].address, hue: hueOf(at) };
    },
    open(totalNow) {
      if (CK.sheet.top || !T.wallet) return;
      DemoWallet.openFlow(listStep(totalNow), null, HEIGHT);
    }
  };
})();
