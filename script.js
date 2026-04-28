(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== GOOGLE ANALYTICS 4 (gtag) — only with analytics consent =====
  var GA_MEASUREMENT_ID = 'G-1LP253W3VD';

  function hasAnalyticsConsent() {
    var c = localStorage.getItem('cookieConsent');
    if (!c) return false;
    if (c === 'all') return true;
    try {
      var o = JSON.parse(c);
      return Boolean(o && o.analytics);
    } catch (e) {
      return false;
    }
  }

  function loadGoogleAnalyticsIfConsented() {
    if (!hasAnalyticsConsent() || window.__imetechGtagLoaded) return;
    window.__imetechGtagLoaded = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
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
    function clearStoredCookiePreferences() {
      ['cookieConsent', 'cookiePreferences', 'cookieSettings'].forEach(function (key) {
        localStorage.removeItem(key);
      });
    }

    var consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      showCookieBanner();
    }

    function showCookieBanner() {
      var existing = document.getElementById('cookie-banner');
      if (existing) {
        existing.style.display = 'flex';
        requestAnimationFrame(function () { requestAnimationFrame(function () { existing.classList.add('cookie-visible'); }); });
        return;
      }
      var banner = document.createElement('div');
      banner.id = 'cookie-banner';
      banner.className = 'cookie-banner';
      var isEn = document.documentElement.lang === 'en';
      var cookieTitle = isEn ? 'Cookie preferences' : 'Cookievoorkeuren';
      var cookieText = isEn
        ? 'This website uses cookies for analytics and functionality. Read our <a href="/en/privacy-policy.html">privacy policy</a>.'
        : 'Deze website gebruikt cookies voor analyse en functionaliteit. Lees ons <a href="/privacyverklaring.html">privacybeleid</a>.';
      var cookieNecessary = isEn ? 'Necessary only' : 'Alleen noodzakelijk';
      var cookieAccept = isEn ? 'Accept all' : 'Alles accepteren';
      banner.innerHTML = '<div class="cookie-inner">' +
        '<div class="cookie-content">' +
        '<div class="cookie-icon-wrap">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path></svg>' +
        '</div>' +
        '<div class="cookie-text"><h3>' + cookieTitle + '</h3>' +
        '<p>' + cookieText + '</p></div></div>' +
        '<div class="cookie-actions">' +
        '<button class="btn btn-outline cookie-necessary">' + cookieNecessary + '</button>' +
        '<button class="btn btn-primary cookie-accept">' + cookieAccept + '</button>' +
        '</div></div>';
      document.body.appendChild(banner);
      requestAnimationFrame(function () { requestAnimationFrame(function () { banner.classList.add('cookie-visible'); }); });

      banner.querySelector('.cookie-accept').addEventListener('click', function () {
        localStorage.setItem('cookieConsent', 'all');
        loadGoogleAnalyticsIfConsented();
        banner.classList.remove('cookie-visible');
        setTimeout(function () { banner.style.display = 'none'; }, 400);
      });
      banner.querySelector('.cookie-necessary').addEventListener('click', function () {
        localStorage.setItem('cookieConsent', 'necessary');
        banner.classList.remove('cookie-visible');
        setTimeout(function () { banner.style.display = 'none'; }, 400);
      });
    }

    window.openCookieSettings = function () {
      clearStoredCookiePreferences();
      showCookieBanner();
    };
  })();

  function resetCookiePreferencesAndOpenBanner() {
    if (typeof window.openCookieSettings === 'function') {
      window.openCookieSettings();
      return;
    }
    ['cookieConsent', 'cookiePreferences', 'cookieSettings'].forEach(function (key) {
      localStorage.removeItem(key);
    });
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
  function loadComponent(containerId, url) {
    var container = document.getElementById(containerId);
    if (!container) return Promise.resolve();
    return fetch(url)
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

  function initReviewsCarousel() {
    var viewport = document.getElementById('google-reviews-viewport');
    var track = document.getElementById('google-reviews-track');
    if (!viewport || !track) return;
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
    var timer = null;
    var intervalMs = window.matchMedia('(max-width: 767px)').matches ? 8500 : 4200;
    var scrollingByCode = false;

    function goTo(index, smooth) {
      currentIndex = Math.max(0, Math.min(index, cards.length - 1));
      var target = cards[currentIndex];
      if (!target) return;
      scrollingByCode = true;
      viewport.scrollTo({ left: target.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
      window.setTimeout(function () { scrollingByCode = false; }, smooth ? 420 : 40);
    }

    function jumpWithoutAnimation(index) {
      var target = cards[index];
      if (!target) return;
      currentIndex = index;
      scrollingByCode = true;
      viewport.scrollTo({ left: target.offsetLeft, behavior: 'auto' });
      window.setTimeout(function () { scrollingByCode = false; }, 40);
    }

    function next() {
      var nextIndex = currentIndex + 1;
      goTo(nextIndex, true);
      if (nextIndex >= cards.length - cloneCount) {
        window.setTimeout(function () { jumpWithoutAnimation(cloneCount); }, 430);
      }
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      if (cards.length <= getCardsPerView()) return;
      timer = window.setInterval(next, intervalMs);
    }

    var scrollStopTimer = null;
    viewport.addEventListener('scroll', function () {
      if (scrollingByCode) return;
      if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
      scrollStopTimer = window.setTimeout(function () {
        var nearest = 0;
        var smallest = Number.POSITIVE_INFINITY;
        cards.forEach(function (card, idx) {
          var distance = Math.abs(card.offsetLeft - viewport.scrollLeft);
          if (distance < smallest) {
            smallest = distance;
            nearest = idx;
          }
        });
        currentIndex = nearest;
        if (originalCards.length > 1) {
          if (nearest < cloneCount) {
            jumpWithoutAnimation(originalCards.length + nearest);
            return;
          }
          if (nearest >= cards.length - cloneCount) {
            jumpWithoutAnimation(cloneCount + (nearest - (cards.length - cloneCount)));
            return;
          }
        }
      }, 120);
    }, { passive: true });

    viewport.addEventListener('mouseenter', function () { if (timer) window.clearInterval(timer); });
    viewport.addEventListener('mouseleave', restart);
    viewport.addEventListener('focusin', function () { if (timer) window.clearInterval(timer); });
    viewport.addEventListener('focusout', restart);
    viewport.addEventListener('touchstart', function () { if (timer) window.clearInterval(timer); }, { passive: true });
    viewport.addEventListener('touchend', restart, { passive: true });
    window.addEventListener('resize', initReviewsCarousel, { passive: true, once: true });

    jumpWithoutAnimation(cloneCount);
    restart();
  }

  function initProjectsMobileCarousel() {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    var grid = document.querySelector('.projects-grid');
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
      grid.scrollTo({ left: target.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
      window.setTimeout(function () { scrollingByCode = false; }, smooth ? 420 : 40);
    }

    function jump(i) {
      var target = cards[i];
      if (!target) return;
      index = i;
      scrollingByCode = true;
      grid.scrollTo({ left: target.offsetLeft, behavior: 'auto' });
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
    var parallaxSpeeds = [1, 0, -1];

    reviewsTrack.innerHTML = reviews.map(function (review, index) {
      var initials = escapeHtml((review.author || '?').trim().charAt(0).toUpperCase());
      var stars = '&#9733;'.repeat(Math.max(1, Math.min(5, parseInt(review.rating, 10) || 5)));
      var stagger = index + 1;
      var speed = parallaxSpeeds[index] !== undefined ? parallaxSpeeds[index] : 0;
      var sourceText = isEnglish ? 'Source: ' : 'Bron: ';
      var relativeDate = formatRelativeDate(review.publishedDate, isEnglish);
      var sourceIconClass = review.sourceIcon === 'imetech' ? 'imetech-icon' : 'google-g';

      return '' +
        '<div class="testimonial reveal stagger-' + stagger + '" data-parallax="testimonial" data-speed="' + speed + '">' +
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
      loadComponent('header-container', '/components/header' + suffix + '.html'),
      loadComponent('footer-container', '/components/footer' + suffix + '.html'),
      loadComponent('floating-cta-container', '/components/floating-cta' + suffix + '.html')
    ]).then(function () {
      bindCookieSettingsLinks();
      initV2();
    });
  } else {
    bindCookieSettingsLinks();
    initV2();
  }

  function initV2() {

    // ===== LANGUAGE SWITCHER: map current page to equivalent in other language =====
    (function () {
      var nlToEn = {
        '/': '/en/',
        '/index.html': '/en/index.html',
        '/over-mij.html': '/en/about.html',
        '/diensten.html': '/en/services.html',
        '/contact.html': '/en/contact.html',
        '/review.html': '/en/review.html',
        '/disclaimer.html': '/en/disclaimer.html',
        '/algemenevoorwaarden.html': '/en/termsandconditions.html',
        '/privacyverklaring.html': '/en/privacy-policy.html',
        '/404.html': '/en/404.html',
        '/diensten/softwareontwikkeling.html': '/en/services/software-development.html',
        '/diensten/elektronica-pcb-ontwerp.html': '/en/services/electronics-pcb-design.html',
        '/diensten/mechanica-cad-tekeningen.html': '/en/services/mechanical-cad-drawings.html',
        '/diensten/data-science-machine-learning.html': '/en/services/data-science-machine-learning.html',
        '/diensten/productontwikkeling.html': '/en/services/product-development.html',
        '/projecten/': '/en/projects/',
        '/projecten/index.html': '/en/projects/index.html',
        '/projecten/besturing-rollator.html': '/en/projects/rollator-control.html',
        '/projecten/zelfbalancerende-kubus.html': '/en/projects/self-balancing-cube.html',
        '/projecten/besturingskasten.html': '/en/projects/control-panels.html',
        '/projecten/6-dof-spacemouse.html': '/en/projects/6-dof-spacemouse.html',
        '/projecten/letterklok.html': '/en/projects/letter-clock.html',
        '/projecten/laptop-stand.html': '/en/projects/laptop-stand.html',
        '/projecten/smartlamp-pcb.html': '/en/projects/smartlamp-pcb.html',
        '/projecten/usb-c-laad-pcb.html': '/en/projects/usb-c-charging-pcb.html',
        '/projecten/magnetische-levitatie-plantenpot.html': '/en/projects/magnetic-levitation-planter.html',
        '/projecten/dubbele-labvoeding.html': '/en/projects/dual-lab-power-supply.html',
        '/projecten/multifunctioneel-soldeerstation.html': '/en/projects/multifunctional-soldering-station.html',
        '/projecten/fume-extractor.html': '/en/projects/fume-extractor.html',
        '/projecten/plantsappers-3d-productietekeningen.html': '/en/projects/plant-juice-press-3d-production-drawings.html',
        '/projecten/adresprint-scd30-pcb.html': '/en/projects/scd30-address-board.html',
        '/projecten/keypad-controller-pcb.html': '/en/projects/keypad-controller-pcb.html',
        '/projecten/schets-tot-render.html': '/en/projects/sketch-to-render.html',
        '/projecten/2x2-steering-robot.html': '/en/projects/2x2-steering-robot.html',
        '/projecten/poc-proximity-chat.html': '/en/projects/poc-proximity-chat.html',
        '/projecten/carryvision-plantcamerasysteem.html': '/en/projects/carryvision-plant-camera-system.html',
        '/blog/': '/en/blog/',
        '/blog/index.html': '/en/blog/index.html',
        '/blog/machine-learning-productontwikkeling.html': '/en/blog/machine-learning-product-development.html',
        '/blog/softwareontwikkeling-embedded-systemen.html': '/en/blog/software-development-embedded-systems.html',
        '/blog/van-idee-tot-prototype-workflow.html': '/en/blog/from-idea-to-prototype-workflow.html',
        '/blog/concept-ontwikkeling-iteratief-ontwerp.html': '/en/blog/concept-development-iterative-design.html',
        '/blog/embedded-systemen.html': '/en/blog/embedded-systems.html',
        '/blog/betrouwbare-printplaten-ontwerpen.html': '/en/blog/reliable-pcb-design.html',
        '/blog/esp32-vs-stm32.html': '/en/blog/esp32-vs-stm32.html',
        '/blog/prototype-naar-productie.html': '/en/blog/prototype-to-production.html',
        '/blog/python-industriele-plc-integratie.html': '/en/blog/python-industrial-plc-integration.html',
        '/blog/datagedreven-productie.html': '/en/blog/data-driven-manufacturing.html',
        '/blog/effectieve-dashboards-niet-technisch.html': '/en/blog/effective-dashboards-non-technical.html',
        '/blog/automatiseren-sensordata-annotatie.html': '/en/blog/automating-sensor-data-annotation.html'
      };

      var enToNl = {};
      Object.keys(nlToEn).forEach(function (k) { enToNl[nlToEn[k]] = k; });

      var path = window.location.pathname.replace(/\/$/, '') || '/';
      if (path === '') path = '/';
      var isEn = lang === 'en';

      var otherUrl;
      if (isEn) {
        otherUrl = enToNl[path] || enToNl[path + '/'] || '/';
      } else {
        otherUrl = nlToEn[path] || nlToEn[path + '/'] || '/en/';
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
          a.setAttribute('href', path === '/index.html' ? '/' : path);
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
        header.classList.toggle('at-top', window.scrollY < 10);
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
          return path === '/en' || path === '/en/index.html';
        }
        if (lp === '' || lp === '/') {
          return path === '' || path === '/' || path === '/index.html';
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
      burger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileNav.classList.toggle('open');
        burger.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          burger.classList.remove('open');
          mobileNav.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // ===== HERO CAROUSEL =====
    (function initHeroCarousel() {
      var slideEls = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
      if (slideEls.length <= 1 || prefersReduced) return;

      var parent = slideEls[0].parentNode;
      for (var hi = slideEls.length - 1; hi > 0; hi--) {
        var hj = Math.floor(Math.random() * (hi + 1));
        var htmp = slideEls[hi];
        slideEls[hi] = slideEls[hj];
        slideEls[hj] = htmp;
      }
      slideEls.forEach(function (s) { parent.appendChild(s); });
      slideEls.forEach(function (s) { s.classList.remove('active'); });
      slideEls[0].classList.add('active');

      var current = 0;
      var interval = 5000;
      function nextSlide() {
        slideEls[current].classList.remove('active');
        current = (current + 1) % slideEls.length;
        slideEls[current].classList.add('active');
      }
      setInterval(nextSlide, interval);
    })();

    // ===== PAGE HERO CAROUSEL =====
    (function initPageHeroCarousel() {
      var pageHeroSlides = Array.prototype.slice.call(document.querySelectorAll('.page-hero-slide'));
      if (pageHeroSlides.length <= 1 || prefersReduced) return;

      var pParent = pageHeroSlides[0].parentNode;
      for (var pi = pageHeroSlides.length - 1; pi > 0; pi--) {
        var pj = Math.floor(Math.random() * (pi + 1));
        var ptmp = pageHeroSlides[pi];
        pageHeroSlides[pi] = pageHeroSlides[pj];
        pageHeroSlides[pj] = ptmp;
      }
      pageHeroSlides.forEach(function (s) { pParent.appendChild(s); });
      pageHeroSlides.forEach(function (s) { s.classList.remove('active'); });
      pageHeroSlides[0].classList.add('active');

      var pageCurrent = 0;
      var pageInterval = 5000;
      function nextPageSlide() {
        pageHeroSlides[pageCurrent].classList.remove('active');
        pageCurrent = (pageCurrent + 1) % pageHeroSlides.length;
        pageHeroSlides[pageCurrent].classList.add('active');
      }
      setInterval(nextPageSlide, pageInterval);
    })();

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

    // ===== SECTION HEADING UNDERLINE ON SCROLL =====
    if (!prefersReduced) {
      var headingEls = document.querySelectorAll('.heading-animate');
      if (headingEls.length) {
        var headerObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle('in-view', entry.isIntersecting);
          });
        }, { rootMargin: '-15% 0px -15% 0px', threshold: 0.3 });
        headingEls.forEach(function (el) { headerObserver.observe(el); });
      }
    }

    // ===== COUNTER ANIMATION =====
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length && !prefersReduced) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var target = parseInt(el.getAttribute('data-count'), 10);
            var suffix = el.getAttribute('data-suffix') || '';
            var duration = 2800;
            var start = performance.now();
            function tick(now) {
              var progress = Math.min((now - start) / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.round(target * eased) + suffix;
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { counterObserver.observe(el); });
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

    // ===== UNIFIED PARALLAX ENGINE =====
    if (!prefersReduced) {
      var decos = document.querySelectorAll('.deco[data-speed]');
      var pxImages = document.querySelectorAll('[data-parallax="image"]');
      var pxRotate = document.querySelectorAll('[data-parallax="rotate"]');
      var pxHeroImage = document.querySelector('[data-parallax="hero-image"]');
      var pxHeroTags = document.querySelectorAll('[data-parallax="hero-tag"]');
      var pxTestimonials = document.querySelectorAll('[data-parallax="testimonial"]');
      var pxProjectImgs = document.querySelectorAll('[data-parallax="project-image"]');
      var pxFocus = document.querySelectorAll('[data-parallax="focus"]');
      var pxCardFocus = document.querySelectorAll('[data-parallax="card-focus"]');

      var hasParallax = decos.length || pxImages.length ||
        pxRotate.length || pxHeroImage || pxHeroTags.length ||
        pxTestimonials.length || pxProjectImgs.length ||
        pxFocus.length || pxCardFocus.length;

      if (hasParallax) {
        var vh = window.innerHeight;
        var ticking = false;

        window.addEventListener('resize', function () { vh = window.innerHeight; }, { passive: true });

        function centerRatio(rect) {
          return (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
        }

        function updateAllParallax() {
          decos.forEach(function (el) {
            var speed = parseFloat(el.getAttribute('data-speed') || '0.04');
            var rect = el.parentElement.getBoundingClientRect();
            var sectionCenter = rect.top + rect.height / 2;
            var yOffset = sectionCenter * speed;
            var parts = 'translateY(' + (-yOffset).toFixed(1) + 'px)';

            var drift = parseFloat(el.getAttribute('data-drift') || '0');
            if (drift !== 0) {
              parts += ' translateX(' + (sectionCenter * drift).toFixed(1) + 'px)';
            }

            var rot = parseFloat(el.getAttribute('data-rotate') || '0');
            if (rot !== 0) {
              parts += ' rotate(' + (sectionCenter * rot).toFixed(1) + 'deg)';
            }

            el.style.transform = parts;
          });

          pxImages.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.bottom < -100 || rect.top > vh + 100) return;
            var offset = centerRatio(rect) * 10;
            el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
          });

          pxRotate.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.bottom < -100 || rect.top > vh + 100) return;
            var ratio = centerRatio(rect);
            el.style.transform = 'rotate(' + (ratio * 8).toFixed(1) + 'deg)';
          });

          if (pxHeroImage) {
            var scrollY = window.scrollY;
            pxHeroImage.style.transform = 'translateY(' + (scrollY * 0.03).toFixed(1) + 'px)';
          }

          pxHeroTags.forEach(function (el) {
            var speed = parseFloat(el.getAttribute('data-speed') || '0.02');
            var scrollY = window.scrollY;
            el.style.transform = 'translateY(' + (scrollY * speed).toFixed(1) + 'px)';
          });

          pxTestimonials.forEach(function (el) {
            var speed = parseFloat(el.getAttribute('data-speed') || '0');
            if (speed === 0) return;
            var rect = el.getBoundingClientRect();
            if (rect.bottom < -100 || rect.top > vh + 100) return;
            var ratio = centerRatio(rect);
            el.style.transform = 'translateY(' + (ratio * 8 * speed).toFixed(1) + 'px)';
          });

          pxProjectImgs.forEach(function (el) {
            var rect = el.parentElement.getBoundingClientRect();
            if (rect.bottom < -100 || rect.top > vh + 100) return;
            var ratio = centerRatio(rect);
            el.style.transform = 'scale(1.05) translateY(' + (ratio * -6).toFixed(1) + 'px)';
          });

          pxFocus.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.bottom < -300 || rect.top > vh + 300) return;
            var wrap = el.querySelector('.wrap');
            if (!wrap) return;
            var overlapTop = Math.max(rect.top, 0);
            var overlapBot = Math.min(rect.bottom, vh);
            var overlap = Math.max(overlapBot - overlapTop, 0);
            var maxOverlap = Math.min(rect.height, vh);
            var away = 1 - (maxOverlap > 0 ? overlap / maxOverlap : 1);
            var eased = away * away;
            var scale = 1 - eased * 0.15;
            var opacity = 1 - eased * 0.25;
            wrap.style.transform = 'scale(' + scale.toFixed(4) + ')';
            wrap.style.opacity = opacity.toFixed(3);
          });

          pxCardFocus.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.bottom < -200 || rect.top > vh + 200) return;
            var overlapTop = Math.max(rect.top, 0);
            var overlapBot = Math.min(rect.bottom, vh);
            var overlap = Math.max(overlapBot - overlapTop, 0);
            var maxOverlap = Math.min(rect.height, vh);
            var away = 1 - (maxOverlap > 0 ? overlap / maxOverlap : 1);
            var eased = away * away;
            var scale = 1 - eased * 0.12;
            var opacity = 1 - eased * 0.2;
            el.style.setProperty('--card-scale', scale.toFixed(4));
            el.style.setProperty('--card-opacity', opacity.toFixed(3));
          });

          ticking = false;
        }

        window.addEventListener('scroll', function () {
          if (!ticking) { requestAnimationFrame(updateAllParallax); ticking = true; }
        }, { passive: true });
        updateAllParallax();
      }
    }

    // ===== HERO ENTRANCE ANIMATION =====
    var heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          heroContent.classList.add('hero-entered');
        });
      });
    }

    // ===== FLOATING CTA =====
    var floatingBtn = document.querySelector('.floating-btn');
    var floatingOpts = document.querySelector('.floating-options');
    var floatingCta = document.querySelector('.floating-cta');
    if (floatingBtn && floatingOpts) {
      floatingBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        floatingOpts.classList.toggle('open');
      });
      document.addEventListener('click', function () {
        floatingOpts.classList.remove('open');
      });
    }
    if (floatingCta) {
      var footerEl = document.querySelector('.footer');
      if (footerEl && 'IntersectionObserver' in window) {
        var footerObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            floatingCta.classList.toggle('is-hidden-near-footer', entry.isIntersecting);
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
      function sendReview() {
        if (isSubmittingReview) return;
        isSubmittingReview = true;
        var formData = new FormData(reviewForm);
        var object = Object.fromEntries(formData);
        var json = JSON.stringify(object);
        if (reviewResult) { reviewResult.innerHTML = 'Please wait...'; reviewResult.style.display = 'block'; reviewResult.className = 'form-result'; }
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: json
        })
          .then(function (response) { return response.json(); })
          .then(function (data) {
            if (data.success) {
              if (reviewResult) { reviewResult.innerHTML = 'Review submitted successfully! Thank you.'; reviewResult.className = 'form-result form-success'; reviewResult.style.display = 'block'; }
              reviewForm.reset();
              selectedRating = 0;
              if (starContainer) starContainer.querySelectorAll('.star').forEach(function (s) { s.classList.remove('active'); });
            } else {
              if (reviewResult) { reviewResult.innerHTML = data.message || 'Something went wrong.'; reviewResult.className = 'form-result form-error'; reviewResult.style.display = 'block'; }
            }
          })
          .catch(function () {
            if (reviewResult) { reviewResult.innerHTML = 'Something went wrong. Please try again or email info@imetech.nl.'; reviewResult.className = 'form-result form-error'; reviewResult.style.display = 'block'; }
          })
          .then(function () {
            reviewForm.dataset.submitted = 'true';
            isSubmittingReview = false;
            setTimeout(function () { if (reviewResult) reviewResult.style.display = 'none'; }, 4000);
          })
          .catch(function () {
            isSubmittingReview = false;
          });
      }

      reviewForm.addEventListener('submit', function (e) {
        if (!reviewForm.dataset.submitted) {
          e.preventDefault();
          sendReview();
          if (!googleReviewClicked && selectedRating >= 4 && googleModal) {
            googleModal.style.display = 'flex';
          }
        }
      });

      if (btnGoogle) {
        btnGoogle.addEventListener('click', function () {
          window.open('https://g.page/r/CV9KoNq0t1d-EAE/review', '_blank');
          googleReviewClicked = true;
          // Keep modal open so user can click 'Skip' to submit locally
        });
      }
      if (btnSkip) {
        btnSkip.addEventListener('click', function () {
          if (googleModal) googleModal.style.display = 'none';
        });
      }
    }

    // ===== CONTACT PAGE SCROLL =====
    (function () {
      var contactFormSection = document.getElementById('contact-form');
      if (!contactFormSection) return;
      var isContactPage = window.location.pathname.indexOf('contact') !== -1;
      document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (href === '#contact-form' || href.indexOf('contact.html#contact-form') !== -1) {
          e.preventDefault();
          contactFormSection.scrollIntoView({ behavior: 'smooth' });
          var nameInput = contactFormSection.querySelector('input[name="name"]');
          if (nameInput) setTimeout(function () { nameInput.focus(); }, 600);
        }
        if (isContactPage && href.indexOf('contact.html') !== -1) {
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
      var lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.innerHTML = '<div class="lightbox-overlay"></div><img class="lightbox-img" alt="" /><button class="lightbox-close" aria-label="Close">&times;</button>';
      document.body.appendChild(lightbox);
      var lbImg = lightbox.querySelector('.lightbox-img');

      galleryItems.forEach(function (item) {
        item.addEventListener('click', function () {
          var src = item.querySelector('img').getAttribute('src');
          var alt = item.querySelector('img').getAttribute('alt') || '';
          lbImg.src = src;
          lbImg.alt = alt;
          lightbox.classList.add('open');
          document.body.style.overflow = 'hidden';
        });
      });

      lightbox.addEventListener('click', function () {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  }
})();
