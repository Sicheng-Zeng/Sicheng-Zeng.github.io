/* =========================================================
   曾思诚 · Personal Website · about page
   ========================================================= */
(function () {
  'use strict';

  var sheet = document.getElementById('hobbySheet');
  var panel = sheet ? sheet.querySelector('.hobby-panel') : null;
  var closeBtn = sheet ? sheet.querySelector('.hobby-close') : null;
  var views = sheet ? Array.prototype.slice.call(sheet.querySelectorAll('.hobby-view')) : [];
  var lastFocus = null;

  /* ---------- hobby sheet ---------- */
  var focusables = function () {
    if (!panel) return [];
    return Array.prototype.filter.call(
      panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
  };

  var openSheet = function (name) {
    if (!sheet || !panel) return;

    var active = null;
    views.forEach(function (view) {
      var match = view.getAttribute('data-view') === name;
      view.classList.toggle('is-active', match);
      if (match) active = view;
    });
    if (!active) return;

    var title = active.querySelector('.hobby-title');
    if (title && title.id) panel.setAttribute('aria-labelledby', title.id);

    lastFocus = document.activeElement;
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');

    var rail = active.querySelector('.hobby-rail');
    if (rail) rail.scrollLeft = 0;

    panel.focus();
  };

  var closeSheet = function () {
    if (!sheet || !sheet.classList.contains('is-open')) return;
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  Array.prototype.forEach.call(document.querySelectorAll('.shelf'), function (shelf) {
    shelf.addEventListener('click', function () {
      openSheet(shelf.getAttribute('data-hobby'));
    });
  });

  if (sheet) {
    sheet.addEventListener('click', function (event) {
      if (event.target === sheet) closeSheet();
    });
    sheet.setAttribute('aria-hidden', 'true');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSheet);

  document.addEventListener('keydown', function (event) {
    if (!sheet || !sheet.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeSheet();
      return;
    }

    if (event.key !== 'Tab' || !panel) return;
    var items = focusables();
    if (!items.length) {
      event.preventDefault();
      panel.focus();
      return;
    }

    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- copy contact ---------- */
  var status = document.getElementById('copyStatus');
  var fallbackCopy = function (text) {
    var input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(input);
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  };

  var copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return new Promise(function (resolve, reject) {
      if (fallbackCopy(text)) resolve();
      else reject(new Error('copy failed'));
    });
  };

  Array.prototype.forEach.call(document.querySelectorAll('.contact-copy'), function (chip) {
    var timer = null;

    chip.addEventListener('click', function () {
      var text = chip.getAttribute('data-copy');
      if (!text) return;

      copyText(text).then(function () {
        chip.textContent = '已复制';
        chip.classList.add('is-copied');
        if (status) status.textContent = '已复制：' + text;
      }).catch(function () {
        chip.textContent = '复制失败';
        if (status) status.textContent = '复制失败，请手动选择文本';
      }).then(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          chip.textContent = '复制';
          chip.classList.remove('is-copied');
        }, 1600);
      });
    });
  });
})();
