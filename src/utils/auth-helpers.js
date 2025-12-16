/**
 * Authentication form utilities for EJS templates
 * Eliminates code duplication between auth forms
 */

const AuthUtils = {
  /**
   * Generate common auth form structure to eliminate duplication
   */
  renderForm(config) {
    const { title, action, fields, submitText, footerLink, error, additionalFields, hiddenFields, description } = config;
    
    return `
      <div class="auth-container">
        <h2 class="auth-title">${title}</h2>
        ${error ? `<div class="error" role="alert" aria-live="polite">${error}</div>` : ''}
        ${description ? `<p class="mb-1-5 text-muted">${description}</p>` : ''}
        
        <form method="POST" action="${action}" aria-label="${title} form">
          ${hiddenFields ? hiddenFields.map(field => `<input type="hidden" name="${field.name}" value="${field.value}">`).join('') : ''}
          ${fields.map(field => this.renderField(field)).join('')}
          ${additionalFields || ''}
          <button type="submit" class="btn w-full" aria-label="Submit ${title.toLowerCase()}">${submitText}</button>
        </form>
        
        ${footerLink ? `<p class="auth-footer-text">${footerLink}</p>` : ''}
      </div>
    `;
  },

  renderField(field) {
    const { name, label, type = 'text', required = true, autocomplete, hint, minlength, additionalContent, autofocus } = field;
    
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
          ${autofocus ? 'autofocus' : ''}
        >
        ${hint ? `<small id="${name}-hint" class="password-hint">${hint}</small>` : ''}
        ${additionalContent || ''}
      </div>
    `;
  }
};

module.exports = { AuthUtils };