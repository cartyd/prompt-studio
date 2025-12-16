/**
 * Consolidated copy to clipboard functionality
 * Provides consistent clipboard interaction across the application
 */

/**
 * Copy text to clipboard with visual feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} button - Button element to provide feedback on
 * @param {object} options - Configuration options
 */
function copyToClipboardWithFeedback(text, button, options = {}) {
  const config = {
    successIcon: '✓',
    defaultIcon: '📋',
    successText: 'Copied!',
    defaultText: 'Copy to Clipboard',
    successColor: '#27ae60',
    defaultColor: '#3498db',
    resetDelay: 2000,
    fallbackAlert: false, // Use alert for fallback instead of visual feedback
    ...options
  };

  const icon = button.querySelector('[data-copy-icon]') || button.querySelector('#copy-icon');
  const text_element = button.querySelector('[data-copy-text]') || button.querySelector('#copy-text');

  navigator.clipboard.writeText(text).then(() => {
    // Success feedback
    if (icon) icon.textContent = config.successIcon;
    if (text_element) text_element.textContent = config.successText;
    if (button.style) button.style.background = config.successColor;
    
    // Reset after delay
    setTimeout(() => {
      if (icon) icon.textContent = config.defaultIcon;
      if (text_element) text_element.textContent = config.defaultText;
      if (button.style) button.style.background = config.defaultColor;
    }, config.resetDelay);
  }).catch(err => {
    console.error('Failed to copy:', err);
    
    if (config.fallbackAlert) {
      alert('Prompt copied to clipboard!');
      return;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      if (icon) icon.textContent = config.successIcon;
      if (text_element) text_element.textContent = config.successText;
      setTimeout(() => {
        if (icon) icon.textContent = config.defaultIcon;
        if (text_element) text_element.textContent = config.defaultText;
      }, config.resetDelay);
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      if (text_element) text_element.textContent = 'Copy failed';
    }
    
    document.body.removeChild(textArea);
  });
}

/**
 * Simple copy to clipboard function for basic usage
 * @param {string} text - Text to copy
 * @returns {Promise} - Promise that resolves when copy is complete
 */
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
  });
}

/**
 * Initialize copy buttons with automatic event handling
 */
function initializeCopyButtons() {
  // Handle buttons with data-copy-source attribute
  document.querySelectorAll('[data-copy-source]').forEach(button => {
    if (button.dataset.listenerAttached) return;
    button.dataset.listenerAttached = 'true';
    
    button.addEventListener('click', function() {
      const sourceId = this.dataset.copySource;
      const sourceElement = document.getElementById(sourceId);
      if (sourceElement) {
        const text = sourceElement.textContent || sourceElement.value;
        copyToClipboardWithFeedback(text, this);
      }
    });
  });

  // Legacy support for existing prompt-text elements
  const copyBtn = document.getElementById('copy-prompt-btn');
  if (copyBtn && !copyBtn.dataset.listenerAttached) {
    copyBtn.dataset.listenerAttached = 'true';
    
    copyBtn.addEventListener('click', function() {
      const promptText = document.getElementById('prompt-text').textContent;
      copyToClipboardWithFeedback(promptText, this);
    });
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCopyButtons);
} else {
  initializeCopyButtons();
}

// Global functions for backward compatibility
window.copyToClipboard = function(text) {
  if (text) {
    return copyToClipboard(text);
  }
  
  // Legacy behavior - find prompt-text element
  const element = document.getElementById('prompt-text');
  if (element) {
    const textToCopy = element.textContent;
    return copyToClipboard(textToCopy).then(() => {
      alert('Prompt copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  }
};

window.copyToClipboardWithFeedback = copyToClipboardWithFeedback;
window.initializeCopyButtons = initializeCopyButtons;