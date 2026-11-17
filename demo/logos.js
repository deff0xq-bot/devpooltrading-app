CK.COIN_LOGOS = {
  btc: 'kit/logos/btc.svg',
  eth: 'kit/logos/eth.svg',
  ton: 'kit/logos/ton.svg',
  sol: 'kit/logos/sol.svg',
  bnb: 'kit/logos/bnb.svg',
  xrp: 'kit/logos/xrp.svg',
  doge: 'kit/logos/doge.png',
  not: 'kit/logos/not.svg',
  usdt: 'kit/logos/usdt.svg',
  usdc: 'kit/logos/usdc.svg',
  pol: 'kit/logos/pol.svg',
  trx: 'kit/logos/trx.svg'
};
if (CK.logos) Object.values(CK.COIN_LOGOS).forEach((u) => CK.logos.hold(u));
