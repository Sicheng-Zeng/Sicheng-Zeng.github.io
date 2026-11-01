/* =========================================================
   欢迎页交互：视线跟随 + 眨眼 + 进入转场
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var enterBtn = document.getElementById('enterBtn');
  var avatar = document.querySelector('.avatar-tilt');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 目标值与平滑值 ---------- */
  var target = { x: 0, y: 0 };
  var current = { x: 0, y: 0 };
  var lastMove = 0;

  function setPointer(clientX, clientY) {
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    target.x = Math.max(-1, Math.min(1, (clientX / w) * 2 - 1));
    target.y = Math.max(-1, Math.min(1, (clientY / h) * 2 - 1));
    lastMove = Date.now();
  }

  window.addEventListener('pointermove', function (e) {
    setPointer(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (e.touches.length) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    target.x = 0;
    target.y = 0;
  });

  /* ---------- 图片解码完成后再显示，避免先闪出两只眼睛 ---------- */
  var allImgs = [].slice.call(document.querySelectorAll('.avatar-tilt img'));
  var revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    body.classList.add('is-ready');
  }

  if (allImgs.length) {
    var waits = allImgs.map(function (im) {
      if (im.decode) return im.decode().catch(function () {});
      return Promise.resolve();
    });
    Promise.all(waits).then(reveal);
    // 兜底：网络异常时最多等 5 秒也要显示
    window.setTimeout(reveal, 5000);
  } else {
    reveal();
  }

  /* ---------- 瞳孔位移 ---------- */
  var SRC_W = 800, EYE_SRC_X = 6, EYE_SRC_Y = 3.5;
  var maxEyeX = 3, maxEyeY = 2;

  function updateEyeRange() {
    if (!avatar) return;
    var w = avatar.getBoundingClientRect().width || 300;
    maxEyeX = w * EYE_SRC_X / SRC_W;
    maxEyeY = w * EYE_SRC_Y / SRC_W;
  }
  updateEyeRange();
  window.addEventListener('resize', updateEyeRange);

  /* ---------- 逐帧缓动 ---------- */
  function tick() {
    var k = 0.12;
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;

    var idle = Date.now() - lastMove > 3000;
    var dx = current.x, dy = current.y;
    if (idle) {
      var t = Date.now() / 2600;
      dx += Math.sin(t) * 0.12;
      dy += Math.cos(t * 0.8) * 0.08;
    }

    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));

    root.style.setProperty('--mx', dx.toFixed(4));
    root.style.setProperty('--my', dy.toFixed(4));
    root.style.setProperty('--eye-x', (dx * maxEyeX).toFixed(2) + 'px');
    root.style.setProperty('--eye-y', (dy * maxEyeY).toFixed(2) + 'px');
    requestAnimationFrame(tick);
  }

  if (!reduce) requestAnimationFrame(tick);

  /* ---------- 眨眼 ---------- */
  var blinkTimer = 0;
  var blinkReset = 0;

  function closeEyes(ms) {
    body.classList.add('eyes-closed');
    window.clearTimeout(blinkReset);
    blinkReset = window.setTimeout(function () {
      body.classList.remove('eyes-closed');
    }, ms);
  }

  function scheduleBlink() {
    window.clearTimeout(blinkTimer);
    // 2.6–7 秒随机，偶尔连眨两下，更像真人
    blinkTimer = window.setTimeout(function () {
      closeEyes(100);
      if (Math.random() < 0.25) {
        window.setTimeout(function () { closeEyes(85); }, 230);
      }
      scheduleBlink();
    }, 2600 + Math.random() * 4400);
  }

  if (!reduce) {
    window.setTimeout(scheduleBlink, 1600 + Math.random() * 1200);
  }

  /* 供调试/截图用 */
  window.forceBlink = function (ms) { closeEyes(ms || 400); };

  /* ---------- 进入 ---------- */
  var leaving = false;
  function leave(href) {
    if (leaving) return;
    leaving = true;
    body.classList.add('is-leaving');
    window.setTimeout(function () {
      window.location.href = href || (enterBtn ? enterBtn.href : 'home.html');
    }, 420);
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      leave(enterBtn.getAttribute('href'));
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement && document.activeElement.tagName === 'A' &&
          document.activeElement !== enterBtn) return;
      e.preventDefault();
      leave();
    }
  });

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      leaving = false;
      body.classList.remove('is-leaving');
      body.classList.remove('eyes-closed');
    }
  });
})();
