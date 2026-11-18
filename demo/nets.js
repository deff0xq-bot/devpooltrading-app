(function () {
  'use strict';
  const { fmt, icon, clamp, t: tx } = CK;
  const T = CK.ton;
  const E = CK.evm;
  const Audit = CK.swapAudit;
  const D = window.DemoData;
  const $ = (s, r) => (r || document).querySelector(s);

  const PENDING_KEY = 'ck-xnet-pending';
  const NATIVE = 'TON';
  const USDT_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const GRAM_DECIMALS = 9;
  const USDT_DECIMALS = 6;
  const USDT_SWAP_ROOM = 50000000n;
  const SWAP_QUOTE_MARGIN_MS = 8000;
  const SWAP_BUILT_MAX_AGE_MS = 20000;
  const WEI_DECIMALS = 18;
  const PAY_RESERVE = 100000000n;
  const BALANCES_MS = 30000;
  const RELAY_PRICE_MS = 60000;
  const QUOTE_DELAY_MS = 150;
  const TYPE_PAUSE_MS = 400;
  const AFTER_RISE_MS = 350;
  const QUOTE_GAP_MS = 2500;
  const QUOTE_RETRY_MS = 5000;
  const QUOTE_LIFE_MS = 27000;
  const QUOTE_REFRESH_MS = 22000;
  const LOSS_WARN_PCT = 3;
  const POLL_MS = 4000;
  const POLL_FIRST_MS = [1000, 1500, 2000, 3000];
  const pollAfter = (age) => {
    let at = 0;
    for (const step of POLL_FIRST_MS) {
      at += step;
      if (age < at) return step;
    }
    return POLL_MS;
  };
  const POLL_SLOW_MS = 15000;
  const SLOW_AFTER_MS = 5 * 60 * 1000;
  const GIVE_UP_AFTER_MS = 30 * 60 * 1000;
  const SALE_GIVE_UP_MS = 10 * 60 * 1000;
  const EXPIRY_MARGIN_S = 15;
  const LOST_GRACE_S = 30;
  const TON_EXPLORER = 'https://tonviewer.com/';
  const EVM_EXPLORER = {
    eth: 'https://etherscan.io/tx/', base: 'https://basescan.org/tx/', arbitrum: 'https://arbiscan.io/tx/', bsc: 'https://bscscan.com/tx/', polygon: 'https://polygonscan.com/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/', avalanche: 'https://snowtrace.io/tx/', ink: 'https://explorer.inkonchain.com/tx/', monad: 'https://monadvision.com/tx/', unichain: 'https://uniscan.xyz/tx/',
    solana: 'https://solscan.io/tx/', tron: 'https://tronscan.org/#/transaction/'
  };
  const GAS_COIN = { eth: 'ETH', base: 'ETH', arbitrum: 'ETH', bsc: 'BNB', polygon: 'POL', optimism: 'ETH', avalanche: 'AVAX', ink: 'ETH', monad: 'MON', unichain: 'ETH', solana: 'SOL', tron: 'TRX' };
  const OWN = {
    solana: { name: 'Solana', net: 'sol', decimals: 9, lib: CK.sol, trades: true, minAddress: 43, noAddress: 'no_sol_address' },
    tron: { name: 'Tron', net: 'tron', decimals: 6, lib: CK.tron, trades: false, deposit: false, minAddress: 34, noAddress: 'no_tron_address' }
  };
  const OWN_KEYS = Object.keys(OWN).filter((key) => !!OWN[key].lib);
  const libOf = (chain) => (OWN[chain] ? OWN[chain].lib : E);
  const gasDecimals = (chain) => (OWN[chain] ? OWN[chain].decimals : WEI_DECIMALS);
  const nativeAddress = (chain) => (OWN[chain] ? OWN[chain].lib.native : NATIVE_ADDRESS);
  const SOL_MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const SOL_KEEP = 1100000n;
  const TRX_ID = 'tron:TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR';
  const STABLE = new Map([['tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'usdt'], ['solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'usdc'], ['solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'usdt']]);
  const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
  const EVM_ADDRESS = /^0x[0-9a-f]{40}$/;
  const RELAY_BUSY = /could not process/i;
  const CONFIG_RETRY_MS = 5000;
  const GAS_BUY_USD = 1;
  let foldIds = 0;
  const pinHeight = (o, sheet, floor, room) => (window.DemoSwap && typeof DemoSwap.pinHeight === 'function' ? DemoSwap.pinHeight(o, sheet, floor, undefined, room) : 0);
  const SKEL = '<i class="skel sw-val-skel" aria-hidden="true"></i>';
  const holdOrSkel = (el) => { if (el && !el.textContent && !el.querySelector('.skel')) el.innerHTML = SKEL; };
  const skelOn = (el) => { if (el && !el.querySelector('.skel')) el.innerHTML = SKEL; };
  const formFloor = () => (window.DemoSwap && DemoSwap.FORM_FLOOR_PX > 0 ? DemoSwap.FORM_FLOOR_PX : 0);
  const reveal = (sheet, toggle, box) => { if (window.DemoSwap && typeof DemoSwap.reveal === 'function') DemoSwap.reveal(sheet, toggle, box); };
  const edgeFade = (body) => { if (window.DemoSwap && typeof DemoSwap.edgeFade === 'function') DemoSwap.edgeFade(body); };
  const receipt = () => (window.DemoSwap && DemoSwap.receipt) || null;
  const sig4 = (v, down) => (receipt() ? receipt().sig4(v, down) : D.qty(v));
  const ETH_SHOWN_WEI = 500000000000000n;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { } }
  };

  const LISTED = new Map(E.tokens().map((token) => [`${token.chain}:${token.address}`, token]));
  const CHAIN_KEYS = new Set(E.pins().chains.map((chain) => chain.key));
  const seen = new Map();
  const COIN_NATIVE = { sol: 'solana', eth: 'base', bnb: 'bsc' };
  const COIN_TOKEN = {
    btc: ['base:0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', 'cbBTC · Base'],
    xrp: ['bsc:0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', 'Binance-Peg · BNB Chain'],
    doge: ['bsc:0xba2ae424d960c26247dd6c32edc70b295c744c43', 'Binance-Peg · BNB Chain']
  };
  const COIN_OF_TOKEN = new Map(Object.keys(COIN_TOKEN).map((id) => [COIN_TOKEN[id][0], id]));
  function coinListing(inst) {
    const chain = COIN_NATIVE[inst.id];
    if (chain === 'solana') return OWN.solana.lib ? { chain, chainName: OWN.solana.name, address: OWN.solana.lib.native, symbol: inst.sym, name: inst.name, decimals: OWN.solana.decimals, coin: true } : null;
    if (chain) return CHAIN_KEYS.has(chain) ? { chain, chainName: chainNameOf(chain), address: NATIVE_ADDRESS, symbol: inst.sym, name: inst.name, decimals: WEI_DECIMALS, coin: true } : null;
    const [key, label] = COIN_TOKEN[inst.id] || [];
    return LISTED.has(key) ? { ...LISTED.get(key), alias: true, label } : null;
  }
  function listingOf(inst) {
    if (inst && !inst.isToken && D.byId[inst.id] === inst) return coinListing(inst);
    if (!inst || !inst.isToken || typeof inst.id !== 'string') return null;
    if (inst.id.startsWith('solana:') && OWN.solana.lib) {
      const mint = inst.id.slice(7);
      if (!SOL_MINT.test(mint) || mint === OWN.solana.lib.native) return null;
      const known = seen.get(inst.id);
      if ((inst.token && inst.token.risk === 'suspicious') || (known && known.risk === 'suspicious')) return null;
      return { chain: 'solana', chainName: OWN.solana.name, address: mint, symbol: inst.sym, name: inst.name, decimals: known ? known.decimals : null, open: true };
    }
    const id = inst.id.toLowerCase();
    const listed = LISTED.get(id);
    if (listed) return listed;
    const at = id.indexOf(':');
    const chain = id.slice(0, at), address = id.slice(at + 1);
    if (!CHAIN_KEYS.has(chain) || !EVM_ADDRESS.test(address)) return null;
    if (address === NATIVE_ADDRESS) return { chain, chainName: chainNameOf(chain), address: NATIVE_ADDRESS, symbol: GAS_COIN[chain] || 'ETH', name: inst.name, decimals: WEI_DECIMALS, coin: true, saleCheck: true, own: true };
    const known = seen.get(id) || REFUNDS.get(id);
    if ((inst.token && inst.token.risk === 'suspicious') || (known && known.risk === 'suspicious')) return null;
    return { chain, chainId: null, chainName: chainNameOf(chain), address, symbol: inst.sym, name: inst.name, decimals: known ? known.decimals : null, open: true };
  }
  const networkOf = (inst) => (inst && inst.isToken && typeof inst.id === 'string' && inst.id.indexOf(':') > 0 ? inst.id.slice(0, inst.id.indexOf(':')).toLowerCase() : null);
  function pinName(inst) {
    const listing = listingOf(inst);
    if (listing && !listing.coin && !listing.alias) {
      inst.sym = listing.symbol;
      inst.name = listing.name;
    }
    return listing;
  }
  const REFUNDS = new Map();
  E.pins().chains.forEach((chain) => chain.refund.forEach((token) => REFUNDS.set(`${chain.key}:${token.address}`, { ...token, chain: chain.key, chainName: chain.name })));
  const PINNED_LOGO = new Map([['USDT', 'usdt'], ['USDC', 'usdc'], ['WETH', 'eth']]);
  const pinLogo = (id, name) => { if (CK.COIN_LOGOS[name]) CK.COIN_LOGOS[id] = CK.COIN_LOGOS[name]; };
  [...LISTED, ...REFUNDS].forEach(([key, token]) => pinLogo(key, PINNED_LOGO.get(token.symbol)));
  STABLE.forEach((name, key) => pinLogo(key, name));
  pinLogo(TRX_ID, 'trx');
  const NET_MARK = {
    ton: 'ton', eth: 'eth', base: 'net-base', arbitrum: 'net-arbitrum', bsc: 'bnb', polygon: 'pol',
    optimism: 'net-optimism', avalanche: 'net-avalanche', ink: 'net-ink', monad: 'net-monad', unichain: 'net-unichain',
    solana: 'sol', tron: 'trx'
  };
  const netMark = (key) => (Object.prototype.hasOwnProperty.call(NET_MARK, key) ? CK.COIN_LOGOS[NET_MARK[key]] || `kit/logos/${NET_MARK[key]}.svg` : null);

  let cfg = null, ctx = null;
  const subs = new Set();
  const emit = () => subs.forEach((fn) => {
    try { fn(); } catch (err) { console.error(err); }
  });
  const sameWallet = (rec) => !!(rec && T.wallet && rec.wallet === T.wallet.address);
  const gramOf = () => ({ sym: D.byId.ton.sym, decimals: GRAM_DECIMALS, inst: D.byId.ton });
  function shakePass(el, buzz) {
    if (buzz) CK.haptic.error();
    if (!el || !el.animate || CK.reducedMotion()) return;
    el.animate([{ transform: 'none' }, { transform: 'translate3d(-8px,0,0)' }, { transform: 'translate3d(7px,0,0)' }, { transform: 'translate3d(-5px,0,0)' }, { transform: 'translate3d(3px,0,0)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
  }
  const pctText = (bps) => `${fmt.num(bps / 100, bps % 100 ? (bps % 10 ? 2 : 1) : 0)}${CK.i18n.lang === 'en' ? '' : '\u00a0'}%`;
  const qtySym = (units, asset) => `${D.qty(T.fromUnits(units, asset.decimals))} ${asset.sym}`;
  const worthText = (asset, amount) => (window.DemoSwap ? DemoSwap.worthText(asset, amount) : '');
  const withWorth = (b, worth) => { if (window.DemoSwap) DemoSwap.withWorth(b, worth); };
  const fieldText = (v) => (v > 0 ? D.qty(v).replace(/\s/g, '') : '');
  const flipIn = (chip) => {
    if (CK.reducedMotion() || !chip.animate) return;
    [...chip.children].forEach((el, i) => el.animate([{ opacity: 0, transform: 'translate3d(0,8px,0) scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 30, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
  };

  const BOUGHT_KEY = 'ck-xnet-bought';
  const KNOWN_MAX = 40;
  function boughtList() {
    try {
      const list = JSON.parse(store.get(BOUGHT_KEY) || '[]');
      return Array.isArray(list) ? list.filter((key) => typeof key === 'string' && /^[a-z]+:0x[0-9a-f]{40}$|^solana:[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key)) : [];
    } catch (_) {
      return [];
    }
  }
  const BOUGHT_CLOUD_KEY = 'xnetBought';
  function boughtCloud() {
    try {
      const app = CK.tg.app;
      return app && app.CloudStorage && app.isVersionAtLeast && app.isVersionAtLeast('6.9') ? app.CloudStorage : null;
    } catch (_) {
      return null;
    }
  }
  function writeBought(list) {
    store.set(BOUGHT_KEY, JSON.stringify(list));
    const cloud = boughtCloud();
    try {
      if (cloud) cloud.setItem(BOUGHT_CLOUD_KEY, JSON.stringify(list), () => {});
    } catch (_) { }
  }
  let boughtSynced = false;
  function syncBought() {
    const cloud = boughtCloud();
    if (boughtSynced || !cloud) return;
    boughtSynced = true;
    try {
      cloud.getItem(BOUGHT_CLOUD_KEY, (err, value) => {
        if (err) return;
        let theirs = [];
        try { theirs = JSON.parse(value || '[]'); } catch (_) { }
        const mine = boughtList();
        store.set(BOUGHT_KEY, JSON.stringify(mine.concat(Array.isArray(theirs) ? theirs : [])));
        const all = Array.from(new Set(boughtList())).slice(0, KNOWN_MAX);
        if (JSON.stringify(all) !== value) writeBought(all);
        else store.set(BOUGHT_KEY, value);
        if (all.length === mine.length || !T.wallet) return;
        nets.at = 0;
        const again = () => loadBalances(true);
        (nets.job || Promise.resolve()).then(again, again);
      });
    } catch (_) { }
  }
  function rememberBought(chain, address) {
    const key = `${chain}:${address}`;
    if (address === NATIVE_ADDRESS || address === nativeAddress(chain) || LISTED.has(key) || REFUNDS.has(key)) return;
    writeBought([key, ...boughtList().filter((one) => one !== key)].slice(0, KNOWN_MAX));
  }
  function knownTokens() {
    const keys = [];
    const add = (key) => {
      const at = key.indexOf(':');
      if (keys.length >= KNOWN_MAX || keys.includes(key) || LISTED.has(key) || REFUNDS.has(key)) return;
      if (!CHAIN_KEYS.has(key.slice(0, at)) || !EVM_ADDRESS.test(key.slice(at + 1)) || key.slice(at + 1) === NATIVE_ADDRESS) return;
      keys.push(key);
    };
    boughtList().forEach(add);
    seen.forEach((one, key) => { if (one.risk !== 'suspicious') add(key); });
    D.instruments.forEach((inst, key) => {
      if (typeof key === 'string' && !(inst && inst.token && inst.token.risk === 'suspicious')) add(key.toLowerCase());
    });
    const out = {};
    keys.forEach((key) => {
      const at = key.indexOf(':');
      (out[key.slice(0, at)] = out[key.slice(0, at)] || []).push(key.slice(at + 1));
    });
    return out;
  }
  function knownOn(chain) {
    const out = [];
    const add = (key) => {
      if (out.length < KNOWN_MAX && key.startsWith(chain + ':') && !out.includes(key.slice(chain.length + 1))) out.push(key.slice(chain.length + 1));
    };
    boughtList().forEach(add);
    seen.forEach((one, key) => { if (one.risk !== 'suspicious') add(key); });
    D.instruments.forEach((inst, key) => {
      if (typeof key === 'string' && !(inst && inst.token && inst.token.risk === 'suspicious')) add(key);
    });
    return out.filter((one) => one !== nativeAddress(chain));
  }

  const nets = { evm: undefined, own: {}, native: new Map(), held: new Map(), refunds: new Map(), down: new Set(), at: 0, job: null };
  let ownReadFor = null;
  function clearNets() {
    nets.evm = undefined;
    nets.own = {};
    ownReadFor = null;
    nets.native.clear();
    nets.held.clear();
    nets.refunds.clear();
    nets.down.clear();
    seen.clear();
    nets.at = 0;
    D.setNets([]);
  }
  const FEED_COIN = new Set(['optimism', 'avalanche', 'ink', 'monad', 'unichain']);
  const GAS_NAME = { AVAX: 'Avalanche', MON: 'Monad' };
  FEED_COIN.forEach((chain) => pinLogo(`${chain}:${NATIVE_ADDRESS}`, String(GAS_COIN[chain] || 'ETH').toLowerCase()));

  function ethOf(chain) {
    const sym = GAS_COIN[chain] || 'ETH';
    const market = D.byId[sym.toLowerCase()];
    const name = market ? market.name : GAS_NAME[sym] || sym;
    if (FEED_COIN.has(chain)) {
      const feedId = `${chain}:${NATIVE_ADDRESS}`;
      let listed = D.instruments.get(feedId);
      if (!listed) {
        const clean = CK.market.cleanToken({ id: feedId, network: chain, address: NATIVE_ADDRESS, symbol: sym, name, risk: 'none' });
        listed = clean ? D.instrumentOf(clean) : null;
      }
      if (listed) {
        listed.sym = sym;
        listed.name = name;
        if (!(listed.price > 0)) {
          if (market && market.price > 0) listed.price = market.price;
          else feedGasPrice(chain, listed);
        }
        return listed;
      }
    }
    const id = `${chain}:${sym.toLowerCase()}`;
    let coin = D.instruments.get(id);
    if (!coin) {
      coin = { id, isToken: true, neutral: true, viewOnly: true, gas: true, sym, name, color: 'hsl(230 40% 55%)', price: null, change: null, logo: CK.COIN_LOGOS[sym.toLowerCase()] || null, token: { id, symbol: sym, name, risk: 'none', change24h: null } };
      D.instruments.set(id, coin);
    }
    if (market && market.price > 0) coin.price = market.price;
    else feedGasPrice(chain, coin);
    return coin;
  }
  function ownCoinChain(inst) {
    if (!inst || !inst.isToken || typeof inst.id !== 'string') return null;
    const at = inst.id.indexOf(':');
    const chain = inst.id.slice(0, at);
    if (!CHAIN_KEYS.has(chain)) return null;
    return inst.id.slice(at + 1) === NATIVE_ADDRESS || (inst.gas === true && inst.viewOnly === true) ? chain : null;
  }
  function marketCoinOf(inst) {
    const chain = ownCoinChain(inst);
    return (chain && D.byId[String(GAS_COIN[chain] || 'ETH').toLowerCase()]) || null;
  }
  const gasPriceAsked = new Map();
  function feedGasPrice(chain, coin) {
    const id = `${chain}:${NATIVE_ADDRESS}`;
    const row = D.instruments.get(id);
    if (row && row.price > 0) {
      coin.price = row.price;
      return;
    }
    if (!CK.market || typeof CK.market.tokenPrices !== 'function' || Date.now() - (gasPriceAsked.get(chain) || 0) < 60000) return;
    gasPriceAsked.set(chain, Date.now());
    CK.market.tokenPrices([id]).then((rows) => {
      const got = (rows || []).find((one) => one && one.id === id);
      if (got && got.price > 0) coin.price = got.price;
    }, () => { });
  }
  function nativeCoinOf(chain) {
    const home = Object.keys(COIN_NATIVE).find((id) => COIN_NATIVE[id] === chain);
    if (home && D.byId[home]) return D.byId[home];
    if (chain !== 'tron') return ethOf(chain);
    let coin = D.instruments.get(TRX_ID);
    if (!coin) {
      const clean = CK.market.cleanToken({ id: TRX_ID, network: 'tron', address: TRX_ID.slice(5), symbol: 'TRX', name: 'TRON', risk: 'none' });
      coin = clean ? D.instrumentOf(clean) : null;
    }
    return coin;
  }
  function publish() {
    const lines = [];
    nets.held.forEach((units, key) => {
      const token = LISTED.get(key) || seen.get(key);
      if (!token || !(units > 0n)) return;
      const flagged = token.risk === 'suspicious';
      const home = flagged ? null : D.byId[COIN_OF_TOKEN.get(key)];
      if (home) {
        lines.push({ coin: home, units, decimals: token.decimals, net: chainNameOf(token.chain) });
        return;
      }
      const clean = CK.market.cleanToken({ id: key, network: token.chain, address: token.address, symbol: token.symbol, name: token.name, risk: flagged ? 'suspicious' : 'none' });
      const known = D.instruments.get(key);
      const coin = known || (clean ? D.instrumentOf(clean) : null);
      if (coin) {
        pinName(coin);
        if (flagged && coin.token && (coin.token.risk !== 'suspicious' || !known)) {
          if (coin.token.riskBefore === undefined) coin.token.riskBefore = known ? coin.token.risk : 'none';
          coin.token.risk = 'suspicious';
        } else if (!flagged && coin.token && coin.token.riskBefore !== undefined) {
          coin.token.risk = coin.token.riskBefore;
          delete coin.token.riskBefore;
        }
        if (STABLE.has(key) && !(coin.price > 0)) coin.price = 1;
        lines.push({ coin, units, decimals: token.decimals, net: chainNameOf(token.chain) });
      }
    });
    nets.refunds.forEach((units, key) => {
      const token = REFUNDS.get(key);
      if (!token || !(units > 0n)) return;
      const clean = CK.market.cleanToken({ id: key, network: token.chain, address: token.address, symbol: token.symbol, name: token.name, risk: 'none' });
      const coin = clean ? D.instrumentOf(clean) : null;
      if (!coin) return;
      coin.sym = token.symbol;
      coin.name = token.name;
      if (!(coin.price > 0)) coin.price = 1;
      lines.push({ coin, units, decimals: token.decimals, net: token.chainName });
    });
    nets.native.forEach((wei, chain) => {
      const bought = OWN[chain] || Object.values(COIN_NATIVE).includes(chain) || Object.prototype.hasOwnProperty.call(D.byId, String(GAS_COIN[chain] || '').toLowerCase());
      if (bought ? !(wei > 0n) : wei < ETH_SHOWN_WEI) return;
      const coin = nativeCoinOf(chain);
      if (coin) lines.push({ coin, units: wei, decimals: gasDecimals(chain), net: chainNameOf(chain) });
    });
    D.setNets(lines);
    emit();
  }
  function loadBalances(force) {
    const wallet = T.wallet;
    if (!wallet) return Promise.resolve();
    syncBought();
    if (nets.job) return nets.job;
    if (!force && Date.now() - nets.at < BALANCES_MS) return Promise.resolve();
    const still = () => !!T.wallet && T.wallet.address === wallet.address;
    const landed = () => { if (still()) publish(); };
    const down = new Set();
    const bought = new Set(boughtList());
    const riskOf = (key, flagged) => (flagged && !bought.has(key) ? 'suspicious' : 'none');
    const forget = (chain) => [nets.held, nets.refunds].forEach((map) => Array.from(map.keys()).forEach((key) => { if (key.startsWith(chain + ':')) map.delete(key); }));
    const derived = CK.wallet.othersReady().catch(() => null);
    const own = OWN_KEYS.map((chain) => derived.then(() => OWN[chain].lib.address()).then((address) => {
      if (!still()) return null;
      nets.own[chain] = address || null;
      return address ? OWN[chain].lib.balances(knownOn(chain)) : null;
    }).then((answer) => {
      if (!answer || !still()) return;
      forget(chain);
      nets.native.set(chain, answer.native);
      answer.held.forEach((token) => {
        const key = `${chain}:${token.address}`;
        nets.held.set(key, token.units);
        if (Number.isInteger(token.decimals)) seen.set(key, { chain, address: token.address, symbol: token.symbol || '?', name: token.name || token.symbol || '?', decimals: token.decimals, program: token.program || null, risk: riskOf(key, token.flagged) });
      });
      landed();
    }, (err) => {
      if (err && err.code === OWN[chain].noAddress) return;
      console.error(err);
      down.add(chain);
    }));
    const evmJob = E.address().then((evm) => {
      if (!still()) return null;
      nets.evm = evm || null;
      return evm ? E.balances(knownTokens()) : null;
    }).then((answer) => {
      if (!still() || !answer) return;
      answer.chains.forEach((row) => {
        if (row.error) {
          down.add(row.chain);
          return;
        }
        forget(row.chain);
        nets.native.set(row.chain, row.native);
        row.tokens.forEach((token) => nets.held.set(`${row.chain}:${token.address}`, token.units));
        (row.held || []).forEach((token) => {
          const key = `${row.chain}:${token.address}`;
          nets.held.set(key, token.units);
          if (Number.isInteger(token.decimals)) seen.set(key, { chain: row.chain, address: token.address, symbol: token.symbol || '?', name: token.name || token.symbol || '?', decimals: token.decimals, risk: riskOf(key, token.flagged) });
        });
        (row.refund || []).forEach((token) => nets.refunds.set(`${row.chain}:${token.address}`, token.units));
      });
      landed();
    }, (err) => {
      if (err && err.code !== 'no_evm_address') {
        console.error(err);
        E.pins().chains.forEach((chain) => down.add(chain.key));
      }
    });
    nets.job = Promise.all([evmJob, ...own]).then(() => {
      if (!still()) return;
      ownReadFor = wallet.address;
      nets.at = Date.now();
      nets.down = down;
      publish();
      priceHeld();
    }).finally(() => { nets.job = null; });
    return nets.job;
  }
  const ownRefused = new Set();
  let ownOpening = false;
  function ownMissing() {
    const wallet = T.wallet;
    const status = CK.wallet.status;
    if (!wallet || wallet.readOnly || status.kind !== 'signer' || status.mismatch || status.legacy || status.method === 'keychain' || ownRefused.has(wallet.address) || ownReadFor !== wallet.address) return [];
    return OWN_KEYS.filter((chain) => Object.prototype.hasOwnProperty.call(nets.own, chain) && nets.own[chain] === null);
  }
  async function unlockOwn(wallet, options) {
    for (const chain of ownMissing()) {
      await CK.wallet.othersReady().catch(() => null);
      if (!T.wallet || T.wallet.address !== wallet.address) return;
      if (await OWN[chain].lib.address()) continue;
      await CK.wallet.netAddress(OWN[chain].net, { unlock: true, ...options });
    }
  }
  async function afterOwn() {
    ownOpening = false;
    await loadBalances(true).catch(() => null);
    emit();
  }
  async function openOwn() {
    if (ownOpening || !ownMissing().length) return;
    if (CK.wallet.status.method === 'password') {
      askOwnPassword();
      return;
    }
    const wallet = T.wallet;
    ownOpening = true;
    emit();
    try {
      await unlockOwn(wallet, {});
    } catch (err) {
      if (err && err.code === 'ton_only') ownRefused.add(wallet.address);
      else if (!CK.wallet.isRejection(err)) {
        console.error(err);
        CK.toast(tx('wallet.unlockFail'), { icon: 'warning', tone: 'down' });
      }
    } finally {
      await afterOwn();
    }
  }
  function askOwnPassword() {
    if (CK.sheet.top) return;
    const wallet = T.wallet;
    CK.haptic.light();
    CK.sheet.open({
      title: tx('swapSheet.password'),
      detents: ['fit'],
      build(b, sheet) {
        b.innerHTML = `
          <div class="fg-page">
            <p class="fg-title"></p>
            <form class="sw-pass"><input class="sw-pass-input" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" enterkeyhint="done"><button class="btn press" type="submit">${icon('check', { size: 22 })}</button></form>
            <p class="fg-line" role="alert" hidden></p>
          </div>`;
        $('.fg-title', b).textContent = tx('xnet.ownPassword');
        const form = $('.sw-pass', b), input = $('.sw-pass-input', b), go = $('.btn', form), line = $('.fg-line', b);
        input.placeholder = tx('swapSheet.password');
        input.setAttribute('aria-label', tx('swapSheet.password'));
        go.setAttribute('aria-label', tx('xnet.ownOpen'));
        const say = (key) => {
          line.textContent = key ? tx(key) : '';
          line.hidden = !key;
        };
        setTimeout(() => { if (b.isConnected) input.focus({ preventScroll: true }); }, 0);
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (ownOpening) return;
          let password = input.value;
          input.value = '';
          if (!password) {
            say('swapSheet.password');
            return;
          }
          if (!T.wallet || T.wallet.address !== wallet.address) {
            sheet.close();
            return;
          }
          ownOpening = true;
          go.disabled = true;
          say('');
          emit();
          let stay = false;
          try {
            await unlockOwn(wallet, { password });
            CK.haptic.success();
          } catch (err) {
            if (err && err.code === 'wrong_password') {
              stay = true;
              say('swapSheet.passwordWrong');
              shakePass(form, true);
            } else if (err && err.code === 'ton_only') ownRefused.add(wallet.address);
            else if (!CK.wallet.isRejection(err)) {
              console.error(err);
              CK.toast(tx('wallet.unlockFail'), { icon: 'warning', tone: 'down' });
            }
          } finally {
            password = undefined;
            go.disabled = false;
            if (!stay) sheet.close();
            else if (b.isConnected) input.focus({ preventScroll: true });
            await afterOwn();
          }
        });
      }
    });
  }

  const relayPriced = new Map();
  let pricing = false;
  async function ensurePrice(inst) {
    const listing = listingOf(inst) || ownToken(inst);
    if (!listing || listing.coin || listing.alias || !ctx) return false;
    const at = relayPriced.get(inst.id);
    if (inst.price > 0 && at === undefined) return false;
    if (at && Date.now() - at < RELAY_PRICE_MS) return false;
    try {
      const { token } = await CK.market.tokenItem(inst.id);
      if (token && token.price > 0) relayPriced.delete(inst.id);
      D.applyToken(inst, token);
      ctx.paintCoin(inst, true);
      return false;
    } catch (_) { }
    relayPriced.set(inst.id, Date.now());
    if (OWN[listing.chain]) return false;
    const price = await E.price(listing.chain, listing.address).catch(() => null);
    if (price) {
      const before = inst.price;
      D.applyToken(inst, { ...inst.token, price });
      ctx.paintCoin(inst, !(price < before));
    }
    return true;
  }
  const ownToken = (inst) => (inst && typeof inst.id === 'string' && inst.id.startsWith('tron:') ? { chain: 'tron', address: inst.id.slice(5) } : null);
  async function priceHeld() {
    if (pricing) return;
    pricing = true;
    try {
      const trx = nets.native.get('tron') > 0n ? nativeCoinOf('tron') : null;
      const held = Array.from(nets.held).filter(([, units]) => units > 0n).map(([key]) => D.instruments.get(key)).filter(Boolean);
      for (const inst of trx ? [trx, ...held] : held) {
        const before = inst.price;
        if (await ensurePrice(inst)) {
          publish();
          await new Promise((resolve) => setTimeout(resolve, QUOTE_GAP_MS));
        } else if (inst.price !== before) publish();
      }
    } finally {
      pricing = false;
    }
  }
  function withListed(params, signal) {
    const job = CK.market.tokens(params, signal);
    const q = String(params.q || '').trim().toLowerCase();
    if (!q || params.cursor) return job;
    const found = E.tokens().filter((t) => (params.network === 'all' || t.chain === params.network) && (t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.address === q));
    if (!found.length) return job;
    return job.then((res) => {
      const have = new Set(res.tokens.map((t) => t.id.toLowerCase()));
      const extra = found.filter((t) => !have.has(`${t.chain}:${t.address}`)).map((t) => CK.market.cleanToken({ id: `${t.chain}:${t.address}`, network: t.chain, address: t.address, symbol: t.symbol, name: t.name, risk: 'none' })).filter(Boolean);
      return extra.length ? { ...res, tokens: res.tokens.concat(extra), total: res.total === null ? null : res.total + extra.length } : res;
    });
  }
  const chainNameOf = (key) => {
    if (OWN[key]) return OWN[key].name;
    const one = E.pins().chains.find((chain) => chain.key === key);
    return one ? one.name : key;
  };

  let record = null, pollTimer = 0, active = null, building = false, handing = false, handedResult = null;
  const pendingKey = () => (T.wallet && CK.wallet.wallets.isExtra(T.wallet.address) ? `${PENDING_KEY}:${T.wallet.address}` : PENDING_KEY);
  function saveRecord() {
    if (record) store.set(pendingKey(), JSON.stringify(record));
    else store.del(pendingKey());
  }
  function loadRecord() {
    const text = store.get(pendingKey());
    if (!text) return null;
    try {
      const rec = JSON.parse(text);
      if (rec && typeof rec.wallet === 'string' && typeof rec.requestId === 'string' && typeof rec.phase === 'string' && rec.gave && rec.got) return rec;
    } catch (_) { }
    store.del(pendingKey());
    return null;
  }
  const pastValid = (rec, grace) => Math.floor(Date.now() / 1000) > rec.validUntil + grace;
  const isBuy = (rec) => rec.kind === 'buy';
  const onChainUnits = (chain, token) => {
    if (token === nativeAddress(chain)) return nets.native.has(chain) ? nets.native.get(chain) : null;
    return nets.native.has(chain) ? nets.held.get(`${chain}:${token}`) || 0n : null;
  };
  function gotInstOf(rec) {
    if (!isBuy(rec)) return D.byId.ton;
    return tokenInstOf(rec);
  }
  function tokenInstOf(rec) {
    try {
      const coin = nativeCoinOf(rec.chain);
      if (coin && (gasListing(rec.chain).address === rec.token || (listingOf(coin) || {}).address === rec.token)) return coin;
      return D.instruments.get(`${rec.chain}:${rec.token}`) || D.instruments.get(`${rec.chain}:${String(rec.token).toLowerCase()}`) || null;
    } catch (_) {
      return null;
    }
  }
  const gramUsd = () => (D.byId.ton.priced === true && D.byId.ton.price > 0 ? D.byId.ton.price : 0);
  function rememberCost(rec) {
    if (!window.DemoCost) return;
    const coin = tokenInstOf(rec);
    if (!coin || typeof coin.id !== 'string') return;
    const gave = T.fromUnits(BigInt(rec.gave.units), rec.gave.decimals);
    const got = T.fromUnits(BigInt(rec.got.out), rec.got.decimals);
    if (isBuy(rec)) {
      const payCoin = rec.gave.sym === gramOf().sym ? D.byId.ton : D.byId.usdt;
      const payUsd = rec.payUsd > 0 ? rec.payUsd : payCoin && payCoin.price > 0 ? payCoin.price : 0;
      const usd = gave * payUsd - (rec.topupUsd > 0 ? rec.topupUsd : 0);
      if (payCoin) DemoCost.sold(rec.wallet, payCoin.id, gave);
      DemoCost.bought(rec.wallet, coin.id, got, usd);
    } else {
      DemoCost.sold(rec.wallet, coin.id, gave);
      DemoCost.bought(rec.wallet, D.byId.ton.id, got, gave * (coin.price > 0 ? coin.price : 0));
    }
  }
  const explorerLink = (rec) => {
    if (!isBuy(rec) && rec.hash && EVM_EXPLORER[rec.chain]) return EVM_EXPLORER[rec.chain] + rec.hash;
    if (rec.hash) return `${TON_EXPLORER}transaction/${rec.hash}`;
    return T.wallet ? TON_EXPLORER + T.wallet.friendly : TON_EXPLORER;
  };

  const STATES = {
    sending: { title: 'swap.sent', text: '', mark: 'spin' },
    sent: { title: 'swap.sent', text: '', mark: 'spin' },
    filling: { title: 'xnet.filling', text: '', mark: 'spin' },
    unsure: { title: 'swapSheet.unsure', text: 'swapSheet.unsureText', mark: 'info', tone: 'hint' },
    success: { title: (rec) => (isBuy(rec) ? 'swap.doneBuy' : 'swap.doneSell'), text: '', mark: 'check-circle', tone: 'up', final: true },
    refunded: { title: 'swap.refunded', text: (rec) => (isBuy(rec) ? 'xnet.refundedBuy' : 'xnet.refundedSell'), mark: 'refresh', tone: 'accent', final: true },
    failed: { title: 'swap.failed', text: 'xnet.failedText', mark: 'close-circle', tone: 'down', final: true },
    rejected: { title: 'swapSheet.rejected', text: 'swapSheet.fundsKept', mark: 'close-circle', tone: 'down', final: true },
    expired: { title: 'swapSheet.expired', text: 'swapSheet.fundsKept', mark: 'info', tone: 'hint', final: true },
    unknown: { title: 'swap.unknown', text: 'swap.unknownText', mark: 'info', tone: 'hint', final: true }
  };
  function paintState(rec) {
    const R = receipt();
    if (!active || !active.status || !R) return;
    const { body, sheet } = active;
    const view = STATES[rec.phase] || STATES.unknown;
    const textKey = typeof view.text === 'function' ? view.text(rec) : view.text;
    const slow = !view.final && Date.now() - rec.sentAt > SLOW_AFTER_MS;
    body.innerHTML = `
      ${R.html}
      ${R.more(active.moreId)}
      <div class="sw-actions">
        <button class="btn btn--wide press sw-done" type="button"></button>
        <button class="btn btn--tinted press sw-open" type="button" aria-label="${tx('swap.explorer')}" title="${tx('swap.explorer')}">${icon('arrow-up-right', { size: 22 })}</button>
      </div>`;
    const gave = qtySym(BigInt(rec.gave.units), rec.gave);
    const gotEst = `${sig4(T.fromUnits(BigInt(rec.got.out), rec.got.decimals))} ${rec.got.sym}`;
    let big = '', sub;
    if (rec.phase === 'success') {
      big = `≈ +${gotEst}`;
      sub = `−${gave}`;
    } else if (view.final) sub = `${gave} → ${rec.got.sym}`;
    else sub = `${gave} → ≈ ${gotEst}`;
    const title = typeof view.title === 'function' ? view.title(rec) : view.title;
    R.paint($('.sw-receipt', body), { mark: view.mark, tone: view.tone, final: view.final, title: tx(title), text: textKey ? tx(slow ? 'swap.slow' : textKey) : slow ? tx('swap.slow') : '', big, sub });
    const more = R.moreRows(body, active);
    if (rec.phase === 'success') {
      if (isBuy(rec)) more.row(tx('swap.serviceFee', { pct: pctText(Number.isInteger(rec.feeBps) && rec.feeBps >= 0 && rec.feeBps <= 100 ? rec.feeBps : T.FEE_BPS) }), qtySym(BigInt(rec.feeUnits), gramOf()));
      if (rec.topupUsd > 0) more.row(tx('xnet.gasRow', { net: chainNameOf(rec.chain) }), fmt.usd(rec.topupUsd));
    } else if (!view.final) {
      more.row(tx('swap.min'), `${sig4(T.fromUnits(BigInt(rec.got.min), rec.got.decimals), true)} ${rec.got.sym}`);
    }
    const done = $('.sw-done', body);
    done.textContent = tx(view.final ? 'common.done' : 'nav.close');
    done.classList.toggle('btn--tinted', !view.final);
    done.addEventListener('click', () => sheet.close());
    const link = $('.sw-open', body);
    link.hidden = !rec.hash;
    link.addEventListener('click', () => T.openLink(explorerLink(rec)));
    if (active.moreOpen) reveal(sheet, $('.sw-more', body), $('.sw-more-body', body));
  }
  function openTrack(result) {
    const shown = result || record;
    if (CK.sheet.top || !shown) return;
    let mine = null;
    CK.sheet.open({
      title: tx('swap.sent'),
      detents: ['fit'],
      onClose() {
        if (active === mine) active = null;
      },
      build(body, sheet) {
        mine = { body, sheet, status: true, moreId: `xn-more-${++foldIds}`, moreOpen: false };
        active = mine;
        body.classList.add('sw-status', 'sw-status--receipt');
        sheet.el.classList.add('sw-receipt-sheet');
        $('.sheet-title', sheet.el).textContent = '';
        paintState(shown);
        pinHeight(this, sheet);
      }
    });
  }

  const heldNow = (rec) => (isBuy(rec)
    ? loadBalances(true).then(() => onChainUnits(rec.chain, rec.token))
    : DemoSwap.loadBalances().then((b) => {
      if (!b) return null;
      const row = b.rows.find((one) => one.id === 'TON');
      return row ? row.units : 0n;
    }));
  const heldBefore = (chain, token) => {
    const held = onChainUnits(chain, token);
    return held === null ? null : held.toString();
  };
  function finish(phase) {
    if (!record) return;
    record.phase = phase;
    clearTimeout(pollTimer);
    const done = record;
    record = null;
    saveRecord();
    if (phase === 'success') {
      CK.haptic.success();
      try { rememberCost(done); } catch (e) { console.error(e); }
    } else if (phase === 'failed' || phase === 'rejected') CK.haptic.error();
    else CK.haptic.medium();
    if (active && active.status) paintState(done);
    else if (handing) handedResult = done;
    else if (phase === 'success') CK.toast(tx(isBuy(done) ? 'swap.doneBuy' : 'swap.doneSell'), { icon: 'check-circle', tone: 'up' });
    else CK.toast(tx(STATES[phase].title), { icon: 'warning', tone: phase === 'failed' || phase === 'rejected' ? 'down' : 'accent' });
    emit();
    loadBalances(true);
    DemoSwap.loadBalances().then(emit, emit);
  }
  function setPhase(rec, phase) {
    if (rec.phase === phase) return;
    rec.phase = phase;
    saveRecord();
    if (active && active.status) paintState(rec);
  }

  const followDeal = (requestId, usdtLeg) => {
    E.status(requestId, { usdtLeg: usdtLeg === true }).catch(() => {});
  };
  function track() {
    clearTimeout(pollTimer);
    const rec = record;
    if (!rec || rec.phase === 'sending' || (rec.phase === 'unsure' && isBuy(rec))) return;
    const age = Date.now() - rec.sentAt;
    const again = () => {
      if (record === rec) pollTimer = setTimeout(track, age > SLOW_AFTER_MS ? POLL_SLOW_MS : pollAfter(age));
    };
    if (!isBuy(rec) && rec.before === undefined) {
      rec.before = null;
      heldNow(rec).then((held) => { if (record === rec && held !== null) rec.before = held.toString(); }, () => {});
    }
    if (age > (rec.phase === 'unsure' ? SALE_GIVE_UP_MS : GIVE_UP_AFTER_MS)) {
      finish('unknown');
      return;
    }
    E.status(rec.requestId, { usdtLeg: rec.usdtLeg === true }).then(({ status }) => {
      if (record !== rec) return;
      if (status === 'success') {
        finish('success');
        return;
      }
      if (status === 'refund' || status === 'refunded') {
        finish('refunded');
        return;
      }
      if (status === 'failure') {
        finish('failed');
        return;
      }
      if (status === 'pending' || status === 'submitted' || status === 'delayed') setPhase(rec, 'filling');
      if (rec.phase === 'filling' && rec.before !== null && rec.before !== undefined) {
        heldNow(rec).then((held) => {
          if (record !== rec) return;
          if (held !== null && held >= BigInt(rec.before) + BigInt(rec.got.min)) finish('success');
          else again();
        }, again);
        return;
      }
      if (isBuy(rec) && rec.phase === 'sent' && pastValid(rec, EXPIRY_MARGIN_S + LOST_GRACE_S)) {
        T.api('wallet/state?address=' + encodeURIComponent(rec.wallet)).then((chain) => {
          if (record !== rec) return;
          if (chain.seqno === rec.seqno) finish('expired');
          else again();
        }, again);
        return;
      }
      again();
    }, again);
  }
  function markSent(rec) {
    setPhase(rec, 'sent');
    track();
  }
  function settle() {
    clearTimeout(pollTimer);
    const rec = record;
    if (!rec || !isBuy(rec)) return;
    const again = () => {
      if (record === rec) pollTimer = setTimeout(settle, POLL_MS);
    };
    T.api('wallet/state?address=' + encodeURIComponent(rec.wallet)).then((chain) => {
      if (record !== rec) return undefined;
      if (!Number.isInteger(chain.seqno)) {
        again();
        return undefined;
      }
      if (chain.seqno > rec.seqno) {
        markSent(rec);
        return undefined;
      }
      if (pastValid(rec, EXPIRY_MARGIN_S)) {
        finish('expired');
        return undefined;
      }
      return CK.wallet.resend().then((sent) => {
        if (record !== rec) return;
        if (sent) markSent(rec);
        else again();
      });
    }).catch((err) => {
      if (record !== rec) return;
      if (CK.wallet.neverSent(err)) finish('rejected');
      else again();
    });
  }
  function relayDeposit(rec, boc) {
    CK.wallet.broadcast(boc).then((sent) => {
      if (record !== rec) return;
      if (!rec.hash) rec.hash = sent.hash;
      markSent(rec);
    }, (err) => {
      if (record !== rec) return;
      if (CK.wallet.neverSent(err)) {
        console.error(err);
        finish('rejected');
        return;
      }
      setPhase(rec, 'unsure');
      settle();
    });
  }
  function relaySale(rec, signed) {
    E.sendSell(signed).then(() => {
      if (record === rec) markSent(rec);
    }, (err) => {
      if (record !== rec) return;
      console.error(err);
      if (err.code === 'send_rejected' || err.code === 'send_stale' || err.code === 'no_gas' || err.code === 'approve_failed') {
        finish('rejected');
        return;
      }
      setPhase(rec, 'unsure');
      track();
    });
  }
  function resume() {
    const rec = loadRecord();
    if (!rec || record) return;
    if (!sameWallet(rec)) return;
    record = rec;
    if (!isBuy(rec) && rec.phase === 'sending') rec.phase = 'unsure';
    if (isBuy(rec) && (rec.phase === 'sending' || rec.phase === 'unsure')) settle();
    else track();
    emit();
    if (!CK.sheet.top) openTrack();
  }

  const NO_SALE = new Set(['route', 'steps', 'deposit_call', 'deposit_to', 'deposit_refund', 'refund_currency']);
  const saleChecks = new Map();
  const SALE_CHECK_MS = 30 * 60 * 1000;
  const SALE_RECHECK_MS = 60 * 1000;

  const SIGN_ERRORS = {
    insufficient_balance: 'walletFlow.overBalance', ton_only: 'xnet.tonOnly', frozen: 'swapSheet.frozen', pending: 'swapSheet.pendingLock', busy: 'swapSheet.pendingLock',
    biometric_denied: 'swapSheet.bioDenied', biometric_lost: 'swapSheet.bioLost', no_secret: 'swapSheet.noSign', no_secure_storage: 'swapSheet.noSign', password_needed: 'swapSheet.noSign', read_only: 'swapSheet.noSign',
    bad_intent: 'swapSheet.stopped', biometric_unknown: 'wallet.bioWait'
  };
  const TOO_SMALL = /LOW|SMALL|MIN/i;
  const RELAY_LINES = { SWAP_IMPACT_TOO_HIGH: 'swap.impactTooHigh', GAS_IMPACT_TOO_HIGH: 'xnet.feeTooHigh' };
  const LEAST_KEY = 'swap.tooSmallFrom';
  const FEE_HIGH = 'xnet.feeTooHigh';
  const LEAST_MARGIN = 1.1;
  const MARKET_KEEP = 0.9;
  const FLOOR_SLIP_MAX_BPS = 300;
  const SOL_SLIPPAGES = [50, 100, 300];
  const RELAY_SLIP_MAX_BPS = 900;
  const DEPOSIT_FEE_NANO = 5000000n;
  const PREFLIGHT_MS = 15000;
  function leastText(asked, least) {
    if (!asked || typeof asked.units !== 'bigint' || asked.units <= 0n || !asked.asset || !(least > 1) || tx(LEAST_KEY) === LEAST_KEY) return null;
    const whole = T.fromUnits(asked.units, asked.asset.decimals) * least * LEAST_MARGIN;
    if (!(whole > 0) || !Number.isFinite(whole)) return null;
    const step = 10 ** (Math.floor(Math.log10(whole)) - 1);
    return `${D.qty(Number((Math.ceil(whole / step - 1e-9) * step).toPrecision(2)))} ${asked.asset.sym}`;
  }
  function quoteTrouble(err, netName, chain, selling, asked) {
    const code = err && err.code;
    const again = { key: 'swap.quoteFail', block: true, fromQuote: true, retryAt: Date.now() + QUOTE_RETRY_MS };
    if ((code === 'relay_down' && err.busy) || (code === 'no_route' && err.relay && RELAY_BUSY.test(err.relay))) return { key: '', block: true, fromQuote: true, quiet: true, retryAt: Date.now() + QUOTE_RETRY_MS };
    if (code === 'flagged') return { key: 'trade.suspect', block: true, fromQuote: true };
    if (code === 'swap_quote' && err.line) return { key: err.line, block: true, fromQuote: true };
    if (code === 'no_route') return { key: err.relay && TOO_SMALL.test(err.relay) ? 'swap.tooSmall' : (Object.prototype.hasOwnProperty.call(RELAY_LINES, err.relay) ? RELAY_LINES[err.relay] : 'xnet.noRoute'), block: true, fromQuote: true };
    if (code === 'buying_off') return { key: 'xnet.buyingOff', block: true, fromQuote: true, retryAt: Date.now() + QUOTE_RETRY_MS * 6 };
    if (code === 'selling_off') return { key: 'xnet.sellingOff', block: true, fromQuote: true, retryAt: Date.now() + QUOTE_RETRY_MS * 6 };
    if (code === 'not_allowed') return { key: 'trade.closed', block: true, fromQuote: true };
    if (code === 'read_only') return { key: 'swapSheet.noSign', block: true, fromQuote: true };
    if (code === 'relay_refused') {
      if (err.reason === 'route' || (selling && NO_SALE.has(err.reason))) return { key: 'xnet.noSale', block: true, fromQuote: true };
      console.error('relay refused:', err.reason);
      if (err.reason === 'cap') return { key: 'swap.limit', params: { sum: fmt.usd(cfg.maxUsd) }, block: true, fromQuote: true };
      if (err.reason === 'value_floor') {
        const from = err.impact ? null : leastText(asked, err.least);
        return from ? { key: LEAST_KEY, params: { sum: from }, block: true, fromQuote: true } : { key: err.impact ? 'swap.impactTooHigh' : FEE_HIGH, block: true, fromQuote: true };
      }
      if (err.reason === 'no_price' || err.reason === 'gas' || err.reason === 'size' || err.reason === 'payer') return { key: 'xnet.noRoute', block: true, fromQuote: true };
      if (err.reason === 'gas_cap') return { key: 'xnet.feeTooHigh', block: true, fromQuote: true };
      if (err.reason === 'suspicious') return { key: 'trade.suspect', block: true, fromQuote: true };
      return { key: 'swapSheet.stopped', block: true, fromQuote: true };
    }
    if (code === 'no_gas') return { key: 'xnet.noGas', params: { net: netName, sym: GAS_COIN[chain] || 'ETH' }, block: true, fromQuote: true };
    if (code !== 'relay_down' && code !== 'state_unknown') console.error(err);
    return again;
  }

  const CANCELLED = Symbol('cancelled');
  const NATIVE_RAW = '0:' + '0'.repeat(64);

  function usdtSwapQuote(units, slippageBps, offerId) {
    const wallet = T.wallet.address;
    const offer = offerId || USDT_RAW;
    const usdt = offer === USDT_RAW;
    return T.api('swap/quote', { body: { offer, ask: NATIVE, units: units.toString(), slippageBps, wallet, ...(usdt ? { noReferral: true } : {}) } }).then((body) => {
      const expectedOut = T.parseUnits(body.expectedOut), minOut = T.parseUnits(body.minOut), gasUnits = T.parseUnits(body.gasUnits);
      const estimate = T.parseUnits(body.gasEstimate);
      const routers = Array.isArray(body.routers) ? body.routers.map(T.rawAddress) : [];
      const expiresAt = Number(body.expiresAt) * 1000;
      const ok = typeof body.quoteId === 'string' && !!body.quoteId && expectedOut !== null && minOut !== null && gasUnits !== null
        && T.parseUnits(body.units) === units && body.slippageBps === slippageBps && T.rawAddress(body.offer) === offer && T.rawAddress(body.ask) === NATIVE_RAW
        && routers.length === 2 && !!routers[1] && expiresAt > Date.now()
        && (usdt ? body.feeBps === 0 && body.feeUnits === '0' : (body.feeBps === T.FEE_BPS || body.feeBps === 0) && T.parseUnits(body.feeUnits) !== null)
        && minOut > 0n && minOut === expectedOut * BigInt(10000 - slippageBps) / 10000n;
      if (!ok) throw Object.assign(new Error('swap_quote'), { code: 'swap_quote' });
      return { quoteId: body.quoteId, units, expectedOut, minOut, gasUnits, networkFee: estimate !== null && estimate > 0n && estimate <= gasUnits ? estimate : gasUnits, feeBps: usdt ? 0 : body.feeBps, feeUnits: usdt ? 0n : T.parseUnits(body.feeUnits), destination: routers[1], expiresAt, venue: body.venue === undefined ? 'stonfi' : body.venue };
    }, (err) => {
      throw Object.assign(new Error('swap_quote'), { code: 'swap_quote', line: SWAP_QUOTE_LINES[err && err.message] || null });
    });
  }
  const SWAP_QUOTE_LINES = { insufficient_gas: 'swap.noGasShort', insufficient_balance: 'walletFlow.overBalance', over_limit: 'swap.quoteLimit', impact_over_limit: 'swap.impactTooHigh', fee_rounding: 'swap.tooSmall', no_liquidity: 'swapSheet.noPool', slippage_over_limit: 'swapSheet.slipRefused' };

  function gasGramFor(chain) {
    const gramPrice = D.byId.ton.price;
    const usd = OWN[chain] ? Math.max(GAS_BUY_USD, OWN[chain].lib.topupUsd || 0) : Math.max(GAS_BUY_USD, (E.topupOf(chain) || { usd: 0 }).usd * 4);
    return gramPrice > 0 ? T.toUnits((usd / gramPrice).toFixed(GRAM_DECIMALS), GRAM_DECIMALS) : 0n;
  }
  let relayWarm = false;
  function warmRelay() {
    if (relayWarm) return;
    relayWarm = true;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://api.relay.link';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
  function heldOn(chain) {
    const out = [];
    const wei = nets.native.get(chain);
    if (wei > 0n) out.push({ chain, address: nativeAddress(chain), sym: GAS_COIN[chain] || 'ETH', name: GAS_COIN[chain] || 'ETH', decimals: gasDecimals(chain), units: wei, native: true, inst: nativeCoinOf(chain) });
    nets.held.forEach((units, key) => {
      if (!key.startsWith(chain + ':') || !(units > 0n)) return;
      const token = LISTED.get(key) || seen.get(key);
      if (!token || token.risk === 'suspicious') return;
      out.push({ chain, address: token.address, sym: token.symbol, name: token.name, decimals: token.decimals, units, native: false, inst: D.instruments.get(key) || null });
    });
    nets.refunds.forEach((units, key) => {
      const token = REFUNDS.get(key);
      if (!token || token.chain !== chain || !(units > 0n)) return;
      out.push({ chain, address: token.address, sym: token.symbol, name: token.name, decimals: token.decimals, units, native: false, inst: D.instruments.get(key) || null });
    });
    return out;
  }
  function gasListing(chain) {
    const sym = GAS_COIN[chain] || 'ETH';
    return { chain, chainName: chainNameOf(chain), address: nativeAddress(chain), symbol: sym, name: sym, decimals: gasDecimals(chain), gas: true };
  }

  const XO = () => (window.DemoOrders && DemoOrders.x) || null;
  const X_AGAIN_MS = 15000;
  const X_QUOTE_PAUSE_MS = 600;
  const X_BUSY = new Set(['jupiter_busy', 'rpc_busy', 'rate_limited', 'state_unknown', 'server_unknown', 'bundle_failed', 'quote_stale', 'setup_unseen']);
  function stopFor(listing, selling, opts) {
    const X = XO();
    if (!X || !selling || !listing || listing.gas) return null;
    const family = X.family(listing.chain);
    if (!family || !X.open(family)) return null;
    if (family === 'sol' && listing.coin) return null;
    if (!Number.isInteger(listing.decimals)) return null;
    const token = family === 'evm' && listing.coin ? NATIVE_ADDRESS : listing.address;
    if (typeof token !== 'string' || !token) return null;
    return { X, family, chain: listing.chain, token, coin: !!listing.coin, forOrder: !!(opts && opts.orders) };
  }
  function stopHtml(xd) {
    return `<div class="or-fold xo-fold${xd.forOrder ? ' or-fold--out' : ''}"${xd.forOrder ? '' : ' hidden'}>${xd.forOrder ? '' : `<p class="sw-more-label">${tx('orders.stop')} / ${tx('orders.take')}</p>`}<div class="xo-body"><div class="or-rows"></div>`
      + '<div class="fold-row xn-term xo-outrow"><span></span><div class="xo-out"></div></div>'
      + `<div class="fold-row xn-term"><span>${tx('orders.floor')}</span><b class="xn-val xo-floor"></b></div>`
      + `<div class="fold-row xn-term"><span>${tx(xd.family === 'sol' ? 'xorders.gasSol' : 'xorders.gas')}</span><b class="xn-val xo-gas"></b></div>`
      + `<div class="fold-row xn-term"><span>${tx('xorders.week')}</span><b class="xn-val xo-week">${tx('orders.lineShort')}<button class="sw-why press" type="button" data-xwhy aria-label="${CK.esc ? CK.esc(tx('xorders.weekWhy')) : ''}">${icon('info', { size: 16 })}</button></b></div>`
      + `<p class="xo-note xo-gap">${tx('xorders.gapNote')}</p>`
      + '<p class="xo-note xo-fee"></p>'
      + `<div class="sw-term or-term xo-term"><span>${tx('orders.now')}</span></div></div><p class="xo-why" hidden></p></div>`;
  }
  function open(inst, side, opts) {
    if (CK.sheet.top || !cfg || !T.wallet || T.wallet.readOnly) {
      if (!cfg) loadCfg();
      return;
    }
    if (record) {
      const asked = opts && opts.gas ? null : pinName(inst);
      if (!asked || record.kind !== (side === 'sell' ? 'sell' : 'buy') || record.chain !== asked.chain || record.token !== asked.address) CK.toast(tx('xnet.oneAtATime'), { icon: 'info', tone: 'accent' });
      openTrack();
      return;
    }
    let listing = opts && opts.gas ? gasListing(opts.gas) : pinName(inst);
    if (!listing) return;
    if (side === 'sell' && listing.coin && !listing.own && !OWN[listing.chain] && inst && typeof inst.sym === 'string') {
      const homes = Array.from(CHAIN_KEYS).filter((key) => (GAS_COIN[key] || 'ETH') === inst.sym);
      const most = homes.reduce((best, key) => ((nets.native.get(key) || 0n) > (nets.native.get(best) || 0n) ? key : best), listing.chain);
      if (most !== listing.chain) listing = { ...listing, chain: most, chainName: chainNameOf(most) };
    }
    if (opts && opts.gas) inst = nativeCoinOf(opts.gas);
    const selling = side === 'sell' && !listing.gas;
    const chain = listing.chain;
    const netName = listing.chainName;
    const own = OWN[chain] || null, lib = libOf(chain), gasDec = gasDecimals(chain);
    if (own && !own.trades) return;
    const tokenAsset = { sym: listing.symbol, decimals: Number.isInteger(listing.decimals) ? listing.decimals : 18, inst };
    const payJet = !selling && opts && opts.pay && typeof opts.pay === 'object' && typeof opts.pay.id === 'string' && opts.pay.id !== NATIVE && opts.pay.id !== USDT_RAW
      && Number.isInteger(opts.pay.decimals) && typeof CK.wallet.signRoute === 'function' ? opts.pay : null;
    const canUsdt = !selling && (payJet ? true : typeof CK.wallet.payRelayWithUsdt === 'function');
    const usdtAsset = payJet ? { id: payJet.id, sym: payJet.sym, decimals: payJet.decimals, inst: payJet.inst || null } : { id: USDT_RAW, sym: D.byId.usdt.sym, decimals: USDT_DECIMALS, inst: D.byId.usdt };
    const payId = usdtAsset.id;
    let from = selling ? tokenAsset : gramOf();
    const to = selling ? gramOf() : tokenAsset;
    const payUsdt = () => from === usdtAsset;
    const nativeWei = nets.native.get(chain);
    const topup = !own && !selling && !listing.gas && !listing.coin && (nativeWei === undefined || E.needsTopup(chain, nativeWei));
    const outDecimals = (view) => (!selling && view && Number.isInteger(view.decimals) ? view.decimals : to.decimals);
    const askedDecimals = listing.open && Number.isInteger(listing.decimals) ? listing.decimals : undefined;
    const saleKey = !selling && (listing.open || listing.saleCheck) ? `${chain}:${listing.address}` : null;
    const saleCheck = () => {
      const one = saleKey ? saleChecks.get(saleKey) : null;
      return one && (one.state === 'asking' || Date.now() < one.until) ? one : null;
    };
    const saleUnknown = () => !!saleKey && !(saleCheck() && saleCheck().state !== 'asking');
    const gasSym = GAS_COIN[chain] || 'ETH';
    const gasGram = () => gasGramFor(chain);
    const slips = !(own && selling);
    const st = { units: 0n, pct: 0, gasSeen: null, probing: false, slippageBps: own ? cfg.slippageBps : Math.min(cfg.slippageBps, RELAY_SLIP_MAX_BPS), plan: null, askedAt: 0, loading: false, trouble: null, sending: false, note: '', known: false, gram: 0n, usdt: 0n, rows: [], swap: null, addr: own ? nets.own[chain] : nets.evm, walletAt: T.wallet ? T.wallet.address : null };
    let timer = 0, gen = 0, quoteTimer = 0, mine = null, passDone = null, afterClose = null, refreshQuote = () => {};
    const stopQuotes = () => {
      clearTimeout(quoteTimer);
      gen++;
    };
    const onVisible = () => {
      if (!document.hidden && !st.sending) refreshQuote();
    };
    const xd = stopFor(listing, selling, opts);
    const xBlock = xd ? stopHtml(xd) : '';
    const sheetTitle = xd && xd.forOrder ? tx('orders.stop') : tx(selling ? 'swapSheet.sellTitle' : 'swapSheet.buyTitle', { sym: listing.symbol });

    CK.sheet.open({
      title: sheetTitle,
      detents: ['fit'],
      onClose() {
        mine.dispose();
        if (window.DemoTrade) DemoTrade.unwatch(inst);
        if (active === mine) active = null;
        if (afterClose) afterClose();
        if (handing) {
          const result = handedResult;
          handing = false;
          handedResult = null;
          openTrack(result);
        }
      },
      build(body, sheet) {
        mine = { body, sheet };
        active = mine;
        const closing = () => active !== mine || sheet.el.hasAttribute('inert');
        const address = !listing.gas && !listing.coin && typeof listing.address === 'string' ? listing.address : '';
        const head = CK.el(`<div class="tk-sheet-token">${CK.coinLogo(inst, 36)}<span class="tk-sheet-name"><b></b>${address ? '<button class="xn-net press" type="button"><span></span></button>' : '<span></span>'}</span></div>`);
        $('.tk-sheet-name b', head).textContent = sheetTitle;
        $(address ? '.xn-net span' : '.tk-sheet-name span', head).textContent = listing.label || netName;
        $('.sheet-title', sheet.el).replaceWith(head);
        if (address) {
          const net = $('.xn-net', head);
          net.setAttribute('aria-label', `${listing.label || netName} · ${address}`);
          net.addEventListener('click', () => {
            CK.haptic.light();
            const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
            Promise.resolve(CK.copyText ? CK.copyText(address) : false).then((copied) => {
              CK.toast(CK.esc(copied ? `${tx('common.addressCopied')} · ${short}` : `${netName} · ${short}`), { icon: copied ? 'check-circle' : 'info', tone: copied ? 'up' : 'accent' });
            });
          });
        }
        if (window.DemoTrade) DemoTrade.watch(inst);

        body.classList.add('tk-order', 'sw-order', 'sw-min');
        sheet.el.classList.add('sw-form-sheet');
        const moreId = `xn-more-${++foldIds}`;
        body.innerHTML = `
          <div class="w-card sw-card">
            <div class="w-card-top sw-card-top"><button class="sw-max press" type="button" aria-label="${tx('common.max')}" disabled>${icon('wallet', { size: 14 })}<b class="sw-balance">${SKEL}</b></button></div>
            <div class="w-card-main"><button class="w-token sw-from press" type="button" disabled></button><input class="w-amt sw-amount" inputmode="decimal" autocomplete="off" placeholder="0" aria-label="${tx('common.amount')}"></div>
          </div>
          <div class="sw-sum">
            <p class="sw-get"><span class="sw-get-label">${tx('swapSheet.youGet')}</span><b class="sw-out"><span class="sw-out-main"><span class="sw-out-num"></span><span class="sw-out-sym"></span></span><span class="sw-out-val"></span></b></p>
            <p class="sw-fee-line"></p>
          </div>${xd && xd.forOrder ? xBlock : ''}
          <button class="fold-toggle sw-more sw-more--form" type="button" aria-expanded="false" aria-controls="${moreId}"><span>${tx('common.more')}</span>${icon('chevron-down', { size: 16 })}</button>
          <div class="fold-body sw-more-body sw-more-form sw-fee" id="${moreId}" hidden>
            <div class="tk-order-slider"></div>
            ${selling ? '' : `<div class="fold-row xn-term"><span class="xn-fee-label">${tx('swap.serviceFee', { pct: pctText(T.FEE_BPS) })}</span><b class="xn-val xn-fee">${SKEL}</b></div>
            <div class="fold-row xn-term xn-netrow" hidden><span>${tx('swap.networkFee')}</span><b class="xn-val xn-net">${SKEL}</b></div>`}
            ${selling || topup ? `<div class="fold-row xn-term"><span>${tx('xnet.gasRow', { net: netName })}</span><b class="xn-val xn-gas">${selling ? SKEL : fmt.usd(E.topupOf(chain).usd)}</b></div>` : ''}
            <div class="fold-row"><span>${tx('swap.min')}</span><b class="xn-val xn-min">${SKEL}</b></div>
            ${slips ? `<div class="sw-slip-row"><span>${tx('swap.slippage')}</span><div class="sw-slip"></div></div>` : ''}${xd && !xd.forOrder ? xBlock : ''}
          </div>`;
        CK.i18n.bind(body, () => {
          const topupEl = !selling && topup ? $('.xn-gas', body) : null;
          if (topupEl) topupEl.textContent = fmt.usd(E.topupOf(chain).usd);
        });
        const moreToggle = $('.sw-more', body), moreBox = $('.sw-more-body', body), minEl = $('.xn-min', body), maxBtn = $('.sw-max', body);
        const feeLineEl = $('.sw-fee-line', body);
        const feeText = window.DemoSwap && typeof DemoSwap.feeLine === 'function' ? DemoSwap.feeLine(feeLineEl)
          : { shown: '', set(text) { if (text !== null && text !== undefined) { this.shown = text; feeLineEl.textContent = tx('common.fee', { sum: text }); } } };
        moreToggle.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          CK.haptic.selection();
          moreToggle.setAttribute('aria-expanded', String(moreBox.hidden));
          moreBox.hidden = !moreBox.hidden;
          if (!moreBox.hidden) reveal(sheet, moreToggle, moreBox);
        });
        edgeFade(body);
        const chip = $('.sw-from', body);
        const canSwitch = () => canUsdt && st.known && st.usdt > 0n;
        function paintChip(flip) {
          chip.disabled = !canSwitch();
          chip.innerHTML = `${CK.coinLogo(from.inst, 28)}<b></b>`;
          $('b', chip).textContent = from.sym;
          if (chip.disabled) chip.removeAttribute('aria-label');
          else chip.setAttribute('aria-label', tx('swapSheet.payWith', { sym: from.sym }));
          if (flip) flipIn(chip);
        }
        paintChip();
        const input = $('.sw-amount', body);
        const out = $('.sw-out', body);
        const outNum = $('.sw-out-num', body);
        const outSym = $('.sw-out-sym', body);
        const outVal = $('.sw-out-val', body);
        const feeEl = $('.xn-fee', body);
        const feeLabel = $('.xn-fee-label', body);
        const netRow = selling ? null : $('.xn-netrow', body), netEl = selling ? null : $('.xn-net', body);
        const gasEl = selling ? $('.xn-gas', body) : null;
        const dock = CK.el(`<div class="sheet-dock sw-dock">
          <p class="sw-line" role="status"></p>
          <div class="tk-swipe"></div>
          <button class="btn btn--tinted press xn-offer" type="button" hidden></button>
          <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
        </div>`);
        sheet.el.appendChild(dock);
        const lineEl = $('.sw-line', dock);
        const swipeHost = $('.tk-swipe', dock);
        const offer = $('.xn-offer', dock);
        const passBox = $('.sw-pass', dock);
        const passInput = $('.sw-pass-input', dock);
        const swipe = CK.swipeConfirm(swipeHost, { tone: side, label: '', onConfirm: confirm, resetAfter: 60000, reportsOwnResult: true });
        swipeHost.addEventListener('pointerdown', () => {
          if (selling && st.plan && !st.sending && typeof lib.warmSell === 'function') lib.warmSell(st.plan);
        }, { passive: true });
        passBox.addEventListener('submit', (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });
        lineEl.addEventListener('click', (e) => {
          const why = e.target.closest && e.target.closest('[data-why]');
          if (!why) return;
          CK.haptic.light();
          CK.toast(tx(why.dataset.why), { icon: 'info', tone: 'accent' });
        });
        offer.addEventListener('click', () => {
          CK.haptic.light();
          if (offer.dataset.way === 'connect') {
            connect();
            return;
          }
          if (offer.dataset.way === 'gas') {
            const units = xs && xs.owns() ? xs.gasGram() : gasGram();
            afterClose = () => open(null, 'buy', { gas: chain, units });
            sheet.close();
            return;
          }
          afterClose = () => DemoSwap.openPair({ id: USDT_RAW, sym: D.byId.usdt.sym, name: D.byId.usdt.name, decimals: 6, inst: D.byId.usdt }, { id: NATIVE, sym: D.byId.ton.sym, name: D.byId.ton.name, decimals: GRAM_DECIMALS, inst: D.byId.ton });
          sheet.close();
        });

        const heldUnits = () => (listing.coin ? nets.native.get(chain) || 0n : nets.held.get(`${chain}:${listing.address}`) || nets.refunds.get(`${chain}:${listing.address}`) || 0n);
        const maxUnits = () => {
          const keep = own ? SOL_KEEP : typeof st.gasSeen === 'bigint' && st.gasSeen > 0n ? st.gasSeen + st.gasSeen / 3n : (E.gasKeep ? E.gasKeep(chain) : E.gasCap(chain)) || 0n;
          if (selling && listing.coin) return heldUnits() > keep ? heldUnits() - keep : 0n;
          if (selling) return heldUnits();
          if (payUsdt()) return st.usdt;
          return st.gram > PAY_RESERVE ? st.gram - PAY_RESERVE : 0n;
        };
        const fresh = () => !!st.plan && Date.now() - st.plan.at < QUOTE_LIFE_MS && (!payUsdt() || (!!st.swap && st.swap.expiresAt - Date.now() > SWAP_QUOTE_MARGIN_MS));
        const overBalance = () => st.known && st.units > maxUnits();
        const overCap = () => {
          const amount = T.fromUnits(st.units, from.decimals);
          const price = from.inst.price;
          const cap = selling ? (own ? undefined : E.saleCap(chain, listing.address)) : payUsdt() ? undefined : Audit.unitCap(NATIVE);
          return (price > 0 && amount * price > cfg.maxUsd) || (typeof cap === 'bigint' && st.units > cap);
        };
        const needsConnect = () => !selling && st.addr === null;
        const gasShort = (view) => (own && typeof view.short === 'bigint' ? view.short > 0n : nativeOf() !== undefined && nativeOf() < view.gasWei);
        function setLine(key, params, tone) {
          const text = key ? tx(key, params) : '';
          const why = key === 'swapSheet.unverified' ? 'detail.unverified' : '';
          if (lineEl.dataset.shape !== `${text}|${why}`) {
            lineEl.dataset.shape = `${text}|${why}`;
            lineEl.textContent = text;
            if (why) lineEl.appendChild(CK.el(`<button class="sw-why press" type="button" data-why="${why}" aria-label="${CK.esc ? CK.esc(tx(why)) : tx(why)}">${icon('info', { size: 16 })}</button>`));
          }
          lineEl.dataset.tone = tone || 'bad';
        }
        const oursBps = () => T.FEE_BPS + (payJet && payUsdt() ? (st.swap ? st.swap.feeBps : T.FEE_BPS) : 0);
        const swapFeePaid = () => {
          const q = payUsdt() ? st.swap : null;
          return q && q.feeUnits > 0n && q.expectedOut + q.feeUnits > 0n ? q.feeUnits * q.units / (q.expectedOut + q.feeUnits) : 0n;
        };
        const routeNet = () => (payUsdt() && st.swap && typeof st.swap.networkFee === 'bigint' ? st.swap.networkFee + DEPOSIT_FEE_NANO : null);
        function feeValue(view, usdtFee) {
          const parts = [];
          if (!selling) {
            if (payUsdt()) {
              if (usdtFee !== null) parts.push({ units: usdtFee, asset: usdtAsset });
              if (usdtFee !== null && st.swap && st.swap.feeUnits > 0n) parts.push({ units: st.swap.feeUnits, asset: gramOf() });
              if (usdtFee !== null && routeNet() !== null) parts.push({ units: routeNet(), asset: gramOf() });
            }
            else if (st.units > 0n && view) parts.push({ units: E.splitBuy(st.units).fee, asset: gramOf() });
            if (!parts.length) return null;
            if (topup) parts.push({ usd: E.topupOf(chain).usd });
          } else {
            if (!view || typeof view.gasWei !== 'bigint') return null;
            const coin = nativeCoinOf(chain);
            parts.push({ units: view.gasWei, asset: { sym: gasSym, decimals: gasDec, inst: coin } });
          }
          const usdOf = (part) => {
            if (part.usd !== undefined) return part.usd;
            const price = part.asset.inst ? livePrice(part.asset) : null;
            return price > 0 ? T.fromUnits(part.units, part.asset.decimals) * price : null;
          };
          const usds = parts.map(usdOf);
          if (usds.every((v) => v !== null)) return fmt.usd(usds.reduce((a, b) => a + b, 0));
          return parts.map((part) => (part.usd !== undefined ? fmt.usd(part.usd) : `${sig4(T.fromUnits(part.units, part.asset.decimals))} ${part.asset.sym}`)).join(' + ');
        }
        let shownFor = 0n;
        let xs = null;
        let idleOut = false, idleRows = false;
        const zeroOf = (asset) => `${D.qty(0)} ${asset.sym}`;
        const saleGas = (cap) => {
          if (typeof st.gasSeen === 'bigint' && st.gasSeen > 0n) return st.gasSeen;
          const figure = own || !E ? null : cap ? E.gasCap : E.gasKeep;
          const wei = typeof figure === 'function' ? figure(chain) : null;
          return typeof wei === 'bigint' && wei > 0n ? wei : null;
        };
        const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
        function paintIdle() {
          CK.roll(outNum, D.qty(0));
          outSym.textContent = ` ${to.sym}`;
          CK.roll(outVal, '');
          shownFor = 0n;
          idleOut = true;
          const gas = selling ? saleGas() : null;
          feeText.set(selling ? (gas ? feeValue({ gasWei: gas }, null) : zeroOf({ sym: gasSym })) : pctText(oursBps()));
        }
        function paintIdleRows() {
          idleRows = true;
          setText(feeEl, zeroOf(payUsdt() ? usdtAsset : gramOf()));
          setText(netEl, zeroOf(gramOf()));
          if (gasEl) {
            const gas = saleGas(true);
            setText(gasEl, gas ? tx('xnet.upTo', { sum: qtySym(gas, { sym: gasSym, decimals: gasDec }) }) : zeroOf({ sym: gasSym }));
          }
          setText(minEl, zeroOf(to));
        }
        function waitIdle() {
          if (idleOut) {
            idleOut = false;
            outNum.removeAttribute('aria-label');
            outNum.innerHTML = SKEL;
            outSym.textContent = '';
            CK.roll(outVal, '');
          }
          if (idleRows) {
            idleRows = false;
            [feeEl, netEl, gasEl, minEl].forEach(skelOn);
          }
        }
        function paint() {
          const view = st.plan ? st.plan.view : null;
          const waiting = st.loading || !!(st.trouble && st.trouble.quiet);
          const balanceEl = $('.sw-balance', body);
          if (st.known) setText(balanceEl, qtySym(selling ? heldUnits() : payUsdt() ? st.usdt : st.gram, from));
          else skelOn(balanceEl);
          maxBtn.disabled = !st.known || maxUnits() <= 0n || st.sending;
          if (xs && xs.owns()) {
            paintStop();
            return;
          }
          if (!st.sending) {
            if (view) {
              const amount = T.fromUnits(view.out, outDecimals(view));
              CK.roll(outNum, `≈ ${sig4(amount)}`);
              outSym.textContent = ` ${to.sym}`;
              CK.roll(outVal, worthText(to, amount));
              shownFor = st.units;
              idleOut = false;
            } else if (waiting && st.estimate > 0) {
              CK.roll(outNum, `≈ ${sig4(st.estimate)}`);
              outSym.textContent = ` ${to.sym}`;
              CK.roll(outVal, worthText(to, st.estimate));
              idleOut = false;
            } else if (!waiting) paintIdle();
            const typing = waiting && st.units > 0n && st.units !== shownFor;
            const unanswered = !typing && !view && !waiting && st.units > 0n;
            [out, feeLineEl, moreBox].forEach((el) => {
              el.classList.toggle('is-loading', typing);
              el.classList.toggle('is-void', unanswered);
            });
            const usdtFee = payUsdt() && view && typeof view.fee === 'bigint' && st.swap && st.swap.expectedOut > 0n ? view.fee * st.swap.units / st.swap.expectedOut : null;
            if (feeLabel) feeLabel.textContent = tx('swap.serviceFee', { pct: pctText(oursBps()) });
            if (netRow) netRow.hidden = !payUsdt();
            if (view) {
              idleRows = false;
              if (feeEl) {
                if (!payUsdt()) setText(feeEl, qtySym(E.splitBuy(st.units).fee, gramOf()));
                else if (usdtFee !== null) setText(feeEl, qtySym(usdtFee + swapFeePaid(), usdtAsset));
                else holdOrSkel(feeEl);
              }
              if (netEl) {
                if (routeNet() !== null) setText(netEl, `≈ ${qtySym(routeNet(), gramOf())}`);
                else holdOrSkel(netEl);
              }
              if (gasEl) setText(gasEl, tx('xnet.upTo', { sum: qtySym(view.gasWei, { sym: gasSym, decimals: gasDec }) }));
              if (typeof view.minOut === 'bigint') setText(minEl, `${sig4(T.fromUnits(view.minOut, outDecimals(view)), true)} ${to.sym}`);
              else holdOrSkel(minEl);
            } else if (st.units <= 0n || !waiting) paintIdleRows();
            else waitIdle();
            const value = feeValue(view, usdtFee);
            if (value !== null) feeText.set(value);
            else if (st.units <= 0n || !waiting) {
              const gas = selling ? saleGas() : null;
              feeText.set(selling ? (gas ? feeValue({ gasWei: gas }, null) : zeroOf({ sym: gasSym })) : pctText(oursBps()));
            }
          }
          $('.tk-order-slider', body).classList.toggle('is-empty', st.known && maxUnits() <= 0n);

          const onlyUsdt = !canUsdt && !selling && st.known && st.usdt > 0n && (maxUnits() <= 0n || overBalance());
          const swapGasShort = payUsdt() && st.known && !!st.swap && st.gram < st.swap.gasUnits + USDT_SWAP_ROOM;
          let line = st.trouble, blocked = !!(st.trouble && st.trouble.block);
          if (!blocked && saleCheck() && saleCheck().state === 'no') {
            line = { key: 'xnet.noSale' };
            blocked = true;
          }
          if (!blocked && st.units > 0n) {
            if (overBalance()) {
              line = { key: !selling && !payUsdt() && st.units <= st.gram ? 'swap.noGasShort' : 'walletFlow.overBalance' };
              blocked = true;
            } else if (swapGasShort) {
              line = { key: 'swap.noGasShort' };
              blocked = true;
            } else if (overCap()) {
              line = { key: 'swap.limit', params: { sum: fmt.usd(cfg.maxUsd) } };
              blocked = true;
            } else if (selling && view && gasShort(view)) {
              line = { key: 'xnet.noGas', params: { net: netName, sym: gasSym } };
              blocked = true;
            } else if (view && marketShort(view)) {
              line = marketTrouble(view);
              blocked = true;
            } else if (!line && view && lossPct(view) > LOSS_WARN_PCT) {
              line = { key: 'swapSheet.impact', params: { pct: `${fmt.num(lossPct(view), 1)}${CK.i18n.lang === 'en' ? '' : '\u00a0'}%` } };
            }
          }
          if (st.note) setLine(st.note.key || st.note, st.note.params || null, 'note');
          else if (line) setLine(line.key, line.params, line.tone);
          else if (inst && inst.token && inst.token.unverified) setLine('swapSheet.unverified', null, 'warn');
          else if (onlyUsdt && maxUnits() <= 0n) setLine('swapSheet.noPay', { sym: from.sym });
          else setLine('');

          const noGasNow = selling && ((view && gasShort(view)) || (!!st.trouble && st.trouble.key === 'xnet.noGas'));
          const way = st.sending || !passBox.hidden || !st.known ? '' : onlyUsdt ? 'swap' : needsConnect() && maxUnits() > 0n ? 'connect' : noGasNow ? 'gas' : '';
          if (offer.dataset.way !== way) {
            offer.dataset.way = way;
            offer.textContent = way ? tx(way === 'swap' ? 'xnet.swapFirst' : way === 'gas' ? 'xnet.gasTopup' : 'xnet.connect', { net: netName, sym: gasSym }) : '';
          }
          offer.hidden = !way;
          swipeHost.hidden = !!way || !passBox.hidden;

          if (st.known && selling && listing.coin && !own && st.gasSeen === null && typeof probeGas === 'function') setTimeout(probeGas, 0);
          const ready = st.known && st.units > 0n && !blocked && fresh() && !saleUnknown();
          let label = selling ? 'swapSheet.swipeSell' : 'swapSheet.swipeBuy';
          if (!st.known) label = 'swap.waitBalance';
          else if (st.units <= 0n && maxUnits() <= 0n) label = selling ? (heldUnits() > 0n ? (st.probing ? 'swap.waitQuote' : 'order.tooSmall') : 'order.notHeld') : 'swapSheet.noPay';
          else if (st.units <= 0n) label = 'order.needAmount';
          else if (!blocked && (!fresh() || saleUnknown())) label = 'swap.waitQuote';
          swipe.setDisabled(!ready || st.sending);
          swipe.update({ label: tx(label, { sym: from.sym }), tone: side });
        }
        const nativeOf = () => nets.native.get(chain);
        const lossPct = (view) => (view.inUsd - view.outUsd - (view.topupUsd || 0)) / view.inUsd * 100;
        const livePrice = (asset) => {
          const i = asset && asset.inst;
          if (!i || !(i.price > 0) || relayPriced.has(i.id)) return null;
          return i.isToken || i.priced === true ? i.price : null;
        };
        const floorDecimals = Number.isInteger(listing.decimals) ? listing.decimals : null;
        const usdtGiven = (view) => {
          const swap = st.swap;
          if (!swap || typeof swap.units !== 'bigint' || typeof swap.expectedOut !== 'bigint' || swap.expectedOut <= 0n || typeof view.deposit !== 'bigint') return { units: 0n, decimals: usdtAsset.decimals, price: null };
          return { units: swap.units * view.deposit / swap.expectedOut, decimals: usdtAsset.decimals, price: livePrice(usdtAsset) };
        };
        const marketShort = (view) => {
          const tokenDecimals = floorDecimals;
          const below = (give) => E.belowMarket({
            give,
            get: selling ? { units: view.out, decimals: GRAM_DECIMALS, price: livePrice(to) } : { units: view.out, decimals: tokenDecimals, price: livePrice(to) },
            slippageBps: slips ? Math.min(st.slippageBps, FLOOR_SLIP_MAX_BPS) : 0,
            extraUsd: typeof view.topupWei === 'bigint' && view.topupWei > 0n ? (E.topupOf(chain) || { usd: 0 }).usd : 0
          }) === true;
          if (selling) return below({ units: view.units, decimals: tokenDecimals, price: livePrice(from) });
          if (below({ units: view.deposit, decimals: GRAM_DECIMALS, price: livePrice(gramOf()) })) return true;
          return payUsdt() && below(usdtGiven(view));
        };
        const marketTrouble = (view) => {
          const fees = typeof view.feesUsd === 'number' && Number.isFinite(view.feesUsd) ? view.feesUsd : 0;
          const lost = view.inUsd - view.outUsd - (view.topupUsd || 0);
          if (!(fees > 0) || !(view.inUsd > 0) || lost - fees > fees) return { key: 'xnet.belowMarket' };
          const kept = slips ? 1 - Math.min(st.slippageBps, FLOOR_SLIP_MAX_BPS) / 10000 : 1;
          const room = 1 - kept * MARKET_KEEP - Math.max(0, lost - fees) / view.inUsd;
          const sum = room > 0 ? leastText({ units: st.units, asset: from }, fees / (room * view.inUsd)) : null;
          return sum ? { key: LEAST_KEY, params: { sum } } : { key: FEE_HIGH };
        };
        const relayAsk = (units) => {
          const asked = { chain, token: listing.address, slippageBps: st.slippageBps, decimals: askedDecimals, marketUsd: livePrice(tokenAsset) || undefined };
          return listing.gas ? lib.quoteGas({ chain, total: units })
            : selling ? lib.quoteSell({ ...asked, units })
              : lib.quoteBuy({ ...asked, total: units, topup, risk: inst.token && inst.token.risk });
        };
        const preflight = (v) => {
          st.askedAt = Date.now();
          let lateTimer = 0;
          const ask = Promise.resolve().then(() => relayAsk(v.total));
          const late = new Promise((resolve) => { lateTimer = setTimeout(() => resolve(null), PREFLIGHT_MS); });
          return Promise.race([ask, late]).then((fresh) => {
            const now = fresh && fresh.view;
            return !!now && typeof now.out === 'bigint' && typeof v.minOut === 'bigint' && now.out >= v.minOut
              && (!Number.isInteger(v.decimals) || now.decimals === v.decimals) && !marketShort(now);
          }, () => false).finally(() => clearTimeout(lateTimer));
        };
        const marketEstimate = () => {
          const pf = from.inst && from.inst.price, pt = to.inst && to.inst.price;
          if (!(pf > 0) || !(pt > 0) || st.units <= 0n) return null;
          const usd = T.fromUnits(st.units, from.decimals) * pf * (selling ? 1 : 1 - T.FEE_BPS / 10000) - (topup ? E.topupOf(chain).usd : 0);
          return usd > 0 ? usd / pt : null;
        };

        function probeGas() {
          if (st.probing || !selling || !listing.coin || own || st.gasSeen !== null || !st.known || !T.wallet || !st.addr) return;
          const held = heldUnits();
          if (held <= 0n || maxUnits() > 0n) return;
          st.probing = true;
          relayAsk(held / 2n > 0n ? held / 2n : held).then((plan) => {
            if (plan && plan.view && typeof plan.view.gasWei === 'bigint' && plan.view.gasWei > 0n) st.gasSeen = plan.view.gasWei;
          }, () => null).then(() => {
            st.probing = false;
            if (st.gasSeen === null) st.gasSeen = 0n;
            paint();
          });
          paint();
        }

        function checkSale(plan) {
          const one = { state: 'asking', until: 0 };
          saleChecks.set(saleKey, one);
          const view = plan.view;
          const decimals = Number.isInteger(listing.decimals) ? listing.decimals : Number.isInteger(view.decimals) ? view.decimals : undefined;
          Promise.resolve().then(() => lib.quoteSell({ chain, token: listing.address, units: view.minOut, decimals, marketUsd: livePrice(tokenAsset) || undefined })).then(() => 'open', (err) => {
            if (err && err.code === 'relay_refused' && NO_SALE.has(err.reason)) return 'no';
            if (err && err.code === 'relay_refused' && (err.reason === 'gas' || (err.reason === 'value_floor' && err.impact))) return 'no';
            if (err && err.code === 'no_route' && err.relay && !TOO_SMALL.test(err.relay) && !RELAY_BUSY.test(err.relay)) return 'no';
            console.error('sale check:', err && (err.reason || err.code));
            return 'failed';
          }).then((state) => {
            if (saleChecks.get(saleKey) !== one) return;
            one.state = state === 'no' ? 'no' : 'open';
            one.until = Date.now() + (state === 'failed' ? SALE_RECHECK_MS : SALE_CHECK_MS);
            if (closing()) return;
            if (one.state === 'no') {
              stopQuotes();
              st.plan = null;
            }
            paint();
          });
        }

        function fetchQuote() {
          clearTimeout(quoteTimer);
          const g = ++gen;
          if (st.units <= 0n || overBalance() || overCap() || !T.wallet || !st.addr || (saleCheck() && saleCheck().state === 'no') || (xs && xs.owns())) {
            st.plan = null;
            st.loading = false;
            paint();
            return;
          }
          if (!fresh()) st.plan = null;
          st.loading = !st.plan;
          st.askedAt = Date.now();
          paint();
          const usdtUnits = st.units;
          const job = payUsdt() ? usdtSwapQuote(usdtUnits, st.slippageBps, payId).then((q) => {
            if (g !== gen) return null;
            st.swap = q;
            const wallet = T.wallet.address;
            q.ahead = { at: Date.now(), wallet, job: T.api('swap/build?ahead=1', { body: { quoteId: q.quoteId, wallet } }) };
            q.ahead.job.catch(() => {});
            return relayAsk(q.minOut);
          }) : relayAsk(st.units);
          job.then((plan) => {
            if (g !== gen || !plan) return;
            if (selling && listing.coin && !own && !(st.gasSeen > 0n) && plan.view && typeof plan.view.gasWei === 'bigint' && plan.view.gasWei > 0n) {
              st.gasSeen = plan.view.gasWei;
              const again = st.pct > 0 ? shareOf(st.pct) : st.units;
              if (again !== st.units && again > 0n) {
                st.units = again;
                input.value = fieldText(T.fromUnits(st.units, from.decimals));
                st.loading = false;
                st.plan = null;
                return fetchQuote();
              }
            }
            st.loading = false;
            st.plan = plan;
            st.estimate = null;
            st.rate = st.units > 0n ? T.fromUnits(plan.view.out, outDecimals(plan.view)) / Number(st.units) : 0;
            if (st.trouble && st.trouble.fromQuote) st.trouble = null;
            if (saleKey && !saleCheck()) checkSale(plan);
            paint();
          }, (err) => {
            if (g !== gen) return;
            st.loading = false;
            st.plan = null;
            st.trouble = quoteTrouble(err, netName, chain, selling, { units: usdtUnits, asset: from });
            if (!st.trouble.quiet) st.estimate = null;
            paint();
          });
        }
        function askSoon() {
          clearTimeout(quoteTimer);
          quoteTimer = setTimeout(fetchQuote, Math.max(TYPE_PAUSE_MS, st.askedAt + QUOTE_GAP_MS - Date.now()));
        }
        refreshQuote = () => {
          if (!fresh() && !st.loading && st.units > 0n) fetchQuote();
          else paint();
        };
        function amountChanged() {
          stopQuotes();
          st.plan = null;
          st.trouble = null;
          st.loading = st.units > 0n && !!st.addr && !overBalance() && !(xs && xs.owns());
          st.estimate = !st.loading ? null : st.rate > 0 ? st.rate * Number(st.units) : marketEstimate();
          if (xs) xs.amountChanged();
          paint();
          askSoon();
        }
        const shareOf = (v) => maxUnits() * BigInt(Math.round(v * 10)) / 1000n;
        const slider = CK.slider($('.tk-order-slider', body), {
          label: tx('order.shareAria'), min: 0, max: 100, step: .5, value: 0,
          stops: [.25, .5, .75, 1],
          format: (v) => qtySym(shareOf(v), from),
          onInput(v) {
            st.pct = v;
            st.units = shareOf(v);
            input.value = fieldText(T.fromUnits(st.units, from.decimals));
            amountChanged();
          }
        });
        DemoWallet.amountField(input);
        input.addEventListener('input', () => {
          const max = maxUnits();
          DemoWallet.fitFraction(input, from.decimals);
          st.units = DemoWallet.typedUnits(input.value, from.decimals);
          st.pct = max > 0n ? clamp(T.fromUnits(st.units, from.decimals) / T.fromUnits(max, from.decimals) * 100, 0, 100) : 0;
          slider.set(st.pct);
          amountChanged();
        });
        input.addEventListener('blur', () => {
          if (DemoWallet.typedUnits(input.value, from.decimals) === st.units) input.value = DemoWallet.unitsText(st.units, from.decimals);
        });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
        maxBtn.addEventListener('click', () => {
          const max = maxUnits();
          if (maxBtn.disabled || st.sending || !st.known || max <= 0n) return;
          CK.haptic.selection();
          input.value = DemoWallet.unitsText(max, from.decimals);
          input.dispatchEvent(new Event('input'));
        });
        if (slips) {
          const slipApi = window.DemoSwap && DemoSwap.slip;
          const presets = own ? cfg.slippages.filter((bps) => SOL_SLIPPAGES.includes(bps)) : (slipApi ? slipApi.presets() : cfg.slippages).filter((bps) => bps <= RELAY_SLIP_MAX_BPS);
          const onSlip = (bps) => {
            if (st.sending || (own ? !SOL_SLIPPAGES.includes(bps) : bps > RELAY_SLIP_MAX_BPS || (slipApi ? !slipApi.ok(bps) : !cfg.slippages.includes(bps)))) return;
            st.slippageBps = bps;
            amountChanged();
          };
          if (slipApi) slipApi.picker($('.sw-slip', body), st.slippageBps, presets, own ? false : RELAY_SLIP_MAX_BPS, onSlip);
          else CK.segmented($('.sw-slip', body), { label: tx('swap.slippage'), size: 'small', value: String(st.slippageBps), items: presets.map((bps) => ({ value: String(bps), label: pctText(bps) })), onChange: (v) => onSlip(Number(v)) });
        }

        function mountStop(d) {
          const X = d.X;
          const block = $('.xo-fold', body);
          const xoBody = $('.xo-body', block), whyEl = $('.xo-why', block), outsHost = $('.xo-out', block);
          const floorEl = $('.xo-floor', block), reserveEl = $('.xo-gas', block);
          $('.xo-outrow span', block).textContent = tx('xorders.outIn', { net: netName });
          $('.xo-fee', block).textContent = tx('xorders.fee', { pct: pctText(X.FEE_BPS) });
          block.addEventListener('click', (e) => {
            if (!e.target.closest || !e.target.closest('[data-xwhy]')) return;
            CK.haptic.light();
            CK.toast(tx('xorders.weekWhy'), { icon: 'info', tone: 'accent' });
          });
          const own = X.outs(d.family).filter((key) => !!X.outOf(chain, key) && !(d.coin && key === 'coin'));
          const s = { outs: own.slice(), out: own[0], answer: X.answer(chain, d.token), off: null, quote: null, quoteErr: null, quoteTimer: 0, gen: 0, dead: false, gasShort: false, asking: 0 };
          const outNow = () => X.outOf(chain, s.out);
          const outUsd = () => X.outUsd(chain, outNow());
          const market = () => {
            const token = livePrice(tokenAsset), out = outUsd();
            return token > 0 && out > 0 ? token / out : 0;
          };
          const outAt = (price, units) => X.outAt(price, units, from.decimals, outNow().decimals);
          const quote = () => {
            if (st.units <= 0n) return null;
            if (s.quote && s.quote.view && s.quote.units === st.units && s.quote.out === s.out && typeof s.quote.view.expected === 'bigint') return { expectedOut: s.quote.view.expected };
            const price = market();
            return price > 0 ? { expectedOut: outAt(price * (1 - X.FEE_BPS / 10000), st.units) } : null;
          };
          const ctx = (placing) => ({ coin: gasSym, gas: { sym: gasSym, decimals: gasDec }, minUsd: s.answer && s.answer.minUsd, maxUsd: s.answer && s.answer.maxUsd, family: d.family, placing: !!placing });
          const emptyGas = () => d.family === 'evm' && !d.coin && nets.native.get(chain) === 0n;
          const rows = DemoOrders.attach($('.or-rows', block), {
            token: { id: d.token, inst },
            term: $('.xo-term', block),
            decimals: () => from.decimals,
            units: () => st.units,
            quote,
            held: () => (st.known ? heldUnits() : null),
            out: () => ({ sym: outNow().sym, decimals: outNow().decimals, usd: outUsd }),
            market,
            termFixed: true,
            needStop: d.family === 'sol',
            floors: (stopOut) => X.floors(d.family, stopOut),
            onChange() {
              if (st.trouble && !st.trouble.fromQuote) st.trouble = null;
              s.gasShort = false;
              askQuote();
              if (api.owns()) {
                stopQuotes();
                st.plan = null;
                st.loading = false;
                paint();
              } else fetchQuote();
            }
          });
          function paintOuts() {
            if (s.outs.length > 1 && typeof CK.segmented === 'function') {
              CK.segmented(outsHost, { label: tx('xorders.outIn', { net: netName }), size: 'small', value: s.out, items: s.outs.map((key) => ({ value: key, label: X.outOf(chain, key).sym })), onChange: (value) => setOut(value) });
            } else {
              outsHost.innerHTML = '<b class="xn-val"></b>';
              $('b', outsHost).textContent = outNow().sym;
            }
          }
          function setOut(key) {
            if (st.sending || key === s.out || !s.outs.includes(key)) return;
            CK.haptic.selection();
            s.out = key;
            s.quote = null;
            s.quoteErr = null;
            rows.outChanged();
            askQuote();
            paint();
          }
          function turnOff(t) {
            s.off = t;
            rows.turnOff();
            rows.hold(false);
            if (!d.forOrder) {
              block.hidden = false;
              xoBody.hidden = true;
              whyEl.hidden = false;
              whyEl.textContent = tx(t.key, t.params || undefined);
            }
          }
          function takeAnswer(answer) {
            s.answer = answer;
            if (!answer) return;
            if (answer.ok) {
              const outs = s.outs.filter((key) => answer.outs.includes(key));
              if (outs.length) {
                s.outs = outs;
                if (!outs.includes(s.out)) {
                  s.out = outs[0];
                  rows.outChanged();
                }
              }
              paintOuts();
              rows.hold(false);
              if (!d.forOrder) block.hidden = false;
            } else turnOff(X.trouble({ code: answer.code, reason: answer.reason, detail: { minUsd: answer.minUsd, maxUsd: answer.maxUsd } }, ctx()));
          }
          paintOuts();
          if (s.answer) takeAnswer(s.answer);
          else {
            rows.hold(true);
            const ask = () => X.check(chain, d.token).then((answer) => {
              if (s.dead || closing()) return;
              if (answer) {
                takeAnswer(answer);
                paint();
              } else s.asking = setTimeout(ask, X_AGAIN_MS);
            });
            ask();
          }
          const currentKey = () => {
            const want = rows.intent();
            return [st.units, s.out, want.stopOut || 0n, want.takeOut || 0n].join('|');
          };
          const quoteSettled = () => d.family !== 'sol' || (!!s.quote && s.quote.key === currentKey()) || (!!s.quoteErr && s.quoteErr.key && s.quoteErr.at === currentKey());
          function askQuote() {
            clearTimeout(s.quoteTimer);
            if (d.family !== 'sol' || s.off) return;
            const want = rows.intent();
            if (!want.stopOut || st.units <= 0n || (st.known && st.units > heldUnits())) return;
            const key = currentKey();
            if ((s.quote && s.quote.key === key) || (s.quoteErr && s.quoteErr.at === key)) return;
            s.quoteErr = null;
            const g = ++s.gen;
            const units = st.units, out = s.out;
            s.quoteTimer = setTimeout(() => {
              X.quote(chain, { token: d.token, units, out, stopOut: want.stopOut, takeOut: want.takeOut }).then((view) => {
                if (g !== s.gen || s.dead || closing()) return;
                s.quote = { key, units, out, view };
                if (view && typeof view.short === 'bigint' && view.short > 0n) s.quoteErr = { ...X.trouble({ code: 'sol_order_no_sol', needs: view.short, have: 0n }, ctx()), at: key };
                paint();
              }, (err) => {
                if (g !== s.gen || s.dead || closing()) return;
                if (err && err.code === 'xorder_no_slot' && err.reason === 'ahead') s.quote = { key, units, out, view: null };
                else {
                  const t = X.trouble(err, ctx());
                  if (t.kind === 'token' || t.kind === 'closed') turnOff(t);
                  else if (X_BUSY.has(err && err.code) || (err && err.code === 'xorder_closed')) {
                    s.quote = { key, units, out, view: null };
                    s.quoteErr = { ...t, block: false, tone: 'note', at: key };
                  } else s.quoteErr = { ...t, at: key };
                }
                paint();
              });
            }, X_QUOTE_PAUSE_MS);
          }
          const unitsFor = (usd) => {
            const price = livePrice(tokenAsset);
            return usd > 0 && price > 0 ? T.toUnits(usd / price, from.decimals) : null;
          };
          function problem() {
            if (s.off) return { ...s.off, block: true };
            if (emptyGas()) return { ...X.trouble({ code: 'xorder_no_gas' }, ctx()), block: true };
            if (!rows.active()) return null;
            if (st.known && st.units > heldUnits()) return { key: 'walletFlow.overBalance', block: true };
            const most = s.answer && s.answer.ok ? unitsFor(s.answer.maxUsd) : null;
            if (most !== null && most > 0n && st.units > most) return { key: 'orders.maxUnits', params: { max: DemoWallet.unitsText(most, from.decimals), sym: from.sym }, block: true };
            const least = s.answer && s.answer.ok ? unitsFor(s.answer.minUsd) : null;
            if (least !== null && st.units > 0n && st.units < least) return { key: 'xorderErr.minUsd', params: { sum: fmt.usd(s.answer.minUsd) }, block: true };
            const own = rows.problem();
            if (own) return { ...own, block: true };
            if (s.quoteErr && s.quoteErr.at === currentKey()) return s.quoteErr;
            if (s.gasShort) return s.gasShort;
            if (s.quote && s.quote.view && s.quote.view.freezable && s.quote.key === currentKey()) return { key: 'xorders.freeze', tone: 'warn' };
            return null;
          }
          function paintLines() {
            const o = outNow();
            const want = rows.intent();
            const least = want.stopOut ? X.floors(d.family, want.stopOut)[2] : want.takeOut || 0n;
            setText(floorEl, `${sig4(T.fromUnits(least, o.decimals), true)} ${o.sym}`);
            if (!rows.active()) setText(reserveEl, d.family === 'sol' ? zeroOf({ sym: 'SOL' }) : zeroOf({ sym: gasSym }));
            else if (d.family === 'sol') {
              const view = s.quote && s.quote.key === currentKey() ? s.quote.view : null;
              if (view && typeof view.fund === 'bigint' && typeof view.nonces === 'bigint') setText(reserveEl, `≈ ${qtySym(view.fund + view.nonces, { sym: 'SOL', decimals: 9 })}`);
              else skelOn(reserveEl);
            } else {
              const cap = typeof E.gasCap === 'function' ? E.gasCap(chain) : null;
              if (typeof cap === 'bigint' && cap > 0n) setText(reserveEl, tx('xnet.upTo', { sum: qtySym(cap * (d.coin ? 3n : 4n), { sym: gasSym, decimals: gasDec }) }));
              else skelOn(reserveEl);
            }
          }
          const api = {
            owns: () => !s.dead && (rows.active() || d.forOrder),
            active: () => rows.active(),
            off: () => !!s.off,
            waiting: () => !s.off && (rows.waiting() || (rows.active() && !quoteSettled())),
            paint() {
              rows.paint();
              paintLines();
            },
            amountChanged() {
              askQuote();
            },
            problem,
            ready: () => !s.off && !s.dead && !rows.waiting() && rows.active() && st.units > 0n && quoteSettled() && !(problem() || {}).block,
            gasShort: () => !!(s.gasShort || emptyGas() || (s.quoteErr && s.quoteErr.kind === 'gas' && s.quoteErr.at === currentKey())),
            gasGram() {
              const t = s.gasShort || (s.quoteErr && s.quoteErr.kind === 'gas' && s.quoteErr.at === currentKey() ? s.quoteErr : null);
              const short = t && typeof t.short === 'bigint' && t.short > 0n ? t.short : null;
              const least = gasGramFor(chain);
              const coinUsd = livePrice({ inst: nativeCoinOf(chain) });
              const gramUsd = livePrice(gramOf());
              if (!short || !(coinUsd > 0) || !(gramUsd > 0)) return least;
              const usd = T.fromUnits(short, gasDec) * coinUsd * 1.25;
              const units = T.toUnits((usd / gramUsd).toFixed(GRAM_DECIMALS), GRAM_DECIMALS);
              return units > least ? units : least;
            },
            outText: () => rows.outText(),
            outAmount: () => rows.outGram(),
            outAsset: () => ({ id: `xo:${s.out}`, sym: outNow().sym, decimals: outNow().decimals, inst: outUsd() > 0 ? { price: outUsd() } : null }),
            intent: () => ({ ...rows.intent(), token: d.token, out: s.out }),
            failed(err) {
              const t = X.trouble(err, ctx(true));
              if (t.kind === 'token' || t.kind === 'closed') turnOff(t);
              if (t.kind === 'gas') s.gasShort = t;
              if (err && err.code === 'xorder_no_pool' && err.reason === 'usdc_leg' && s.outs.length > 1) {
                s.outs = s.outs.filter((key) => key !== 'usdc');
                s.out = s.outs[0];
                rows.outChanged();
                paintOuts();
              }
              return t;
            },
            placed(placed, want) {
              X.placed({ chain, family: d.family, orderId: placed && placed.orderId, symbol: from.sym, decimals: from.decimals, units: want.units, out: outNow(), stopOut: want.stopOut, takeOut: want.takeOut });
            },
            firstBalance() {
              if (d.forOrder && st.units <= 0n && maxUnits() > 0n && !(opts && opts.units > 0n)) {
                const most = s.answer && s.answer.ok ? unitsFor(s.answer.maxUsd) : null;
                const units = most !== null && most > 0n && most < maxUnits() ? most : maxUnits();
                input.value = DemoWallet.unitsText(units, from.decimals);
                input.dispatchEvent(new Event('input'));
              }
            },
            call: () => rows.call(),
            dispose() {
              s.dead = true;
              s.gen++;
              clearTimeout(s.quoteTimer);
              clearTimeout(s.asking);
            }
          };
          return api;
        }
        function paintStop() {
          xs.paint();
          if (!st.sending) {
            const text = xs.outText();
            const asset = xs.outAsset();
            CK.roll(outNum, text || D.qty(0));
            outSym.textContent = ` ${asset.sym}`;
            const amount = xs.outAmount();
            CK.roll(outVal, text && amount > 0 ? worthText(asset, amount) : '');
            shownFor = st.units;
            idleOut = false;
            [out, feeLineEl, moreBox].forEach((el) => {
              el.classList.remove('is-loading');
              el.classList.remove('is-void');
            });
            feeText.set(pctText(DemoOrders.x.FEE_BPS));
          }
          let line = st.trouble, blocked = !!(st.trouble && st.trouble.block);
          if (!blocked) {
            const p = xs.problem();
            if (p) {
              line = p;
              blocked = !!p.block;
            }
          }
          if (st.note) setLine(st.note.key || st.note, st.note.params || null, 'note');
          else if (line) setLine(line.key, line.params, line.tone);
          else setLine('');
          const way = st.sending || !passBox.hidden || !st.known ? '' : xs.gasShort() ? 'gas' : '';
          if (offer.dataset.way !== way) {
            offer.dataset.way = way;
            offer.textContent = way ? tx('xnet.gasTopup', { net: netName, sym: gasSym }) : '';
          }
          offer.hidden = !way;
          swipeHost.hidden = !!way || !passBox.hidden;
          let label = 'orders.swipe';
          if (!st.known) label = 'swap.waitBalance';
          else if (st.units <= 0n && heldUnits() <= 0n) label = 'order.notHeld';
          else if (st.units <= 0n) label = 'order.needAmount';
          else if (!xs.active()) label = xs.off() || xs.waiting() ? 'orders.swipe' : 'xorders.pickLevel';
          else if (!blocked && xs.waiting()) label = 'swap.waitQuote';
          const ready = st.known && st.units > 0n && !blocked && xs.ready();
          swipe.setDisabled(!ready || st.sending);
          swipe.update({ label: tx(label, { sym: from.sym }), tone: 'sell' });
        }
        async function placeStop() {
          if (!xs.ready() || st.sending) {
            paint();
            return false;
          }
          if (!begin()) return false;
          let want = null;
          try {
            const stop = await signable();
            if (stop) return release(stop);
            want = xs.intent();
            const steps = { setup: 'xorders.stepSetup', signed: 'xorders.stepSave', created: 'xorders.stepFund' };
            const placed = await unlocked((options) => DemoOrders.x.place(chain, want, options, (name) => { if (steps[name] && !closing()) note(steps[name]); }));
            if (placed === CANCELLED) return false;
            CK.haptic.success();
            afterClose = () => xs.placed(placed, want);
            st.sending = false;
            sheet.close();
            return undefined;
          } catch (err) {
            if (CK.wallet.isRejection(err)) {
              CK.toast(tx(CK.wallet.protectRefused(err) ? 'wallet.needProtect' : 'swap.rejected'), { icon: 'info', tone: 'accent' });
              return release();
            }
            if (want && err && typeof err.orderId === 'string' && xd.family === 'sol') {
              DemoOrders.x.resendSetup(err);
              CK.haptic.success();
              afterClose = () => xs.placed({ orderId: err.orderId }, want);
              st.sending = false;
              sheet.close();
              return undefined;
            }
            const t = xs.failed(err);
            if (!t.block) console.error(err);
            if (t.key === 'xorderErr.placeUnsure') DemoOrders.x.refresh();
            return release(t.block ? { key: t.key, params: t.params, block: true } : { key: t.key });
          } finally {
            building = false;
          }
        }
        xs = xd ? mountStop(xd) : null;

        function setPay(usdt, units = 0n) {
          if (payUsdt() === !!usdt) return;
          from = usdt ? usdtAsset : gramOf();
          st.swap = null;
          st.plan = null;
          st.rate = 0;
          st.units = units;
          const max = maxUnits();
          st.pct = max > 0n ? clamp(T.fromUnits(st.units, from.decimals) / T.fromUnits(max, from.decimals) * 100, 0, 100) : 0;
          input.value = fieldText(T.fromUnits(st.units, from.decimals));
          slider.set(st.pct);
          paintChip(true);
          amountChanged();
        }
        chip.addEventListener('click', () => {
          if (chip.disabled || st.sending) return;
          CK.haptic.selection();
          setPay(!payUsdt());
        });
        let prefill = opts && (opts.pay === 'usdt' || payJet || (typeof opts.amount === 'string' && opts.amount)) ? { usdt: opts.pay === 'usdt' || !!payJet, amount: typeof opts.amount === 'string' ? opts.amount : '' } : null;
        function applyPrefill() {
          if (!prefill || (prefill.usdt && !st.known)) return;
          const want = prefill;
          prefill = null;
          if (want.usdt) {
            if (!canSwitch()) return;
            setPay(true);
          }
          if (want.amount) {
            input.value = want.amount;
            input.dispatchEvent(new Event('input'));
          }
        }
        applyPrefill();
        function askPassword() {
          return new Promise((resolve) => {
            passBox.hidden = false;
            swipeHost.hidden = true;
            passInput.value = '';
            passInput.focus({ preventScroll: true });
            if (st.trouble && st.trouble.key === 'swapSheet.passwordWrong') shakePass(passBox, true);
            passDone = (value) => {
              passDone = null;
              passInput.value = '';
              passBox.hidden = true;
              swipeHost.hidden = false;
              resolve(value);
            };
          });
        }
        function release(trouble) {
          st.swiped = null;
          st.sending = false;
          st.note = '';
          st.plan = null;
          st.trouble = trouble || null;
          input.disabled = false;
          body.classList.remove('is-busy');
          if (trouble && trouble.block) paint();
          else fetchQuote();
          return false;
        }
        const note = (key) => {
          st.note = key;
          paint();
        };
        async function signable() {
          try {
            if (await CK.wallet.canSign()) return null;
          } catch (err) {
            console.error(err);
            return { key: 'swap.buildFail' };
          }
          const now = CK.wallet.status;
          return now.bioUnknown ? { key: 'wallet.bioWait' } : { key: now.denied ? 'swapSheet.bioDenied' : now.lost ? 'swapSheet.bioLost' : 'swapSheet.noSign', block: true };
        }
        async function unlocked(fn) {
          const usePassword = CK.wallet.status.method === 'password';
          for (;;) {
            let password;
            if (usePassword && st.swiped && st.swiped.again && st.swiped.password) {
              password = st.swiped.password;
              st.swiped.password = undefined;
            } else if (usePassword) {
              st.note = '';
              paint();
              password = await askPassword();
              if (password === null || closing()) return CANCELLED;
            }
            note('swap.signing');
            try {
              return await fn({ ...(password ? { password } : {}), wallet: st.walletAt });
            } catch (err) {
              if (err.code === 'relay_refused' && err.reason === 'stale' && password && st.swiped && !st.swiped.again) st.swiped.password = password;
              if (err.code !== 'wrong_password') throw err;
              st.trouble = { key: 'swapSheet.passwordWrong' };
            } finally {
              password = undefined;
            }
          }
        }
        const viewNoWorse = (was, now) => {
          const a = was && was.view, b = now && now.view;
          if (!a || !b || now.draft === true) return false;
          const le = (x, y) => (typeof x === 'bigint' ? typeof y === 'bigint' && y <= x : y === undefined || y === null || y === x);
          const usd = (x, y) => (typeof x === 'number' ? typeof y === 'number' && y <= x + 1e-9 : y === null || y === undefined);
          return typeof a.minOut === 'bigint' && typeof b.minOut === 'bigint' && b.minOut >= a.minOut && le(a.gasWei, b.gasWei) && le(a.topupWei, b.topupWei) && le(a.fee, b.fee)
            && usd(a.feesUsd, b.feesUsd) && (a.total === undefined || b.total === a.total) && (a.units === undefined || b.units === a.units) && !marketShort(b);
        };
        const swapNoWorse = (was, now) => (!was && !now) || (!!was && !!now && now.units === was.units && now.minOut >= was.minOut && now.feeBps === was.feeBps && now.destination === was.destination);
        async function freshPlan() {
          const wait = st.askedAt + QUOTE_GAP_MS - Date.now();
          if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
          if (closing()) return null;
          st.askedAt = Date.now();
          try {
            if (payUsdt()) {
              const swap = await usdtSwapQuote(st.units, st.slippageBps, payId);
              const wallet = T.wallet.address;
              swap.ahead = { at: Date.now(), wallet, job: T.api('swap/build?ahead=1', { body: { quoteId: swap.quoteId, wallet } }) };
              swap.ahead.job.catch(() => {});
              return { plan: await relayAsk(swap.minOut), swap };
            }
            return { plan: await relayAsk(st.units), swap: null };
          } catch (_) {
            return null;
          }
        }
        async function goAgain() {
          const swiped = st.swiped;
          if (!swiped || swiped.again) return false;
          note('swap.building');
          const next = await freshPlan();
          if (closing()) return true;
          if (!next || !viewNoWorse(swiped.plan, next.plan) || !swapNoWorse(swiped.swap, next.swap)) {
            if (next) {
              st.swiped = null;
              st.sending = false;
              st.note = '';
              st.trouble = null;
              input.disabled = false;
              body.classList.remove('is-busy');
              st.plan = next.plan;
              st.swap = next.swap;
              st.loading = false;
              CK.toast(tx('swap.priceMoved'), { icon: 'info', tone: 'accent' });
              paint();
              return true;
            }
            return false;
          }
          st.swiped = { plan: next.plan, swap: next.swap, again: true, password: swiped.password };
          swiped.password = undefined;
          const run = selling ? signSale(next.plan) : payUsdt() ? signUsdt(next.plan, next.swap) : signBuy(next.plan);
          await run;
          return true;
        }
        function failed(err) {
          if (CK.wallet.isRejection(err)) {
            CK.toast(tx(CK.wallet.protectRefused(err) ? 'wallet.needProtect' : 'swap.rejected'), { icon: 'info', tone: 'accent' });
            return release();
          }
          if (err.code === 'relay_refused' && err.reason === 'stale') {
            return goAgain().then((went) => (went ? false : release()));
          }
          console.error(err);
          if (err.code === 'relay_refused' || err.code === 'no_gas') return release(quoteTrouble(err, netName, chain, selling, { units: st.units, asset: from }));
          const key = SIGN_ERRORS[err.code];
          return release(key ? { key, block: true } : { key: 'swapSheet.tryAgain' });
        }
        async function connect() {
          if (!begin()) return;
          try {
            const stop = await signable();
            if (stop) {
              release(stop);
              return;
            }
            const address = await unlocked((options) => lib.ensureAddress(options));
            if (address === CANCELLED) {
              release();
              return;
            }
            st.addr = address;
            if (own) nets.own[chain] = address;
            else nets.evm = address;
            CK.haptic.success();
            loadBalances(true);
            release();
          } catch (err) {
            failed(err);
          } finally {
            building = false;
          }
        }
        function handOver(gone) {
          handing = !gone;
          emit();
          sheet.close();
          if (gone) openTrack();
        }
        async function signBuy(plan) {
          const stop = await signable();
          if (stop) return release(stop);
          let signed;
          try {
            signed = await unlocked((options) => CK.wallet.signRelayDeposit(plan, options));
          } catch (err) {
            return failed(err);
          }
          if (signed === CANCELLED) return false;
          const v = plan.view;
          record = {
            kind: 'buy', chain, token: listing.address, requestId: v.requestId, wallet: T.wallet.address, phase: 'sending', sentAt: Date.now(), hash: signed.hash || '', seqno: signed.seqno, validUntil: signed.validUntil, before: heldBefore(chain, listing.address),
            gave: { sym: from.sym, decimals: from.decimals, units: v.total.toString() },
            got: { sym: to.sym, decimals: outDecimals(v), out: v.out.toString(), min: v.minOut.toString() },
            feeUnits: signed.fee.toString(), topupUsd: v.topupUsd, payUsd: gramUsd()
          };
          saveRecord();
          rememberBought(chain, listing.address);
          followDeal(record.requestId);
          CK.haptic.success();
          const gone = active !== mine;
          relayDeposit(record, signed.boc);
          handOver(gone);
          return undefined;
        }
        async function signUsdt(plan, swap) {
          const stop = await signable();
          if (stop) return release(stop);
          const owner = T.wallet.address;
          let built;
          try {
            const ownTon = await CK.wallet.depositAddress();
            if (!ownTon.verified || ownTon.address !== owner) return release({ key: 'swapSheet.stopped', block: true });
            const early = swap.ahead && swap.ahead.wallet === owner && Date.now() - swap.ahead.at < SWAP_BUILT_MAX_AGE_MS ? await swap.ahead.job.catch(() => null) : null;
            built = early || await T.api('swap/build', { body: { quoteId: swap.quoteId, wallet: owner } });
          } catch (err) {
            console.error(err);
            if (err.message === 'quote_stale' || err.message === 'price_moved') return release();
            return release({ key: 'swap.buildFail' });
          }
          if (closing()) return release();
          const otherWallets = st.rows.filter((r) => r.id !== payId && r.wallet).map((r) => r.wallet);
          const intent = { owner, offer: payId, ask: NATIVE, units: st.units, minOut: swap.minOut, feeBps: swap.feeBps, destination: swap.destination, otherWallets, swipedAt: Date.now(), ...(payJet ? { venue: swap.venue } : {}) };
          if (payJet && window.DemoSwap && DemoSwap.route) {
            const R = DemoSwap.route;
            const floor = await R.floorCheck({ from: { id: payId, sym: usdtAsset.sym, decimals: usdtAsset.decimals, inst: usdtAsset.inst }, to: R.tonAsset(), units: st.units }, swap);
            if (closing()) return release();
            if (floor) return release(floor);
            if (!Audit.swappable(payId)) {
              const row = st.rows.find((r) => r.id === payId);
              let confirmed = false;
              try {
                confirmed = !!(row && row.wallet && row.wallet === swap.destination) && await R.offerWalletConfirmed(payId, owner, row.wallet);
              } catch (err) {
                console.error(err);
                return release({ key: 'swapSheet.tryAgain' });
              }
              if (closing()) return release();
              if (!confirmed) return release({ key: 'swapSheet.stopped', block: true });
              intent.offerWallet = row.wallet;
            }
          }
          const v = plan.view;
          const onStep = (name) => {
            if (name === 'swap_sent' || name === 'first_sent') {
              followDeal(v.requestId, !payJet);
              if (payJet) note({ key: 'route.step', params: { i: 1, n: 2, a: usdtAsset.sym, b: gramOf().sym } });
              else note('xnet.usdtSwapping');
            } else if (name === 'swapped' || name === 'first_landed') note(payJet ? { key: 'route.step', params: { i: 2, n: 2, a: gramOf().sym, b: to.sym } } : 'xnet.usdtSending');
          };
          const beforeSecond = () => preflight(v);
          let paid;
          try {
            paid = await unlocked((options) => (payJet ? CK.wallet.signRoute({ built, intent }, { kind: 'relay', plan }, { ...options, beforeSecond }, onStep) : CK.wallet.payRelayWithUsdt(built, intent, plan, options, onStep)));
          } catch (err) {
            if (err.code === 'usdt_step_failed' || err.code === 'route_step_failed' || err.code === 'route_step_held') {
              const key = err.left === 'gram' ? 'xnet.usdtLeftGram' : err.left === 'usdt' ? 'xnet.usdtLeftUsdt' : err.left === 'offer' ? 'swapSheet.fundsKept' : 'xnet.usdtLeftUnknown';
              DemoSwap.loadBalances().then(emit, emit);
              if (closing()) CK.toast(tx(key), { icon: 'info', tone: 'accent' });
              if (err.left === 'gram') setPay(false, v.total);
              release({ key, tone: 'note', block: err.left !== 'gram' });
              whatsThere();
              return false;
            }
            if (err.code !== 'send_unsure') return failed(err);
            paid = { hash: err.hash || '', seqno: 0, unsure: true };
          }
          if (paid === CANCELLED) return false;
          record = {
            kind: 'buy', chain, token: listing.address, requestId: v.requestId, wallet: T.wallet.address, phase: 'sent', sentAt: Date.now(), hash: paid.hash || '', seqno: paid.seqno || 0, before: heldBefore(chain, listing.address),
            usdtLeg: !payJet,
            validUntil: Math.floor(Date.now() / 1000) + 180,
            gave: payJet ? { sym: usdtAsset.sym, decimals: usdtAsset.decimals, units: st.units.toString() } : { sym: gramOf().sym, decimals: GRAM_DECIMALS, units: v.total.toString() },
            got: { sym: to.sym, decimals: outDecimals(v), out: v.out.toString(), min: v.minOut.toString() },
            feeUnits: (typeof paid.fee === 'bigint' ? paid.fee : v.fee || 0n).toString(), feeBps: T.FEE_BPS, topupUsd: v.topupUsd || 0, payUsd: gramUsd()
          };
          saveRecord();
          rememberBought(chain, listing.address);
          CK.haptic.success();
          const gone = active !== mine;
          if (paid.unsure) CK.wallet.resend().catch(() => null);
          track();
          handOver(gone);
          return undefined;
        }
        async function signOwnSale(plan) {
          const stop = await signable();
          if (stop) return release(stop);
          const v = plan.view;
          const saleRecord = (phase, hash) => ({
            kind: 'sell', chain, token: listing.address, requestId: v.requestId, wallet: T.wallet.address, phase, sentAt: Date.now(), hash: hash || '', seqno: 0, validUntil: 0,
            gave: { sym: from.sym, decimals: from.decimals, units: v.units.toString() },
            got: { sym: to.sym, decimals: to.decimals, out: v.out.toString(), min: v.minOut.toString() },
            feeUnits: '0', topupUsd: 0
          });
          const onStep = (name, info) => {
            if (name !== 'signed') return;
            record = saleRecord('sending', info && info.hash);
            saveRecord();
            followDeal(v.requestId);
          };
          let sent;
          try {
            sent = await unlocked((options) => lib.sell(plan, options, onStep));
          } catch (err) {
            if (err.code !== 'send_unsure') {
              if (record && record.requestId === v.requestId) {
                record = null;
                saveRecord();
              }
              return failed(err);
            }
            sent = null;
          }
          if (sent === CANCELLED) return false;
          record = saleRecord(sent ? 'sent' : 'unsure', sent ? sent.hash : record && record.hash);
          saveRecord();
          CK.haptic.success();
          const gone = active !== mine;
          track();
          handOver(gone);
          return undefined;
        }
        async function signSale(plan) {
          if (own) return signOwnSale(plan);
          const stop = await signable();
          if (stop) return release(stop);
          let signed;
          try {
            signed = await unlocked((options) => E.signSell(plan, options));
          } catch (err) {
            return failed(err);
          }
          if (signed === CANCELLED) return false;
          const v = plan.view;
          record = {
            kind: 'sell', chain, token: listing.address, requestId: v.requestId, wallet: T.wallet.address, phase: 'sending', sentAt: Date.now(), hash: signed.deposit.hash || '', seqno: 0, validUntil: 0,
            gave: { sym: from.sym, decimals: from.decimals, units: v.units.toString() },
            got: { sym: to.sym, decimals: to.decimals, out: v.out.toString(), min: v.minOut.toString() },
            feeUnits: '0', topupUsd: 0
          };
          saveRecord();
          CK.haptic.success();
          const gone = active !== mine;
          relaySale(record, signed);
          handOver(gone);
          return undefined;
        }
        function begin() {
          if (st.sending || building || record || !T.wallet || T.wallet.readOnly) return false;
          st.sending = true;
          st.trouble = null;
          building = true;
          stopQuotes();
          input.blur();
          input.disabled = true;
          body.classList.add('is-busy');
          note('swap.building');
          return true;
        }
        function confirm() {
          if (xs && xs.owns()) return placeStop();
          if (!fresh()) return false;
          if (saleUnknown() || (saleCheck() && saleCheck().state === 'no')) {
            paint();
            return false;
          }
          const plan = st.plan, swap = st.swap;
          if (marketShort(plan.view)) {
            paint();
            return false;
          }
          if (!begin()) return false;
          st.swiped = { plan, swap, again: false };
          return (selling ? signSale(plan) : payUsdt() ? signUsdt(plan, swap) : signBuy(plan)).finally(() => { building = false; });
        }

        const whatsThere = () => {
          const job = selling ? loadBalances(true).then(() => null) : DemoSwap.loadBalances();
          return job.then((answer) => {
            if (closing()) return;
            if (!selling) {
              if (!answer) return;
              const rowOf = (id) => answer.rows.find((r) => r.id === id);
              st.gram = rowOf(NATIVE) ? rowOf(NATIVE).units : 0n;
              const usdt = rowOf(payId);
              st.usdt = usdt && usdt.risk !== 'suspicious' ? usdt.units : 0n;
              st.rows = answer.rows;
            }
            const first = !st.known;
            st.known = true;
            paintChip();
            applyPrefill();
            if (first && xs) xs.firstBalance();
            if (first && canSwitch() && !payUsdt() && st.units <= 0n && st.gram <= PAY_RESERVE) setPay(true);
            paint();
          }, () => {
            if (!closing()) CK.toast(tx('swap.loadFail'), { icon: 'warning', tone: 'down' });
          });
        };
        let balanceTryAt = Date.now() + QUOTE_RETRY_MS;
        timer = setInterval(() => {
          if (document.hidden || st.sending) return;
          if (!st.known && Date.now() >= balanceTryAt) {
            balanceTryAt = Date.now() + QUOTE_RETRY_MS;
            whatsThere();
          }
          if (!st.plan) {
            if (st.trouble && st.trouble.retryAt && Date.now() >= st.trouble.retryAt && !st.loading) fetchQuote();
            return;
          }
          if (Date.now() - st.plan.at >= QUOTE_REFRESH_MS && Date.now() - st.askedAt >= QUOTE_GAP_MS) fetchQuote();
          else paint();
        }, 1000);
        document.addEventListener('visibilitychange', onVisible);
        mine.dispose = () => {
          stopQuotes();
          clearInterval(timer);
          document.removeEventListener('visibilitychange', onVisible);
          if (passDone) passDone(null);
          if (xs) xs.dispose();
        };
        if (opts && opts.units > 0n) {
          st.units = opts.units;
          input.value = fieldText(T.fromUnits(st.units, from.decimals));
          amountChanged();
        }
        paint();
        const netHidden = netRow ? netRow.hidden : true;
        if (netRow && canUsdt) netRow.hidden = false;
        pinHeight(this, sheet, formFloor(), payJet ? undefined : 0);
        if (netRow) netRow.hidden = netHidden;
        if (xs && xd.forOrder) xs.call();
        whatsThere();
        setTimeout(() => {
          if (!closing() && CK.wallet) CK.wallet.depositAddress().catch(() => {});
          if (!closing() && typeof lib.bundle === 'function') lib.bundle().catch(() => {});
        }, AFTER_RISE_MS);
        warmRelay();
        if (st.addr === undefined || st.addr === null) {
          lib.address().then((address) => {
            if (closing()) return;
            if (own) nets.own[chain] = address || null;
            else nets.evm = address || null;
            st.addr = address || null;
            paint();
            if (address && st.units > 0n) fetchQuote();
          }, () => {
            if (closing()) return;
            st.addr = null;
            paint();
          });
        }
      }
    });
  }

  function walletChanged(wallet) {
    if (record && !sameWallet(record)) {
      clearTimeout(pollTimer);
      record = null;
    }
    clearNets();
    if (!wallet && active) active.sheet.close();
    if (wallet) {
      resume();
      loadBalances(true);
    }
    emit();
  }

  const WITHDRAW_PLAN_MS = 60000;
  const ADDRESS_LINES = { self: 'walletFlow.ownAddress', checksum: 'xnet.badChecksum', contract: 'xnet.contractAddress' };
  const NET_PAID_KEY = 'ck-sent-net:';
  const NET_PAID_KEPT = 50;
  const familyOf = (chain) => (chain === 'sol' || chain === 'tron' ? chain : 'evm');
  const paidKeyOf = (chain, wallet) => `${NET_PAID_KEY}${familyOf(chain)}:${wallet || ''}`;
  const addrText = (chain, a) => (familyOf(chain) === 'evm' ? String(a).toLowerCase() : String(a));
  function netPaid(chain, wallet) {
    try {
      const list = JSON.parse(localStorage.getItem(paidKeyOf(chain, wallet)) || '[]');
      return Array.isArray(list) ? list.filter((a) => typeof a === 'string' && a.length <= 64) : [];
    } catch (_) {
      return [];
    }
  }
  function rememberNetPaid(chain, wallet, to) {
    if (!to) return;
    const mine = addrText(chain, to);
    try { localStorage.setItem(paidKeyOf(chain, wallet), JSON.stringify([mine, ...netPaid(chain, wallet).filter((a) => a !== mine)].slice(0, NET_PAID_KEPT))); } catch (_) { }
  }
  const endsOf = (chain, a) => { const t = addrText(chain, a); return `${t.slice(0, 6)}…${t.slice(-4)}`; };
  function netLookalike(chain, wallet, to) {
    if (!to) return null;
    const mine = addrText(chain, to);
    const list = netPaid(chain, wallet);
    if (list.includes(mine)) return null;
    const look = endsOf(chain, mine);
    return list.find((a) => endsOf(chain, a) === look) || null;
  }

  function withdrawStep(asset, onSent, presetTo) {
    const chain = asset.chain, netName = chainNameOf(chain), gasSym = GAS_COIN[chain] || 'ETH';
    const own = OWN[chain] || null, lib = libOf(chain), gasDec = gasDecimals(chain);
    const addrNet = chain === 'bsc' && !asset.native ? `${netName} (BEP-20)` : netName;
    const st = { units: 0n, pct: 0, to: '', touched: false, check: null, plan: null, gasWei: null, maxNative: null, sending: false, note: '', trouble: null, walletAt: T.wallet ? T.wallet.address : null };
    return {
      title: tx('action.withdraw'),
      render(body, flow) {
        body.classList.add('tk-order', 'sw-order');
        body.innerHTML = `
          <div class="w-card">
            <div class="w-card-top sw-card-top"><button class="sw-max press" type="button" aria-label="${tx('common.max')}">${icon('wallet', { size: 14 })}<b class="w-from-bal"></b></button></div>
            <div class="w-card-main"><span class="w-token"><span class="xn-logo"></span><b></b><em class="tag"></em></span><input class="w-amt w-qty" inputmode="decimal" autocomplete="off" placeholder="0" aria-label="${tx('common.amount')}"></div>
          </div>
          <div class="tk-order-slider"></div>
          <textarea class="w-addr" rows="2" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="64"></textarea>`;
        const addrPh = tx('xnet.addressOn', { net: addrNet });
        const addr = $('.w-addr', body);
        addr.placeholder = addrPh;
        addr.setAttribute('aria-label', addrPh);
        $('.xn-logo', body).outerHTML = CK.coinLogo(asset.inst || { id: `${chain}:${asset.address}`, sym: asset.sym, neutral: true, logo: null }, 28);
        $('.w-token b', body).textContent = asset.sym;
        $('.w-token .tag', body).textContent = netName;
        $('.w-from-bal', body).textContent = qtySym(asset.units, asset);
        const dock = CK.el(`<div class="sheet-dock sw-dock">
          <p class="sw-line" role="status"></p>
          <div class="tk-swipe"></div>
          <button class="btn btn--tinted press xn-offer" type="button" hidden></button>
          <form class="sw-pass" hidden><input class="sw-pass-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${tx('swapSheet.password')}" aria-label="${tx('swapSheet.password')}"><button class="btn press" type="submit" aria-label="${tx('swapSheet.passwordGo')}">${icon('check', { size: 22 })}</button></form>
        </div>`);
        flow.sheet.el.appendChild(dock);
        const input = $('.w-qty', body), lineEl = $('.sw-line', dock), swipeHost = $('.tk-swipe', dock), offer = $('.xn-offer', dock), passBox = $('.sw-pass', dock), passInput = $('.sw-pass-input', dock);
        const swipe = CK.swipeConfirm(swipeHost, { tone: 'accent', label: '', onConfirm: confirm, resetAfter: 60000, reportsOwnResult: true });
        let passDone = null, gasTimer = 0, gasGen = 0, gone = false;
        passBox.addEventListener('submit', (e) => {
          e.preventDefault();
          if (passInput.value && passDone) passDone(passInput.value);
        });
        const ownAddress = chain === 'tron' ? nets.own.tron || '' : '';
        if (chain === 'tron') offer.innerHTML = `${icon('copy', { size: 20 })}<span></span>`;
        if (chain === 'tron') $('span', offer).textContent = ownAddress ? `${ownAddress.slice(0, 6)}…${ownAddress.slice(-6)}` : '';
        else offer.textContent = tx('xnet.gasTopup', { sym: gasSym });
        offer.addEventListener('click', () => {
          CK.haptic.light();
          if (chain === 'tron') {
            if (ownAddress) {
              CK.copyText(ownAddress).then((copied) => {
                if (copied) CK.toast(tx('common.addressCopied'), { icon: 'check-circle', tone: 'up' });
                else CK.toast(tx('common.copyFail'), { icon: 'warning', tone: 'down' });
              });
            }
            return;
          }
          flow.close();
          setTimeout(() => DemoNets.buyGas(chain), 0);
        });
        const canWithdraw = typeof lib.quoteWithdraw === 'function' && typeof lib.withdraw === 'function';
        const maxUnits = () => {
          if (asset.native && typeof st.maxNative === 'bigint') return st.maxNative > 0n ? st.maxNative : 0n;
          if (!asset.native || st.gasWei === null) return asset.units;
          return asset.units > st.gasWei ? asset.units - st.gasWei : 0n;
        };
        const problem = () => {
          if (!st.to) return 'empty';
          if (!st.check || st.check.text !== st.to) return 'wait';
          return st.check.reason;
        };
        const planFits = () => !!st.plan && st.plan.view.units === st.units && !!st.check && st.plan.view.to === st.check.address;
        const noGas = () => planFits() && st.plan.view.short > 0n;
        const feeText = () => qtySym(st.plan.view.gasWei, { sym: gasSym, decimals: gasDec });
        function setLine(key, params, tone) {
          const text = key ? tx(key, params) : '';
          if (lineEl.textContent !== text) lineEl.textContent = text;
          lineEl.dataset.tone = tone || 'bad';
        }
        function paint() {
          const bad = problem();
          const over = st.units > asset.units;
          if (st.note) setLine(st.note, null, 'note');
          else if (!canWithdraw) setLine('xnet.withdrawSoon', { net: netName });
          else if (st.trouble) setLine(st.trouble.key, st.trouble.params);
          else if (over) setLine('walletFlow.overBalance');
          else if (noGas() && chain === 'tron') setLine('xnet.trxForFee', { sum: feeText() });
          else if (noGas()) setLine('xnet.noGas', { net: netName, sym: gasSym });
          else if (bad && bad !== 'wait' && bad !== 'empty' && (st.touched || bad === 'self')) setLine(ADDRESS_LINES[bad] || 'xnet.badAddress', { net: addrNet });
          else if (!bad && netLookalike(chain, st.walletAt, st.check.address)) setLine('withdraw.lookalike');
          else if (planFits()) setLine(own ? 'xnet.feeIs' : 'xnet.gasIs', { sum: feeText() }, 'note');
          else setLine('');
          offer.hidden = st.sending || !canWithdraw || !noGas() || (chain === 'tron' && !ownAddress);
          swipeHost.hidden = !offer.hidden || !passBox.hidden;
          let label = 'withdraw.swipe';
          if (asset.units <= 0n) label = 'order.notHeld';
          else if (!st.to) label = 'withdraw.needAddress';
          else if (bad && bad !== 'wait') label = 'withdraw.checkAddress';
          else if (st.units <= 0n) label = 'order.needAmount';
          else if (!planFits() && !over) label = 'swap.waitQuote';
          swipe.setDisabled(label !== 'withdraw.swipe' || !canWithdraw || over || noGas() || st.sending);
          swipe.update({ label: tx(label) });
        }
        function checkTyped() {
          const text = st.to;
          if (!text || !canWithdraw) {
            st.check = null;
            askGas();
            return;
          }
          (own ? lib.checkAddress(text, asset.native ? undefined : asset.address) : E.checkAddress(chain, text, asset.native ? undefined : asset.address)).then((answer) => {
            if (gone || st.to !== text) return;
            st.check = { text, reason: answer.reason || null, address: answer.address || null };
            askGas();
          }, (err) => {
            if (gone || st.to !== text) return;
            console.error(err);
            st.check = { text, reason: 'format', address: null };
            paint();
          });
          paint();
        }
        function askGas() {
          clearTimeout(gasTimer);
          const g = ++gasGen;
          if (!planFits()) st.plan = null;
          if (!canWithdraw || problem() || st.units <= 0n || st.units > asset.units) {
            paint();
            return;
          }
          gasTimer = setTimeout(() => {
            lib.quoteWithdraw({ chain, token: asset.address, to: st.check.address, units: st.units, decimals: asset.decimals }).then((plan) => {
              if (g !== gasGen || gone) return;
              st.plan = plan;
              st.gasWei = plan.view.gasWei;
              st.maxNative = typeof plan.view.maxNative === 'bigint' ? plan.view.maxNative : null;
              st.trouble = null;
              if (asset.native && st.units > maxUnits()) {
                st.units = maxUnits() * BigInt(Math.round(st.pct * 10)) / 1000n;
                input.value = DemoWallet.unitsText(st.units, asset.decimals);
                askGas();
                return;
              }
              paint();
            }, (err) => {
              if (g !== gasGen || gone) return;
              if (err.code === 'bad_address') {
                st.check = { text: st.to, reason: err.reason || 'format', address: null };
                st.touched = true;
              } else if (err.code === 'too_much') {
                st.trouble = { key: 'walletFlow.overBalance' };
              } else if (err.code === 'too_small') {
                st.trouble = { key: 'xnet.tooSmallNew', params: { sum: qtySym(typeof err.needs === 'bigint' ? err.needs : 0n, { sym: gasSym, decimals: gasDec }) } };
              } else if (err.code === 'relay_refused' && err.reason === 'gas') {
                st.trouble = { key: 'xnet.feeTooHigh' };
              } else if (err.code === 'bad_intent') {
                console.error(err);
                st.trouble = { key: 'swapSheet.stopped' };
              } else {
                console.error(err);
                st.trouble = { key: 'swap.quoteFail' };
                gasTimer = setTimeout(askGas, QUOTE_RETRY_MS);
              }
              paint();
            });
          }, QUOTE_DELAY_MS * 2);
          paint();
        }
        const planTimer = setInterval(() => {
          if (!document.hidden && !st.sending && st.plan && Date.now() - st.plan.at > WITHDRAW_PLAN_MS) askGas();
        }, 5000);
        const slider = CK.slider($('.tk-order-slider', body), {
          label: tx('order.shareAria'), min: 0, max: 100, step: .5, value: 0,
          stops: [.25, .5, .75, 1],
          format: (v) => qtySym(maxUnits() * BigInt(Math.round(v * 10)) / 1000n, asset),
          onInput(v) {
            st.pct = v;
            st.units = maxUnits() * BigInt(Math.round(v * 10)) / 1000n;
            input.value = DemoWallet.unitsText(st.units, asset.decimals);
            st.trouble = null;
            askGas();
          }
        });
        DemoWallet.amountField(input);
        input.addEventListener('input', () => {
          const max = maxUnits();
          DemoWallet.fitFraction(input, asset.decimals);
          st.units = DemoWallet.typedUnits(input.value, asset.decimals);
          st.pct = max > 0n ? clamp(T.fromUnits(st.units, asset.decimals) / T.fromUnits(max, asset.decimals) * 100, 0, 100) : 0;
          slider.set(st.pct);
          st.trouble = null;
          askGas();
        });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
        $('.sw-max', body).addEventListener('click', () => {
          const max = maxUnits();
          if (st.sending || max <= 0n) return;
          CK.haptic.selection();
          input.value = DemoWallet.unitsText(max, asset.decimals);
          input.dispatchEvent(new Event('input'));
        });
        addr.addEventListener('input', () => {
          st.to = addr.value.replace(/\s/g, '');
          st.trouble = null;
          st.touched = st.to.length >= (own ? own.minAddress : 42);
          checkTyped();
        });
        addr.addEventListener('blur', () => {
          st.touched = true;
          paint();
        });
        if (typeof presetTo === 'string' && presetTo) Promise.resolve().then(() => {
          if (!addr.isConnected || addr.value) return;
          addr.value = presetTo;
          addr.dispatchEvent(new Event('input'));
        });
        addr.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addr.blur();
          }
        });
        function askPassword() {
          return new Promise((resolve) => {
            swipeHost.hidden = true;
            passBox.hidden = false;
            passInput.value = '';
            passInput.focus({ preventScroll: true });
            if (st.trouble && st.trouble.key === 'swapSheet.passwordWrong') shakePass(passBox, true);
            passDone = (value) => {
              passDone = null;
              passInput.value = '';
              passBox.hidden = true;
              swipeHost.hidden = false;
              resolve(value);
            };
          });
        }
        function release(trouble) {
          st.sending = false;
          st.note = '';
          st.trouble = trouble || null;
          input.disabled = false;
          addr.disabled = false;
          body.classList.remove('is-busy');
          paint();
          return false;
        }
        function confirm() {
          if (st.sending || !canWithdraw || problem() || st.units <= 0n || st.units > asset.units || !planFits() || noGas() || !T.wallet || T.wallet.readOnly) return false;
          st.sending = true;
          st.trouble = null;
          input.blur();
          addr.blur();
          input.disabled = true;
          addr.disabled = true;
          body.classList.add('is-busy');
          st.note = 'swap.signing';
          paint();
          return send();
        }
        async function send() {
          const plan = st.plan;
          try {
            if (!(await CK.wallet.canSign())) {
              const now = CK.wallet.status;
              return release({ key: now.bioUnknown ? 'wallet.bioWait' : now.denied ? 'swapSheet.bioDenied' : now.lost ? 'swapSheet.bioLost' : 'swapSheet.noSign' });
            }
          } catch (err) {
            console.error(err);
            return release({ key: 'swapSheet.tryAgain' });
          }
          const usePassword = CK.wallet.status.method === 'password';
          for (;;) {
            let password;
            if (usePassword) {
              st.note = '';
              paint();
              password = await askPassword();
              if (password === null || flow.closing) return release();
            }
            st.note = 'swap.signing';
            paint();
            try {
              const sent = await lib.withdraw(plan, { ...(password ? { password } : {}), wallet: st.walletAt });
              rememberNetPaid(chain, st.walletAt, plan.view.to);
              CK.haptic.success();
              CK.toast(tx('xnet.sent', { net: netName }), { icon: 'check-circle', tone: 'up' });
              loadBalances(true);
              if (onSent) onSent(sent);
              if (!flow.closing) flow.close();
              return undefined;
            } catch (err) {
              if (err.code === 'wrong_password') {
                st.trouble = { key: 'swapSheet.passwordWrong' };
                continue;
              }
              if (CK.wallet.protectRefused(err)) return release({ key: 'wallet.needProtect' });
              if (CK.wallet.isRejection(err)) return release();
              console.error(err);
              if (err.code === 'no_gas') return release(chain === 'tron' && st.plan ? { key: 'xnet.trxForFee', params: { sum: feeText() } } : { key: 'xnet.noGas', params: { net: netName, sym: gasSym } });
              if (err.code === 'withdraw_failed') {
                loadBalances(true);
                return release({ key: 'xnet.lastFailed' });
              }
              if (err.code === 'too_much' || err.code === 'too_small') {
                st.plan = null;
                release(err.code === 'too_much' ? { key: 'walletFlow.overBalance' } : null);
                askGas();
                return false;
              }
              if (err.code === 'relay_refused' && err.reason === 'stale') {
                st.plan = null;
                release();
                askGas();
                return false;
              }
              if (err.code === 'send_unsure' || err.code === 'send_stale') {
                CK.toast(tx('swapSheet.unsure'), { icon: 'info', tone: 'accent' });
                loadBalances(true);
                if (!flow.closing) flow.close();
                return undefined;
              }
              return release({ key: SIGN_ERRORS[err.code] || 'swapSheet.tryAgain' });
            } finally {
              password = undefined;
            }
          }
        }
        paint();
        return () => {
          gone = true;
          gasGen++;
          clearTimeout(gasTimer);
          clearInterval(planTimer);
          if (passDone) passDone(null);
        };
      }
    };
  }

  let cfgJob = null, cfgTimer = 0;
  function loadCfg() {
    if (cfgJob || cfg) return;
    clearTimeout(cfgTimer);
    cfgJob = T.config().then((config) => {
      cfg = config && config.state === 'open' ? config : null;
      emit();
    }, (err) => {
      console.error(err);
      cfgTimer = setTimeout(loadCfg, CONFIG_RETRY_MS);
    }).finally(() => { cfgJob = null; });
  }

  window.DemoNets = {
    netLookalike,
    rememberNetPaid,
    build(context) {
      ctx = context;
      loadCfg();
      T.onWallet(walletChanged);
      if (T.wallet) walletChanged(T.wallet);
    },
    listed: (inst) => !!listingOf(inst),
    decimalsOf(chain, address) {
      if (typeof chain !== 'string' || typeof address !== 'string' || !address) return null;
      if (chain !== 'solana' && address.toLowerCase() === NATIVE_ADDRESS) return WEI_DECIMALS;
      const key = chain === 'solana' ? `solana:${address}` : `${chain}:${address.toLowerCase()}`;
      const token = LISTED.get(key) || REFUNDS.get(key) || seen.get(key);
      return token && Number.isInteger(token.decimals) ? token.decimals : null;
    },
    txLink(chain, hash) {
      const base = EVM_EXPLORER[chain];
      if (!base || typeof hash !== 'string') return null;
      const ok = chain === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(hash) : /^0x[0-9a-f]{64}$/i.test(hash);
      return ok ? base + hash : null;
    },
    marketCoinOf,
    networkOf,
    chains: () => E.pins().chains.map((chain) => ({ key: chain.key, name: chain.name, gas: GAS_COIN[chain.key] || 'ETH', inst: D.byId[(GAS_COIN[chain.key] || 'ETH').toLowerCase()] || null, mark: netMark(chain.key), net: null, deposit: true }))
      .concat(OWN_KEYS.map((key) => ({ key, name: OWN[key].name, gas: GAS_COIN[key], inst: nativeCoinOf(key), mark: netMark(key), net: OWN[key].net, deposit: OWN[key].deposit !== false }))),
    netMark,
    held: () => E.pins().chains.map((chain) => chain.key).concat(OWN_KEYS).flatMap((key) => heldOn(key).map((row) => ({ ...row, net: chainNameOf(key) }))),
    withdrawRowOf(coinId) {
      if (typeof coinId !== 'string' || !coinId.startsWith('tron:') || !OWN_KEYS.includes('tron')) return null;
      const rows = heldOn('tron');
      const row = coinId === TRX_ID ? rows.find((one) => one.native) : rows.find((one) => !one.native && `tron:${one.address}` === coinId);
      return row ? { ...row, net: chainNameOf('tron') } : null;
    },
    withdrawStep,
    evmAddress: (unlock) => (unlock ? E.ensureAddress(unlock === true ? undefined : unlock) : E.address()),
    depositAddress: (unlock) => CK.wallet.evmDepositAddress(unlock ? { unlock: true } : undefined),
    nativeWei: (chain) => nets.native.get(chain),
    gasSym: (chain) => GAS_COIN[chain] || 'ETH',
    buyGas(chain) {
      const go = (tries) => {
        if (!CK.sheet.top) open(null, 'buy', { gas: chain, units: gasGramFor(chain) });
        else if (tries > 0) setTimeout(() => go(tries - 1), 60);
      };
      go(30);
    },
    open,
    loadBalances,
    ensurePrice,
    withListed,
    known(chain) {
      const out = [];
      const add = (address, sym) => {
        if (typeof address === 'string' && address && !out.some((one) => one.address === address)) out.push({ address, sym: typeof sym === 'string' ? sym : null });
      };
      LISTED.forEach((token, key) => { if (key.startsWith(chain + ':')) add(token.address, token.symbol); });
      knownOn(chain).forEach((address) => {
        const inst = D.instruments.get(chain + ':' + address);
        add(address, inst && inst.sym);
      });
      return out.slice(0, KNOWN_MAX);
    },
    down: () => Array.from(nets.down).map(chainNameOf),
    ownMissing: () => ownMissing().map(chainNameOf),
    get ownOpening() { return ownOpening; },
    openOwn,
    get pending() { return record; },
    openTrack: () => openTrack(),
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    }
  };
})();
