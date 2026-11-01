/* =========================================================
   欢迎页交互：视线跟随 + 头部视差 + 进入转场
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
    // 归一化到 -1..1，并做一点非线性，让中间区域更细腻
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

  /* 鼠标离开窗口时回到正中 */
  document.addEventListener('mouseleave', function () {
    target.x = 0;
    target.y = 0;
  });

  /* 瞳孔位移上限：源图坐标里的安全值，再按实际渲染尺寸换算成 CSS 像素。
     源图 800px 宽，虹膜半径 36px，眼白左右余量约 34 / 19px、上下 22 / 14px；
     取 6px / 3.5px 留足余量，保证任何情况下都不碰眼眶。 */
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
  var raf = 0;
  function tick() {
    var k = 0.12;
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;

    // 静止超过 3 秒后，做极缓慢的自动漂移，避免看起来像张照片
    var idle = Date.now() - lastMove > 3000;
    var dx = current.x, dy = current.y;
    if (idle) {
      var t = Date.now() / 2600;
      dx += Math.sin(t) * 0.12;
      dy += Math.cos(t * 0.8) * 0.08;
    }

    // 硬性夹紧：无论鼠标在哪个边缘、是否叠加了自动漂移
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));

    root.style.setProperty('--mx', dx.toFixed(4));
    root.style.setProperty('--my', dy.toFixed(4));
    root.style.setProperty('--eye-x', (dx * maxEyeX).toFixed(2) + 'px');
    root.style.setProperty('--eye-y', (dy * maxEyeY).toFixed(2) + 'px');
    raf = requestAnimationFrame(tick);
  }

  if (!reduce) raf = requestAnimationFrame(tick);

  /* ---------- 进入 ---------- */
  var leaving = false;
  function leave(href) {
    if (leaving) return;
    leaving = true;
    body.classList.add('is-leaving');
    window.setTimeout(function () {
      window.location.href = href || (enterBtn ? enterBtn.href : 'index.html');
    }, 420);
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      leave(enterBtn.getAttribute('href'));
    });
  }

  /* 键盘：Enter / 空格进入，方向键也能"看一眼" */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement && document.activeElement.tagName === 'A' &&
          document.activeElement !== enterBtn) return;
      e.preventDefault();
      leave();
    }
  });

  /* 页面从 bfcache 恢复时复位 */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      leaving = false;
      body.classList.remove('is-leaving');
    }
  });
})();
