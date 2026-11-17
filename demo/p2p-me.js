(function () {
  'use strict';
  const Parts = window.DemoP2PParts = window.DemoP2PParts || {};

  const TEXTS = {
    myAds: ['Объявления', 'Ads', 'Оголошення', 'Хабарландырулар'],
    arbiterTag: ['Арбитр', 'Arbiter', 'Арбітр', 'Арбитр'],
    closedTag: ['Доступ закрыт', 'Access closed', 'Доступ закрито', 'Қолжетімсіз'],
    rateFirstLong: ['Оцените прошлую сделку', 'Rate your last deal', 'Оцініть минулу угоду', 'Өткен мәмілені бағалаңыз'],
    newShort: ['Новое', 'New', 'Нове', 'Жаңа'],
    firstAd: ['Создайте первое объявление', 'Make your first ad', 'Створіть перше оголошення', 'Алғашқы хабарландыруды жасаңыз'],
    noAdsYet: ['Объявлений пока нет', 'No ads yet', 'Оголошень поки немає', 'Әзірге хабарландыру жоқ'],
    noMethodsYet: ['Реквизитов пока нет', 'No payment details yet', 'Реквізитів поки немає', 'Әзірге деректеме жоқ'],
    showInList: ['Показывать в списке', 'Show in the list', 'Показувати в списку', 'Тізімде көрсету'],
    fundGo: ['Внести залог', 'Deposit', 'Внести заставу', 'Кепіл салу'],
    fundOnWay: ['Залог в пути', 'Deposit on its way', 'Застава в дорозі', 'Кепіл жолда'],
    leftSell: ['Осталось {coins}', '{coins} left', 'Лишилось {coins}', '{coins} қалды'],
    leftBuy: ['Куплю {coins}', 'Buying {coins}', 'Куплю {coins}', '{coins} сатып аламын'],
    leftFunding: ['Ждёт залог', 'Waiting for the lock', 'Чекає заставу', 'Кепіл күтуде'],
    hiddenLine: ['Скрыто', 'Hidden', 'Приховано', 'Жасырын'],
    pausedNote: ['P2P на паузе. Открытые сделки можно завершить, а монеты из залога вернуть.', 'P2P is paused. You can finish open deals and take your coins back from escrow.', 'P2P на паузі. Відкриті угоди можна завершити, а монети із застави повернути.', 'P2P уақытша тоқтатылды. Ашық мәмілелерді аяқтап, кепілдегі монеталарды қайтара аласыз.'],
    hiddenLineBuy: ['Скрыто', 'Hidden', 'Приховано', 'Жасырын'],
    draftBack: ['Черновик', 'Draft', 'Чернетка', 'Жоба'],
    draftReset: ['Начать заново', 'Start over', 'Почати заново', 'Қайта бастау'],
    limitLine: ['{min}–{max} ₽', '{min}–{max} ₽', '{min}–{max} ₽', '{min}–{max} ₽'],
    fromPh: ['От', 'From', 'Від', 'Бастап'],
    toPh: ['До', 'To', 'До', 'Дейін'],
    enterPrice: ['Введите цену', 'Enter the price', 'Введіть ціну', 'Бағаны енгізіңіз'],
    detailsNote: ['Видят только покупатели', 'Only your buyers see it', 'Бачать лише покупці', 'Тек сатып алушылар көреді'],
    delDetails: ['Удалить реквизиты', 'Delete the details', 'Видалити реквізити', 'Деректемені жою'],
    delDetailsQ: ['Удалить? Объявления только с этими реквизитами встанут на паузу.', 'Delete? Ads with only these details get paused.', 'Видалити? Оголошення лише з цими реквізитами стануть на паузу.', 'Жоясыз ба? Тек осы деректеме бар хабарландырулар кідіртіледі.'],
    way: ['Способ', 'Method', 'Спосіб', 'Тәсіл'],
    number: ['Номер', 'Number', 'Номер', 'Нөмір'],
    newDetails: ['Новые реквизиты', 'New payment details', 'Нові реквізити', 'Жаңа деректеме'],
    holderLabel: ['Имя как в банке', 'Name as in the bank', 'Ім\'я як у банку', 'Банктегідей аты'],
    holderPh: ['Иван П.', 'Ivan P.', 'Іван П.', 'Иван П.'],
    arbitrage: ['Арбитраж', 'Arbitration', 'Арбітраж', 'Арбитраж'],
    haltedShort: ['Выплаты остановлены', 'Payouts halted', 'Виплати зупинено', 'Төлемдер тоқтады'],
    howT: ['Как работает P2P', 'How P2P works', 'Як працює P2P', 'P2P қалай жұмыс істейді'],
    how1: ['Продавец вносит монеты в залог на кошелёк площадки.', 'The seller locks the coins on the platform wallet.', 'Продавець вносить монети в заставу на гаманець майданчика.', 'Сатушы монеталарды алаң әмиянына кепілге салады.'],
    how2: ['Покупатель переводит рубли по реквизитам продавца и прикладывает чек.', 'The buyer sends roubles to the seller\'s details and attaches a receipt.', 'Покупець переказує рублі за реквізитами продавця й додає чек.', 'Сатып алушы сатушының деректемелеріне рубль аударып, чек тіркейді.'],
    how3: ['Продавец проверяет поступление и отпускает монеты, покупатель получает их на свой кошелёк.', 'The seller checks the money and releases the coins to the buyer\'s wallet.', 'Продавець перевіряє надходження й відпускає монети, покупець отримує їх на свій гаманець.', 'Сатушы түскен ақшаны тексеріп, монеталарды босатады, сатып алушы оларды өз әмиянына алады.'],
    how4: ['Если что-то пошло не так, любая сторона открывает спор, и решение принимает арбитр.', 'If something goes wrong, either side opens a dispute and an arbiter decides.', 'Якщо щось пішло не так, будь-яка сторона відкриває спір, і рішення ухвалює арбітр.', 'Бірдеңе дұрыс болмаса, кез келген тарап дау ашады, шешімді арбитр қабылдайды.'],
    stepOf: ['{n}/4 · {name}', '{n}/4 · {name}', '{n}/4 · {name}', '{n}/4 · {name}'],
    step1: ['Тип и цена', 'Type and price', 'Тип і ціна', 'Түрі мен бағасы'],
    step2: ['Объём и лимиты', 'Volume and limits', 'Обсяг і ліміти', 'Көлемі мен лимиттері'],
    step3: ['Оплата и условия', 'Payment and terms', 'Оплата й умови', 'Төлем мен шарттар'],
    step4: ['Проверка', 'Review', 'Перевірка', 'Тексеру'],
    priceType: ['Цена', 'Price', 'Ціна', 'Баға'],
    priceLabel: ['Цена за 1 {sym}', 'Price per 1 {sym}', 'Ціна за 1 {sym}', '1 {sym} бағасы'],
    pctLabel: ['Процент к рынку', 'Percent from market', 'Відсоток до ринку', 'Нарыққа пайыз'],
    marketNow: ['Рынок ≈ {m} · ваша цена {p}', 'Market ≈ {m} · your price {p}', 'Ринок ≈ {m} · ваша ціна {p}', 'Нарық ≈ {m} · сіздің бағаңыз {p}'],
    pctOf: ['{pct}\u00a0%', '{pct}%', '{pct}\u00a0%', '{pct}\u00a0%'],
    marketPct: ['Рынок ≈ {m} · {pct}\u00a0% к рынку', 'Market ≈ {m} · {pct}% vs market', 'Ринок ≈ {m} · {pct}\u00a0% до ринку', 'Нарық ≈ {m} · нарыққа {pct}\u00a0%'],
    volLabel: ['Объём, {sym}', 'Volume, {sym}', 'Обсяг, {sym}', 'Көлем, {sym}'],
    volHintSell: ['Уйдёт в залог', 'Goes to escrow', 'Піде в заставу', 'Кепілге кетеді'],
    dealLimit: ['Лимит одной сделки', 'Limit of one deal', 'Ліміт однієї угоди', 'Бір мәміле лимиті'],
    fromRub: ['От, ₽', 'From, ₽', 'Від, ₽', 'Бастап, ₽'],
    toRub: ['До, ₽', 'To, ₽', 'До, ₽', 'Дейін, ₽'],
    minOverMax: ['Нижний лимит больше верхнего', 'The lower limit is above the upper one', 'Нижній ліміт більший за верхній', 'Төменгі лимит жоғарғысынан үлкен'],
    payBuyerWhere: ['Куда платить покупателю', 'Where the buyer pays', 'Куди платити покупцю', 'Сатып алушы қайда төлейді'],
    youPayHow: ['Как вы платите', 'How you pay', 'Як ви платите', 'Қалай төлейсіз'],
    max5: ['Можно выбрать до 5 способов', 'You can pick up to 5', 'Можна обрати до 5 способів', '5 тәсілге дейін таңдауға болады'],
    termsForBuyer: ['Условия для покупателя', 'Terms for the buyer', 'Умови для покупця', 'Сатып алушыға шарттар'],
    termsForSeller: ['Условия для продавца', 'Terms for the seller', 'Умови для продавця', 'Сатушыға шарттар'],
    yesWord: ['Да', 'Yes', 'Так', 'Иә'],
    noWord: ['Нет', 'No', 'Ні', 'Жоқ'],
    side: ['Тип', 'Type', 'Тип', 'Түрі'],
    nextEscrow: ['Залог ≈ {coins}', 'Escrow ≈ {coins}', 'Застава ≈ {coins}', 'Кепіл ≈ {coins}'],
    saveAndFund: ['Сохранить и внести залог', 'Save and deposit', 'Зберегти й внести заставу', 'Сақтап, кепіл салу'],
    closeAdShort: ['Закрыть объявление', 'Close the ad', 'Закрити оголошення', 'Хабарландыруды жабу'],
    closeAdQ: ['Закрыть объявление?', 'Close the ad?', 'Закрити оголошення?', 'Хабарландыруды жабасыз ба?'],
    closeAdQSell: ['Остаток монет вернётся вам', 'The coins left come back to you', 'Решта монет повернеться вам', 'Қалған монеталар сізге қайтады'],
    deleteAd: ['Удалить объявление', 'Delete the ad', 'Видалити оголошення', 'Хабарландыруды жою'],
    deleteAdQ: ['Удалить объявление?', 'Delete the ad?', 'Видалити оголошення?', 'Хабарландыруды жоясыз ба?'],
    deleteAdBack: ['Удалить и вернуть монеты', 'Delete and get the coins back', 'Видалити й повернути монети', 'Жою және монеталарды қайтару'],
    deleted: ['Объявление удалено', 'The ad is deleted', 'Оголошення видалено', 'Хабарландыру жойылды'],
    sectionHas: ['У вас уже есть «{what}»', 'You already have «{what}»', 'У вас уже є «{what}»', 'Сізде «{what}» бар'],
    openIt: ['Изменить его', 'Edit it', 'Змінити його', 'Оны өзгерту'],
    fundT: ['Залог объявления', 'The ad\'s deposit', 'Застава оголошення', 'Хабарландыру кепілі'],
    meFail: ['Не удалось загрузить', 'It did not load', 'Не вдалося завантажити', 'Жүктелмеді'],
    arbFail: ['Не удалось загрузить споры', 'The disputes did not load', 'Не вдалося завантажити спори', 'Даулар жүктелмеді'],
    chatN: ['Чат {n}', 'Chat {n}', 'Чат {n}', 'Чат {n}'],
    sellerName: ['Продавец {name}', 'Seller {name}', 'Продавець {name}', 'Сатушы {name}'],
    buyerName: ['Покупатель {name}', 'Buyer {name}', 'Покупець {name}', 'Сатып алушы {name}'],
    checksTab: ['Чеки', 'Receipts', 'Чеки', 'Чектер'],
    g_review: ['Автозакрытия: проверьте', 'Automatic closes to review', 'Автозакриття: перевірте', 'Автожабылулар: тексеріңіз'],
    g_grace: ['Ждут нового чека', 'Waiting for a new receipt', 'Чекають нового чека', 'Жаңа чек күтуде'],
    g_appeals: ['Обжалования', 'Appeals', 'Оскарження', 'Шағымдар'],
    g_flagged: ['Есть замечания', 'Has remarks', 'Є зауваження', 'Ескертулер бар'],
    g_auto: ['Закрыты или переданы в спор автоматически', 'Closed or sent to a dispute automatically', 'Закриті або передані в спір автоматично', 'Автоматты түрде жабылған не дауға берілген'],
    g_shadow: ['Наблюдение: было бы отклонено', 'Watching: would be rejected', 'Спостереження: було б відхилено', 'Бақылау: қабылданбас еді'],
    modeLine: ['Автопроверка: {m}', 'Receipt check: {m}', 'Автоперевірка: {m}', 'Автотексеру: {m}'],
    md_off: ['выключена', 'off', 'вимкнено', 'өшірулі'],
    md_shadow: ['наблюдение', 'watching', 'спостереження', 'бақылау'],
    md_report: ['только отчёт', 'report only', 'лише звіт', 'тек есеп'],
    md_enforce: ['автоотклонение', 'auto-reject', 'автовідхилення', 'автоқабылдамау'],
    todayLine: ['Отклонено сегодня', 'Rejected today', 'Відхилено сьогодні', 'Бүгін қабылданбағаны'],
    profLine: ['Отклонения по профилям банков', 'Rejections by bank profile', 'Відхилення за профілями банків', 'Банк профильдері бойынша'],
    readerOff: ['Фото чеков проверяйте сами: чтение текста выключено.', 'Check receipt photos yourself: text reading is off.', 'Фото чеків перевіряйте самі: читання тексту вимкнено.', 'Чек фотоларын өзіңіз тексеріңіз: мәтін оқу өшірулі.'],
    modeOff: ['Выключить автоотклонение', 'Turn off auto-reject', 'Вимкнути автовідхилення', 'Автоқабылдамауды өшіру'],
    modeBack: ['Вернуть автоотклонение', 'Turn auto-reject back on', 'Повернути автовідхилення', 'Автоқабылдамауды қайтару'],
    modeOffQ: ['Чеки будут проверяться без отклонений и закрытий. Вернуть можно здесь же.', 'Receipts are still checked, with no rejections or closes. You can turn it back on here.', 'Чеки перевірятимуться без відхилень і закриттів. Повернути можна тут же.', 'Чектер қабылдамаусыз және жабусыз тексеріледі. Осы жерден қайтаруға болады.'],
    noChecks: ['Чеков для проверки нет', 'No receipts to review', 'Чеків для перевірки немає', 'Тексеретін чек жоқ'],
    rcStuck: ['возврат не прошёл', 'refund refused', 'повернення не пройшло', 'қайтару өтпеді'],
    minLeft: ['{n} мин', '{n} min', '{n} хв', '{n} мин'],
    segDone: ['Решены', 'Decided', 'Вирішені', 'Шешілді'],
    segBans: ['Запреты', 'Bans', 'Заборони', 'Тыйым']
  };

  Parts.me = function (P) {
    const { t, esc, icon, $ } = P;
    Object.assign(P.S, TEXTS);
    const fiat = '₽';
    function fadeSwap(el, ms) {
      if (!el || CK.reducedMotion() || !el.animate) return;
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms || 180, easing: getComputedStyle(document.documentElement).getPropertyValue('--ease-ios').trim() || 'ease-out' });
    }
    const cfgNow = () => P.cfg || { assets: [], banks: [], kinds: ['card', 'sbp'], payMinutes: [15], feeBps: 0, me: {} };
    const assetOf = (id) => cfgNow().assets.find((a) => a.id === id) || null;
    const symOf = (id) => P.symText(assetOf(id) ? assetOf(id).symbol : '');
    const tooMany = (err, key) => (err && err.code === 'too_many' ? Object.assign(P.fail('too_many_' + key), {}) : err);
    const head = (title, linkKey, data) => `<div class="p2p-sechead"><h3 class="p2p-h">${esc(title)}</h3>${linkKey ? `<button class="section-link press" type="button" ${data}>${esc(t(linkKey))}</button>` : ''}</div>`;
    const poolSent = (ad) => !!(ad.pool && (ad.pool.depositSent || P.depositHeld('pool:' + ad.pool.id)));
    const poolHasCoins = (ad) => !!(ad.side === 'sell' && ad.pool && (ad.pool.funded || ad.pool.depositSent || ad.state === 'on' || ad.state === 'paused' || P.depositHeld('pool:' + ad.pool.id)));

    function detailsStep(host, ui, o) {
      const opts = o || {};
      const kinds = opts.kinds && opts.kinds.length ? opts.kinds.filter((k) => ['card', 'sbp'].includes(k)) : ['card', 'sbp'];
      const form = opts.form || { kind: kinds[0], bank: '', value: '', holder: '', err: {} };
      const again = () => ui.show((h) => detailsStep(h, ui, { ...opts, form }), () => t('newDetails'), 'back');
      if (opts.back) ui.setBack(opts.back);
      host.innerHTML = `${kinds.length > 1 ? '<div class="p2p-kindseg"></div>' : ''}
        <div class="field"><span class="field-label">${esc(t('bank'))}</span><button class="p2p-pick press${form.bank ? '' : ' is-empty'}" type="button" data-bank>${form.bank ? `<span class="p2p-pick-logo">${P.bankLogo(form.bank, 24)}</span>` : ''}<span class="p2p-pick-text">${esc(form.bank || t('noBank'))}</span>${icon('chevron-right', { size: 16 })}</button><span class="p2p-ferr" data-err="bank"></span></div>
        <label class="field"><span class="field-label" data-vlabel>${esc(t('v_' + form.kind))}</span><span class="field-box p2p-textbox"><input data-value maxlength="64" autocomplete="off" value="${esc(form.value)}" aria-label="${esc(t('v_' + form.kind))}"></span><span class="p2p-ferr" data-err="value"></span></label>
        <label class="field"><span class="field-label">${esc(t('holderLabel'))}</span><span class="field-box p2p-textbox"><input data-holder maxlength="64" autocomplete="off" placeholder="${esc(t('holderPh'))}" value="${esc(form.holder)}" aria-label="${esc(t('holderLabel'))}"></span></label>
        <p class="p2p-note">${icon('lock', { size: 14 })}<span>${esc(t('detailsNote'))}</span></p>
        <div class="p2p-btns"><button class="btn btn--wide press" type="button" data-save>${esc(t('save'))}</button></div>`;
      const value = $('[data-value]', host), holder = $('[data-holder]', host), save = $('[data-save]', host);
      const showErr = (k, text) => { const el = $(`[data-err="${k}"]`, host); if (el) el.textContent = text || ''; };
      Object.entries(form.err).forEach(([k, v]) => showErr(k, v));
      function shape() {
        value.inputMode = form.kind === 'sbp' ? 'tel' : 'numeric';
        value.placeholder = form.kind === 'sbp' ? '+7 900 123-45-67' : '0000 0000 0000 0000';
        $('[data-vlabel]', host).textContent = t('v_' + form.kind);
        value.setAttribute('aria-label', t('v_' + form.kind));
      }
      if (kinds.length > 1) {
        CK.segmented($('.p2p-kindseg', host), { items: kinds.map((k) => ({ value: k, label: () => P.kindName(k), lead: P.payLogo(k, 16) })), value: form.kind, onChange(v) { form.kind = v; shape(); } });
      }
      value.addEventListener('input', () => {
        if (form.kind === 'card') {
          const digits = value.value.replace(/\D/g, '').slice(0, 19);
          const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
          if (grouped !== value.value) value.value = grouped;
        }
        form.value = value.value;
        form.err.value = '';
        showErr('value', '');
      });
      holder.addEventListener('input', () => { form.holder = holder.value; });
      shape();
      host.addEventListener('click', (e) => {
        if (e.target.closest('[data-bank]')) {
          return void ui.show((h) => bankStep(h, ui, form.bank, (bank) => { form.bank = bank; form.err.bank = ''; again(); }, again), () => t('bank'));
        }
        if (!e.target.closest('[data-save]') || save.disabled) return;
        form.value = value.value;
        form.holder = holder.value;
        if (!form.bank) {
          CK.haptic.error();
          form.err.bank = t('noBank');
          return void showErr('bank', form.err.bank);
        }
        save.disabled = true;
        host.classList.add('is-busy');
        P.call('methods', { kind: form.kind, bank: form.bank, value: form.value, holder: form.holder }).then((json) => {
          CK.haptic.success();
          CK.toast(esc(t('saved')), { icon: 'check', tone: 'accent' });
          if (opts.onSaved) opts.onSaved(json.methods);
        }, (err) => {
          if (err && err.code === 'bad_value') {
            CK.haptic.error();
            form.err.value = t('e_bad_value');
            return void showErr('value', form.err.value);
          }
          P.oops(tooMany(err, 'methods'));
        }).finally(() => { save.disabled = false; host.classList.remove('is-busy'); });
      });
    }
    function bankStep(host, ui, value, onPick, back) {
      const banks = cfgNow().banks || [];
      ui.setBack(back);
      host.innerHTML = `<label class="search">${icon('search', { size: 18 })}<input class="p2p-pick-find" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(t('bankFind'))}" aria-label="${esc(t('bankFind'))}"></label><div class="group p2p-flat p2p-pick-list p2p-banklist" role="listbox"></div>`;
      const list = $('.p2p-banklist', host), find = $('.p2p-pick-find', host);
      let shown = banks;
      const rows = () => {
        list.innerHTML = shown.length ? shown.map((name, i) => `<button class="cell press-row p2p-logorow" type="button" role="option" aria-selected="${name === value}" aria-checked="${name === value}" data-i="${i}">${P.bankLogo(name, 32)}<span class="cell-title p2p-line">${esc(name)}</span>${icon('check', { size: 18, className: 'p2p-check' })}</button>`).join('') : P.empty('e_none', 'search');
      };
      find.addEventListener('input', () => {
        const q = find.value.trim().toLowerCase();
        shown = banks.filter((name) => name.toLowerCase().includes(q));
        rows();
      });
      host.addEventListener('click', (e) => {
        const row = e.target.closest('[data-i]');
        if (!row) return;
        CK.haptic.selection();
        onPick(shown[Number(row.dataset.i)]);
      });
      rows();
    }
    function openDetailsSheet(done) {
      P.stepSheet({
        title: () => t('newDetails'),
        first: (h, ui) => detailsStep(h, ui, { onSaved(list) { ui.close(); if (done) done(list); } })
      });
    }

    function openMe() {
      P.pushScreen({
        title: () => t('myP2P'),
        actions: [{ icon: 'info', label: () => t('howT'), onClick() { CK.haptic.selection(); openHow(); } }],
        build(body) { buildMe(body); }
      });
    }
    function buildMe(body) {
      const st = { ads: null, methods: null, arbiter: null, adsFailed: '', methodsFailed: '' };
      const hidden = !!P.hidden;
      body.innerHTML = `<div class="p2p-page p2p-me">${P.demoNote()}
        ${hidden ? `<p class="p2p-note p2p-note--warn p2p-pausednote">${icon('info', { size: 16 })}<span data-paused>${esc(t('pausedNote'))}</span></p>` : ''}
        <section class="p2p-profile"></section>
        <div class="group list--free p2p-dealslink"><button class="cell press-row" type="button" data-deals>${P.mark('history', 'blue', 29)}<span class="cell-main"><span class="cell-title">${esc(t('myDeals'))}</span></span><span class="p2p-dealsn"></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>
        <section class="p2p-sec">${head(t('myAds'), hidden ? '' : 'newShort', 'data-newad')}<div class="p2p-myads">${P.skelRows(2)}</div></section>
        <section class="p2p-sec">${head(t('methods'), hidden ? '' : 'add', 'data-addm')}<div class="p2p-mymethods">${P.skelRows(1)}</div><p class="p2p-note">${icon('lock', { size: 14 })}<span>${esc(t('detailsNote'))}</span></p></section>
        <div class="p2p-arbslot"></div>
      </div>`;
      const profileEl = $('.p2p-profile', body), adsEl = $('.p2p-myads', body), methodsEl = $('.p2p-mymethods', body), arbEl = $('.p2p-arbslot', body), dealsN = $('.p2p-dealsn', body);
      function paintProfile() {
        const me = cfgNow().me || {};
        const tags = [me.done < 3 ? P.tag(t('newbie')) : '', me.arbiter ? P.tag(t('arbiterTag'), 'accent') : '', me.banned ? P.tag(t('closedTag'), 'down') : ''].join('');
        const unrated = (me.unrated || [])[0];
        profileEl.innerHTML = `${P.myAva(64)}<b class="p2p-person-name">${esc(me.name || '—')}</b>${tags ? `<span class="p2p-tags">${tags}</span>` : ''}
          ${P.fold(`<span>${esc(P.statsLine(me))}</span>`, P.statsRows(me), { id: 'p2p-mystats', cls: 'p2p-statline', bodyCls: 'p2p-statfold' })}
          ${unrated ? `<div class="p2p-warnline">${icon('star', { size: 16 })}<span>${esc(t('rateFirstLong'))}</span><button class="section-link press" type="button" data-rate="${esc(unrated)}">${esc(t('rateGo'))}</button></div>` : ''}`;
        P.applyFolds(profileEl);
        if (CK.paintProfile) CK.paintProfile(profileEl);
      }
      function paintDeals(n) {
        dealsN.innerHTML = n ? `<span class="p2p-badge">${n > 9 ? '9+' : n}</span>` : '';
      }
      function loadDeals() {
        paintDeals(P.activeCount || 0);
        P.call('deals').then((json) => paintDeals((json.deals || []).filter(P.dealActive).length), () => {});
      }
      function adRow(ad) {
        const buy = ad.side === 'buy';
        const coins = P.coinsCompact(ad.available, ad.decimals, ad.symbol);
        const funding = ad.state === 'funding';
        const right = hidden
          ? (funding && poolSent(ad) ? `<button class="p2p-fundtag press" type="button" data-fund="${esc(ad.id)}">${esc(t('fundOnWay'))}</button>` : '')
          : funding
            ? `<button class="p2p-fundtag press" type="button" data-fund="${esc(ad.id)}">${esc(t(poolSent(ad) ? 'fundOnWay' : 'fundGo'))}</button>`
            : `<button class="p2p-tog" type="button" data-tog="${esc(ad.id)}"></button>`;
        const tagged = hidden || ad.state === 'paused';
        return `<div class="cell p2p-adrow${tagged ? ' is-paused' : ''}" data-ad="${esc(ad.id)}">
          <button class="p2p-adrow-main press" type="button" data-edit="${esc(ad.id)}">${P.mark(buy ? 'arrow-down-left' : 'arrow-up-right', buy ? 'green' : 'red', 32)}
            <span class="cell-main"><span class="cell-title p2p-adrow-title"><span class="p2p-line">${esc(P.priceText(ad.price, ad.fiat))} <span class="p2p-dim">${esc(P.symText(ad.symbol))}</span></span>${tagged ? P.tag(t(buy ? 'hiddenLineBuy' : 'hiddenLine')) : ''}</span>
            ${P.parts([funding ? '' : coins, P.limitsShort(ad.min, ad.max, ad.fiat)], 'cell-sub')}</span></button>${right}</div>`;
      }
      function paintAds() {
        if (st.adsFailed) return void (adsEl.innerHTML = P.errorCard(st.adsFailed, 'meFail').replace('data-retry', 'data-retry="ads"'));
        if (!st.ads) return;
        const rows = st.ads.filter((ad) => ad.state !== 'off');
        P.myAdsCount = rows.length;
        if (!rows.length) {
          adsEl.innerHTML = P.empty('noAdsYet', 'tag', hidden ? undefined : { actions: `<button class="btn btn--small btn--tinted press" type="button" data-newad>${esc(t('createAd'))}</button>` });
          return;
        }
        adsEl.innerHTML = `<div class="group list--free">${rows.map(adRow).join('')}</div>`;
        adsEl.querySelectorAll('[data-tog]').forEach((el) => {
          const ad = rows.find((one) => one.id === el.dataset.tog);
          const sw = CK.toggle(el, {
            label: () => t('showInList'),
            value: ad.state === 'on',
            onChange(on) {
              P.call('ads/state', { id: ad.id, state: on ? 'on' : 'paused' }).then(loadAds, (err) => { sw.set(!on); P.oops(err); });
            }
          });
        });
      }
      function paintMethods() {
        if (st.methodsFailed) return void (methodsEl.innerHTML = P.errorCard(st.methodsFailed, 'meFail').replace('data-retry', 'data-retry="methods"'));
        if (!st.methods) return;
        if (!st.methods.length) return void (methodsEl.innerHTML = P.empty('noMethodsYet', 'card', hidden ? undefined : { actions: `<button class="btn btn--small btn--tinted press" type="button" data-addm>${esc(t('addDetails'))}</button>` }));
        methodsEl.innerHTML = `<div class="group list--free">${st.methods.length ? st.methods.map((m) => `<button class="cell press-row p2p-logorow" type="button" data-m="${esc(m.id)}">${P.methodLogo(m, 32) || P.mark('bank', 'gray', 32)}<span class="cell-main"><span class="cell-title p2p-line">${esc(m.bank)}</span><span class="cell-sub">${esc(P.kindName(m.kind))}${m.tail ? ` •• ${esc(m.tail)}` : ''}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`).join('')
          : `<button class="cell press-row p2p-addrow" type="button" data-addm>${icon('plus', { size: 18 })}<span class="cell-title">${esc(t('addDetails'))}</span></button>`}</div>`;
      }
      function paintArb() {
        const me = cfgNow().me || {};
        if (!me.arbiter) return void (arbEl.innerHTML = '');
        const a = st.arbiter;
        const open = a ? a.disputes.filter((d) => d.status === 'disputed').length : 0;
        arbEl.innerHTML = `<div class="group list--free"><button class="cell press-row" type="button" data-admin>${P.mark('shield', 'blue', 29)}<span class="cell-main"><span class="cell-title">${esc(t('arbitrage'))}</span>${a && a.halted ? `<span class="cell-sub p2p-red">${esc(t('haltedShort'))}</span>` : ''}</span>${open ? `<span class="p2p-badge">${open > 9 ? '9+' : open}</span>` : ''}${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>`;
      }
      function loadAds() {
        st.adsFailed = '';
        return P.call('ads/mine').then((json) => { st.ads = json.ads; paintAds(); if (P.market) P.market.paintTop(); }, (err) => { st.adsFailed = err.code; paintAds(); });
      }
      function loadMethods() {
        st.methodsFailed = '';
        return P.call('methods').then((json) => { st.methods = json.methods; paintMethods(); }, (err) => { st.methodsFailed = err.code; paintMethods(); });
      }
      function loadArb() {
        if (!(cfgNow().me || {}).arbiter) return paintArb();
        return P.call('arbiter').then((json) => { st.arbiter = json; paintArb(); }, () => paintArb());
      }
      function loadProfile() {
        P.call('config').then((cfg) => { if (P.cfg) P.cfg.me = cfg.me; paintProfile(); paintArb(); if (P.market) P.market.paintTop(); }, () => {});
      }
      const reload = () => { loadAds(); loadMethods(); };
      function openMethod(m) {
        P.stepSheet({
          title: () => m.bank,
          first: function view(h, ui) {
            h.innerHTML = `<div class="group p2p-flat p2p-facts">${P.fact(t('bank'), P.bankLogo(m.bank, 20) + `<span class="p2p-line">${esc(m.bank || '—')}</span>`)}${P.fact(t('way'), P.payLogo(m.kind, 20) + `<span class="p2p-line">${esc(P.kindName(m.kind))}</span>`)}${P.fact(t('number'), esc(m.tail ? '•• ' + m.tail : '—'))}</div>
              <button class="p2p-redlink press" type="button" data-del>${esc(t('delDetails'))}</button>`;
            h.addEventListener('click', (e) => {
              if (!e.target.closest('[data-del]')) return;
              ui.show((h2) => P.confirmStep(h2, ui, {
                text: t('delDetailsQ'),
                yesLabel: t('remove'),
                tone: 'btn--sell',
                no: () => ui.show(view, () => m.bank, 'back'),
                yes: () => P.call('methods/delete', { id: m.id }).then((json) => {
                  CK.haptic.success();
                  st.methods = json.methods;
                  paintMethods();
                  loadAds();
                })
              }), () => t('delDetails'));
            });
          }
        });
      }
      body.addEventListener('click', (e) => {
        const el = (s) => e.target.closest(s);
        const retry = el('[data-retry]');
        if (retry) return void (retry.dataset.retry === 'methods' ? loadMethods() : loadAds());
        if (el('[data-newad]')) return void (hidden ? undefined : openEditor(null, { done: reload }));
        if (el('[data-addm]')) return void (hidden ? undefined : openDetailsSheet((list) => { st.methods = list; paintMethods(); }));
        if (el('[data-admin]')) return void openAdmin();
        if (el('[data-deals]')) return void (P.openDeals && P.openDeals());
        const rate = el('[data-rate]');
        if (rate) return void P.openDeal(rate.dataset.rate);
        const fund = el('[data-fund]');
        if (fund) {
          const ad = (st.ads || []).find((one) => one.id === fund.dataset.fund);
          return void (ad && openFund(ad, reload));
        }
        const edit = el('[data-edit]');
        if (edit) {
          const ad = (st.ads || []).find((one) => one.id === edit.dataset.edit);
          return void (ad && (hidden ? openAdMenu(ad, reload) : openEditor(ad, { done: reload })));
        }
        const m = el('[data-m]');
        if (m) {
          const one = (st.methods || []).find((x) => x.id === m.dataset.m);
          if (one) openMethod(one);
        }
      });
      CK.i18n.bind(body, () => {
        const paused = $('[data-paused]', body);
        if (paused) paused.textContent = t('pausedNote');
        paintProfile(); paintAds(); paintMethods(); paintArb();
      });
      paintProfile();
      paintArb();
      loadProfile();
      loadDeals();
      reload();
      loadArb();
      return { reload };
    }
    function openHow() {
      P.stepSheet({
        title: () => t('howT'),
        first(h) {
          h.innerHTML = `<ol class="p2p-how">${['how1', 'how2', 'how3', 'how4'].map((k, i) => `<li><span class="p2p-how-n">${i + 1}</span><span>${esc(t(k))}</span></li>`).join('')}</ol>`;
        }
      });
    }

    function openOwnAd(id, done) {
      P.call('ads/mine').then((json) => {
        const ad = (json.ads || []).find((one) => one.id === id);
        if (!ad) throw P.fail('no_ad');
        openEditor(ad, { done });
      }).catch(P.oops);
    }

    function openAdMenu(ad, done) {
      if (CK.sheet.top) return;
      if (ad.state === 'funding' && poolSent(ad)) return void openFund(ad, done);
      CK.haptic.selection();
      P.stepSheet({
        title: () => t('editAd'),
        first: function menu(h, ui) {
          h.innerHTML = `<div class="group p2p-flat"><button class="cell press-row p2p-dangerrow" type="button" data-del><span class="cell-title">${esc(t(poolHasCoins(ad) ? 'deleteAdBack' : 'deleteAd'))}</span></button></div>`;
          h.addEventListener('click', (e) => {
            if (!e.target.closest('[data-del]')) return;
            ui.show((h2) => {
              ui.setBack(() => ui.show(menu, () => t('editAd'), 'back'));
              P.confirmStep(h2, ui, {
                text: poolHasCoins(ad) ? t('closeAdQSell') : '',
                yesLabel: t(poolHasCoins(ad) ? 'deleteAdBack' : 'remove'),
                tone: 'btn--sell',
                yes: () => P.call('ads/delete', { id: ad.id }).then(() => {
                  CK.haptic.success();
                  CK.toast(esc(t('deleted')), { icon: 'check', tone: 'accent' });
                  if (done) done();
                })
              });
            }, () => t('deleteAdQ'));
          });
        }
      });
    }

    const STEP_OF = { bad_price: 1, no_price: 1, bad_pct: 1, bad_limits: 2, bad_available: 2, bad_amount: 2, limit_deal: 2, volume_locked: 2, bad_minutes: 2, not_enough: 2, no_methods: 3, bad_methods: 3, bad_text: 3 };
    function openEditor(ad, o) {
      const opts = o || {};
      let ctl = null;
      const canDelete = !!ad && !(ad.state === 'funding' && poolSent(ad));
      P.pushScreen({
        title: () => t(ad ? 'editAd' : 'newAd'),
        actions: canDelete ? [{ icon: 'more', label: () => t('common.menu'), onClick() { if (ctl) ctl.menu(); } }] : undefined,
        build(body, api) { ctl = buildEditor(ad, opts, body, api); },
        onClose() { if (ctl) ctl.keepDraft(); }
      });
    }
    function buildEditor(ad, opts, body, api) {
      const cfg = cfgNow();
      const firstAsset = (ad && assetOf(ad.asset)) || cfg.assets[0] || { id: '', symbol: '', decimals: 9 };
      const pooled = !!(ad && ad.pool);
      const poolVolume = ad && ad.pool && ad.pool.units ? P.unitsPlain(ad.pool.units, ad.decimals) : ad ? P.unitsPlain(ad.available, ad.decimals) : '';
      const freshForm = () => ({
        side: ad ? ad.side : opts.side === 'buy' ? 'buy' : 'sell',
        asset: firstAsset.id,
        kind: ad ? ad.priceKind : 'fixed',
        price: ad && ad.fixed ? String(Number(ad.fixed)) : '',
        pct: ad && ad.pct !== null && ad.pct !== undefined ? String(ad.pct) : '0',
        min: ad ? String(Number(ad.min)) : '',
        max: ad ? String(Number(ad.max)) : '',
        available: poolVolume,
        payMinutes: String(ad ? ad.payMinutes : 15),
        picked: new Set(ad ? ad.methods.map((m) => m.id || m.kind) : []),
        terms: ad ? ad.terms || '' : '',
        confirm: !!(ad && ad.confirm)
      });
      const draft = !ad && P.editorDraft ? P.editorDraft : null;
      let form = draft ? draft.form : freshForm();
      const st = { step: draft ? draft.step : 1, own: null, busy: false, err: {}, mine: null };
      body.innerHTML = `<div class="p2p-page p2p-editor">${P.demoNote()}<div class="p2p-progress" role="img"><span></span><span></span><span></span><span></span></div>${draft ? `<p class="p2p-note p2p-draftline"><span>${esc(t('draftBack'))}</span><button class="section-link press" type="button" data-fresh>${esc(t('draftReset'))}</button></p>` : ''}<div class="p2p-stepbody"></div></div>`;
      const stepBody = $('.p2p-stepbody', body), progress = $('.p2p-progress', body);
      let isSaved = false;
      const touched = () => st.step > 1 || !!(form.price || form.available || form.min || form.max || form.terms || form.picked.size || form.confirm || (form.pct && form.pct !== '0'));
      let next = null;
      const keepDraft = () => {
        if (!ad) P.editorDraft = !isSaved && touched() ? { form, step: st.step } : null;
        if (next) { const go = next; next = null; go(); }
      };
      body.addEventListener('click', (e) => {
        if (!e.target.closest('[data-fresh]')) return;
        CK.haptic.selection();
        form = freshForm();
        st.step = 1;
        st.err = {};
        const line = $('.p2p-draftline', body);
        if (line) line.remove();
        paint();
      });
      const bar = api.bar();
      const sym = () => symOf(form.asset);
      const field = (key, label, value, o2) => `<label class="field"><span class="field-label">${esc(label)}</span><span class="field-box${o2 && o2.text ? ' p2p-textbox' : ''}">${o2 && o2.minus ? `<button class="p2p-step-btn press" type="button" data-bump="-0.1" aria-label="−0,1">${icon('minus', { size: 18 })}</button>` : ''}<input data-f="${key}" inputmode="${(o2 && o2.mode) || 'decimal'}" autocomplete="off" value="${esc(value)}" aria-label="${esc(label)}"${o2 && o2.ph ? ` placeholder="${esc(o2.ph)}"` : ''}${o2 && o2.readonly ? ' disabled' : ''}>${o2 && o2.minus ? `<button class="p2p-step-btn press" type="button" data-bump="0.1" aria-label="+0,1">${icon('plus', { size: 18 })}</button>` : ''}${o2 && o2.unit ? `<span class="field-unit">${esc(o2.unit)}</span>` : ''}</span>${o2 && o2.hint ? `<span class="p2p-fhint">${esc(o2.hint)}</span>` : ''}<span class="p2p-ferr" data-err="${key}">${esc(st.err[key] || '')}</span></label>`;
      const chips = (name, items, value) => `<div class="p2p-chips" role="radiogroup">${items.map(([v, label]) => `<button class="p2p-chip press" type="button" role="radio" aria-checked="${v === value}" data-chip="${name}" data-v="${esc(v)}">${esc(label)}</button>`).join('')}</div>`;
      const countText = (v) => (String(v || '').length >= 400 ? `${String(v).length} / 500` : '');
      const readLine = (label, value) => `<div class="p2p-readline"><span class="cell-sub">${esc(label)}</span><b>${esc(value)}</b></div>`;
      const fmtPrice = (x) => P.priceText(floorPrice(x), 'RUB');
      const floorPrice = (x) => (Math.round(x * 100) / 100).toFixed(2);

      function marketLine() {
        const ref = P.marketRefOf ? P.marketRefOf(form.asset) : null;
        if (!ref) return '';
        if (form.kind === 'market') {
          const pct = Number(P.typed(form.pct));
          if (!Number.isFinite(pct)) return '';
          return t('marketNow', { m: fmtPrice(ref), p: fmtPrice(ref * (1 + pct / 100)) });
        }
        const price = Number(P.typed(form.price));
        if (!(price > 0)) return t('marketNow', { m: fmtPrice(ref), p: '—' });
        return t('marketPct', { m: fmtPrice(ref), pct: P.pctText((price / ref - 1) * 100) });
      }
      const taken = () => (ad && form.asset === ad.asset ? null : (st.mine || []).find((one) => one.id !== (ad && ad.id) && one.side === form.side && one.asset === form.asset && one.state !== 'off') || null);
      const sectionName = () => `${t(form.side === 'sell' ? 'iSell' : 'iBuy')} ${sym()}`;
      function paintTaken() {
        const slot = $('[data-taken]', stepBody);
        const other = st.step === 1 ? taken() : null;
        stepBody.classList.toggle('is-taken', !!other);
        if (slot) slot.innerHTML = other ? `<div class="p2p-taken"><span class="p2p-taken-text"><b>${esc(t('sectionHas', { what: sectionName() }))}</b></span></div>` : '';
        paintBar();
      }
      function step1() {
        return `<div class="vstack vstack--12">${ad ? readLine('', `${t(form.side === 'sell' ? 'iSell' : 'iBuy')} ${sym()}`) : '<div class="p2p-sideseg"></div>'}
          ${pooled || cfg.assets.length < 2 ? (ad ? '' : readLine('', sym())) : '<div class="p2p-coinseg"></div>'}</div>
          <div data-taken></div>
          <div class="field p2p-kindfield"><span class="field-label">${esc(t('priceType'))}</span><div class="p2p-kindseg"></div></div>
          <div class="p2p-pricebox">${priceField()}</div>
          <p class="p2p-market" data-market>${esc(marketLine())}</p>`;
      }
      const priceField = () => (form.kind === 'fixed'
        ? field('price', t('priceLabel', { sym: sym() }), form.price, { unit: fiat })
        : field('pct', t('pctLabel'), form.pct, { unit: '%', minus: true, mode: 'text' }));
      function swapPrice() {
        const box = $('.p2p-pricebox', stepBody);
        if (box) box.innerHTML = priceField();
        const m = $('[data-market]', stepBody);
        if (m) m.textContent = marketLine();
        const side = ad ? $('.p2p-readline b', stepBody) : null;
        if (side) side.textContent = `${t(form.side === 'sell' ? 'iSell' : 'iBuy')} ${sym()}`;
      }
      function swapPicks() {
        const box = $('.p2p-picks', stepBody);
        if (!box) return;
        box.innerHTML = picksHtml();
        box.classList.remove('p2p-fade');
        void box.offsetWidth;
        box.classList.add('p2p-fade');
      }
      const paintErrs = () => stepBody.querySelectorAll('[data-err]').forEach((el) => { el.textContent = st.err[el.dataset.err] || ''; });
      function step2() {
        return `${field('available', t('volLabel', { sym: sym() }), form.available, { unit: sym(), readonly: pooled, hint: pooled ? t('e_volume_locked') : form.side === 'sell' ? t('volHintSell') : '' })}
          <div class="field"><span class="field-label">${esc(t('dealLimit'))}</span><div class="p2p-two">${field('min', t('fromRub'), form.min, { unit: fiat, ph: t('fromPh') })}${field('max', t('toRub'), form.max, { unit: fiat, ph: t('toPh') })}</div><span class="p2p-ferr" data-err="limits">${esc(st.err.limits || '')}</span></div>
          <div class="field"><span class="field-label">${esc(t('payWindow'))}</span>${chips('minutes', cfg.payMinutes.map((n) => [String(n), t('minutes', { n })]), form.payMinutes)}<span class="p2p-ferr" data-err="minutes">${esc(st.err.minutes || '')}</span></div>`;
      }
      function picksHtml() {
        if (form.side === 'sell') {
          if (!st.own) return P.skelRows(2);
          return `<div class="group p2p-flat">${st.own.map((m) => `<button class="cell press-row p2p-logorow" type="button" role="checkbox" aria-checked="${form.picked.has(m.id)}" data-pick="${esc(m.id)}">${P.methodLogo(m, 32)}<span class="cell-main"><span class="cell-title p2p-line">${esc(m.bank)}</span><span class="cell-sub">${esc(P.kindName(m.kind))}${m.tail ? ` •• ${esc(m.tail)}` : ''}</span></span><span class="p2p-tick" aria-hidden="true">${icon('check', { size: 14 })}</span></button>`).join('')}
            <button class="cell press-row p2p-addrow" type="button" data-addm>${icon('plus', { size: 18 })}<span class="cell-title">${esc(t('addDetails'))}</span></button></div>`;
        }
        return `<div class="group p2p-flat">${cfg.kinds.map((k) => `<button class="cell press-row p2p-logorow" type="button" role="checkbox" aria-checked="${form.picked.has(k)}" data-pick="${esc(k)}">${P.payLogo(k, 32)}<span class="cell-title">${esc(P.kindName(k))}</span><span class="p2p-tick" aria-hidden="true">${icon('check', { size: 14 })}</span></button>`).join('')}</div>`;
      }
      function step3() {
        return `<div class="field"><span class="field-label">${esc(t(form.side === 'sell' ? 'payBuyerWhere' : 'youPayHow'))}</span><div class="p2p-picks">${picksHtml()}</div><span class="p2p-ferr" data-err="methods">${esc(st.err.methods || '')}</span></div>
          <label class="field"><span class="field-label"><span>${esc(t(form.side === 'sell' ? 'termsForBuyer' : 'termsForSeller'))}</span><b class="p2p-count-n" data-count>${esc(countText(form.terms))}</b></span><textarea class="p2p-area" data-f="terms" maxlength="500" aria-label="${esc(t(form.side === 'sell' ? 'termsForBuyer' : 'termsForSeller'))}">${esc(form.terms)}</textarea><span class="p2p-ferr" data-err="terms">${esc(st.err.terms || '')}</span></label>
          <div class="group p2p-flat"><div class="cell"><span class="cell-main"><span class="cell-title">${esc(t('confirmOrders'))}</span></span><button class="p2p-confirmtog" type="button"></button></div></div>`;
      }
      function escrowEstimate() {
        const asset = assetOf(form.asset);
        const vol = Number(P.typed(form.available));
        if (!asset || !(vol > 0)) return '';
        const fee = vol * (Number(cfg.feeBps) || 0) / 10000;
        const gas = asset.poolGas ? Number(P.unitsPlain(asset.poolGas, 9)) : 0;
        const nd = Math.min(6, asset.decimals);
        if (asset.coin === 'gram' || asset.id === 'gram') return `${P.numText((vol + fee + gas).toFixed(nd).replace(/\.?0+$/, ''))}${P.NBSP}${sym()}`;
        return `${P.numText((vol + fee).toFixed(nd).replace(/\.?0+$/, ''))}${P.NBSP}${sym()} + ${P.numText(gas.toFixed(3).replace(/\.?0+$/, ''))}${P.NBSP}GRAM`;
      }
      function step4() {
        const price = form.kind === 'fixed' ? `${P.priceText(P.typed(form.price) || '0', 'RUB')} ${t('per1', { sym: sym() })}` : `${t('pctOf', { pct: P.pctText(Number(P.typed(form.pct)) || 0) })} · ${t('market')}`;
        const methods = form.side === 'sell'
          ? (st.own || []).filter((m) => form.picked.has(m.id)).map((m) => m.bank + (m.tail ? ' •• ' + m.tail : ''))
          : [...form.picked].map((k) => P.kindName(k));
        const row = (label, value, step) => `<button class="cell press-row p2p-fact p2p-sumrow" type="button" data-goto="${step}"><span class="cell-main"><span class="cell-sub">${esc(label)}</span><span class="p2p-sumv">${esc(value)}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`;
        const newSell = !ad && form.side === 'sell';
        const est = escrowEstimate();
        return `<div class="group p2p-flat p2p-facts">
            ${row(t('side'), `${t(form.side === 'sell' ? 'iSell' : 'iBuy')} ${sym()}`, 1)}
            ${row(t('price'), price, 1)}
            ${row(t('volLabel', { sym: sym() }), P.numText(P.typed(form.available) || '0'), 2)}
            ${row(t('dealLimit'), t('limitLine', { min: P.numText(P.typed(form.min) || '0'), max: P.numText(P.typed(form.max) || '0') }), 2)}
            ${row(t('payWindow'), t('minutes', { n: form.payMinutes }), 2)}
            ${row(t(form.side === 'sell' ? 'payBuyerWhere' : 'youPayHow'), methods.join(', ') || '—', 3)}
            ${form.terms ? row(t('terms'), form.terms, 3) : ''}
            ${row(t('confirmOrders'), t(form.confirm ? 'yesWord' : 'noWord'), 3)}
          </div>
          ${newSell && est ? `<p class="p2p-note">${icon('lock', { size: 14 })}<span>${esc(t('nextEscrow', { coins: est }))}</span></p>` : ''}`;
      }
      let shown = 0, sideSeg = null, coinSeg = null, autoPick = !ad && !draft;
      function paint() {
        const names = ['step1', 'step2', 'step3', 'step4'];
        const moved = !!shown && st.step !== shown;
        const back = moved && st.step < shown;
        shown = st.step;
        body.querySelectorAll('.p2p-progress span').forEach((el, i) => el.classList.toggle('is-on', i < st.step));
        progress.setAttribute('aria-label', t('stepOf', { n: st.step, name: t(names[st.step - 1]) }));
        stepBody.innerHTML = [step1, step2, step3, step4][st.step - 1]();
        stepBody.classList.remove('p2p-step-in', 'p2p-step-back');
        if (moved) {
          void stepBody.offsetWidth;
          stepBody.classList.add('p2p-step-in');
          if (back) stepBody.classList.add('p2p-step-back');
        }
        sideSeg = coinSeg = null;
        if (st.step === 1) {
          if (!ad) sideSeg = CK.segmented($('.p2p-sideseg', stepBody), { items: [{ value: 'sell', label: () => t('iSell'), tone: 'sell' }, { value: 'buy', label: () => t('iBuy'), tone: 'buy' }], value: form.side, onChange(v) { autoPick = false; form.side = v; form.picked.clear(); paintTaken(); } });
          const coinHost = $('.p2p-coinseg', stepBody);
          if (coinHost) coinSeg = CK.segmented(coinHost, { items: cfg.assets.map((a) => ({ value: a.id, label: P.symText(a.symbol) })), value: form.asset, onChange(v) { autoPick = false; form.asset = v; swapPrice(); paintTaken(); } });
          CK.segmented($('.p2p-kindseg', stepBody), { items: [{ value: 'fixed', label: () => t('fixed') }, { value: 'market', label: () => t('market') }], value: form.kind, onChange(v) { form.kind = v; st.err = {}; swapPrice(); } });
        }
        if (st.step === 3) {
          CK.toggle($('.p2p-confirmtog', stepBody), { label: () => t('confirmOrders'), value: form.confirm, onChange(on) { form.confirm = on; } });
        }
        paintTaken();
        if (moved) api.scroll.scrollTop = 0;
      }
      function pickFree() {
        if (!autoPick) return;
        autoPick = false;
        if (st.step !== 1 || !taken() || touched()) return;
        const sides = opts.side === 'buy' || opts.side === 'sell' ? [opts.side] : ['sell', 'buy'];
        for (const side of sides) {
          for (const a of cfg.assets) {
            if ((st.mine || []).some((one) => one.side === side && one.asset === a.id && one.state !== 'off')) continue;
            if (side !== form.side) { form.side = side; form.picked.clear(); if (sideSeg) sideSeg.set(side); }
            if (a.id !== form.asset) { form.asset = a.id; if (coinSeg) coinSeg.set(a.id); }
            swapPrice();
            return;
          }
        }
      }
      function paintBar() {
        const last = st.step === 4;
        const other = st.step === 1 ? taken() : null;
        const saveKey = other ? 'openIt' : last ? (!ad && form.side === 'sell' ? 'saveAndFund' : 'save') : 'next';
        bar.set('', `<div class="p2p-barbtns p2p-barrow">${st.step > 1 ? `<button class="btn btn--tinted press" type="button" data-prev>${esc(t('back'))}</button>` : ''}<button class="btn press" type="button" ${other ? `data-other="${esc(other.id)}"` : 'data-next'}>${esc(t(saveKey))}</button></div>`);
      }
      function openOther(other) {
        if (!ad) P.editorDraft = null;
        isSaved = true;
        next = () => (other.state === 'funding' ? openFund(other, opts.done) : openEditor(other, { done: opts.done }));
        api.close();
      }
      const setErr = (key, text) => { st.err[key] = text; const el = $(`[data-err="${key}"]`, stepBody); if (el) el.textContent = text || ''; };
      function check(step) {
        st.err = {};
        if (step === 1) {
          if (form.kind === 'fixed' && !(Number(P.typed(form.price)) > 0)) st.err.price = t(P.typed(form.price) ? 'e_bad_price' : 'enterPrice');
          if (form.kind === 'market') {
            const pct = Number(P.typed(form.pct));
            if (!P.typed(form.pct) || !Number.isFinite(pct) || Math.abs(pct) > 50) st.err.pct = t('e_bad_price');
          }
        }
        if (step === 2) {
          if (!(Number(P.typed(form.available)) > 0)) st.err.available = t('e_bad_available');
          const min = Number(P.typed(form.min)), max = Number(P.typed(form.max));
          if (!(min > 0) || !(max > 0)) st.err.limits = t('e_bad_limits');
          else if (min > max) st.err.limits = t('minOverMax');
        }
        if (step === 3 && !form.picked.size) st.err.methods = t(form.side === 'sell' ? 'e_no_methods' : 'e_bad_methods');
        return !Object.keys(st.err).length;
      }
      async function save() {
        if (st.busy) return;
        for (let s = 1; s <= 3; s++) if (!check(s)) { st.step = s; paint(); return; }
        st.busy = true;
        bar.el.classList.add('is-busy');
        let saved = null;
        try {
          const wallet = await P.ownWallet();
          if (!wallet) throw P.fail('noWallet');
          const pct = Number(P.typed(form.pct));
          saved = await P.call('ads', {
            ...(ad ? { id: ad.id } : { side: form.side }),
            asset: form.asset,
            fiat: P.FIAT,
            price: form.kind === 'fixed' ? { kind: 'fixed', value: P.typed(form.price) } : { kind: 'market', pct: Number.isFinite(pct) ? pct : NaN },
            min: P.typed(form.min),
            max: P.typed(form.max),
            available: P.typed(form.available),
            payMinutes: Number(form.payMinutes),
            methods: [...form.picked],
            terms: form.terms,
            confirm: form.confirm,
            wallet
          });
          CK.haptic.success();
          CK.toast(esc(t('saved')), { icon: 'check', tone: 'accent' });
          isSaved = true;
          if (!ad) P.editorDraft = null;
          api.close();
          if (opts.done) opts.done();
          if (P.market) P.market.reload();
          if (saved && saved.ad && saved.ad.state === 'funding') waitPool(saved.ad.id, opts.done);
        } catch (err) {
          if (err.code === 'noWallet') return void CK.toast(esc(t('noWallet')), { icon: 'wallet', tone: 'accent' });
          if (err.code === 'one_per_section') {
            CK.haptic.error();
            st.step = 1;
            paint();
            loadMine();
            return;
          }
          const step = STEP_OF[err.code];
          if (step) {
            CK.haptic.error();
            st.step = step;
            const key = step === 1 ? (form.kind === 'fixed' ? 'price' : 'pct') : step === 2 ? (err.code === 'bad_limits' || err.code === 'limit_deal' || err.code === 'bad_amount' ? 'limits' : err.code === 'bad_minutes' ? 'minutes' : 'available') : err.code === 'bad_text' ? 'terms' : 'methods';
            paint();
            setErr(key, P.errorText(err.code));
          } else {
            P.oops(tooMany(err, 'ads'));
          }
        } finally {
          st.busy = false;
          bar.el.classList.remove('is-busy');
        }
      }
      function closeAd() {
        if (!ad || CK.sheet.top) return;
        CK.haptic.selection();
        P.stepSheet({
          title: () => t('editAd'),
          first: function menu(h, ui) {
            h.innerHTML = `<div class="group p2p-flat"><button class="cell press-row p2p-dangerrow" type="button" data-del><span class="cell-title">${esc(t('deleteAd'))}</span></button></div>`;
            h.addEventListener('click', (e) => {
              if (!e.target.closest('[data-del]')) return;
              ui.show((h2) => {
                ui.setBack(() => ui.show(menu, () => t('editAd'), 'back'));
                P.confirmStep(h2, ui, {
                  text: poolHasCoins(ad) ? t('closeAdQSell') : '',
                  yesLabel: t(poolHasCoins(ad) ? 'deleteAdBack' : 'remove'),
                  tone: 'btn--sell',
                  yes: () => P.call('ads/delete', { id: ad.id }).then(() => {
                    CK.haptic.success();
                    CK.toast(esc(t('deleted')), { icon: 'check', tone: 'accent' });
                    isSaved = true;
                    api.close();
                    if (opts.done) opts.done();
                    if (P.market) P.market.reload();
                  })
                });
              }, () => t('deleteAdQ'));
            });
          }
        });
      }
      stepBody.addEventListener('input', (e) => {
        const f = e.target.closest('[data-f]');
        if (!f) return;
        form[f.dataset.f] = f.value;
        setErr(f.dataset.f, '');
        if (f.dataset.f === 'min' || f.dataset.f === 'max') setErr('limits', '');
        if (f.dataset.f === 'terms') { const c = $('[data-count]', stepBody); if (c) c.textContent = countText(f.value); }
        const m = $('[data-market]', stepBody);
        if (m) m.textContent = marketLine();
      });
      stepBody.addEventListener('click', (e) => {
        const el = (s) => e.target.closest(s);
        const chip = el('[data-chip]');
        if (chip) {
          CK.haptic.selection();
          if (chip.dataset.chip === 'minutes') {
            form.payMinutes = chip.dataset.v;
            stepBody.querySelectorAll('[data-chip="minutes"]').forEach((c) => c.setAttribute('aria-checked', String(c.dataset.v === form.payMinutes)));
          }
          return;
        }
        const bump = el('[data-bump]');
        if (bump) {
          CK.haptic.selection();
          const now = Number(P.typed(form.pct)) || 0;
          const next = Math.max(-50, Math.min(50, Math.round((now + Number(bump.dataset.bump)) * 10) / 10));
          form.pct = String(next);
          const input = $('[data-f="pct"]', stepBody);
          if (input) input.value = form.pct;
          setErr('pct', '');
          const m = $('[data-market]', stepBody);
          if (m) m.textContent = marketLine();
          return;
        }
        const pick = el('[data-pick]');
        if (pick) {
          const v = pick.dataset.pick;
          if (form.picked.has(v)) form.picked.delete(v);
          else if (form.picked.size >= 5) { CK.haptic.error(); return void setErr('methods', t('max5')); }
          else form.picked.add(v);
          CK.haptic.selection();
          pick.setAttribute('aria-checked', String(form.picked.has(v)));
          setErr('methods', '');
          return;
        }
        if (el('[data-addm]')) return void openDetailsSheet((list) => { st.own = list; if (st.step === 3) swapPicks(); });
        const go = el('[data-goto]');
        if (go) { CK.haptic.selection(); st.step = Number(go.dataset.goto); paint(); }
      });
      bar.el.addEventListener('click', (e) => {
        if (st.busy) return;
        if (e.target.closest('[data-prev]')) { st.err = {}; st.step = Math.max(1, st.step - 1); return void paint(); }
        const other = e.target.closest('[data-other]');
        if (other) {
          const one = (st.mine || []).find((x) => x.id === other.dataset.other);
          if (one) { CK.haptic.selection(); openOther(one); }
          return;
        }
        if (!e.target.closest('[data-next]')) return;
        if (st.step < 4) {
          if (!check(st.step)) { CK.haptic.error(); return void paintErrs(); }
          st.step += 1;
          return void paint();
        }
        save();
      });
      function loadOwn() {
        P.call('methods').then((json) => { st.own = json.methods; if (st.step === 3) swapPicks(); else if (st.step === 4) paint(); }, () => { st.own = []; if (st.step === 3) swapPicks(); });
      }
      function loadMine() {
        P.call('ads/mine').then((json) => { st.mine = json.ads || []; pickFree(); paintTaken(); }, () => {});
      }
      CK.i18n.bind(body, paint);
      paint();
      loadOwn();
      if (!pooled) loadMine();
      return { keepDraft, menu: closeAd };
    }

    function waitPool(adId, done, tries = 0) {
      P.call('ads/mine').then((json) => {
        const ad = json.ads.find((one) => one.id === adId);
        if (ad && ad.pool && !ad.pool.waiting) return openFund(ad, done);
        if (tries < 8) setTimeout(() => waitPool(adId, done, tries + 1), 1500);
        return undefined;
      }, () => {});
    }

    function openFund(ad, done) {
      const pool = ad.pool;
      if (!pool || pool.waiting) return void CK.toast(esc(t('h_pending')), { icon: 'clock', tone: 'accent' });
      const plan = { id: pool.id, coin: pool.coin, units: pool.units, fee: pool.fee, gas: pool.gas, memo: pool.memo, escrow: pool.escrow, wallet: ad.wallet, pool: true };
      if (!P.demo && P.Audit.auditDeposit(plan)) return void P.oops(P.fail('mismatch'));
      const total = (BigInt(pool.units) + BigInt(pool.fee)).toString();
      const totalText = P.coinsText(total, ad.decimals, ad.symbol);
      const escrow = P.Audit.pins.escrow || (P.demo ? pool.escrow : '');
      const holdKey = 'pool:' + pool.id;
      const sent = () => !!pool.depositSent || P.depositHeld(holdKey);
      const tellSent = () => (P.demo || !P.depositHeld(holdKey) ? Promise.resolve() : P.call('ads/deposit', { id: ad.id }).then((json) => { if (json && json.ad && json.ad.pool) pool.depositSent = !!json.ad.pool.depositSent || pool.depositSent; }, () => {}));
      if (sent() && !pool.depositSent) tellSent();
      let pass = null;
      P.stepSheet({
        title: () => t('fundT'),
        onClose() { if (pass) pass.cancel(); },
        first: function main(b, ui) {
          b.innerHTML = `<div class="group p2p-flat p2p-facts">
              <div class="cell p2p-fact"><span class="cell-sub p2p-label">${esc(t('to'))}</span><span class="p2p-value p2p-stack"><span>${esc(t('escrowWallet'))}</span><span class="p2p-addr">${esc(P.shortAddr(escrow))}</span></span></div>
              ${P.fact(t('coins'), esc(totalText))}${P.fact(t('gasRow'), esc(P.coinsText(pool.gas, 9, 'GRAM')))}${P.fact(t('network'), 'TON')}</div>
            <div class="p2p-btns"><button class="btn btn--wide press" type="button" data-go${sent() ? ' disabled' : ''}>${esc(t('fundAd', { amount: totalText }))}</button>
            ${sent() ? `<p class="p2p-why">${esc(t('fundWait'))}</p>` : ''}</div>`;
          const btns = $('.p2p-btns', b), go = $('[data-go]', b);
          pass = P.passBox(b, btns);
          let busy = false;
          b.addEventListener('click', async (e) => {
            if (busy) return;
            if (!e.target.closest('[data-go]') || go.disabled) return;
            busy = true;
            go.disabled = true;
            try {
              if (P.demo) {
                await P.call('ads/deposit', { id: ad.id });
                CK.toast(esc(t('demoSigned')), { icon: 'info', tone: 'accent' });
              } else {
                const wallet = P.useWallet(plan.wallet);
                const signed = await P.unlocked(pass.ask, (opts) => CK.wallet.signP2PDeposit(plan, { ...opts, wallet }));
                if (!signed) return;
                P.holdDeposit(holdKey, signed.validUntil);
                await CK.wallet.broadcast(signed.boc);
                await P.call('ads/deposit', { id: ad.id }).catch(() => {});
                CK.haptic.success();
                CK.toast(esc(t('fundWait')), { icon: 'clock', tone: 'accent' });
              }
              ui.close();
              if (done) done();
            } catch (err) {
              P.oops(err);
            } finally {
              busy = false;
              go.disabled = sent();
            }
          });
        }
      });
    }

    async function resumePayouts(load) {
      await P.call('arbiter/resume', {});
      load();
    }
    function openAdmin(tab) {
      P.pushScreen({
        title: () => t('arbitrage'),
        build(body) {
          const rcOn = !!(P.cfg && P.cfg.receiptCheck);
          const st = { tab: tab === 'checks' && rcOn ? 'checks' : 'open', tickets: null, people: [], halted: false, failed: '', rc: null, rcFailed: '' };
          body.innerHTML = `<div class="p2p-page">${P.demoNote()}<div class="p2p-haltslot"></div><div class="p2p-arbseg"></div><div class="p2p-arbrows">${P.skelRows(3)}</div></div>`;
          const rowsEl = $('.p2p-arbrows', body), haltEl = $('.p2p-haltslot', body);
          haltEl.hidden = true;
          const ticketRow = (d) => `<button class="cell press-row p2p-dealrow" type="button" data-deal="${esc(d.id)}">${P.mark('shield', d.status === 'disputed' ? 'red' : 'gray', 36)}
            <span class="cell-main"><span class="cell-title p2p-adrow-title"><span class="p2p-line">${esc(P.rubShort(d.fiatAmount, d.fiat))}</span>${P.tag(t('s_' + d.status), P.statusTone(d.status))}</span>
            <span class="cell-sub p2p-line">${esc(t('sellerName', { name: d.seller ? d.seller.name : '—' }))}</span><span class="cell-sub p2p-line">${esc(t('buyerName', { name: d.buyer ? d.buyer.name : '—' }))}</span>
            ${P.parts([P.coinsCompact(d.units, d.decimals, d.symbol), t('chatN', { n: d.messages }), d.receipt ? t('receiptTag') : ''], 'cell-sub')}</span>
            <span class="p2p-rowend"><span class="p2p-rowclock">${esc(CK.i18n.dayShort(d.at))}</span></span></button>`;
          const personRow = (p) => `<div class="cell">${P.ava(p, 40)}<span class="cell-main"><span class="cell-title p2p-line">${esc(p.name)}</span>${P.parts([P.starsText(p), P.dealsText(p.done)], 'cell-sub')}</span><button class="btn btn--small btn--tinted press" type="button" data-unban="${esc(p.pid)}">${esc(t('unban'))}</button></div>`;
          const rcRow = (r) => {
            const left = r.until && r.status === 'paid' ? Math.max(0, Math.ceil((r.until - Date.now()) / 60000)) : null;
            const clsWord = r.verdict === 'rejected' ? t('cl_' + (r.cls || 'mismatch')) : '';
            const reason = r.reason && P.reasonWord ? P.reasonWord(r.reason) : '';
            const why = ['#' + String(r.id).slice(0, 6), reason && reason.toLowerCase() !== clsWord.toLowerCase() ? reason : '', r.appeal ? t('g_appeals') : '', r.stuck === 'refund_refused' ? t('rcStuck') : ''].filter(Boolean).join(' · ');
            const tag = r.verdict === 'rejected' ? P.tag(clsWord.charAt(0).toUpperCase() + clsWord.slice(1), 'down') : r.verdict === 'flagged' ? `<span class="tag p2p-tag-warn">${esc(t('rc_flagged'))}</span>` : P.tag(t('s_' + r.status), P.statusTone(r.status));
            return `<button class="cell press-row p2p-dealrow" type="button" data-deal="${esc(r.id)}">${P.mark('doc', r.verdict === 'rejected' ? 'red' : 'gray', 36)}
              <span class="cell-main"><span class="cell-title">${esc(P.rubShort(r.fiatAmount, r.fiat))}</span><span class="cell-sub p2p-line">${esc(why)}</span></span>
              <span class="p2p-rowend">${tag}<span class="p2p-rowclock">${esc(left !== null ? t('minLeft', { n: left }) : CK.i18n.dayShort(r.at))}</span></span></button>`;
          };
          function checksHtml() {
            if (st.rcFailed) return P.errorCard(st.rcFailed, 'arbFail');
            if (!st.rc) return P.skelRows(3);
            const rc = st.rc;
            const g = rc.groups || {};
            const order = ['enforce', 'report', 'shadow', 'off'];
            const nb = (text) => `<span class="p2p-nowrap">${esc(text)}</span>`;
            const today = Object.entries(rc.today || {}).filter(([, n]) => n > 0).map(([k, n]) => nb(`${t('cl_' + k)} ${n}`));
            const profs = (rc.profiles || []).filter((x) => x.n > 0).map((x) => nb(`${x.title || x.name} ${x.n}`));
            const sw = rc.mode === 'enforce' ? `<button class="btn btn--wide btn--tinted press" type="button" data-rcmode="report">${esc(t('modeOff'))}</button>`
              : order.indexOf(rc.mode) > order.indexOf(rc.envMode || 'enforce') && rc.envMode === 'enforce' ? `<button class="btn btn--wide btn--tinted press" type="button" data-rcmode="enforce">${esc(t('modeBack'))}</button>` : '';
            const head = `<div class="card p2p-card p2p-rchead"><b>${esc(t('modeLine', { m: t('md_' + (rc.mode || 'off')) }))}</b>
              ${today.length ? `<span class="cell-sub">${esc(t('todayLine'))}: ${today.join(' · ')}</span>` : ''}
              ${profs.length ? `<span class="cell-sub">${esc(t('profLine'))}: ${profs.join(' · ')}</span>` : ''}
              ${rc.reader === 'none' || !rc.reader ? `<span class="cell-sub">${esc(t('readerOff'))}</span>` : ''}${sw}</div>`;
            const inReview = new Set((rc.review || []).map((r) => r.id));
            const notReviewed = (rows) => (Array.isArray(rows) ? rows.filter((r) => !inReview.has(r.id)) : rows);
            const groups = [['g_review', rc.review], ['g_grace', g.grace], ['g_appeals', notReviewed(g.appeals)], ['g_flagged', g.flagged], ['g_auto', notReviewed(g.auto)], ['g_shadow', g.shadow]]
              .filter(([, rows]) => Array.isArray(rows) && rows.length)
              .map(([k, rows]) => `<section class="p2p-sec"><h3 class="p2p-h">${esc(t(k))}</h3><div class="group">${rows.map(rcRow).join('')}</div></section>`).join('');
            return head + (groups || `<div class="card p2p-card">${P.empty('noChecks', 'doc')}</div>`);
          }
          function loadChecks() {
            st.rcFailed = '';
            return P.call('arbiter/receipts').then((json) => { st.rc = json; paint(); }, (err) => { st.rcFailed = err.code; paint(); });
          }
          function paint() {
            haltEl.hidden = st.tab === 'checks' || !st.halted;
            if (st.tab === 'checks') { haltEl.innerHTML = ''; rowsEl.innerHTML = checksHtml(); return; }
            haltEl.innerHTML = st.halted ? `<div class="card p2p-card p2p-halt">${icon('warning', { size: 22 })}<p>${esc(t('halted'))}</p><button class="btn btn--wide press" type="button" data-resume>${esc(t('resume'))}</button></div>` : '';
            if (st.failed) return void (rowsEl.innerHTML = P.errorCard(st.failed, 'arbFail'));
            if (!st.tickets) return void (rowsEl.innerHTML = P.skelRows(3));
            if (st.tab === 'bans') return void (rowsEl.innerHTML = st.people.length ? `<div class="group">${st.people.map(personRow).join('')}</div>` : `<div class="card p2p-card">${P.empty('noBans', 'lock')}</div>`);
            const rows = st.tickets.filter((d) => (st.tab === 'open' ? d.status === 'disputed' : d.status !== 'disputed'));
            rowsEl.innerHTML = rows.length ? `<div class="group">${rows.map(ticketRow).join('')}</div>` : `<div class="card p2p-card">${P.empty('noDisputes', 'shield')}</div>`;
          }
          function load() {
            st.failed = '';
            return Promise.all([P.call('arbiter'), P.call('arbiter/banned')]).then(([a, p]) => {
              st.tickets = a.disputes;
              st.halted = a.halted;
              st.people = p.people;
              paint();
            }, (err) => {
              st.failed = err.code;
              paint();
            });
          }
          CK.segmented($('.p2p-arbseg', body), { items: [{ value: 'open', label: () => t('tickets') }, ...(rcOn ? [{ value: 'checks', label: () => t('checksTab') }] : []), { value: 'done', label: () => t(rcOn ? 'segDone' : 'decided') }, { value: 'bans', label: () => t(rcOn ? 'segBans' : 'bans') }], value: st.tab, onChange(v) { st.tab = v; paint(); fadeSwap(rowsEl); if (v === 'checks') loadChecks(); } });
          const rcTick = setInterval(() => {
            if (!body.isConnected) return clearInterval(rcTick);
            if (st.tab === 'checks' && st.rc && !document.hidden) paint();
            return undefined;
          }, 30000);
          body.addEventListener('click', (e) => {
            if (e.target.closest('[data-retry]')) { if (st.tab === 'checks') { st.rc = null; paint(); return void loadChecks(); } st.tickets = null; paint(); return void load(); }
            const mode = e.target.closest('[data-rcmode]');
            if (mode) {
              const to = mode.dataset.rcmode;
              const go = () => P.call('arbiter/receipt-mode', { mode: to }).then(() => { CK.haptic.success(); return loadChecks(); });
              if (to !== 'report') return void go().catch(P.oops);
              return void P.confirmSheet({ title: () => t('modeOff'), text: t('modeOffQ'), yesLabel: t('modeOff'), tone: 'btn--sell', yes: go });
            }
            if (e.target.closest('[data-resume]')) return void resumePayouts(load).catch(P.oops);
            const un = e.target.closest('[data-unban]');
            if (un) return void P.call('arbiter/ban', { pid: un.dataset.unban, on: false }).then(load, P.oops);
            const row = e.target.closest('[data-deal]');
            if (row) P.openDeal(row.dataset.deal, () => { if (!body.isConnected) return; load(); if (st.tab === 'checks') loadChecks(); });
            return undefined;
          });
          CK.i18n.bind(body, paint);
          load();
          if (st.tab === 'checks') loadChecks();
        }
      });
    }

    return { openMe, openEditor, openOwnAd, openAdMenu, openFund, openAdmin, detailsStep, openDetailsSheet };
  };
})();
