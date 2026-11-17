(function () {
  'use strict';
  const CK = window.CK;
  const T = CK.ton;
  const keyCap = CK.wallet && typeof CK.wallet.keyAccess === 'function' ? CK.wallet.keyAccess('evm') : null;
  const withKey = (fn, options) => (keyCap ? keyCap(fn, options) : Promise.reject(fail('no_wallet')));

  const BUNDLE = 'kit/vendor/evm-wallet-0.20.1.min.js';
  const BUNDLE_SRI = 'sha384-ZlKV+otGWd8NDvj/49ZuzkB+UqbagACB3ssRDMimO2Gyr7NnxAbJNWpWxCVwijdS';
  const RELAY = 'https://api.relay.link';
  const RELAY_MS = 15000;
  const RELAY_GAP_MS = 2600;
  const RELAY_BUSY_TRIES = 3;
  const DERIVATION = [0x8000002c, 0x8000003c, 0x80000000, 0, 0];

  const TON_CHAIN_ID = 224235520;
  const GRAM_CURRENCY = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
  const DEPOSITORY = 'EQCrdGsDTqA2t6xRR4N6V4J705F7w_VQbUdHnofsh-8lVIPs';
  const DEPOSITORY_RAW = T.rawAddress(DEPOSITORY);
  const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

  const ZEROX = '0x0000000000001ff3684f28c67538d4d072c22734';
  const KYBER = '0x6131b5fae19ea4f9d964eac0408e4408b66337b5';
  const RELAY_PROXY = '0x5567954cd026cebfe486062cb75848e0f1c12e58';
  const RELAY_DEPOSITORY = '0x4cd00e387622c35bddb9b4c962c136462338bc31';
  const RELAY_ROUTER = '0x0729e2a4716d9f7dd17858d5d504426d228697f7';
  const RELAY_SOLVER = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
  const CHAINS = {
    eth: {
      id: 1,
      name: 'Ethereum',
      coin: 'ETH',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: [ZEROX, KYBER, '0x1644d2477f809cc2c71bccfd6dc9497e3f83210d'],
      topupUsdMicro: 2000000,
      topupBelowWei: 300000000000000n,
      gasCapWei: 3000000000000000n,
      refund: [
        { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ],
      tokens: []
    },
    base: {
      id: 8453,
      name: 'Base',
      coin: 'ETH',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: ['0xc87de04e2ec1f4282dff2933a2d58199f688fc3d', ZEROX, KYBER, '0xaba5b53b03eafad1c5fc8bd5fc765fc85bb3de67', '0xbc1d9760bd6ca468ca9fb5ff2cfbeac35d86c973', '0x2f68417a18da681589f4ea64b9cc9839209acff7'],
      topupUsdMicro: 100000,
      topupBelowWei: 25000000000000n,
      gasCapWei: 200000000000000n,
      refund: [{ address: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2', symbol: 'USDT', name: 'Tether USD', decimals: 6 }],
      tokens: [
        { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
        { address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', decimals: 8 },
        { address: '0x532f27101965dd16442e59d40670faf5ebb142e4', symbol: 'BRETT', name: 'Brett', decimals: 18 },
        { address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', symbol: 'AERO', name: 'Aerodrome', decimals: 18 },
        { address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', symbol: 'DEGEN', name: 'Degen', decimals: 18 },
        { address: '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b', symbol: 'VIRTUAL', name: 'Virtual Protocol', decimals: 18 }
      ]
    },
    arbitrum: {
      id: 42161,
      name: 'Arbitrum',
      coin: 'ETH',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: ['0x57f96440f1b1cad53b40a8924bd540b1279a491c', ZEROX, KYBER, '0x924f147c50ea59f5180a26031a8b65b2aa1e81cd'],
      topupUsdMicro: 250000,
      topupBelowWei: 50000000000000n,
      gasCapWei: 200000000000000n,
      refund: [{ address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 }],
      tokens: [
        { address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
        { address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
        { address: '0x912ce59144191c1204e64559fe8253a0e49e6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
        { address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a', symbol: 'GMX', name: 'GMX', decimals: 18 },
        { address: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4', symbol: 'LINK', name: 'ChainLink Token', decimals: 18 }
      ]
    },
    bsc: {
      id: 56,
      name: 'BNB Chain',
      coin: 'BNB',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: ['0x1a3304cbef66de00fbe1548cc4c6585ad22fbcff', ZEROX, KYBER],
      topupUsdMicro: 250000,
      topupBelowWei: 100000000000000n,
      gasCapWei: 1000000000000000n,
      refund: [
        { address: '0x55d398326f99059ff775485246999027b3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
        { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 }
      ],
      tokens: [
        { address: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', symbol: 'XRP', name: 'XRP Token', decimals: 18 },
        { address: '0xba2ae424d960c26247dd6c32edc70b295c744c43', symbol: 'DOGE', name: 'Dogecoin', decimals: 8 }
      ]
    },
    polygon: {
      id: 137,
      name: 'Polygon',
      coin: 'POL',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: ['0xbd4e6011f03355c2a377fd9af939322a7d0a1bc1', ZEROX, KYBER],
      topupUsdMicro: 250000,
      topupBelowWei: 300000000000000000n,
      gasCapWei: 1000000000000000000n,
      refund: [
        { address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ],
      tokens: []
    },
    optimism: {
      id: 10,
      name: 'Optimism',
      coin: 'ETH',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: [ZEROX, KYBER],
      topupUsdMicro: 100000,
      topupBelowWei: 25000000000000n,
      gasCapWei: 200000000000000n,
      refund: [
        { address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 }
      ],
      tokens: [
        { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
        { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18 }
      ]
    },
    avalanche: {
      id: 43114,
      name: 'Avalanche',
      coin: 'AVAX',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: [ZEROX, KYBER],
      topupUsdMicro: 500000,
      topupBelowWei: 50000000000000000n,
      gasCapWei: 200000000000000000n,
      refund: [
        { address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34', symbol: 'USDe', name: 'USDe', decimals: 18 }
      ],
      tokens: []
    },
    ink: {
      id: 57073,
      name: 'Ink',
      coin: 'ETH',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: [ZEROX],
      topupUsdMicro: 100000,
      topupBelowWei: 25000000000000n,
      gasCapWei: 200000000000000n,
      refund: [
        { address: '0x0200c29006150606b650577bbe7b6248f58470c1', symbol: 'USDT0', name: 'USDT0', decimals: 6 },
        { address: '0x2d270e6886d130d724215a266106e6832161eaed', symbol: 'USDC', name: 'USDC', decimals: 6 }
      ],
      tokens: [
        { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
        { address: '0x73e0c0d45e048d25fc26fa3159b0aa04bfa4db98', symbol: 'kBTC', name: 'Kraken Wrapped Bitcoin', decimals: 8 }
      ]
    },
    monad: {
      id: 143,
      name: 'Monad',
      coin: 'MON',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: [ZEROX, KYBER],
      topupUsdMicro: 100000,
      topupBelowWei: 1000000000000000000n,
      gasCapWei: 4000000000000000000n,
      valueGapMs: 1000,
      refund: [
        { address: '0x754704bc059f8c67012fed69bc8a327a5aafb603', symbol: 'USDC', name: 'USDC', decimals: 6 },
        { address: '0xe7cd86e13ac4309349f30b3435a9d337750fc82d', symbol: 'USDT0', name: 'USDT0', decimals: 6 },
        { address: '0x00000000efe302beaa2b3e6e1b18d08d69a9012a', symbol: 'AUSD', name: 'AUSD', decimals: 6 },
        { address: '0xaca92e438df0b2401ff60da7e4337b687a2435da', symbol: 'mUSD', name: 'MetaMask USD', decimals: 6 }
      ],
      tokens: []
    },
    unichain: {
      id: 130,
      name: 'Unichain',
      coin: 'ETH',
      proxy: RELAY_PROXY,
      depository: RELAY_DEPOSITORY,
      router: RELAY_ROUTER,
      solver: RELAY_SOLVER,
      swaps: [ZEROX, KYBER],
      topupUsdMicro: 100000,
      topupBelowWei: 25000000000000n,
      gasCapWei: 200000000000000n,
      refund: [{ address: '0x078d782b760474a361dda0af3839290b0ef57ad6', symbol: 'USDC', name: 'USDC', decimals: 6 }],
      tokens: [
        { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
        { address: '0x8f187aa05619a017077f5308904739877ce9ea21', symbol: 'UNI', name: 'Uniswap', decimals: 18 }
      ]
    }
  };
  const chainOf = (key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(CHAINS, key) ? CHAINS[key] : null);
  const TOKEN_CONTRACTS = new Set([
    ...Object.values(CHAINS).flatMap((chain) => [...chain.tokens, ...chain.refund].map((token) => token.address)),
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    '0x3bd359c1119da7da1d913d1c4d2b7c461115433a'
  ]);
  const pinnedOf = (chain) => new Set([chain.proxy, chain.depository, chain.router, chain.solver, ...chain.swaps]);
  const tokenOf = (key, address) => {
    const chain = chainOf(key);
    if (!chain || typeof address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
    const lower = address.toLowerCase();
    const listed = chain.tokens.find((one) => one.address === lower) || chain.refund.find((one) => one.address === lower);
    if (listed) return listed;
    if (lower === '0x0000000000000000000000000000000000000000') return { address: lower, symbol: chain.coin, name: chain.coin, decimals: 18, native: true };
    if (pinnedOf(chain).has(lower)) return null;
    return { address: lower, decimals: null, listed: false };
  };

  const MAX_USD_GRACE = 1.01;
  const overMaxUsd = (intent, inUsd, outUsd) => Number.isFinite(intent.maxUsd) && intent.maxUsd > 0 && Math.max(inUsd, outUsd) > intent.maxUsd * MAX_USD_GRACE;
  const VALUE_FLOOR = 0.85;
  const MIN_OUT_FLOOR = 90n;
  const marketOf = (plan) => (plan && typeof plan.marketUsd === 'number' && Number.isFinite(plan.marketUsd) && plan.marketUsd > 0 ? plan.marketUsd : null);
  function tokenUsd(plan, amount, decimals, relayText) {
    const price = marketOf(plan);
    if (price !== null && typeof amount === 'bigint' && Number.isInteger(decimals) && decimals >= 0 && decimals <= 36) return Number(amount) / 10 ** decimals * price;
    const relay = usdOf(relayText);
    return relay > 0 ? relay : null;
  }
  const RELAY_FLOOR = 0.5;
  function relayLost(d, extraUsd) {
    const inUsd = usdOf(d.currencyIn && d.currencyIn.amountUsd), outUsd = usdOf(d.currencyOut && d.currencyOut.amountUsd);
    return inUsd > 0 && outUsd > 0 && outUsd + extraUsd < inUsd * RELAY_FLOOR ? { inUsd, outUsd } : null;
  }
  function floorSplit(answer, inUsd, outUsd, extraUsd) {
    const f = answer && answer.fees;
    if (!f || typeof f !== 'object') return null;
    const fee = (key) => (f[key] && typeof f[key].amountUsd === 'string' ? usdOf(f[key].amountUsd) || 0 : 0);
    const fees = Math.max(0, fee('relayer') + fee('app') - extraUsd);
    return { fees, route: inUsd - outUsd - extraUsd - fees };
  }
  const LEAST_MAX = 1000;
  function floorRefusal(answer, inUsd, outUsd, extraUsd) {
    const split = floorSplit(answer, inUsd, outUsd, extraUsd);
    if (split && split.route > split.fees) return { reason: 'value_floor', impact: true };
    const room = split && inUsd > 0 ? (1 - VALUE_FLOOR) - Math.max(0, split.route) / inUsd : 0;
    const least = room > 0 ? split.fees / (room * inUsd) : NaN;
    return Number.isFinite(least) && least > 1 && least <= LEAST_MAX ? { reason: 'value_floor', impact: false, least } : { reason: 'value_floor', impact: false };
  }
  const feesOf = (answer, inUsd, outUsd, extraUsd) => {
    const split = floorSplit(answer, inUsd, outUsd, extraUsd);
    return split ? split.fees : null;
  };
  const refused = (audited) => fail('relay_refused', audited.impact ? { reason: audited.reason, impact: true } : audited.least ? { reason: audited.reason, least: audited.least } : { reason: audited.reason });
  const marketGiven = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined);
  const MARKET_FLOOR = 0.9;
  function belowMarket(deal) {
    const { give, get, slippageBps, extraUsd } = deal || {};
    const worth = (side) => (side && typeof side.units === 'bigint' && side.units >= 0n && Number.isInteger(side.decimals) && side.decimals >= 0 && side.decimals <= 36 && typeof side.price === 'number' && Number.isFinite(side.price) && side.price > 0
      ? Number(side.units) / 10 ** side.decimals * side.price : null);
    const given = worth(give), got = worth(get);
    if (given === null || got === null || !(given > 0)) return null;
    const slip = Number(slippageBps);
    const kept = Number.isFinite(slip) && slip > 0 && slip < 10000 ? 1 - slip / 10000 : 1;
    const extra = typeof extraUsd === 'number' && Number.isFinite(extraUsd) && extraUsd > 0 ? extraUsd : 0;
    return got + extra < given * kept * MARKET_FLOOR;
  }
  const QUOTE_TTL_MS = 30000;
  const GAS_LIMIT_MIN = 21000n;
  const GAS_LIMIT_MAX = 4000000n;
  const gasLimitMax = (chain) => (typeof chain.gasLimitMax === 'bigint' && chain.gasLimitMax < GAS_LIMIT_MAX ? chain.gasLimitMax : GAS_LIMIT_MAX);
  const MULTICALL_CALLS_MAX = 8;
  const CALLDATA_MAX = 16384;
  const TOPUP_TOLERANCE = 0.25;
  const STATE_TTL_MS = 60000;
  const CONFIG_TTL_MS = 60000;
  const KNOWN_MAX = 40;
  const WITHDRAW_GAS_NATIVE_MAX = 100000n;
  const WITHDRAW_GAS_TOKEN = 120000n;
  const WITHDRAW_GAS_TOKEN_MAX = 400000n;
  const SEND_TRIES = 3;
  const SEND_PAUSE_MS = 1500;
  const MINED_POLL_MS = 1500;
  const MINED_WAIT_MS = 60000;

  const SEL_APPROVE = '0x095ea7b3';
  const SEL_DEPOSIT = '0xe8017952';
  const SEL_DEPOSIT_NATIVE = '0x49290c1c';
  const SEL_MULTICALL = '0xf9e4bab4';
  const SEL_ROUTER_MULTICALL = '0xcd6e13f7';
  const SEL_TRANSFER = '0xa9059cbb';
  const SEL_WITHDRAW = '0x2e1a7d4d';
  const EVM_ADDRESS = /^0x[0-9a-f]{40}$/;
  const HEX_DATA = /^0x[0-9a-f]*$/;
  const REQUEST_ID = /^0x[0-9a-f]{64}$/;
  const DIGITS = /^\d{1,60}$/;
  const BODY_BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
  const COMMENT = /^0x[0-9a-f]{64}$/;
  const COMMENT_BYTES = 66;
  const BUY_REQUEST = new Set(['user', 'recipient', 'refundTo', 'originChainId', 'destinationChainId', 'originCurrency', 'destinationCurrency', 'amount', 'tradeType', 'topupGas', 'topupGasAmount', 'slippageTolerance']);
  const SELL_REQUEST = new Set(['user', 'recipient', 'refundTo', 'originChainId', 'destinationChainId', 'originCurrency', 'destinationCurrency', 'amount', 'tradeType', 'slippageTolerance']);
  const SLIPPAGES = Object.freeze({ has: (asked) => typeof asked === 'string' && /^[1-9]\d{1,2}$/.test(asked) && Number(asked) % 10 === 0 && Number(asked) <= 900 });
  const slippageHolds = (asked, out, minOut) => asked === undefined || (SLIPPAGES.has(asked) && minOut + 1n >= out * BigInt(10000 - Number(asked) - Math.max(1, Math.ceil(Number(asked) / 20))) / 10000n);

  function fail(code, extra) {
    const err = new Error(code);
    err.code = code;
    return extra ? Object.assign(err, extra) : err;
  }
  const units = (text) => (typeof text === 'string' && DIGITS.test(text) ? BigInt(text) : null);
  const usdOf = (text) => {
    const value = typeof text === 'string' && /^\d{1,15}(\.\d{1,18})?$/.test(text) ? Number(text) : NaN;
    return Number.isFinite(value) ? value : null;
  };
  const sameKeys = (object, allowed) => !!object && typeof object === 'object' && Object.keys(object).every((key) => allowed.has(key));

  const LIB_NAME = 'EvmWallet';
  let libClaimed = false;
  try {
    Object.defineProperty(window, LIB_NAME, { value: undefined, writable: true, configurable: false, enumerable: false });
    libClaimed = true;
  } catch (_) { }
  function takeLib() {
    const held = libClaimed ? Object.getOwnPropertyDescriptor(window, LIB_NAME) : null;
    const lib = held && 'value' in held && held.value && typeof held.value === 'object' ? held.value : null;
    if (!lib) return null;
    Object.freeze(lib);
    if (held.writable) Object.defineProperty(window, LIB_NAME, { value: lib, writable: false });
    return lib;
  }

  let bundleJob = null;
  function bundle() {
    if (bundleJob) return bundleJob;
    bundleJob = new Promise((resolve, reject) => {
      if (!libClaimed) return reject(fail('bundle_failed'));
      const tag = document.createElement('script');
      tag.src = BUNDLE;
      tag.integrity = BUNDLE_SRI;
      tag.onload = () => { const lib = takeLib(); return lib ? resolve(lib) : reject(fail('bundle_failed')); };
      tag.onerror = () => reject(fail('bundle_failed'));
      document.head.appendChild(tag);
    }).catch((err) => {
      bundleJob = null;
      throw err;
    });
    return bundleJob;
  }

  async function keyOf(lib, words) {
    const seed = await lib.mnemonicToSeedWebcrypto(words.join(' '));
    let node = null, privateKey = null;
    try {
      node = lib.HDKey.fromMasterSeed(seed);
      for (const index of DERIVATION) {
        const child = node.deriveChild(index);
        node.wipePrivateData();
        node = child;
      }
      privateKey = Uint8Array.from(node.privateKey);
      return { privateKey, address: lib.addr.fromPrivateKey(privateKey).toLowerCase() };
    } catch (err) {
      if (privateKey) privateKey.fill(0);
      throw err;
    } finally {
      seed.fill(0);
      if (node) node.wipePrivateData();
    }
  }
  async function deriveAddress(lib, words) {
    const key = await keyOf(lib, words);
    key.privateKey.fill(0);
    return key.address;
  }

  function splitBuy(total) {
    const fee = (total * BigInt(T.FEE_BPS)) / 10000n;
    return { deposit: total - fee, fee };
  }

  function readApprove(data) {
    if (data.length !== 138 || !data.startsWith(SEL_APPROVE)) return null;
    const spender = data.slice(10, 74);
    if (!spender.startsWith('0'.repeat(24))) return null;
    return { spender: '0x' + spender.slice(24), units: BigInt('0x' + data.slice(74)) };
  }
  function readNativeDeposit(data) {
    if (data.length !== 138 || !data.startsWith(SEL_DEPOSIT_NATIVE)) return null;
    const depositor = data.slice(10, 74);
    return depositor.startsWith('0'.repeat(24)) ? { depositor: '0x' + depositor.slice(24) } : null;
  }
  function readDeposit(data) {
    if (data.length !== 266 || !data.startsWith(SEL_DEPOSIT)) return null;
    const words = data.slice(10).match(/.{64}/g);
    if (!words[0].startsWith('0'.repeat(24)) || !words[1].startsWith('0'.repeat(24))) return null;
    return { depositor: '0x' + words[0].slice(24), token: '0x' + words[1].slice(24), units: BigInt('0x' + words[2]) };
  }
  function readMulticall(data) {
    if (!data.startsWith(SEL_MULTICALL)) return null;
    const body = data.slice(10);
    if (body.length % 64) return null;
    const count = body.length / 64;
    const word = (i) => (i >= 0 && i < count ? body.slice(i * 64, (i + 1) * 64) : null);
    const number = (i) => {
      const w = word(i);
      if (w === null) return null;
      const value = BigInt('0x' + w);
      return value <= BigInt(count * 32) ? Number(value) : null;
    };
    const address = (i) => {
      const w = word(i);
      return w !== null && w.startsWith('0'.repeat(24)) ? '0x' + w.slice(24) : null;
    };
    if (number(0) !== 0xc0 || number(1) !== 0x100 || number(2) !== 0x140) return null;
    if (number(6) !== 1 || number(8) !== 1) return null;
    const token = address(7);
    const amount = word(9);
    const refundTo = address(3);
    const nftRecipient = address(4);
    const callCount = number(10);
    const metadataAt = number(5);
    if (!token || amount === null || !refundTo || !nftRecipient || !callCount || callCount > MULTICALL_CALLS_MAX) return null;
    if (metadataAt === null || metadataAt % 32 || metadataAt / 32 >= count) return null;
    const calls = [];
    for (let i = 0; i < callCount; i++) {
      const at = number(11 + i);
      if (at === null || at % 32) return null;
      const start = 11 + at / 32;
      const target = address(start);
      const dataAt = number(start + 3);
      if (!target || dataAt === null || dataAt % 32) return null;
      const lengthWord = start + dataAt / 32;
      const length = number(lengthWord);
      if (length === null) return null;
      const bytes = body.slice((lengthWord + 1) * 64, (lengthWord + 1) * 64 + length * 2);
      if (bytes.length !== length * 2) return null;
      const first = bytes.slice(8, 72);
      calls.push({ target, selector: length >= 4 ? '0x' + bytes.slice(0, 8) : '0x', arg: first.length === 64 && first.startsWith('0'.repeat(24)) ? '0x' + first.slice(24) : null, value: word(start + 2) });
    }
    return { token, units: BigInt('0x' + amount), calls, refundTo, nftRecipient };
  }

  function readRouterMulticall(data) {
    if (!data.startsWith(SEL_ROUTER_MULTICALL)) return null;
    const body = data.slice(10);
    if (body.length % 64) return null;
    const count = body.length / 64;
    const word = (i) => (i >= 0 && i < count ? body.slice(i * 64, (i + 1) * 64) : null);
    const number = (i) => {
      const w = word(i);
      if (w === null) return null;
      const value = BigInt('0x' + w);
      return value <= BigInt(count * 32) ? Number(value) : null;
    };
    const address = (i) => {
      const w = word(i);
      return w !== null && w.startsWith('0'.repeat(24)) ? '0x' + w.slice(24) : null;
    };
    if (number(0) !== 0x80) return null;
    const refundTo = address(1);
    const nftRecipient = address(2);
    const metadataAt = number(3);
    const callCount = number(4);
    if (!refundTo || !nftRecipient || !callCount || callCount > MULTICALL_CALLS_MAX) return null;
    if (metadataAt === null || metadataAt % 32 || metadataAt / 32 >= count) return null;
    const calls = [];
    for (let i = 0; i < callCount; i++) {
      const at = number(5 + i);
      if (at === null || at % 32) return null;
      const start = 5 + at / 32;
      const target = address(start);
      const flag = word(start + 1);
      const value = word(start + 2);
      const dataAt = number(start + 3);
      if (!target || flag === null || value === null || dataAt === null || dataAt % 32) return null;
      const lengthWord = start + dataAt / 32;
      const length = number(lengthWord);
      if (length === null) return null;
      const bytes = body.slice((lengthWord + 1) * 64, (lengthWord + 1) * 64 + length * 2);
      if (bytes.length !== length * 2) return null;
      const first = bytes.slice(8, 72);
      calls.push({ target, selector: length >= 4 ? '0x' + bytes.slice(0, 8) : '0x', arg: first.length === 64 && first.startsWith('0'.repeat(24)) ? '0x' + first.slice(24) : null, value: BigInt('0x' + value) });
    }
    return { calls, refundTo, nftRecipient };
  }

  function depositBody(lib, text) {
    if (typeof text !== 'string' || !BODY_BASE64.test(text)) return null;
    try {
      const given = lib.Cell.fromBase64(text.replace(/-/g, '+').replace(/_/g, '/'));
      if (given.isExotic || given.refs.length) return null;
      const slice = given.beginParse();
      if (slice.remainingBits !== 32 + COMMENT_BYTES * 8 || slice.loadUint(32) !== 0) return null;
      const comment = String.fromCharCode(...slice.loadBuffer(COMMENT_BYTES));
      if (!COMMENT.test(comment)) return null;
      const built = lib.beginCell().storeUint(0, 32).storeStringTail(comment).endCell();
      return built.equals(given) ? built : null;
    } catch (_) {
      return null;
    }
  }

  const decimalsHold = (token, chosen, given) => Number.isInteger(given) && given >= 0 && given <= 36
    && (token.decimals === null || given === token.decimals) && (chosen === undefined || chosen === null || given === chosen);
  const currencyIs = (side, chainId, address) => !!side && !!side.currency && side.currency.chainId === chainId && typeof side.currency.address === 'string' && side.currency.address.toLowerCase() === address.toLowerCase();

  function auditBuy(plan, intent, nowMs) {
    const no = (reason) => ({ reason });
    if (!plan || plan.kind !== 'buy') return no('plan');
    const chain = chainOf(plan.chain);
    if (!chain) return no('chain');
    const token = tokenOf(plan.chain, plan.token);
    if (!token) return no('token');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    const total = plan.total;
    if (typeof total !== 'bigint' || total <= 0n) return no('amount');
    const { deposit, fee } = splitBuy(total);
    if (fee <= 0n) return no('amount');
    const owner = intent && intent.owner;
    if (!owner) return no('owner');

    const r = plan.request;
    if (!sameKeys(r, BUY_REQUEST)) return no('request');
    if (T.rawAddress(r.user) !== owner) return no('owner');
    if (T.rawAddress(r.refundTo) !== owner) return no('refund');
    if (typeof r.recipient !== 'string' || !EVM_ADDRESS.test(r.recipient)) return no('recipient');
    if (r.originChainId !== TON_CHAIN_ID || r.destinationChainId !== chain.id) return no('chain_id');
    if (r.originCurrency !== GRAM_CURRENCY || r.destinationCurrency !== token.address) return no('token');
    if (r.amount !== deposit.toString() || r.tradeType !== 'EXACT_INPUT') return no('amount');
    const asksTopup = r.topupGas === true;
    if (asksTopup ? token.native || r.topupGasAmount !== String(chain.topupUsdMicro) : r.topupGas !== undefined || r.topupGasAmount !== undefined) return no('topup');

    const a = plan.answer;
    if (!a || typeof a !== 'object' || !Array.isArray(a.steps) || a.steps.length !== 1) return no('steps');
    const step = a.steps[0];
    if (!step || step.id !== 'deposit' || step.kind !== 'transaction' || !Array.isArray(step.items) || step.items.length !== 1) return no('steps');
    const messages = step.items[0] && step.items[0].data && step.items[0].data.messages;
    if (!Array.isArray(messages) || messages.length !== 1) return no('messages');
    const m = messages[0];
    if (!m || T.rawAddress(m.to) !== DEPOSITORY_RAW) return no('depository');
    if (T.rawAddress(m.from) !== owner) return no('owner');
    if (m.value !== deposit.toString()) return no('value');
    if (m.bounce !== false) return no('bounce');
    if (m.mode !== 1) return no('mode');
    if (typeof m.body !== 'string' || !BODY_BASE64.test(m.body)) return no('body');
    if (typeof a.requestId !== 'string' || !REQUEST_ID.test(a.requestId)) return no('request_id');

    const d = a.details;
    if (!d || typeof d !== 'object') return no('details');
    if (typeof d.recipient !== 'string' || d.recipient.toLowerCase() !== r.recipient) return no('recipient');
    if (T.rawAddress(d.sender) !== owner) return no('owner');
    if (!currencyIs(d.currencyIn, TON_CHAIN_ID, GRAM_CURRENCY) || d.currencyIn.amount !== deposit.toString()) return no('value');
    if (!currencyIs(d.currencyOut, chain.id, token.address) || !decimalsHold(token, plan.decimals, d.currencyOut.currency.decimals)) return no('token');
    if (!currencyIs(d.refundCurrency, TON_CHAIN_ID, GRAM_CURRENCY)) return no('refund');
    const out = units(d.currencyOut.amount);
    const minOut = units(d.currencyOut.minimumAmount);
    if (!out || !minOut || minOut > out || minOut * 100n < out * MIN_OUT_FLOOR) return no('min_out');
    if (!slippageHolds(r.slippageTolerance, out, minOut)) return no('slippage');

    const inUsd = usdOf(d.currencyIn.amountUsd);
    const outUsd = tokenUsd(plan, out, d.currencyOut.currency.decimals, d.currencyOut.amountUsd);
    if (inUsd === null || outUsd === null || !(inUsd > 0)) return no('no_price');
    if (overMaxUsd(intent, inUsd, outUsd)) return no('cap');

    const g = d.currencyGasTopup;
    let topupWei = 0n, topupUsd = 0;
    if (asksTopup) {
      topupWei = g ? units(g.amount) : null;
      topupUsd = g ? usdOf(g.amountUsd) : null;
      const wanted = chain.topupUsdMicro / 1e6;
      if (!currencyIs(g, chain.id, NATIVE_ADDRESS) || !topupWei || topupUsd === null || Math.abs(topupUsd - wanted) > wanted * TOPUP_TOLERANCE) return no('topup');
    } else if (g && g.amount !== '0') {
      return no('topup');
    }
    if ((outUsd + topupUsd) < inUsd * VALUE_FLOOR) return floorRefusal(a, inUsd, outUsd, topupUsd);
    const lost = relayLost(d, topupUsd);
    if (lost) return floorRefusal(a, lost.inUsd, lost.outUsd, topupUsd);

    const seconds = Number.isFinite(d.timeEstimate) ? d.timeEstimate : null;
    return { reason: null, total, deposit, fee, recipient: r.recipient, body: m.body, out, minOut, decimals: d.currencyOut.currency.decimals, inUsd, outUsd, topupWei, topupUsd, feesUsd: feesOf(a, inUsd, outUsd, topupUsd), seconds, requestId: a.requestId };
  }

  function readTx(item, chain, owner, value = 0n) {
    const d = item && item.data;
    if (!d || typeof d !== 'object') return { reason: 'tx' };
    if (d.chainId !== chain.id) return { reason: 'chain_id' };
    if (typeof d.from !== 'string' || d.from.toLowerCase() !== owner) return { reason: 'owner' };
    if (typeof d.to !== 'string' || !EVM_ADDRESS.test(d.to.toLowerCase())) return { reason: 'tx' };
    if (typeof d.data !== 'string' || !HEX_DATA.test(d.data.toLowerCase()) || d.data.length % 2 || d.data.length > CALLDATA_MAX * 2) return { reason: 'tx' };
    if (d.value !== value.toString()) return { reason: 'value' };
    const gas = units(d.gas), maxFee = units(d.maxFeePerGas), priority = units(d.maxPriorityFeePerGas);
    if (gas === null || maxFee === null || priority === null || gas < GAS_LIMIT_MIN || gas > gasLimitMax(chain) || maxFee <= 0n || priority > maxFee) return { reason: 'gas' };
    return { to: d.to.toLowerCase(), data: d.data.toLowerCase(), value, gas, maxFee, priority };
  }

  function auditSell(plan, intent, nowMs) {
    const no = (reason) => ({ reason });
    if (!plan || plan.kind !== 'sell') return no('plan');
    const chain = chainOf(plan.chain);
    if (!chain) return no('chain');
    const token = tokenOf(plan.chain, plan.token);
    if (!token) return no('token');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    const sale = plan.units;
    if (typeof sale !== 'bigint' || sale <= 0n) return no('amount');

    const r = plan.request;
    if (!sameKeys(r, SELL_REQUEST)) return no('request');
    if (typeof r.user !== 'string' || !EVM_ADDRESS.test(r.user)) return no('owner');
    const owner = r.user;
    if (r.refundTo !== owner) return no('refund');
    if (!intent || !intent.owner || T.rawAddress(r.recipient) !== intent.owner) return no('recipient');
    if (r.originChainId !== chain.id || r.destinationChainId !== TON_CHAIN_ID) return no('chain_id');
    if (r.originCurrency !== token.address || r.destinationCurrency !== GRAM_CURRENCY) return no('token');
    if (r.amount !== sale.toString() || r.tradeType !== 'EXACT_INPUT') return no('amount');

    const a = plan.answer;
    if (!a || typeof a !== 'object' || !Array.isArray(a.steps) || !a.steps.length || a.steps.length > 2) return no('steps');
    const ids = a.steps.map((step) => step && step.id).join();
    if (ids !== 'approve,deposit' && ids !== 'deposit') return no('steps');
    if (a.steps.some((step) => step.kind !== 'transaction' || !Array.isArray(step.items) || step.items.length !== 1)) return no('steps');
    if (typeof a.requestId !== 'string' || !REQUEST_ID.test(a.requestId)) return no('request_id');

    if (token.native && ids !== 'deposit') return no('steps');
    const depositTx = readTx(a.steps[a.steps.length - 1].items[0], chain, owner, token.native ? sale : 0n);
    if (depositTx.reason) return depositTx;
    if (token.native && depositTx.to === chain.router) {
      const call = readRouterMulticall(depositTx.data);
      if (!call) return no('deposit_call');
      const nobodyOrSolver = (address) => address === NATIVE_ADDRESS || address === chain.solver;
      if (!nobodyOrSolver(call.refundTo) || !nobodyOrSolver(call.nftRecipient)) return no('deposit_refund');
      const last = call.calls[call.calls.length - 1];
      if (last.target !== chain.router && !(last.target === chain.depository && last.arg === owner)) return no('deposit_call');
      const dollars = new Set(chain.refund.map((one) => one.address));
      let spent = 0n;
      for (const inner of call.calls) {
        if (inner.target === chain.router) {
          if (inner.value !== 0n) return no('deposit_call');
          continue;
        }
        if (inner.target === chain.depository) {
          if (inner.arg !== owner) return no('deposit_call');
        } else if (dollars.has(inner.target)) {
          if (inner.value !== 0n || inner.selector !== SEL_APPROVE || inner.arg !== chain.depository) return no('deposit_call');
          continue;
        } else if (!chain.swaps.includes(inner.target)) {
          return no('deposit_call');
        }
        spent += inner.value;
      }
      if (spent > sale) return no('deposit_amount');
    } else if (token.native) {
      if (depositTx.to !== chain.depository) return no('deposit_to');
      const call = readNativeDeposit(depositTx.data);
      if (!call) return no('deposit_call');
      if (call.depositor !== owner) return no('owner');
    } else if (depositTx.to === chain.depository) {
      const call = readDeposit(depositTx.data);
      if (!call) return no('deposit_call');
      if (call.depositor !== owner) return no('owner');
      if (call.token !== token.address) return no('deposit_token');
      if (call.units !== sale) return no('deposit_amount');
    } else if (depositTx.to === chain.proxy) {
      const call = readMulticall(depositTx.data);
      if (!call) return no('deposit_call');
      if (call.token !== token.address) return no('deposit_token');
      if (call.units !== sale) return no('deposit_amount');
      const last = call.calls[call.calls.length - 1];
      if (last.target !== chain.router && !(last.target === chain.depository && last.arg === owner)) return no('deposit_call');
      if (call.refundTo !== chain.solver || call.nftRecipient !== chain.solver) return no('deposit_refund');
      const spenders = new Set([...chain.swaps, chain.router]);
      const dollars = new Set(chain.refund.map((one) => one.address));
      for (const inner of call.calls) {
        if (inner.target === chain.depository) {
          if (inner.arg !== owner) return no('deposit_call');
          continue;
        }
        if (dollars.has(inner.target) && inner.target !== token.address) {
          if (inner.selector !== SEL_APPROVE || inner.arg !== chain.depository) return no('deposit_call');
          continue;
        }
        if (inner.target !== token.address && !spenders.has(inner.target)) return no('deposit_call');
        if (inner.target !== token.address) continue;
        if (inner.selector === SEL_WITHDRAW) continue;
        if (inner.selector !== SEL_APPROVE || !spenders.has(inner.arg)) return no('deposit_call');
      }
    } else {
      return no('deposit_to');
    }

    const txs = [];
    if (a.steps.length === 2) {
      const tx = readTx(a.steps[0].items[0], chain, owner);
      if (tx.reason) return tx;
      if (tx.to !== token.address) return no('approve_token');
      const call = readApprove(tx.data);
      if (!call) return no('approve_call');
      if (call.spender !== depositTx.to) return no('spender');
      if (call.units !== sale) return no('approve_amount');
      txs.push({ kind: 'approve', ...tx });
    }
    txs.push({ kind: 'deposit', ...depositTx });
    const gasWei = txs.reduce((sum, tx) => sum + tx.gas * tx.maxFee, 0n);
    if (gasWei > chain.gasCapWei) return no('gas_cap');

    const d = a.details;
    if (!d || typeof d !== 'object') return no('details');
    if (typeof d.sender !== 'string' || d.sender.toLowerCase() !== owner) return no('owner');
    if (T.rawAddress(d.recipient) !== intent.owner) return no('recipient');
    if (!currencyIs(d.currencyIn, chain.id, token.address) || d.currencyIn.amount !== sale.toString()) return no('amount');
    if (!decimalsHold(token, plan.decimals, d.currencyIn.currency.decimals)) return no('token');
    if (!currencyIs(d.currencyOut, TON_CHAIN_ID, GRAM_CURRENCY)) return no('token');
    if (![token.address, NATIVE_ADDRESS, ...chain.refund.map((one) => one.address)].some((address) => currencyIs(d.refundCurrency, chain.id, address))) return no('refund_currency');
    const out = units(d.currencyOut.amount);
    const minOut = units(d.currencyOut.minimumAmount);
    if (!out || !minOut || minOut > out || minOut * 100n < out * MIN_OUT_FLOOR) return no('min_out');
    if (!slippageHolds(r.slippageTolerance, out, minOut)) return no('slippage');
    const inUsd = tokenUsd(plan, sale, d.currencyIn.currency.decimals, d.currencyIn.amountUsd);
    const outUsd = usdOf(d.currencyOut.amountUsd);
    if (inUsd === null || outUsd === null || !(inUsd > 0)) return no('no_price');
    if (overMaxUsd(intent, inUsd, outUsd)) return no('cap');
    if (outUsd < inUsd * VALUE_FLOOR) return floorRefusal(a, inUsd, outUsd, 0);
    const lost = relayLost(d, 0);
    if (lost) return floorRefusal(a, lost.inUsd, lost.outUsd, 0);

    const seconds = Number.isFinite(d.timeEstimate) ? d.timeEstimate : null;
    return { reason: null, units: sale, owner, txs, out, minOut, decimals: d.currencyIn.currency.decimals, native: !!token.native, inUsd, outUsd, feesUsd: feesOf(a, inUsd, outUsd, 0), gasWei, approves: txs.length === 2, seconds, requestId: a.requestId };
  }

  let relayNextAt = 0;
  async function relaySlot() {
    const at = Math.max(Date.now(), relayNextAt);
    relayNextAt = at + RELAY_GAP_MS;
    if (at > Date.now()) await new Promise((resolve) => setTimeout(resolve, at - Date.now()));
  }
  async function relayQuote(request) {
    for (let i = 0; ; i++) {
      await relaySlot();
      try {
        return await relayQuoteOnce(request);
      } catch (err) {
        if (!err.busy || i + 1 >= RELAY_BUSY_TRIES) throw err;
      }
    }
  }
  async function relayQuoteOnce(request) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), RELAY_MS);
    let res;
    try {
      res = await fetch(RELAY + '/quote/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: abort.signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
    } catch (_) {
      throw fail('relay_down');
    } finally {
      clearTimeout(timer);
    }
    let body = null;
    try { body = await res.json(); } catch (_) { }
    return relayJudge(res.status, body);
  }
  function relayJudge(status, body) {
    const ok = status >= 200 && status < 300;
    const busy = status === 429 || (!ok && !!body && typeof body.message === 'string' && /could not process request/i.test(body.message));
    if (busy || status >= 500 || (ok && !body)) throw fail('relay_down', busy ? { busy: true } : undefined);
    if (!ok) throw fail('no_route', { relay: body && typeof body.errorCode === 'string' ? body.errorCode.slice(0, 64) : null });
    return body;
  }

  async function ownTon() {
    const wallet = T.wallet;
    if (!wallet || !wallet.address) throw fail('no_wallet');
    if (wallet.readOnly) throw fail('read_only');
    return wallet.address;
  }
  async function need() {
    const settings = await T.config();
    if (settings.state !== 'open') throw fail('not_allowed');
    return settings;
  }

  let configCache = null;
  async function config() {
    if (configCache && Date.now() - configCache.at < CONFIG_TTL_MS) return configCache.value;
    await T.config();
    let body;
    try {
      body = await T.api('xchain/config');
    } catch (_) {
      return { buying: false, selling: false, reason: 'unknown', off: {} };
    }
    const given = body.off && typeof body.off === 'object' ? body.off : {};
    const off = {};
    Object.keys(CHAINS).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(given, key) && given[key]) off[key] = typeof given[key] === 'string' ? given[key] : 'off';
    });
    const value = { buying: body.buying === true, selling: body.selling === true, reason: typeof body.reason === 'string' ? body.reason : null, off };
    configCache = { at: Date.now(), value };
    return value;
  }

  let unwritten = null;
  const ownRaw = () => (T.wallet && T.wallet.address) || null;
  const address = async () => {
    const stored = await CK.wallet.evmAddress();
    return stored || (unwritten && unwritten.ton === ownRaw() ? unwritten.evm : null);
  };
  const ensureAddress = async (options) => {
    const ton = ownRaw();
    const evm = await CK.wallet.evmAddress({ ...(options || {}), unlock: true });
    unwritten = (await CK.wallet.evmAddress()) ? null : { ton, evm };
    return evm;
  };

  const stateCache = new Map();
  const minedSeen = new Map();
  function noteMined(key, evm, mined) {
    const id = `${key}:${evm}`;
    const seen = minedSeen.get(id);
    if (!seen || seen.mined !== mined) minedSeen.set(id, { mined, at: Date.now() });
  }
  async function valueGap(key, evm, state) {
    const gap = CHAINS[key].valueGapMs;
    if (!gap) return state;
    const end = Date.now() + MINED_WAIT_MS;
    for (;;) {
      if (state.nonce === state.mined) {
        const seen = minedSeen.get(`${key}:${evm}`);
        const left = seen && seen.mined === state.mined ? seen.at + gap - Date.now() : gap;
        if (left > 0) await new Promise((resolve) => setTimeout(resolve, left));
        return state;
      }
      if (Date.now() > end) throw fail('pending');
      await new Promise((resolve) => setTimeout(resolve, MINED_POLL_MS));
      state = await chainState(key, evm);
    }
  }
  async function chainState(key, evm, extra) {
    await T.config();
    let body;
    try {
      body = await T.api(`xchain/state?chain=${encodeURIComponent(key)}&evm=${encodeURIComponent(evm)}${extra || ''}`);
    } catch (_) {
      throw fail('state_unknown');
    }
    const nonce = body.nonce, mined = body.mined;
    const native = units(body.native);
    if (!Number.isSafeInteger(nonce) || nonce < 0 || !Number.isSafeInteger(mined) || mined < 0 || native === null) throw fail('state_unknown');
    const p = body.pending;
    const pending = p && Number.isSafeInteger(p.nonce) && typeof p.hash === 'string' && REQUEST_ID.test(p.hash.toLowerCase()) ? { nonce: p.nonce, hash: p.hash.toLowerCase() } : null;
    const state = { nonce, mined, native, pending };
    stateCache.set(`${key}:${evm}`, { at: Date.now(), state });
    noteMined(key, evm, mined);
    if (!extra) return state;
    const r = body.receipt;
    const receipt = r === undefined ? undefined : r && (r.status === 1 || r.status === 0) ? { status: r.status } : null;
    return { ...state, receipt, allowance: body.allowance === undefined ? undefined : units(body.allowance) };
  }
  const TOUCH_READ_MS = 2500;
  const touchReads = new Map();
  function warmSell(plan) {
    const owner = plan && plan.kind === 'sell' && plan.request ? plan.request.user : null;
    if (!chainOf(plan && plan.chain) || typeof owner !== 'string' || !EVM_ADDRESS.test(owner)) return;
    const id = `${plan.chain}:${owner}`;
    const held = touchReads.get(id);
    if (held && Date.now() - held.at < TOUCH_READ_MS) return;
    const job = chainState(plan.chain, owner);
    job.catch(() => {});
    touchReads.set(id, { at: Date.now(), job });
  }
  function swipeState(key, evm) {
    const id = `${key}:${evm}`;
    const held = touchReads.get(id);
    touchReads.delete(id);
    return held && Date.now() - held.at < TOUCH_READ_MS ? held.job.catch(() => chainState(key, evm)) : chainState(key, evm);
  }

  const plainName = (text, max) => {
    if (typeof text !== 'string') return null;
    const clean = text.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, '').trim().slice(0, max);
    return clean || null;
  };
  async function balances(known) {
    const evm = await address();
    if (!evm) throw fail('no_evm_address');
    await T.config();
    const extra = [];
    Object.keys(known || {}).forEach((key) => {
      if (!chainOf(key) || !Array.isArray(known[key])) return;
      known[key].forEach((one) => {
        if (typeof one === 'string' && EVM_ADDRESS.test(one.toLowerCase()) && extra.length < KNOWN_MAX) extra.push(key + ':' + one.toLowerCase());
      });
    });
    let body;
    try {
      body = await T.api('xchain/balances?evm=' + encodeURIComponent(evm) + (extra.length ? '&known=' + encodeURIComponent(extra.join(',')) : ''));
    } catch (_) {
      throw fail('balance_unknown');
    }
    const chains = Object.keys(CHAINS).map((key) => {
      const row = (Array.isArray(body.chains) ? body.chains : []).find((one) => one && one.chain === key);
      const native = row ? units(row.native) : null;
      if (!row || native === null || !Array.isArray(row.tokens)) return { chain: key, error: 'upstream' };
      const listedOnes = new Set([...CHAINS[key].tokens, ...CHAINS[key].refund].map((token) => token.address));
      const found = (token) => row.tokens.find((one) => one && typeof one.address === 'string' && one.address.toLowerCase() === token.address);
      const held = (token) => {
        const one = found(token);
        return { ...token, chain: key, units: (one && units(one.units)) || 0n };
      };
      const others = [];
      row.tokens.forEach((one) => {
        const at = one && typeof one.address === 'string' ? one.address.toLowerCase() : '';
        const amount = one ? units(one.units) : null;
        if (!EVM_ADDRESS.test(at) || listedOnes.has(at) || !amount || others.some((o) => o.address === at)) return;
        const decimals = Number.isInteger(one.decimals) && one.decimals >= 0 && one.decimals <= 36 ? one.decimals : null;
        others.push({ chain: key, address: at, units: amount, symbol: plainName(one.symbol, 16), name: plainName(one.name, 40), decimals, flagged: one.flagged !== false });
      });
      return { chain: key, native, tokens: CHAINS[key].tokens.map(held), refund: CHAINS[key].refund.map(held), held: others, discovery: row.discovery === 'ok' ? 'ok' : 'partial' };
    });
    return { address: evm, chains };
  }

  const needsTopup = (key, nativeWei) => {
    const chain = chainOf(key);
    return !!chain && nativeWei < chain.topupBelowWei;
  };
  const topupOf = (key) => {
    const chain = chainOf(key);
    return chain ? { usdMicro: chain.topupUsdMicro, usd: chain.topupUsdMicro / 1e6 } : null;
  };

  function askSlippage(request, bps) {
    if (bps === undefined) return;
    if (!SLIPPAGES.has(String(bps))) throw fail('bad_intent');
    request.slippageTolerance = String(bps);
  }

  async function quoteBuy(input) {
    const settings = await need();
    const opts = input || {};
    const chain = chainOf(opts.chain);
    const token = tokenOf(opts.chain, opts.token);
    if (!chain || !token || typeof opts.total !== 'bigint' || !decimalsChosen(opts.decimals)) throw fail('bad_intent');
    if (opts.risk === 'suspicious') throw fail('flagged');
    const [live, recipient] = await Promise.all([config(), address()]);
    if (!live.buying) throw fail(live.reason === 'unknown' ? 'relay_down' : 'buying_off', { reason: live.reason });
    if (live.off[opts.chain] && !token.native) throw fail('buying_off', { reason: live.off[opts.chain] });
    const owner = await ownTon();
    if (!recipient) throw fail('no_evm_address');
    let topup = token.native ? false : opts.topup;
    if (topup === undefined) {
      const cached = stateCache.get(`${opts.chain}:${recipient}`);
      const state = cached && Date.now() - cached.at < STATE_TTL_MS ? cached.state : await chainState(opts.chain, recipient);
      topup = needsTopup(opts.chain, state.native);
    }
    const { deposit } = splitBuy(opts.total);
    const friendly = T.friendlyAddress(owner);
    const request = {
      user: friendly,
      recipient,
      refundTo: friendly,
      originChainId: TON_CHAIN_ID,
      destinationChainId: chain.id,
      originCurrency: GRAM_CURRENCY,
      destinationCurrency: token.address,
      amount: deposit.toString(),
      tradeType: 'EXACT_INPUT'
    };
    if (topup) Object.assign(request, { topupGas: true, topupGasAmount: String(chain.topupUsdMicro) });
    askSlippage(request, opts.slippageBps);
    const answer = await relayQuote(request);
    const plan = { kind: 'buy', chain: opts.chain, token: token.address, decimals: opts.decimals, total: opts.total, request, answer, at: Date.now() };
    if (marketGiven(opts.marketUsd)) plan.marketUsd = opts.marketUsd;
    const audited = auditBuy(plan, { owner, maxUsd: settings.maxUsd }, plan.at);
    if (audited.reason) throw refused(audited);
    plan.view = viewOf(audited);
    plan.maxUsd = settings.maxUsd;
    return plan;
  }
  function viewOf(audited) {
    const { reason, body, txs, owner, recipient, ...view } = audited;
    return view;
  }
  const decimalsChosen = (value) => value === undefined || (Number.isInteger(value) && value >= 0 && value <= 36);
  const quoteGas = (input) => quoteBuy({ chain: input && input.chain, token: NATIVE_ADDRESS, total: input && input.total, topup: false });

  async function buy(plan, options) {
    const signed = await CK.wallet.signRelayDeposit(plan, options);
    const sent = await CK.wallet.broadcast(signed.boc);
    return { hash: sent.hash || signed.hash, requestId: plan.view.requestId, seqno: signed.seqno };
  }

  const ZERO_FIRST = new Set(['eth:0xdac17f958d2ee523a2206206994597c13d831ec7']);
  const zeroFirstRead = (plan, audited) => (audited.txs.length === 2 && ZERO_FIRST.has(plan.chain + ':' + plan.token)
    ? chainState(plan.chain, audited.owner, `&token=${plan.token}&spender=${audited.txs[audited.txs.length - 1].to}`) : null);
  function resetOf(plan, audited, given) {
    const approveTx = audited.txs.length === 2 ? audited.txs[0] : null;
    if (!given || given.allowance === undefined || given.allowance === 0n || !approveTx) return null;
    const spender = audited.txs[audited.txs.length - 1].to;
    return { kind: 'reset', to: plan.token, value: 0n, data: SEL_APPROVE + spender.slice(2).padStart(64, '0') + '0'.repeat(64), gas: approveTx.gas, maxFee: approveTx.maxFee, priority: approveTx.priority };
  }
  const resetWei = (reset) => (reset ? reset.gas * reset.maxFee : 0n);

  async function quoteSell(input) {
    const settings = await need();
    const opts = input || {};
    const chain = chainOf(opts.chain);
    const token = tokenOf(opts.chain, opts.token);
    if (!chain || !token || typeof opts.units !== 'bigint' || opts.units <= 0n || !decimalsChosen(opts.decimals)) throw fail('bad_intent');
    const [live, evm] = await Promise.all([config(), address()]);
    if (!live.selling) throw fail(live.reason === 'unknown' ? 'relay_down' : 'selling_off', { reason: live.reason });
    if (live.off[opts.chain]) throw fail('selling_off', { reason: live.off[opts.chain] });
    const owner = await ownTon();
    if (!evm) throw fail('no_evm_address');
    const request = {
      user: evm,
      recipient: T.friendlyAddress(owner),
      refundTo: evm,
      originChainId: chain.id,
      destinationChainId: TON_CHAIN_ID,
      originCurrency: token.address,
      destinationCurrency: GRAM_CURRENCY,
      amount: opts.units.toString(),
      tradeType: 'EXACT_INPUT'
    };
    askSlippage(request, opts.slippageBps);
    const answer = await relayQuote(request);
    const plan = { kind: 'sell', chain: opts.chain, token: token.address, decimals: opts.decimals, units: opts.units, request, answer, at: Date.now(), maxUsd: settings.maxUsd };
    if (marketGiven(opts.marketUsd)) plan.marketUsd = opts.marketUsd;
    const audited = auditSell(plan, { owner, maxUsd: settings.maxUsd }, plan.at);
    if (audited.reason) throw refused(audited);
    const read = zeroFirstRead(plan, audited);
    const gasWei = audited.gasWei + resetWei(resetOf(plan, audited, read && await read.catch(() => null)));
    if (gasWei > chain.gasCapWei) throw fail('relay_refused', { reason: 'gas_cap' });
    plan.view = { ...viewOf(audited), gasWei };
    return plan;
  }

  function signTx(lib, privateKey, owner, tx, chain, nonce) {
    const signed = lib.Transaction.prepare({
      type: 'eip1559',
      to: lib.addr.addChecksum(tx.to),
      value: tx.value,
      nonce: BigInt(nonce),
      maxFeePerGas: tx.maxFee,
      maxPriorityFeePerGas: tx.priority,
      gasLimit: tx.gas,
      chainId: BigInt(chain.id),
      data: tx.data
    }).signBy(privateKey);
    if (signed.sender.toLowerCase() !== owner) throw fail('relay_refused', { reason: 'owner' });
    return { kind: tx.kind, raw: signed.toHex(), hash: signed.hash, nonce };
  }

  async function signSell(plan, options) {
    await need();
    const owner = await ownTon();
    const audited = auditSell(plan, { owner, maxUsd: plan && plan.maxUsd }, Date.now());
    if (audited.reason) throw refused(audited);
    const chain = CHAINS[plan.chain];
    const [lib, read, given] = await Promise.all([bundle(), swipeState(plan.chain, audited.owner), zeroFirstRead(plan, audited)]);
    const state = audited.native ? await valueGap(plan.chain, audited.owner, read) : read;
    const reset = resetOf(plan, audited, given);
    if (audited.gasWei + resetWei(reset) > chain.gasCapWei) throw fail('relay_refused', { reason: 'gas_cap' });
    const needs = audited.gasWei + resetWei(reset) + (audited.native ? audited.units : 0n);
    if (state.native < needs) throw fail('no_gas', { needs, have: state.native });
    const txs = await withKey(async (key, tonRaw) => {
      if (tonRaw !== owner) throw fail('relay_refused', { reason: 'recipient' });
      const still = auditSell(plan, { owner, maxUsd: plan && plan.maxUsd }, Date.now());
      if (still.reason) throw refused(still);
      if (key.address !== audited.owner) {
        await CK.wallet.evmRecordRepair(key.address);
        throw fail('relay_refused', { reason: 'owner' });
      }
      return (reset ? [reset, ...audited.txs] : audited.txs).map((tx, i) => signTx(lib, key.privateKey, key.address, tx, chain, state.nonce + i));
    }, options);
    const sale = reset ? txs.slice(1) : txs;
    return { chain: plan.chain, owner: audited.owner, requestId: audited.requestId, reset: reset ? txs[0] : null, approve: sale.length === 2 ? sale[0] : null, deposit: sale[sale.length - 1] };
  }

  async function sendRaw(key, raw, from, requestId) {
    let lastError = null, lost = false;
    for (let i = 0; i < SEND_TRIES; i++) {
      if (i) await new Promise((resolve) => setTimeout(resolve, SEND_PAUSE_MS * i));
      try {
        await T.api('xchain/send', { body: from ? { chain: key, raw, from } : requestId ? { chain: key, raw, requestId } : { chain: key, raw } });
        return;
      } catch (err) {
        const refused = err && err.detail && err.detail.error;
        if (refused === 'send_stale' && i) return;
        if (refused && refused !== 'upstream' && refused !== 'send_unsure' && refused !== 'rate_limited') {
          if (lost) break;
          throw fail(refused);
        }
        lost = true;
        lastError = err;
      }
    }
    console.error(lastError);
    throw fail('send_unsure');
  }

  async function waitMined(key, owner, nonce, hash) {
    const end = Date.now() + MINED_WAIT_MS;
    for (;;) {
      const state = await chainState(key, owner, hash ? '&tx=' + encodeURIComponent(hash) : '').catch(() => null);
      if (state && state.mined > nonce) {
        if (!hash || state.receipt === undefined || (state.receipt && state.receipt.status === 1)) return;
        if (state.receipt && state.receipt.status === 0) throw fail('approve_failed', { hash });
      }
      if (Date.now() > end) throw fail('approve_unsure');
      await new Promise((resolve) => setTimeout(resolve, MINED_POLL_MS));
    }
  }

  async function sendSell(signed, onStep) {
    if (signed.approve) {
      if (signed.reset) await sendRaw(signed.chain, signed.reset.raw);
      await sendRaw(signed.chain, signed.approve.raw);
      await waitMined(signed.chain, signed.owner, signed.approve.nonce, signed.approve.hash);
      if (onStep) onStep('approved');
    }
    await sendRaw(signed.chain, signed.deposit.raw, undefined, signed.requestId);
    return { hash: signed.deposit.hash, requestId: signed.requestId };
  }
  const sell = async (plan, options, onStep) => sendSell(await signSell(plan, options), onStep);

  const OTHER_NETWORK = [/^(EQ|UQ|kQ|0Q|Ef|Uf)[A-Za-z0-9_-]{46}$/, /^-?[01]:[0-9a-fA-F]{64}$/, /^T[1-9A-HJ-NP-Za-km-z]{33}$/, /^(bc1|tb1)[0-9a-z]{20,80}$/i, /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, /^D[1-9A-HJ-NP-Za-km-z]{33}$/];
  async function checkAddress(key, text, tokenAddress) {
    const chain = chainOf(key);
    if (!chain) throw fail('bad_intent');
    const typed = typeof text === 'string' ? text.trim() : '';
    if (!/^0x[0-9a-fA-F]{40}$/.test(typed)) return { reason: OTHER_NETWORK.some((re) => re.test(typed)) ? 'network' : 'format' };
    const lower = typed.toLowerCase();
    if (typed !== lower && typed !== '0x' + typed.slice(2).toUpperCase()) {
      const lib = await bundle();
      if (lib.addr.addChecksum(lower) !== typed) return { reason: 'checksum' };
    }
    if (/^0x0{40}$/.test(lower) || /^0x0{36}[0-9a-f]{4}$/.test(lower)) return { reason: 'zero' };
    if (pinnedOf(chain).has(lower) || TOKEN_CONTRACTS.has(lower) || lower === (typeof tokenAddress === 'string' ? tokenAddress.toLowerCase() : '')) return { reason: 'contract' };
    const own = await address();
    if (own && lower === own) return { reason: 'self' };
    return { address: lower };
  }

  const transferData = (to, amount) => SEL_TRANSFER + to.slice(2).padStart(64, '0') + amount.toString(16).padStart(64, '0');
  function auditWithdraw(plan, nowMs) {
    const no = (reason) => ({ reason });
    if (!plan || plan.kind !== 'withdraw') return no('plan');
    const chain = chainOf(plan.chain);
    if (!chain) return no('chain');
    const token = tokenOf(plan.chain, plan.token);
    if (!token || (plan.token !== NATIVE_ADDRESS && token.native)) return no('token');
    if (!Number.isFinite(plan.at) || nowMs - plan.at > QUOTE_TTL_MS * 4 || nowMs < plan.at - QUOTE_TTL_MS) return no('stale');
    if (typeof plan.units !== 'bigint' || plan.units <= 0n || plan.units >= 1n << 255n) return no('amount');
    if (typeof plan.to !== 'string' || !EVM_ADDRESS.test(plan.to) || plan.to === token.address || pinnedOf(chain).has(plan.to) || TOKEN_CONTRACTS.has(plan.to) || plan.to === plan.from) return no('to');
    if (typeof plan.from !== 'string' || !EVM_ADDRESS.test(plan.from)) return no('owner');
    const { gas, maxFee, priority } = plan;
    if (typeof gas !== 'bigint' || typeof maxFee !== 'bigint' || typeof priority !== 'bigint') return no('gas');
    if (gas < GAS_LIMIT_MIN || gas > (token.native ? WITHDRAW_GAS_NATIVE_MAX : WITHDRAW_GAS_TOKEN_MAX) || maxFee <= 0n || priority > maxFee) return no('gas');
    const gasWei = gas * maxFee;
    if (gasWei > chain.gasCapWei) return no('gas_cap');
    const tx = token.native
      ? { kind: 'withdraw', to: plan.to, value: plan.units, data: '0x', gas, maxFee, priority }
      : { kind: 'withdraw', to: token.address, value: 0n, data: transferData(plan.to, plan.units), gas, maxFee, priority };
    return { reason: null, tx, gasWei, native: !!token.native };
  }

  async function relayDecimals(chainId, address) {
    if (!Number.isSafeInteger(chainId) || typeof address !== 'string' || !/^(0x[0-9a-fA-F]{40}|T[1-9A-HJ-NP-Za-km-z]{33}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(address)) return null;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), RELAY_MS);
    try {
      const res = await fetch(`${RELAY}/currencies/v2`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chainIds: [chainId], address, limit: 5 }), signal: abort.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
      const list = res.ok ? await res.json() : null;
      const same = (given) => typeof given === 'string' && (address.startsWith('0x') ? given.toLowerCase() === address.toLowerCase() : given === address);
      const one = Array.isArray(list) ? list.find((c) => c && c.chainId === chainId && same(c.address)) : null;
      return one && Number.isInteger(one.decimals) && one.decimals >= 0 && one.decimals <= 36 ? one.decimals : null;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  function decimalsAgree(used, ...seconds) {
    const said = seconds.filter((value) => Number.isInteger(value));
    return Number.isInteger(used) && said.length > 0 && said.every((value) => value === used);
  }

  async function quoteWithdraw(input) {
    const opts = input || {};
    const chain = chainOf(opts.chain);
    const token = tokenOf(opts.chain, opts.token);
    if (!chain || !token || typeof opts.units !== 'bigint' || opts.units <= 0n || !decimalsChosen(opts.decimals)) throw fail('bad_intent');
    const unlisted = !token.native && token.decimals === null;
    if (unlisted && opts.decimals === undefined) throw fail('bad_intent');
    if (!unlisted && opts.decimals !== undefined && opts.decimals !== token.decimals) throw fail('relay_refused', { reason: 'decimals' });
    await ownTon();
    const from = await address();
    if (!from) throw fail('no_evm_address');
    const checked = await checkAddress(opts.chain, opts.to, token.address);
    if (checked.reason) throw fail('bad_address', { reason: checked.reason });
    await T.config();
    let body;
    try {
      body = await T.api(`xchain/fees?chain=${encodeURIComponent(opts.chain)}&evm=${encodeURIComponent(from)}&token=${encodeURIComponent(token.address)}&to=${encodeURIComponent(checked.address)}&units=${opts.units.toString()}`);
    } catch (_) {
      throw fail('state_unknown');
    }
    const baseFee = units(body.baseFee), priority = units(body.priority), native = units(body.native);
    const heldUnits = token.native ? native : units(body.held);
    const estimate = units(body.gas);
    if (baseFee === null || priority === null || native === null || heldUnits === null) throw fail('state_unknown');
    if (unlisted && !decimalsAgree(opts.decimals, await relayDecimals(chain.id, token.address), Number.isInteger(body.decimals) ? body.decimals : null)) throw fail('relay_refused', { reason: 'decimals' });
    const fallback = token.native ? GAS_LIMIT_MIN : WITHDRAW_GAS_TOKEN;
    const gas = estimate ? (token.native && estimate === GAS_LIMIT_MIN ? estimate : estimate + estimate / 5n) : fallback;
    const plan = { kind: 'withdraw', chain: opts.chain, token: token.address, to: checked.address, from, units: opts.units, gas, maxFee: baseFee * 2n + priority, priority, at: Date.now() };
    const audited = auditWithdraw(plan, plan.at);
    if (audited.reason) throw fail('relay_refused', { reason: audited.reason });
    if (opts.units > heldUnits) throw fail('too_much', { have: heldUnits });
    const needs = audited.gasWei + (token.native ? opts.units : 0n);
    const short = native < needs ? needs - native : 0n;
    plan.view = { units: opts.units, to: checked.address, gasWei: audited.gasWei, gasNowWei: gas * (baseFee + priority), native, held: heldUnits, short, decimals: unlisted ? opts.decimals : token.decimals };
    return plan;
  }

  const PENDING_KEY = 'ck-evm-pending:';
  const pendingMemory = {};
  function pendingRead(id) {
    let text = pendingMemory[id] || null;
    if (!text) {
      try { text = localStorage.getItem(PENDING_KEY + id); } catch (_) { }
    }
    if (!text) return null;
    try {
      const rec = JSON.parse(text);
      return rec && Number.isSafeInteger(rec.nonce) && rec.nonce >= 0 && typeof rec.raw === 'string' && HEX_DATA.test(rec.raw) ? rec : null;
    } catch (_) {
      return null;
    }
  }
  function pendingWrite(id, rec) {
    const text = JSON.stringify(rec);
    pendingMemory[id] = text;
    try { localStorage.setItem(PENDING_KEY + id, text); } catch (_) { }
  }
  function pendingClear(id) {
    delete pendingMemory[id];
    try { localStorage.removeItem(PENDING_KEY + id); } catch (_) { }
  }
  async function pendingGate(key, from, state) {
    const id = key + ':' + from;
    const rec = pendingRead(id);
    const mined = !!rec && state.mined > rec.nonce;
    if (mined) pendingClear(id);
    if (state.pending && !(rec && !mined && String(rec.hash).toLowerCase() === state.pending.hash)) throw fail('pending', { hash: state.pending.hash });
    if (mined) return;
    if (state.nonce > state.mined || (rec && state.nonce !== rec.nonce)) {
      if (rec) await sendRaw(key, rec.raw).catch(() => null);
      throw fail('pending', rec ? { hash: rec.hash } : undefined);
    }
  }

  async function withdraw(plan, options) {
    const audited = auditWithdraw(plan, Date.now());
    if (audited.reason) throw fail('relay_refused', { reason: audited.reason });
    await ownTon();
    const [lib, read] = await Promise.all([bundle(), chainState(plan.chain, plan.from)]);
    await pendingGate(plan.chain, plan.from, read);
    const state = audited.native ? await valueGap(plan.chain, plan.from, read) : read;
    if (state !== read) await pendingGate(plan.chain, plan.from, state);
    const needs = audited.gasWei + (audited.native ? plan.units : 0n);
    if (state.native < needs) throw fail('no_gas', { needs, have: state.native });
    const signed = await withKey(async (key) => {
      if (key.address !== plan.from) {
        await CK.wallet.evmRecordRepair(key.address);
        throw fail('relay_refused', { reason: 'owner' });
      }
      const tx = signTx(lib, key.privateKey, key.address, audited.tx, CHAINS[plan.chain], state.nonce);
      pendingWrite(plan.chain + ':' + plan.from, { nonce: tx.nonce, raw: tx.raw, hash: tx.hash });
      return tx;
    }, { ...(options || {}), owner: true });
    try {
      await sendRaw(plan.chain, signed.raw, plan.from);
    } catch (err) {
      if (err.code === 'pending') pendingClear(plan.chain + ':' + plan.from);
      throw err;
    }
    return { hash: signed.hash };
  }

  const PRICE_MEMO_MS = 60000;
  const priceAsks = new Map();
  function price(key, address) {
    const chain = chainOf(key);
    const token = tokenOf(key, address);
    if (!chain || !token) return Promise.reject(fail('bad_intent'));
    const id = key + ':' + token.address;
    const held = priceAsks.get(id);
    if (held && (held.pending || Date.now() - held.at < PRICE_MEMO_MS)) return held.job;
    const one = { pending: true, at: 0, job: null };
    one.job = priceOnce(chain, token).then((value) => {
      one.pending = false;
      one.at = Date.now();
      if (value === null) priceAsks.delete(id);
      return value;
    });
    priceAsks.set(id, one);
    return one.job;
  }
  async function priceOnce(chain, token) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), RELAY_MS);
    try {
      const res = await fetch(`${RELAY}/currencies/token/price/v2?address=${token.address}&chainId=${chain.id}`, { signal: abort.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
      const body = res.ok ? await res.json() : null;
      const value = body ? usdOf(String(body.price)) : null;
      return value > 0 ? value : null;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function status(requestId, options) {
    if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) throw fail('bad_intent');
    await T.config();
    const leg = options && options.usdtLeg === true ? '&leg=usdt' : '';
    const body = await T.api('xchain/status?requestId=' + encodeURIComponent(requestId) + leg);
    return { status: typeof body.status === 'string' ? body.status : 'unknown', txHashes: Array.isArray(body.txHashes) ? body.txHashes : [] };
  }

  const saleCap = () => undefined;
  const gasCap = (key) => (chainOf(key) ? chainOf(key).gasCapWei : undefined);
  const gasKeep = (key) => (chainOf(key) ? chainOf(key).topupBelowWei : undefined);

  function tokens() {
    const out = [];
    Object.keys(CHAINS).forEach((key) => {
      const chain = CHAINS[key];
      chain.tokens.forEach((token) => out.push({ chain: key, chainId: chain.id, chainName: chain.name, ...token }));
    });
    return out;
  }

  CK.evm = {
    tokens,
    chains: () => Object.keys(CHAINS),
    tokenOf: (key, address) => {
      const token = tokenOf(key, address);
      return token ? { ...token } : null;
    },
    bundle,
    address,
    ensureAddress,
    config,
    balances,
    needsTopup,
    topupOf,
    saleCap,
    gasCap,
    gasKeep,
    splitBuy,
    quoteBuy,
    quoteGas,
    buy,
    quoteSell,
    warmSell,
    signSell,
    sendSell,
    sell,
    checkAddress,
    quoteWithdraw,
    withdraw,
    price,
    status,
    relayQuote,
    relayDecimals,
    decimalsAgree,
    auditBuy,
    auditSell,
    auditWithdraw,
    belowMarket,
    depositBody,
    deriveAddress,
    keyOf,
    pins: () => ({
      depository: DEPOSITORY,
      depositoryRaw: DEPOSITORY_RAW,
      gram: GRAM_CURRENCY,
      tonChainId: TON_CHAIN_ID,
      chains: Object.keys(CHAINS).map((key) => {
        const { tokens: list, refund, swaps, topupBelowWei, gasCapWei, ...rest } = CHAINS[key];
        return { key, ...rest, swaps: swaps.slice(), refund: refund.map((token) => ({ ...token })), tokens: list.map((token) => ({ ...token })) };
      })
    })
  };
  Object.defineProperty(CK, 'evm', { value: Object.freeze(CK.evm), writable: false, configurable: false, enumerable: true });
})();
