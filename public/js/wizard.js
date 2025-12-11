/**
 * Wizard JavaScript Module
 * Handles wizard form interactions, navigation, and state management
 */

window.WizardForm = (function() {
  'use strict';

  let config = {};

  function init(options) {
    config = options || {};
    setupFormHandling();
    setupOptionCards();
    setupKeyboardNavigation();
  }

  function setupFormHandling() {
    const form = document.getElementById('wizard-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
        questionId: formData.get('questionId'),
        selectedOptionIds: formData.getAll('selectedOptionIds')
      };

      // Validate selection
      if (!data.selectedOptionIds || data.selectedOptionIds.length === 0) {
        showError('Please select an option before continuing');
        return;
      }

      // Disable submit button to prevent double submission
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Loading...';
      }

      try {
        const response = await fetch('/wizard/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.redirect) {
          // Smooth transition to next page
          window.location.href = result.redirect;
        } else {
          showError(result.error || 'An error occurred. Please try again.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = config.currentStep + 1 === config.totalSteps 
              ? 'See Recommendation <i class="bx bx-chevron-right"></i>' 
              : 'Next <i class="bx bx-chevron-right"></i>';
          }
        }
      } catch (error) {
        console.error('Wizard submission error:', error);
        showError('Network error. Please check your connection and try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = config.currentStep + 1 === config.totalSteps 
            ? 'See Recommendation <i class="bx bx-chevron-right"></i>' 
            : 'Next <i class="bx bx-chevron-right"></i>';
        }
      }
    });
  }

  function setupOptionCards() {
    const optionCards = document.querySelectorAll('.wizard-option-card');
    
    optionCards.forEach(card => {
      card.addEventListener('click', function() {
        const input = this.querySelector('input[type="radio"], input[type="checkbox"]');
        if (!input) return;

        if (input.type === 'radio') {
          // Single choice: remove all selected states and add to clicked
          optionCards.forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');
          input.checked = true;
        } else {
          // Multiple choice: toggle selected state
          this.classList.toggle('selected');
          input.checked = !input.checked;
        }
      });

      // Prevent double-toggling when clicking the input directly
      const input = card.querySelector('input[type="radio"], input[type="checkbox"]');
      if (input) {
        input.addEventListener('click', function(e) {
          e.stopPropagation();
        });

        input.addEventListener('change', function() {
          if (this.checked) {
            card.classList.add('selected');
          } else {
            card.classList.remove('selected');
          }
        });
      }
    });
  }

  function setupKeyboardNavigation() {
    const optionCards = document.querySelectorAll('.wizard-option-card');
    
    optionCards.forEach((card, index) => {
      card.setAttribute('tabindex', '0');
      
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }

        // Arrow key navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const nextCard = optionCards[index + 1];
          if (nextCard) nextCard.focus();
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevCard = optionCards[index - 1];
          if (prevCard) prevCard.focus();
        }
      });
    });
  }

  function showError(message) {
    // Check if error div already exists
    let errorDiv = document.querySelector('.wizard-error');
    
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'wizard-error';
      const form = document.getElementById('wizard-form');
      if (form) {
        form.insertBefore(errorDiv, form.firstChild);
      }
    }

    errorDiv.innerHTML = `
      <i class='bx bx-error-circle'></i>
      <span>${message}</span>
    `;
    errorDiv.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);

    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return { init };
})();

// Auto-initialize if on wizard pages
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scroll behavior for all wizard links
  const wizardLinks = document.querySelectorAll('a[href^="/wizard"]');
  wizardLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Add loading state if desired
      const icon = this.querySelector('i');
      if (icon && !icon.classList.contains('bx-loader-alt')) {
        icon.className = 'bx bx-loader-alt bx-spin';
      }
    });
  });

  // Add animation classes to elements as they appear
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe wizard content elements
  const animateElements = document.querySelectorAll(
    '.wizard-step-item, .wizard-option-card, .recommendation-explanation, .recommendation-why'
  );
  animateElements.forEach(el => observer.observe(el));
});
