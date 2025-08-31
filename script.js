// ===== PROFESSIONAL INTERACTIONS & ANIMATIONS =====

// ===== COMPONENT LOADING SYSTEM =====
class ComponentLoader {
  constructor() {
    this.currentPath = window.location.pathname;
    this.baseUrl = this.calculateBaseUrl();
    this.language = this.detectLanguage();
    this.texts = this.getTexts();
  }

  calculateBaseUrl() {
    const path = this.currentPath;
    
    // Handle GitHub Pages subdirectory
    let adjustedPath = path;
    if (path.startsWith('/imetech-website/')) {
      adjustedPath = path.replace('/imetech-website', '');
    }
    
    // Count the number of directory levels from root
    const pathParts = adjustedPath.split('/').filter(part => part.length > 0);
    
    if (adjustedPath.startsWith('/en/')) {
      // For English pages: /en/about.html -> need 1 level up (../)
      // For English pages: /en/projects/robot.html -> need 2 levels up (../../)
      return '../'.repeat(pathParts.length);
    } else {
      // For Dutch pages: /index.html -> need 0 levels up
      // For Dutch pages: /projecten/robot.html -> need 1 level up (../)
      return '../'.repeat(pathParts.length);
    }
  }

  detectLanguage() {
    let path = this.currentPath;
    if (path.startsWith('/imetech-website/')) {
      path = path.replace('/imetech-website', '');
    }
    return path.startsWith('/en/') ? 'en' : 'nl';
  }

  getTexts() {
    const texts = {
      nl: {
        PHONE_TEXT: '+31 6 12 38 54 39',
        CONTACT_TEXT: 'Start een project',
        NAV_ARIA_LABEL: 'Hoofdnavigatie',
        NAV_HOME: 'Home',
        NAV_ABOUT: 'Over mij',
        NAV_SERVICES: 'Diensten',
        NAV_PROJECTS: 'Projecten',
        NAV_BLOG: 'Blog',
        NAV_CONTACT: 'Contact',
        LANG_ARIA_LABEL: 'Taal kiezen',
        MOBILE_MENU_ARIA: 'Menu openen',
        MOBILE_NAV_ARIA: 'Mobiele navigatie',
        MOBILE_CLOSE_ARIA: 'Menu sluiten',
        MOBILE_LANG_TITLE: 'Kies uw taal',
        FOOTER_MISSION: 'Eenvoudig als het kan, doordacht als het moet. Van idee tot werkend product.',
        FOOTER_VALUE_1_TITLE: 'Betrouwbaar',
        FOOTER_VALUE_1_DESC: 'Duidelijke communicatie en afspraken',
        FOOTER_VALUE_2_TITLE: 'Innovatief',
        FOOTER_VALUE_2_DESC: 'Moderne technieken en slimme oplossingen',
        FOOTER_VALUE_3_TITLE: 'Praktisch',
        FOOTER_VALUE_3_DESC: 'Van concept naar werkend product',
        FOOTER_CONTACT_TITLE: 'Direct contact',
        FOOTER_EMAIL_TITLE: 'Email',
        FOOTER_PHONE_TITLE: 'Telefoon',
        FOOTER_CTA_TITLE: 'Start je project',
        FOOTER_CTA_TEXT: 'Heb je een technische uitdaging? Laten we samen kijken naar de mogelijkheden.',
        FOOTER_CTA_BUTTON: 'Bespreek je project',
        FOOTER_DISCLAIMER: 'Disclaimer',
        FOOTER_TERMS: 'Algemene voorwaarden'
      },
      en: {
        PHONE_TEXT: '+31 6 12 38 54 39',
        CONTACT_TEXT: 'Start a project',
        NAV_ARIA_LABEL: 'Main navigation',
        NAV_HOME: 'Home',
        NAV_ABOUT: 'About',
        NAV_SERVICES: 'Services',
        NAV_PROJECTS: 'Projects',
        NAV_BLOG: 'Blog',
        NAV_CONTACT: 'Contact',
        LANG_ARIA_LABEL: 'Choose language',
        MOBILE_MENU_ARIA: 'Open menu',
        MOBILE_NAV_ARIA: 'Mobile navigation',
        MOBILE_CLOSE_ARIA: 'Close menu',
        MOBILE_LANG_TITLE: 'Choose your language',
        FOOTER_MISSION: 'Simple when possible, thoughtful when necessary. From idea to working product.',
        FOOTER_VALUE_1_TITLE: 'Reliable',
        FOOTER_VALUE_1_DESC: 'Clear communication and agreements',
        FOOTER_VALUE_2_TITLE: 'Innovative',
        FOOTER_VALUE_2_DESC: 'Modern techniques and smart solutions',
        FOOTER_VALUE_3_TITLE: 'Practical',
        FOOTER_VALUE_3_DESC: 'From concept to working product',
        FOOTER_CONTACT_TITLE: 'Direct contact',
        FOOTER_EMAIL_TITLE: 'Email',
        FOOTER_PHONE_TITLE: 'Phone',
        FOOTER_CTA_TITLE: 'Start your project',
        FOOTER_CTA_TEXT: 'Do you have a technical challenge? Let\'s explore the possibilities together.',
        FOOTER_CTA_BUTTON: 'Discuss your project',
        FOOTER_DISCLAIMER: 'Disclaimer',
        FOOTER_TERMS: 'Terms & Conditions'
      }
    };
    return texts[this.language];
  }

  generateLanguageUrls() {
    let currentPath = this.currentPath;
    
    // Handle GitHub Pages subdirectory
    if (currentPath.startsWith('/imetech-website/')) {
      currentPath = currentPath.replace('/imetech-website', '');
    }
    
    if (this.language === 'en') {
      // English to Dutch mappings (including all project pages)
      const pathMappings = {
        '/en/': '/',
        '/en/index.html': '/index.html',
        '/en/about.html': '/over-mij.html',
        '/en/services.html': '/diensten.html',
        '/en/contact.html': '/contact.html',
        '/en/projects/': '/projecten/',
        '/en/projects/index.html': '/projecten/index.html',
        '/en/projects/2x2-steering-robot.html': '/projecten/2x2-steering-robot.html',
        '/en/projects/6-dof-spacemouse.html': '/projecten/6-dof-spacemouse.html',
        '/en/projects/magnetic-levitation-planter.html': '/projecten/magnetische-levitatie-plantenpot.html',
        '/en/projects/letter-clock.html': '/projecten/letterklok.html',
        '/en/projects/dual-lab-power-supply.html': '/projecten/dubbele-labvoeding.html',
        '/en/projects/fume-extractor.html': '/projecten/fume-extractor.html',
        '/en/projects/laptop-stand.html': '/projecten/laptop-stand.html',
        '/en/projects/multifunctional-soldering-station.html': '/projecten/multifunctioneel-soldeerstation.html',
        '/en/projects/self-balancing-cube.html': '/projecten/zelfbalancende-kubus.html',
        '/en/projects/usb-c-charging-pcb.html': '/projecten/usb-c-laad-pcb.html',
        '/en/blog/': '/blog/',
        '/en/blog/index.html': '/blog/index.html',
        '/en/review.html': '/review.html',
        '/en/disclaimer/': '/disclaimer/',
        '/en/terms-and-conditions/': '/algemenevoorwaarden/',
        '/en/404.html': '/404.html'
      };
      
      const nlUrl = pathMappings[currentPath] || '/';
      return {
        NL_URL: this.baseUrl + (nlUrl.startsWith('/') ? nlUrl.substring(1) : nlUrl),
        EN_URL: currentPath
      };
    } else {
      // Dutch to English mappings (including all project pages)
      const pathMappings = {
        '/': '/en/',
        '/index.html': '/en/index.html',
        '/over-mij.html': '/en/about.html',
        '/diensten.html': '/en/services.html',
        '/contact.html': '/en/contact.html',
        '/projecten/': '/en/projects/',
        '/projecten/index.html': '/en/projects/index.html',
        '/projecten/2x2-steering-robot.html': '/en/projects/2x2-steering-robot.html',
        '/projecten/6-dof-spacemouse.html': '/en/projects/6-dof-spacemouse.html',
        '/projecten/magnetische-levitatie-plantenpot.html': '/en/projects/magnetic-levitation-planter.html',
        '/projecten/letterklok.html': '/en/projects/letter-clock.html',
        '/projecten/dubbele-labvoeding.html': '/en/projects/dual-lab-power-supply.html',
        '/projecten/fume-extractor.html': '/en/projects/fume-extractor.html',
        '/projecten/laptop-stand.html': '/en/projects/laptop-stand.html',
        '/projecten/multifunctioneel-soldeerstation.html': '/en/projects/multifunctional-soldering-station.html',
        '/projecten/zelfbalancende-kubus.html': '/en/projects/self-balancing-cube.html',
        '/projecten/usb-c-laad-pcb.html': '/en/projects/usb-c-charging-pcb.html',
        '/blog/': '/en/blog/',
        '/blog/index.html': '/en/blog/index.html',
        '/review.html': '/en/review.html',
        '/disclaimer/': '/en/disclaimer/',
        '/algemenevoorwaarden/': '/en/terms-and-conditions/',
        '/404.html': '/en/404.html'
      };
      
      const enUrl = pathMappings[currentPath] || '/en/';
      return {
        NL_URL: currentPath,
        EN_URL: this.baseUrl + (enUrl.startsWith('/') ? enUrl.substring(1) : enUrl)
      };
    }
  }

  generateNavigationUrls() {
    if (this.language === 'en') {
      // For English pages, use relative paths to English pages
      return {
        HOME_URL: 'index.html',
        ABOUT_URL: 'about.html',
        SERVICES_URL: 'services.html',
        PROJECTS_URL: 'projects/',
        BLOG_URL: 'blog/',
        CONTACT_URL: 'contact.html',
        DISCLAIMER_URL: 'disclaimer.html',
        TERMS_URL: 'termsandconditions.html'
      };
    } else {
      // For Dutch pages, use relative paths to Dutch pages
      return {
        HOME_URL: 'index.html',
        ABOUT_URL: 'over-mij.html',
        SERVICES_URL: 'diensten.html',
        PROJECTS_URL: 'projecten/',
        BLOG_URL: 'blog/',
        CONTACT_URL: 'contact.html',
        DISCLAIMER_URL: 'disclaimer.html',
        TERMS_URL: 'algemenevoorwaarden.html'
      };
    }
  }

  async loadComponent(componentName) {
    try {
      const componentUrl = `${this.baseUrl}components/${componentName}.html`;
      // component load trace
      
      const response = await fetch(componentUrl);
      if (!response.ok) throw new Error(`Failed to load ${componentName}`);
      
      let html = await response.text();
      
      // Replace placeholders
      const langUrls = this.generateLanguageUrls();
      const navUrls = this.generateNavigationUrls();
      
      // Create full URLs by combining BASE_URL with navigation URLs
      const fullNavUrls = {};
      Object.entries(navUrls).forEach(([key, value]) => {
        if (this.language === 'en') {
          // For English pages, we need to ensure URLs point to /en/ directory
          // If we're in /en/projects/, baseUrl is ../../, so we need to go back to /en/
          if (this.currentPath.includes('/en/projects/')) {
            // From /en/projects/ -> need ../../ to get to root, then /en/
            fullNavUrls[key] = '../../en/' + value;
          } else if (this.currentPath.includes('/en/')) {
            // From /en/ -> need ../ to get to root, then /en/
            fullNavUrls[key] = '../en/' + value;
          } else {
            // Fallback
            fullNavUrls[key] = this.baseUrl + value;
          }
        } else {
          // For Dutch pages, use normal relative paths
          fullNavUrls[key] = this.baseUrl + value;
        }
      });
      
      const replacements = {
        '{BASE_URL}': this.baseUrl,
        ...this.texts,
        ...langUrls,
        ...fullNavUrls
      };
      
      // Handle navigation URLs based on language for old component templates
      if (this.language === 'en') {
        // Replace Dutch URLs with English equivalents
        html = html.replace(/{BASE_URL}index\.html/g, `${this.baseUrl}index.html`);
        html = html.replace(/{BASE_URL}over-mij\.html/g, `${this.baseUrl}about.html`);
        html = html.replace(/{BASE_URL}diensten\.html/g, `${this.baseUrl}services.html`);
        html = html.replace(/{BASE_URL}projecten\//g, `${this.baseUrl}projects/`);
        html = html.replace(/{BASE_URL}blog\//g, `${this.baseUrl}blog/`);
        html = html.replace(/{BASE_URL}review\.html/g, `${this.baseUrl}review.html`);
        html = html.replace(/{BASE_URL}contact\.html/g, `${this.baseUrl}contact.html`);
        html = html.replace(/{BASE_URL}disclaimer\.html/g, `${this.baseUrl}disclaimer.html`);
        html = html.replace(/{BASE_URL}algemenevoorwaarden\.html/g, `${this.baseUrl}termsandconditions.html`);
      } else {
        // Replace English URLs with Dutch equivalents (for Dutch pages)
        html = html.replace(/{BASE_URL}about\.html/g, `${this.baseUrl}over-mij.html`);
        html = html.replace(/{BASE_URL}services\.html/g, `${this.baseUrl}diensten.html`);
        html = html.replace(/{BASE_URL}projects\//g, `${this.baseUrl}projecten/`);
        html = html.replace(/{BASE_URL}blog\//g, `${this.baseUrl}blog/`);
        html = html.replace(/{BASE_URL}review\.html/g, `${this.baseUrl}review.html`);
        html = html.replace(/{BASE_URL}termsandconditions\.html/g, `${this.baseUrl}algemenevoorwaarden.html`);
      }
      
      // Additional URL replacements for component templates
      if (this.language === 'en') {
        // For English pages, ensure all navigation links point to English pages
        // Replace any remaining Dutch URLs in the component templates
        html = html.replace(/href="([^"]*\/)index\.html"/g, 'href="$1index.html"');
        html = html.replace(/href="([^"]*\/)over-mij\.html"/g, 'href="$1about.html"');
        html = html.replace(/href="([^"]*\/)diensten\.html"/g, 'href="$1services.html"');
        html = html.replace(/href="([^"]*\/)projecten\//g, 'href="$1projects/');
        html = html.replace(/href="([^"]*\/)blog\//g, 'href="$1blog/');
        html = html.replace(/href="([^"]*\/)review\.html"/g, 'href="$1review.html"');
        html = html.replace(/href="([^"]*\/)contact\.html"/g, 'href="$1contact.html"');
        html = html.replace(/href="([^"]*\/)disclaimer\.html"/g, 'href="$1disclaimer.html"');
        html = html.replace(/href="([^"]*\/)algemenevoorwaarden\.html"/g, 'href="$1termsandconditions.html"');
        
        // Also handle direct href replacements without path prefix
        html = html.replace(/href="over-mij\.html"/g, 'href="about.html"');
        html = html.replace(/href="diensten\.html"/g, 'href="services.html"');
        html = html.replace(/href="projecten\//g, 'href="projects/');
        html = html.replace(/href="blog\//g, 'href="blog/');
        html = html.replace(/href="review\.html"/g, 'href="review.html"');
        html = html.replace(/href="algemenevoorwaarden\.html"/g, 'href="termsandconditions.html"');
      } else {
        // For Dutch pages, ensure all navigation links point to Dutch pages
        html = html.replace(/href="([^"]*\/)about\.html"/g, 'href="$1over-mij.html"');
        html = html.replace(/href="([^"]*\/)services\.html"/g, 'href="$1diensten.html"');
        html = html.replace(/href="([^"]*\/)projects\//g, 'href="$1projecten/');
        html = html.replace(/href="([^"]*\/)blog\//g, 'href="$1blog/');
        html = html.replace(/href="([^"]*\/)termsandconditions\.html"/g, 'href="$1algemenevoorwaarden.html"');
        
        // Also handle direct href replacements without path prefix
        html = html.replace(/href="about\.html"/g, 'href="over-mij.html"');
        html = html.replace(/href="services\.html"/g, 'href="diensten.html"');
        html = html.replace(/href="projects\//g, 'href="projecten/');
        html = html.replace(/href="blog\//g, 'href="blog/');
        html = html.replace(/href="review\.html"/g, 'href="review.html"');
        html = html.replace(/href="termsandconditions\.html"/g, 'href="algemenevoorwaarden.html"');
      }
      
      // Replace all placeholders
      Object.entries(replacements).forEach(([key, value]) => {
        // Remove curly brackets from key for regex
        const cleanKey = key.replace(/^{|}$/g, '');
        html = html.replace(new RegExp(`\\{${cleanKey}\\}`, 'g'), value);
      });
      
      return html;
    } catch (error) {
      console.error(`Error loading ${componentName}:`, error);
      return '';
    }
  }

  async loadHeader() {
    const headerHtml = await this.loadComponent('header');
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = headerHtml;
    } else {
      document.body.insertAdjacentHTML('afterbegin', headerHtml);
    }
  }

  async loadFooter() {
    const footerHtml = await this.loadComponent('footer');
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      footerContainer.innerHTML = footerHtml;
    } else {
      document.body.insertAdjacentHTML('beforeend', footerHtml);
    }
  }

  async loadComponents() {
    await Promise.all([
      this.loadHeader(),
      this.loadFooter()
    ]);
    
    // Initialize other scripts after components are loaded
    this.initializeScripts();
  }

  initializeScripts() {
    // Re-initialize all event listeners after components are loaded
    initMobileNavigation();
    initLanguageSwitching();
    setActiveNavigation();
  }
}

// Initialize component loader
document.addEventListener('DOMContentLoaded', async function() {
  const loader = new ComponentLoader();
  await loader.loadComponents();
});

// ===== MOBILE NAVIGATION =====
function initMobileNavigation() {
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavClose = document.querySelector('.mobile-nav-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (!mobileNavToggle || !mobileNav) return; // Exit if elements don't exist

  // Toggle mobile navigation
  function toggleMobileNav() {
    const isActive = mobileNav.classList.contains('active');
    
    if (isActive) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  function openMobileNav() {
    mobileNav.classList.add('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
    mobileNavToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav.classList.remove('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
    mobileNavToggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Event listeners
  mobileNavToggle.addEventListener('click', toggleMobileNav);

  if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeMobileNav);
  }

  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', closeMobileNav);
  }

  // Close mobile nav when clicking on links
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(closeMobileNav, 150);
    });
  });

  // Close mobile nav on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
      closeMobileNav();
    }
  });

  // Close mobile nav on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileNav.classList.contains('active')) {
      closeMobileNav();
    }
  });
}

// ===== LANGUAGE SWITCHING =====
function initLanguageSwitching() {
  const langOptions = document.querySelectorAll('.lang-option, .mobile-lang-option');
  
  langOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = option.dataset.lang;
      let currentPath = window.location.pathname;
      if (currentPath.startsWith('/imetech-website/')) {
        currentPath = currentPath.replace('/imetech-website', '');
      }
      
      // Enhanced language switching logic for modular website
      if (targetLang === 'en') {
        // Switch to English version
        if (currentPath.startsWith('/en/')) {
          // Already on English version
          return;
        } else {
          // Map Dutch pages to English equivalents
          const pathMapping = {
            '/': '/en/',
            '/index.html': '/en/index.html',
            '/over-mij.html': '/en/about.html',
            '/diensten.html': '/en/services.html',
            '/contact.html': '/en/contact.html',
            '/algemenevoorwaarden.html': '/en/termsandconditions.html',
            '/disclaimer.html': '/en/disclaimer.html',
            '/projecten/': '/en/projects/',
            '/projecten/index.html': '/en/projects/index.html',
            '/projecten/2x2-steering-robot.html': '/en/projects/2x2-steering-robot.html',
            '/projecten/6-dof-spacemouse.html': '/en/projects/6-dof-spacemouse.html',
            '/projecten/dubbele-labvoeding.html': '/en/projects/dual-lab-power-supply.html',
            '/projecten/fume-extractor.html': '/en/projects/fume-extractor.html',
            '/projecten/laptop-stand.html': '/en/projects/laptop-stand.html',
            '/projecten/letterklok.html': '/en/projects/letter-clock.html',
            '/projecten/magnetische-levitatie-plantenpot.html': '/en/projects/magnetic-levitation-planter.html',
            '/projecten/multifunctioneel-soldeerstation.html': '/en/projects/multifunctional-soldering-station.html',
            '/projecten/usb-c-laad-pcb.html': '/en/projects/usb-c-charging-pcb.html',
            '/projecten/zelfbalancerende-kubus.html': '/en/projects/self-balancing-cube.html',
            '/blog/': '/en/blog/',
            '/blog/index.html': '/en/blog/index.html',
            '/review.html': '/en/review.html',
            '/404.html': '/en/404.html'
          };
          
          const englishPath = pathMapping[currentPath] || '/en/';
          const prefix = window.location.pathname.startsWith('/imetech-website/') ? '/imetech-website' : '';
          window.location.href = prefix + englishPath;
        }
      } else {
        // Switch to Dutch version  
        if (currentPath.startsWith('/en/')) {
          const pathMapping = {
            '/en/': '/',
            '/en/index.html': '/index.html',
            '/en/about.html': '/over-mij.html',
            '/en/services.html': '/diensten.html', 
            '/en/contact.html': '/contact.html',
            '/en/termsandconditions.html': '/algemenevoorwaarden.html',
            '/en/disclaimer.html': '/disclaimer.html',
            '/en/projects/': '/projecten/',
            '/en/projects/index.html': '/projecten/index.html',
            '/en/projects/2x2-steering-robot.html': '/projecten/2x2-steering-robot.html',
            '/en/projects/6-dof-spacemouse.html': '/projecten/6-dof-spacemouse.html',
            '/en/projects/dual-lab-power-supply.html': '/projecten/dubbele-labvoeding.html',
            '/en/projects/fume-extractor.html': '/projecten/fume-extractor.html',
            '/en/projects/laptop-stand.html': '/projecten/laptop-stand.html',
            '/en/projects/letter-clock.html': '/projecten/letterklok.html',
            '/en/projects/magnetic-levitation-planter.html': '/projecten/magnetische-levitatie-plantenpot.html',
            '/en/projects/multifunctional-soldering-station.html': '/projecten/multifunctioneel-soldeerstation.html',
            '/en/projects/usb-c-charging-pcb.html': '/projecten/usb-c-laad-pcb.html',
            '/en/projects/self-balancing-cube.html': '/projecten/zelfbalancerende-kubus.html',
            '/en/blog/': '/blog/',
            '/en/blog/index.html': '/blog/index.html',
            '/en/review.html': '/review.html',
            '/en/404.html': '/404.html'
          };
          
          const dutchPath = pathMapping[currentPath] || '/';
          const prefix = window.location.pathname.startsWith('/imetech-website/') ? '/imetech-website' : '';
          window.location.href = prefix + dutchPath;
        } else {
          // Already on Dutch version
          return;
        }
      }
    });
  });
}

// ===== ACTIVE NAVIGATION HIGHLIGHTING =====
function setActiveNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath || 
        (currentPath === '/' && linkPath === '/index.html') ||
        (currentPath.includes('/projecten/') && linkPath.includes('/projecten/')) ||
        (currentPath.includes('/en/projects/') && linkPath.includes('/en/projects/')) ||
        (currentPath.includes('/blog/') && linkPath.includes('/blog/'))) {
      link.classList.add('active');
    }
  });
  
  // Set active language
  const langOptions = document.querySelectorAll('.lang-option, .mobile-lang-option');
  langOptions.forEach(option => {
    option.classList.remove('active');
    
    if ((currentPath.startsWith('/en/') && option.dataset.lang === 'en') ||
        (!currentPath.startsWith('/en/') && option.dataset.lang === 'nl')) {
      option.classList.add('active');
    }
  });
}

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-on-scroll');
      
      // Specific animations for different sections
      if (entry.target.classList.contains('skills-grid')) {
        animateSkillCards();
      }
      
      if (entry.target.classList.contains('project-grid')) {
        animateProjectCards();
      }
      
      if (entry.target.classList.contains('story-blocks')) {
        animateStoryBlocks();
      }
    }
  });
}, observerOptions);

// Observe all sections and key elements
document.addEventListener('DOMContentLoaded', function() {
  const elementsToObserve = [
    '.section-intro',
    '.skills-grid', 
    '.project-grid',
    '.story-blocks',
    '.contact-intro',
    '.work-cta',
    '.contact-cta',
    '.personal-content'
  ];
  
  elementsToObserve.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => observer.observe(el));
  });

  // Initialize navigation features
  initLanguageSwitching();
  setActiveNavigation();
});

// ===== ENHANCED SKILL CARDS ANIMATION =====
function animateSkillCards() {
  const skillCards = document.querySelectorAll('.skill-card');
  
  skillCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      card.style.transition = 'all 0.6s ease-out';
      
      // Animate stat bars
      const statFill = card.querySelector('.stat-fill');
      if (statFill) {
        const width = statFill.dataset.width;
        setTimeout(() => {
          statFill.style.width = width + '%';
        }, 300);
      }
    }, index * 150);
  });
}

// ===== SKILL CARD INTERACTIONS =====
function initSkillCardInteractions() {
  const skillCards = document.querySelectorAll('.interactive-card');
  
  skillCards.forEach(card => {
    // Mouse enter effect
    card.addEventListener('mouseenter', function() {
      // Pause icon pulse animation
      const iconPulse = this.querySelector('.icon-pulse');
      if (iconPulse) {
        iconPulse.style.animationPlayState = 'paused';
      }
      
      // Add floating effect to tech badges
      const techBadges = this.querySelectorAll('.tech-badge');
      techBadges.forEach((badge, index) => {
        setTimeout(() => {
          badge.style.transform = 'translateY(-4px)';
        }, index * 100);
      });
    });
    
    // Mouse leave effect
    card.addEventListener('mouseleave', function() {
      // Resume icon pulse animation
      const iconPulse = this.querySelector('.icon-pulse');
      if (iconPulse) {
        iconPulse.style.animationPlayState = 'running';
      }
      
      // Reset tech badges
      const techBadges = this.querySelectorAll('.tech-badge');
      techBadges.forEach(badge => {
        badge.style.transform = 'translateY(0)';
      });
    });
    
    // Click effect
    card.addEventListener('click', function(e) {
      // Don't trigger if clicking on CTA button
      if (e.target.closest('.enhanced-cta')) return;
      
      // Add click ripple effect
      const ripple = document.createElement('div');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(30, 64, 175, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: skillRipple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
      `;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // Add ripple animation CSS
  const rippleStyles = document.createElement('style');
  rippleStyles.textContent = `
    @keyframes skillRipple {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(rippleStyles);
}

// ===== PROJECT CARDS ANIMATION =====
function animateProjectCards() {
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      card.style.transition = 'all 0.6s ease-out';
    }, index * 100);
  });
}

// ===== STORY BLOCKS ANIMATION =====
function animateStoryBlocks() {
  const storyBlocks = document.querySelectorAll('.story-block');
  storyBlocks.forEach((block, index) => {
    setTimeout(() => {
      block.style.opacity = '1';
      block.style.transform = 'translateY(0)';
      block.style.transition = 'all 0.6s ease-out';
    }, index * 200);
  });
}

// ===== PROFESSIONAL BUTTON INTERACTIONS =====
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
  // Enhanced ripple effect
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// ===== SKILL CARD INTERACTIONS =====
const skillCards = document.querySelectorAll('.skill-card');

skillCards.forEach(card => {
  card.addEventListener('mouseenter', function() {
    // Add subtle glow effect
    this.style.boxShadow = '0 25px 50px -12px rgba(30, 64, 175, 0.25)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.boxShadow = '';
  });
});

// ===== PROJECT CARD INTERACTIONS =====
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
  card.addEventListener('mouseenter', function() {
    // Enhanced hover effect
    const image = this.querySelector('.project-image img');
    if (image) {
      image.style.transform = 'scale(1.05)';
    }
  });
  
  card.addEventListener('mouseleave', function() {
    const image = this.querySelector('.project-image img');
    if (image) {
      image.style.transform = 'scale(1)';
    }
  });
});

// ===== CONTACT METHOD INTERACTIONS =====
const contactMethods = document.querySelectorAll('.contact-method');

contactMethods.forEach(method => {
  method.addEventListener('mouseenter', function() {
    const icon = this.querySelector('.contact-icon');
    if (icon) {
      icon.style.transform = 'scale(1.1)';
      icon.style.background = 'var(--primary)';
      icon.style.color = 'var(--text-inverse)';
    }
  });
  
  method.addEventListener('mouseleave', function() {
    const icon = this.querySelector('.contact-icon');
    if (icon) {
      icon.style.transform = 'scale(1)';
      icon.style.background = 'var(--gray-100)';
      icon.style.color = 'var(--primary)';
    }
  });
});

// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ===== TYPING EFFECT FOR MISSION STATEMENT =====
function typeWriter() {
  const missionElement = document.querySelector('.mission-statement');
  if (!missionElement) return;

  const text = missionElement.textContent;
  missionElement.textContent = '';

  // Create a span for the text and a span for the cursor
  const textSpan = document.createElement('span');
  const cursorSpan = document.createElement('span');
  cursorSpan.className = 'typewriter-cursor';
  cursorSpan.textContent = '|';
  cursorSpan.style.display = 'inline-block';
  cursorSpan.style.color = 'var(--primary)';
  cursorSpan.style.marginLeft = '2px';
  cursorSpan.style.animation = 'blink-cursor 1s steps(2, start) infinite';

  missionElement.appendChild(textSpan);
  missionElement.appendChild(cursorSpan);

  let i = 0;
  function type() {
    if (i < text.length) {
      textSpan.textContent += text.charAt(i);
      i++;
      setTimeout(type, 50);
    } else {
      setTimeout(() => {
        cursorSpan.style.display = 'none';
      }, 500);
    }
  }

  // Start typing after page load
  setTimeout(type, 1000);
}

// Add CSS for blinking cursor
const style = document.createElement('style');
style.innerHTML = `
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.typewriter-cursor {
  font-weight: bold;
  font-size: 1em;
  vertical-align: baseline;
}
`;
document.head.appendChild(style);

// ===== PARALLAX EFFECT FOR IMAGES =====
function initParallax() {
  // Parallax effect disabled to prevent image displacement issues
  // const parallaxElements = document.querySelectorAll('.workspace-main');
  
  // window.addEventListener('scroll', () => {
  //   const scrolled = window.pageYOffset;
  //   const rate = scrolled * -0.3;
    
  //   parallaxElements.forEach(element => {
  //     if (isElementInViewport(element)) {
  //       element.style.transform = `translateY(${rate}px)`;
  //     }
  //   });
  // });
}

// ===== UTILITY FUNCTIONS =====
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ===== PERFORMANCE OPTIMIZATIONS =====
function throttle(func, wait) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  }
}

// ===== HERO CONSOLE INTERACTIONS =====
function initHeroConsole() {
  // Animate counter statistics
  const statValues = document.querySelectorAll('.stat-value[data-target]');
  
  statValues.forEach(stat => {
    const target = parseInt(stat.dataset.target);
    const isPercentage = stat.textContent.includes('%');
    const isPlus = stat.textContent.includes('+');
    let current = 0;
    const increment = target / 30; // Animate over 30 steps for faster animation
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      
      if (isPercentage) {
        stat.textContent = Math.floor(current) + '%';
      } else if (isPlus) {
        stat.textContent = Math.floor(current) + '+';
      } else {
        stat.textContent = Math.floor(current);
      }
    }, 50);
  });
  
  // Typing animation for terminal command
  const commandElement = document.getElementById('typing-command');
  if (commandElement) {
    const commands = [
      'status --projects',
      'list --completed',
      'check --availability',
      'contact --info'
    ];
    
    let commandIndex = 0;
    
    function typeCommand() {
      const command = commands[commandIndex];
      let charIndex = 0;
      commandElement.textContent = '';
      
      const typeInterval = setInterval(() => {
        if (charIndex < command.length) {
          commandElement.textContent += command.charAt(charIndex);
          charIndex++;
        } else {
          clearInterval(typeInterval);
          
          // Wait before starting next command
          setTimeout(() => {
            commandIndex = (commandIndex + 1) % commands.length;
            typeCommand();
          }, 2000);
        }
      }, 100);
    }
    
    // Start typing animation after page load
    setTimeout(typeCommand, 1500);
  }
}

// ===== COMMUNICATION HUB INTERACTIONS =====
function initCommunicationHub() {
  // Update current time
  function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      timeElement.textContent = timeString;
    }
  }
  
  // Update time every second
  updateTime();
  setInterval(updateTime, 1000);
  
  // Channel hover effects
  const channelItems = document.querySelectorAll('.channel-item');
  
  channelItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      const channel = this.dataset.channel;
      
      // Add specific hover effects based on channel type
      if (channel === 'email') {
        this.style.background = 'linear-gradient(135deg, rgba(30, 64, 175, 0.1), rgba(59, 130, 246, 0.1))';
      } else if (channel === 'phone') {
        this.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1))';
      } else if (channel === 'meeting') {
        this.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1))';
      }
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.background = '';
    });
  });
}

// ===== EXPERTISE PANEL INTERACTIONS =====
function initExpertisePanels() {
  const expertisePanels = document.querySelectorAll('.expertise-panel');

  expertisePanels.forEach(panel => {
    // Add entrance animation
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(30px)';

    // Observe for scroll animation
    observer.observe(panel);

    // Mouse interactions for desktop
    panel.addEventListener('mouseenter', function() {
      if (window.innerWidth > 768) {
        const overlay = this.querySelector('.panel-overlay');
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
      }
    });
    
    panel.addEventListener('mouseleave', function() {
      if (window.innerWidth > 768) {
        const overlay = this.querySelector('.panel-overlay');
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
      }
    });

    // Touch interactions for mobile
    let touchStartTime = 0;
    let touchStartY = 0;
    
    panel.addEventListener('touchstart', function(e) {
      touchStartTime = Date.now();
      touchStartY = e.touches[0].clientY;
      
      // Add touch-active class immediately
      this.classList.add('touch-active');
    }, { passive: true });
    
    panel.addEventListener('touchend', function(e) {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      const touchEndY = e.changedTouches[0].clientY;
      const touchDistance = Math.abs(touchEndY - touchStartY);
      
      // Only trigger if it's a short tap (not a scroll)
      if (touchDuration < 300 && touchDistance < 10) {
        const overlay = this.querySelector('.panel-overlay');
        const isVisible = overlay.style.opacity === '1';
        
        // Close other overlays
        expertisePanels.forEach(otherPanel => {
          if (otherPanel !== this) {
            const otherOverlay = otherPanel.querySelector('.panel-overlay');
            otherOverlay.style.opacity = '0';
            otherOverlay.style.visibility = 'hidden';
            otherPanel.classList.remove('touch-active');
          }
        });
        
        // Toggle this overlay
        overlay.style.opacity = isVisible ? '0' : '1';
        overlay.style.visibility = isVisible ? 'hidden' : 'visible';
        
        if (!isVisible) {
          // Keep touch-active class when overlay is visible
          this.classList.add('touch-active');
        } else {
          this.classList.remove('touch-active');
        }
      } else {
        // Remove touch-active class for scrolls
        this.classList.remove('touch-active');
      }
    }, { passive: true });
    
    // Click interaction for mobile (fallback)
    panel.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        // Prevent default click behavior on mobile
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });

  // Stagger animation for panels
  const animateExpertisePanels = () => {
    const panels = document.querySelectorAll('.expertise-panel');
    panels.forEach((panel, index) => {
      setTimeout(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
        panel.style.transition = 'all 0.6s ease-out';
      }, index * 100);
    });
  };

  // Observe expertise dashboard
  const expertiseDashboard = document.querySelector('.expertise-dashboard');
  if (expertiseDashboard) {
    const dashboardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateExpertisePanels();
          dashboardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    dashboardObserver.observe(expertiseDashboard);
  }

  // Reset overlays on click outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.expertise-panel')) {
      expertisePanels.forEach(panel => {
        const overlay = panel.querySelector('.panel-overlay');
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        panel.classList.remove('touch-active');
      });
    }
  });
  
  // Reset overlays on touch outside (mobile)
  document.addEventListener('touchend', function(e) {
    if (!e.target.closest('.expertise-panel')) {
      expertisePanels.forEach(panel => {
        const overlay = panel.querySelector('.panel-overlay');
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        panel.classList.remove('touch-active');
      });
    }
  }, { passive: true });
}

// ===== PERSONAL SECTION INTERACTIONS =====
function initPersonalSection() {
  const personalContent = document.querySelector('.personal-content');
  const profileCard = document.querySelector('.profile-card');
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  
  if (!personalContent) return;
  
  // Animate profile card stats on scroll
  const personalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate stat numbers
        statNumbers.forEach(stat => {
          const target = parseInt(stat.dataset.target);
          let current = 0;
          const increment = target / 20;
          
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            stat.textContent = Math.floor(current);
          }, 50);
        });
        
        personalObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  personalObserver.observe(personalContent);
  
  // Profile card hover effects
  if (profileCard) {
    const bgDots = profileCard.querySelectorAll('.dot');
    const avatarRing = profileCard.querySelector('.avatar-ring');
    
    profileCard.addEventListener('mouseenter', function() {
      // Pause background dots animation
      bgDots.forEach(dot => {
        dot.style.animationPlayState = 'paused';
      });
      
      // Enhance avatar ring
      if (avatarRing) {
        avatarRing.style.animationDuration = '1s';
      }
    });
    
    profileCard.addEventListener('mouseleave', function() {
      // Resume background dots animation
      bgDots.forEach(dot => {
        dot.style.animationPlayState = 'running';
      });
      
      // Reset avatar ring
      if (avatarRing) {
        avatarRing.style.animationDuration = '2s';
      }
    });
  }
  
  // Highlight badges hover effects
  const highlightBadges = document.querySelectorAll('.highlight-badge');
  highlightBadges.forEach((badge, index) => {
    badge.addEventListener('mouseenter', function() {
      // Enhance icon rotation
      const icon = this.querySelector('.badge-icon');
      if (icon) {
        icon.style.transform = 'rotate(10deg) scale(1.1)';
        icon.style.transition = 'transform 0.3s ease';
      }
    });
    
    badge.addEventListener('mouseleave', function() {
      const icon = this.querySelector('.badge-icon');
      if (icon) {
        icon.style.transform = 'rotate(0deg) scale(1)';
      }
    });
  });
}

// ===== FLOATING CTA PANEL INTERACTIONS =====
function initFloatingCTA() {
  const ctaPanel = document.getElementById('floating-cta');
  const ctaToggle = document.getElementById('cta-toggle');
  const ctaOptions = document.getElementById('cta-options');
  
  if (!ctaPanel || !ctaToggle) return;
  
  let isExpanded = false;
  
  // Toggle CTA panel
  ctaToggle.addEventListener('click', function() {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      ctaPanel.classList.add('expanded');
    } else {
      ctaPanel.classList.remove('expanded');
    }
  });
  
  // Close panel when clicking outside
  document.addEventListener('click', function(e) {
    if (!ctaPanel.contains(e.target) && isExpanded) {
      isExpanded = false;
      ctaPanel.classList.remove('expanded');
    }
  });
  
  // Keep panel always visible on larger screens, only hide near footer on small screens
  window.addEventListener('scroll', throttle(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      const footerTop = footer.getBoundingClientRect().top + window.pageYOffset;
      const currentScrollY = window.scrollY;
      const isSmallScreen = window.innerWidth <= 768;
      
      // Only hide when very close to footer on small screens
      if (isSmallScreen && currentScrollY + window.innerHeight > footerTop - 50) {
        ctaPanel.style.transform = 'translateY(-50%) translateX(100px)';
        ctaPanel.style.opacity = '0';
      } else {
        ctaPanel.style.transform = 'translateY(-50%) translateX(0)';
        ctaPanel.style.opacity = '1';
      }
    }
  }, 100));
  
  // Track CTA interactions
  const ctaButtons = document.querySelectorAll('.cta-option');
  ctaButtons.forEach(button => {
    button.addEventListener('click', function() {
      const contactType = this.dataset.contact;
      console.log(`CTA clicked: ${contactType}`);
      
      // Close panel after click
      setTimeout(() => {
        isExpanded = false;
        ctaPanel.classList.remove('expanded');
      }, 300);
    });
  });
}

// ===== INITIALIZE ON DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
  // app loaded
  
  // Initialize all components
  typeWriter();
  initParallax();
  initHeroConsole();
  initSkillCardInteractions();
  initCommunicationHub();
  initExpertisePanels();
  initPersonalSection();
  initFloatingCTA();
  initProjectCategoryFilters();
  
  // Set initial states for animated elements
  const skillCards = document.querySelectorAll('.skill-card');
  const storyBlocks = document.querySelectorAll('.story-block');

  [...skillCards, ...storyBlocks].forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
  });
  
  // Preload critical images
  const criticalImages = [
    'images/Logo blauw 1000x500.webp',
    'images/WieBenIk.webp',
  ];
  
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  // Contactformulier highlight/focus bij klikken op #contact links
  function highlightContactForm() {
    const channel = document.querySelector('.channel-item.email-channel');
    const form = channel ? channel.querySelector('.contact-form') : null;
    const nameField = form ? form.querySelector('input[name="name"]') : null;
    if (channel) {
      channel.classList.add('form-highlight');
      setTimeout(() => channel.classList.remove('form-highlight'), 1000);
    }
    if (nameField) {
      nameField.focus();
    }
  }

  function isContactLink(el) {
    if (!el) return false;
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      return href === '#contact' || href === '/index.html#contact';
    }
    return false;
  }

  document.body.addEventListener('click', function(e) {
    let el = e.target;
    // Zoek naar de dichtstbijzijnde <a>
    while (el && el !== document.body && el.tagName !== 'A') {
      el = el.parentElement;
    }
    if (isContactLink(el)) {
      setTimeout(highlightContactForm, 400); // na scrollen
    }
  }, true);
});

// ===== PROJECT CATEGORY FILTERS =====
function initProjectCategoryFilters() {
  const filterGroup = document.querySelector('.project-filters');
  if (!filterGroup) return;

  const buttons = filterGroup.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.projects-grid .project-card-full');

  function setActiveButton(activeButton) {
    buttons.forEach(btn => {
      const isActive = btn === activeButton;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function applyFilter(filterValue) {
    const normalized = (filterValue || 'all').toLowerCase();
    projectCards.forEach(card => {
      const categories = (card.dataset.categories || '').toLowerCase();
      const matches = normalized === 'all' || categories.includes(normalized);
      card.style.display = matches ? '' : 'none';
    });
  }

  buttons.forEach(btn => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      setActiveButton(btn);
      applyFilter(btn.dataset.filter);
    });
  });

  // Initial state
  const initiallyActive = Array.from(buttons).find(b => b.getAttribute('aria-pressed') === 'true') || buttons[0];
  if (initiallyActive) {
    setActiveButton(initiallyActive);
    applyFilter(initiallyActive.dataset.filter);
  } else {
    applyFilter('all');
  }
}

// ===== PROJECT CAROUSEL AUTO-SCROLL + BUTTONS =====
document.addEventListener('DOMContentLoaded', function() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  const cards = Array.from(track.children);
  const cardCount = cards.length;
  let visibleCards = 3;
  let currentIndex = 0;
  let cardWidth = cards[0].offsetWidth;
  let autoScrollInterval;

  function updateVisibleCards() {
    if (window.innerWidth <= 600) visibleCards = 1;
    else if (window.innerWidth <= 1024) visibleCards = 2;
    else visibleCards = 3;
    cardWidth = cards[0].offsetWidth;
  }

  // Zet transition direct op de track
  track.style.transition = 'transform 0.4s cubic-bezier(0.4,0.2,0.2,1)';

  function moveTo(index) {
    // Disable pointer events during transition
    track.style.pointerEvents = 'none';
    requestAnimationFrame(() => {
      track.style.transform = `translateX(-${index * cardWidth}px)`;
      setTimeout(() => {
        track.style.pointerEvents = '';
      }, 400);
    });
  }

  // Infinite loop: clone first N cards to the end
  function setupInfinite() {
    // Remove old clones if any
    const clones = track.querySelectorAll('.carousel-clone');
    clones.forEach(clone => clone.remove());
    // Clone first visibleCards cards
    for (let i = 0; i < visibleCards; i++) {
      const clone = cards[i].cloneNode(true);
      clone.classList.add('carousel-clone');
      track.appendChild(clone);
    }
  }

  function nextSlide() {
    currentIndex++;
    moveTo(currentIndex);
    if (currentIndex === cardCount) {
      setTimeout(() => {
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        currentIndex = 0;
        // Herstel transition na reset
        setTimeout(() => {
          track.style.transition = 'transform 0.4s cubic-bezier(0.4,0.2,0.2,1)';
        }, 20);
      }, 400);
    }
  }

  function prevSlide() {
    if (currentIndex === 0) {
      track.style.transition = 'none';
      track.style.transform = `translateX(-${cardCount * cardWidth}px)`;
      currentIndex = cardCount - 1;
      setTimeout(() => {
        track.style.transition = 'transform 0.4s cubic-bezier(0.4,0.2,0.2,1)';
        moveTo(currentIndex);
      }, 20);
    } else {
      currentIndex--;
      moveTo(currentIndex);
    }
  }

  function onResize() {
    updateVisibleCards();
    setupInfinite();
    moveTo(currentIndex);
  }

  function startAutoScroll() {
    if (autoScrollInterval) clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(nextSlide, 3000);
  }

  updateVisibleCards();
  setupInfinite();
  moveTo(0);
  window.addEventListener('resize', onResize);
  startAutoScroll();

  // Button controls
  const btnLeft = document.querySelector('.carousel-btn.left');
  const btnRight = document.querySelector('.carousel-btn.right');
  if (btnLeft && btnRight) {
    btnLeft.addEventListener('click', function() {
      prevSlide();
      startAutoScroll();
      btnLeft.blur(); // Verwijder focus na klik
    });
    btnRight.addEventListener('click', function() {
      nextSlide();
      startAutoScroll();
      btnRight.blur(); // Verwijder focus na klik
    });
  }
});

// ===== DYNAMIC STYLES FOR INTERACTIONS =====
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .skill-card,
  .project-card,
  .story-block {
    transition: all 0.3s ease;
  }
  
  .btn:active {
    transform: translateY(1px);
  }
  
  .contact-icon {
    transition: all 0.3s ease;
  }
  
  .project-image img {
    transition: transform 0.3s ease;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .skill-card,
    .project-card,
    .story-block,
    .contact-icon,
    .project-image img {
      transition: none !important;
      animation: none !important;
    }
  }
`;

document.head.appendChild(dynamicStyles);

// ===== ACCESSIBILITY ENHANCEMENTS =====
// Respect reduced motion preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
  // Disable animations for users who prefer reduced motion
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head.appendChild(style);
}

// ===== KEYBOARD NAVIGATION ENHANCEMENT =====
document.addEventListener('keydown', function(e) {
  // Add visual focus indicators for keyboard navigation
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-navigation');
  }
});

document.addEventListener('mousedown', function() {
  document.body.classList.remove('keyboard-navigation');
});

// Add keyboard navigation styles
const keyboardStyles = document.createElement('style');
keyboardStyles.textContent = `
  .keyboard-navigation *:focus {
    outline: 2px solid var(--primary) !important;
    outline-offset: 2px !important;
  }
`;
document.head.appendChild(keyboardStyles);

let googleReviewClicked = false;

function markGoogleReviewClicked() {
  googleReviewClicked = true;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('reviewForm');
  const modal = document.getElementById('googleReminder');
  const btnGoogle = document.getElementById('btnGoogle');
  const btnSkip = document.getElementById('btnSkip');
  const result = document.getElementById('result');
  const stars = document.querySelectorAll('.rating-stars .star');
  const ratingInput = document.getElementById('ratingValue');
  let selectedRating = 0;

  stars.forEach((star, index) => {
    star.addEventListener('mouseover', () => {
      resetStars();
      const hoveredRating = index + 1;

      stars.forEach((s, i) => {
        if (i < hoveredRating) {
          s.classList.add('hovered');
        } else {
          s.classList.remove('hovered');
          s.classList.remove('removing');
        }

        // als je teruggaat van hoger naar lager
        if (selectedRating > 0 && hoveredRating < selectedRating && i >= hoveredRating && i < selectedRating) {
          s.classList.add('removing');
        }
      });
    });

    star.addEventListener('mouseout', () => {
      resetStars();
    });

    star.addEventListener('click', () => {
      selectedRating = index + 1;
      ratingInput.value = selectedRating;

      stars.forEach((s, i) => {
        s.classList.remove('selected', 'removing');
        if (i < selectedRating) {
          s.classList.add('selected');
        }
      });
    });
  });

  function resetStars() {
    stars.forEach(s => s.classList.remove('hovered', 'removing'));
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      if (!googleReviewClicked && !form.dataset.confirmed) {
        e.preventDefault();
        modal.classList.remove("hidden");
      } else if (!form.dataset.submitted) {
        e.preventDefault();
        sendReview();
      }
    });

    function sendReview() {
      const formData = new FormData(form);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      result.innerHTML = "Even geduld...";
      result.style.display = "block";

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      })
        .then(async (response) => {
          let json = await response.json();
          if (response.status == 200) {
            result.innerHTML = "Review succesvol verzonden!";
          } else {
            result.innerHTML = json.message;
          }
        })
        .catch(() => {
          result.innerHTML = "Er ging iets mis!";
        })
        .then(() => {
          form.dataset.submitted = true;
          form.reset();
          stars.forEach(s => s.classList.remove('selected'));
          setTimeout(() => result.style.display = "none", 3000);
        });
    }

    btnGoogle.addEventListener("click", () => {
      window.open("https://g.page/r/CV9KoNq0t1d-EAE/review", "_blank");
      googleReviewClicked = true;
      modal.classList.add("hidden");
    });

    btnSkip.addEventListener("click", () => {
      modal.classList.add("hidden");
      form.dataset.confirmed = true;
      form.requestSubmit();
    });
  }
});
