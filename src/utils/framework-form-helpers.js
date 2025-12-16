/**
 * Framework Form Template Helpers
 * Extracted from frameworks/form.ejs to eliminate God Template anti-pattern
 */

class FrameworkFormHelpers {
  /**
   * Render examples section for framework
   */
  static renderExamplesSection(framework) {
    if (!framework.examples) return '';
    
    return `
      <div class="examples-section">
        <button type="button" id="toggle-examples-btn" class="toggle-examples-btn">
          <span class="toggle-left">
            <span class="toggle-icon-large">
              <i class='bx bx-book'></i>
            </span>
            <span class="toggle-text-group">
              <span class="toggle-examples-main">View Detailed Examples</span>
              <span class="toggle-subtitle">Learn what makes a high-quality prompt</span>
            </span>
          </span>
          <span class="toggle-hint-wrapper">
            <span id="toggle-hint" class="toggle-hint">Click to expand</span>
            <span id="toggle-icon" class="toggle-icon">
              <i class='bx bx-chevron-right'></i>
            </span>
          </span>
        </button>
        
        <div id="examples-container" class="examples-container">
          <div class="example-controls">
            <div class="category-buttons">
              <button type="button" id="category-general" class="category-btn active" data-category="general">General</button>
              <button type="button" id="category-business" class="category-btn" data-category="business">Business</button>
            </div>
            <button type="button" id="load-example-btn" class="load-example-btn">
              <i class='bx bx-upload'></i> Load Example
            </button>
          </div>
          <div id="example-content" class="example-content-box">
            ${this.renderExampleFields(framework)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render example fields for framework
   */
  static renderExampleFields(framework) {
    return framework.fields.map(field => {
      const exampleValue = framework.examples.general[field.name];
      if (!exampleValue) return '';
      
      const displayValue = Array.isArray(exampleValue) 
        ? exampleValue.map((c, i) => `(${i + 1}) ${c}`).join(', ')
        : exampleValue;
      const formattedValue = typeof displayValue === 'string' ? displayValue.replace(/\n/g, '<br>') : displayValue;
      
      return `
        <div class="example-field" data-field="${field.name}">
          <strong>${field.label}:</strong> 
          <span class="example-value">${formattedValue}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Render form fields section
   */
  static renderFormFields(framework, prepopulateData = {}, fromWizard = false) {
    return framework.fields
      .filter(field => field.type !== 'multi-select-criteria' && !field.optional)
      .map(field => this.renderSingleField(field, prepopulateData, fromWizard))
      .join('');
  }

  /**
   * Render a single form field
   */
  static renderSingleField(field, prepopulateData = {}, fromWizard = false) {
    const prepopVal = prepopulateData[field.name] || '';
    const defaultVal = prepopVal || field.defaultValue || '';
    const showWizardHint = prepopVal && fromWizard;
    
    // Handle special number field defaults
    let fieldValue = defaultVal;
    if (field.type === 'number' && (field.name === 'approaches' || field.name === 'versions')) {
      fieldValue = defaultVal || '3';
    }
    
    const labelHint = showWizardHint 
      ? '<small class="wizard-hint"><i class="bx bx-check-circle"></i> Pre-filled from wizard</small>'
      : (defaultVal && field.type !== 'number') 
        ? '<small class="default-hint">(using default)</small>' 
        : '';

    const inputAttribs = this.getInputAttributes(field, fieldValue);
    
    const inputElement = field.type === 'textarea' 
      ? `<textarea ${this.attributesToString(inputAttribs)}>${fieldValue}</textarea>`
      : `<input ${this.attributesToString(inputAttribs)}>`;

    return `
      <div class="form-group">
        <label for="${field.name}">
          ${field.label}${field.required ? ' *' : ''}
          ${labelHint}
        </label>
        ${inputElement}
      </div>
    `;
  }

  /**
   * Render criteria selector section
   */
  static renderCriteriaSelector(framework, subscription) {
    const criteriaField = framework.fields.find(f => f.type === 'multi-select-criteria');
    if (!criteriaField) return '';
    
    return `
      <div class="form-group">
        <label for="criteria">Evaluation Criteria *</label>
        <div class="criteria-box">
          <div id="criteria-checkboxes"></div>
          <div class="custom-criteria-wrapper">
            <button type="button" id="add-custom-btn">+ Add Custom Criteria</button>
            <div id="custom-input-container" class="custom-input-container">
              <input type="text" id="custom-criteria-input" placeholder="Enter custom criteria..." maxlength="200">
              <div class="custom-btn-row">
                <button type="button" id="add-custom-submit-btn" class="btn">Add</button>
                <button type="button" id="cancel-custom-btn" class="btn-secondary">Cancel</button>
              </div>
              <small class="criteria-help">
                ${subscription.isPremium 
                  ? '💾 Custom criteria can be saved for future use' 
                  : '⏱️ Custom criteria available this session only · <a href="/premium">Upgrade to save</a>'
                }
              </small>
              ${subscription.isPremium ? `
                <div class="save-option">
                  <label class="save-checkbox-label">
                    <input type="checkbox" id="save-custom-checkbox">
                    <span>💾 Save for future sessions</span>
                  </label>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        <input type="hidden" id="criteria" name="criteria" value="[]">
        <small class="criteria-counter">
          <span id="criteria-count">0</span>/4 criteria selected 
          <span class="default-note">(4 defaults selected)</span>
        </small>
      </div>
    `;
  }

  /**
   * Render advanced options section
   */
  static renderAdvancedOptions(framework) {
    const optionalFields = framework.fields.filter(f => f.optional);
    if (optionalFields.length === 0) return '';
    
    return `
      <div class="advanced-section">
        <button type="button" id="toggle-advanced-btn" class="advanced-toggle">
          <span id="advanced-icon" class="toggle-icon">▶</span>
          <span>Advanced Options (optional)</span>
        </button>
        <div id="advanced-options" class="advanced-options-content">
          ${optionalFields.map(field => `
            <div class="form-group">
              <label for="${field.name}">${field.label}</label>
              <textarea 
                id="${field.name}" 
                name="${field.name}" 
                placeholder="${field.placeholder || ''}"
                class="form-control"
              ></textarea>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render templates section
   */
  static renderTemplatesSection(framework) {
    if (!framework.templates || framework.templates.length === 0) return '';
    
    return `
      <div class="templates-section">
        <h3 class="section-title">Templates</h3>
        <div id="templates-container" class="templates-container">
          ${framework.templates.map(template => `
            <div class="template-card" data-template-id="${template.id}">
              <div class="template-row">
                <span class="template-category ${template.category}">${template.category}</span>
                <div class="template-indicator"></div>
              </div>
              <h4>${template.name}</h4>
              <p>${template.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render modal component
   */
  static renderModal() {
    return `
      <div id="unified-modal" class="modal">
        <div class="modal-content">
          <button id="unified-modal-close" class="modal-close-btn">&times;</button>
          <p id="unified-modal-message" class="modal-message"></p>
          <div class="modal-btn-row">
            <button id="unified-modal-confirm" class="btn btn-primary">OK</button>
            <button id="unified-modal-cancel" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get input attributes for a field
   */
  static getInputAttributes(field, value) {
    const attributes = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder || '',
      class: 'form-control'
    };

    if (field.required) attributes.required = true;
    if (field.type !== 'textarea') attributes.type = field.type;
    if (value) attributes.value = value;
    
    // Special handling for number fields
    if (field.type === 'number' && (field.name === 'approaches' || field.name === 'versions')) {
      attributes.min = '1';
      attributes.max = '5';
    }
    
    return attributes;
  }

  /**
   * Convert attributes object to string
   */
  static attributesToString(attributes) {
    return Object.entries(attributes)
      .filter(([key, value]) => value !== null && value !== undefined && value !== false)
      .map(([key, value]) => {
        if (value === true) return key;
        return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
      })
      .join(' ');
  }
}

// Export for use in EJS templates
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrameworkFormHelpers;
}