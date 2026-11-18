(function () {
  'use strict';
  const CK = window.CK;
  const keyCap = CK.wallet && typeof CK.wallet.keyAccess === 'function' ? CK.wallet.keyAccess('evmOrders') : null;
  const T = CK.ton;
  const E = CK.evm;
  const withKey = (fn, options) => (keyCap ? keyCap(fn, options) : Promise.reject(fail('no_wallet')));

  const FEE_EVM = '';

  const SWAP_PROXY = '0x0000000085e102724e78ecd2f45dc9ca239affad';
  const SWAP_PROXY_CODE_HASH = '0x24a203c24b85e0994ae6aecccc2bc0c1df4e22f1b3d63f33d18bec0245867aaf';
  const PERMIT2 = '0x000000000022d473030f116ddee9f6b43ac78ba3';
  const PINS = Object.freeze({
    eth: Object.freeze({ id: 1, router: '0x23617e59a5925b2a4bf75d73ff6711cd0b29de85', routerCodeHash: '0x55e6b334152096d60367d7ab24241948b31e8d0e66adc8b81cba049a19f9d2ac', v2Factory: '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f', v3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984', poolManager: '0x000000000004444c5dc75cb358380d2e3de08a90', stateView: '0x7ffe42c4a5deea5b0fec41c94c136cf115597227', quoterV2: '0x61ffe014ba17989e743c5f6cb21bf9697530b21e', v4Quoter: '0x99bd42b2b22e531f283b7f8a86dff631eb16a9d1', weth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', usdcTier: 500, cancelRow: true, opStack: false }),
    base: Object.freeze({ id: 8453, router: '0xd6145b2d3f379919e8cdeda7b97e37c4b2ca9c40', routerCodeHash: '0x816c75fe7f6ccf8fe8b14825091e8dff301fe7ffd4b962f89b2981a747facc08', v2Factory: '0x8909dc15e40173ff4699343b6eb8132c65e18ec6', v3Factory: '0x33128a8fc17869897dce68ed026d694621f6fdfd', poolManager: '0x498581ff718922c3f8e6a244956af099b2652b2b', stateView: '0xa3c0c9b65bad0b08107aa264b0f3db444b867a71', quoterV2: '0x3d4e44eb1374240ce5f1b871ab261cd16335b76a', v4Quoter: '0xe1a6c5803e3c44368b171bd680c7d32dfc92ca47', weth: '0x4200000000000000000000000000000000000006', usdc: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', usdcTier: 3000, cancelRow: false, opStack: true }),
    arbitrum: Object.freeze({ id: 42161, router: '0x2d01411773c8c24805306e89a41f7855c3c4fe65', routerCodeHash: '0x51536ca9d25ebbc535351834b75115ba1843fb402c003d65ead6c760be6cc1c0', v2Factory: '0xf1d7cc64fb4452f05c498126312ebe29f30fbcf9', v3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984', poolManager: '0x360e68faccca8ca495c1b759fd9eee466db9fb32', stateView: '0x76fd297e2d437cd7f76d50f01afe6160f86e9990', quoterV2: '0x61ffe014ba17989e743c5f6cb21bf9697530b21e', v4Quoter: '0x8928074ca1b241d8ec02815881c1af11e8bc5219', weth: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', usdc: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', usdcTier: 500, cancelRow: false, opStack: false }),
    bsc: Object.freeze({ id: 56, router: '0xdc264714f68d84cf29bc605589405e78bdbe7c9f', routerCodeHash: '0xe867d0c9a826a351e9d8cefc0fa947d71a497b9ecb0395380814a064fc8465a4', v2Factory: '0x8909dc15e40173ff4699343b6eb8132c65e18ec6', v3Factory: '0xdb1d10011ad0ff90774d0c6bb92e5c5c8b4461f7', poolManager: '0x28e2ea090877bf75740558f6bfb36a5ffee9e9df', stateView: '0xd13dd3d6e93f276fafc9db9e6bb47c1180aee0c4', quoterV2: '0x78d78e420da98ad378d7799be8f4af69033eb077', v4Quoter: '0x95c086d7fe28add842ee220fef225a777474d781', weth: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', usdcTier: 500, cancelRow: false, opStack: false }),
    polygon: Object.freeze({ id: 137, router: '0xdc264714f68d84cf29bc605589405e78bdbe7c9f', routerCodeHash: '0x370874a6575cc7bd5cef1d58b30d0ce5905a90a54e955695573d2e896f1e9733', v2Factory: '0x9e5a52f57b3038f1b8eee45f28b3c1967e22799c', v3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984', poolManager: '0x67366782805870060151383f4bbff9dab53e5cd6', stateView: '0x5ea1bd7974c8a611cbab0bdcafcb1d9cc9b3ba5a', quoterV2: '0x61ffe014ba17989e743c5f6cb21bf9697530b21e', v4Quoter: '0x31ab0dea31fc0ad5a54f03cd59c896ecd067447b', weth: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', usdc: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', usdcTier: 500, cancelRow: false, opStack: false }),
    optimism: Object.freeze({ id: 10, router: '0xc09255d86db563cbc11c2fcf4a0c512e160111b4', routerCodeHash: '0xba894f04adabac264993bc9ef53287533533d1448b8c20704db67d04ef514ef2', v2Factory: '0x0c3c1c532f1e39edf36be9fe0be1410313e074bf', v3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984', poolManager: '0x9a13f98cb987694c9f086b1f5eb990eea8264ec3', stateView: '0xc18a3169788f4f75a170290584eca6395c75ecdb', quoterV2: '0x61ffe014ba17989e743c5f6cb21bf9697530b21e', v4Quoter: '0xd673f731edfe5aaf1bda7fd43d13bbb5150b87ca', weth: '0x4200000000000000000000000000000000000006', usdc: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', usdcTier: 3000, cancelRow: false, opStack: true }),
    avalanche: Object.freeze({ id: 43114, router: '0x661e93cca42afacb172121ef892830ca3b70f08d', routerCodeHash: '0x39821d3bb1dd8bd39de51a4f9ebd6ca19e41085645765cf4576405ee31c7dd83', v2Factory: '0x9e5a52f57b3038f1b8eee45f28b3c1967e22799c', v3Factory: '0x740b1c1de25031c31ff4fc9a62f554a55cdc1bad', poolManager: '0x06380c0e0912312b5150364b9dc4542ba0dbbc85', stateView: '0xc3c9e198c735a4b97e3e683f391ccbdd60b69286', quoterV2: '0xbe0f5544ec67e9b3b2d979aaa43f18fd87e6257f', v4Quoter: '0xf27e532878b622d6b916f524e8711880107d4ef0', weth: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', usdc: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', usdcTier: 500, cancelRow: false, opStack: false }),
    ink: Object.freeze({ id: 57073, router: '0x661e93cca42afacb172121ef892830ca3b70f08d', routerCodeHash: '0x9a9304f3546eefaca98621c3181c339f8c8aaa9f8a891e31dcd5170479ad31dc', v2Factory: '0xfe57a6ba1951f69ae2ed4abe23e0f095df500c04', v3Factory: '0x640887a9ba3a9c53ed27d0f7e8246a4f933f3424', poolManager: '0x360e68faccca8ca495c1b759fd9eee466db9fb32', stateView: '0x76fd297e2d437cd7f76d50f01afe6160f86e9990', quoterV2: '0x96b572d2d880cf2fa2563651bd23ade6f5516652', v4Quoter: '0x8928074ca1b241d8ec02815881c1af11e8bc5219', weth: '0x4200000000000000000000000000000000000006', usdc: '0x2d270e6886d130d724215a266106e6832161eaed', usdcTier: null, cancelRow: false, opStack: true }),
    monad: Object.freeze({ id: 143, router: '0xa6ce4f10d83dbddac17e68e1837ca9ce6a1b596e', routerCodeHash: '0xcb07a717d70f36cf270f1a6ed44163097e4dc8acbafb1d412cdb38f46af4b421', v2Factory: '0x182a927119d56008d921126764bf884221b10f59', v3Factory: '0x204faca1764b154221e35c0d20abb3c525710498', poolManager: '0x188d586ddcf52439676ca21a244753fa19f9ea8e', stateView: '0x77395f3b2e73ae90843717371294fa97cc419d64', quoterV2: '0x661e93cca42afacb172121ef892830ca3b70f08d', v4Quoter: '0xa222dd357a9076d1091ed6aa2e16c9742dd26891', weth: '0x3bd359c1119da7da1d913d1c4d2b7c461115433a', usdc: '0x754704bc059f8c67012fed69bc8a327a5aafb603', usdcTier: 3000, cancelRow: false, opStack: false }),
    unichain: Object.freeze({ id: 130, router: '0xd1b797d92d87b688193a2b976efc8d577d204343', routerCodeHash: '0xf5bedf4598147c1359b12f9c6b5d827e210c62c1a00ccc2702abc8039b99ee8f', v2Factory: '0x1f98400000000000000000000000000000000002', v3Factory: '0x1f98400000000000000000000000000000000003', poolManager: '0x1f98400000000000000000000000000000000004', stateView: '0x86e8631a016f9068c3f085faf484ee3f5fdee8f2', quoterV2: '0x385a5cf5f83e99f7bb2852b6a19c3538b9fa7658', v4Quoter: '0xf885781cb68a0be66aa2ac7eda5fe72bde7da907', weth: '0x4200000000000000000000000000000000000006', usdc: '0x078d782b760474a361dda0af3839290b0ef57ad6', usdcTier: 3000, cancelRow: false, opStack: true })
  });
  const pinOf = (chain) => (typeof chain === 'string' && Object.prototype.hasOwnProperty.call(PINS, chain) ? PINS[chain] : null);

  const NATIVE = '0x0000000000000000000000000000000000000000';
  const ADDRESS_THIS = '0x0000000000000000000000000000000000000002';
  const MSG_SENDER = '0x0000000000000000000000000000000000000001';
  const OPEN_DELTA = 0n;
  const CONTRACT_BALANCE = 1n << 255n;
  const CMD = Object.freeze({ V3_SWAP_EXACT_IN: 0x00, SWEEP: 0x04, PAY_PORTION: 0x06, V2_SWAP_EXACT_IN: 0x08, WRAP_ETH: 0x0b, UNWRAP_WETH: 0x0c, V4_SWAP: 0x10 });
  const ALLOW_REVERT = 0x80;
  const ACT = Object.freeze({ SWAP_EXACT_IN_SINGLE: 0x06, SETTLE: 0x0b, TAKE: 0x0e });
  const SEL_PROXY = '0x2894adf9';
  const SEL_ROUTER = '0x3593564c';
  const SEL_APPROVE = '0x095ea7b3';
  const SEL_TRANSFER = '0xa9059cbb';

  const FEE_BIPS = 100n;
  const V3_TIERS = Object.freeze([100, 500, 3000, 10000]);
  const V4_SPACING = new Map([[100, 1], [500, 10], [3000, 60], [10000, 200]]);
  const FLOORS_PER_MILLE = Object.freeze([980n, 965n, 950n]);
  const LEVELS = 13;
  const LEVEL_STEP = 112n;
  const TAKE_LEVELS = Object.freeze([0, 1]);
  const STOP_LEVELS = Object.freeze([Object.freeze([2, 3, 4]), Object.freeze([5, 6, 7]), Object.freeze([8, 9, 10])]);
  const CEILING_LEVEL = 10;
  const X_LEVEL = 11;
  const K_LEVEL = 12;
  const R_LEVEL = 10;
  const VALID_S = 7 * 86400;
  const VALID_SLACK_S = 600;
  const DEADLINE_MAX_S = 900;
  const CEILING_BASE_TIMES = 30n;
  const VALUE_CAP_BPS = 100n;
  const GAS_TRANSFER_MIN = 21000n;
  const GAS_VALUE_MAX = 100000n;
  const GAS_TOKEN_MAX = 400000n;
  const GAS_SALE_MIN = 60000n;
  const GAS_SALE_MAX = 4000000n;
  const GAS_TOKEN_RETURN = 120000n;
  const PLAN_LIFE_MS = 110000;
  const SLOT_TRIES = 3;
  const MINED_POLL_MS = 1500;
  const MINED_WAIT_MS = 60000;
  const RETURN_TOKENS_MAX = 4;

  const ADDRESS = /^0x[0-9a-f]{40}$/;
  const HEX = /^0x(?:[0-9a-f]{2})*$/;
  const DIGITS = /^\d{1,78}$/;
  const ORDER_ID = /^[A-Za-z0-9_-]{1,64}$/;

  function fail(code, extra) {
    const err = new Error(code);
    err.code = code;
    return extra ? Object.assign(err, extra) : err;
  }
  const refused = (reason) => fail('order_refused', { reason });
  const nowSeconds = () => Math.floor(Date.now() / 1000);
  const big = (value) => (typeof value === 'string' && DIGITS.test(value) ? BigInt(value) : typeof value === 'bigint' && value >= 0n ? value : null);
  const isAddress = (value) => typeof value === 'string' && ADDRESS.test(value);
  const pinned = (pin, address) => address === pin.router || address === SWAP_PROXY || address === PERMIT2 || address === ADDRESS_THIS || address === MSG_SENDER;

  const U256 = 1n << 256n;
  function uintWord(value, bits) {
    if (typeof value !== 'bigint' || value < 0n || value >= (bits ? 1n << BigInt(bits) : U256)) throw refused('encode');
    return value.toString(16).padStart(64, '0');
  }
  function addressWord(address) {
    if (!isAddress(address)) throw refused('encode');
    return address.slice(2).padStart(64, '0');
  }
  const boolWord = (flag) => uintWord(flag ? 1n : 0n);
  function bytesTail(hex) {
    if (typeof hex !== 'string' || !HEX.test(hex)) throw refused('encode');
    const body = hex.slice(2);
    return uintWord(BigInt(body.length / 2)) + body.padEnd(Math.ceil(body.length / 64) * 64, '0');
  }
  function tuple(args) {
    const headBytes = args.reduce((sum, arg) => sum + (arg.tail === undefined ? arg.word.length / 2 : 32), 0);
    let head = '', tail = '';
    for (const arg of args) {
      if (arg.tail === undefined) head += arg.word;
      else {
        head += uintWord(BigInt(headBytes + tail.length / 2));
        tail += arg.tail;
      }
    }
    return head + tail;
  }
  const W = (word) => ({ word });
  const bytesArg = (hex) => ({ tail: bytesTail(hex) });
  const wordsArg = (words) => ({ tail: uintWord(BigInt(words.length)) + words.join('') });
  const bytesListArg = (list) => ({ tail: uintWord(BigInt(list.length)) + tuple(list.map(bytesArg)) });

  const abi = Object.freeze({
    v3SwapExactIn: (recipient, amountIn, amountOutMin, path, payerIsUser, minHop) => '0x' + tuple([W(addressWord(recipient)), W(uintWord(amountIn)), W(uintWord(amountOutMin)), bytesArg(path), W(boolWord(payerIsUser)), wordsArg((minHop || []).map((v) => uintWord(v)))]),
    v2SwapExactIn: (recipient, amountIn, amountOutMin, path, payerIsUser, minHop) => '0x' + tuple([W(addressWord(recipient)), W(uintWord(amountIn)), W(uintWord(amountOutMin)), wordsArg(path.map(addressWord)), W(boolWord(payerIsUser)), wordsArg((minHop || []).map((v) => uintWord(v)))]),
    v3Path: (hops) => {
      if (!Array.isArray(hops) || hops.length < 3 || hops.length % 2 === 0) throw refused('encode');
      return '0x' + hops.map((hop, i) => (i % 2 === 0 ? addressWord(hop).slice(24) : uintWord(BigInt(hop), 24).slice(58))).join('');
    },
    payPortion: (token, recipient, bips) => '0x' + tuple([W(addressWord(token)), W(addressWord(recipient)), W(uintWord(bips))]),
    sweep: (token, recipient, amountMin) => '0x' + tuple([W(addressWord(token)), W(addressWord(recipient)), W(uintWord(amountMin, 160))]),
    wrapEth: (recipient, amount) => '0x' + tuple([W(addressWord(recipient)), W(uintWord(amount))]),
    unwrapWeth: (recipient, amountMin) => '0x' + tuple([W(addressWord(recipient)), W(uintWord(amountMin))]),
    v4Swap: (actions, params) => '0x' + tuple([bytesArg(actions), bytesListArg(params)]),
    swapExactInSingle: (key, zeroForOne, amountIn, amountOutMinimum, minHopPriceX36, hookData) => '0x' + tuple([{
      tail: tuple([W(addressWord(key.currency0) + addressWord(key.currency1) + uintWord(BigInt(key.fee), 24) + uintWord(BigInt(key.tickSpacing), 23) + addressWord(key.hooks)),
        W(boolWord(zeroForOne)), W(uintWord(amountIn, 128)), W(uintWord(amountOutMinimum, 128)), W(uintWord(minHopPriceX36)), bytesArg(hookData)])
    }]),
    settle: (currency, amount, payerIsUser) => '0x' + tuple([W(addressWord(currency)), W(uintWord(amount)), W(boolWord(payerIsUser))]),
    take: (currency, recipient, amount) => '0x' + tuple([W(addressWord(currency)), W(addressWord(recipient)), W(uintWord(amount))]),
    proxyExecute: (router, token, amount, commands, inputs, deadline) => SEL_PROXY + tuple([W(addressWord(router)), W(addressWord(token)), W(uintWord(amount)), bytesArg(commands), bytesListArg(inputs), W(uintWord(deadline))]),
    routerExecute: (commands, inputs, deadline) => SEL_ROUTER + tuple([bytesArg(commands), bytesListArg(inputs), W(uintWord(deadline))]),
    approve: (spender, amount) => SEL_APPROVE + addressWord(spender) + uintWord(amount),
    transfer: (to, amount) => SEL_TRANSFER + addressWord(to) + uintWord(amount)
  });
  const commandsHex = (list) => '0x' + list.map((one) => one.toString(16).padStart(2, '0')).join('');

  function routeFault(route, kind, token, out, pin) {
    if (!route || typeof route !== 'object') return 'pool';
    if (route.hooks !== undefined && route.hooks !== NATIVE) return 'pool';
    if (route.usdcTier !== undefined && route.usdcTier !== pin.usdcTier) return 'pool';
    if (out !== 'usdc' && out !== 'coin') return 'pool';
    if (kind === 'coin') return route.venue === 'coin' && out === 'usdc' && pin.usdcTier ? '' : 'pool';
    if (route.venue === 'coin') return 'pool';
    if (token === pin.usdc) return 'pool';
    if (route.venue === 'wrapped') return token === pin.weth && out === 'usdc' && pin.usdcTier ? '' : 'pool';
    if (token === pin.weth) return 'pool';
    if (route.pair !== 'weth' && route.pair !== 'usdc') return 'pool';
    if (route.pair === 'usdc' && out !== 'usdc') return 'pool';
    if (route.pair === 'weth' && out === 'usdc' && !pin.usdcTier) return 'pool';
    if (route.venue === 'v2') return route.fee === undefined && route.native === undefined ? '' : 'pool';
    if (route.venue === 'v3') return V3_TIERS.includes(route.fee) && route.native === undefined ? '' : 'pool';
    if (route.venue === 'v4') {
      if (!V4_SPACING.has(route.fee) || V4_SPACING.get(route.fee) !== route.tickSpacing) return 'pool';
      if (route.native !== undefined && typeof route.native !== 'boolean') return 'pool';
      return route.native && route.pair !== 'weth' ? 'pool' : '';
    }
    return 'pool';
  }

  function saleCommands(spec) {
    const pin = pinOf(spec.chain);
    if (!pin) throw refused('chain');
    if (!FEE_EVM) throw refused('fee_unset');
    const fault = routeFault(spec.route, spec.kind, spec.token, spec.out, pin);
    if (fault) throw refused(fault);
    const cmds = [], inputs = [];
    const add = (command, input) => { cmds.push(command); inputs.push(input); };
    const route = spec.route;
    const usdcLeg = () => add(CMD.V3_SWAP_EXACT_IN, abi.v3SwapExactIn(ADDRESS_THIS, CONTRACT_BALANCE, 0n, abi.v3Path([pin.weth, pin.usdcTier, pin.usdc]), false, []));
    if (spec.kind === 'coin') {
      add(CMD.WRAP_ETH, abi.wrapEth(ADDRESS_THIS, spec.units));
      add(CMD.PAY_PORTION, abi.payPortion(pin.weth, FEE_EVM, FEE_BIPS));
      usdcLeg();
      add(CMD.SWEEP, abi.sweep(pin.usdc, spec.main, spec.floor));
      return { commands: commandsHex(cmds), inputs };
    }
    const mid = route.venue === 'wrapped' ? pin.weth : route.pair === 'weth' ? pin.weth : pin.usdc;
    if (route.venue === 'v2') add(CMD.V2_SWAP_EXACT_IN, abi.v2SwapExactIn(ADDRESS_THIS, spec.units, 0n, [spec.token, mid], false, []));
    else if (route.venue === 'v3') add(CMD.V3_SWAP_EXACT_IN, abi.v3SwapExactIn(ADDRESS_THIS, spec.units, 0n, abi.v3Path([spec.token, route.fee, mid]), false, []));
    else if (route.venue === 'v4') {
      const other = route.native ? NATIVE : mid;
      const [currency0, currency1] = BigInt(spec.token) < BigInt(other) ? [spec.token, other] : [other, spec.token];
      const key = { currency0, currency1, fee: route.fee, tickSpacing: route.tickSpacing, hooks: NATIVE };
      if (spec.units >= 1n << 128n) throw refused('amount');
      add(CMD.V4_SWAP, abi.v4Swap(commandsHex([ACT.SWAP_EXACT_IN_SINGLE, ACT.SETTLE, ACT.TAKE]), [
        abi.swapExactInSingle(key, currency0 === spec.token, spec.units, 0n, 0n, '0x'),
        abi.settle(spec.token, OPEN_DELTA, false),
        abi.take(other, ADDRESS_THIS, OPEN_DELTA)
      ]));
      if (route.native) add(CMD.WRAP_ETH, abi.wrapEth(ADDRESS_THIS, CONTRACT_BALANCE));
    }
    if (route.venue === 'wrapped' || route.pair === 'weth') {
      add(CMD.PAY_PORTION, abi.payPortion(pin.weth, FEE_EVM, FEE_BIPS));
      if (spec.out === 'coin') {
        if (spec.mainCode) add(CMD.SWEEP, abi.sweep(pin.weth, spec.main, spec.floor));
        else add(CMD.UNWRAP_WETH, abi.unwrapWeth(spec.main, spec.floor));
      } else {
        usdcLeg();
        add(CMD.SWEEP, abi.sweep(pin.usdc, spec.main, spec.floor));
      }
    } else {
      add(CMD.PAY_PORTION, abi.payPortion(pin.usdc, FEE_EVM, FEE_BIPS));
      add(CMD.SWEEP, abi.sweep(pin.usdc, spec.main, spec.floor));
    }
    return { commands: commandsHex(cmds), inputs };
  }
  function saleCall(spec) {
    const pin = pinOf(spec.chain);
    if (!pin) throw refused('chain');
    const { commands, inputs } = saleCommands(spec);
    return spec.kind === 'coin' ? abi.routerExecute(commands, inputs, BigInt(spec.deadline)) : abi.proxyExecute(pin.router, spec.token, spec.units, commands, inputs, BigInt(spec.deadline));
  }

  function readEnvelope(data, kind) {
    const sel = kind === 'coin' ? SEL_ROUTER : SEL_PROXY;
    if (typeof data !== 'string' || !HEX.test(data) || !data.startsWith(sel)) return null;
    const body = data.slice(10);
    const words = body.length / 64;
    if (!Number.isInteger(words)) return null;
    const word = (i) => (i < words ? BigInt('0x' + body.slice(i * 64, i * 64 + 64)) : null);
    const addrAt = (i) => {
      const w = body.slice(i * 64, i * 64 + 64);
      return w.length === 64 && w.startsWith('0'.repeat(24)) ? '0x' + w.slice(24) : null;
    };
    const bytesAt = (byteOffset) => {
      if (byteOffset % 32n !== 0n) return null;
      const at = Number(byteOffset / 32n);
      const len = word(at);
      if (len === null || len > 100000n) return null;
      const hex = body.slice((at + 1) * 64, (at + 1) * 64 + Number(len) * 2);
      return hex.length === Number(len) * 2 ? { hex: '0x' + hex, end: at + 1 + Math.ceil(Number(len) / 32) } : null;
    };
    const head = kind === 'coin' ? 0 : 3;
    const out = kind === 'coin' ? {} : { router: addrAt(0), token: addrAt(1), amount: word(2) };
    const commandsOffset = word(head), inputsOffset = word(head + 1);
    out.deadline = word(head + 2);
    if (commandsOffset === null || inputsOffset === null || out.deadline === null) return null;
    const commands = bytesAt(commandsOffset);
    if (!commands) return null;
    out.commands = commands.hex;
    if (inputsOffset % 32n !== 0n) return null;
    const listAt = Number(inputsOffset / 32n);
    const count = word(listAt);
    if (count === null || count > 64n) return null;
    out.inputs = [];
    for (let i = 0; i < Number(count); i++) {
      const rel = word(listAt + 1 + i);
      if (rel === null) return null;
      const one = bytesAt(inputsOffset + 32n + rel);
      if (!one) return null;
      out.inputs.push(one.hex);
    }
    return out;
  }
  const inputWord = (input, i) => (typeof input === 'string' && input.length >= 2 + (i + 1) * 64 ? BigInt('0x' + input.slice(2 + i * 64, 2 + (i + 1) * 64)) : null);
  const inputAddress = (input, i) => {
    const w = inputWord(input, i);
    return w !== null && w < 1n << 160n ? '0x' + w.toString(16).padStart(40, '0') : null;
  };

  function floorsOf(stopOut) {
    if (typeof stopOut !== 'bigint' || stopOut <= 0n) return [];
    return FLOORS_PER_MILLE.map((perMille) => (stopOut * perMille) / 1000n);
  }
  function levelsFault(levels) {
    if (!Array.isArray(levels) || levels.length !== LEVELS) return 'levels';
    for (let i = 0; i < LEVELS; i++) {
      const one = levels[i];
      if (!one || typeof one.maxFee !== 'bigint' || typeof one.priority !== 'bigint' || one.priority <= 0n || one.maxFee < one.priority) return 'levels';
      if (i && (one.maxFee * 100n < levels[i - 1].maxFee * LEVEL_STEP || one.priority * 100n < levels[i - 1].priority * LEVEL_STEP)) return 'levels';
    }
    return '';
  }
  const feeOk = (fee) => !!fee && typeof fee.maxFee === 'bigint' && typeof fee.priority === 'bigint' && fee.priority > 0n && fee.maxFee >= fee.priority;
  function reserveOf(ctx) {
    const L = ctx.levels, g = ctx.gas;
    const pin = pinOf(ctx.chain);
    const atQ = [g.sale * L[CEILING_LEVEL].maxFee, g.x * L[X_LEVEL].maxFee];
    if (pin && pin.cancelRow) atQ.push(g.k * L[K_LEVEL].maxFee);
    const approve = ctx.kind === 'coin' ? 0n : g.approve * ctx.fees.approve.maxFee;
    return approve + atQ.reduce((a, b) => (a > b ? a : b)) + g.r * L[R_LEVEL].maxFee + ctx.l1Buffer;
  }

  function ladderOf(ctx, q) {
    const pin = pinOf(ctx.chain);
    const coin = ctx.kind === 'coin';
    const sale = (role, level, min, extra) => ({
      role, from: ctx.order, nonce: q, to: coin ? pin.router : SWAP_PROXY, value: coin ? ctx.units : 0n,
      data: saleCall({ chain: ctx.chain, kind: ctx.kind, token: ctx.token, units: ctx.units, route: ctx.route, out: ctx.out, main: ctx.main, floor: min, mainCode: ctx.mainCode, deadline: ctx.deadline }),
      gas: ctx.gas.sale, maxFee: ctx.levels[level].maxFee, priority: ctx.levels[level].priority, level, min, ...extra
    });
    const rows = [];
    if (ctx.takeOut) TAKE_LEVELS.forEach((level, i) => rows.push(sale('take', level, ctx.takeOut, { tier: i + 1 })));
    const floors = floorsOf(ctx.stopOut);
    STOP_LEVELS.forEach((tier, t) => tier.forEach((level, f) => { if (floors.length) rows.push(sale('stop', level, floors[f], { floor: f, tier: t + 1 })); }));
    return rows;
  }
  function returnsOf(ctx, q) {
    const pin = pinOf(ctx.chain);
    const coin = ctx.kind === 'coin';
    const back = (role, nonce, level, gas) => ({
      role, from: ctx.order, nonce, to: coin ? ctx.main : ctx.token, value: coin ? ctx.units : 0n, data: coin ? '0x' : abi.transfer(ctx.main, ctx.units),
      gas, maxFee: ctx.levels[level].maxFee, priority: ctx.levels[level].priority, level
    });
    const rows = [back('return', q, X_LEVEL, ctx.gas.x)];
    if (pin.cancelRow) rows.push({ role: 'cancel', from: ctx.order, nonce: q, to: ctx.order, value: 0n, data: '0x', gas: ctx.gas.k, maxFee: ctx.levels[K_LEVEL].maxFee, priority: ctx.levels[K_LEVEL].priority, level: K_LEVEL });
    rows.push(back('returnAfter', q + 1, R_LEVEL, ctx.gas.r));
    return rows;
  }
  function buildRows(ctx) {
    const coin = ctx.kind === 'coin';
    if (ctx.edit === 'extend') return ladderOf(ctx, ctx.q);
    if (ctx.edit === 'change') {
      const bump = { role: 'bump', from: ctx.order, nonce: ctx.q - 1, to: ctx.order, value: 0n, data: '0x', gas: ctx.gas.k, maxFee: ctx.bump.maxFee, priority: ctx.bump.priority };
      return [bump, ...ladderOf(ctx, ctx.q), ...returnsOf(ctx, ctx.q)];
    }
    const k = ctx.k, q = coin ? k : k + 1;
    const G = reserveOf(ctx);
    const rows = [{ role: 'fundGas', from: ctx.main, nonce: ctx.m, to: ctx.order, value: coin ? ctx.units + G : G, data: '0x', gas: ctx.gas.fundGas, maxFee: ctx.fees.fund.maxFee, priority: ctx.fees.fund.priority }];
    if (!coin) {
      rows.push({ role: 'fundToken', from: ctx.main, nonce: ctx.m + 1, to: ctx.token, value: 0n, data: abi.transfer(ctx.order, ctx.units), gas: ctx.gas.fundToken, maxFee: ctx.fees.fund.maxFee, priority: ctx.fees.fund.priority });
      rows.push({ role: 'approve', from: ctx.order, nonce: k, to: ctx.token, value: 0n, data: abi.approve(SWAP_PROXY, ctx.units), gas: ctx.gas.approve, maxFee: ctx.fees.approve.maxFee, priority: ctx.fees.approve.priority });
    }
    return [...rows, ...ladderOf(ctx, q), ...returnsOf(ctx, q)];
  }

  function auditEvmOrder(rows, ctx, nowS) {
    const no = (reason) => ({ reason });
    if (!FEE_EVM) return no('fee_unset');
    if (!ctx || typeof ctx !== 'object' || !Array.isArray(rows)) return no('plan');
    if (ctx.edit !== undefined && ctx.edit !== 'extend' && ctx.edit !== 'change') return no('plan');
    const pin = pinOf(ctx.chain);
    if (!pin || typeof ctx.gasCapWei !== 'bigint' || ctx.gasCapWei <= 0n) return no('chain');
    const coin = ctx.kind === 'coin';
    if (ctx.kind !== 'token' && !coin) return no('token');
    if (!isAddress(ctx.main) || pinned(pin, ctx.main) || ctx.main === NATIVE) return no('owner');
    if (!isAddress(ctx.order) || ctx.order === ctx.main || pinned(pin, ctx.order) || ctx.order === NATIVE) return no('order_address');
    if (coin ? ctx.token !== NATIVE : !isAddress(ctx.token) || ctx.token === NATIVE || pinned(pin, ctx.token) || ctx.token === ctx.main || ctx.token === ctx.order) return no('token');
    if (typeof ctx.units !== 'bigint' || ctx.units <= 0n || ctx.units >= 1n << 128n) return no('amount');
    if (routeFault(ctx.route, ctx.kind, ctx.token, ctx.out, pin)) return no('pool');
    if (typeof ctx.mainCode !== 'boolean') return no('plan');

    const price = (value) => value === null || (typeof value === 'bigint' && value > 0n);
    if (!price(ctx.stopOut) || !price(ctx.takeOut)) return no('plan');
    if (!ctx.stopOut && !ctx.takeOut) return no('nothing');
    if (typeof ctx.expected !== 'bigint' || ctx.expected <= 0n) return no('plan');
    if (ctx.stopOut && ctx.stopOut >= ctx.expected) return no('stop_above_price');
    if (ctx.takeOut && ctx.takeOut <= ctx.expected) return no('take_below_price');

    if (!Number.isSafeInteger(ctx.validUntil) || ctx.validUntil < nowS + VALID_S - VALID_SLACK_S || ctx.validUntil > nowS + VALID_S + VALID_SLACK_S) return no('valid_until');
    if (!Number.isSafeInteger(ctx.deadline) || ctx.deadline < ctx.validUntil || ctx.deadline > ctx.validUntil + DEADLINE_MAX_S) return no('deadline');

    if (levelsFault(ctx.levels)) return no('levels');
    const g = ctx.gas;
    const within = (value, lo, hi) => typeof value === 'bigint' && value >= lo && value <= hi;
    if (!g || !within(g.sale, GAS_SALE_MIN, GAS_SALE_MAX)) return no('gas');
    if (ctx.edit !== 'extend') {
      if (!within(g.x, GAS_TRANSFER_MIN, coin ? GAS_VALUE_MAX : GAS_TOKEN_MAX) || !within(g.r, GAS_TRANSFER_MIN, coin ? GAS_VALUE_MAX : GAS_TOKEN_MAX)) return no('gas');
      if ((pin.cancelRow || ctx.edit === 'change') && !within(g.k, GAS_TRANSFER_MIN, GAS_VALUE_MAX)) return no('gas');
    }
    const ceiling = ctx.levels[CEILING_LEVEL].maxFee;
    if (typeof ctx.baseFee !== 'bigint' || typeof ctx.valueWei !== 'bigint') return no('plan');
    if (coin && ctx.valueWei > ctx.units) return no('value_cap');
    if (!coin && ctx.out === 'coin' && ctx.valueWei * 97n > ctx.expected * 100n) return no('value_cap');
    const byValue = ctx.valueWei * VALUE_CAP_BPS / 10000n;
    const byBase = CEILING_BASE_TIMES * ctx.baseFee * g.sale;
    if (ceiling * g.sale > (byValue > byBase ? byValue : byBase)) return no('value_cap');

    let q, hi;
    if (ctx.edit === 'extend' || ctx.edit === 'change') {
      if (!Number.isSafeInteger(ctx.q) || ctx.q < 1 || !Number.isSafeInteger(ctx.recordHi)) return no('nonce');
      if (ctx.edit === 'extend') {
        if (ctx.q !== ctx.recordHi - 1 && ctx.q !== ctx.recordHi - 2) return no('nonce');
        q = ctx.q;
        hi = ctx.recordHi;
      } else {
        if (ctx.q !== ctx.recordHi && ctx.q !== ctx.recordHi - 1) return no('nonce');
        if (!feeOk(ctx.bump) || g.k * ctx.bump.maxFee > ctx.gasCapWei) return no('bump');
        q = ctx.q;
        hi = Math.max(q + 1, ctx.recordHi);
      }
    } else {
      if (!Number.isSafeInteger(ctx.k) || ctx.k < 0 || !Number.isSafeInteger(ctx.m) || ctx.m < 0) return no('nonce');
      if (!Number.isSafeInteger(ctx.recordHi) || !Number.isSafeInteger(ctx.serverHi) || ctx.k <= ctx.recordHi || ctx.k <= ctx.serverHi) return no('slot');
      if (ctx.recordHi < 0 && ctx.serverHi < 0 && ctx.k !== 0) return no('slot');
      if (!feeOk(ctx.fees && ctx.fees.fund) || (!coin && !feeOk(ctx.fees.approve))) return no('levels');
      if (!within(g.fundGas, GAS_TRANSFER_MIN, GAS_VALUE_MAX) || (!coin && (!within(g.fundToken, GAS_TRANSFER_MIN, GAS_TOKEN_MAX) || !within(g.approve, GAS_TRANSFER_MIN, GAS_TOKEN_MAX)))) return no('gas');
      if (typeof ctx.l1Buffer !== 'bigint' || ctx.l1Buffer < 0n || ctx.l1Buffer > ctx.gasCapWei) return no('reserve');
      if (ctx.G !== reserveOf(ctx)) return no('reserve');
      q = coin ? ctx.k : ctx.k + 1;
      hi = q + 1;
    }

    let want;
    try {
      want = buildRows(ctx);
    } catch (err) {
      return no(err && err.reason ? err.reason : 'plan');
    }
    if (rows.length !== want.length) return no('ladder');
    for (let i = 0; i < want.length; i++) {
      const row = rows[i], w = want[i];
      if (!row || typeof row !== 'object' || row.role !== w.role || row.level !== w.level || row.floor !== w.floor || row.tier !== w.tier) return no('ladder');
      if (row.from !== w.from) return no(row.from === ctx.main || row.from === ctx.order ? 'nonce' : 'owner');
      if (row.nonce !== w.nonce) return no('nonce');
      const reason = rowFault(row, w, ctx, pin);
      if (reason) return no(reason);
      if (row.gas !== w.gas) return no('gas');
      if (row.maxFee !== w.maxFee || row.priority !== w.priority) return no('levels');
      if (typeof row.gas !== 'bigint' || typeof row.maxFee !== 'bigint' || row.gas * row.maxFee > ctx.gasCapWei) return no('gas_cap');
      if (row.to !== w.to || row.value !== w.value || row.data !== w.data) return no('row');
    }
    const G = ctx.edit ? null : reserveOf(ctx);
    return { reason: null, q, hi, G };
  }
  function prepare(ctx, nowS) {
    let rows;
    try {
      rows = buildRows(ctx);
    } catch (err) {
      if (err && err.code === 'order_refused') throw err;
      const why = auditEvmOrder([], ctx, nowS).reason;
      throw refused(why && why !== 'ladder' ? why : 'plan');
    }
    const audited = auditEvmOrder(rows, ctx, nowS);
    if (audited.reason) throw refused(audited.reason);
    return { rows, audited };
  }
  function rowFault(row, w, ctx, pin) {
    const coin = ctx.kind === 'coin';
    switch (row.role) {
      case 'fundGas':
        return row.to === ctx.order && row.value === w.value && row.data === '0x' ? '' : 'funding';
      case 'fundToken':
        return row.to === ctx.token && row.value === 0n && row.data === abi.transfer(ctx.order, ctx.units) ? '' : 'funding';
      case 'approve':
        return row.to === ctx.token && row.value === 0n && row.data === abi.approve(SWAP_PROXY, ctx.units) ? '' : 'approve';
      case 'return':
      case 'returnAfter':
        return row.to === (coin ? ctx.main : ctx.token) && row.value === (coin ? ctx.units : 0n) && row.data === (coin ? '0x' : abi.transfer(ctx.main, ctx.units)) ? '' : 'return';
      case 'cancel':
        return pin.cancelRow && row.to === ctx.order && row.value === 0n && row.data === '0x' ? '' : 'cancel_row';
      case 'bump':
        return row.to === ctx.order && row.value === 0n && row.data === '0x' ? '' : 'bump';
      case 'take':
      case 'stop':
        return saleFault(row, w, ctx, pin);
      default:
        return 'ladder';
    }
  }
  function saleFault(row, w, ctx, pin) {
    const coin = ctx.kind === 'coin';
    if (row.to !== (coin ? pin.router : SWAP_PROXY)) return 'to';
    if (row.value !== (coin ? ctx.units : 0n)) return 'value';
    const env = readEnvelope(row.data, ctx.kind);
    if (!env) return 'format';
    if (!coin) {
      if (env.router !== pin.router) return 'router';
      if (env.token !== ctx.token) return 'token';
      if (env.amount !== ctx.units) return 'amount';
    }
    if (env.deadline !== BigInt(ctx.deadline)) return 'deadline';
    const cmds = env.commands.slice(2).match(/../g) || [];
    if (cmds.length !== env.inputs.length || cmds.some((c) => (parseInt(c, 16) & ALLOW_REVERT) !== 0)) return 'commands';
    const portions = cmds.map((c, i) => (parseInt(c, 16) === CMD.PAY_PORTION ? i : -1)).filter((i) => i >= 0);
    if (portions.length !== 1) return 'fee_address';
    if (inputAddress(env.inputs[portions[0]], 1) !== FEE_EVM) return 'fee_address';
    if (inputWord(env.inputs[portions[0]], 2) !== FEE_BIPS) return 'fee_bips';
    const last = parseInt(cmds[cmds.length - 1], 16);
    const lastIn = env.inputs[env.inputs.length - 1];
    const payee = last === CMD.SWEEP ? inputAddress(lastIn, 1) : last === CMD.UNWRAP_WETH ? inputAddress(lastIn, 0) : null;
    if (payee !== ctx.main) return 'owner';
    const min = last === CMD.SWEEP ? inputWord(lastIn, 2) : inputWord(lastIn, 1);
    if (row.min !== w.min || min !== w.min) return 'min_out';
    if (row.data !== w.data) return 'commands';
    return '';
  }

  function readBack(lib, raw, row, chainId) {
    let tx;
    try { tx = lib.Transaction.fromHex(raw); } catch (_) { return 'signed'; }
    const r = tx && tx.raw;
    if (!r || tx.type !== 'eip1559') return 'signed';
    if (r.chainId !== BigInt(chainId)) return 'chain';
    if (!Array.isArray(r.accessList) || r.accessList.length) return 'access_list';
    if (r.nonce !== BigInt(row.nonce) || String(r.to).toLowerCase() !== row.to || r.value !== row.value || String(r.data).toLowerCase() !== row.data
      || r.gasLimit !== row.gas || r.maxFeePerGas !== row.maxFee || r.maxPriorityFeePerGas !== row.priority) return 'signed';
    if (String(tx.sender).toLowerCase() !== row.from) return 'owner';
    return '';
  }
  function signRows(lib, keys, rows, chainId) {
    return rows.map((row) => {
      const key = keys.get(row.from);
      if (!key) throw refused('owner');
      const signed = E.signTx(lib, key, row.from, { kind: row.role, to: row.to, value: row.value, data: row.data, gas: row.gas, maxFee: row.maxFee, priority: row.priority }, { id: chainId }, row.nonce);
      const wrong = readBack(lib, signed.raw, row, chainId);
      if (wrong) throw refused(wrong);
      const out = { role: row.role, nonce: row.nonce, raw: signed.raw, hash: signed.hash };
      if (row.level !== undefined) out.level = row.level;
      if (row.floor !== undefined) out.floor = row.floor;
      if (row.tier !== undefined) out.tier = row.tier;
      return out;
    });
  }

  const SERVER_CODE = /^(xorder_[a-z_]{2,24}|pending|send_stale|send_rejected|send_unsure|no_gas|rate_limited|quote_stale)$/;
  async function ask(path, body) {
    await T.config();
    try {
      return await T.api(path, body ? { body } : undefined);
    } catch (err) {
      const said = err && err.detail && typeof err.detail.error === 'string' ? err.detail.error : '';
      if (SERVER_CODE.test(said)) {
        const extra = {};
        if (typeof err.detail.reason === 'string') extra.reason = err.detail.reason.slice(0, 40);
        throw fail(said, extra);
      }
      throw fail('state_unknown');
    }
  }
  const query = (fields) => Object.keys(fields).map((key) => key + '=' + encodeURIComponent(String(fields[key]))).join('&');
  async function stateOf(chain, address) {
    const body = await ask('xchain/state?' + query({ chain, evm: address }));
    const native = big(body.native);
    if (!Number.isSafeInteger(body.nonce) || body.nonce < 0 || !Number.isSafeInteger(body.mined) || body.mined < 0 || native === null) throw fail('state_unknown');
    return { nonce: body.nonce, mined: body.mined, native };
  }
  async function feesOf(chain, from, token, to, units) {
    const body = await ask('xchain/fees?' + query({ chain, evm: from, token, to, units: units > 0n ? units : 1n }));
    const baseFee = big(body.baseFee), priority = big(body.priority), native = big(body.native), held = big(body.held);
    if (baseFee === null || priority === null || native === null || held === null) throw fail('state_unknown');
    return { baseFee, priority: priority > 0n ? priority : 1n, native, held, gas: big(body.gas) };
  }
  async function sendRaw(chain, raw, from) {
    const body = await ask('xchain/send', { chain, raw, from });
    return typeof body.hash === 'string' ? body.hash : null;
  }
  function mainBusy(chain, main, m) {
    let text = null;
    try { text = localStorage.getItem('ck-evm-pending:' + chain + ':' + main); } catch (_) { return false; }
    if (!text) return false;
    try {
      const rec = JSON.parse(text);
      return !!rec && Number.isSafeInteger(rec.nonce) && rec.nonce >= m;
    } catch (_) {
      return false;
    }
  }
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const PUBLIC_RPC = Object.freeze({
    eth: 'https://ethereum-rpc.publicnode.com',
    base: 'https://mainnet.base.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    bsc: 'https://bsc-dataseed.bnbchain.org',
    polygon: 'https://polygon-bor-rpc.publicnode.com',
    optimism: 'https://mainnet.optimism.io',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    ink: 'https://rpc-gel.inkonchain.com',
    monad: 'https://rpc.monad.xyz',
    unichain: 'https://mainnet.unichain.org'
  });
  const RPC_MS = 10000;
  const SEL_BALANCE_OF = '0x70a08231';
  const hexBig = (value) => (typeof value === 'string' && /^0x[0-9a-fA-F]{1,64}$/.test(value) ? BigInt(value) : null);
  const hexCount = (value) => {
    const v = hexBig(value);
    return v !== null && v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : null;
  };
  async function rpcCall(chain, method, params) {
    const url = Object.prototype.hasOwnProperty.call(PUBLIC_RPC, chain) ? PUBLIC_RPC[chain] : null;
    if (!url) throw fail('state_unknown');
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), RPC_MS);
    let body;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: abort.signal, cache: 'no-store', credentials: 'omit' });
      body = await res.json();
    } catch (_) {
      throw fail('state_unknown');
    } finally {
      clearTimeout(timer);
    }
    if (body && typeof body === 'object' && body.error) throw fail('rpc_refused', { said: String(body.error.message || '').toLowerCase().slice(0, 200) });
    if (!body || typeof body !== 'object' || !Object.prototype.hasOwnProperty.call(body, 'result')) throw fail('state_unknown');
    return body.result;
  }
  async function nodeBalanceOf(chain, token, address) {
    const result = await rpcCall(chain, 'eth_call', [{ to: token, data: SEL_BALANCE_OF + addressWord(address) }, 'latest']);
    if (result === '0x') return 0n;
    const units = typeof result === 'string' ? hexBig(result.slice(0, 66)) : null;
    if (units === null) throw fail('state_unknown');
    return units;
  }
  const NODE = Object.freeze({
    async state(chain, address) {
      const nonce = hexCount(await rpcCall(chain, 'eth_getTransactionCount', [address, 'pending']));
      const mined = hexCount(await rpcCall(chain, 'eth_getTransactionCount', [address, 'latest']));
      const native = hexBig(await rpcCall(chain, 'eth_getBalance', [address, 'latest']));
      if (nonce === null || mined === null || native === null) throw fail('state_unknown');
      return { nonce, mined, native };
    },
    async fees(chain, from, token, to, units) {
      const coin = token === NATIVE;
      const block = await rpcCall(chain, 'eth_getBlockByNumber', ['latest', false]);
      const baseFee = block && typeof block === 'object' ? hexBig(block.baseFeePerGas || '0x0') : null;
      let priority = await rpcCall(chain, 'eth_maxPriorityFeePerGas', []).then(hexBig, () => null);
      if (priority === null && baseFee !== null) {
        const price = await rpcCall(chain, 'eth_gasPrice', []).then(hexBig, () => null);
        priority = price !== null && price > baseFee ? price - baseFee : null;
      }
      const native = hexBig(await rpcCall(chain, 'eth_getBalance', [from, 'latest']));
      const held = coin ? native : await nodeBalanceOf(chain, token, from);
      const amount = units > 0n ? units : 1n;
      const tx = coin ? { from, to, value: '0x' + amount.toString(16) } : { from, to: token, data: abi.transfer(to, amount) };
      const estimate = await rpcCall(chain, 'eth_estimateGas', [tx]).then(hexBig, () => null);
      if (baseFee === null || priority === null || native === null || held === null) throw fail('state_unknown');
      return { baseFee, priority: priority > 0n ? priority : 1n, native, held, gas: estimate !== null && estimate <= GAS_SALE_MAX ? estimate : null };
    },
    async send(chain, raw) {
      try {
        const hash = await rpcCall(chain, 'eth_sendRawTransaction', [raw]);
        return typeof hash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(hash) ? hash.toLowerCase() : null;
      } catch (err) {
        const said = err.said || '';
        if (/already known|known transaction/.test(said)) return null;
        if (err.code !== 'rpc_refused') throw fail('send_unsure');
        throw fail(/nonce too low/.test(said) ? 'send_stale' : /insufficient funds/.test(said) ? 'no_gas' : 'send_rejected');
      }
    }
  });
  const SERVER = Object.freeze({ state: stateOf, fees: feesOf, send: sendRaw });
  async function nodeHolding(chain, address, tokens) {
    const native = hexBig(await rpcCall(chain, 'eth_getBalance', [address, 'latest']));
    if (native === null) throw fail('state_unknown');
    const out = [];
    for (const token of tokens) {
      const units = await nodeBalanceOf(chain, token, address).catch(() => null);
      if (units !== null && units > 0n) out.push({ address: token, units });
    }
    return { native, tokens: out };
  }

  const SIGNED_CLOUD = 'ck_evm_op_';
  const SIGNED_HASH = /^[A-Za-z0-9_-]{16}$/;
  const SLOT_TEXT = /^(0|[1-9]\d?|1[01]\d|12[0-7])$/;
  const CLOUD_VALUE_MAX = 4096;
  const CLOUD_MS = 8000;
  function cloudStore() {
    try {
      const app = CK.tg && CK.tg.app;
      return app && app.CloudStorage && typeof app.isVersionAtLeast === 'function' && app.isVersionAtLeast('6.9') ? app.CloudStorage : null;
    } catch (_) {
      return null;
    }
  }
  const cloudCall = (start) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(fail('storage_timeout')), CLOUD_MS);
    try {
      start((err, value) => {
        clearTimeout(timer);
        if (err) reject(fail('storage_failed'));
        else resolve(value);
      });
    } catch (_) {
      clearTimeout(timer);
      reject(fail('storage_failed'));
    }
  });
  const walletHex = () => {
    const own = T && T.wallet ? T.wallet.address : null;
    return typeof own === 'string' && /^0:[0-9a-f]{64}$/.test(own) ? own.slice(2) : null;
  };
  const signedKey = (hex, chain) => SIGNED_CLOUD + hex + '_' + chain;
  async function signedRead(chain, hex) {
    const store = cloudStore();
    const id = hex || walletHex();
    if (!store || !id || !pinOf(chain)) throw fail('storage_failed');
    const text = await cloudCall((done) => store.getItem(signedKey(id, chain), done));
    if (!text) return {};
    let table;
    try { table = JSON.parse(text); } catch (_) { throw fail('storage_failed'); }
    if (!table || typeof table !== 'object' || Array.isArray(table)) throw fail('storage_failed');
    for (const n of Object.keys(table)) {
      const v = table[n];
      if (!SLOT_TEXT.test(n) || !Array.isArray(v) || v.length !== 2 || typeof v[0] !== 'string' || !SIGNED_HASH.test(v[0]) || !isAddress(v[1])) throw fail('storage_failed');
    }
    return table;
  }
  let signedWrites = Promise.resolve();
  function signedPut(chain, n, entry, keep) {
    const id = walletHex();
    const run = signedWrites.then(async () => {
      const table = await signedRead(chain, id);
      if (JSON.stringify(table[n] || null) === JSON.stringify(entry || null)) return;
      if (entry) table[n] = entry;
      else delete table[n];
      const spare = Object.keys(table).map(Number).filter((one) => one !== n && !(keep && keep.has(one))).sort((a, b) => a - b);
      let text = JSON.stringify(table);
      while (text.length > CLOUD_VALUE_MAX && spare.length) {
        delete table[spare.shift()];
        text = JSON.stringify(table);
      }
      if (text.length > CLOUD_VALUE_MAX) throw fail('xorder_no_slot', { reason: 'full' });
      await cloudCall((done) => cloudStore().setItem(signedKey(id, chain), text, done));
      if (JSON.stringify((await signedRead(chain, id))[n] || null) !== JSON.stringify(entry || null)) throw fail('storage_failed');
    });
    signedWrites = run.catch(() => null);
    return run;
  }
  async function orderHash(chain, n, want) {
    const text = ['evm', chain, n, want.token, want.units, want.out, want.stopOut || 0n, want.takeOut || 0n].map(String).join('|');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
    return btoa(String.fromCharCode(...digest.subarray(0, 12))).replace(/\+/g, '-').replace(/\//g, '_');
  }
  async function heldAsSigned(want, n) {
    const entry = (await signedRead(want.chain))[n];
    if (!entry || entry[1] !== want.token || entry[0] !== (await orderHash(want.chain, n, want))) throw refused('prices');
    return entry;
  }
  async function pricesKnown(order) {
    try {
      const o = order || {};
      if (!Number.isInteger(o.n) || o.n < 0 || o.n > 127) return false;
      await heldAsSigned(readWant(o, true), o.n);
      return true;
    } catch (_) {
      return false;
    }
  }

  const FUND_LOCAL = 'ck-evm-fund:';
  const fundKey = (chain, main, n) => FUND_LOCAL + chain + ':' + main + ':' + n;
  function fundRead(chain, main, n) {
    try {
      const rec = JSON.parse(localStorage.getItem(fundKey(chain, main, n)) || 'null');
      const maxFee = rec ? big(rec.maxFee) : null, priority = rec ? big(rec.priority) : null;
      if (!rec || !Number.isSafeInteger(rec.from) || !Number.isSafeInteger(rec.to) || rec.from < 0 || rec.to < rec.from || rec.to > rec.from + 1 || maxFee === null || priority === null) return null;
      return { from: rec.from, to: rec.to, maxFee, priority };
    } catch (_) {
      return null;
    }
  }
  function fundWrite(chain, main, n, rec) {
    try { localStorage.setItem(fundKey(chain, main, n), JSON.stringify({ from: rec.from, to: rec.to, maxFee: rec.maxFee.toString(), priority: rec.priority.toString() })); } catch (_) { }
  }
  function fundClear(chain, main, n) {
    try { localStorage.removeItem(fundKey(chain, main, n)); } catch (_) { }
  }

  const pair = (value) => {
    if (!Array.isArray(value) || value.length !== 2) return null;
    const maxFee = big(value[0]), priority = big(value[1]);
    return maxFee !== null && priority !== null ? { maxFee, priority } : null;
  };
  function readPlan(body, want, edit) {
    const bad = () => refused('plan');
    if (!body || typeof body !== 'object' || !body.plan || typeof body.plan !== 'object' || typeof body.sig !== 'string' || !body.sig || body.sig.length > 512) throw bad();
    if (body.feeEvm !== undefined && String(body.feeEvm).toLowerCase() !== FEE_EVM) throw fail('xorder_closed', { reason: 'fee_mismatch' });
    const route = body.route;
    if (!route || typeof route !== 'object' || Array.isArray(route)) throw bad();
    const levels = Array.isArray(body.levels) && body.levels.length === LEVELS ? body.levels.map(pair) : null;
    if (!levels || levels.some((one) => !one)) throw bad();
    const gasIn = body.gas && typeof body.gas === 'object' ? body.gas : {};
    const gas = {};
    for (const name of ['fundGas', 'fundToken', 'approve', 'sale', 'x', 'r', 'k']) gas[name] = gasIn[name] === undefined ? null : big(gasIn[name]);
    const plan = {
      raw: body.plan, sig: body.sig,
      route: { venue: route.venue, pair: route.pair, fee: route.fee, tickSpacing: route.tickSpacing, native: route.native, hooks: route.hooks, usdcTier: route.usdcTier },
      mainCode: body.mainCode, expected: big(body.expected), levels, gas,
      validUntil: body.validUntil, baseFee: big(body.baseFee), valueWei: big(body.valueWei)
    };
    Object.keys(plan.route).forEach((key) => { if (plan.route[key] === undefined) delete plan.route[key]; });
    if (edit) {
      plan.q = body.q;
      if (edit === 'change') plan.bump = pair(body.bump);
      if (typeof body.id !== 'string' || body.id !== want.id) throw bad();
    } else {
      const fund = body.fees && pair(body.fees.fund), approve = body.fees && body.fees.approve !== undefined ? pair(body.fees.approve) : null;
      Object.assign(plan, {
        k: body.k, m: body.m, serverHi: body.hw === null || body.hw === undefined ? -1 : body.hw,
        fees: { fund, approve }, l1Buffer: big(body.l1Buffer), G: big(body.G), mainNative: big(body.mainNative)
      });
      if (!Number.isSafeInteger(plan.serverHi)) throw bad();
    }
    return plan;
  }
  function contextOf(want, plan, extra) {
    return {
      chain: want.chain, kind: want.kind, token: want.token, units: want.units, out: want.out, stopOut: want.stopOut, takeOut: want.takeOut,
      route: plan.route, mainCode: plan.mainCode, expected: plan.expected, levels: plan.levels, gas: plan.gas, validUntil: plan.validUntil,
      deadline: plan.validUntil, baseFee: plan.baseFee, valueWei: plan.valueWei, k: plan.k, m: plan.m, fees: plan.fees, l1Buffer: plan.l1Buffer, G: plan.G,
      serverHi: plan.serverHi === undefined ? -1 : plan.serverHi, q: plan.q, bump: plan.bump, ...extra
    };
  }

  function readWant(input, needPrices) {
    const o = input || {};
    const pin = pinOf(o.chain);
    if (!pin) throw fail('xorder_closed', { reason: 'chain' });
    const token = typeof o.token === 'string' ? o.token.toLowerCase() : '';
    if (!isAddress(token)) throw fail('bad_intent');
    const units = typeof o.units === 'bigint' ? o.units : big(o.units);
    if (units === null || units <= 0n || units >= 1n << 128n) throw fail('bad_intent');
    const out = o.out === undefined ? 'usdc' : o.out;
    if (out !== 'usdc' && out !== 'coin') throw fail('bad_intent');
    const priceOf = (value) => (value === null || value === undefined || value === 0n ? null : typeof value === 'bigint' && value > 0n ? value : big(value));
    const stopOut = priceOf(o.stopOut), takeOut = priceOf(o.takeOut);
    if (needPrices && ((o.stopOut && stopOut === null) || (o.takeOut && takeOut === null) || (!stopOut && !takeOut))) throw fail('bad_intent');
    return { chain: o.chain, pin, kind: token === NATIVE ? 'coin' : 'token', token, units, out, stopOut, takeOut };
  }
  function openGate() {
    if (!FEE_EVM) throw fail('xorder_fee_unset', { reason: 'fee_unset' });
  }
  function rowOf(chain) {
    const pin = pinOf(chain);
    const row = E && typeof E.chainRows === 'function' ? E.chainRows().find((one) => one.key === chain) : null;
    if (!pin || !row || row.id !== pin.id || typeof row.gasCapWei !== 'bigint') throw fail('xorder_closed', { reason: 'chain' });
    return row;
  }
  async function mainAddress() {
    if (!E) throw fail('no_wallet');
    const main = await E.address();
    if (!main) throw fail('no_evm_address');
    return main;
  }
  async function marksOf(chain, main) {
    try {
      const body = await ask('xorders/slots?' + query({ chain, main }));
      return body.marks && typeof body.marks === 'object' && !Array.isArray(body.marks) ? body.marks : null;
    } catch (_) {
      return null;
    }
  }
  async function slotsOf(chain, main, fill) {
    const marks = await marksOf(chain, main);
    return CK.wallet.orderAddresses(chain, marks ? { marks, fill } : { fill });
  }
  async function slotRow(chain, main, n, options) {
    if (!Number.isInteger(n) || n < 0 || n > 127) throw fail('bad_intent');
    let row = (await slotsOf(chain, main)).find((one) => one.n === n);
    if (!row || !row.address) {
      await withKey(async () => null, options);
      row = (await slotsOf(chain, main, false)).find((one) => one.n === n);
    }
    if (!row || !row.address) throw fail('xorder_no_slot', { reason: 'unread' });
    return row;
  }

  async function place(input, options) {
    openGate();
    const want = readWant(input, true);
    const chainRow = rowOf(want.chain);
    const main = await mainAddress();
    let rows = await slotsOf(want.chain, main);
    const usable = (row) => !!row.address && !row.live;
    if (!rows.some(usable)) {
      await withKey(async () => null, options);
      rows = await slotsOf(want.chain, main, false);
    }
    const candidates = [...rows.filter((row) => usable(row) && row.hi === undefined), ...rows.filter((row) => usable(row) && row.hi !== undefined)].slice(0, SLOT_TRIES);
    if (!candidates.length) throw fail('xorder_no_slot', { reason: 'full' });
    let chosen = null;
    let slotRefused = null;
    for (const slot of candidates) {
      const planAt = Date.now();
      let body;
      try {
        body = await ask('xorders/plan', { chain: want.chain, token: want.token, units: want.units.toString(), out: want.out, stopOut: want.stopOut ? want.stopOut.toString() : null, takeOut: want.takeOut ? want.takeOut.toString() : null, main, slot: slot.n, order: slot.address });
      } catch (err) {
        if (err && err.code === 'xorder_no_slot') {
          slotRefused = err;
          continue;
        }
        throw err;
      }
      const plan = readPlan(body, want);
      const recordHi = Number.isSafeInteger(slot.hi) ? slot.hi : -1;
      if (Number.isSafeInteger(plan.k) && plan.k > recordHi && plan.k > plan.serverHi && (recordHi >= 0 || plan.serverHi >= 0 || plan.k === 0)) {
        chosen = { slot, plan, planAt, recordHi };
        break;
      }
    }
    if (!chosen) throw slotRefused || fail('xorder_no_slot', { reason: 'used' });
    const { slot, plan, planAt, recordHi } = chosen;
    const ctx = contextOf(want, plan, { main, order: slot.address, gasCapWei: chainRow.gasCapWei, recordHi });
    const first = prepare(ctx, nowSeconds()).audited;
    if (mainBusy(want.chain, main, plan.m)) throw fail('xorder_main_busy');
    const needs = (want.kind === 'coin' ? want.units : 0n) + first.G + plan.gas.fundGas * plan.fees.fund.maxFee + (want.kind === 'coin' ? 0n : plan.gas.fundToken * plan.fees.fund.maxFee);
    if (plan.mainNative === null || plan.mainNative < needs) throw fail('xorder_no_gas', { needs, have: plan.mainNative });
    const hash = await orderHash(want.chain, slot.n, want);
    const priorSigned = (await signedRead(want.chain))[slot.n] || null;
    const liveSlots = new Set(rows.filter((row) => row.live).map((row) => row.n));
    if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale');
    const lib = await E.bundle();
    const fundTo = want.kind === 'coin' ? plan.m : plan.m + 1;
    const done = await withKey(async (key, own, more) => {
      if (key.address !== main) throw refused('owner');
      const order = await more.order(slot.n);
      if (order.address !== slot.address) throw refused('order_address');
      const { rows: built, audited } = prepare(ctx, nowSeconds());
      const ticket = await more.orderRecord({ chain: want.chain, n: slot.n, hi: audited.hi, from: ctx.k, planAt, live: null });
      try {
        await signedPut(want.chain, slot.n, [hash, want.token], liveSlots);
        const signed = signRows(lib, new Map([[key.address, key.privateKey], [order.address, order.privateKey]]), built, PINS[want.chain].id);
        fundWrite(want.chain, main, slot.n, { from: plan.m, to: fundTo, maxFee: plan.fees.fund.maxFee, priority: plan.fees.fund.priority });
        return { ticket, signed };
      } catch (err) {
        await ticket.forget();
        await signedPut(want.chain, slot.n, priorSigned, liveSlots).catch(() => null);
        throw err;
      }
    }, options);
    try {
      await done.ticket.keep();
    } catch (err) {
      fundClear(want.chain, main, slot.n);
      await signedPut(want.chain, slot.n, priorSigned, liveSlots).catch(() => null);
      throw err;
    }
    let created;
    try {
      created = await ask('xorders/create', { chain: want.chain, plan: plan.raw, sig: plan.sig, main, order: slot.address, slot: slot.n, rows: done.signed });
    } catch (err) {
      if (err.code !== 'state_unknown') fundClear(want.chain, main, slot.n);
      throw err;
    }
    const orderId = typeof created.orderId === 'string' && ORDER_ID.test(created.orderId) ? created.orderId : null;
    if (!orderId) throw fail('state_unknown');
    await CK.wallet.orderLive(want.chain, slot.n, orderId).catch(() => CK.wallet.orderLive(want.chain, slot.n, orderId)).catch(() => null);
    return { orderId };
  }

  async function edit(kind, order, prices, options) {
    openGate();
    if (!order || typeof order.id !== 'string' || !ORDER_ID.test(order.id)) throw fail('bad_intent');
    if (!Number.isInteger(order.n) || order.n < 0 || order.n > 127) throw fail('bad_intent');
    const listed = readWant(order, true);
    const priorSigned = await heldAsSigned(listed, order.n);
    const p = prices || {};
    const want = kind === 'change'
      ? { ...readWant({ ...order, stopOut: p.stopOut === undefined ? null : p.stopOut, takeOut: p.takeOut === undefined ? null : p.takeOut }, true), id: order.id }
      : { ...listed, id: order.id };
    const hash = kind === 'change' ? await orderHash(want.chain, order.n, want) : null;
    const chainRow = rowOf(want.chain);
    const main = await mainAddress();
    const slot = await slotRow(want.chain, main, order.n, options);
    if (slot.live && slot.live !== order.id) throw fail('bad_intent', { reason: 'order' });
    if (!Number.isSafeInteger(slot.hi)) throw refused('nonce');
    const planAt = Date.now();
    const body = await ask('xorders/plan', { edit: kind, id: order.id, chain: want.chain, token: want.token, units: want.units.toString(), out: want.out, stopOut: want.stopOut ? want.stopOut.toString() : null, takeOut: want.takeOut ? want.takeOut.toString() : null, main, slot: slot.n, order: slot.address });
    const plan = readPlan(body, want, kind);
    const ctx = contextOf(want, plan, { edit: kind, main, order: slot.address, gasCapWei: chainRow.gasCapWei, recordHi: slot.hi });
    prepare(ctx, nowSeconds());
    if (Date.now() - planAt > PLAN_LIFE_MS) throw fail('quote_stale');
    const lib = await E.bundle();
    const putBack = () => (kind === 'change' ? signedPut(want.chain, slot.n, priorSigned).catch(() => null) : Promise.resolve());
    const done = await withKey(async (key, own, more) => {
      if (key.address !== main) throw refused('owner');
      const handle = await more.order(slot.n);
      if (handle.address !== slot.address) throw refused('order_address');
      const { rows: built, audited } = prepare(ctx, nowSeconds());
      const ticket = await more.orderRecord({ chain: want.chain, n: slot.n, hi: audited.hi, planAt });
      try {
        if (hash) await signedPut(want.chain, slot.n, [hash, want.token]);
        return { ticket, signed: signRows(lib, new Map([[handle.address, handle.privateKey]]), built, PINS[want.chain].id) };
      } catch (err) {
        await ticket.forget();
        await putBack();
        throw err;
      }
    }, options);
    try {
      await done.ticket.keep();
    } catch (err) {
      await putBack();
      throw err;
    }
    try {
      await ask('xorders/edit', { id: order.id, kind, chain: want.chain, plan: plan.raw, sig: plan.sig, rows: done.signed });
    } catch (err) {
      if (err.code !== 'state_unknown') await putBack();
      throw err;
    }
    return { orderId: order.id };
  }
  const change = (order, prices, options) => edit('change', order, prices || {}, options);
  const extend = (order, options) => edit('extend', order, null, options);

  function returnFee(fees, top) {
    let maxFee = fees.baseFee * 2n + fees.priority, priority = fees.priority;
    if (top) {
      const lift = (value) => (value * LEVEL_STEP + 99n) / 100n;
      if (lift(top.maxFee) > maxFee) maxFee = lift(top.maxFee);
      if (lift(top.priority) > priority) priority = lift(top.priority);
    }
    return { maxFee: maxFee < priority ? priority : maxFee, priority };
  }
  const tokenGas = (estimate) => {
    if (estimate === null || estimate === undefined) return GAS_TOKEN_RETURN;
    const gas = estimate + estimate / 5n;
    return gas < GAS_TRANSFER_MIN ? GAS_TRANSFER_MIN : gas > GAS_TOKEN_MAX ? GAS_TOKEN_MAX : gas;
  };
  const valueGas = (estimate) => (estimate === null || estimate === undefined || estimate <= GAS_TRANSFER_MIN ? GAS_TRANSFER_MIN : estimate + estimate / 5n > GAS_VALUE_MAX ? GAS_VALUE_MAX : estimate + estimate / 5n);
  const l1Margin = (pin, fee) => (pin.opStack ? fee : 0n);

  async function cancel(order, options) {
    if (!order || typeof order.id !== 'string' || !ORDER_ID.test(order.id)) throw fail('bad_intent');
    const pin = pinOf(order.chain);
    if (!pin) throw fail('bad_intent');
    const chainRow = rowOf(order.chain);
    const token = typeof order.token === 'string' ? order.token.toLowerCase() : '';
    if (!isAddress(token)) throw fail('bad_intent');
    const coin = token === NATIVE;
    const top = order.top ? pair(order.top) : null;
    const main = await mainAddress();
    const slot = await slotRow(order.chain, main, order.n, options);
    if (slot.live && slot.live !== order.id) throw fail('bad_intent', { reason: 'order' });
    const planAt = Date.now();
    const [state, fees, plainFees] = await Promise.all([
      stateOf(order.chain, slot.address),
      feesOf(order.chain, slot.address, token, main, 1n),
      feesOf(order.chain, main, NATIVE, slot.address, 1n)
    ]);
    const fee = returnFee(fees, top);
    const nonce = state.mined;
    const held = coin ? 0n : fees.held;
    const plainGas = valueGas(plainFees.gas);
    const gas = coin ? valueGas(fees.gas) : held > 0n ? tokenGas(fees.gas) : plainGas;
    const cost = gas * fee.maxFee;
    if (cost > chainRow.gasCapWei) throw refused('gas_cap');
    const rows = [];
    let mainState = null;
    const funding = fundRead(order.chain, main, slot.n);
    if (funding) {
      mainState = await stateOf(order.chain, main);
      if (mainState.mined > funding.to) fundClear(order.chain, main, slot.n);
      else {
        const undo = returnFee(fees, { maxFee: funding.maxFee, priority: funding.priority });
        for (let at = Math.max(mainState.mined, funding.from); at <= funding.to; at++) rows.push({ role: 'unfund', from: main, nonce: at, to: main, value: 0n, data: '0x', gas: plainGas, ...undo });
      }
    }
    const undoing = rows.length > 0;
    const coinBack = coin ? state.native - cost - l1Margin(pin, cost) : 0n;
    const back = coin && coinBack > 0n ? { role: 'return', from: slot.address, nonce, to: main, value: coinBack, data: '0x', gas, ...fee }
      : held > 0n ? { role: 'return', from: slot.address, nonce, to: token, value: 0n, data: abi.transfer(main, held), gas, ...fee }
        : { role: 'cancel', from: slot.address, nonce, to: slot.address, value: 0n, data: '0x', gas: plainGas, ...fee };
    if (coin && coinBack <= 0n && !undoing) throw fail('no_gas', { needs: cost, have: state.native });
    const short = coin || undoing ? 0n : back.gas * back.maxFee + l1Margin(pin, back.gas * back.maxFee) - state.native;
    if (short > 0n) {
      if (!mainState) mainState = await stateOf(order.chain, main);
      rows.push({ role: 'topup', from: main, nonce: mainState.nonce, to: slot.address, value: short, data: '0x', gas: plainGas, ...returnFee(fees, null) });
    }
    if (rows.some((row) => row.gas * row.maxFee > chainRow.gasCapWei)) throw refused('gas_cap');
    const fromMain = rows.reduce((sum, row) => sum + row.value + row.gas * row.maxFee, 0n);
    if (rows.length && mainState.native < fromMain) throw fail('xorder_no_gas', { needs: fromMain, have: mainState.native });
    rows.push(back);
    const lib = await E.bundle();
    const done = await withKey(async (key, own, more) => {
      if (key.address !== main) throw refused('owner');
      const handle = await more.order(slot.n);
      if (handle.address !== slot.address) throw refused('order_address');
      const ticket = await more.orderRecord({ chain: order.chain, n: slot.n, hi: nonce, planAt });
      try {
        return { ticket, signed: signRows(lib, new Map([[key.address, key.privateKey], [handle.address, handle.privateKey]]), rows, pin.id) };
      } catch (err) {
        await ticket.forget();
        throw err;
      }
    }, options);
    await done.ticket.keep();
    await ask('xorders/cancel', { id: order.id, chain: order.chain, main, order: slot.address, slot: slot.n, rows: done.signed });
    return { orderId: order.id };
  }

  async function waitMined(io, chain, address, nonce) {
    const end = Date.now() + MINED_WAIT_MS;
    for (;;) {
      const state = await io.state(chain, address).catch(() => null);
      if (state && state.mined > nonce) return state;
      if (Date.now() > end) throw fail('send_unsure');
      await sleep(MINED_POLL_MS);
    }
  }
  async function waitFunded(io, chain, address, needs) {
    const end = Date.now() + MINED_WAIT_MS;
    for (;;) {
      const state = await io.state(chain, address).catch(() => null);
      if (state && state.native >= needs) return;
      if (Date.now() > end) throw fail('send_unsure');
      await sleep(MINED_POLL_MS);
    }
  }

  async function sweep(slotIn, options) {
    const s = slotIn || {};
    const pin = pinOf(s.chain);
    if (!pin) throw fail('bad_intent');
    const chainRow = rowOf(s.chain);
    const main = await mainAddress();
    const slot = await slotRow(s.chain, main, s.n, options);
    const known = await signedRead(s.chain).catch(() => ({}));
    const token = known[slot.n] && known[slot.n][1] !== NATIVE ? known[slot.n][1] : null;
    const planAt = Date.now();
    const [state, fees, tokenFees] = await Promise.all([
      stateOf(s.chain, slot.address),
      feesOf(s.chain, slot.address, NATIVE, main, 1n),
      token ? feesOf(s.chain, slot.address, token, main, 1n) : null
    ]);
    if (state.nonce > state.mined) throw fail('pending');
    const hi = Number.isSafeInteger(slot.hi) ? slot.hi : -1;
    if (state.mined < hi) throw fail('bad_intent', { reason: 'live' });
    if (tokenFees && tokenFees.held > 0n) throw fail('bad_intent', { reason: 'tokens' });
    if (chainRow.valueGapMs) await sleep(chainRow.valueGapMs);
    const fee = returnFee(fees, null);
    const gas = valueGas(fees.gas);
    const cost = gas * fee.maxFee;
    if (cost > chainRow.gasCapWei) throw refused('gas_cap');
    const value = state.native - cost - l1Margin(pin, cost);
    if (value <= cost) throw fail('no_gas', { needs: cost * 2n, have: state.native });
    const row = { role: 'sweep', from: slot.address, nonce: state.mined, to: main, value, data: '0x', gas, ...fee };
    const lib = await E.bundle();
    const done = await withKey(async (key, own, more) => {
      if (key.address !== main) throw refused('owner');
      const handle = await more.order(slot.n);
      if (handle.address !== slot.address) throw refused('order_address');
      const ticket = await more.orderRecord({ chain: s.chain, n: slot.n, hi: row.nonce, planAt });
      try {
        return { ticket, signed: signRows(lib, new Map([[handle.address, handle.privateKey]]), [row], pin.id) };
      } catch (err) {
        await ticket.forget();
        throw err;
      }
    }, options);
    await done.ticket.keep();
    const hash = await sendRaw(s.chain, done.signed[0].raw, slot.address);
    if (slot.live) await CK.wallet.orderLive(s.chain, slot.n, null).catch(() => null);
    return { orderId: null, hash: hash || done.signed[0].hash, value };
  }

  async function returnAll(options) {
    if (!E) throw fail('no_wallet');
    const opts = options || {};
    const direct = opts.direct === true;
    if (!direct) await T.config();
    const lib = await E.bundle();
    const chains = E.chainRows().filter((row) => pinOf(row.key) && row.id === PINS[row.key].id);
    const hex = walletHex();
    const tables = {};
    await Promise.all(chains.map(async (row) => { tables[row.key] = await signedRead(row.key, hex).catch(() => ({})); }));
    const ownToken = (chain, n) => {
      const entry = tables[chain] && tables[chain][n];
      return entry && entry[1] !== NATIVE ? entry[1] : null;
    };
    const groups = await withKey(async (key, own, more) => {
      const found = await more.orderSlots();
      const main = key.address;
      const keys = new Map([[main, key.privateKey]]);
      const byAddress = new Map();
      found.slots.forEach((one) => {
        if (!byAddress.has(one.address)) byAddress.set(one.address, { n: one.n, chains: new Map() });
        byAddress.get(one.address).chains.set(one.chain, one);
      });
      const mains = new Map();
      const out = { heard: found.heard, main, groups: [], failed: [] };
      for (const [address, entry] of byAddress) {
        const handle = await more.order(entry.n);
        if (handle.address !== address) {
          out.failed.push({ chain: null, n: entry.n, address, code: 'order_address', hashes: [] });
          continue;
        }
        keys.set(address, handle.privateKey);
        const known = chains.map((row) => (ownToken(row.key, entry.n) ? row.key + ':' + ownToken(row.key, entry.n) : null)).filter(Boolean);
        const listed = direct ? null : await ask('xchain/balances?' + query(known.length ? { evm: address, known: known.join(',') } : { evm: address })).catch(() => null);
        for (const chainRow of chains) {
          const chain = chainRow.key, pin = PINS[chain];
          const mine = ownToken(chain, entry.n);
          const row = listed && Array.isArray(listed.chains) ? listed.chains.find((one) => one && one.chain === chain) : null;
          const native = row && !row.error ? big(row.native) : null;
          let io = SERVER, holding = null;
          if (native !== null) {
            const tokens = Array.isArray(row.tokens) ? row.tokens : [];
            holding = {
              native,
              tokens: tokens.filter((t) => t && typeof t.address === 'string' && isAddress(t.address.toLowerCase()) && t.flagged !== true && big(t.units) !== null)
                .map((t) => ({ address: t.address.toLowerCase(), units: big(t.units) }))
            };
          } else if (entry.chains.has(chain)) {
            io = NODE;
            try {
              holding = await nodeHolding(chain, address, [...new Set([mine, pin.usdc, pin.weth].filter(Boolean))]);
            } catch (err) {
              out.failed.push({ chain, n: entry.n, address, code: 'state_unknown', hashes: [] });
              continue;
            }
          } else continue;
          const seen = new Set();
          const tokens = [...holding.tokens.filter((t) => t.address === mine), ...holding.tokens.filter((t) => t.address !== mine)]
            .filter((t) => t.units > 0n && t.address !== NATIVE && !seen.has(t.address) && seen.add(t.address)).slice(0, RETURN_TOKENS_MAX);
          if (!tokens.length && !(holding.native > 0n)) continue;
          const live = entry.chains.has(chain) ? entry.chains.get(chain).live : null;
          try {
            const group = await returnGroup(lib, more, keys, chainRow, entry.n, address, main, tokens, io, mains).catch((err) => {
              if (io === SERVER && err.code === 'state_unknown') {
                io = NODE;
                return returnGroup(lib, more, keys, chainRow, entry.n, address, main, tokens, io, mains);
              }
              throw err;
            });
            if (group) out.groups.push({ ...group, io, live, gap: chainRow.valueGapMs || 0 });
          } catch (err) {
            out.failed.push({ chain, n: entry.n, address, code: err.code || 'state_unknown', hashes: [] });
          }
        }
      }
      return out;
    }, options);
    const returned = [], failed = groups.failed.slice();
    const ready = [];
    for (const group of groups.groups) {
      try {
        await group.ticket.keep();
        ready.push(group);
      } catch (err) {
        failed.push({ chain: group.chain, n: group.n, address: group.address, code: err.code || 'quote_stale', hashes: [] });
      }
    }
    for (const group of ready) {
      const hashes = [];
      try {
        if (group.topup) {
          hashes.push((await group.io.send(group.chain, group.topup.raw, groups.main)) || group.topup.hash);
          await waitFunded(group.io, group.chain, group.address, group.needs);
        }
        for (let i = 0; i < group.signed.length; i++) {
          const one = group.signed[i];
          if (i) await waitMined(group.io, group.chain, group.address, group.signed[i - 1].nonce);
          if (one.role === 'sweep' && group.gap) await sleep(group.gap);
          hashes.push((await group.io.send(group.chain, one.raw, group.address)) || one.hash);
        }
        returned.push({ chain: group.chain, n: group.n, address: group.address, hashes });
        if (group.live) await CK.wallet.orderLive(group.chain, group.n, null).catch(() => null);
      } catch (err) {
        failed.push({ chain: group.chain, n: group.n, address: group.address, code: err.code || 'send_unsure', hashes });
      }
    }
    return { orderId: null, heard: groups.heard, returned, failed };
  }
  async function returnGroup(lib, more, keys, chainRow, n, address, main, tokens, io, mains) {
    const chain = chainRow.key, pin = PINS[chain];
    const planAt = Date.now();
    const state = await io.state(chain, address);
    const coinFees = await io.fees(chain, address, NATIVE, main, 1n);
    const fee = returnFee(coinFees, null);
    const rows = [];
    let nonce = state.nonce;
    let cost = 0n;
    for (const token of tokens) {
      const read = await io.fees(chain, address, token.address, main, token.units);
      if (!(read.held > 0n)) continue;
      const gas = tokenGas(read.gas);
      if (gas * fee.maxFee > chainRow.gasCapWei) throw refused('gas_cap');
      rows.push({ role: 'return', from: address, nonce: nonce++, to: token.address, value: 0n, data: abi.transfer(main, read.held), gas, ...fee });
      cost += gas * fee.maxFee;
    }
    const needs = cost + l1Margin(pin, cost);
    let topup = null, mainAfter = null;
    if (state.native < needs) {
      const value = needs - state.native;
      const was = mains.get(chain) || (await io.state(chain, main));
      const topFees = await io.fees(chain, main, NATIVE, address, value);
      topup = { role: 'topup', from: main, nonce: was.nonce, to: address, value, data: '0x', gas: valueGas(topFees.gas), ...fee };
      const spend = value + topup.gas * topup.maxFee;
      if (topup.gas * topup.maxFee > chainRow.gasCapWei) throw refused('gas_cap');
      if (was.native < spend) throw fail('xorder_no_gas', { needs: spend, have: was.native });
      mainAfter = { nonce: was.nonce + 1, native: was.native - spend };
    } else {
      const sweepGas = valueGas(coinFees.gas);
      const sweepCost = sweepGas * fee.maxFee;
      const left = state.native - needs - sweepCost - l1Margin(pin, sweepCost);
      if (left > sweepCost && sweepCost <= chainRow.gasCapWei) rows.push({ role: 'sweep', from: address, nonce: nonce++, to: main, value: left, data: '0x', gas: sweepGas, ...fee });
    }
    if (!rows.length) return null;
    const ticket = await more.orderRecord({ chain, n, hi: nonce - 1, planAt });
    try {
      const signed = signRows(lib, keys, rows, pin.id);
      const top = topup ? signRows(lib, keys, [topup], pin.id)[0] : null;
      if (mainAfter) mains.set(chain, mainAfter);
      return { chain, n, address, ticket, signed, topup: top, needs };
    } catch (err) {
      await ticket.forget();
      throw err;
    }
  }

  CK.evmOrders = {
    place,
    cancel,
    change,
    extend,
    pricesKnown,
    sweep,
    returnAll,
    open: () => FEE_EVM !== '',
    auditEvmOrder,
    buildRows,
    saleCall,
    floorsOf,
    reserveOf,
    abi,
    pins: () => ({
      feeEvm: FEE_EVM,
      swapProxy: SWAP_PROXY,
      swapProxyCodeHash: SWAP_PROXY_CODE_HASH,
      permit2: PERMIT2,
      floorsPerMille: FLOORS_PER_MILLE.slice(),
      feeBips: FEE_BIPS,
      publicRpc: { ...PUBLIC_RPC },
      chains: Object.keys(PINS).map((key) => ({ key, ...PINS[key] }))
    })
  };
  Object.defineProperty(CK, 'evmOrders', { value: Object.freeze(CK.evmOrders), writable: false, configurable: false, enumerable: true });
})();
