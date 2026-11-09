/* IMeTech core — cookiebanner, Google Analytics (alleen na toestemming), zwevende contactknop
   en klik-metingen. Losstaand bestand voor pagina's die script.js niet laden (nieuwe homepage).
   Het cookie- en Analytics-deel is letterlijk overgenomen uit script.js, zodat het gedrag gelijk blijft. */
(function () {
  'use strict';
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    // Voorkeuren-popup: optionele cookies standaard aangevinkt zolang er nog geen keuze is opgeslagen.
    // Let op: volgens AP/HvJ-EU (Planet49) is een vooraf aangevinkt vakje geen geldige toestemming; zet op false om dat te volgen.
    var CONSENT_PREFS_PRECHECKED = true;

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
      var analyticsOn = hasAnalyticsConsent() || (CONSENT_PREFS_PRECHECKED && !safeGetCookieConsent());
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


  // ===== KLIK-METINGEN (gelijk aan script.js) =====
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) trackGtagEvent('tel_click', { link_url: href });
    else if (href.indexOf('mailto:') === 0) trackGtagEvent('mailto_click', { link_url: href });
    else if (href === '/contact/' || href === '/en/contact/') trackGtagEvent('cta_contact_click', { link_url: href, link_text: (link.textContent || '').trim().slice(0, 80) });
  });

  // ===== ZWEVENDE CONTACTKNOP (component uit /components, zelfde formulier als live) =====
  var isEn = document.documentElement.lang === 'en';
  var holder = document.getElementById('floating-cta-container');
  if (!holder) return;
  fetch('/components/floating-cta' + (isEn ? '-en' : '-nl') + '.html?v=20261107')
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var temp = document.createElement('div');
      temp.innerHTML = html;
      while (temp.firstChild) holder.parentNode.insertBefore(temp.firstChild, holder);
      holder.remove();
      initFloating();
    })
    .catch(function () {});

  function initFloating() {
    var cta = document.querySelector('.floating-cta');
    if (!cta) return;
    var btn = cta.querySelector('.floating-btn'), panel = cta.querySelector('.floating-panel'),
        backdrop = cta.querySelector('.floating-backdrop'), closeBtn = cta.querySelector('.floating-panel__close');
    var open = false, timer = null, ms = prefersReduced ? 0 : 450;

    function setOpen(next) {
      if (next === open) return;
      open = next;
      clearTimeout(timer);
      btn.setAttribute('aria-expanded', String(open));
      cta.classList.toggle('has-panel-open', open);
      if (open) {
        panel.removeAttribute('hidden'); backdrop.removeAttribute('hidden');
        requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add('open'); backdrop.classList.add('open'); }); });
        if (!window.matchMedia('(pointer: coarse)').matches) {
          setTimeout(function () { var f = panel.querySelector('input:not([type="hidden"]):not([type="checkbox"])'); if (open && f) f.focus(); }, ms);
        }
      } else {
        panel.classList.remove('open'); backdrop.classList.remove('open');
        timer = setTimeout(function () { if (!open) { panel.setAttribute('hidden', ''); backdrop.setAttribute('hidden', ''); } btn.focus({ preventScroll: true }); }, ms);
      }
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!open); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    backdrop.addEventListener('click', function () { setOpen(false); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('click', function () { if (open) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });

    // verbergen bij het grote contactblok en de footer: daar staat contact al in beeld
    var spots = document.querySelectorAll('.cta, .ftr, .footer');
    if ('IntersectionObserver' in window && spots.length) {
      var seen = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
        cta.classList.toggle('is-hidden-near-footer', seen.size > 0 && !open);
      }, { threshold: 0.15 });
      spots.forEach(function (s) { io.observe(s); });
    }

    // formulier versturen via Web3Forms (zelfde sleutel en velden als live)
    var form = document.getElementById('floatingContactForm'), result = document.getElementById('floatingContactResult');
    if (!form) return;
    if (result) result.textContent = ''; // leeg = verborgen (geen lege balk)
    var t = isEn
      ? { wait: 'Sending...', ok: 'Message sent! I’ll respond within 24 hours.', err: 'Something went wrong. Please try again or email info@imetech.nl.' }
      : { wait: 'Verzenden...', ok: 'Bericht verzonden! Ik reageer binnen 24 uur.', err: 'Er is iets misgegaan. Probeer het opnieuw of mail naar info@imetech.nl.' };
    var busy = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      busy = true;
      result.className = 'form-feedback-banner is-loading'; result.textContent = t.wait;
      var fp = form.querySelector('input[name="from_page"]'); if (fp) fp.value = location.pathname + location.search;
      var obj = {};
      new FormData(form).forEach(function (v, k) { obj[k] = Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] + ', ' + v : v; });
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(obj) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            trackGtagEvent('floating_contact_form_submit', { form_id: form.id, page_path: location.pathname });
            form.reset(); result.className = 'form-feedback-banner is-success'; result.textContent = t.ok;
          } else { result.className = 'form-feedback-banner is-error'; result.textContent = data.message || t.err; }
        })
        .catch(function () { result.className = 'form-feedback-banner is-error'; result.textContent = t.err; })
        .then(function () { busy = false; });
    });
  }
})();
