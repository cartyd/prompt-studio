/**
 * Carousel - Auto-rotating image carousel
 * Extracted from home.ejs for better maintainability and testability
 */

(function() {
  'use strict';

  // Configuration
  const CAROUSEL_INTERVAL_MS = 3000;

  function initCarousel() {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel) return;
    
    let imgs = Array.from(carousel.children);
    let intervalId = null;
    
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }
    
    function rotateCarousel() {
      imgs.push(imgs.shift());
      imgs.forEach(img => img.classList.remove('center', 'side'));
      imgs[1].classList.add('center');
      imgs[0].classList.add('side');
      imgs[2].classList.add('side');
      for (let i = 3; i < imgs.length; i++) {
        imgs[i].classList.add('side');
        imgs[i].style.opacity = '0';
      }
      imgs.forEach(img => carousel.appendChild(img));
    }
    
    function startCarousel() {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(rotateCarousel, CAROUSEL_INTERVAL_MS);
    }
    
    // Pause on hover
    carousel.addEventListener('mouseenter', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    });
    
    // Resume on mouse leave
    carousel.addEventListener('mouseleave', () => {
      startCarousel();
    });
    
    // Start auto-rotation
    startCarousel();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
  } else {
    initCarousel();
  }
})();
