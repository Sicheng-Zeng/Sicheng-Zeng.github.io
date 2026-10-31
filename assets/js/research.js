/* =========================================================
   曾思诚 · Research page
   Figure lightbox + citation copy
   ========================================================= */
(function () {
  'use strict';

  /* ---------- figure lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var frame = document.querySelector('.figure-frame');
  var closeBtn = lightbox ? lightbox.querySelector('.lightbox-close') : null;
  var lastFocused = null;

  function openLightbox() {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (frame) frame.addEventListener('click', openLightbox);

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  if (lightbox) {
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  /* ---------- copy citation ---------- */
  var copyBtn = document.querySelector('.copy-btn');
  var citeText = document.querySelector('.cite-text');
  var copyTimer = null;

  function flashCopy(ok) {
    if (!copyBtn) return;
    copyBtn.textContent = ok ? '已复制' : '复制失败';
    copyBtn.classList.toggle('is-copied', ok);

    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(function () {
      copyBtn.textContent = '复制引用';
      copyBtn.classList.remove('is-copied');
    }, 1800);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }

    document.body.removeChild(area);
    flashCopy(ok);
  }

  if (copyBtn && citeText) {
    copyBtn.addEventListener('click', function () {
      var text = citeText.textContent.replace(/\s+/g, ' ').trim();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () {
            flashCopy(true);
          },
          function () {
            fallbackCopy(text);
          }
        );
      } else {
        fallbackCopy(text);
      }
    });
  }
})();
