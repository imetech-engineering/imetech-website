/* ===== PREVIEW: scroll-effecten voor de homepage =====
   Alleen actief met de vlag ?preview=scroll (zie het inline script in de <head> van index.html).
   Zonder vlag wordt dit bestand niet geladen. Uitzetten: ?preview=off */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('fx')) return;

  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }

  // ----- Eigen scroll-lus: één requestAnimationFrame per frame voor alle effecten -----
  var handlers = [];
  var ticking = false;
  function run() {
    ticking = false;
    var vh = window.innerHeight;
    handlers.forEach(function (fn) { fn(vh); });
  }
  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(run); }
  }

  // ----- Hero: zoomt uit met diepte, inhoud blijft achter terwijl de pagina eroverheen schuift -----
  function initHero() {
    var hero = document.querySelector('.hero');
    var frame = hero && hero.querySelector('.stage-frame');
    if (!hero || !frame) return;
    var scale = document.createElement('span');
    scale.className = 'fx-scale';
    scale.setAttribute('aria-hidden', 'true');
    frame.appendChild(scale);
    var last = '';
    handlers.push(function () {
      var h = hero.offsetHeight || 1;
      if (window.scrollY > h * 1.2) return;
      var p = clamp(window.scrollY / h, 0, 1);
      hero.style.setProperty('--fx-h', p.toFixed(4));
      // tekenschaal zoals in het titelblok van een werktekening
      var txt = 'Schaal 1:' + (1 + p * 1.5).toFixed(2);
      if (txt !== last) { scale.textContent = txt; last = txt; }
    });
  }

  // ----- Lopende tekst licht woord voor woord op tijdens het lezen -----
  function initReadText() {
    all('.about-body > p, .case-lead').forEach(function (el) {
      var words = [];
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.nodeValue.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var w = document.createElement('span');
              w.className = 'fx-w';
              w.textContent = part;
              words.push(w);
              frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      })(el);
      words.forEach(function (w, i) { w.style.setProperty('--t', (i / words.length).toFixed(4)); });
      el.classList.add('fx-read');
      handlers.push(function (vh) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) return;
        // start als de tekst onderin komt, klaar als hij halverwege het scherm staat
        var p = clamp((vh * 0.9 - r.top) / (vh * 0.4 + r.height), 0, 1);
        el.style.setProperty('--fx-p', p.toFixed(4));
      });
    });
  }

  // ----- Maatlijnen boven elke sectie, getekend tijdens het scrollen (doorsnede B-B, C-C, ...) -----
  function initDims() {
    var sections = all('main > section').filter(function (s) {
      return !s.classList.contains('hero') && !s.classList.contains('clients') && !s.classList.contains('cta-section');
    });
    sections.forEach(function (section, i) {
      var letter = String.fromCharCode(66 + i); // A is de hero
      var dim = document.createElement('div');
      dim.className = 'wrap fx-dim';
      dim.setAttribute('aria-hidden', 'true');
      dim.innerHTML =
        '<span class="fx-dim-ext fx-dim-ext--l"></span>' +
        '<span class="fx-dim-line"><i></i><i></i></span>' +
        '<span class="fx-dim-ext fx-dim-ext--r"></span>' +
        '<span class="fx-dim-tag">Doorsnede ' + letter + '&ndash;' + letter + '</span>';
      section.classList.add('fx-dim-host');
      section.insertBefore(dim, section.firstChild);
      handlers.push(function (vh) {
        var r = section.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        dim.style.setProperty('--fx-d', clamp((vh * 0.95 - r.top) / (vh * 0.4), 0, 1).toFixed(4));
      });
    });
  }

  // ----- Beelden en CTA openen zich als een uitsnede die meeschuift met de scroll -----
  function initClips() {
    all('.about-photo, .case-media, .cta-section .wrap').forEach(function (el) {
      handlers.push(function (vh) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.setProperty('--fx-c', clamp((vh - r.top) / (vh * 0.55), 0, 1).toFixed(4));
      });
    });
  }

  // ----- Werkwijze: stappen stapelen als tekenbladen, het vorige blad schuift iets naar achteren -----
  function initSheets() {
    var list = document.querySelector('.section-steps .steps');
    if (!list) return;
    var steps = all('.step', list);
    if (steps.length < 2) return;
    list.classList.add('fx-sheets');
    var tops = [];
    steps.forEach(function (step, i) {
      step.style.setProperty('--i', i);
      var block = document.createElement('span');
      block.className = 'fx-sheet-block';
      block.setAttribute('aria-hidden', 'true');
      block.innerHTML = '<span>Blad</span><b>' + String(i + 1).padStart(2, '0') + '/' + String(steps.length).padStart(2, '0') + '</b>';
      step.appendChild(block);
    });
    function measure() {
      tops = steps.map(function (step) { return parseFloat(getComputedStyle(step).top) || 0; });
    }
    measure();
    window.addEventListener('resize', measure, { passive: true });

    handlers.push(function (vh) {
      var r = list.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      // hoeveel van elk blad over het vorige heen ligt (0 = nog onderweg, 1 = volledig erop)
      var cover = steps.map(function (step, i) {
        if (i === 0) return 0;
        var t = step.getBoundingClientRect().top;
        return clamp(1 - (t - tops[i]) / Math.max(step.offsetHeight, 1), 0, 1);
      });
      steps.forEach(function (step, i) {
        var depth = 0;
        for (var j = i + 1; j < steps.length; j++) depth += cover[j];
        step.style.setProperty('--fx-s', Math.min(depth, 3).toFixed(4));
      });
    });
  }

  // ----- Herkenbaar label zolang de preview aanstaat, met knop om uit te zetten -----
  function initBadge() {
    var badge = document.createElement('div');
    badge.className = 'fx-badge';
    badge.innerHTML = '<i aria-hidden="true"></i><span>Preview &middot; scroll-effecten</span><a href="?preview=off">Uitzetten</a>';
    document.body.appendChild(badge);
  }

  onReady(function () {
    initHero();
    initReadText();
    initDims();
    initClips();
    initSheets();
    initBadge();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    window.addEventListener('load', request);
    request();
  });
})();
