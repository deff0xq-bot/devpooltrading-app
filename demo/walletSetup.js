(function () {
  'use strict';
  const { icon, t: tx } = CK;
  const T = CK.ton;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const HEIGHT = 390;
  const IMPORT_HEIGHT = 470;
  const WORD_COUNTS = [12, 15, 18, 21, 24];
  const PASSWORD_MIN = 12;

  function onHide(fn) {
    const onVisibility = () => { if (document.hidden) fn(); };
    const app = CK.tg.app;
    document.addEventListener('visibilitychange', onVisibility);
    if (app && app.onEvent) app.onEvent('deactivated', fn);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (app && app.offEvent) app.offEvent('deactivated', fn);
    };
  }
  function dock(flow, label) {
    const el = CK.el(`<div class="sheet-dock sw-dock"><p class="sw-line" role="status"></p><button class="btn btn--wide press w-go" type="button"></button></div>`);
    $('.w-go', el).textContent = label;
    flow.sheet.el.appendChild(el);
    return { line: $('.sw-line', el), go: $('.w-go', el) };
  }
  function say(line, key) {
    line.textContent = key ? tx(key) : '';
  }
  const passwordFields = () => `
    <p class="w-note w-note--left">${tx('walletSetup.passText')}</p>
    <label class="search"><input class="w-pass" type="password" autocomplete="new-password" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx('walletSetup.passNew'))}" aria-label="${CK.esc(tx('walletSetup.passNew'))}"></label>
    <label class="search"><input class="w-pass" type="password" autocomplete="new-password" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx('walletSetup.passRepeat'))}" aria-label="${CK.esc(tx('walletSetup.passRepeat'))}"></label>`;
  function readNewPassword(body) {
    const [first, second] = $$('.w-pass', body);
    const a = first.value, b = second.value;
    first.value = '';
    second.value = '';
    if (Array.from(a).length < PASSWORD_MIN) return { problem: 'walletSetup.passShort' };
    if (a !== b) return { problem: 'walletSetup.passDiffer' };
    return { password: a };
  }
  const STORE_ERRORS = {
    biometric_cancelled: 'walletSetup.bioCancelled', password_short: 'walletSetup.passShort', owner_unconfirmed: 'walletOwner.unconfirmed',
    bad_words: 'walletSetup.badPhrase', address_mismatch: 'walletSetup.otherWallet', wrong_password: 'wallet.wrongPassword',
    biometric_lost: 'wallet.lost', biometric_denied: 'wallet.denied', biometric_unknown: 'wallet.bioWait',
    backup_first: 'walletMove.fail', archive_busy: 'walletSetup.archiveBusy', slot_kept: 'walletSetup.slotKept',
    wallet_added: 'walletSetup.addedWallet', backup_failed: 'wallets.failed', already_added: 'wallets.alreadyAdded', storage_timeout: 'walletSetup.storeWait'
  };
  const PHRASE_ERRORS = { count: 'walletSetup.phraseCount', keychain: 'walletSetup.phraseKeychain', check: 'walletSetup.badPhrase' };
  const LONGEST = WORD_COUNTS[WORD_COUNTS.length - 1];
  const errorKey = (err, n) => {
    if (err && err.code === 'bad_words' && err.reason === 'check' && n > 0 && n < LONGEST) return 'walletSetup.badPhraseShort';
    return (err && err.code === 'bad_words' && PHRASE_ERRORS[err.reason]) || STORE_ERRORS[err && err.code];
  };
  const wholePhrase = (n) => WORD_COUNTS.includes(n);
  const wordsIn = (text) => String(text).toLowerCase().match(/[a-z]+/g) || [];
  function phraseWatch(field, count, more, go, isBusy) {
    let last = 0, typedIn = false;
    const paint = () => {
      const n = wordsIn(field.value).length;
      const unsure = typedIn && n < LONGEST && wholePhrase(n);
      count.textContent = n ? tx('walletSetup.wordCount', { n }) : '';
      more.hidden = !unsure;
      go.disabled = isBusy() || !wholePhrase(n) || (unsure && document.activeElement === field);
    };
    field.addEventListener('input', () => {
      const n = wordsIn(field.value).length;
      if (n > last) typedIn = n - last === 1;
      last = n;
      paint();
    });
    field.addEventListener('focus', paint);
    field.addEventListener('blur', paint);
    field.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      field.blur();
    });
    return paint;
  }
  function refill(flow, text, message) {
    const field = $('.w-words-field', flow.sheet.el);
    if (!field) return;
    field.value = text;
    field.dispatchEvent(new Event('input'));
    const line = $('.sheet-dock .sw-line', flow.sheet.el);
    if (line && message) line.textContent = message;
  }

  function doneStep() {
    return {
      title: tx('walletSetup.doneTitle'),
      render(body, flow) {
        const wallet = T.wallet;
        body.classList.add('w-setup');
        body.innerHTML = `
          <div class="w-setup-mark receipt-pop">${icon('check-circle', { fill: true, size: 56 })}</div>
          <span class="wallet-address"></span>`;
        $('.wallet-address', body).textContent = wallet ? wallet.friendly : '';
        const { go } = dock(flow, tx('common.done'));
        go.addEventListener('click', () => flow.close());
      }
    };
  }

  let making = false;
  function openCreate() {
    if (making || CK.sheet.top) return;
    if (!CK.wallet.status.setup) {
      CK.toast(tx('walletAuto.phoneLine'), { icon: 'warning', tone: 'down' });
      return;
    }
    making = true;
    CK.wallet.create().then(() => CK.haptic.success(), (err) => {
      console.error(err);
      CK.haptic.error();
      CK.toast(tx(err.code === 'storage_failed' || err.code === 'no_secure_storage' ? 'walletAuto.noStore' : 'walletSetup.openFail'), { icon: 'warning', tone: 'down' });
    }).finally(() => { making = false; });
  }

  function openProtect() {
    if (CK.sheet.top || document.hidden) return;
    CK.wallet.markAsked();
    DemoWallet.openFlow(protectStep(), null, HEIGHT);
  }
  function protectStep() {
    return {
      title: tx('walletSetup.protectTitle'),
      render(body, flow) {
        body.classList.add('w-setup');
        const usePassword = CK.wallet.status.setup !== 'biometric';
        body.classList.toggle('w-setup--middle', !usePassword);
        body.innerHTML = usePassword ? passwordFields() : `<div class="w-setup-mark w-setup-mark--accent">${icon('lock', { fill: true, size: 44 })}</div><p class="w-note">${tx('walletSetup.bioText')}</p>`;
        const { line, go } = dock(flow, tx(usePassword ? 'walletSetup.passGo' : 'walletSetup.bioGo'));
        let busy = false;
        go.addEventListener('click', () => {
          if (busy) return;
          let options;
          if (usePassword) {
            const read = readNewPassword(body);
            if (read.problem) {
              say(line, read.problem);
              return;
            }
            options = { password: read.password };
          }
          busy = true;
          go.disabled = true;
          say(line, '');
          CK.wallet.protect(options).then(() => {
            CK.haptic.success();
            if (!flow.closing) flow.close();
          }, (err) => {
            busy = false;
            go.disabled = false;
            if (err.code === 'biometric_denied' || (err.code === 'password_short' && !usePassword)) {
              CK.wallet.refresh().catch(() => null).then(() => { if (!flow.closing) flow.replace(protectStep()); });
              return;
            }
            CK.haptic.error();
            console.error(err);
            say(line, STORE_ERRORS[err.code] || 'wallet.unlockFail');
          });
        });
      }
    };
  }
  function askNewPassword() {
    return new Promise((resolve) => {
      let answer = null;
      const flow = DemoWallet.openFlow({
        title: tx('walletSetup.protectTitle'),
        render(body, f) {
          body.classList.add('w-setup');
          body.innerHTML = passwordFields();
          const { line, go } = dock(f, tx('walletSetup.passGo'));
          go.addEventListener('click', () => {
            const read = readNewPassword(body);
            if (read.problem) {
              say(line, read.problem);
              return;
            }
            answer = read.password;
            f.close();
          });
        }
      }, () => resolve(answer), HEIGHT, true);
      if (!flow) resolve(null);
    });
  }
  CK.wallet.askPassword(askNewPassword);
  const RETYPE = new Set(['wrong_password', 'password_needed', 'password_short', 'biometric_denied']);
  function sourceStep(words, run, errorText, retype) {
    return {
      title: tx('walletSetup.sourceTitle'),
      render(body, flow) {
        body.classList.add('w-setup', 'wl');
        const choices = [['ton', 'walletSetup.sourceTon'], ['bip39', 'walletSetup.sourceBip39']];
        body.innerHTML = `<p class="w-note w-note--left">${tx('walletSetup.sourceText')}</p>
          <div class="group wl-list w-source">${choices.map(([kind, key]) => `
            <div class="wl-row"><button class="wl-pick press-row" type="button" data-kind="${kind}"><span class="wl-main"><b>${CK.esc(tx(key))}</b></span><span class="wl-edit">${icon('chevron-right', { size: 16 })}</span></button></div>`).join('')}</div>`;
        const el = CK.el('<div class="sheet-dock sw-dock"><p class="sw-line" role="status"></p></div>');
        flow.sheet.el.appendChild(el);
        const line = $('.sw-line', el);
        let busy = false;
        const buttons = $$('[data-kind]', body);
        buttons.forEach((button) => button.addEventListener('click', () => {
          if (busy) return;
          busy = true;
          buttons.forEach((one) => { one.disabled = true; });
          line.textContent = '';
          Promise.resolve(run(button.dataset.kind, flow)).catch((err) => {
            busy = false;
            if (retype && RETYPE.has(err && err.code) && !flow.closing) {
              retype(words.join(' '), err);
              return;
            }
            buttons.forEach((one) => { one.disabled = false; });
            CK.haptic.error();
            line.textContent = errorText(err);
          });
        }));
        return () => words.fill('');
      }
    };
  }
  const setupErrorText = (err, n) => {
    const key = errorKey(err, n);
    if (!key) console.error(err);
    return tx(key || 'walletSetup.saveFail');
  };
  function openImport(anyWallet) {
    const status = CK.wallet.status;
    const open = anyWallet === true ? status.secure && !!status.setup : status.wordsEntry;
    if (CK.sheet.top || !open || status.kind === 'foreign') return;
    if (anyWallet === true && window.DemoWalletList && DemoWalletList.canAdd()) {
      DemoWalletList.openImport();
      return;
    }
    DemoWallet.openFlow(importStep(anyWallet === true), null, IMPORT_HEIGHT);
  }
  function replaceStep(words, options) {
    return {
      title: tx('walletSetup.replaceTitle'),
      render(body, flow) {
        body.classList.add('w-setup', 'w-setup--middle');
        body.innerHTML = `<div class="w-setup-mark w-setup-mark--accent">${icon('warning', { fill: true, size: 44 })}</div><p class="w-note"></p><span class="wallet-address"></span>`;
        $('.w-note', body).textContent = tx('walletSetup.replaceText');
        const status = CK.wallet.status;
        $('.wallet-address', body).textContent = status.mainFriendly || status.friendly || '';
        const { line, go } = dock(flow, tx('walletSetup.replaceGo'));
        let busy = false;
        go.addEventListener('click', () => {
          if (busy) return;
          busy = true;
          go.disabled = true;
          say(line, '');
          const replaceAs = (list, opts) => CK.wallet.import(list, { ...opts, replace: true }).then((result) => {
            if (result && result.need === 'source') {
              const kept = list.slice();
              flow.replace(sourceStep(kept, (kind) => replaceAs(kept, { ...opts, kind }), setupErrorText));
              return;
            }
            list.fill('');
            CK.haptic.success();
            flow.replace(doneStep());
            legacyLook(flow);
          });
          replaceAs(words, options || {}).catch((err) => {
            busy = false;
            go.disabled = false;
            CK.haptic.error();
            line.textContent = setupErrorText(err);
          });
        });
        return () => words.fill('');
      }
    };
  }
  function legacyLook(flow) {
    const address = CK.wallet.status.mainAddress || CK.wallet.status.address;
    if (window.DemoWalletList && address) DemoWalletList.legacyLook(address, flow);
  }
  function importStep(anyWallet) {
    return {
      title: tx('walletSetup.importTitle'),
      render(body, flow) {
        body.classList.add('w-setup', 'w-import');
        const usePassword = CK.wallet.status.setup === 'password';
        const fresh = anyWallet && !CK.wallet.status.address;
        body.innerHTML = `
          ${anyWallet ? '' : `<p class="w-note w-note--left">${tx('walletSetup.restoreWordsText')}</p>`}
          <div class="w-card-top"><span></span><span class="w-count"></span></div>
          <textarea class="w-words-field" rows="5" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="${CK.esc(tx('walletSetup.importPh'))}" aria-label="${CK.esc(tx('walletSetup.importPh'))}"></textarea>
          <p class="w-note w-note--left w-more" hidden>${tx('walletSetup.phraseMore')}</p>
          <p class="w-note w-note--left w-help" hidden>${tx('walletSetup.phraseHelp')}</p>
          ${anyWallet ? `<p class="w-note w-note--left w-fits" hidden>${tx('walletSetup.importText')}</p>` : ''}
          ${usePassword ? passwordFields() : ''}`;
        const field = $('.w-words-field', body), count = $('.w-count', body);
        const fits = $('.w-fits', body);
        const showFits = (on) => { if (fits) fits.hidden = !on; };
        const { line, go } = dock(flow, tx(fresh ? 'wallets.importGo' : anyWallet ? 'walletSetup.importNext' : 'walletSetup.importGo'));
        let busy = false;
        const paint = phraseWatch(field, count, $('.w-more', body), go, () => busy);
        const conceal = () => field.classList.add('is-concealed');
        const reveal = () => field.classList.remove('is-concealed');
        const stopHide = onHide(conceal);
        field.addEventListener('focus', reveal);
        const help = $('.w-help', body);
        field.addEventListener('input', () => {
          const n = wordsIn(field.value).length;
          say(line, n > LONGEST ? 'walletSetup.phraseCount' : '');
          help.hidden = n !== LONGEST + 1;
          showFits(false);
          reveal();
        });
        field.addEventListener('blur', () => {
          const n = wordsIn(field.value).length;
          if (n && !wholePhrase(n)) say(line, 'walletSetup.phraseCount');
        });
        const done = () => {
          field.value = '';
          CK.haptic.success();
          flow.replace(doneStep());
          legacyLook(flow);
        };
        const retype = (text, err) => {
          const redraw = err.code === 'biometric_denied' || (err.code === 'password_short' && !usePassword);
          if (!redraw) {
            flow.back();
            refill(flow, text, setupErrorText(err));
            return;
          }
          CK.wallet.refresh().catch(() => null).then(() => {
            if (flow.closing) return;
            flow.replace(importStep(anyWallet));
            refill(flow, text, '');
          });
        };
        const run = (words, options) => CK.wallet.import(words, options).then((result) => {
          if (result && result.need === 'source') {
            field.value = '';
            const kept = words.slice();
            flow.push(sourceStep(kept, (kind) => run(kept, { ...(options || {}), kind }), setupErrorText, retype));
            return;
          }
          done();
        }, (err) => {
          if (err.code === 'address_mismatch' && anyWallet && !flow.closing) {
            field.value = '';
            flow.replace(replaceStep(words.slice(), options));
            return;
          }
          throw err;
        });
        go.addEventListener('click', () => {
          const words = wordsIn(field.value);
          if (busy || !wholePhrase(words.length)) return;
          let options;
          if (usePassword) {
            const read = readNewPassword(body);
            if (read.problem) {
              say(line, read.problem);
              return;
            }
            options = { password: read.password };
          }
          busy = true;
          field.blur();
          paint();
          say(line, '');
          run(words, options).then(() => {
            busy = false;
          }, (err) => {
            busy = false;
            paint();
            if (err.code === 'biometric_denied' || (err.code === 'password_short' && !usePassword)) {
              const typed = field.value;
              CK.wallet.refresh().catch(() => null).then(() => {
                if (flow.closing) return;
                flow.replace(importStep(anyWallet));
                refill(flow, typed, '');
              });
              return;
            }
            CK.haptic.error();
            line.textContent = setupErrorText(err, words.length);
            showFits(err && err.code === 'bad_words');
          }).finally(() => words.fill(''));
        });
        paint();
        return () => {
          stopHide();
          field.value = '';
        };
      }
    };
  }

  function openRestore() {
    if (CK.sheet.top) return;
    DemoWallet.openFlow(restoreStep(), null, HEIGHT);
  }
  function restoreStep() {
    return {
      title: tx('wallet.restore'),
      render(body, flow) {
        body.classList.add('w-setup');
        body.innerHTML = `
          <div class="w-setup-mark w-setup-mark--accent">${icon('lock', { fill: true, size: 44 })}</div>
          <p class="w-note">${tx('walletSetup.restoreText')}</p>
          <label class="search w-restore-pass" hidden><input class="wallet-password" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx('wallet.password'))}" aria-label="${CK.esc(tx('wallet.password'))}"></label>`;
        const passBox = $('.w-restore-pass', body), pass = $('.wallet-password', body);
        const { line, go } = dock(flow, tx('wallet.restore'));
        let busy = false;
        go.addEventListener('click', () => {
          if (busy) return;
          const password = pass.value;
          pass.value = '';
          busy = true;
          go.disabled = true;
          say(line, '');
          CK.wallet.restore(password ? { password } : undefined).then(() => {
            CK.haptic.success();
            flow.replace(doneStep());
          }, (err) => {
            busy = false;
            go.disabled = false;
            if (err.code === 'password_needed') {
              passBox.hidden = false;
              pass.focus({ preventScroll: true });
              return;
            }
            CK.haptic.error();
            if (err.code === 'biometric_lost') {
              say(line, 'wallet.lost');
              return;
            }
            if (!STORE_ERRORS[err.code]) console.error(err);
            say(line, STORE_ERRORS[err.code] || 'walletSetup.restoreFail');
          });
        });
      }
    };
  }

  let saving = false;
  function openBackup() {
    if (saving || CK.sheet.top) return;
    if (CK.wallet.status.method === 'password') {
      DemoWallet.openFlow(backupStep(), null, HEIGHT);
      return;
    }
    saving = true;
    CK.wallet.saveBackup().then(() => CK.haptic.success(), (err) => {
      if (CK.wallet.isRejection(err) || CK.wallet.protectRefused(err)) return;
      CK.haptic.error();
      if (!STORE_ERRORS[err.code]) console.error(err);
      CK.toast(tx(STORE_ERRORS[err.code] || 'wallets.failed'), { icon: 'warning', tone: 'down' });
    }).finally(() => { saving = false; });
  }
  function backupStep() {
    return {
      title: tx('wallet.backupSave'),
      render(body, flow) {
        body.classList.add('w-setup', 'w-setup--middle');
        body.innerHTML = `<label class="search"><input class="wallet-password" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx('wallet.password'))}" aria-label="${CK.esc(tx('wallet.password'))}"></label>`;
        const pass = $('.wallet-password', body);
        const { line, go } = dock(flow, tx('wallet.backupSave'));
        let busy = false;
        go.addEventListener('click', () => {
          if (busy || !pass.value) return;
          const password = pass.value;
          pass.value = '';
          busy = true;
          go.disabled = true;
          say(line, '');
          CK.wallet.saveBackup({ password }).then(() => {
            CK.haptic.success();
            if (!flow.closing) flow.close();
          }, (err) => {
            busy = false;
            go.disabled = false;
            CK.haptic.error();
            if (!STORE_ERRORS[err.code]) console.error(err);
            say(line, STORE_ERRORS[err.code] || 'wallets.failed');
          });
        });
      }
    };
  }

  let movingNow = false, moveShownFor = null;
  const MOVE_NAMES = { evm: 'EVM', sol: 'Solana', tron: 'Tron' };
  const moveName = (what) => (what === 'orders' ? tx('walletMove.orders') : MOVE_NAMES[what] || String(what));
  function openMove(byHand) {
    const status = CK.wallet.status;
    if (movingNow || CK.sheet.top || document.hidden || !status.moving || !status.moving.any || moveShownFor === status.moveFrom) return;
    if (status.moveTyped && byHand !== true) return;
    moveShownFor = status.moveFrom;
    DemoWallet.openFlow(moveStep(status.moveMethod === 'password'), null, HEIGHT);
  }
  function moveStep(withPassword) {
    return {
      title: tx('walletMove.title'),
      render(body, flow) {
        body.classList.add('w-setup', 'w-setup--middle');
        body.innerHTML = `
          <div class="w-setup-mark">${icon('wallet', { fill: true, size: 56 })}</div>
          <p class="w-note">${tx('walletMove.text')}</p>
          <p class="w-note w-move-moved" hidden></p>
          <p class="w-note w-move-left" hidden></p>
          ${withPassword ? `<label class="search"><input class="wallet-password" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${CK.esc(tx('walletMove.password'))}" aria-label="${CK.esc(tx('walletMove.password'))}"></label>` : ''}`;
        const pass = $('.wallet-password', body);
        const { line, go } = dock(flow, tx('walletMove.go'));
        let finished = false;
        const show = (el, text) => {
          el.hidden = !text;
          el.textContent = text || '';
        };
        go.addEventListener('click', () => {
          if (finished) {
            flow.close();
            return;
          }
          if (movingNow || (pass && !pass.value)) return;
          const password = pass ? pass.value : undefined;
          if (pass) pass.value = '';
          movingNow = true;
          go.disabled = true;
          say(line, 'walletMove.working');
          CK.wallet.moveOld(password ? { password } : {}).then((result) => {
            CK.haptic.success();
            finished = true;
            const left = Array.from(new Set(result.left.map((one) => moveName(one.what))));
            show($('.w-move-moved', body), result.moved.length ? tx('walletMove.moved', { list: result.moved.map(moveName).join(', ') }) : '');
            show($('.w-move-left', body), left.length ? tx('walletMove.left', { list: left.join(', ') }) : '');
            if (pass) pass.closest('label').hidden = true;
            say(line, '');
            go.textContent = tx('common.done');
          }, (err) => {
            CK.haptic.error();
            if (CK.wallet.isRejection(err)) {
              say(line, '');
              return;
            }
            if (!STORE_ERRORS[err.code]) console.error(err);
            say(line, STORE_ERRORS[err.code] || 'walletMove.fail');
          }).finally(() => {
            movingNow = false;
            go.disabled = false;
          });
        });
      }
    };
  }

  window.DemoWalletSetup = { openCreate, openProtect, openImport, openRestore, openBackup, openMove, sourceStep, errorKey, phraseWatch, refill };
})();
