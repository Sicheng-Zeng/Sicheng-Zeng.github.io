/* =========================================================
   曾思诚 · Product pages
   Feature sheet + promo video overlays
   ========================================================= */
(function () {
  'use strict';

  /* ---------- feature sheet ---------- */
  var sheet = document.getElementById('featSheet');
  var sheetTitle = document.getElementById('sheetTitle');
  var sheetPanel = sheet ? sheet.querySelector('.sheet-panel') : null;
  var panels = document.querySelectorAll('.feat-panel');
  var sheetClose = sheet ? sheet.querySelector('.sheet-close') : null;
  var lastFocus = null;

  function openSheet(key) {
    if (!sheet) return;

    var matched = false;

    for (var i = 0; i < panels.length; i++) {
      var isMatch = panels[i].getAttribute('data-panel') === key;
      panels[i].classList.toggle('is-active', isMatch);
      if (isMatch) matched = true;
    }

    if (!matched) return;

    lastFocus = document.activeElement;

    if (sheetTitle) {
      var nameEl = sheet.querySelector('.feat-panel.is-active .panel-title');
      sheetTitle.textContent = nameEl ? nameEl.textContent : '产品详情';
    }

    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');

    if (sheetPanel) {
      sheetPanel.scrollTop = 0;
      sheetPanel.focus({ preventScroll: true });
    }
  }

  function closeSheet() {
    if (!sheet || !sheet.classList.contains('is-open')) return;
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  var triggers = document.querySelectorAll('[data-feat]');

  for (var t = 0; t < triggers.length; t++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        openSheet(btn.getAttribute('data-feat'));
      });
    })(triggers[t]);
  }

  if (sheetClose) sheetClose.addEventListener('click', closeSheet);

  if (sheet) {
    sheet.addEventListener('click', function (event) {
      if (event.target === sheet) closeSheet();
    });
  }

  /* ---------- promo video ---------- */
  var vidLayer = document.getElementById('vidLayer');
  var video = document.getElementById('promoVideo');
  var vidClose = vidLayer ? vidLayer.querySelector('.vid-close') : null;
  var vidLastFocus = null;

  function openVideo() {
    if (!vidLayer) return;
    vidLastFocus = document.activeElement;
    vidLayer.classList.add('is-open');
    vidLayer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');

    if (video) {
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () { /* 需用户再点一次播放 */ });
    }

    if (vidClose) vidClose.focus();
  }

  function closeVideo() {
    if (!vidLayer || !vidLayer.classList.contains('is-open')) return;

    vidLayer.classList.remove('is-open');
    vidLayer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');

    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    if (vidLastFocus && vidLastFocus.focus) vidLastFocus.focus();
  }

  var videoTriggers = document.querySelectorAll('[data-video]');

  for (var v = 0; v < videoTriggers.length; v++) {
    videoTriggers[v].addEventListener('click', openVideo);
  }

  if (vidClose) vidClose.addEventListener('click', closeVideo);

  if (vidLayer) {
    vidLayer.addEventListener('click', function (event) {
      if (event.target === vidLayer) closeVideo();
    });
  }

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (vidLayer && vidLayer.classList.contains('is-open')) {
      closeVideo();
    } else {
      closeSheet();
    }
  });
})();
