(function () {
  'use strict';
  const { icon, t: tx } = CK;
  const T = CK.ton;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);
  const W = () => window.DemoWallet;

  CK.i18n.add({
    'inv.row': ['Счета', 'Invoices', 'Рахунки', 'Шоттар'],
    'inv.title': ['Счёт', 'Invoice', 'Рахунок', 'Шот'],
    'inv.from': ['От {name}', 'From {name}', 'Від {name}', 'Кімнен: {name}'],
    'inv.new': ['Новый счёт', 'New invoice', 'Новий рахунок', 'Жаңа шот'],
    'inv.amount': ['Сумма в долларах', 'Amount in dollars', 'Сума в доларах', 'Сома долларда'],
    'inv.comment': ['Комментарий', 'Comment', 'Коментар', 'Түсініктеме'],
    'inv.commentPh': ['Комментарий', 'Comment', 'Коментар', 'Түсініктеме'],
    'inv.secret': ['Скрытое сообщение', 'Hidden message', 'Приховане повідомлення', 'Жасырын хабар'],
    'inv.secretPh': ['Только для оплатившего', 'Only for the payer', 'Лише для того, хто оплатив', 'Тек төлеушіге'],
    'inv.secretSet': ['Есть', 'Set', 'Є', 'Бар'],
    'inv.secretPhrase': ['Это секретная фраза? Не отправляйте', 'A secret phrase? Don’t send it', 'Це секретна фраза? Не надсилайте', 'Құпия сөз тіркесі ме? Жібермеңіз'],
    'inv.secretCheque': ['Ссылку на чек в сообщение класть нельзя', 'A cheque link cannot go in the message', 'Посилання на чек у повідомлення класти не можна', 'Хабарға чек сілтемесін қоюға болмайды'],
    'inv.secretBad': ['Сообщение до 200 знаков', 'Up to 200 characters', 'Повідомлення до 200 знаків', 'Хабар 200 таңбаға дейін'],
    'inv.secretFor': ['Скрытое сообщение к счёту', 'Hidden message of this invoice', 'Приховане повідомлення до рахунку', 'Шотқа жасырын хабар'],
    'inv.make': ['Выставить счёт', 'Create invoice', 'Виставити рахунок', 'Шот жасау'],
    'inv.share': ['Отправить в чат', 'Send to a chat', 'Надіслати в чат', 'Чатқа жіберу'],
    'inv.copy': ['Скопировать ссылку', 'Copy link', 'Скопіювати посилання', 'Сілтемені көшіру'],
    'inv.copied': ['Ссылка скопирована', 'Link copied', 'Посилання скопійовано', 'Сілтеме көшірілді'],
    'inv.cancel': ['Отменить счёт', 'Cancel invoice', 'Скасувати рахунок', 'Шоттан бас тарту'],
    'inv.cancelSure': ['Точно отменить?', 'Really cancel?', 'Точно скасувати?', 'Шынымен бас тартасыз ба?'],
    'inv.none': ['Счетов пока нет', 'No invoices yet', 'Рахунків поки немає', 'Шоттар әзірге жоқ'],
    'inv.stOpen': ['До {date}', 'Until {date}', 'До {date}', '{date} дейін'],
    'inv.stPaid': ['Оплачен', 'Paid', 'Оплачено', 'Төленді'],
    'inv.stPaidBy': ['Оплатил {who}', 'Paid by {who}', 'Оплатив {who}', 'Төлеген: {who}'],
    'inv.stExpired': ['Срок истёк', 'Expired', 'Термін минув', 'Мерзімі өтті'],
    'inv.stCancelled': ['Отменён', 'Cancelled', 'Скасовано', 'Бас тартылды'],
    'inv.stChecking': ['Проверяем оплату', 'Checking the payment', 'Перевіряємо оплату', 'Төлем тексерілуде'],
    'inv.youPay': ['Вы платите', 'You pay', 'Ви платите', 'Сіз төлейсіз'],
    'inv.rate': ['Курс до {time}', 'Rate until {time}', 'Курс до {time}', 'Бағам {time} дейін'],
    'inv.net': ['Комиссия сети', 'Network fee', 'Комісія мережі', 'Желі комиссиясы'],
    'inv.to': ['Получатель', 'Recipient', 'Одержувач', 'Алушы'],
    'inv.comm': ['Комментарий', 'Comment', 'Коментар', 'Түсініктеме'],
    'inv.until': ['Действует до', 'Valid until', 'Діє до', 'Жарамды мерзімі'],
    'inv.paidWith': ['Оплачено', 'Paid with', 'Оплачено', 'Төленді'],
    'inv.swipe': ['Оплатить', 'Pay', 'Оплатити', 'Төлеу'],
    'inv.paid': ['Оплачено', 'Paid', 'Оплачено', 'Төленді'],
    'inv.checking': ['Проверяем оплату', 'Checking the payment', 'Перевіряємо оплату', 'Төлем тексерілуде'],
    'inv.yours': ['Это ваш счёт', 'This is your invoice', 'Це ваш рахунок', 'Бұл сіздің шотыңыз'],
    'inv.expired': ['Срок счёта истёк', 'This invoice has expired', 'Термін рахунку минув', 'Шоттың мерзімі өтті'],
    'inv.cancelled': ['Счёт отменён', 'This invoice was cancelled', 'Рахунок скасовано', 'Шоттан бас тартылды'],
    'inv.notFound': ['Счёт не найден', 'Invoice not found', 'Рахунок не знайдено', 'Шот табылмады'],
    'inv.unverified': ['Адрес не прошёл проверку', 'The address failed the check', 'Адреса не пройшла перевірку', 'Мекенжай тексеруден өтпеді'],
    'inv.needWallet': ['Для оплаты нужен кошелёк', 'You need a wallet to pay', 'Для оплати потрібен гаманець', 'Төлеу үшін әмиян керек'],
    'inv.short': ['Не хватает {x}', '{x} short', 'Бракує {x}', '{x} жетпейді'],
    'inv.noRate': ['Курс GRAM сейчас недоступен', 'The GRAM rate is unavailable now', 'Курс GRAM зараз недоступний', 'GRAM бағамы қазір қолжетімсіз'],
    'inv.newRate': ['Курс обновлён', 'Rate updated', 'Курс оновлено', 'Бағам жаңартылды'],
    'inv.tooMany': ['Слишком много открытых счетов', 'Too many open invoices', 'Забагато відкритих рахунків', 'Ашық шот тым көп'],
    'inv.amountBad': ['Сумма от 0,1 до 10 000 $', 'From $0.1 to $10,000', 'Сума від 0,1 до 10 000 $', 'Сома 0,1-ден 10 000 $-ға дейін']
  });

  const SHEET_HEIGHT = 520;
  const EXPLORER = 'https://tonviewer.com/transaction/';
  const NATIVE = 'TON';
  const USDT = CK.chequeAudit.USDT;
  const ASSET = {
    usdt: { key: 'usdt', sym: 'USDT', decimals: 6, coin: () => D.byId.usdt },
    gram: { key: 'gram', sym: 'GRAM', decimals: 9, coin: () => D.byId.ton }
  };
  const NET_NANO = { gram: 1000000n, usdt: 20000000n };
  const NEEDS_NANO = { gram: 5000000n, usdt: 55000000n };
  const POLL_MS = [5000, 5000, 5000, 8000, 8000, 10000, 15000, 20000, 30000];
  const ID = /^[a-km-z2-9]{10}$/;
  const API_MS = 10000;

  const isSample = () => CK.market.mode !== 'live' || !CK.tg.inside;
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nowS = () => Math.floor(Date.now() / 1000);
  const usd = (cents) => {
    const v = Math.max(0, Math.floor(Number(cents) || 0));
    const text = W().unitsText(BigInt(v), 2) || '0';
    return CK.i18n.lang === 'en' ? `$${text}` : `${text} $`;
  };
  const FIAT_SIGN = { RUB: '₽', EUR: '€' };
  const fiatOf = (inv) => (inv && inv.fiat && FIAT_SIGN[inv.fiat.code] && Number.isSafeInteger(inv.fiat.cents) && inv.fiat.cents > 0 ? inv.fiat : null);
  const fiatText = (f) => {
    const text = W().unitsText(BigInt(f.cents), 2);
    return f.code === 'EUR' && CK.i18n.lang === 'en' ? `€${text}` : `${text} ${FIAT_SIGN[f.code]}`;
  };
  const headSum = (inv) => (fiatOf(inv) ? fiatText(fiatOf(inv)) : usd(inv.cents));
  const fullSum = (inv) => (fiatOf(inv) ? `${fiatText(fiatOf(inv))} (${usd(inv.cents)})` : usd(inv.cents));
  const looksLikePhrase = (text) => /(?:^|[^a-z])(?:[a-z]{3,8}[^a-z]+){11}[a-z]{3,8}(?:[^a-z]|$)/i.test(String(text || ''));
  const coin = (units, key) => `${W().unitsText(BigInt(units || 0), ASSET[key].decimals) || '0'} ${ASSET[key].sym}`;
  const nameOf = (from) => (from ? (from.name && from.username ? `${from.name} (@${from.username})` : from.username ? '@' + from.username : from.name || '') : '');
  const link = (id) => `https://t.me/DevpoolTrading_bot?startapp=inv_${id}`;
  const fail = (code) => Object.assign(new Error(code), { code });

  async function api(pathName, body) {
    const data = await CK.tg.whenInitData();
    if (!data) throw fail('tg_only');
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), API_MS);
    let json = null;
    try {
      const res = await fetch('api/' + pathName, {
        method: body ? 'POST' : 'GET',
        headers: body ? { Authorization: 'tma ' + data, 'Content-Type': 'application/json' } : { Authorization: 'tma ' + data },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: abort.signal
      });
      json = await res.json().catch(() => null);
    } catch (_) {
      throw fail('network');
    } finally {
      clearTimeout(timer);
    }
    if (json && json.ok === true) return json;
    throw fail(json && typeof json.error === 'string' ? json.error : 'network');
  }

  const SAMPLE_TO = '0:' + '7'.repeat(64);
  const sample = (id, cents, state, extra) => ({ id, cents, comment: null, from: { name: 'Alice', username: 'alice' }, creatorId: 1, to: SAMPLE_TO, proof: null, createdAt: nowS() - 3600, expiresAt: nowS() + 6 * 86400, state, checking: false, paid: null, paidBy: null, ...(extra || {}) });
  const SAMPLES = [
    sample('demo2demo2', 1000, 'open', { comment: 'За ужин' }),
    sample('demo3demo3', 2550, 'paid', { paid: { asset: 'usdt', units: '25500000', hash: 'a'.repeat(64), at: nowS() - 600 }, paidBy: { name: 'Bob', username: 'bob' } }),
    sample('demo4demo4', 500, 'expired', { createdAt: nowS() - 9 * 86400, expiresAt: nowS() - 2 * 86400 })
  ];

  function heldOf(rows) {
    const out = { gram: 0n, usdt: 0n, usdtWallet: null };
    (rows || []).forEach((r) => {
      if (r.id === NATIVE) out.gram = r.units;
      else if (r.id === USDT) {
        out.usdt = r.units;
        out.usdtWallet = r.wallet || null;
      }
    });
    return out;
  }


  function openPay(id, sampleMode) {
    if (CK.sheet.top || !(ID.test(id || '') || sampleMode)) return;
    W().openFlow(payStep(id, !!sampleMode), null, SHEET_HEIGHT);
  }
  function payStep(id, sampleMode) {
    return {
      title: tx('inv.title'),
      render(body, flow) {
        body.classList.add('sw-status', 'inv-sheet');
        body.innerHTML = `
          <div class="inv-head"><span class="inv-logo">${CK.tile('wallet', { tone: 'blue', size: 56 })}</span><b class="inv-amount"></b><span class="inv-from"></span><span class="inv-comment"></span></div>
          <div class="inv-assets" hidden></div>
          <div class="sw-rows summary inv-sum" hidden></div>
          <p class="w-note inv-note" hidden></p>
          <div class="inv-secret-box" hidden><span class="inv-secret-label">${tx('inv.secretFor')}</span><span class="inv-secret-text"></span></div>
          <div class="inv-actions"><button class="btn btn--tinted btn--wide press inv-share" type="button" hidden>${icon('share', { size: 20 })}<span>${tx('inv.share')}</span></button><button class="btn btn--tinted btn--wide press inv-explore" type="button" hidden>${icon('arrow-up-right', { size: 20 })}<span>${tx('cheque.explorer')}</span></button><button class="btn btn--tinted btn--wide press inv-retry" type="button" hidden>${tx('common.retry')}</button></div>`;
        const dock = CK.el(`<div class="sheet-dock sw-dock" hidden>
          <p class="sw-line" role="status"></p>
          <div class="tk-swipe"></div>
          <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
        </div>`);
        flow.sheet.el.appendChild(dock);
        const amountEl = $('.inv-amount', body), fromEl = $('.inv-from', body), commentEl = $('.inv-comment', body), assetsEl = $('.inv-assets', body), sum = $('.inv-sum', body), noteEl = $('.inv-note', body);
        const shareBtn = $('.inv-share', body), exploreBtn = $('.inv-explore', body), retryBtn = $('.inv-retry', body);
        const lineEl = $('.sw-line', dock), swipeHost = $('.tk-swipe', dock), passBox = $('.sw-pass', dock), passInput = $('.sw-pass-input', dock);
        const st = { inv: null, mine: false, pay: null, quote: null, rows: null, asset: 'usdt', sending: false, sent: false, trouble: null, view: 'loading', secret: null };
        const secretBox = $('.inv-secret-box', body);
        const takeSecret = (found) => {
          const text = found && !found.mine && found.invoice && found.invoice.state === 'paid' && typeof found.secret === 'string' ? Array.from(found.secret.replace(/[\p{Cc}\p{Cf}]/gu, '').trim()).slice(0, 200).join('') : '';
          if (text) st.secret = text;
        };
        let gone = false, passDone = null, pollTimer = 0;
        const swipe = CK.swipeConfirm(swipeHost, { tone: 'accent', label: tx('inv.swipe'), onConfirm: confirm, resetAfter: 60000, reportsOwnResult: true });
        let assetPick = null;

        const unitsOf = (key) => (key === 'usdt' ? BigInt(st.quote.usdt.units) : st.quote.gram ? BigInt(st.quote.gram.units) : 0n);
        function shortOf(key) {
          const h = heldOf(st.rows);
          const needs = NEEDS_NANO[key] + (key === 'gram' ? unitsOf('gram') : 0n);
          if (key === 'usdt' && h.usdt < unitsOf('usdt')) return coin(unitsOf('usdt') - h.usdt, 'usdt');
          if (h.gram < needs) return coin(needs - h.gram, 'gram');
          return null;
        }
        function say(text, tone) {
          noteEl.textContent = text || '';
          noteEl.hidden = !text;
          noteEl.dataset.tone = tone || 'note';
        }
        function setLine(text, tone) {
          if (lineEl.textContent !== text) lineEl.textContent = text;
          lineEl.dataset.tone = tone || 'bad';
        }
        function paintHead() {
          const inv = st.inv;
          amountEl.textContent = inv ? headSum(inv) : '';
          fromEl.textContent = inv && inv.from ? tx('inv.from', { name: nameOf(inv.from) }) : '';
          commentEl.textContent = inv && inv.comment ? inv.comment : '';
        }
        function paintSum() {
          sum.innerHTML = '';
          if (st.view !== 'pay' || !st.quote) {
            sum.hidden = true;
            return;
          }
          const key = st.asset;
          const rows = [[tx('inv.youPay'), coin(unitsOf(key), key)]];
          if (key === 'gram' && st.quote.gram) rows.push(['', tx('inv.rate', { time: CK.i18n.clock(st.quote.gram.until) })]);
          rows.push([tx('inv.net'), '≈ ' + coin(NET_NANO[key], 'gram')], [tx('inv.to'), T.shortAddress(st.pay.friendly)]);
          rows.forEach(([label, value]) => {
            const row = CK.el('<div class="summary-row"><b></b></div>');
            row.prepend(label);
            row.lastElementChild.textContent = value;
            sum.appendChild(row);
          });
          sum.hidden = false;
        }
        function paint() {
          if (gone) return;
          paintHead();
          const v = st.view;
          const paying = v === 'pay';
          dock.hidden = !paying;
          assetsEl.hidden = !paying;
          shareBtn.hidden = v !== 'mine';
          exploreBtn.hidden = !(v === 'paid' && st.inv && st.inv.paid && st.inv.paid.hash);
          secretBox.hidden = !(v === 'paid' && st.secret);
          if (!secretBox.hidden) $('.inv-secret-text', secretBox).textContent = st.secret;
          retryBtn.hidden = v !== 'error';
          const notes = {
            loading: '', mine: tx('inv.yours'), paid: tx('inv.paid'), expired: tx('inv.expired'), cancelled: tx('inv.cancelled'), notFound: tx('inv.notFound'),
            unverified: tx('inv.unverified'), noWallet: tx('inv.needWallet'), checking: tx('inv.checking'), error: tx('common.loadFail'), pay: ''
          };
          say(notes[v] || '', v === 'unverified' || v === 'error' || v === 'notFound' ? 'bad' : v === 'paid' ? 'up' : 'note');
          paintSum();
          if (!paying) return;
          let line = '';
          if (st.trouble) line = st.trouble;
          else if (st.asset === 'gram' && !st.quote.gram) line = tx('inv.noRate');
          else if (st.rows) {
            const short = shortOf(st.asset);
            if (short) line = tx('inv.short', { x: short });
          }
          setLine(line, st.sending && !st.trouble ? 'note' : 'bad');
          swipe.setDisabled(!!line || !st.rows || st.sending);
          swipe.update({ label: tx(!st.rows ? 'swap.waitBalance' : 'inv.swipe') });
        }
        function viewOf(inv, mine) {
          if (inv.state === 'paid') return 'paid';
          if (inv.state === 'expired') return 'expired';
          if (inv.state === 'cancelled') return 'cancelled';
          if (mine) return 'mine';
          if (st.sent || inv.checking) return 'checking';
          return null;
        }
        async function look() {
          st.view = 'loading';
          st.trouble = null;
          paint();
          if (sampleMode) {
            await pause(400);
            st.inv = SAMPLES[0];
            st.pay = { address: SAMPLE_TO, friendly: T.friendlyAddress(SAMPLE_TO) };
            st.quote = { usdt: { units: '10000000' }, gram: { units: '3125000000', until: Date.now() + 600000, price: 3.2 } };
            st.rows = [{ id: NATIVE, units: 12500000000n, decimals: 9, sym: 'GRAM' }, { id: USDT, units: 40000000n, decimals: 6, sym: 'USDT' }];
            st.view = 'pay';
            buildAssets();
            return paint();
          }
          let found;
          try {
            found = await api('invoices/lookup', { id });
          } catch (err) {
            st.view = err.code === 'not_found' ? 'notFound' : 'error';
            return paint();
          }
          if (gone) return undefined;
          st.inv = found.invoice;
          st.mine = !!found.mine;
          takeSecret(found);
          const settled = viewOf(st.inv, st.mine);
          if (settled) {
            st.view = settled;
            if (settled === 'checking') poll(0);
            return paint();
          }
          if (!T.wallet || T.wallet.readOnly) {
            st.view = 'noWallet';
            return paint();
          }
          try {
            st.pay = await CK.wallet.invoice.verify(st.inv);
          } catch (err) {
            console.error('invoice:', err.code || err.message);
            st.view = 'unverified';
            return paint();
          }
          try {
            st.quote = (await api('invoices/quote', { id })).quote;
          } catch (err) {
            st.view = err.code === 'own_invoice' ? 'mine' : err.code === 'not_open' ? 'expired' : 'error';
            return paint();
          }
          st.view = 'pay';
          buildAssets();
          paint();
          W().loadRows().then((rows) => {
            if (gone) return;
            st.rows = rows;
            const h = heldOf(rows);
            if (h.usdt < unitsOf('usdt') && st.quote.gram && !shortOf('gram')) pickAsset('gram');
            paint();
          }, (err) => {
            console.error(err);
            if (!gone) { st.trouble = tx('swap.loadFail'); paint(); }
          });
          return undefined;
        }
        function pickAsset(key) {
          st.asset = key;
          st.trouble = null;
          if (assetPick && assetPick.set) assetPick.set(key);
        }
        function buildAssets() {
          if (assetPick) return;
          assetPick = CK.segmented(assetsEl, {
            label: tx('inv.youPay'), value: st.asset, size: 'small',
            items: [{ value: 'usdt', label: 'USDT' }, { value: 'gram', label: 'GRAM' }],
            onChange(v) { st.asset = v; st.trouble = null; CK.haptic.selection(); paint(); }
          });
        }
        function poll(n) {
          clearTimeout(pollTimer);
          if (gone || n >= POLL_MS.length * 3) return;
          pollTimer = setTimeout(() => {
            api('invoices/lookup', { id }).then((found) => {
              if (gone) return;
              st.inv = found.invoice;
              takeSecret(found);
              if (st.inv.state === 'paid') {
                st.view = 'paid';
                CK.haptic.success();
                return paint();
              }
              return poll(n + 1);
            }, () => poll(n + 1));
          }, POLL_MS[Math.min(n, POLL_MS.length - 1)]);
        }
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
          body.classList.remove('is-busy');
          paint();
          return false;
        }
        async function stateNow() {
          try {
            const found = await api('invoices/lookup', { id });
            if (found.invoice.state !== 'open') {
              st.inv = found.invoice;
              takeSecret(found);
            }
            return found.invoice.state;
          } catch (_) {
            return null;
          }
        }
        function confirm() {
          if (st.sending || st.view !== 'pay' || !st.rows || shortOf(st.asset)) return false;
          if (sampleMode) {
            CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
            return false;
          }
          st.sending = true;
          st.trouble = null;
          body.classList.add('is-busy');
          setLine(tx('swap.signing'), 'note');
          return signAndSend();
        }
        async function signAndSend() {
          const key = st.asset;
          if (key === 'gram' && (!st.quote.gram || st.quote.gram.until < Date.now() + 15000)) {
            try {
              const was = st.quote.gram ? st.quote.gram.units : null;
              st.quote = (await api('invoices/quote', { id })).quote;
              if (!st.quote.gram || st.quote.gram.units !== was) return release(tx('inv.newRate'));
            } catch (_) {
              return release(tx('swapSheet.tryAgain'));
            }
          }
          const units = unitsOf(key);
          const owner = T.wallet && T.wallet.address;
          let message;
          try {
            if (!(await CK.wallet.canSign())) return release(tx('swapSheet.noSign'));
            const own = await CK.wallet.depositAddress();
            if (!own.verified || own.address !== owner || owner === st.pay.address) return release(tx('swapSheet.stopped'));
            if (key === 'gram') message = { to: st.pay.friendly, amount: units.toString(), comment: 'inv_' + id };
            else {
              const jettonWallet = CK.swapAudit.jettonWalletOf(window.TonWallet, USDT, owner);
              const listed = heldOf(st.rows).usdtWallet;
              if (listed && T.rawAddress(listed) !== jettonWallet) return release(tx('swapSheet.stopped'));
              message = { to: T.friendlyAddress(jettonWallet), recipient: st.pay.friendly, units: units.toString(), comment: 'inv_' + id };
            }
          } catch (err) {
            console.error(err);
            return release(tx('swapSheet.tryAgain'));
          }
          if (flow.closing) return false;
          const usePassword = CK.wallet.status.method === 'password';
          let signed, password;
          for (;;) {
            if (usePassword) {
              password = await askPassword();
              if (password === null || flow.closing) return release();
            }
            try {
              const now = await stateNow();
              if (!now || flow.closing) return release(now ? undefined : tx('swapSheet.tryAgain'));
              if (now !== 'open') {
                st.view = viewOf(st.inv, st.mine) || 'error';
                CK.haptic.error();
                return release();
              }
              signed = await CK.wallet.unlockAndSign([message], { ...(password ? { password } : {}), wallet: owner });
              break;
            } catch (err) {
              if (err.code === 'wrong_password') { st.trouble = tx('swapSheet.passwordWrong'); continue; }
              if (CK.wallet.protectRefused(err)) return release(tx('wallet.needProtect'));
              if (CK.wallet.isRejection(err)) return release();
              console.error(err);
              return release(tx((W().SIGN_ERRORS || {})[err.code] || 'swapSheet.tryAgain'));
            } finally {
              password = undefined;
            }
          }
          await Promise.race([api('invoices/paying', { id, asset: key, boc: signed.boc }).catch(() => null), pause(4000)]);
          CK.haptic.success();
          st.sent = true;
          st.sending = false;
          st.view = 'checking';
          body.classList.remove('is-busy');
          paint();
          CK.wallet.broadcast(signed.boc).then(() => poll(0), (err) => {
            console.error(err);
            if (CK.wallet.neverSent(err)) {
              st.sent = false;
              st.view = 'pay';
              st.trouble = tx('swapSheet.tryAgain');
              paint();
            } else poll(0);
          });
          return undefined;
        }
        shareBtn.addEventListener('click', () => shareInvoice(st.inv));
        exploreBtn.addEventListener('click', () => openTx(st.inv.paid.hash));
        retryBtn.addEventListener('click', () => look());
        look();
        return () => {
          gone = true;
          clearTimeout(pollTimer);
          if (passDone) passDone(null);
        };
      }
    };
  }

  function openTx(hash) {
    if (!/^[0-9a-f]{64}$/i.test(hash || '')) return;
    try { CK.tg.app.openLink(EXPLORER + hash); } catch (_) { window.open(EXPLORER + hash, '_blank', 'noopener'); }
  }
  function shareInvoice(inv) {
    if (!inv) return;
    try {
      if (CK.tg.inside && CK.tg.app && typeof CK.tg.app.switchInlineQuery === 'function') {
        CK.tg.app.switchInlineQuery('inv_' + inv.id, ['users', 'groups', 'channels']);
        return;
      }
    } catch (_) { }
    CK.copyText(link(inv.id)).then((ok) => CK.toast(tx(ok ? 'inv.copied' : 'common.copyFail'), ok ? { icon: 'check-circle', tone: 'up' } : { icon: 'warning', tone: 'down' }));
  }


  function openCreate(onMade) {
    if (CK.sheet.top) return;
    W().openFlow(createStep(onMade), null, SHEET_HEIGHT);
  }
  function createStep(onMade) {
    return {
      title: tx('inv.new'),
      render(body, flow) {
        body.classList.add('inv-sheet', 'inv-create');
        body.innerHTML = `
          <input class="inv-field-input inv-usd" inputmode="decimal" autocomplete="off" placeholder="0 $" maxlength="9" aria-label="${tx('inv.amount')}">
          <input class="inv-field-input inv-text" maxlength="64" autocomplete="off" enterkeyhint="done" placeholder="${tx('inv.commentPh')}" aria-label="${tx('inv.comment')}">
          <button class="w-tool inv-secret-add press" type="button">${icon('plus', { size: 16 })}<span>${tx('inv.secret')}</span></button>
          <input class="inv-field-input inv-secret" maxlength="200" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('inv.secretPh')}" aria-label="${tx('inv.secret')}" hidden>
          <p class="sw-line inv-line" role="status"></p>
          <div class="inv-actions">
            <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
            <button class="btn btn--wide press inv-make" type="button">${tx('inv.make')}</button>
          </div>`;
        const amount = $('.inv-usd', body), comment = $('.inv-text', body), secret = $('.inv-secret', body), line = $('.inv-line', body), make = $('.inv-make', body), passBox = $('.sw-pass', body), passInput = $('.sw-pass-input', body);
        const secretAdd = $('.inv-secret-add', body);
        secretAdd.addEventListener('click', () => {
          CK.haptic.selection();
          secretAdd.hidden = true;
          secret.hidden = false;
          secret.focus({ preventScroll: true });
        });
        let busy = false, passDone = null;
        const centsOf = () => {
          const m = /^(\d{1,5})(?:[.,](\d{1,2}))?$/.exec(amount.value.trim());
          if (!m) return null;
          const cents = Number(m[1]) * 100 + Number((m[2] || '').padEnd(2, '0'));
          return cents >= 10 && cents <= 1000000 ? cents : null;
        };
        const sayLine = (text, tone) => { line.textContent = text || ''; line.dataset.tone = tone || 'bad'; };
        amount.addEventListener('input', () => sayLine(''));
        passBox.addEventListener('submit', (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });
        const askPassword = () => new Promise((resolve) => {
          make.hidden = true;
          passBox.hidden = false;
          passInput.focus({ preventScroll: true });
          passDone = (value) => { passDone = null; passInput.value = ''; passBox.hidden = true; make.hidden = false; resolve(value); };
        });
        async function connect() {
          let password;
          for (;;) {
            try {
              await CK.wallet.invoice.publish({ ...(password ? { password } : {}), wallet: T.wallet && T.wallet.address });
              return true;
            } catch (err) {
              if (err.code === 'password_needed' || err.code === 'wrong_password') {
                if (err.code === 'wrong_password') sayLine(tx('swapSheet.passwordWrong'));
                password = await askPassword();
                if (!password) return false;
                continue;
              }
              if (CK.wallet.isRejection(err)) return false;
              throw err;
            }
          }
        }
        async function submit() {
          if (busy) return;
          const cents = centsOf();
          if (!cents) return sayLine(tx('inv.amountBad'));
          const hidden = secret.value.replace(/[\p{C}]/gu, ' ').trim();
          if (looksLikePhrase(hidden)) return sayLine(tx('inv.secretPhrase'));
          if (Array.from(hidden).length > 200) return sayLine(tx('inv.secretBad'));
          if (isSample()) return CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
          busy = true;
          make.disabled = true;
          sayLine('');
          try {
            let made;
            for (let attempt = 0; ; attempt += 1) {
              try {
                made = await api('invoices', { cents, comment: comment.value.trim() || null, ...(hidden ? { secret: hidden } : {}) });
                break;
              } catch (err) {
                if (err.code !== 'no_wallet' || attempt > 0) throw err;
                if (!(await connect())) return undefined;
              }
            }
            CK.haptic.success();
            flow.close();
            if (onMade) onMade(made.invoice);
            setTimeout(() => shareInvoice(made.invoice), 350);
          } catch (err) {
            console.error('invoice:', err.code || err.message);
            sayLine(tx({ too_many: 'inv.tooMany', bad_amount: 'inv.amountBad', secret_phrase: 'inv.secretPhrase', cheque_key: 'inv.secretCheque', bad_secret: 'inv.secretBad' }[err.code] || 'swapSheet.tryAgain'));
          } finally {
            busy = false;
            make.disabled = false;
          }
          return undefined;
        }
        make.addEventListener('click', submit);
        amount.addEventListener('keydown', (e) => { if (e.key === 'Enter') comment.focus(); });
        comment.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (secret.hidden) comment.blur(); else secret.focus(); } });
        secret.addEventListener('input', () => sayLine(''));
        secret.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
        setTimeout(() => amount.focus({ preventScroll: true }), 300);
        return () => { if (passDone) passDone(null); };
      }
    };
  }


  function rowSub(r) {
    if (r.state === 'paid') return r.paidBy ? tx('inv.stPaidBy', { who: r.paidBy.username ? '@' + r.paidBy.username : r.paidBy.name }) : tx('inv.stPaid');
    if (r.state === 'expired') return tx('inv.stExpired');
    if (r.state === 'cancelled') return tx('inv.stCancelled');
    if (r.checking) return tx('inv.stChecking');
    return tx('inv.stOpen', { date: CK.i18n.dayShort(r.expiresAt * 1000) });
  }
  function loadMine() {
    if (isSample()) return pause(300).then(() => ({ invoices: SAMPLES.slice(), wallet: { address: SAMPLE_TO, kind: 'inv' } }));
    return api('invoices/mine');
  }
  function openList(from, stack) {
    if (CK.sheet.top) return;
    let newBtn = null;
    const screen = CK.screen({
      title: () => tx('inv.row'),
      actions: [{ icon: 'plus', label: () => tx('inv.new'), className: 'inv-new', onClick: () => openCreate(() => load()), mount: (b) => { newBtn = b; } }]
    });
    screen.el.classList.add('no-tabbar');
    stack.push(screen, { returnFocus: from });
    const body = screen.body;
    body.innerHTML = '<div class="inv-list"><div class="group list--free"><div class="wallet-skel"></div><div class="wallet-skel"></div></div></div>';
    const list = $('.inv-list', body);
    let rows = [];
    const canCreate = () => isSample() || (!!T.wallet && !T.wallet.readOnly);
    newBtn.hidden = !canCreate();
    CK.wallet.ready.catch(() => null).then(() => { newBtn.hidden = !canCreate(); });
    function rowHtml(r, i) {
      return `<button class="cell press-row inv-row" type="button" data-i="${i}" data-state="${CK.esc(r.state)}">${CK.tile('wallet', { tone: r.state === 'paid' ? 'green' : 'blue', size: 40 })}<span class="cell-main"><b class="inv-row-amount">${CK.esc(headSum(r) + (r.comment ? ' · ' + r.comment : ''))}</b><span class="inv-row-sub">${CK.esc(rowSub(r))}</span></span></button>`;
    }
    function paint() {
      if (!rows.length) {
        list.innerHTML = CK.emptyState({ icon: 'doc', tone: 'teal', title: tx('inv.none'), className: 'w-empty' });
        return;
      }
      const open = rows.map((r, i) => [r, i]).filter(([r]) => r.state === 'open');
      const done = rows.map((r, i) => [r, i]).filter(([r]) => r.state !== 'open');
      list.innerHTML = [open, done].filter((part) => part.length).map((part) => `<div class="group list--free">${part.map(([r, i]) => rowHtml(r, i)).join('')}</div>`).join('');
    }
    function load() {
      loadMine().then((got) => {
        rows = got.invoices || [];
        paint();
      }, (err) => {
        console.error('invoices:', err.code || err.message);
        list.innerHTML = CK.emptyState({ icon: 'warning', title: tx('common.loadFail'), className: 'w-empty', actions: `<button class="btn btn--small btn--tinted press w-retry" type="button">${tx('common.retry')}</button>` });
      });
    }
    list.addEventListener('click', (e) => {
      if (e.target.closest('.w-retry')) return load();
      const row = e.target.closest('[data-i]');
      if (!row) return undefined;
      CK.haptic.selection();
      return openDetail(rows[Number(row.dataset.i)], load);
    });
    CK.i18n.bind(screen.el, () => paint());
    load();
  }

  function openDetail(r, changed) {
    if (CK.sheet.top || !r) return;
    W().openFlow({
      title: tx('inv.title'),
      render(body, flow) {
        body.classList.add('sw-status', 'inv-sheet', 'inv-done');
        const open = r.state === 'open';
        body.innerHTML = `
          <div class="sw-rows summary inv-sum"></div>
          <p class="sw-line inv-line" role="status"></p>
          <div class="inv-actions">
            ${open ? `<div class="inv-actions-row"><button class="btn btn--wide press inv-share" type="button">${icon('share', { size: 20 })}<span>${tx('inv.share')}</span></button><button class="btn btn--tinted press inv-copy" type="button" aria-label="${tx('inv.copy')}" title="${tx('inv.copy')}">${icon('copy', { size: 22 })}</button></div><button class="inv-cancel inv-link--danger press" type="button">${tx('inv.cancel')}</button>` : ''}
            ${r.paid && r.paid.hash ? `<button class="btn btn--tinted btn--wide press inv-explore" type="button">${icon('arrow-up-right', { size: 20 })}<span>${tx('cheque.explorer')}</span></button>` : ''}
          </div>`;
        const sum = $('.inv-sum', body), line = $('.inv-line', body);
        const lines = [[tx('common.amount'), fullSum(r)]];
        if (r.comment) lines.push([tx('inv.comm'), r.comment]);
        if (r.hasSecret === true) lines.push([tx('inv.secret'), tx('inv.secretSet')]);
        if (open) lines.push([tx('inv.until'), CK.i18n.dayMonthYear(r.expiresAt * 1000)]);
        else lines.push([tx('walletFlow.status'), rowSub(r)]);
        if (r.paid) lines.push([tx('inv.paidWith'), coin(r.paid.units, r.paid.asset === 'usdt' ? 'usdt' : 'gram')]);
        lines.forEach(([label, value]) => {
          const row = CK.el(`<div class="summary-row${label === tx('inv.comm') ? ' summary-row--wrap' : ''}"><b></b></div>`);
          row.prepend(label);
          row.lastElementChild.textContent = value;
          sum.appendChild(row);
        });
        const on = (sel, fn) => { const el = $(sel, body); if (el) el.addEventListener('click', fn); };
        on('.inv-share', () => shareInvoice(r));
        on('.inv-copy', () => CK.copyText(link(r.id)).then((ok) => CK.toast(tx(ok ? 'inv.copied' : 'common.copyFail'), ok ? { icon: 'check-circle', tone: 'up' } : { icon: 'warning', tone: 'down' })));
        on('.inv-explore', () => openTx(r.paid.hash));
        let busy = false;
        const CANCEL_ARM_MS = 4000;
        let armed = 0;
        on('.inv-cancel', (e) => {
          if (busy || isSample()) return;
          const btn = e.currentTarget;
          if (!armed) {
            CK.haptic.light();
            btn.textContent = tx('inv.cancelSure');
            btn.classList.add('is-armed');
            armed = setTimeout(() => {
              armed = 0;
              btn.textContent = tx('inv.cancel');
              btn.classList.remove('is-armed');
            }, CANCEL_ARM_MS);
            return;
          }
          clearTimeout(armed);
          armed = 0;
          busy = true;
          api('invoices/cancel', { id: r.id }).then(() => {
            CK.haptic.success();
            flow.close();
            if (changed) changed();
          }, (err) => {
            console.error('invoice:', err.code || err.message);
            line.textContent = tx('swapSheet.tryAgain');
            line.dataset.tone = 'bad';
          }).finally(() => { busy = false; });
        });
      }
    }, null, SHEET_HEIGHT);
  }

  const codeOf = (text) => {
    const m = /^inv_([a-km-z2-9]{10})$/.exec(String(text || ''));
    return m ? m[1] : null;
  };

  window.DemoInvoices = { openPay, openCreate, openList, codeOf, isSample, openDetail, fullSum, looksLikePhrase };
})();
