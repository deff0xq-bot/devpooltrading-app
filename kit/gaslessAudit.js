(function () {
  'use strict';
  const CK = window.CK;

  const USDT = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
  const RELAYS = Object.freeze(['0:7ae5056c3fd9406f9bbbe7c7089cd4c40801d9075486cbedb7ce12df119eacf1']);
  const PROTOCOL = 'gasless';
  const JETTON_TRANSFER = 0x0f8a7ea5;
  const RELAYER_FEE = 0x878da6e3;
  const OP_SIGNED_INTERNAL = 0x73696e74;
  const OP_SEND_MSG = 0x0ec3c86d;
  const WALLET_ID = 2147483409;
  const SIGNATURE_BITS = 512;
  const SEND_MODE = 3;
  const ATTACH = 50000000n;
  const COMMISSION_ATTACH = 100000000n;
  const FORWARD_MAX = 1n;
  const COMMISSION_MAX = 500000n;
  const COMMISSION_BPS = 500n;
  const VALID_LEFT_S = 20;
  const VALID_MAX_S = 900;
  const UNITS = /^[1-9]\d{0,29}$/;
  const HEX = /^[0-9a-f]+$/i;
  const MESSAGE_FIELDS = new Set(['address', 'amount', 'payload', 'stateInit']);
  const ESTIMATE_FIELDS = new Set(['protocol_name', 'relay_address', 'commission', 'from', 'valid_until', 'messages']);

  const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const bytesOf = (text) => Uint8Array.from(text.match(/../g), (h) => parseInt(h, 16));
  const keyBytes = (lib, pk) => (lib.Buffer ? lib.Buffer.from(pk) : pk);
  function rawOf(lib, text) {
    if (typeof text !== 'string' || text.length > 80) return null;
    try {
      return lib.Address.parse(text).toRawString();
    } catch (_) {
      return null;
    }
  }
  function cellOf(lib, text) {
    if (typeof text !== 'string' || !text || text.length > 4096) return null;
    try {
      const base64 = HEX.test(text) && text.length % 2 === 0 ? btoa(String.fromCharCode(...bytesOf(text))) : text;
      const cell = lib.Cell.fromBase64(base64);
      return cell.isExotic ? null : cell;
    } catch (_) {
      return null;
    }
  }

  function relayOf(config) {
    if (!config || typeof config !== 'object' || typeof config.relay !== 'string' || !Array.isArray(config.jettons)) return null;
    if (!RELAYS.includes(config.relay) || !config.jettons.includes(USDT)) return null;
    return config.relay;
  }

  function requestMessage(lib, { jettonWallet, recipient, units, relay }) {
    const body = lib.beginCell().storeUint(JETTON_TRANSFER, 32).storeUint(0, 64).storeCoins(units)
      .storeAddress(lib.Address.parseRaw(recipient)).storeAddress(lib.Address.parseRaw(relay))
      .storeBit(0).storeCoins(FORWARD_MAX).storeBit(0).endCell();
    const message = lib.beginCell().storeUint(0, 1).storeBit(1).storeBit(1).storeBit(0).storeUint(0, 2)
      .storeAddress(lib.Address.parseRaw(jettonWallet)).storeCoins(ATTACH).storeBit(0).storeCoins(0).storeCoins(0)
      .storeUint(0, 64).storeUint(0, 32).storeBit(0).storeBit(1).storeRef(body).endCell();
    return hex(message.toBoc());
  }

  function readTransfer(lib, cell) {
    try {
      if (cell.refs.length) return null;
      const s = cell.beginParse();
      if (s.loadUint(32) !== JETTON_TRANSFER) return null;
      s.loadUintBig(64);
      const units = s.loadCoins();
      const dest = s.loadAddress();
      const response = s.loadAddress();
      if (!dest || !response || dest.workChain !== 0 || response.workChain !== 0) return null;
      if (s.loadBit()) return null;
      const forward = s.loadCoins();
      if (s.loadBit()) return null;
      let mark = false;
      if (s.remainingBits === 32 && s.preloadUint(32) === RELAYER_FEE) {
        s.loadUint(32);
        mark = true;
      }
      if (s.remainingBits || s.remainingRefs) return null;
      return { units, dest: dest.toRawString(), response: response.toRawString(), forward, mark };
    } catch (_) {
      return null;
    }
  }

  function audit(lib, estimate, expected) {
    const no = (reason) => ({ reason });
    try {
      const e = estimate;
      if (!e || typeof e !== 'object' || Array.isArray(e)) return no('shape');
      if (Object.keys(e).some((key) => !ESTIMATE_FIELDS.has(key))) return no('shape');
      if (e.protocol_name !== PROTOCOL) return no('protocol');
      const relay = rawOf(lib, e.relay_address);
      if (!relay || !RELAYS.includes(relay) || (expected.relay && relay !== expected.relay)) return no('relay');
      if (rawOf(lib, e.from) !== expected.owner) return no('from');
      const units = expected.units;
      if (typeof units !== 'bigint' || units <= 0n) return no('amount');
      if (expected.recipient === relay || expected.recipient === expected.owner || expected.recipient === expected.jettonWallet) return no('recipient');
      if (typeof e.commission !== 'string' || !UNITS.test(e.commission)) return no('commission');
      const commission = BigInt(e.commission);
      if (commission > COMMISSION_MAX || commission * 10000n > units * COMMISSION_BPS) return no('commission_high');
      if (!Number.isSafeInteger(e.valid_until) || e.valid_until < expected.nowS + VALID_LEFT_S || e.valid_until > expected.nowS + VALID_MAX_S) return no('valid_until');
      if (!Array.isArray(e.messages) || e.messages.length !== 2) return no('count');
      const read = [];
      for (const m of e.messages) {
        if (!m || typeof m !== 'object' || Object.keys(m).some((key) => !MESSAGE_FIELDS.has(key))) return no('shape');
        if (m.stateInit !== undefined && m.stateInit !== null && m.stateInit !== '') return no('state_init');
        if (rawOf(lib, m.address) !== expected.jettonWallet) return no('jetton_wallet');
        if (typeof m.amount !== 'string' || !UNITS.test(m.amount)) return no('attached');
        const body = cellOf(lib, m.payload);
        const j = body && readTransfer(lib, body);
        if (!j) return no('body');
        if (j.response !== expected.owner && j.response !== relay) return no('response');
        if (j.forward > FORWARD_MAX) return no('forward');
        read.push({ to: expected.jettonWallet, amount: BigInt(m.amount), body, j });
      }
      const transfer = read.filter((m) => m.j.dest === expected.recipient);
      const fee = read.filter((m) => m.j.dest === relay);
      if (transfer.length !== 1 || fee.length !== 1) return no('destination');
      if (transfer[0].j.units !== units) return no('amount');
      if (transfer[0].j.mark) return no('body');
      if (transfer[0].amount > ATTACH) return no('attached');
      if (fee[0].j.units !== commission) return no('commission');
      if (fee[0].amount > COMMISSION_ATTACH) return no('attached');
      return {
        reason: null,
        commission,
        total: units + commission,
        validUntil: e.valid_until,
        relay,
        attached: transfer[0].amount + fee[0].amount,
        messages: read.map((m) => ({ to: m.to, amount: m.amount, body: m.body }))
      };
    } catch (_) {
      return no('shape');
    }
  }

  function readAction(lib, a, want) {
    const m = lib.loadMessageRelaxed(a.loadRef().beginParse());
    if (m.info.type !== 'internal' || m.init) return 'message';
    const other = m.info.value.other;
    if (other && other.size) return 'currency';
    if (m.info.dest.toRawString() !== want.to) return 'to';
    if (m.info.value.coins !== want.amount) return 'value';
    if (m.info.bounce !== true) return 'bounce';
    if (hex(m.body.hash()) !== hex(want.body.hash())) return 'body';
    return null;
  }

  function auditSigned(lib, boc, expected) {
    try {
      const msg = lib.loadMessage(lib.Cell.fromBase64(boc).beginParse());
      if (msg.info.type !== 'external-in') return 'external';
      const pk = bytesOf(expected.publicKey);
      const contract = lib.WalletContractV5R1.create({ workChain: 0, publicKey: keyBytes(lib, pk) });
      if (contract.address.toRawString() !== expected.address || msg.info.dest.toRawString() !== expected.address) return 'dest';
      if (expected.init) {
        if (!msg.init || !msg.init.code || !msg.init.data || hex(msg.init.code.hash()) !== hex(contract.init.code.hash()) || hex(msg.init.data.hash()) !== hex(contract.init.data.hash())) return 'init';
        if ((msg.init.splitDepth !== undefined && msg.init.splitDepth !== null) || msg.init.special || (msg.init.libraries && msg.init.libraries.size)) return 'init';
      } else if (msg.init) return 'init';
      const s = msg.body.beginParse();
      if (s.loadUint(32) !== OP_SIGNED_INTERNAL) return 'op';
      if (s.loadUint(32) !== WALLET_ID) return 'wallet_id';
      const validUntil = s.loadUint(32);
      if (validUntil !== expected.validUntil) return 'valid_until';
      const seqno = s.loadUint(32);
      if (seqno !== expected.seqno) return 'seqno';
      const list = s.loadMaybeRef();
      if (s.loadBit()) return 'extended';
      if (s.remainingBits !== SIGNATURE_BITS || s.remainingRefs) return 'shape';
      const signature = s.loadBuffer(64);
      const signed = lib.beginCell().storeUint(OP_SIGNED_INTERNAL, 32).storeUint(WALLET_ID, 32).storeUint(validUntil, 32).storeUint(seqno, 32).storeMaybeRef(list).storeBit(0).endCell();
      if (!lib.signVerify(signed.hash(), signature, keyBytes(lib, pk))) return 'signature';
      const actions = [];
      let cell = list;
      while (cell) {
        const a = cell.beginParse();
        if (!a.remainingBits && !a.remainingRefs) break;
        if (actions.length >= expected.messages.length) return 'count';
        const prev = a.loadRef();
        if (a.loadUint(32) !== OP_SEND_MSG) return 'action';
        actions.unshift({ a, mode: a.loadUint(8) });
        cell = prev;
      }
      if (actions.length !== expected.messages.length) return 'count';
      for (let i = 0; i < actions.length; i++) {
        if (actions[i].mode !== SEND_MODE) return 'mode';
        const wrong = readAction(lib, actions[i].a, expected.messages[i]);
        if (wrong) return wrong;
        if (actions[i].a.remainingBits || actions[i].a.remainingRefs) return 'shape';
      }
      return null;
    } catch (_) {
      return 'shape';
    }
  }

  CK.gaslessAudit = {
    USDT, RELAYS, PROTOCOL, ATTACH, COMMISSION_ATTACH, COMMISSION_MAX, COMMISSION_BPS, VALID_LEFT_S, VALID_MAX_S, WALLET_ID,
    relayOf, requestMessage, audit, auditSigned
  };
  Object.defineProperty(CK, 'gaslessAudit', { value: Object.freeze(CK.gaslessAudit), writable: false, configurable: false, enumerable: true });
})();
