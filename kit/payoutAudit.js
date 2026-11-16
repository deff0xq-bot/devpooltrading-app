(function() {
  "use strict";
  const CK = window.CK;
  const MAX_LINES = 255;
  const MIN_NANO = 50000000n;
  const BASE_RESERVE_NANO = 10000000n;
  const LINE_RESERVE_NANO = 2000000n;
  const SEND_MODE = 3;
  const OP_SIGNED_EXTERNAL = 1936287598;
  const OP_SEND_MSG = 247711853;
  const VALID_MIN_S = 20;
  const VALID_MAX_S = 600;
  const SIGNATURE_BITS = 512;
  const RAW = /^0:[0-9a-f]{64}$/;
  const ID = /^[0-9a-f]{12}$/;
  const NANO = /^[1-9]\d{0,18}$/;
  const LINE_CAP_NANO = 200000000000n;
  const BATCH_CAP_NANO = 1000000000000n;
  const reserveFor = (count) => BASE_RESERVE_NANO + LINE_RESERVE_NANO * BigInt(count);
  function largeOf(lines, total) {
    const big = lines.filter((line) => BigInt(line.amount) > LINE_CAP_NANO);
    const batch = BigInt(total) > BATCH_CAP_NANO;
    return big.length || batch ? { lines: big, batch } : null;
  }
  function largeConfirmed(large, plan, lines) {
    if (!large || typeof large !== "object" || large.id !== plan.id || String(large.total) !== plan.total || !Array.isArray(large.lines)) return false;
    const agreed = new Set(large.lines.map((line) => line && line.to + " " + String(line.amount)));
    return lines.every((line) => agreed.has(line.to + " " + line.amount.toString()));
  }
  function sameLines(listed, lines) {
    if (!Array.isArray(listed) || listed.length !== lines.length) return false;
    return lines.every((line, i) => {
      const one = listed[i];
      return !!one && typeof one === "object" && one.to === line.to && String(one.amount) === line.amount.toString();
    });
  }
  const commentOf = (id) => "DevpoolTrading ref " + id;
  function readPlan(plan, shown, own, nowS) {
    const no = (reason) => ({ reason });
    if (!plan || typeof plan !== "object" || !shown || typeof shown !== "object") return no("bad_plan");
    if (typeof plan.id !== "string" || !ID.test(plan.id) || plan.comment !== commentOf(plan.id)) return no("bad_plan");
    if (!Number.isInteger(plan.seqno) || plan.seqno < 0 || !Number.isInteger(plan.validUntil)) return no("bad_plan");
    if (plan.validUntil < nowS + VALID_MIN_S) return no("stale");
    if (plan.validUntil > nowS + VALID_MAX_S) return no("bad_plan");
    if (typeof own !== "string" || !RAW.test(own)) return no("bad_address");
    if (!Array.isArray(plan.lines) || !plan.lines.length || plan.lines.length > MAX_LINES) return no("bad_lines");
    const seen =   new Set();
    const lines = [];
    let total = 0n;
    for (const line of plan.lines) {
      if (!line || typeof line !== "object" || Object.keys(line).some((key) => key !== "to" && key !== "amount")) return no("bad_lines");
      if (typeof line.to !== "string" || !RAW.test(line.to) || line.to === own || seen.has(line.to)) return no("bad_address");
      if (typeof line.amount !== "string" || !NANO.test(line.amount)) return no("bad_amount");
      const amount = BigInt(line.amount);
      if (amount < MIN_NANO) return no("bad_amount");
      seen.add(line.to);
      total += amount;
      lines.push({ to: line.to, amount });
    }
    if (typeof plan.total !== "string" || !NANO.test(plan.total) || BigInt(plan.total) !== total) return no("total");
    if (String(shown.total) !== plan.total || shown.count !== lines.length) return no("shown");
    if (!sameLines(shown.lines, lines)) return no("shown");
    const large = largeOf(lines, total);
    if (large && !largeConfirmed(shown.large, plan, large.lines)) return no("large");
    return { reason: null, id: plan.id, lines, total, count: lines.length, comment: plan.comment, seqno: plan.seqno, validUntil: plan.validUntil, needs: total + reserveFor(lines.length) };
  }
  const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  function readMessage(lib, cell, commentHash) {
    const s = cell.beginParse();
    if (s.loadBit()) return null;
    s.loadBit();
    const bounce = s.loadBit();
    const bounced = s.loadBit();
    s.loadMaybeAddress();
    const dest = s.loadAddress();
    const value = s.loadCoins();
    const extra = s.loadMaybeRef();
    s.loadCoins();
    s.loadCoins();
    s.loadUintBig(64);
    s.loadUint(32);
    const init = s.loadBit();
    if (bounce || bounced || extra || init || dest.workChain !== 0) return null;
    let body;
    if (s.loadBit()) {
      body = s.loadRef();
      if (s.remainingBits || s.remainingRefs) return null;
    } else {
      body = lib.beginCell().storeSlice(s).endCell();
    }
    if (hex(body.hash()) !== commentHash) return null;
    return { to: dest.toRawString(), amount: value };
  }
  function auditTransfer(lib, transfer, plan, signed) {
    try {
      const s = transfer.beginParse();
      if (s.loadUint(32) !== OP_SIGNED_EXTERNAL) return "op";
      s.loadUint(32);
      if (s.loadUint(32) !== signed.validUntil || signed.validUntil > plan.validUntil) return "valid_until";
      if (s.loadUint(32) !== signed.seqno || signed.seqno !== plan.seqno) return "seqno";
      let list = s.loadMaybeRef();
      if (s.loadBit()) return "extended";
      if (s.remainingBits !== SIGNATURE_BITS || s.remainingRefs) return "shape";
      const commentHash = hex(lib.beginCell().storeUint(0, 32).storeStringTail(plan.comment).endCell().hash());
      const actions = [];
      while (list) {
        const a = list.beginParse();
        if (!a.remainingBits && !a.remainingRefs) break;
        if (actions.length >= MAX_LINES) return "count";
        const prev = a.loadRef();
        if (a.loadUint(32) !== OP_SEND_MSG) return "action";
        if (a.loadUint(8) !== SEND_MODE) return "mode";
        const message = readMessage(lib, a.loadRef(), commentHash);
        if (!message || a.remainingBits || a.remainingRefs) return "message";
        actions.unshift(message);
        list = prev;
      }
      if (actions.length !== plan.lines.length) return "count";
      let total = 0n;
      for (let i = 0; i < actions.length; i++) {
        if (actions[i].to !== plan.lines[i].to) return "address";
        if (actions[i].amount !== plan.lines[i].amount) return "amount";
        total += actions[i].amount;
      }
      return total === plan.total ? null : "total";
    } catch (_) {
      return "shape";
    }
  }
  CK.payoutAudit = Object.freeze({ readPlan, largeOf, auditTransfer, commentOf, reserveFor, MIN_NANO, MAX_LINES, LINE_CAP_NANO, BATCH_CAP_NANO });
})();
