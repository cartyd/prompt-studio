/**
 * User Dropdown Menu Functionality
 * Extracted from layout.ejs for better organization
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserDropdown);
  } else {
    initUserDropdown();
  }

  function initUserDropdown() {
    const avatarWrapper = document.getElementById('avatar-wrapper');
    const dropdownMenu = document.getElementById('dropdown-menu');

    // Exit if elements don't exist (user not logged in)
    if (!avatarWrapper || !dropdownMenu) return;

    // Toggle dropdown on avatar click
    avatarWrapper.addEventListener('click', handleAvatarClick);
    
    // Close dropdown when clicking outside
    document.body.addEventListener('click', handleOutsideClick);
    
    // Handle keyboard navigation
    document.addEventListener('keydown', handleKeydown);
  }

  function handleAvatarClick(e) {
    e.stopPropagation();
    const avatarWrapper = e.currentTarget;
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    const isExpanded = avatarWrapper.getAttribute('aria-expanded') === 'true';
    
    dropdownMenu.toggleAttribute('hidden');
    avatarWrapper.setAttribute('aria-expanded', !isExpanded);
  }

  function handleOutsideClick() {
    const avatarWrapper = document.getElementById('avatar-wrapper');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (dropdownMenu && !dropdownMenu.hasAttribute('hidden')) {
      dropdownMenu.setAttribute('hidden', '');
      if (avatarWrapper) {
        avatarWrapper.setAttribute('aria-expanded', 'false');
      }
    }
  }

  function handleKeydown(e) {
    const avatarWrapper = document.getElementById('avatar-wrapper');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (e.key === 'Escape' && dropdownMenu && !dropdownMenu.hasAttribute('hidden')) {
      dropdownMenu.setAttribute('hidden', '');
      if (avatarWrapper) {
        avatarWrapper.setAttribute('aria-expanded', 'false');
        avatarWrapper.focus();
      }
    }
  }
})();