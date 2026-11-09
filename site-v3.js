/* site-v3.js — gedeelde beweging voor de overige pagina's (naast script.js):
   soepel scrollen (Lenis, alleen met muis/trackpad), magnetische knoppen en
   de zwevende contactknop verbergen bij de nieuwe footer. Geen GSAP nodig. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- soepel scrollen ---------- */
  if (!reduce && finePointer && window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, anchors: { offset: -90 } });
    window.__imetechLenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    // menu of contactpaneel open: pagina eronder niet laten scrollen
    var mo = new MutationObserver(function () {
      var locked = document.body.style.overflow === 'hidden';
      if (locked) lenis.stop(); else lenis.start();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  }

  /* ---------- magnetische knoppen (zacht naar de cursor, veert terug) ---------- */
  function magnetic(el) {
    if (el.dataset.magBound) return;
    el.dataset.magBound = '1';
    var strength = parseFloat(el.dataset.strength || '0.25');
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    function step() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      el.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(step);
      else { raf = 0; if (!tx && !ty) el.style.transform = ''; }
    }
    function go() { if (!raf) raf = requestAnimationFrame(step); }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      go();
    });
    el.addEventListener('pointerleave', function () { tx = 0; ty = 0; go(); });
  }
  function bindMagnetic() {
    if (reduce || !finePointer) return;
    document.querySelectorAll('.btn-primary, .nav a.nav-cta, [data-magnetic]').forEach(magnetic);
  }
  bindMagnetic();
  // header en footer worden later ingeladen door script.js
  setTimeout(bindMagnetic, 1200);
  setTimeout(bindMagnetic, 3000);

  /* ---------- contactknop wegfaden zodra de footer in beeld komt ---------- */
  function watchFooter() {
    var ftr = document.querySelector('.ftr');
    var cta = document.querySelector('.floating-cta');
    if (!ftr || !cta || !('IntersectionObserver' in window)) return false;
    new IntersectionObserver(function (entries) {
      cta.classList.toggle('is-hidden-near-footer', entries[0].isIntersecting && !cta.classList.contains('has-panel-open'));
    }, { threshold: 0.1 }).observe(ftr);
    return true;
  }
  var tries = 0;
  (function wait() { if (!watchFooter() && tries++ < 20) setTimeout(wait, 300); })();
})();
