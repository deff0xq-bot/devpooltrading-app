# DevpoolTrading

Исходный код приложения DevpoolTrading. Это кошелёк и обменник, который работает прямо в Telegram: [@DevpoolTrading_bot](https://t.me/DevpoolTrading_bot).

Мы открыли код, чтобы любой мог сам посмотреть, как приложение обращается с деньгами.

Ключи и секретная фраза создаются на телефоне и на наш сервер не отправляются. В облаке Telegram лежит только зашифрованная копия, а ключ к ней наш сервер выдаёт после входа через Telegram. Каждую сделку телефон подписывает сам и перед подписью проверяет, что именно отправляет. Комиссия сервиса 1 %, и её видно до подписи.

Здесь тот же код, который приложение загружает с trading.devpool.su, только без комментариев. Серверной части в репозитории нет.

Код можно читать, но нельзя копировать, запускать у себя или использовать в других проектах. Подробности в файле LICENSE.

## English

Source code of DevpoolTrading, a wallet and exchange that runs inside Telegram ([@DevpoolTrading_bot](https://t.me/DevpoolTrading_bot)).

We published it so anyone can see how the app handles money. Keys and the recovery phrase are created on the phone and are not sent to our server. Only an encrypted backup is kept in Telegram's cloud, and our server issues its key after a Telegram login. Every transaction is signed and checked on the phone, and the 1% fee is shown before you sign.

These are the same files the app loads from trading.devpool.su, without comments. The server is not included.

You may read the code, but not copy, run or reuse it. See LICENSE.
