(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== HEADER: only go solid AFTER hero/page-hero fully leaves viewport =====
  var header = document.querySelector('.v2-header');
  var heroSection = document.querySelector('.v2-hero') || document.querySelector('.v2-page-hero');
  if (header && heroSection) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        header.classList.toggle('scrolled', !entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: '-64px 0px 0px 0px' });
    heroObserver.observe(heroSection);

    // At-top detection for larger logo
    function checkTop() {
      header.classList.toggle('at-top', window.scrollY < 10);
    }
    checkTop();
    window.addEventListener('scroll', checkTop, { passive: true });
  } else if (header) {
    header.classList.add('scrolled');
  }

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

  // ===== PAGE HERO CAROUSEL (e.g. services page) =====
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

    var hasParallax = decos.length || pxImages.length ||
      pxRotate.length || pxHeroImage || pxHeroTags.length ||
      pxTestimonials.length || pxProjectImgs.length;

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
})();
