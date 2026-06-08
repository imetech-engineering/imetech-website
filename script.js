(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    function clearStoredCookiePreferences() {
      safeRemoveCookiePreferences();
    }

    var consent = safeGetCookieConsent();
    if (!consent) {
      showCookieBanner();
    }

    function showCookieBanner() {
      function forceBannerVisible(el) {
        if (!el) return;
        el.style.display = 'flex';
        el.classList.add('consent-visible');
        // Hard fallback for browsers/extensions that interfere with transitions.
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
      }

      var existing = document.getElementById('consent-panel');
      if (existing) {
        forceBannerVisible(existing);
        return;
      }
      var banner = document.createElement('div');
      banner.id = 'consent-panel';
      banner.className = 'consent-panel';
      var isEn = document.documentElement.lang === 'en';
      var cookieTitle = isEn ? 'Cookie preferences' : 'Cookievoorkeuren';
      var cookieText = isEn
        ? 'This website uses cookies for analytics and functionality. Read our <a href="/en/privacy-policy.html">privacy policy</a>.'
        : 'Deze website gebruikt cookies voor analyse en functionaliteit. Lees ons <a href="/privacyverklaring.html">privacybeleid</a>.';
      var cookieNecessary = isEn ? 'Necessary only' : 'Alleen noodzakelijk';
      var cookieAccept = isEn ? 'Accept all' : 'Alles accepteren';
      banner.innerHTML = '<div class="consent-inner">' +
        '<div class="consent-content">' +
        '<div class="consent-icon-wrap">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path></svg>' +
        '</div>' +
        '<div class="consent-text"><h3>' + cookieTitle + '</h3>' +
        '<p>' + cookieText + '</p></div></div>' +
        '<div class="consent-actions">' +
        '<button class="btn btn-outline consent-necessary">' + cookieNecessary + '</button>' +
        '<button class="btn btn-primary consent-accept">' + cookieAccept + '</button>' +
        '</div></div>';
      document.body.appendChild(banner);
      forceBannerVisible(banner);

      banner.querySelector('.consent-accept').addEventListener('click', function () {
        safeSetCookieConsent('all');
        loadGoogleAnalyticsIfConsented();
        banner.classList.remove('consent-visible');
        setTimeout(function () { banner.style.display = 'none'; }, 400);
      });
      banner.querySelector('.consent-necessary').addEventListener('click', function () {
        safeSetCookieConsent('necessary');
        banner.classList.remove('consent-visible');
        setTimeout(function () { banner.style.display = 'none'; }, 400);
      });
    }

    window.openCookieSettings = function () {
      clearStoredCookiePreferences();
      showCookieBanner();
    };

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
    var dragScrollStart = 0;

    function getNearestCardIndex() {
      var nearest = 0;
      var smallest = Number.POSITIVE_INFINITY;
      cards.forEach(function (card, idx) {
        var distance = Math.abs(card.offsetLeft - viewport.scrollLeft);
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

      while (viewport.scrollLeft < realStart - 1 && guard++ < 50) {
        viewport.scrollLeft += loopWidth;
        if (adjustDragAnchor) dragScrollStart += loopWidth;
        adjusted = true;
      }
      guard = 0;
      while (viewport.scrollLeft >= headStart && guard++ < 50) {
        viewport.scrollLeft -= loopWidth;
        if (adjustDragAnchor) dragScrollStart -= loopWidth;
        adjusted = true;
      }

      if (adjusted) {
        currentIndex = getRealIndex(getNearestCardIndex());
      }
    }

    viewport.addEventListener('scroll', function () {
      if (viewport.classList.contains('is-dragging')) return;
      if (!scrollingByCode) normalizeScrollPosition(false);
      if (scrollingByCode) return;
      if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
      scrollStopTimer = window.setTimeout(function () {
        currentIndex = getRealIndex(getNearestCardIndex());
      }, 120);
    }, { passive: true });

    viewport.addEventListener('mouseenter', function () { if (timer) window.clearInterval(timer); });
    viewport.addEventListener('mouseleave', restart);
    viewport.addEventListener('focusin', function () { if (timer) window.clearInterval(timer); });
    viewport.addEventListener('focusout', restart);
    viewport.addEventListener('touchstart', function () { if (timer) window.clearInterval(timer); }, { passive: true });
    viewport.addEventListener('touchend', restart, { passive: true });

    if (!viewport.dataset.dragScrollAttached && window.matchMedia('(min-width: 768px)').matches) {
      viewport.dataset.dragScrollAttached = '1';
      var dragActive = false;
      var dragStartX = 0;
      var dragMoved = false;
      var dragThreshold = 5;

      viewport.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        dragActive = true;
        dragMoved = false;
        dragStartX = e.pageX;
        dragScrollStart = viewport.scrollLeft;
        if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
        viewport.classList.add('is-dragging');
        if (timer) window.clearInterval(timer);
        e.preventDefault();
      });

      window.addEventListener('mousemove', function (e) {
        if (!dragActive) return;
        var dx = e.pageX - dragStartX;
        if (Math.abs(dx) > dragThreshold) dragMoved = true;
        viewport.scrollLeft = dragScrollStart - dx;
        normalizeScrollPosition(true);
      });

      function endDragScroll() {
        if (!dragActive) return;
        dragActive = false;
        if (scrollStopTimer) window.clearTimeout(scrollStopTimer);

        if (dragMoved) {
          normalizeScrollPosition(true);
          var realIndex = getRealIndex(getNearestCardIndex());
          currentIndex = realIndex;
          goTo(realIndex, true);
          window.setTimeout(function () {
            viewport.classList.remove('is-dragging');
            restart();
          }, 450);
        } else {
          viewport.classList.remove('is-dragging');
          restart();
        }
      }

      window.addEventListener('mouseup', endDragScroll);
      viewport.addEventListener('click', function (e) {
        if (!dragMoved) return;
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }, true);
    }

    window.addEventListener('resize', initReviewsCarousel, { passive: true, once: true });

    function startReviewsCarousel(attempt) {
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

  function initWeb3ContactForm(form, resultEl, messages) {
    if (!form || !resultEl) return;
    var isSubmitting = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;
      isSubmitting = true;
      var fromPageInput = form.querySelector('input[name="from_page"]');
      if (fromPageInput) {
        fromPageInput.value = window.location.pathname + window.location.search;
      }
      var formData = new FormData(form);
      var object = Object.fromEntries(formData);
      var json = JSON.stringify(object);
      resultEl.innerHTML = messages.waiting;
      resultEl.style.display = 'block';
      resultEl.className = 'form-result';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: json
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (data.success) {
            resultEl.innerHTML = messages.success;
            resultEl.className = 'form-result form-success';
            resultEl.style.display = 'block';
            form.reset();
          } else {
            resultEl.innerHTML = data.message || messages.error;
            resultEl.className = 'form-result form-error';
            resultEl.style.display = 'block';
          }
        })
        .catch(function () {
          resultEl.innerHTML = messages.errorFallback;
          resultEl.className = 'form-result form-error';
          resultEl.style.display = 'block';
        })
        .then(function () {
          isSubmitting = false;
          setTimeout(function () { resultEl.style.display = 'none'; }, 4000);
        })
        .catch(function () {
          isSubmitting = false;
        });
    });
  }

  function initV2() {
    var isEn = document.documentElement.lang === 'en';
    var contactMessages = isEn
      ? {
          waiting: 'Please wait...',
          success: 'Message sent successfully! I\u2019ll respond within 24 hours.',
          error: 'Something went wrong.',
          errorFallback: 'Something went wrong. Please try again or email info@imetech.nl.'
        }
      : {
          waiting: 'Even geduld...',
          success: 'Bericht succesvol verzonden! Ik reageer binnen 24 uur.',
          error: 'Er is iets misgegaan.',
          errorFallback: 'Er is iets misgegaan. Probeer het opnieuw of mail me direct.'
        };

    initWeb3ContactForm(
      document.getElementById('contactForm'),
      document.getElementById('contactResult'),
      contactMessages
    );
    initWeb3ContactForm(
      document.getElementById('floatingContactForm'),
      document.getElementById('floatingContactResult'),
      contactMessages
    );

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

    // ===== HERO SLIDE ORDERING =====
    function shuffleInPlace(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    }

    function isBgSlide(slide) {
      return /BG0[123]\.webp/i.test(slide.style.backgroundImage || '');
    }

    function orderHeroSlides(slideEls) {
      var bgSlides = [];
      var projectSlides = [];
      slideEls.forEach(function (s) {
        (isBgSlide(s) ? bgSlides : projectSlides).push(s);
      });

      if (bgSlides.length === 0) {
        var onlyProjects = projectSlides.slice();
        shuffleInPlace(onlyProjects);
        return onlyProjects;
      }

      if (projectSlides.length === 0) {
        shuffleInPlace(bgSlides);
        return bgSlides;
      }

      var attempt;
      for (attempt = 0; attempt < 20; attempt++) {
        var proj = projectSlides.slice();
        var bgs = bgSlides.slice();
        shuffleInPlace(proj);
        shuffleInPlace(bgs);

        var ordered = proj.slice();
        var allInserted = true;

        for (var b = 0; b < bgs.length; b++) {
          var gaps = [];
          for (var g = 1; g <= ordered.length; g++) {
            var leftBg = g > 0 && isBgSlide(ordered[g - 1]);
            var rightBg = g < ordered.length && isBgSlide(ordered[g]);
            if (!leftBg && !rightBg) {
              gaps.push(g);
            }
          }
          if (gaps.length === 0) {
            allInserted = false;
            break;
          }
          var pick = gaps[Math.floor(Math.random() * gaps.length)];
          ordered.splice(pick, 0, bgs[b]);
        }

        if (allInserted && !isBgSlide(ordered[0])) {
          var valid = true;
          for (var i = 1; i < ordered.length; i++) {
            if (isBgSlide(ordered[i]) && isBgSlide(ordered[i - 1])) {
              valid = false;
              break;
            }
          }
          if (valid && !(ordered.length > 1 && isBgSlide(ordered[ordered.length - 1]) && isBgSlide(ordered[0]))) {
            return ordered;
          }
        }
      }

      var merged = [];
      var pi = 0;
      var bi = 0;
      shuffleInPlace(projectSlides);
      shuffleInPlace(bgSlides);
      if (pi < projectSlides.length) merged.push(projectSlides[pi++]);
      while (bi < bgSlides.length || pi < projectSlides.length) {
        if (bi < bgSlides.length) merged.push(bgSlides[bi++]);
        if (pi < projectSlides.length) merged.push(projectSlides[pi++]);
      }
      return merged;
    }

    function applySlideOrder(slideEls) {
      var parent = slideEls[0].parentNode;
      var ordered = orderHeroSlides(slideEls);
      ordered.forEach(function (s) { parent.appendChild(s); });
      ordered.forEach(function (s) { s.classList.remove('active'); });
      ordered[0].classList.add('active');
      return ordered;
    }

    // ===== HERO CAROUSEL =====
    (function initHeroCarousel() {
      var slideEls = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
      if (slideEls.length <= 1 || prefersReduced) return;

      slideEls = applySlideOrder(slideEls);

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

      pageHeroSlides = applySlideOrder(pageHeroSlides);

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

    // ===== HERO STATS COUNTER (rAF after CSS fade-in; avoids IO/timer batching in Brave) =====
    var HERO_STATS_REVEAL_MS = 1500;
    var heroCountersStarted = false;

    function animateHeroCounter(el, target, suffix) {
      var duration = 2800;
      var startTime = null;

      function renderFrame(now) {
        if (startTime === null) startTime = now;
        var progress = Math.min((now - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(target * eased) + suffix;
        if (progress < 1) {
          requestAnimationFrame(renderFrame);
        } else {
          el.textContent = target + suffix;
          el.dataset.animating = '0';
        }
      }

      el.dataset.animating = '1';
      requestAnimationFrame(renderFrame);
    }

    function runHeroCounter(el) {
      if (el.dataset.counted === '1') return;
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-suffix') || '';
      el.dataset.counted = '1';
      el.textContent = '0' + suffix;
      if (prefersReduced) {
        el.textContent = target + suffix;
        return;
      }
      animateHeroCounter(el, target, suffix);
    }

    function startHeroCounters() {
      if (heroCountersStarted) return;
      var counters = document.querySelectorAll('.hero-stat-num[data-count]');
      if (!counters.length) return;
      heroCountersStarted = true;
      counters.forEach(runHeroCounter);
    }

    function scheduleHeroCounters() {
      if (heroCountersStarted) return;
      var delay = prefersReduced ? 0 : HERO_STATS_REVEAL_MS;
      window.setTimeout(function () {
        requestAnimationFrame(function () {
          requestAnimationFrame(startHeroCounters);
        });
      }, delay);
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
          scheduleHeroCounters();
        });
      });
    } else {
      scheduleHeroCounters();
    }

    // ===== FLOATING CTA (contact hub panel) =====
    var floatingCta = document.querySelector('.floating-cta');
    if (floatingCta && /contact\.html$/i.test(window.location.pathname)) {
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
          window.setTimeout(function () {
            if (!panelOpen) return;
            var firstInput = floatingPanel.querySelector('input:not([type="hidden"]):not([type="checkbox"])');
            if (firstInput) firstInput.focus();
          }, panelAnimMs);
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
          if (isPanelFieldsScrollTarget(e.target)) return;
          setPanelOpen(false);
        }, { passive: true });
      }

      var footerEl = document.querySelector('.footer');
      if (footerEl && 'IntersectionObserver' in window) {
        var footerObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            floatingCta.classList.toggle('is-hidden-near-footer', entry.isIntersecting);
            if (entry.isIntersecting && panelOpen) setPanelOpen(false);
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
})();
