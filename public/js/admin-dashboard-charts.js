/**
 * Admin Dashboard Charts - Chart.js rendering for device and country statistics
 * Extracted from admin/dashboard.ejs for better maintainability and testability
 */

(function() {
  'use strict';

  const CHART_CONFIG = {
    COLORS: {
      DEVICE: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c'],
      COUNTRY: ['#3498db', '#d85c28']
    },
    FA_ICONS: {
      mobile: 'fas fa-mobile-alt',
      desktop: 'fas fa-desktop',
      tablet: 'fas fa-tablet-alt',
      smartwatch: 'fas fa-clock',
      unknown: 'fas fa-question-circle'
    }
  };

  function initDeviceChart() {
    const deviceTable = document.getElementById('device-table');
    if (!deviceTable) return;

    const deviceRows = deviceTable.querySelectorAll('tbody tr');
    const deviceLabels = [];
    const deviceValues = [];
    
    deviceRows.forEach((row, index) => {
      const device = row.dataset.device.toLowerCase();
      const count = parseInt(row.cells[1].textContent);
      deviceLabels.push(device.charAt(0).toUpperCase() + device.slice(1));
      deviceValues.push(count);
    });
    
    // Add icons and progress bars to device table
    const maxDeviceValue = Math.max(...deviceValues);
    deviceRows.forEach((row, index) => {
      const device = row.dataset.device.toLowerCase();
      const count = parseInt(row.cells[1].textContent);
      const icon = CHART_CONFIG.FA_ICONS[device] || CHART_CONFIG.FA_ICONS.unknown;
      
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.marginBottom = '4px';
      
      const textDiv = document.createElement('div');
      textDiv.style.whiteSpace = 'nowrap';
      textDiv.style.marginBottom = '4px';
      textDiv.innerHTML = '<i class="' + icon + '" style="margin-right:4px;"></i>' + device.charAt(0).toUpperCase() + device.slice(1);
      
      const barWrapper = document.createElement('div');
      barWrapper.style.background = '#e0e0e0';
      barWrapper.style.borderRadius = '5px';
      barWrapper.style.height = '10px';
      barWrapper.style.width = '100%';
      
      const barFill = document.createElement('div');
      barFill.style.width = (count / maxDeviceValue * 100) + '%';
      barFill.style.background = CHART_CONFIG.COLORS.DEVICE[index % CHART_CONFIG.COLORS.DEVICE.length];
      barFill.style.height = '100%';
      barFill.style.borderRadius = '5px';
      
      barWrapper.appendChild(barFill);
      wrapper.appendChild(textDiv);
      wrapper.appendChild(barWrapper);
      row.cells[0].innerHTML = '';
      row.cells[0].appendChild(wrapper);
    });
    
    // Render device chart
    const deviceCanvas = document.getElementById('deviceChart');
    if (!deviceCanvas) return;

    new Chart(deviceCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: deviceLabels,
        datasets: [{
          data: deviceValues,
          backgroundColor: CHART_CONFIG.COLORS.DEVICE.slice(0, deviceValues.length),
          borderWidth: 1,
          borderRadius: 0,
          borderAlign: 'inner'
        }]
      },
      options: {
        responsive: true,
        cutout: '50%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.raw;
              }
            }
          }
        }
      }
    });
  }

  function initCountryChart() {
    const countryTable = document.getElementById('country-table');
    if (!countryTable) return;

    const countryRows = countryTable.querySelectorAll('tbody tr');
    const countryLabels = [];
    const countryValues = [];
    
    countryRows.forEach((row, index) => {
      const countryCode = row.getAttribute('data-country');
      const cell = row.querySelector('.country-cell');
      const count = parseInt(row.cells[1].innerText);
      countryLabels.push(cell.innerText);
      countryValues.push(count);
      
      // Fetch country flag
      if (countryCode) {
        fetch('https://restcountries.com/v3.1/alpha/' + countryCode)
          .then(res => res.json())
          .then(data => {
            if (data && data[0] && data[0].flags && data[0].flags.png) {
              const flagImg = document.createElement('img');
              flagImg.src = data[0].flags.png;
              flagImg.alt = countryCode + ' Flag';
              flagImg.className = 'country-flag';
              cell.prepend(flagImg);
            }
          })
          .catch(err => console.error('Failed to load flag for', countryCode, err));
      }
    });
    
    // Add progress bars to country table
    const maxCountryValue = Math.max(...countryValues);
    countryRows.forEach((row, index) => {
      const cell = row.querySelector('.country-cell');
      const count = parseInt(row.cells[1].innerText);
      const originalText = cell.innerText;
      
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      
      const textDiv = document.createElement('div');
      textDiv.style.display = 'flex';
      textDiv.style.alignItems = 'center';
      textDiv.style.justifyContent = 'flex-start';
      textDiv.style.whiteSpace = 'nowrap';
      textDiv.style.marginBottom = '4px';
      textDiv.textContent = originalText;
      
      const barWrapper = document.createElement('div');
      barWrapper.style.background = '#e0e0e0';
      barWrapper.style.borderRadius = '5px';
      barWrapper.style.height = '10px';
      barWrapper.style.width = '100%';
      
      const barFill = document.createElement('div');
      barFill.style.width = (count / maxCountryValue * 100) + '%';
      barFill.style.background = CHART_CONFIG.COLORS.COUNTRY[index % CHART_CONFIG.COLORS.COUNTRY.length];
      barFill.style.height = '100%';
      barFill.style.borderRadius = '5px';
      
      barWrapper.appendChild(barFill);
      wrapper.appendChild(textDiv);
      wrapper.appendChild(barWrapper);
      cell.innerHTML = '';
      cell.appendChild(wrapper);
    });
    
    // Render country chart
    const countryCanvas = document.getElementById('countryChart');
    if (!countryCanvas) return;

    new Chart(countryCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: countryLabels,
        datasets: [{
          data: countryValues,
          backgroundColor: CHART_CONFIG.COLORS.COUNTRY,
          borderWidth: 1,
          borderRadius: 0,
          borderAlign: 'inner'
        }]
      },
      options: {
        responsive: true,
        cutout: '50%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.raw;
              }
            }
          }
        }
      }
    });
  }

  function init() {
    initDeviceChart();
    initCountryChart();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
