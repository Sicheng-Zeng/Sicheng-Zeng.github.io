/* =========================================================
   曾思诚 · Intern badges
   Spring-pendulum physics for the hanging ID badges.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GRAVITY = 2600;   // px / s²
  var STIFFNESS = 760;  // spring constant (acceleration per px of stretch)
  var DAMPING = 5.0;    // air / cord damping, per second

  var items = [];
  var nodes = document.querySelectorAll('.pendulum');
  if (!nodes.length) return;

  /* ---------- layout ---------- */
  function measure(item) {
    var rect = item.hang.getBoundingClientRect();
    item.hangH = rect.height;
    item.badgeH = item.badge.offsetHeight;
    item.rest = Math.max(64, item.hangH - item.badgeH - 44);
    item.maxLen = Math.max(item.rest + 60, item.hangH - item.badgeH - 8);
  }

  /* ---------- rendering ---------- */
  function render(item) {
    var len = Math.sqrt(item.x * item.x + item.y * item.y) || 0.001;
    var angle = Math.atan2(-item.x, item.y);

    // the card lags a touch behind the cord, like a loosely clipped badge
    item.badgeAngle += (angle - item.badgeAngle) * 0.16;

    item.el.style.transform = 'rotate(' + angle.toFixed(5) + 'rad)';
    item.el.style.setProperty('--len', len.toFixed(2) + 'px');

    item.badge.style.transform =
      'translateX(-50%) rotate(' + (item.badgeAngle - angle).toFixed(5) + 'rad)';
  }

  /* ---------- physics ---------- */
  function integrate(item, dt) {
    var len = Math.sqrt(item.x * item.x + item.y * item.y) || 0.0001;
    var ax = 0;
    var ay = GRAVITY;

    // a bungee only pulls once it is taut
    if (len > item.rest) {
      var k = (STIFFNESS * (len - item.rest)) / len;
      ax -= k * item.x;
      ay -= k * item.y;
    }

    item.vx += ax * dt;
    item.vy += ay * dt;

    var damp = Math.exp(-DAMPING * dt);
    item.vx *= damp;
    item.vy *= damp;

    item.x += item.vx * dt;
    item.y += item.vy * dt;

    // a hanging badge can never rise above its hook
    if (item.y < 24) {
      item.y = 24;
      if (item.vy < 0) item.vy = 0;
    }

    // never let the badge leave the hanging area
    var L = Math.sqrt(item.x * item.x + item.y * item.y);
    if (L > item.maxLen) {
      var scale = item.maxLen / L;
      item.x *= scale;
      item.y *= scale;

      var ux = item.x / item.maxLen;
      var uy = item.y / item.maxLen;
      var outward = item.vx * ux + item.vy * uy;
      if (outward > 0) {
        item.vx -= outward * ux;
        item.vy -= outward * uy;
      }
    }
  }

  var lastTime = 0;

  function tick(now) {
    if (!lastTime) lastTime = now;
    var dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.05) dt = 0.05;

    var steps = Math.max(1, Math.ceil(dt / 0.004));
    var h = dt / steps;

    for (var i = 0; i < items.length; i++) {
      if (items[i].dragging) continue;
      for (var s = 0; s < steps; s++) integrate(items[i], h);
    }

    for (var j = 0; j < items.length; j++) render(items[j]);

    window.requestAnimationFrame(tick);
  }

  /* ---------- drag to play with the badge ---------- */
  function findDragging(pointerId) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].dragging && items[i].pointerId === pointerId) return items[i];
    }
    return null;
  }

  function beginDrag(item, e) {
    var rect = item.hang.getBoundingClientRect();
    item.anchorX = rect.left + rect.width / 2;
    item.anchorY = rect.top;

    item.grabX = item.x - (e.clientX - item.anchorX);
    item.grabY = item.y - (e.clientY - item.anchorY);

    item.dragging = true;
    item.pointerId = e.pointerId;
    item.vx = 0;
    item.vy = 0;
    item.lastX = item.x;
    item.lastY = item.y;
    item.lastT = performance.now();
  }

  /* every drag ends here: pointerup, pointercancel, lost capture, window blur.
     listeners live on window (capture phase) so releasing the mouse anywhere —
     inside or far outside the badge — always springs the card back */
  function endDrag(item, e) {
    if (!item.dragging) return;

    var badge = item.badge;
    var pointerId = item.pointerId;

    item.dragging = false;
    item.pointerId = null;

    try {
      if (badge.hasPointerCapture && badge.hasPointerCapture(pointerId)) {
        badge.releasePointerCapture(pointerId);
      }
    } catch (err) {
      /* ignore: capture may already be gone */
    }

    if (!e || e.type !== 'pointerup' || performance.now() - item.lastT > 90) {
      item.vx = 0;
      item.vy = 0;
    }

    var speed = Math.sqrt(item.vx * item.vx + item.vy * item.vy);
    if (speed > 1500) {
      item.vx *= 1500 / speed;
      item.vy *= 1500 / speed;
    }
  }

  function endAllDrags() {
    for (var i = 0; i < items.length; i++) {
      if (items[i].dragging) endDrag(items[i], null);
    }
  }

  function bindDrag(item) {
    var badge = item.badge;

    badge.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (item.dragging) return;

      beginDrag(item, e);

      try {
        if (badge.setPointerCapture) badge.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore: pointer capture is an enhancement only */
      }
      e.preventDefault();
    });

    badge.addEventListener('lostpointercapture', function (e) {
      // capture can be dropped by the browser (right-click, window switch, …)
      if (item.dragging && e.pointerId === item.pointerId) endDrag(item, null);
    });
  }

  function moveDrag(e) {
    var item = findDragging(e.pointerId);
    if (!item) return;

    // belt and braces: if the button is already up, the pointerup was swallowed
    // (pointer left the window, capture dropped, …) so the card must be let go
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      endDrag(item, null);
      return;
    }

    var nx = e.clientX - item.anchorX + item.grabX;
    var ny = e.clientY - item.anchorY + item.grabY;

    if (ny < 24) ny = 24;

    var len = Math.sqrt(nx * nx + ny * ny) || 0.001;
    if (len < 40) {
      nx *= 40 / len;
      ny *= 40 / len;
    } else if (len > item.maxLen) {
      nx *= item.maxLen / len;
      ny *= item.maxLen / len;
    }

    var now = performance.now();
    var dt = (now - item.lastT) / 1000;
    if (dt > 0.006) {
      item.vx = (nx - item.lastX) / dt;
      item.vy = (ny - item.lastY) / dt;
      item.lastX = nx;
      item.lastY = ny;
      item.lastT = now;
    }

    item.x = nx;
    item.y = ny;
    render(item);
    e.preventDefault();
  }

  function releaseDrag(e) {
    var item = findDragging(e.pointerId);
    if (!item) return;
    endDrag(item, e);
    if (e.cancelable) e.preventDefault();
  }

  window.addEventListener('pointermove', moveDrag, true);
  window.addEventListener('pointerup', releaseDrag, true);
  window.addEventListener('pointercancel', releaseDrag, true);
  window.addEventListener('blur', endAllDrags);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) endAllDrags();
  });

  /* ---------- printed lanyard ---------- */
  function decorateStrap(item) {
    var cord = item.el.querySelector('.cord');
    var logo = item.badge.querySelector('.badge-logo');
    if (!cord || !logo) return;

    var src = logo.getAttribute('src');
    var step = 84;

    for (var y = 32; y < 1000; y += step) {
      var mark = document.createElement('img');
      mark.className = 'cord-mark';
      mark.src = src;
      mark.alt = '';
      mark.draggable = false;
      mark.style.top = y + 'px';
      cord.appendChild(mark);
    }
  }

  /* ---------- boot ---------- */
  function setup(el, index) {
    var item = {
      el: el,
      badge: el.querySelector('.badge'),
      hang: el.parentNode,
      index: index,
      x: 0,
      y: 120,
      vx: 0,
      vy: 0,
      badgeAngle: 0,
      rest: 140,
      maxLen: 340,
      hangH: 480,
      badgeH: 260,
      dragging: false,
      pointerId: null,
      grabX: 0,
      grabY: 0,
      anchorX: 0,
      anchorY: 0,
      lastX: 0,
      lastY: 0,
      lastT: 0
    };

    measure(item);
    decorateStrap(item);

    if (reduceMotion) {
      item.x = 0;
      item.y = item.rest + GRAVITY / STIFFNESS;
      item.badgeAngle = 0;
      render(item);
    } else {
      // let it drop from just above its resting point, then bounce
      item.x = (index - 1) * 8;
      item.y = Math.max(30, item.rest - (38 + index * 4));
      item.vx = (index - 1) * 12;
      item.vy = 0;
      item.badgeAngle = 0;
      render(item);
    }

    bindDrag(item);
    items.push(item);
  }

  for (var i = 0; i < nodes.length; i++) setup(nodes[i], i);

  if (!reduceMotion) {
    window.requestAnimationFrame(tick);
  }

  /* ---------- resize ---------- */
  var resizeTimer;

  function relax(force) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var prevRest = item.rest;
      measure(item);

      if (reduceMotion || force) {
        item.x = 0;
        item.y = item.rest + GRAVITY / STIFFNESS;
        item.badgeAngle = 0;
      } else if (!item.dragging) {
        var len = Math.sqrt(item.x * item.x + item.y * item.y);
        if (len > item.maxLen) {
          var scale = item.maxLen / len;
          item.x *= scale;
          item.y *= scale;
        }
        /* 容器变矮时把工牌整体上提，保证不会压到底部文字 */
        if (item.rest !== prevRest) {
          item.y = Math.max(item.rest + GRAVITY / STIFFNESS, item.y + (item.rest - prevRest));
        }
      }

      render(item);
    }
  }

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(relax, 150);
  });

  /* 页面里任何容器高度变化（页脚、字体加载、窗口内滚动等）都要重算，
     因为工牌的落点是按 .hang 的实际高度算出来的 */
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(relax, 120);
    });
    for (var r = 0; r < items.length; r++) ro.observe(items[r].hang);
  }
})();
