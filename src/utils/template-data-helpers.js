/**
 * Template Data Helpers - Extract business logic from templates
 * Eliminates Code Smell 7: Template Logic Complexity
 */

class PromptListHelpers {
  /**
   * Process prompts for list display with truncation and metadata
   */
  static processPromptsForDisplay(prompts, subscription) {
    return prompts.map(prompt => ({
      ...prompt,
      truncatedText: this.truncateText(prompt.finalPromptText, 200),
      canExport: subscription && subscription.isPremium,
      displayDate: prompt.createdAt
    }));
  }

  /**
   * Truncate text with ellipsis if over limit
   */
  static truncateText(text, limit) {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  /**
   * Render prompt row HTML
   */
  static renderPromptRow(prompt) {
    return `
      <div id="prompt-row-${prompt.id}" class="prompt-row">
        <div class="prompt-content">
          <h3>${prompt.title}</h3>
          <p class="prompt-meta">
            ${prompt.frameworkType} • <span data-format-date="${prompt.displayDate}" data-format="date">${prompt.displayDate}</span>
          </p>
          <p class="prompt-preview">${prompt.truncatedText}</p>
        </div>
        <div class="prompt-actions">
          <a href="/prompts/${prompt.id}" class="btn btn-secondary">View</a>
          ${prompt.canExport ? `<a href="/prompts/${prompt.id}/export" class="btn">Export</a>` : ''}
          <button 
            hx-delete="/prompts/${prompt.id}" 
            hx-target="#prompt-row-${prompt.id}" 
            hx-swap="outerHTML"
            hx-confirm="Are you sure you want to delete this prompt?"
            class="btn btn-danger">Delete</button>
        </div>
      </div>
    `;
  }
}

class FrameworkListHelpers {
  /**
   * Split frameworks into featured and regular sections
   */
  static organizeFrameworks(frameworks) {
    return {
      featured: frameworks.slice(0, 2),
      regular: frameworks.slice(2)
    };
  }

  /**
   * Render framework card HTML
   */
  static renderFrameworkCard(framework) {
    return `
      <div class="framework-card">
        <div class="framework-card-header">
          <div class="framework-icon">
            <i class="fas fa-${framework.icon || 'cog'}" aria-hidden="true"></i>
          </div>
          <h3 class="framework-title">${framework.name}</h3>
        </div>
        <p class="framework-description">${framework.description}</p>
        <div class="framework-card-footer">
          <a href="/frameworks/${framework.id}" class="btn btn-primary">Use Framework</a>
        </div>
      </div>
    `;
  }
}

class AdminDataHelpers {
  /**
   * Format statistics data for display
   */
  static formatStatistic(stat, type = 'default') {
    const formatters = {
      percentage: (value) => `${Math.round(value * 100)}%`,
      decimal: (value) => value.toFixed(2),
      integer: (value) => Math.round(value),
      default: (value) => value
    };

    return {
      ...stat,
      formattedValue: formatters[type](stat.value || stat.count || 0)
    };
  }

  /**
   * Process analytics data for template display
   */
  static processAnalyticsData(data, type) {
    if (!data || data.length === 0) {
      return {
        hasData: false,
        emptyMessage: 'No data available for this period',
        rows: []
      };
    }

    return {
      hasData: true,
      emptyMessage: '',
      rows: data.map(item => this.formatStatistic(item, type))
    };
  }

  /**
   * Render statistics table row
   */
  static renderStatRow(stat, columns) {
    const cells = columns.map(col => {
      const value = col.formatter ? col.formatter(stat[col.key]) : stat[col.key];
      return `<td>${value}</td>`;
    }).join('');
    
    return `<tr>${cells}</tr>`;
  }

  /**
   * Render empty state row
   */
  static renderEmptyRow(colspan, message) {
    return `<tr><td colspan="${colspan}" class="text-center text-muted">${message}</td></tr>`;
  }
}

class HomePageHelpers {
  /**
   * Process features for carousel display
   */
  static processFeatures(features) {
    return features.map((feature, index) => ({
      ...feature,
      isActive: index === 0,
      slideClass: index === 0 ? 'active' : ''
    }));
  }

  /**
   * Render feature slide HTML
   */
  static renderFeatureSlide(feature) {
    return `
      <div class="hero-slide ${feature.slideClass}" data-slide="${feature.id}">
        <div class="hero-content">
          <h2>${feature.title}</h2>
          <p>${feature.description}</p>
          <a href="${feature.link}" class="btn btn-primary">${feature.cta}</a>
        </div>
      </div>
    `;
  }
}

module.exports = {
  PromptListHelpers,
  FrameworkListHelpers,
  AdminDataHelpers,
  HomePageHelpers
};