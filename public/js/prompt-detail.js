// Prompt Detail Page JavaScript
(function() {
  'use strict';
  
  // Copy to clipboard functionality - now uses consolidated clipboard.js
  window.copyToClipboard = window.copyToClipboard || function() {
    const text = document.getElementById('prompt-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert('Prompt copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    });
  };
})();
