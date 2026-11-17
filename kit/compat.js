(function () {
  'use strict';
  var CK = window.CK = window.CK || {};

  function define(target, name, value) {
    if (target && !(name in target)) Object.defineProperty(target, name, { value: value, writable: true, configurable: true, enumerable: false });
  }
  function toInteger(n) {
    n = Number(n);
    if (n !== n) return 0;
    return n < 0 ? Math.ceil(n) : Math.floor(n);
  }
  function at(index) {
    var length = this.length >>> 0;
    var i = toInteger(index);
    if (i < 0) i += length;
    return i < 0 || i >= length ? undefined : this[i];
  }
  function findLastIndex(test, self) {
    if (typeof test !== 'function') throw new TypeError(test + ' is not a function');
    for (var i = (this.length >>> 0) - 1; i >= 0; i--) if (test.call(self, this[i], i, this)) return i;
    return -1;
  }
  function findLast(test, self) {
    var i = findLastIndex.call(this, test, self);
    return i < 0 ? undefined : this[i];
  }
  var typed = typeof Uint8Array === 'function' ? Object.getPrototypeOf(Uint8Array.prototype) : null;
  [Array.prototype, typed].forEach(function (proto) {
    define(proto, 'at', at);
    define(proto, 'findLast', findLast);
    define(proto, 'findLastIndex', findLastIndex);
  });
  define(String.prototype, 'at', function (index) {
    if (this == null) throw new TypeError('String.prototype.at called on null or undefined');
    return at.call(String(this), index);
  });
  define(Object, 'hasOwn', function (object, key) {
    if (object == null) throw new TypeError('Cannot convert undefined or null to object');
    return Object.prototype.hasOwnProperty.call(Object(object), key);
  });

  var supports = window.CSS && typeof CSS.supports === 'function' ? function (a, b) {
    try { return b === undefined ? CSS.supports(a) : CSS.supports(a, b); } catch (_) { return false; }
  } : function () { return false; };
  var missing = [];
  if (typeof BigInt !== 'function') missing.push('BigInt');
  if (!window.crypto || typeof crypto.getRandomValues !== 'function' || !crypto.subtle) missing.push('WebCrypto');
  if (typeof TextEncoder !== 'function' || typeof Promise !== 'function' || typeof fetch !== 'function') missing.push('TextEncoder/Promise/fetch');
  if (!supports('--ck', '0')) missing.push('CSS custom properties');
  if (!supports('inset', '0')) missing.push('CSS inset');
  CK.compat = { missing: missing, ok: missing.length === 0 };

  if (missing.length) {
    blockApp();
    return;
  }

  var needHas = !supports('selector(:has(a))');
  var needContainer = !supports('container-type', 'inline-size');
  CK.compat.hasShim = needHas;
  CK.compat.containerShim = needContainer;
  if (!needHas && !needContainer) return;

  var HAS = [
    ['.screen-pad', function (el) { return !!el.querySelector(':scope > .balance.is-hidden'); }, 'ck-has-hidden-balance'],
    ['.coin--stack', function (el) { return !!el.querySelector('.coin--logo.is-on'); }, 'ck-has-logo'],
    ['.tk-logo', function (el) { return !!el.querySelector('.tk-img.is-on'); }, 'ck-has-logo'],
    ['.navbar-row', function (el) { return !!el.querySelector(':scope > .navbar-trail > .navbtn + .navbtn'); }, 'ck-has-two-buttons'],
    ['.sheet-body', function (el) { var next = el.nextElementSibling; return !!next && next.classList.contains('sheet-dock'); }, 'ck-has-dock'],
    ['.sw-term', function (el) { return !!el.querySelector('.sw-slip'); }, 'ck-has-slip'],
    ['.sw-term', function (el) { return !!el.querySelector('.sw-out'); }, 'ck-has-out'],
    ['.summary-row', function (el) { return !!el.querySelector('.sw-worth'); }, 'ck-has-worth']
  ];
  var CONTAINERS = '.carousel';
  var sizer = needContainer && typeof ResizeObserver === 'function' ? new ResizeObserver(function (entries) {
    entries.forEach(function (entry) { entry.target.style.setProperty('--ck-cqw', entry.contentRect.width + 'px'); });
  }) : null;

  function sync() {
    if (needHas) {
      HAS.forEach(function (rule) {
        var found = document.querySelectorAll(rule[0]);
        for (var i = 0; i < found.length; i++) found[i].classList.toggle(rule[2], rule[1](found[i]));
      });
    }
    if (sizer) {
      var boxes = document.querySelectorAll(CONTAINERS);
      for (var j = 0; j < boxes.length; j++) {
        if (!boxes[j].ckSized) { boxes[j].ckSized = true; sizer.observe(boxes[j]); }
      }
    }
  }
  function start() {
    sync();
    new MutationObserver(sync).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);

  function blockApp() {
    var TEXT = {
      ru: ['Нужна более новая система', 'Это приложение работает на iOS 15 и новее и на Android с System WebView 90 и новее. Обновите систему или Android System WebView в Google Play и откройте приложение снова. Ничего не удалено.'],
      en: ['A newer system is needed', 'This app runs on iOS 15 or later and on Android with System WebView 90 or later. Update the system, or Android System WebView in Google Play, and open the app again. Nothing was deleted.'],
      uk: ['Потрібна новіша система', 'Цей застосунок працює на iOS 15 і новіших та на Android із System WebView 90 і новішим. Оновіть систему або Android System WebView у Google Play і відкрийте застосунок знову. Нічого не видалено.'],
      kk: ['Жаңарақ жүйе керек', 'Бұл қолданба iOS 15 және жаңарағында, сондай-ақ System WebView 90 және жаңарағы бар Android-та жұмыс істейді. Жүйені немесе Google Play-дегі Android System WebView-ді жаңартып, қолданбаны қайта ашыңыз. Ештеңе өшірілмеді.']
    };
    var root = document.documentElement;
    root.className += ' ck-unsupported';
    function show() {
      if (document.getElementById('ck-unsupported')) return;
      var text = TEXT[(root.lang || 'ru').slice(0, 2)] || TEXT.ru;
      var box = document.createElement('div');
      box.id = 'ck-unsupported';
      box.setAttribute('role', 'alert');
      var title = document.createElement('h2');
      title.textContent = text[0];
      var body = document.createElement('p');
      body.textContent = text[1];
      box.appendChild(title);
      box.appendChild(body);
      document.body.appendChild(box);
      try {
        if (window.TelegramWebviewProxy) window.TelegramWebviewProxy.postEvent('web_app_ready', '{}');
        else if (window.parent !== window) window.parent.postMessage(JSON.stringify({ eventType: 'web_app_ready', eventData: {} }), '*');
      } catch (_) { }
    }
    if (document.body) show();
    else document.addEventListener('DOMContentLoaded', show);
  }
}());
