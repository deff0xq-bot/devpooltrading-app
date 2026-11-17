(function () {
  'use strict';
  const CK = window.CK;
  const had = Object.getOwnPropertyDescriptor(CK, 'p2pAudit');
  if (had && !had.configurable) return;
  const USDT = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const ID = /^[0-9a-f]{16}$/;
  const UNITS = /^[1-9]\d{0,38}$/;
  const RAW = /^0:[0-9a-f]{64}$/;
  const GAS_INCOMING = 5000000n;
  const GAS_GRAM_PAYOUT = 10000000n;
  const GAS_JETTON_PAYOUT = 70000000n;
  const JETTON_SEND = 60000000n;
  const SEND_RESERVE = 5000000n;
  const COINS = Object.freeze({
    gram: Object.freeze({ symbol: 'GRAM', decimals: 9, master: null }),
    [USDT]: Object.freeze({ symbol: 'USDT', decimals: 6, master: USDT })
  });
  const pins = Object.freeze({ network: 'ton', escrow: '0:d60b0c505ffe01fb105b57a742ce4b442649c0a57ee68918771b0db2464b3299', coins: COINS, feeBps: CK.feeConfig.bps });

  const memoOf = (id) => `p2p:${id}`;
  const gasOf = (coin) => GAS_INCOMING + 2n * (coin === 'gram' ? GAS_GRAM_PAYOUT : GAS_JETTON_PAYOUT);
  const POOL_ORDERS = 5;
  const poolGasOf = (coin) => GAS_INCOMING + BigInt(1 + 2 * POOL_ORDERS) * (coin === 'gram' ? GAS_GRAM_PAYOUT : GAS_JETTON_PAYOUT);
  const PREFIX = 'Devpool P2P';
  const dealText = (kind, { id, token }, to, units, until) => [PREFIX, `${kind} deal ${id}`, `to ${to}`, `${units} units of ${token}`, `until ${until}`, 'network ton'].join('\n');
  const DEAL_TEXT = /^Devpool P2P\nrelease deal [0-9a-f]{16}\nto 0:[0-9a-f]{64}\n[1-9]\d{0,38} units of (?:gram|0:[0-9a-f]{64})\nuntil \d{10}\nnetwork ton$/;
  const textOk = (text) => typeof text === 'string' && DEAL_TEXT.test(text);

  function auditDeposit(plan, escrowAddress = pins.escrow) {
    if (!escrowAddress) return 'no_escrow';
    if (!plan || typeof plan !== 'object') return 'plan';
    if (plan.escrow !== escrowAddress) return 'escrow';
    if (!Object.prototype.hasOwnProperty.call(COINS, plan.coin)) return 'coin';
    if (typeof plan.id !== 'string' || !ID.test(plan.id) || plan.memo !== memoOf(plan.id)) return 'memo';
    if (typeof plan.units !== 'string' || !UNITS.test(plan.units) || typeof plan.fee !== 'string' || !/^\d{1,39}$/.test(plan.fee)) return 'amount';
    if (BigInt(plan.fee) !== (BigInt(plan.units) * BigInt(pins.feeBps)) / 10000n) return 'fee';
    if (plan.gas !== (plan.pool === true ? poolGasOf(plan.coin) : gasOf(plan.coin)).toString()) return 'gas';
    if (typeof plan.wallet !== 'string' || !RAW.test(plan.wallet) || plan.wallet === escrowAddress) return 'wallet';
    return null;
  }

  function intentOf(lib, plan, own, escrowAddress = pins.escrow) {
    const reason = auditDeposit(plan, escrowAddress) || (plan.wallet !== own ? 'wallet' : null);
    if (reason) throw Object.assign(new Error('p2p_refused'), { code: 'p2p_refused', reason });
    const total = BigInt(plan.units) + BigInt(plan.fee);
    const gas = BigInt(plan.gas);
    if (plan.coin === 'gram') return { kind: 'transfer', to: escrowAddress, amount: total + gas, bounce: false, comment: plan.memo, needs: total + gas + SEND_RESERVE };
    const master = COINS[plan.coin].master;
    return { kind: 'p2pJetton', to: CK.swapAudit.jettonWalletOf(lib, master, own), amount: gas + JETTON_SEND, bounce: true, units: total, recipient: escrowAddress, owner: own, forward: gas, memo: plan.memo, needs: gas + JETTON_SEND + SEND_RESERVE };
  }

  Object.defineProperty(CK, 'p2pAudit', { value: Object.freeze({ pins, PREFIX, memoOf, gasOf, poolGasOf, dealText, textOk, auditDeposit, intentOf }), writable: false, configurable: false, enumerable: true });
})();
