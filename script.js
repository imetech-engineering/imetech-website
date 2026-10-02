(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== PERF PROFILE: Brave chokes on CSS blur/backdrop-filter during scroll =====
  (function initPerfProfile() {
    if (typeof navigator.brave !== 'undefined') {
      document.documentElement.classList.add('perf-lite');
      window.__imetechPerfLite = true;
    }
  })();

  // ===== SCROLL TOP ON LOAD (mobile viewport units can offset initial position) =====
  (function ensureTopOnLoad() {
    if (window.location.hash) return;

    function scrollTop() {
      window.scrollTo(0, 0);
    }

    scrollTop();
    window.addEventListener('DOMContentLoaded', scrollTop, { once: true });
    window.addEventListener('load', scrollTop, { once: true });
    window.addEventListener('pageshow', function (e) {
      if (window.location.hash || e.persisted) return;
      scrollTop();
    });
  })();

  // ===== SCROLL PERF: pause heavy effects while the user scrolls =====
  (function initScrollPerf() {
    var scrollEndTimer = null;
    window.addEventListener('scroll', function () {
      if (!document.documentElement.classList.contains('is-scrolling')) {
        document.documentElement.classList.add('is-scrolling');
      }
      if (scrollEndTimer) window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(function () {
        document.documentElement.classList.remove('is-scrolling');
        window.dispatchEvent(new Event('imetech:scrollend'));
      }, 120);
    }, { passive: true, capture: true });
    window.__imetechIsScrolling = function () {
      return document.documentElement.classList.contains('is-scrolling');
    };
  })();

  // ===== HERO ANIMATIONS (first — must not wait on other init) =====
  (function initHeroAnimationsEarly() {
    if (window.__imetechHeroAnimationsReady) return;

    try {

    function heroReduceMotion() {
      try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {
        return false;
      }
    }

    function initKenBurnsCarousel(slideSelector, endScale) {
      var fadeMs = 1500;
      var interval = 5000;

      function deferSlideBackground(slide) {
        var bg = slide.style.backgroundImage;
        if (!bg) return;
        var match = bg.match(/url\(['"]?([^'")]+)/);
        if (match) {
          slide.setAttribute('data-bg', match[1]);
          slide.style.backgroundImage = '';
        }
      }

      function loadSlideBackground(slide) {
        var bg = slide.getAttribute('data-bg');
        if (bg && !slide.style.backgroundImage) {
          slide.style.backgroundImage = "url('" + bg + "')";
        }
      }

      function resetSlide(slide) {
        slide.classList.remove('active', 'slide-exiting');
        slide.style.transform = '';
        slide.style.opacity = '';
        slide.style.zIndex = '';
      }

      var slideEls = Array.prototype.slice.call(document.querySelectorAll(slideSelector));
      if (slideEls.length <= 1 || prefersReduced || heroReduceMotion()) return;

      var slidesRoot = slideEls[0].parentNode;
      if (slidesRoot) slidesRoot.setAttribute('data-hero-slideshow', 'js');

      slideEls.forEach(function (slide, index) {
        if (index > 0) deferSlideBackground(slide);
      });

      var parent = slideEls[0].parentNode;
      for (var i = slideEls.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = slideEls[i];
        slideEls[i] = slideEls[j];
        slideEls[j] = tmp;
      }
      slideEls.forEach(function (s) { parent.appendChild(s); });
      slideEls.forEach(resetSlide);
      slideEls[0].classList.add('active');
      loadSlideBackground(slideEls[0]);

      var current = 0;
      function nextSlide() {
        var outgoing = slideEls[current];
        outgoing.style.transform = 'scale(' + endScale + ')';
        outgoing.classList.remove('active');
        outgoing.classList.add('slide-exiting');

        current = (current + 1) % slideEls.length;
        var incoming = slideEls[current];
        resetSlide(incoming);
        loadSlideBackground(incoming);
        void incoming.offsetWidth;
        incoming.classList.add('active');

        window.setTimeout(function () {
          outgoing.style.transform = '';
          outgoing.classList.remove('slide-exiting');
        }, fadeMs);
      }

      setInterval(nextSlide, interval);
    }

    initKenBurnsCarousel('.page-hero-slide', 1.08);
    document.documentElement.classList.add('hero-js-ready');
    window.__imetechHeroAnimationsReady = true;
    } catch (heroErr) { }
  })();

  // ===== HERO STATS COUNTER (home) =====
  // De HTML bevat de echte waarden (voor crawlers en no-JS); hier tellen we ze op tijdens de fade-in.
  (function initHeroCounters() {
    var counters = document.querySelectorAll('.hero-stat-num[data-count]');
    if (!counters.length || prefersReduced) return;
    var duration = 1800;

    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-suffix') || '';
      el.textContent = '0' + suffix;

      window.setTimeout(function () {
        var startTime = null;
        function renderFrame(now) {
          if (startTime === null) startTime = now;
          var progress = Math.min((now - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.min(target, Math.round(target * eased)) + suffix;
          if (progress < 1) requestAnimationFrame(renderFrame);
        }
        requestAnimationFrame(renderFrame);
      }, 700);

      // Vangnet: als rAF niet loopt (achtergrondtab, renderer van een crawler) toch de eindwaarde tonen
      window.setTimeout(function () {
        el.textContent = target + suffix;
      }, 700 + duration + 200);
    });
  })();

  // ===== HERO STAGE (home): 3D-projectvideo's wisselen in de viewport =====
  (function initHeroStage() {
    var stage = document.getElementById('hero-stage');
    if (!stage) return;
    var slides = Array.prototype.slice.call(stage.querySelectorAll('.stage-slide'));
    var figEl = stage.querySelector('.stage-fig');
    var titleEl = stage.querySelector('.stage-title');
    var metaEl = stage.querySelector('.stage-meta');
    var linkEl = stage.querySelector('.stage-link');
    var dotsEl = stage.querySelector('.stage-dots');
    if (!slides.length || !figEl || !titleEl || !metaEl || !linkEl || !dotsEl) return;

    var figPrefix = stage.getAttribute('data-fig') || 'Fig.';
    var linkLabel = stage.getAttribute('data-link-label') || '';
    var intervalMs = 8000;
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var canPlay = !prefersReduced && !saveData;
    // Kleine schermen krijgen de 640px-variant van de video
    var useSmall = stage.clientWidth * Math.min(window.devicePixelRatio || 1, 2) < 700;
    var current = 0;
    var timer = null;
    var inView = true;

    stage.style.setProperty('--stage-ms', intervalMs + 'ms');
    if (!canPlay) stage.classList.add('is-static');

    function loadSlide(slide, withVideo) {
      var poster = slide.getAttribute('data-poster');
      if (poster && !slide.getAttribute('poster')) slide.setAttribute('poster', poster);
      if (withVideo && canPlay && !slide.getAttribute('src')) {
        slide.src = (useSmall && slide.getAttribute('data-src-sm')) || slide.getAttribute('data-src');
      }
    }

    function playCurrent() {
      if (!canPlay || !inView || document.hidden) return;
      var p = slides[current].play();
      if (p && p.catch) p.catch(function () { });
    }

    var dots = slides.map(function (slide, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'stage-dot';
      dot.setAttribute('aria-label', slide.getAttribute('data-title') || String(index + 1));
      dot.addEventListener('click', function () { show(index); restart(); });
      dotsEl.appendChild(dot);
      return dot;
    });

    function show(index) {
      index = (index + slides.length) % slides.length;
      var previous = slides[current];
      var next = slides[index];
      loadSlide(next, true);
      if (previous !== next) {
        previous.classList.remove('is-active');
        window.setTimeout(function () {
          if (!previous.classList.contains('is-active')) previous.pause();
        }, 1000);
      }
      next.classList.add('is-active');
      current = index;
      playCurrent();

      var title = next.getAttribute('data-title') || '';
      figEl.textContent = figPrefix + ' ' + (index < 9 ? '0' : '') + (index + 1);
      titleEl.textContent = title;
      metaEl.textContent = next.getAttribute('data-meta') || '';
      linkEl.setAttribute('href', next.getAttribute('data-href') || '#');
      linkEl.setAttribute('aria-label', linkLabel ? linkLabel + ': ' + title : title);
      dots.forEach(function (dot, i) {
        dot.classList.remove('is-active');
        dot.removeAttribute('aria-current');
      });
      void dots[index].offsetWidth; // herstart de voortgangsanimatie
      dots[index].classList.add('is-active');
      dots[index].setAttribute('aria-current', 'true');

      // poster van de volgende alvast klaarzetten voor een vloeiende overgang
      loadSlide(slides[(index + 1) % slides.length], false);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function restart() {
      stop();
      if (!canPlay || !inView || document.hidden || slides.length < 2) return;
      timer = window.setInterval(function () { show(current + 1); }, intervalMs);
    }

    function resume() {
      show(current);
      restart();
    }

    function suspend() {
      stop();
      slides[current].pause();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = !!(entries[0] && entries[0].isIntersecting);
        if (inView) resume(); else suspend();
      }, { threshold: 0.15 }).observe(stage);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) suspend(); else if (inView) resume();
    });

    // Swipen op touchscreens: horizontaal vegen = volgend/vorig model
    var frame = stage.querySelector('.stage-frame') || stage;
    var swipeX = null;
    var swipeY = 0;
    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      swipeX = e.clientX;
      swipeY = e.clientY;
    }, { passive: true });
    frame.addEventListener('pointerup', function (e) {
      if (swipeX === null) return;
      var dx = e.clientX - swipeX;
      var dy = e.clientY - swipeY;
      swipeX = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      show(current + (dx < 0 ? 1 : -1));
      restart();
      stage.classList.add('was-swiped');
    });
    frame.addEventListener('pointercancel', function () { swipeX = null; });

    show(0);
    restart();
  })();

  // ===== GOOGLE ANALYTICS 4 (gtag) — only with analytics consent =====
  var GA_MEASUREMENT_ID = 'G-1LP253W3VD';
  var memoryCookieConsent = null;

  function safeGetCookieConsent() {
    try {
      var stored = localStorage.getItem('cookieConsent');
      if (stored !== null) return stored;
    } catch (e) { }
    return memoryCookieConsent;
  }

  function safeSetCookieConsent(value) {
    memoryCookieConsent = value;
    try {
      localStorage.setItem('cookieConsent', value);
    } catch (e) { }
  }

  function safeRemoveCookiePreferences() {
    memoryCookieConsent = null;
    ['cookieConsent', 'cookiePreferences', 'cookieSettings'].forEach(function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) { }
    });
  }

  function hasAnalyticsConsent() {
    var c = safeGetCookieConsent();
    if (!c) return false;
    if (c === 'all') return true;
    try {
      var o = JSON.parse(c);
      return Boolean(o && o.analytics);
    } catch (e) {
      return false;
    }
  }

  function trackGtagEvent(eventName, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params || {});
  }

  function loadGoogleAnalyticsIfConsented() {
    if (!hasAnalyticsConsent() || window.__imetechGtagLoaded) return;
    window.__imetechGtagLoaded = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  window.loadGoogleAnalyticsIfConsented = loadGoogleAnalyticsIfConsented;
  loadGoogleAnalyticsIfConsented();

  // ===== COOKIE CONSENT BANNER (run early so openCookieSettings is available before footer loads) =====
  (function () {
    function getOrCreateConsentBackdrop() {
      var backdrop = document.getElementById('consent-backdrop');
      if (backdrop) return backdrop;
      backdrop = document.createElement('div');
      backdrop.id = 'consent-backdrop';
      backdrop.className = 'consent-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
      return backdrop;
    }

    // keepBackdrop: de achtergrond blijft staan omdat er direct een volgende popup komt
    function hideCookieBanner(banner, keepBackdrop) {
      if (!banner) return;
      var backdrop = keepBackdrop ? null : document.getElementById('consent-backdrop');
      banner.classList.remove('consent-visible');
      if (backdrop) backdrop.classList.remove('consent-backdrop-visible');
      var finished = false;
      function finishHide() {
        if (finished) return;
        finished = true;
        banner.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
      }
      banner.addEventListener('transitionend', function onHideEnd(event) {
        if (event.target !== banner || event.propertyName !== 'opacity') return;
        banner.removeEventListener('transitionend', onHideEnd);
        finishHide();
      });
      setTimeout(finishHide, 500);
    }

    function animateBannerIn(el) {
      if (!el) return;
      var backdrop = getOrCreateConsentBackdrop();
      el.style.transform = '';
      el.style.opacity = '';
      backdrop.style.opacity = '';
      backdrop.style.display = 'block';
      el.style.display = 'flex';
      el.classList.remove('consent-visible');
      backdrop.classList.remove('consent-backdrop-visible');
      void el.offsetHeight;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add('consent-visible');
          backdrop.classList.add('consent-backdrop-visible');
        });
      });
    }

    // Op true zetten om "Alleen noodzakelijk" ook op de eerste melding te tonen.
    // Let op: de Autoriteit Persoonsgegevens verwacht dat weigeren op de eerste laag net zo makkelijk is als accepteren.
    var CONSENT_REJECT_ON_FIRST_LAYER = false;

    var COOKIE_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path></svg>';

    function consentTexts() {
      var en = document.documentElement.lang === 'en';
      return en ? {
        title: 'Cookies on this website',
        text: 'I use cookies to keep the website working and, with your permission, to measure how it is used. Read the <a href="/en/privacy-policy/">privacy policy</a>.',
        accept: 'Accept all', prefs: 'Preferences', reject: 'Necessary only', save: 'Save selection',
        prefsTitle: 'Cookie preferences',
        prefsText: 'Choose which cookies you allow. You can change this at any time via "Cookies" in the footer.',
        nec: 'Necessary', necText: 'Required for the website to work, such as remembering this choice. Always on.',
        ana: 'Statistics', anaText: 'Google Analytics: anonymous insight into visits so I can improve the website.',
        close: 'Close'
      } : {
        title: 'Cookies op deze website',
        text: 'Ik gebruik cookies om de website te laten werken en, met jouw toestemming, om te meten hoe hij gebruikt wordt. Lees de <a href="/privacyverklaring/">privacyverklaring</a>.',
        accept: 'Alles accepteren', prefs: 'Voorkeuren', reject: 'Alleen noodzakelijk', save: 'Selectie opslaan',
        prefsTitle: 'Cookievoorkeuren',
        prefsText: 'Kies welke cookies je toestaat. Je kunt dit altijd aanpassen via "Cookies" onderaan de pagina.',
        nec: 'Noodzakelijk', necText: 'Nodig om de website te laten werken, zoals het onthouden van deze keuze. Altijd aan.',
        ana: 'Statistieken', anaText: 'Google Analytics: anonieme inzichten in bezoek, zodat ik de website kan verbeteren.',
        close: 'Sluiten'
      };
    }

    function acceptAll(panel) {
      safeSetCookieConsent('all');
      loadGoogleAnalyticsIfConsented();
      hideCookieBanner(panel);
    }

    // Eerste melding: alleen "Alles accepteren" en "Voorkeuren"
    function showCookieBanner() {
      var existing = document.getElementById('consent-panel');
      if (existing) {
        animateBannerIn(existing);
        return;
      }
      var t = consentTexts();
      var banner = document.createElement('div');
      banner.id = 'consent-panel';
      banner.className = 'consent-panel';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', t.title);
      banner.innerHTML = '<div class="consent-inner">' +
        '<div class="consent-content">' +
        '<div class="consent-icon-wrap">' + COOKIE_ICON + '</div>' +
        '<div class="consent-text"><h3>' + t.title + '</h3><p>' + t.text + '</p></div></div>' +
        '<div class="consent-actions">' +
        (CONSENT_REJECT_ON_FIRST_LAYER ? '<button type="button" class="btn btn-outline consent-necessary">' + t.reject + '</button>' : '') +
        '<button type="button" class="btn btn-outline consent-open-prefs">' + t.prefs + '</button>' +
        '<button type="button" class="btn btn-primary consent-accept">' + t.accept + '</button>' +
        '</div></div>';
      document.body.appendChild(banner);
      animateBannerIn(banner);

      banner.querySelector('.consent-accept').addEventListener('click', function () { acceptAll(banner); });
      banner.querySelector('.consent-open-prefs').addEventListener('click', function () {
        hideCookieBanner(banner, true);
        showCookiePrefs();
      });
      var reject = banner.querySelector('.consent-necessary');
      if (reject) reject.addEventListener('click', function () {
        safeSetCookieConsent('necessary');
        hideCookieBanner(banner);
      });
    }

    // Aparte popup met schakelaars per categorie
    function showCookiePrefs() {
      var old = document.getElementById('consent-modal');
      if (old) old.remove();
      var t = consentTexts();
      var analyticsOn = hasAnalyticsConsent();
      var modal = document.createElement('div');
      modal.id = 'consent-modal';
      modal.className = 'consent-panel consent-panel--modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'consent-modal-title');
      modal.innerHTML = '<div class="consent-inner">' +
        '<div class="consent-modal-head"><h3 id="consent-modal-title">' + t.prefsTitle + '</h3>' +
        '<button type="button" class="consent-close" aria-label="' + t.close + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
        '<p class="consent-modal-text">' + t.prefsText + '</p>' +
        '<div class="consent-rows">' +
        '<label class="consent-row"><span><strong>' + t.nec + '</strong><span>' + t.necText + '</span></span>' +
        '<span class="switch"><input type="checkbox" checked disabled aria-label="' + t.nec + '"><i></i></span></label>' +
        '<label class="consent-row"><span><strong>' + t.ana + '</strong><span>' + t.anaText + '</span></span>' +
        '<span class="switch"><input type="checkbox" class="consent-analytics"' + (analyticsOn ? ' checked' : '') + ' aria-label="' + t.ana + '"><i></i></span></label>' +
        '</div>' +
        '<div class="consent-actions">' +
        '<button type="button" class="btn btn-outline consent-save">' + t.save + '</button>' +
        '<button type="button" class="btn btn-primary consent-accept">' + t.accept + '</button>' +
        '</div></div>';
      document.body.appendChild(modal);
      animateBannerIn(modal);
      var first = modal.querySelector('.consent-analytics');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);

      function close() {
        // zonder vastgelegde keuze terug naar de eerste melding
        if (safeGetCookieConsent()) {
          hideCookieBanner(modal);
        } else {
          hideCookieBanner(modal, true);
          showCookieBanner();
        }
      }

      modal.querySelector('.consent-accept').addEventListener('click', function () { acceptAll(modal); });
      modal.querySelector('.consent-save').addEventListener('click', function () {
        var analytics = !!modal.querySelector('.consent-analytics').checked;
        safeSetCookieConsent(analytics ? 'all' : JSON.stringify({ necessary: true, analytics: false }));
        if (analytics) loadGoogleAnalyticsIfConsented();
        hideCookieBanner(modal);
      });
      modal.querySelector('.consent-close').addEventListener('click', close);
      modal.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }

    // "Cookies" in de footer opent direct de voorkeuren, met de huidige keuze ingevuld
    window.openCookieSettings = function () {
      var modal = document.getElementById('consent-modal');
      if (modal) hideCookieBanner(modal, true);
      showCookieBanner();
    };

    if (!safeGetCookieConsent()) showCookieBanner();

    // Extra recovery path for strict browser shields/extensions:
    // if consent is missing but no banner exists after initial script work, recreate it.
    setTimeout(function () {
      if (!safeGetCookieConsent() && !document.getElementById('consent-panel')) {
        showCookieBanner();
      }
    }, 350);
  })();

  function resetCookiePreferencesAndOpenBanner() {
    if (typeof window.openCookieSettings === 'function') {
      window.openCookieSettings();
      return;
    }
    safeRemoveCookiePreferences();
    window.location.reload();
  }

  function bindCookieSettingsLinks() {
    document.querySelectorAll('[data-cookie-settings-link], .cookie-settings-link').forEach(function (link) {
      if (link.dataset.cookieSettingsBound === 'true') return;
      link.dataset.cookieSettingsBound = 'true';
      link.addEventListener('click', function (event) {
        event.preventDefault();
        resetCookiePreferencesAndOpenBanner();
      });
    });
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var cookieLink = target.closest('[data-cookie-settings-link], .cookie-settings-link');
    if (!cookieLink) {
      var fallbackFooterLink = target.closest('.footer-legal a[href="#"], .footer a[href="#"]');
      if (fallbackFooterLink) {
        var label = (fallbackFooterLink.textContent || '').trim().toLowerCase();
        if (label === 'cookies' || label === 'cookie instellingen' || label === 'cookie settings') {
          cookieLink = fallbackFooterLink;
        }
      }
    }
    if (!cookieLink) return;
    event.preventDefault();
    resetCookiePreferencesAndOpenBanner();
  });

  // ===== COMPONENT LOADER =====
  function loadComponent(containerId, url, timeoutMs) {
    var container = document.getElementById(containerId);
    if (!container) return Promise.resolve();
    var wait = timeoutMs || 2500;
    var fetchPromise = fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var temp = document.createElement('div');
        temp.innerHTML = html;
        while (temp.firstChild) {
          container.parentNode.insertBefore(temp.firstChild, container);
        }
        container.remove();
      })
      .catch(function () { });
    var timeoutPromise = new Promise(function (resolve) {
      window.setTimeout(resolve, wait);
    });
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  var needsLoad =
    document.getElementById('header-container') ||
    document.getElementById('footer-container') ||
    document.getElementById('floating-cta-container');

  var lang = document.documentElement.lang || 'nl';
  var suffix = lang === 'en' ? '-en' : '-nl';
  var googleReviewsUrl = 'https://g.page/r/CV9KoNq0t1d-EBM';
  var googleReviewsByLang = {
    nl: [
      {
        author: 'Nando Kolk',
        rating: 5,
        publishedDate: '2025-09-26',
        text: 'Ik heb de samenwerking met Ivo als ontzettend prettig ervaren. Hij nam de tijd om mijn vragen duidelijk te beantwoorden en dacht actief mee tijdens het hele proces. Zijn technische kennis gaf mij veel vertrouwen en het eindresultaat was precies wat ik voor ogen had. Alles werd professioneel uitgevoerd en ik zou hem zeker opnieuw inschakelen.',
        sourceType: 'google',
        sourceLabel: 'Google Reviews',
        sourceIcon: 'google',
        sourceUrl: googleReviewsUrl,
        publicationPermission: true
      },
      {
        author: 'Nico Provoost',
        rating: 5,
        publishedDate: '2026-03-25',
        text: 'Top discipline en heldere communicatie - absoluut een aanrader.',
        sourceType: 'google',
        sourceLabel: 'Google Reviews',
        sourceIcon: 'google',
        sourceUrl: googleReviewsUrl,
        publicationPermission: true
      },
      {
        author: 'Max van der A',
        rating: 5,
        publishedDate: '2025-12-26',
        text: 'Ivo heeft mij zeer goed geholpen met het ontwikkelen van een custom PCB. Daarbij een duidelijke handleiding gemaakt hoe het werkt. Ivo staat naderhand altijd klaar om te helpen met vragen. Kortom zeker een aanrader!',
        sourceType: 'google',
        sourceLabel: 'Google Reviews',
        sourceIcon: 'google',
        sourceUrl: googleReviewsUrl,
        publicationPermission: true
      }
    ],
    en: [
      {
        author: 'Nando Kolk',
        rating: 5,
        publishedDate: '2025-09-26',
        text: 'I had a very positive collaboration with Ivo. He took time to answer my questions clearly, thought along throughout the process, and delivered exactly what I had in mind.',
        sourceType: 'google',
        sourceLabel: 'Google Reviews',
        sourceIcon: 'google',
        sourceUrl: googleReviewsUrl,
        publicationPermission: true
      },
      {
        author: 'Nico Provoost',
        rating: 5,
        publishedDate: '2026-03-25',
        text: 'Great discipline and clear communication - absolutely recommended.',
        sourceType: 'google',
        sourceLabel: 'Google Reviews',
        sourceIcon: 'google',
        sourceUrl: googleReviewsUrl,
        publicationPermission: true
      },
      {
        author: 'Max van der A',
        rating: 5,
        publishedDate: '2025-12-26',
        text: 'Ivo helped me very well with developing a custom PCB, provided clear documentation, and remained available for follow-up questions.',
        sourceType: 'google',
        sourceLabel: 'Google Reviews',
        sourceIcon: 'google',
        sourceUrl: googleReviewsUrl,
        publicationPermission: true
      }
    ]
  };
  var clientReviewsByLang = {
    nl: [
      {
        author: 'Nando',
        dedupeKey: 'Nando Kolk',
        rating: 5,
        publishedDate: '2025-09-07',
        text: 'Ik heb de samenwerking met Ivo als ontzettend prettig ervaren. Hij nam de tijd om mijn vragen duidelijk te beantwoorden en dacht actief mee tijdens het hele proces. Zijn technische kennis gaf mij veel vertrouwen en het eindresultaat was precies wat ik voor ogen had. Alles werd professioneel uitgevoerd en ik zou hem zeker opnieuw inschakelen.',
        sourceType: 'client',
        sourceLabel: 'Klantreview',
        sourceIcon: 'imetech',
        publicationPermission: true
      },
      {
        author: 'Rutger de Vries',
        rating: 5,
        publishedDate: '2025-11-11',
        text: 'Ik heb de samenwerking met Ivo als zeer fijn ervaren. Ivo heeft in zeer korte tijd een custom PCB ontwikkeld en meegedacht hoe dit geoptimaliseerd kan worden. Kortom adviseer ik IMeTech aan iedereen aan!',
        sourceType: 'client',
        sourceLabel: 'Klantreview',
        sourceIcon: 'imetech',
        publicationPermission: true
      }
    ],
    en: [
      {
        author: 'Nando',
        dedupeKey: 'Nando Kolk',
        rating: 5,
        publishedDate: '2025-09-07',
        text: 'Working with Ivo was very pleasant. He answered my questions clearly, thought along actively, and delivered exactly the result I had in mind.',
        sourceType: 'client',
        sourceLabel: 'Client review',
        sourceIcon: 'imetech',
        publicationPermission: true
      },
      {
        author: 'Rutger de Vries',
        rating: 5,
        publishedDate: '2025-11-11',
        text: 'I had a great collaboration with Ivo. He developed a custom PCB in a short timeframe and proactively suggested practical optimizations.',
        sourceType: 'client',
        sourceLabel: 'Client review',
        sourceIcon: 'imetech',
        publicationPermission: true
      }
    ]
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatRelativeDate(dateString, isEnglish) {
    var parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return isEnglish ? 'Recently' : 'Recent';
    }

    var now = new Date();
    var utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var utcPublished = Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    var dayMs = 24 * 60 * 60 * 1000;
    var diffDays = Math.max(0, Math.floor((utcNow - utcPublished) / dayMs));

    if (isEnglish) {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return diffDays + ' days ago';
      if (diffDays < 365) {
        var months = Math.max(1, Math.floor(diffDays / 30));
        return months === 1 ? '1 month ago' : months + ' months ago';
      }
      var years = Math.max(1, Math.floor(diffDays / 365));
      return years === 1 ? '1 year ago' : years + ' years ago';
    }

    if (diffDays === 0) return 'Vandaag';
    if (diffDays === 1) return '1 dag geleden';
    if (diffDays < 30) return diffDays + ' dagen geleden';
    if (diffDays < 365) {
      var nlMonths = Math.max(1, Math.floor(diffDays / 30));
      return nlMonths + ' maanden geleden';
    }
    var nlYears = Math.max(1, Math.floor(diffDays / 365));
    return nlYears === 1 ? '1 jaar geleden' : nlYears + ' jaar geleden';
  }

  function normalizeName(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildMergedReviews(currentLang) {
    var isEnglish = currentLang === 'en';
    var langKey = isEnglish ? 'en' : 'nl';
    var map = new Map();
    var clients = clientReviewsByLang[langKey] || [];
    var google = googleReviewsByLang[langKey] || [];

    clients.forEach(function (review) {
      if (!review.publicationPermission) return;
      var key = normalizeName(review.dedupeKey || review.author);
      if (!key) return;
      map.set(key, review);
    });

    google.forEach(function (review) {
      if (!review.publicationPermission) return;
      var key = normalizeName(review.dedupeKey || review.author);
      if (!key) return;
      map.set(key, review); // Google priority on duplicates
    });

    return Array.from(map.values()).sort(function (a, b) {
      return new Date(b.publishedDate) - new Date(a.publishedDate);
    });
  }

  function getCardsPerView() {
    if (window.matchMedia('(max-width: 767px)').matches) return 1;
    return 3;
  }

  function scrollContainerTo(container, targetLeft, smooth, onDone) {
    if (!container) return;
    var done = onDone || function () {};
    if (!smooth || prefersReduced) {
      container.scrollLeft = targetLeft;
      window.setTimeout(done, 40);
      return;
    }
    container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    window.setTimeout(done, 420);
  }

  function animateReviewsTrackRaf(track, targetOffset, smooth, onDone) {
    var done = onDone || function () {};
    var duration = prefersReduced ? 0 : 480;
    var startOffset = track._reviewsOffset || 0;

    if (track._reviewsRaf) {
      cancelAnimationFrame(track._reviewsRaf);
      track._reviewsRaf = null;
    }

    if (!smooth || !duration || Math.abs(targetOffset - startOffset) < 1) {
      track._reviewsOffset = targetOffset;
      track.style.transform = 'translate3d(' + (-targetOffset) + 'px,0,0)';
      done();
      return;
    }

    var startTime = null;
    function frame(now) {
      if (startTime === null) startTime = now;
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = startOffset + (targetOffset - startOffset) * eased;
      track.style.transform = 'translate3d(' + (-current) + 'px,0,0)';
      if (progress < 1) {
        track._reviewsRaf = requestAnimationFrame(frame);
      } else {
        track._reviewsOffset = targetOffset;
        track.style.transform = 'translate3d(' + (-targetOffset) + 'px,0,0)';
        track._reviewsRaf = null;
        done();
      }
    }
    track._reviewsRaf = requestAnimationFrame(frame);
  }

  function initReviewsCarousel() {
    var viewport = document.getElementById('google-reviews-viewport');
    var track = document.getElementById('google-reviews-track');
    if (!viewport || !track) return;

    if (viewport._reviewsTimer) {
      window.clearInterval(viewport._reviewsTimer);
      viewport._reviewsTimer = null;
    }
    if (track._reviewsRaf) {
      cancelAnimationFrame(track._reviewsRaf);
      track._reviewsRaf = null;
    }

    var isMobileReviews = window.matchMedia('(max-width: 767px)').matches;
    // Mobiel: native scroll (zelfde patroon als projecten-carousel)
    var useTrackTransform = !!window.__imetechPerfLite && !isMobileReviews;
    track.style.transition = 'none';
    track.style.transform = '';
    track._reviewsOffset = 0;
    viewport.style.overflow = useTrackTransform ? 'hidden' : '';
    viewport.scrollLeft = 0;
    track.querySelectorAll('.testimonial-clone').forEach(function (el) { el.remove(); });
    var originalCards = Array.prototype.slice.call(track.querySelectorAll('.testimonial'));
    if (!originalCards.length) return;

    var perView = getCardsPerView();
    var cloneCount = Math.min(perView, originalCards.length);
    if (originalCards.length > 1) {
      for (var i = 0; i < cloneCount; i++) {
        var headClone = originalCards[i].cloneNode(true);
        var tailClone = originalCards[originalCards.length - cloneCount + i].cloneNode(true);
        headClone.classList.add('testimonial-clone');
        tailClone.classList.add('testimonial-clone');
        track.appendChild(headClone);
        track.insertBefore(tailClone, track.firstChild);
      }
    }

    var cards = Array.prototype.slice.call(track.querySelectorAll('.testimonial'));
    if (!cards.length) return;

    var currentIndex = cloneCount;
    var intervalMs = window.matchMedia('(max-width: 767px)').matches ? 8500 : 4200;
    var scrollingByCode = false;

    function moveToOffset(offset, smooth, afterDone) {
      scrollingByCode = true;
      if (useTrackTransform) {
        animateReviewsTrackRaf(track, offset, smooth, function () {
          scrollingByCode = false;
          if (afterDone) afterDone();
        });
        return;
      }
      scrollContainerTo(viewport, offset, smooth, function () {
        scrollingByCode = false;
        if (afterDone) afterDone();
      });
    }

    function goTo(index, smooth, afterDone) {
      currentIndex = Math.max(0, Math.min(index, cards.length - 1));
      var target = cards[currentIndex];
      if (!target) return;
      moveToOffset(target.offsetLeft, smooth, afterDone);
    }

    function jumpWithoutAnimation(index) {
      var target = cards[index];
      if (!target) return;
      currentIndex = index;
      scrollingByCode = true;
      if (useTrackTransform) {
        track._reviewsOffset = target.offsetLeft;
        track.style.transform = 'translate3d(' + (-target.offsetLeft) + 'px,0,0)';
      } else {
        viewport.scrollLeft = target.offsetLeft;
      }
      window.setTimeout(function () { scrollingByCode = false; }, 40);
    }

    function next() {
      if (userTouching || snapLocked || scrollingByCode) return;
      var nextIndex = currentIndex + 1;
      goTo(nextIndex, true, function () {
        if (nextIndex >= cards.length - cloneCount) {
          jumpWithoutAnimation(cloneCount);
        }
      });
    }

    function restart() {
      if (viewport._reviewsTimer) window.clearInterval(viewport._reviewsTimer);
      if (cards.length <= getCardsPerView()) return;
      viewport._reviewsTimer = window.setInterval(next, intervalMs);
    }

    function stopTimer() {
      if (!viewport._reviewsTimer) return;
      window.clearInterval(viewport._reviewsTimer);
      viewport._reviewsTimer = null;
    }

    var scrollStopTimer = null;
    var dragScrollStart = 0;
    var trackGap = 24;
    var userTouching = false;
    var snapLocked = false;

    function getCurrentOffset() {
      if (useTrackTransform) return track._reviewsOffset || 0;
      return viewport.scrollLeft;
    }

    function setCurrentOffset(offset) {
      if (useTrackTransform) {
        track._reviewsOffset = offset;
        track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
        return;
      }
      viewport.scrollLeft = offset;
    }

    function syncSlideWidths() {
      if (isMobileReviews && !useTrackTransform) {
        cards.forEach(function (card) {
          card.style.flex = '';
          card.style.width = '';
          card.style.maxWidth = '';
        });
        return;
      }
      var viewportWidth = viewport.clientWidth;
      if (!viewportWidth) return;
      var perViewCount = getCardsPerView();
      var slideWidth = perViewCount === 1
        ? viewportWidth
        : (viewportWidth - trackGap * (perViewCount - 1)) / perViewCount;
      cards.forEach(function (card) {
        card.style.flex = '0 0 ' + slideWidth + 'px';
        card.style.width = slideWidth + 'px';
        card.style.maxWidth = slideWidth + 'px';
      });
    }

    function getNearestCardIndex() {
      var offset = getCurrentOffset();
      var nearest = 0;
      var smallest = Number.POSITIVE_INFINITY;
      cards.forEach(function (card, idx) {
        var distance = Math.abs(card.offsetLeft - offset);
        if (distance < smallest) {
          smallest = distance;
          nearest = idx;
        }
      });
      return nearest;
    }

    function getLoopWidth() {
      return cards[cloneCount + originalCards.length].offsetLeft - cards[cloneCount].offsetLeft;
    }

    function loopMetricsReady() {
      if (originalCards.length <= 1) return true;
      var loopWidth = getLoopWidth();
      var realStart = cards[cloneCount].offsetLeft;
      var headStart = cards[cloneCount + originalCards.length].offsetLeft;
      return loopWidth > 0 && headStart > realStart;
    }

    function getRealIndex(index) {
      if (originalCards.length <= 1) return index;
      if (index < cloneCount) return originalCards.length + index;
      if (index >= cards.length - cloneCount) {
        return cloneCount + (index - (cards.length - cloneCount));
      }
      return index;
    }

    function normalizeScrollPosition(adjustDragAnchor) {
      if (originalCards.length <= 1) return;
      if (!loopMetricsReady()) return;
      var loopWidth = getLoopWidth();
      var realStart = cards[cloneCount].offsetLeft;
      var headStart = cards[cloneCount + originalCards.length].offsetLeft;
      var adjusted = false;
      var guard = 0;
      var offset = getCurrentOffset();

      while (offset < realStart - 1 && guard++ < 50) {
        offset += loopWidth;
        if (adjustDragAnchor) dragScrollStart += loopWidth;
        adjusted = true;
      }
      guard = 0;
      while (offset >= headStart && guard++ < 50) {
        offset -= loopWidth;
        if (adjustDragAnchor) dragScrollStart -= loopWidth;
        adjusted = true;
      }

      if (adjusted) {
        setCurrentOffset(offset);
        currentIndex = getRealIndex(getNearestCardIndex());
      }
    }

    function handleMobileScrollStop() {
      if (userTouching || scrollingByCode) return;
      var nearest = getNearestCardIndex();
      currentIndex = nearest;
      if (nearest === 0) {
        jumpWithoutAnimation(cards.length - 2);
        currentIndex = cards.length - 2;
        return;
      }
      if (nearest === cards.length - 1) {
        jumpWithoutAnimation(1);
        currentIndex = 1;
      }
    }

    if (viewport._reviewsScrollHandler) {
      viewport.removeEventListener('scroll', viewport._reviewsScrollHandler);
    }
    if (viewport._reviewsScrollEndHandler) {
      viewport.removeEventListener('scrollend', viewport._reviewsScrollEndHandler);
    }
    viewport._reviewsScrollHandler = function () {
      if (useTrackTransform) return;
      if (viewport.classList.contains('is-dragging')) return;
      if (isMobileReviews) {
        if (userTouching || scrollingByCode) return;
        if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
        scrollStopTimer = window.setTimeout(handleMobileScrollStop, 120);
        return;
      }
      if (!scrollingByCode) normalizeScrollPosition(false);
      if (scrollingByCode) return;
      if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
      scrollStopTimer = window.setTimeout(function () {
        currentIndex = getRealIndex(getNearestCardIndex());
      }, 120);
    };
    viewport.addEventListener('scroll', viewport._reviewsScrollHandler, { passive: true });

    viewport.addEventListener('mouseenter', stopTimer);
    viewport.addEventListener('mouseleave', restart);
    viewport.addEventListener('focusin', stopTimer);
    viewport.addEventListener('focusout', restart);

    if (viewport._reviewsPanCleanup) {
      viewport._reviewsPanCleanup();
      viewport._reviewsPanCleanup = null;
    }
    if (viewport._reviewsTouchPanCleanup) {
      viewport._reviewsTouchPanCleanup();
      viewport._reviewsTouchPanCleanup = null;
    }
    if (viewport._reviewsTouchEndHandler) {
      viewport.removeEventListener('touchstart', viewport._reviewsTouchStartHandler);
      viewport.removeEventListener('touchend', viewport._reviewsTouchEndHandler);
      viewport.removeEventListener('touchcancel', viewport._reviewsTouchEndHandler);
      viewport._reviewsTouchEndHandler = null;
      viewport._reviewsTouchStartHandler = null;
    }

    function snapToNearestReview(smooth) {
      if (snapLocked || scrollingByCode) return;
      if (!loopMetricsReady()) return;
      normalizeScrollPosition(false);
      var realIndex = getRealIndex(getNearestCardIndex());
      currentIndex = realIndex;
      var target = cards[currentIndex];
      if (!target) return;
      var drift = Math.abs(getCurrentOffset() - target.offsetLeft);
      if (drift <= 4) return;
      snapLocked = true;
      goTo(realIndex, smooth !== false, function () {
        snapLocked = false;
      });
    }

    function attachDesktopPointerPan() {
      (function attachPanHandlers() {
        var panActive = false;
        var panStartX = 0;
        var panMoved = false;
        var panThreshold = 6;
        var activePointerId = null;

        function onPanStart(clientX, pointerId) {
          panActive = true;
          panMoved = false;
          panStartX = clientX;
          activePointerId = pointerId;
          dragScrollStart = getCurrentOffset();
          if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
          viewport.classList.add('is-dragging');
          stopTimer();
        }

        function onPanMove(clientX) {
          if (!panActive) return;
          var dx = clientX - panStartX;
          if (Math.abs(dx) > panThreshold) panMoved = true;
          setCurrentOffset(dragScrollStart - dx);
          normalizeScrollPosition(true);
        }

        function onPanEnd() {
          if (!panActive) return;
          panActive = false;
          activePointerId = null;
          if (scrollStopTimer) window.clearTimeout(scrollStopTimer);

          if (panMoved) {
            snapToNearestReview(true);
            window.setTimeout(function () {
              viewport.classList.remove('is-dragging');
              restart();
            }, 450);
          } else {
            viewport.classList.remove('is-dragging');
            restart();
          }
          panMoved = false;
        }

        function onPointerDown(e) {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          if (activePointerId !== null) return;
          viewport.setPointerCapture(e.pointerId);
          onPanStart(e.clientX, e.pointerId);
        }

        function onPointerMove(e) {
          if (!panActive || e.pointerId !== activePointerId) return;
          onPanMove(e.clientX);
        }

        function onPointerUp(e) {
          if (e.pointerId !== activePointerId) return;
          try { viewport.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
          onPanEnd();
        }

        viewport.addEventListener('pointerdown', onPointerDown);
        viewport.addEventListener('pointermove', onPointerMove);
        viewport.addEventListener('pointerup', onPointerUp);
        viewport.addEventListener('pointercancel', onPointerUp);
        viewport.addEventListener('lostpointercapture', function (e) {
          if (e.pointerId === activePointerId) onPanEnd();
        });

        viewport.addEventListener('click', function (e) {
          if (!panMoved) return;
          e.preventDefault();
          e.stopPropagation();
          panMoved = false;
        }, true);

        viewport._reviewsPanCleanup = function () {
          viewport.removeEventListener('pointerdown', onPointerDown);
          viewport.removeEventListener('pointermove', onPointerMove);
          viewport.removeEventListener('pointerup', onPointerUp);
          viewport.removeEventListener('pointercancel', onPointerUp);
        };
      })();
    }

    function attachMobileNativeScroll() {
      viewport._reviewsTouchStartHandler = function () {
        userTouching = true;
        stopTimer();
        if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
      };
      viewport._reviewsTouchEndHandler = function () {
        userTouching = false;
        restart();
      };
      viewport.addEventListener('touchstart', viewport._reviewsTouchStartHandler, { passive: true });
      viewport.addEventListener('touchend', viewport._reviewsTouchEndHandler, { passive: true });
      viewport.addEventListener('touchcancel', viewport._reviewsTouchEndHandler, { passive: true });
    }

    if (isMobileReviews) {
      attachMobileNativeScroll();
    } else {
      attachDesktopPointerPan();
    }

    if (!window.__imetechReviewsResizeAttached) {
      window.__imetechReviewsResizeAttached = true;
      var resizeTimer = null;
      window.addEventListener('resize', function () {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(initReviewsCarousel, 150);
      }, { passive: true });
    }

    function startReviewsCarousel(attempt) {
      syncSlideWidths();
      if (!loopMetricsReady()) {
        if ((attempt || 0) < 40) {
          requestAnimationFrame(function () { startReviewsCarousel((attempt || 0) + 1); });
        }
        return;
      }
      jumpWithoutAnimation(cloneCount);
      restart();
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { startReviewsCarousel(0); });
    });
  }

  function initProjectsMobileCarousel() {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    var grid = document.querySelector('.projects-grid--carousel');
    if (!grid) return;
    grid.querySelectorAll('.project-clone').forEach(function (el) { el.remove(); });
    var baseCards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    if (baseCards.length < 2) return;

    var firstClone = baseCards[0].cloneNode(true);
    var lastClone = baseCards[baseCards.length - 1].cloneNode(true);
    firstClone.classList.add('project-clone');
    lastClone.classList.add('project-clone');
    grid.insertBefore(lastClone, grid.firstChild);
    grid.appendChild(firstClone);

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    var index = 1;
    var timer = null;
    var intervalMs = 7000;
    var scrollingByCode = false;

    function goTo(i, smooth) {
      var target = cards[i];
      if (!target) return;
      index = i;
      scrollingByCode = true;
      scrollContainerTo(grid, target.offsetLeft, smooth, function () {
        scrollingByCode = false;
      });
    }

    function jump(i) {
      var target = cards[i];
      if (!target) return;
      index = i;
      scrollingByCode = true;
      grid.scrollLeft = target.offsetLeft;
      window.setTimeout(function () { scrollingByCode = false; }, 40);
    }

    function next() {
      var nextIndex = index + 1;
      goTo(nextIndex, true);
      if (nextIndex >= cards.length - 1) {
        window.setTimeout(function () { jump(1); }, 430);
      }
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(next, intervalMs);
    }

    grid.addEventListener('touchstart', function () { if (timer) window.clearInterval(timer); }, { passive: true });
    grid.addEventListener('touchend', restart, { passive: true });
    var stopTimer = null;
    grid.addEventListener('scroll', function () {
      if (scrollingByCode) return;
      if (stopTimer) window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(function () {
        var nearest = 0;
        var smallest = Number.POSITIVE_INFINITY;
        cards.forEach(function (card, idx) {
          var distance = Math.abs(card.offsetLeft - grid.scrollLeft);
          if (distance < smallest) {
            smallest = distance;
            nearest = idx;
          }
        });
        index = nearest;
        if (nearest === 0) {
          jump(cards.length - 2);
          return;
        }
        if (nearest === cards.length - 1) {
          jump(1);
        }
      }, 120);
    }, { passive: true });

    jump(1);
    restart();
  }

  function renderGoogleReviews(currentLang) {
    var reviewsTrack = document.getElementById('google-reviews-track');
    if (!reviewsTrack) return;

    var isEnglish = currentLang === 'en';
    var reviews = buildMergedReviews(currentLang);

    reviewsTrack.innerHTML = reviews.map(function (review, index) {
      var initials = escapeHtml((review.author || '?').trim().charAt(0).toUpperCase());
      var stars = '&#9733;'.repeat(Math.max(1, Math.min(5, parseInt(review.rating, 10) || 5)));
      var stagger = index + 1;
      var sourceText = isEnglish ? 'Source: ' : 'Bron: ';
      var relativeDate = formatRelativeDate(review.publishedDate, isEnglish);
      var sourceIconClass = review.sourceIcon === 'imetech' ? 'imetech-icon' : 'google-g';

      return '' +
        '<div class="testimonial reveal stagger-' + stagger + '">' +
        '<div class="testimonial-stars">' + stars + '</div>' +
        '<blockquote>&ldquo;' + escapeHtml(review.text) + '&rdquo;</blockquote>' +
        '<div class="testimonial-footer">' +
        '<div class="testimonial-author">' +
        '<div class="initials">' + initials + '</div>' +
        '<div>' +
        '<div class="name">' + escapeHtml(review.author) + '</div>' +
        '<div class="date">' + escapeHtml(relativeDate) + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="testimonial-source">' +
        '<span class="' + sourceIconClass + '" aria-hidden="true"></span>' +
        '<span>' + sourceText + escapeHtml(review.sourceLabel) + '</span>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    initReviewsCarousel();
  }


  if (needsLoad) {
    Promise.all([
      loadComponent('header-container', '/components/header' + suffix + '.html', 2500),
      loadComponent('footer-container', '/components/footer' + suffix + '.html', 2500),
      loadComponent('floating-cta-container', '/components/floating-cta' + suffix + '.html', 2500)
    ]).then(function () {
      bindCookieSettingsLinks();
      initV2();
    });
    window.setTimeout(function () {
      bindCookieSettingsLinks();
      initV2();
    }, 2600);
  } else {
    bindCookieSettingsLinks();
    initV2();
  }

  var FORM_FEEDBACK_MS = prefersReduced ? 0 : 350;
  var FORM_FEEDBACK_AUTO_HIDE = 5000;
  var FORM_SUCCESS_ICON =
    '<svg class="form-feedback-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/>' +
    '<path d="M9 12l2 2 4-4"/>' +
    '</svg>';
  var FORM_ERROR_ICON =
    '<svg class="form-feedback-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/>' +
    '<path d="M15 9l-6 6M9 9l6 6"/>' +
    '</svg>';

  function setOverlayMode(overlay, mode, payload) {
    if (!overlay) return;
    overlay.classList.remove('form-feedback-overlay--success', 'form-feedback-overlay--error', 'form-feedback-overlay--loading');
    if (mode) overlay.classList.add('form-feedback-overlay--' + mode);
    var iconWrap = overlay.querySelector('.form-feedback-overlay__icon');
    var titleEl = overlay.querySelector('.form-feedback-overlay__title');
    var subEl = overlay.querySelector('.form-feedback-overlay__subtitle');
    if (mode === 'loading') {
      if (iconWrap) iconWrap.innerHTML = '';
      if (titleEl) titleEl.textContent = payload.waiting || '';
      if (subEl) subEl.textContent = '';
    } else if (mode === 'success') {
      if (iconWrap) iconWrap.innerHTML = FORM_SUCCESS_ICON;
      if (titleEl) titleEl.textContent = payload.successTitle || payload.success || '';
      if (subEl) subEl.textContent = payload.successSubtitle || '';
    } else if (mode === 'error') {
      if (iconWrap) iconWrap.innerHTML = FORM_ERROR_ICON;
      if (titleEl) titleEl.textContent = payload.errorText || payload.error || '';
      if (subEl) subEl.textContent = '';
    }
  }

  function revealOverlay(overlay) {
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', 'false');
    if (FORM_FEEDBACK_MS === 0) {
      overlay.classList.add('is-visible');
      return;
    }
    overlay.classList.remove('is-visible');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add('is-visible'); });
    });
  }

  function hideOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('is-visible', 'form-feedback-overlay--success', 'form-feedback-overlay--error', 'form-feedback-overlay--loading');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function initFormFeedback(form, bannerEl, opts) {
    opts = opts || {};
    if (!form) return null;

    var state = {
      wrap: null,
      formBody: null,
      overlay: null,
      banner: null,
      submitBtn: null,
      hideTimer: null,
      compact: !!opts.compact
    };

    if (!form.parentElement || !form.parentElement.classList.contains('form-feedback-wrap')) {
      var wrap = document.createElement('div');
      wrap.className = 'form-feedback-wrap' + (opts.compact ? ' form-feedback-wrap--compact' : '');
      form.parentNode.insertBefore(wrap, form);
      wrap.appendChild(form);
      state.wrap = wrap;
    } else {
      state.wrap = form.parentElement;
      if (opts.compact) state.wrap.classList.add('form-feedback-wrap--compact');
    }

    state.formBody = form.querySelector('.form-body');
    if (!state.formBody) {
      state.formBody = document.createElement('div');
      state.formBody.className = 'form-body';
      var toMove = [];
      Array.prototype.forEach.call(form.childNodes, function (node) {
        if (node.nodeType !== 1) return;
        var el = node;
        if (el.tagName === 'INPUT' && (el.type === 'hidden' || el.name === 'botcheck')) return;
        if (el.classList && (el.classList.contains('form-feedback-banner') || el.classList.contains('form-result'))) return;
        toMove.push(el);
      });
      toMove.forEach(function (node) { state.formBody.appendChild(node); });
      form.appendChild(state.formBody);
    }

    state.banner = bannerEl;
    if (state.banner) {
      state.banner.classList.remove('form-result', 'form-success', 'form-error');
      state.banner.classList.add('form-feedback-banner');
      state.banner.removeAttribute('style');
      if (!state.banner.getAttribute('role')) state.banner.setAttribute('role', 'status');
      if (!state.banner.getAttribute('aria-live')) state.banner.setAttribute('aria-live', 'polite');
      if (!opts.compact && state.banner.parentNode !== form) form.appendChild(state.banner);
    } else {
      state.banner = document.createElement('div');
      state.banner.className = 'form-feedback-banner';
      state.banner.setAttribute('role', 'status');
      state.banner.setAttribute('aria-live', 'polite');
      form.appendChild(state.banner);
    }

    state.overlay = state.wrap.querySelector('.form-feedback-overlay');
    if (!state.overlay) {
      state.overlay = document.createElement('div');
      state.overlay.className = 'form-feedback-overlay';
      state.overlay.setAttribute('aria-hidden', 'true');
      state.overlay.innerHTML =
        '<div class="form-feedback-overlay__icon">' + FORM_SUCCESS_ICON + '</div>' +
        '<p class="form-feedback-overlay__title"></p>' +
        '<p class="form-feedback-overlay__subtitle"></p>';
      state.wrap.appendChild(state.overlay);
    }

    state.submitBtn = form.querySelector('button[type="submit"]');
    return state;
  }

  function clearFormFeedbackTimer(state) {
    if (!state || !state.hideTimer) return;
    clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }

  function setSubmitLoading(state, loading, waitingText) {
    if (!state || !state.submitBtn) return;
    state.submitBtn.disabled = loading;
    if (loading) {
      state.submitBtn.classList.add('is-loading');
      state.submitBtn.setAttribute('aria-busy', 'true');
      if (waitingText && !state.submitBtn.dataset.originalHtml) {
        state.submitBtn.dataset.originalHtml = state.submitBtn.innerHTML;
        state.submitBtn.innerHTML = waitingText;
      }
    } else {
      state.submitBtn.classList.remove('is-loading');
      state.submitBtn.removeAttribute('aria-busy');
      if (state.submitBtn.dataset.originalHtml) {
        state.submitBtn.innerHTML = state.submitBtn.dataset.originalHtml;
        delete state.submitBtn.dataset.originalHtml;
      }
    }
  }

  function showFormFeedbackState(state, type, payload) {
    if (!state || !state.wrap) return;
    payload = payload || {};
    clearFormFeedbackTimer(state);

    var wrap = state.wrap;
    var banner = state.banner;
    var overlay = state.overlay;

    wrap.classList.remove('is-loading', 'is-success', 'is-error');

    if (type === 'hide') {
      if (banner) {
        banner.classList.remove('is-visible', 'is-error', 'is-loading');
        banner.textContent = '';
      }
      hideOverlay(overlay);
      setSubmitLoading(state, false);
      return;
    }

    if (type === 'loading') {
      wrap.classList.add('is-loading');
      setSubmitLoading(state, true, payload.waiting);
      if (state.compact) {
        setOverlayMode(overlay, 'loading', payload);
        revealOverlay(overlay);
      } else if (banner) {
        banner.classList.remove('is-error');
        banner.classList.add('is-loading');
        banner.textContent = payload.waiting || '';
        if (FORM_FEEDBACK_MS === 0) {
          banner.classList.add('is-visible');
        } else {
          banner.classList.remove('is-visible');
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { banner.classList.add('is-visible'); });
          });
        }
      }
      return;
    }

    setSubmitLoading(state, false);

    if (type === 'success') {
      wrap.classList.add('is-success');
      if (banner) {
        banner.classList.remove('is-visible', 'is-loading', 'is-error');
        banner.textContent = '';
      }
      setOverlayMode(overlay, 'success', payload);
      revealOverlay(overlay);
      state.hideTimer = setTimeout(function () { showFormFeedbackState(state, 'hide'); }, FORM_FEEDBACK_AUTO_HIDE);
      return;
    }

    if (type === 'error') {
      wrap.classList.add('is-error');
      if (state.compact) {
        setOverlayMode(overlay, 'error', payload);
        revealOverlay(overlay);
      } else {
        hideOverlay(overlay);
        if (banner) {
          banner.classList.remove('is-loading');
          banner.classList.add('is-error');
          banner.textContent = payload.errorText || payload.error || '';
          if (FORM_FEEDBACK_MS === 0) {
            banner.classList.add('is-visible');
          } else {
            banner.classList.remove('is-visible');
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { banner.classList.add('is-visible'); });
            });
          }
        }
      }
      state.hideTimer = setTimeout(function () { showFormFeedbackState(state, 'hide'); }, FORM_FEEDBACK_AUTO_HIDE);
    }
  }

  function initWeb3ContactForm(form, resultEl, messages, eventName, opts) {
    if (!form) return;
    var feedback = initFormFeedback(form, resultEl, opts);
    var isSubmitting = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;
      isSubmitting = true;
      showFormFeedbackState(feedback, 'loading', { waiting: messages.waiting });
      var fromPageInput = form.querySelector('input[name="from_page"]');
      if (fromPageInput) {
        fromPageInput.value = window.location.pathname + window.location.search;
      }
      var formData = new FormData(form);
      // meerdere waarden met dezelfde naam (chips) samenvoegen i.p.v. alleen de laatste te houden
      var object = {};
      formData.forEach(function (value, key) {
        object[key] = Object.prototype.hasOwnProperty.call(object, key) ? object[key] + ', ' + value : value;
      });
      var json = JSON.stringify(object);
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: json
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (data.success) {
            trackGtagEvent(eventName || 'form_submit', {
              form_id: form.id || 'unknown',
              page_path: window.location.pathname
            });
            form.reset();
            showFormFeedbackState(feedback, 'success', {
              successTitle: messages.successTitle,
              successSubtitle: messages.successSubtitle
            });
          } else {
            showFormFeedbackState(feedback, 'error', {
              errorText: data.message || messages.error
            });
          }
        })
        .catch(function () {
          showFormFeedbackState(feedback, 'error', { errorText: messages.errorFallback });
        })
        .then(function () {
          isSubmitting = false;
        })
        .catch(function () {
          isSubmitting = false;
        });
    });
    return feedback;
  }

  function initV2() {
    if (window.__imetechV2Ready) return;
    window.__imetechV2Ready = true;

    var isEn = document.documentElement.lang === 'en';
    var contactMessages = isEn
      ? {
          waiting: 'Sending...',
          successTitle: 'Message sent!',
          successSubtitle: 'I\u2019ll respond within 24 hours.',
          error: 'Something went wrong.',
          errorFallback: 'Something went wrong. Please try again or email info@imetech.nl.'
        }
      : {
          waiting: 'Verzenden...',
          successTitle: 'Bericht verzonden!',
          successSubtitle: 'Ik reageer binnen 24 uur.',
          error: 'Er is iets misgegaan.',
          errorFallback: 'Er is iets misgegaan. Probeer het opnieuw of mail me direct.'
        };

    var reviewMessages = isEn
      ? {
          waiting: 'Sending...',
          successTitle: 'Review submitted!',
          successSubtitle: 'Thank you for your feedback.',
          error: 'Something went wrong.',
          errorFallback: 'Something went wrong. Please try again or email info@imetech.nl.'
        }
      : {
          waiting: 'Verzenden...',
          successTitle: 'Review verzonden!',
          successSubtitle: 'Bedankt voor je feedback.',
          error: 'Er is iets misgegaan.',
          errorFallback: 'Er is iets misgegaan. Probeer het opnieuw of mail me direct.'
        };

    initWeb3ContactForm(
      document.getElementById('contactForm'),
      document.getElementById('contactResult'),
      contactMessages,
      'contact_form_submit'
    );
    initWeb3ContactForm(
      document.getElementById('floatingContactForm'),
      document.getElementById('floatingContactResult'),
      contactMessages,
      'floating_contact_form_submit',
      { compact: true }
    );

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (href.indexOf('tel:') === 0) {
        trackGtagEvent('tel_click', { link_url: href });
      } else if (href.indexOf('mailto:') === 0) {
        trackGtagEvent('mailto_click', { link_url: href });
      } else if (link.classList.contains('btn-primary') && (href === '/contact/' || href === '/en/contact/')) {
        trackGtagEvent('cta_contact_click', { link_url: href, link_text: (link.textContent || '').trim().slice(0, 80) });
      }
    });

    (function initBreadcrumbs() {
      var scripts = document.querySelectorAll('script[type="application/ld+json"]');
      var crumbs = null;
      scripts.forEach(function (script) {
        if (crumbs) return;
        try {
          var data = JSON.parse(script.textContent);
          if (data['@type'] === 'BreadcrumbList' && data.itemListElement) {
            crumbs = data.itemListElement;
          }
        } catch (err) { }
      });
      if (!crumbs || crumbs.length < 2) return;
      var main = document.querySelector('main');
      if (!main || main.querySelector('.breadcrumbs')) return;
      var nav = document.createElement('nav');
      nav.className = 'breadcrumbs';
      nav.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Breadcrumb' : 'Broodkruimelpad');
      var ol = document.createElement('ol');
      crumbs.forEach(function (item, index) {
        var li = document.createElement('li');
        var isLast = index === crumbs.length - 1;
        if (!isLast && item.item) {
          var a = document.createElement('a');
          a.href = item.item.replace(/^https:\/\/imetech\.nl/, '');
          a.textContent = item.name;
          li.appendChild(a);
        } else {
          var span = document.createElement('span');
          span.setAttribute('aria-current', 'page');
          span.textContent = item.name;
          li.appendChild(span);
        }
        ol.appendChild(li);
      });
      nav.appendChild(ol);
      var wrap = document.createElement('div');
      wrap.className = 'breadcrumbs-wrap breadcrumbs-wrap--in-section';
      wrap.appendChild(nav);
      var pageHero = main.querySelector('.page-hero');
      if (pageHero) {
        var nextSection = pageHero.nextElementSibling;
        while (nextSection && !nextSection.classList.contains('section')) {
          nextSection = nextSection.nextElementSibling;
        }
        if (nextSection) {
          nextSection.insertBefore(wrap, nextSection.firstChild);
        } else {
          pageHero.insertAdjacentElement('afterend', wrap);
        }
      } else {
        main.insertBefore(wrap, main.firstChild);
      }
    })();

    (function initNavDropdown() {
      var closeDelayMs = 175;
      document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
        var closeTimer = null;
        function openDropdown() {
          if (!window.matchMedia('(min-width: 768px)').matches) return;
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
          }
          dropdown.classList.add('open');
          var toggle = dropdown.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
        function closeDropdown() {
          if (!window.matchMedia('(min-width: 768px)').matches) return;
          dropdown.classList.remove('open');
          var toggle = dropdown.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
        dropdown.addEventListener('mouseenter', openDropdown);
        dropdown.addEventListener('mouseleave', function () {
          if (!window.matchMedia('(min-width: 768px)').matches) return;
          closeTimer = window.setTimeout(closeDropdown, closeDelayMs);
        });
      });
    })();

    (function initMobileNavDropdown() {
      document.querySelectorAll('.mobile-nav-group').forEach(function (group) {
        var toggle = group.querySelector('.mobile-nav-dropdown-toggle');
        var submenu = group.querySelector('.mobile-nav-sub');
        if (!toggle || !submenu) return;
        toggle.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = group.classList.toggle('open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      });
    })();

    // ===== LANGUAGE SWITCHER: map current page to equivalent in other language =====
    (function () {
      var nlToEn = {
        '/': '/en/',
        '/index.html': '/en/',
        '/over-mij/': '/en/about/',
        '/over-mij.html': '/en/about/',
        '/diensten/': '/en/services/',
        '/diensten.html': '/en/services/',
        '/contact/': '/en/contact/',
        '/contact.html': '/en/contact/',
        '/review/': '/en/review/',
        '/review.html': '/en/review/',
        '/disclaimer/': '/en/disclaimer/',
        '/disclaimer.html': '/en/disclaimer/',
        '/algemenevoorwaarden/': '/en/termsandconditions/',
        '/algemenevoorwaarden.html': '/en/termsandconditions/',
        '/privacyverklaring/': '/en/privacy-policy/',
        '/privacyverklaring.html': '/en/privacy-policy/',
        '/404/': '/en/404/',
        '/404.html': '/en/404/',
        '/diensten/softwareontwikkeling/': '/en/services/software-development/',
        '/diensten/softwareontwikkeling.html': '/en/services/software-development/',
        '/diensten/elektronica-pcb-ontwerp/': '/en/services/electronics-pcb-design/',
        '/diensten/elektronica-pcb-ontwerp.html': '/en/services/electronics-pcb-design/',
        '/diensten/mechanica-cad-tekeningen/': '/en/services/mechanical-cad-drawings/',
        '/diensten/mechanica-cad-tekeningen.html': '/en/services/mechanical-cad-drawings/',
        '/diensten/data-science-machine-learning/': '/en/services/data-science-machine-learning/',
        '/diensten/data-science-machine-learning.html': '/en/services/data-science-machine-learning/',
        '/diensten/productontwikkeling/': '/en/services/product-development/',
        '/diensten/productontwikkeling.html': '/en/services/product-development/',
        '/projecten/': '/en/projects/',
        '/projecten/index.html': '/en/projects/',
        '/projecten/besturing-rollator/': '/en/projects/rollator-control/',
        '/projecten/besturing-rollator.html': '/en/projects/rollator-control/',
        '/projecten/zelfbalancerende-kubus/': '/en/projects/self-balancing-cube/',
        '/projecten/zelfbalancerende-kubus.html': '/en/projects/self-balancing-cube/',
        '/projecten/besturingskasten/': '/en/projects/control-panels/',
        '/projecten/besturingskasten.html': '/en/projects/control-panels/',
        '/projecten/6-dof-spacemouse/': '/en/projects/6-dof-spacemouse/',
        '/projecten/6-dof-spacemouse.html': '/en/projects/6-dof-spacemouse/',
        '/projecten/letterklok/': '/en/projects/letter-clock/',
        '/projecten/letterklok.html': '/en/projects/letter-clock/',
        '/projecten/laptop-stand/': '/en/projects/laptop-stand/',
        '/projecten/laptop-stand.html': '/en/projects/laptop-stand/',
        '/projecten/smartlamp-pcb/': '/en/projects/smartlamp-pcb/',
        '/projecten/smartlamp-pcb.html': '/en/projects/smartlamp-pcb/',
        '/projecten/usb-c-laad-pcb/': '/en/projects/usb-c-charging-pcb/',
        '/projecten/usb-c-laad-pcb.html': '/en/projects/usb-c-charging-pcb/',
        '/projecten/magnetische-levitatie-plantenpot/': '/en/projects/magnetic-levitation-planter/',
        '/projecten/magnetische-levitatie-plantenpot.html': '/en/projects/magnetic-levitation-planter/',
        '/projecten/dubbele-labvoeding/': '/en/projects/dual-lab-power-supply/',
        '/projecten/dubbele-labvoeding.html': '/en/projects/dual-lab-power-supply/',
        '/projecten/multifunctioneel-soldeerstation/': '/en/projects/multifunctional-soldering-station/',
        '/projecten/multifunctioneel-soldeerstation.html': '/en/projects/multifunctional-soldering-station/',
        '/projecten/fume-extractor/': '/en/projects/fume-extractor/',
        '/projecten/fume-extractor.html': '/en/projects/fume-extractor/',
        '/projecten/plantsappers-3d-productietekeningen/': '/en/projects/plant-juice-press-3d-production-drawings/',
        '/projecten/plantsappers-3d-productietekeningen.html': '/en/projects/plant-juice-press-3d-production-drawings/',
        '/projecten/adresprint-scd30-pcb/': '/en/projects/scd30-address-board/',
        '/projecten/adresprint-scd30-pcb.html': '/en/projects/scd30-address-board/',
        '/projecten/keypad-controller-pcb/': '/en/projects/keypad-controller-pcb/',
        '/projecten/keypad-controller-pcb.html': '/en/projects/keypad-controller-pcb/',
        '/projecten/schets-tot-render/': '/en/projects/sketch-to-render/',
        '/projecten/schets-tot-render.html': '/en/projects/sketch-to-render/',
        '/projecten/2x2-steering-robot/': '/en/projects/2x2-steering-robot/',
        '/projecten/2x2-steering-robot.html': '/en/projects/2x2-steering-robot/',
        '/projecten/poc-proximity-chat/': '/en/projects/poc-proximity-chat/',
        '/projecten/poc-proximity-chat.html': '/en/projects/poc-proximity-chat/',
        '/projecten/carryvision-plantcamerasysteem/': '/en/projects/carryvision-plant-camera-system/',
        '/projecten/carryvision-plantcamerasysteem.html': '/en/projects/carryvision-plant-camera-system/',
        '/projecten/photobooth-beheerdashboard/': '/en/projects/photobooth-management-dashboard/',
        '/projecten/photobooth-beheerdashboard.html': '/en/projects/photobooth-management-dashboard/',
        '/projecten/maquette-led-installatie/': '/en/projects/model-led-installation/',
        '/projecten/maquette-led-installatie.html': '/en/projects/model-led-installation/',
        '/projecten/vlakkelichtkoepel-besturing/': '/en/projects/flat-skylight-control/',
        '/projecten/vlakkelichtkoepel-besturing.html': '/en/projects/flat-skylight-control/',
        '/blog/': '/en/blog/',
        '/blog/index.html': '/en/blog/',
        '/blog/machine-learning-productontwikkeling/': '/en/blog/machine-learning-product-development/',
        '/blog/machine-learning-productontwikkeling.html': '/en/blog/machine-learning-product-development/',
        '/blog/softwareontwikkeling-embedded-systemen/': '/en/blog/software-development-embedded-systems/',
        '/blog/softwareontwikkeling-embedded-systemen.html': '/en/blog/software-development-embedded-systems/',
        '/blog/van-idee-tot-prototype-workflow/': '/en/blog/from-idea-to-prototype-workflow/',
        '/blog/van-idee-tot-prototype-workflow.html': '/en/blog/from-idea-to-prototype-workflow/',
        '/blog/concept-ontwikkeling-iteratief-ontwerp/': '/en/blog/concept-development-iterative-design/',
        '/blog/concept-ontwikkeling-iteratief-ontwerp.html': '/en/blog/concept-development-iterative-design/',
        '/blog/embedded-systemen/': '/en/blog/embedded-systems/',
        '/blog/embedded-systemen.html': '/en/blog/embedded-systems/',
        '/blog/betrouwbare-printplaten-ontwerpen/': '/en/blog/reliable-pcb-design/',
        '/blog/betrouwbare-printplaten-ontwerpen.html': '/en/blog/reliable-pcb-design/',
        '/blog/esp32-vs-stm32/': '/en/blog/esp32-vs-stm32/',
        '/blog/esp32-vs-stm32.html': '/en/blog/esp32-vs-stm32/',
        '/blog/prototype-naar-productie/': '/en/blog/prototype-to-production/',
        '/blog/prototype-naar-productie.html': '/en/blog/prototype-to-production/',
        '/blog/python-industriele-plc-integratie/': '/en/blog/python-industrial-plc-integration/',
        '/blog/python-industriele-plc-integratie.html': '/en/blog/python-industrial-plc-integration/',
        '/blog/datagedreven-productie/': '/en/blog/data-driven-manufacturing/',
        '/blog/datagedreven-productie.html': '/en/blog/data-driven-manufacturing/',
        '/blog/effectieve-dashboards-niet-technisch/': '/en/blog/effective-dashboards-non-technical/',
        '/blog/effectieve-dashboards-niet-technisch.html': '/en/blog/effective-dashboards-non-technical/',
        '/blog/automatiseren-sensordata-annotatie/': '/en/blog/automating-sensor-data-annotation/',
        '/blog/automatiseren-sensordata-annotatie.html': '/en/blog/automating-sensor-data-annotation/',
        '/blog/autoannotate-sensordata-labelen/': '/en/blog/autoannotate-sensor-data-labeling/',
        '/blog/autoannotate-sensordata-labelen.html': '/en/blog/autoannotate-sensor-data-labeling/'
      };

      var enToNl = {};
      Object.keys(nlToEn).forEach(function (k) { enToNl[nlToEn[k]] = k; });
      Object.keys(nlToEn).forEach(function (k) {
        if (k.indexOf('.html') !== -1) {
          var enHtml = nlToEn[k].replace(/\/$/, '.html');
          enToNl[enHtml] = k.replace(/\.html$/, '/');
        }
      });

      function getHreflangPath(targetLang) {
        var link = document.querySelector('link[rel="alternate"][hreflang="' + targetLang + '"]');
        if (!link) return null;
        try {
          return new URL(link.getAttribute('href'), window.location.origin).pathname;
        } catch (e) {
          return null;
        }
      }

      var path = window.location.pathname.replace(/\/$/, '') || '/';
      if (path === '') path = '/';
      var isEn = lang === 'en';

      var otherUrl;
      if (isEn) {
        otherUrl = enToNl[path] || enToNl[path + '/'] || getHreflangPath('nl') || '/';
      } else {
        otherUrl = nlToEn[path] || nlToEn[path + '/'] || getHreflangPath('en') || '/en/';
      }

      document.querySelectorAll('.lang a, .mobile-lang a').forEach(function (a) {
        var title = a.getAttribute('title');
        if (isEn && title === 'Nederlands') {
          a.setAttribute('href', otherUrl);
        } else if (isEn && title === 'English') {
          a.setAttribute('href', path);
        } else if (!isEn && title === 'English') {
          a.setAttribute('href', otherUrl);
        } else if (!isEn && title === 'Nederlands') {
          a.setAttribute('href', path === '/' ? '/' : path);
        }
      });
    })();

    // ===== GOOGLE REVIEWS (HOME TESTIMONIALS) =====
    renderGoogleReviews(lang);
    initProjectsMobileCarousel();

    // ===== HEADER: solid after hero leaves viewport =====
    var header = document.querySelector('.header');
    var heroSection = document.querySelector('.hero') || document.querySelector('.page-hero');
    if (header && heroSection) {
      var heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          header.classList.toggle('scrolled', !entry.isIntersecting);
        });
      }, { threshold: 0, rootMargin: '-64px 0px 0px 0px' });
      heroObserver.observe(heroSection);

      function checkTop() {
        header.classList.toggle('at-top', window.scrollY < 16);
      }
      checkTop();
      window.addEventListener('scroll', checkTop, { passive: true });
    } else if (header) {
      header.classList.add('scrolled');
    }

    // ===== ACTIVE NAV ITEM =====
    (function () {
      var path = window.location.pathname.replace(/\/$/, '') || '/';
      var linkPath = function (href) {
        try {
          return new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
        } catch (e) {
          return '';
        }
      };
      var isActive = function (link) {
        if (link.classList.contains('nav-cta')) return false;
        var lp = linkPath(link.getAttribute('href'));
        if (!lp) return false;
        if (lp === '/en' || lp === '/en/') {
          return path === '/en' || path === '/en/';
        }
        if (lp === '' || lp === '/') {
          return path === '' || path === '/' || path === '/';
        }
        var base = lp.replace(/\.html$/, '');
        return path === lp || path === base || path.indexOf(base + '/') === 0;
      };
      var desktopNav = document.querySelector('.nav');
      if (desktopNav) {
        desktopNav.querySelectorAll('a').forEach(function (a) {
          if (isActive(a)) a.classList.add('active');
        });
      }
      var mobileNavEl = document.querySelector('.mobile-nav');
      if (mobileNavEl) {
        mobileNavEl.querySelectorAll('a:not(.btn)').forEach(function (a) {
          if (a.closest('.mobile-lang')) return;
          if (isActive(a)) a.classList.add('active');
        });
      }
    })();

    // ===== MOBILE NAV =====
    var burger = document.querySelector('.burger');
    var mobileNav = document.querySelector('.mobile-nav');
    if (burger && mobileNav) {
      var burgerLabelOpen = burger.getAttribute('aria-label') || 'Open menu';
      var burgerLabelClose = burger.getAttribute('data-close-label') || 'Sluit menu';

      function setMobileNavOpen(isOpen) {
        mobileNav.classList.toggle('open', isOpen);
        burger.classList.toggle('open', isOpen);
        burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        burger.setAttribute('aria-label', isOpen ? burgerLabelClose : burgerLabelOpen);
        mobileNav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }

      mobileNav.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');

      burger.addEventListener('click', function (e) {
        e.stopPropagation();
        setMobileNavOpen(!mobileNav.classList.contains('open'));
      });
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          setMobileNavOpen(false);
        });
      });
    }

    initCustomSelects();
    initFaqAccordion();

    // ===== SCROLL REVEAL =====
    var revealSelector = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur, .reveal-rotate';
    if (!prefersReduced) {
      var revealEls = document.querySelectorAll(revealSelector);
      if (revealEls.length) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, { rootMargin: '0px 0px -60px 0px', threshold: 0.01 });
        revealEls.forEach(function (el) { observer.observe(el); });
      }
    } else {
      document.querySelectorAll(revealSelector).forEach(function (el) {
        el.classList.add('visible');
      });
    }

    // ===== SCROLL PROGRESS BAR =====
    var progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
      function updateProgress() {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var progress = h > 0 ? window.scrollY / h : 0;
        progressBar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    // ===== FLOATING CTA (contact hub panel) =====
    var floatingCta = document.querySelector('.floating-cta');
    if (floatingCta && /\/contact\/?$/i.test(window.location.pathname)) {
      floatingCta.remove();
      floatingCta = null;
    }
    if (floatingCta) {
      var floatingBtn = floatingCta.querySelector('.floating-btn');
      var floatingPanel = floatingCta.querySelector('.floating-panel');
      var floatingBackdrop = floatingCta.querySelector('.floating-backdrop');
      var floatingClose = floatingCta.querySelector('.floating-panel__close');
      var floatingFields = floatingPanel && floatingPanel.querySelector('.floating-panel__fields');
      var panelOpen = false;
      var panelCloseTimer = null;
      var panelAnimMs = prefersReduced ? 0 : 400;
      var scrollCloseActive = false;
      var panelScrollGrace = false;
      var lastPageScrollY = window.scrollY;

      function isPanelFieldsScrollTarget(target) {
        return !!(floatingFields && target && floatingFields.contains(target));
      }

      // typt de bezoeker in het paneel? Dan komt scrollen door het (verdwijnende) toetsenbord
      function isTypingInPanel() {
        var el = document.activeElement;
        return !!(el && floatingPanel && floatingPanel.contains(el) && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
      }

      function setPanelOpen(open) {
        if (!floatingPanel || !floatingBtn) return;
        if (panelOpen === open) return;
        panelOpen = open;

        if (panelCloseTimer) {
          clearTimeout(panelCloseTimer);
          panelCloseTimer = null;
        }

        floatingBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        floatingCta.classList.toggle('has-panel-open', open);

        if (floatingBackdrop) {
          if (open) {
            floatingBackdrop.removeAttribute('hidden');
            floatingBackdrop.setAttribute('aria-hidden', 'false');
          } else {
            floatingBackdrop.setAttribute('aria-hidden', 'true');
          }
        }

        if (open) {
          lastPageScrollY = window.scrollY;
          scrollCloseActive = true;
          panelScrollGrace = true;
          window.setTimeout(function () {
            lastPageScrollY = window.scrollY;
            panelScrollGrace = false;
          }, panelAnimMs + 80);
          floatingPanel.removeAttribute('hidden');
          floatingPanel.setAttribute('aria-hidden', 'false');
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              floatingPanel.classList.add('open');
              if (floatingBackdrop) floatingBackdrop.classList.add('open');
            });
          });
          // alleen met muis/toetsenbord direct in het eerste veld; op telefoons zou dat
          // het toetsenbord openen, de pagina laten verschuiven en het paneel weer sluiten
          if (!window.matchMedia('(pointer: coarse)').matches) {
            window.setTimeout(function () {
              if (!panelOpen) return;
              var firstInput = floatingPanel.querySelector('input:not([type="hidden"]):not([type="checkbox"])');
              if (firstInput) firstInput.focus();
            }, panelAnimMs);
          }
        } else {
          scrollCloseActive = false;
          floatingPanel.classList.remove('open');
          if (floatingBackdrop) floatingBackdrop.classList.remove('open');
          floatingPanel.setAttribute('aria-hidden', 'true');
          panelCloseTimer = window.setTimeout(function () {
            panelCloseTimer = null;
            if (!panelOpen) {
              floatingPanel.setAttribute('hidden', '');
              if (floatingBackdrop) floatingBackdrop.setAttribute('hidden', '');
            }
            floatingBtn.focus();
          }, panelAnimMs);
        }
      }

      if (floatingBtn && floatingPanel) {
        floatingBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          setPanelOpen(!panelOpen);
        });
        floatingPanel.addEventListener('click', function (e) {
          e.stopPropagation();
        });
        if (floatingBackdrop) {
          floatingBackdrop.addEventListener('click', function (e) {
            e.stopPropagation();
            setPanelOpen(false);
          });
        }
        if (floatingClose) {
          floatingClose.addEventListener('click', function (e) {
            e.stopPropagation();
            setPanelOpen(false);
          });
        }
        document.addEventListener('click', function () {
          if (panelOpen) setPanelOpen(false);
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && panelOpen) setPanelOpen(false);
        });

        window.addEventListener('scroll', function () {
          if (!panelOpen || !scrollCloseActive || panelScrollGrace) return;
          if (isTypingInPanel()) { lastPageScrollY = window.scrollY; return; }
          if (Math.abs(window.scrollY - lastPageScrollY) > 2) {
            setPanelOpen(false);
          }
        }, { passive: true });

        document.addEventListener('wheel', function (e) {
          if (!panelOpen) return;
          if (isPanelFieldsScrollTarget(e.target)) return;
          setPanelOpen(false);
        }, { passive: true });

        document.addEventListener('touchmove', function (e) {
          if (!panelOpen) return;
          if (floatingPanel.contains(e.target) || isTypingInPanel()) return;
          setPanelOpen(false);
        }, { passive: true });
      }

      var footerEl = document.querySelector('.footer');
      if (footerEl && 'IntersectionObserver' in window) {
        var footerObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            floatingCta.classList.toggle('is-hidden-near-footer', entry.isIntersecting);
            if (entry.isIntersecting && panelOpen && !isTypingInPanel()) setPanelOpen(false);
          });
        }, { root: null, threshold: 0.1 });
        footerObserver.observe(footerEl);
      }
    }

    // ===== PROJECT FILTER =====
    var filterBtns = document.querySelectorAll('.filter-btn');
    var filterCards = document.querySelectorAll('[data-categories]');
    if (filterBtns.length && filterCards.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var filter = btn.getAttribute('data-filter');
          filterCards.forEach(function (card) {
            var show = filter === 'all' || card.getAttribute('data-categories').indexOf(filter) !== -1;
            card.classList.toggle('filtered-out', !show);
          });
        });
      });
    }

    // ===== STAR RATING WIDGET =====
    var starContainer = document.querySelector('.star-rating');
    if (starContainer) {
      var stars = starContainer.querySelectorAll('.star');
      var ratingInput = starContainer.querySelector('input[type="hidden"]');
      stars.forEach(function (star, idx) {
        star.addEventListener('click', function () {
          var value = idx + 1;
          if (ratingInput) ratingInput.value = value;
          stars.forEach(function (s, i) { s.classList.toggle('active', i < value); });
        });
        star.addEventListener('mouseenter', function () {
          stars.forEach(function (s, i) { s.classList.toggle('hover', i <= idx); });
        });
        star.addEventListener('mouseleave', function () {
          stars.forEach(function (s) { s.classList.remove('hover'); });
        });
      });
    }

    // ===== SHARE BUTTONS =====
    document.querySelectorAll('[data-share="copy"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href).then(function () {
          var msg = document.documentElement.lang === 'en' ? 'Copied!' : 'Gekopieerd!';
          btn.setAttribute('data-copied', msg);
          btn.classList.add('copy-done');
          setTimeout(function () {
            btn.classList.remove('copy-done');
            btn.removeAttribute('data-copied');
          }, 2000);
        });
      });
    });

    // ===== REVIEW FORM WITH GOOGLE POPUP =====
    var googleReviewClicked = false;
    window.markGoogleReviewClicked = function () { googleReviewClicked = true; };

    var reviewForm = document.getElementById('reviewForm');
    var googleModal = document.getElementById('googleReminder');
    var btnGoogle = document.getElementById('btnGoogle');
    var btnSkip = document.getElementById('btnSkip');
    var reviewResult = document.getElementById('result');
    var selectedRating = 0;
    var isSubmittingReview = false;

    if (starContainer) {
      var allStars = starContainer.querySelectorAll('.star');
      allStars.forEach(function (star, idx) {
        star.addEventListener('click', function () {
          selectedRating = idx + 1;
          var ri = document.getElementById('ratingValue');
          if (ri) ri.value = selectedRating;
          allStars.forEach(function (s, i) {
            s.classList.toggle('active', i < selectedRating);
          });
        });
      });
    }

    if (reviewForm) {
      var reviewFeedback = initFormFeedback(reviewForm, reviewResult);
      var pendingReviewSuccess = null;

      function shouldShowGoogleModal() {
        return !googleReviewClicked && selectedRating >= 4 && googleModal;
      }

      function closeGoogleModalAndShowSuccess() {
        if (googleModal) googleModal.style.display = 'none';
        if (pendingReviewSuccess) {
          showFormFeedbackState(reviewFeedback, 'success', pendingReviewSuccess);
          pendingReviewSuccess = null;
        }
      }

      function sendReview() {
        if (isSubmittingReview) return;
        isSubmittingReview = true;
        var deferSuccessFeedback = shouldShowGoogleModal();
        if (!deferSuccessFeedback) {
          showFormFeedbackState(reviewFeedback, 'loading', { waiting: reviewMessages.waiting });
        } else {
          setSubmitLoading(reviewFeedback, true, reviewMessages.waiting);
        }
        var formData = new FormData(reviewForm);
        var object = Object.fromEntries(formData);
        var json = JSON.stringify(object);
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: json
        })
          .then(function (response) { return response.json(); })
          .then(function (data) {
            if (data.success) {
              reviewForm.reset();
              selectedRating = 0;
              if (starContainer) starContainer.querySelectorAll('.star').forEach(function (s) { s.classList.remove('active'); });
              var successPayload = {
                successTitle: reviewMessages.successTitle,
                successSubtitle: reviewMessages.successSubtitle
              };
              if (deferSuccessFeedback) {
                pendingReviewSuccess = successPayload;
                setSubmitLoading(reviewFeedback, false);
                googleModal.style.display = 'flex';
              } else {
                showFormFeedbackState(reviewFeedback, 'success', successPayload);
              }
            } else {
              if (googleModal) googleModal.style.display = 'none';
              pendingReviewSuccess = null;
              showFormFeedbackState(reviewFeedback, 'error', {
                errorText: data.message || reviewMessages.error
              });
            }
          })
          .catch(function () {
            if (googleModal) googleModal.style.display = 'none';
            pendingReviewSuccess = null;
            showFormFeedbackState(reviewFeedback, 'error', { errorText: reviewMessages.errorFallback });
          })
          .then(function () {
            reviewForm.dataset.submitted = 'true';
            isSubmittingReview = false;
          })
          .catch(function () {
            isSubmittingReview = false;
          });
      }

      reviewForm.addEventListener('submit', function (e) {
        if (!reviewForm.dataset.submitted) {
          e.preventDefault();
          sendReview();
        }
      });

      if (btnGoogle) {
        btnGoogle.addEventListener('click', function () {
          window.open('https://g.page/r/CV9KoNq0t1d-EAE/review', '_blank');
          googleReviewClicked = true;
        });
      }
      if (btnSkip) {
        btnSkip.addEventListener('click', closeGoogleModalAndShowSuccess);
      }
    }

    // ===== CONTACT PAGE SCROLL =====
    (function () {
      var contactFormSection = document.getElementById('contact-form');
      if (!contactFormSection) return;
      var isContactPage = window.location.pathname.indexOf('contact') !== -1;
      var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
      document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link || link.closest('.lang, .mobile-lang')) return;
        var href = link.getAttribute('href');
        if (href === '#contact-form' || href.indexOf('contact#contact-form') !== -1 || href.indexOf('contact/#contact-form') !== -1) {
          e.preventDefault();
          contactFormSection.scrollIntoView({ behavior: 'smooth' });
          var nameInput = contactFormSection.querySelector('input[name="name"]');
          if (nameInput) setTimeout(function () { nameInput.focus(); }, 600);
          return;
        }
        if (!isContactPage) return;
        var linkPath = '';
        try {
          linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
        } catch (err) { return; }
        if (linkPath === currentPath) {
          e.preventDefault();
          contactFormSection.scrollIntoView({ behavior: 'smooth' });
          var ni = contactFormSection.querySelector('input[name="name"]');
          if (ni) setTimeout(function () { ni.focus(); }, 600);
        }
      });
    })();

    // ===== GALLERY LIGHTBOX =====
    var galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length) {
      var isEnGallery = document.documentElement.lang === 'en';
      var lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.innerHTML =
        '<div class="lightbox-overlay"></div>' +
        '<button class="lightbox-prev" type="button" aria-label="' + (isEnGallery ? 'Previous image' : 'Vorige foto') + '">' +
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
        '</button>' +
        '<img class="lightbox-img" alt="" />' +
        '<button class="lightbox-next" type="button" aria-label="' + (isEnGallery ? 'Next image' : 'Volgende foto') + '">' +
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
        '</button>' +
        '<button class="lightbox-close" type="button" aria-label="' + (isEnGallery ? 'Close' : 'Sluiten') + '">&times;</button>';
      document.body.appendChild(lightbox);

      var lbImg = lightbox.querySelector('.lightbox-img');
      var lbPrev = lightbox.querySelector('.lightbox-prev');
      var lbNext = lightbox.querySelector('.lightbox-next');
      var lbClose = lightbox.querySelector('.lightbox-close');
      var lbOverlay = lightbox.querySelector('.lightbox-overlay');
      var currentItems = [];
      var currentIndex = 0;

      function showImage(index) {
        if (!currentItems.length) return;
        currentIndex = (index + currentItems.length) % currentItems.length;
        var img = currentItems[currentIndex].querySelector('img');
        lbImg.src = img.getAttribute('src');
        lbImg.alt = img.getAttribute('alt') || '';
        var hideNav = currentItems.length <= 1;
        lbPrev.hidden = hideNav;
        lbNext.hidden = hideNav;
      }

      function openLightbox(items, index) {
        currentItems = items;
        showImage(index);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }

      galleryItems.forEach(function (item) {
        item.addEventListener('click', function () {
          var gallery = item.closest('.gallery');
          var items = gallery
            ? Array.prototype.slice.call(gallery.querySelectorAll('.gallery-item'))
            : [item];
          var index = items.indexOf(item);
          openLightbox(items, index >= 0 ? index : 0);
        });
      });

      lbPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        showImage(currentIndex - 1);
      });

      lbNext.addEventListener('click', function (e) {
        e.stopPropagation();
        showImage(currentIndex + 1);
      });

      lbClose.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLightbox();
      });

      lbOverlay.addEventListener('click', closeLightbox);

      lbImg.addEventListener('click', function (e) {
        e.stopPropagation();
      });

      document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        else if (e.key === 'ArrowRight') showImage(currentIndex + 1);
      });
    }
  }

  function initFaqAccordion() {
    function closeFaqItem(item) {
      var answer = item.querySelector('.faq-answer-wrap');
      if (!answer || !item.classList.contains('faq-open')) return;

      item.classList.remove('faq-open');
      var onEnd = function (event) {
        if (event.propertyName !== 'grid-template-rows') return;
        answer.removeEventListener('transitionend', onEnd);
        item.open = false;
      };
      answer.addEventListener('transitionend', onEnd);
    }

    document.querySelectorAll('.faq-item').forEach(function (item) {
      if (item.dataset.faqBound === 'true') return;
      item.dataset.faqBound = 'true';

      var summary = item.querySelector('summary');
      var answer = item.querySelector('summary + p, summary + .faq-answer-wrap');
      if (!summary || !answer) return;

      if (answer.tagName === 'P') {
        var wrap = document.createElement('div');
        wrap.className = 'faq-answer-wrap';
        var inner = document.createElement('div');
        inner.className = 'faq-answer-inner';
        answer.parentNode.insertBefore(wrap, answer);
        inner.appendChild(answer);
        wrap.appendChild(inner);
        answer = wrap;
      }

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = item.classList.contains('faq-open');
        var faqList = item.closest('.faq-list');

        if (isOpen) {
          closeFaqItem(item);
        } else {
          if (faqList) {
            faqList.querySelectorAll('.faq-item.faq-open').forEach(function (openItem) {
              if (openItem !== item) closeFaqItem(openItem);
            });
          }
          item.open = true;
          requestAnimationFrame(function () {
            item.classList.add('faq-open');
          });
        }
      });
    });
  }

  function initCustomSelects() {
    document.querySelectorAll('select[name="project_type"]').forEach(function (select) {
      if (select.dataset.customSelect === 'true' || select.closest('.custom-select')) return;
      select.dataset.customSelect = 'true';

      var formGroup = select.closest('.form-group');
      if (!formGroup) return;

      var label = formGroup.querySelector('label[for="' + select.id + '"]');
      var wrapper = document.createElement('div');
      wrapper.className = 'custom-select';

      var triggerId = select.id + '-trigger';
      var listId = select.id + '-listbox';

      var trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger input';
      trigger.id = triggerId;
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', listId);
      if (label) trigger.setAttribute('aria-labelledby', label.id + ' ' + triggerId);

      var triggerLabel = document.createElement('span');
      triggerLabel.className = 'custom-select-trigger-label';
      trigger.appendChild(triggerLabel);

      var list = document.createElement('ul');
      list.className = 'custom-select-options';
      list.id = listId;
      list.setAttribute('role', 'listbox');
      list.setAttribute('aria-hidden', 'true');

      select.classList.add('custom-select-native');
      select.tabIndex = -1;
      select.setAttribute('aria-hidden', 'true');

      Array.prototype.forEach.call(select.options, function (option, index) {
        var li = document.createElement('li');
        li.className = 'custom-select-option';
        li.setAttribute('role', 'option');
        li.dataset.value = option.value;
        var optionLabel = document.createElement('span');
        optionLabel.className = 'custom-select-option-label';
        optionLabel.textContent = option.textContent;
        li.appendChild(optionLabel);
        if (option.selected) {
          li.setAttribute('aria-selected', 'true');
          triggerLabel.textContent = option.textContent || option.value;
        } else {
          li.setAttribute('aria-selected', 'false');
        }
        if (index === 0 && !option.value) li.classList.add('is-placeholder');
        list.appendChild(li);
      });

      if (!triggerLabel.textContent) {
        triggerLabel.textContent = select.options[0] ? select.options[0].textContent : '';
      }

      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(select);
      wrapper.appendChild(trigger);
      wrapper.appendChild(list);

      function setValue(value) {
        select.value = value;
        Array.prototype.forEach.call(list.querySelectorAll('.custom-select-option'), function (opt) {
          var selected = opt.dataset.value === value;
          opt.setAttribute('aria-selected', selected ? 'true' : 'false');
          opt.classList.toggle('is-selected', selected);
        });
        var match = select.options[select.selectedIndex];
        triggerLabel.textContent = match ? match.textContent : '';
        trigger.classList.toggle('is-placeholder', !value);
      }

      function closeList() {
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        list.setAttribute('aria-hidden', 'true');
      }

      function openList() {
        wrapper.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        list.setAttribute('aria-hidden', 'false');
        var selected = list.querySelector('.custom-select-option.is-selected, .custom-select-option[aria-selected="true"]');
        if (selected) selected.focus();
      }

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (wrapper.classList.contains('open')) closeList();
        else openList();
      });

      list.addEventListener('click', function (e) {
        var option = e.target.closest('.custom-select-option');
        if (!option) return;
        setValue(option.dataset.value);
        closeList();
        trigger.focus();
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!wrapper.classList.contains('open')) openList();
        } else if (e.key === 'Escape') {
          closeList();
        }
      });

      list.addEventListener('keydown', function (e) {
        var options = Array.prototype.slice.call(list.querySelectorAll('.custom-select-option'));
        var current = document.activeElement;
        var idx = options.indexOf(current);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          var next = options[Math.min(idx + 1, options.length - 1)] || options[0];
          next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          var prev = options[Math.max(idx - 1, 0)] || options[options.length - 1];
          prev.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (current && current.classList.contains('custom-select-option')) {
            setValue(current.dataset.value);
            closeList();
            trigger.focus();
          }
        } else if (e.key === 'Escape') {
          closeList();
          trigger.focus();
        }
      });

      optionsFocusable(list);

      document.addEventListener('click', function (e) {
        if (!wrapper.contains(e.target)) closeList();
      });

      var form = select.closest('form');
      if (form) {
        form.addEventListener('reset', function () {
          window.setTimeout(function () {
            setValue(select.value || '');
          }, 0);
        });
      }

      setValue(select.value || '');
    });
  }

  function optionsFocusable(list) {
    list.querySelectorAll('.custom-select-option').forEach(function (opt) {
      opt.tabIndex = -1;
    });
  }
})();

/* ===== PROJECT 3D VIDEOS: hover op projectkaarten, inline op projectpagina ===== */
(function () {
  var MAP = {
    'zelfbalancerende-kubus': 'kubus', 'self-balancing-cube': 'kubus',
    'besturing-rollator': 'rollator', 'rollator-control': 'rollator',
    'plantsappers-3d-productietekeningen': 'plantsappers', 'plant-juice-press-3d-production-drawings': 'plantsappers',
    'dubbele-labvoeding': 'labvoeding', 'dual-lab-power-supply': 'labvoeding',
    'fume-extractor': 'fume-extractor',
    'letterklok': 'letterklok', 'letter-clock': 'letterklok',
    'multifunctioneel-soldeerstation': 'soldeerstation', 'multifunctional-soldering-station': 'soldeerstation',
    'schets-tot-render': 'twozero', 'sketch-to-render': 'twozero'
  };
  function slugOf(href) { var m = (href || '').match(/\/(?:projecten|projects)\/([^\/?#]+)/); return m ? m[1] : null; }
  function allowed() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (navigator.connection && navigator.connection.saveData) return false;
    return true;
  }
  function makeVideo(src, poster, preload) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = preload || 'none'; if (poster) v.poster = poster; v.src = src;
    return v;
  }
  function setupCard(card, key) {
    var box = card.querySelector('.project-img');
    if (!box) return null;
    card.classList.add('has-3d');
    var st = { v: null, hovering: false };
    st.ensure = function (preload) {
      if (st.v) return st.v;
      st.v = makeVideo('/videos/' + key + '-card.mp4', null, preload || 'auto');
      st.v.className = 'project-video';
      st.v.addEventListener('playing', function () { if (st.hovering) card.classList.add('video-on'); });
      box.appendChild(st.v);
      return st.v;
    };
    card.addEventListener('pointerenter', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      st.hovering = true;
      var v = st.ensure('auto');
      var p = v.play();
      if (p && p.then) p.then(function () { if (st.hovering && v.readyState >= 3) card.classList.add('video-on'); }).catch(function () { });
    });
    card.addEventListener('pointerleave', function () {
      st.hovering = false;
      card.classList.remove('video-on');
      if (st.v) setTimeout(function () { if (!st.hovering && st.v) st.v.pause(); }, 450);
    });
    return st;
  }
  function init() {
    if (!allowed()) return;
    var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover) {
      var cards = [];
      document.querySelectorAll('a.project-card').forEach(function (card) {
        var key = MAP[slugOf(card.getAttribute('href'))];
        if (!key) return;
        var st = setupCard(card, key);
        if (st) cards.push({ card: card, st: st });
      });
      // Zodra de muis over een projectenraster beweegt: video's van zichtbare kaarten alvast laden,
      // zodat de hover direct start (alleen desktop, alleen kaarten in beeld).
      var warmed = false;
      function warm() {
        if (warmed) return; warmed = true;
        var vh = window.innerHeight;
        cards.forEach(function (c) {
          var r = c.card.getBoundingClientRect();
          if (r.bottom > -200 && r.top < vh + 200) c.st.ensure('auto');
        });
      }
      var grids = new Set();
      cards.forEach(function (c) { grids.add(c.card.parentElement); });
      grids.forEach(function (g) { g.addEventListener('pointermove', warm, { once: true, passive: true }); });
    }
    // Projectpagina: 3D-loop als tweede item in de galerij, speelt alleen als hij in beeld is
    var key = MAP[slugOf(location.pathname)];
    var gal = document.querySelector('.project-detail-gallery .gallery');
    if (key && gal) {
      var en = document.documentElement.lang === 'en';
      var fig = document.createElement('figure');
      fig.className = 'gallery-video';
      var v = makeVideo('/videos/' + key + '.mp4', '/videos/' + key + '-poster.webp', 'none');
      fig.appendChild(v);
      var cap = document.createElement('figcaption');
      cap.textContent = en ? '3D model' : '3D-model';
      fig.appendChild(cap);
      var first = gal.querySelector('.gallery-item');
      gal.insertBefore(fig, first ? first.nextSibling : gal.firstChild);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) v.play().catch(function () { }); else v.pause(); });
        }, { threshold: 0.35 }).observe(fig);
      } else {
        v.play().catch(function () { });
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
/* ===== BEWEGING & INTERACTIE: scroll-effecten, cursor-effecten, carrousel-indicatoren ===== */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }

  // ----- Eén gedeelde scroll-lus voor alle scroll-gestuurde effecten -----
  var scrollHandlers = [];
  var ticking = false;
  function runScroll() {
    ticking = false;
    var vh = window.innerHeight;
    scrollHandlers.forEach(function (fn) { fn(vh); });
  }
  function requestScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(runScroll); }
  }
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll, { passive: true });
  window.addEventListener('load', requestScroll);

  // ----- Swipe-indicatoren voor de reviewcarrousel (mobiel) -----
  // De carrousel wordt pas na het laden van de componenten opgebouwd; daarom wachten op de kaarten.
  function initReviewDots(attempt) {
    var viewport = document.getElementById('google-reviews-viewport');
    if (!viewport) return;
    var cards = all('.testimonial:not(.testimonial-clone)', viewport);
    if (!cards.length) {
      if ((attempt || 0) < 40) setTimeout(function () { initReviewDots((attempt || 0) + 1); }, 150);
      return;
    }
    var carousel = viewport.closest('.testimonials-carousel');
    if (!carousel || carousel.querySelector('.swipe-dots')) return;
    var en = document.documentElement.lang === 'en';
    var dots = document.createElement('div');
    dots.className = 'swipe-dots';
    dots.setAttribute('aria-hidden', 'true');
    cards.forEach(function () { dots.appendChild(document.createElement('i')); });
    var hint = document.createElement('span');
    hint.className = 'swipe-hint';
    hint.textContent = en ? 'Swipe' : 'Swipe';
    dots.appendChild(hint);
    carousel.appendChild(dots);
    var marks = all('i', dots);

    function update() {
      var real = all('.testimonial:not(.testimonial-clone)', viewport);
      var best = 0;
      var bestDist = Infinity;
      real.forEach(function (card, i) {
        var d = Math.abs(card.offsetLeft - viewport.scrollLeft);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      marks.forEach(function (m, i) { m.classList.toggle('is-on', i === best); });
    }
    viewport.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    update();
  }

  // ----- Werk: voortgangsbalk bij swipen (mobiel) -----
  function initWork() {
    var section = document.querySelector('.section-work');
    if (!section) return;
    var viewport = section.querySelector('.work-viewport');
    var bar = section.querySelector('.work-progress');
    if (!viewport || !bar) return;
    function update() {
      var max = viewport.scrollWidth - viewport.clientWidth;
      // aandeel dat al in beeld is geweest, zodat de balk bij de start niet leeg oogt
      var p = max > 0 ? (viewport.scrollLeft + viewport.clientWidth) / viewport.scrollWidth : 1;
      bar.style.setProperty('--wp', clamp(p, 0, 1).toFixed(3));
    }
    viewport.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // ----- Ankerlinks binnen de pagina zacht laten scrollen -----
  document.addEventListener('click', function (e) {
    var link = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!link || link.getAttribute('href').length < 2) return;
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  // ----- Contact: samenvatting + voortgang van de projectaanvraag -----
  function initConfigurator() {
    var form = document.querySelector('.config-form');
    if (!form) return;
    var summary = form.querySelector('.config-summary');
    var bar = form.closest('.config') && form.closest('.config').querySelector('.config-progress');
    var required = all('input[required], textarea[required]', form);

    function checkedValues(name) {
      return all('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; });
    }

    function update() {
      var help = checkedValues('hulp_bij');
      var phase = checkedValues('fase');
      var parts = help.concat(phase);
      if (summary) {
        if (parts.length) {
          summary.innerHTML = '';
          var label = document.createElement('span');
          label.textContent = summary.getAttribute('data-label') + ': ';
          var value = document.createElement('b');
          value.textContent = parts.join(' · ');
          summary.appendChild(label);
          summary.appendChild(value);
        } else {
          summary.textContent = summary.getAttribute('data-empty');
        }
      }
      var done = (help.length ? 1 : 0) + (phase.length ? 1 : 0) +
        required.filter(function (f) { return f.value.trim() && f.checkValidity(); }).length;
      if (bar) bar.style.setProperty('--cp', (done / (2 + required.length)).toFixed(3));
    }

    form.addEventListener('change', update);
    form.addEventListener('input', update);
    form.addEventListener('reset', function () { setTimeout(update, 0); });
    update();
  }

  // ----- Contact: lokale tijd in Aalten -----
  function initClock() {
    all('.direct-clock').forEach(function (el) {
      var out = el.querySelector('b');
      if (!out || typeof Intl === 'undefined') return;
      var fmt = new Intl.DateTimeFormat(el.getAttribute('data-lang') === 'en' ? 'en-GB' : 'nl-NL', {
        hour: '2-digit', minute: '2-digit', timeZone: el.getAttribute('data-tz') || 'Europe/Amsterdam'
      });
      function tick() { out.textContent = fmt.format(new Date()); }
      tick();
      setInterval(tick, 15000);
    });
  }

  // ----- Diensten: tabbladen per discipline (zonder JS staan alle panelen onder elkaar) -----
  function initServiceTabs() {
    all('.section-svc').forEach(function (section) {
      var tabs = all('.svc-tab', section);
      var panels = all('.svc-panel', section);
      var wrap = section.querySelector('.svc-panels');
      if (!tabs.length || !wrap) return;
      section.classList.add('is-tabs');
      wrap.classList.add('is-tabs');

      function activate(id, focus) {
        tabs.forEach(function (t) {
          var on = t.getAttribute('aria-controls') === id;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          if (on) {
            if (focus) t.focus();
            t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
          }
        });
        panels.forEach(function (p) { p.classList.toggle('is-active', p.id === id); });
      }

      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { activate(t.getAttribute('aria-controls')); });
        t.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          activate(next.getAttribute('aria-controls'), true);
        });
      });

      // links als /diensten/#electronics openen direct het juiste tabblad
      var hash = window.location.hash.slice(1);
      if (hash && section.querySelector('#' + CSS.escape(hash))) {
        activate(hash);
        setTimeout(function () { section.scrollIntoView({ behavior: 'auto' }); }, 50);
      }
    });
  }

  // ----- Projecten: teller bij het filteren -----
  function initProjectCount() {
    var count = document.querySelector('.proj-count b');
    if (!count) return;
    document.addEventListener('click', function (e) {
      if (!(e.target instanceof Element) || !e.target.closest('.filter-btn')) return;
      setTimeout(function () {
        var shown = all('.section-projects [data-categories]:not(.filtered-out)');
        count.textContent = shown.length;
        // kaarten die door het filter verschuiven direct tonen, niet opnieuw laten invliegen
        shown.forEach(function (card) { card.classList.add('visible'); });
      }, 0);
    });
  }

  // ----- Chatknop verbergen zolang de (home-)hero in beeld is -----
  scrollHandlers.push(function () {
    var cta = document.querySelector('.floating-cta');
    var hero = document.querySelector('.hero');
    if (!cta || !hero) return;
    cta.classList.toggle('is-hidden-top', window.scrollY < hero.offsetHeight * 0.6);
  });

  onReady(function () {
    initReviewDots(0);
    initWork();
    initConfigurator();
    initClock();
    initServiceTabs();
    initProjectCount();
    requestScroll();
    // de chatknop wordt als component nageladen; daarna de zichtbaarheid opnieuw bepalen
    [600, 1500, 3000].forEach(function (ms) { setTimeout(requestScroll, ms); });
  });

  if (reduce) return;

  // ----- Koppen: woorden schuiven één voor één omhoog zodra de kop in beeld komt -----
  (function initSplitHeadings() {
    if (!('IntersectionObserver' in window)) return;
    var headings = all('.section-header h2, .work-head h2, .steps-sticky h2, .case-body h2, .about-body h2, .cta-section h2, .service-detail h2, .service-detail h3, .deliver-head h3');
    if (!headings.length) return;

    function split(el) {
      var index = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.nodeValue.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var word = document.createElement('span');
              word.className = 'w';
              var inner = document.createElement('span');
              inner.textContent = part;
              inner.style.setProperty('--i', index++);
              word.appendChild(inner);
              frag.appendChild(word);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            walk(child);
          }
        });
      })(el);
      el.classList.add('split');
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.2 });

    headings.forEach(function (h) { split(h); io.observe(h); });
  })();

  // ----- Parallax (--sp), hero (--hs) en meelopende lijnen (--line) -----
  (function initScrollValues() {
    var hero = document.querySelector('.hero, .page-hero');
    var parallax = all('.about-photo, .case-media, .service-detail-visual');
    var lines = all('.process-grid, .timeline, .steps').map(function (grid) {
      return { grid: grid, steps: all('.process-step, .timeline-item, .step', grid) };
    });

    scrollHandlers.push(function (vh) {
      if (hero) {
        var h = hero.offsetHeight || 1;
        if (window.scrollY < h * 1.2) hero.style.setProperty('--hs', clamp(window.scrollY / h, 0, 1).toFixed(3));
      }

      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        el.style.setProperty('--sp', clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(3));
      });

      lines.forEach(function (item) {
        var r = item.grid.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var vertical = item.grid.classList.contains('steps') || (item.steps.length > 1 &&
          Math.abs(item.steps[0].getBoundingClientRect().left - item.steps[1].getBoundingClientRect().left) < 2);
        var p = vertical
          ? clamp((vh * 0.6 - r.top) / Math.max(r.height, 1), 0, 1)
          : clamp((vh * 0.85 - r.top) / (vh * 0.45), 0, 1);
        item.grid.style.setProperty('--line', p.toFixed(3));
        item.steps.forEach(function (step, i) {
          var at = vertical ? (step.offsetTop + 20) / Math.max(item.grid.offsetHeight, 1) : i / item.steps.length + 0.02;
          step.classList.toggle('is-done', p >= at);
        });
      });
    });
  })();

  requestScroll();

  if (!finePointer) return;

  // ----- Hero: raster licht op rond de cursor -----
  all('.hero, .page-hero').forEach(function (hero) {
    var spot = document.createElement('div');
    spot.className = 'hero-spot';
    spot.setAttribute('aria-hidden', 'true');
    hero.insertBefore(spot, hero.firstChild);
    var frame = null;
    hero.addEventListener('pointermove', function (e) {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = null;
        var r = hero.getBoundingClientRect();
        spot.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        spot.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
    }, { passive: true });
  });

  // ----- Kaarten: lichtvlek volgt de cursor -----
  var CARDS = '.service-card, .expertise-panel, .info-card, .contact-card, .error-link, .comparison-card, .challenge-item, .related-card, .testimonial';
  document.addEventListener('pointermove', function (e) {
    var card = e.target instanceof Element ? e.target.closest(CARDS) : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  }, { passive: true });

  // ----- Primaire knoppen trekken subtiel naar de cursor toe -----
  all('.hero-btns .btn, .cta-section .btn-primary, .nav-cta').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.18;
      var y = (e.clientY - r.top - r.height / 2) * 0.28;
      btn.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    });
    btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
  });

  // ----- 3D-viewport: crosshair met coördinaten, zoals in CAD -----
  (function initStageProbe() {
    var stage = document.getElementById('hero-stage');
    var media = stage && stage.querySelector('.stage-media');
    var readout = stage && stage.querySelector('.stage-tag--right');
    if (!stage || !media || !readout) return;
    var label = readout.textContent;
    ['x', 'y'].forEach(function (axis) {
      var line = document.createElement('span');
      line.className = 'stage-cross stage-cross--' + axis;
      line.setAttribute('aria-hidden', 'true');
      media.appendChild(line);
    });
    media.addEventListener('pointermove', function (e) {
      var r = media.getBoundingClientRect();
      var x = clamp(e.clientX - r.left, 0, r.width);
      var y = clamp(e.clientY - r.top, 0, r.height);
      media.style.setProperty('--cx', x.toFixed(0) + 'px');
      media.style.setProperty('--cy', y.toFixed(0) + 'px');
      readout.textContent = 'X ' + (x / r.width).toFixed(2) + '  Y ' + (1 - y / r.height).toFixed(2);
      stage.classList.add('is-probing');
    }, { passive: true });
    media.addEventListener('pointerleave', function () {
      stage.classList.remove('is-probing');
      readout.textContent = label;
    });
  })();
})();
