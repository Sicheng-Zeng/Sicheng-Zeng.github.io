/* =========================================================
   曾思诚 · Personal Website · interactions
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: subtle background once the page is scrolled */
  var header = document.getElementById('siteHeader');
  if (header) {
    var scrollTop = function () {
      var root = document.scrollingElement || document.documentElement;
      return root ? root.scrollTop : window.pageYOffset || 0;
    };
    var onScroll = function () {
      header.classList.toggle('is-scrolled', scrollTop() > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  }

  /* Reveal on scroll */
  var revealables = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealables.forEach(function (el) { observer.observe(el); });
  }
})();
