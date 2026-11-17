(function () {
  'use strict';
  const Parts = window.DemoP2PParts = window.DemoP2PParts || {};

  const TEXTS = {
    dealBuyTitle: ['Покупка {sym}', 'Buying {sym}', 'Купівля {sym}', '{sym} сатып алу'],
    dealSellTitle: ['Продажа {sym}', 'Selling {sym}', 'Продаж {sym}', '{sym} сату'],
    disputeTitle: ['Спор #{id}', 'Dispute #{id}', 'Спір #{id}', 'Дау #{id}'],
    tLeftConfirm: ['На подтверждение', 'To confirm', 'На підтвердження', 'Растауға'],
    tLeftLock: ['На залог', 'To lock', 'На заставу', 'Кепілге'],
    tLeftPay: ['На оплату', 'To pay', 'На оплату', 'Төлеуге'],
    st1: ['Залог', 'Locked', 'Застава', 'Кепіл'],
    st2: ['Оплата', 'Payment', 'Оплата', 'Төлем'],
    st3: ['Проверка', 'Check', 'Перевірка', 'Тексеру'],
    st4: ['Готово', 'Done', 'Готово', 'Аяқталды'],
    stDispute: ['Спор', 'Dispute', 'Спір', 'Дау'],
    stDecided: ['Решение арбитра', 'Arbiter\'s decision', 'Рішення арбітра', 'Арбитр шешімі'],
    byPrice: ['{coins} по {price}', '{coins} at {price}', '{coins} по {price}', '{coins}, бағасы {price}'],
    bankCheckNote: ['Проверяйте в банке, не по чеку', 'Check your bank, not the receipt', 'Перевіряйте в банку, не за чеком', 'Чекті емес, банкті тексеріңіз'],
    safe1: ['Только на эти реквизиты', 'Only to these details', 'Лише на ці реквізити', 'Тек осы деректемелерге'],
    safe2: ['Одним переводом со своего счёта, имя получателя в банке должно совпасть.', 'One transfer from your own account; the recipient\'s name in the bank must match.', 'Одним переказом зі свого рахунку, ім\'я отримувача в банку має збігтися.', 'Өз шотыңыздан бір аударыммен, банктегі алушы аты сәйкес болуы керек.'],
    vSum: ['Сумма', 'Amount', 'Сума', 'Сома'],
    chatWithSeller: ['Чат с продавцом', 'Chat with the seller', 'Чат із продавцем', 'Сатушымен чат'],
    chatWithBuyer: ['Чат с покупателем', 'Chat with the buyer', 'Чат із покупцем', 'Сатып алушымен чат'],
    chatDeal: ['Чат сделки', 'Deal chat', 'Чат угоди', 'Мәміле чаты'],
    noMsgs: ['Сообщений пока нет', 'No messages yet', 'Повідомлень поки немає', 'Әзірге хабарлама жоқ'],
    photo: ['Фото', 'Photo', 'Фото', 'Фото'],
    chatClosed: ['Чат закрыт: сделка завершена', 'The chat is closed: the deal is over', 'Чат закрито: угоду завершено', 'Чат жабық: мәміле аяқталды'],
    send2: ['Отправить', 'Send', 'Надіслати', 'Жіберу'],
    dealNo: ['Номер сделки', 'Deal number', 'Номер угоди', 'Мәміле нөмірі'],
    opened: ['Открыта', 'Opened', 'Відкрито', 'Ашылды'],
    closedAt: ['Завершена', 'Finished', 'Завершено', 'Аяқталды'],
    problem: ['У меня проблема', 'I have a problem', 'У мене проблема', 'Менде мәселе бар'],
    problemT: ['Что случилось?', 'What happened?', 'Що сталося?', 'Не болды?'],

    x_created_maker: ['Подтвердите заказ', 'Confirm the order', 'Підтвердіть замовлення', 'Тапсырысты растаңыз'],
    x_created_taker: ['Ждём подтверждения', 'Waiting for confirmation', 'Чекаємо підтвердження', 'Растауды күтеміз'],
    x_lock_seller: ['Внесите монеты в залог', 'Lock the coins', 'Внесіть монети в заставу', 'Монеталарды кепілге салыңыз'],
    x_lock_sent: ['Монеты в пути', 'The coins are on their way', 'Монети в дорозі', 'Монеталар жолда'],
    x_lock_sent_sub: ['Ждём сеть', 'Waiting for the network', 'Чекаємо мережу', 'Желіні күтеміз'],
    x_lock_buyer: ['Продавец вносит монеты', 'The seller is locking the coins', 'Продавець вносить монети', 'Сатушы монеталарды салып жатыр'],
    x_lock_buyer_sub: ['Пока не платите', 'Do not pay yet', 'Поки не платіть', 'Әзір төлемеңіз'],
    x_locked_buyer: ['Переведите {sum}', 'Send {sum}', 'Перекажіть {sum}', '{sum} аударыңыз'],
    x_locked_seller: ['Ждём оплату', 'Waiting for the payment', 'Чекаємо оплату', 'Төлемді күтеміз'],
    x_locked_seller_sub: ['Сначала деньги на счёте', 'Money in your account first', 'Спершу гроші на рахунку', 'Алдымен ақша шотқа түссін'],
    x_paid_seller: ['Проверьте поступление', 'Check the money arrived', 'Перевірте надходження', 'Түскен ақшаны тексеріңіз'],
    x_paid_buyer: ['Ждём продавца', 'Waiting for the seller', 'Чекаємо продавця', 'Сатушыны күтеміз'],
    x_disputed: ['Идёт спор', 'Dispute under way', 'Триває спір', 'Дау жүріп жатыр'],
    x_disputed_sub: ['Решит арбитр. Монеты пока в залоге.', 'An arbiter decides. The coins stay locked.', 'Вирішить арбітр. Монети поки в заставі.', 'Арбитр шешеді. Монеталар кепілде.'],
    x_disputed_arbiter: ['Спор ждёт решения', 'The dispute waits for you', 'Спір чекає рішення', 'Дау шешімді күтуде'],
    x_disputed_arbiter_sub: ['Прочитайте чат и чек', 'Read the chat and the receipt', 'Прочитайте чат і чек', 'Чат пен чекті оқыңыз'],
    x_pending: ['Ждём кошелёк площадки', 'Waiting for the platform wallet', 'Чекаємо гаманець майданчика', 'Алаң әмиянын күтеміз'],
    x_released_buyer: ['Монеты у вас', 'The coins are yours', 'Монети у вас', 'Монеталар сізде'],
    x_released_seller: ['Сделка завершена', 'The deal is done', 'Угоду завершено', 'Мәміле аяқталды'],
    x_resolved: ['Спор решён', 'The dispute is decided', 'Спір вирішено', 'Дау шешілді'],
    x_toBuyer_sub: ['Арбитр отдал монеты покупателю.', 'The arbiter gave the coins to the buyer.', 'Арбітр віддав монети покупцю.', 'Арбитр монеталарды сатып алушыға берді.'],
    x_toSeller_sub: ['Арбитр вернул монеты продавцу.', 'The arbiter returned the coins to the seller.', 'Арбітр повернув монети продавцю.', 'Арбитр монеталарды сатушыға қайтарды.'],
    x_fined_sub: ['Продавец оштрафован, монеты ушли в штрафы', 'The seller was fined; the coins went to fines', 'Продавця оштрафовано, монети пішли у штрафи', 'Сатушыға айыппұл, монеталар айыппұлға кетті'],
    x_cancelled: ['Сделка отменена', 'The deal is cancelled', 'Угоду скасовано', 'Мәміле тоқтатылды'],
    x_expired: ['Время вышло', 'Time ran out', 'Час вийшов', 'Уақыт бітті'],

    confirmOrder: ['Подтвердить заказ', 'Confirm the order', 'Підтвердити замовлення', 'Тапсырысты растау'],
    decline: ['Отклонить', 'Decline', 'Відхилити', 'Бас тарту'],
    cancelOrder: ['Отменить заказ', 'Cancel the order', 'Скасувати замовлення', 'Тапсырысты тоқтату'],
    cancelDeal: ['Отменить сделку', 'Cancel the deal', 'Скасувати угоду', 'Мәмілені тоқтату'],
    keepDeal: ['Не отменять', 'Keep it', 'Не скасовувати', 'Тоқтатпау'],
    cancelQ: ['Отменить сделку?', 'Cancel the deal?', 'Скасувати угоду?', 'Мәмілені тоқтатасыз ба?'],
    cancelOrderQ: ['Отменить заказ?', 'Cancel the order?', 'Скасувати замовлення?', 'Тапсырысты тоқтатасыз ба?'],
    declineOrderQ: ['Отклонить заказ?', 'Decline the order?', 'Відхилити замовлення?', 'Тапсырыстан бас тартасыз ба?'],
    declineOrder: ['Отклонить заказ', 'Decline the order', 'Відхилити замовлення', 'Тапсырыстан бас тарту'],
    keepOrder: ['Не отклонять', 'Keep it', 'Не відхиляти', 'Бас тартпау'],
    turnPay: ['Переведите деньги', 'Send the money', 'Перекажіть гроші', 'Ақшаны аударыңыз'],
    receiptBuyer: ['Чек покупателя', 'Buyer\'s receipt', 'Чек покупця', 'Сатып алушының чегі'],
    cancelFunded: ['Уже перевели? Не отменяйте', 'Already paid? Do not cancel', 'Вже переказали? Не скасовуйте', 'Аудардыңыз ба? Тоқтатпаңыз'],
    cancelEarly: ['Монеты никуда не уйдут', 'No coins move', 'Монети нікуди не підуть', 'Монеталар ешқайда кетпейді'],
    cannotCancel: ['Перевод отправлен, отменить нельзя', 'Sent, cannot cancel now', 'Переказ надіслано, скасувати не можна', 'Жіберілді, тоқтату мүмкін емес'],
    releaseQT: ['Деньги пришли?', 'Has the money come?', 'Гроші прийшли?', 'Ақша түсті ме?'],
    moneyCame: ['Деньги уже пришли?', 'Has the money come?', 'Гроші вже прийшли?', 'Ақша түсті ме?'],
    h_waitSeller: ['Продавец проверяет поступление', 'The seller is checking the money', 'Продавець перевіряє надходження', 'Сатушы түскен ақшаны тексеріп жатыр'],
    h_waitArbiter: ['Решение примет арбитр', 'The arbiter will decide', 'Рішення ухвалить арбітр', 'Шешімді арбитр қабылдайды'],
    paidT: ['Подтвердите оплату', 'Confirm the payment', 'Підтвердіть оплату', 'Төлемді растаңыз'],
    paidQ: ['Вы перевели {sum} на {bank}?', 'Did you send {sum} to {bank}?', 'Ви переказали {sum} на {bank}?', '{sum} соманы {bank} шотына аудардыңыз ба?'],
    replace: ['Заменить', 'Replace', 'Замінити', 'Ауыстыру'],
    yesPaid: ['Да, я оплатил', 'Yes, I have paid', 'Так, я сплатив', 'Иә, төледім'],
    releaseQ: ['Пришло {sum}? Смотрите банк', 'Got {sum}? Look at your bank', 'Прийшло {sum}? Дивіться банк', '{sum} түсті ме? Банкті қараңыз'],
    yesCame: ['Да, деньги пришли', 'Yes, the money came', 'Так, гроші прийшли', 'Иә, ақша түсті'],
    signRelease: ['Подписать и отпустить', 'Sign and release', 'Підписати й відпустити', 'Қол қойып, босату'],
    signDeposit: ['Подписать и внести', 'Sign and deposit', 'Підписати й внести', 'Қол қойып, салу'],
    escrowWallet: ['Кошелёк площадки', 'Platform wallet', 'Гаманець майданчика', 'Алаң әмияны'],
    depositT: ['Залог монет', 'Locking the coins', 'Застава монет', 'Монеталар кепілі'],
    depositNote: ['Вернутся вам, если сделку отменят', 'They come back if the deal is cancelled', 'Повернуться вам, якщо угоду скасують', 'Мәміле тоқтатылса, сізге қайтады'],
    resolveT: ['Решение по спору', 'Decide the dispute', 'Рішення щодо спору', 'Дау бойынша шешім'],
    resolveGo: ['Решить спор', 'Decide the dispute', 'Вирішити спір', 'Дауды шешу'],
    toBuyerSub: ['Покупатель получит {coins}', 'The buyer gets {coins}', 'Покупець отримає {coins}', 'Сатып алушы {coins} алады'],
    toSellerSub: ['Продавец получит {coins} назад', 'The seller gets {coins} back', 'Продавець отримає {coins} назад', 'Сатушы {coins} қайтарып алады'],
    toFineSub: ['Монеты сделки уйдут в штрафы площадки', 'The deal\'s coins go to the platform fines', 'Монети угоди підуть у штрафи майданчика', 'Мәміле монеталары алаң айыппұлдарына кетеді'],
    banQ: ['Закрыть доступ к P2P для {name}?', 'Close P2P for {name}?', 'Закрити доступ до P2P для {name}?', '{name} үшін P2P жабу керек пе?'],
    r_notPaying: ['Я ещё не платил и не буду', 'I have not paid and will not', 'Я ще не платив і не буду', 'Мен төлеген жоқпын және төлемеймін'],
    r_noAnswer: ['Продавец не отвечает', 'The seller does not answer', 'Продавець не відповідає', 'Сатушы жауап бермейді'],
    r_noAnswerInfo: ['Напишите в чат. Без реквизитов не платите.', 'Write in the chat. Do not pay without the details.', 'Напишіть у чат. Без реквізитів не платіть.', 'Чатқа жазыңыз. Деректемесіз төлемеңіз.'],
    openChat: ['Открыть чат', 'Open the chat', 'Відкрити чат', 'Чатты ашу'],
    r_other: ['Другое', 'Something else', 'Інше', 'Басқа'],
    r_paidNoCoins: ['Я оплатил, а монеты не пришли', 'I paid and the coins did not come', 'Я сплатив, а монети не прийшли', 'Төледім, бірақ монеталар келмеді'],
    r_askMore: ['Продавец просит перевести ещё раз или иначе', 'The seller asks me to pay again or another way', 'Продавець просить переказати ще раз або інакше', 'Сатушы қайта немесе басқаша аударуды сұрайды'],
    r_buyerNotPaying: ['Покупатель не платит', 'The buyer does not pay', 'Покупець не платить', 'Сатып алушы төлемейді'],
    r_buyerNotPayingInfo: ['Если покупатель не оплатит вовремя, монеты вернутся вам сами.', 'If the buyer does not pay in time, the coins come back by themselves.', 'Якщо покупець не сплатить вчасно, монети повернуться вам самі.', 'Сатып алушы уақытында төлемесе, монеталар өзі қайтады.'],
    r_wrongMoney: ['Деньги пришли не полностью или не от того человека', 'Not all the money came, or from someone else', 'Гроші прийшли не повністю або не від тієї людини', 'Ақша толық емес немесе басқа адамнан келді'],
    r_noMoney: ['Деньги не пришли', 'The money did not come', 'Гроші не прийшли', 'Ақша түспеді'],
    r_otherSum: ['Пришла другая сумма', 'Another amount came', 'Прийшла інша сума', 'Басқа сома түсті'],
    disputeNote: ['Решит арбитр, монеты пока в залоге', 'An arbiter decides; the coins stay locked', 'Вирішить арбітр, монети поки в заставі', 'Арбитр шешеді, монеталар кепілде'],
    disputeLabel: ['Опишите, что произошло', 'Say what happened', 'Опишіть, що сталося', 'Не болғанын сипаттаңыз'],
    addShot: ['Прикрепить файл', 'Attach a file', 'Прикріпити файл', 'Файл тіркеу'],
    shotAdded: ['Файл прикреплён', 'File attached', 'Файл прикріплено', 'Файл тіркелді'],
    openWallet: ['Открыть кошелёк', 'Open the wallet', 'Відкрити гаманець', 'Әмиянды ашу'],
    toAds: ['К объявлениям', 'Back to the ads', 'До оголошень', 'Хабарландыруларға'],
    c_buyer: ['Покупатель отменил сделку.', 'The buyer cancelled the deal.', 'Покупець скасував угоду.', 'Сатып алушы мәмілені тоқтатты.'],
    c_seller: ['Продавец отменил сделку.', 'The seller cancelled the deal.', 'Продавець скасував угоду.', 'Сатушы мәмілені тоқтатты.'],
    c_system: ['Сделку отменила площадка.', 'The platform cancelled the deal.', 'Угоду скасував майданчик.', 'Мәмілені алаң тоқтатты.'],
    c_refunded: ['Монеты вернулись продавцу.', 'The coins went back to the seller.', 'Монети повернулися продавцю.', 'Монеталар сатушыға қайтты.'],
    c_refunding: ['Монеты возвращаются продавцу.', 'The coins are going back to the seller.', 'Монети повертаються продавцю.', 'Монеталар сатушыға қайтып жатыр.'],
    ex_created: ['Владелец объявления не подтвердил заказ вовремя.', 'The ad owner did not confirm the order in time.', 'Власник оголошення не підтвердив замовлення вчасно.', 'Хабарландыру иесі тапсырысты уақытында растамады.'],
    ex_lock: ['Продавец не внёс монеты в залог вовремя.', 'The seller did not lock the coins in time.', 'Продавець не вніс монети в заставу вчасно.', 'Сатушы монеталарды уақытында кепілге салмады.'],
    ex_pay: ['Покупатель не отметил оплату вовремя.', 'The buyer did not mark the payment in time.', 'Покупець не позначив оплату вчасно.', 'Сатып алушы төлемді уақытында белгілемеді.'],
    sys_locked: ['Монеты в залоге', 'Coins locked', 'Монети в заставі', 'Монеталар кепілде'],
    sys_paid: ['Покупатель отметил оплату', 'The buyer marked the payment', 'Покупець позначив оплату', 'Сатып алушы төлемді белгіледі'],
    sys_disputed: ['Открыт спор', 'A dispute was opened', 'Відкрито спір', 'Дау ашылды'],
    sys_released: ['Монеты отправлены покупателю', 'The coins were sent to the buyer', 'Монети надіслано покупцю', 'Монеталар сатып алушыға жіберілді'],
    sys_cancelled: ['Сделка отменена', 'The deal was cancelled', 'Угоду скасовано', 'Мәміле тоқтатылды'],
    sys_expired: ['Время вышло', 'Time ran out', 'Час вийшов', 'Уақыт бітті'],
    sys_deposit_sent: ['Продавец отправил монеты в залог', 'The seller sent the coins to escrow', 'Продавець надіслав монети в заставу', 'Сатушы монеталарды кепілге жіберді'],
    active: ['Активные', 'Active', 'Активні', 'Белсенді'],
    finished: ['Завершённые', 'Finished', 'Завершені', 'Аяқталғандар'],
    noActive: ['Активных сделок нет', 'No active deals', 'Активних угод немає', 'Белсенді мәміле жоқ'],
    noFinished: ['Завершённых сделок пока нет', 'No finished deals yet', 'Завершених угод поки немає', 'Әзірге аяқталған мәміле жоқ'],
    dealsFail: ['Не удалось загрузить сделки', 'The deals did not load', 'Не вдалося завантажити угоди', 'Мәмілелер жүктелмеді'],
    tLeftCheck: ['До спора', 'Until dispute', 'До спору', 'Дауға дейін'],
    x_disputed_auto_sub: ['Продавец не ответил вовремя, спор открыт автоматически. Решит арбитр.', 'The seller didn’t answer in time, so the dispute opened automatically. An arbiter decides.', 'Продавець не відповів вчасно, спір відкрито автоматично. Вирішить арбітр.', 'Сатушы уақытында жауап бермеді, дау автоматты түрде ашылды. Арбитр шешеді.'],
    sys_paid_mine: ['Вы отметили оплату', 'You marked the payment', 'Ви позначили оплату', 'Сіз төлемді белгіледіңіз'],
    sys_deposit_mine: ['Вы отправили монеты в залог', 'You sent the coins to escrow', 'Ви надіслали монети в заставу', 'Сіз монеталарды кепілге жібердіңіз'],
    sys_disputed_auto: ['Спор открыт автоматически', 'Dispute opened automatically', 'Спір відкрито автоматично', 'Дау автоматты түрде ашылды'],
    pdf: ['PDF', 'PDF', 'PDF', 'PDF'],
    uploading: ['{pct}\u00a0%', '{pct}%', '{pct}\u00a0%', '{pct}\u00a0%'],
    upFail: ['Не загрузилось', 'Upload failed', 'Не завантажилося', 'Жүктелмеді'],
    openFile: ['Открыть', 'Open', 'Відкрити', 'Ашу'],
    dealFail: ['Не удалось открыть сделку', 'The deal did not open', 'Не вдалося відкрити угоду', 'Мәміле ашылмады'],
    rcNoProof: ['Автопроверка не подтверждает поступление денег. Зачисление видит только продавец в своём банке.', 'The automatic check does not confirm the money arrived. Only the seller sees it in their bank.', 'Автоперевірка не підтверджує надходження грошей. Зарахування бачить лише продавець у своєму банку.', 'Автотексеру ақшаның түскенін растамайды. Оны тек сатушы өз банкінен көреді.'],
    rcSellerNote: ['Проверьте в банке', 'Check your bank', 'Перевірте в банку', 'Банктен тексеріңіз'],
    rc_pending: ['Проверяется…', 'Checking…', 'Перевіряється…', 'Тексерілуде…'],
    rc_ok: ['Явных проблем не найдено', 'No obvious problems found', 'Явних проблем не знайдено', 'Анық мәселе табылмады'],
    rc_partial: ['Проверено частично', 'Partly checked', 'Перевірено частково', 'Ішінара тексерілді'],
    rc_flagged: ['Есть замечания', 'Has remarks', 'Є зауваження', 'Ескертулер бар'],
    rc_rejected: ['Чек не принят', 'Receipt not accepted', 'Чек не прийнято', 'Чек қабылданбады'],
    rc_rejectedArb: ['Отклонён автоматически', 'Rejected automatically', 'Відхилено автоматично', 'Автоматты түрде қабылданбады'],
    rc_unchecked: ['Не проверен', 'Not checked', 'Не перевірено', 'Тексерілмеді'],
    rc_accepted: ['Принят арбитром', 'Accepted by the arbiter', 'Прийнято арбітром', 'Арбитр қабылдады'],
    rcFileOk: ['Файл загружен', 'File uploaded', 'Файл завантажено', 'Файл жүктелді'],
    rcChecking: ['Проверяем файл…', 'Checking the file…', 'Перевіряємо файл…', 'Файлды тексеріп жатырмыз…'],
    rcSlow: ['Проверка ещё идёт. Можно нажать «Да, я оплатил».', 'Still checking. You can press “Yes, I have paid”.', 'Перевірка ще триває. Можна натиснути «Так, я сплатив».', 'Тексеру әлі жүріп жатыр. «Иә, төледім» басуға болады.'],
    rcNotReceipt: ['Это не чек', 'Not a receipt', 'Це не чек', 'Бұл чек емес'],
    rcUnreadable: ['Файл не читается', 'File cannot be read', 'Файл не читається', 'Файл оқылмайды'],
    rcNotOriginal: ['Нужен оригинал чека', 'The original receipt is needed', 'Потрібен оригінал чека', 'Чектің түпнұсқасы керек'],
    rcSendAnyway: ['Отправить всё равно', 'Send it anyway', 'Надіслати все одно', 'Бәрібір жіберу'],
    rcPickOther: ['Выбрать другой файл', 'Choose another file', 'Обрати інший файл', 'Басқа файл таңдау'],
    rcForce: ['Это чек, отправить всё равно', 'It is a receipt, send it anyway', 'Це чек, надіслати все одно', 'Бұл чек, бәрібір жіберу'],
    rrAmount: ['На чеке {read}, нужно {sum}', 'Receipt shows {read}, need {sum}', 'На чеку {read}, треба {sum}', 'Чекте {read}, керегі {sum}'],
    rrAmountN: ['На чеке меньше {sum}', 'Receipt shows under {sum}', 'На чеку менше {sum}', 'Чекте {sum} сомасынан аз'],
    rrRecipient: ['Не тот получатель', 'Wrong recipient', 'Не той отримувач', 'Алушы басқа'],
    rrStatus: ['Банк отклонил перевод', 'The bank declined it', 'Банк відхилив переказ', 'Банк аударымды қабылдамады'],
    rrTime: ['Дата чека не подходит', 'Wrong date on the receipt', 'Дата чека не підходить', 'Чек күні сәйкес емес'],
    rrDuplicate: ['Чек уже использован', 'Receipt already used', 'Чек уже використано', 'Чек бұрын қолданылған'],
    rrForged: ['Файл изменён, нужен оригинал', 'File altered, original needed', 'Файл змінено, потрібен оригінал', 'Файл өзгертілген, түпнұсқа керек'],
    rrUntilClose: ['Загрузите правильный чек до {time}. Если чека не будет, сделка закроется и монеты вернутся продавцу.', 'Upload the right receipt by {time}. Without it the deal closes and the coins go back to the seller.', 'Завантажте правильний чек до {time}. Якщо чека не буде, угода закриється і монети повернуться продавцю.', 'Дұрыс чекті {time} дейін жүктеңіз. Чек болмаса, мәміле жабылып, монеталар сатушыға қайтады.'],
    rrUntilDispute: ['Загрузите правильный чек до {time}. Если чека не будет, сделку рассмотрит арбитр.', 'Upload the right receipt by {time}. Without it an arbiter reviews the deal.', 'Завантажте правильний чек до {time}. Якщо чека не буде, угоду розгляне арбітр.', 'Дұрыс чекті {time} дейін жүктеңіз. Чек болмаса, мәмілені арбитр қарайды.'],
    yourTime: ['{time} (ваше время)', '{time} (your time)', '{time} (ваш час)', '{time} (сіздің уақыт)'],
    rrTries: ['Осталось попыток: {n}', 'Tries left: {n}', 'Лишилося спроб: {n}', 'Қалған әрекет: {n}'],
    rrNoTries: ['Попыток больше нет', 'No tries left', 'Спроб більше немає', 'Әрекет қалмады'],
    rrUpload: ['Загрузить другой чек', 'Upload another receipt', 'Завантажити інший чек', 'Басқа чек жүктеу'],
    rrPart2: ['Добавить чек второй части', 'Add the second part\'s receipt', 'Додати чек другої частини', 'Екінші бөлік чегін қосу'],
    rrPart3: ['Добавить чек третьей части', 'Add the third part\'s receipt', 'Додати чек третьої частини', 'Үшінші бөлік чегін қосу'],
    rrDisagree: ['Не согласен, открыть спор', 'I disagree, open a dispute', 'Не згоден, відкрити спір', 'Келіспеймін, дау ашу'],
    rrSend: ['Отправить чек', 'Send the receipt', 'Надіслати чек', 'Чекті жіберу'],
    rrNewT: ['Новый чек', 'New receipt', 'Новий чек', 'Жаңа чек'],
    rrPartT: ['Чек части {n}', 'Receipt of part {n}', 'Чек частини {n}', '{n}-бөлік чегі'],
    rrParts: ['Частей: {n}', 'Parts: {n}', 'Частин: {n}', 'Бөлік: {n}'],
    rfFlagged: ['Чек отправлен продавцу. Автопроверка нашла замечания: {list}.', 'The receipt went to the seller. The check found remarks: {list}.', 'Чек надіслано продавцю. Автоперевірка знайшла зауваження: {list}.', 'Чек сатушыға жіберілді. Автотексеру ескертулер тапты: {list}.'],
    rfPending: ['Перевод на чеке ещё в обработке. Когда он пройдёт, загрузите чек из истории операций.', 'The transfer on the receipt is still processing. Once it goes through, send the receipt from your operations history.', 'Переказ на чеку ще обробляється. Коли він пройде, завантажте чек з історії операцій.', 'Чектегі аударым әлі өңделуде. Өткенде операциялар тарихынан чекті жүктеңіз.'],
    rfPartial: ['Чек отправлен продавцу. Автопроверка не смогла прочитать: {what}.', 'The receipt went to the seller. The check could not read: {what}.', 'Чек надіслано продавцю. Автоперевірка не змогла прочитати: {what}.', 'Чек сатушыға жіберілді. Автотексеру оқи алмады: {what}.'],
    rfOk: ['Чек отправлен продавцу. Явных проблем не найдено.', 'The receipt went to the seller. No obvious problems found.', 'Чек надіслано продавцю. Явних проблем не знайдено.', 'Чек сатушыға жіберілді. Анық мәселе табылмады.'],
    rfUnchecked: ['Чек отправлен продавцу. Автоматически он не проверен.', 'The receipt went to the seller. It was not checked automatically.', 'Чек надіслано продавцю. Автоматично його не перевірено.', 'Чек сатушыға жіберілді. Ол автоматты түрде тексерілмеді.'],
    rfAccepted: ['Арбитр принял чек. Продавец проверит поступление.', 'The arbiter accepted the receipt. The seller checks the money.', 'Арбітр прийняв чек. Продавець перевірить надходження.', 'Арбитр чекті қабылдады. Сатушы түскен ақшаны тексереді.'],
    fl_amount: ['сумма', 'the amount', 'сума', 'сома'],
    fl_recipient: ['получатель', 'the recipient', 'отримувач', 'алушы'],
    fl_time: ['время перевода', 'the transfer time', 'час переказу', 'аударым уақыты'],
    fl_file: ['файл', 'the file', 'файл', 'файл'],
    fl_dup: ['похожий чек уже был', 'a similar receipt was used before', 'схожий чек уже був', 'ұқсас чек бұрын болған'],
    fl_kind: ['это не чек одной операции', 'not a receipt of one transfer', 'це не чек однієї операції', 'бұл бір операцияның чегі емес'],
    fl_chat: ['перевод на реквизиты из чата', 'paid to details from the chat', 'переказ на реквізити з чату', 'чаттағы деректемеге аударым'],
    fl_sbp: ['номер СБП', 'the SBP number', 'номер СБП', 'СБП нөмірі'],
    gp_amount: ['сумму', 'the amount', 'суму', 'соманы'],
    gp_recipient: ['получателя', 'the recipient', 'отримувача', 'алушыны'],
    gp_file: ['файл', 'the file', 'файл', 'файлды'],
    tLeftReceipt: ['Осталось на новый чек', 'Left for a new receipt', 'Лишилося на новий чек', 'Жаңа чекке қалды'],
    rx_seller: ['Чек отклонён', 'Receipt rejected', 'Чек відхилено', 'Чек қабылданбады'],
    rxSellerBody: ['Покупатель может загрузить другой чек до {time}. Если деньги пришли на ваш счёт, отпустите монеты.', 'The buyer can upload another receipt by {time}. If the money reached your account, release the coins.', 'Покупець може завантажити інший чек до {time}. Якщо гроші прийшли на ваш рахунок, відпустіть монети.', 'Сатып алушы {time} дейін басқа чек жүктей алады. Ақша шотыңызға түссе, монеталарды босатыңыз.'],
    rxSellerAsk: ['Если денег нет, нажмите «Денег не поступало». Без этой отметки после {time} сделку рассмотрит арбитр.', 'If no money came, press “No money came”. Without it an arbiter reviews the deal after {time}.', 'Якщо грошей немає, натисніть «Грошей не надходило». Без цієї позначки після {time} угоду розгляне арбітр.', 'Ақша жоқ болса, «Ақша түспеді» басыңыз. Бұл белгісіз {time} кейін мәмілені арбитр қарайды.'],
    rxSellerAskShort: ['Денег нет? Нажмите ниже', 'No money? Tap below', 'Грошей немає? Натисніть нижче', 'Ақша жоқ па? Төменде басыңыз'],
    rxSellerClose: ['После {time} сделка закроется, монеты вернутся вам.', 'After {time} the deal closes and the coins come back to you.', 'Після {time} угода закриється, монети повернуться вам.', '{time} кейін мәміле жабылып, монеталар сізге қайтады.'],
    rxSellerDispute: ['После {time} сделку рассмотрит арбитр.', 'After {time} an arbiter reviews the deal.', 'Після {time} угоду розгляне арбітр.', '{time} кейін мәмілені арбитр қарайды.'],
    noMoney: ['Денег не поступало', 'No money came', 'Грошей не надходило', 'Ақша түспеді'],
    noMoneySaid: ['Отмечено: денег нет, {time}', 'Marked: no money, {time}', 'Позначено: грошей немає, {time}', 'Белгіленді: ақша жоқ, {time}'],
    noMoneyQ: ['Записать для арбитра, что денег нет? Если деньги потом найдутся, это будет нарушением.', 'Record for the arbiter that no money came? If it turns up later, that counts as a violation.', 'Записати для арбітра, що грошей немає? Якщо гроші потім знайдуться, це буде порушенням.', 'Арбитрге ақша жоқ деп жазу керек пе? Кейін ақша табылса, бұл бұзушылық болады.'],
    x_autoClosed: ['Сделка закрыта автоматически', 'Closed automatically', 'Угоду закрито автоматично', 'Мәміле автоматты түрде жабылды'],
    acBuyer: ['Чек не прошёл проверку, новый чек не загружен. Монеты вернулись продавцу.', 'The receipt failed the check and no new one came. The coins went back to the seller.', 'Чек не пройшов перевірку, новий чек не завантажено. Монети повернулися продавцю.', 'Чек тексеруден өтпеді, жаңасы жүктелмеді. Монеталар сатушыға қайтты.'],
    acBuyerAppeal: ['Если вы оплатили, подайте жалобу до {time} и приложите выписку из банка.', 'If you paid, file an appeal by {time} with a bank statement.', 'Якщо ви сплатили, подайте скаргу до {time} і додайте виписку з банку.', 'Төлесеңіз, {time} дейін банк үзіндісімен шағым беріңіз.'],
    acSeller: ['Покупатель не загрузил правильный чек. Монеты возвращаются на ваш кошелёк. Покупатель может подать жалобу в течение 24 часов.', 'The buyer did not upload a valid receipt. The coins are coming back to your wallet. The buyer can appeal within 24 hours.', 'Покупець не завантажив правильний чек. Монети повертаються на ваш гаманець. Покупець може подати скаргу протягом 24 годин.', 'Сатып алушы дұрыс чек жүктемеді. Монеталар әмияныңызға қайтып жатыр. Сатып алушы 24 сағат ішінде шағым бере алады.'],
    acEscalated: ['Чек не прошёл проверку, новый чек не загружен. Сделку рассмотрит арбитр.', 'The receipt failed the check and no new one came. An arbiter reviews the deal.', 'Чек не пройшов перевірку, новий чек не завантажено. Угоду розгляне арбітр.', 'Чек тексеруден өтпеді, жаңасы жүктелмеді. Мәмілені арбитр қарайды.'],
    appealGo: ['Подать жалобу', 'File an appeal', 'Подати скаргу', 'Шағым беру'],
    appealT: ['Жалоба', 'Appeal', 'Скарга', 'Шағым'],
    appealLabel: ['Что произошло', 'What happened', 'Що сталося', 'Не болды'],
    appealFile: ['Приложить выписку из банка', 'Attach a bank statement', 'Додати виписку з банку', 'Банк үзіндісін тіркеу'],
    appealSent: ['Жалоба отправлена. Её рассмотрит арбитр.', 'Appeal sent. An arbiter reviews it.', 'Скаргу надіслано. Її розгляне арбітр.', 'Шағым жіберілді. Оны арбитр қарайды.'],
    appealBuyerRight: ['Арбитр признал жалобу.', 'The arbiter upheld the appeal.', 'Арбітр визнав скаргу.', 'Арбитр шағымды қабылдады.'],
    appealSellerRight: ['Арбитр отклонил жалобу.', 'The arbiter turned the appeal down.', 'Арбітр відхилив скаргу.', 'Арбитр шағымды қабылдамады.'],
    appealOver: ['Срок жалобы прошёл.', 'The appeal window is over.', 'Строк скарги минув.', 'Шағым мерзімі өтті.'],
    contactArb: ['Связь с арбитром: {who}', 'Arbiter contact: {who}', 'Зв\'язок з арбітром: {who}', 'Арбитрмен байланыс: {who}'],
    acT: ['Проверка чека', 'Receipt check', 'Перевірка чека', 'Чекті тексеру'],
    cl_duplicate: ['повтор', 'duplicate', 'повтор', 'қайталану'],
    cl_forged: ['файл изменён', 'file altered', 'файл змінено', 'файл өзгертілген'],
    cl_not_a_receipt: ['не чек', 'not a receipt', 'не чек', 'чек емес'],
    cl_mismatch: ['не совпадает со сделкой', 'does not match the deal', 'не збігається з угодою', 'мәмілеге сәйкес емес'],
    cl_unreadable: ['не читается', 'unreadable', 'не читається', 'оқылмайды'],
    cl_not_original: ['распечатка, не оригинал', 'a printout, not the original', 'роздруківка, не оригінал', 'түпнұсқа емес, басып шығарылған'],
    stAuto: ['Закрыта автоматически', 'Closed automatically', 'Закрито автоматично', 'Автоматты жабылды'],
    openReceipt: ['Открыть чек', 'Open the receipt', 'Відкрити чек', 'Чекті ашу'],
    acEndClose: ['В {time} закроется в пользу продавца', 'At {time} it closes in the seller\'s favour', 'О {time} закриється на користь продавця', '{time} сатушы пайдасына жабылады'],
    acEndDispute: ['В {time} уйдёт в спор', 'At {time} it goes to a dispute', 'О {time} піде в спір', '{time} дауға кетеді'],
    acTry: ['Отклонено {n} из {max}', 'Rejected {n} of {max}', 'Відхилено {n} з {max}', '{max} ішінен {n} қабылданбады'],
    acStuck: ['Возврат продавцу не прошёл: монеты в эскроу. Верните их вручную.', 'The refund to the seller did not go through: the coins are in escrow. Return them by hand.', 'Повернення продавцю не пройшло: монети в ескроу. Поверніть їх вручну.', 'Сатушыға қайтару өтпеді: монеталар эскроуда. Қолмен қайтарыңыз.'],
    acGot: ['На чеке', 'On the receipt', 'На чеку', 'Чекте'],
    acWant: ['В сделке', 'In the deal', 'В угоді', 'Мәміледе'],
    ar_type: ['Тип файла', 'File type', 'Тип файлу', 'Файл түрі'],
    ar_amount: ['Сумма', 'Amount', 'Сума', 'Сома'],
    ar_recipient: ['Получатель', 'Recipient', 'Отримувач', 'Алушы'],
    ar_other: ['Другие номера', 'Other numbers', 'Інші номери', 'Басқа нөмірлер'],
    ar_name: ['Имя', 'Name', 'Ім\'я', 'Аты'],
    ar_bank: ['Банк получателя', 'Recipient bank', 'Банк отримувача', 'Алушы банкі'],
    ar_time: ['Дата и время', 'Date and time', 'Дата і час', 'Күні мен уақыты'],
    ar_status: ['Статус', 'Status', 'Статус', 'Мәртебе'],
    ar_sbp: ['Номер СБП', 'SBP number', 'Номер СБП', 'СБП нөмірі'],
    ar_opno: ['Номер квитанции', 'Receipt number', 'Номер квитанції', 'Түбіртек нөмірі'],
    ar_file: ['Файл', 'File', 'Файл', 'Файл'],
    cf_high: ['точно', 'sure', 'точно', 'нақты'],
    cf_medium: ['вероятно', 'likely', 'імовірно', 'мүмкін'],
    cf_low: ['плохо читается', 'hard to read', 'погано читається', 'нашар оқылады'],
    acFile: ['Файл', 'File', 'Файл', 'Файл'],
    acDeal: ['Сделка', 'Deal', 'Угода', 'Мәміле'],
    acReader: ['Чтение', 'Reader', 'Читання', 'Оқу'],
    acReaderNone: ['нет, фото смотрите сами', 'none, look at photos yourself', 'немає, фото дивіться самі', 'жоқ, фотоны өзіңіз қараңыз'],
    acChat: ['Продавец писал в чате реквизиты: да ({n})', 'The seller wrote payment details in the chat: yes ({n})', 'Продавець писав у чаті реквізити: так ({n})', 'Сатушы чатқа деректеме жазды: иә ({n})'],
    acSaid: ['Продавец сообщил: денег не поступало, {time}', 'The seller said no money came, {time}', 'Продавець повідомив: грошей не надходило, {time}', 'Сатушы хабарлады: ақша түспеді, {time}'],
    acForced: ['Покупатель отправил файл несмотря на предупреждение', 'The buyer sent the file despite the warning', 'Покупець надіслав файл попри попередження', 'Сатып алушы ескертуге қарамай файлды жіберді'],
    acOpinion: ['Мнение модели, не доказательство', 'The model\'s opinion, not proof', 'Думка моделі, не доказ', 'Модель пікірі, дәлел емес'],
    acDup: ['Повтор: сделка #{id}', 'Repeat: deal #{id}', 'Повтор: угода #{id}', 'Қайталану: #{id} мәміле'],
    acTries: ['Чеки этой сделки', 'This deal\'s receipts', 'Чеки цієї угоди', 'Осы мәміле чектері'],
    acPart: ['часть', 'part', 'частина', 'бөлік'],
    acAccept: ['Принять чек', 'Accept the receipt', 'Прийняти чек', 'Чекті қабылдау'],
    acBuyerRight: ['Покупатель прав', 'The buyer is right', 'Покупець правий', 'Сатып алушы дұрыс'],
    acSellerRight: ['Продавец прав', 'The seller is right', 'Продавець правий', 'Сатушы дұрыс'],
    acAppealT: ['Жалоба покупателя', 'The buyer\'s appeal', 'Скарга покупця', 'Сатып алушы шағымы'],
    acAppealGo: ['Решить жалобу', 'Decide the appeal', 'Вирішити скаргу', 'Шағымды шешу'],
    acAppealNote: ['Монеты в приложении не двигаются. Запишите, как стороны рассчитаются.', 'No coins move in the app. Write how the sides settle.', 'Монети в застосунку не рухаються. Запишіть, як сторони розрахуються.', 'Қолданбада монета қозғалмайды. Тараптар қалай есептесетінін жазыңыз.'],
    acRight: ['Проверка права', 'The check is right', 'Перевірка права', 'Тексеру дұрыс'],
    acWrong: ['Проверка ошибается', 'The check is wrong', 'Перевірка помиляється', 'Тексеру қателеседі'],
    acLabelled: ['Отмечено: {what}', 'Marked: {what}', 'Позначено: {what}', 'Белгіленді: {what}'],
    dealIdTitle: ['Сделка #{id}', 'Deal #{id}', 'Угода #{id}', '#{id} мәміле'],
    arbWait: ['Ждёт нового чека', 'Waiting for a new receipt', 'Чекає нового чека', 'Жаңа чек күтуде'],
    acShadow: ['Наблюдение: было бы отклонено', 'Watching: would be rejected', 'Спостереження: було б відхилено', 'Бақылау: қабылданбас еді'],
    rrMismatch: ['Чек не совпадает со сделкой', 'Receipt does not match the deal', 'Чек не збігається з угодою', 'Чек мәмілеге сәйкес емес'],
    rs_ok: ['Проверка: явных проблем нет', 'Check: no obvious problems', 'Перевірка: явних проблем немає', 'Тексеру: анық мәселе жоқ'],
    rs_partial: ['Проверка: частично', 'Check: partial', 'Перевірка: частково', 'Тексеру: ішінара'],
    rs_flagged: ['Проверка: есть замечания', 'Check: has remarks', 'Перевірка: є зауваження', 'Тексеру: ескертулер бар'],
    rs_pending: ['Проверяется…', 'Checking…', 'Перевіряється…', 'Тексерілуде…'],
    rs_unchecked: ['Не проверен автоматически', 'Not checked automatically', 'Не перевірено автоматично', 'Автоматты түрде тексерілмеді'],
    rs_rejected: ['Чек отклонён: {why}', 'Receipt rejected: {why}', 'Чек відхилено: {why}', 'Чек қабылданбады: {why}'],
    rs_accepted: ['Принят арбитром', 'Accepted by the arbiter', 'Прийнято арбітром', 'Арбитр қабылдады'],
    af_producer: ['Программа', 'Producer', 'Програма', 'Бағдарлама'],
    af_revisions: ['Сохранений', 'Revisions', 'Збережень', 'Сақтау саны'],
    af_overlays: ['Наложения', 'Overlays', 'Накладання', 'Үстеме'],
    af_editor: ['Метка редактора', 'Editor tag', 'Мітка редактора', 'Редактор белгісі'],
    af_kind: ['Вид', 'Kind', 'Вигляд', 'Түрі'],
    af_render: ['Как получен', 'Made as', 'Як отримано', 'Қалай алынды'],
    af_profile: ['Профиль банка', 'Bank profile', 'Профіль банку', 'Банк профилі'],
    af_size: ['Размер', 'Size', 'Розмір', 'Өлшемі'],
    fk_screenshot: ['скриншот', 'screenshot', 'скриншот', 'скриншот'],
    fk_photo: ['фото', 'photo', 'фото', 'фото'],
    fk_pdf: ['PDF', 'PDF', 'PDF', 'PDF'],
    acNone: ['нет', 'none', 'немає', 'жоқ']
  };

  Parts.deal = function (P) {
    const { t, esc, icon, $ } = P;
    Object.assign(P.S, TEXTS);
    const FINISHED = /^(released|resolved_|fined)/;
    const FUNDED = ['locked', 'paid', 'disputed'];
    const LIVE_CLOCK = ['created', 'awaiting_lock', 'locked'];
    const clockText = (left) => `${String(Math.floor(left / 60000)).padStart(2, '0')}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    const capFirst = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x);
    const coinsOf = (d, units) => P.coinsText(units || d.units, d.decimals, d.symbol);
    const still = () => CK.reducedMotion() || !Element.prototype.animate;
    const curve = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'ease-out';
    function fadeSwap(el, ms) {
      if (!el || still()) return;
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms || 200, easing: curve('--ease-ios') });
    }
    function popIn(el) {
      if (!el || still()) return;
      el.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 400, easing: curve('--spring') });
    }
    const shortOf = (d) => P.coinsShort(d.units, d.decimals, d.symbol, 4);
    const depositKey = (d) => 'deal:' + d.id;
    const lockSent = (d) => !!d.depositSent || P.depositHeld(depositKey(d));
    const sumOf = (d) => P.sumText(d.fiatAmount, d.fiat);
    const otherOf = (d) => (d.me === 'seller' ? d.buyer : d.seller);
    const otherRole = (d) => (d.me === 'seller' ? 'buyer' : 'seller');
    const btn = (act, label, cls) => `<button class="btn press ${cls || ''}" type="button" data-act="${act}">${esc(label)}</button>`;
    const hist = (d, s) => { const h = (d.history || []).filter((one) => one.s === s); return h.length ? h[h.length - 1] : null; };
    const seenKey = (id) => 'p2p.seen.' + id;
    function seenOf(id) {
      try { return Number(localStorage.getItem(seenKey(id))) || 0; } catch (_) { return 0; }
    }
    function markSeen(id, n) {
      try { localStorage.setItem(seenKey(id), String(n)); } catch (_) { }
    }
    const unreadOf = (d) => d.messages.slice(seenOf(d.id)).filter((m) => m.from !== 'me').length;
    const badge = (n) => (n ? `<span class="p2p-badge">${n > 9 ? '9+' : n}</span>` : '');
    function groupedValue(kind, value) {
      const digits = String(value || '').replace(/\D/g, '');
      if (kind === 'card' && digits.length >= 12) return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
      if (kind === 'sbp' && digits.length === 11 && /^[78]/.test(digits)) return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
      return String(value || '');
    }
    const tailOf = (value) => String(value || '').replace(/\D/g, '').slice(-4);
    const titleOf = (d) => (d.me === 'arbiter' ? t(d.status === 'disputed' || d.dispute ? 'disputeTitle' : 'dealIdTitle', { id: d.id.slice(0, 6) }) : t(d.me === 'seller' ? 'dealSellTitle' : 'dealBuyTitle', { sym: P.symText(d.symbol) }));

    const ckOf = (d) => (d && d.check && typeof d.check === 'object' ? d.check : null);
    const codesOf = (c) => (Array.isArray(c && c.reasons) ? c.reasons : []).map((r) => String(r && typeof r === 'object' ? r.c : r));
    const rejectedNow = (d) => { const c = ckOf(d); return !!c && d.status === 'paid' && c.verdict === 'rejected' && !c.override && !d.dispute; };
    const autoClosed = (d) => d.status === 'expired' && (d.endReason === 'receipt_rejected' || (d.history || []).some((h) => h.s === 'expired' && h.reason === 'receipt_rejected'));
    const autoEscalated = (d) => !!(d.dispute && d.dispute.reason === 'receipt_rejected');
    const minsLeft = (until) => Math.max(0, Math.ceil((Number(until) - Date.now()) / 60000));
    const clockEnd = (d) => { const c = ckOf(d); return c && c.verdict === 'rejected' && d.status === 'paid' && !c.override && !d.dispute && Number(c.until) ? Number(c.until) : d.deadline; };
    const triesLeft = (c) => Math.max(0, (Number(c.max) || 3) - (Number(c.rejects) || 0));
    const RR = {
      amount: 'rrAmount', recipient: 'rrRecipient', status: 'rrStatus', time: 'rrTime', duplicate: 'rrDuplicate', changed: 'rrForged', not_original: 'rcNotOriginal', unreadable: 'rcUnreadable',
      pdf_not_original: 'rcNotOriginal',
      amount_low: 'rrAmount', R7: 'rrAmount', tail_mismatch: 'rrRecipient', R8: 'rrRecipient', status_failed: 'rrStatus', R9: 'rrStatus', time_impossible: 'rrTime', R10: 'rrTime',
      dup_file: 'rrDuplicate', dup_sbp: 'rrDuplicate', dup_opno: 'rrDuplicate', R2: 'rrDuplicate', R3: 'rrDuplicate',
      pdf_edited: 'rrForged', pdf_overlay: 'rrForged', img_editor: 'rrForged', R4: 'rrForged', R5: 'rrForged', R6: 'rrForged',
      not_receipt: 'rcNotReceipt', R1: 'rcNotReceipt', bad_file: 'rcUnreadable', unreadable_file: 'rcUnreadable', R11: 'rcUnreadable'
    };
    const RR_CLS = { duplicate: 'rrDuplicate', forged: 'rrForged', not_a_receipt: 'rcNotReceipt', unreadable: 'rcUnreadable', not_original: 'rcNotOriginal', mismatch: 'rrMismatch' };
    const FLAG = {
      amount: 'fl_amount', recipient: 'fl_recipient', time: 'fl_time', dup: 'fl_dup', kind: 'fl_kind', chat: 'fl_chat', sbp: 'fl_sbp', file: 'fl_file',
      dup_unused_upload: 'fl_dup', dup_near: 'fl_dup', pdf_markup: 'fl_file', pdf_printed: 'fl_file',
      amount_short_small: 'fl_amount', amount_other: 'fl_amount', amount_unlabelled: 'fl_amount', overpaid: 'fl_amount', amount_low: 'fl_amount', R7: 'fl_amount',
      recipient_partial_mismatch: 'fl_recipient', method_kind_mismatch: 'fl_recipient', name_mismatch: 'fl_recipient', bank_mismatch: 'fl_recipient', tail_mismatch: 'fl_recipient', R8: 'fl_recipient',
      paid_before_details: 'fl_time', time_too_early: 'fl_time', time_impossible: 'fl_time', R10: 'fl_time', status_failed: 'fl_file',
      twin_payment: 'fl_dup', dup_after_closed_deal: 'fl_dup', dup_same_seller_live: 'fl_dup', dup_file: 'fl_dup', dup_sbp: 'fl_dup', dup_opno: 'fl_dup', R2: 'fl_dup', R3: 'fl_dup',
      dup_later_elsewhere: 'fl_dup', dup_seller_buyer: 'fl_dup', profile_mismatch: 'fl_file',
      kind_history: 'fl_kind', kind_other_bank_screen: 'fl_kind', paid_to_chat_details: 'fl_chat', sbp_format: 'fl_sbp', sbp_time_off: 'fl_sbp', sbp_outside_window: 'fl_sbp'
    };
    const isAmountCode = (code) => /^(amount_|overpaid|R7$)/.test(code);
    function buyerReasons(d, c) {
      const keys = [];
      codesOf(c).forEach((code) => { const k = RR[code]; if (k && !keys.includes(k)) keys.push(k); });
      if (!keys.length) keys.push(RR_CLS[c.cls] || 'rrMismatch');
      const m = d.method || {};
      const tail = tailOf(m.value);
      return keys.map((k) => {
        if (k === 'rrAmount') return c.amountRead ? t('rrAmount', { read: P.sumText(c.amountRead, d.fiat), sum: sumOf(d) }) : t('rrAmountN', { sum: sumOf(d) });
        if (k === 'rrRecipient') return t('rrRecipient', { mask: [m.bank, tail ? '•• ' + tail : ''].filter(Boolean).join(' ') || '—' });
        return t(k);
      });
    }
    function flagList(c) {
      const keys = [];
      codesOf(c).forEach((code) => {
        if (code === 'status_pending' || code === 'pending' || code === 'chat_details' || /^(gap_|recipient_unverified|recipient_partial|low_confidence|too_big|heic|tall_image|kopecks|time_zone|screenshot|photo|vtb_|pdf_encrypted)/.test(code)) return;
        const k = FLAG[code] || 'fl_file';
        if (!keys.includes(k)) keys.push(k);
      });
      return keys.map((k) => t(k));
    }
    function gapList(c) {
      const keys = [];
      codesOf(c).forEach((code) => {
        const k = /recipient/.test(code) ? 'gp_recipient' : /amount/.test(code) ? 'gp_amount' : /^(gap_file|low_confidence|too_big|heic|tall_image)/.test(code) ? 'gp_file' : '';
        if (k && !keys.includes(k)) keys.push(k);
      });
      return (keys.length ? keys : ['gp_file']).map((k) => t(k));
    }
    const HARD_CLS = {
      dup_file: 'duplicate', dup_sbp: 'duplicate', dup_opno: 'duplicate', duplicate: 'duplicate', pdf_edited: 'forged', pdf_overlay: 'forged', pdf_edited_other: 'forged', pdf_overlay_other: 'forged', img_editor: 'forged', changed: 'forged',
      not_receipt: 'not_a_receipt', bad_file: 'unreadable', unreadable_file: 'unreadable', unreadable: 'unreadable', not_original: 'not_original', pdf_not_original: 'not_original'
    };
    function reasonWord(code) {
      const c = String(code || '');
      if (!c) return '';
      if (HARD_CLS[c]) return t('cl_' + HARD_CLS[c]);
      if (/^(status_pending|status_failed|pending|status)$/.test(c)) return t('ar_status');
      if (/^(recipient_unverified|recipient_partial$|gap_recipient)/.test(c)) return t('gp_recipient');
      return t(FLAG[c] || 'fl_file');
    }
    P.reasonWord = reasonWord;
    function verdictTag(c, arbiter) {
      if (c.override) return P.tag(t('rc_accepted'), 'up');
      const v = c.verdict || 'pending';
      if (v === 'rejected') return P.tag(t(arbiter ? 'rc_rejectedArb' : 'rc_rejected'), 'down');
      if (v === 'flagged') return `<span class="tag p2p-tag-warn">${esc(t('rc_flagged'))}</span>`;
      if (v === 'partial') return `<span class="tag p2p-tag-line">${esc(t('rc_partial'))}</span>`;
      if (v === 'ok') return P.tag(t('rc_ok'), '');
      if (v === 'unchecked') return P.tag(t('rc_unchecked'), '');
      return P.tag(t('rc_pending'), 'accent');
    }
    function sellerBadge(c) {
      if (c.override) return [t('rs_accepted'), ''];
      const v = c.verdict || 'pending';
      if (v === 'rejected') return [t('rs_rejected', { why: t('cl_' + (c.cls || 'mismatch')) }), 'p2p-red'];
      if (v === 'flagged') return [t('rs_flagged'), 'p2p-orange'];
      return [t('rs_' + (['ok', 'partial', 'unchecked'].includes(v) ? v : 'pending')), ''];
    }

    const autoDispute = (d) => !!(d.dispute && d.dispute.by === 'system') || (d.status === 'disputed' && !!(d.history || []).some((h) => h.s === 'disputed' && h.by === 'system'));
    const clocked = (d) => !!d.deadline && (LIVE_CLOCK.includes(d.status) || d.status === 'paid');
    function heroKey(d) {
      const s = d.status, me = d.me;
      if (d.pending) return ['x_pending', ''];
      if (s === 'created') return d.maker ? ['x_created_maker', ''] : ['x_created_taker', ''];
      if (s === 'awaiting_lock') return me === 'seller' ? (lockSent(d) ? ['x_lock_sent', 'x_lock_sent_sub'] : ['x_lock_seller', '']) : ['x_lock_buyer', 'x_lock_buyer_sub'];
      if (s === 'locked') return me === 'buyer' ? ['x_locked_buyer', ''] : ['x_locked_seller', 'x_locked_seller_sub'];
      if (s === 'paid' && rejectedNow(d)) return me === 'seller' ? ['rx_seller', ''] : me === 'buyer' ? ['rc_rejected', ''] : ['arbWait', ''];
      if (s === 'paid') return me === 'seller' ? ['x_paid_seller', ''] : me === 'arbiter' ? ['acT', ''] : ['x_paid_buyer', ''];
      if (s === 'disputed' && autoEscalated(d)) return [me === 'arbiter' ? 'x_disputed_arbiter' : 'x_disputed', 'acEscalated'];
      if (s === 'disputed') return me === 'arbiter' ? ['x_disputed_arbiter', autoDispute(d) ? 'x_disputed_auto_sub' : 'x_disputed_arbiter_sub'] : ['x_disputed', autoDispute(d) ? 'x_disputed_auto_sub' : 'x_disputed_sub'];
      if (s === 'released') return me === 'seller' ? ['x_released_seller', ''] : ['x_released_buyer', ''];
      if (s === 'resolved_to_buyer') return ['x_resolved', 'x_toBuyer_sub'];
      if (s === 'resolved_to_seller') return ['x_resolved', 'x_toSeller_sub'];
      if (s === 'fined') return ['x_resolved', 'x_fined_sub'];
      if (s === 'expired') return [autoClosed(d) ? 'x_autoClosed' : 'x_expired', ''];
      return ['x_cancelled', ''];
    }
    function turnOf(d) {
      const s = d.status, me = d.me;
      const say = (key, mine) => ({ text: t(key), mine: !!mine });
      if (d.pending) return say('x_pending');
      if (s === 'created') return d.maker === true ? say('x_created_maker', true) : d.maker === false ? say('x_created_taker') : say('s_created');
      if (s === 'awaiting_lock') {
        if (me !== 'seller') return say('x_lock_buyer');
        if (lockSent(d)) return say('x_lock_sent');
        return d.depositSent === false ? say('x_lock_seller', true) : say('s_awaiting_lock');
      }
      if (s === 'locked') return me === 'buyer' ? say('turnPay', true) : say('x_locked_seller');
      if (s === 'paid' && rejectedNow(d)) return me === 'buyer' ? say('rc_rejected', true) : me === 'seller' ? say('rx_seller', true) : say('arbWait', true);
      if (s === 'paid') return me === 'seller' ? say('x_paid_seller', true) : say('x_paid_buyer');
      if (s === 'disputed') return me === 'arbiter' ? say('x_disputed_arbiter', true) : say('x_disputed');
      if (autoClosed(d)) return say('stAuto');
      return say('s_' + s);
    }

    function reasonLines(d) {
      const h = d.history || [];
      const lines = [];
      const wasLocked = !!hist(d, 'locked');
      if (autoClosed(d)) return [t(d.me === 'seller' ? 'acSeller' : 'acBuyer')];
      if (d.status === 'cancelled') {
        const c = hist(d, 'cancelled');
        let by = c ? c.by : 'system';
        if (by === 'maker' || by === 'taker') by = (by === 'maker') === !!d.maker ? d.me : otherRole(d);
        lines.push(t(by === 'buyer' ? 'c_buyer' : by === 'seller' ? 'c_seller' : 'c_system'));
      }
      if (d.status === 'expired') {
        const i = h.map((one) => one.s).lastIndexOf('expired');
        const before = h.slice(0, i < 0 ? h.length : i).filter((one) => ['created', 'awaiting_lock', 'locked', 'paid'].includes(one.s)).pop();
        const from = before ? before.s : 'created';
        lines.push(t(from === 'locked' ? 'ex_pay' : from === 'awaiting_lock' ? 'ex_lock' : 'ex_created'));
      }
      if (hist(d, 'deposit_returned')) lines.push(t('c_refunded'));
      else if (wasLocked) lines.push(t('c_refunding'));
      return lines;
    }

    function stepsHtml(d) {
      const s = d.status;
      const at = (one) => { const h = hist(d, one); return h ? h.at : null; };
      const lastAt = d.history && d.history.length ? d.history[d.history.length - 1].at : null;
      const lockedAt = at('locked'), paidAt = at('paid');
      const decided = FINISHED.test(s);
      const viaDispute = s === 'disputed' || !!hist(d, 'disputed') || /^resolved_|^fined$/.test(s);
      const over = s === 'cancelled' || s === 'expired';
      const nodes = [
        { label: t('st1'), done: !!lockedAt || FUNDED.includes(s) || decided, time: lockedAt },
        { label: t('st2'), done: !!paidAt || ['paid', 'disputed'].includes(s) || decided, time: paidAt },
        { label: t('st3'), done: decided, time: null },
        { label: t('st4'), done: s === 'released' || s === 'resolved_to_buyer', time: decided ? (s === 'released' ? at('released') : lastAt) : null }
      ];
      let cur = -1;
      if (!over && !decided) cur = s === 'locked' ? 1 : s === 'paid' ? 2 : s === 'disputed' ? 3 : 0;
      if (viaDispute && !over) {
        nodes[3].label = t(decided ? 'stDecided' : 'stDispute');
        nodes[3].done = decided;
        nodes[3].red = !decided || s === 'fined' || (s === 'resolved_to_seller' && d.me === 'buyer');
        nodes[3].time = decided ? lastAt : at('disputed');
      }
      if (over) {
        const last = nodes.map((n) => n.done).lastIndexOf(true);
        nodes.forEach((n, i) => { if (i > last) n.off = true; });
        const x = nodes[3];
        x.label = t(s === 'expired' ? (autoClosed(d) ? 'stAuto' : 's_expired') : 's_cancelled');
        x.x = true;
        x.off = false;
        x.time = lastAt;
      }
      return `<ol class="p2p-steps">${nodes.map((n, i) => {
        const cls = n.x ? 'is-x' : n.done ? (n.red ? 'is-done is-red' : 'is-done') : i === cur ? (n.red ? 'is-cur is-red' : 'is-cur') : n.red ? 'is-cur is-red' : n.off ? 'is-off' : '';
        const dot = n.x ? icon('close-circle', { size: 22 }) : n.done ? icon('check', { size: 14 }) : '';
        return `<li class="p2p-step-n ${cls}"><span class="p2p-step-dot">${dot}</span><span class="p2p-step-label">${esc(n.label)}</span><span class="p2p-step-time">${n.time && (n.done || n.x) ? esc(CK.i18n.clock(n.time)) : ''}</span></li>`;
      }).join('')}</ol>`;
    }

    function reasonsOf(d) {
      if (d.pending || d.me === 'arbiter') return [];
      if (d.status === 'locked' && d.me === 'buyer') return [['r_notPaying', 'cancel'], ['r_noAnswer', 'info:r_noAnswerInfo:chat'], ['r_other', 'dispute']];
      if (d.status === 'paid' && d.me === 'buyer' && rejectedNow(d)) return [];
      if (d.status === 'paid' && d.me === 'buyer') return [['r_paidNoCoins', 'dispute'], ['r_askMore', 'dispute'], ['r_other', 'dispute']];
      if (d.status === 'locked' && d.me === 'seller') return [['r_buyerNotPaying', 'info:r_buyerNotPayingInfo'], ['r_wrongMoney', 'dispute'], ['r_other', 'dispute']];
      if (d.status === 'paid' && d.me === 'seller') return [['r_noMoney', 'dispute'], ['r_otherSum', 'dispute'], ['r_other', 'dispute']];
      return [];
    }

    function dealScreen(id, onClosed) {
      let titleNow = t('title');
      let ctrl = null;
      P.pushScreen({
        title: () => titleNow,
        build(body, api) { ctrl = buildDeal(id, body, api, (text) => { titleNow = text; api.setTitle(text); }); },
        onClose() { if (ctrl) ctrl.stop(); if (onClosed) onClosed(); }
      });
    }

    function buildDeal(id, body, api, setTitle) {
      const st = { deal: null, raw: '', busy: false, check: null, form: null, failed: '', receipt: null, receiptUrl: '', note: '', ask: null, sheet: null, held: false };
      const listeners = new Set();
      body.innerHTML = `<div class="p2p-page p2p-deal">${P.demoNote()}<div class="p2p-dealbox"><div class="p2p-dskel" aria-hidden="true"><span class="p2p-sk-hero"><span class="skel p2p-sk-h1"></span><span class="skel p2p-sk-h2"></span></span><span class="p2p-sk-dots"><span class="skel"></span><span class="skel"></span><span class="skel"></span><span class="skel"></span></span><span class="skel p2p-sk-card"></span></div></div></div>`;
      const box = $('.p2p-dealbox', body);
      const bar = api.bar();
      const cache = new Map();
      let markShown = false;
      const drawn = new Map();
      const kids = (n) => Array.from(n.children);
      const hasText = (n) => Array.from(n.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim());
      const sameShell = (a, b) => a.tagName === b.tagName && a.attributes.length === b.attributes.length
        && Array.from(a.attributes).every((at) => b.getAttribute(at.name) === at.value);
      function patch(live, was, now) {
        const liveKids = kids(live), wasKids = kids(was), nowKids = kids(now);
        if (liveKids.length !== wasKids.length || liveKids.some((n, i) => n.tagName !== wasKids[i].tagName)) return false;
        const out = [];
        const fresh = [];
        let at = 0;
        for (const n of nowKids) {
          let same = -1;
          for (let j = at; j < wasKids.length; j += 1) if (wasKids[j].isEqualNode(n)) { same = j; break; }
          if (same >= 0) {
            for (let j = at; j < same; j += 1) liveKids[j].remove();
            out.push(liveKids[same]);
            at = same + 1;
          } else if (at < wasKids.length && sameShell(wasKids[at], n) && !hasText(wasKids[at]) && !hasText(n) && wasKids[at].children.length && n.children.length
            && patch(liveKids[at], wasKids[at], n)) {
            out.push(liveKids[at]);
            at += 1;
          } else {
            const copy = n.cloneNode(true);
            out.push(copy);
            fresh.push(copy);
          }
        }
        for (let j = at; j < liveKids.length; j += 1) liveKids[j].remove();
        let ref = live.firstElementChild;
        out.forEach((n) => { if (n === ref) ref = ref.nextElementSibling; else live.insertBefore(n, ref); });
        fresh.forEach((n) => fadeSwap(n));
        return true;
      }
      function part(name, html) {
        let el = box.querySelector(`[data-part="${name}"]`);
        if (!el) {
          el = document.createElement('div');
          el.dataset.part = name;
          box.appendChild(el);
        }
        if (cache.get(name) === html) return el;
        const had = !!cache.get(name);
        cache.set(name, html);
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const before = drawn.get(name);
        drawn.set(name, tpl.content);
        el.hidden = !html;
        if (name === 'top' || !had || !html || !before || !patch(el, before, tpl.content)) {
          el.innerHTML = html;
          if (had && html) fadeSwap(el);
        }
        P.rollIn(el);
        if (name === 'top') {
          const mark = html.includes('p2p-receipt-mark');
          if (mark && !markShown) popIn($('.p2p-receipt-mark', el));
          markShown = mark;
        }
        return el;
      }
      const ORDER = ['top', 'check', 'amount', 'pay', 'chat', 'rate', 'facts', 'problem'];
      const stepsId = 'p2p-steps-' + id;
      const moreId = 'p2p-more-' + id;

      function heroHtml(d) {
        const [k, sub] = heroKey(d);
        const params = { sum: sumOf(d), coins: shortOf(d) };
        const live = clocked(d) && !d.pending;
        const label = d.status === 'created' ? 'tLeftConfirm' : d.status === 'awaiting_lock' ? 'tLeftLock' : rejectedNow(d) ? 'tLeftReceipt' : d.status === 'paid' ? 'tLeftCheck' : 'tLeftPay';
        const lines = d.status === 'cancelled' || d.status === 'expired' ? reasonLines(d) : sub ? [t(sub, params)] : [];
        const toggle = `data-p2p-fold aria-expanded="false" aria-controls="${stepsId}"`;
        const copySum = k === 'x_locked_buyer';
        const title = copySum
          ? esc(t(k, { sum: '\u0000' })).replace('\u0000', `<button class="p2p-sumcopy press" type="button" data-copy="${esc(plainSum(d))}" aria-label="${esc(t('copied'))}">${esc(sumOf(d))}<span class="p2p-copyicon">${icon('copy', { size: 18 })}</span></button>`)
          : `<button class="p2p-hero-tap press" type="button" ${toggle}>${esc(t(k, params))}${live ? '' : icon('chevron-down', { size: 18, className: 'p2p-hero-chev' })}</button>`;
        return `<section class="p2p-hero">
          <div class="p2p-hero-row"><h2 class="p2p-hero-title">${title}</h2>${live ? `<button class="p2p-clock press" type="button" data-clock ${toggle} aria-label="${esc(t(label))}">${icon('clock', { size: 16 })}<b></b></button>` : ''}</div>
          ${lines.map((line) => `<p class="p2p-hero-sub">${esc(line)}</p>`).join('')}${rxHtml(d)}
          <div class="fold-body p2p-stepsfold" id="${stepsId}" hidden>${stepsHtml(d)}</div>
        </section>`;
      }
      function receiptHtml(d) {
        const [k, sub] = heroKey(d);
        const params = { sum: sumOf(d), coins: shortOf(d) };
        const good = d.status === 'released';
        const toBuyer = d.me === 'buyer' && (good || d.status === 'resolved_to_buyer');
        const big = toBuyer ? `+${shortOf(d)}` : sumOf(d);
        const under = good ? (d.me === 'buyer' ? `−${sumOf(d)}` : `−${shortOf(d)}`) : '';
        return `<section class="p2p-receipt">
          <span class="p2p-receipt-mark${good ? '' : ' is-info'}">${icon(good ? 'check-circle' : 'info', { size: 48 })}</span>
          <h2 class="p2p-hero-title">${esc(t(k, params))}</h2>
          ${P.rolledText(big, 'p2p-receipt-sum')}
          ${under ? `<p class="p2p-receipt-under">${esc(under)}</p>` : ''}
          ${sub ? `<p class="p2p-hero-sub">${esc(t(sub, params))}</p>` : ''}
        </section>`;
      }
      function amountHtml(d) {
        return `<section class="p2p-amount">${P.rolledText(sumOf(d), 'p2p-amount-v')}<span class="p2p-amount-sub">${esc(byPriceText(d))}</span></section>`;
      }
      function plainSum(d) {
        const [whole, frac = ''] = String(d.fiatAmount).split('.');
        return /[1-9]/.test(frac) ? `${whole}${CK.i18n.lang === 'en' ? '.' : ','}${frac.padEnd(2, '0').slice(0, 2)}` : whole;
      }
      const byPriceText = (d) => t('byPrice', { coins: shortOf(d), price: P.priceText(d.price, d.fiat) });
      const receiptOf = (d) => { const m = d.messages.filter((one) => one.receipt && one.file); return m.length ? m[m.length - 1] : null; };
      const showsPay = (d) => !!((d.method || {}).value && ((d.me === 'buyer' && FUNDED.includes(d.status)) || (d.me === 'arbiter' && d.status === 'disputed')));
      const safeId = 'p2p-safe-' + id;
      const sellerCard = (d) => d.me === 'seller' && FUNDED.includes(d.status);
      function payHtml(d) {
        const m = d.method || {};
        const bankRow = (lead) => `<div class="cell p2p-logorow">${lead}<span class="cell-main"><span class="cell-title p2p-line">${esc(m.bank || '—')}</span><span class="cell-sub">${esc(P.kindName(m.kind))}${m.tail || tailOf(m.value) ? ` •• ${esc(m.tail || tailOf(m.value))}` : ''}</span></span></div>`;
        if (showsPay(d) && d.me === 'arbiter') {
          return `<section class="p2p-sec"><div class="group p2p-flat">
            ${P.fact(t('vSum'), esc(sumOf(d)))}
            ${P.fact(t('bank'), P.methodLogo(m, 20) + `<span class="p2p-line">${esc([m.bank, P.kindName(m.kind)].filter(Boolean).join(' · '))}</span>`)}
            ${P.fact(t(m.kind === 'sbp' ? 'v_sbp' : 'v_card'), esc(groupedValue(m.kind, m.value)))}
            ${m.holder ? P.fact(t('holder'), esc(m.holder)) : ''}
          </div></section>`;
        }
        if (showsPay(d)) {
          const safeQ = P.help('safe2', null, safeId);
          const warnChat = !!((ckOf(d) && ckOf(d).chatDetails) || d.chatDetails);
          return `<section class="p2p-sec"><div class="group p2p-flat">
            <div class="cell p2p-logorow">${P.methodLogo(m, 32) || P.mark('bank', 'gray', 32)}<span class="cell-main"><span class="cell-title p2p-line">${esc(m.bank || '—')}</span><span class="cell-sub">${esc(P.kindName(m.kind))}</span></span></div>
            ${P.copyRow(t(m.kind === 'sbp' ? 'v_sbp' : 'v_card'), groupedValue(m.kind, m.value), String(m.value))}
            ${m.holder ? P.copyRow(t('holder'), m.holder, m.holder) : ''}
          </div>${warnChat || d.status === 'locked' ? `<p class="p2p-note p2p-safe1${warnChat ? ' p2p-note--warn' : ''}">${icon('shield', { size: 16 })}<span>${esc(t('safe1'))}</span>${safeQ[0]}</p>${safeQ[1]}` : ''}</section>`;
        }
        if (sellerCard(d)) {
          const r = receiptOf(d);
          if (r && r.fileType === 'application/pdf') P.warmLink(d.id, r.file, false).catch(() => {});
          const c = ckOf(d);
          const [badge, tone] = c && r ? (rejectedNow(d) ? [capFirst(t('cl_' + (c.cls || 'mismatch'))), 'p2p-red'] : sellerBadge(c)) : ['', ''];
          const receiptRow = r ? `<button class="cell press-row" type="button" data-receipt="${esc(r.file)}">${P.mark('doc', 'blue', 32)}<span class="cell-main"><span class="cell-title">${esc(t('receiptBuyer'))}</span><span class="cell-sub">${esc(`${CK.i18n.dayShort(r.at)}, ${CK.i18n.clock(r.at)}`)}</span>${badge ? `<span class="cell-sub p2p-rc-badge ${tone}">${esc(badge)}</span>` : ''}</span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>` : '';
          return `<section class="p2p-sec"><div class="group p2p-flat"><div class="cell p2p-sumcell"><span class="cell-main">${P.rolledText(sumOf(d), 'p2p-amount-v')}<span class="cell-sub">${esc(byPriceText(d))}</span></span></div>${bankRow(P.methodLogo(m, 32) || P.mark('bank', 'gray', 32))}${receiptRow}</div>
            <p class="p2p-note p2p-note--warn">${icon('info', { size: 16 })}<span>${esc(t(c && r ? 'rcSellerNote' : 'bankCheckNote'))}</span></p></section>`;
        }
        return '';
      }
      const untilText = (c) => {
        const at = Number(c && c.until);
        if (!at) return '';
        const clock = CK.i18n.clock(at);
        return new Date(at).getTimezoneOffset() === -180 ? clock : t('yourTime', { time: clock });
      };
      const noProof = () => `<p class="p2p-note p2p-rc-proof">${icon('info', { size: 16 })}<span>${esc(t('rcNoProof'))}</span></p>`;
      function rxHtml(d) {
        if (!rejectedNow(d) || (d.me !== 'buyer' && d.me !== 'seller')) return '';
        const c = ckOf(d);
        const time = untilText(c);
        if (d.me === 'seller') {
          const end = c.onExpiry === 'close' ? t('rxSellerClose', { time }) : c.sellerSaid ? t('rxSellerDispute', { time }) : t('rxSellerAsk', { time });
          const line = c.sellerSaid ? t('noMoneySaid', { time: CK.i18n.clock(c.sellerSaid.at) }) : t('rxSellerAskShort');
          return `<p class="p2p-hero-sub p2p-rx-line">${esc(line)}${time ? P.why(`${t('rxSellerBody', { time })} ${end}`) : ''}</p>`;
        }
        const left = triesLeft(c);
        const parts = Array.isArray(c.parts) ? c.parts.length : 0;
        const tries = (left ? t('rrTries', { n: left }) : t('rrNoTries')) + (parts ? ` · ${t('rrParts', { n: parts + 1 })}` : '');
        const until = time ? t(c.onExpiry === 'close' ? 'rrUntilClose' : 'rrUntilDispute', { time }) : '';
        return buyerReasons(d, c).map((line, i) => `<p class="p2p-hero-sub p2p-rx-why"${i ? '' : ' data-rcseen'}>${esc(line)}</p>`).join('')
          + `<p class="p2p-hero-sub p2p-rx-line">${esc(tries)}${until ? P.why(until) : ''}</p>`;
      }
      function checkHtml(d) {
        const c = ckOf(d);
        if (d.me === 'arbiter') return c ? arbiterCard(d, c) : '';
        if (d.me === 'buyer' && autoClosed(d)) return appealBox(d, c);
        if (!c || d.status !== 'paid') return '';
        if (d.me !== 'buyer' || rejectedNow(d)) return '';
        let line = '';
        const codes = codesOf(c);
        if (c.override) line = t('rfAccepted');
        else if (c.verdict === 'flagged') {
          const pending = codes.includes('pending') || codes.includes('status_pending');
          line = pending && flagList(c).length === 0 ? t('rfPending') : t('rfFlagged', { list: flagList(c).join(', ') || t('fl_file') }) + (pending ? ' ' + t('rfPending') : '');
        }
        else if (c.verdict === 'partial') line = t('rfPartial', { what: gapList(c).join(', ') });
        else if (c.verdict === 'ok') line = t('rfOk');
        else if (c.verdict === 'unchecked') line = t('rfUnchecked');
        return `<section class="p2p-rc-soft">${line ? `<p class="p2p-note">${esc(line)}</p>${noProof()}` : verdictTag(c)}</section>`;
      }
      function appealBox(d, c) {
        const k = c || {};
        const contact = k.support || (P.cfg && P.cfg.support) || '@devpool';
        const until = Number(k.appealUntil) || 0;
        let line = '';
        if (!c) line = '';
        else if (k.appeal) {
          const o = k.appeal.outcome;
          line = o === 'buyer_right' ? t('appealBuyerRight') : o === 'seller_right' ? t('appealSellerRight') : t('appealSent');
          if (o && k.appeal.note) line += ' ' + k.appeal.note;
        } else if (until > Date.now()) {
          line = t('acBuyerAppeal', { time: `${CK.i18n.dayShort(until)}, ${CK.i18n.clock(until)}` });
        } else line = t('appealOver');
        const link = /^@[A-Za-z0-9_]{3,32}$/.test(contact) ? `<a class="section-link" href="https://t.me/${esc(contact.slice(1))}" target="_blank" rel="noopener">${esc(contact)}</a>` : esc(contact);
        return `<section class="card p2p-card p2p-rc">${line ? `<p class="p2p-rc-line">${esc(line)}</p>` : ''}<p class="p2p-note">${esc(t('contactArb', { who: '\u0000' })).replace('\u0000', link)}</p></section>`;
      }
      const canAppeal = (d) => { const c = ckOf(d) || {}; return d.me === 'buyer' && autoClosed(d) && !c.appeal && Number(c.appealUntil) > Date.now(); };

      const CONF = { high: 'cf_high', medium: 'cf_medium', low: 'cf_low' };
      const RES = { ok: ['is-ok', '✓'], bad: ['is-bad', '✗'], flag: ['is-flag', '?'], none: ['', '—'] };
      function arbiterCard(d, c) {
        const meta = [];
        if (c.verdict === 'rejected' && !c.override && d.status === 'paid' && c.until) meta.push(t(c.onExpiry === 'close' ? 'acEndClose' : 'acEndDispute', { time: untilText(c) }));
        if (Number(c.rejects) > 0) meta.push(t('acTry', { n: Number(c.rejects), max: Number(c.max) || 3 }));
        if (Array.isArray(c.parts) && c.parts.length) meta.push(t('rrParts', { n: c.parts.length + 1 }));
        if (c.at) meta.push(`${CK.i18n.dayShort(c.at)}, ${CK.i18n.clock(c.at)}`);
        const shadow = c.mode === 'shadow' && c.would === 'rejected' ? `<span class="tag p2p-tag-line">${esc(t('acShadow'))}</span>` : '';
        const rows = (Array.isArray(c.rows) ? c.rows : []).map((r) => {
          const [cls, mark] = RES[r.res] || RES.none;
          const conf = CONF[r.conf] ? `<small>${esc(t(CONF[r.conf]))}</small>` : '';
          return `<div class="p2p-rc-row ${cls}"><span class="p2p-rc-k">${esc(t('ar_' + r.k) || r.k)}</span><span class="p2p-rc-v"><span>${esc(r.got || '—')}</span><span class="p2p-rc-want">${esc(r.want || '—')}</span></span><span class="p2p-rc-mark"><b>${mark}</b>${conf}</span></div>`;
        }).join('');
        const file = c.fileInfo && typeof c.fileInfo === 'object' ? c.fileInfo : c.file && typeof c.file === 'object' ? c.file : {};
        const fileRows = ['producer', 'revisions', 'overlays', 'editor', 'kind', 'render', 'profile', 'size'].filter((k) => file[k] !== undefined && file[k] !== null && file[k] !== '').map((k) => {
          let v = file[k];
          if (k === 'kind' && P.S['fk_' + v]) v = t('fk_' + v);
          if (k === 'size' && typeof v === 'number') v = P.sizeText(v);
          if (Array.isArray(v)) v = v.length ? v.join(', ') : t('acNone');
          return P.fact(t('af_' + k), `<span class="p2p-rc-wrap">${esc(String(v))}</span>`);
        });
        fileRows.push(P.fact(t('acReader'), `<span class="p2p-rc-wrap">${esc(c.engine && c.engine !== 'none' ? [c.engine, c.model, c.ms ? `${(c.ms / 1000).toFixed(1)} s` : ''].filter(Boolean).join(' · ') : t('acReaderNone'))}</span>`));
        const dealLines = [];
        if (Number(c.chatDetails) > 0) dealLines.push(t('acChat', { n: Number(c.chatDetails) }));
        if (c.sellerSaid) dealLines.push(t('acSaid', { time: CK.i18n.clock(c.sellerSaid.at) }));
        if (c.forced) dealLines.push(t('acForced'));
        const dups = (Array.isArray(c.dups) ? c.dups : []).map((x) => `<button class="cell press-row" type="button" data-odeal="${esc(x.deal)}"><span class="cell-main"><span class="cell-title">${esc(t('acDup', { id: String(x.deal).slice(0, 6) }))}</span><span class="cell-sub">${esc([x.what, x.status ? t('s_' + x.status) : ''].filter(Boolean).join(' · '))}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`).join('');
        let seq = 1;
        const tries = (Array.isArray(c.history) ? c.history : []).map((x) => {
          seq = x.part ? seq + 1 : 1;
          return `<button class="cell press-row" type="button" data-receipt="${esc(x.file)}"><span class="cell-main"><span class="cell-title">${esc(`${CK.i18n.clock(x.at)}${x.part ? ' · ' + t('rrPartT', { n: seq }) : ''}`)}</span></span>${verdictTag(x, true)}${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`;
        }).join('');
        const now = receiptOf(d);
        const openRow = now ? `<div class="group p2p-flat"><button class="cell press-row" type="button" data-receipt="${esc(now.file)}">${P.mark('doc', 'blue', 32)}<span class="cell-main"><span class="cell-title">${esc(t('openReceipt'))}</span><span class="cell-sub">${esc(`${CK.i18n.dayShort(now.at)}, ${CK.i18n.clock(now.at)}`)}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>` : '';
        const appeal = c.appeal ? `<div class="p2p-rc-appeal"><b>${esc(t('acAppealT'))}</b>${c.appeal.text ? `<p>${esc(c.appeal.text)}</p>` : ''}${c.appeal.file ? `<button class="section-link press" type="button" data-receipt="${esc(c.appeal.file)}">${esc(t('openFile'))}</button>` : ''}${c.appeal.outcome ? `<p class="p2p-note">${esc(t(c.appeal.outcome === 'buyer_right' ? 'acBuyerRight' : 'acSellerRight'))}${c.appeal.note ? ': ' + esc(c.appeal.note) : ''}</p>` : ''}</div>` : '';
        const askLabel = c.canLabel !== undefined ? !!c.canLabel : (c.mode === 'shadow' && c.would === 'rejected') || autoClosed(d) || autoEscalated(d);
        const wrongBtn = `<button class="btn btn--small btn--tinted press" type="button" data-act="rcLabel" data-label="wrong">${esc(t('acWrong'))}</button>`;
        const label = c.label ? `<p class="p2p-note">${esc(t('acLabelled', { what: t(c.label === 'right' ? 'acRight' : 'acWrong') }))}</p>${c.label === 'right' && askLabel ? `<div class="p2p-rc-labels">${wrongBtn}</div>` : ''}`
          : askLabel ? `<div class="p2p-rc-labels"><button class="btn btn--small btn--tinted press" type="button" data-act="rcLabel" data-label="right">${esc(t('acRight'))}</button>${wrongBtn}</div>` : '';
        const stuck = d.stuck === 'refund_refused' || c.stuck === 'refund_refused' ? `<p class="p2p-note p2p-note--warn">${icon('warning', { size: 16 })}<span>${esc(t('acStuck'))}</span></p>` : '';
        return `<section class="p2p-sec"><h3 class="p2p-h">${esc(t('acT'))}</h3><div class="card p2p-card p2p-rcard">
          <div class="p2p-rc-head">${verdictTag(c, true)}${shadow}${c.cls && c.verdict === 'rejected' ? `<span class="p2p-rc-cls">${esc(capFirst(t('cl_' + c.cls)))}</span>` : ''}</div>
          ${stuck}
          ${meta.length ? `<p class="p2p-rc-meta">${meta.map((x) => `<span class="p2p-nowrap">${esc(x)}</span>`).join(' · ')}</p>` : ''}
          ${openRow}
          ${rows ? `<div class="p2p-rc-table"><div class="p2p-rc-row p2p-rc-cap"><span class="p2p-rc-k"></span><span class="p2p-rc-v"><span>${esc(t('acGot'))}</span><span class="p2p-rc-want">${esc(t('acWant'))}</span></span><span class="p2p-rc-mark"></span></div>${rows}</div>` : ''}
          ${c.opinion ? `<p class="p2p-note p2p-note--warn">${icon('info', { size: 16 })}<span>${esc(t('acOpinion'))}: ${esc(c.opinion)}</span></p>` : ''}
          ${appeal}${label}</div>
          <h3 class="p2p-h">${esc(t('acFile'))}</h3><div class="group p2p-flat p2p-facts">${fileRows.join('')}</div>
          ${dealLines.length ? `<h3 class="p2p-h">${esc(t('acDeal'))}</h3><div class="group p2p-flat">${dealLines.map((x) => `<div class="cell"><span class="cell-title p2p-rc-dl">${esc(x)}</span></div>`).join('')}</div>` : ''}
          ${dups ? `<div class="group p2p-flat">${dups}</div>` : ''}
          ${tries ? `<h3 class="p2p-h">${esc(t('acTries'))}</h3><div class="group p2p-flat">${tries}</div>` : ''}</section>`;
      }
      function lastPreview(d) {
        const m = d.messages[d.messages.length - 1];
        if (!m) return t('noMsgs');
        const what = m.receipt ? t('receiptTag') : m.text ? m.text : fileLabel(m.fileType);
        return m.from === 'me' ? `${t('me')}: ${what}` : what;
      }
      function chatHtml(d) {
        if (!d.canChat && !d.messages.length) return '';
        const title = d.me === 'arbiter' ? 'chatDeal' : d.me === 'seller' ? 'chatWithBuyer' : 'chatWithSeller';
        return `<div class="group p2p-flat"><button class="cell press-row p2p-chatrow" type="button" data-chat>${P.mark('chat', 'blue', 32)}<span class="cell-main"><span class="cell-title">${esc(t(title))}</span><span class="cell-sub p2p-line">${esc(lastPreview(d))}</span></span>${badge(unreadOf(d))}${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>`;
      }
      function rateHtml(d) {
        if (d.me === 'arbiter' || !FINISHED.test(d.status)) return '';
        const n = Number(d.rated) || 0;
        return `<section class="p2p-rate"><b class="p2p-rate-q">${esc(t(n ? 'rated' : 'rateQ'))}</b>
          <div class="p2p-stars" role="${n ? 'img' : 'radiogroup'}" aria-label="${esc(n ? `${n} / 5` : t('rateNeed'))}">${[1, 2, 3, 4, 5].map((i) => (n
            ? `<span class="p2p-star${i <= n ? ' is-on' : ''}">${icon('star', { size: 30, fill: true })}</span>`
            : `<button class="p2p-star press" type="button" data-act="star" data-n="${i}" aria-label="${i}">${icon('star', { size: 30, fill: true })}</button>`)).join('')}</div></section>`;
      }
      const foldBtn = (attr, label, valueHtml) => `<button class="fold-row p2p-foldbtn press" type="button" ${attr}><span>${esc(label)}</span><span>${valueHtml}</span></button>`;
      const personBtn = (p, role) => foldBtn(`data-person="${role}"`, t(role), `${P.ava(p, 20)}<span class="p2p-line">${esc(p ? p.name : '—')}</span>${icon('chevron-right', { size: 14, className: 'p2p-foldchev' })}`);
      function factsHtml(d) {
        const m = d.method || {};
        const done = FINISHED.test(d.status);
        const rows = [P.foldRow(t('coins'), esc(coinsOf(d))), P.foldRow(t('price'), esc(`${P.priceText(d.price, d.fiat)} ${t('per1', { sym: P.symText(d.symbol) })}`))];
        if (done) rows.push(P.foldRow(t('bank'), esc([m.bank, P.kindName(m.kind)].filter(Boolean).join(' · '))));
        if (d.me === 'seller' && BigInt(d.fee) > 0n) rows.push(P.foldRow(t('fee'), esc(coinsOf(d, d.fee))));
        if (d.me === 'arbiter') rows.push(personBtn(d.seller, 'seller'), personBtn(d.buyer, 'buyer'));
        else rows.push(personBtn(otherOf(d), otherRole(d)));
        if (d.terms) rows.push(`<div class="p2p-foldterms"><span class="p2p-dim">${esc(t('terms'))}</span><p class="p2p-terms">${esc(d.terms)}</p></div>`);
        rows.push(foldBtn(`data-copy="${esc(d.id)}"`, t('dealNo'), `<span>#${esc(d.id.slice(0, 6))}</span><span class="p2p-copyicon">${icon('copy', { size: 16 })}</span>`));
        rows.push(P.foldRow(t('opened'), esc(`${CK.i18n.dayShort(d.at)}, ${CK.i18n.clock(d.at)}`)));
        if (done || d.status === 'cancelled' || d.status === 'expired') {
          const last = d.history.length ? d.history[d.history.length - 1].at : null;
          if (last) rows.push(P.foldRow(t('closedAt'), esc(`${CK.i18n.dayShort(last)}, ${CK.i18n.clock(last)}`)));
        }
        return `<div class="p2p-morewrap">${P.fold(esc(t('common.more')), rows.join(''), { id: moreId })}</div>`;
      }
      function problemHtml(d) {
        if (!reasonsOf(d).length) return '';
        return `<button class="p2p-redlink press" type="button" data-act="problem">${esc(t('problem'))}</button>`;
      }
      function barOf(d) {
        const s = d.status, me = d.me;
        if (d.pending) return [t('h_pending'), ''];
        if (s === 'created' && d.maker) return ['', btn('confirm', t('confirmOrder'), 'btn--wide') + btn('cancelAsk', t('decline'), 'btn--tinted btn--wide')];
        if (s === 'created' && me !== 'arbiter') return ['', btn('cancelAsk', t('cancelOrder'), 'btn--tinted btn--wide')];
        if (s === 'awaiting_lock' && me === 'seller') {
          if (lockSent(d)) return [t('cannotCancel'), ''];
          return ['', btn('deposit', t('send', { amount: coinsOf(d, d.total) }), 'btn--sell btn--wide') + btn('cancelAsk', t('cancel'), 'btn--tinted btn--wide')];
        }
        if (s === 'awaiting_lock' && me === 'buyer') return d.depositSent ? [t('cannotCancel'), ''] : ['', btn('cancelAsk', t('cancel'), 'btn--tinted btn--wide')];
        if (s === 'locked' && me === 'buyer') return ['', btn('paid', t('paid'), 'btn--buy btn--wide')];
        if (s === 'locked' && me === 'seller') return ['', btn('release', t('moneyCame'), 'btn--tinted btn--wide')];
        const c = ckOf(d);
        if (s === 'paid' && me === 'seller') {
          const say = c && !c.sellerSaid && !c.override && (rejectedNow(d) || c.verdict === 'flagged') ? btn('noMoney', t('noMoney'), 'btn--tinted btn--wide') : '';
          return ['', btn('release', t('release'), 'btn--buy btn--wide') + say];
        }
        if (s === 'paid' && me === 'buyer' && rejectedNow(d)) {
          const can = triesLeft(c) > 0 && Number(c.until) > Date.now();
          const parts = Array.isArray(c.parts) ? c.parts.length : 0;
          const part = can && parts + 1 < (Number(c.maxParts) || 3) && codesOf(c).some(isAmountCode) ? btn('part', t(parts ? 'rrPart3' : 'rrPart2'), 'btn--tinted btn--wide') : '';
          return can ? ['', btn('reup', t('rrUpload'), 'btn--wide') + part + btn('disputeNow', t('rrDisagree'), 'btn--tinted btn--wide')] : ['', btn('disputeNow', t('dispute'), 'btn--sell btn--wide')];
        }
        if (s === 'paid' && me === 'buyer' && c && c.verdict === 'flagged' && !c.override && codesOf(c).some((x) => x === 'pending' || x === 'status_pending') && triesLeft(c) > 0) {
          const parts = Array.isArray(c.parts) ? c.parts.length : 0;
          const part = codesOf(c).some(isAmountCode) && parts + 1 < (Number(c.maxParts) || 3) ? btn('part', t(parts ? 'rrPart3' : 'rrPart2'), 'btn--tinted btn--wide') : '';
          return [t('h_waitSeller'), btn('reup', t('rrUpload'), 'btn--tinted btn--wide') + part];
        }
        if (s === 'paid' && me === 'buyer' && c && c.verdict === 'flagged' && !c.override && codesOf(c).some(isAmountCode)) {
          const parts = Array.isArray(c.parts) ? c.parts.length : 0;
          if (parts + 1 < (Number(c.maxParts) || 3)) return [t('h_waitSeller'), btn('part', t(parts ? 'rrPart3' : 'rrPart2'), 'btn--tinted btn--wide')];
        }
        if (s === 'paid' && me === 'buyer') return [t('h_waitSeller'), ''];
        if (s === 'paid' && me === 'arbiter' && c && !c.override && !d.dispute) {
          if (rejectedNow(d)) return ['', btn('rcAccept', t('acAccept'), 'btn--wide') + btn('rcDispute', t('dispute'), 'btn--tinted btn--wide')];
          if (c.verdict === 'flagged') return ['', btn('rcDispute', t('dispute'), 'btn--tinted btn--wide')];
        }
        if (s === 'expired' && me === 'arbiter' && c && c.appeal && !c.appeal.outcome) return ['', btn('rcAppeal', t('acAppealGo'), 'btn--wide')];
        if (s === 'expired' && canAppeal(d)) return ['', btn('appeal', t('appealGo'), 'btn--wide')];
        if (s === 'disputed' && me === 'seller') return [t('h_waitArbiter'), btn('release', t('release'), 'btn--tinted btn--wide')];
        if (s === 'disputed' && me === 'buyer') return [t('h_waitArbiter'), ''];
        if (s === 'disputed' && me === 'arbiter') return ['', btn('resolve', t('resolveGo'), 'btn--wide')];
        if (s === 'released' && me === 'buyer') return ['', btn('wallet', t('openWallet'), 'btn--tinted btn--wide')];
        return ['', ''];
      }

      let doneDots = -1;
      function paint() {
        const d = st.deal;
        if (!d) return;
        const skel = $('.p2p-dskel', box);
        if (skel) skel.remove();
        const doneBefore = doneDots;
        setTitle(titleOf(d));
        const done = FINISHED.test(d.status);
        const html = {
          top: done ? receiptHtml(d) : heroHtml(d),
          check: checkHtml(d),
          amount: done || showsPay(d) || sellerCard(d) ? '' : amountHtml(d),
          pay: done ? '' : payHtml(d),
          chat: chatHtml(d),
          rate: rateHtml(d),
          facts: factsHtml(d),
          problem: problemHtml(d)
        };
        ORDER.forEach((name) => part(name, html[name]));
        P.applyFolds(box);
        if (skel) fadeSwap(box, 220);
        const dots = Array.from(box.querySelectorAll('.p2p-step-n.is-done .p2p-step-dot'));
        doneDots = dots.length;
        if (doneBefore >= 0 && dots.length > doneBefore) dots.slice(doneBefore).forEach(popIn);
        const [hint, acts] = barOf(d);
        bar.set(hint, acts ? `<div class="p2p-barbtns">${acts}</div>` : '');
        paintTimer();
        seenLater(d);
        listeners.forEach((fn) => fn(d));
      }
      let seenTimer = 0, seenKey = '', seenFor = '', seenTries = 0;
      function seenLater(d) {
        const c = ckOf(d);
        const key = d && c && d.me === 'buyer' && rejectedNow(d) && !c.seenAt ? `${d.receipt || ''}|${c.rejects || 0}|${c.until || ''}` : '';
        if (key === seenKey) return;
        clearTimeout(seenTimer);
        seenKey = key;
        if (!key) return;
        if (key !== seenFor) { seenFor = key; seenTries = 0; }
        if (seenTries >= 3) return;
        seenTimer = setTimeout(() => {
          const card = box.querySelector('[data-rcseen]');
          if (seenKey !== key || document.hidden || !card || !card.isConnected || !body.isConnected) { seenKey = ''; return; }
          seenTries += 1;
          P.call('deal/action', { id, action: 'seen_check' }).then(take, () => { seenKey = ''; });
        }, 3000);
      }
      function paintTimer() {
        const d = st.deal;
        const el = box.querySelector('[data-clock]');
        if (!d || !el) return;
        const left = Math.max(0, clockEnd(d) - Date.now());
        const text = clockText(left);
        const b = el.querySelector('b');
        if (b.textContent !== text) b.textContent = text;
        el.classList.toggle('is-low', left < 120000);
      }
      function take(json) {
        const raw = JSON.stringify(json.deal);
        if (raw === st.raw) return;
        st.raw = raw;
        st.deal = json.deal;
        if (st.check && !['locked', 'paid', 'disputed'].includes(json.deal.status) && !(st.check.kind === 'deposit' && json.deal.status === 'awaiting_lock')) st.check = null;
        paint();
      }
      function load() {
        return P.call('deal?id=' + id).then(take, (err) => {
          if (!st.deal) {
            st.failed = err.code;
            box.innerHTML = P.errorCard(err.code, 'dealFail');
          }
        });
      }
      const act = (action, extra) => P.call('deal/action', { id, action, ...extra }).then(take);
      async function run(fn, host) {
        if (st.busy) return;
        st.busy = true;
        bar.el.classList.add('is-busy');
        if (host) host.classList.add('is-busy');
        try {
          await fn();
        } catch (err) {
          P.oops(err);
        } finally {
          st.busy = false;
          bar.el.classList.remove('is-busy');
          if (host) host.classList.remove('is-busy');
          paint();
          if (P.market) P.market.refresh();
        }
      }
      const askPassword = () => (st.ask ? st.ask() : Promise.resolve(null));

      function prepareDeposit() {
        const d = st.deal;
        const plan = { id: d.id, coin: d.token, units: d.units, fee: d.fee, gas: d.gas, memo: d.memo, escrow: d.escrow && d.escrow.address, wallet: d.sellerWallet };
        if (!P.demo && P.Audit.auditDeposit(plan)) throw P.fail('mismatch');
        st.check = { kind: 'deposit', plan, to: P.Audit.pins.escrow || (P.demo && d.escrow ? d.escrow.address : ''), amount: coinsOf(d, d.total), gas: P.coinsText(d.gas, 9, 'GRAM') };
      }
      async function signDeposit(plan) {
        const wallet = P.useWallet(plan.wallet);
        const signed = await P.unlocked(askPassword, (opts) => CK.wallet.signP2PDeposit(plan, { ...opts, wallet }));
        if (!signed) return;
        st.check = null;
        P.holdDeposit(depositKey(st.deal), signed.validUntil);
        await CK.wallet.broadcast(signed.boc);
        await act('deposit').catch(() => {});
        CK.haptic.success();
      }
      function prepare(kind) {
        const d = st.deal;
        const to = d.buyerWallet;
        const units = d.units;
        if (!P.WALLET.test(String(to)) || !P.pinnedCoin(d.token) || !P.ID.test(d.id)) throw P.fail('mismatch');
        st.check = { kind, to, units, amount: coinsOf(d, units) };
      }
      function prepareDecision(side) {
        const d = st.deal;
        if (side === 'fine') {
          st.check = { kind: 'decide', side, to: t('fineTo'), units: d.total, amount: coinsOf(d, d.total) };
          return;
        }
        const toBuyer = side === 'buyer';
        const to = toBuyer ? d.buyerWallet : d.sellerWallet;
        const units = toBuyer ? d.units : d.total;
        if (!P.WALLET.test(String(to)) || !P.ID.test(d.id)) throw P.fail('mismatch');
        st.check = { kind: 'decide', side, to, units, amount: coinsOf(d, units) };
      }
      async function signChecked() {
        const c = st.check;
        if (P.demo && c.kind !== 'decide') {
          st.check = null;
          await act(c.kind === 'deposit' ? 'deposit' : 'release');
          CK.toast(esc(t('demoSigned')), { icon: 'info', tone: 'accent' });
          return undefined;
        }
        if (c.kind === 'deposit') return signDeposit(c.plan);
        if (c.kind === 'decide') {
          const answer = await P.call('arbiter/resolve', { id, to: c.side, note: st.note || '' });
          st.check = null;
          st.form = null;
          take(answer);
          CK.haptic.success();
          return undefined;
        }
        const wallet = P.useWallet(st.deal.sellerWallet);
        const until = Math.floor(Date.now() / 1000) + P.SIGNATURE_LIFE_S;
        const text = P.Audit.dealText(c.kind, { id: st.deal.id, token: st.deal.token }, c.to, c.units, until);
        const proof = await P.unlocked(askPassword, (opts) => CK.wallet.signP2PText(text, { ...opts, wallet }));
        if (!proof) return undefined;
        st.check = null;
        await act('release', { signature: proof.signature, publicKey: proof.publicKey, until });
        st.form = null;
        CK.haptic.success();
        return undefined;
      }
      function uploader(paintIt, purpose) {
        let cur = null, seq = 0;
        const drop = () => { if (cur && cur.url) URL.revokeObjectURL(cur.url); cur = null; };
        return {
          get now() { return cur; },
          get ready() { return !!(cur && cur.id); },
          get busy() { return !!(cur && !cur.id && !cur.err); },
          pick(file) {
            if (!file) return;
            let type;
            try { type = P.fileKind(file); } catch (err) { P.oops(err); return; }
            const mine = ++seq;
            drop();
            cur = { file, type, size: file.size, url: type.startsWith('image/') ? URL.createObjectURL(file) : '', pct: 0, id: '', err: '' };
            paintIt(cur, 'start');
            P.upload(id, file, (pct) => {
              if (mine !== seq) return;
              cur.pct = pct;
              paintIt(cur, 'progress');
            }, purpose).then((r) => {
              if (mine !== seq) return;
              cur.id = r.id;
              cur.pct = 1;
              CK.haptic.success();
              paintIt(cur, 'done');
            }, (err) => {
              if (mine !== seq) return;
              cur.err = err.code || 'upload_failed';
              paintIt(cur, 'error');
              P.oops(err);
            });
          },
          retry() { if (cur && cur.file) this.pick(cur.file); },
          clear() { seq += 1; drop(); }
        };
      }
      const fileLabel = (type) => (type === 'application/pdf' ? t('pdf') : t('photo'));
      function fileTileHtml(f, o) {
        const opts = o || {};
        const thumb = f.url ? `<img class="p2p-file-img" alt="" src="${esc(f.url)}">` : `<span class="p2p-file-doc">${icon('doc', { size: 22 })}</span>`;
        const sub = f.err ? `<span class="p2p-file-sub p2p-red">${esc(t('upFail'))}</span>` : `<span class="p2p-file-sub">${esc(P.sizeText(f.size))}${f.id ? '' : ` · ${esc(t('uploading', { pct: Math.round(f.pct * 100) }))}`}</span>`;
        const prog = f.id || f.err ? '' : '<span class="p2p-prog"><span class="p2p-prog-fill"></span></span>';
        const right = f.err
          ? `<button class="section-link press" type="button" data-upretry>${esc(t('retry'))}</button>`
          : opts.replace ? `<button class="section-link press" type="button" data-pick>${esc(t('replace'))}</button>` : '';
        const x = opts.cancel ? `<button class="p2p-file-x press" type="button" data-upx aria-label="${esc(t('cancelShort'))}">${icon('close', { size: 16 })}</button>` : '';
        return `<div class="p2p-file${f.err ? ' is-err' : ''}${f.id ? ' is-done' : ''}">${thumb}<span class="p2p-file-main"><b>${esc(fileLabel(f.type))}</b>${sub}${prog}</span>${right}${x}</div>`;
      }
      function paintProgress(host, f) {
        const fill = host.querySelector('.p2p-prog-fill');
        if (fill) fill.style.transform = `scaleX(${Math.max(.02, f.pct)})`;
        const sub = host.querySelector('.p2p-file-sub');
        if (sub && !f.id && !f.err) sub.textContent = `${P.sizeText(f.size)} · ${t('uploading', { pct: Math.round(f.pct * 100) })}`;
      }
      function guardThumb(host) {
        host.querySelectorAll('.p2p-file-img').forEach((img) => img.addEventListener('error', () => { img.replaceWith(CK.el(`<span class="p2p-file-doc">${icon('doc', { size: 22 })}</span>`)); }, { once: true }));
      }

      let sheetSeq = 0;
      const otherSheet = () => !!CK.sheet.top && !(api.isSheet && CK.sheet.top.el === api.el);
      function actionSheet(o) {
        if (otherSheet()) return;
        const mine = ++sheetSeq;
        let pass = null;
        st.sheet = mine;
        st.form = o.form || 'sheet';
        P.stepSheet({
          title: o.title,
          onClose() {
            if (pass) pass.cancel();
            if (st.sheet === mine) {
              st.sheet = null;
              st.check = null;
              st.form = null;
              st.ask = null;
            }
            if (o.onClose) o.onClose();
          },
          build(b, ui) {
            ui.passBox = (host, hide) => { pass = P.passBox(host, hide); st.ask = pass.ask; return pass; };
          },
          first: o.first
        });
      }
      function checkRows(c) {
        const d = st.deal;
        let who = '', addr = '';
        if (c.kind === 'decide') {
          who = c.side === 'fine' ? t('fineTo') : `${t(c.side === 'buyer' ? 'buyer' : 'seller')} · ${((c.side === 'buyer' ? d.buyer : d.seller) || {}).name || '—'}`;
          addr = c.side === 'fine' ? '' : c.to;
        } else if (c.kind === 'deposit') {
          who = t('escrowWallet');
          addr = c.to;
        } else {
          who = `${t('buyer')} · ${d.buyer ? d.buyer.name : '—'}`;
          addr = c.to;
        }
        const friendly = addr && /^0:/.test(addr) && CK.ton.friendlyAddress ? CK.ton.friendlyAddress(addr) : addr;
        const short = friendly ? (CK.ton.shortAddress ? CK.ton.shortAddress(friendly) : P.shortAddr(friendly)) : '';
        return `<div class="group p2p-flat p2p-facts">
          <button class="cell press-row p2p-fact p2p-towho" type="button" data-full="${esc(friendly)}" data-short="${esc(short)}"><span class="cell-sub p2p-label">${esc(t(c.kind === 'deposit' ? 'to' : 'to'))}</span><span class="p2p-value p2p-stack"><span>${esc(who)}</span>${short ? `<span class="p2p-addr">${esc(short)}</span>` : ''}</span></button>
          ${P.fact(t('coins'), esc(c.amount))}
          ${c.gas ? P.fact(t('gasRow'), esc(c.gas)) : ''}
          ${P.fact(t('network'), 'TON')}
        </div>`;
      }
      function checkStep(h, ui, label, tone, note) {
        const c = st.check;
        h.innerHTML = `${checkRows(c)}${note ? `<p class="p2p-note">${esc(note)}</p>` : ''}<div class="p2p-btns"><button class="btn btn--wide press ${tone || ''}" type="button" data-sign>${esc(label)}</button></div>`;
        const btns = $('.p2p-btns', h), sign = $('[data-sign]', h);
        ui.passBox(h, btns);
        h.addEventListener('click', (e) => {
          const addr = e.target.closest('[data-full]');
          if (addr && addr.dataset.full) {
            const el = addr.querySelector('.p2p-addr');
            if (el) el.textContent = el.textContent === addr.dataset.full ? addr.dataset.short : addr.dataset.full;
            return;
          }
          if (!e.target.closest('[data-sign]') || sign.disabled) return;
          sign.disabled = true;
          run(signChecked).then(() => {
            sign.disabled = false;
            if (!st.check) ui.close();
          });
        });
      }

      const PRE_WARN = { not_a_receipt: 'rcNotReceipt', unreadable: 'rcUnreadable', not_original: 'rcNotOriginal' };
      function precheck(preEl, mainBtns, ui, forceLabel) {
        let pre = null, timer = 0;
        const stop = () => { clearTimeout(timer); timer = 0; };
        function paint() {
          let html = '';
          if (pre && pre.warn) {
            html = `<p class="p2p-note p2p-note--warn">${icon('warning', { size: 16 })}<span>${esc(t(PRE_WARN[pre.warn] || 'rcUnreadable'))}</span></p>
              <div class="p2p-btns"><button class="btn btn--wide press" type="button" data-pick>${esc(t('rcPickOther'))}</button><button class="btn btn--wide btn--tinted press" type="button" data-force>${esc(forceLabel)}</button></div>`;
          } else if (pre && pre.state) {
            const key = pre.state === 'done' ? 'rcFileOk' : pre.state === 'slow' ? 'rcSlow' : 'rcChecking';
            html = `<p class="p2p-note${pre.state === 'done' ? ' p2p-rc-okline' : ''}">${pre.state === 'done' ? icon('check', { size: 16 }) : ''}<span>${esc(t(key))}</span></p>`;
          }
          preEl.hidden = !html;
          preEl.innerHTML = html;
          mainBtns.hidden = !!(pre && pre.warn);
        }
        function poll(fileId, started) {
          stop();
          P.call(`receipt-check?deal=${encodeURIComponent(id)}&file=${encodeURIComponent(fileId)}`).then((json) => {
            if (!pre || pre.file !== fileId) return;
            if (!json || json.check === null || typeof json.check !== 'object') { pre = null; return void paint(); }
            const c = json.check;
            if (c.state === 'done' || (c.verdict && c.verdict !== 'pending')) {
              pre.state = 'done';
              pre.warn = c.verdict === 'rejected' && PRE_WARN[c.cls] ? c.cls : '';
              return void paint();
            }
            const age = Date.now() - started;
            if (age > 20000) pre.state = 'slow';
            paint();
            if (age < 40000) timer = setTimeout(() => poll(fileId, started), 2000);
          }, () => { if (pre && pre.file === fileId) { pre = null; paint(); } });
        }
        return {
          get warn() { return pre && pre.warn ? pre.warn : ''; },
          start(fileId) { stop(); if (!(P.cfg && P.cfg.receiptEarly)) return; pre = { file: fileId, state: 'pending', warn: '' }; paint(); timer = setTimeout(() => poll(fileId, Date.now()), 700); },
          clear() { stop(); pre = null; paint(); },
          warnNow(fileId, cls) { stop(); pre = { file: fileId, state: 'done', warn: PRE_WARN[cls] ? cls : 'not_a_receipt' }; paint(); },
          stop
        };
      }
      function openPaid() {
        const d = st.deal;
        const m = d.method || {};
        const tail = tailOf(m.value);
        let pre = null;
        actionSheet({
          form: 'paid',
          title: () => t('paidT'),
          onClose() { if (pre) pre.stop(); if (st.receipt) st.receipt.clear(); st.receipt = null; },
          first(h, ui) {
            h.innerHTML = `<p class="p2p-lead">${esc(t('paidQ', { sum: sumOf(d), bank: [m.bank, tail ? '•• ' + tail : ''].filter(Boolean).join(' ') }))}</p>
              <div class="p2p-tilebox"></div><div class="p2p-precheck" hidden></div>
              <input type="file" accept="${esc(P.FILE_ACCEPT)}" hidden data-file>
              <div class="p2p-btns"><button class="btn btn--wide btn--buy press" type="button" data-yes disabled>${esc(t('yesPaid'))}</button></div>`;
            const fileEl = $('[data-file]', h), yes = $('[data-yes]', h), tile = $('.p2p-tilebox', h), preEl = $('.p2p-precheck', h), mainBtns = yes.parentNode;
            pre = precheck(preEl, mainBtns, ui, t('rcForce'));
            const paintTile = (f, what) => {
              if (what === 'progress') return void paintProgress(tile, f);
              tile.innerHTML = f
                ? fileTileHtml(f, { replace: true })
                : `<button class="p2p-drop press" type="button" data-pick>${icon('doc', { size: 26 })}<b>${esc(t('attachReceipt'))}</b></button>`;
              guardThumb(tile);
              paintProgress(tile, f || { pct: 0, size: 0, id: 'x' });
              yes.disabled = !(f && f.id);
              if (what === 'start' || !f) pre.clear();
              if (what === 'done' && f && f.id) pre.start(f.id);
            };
            st.receipt = uploader(paintTile, 'receipt');
            paintTile(null);
            fileEl.addEventListener('change', () => {
              const file = fileEl.files && fileEl.files[0];
              fileEl.value = '';
              if (file && st.receipt) st.receipt.pick(file);
            });
            const send = (force) => run(async () => {
              if (!st.receipt || !st.receipt.ready) throw P.fail('receipt_needed');
              try {
                await act('paid', { fileId: st.receipt.now.id, ...(force ? { force: true } : {}) });
              } catch (err) {
                if (err && err.code === 'receipt_rejected' && !force) return void pre.warnNow(st.receipt.now.id, (err.data || {}).cls);
                throw err;
              }
              pre.stop();
              CK.haptic.success();
              ui.close();
            }, h);
            h.addEventListener('click', (e) => {
              if (e.target.closest('[data-pick]')) return void fileEl.click();
              if (e.target.closest('[data-upretry]')) return void (st.receipt && st.receipt.retry());
              if (e.target.closest('[data-force]')) return void send(true);
              if (!e.target.closest('[data-yes]') || yes.disabled) return;
              if (pre.warn) return;
              send(false);
            });
          }
        });
      }

      function openReup(part) {
        const d = st.deal;
        const c = ckOf(d) || {};
        const n = (Array.isArray(c.parts) ? c.parts.length : 0) + 2;
        let pre = null, up = null;
        actionSheet({
          form: 'reup',
          title: () => (part ? t('rrPartT', { n }) : t('rrNewT')),
          onClose() { if (pre) pre.stop(); },
          first(h, ui) {
            h.innerHTML = `<div class="p2p-tilebox"></div><div class="p2p-precheck" hidden></div><input type="file" accept="${esc(P.FILE_ACCEPT)}" hidden data-file>
              <div class="p2p-btns"><button class="btn btn--wide btn--buy press" type="button" data-go disabled>${esc(t('rrSend'))}</button></div>`;
            const fileEl = $('[data-file]', h), go = $('[data-go]', h), tile = $('.p2p-tilebox', h), preEl = $('.p2p-precheck', h);
            pre = precheck(preEl, go.parentNode, ui, t('rcSendAnyway'));
            const paintTile = (f, what) => {
              if (what === 'progress') return void paintProgress(tile, f);
              tile.innerHTML = f ? fileTileHtml(f, { replace: true }) : `<button class="p2p-drop press" type="button" data-pick>${icon('doc', { size: 26 })}<b>${esc(t('attachReceipt'))}</b></button>`;
              guardThumb(tile);
              paintProgress(tile, f || { pct: 0, size: 0, id: 'x' });
              go.disabled = !(f && f.id);
              if (what === 'start' || !f) pre.clear();
              if (what === 'done' && f && f.id) pre.start(f.id);
            };
            up = uploader(paintTile, 'receipt');
            paintTile(null);
            fileEl.addEventListener('change', () => { const one = fileEl.files && fileEl.files[0]; fileEl.value = ''; if (one) up.pick(one); });
            const send = () => run(async () => {
              if (!up.ready) throw P.fail('receipt_needed');
              await act('receipt', { fileId: up.now.id, part: !!part });
              pre.stop();
              up.clear();
              CK.haptic.success();
              ui.close();
            }, h);
            h.addEventListener('click', (e) => {
              if (e.target.closest('[data-pick]')) return void fileEl.click();
              if (e.target.closest('[data-upretry]')) return void up.retry();
              if (e.target.closest('[data-force]')) return void send();
              if (!e.target.closest('[data-go]') || go.disabled || pre.warn) return;
              send();
            });
          }
        });
      }
      function openDisputeNow() {
        actionSheet({ form: 'dispute', title: () => t('dispute'), first: (h, ui) => disputeStep(h, ui, null) });
      }
      function openNoMoney() {
        actionSheet({
          form: 'nomoney',
          title: () => t('noMoney'),
          first: (h, ui) => P.confirmStep(h, ui, {
            text: t('noMoneyQ'),
            yesLabel: t('noMoney'),
            noLabel: t('back'),
            tone: 'btn--sell',
            yes: () => run(() => act('no_money').then(() => CK.haptic.success())).then(() => { const c = ckOf(st.deal); return !!(c && c.sellerSaid); })
          })
        });
      }
      function openAppeal() {
        actionSheet({
          form: 'appeal',
          title: () => t('appealT'),
          first(h, ui) {
            h.innerHTML = `<label class="field"><span class="field-label">${esc(t('appealLabel'))}</span><textarea class="p2p-area" maxlength="1000" data-text aria-label="${esc(t('appealLabel'))}"></textarea></label>
              <div class="p2p-tilebox"></div><input type="file" accept="${esc(P.FILE_ACCEPT)}" hidden data-file>
              <div class="p2p-btns"><button class="btn btn--wide press" type="button" data-go disabled>${esc(t('appealGo'))}</button></div>`;
            const area = $('[data-text]', h), fileEl = $('[data-file]', h), tile = $('.p2p-tilebox', h), go = $('[data-go]', h);
            let upBusy = false;
            const ready = () => { go.disabled = upBusy || !area.value.trim(); };
            area.addEventListener('input', ready);
            const paintTile = (f, what) => {
              if (what === 'progress') return void paintProgress(tile, f);
              tile.innerHTML = f ? fileTileHtml(f, { cancel: true }) : `<div class="group p2p-flat"><button class="cell press-row p2p-addrow" type="button" data-pick>${icon('plus', { size: 18 })}<span class="cell-title">${esc(t('appealFile'))}</span></button></div>`;
              guardThumb(tile);
              paintProgress(tile, f || { pct: 0, size: 0, id: 'x' });
              upBusy = !!(f && !f.id && !f.err);
              ready();
            };
            const up = uploader(paintTile, 'appeal');
            paintTile(null);
            fileEl.addEventListener('change', () => { const one = fileEl.files && fileEl.files[0]; fileEl.value = ''; if (one) up.pick(one); });
            h.addEventListener('click', (e) => {
              if (e.target.closest('[data-pick]')) return void fileEl.click();
              if (e.target.closest('[data-upretry]')) return void up.retry();
              if (e.target.closest('[data-upx]')) { up.clear(); return void paintTile(null); }
              if (!e.target.closest('[data-go]') || go.disabled) return;
              run(async () => {
                const words = area.value.trim();
                if (!words) throw P.fail('bad_text');
                await P.call('appeal', { id, text: words, ...(up.ready ? { fileId: up.now.id } : {}) }).then(take);
                up.clear();
                CK.haptic.success();
                ui.close();
              }, h);
            });
          }
        });
      }
      const arb = (path, body) => P.call(path, { id, ...body }).then((json) => (json && json.deal ? take(json) : load()));
      function openArbAppeal() {
        let outcome = '';
        actionSheet({
          form: 'rcappeal',
          title: () => t('acAppealT'),
          first(h, ui) {
            h.innerHTML = `<div class="group p2p-flat" role="radiogroup">${[['buyer_right', 'acBuyerRight'], ['seller_right', 'acSellerRight']].map(([v, k]) => `<button class="cell press-row" type="button" role="radio" aria-checked="false" data-o="${v}"><span class="cell-title">${esc(t(k))}</span><span class="p2p-tick" aria-hidden="true">${icon('check', { size: 14 })}</span></button>`).join('')}</div>
              <p class="p2p-note">${esc(t('acAppealNote'))}</p>
              <label class="field"><span class="field-label">${esc(t('notePh'))}</span><span class="field-box p2p-textbox"><input maxlength="500" autocomplete="off" data-note aria-label="${esc(t('notePh'))}"></span></label>
              <div class="p2p-btns"><button class="btn btn--wide press" type="button" data-go disabled>${esc(t('acAppealGo'))}</button></div>`;
            const go = $('[data-go]', h), note = $('[data-note]', h);
            h.addEventListener('click', (e) => {
              const o = e.target.closest('[data-o]');
              if (o) {
                CK.haptic.selection();
                outcome = o.dataset.o;
                h.querySelectorAll('[data-o]').forEach((r) => r.setAttribute('aria-checked', String(r.dataset.o === outcome)));
                go.disabled = false;
                return;
              }
              if (!e.target.closest('[data-go]') || go.disabled) return;
              run(async () => {
                await arb('arbiter/appeal', { outcome, note: note.value.trim() });
                CK.haptic.success();
                ui.close();
              }, h);
            });
          }
        });
      }

      function openRelease() {
        const d = st.deal;
        actionSheet({
          form: 'release',
          title: () => t('releaseQT'),
          first: function question(h, ui) {
            h.innerHTML = `<p class="p2p-lead">${esc(t('releaseQ', { sum: sumOf(d) }))}</p>
              <div class="p2p-btns"><button class="btn btn--wide btn--buy press" type="button" data-yes>${esc(t('yesCame'))}</button></div>`;
            h.addEventListener('click', (e) => {
              if (!e.target.closest('[data-yes]')) return;
              try {
                prepare('release');
              } catch (err) {
                P.oops(err);
                return void ui.close();
              }
              ui.show((h2) => checkStep(h2, ui, t('signRelease'), 'btn--buy'), () => t('check'));
            });
          }
        });
      }

      function openDeposit() {
        if (otherSheet()) return;
        try {
          prepareDeposit();
        } catch (err) {
          return void P.oops(err);
        }
        const c = st.check;
        actionSheet({
          form: 'deposit',
          title: () => t('depositT'),
          first(h, ui) {
            st.check = c;
            checkStep(h, ui, t('signDeposit'), '', t('depositNote'));
          }
        });
      }

      const cancelTitle = () => { const d = st.deal; return t(d && d.status === 'created' ? (d.maker ? 'declineOrderQ' : 'cancelOrderQ') : 'cancelQ'); };
      function cancelStep(h, ui) {
        const d = st.deal;
        const order = d.status === 'created';
        P.confirmStep(h, ui, {
          text: t(d.status === 'locked' ? 'cancelFunded' : 'cancelEarly'),
          yesLabel: t(order ? (d.maker ? 'declineOrder' : 'cancelOrder') : 'cancelDeal'),
          noLabel: t(order && d.maker ? 'keepOrder' : 'keepDeal'),
          tone: 'btn--sell',
          yes: () => run(() => act('cancel').then(() => CK.haptic.success())).then(() => !!st.deal && st.deal.status === 'cancelled')
        });
      }
      function openCancel() {
        actionSheet({ form: 'cancel', title: cancelTitle, first: cancelStep });
      }

      function disputeStep(h, ui, reasonKey) {
        h.innerHTML = `<p class="p2p-note">${esc(t('disputeNote'))}</p>
          <label class="field"><span class="field-label">${esc(t('disputeLabel'))}</span><textarea class="p2p-area" maxlength="1000" data-text aria-label="${esc(t('disputeLabel'))}"></textarea></label>
          <div class="p2p-tilebox"></div>
          <input type="file" accept="${esc(P.FILE_ACCEPT)}" hidden data-file>
          <div class="p2p-btns"><button class="btn btn--wide btn--sell press" type="button" data-go>${esc(t('dispute'))}</button></div>`;
        const area = $('[data-text]', h), fileEl = $('[data-file]', h), tile = $('.p2p-tilebox', h), go = $('[data-go]', h);
        if (reasonKey && reasonKey !== 'r_other') area.value = t(reasonKey) + '\n';
        const paintTile = (f, what) => {
          if (what === 'progress') return void paintProgress(tile, f);
          tile.innerHTML = f
            ? fileTileHtml(f, { cancel: true })
            : `<div class="group p2p-flat"><button class="cell press-row p2p-addrow" type="button" data-pick>${icon('plus', { size: 18 })}<span class="cell-title">${esc(t('addShot'))}</span></button></div>`;
          guardThumb(tile);
          paintProgress(tile, f || { pct: 0, size: 0, id: 'x' });
          go.disabled = !!(f && !f.id && !f.err);
        };
        const up = uploader(paintTile);
        paintTile(null);
        fileEl.addEventListener('change', () => {
          const one = fileEl.files && fileEl.files[0];
          fileEl.value = '';
          if (one) up.pick(one);
        });
        h.addEventListener('click', (e) => {
          if (e.target.closest('[data-pick]')) return void fileEl.click();
          if (e.target.closest('[data-upretry]')) return void up.retry();
          if (e.target.closest('[data-upx]')) { up.clear(); return void paintTile(null); }
          if (!e.target.closest('[data-go]') || go.disabled) return;
          run(async () => {
            const words = area.value.trim();
            if (!words) throw P.fail('bad_text');
            await act('dispute', { text: words, ...(up.ready ? { fileId: up.now.id } : {}) });
            up.clear();
            CK.haptic.success();
            ui.close();
          }, h);
        });
      }
      function problemStep(h, ui) {
        const reasons = reasonsOf(st.deal);
        const back = () => ui.show(problemStep, () => t('problemT'), 'back');
        h.innerHTML = `<div class="group p2p-flat">${reasons.map(([k], i) => `<button class="cell press-row" type="button" data-r="${i}"><span class="cell-main"><span class="cell-title">${esc(t(k))}</span></span>${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button>`).join('')}</div>`;
        h.addEventListener('click', (e) => {
          const row = e.target.closest('[data-r]');
          if (!row) return;
          CK.haptic.selection();
          const [k, what] = reasons[Number(row.dataset.r)];
          if (what === 'dispute') return void ui.show((h2) => { disputeStep(h2, ui, k); ui.setBack(back); }, () => t('dispute'));
          if (what === 'cancel') return void ui.show((h2) => { cancelStep(h2, ui); ui.setBack(back); }, cancelTitle);
          const [, info, then] = what.split(':');
          ui.show((h2) => {
            ui.setBack(back);
            h2.innerHTML = `<p class="p2p-lead">${esc(t(info))}</p>${then === 'chat' ? `<div class="p2p-btns"><button class="btn btn--wide press" type="button" data-chatgo>${esc(t('openChat'))}</button></div>` : ''}`;
            h2.addEventListener('click', (ev) => {
              if (ev.target.closest('[data-chatgo]')) { ui.close(); setTimeout(openChat, 380); }
            });
          }, () => t(k));
          return undefined;
        });
      }
      function openProblem() {
        actionSheet({ form: 'problem', title: () => t('problemT'), first: (h, ui) => problemStep(h, ui) });
      }

      function openDecision() {
        const d = st.deal;
        let side = '';
        actionSheet({
          form: 'resolve',
          title: () => t('resolveT'),
          first: function choose(h, ui) {
            const rows = [['buyer', 'toBuyer', t('toBuyerSub', { coins: coinsOf(d) })], ['seller', 'toSeller', t('toSellerSub', { coins: coinsOf(d, d.total) })], ['fine', 'toFine', t('toFineSub')]];
            h.innerHTML = `<label class="field"><span class="field-label">${esc(t('notePh'))}</span><span class="field-box p2p-textbox"><input maxlength="500" autocomplete="off" data-note value="${esc(st.note)}" aria-label="${esc(t('notePh'))}"></span></label>
              <div class="group p2p-flat" role="radiogroup">${rows.map(([v, k, sub]) => `<button class="cell press-row" type="button" role="radio" aria-checked="${v === side}" data-side="${v}"><span class="cell-main"><span class="cell-title">${esc(t(k))}</span><span class="cell-sub">${esc(sub)}</span></span><span class="p2p-tick" aria-hidden="true">${icon('check', { size: 14 })}</span></button>`).join('')}</div>
              <div class="p2p-btns"><button class="btn btn--wide press" type="button" data-next${side ? '' : ' disabled'}>${esc(t('next'))}</button></div>
              <div class="group p2p-flat"><button class="cell press-row p2p-dangerrow" type="button" data-ban="seller"><span class="cell-title">${esc(t('banSeller'))}</span></button><button class="cell press-row p2p-dangerrow" type="button" data-ban="buyer"><span class="cell-title">${esc(t('banBuyer'))}</span></button></div>`;
            const note = $('[data-note]', h), next = $('[data-next]', h);
            note.addEventListener('input', () => { st.note = note.value; });
            h.addEventListener('click', (e) => {
              const pick = e.target.closest('[data-side]');
              if (pick) {
                CK.haptic.selection();
                side = pick.dataset.side;
                h.querySelectorAll('[data-side]').forEach((r) => r.setAttribute('aria-checked', String(r.dataset.side === side)));
                next.disabled = false;
                return;
              }
              const ban = e.target.closest('[data-ban]');
              if (ban) {
                const who = ban.dataset.ban === 'seller' ? d.seller : d.buyer;
                if (!who) return;
                return void ui.show((h2) => P.confirmStep(h2, ui, {
                  yesLabel: t('block'),
                  tone: 'btn--sell',
                  no: () => ui.show(choose, () => t('resolveT'), 'back'),
                  yes: () => P.call('arbiter/ban', { pid: who.pid, on: true }).then(() => {
                    CK.haptic.success();
                    CK.toast(esc(t('banned')), { icon: 'lock', tone: 'accent' });
                  })
                }), () => t('banQ', { name: who.name }));
              }
              if (!e.target.closest('[data-next]') || !side) return;
              st.note = note.value;
              try {
                prepareDecision(side);
              } catch (err) {
                return void P.oops(err);
              }
              ui.show((h2) => checkStep(h2, ui, t('decideNow'), ''), () => t('checkDecide'));
            });
          }
        });
      }

      function openChat() {
        if (!st.deal) return;
        const d = st.deal;
        const title = d.me === 'arbiter' ? 'chatDeal' : d.me === 'seller' ? 'chatWithBuyer' : 'chatWithSeller';
        P.pushScreen({
          title: () => t(title),
          build(cbody, capi) { buildChat(cbody, capi); },
          onClose() { cache.delete('chat'); paint(); }
        });
      }
      function buildChat(cbody, capi) {
        cbody.innerHTML = `<div class="p2p-page p2p-chat"><div class="p2p-msgs" role="log"></div></div>`;
        const msgs = $('.p2p-msgs', cbody);
        const cbar = capi.bar();
        cbar.el.classList.add('p2p-saybar');
        const scroller = capi.scroll;
        let shown = -1, open = null, up = null, keys = [];
        const formHtml = `<div class="p2p-upslot" hidden></div><form class="p2p-say"><button class="p2p-attach press" type="button" data-attach aria-label="${esc(t('attach'))}">${icon('plus', { size: 20 })}</button><input class="p2p-sayin" maxlength="1000" autocomplete="off" enterkeyhint="send" placeholder="${esc(t('messagePh'))}" aria-label="${esc(t('messagePh'))}"><button class="p2p-send press" type="submit" disabled aria-label="${esc(t('send2'))}">${icon('arrow-up', { size: 20 })}</button></form><input type="file" accept="${esc(P.FILE_ACCEPT)}" hidden data-file>`;
        function paintBar(d) {
          const can = !!d.canChat;
          if (open === can) return;
          open = can;
          cbar.set(can ? '' : d.me === 'arbiter' ? '' : t('chatClosed'), can ? formHtml : '');
          if (!can) return;
          const form = $('.p2p-say', cbar.el), input = $('.p2p-sayin', cbar.el), send = $('.p2p-send', cbar.el), fileEl = $('[data-file]', cbar.el);
          input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text || st.busy) return;
            run(async () => {
              await P.call('deal/message', { id, text }).then(take);
              input.value = '';
              send.disabled = true;
            });
          });
          const slot = $('.p2p-upslot', cbar.el);
          const paintSlot = (f, what) => {
            if (what === 'progress') return void paintProgress(slot, f);
            slot.hidden = !f;
            slot.innerHTML = f ? fileTileHtml(f, { cancel: true }) : '';
            guardThumb(slot);
            if (f) paintProgress(slot, f);
            if (what === 'done') {
              const fileId = f.id;
              P.call('deal/message', { id, fileId }).then((json) => {
                take(json);
                if (up && up.now && up.now.id === fileId) { up.clear(); paintSlot(null); }
              }, (err) => {
                if (up && up.now && up.now.id === fileId) { up.now.id = ''; up.now.err = err.code || 'upload_failed'; paintSlot(up.now, 'error'); }
                P.oops(err);
              });
            }
          };
          if (up) up.clear();
          up = uploader(paintSlot);
          $('[data-attach]', cbar.el).addEventListener('click', () => { if (!up.busy) fileEl.click(); });
          slot.addEventListener('click', (e) => {
            if (e.target.closest('[data-upretry]')) return void up.retry();
            if (e.target.closest('[data-upx]')) { up.clear(); paintSlot(null); }
          });
          fileEl.addEventListener('change', () => {
            const file = fileEl.files && fileEl.files[0];
            fileEl.value = '';
            if (file && !up.busy) up.pick(file);
          });
        }
        function items(d) {
          const out = d.messages.filter((m) => m.from !== 'system').map((m) => ({ at: m.at, m }));
          const locked = (d.history || []).some((h) => h.s === 'locked');
          (d.history || []).forEach((h) => { if (S_SYS.includes(h.s) && !(h.s === 'deposit_sent' && locked)) out.push({ at: h.at, sys: h.s, by: h.by }); });
          return out.sort((a, b) => a.at - b.at);
        }
        function paint(d) {
          paintBar(d);
          const count = d.messages.length + (d.history || []).length;
          if (count === shown) return;
          const atEnd = shown < 0 || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 40;
          const first = shown < 0;
          shown = count;
          let day = '';
          let prevFrom = '';
          const list = items(d);
          const nowKeys = list.map((one) => (one.sys ? `s:${one.sys}:${one.at}` : `m:${one.m.id || `${one.at}:${one.m.from}:${one.m.file || ''}`}`));
          const parts = list.map((one) => {
            const thisDay = CK.i18n.dayShort(one.at);
            const sep = thisDay !== day ? `<div class="p2p-day">${esc(thisDay)}</div>` : '';
            day = thisDay;
            const sysKey = one.sys === 'disputed' && one.by === 'system' ? 'sys_disputed_auto' : one.sys === 'paid' && d.me === 'buyer' ? 'sys_paid_mine' : one.sys === 'deposit_sent' && d.me === 'seller' ? 'sys_deposit_mine' : 'sys_' + one.sys;
            if (one.sys) { prevFrom = ''; return `${sep}<div class="p2p-sys">${esc(t(sysKey))}</div>`; }
            const m = one.m;
            const who = m.from !== 'me' && (d.me === 'arbiter' || m.from === 'arbiter' || prevFrom !== m.from) ? `<span class="p2p-who">${esc(t(m.from))}</span>` : '';
            prevFrom = m.from;
            return `${sep}<div class="p2p-msg${m.from === 'me' ? ' is-mine' : ''}${m.dispute ? ' is-dispute' : ''}">
              ${who}${m.receipt ? `<span class="p2p-msgtag">${P.tag(t('receiptTag'), 'accent')}</span>` : ''}
              ${m.text ? `<span class="p2p-text">${esc(m.text)}</span>` : ''}
              ${m.file ? msgFileHtml(m) : ''}
              <span class="p2p-at">${esc(CK.i18n.clock(m.at))}</span></div>`;
          });
          if (!first && keys.length === nowKeys.length && keys.every((k, i) => k === nowKeys[i])) {
            markSeen(d.id, d.messages.length);
            return;
          }
          const grows = !first && keys.length > 0 && keys.length < nowKeys.length && keys.every((k, i) => k === nowKeys[i]);
          const old = new Set(keys);
          const added = document.createElement('template');
          let fresh;
          if (grows) {
            added.innerHTML = parts.slice(keys.length).join('');
            fresh = Array.from(added.content.children);
            fresh.forEach((n) => n.classList.add('p2p-fade'));
          } else {
            fresh = [];
            parts.forEach((html, i) => {
              const one = document.createElement('template');
              one.innerHTML = html;
              const nodes = Array.from(one.content.children);
              if (!first && !old.has(nowKeys[i])) nodes.forEach((n) => n.classList.add('p2p-fade'));
              fresh.push(...nodes);
              added.content.appendChild(one.content);
            });
            if (!parts.length) {
              added.innerHTML = `<div class="p2p-sys">${esc(t('noMsgs'))}</div>`;
              fresh = Array.from(added.content.children);
            }
            msgs.textContent = '';
          }
          msgs.appendChild(added.content);
          keys = nowKeys;
          const within = (sel) => fresh.flatMap((n) => [...(n.matches(sel) ? [n] : []), ...n.querySelectorAll(sel)]);
          within('[data-pic]').forEach((img) => {
            const b = img.closest('[data-big]');
            P.fileOf(d.id, img.dataset.pic).then((f) => {
              const asDoc = () => {
                if (!b || !b.isConnected) return;
                b.replaceWith(CK.el(docBtnHtml(img.dataset.pic, f.type, f.size)));
                P.warmLink(d.id, img.dataset.pic, f.type !== 'application/pdf').catch(() => {});
              };
              if (!f.type.startsWith('image/')) return asDoc();
              img.addEventListener('error', asDoc, { once: true });
              img.src = f.url;
              return undefined;
            }, () => { if (b) b.remove(); });
          });
          within('[data-open]').forEach((doc) => { P.warmLink(d.id, doc.dataset.open, doc.dataset.type !== 'application/pdf').catch(() => {}); });
          markSeen(d.id, d.messages.length);
          if (atEnd) requestAnimationFrame(() => { scroller.scrollTop = scroller.scrollHeight; });
        }
        msgs.addEventListener('click', (e) => {
          const doc = e.target.closest('[data-open]');
          if (doc) return void P.openFile(st.deal ? st.deal.id : id, doc.dataset.open, doc.dataset.type).catch(P.oops);
          const big = e.target.closest('[data-big]');
          if (!big || CK.sheet.top) return;
          const img = big.querySelector('img');
          if (!img || !img.src) return;
          CK.sheet.open({ title: () => t('photo'), detents: ['fit'], build(b) { b.innerHTML = `<img class="p2p-bigimg" alt="" src="${esc(img.src)}">`; } });
        });
        const repaint = (d) => { if (!cbody.isConnected && shown >= 0) return void listeners.delete(repaint); paint(d); };
        listeners.add(repaint);
        CK.i18n.bind(cbody, () => { shown = -1; keys = []; open = null; if (st.deal) paint(st.deal); });
        if (st.deal) paint(st.deal);
      }
      const S_SYS = ['locked', 'paid', 'disputed', 'released', 'cancelled', 'expired', 'deposit_sent'];
      const docBtnHtml = (fileId, type, size) => `<button class="p2p-docbtn press" type="button" data-open="${esc(fileId)}" data-type="${esc(type || '')}"><span class="p2p-file-doc">${icon('doc', { size: 22 })}</span><span class="p2p-file-main"><b>${esc(fileLabel(type))}</b>${size ? `<span class="p2p-file-sub">${esc(P.sizeText(size))}</span>` : ''}</span></button>`;
      const msgFileHtml = (m) => (m.fileType === 'application/pdf'
        ? docBtnHtml(m.file, m.fileType, m.fileSize)
        : `<button class="p2p-imgbtn press" type="button" data-big="${esc(m.file)}"><img class="p2p-img" alt="" data-pic="${esc(m.file)}"></button>`);

      function openReceipt(file) {
        if (otherSheet()) return;
        const line = ((st.deal && st.deal.messages) || []).find((m) => m.file === file);
        if (line && line.fileType === 'application/pdf') return void P.openFile(id, file, line.fileType).catch(P.oops);
        P.fileOf(id, file).then((f) => {
          if (otherSheet()) return;
          if (!f.type.startsWith('image/')) return void P.openFile(id, file, f.type).catch(P.oops);
          CK.sheet.open({
            title: () => t('receiptBuyer'),
            detents: ['fit'],
            build(b, sheet) {
              b.innerHTML = `<img class="p2p-bigimg" alt="" src="${esc(f.url)}">`;
              b.querySelector('img').addEventListener('error', () => { sheet.close(); P.openFile(id, file, f.type).catch(P.oops); }, { once: true });
            }
          });
        }, P.oops);
      }

      function openOther(role) {
        const d = st.deal;
        const p = role === 'seller' ? d.seller : d.buyer;
        P.openPerson(p, { role, canBlock: d.me !== 'arbiter' });
      }

      body.addEventListener('click', (e) => {
        const copy = e.target.closest('[data-copy]');
        if (copy) return void P.copyFrom(copy);
        if (e.target.closest('[data-retry]')) { box.innerHTML = ''; cache.clear(); return void load(); }
        if (e.target.closest('[data-chat]')) return void openChat();
        const rc = e.target.closest('[data-receipt]');
        if (rc && st.deal) return void openReceipt(rc.dataset.receipt);
        const person = e.target.closest('[data-person]');
        if (person && st.deal) return void openOther(person.dataset.person);
        const other = e.target.closest('[data-odeal]');
        if (other && P.ID.test(other.dataset.odeal)) return void P.openDeal(other.dataset.odeal);
        const el = e.target.closest('[data-act]');
        if (el) onAct(el);
      });
      bar.el.addEventListener('click', (e) => {
        const el = e.target.closest('[data-act]');
        if (el) onAct(el);
      });
      function onAct(el) {
        if (st.busy || !st.deal) return;
        const a = el.dataset.act;
        CK.haptic.light();
        if (a === 'paid') return openPaid();
        if (a === 'release') return openRelease();
        if (a === 'deposit') return openDeposit();
        if (a === 'cancelAsk') return openCancel();
        if (a === 'problem') return openProblem();
        if (a === 'resolve') return openDecision();
        if (a === 'toAds') return P.toRoot();
        if (a === 'wallet') { P.toRoot(); if (P.ctx && P.ctx.goTab) P.ctx.goTab('portfolio'); return undefined; }
        if (a === 'star') {
          return run(async () => {
            await act('rate', { stars: Number(el.dataset.n) });
            P.markRated(id);
            CK.toast(esc(t('rated')), { icon: 'star', tone: 'accent' });
          });
        }
        if (a === 'confirm') return run(() => act('confirm'));
        if (a === 'reup') return openReup(false);
        if (a === 'part') return openReup(true);
        if (a === 'disputeNow') return openDisputeNow();
        if (a === 'noMoney') return openNoMoney();
        if (a === 'appeal') return openAppeal();
        if (a === 'rcAccept') return run(() => arb('arbiter/check', { act: 'accept' }).then(() => CK.haptic.success()));
        if (a === 'rcDispute') return run(() => arb('arbiter/check', { act: 'dispute' }).then(() => CK.haptic.success()));
        if (a === 'rcAppeal') return openArbAppeal();
        if (a === 'rcLabel') return run(() => arb('arbiter/check', { act: 'label', label: el.dataset.label === 'right' ? 'right' : 'wrong' }).then(() => CK.haptic.success()));
        return undefined;
      }

      CK.i18n.bind(body, () => { cache.clear(); paint(); });
      load();
      const tick = setInterval(() => {
        if (!body.isConnected) return clearInterval(tick);
        paintTimer();
        if (st.deal && !document.hidden) seenLater(st.deal);
        const held = !!st.deal && P.depositHeld(depositKey(st.deal));
        if (held !== st.held) { st.held = held; paint(); }
        const mins = st.deal && rejectedNow(st.deal) ? minsLeft(ckOf(st.deal).until) : -1;
        if (mins !== st.mins) { st.mins = mins; paint(); }
        return undefined;
      }, 1000);
      const poll = setInterval(() => {
        if (!body.isConnected) return clearInterval(poll);
        if (!document.hidden && !st.busy && !st.check && !st.form) load();
        return undefined;
      }, P.POLL_MS);
      return {
        stop() { clearInterval(tick); clearInterval(poll); clearTimeout(seenTimer); listeners.clear(); },
        get deal() { return st.deal; }
      };
    }

    function openDeals() {
      P.pushScreen({
        title: () => t('myDeals'),
        build(body) {
          const st = { rows: null, failed: '', tab: '' };
          body.innerHTML = `<div class="p2p-page">${P.demoNote()}<div class="p2p-seg p2p-dealseg"></div><div class="p2p-dealrows"></div></div>`;
          const segEl = $('.p2p-dealseg', body), rowsEl = $('.p2p-dealrows', body);
          let seg = null;
          const rowHtml = (d) => {
            const buy = d.me === 'buyer';
            const live = P.dealActive(d);
            const turn = live ? turnOf(d) : null;
            const clock = live && clocked(d) ? `<span data-left="${clockEnd(d)}"></span>` : '';
            const under = turn && turn.mine ? `<span class="p2p-rowclock p2p-turn"${clock ? ` aria-label="${esc(t('yourTurn'))}"` : ''}>${clock || esc(t('yourTurn'))}</span>` : clock ? `<span class="p2p-rowclock">${clock}</span>` : `<span class="p2p-rowclock">${esc(CK.i18n.dayShort(d.at))}</span>`;
            return `<button class="cell press-row p2p-dealrow p2p-myrow" type="button" data-deal="${esc(d.id)}">${P.mark(buy ? 'arrow-down-left' : 'arrow-up-right', buy ? 'green' : 'red', 36)}
              <span class="cell-main"><span class="p2p-myline"><span class="cell-title p2p-line">${esc(t(buy ? 'buyRow' : 'sellRow', { sum: P.rubShort(d.fiatAmount, d.fiat) }))}</span>${P.tag(t('s_' + d.status), P.statusTone(d.status))}</span><span class="p2p-myline">${P.parts([P.coinsCompact(d.units, d.decimals, d.symbol), d.other ? d.other.name : ''], 'cell-sub')}${under}</span></span></button>`;
          };
          let skelOn = false;
          function paint() {
            if (st.failed) return void (rowsEl.innerHTML = P.errorCard(st.failed, 'dealsFail'));
            if (!st.rows) { skelOn = true; return void (rowsEl.innerHTML = P.skelRows(4)); }
            if (skelOn) { skelOn = false; requestAnimationFrame(() => fadeSwap(rowsEl, 220)); }
            const active = st.rows.filter(P.dealActive), done = st.rows.filter((d) => !P.dealActive(d));
            if (!seg) {
              st.tab = active.length ? 'active' : 'finished';
              seg = CK.segmented(segEl, { items: [{ value: 'active', label: () => t('active') }, { value: 'finished', label: () => t('finished') }], value: st.tab, onChange(v) { st.tab = v; paint(); fadeSwap(rowsEl, 180); } });
            }
            if (st.tab === 'active') {
              rowsEl.innerHTML = active.length ? `<div class="group list--free">${active.map(rowHtml).join('')}</div>`
                : P.empty('noActive', 'history', P.hidden ? undefined : { actions: `<button class="btn btn--small btn--tinted press" type="button" data-toads>${esc(t('toAds'))}</button>` });
            } else if (!done.length) {
              rowsEl.innerHTML = P.empty('noFinished', 'history');
            } else {
              const months = [];
              done.forEach((d) => {
                const at = new Date(d.at);
                const name = at.toLocaleDateString(CK.i18n.lang, at.getFullYear() === new Date().getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' }).replace(/\s*г\.?$/, '');
                const last = months[months.length - 1];
                if (last && last.name === name) last.rows.push(d);
                else months.push({ name, rows: [d] });
              });
              rowsEl.innerHTML = months.map((m) => `<section class="p2p-month"><h3 class="p2p-h">${esc(m.name)}</h3><div class="group list--free">${m.rows.map(rowHtml).join('')}</div></section>`).join('');
            }
            clocks();
          }
          function clocks() {
            rowsEl.querySelectorAll('[data-left]').forEach((el) => {
              const text = clockText(Math.max(0, Number(el.dataset.left) - Date.now()));
              if (el.textContent !== text) el.textContent = text;
            });
          }
          function load() {
            st.failed = '';
            P.call('deals').then((json) => { st.rows = json.deals || []; paint(); }, (err) => { st.failed = err.code; paint(); });
          }
          body.addEventListener('click', (e) => {
            if (e.target.closest('[data-retry]')) { st.failed = ''; st.rows = null; paint(); return void load(); }
            if (e.target.closest('[data-toads]')) return void P.toRoot();
            const row = e.target.closest('[data-deal]');
            if (row) { CK.haptic.selection(); dealScreen(row.dataset.deal, load); }
          });
          const tick = setInterval(() => {
            if (!body.isConnected) return clearInterval(tick);
            if (!document.hidden) clocks();
            return undefined;
          }, 1000);
          CK.i18n.bind(body, paint);
          paint();
          load();
        },
        onClose() {}
      });
    }

    return { dealScreen, openDeals, turnOf };
  };
})();
