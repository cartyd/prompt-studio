/**
 * Framework Form - Complex form handling for prompt frameworks
 * Extracted from frameworks/form.ejs for better maintainability and testability
 * 
 * This module handles:
 * - Example toggling and loading
 * - Multi-select criteria functionality
 * - Advanced options toggle
 * - Modal functionality
 * - Template selection
 */

// ==========  EXAMPLES MODULE  ==========
window.FrameworkExamples = (function() {
  'use strict';

  let isExamplesExpanded = false;
  let examples = {};
  let currentCategory = 'general';

  function init(examplesData) {
    examples = examplesData || {};
    setupToggle();
    setupCategoryButtons();
    setupLoadButton();
  }

  function setupToggle() {
    const toggleBtn = document.getElementById('toggle-examples-btn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function() {
      const container = document.getElementById('examples-container');
      const icon = document.getElementById('toggle-icon');
      const hint = document.getElementById('toggle-hint');
      
      isExamplesExpanded = !isExamplesExpanded;
      
      if (isExamplesExpanded) {
        container.classList.add('show');
        icon.classList.add('expanded');
        hint.textContent = 'Click to collapse';
      } else {
        container.classList.remove('show');
        icon.classList.remove('expanded');
        hint.textContent = 'Click to expand';
      }
    });
  }

  function setupCategoryButtons() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const category = this.dataset.category;
        if (category === currentCategory) return;
        
        currentCategory = category;
        
        // Update button styles
        categoryBtns.forEach(b => {
          if (b.dataset.category === category) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
        
        // Update example content
        const exampleFields = document.querySelectorAll('.example-field');
        exampleFields.forEach(fieldDiv => {
          const fieldName = fieldDiv.dataset.field;
          const valueSpan = fieldDiv.querySelector('.example-value');
          const exampleValue = examples[category][fieldName];
          if (exampleValue) {
            const displayValue = Array.isArray(exampleValue)
              ? exampleValue.map((c, i) => `(${i + 1}) ${c}`).join(', ')
              : exampleValue;
            const formattedValue = typeof displayValue === 'string' ? displayValue.replace(/\n/g, '<br>') : displayValue;
            valueSpan.innerHTML = formattedValue;
          }
        });
      });
    });
  }

  function setupLoadButton() {
    const loadBtn = document.getElementById('load-example-btn');
    if (!loadBtn) return;

    loadBtn.addEventListener('click', function() {
      // Reset form to initial state first
      const form = document.querySelector('form');
      if (form) {
        // Clear all text inputs and textareas
        form.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(field => {
          if (field.type === 'number' && (field.name === 'approaches' || field.name === 'versions')) {
            field.value = '3'; // Reset to default
          } else {
            field.value = '';
          }
        });
        
        // Clear criteria checkboxes
        const criteriaField = document.getElementById('criteria');
        if (criteriaField) {
          const event = new CustomEvent('resetCriteria');
          criteriaField.dispatchEvent(event);
        }
        
        // Clear preview
        const preview = document.getElementById('prompt-preview');
        if (preview) {
          preview.innerHTML = '<p style="color: #7f8c8d;">Fill out the form and click "Generate Preview" to see your prompt.</p>';
        }
      }
      
      // Load the example from current category (keep selected tab)
      const example = examples[currentCategory];
      Object.keys(example).forEach(key => {
        const field = document.getElementById(key);
        if (field) {
          if (Array.isArray(example[key])) {
            // For criteria arrays, trigger custom event
            field.value = JSON.stringify(example[key]);
            const event = new CustomEvent('loadExampleCriteria', { detail: example[key] });
            field.dispatchEvent(event);
          } else {
            field.value = example[key];
          }
        }
      });
    });
  }

  return { init };
})();

// ==========  MULTI-SELECT CRITERIA MODULE  ==========
window.FrameworkCriteria = (function() {
  'use strict';

  let isPremium = false;
  let defaultCriteria = [];
  let savedCustomCriteria = [];
  let allCriteria = [];
  let selectedCriteria = [];
  let criteriaField = null;

  function init(config) {
    criteriaField = document.getElementById('criteria');
    if (!criteriaField) return;

    isPremium = config.isPremium || false;
    defaultCriteria = config.defaultCriteria || [];
    savedCustomCriteria = config.savedCustomCriteria || [];
    allCriteria = [...defaultCriteria];

    loadCustomCriteria();
    setupEventHandlers();
    initializeDefaults(config.defaultValues);
    renderCheckboxes();
    updateHiddenInput();
  }

  function loadCustomCriteria() {
    if (isPremium) {
      // Premium users: load from database
      allCriteria = [...allCriteria, ...savedCustomCriteria];
    } else {
      // Free users: load from localStorage (session only)
      const localCustom = localStorage.getItem('customCriteria_tot');
      if (localCustom) {
        try {
          const parsed = JSON.parse(localCustom);
          allCriteria = [...allCriteria, ...parsed];
        } catch (e) {}
      }
    }
  }

  function renderCheckboxes() {
    const criteriaCheckboxesContainer = document.getElementById('criteria-checkboxes');
    if (!criteriaCheckboxesContainer) return;

    criteriaCheckboxesContainer.innerHTML = '';
    
    allCriteria.forEach((criteria, index) => {
      const isCustom = index >= defaultCriteria.length;
      const isChecked = selectedCriteria.includes(criteria);
      
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: flex; align-items: start; gap: 0.5rem; padding: 0.25rem 0.5rem; border-radius: 4px; transition: background 0.2s;';
      wrapper.onmouseenter = () => wrapper.style.background = '#f8f9fa';
      wrapper.onmouseleave = () => wrapper.style.background = 'transparent';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `criteria-${index}`;
      checkbox.checked = isChecked;
      checkbox.style.cssText = 'cursor: pointer; margin: 0.2rem 0 0 0; flex-shrink: 0; width: auto !important; padding: 0 !important; border: none !important;';
      
      const label = document.createElement('label');
      label.htmlFor = `criteria-${index}`;
      label.style.cssText = 'flex: 1; cursor: pointer; font-size: 1rem; margin: 0 !important; line-height: 1.4; display: inline !important; font-weight: normal !important; font-family: inherit;';
      label.textContent = criteria;
      
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          if (selectedCriteria.length >= 4) {
            this.checked = false;
            alert('Maximum 4 criteria can be selected');
            return;
          }
          selectedCriteria.push(criteria);
        } else {
          selectedCriteria = selectedCriteria.filter(c => c !== criteria);
        }
        updateHiddenInput();
      });
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      
      if (isCustom) {
        const indicator = document.createElement('span');
        indicator.style.cssText = 'font-size: 0.75rem; color: #7f8c8d; padding: 0.15rem 0.4rem; background: #f8f9fa; border-radius: 3px;';
        indicator.textContent = isPremium ? '💾' : '⏱️';
        indicator.title = isPremium ? 'Saved custom criteria' : 'Session only';
        wrapper.appendChild(indicator);
        
        if (isPremium) {
          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.textContent = '×';
          deleteBtn.style.cssText = 'background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem; padding: 0 0.25rem;';
          deleteBtn.title = 'Delete this criteria';
          deleteBtn.addEventListener('click', () => deleteCustomCriteria(criteria));
          wrapper.appendChild(deleteBtn);
        }
      }
      
      criteriaCheckboxesContainer.appendChild(wrapper);
    });
  }

  function updateHiddenInput() {
    const criteriaCount = document.getElementById('criteria-count');
    criteriaField.value = JSON.stringify(selectedCriteria);
    if (criteriaCount) {
      criteriaCount.textContent = selectedCriteria.length;
    }
  }

  function addCustomCriteria(criteriaName, shouldSave) {
    if (!criteriaName || criteriaName.trim().length === 0) return;
    
    criteriaName = criteriaName.trim();
    
    if (allCriteria.includes(criteriaName)) {
      alert('This criteria already exists');
      return;
    }
    
    allCriteria.push(criteriaName);
    selectedCriteria.push(criteriaName);
    
    if (isPremium && shouldSave) {
      fetch('/api/custom-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteriaName }),
      }).catch(err => console.error('Failed to save criteria:', err));
    } else if (!isPremium) {
      // Save to localStorage with framework-specific key
      const customOnly = allCriteria.slice(defaultCriteria.length);
      localStorage.setItem('customCriteria_tot', JSON.stringify(customOnly));
    }
    
    renderCheckboxes();
    updateHiddenInput();
    
    const customCriteriaInput = document.getElementById('custom-criteria-input');
    const customInputContainer = document.getElementById('custom-input-container');
    if (customCriteriaInput) customCriteriaInput.value = '';
    if (customInputContainer) customInputContainer.style.display = 'none';
  }

  function deleteCustomCriteria(criteriaName) {
    if (!confirm(`Delete "${criteriaName}"?`)) return;
    
    allCriteria = allCriteria.filter(c => c !== criteriaName);
    selectedCriteria = selectedCriteria.filter(c => c !== criteriaName);
    
    fetch(`/api/custom-criteria/${encodeURIComponent(criteriaName)}`, {
      method: 'DELETE',
    }).catch(err => console.error('Failed to delete criteria:', err));
    
    renderCheckboxes();
    updateHiddenInput();
  }

  function setupEventHandlers() {
    const addCustomBtn = document.getElementById('add-custom-btn');
    const cancelCustomBtn = document.getElementById('cancel-custom-btn');
    const addCustomSubmitBtn = document.getElementById('add-custom-submit-btn');
    const customCriteriaInput = document.getElementById('custom-criteria-input');
    const customInputContainer = document.getElementById('custom-input-container');
    const saveCustomCheckbox = document.getElementById('save-custom-checkbox');

    if (addCustomBtn) {
      addCustomBtn.addEventListener('click', () => {
        if (customInputContainer) customInputContainer.style.display = 'block';
        if (customCriteriaInput) customCriteriaInput.focus();
      });
    }
    
    if (cancelCustomBtn) {
      cancelCustomBtn.addEventListener('click', () => {
        if (customInputContainer) customInputContainer.style.display = 'none';
        if (customCriteriaInput) customCriteriaInput.value = '';
      });
    }
    
    if (addCustomSubmitBtn) {
      addCustomSubmitBtn.addEventListener('click', () => {
        const shouldSave = isPremium && saveCustomCheckbox && saveCustomCheckbox.checked;
        if (customCriteriaInput) {
          addCustomCriteria(customCriteriaInput.value, shouldSave);
        }
      });
    }
    
    if (customCriteriaInput) {
      customCriteriaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const shouldSave = isPremium && saveCustomCheckbox && saveCustomCheckbox.checked;
          addCustomCriteria(customCriteriaInput.value, shouldSave);
        }
      });
    }

    // Listen for example loading
    criteriaField.addEventListener('loadExampleCriteria', (e) => {
      selectedCriteria = [...e.detail];
      renderCheckboxes();
      updateHiddenInput();
    });

    // Listen for reset criteria event
    criteriaField.addEventListener('resetCriteria', () => {
      selectedCriteria = [];
      renderCheckboxes();
      updateHiddenInput();
    });

    // Listen for clear criteria event
    criteriaField.addEventListener('clearCriteria', function() {
      const event = new CustomEvent('resetCriteria');
      this.dispatchEvent(event);
    });
  }

  function initializeDefaults(defaultValues) {
    if (Array.isArray(defaultValues) && defaultValues.length > 0) {
      selectedCriteria = [...defaultValues];
    }
  }

  return { init };
})();

// ==========  ADVANCED OPTIONS MODULE  ==========
window.FrameworkAdvancedOptions = (function() {
  'use strict';

  function init() {
    const toggleAdvancedBtn = document.getElementById('toggle-advanced-btn');
    if (!toggleAdvancedBtn) return;

    toggleAdvancedBtn.addEventListener('click', function() {
      const advancedOptions = document.getElementById('advanced-options');
      const advancedIcon = document.getElementById('advanced-icon');
      
      if (!advancedOptions || !advancedIcon) return;

      if (advancedOptions.style.display === 'none' || advancedOptions.style.display === '') {
        advancedOptions.style.display = 'block';
        advancedIcon.style.transform = 'rotate(90deg)';
        advancedIcon.textContent = '▼';
      } else {
        advancedOptions.style.display = 'none';
        advancedIcon.style.transform = 'rotate(0deg)';
        advancedIcon.textContent = '▶';
      }
    });
  }

  return { init };
})();

// ==========  MODAL MODULE  ==========
window.FrameworkModal = (function() {
  'use strict';

  let confirmCallback = null;

  function init() {
    const modal = document.getElementById('unified-modal');
    const modalConfirm = document.getElementById('unified-modal-confirm');
    const modalCancel = document.getElementById('unified-modal-cancel');
    const modalClose = document.getElementById('unified-modal-close');

    if (!modal) return;

    if (modalConfirm) {
      modalConfirm.addEventListener('click', function() {
        if (confirmCallback) confirmCallback();
        hideModal();
      });
    }
    
    if (modalCancel) modalCancel.addEventListener('click', hideModal);
    if (modalClose) modalClose.addEventListener('click', hideModal);
    
    // Close modal on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) hideModal();
    });

    setupClearFormButton();
  }

  function showModal(message, onConfirm, options = {}) {
    const modal = document.getElementById('unified-modal');
    const modalTitle = document.getElementById('unified-modal-title');
    const modalMessage = document.getElementById('unified-modal-message');
    const modalWarning = document.getElementById('unified-modal-warning');
    const modalIcon = document.getElementById('unified-modal-icon');
    const modalConfirm = document.getElementById('unified-modal-confirm');
    
    // Set title
    if (modalTitle) modalTitle.textContent = options.title || 'Confirm Action';
    
    // Set message
    if (modalMessage) modalMessage.textContent = message;
    
    // Set warning (optional)
    if (modalWarning) {
      modalWarning.textContent = options.warning || '';
      modalWarning.style.display = options.warning ? 'block' : 'none';
    }
    
    // Set icon
    if (modalIcon) {
      if (options.icon) {
        modalIcon.className = 'bx ' + options.icon;
        modalIcon.style.color = options.iconColor || '#f39c12';
      } else {
        // Default icon
        modalIcon.className = 'bx bx-error-circle';
        modalIcon.style.color = '#f39c12';
      }
    }
    
    // Set confirm button text
    if (modalConfirm) modalConfirm.textContent = options.confirmText || 'OK';
    
    if (modal) modal.style.display = 'flex';
    confirmCallback = onConfirm;
  }

  function hideModal() {
    const modal = document.getElementById('unified-modal');
    if (modal) modal.style.display = 'none';
    confirmCallback = null;
  }

  function setupClearFormButton() {
    const clearFormBtn = document.getElementById('clear-form-btn');
    if (!clearFormBtn) return;

    clearFormBtn.addEventListener('click', function() {
      showModal('Clear all form fields?', function() {
        // Clear all text inputs and textareas
        const form = clearFormBtn.closest('form');
        if (!form) return;

        form.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(field => {
          if (field.type === 'number' && (field.name === 'approaches' || field.name === 'versions')) {
            field.value = '3'; // Reset to default
          } else {
            field.value = '';
          }
        });
        
        // Clear multi-select criteria checkboxes
        const criteriaField = document.getElementById('criteria');
        if (criteriaField) {
          const checkboxes = document.querySelectorAll('#criteria-checkboxes input[type="checkbox"]');
          checkboxes.forEach(cb => cb.checked = false);
          
          // Update the selectedCriteria array and hidden input
          const event = new CustomEvent('clearCriteria');
          criteriaField.dispatchEvent(event);
        }
        
        // Clear preview
        const preview = document.getElementById('prompt-preview');
        if (preview) {
          preview.innerHTML = '<p style="color: #7f8c8d;">Fill out the form and click "Generate Preview" to see your prompt.</p>';
        }
      }, {
        title: 'Clear Form',
        icon: 'bx-error-circle',
        iconColor: '#f39c12',
        confirmText: 'Clear',
        warning: 'All unsaved changes will be lost.'
      });
    });
  }

  return { init, showModal, hideModal };
})();

// ==========  TEMPLATE SELECTION MODULE  ==========
window.FrameworkTemplates = (function() {
  'use strict';

  let templates = [];
  let selectedTemplateId = null;

  function init(templatesData) {
    templates = templatesData || [];
    if (templates.length === 0) return;

    setupTemplateCards();
    addAnimations();
  }

  function setupTemplateCards() {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
      card.addEventListener('click', function() {
        const templateId = this.dataset.templateId;
        const template = templates.find(t => t.id === templateId);
        
        if (!template) return;
        
        // Toggle selection visually
        if (selectedTemplateId === templateId) {
          // Deselect
          this.classList.remove('selected');
          selectedTemplateId = null;
          clearForm();
        } else {
          // Deselect previous and select new
          templateCards.forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');
          selectedTemplateId = templateId;
          
          // Populate form with template fields
          populateFormFromTemplate(template);
        }
      });
    });
  }

  function clearForm() {
    const form = document.querySelector('form');
    if (!form) return;
    
    // Clear all text inputs and textareas
    form.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(field => {
      if (field.type === 'number' && (field.name === 'approaches' || field.name === 'versions')) {
        field.value = '3'; // Reset to default
      } else {
        field.value = '';
      }
    });
    
    // Clear criteria checkboxes
    const criteriaField = document.getElementById('criteria');
    if (criteriaField) {
      const event = new CustomEvent('resetCriteria');
      criteriaField.dispatchEvent(event);
    }
    
    // Clear preview
    const preview = document.getElementById('prompt-preview');
    if (preview) {
      preview.innerHTML = '<p style="color: #7f8c8d;">Fill out the form and click "Generate Preview" to see your prompt.</p>';
    }
  }

  function populateFormFromTemplate(template) {
    // First clear the form
    clearForm();
    
    // Populate each field from template
    Object.keys(template.fields).forEach(fieldName => {
      const fieldValue = template.fields[fieldName];
      const field = document.getElementById(fieldName);
      
      if (!field) return;
      
      if (Array.isArray(fieldValue)) {
        // For criteria arrays
        field.value = JSON.stringify(fieldValue);
        const event = new CustomEvent('loadExampleCriteria', { detail: fieldValue });
        field.dispatchEvent(event);
      } else {
        // For regular fields
        field.value = fieldValue;
      }
    });
    
    // Show a brief notification
    showTemplateNotification(template.name);
  }

  function showTemplateNotification(templateName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3498db;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `<strong>🎉 Template Applied:</strong> ${templateName}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return { init };
})();
