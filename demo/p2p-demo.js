(function() {
  "use strict";
  const Parts = window.DemoP2PParts = window.DemoP2PParts || {};
  Parts.sample = function(P) {
    const A = P.Audit;
    const MIN = 60 * 1e3;
    const T = Date.now();
    const usdtCoin = Object.keys(A.pins.coins).find((id) => id !== "gram");
    const ESCROW = "0:" + "e5".repeat(32);
    const WALLET = "0:" + "d3".repeat(32);
    const BANKS = window.CK && window.CK.bankLogos ? Object.keys(window.CK.bankLogos.BANK_IDS) : ["\u0421\u0431\u0435\u0440\u0431\u0430\u043D\u043A", "\u0422-\u0411\u0430\u043D\u043A", "\u0411\u0430\u043D\u043A \u0412\u0422\u0411", "\u0410\u041B\u042C\u0424\u0410-\u0411\u0410\u041D\u041A"];
    const assets = [
      { id: "gram", symbol: "GRAM", decimals: 9, coin: "gram", gas: A.gasOf("gram").toString(), poolGas: A.poolGasOf("gram").toString() },
      { id: "usdt", symbol: "USDT", decimals: 6, coin: usdtCoin, gas: A.gasOf(usdtCoin).toString(), poolGas: A.poolGasOf(usdtCoin).toString() }
    ];
    const assetOf = (id) => assets.find((a) => a.id === id);
    const MARKET = { gram: 98.6, usdt: 96.2 };
    let seq = 0;
    const newId = () => {
      seq += 1;
      return (seq.toString(16).padStart(4, "0") + T.toString(16)).padEnd(16, "a").slice(0, 16);
    };
    const person = (pid, name, done, rating, stars, votes) => ({ pid, name, done, rating, stars, votes, banned: false });
    const people = {
      anna: person("p_anna", "\u0410\u043D\u043D\u0430 \u041A.", 152, 98, 4.9, 88),
      max: person("p_max", "\u041C\u0430\u043A\u0441\u0438\u043C", 47, 94, 4.7, 31),
      olga: person("p_olga", "\u041E\u043B\u044C\u0433\u0430 \u0421.", 2, null, null, 0),
      dima: person("p_dima", "\u0414\u043C\u0438\u0442\u0440\u0438\u0439", 310, 99, 4.9, 201),
      irina: person("p_irina", "\u0418\u0440\u0438\u043D\u0430 \u0412.", 18, 89, 4.5, 11),
      petr: person("p_petr", "\u041F\u0451\u0442\u0440 \u041D.", 64, 91, 4.6, 40),
      sergey: person("p_sergey", "\u0421\u0435\u0440\u0433\u0435\u0439", 9, 100, 5, 6)
    };
    const me = { pid: "p_me", name: "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 (\u043F\u0440\u0438\u043C\u0435\u0440)", done: 15, rating: 96, stars: 4.8, votes: 12, banned: false, arbiter: true };
    const blocks =   new Set();
    const banned = [];
    const toUnits = (x, decimals) => BigInt(Math.floor(Number(x) * 10 ** Math.min(decimals, 6))) * 10n ** BigInt(Math.max(0, decimals - 6));
    const fixed = (x, n) => Number(x).toFixed(n);
    let methodSeq = 0;
    const method = (kind, bank, value, holder) => {
      methodSeq += 1;
      return { id: "m" + String(methodSeq).padStart(15, "0"), kind, bank, value, holder, tail: value.replace(/\D/g, "").slice(-4) };
    };
    const othersMethods = {
      p_anna: [method("card", "\u0421\u0431\u0435\u0440\u0431\u0430\u043D\u043A", "2202200312345678", "\u0410\u043D\u043D\u0430 \u041A."), method("sbp", "\u0422-\u0411\u0430\u043D\u043A", "+79001234567", "\u0410\u043D\u043D\u0430 \u041A.")],
      p_max: [method("card", "\u0410\u041B\u042C\u0424\u0410-\u0411\u0410\u041D\u041A", "4154812233445566", "\u041C\u0430\u043A\u0441\u0438\u043C \u041B.")],
      p_olga: [method("sbp", "\u041E\u0437\u043E\u043D \u0411\u0430\u043D\u043A (Ozon)", "+79119876543", "\u041E\u043B\u044C\u0433\u0430 \u0421.")],
      p_dima: [method("card", "\u0422-\u0411\u0430\u043D\u043A", "5536913344556677", "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u0420."), method("card", "\u0411\u0430\u043D\u043A \u0412\u0422\u0411", "2200240011223344", "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u0420."), method("sbp", "\u0421\u0431\u0435\u0440\u0431\u0430\u043D\u043A", "+79035551122", "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u0420.")],
      p_irina: [method("card", "\u0420\u0430\u0439\u0444\u0444\u0430\u0439\u0437\u0435\u043D \u0411\u0430\u043D\u043A", "4627290011223344", "\u0418\u0440\u0438\u043D\u0430 \u0412.")],
      p_petr: [method("sbp", "\u0413\u0430\u0437\u043F\u0440\u043E\u043C\u0431\u0430\u043D\u043A", "+79260001122", "\u041F\u0451\u0442\u0440 \u041D.")],
      p_sergey: [method("card", "\u0421\u043E\u0432\u043A\u043E\u043C\u0431\u0430\u043D\u043A", "2200700099887766", "\u0421\u0435\u0440\u0433\u0435\u0439 \u041A.")]
    };
    const mine = [method("card", "\u0421\u0431\u0435\u0440\u0431\u0430\u043D\u043A", "2202206677889900", "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 \u041F."), method("sbp", "\u0422-\u0411\u0430\u043D\u043A", "+79161112233", "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 \u041F."), method("card", "\u0411\u0430\u043D\u043A \u0412\u0422\u0411", "2200240055667788", "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 \u041F."), method("sbp", "\u0410\u041B\u042C\u0424\u0410-\u0411\u0410\u041D\u041A", "+79161112233", "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 \u041F.")];
    const ads = [];
    function ad(owner, side, asset, price, min, max, coins, minutes, how, terms, confirm) {
      const a = assetOf(asset);
      const row = {
        id: newId(),
        side,
        asset,
        owner,
        priceKind: typeof price === "object" ? "market" : "fixed",
        pct: typeof price === "object" ? price.pct : null,
        fixedPrice: typeof price === "object" ? null : price,
        min,
        max,
        available: toUnits(coins, a.decimals).toString(),
        payMinutes: minutes,
        terms: terms || "",
        confirm: !!confirm,
        methods: side === "sell" ? how.map((i) => othersMethods[owner.pid][i]) : how.map((kind) => ({ kind })),
        state: "on"
      };
      ads.push(row);
      return row;
    }
    ad(people.dima, "sell", "gram", { pct: -0.8 }, 1e3, 5e4, 2400, 15, [0, 1, 2], "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043E\u0434\u043D\u0438\u043C \u043F\u043B\u0430\u0442\u0435\u0436\u043E\u043C. \u0418\u043C\u044F \u0432 \u0431\u0430\u043D\u043A\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0442\u044C \u0441 \u0438\u043C\u0435\u043D\u0435\u043C \u0432 Telegram.");
    ad(people.anna, "sell", "gram", 98.4, 500, 2e4, 1240, 15, [0, 1], "");
    ad(people.max, "sell", "gram", 99.1, 3e3, 1e5, 3100, 30, [0], "\u041E\u0442\u0432\u0435\u0447\u0430\u044E \u0441 9 \u0434\u043E 23 \u043F\u043E \u041C\u043E\u0441\u043A\u0432\u0435.", true);
    ad(people.olga, "sell", "gram", 97.9, 500, 5e3, 80, 10, [0], "");
    ad(people.irina, "sell", "usdt", 96.9, 1e3, 3e4, 820, 15, [0], "");
    ad(people.dima, "sell", "usdt", { pct: 0.5 }, 5e3, 2e5, 4300, 30, [0, 2], "");
    ad(people.sergey, "buy", "gram", 97.6, 1e3, 15e3, 300, 15, ["card", "sbp"], "");
    ad(people.petr, "buy", "gram", { pct: -1.5 }, 2e3, 4e4, 900, 30, ["sbp"], "\u041F\u043B\u0430\u0447\u0443 \u0441 \u043A\u0430\u0440\u0442\u044B \u043D\u0430 \u0441\u0432\u043E\u0451 \u0438\u043C\u044F.");
    ad(people.anna, "buy", "gram", 96.8, 500, 1e4, 150, 15, ["card"], "");
    ad(people.max, "buy", "usdt", 95.4, 1e3, 5e4, 600, 15, ["card", "sbp"], "");
    const myAds = [];
    const priceOf = (row) => row.priceKind === "market" ? MARKET[row.asset] * (1 + row.pct / 100) : Number(row.fixedPrice);
    function adView(row) {
      const a = assetOf(row.asset);
      const own = row.owner === me;
      return {
        id: row.id,
        side: row.side,
        asset: row.asset,
        symbol: a.symbol,
        decimals: a.decimals,
        fiat: "RUB",
        price: fixed(priceOf(row), 2),
        priceKind: row.priceKind,
        pct: row.pct,
        fixed: row.priceKind === "fixed" ? fixed(row.fixedPrice, 2) : null,
        min: fixed(row.min, 2),
        max: fixed(row.max, 2),
        available: row.available,
        payMinutes: row.payMinutes,
        methods: row.methods.map((m) => m.id ? { id: m.id, kind: m.kind, bank: m.bank } : { kind: m.kind }),
        terms: row.terms,
        confirm: row.confirm,
        owner: own ? publicMe() : row.owner,
        mine: own,
        ...own ? { state: row.state, wallet: WALLET, pool: row.pool || null } : {}
      };
    }
    const publicMe = () => ({ pid: me.pid, name: me.name, done: me.done, rating: me.rating, stars: me.stars, votes: me.votes, banned: false });
    const deals = [];
    function deal(o) {
      const a = assetOf(o.asset);
      const price = o.price;
      const units = toUnits(o.fiat / price, a.decimals);
      const fee = units * BigInt(A.pins.feeBps) / 10000n;
      const id = o.id || newId();
      const row = {
        id,
        status: o.status,
        me: o.me,
        maker: !!o.maker,
        side: o.me === "buyer" ? "sell" : "buy",
        asset: o.asset,
        token: a.coin,
        symbol: a.symbol,
        decimals: a.decimals,
        units: units.toString(),
        fee: fee.toString(),
        total: (units + fee).toString(),
        gas: a.gas,
        memo: A.memoOf(id),
        price: fixed(price, 2),
        fiat: "RUB",
        fiatAmount: fixed(o.fiat, 2),
        payMinutes: o.minutes || 15,
        terms: o.terms || "",
        method: o.method,
        deadline: o.deadline || null,
        at: o.at,
        history: o.history,
        seller: o.seller,
        buyer: o.buyer,
        sellerWallet: o.me === "seller" ? WALLET : "0:" + "b7".repeat(32),
        buyerWallet: o.me === "buyer" ? WALLET : "0:" + "c4".repeat(32),
        escrow: { address: ESCROW },
        depositSent: !!o.depositSent,
        pending: null,
        dispute: o.dispute || null,
        rated: o.rated || null,
        receipt: o.receipt || null,
        pool: !!o.pool,
        canChat: o.canChat !== false,
        messages: o.messages || []
      };
      deals.push(row);
      return row;
    }
    const h = (s, ago, by) => ({ s, at: T - ago * MIN, by: by || "system" });
    const msg = (from, ago, text, extra) => ({ id: newId(), from, at: Date.now() - ago * MIN, receipt: false, text: text || "", file: null, dispute: false, ...extra });
    const anna = othersMethods.p_anna[0];
    const D1 = deal({
      status: "locked",
      me: "buyer",
      asset: "gram",
      price: 98.4,
      fiat: 5e3,
      seller: people.anna,
      buyer: publicMe(),
      pool: true,
      method: { kind: anna.kind, bank: anna.bank, value: anna.value, holder: anna.holder },
      deadline: T + 12 * MIN + 41e3,
      at: T - 3 * MIN,
      history: [h("created", 3, "buyer"), h("locked", 3)],
      messages: [msg("seller", 2, "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u0420\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B \u0432 \u0441\u0434\u0435\u043B\u043A\u0435, \u0436\u0434\u0443 \u043F\u0435\u0440\u0435\u0432\u043E\u0434."), msg("me", 1, "\u0414\u043E\u0431\u0440\u044B\u0439 \u0434\u0435\u043D\u044C, \u0441\u0435\u0439\u0447\u0430\u0441 \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0443.")]
    });
    const D2 = deal({
      status: "paid",
      me: "seller",
      maker: true,
      asset: "usdt",
      price: 96,
      fiat: 9600,
      seller: publicMe(),
      buyer: people.max,
      method: { kind: "sbp", bank: "\u0422-\u0411\u0430\u043D\u043A" },
      deadline: T + 20 * MIN,
      at: T - 9 * MIN,
      history: [h("created", 9, "buyer"), h("awaiting_lock", 8, "maker"), h("deposit_sent", 7, "seller"), h("locked", 6), h("paid", 1, "buyer")],
      receipt: "f1",
      messages: [msg("buyer", 1, "", { receipt: true, file: "f1" }), msg("buyer", 1, "\u041F\u0435\u0440\u0435\u0432\u0451\u043B, \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430")]
    });
    const D3 = deal({
      status: "disputed",
      me: "arbiter",
      asset: "gram",
      price: 97.5,
      fiat: 12e3,
      seller: people.petr,
      buyer: people.irina,
      method: { kind: "sbp", bank: "\u0413\u0430\u0437\u043F\u0440\u043E\u043C\u0431\u0430\u043D\u043A", value: "+79260001122", holder: "\u041F\u0451\u0442\u0440 \u041D." },
      at: T - 50 * MIN,
      dispute: { by: "buyer", at: T - 10 * MIN },
      history: [h("created", 50, "buyer"), h("locked", 49), h("paid", 30, "buyer"), h("disputed", 10, "buyer")],
      receipt: "f2",
      messages: [msg("buyer", 30, "", { receipt: true, file: "f2" }), msg("seller", 20, "\u0414\u0435\u043D\u0435\u0433 \u043D\u0435 \u0432\u0438\u0436\u0443."), msg("buyer", 10, "\u041F\u0435\u0440\u0435\u0432\u0435\u043B\u0430 12 000 \u043F\u043E \u0421\u0411\u041F, \u0447\u0435\u043A \u043F\u0440\u0438\u043B\u043E\u0436\u0438\u043B\u0430. \u041F\u0440\u043E\u0434\u0430\u0432\u0435\u0446 \u043D\u0435 \u043E\u0442\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u043C\u043E\u043D\u0435\u0442\u044B.", { dispute: true })]
    });
    const D4 = deal({
      status: "disputed",
      me: "buyer",
      asset: "usdt",
      price: 96.5,
      fiat: 4500,
      seller: people.dima,
      buyer: publicMe(),
      method: { kind: "card", bank: "\u0422-\u0411\u0430\u043D\u043A", value: "2200700012345678", holder: "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u041A." },
      at: T - 70 * MIN,
      dispute: { by: "system", at: T - 4 * MIN, reason: "seller_timeout" },
      history: [h("created", 70, "buyer"), h("locked", 69), h("paid", 52, "buyer"), h("disputed", 4)],
      receipt: "f3",
      messages: [msg("me", 52, "", { receipt: true, file: "f3" })]
    });
    deal({
      status: "released",
      me: "buyer",
      asset: "gram",
      price: 98,
      fiat: 3e3,
      seller: people.dima,
      buyer: publicMe(),
      rated: 5,
      pool: true,
      method: { kind: "card", bank: "\u0422-\u0411\u0430\u043D\u043A" },
      at: T - 26 * 60 * MIN,
      canChat: false,
      history: [h("created", 26 * 60, "buyer"), h("locked", 26 * 60 - 1), h("paid", 26 * 60 - 6, "buyer"), h("released", 26 * 60 - 9, "seller")],
      messages: [msg("seller", 26 * 60 - 9, "\u0421\u043F\u0430\u0441\u0438\u0431\u043E \u0437\u0430 \u0441\u0434\u0435\u043B\u043A\u0443!")]
    });
    deal({
      status: "cancelled",
      me: "buyer",
      asset: "usdt",
      price: 96.9,
      fiat: 2e3,
      seller: people.irina,
      buyer: publicMe(),
      pool: true,
      method: { kind: "card", bank: "\u0420\u0430\u0439\u0444\u0444\u0430\u0439\u0437\u0435\u043D \u0411\u0430\u043D\u043A" },
      at: T - 40 * 24 * 60 * MIN,
      canChat: false,
      history: [h("created", 40 * 24 * 60, "buyer"), h("locked", 40 * 24 * 60 - 1), h("cancelled", 40 * 24 * 60 - 5, "buyer"), h("deposit_returned", 40 * 24 * 60 - 4)]
    });
    deal({
      status: "resolved_to_buyer",
      me: "arbiter",
      asset: "gram",
      price: 99,
      fiat: 7e3,
      seller: people.max,
      buyer: people.olga,
      method: { kind: "card", bank: "\u0410\u041B\u042C\u0424\u0410-\u0411\u0410\u041D\u041A" },
      at: T - 5 * 24 * 60 * MIN,
      dispute: { by: "buyer", at: T - 5 * 24 * 60 * MIN },
      canChat: false,
      history: [h("created", 5 * 24 * 60, "buyer"), h("locked", 5 * 24 * 60 - 1), h("paid", 5 * 24 * 60 - 8, "buyer"), h("disputed", 5 * 24 * 60 - 30, "buyer"), h("resolved_to_buyer", 5 * 24 * 60 - 90, "arbiter")]
    });
    const GRACE = 15 * MIN;
    const RX1 = deal({
      status: "paid",
      me: "buyer",
      asset: "gram",
      price: 98.2,
      fiat: 1500,
      seller: people.sergey,
      buyer: publicMe(),
      pool: true,
      method: { kind: "card", bank: "\u0421\u043E\u0432\u043A\u043E\u043C\u0431\u0430\u043D\u043A", value: "2200700099887766", holder: "\u0421\u0435\u0440\u0433\u0435\u0439 \u041A." },
      deadline: T + 12 * MIN,
      at: T - 9 * MIN,
      history: [h("created", 9, "buyer"), h("locked", 9), h("paid", 3, "buyer")],
      receipt: "f4",
      messages: [msg("me", 3, "", { receipt: true, file: "f4" })]
    });
    RX1.check = { verdict: "rejected", cls: "duplicate", reasons: ["duplicate"], until: T + 12 * MIN, extended: false, seenAt: null, rejects: 1, max: 3, parts: [], maxParts: 3, onExpiry: "close", override: null, sellerSaid: { what: "no_money", at: T - 2 * MIN }, chatDetails: false };
    const RX2 = deal({
      status: "paid",
      me: "seller",
      asset: "gram",
      price: 97.9,
      fiat: 2300,
      seller: publicMe(),
      buyer: people.olga,
      method: { kind: "card", bank: "\u0421\u0431\u0435\u0440\u0431\u0430\u043D\u043A", value: "2202206677889900", holder: "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 \u041F." },
      deadline: T + 9 * MIN,
      at: T - 12 * MIN,
      history: [h("created", 12, "buyer"), h("locked", 12), h("paid", 6, "buyer")],
      receipt: "f5",
      messages: [msg("buyer", 6, "", { receipt: true, file: "f5" })]
    });
    RX2.check = { verdict: "rejected", cls: "forged", reasons: ["changed"], until: T + 9 * MIN, rejects: 1, max: 3, parts: [], maxParts: 3, onExpiry: "dispute", closeIfSaid: true, override: null, sellerSaid: null };
    const RX3 = deal({
      status: "paid",
      me: "buyer",
      asset: "gram",
      price: 98,
      fiat: 1500,
      seller: people.dima,
      buyer: publicMe(),
      pool: true,
      method: { kind: "card", bank: "\u0422-\u0411\u0430\u043D\u043A", value: "5536913344556677", holder: "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u0420." },
      deadline: T + 14 * MIN,
      at: T - 6 * MIN,
      history: [h("created", 6, "buyer"), h("locked", 6), h("paid", 1, "buyer")],
      receipt: "f6",
      messages: [msg("me", 1, "", { receipt: true, file: "f6" })]
    });
    RX3.check = { verdict: "flagged", cls: null, reasons: ["amount_short_small"], rejects: 0, max: 3, parts: [], maxParts: 3, override: null };
    const RX4 = deal({
      status: "expired",
      me: "buyer",
      asset: "usdt",
      price: 96.4,
      fiat: 3e3,
      seller: people.irina,
      buyer: publicMe(),
      pool: true,
      canChat: false,
      method: { kind: "card", bank: "\u0420\u0430\u0439\u0444\u0444\u0430\u0439\u0437\u0435\u043D \u0411\u0430\u043D\u043A", value: "4627290011223344", holder: "\u0418\u0440\u0438\u043D\u0430 \u0412." },
      at: T - 70 * MIN,
      history: [h("created", 70, "buyer"), h("locked", 70), h("paid", 60, "buyer"), { s: "expired", at: T - 30 * MIN, by: "system", reason: "receipt_rejected" }],
      receipt: "f7",
      messages: [msg("me", 60, "", { receipt: true, file: "f7" })]
    });
    RX4.endReason = "receipt_rejected";
    RX4.check = { verdict: "rejected", cls: "duplicate", reasons: ["duplicate"], rejects: 1, max: 3, parts: [], onExpiry: "close", appeal: null, appealUntil: T - 30 * MIN + 24 * 60 * MIN, support: "@devpool" };
    const RX5 = deal({
      status: "paid",
      me: "arbiter",
      asset: "gram",
      price: 98.1,
      fiat: 4500,
      seller: people.anna,
      buyer: people.max,
      method: { kind: "card", bank: "\u0421\u0431\u0435\u0440\u0431\u0430\u043D\u043A", value: "2202200312345678", holder: "\u0410\u043D\u043D\u0430 \u041A." },
      deadline: T + 11 * MIN,
      at: T - 20 * MIN,
      history: [h("created", 20, "buyer"), h("locked", 20), h("paid", 8, "buyer")],
      receipt: "f8",
      messages: [msg("buyer", 15, "", { receipt: true, file: "f9" }), msg("buyer", 8, "", { receipt: true, file: "f8" }), msg("seller", 5, "\u0414\u0435\u043D\u0435\u0433 \u043D\u0435\u0442.")]
    });
    RX5.check = {
      verdict: "rejected",
      cls: "forged",
      reasons: [{ c: "pdf_edited", sev: "hard", conf: "high" }, { c: "recipient_unverified", sev: "gap", conf: "medium" }],
      until: T + 11 * MIN,
      rejects: 2,
      tries: 2,
      max: 3,
      parts: [],
      onExpiry: "close",
      override: null,
      sellerSaid: { what: "no_money", at: T - 5 * MIN },
      forced: false,
      chatDetails: 0,
      mode: "enforce",
      at: T - 8 * MIN,
      engine: "none",
      rows: [
        { k: "type", got: "PDF, \u0421\u0431\u0435\u0440, \u0447\u0435\u043A", want: "\u2014", res: "none" },
        { k: "amount", got: "4 500,00 \u20BD", want: "4 500 \u20BD", res: "ok", conf: "high" },
        { k: "recipient", got: "\u041A\u0430\u0440\u0442\u0430 \u2022\u2022 5678", want: "\u041A\u0430\u0440\u0442\u0430 \u2022\u2022 5678", res: "ok", conf: "high" },
        { k: "other", got: "\u2022\u2022 9999", want: "\u2014", res: "none" },
        { k: "name", got: "\u0410\u043D\u043D\u0430 \u041A.", want: "\u0410\u043D\u043D\u0430 \u041A.", res: "ok", conf: "high" },
        { k: "bank", got: "\u0421\u0431\u0435\u0440\u0411\u0430\u043D\u043A", want: "\u0421\u0431\u0435\u0440\u0431\u0430\u043D\u043A", res: "ok", conf: "high" },
        { k: "time", got: "14:02 (\u041C\u0421\u041A)", want: "13:55\u201314:10", res: "ok", conf: "high" },
        { k: "status", got: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D", want: "\u2014", res: "ok", conf: "high" },
        { k: "sbp", got: "\u2014", want: "\u2014", res: "none" },
        { k: "opno", got: "\u2014", want: "\u2014", res: "none" },
        { k: "file", got: "iLovePDF", want: "iText 2.1.7 (\u0421\u0431\u0435\u0440)", res: "bad", conf: "high" }
      ],
      fileInfo: { producer: "iLovePDF", revisions: 2, overlays: [], editor: "", kind: "pdf", profile: "\u0421\u0431\u0435\u0440, \u0447\u0435\u043A: \u043D\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442 (\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430, \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F)", size: 61440 },
      dups: [],
      history: [{ file: "f9", verdict: "rejected", cls: "forged", at: T - 15 * MIN, part: false }, { file: "f8", verdict: "rejected", cls: "forged", at: T - 8 * MIN, part: false }]
    };
    const RX6 = deal({
      status: "expired",
      me: "arbiter",
      asset: "gram",
      price: 98.5,
      fiat: 2e3,
      seller: people.petr,
      buyer: people.sergey,
      canChat: false,
      method: { kind: "sbp", bank: "\u0413\u0430\u0437\u043F\u0440\u043E\u043C\u0431\u0430\u043D\u043A", value: "+79260001122", holder: "\u041F\u0451\u0442\u0440 \u041D." },
      at: T - 5 * 60 * MIN,
      history: [h("created", 300, "buyer"), h("locked", 300), h("paid", 290, "buyer"), { s: "expired", at: T - 250 * MIN, by: "system", reason: "receipt_rejected" }],
      receipt: "f10",
      messages: [msg("buyer", 290, "", { receipt: true, file: "f10" })]
    });
    RX6.endReason = "receipt_rejected";
    RX6.check = {
      verdict: "rejected",
      cls: "duplicate",
      reasons: [{ c: "dup_file", sev: "hard", conf: "high" }],
      rejects: 1,
      tries: 1,
      max: 3,
      parts: [],
      onExpiry: "close",
      mode: "enforce",
      at: T - 288 * MIN,
      engine: "none",
      rows: [{ k: "type", got: "\u0421\u043A\u0440\u0438\u043D\u0448\u043E\u0442", want: "\u2014", res: "none" }, { k: "file", got: "\u0422\u043E\u0442 \u0436\u0435 \u0444\u0430\u0439\u043B", want: "\u0421\u0434\u0435\u043B\u043A\u0430 #" + D3.id.slice(0, 6), res: "bad", conf: "high" }],
      fileInfo: { kind: "screenshot", size: 402e3 },
      dups: [{ deal: D3.id, status: D3.status, what: "\u0442\u043E\u0442 \u0436\u0435 \u0444\u0430\u0439\u043B" }],
      appeal: { at: T - 120 * MIN, text: "\u042F \u043E\u043F\u043B\u0430\u0442\u0438\u043B \u0441 \u043A\u0430\u0440\u0442\u044B \u0436\u0435\u043D\u044B, \u043F\u0440\u0438\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u044E \u0432\u044B\u043F\u0438\u0441\u043A\u0443.", file: "f11", outcome: null },
      appealUntil: T - 250 * MIN + 24 * 60 * MIN,
      label: null,
      history: [{ file: "f10", verdict: "rejected", cls: "duplicate", at: T - 288 * MIN, part: false }]
    };
    D2.check = { verdict: "partial", reasons: ["gap_recipient"], rejects: 0, max: 3, parts: [], override: null };
    let receiptMode = "enforce";
    const own1 = ad(me, "sell", "gram", 98.9, 1e3, 3e4, 500, 15, [], "\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B \u0441 \u043A\u0430\u0440\u0442\u044B \u043D\u0430 \u0432\u0430\u0448\u0435 \u0438\u043C\u044F.");
    own1.methods = [mine[0]];
    own1.state = "funding";
    own1.pool = poolOf(own1);
    const own2 = ad(me, "buy", "usdt", 95.8, 1e3, 2e4, 300, 30, ["card", "sbp"], "");
    own2.state = "paused";
    [own1, own2].forEach((row) => {
      ads.splice(ads.indexOf(row), 1);
      myAds.push(row);
    });
    function poolOf(row) {
      const units = BigInt(row.available);
      const a = assetOf(row.asset);
      return { id: row.id, coin: a.coin, units: units.toString(), fee: (units * BigInt(A.pins.feeBps) / 10000n).toString(), gas: a.poolGas, memo: A.memoOf(row.id), funded: false, depositSent: false, deadline: T + 60 * MIN, escrow: ESCROW };
    }
    const ENDED = /^(released|resolved_|fined|cancelled|expired)/;
    const unrated = () => deals.filter((d) => (d.me === "buyer" || d.me === "seller") && /^(released|resolved_|fined)/.test(d.status) && !d.rated).map((d) => d.id);
    const config = () => ({
      assets,
      fiats: ["RUB"],
      kinds: ["card", "sbp"],
      banks: BANKS,
      payMinutes: [10, 15, 30, 45, 60, 120],
      feeBps: A.pins.feeBps,
      receiptCheck: true,
      receiptEarly: true,
      escrow: { address: ESCROW, network: "ton" },
      me: { ...publicMe(), arbiter: me.arbiter, banned: false, unrated: unrated() }
    });
    const refuse = (code) => {
      throw P.fail(code);
    };
    const clone = (x) => JSON.parse(JSON.stringify(x));
    const find = (id) => deals.find((d) => d.id === id) || refuse("no_deal");
    const move = (d, s, by) => {
      d.status = s;
      d.history.push({ s, at: Date.now(), by: by || "system" });
      if (ENDED.test(s)) {
        d.canChat = false;
        d.deadline = null;
      }
    };
    const answer = (d) => ({ ok: true, deal: clone(d) });
    const later = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 160 + Math.random() * 220));
    function order(body) {
      const row = ads.find((one) => one.id === body.adId) || refuse("no_ad");
      const amount = Number(body.amount);
      if (!(amount >= row.min && amount <= row.max)) refuse("bad_amount");
      const iBuy = row.side === "sell";
      const m = iBuy ? row.methods.find((one) => one.id === body.methodId) : mine.find((one) => one.id === body.methodId);
      if (!m) refuse("no_methods");
      const now = Date.now();
      const first = row.confirm ? "created" : iBuy ? "locked" : "awaiting_lock";
      const d = deal({
        status: first,
        me: iBuy ? "buyer" : "seller",
        maker: false,
        asset: row.asset,
        price: priceOf(row),
        fiat: amount,
        minutes: row.payMinutes,
        terms: row.terms,
        seller: iBuy ? row.owner : publicMe(),
        buyer: iBuy ? publicMe() : row.owner,
        pool: iBuy,
        method: iBuy ? { kind: m.kind, bank: m.bank, value: m.value, holder: m.holder } : { kind: m.kind, bank: m.bank },
        deadline: now + (first === "locked" ? row.payMinutes : 15) * MIN,
        at: now,
        history: [{ s: "created", at: now, by: iBuy ? "buyer" : "seller" }].concat(first === "created" ? [] : [{ s: first, at: now, by: "system" }])
      });
      return answer(d);
    }
    function action(body) {
      const d = find(body.id);
      const a = body.action;
      if (a === "confirm") {
        move(d, d.pool ? "locked" : "awaiting_lock", "maker");
        d.deadline = Date.now() + 15 * MIN;
      } else if (a === "cancel") {
        if (d.depositSent && d.status === "awaiting_lock") refuse("deposit_sent");
        const was = d.status;
        move(d, "cancelled", d.me);
        if (was === "locked") d.history.push({ s: "deposit_returned", at: Date.now() + 1, by: "system" });
      } else if (a === "deposit") {
        d.depositSent = true;
        d.history.push({ s: "deposit_sent", at: Date.now(), by: "seller" });
        move(d, "locked");
        d.deadline = Date.now() + d.payMinutes * MIN;
      } else if (a === "paid") {
        const f = fileFor(d, body.fileId) || refuse("receipt_needed");
        const pre = checkOfFile(body.fileId);
        if (pre && pre.verdict === "rejected" && body.force !== true) throw Object.assign(P.fail("receipt_rejected"), { data: { error: "receipt_rejected", cls: pre.cls, reasons: pre.reasons, canForce: true } });
        move(d, "paid", "buyer");
        d.receipt = body.fileId;
        d.messages.push(msg("me", 0, "", { receipt: true, ...f }));
        d.deadline = Date.now() + d.payMinutes * MIN;
        d.check = { verdict: "pending", reasons: [], rejects: 0, max: 3, parts: [], maxParts: 3, forced: body.force === true, override: null };
        settle(d, pre && pre.verdict === "rejected" ? { verdict: "rejected", cls: pre.cls, reasons: pre.reasons } : { verdict: "ok", reasons: [] });
      } else if (a === "receipt") {
        const c = d.check || refuse("bad_transition");
        const f = fileFor(d, body.fileId) || refuse("receipt_needed");
        if (d.status !== "paid" || c.rejects >= c.max) refuse("bad_transition");
        if (body.part) {
          if (c.parts.length + 1 >= c.maxParts) refuse("bad_transition");
          c.parts.push(body.fileId);
        } else {
          d.receipt = body.fileId;
          c.parts = [];
        }
        d.messages.push(msg("me", 0, "", { receipt: true, part: !!body.part, ...f }));
        Object.assign(c, { verdict: "pending", cls: null, reasons: [] });
        d.deadline = Math.max(d.deadline || 0, Date.now() + GRACE);
        settle(d, { verdict: "ok", reasons: [] });
      } else if (a === "no_money") {
        if (d.me !== "seller" || !d.check) refuse("bad_transition");
        d.check.sellerSaid = { what: "no_money", at: Date.now() };
        if (d.check.closeIfSaid) d.check.onExpiry = "close";
      } else if (a === "seen_check") {
        if (d.me !== "buyer" || !d.check || d.check.verdict !== "rejected") refuse("bad_transition");
        if (!d.check.seenAt) d.check.seenAt = Date.now();
      } else if (a === "release") {
        move(d, "released", "seller");
      } else if (a === "dispute") {
        if (!String(body.text || "").trim()) refuse("bad_text");
        move(d, "disputed", d.me);
        d.dispute = { by: d.me, at: Date.now() };
        d.deadline = null;
        d.messages.push(msg("me", 0, body.text, { dispute: true, ...fileFor(d, body.fileId) || {} }));
      } else if (a === "rate") {
        d.rated = Number(body.stars);
      } else refuse("bad_transition");
      return answer(d);
    }
    const toSide = { buyer: "resolved_to_buyer", seller: "resolved_to_seller", fine: "fined" };
    function checkOfFile(fileId) {
      const u = uploads.get(String(fileId || ""));
      if (!u) return null;
      if (Date.now() - u.at < 1500) return { state: "pending", verdict: "pending" };
      if (/cat|kot|кот|meme|мем/i.test(u.name || "")) return { state: "done", verdict: "rejected", cls: "not_a_receipt", reasons: ["not_receipt"] };
      if (/print|печать/i.test(u.name || "")) return { state: "done", verdict: "rejected", cls: "not_original", reasons: ["not_original"] };
      return { state: "done", verdict: "ok", reasons: [] };
    }
    function settle(d, result) {
      setTimeout(() => {
        if (!d.check || d.check.verdict !== "pending") return;
        Object.assign(d.check, result);
        if (result.verdict === "rejected") {
          d.check.rejects += 1;
          d.check.until = Date.now() + GRACE;
          d.deadline = d.check.until;
          d.check.seenAt = null;
          d.check.onExpiry = "dispute";
          d.check.closeIfSaid = true;
        }
      }, 1500);
    }
    function receiptRows() {
      const row = (d) => ({
        id: d.id,
        status: d.status,
        fiat: d.fiat,
        fiatAmount: d.fiatAmount,
        symbol: d.symbol,
        decimals: d.decimals,
        units: d.units,
        at: d.at,
        verdict: d.check.verdict,
        cls: d.check.cls || null,
        reason: (d.check.reasons || []).map((r) => typeof r === "object" ? r.c : ARB_CODE[r] || r)[0] || "",
        until: d.check.until || null,
        endReason: d.endReason || null,
        appeal: !!d.check.appeal,
        label: d.check.label || null,
        seller: d.seller,
        buyer: d.buyer
      });
      const ARB_CODE = { duplicate: "dup_file", changed: "pdf_edited", amount: "amount_short_small", gap_recipient: "recipient_unverified" };
      const withCheck = deals.filter((d) => d.check);
      const ended = withCheck.filter((d) => d.endReason === "receipt_rejected" || d.dispute && d.dispute.reason === "receipt_rejected");
      return {
        mode: receiptMode,
        envMode: "enforce",
        reader: "none",
        today: { duplicate: 2, forged: 1, not_a_receipt: 1, unreadable: 0, mismatch: 0 },
        profiles: [{ name: "sber_check", title: "\u0421\u0431\u0435\u0440, \u0447\u0435\u043A", n: 1 }],
        groups: {
          grace: withCheck.filter((d) => d.status === "paid" && d.check.verdict === "rejected" && !d.check.override).map(row),
          appeals: withCheck.filter((d) => d.check.appeal && !d.check.appeal.outcome).map(row),
          flagged: withCheck.filter((d) => d.status === "paid" && d.check.verdict === "flagged").map(row),
          auto: ended.map(row),
          shadow: []
        },
        review: ended.filter((d) => !d.check.label).map(row)
      };
    }
    function call(path, body) {
      const [route, query] = path.split("?");
      const q = new URLSearchParams(query || "");
      try {
        let out;
        if (route === "config") out = { ok: true, ...config() };
        else if (route === "ads" && !body) {
          const cents = Number(q.get("amount")) || 0;
          const side = q.get("side"), kind = q.get("kind");
          const rows = ads.filter((row) => row.state === "on" && row.side === side && row.asset === q.get("asset") && !blocks.has(row.owner.pid) && (!cents || cents >= row.min && cents <= row.max) && (!kind || row.methods.some((m) => m.kind === kind)));
          rows.sort((x, y) => side === "sell" ? priceOf(x) - priceOf(y) : priceOf(y) - priceOf(x));
          out = { ok: true, ads: rows.map(adView) };
        } else if (route === "ads") {
          let row = body.id ? myAds.find((one) => one.id === body.id) : null;
          if (body.id && !row) refuse("no_ad");
          if (!row && myAds.filter((one) => one.state !== "off").length >= 10) refuse("too_many");
          const a = assetOf(body.asset) || refuse("bad_asset");
          if (body.price.kind === "fixed" && !(Number(body.price.value) > 0)) refuse("bad_price");
          if (body.price.kind === "market" && !(Math.abs(body.price.pct) <= 50)) refuse("bad_price");
          if (!(Number(body.min) > 0) || !(Number(body.max) >= Number(body.min))) refuse("bad_limits");
          if (!(Number(body.available) > 0)) refuse("bad_available");
          const side = row ? row.side : body.side;
          const picked = side === "sell" ? mine.filter((m) => body.methods.includes(m.id)).slice(0, 5) : body.methods.filter((k) => k === "card" || k === "sbp").map((kind) => ({ kind }));
          if (!picked.length) refuse(side === "sell" ? "no_methods" : "bad_methods");
          const fresh = !row;
          if ((fresh || row.asset !== a.id) && myAds.some((one) => one !== row && one.side === side && one.asset === a.id && one.state !== "off")) refuse("one_per_section");
          if (fresh) {
            row = { id: newId(), side, owner: me, state: side === "sell" ? "funding" : "on" };
            myAds.push(row);
          }
          Object.assign(row, {
            asset: a.id,
            priceKind: body.price.kind,
            pct: body.price.kind === "market" ? body.price.pct : null,
            fixedPrice: body.price.kind === "fixed" ? Number(body.price.value) : null,
            min: Number(body.min),
            max: Number(body.max),
            payMinutes: body.payMinutes,
            methods: picked,
            terms: String(body.terms || "").slice(0, 500),
            confirm: body.confirm === true
          });
          if (fresh || !row.pool) row.available = toUnits(body.available, a.decimals).toString();
          if (fresh && side === "sell") row.pool = poolOf(row);
          out = { ok: true, ad: adView(row) };
        } else if (route === "ads/mine") out = { ok: true, ads: myAds.filter((row) => row.state !== "off").map(adView) };
        else if (route === "ads/state") {
          const row = myAds.find((one) => one.id === body.id) || refuse("no_ad");
          if (row.state === "funding" && body.state !== "off") refuse("not_funded");
          if (body.state === "on" && row.state !== "on" && myAds.some((one) => one !== row && one.side === row.side && one.asset === row.asset && (one.state === "on" || one.state === "funding"))) refuse("one_per_section");
          row.state = body.state;
          out = { ok: true, ad: adView(row) };
        } else if (route === "ads/delete") {
          const row = myAds.find((one) => one.id === body.id && one.state !== "off") || refuse("no_ad");
          if (row.state === "funding" && row.pool && row.pool.depositSent) refuse("deposit_sent");
          row.state = "off";
          out = { ok: true, deleted: true };
        } else if (route === "ads/deposit") {
          const row = myAds.find((one) => one.id === body.id) || refuse("no_ad");
          row.state = "on";
          row.pool = { ...row.pool, funded: true, depositSent: true };
          ads.push(row);
          out = { ok: true, ad: adView(row) };
        } else if (route === "methods" && !body) out = { ok: true, methods: mine.map((m) => ({ id: m.id, kind: m.kind, bank: m.bank, tail: m.tail })) };
        else if (route === "methods") {
          const digits = String(body.value || "").replace(/[\s-]/g, "");
          if (body.kind === "card" ? !/^\d{16,19}$/.test(digits) : !/^\+?\d{10,15}$/.test(digits)) refuse("bad_value");
          if (mine.length >= 10) refuse("too_many");
          mine.push(method(body.kind, body.bank, digits, String(body.holder || "")));
          out = { ok: true, methods: mine.map((m) => ({ id: m.id, kind: m.kind, bank: m.bank, tail: m.tail })) };
        } else if (route === "methods/delete") {
          const i = mine.findIndex((m) => m.id === body.id);
          if (i >= 0) mine.splice(i, 1);
          myAds.forEach((row) => {
            if (row.side === "sell") {
              row.methods = row.methods.filter((m) => m.id !== body.id);
              if (!row.methods.length && row.state === "on") row.state = "paused";
            }
          });
          out = { ok: true, removed: true, methods: mine.map((m) => ({ id: m.id, kind: m.kind, bank: m.bank, tail: m.tail })) };
        } else if (route === "orders") out = order(body);
        else if (route === "deals") out = { ok: true, deals: deals.filter((d) => d.me !== "arbiter").sort((a, b) => b.at - a.at).map((d) => ({ id: d.id, status: d.status, me: d.me, wallet: WALLET, symbol: d.symbol, decimals: d.decimals, units: d.units, fiat: d.fiat, fiatAmount: d.fiatAmount, at: d.at, deadline: d.deadline, other: d.me === "seller" ? d.buyer : d.seller })) };
        else if (route === "deal") out = answer(find(q.get("id")));
        else if (route === "deal/action") out = action(body);
        else if (route === "deal/message") {
          const d = find(body.id);
          const f = body.fileId ? fileFor(d, body.fileId) || refuse("no_file") : null;
          if (!String(body.text || "").trim() && !f) refuse("bad_text");
          d.messages.push(msg("me", 0, body.text || "", f || {}));
          out = answer(d);
        } else if (route === "block") {
          blocks.add(body.pid);
          out = { ok: true, blocks: [...blocks] };
        } else if (route === "arbiter") out = { ok: true, halted: false, disputes: deals.filter((d) => d.dispute).map((d) => ({ id: d.id, status: d.status, seller: d.seller, buyer: d.buyer, receipt: !!d.receipt, messages: d.messages.length, symbol: d.symbol, decimals: d.decimals, units: d.units, fiat: d.fiat, fiatAmount: d.fiatAmount, at: d.dispute.at, by: d.dispute.by })) };
        else if (route === "receipt-check") {
          const c = checkOfFile(q.get("file")) || refuse("no_file");
          const warn = c.verdict === "rejected" && ["not_a_receipt", "unreadable", "not_original"].includes(c.cls);
          out = { ok: true, check: { state: c.state, verdict: warn ? "rejected" : c.state === "done" ? "accepted" : "pending", ...warn ? { cls: c.cls } : {} } };
        } else if (route === "appeal") {
          const d = find(body.id);
          if (d.endReason !== "receipt_rejected" || !d.check || d.check.appeal || !(d.check.appealUntil > Date.now())) refuse("bad_transition");
          if (!String(body.text || "").trim()) refuse("bad_text");
          d.check.appeal = { at: Date.now(), text: String(body.text).slice(0, 1e3), file: body.fileId || null, outcome: null };
          out = answer(d);
        } else if (route === "arbiter/check") {
          const d = find(body.id);
          const c = d.check || refuse("bad_transition");
          if (body.act === "label") c.label = body.label === "right" ? "right" : "wrong";
          else if (d.status !== "paid") refuse("bad_transition");
          else if (body.act === "accept") {
            c.override = { by: "arbiter", at: Date.now(), act: "accept" };
            d.deadline = Math.max(d.deadline || 0, Date.now() + 15 * MIN);
          } else if (body.act === "dispute") {
            d.dispute = { by: "arbiter", at: Date.now(), reason: "receipt_check" };
            move(d, "disputed", "arbiter");
            d.deadline = null;
          } else refuse("bad_transition");
          out = answer(d);
        } else if (route === "arbiter/appeal") {
          const d = find(body.id);
          const c = d.check || refuse("bad_transition");
          if (!c.appeal || c.appeal.outcome) refuse("already_decided");
          if (body.outcome !== "buyer_right" && body.outcome !== "seller_right") refuse("bad_transition");
          c.appeal.outcome = body.outcome;
          c.appeal.note = String(body.note || "").slice(0, 500);
          out = answer(d);
        } else if (route === "arbiter/receipts") out = { ok: true, ...receiptRows() };
        else if (route === "arbiter/receipt-mode") {
          const order2 = ["off", "shadow", "report", "enforce"];
          if (!order2.includes(body.mode) || order2.indexOf(body.mode) > order2.indexOf("enforce")) refuse("bad_transition");
          receiptMode = body.mode;
          out = { ok: true, mode: receiptMode };
        } else if (route === "arbiter/banned") out = { ok: true, people: banned.slice() };
        else if (route === "arbiter/resume") out = { ok: true, resumed: true };
        else if (route === "arbiter/ban") {
          const who = Object.values(people).find((p) => p.pid === body.pid);
          const i = banned.findIndex((p) => p.pid === body.pid);
          if (body.on && who && i < 0) banned.push({ ...who, banned: true });
          if (!body.on && i >= 0) banned.splice(i, 1);
          out = { ok: true };
        } else if (route === "arbiter/resolve") {
          const d = find(body.id);
          if (d.status !== "disputed") refuse("already_decided");
          move(d, toSide[body.to] || refuse("bad_transition"), "arbiter");
          out = answer(d);
        } else refuse("bad_response");
        return later(clone(out));
      } catch (err) {
        return new Promise((resolve, reject) => setTimeout(() => reject(err), 120));
      }
    }
    const uploads =   new Map();
    let upSeq = 0;
    function upload(dealId, file, type, onProgress, purpose) {
      find(dealId);
      upSeq += 1;
      const id = "u" + String(upSeq).padStart(15, "0");
      return new Promise((resolve) => {
        let pct = 0;
        const step = () => {
          pct = Math.min(1, pct + 0.08 + Math.random() * 0.12);
          if (onProgress) onProgress(pct);
          if (pct < 1) return void setTimeout(step, 90);
          uploads.set(id, { deal: dealId, blob: file, type, size: file.size, name: String(file.name || ""), purpose: purpose || "", at: Date.now() });
          resolve(id);
        };
        setTimeout(step, 120);
      });
    }
    function fileFor(d, fileId) {
      const u = uploads.get(String(fileId || ""));
      return u && u.deal === d.id ? { file: fileId, fileType: u.type, fileSize: u.size } : null;
    }
    function fileOf(dealId, fileId) {
      const u = uploads.get(fileId);
      if (u) return Promise.resolve({ url: u.url || (u.url = URL.createObjectURL(u.blob)), type: u.type, size: u.size });
      return picture().then((url) => ({ url, type: "image/svg+xml", size: 0 }));
    }
    function picture() {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" rx="18" fill="#f2f4f7"/><rect x="24" y="28" width="252" height="344" rx="12" fill="#fff"/><text x="150" y="86" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="#1b1f24">\u0427\u0435\u043A (\u043F\u0440\u0438\u043C\u0435\u0440)</text><text x="150" y="150" font-family="sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#1b1f24">\u041F\u0435\u0440\u0435\u0432\u043E\u0434</text><text x="150" y="190" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#7a828c">\u043D\u0435\u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442</text><rect x="54" y="232" width="192" height="10" rx="5" fill="#e3e7ec"/><rect x="54" y="258" width="150" height="10" rx="5" fill="#e3e7ec"/><rect x="54" y="284" width="172" height="10" rx="5" fill="#e3e7ec"/><circle cx="150" cy="334" r="16" fill="#34c759"/></svg>`;
      return Promise.resolve("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
    }
    const click = (sel, wait) => setTimeout(() => {
      const all = document.querySelectorAll(sel);
      const el = all[all.length - 1];
      if (el) el.click();
    }, wait || 700);
    function openScreen(name) {
      const firstAd = (side, asset) => ads.find((row) => row.side === side && row.asset === (asset || "gram") && row.state === "on");
      const screens = {
        deal: () => P.openDeal(D1.id),
        chat: () => {
          P.openDeal(D1.id);
          click(".p2p-sub [data-chat]", 900);
        },
        paid: () => {
          P.openDeal(D1.id);
          click('.p2p-bar [data-act="paid"]', 900);
        },
        seller: () => P.openDeal(D2.id),
        release: () => {
          P.openDeal(D2.id);
          click('.p2p-bar [data-act="release"]', 900);
        },
        dispute: () => P.openDeal(D3.id),
        auto: () => P.openDeal(D4.id),
        done: () => P.openDeal(deals.find((d) => d.status === "released").id),
        cancelled: () => P.openDeal(deals.find((d) => d.status === "cancelled").id),
        deals: () => P.openDeals && P.openDeals(),
        me: () => P.openMe && P.openMe(),
        editor: () => P.openEditor && P.openEditor(null, {}),
        fund: () => P.openFund && P.openFund(adView(own1), () => {
        }),
        details: () => P.openDetailsSheet && P.openDetailsSheet(),
        admin: () => P.openAdmin && P.openAdmin(),
        order: () => P.openAd(adView(firstAd("sell"))),
        sellorder: () => P.openAd(adView(firstAd("buy"))),
        sellcard: () => P.openAd(adView(ads.find((row) => row.side === "buy" && row.state === "on" && row.methods.length === 1 && row.methods[0].kind === "card"))),
        rxbuyer: () => P.openDeal(RX1.id),
        rxseller: () => P.openDeal(RX2.id),
        rxflag: () => P.openDeal(RX3.id),
        rxclosed: () => P.openDeal(RX4.id),
        rxarb: () => P.openDeal(RX5.id),
        rxappeal: () => P.openDeal(RX6.id),
        checks: () => P.openAdmin && P.openAdmin("checks"),
        profile: () => P.openPerson(people.dima, { role: "seller" })
      };
      if (screens[name]) screens[name]();
    }
    return { call, picture, fileOf, upload, wallet: WALLET, openScreen };
  };
})();
