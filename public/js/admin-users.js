// Admin Users Page JavaScript
(function() {
  'use strict';
  
  document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('user-search');
    const tableRows = document.querySelectorAll('#users-table-body tr');
    
    if (searchInput && tableRows.length > 0) {
      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        let visibleCount = 0;
        
        tableRows.forEach(row => {
          const name = row.querySelector('td:first-child').textContent.toLowerCase();
          const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
          const matches = name.includes(query) || email.includes(query);
          row.style.display = matches ? '' : 'none';
          if (matches) visibleCount++;
        });
        
        const paginationInfo = document.getElementById('pagination-info');
        if (paginationInfo) {
          paginationInfo.textContent = 'Total users: ' + visibleCount;
        }
      });
    }
    
    // Filter dropdown
    const filterBtn = document.getElementById('filter-btn');
    const filterMenu = document.getElementById('filter-menu');
    const filterItems = document.querySelectorAll('.filter-item');
    
    if (filterBtn && filterMenu) {
      filterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        filterMenu.toggleAttribute('hidden');
      });
      
      document.body.addEventListener('click', function() {
        filterMenu.setAttribute('hidden', '');
      });
    }
    
    if (filterItems.length > 0) {
      filterItems.forEach(item => {
        item.addEventListener('click', function() {
          const value = this.getAttribute('data-value');
          filterBtn.innerHTML = 'Filter: ' + this.textContent + ' <i class="fas fa-caret-down"></i>';
          filterMenu.setAttribute('hidden', '');
          
          let visibleCount = 0;
          tableRows.forEach(row => {
            const userType = row.getAttribute('data-user-type');
            const matches = !value || userType === value;
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
          });
          
          const paginationInfo = document.getElementById('pagination-info');
          if (paginationInfo) {
            paginationInfo.textContent = 'Total users: ' + visibleCount;
          }
        });
      });
    }
    
    // Action dropdowns
    document.addEventListener('click', function(e) {
      if (e.target.closest('.action-btn')) {
        const btn = e.target.closest('.action-btn');
        const menu = btn.parentElement.querySelector('.action-menu');
        
        // Close all other dropdowns
        document.querySelectorAll('.action-menu:not([hidden])').forEach(m => {
          if (m !== menu) m.setAttribute('hidden', '');
        });
        
        // Toggle this dropdown
        if (menu.hasAttribute('hidden')) {
          menu.removeAttribute('hidden');
        } else {
          menu.setAttribute('hidden', '');
        }
        e.stopPropagation();
        return;
      }
      
      // Close all dropdowns when clicking outside
      document.querySelectorAll('.action-menu').forEach(menu => {
        menu.setAttribute('hidden', '');
      });
    });
  });
})();
