(function () {
  'use strict';
  const { icon, t: tx } = CK;
  const T = CK.ton;
  const D = window.DemoData;
  const A = CK.chequeAudit;
  const $ = (s, r) => (r || document).querySelector(s);
  const W = () => window.DemoWallet;

  const SHEET_HEIGHT = 466;
  const EXPLORER = 'https://tonviewer.com/';
  const HEX_HASH = /^[0-9a-f]{64}$/i;
  const NATIVE = 'TON';
  const ASSET = {
    gram: { key: 'gram', sym: 'GRAM', decimals: 9, id: NATIVE, coin: () => D.byId.ton },
    usdt: { key: 'usdt', sym: 'USDT', decimals: 6, id: A.USDT, coin: () => D.byId.usdt }
  };
  const NET_NANO = { gram: 1000000n, usdt: 2100000n };
  const KEEP_NANO = 10000000n;
  const USDT_NEEDS = A.CREATE_USDT_ATTACH + 5000000n;
  const CLAIM_POLL_MS = 4000;
  const PENDING_POLL_MS = 120000;
  const READY_SLOW_MS = 30000;
  const READY_MAX_MS = 30 * 60 * 1000;
  const NOT_SAVED = { too_many_pending: 'cheque.manyPending', too_many_open: 'cheque.tooMany', rate_limited: 'cheque.tooOften', bad_note: 'cheque.noteBad' };

  const isSample = () => CK.market.mode !== 'live' || !CK.tg.inside;
  const infoOf = (a) => {
    if (typeof a === 'string') return ASSET[a] || ASSET.gram;
    if (a && a.asset === 'jetton' && a.jetton) return { key: 'jetton', sym: a.jetton.symbol, decimals: a.jetton.decimals, master: a.jetton.master };
    if (a && a.asset) return ASSET[a.asset] || ASSET.gram;
    return a && typeof a.sym === 'string' && Number.isInteger(a.decimals) ? a : ASSET.gram;
  };
  const full = (units, key) => {
    const a = infoOf(key);
    const v = typeof units === 'bigint' ? units : BigInt(units || 0);
    return `${v > 0n ? W().unitsText(v, a.decimals) : '0'} ${a.sym}`;
  };
  const fullOf = (r) => (r.multi && r.multi.n > 1 ? tx('cheque.multiOf', { n: r.multi.n, amount: full(r.units, r) }) : full(r.units, r));
  const recCount = (r) => (r && r.multi && r.multi.n > 1 ? r.multi.n : r && r.count > 1 ? r.count : 1);
  const dayText = (s) => (Number.isInteger(s) ? CK.i18n.dayShort(s * 1000) : '');
  const daysWord = (d) => tx('cheque.day' + d);
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const coinLogo = (key, size) => {
    const a = infoOf(key);
    if (a.key === 'jetton' && a.row && W().logoOf) return W().logoOf(a.row, size);
    if (a.key === 'jetton') return CK.coinLogo({ id: a.master, sym: a.sym, neutral: true, logo: `api/logos?id=${encodeURIComponent('ton:' + a.master)}` }, size);
    return CK.coinLogo(ASSET[a.key].coin(), size);
  };
  const startOf = (link) => (link.split('startapp=')[1] || '').slice(0, 55);

  const known = new Set();
  let openCount = null;
  const countSubs = new Set();
  function setRows(rows) {
    rows.forEach((r) => known.add(r.address));
    openCount = rows.filter((r) => r.state && (r.state.name === 'open' || r.state.name === 'short' || r.state.name === 'pending' || r.state.name === 'expired')).length;
    countSubs.forEach((fn) => { try { fn(openCount); } catch (err) { console.error(err); } });
  }
  let lastRows = [];

  const nowS = () => Math.floor(Date.now() / 1000);
  const sampleState = (name, extra) => ({ name, seqno: name === 'claimed' || name === 'returned' ? 1 : 0, status: name === 'claimed' || name === 'returned' ? 'active' : 'uninit', gram: '0', jetton: null, to: null, hash: name === 'claimed' ? 'a'.repeat(64) : null, sources: 2, at: Date.now(), ...(extra || {}) });
  const sampleAddress = (n) => '0:' + n.repeat(64).slice(0, 64);
  const SAMPLE = [
    { address: sampleAddress('1'), asset: 'gram', units: '5000000000', gas: '1500000', kind: 'cheque', note: null, createdAt: nowS() - 3600, expiresAt: nowS() + 7 * 86400, state: sampleState('open'), hasRefund: true, nonce: '0'.repeat(16), claimBy: null },
    { address: sampleAddress('2'), asset: 'usdt', units: '25000000', gas: '65000000', kind: 'gift', note: 'С днём рождения!', createdAt: nowS() - 7200, expiresAt: nowS() + 30 * 86400, state: sampleState('open'), hasRefund: true, nonce: '1'.repeat(16), claimBy: null },
    { address: sampleAddress('3'), asset: 'usdt', units: '10000000', gas: '65000000', kind: 'cheque', note: null, createdAt: nowS() - 3 * 86400, expiresAt: nowS() + 4 * 86400, state: sampleState('claimed'), hasRefund: true, nonce: '2'.repeat(16), claimBy: { name: 'Bob', username: 'bob' } },
    { address: sampleAddress('4'), asset: 'gram', units: '1000000000', gas: '1500000', kind: 'cheque', note: null, createdAt: nowS() - 9 * 86400, expiresAt: nowS() - 2 * 86400, state: sampleState('returned'), hasRefund: true, nonce: '3'.repeat(16), claimBy: null }
  ];
  const sampleLink = () => A.formatLink(crypto.getRandomValues(new Uint8Array(32)), null);
  const sampleHeld = () => [
    { id: NATIVE, units: 12500000000n, decimals: 9, sym: 'GRAM', name: 'Gram', inst: D.byId.ton, risk: 'none' },
    { id: A.USDT, units: 40000000n, decimals: 6, sym: 'USDT', name: 'Tether USD', inst: D.byId.usdt, risk: 'none' },
    { id: T.rawAddress('EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT'), units: 5000000000000n, decimals: 9, sym: 'NOT', name: 'Notcoin', inst: D.byId.not, risk: 'none' }
  ];


  const keyOfRow = (r) => (r.id === NATIVE ? 'gram' : r.id === A.USDT ? 'usdt' : r.id);
  function heldOf(rows) {
    const out = {};
    (rows || []).forEach((r) => {
      if (r.risk === 'suspicious' || !(r.units > 0n) && r.id !== NATIVE) return;
      if (r.id === A.USDT && r.decimals !== 6) return;
      out[keyOfRow(r)] = r;
    });
    return out;
  }
  const provenJetton = (master) => {
    try { return CK.swapAudit.swappable(master) === true; } catch (_) { return false; }
  };
  function createStep(o) {
    const st = { asset: o.asset === 'usdt' ? 'usdt' : 'gram', units: o.units || 0n, text: o.units ? W().unitsText(o.units, ASSET[o.asset === 'usdt' ? 'usdt' : 'gram'].decimals) : '', kind: o.kind === 'gift' ? 'gift' : 'cheque', days: 7, note: '', rows: o.rows || null, sending: false, trouble: null, pct: 0, count: 1, optsOpen: false, feeOpen: false };
    return {
      title: o.title || tx('cheque.new'),
      render(body, flow) {
        body.classList.add('tk-order', 'sw-order', 'cq-create');
        body.innerHTML = `
          <div class="cq-kind"></div>
          <div class="w-card">
            <div class="w-card-top w-card-top--max"><button class="w-max press cq-max" type="button" aria-label="${tx('common.max')}">${icon('wallet', { size: 16 })}<b class="w-from-bal"></b></button></div>
            <div class="w-card-main"><button class="w-token press cq-asset" type="button" aria-label="${tx('cheque.asset')}"></button><input class="w-amt" inputmode="decimal" autocomplete="off" placeholder="0" aria-label="${tx('cheque.amount')}"></div>
          </div>
          <div class="tk-order-slider"></div>
          <label class="cq-note-wrap" hidden><span>${tx('cheque.note')}</span><input class="cq-note" maxlength="${A.NOTE_MAX}" autocomplete="off" enterkeyhint="done" placeholder="${tx('cheque.notePh')}"></label>
          <div class="cq-opts">
            <button class="fold-toggle cq-opts-toggle" type="button" aria-expanded="false" aria-controls="cq-opts"><span class="cq-opts-sum"></span>${icon('chevron-down', { size: 16 })}</button>
            <div class="fold-body" id="cq-opts" hidden>
              <div class="cq-line"><span>${tx('cheque.uses')}</span><div class="cq-uses"><button class="btn btn--tinted btn--small press cq-less" type="button" aria-label="${tx('cheque.usesLess')}">${icon('minus', { size: 18 })}</button><input class="cq-count" inputmode="numeric" autocomplete="off" aria-label="${tx('cheque.uses')}"><button class="btn btn--tinted btn--small press cq-more" type="button" aria-label="${tx('cheque.usesMore')}">${icon('plus', { size: 18 })}</button></div></div>
              <div class="cq-line"><span>${tx('cheque.expires')}</span><div class="cq-days"></div></div>
              <p class="fold-line cq-one" hidden></p>
            </div>
          </div>
          <div class="cq-foot">
            <div class="fold-row cq-total" hidden><span>${tx('cheque.total')}</span><span class="cq-total-v"></span></div>
            <button class="fold-toggle cq-fee-toggle" type="button" aria-expanded="false" aria-controls="cq-fee"><span class="cq-fee-sum"></span>${icon('chevron-down', { size: 16 })}</button>
            <div class="fold-body" id="cq-fee" hidden>
              <div class="fold-row"><span>${tx('cheque.gas')}</span><span class="cq-fee-gas"></span></div>
              <div class="fold-row"><span>${tx('cheque.net')}</span><span class="cq-fee-net"></span></div>
            </div>
            <p class="fold-line cq-fine"></p>
          </div>`;
        const dock = CK.el(`<div class="sheet-dock sw-dock">
          <p class="sw-line" role="status"></p>
          <div class="tk-swipe"></div>
          <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
        </div>`);
        flow.sheet.el.appendChild(dock);
        const input = $('.w-amt', body), chip = $('.cq-asset', body), noteWrap = $('.cq-note-wrap', body), note = $('.cq-note', body), fine = $('.cq-fine', body);
        const countEl = $('.cq-count', body), less = $('.cq-less', body), more = $('.cq-more', body), maxBtn = $('.cq-max', body);
        const optsSum = $('.cq-opts-sum', body), oneLine = $('.cq-one', body), totalRow = $('.cq-total', body), feeSum = $('.cq-fee-sum', body);
        const foldOf = (toggle, panel, key) => {
          const show = () => {
            toggle.setAttribute('aria-expanded', String(!!st[key]));
            panel.hidden = !st[key];
          };
          toggle.addEventListener('click', () => {
            CK.haptic.selection();
            st[key] = !st[key];
            show();
          });
          show();
        };
        foldOf($('.cq-opts-toggle', body), $('#cq-opts', body), 'optsOpen');
        foldOf($('.cq-fee-toggle', body), $('#cq-fee', body), 'feeOpen');
        const lineEl = $('.sw-line', dock), swipeHost = $('.tk-swipe', dock), passBox = $('.sw-pass', dock), passInput = $('.sw-pass-input', dock);
        let gone = false, passDone = null;
        const held = () => heldOf(st.rows);
        const rowOf = (key) => held()[key] || null;
        const heldUnits = (key) => { const r = rowOf(key); return r ? r.units : 0n; };
        const has = (key) => heldUnits(key) > 0n;
        const kindOf = (key) => (key === 'gram' || key === 'usdt' ? key : 'jetton');
        const info = (key) => {
          if (key === 'gram' || key === 'usdt') return ASSET[key];
          const r = rowOf(key);
          return { key: 'jetton', sym: r ? r.sym : '?', decimals: r ? r.decimals : 9, master: key, row: r };
        };
        const n = () => BigInt(st.count);
        const maxCount = () => (kindOf(st.asset) === 'jetton' && !provenJetton(st.asset) ? 1 : A.MULTI_MAX);
        const gasEach = () => (st.asset === 'usdt' ? A.GAS_USDT : kindOf(st.asset) === 'jetton' ? A.GAS_JETTON : A.GAS_GRAM);
        const gramNeeds = () => (st.asset === 'usdt' ? USDT_NEEDS * n() : kindOf(st.asset) === 'jetton' ? (A.CREATE_JETTON_ATTACH + A.GAS_JETTON) * n() + 5000000n : 0n);
        const maxUnits = () => {
          if (st.asset !== 'gram') return heldUnits(st.asset) / n();
          const g = heldUnits('gram');
          const keep = KEEP_NANO + A.GAS_GRAM * n();
          return g > keep ? (g - keep) / n() : 0n;
        };
        const minUnits = () => (st.asset === 'usdt' ? A.MIN_USDT : kindOf(st.asset) === 'jetton' ? A.MIN_JETTON : A.MIN_GRAM);
        const gasShort = () => st.asset !== 'gram' && heldUnits('gram') < gramNeeds();
        const noteBad = () => !!st.note && /https?:|www\.|t\.me|telegram\.me|tg:|@|[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/i.test(st.note);
        const netNano = () => (st.asset === 'gram' ? NET_NANO.gram : st.asset === 'usdt' ? NET_NANO.usdt : NET_NANO.usdt + NET_NANO.gram) * n();

        CK.segmented($('.cq-kind', body), {
          label: tx('cheque.row'), value: st.kind, size: 'small',
          items: [{ value: 'cheque', label: tx('cheque.kindCheque') }, { value: 'gift', label: tx('cheque.kindGift') }],
          onChange(v) { st.kind = v; paint(); }
        });
        CK.segmented($('.cq-days', body), {
          label: tx('cheque.expires'), value: String(st.days), size: 'small',
          items: A.EXPIRY_DAYS.map((d) => ({ value: String(d), label: daysWord(d) })),
          onChange(v) { st.days = Number(v); paint(); }
        });
        const slider = CK.slider($('.tk-order-slider', body), {
          label: tx('order.shareAria'), min: 0, max: 100, step: .5, value: st.pct,
          stops: [.25, .5, .75, 1],
          format: (v) => full(maxUnits() * BigInt(Math.round(v * 10)) / 1000n, info(st.asset)),
          onInput(v) {
            st.pct = v;
            st.units = maxUnits() * BigInt(Math.round(v * 10)) / 1000n;
            st.text = st.units > 0n ? W().unitsText(st.units, info(st.asset).decimals) : '';
            input.value = st.text;
            st.trouble = null;
            paint();
          }
        });
        const swipe = CK.swipeConfirm(swipeHost, { tone: 'accent', label: tx('cheque.swipe'), onConfirm: confirm, resetAfter: 60000, reportsOwnResult: true });
        function setLine(text, tone) {
          if (lineEl.textContent !== text) lineEl.textContent = text;
          lineEl.dataset.tone = tone || 'bad';
        }
        const choices = () => Object.keys(held()).filter((key) => key === 'gram' || has(key));
        function paintChip() {
          chip.disabled = choices().filter((key) => key !== st.asset).length === 0;
          chip.innerHTML = `${coinLogo(info(st.asset), 28)}<b></b>${chip.disabled ? '' : icon('chevron-updown', { size: 16 })}`;
          $(':scope > b', chip).textContent = info(st.asset).sym;
        }
        function paintCount() {
          if (st.count > maxCount()) st.count = maxCount();
          countEl.value = String(st.count);
          less.disabled = st.count <= 1 || st.sending;
          more.disabled = st.count >= maxCount() || st.sending;
          countEl.disabled = maxCount() === 1 || st.sending;
        }
        function paint() {
          paintCount();
          $('.w-from-bal', body).textContent = st.rows ? full(heldUnits(st.asset), info(st.asset)) : '';
          maxBtn.disabled = !st.rows || st.sending;
          noteWrap.hidden = st.kind !== 'gift';
          const a = info(st.asset);
          optsSum.textContent = `${tx('cheque.uses')} ${st.count} · ${daysWord(st.days)}`;
          oneLine.textContent = tx('cheque.oneUse');
          oneLine.hidden = !(maxCount() === 1 && kindOf(st.asset) === 'jetton');
          totalRow.hidden = st.count <= 1;
          $('.cq-total-v', totalRow).textContent = full(st.units * n(), a);
          const gas = gasEach() * n(), net = netNano();
          feeSum.textContent = tx('common.fee', { sum: full(gas + net, 'gram') });
          $('.cq-fee-gas', body).textContent = full(gas, 'gram');
          $('.cq-fee-net', body).textContent = '≈ ' + full(net, 'gram');
          fine.textContent = tx('cheque.bearer');
          const over = st.units > maxUnits();
          let line = '', label = 'cheque.swipe';
          if (st.trouble) line = st.trouble;
          else if (gasShort()) line = tx('cheque.needGram', { x: W().unitsText(gramNeeds(), 9) });
          else if (st.units > 0n && st.units < minUnits()) line = tx('cheque.min', { x: full(minUnits(), a) });
          else if (over) line = tx(st.units * n() <= heldUnits(st.asset) ? 'swap.noGasShort' : 'walletFlow.overBalance');
          else if (noteBad()) line = tx('cheque.noteBad');
          if (!st.rows) label = 'swap.waitBalance';
          else if (st.units <= 0n) label = 'order.needAmount';
          setLine(line, st.sending && !st.trouble ? 'note' : 'bad');
          swipe.setDisabled(!!line || label !== 'cheque.swipe' || st.sending);
          swipe.update({ label: tx(label) });
        }
        function amountTyped() {
          W().fitFraction(input, info(st.asset).decimals);
          st.units = W().typedUnits(input.value, info(st.asset).decimals);
          st.text = input.value;
          syncSlider();
          st.trouble = null;
          paint();
        }
        function syncSlider() {
          const max = maxUnits();
          const d = info(st.asset).decimals;
          st.pct = max > 0n && st.units > 0n ? Math.max(0, Math.min(100, T.fromUnits(st.units, d) / T.fromUnits(max, d) * 100)) : 0;
          slider.set(st.pct);
        }
        function setCount(next) {
          const v = Math.max(1, Math.min(maxCount(), Number.isInteger(next) ? next : 1));
          if (v !== st.count) CK.haptic.selection();
          st.count = v;
          syncSlider();
          st.trouble = null;
          paint();
        }
        less.addEventListener('click', () => setCount(st.count - 1));
        more.addEventListener('click', () => setCount(st.count + 1));
        maxBtn.addEventListener('click', () => {
          const max = maxUnits();
          if (st.sending || !st.rows || max <= 0n) return;
          CK.haptic.selection();
          st.units = max;
          st.text = W().unitsText(max, info(st.asset).decimals);
          input.value = st.text;
          syncSlider();
          st.trouble = null;
          paint();
        });
        countEl.addEventListener('input', () => {
          countEl.value = countEl.value.replace(/\D/g, '').slice(0, 3);
          if (countEl.value) setCount(Number(countEl.value));
        });
        countEl.addEventListener('blur', () => paintCount());
        countEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') countEl.blur(); });
        W().amountField(input);
        input.addEventListener('input', amountTyped);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
        note.addEventListener('input', () => { st.note = note.value; st.trouble = null; paint(); });
        note.addEventListener('keydown', (e) => { if (e.key === 'Enter') note.blur(); });
        function pickAsset(next) {
          if (next === st.asset) return;
          st.asset = next;
          st.units = 0n;
          st.text = '';
          st.pct = 0;
          if (gone) return;
          input.value = '';
          slider.set(0);
          paintChip();
          paint();
        }
        chip.addEventListener('click', () => {
          if (chip.disabled || st.sending) return;
          CK.haptic.selection();
          const keys = choices();
          if (keys.length === 2) return pickAsset(keys.find((key) => key !== st.asset));
          return flow.push(W().pickerStep({
            title: tx('cheque.asset'),
            list: keys.map((key) => rowOf(key)).filter(Boolean),
            onPick(row, f) {
              pickAsset(keyOfRow(row));
              f.back();
            }
          }));
        });
        passBox.addEventListener('submit', (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });
        function askPassword() {
          return new Promise((resolve) => {
            swipeHost.hidden = true;
            passBox.hidden = false;
            passInput.value = '';
            passInput.focus({ preventScroll: true });
            passDone = (value) => {
              passDone = null;
              passInput.value = '';
              passBox.hidden = true;
              swipeHost.hidden = false;
              resolve(value);
            };
          });
        }
        function release(text) {
          st.sending = false;
          st.trouble = text || null;
          input.disabled = false;
          note.disabled = false;
          body.classList.remove('is-busy');
          paint();
          return false;
        }
        function intentNow() {
          const ref = null;
          const kind = kindOf(st.asset);
          return {
            asset: kind, units: st.units.toString(), expiresAt: nowS() + st.days * 86400, kind: st.kind, note: st.kind === 'gift' && st.note.trim() ? st.note.trim() : null, ref,
            ...(kind === 'jetton' ? { jetton: st.asset } : {}), ...(st.count > 1 ? { count: st.count } : {})
          };
        }
        async function confirm() {
          if (st.sending || st.units < minUnits() || st.units > maxUnits() || gasShort() || noteBad()) return false;
          st.sending = true;
          st.trouble = null;
          input.blur();
          note.blur();
          input.disabled = true;
          note.disabled = true;
          body.classList.add('is-busy');
          setLine(tx('swap.signing'), 'note');
          const intent = intentNow();
          const shown = info(st.asset);
          if (isSample()) {
            const made = await sampleMake(intent, shown);
            if (gone || flow.closing) return false;
            CK.haptic.success();
            flow.replace(readyStep(made, o.inline));
            return undefined;
          }
          let password;
          const usePassword = CK.wallet.status.method === 'password';
          for (;;) {
            if (usePassword) {
              password = await askPassword();
              if (password === null || flow.closing) return release();
            }
            setLine(tx('swap.signing'), 'note');
            try {
              const made = await CK.cheques.make(intent, { ...(password ? { password } : {}), wallet: T.wallet && T.wallet.address }, (step) => {
                if (step === 'saved' && !gone) setLine(tx('cheque.making'), 'note');
              });
              const ticket = { ...made.ticket, shown };
              known.add(ticket.address);
              CK.haptic.success();
              if (gone || flow.closing) {
                openReady(ticket, o.inline);
                return undefined;
              }
              flow.replace(readyStep(ticket, o.inline));
              return undefined;
            } catch (err) {
              if (err.code === 'wrong_password') { st.trouble = tx('swapSheet.passwordWrong'); continue; }
              if (CK.wallet.protectRefused(err)) return release(tx('wallet.needProtect'));
              if (CK.wallet.isRejection(err)) return release();
              console.error('cheque:', err.code || err.message);
              CK.haptic.error();
              if (err.code === 'not_saved') return release(tx(NOT_SAVED[err.reason] || 'cheque.failed'));
              if (err.code === 'not_sent') return release(tx(err.reason === 'pending' ? 'swapSheet.pendingLock' : 'cheque.failed'));
              if (err.code === 'cheque_stale') return release(tx('cheque.failed'));
              if (err.code === 'too_many_open') return release(tx('cheque.tooMany'));
              if (err.code === 'cheque_refused' && err.reason === 'jetton_multi') return release(tx('cheque.oneUse'));
              if (err.code === 'cheque_refused' && (err.reason === 'token' || err.reason === 'jetton_wallet')) return release(tx('cheque.tokenBad'));
              const errors = W().SIGN_ERRORS || {};
              return release(tx(errors[err.code] || 'swapSheet.tryAgain'));
            } finally {
              password = undefined;
            }
          }
        }
        function load() {
          if (isSample()) {
            st.rows = sampleHeld();
            afterRows();
            return;
          }
          W().loadRows(Date.now()).then((rows) => {
            if (gone) return;
            st.rows = rows;
            afterRows();
          }, (err) => {
            console.error(err);
            if (!gone) setTimeout(load, 5000);
          });
        }
        function afterRows() {
          if (!has(st.asset)) {
            const other = choices().find((key) => key !== st.asset && has(key));
            if (other && (st.asset !== 'gram' || !has('gram'))) st.asset = other;
          }
          syncSlider();
          paintChip();
          paint();
        }
        input.value = st.text;
        note.value = st.note;
        paintChip();
        paint();
        if (!st.rows) load();
        else afterRows();
        return () => {
          gone = true;
          if (passDone) passDone(null);
        };
      }
    };
  }
  function sampleMake(intent, shown) {
    return pause(900).then(() => {
      const count = intent.count || 1;
      const row = {
        address: '0:' + Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join(''), asset: intent.asset, units: intent.units,
        gas: String(intent.asset === 'usdt' ? A.GAS_USDT : intent.asset === 'jetton' ? A.GAS_JETTON : A.GAS_GRAM), kind: intent.kind, note: intent.note, createdAt: nowS(), expiresAt: intent.expiresAt,
        state: sampleState('pending'), hasRefund: true, nonce: '4'.repeat(16), claimBy: null, sample: true,
        jetton: intent.asset === 'jetton' ? { master: intent.jetton, symbol: shown.sym, decimals: shown.decimals, wallet: null } : null,
        multi: count > 1 ? { n: count, claimed: 0, returned: 0, left: count } : null
      };
      SAMPLE.unshift(row);
      return { ...row, link: sampleLink(), hash: null, wallet: null, count, shown };
    });
  }

  function readyStep(ticket, inline) {
    return {
      title: tx('cheque.row'),
      render(body, flow) {
        body.classList.add('sw-status', 'cq-done');
        body.innerHTML = `
          <div class="sw-state"><span class="sw-state-mark"><i class="sw-spin"></i></span><span class="sw-state-words"><b class="sw-state-title"></b><span class="sw-state-text"></span></span></div>
          ${ticket.kind === 'gift' ? giftCardHtml() : ''}
          <div class="sw-rows summary cq-sum"></div>
          ${moreHtml()}
          <div class="cq-actions">
            <div class="cq-actions-row">
              <button class="btn btn--wide press cq-share" type="button" disabled>${icon('share', { size: 20 })}<span>${tx('cheque.share')}</span></button>
              <button class="btn btn--tinted press cq-copy" type="button" disabled aria-label="${tx('cheque.copy')}" title="${tx('cheque.copy')}">${icon('copy', { size: 22 })}</button>
            </div>
          </div>`;
        if (ticket.kind === 'gift') fillGift($('.cq-gift', body), null, ticket.note);
        const head = $('.sw-state', body), mark = $('.sw-state-mark', body), title = $('.sw-state-title', body), text = $('.sw-state-text', body);
        const share = $('.cq-share', body), copy = $('.cq-copy', body);
        let gone = false, ready = false;
        const shown = ticket.shown || ticket.asset;
        const many = ticket.count > 1 ? BigInt(ticket.count) : 1n;
        const rows = [[tx('cheque.amount'), many > 1n ? tx('cheque.multiOf', { n: ticket.count, amount: full(ticket.units, shown) }) : full(ticket.units, shown)], [tx('cheque.expires'), tx('cheque.until', { date: dayText(ticket.expiresAt) })]];
        rows.forEach(([label, value]) => {
          const row = CK.el('<div class="summary-row"><b></b></div>');
          row.prepend(label);
          row.lastElementChild.textContent = value;
          $('.cq-sum', body).appendChild(row);
        });
        fillMore(body, [[tx('cheque.gas'), full(BigInt(ticket.gas || 0) * many, 'gram')]]);
        function paint(name) {
          ready = ready || name === 'open';
          head.dataset.tone = ready ? 'up' : name === 'pending' || !name ? 'accent' : 'hint';
          title.textContent = tx(ready ? 'cheque.ready' : 'cheque.making');
          text.textContent = ready ? tx('cheque.bearer') : '';
          if (ready && !mark.dataset.done) {
            mark.dataset.done = '1';
            mark.className = 'sw-state-mark receipt-pop';
            mark.innerHTML = icon('check-circle', { fill: true, size: 40 });
          }
          share.disabled = !ready;
          copy.disabled = false;
        }
        paint(null);
        share.addEventListener('click', () => {
          CK.haptic.light();
          shareTicket(ticket);
        });
        copy.addEventListener('click', () => copyLink(ticket.link));
        $('.cq-open', body).addEventListener('click', () => T.openLink(HEX_HASH.test(ticket.hash || '') ? `${EXPLORER}transaction/${ticket.hash}` : EXPLORER + T.friendlyAddress(ticket.address)));
        const since = Date.now();
        let cheered = false;
        const sampleWait = () => pause(1600).then(() => {
          const row = SAMPLE.find((r) => r.address === ticket.address);
          if (row) row.state = sampleState('open', { gram: ticket.asset !== 'gram' ? String(BigInt(ticket.gas)) : String(BigInt(ticket.units) + A.GAS_GRAM), jetton: ticket.asset !== 'gram' ? ticket.units : null });
          return { name: 'open', sources: 2 };
        });
        async function watch(first) {
          const s = isSample() ? await sampleWait() : await CK.cheques.waitOpen(ticket.address, first ? { stop: () => gone } : { stop: () => gone, ms: 1 });
          if (gone) return;
          if (s) paint(s.name);
          if (s && s.name === 'open' && !cheered) {
            cheered = true;
            CK.haptic.success();
            if (!isSample() && CK.cheques.warm) CK.cheques.warm(ticket);
          }
          if (s && s.name === 'open' && s.sources === 2) {
            if (inline && !isSample() && CK.tg.switchInlineQuery(startOf(ticket.link))) flow.close();
            return;
          }
          if (s && CK.cheques.FINAL.has(s.name)) return;
          if (Date.now() - since > READY_MAX_MS) return;
          await pause(READY_SLOW_MS);
          if (!gone) watch(false);
        }
        watch(true).catch((err) => console.error('cheque wait:', err.code || err.message));
        return () => { gone = true; };
      }
    };
  }
  function openReady(ticket, inline) {
    if (CK.sheet.top) return;
    W().openFlow(readyStep(ticket, inline), null, SHEET_HEIGHT);
  }
  function shareText(ticket) {
    const amount = full(ticket.units, ticket.shown || ticket.asset);
    return ticket.kind === 'gift' ? tx('cheque.sendGift') : tx('cheque.sendText', { amount: ticket.count > 1 ? tx('cheque.multiOf', { n: ticket.count, amount }) : amount });
  }
  function shareTicket(ticket) {
    if (isSample()) {
      T.openLink(`https://t.me/share/url?url=${encodeURIComponent(ticket.link)}&text=${encodeURIComponent(shareText(ticket))}`);
      return Promise.resolve('link');
    }
    return CK.cheques.share(ticket, { text: shareText(ticket) });
  }
  function copyLink(link) {
    return CK.copyText(link).then((copied) => {
      if (copied) CK.toast(tx('cheque.copied'), { icon: 'check-circle', tone: 'up' });
      else CK.toast(tx('common.copyFail'), { icon: 'warning', tone: 'down' });
    });
  }

  const moreHtml = () => `<div class="cq-details"><button class="fold-toggle cq-more-toggle" type="button" aria-expanded="false" aria-controls="cq-more">${tx('common.more')}${icon('chevron-down', { size: 16 })}</button><div class="fold-body" id="cq-more" hidden><button class="w-tool cq-open press" type="button">${icon('arrow-up-right', { size: 16 })}<span>${tx('cheque.explorer')}</span></button></div></div>`;
  function fillMore(body, rows) {
    const toggle = $('.cq-more-toggle', body), panel = $('#cq-more', body), open = $('.cq-open', panel);
    rows.forEach(([label, value]) => {
      const row = CK.el('<div class="fold-row"><span></span><span></span></div>');
      row.firstElementChild.textContent = label;
      row.lastElementChild.textContent = value;
      panel.insertBefore(row, open);
    });
    toggle.addEventListener('click', () => {
      const show = toggle.getAttribute('aria-expanded') !== 'true';
      CK.haptic.selection();
      toggle.setAttribute('aria-expanded', String(show));
      panel.hidden = !show;
    });
  }

  const giftCardHtml = () => `<div class="cq-gift"><span class="cq-gift-mark">${icon('gift', { size: 34 })}</span><b class="cq-gift-title"></b><span class="cq-gift-note"></span><span class="cq-gift-amount" hidden></span></div>`;
  function fillGift(card, name, note, amount) {
    $('.cq-gift-title', card).textContent = name ? tx('cheque.giftFrom', { name }) : tx('cheque.kindGift');
    const n = $('.cq-gift-note', card);
    n.textContent = note || '';
    n.hidden = !note;
    const a = $('.cq-gift-amount', card);
    a.textContent = amount || '';
    a.hidden = !amount;
  }


  function figureOf(state, record, seen) {
    const s = state || {};
    const r = record;
    const jetton = s.jetton && s.jetton !== '0' ? BigInt(s.jetton) : 0n;
    const asset = r ? r.asset : jetton > 0n ? 'usdt' : seen ? seen.asset : 'gram';
    let units;
    if (asset !== 'gram') units = jetton > 0n ? jetton : r ? BigInt(r.units) : 0n;
    else {
      const gram = BigInt(s.gram || 0);
      const onChain = gram > A.GAS_GRAM ? gram - A.GAS_GRAM : 0n;
      units = r ? (onChain && onChain < BigInt(r.units) ? onChain : BigInt(r.units)) : onChain;
    }
    if (units > 0n) return { asset, units };
    return seen || { asset, units: 0n };
  }

  function openClaim(code, sample) {
    if (CK.sheet.top) return;
    W().openFlow(claimStep(code, sample), null, SHEET_HEIGHT);
  }
  function claimStep(code, sample) {
    return {
      title: tx('cheque.row'),
      render(body, flow) {
        body.classList.add('sw-status', 'cq-claim');
        body.innerHTML = `
          <div class="cq-claim-card"></div>
          <p class="w-note cq-claim-note" hidden></p>
          <p class="w-note cq-claim-to" hidden></p>
          <div class="cq-actions"><button class="btn btn--wide press cq-go" type="button" hidden></button><button class="btn btn--tinted btn--wide press cq-explore" type="button" hidden>${icon('arrow-up-right', { size: 20 })}<span>${tx('cheque.explorer')}</span></button></div>`;
        const card = $('.cq-claim-card', body), toEl = $('.cq-claim-to', body), noteEl = $('.cq-claim-note', body), go = $('.cq-go', body), explore = $('.cq-explore', body);
        let gone = false, busy = false, view = null, signed = null;
        const c = { address: null, pk: null, lid: null, record: null, mine: false, state: null, own: null, wallet: null, hash: null, claimed: null, got: null, seen: null, multi: false, slot: null, allTaken: false };
        const shownOf = (asset) => (asset === 'jetton' && c.record ? c.record : asset);
        const chainUnits = () => figureOf(c.multi && !c.slot ? null : c.state, c.record, c.seen);
        const shownUnits = () => (c.claimed && c.got ? c.got : chainUnits());
        function whichView() {
          if (c.claimed) return 'got';
          const s = c.state;
          if (!s) return 'loading';
          if (c.multi && !c.slot) {
            const m = c.record.multi;
            if (s.name === 'pending') return 'pending';
            if (c.mine) return CK.cheques.FINAL.has(s.name) ? 'mineDone' : 'mineMulti';
            if (s.name === 'expired' || (c.record.expiresAt && nowS() > c.record.expiresAt + 60)) return 'expired';
            if (c.allTaken || CK.cheques.FINAL.has(s.name) || !m || m.left <= 0) return 'allTaken';
            if (s.name === 'open') return !c.own ? 'noWallet' : 'open';
            return 'unknown';
          }
          const name = s.name === 'open' && c.record && c.record.expiresAt && nowS() > c.record.expiresAt + 60 ? 'expired' : s.name;
          if (name === 'pending') return 'pending';
          if (name === 'expired') return 'expired';
          if (name === 'short') return 'short';
          if (name === 'returned') return c.own && s.to === c.own ? 'got' : 'returned';
          if (name === 'claimed') return c.own && s.to === c.own ? 'got' : 'taken';
          if (name === 'open') return !c.own ? 'noWallet' : c.mine ? 'mine' : 'open';
          return 'unknown';
        }
        function paint() {
          if (gone) return;
          const next = whichView();
          const sig = next + '|' + (busy ? 1 : 0) + '|' + (c.state ? c.state.gram + c.state.jetton : '');
          if (view === sig) return;
          view = sig;
          const { asset, units } = shownUnits();
          if (units > 0n && next !== 'loading' && (!c.seen || !c.state || c.state.name === 'open')) c.seen = { asset, units };
          const amountText = units > 0n ? full(units, shownOf(asset)) : '';
          const gift = !!c.record && c.record.kind === 'gift';
          const fromName = c.record && c.record.from ? c.record.from.name || (c.record.from.username ? '@' + c.record.from.username : '') : '';
          const showAmount = !gift || busy || next === 'got';
          if (gift) {
            if (!$('.cq-gift', card)) card.innerHTML = giftCardHtml();
            fillGift($('.cq-gift', card), fromName, c.record.note, showAmount && next !== 'loading' ? amountText : '');
          } else {
            card.innerHTML = `<div class="cq-claim-head">${next === 'loading' ? '<span class="w-skel w-skel-dot cq-skel"></span>' : coinLogo(shownOf(asset), 56)}<b class="cq-claim-amount"></b><span class="cq-claim-from"></span></div>`;
            $('.cq-claim-amount', card).textContent = next === 'loading' ? '' : !amountText ? tx('cheque.row') : next === 'got' ? tx('cheque.got', { amount: amountText }) : amountText;
            $('.cq-claim-from', card).textContent = fromName ? tx('cheque.from', { name: fromName }) : '';
          }
          toEl.textContent = (next === 'open' || next === 'mine') && c.wallet ? tx('cheque.toWallet', { name: c.wallet }) : '';
          toEl.hidden = !toEl.textContent;
          const lines = {
            loading: '', pending: tx('cheque.onWay'), expired: tx('cheque.expired'), short: tx('cheque.short'), returned: tx('cheque.gone'),
            taken: tx('cheque.taken'), noWallet: tx('cheque.noWallet'), unknown: tx('cheque.unknown'), got: gift || !amountText ? (amountText ? tx('cheque.got', { amount: amountText }) : tx('cheque.claimed')) : '',
            mine: tx('cheque.yours'), open: '', allTaken: tx('cheque.allTaken')
          };
          const m = c.multi && c.record ? c.record.multi : null;
          if (m && !c.slot) {
            lines.mineMulti = `${tx('cheque.yours')}. ${tx('cheque.gotOf', { k: m.claimed, n: m.n })}`;
            lines.mineDone = tx('cheque.gotOf', { k: m.claimed, n: m.n });
            if (next === 'open') lines.open = tx('cheque.leftOf', { k: m.left, n: m.n });
          }
          noteEl.textContent = lines[next] || '';
          noteEl.hidden = !noteEl.textContent;
          go.hidden = !(next === 'open' || next === 'mine' || next === 'mineMulti' || next === 'unknown');
          go.disabled = busy;
          go.textContent = busy ? tx(next === 'mine' || next === 'mineMulti' ? 'cheque.returning' : 'cheque.claiming') : next === 'unknown' ? tx('common.retry') : next === 'mineMulti' ? tx('cheque.returnRest') : next === 'mine' ? tx('cheque.takeBack') : gift ? tx('cheque.giftOpen') : tx('cheque.claim');
          explore.hidden = next !== 'got';
        }
        async function look() {
          view = null;
          c.state = null;
          paint();
          if (sample) {
            await pause(500);
            c.address = sampleAddress('9');
            c.record = sample === 'gift'
              ? { address: c.address, asset: 'usdt', units: '5000000', kind: 'gift', note: 'С днём рождения!', expiresAt: nowS() + 7 * 86400, from: { name: 'Alice', username: 'alice' } }
              : sample === 'multi'
                ? { address: c.address, asset: 'usdt', units: '1000000', kind: 'cheque', note: null, expiresAt: nowS() + 7 * 86400, from: { name: 'Alice', username: 'alice' }, multi: { n: 10, claimed: 3, returned: 0, left: 7 }, state: sampleState('open') }
                : { address: c.address, asset: 'usdt', units: '10000000', kind: 'cheque', note: null, expiresAt: nowS() + 7 * 86400, from: { name: 'Alice', username: 'alice' } };
            c.multi = sample === 'multi';
            c.state = sampleState('open', { jetton: c.record.units, gram: String(A.GAS_USDT) });
            c.own = sampleAddress('8');
            c.wallet = T.shortAddress(T.friendlyAddress(c.own));
            return paint();
          }
          try {
            const where = await CK.wallet.cheque.addressOf(code);
            c.address = where.address;
            c.pk = where.publicKey;
            c.lid = where.lid;
          } catch (err) {
            card.innerHTML = '';
            noteEl.textContent = tx('cheque.badLink');
            noteEl.hidden = false;
            return;
          }
          const [found, state] = await Promise.all([
            CK.cheques.lookup(c.lid).catch(() => null),
            CK.cheques.state(c.address).catch(() => ({ name: 'unknown' })),
            CK.wallet.ready.catch(() => null)
          ]);
          if (gone) return;
          c.multi = !!found && found.multi && !!found.record && !!found.record.multi;
          c.record = found && found.record && (c.multi || found.record.address === c.address) ? found.record : null;
          c.mine = !!found && found.mine;
          c.state = c.multi ? c.record.state : state;
          if (c.multi && found.held && !c.mine) await takeSlot().catch(() => null);
          try {
            const own = await Promise.race([CK.wallet.depositAddress(), pause(10000).then(() => null)]);
            c.own = own && own.verified ? own.address : null;
            c.wallet = c.own ? T.shortAddress(T.friendlyAddress(c.own)) : null;
          } catch (_) {
            c.own = null;
          }
          paint();
          if (c.state.name === 'pending') pollPending(Date.now());
        }
        function pollPending(since) {
          setTimeout(() => {
            if (gone || Date.now() - since > PENDING_POLL_MS) return;
            CK.cheques.state(c.address).then((s) => {
              c.state = s;
              paint();
              if (s.name === 'pending') pollPending(since);
            }, () => pollPending(since));
          }, CLAIM_POLL_MS);
        }
        async function takeSlot() {
          const got = await CK.cheques.slot(c.lid);
          c.slot = got.slot;
          c.address = got.slot.address;
          c.state = got.state;
        }
        async function returnRest() {
          busy = true;
          paint();
          try {
            await CK.cheques.returnStored(c.record.address);
            CK.haptic.success();
            CK.toast(tx('cheque.returning'), { icon: 'check-circle', tone: 'up' });
            setTimeout(() => { if (!flow.closing) flow.close(); }, 900);
          } catch (err) {
            console.error('cheque return:', err.code || err.message);
            CK.haptic.error();
            CK.toast(tx('swapSheet.tryAgain'), { icon: 'warning', tone: 'down' });
          } finally {
            busy = false;
            view = null;
            paint();
          }
        }
        async function claim() {
          if (busy) return;
          if (whichView() === 'unknown') return look();
          if (whichView() === 'mineMulti') return returnRest();
          if (c.multi && !c.slot && !sample) {
            busy = true;
            paint();
            try {
              await takeSlot();
            } catch (err) {
              busy = false;
              view = null;
              if (err.code === 'none_left') c.allTaken = true;
              else if (err.code === 'expired') c.state = { ...c.state, name: 'expired' };
              else CK.toast(tx('swapSheet.tryAgain'), { icon: 'warning', tone: 'down' });
              return paint();
            }
            busy = false;
            view = null;
            paint();
            if (whichView() !== 'open') return undefined;
          }
          busy = true;
          paint();
          CK.haptic.light();
          if (sample) {
            await pause(1400);
            c.claimed = true;
            busy = false;
            CK.haptic.success();
            return paint();
          }
          try {
            const jetton = c.record && c.record.jetton ? { master: c.record.jetton.master, wallet: c.multi ? null : c.record.jetton.wallet } : undefined;
            if (!signed || signed.validUntil < nowS() + 30) signed = await CK.wallet.cheque.claim(code, { to: c.own, chain: c.state, ...(c.slot ? { slot: c.slot } : {}), ...(jetton ? { jetton } : {}) });
            const moving = signed.asset !== 'gram' ? { asset: signed.asset, units: BigInt(signed.units) } : chainUnits();
            try {
              await CK.cheques.relay(c.address, signed.boc, c.record ? undefined : c.pk);
            } catch (err) {
              if (err.code !== 'send_unsure') throw err;
            }
            c.hash = signed.hash;
            for (let i = 0; i < 20 && !gone; i++) {
              await pause(i < 3 ? 2500 : CLAIM_POLL_MS);
              const s = await CK.cheques.state(c.address).catch(() => null);
              if (!s) continue;
              c.state = s;
              if (s.name === 'claimed' || s.name === 'returned') break;
            }
            if ((c.state.name === 'claimed' || c.state.name === 'returned') && c.state.to === c.own) {
              c.claimed = true;
              if (moving.units > 0n) c.got = moving;
              if (c.state.hash) c.hash = c.state.hash;
              CK.haptic.success();
            }
          } catch (err) {
            console.error('cheque claim:', err.code || err.message);
            CK.haptic.error();
            signed = null;
            if (c.address) c.state = await CK.cheques.state(c.address).catch(() => c.state);
            CK.toast(tx(err.code === 'cheque_short' ? 'cheque.short' : 'swapSheet.tryAgain'), { icon: 'warning', tone: 'down' });
          } finally {
            busy = false;
            view = null;
            paint();
          }
          return undefined;
        }
        go.addEventListener('click', claim);
        explore.addEventListener('click', () => T.openLink(HEX_HASH.test(c.hash || '') ? `${EXPLORER}transaction/${c.hash}` : EXPLORER + (c.address ? T.friendlyAddress(c.address) : '')));
        look();
        return () => { gone = true; };
      }
    };
  }


  function rowSub(r) {
    const s = r.state ? r.state.name : null;
    if (r.multi && r.multi.n > 1 && r.asset) {
      const got = tx('cheque.gotOf', { k: r.multi.claimed, n: r.multi.n });
      if (s === 'open' && r.expiresAt) return `${got} · ${tx('cheque.until', { date: dayText(r.expiresAt) })}`;
      if (s === 'pending') return tx('cheque.pending');
      if (s === 'expired') return `${got} · ${tx('cheque.expiredRow')}`;
      return got;
    }
    if (s === 'pending') return tx('cheque.pending');
    if (s === 'claimed') return tx('cheque.claimed') + (r.claimBy && (r.claimBy.name || r.claimBy.username) ? ' · ' + (r.claimBy.name || '@' + r.claimBy.username) : '');
    if (s === 'returned') return tx('cheque.returned');
    if (s === 'expired') return tx('cheque.expiredRow');
    if (s === 'short') return tx('cheque.shortRow');
    if (s === 'open') return r.expiresAt ? tx('cheque.until', { date: dayText(r.expiresAt) }) : '';
    return Number.isInteger(r.createdAt) ? `${tx('cheque.created')} ${dayText(r.createdAt)}` : '';
  }
  const isFinal = (r) => !!r.state && CK.cheques.FINAL.has(r.state.name);
  function loadRows() {
    if (isSample()) return pause(300).then(() => SAMPLE.slice());
    return CK.cheques.merged();
  }
  function openList(from, stack) {
    if (CK.sheet.top) return;
    let newBtn = null;
    const screen = CK.screen({
      title: () => tx('cheque.mine'),
      actions: [{ icon: 'plus', label: () => tx('cheque.new'), className: 'cq-new', onClick: () => openCreate({}), mount: (b) => { newBtn = b; } }]
    });
    screen.el.classList.add('no-tabbar');
    stack.push(screen, { returnFocus: from });
    const body = screen.body;
    body.innerHTML = '<div class="cq-list"><div class="group list--free"><div class="wallet-skel"></div><div class="wallet-skel"></div></div></div>';
    const list = $('.cq-list', body);
    let rows = [];
    const canCreate = () => isSample() || (!!T.wallet && !T.wallet.readOnly);
    newBtn.hidden = !canCreate();
    const offWallet = T.onWallet(() => {
      if (!screen.el.isConnected) return offWallet();
      newBtn.hidden = !canCreate();
      return undefined;
    });
    CK.wallet.ready.catch(() => null).then(() => { newBtn.hidden = !canCreate(); });
    function rowHtml(r, i) {
      const amount = r.asset ? fullOf(r) : T.shortAddress(T.friendlyAddress(r.address));
      return `<button class="cell press-row cq-row" type="button" data-i="${i}">${r.asset ? coinLogo(r, 40) : `<span class="w-tile" style="--s:40px">${icon('gift', { size: 20 })}</span>`}<span class="cell-main"><b class="cq-row-amount">${CK.esc(amount)}</b><span class="cq-row-sub">${CK.esc(rowSub(r))}</span></span>${r.kind === 'gift' ? `<span class="cq-row-tag">${icon('gift', { size: 16 })}</span>` : ''}</button>`;
    }
    function paint() {
      const open = rows.map((r, i) => [r, i]).filter(([r]) => !isFinal(r));
      const done = rows.map((r, i) => [r, i]).filter(([r]) => isFinal(r));
      if (!rows.length) {
        list.innerHTML = CK.emptyState({ icon: 'gift', title: tx('cheque.none'), className: 'w-empty' });
        return;
      }
      list.innerHTML = [open, done].filter((part) => part.length).map((part) => `<div class="group list--free">${part.map(([r, i]) => rowHtml(r, i)).join('')}</div>`).join('');
    }
    function load() {
      loadRows().then((next) => {
        rows = next;
        lastRows = next;
        setRows(next);
        paint();
      }, (err) => {
        console.error('cheques:', err.code || err.message);
        list.innerHTML = CK.emptyState({ icon: 'warning', title: tx('common.loadFail'), className: 'w-empty', actions: `<button class="btn btn--small btn--tinted press w-retry" type="button">${tx('common.retry')}</button>` });
      });
    }
    list.addEventListener('click', (e) => {
      if (e.target.closest('.w-retry')) return load();
      const row = e.target.closest('[data-i]');
      if (!row) return;
      CK.haptic.selection();
      openDetail(rows[Number(row.dataset.i)], load);
    });
    CK.i18n.bind(screen.el, paint);
    load();
  }

  function detailOf(r) {
    const name = r.state ? r.state.name : 'unknown';
    const base = r.state ? r.state.base : null;
    const gramOn = BigInt((r.state && r.state.gram) || 0);
    const jettonOn = BigInt((r.state && r.state.jetton) || 0);
    const shortByFigures = jettonOn > 0n && gramOn < A.FLOOR_USDT;
    const short = name === 'short' || (name === 'expired' && (base === 'short' || (!base && shortByFigures))) || (name === 'pending' && shortByFigures);
    if (r.multi && r.multi.n > 1) return { short: false, canReturn: !isFinal(r) && !!r.nonce && name !== 'pending' };
    const canReturn = !isFinal(r) && !!r.nonce && (name !== 'pending' || gramOn > 0n || jettonOn > 0n);
    return { short, canReturn };
  }
  const storedReturnFits = (state) => (state.name === 'open' || (state.name === 'expired' && state.base !== 'short')) && state.seqno === 0;

  function openDetail(r, changed) {
    if (CK.sheet.top || !r) return;
    W().openFlow({
      title: r.kind === 'gift' ? tx('cheque.kindGift') : tx('cheque.row'),
      render(body, flow) {
        body.classList.add('sw-status', 'cq-done');
        const name = r.state ? r.state.name : 'unknown';
        const final = isFinal(r);
        const { short, canReturn } = detailOf(r);
        const many = r.multi && r.multi.n > 1 ? r.multi : null;
        const live = !final && !!r.nonce;
        const returnHtml = !canReturn ? ''
          : short ? `<button class="btn btn--tinted btn--wide press cq-return" type="button">${tx('cheque.topUp', { x: W().unitsText(CK.wallet.cheque.TOPUP_NANO, 9) })}</button>`
            : `<button class="cq-return cq-link--danger press" type="button">${many ? tx('cheque.returnRest') : tx('cheque.return')}</button>`;
        body.innerHTML = `
          <div class="sw-rows summary cq-sum"></div>
          ${moreHtml()}
          <p class="sw-line cq-detail-line" role="status"></p>
          <div class="cq-actions">
            <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
            ${live ? `<div class="cq-actions-row"><button class="btn btn--wide press cq-share" type="button">${icon('share', { size: 20 })}<span>${tx('cheque.share')}</span></button><button class="btn btn--tinted press cq-copy" type="button" aria-label="${tx('cheque.copy')}" title="${tx('cheque.copy')}">${icon('copy', { size: 22 })}</button></div>` : ''}
            ${returnHtml}
          </div>`;
        const sum = $('.cq-sum', body), line = $('.cq-detail-line', body);
        const lines = [];
        if (r.asset && many) {
          lines.push([tx('cheque.amount'), fullOf(r)]);
          lines.push([tx('cheque.claimed'), tx('cheque.leftOf', { k: many.claimed, n: many.n })]);
        } else if (r.asset) lines.push([tx('cheque.amount'), full(r.units, r)]);
        if (r.expiresAt) lines.push([tx('cheque.expires'), tx('cheque.until', { date: CK.i18n.dayMonthYear(r.expiresAt * 1000) })]);
        if (name !== 'open') lines.push([tx('walletFlow.status'), name === 'unknown' ? tx('cheque.unknown') : rowSub(r)]);
        const extra = [];
        if (r.gas) extra.push([tx('cheque.gas'), full(BigInt(r.gas) * BigInt(many ? many.n : 1), 'gram')]);
        extra.push([tx('cheque.address'), T.shortAddress(T.friendlyAddress(r.address))]);
        fillMore(body, extra);
        lines.forEach(([label, value]) => {
          const row = CK.el('<div class="summary-row"><b></b></div>');
          row.prepend(label);
          row.lastElementChild.textContent = value;
          sum.appendChild(row);
        });
        if (r.kind === 'gift' && r.note) {
          const row = CK.el('<div class="summary-row summary-row--wrap"><b></b></div>');
          row.prepend(tx('cheque.note'));
          row.lastElementChild.textContent = r.note;
          sum.appendChild(row);
        }
        const say = (text, tone) => { line.textContent = text || ''; line.dataset.tone = tone || 'bad'; };
        let busy = false, gone = false;
        const ticketOf = (link) => ({ address: r.address, link, asset: r.asset || 'gram', units: r.units || '0', kind: r.kind, note: r.note, shown: r.asset ? infoOf(r) : 'gram', count: many ? many.n : 1 });
        const jettonSpec = r.jetton ? { jetton: { master: r.jetton.master, wallet: many ? null : r.jetton.wallet } } : {};
        const actions = $('.cq-actions', body), passBox = $('.sw-pass', body), passInput = $('.sw-pass-input', body);
        let passDone = null;
        passBox.addEventListener('submit', (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });
        function askPassword() {
          return new Promise((resolve) => {
            const others = [...actions.children].filter((el) => el !== passBox && !el.hidden);
            others.forEach((el) => { el.hidden = true; });
            passBox.hidden = false;
            passInput.value = '';
            passInput.focus({ preventScroll: true });
            passDone = (value) => {
              passDone = null;
              passInput.value = '';
              passBox.hidden = true;
              others.forEach((el) => { el.hidden = false; });
              resolve(value);
            };
          });
        }
        async function unlocked(fn) {
          for (;;) {
            let password;
            if (!isSample() && CK.wallet.status.method === 'password') {
              password = await askPassword();
              if (password === null || gone) throw Object.assign(new Error('closed'), { code: 'closed' });
            }
            try {
              return await fn({ wallet: r.wallet || undefined, ...(password ? { password } : {}) });
            } catch (err) {
              if (err.code !== 'wrong_password') throw err;
              say(tx('swapSheet.passwordWrong'));
            } finally {
              password = undefined;
            }
          }
        }
        const relink = () => (isSample() ? Promise.resolve(sampleLink()) : unlocked((o) => CK.wallet.cheque.relink({ address: r.address, nonce: r.nonce, ...(many ? { multi: true } : {}) }, o)));
        const errorText = (code) => {
          if (code === 'cheque_not_mine' || code === 'wallet_changed') return 'swapSheet.stopped';
          if (code === 'cheque_short') return 'cheque.shortRow';
          return (W().SIGN_ERRORS || {})[code] || 'swapSheet.tryAgain';
        };
        const guard = (fn) => () => {
          if (busy) return;
          busy = true;
          say('');
          fn().catch((err) => {
            if (err.code === 'closed' || CK.wallet.isRejection(err)) return say('');
            console.error('cheque:', err.code || err.message);
            CK.haptic.error();
            return say(tx(errorText(err.code)));
          }).finally(() => { busy = false; });
        };
        const shareBtn = $('.cq-share', body), copyBtn = $('.cq-copy', body), returnBtn = $('.cq-return', body);
        if (shareBtn) shareBtn.addEventListener('click', guard(() => relink().then((link) => shareTicket(ticketOf(link)))));
        if (copyBtn) copyBtn.addEventListener('click', guard(() => relink().then(copyLink)));
        if (returnBtn) returnBtn.addEventListener('click', guard(async () => {
          say(tx('cheque.returning'), 'note');
          if (isSample()) {
            await pause(900);
            r.state = sampleState('returned');
          } else if (many) {
            await CK.cheques.returnStored(r.address);
            const moved = (r.slots || []).filter((one) => one.state && one.state.seqno > 0 && (one.state.name === 'open' || (one.state.name === 'expired' && one.state.base === 'open')));
            if (moved.length) {
              const fresh = [];
              for (const one of moved.slice(0, 10)) fresh.push({ i: one.i, address: one.address, chain: await CK.cheques.state(one.address) });
              const signed = await unlocked((o) => CK.wallet.cheque.returnSlots({ nonce: r.nonce }, { ...o, ...jettonSpec, slots: fresh }));
              for (const one of signed) {
                if (one.boc) await CK.cheques.relay(one.address, one.boc).catch((err) => { if (err.code !== 'send_unsure') throw err; });
              }
            }
          } else if (short) {
            const top = await unlocked((o) => CK.wallet.cheque.topUpGas({ address: r.address, nonce: r.nonce }, o));
            await CK.wallet.cheque.sendTopUp(top).catch((err) => { if (err.code !== 'send_unsure') throw err; });
          } else {
            const state = await CK.cheques.state(r.address);
            let stored = false;
            if (storedReturnFits(state) && r.hasRefund) {
              stored = await CK.cheques.returnStored(r.address).then(() => true, (err) => {
                if (['no_refund', 'refund_stale', 'not_open', 'not_found'].includes(err.code)) return false;
                throw err;
              });
            }
            if (!stored) {
              const back = await unlocked((o) => CK.wallet.cheque.returnSigned({ address: r.address, nonce: r.nonce }, { ...o, ...jettonSpec, chain: state }));
              await CK.cheques.relay(r.address, back.boc, r.orphan || !r.asset ? back.publicKey : undefined).catch((err) => { if (err.code !== 'send_unsure') throw err; });
            }
          }
          CK.haptic.success();
          say(short ? '' : tx('cheque.returning'), 'note');
          if (changed) changed();
          setTimeout(() => { if (!flow.closing) flow.close(); }, short ? 0 : 1200);
        }));
        $('.cq-open', body).addEventListener('click', () => T.openLink(r.state && HEX_HASH.test(r.state.hash || '') ? `${EXPLORER}transaction/${r.state.hash}` : EXPLORER + T.friendlyAddress(r.address)));
        return () => {
          gone = true;
          if (passDone) passDone(null);
        };
      }
    }, null, SHEET_HEIGHT);
  }


  function openCreate(o) {
    if (CK.sheet.top) return null;
    if (!isSample() && (!T.wallet || T.wallet.readOnly)) return null;
    return W().openFlow(createStep(o || {}), null, SHEET_HEIGHT);
  }
  function readSend(text) {
    if (typeof text !== 'string' || text.length > 80) return null;
    const parts = text.split('.');
    const asset = parts.shift();
    if (asset !== 'gram' && asset !== 'usdt') return null;
    let gift = false, user = null;
    while (parts.length && (parts[parts.length - 1] === 'gift' || /^u-[A-Za-z0-9_]{4,32}$/.test(parts[parts.length - 1]))) {
      const p = parts.pop();
      if (p === 'gift') gift = true;
      else user = p.slice(2);
    }
    const amount = parts.join('.');
    if (!/^\d{1,12}(\.\d{1,9})?$/.test(amount)) return null;
    const units = T.toUnits(amount, ASSET[asset].decimals);
    return units > 0n ? { asset, units, gift, user } : null;
  }
  function openFromInline(text) {
    const want = readSend(text);
    if (!want) return;
    Promise.resolve(CK.wallet.ready).then(() => {
      if (want.user && !isSample()) {
        return CK.wallet.directory.resolve(want.user).then((found) => (found && found.found ? W().openWithdraw({ asset: want.asset, units: want.units, to: '@' + want.user }) : null), () => null)
          .then((opened) => { if (!opened) openCreate({ asset: want.asset, units: want.units, kind: want.gift ? 'gift' : 'cheque', inline: true }); });
      }
      openCreate({ asset: want.asset, units: want.units, kind: want.gift ? 'gift' : 'cheque', inline: true });
      return null;
    }).catch((err) => console.error(err));
  }

  const openOn = (wallet) => lastRows.filter((r) => r.wallet === wallet && r.state && !CK.cheques.FINAL.has(r.state.name)).length;
  function loadCount() {
    return loadRows().then((rows) => {
      lastRows = rows;
      setRows(rows);
      return openCount;
    });
  }

  window.DemoCheques = {
    createStep,
    openCreate,
    openClaim,
    openList,
    openFromInline,
    readSend,
    loadCount,
    onCount(fn) { countSubs.add(fn); return () => countSubs.delete(fn); },
    get openCount() { return openCount; },
    isCheque: (address) => known.has(address),
    openOn,
    isSample,
    figureOf,
    detailOf,
    storedReturnFits,
    startOf
  };
})();
