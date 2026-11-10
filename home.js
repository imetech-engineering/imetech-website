/* IMeTech preview v3 — beweging met GSAP (ScrollTrigger, SplitText) en Lenis.
   Alles wat beweegt valt terug op een statische, volledig leesbare pagina bij
   prefers-reduced-motion of als de bibliotheken niet laden. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.classList.contains('rm');
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- header, menu ---------- */
  var hdr = $('#hdr');
  var lastY = 0;
  function onScrollHeader(y) {
    hdr.classList.toggle('is-solid', y > 40);
    var goingDown = y > lastY && y > window.innerHeight * 0.9;
    hdr.classList.toggle('is-hidden', goingDown && !document.body.classList.contains('menu-open'));
    lastY = y;
  }
  window.addEventListener('scroll', function () { onScrollHeader(window.scrollY); }, { passive: true });
  var burger = $('.hdr-burger'), mnav = $('#mnav');
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    mnav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { burger.click(); }); });

  /* ---------- logo-strip: lijst verdubbelen voor naadloze lus ---------- */
  var track = $('.marquee-track');
  if (track) $$('li', track).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });

  /* ---------- opdrachtgevers: logo's lichten op naarmate de cursor nadert ---------- */
  var strip = $('.clients');
  if (strip && finePointer && !reduce) {
    var nearFrame = null, lastE = null;
    var updateNear = function () {
      nearFrame = null;
      $$('.marquee-track img', strip).forEach(function (img) {
        var r = img.getBoundingClientRect();
        var dx = lastE.clientX - (r.left + r.width / 2), dy = lastE.clientY - (r.top + r.height / 2);
        var near = Math.max(0, Math.min(1, 1 - Math.sqrt(dx * dx + dy * dy) / 260));
        img.style.setProperty('--near', near.toFixed(3));
      });
      // de strip loopt door: zolang de muis erboven staat blijven meten
      if (lastE) nearFrame = requestAnimationFrame(updateNear);
    };
    strip.addEventListener('pointermove', function (e) { lastE = e; if (!nearFrame) nearFrame = requestAnimationFrame(updateNear); }, { passive: true });
    strip.addEventListener('pointerleave', function () {
      lastE = null; if (nearFrame) cancelAnimationFrame(nearFrame); nearFrame = null;
      $$('.marquee-track img', strip).forEach(function (img) { img.style.setProperty('--near', '0'); });
    });
  }

  /* ---------- 3D-animaties: pas laden en spelen als ze in beeld zijn ---------- */
  var smallScreen = window.innerWidth < 900;
  $$('.vcard video').forEach(function (v) {
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) {
        if (!v.dataset.loaded) { v.src = smallScreen && v.dataset.srcSm ? v.dataset.srcSm : v.dataset.src; v.dataset.loaded = '1'; }
        if (!reduce) v.play().catch(function () {});
      } else v.pause();
    }, { rootMargin: '150px 0px' }).observe(v);
  });

  /* ---------- reviews wisselen ---------- */
  var quotes = $$('.quote'), qi = 0;
  if (quotes.length > 1 && !reduce) setInterval(function () {
    quotes[qi].classList.remove('is-on'); qi = (qi + 1) % quotes.length; quotes[qi].classList.add('is-on');
  }, 5500);

  /* ---------- FAQ: vloeiend open en dicht ---------- */
  $$('.faq-list details').forEach(function (d) {
    var sum = $('summary', d), body = $('p', d), anim = null;
    if (!d.animate) return;
    sum.addEventListener('click', function (e) {
      if (reduce) return;
      e.preventDefault();
      var border = d.offsetHeight - d.clientHeight;
      var from = d.offsetHeight, closing = d.open && !d.classList.contains('closing');
      if (anim) anim.cancel();
      d.style.overflow = 'hidden';
      var to;
      if (closing) { d.classList.add('closing'); to = sum.offsetHeight + border; }
      else {
        d.classList.remove('closing'); d.open = true; to = sum.offsetHeight + body.offsetHeight + border;
        body.animate({ opacity: [0, 1], transform: ['translateY(-6px)', 'none'] }, { duration: 500, delay: 80, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      }
      anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: closing ? 420 : 560, easing: 'cubic-bezier(.22,1,.36,1)' });
      anim.onfinish = function () {
        if (closing) { d.open = false; d.classList.remove('closing'); }
        d.style.overflow = ''; anim = null;
      };
    });
  });

  /* ---------- puntenraster dat op de cursor reageert ---------- */
  function Field(canvas) {
    var ctx = canvas.getContext('2d');
    var host = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, pts = [], gap = 30;
    var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    var visible = false, raf = 0, t0 = performance.now();

    function build() {
      var r = host.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = w < 700 ? 24 : 30;
      pts = [];
      var ox = (w % gap) / 2, oy = (h % gap) / 2;
      for (var y = oy; y <= h; y += gap) for (var x = ox; x <= w; x += gap) pts.push({ x: x, y: y, dx: 0, dy: 0 });
    }
    function frame(now) {
      raf = 0;
      var t = (now - t0) / 1000;
      if (!mouse.active) { // op touch of zonder muis: een rustig dwalend punt
        mouse.tx = w * (0.5 + 0.32 * Math.sin(t * 0.23));
        mouse.ty = h * (0.5 + 0.28 * Math.sin(t * 0.31 + 1));
      }
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      ctx.clearRect(0, 0, w, h);
      var R = Math.min(220, Math.max(140, w * 0.16)), R2 = R * R;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var vx = p.x - mouse.x, vy = p.y - mouse.y, d2 = vx * vx + vy * vy;
        var f = 0, tx = 0, ty = 0;
        if (d2 < R2) {
          var d = Math.sqrt(d2) || 1;
          f = 1 - d / R; f = f * f * (3 - 2 * f);
          tx = (vx / d) * f * 14; ty = (vy / d) * f * 14;
        }
        p.dx += (tx - p.dx) * 0.15; p.dy += (ty - p.dy) * 0.15;
        // zachte golf zodat het veld ademt
        var wave = 0.5 + 0.5 * Math.sin(p.x * 0.006 + p.y * 0.004 - t * 0.6);
        var a = 0.10 + wave * 0.07 + f * 0.75;
        var rad = 0.9 + f * 1.6;
        ctx.fillStyle = f > 0.02 ? 'rgba(108,200,242,' + a.toFixed(3) + ')' : 'rgba(150,195,235,' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x + p.dx, p.y + p.dy, rad, 0, 6.2832); ctx.fill();
      }
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    build(); frame(performance.now());
    if (reduce) return;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(host);
    if (finePointer) {
      host.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
        if (!mouse.active) { mouse.active = true; }
      });
      host.addEventListener('pointerleave', function () { mouse.active = false; });
    }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); start(); }, 150); });
  }
  // puntenraster pas starten als de pagina geladen is, zodat de eerste weergave niet wacht
  function startFields() { $$('canvas.field').forEach(function (c) { Field(c); }); }
  if (document.readyState === 'complete') setTimeout(startFields, 50);
  else window.addEventListener('load', function () { (window.requestIdleCallback || setTimeout)(startFields, { timeout: 800 }); });

  /* ---------- video's: juiste bron, alleen spelen als zichtbaar ---------- */
  /* ---------- hover-3D: kaarten kantelen licht naar de cursor (alleen muis, niet bij reduced motion) ---------- */
  (function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.wcard').forEach(function (card) {
      var glare = card.querySelector('.wimg') || card, raf = 0;
      card.classList.add('tilt'); glare.classList.add('tilt-glare'); var shine = document.createElement('span'); shine.className = 'tilt-shine'; shine.setAttribute('aria-hidden', 'true'); glare.appendChild(shine);
      card.addEventListener('pointermove', function (e) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          card.classList.add('is-tilting');
          card.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
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
    var els = [].filter.call(document.querySelectorAll('.hero-proof b'), function (b) {
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

  /* ---------- 3D exploded view: alleen met WebGL, Three.js pas laden als de sectie dichtbij is ---------- */
  (function () {
    var xp = document.querySelector('[data-xp]'), ok = false;
    if (!xp || !('IntersectionObserver' in window)) return;
    try { var c = document.createElement('canvas'); ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
    if (!ok) return;
    root.classList.add('has-xp');
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return; io.disconnect();
      import('/xplode.js?v=28').then(function (m) { return m.init(xp); }).catch(function () { root.classList.remove('has-xp'); });
    }, { rootMargin: '120% 0px' });
    io.observe(xp);
  })();

  /* ---------- zonder GSAP of met reduced motion: hier stoppen ---------- */
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    root.classList.add('rm');
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
  var EASE = 'expo.out';

  /* ---------- Lenis: soepel scrollen, alleen met muis/trackpad ---------- */
  if (finePointer && window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, anchors: { offset: -80 }, prevent: function (n) { return n.closest && n.closest('.floating-cta'); } });
    lenis.on('scroll', function (e) { ST.update(); onScrollHeader(e.scroll); });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- koppen regel voor regel ---------- */
  $$('[data-split]').forEach(function (el) {
    if (el.closest('.hero')) return; // hero-kop animeert via CSS, direct bij laden
    var inHero = false;
    gsap.set(el, { visibility: 'visible' });
    if (!window.SplitText) { gsap.from(el, { y: 30, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: inHero ? null : { trigger: el, start: 'top 85%' } }); return; }
    window.SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, {
          yPercent: 110, onComplete: function () { (self.masks || []).forEach(function (m) { m.style.overflow = 'visible'; }); }, duration: inHero ? 1.4 : 1.2, ease: EASE, stagger: 0.09, delay: inHero ? 0.15 : 0,
          scrollTrigger: inHero ? null : { trigger: el, start: 'top 85%', once: true }
        });
      }
    });
  });

  /* ---------- statement: woorden lichten een voor een op terwijl je scrolt ---------- */
  $$('[data-words]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' ');
    gsap.fromTo($$('.w', el), { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: 0.6 } });
  });

  /* ---------- case: printspoor loopt langs de stappen, elk punt licht op als het spoor er is ---------- */
  $$('.case-steps').forEach(function (list) {
    var trace = document.createElement('span'); trace.className = 'case-trace'; trace.setAttribute('aria-hidden', 'true');
    list.classList.add('has-trace'); list.appendChild(trace);
    gsap.to(trace, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 } });
    $$('li', list).forEach(function (li) {
      ST.create({ trigger: li, start: 'top+=22 62%', onEnter: function () { li.classList.add('is-on'); }, onLeaveBack: function () { li.classList.remove('is-on'); } });
    });
  });

  /* ---------- visualisatie: schermen kantelen van schuin naar recht ---------- */
  $$('.vids .vcard-media').forEach(function (m, i) {
    gsap.fromTo(m, { rotationX: 22, rotationY: i ? -6 : 6, y: 70, scale: 0.92, transformOrigin: '50% 100%' },
      { rotationX: 0, rotationY: 0, y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'top 45%', scrub: 0.8 } });
  });

  /* ---------- zachte fade-ups ---------- */
  $$('.fade-up').forEach(function (el) {
    if (el.closest('.hero')) return;
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---------- hero wijkt bij wegscrollen ---------- */
  gsap.to('.hero-inner', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  var mm = gsap.matchMedia();

  /* ---------- hero: projectfoto's komen binnen en wijken bij scrollen ---------- */
  var tiles = $$('.htile');
  mm.add('(min-width: 901px)', function () {
    // binnenkomen van de tegels gebeurt via CSS (home.css), direct bij laden
    tiles.forEach(function (t) {
      var right = t.classList.contains('t4') || t.classList.contains('t5') || t.classList.contains('t6');
      var d = parseFloat(t.dataset.depth || '1');
      gsap.to(t, { yPercent: -30 * d, ease: 'none', // alleen lichte diepte, blijven gewoon zichtbaar
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
  });
  mm.add('(max-width: 900px)', function () {
    // op telefoons geen intro-animatie: de foto's staan meteen in beeld (snelste laadtijd)
  });

  /* ---------- werk: beeld opent als uitsnede en zoomt zacht uit ---------- */
  $$('.wcard').forEach(function (card) {
    var box = $('.wimg', card), img = $('img', box);
    gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', once: true } })
      .fromTo(box, { clipPath: 'inset(18% 8% 18% 8% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.5, ease: 'expo.inOut' })
      .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0)
      .from($('.wmeta', card), { opacity: 0, y: 20, duration: 1, ease: EASE }, 0.5);
  });

  /* ---------- case: beeld opent als uitsnede ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.case-media', start: 'top 85%', once: true } })
    .fromTo('.case-media', { clipPath: 'inset(12% 6% 12% 6% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.5, ease: 'expo.inOut' })
    .fromTo('.case-media img', { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0);
  gsap.from('.case-steps li', { opacity: 0, y: 20, duration: 1, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: '.case-steps', start: 'top 85%', once: true } });

  /* ---------- over mij: portret ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.about-photo', start: 'top 85%', once: true } })
    .fromTo('.about-photo', { clipPath: 'inset(100% 0 0 0 round 22px)' }, { clipPath: 'inset(0% 0 0 0 round 22px)', duration: 1.5, ease: 'expo.inOut' })
    .fromTo('.about-photo img', { scale: 1.25 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0);

  /* ---------- footer ---------- */
  gsap.from('.ftr-cols > *', { opacity: 0, y: 24, duration: 1, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: '.ftr-cols', start: 'top 90%', once: true } });

  /* ---------- werkwijze: vorige kaart zakt iets weg als de volgende eroverheen schuift (desktop) ---------- */
  mm.add('(min-width: 901px)', function () {
    var cards = $$('.scard');
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (!next) return;
      gsap.to(card, { scale: 0.94, '--dim': 0.28, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top ' + (96 + (i + 1) * 16) + 'px', scrub: true } });
    });
  });
  /* ---------- werkwijze op telefoons: zelfde stapeling; een kaart hoger dan het scherm blijft pas staan als de onderkant in beeld is ---------- */
  mm.add('(max-width: 900px)', function () {
    var cards = $$('.scard');
    function stick(card, i) {
      return Math.min(76 + i * 10, document.documentElement.clientHeight - card.offsetHeight - 12);
    }
    function measure() {
      cards.forEach(function (card, i) { card.style.setProperty('--stick', stick(card, i) + 'px'); });
    }
    cards.forEach(function (card) { card.classList.add('is-stacked'); });
    measure();
    ScrollTrigger.addEventListener('refreshInit', measure);
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (!next) return;
      gsap.to(card, { scale: 0.94, '--dim': 0.28, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: function () { return 'top ' + stick(next, i + 1) + 'px'; }, scrub: true, invalidateOnRefresh: true } });
    });
    return function () {
      ScrollTrigger.removeEventListener('refreshInit', measure);
      cards.forEach(function (card) { card.classList.remove('is-stacked'); card.style.removeProperty('--stick'); });
    };
  });

  gsap.utils.toArray('.scard').forEach(function (card) {
    gsap.from(card.querySelector('.scard-num'), { yPercent: 40, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
  });

  /* ---------- (oude werkwijze-lijn verwijderd) ---------- */
  gsap.from('.disc-list li', { opacity: 0, y: 24, duration: 1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: '.disc-list', start: 'top 85%', once: true } });

  /* ---------- alleen met muis: magnetische knoppen, meelopend beeld, 'Bekijk' ---------- */
  if (!finePointer) return;

  $$('[data-magnetic]').forEach(function (el) {
    var strength = parseFloat(el.dataset.strength || '0.3');
    var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', function () {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
    });
  });

  // Eén centrale cursor-toestand. Tijdens scrollen beweegt de muis niet, dus
  // pointerenter/leave vuren dan niet: daarom bij elke scroll opnieuw kijken
  // wat er onder de (stilstaande) cursor ligt.
  var flt = $('.disc-float'), fltImgs = $$('img', flt), fltFront = 0, pill = $('.view-pill');
  // alle dienstbeelden vooraf laden, zodat er bij hover niets hoeft te wachten
  $$('.disc-list a').forEach(function (a) { var im = new Image(); im.src = a.dataset.img; });
  // zacht overvloeien: nieuw beeld komt op de achterste laag binnen en schuift er licht ingezoomd overheen
  function crossfadeTo(src) {
    var next = fltImgs[1 - fltFront], cur = fltImgs[fltFront];
    fltFront = 1 - fltFront;
    var show = function () {
      gsap.set(next, { zIndex: 2 }); gsap.set(cur, { zIndex: 1 });
      gsap.fromTo(next, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', overwrite: true });
      gsap.to(cur, { opacity: 0, duration: 0.6, delay: 0.15, ease: 'power2.out', overwrite: true });
    };
    if (next.getAttribute('src') === src) { show(); return; }
    next.src = src;
    if (next.decode) next.decode().then(show, show); else show();
  }
  gsap.set(flt, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });
  gsap.set(pill, { xPercent: -50, yPercent: -50, scale: 0 });
  root.classList.add('fx');
  var fx = gsap.quickTo(flt, 'x', { duration: 0.55, ease: 'power3.out' });
  var fy = gsap.quickTo(flt, 'y', { duration: 0.55, ease: 'power3.out' });
  var frot = gsap.quickTo(flt, 'rotation', { duration: 0.8, ease: 'power3.out' });
  var px = gsap.quickTo(pill, 'x', { duration: 0.45, ease: 'power3.out' });
  var py = gsap.quickTo(pill, 'y', { duration: 0.45, ease: 'power3.out' });
  var mouse = { x: -1, y: -1, lastX: 0 }, pillOn = false, fltOn = false, fltSrc = '';

  function showPill(on) {
    if (on === pillOn) return; pillOn = on;
    gsap.to(pill, on ? { scale: 1, duration: 0.5, ease: 'back.out(1.6)', overwrite: 'auto' } : { scale: 0, duration: 0.3, ease: 'power3.in', overwrite: 'auto' });
  }
  function showFloat(on) {
    if (on === fltOn) return; fltOn = on;
    gsap.to(flt, on ? { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' } : { opacity: 0, scale: 0.6, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
  }
  function sync(jump) {
    if (mouse.x < 0) return;
    var el = document.elementFromPoint(mouse.x, mouse.y);
    var card = el && el.closest('.wcard, .htile, .vcard, .case-media');
    if (card && card.classList.contains('htile') && gsap.getProperty(card, 'opacity') < 0.35) card = null; // weggescrolde hero-tegel
    var disc = el && el.closest('.disc-list a');
    if (card && !pillOn) gsap.set(pill, { x: mouse.x, y: mouse.y });
    if (disc) {
      if (fltSrc !== disc.dataset.img) { fltSrc = disc.dataset.img; crossfadeTo(fltSrc); }
      if (!fltOn) gsap.set(flt, { x: mouse.x, y: mouse.y });
    }
    showPill(!!card); showFloat(!!disc);
    px(mouse.x); py(mouse.y); fx(mouse.x); fy(mouse.y);
    if (!jump) { frot(gsap.utils.clamp(-8, 8, (mouse.x - mouse.lastX) * 0.4)); mouse.lastX = mouse.x; }
    else frot(0);
  }
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; sync(false); }, { passive: true });
  window.addEventListener('scroll', function () { sync(true); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () { mouse.x = -1; showPill(false); showFloat(false); });

  // hero: tegels bewegen op diepte met de muis mee
  var tileMovers = tiles.map(function (t) {
    var inner = $('.htile-img', t), d = parseFloat(t.dataset.depth || '1');
    return { d: d, x: gsap.quickTo(inner, 'x', { duration: 1.2, ease: 'power3.out' }), y: gsap.quickTo(inner, 'y', { duration: 1.2, ease: 'power3.out' }) };
  });
  $('#hero').addEventListener('pointermove', function (e) {
    var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
    tileMovers.forEach(function (m) { m.x(-nx * 40 * m.d); m.y(-ny * 30 * m.d); });
  });
})();
