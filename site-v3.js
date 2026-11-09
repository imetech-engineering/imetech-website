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
    // ook verbergen boven het cyaan contactblok: daar valt de knop weg
    var seen = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      cta.classList.toggle('is-hidden-near-footer', seen.size > 0 && !cta.classList.contains('has-panel-open'));
    }, { threshold: 0.1 });
    io.observe(ftr);
    var block = document.querySelector('.cta-section');
    if (block) io.observe(block);
    return true;
  }
  var tries = 0;
  (function wait() { if (!watchFooter() && tries++ < 20) setTimeout(wait, 300); })();
})();

/* Header, puntenraster, 'Bekijk'-bol en koppen: zelfde gedrag als de homepage */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var en = document.documentElement.lang === 'en';
  function when(sel, fn, n) {
    var el = document.querySelector(sel);
    if (el) return fn(el);
    if ((n = n || 0) < 40) setTimeout(function () { when(sel, fn, n + 1); }, 100);
  }

  when('#hdr', function (hdr) {
    var lastY = 0;
    function onScroll() {
      var y = window.scrollY;
      hdr.classList.toggle('is-solid', y > 40);
      hdr.classList.toggle('is-hidden', y > lastY && y > innerHeight * .9 && !document.body.classList.contains('menu-open'));
      lastY = y;
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var burger = hdr.querySelector('.hdr-burger'), mnav = document.getElementById('mnav');
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      mnav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { if (burger.getAttribute('aria-expanded') === 'true') burger.click(); }); });
    var p = location.pathname;
    hdr.querySelectorAll('.hdr-nav a').forEach(function (a) { if (p.indexOf(a.getAttribute('href')) === 0) { a.classList.add('is-on'); a.setAttribute('aria-current', 'page'); } });
    document.querySelectorAll('.hdr-lang a, .mnav-lang a').forEach(function (a) { a.classList.toggle('is-on', (a.getAttribute('lang') === 'en') === en); });
  });

  /* puntenraster */
  function Field(canvas) {
    var ctx = canvas.getContext('2d'), host = canvas.parentElement, dpr = Math.min(devicePixelRatio || 1, 2);
    var w = 0, h = 0, pts = [], gap = 30, vis = false, raf = 0, t0 = performance.now();
    var m = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false };
    function build() {
      var r = host.getBoundingClientRect(); w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = w < 700 ? 24 : 30; pts = [];
      for (var y = (h % gap) / 2; y <= h; y += gap) for (var x = (w % gap) / 2; x <= w; x += gap) pts.push({ x: x, y: y, dx: 0, dy: 0 });
    }
    function frame(now) {
      raf = 0; var t = (now - t0) / 1000;
      if (!m.on) { m.tx = w * (.5 + .32 * Math.sin(t * .23)); m.ty = h * (.5 + .28 * Math.sin(t * .31 + 1)); }
      m.x += (m.tx - m.x) * .12; m.y += (m.ty - m.y) * .12;
      ctx.clearRect(0, 0, w, h);
      var R = Math.min(220, Math.max(140, w * .16)), R2 = R * R;
      pts.forEach(function (p) {
        var vx = p.x - m.x, vy = p.y - m.y, d2 = vx * vx + vy * vy, f = 0, tx = 0, ty = 0;
        if (d2 < R2) { var d = Math.sqrt(d2) || 1; f = 1 - d / R; f = f * f * (3 - 2 * f); tx = vx / d * f * 14; ty = vy / d * f * 14; }
        p.dx += (tx - p.dx) * .15; p.dy += (ty - p.dy) * .15;
        var a = .10 + (.5 + .5 * Math.sin(p.x * .006 + p.y * .004 - t * .6)) * .07 + f * .75;
        ctx.fillStyle = (f > .02 ? 'rgba(108,200,242,' : 'rgba(150,195,235,') + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x + p.dx, p.y + p.dy, .9 + f * 1.6, 0, 6.2832); ctx.fill();
      });
      if (vis && !reduce) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    build(); frame(performance.now());
    if (reduce) return;
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) start(); }).observe(host);
    if (fine) {
      host.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); m.tx = e.clientX - r.left; m.ty = e.clientY - r.top; m.on = true; });
      host.addEventListener('pointerleave', function () { m.on = false; });
    }
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); start(); }, 150); });
  }
  function fields() {
    document.querySelectorAll('.page-hero, .cta-section').forEach(function (s) {
      var c = document.createElement('canvas'); c.className = 'field'; c.setAttribute('aria-hidden', 'true'); s.insertBefore(c, s.firstChild); Field(c);
    });
  }

  /* 'Bekijk'-bol: kijkt ook bij scrollen wat er onder de cursor ligt */
  function pill() {
    if (reduce || !fine) return;
    var el = document.createElement('div'); el.className = 'sv-pill'; el.setAttribute('aria-hidden', 'true');
    el.textContent = en ? 'View' : 'Bekijk'; document.body.appendChild(el);
    var mx = -1, my = -1, x = 0, y = 0, s = 0, ts = 0, raf = 0;
    function step() {
      x += (mx - x) * .16; y += (my - y) * .16; s += (ts - s) * .16;
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      raf = (Math.abs(ts - s) > .003 || Math.abs(mx - x) > .3 || Math.abs(my - y) > .3) ? requestAnimationFrame(step) : 0;
    }
    function sync() {
      if (mx < 0) return;
      var t = document.elementFromPoint(mx, my), on = !!(t && t.closest('.project-card, .feature-card, .blog-card'));
      if (on && !ts) { x = mx; y = my; }
      ts = on ? 1 : 0;
      if (!raf) raf = requestAnimationFrame(step);
    }
    el.style.transform = 'scale(0)';
    addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; sync(); }, { passive: true });
    addEventListener('scroll', sync, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { ts = 0; if (!raf) raf = requestAnimationFrame(step); });
  }

  /* koppen regel voor regel */
  function motion() {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap, ST = window.ScrollTrigger; gsap.registerPlugin(ST);
    if (window.SplitText) {
      gsap.registerPlugin(window.SplitText);
      document.querySelectorAll('.section-header h2, .cta-section h2').forEach(function (el) {
        window.SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true, onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            onComplete: function () { (self.masks || []).forEach(function (m) { m.style.overflow = 'visible'; }); } });
        } });
      });
    }
  }

  function go() {
    fields(); pill();
    var files = ['/vendor/gsap.min.js', '/vendor/ScrollTrigger.min.js', '/vendor/SplitText.min.js'], left = files.length;
    files.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = function () { if (!--left) motion(); }; document.body.appendChild(s); });
  }
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
