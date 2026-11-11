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
    cta.setAttribute('data-lenis-prevent', ''); // scrollen in de popup blijft in de popup
    // ook verbergen boven het contactblok: daar valt de knop weg
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
    var lastY = window.scrollY, travel = 0, hidden = false, peek = false;
    // rustig gedrag: pas verbergen na 80px omlaag, terug na 24px omhoog; bovenin met de muis of met focus altijd zichtbaar
    function setHidden(v) { hidden = v; hdr.classList.toggle('is-hidden', v && !peek && !document.body.classList.contains('menu-open')); }
    function onScrollHeader(y) {
      hdr.classList.toggle('is-solid', y > 40);
      var d = y - lastY; lastY = y;
      if (!d) return;
      if ((d > 0) !== (travel > 0)) travel = 0;
      travel += d;
      if (y < window.innerHeight * 0.9) setHidden(false);
      else if (travel > 80) setHidden(true);
      else if (travel < -24) setHidden(false);
    }
    function setPeek(v) { if (v !== peek) { peek = v; setHidden(hidden); } }
    document.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') setPeek(e.clientY < 96 || hdr.contains(e.target)); }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { setPeek(false); });
    hdr.addEventListener('focusin', function () { setPeek(true); });
    hdr.addEventListener('focusout', function () { setPeek(false); });
    function onScroll() { onScrollHeader(window.scrollY); }
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
    // ScrollTrigger.refresh() zet de pagina kort op 0 om te meten. Midden in een veeg op een telefoon schiet je dan naar boven.
    // Daarom niet automatisch bij 'load'/'resize', maar zelf verversen zodra er even niet gescrold of aangeraakt wordt.
    ST.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded' });
    (function () {
      var timer = 0, want = false, touching = false, lastW = innerWidth;
      function later() { want = true; clearTimeout(timer); timer = setTimeout(function () { if (touching) return later(); want = false; ST.refresh(); }, 450); }
      addEventListener('touchstart', function () { touching = true; }, { passive: true });
      addEventListener('touchend', function () { touching = false; if (want) later(); }, { passive: true });
      addEventListener('scroll', function () { if (want) later(); }, { passive: true });
      if (document.readyState !== 'complete') addEventListener('load', later, { once: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
      addEventListener('resize', function () { if (innerWidth !== lastW) { lastW = innerWidth; later(); } }); // alleen breedte: de adresbalk telt niet
    })();
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
(function () {
  /* ---------- hover-3D: kaarten kantelen licht naar de cursor (alleen muis, niet bij reduced motion) ---------- */
  (function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.project-card, .blog-card, .feature-card').forEach(function (card) {
      var glare = card.querySelector('.project-img, .blog-img, .feature-media') || card, raf = 0;
      card.classList.add('tilt'); glare.classList.add('tilt-glare'); var shine = document.createElement('span'); shine.className = 'tilt-shine'; shine.setAttribute('aria-hidden', 'true'); glare.appendChild(shine);
      card.addEventListener('pointermove', function (e) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          card.classList.add('is-tilting');
          card.style.setProperty('--ry', ((x - 0.5) * 6).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg');
          var g = glare.getBoundingClientRect();
          glare.style.setProperty('--mx', (e.clientX - g.left) + 'px');
          glare.style.setProperty('--my', (e.clientY - g.top) + 'px');
        });
      });
      card.addEventListener('pointerleave', function () {
        cancelAnimationFrame(raf); card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  })();

  /* ---------- getallen tellen op zodra ze in beeld komen (eindwaarde staat gewoon in de HTML) ---------- */
  (function () {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = [].filter.call(document.querySelectorAll('.about-stat b, .stat-number, .stat b'), function (b) {
      var t = b.lastChild; return t && t.nodeType === 3 && /^\d+(\.\d)?\+?$/.test(t.nodeValue.trim());
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var node = en.target.lastChild, raw = node.nodeValue.trim(), end = parseFloat(raw), dec = raw.indexOf('.') > -1 ? 1 : 0;
        var suf = raw.replace(/^[\d.]+/, ''), from = end >= 1000 ? end - 9 : 0, t0 = performance.now(), dur = 1400;
        en.target.style.fontVariantNumeric = 'tabular-nums';
        (function step(now) {
          var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
          node.nodeValue = (from + (end - from) * e).toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(step); else node.nodeValue = raw;
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (b) { io.observe(b); });
  })();
})();

/* ---------- Ventairo 3D op dienstpagina's: alleen met WebGL, pas laden als het model dichtbij is ---------- */
(function () {
  // vooraf ophalen zodra de pagina rustig is: model, texturen en modules liggen dan klaar als je bij de 3D aankomt
  function vaiPrefetch() {
    if (window.__vaiPf) return; window.__vaiPf = 1;
    var small = innerWidth < 900, d = document.head;
    ['/xplode.js?v=50', '/vendor/three.module.min.js', '/vendor/RoomEnvironment.js', '/vendor/GLTFLoader.js', '/vendor/BufferGeometryUtils.js',
     '/vendor/pp/EffectComposer.js', '/vendor/pp/RenderPass.js', '/vendor/pp/UnrealBloomPass.js', '/vendor/pp/OutputPass.js', '/vendor/pp/Pass.js',
     '/vendor/pp/CopyShader.js', '/vendor/pp/ShaderPass.js', '/vendor/pp/MaskPass.js', '/vendor/pp/LuminosityHighPassShader.js', '/vendor/pp/OutputShader.js'
    ].forEach(function (u) { var l = document.createElement('link'); l.rel = 'modulepreload'; l.href = u; d.appendChild(l); });
    // het model wordt hier al binnengehaald en door xplode.js hergebruikt; texturen volledig inlezen zodat ze in de cache staan
    if (window.DecompressionStream) window.__vaiGz = fetch('/models/vai-one.glb.gz?v=1').then(function (r) { if (!r.ok) throw r.status; return r.arrayBuffer(); });
    ['/models/vai-one-pcb-top' + (small ? '-1k' : '') + '.webp?v=1', '/models/vai-one-pcb-bot' + (small ? '-1k' : '') + '.webp?v=1']
      .forEach(function (u) { fetch(u).then(function (r) { return r.blob(); }).catch(function () {}); });
  }
  function whenIdle(fn) {
    var go = function () { (window.requestIdleCallback || setTimeout)(fn, { timeout: 1500 }); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }
  var els = document.querySelectorAll('[data-xp]'), ok = false;
  if (!els.length || !('IntersectionObserver' in window)) return;
  try { var c = document.createElement('canvas'); ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
  if (!ok) return;
  document.documentElement.classList.add('has-xp');
  whenIdle(function () { addEventListener('scroll', function onS() { if (scrollY > 150) { removeEventListener('scroll', onS); vaiPrefetch(); } }, { passive: true }); }); // pas als je echt gaat scrollen: wie direct wegklikt, downloadt het model niet
  els.forEach(function (el) {
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return; io.disconnect(); vaiPrefetch();
      import('/xplode.js?v=50').then(function (m) { return m.init(el); }).catch(function () { el.closest('section') && el.closest('section').remove(); });
    }, { rootMargin: '100% 0px' }); // één scherm vooruit; het model zelf komt al binnen vanaf de eerste scroll
    afterScroll(el, function () { io.observe(el); });
  });
  // pas gaan kijken (en laden) als de bezoeker echt scrolt of de sectie al in beeld staat
  function afterScroll(el, fn) { if (el.getBoundingClientRect().top < innerHeight) return fn(); addEventListener('scroll', function s() { if (scrollY > 150) { removeEventListener('scroll', s); fn(); } }, { passive: true }); }
})();

/* ---------- diensten op telefoon: swipen tussen de disciplines; tabs en puntjes volgen de swipe ---------- */
(function () {
  var mq = window.matchMedia('(max-width: 860px)');
  document.querySelectorAll('.section-svc').forEach(function (section) {
    var wrap = section.querySelector('.svc-panels'), tabs = [].slice.call(section.querySelectorAll('.svc-tab'));
    if (!wrap || !tabs.length) return;
    var panels = [].slice.call(wrap.querySelectorAll('.svc-panel'));
    wrap.setAttribute('data-lenis-prevent', '');
    var dots = document.createElement('div'); dots.className = 'svc-swipe'; dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = panels.map(function () { return '<i></i>'; }).join(''); wrap.after(dots);
    var dotEls = [].slice.call(dots.children), current = -1, raf = 0;
    function mark(i) {
      if (i === current) return; current = i;
      tabs.forEach(function (t, k) { var on = k === i; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
      dotEls.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      var t = tabs[i]; if (t && t.parentNode.scrollTo) t.parentNode.scrollTo({ left: t.offsetLeft - 16, behavior: 'smooth' });
    }
    function nearest() {
      var x = wrap.scrollLeft, best = 0, bd = 1e9;
      panels.forEach(function (p, k) { var d = Math.abs(p.offsetLeft - wrap.offsetLeft - x - parseFloat(getComputedStyle(wrap).paddingLeft || 0) + 0); if (d < bd) { bd = d; best = k; } });
      return best;
    }
    wrap.addEventListener('scroll', function () {
      if (!mq.matches) return;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { mark(nearest()); });
    }, { passive: true });
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () {
        if (!mq.matches) return;
        var p = panels[k]; wrap.scrollTo({ left: p.offsetLeft - wrap.offsetLeft - parseFloat(getComputedStyle(wrap).paddingLeft || 0), behavior: 'smooth' });
      });
    });
    var start = panels.findIndex(function (p) { return p.classList.contains('is-active'); });
    mark(start < 0 ? 0 : start);
  });
})();

/* ---------- volgende pagina alvast ophalen bij aanraken/aanwijzen van een link.
   Chrome doet dit al via speculationrules; Brave, Safari en Firefox niet, vandaar deze eigen variant. ---------- */
(function () {
  if (window.__warmLinks) return; window.__warmLinks = 1;
  if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) return;
  var c = navigator.connection; if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return;
  var done = {}, timer = 0;
  function warm(a) {
    if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname === location.pathname || /\.(pdf|zip|jpe?g|png|webp|mp4)$/i.test(u.pathname)) return;
    var k = u.pathname + u.search; if (done[k]) return; done[k] = 1;
    fetch(k, { credentials: 'same-origin', priority: 'low' }).then(function (r) { return r.text(); }).catch(function () { delete done[k]; });
  }
  addEventListener('touchstart', function (e) { warm(e.target.closest && e.target.closest('a[href]')); }, { passive: true, capture: true });
  addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); clearTimeout(timer);
    if (a) timer = setTimeout(function () { warm(a); }, 70);
  }, { passive: true });
})();
