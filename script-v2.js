(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      .catch(function () {});
  }

  var needsLoad =
    document.getElementById('v2-header-container') ||
    document.getElementById('v2-footer-container') ||
    document.getElementById('v2-floating-cta-container');

  if (needsLoad) {
    Promise.all([
      loadComponent('v2-header-container', '/components/v2-header.html'),
      loadComponent('v2-footer-container', '/components/v2-footer.html'),
      loadComponent('v2-floating-cta-container', '/components/v2-floating-cta.html')
    ]).then(initV2);
  } else {
    initV2();
  }

  function initV2() {

    // ===== HEADER: solid after hero leaves viewport =====
    var header = document.querySelector('.v2-header');
    var heroSection = document.querySelector('.v2-hero') || document.querySelector('.v2-page-hero');
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
        if (link.classList.contains('v2-nav-cta')) return false;
        var lp = linkPath(link.getAttribute('href'));
        if (!lp) return false;
        if (lp === '/en/v2' || lp === '/en/v2/') {
          return path === '/en/v2' || path === '/en/v2/index.html';
        }
        var base = lp.replace(/\.html$/, '');
        return path === lp || path === base || path.indexOf(base + '/') === 0;
      };
      var desktopNav = document.querySelector('.v2-nav');
      if (desktopNav) {
        desktopNav.querySelectorAll('a').forEach(function (a) {
          if (isActive(a)) a.classList.add('active');
        });
      }
      var mobileNavEl = document.querySelector('.v2-mobile-nav');
      if (mobileNavEl) {
        mobileNavEl.querySelectorAll('a:not(.v2-btn)').forEach(function (a) {
          if (a.closest('.v2-mobile-lang')) return;
          if (isActive(a)) a.classList.add('active');
        });
      }
    })();

    // ===== MOBILE NAV =====
    var burger = document.querySelector('.v2-burger');
    var mobileNav = document.querySelector('.v2-mobile-nav');
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
    var slides = document.querySelectorAll('.v2-hero-slide');
    if (slides.length > 1 && !prefersReduced) {
      var current = 0;
      var interval = 5000;
      function nextSlide() {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
      }
      var timer = setInterval(nextSlide, interval);
      var heroEl = document.querySelector('.v2-hero');
      if (heroEl) {
        heroEl.addEventListener('mouseenter', function () { clearInterval(timer); });
        heroEl.addEventListener('mouseleave', function () { timer = setInterval(nextSlide, interval); });
      }
    }

    // ===== PAGE HERO CAROUSEL =====
    var pageHeroSlides = document.querySelectorAll('.v2-page-hero-slide');
    if (pageHeroSlides.length > 1 && !prefersReduced) {
      var pageCurrent = 0;
      var pageInterval = 5000;
      function nextPageSlide() {
        pageHeroSlides[pageCurrent].classList.remove('active');
        pageCurrent = (pageCurrent + 1) % pageHeroSlides.length;
        pageHeroSlides[pageCurrent].classList.add('active');
      }
      var pageTimer = setInterval(nextPageSlide, pageInterval);
      var pageHeroEl = document.querySelector('.v2-page-hero');
      if (pageHeroEl) {
        pageHeroEl.addEventListener('mouseenter', function () { clearInterval(pageTimer); });
        pageHeroEl.addEventListener('mouseleave', function () { pageTimer = setInterval(nextPageSlide, pageInterval); });
      }
    }

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
      var headingEls = document.querySelectorAll('.v2-heading-animate');
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
    var progressBar = document.querySelector('.v2-scroll-progress');
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
      var decos = document.querySelectorAll('.v2-deco[data-speed]');
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
            var wrap = el.querySelector('.v2-wrap');
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
    var heroContent = document.querySelector('.v2-hero-content');
    if (heroContent) {
      heroContent.classList.add('v2-hero-enter');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          heroContent.classList.add('v2-hero-entered');
        });
      });
    }

    // ===== FLOATING CTA =====
    var floatingBtn = document.querySelector('.v2-floating-btn');
    var floatingOpts = document.querySelector('.v2-floating-options');
    if (floatingBtn && floatingOpts) {
      floatingBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        floatingOpts.classList.toggle('open');
      });
      document.addEventListener('click', function () {
        floatingOpts.classList.remove('open');
      });
    }

    // ===== PROJECT FILTER =====
    var filterBtns = document.querySelectorAll('.v2-filter-btn');
    var filterCards = document.querySelectorAll('[data-categories]');
    if (filterBtns.length && filterCards.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var filter = btn.getAttribute('data-filter');
          filterCards.forEach(function (card) {
            var show = filter === 'all' || card.getAttribute('data-categories').indexOf(filter) !== -1;
            card.classList.toggle('v2-filtered-out', !show);
          });
        });
      });
    }

    // ===== STAR RATING WIDGET =====
    var starContainer = document.querySelector('.v2-star-rating');
    if (starContainer) {
      var stars = starContainer.querySelectorAll('.v2-star');
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
          var span = btn.querySelector('span') || btn;
          var original = span.textContent;
          span.textContent = 'Copied!';
          setTimeout(function () { span.textContent = original; }, 2000);
        });
      });
    });

    // ===== REVIEW FORM WITH GOOGLE POPUP =====
    var googleReviewClicked = false;
    window.markGoogleReviewClicked = function() { googleReviewClicked = true; };

    var reviewForm = document.getElementById('reviewForm');
    var googleModal = document.getElementById('googleReminder');
    var btnGoogle = document.getElementById('btnGoogle');
    var btnSkip = document.getElementById('btnSkip');
    var reviewResult = document.getElementById('result');
    var selectedRating = 0;

    if (starContainer) {
      var allStars = starContainer.querySelectorAll('.v2-star');
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
        var formData = new FormData(reviewForm);
        var object = Object.fromEntries(formData);
        var json = JSON.stringify(object);
        if (reviewResult) { reviewResult.innerHTML = 'Please wait...'; reviewResult.style.display = 'block'; reviewResult.className = 'v2-form-result'; }
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: json
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data.success) {
            if (reviewResult) { reviewResult.innerHTML = 'Review submitted successfully! Thank you.'; reviewResult.className = 'v2-form-result v2-form-success'; reviewResult.style.display = 'block'; }
            reviewForm.reset();
            selectedRating = 0;
            if (starContainer) starContainer.querySelectorAll('.v2-star').forEach(function(s){ s.classList.remove('active'); });
          } else {
            if (reviewResult) { reviewResult.innerHTML = data.message || 'Something went wrong.'; reviewResult.className = 'v2-form-result v2-form-error'; reviewResult.style.display = 'block'; }
          }
        })
        .catch(function() {
          if (reviewResult) { reviewResult.innerHTML = 'Something went wrong. Please try again or email info@imetech.nl.'; reviewResult.className = 'v2-form-result v2-form-error'; reviewResult.style.display = 'block'; }
        })
        .then(function() {
          reviewForm.dataset.submitted = 'true';
          setTimeout(function(){ if (reviewResult) reviewResult.style.display = 'none'; }, 4000);
        });
      }

      reviewForm.addEventListener('submit', function(e) {
        if (!googleReviewClicked && !reviewForm.dataset.confirmed && selectedRating >= 4) {
          e.preventDefault();
          if (googleModal) googleModal.style.display = 'flex';
        } else if (!reviewForm.dataset.submitted) {
          e.preventDefault();
          sendReview();
        }
      });

      if (btnGoogle) {
        btnGoogle.addEventListener('click', function() {
          window.open('https://g.page/r/CY-Xn_8t6Vr3EAE/review', '_blank');
          googleReviewClicked = true;
          if (googleModal) googleModal.style.display = 'none';
        });
      }
      if (btnSkip) {
        btnSkip.addEventListener('click', function() {
          if (googleModal) googleModal.style.display = 'none';
          reviewForm.dataset.confirmed = 'true';
          reviewForm.requestSubmit();
        });
      }
    }

    // ===== CONTACT PAGE SCROLL =====
    (function() {
      var contactFormSection = document.getElementById('contact-form');
      if (!contactFormSection) return;
      document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (href === '#contact-form' || href === '/en/v2/contact.html#contact-form') {
          e.preventDefault();
          contactFormSection.scrollIntoView({ behavior: 'smooth' });
          var nameInput = contactFormSection.querySelector('input[name="name"]');
          if (nameInput) setTimeout(function(){ nameInput.focus(); }, 600);
        }
        if (window.location.pathname.indexOf('/en/v2/contact') !== -1 && (href === '/en/v2/contact.html' || href === '/en/v2/contact.html#contact-form')) {
          e.preventDefault();
          contactFormSection.scrollIntoView({ behavior: 'smooth' });
          var ni = contactFormSection.querySelector('input[name="name"]');
          if (ni) setTimeout(function(){ ni.focus(); }, 600);
        }
      });
    })();

    // ===== COOKIE CONSENT BANNER =====
    (function() {
      var consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        showCookieBanner();
      }

      function showCookieBanner() {
        var existing = document.getElementById('v2-cookie-banner');
        if (existing) { existing.style.display = 'flex'; return; }
        var banner = document.createElement('div');
        banner.id = 'v2-cookie-banner';
        banner.className = 'v2-cookie-banner';
        banner.innerHTML = '<div class="v2-cookie-inner">' +
          '<div class="v2-cookie-text"><span class="v2-cookie-icon">\uD83C\uDF6A</span>' +
          '<div><h3>Cookie preferences</h3>' +
          '<p>This website uses cookies for analytics and functionality. Read our <a href="/en/v2/privacy-policy.html">privacy policy</a>.</p></div></div>' +
          '<div class="v2-cookie-actions">' +
          '<button class="v2-btn v2-btn-outline v2-cookie-necessary">Necessary only</button>' +
          '<button class="v2-btn v2-btn-primary v2-cookie-accept">Accept all</button>' +
          '</div></div>';
        document.body.appendChild(banner);
        requestAnimationFrame(function(){ banner.classList.add('v2-cookie-visible'); });

        banner.querySelector('.v2-cookie-accept').addEventListener('click', function() {
          localStorage.setItem('cookieConsent', 'all');
          banner.classList.remove('v2-cookie-visible');
          setTimeout(function(){ banner.style.display = 'none'; }, 400);
        });
        banner.querySelector('.v2-cookie-necessary').addEventListener('click', function() {
          localStorage.setItem('cookieConsent', 'necessary');
          banner.classList.remove('v2-cookie-visible');
          setTimeout(function(){ banner.style.display = 'none'; }, 400);
        });
      }

      window.openCookieSettings = function() {
        localStorage.removeItem('cookieConsent');
        showCookieBanner();
      };
    })();

    // ===== GALLERY LIGHTBOX =====
    var galleryItems = document.querySelectorAll('.v2-gallery-item');
    if (galleryItems.length) {
      var lightbox = document.createElement('div');
      lightbox.className = 'v2-lightbox';
      lightbox.innerHTML = '<div class="v2-lightbox-overlay"></div><img class="v2-lightbox-img" alt="" /><button class="v2-lightbox-close" aria-label="Close">&times;</button>';
      document.body.appendChild(lightbox);
      var lbImg = lightbox.querySelector('.v2-lightbox-img');

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
