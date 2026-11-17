(function () {
  'use strict';
  const { icon } = CK;
  const esc = CK.esc;
  const $ = (s, r) => (r || document).querySelector(s);

  const Audit = CK.p2pAudit;
  const SIGNATURE_LIFE_S = 15 * 60;

  const ID = /^[0-9a-f]{16}$/;
  const WALLET = /^0:[0-9a-f]{64}$/;
  const FILE_MAX = 15 * 1024 * 1024;
  const FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
  const FILE_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heic', pdf: 'application/pdf' };
  const FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf';
  const POLL_MS = 4000;
  const LANGS = ['ru', 'en', 'uk', 'kk'];
  const Parts = window.DemoP2PParts || {};

  const S = {
    title: ['P2P', 'P2P', 'P2P', 'P2P'],
    buy: ['Купить', 'Buy', 'Купити', 'Сатып алу'],
    sell: ['Продать', 'Sell', 'Продати', 'Сату'],
    deals: ['Сделки', 'Deals', 'Угоди', 'Мәмілелер'],
    methods: ['Реквизиты', 'Payment details', 'Реквізити', 'Деректемелер'],
    noDisputes: ['Споров нет', 'No disputes', 'Спорів немає', 'Дау жоқ'],
    deals_n: [{ one: '{n} сделка', few: '{n} сделки', other: '{n} сделок' }, { one: '{n} deal', other: '{n} deals' }, { one: '{n} угода', few: '{n} угоди', other: '{n} угод' }, { other: '{n} мәміле' }],
    ads_n: [{ one: '{n} объявление', few: '{n} объявления', other: '{n} объявлений' }, { one: '{n} ad', other: '{n} ads' }, { one: '{n} оголошення', few: '{n} оголошення', other: '{n} оголошень' }, { other: '{n} хабарландыру' }],
    activeMore: [{ one: 'Ещё {n} активная сделка', few: 'Ещё {n} активные сделки', other: 'Ещё {n} активных сделок' }, { one: '{n} more active deal', other: '{n} more active deals' }, { one: 'Ще {n} активна угода', few: 'Ще {n} активні угоди', other: 'Ще {n} активних угод' }, { other: 'Тағы {n} белсенді мәміле' }],
    terms: ['Условия', 'Terms', 'Умови', 'Шарттар'],
    youPay: ['Вы платите', 'You pay', 'Ви платите', 'Сіз төлейсіз'],
    youGet: ['Вы получите', 'You get', 'Ви отримаєте', 'Сіз аласыз'],
    youSend: ['Вы отдаёте', 'You give', 'Ви віддаєте', 'Сіз бересіз'],
    fee: ['Комиссия', 'Fee', 'Комісія', 'Комиссия'],
    confirmAd: ['Подтверждение до 15 мин', 'Confirmed within 15 min', 'Підтвердження до 15 хв', 'Растау 15 минутқа дейін'],
    place: ['Начать сделку', 'Start the deal', 'Почати угоду', 'Мәмілені бастау'],
    price: ['Цена', 'Price', 'Ціна', 'Баға'],
    amount: ['Сумма', 'Amount', 'Сума', 'Сома'],
    coins: ['Монеты', 'Coins', 'Монети', 'Монеталар'],
    seller: ['Продавец', 'Seller', 'Продавець', 'Сатушы'],
    buyer: ['Покупатель', 'Buyer', 'Покупець', 'Сатып алушы'],
    s_created: ['Ждёт подтверждения', 'Awaiting confirmation', 'Чекає підтвердження', 'Растауды күтуде'],
    s_awaiting_lock: ['Залог монет', 'Locking coins', 'Застава монет', 'Монеталар кепілге'],
    s_locked: ['Ждёт оплаты', 'Awaiting payment', 'Чекає оплати', 'Төлемді күтуде'],
    s_paid: ['Оплачено', 'Paid', 'Сплачено', 'Төленді'],
    s_released: ['Завершена', 'Completed', 'Завершено', 'Аяқталды'],
    s_cancelled: ['Отменена', 'Cancelled', 'Скасовано', 'Тоқтатылды'],
    s_expired: ['Время вышло', 'Expired', 'Час вийшов', 'Уақыты бітті'],
    s_disputed: ['Спор', 'Dispute', 'Спір', 'Дау'],
    s_resolved_to_buyer: ['Решено: покупателю', 'Decided: buyer', 'Вирішено: покупцю', 'Шешілді: сатып алушыға'],
    s_resolved_to_seller: ['Решено: продавцу', 'Decided: seller', 'Вирішено: продавцю', 'Шешілді: сатушыға'],
    s_fined: ['Штраф продавцу', 'Seller fined', 'Штраф продавцю', 'Сатушыға айыппұл'],
    h_pending: ['Ждём ответ кошелька площадки', 'Waiting for the platform wallet', 'Чекаємо відповідь гаманця майданчика', 'Алаң әмиянының жауабын күтеміз'],
    confirm: ['Подтвердить', 'Confirm', 'Підтвердити', 'Растау'],
    cancel: ['Отменить', 'Cancel', 'Скасувати', 'Болдырмау'],
    send: ['Внести {amount}', 'Deposit {amount}', 'Внести {amount}', '{amount} салу'],
    paid: ['Я оплатил', 'I have paid', 'Я сплатив', 'Төледім'],
    release: ['Отпустить монеты', 'Release the coins', 'Відпустити монети', 'Монеталарды босату'],
    dispute: ['Открыть спор', 'Open a dispute', 'Відкрити спір', 'Дау ашу'],
    rateQ: ['Как прошла сделка?', 'How did it go?', 'Як пройшла угода?', 'Мәміле қалай өтті?'],
    rateNeed: ['Поставьте оценку', 'Rate the deal', 'Поставте оцінку', 'Баға қойыңыз'],
    toFine: ['Штраф продавцу', 'Fine the seller', 'Штраф продавцю', 'Сатушыға айыппұл'],
    fineTo: ['Штрафы площадки', 'Platform fines', 'Штрафи майданчика', 'Алаң айыппұлдары'],
    banSeller: ['Заблокировать продавца', 'Block the seller', 'Заблокувати продавця', 'Сатушыны бұғаттау'],
    banBuyer: ['Заблокировать покупателя', 'Block the buyer', 'Заблокувати покупця', 'Сатып алушыны бұғаттау'],
    unban: ['Разблокировать', 'Unblock', 'Розблокувати', 'Бұғаттан шығару'],
    banned: ['Заблокирован', 'Blocked', 'Заблоковано', 'Бұғатталды'],
    tickets: ['Тикеты', 'Tickets', 'Тікети', 'Тикеттер'],
    decided: ['Решённые', 'Decided', 'Вирішені', 'Шешілгендер'],
    bans: ['Блокировки', 'Blocks', 'Блокування', 'Бұғаттаулар'],
    noBans: ['Никто не заблокирован', 'Nobody is blocked', 'Ніхто не заблокований', 'Ешкім бұғатталмаған'],
    receiptTag: ['Чек', 'Receipt', 'Чек', 'Чек'],
    attachReceipt: ['Прикрепить чек', 'Attach the receipt', 'Прикріпити чек', 'Чекті тіркеу'],
    receiptAdded: ['Чек прикреплён', 'Receipt attached', 'Чек прикріплено', 'Чек тіркелді'],
    h_receipt: ['Без чека оплату не отметить', 'Attach a receipt to mark it paid', 'Без чека оплату не позначити', 'Чексіз төлем белгіленбейді'],
    funding: ['Ждёт залог', 'Waiting for the deposit', 'Чекає заставу', 'Кепілді күтуде'],
    fundAd: ['Внести {amount}', 'Deposit {amount}', 'Внести {amount}', '{amount} салу'],
    fundWait: ['Перевод уже отправлен, ждём сеть', 'Transfer sent, waiting for the network', 'Переказ уже надіслано, чекаємо мережу', 'Аударым жіберілді, желіні күтеміз'],
    closeAd: ['Закрыть и вернуть монеты', 'Close and get the coins back', 'Закрити й повернути монети', 'Жабу және монеталарды қайтару'],
    rated: ['Оценка отправлена', 'Rated', 'Оцінку надіслано', 'Баға жіберілді'],
    holder: ['Получатель', 'Holder', 'Отримувач', 'Алушы'],
    copied: ['Скопировано', 'Copied', 'Скопійовано', 'Көшірілді'],
    chat: ['Чат', 'Chat', 'Чат', 'Чат'],
    messagePh: ['Сообщение', 'Message', 'Повідомлення', 'Хабарлама'],
    attach: ['Файл', 'File', 'Файл', 'Файл'],
    me: ['Вы', 'You', 'Ви', 'Сіз'],
    arbiter: ['Арбитр', 'Arbiter', 'Арбітр', 'Арбитр'],
    block: ['Заблокировать', 'Block', 'Заблокувати', 'Бұғаттау'],
    blocked: ['Заблокирован', 'Blocked', 'Заблоковано', 'Бұғатталды'],
    check: ['Проверьте перед подписью', 'Check before signing', 'Перевірте перед підписом', 'Қол қоймас бұрын тексеріңіз'],
    checkDecide: ['Проверьте решение', 'Check the decision', 'Перевірте рішення', 'Шешімді тексеріңіз'],
    decideNow: ['Подтвердить решение', 'Confirm the decision', 'Підтвердити рішення', 'Шешімді растау'],
    to: ['Кому', 'To', 'Кому', 'Кімге'],
    network: ['Сеть', 'Network', 'Мережа', 'Желі'],
    toBuyer: ['Монеты покупателю', 'Coins to the buyer', 'Монети покупцю', 'Монеталар сатып алушыға'],
    toSeller: ['Вернуть продавцу', 'Back to the seller', 'Повернути продавцю', 'Сатушыға қайтару'],
    notePh: ['Решение, коротко', 'The decision, briefly', 'Рішення, коротко', 'Шешім, қысқаша'],
    password: ['Пароль кошелька', 'Wallet password', 'Пароль гаманця', 'Әмиян құпиясөзі'],
    newAd: ['Новое объявление', 'New ad', 'Нове оголошення', 'Жаңа хабарландыру'],
    editAd: ['Объявление', 'Ad', 'Оголошення', 'Хабарландыру'],
    iSell: ['Продаю', 'I sell', 'Продаю', 'Сатамын'],
    iBuy: ['Покупаю', 'I buy', 'Купую', 'Сатып аламын'],
    fixed: ['Фиксированная', 'Fixed', 'Фіксована', 'Тұрақты'],
    market: ['От рынка', 'From market', 'Від ринку', 'Нарықтан'],
    payWindow: ['Время на оплату', 'Time to pay', 'Час на оплату', 'Төлеу уақыты'],
    confirmOrders: ['Подтверждать заказы вручную', 'Confirm orders by hand', 'Підтверджувати замовлення вручну', 'Тапсырыстарды қолмен растау'],
    save: ['Сохранить', 'Save', 'Зберегти', 'Сақтау'],
    saved: ['Сохранено', 'Saved', 'Збережено', 'Сақталды'],
    paused: ['Пауза', 'Paused', 'Пауза', 'Кідіріс'],
    remove: ['Удалить', 'Remove', 'Видалити', 'Жою'],
    add: ['Добавить', 'Add', 'Додати', 'Қосу'],
    k_card: ['Карта банка', 'Bank card', 'Картка банку', 'Банк картасы'],
    k_sbp: ['СБП', 'SBP', 'СБП', 'СБП'],
    bankFind: ['Найти банк', 'Find a bank', 'Знайти банк', 'Банкті табу'],
    kindPick: ['Способ оплаты', 'Payment method', 'Спосіб оплати', 'Төлем тәсілі'],
    minutes: ['{n} мин', '{n} min', '{n} хв', '{n} мин'],
    noBank: ['Выберите банк', 'Choose a bank', 'Оберіть банк', 'Банкті таңдаңыз'],
    v_card: ['Номер карты', 'Card number', 'Номер картки', 'Карта нөмірі'],
    v_sbp: ['Телефон для СБП', 'Phone for SBP', 'Телефон для СБП', 'СБП телефоны'],
    e_none: ['Ничего не найдено', 'Nothing found', 'Нічого не знайдено', 'Ештеңе табылмады'],
    tgOnly: ['P2P работает в Telegram', 'P2P works inside Telegram', 'P2P працює в Telegram', 'P2P Telegram ішінде жұмыс істейді'],
    noWallet: ['Сначала создайте кошелёк', 'Create a wallet first', 'Спочатку створіть гаманець', 'Алдымен әмиян ашыңыз'],
    gasRow: ['Газ на выплату', 'Gas for the payout', 'Газ на виплату', 'Төлем газы'],
    walletElsewhere: ['Нужен кошелёк этой сделки {w}, его нет на этом устройстве', 'This deal needs its own wallet {w}, which is not on this device', 'Потрібен гаманець цієї угоди {w}, його немає на цьому пристрої', 'Осы мәміленің әмияны {w} керек, ол бұл құрылғыда жоқ'],
    halted: ['Выплаты остановлены: книга не сходится с сетью', 'Payouts are halted: the books differ from the chain', 'Виплати зупинено: книга не сходиться з мережею', 'Төлемдер тоқтады: кітап желімен сәйкес емес'],
    resume: ['Возобновить выплаты', 'Resume payouts', 'Відновити виплати', 'Төлемдерді жалғастыру'],
    mismatch: ['Данные сделки не совпали с проверенными. Ничего не подписано', 'The deal does not match what this app checks. Nothing was signed', 'Дані угоди не збіглися з перевіреними. Нічого не підписано', 'Мәміле деректері тексерілгенмен сәйкес емес. Ештеңеге қол қойылмады'],
    fail: ['Не получилось', 'Something went wrong', 'Не вдалося', 'Болмады'],
    soonTitle: ['P2P скоро', 'P2P soon', 'P2P скоро', 'P2P жақында'],

    myDeals: ['Мои сделки', 'My deals', 'Мої угоди', 'Менің мәмілелерім'],
    myP2P: ['Мой P2P', 'My P2P', 'Мій P2P', 'Менің P2P'],
    allBanks: ['Все банки', 'All banks', 'Усі банки', 'Барлық банктер'],
    bank: ['Банк', 'Bank', 'Банк', 'Банк'],
    allWays: ['Все способы', 'All methods', 'Усі способи', 'Барлық тәсілдер'],
    way: ['Способ', 'Method', 'Спосіб', 'Тәсіл'],
    sortT: ['Сортировка', 'Sort', 'Сортування', 'Сұрыптау'],
    sortBest: ['Сначала выгодные', 'Best price first', 'Спершу вигідні', 'Алдымен тиімділері'],
    sortBestSub: ['Цена лучше для вас', 'The price that suits you best', 'Ціна краща для вас', 'Сізге тиімді баға'],
    sortDeals: ['Больше сделок', 'Most deals', 'Більше угод', 'Мәміле көбірек'],
    sortRating: ['Выше оценка', 'Best rated', 'Вища оцінка', 'Бағасы жоғары'],
    headBest: ['сначала выгодные', 'best price first', 'спершу вигідні', 'алдымен тиімділері'],
    headDeals: ['больше сделок', 'most deals', 'більше угод', 'мәміле көбірек'],
    headRating: ['выше оценка', 'best rated', 'вища оцінка', 'бағасы жоғары'],
    amountT: ['Сумма сделки', 'Deal amount', 'Сума угоди', 'Мәміле сомасы'],
    amountLabel: ['Сколько рублей', 'How many roubles', 'Скільки рублів', 'Қанша рубль'],
    show: ['Показать', 'Show', 'Показати', 'Көрсету'],
    showN: ['Показать ({n})', 'Show ({n})', 'Показати ({n})', 'Көрсету ({n})'],
    banks_n: [{ one: '{n} банк', few: '{n} банка', other: '{n} банков' }, { one: '{n} bank', other: '{n} banks' }, { one: '{n} банк', few: '{n} банки', other: '{n} банків' }, { other: '{n} банк' }],
    reset: ['Сбросить', 'Reset', 'Скинути', 'Тазалау'],
    resetFilters: ['Сбросить фильтры', 'Reset the filters', 'Скинути фільтри', 'Сүзгілерді тазалау'],
    per1: ['за 1 {sym}', 'per 1 {sym}', 'за 1 {sym}', '1 {sym} үшін'],
    toMarket: ['{pct}\u00a0%', '{pct}%', '{pct}\u00a0%', '{pct}\u00a0%'],
    toMarketLong: ['{pct}\u00a0% \u043a \u0440\u044b\u043d\u043a\u0443', '{pct}% vs market', '{pct}\u00a0% \u0434\u043e \u0440\u0438\u043d\u043a\u0443', '\u043d\u0430\u0440\u044b\u049b\u049b\u0430 {pct}\u00a0%'],
    newbie: ['Новичок', 'New', 'Новачок', 'Жаңа'],
    good: ['{n}\u00a0%', '{n}%', '{n}\u00a0%', '{n}\u00a0%'],
    goodVotes: ['Хороших оценок', 'Good ratings', 'Добрих оцінок', 'Жақсы баға'],
    dealsCol: ['Сделок', 'Deals', 'Угод', 'Мәміле'],
    starsCol: ['Звёзды', 'Stars', 'Зірки', 'Жұлдыз'],
    limitCol: ['Лимит', 'Limit', 'Ліміт', 'Лимит'],
    availCol: ['Доступно', 'Available', 'Доступно', 'Қолжетімді'],
    buysUpTo: ['Купит до', 'Buys up to', 'Купить до', 'Сатып алады'],
    yourTurn: ['Ваш ход', 'Your move', 'Ваш хід', 'Сіздің кезегіңіз'],
    payCol: ['Оплата', 'Payment', 'Оплата', 'Төлем'],
    yourAd: ['Ваше объявление', 'Your ad', 'Ваше оголошення', 'Сіздің хабарландыруыңыз'],
    noneYetBuy: ['Пока никто не продаёт {sym}', 'Nobody sells {sym} yet', 'Поки ніхто не продає {sym}', 'Әзірге ешкім {sym} сатпайды'],
    noneYetSell: ['Пока никто не покупает {sym}', 'Nobody buys {sym} yet', 'Поки ніхто не купує {sym}', 'Әзірге ешкім {sym} сатып алмайды'],
    noneFilter: ['Ничего не найдено', 'Nothing found', 'Нічого не знайдено', 'Ештеңе табылмады'],
    createAd: ['Создать объявление', 'Make an ad', 'Створити оголошення', 'Хабарландыру жасау'],
    loadFail: ['Не удалось загрузить объявления', 'The ads did not load', 'Не вдалося завантажити оголошення', 'Хабарландырулар жүктелмеді'],
    retry: ['Повторить', 'Try again', 'Повторити', 'Қайталау'],
    rateFirstLine: ['Оцените прошлую сделку', 'Rate your last deal', 'Оцініть минулу угоду', 'Өткен мәмілені бағалаңыз'],
    rateGo: ['Оценить', 'Rate', 'Оцінити', 'Бағалау'],
    next: ['Далее', 'Next', 'Далі', 'Әрі қарай'],
    back: ['Назад', 'Back', 'Назад', 'Артқа'],
    all: ['Всё', 'All', 'Усе', 'Барлығы'],
    limitHint: ['{min}\u2060–\u2060{max} {fiat} · есть {avail}', '{min}\u2060–\u2060{max} {fiat} · {avail} left', '{min}\u2060–\u2060{max} {fiat} · є {avail}', '{min}\u2060–\u2060{max} {fiat} · бар {avail}'],
    availOnly: ['Доступно только {avail}', 'Only {avail} available', 'Доступно лише {avail}', 'Тек {avail} қолжетімді'],
    outOfLimits: ['Сумма должна быть от {min} до {max} {fiat}', 'The amount must be {min} to {max} {fiat}', 'Сума має бути від {min} до {max} {fiat}', 'Сома {min} мен {max} {fiat} аралығында болуы керек'],
    needMethod: ['Добавьте реквизиты для получения денег', 'Add the details to get the money to', 'Додайте реквізити для отримання грошей', 'Ақша алатын деректемелерді қосыңыз'],
    addDetails: ['Добавить реквизиты', 'Add payment details', 'Додати реквізити', 'Деректеме қосу'],
    buyerCardOnly: ['Только на карту', 'Cards only', 'Лише на картку', 'Тек картаға'],
    buyerSbpOnly: ['Только СБП', 'SBP only', 'Лише СБП', 'Тек СБП'],
    noFee: ['Без комиссии', 'No fee', 'Без комісії', 'Комиссиясыз'],
    feePart: ['Комиссия {pct}\u00a0%', 'Fee {pct}%', 'Комісія {pct}\u00a0%', 'Комиссия {pct}\u00a0%'],
    escrowBuy: ['Монеты в залоге', 'Coins in escrow', 'Монети в заставі', 'Монеталар кепілде'],
    escrowSell: ['Монеты уйдут в залог', 'Coins go to escrow', 'Монети підуть у заставу', 'Монеталар кепілге кетеді'],
    reviewT: ['Проверьте сделку', 'Check the deal', 'Перевірте угоду', 'Мәмілені тексеріңіз'],
    exactNote: ['Уточнится при открытии', 'Exact once it opens', 'Уточниться під час відкриття', 'Ашылғанда нақтыланады'],
    kb: ['{n} КБ', '{n} KB', '{n} КБ', '{n} КБ'],
    mb: ['{n} МБ', '{n} MB', '{n} МБ', '{n} МБ'],
    help: ['Подробнее', 'More', 'Докладніше', 'Толығырақ'],
    buyTitle: ['Купить {sym}', 'Buy {sym}', 'Купити {sym}', '{sym} сатып алу'],
    sellTitle: ['Продать {sym}', 'Sell {sym}', 'Продати {sym}', '{sym} сату'],
    buyRow: ['Покупка {sum}', 'Buying {sum}', 'Купівля {sum}', 'Сатып алу {sum}'],
    sellRow: ['Продажа {sum}', 'Selling {sum}', 'Продаж {sum}', 'Сату {sum}'],
    swapUnit: ['Сменить рубли на монеты', 'Switch roubles and coins', 'Змінити рублі на монети', 'Рубль мен монетаны ауыстыру'],
    pickedNone: ['Выберите, куда платить', 'Choose where to pay', 'Оберіть, куди платити', 'Қайда төлейтініңізді таңдаңыз'],
    blockQ: ['Заблокировать {name}?', 'Block {name}?', 'Заблокувати {name}?', '{name} бұғаттау керек пе?'],
    blockText: ['Скроет объявления, без отмены', 'Hides the ads, no undo', 'Приховає оголошення, без скасування', 'Хабарландыруды жасырады, қайтарылмайды'],
    cancelShort: ['Отмена', 'Cancel', 'Скасувати', 'Болдырмау'],
    demoNote: ['Пример: ничего не подписывается', 'Preview: nothing is signed', 'Приклад: нічого не підписується', 'Үлгі: ештеңеге қол қойылмайды'],
    demoSigned: ['Пример: ничего не подписано', 'Preview: nothing was signed', 'Приклад: нічого не підписано', 'Үлгі: ештеңеге қол қойылмады'],

    e_p2p_paused: ['P2P на паузе', 'P2P is paused', 'P2P на паузі', 'P2P уақытша тоқтатылды'],
    e_receipt_needed: ['Сначала приложите чек', 'Attach the receipt first', 'Спочатку додайте чек', 'Алдымен чекті тіркеңіз'],
    e_rate_first: ['Сначала оцените прошлую сделку', 'Rate your last deal first', 'Спочатку оцініть минулу угоду', 'Алдымен өткен мәмілені бағалаңыз'],
    e_volume_locked: ['Объём не изменить', 'Volume is fixed', 'Обсяг не змінити', 'Көлем өзгермейді'],
    e_not_funded: ['Сначала внесите монеты объявления', 'Deposit the ad\'s coins first', 'Спочатку внесіть монети оголошення', 'Алдымен хабарландыру монеталарын салыңыз'],
    e_pool_short: ['В объявлении не хватает монет', 'Not enough coins left in the ad', 'В оголошенні бракує монет', 'Хабарландыруда монета жетпейді'],
    e_pool_gas: ['Площадке не хватает газа на эту сделку, попробуйте через пару минут', 'The platform is short of gas for this deal, try again in a few minutes', 'Майданчику бракує газу на цю угоду, спробуйте за кілька хвилин', 'Алаңда бұл мәмілеге газ жетпейді, бірнеше минуттан кейін қайталаңыз'],
    e_stale_login: ['Откройте приложение заново', 'Open the app again', 'Відкрийте застосунок знову', 'Қолданбаны қайта ашыңыз'],
    e_bad_login: ['Обновите Telegram', 'Update Telegram', 'Оновіть Telegram', 'Telegram-ды жаңартыңыз'],
    e_already_decided: ['По этой сделке уже есть решение', 'This deal is already decided', 'За цією угодою вже є рішення', 'Бұл мәміле бойынша шешім бар'],
    e_rate_limited: ['Слишком часто, подождите', 'Too fast, wait a moment', 'Занадто часто, зачекайте', 'Тым жиі, күте тұрыңыз'],
    e_banned: ['Доступ к P2P закрыт', 'P2P access is closed', 'Доступ до P2P закрито', 'P2P қолжетімсіз'],
    e_blocked: ['Вы заблокировали друг друга', 'One of you blocked the other', 'Ви заблокували одне одного', 'Бір-біріңізді бұғаттадыңыз'],
    e_cooldown: ['Слишком много отмен, попробуйте завтра', 'Too many cancels, try tomorrow', 'Забагато скасувань, спробуйте завтра', 'Тым көп болдырмау, ертең көріңіз'],
    e_too_many_deals: ['Слишком много открытых сделок', 'Too many open deals', 'Забагато відкритих угод', 'Ашық мәміле тым көп'],
    e_already_open: ['По этому объявлению уже есть сделка', 'You already have a deal on this ad', 'За цим оголошенням уже є угода', 'Бұл хабарландыру бойынша мәміле бар'],
    e_bad_amount: ['Сумма вне лимитов', 'Amount outside the limits', 'Сума поза лімітами', 'Сома лимиттен тыс'],
    e_not_enough: ['Не хватает объёма', 'Not enough volume', 'Не вистачає обсягу', 'Көлем жетпейді'],
    e_no_price: ['Нет цены рынка', 'No market price', 'Немає ціни ринку', 'Нарық бағасы жоқ'],
    e_limit_deal: ['Сумма выше лимита площадки', 'Above the platform limit', 'Сума вища за ліміт майданчика', 'Алаң лимитінен жоғары'],
    e_escrow_down: ['Кошелёк площадки не отвечает', 'The platform wallet does not answer', 'Гаманець майданчика не відповідає', 'Алаң әмияны жауап бермейді'],
    e_deposit_sent: ['Перевод уже отправлен', 'The transfer is already sent', 'Переказ уже надіслано', 'Аударым жіберілген'],
    e_bad_signature: ['Подпись не принята', 'Signature refused', 'Підпис не прийнято', 'Қолтаңба қабылданбады'],
    e_no_methods: ['Нет реквизитов', 'No payment details', 'Немає реквізитів', 'Деректеме жоқ'],
    e_bad_value: ['Проверьте номер', 'Check the number', 'Перевірте номер', 'Нөмірді тексеріңіз'],
    e_bad_address: ['Адрес кошелька не подходит', 'Wallet address not accepted', 'Адреса гаманця не підходить', 'Әмиян мекенжайы жарамсыз'],
    e_file_too_large: ['Файл больше 15 МБ', 'File over 15 MB', 'Файл більший за 15 МБ', 'Файл 15 МБ-тан үлкен'],
    e_bad_file: ['Только фото или PDF', 'Photos or PDF only', 'Лише фото або PDF', 'Тек фото не PDF'],
    e_too_many_files: ['В сделке уже много файлов', 'This deal has too many files', 'В угоді вже багато файлів', 'Мәміледе файл тым көп'],
    e_upload_failed: ['Файл не загрузился, попробуйте ещё раз', 'The file did not upload, try again', 'Файл не завантажився, спробуйте ще раз', 'Файл жүктелмеді, қайталаңыз'],
    e_no_file: ['Файл не найден', 'File not found', 'Файл не знайдено', 'Файл табылмады'],
    e_insufficient_gas: ['Не хватает GRAM на перевод и газ', 'Not enough GRAM for the transfer and gas', 'Не вистачає GRAM на переказ і газ', 'Аударым мен газға GRAM жетпейді'],
    e_short: ['Не хватает {sum}', 'You need {sum} more', 'Не вистачає {sum}', '{sum} жетпейді'],
    e_shortAnd: [' и ', ' and ', ' і ', ' және '],
    e_too_much: ['Недостаточно монет', 'Not enough coins', 'Недостатньо монет', 'Монета жеткіліксіз'],
    e_pending: ['Прошлый перевод ещё в пути', 'The last transfer is still on its way', 'Попередній переказ ще в дорозі', 'Алдыңғы аударым әлі жолда'],
    e_too_many_ads: ['Можно держать до 10 объявлений', 'You can keep up to 10 ads', 'Можна тримати до 10 оголошень', '10 хабарландыруға дейін ұстауға болады'],
    e_too_many_methods: ['Можно сохранить до 10 реквизитов', 'You can save up to 10 payment details', 'Можна зберегти до 10 реквізитів', '10 деректемеге дейін сақтауға болады'],
    e_bad_price: ['Проверьте цену', 'Check the price', 'Перевірте ціну', 'Бағаны тексеріңіз'],
    e_bad_limits: ['Проверьте лимиты', 'Check the limits', 'Перевірте ліміти', 'Лимиттерді тексеріңіз'],
    e_bad_available: ['Проверьте объём', 'Check the volume', 'Перевірте обсяг', 'Көлемді тексеріңіз'],
    e_bad_methods: ['Выберите способ оплаты', 'Choose a payment method', 'Оберіть спосіб оплати', 'Төлем тәсілін таңдаңыз'],
    e_bad_minutes: ['Выберите время на оплату', 'Choose the time to pay', 'Оберіть час на оплату', 'Төлеу уақытын таңдаңыз'],
    e_bad_text: ['Напишите, что случилось', 'Write what happened', 'Напишіть, що сталося', 'Не болғанын жазыңыз'],
    e_no_ad: ['Объявление уже снято', 'The ad is gone', 'Оголошення вже знято', 'Хабарландыру алынып тасталды'],
    e_one_per_section: ['Такое объявление у вас уже есть', 'You already have an ad like this', 'Таке оголошення у вас уже є', 'Мұндай хабарландыру сізде бар'],
    e_ad_has_deal: ['По объявлению идёт сделка', 'A deal on this ad is running', 'За оголошенням триває угода', 'Хабарландыру бойынша мәміле жүріп жатыр'],
    e_receipt_strikes: ['Покупки закрыты из-за отклонённых чеков. Напишите арбитру @devpool', 'Buying is closed because of rejected receipts. Write to the arbiter @devpool', 'Купівлі закрито через відхилені чеки. Напишіть арбітру @devpool', 'Қабылданбаған чектерге байланысты сатып алу жабық. Арбитрге жазыңыз: @devpool'],
    e_no_tries: ['Попытки загрузить чек закончились. Откройте спор', 'No receipt tries left. Open a dispute', 'Спроби завантажити чек закінчилися. Відкрийте спір', 'Чек жүктеу әрекеттері бітті. Дау ашыңыз'],
    e_too_many_parts: ['Больше частей оплаты добавить нельзя', 'No more payment parts can be added', 'Більше частин оплати додати не можна', 'Төлемнің басқа бөлігін қосуға болмайды'],
    e_appeal_over: ['Срок жалобы прошёл. Напишите арбитру @devpool', 'The appeal window is over. Write to the arbiter @devpool', 'Строк скарги минув. Напишіть арбітру @devpool', 'Шағым мерзімі өтті. Арбитрге жазыңыз: @devpool'],
    e_already_appealed: ['Жалоба уже подана', 'The appeal is already filed', 'Скаргу вже подано', 'Шағым берілген'],
    e_own_deal: ['Это ваша сделка: решает другой арбитр', 'This is your own deal: another arbiter decides', 'Це ваша угода: вирішує інший арбітр', 'Бұл өз мәмілеңіз: басқа арбитр шешеді'],
    e_already_labelled: ['Отметка уже стоит', 'Already marked', 'Позначку вже поставлено', 'Белгі қойылған'],
    refreshing: ['Обновляется', 'Updating', 'Оновлюється', 'Жаңартылуда']
  };
  const col = () => Math.max(0, LANGS.indexOf(CK.i18n.lang));
  function t(key, params) {
    const row = S[key];
    if (!row) return typeof CK.t === 'function' ? CK.t(key, params) : key;
    let text = row[col()];
    if (text == null) text = row[0];
    if (typeof text === 'object') {
      const n = params && params.n !== undefined ? Number(params.n) : 0;
      text = text[new Intl.PluralRules(CK.i18n.lang).select(n)] || text.other;
    }
    return params ? text.replace(/\{(\w+)\}/g, (whole, name) => (Object.prototype.hasOwnProperty.call(params, name) ? params[name] : whole)) : text;
  }
  const errorText = (code) => (S['e_' + code] ? t('e_' + code) : t('fail'));
  function shortText(short) {
    const sums = short.map((s) => {
      const cut = s.decimals > 4 ? 10n ** BigInt(s.decimals - 4) : 1n;
      return coinsText((((BigInt(s.units) + cut - 1n) / cut) * cut).toString(), s.decimals, s.symbol);
    });
    return t('e_short', { sum: sums.join(t('e_shortAnd')) });
  }
  const EMPTY_WALLET = new Set(['insufficient_gas', 'address_mismatch']);
  function oops(err) {
    if (CK.wallet && CK.wallet.isRejection && CK.wallet.isRejection(err)) return;
    CK.haptic.error();
    const short = err && (err.code === 'insufficient_gas' || err.code === 'insufficient_balance') && Array.isArray(err.short) && err.short.length ? shortText(err.short) : '';
    const emptyWallet = err && (err.code === 'insufficient_gas' || (err.code === 'send_unsure' && EMPTY_WALLET.has(err.refused)));
    const words = short || (emptyWallet ? t('e_insufficient_gas') : err && err.code === 'mismatch' ? t('mismatch') : err && err.code === 'wallet_elsewhere' ? t('walletElsewhere', { w: shortAddr(err.wallet) }) : errorText(err && err.code));
    CK.toast(esc(words), { icon: 'warning', tone: 'down' });
  }
  const fail = (code) => Object.assign(new Error(code), { code });
  const rolledText = (text, cls) => `<b class="${cls}" data-roll="${esc(text)}">${esc(text)}</b>`;
  function rollIn(root) {
    if (!CK.roll || !root) return;
    root.querySelectorAll('[data-roll]').forEach((el) => {
      const text = el.getAttribute('data-roll');
      el.removeAttribute('data-roll');
      el.textContent = '';
      CK.roll(el, text);
    });
  }

  const cssVar = (name, fallback) => {
    try { return (getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim() || fallback; } catch (_) { return fallback; }
  };
  const EASE_OUT = 'cubic-bezier(.22, 1, .36, 1)';
  const EASE_IOS = 'cubic-bezier(.32, .72, 0, 1)';
  const ORDER_DETENT = .84;
  let springNow = '';
  const SPRING = () => springNow || (springNow = cssVar('--spring', EASE_OUT));
  function play(el, frames, opts) {
    if (!el || !el.animate || (typeof CK.reducedMotion === 'function' && CK.reducedMotion())) return null;
    try { return el.animate(frames, opts); } catch (_) {
      try { return el.animate(frames, { ...opts, easing: EASE_OUT }); } catch (__) { return null; }
    }
  }

  const NBSP = '\u00a0';
  function numText(text, places) {
    const [whole, frac = ''] = String(text).split('.');
    const en = CK.i18n.lang === 'en';
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : NBSP);
    const cut = places === undefined ? frac.replace(/0+$/, '') : frac.padEnd(places, '0').slice(0, places);
    return cut ? grouped + (en ? '.' : ',') + cut : grouped;
  }
  function unitsText(units, decimals, places) {
    const v = BigInt(units), scale = 10n ** BigInt(decimals);
    const frac = (v % scale).toString().padStart(decimals, '0').slice(0, places === undefined ? 6 : places);
    return numText(`${v / scale}.${frac}`);
  }
  const symText = (s) => Array.from(String(s || '?').replace(/[^\p{L}\p{N}$_-]/gu, '')).slice(0, 12).join('') || '?';
  const coinsText = (units, decimals, symbol) => `${unitsText(units, decimals)}${NBSP}${symText(symbol)}`;
  const coinsShort = (units, decimals, symbol, places) => {
    const whole = BigInt(units) / 10n ** BigInt(decimals);
    return `${unitsText(units, decimals, whole > 0n ? (places === undefined ? 4 : places) : 6)}${NBSP}${symText(symbol)}`;
  };
  const FIAT_SIGN = { RUB: '₽' };
  const fiatSign = (fiat) => FIAT_SIGN[fiat] || fiat;
  const moneyText = (amount, fiat) => `${numText(amount, 2)}${NBSP}${fiatSign(fiat)}`;
  const rubText = (amount, fiat) => `${numText(amount)}${NBSP}${fiatSign(fiat || FIAT)}`;
  const sumText = (amount, fiat) => (/^\d+(\.0+)?$/.test(String(amount)) ? `${numText(String(amount).split('.')[0])}${NBSP}${fiatSign(fiat || FIAT)}` : moneyText(amount, fiat || FIAT));
  const limitsText = (min, max, fiat) => `${numText(min)} – ${numText(max)}${NBSP}${fiatSign(fiat)}`;
  const COMPACT_UNITS = { en: ['K', 'M', 'B'], other: ['К', 'М', 'Б'] };
  function compactText(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return String(value);
    const a = Math.abs(v);
    if (a < 1000) {
      const [whole, frac = ''] = String(a.toFixed(6)).split('.');
      return (v < 0 ? '−' : '') + numText(`${whole}.${frac.slice(0, 2)}`);
    }
    if (CK.fmt && typeof CK.fmt.compact === 'function') {
      try { const out = CK.fmt.compact(v, { digits: 1 }); if (typeof out === 'string' && out) return out; } catch (_) { }
    }
    const en = CK.i18n.lang === 'en';
    const steps = [1e3, 1e6, 1e9];
    let i = a >= 1e9 ? 2 : a >= 1e6 ? 1 : 0;
    let r = Math.round((a / steps[i]) * 10) / 10;
    if (r >= 1000 && i < 2) { i += 1; r = Math.round((a / steps[i]) * 10) / 10; }
    return (v < 0 ? '−' : '') + String(r).replace('.', en ? '.' : ',') + (en ? COMPACT_UNITS.en : COMPACT_UNITS.other)[i];
  }
  function approxUnits(units, decimals) {
    const v = BigInt(units);
    if (v <= 0n) return '0';
    const scale = 10n ** BigInt(decimals);
    const whole = v / scale;
    let places = whole > 0n ? Math.max(0, 4 - whole.toString().length) : (v % scale).toString().padStart(decimals, '0').search(/[1-9]/) + 4;
    places = Math.min(places, decimals);
    const cut = 10n ** BigInt(decimals - places);
    const r = ((v + cut / 2n) / cut).toString().padStart(places + 1, '0');
    return numText(places ? `${r.slice(0, -places)}.${r.slice(-places)}` : r);
  }
  const coinsApprox = (units, decimals, symbol) => `${approxUnits(units, decimals)}${NBSP}${symText(symbol)}`;
  const rubShort = (amount, fiat) => `${compactText(amount)}${NBSP}${fiatSign(fiat || FIAT)}`;
  const limitsShort = (min, max, fiat) => `${compactText(min)}\u2060–\u2060${compactText(max)}${NBSP}${fiatSign(fiat || FIAT)}`;
  const coinsCompact = (units, decimals, symbol) => `${compactText(unitsPlain(units, decimals))}${NBSP}${symText(symbol)}`;
  function sizeText(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024 * 1024) return t('kb', { n: numText(String(Math.max(1, Math.round(n / 1024)))) });
    return t('mb', { n: numText((Math.round(n / 1024 / 1024 * 10) / 10).toFixed(1).replace(/\.0$/, '')) });
  }
  let helpSeq = 0;
  function help(key, params, fixedId) {
    helpSeq += 1;
    const id = fixedId || 'p2p-help-' + helpSeq;
    return [`<button class="p2p-q press" type="button" aria-expanded="false" aria-controls="${id}" aria-label="${esc(t('help'))}">?</button>`, `<p class="p2p-note p2p-helptext" id="${id}" hidden>${esc(t(key, params))}</p>`];
  }
  function toggleHelp(btn) {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
    box.hidden = !box.hidden;
    btn.setAttribute('aria-expanded', String(!box.hidden));
    if (!box.hidden) play(box, [{ opacity: 0, transform: 'translate3d(0, -4px, 0)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE_OUT });
    CK.haptic.selection();
  }
  const why = (text) => `<button class="p2p-whyi press" type="button" data-p2p-why="${esc(text)}" aria-label="${esc(text)}">${icon('info', { size: 16 })}</button>`;
  function whyToast(btn) {
    const text = btn.getAttribute('data-p2p-why') || '';
    if (!text) return;
    CK.haptic.light();
    CK.toast(esc(text), { icon: 'info', tone: 'accent', ms: Math.min(7000, Math.max(2000, 1000 + text.length * 30)) });
  }
  let foldSeq = 0;
  const foldOpen = new Map();
  const foldId = (name) => name || 'p2p-fold-' + (++foldSeq);
  function fold(summaryHtml, bodyHtml, o) {
    const opts = o || {};
    const id = foldId(opts.id);
    return `<button class="fold-toggle${opts.cls ? ' ' + opts.cls : ''}" type="button" data-p2p-fold aria-expanded="false" aria-controls="${id}">${summaryHtml}${icon('chevron-down', { size: 16 })}</button><div class="fold-body${opts.bodyCls ? ' ' + opts.bodyCls : ''}" id="${id}" hidden>${bodyHtml}</div>`;
  }
  const foldRow = (label, valueHtml) => `<div class="fold-row"><span>${esc(label)}</span><span>${valueHtml}</span></div>`;
  function setFold(root, id, open) {
    const box = root.querySelector(`#${id}`);
    if (!box) return null;
    box.hidden = !open;
    root.querySelectorAll(`[aria-controls="${id}"][data-p2p-fold]`).forEach((b) => b.setAttribute('aria-expanded', String(open)));
    return box;
  }
  function toggleFold(btn) {
    const id = btn.getAttribute('aria-controls');
    const box = id && document.getElementById(id);
    if (!box) return;
    const open = box.hidden;
    foldOpen.set(id, open);
    setFold(document, id, open);
    if (open) play(box, [{ opacity: 0, transform: 'translate3d(0, -4px, 0)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE_OUT });
    CK.haptic.selection();
    btn.dispatchEvent(new CustomEvent('p2p-fold', { bubbles: true, detail: { id, open } }));
  }
  function applyFolds(root) {
    foldOpen.forEach((open, id) => { if (open) setFold(root, id, true); });
  }
  let docBound = false;
  function bindDoc() {
    if (docBound || typeof document === 'undefined' || !document.addEventListener) return;
    docBound = true;
    document.addEventListener('click', (e) => {
      const at = e.target && e.target.closest ? e.target : null;
      if (!at) return;
      const q = at.closest('.p2p-q');
      if (q) return void toggleHelp(q);
      const w = at.closest('[data-p2p-why]');
      if (w) return void whyToast(w);
      const f = at.closest('[data-p2p-fold]');
      if (f) toggleFold(f);
    });
  }
  const lowerFirst = (s) => (s ? s.charAt(0).toLocaleLowerCase(CK.i18n.lang) + s.slice(1) : s);
  const priceText = (price, fiat) => {
    if (price === null) return '—';
    const [whole, frac = ''] = String(price).split('.');
    return Number(price) >= 1 ? moneyText(price, fiat) : `${numText(`${whole}.${frac.slice(0, 6)}`)}${NBSP}${fiatSign(fiat)}`;
  };
  const unitsPlain = (units, decimals) => {
    const v = BigInt(units), scale = 10n ** BigInt(decimals);
    const frac = (v % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
    return frac ? `${v / scale}.${frac}` : String(v / scale);
  };
  function shortAddr(a) {
    return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
  }
  const dealsText = (n) => t('deals_n', { n });
  const starsText = (p) => (p && p.votes ? `★ ${numText(String(p.stars))} (${p.votes})` : '');
  const personText = (p) => (p ? [p.name, starsText(p), dealsText(p.done)].filter(Boolean).join(' · ') : '');
  const trustText = (p) => (p ? [dealsText(p.done), p.rating !== null && p.rating !== undefined ? t('good', { n: p.rating }) : ''].filter(Boolean).join(' · ') : '');
  const parts = (items, cls) => `<span class="p2p-parts${cls ? ' ' + cls : ''}">${items.filter(Boolean).map((x) => `<span>${typeof x === 'object' ? x.html : esc(x)}</span>`).join('')}</span>`;
  const trustParts = (p) => (p ? [dealsText(p.done)] : []);
  const statsLine = (p) => [dealsText((p && p.done) || 0), p && p.votes ? `★${NBSP}${numText(String(p.stars))}` : ''].filter(Boolean).join(' · ');
  const statsRows = (p) => [
    foldRow(t('dealsCol'), esc(String((p && p.done) || 0))),
    foldRow(t('goodVotes'), p && p.rating !== null && p.rating !== undefined ? esc(t('good', { n: p.rating })) : '—'),
    foldRow(t('starsCol'), p && p.votes ? `<span class="p2p-star-mini">★</span> ${esc(numText(String(p.stars)))} <span class="p2p-dim">(${esc(String(p.votes))})</span>` : '—')
  ].join('');
  function pctText(v) {
    const r = Math.round(v * 10) / 10;
    if (!r) return '0';
    return (r < 0 ? '−' : '+') + numText(Math.abs(r).toFixed(1), 1);
  }
  const floor2 = (x) => (Math.floor(x * 100 + 1e-7) / 100).toFixed(2);
  const typed = (v) => {
    const s = String(v || '').replace(/[\s\u00a0]/g, '').replace(',', '.').replace('−', '-');
    return /^-?\d+(\.\d+)?$/.test(s) ? s : '';
  };
  const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

  let SAMPLE = null;
  const loginData = () => CK.market.ready.then(() => (CK.market.mode === 'live' ? CK.tg.whenInitData() : ''));
  function call(path, body) {
    if (SAMPLE) return SAMPLE.call(path, body);
    return loginData().then((initData) => {
      if (!initData) throw fail('tg_only');
      const init = body
        ? { method: 'POST', headers: { Authorization: 'tma ' + initData, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, language: CK.i18n.lang }), cache: 'no-store' }
        : { headers: { Authorization: 'tma ' + initData }, cache: 'no-store' };
      return fetch('api/p2p/' + path, init).then((res) => res.json().catch(() => null)).then((json) => {
        if (!json || json.ok !== true) throw Object.assign(fail((json && typeof json.error === 'string' && json.error) || 'bad_response'), { data: json || null });
        return json;
      });
    });
  }
  let configJob = null;
  const config = () => {
    if (!configJob) configJob = call('config').catch((err) => { configJob = null; throw err; });
    return configJob;
  };
  const pictures = new Map();
  function fileOf(dealId, fileId) {
    if (SAMPLE) return SAMPLE.fileOf(dealId, fileId);
    const key = dealId + ':' + fileId;
    if (!pictures.has(key)) {
      pictures.set(key, loginData().then((initData) => fetch(`api/p2p/file?deal=${encodeURIComponent(dealId)}&id=${encodeURIComponent(fileId)}`, { headers: { Authorization: 'tma ' + initData }, cache: 'no-store' }))
        .then((res) => (res.ok ? res.blob() : Promise.reject(fail('no_file'))))
        .then((blob) => ({ url: URL.createObjectURL(blob), type: String(blob.type || '').toLowerCase(), size: blob.size }))
        .catch((err) => { pictures.delete(key); throw err; }));
    }
    return pictures.get(key);
  }
  const picture = (dealId, fileId) => fileOf(dealId, fileId).then((f) => f.url);
  function fileKind(file) {
    if (!file) throw fail('bad_file');
    let type = String(file.type || '').toLowerCase();
    if (type === 'image/heif') type = 'image/heic';
    if (type === 'image/jpg') type = 'image/jpeg';
    if (!type) type = FILE_EXT[String(file.name || '').toLowerCase().split('.').pop()] || '';
    if (!FILE_TYPES.includes(type)) throw fail('bad_file');
    if (!(file.size > 0)) throw fail('bad_file');
    if (file.size > FILE_MAX) throw fail('file_too_large');
    return type;
  }
  function upload(dealId, file, onProgress, purpose) {
    let type;
    try { type = fileKind(file); } catch (err) { return Promise.reject(err); }
    const why = purpose === 'receipt' || purpose === 'appeal' ? purpose : '';
    if (SAMPLE) return SAMPLE.upload(dealId, file, type, onProgress, why).then((id) => ({ id, type, size: file.size }));
    return loginData().then((initData) => new Promise((resolve, reject) => {
      if (!initData) return reject(fail('tg_only'));
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `api/p2p/file?deal=${encodeURIComponent(dealId)}${why ? '&purpose=' + why : ''}`);
      xhr.setRequestHeader('Authorization', 'tma ' + initData);
      xhr.setRequestHeader('Content-Type', type);
      xhr.timeout = 180000;
      if (xhr.upload && onProgress) xhr.upload.onprogress = (e) => { if (e.lengthComputable && e.total) onProgress(Math.min(1, e.loaded / e.total)); };
      xhr.onload = () => {
        let json = null;
        try { json = JSON.parse(xhr.responseText); } catch (_) { json = null; }
        if (json && json.ok === true && typeof json.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(json.id)) return resolve({ id: json.id, type, size: file.size });
        return reject(fail((json && typeof json.error === 'string' && json.error) || (xhr.status === 413 ? 'file_too_large' : 'upload_failed')));
      };
      xhr.onerror = () => reject(fail('upload_failed'));
      xhr.ontimeout = () => reject(fail('upload_failed'));
      xhr.send(file);
      return undefined;
    }));
  }
  const links = new Map();
  const LINK_REUSE_MS = 3 * 60 * 1000;
  function warmLink(dealId, fileId, dl) {
    if (SAMPLE) return Promise.resolve(null);
    const key = `${dealId}:${fileId}:${dl ? 1 : 0}`;
    const had = links.get(key);
    if (had && Date.now() - had.at < LINK_REUSE_MS) return had.job;
    const one = { at: Date.now(), url: null, job: null };
    one.job = call('file/link', { deal: dealId, id: fileId, dl: !!dl }).then((res) => {
      one.url = new URL(String(res.url || ''), location.href).href;
      return one.url;
    }).catch((err) => { links.delete(key); throw err; });
    links.set(key, one);
    return one.job;
  }
  function openBlob(url, type) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.download = type === 'application/pdf' ? 'receipt.pdf' : 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function openFile(dealId, fileId, type) {
    if (SAMPLE) return fileOf(dealId, fileId).then((f) => openBlob(f.url, f.type));
    const dl = type !== 'application/pdf';
    const key = `${dealId}:${fileId}:${dl ? 1 : 0}`;
    const ready = links.get(key);
    if (ready && ready.url && Date.now() - ready.at < LINK_REUSE_MS) return Promise.resolve(CK.ton.openLink(ready.url));
    return warmLink(dealId, fileId, dl).then((url) => CK.ton.openLink(url));
  }
  const ownWallet = () => Promise.resolve(SAMPLE ? SAMPLE.wallet : CK.ton.wallet && CK.ton.wallet.address ? CK.ton.wallet.address : null);
  const pinnedCoin = (coin) => Object.prototype.hasOwnProperty.call(Audit.pins.coins, coin);
  function useWallet(address) {
    const active = CK.ton.wallet && CK.ton.wallet.address;
    if (active === address) return active;
    const row = CK.wallet.wallets.list().find((w) => w.address === address && w.here);
    if (!row) throw Object.assign(fail('wallet_elsewhere'), { wallet: address });
    CK.wallet.wallets.switchTo(row.address);
    return row.address;
  }

  const DEPOSIT_HOLD_MS = 3 * 60 * 1000;
  const heldDeposits = new Map();
  function holdDeposit(key, validUntil) {
    heldDeposits.set(key, Math.max(Date.now(), (Number(validUntil) || 0) * 1000) + DEPOSIT_HOLD_MS);
  }
  function depositHeld(key) {
    const until = heldDeposits.get(key);
    if (!until) return false;
    if (Date.now() < until) return true;
    heldDeposits.delete(key);
    return false;
  }

  async function unlocked(ask, fn) {
    for (;;) {
      const password = CK.wallet && CK.wallet.status && CK.wallet.status.method === 'password' ? await ask() : undefined;
      if (password === null) return null;
      try {
        return await fn(password ? { password } : undefined);
      } catch (err) {
        if (err.code !== 'wrong_password') throw err;
        CK.haptic.error();
      }
    }
  }


  const FIAT = 'RUB';
  const DEAL_OVER = new Set(['released', 'resolved_to_buyer', 'resolved_to_seller', 'cancelled', 'expired']);
  const dealActive = (d) => !DEAL_OVER.has(d.status) && d.status !== 'fined';
  const kindName = (k) => t('k_' + k);
  const tag = (text, tone) => `<span class="tag${tone ? ' tag--' + tone : ''}">${esc(text)}</span>`;
  const statusTone = (s) => (s === 'released' || s.startsWith('resolved') ? 'up' : s === 'disputed' || s === 'fined' ? 'down' : s === 'cancelled' || s === 'expired' ? '' : 'accent');
  const empty = (key, ic, o) => CK.emptyState({ icon: ic || 'users', title: t(key), text: o && o.text, actions: o && o.actions, className: 'p2p-empty' });
  const mark = (ic, tone, size) => `<span class="tile tile--${tone || 'blue'} p2p-tile p2p-tile--${size || 32}" aria-hidden="true">${icon(ic, { fill: true, size: Math.round((size || 32) * .6) })}</span>`;
  const bankLogo = (name, size) => (CK.bankLogos && name ? CK.bankLogos.bank(name, size) : '');
  const payLogo = (kind, size) => (CK.bankLogos && kind ? CK.bankLogos.pay(kind, size) : '');
  const methodLogo = (m, size) => (m && m.bank ? bankLogo(m.bank, size) : payLogo(m && m.kind, size));
  const logoStack = (list, size) => (list.length ? `<span class="p2p-logos p2p-logos--${size}">${list.join('')}</span>` : '');
  const AVA_TONES = ['blue', 'green', 'orange', 'purple', 'teal', 'pink', 'indigo'];
  function ava(p, size) {
    const name = String((p && p.name) || '?').replace(/^@/, '');
    const letter = (Array.from(name)[0] || '?').toUpperCase();
    let h = 0;
    for (const ch of String((p && p.pid) || name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `<span class="tile tile--${AVA_TONES[h % AVA_TONES.length]} p2p-ava p2p-ava--${size || 28}" aria-hidden="true">${esc(letter)}</span>`;
  }
  function myAva(size) {
    return `<span class="tile p2p-ava p2p-ava--${size || 28} p2p-ava--me" aria-hidden="true"><span class="hd-face" data-hd-face></span></span>`;
  }
  function trustHtml(p, o) {
    const opts = o || {};
    const stars = p && p.votes && opts.stars ? { html: `<span class="p2p-star-mini">★</span> ${esc(numText(String(p.stars)))}` } : '';
    return `<span class="p2p-trust"><span class="p2p-trust-name"><b>${esc(p ? p.name : '—')}</b>${p && p.done < 3 ? tag(t('newbie')) : ''}</span>${parts(trustParts(p).concat(stars), 'p2p-trust-sub')}</span>`;
  }
  const demoNote = () => (SAMPLE ? `<p class="p2p-demo">${icon('info', { size: 14 })}<span>${esc(t('demoNote'))}</span></p>` : '');
  const skelCard = () => `<div class="p2p-ad p2p-skelcard" aria-hidden="true"><span class="skel p2p-sk-price"></span><span class="skel p2p-sk-line"></span><span class="skel p2p-sk-short"></span></div>`;
  const skelRows = (n) => `<div class="group" aria-hidden="true">${Array.from({ length: n }, () => '<div class="cell"><span class="skel p2p-sk-tile"></span><span class="cell-main"><span class="skel p2p-sk-line"></span><span class="skel p2p-sk-short"></span></span></div>').join('')}</div>`;
  const errorCard = (code, key) => `<div class="card p2p-card p2p-error"><div class="empty p2p-empty">${icon('warning')}<b>${esc(t(key || 'loadFail'))}</b><span>${esc(code === 'tg_only' ? t('tgOnly') : errorText(code))}</span><button class="btn btn--small btn--tinted press" type="button" data-retry>${esc(t('retry'))}</button></div></div>`;
  const copyRow = (label, shown, copy, big, lead) => `<button class="cell press-row p2p-copyrow${lead ? ' p2p-logorow' : ''}" type="button" data-copy="${esc(copy)}">${lead || ''}<span class="cell-main"><span class="cell-sub">${esc(label)}</span><span class="p2p-copyval${big ? ' p2p-copyval--big' : ''}">${esc(shown)}</span></span><span class="p2p-copyicon">${icon('copy', { size: 18 })}</span></button>`;
  function copyFrom(el) {
    CK.copyText(el.dataset.copy);
    CK.haptic.light();
    CK.toast(esc(t('copied')), { icon: 'copy', tone: 'accent' });
    const box = el.querySelector('.p2p-copyicon');
    if (!box) return;
    const swap = (ic) => {
      box.innerHTML = icon(ic, { size: 18 });
      const svg = box.firstElementChild;
      play(svg, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SPRING() });
    };
    if (!el.p2pCopied) swap('check');
    clearTimeout(el.p2pCopied);
    el.p2pCopied = setTimeout(() => { el.p2pCopied = 0; swap('copy'); }, 1200);
  }
  const fact = (label, valueHtml) => `<div class="cell p2p-fact"><span class="cell-sub p2p-label">${esc(label)}</span><span class="p2p-value">${valueHtml}</span></div>`;

  function stepSheet(o) {
    let titleNow = o.title;
    bindDoc();
    return CK.sheet.open({
      title: () => (typeof titleNow === 'function' ? titleNow() : titleNow),
      detents: o.detents || ['fit'],
      onClose: o.onClose,
      build(b, sheet) {
        let cur = null;
        let dockEl = null, docked = false;
        let backFn = null;
        const head = sheet.el.querySelector('.sheet-head');
        const titleEl = sheet.el.querySelector('.sheet-title');
        const backBtn = CK.el(`<button class="navbtn navbtn--flat press p2p-sheetback" type="button" aria-label="${esc(t('back'))}" hidden>${icon('chevron-left', { size: 20 })}</button>`);
        if (head && titleEl) {
          const wrap = CK.el('<div class="p2p-titlewrap"></div>');
          head.insertBefore(wrap, titleEl);
          wrap.append(backBtn, titleEl);
        }
        backBtn.addEventListener('click', () => { if (backFn) { CK.haptic.selection(); backFn(); } });
        const ui = {
          sheet,
          close: () => sheet.close(),
          setBack(fn) { backFn = typeof fn === 'function' ? fn : null; backBtn.hidden = !backFn; },
          dock(html) {
            docked = true;
            if (!dockEl) {
              dockEl = CK.el('<div class="sheet-dock p2p-stepdock"></div>');
              sheet.el.appendChild(dockEl);
              b.classList.add('ck-has-dock');
            }
            dockEl.onclick = null;
            dockEl.innerHTML = html;
            return dockEl;
          },
          show(render, title, dir) {
            if (title !== undefined) {
              titleNow = title;
              const h = sheet.el.querySelector('.sheet-title');
              if (h) h.textContent = typeof title === 'function' ? title() : title;
            }
            const next = document.createElement('div');
            next.className = 'p2p-step' + (cur ? ' p2p-step-in' + (dir === 'back' ? ' p2p-step-back' : '') : '');
            if (cur) cur.replaceWith(next);
            else b.appendChild(next);
            cur = next;
            docked = false;
            ui.setBack(null);
            render(next, ui);
            if (!docked && dockEl) {
              dockEl.remove();
              dockEl = null;
              b.classList.remove('ck-has-dock');
            }
            rollIn(next);
            if (dockEl) rollIn(dockEl);
            b.scrollTop = 0;
            return next;
          }
        };
        if (o.build) o.build(b, ui);
        ui.show(o.first);
      }
    });
  }
  function confirmStep(host, ui, o) {
    host.innerHTML = `${o.text ? `<p class="p2p-text">${esc(o.text)}</p>` : ''}
      <div class="p2p-btns"><button class="btn btn--wide press ${o.tone || ''}" type="button" data-yes>${esc(o.yesLabel)}</button>
      <button class="btn btn--wide btn--tinted press" type="button" data-no>${esc(o.noLabel || t('cancelShort'))}</button></div>`;
    let busy = false;
    host.addEventListener('click', (e) => {
      if (busy) return;
      if (e.target.closest('[data-no]')) return void (o.no ? o.no() : ui.close());
      if (!e.target.closest('[data-yes]')) return;
      busy = true;
      host.classList.add('is-busy');
      Promise.resolve().then(o.yes).then((ok) => {
        if (ok !== false) ui.close();
      }, oops).finally(() => { busy = false; host.classList.remove('is-busy'); });
    });
  }
  function confirmSheet(o) {
    return stepSheet({ title: o.title, onClose: o.onClose, first: (host, ui) => confirmStep(host, ui, o) });
  }
  function passBox(host, hideWhileAsking) {
    const form = CK.el(`<form class="sw-pass p2p-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" placeholder="${esc(t('password'))}" aria-label="${esc(t('password'))}"><button class="btn press" type="submit" aria-label="${esc(t('confirm'))}">${icon('check', { size: 22 })}</button></form>`);
    host.appendChild(form);
    const input = form.querySelector('input');
    let done = null;
    const finish = (value) => {
      if (!done) return;
      const d = done;
      done = null;
      input.value = '';
      form.hidden = true;
      if (hideWhileAsking) hideWhileAsking.hidden = false;
      d(value);
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); finish(input.value); });
    return {
      ask() {
        return new Promise((resolve) => {
          done = resolve;
          form.hidden = false;
          if (hideWhileAsking) hideWhileAsking.hidden = true;
          input.value = '';
          input.focus({ preventScroll: true });
        });
      },
      cancel: () => finish(null)
    };
  }
  function pickSheet(o) {
    CK.haptic.light();
    const multi = !!o.multi;
    const picked = new Set(multi ? o.values || [] : []);
    let applied = false;
    const apply = () => { if (applied) return; applied = true; o.onPick([...picked]); };
    const on = (v) => (multi ? (v === '' ? !picked.size : picked.has(v)) : v === o.value);
    CK.sheet.open({
      title: o.title,
      detents: o.search ? (multi ? [.84] : [.7, .84]) : ['fit'],
      onClose: multi ? apply : undefined,
      build(b, sheet) {
        b.innerHTML = `${o.search ? `<label class="search">${icon('search', { size: 18 })}<input class="p2p-pick-find" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(o.search())}" aria-label="${esc(o.search())}"></label>` : ''}<div class="group p2p-pick-list" role="${multi ? 'group' : 'listbox'}"></div>${multi ? `<div class="p2p-pick-foot"><button class="btn btn--wide press" type="button" data-done>${esc(t('show'))}</button></div>` : ''}`;
        const list = $('.p2p-pick-list', b);
        let shown = o.items();
        const rows = () => {
          list.innerHTML = shown.length ? shown.map(([v, label, sub, logo], i) => `<button class="cell press-row${logo ? ' p2p-logorow' : ''}" type="button" role="${multi ? 'checkbox' : 'option'}"${multi ? '' : ` aria-selected="${on(v)}"`} aria-checked="${on(v)}" data-i="${i}">${logo || ''}<span class="cell-main"><span class="cell-title p2p-line">${esc(label)}</span>${sub ? `<span class="cell-sub">${esc(sub)}</span>` : ''}</span>${multi ? `<span class="p2p-tick" aria-hidden="true">${icon('check', { size: 14 })}</span>` : icon('check', { size: 18, className: 'p2p-check' })}</button>`).join('') : empty('e_none', 'search');
        };
        const count = () => { const btn = $('[data-done]', b); if (btn) btn.textContent = picked.size ? t('showN', { n: picked.size }) : t('show'); };
        const ticks = () => { list.querySelectorAll('[data-i]').forEach((row) => row.setAttribute('aria-checked', String(on(shown[Number(row.dataset.i)][0])))); count(); };
        const find = $('.p2p-pick-find', b);
        if (find) {
          find.addEventListener('input', () => {
            const q = find.value.trim().toLowerCase();
            shown = o.items().filter(([v, label]) => (multi && v === '') || label.toLowerCase().includes(q));
            rows();
          });
          find.addEventListener('focus', () => sheet.expand && sheet.expand());
        }
        list.addEventListener('click', (e) => {
          const row = e.target.closest('[data-i]');
          if (!row) return;
          CK.haptic.selection();
          const v = shown[Number(row.dataset.i)][0];
          if (multi) {
            if (v === '') picked.clear();
            else if (picked.has(v)) picked.delete(v);
            else picked.add(v);
            return void ticks();
          }
          sheet.close();
          o.onPick(v);
        });
        const done = $('[data-done]', b);
        if (done) done.addEventListener('click', () => { apply(); sheet.close(); });
        rows();
        count();
      }
    });
  }
  function picker(host, o) {
    let value = o.value;
    const btn = CK.el(`<button class="p2p-pick press" type="button"><span class="p2p-pick-logo"></span><span class="p2p-pick-text"></span>${icon('chevron-down', { size: 16 })}</button>`);
    host.appendChild(btn);
    const labelOf = (v) => { const hit = o.items().find(([one]) => one === v); return hit ? hit[1] : ''; };
    const paint = () => {
      const text = labelOf(value);
      $('.p2p-pick-text', btn).textContent = text || (o.placeholder ? o.placeholder() : '');
      const hit = text ? o.items().find(([one]) => one === value) : null;
      $('.p2p-pick-logo', btn).innerHTML = hit && hit[3] ? hit[3] : '';
      btn.classList.toggle('is-empty', !text);
      btn.setAttribute('aria-label', `${o.title()}: ${text}`);
    };
    btn.addEventListener('click', () => pickSheet({ title: o.title, items: o.items, value, search: o.search, onPick(v) { value = v; paint(); if (o.onChange) o.onChange(v); } }));
    paint();
    return { get value() { return value; }, set(v) { value = v; paint(); }, paint, el: btn };
  }

  function personStep(host, ui, p, o) {
    const opts = o || {};
    if (opts.back) ui.setBack(opts.back);
    host.innerHTML = `<div class="p2p-person">${ava(p, 64)}<b class="p2p-person-name">${esc(p.name)}</b>${p.done < 3 ? tag(t('newbie')) : ''}
        ${fold(`<span>${esc(statsLine(p))}</span>`, statsRows(p), { cls: 'p2p-statline', bodyCls: 'p2p-statfold' })}</div>
      ${opts.canBlock === false || !p.pid ? '' : `<button class="p2p-redlink press" type="button" data-block>${esc(t('block'))}</button>`}`;
    host.addEventListener('click', (e) => {
      if (!e.target.closest('[data-block]')) return;
      ui.show((h2) => confirmStep(h2, ui, {
        text: t('blockText'),
        yesLabel: t('block'),
        tone: 'btn--sell',
        no: () => ui.show((h3) => personStep(h3, ui, p, opts), opts.title, 'back'),
        yes: () => call('block', { pid: p.pid, on: true }).then(() => {
          CK.haptic.success();
          CK.toast(esc(t('blocked')), { icon: 'lock', tone: 'accent' });
          if (opts.onBlocked) opts.onBlocked();
        })
      }), t('blockQ', { name: p.name }));
    });
  }
  function openPerson(p, o) {
    if (!p) return;
    stepSheet({ title: () => t(o && o.role ? o.role : 'seller'), first: (host, ui) => personStep(host, ui, p, o) });
  }

  const P = {};
  let stack = null;
  let tabCtx = null;
  function makeBar(hostEl, inSheet) {
    const el = CK.el('<div class="p2p-bar" hidden><p class="p2p-hint"></p><div class="p2p-acts"></div></div>');
    if (inSheet) el.classList.add('sheet-dock');
    hostEl.appendChild(el);
    const fit = () => { if (!inSheet) hostEl.style.setProperty('--p2p-bar-h', (el.hidden ? 0 : el.offsetHeight) + 'px'); };
    if (!inSheet && window.ResizeObserver) new ResizeObserver(fit).observe(el);
    if (!inSheet) hostEl.classList.add('p2p-has-bar');
    return {
      el,
      hint: el.querySelector('.p2p-hint'),
      acts: el.querySelector('.p2p-acts'),
      set(hint, actsHtml) {
        this.hint.textContent = hint || '';
        if (this.acts.innerHTML !== actsHtml) this.acts.innerHTML = actsHtml || '';
        el.hidden = !hint && !actsHtml;
        fit();
      }
    };
  }
  function pushScreen(o) {
    if (stack && !tabUp) return void whenUp(() => pushScreen(o));
    if (!stack) return sheetScreen(o);
    bindDoc();
    const screen = CK.screen({ title: o.title, large: false, actions: o.actions });
    screen.el.classList.add('no-tabbar', 'p2p-sub');
    const api = {
      screen, body: screen.body, scroll: screen.scroll, el: screen.el, isSheet: false,
      setTitle(text) {
        const el = screen.el.querySelector('.navbar-title');
        if (el && el.textContent !== text) el.textContent = text;
        screen.el.setAttribute('aria-label', text);
      },
      close() { if (stack.top === screen) stack.pop(); },
      bar: () => makeBar(screen.el, false)
    };
    o.build(screen.body, api);
    const on = stack;
    api.close = () => { if (on.top === screen) on.pop(); };
    on.push(screen, {
      onClose() {
        if (o.onClose) o.onClose();
        if (on.depth === 1 && market) market.refresh();
      }
    });
    return api;
  }
  function sheetScreen(o) {
    let api = null;
    CK.sheet.open({
      title: o.title,
      detents: [.92],
      onClose: o.onClose,
      build(b, sheet) {
        const head = sheet.el.querySelector('.sheet-head');
        (o.actions || []).forEach((a) => {
          const btn = CK.el(`<button class="navbtn navbtn--flat press${a.className ? ' ' + a.className : ''}" type="button" aria-label="${esc(typeof a.label === 'function' ? a.label() : a.label)}">${icon(a.icon, { size: 20 })}</button>`);
          btn.addEventListener('click', () => a.onClick && a.onClick(btn));
          if (head) head.insertBefore(btn, head.lastElementChild);
        });
        api = {
          body: b, scroll: b, el: sheet.el, isSheet: true,
          setTitle(text) { const h = sheet.el.querySelector('.sheet-title'); if (h) h.textContent = text; },
          close: () => sheet.close(),
          bar: () => makeBar(sheet.el, true)
        };
        o.build(b, api);
      }
    });
    return api;
  }
  function toRoot() {
    if (CK.sheet.top) CK.sheet.top.close();
    if (stack && stack.depth > 1) stack.popToRoot();
    if (market) market.refresh();
  }
  function openDeal(id, onClosed) {
    if (!ID.test(String(id)) || !P.dealScreen) return;
    P.dealScreen(id, typeof onClosed === 'function' ? onClosed : undefined);
  }

  let market = null;
  const BANKS_KEY = 'p2p.banks';
  function savedBanks(known) {
    let list = [];
    try { list = JSON.parse((typeof sessionStorage === 'object' && sessionStorage && sessionStorage.getItem(BANKS_KEY)) || '[]'); } catch (err) { list = []; }
    return Array.isArray(list) ? list.filter((name) => typeof name === 'string' && known.includes(name)) : [];
  }
  function saveBanks(list) {
    try { if (typeof sessionStorage === 'object' && sessionStorage) sessionStorage.setItem(BANKS_KEY, JSON.stringify(list)); } catch (err) { }
  }
  function buildMarket(host) {
    const cfg = P.cfg;
    const st = { side: 'buy', asset: cfg.assets[0] ? cfg.assets[0].id : '', amount: '', banks: savedBanks(cfg.banks || []), kind: '', sort: 'best', ads: null, failed: '', seq: 0, deals: null };
    const setBanks = (list) => { st.banks = list; saveBanks(list); };
    const refs = {};
    host.innerHTML = `
      ${demoNote()}
      <div class="p2p-banner-slot"></div>
      <div class="group p2p-strip" hidden></div>
      <div class="p2p-toprow${cfg.assets.length > 1 ? '' : ' is-one'}"><div class="p2p-side"></div><div class="p2p-coins"></div></div>
      <div class="p2p-filters"></div>
      <div class="p2p-list list--free"></div>`;
    const bannerEl = $('.p2p-banner-slot', host), stripEl = $('.p2p-strip', host), filtersEl = $('.p2p-filters', host);
    const listEl = $('.p2p-list', host);
    if (cfg.assets.length > 1) {
      CK.segmented($('.p2p-coins', host), {
        items: cfg.assets.map((a) => ({ value: a.id, label: symText(a.symbol) })),
        value: st.asset,
        onChange(v) { if (v === st.asset) return; st.asset = v; load(); }
      });
    }
    CK.segmented($('.p2p-side', host), {
      items: [{ value: 'buy', label: () => t('buy'), tone: 'buy' }, { value: 'sell', label: () => t('sell'), tone: 'sell' }],
      value: 'buy',
      onChange(v) { st.side = v; st.kind = ''; paintFilters(); load(); }
    });
    const marketRef = {};
    function learnRef(ads) {
      const hit = ads.find((ad) => ad.priceKind === 'market' && ad.price !== null && Number.isFinite(ad.pct));
      if (hit) marketRef[st.asset] = Number(hit.price) / (1 + hit.pct / 100);
    }
    P.marketRefOf = (asset) => marketRef[asset] || null;
    const pctOf = (ad) => {
      if (ad.priceKind === 'market' && Number.isFinite(ad.pct)) return ad.pct;
      const ref = marketRef[ad.asset];
      return ref && ad.price !== null ? (Number(ad.price) / ref - 1) * 100 : null;
    };
    function marketTag(ad, long) {
      const pct = pctOf(ad);
      if (pct === null) return '';
      const full = t('toMarketLong', { pct: pctText(pct) });
      if (long) return `<span class="p2p-pct">${esc(full)}</span>`;
      return `<button class="p2p-pct press" type="button" data-p2p-why="${esc(full)}" aria-label="${esc(full)}">${esc(t('toMarket', { pct: pctText(pct) }))}</button>`;
    }
    P.marketTag = marketTag;

    const pill = (k, label, on, logos, more) => `<div class="p2p-filter${on ? ' is-on' : ''}"><button class="p2p-filter-main press" type="button" data-f="${k}">${logos || ''}<span class="p2p-filter-text">${esc(label)}</span>${more ? `<span class="p2p-filter-more">${esc(more)}</span>` : ''}${on ? '' : icon('chevron-down', { size: 14 })}</button>${on ? `<button class="p2p-filter-x press" type="button" data-x="${k}" aria-label="${esc(t('reset'))}">${icon('close', { size: 14 })}</button>` : ''}</div>`;
    function paintFilters() {
      const pills = [pill('amount', st.amount ? rubShort(typed(st.amount)) : t('amount'), !!st.amount)];
      const n = st.banks.length;
      if (st.side === 'buy') pills.push(pill('bank', n === 1 ? st.banks[0] : n ? t('banks_n', { n }) : t('bank'), !!n, logoStack(st.banks.slice(0, 2).map((name) => bankLogo(name, 18)), 18), ''));
      else pills.push(pill('way', st.kind ? kindName(st.kind) : t('way'), !!st.kind, st.kind ? payLogo(st.kind, 18) : ''));
      filtersEl.innerHTML = pills.join('') + `<button class="p2p-sortbtn press${st.sort !== 'best' ? ' is-on' : ''}" type="button" data-f="sort" aria-label="${esc(t('sortT'))}">${icon('sort', { size: 20 })}</button>`;
    }
    function shown() {
      let rows = st.ads || [];
      if (st.side === 'buy' && st.banks.length) rows = rows.filter((ad) => ad.methods.some((m) => st.banks.includes(m.bank)));
      const done = (ad) => (ad.owner ? ad.owner.done : 0);
      const rate = (ad) => (ad.owner && ad.owner.rating !== null && ad.owner.rating !== undefined ? ad.owner.rating : -1);
      const votes = (ad) => (ad.owner ? ad.owner.votes || 0 : 0);
      if (st.sort === 'deals') rows = rows.slice().sort((a, b) => done(b) - done(a));
      if (st.sort === 'rating') rows = rows.slice().sort((a, b) => rate(b) - rate(a) || votes(b) - votes(a));
      return rows;
    }
    const sym = () => { const a = cfg.assets.find((one) => one.id === st.asset); return symText(a ? a.symbol : ''); };
    function adCard(ad) {
      const viewerBuys = st.side === 'buy';
      const sells = ad.side === 'sell';
      const ticked = (name) => (st.banks.includes(name) ? 0 : 1);
      const banks = sells ? [...new Set(ad.methods.map((m) => m.bank).filter(Boolean))].sort((a, b) => ticked(a) - ticked(b)) : [...new Set(ad.methods.map((m) => m.kind).filter(Boolean))];
      const logos = logoStack(banks.slice(0, 3).map((one) => (sells ? bankLogo(one, 18) : payLogo(one, 18))), 18);
      const bankLine = banks.length ? `${logos}<span class="p2p-bankchip">${esc(sells ? banks[0] : kindName(banks[0]))}</span>${banks.length > 1 ? `<span class="p2p-bankmore">+${banks.length - 1}</span>` : ''}` : '';
      const action = ad.mine ? tag(t('yourAd'), 'accent') : `<button class="btn btn--small ${viewerBuys ? 'btn--buy' : 'btn--sell'} press p2p-ad-btn" type="button" data-take>${esc(t(viewerBuys ? 'buy' : 'sell'))}</button>`;
      const p = ad.owner;
      return `<div class="p2p-ad" data-ad="${esc(ad.id)}">
        <div class="p2p-ad-l1"><span class="p2p-ad-price">${rolledText(priceText(ad.price, ad.fiat), 'p2p-price')}</span><span class="p2p-ad-tag" data-part="tag">${marketTag(ad)}</span></div>
        <button class="p2p-owner press" type="button" data-person data-part="owner">${ava(p, 20)}<b class="p2p-owner-name">${esc(p ? p.name : '\u2014')}</b>${p && p.done < 3 ? tag(t('newbie')) : ''}${parts(trustParts(p), 'p2p-owner-sub')}</button>
        <div class="p2p-ad-l3"><span class="p2p-ad-meta" data-part="meta">${esc(limitsShort(ad.min, ad.max, ad.fiat))}</span><span class="p2p-banks" data-part="banks">${bankLine}</span><span class="p2p-ad-act" data-part="act">${action}</span></div>
      </div>`;
    }
    const busy = (on) => setSpin(on);
    let listKey = '';
    const keyNow = () => [st.side, st.asset, st.kind, typed(st.amount), st.banks.join(','), st.sort].join('|');
    const cardsOn = () => Array.from(listEl.children).filter((el) => el.dataset.ad && !el.p2pLeaving);
    function paintList(how) {
      const filtered = !!(st.amount || (st.side === 'buy' && st.banks.length) || st.kind);
      listEl.classList.remove('is-stale');
      if (st.failed) {
        listKey = '';
        listEl.innerHTML = errorCard(st.failed);
        return;
      }
      if (!st.ads) {
        listKey = '';
        listEl.innerHTML = skelCard() + skelCard() + skelCard();
        return;
      }
      const rows = shown();
      const key = keyNow();
      if (!rows.length) {
        listKey = key;
        listEl.innerHTML = filtered
          ? empty('noneFilter', 'filter', { actions: `<button class="btn btn--small btn--tinted press" type="button" data-reset>${esc(t('resetFilters'))}</button><button class="section-link press" type="button" data-create>${esc(t('createAd'))}</button>` })
          : CK.emptyState({ icon: 'p2p', title: t(st.side === 'buy' ? 'noneYetBuy' : 'noneYetSell', { sym: sym() }), className: 'p2p-empty', actions: `<button class="btn btn--small press" type="button" data-create>${esc(t('createAd'))}</button>` });
        return;
      }
      if ((how === 'quiet' || how === 'diff' || key === listKey) && cardsOn().length && listEl.children.length === listEl.querySelectorAll(':scope > [data-ad]').length) {
        listKey = key;
        return void diffList(rows);
      }
      const fade = (how === 'fresh' || how === 'diff') && listEl.firstElementChild;
      listKey = key;
      listEl.innerHTML = rows.map(adCard).join('');
      rollIn(listEl);
      if (fade) play(listEl, [{ opacity: 0.4 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
    function diffList(rows) {
      const motion = !CK.reducedMotion() && !!listEl.animate;
      const old = new Map(cardsOn().map((el) => [el.dataset.ad, el]));
      const wanted = new Set(rows.map((ad) => ad.id));
      const before = motion ? new Map(Array.from(old.values(), (el) => [el, el.getBoundingClientRect().top])) : null;
      old.forEach((el, id) => { if (!wanted.has(id)) leave(el, motion); });
      const fresh = [];
      let prev = null;
      rows.forEach((ad) => {
        const html = adCard(ad);
        let el = old.get(ad.id);
        if (el) patchCard(el, html);
        else {
          el = CK.el(html);
          el.p2pHtml = html;
          rollIn(el);
          fresh.push(el);
        }
        let at = prev ? prev.nextElementSibling : listEl.firstElementChild;
        while (at && at.p2pLeaving) at = at.nextElementSibling;
        if (at !== el) listEl.insertBefore(el, at);
        prev = el;
      });
      if (!motion) return;
      before.forEach((top, el) => {
        if (el.p2pLeaving || !el.isConnected) return;
        const dy = top - el.getBoundingClientRect().top;
        if (Math.abs(dy) > 0.5) play(el, [{ transform: `translate3d(0, ${dy}px, 0)` }, { transform: 'none' }], { duration: 380, easing: EASE_IOS });
      });
      fresh.forEach((el) => play(el, [{ opacity: 0, transform: 'translate3d(0, 8px, 0) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 60, easing: EASE_OUT, fill: 'backwards' }));
    }
    function patchCard(el, html) {
      if (el.p2pHtml === html) return;
      const next = CK.el(html);
      el.p2pHtml = html;
      const priceNow = $('.p2p-price', el), priceNew = $('.p2p-price', next);
      const text = priceNew ? priceNew.getAttribute('data-roll') : null;
      if (priceNow && text !== null && priceNow.getAttribute('aria-label') !== text) {
        if (CK.roll) CK.roll(priceNow, text);
        else priceNow.textContent = text;
      }
      next.querySelectorAll('[data-part]').forEach((part) => {
        const mine = el.querySelector(`[data-part="${part.dataset.part}"]`);
        if (mine && mine.innerHTML !== part.innerHTML) mine.innerHTML = part.innerHTML;
      });
    }
    function leave(el, motion) {
      el.p2pLeaving = true;
      el.setAttribute('aria-hidden', 'true');
      el.inert = true;
      if (!motion) return void el.remove();
      const top = el.offsetTop, width = el.offsetWidth;
      el.classList.add('is-leaving');
      el.style.top = `${top}px`;
      el.style.width = `${width}px`;
      const run = play(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
      if (!run) return void el.remove();
      run.onfinish = () => el.remove();
      run.oncancel = () => el.remove();
    }
    function load(o) {
      const quiet = !!(o && o.quiet) && !!st.ads && !st.failed && listKey === keyNow();
      const seq = ++st.seq;
      st.failed = '';
      if (!quiet) {
        if (listEl.firstElementChild && listKey) {
          st.ads = null;
          listEl.classList.add('is-stale');
        } else {
          st.ads = null;
          paintList();
        }
      }
      busy(true);
      const q = new URLSearchParams({ side: st.side === 'buy' ? 'sell' : 'buy', asset: st.asset, fiat: FIAT });
      if (st.kind) q.set('kind', st.kind);
      if (typed(st.amount)) q.set('amount', typed(st.amount));
      const ask = (left) => call('ads?' + q).then((json) => {
        if (seq !== st.seq) return;
        busy(false);
        st.failed = '';
        st.ads = json.ads;
        learnRef(json.ads);
        paintList(quiet ? 'quiet' : 'fresh');
      }, (err) => {
        if (seq !== st.seq) return;
        if (left > 0) return void setTimeout(() => { if (seq === st.seq) ask(left - 1); }, MOUNT_RETRY_MS);
        busy(false);
        if (quiet) return;
        st.failed = err.code;
        paintList();
      });
      ask(2);
    }

    const clockText = (left) => `${String(Math.floor(left / 60000)).padStart(2, '0')}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    function activeDeals() {
      return (st.deals || []).filter(dealActive).sort((a, b) => (a.deadline || Infinity) - (b.deadline || Infinity));
    }
    let topDeal = null;
    function paintTop() {
      const active = activeDeals();
      P.setBadge(active.length);
      const d = active[0];
      const full = d && topDeal && topDeal.id === d.id ? { ...d, maker: topDeal.maker, depositSent: topDeal.depositSent, pending: topDeal.pending } : d;
      const turn = full ? (P.turnOf ? P.turnOf(full) : { text: t('s_' + full.status), mine: false }) : null;
      bannerEl.innerHTML = d ? `<button class="card p2p-card p2p-banner${turn.mine ? ' is-turn' : ''} press-row" type="button" data-deal="${esc(d.id)}">${mark('p2p', 'blue', 36)}
          <span class="p2p-banner-main"><b>${esc(t(d.me === 'seller' ? 'sellRow' : 'buyRow', { sum: sumText(d.fiatAmount, d.fiat) }))}</b><span class="p2p-banner-sub">${esc(turn.text)}<span data-left="${d.deadline || ''}"></span></span></span>
          ${active.length > 1 ? '' : icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>${active.length > 1 ? `<button class="card p2p-card p2p-more press" type="button" data-deals aria-label="${esc(t('activeMore', { n: active.length - 1 }))}">+${active.length - 1}</button>` : ''}` : '';
      paintClocks();
      const me = cfg.me || {};
      const unrated = (me.unrated || [])[0];
      stripEl.hidden = !me.banned && !unrated;
      if (stripEl.hidden) return void (stripEl.innerHTML = '');
      const sub = me.banned ? `<span class="cell-sub p2p-red">${esc(t('e_banned'))}</span>` : `<span class="cell-sub p2p-orange">${esc(t('rateFirstLine'))}</span>`;
      stripEl.innerHTML = `<button class="cell press-row p2p-striprow" type="button" data-me="${unrated && !me.banned ? esc(unrated) : ''}">${myAva(40)}<span class="cell-main"><span class="cell-title">${esc(t('myP2P'))}</span>${sub}</span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`;
      if (CK.paintProfile) CK.paintProfile(stripEl);
    }
    function paintClocks() {
      host.querySelectorAll('[data-left]').forEach((el) => {
        const at = Number(el.dataset.left);
        const text = at ? clockText(Math.max(0, at - Date.now())) : '';
        if (el.textContent !== text) el.textContent = text;
      });
    }
    const clock = setInterval(() => { if (!document.hidden) paintClocks(); }, 1000);
    void clock;
    let dealsSeq = 0;
    function loadDeals() {
      const seq = ++dealsSeq;
      call('deals').then((json) => {
        if (seq !== dealsSeq) return;
        st.deals = json.deals || [];
        const d = activeDeals()[0];
        if (topDeal && (!d || topDeal.id !== d.id)) topDeal = null;
        paintTop();
        if (d && ID.test(String(d.id))) {
          call('deal?id=' + d.id).then((one) => {
            if (seq !== dealsSeq || !one || !one.deal || one.deal.id !== d.id) return;
            topDeal = one.deal;
            paintTop();
          }, () => {});
        }
      }, () => {});
    }

    function openAmount() {
      stepSheet({
        title: () => t('amountT'),
        first(h, ui) {
          const now = typed(st.amount);
          h.innerHTML = `<label class="field"><span class="field-label">${esc(t('amountLabel'))}</span><span class="field-box"><input class="p2p-amount-in" inputmode="decimal" autocomplete="off" enterkeyhint="done" value="${esc(now ? numText(now) : '')}" aria-label="${esc(t('amountLabel'))}"><span class="field-unit">₽</span></span></label>
            <div class="p2p-chips" role="radiogroup" aria-label="${esc(t('amountLabel'))}">${['1000', '5000', '10000', '50000'].map((v) => `<button class="p2p-chip press" type="button" role="radio" aria-checked="${v === now}" data-v="${v}">${esc(compactText(v))}</button>`).join('')}</div>
            <div class="p2p-btns"><button class="btn btn--wide press" type="button" data-show>${esc(t('show'))}</button>${st.amount ? `<button class="btn btn--wide btn--tinted press" type="button" data-clear>${esc(t('reset'))}</button>` : ''}</div>`;
          const input = $('.p2p-amount-in', h);
          const apply = (v) => { st.amount = v; ui.close(); paintFilters(); load(); };
          const sumOf = (v) => typed(CK.i18n.lang === 'en' ? String(v || '').replace(/,/g, '') : v);
          const lit = () => { const v = sumOf(input.value); h.querySelectorAll('[data-v]').forEach((c) => c.setAttribute('aria-checked', String(c.dataset.v === v))); };
          input.addEventListener('input', () => {
            const digits = input.value.replace(CK.i18n.lang === 'en' ? /[\s\u00a0,]/g : /[\s\u00a0]/g, '');
            const atEnd = input.selectionStart === input.value.length;
            if (atEnd && /^\d+$/.test(digits)) { const v = numText(String(Number(digits))); if (v !== input.value) input.value = v; }
            lit();
          });
          h.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-v]');
            if (chip) { CK.haptic.selection(); input.value = numText(chip.dataset.v); lit(); return; }
            if (e.target.closest('[data-clear]')) return apply('');
            if (e.target.closest('[data-show]')) return apply(Number(sumOf(input.value)) > 0 ? sumOf(input.value) : '');
            return undefined;
          });
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(Number(sumOf(input.value)) > 0 ? sumOf(input.value) : ''); } });
        }
      });
    }

    host.addEventListener('click', (e) => {
      const el = (s) => e.target.closest(s);
      const x = el('[data-x]');
      if (x) {
        CK.haptic.light();
        if (x.dataset.x === 'amount') st.amount = '';
        if (x.dataset.x === 'bank') setBanks([]);
        if (x.dataset.x === 'way') st.kind = '';
        paintFilters();
        if (x.dataset.x === 'bank') paintList('diff');
        else load();
        return;
      }
      const f = el('[data-f]');
      if (f) {
        const k = f.dataset.f;
        if (k === 'amount') return openAmount();
        if (k === 'bank') {
          return pickSheet({
            multi: true, title: () => t('bank'), search: () => t('bankFind'), values: st.banks,
            items: () => [['', t('allBanks'), '', `<span class="p2p-logo p2p-logo--all">${icon('bank', { size: 20 })}</span>`]].concat((cfg.banks || []).map((n) => [n, n, '', bankLogo(n, 32)])),
            onPick(picked) {
              const all = cfg.banks || [];
              const list = picked.slice().sort((a, b) => all.indexOf(a) - all.indexOf(b));
              if (list.join('\n') === st.banks.join('\n')) return;
              setBanks(list);
              paintFilters();
              paintList('diff');
            }
          });
        }
        if (k === 'way') return pickSheet({ title: () => t('kindPick'), value: st.kind, items: () => [['', t('allWays'), '', `<span class="p2p-logo p2p-logo--all">${icon('wallet', { size: 20 })}</span>`]].concat(cfg.kinds.map((one) => [one, kindName(one), '', payLogo(one, 32)])), onPick(v) { st.kind = v; paintFilters(); load(); } });
        if (k === 'sort') return pickSheet({ title: () => t('sortT'), value: st.sort, items: () => [['best', t('sortBest'), t('sortBestSub')], ['deals', t('sortDeals')], ['rating', t('sortRating')]], onPick(v) { if (v === st.sort) return; st.sort = v; paintFilters(); paintList('diff'); } });
        return;
      }
      const again = () => load({ quiet: true });
      if (el('[data-retry]')) return load();
      if (el('[data-reset]')) { st.amount = ''; setBanks([]); st.kind = ''; paintFilters(); load(); return; }
      if (el('[data-create]')) return void (P.openEditor && P.openEditor(null, { side: st.side, done: again }));
      if (el('[data-deals]')) return void (P.openDeals && P.openDeals());
      const banner = el('[data-deal]');
      if (banner) return openDeal(banner.dataset.deal);
      const strip = el('[data-me]');
      if (strip) {
        if (strip.dataset.me) return openDeal(strip.dataset.me);
        return void (P.openMe && P.openMe());
      }
      if (el('[data-p2p-why]')) return;
      const card = el('[data-ad]');
      const ad = card && (st.ads || []).find((a) => a.id === card.dataset.ad);
      if (!ad) return;
      if (el('[data-person]')) return openPerson(ad.owner, { role: ad.side === 'sell' ? 'seller' : 'buyer', onBlocked: again, canBlock: !ad.mine });
      CK.haptic.selection();
      if (ad.mine) return void (P.openOwnAd && P.openOwnAd(ad.id, again));
      if (cfg.me && cfg.me.banned) {
        CK.haptic.error();
        CK.toast(esc(t('e_banned')), { icon: 'lock', tone: 'down' });
        return;
      }
      openAd(ad, { amount: typed(st.amount) });
    });
    CK.i18n.bind(host, () => { paintFilters(); paintList('quiet'); paintTop(); });
    paintFilters();
    paintTop();
    load();
    loadDeals();
    return {
      refresh: () => { loadDeals(); load({ quiet: true }); },
      reload: () => { load({ quiet: true }); loadDeals(); },
      paintTop,
      setSide(side) { st.side = side; }
    };
  }

  function openAd(ad, o) {
    const takerSells = ad.side === 'buy';
    const symbol = symText(ad.symbol);
    const key = randomKey();
    const price = Number(ad.price);
    const cfg = P.cfg || { me: {}, assets: [], feeBps: 0 };
    const asset = cfg.assets.find((a) => a.id === ad.asset);
    const st = { amount: (o && o.amount) || '', coinMode: false, coinText: '', method: '', own: [], busy: false, ownLoaded: !takerSells };
    const choices = () => (takerSells ? st.own.filter((m) => ad.methods.some((x) => x.kind === m.kind)) : ad.methods);
    const amountRub = () => {
      if (!st.coinMode) return typed(st.amount);
      const coins = Number(typed(st.coinText));
      return coins > 0 && price > 0 ? floor2(coins * price) : '';
    };
    const decimals = Number(ad.decimals) || 0;
    const priceE8 = (() => {
      const m = /^(\d{1,15})(?:\.(\d{1,8}))?$/.exec(String(ad.price === null || ad.price === undefined ? '' : ad.price));
      return m ? BigInt(m[1]) * 10n ** 8n + BigInt((m[2] || '').padEnd(8, '0')) : 0n;
    })();
    const centsOf = (rub) => {
      const m = /^(\d{1,15})(?:\.(\d+))?$/.exec(String(rub || ''));
      return m ? BigInt(m[1]) * 100n + BigInt((m[2] || '').slice(0, 2).padEnd(2, '0')) : 0n;
    };
    const unitsOf = (rub) => (priceE8 > 0n ? (centsOf(rub) * 10n ** 8n * 10n ** BigInt(decimals)) / (priceE8 * 100n) : 0n);
    const feeUnitsOf = (units) => (units * BigInt(Number(cfg.feeBps) || 0)) / 10000n;
    const coinsShown = (units) => coinsText(units, decimals, symbol);
    const coinsNear = (units) => coinsApprox(units, decimals, symbol);
    const fiat = fiatSign(ad.fiat);
    const limitParams = () => ({ min: numText(ad.min), max: numText(ad.max), fiat, avail: coinsText(ad.available, ad.decimals, ad.symbol) });
    const limitShortParams = () => ({ min: compactText(ad.min), max: compactText(ad.max), fiat, avail: coinsCompact(ad.available, ad.decimals, ad.symbol) });
    function reason() {
      const me = cfg.me || {};
      if (me.banned) return 'e_banned';
      if (me.unrated && me.unrated.length) return 'e_rate_first';
      const rub = amountRub();
      if (!rub || !(Number(rub) > 0)) return 'noAmount';
      if (Number(rub) < Number(ad.min) || Number(rub) > Number(ad.max)) return 'outOfLimits';
      if (unitsOf(rub) > BigInt(ad.available)) return 'availOnly';
      if (takerSells && !choices().length) return 'needMethod';
      if (!st.method) return 'pickedNone';
      return '';
    }
    const isGram = !!asset && (asset.coin === 'gram' || asset.id === 'gram') && decimals === 9;
    const gasUnits = () => (takerSells && asset && asset.gas ? BigInt(asset.gas) : 0n);
    const feeOf = (rub) => (takerSells ? feeUnitsOf(unitsOf(rub)) : 0n);
    function feeSum(rub) {
      const fee = feeOf(rub), gas = gasUnits();
      if (isGram) return coinsApprox(fee + gas, 9, 'GRAM');
      return [fee > 0n || !gas ? coinsNear(fee) : '', gas ? coinsApprox(gas, 9, 'GRAM') : ''].filter(Boolean).join(' + ');
    }
    const feeLine = (rub) => (takerSells ? t('common.fee', { sum: feeSum(rub) }) : t('noFee'));
    const feeValue = (rub) => (takerSells ? `≈${NBSP}${feeSum(rub)}` : t('noFee'));
    const feeParts = (rub) => (takerSells
      ? foldRow(t('feePart', { pct: numText(String((Number(cfg.feeBps) || 0) / 100)) }), esc(`≈${NBSP}${coinsNear(feeOf(rub))}`)) + (gasUnits() ? foldRow(t('gasRow'), esc(`≈${NBSP}${coinsApprox(gasUnits(), 9, 'GRAM')}`)) : '')
      : '');
    let titleNow = () => t(takerSells ? 'sellTitle' : 'buyTitle', { sym: symbol });
    const termsId = 'p2p-terms-' + key;
    st.termsSeen = !ad.terms;

    stepSheet({
      title: () => titleNow(),
      detents: [ORDER_DETENT],
      first: amountStep
    });

    function ownerRow() {
      return `<div class="group list--free"><button class="cell press-row p2p-ownerrow" type="button" data-profile>${ava(ad.owner, 40)}${trustHtml(ad.owner, { stars: true })}${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>`;
    }
    function methodRows() {
      const list = choices();
      if (takerSells && !st.ownLoaded) return '<div class="cell"><span class="skel p2p-sk-line"></span></div>';
      const addRow = `<button class="cell press-row p2p-addrow" type="button" data-add>${icon('plus', { size: 18 })}<span class="cell-title">${esc(t('addDetails'))}</span></button>`;
      if (list.length && !list.some((m) => (m.id || m.kind) === st.method)) st.method = list[0].id || list[0].kind;
      if (!list.length) st.method = '';
      const rowOf = (m) => {
        const v = m.id || m.kind;
        return `<button class="cell press-row p2p-logorow" type="button" role="radio" aria-checked="${v === st.method}" data-m="${esc(v)}">${methodLogo(m, 32)}<span class="cell-main"><span class="cell-title">${esc(m.bank || kindName(m.kind))}</span><span class="cell-sub">${esc(kindName(m.kind))}${m.tail ? ` •• ${esc(m.tail)}` : ''}</span></span>${icon('check', { size: 18, className: 'p2p-check' })}</button>`;
      };
      if (!takerSells) return list.map(rowOf).join('');
      const off = offMethods().map((m) => `<div class="cell p2p-logorow is-off" aria-disabled="true">${methodLogo(m, 32)}<span class="cell-main"><span class="cell-title">${esc(m.bank || kindName(m.kind))}</span><span class="cell-sub">${esc(kindName(m.kind))}${m.tail ? ` •• ${esc(m.tail)}` : ''}</span></span></div>`);
      return list.map(rowOf).join('') + off.join('') + (st.own.length < 10 ? addRow : '');
    }
    function offMethods() {
      if (!takerSells || !st.ownLoaded) return [];
      const kinds = [...new Set(ad.methods.map((x) => x.kind))];
      return st.own.filter((m) => !kinds.includes(m.kind));
    }
    function offNote() {
      if (!offMethods().length) return '';
      const kinds = [...new Set(ad.methods.map((x) => x.kind))];
      return `<p class="p2p-note">${esc(t(kinds[0] === 'sbp' ? 'buyerSbpOnly' : 'buyerCardOnly'))}</p>`;
    }
    function methodsHtml() {
      return `<div class="group p2p-flat p2p-methods">${methodRows()}</div>${offNote()}`;
    }
    function amountStep(h, ui) {
      titleNow = () => t(takerSells ? 'sellTitle' : 'buyTitle', { sym: symbol });
      const label = () => t(st.coinMode ? (takerSells ? 'youSend' : 'youGet') : (takerSells ? 'youGet' : 'youPay'));
      const termsBody = [
        `<p class="fold-line">${esc(t(takerSells ? 'escrowSell' : 'escrowBuy'))}</p>`,
        ad.confirm ? `<p class="fold-line">${esc(t('confirmAd'))}</p>` : '',
        ad.terms ? `<p class="p2p-terms">${esc(ad.terms)}</p>` : ''
      ].join('');
      h.innerHTML = `
        ${ownerRow()}
        <div class="p2p-oprice">${rolledText(priceText(ad.price, ad.fiat), 'p2p-oprice-v')}${P.marketTag ? P.marketTag(ad, true) : ''}</div>
        <div class="p2p-amtblock">
          <div class="field">
            <span class="field-label"><span class="p2p-amt-label">${esc(label())}</span><button class="section-link press" type="button" data-all>${esc(t('all'))}</button></span>
            <span class="field-box"><input class="p2p-amt" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="0" aria-label="${esc(label())}" value="${esc(st.coinMode ? st.coinText : st.amount)}"><button class="field-unit p2p-unit press" type="button" data-unit aria-label="${esc(t('swapUnit'))}"><span class="p2p-unit-text">${esc(st.coinMode ? symbol : fiat)}</span>${icon('swap', { size: 14 })}</button></span>
          </div>
          <p class="p2p-conv"></p>
          <p class="p2p-limit"></p>
        </div>
        <div class="p2p-methwrap">${methodsHtml()}</div>
        <div class="p2p-orderfoot"><p class="p2p-quiet"></p>${fold(esc(t('terms')), termsBody, { id: termsId, cls: 'p2p-termsfold' })}</div>`;
      applyFolds(h);
      const dock = ui.dock(`<div class="p2p-btns"><button class="btn btn--wide press ${takerSells ? 'btn--sell' : 'btn--buy'}" type="button" data-next disabled>${esc(t('next'))}</button><p class="p2p-why"></p></div>`);
      const input = $('.p2p-amt', h), conv = $('.p2p-conv', h), limit = $('.p2p-limit', h), quiet = $('.p2p-quiet', h), next = $('[data-next]', dock), why = $('.p2p-why', dock);
      function calc() {
        const rub = amountRub();
        const text = rub ? (st.coinMode ? `= ${moneyText(rub, ad.fiat)}` : `≈ ${coinsNear(unitsOf(rub))}`) : '';
        if (text) conv.textContent = text;
        conv.classList.toggle('is-on', !!text);
        const r = reason();
        const over = r === 'availOnly';
        limit.textContent = over ? t('availOnly', limitParams()) : t('limitHint', limitShortParams());
        limit.classList.toggle('p2p-red', r === 'outOfLimits' || over);
        quiet.textContent = `${t('minutes', { n: ad.payMinutes })} · ${lowerFirst(feeLine(rub))}`;
        next.disabled = st.busy || !!r;
        why.innerHTML = !r || r === 'noAmount' || r === 'outOfLimits' || over ? '' : r === 'e_rate_first' ? `${esc(t('e_rate_first'))} <button class="section-link press" type="button" data-rate>${esc(t('rateGo'))}</button>` : esc(t(r, limitParams()));
      }
      input.addEventListener('input', () => {
        if (st.coinMode) st.coinText = input.value;
        else st.amount = input.value;
        calc();
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
      h.addEventListener('p2p-fold', (e) => { if (e.detail && e.detail.id === termsId && e.detail.open) st.termsSeen = true; });
      const onTap = (e) => {
        const el = (s) => e.target.closest(s);
        if (el('[data-profile]')) return void ui.show((h2) => personStep(h2, ui, ad.owner, { back: () => ui.show(amountStep, () => titleNow(), 'back'), title: () => t(takerSells ? 'buyer' : 'seller'), onBlocked: () => { ui.close(); if (market) market.reload(); } }), () => t(takerSells ? 'buyer' : 'seller'));
        if (el('[data-all]')) {
          CK.haptic.selection();
          const all = priceE8 > 0n ? (BigInt(ad.available) * priceE8 * 100n) / (10n ** 8n * 10n ** BigInt(decimals)) : 0n;
          const top = centsOf(ad.max);
          const cents = all < top ? all : top;
          st.coinMode = false;
          st.amount = cents > 0n ? (cents % 100n ? `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}` : String(cents / 100n)) : '';
          input.value = st.amount;
          $('.p2p-unit-text', h).textContent = fiat;
          $('.p2p-amt-label', h).textContent = label();
          return void calc();
        }
        if (el('[data-unit]')) {
          CK.haptic.selection();
          const rub = amountRub();
          st.coinMode = !st.coinMode;
          if (st.coinMode) st.coinText = rub ? unitsPlain(decimals > 6 ? (unitsOf(rub) / 10n ** BigInt(decimals - 6)) * 10n ** BigInt(decimals - 6) : unitsOf(rub), decimals) : '';
          else st.amount = rub ? String(Number(rub)) : '';
          input.value = st.coinMode ? st.coinText : st.amount;
          $('.p2p-unit-text', h).textContent = st.coinMode ? symbol : fiat;
          $('.p2p-amt-label', h).textContent = label();
          return void calc();
        }
        if (el('[data-add]')) {
          if (!P.detailsStep) return undefined;
          return void ui.show((h2) => P.detailsStep(h2, ui, {
            kinds: [...new Set(ad.methods.map((m) => m.kind))],
            back: () => ui.show(amountStep, undefined, 'back'),
            onSaved(list) { st.own = list; ui.show(amountStep, undefined, 'back'); }
          }), () => t('newDetails'));
        }
        const m = el('[data-m]');
        if (m) {
          CK.haptic.selection();
          st.method = m.dataset.m;
          h.querySelectorAll('[data-m]').forEach((row) => row.setAttribute('aria-checked', String(row.dataset.m === st.method)));
          return void calc();
        }
        if (el('[data-rate]')) {
          ui.close();
          return openDeal(cfg.me.unrated[0]);
        }
        if (el('[data-next]') && !next.disabled) {
          if (!st.termsSeen) {
            st.termsSeen = true;
            const btn = h.querySelector(`[aria-controls="${termsId}"]`);
            if (btn && btn.getAttribute('aria-expanded') !== 'true') toggleFold(btn);
            const box = document.getElementById(termsId);
            if (box && box.scrollIntoView) requestAnimationFrame(() => box.scrollIntoView({ block: 'nearest', behavior: CK.reducedMotion && CK.reducedMotion() ? 'auto' : 'smooth' }));
            return undefined;
          }
          return void ui.show(reviewStep, () => t('reviewT'));
        }
        return undefined;
      };
      h.addEventListener('click', onTap);
      dock.onclick = onTap;
      calc();
      if (takerSells && !st.ownLoaded) {
        const fill = () => {
          st.ownLoaded = true;
          const wrap = $('.p2p-methwrap', h);
          if (!wrap || !h.isConnected) return;
          wrap.innerHTML = methodsHtml();
          play(wrap, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
          calc();
        };
        call('methods').then((json) => { st.own = json.methods; fill(); }, fill);
      }
    }
    function reviewStep(h, ui) {
      titleNow = () => t('reviewT');
      ui.setBack(() => ui.show(amountStep, () => titleNow(), 'back'));
      const rub = amountRub();
      const m = choices().find((one) => (one.id || one.kind) === st.method) || {};
      const money = moneyText(rub, ad.fiat), coinLine = `≈${NBSP}${coinsNear(unitsOf(rub))}`;
      const more = [
        foldRow(t('price'), esc(`${priceText(ad.price, ad.fiat)} ${t('per1', { sym: symbol })}`)),
        foldRow(t(takerSells ? 'buyer' : 'seller'), esc(ad.owner ? ad.owner.name : '—')),
        foldRow(t('payWindow'), esc(t('minutes', { n: ad.payMinutes }))),
        feeParts(rub),
        `<p class="fold-line">${esc(t('exactNote'))}</p>`
      ].join('');
      h.innerHTML = `
        <div class="group p2p-flat p2p-facts">
          ${fact(t(takerSells ? 'youSend' : 'youPay'), esc(takerSells ? coinLine : money))}
          ${fact(t('youGet'), `<b>${esc(takerSells ? money : coinLine)}</b>`)}
          ${fact(t('bank'), methodLogo(m, 20) + `<span class="p2p-line">${esc([m.bank, kindName(m.kind)].filter(Boolean).join(' · '))}</span>`)}
          ${fact(t('fee'), esc(feeValue(rub)))}
        </div>
        <div class="p2p-morewrap">${fold(esc(t('common.more')), more, { id: 'p2p-review-' + key })}</div>`;
      applyFolds(h);
      const dock = ui.dock(`<div class="p2p-btns"><button class="btn btn--wide press ${takerSells ? 'btn--sell' : 'btn--buy'}" type="button" data-go>${esc(t('place'))}</button></div>`);
      const go = $('[data-go]', dock);
      dock.onclick = async (e) => {
        if (!e.target.closest('[data-go]') || go.disabled) return;
        st.busy = true;
        go.disabled = true;
        h.classList.add('is-busy');
        dock.classList.add('is-busy');
        try {
          const wallet = await ownWallet();
          if (!wallet) throw fail('noWallet');
          const json = await call('orders', { key, adId: ad.id, amount: amountRub(), methodId: st.method, wallet });
          CK.haptic.success();
          ui.close();
          openDeal(json.deal.id);
          if (market) market.refresh();
        } catch (err) {
          if (err.code === 'noWallet') CK.toast(esc(t('noWallet')), { icon: 'wallet', tone: 'accent' });
          else oops(err);
        } finally {
          st.busy = false;
          go.disabled = false;
          h.classList.remove('is-busy');
          dock.classList.remove('is-busy');
        }
      };
    }
  }

  function openNote() {
    CK.sheet.open({ title: () => t('title'), build(b) { b.innerHTML = `<div class="group">${empty('tgOnly', 'warning')}</div>`; } });
  }

  function open(id) {
    if (CK.sheet.top) return;
    CK.haptic.light();
    loginData().then((initData) => {
      if (CK.sheet.top) return;
      if (!initData && !SAMPLE) return openNote();
      if (!tabCtx || !stack) {
        if (ID.test(String(id || ''))) config().then((cfg) => { P.cfg = P.cfg || cfg; openDeal(id); }, oops);
        return undefined;
      }
      if (borrowed) {
        if (tabCtx.goTab && tabCtx.id) tabCtx.goTab(tabCtx.id);
        return void openMine({ stack, goTab: tabCtx.goTab, id: tabCtx.id }, id).catch(() => {});
      }
      if (tabCtx.goTab) tabCtx.goTab('p2p');
      whenUp(() => {
        if (stack && stack.depth > 1) stack.popToRoot();
        if (ID.test(String(id || ''))) openDeal(id);
      });
      return undefined;
    });
  }
  const upQueue = [];
  function whenUp(fn) {
    if (tabUp) return fn();
    upQueue.push(fn);
    return undefined;
  }

  const MOUNT_RETRIES = 1;
  const MOUNT_RETRY_MS = 1500;
  let place = null;
  let tabUp = false;
  let mounting = false;
  let linkDone = false;
  let meBtn = null;
  const skeleton = () => `<div class="p2p-loading" aria-busy="true"><div class="p2p-toprow"><span class="skel p2p-sk-seg"></span><span class="skel p2p-sk-seg"></span></div><div class="p2p-filters"><span class="skel p2p-sk-pill p2p-sk-pill--a"></span><span class="skel p2p-sk-pill"></span><span class="skel p2p-sk-pill"></span></div><div class="p2p-list">${skelCard()}${skelCard()}${skelCard()}</div></div>`;
  function sayInPlace(kind) {
    if (tabUp || !place) return;
    if (kind === 'tgOnly') {
      place.innerHTML = `<div class="card p2p-card">${empty('tgOnly', 'warning')}</div>`;
      return;
    }
    place.innerHTML = `<div class="p2p-soon">${mark('p2p', 'blue', 64)}<h2 data-p2p-t="soonTitle">${esc(t('soonTitle'))}</h2></div>`;
  }
  function openLink() {
    if (linkDone) return;
    linkDone = true;
    const link = new URLSearchParams(location.search).get('p2p');
    if (link && (link === 'open' || ID.test(link))) setTimeout(() => open(link === 'open' ? null : link), 400);
  }
  const previewHash = () => /^#kit-p2p/.test(location.hash || '');
  const previewAllowed = () => !!Parts.sample && !(CK.tg && CK.tg.inside) && (CK.market.mode !== 'live' || previewHash());
  function openPreviewScreen() {
    if (!SAMPLE) return;
    const m = /^#(?:kit-)?p2p-([a-z-]+)/.exec(location.hash || '');
    if (m && SAMPLE.openScreen) setTimeout(() => SAMPLE.openScreen(m[1]), 450);
  }
  let spinEl = null, spinTimer = 0;
  function setSpin(on) {
    clearTimeout(spinTimer);
    if (!spinEl && meBtn && meBtn.parentNode) {
      spinEl = CK.el(`<span class="p2p-spin" role="status" aria-label="${esc(t('refreshing'))}"></span>`);
      meBtn.parentNode.insertBefore(spinEl, meBtn.parentNode.firstChild);
    }
    if (!spinEl) return;
    if (!on) return void spinEl.classList.remove('is-on');
    spinTimer = setTimeout(() => spinEl.classList.add('is-on'), 250);
  }
  function setBadge(n) {
    P.activeCount = n || 0;
    if (!meBtn) return;
    let b = meBtn.querySelector('.p2p-badge');
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = CK.el('<span class="p2p-badge"></span>'); meBtn.appendChild(b); }
    b.textContent = n > 9 ? '9+' : String(n);
  }
  function up(cfg) {
    tabUp = true;
    P.cfg = cfg;
    const hadSkeleton = !!place.querySelector('.p2p-loading');
    place.innerHTML = '';
    if (meBtn) meBtn.hidden = false;
    market = buildMarket(place);
    if (hadSkeleton) play(place, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    upQueue.splice(0).forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
    openLink();
    openPreviewScreen();
  }
  function startSample() {
    SAMPLE = Parts.sample(P);
    configJob = null;
    config().then(up, () => sayInPlace('tgOnly'));
  }
  function onShow() {
    if (tabUp) {
      if (market && (!stack || stack.depth === 1)) market.refresh();
      return;
    }
    if (mounting || !place) return;
    mounting = true;
    if (!place.querySelector('.p2p-loading')) place.innerHTML = skeleton();
    const attempt = (left) => loginData().then((initData) => (initData ? config() : null)).catch((err) => {
      if (left <= 0 || (err && err.code)) throw err;
      return new Promise((resolve) => setTimeout(resolve, MOUNT_RETRY_MS)).then(() => attempt(left - 1));
    });
    attempt(MOUNT_RETRIES).then((cfg) => {
      mounting = false;
      if (tabUp) return;
      if (!cfg) return previewAllowed() ? startSample() : sayInPlace('tgOnly');
      up(cfg);
      return undefined;
    }, () => {
      mounting = false;
      sayInPlace('soon');
    });
  }
  function mount(pane, ctx) {
    tabCtx = ctx;
    const screen = CK.screen({
      title: CK.tr ? CK.tr('tab.p2p') : t('title'), compactTop: true, avatar: ctx.openProfile, headExtra: ctx.statusHtml,
      actions: [{
        icon: 'person',
        label: () => t('myP2P'),
        className: 'p2p-mebtn',
        onClick() { if (P.openMe && tabUp) { CK.haptic.selection(); P.openMe(); } },
        mount(b) {
          meBtn = b;
          b.hidden = !tabUp;
          if (b.parentNode && b.parentNode.firstChild !== b) b.parentNode.insertBefore(b, b.parentNode.firstChild);
        }
      }]
    });
    screen.el.classList.add('p2p-screen');
    bindDoc();
    screen.body.innerHTML = '<div class="p2p-page p2p-tab"></div>';
    place = screen.body.firstElementChild;
    CK.i18n.bind(place, () => place.querySelectorAll('[data-p2p-t]').forEach((el) => { el.textContent = t(el.getAttribute('data-p2p-t')); }));
    const made = ctx.makeStack(ctx.id || 'p2p', screen);
    stack = made && typeof made.push === 'function' ? made : null;
    if (previewHash() && CK.market.ready && ctx.goTab) CK.market.ready.then(() => setTimeout(() => ctx.goTab(ctx.id || 'p2p'), 0));
    return { onShow };
  }

  const pageHidden = () => ((typeof document === 'object' && document.querySelector ? document.querySelector('meta[name="dp-p2p"]') : null) || {}).content === 'hidden';
  const hiddenNow = () => pageHidden() || !!(P.cfg && P.cfg.open === false);
  let borrowed = false;
  function openMine(ctx, dealId) {
    const c = ctx || {};
    const deal = ID.test(String(dealId || '')) ? String(dealId) : null;
    const show = () => {
      if (deal) openDeal(deal);
      else if (P.openMe) P.openMe();
    };
    if (place && !borrowed) {
      if (tabCtx && tabCtx.goTab) tabCtx.goTab(tabCtx.id || 'p2p');
      return new Promise((resolve) => whenUp(() => {
        if (stack && stack.depth > 1) stack.popToRoot();
        show();
        resolve();
      }));
    }
    if (!c.stack || typeof c.stack.push !== 'function') return Promise.reject(fail('no_stack'));
    return loginData().then((initData) => {
      if (!initData && !SAMPLE) return void openNote();
      return config().then((cfg) => {
        P.cfg = cfg;
        stack = c.stack;
        tabCtx = { ...(tabCtx || {}), goTab: c.goTab || (tabCtx && tabCtx.goTab), id: c.id || null };
        borrowed = true;
        tabUp = true;
        upQueue.splice(0).forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
        show();
      });
    }).catch((err) => { oops(err); throw err; });
  }

  async function usesWallet(address) {
    const raw = CK.ton.rawAddress(address);
    let deals, ads;
    try {
      [deals, ads] = await Promise.all([call('deals'), call('ads/mine')]);
    } catch (err) {
      if (err && (err.code === 'p2p_off' || err.code === 'tg_only')) return false;
      throw Object.assign(new Error('wallet_unsure'), { code: 'wallet_unsure' });
    }
    const here = (row) => CK.ton.rawAddress(row.wallet) === raw;
    return (deals.deals || []).some((deal) => here(deal) && !DEAL_OVER.has(deal.status)) || (ads.ads || []).some((ad) => here(ad) && ad.state !== 'off');
  }

  Object.assign(P, {
    S, t, esc, icon, $, LANGS, errorText, oops, fail, rolledText, rollIn, NBSP, numText, unitsText, symText, coinsText, fiatSign, moneyText, rubText, sumText, limitsText, priceText, unitsPlain,
    compactText, rubShort, limitsShort, coinsCompact, sizeText, help, fileOf, fileKind, upload, openFile, warmLink, FILE_TYPES, FILE_ACCEPT,
    shortAddr, coinsShort, dealsText, starsText, personText, trustText, pctText, floor2, typed, randomKey, call, config, picture, ownWallet, pinnedCoin, useWallet, unlocked, holdDeposit, depositHeld,
    Audit, SIGNATURE_LIFE_S, ID, WALLET, FILE_MAX, POLL_MS, FIAT, DEAL_OVER, dealActive, kindName, bankLogo, payLogo, methodLogo, logoStack, tag, statusTone, empty, mark, ava, myAva, trustHtml, parts, demoNote, skelCard, skelRows, errorCard,
    copyRow, copyFrom, fact, stepSheet, confirmStep, confirmSheet, passBox, pickSheet, picker, personStep, openPerson, pushScreen, toRoot, openDeal, openAd, setBadge,
    approxUnits, coinsApprox, fold, foldRow, applyFolds, toggleFold, statsLine, statsRows, lowerFirst, why,
    markRated(id) {
      if (P.cfg && P.cfg.me && Array.isArray(P.cfg.me.unrated)) P.cfg.me.unrated = P.cfg.me.unrated.filter((one) => one !== id);
      if (market) market.paintTop();
    }
  });
  Object.defineProperties(P, {
    demo: { get: () => !!SAMPLE, enumerable: true },
    stack: { get: () => stack, enumerable: true },
    ctx: { get: () => tabCtx, enumerable: true },
    market: { get: () => market, enumerable: true },
    hidden: { get: () => hiddenNow(), enumerable: true }
  });
  ['deal', 'me'].forEach((name) => {
    if (typeof Parts[name] !== 'function') return;
    try { Object.assign(P, Parts[name](P)); } catch (err) { if (typeof console !== 'undefined') console.error(err); }
  });

  window.DemoP2P = {
    mount,
    open,
    openMine,
    openDeal,
    usesWallet
  };
})();
