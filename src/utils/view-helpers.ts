/**
 * View utility functions to eliminate code duplication and complex logic in templates
 */

/**
 * Authentication form utilities
 */
export const AuthUtils = {
  /**
   * Generate common auth form structure to eliminate duplication
   */
  renderForm(config) {
    const { title, action, fields, submitText, footerLink, error } = config;
    
    return `
      <div class="auth-container">
        <h2 class="auth-title">${title}</h2>
        ${error ? `<div class="error" role="alert" aria-live="polite">${error}</div>` : ''}
        
        <form method="POST" action="${action}" aria-label="${title} form">
          ${fields.map(field => this.renderField(field)).join('')}
          <button type="submit" class="btn w-full" aria-label="Submit ${title.toLowerCase()}">${submitText}</button>
        </form>
        
        ${footerLink ? `<p class="auth-footer-text">${footerLink}</p>` : ''}
      </div>
    `;
  },

  renderField(field) {
    const { name, label, type = 'text', required = true, autocomplete, hint, minlength } = field;
    
    return `
      <div class="form-group">
        <label for="${name}">${label}</label>
        <input 
          type="${type}" 
          id="${name}" 
          name="${name}" 
          ${required ? 'required' : ''} 
          ${autocomplete ? `autocomplete="${autocomplete}"` : ''}
          ${required ? 'aria-required="true"' : ''}
          ${hint ? `aria-describedby="${name}-hint"` : ''}
          ${minlength ? `minlength="${minlength}"` : ''}
        >
        ${hint ? `<small id="${name}-hint" class="password-hint">${hint}</small>` : ''}
      </div>
    `;
  }
};

/**
 * Form field utilities
 */
export const FieldUtils = {
  /**
   * Render different field types consistently
   */
  renderField(field, value = '', options = {}) {
    const { showWizardHint = false, fromWizard = false } = options;
    const defaultVal = value || field.defaultValue || '';
    const wizardHint = showWizardHint && defaultVal && fromWizard;
    const defaultHint = defaultVal && field.type !== 'number' && !wizardHint;
    
    return `
      <div class="form-group">
        <label for="${field.name}">
          ${field.label}${field.required ? ' *' : ''}
          ${wizardHint ? `<small class="wizard-hint"><i class='bx bx-check-circle'></i> Pre-filled from wizard</small>` : ''}
          ${defaultHint ? `<small class="default-hint">(using default)</small>` : ''}
        </label>
        ${this.renderInput(field, defaultVal)}
      </div>
    `;
  },

  renderInput(field, value) {
    const baseAttrs = `id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}`;
    
    switch (field.type) {
      case 'textarea':
        return `<textarea ${baseAttrs}>${value}</textarea>`;
      case 'number':
        const limits = (field.name === 'approaches' || field.name === 'versions') ? 'min="1" max="5"' : '';
        return `<input type="number" ${baseAttrs} value="${value || '3'}" ${limits}>`;
      default:
        return `<input type="${field.type}" ${baseAttrs} value="${value}">`;
    }
  }
};

/**
 * Template rendering utilities for common patterns
 */
export class TemplateUtils {
  /**
   * Generate CSS classes for field based on type and validation state
   */
  static getFieldClasses(fieldType: string, hasError: boolean = false, required: boolean = false) {
    const baseClasses = ['form-control'];
    
    if (hasError) baseClasses.push('is-invalid');
    if (required) baseClasses.push('required');
    
    // Add type-specific classes
    switch (fieldType) {
      case 'textarea':
        baseClasses.push('field-textarea');
        break;
      case 'select':
      case 'multiselect':
        baseClasses.push('field-select');
        break;
      case 'number':
        baseClasses.push('field-number');
        break;
      case 'date':
        baseClasses.push('field-date');
        break;
    }
    
    return baseClasses.join(' ');
  }

  /**
   * Generate HTML attributes object for form fields
   */
  static getFieldAttributes(field: any) {
    const attributes: Record<string, any> = {
      id: field.name || field.id,
      name: field.name,
      type: field.type || 'text',
      class: this.getFieldClasses(field.type, !!field.error, field.required),
      'data-field-type': field.type
    };

    // Add conditional attributes
    if (field.required) attributes.required = true;
    if (field.placeholder) attributes.placeholder = field.placeholder;
    if (field.minLength) attributes.minlength = field.minLength;
    if (field.maxLength) attributes.maxlength = field.maxLength;
    if (field.min) attributes.min = field.min;
    if (field.max) attributes.max = field.max;
    if (field.step) attributes.step = field.step;
    if (field.pattern) attributes.pattern = field.pattern;
    if (field.value !== undefined) attributes.value = field.value;
    if (field.readonly) attributes.readonly = true;
    if (field.disabled) attributes.disabled = true;

    // Type-specific attributes
    if (field.type === 'textarea') {
      attributes.rows = field.rows || 3;
      delete attributes.type; // textarea doesn't use type attribute
    }

    return attributes;
  }

  /**
   * Format attributes object as HTML attribute string
   */
  static attributesToString(attributes: Record<string, any>): string {
    return Object.entries(attributes)
      .filter(([key, value]) => value !== null && value !== undefined && value !== false)
      .map(([key, value]) => {
        if (value === true) return key;
        return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
      })
      .join(' ');
  }

  /**
   * Generate responsive grid column classes
   */
  static getResponsiveColumns(sm?: number, md?: number, lg?: number, xl?: number) {
    const classes = ['col'];
    
    if (sm) classes.push(`col-sm-${sm}`);
    if (md) classes.push(`col-md-${md}`);
    if (lg) classes.push(`col-lg-${lg}`);
    if (xl) classes.push(`col-xl-${xl}`);
    
    return classes.join(' ');
  }

  /**
   * Generate consistent button classes
   */
  static getButtonClasses(variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' = 'primary', size?: 'sm' | 'lg') {
    const classes = ['btn', `btn-${variant}`];
    
    if (size) classes.push(`btn-${size}`);
    
    return classes.join(' ');
  }

  /**
   * Generate consistent alert classes
   */
  static getAlertClasses(type: 'success' | 'error' | 'warning' | 'info' = 'info', dismissible: boolean = false) {
    const classes = ['alert', `alert-${type === 'error' ? 'danger' : type}`];
    
    if (dismissible) classes.push('alert-dismissible');
    
    return classes.join(' ');
  }

  /**
   * Helper to check if a value is truthy for template conditions
   */
  static isTruthy(value: any): boolean {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return !!value;
  }

  /**
   * Helper to safely access nested object properties
   */
  static getNestedValue(obj: any, path: string, defaultValue: any = '') {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : defaultValue, obj
    );
  }
}

/**
 * Navigation utilities
 */
export const NavUtils = {
  /**
   * Render wizard navigation consistently
   */
  renderWizardNav(stepNum, totalSteps) {
    const isLastStep = stepNum + 1 === totalSteps;
    const backButton = stepNum > 0 
      ? `<a href="/wizard/question/${stepNum - 1}" class="btn btn-secondary"><i class='bx bx-chevron-left'></i> Back</a>`
      : `<a href="/wizard" class="btn btn-secondary"><i class='bx bx-home'></i> Start Over</a>`;
    
    return `
      <div class="wizard-navigation">
        ${backButton}
        <button type="submit" class="btn btn-primary" id="next-btn">
          ${isLastStep ? 'See Recommendation' : 'Next'}
          <i class='bx bx-chevron-right'></i>
        </button>
      </div>
    `;
  }
};

/**
 * Grid and layout utilities
 */
export const LayoutUtils = {
  /**
   * Generate responsive grid columns
   */
  getGridColumns(breakpoint = 'desktop') {
    const configs = {
      mobile: 'grid-template-columns: 1fr;',
      tablet: 'grid-template-columns: repeat(2, 1fr);',
      desktop: 'grid-template-columns: repeat(12, 1fr);'
    };
    return configs[breakpoint] || configs.desktop;
  },

  /**
   * Generate progress bar
   */
  renderProgressBar(current, total) {
    const percentage = ((current + 1) / total) * 100;
    return `
      <div class="wizard-progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    `;
  }
};

/**
 * Content utilities to eliminate magic strings
 */
export const ContentUtils = {
  /**
   * Truncate text consistently
   */
  truncate(text, maxLength = 200) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  },

  /**
   * Format framework examples consistently
   */
  formatExampleValue(value) {
    if (Array.isArray(value)) {
      return value.map((c, i) => `(${i + 1}) ${c}`).join(', ');
    }
    return typeof value === 'string' ? value.replace(/\n/g, '<br>') : value;
  }
};