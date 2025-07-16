// ===== PROFESSIONAL INTERACTIONS & ANIMATIONS =====

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

// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById('header');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  const isMobile = window.innerWidth <= 768;
  const scrollBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;

  if (isMobile) {
    // Op mobiel: header alleen verbergen als je onderaan bent
    if (scrollBottom) {
      header.style.transform = 'translateY(-40px)';
    } else {
      header.style.transform = 'translateY(0)';
    }
  } else {
    header.style.transform = 'translateY(0)';
    if (currentScrollY > 100) {
      header.style.background = 'linear-gradient(135deg, rgba(30, 64, 175, 0.98) 0%, rgba(30, 58, 138, 0.98) 100%)';
      header.style.boxShadow = '0 4px 20px rgba(30, 64, 175, 0.3)';
    } else {
      header.style.background = 'linear-gradient(135deg, rgba(30, 64, 175, 0.95) 0%, rgba(30, 58, 138, 0.95) 100%)';
      header.style.boxShadow = 'none';
    }
  }

  lastScrollY = currentScrollY;
});

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

    // Only keep overlay hover/click effect
    panel.addEventListener('mouseenter', function() {
      const overlay = this.querySelector('.panel-overlay');
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
    });
    panel.addEventListener('mouseleave', function() {
      const overlay = this.querySelector('.panel-overlay');
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
    });
    // Click interaction for mobile
    panel.addEventListener('click', function(e) {
      if (window.innerWidth <= 768 || e.target === this || e.target.closest('.panel-content')) {
        const overlay = this.querySelector('.panel-overlay');
        const isVisible = overlay.style.opacity === '1';
        // Close other overlays
        expertisePanels.forEach(otherPanel => {
          if (otherPanel !== this) {
            const otherOverlay = otherPanel.querySelector('.panel-overlay');
            otherOverlay.style.opacity = '0';
            otherOverlay.style.visibility = 'hidden';
          }
        });
        // Toggle this overlay
        if (window.innerWidth <= 768) {
          overlay.style.opacity = isVisible ? '0' : '1';
          overlay.style.visibility = isVisible ? 'hidden' : 'visible';
        }
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
      });
    }
  });
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
  
  // Keep panel always visible, only hide near footer
  window.addEventListener('scroll', throttle(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      const footerTop = footer.getBoundingClientRect().top + window.pageYOffset;
      const currentScrollY = window.scrollY;
      
      // Only hide when very close to footer (within 50px)
      if (currentScrollY + window.innerHeight > footerTop - 50) {
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
  console.log('IMeTech Engineering - Professional website loaded');
  
  // Initialize all components
  typeWriter();
  initParallax();
  initHeroConsole();
  initSkillCardInteractions();
  initCommunicationHub();
  initExpertisePanels();
  initPersonalSection();
  initFloatingCTA();
  
  // Set initial states for animated elements
  const skillCards = document.querySelectorAll('.skill-card');
  const storyBlocks = document.querySelectorAll('.story-block');

  [...skillCards, ...storyBlocks].forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
  });
  
  // Preload critical images
  const criticalImages = [
    'images/Logo blauw 1000x500.png',
    'images/fertigationFront.png',
    'images/WieBenIk.png',
    'images/fertigationBack.png'
  ];
  
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
});

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