/**
 * Client-side date formatting utility
 * Formats dates in the user's local timezone using Intl.DateTimeFormat
 */

(function () {
  'use strict';

  /**
   * Format a date based on the specified format type
   * @param {string|Date} date - ISO date string or Date object
   * @param {string} format - Format type: 'date', 'datetime', 'relative', 'long-date'
   * @returns {string} Formatted date string
   */
  function formatDate(date, format = 'date') {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return String(date);
    }

    switch (format) {
      case 'date':
        // Short date format: "12/11/2025"
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).format(dateObj);

      case 'long-date':
        // Long date format: "December 11, 2025"
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(dateObj);

      case 'datetime':
        // Full datetime format: "12/11/2025, 9:12 PM"
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(dateObj);

      case 'relative':
        // Relative format: "2 hours ago", "3 days ago"
        return formatRelativeDate(dateObj);

      case 'time':
        // Time only: "9:12 PM"
        return new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(dateObj);

      default:
        return dateObj.toLocaleDateString();
    }
  }

  /**
   * Format a date relative to now
   * @param {Date} date - Date object
   * @returns {string} Relative date string
   */
  function formatRelativeDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Process all elements with data-format-date attribute
   */
  function processDateElements() {
    const elements = document.querySelectorAll('[data-format-date]');

    elements.forEach((element) => {
      const dateValue = element.getAttribute('data-format-date');
      const format = element.getAttribute('data-format') || 'date';

      if (dateValue) {
        try {
          const formatted = formatDate(dateValue, format);
          element.textContent = formatted;

          // Add title attribute with full datetime for accessibility
          if (format !== 'datetime') {
            const fullDatetime = formatDate(dateValue, 'datetime');
            element.setAttribute('title', fullDatetime);
          }
        } catch (error) {
          console.error('Error formatting date:', error, dateValue);
          // Leave original content as fallback
        }
      }
    });
  }

  /**
   * Initialize date formatter when DOM is ready
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', processDateElements);
    } else {
      processDateElements();
    }
  }

  // Auto-initialize
  init();

  // Expose formatDate function globally for dynamic content
  window.formatDate = formatDate;
  window.refreshDateFormatting = processDateElements;
})();
