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
    console.log('[FrameworkExamples] Initializing with examples:', examplesData);
    examples = examplesData || {};
    setupToggle();
    setupCategoryButtons();
    setupLoadButton();
  }

  function getExamples() {
    return examples || {};
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
      // Smart apply: load example from current category with conflict checks
      const example = examples[currentCategory] || {};
      console.log('[FrameworkExamples] Loading example:', currentCategory, example);
      if (window.FormPopulation) {
        window.FormPopulation.applyFromSource(example, 'example');
      } else {
        console.error('[FrameworkExamples] FormPopulation not available');
      }
    });
  }

  return { init, getExamples };
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

  let primaryCallback = null;
  let secondaryCallback = null;

  function init() {
    const modal = document.getElementById('unified-modal');
    const modalPrimary = document.getElementById('unified-modal-primary');
    const modalSecondary = document.getElementById('unified-modal-secondary');
    const modalCancel = document.getElementById('unified-modal-cancel');
    const modalClose = document.getElementById('unified-modal-close');

    if (!modal) return;

    if (modalPrimary) {
      modalPrimary.addEventListener('click', function() {
        if (primaryCallback) primaryCallback();
        hideModal();
      });
    }
    if (modalSecondary) {
      modalSecondary.addEventListener('click', function() {
        if (secondaryCallback) secondaryCallback();
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

  /**
   * Flexible modal
   * - If only primary provided: two-button modal (primary + cancel)
   * - If primary and secondary provided: three-button modal
   */
  function showModal(message, onPrimary, options = {}) {
    const modal = document.getElementById('unified-modal');
    const modalTitle = document.getElementById('unified-modal-title');
    const modalMessage = document.getElementById('unified-modal-message');
    const modalWarning = document.getElementById('unified-modal-warning');
    const modalIcon = document.getElementById('unified-modal-icon');
    const modalPrimary = document.getElementById('unified-modal-primary');
    const modalSecondary = document.getElementById('unified-modal-secondary');
    
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
    if (modalPrimary) modalPrimary.textContent = options.primaryText || options.confirmText || 'OK';
    if (modalSecondary) {
      if (options.secondaryText && options.onSecondary) {
        modalSecondary.style.display = '';
        modalSecondary.textContent = options.secondaryText;
      } else {
        modalSecondary.style.display = 'none';
      }
    }
    
    if (modal) modal.style.display = 'flex';
    primaryCallback = onPrimary || null;
    secondaryCallback = options.onSecondary || null;
  }

  function hideModal() {
    const modal = document.getElementById('unified-modal');
    if (modal) modal.style.display = 'none';
    primaryCallback = null;
    secondaryCallback = null;
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
        primaryText: 'Clear',
        warning: 'All unsaved changes will be lost.'
      });
    });
  }

  return { init, showModal, hideModal };
})();

// ==========  FORM POPULATION (SMART APPLY) ==========
window.FormPopulation = (function() {
  'use strict';

  const lastTemplateValues = new Map(); // fieldName -> normalized value
  let programmaticSetDepth = 0;

  function normalize(val) {
    if (val == null) return '';
    if (Array.isArray(val)) return val.map(v => String(v).trim()).join(', ');
    return String(val).replace(/\s+/g, ' ').trim();
  }

  function withProgrammatic(fn) {
    try {
      programmaticSetDepth++;
      return fn();
    } finally {
      programmaticSetDepth--;
    }
  }

  function trackDirty() {
    const form = document.querySelector('form');
    if (!form) return;
    form.querySelectorAll('input[name], textarea[name], select[name]').forEach(el => {
      const markUser = () => {
        if (programmaticSetDepth > 0) return;
        el.dataset.origin = 'user';
      };
      el.addEventListener('input', markUser);
      el.addEventListener('change', markUser);
    });
  }

  function collectBaselines(input) {
    const set = new Set();
    const dataDefault = input.getAttribute('data-default');
    if (dataDefault) set.add(normalize(dataDefault));

    try {
      if (window.FrameworkExamples && typeof window.FrameworkExamples.getExamples === 'function') {
        const ex = window.FrameworkExamples.getExamples();
        const name = input.name || input.id;
        if (ex && ex.general && name in ex.general) set.add(normalize(ex.general[name]));
        if (ex && ex.business && name in ex.business) set.add(normalize(ex.business[name]));
      }
    } catch (_) {}

    const last = lastTemplateValues.get(input.name || input.id);
    if (last) set.add(last);
    return set;
  }

  function setFieldValue(input, rawVal) {
    const val = Array.isArray(rawVal) ? rawVal : String(rawVal ?? '');
    // Multi-select criteria uses hidden input + events
    if ((input.id === 'criteria' || input.name === 'criteria') && Array.isArray(rawVal)) {
      withProgrammatic(() => {
        input.value = JSON.stringify(rawVal);
        const event = new CustomEvent('loadExampleCriteria', { detail: rawVal });
        input.dispatchEvent(event);
      });
      return;
    }
    withProgrammatic(() => {
      input.value = Array.isArray(val) ? val.join(', ') : String(val);
      input.dataset.origin = 'template';
    });
  }

  function applyFromSource(values, source) {
    console.log('[FormPopulation] applyFromSource called with source:', source, 'values:', values);
    const form = document.querySelector('form');
    if (!form) {
      console.error('[FormPopulation] No form found');
      return;
    }
    if (!values) {
      console.error('[FormPopulation] No values provided');
      return;
    }

    const fields = Array.from(form.querySelectorAll('[name]'));
    const conflicts = [];

    for (const input of fields) {
      const name = input.name;
      if (!(name in values)) continue;
      const incoming = normalize(values[name]);
      const current = normalize((input.value ?? ''));
      const baselines = collectBaselines(input);
      const isUserEdited = input.dataset.origin === 'user';

      if (incoming === current) continue;
      const safe = !isUserEdited || current === '' || baselines.has(current);
      if (!safe) conflicts.push({ name, label: input.id || name });
    }

    const fillEmptyOnly = () => {
      for (const input of fields) {
        const name = input.name;
        if (!(name in values)) continue;
        const current = normalize(input.value ?? '');
        const baselines = collectBaselines(input);
        if (current === '' || baselines.has(current)) {
          setFieldValue(input, values[name]);
        }
      }
    };

    const overwriteAll = () => {
      for (const input of fields) {
        const name = input.name;
        if (!(name in values)) continue;
        setFieldValue(input, values[name]);
        lastTemplateValues.set(name, normalize(values[name]));
      }
    };

    if (conflicts.length === 0) {
      overwriteAll();
      return;
    }

    const count = conflicts.length;
    const msg = `${count} field${count>1?'s':''} have edits that differ from the ${source}.`;
    window.FrameworkModal.showModal(msg, fillEmptyOnly, {
      title: 'Apply ' + (source === 'template' ? 'Template' : 'Example'),
      icon: 'bx-help-circle',
      iconColor: '#3498db',
      primaryText: 'Fill Empty Only',
      secondaryText: 'Overwrite All',
      onSecondary: overwriteAll,
      warning: 'Your edited fields will be preserved unless you choose overwrite.'
    });
  }

  document.addEventListener('DOMContentLoaded', trackDirty);

  return { applyFromSource };
})();
// ==========  TEMPLATE SELECTION MODULE  ==========
window.FrameworkTemplates = (function() {
  'use strict';

  let templates = [];
  let selectedTemplateId = null;

  function init(templatesData) {
    console.log('[FrameworkTemplates] Initializing with templates:', templatesData);
    templates = templatesData || [];
    if (templates.length === 0) {
      console.warn('[FrameworkTemplates] No templates provided');
      return;
    }
    console.log('[FrameworkTemplates] Setting up', templates.length, 'template cards');

    setupTemplateCards();
    addAnimations();
  }

  function setupTemplateCards() {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
      card.addEventListener('click', function() {
        const templateId = this.dataset.templateId;
        console.log('[FrameworkTemplates] Template card clicked, ID:', templateId);
        const template = templates.find(t => t.id === templateId);
        console.log('[FrameworkTemplates] Found template:', template);
        
        if (!template) {
          console.error('[FrameworkTemplates] Template not found for ID:', templateId);
          return;
        }
        
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
          
          // Populate form with template fields using smart apply
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
    console.log('[FrameworkTemplates] populateFormFromTemplate called with:', template);
    if (!template || !template.fields) {
      console.error('[FrameworkTemplates] Template missing or has no fields:', template);
      return;
    }
    console.log('[FrameworkTemplates] Applying template fields:', template.fields);
    window.FormPopulation.applyFromSource(template.fields, 'template');
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
