(function () {
  'use strict';
  const FEE = Object.freeze({ address: '0:29962731d4d7c639572e70bc6f5d75f44fb88535bf8f15de00b09dd09fddd228', bps: 10, domain: 'devpool.ton' });
  if (typeof module === 'object' && module && module.exports) module.exports = FEE;
  else Object.defineProperty(window.CK, 'feeConfig', { value: FEE });
})();
