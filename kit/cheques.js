(function () {
  'use strict';
  const CK = window.CK;
  const T = CK.ton;

  const CLOUD_PREFIX = 'ck_chq_';
  const CLOUD_CHUNK = 50;
  const CLOUD_MS = 8000;
  const POLL_MS = 5000;
  const WAIT_MS = 180000;
  const STATE_READS_PER_OPEN = 10;
  const FINAL = new Set(['claimed', 'returned']);
  const NONCE = /^[0-9a-f]{16}$/;
  const RAW = /^0:[0-9a-f]{64}$/;
  const STATES = new Set(['pending', 'open', 'short', 'expired', 'claimed', 'returned', 'unknown']);
  const A = () => CK.chequeAudit;

  function failure(code, extra) {
    const err = new Error(code);
    err.code = code;
    return extra ? Object.assign(err, extra) : err;
  }
  async function call(path, body) {
    await T.config();
    try {
      return await T.api(path, body ? { body } : undefined);
    } catch (err) {
      const code = (err && err.detail && typeof err.detail.error === 'string' && err.detail.error) || 'network';
      throw failure(code, { detail: err && err.detail ? err.detail : null });
    }
  }

  function cleanState(s) {
    if (!s || typeof s !== 'object' || !STATES.has(s.name)) return { name: 'unknown', base: null, seqno: null, status: null, gram: null, jetton: null, to: null, hash: null, sources: 0, at: Date.now() };
    const num = (v) => (typeof v === 'string' && /^\d{1,40}$/.test(v) ? v : null);
    return {
      name: s.name,
      base: STATES.has(s.base) ? s.base : null,
      seqno: Number.isInteger(s.seqno) && s.seqno >= 0 ? s.seqno : null,
      status: s.status === 'uninit' || s.status === 'active' || s.status === 'nonexist' || s.status === 'frozen' ? s.status : null,
      gram: num(s.gram),
      jetton: num(s.jetton),
      to: typeof s.to === 'string' && RAW.test(s.to) ? s.to : null,
      hash: typeof s.hash === 'string' && /^[0-9a-f]{64}$/i.test(s.hash) ? s.hash.toLowerCase() : null,
      sources: s.sources === 1 || s.sources === 2 ? s.sources : 0,
      at: Number.isFinite(s.at) ? s.at : Date.now(),
      master: typeof s.master === 'string' && RAW.test(s.master) ? s.master : null
    };
  }
  const short = (v, n) => (typeof v === 'string' ? Array.from(v).slice(0, n).join('') : null);
  function cleanRecord(r) {
    if (!r || typeof r !== 'object' || typeof r.address !== 'string' || !RAW.test(r.address)) return null;
    if (r.asset !== 'gram' && r.asset !== 'usdt' && r.asset !== 'jetton') return null;
    if (typeof r.units !== 'string' || !/^\d{1,40}$/.test(r.units)) return null;
    const j = r.jetton && typeof r.jetton === 'object' ? r.jetton : null;
    const jetton = r.asset === 'jetton' && j && typeof j.master === 'string' && RAW.test(j.master) && Number.isInteger(j.decimals) && j.decimals >= 0 && j.decimals <= 18
      ? { master: j.master, symbol: (short(j.symbol, 16) || '?').replace(/[<>&"]/g, ''), decimals: j.decimals, wallet: typeof j.wallet === 'string' && RAW.test(j.wallet) ? j.wallet : null }
      : null;
    if (r.asset === 'jetton' && !jetton) return null;
    const mu = r.multi && typeof r.multi === 'object' ? r.multi : null;
    const count = (v) => (Number.isInteger(v) && v >= 0 && v <= A().MULTI_MAX ? v : 0);
    const multi = mu && Number.isInteger(mu.n) && mu.n >= A().MULTI_MIN && mu.n <= A().MULTI_MAX ? { n: mu.n, claimed: count(mu.claimed), returned: count(mu.returned), left: count(mu.left) } : null;
    const slots = multi && Array.isArray(r.slots) ? r.slots.filter((one) => one && Number.isInteger(one.i) && one.i >= 0 && one.i < multi.n && typeof one.address === 'string' && RAW.test(one.address)).map((one) => ({
      i: one.i, address: one.address, state: cleanState(one.state),
      claimBy: one.claimBy && typeof one.claimBy === 'object' ? { name: short(one.claimBy.name, 64) || '', username: short(one.claimBy.username, 32) } : null
    })) : null;
    const from = r.from && typeof r.from === 'object' ? { name: short(r.from.name, 64) || '', username: short(r.from.username, 32) } : null;
    const claimBy = r.claimBy && typeof r.claimBy === 'object' ? { name: short(r.claimBy.name, 64) || '', username: short(r.claimBy.username, 32) } : null;
    return {
      address: r.address,
      asset: r.asset,
      units: r.units,
      gas: typeof r.gas === 'string' && /^\d{1,30}$/.test(r.gas) ? r.gas : null,
      kind: r.kind === 'gift' ? 'gift' : 'cheque',
      note: short(r.note, A().NOTE_MAX),
      expiresAt: Number.isInteger(r.expiresAt) ? r.expiresAt : null,
      createdAt: Number.isInteger(r.createdAt) ? r.createdAt : null,
      from,
      state: cleanState(r.state),
      nonce: typeof r.nonce === 'string' && NONCE.test(r.nonce) ? r.nonce : null,
      wallet: typeof r.wallet === 'string' && RAW.test(r.wallet) ? r.wallet : null,
      hasRefund: r.hasRefund === true,
      claimBy,
      jetton,
      multi,
      slots
    };
  }

  const lookup = (lid) => call('cheques/lookup', { lid }).then((body) => ({ record: cleanRecord(body.record), mine: body.mine === true, multi: body.multi === true, held: body.held === true }));
  const SALT = /^[0-9a-f]{64}$/;
  function slot(lid) {
    return call('cheques/slot', { lid }).then((body) => {
      const one = body && body.slot;
      if (!one || !Number.isInteger(one.i) || typeof one.address !== 'string' || !RAW.test(one.address) || typeof one.salt !== 'string' || !SALT.test(one.salt)) throw failure('bad_answer');
      return { slot: { i: one.i, address: one.address, salt: one.salt }, state: cleanState(body.state) };
    });
  }
  const state = (address) => call('cheques/state', { address }).then((body) => cleanState(body.state));
  const mine = () => call('cheques/mine').then((body) => (Array.isArray(body.records) ? body.records.map(cleanRecord).filter(Boolean) : []));
  const relay = (address, boc, pk) => call('cheques/claim', typeof pk === 'string' && /^[0-9a-f]{64}$/.test(pk) ? { address, boc, pk } : { address, boc }).then((body) => ({ hash: typeof body.hash === 'string' ? body.hash : '' }));
  const returnStored = (address) => call('cheques/return', { address }).then((body) => ({ hash: typeof body.hash === 'string' ? body.hash : '' }));

  const cloudStore = () => {
    const app = CK.tg.app;
    try { return app && app.isVersionAtLeast && app.isVersionAtLeast('6.9') ? app.CloudStorage : null; } catch (_) { return null; }
  };
  function cloudCall(start) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(failure('storage_timeout')), CLOUD_MS);
      try {
        start((err, value) => {
          clearTimeout(timer);
          if (err) reject(failure('storage_failed'));
          else resolve(value);
        });
      } catch (_) {
        clearTimeout(timer);
        reject(failure('storage_failed'));
      }
    });
  }
  function readItem(key, text) {
    const nonce = key.slice(CLOUD_PREFIX.length);
    const parts = typeof text === 'string' ? text.split('|') : [];
    if (!NONCE.test(nonce) || parts.length < 3 || parts.length > 5 || !RAW.test(parts[0]) || !RAW.test(parts[1]) || !/^\d{1,12}$/.test(parts[2])) return null;
    const n = parts[3] ? Number(parts[3]) : 1;
    if (!Number.isInteger(n) || n < 1 || n > A().MULTI_MAX || (parts[4] && !RAW.test(parts[4]))) return null;
    return { nonce, address: parts[0], wallet: parts[1], createdAt: Number(parts[2]), n, master: parts[4] || null };
  }
  const cloud = {
    async list() {
      const store = cloudStore();
      if (!store || typeof store.getKeys !== 'function' || typeof store.getItems !== 'function') return [];
      const keys = (await cloudCall((done) => store.getKeys(done))).filter((key) => typeof key === 'string' && key.startsWith(CLOUD_PREFIX));
      const out = [];
      for (let i = 0; i < keys.length; i += CLOUD_CHUNK) {
        const part = keys.slice(i, i + CLOUD_CHUNK);
        const values = await cloudCall((done) => store.getItems(part, done));
        part.forEach((key) => {
          const item = readItem(key, values && values[key]);
          if (item) out.push(item);
        });
      }
      return out;
    },
    async put(nonce, address, wallet, createdAt, n, master) {
      const store = cloudStore();
      if (!store || !NONCE.test(nonce) || !RAW.test(address) || !RAW.test(wallet)) return false;
      const many = Number.isInteger(n) && n > 1 ? n : 1;
      const tail = master && RAW.test(master) ? `|${many}|${master}` : many > 1 ? `|${many}` : '';
      await cloudCall((done) => store.setItem(CLOUD_PREFIX + nonce, `${address}|${wallet}|${createdAt}${tail}`, done));
      return true;
    },
    async remove(nonces) {
      const store = cloudStore();
      const keys = nonces.filter((n) => NONCE.test(n)).map((n) => CLOUD_PREFIX + n);
      if (!store || !keys.length) return 0;
      for (let i = 0; i < keys.length; i += CLOUD_CHUNK) {
        const part = keys.slice(i, i + CLOUD_CHUNK);
        if (typeof store.removeItems === 'function') await cloudCall((done) => store.removeItems(part, done));
        else for (const key of part) await cloudCall((done) => store.removeItem(key, done));
      }
      return keys.length;
    },
    async prune(items, finalByAddress) {
      const finals = items.filter((it) => finalByAddress.has(it.address));
      const gone = finals.map((it) => it.nonce);
      return gone.length ? cloud.remove(gone) : 0;
    }
  };
  const roomLeft = (items) => A().CLOUD_MAX - items.length;

  async function make(intent, options, onStep) {
    const step = (name) => { try { if (onStep) onStep(name); } catch (_) { } };
    let items = [];
    try { items = await cloud.list(); } catch (_) { }
    if (roomLeft(items) <= 0) throw failure('too_many_open');
    const created = await CK.wallet.cheque.create(intent, options);
    step('signed');
    const createdAt = Math.floor(Date.now() / 1000);
    const master = created.jetton ? created.jetton.master : null;
    try { await cloud.put(created.nonce, created.address, created.wallet, createdAt, created.count, master); } catch (_) { }
    const common = {
      asset: created.asset, units: created.units, gas: created.gas, nonce: created.nonce, lid: created.lid, kind: created.kind, note: created.note, expiresAt: created.expiresAt,
      wallet: created.wallet, fundingHash: created.funding.hash || null, lang: CK.i18n.lang,
      ...(created.jetton ? { jetton: { master, decimals: created.jetton.decimals, ...(created.count > 1 ? {} : { wallet: created.jetton.wallet }) } } : {})
    };
    let saved;
    try {
      saved = await call('cheques', created.count > 1
        ? { ...common, count: created.count, slots: created.slots.map((one) => ({ address: one.address, pk: one.publicKey, salt: one.salt, refundBoc: one.refundBoc, ...(one.jettonWallet ? { jettonWallet: one.jettonWallet } : {}) })) }
        : { ...common, address: created.address, pk: created.publicKey, refundBoc: created.refundBoc });
    } catch (err) {
      CK.wallet.cheque.drop(created);
      cloud.remove([created.nonce]).catch(() => null);
      throw failure('not_saved', { reason: err.code || 'network' });
    }
    step('saved');
    let sent, unsure = false;
    try {
      sent = await CK.wallet.cheque.send(created);
    } catch (err) {
      if (err.code !== 'send_unsure') {
        cloud.remove([created.nonce]).catch(() => null);
        throw failure('not_sent', { reason: err.code || 'network' });
      }
      unsure = true;
      sent = { hash: created.funding.hash };
    }
    step('sent');
    const ticket = {
      address: created.address, link: created.link, asset: created.asset, units: created.units, gas: created.gas, kind: created.kind,
      note: created.note, expiresAt: created.expiresAt, nonce: created.nonce, wallet: created.wallet, hash: sent.hash || created.funding.hash, unsure,
      count: created.count || 1, jetton: created.jetton || null
    };
    return { ticket, record: cleanRecord(saved.record) };
  }

  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function waitOpen(address, o) {
    const opts = o || {};
    const until = Date.now() + (opts.ms || WAIT_MS);
    let last = null;
    for (;;) {
      if (opts.stop && opts.stop()) return last;
      try {
        last = await state(address);
        if (opts.onState) opts.onState(last);
        if (last.name !== 'pending' && last.name !== 'unknown') return last;
      } catch (_) { }
      if (Date.now() > until) return last;
      await pause(opts.every || POLL_MS);
    }
  }

  const CARD_KEEP_MS = 45 * 1000;
  const CARD_MARGIN_MS = 20 * 1000;
  const cards = new Map();
  function cardOf(ticket, plain = false) {
    const held = cards.get(ticket.address);
    if (!plain && held && Date.now() < held.until) return held.id;
    const entry = { until: Date.now() + CARD_KEEP_MS, id: null };
    entry.id = call('cheques/card', plain ? { address: ticket.address, link: ticket.link, plain: true } : { address: ticket.address, link: ticket.link }).then((body) => {
      if (Number.isSafeInteger(body.expiresAt) && body.expiresAt > 0) entry.until = body.expiresAt * 1000 - CARD_MARGIN_MS;
      return typeof body.preparedId === 'string' && body.preparedId ? body.preparedId : null;
    });
    const drop = () => { if (cards.get(ticket.address) === entry) cards.delete(ticket.address); };
    entry.id.then((id) => { if (!id) drop(); }, drop);
    cards.set(ticket.address, entry);
    return entry.id;
  }
  function warm(ticket) {
    if (ticket && ticket.address && ticket.link && CK.tg.canShareMessage && CK.tg.canShareMessage()) cardOf(ticket).catch(() => null);
  }
  async function pick(preparedId) {
    if (typeof CK.tg.shareMessageResult === 'function') return CK.tg.shareMessageResult(preparedId);
    return { sent: await CK.tg.shareMessage(preparedId), error: null };
  }

  async function share(ticket, texts) {
    if (CK.tg.canShareMessage && CK.tg.canShareMessage()) {
      try {
        let preparedId = await cardOf(ticket);
        cards.delete(ticket.address);
        if (preparedId) {
          let out = await pick(preparedId);
          if (!out.sent && out.error && out.error !== 'USER_DECLINED') {
            preparedId = await cardOf(ticket, true);
            cards.delete(ticket.address);
            out = preparedId ? await pick(preparedId) : out;
          }
          if (out.sent || !out.error || out.error === 'USER_DECLINED') {
            warm(ticket);
            return 'card';
          }
        }
      } catch (err) {
        console.warn('cheque card:', err && err.code);
      }
    }
    const text = texts && typeof texts.text === 'string' ? texts.text : '';
    T.openLink(`https://t.me/share/url?url=${encodeURIComponent(ticket.link)}&text=${encodeURIComponent(text)}`);
    return 'link';
  }

  const cloudStates = new Map();
  const VOID_AFTER_MS = 24 * 60 * 60 * 1000;
  const neverFunded = (it, s) => s.name === 'pending' && s.sources === 2 && s.gram === '0' && (s.jetton === null || s.jetton === '0')
    && Number.isFinite(it.createdAt) && Date.now() - it.createdAt * 1000 > VOID_AFTER_MS;
  async function merged() {
    const records = await mine();
    let items = [];
    try { items = await cloud.list(); } catch (_) { }
    const known = new Set(records.map((r) => r.address));
    const orphans = items.filter((it) => !known.has(it.address));
    let reads = 0;
    for (const it of orphans) {
      if (cloudStates.has(it.address) || reads >= STATE_READS_PER_OPEN) continue;
      reads += 1;
      try { cloudStates.set(it.address, await state(it.address)); } catch (_) { }
    }
    const finalByAddress = new Set(records.filter((r) => FINAL.has(r.state.name) && r.state.sources === 2).map((r) => r.address));
    orphans.forEach((it) => {
      const s = cloudStates.get(it.address);
      if (s && ((FINAL.has(s.name) && s.sources === 2) || neverFunded(it, s))) finalByAddress.add(it.address);
    });
    if (finalByAddress.size) cloud.prune(items, finalByAddress).catch(() => null);
    const inCloud = new Set(items.map((it) => it.address));
    let room = A().CLOUD_MAX - items.length;
    records.forEach((r) => {
      if (room <= 0 || inCloud.has(r.address) || !r.nonce || !r.wallet || FINAL.has(r.state.name)) return;
      room -= 1;
      cloud.put(r.nonce, r.address, r.wallet, r.createdAt || Math.floor(Date.now() / 1000), r.multi ? r.multi.n : 1, r.jetton ? r.jetton.master : null).catch(() => null);
    });
    const rows = records.map((r) => ({ ...r, cloud: items.some((it) => it.address === r.address) }));
    orphans.forEach((it) => {
      if (finalByAddress.has(it.address)) return;
      rows.push({ address: it.address, asset: null, units: null, gas: null, kind: 'cheque', note: null, expiresAt: null, createdAt: it.createdAt, from: null, state: cloudStates.get(it.address) || null, nonce: it.nonce, wallet: it.wallet, hasRefund: false, claimBy: null, cloud: true, orphan: true, jetton: null, multi: it.n > 1 ? { n: it.n, claimed: 0, returned: 0, left: 0 } : null, slots: null, master: it.master });
    });
    return rows.filter((r) => !(r.state && r.state.name === 'returned'));
  }

  const parseStart = (code) => typeof code === 'string' && /^k_/.test(code);

  CK.cheques = Object.freeze({ make, waitOpen, share, warm, lookup, slot, state, mine, relay, returnStored, cloud: Object.freeze(cloud), merged, parseStart, cleanRecord, cleanState, FINAL });
})();
