(function () {
  'use strict';
  const { fmt, icon, t: tx } = CK;
  const T = CK.ton;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);

  const CHIPS = { stop: [5, 10, 20], take: [10, 20, 50] };
  const GRAM_DECIMALS = 9;
  const USDT_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const WORST_FLOOR = 90n;
  const GRAM_NEEDED = 400000000n;
  const GAS_ON_ORDER = 320000000n;
  const GAS_DUST = 100000000n;
  const TAKE_FAR = 100n;
  const POLL_MS = 15000;
  const POLL_BUSY_MS = 4000;
  const RESEND_AFTER_MS = 20000;
  const CANCEL_SHOWN_MS = 5 * 60 * 1000;
  const NEAR_STOP_PCT = 3;
  const ENDED_SHOWN = 5;
  const STEPS_MIN_HEIGHT = 400;
  const HIDDEN_KEY = 'ck-orders-hidden';
  const COUNT_KEY = 'ck-orders-count:';
  const ID_FORMAT = /^[0-9a-f]{32}$/;
  const EVENT_FORMAT = /^[\w-]{10,128}$/;
  const EXPLORER = 'https://tonviewer.com/';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { } }
  };
  const gram = () => D.byId.ton.sym;
  const gramOf = (units) => T.fromUnits(units, GRAM_DECIMALS);
  const fieldText = (v) => {
    if (!(v > 0)) return '';
    return v >= 1e9 ? String(Math.round(v)) : D.qty(v).replace(/\s/g, '');
  };
  const sumText = (v) => (v >= 1 ? fmt.num(v, 2) : D.qty(v));
  const worstFloor = (stopOut) => (stopOut * WORST_FLOOR) / 100n;
  const canSign = () => {
    const status = CK.wallet.status;
    return !!T.wallet && !T.wallet.readOnly && !status.lost && !status.bioUnknown;
  };
  const priceOf = (out, units, decimals) => {
    const amount = T.fromUnits(units, decimals);
    return amount > 0 ? gramOf(out) / amount : 0;
  };
  const isUsdt = (offer) => offer === USDT_RAW;
  const kindName = (kind, offer) => (isUsdt(offer) ? tx(kind === 'stop' ? 'orders.buyHigher' : 'orders.buyLower', { sym: gram() }) : tx(`orders.${kind}`));
  const unitOf = (offer) => (isUsdt(offer) ? D.byId.usdt.sym : gram());
  const shownPrice = (out, units, decimals, offer) => {
    if (!isUsdt(offer)) return priceOf(out, units, decimals);
    const got = gramOf(out);
    return got > 0 ? T.fromUnits(units, decimals) / got : 0;
  };
  const outAt = (price, units, decimals, offer) => {
    const scaled = T.toUnits(price, 18);
    if (!isUsdt(offer)) return (scaled * units) / 10n ** BigInt(18 - GRAM_DECIMALS + decimals);
    return scaled > 0n ? (units * 10n ** BigInt(18 + GRAM_DECIMALS - decimals)) / scaled : 0n;
  };
  const unitUsd = (offer) => {
    const coin = isUsdt(offer) ? D.byId.usdt : D.byId.ton;
    return coin && coin.priced === true && coin.price > 0 ? coin.price : 0;
  };
  const approxText = (price, offer) => {
    const usd = unitUsd(offer);
    if (!(price > 0) || !(usd > 0)) return '';
    const shown = fmt.shown(price * usd);
    if (!(shown > 0) || !Number.isFinite(shown)) return '';
    const digits = shown >= 1 ? 2 : Math.min(10, Math.ceil(-Math.log10(shown)) + 1);
    return tx('orders.approx', { sum: fmt.money(fmt.num(shown, digits)) });
  };

  const TROUBLES = {
    order_refused: 'orderErr.refused', no_free_slot: 'orderErr.noSlot', subwallet_busy: 'orderErr.noSlot', slot_busy: 'orderErr.noSlot',
    no_main_gas: 'orderErr.noMainGas', pool_cap: 'orderErr.poolCap', no_second_price: 'orderErr.noPrice', price_disagrees: 'orderErr.noPrice', pool_unsupported: 'orderErr.noPool', no_gram_pool: 'orderErr.noPool', router_unknown: 'orderErr.noPool', no_liquidity: 'orderErr.noPool', no_price: 'orderErr.noPool', pool_locked: 'orderErr.noPool',
    router_changing: 'orderErr.routerChanging', order_token_closed: 'orderErr.noToken', order_token_unlisted: 'orderErr.noToken', order_too_small: 'orderErr.noToken', order_gas: 'orderErr.noToken', stop_above_price: 'orders.stopAbove', take_below_price: 'orders.takeBelow', orders_off: 'orders.off',
    order_busy: 'orderErr.busy', order_moved: 'orderErr.busy', route_changed: 'orderErr.noPool',
    over_limit: 'swap.quoteLimit', token_suspicious: 'swap.refusedToken', impact_over_limit: 'swap.impactTooHigh', insufficient_gas: 'swap.noGasShort', insufficient_balance: 'order.notHeld',
    frozen: 'swapSheet.frozen', pending: 'swapSheet.pendingLock', busy: 'swapSheet.pendingLock', biometric_denied: 'swapSheet.bioDenied', biometric_lost: 'swapSheet.bioLost', no_secret: 'swapSheet.noSign', no_secure_storage: 'swapSheet.noSign', password_needed: 'swapSheet.noSign', biometric_unknown: 'wallet.bioWait', storage_failed: 'swapSheet.noSign', bad_boc: 'swapSheet.rejected', bad_request: 'swapSheet.rejected'
  };
  const reasonOf = (err) => (err && (err.code || err.message)) || '';
  function troubleOf(err) {
    const key = TROUBLES[reasonOf(err)];
    return key ? { key, block: true } : { key: 'swapSheet.tryAgain' };
  }

  const CHECK_KEEP_MS = 60000;
  const CHECK_RETRY_MS = 15000;
  const OK_TRUST_MS = 5 * 60 * 1000;
  const OWN_SHORTAGE = new Set(['insufficient_balance', 'insufficient_gas']);
  const TOKEN_NO = new Set(['order_token_unlisted', 'order_too_small', 'no_gram_pool', 'router_unknown', 'pool_unsupported', 'no_liquidity', 'order_gas', 'token_suspicious']);
  const NO_KEY = 'ck-order-token-no';
  const NO_KEEP_MS = 24 * 60 * 60 * 1000;
  const NO_MOST = 400;
  let noList = null;
  function noRows() {
    if (noList) return noList;
    noList = {};
    try {
      const rows = JSON.parse(store.get(NO_KEY) || '{}');
      const now = Date.now();
      Object.keys(rows && typeof rows === 'object' && !Array.isArray(rows) ? rows : {}).slice(0, NO_MOST).forEach((raw) => {
        const row = rows[raw];
        if (Array.isArray(row) && TOKEN_NO.has(row[0]) && Number.isFinite(row[1]) && row[1] <= now && now - row[1] < NO_KEEP_MS) noList[raw] = [row[0], row[1]];
      });
    } catch (_) { }
    return noList;
  }
  const saveNo = () => {
    try { store.set(NO_KEY, JSON.stringify(noList)); } catch (_) { }
  };
  function keepNo(raw, reason) {
    const rows = noRows();
    const now = Date.now();
    Object.keys(rows).forEach((key) => { if (now - rows[key][1] >= NO_KEEP_MS) delete rows[key]; });
    if (!rows[raw] && Object.keys(rows).length >= NO_MOST) return;
    rows[raw] = [reason, now];
    saveNo();
  }
  function dropNo(raw) {
    const rows = noRows();
    if (!rows[raw]) return;
    delete rows[raw];
    saveNo();
  }
  function refused(raw) {
    const row = raw ? noRows()[raw] : null;
    return row && Date.now() - row[1] < NO_KEEP_MS ? row[0] : '';
  }
  const checks = new Map();
  const checkKey = (raw) => `${T.wallet ? T.wallet.address : ''}|${raw}`;
  function checked(raw) {
    const kept = checks.get(checkKey(raw));
    return kept && kept.answer && Date.now() - kept.at < CHECK_KEEP_MS ? kept.answer : null;
  }
  function okLately(raw) {
    const kept = checks.get(checkKey(raw));
    return kept && kept.ok && Date.now() - kept.ok.at < OK_TRUST_MS ? kept.ok.answer : null;
  }
  function check(raw, units) {
    if (!T.wallet || !raw || CK.swapAudit.orderable(raw) || !CK.swapAudit.orderOffer(raw)) return Promise.resolve(null);
    const key = checkKey(raw);
    const kept = checks.get(key);
    if (kept && kept.job) return kept.job;
    if (kept && Date.now() - kept.at < (kept.answer ? CHECK_KEEP_MS : CHECK_RETRY_MS)) return Promise.resolve(kept.answer);
    const one = { at: Date.now(), answer: null, job: null, ok: kept ? kept.ok : null };
    const base = `orders/check?offer=${encodeURIComponent(raw)}&wallet=${encodeURIComponent(T.wallet.address)}`;
    const ask = (alone) => T.api(alone ? `${base}&held=0` : `${base}&units=${units}`).then((body) => {
      const most = T.parseUnits(String(body.maxUnits));
      const out = body.maxOut === undefined || body.maxOut === null ? null : T.parseUnits(String(body.maxOut));
      one.answer = most && most > 0n ? { ok: true, maxUnits: most, maxOut: out && out > 0n ? out : null } : { ok: false, reason: 'pool_cap' };
      if (one.answer.ok) dropNo(raw);
    }, (err) => {
      const reason = err && err.detail && err.detail.error;
      if (OWN_SHORTAGE.has(reason)) return alone ? undefined : ask(true);
      if (!reason || reason === 'upstream' || reason === 'rate_limited') return undefined;
      one.answer = { ok: false, reason };
      if (!TOKEN_NO.has(reason)) return undefined;
      if (alone) {
        keepNo(raw, reason);
        return undefined;
      }
      return T.api(`${base}&held=0`).then(() => undefined, (again) => {
        const alike = again && again.detail && again.detail.error;
        if (TOKEN_NO.has(alike)) keepNo(raw, alike);
      });
    });
    one.job = Promise.resolve().then(() => ask(typeof units !== 'bigint' || units <= 0n)).catch(() => {}).then(() => {
      one.at = Date.now();
      one.job = null;
      if (one.answer) one.ok = one.answer.ok ? { at: one.at, answer: one.answer } : null;
      return one.answer;
    });
    checks.set(key, one);
    return one.job;
  }
  const canPlace = (raw) => CK.swapAudit.orderable(raw) || (CK.swapAudit.orderOffer(raw) && !!(checked(raw) || {}).ok);
  const asked = (raw) => !!raw && CK.swapAudit.orderOffer(raw) && !CK.swapAudit.orderable(raw);
  const capOf = (raw) => {
    const answer = checked(raw) || okLately(raw);
    return answer && answer.ok ? answer.maxUnits : null;
  };
  const maxOutOf = (raw) => {
    const answer = checked(raw) || okLately(raw);
    return answer && answer.ok ? answer.maxOut : null;
  };

  const X_SOL = 'solana';
  const X_NATIVE = '0x0000000000000000000000000000000000000000';
  const X_ID = /^[A-Za-z0-9_-]{1,64}$/;
  const X_EVM_TOKEN = /^0x[0-9a-f]{40}$/;
  const X_MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const X_COIN = { eth: 'ETH', base: 'ETH', arbitrum: 'ETH', bsc: 'BNB', polygon: 'POL', optimism: 'ETH', avalanche: 'AVAX', ink: 'ETH', monad: 'MON', unichain: 'ETH', solana: 'SOL' };
  const X_USDC_DECIMALS = { eth: 6, base: 6, arbitrum: 6, bsc: 18, polygon: 6, optimism: 6, avalanche: 6, ink: 6, monad: 6, unichain: 6, solana: 6 };
  const X_FEE_BPS = 100;
  const X_FLOORS_BPS = [9800, 9650, 9500];
  const X_WHYS = new Set(['clear', 'fast_fall', 'none_clear', 'take', 'one_node', 'simulated', 'escalate', 'next_floor']);
  const X_OPEN = new Set(['funding', 'arming', 'active', 'firing', 'returning', 'cancelling', 'replacing', 'stale']);
  const X_ENDED = new Set(['filled', 'missed', 'expired', 'returned', 'retired', 'unwound', 'feeRaised', 'notPlaced', 'landed', 'stuck', 'ended']);
  const X_LEFT = new Set(['landed', 'stuck']);
  const X_HOLDS = new Set(['arming', 'active', 'stale', 'firing', 'replacing', 'cancelling', 'returning', 'landed', 'stuck']);
  const xLib = (family) => {
    const lib = family === 'evm' ? CK.evmOrders : family === 'sol' ? CK.solOrders : null;
    return lib && typeof lib === 'object' ? lib : null;
  };
  function xOpen(family) {
    const lib = xLib(family);
    try {
      return !!lib && typeof lib.open === 'function' && lib.open() === true;
    } catch (_) {
      return false;
    }
  }
  const xAnyOpen = () => xOpen('evm') || xOpen('sol');
  let xEvmKeys = null;
  function xFamily(chain) {
    if (chain === X_SOL) return 'sol';
    if (!xEvmKeys) {
      try {
        xEvmKeys = new Set(CK.evmOrders.pins().chains.map((one) => one.key));
      } catch (_) {
        return null;
      }
    }
    return typeof chain === 'string' && xEvmKeys.has(chain) ? 'evm' : null;
  }
  const xOutKeys = (family) => (family === 'sol' ? ['usdc', 'usdt', 'sol'] : ['usdc', 'coin']);
  function xOutOf(chain, key) {
    if (key === 'usdc' && X_USDC_DECIMALS[chain] !== undefined) return { key, sym: 'USDC', decimals: X_USDC_DECIMALS[chain], dollar: true };
    if (key === 'usdt' && chain === X_SOL) return { key, sym: 'USDT', decimals: 6, dollar: true };
    if (key === 'sol' && chain === X_SOL) return { key, sym: 'SOL', decimals: 9, dollar: false };
    if (key === 'coin' && chain !== X_SOL && X_COIN[chain]) return { key, sym: X_COIN[chain], decimals: 18, dollar: false };
    return null;
  }
  function xOutUsd(chain, out) {
    if (!out) return 0;
    if (out.dollar) return 1;
    const net = window.DemoNets && typeof DemoNets.chains === 'function' ? DemoNets.chains().find((one) => one.key === chain) : null;
    const coin = net ? net.inst : null;
    return coin && coin.price > 0 && (coin.priced === true || coin.isToken) ? coin.price : 0;
  }
  function xNetName(chain) {
    const net = window.DemoNets && typeof DemoNets.chains === 'function' ? DemoNets.chains().find((one) => one.key === chain) : null;
    return net && net.name ? net.name : chain === X_SOL ? 'Solana' : String(chain || '');
  }
  const xPriceOf = (out, units, decimals, outDecimals) => {
    const amount = T.fromUnits(units, decimals);
    return amount > 0 ? T.fromUnits(out, outDecimals) / amount : 0;
  };
  function xOutAt(price, units, decimals, outDecimals) {
    if (!(price > 0) || !Number.isFinite(price) || typeof units !== 'bigint' || units <= 0n) return 0n;
    const [mantissa, exponent] = price.toExponential(15).split('e');
    const digits = BigInt(mantissa.replace('.', ''));
    const shift = Number(exponent) - 15 + outDecimals - decimals;
    return shift >= 0 ? digits * units * 10n ** BigInt(shift) : (digits * units) / 10n ** BigInt(-shift);
  }
  const xApprox = (price, usd) => {
    if (!(price > 0) || !(usd > 0)) return '';
    const shown = fmt.shown(price * usd);
    if (!(shown > 0) || !Number.isFinite(shown)) return '';
    const digits = shown >= 1 ? 2 : Math.min(10, Math.ceil(-Math.log10(shown)) + 1);
    return tx('orders.approx', { sum: fmt.money(fmt.num(shown, digits)) });
  };
  function xFloors(family, stopOut) {
    const lib = xLib(family);
    try {
      const floors = lib && typeof lib.floorsOf === 'function' ? lib.floorsOf(stopOut) : null;
      if (Array.isArray(floors) && floors.length === 3 && floors.every((v) => typeof v === 'bigint')) return floors;
    } catch (_) { }
    return X_FLOORS_BPS.map((bps) => (stopOut * BigInt(bps)) / 10000n);
  }
  const xWorst = (o, out) => {
    const floors = typeof o.floors === 'function' ? o.floors(out) : null;
    return Array.isArray(floors) && floors.length ? floors[floors.length - 1] : (out * BigInt(X_FLOORS_BPS[2])) / 10000n;
  };

  const X_TROUBLES = {
    xorder_no_pool: 'xorderErr.noPool', xorder_taxed: 'xorderErr.taxed', xorder_blocked: 'xorderErr.blocked', xorder_rebasing: 'xorderErr.rebasing', xorder_stable: 'xorderErr.stable',
    xorder_too_big: 'xorderErr.tooBig', xorder_pool_cap: 'xorderErr.poolCap', xorder_full: 'xorderErr.full', xorder_no_gas: 'xorderErr.noGas', xorder_gas_small: 'xorderErr.gasSmall',
    xorder_too_small: 'xorderErr.gasSmall', xorder_no_slot: 'xorderErr.noSlot', xorder_closed: 'xorderErr.closed', xorder_fee_unset: 'xorderErr.feeUnset', xorder_main_busy: 'xorderErr.mainBusy',
    sol_order_mint: 'xorderErr.mint', sol_order_no_pool: 'xorderErr.solNoPool', sol_order_no_sol: 'xorderErr.noSol',
    xorder_price: 'xorderErr.price', stop_above_price: 'orders.stopAbove', take_below_price: 'orders.takeBelow', price_disagrees: 'xorderErr.priceDisagrees',
    xorder_rows: 'xorderErr.rows', order_mismatch: 'xorderErr.rows', quote_invalid: 'xorderErr.quoteInvalid', setup_unseen: 'xorderErr.setupUnseen', setup_failed: 'xorderErr.setupFailed',
    order_busy: 'orderErr.busy', route_stale: 'xorderErr.routeStale', jupiter_busy: 'xorderErr.routeBusy', rpc_busy: 'xorderErr.netBusy', rate_limited: 'xorderErr.netBusy',
    bad_tx: 'xorderErr.badTx', send_rejected: 'xorderErr.badTx', send_stale: 'xorderErr.badTx', rpc_refused: 'xorderErr.badTx', not_found: 'xorderErr.notFound', quote_stale: 'xorderErr.stale',
    state_unknown: 'xorderErr.noAnswer', server_unknown: 'xorderErr.noAnswer', bundle_failed: 'xorderErr.noAnswer', storage_timeout: 'xorderErr.noAnswer', send_unsure: 'xorderErr.unsure',
    order_refused: 'orderErr.refused', no_evm_address: 'xorderErr.noAddress', no_sol_address: 'xorderErr.noAddress', no_gas: 'xorderErr.orderGas',
    pending: 'swapSheet.pendingLock', busy: 'swapSheet.pendingLock', bad_intent: 'swapSheet.stopped', wallet_changed: 'swapSheet.stopped', address_mismatch: 'swapSheet.stopped',
    read_only: 'swapSheet.noSign', no_wallet: 'swapSheet.noSign', storage_failed: 'swapSheet.noSign', insufficient_balance: 'order.notHeld', bad_request: 'swapSheet.rejected'
  };
  const X_TOKEN_NO = new Set(['xorder_no_pool', 'xorder_taxed', 'xorder_blocked', 'xorder_rebasing', 'xorder_stable', 'sol_order_mint', 'sol_order_no_pool']);
  const X_CLOSED = new Set(['xorder_closed', 'xorder_fee_unset']);
  const X_GAS = new Set(['xorder_no_gas', 'sol_order_no_sol']);
  const X_ORDER_MOVED = new Set(['state', 'moved', 'ended', 'order']);
  const X_UNSURE = new Set(['state_unknown', 'server_unknown', 'send_unsure']);
  function xTrouble(err, ctx) {
    const c = ctx || {};
    const code = reasonOf(err);
    const detail = err && err.detail && typeof err.detail === 'object' ? err.detail : {};
    const reason = err && typeof err.reason === 'string' ? err.reason : typeof detail.reason === 'string' ? detail.reason : '';
    const usdOf = (name) => {
      const v = detail[name] !== undefined ? detail[name] : c[name];
      return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
    };
    const short = err && typeof err.needs === 'bigint' ? err.needs - (typeof err.have === 'bigint' ? err.have : 0n) : null;
    let key = X_TROUBLES[code] || TROUBLES[code] || null;
    let params = null;
    if (c.placing && err && typeof err.setup === 'string' && !err.orderId) key = 'xorderErr.setupBack';
    else if (c.placing && X_UNSURE.has(code)) key = 'xorderErr.placeUnsure';
    else if (c.step && (code === 'xorder_rows' || code === 'order_mismatch')) key = 'xorderErr.rowsEdit';
    else if (code === 'xorder_closed' && X_ORDER_MOVED.has(reason)) key = 'xorderErr.orderMoved';
    else if (code === 'no_gas' && c.family === 'sol') {
      key = typeof err.needs === 'bigint' && err.needs > 0n ? 'xorderErr.solMainGasSum' : 'xorderErr.solMainGas';
      if (key === 'xorderErr.solMainGasSum') params = { sum: `${D.qty(T.fromUnits(err.needs, 9))} SOL` };
    } else if (code === 'xorder_closed' && reason === 'no_read') key = 'xorderErr.noRead';
    else if (code === 'xorder_closed' && (reason === 'fee_unset' || reason === 'fee_unconfirmed')) key = 'xorderErr.feeUnset';
    else if (code === 'xorder_no_pool' && reason === 'usdc_leg') {
      key = 'xorderErr.noUsdc';
      params = { sym: c.coin || '' };
    } else if (code === 'xorder_too_big' && usdOf('maxUsd')) {
      key = 'xorderErr.tooBigTo';
      params = { sum: fmt.usd(usdOf('maxUsd')) };
    } else if (((code === 'xorder_gas_small' && reason === 'min_usd') || code === 'xorder_too_small') && usdOf('minUsd')) {
      key = 'xorderErr.minUsd';
      params = { sum: fmt.usd(usdOf('minUsd')) };
    } else if (code === 'xorder_no_gas' && (reason === 'bump' || reason === 'order')) key = 'xorderErr.orderGas';
    else if (code === 'xorder_no_gas' && short !== null && short > 0n && c.gas) {
      key = 'xorderErr.noGasSum';
      params = { sum: `${D.qty(T.fromUnits(short, c.gas.decimals))} ${c.gas.sym}` };
    } else if (code === 'sol_order_no_sol' && short !== null && short > 0n) {
      key = 'xorderErr.noSolSum';
      params = { sum: `${D.qty(T.fromUnits(short, 9))} SOL` };
    } else if (code === 'xorder_price') key = reason === 'take_below_price' ? 'orders.takeBelow' : reason === 'stop_above_price' ? 'orders.stopAbove' : 'xorderErr.price';
    else if (code === 'order_refused' && reason === 'prices') key = 'orders.pricesAgain';
    else if (code === 'bad_intent' && reason === 'live') key = 'xorderErr.gasLive';
    else if (code === 'bad_intent' && reason === 'tokens') key = 'xorderErr.gasTokens';
    const kind = X_TOKEN_NO.has(code) && !(code === 'xorder_no_pool' && reason === 'usdc_leg') ? 'token'
      : X_CLOSED.has(code) && reason !== 'no_read' && !X_ORDER_MOVED.has(reason) ? 'closed' : X_GAS.has(code) && reason !== 'bump' && reason !== 'order' ? 'gas' : '';
    const gap = kind === 'gas' && short !== null && short > 0n ? short : null;
    return key ? { key, params, block: true, kind, code, short: gap } : { key: 'swapSheet.tryAgain', params: null, block: false, kind: '', code, short: null };
  }

  const xChecks = new Map();
  const xCheckKey = (chain, token) => `${T.wallet ? T.wallet.address : ''}|${chain}|${token}`;
  function xCheck(chain, token) {
    const family = xFamily(chain);
    if (!family || !xOpen(family) || !T.wallet || typeof token !== 'string' || !token) return Promise.resolve(null);
    const key = xCheckKey(chain, token);
    const kept = xChecks.get(key);
    if (kept && kept.job) return kept.job;
    if (kept && Date.now() - kept.at < (kept.answer ? CHECK_KEEP_MS : CHECK_RETRY_MS)) return Promise.resolve(kept.answer);
    const one = { at: Date.now(), answer: null, job: null };
    const path = family === 'evm' ? `xorders/check?chain=${encodeURIComponent(chain)}&token=${encodeURIComponent(token)}` : 'sol-orders/check';
    const usd = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
    one.job = Promise.resolve().then(() => T.api(path)).then((body) => {
      const caps = family === 'evm' ? body : (body && body.caps) || {};
      const outs = family === 'evm' ? (Array.isArray(body.outs) ? body.outs : []).filter((out) => !!xOutOf(chain, out)) : xOutKeys('sol');
      const yes = family === 'evm' ? body.available === true : body.open === true;
      one.answer = yes && outs.length ? { ok: true, outs, maxUsd: usd(family === 'evm' ? caps.maxUsd : caps.perOrderUsd), minUsd: usd(family === 'evm' ? caps.minUsd : caps.minOrderUsd) } : { ok: false, code: 'xorder_no_pool', reason: '' };
    }, (err) => {
      const detail = err && err.detail;
      const code = detail && typeof detail.error === 'string' ? detail.error : '';
      if (!code || code === 'upstream' || code === 'rate_limited') return;
      one.answer = { ok: false, code, reason: typeof detail.reason === 'string' ? detail.reason : '', maxUsd: usd(detail.maxUsd), minUsd: usd(detail.minUsd) };
    }).catch(() => {}).then(() => {
      one.at = Date.now();
      one.job = null;
      return one.answer;
    });
    xChecks.set(key, one);
    return one.job;
  }
  function xAnswer(chain, token) {
    const kept = xChecks.get(xCheckKey(chain, token));
    return kept && kept.answer && Date.now() - kept.at < CHECK_KEEP_MS ? kept.answer : null;
  }
  function xRefused(chain, token, err) {
    const code = reasonOf(err);
    if (!X_TOKEN_NO.has(code) && !X_CLOSED.has(code)) return;
    xChecks.set(xCheckKey(chain, token), { at: Date.now(), answer: { ok: false, code, reason: (err && err.reason) || '' }, job: null });
  }
  function xPlace(chain, intent, options, onStep) {
    const family = xFamily(chain);
    const lib = xLib(family);
    if (!lib || !xOpen(family)) return Promise.reject(Object.assign(new Error('xorder_closed'), { code: 'xorder_closed' }));
    const done = family === 'evm'
      ? lib.place({ chain, token: intent.token, units: intent.units, out: intent.out, stopOut: intent.stopOut || null, takeOut: intent.takeOut || null }, options)
      : lib.place({ mint: intent.token, units: intent.units, out: intent.out, stopOut: intent.stopOut, takeOut: intent.takeOut || null }, options, onStep);
    const wallet = T.wallet ? T.wallet.address : null;
    const signed = (id) => {
      if (family === 'sol') xSolSigned(id, { mint: intent.token, units: intent.units, out: intent.out, stopOut: intent.stopOut, takeOut: intent.takeOut || null });
    };
    return Promise.resolve(done).then((placed) => {
      signed(placed && placed.orderId);
      xSeen(wallet);
      setTimeout(() => { xRefresh(); }, 0);
      return placed;
    }, (err) => {
      if (err && typeof err.orderId === 'string' && X_ID.test(err.orderId)) {
        signed(err.orderId);
        xSeen(wallet);
        setTimeout(() => { xRefresh(); }, 0);
      }
      xRefused(chain, intent.token, err);
      throw err;
    });
  }
  const X_RESEND_MS = 60 * 1000;
  const X_RESEND_EVERY_MS = 8000;
  function xResendSetup(err) {
    if (!err || typeof err.raw !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(err.raw) || err.raw.length > 2000) return;
    if (err.code === 'send_rejected' || err.code === 'bad_tx') return;
    const raw = err.raw, id = err.orderId, until = Date.now() + X_RESEND_MS;
    const again = () => {
      const now = xorders.find((one) => one.id === id);
      if (Date.now() > until || (now && now.state !== 'funding')) return;
      Promise.resolve().then(() => T.api('xchain/sol/send', { body: { raw, move: true } })).then(() => 'stop', (e) => {
        const code = e && e.detail && e.detail.error;
        return code === 'send_rejected' || code === 'bad_tx' ? 'stop' : null;
      }).then((stop) => {
        if (stop !== 'stop') setTimeout(again, X_RESEND_EVERY_MS);
      });
    };
    setTimeout(again, 0);
  }
  function xQuote(chain, intent) {
    const lib = xLib('sol');
    if (xFamily(chain) !== 'sol' || !lib || !xOpen('sol') || typeof lib.quote !== 'function') return Promise.resolve(null);
    return Promise.resolve().then(() => lib.quote({ mint: intent.token, units: intent.units, out: intent.out, stopOut: intent.stopOut, takeOut: intent.takeOut || null }))
      .then((answer) => (answer && answer.view ? answer.view : null), (err) => {
        xRefused(chain, intent.token, err);
        throw err;
      });
  }

  function attach(host, o) {
    const newKind = () => ({ pct: null, typed: null, anchor: null, x: 0, anim: null });
    const kinds = { stop: newKind(), take: newKind() };
    const offer = o.token.id;
    const xo = typeof o.out === 'function' ? o.out : null;
    const unitNow = () => (xo ? xo().sym : unitOf(offer));
    const priceAt = (out, amount) => (xo ? xPriceOf(out, amount, o.decimals(), xo().decimals) : shownPrice(out, amount, o.decimals(), offer));
    const outFor = (price, amount) => (xo ? xOutAt(price, amount, o.decimals(), xo().decimals) : outAt(price, amount, o.decimals(), offer));
    const approxOf = (price) => (xo ? xApprox(price, xo().usd()) : approxText(price, offer));
    const rowHtml = (kind) => {
      const falls = isUsdt(offer) ? kind === 'take' : kind === 'stop';
      const sign = falls ? '−' : '+';
      const name = kindName(kind, offer);
      const unit = CK.esc ? CK.esc(unitNow()) : unitNow();
      return `
        <div class="or-row" data-kind="${kind}">
          <span class="or-cap"><span class="or-name">${name}</span><span class="or-usd"></span></span>
          <div class="or-ctl">
            <div class="or-chips" role="group" aria-label="${name}"><i class="or-thumb"></i>${CHIPS[kind].map((pct) => `<button class="or-chip" type="button" aria-pressed="false" data-pct="${pct}">${sign}${pct}%</button>`).join('')}</div>
            <span class="or-box"><input class="or-field" inputmode="decimal" autocomplete="off" placeholder="${tx('orders.price')}, ${unit}" aria-label="${name}, ${tx('orders.price')}, ${unit}"><i class="or-unit">${unit}</i></span>
          </div>
        </div>`;
    };
    host.innerHTML = rowHtml('stop') + rowHtml('take');
    if (window.DemoWallet) host.querySelectorAll('.or-field').forEach((field) => DemoWallet.amountField(field));
    let off = xo ? false : !CK.swapAudit.orderOffer(o.token.id);
    let waiting = false;
    const paintOff = () => {
      const none = off || waiting || (!!o.held && o.held() === 0n);
      host.classList.toggle('is-off', none);
      host.querySelectorAll('.or-chip, .or-field').forEach((el) => { el.disabled = none; });
    };
    paintOff();
    const now = CK.el('<b class="or-now" hidden><span class="or-now-main"><span class="or-now-num"></span><span class="or-now-sym"></span></span><span class="or-now-val"></span></b>');
    o.term.appendChild(now);
    let wasOn = false;

    const units = () => o.units();
    const isSet = (kind) => kinds[kind].pct !== null || kinds[kind].typed !== null;
    const livePriceOf = (coin) => (coin && coin.price > 0 && (coin.isToken || coin.priced === true) ? coin.price : 0);
    const marketNow = () => {
      if (xo) return typeof o.market === 'function' ? o.market() : 0;
      const gramUsd = livePriceOf(D.byId.ton);
      if (isUsdt(offer)) return gramUsd > 0 && livePriceOf(D.byId.usdt) > 0 ? gramUsd / livePriceOf(D.byId.usdt) : 0;
      const inst = o.token.inst || (typeof D.coinOfAddress === 'function' ? D.coinOfAddress(offer) : null);
      return gramUsd > 0 && livePriceOf(inst) > 0 ? livePriceOf(inst) / gramUsd : 0;
    };
    function outOf(kind) {
      const k = kinds[kind];
      const amount = units();
      if (amount <= 0n) return null;
      if (k.typed !== null) return outFor(k.typed, amount);
      if (k.pct === null) return null;
      if (k.anchor && k.anchor.units === amount) return k.anchor.out;
      const q = o.quote();
      if (!q) return null;
      const pct = BigInt(k.pct);
      const out = isUsdt(offer)
        ? (q.expectedOut * 100n) / (kind === 'stop' ? 100n + pct : 100n - pct)
        : (q.expectedOut * (kind === 'stop' ? 100n - pct : 100n + pct)) / 100n;
      k.anchor = { units: amount, out };
      return out;
    }
    function moveThumb(kind, i, animate) {
      const k = kinds[kind];
      const thumb = $(`.or-row[data-kind="${kind}"] .or-thumb`, host);
      if (k.anim) k.anim.stop();
      k.anim = null;
      const write = (v) => {
        k.x = v;
        thumb.style.transform = `translate3d(${(v * 100).toFixed(2)}%,0,0)`;
      };
      if (!animate) {
        write(i);
        return;
      }
      k.anim = CK.flight({
        from: k.x, to: i, precision: .002, ...CK.springs.settle,
        tracks: [[thumb, (v) => ({ transform: `translate3d(${(v * 100).toFixed(2)}%,0,0)` })]],
        onUpdate: write,
        onDone() { k.anim = null; }
      });
    }
    function paintChips(kind) {
      const k = kinds[kind];
      const row = $(`.or-row[data-kind="${kind}"]`, host);
      const thumb = $('.or-thumb', row);
      const wasShown = thumb.classList.contains('is-on');
      row.querySelectorAll('.or-chip').forEach((chip) => chip.setAttribute('aria-pressed', String(Number(chip.dataset.pct) === k.pct)));
      thumb.classList.toggle('is-on', k.pct !== null);
      if (k.pct !== null) moveThumb(kind, CHIPS[kind].indexOf(k.pct), wasShown);
    }

    host.addEventListener('click', (e) => {
      const chip = e.target.closest('.or-chip');
      if (!chip) return;
      const focused = document.activeElement;
      if (focused && focused.classList.contains('or-field')) focused.blur();
      const kind = chip.closest('.or-row').dataset.kind;
      const k = kinds[kind];
      const pct = Number(chip.dataset.pct);
      CK.haptic.selection();
      k.typed = null;
      k.anchor = null;
      k.pct = k.pct === pct ? null : pct;
      paintChips(kind);
      $(`.or-row[data-kind="${kind}"] .or-field`, host).value = '';
      o.onChange();
    });
    host.addEventListener('input', (e) => {
      if (!e.target.classList.contains('or-field')) return;
      const kind = e.target.closest('.or-row').dataset.kind;
      const k = kinds[kind];
      const value = fmt.parse(e.target.value);
      k.pct = null;
      k.anchor = null;
      k.typed = value > 0 ? value : null;
      paintChips(kind);
      o.onChange();
    });
    host.addEventListener('focusout', (e) => {
      if (!e.target.classList.contains('or-field')) return;
      const k = kinds[e.target.closest('.or-row').dataset.kind];
      if (k.typed !== null) e.target.value = fieldText(k.typed);
      else if (k.pct === null) e.target.value = '';
    });
    host.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('or-field')) e.target.blur();
    });

    return {
      turnOff() {
        off = true;
        ['stop', 'take'].forEach((kind) => {
          kinds[kind] = newKind();
          $(`.or-row[data-kind="${kind}"] .or-field`, host).value = '';
          paintChips(kind);
        });
        paintOff();
      },
      unavailable: () => off,
      hold(on) {
        waiting = !!on;
        paintOff();
      },
      waiting: () => waiting,
      active: () => isSet('stop') || isSet('take'),
      call() {
        const box = host.closest ? host.closest('.sheet-body') : null;
        if (box && box.scrollHeight > box.clientHeight && host.getBoundingClientRect) {
          const below = host.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
          if (below > 0) box.scrollTop += below + 8;
        }
        host.classList.add('is-called');
      },
      paint() {
        const on = isSet('stop') || isSet('take');
        const amount = units();
        ['stop', 'take'].forEach((kind) => {
          const k = kinds[kind];
          if (k.pct === null) return;
          const out = outOf(kind);
          const field = $(`.or-row[data-kind="${kind}"] .or-field`, host);
          if (out !== null) {
            const text = fieldText(priceAt(out, amount));
            if (field.value !== text) field.value = text;
          }
        });
        paintOff();
        if (host.classList.contains('is-off') && (isSet('stop') || isSet('take'))) {
          ['stop', 'take'].forEach((kind) => {
            kinds[kind] = newKind();
            $(`.or-row[data-kind="${kind}"] .or-field`, host).value = '';
            paintChips(kind);
          });
        }
        const shown = (kind) => !!$(`.or-row[data-kind="${kind}"] .or-field`, host).value;
        ['stop', 'take'].forEach((kind) => {
          $(`.or-row[data-kind="${kind}"]`, host).classList.toggle('has-price', shown(kind));
          const k = kinds[kind];
          const out = k.typed === null ? outOf(kind) : null;
          const price = k.typed !== null ? k.typed : out !== null ? priceAt(out, amount) : 0;
          const usd = $(`.or-row[data-kind="${kind}"] .or-usd`, host);
          const text = shown(kind) ? approxOf(price) : '';
          if (usd.textContent !== text) usd.textContent = text;
        });
        if (o.termFixed && !wasOn) {
          wasOn = true;
          o.term.hidden = false;
          now.hidden = false;
        } else if (!o.termFixed && on !== wasOn) {
          wasOn = on;
          o.term.hidden = !on;
          now.hidden = !on;
        }
        if (on || o.termFixed) {
          const q = o.quote();
          const val = $('.or-now-val', now);
          if (q && amount > 0n) {
            const price = priceAt(q.expectedOut, amount);
            CK.roll($('.or-now-num', now), D.qty(price));
            $('.or-now-sym', now).textContent = ` ${unitNow()}`;
            const text = approxOf(price);
            val.textContent = text ? ` ${text}` : '';
          } else if (xo || !$('.or-now-num', now).childElementCount || $('.or-now-num', now).querySelector('.skel')) {
            const price = marketNow();
            if (price > 0) {
              CK.roll($('.or-now-num', now), D.qty(price));
              $('.or-now-sym', now).textContent = ` ${unitNow()}`;
              const text = approxOf(price);
              val.textContent = text ? ` ${text}` : '';
            } else if (!$('.or-now-num', now).querySelector('.skel')) {
              $('.or-now-num', now).removeAttribute('aria-label');
              $('.or-now-num', now).innerHTML = '<i class="skel sw-val-skel" aria-hidden="true"></i>';
              $('.or-now-sym', now).textContent = '';
              val.textContent = '';
            }
          }
        }
      },
      outText() {
        const stop = outOf('stop');
        const take = outOf('take');
        const least = (out) => (xo ? T.fromUnits(xWorst(o, out), xo().decimals) : gramOf(worstFloor(out)));
        const plain = (out) => (xo ? T.fromUnits(out, xo().decimals) : gramOf(out));
        const stopText = stop !== null ? sumText(least(stop)) : '';
        const takeText = take !== null ? sumText(plain(take)) : '';
        if (stopText && takeText) return tx('orders.outBoth', { stop: stopText, take: takeText });
        if (stopText) return tx('orders.outOne', { sum: stopText });
        return takeText ? tx('orders.outOne', { sum: takeText }) : '';
      },
      outGram() {
        const stop = outOf('stop');
        const take = outOf('take');
        if (stop !== null && take !== null) return 0;
        if (xo) return stop !== null ? T.fromUnits(xWorst(o, stop), xo().decimals) : take !== null ? T.fromUnits(take, xo().decimals) : 0;
        if (stop !== null) return gramOf(worstFloor(stop));
        return take !== null ? gramOf(take) : 0;
      },
      problem(gramHeld) {
        const q = o.quote();
        const stop = outOf('stop');
        const take = outOf('take');
        if ((isSet('stop') && stop === 0n) || (isSet('take') && take === 0n)) return { key: 'swap.tooSmall' };
        if (xo) {
          const sym = unitNow();
          const priceText = (out) => D.qty(priceAt(out, units()));
          if (o.needStop && isSet('take') && !isSet('stop')) return { key: 'xorders.needStop' };
          if (units() > 0n && ((isSet('stop') && stop === null) || (isSet('take') && take === null))) return { key: 'xorders.noPrice' };
          if (q && stop !== null && stop >= q.expectedOut) return { key: 'orders.stopUnder', params: { price: priceText(q.expectedOut), sym } };
          if (q && take !== null && take <= q.expectedOut) return { key: 'orders.takeOver', params: { price: priceText(q.expectedOut), sym } };
          if (q && take !== null && take > q.expectedOut * TAKE_FAR) return { key: 'orders.takeFar' };
          return null;
        }
        const unit = unitNow();
        const priceText = (out) => D.qty(shownPrice(out, units(), o.decimals(), offer));
        if (isUsdt(offer)) {
          if (q && stop !== null && stop >= q.expectedOut) return { key: 'alerts.above', params: { price: `${priceText(q.expectedOut)} ${unit}` } };
          if (q && take !== null && take <= q.expectedOut) return { key: 'alerts.below', params: { price: `${priceText(q.expectedOut)} ${unit}` } };
          if (q && take !== null && take > q.expectedOut * TAKE_FAR) return { key: 'alerts.above', params: { price: `${priceText(q.expectedOut * TAKE_FAR)} ${unit}` } };
        } else {
          if (q && stop !== null && stop >= q.expectedOut) return { key: 'orders.stopUnder', params: { price: priceText(q.expectedOut), sym: gram() } };
          if (q && take !== null && take <= q.expectedOut) return { key: 'orders.takeOver', params: { price: priceText(q.expectedOut), sym: gram() } };
          if (q && take !== null && take > q.expectedOut * TAKE_FAR) return { key: 'orders.takeFar' };
        }
        if (gramHeld < GRAM_NEEDED) return { key: 'swap.noGas', params: { sum: `${D.qty(gramOf(GRAM_NEEDED))} ${gram()}` } };
        return null;
      },
      outChanged() {
        if (!xo) return;
        ['stop', 'take'].forEach((kind) => {
          const k = kinds[kind];
          const field = $(`.or-row[data-kind="${kind}"] .or-field`, host);
          k.anchor = null;
          if (k.typed !== null) {
            k.typed = null;
            field.value = '';
          }
          const name = kindName(kind, offer);
          field.setAttribute('placeholder', `${tx('orders.price')}, ${unitNow()}`);
          field.setAttribute('aria-label', `${name}, ${tx('orders.price')}, ${unitNow()}`);
          const unitEl = $(`.or-row[data-kind="${kind}"] .or-unit`, host);
          if (unitEl) unitEl.textContent = unitNow();
          paintChips(kind);
        });
      },
      intent: () => ({ offer: o.token.id, units: units(), stopOut: outOf('stop'), takeOut: outOf('take') })
    };
  }

  async function place(intent, options) {
    try {
      return await CK.wallet.placeOrder(intent, options);
    } catch (err) {
      if (err.code === 'send_unsure') return { unsure: true };
      throw err;
    }
  }

  function openPlaced(token, intent, placed) {
    if (CK.sheet.top) return;
    const unsure = !!placed.unsure;
    const decimals = token.decimals;
    CK.sheet.open({
      title: tx('orders.placed'),
      detents: ['fit'],
      build(body, sheet) {
        body.classList.add('sw-status', 'sw-status--receipt');
        sheet.el.classList.add('sw-receipt-sheet');
        $('.sheet-title', sheet.el).textContent = '';
        body.innerHTML = `${DemoSwap.receipt.html}<div class="sw-rows summary"></div><div class="sw-actions"><button class="btn btn--wide press sw-done" type="button">${tx('common.done')}</button></div>`;
        const box = $('.sw-receipt', body);
        DemoSwap.receipt.paint(box, { mark: unsure ? 'info' : 'check-circle', tone: unsure ? 'hint' : 'up', final: true, title: tx(unsure ? 'swapSheet.unsure' : 'orders.placed'), text: tx(unsure ? 'swapSheet.unsureText' : 'orders.lineShort'), sub: `${amountText({ units: intent.units, decimals })} ${token.sym || ''}`.trim() });
        if (!unsure) $('.sw-receipt-text', box).appendChild(CK.el(`<button class="sw-why press" type="button" data-why="orders.line" aria-label="${CK.esc(tx('orders.line'))}">${icon('info', { size: 16 })}</button>`));
        box.addEventListener('click', (e) => {
          if (!e.target.closest || !e.target.closest('[data-why]')) return;
          CK.haptic.light();
          CK.toast(tx('orders.line'), { icon: 'info', tone: 'accent' });
        });
        const rows = $('.sw-rows', body);
        const row = (name, value) => {
          const r = CK.el('<div class="summary-row"><span></span><b></b></div>');
          r.firstElementChild.textContent = name;
          r.lastElementChild.textContent = value;
          rows.appendChild(r);
          return r.lastElementChild;
        };
        const priceRow = (kind, out) => {
          const price = shownPrice(out, intent.units, decimals, intent.offer);
          const approx = approxText(price, intent.offer);
          DemoSwap.withWorth(row(kindName(kind, intent.offer), `${D.qty(price)} ${unitOf(intent.offer)}`), approx ? ` ${approx}` : '');
        };
        if (intent.stopOut) {
          priceRow('stop', intent.stopOut);
          const floor = gramOf(worstFloor(intent.stopOut));
          DemoSwap.withWorth(row(tx('orders.floor'), `${sumText(floor)} ${gram()}`), DemoSwap.worthText({ id: 'TON' }, floor));
        }
        if (intent.takeOut) priceRow('take', intent.takeOut);
        row(tx('orders.gas'), `${D.qty(gramOf(GAS_ON_ORDER))} ${gram()}`);
        $('.sw-done', body).addEventListener('click', () => sheet.close());
      }
    });
  }

  let orders = [], stranded = [], loaded = false, failed = false, slot = null, shownFn = () => true, movedFn = () => null, pollTimer = 0, job = null, shape = null, scannedFor = null, heldKey = null;
  let xorders = [];
  const cancelSent = new Map();
  const returnsSent = new Set();
  const hidden = new Set();
  const followers = new Set();
  function changed() {
    followers.forEach((fn) => {
      try { fn(); } catch (err) { console.error(err); }
    });
  }
  (() => {
    try {
      const list = JSON.parse(store.get(HIDDEN_KEY) || '[]');
      if (Array.isArray(list)) list.forEach((id) => { if (typeof id === 'string') hidden.add(id); });
    } catch (_) { }
  })();

  let ordersFor = null;
  function cleanOrder(raw) {
    if (!raw || typeof raw.id !== 'string' || !ID_FORMAT.test(raw.id) || typeof raw.state !== 'string') return null;
    const units = T.parseUnits(raw.units);
    const offer = T.rawAddress(raw.offer);
    if (!units || !offer || !Number.isInteger(raw.decimals) || raw.decimals < 0 || raw.decimals > 30 || !Number.isInteger(raw.subwallet)) return null;
    const known = CK.swapAudit.knownDecimals(offer);
    const names = CK.market.cleanToken({ id: 'ton:x', symbol: raw.symbol, name: raw.symbol, address: offer });
    const num = (v) => (v === null || v === undefined ? null : T.parseUnits(v));
    return {
      id: raw.id, state: raw.state, subwallet: raw.subwallet, offer, jettonWallet: T.rawAddress(raw.jettonWallet), decimals: known === null ? raw.decimals : known, oddDecimals: known !== null && known !== raw.decimals, units, symbol: names ? names.symbol : '?',
      stopOut: num(raw.stopOut), takeOut: num(raw.takeOut), expected: num(raw.expected), lastOut: num(raw.lastOut), outUnits: num(raw.outUnits), createdAt: Number(raw.createdAt) || 0,
      stalled: raw.stalled ? String(raw.stalled) : null, halted: raw.halted === true, firedKind: raw.firedKind === 'take' ? 'take' : 'stop', failure: raw.failure === 'funding' ? 'funding' : null,
      freed: raw.freed === true, explorer: typeof raw.explorer === 'string' && EVENT_FORMAT.test(raw.explorer) ? raw.explorer : null,
      validUntil: Number.isInteger(raw.validUntil) ? raw.validUntil : 0,
      feeBps: Number.isInteger(raw.feeBps) && raw.feeBps >= 0 && raw.feeBps <= 10000 ? raw.feeBps : null
    };
  }
  const ratePct = (bps) => `${fmt.num(bps / 100, bps % 100 ? (bps % 10 ? 2 : 1) : 0)}${CK.i18n.lang === 'en' ? '%' : ' %'}`;
  function feeTerms(o) {
    const now = T.FEE_BPS;
    const was = Number.isInteger(o.feeBps) ? o.feeBps : null;
    if (was === null || was === now) return { rate: ratePct(now), note: '' };
    return { rate: `${ratePct(was)} → ${ratePct(now)}`, note: tx('orders.feeNew', { now: ratePct(now), was: ratePct(was) }) };
  }
  const isOpen = (o) => (o.x ? X_OPEN.has(o.state) : o.state === 'funding' || o.state === 'active' || o.state === 'firing' || o.state === 'cancelling' || o.state === 'replacing');
  const needsReturn = (o) => (o.x ? X_LEFT.has(o.state) : o.state === 'found' || ((o.state === 'expired' || (o.state === 'failed' && o.failure !== 'funding')) && !o.freed));
  const holdsTokens = (o) => o.state === 'active' || o.state === 'firing' || o.state === 'cancelling' || o.state === 'replacing' || needsReturn(o);
  const EXPIRING_MS = 24 * 3600 * 1000;
  const expiresSoon = (o) => o.state === 'active' && o.validUntil > 0 && o.validUntil * 1000 - Date.now() <= EXPIRING_MS;
  const rearmable = (o) => o.state === 'expired' && !o.freed && ID_FORMAT.test(o.id) && !o.oddDecimals;
  const CHANGE_STUCK_MS = 12 * 60 * 1000;
  const REPLACING_KEY = 'ck-orders-replacing';
  const replacingSince = new Map();
  (() => {
    try {
      const seen = JSON.parse(store.get(REPLACING_KEY) || '{}');
      if (seen && typeof seen === 'object') Object.keys(seen).forEach((id) => { if (ID_FORMAT.test(id) && Number.isFinite(seen[id])) replacingSince.set(id, seen[id]); });
    } catch (_) { }
  })();
  function noteReplacing(rows) {
    let touched = false;
    rows.forEach((o) => {
      if (o.state === 'replacing' && !replacingSince.has(o.id)) {
        replacingSince.set(o.id, Date.now());
        touched = true;
      } else if (o.state !== 'replacing' && replacingSince.delete(o.id)) {
        touched = true;
      }
    });
    if (touched) store.set(REPLACING_KEY, JSON.stringify(Object.fromEntries(Array.from(replacingSince).slice(-32))));
  }
  const changeStuck = (o) => o.state === 'replacing' && replacingSince.has(o.id) && Date.now() - replacingSince.get(o.id) >= CHANGE_STUCK_MS;
  const cancelShown = (o) => cancelSent.has(o.id) && (o.state === 'active' || o.state === 'cancelling' || o.state === 'replacing');
  const untilText = (s) => {
    const at = s * 1000;
    try { return `${CK.i18n.dayMonth(at)}, ${CK.i18n.clock(at)}`; } catch (_) { return new Date(at).toLocaleString(); }
  };
  const coinOf = (o) => D.coinOfAddress(o.offer);
  const logoOf = (o, size) => CK.coinLogo(coinOf(o) || { id: o.offer, sym: o.symbol, neutral: true }, size);
  function amountText(o) {
    const v = T.fromUnits(o.units, o.decimals);
    return v >= 1000 ? fmt.num(v, 0) : D.qty(v);
  }
  const worthOf = (o) => gramOf(o.lastOut || o.expected || 0n) * D.byId.ton.price;

  function viewOf(o) {
    if (o.x) return xViewOf(o);
    if (cancelShown(o)) return { sub: tx('orders.cancelling'), spin: true };
    if (returnsSent.has(o.id) && needsReturn(o)) return { sub: tx('orders.returning'), spin: true };
    switch (o.state) {
      case 'funding': return { sub: tx('orders.placing'), spin: true };
      case 'firing': return { sub: tx('orders.firing'), spin: true };
      case 'replacing': return changeStuck(o) ? { sub: tx('orders.halted'), tone: 'accent', end: 'cancel', tap: 'cancel' } : { sub: tx('orders.changing'), spin: true };
      case 'cancelling': return { sub: tx('orders.cancelling'), spin: true };
      case 'cancelled': return { sub: tx('orders.cancelled'), end: 'hide' };
      case 'filled': return { sub: tx(o.firedKind === 'take' ? 'orders.filledTake' : 'orders.filledStop', { sum: o.outUnits ? `+${sumText(gramOf(o.outUnits))} ${gram()}` : '' }).trim(), tone: 'up', end: 'hide', tap: o.explorer ? 'explorer' : null };
      case 'missed': return canSign() ? { sub: tx('orders.missedSell'), tone: 'accent', end: 'hide', tap: 'sell' } : { sub: tx('orders.missed'), end: 'hide' };
      case 'expired':
        if (!needsReturn(o)) return { sub: tx('orders.expiredBack'), end: 'hide' };
        if (canSign() && rearmable(o)) return { sub: tx('orders.expiredRearm'), tone: 'accent', end: 'return', tap: 'manage' };
        return canSign() ? { sub: tx('orders.expired'), tone: 'accent', end: 'return', tap: 'return' } : { sub: tx('orders.expiredHere') };
      case 'failed':
        if (o.failure === 'funding') return { sub: tx('orders.notPlaced'), end: 'hide' };
        if (!needsReturn(o)) return { sub: tx('orders.expiredBack'), end: 'hide' };
        return canSign() ? { sub: tx('orders.failed'), tone: 'accent', end: 'return', tap: 'return' } : { sub: tx('orders.failedHere') };
      case 'found': return canSign() ? { sub: tx('orders.found'), tone: 'accent', end: 'return', tap: 'return' } : { sub: tx('orders.foundHere') };
      case 'ended': return { sub: tx('orders.ended'), end: 'hide', tap: 'explorer' };
      default: return { end: 'cancel', kinds: true, tap: o.oddDecimals ? 'cancel' : 'manage' };
    }
  }
  const kindsOf = (o) => ['stop', 'take'].filter((kind) => !!(kind === 'stop' ? o.stopOut : o.takeOut));
  function kindText(o, kind, fig) {
    if (fig.text && fig.text === tx('orders.atStop')) return fig.text;
    const name = isUsdt(o.offer) ? tx(kind === 'stop' ? 'alerts.above' : 'alerts.below', { price: fig.text || '' }).trim() : `${tx(`orders.${kind}`)} ${fig.text || ''}`.trim();
    return name;
  }
  function figuresOf(o) {
    const quiet = o.halted || o.stalled;
    const head = o.halted ? { text: tx('orders.halted'), tone: 'near' }
      : o.stalled ? { text: tx('orders.stalled'), tone: 'near' }
        : expiresSoon(o) ? { text: tx('orders.expiresSoon'), tone: 'near' }
          : { text: isUsdt(o.offer) ? tx('orders.gramLimit', { sym: gram() }) : '', tone: '' };
    const out = gramOf(o.lastOut || o.expected || 0n);
    const pctText = (p) => `${p < 0 ? '−' : '+'}${fmt.num(Math.abs(p), 1)}${CK.i18n.lang === 'en' ? '%' : '\u00a0%'}`;
    const kinds = {};
    kindsOf(o).forEach((kind) => {
      const target = kind === 'stop' ? o.stopOut : o.takeOut;
      const usdt = isUsdt(o.offer);
      const fig = { usd: approxText(shownPrice(target, o.units, o.decimals, o.offer), o.offer), text: '', tone: '', label: '' };
      if (!quiet && out > 0 && gramOf(target) > 0) {
        const p = (usdt ? out / gramOf(target) - 1 : gramOf(target) / out - 1) * 100;
        const reached = kind === 'stop' && (usdt ? p <= 0 : p >= 0);
        if (reached && !usdt) {
          fig.text = tx('orders.atStop');
          fig.tone = 'near';
        } else {
          fig.text = pctText(reached ? 0 : p);
          fig.tone = kind === 'stop' && (reached || Math.abs(p) < NEAR_STOP_PCT) ? 'near' : '';
          fig.label = usdt ? `${kindName(kind, o.offer)}, ${fig.text}` : tx(kind === 'stop' ? 'orders.toStop' : 'orders.toTake', { pct: fig.text });
        }
      }
      kinds[kind] = fig;
    });
    return { head, kinds };
  }
  const rawKept = new WeakMap();
  function rawOf(offer) {
    if (typeof offer === 'string') return T.rawAddress(offer);
    if (!offer || typeof offer !== 'object') return null;
    if (offer.isToken) return offer.token && offer.token.network === 'ton' ? T.rawAddress(offer.token.address) : null;
    if (!rawKept.has(offer)) rawKept.set(offer, CK.swapAudit.masters().concat(CK.swapAudit.listedMasters().filter(CK.swapAudit.orderOffer)).find((raw) => D.coinOfAddress(raw) === offer) || null);
    return rawKept.get(offer);
  }
  function forToken(offer) {
    if (!loaded || !T.wallet || ordersFor !== T.wallet.address) return null;
    const raw = rawOf(offer);
    if (!raw || isUsdt(raw)) return null;
    const views = orders.filter((o) => o.state === 'active' && !cancelSent.has(o.id) && o.offer === raw).map((o) => {
      const per = (out) => (out ? priceOf(out, o.units, o.decimals) : null);
      const view = { id: o.id, stop: per(o.stopOut), take: per(o.takeOut), now: per(o.lastOut || o.expected) || 0, quiet: o.halted ? 'halted' : o.stalled ? 'stalled' : null, at: o.createdAt };
      const away = (price) => (price && view.now > 0 ? Math.abs(price / view.now - 1) : Infinity);
      view.near = Math.min(away(view.stop), away(view.take));
      return view;
    });
    if (!views.length) return null;
    views.sort((a, b) => a.near - b.near || b.at - a.at);
    const { id, stop, take, now, quiet } = views[0];
    return { id, stop, take, now, quiet };
  }
  function flagOf(o) {
    if (o.x) return xFlagOf(o);
    if (needsReturn(o)) return { rank: 0, key: 'orders.returnGo' };
    if (changeStuck(o) || (o.state === 'active' && o.halted)) return { rank: 1, key: 'orders.halted' };
    if (o.state === 'active' && o.stalled) return { rank: 2, key: 'orders.stalled' };
    if (expiresSoon(o)) return { rank: 3, key: 'orders.expiresSoon' };
    return null;
  }
  function visibleRows() {
    const rank = (o) => { const f = flagOf(o); return f ? f.rank : 9; };
    const all = xorders.length ? orders.concat(xorders).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : orders;
    const open = all.filter((o) => isOpen(o) || needsReturn(o)).concat(stranded);
    const first = open.filter((o) => flagOf(o)).sort((x, y) => rank(x) - rank(y));
    const ended = all.filter((o) => !isOpen(o) && !needsReturn(o) && !hidden.has(o.id)).slice(0, ENDED_SHOWN);
    return first.concat(open.filter((o) => !flagOf(o)), ended);
  }
  function reportTotals() {
    const held = orders.concat(stranded).filter(holdsTokens);
    const lines = held.filter((o) => o.units > 0n).map((o) => ({ token: o.offer, units: o.units, decimals: o.decimals, symbol: o.symbol, name: o.symbol, usd: worthOf(o) }));
    if (held.length) lines.push({ native: true, units: GAS_ON_ORDER * BigInt(held.length), decimals: GRAM_DECIMALS });
    D.setOrdered(lines);
  }

  const rowTap = (o, view) => (view.tap && (view.tap === 'explorer' || canSign()) ? view.tap : null);
  function rowHtml(o) {
    if (o.x) return xRowHtml(o);
    const view = viewOf(o);
    const tap = rowTap(o, view);
    const kinds = view.kinds ? kindsOf(o) : [];
    const below = view.kinds
      ? `<span class="or-kinds">${kinds.map((kind) => `<span class="or-kind" data-kind="${kind}"></span>`).join('')}</span>`
      : `<span class="or-sub"${view.tone ? ` data-tone="${view.tone}"` : ''}>${CK.esc(view.sub)}</span>`;
    return `
      <div class="cell or-item${tap ? ' press-row' : ''}" data-order="${CK.esc(o.id)}"${tap ? ` data-act="${tap}" role="button" tabindex="0"` : ''}>
        ${logoOf(o, 40)}
        <span class="or-main">
          <span class="or-line"><b class="or-sym">${CK.esc(o.units > 0n ? `${amountText(o)} ${o.symbol}` : `${D.qty(gramOf(o.gramHeld || GAS_ON_ORDER))} ${gram()}`)}</b>${view.kinds ? '<span class="or-head"></span>' : ''}</span>
          ${below}
        </span>
        ${view.spin ? '<span class="or-end"><i class="sw-spin sw-spin--small"></i></span>' : ''}
      </div>`;
  }
  const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
  const setTone = (el, tone) => { if (el && el.dataset.tone !== tone) el.dataset.tone = tone; };
  function paintFigures(rows) {
    const box = listView && listView.body;
    if (!box) return;
    rows.forEach((o) => {
      const row = box.querySelector(`[data-order="${CSS.escape(o.id)}"]`);
      const headEl = row && row.querySelector('.or-head');
      if (!headEl) return;
      const fig = o.x ? xFiguresOf(o) : figuresOf(o);
      setText(headEl, fig.head.text);
      setTone(headEl, fig.head.tone);
      Object.keys(fig.kinds).forEach((kind) => {
        const line = row.querySelector(`.or-kind[data-kind="${kind}"]`);
        if (!line) return;
        const k = fig.kinds[kind];
        setText(line, kindText(o, kind, k));
        setTone(line, k.tone);
        if (k.label) line.setAttribute('aria-label', k.label);
        else line.removeAttribute('aria-label');
      });
    });
  }

  function paintSummary() {
    if (!slot) return;
    const address = T.wallet && T.wallet.address;
    const xFirst = !loaded && xReach();
    if (!loaded && !xFirst) {
      const kept = Number(String(store.get(COUNT_KEY + address) || '').split(':')[0]) || 0;
      if (failed && kept) {
        if (shape === 'failed') return;
        slot.hidden = false;
        slot.innerHTML = `<div class="group list--free or-list"><button class="cell press-row or-summary" type="button" data-act="reload"><span class="cell-main"><span class="cell-title">${tx('orders.loadFail')}</span></span><span class="cell-value or-retry">${tx('common.retry')}</span></button></div>`;
        shape = 'failed';
        return;
      }
      if (shape === `wait:${kept}` && (slot.childElementCount || !kept)) return;
      shape = `wait:${kept}`;
      slot.hidden = !kept;
      slot.innerHTML = kept ? '<div class="group list--free or-list"><div class="wallet-skel or-skel"></div></div>' : '';
      return;
    }
    const rows = visibleRows();
    if (loaded) store.set(COUNT_KEY + address, String(rows.length));
    const count = orders.concat(xorders).filter(isOpen).length;
    const flag = rows.map(flagOf).filter(Boolean).sort((x, y) => x.rank - y.rank)[0] || null;
    const shown = rows.length > 0 || xReach();
    const next = [CK.i18n.lang, rows.length, count, flag ? flag.key : '', shown, loaded].join('~');
    if (next === shape && slot.childElementCount) return;
    const appearing = slot.hidden && shown;
    shape = next;
    slot.hidden = !shown;
    slot.innerHTML = shown ? `<div class="group list--free or-list"><button class="cell press-row or-summary" type="button" data-act="list"><span class="cell-main"><span class="cell-title">${tx('orders.title')}${count ? ` <span class="or-count">${count}</span>` : ''}</span></span>${flag ? `<span class="cell-value or-flag"><i class="or-dot" aria-hidden="true"></i>${tx(flag.key)}</span>` : ''}${icon('chevron-right', { size: 16, className: 'cell-chevron' })}</button></div>` : '';
    if (appearing) {
      slot.classList.remove('list-in');
      void slot.offsetWidth;
      slot.classList.add('list-in');
    }
  }
  let listView = null;
  function paintList() {
    const v = listView;
    if (!v) return;
    const rows = visibleRows();
    const all = xAnyOpen() && canSign();
    const tonFailed = !loaded && failed;
    const next = [CK.i18n.lang, canSign(), rows.map((o) => [o.id, o.state, o.freed, !!cancelSent.get(o.id) || xCancelSent.has(o.id), returnsSent.has(o.id), o.units, o.outUnits, !!flagOf(o)].join('|')).join(), all, tonFailed].join('~');
    if (next !== v.shape) {
      v.shape = next;
      v.body.innerHTML = (tonFailed ? `<div class="group list--free or-list"><button class="cell press-row or-summary" type="button" data-act="reload"><span class="cell-main"><span class="cell-title">${tx('orders.loadFail')}</span></span><span class="cell-value or-retry">${tx('common.retry')}</span></button></div>` : '')
        + (rows.length ? `<div class="group list--free or-list">${rows.map(rowHtml).join('')}</div>` : all ? `<p class="xo-text xo-empty">${tx('xorders.listEmpty')}</p>` : '')
        + (all ? `<div class="sw-actions or-actions xo-all"><button class="btn btn--wide btn--tinted press" type="button" data-act="xall">${tx('xorders.returnAll')}</button></div>` : '');
    }
    paintFigures(rows);
  }
  function paint() {
    paintSummary();
    paintList();
  }

  function schedule() {
    clearTimeout(pollTimer);
    if (!T.wallet) return;
    const busy = orders.some((o) => o.state === 'funding' || o.state === 'firing' || o.state === 'cancelling' || o.state === 'replacing') || cancelSent.size > 0 || returnsSent.size > 0
      || xorders.some((o) => X_OPEN.has(o.state) && o.state !== 'active' && o.state !== 'stale') || xCancelSent.size > 0;
    pollTimer = setTimeout(refresh, busy ? POLL_BUSY_MS : POLL_MS);
  }
  function resendFunding() {
    if (!canSign() || DemoSwap.pending) return;
    if (!orders.some((o) => o.state === 'funding' && Date.now() - o.createdAt > RESEND_AFTER_MS)) return;
    CK.wallet.resend().catch((err) => console.error(err));
  }
  function lookForStranded() {
    const address = T.wallet && T.wallet.address;
    const imported = CK.wallet.orderScan();
    const reason = imported || orders.some((o) => o.state === 'failed' && o.failure === 'funding');
    if (!address || scannedFor === address || !reason || !canSign()) return;
    scannedFor = address;
    Promise.resolve(imported || CK.wallet.scanOrderWallets()).then((rows) => {
      if (!Array.isArray(rows) || !T.wallet || T.wallet.address !== address) return;
      stranded = rows.filter((row) => !row.busy && (row.jettons.length > 0 || row.balance >= GAS_DUST)
        && !orders.some((o) => o.subwallet === row.subwallet && (isOpen(o) || needsReturn(o)))).map((row) => {
        const token = row.jettons.find((j) => CK.swapAudit.orderOffer(T.rawAddress(j.token))) || row.jettons[0];
        const offer = token ? T.rawAddress(token.token) : null;
        const known = offer ? CK.swapAudit.knownDecimals(offer) : null;
        const names = CK.market.cleanToken({ id: 'ton:x', symbol: (token && token.symbol) || gram(), name: '', address: offer || '' });
        return { id: `found-${row.subwallet}`, state: 'found', subwallet: row.subwallet, offer: offer || row.address, jettonWallet: token ? T.rawAddress(token.wallet) : null, decimals: known === null ? 9 : known, units: token ? T.parseUnits(token.units) : 0n, symbol: names ? names.symbol : '?', gramHeld: row.balance, stopOut: null, takeOut: null, expected: null, lastOut: null, outUnits: null, freed: false };
      });
      reportTotals();
      paint();
    }, (err) => console.error(err));
  }
  let launchOrder = (() => {
    try {
      const id = CK.tg && CK.tg.launchSearch ? CK.tg.launchSearch.get('order') : null;
      return typeof id === 'string' && ID_FORMAT.test(id) ? id : null;
    } catch (_) {
      return null;
    }
  })();
  function openLaunched() {
    if (!launchOrder) return;
    const o = orders.find((one) => one.id === launchOrder);
    if (!o) {
      const xo = xorders.find((one) => one.id === launchOrder);
      if (xo) {
        launchOrder = null;
        if (slot) openXOrder(xo);
        return;
      }
      if (!loaded || (xAnyOpen() && !xHeard)) return;
    }
    launchOrder = null;
    if (!o || !slot) return;
    if (o.state === 'active' || rearmable(o)) openOrder(o);
  }
  function refresh() {
    clearTimeout(pollTimer);
    const wallet = T.wallet;
    if (!wallet) return Promise.resolve();
    if (document.hidden || !(shownFn() || followers.size)) {
      schedule();
      return Promise.resolve();
    }
    xRefresh();
    if (job) return job;
    job = CK.wallet.listOrders().then((rows) => {
      if (!T.wallet || T.wallet.address !== wallet.address) return;
      ordersFor = wallet.address;
      orders = rows.map(cleanOrder).filter(Boolean);
      noteReplacing(orders);
      const now = Date.now();
      cancelSent.forEach((at, id) => {
        const o = orders.find((one) => one.id === id);
        if (!o || !(o.state === 'active' || o.state === 'cancelling' || o.state === 'replacing') || now - at > CANCEL_SHOWN_MS) cancelSent.delete(id);
      });
      returnsSent.forEach((id) => {
        const o = orders.find((one) => one.id === id);
        if (o && !needsReturn(o)) returnsSent.delete(id);
      });
      loaded = true;
      failed = false;
      const held = orders.filter(holdsTokens).map((o) => o.id).join();
      const moved = heldKey !== null && held !== heldKey;
      heldKey = held;
      if (moved) {
        Promise.resolve(movedFn()).catch(() => null).then(() => {
          reportTotals();
          paint();
        });
      } else {
        reportTotals();
      }
      resendFunding();
      lookForStranded();
      paint();
      openLaunched();
      changed();
    }, (err) => {
      if (reasonOf(err) === 'not_allowed' || reasonOf(err) === 'orders_off') loaded = true;
      else failed = true;
      paint();
    }).finally(() => {
      job = null;
      schedule();
    });
    return job;
  }

  function openSteps(first, title) {
    if (CK.sheet.top) return null;
    const stack = [];
    let sheet = null, body = null, slotEl = null, back = null, dispose = null, then = null, built = false;
    function show(dir) {
      if (dispose) dispose();
      dispose = null;
      if (document.activeElement && sheet.el.contains && sheet.el.contains(document.activeElement)) document.activeElement.blur();
      body.className = `sheet-body${built ? '' : ' is-arriving'}`;
      body.scrollTop = 0;
      body.innerHTML = '';
      const step = stack[stack.length - 1];
      back.hidden = stack.length < 2;
      slotEl.innerHTML = '';
      if (step.head) step.head(slotEl);
      else slotEl.textContent = step.title;
      sheet.el.setAttribute('aria-label', step.title);
      dispose = step.build(body, nav) || null;
      if (!built) return;
      if (dir && body.animate && !CK.reducedMotion()) body.animate([{ opacity: .4, transform: `translate3d(${dir * 16}px,0,0)` }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    const nav = {
      push(step) { if (step) { stack.push(step); show(1); } },
      back() { if (stack.length > 1) { stack.pop(); show(-1); } },
      done() {
        if (stack.length > 1 && stack[0].list) {
          stack.length = 1;
          show(-1);
        } else sheet.close();
      },
      close(fn) { then = fn || null; sheet.close(); },
      get sheet() { return sheet; }
    };
    CK.sheet.open({
      title: title || first.title,
      detents: ['fit'],
      onClose() {
        if (dispose) dispose();
        dispose = null;
        if (then) then();
      },
      build(b, api) {
        sheet = api;
        body = b;
        back = CK.el(`<button class="navbtn navbtn--flat press or-back" type="button" aria-label="${tx('nav.back')}" hidden>${icon('chevron-left', { size: 20 })}</button>`);
        slotEl = CK.el('<div class="or-step-title"></div>');
        const wrap = CK.el('<div class="or-step-head"></div>');
        $('.sheet-title', api.el).replaceWith(wrap);
        wrap.append(back, slotEl);
        back.addEventListener('click', () => nav.back());
        stack.push(first);
        show(0);
        if (window.DemoSwap && typeof DemoSwap.pinHeight === 'function') DemoSwap.pinHeight(this, api, STEPS_MIN_HEIGHT);
      }
    });
    built = true;
    return nav;
  }
  const tokenHead = (o, title, sub) => (el) => {
    const head = CK.el(`<div class="tk-sheet-token">${logoOf(o, 36)}<span class="tk-sheet-name"><b></b>${sub ? '<span></span>' : ''}</span></div>`);
    $('.tk-sheet-name b', head).textContent = title;
    if (sub) $('.tk-sheet-name span', head).textContent = sub;
    el.appendChild(head);
  };

  function cancelStep(o) {
    if (!canSign()) {
      CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
      return null;
    }
    const back = needsReturn(o);
    const title = tx(back ? 'orders.returnTitle' : 'orders.cancelTitle');
    return {
      title,
      head: tokenHead(o, title, o.symbol),
      build(body, nav) {
        body.classList.add('sw-status', 'or-cancel');
        body.innerHTML = `
          <div class="sw-rows summary"></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            <button class="btn btn--wide press or-go" type="button"></button>
            <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
          </div>`;
        const rows = $('.sw-rows', body);
        const row = (name, value) => {
          const r = CK.el('<div class="summary-row"><span></span><b></b></div>');
          r.firstElementChild.textContent = name;
          r.lastElementChild.textContent = value;
          rows.appendChild(r);
          return r.lastElementChild;
        };
        ['stop', 'take'].forEach((kind) => {
          const out = kind === 'stop' ? o.stopOut : o.takeOut;
          if (!out) return;
          const price = shownPrice(out, o.units, o.decimals, o.offer);
          const approx = approxText(price, o.offer);
          DemoSwap.withWorth(row(kindName(kind, o.offer), `${D.qty(price)} ${unitOf(o.offer)}`), approx ? ` ${approx}` : '');
        });
        if (o.units > 0n) row(tx('orders.back'), `${amountText(o)} ${o.symbol}`);
        row(tx('orders.backGas'), `≈ ${D.qty(gramOf(GAS_ON_ORDER))} ${gram()}`);
        const line = $('.sw-line', body);
        const go = $('.or-go', body);
        const form = $('.sw-pass', body);
        const input = $('.sw-pass-input', body);
        go.textContent = tx(back ? 'orders.returnGo' : 'orders.cancelGo');
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        let passDone = null, busy = false;
        let shakeNext = false;
        const askPassword = () => new Promise((resolve) => {
          go.hidden = true;
          form.hidden = false;
          input.value = '';
          input.focus({ preventScroll: true });
          if (shakeNext && !CK.reducedMotion()) form.animate([{ transform: 'none' }, { transform: 'translate3d(-8px,0,0)' }, { transform: 'translate3d(7px,0,0)' }, { transform: 'translate3d(-4px,0,0)' }, { transform: 'translate3d(2px,0,0)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
          shakeNext = false;
          passDone = (value) => {
            passDone = null;
            input.value = '';
            form.hidden = true;
            go.hidden = false;
            resolve(value);
          };
        });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (input.value && passDone) passDone(input.value);
        });
        async function run() {
          if (busy) return;
          busy = true;
          go.disabled = true;
          setLine('', 'note');
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            let password;
            for (;;) {
              if (CK.wallet.status.method === 'password') {
                password = await askPassword();
                if (password === null) return;
              }
              setLine(tx('swap.signing'), 'note');
              try {
                await CK.wallet.cancelOrder({ id: ID_FORMAT.test(o.id) ? o.id : undefined, subwallet: o.subwallet, offer: o.offer, jettonWallet: o.jettonWallet, units: o.units > 0n ? o.units.toString() : null }, { ...(password ? { password } : {}), wallet: ordersFor });
                break;
              } catch (err) {
                if (err.code === 'wrong_password') {
                  setLine(tx('swapSheet.passwordWrong'));
                  CK.haptic.error();
                  shakeNext = true;
                  continue;
                }
                throw err;
              } finally {
                password = undefined;
              }
            }
            CK.haptic.success();
            if (o.state === 'found') stranded = stranded.filter((one) => one !== o);
            else if (back) returnsSent.add(o.id);
            else cancelSent.set(o.id, Date.now());
            reportTotals();
            nav.done();
            paint();
            changed();
            refresh();
          } catch (err) {
            if (CK.wallet.protectRefused(err)) {
              setLine(tx('wallet.needProtect'));
            } else if (CK.wallet.isRejection(err)) {
              setLine('', 'note');
            } else if (err.code === 'insufficient_gas') {
              console.error(err);
              setLine(tx('orders.notThere'));
            } else if (err.code === 'send_unsure') {
              setLine(tx('swapSheet.tryAgain'));
            } else {
              console.error(err);
              setLine(tx(troubleOf(err).key));
            }
          } finally {
            busy = false;
            go.disabled = false;
          }
        }
        go.addEventListener('click', run);
        return () => { if (passDone) passDone(null); };
      }
    };
  }

  function signStep(body, setLine) {
    const form = $('.sw-pass', body);
    const input = $('.sw-pass-input', body);
    const buttons = () => Array.from(body.querySelectorAll('.sw-actions > [data-edit], .sw-actions > [data-xedit], .sw-actions > .btn'));
    let passDone = null, shakeNext = false;
    const ask = () => new Promise((resolve) => {
      const shown = buttons().filter((b) => !b.hidden);
      shown.forEach((b) => { b.hidden = true; });
      form.hidden = false;
      input.value = '';
      input.focus({ preventScroll: true });
      if (shakeNext && !CK.reducedMotion()) form.animate([{ transform: 'none' }, { transform: 'translate3d(-8px,0,0)' }, { transform: 'translate3d(7px,0,0)' }, { transform: 'translate3d(-4px,0,0)' }, { transform: 'translate3d(2px,0,0)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
      shakeNext = false;
      passDone = (value) => {
        passDone = null;
        input.value = '';
        form.hidden = true;
        shown.forEach((b) => { b.hidden = false; });
        resolve(value);
      };
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value && passDone) passDone(input.value);
    });
    return {
      dispose() { if (passDone) passDone(null); },
      async sign(call) {
        for (;;) {
          let password;
          if (CK.wallet.status.method === 'password') {
            password = await ask();
            if (password === null) return false;
          }
          setLine(tx('swap.signing'), 'note');
          try {
            await call({ ...(password ? { password } : {}), wallet: ordersFor });
            return true;
          } catch (err) {
            if (err.code !== 'wrong_password') throw err;
            setLine(tx('swapSheet.passwordWrong'));
            CK.haptic.error();
            shakeNext = true;
          } finally {
            password = undefined;
          }
        }
      }
    };
  }
  const passwordForm = () => `<form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>`;
  function editTrouble(err, setLine) {
    if (CK.wallet.protectRefused(err)) setLine(tx('wallet.needProtect'));
    else if (CK.wallet.isRejection(err)) setLine('', 'note');
    else if (err.code === 'send_unsure') setLine(tx('swapSheet.tryAgain'));
    else {
      console.error(err);
      setLine(tx(troubleOf(err).key));
    }
  }
  const current = (o) => orders.find((one) => one.id === o.id) || o;

  function openOrder(o) {
    if (CK.sheet.top) return;
    const step = orderStep(o);
    if (step) openSteps(step, o.symbol);
  }
  function orderStep(o) {
    if (!canSign()) {
      CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
      return null;
    }
    const expired = o.state === 'expired';
    if (o.oddDecimals || (expired ? !rearmable(o) : o.state !== 'active')) return null;
    let step = null;
    const title = `${amountText(o)} ${o.symbol}`;
    return {
      title,
      head: tokenHead(o, title, isUsdt(o.offer) ? tx('orders.gramLimit', { sym: gram() }) : ''),
      build(body, nav) {
        body.classList.add('sw-status', 'or-cancel');
        const soon = expiresSoon(o);
        const acts = expired ? [['rearm', 'orders.rearm', true], ['return', 'orders.returnTitle', false]]
          : [['extend', 'orders.extend', soon], ['change', 'orders.change', !soon], ['cancel', 'common.cancel', false]];
        if (!expired && !soon) acts.unshift(acts.splice(1, 1)[0]);
        body.innerHTML = `
          <div class="sw-rows summary"></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            ${acts.map(([act, key, main]) => (act === 'cancel'
    ? `<button class="or-link-danger press" type="button" data-edit="${act}">${tx(key)}</button>`
    : `<button class="btn btn--wide press${main ? '' : ' btn--tinted'}" type="button" data-edit="${act}">${tx(key)}</button>`)).join('')}
            ${passwordForm()}
          </div>`;
        const rows = $('.sw-rows', body);
        const row = (name, value) => {
          const r = CK.el('<div class="summary-row"><span></span><b></b></div>');
          r.firstElementChild.textContent = name;
          r.lastElementChild.textContent = value;
          rows.appendChild(r);
          return r.lastElementChild;
        };
        ['stop', 'take'].forEach((kind) => {
          const out = kind === 'stop' ? o.stopOut : o.takeOut;
          if (!out) return;
          const price = shownPrice(out, o.units, o.decimals, o.offer);
          const approx = approxText(price, o.offer);
          DemoSwap.withWorth(row(kindName(kind, o.offer), `${D.qty(price)} ${unitOf(o.offer)}`), approx ? ` ${approx}` : '');
        });
        if (o.validUntil > 0) row(tx('orders.until'), expired ? tx('orders.untilPast') : untilText(o.validUntil));
        const fee = feeTerms(o);
        row(tx('orders.fee'), fee.rate);
        const line = $('.sw-line', body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        const feeLine = () => (fee.note ? setLine(fee.note, 'warn') : setLine('', 'note'));
        feeLine();
        step = signStep(body, setLine);
        let busy = false;
        const typeAgain = (kind) => nav.push(changeStep(current(o), kind === 'rearm' ? 'rearm' : 'change', tx('orders.pricesAgain')));
        const edit = async (kind) => {
          if (busy) return;
          busy = true;
          body.querySelectorAll('[data-edit]').forEach((b) => { b.disabled = true; });
          feeLine();
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            if (!(await CK.wallet.orderPricesKnown(current(o)))) {
              typeAgain(kind);
              return;
            }
            let done = null;
            const went = await step.sign(async (options) => { done = await CK.wallet.editOrder(current(o), { kind }, options); });
            if (!went) return;
            CK.haptic.success();
            CK.toast(kind === 'extend' ? tx('orders.extended', { date: untilText(done.validUntil) }) : tx('orders.rearmed'), { icon: 'check-circle', tone: 'up' });
            nav.done();
            refresh();
          } catch (err) {
            if (kind === 'rearm' && (reasonOf(err) === 'stop_above_price' || reasonOf(err) === 'take_below_price')) {
              nav.push(changeStep(current(o), 'rearm', tx('orders.newPrices')));
              return;
            }
            if (err && err.code === 'order_refused' && err.reason === 'prices') {
              typeAgain(kind);
              return;
            }
            editTrouble(err, setLine);
          } finally {
            busy = false;
            body.querySelectorAll('[data-edit]').forEach((b) => { b.disabled = false; });
            if (!line.textContent) feeLine();
          }
        };
        body.addEventListener('click', (e) => {
          const button = e.target.closest('[data-edit]');
          if (!button || button.disabled) return;
          const act = button.dataset.edit;
          CK.haptic.light();
          if (act === 'extend' || act === 'rearm') {
            edit(act);
            return;
          }
          nav.push(act === 'change' ? changeStep(current(o), 'change') : cancelStep(current(o)));
        });
        return () => { if (step) step.dispose(); };
      }
    };
  }

  function changeStep(o, kind, note) {
    if (!canSign() || o.oddDecimals) return null;
    let step = null;
    let closed = false;
    return {
      title: tx('orders.changeTitle'),
      head: tokenHead(o, tx('orders.changeTitle'), `${amountText(o)} ${o.symbol}`),
      build(body, nav) {
        body.classList.add('sw-status', 'or-cancel');
        body.innerHTML = `
          <div class="sw-terms"><div class="or-rows"></div><div class="sw-term" hidden><span>${tx('orders.now')}</span></div></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            <button class="btn btn--wide press" type="button" data-edit="${kind}">${tx(kind === 'rearm' ? 'orders.rearm' : 'orders.changeGo')}</button>
            ${passwordForm()}
          </div>`;
        const line = $('.sw-line', body);
        const go = $('[data-edit]', body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        let busy = false;
        const now = o.lastOut || o.expected;
        const fee = feeTerms(o);
        let rows = null;
        let filling = true;
        const paint = () => {
          rows.paint();
          const problem = rows.active() ? rows.problem(GRAM_NEEDED) : { key: 'orders.newPrices' };
          go.disabled = !!problem;
          if (busy) return;
          if (note) setLine(note, 'note');
          else if (problem && rows.active()) setLine(tx(problem.key, problem.params), 'note');
          else setLine(fee.note, fee.note ? 'warn' : 'note');
        };
        rows = attach($('.or-rows', body), {
          token: { id: o.offer },
          term: $('.sw-term', body),
          decimals: () => o.decimals,
          units: () => o.units,
          quote: () => (now ? { expectedOut: now } : null),
          held: () => o.units,
          onChange() {
            if (!filling) note = '';
            paint();
          }
        });
        filling = false;
        step = signStep(body, setLine);
        paint();
        CK.wallet.orderPricesKnown(o).then((known) => {
          if (closed || busy) return;
          if (!known) {
            if (!note && !rows.active()) note = tx('orders.pricesAgain');
            paint();
            return;
          }
          filling = true;
          ['stop', 'take'].forEach((kindOf) => {
            const out = kindOf === 'stop' ? o.stopOut : o.takeOut;
            const field = $(`.or-row[data-kind="${kindOf}"] .or-field`, body);
            if (!out || !field || field.value) return;
            field.value = fieldText(shownPrice(out, o.units, o.decimals, o.offer));
            field.dispatchEvent(new Event('input', { bubbles: true }));
          });
          filling = false;
          paint();
        }, () => null);
        go.addEventListener('click', async () => {
          if (busy || go.disabled) return;
          busy = true;
          go.disabled = true;
          setLine(fee.note, fee.note ? 'warn' : 'note');
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            const chosen = rows.intent();
            const went = await step.sign((options) => CK.wallet.editOrder(current(o), { kind, stopOut: chosen.stopOut, takeOut: chosen.takeOut }, options));
            if (!went) return;
            CK.haptic.success();
            CK.toast(tx(kind === 'rearm' ? 'orders.rearmed' : 'orders.changed'), { icon: 'check-circle', tone: 'up' });
            nav.done();
            refresh();
          } catch (err) {
            editTrouble(err, setLine);
          } finally {
            busy = false;
            go.disabled = false;
            if (!line.textContent && fee.note) setLine(fee.note, 'warn');
          }
        });
        return () => {
          closed = true;
          if (step) step.dispose();
        };
      }
    };
  }

  const xCancelSent = new Map();
  const X_GAS_KEY = 'ck-xorders-gas';
  const xGasSent = new Set();
  (() => {
    try {
      const list = JSON.parse(store.get(X_GAS_KEY) || '[]');
      if (Array.isArray(list)) list.forEach((id) => { if (typeof id === 'string' && X_ID.test(id)) xGasSent.add(id); });
    } catch (_) { }
  })();
  const xGasDone = (id) => {
    xGasSent.add(id);
    store.set(X_GAS_KEY, JSON.stringify(Array.from(xGasSent).slice(-64)));
  };
  const X_STUCK_MS = 12 * 60 * 1000;
  const X_BUSY_KEY = 'ck-xorders-busy';
  const X_BUSY_STATES = new Set(['funding', 'arming', 'replacing']);
  const xBusySince = new Map();
  (() => {
    try {
      const seen = JSON.parse(store.get(X_BUSY_KEY) || '{}');
      if (seen && typeof seen === 'object') Object.keys(seen).forEach((key) => { if (Number.isFinite(seen[key])) xBusySince.set(key, seen[key]); });
    } catch (_) { }
  })();
  function xNoteBusy(rows) {
    let touched = false;
    rows.forEach((o) => {
      const key = `${o.id}:${o.state}`;
      if (X_BUSY_STATES.has(o.state) && !xBusySince.has(key)) {
        xBusySince.set(key, Date.now());
        touched = true;
      }
    });
    Array.from(xBusySince.keys()).forEach((key) => {
      if (!rows.some((o) => `${o.id}:${o.state}` === key)) {
        xBusySince.delete(key);
        touched = true;
      }
    });
    if (touched) store.set(X_BUSY_KEY, JSON.stringify(Object.fromEntries(Array.from(xBusySince).slice(-32))));
  }
  const xStuck = (o) => X_BUSY_STATES.has(o.state) && xBusySince.has(`${o.id}:${o.state}`) && Date.now() - xBusySince.get(`${o.id}:${o.state}`) >= X_STUCK_MS;
  const X_SOL_PRICES_KEY = 'ck-xorders-sol-prices';
  const xSolLine = (o) => [o.mint || o.token, String(o.units), o.out, String(o.stopOut || 0n), String(o.takeOut || 0n)].join('|');
  function xSolPrices() {
    try {
      const kept = JSON.parse(store.get(X_SOL_PRICES_KEY) || '{}');
      return kept && typeof kept === 'object' && !Array.isArray(kept) ? kept : {};
    } catch (_) {
      return {};
    }
  }
  function xSolSigned(id, o) {
    if (typeof id !== 'string' || !X_ID.test(id)) return;
    const kept = xSolPrices();
    delete kept[id];
    kept[id] = xSolLine(o);
    const ids = Object.keys(kept);
    ids.slice(0, Math.max(0, ids.length - 64)).forEach((one) => { delete kept[one]; });
    store.set(X_SOL_PRICES_KEY, JSON.stringify(kept));
  }
  const xSolKnown = (o) => o.family === 'sol' && xSolPrices()[o.id] === xSolLine(o);
  const xPricesKnown = (o) => (o.family === 'sol' ? Promise.resolve(xSolKnown(o))
    : Promise.resolve().then(() => CK.evmOrders.pricesKnown(xEvmArg(o))).then((yes) => yes === true, () => false));
  let xHeard = false;
  let xJob = null;
  const xCurrent = (o) => xorders.find((one) => one.id === o.id) || o;
  const xOutOfOrder = (o) => ({ key: o.out, sym: o.outSym, decimals: o.outDec, dollar: o.outKey === 'usdc' || o.outKey === 'usdt' });
  function xKnownDecimals(chain, token) {
    if (chain !== X_SOL && token === X_NATIVE) return 18;
    try {
      const known = window.DemoNets && typeof DemoNets.decimalsOf === 'function' ? DemoNets.decimalsOf(chain, token) : null;
      return Number.isInteger(known) && known >= 0 && known <= 30 ? known : null;
    } catch (_) {
      return null;
    }
  }
  function cleanX(raw, family) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !X_ID.test(raw.id) || typeof raw.state !== 'string' || !(X_OPEN.has(raw.state) || X_ENDED.has(raw.state))) return null;
    const chain = family === 'sol' ? X_SOL : raw.chain;
    if (xFamily(chain) !== family) return null;
    const token = family === 'sol' ? raw.mint : typeof raw.token === 'string' ? raw.token.toLowerCase() : '';
    if (typeof token !== 'string' || !(family === 'sol' ? X_MINT.test(token) : X_EVM_TOKEN.test(token))) return null;
    const units = T.parseUnits(String(raw.units));
    if (!units || !Number.isInteger(raw.decimals) || raw.decimals < 0 || raw.decimals > 30 || !Number.isInteger(raw.n) || raw.n < 0) return null;
    const out = xOutOf(chain, raw.out);
    if (!out) return null;
    const num = (v) => (v === null || v === undefined || v === '' ? null : T.parseUnits(String(v)));
    const stopOut = num(raw.stopOut), takeOut = num(raw.takeOut);
    if (!stopOut && !takeOut) return null;
    const names = token === X_NATIVE ? { symbol: X_COIN[chain] } : CK.market.cleanToken({ id: `${chain}:x`, symbol: raw.symbol, name: raw.symbol, address: token });
    const landed = raw.landed && typeof raw.landed === 'object' ? raw.landed : null;
    const figures = landed && landed.figures && typeof landed.figures === 'object' ? landed.figures : null;
    const known = xKnownDecimals(chain, token);
    const where = typeof raw.orderAddress === 'string' ? raw.orderAddress : typeof raw.address === 'string' ? raw.address : '';
    const address = family === 'sol' ? (X_MINT.test(where) ? where : null) : (X_EVM_TOKEN.test(where.toLowerCase()) ? where.toLowerCase() : null);
    return {
      x: true, family, chain, id: raw.id, n: raw.n, token, offer: token, symbol: names && names.symbol ? names.symbol : '?', decimals: known === null ? raw.decimals : known,
      oddDecimals: known !== null && known !== raw.decimals, units,
      out: out.key, outKey: out.key, outSym: out.sym, outDec: out.decimals, stopOut, takeOut, state: raw.state,
      validUntil: Number.isInteger(raw.validUntil) ? raw.validUntil : 0, createdAt: Number(raw.createdAt) || 0, stalled: raw.stalled ? String(raw.stalled) : null,
      fireRecord: raw.fireRecord && typeof raw.fireRecord === 'object' && !Array.isArray(raw.fireRecord) ? raw.fireRecord : null,
      top: Array.isArray(raw.top) && raw.top.length === 2 && raw.top.every((v) => typeof v === 'string' && /^\d{1,40}$/.test(v)) ? raw.top.slice() : null,
      G: family === 'evm' ? num(raw.G) : null,
      got: figures ? num(figures.out) : null,
      tx: family === 'evm' && landed && typeof landed.hash === 'string' && /^0x[0-9a-f]{64}$/.test(landed.hash) ? landed.hash : null,
      address
    };
  }
  const xPath = (o) => (o.family === 'sol' ? `m/44'/501'/2000'/${o.n}'` : `m/44'/60'/1000'/0/${o.n}`);
  function xWhereRows(o, row) {
    const own = (address) => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '');
    let full = o.address;
    const value = row(tx('xorders.address'), own(full));
    const line = value.parentNode;
    if (line) {
      line.classList.add('press-row');
      line.setAttribute('role', 'button');
      line.addEventListener('click', () => {
        if (!full) return;
        CK.haptic.light();
        Promise.resolve(CK.copyText ? CK.copyText(full) : null).then(() => CK.toast(tx('common.addressCopied'), { icon: 'check-circle', tone: 'up' }), () => null);
      });
    }
    row(tx('xorders.path'), xPath(o));
    if (!CK.wallet || typeof CK.wallet.orderAddresses !== 'function') return;
    Promise.resolve().then(() => CK.wallet.orderAddresses(o.chain, { fill: false })).then((rows) => {
      const mine = Array.isArray(rows) ? rows.find((one) => one && one.n === o.n && typeof one.address === 'string' && one.address) : null;
      if (!mine) return;
      full = o.family === 'sol' ? mine.address : mine.address.toLowerCase();
      value.textContent = own(full);
    }, () => null);
  }
  function xRefresh() {
    const families = ['evm', 'sol'].filter(xOpen);
    if (!families.length || !T.wallet) {
      if (xorders.length) {
        xorders = [];
        paint();
      }
      return Promise.resolve();
    }
    if (xJob) return xJob;
    const wallet = T.wallet.address;
    const ask = (family) => Promise.resolve().then(() => T.api(family === 'evm' ? 'xorders/list' : 'sol-orders/list'))
      .then((body) => ({ family, rows: body && Array.isArray(body.orders) ? body.orders : null }), () => ({ family, rows: null }));
    xJob = Promise.all(families.map(ask)).then((lists) => {
      if (!T.wallet || T.wallet.address !== wallet) return;
      let next = xorders.filter((o) => families.includes(o.family));
      lists.forEach(({ family, rows }) => {
        if (!rows) return;
        next = next.filter((o) => o.family !== family).concat(rows.slice(0, 100).map((raw) => cleanX(raw, family)).filter(Boolean));
      });
      xorders = next;
      xHeard = true;
      xHeldListed();
      xNoteBusy(xorders);
      if (xorders.length) xSeen(wallet);
      else xRecordsAsk();
      const now = Date.now();
      xCancelSent.forEach((at, id) => {
        const o = xorders.find((one) => one.id === id);
        if (!o || !(X_CANCELLED_SHOWN.has(o.state) || X_LEFT.has(o.state)) || now - at > CANCEL_SHOWN_MS) xCancelSent.delete(id);
      });
      paint();
      openLaunched();
      changed();
    }).catch((err) => console.error(err)).then(() => { xJob = null; });
    return xJob;
  }
  const X_SEEN_KEY = 'ck-xorders-seen';
  const X_RECORDS_MS = 10 * 60 * 1000;
  let xRec = { wallet: null, any: false, job: null, at: 0, families: '' };
  function xSeenList() {
    try {
      const list = JSON.parse(store.get(X_SEEN_KEY) || '[]');
      return Array.isArray(list) ? list.filter((one) => typeof one === 'string') : [];
    } catch (_) {
      return [];
    }
  }
  function xSeen(wallet) {
    if (!wallet) return;
    const list = xSeenList();
    if (list.includes(wallet)) return;
    list.push(wallet);
    store.set(X_SEEN_KEY, JSON.stringify(list.slice(-10)));
  }
  function xRecordsAsk() {
    const wallet = T.wallet && T.wallet.address;
    if (!wallet || !CK.wallet || typeof CK.wallet.orderAddresses !== 'function') return;
    const families = ['evm', 'sol'].filter(xOpen);
    const asked = families.join();
    if (!families.length || (xRec.wallet === wallet && xRec.families === asked && (xRec.any || xRec.job || Date.now() - xRec.at < X_RECORDS_MS))) return;
    if (families.includes('evm')) xFamily('base');
    const list = [...(families.includes('evm') && xEvmKeys ? Array.from(xEvmKeys) : []), ...(families.includes('sol') ? [X_SOL] : [])];
    const one = { wallet, any: false, job: null, at: Date.now(), families: asked };
    xRec = one;
    one.job = (async () => {
      for (const chain of list) {
        if (xRec !== one) return;
        try {
          const rows = await CK.wallet.orderAddresses(chain, { fill: false, wallet });
          if (Array.isArray(rows) && rows.some((row) => row && (Number.isInteger(row.hi) || (typeof row.live === 'string' && row.live)))) {
            one.any = true;
            return;
          }
        } catch (_) { }
      }
    })().catch(() => null).then(() => {
      one.job = null;
      one.at = Date.now();
      if (xRec === one && one.any && T.wallet && T.wallet.address === wallet) paint();
    });
  }
  const xReach = () => xAnyOpen() && canSign() && !!T.wallet && (xorders.length > 0 || (xRec.wallet === T.wallet.address && xRec.any) || xSeenList().includes(T.wallet.address));
  const xExpiresSoon = (o) => o.state === 'active' && o.validUntil > 0 && o.validUntil * 1000 - Date.now() <= EXPIRING_MS;
  function xInstOf(o) {
    if (o.family === 'evm' && o.token === X_NATIVE) {
      const net = window.DemoNets && typeof DemoNets.chains === 'function' ? DemoNets.chains().find((one) => one.key === o.chain) : null;
      return net ? net.inst : null;
    }
    return D.instruments && typeof D.instruments.get === 'function' ? D.instruments.get(`${o.chain}:${o.token}`) || null : null;
  }
  const xLogoOf = (o, size) => CK.coinLogo(xInstOf(o) || { id: `${o.chain}:${o.token}`, sym: o.symbol, neutral: true }, size);
  function xNetBadge(o) {
    const name = xNetName(o.chain);
    const net = window.DemoNets && typeof DemoNets.chains === 'function' ? DemoNets.chains().find((one) => one.key === o.chain) : null;
    if (net && net.mark) return { badge: `<span class="net-badge" title="${CK.esc(name)}">${CK.coinLogo({ id: 'net:' + net.key, sym: name, neutral: true, logo: net.mark }, 18)}</span>`, tag: '' };
    return { badge: '', tag: `<em class="tag">${CK.esc(name)}</em>` };
  }
  function xMarketOut(o) {
    const inst = xInstOf(o);
    const tokenUsd = inst && inst.price > 0 && (inst.isToken || inst.priced === true) ? inst.price : 0;
    const outUsd = xOutUsd(o.chain, xOutOfOrder(o));
    if (!(tokenUsd > 0) || !(outUsd > 0)) return null;
    return xOutAt((tokenUsd / outUsd) * (1 - X_FEE_BPS / 10000), o.units, o.decimals, o.outDec);
  }
  function xAgainInst(o) {
    if (!xOpen(o.family) || !window.DemoNets || typeof DemoNets.open !== 'function' || typeof DemoNets.listed !== 'function') return null;
    const inst = xInstOf(o);
    return inst && DemoNets.listed(inst) ? inst : null;
  }
  function xEndActs(o) {
    const acts = [];
    if (o.fireRecord) acts.push('why');
    if (o.tx && window.DemoNets && typeof DemoNets.txLink === 'function' && DemoNets.txLink(o.chain, o.tx)) acts.push('tx');
    const evmEnded = o.family === 'evm' && X_ENDED.has(o.state) && !X_LEFT.has(o.state) && !!xLib('evm');
    if (evmEnded && o.state === 'notPlaced') {
      if (xOpen('evm') && typeof xLib('evm').returnAll === 'function') acts.push('all');
    } else if (evmEnded && !xGasSent.has(o.id) && !(o.token === X_NATIVE && o.state === 'returned')) acts.push('gas');
    if ((o.state === 'expired' || o.state === 'retired') && xAgainInst(o)) acts.push('again');
    return acts;
  }
  const xEndTap = (o) => (xEndActs(o).length ? 'xended' : null);
  const X_CANCELLED_SHOWN = new Set(['active', 'stale', 'replacing', 'funding', 'arming']);
  function xViewOf(o) {
    if (xCancelSent.has(o.id) && (X_CANCELLED_SHOWN.has(o.state) || X_LEFT.has(o.state))) return { sub: tx(X_LEFT.has(o.state) ? 'orders.returning' : 'orders.cancelling'), spin: true };
    if (xStuck(o)) return canSign() ? { sub: tx('orders.halted'), tone: 'accent', tap: 'xcancel' } : { sub: tx('orders.halted'), tone: 'accent' };
    switch (o.state) {
      case 'funding':
      case 'arming': return { sub: tx('orders.placing'), spin: true };
      case 'firing': return { sub: tx('orders.firing'), spin: true, tap: o.fireRecord ? 'xended' : null };
      case 'returning': return { sub: tx('orders.returning'), spin: true };
      case 'cancelling': return { sub: tx('orders.cancelling'), spin: true };
      case 'replacing': return { sub: tx('orders.changing'), spin: true };
      case 'stale': return { sub: tx('xorders.stale'), tone: 'accent', tap: 'xmanage' };
      case 'filled': {
        const take = o.fireRecord && o.fireRecord.kind === 'take';
        return { sub: tx(take ? 'orders.filledTake' : 'orders.filledStop', { sum: o.got ? `+${sumText(T.fromUnits(o.got, o.outDec))} ${o.outSym}` : '' }).trim(), tone: 'up', tap: xEndTap(o) };
      }
      case 'missed': return { sub: tx('xorders.missedBack'), tap: xEndTap(o) };
      case 'expired': return { sub: tx('xorders.expiredBack'), tap: xEndTap(o) };
      case 'retired':
      case 'unwound':
      case 'feeRaised': return { sub: tx('xorders.closedBack'), tap: xEndTap(o) };
      case 'returned': return { sub: tx('orders.cancelled'), tap: xEndTap(o) };
      case 'notPlaced': return { sub: tx('orders.notPlaced'), tap: xEndTap(o) };
      case 'landed':
      case 'stuck': return canSign() ? { sub: tx('xorders.left'), tone: 'accent', tap: 'xcancel' } : { sub: tx('orders.failedHere') };
      case 'ended': return { sub: tx('orders.ended'), tap: xEndTap(o) };
      default: return { kinds: true, tap: 'xmanage' };
    }
  }
  function xFlagOf(o) {
    if (X_LEFT.has(o.state)) return { rank: 0, key: 'orders.returnGo' };
    if (xStuck(o) && !xCancelSent.has(o.id)) return { rank: 1, key: 'orders.halted' };
    if (o.state === 'stale') return { rank: 1, key: 'xorders.refresh' };
    if (o.state === 'active' && o.stalled) return { rank: 2, key: 'orders.stalled' };
    if (xExpiresSoon(o)) return { rank: 3, key: 'orders.expiresSoon' };
    return null;
  }
  function xFiguresOf(o) {
    const head = o.stalled ? { text: tx('orders.stalled'), tone: 'near' } : xExpiresSoon(o) ? { text: tx('orders.expiresSoon'), tone: 'near' } : { text: '', tone: '' };
    const now = o.stalled ? null : xMarketOut(o);
    const usd = xOutUsd(o.chain, xOutOfOrder(o));
    const pctText = (p) => `${p < 0 ? '−' : '+'}${fmt.num(Math.abs(p), 1)}${CK.i18n.lang === 'en' ? '%' : ' %'}`;
    const kinds = {};
    kindsOf(o).forEach((kind) => {
      const target = kind === 'stop' ? o.stopOut : o.takeOut;
      const fig = { usd: xApprox(xPriceOf(target, o.units, o.decimals, o.outDec), usd), text: '', tone: '', label: '' };
      const nowAmount = now ? T.fromUnits(now, o.outDec) : 0;
      const targetAmount = T.fromUnits(target, o.outDec);
      if (nowAmount > 0 && targetAmount > 0) {
        const p = (targetAmount / nowAmount - 1) * 100;
        if (kind === 'stop' && p >= 0) {
          fig.text = tx('orders.atStop');
          fig.tone = 'near';
        } else {
          fig.text = pctText(p);
          fig.tone = kind === 'stop' && Math.abs(p) < NEAR_STOP_PCT ? 'near' : '';
          fig.label = tx(kind === 'stop' ? 'orders.toStop' : 'orders.toTake', { pct: fig.text });
        }
      }
      kinds[kind] = fig;
    });
    return { head, kinds };
  }
  function xRowHtml(o) {
    const view = xViewOf(o);
    const tap = rowTap(o, view);
    const kinds = view.kinds ? kindsOf(o) : [];
    const net = xNetBadge(o);
    const below = view.kinds
      ? `<span class="or-kinds">${kinds.map((kind) => `<span class="or-kind" data-kind="${kind}"></span>`).join('')}</span>`
      : `<span class="or-sub"${view.tone ? ` data-tone="${view.tone}"` : ''}>${CK.esc(view.sub)}</span>`;
    return `
      <div class="cell or-item${tap ? ' press-row' : ''}" data-order="${CK.esc(o.id)}" data-net="${CK.esc(o.chain)}"${tap ? ` data-act="${tap}" role="button" tabindex="0"` : ''}>
        <span class="coin-with-net">${xLogoOf(o, 40)}${net.badge}</span>
        <span class="or-main">
          <span class="or-line"><b class="or-sym">${CK.esc(`${amountText(o)} ${o.symbol}`)}</b>${net.tag}${view.kinds ? '<span class="or-head"></span>' : ''}</span>
          ${below}
        </span>
        ${view.spin ? '<span class="or-end"><i class="sw-spin sw-spin--small"></i></span>' : ''}
      </div>`;
  }
  const xHeadOf = (o, title, sub) => (el) => {
    const head = CK.el(`<div class="tk-sheet-token"><span class="coin-with-net">${xLogoOf(o, 36)}${xNetBadge(o).badge}</span><span class="tk-sheet-name"><b></b><span></span></span></div>`);
    $('.tk-sheet-name b', head).textContent = title;
    $('.tk-sheet-name span', head).textContent = sub;
    el.appendChild(head);
  };
  const rowAdder = (body) => {
    const rows = $('.sw-rows', body);
    return (name, value) => {
      const r = CK.el('<div class="summary-row"><span></span><b></b></div>');
      const valueEl = $('b', r);
      $('span', r).textContent = name;
      valueEl.textContent = value;
      rows.appendChild(r);
      return valueEl;
    };
  };
  const worthOn = (el, text) => {
    if (window.DemoSwap && typeof DemoSwap.withWorth === 'function') DemoSwap.withWorth(el, text);
    else if (text) el.textContent += text;
  };
  const xFloorText = (amount) => (window.DemoSwap && DemoSwap.receipt && typeof DemoSwap.receipt.sig4 === 'function' ? DemoSwap.receipt.sig4(amount, true) : D.qty(amount));
  function xPriceRows(o, row, floor) {
    const out = xOutOfOrder(o);
    const usd = xOutUsd(o.chain, out);
    ['stop', 'take'].forEach((kind) => {
      const value = kind === 'stop' ? o.stopOut : o.takeOut;
      if (!value) return;
      const price = xPriceOf(value, o.units, o.decimals, out.decimals);
      const approx = xApprox(price, usd);
      worthOn(row(tx(`orders.${kind}`), `${D.qty(price)} ${out.sym}`), approx ? ` ${approx}` : '');
      if (kind === 'stop' && floor !== false) row(tx('orders.floor'), `${xFloorText(T.fromUnits(xFloors(o.family, value)[2], out.decimals))} ${out.sym}`);
    });
  }
  const xEvmArg = (o) => ({ id: o.id, chain: o.chain, n: o.n, token: o.token, units: o.units, out: o.out, stopOut: o.stopOut, takeOut: o.takeOut, ...(o.top ? { top: o.top } : {}) });
  const xSolArg = (o) => ({ id: o.id, n: o.n, mint: o.token, out: o.out, units: o.units, stopOut: o.stopOut, takeOut: o.takeOut });
  const xFeeNote = () => tx('xorders.fee', { pct: ratePct(X_FEE_BPS) });
  function xEditTrouble(err, setLine, o) {
    if (typeof CK.wallet.protectRefused === 'function' && CK.wallet.protectRefused(err)) setLine(tx('wallet.needProtect'));
    else if (typeof CK.wallet.isRejection === 'function' && CK.wallet.isRejection(err)) setLine('', 'note');
    else {
      const t = xTrouble(err, { coin: X_COIN[o.chain] || '', gas: { sym: X_COIN[o.chain] || '', decimals: o.family === 'sol' ? 9 : 18 }, family: o.family, step: true });
      if (!t.block) console.error(err);
      setLine(tx(t.key, t.params || undefined));
    }
  }

  function xOrderStep(o) {
    if (!canSign()) {
      CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
      return null;
    }
    if (!xOpen(o.family) || (o.state !== 'active' && o.state !== 'stale')) return null;
    let step = null;
    const title = `${amountText(o)} ${o.symbol}`;
    return {
      title,
      head: xHeadOf(o, title, xNetName(o.chain)),
      build(body, nav) {
        body.classList.add('sw-status', 'or-cancel');
        const soon = xExpiresSoon(o);
        const acts = o.state === 'stale' ? [['refresh', 'xorders.refresh', true], ['cancel', 'common.cancel', false]]
          : soon ? [['extend', 'orders.extend', true], ['change', 'orders.change', false], ['cancel', 'common.cancel', false]]
            : [['change', 'orders.change', true], ['extend', 'orders.extend', false], ['cancel', 'common.cancel', false]];
        const buttonOf = ([act, key, main]) => (act === 'cancel' && !main
          ? `<button class="or-link-danger press" type="button" data-xedit="${act}">${tx(key)}</button>`
          : `<button class="btn btn--wide press${main ? '' : ' btn--tinted'}" type="button" data-xedit="${act}">${tx(key)}</button>`);
        body.innerHTML = `
          <div class="sw-rows summary"></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            ${acts.map(buttonOf).join('')}
            ${passwordForm()}
          </div>`;
        const row = rowAdder(body);
        xPriceRows(o, row);
        if (o.validUntil > 0) row(tx('orders.until'), untilText(o.validUntil));
        row(tx('xorders.net'), xNetName(o.chain));
        xWhereRows(o, row);
        const line = $('.sw-line', body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        setLine(xFeeNote(), 'note');
        step = signStep(body, setLine);
        let busy = false;
        let only = false;
        const cancelOnly = () => {
          if (only) return;
          only = true;
          const box = $('.sw-actions', body);
          box.querySelectorAll('[data-xedit]').forEach((b) => b.remove());
          $('.sw-pass', box).insertAdjacentHTML('beforebegin', buttonOf(['cancel', 'common.cancel', true]));
          setLine(tx('xorders.cancelOnly'), 'note');
        };
        if (o.oddDecimals) cancelOnly();
        const known = o.family === 'evm' && !o.oddDecimals ? xPricesKnown(o) : Promise.resolve(o.family === 'sol' && xSolKnown(o));
        if (o.family === 'evm') known.then((yes) => { if (!yes && alive) cancelOnly(); });
        const run = async (act) => {
          if (busy) return;
          busy = true;
          body.querySelectorAll('[data-xedit]').forEach((b) => { b.disabled = true; });
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            const now = xCurrent(o);
            if (act === 'extend' && o.family === 'sol') {
              const done = await T.api('sol-orders/extend', { body: { id: now.id } });
              CK.haptic.success();
              CK.toast(done && Number.isInteger(done.validUntil) ? tx('orders.extended', { date: untilText(done.validUntil) }) : tx('xorders.extended'), { icon: 'check-circle', tone: 'up' });
              nav.done();
              xRefresh();
              return;
            }
            if (!(await xPricesKnown(now))) {
              if (o.family === 'sol') nav.push(xChangeStep(now, tx('orders.pricesAgain')));
              else cancelOnly();
              return;
            }
            const went = await step.sign((options) => (act === 'refresh' ? CK.solOrders.refresh(xSolArg(now), options) : CK.evmOrders.extend(xEvmArg(now), options)));
            if (!went) return;
            CK.haptic.success();
            CK.toast(tx(act === 'refresh' ? 'xorders.refreshed' : 'xorders.extended'), { icon: 'check-circle', tone: 'up' });
            nav.done();
            xRefresh();
          } catch (err) {
            if (err && err.code === 'order_refused' && err.reason === 'prices' && o.family === 'evm') cancelOnly();
            else xEditTrouble(err, setLine, o);
          } finally {
            busy = false;
            body.querySelectorAll('[data-xedit]').forEach((b) => { b.disabled = false; });
            if (!line.textContent) setLine(only ? tx('xorders.cancelOnly') : xFeeNote(), 'note');
          }
        };
        let alive = true;
        body.addEventListener('click', (e) => {
          const button = alive && e.target.closest('[data-xedit]');
          if (!button || button.disabled || busy) return;
          const act = button.dataset.xedit;
          CK.haptic.light();
          if (act === 'extend' || act === 'refresh') {
            run(act);
            return;
          }
          if (act === 'cancel') {
            nav.push(xCancelStep(xCurrent(o)));
            return;
          }
          busy = true;
          known.then((yes) => {
            busy = false;
            if (!alive) return;
            if (o.family === 'evm' && !yes) cancelOnly();
            else nav.push(xChangeStep(xCurrent(o)));
          });
        });
        return () => {
          alive = false;
          if (step) step.dispose();
        };
      }
    };
  }

  function xChangeStep(o, note) {
    if (!canSign() || !xOpen(o.family) || o.oddDecimals || !(o.state === 'active' || (o.family === 'sol' && o.state === 'stale'))) return null;
    let step = null;
    let closed = false;
    let locked = false;
    const out = xOutOfOrder(o);
    return {
      title: tx('orders.changeTitle'),
      head: xHeadOf(o, tx('orders.changeTitle'), `${amountText(o)} ${o.symbol}`),
      build(body, nav) {
        body.classList.add('sw-status', 'or-cancel');
        body.innerHTML = `
          <div class="sw-terms"><div class="or-rows"></div><div class="sw-term" hidden><span>${tx('orders.now')}</span></div></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            <button class="btn btn--wide press" type="button" data-xedit="change">${tx('orders.changeGo')}</button>
            ${passwordForm()}
          </div>`;
        const line = $('.sw-line', body);
        const go = $('[data-xedit]', body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        let busy = false;
        let rows = null;
        let filling = true;
        const paintStep = () => {
          rows.paint();
          const problem = rows.active() ? rows.problem() : { key: 'orders.newPrices' };
          go.disabled = !!problem || locked;
          if (busy) return;
          if (locked) setLine(tx('xorders.cancelOnly'), 'note');
          else if (note) setLine(note, 'note');
          else if (problem && rows.active()) setLine(tx(problem.key, problem.params), 'note');
          else setLine(xFeeNote(), 'note');
        };
        const market = () => xMarketOut(o);
        rows = attach($('.or-rows', body), {
          token: { id: o.token },
          term: $('.sw-term', body),
          decimals: () => o.decimals,
          units: () => o.units,
          quote: () => (market() ? { expectedOut: market() } : null),
          held: () => o.units,
          out: () => ({ sym: out.sym, decimals: out.decimals, usd: () => xOutUsd(o.chain, out) }),
          market: () => (market() ? xPriceOf(market(), o.units, o.decimals, out.decimals) : 0),
          needStop: o.family === 'sol',
          floors: (stopOut) => xFloors(o.family, stopOut),
          onChange() {
            if (!filling) note = '';
            paintStep();
          }
        });
        filling = false;
        step = signStep(body, setLine);
        paintStep();
        xPricesKnown(o).then((yes) => {
          if (closed || busy) return;
          if (!yes) {
            if (o.family === 'evm') locked = true;
            else if (!note && !rows.active()) note = tx('orders.pricesAgain');
            paintStep();
            return;
          }
          filling = true;
          ['stop', 'take'].forEach((kindOf) => {
            const value = kindOf === 'stop' ? o.stopOut : o.takeOut;
            const field = $(`.or-row[data-kind="${kindOf}"] .or-field`, body);
            if (!value || !field || field.value) return;
            field.value = fieldText(xPriceOf(value, o.units, o.decimals, out.decimals));
            field.dispatchEvent(new Event('input', { bubbles: true }));
          });
          filling = false;
          paintStep();
        }, () => null);
        go.addEventListener('click', async () => {
          if (busy || go.disabled || locked) return;
          busy = true;
          go.disabled = true;
          setLine(xFeeNote(), 'note');
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            const chosen = rows.intent();
            if (!chosen.stopOut && !chosen.takeOut) {
              setLine(tx('xorders.noPrice'), 'note');
              return;
            }
            const now = xCurrent(o);
            const went = await step.sign((options) => (o.family === 'evm'
              ? CK.evmOrders.change(xEvmArg(now), { stopOut: chosen.stopOut, takeOut: chosen.takeOut }, options)
              : CK.solOrders.change(xSolArg(now), { mint: now.token, units: now.units, out: now.out, stopOut: chosen.stopOut, takeOut: chosen.takeOut }, options)));
            if (!went) return;
            if (o.family === 'sol') xSolSigned(now.id, { mint: now.token, units: now.units, out: now.out, stopOut: chosen.stopOut, takeOut: chosen.takeOut || null });
            CK.haptic.success();
            CK.toast(tx('orders.changed'), { icon: 'check-circle', tone: 'up' });
            nav.done();
            xRefresh();
          } catch (err) {
            if (err && err.code === 'order_refused' && err.reason === 'prices' && o.family === 'evm') {
              locked = true;
              setLine(tx('xorders.cancelOnly'), 'note');
            } else xEditTrouble(err, setLine, o);
          } finally {
            busy = false;
            go.disabled = locked;
          }
        });
        return () => {
          closed = true;
          if (step) step.dispose();
        };
      }
    };
  }

  function xCancelStep(o) {
    if (!canSign()) {
      CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
      return null;
    }
    if (!xLib(o.family)) return null;
    const back = X_LEFT.has(o.state);
    const title = tx(back ? 'orders.returnTitle' : 'orders.cancelTitle');
    return {
      title,
      head: xHeadOf(o, title, xNetName(o.chain)),
      build(body, nav) {
        body.classList.add('sw-status', 'or-cancel');
        body.innerHTML = `
          <div class="sw-rows summary"></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            <button class="btn btn--wide press or-go" type="button" data-xedit="go">${tx(back ? 'orders.returnGo' : 'orders.cancelGo')}</button>
            ${passwordForm()}
          </div>`;
        const row = rowAdder(body);
        if (!back) xPriceRows(o, row, false);
        row(tx('orders.back'), `${amountText(o)} ${o.symbol}`);
        const gasLater = o.family === 'evm' && o.token !== X_NATIVE;
        if (o.family === 'evm' && o.token === X_NATIVE && o.G) row(tx('orders.backGas'), `≈ ${D.qty(T.fromUnits(o.G, 18))} ${X_COIN[o.chain]}`);
        xWhereRows(o, row);
        const line = $('.sw-line', body);
        const go = $('.or-go', body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        const said = () => setLine(gasLater ? tx('xorders.gasLater') : '', 'note');
        said();
        const step = signStep(body, setLine);
        let busy = false;
        go.addEventListener('click', async () => {
          if (busy) return;
          busy = true;
          go.disabled = true;
          said();
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            const now = xCurrent(o);
            const went = await step.sign((options) => (o.family === 'evm'
              ? CK.evmOrders.cancel({ id: now.id, chain: now.chain, n: now.n, token: now.token, ...(now.top ? { top: now.top } : {}) }, options)
              : CK.solOrders.cancel(xSolArg(now), options)));
            if (!went) return;
            CK.haptic.success();
            xCancelSent.set(o.id, Date.now());
            nav.done();
            paint();
            changed();
            refresh();
          } catch (err) {
            xEditTrouble(err, setLine, o);
          } finally {
            busy = false;
            go.disabled = false;
            if (!line.textContent) said();
          }
        });
        return () => step.dispose();
      }
    };
  }

  function xSourceName(code) {
    const text = String(code);
    if (/^binance(:|$)/.test(text)) return 'Binance';
    if (text === 'dexscreener') return 'DEX Screener';
    if (text === 'pool2' || text === 'vaults' || text === 'outside') return tx(`xorders.src.${text}`);
    return text.slice(0, 32);
  }
  function xWhyStep(o) {
    const r = o.fireRecord;
    if (!r) return null;
    const title = tx('xorders.why');
    return {
      title,
      head: xHeadOf(o, title, `${amountText(o)} ${o.symbol}`),
      build(body) {
        body.classList.add('sw-status', 'or-cancel');
        body.innerHTML = '<div class="sw-rows summary"></div><p class="sw-line" role="status" data-tone="note"></p>';
        const row = rowAdder(body);
        const out = xOutOfOrder(o);
        const amount = (value, down) => {
          const units = value === null || value === undefined ? null : T.parseUnits(String(value));
          if (!units) return '';
          const v = T.fromUnits(units, out.decimals);
          return `${down ? xFloorText(v) : sumText(v)} ${out.sym}`;
        };
        const add = (key, value) => { if (value) row(tx(key), value); };
        const at = Number(r.at);
        if (at > 0) add('xorders.whyAt', untilText(Math.floor(at / 1000)));
        if (r.kind === 'take') add('xorders.whyLevel', tx('orders.take'));
        else if (Number.isInteger(r.index) && X_FLOORS_BPS[r.index]) add('xorders.whyLevel', `${tx('orders.stop')}, ${ratePct(X_FLOORS_BPS[r.index])}`);
        add('orders.floor', amount(r.floor, true));
        add('xorders.whyPool', amount(r.out));
        add('xorders.whySim', amount(r.simulatedOut));
        const second = r.second && typeof r.second === 'object' ? r.second : null;
        if (second && typeof second.source === 'string' && second.source) {
          const age = Number(second.ageMs);
          const source = xSourceName(second.source);
          add('xorders.whySecond', Number.isFinite(age) && age >= 0 ? tx('xorders.whySecondAgo', { source, s: Math.round(age / 1000) }) : source);
        }
        const hold = Number(r.holdSince);
        if (hold > 0) add('xorders.whyHold', untilText(Math.floor(hold / 1000)));
        if (r.block !== null && r.block !== undefined && (typeof r.block === 'number' || typeof r.block === 'string')) add(o.family === 'sol' ? 'xorders.whySlot' : 'xorders.whyBlock', String(r.block).slice(0, 24));
        const via = r.pool && typeof r.pool === 'object' && typeof r.pool.via === 'string' ? r.pool.via : '';
        if (via) {
          let host = via;
          try { host = new URL(via).host || via; } catch (_) { }
          add('xorders.whyNode', host.slice(0, 40));
        }
        $('.sw-line', body).textContent = X_WHYS.has(r.why) ? tx(`xorders.why.${r.why}`) : '';
      }
    };
  }

  function xEndStep(o) {
    const acts = xEndActs(o);
    if (!acts.length) return null;
    const title = `${amountText(o)} ${o.symbol}`;
    const label = { why: 'xorders.why', tx: 'swap.explorer', gas: 'xorders.gasBack', all: 'xorders.returnAll', again: 'xorders.placeAgain' };
    return {
      title,
      head: xHeadOf(o, title, xNetName(o.chain)),
      build(body, nav) {
        body.classList.add('sw-status', 'or-cancel');
        body.innerHTML = `
          <div class="sw-rows summary"></div>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            ${acts.map((act, i) => `<button class="btn btn--wide press${i ? ' btn--tinted' : ''}" type="button" data-xedit="${act}">${tx(label[act])}</button>`).join('')}
            ${passwordForm()}
          </div>`;
        const row = rowAdder(body);
        xPriceRows(o, row, false);
        if (o.got) row(tx('xorders.got'), `${sumText(T.fromUnits(o.got, o.outDec))} ${o.outSym}`);
        row(tx('xorders.net'), xNetName(o.chain));
        xWhereRows(o, row);
        const line = $('.sw-line', body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        const said = () => setLine(xViewOf(o).sub || '', 'note');
        said();
        const step = signStep(body, setLine);
        let busy = false;
        let alive = true;
        body.addEventListener('click', async (e) => {
          const button = alive && e.target.closest('[data-xedit]');
          if (!button || button.disabled || busy) return;
          const act = button.dataset.xedit;
          CK.haptic.light();
          if (act === 'why') {
            nav.push(xWhyStep(xCurrent(o)));
            return;
          }
          if (act === 'again') {
            const inst = xAgainInst(o);
            if (inst) nav.close(() => DemoNets.open(inst, 'sell', { orders: true, units: o.units }));
            return;
          }
          if (act === 'tx') {
            const link = DemoNets.txLink(o.chain, o.tx);
            if (link) T.openLink(link);
            return;
          }
          if (act === 'all') {
            nav.push(xReturnAllStep());
            return;
          }
          busy = true;
          button.disabled = true;
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            const went = await step.sign((options) => CK.evmOrders.sweep({ chain: o.chain, n: o.n }, options));
            if (!went) return;
            CK.haptic.success();
            xGasDone(o.id);
            button.hidden = true;
            setLine(tx('xorders.gasBackSent'), 'note');
          } catch (err) {
            if (err && err.code === 'no_gas') {
              xGasDone(o.id);
              button.hidden = true;
              setLine(tx('xorders.returnAllNone'), 'note');
            } else xEditTrouble(err, setLine, o);
          } finally {
            busy = false;
            button.disabled = false;
          }
        });
        return () => {
          alive = false;
          step.dispose();
        };
      }
    };
  }

  function xReturnAllStep() {
    if (!canSign()) {
      CK.toast(tx('swapSheet.noSign'), { icon: 'warning', tone: 'down' });
      return null;
    }
    const families = ['evm', 'sol'].filter((family) => xOpen(family) && typeof xLib(family).returnAll === 'function');
    if (!families.length) return null;
    const title = tx('xorders.returnAll');
    return {
      title,
      build(body) {
        body.classList.add('sw-status', 'or-cancel');
        body.innerHTML = `
          <p class="xo-text"></p>
          <p class="sw-line" role="status"></p>
          <div class="sw-actions or-actions">
            <button class="btn btn--wide press" type="button" data-xedit="all">${tx('xorders.returnAll')}</button>
            ${passwordForm()}
          </div>`;
        $('.xo-text', body).textContent = tx('xorders.returnAllText');
        const line = $('.sw-line', body);
        const go = $('[data-xedit]', body);
        const setLine = (text, tone) => {
          line.textContent = text;
          line.dataset.tone = tone || 'bad';
        };
        const step = signStep(body, setLine);
        let busy = false;
        go.addEventListener('click', async () => {
          if (busy) return;
          busy = true;
          go.disabled = true;
          setLine('', 'note');
          try {
            if (!(await CK.wallet.canSign())) {
              setLine(tx('swapSheet.noSign'));
              return;
            }
            let returned = 0, left = 0, unheard = false;
            for (const family of families) {
              let result = null;
              const went = await step.sign(async (options) => { result = await xLib(family).returnAll(options); });
              if (!went) return;
              const count = (list) => (Array.isArray(list) ? list.length : 0);
              returned += count(result && result.returned);
              left += count(result && (result.failed || result.left));
              if (!result || result.heard !== true) unheard = true;
            }
            CK.haptic.success();
            if (left) setLine(tx('xorders.returnAllLeft', { n: left }));
            else if (returned) setLine(tx('xorders.returnAllDone', { n: returned }), 'note');
            else setLine(tx(unheard ? 'xorders.returnAllUnheard' : 'xorders.returnAllNone'), unheard ? 'bad' : 'note');
            xRefresh();
          } catch (err) {
            xEditTrouble(err, setLine, { chain: '', family: '' });
          } finally {
            busy = false;
            go.disabled = false;
          }
        });
        return () => step.dispose();
      }
    };
  }

  function openXOrder(o) {
    if (CK.sheet.top) return;
    const step = o.state === 'active' || o.state === 'stale' ? xOrderStep(o) : X_LEFT.has(o.state) || xStuck(o) ? xCancelStep(o) : xEndActs(o).length ? xEndStep(o) : null;
    if (step) openSteps(step, o.symbol);
  }

  function openXPlaced(info) {
    if (CK.sheet.top || !info) return;
    let unfollow = null;
    CK.sheet.open({
      title: tx('xorders.placedTitle'),
      detents: ['fit'],
      onClose() {
        if (unfollow) unfollow();
      },
      build(body, sheet) {
        body.classList.add('sw-status', 'sw-status--receipt');
        sheet.el.classList.add('sw-receipt-sheet');
        const titleEl = $('.sheet-title', sheet.el);
        if (titleEl) titleEl.textContent = '';
        const R = window.DemoSwap && DemoSwap.receipt ? DemoSwap.receipt : null;
        body.innerHTML = `${R ? R.html : '<div class="sw-receipt"><p class="sw-receipt-title"></p></div>'}<div class="sw-rows summary"></div><div class="sw-actions"><button class="btn btn--wide press sw-done" type="button">${tx('common.done')}</button></div>`;
        const box = $('.sw-receipt', body);
        const o = { family: info.family, chain: info.chain, units: info.units, decimals: info.decimals, stopOut: info.stopOut || null, takeOut: info.takeOut || null, out: info.out.key, outKey: info.out.key, outSym: info.out.sym, outDec: info.out.decimals };
        const row = rowAdder(body);
        xPriceRows(o, row);
        row(tx('xorders.net'), xNetName(info.chain));
        row(tx('xorders.week'), tx('orders.lineShort'));
        const sub = `${D.qty(T.fromUnits(info.units, info.decimals))} ${info.symbol || ''}`.trim();
        const placedStates = new Set(['active', 'stale', 'firing', 'replacing', 'filled', 'missed', 'expired', 'retired']);
        const show = () => {
          const now = xorders.find((one) => one.id === info.orderId);
          const state = now ? now.state : 'funding';
          const not = (text) => ({ mark: 'close-circle', tone: 'down', final: true, title: tx('xorders.notPlacedTitle'), text: tx(text), sub });
          const view = placedStates.has(state) ? { mark: 'check-circle', tone: 'up', final: true, title: tx('xorders.placedTitle'), text: tx('xorders.placedText'), sub }
            : state === 'funding' || state === 'arming' ? { mark: 'spin', tone: 'hint', final: false, title: tx('xorders.placingTitle'), text: tx('xorders.placingText'), sub }
              : state === 'returning' || state === 'cancelling' ? not('xorders.notPlacedBack')
                : X_LEFT.has(state) ? not('xorders.notPlacedLeft') : not('xorders.notPlacedText');
          if (R) R.paint(box, view);
          else $('.sw-receipt-title', box).textContent = view.title;
        };
        show();
        followers.add(show);
        unfollow = () => followers.delete(show);
        if (!job) refresh();
        $('.sw-done', body).addEventListener('click', () => sheet.close());
      }
    });
  }

  function openList() {
    if (CK.sheet.top) return;
    openSteps({
      title: tx('orders.title'),
      list: true,
      build(body, nav) {
        body.classList.add('or-sheet');
        const view = { body, nav, shape: null };
        listView = view;
        paintList();
        const act = (e) => onRowAct(e, nav);
        body.addEventListener('click', act);
        body.addEventListener('keydown', (e) => {
          if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.getAttribute || e.target.getAttribute('role') !== 'button') return;
          e.preventDefault();
          act(e);
        });
        return () => { if (listView === view) listView = null; };
      }
    });
  }
  const ACTIONS = {
    cancel: (o, nav) => nav.push(cancelStep(o)),
    return: (o, nav) => nav.push(cancelStep(o)),
    manage: (o, nav) => nav.push(orderStep(o)),
    sell(o, nav) {
      if (DemoSwap.state !== 'open') return;
      const coin = coinOf(o);
      nav.close(() => DemoSwap.open(null, 'sell', { id: o.offer, sym: coin ? coin.sym : o.symbol, name: coin ? coin.name : o.symbol, inst: coin || undefined, logo: coin ? coin.logo : null, decimals: o.decimals }));
    },
    explorer(o) {
      T.openLink(o.explorer ? `${EXPLORER}transaction/${o.explorer}` : EXPLORER + T.wallet.friendly);
    },
    xmanage: (o, nav) => nav.push(xOrderStep(o)),
    xcancel: (o, nav) => nav.push(xCancelStep(o)),
    xended: (o, nav) => nav.push(xEndStep(o))
  };
  function onRowAct(e, nav) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'xall') {
      CK.haptic.light();
      nav.push(xReturnAllStep());
      return;
    }
    if (el.dataset.act === 'reload') {
      CK.haptic.light();
      failed = false;
      refresh();
      return;
    }
    const id = el.closest('[data-order]') && el.closest('[data-order]').dataset.order;
    const o = orders.concat(stranded).find((one) => one.id === id) || xorders.find((one) => one.id === id);
    if (!o || !ACTIONS[el.dataset.act]) return;
    CK.haptic.light();
    ACTIONS[el.dataset.act](o.x ? xCurrent(o) : current(o), nav);
  }
  function onSlotClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'reload') {
      failed = false;
      refresh();
      return;
    }
    if (el.dataset.act !== 'list') return;
    CK.haptic.light();
    openList();
  }

  function walletChanged() {
    orders = [];
    stranded = [];
    loaded = false;
    failed = false;
    shape = null;
    scannedFor = null;
    heldKey = null;
    cancelSent.clear();
    returnsSent.clear();
    xorders = [];
    xHeard = false;
    xCancelSent.clear();
    xRec = { wallet: null, any: false, job: null, at: 0, families: '' };
    clearTimeout(pollTimer);
    D.setOrdered([]);
    paint();
    changed();
    if (T.wallet) refresh();
  }
  let built = false;


  const X_HELD_AS = new Map([['base:0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', 'btc'], ['bsc:0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', 'xrp'], ['bsc:0xba2ae424d960c26247dd6c32edc70b295c744c43', 'doge']]);
  const xInstrument = (id) => (D.instruments && typeof D.instruments.get === 'function' ? D.instruments.get(id) || null : null);
  function xCoinOf(chain) {
    const sym = X_COIN[chain];
    if (!sym || chain === X_SOL) return null;
    const net = window.DemoNets && typeof DemoNets.chains === 'function' ? DemoNets.chains().find((one) => one.key === chain) : null;
    return xInstrument(`${chain}:${X_NATIVE}`) || xInstrument(`${chain}:${sym.toLowerCase()}`) || (net && net.inst) || null;
  }
  function xTokenOf(o) {
    const key = `${o.chain}:${o.token}`;
    const as = X_HELD_AS.get(key);
    if (as && D.byId[as]) return D.byId[as];
    const known = xInstrument(key);
    if (known) return known;
    if (typeof D.instrumentOf !== 'function' || !CK.market || typeof CK.market.cleanToken !== 'function') return null;
    const clean = CK.market.cleanToken({ id: key, network: o.chain, address: o.token, symbol: o.symbol, name: o.symbol, risk: 'none' });
    return clean ? D.instrumentOf(clean) : null;
  }
  function xHeldLinesOf(o) {
    const net = xNetName(o.chain);
    const lines = [];
    const coin = o.family === 'evm' && o.token === X_NATIVE ? xCoinOf(o.chain) : xTokenOf(o);
    if (coin && o.units > 0n) lines.push({ coin, units: o.units, decimals: o.decimals, net });
    if (o.family === 'evm' && typeof o.G === 'bigint' && o.G > 0n) {
      const gas = xCoinOf(o.chain);
      if (gas) lines.push({ coin: gas, units: o.G, decimals: 18, net });
    }
    return lines;
  }
  const X_HELD_RETRY_MS = 30000;
  const X_UNFUNDED = new Set(['cancelling', 'returning']);
  const xHeldSeen = new Map();
  let xHeldFor = null, xHeldAsked = 0, xHeldRead = null, xHeldAgain = false, xHeldRetryAt = 0, xHeldKey = '';
  const xReads = () => !!window.DemoNets && typeof DemoNets.loadBalances === 'function';
  function xHeldDown() {
    try {
      const names = window.DemoNets && typeof DemoNets.down === 'function' ? DemoNets.down() : [];
      return new Set(Array.isArray(names) ? names : []);
    } catch (_) {
      return new Set();
    }
  }
  function xHeldReread() {
    if (!xReads()) return;
    if (xHeldRead) {
      xHeldAgain = true;
      return;
    }
    xHeldAgain = false;
    const number = ++xHeldAsked;
    xHeldRead = Promise.resolve().then(() => {
      const probe = DemoNets.loadBalances(false);
      const job = DemoNets.loadBalances(true);
      if (job !== probe) return job;
      return Promise.resolve(job).catch(() => null).then(() => DemoNets.loadBalances(true));
    }).catch(() => null).then(() => {
      xHeldRead = null;
      const down = xHeldDown();
      xHeldSeen.forEach((seen) => {
        if (seen.wait === null || seen.wait > number) return;
        if (!down.has(seen.net)) {
          seen.wait = null;
          return;
        }
        seen.wait = xHeldAsked + 1;
        xHeldRetryAt = Date.now() + X_HELD_RETRY_MS;
      });
      if (xHeldAgain) xHeldReread();
      if (typeof D.recount === 'function') D.recount();
    });
  }
  function xHeld() {
    if (!xHeard) return [];
    const wallet = T.wallet ? T.wallet.address : null;
    const first = xHeldFor !== wallet;
    if (first) {
      xHeldSeen.clear();
      xHeldFor = wallet;
    }
    if (!xorders.length && !xHeldSeen.size) {
      xHeldKey = '';
      return [];
    }
    const reads = xReads();
    const next = reads ? xHeldAsked + 1 : null;
    const listed = new Set();
    const lines = [];
    const counted = [];
    let moved = false;
    xorders.forEach((o) => {
      listed.add(o.id);
      let seen = xHeldSeen.get(o.id);
      const unfunded = X_UNFUNDED.has(o.state) && !!seen && (seen.state === 'funding' || (seen.unfunded && seen.state === o.state));
      const holds = X_HOLDS.has(o.state) && !unfunded;
      if (!seen) {
        seen = { holds, base: first && holds, state: o.state, unfunded, net: xNetName(o.chain), wait: first || !holds ? null : next };
        xHeldSeen.set(o.id, seen);
        if (seen.wait !== null) moved = true;
      } else {
        if (seen.holds !== holds) {
          if (seen.wait === null) seen.base = seen.holds;
          seen.wait = next;
          moved = true;
        } else if (seen.unfunded && !unfunded && reads) {
          moved = true;
        }
        seen.holds = holds;
        seen.state = o.state;
        seen.unfunded = unfunded;
      }
      if (seen.wait === null ? holds : seen.base) {
        xHeldLinesOf(o).forEach((line) => lines.push(line));
        counted.push(`${o.id}:${o.units}:${o.G}`);
      }
    });
    xHeldSeen.forEach((_, id) => { if (!listed.has(id)) xHeldSeen.delete(id); });
    xHeldKey = counted.join();
    const stale = !moved && !xHeldRead && Date.now() >= xHeldRetryAt && Array.from(xHeldSeen.values()).some((seen) => seen.wait !== null);
    if (moved || stale) xHeldReread();
    return lines;
  }
  function xHeldListed() {
    const before = xHeldKey;
    xHeld();
    if (xHeldKey !== before && typeof D.recount === 'function') D.recount();
  }

  window.DemoOrders = {
    GRAM_NEEDED,
    GAS_ON_ORDER,
    attach,
    figures: (raw) => {
      const o = cleanOrder(raw);
      return o ? figuresOf(o) : null;
    },
    place,
    openPlaced,
    forToken,
    drawable: (offer) => {
      const raw = rawOf(offer);
      return !!raw && !isUsdt(raw) && CK.swapAudit.orderOffer(raw);
    },
    check,
    canPlace,
    maxUnits: capOf,
    answer: checked,
    refused,
    asked,
    okLately: (raw) => !!okLately(raw),
    maxOut: maxOutOf,
    open(id) {
      const o = orders.find((one) => one.id === id);
      if (o && o.state === 'active') openOrder(o);
      else if (!o) {
        const xo = xorders.find((one) => one.id === id);
        if (xo) openXOrder(xo);
      }
    },
    editable: (raw) => {
      const o = cleanOrder(raw);
      return o ? { rearm: rearmable(o), soon: expiresSoon(o), view: viewOf(o) } : null;
    },
    feeTerms: (raw) => {
      const o = cleanOrder(raw);
      return o ? feeTerms(o) : null;
    },
    follow(fn) {
      followers.add(fn);
      if (!job) refresh();
      return () => { followers.delete(fn); };
    },
    reason: reasonOf,
    trouble: troubleOf,
    x: {
      open: xOpen,
      family: xFamily,
      outs: xOutKeys,
      outOf: xOutOf,
      outUsd: xOutUsd,
      netName: xNetName,
      check: xCheck,
      answer: xAnswer,
      trouble: xTrouble,
      place: xPlace,
      quote: xQuote,
      floors: xFloors,
      outAt: xOutAt,
      placed: openXPlaced,
      resendSetup: xResendSetup,
      held: xHeld,
      refresh: xRefresh,
      FEE_BPS: X_FEE_BPS,
      view: (raw, family) => {
        const o = cleanX(raw, family);
        return o ? { order: o, view: xViewOf(o), flag: xFlagOf(o), figures: o.state === 'active' ? xFiguresOf(o) : null, acts: xEndActs(o) } : null;
      },
      codes: () => ({ ...X_TROUBLES })
    },
    mount(section, shown, moved) {
      if (!built) {
        built = true;
        T.onWallet(walletChanged);
      }
      shownFn = shown;
      movedFn = moved;
      if (section !== slot) {
        slot = section;
        shape = null;
        slot.addEventListener('click', onSlotClick);
      }
      paint();
      if (!loaded && !job) refresh();
    },
    refresh
  };
})();
