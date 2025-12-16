/**
 * Wizard utilities
 * Renders wizard UI components
 */

interface Question {
  id: string;
  text: string;
  description?: string;
  type: 'single-choice' | 'multiple-choice';
  options: Option[];
}

interface Option {
  id: string;
  text: string;
  description?: string;
  icon?: string;
}

interface PreviousAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

interface QuestionConfig {
  question: Question;
  stepNum: number;
  totalSteps: number;
  previousAnswer?: PreviousAnswer;
}

interface Recommendation {
  frameworkId: string;
  frameworkName: string;
  confidence: number;
  explanation: string;
  whyChosen: string[];
  prepopulateData?: Record<string, any>;
  alternativeRecommendations?: AlternativeRecommendation[];
}

interface AlternativeRecommendation {
  frameworkId: string;
  frameworkName: string;
  confidence: number;
}

// Map framework IDs to Boxicon classes (must match frameworks list page)
const FRAMEWORK_ICONS: Record<string, string> = {
  'tot': 'bx-network-chart',
  'self-consistency': 'bx-check-double',
  'cot': 'bx-link',
  'role': 'bx-code-block',
  'reflection': 'bx-edit'
};

export const WizardUtils = {
  /**
   * Get icon for a framework ID
   */
  getFrameworkIcon(frameworkId: string): string {
    return FRAMEWORK_ICONS[frameworkId] || 'bx-code-alt';
  },

  /**
   * Render wizard progress bar with consistent styling
   */
  renderProgressBar(current: number, total: number): string {
    const percentage = ((current + 1) / total) * 100;
    return `
      <div class="wizard-progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    `;
  },

  /**
   * Render progress text with step information
   */
  renderProgressText(current: number, total: number): string {
    return `
      <div class="wizard-progress-text">
        <span>Question ${current + 1} of ${total}</span>
      </div>
    `;
  },

  /**
   * Render wizard navigation buttons with conditional logic
   */
  renderNavigation(stepNum: number, totalSteps: number): string {
    const isLastStep = stepNum + 1 === totalSteps;
    const backButton = stepNum > 0 
      ? `<a href="/wizard/question/${stepNum - 1}" class="btn btn-secondary">
           <i class='bx bx-chevron-left'></i>
           Back
         </a>`
      : `<a href="/wizard" class="btn btn-secondary">
           <i class='bx bx-home'></i>
           Start Over
         </a>`;
    
    return `
      <div class="wizard-navigation">
        ${backButton}
        <button type="submit" class="btn btn-primary" id="next-btn">
          ${isLastStep ? 'See Recommendation' : 'Next'}
          <i class='bx bx-chevron-right'></i>
        </button>
      </div>
    `;
  },

  /**
   * Render question options with consistent structure
   */
  renderOptions(question: Question, previousAnswer?: PreviousAnswer): string {
    const optionType = question.type === 'single-choice' ? 'radio' : 'checkbox';
    
    return question.options.map(option => {
      const isSelected = previousAnswer && previousAnswer.selectedOptionIds.includes(option.id);
      
      return `
        <label class="wizard-option-card ${isSelected ? 'selected' : ''}" for="option-${option.id}">
          <input 
            type="${optionType}" 
            id="option-${option.id}" 
            name="selectedOptionIds" 
            value="${option.id}"
            ${isSelected ? 'checked' : ''}
            required
          >
          <div class="option-content">
            ${option.icon ? `<i class='bx ${option.icon} option-icon'></i>` : ''}
            <div class="option-text">
              <h3>${option.text}</h3>
              ${option.description ? `<p>${option.description}</p>` : ''}
            </div>
            <i class='bx bx-check-circle option-check'></i>
          </div>
        </label>
      `;
    }).join('');
  },

  /**
   * Render complete wizard question form
   */
  renderQuestionForm(config: QuestionConfig): string {
    const { question, stepNum, totalSteps, previousAnswer } = config;
    
    return `
      <div class="wizard-container">
        ${this.renderProgressBar(stepNum, totalSteps)}
        ${this.renderProgressText(stepNum, totalSteps)}

        <div class="wizard-question-card">
          <h1 class="question-title">${question.text}</h1>
          ${question.description ? `<p class="question-description">${question.description}</p>` : ''}

          <form id="wizard-form" class="wizard-options-form">
            <input type="hidden" name="questionId" value="${question.id}">
            
            <div class="wizard-options ${question.type === 'multiple-choice' ? 'multiple-choice' : ''}">
              ${this.renderOptions(question, previousAnswer)}
            </div>

            ${this.renderNavigation(stepNum, totalSteps)}
          </form>
        </div>

        <p class="wizard-help-text">
          <i class='bx bx-info-circle'></i>
          Choose the option that best matches your needs
        </p>
      </div>
    `;
  },

  /**
   * Generate wizard JavaScript initialization
   */
  renderScript(question: Question, totalSteps: number, stepNum: number): string {
    return `
      <script src="/js/wizard.js"></script>
      <script>
      document.addEventListener('DOMContentLoaded', function() {
        WizardForm.init({
          questionType: '${question.type}',
          totalSteps: ${totalSteps},
          currentStep: ${stepNum}
        });
      });
      </script>
    `;
  },

  /**
   * Get recommendation heading based on confidence level
   */
  getRecommendationHeading(confidence: number): { title: string; subtitle: string } {
    if (confidence >= 70) {
      return {
        title: 'Great Match Found!',
        subtitle: 'Based on your answers, we recommend:'
      };
    } else if (confidence >= 50) {
      return {
        title: 'We Have a Recommendation',
        subtitle: 'Based on your answers, this framework fits your needs:'
      };
    } else {
      return {
        title: 'Here\'s Our Suggestion',
        subtitle: 'Based on your answers, we think this could work well:'
      };
    }
  },

  /**
   * Render recommendation framework card
   */
  renderFrameworkCard(recommendation: Recommendation): string {
    const icon = this.getFrameworkIcon(recommendation.frameworkId);
    return `
      <div class="recommendation-framework-card">
        <i class='bx ${icon} framework-icon'></i>
        <h2 class="framework-name">${recommendation.frameworkName}</h2>
        <div class="confidence-badge">
          <i class='bx bx-trending-up'></i>
          ${recommendation.confidence}% match
        </div>
      </div>
    `;
  },

  /**
   * Render recommendation explanation section
   */
  renderExplanation(recommendation: Recommendation): string {
    return `
      <div class="recommendation-explanation">
        <h3><i class='bx bx-bulb'></i> What This Framework Does</h3>
        <p class="explanation-text">${recommendation.explanation}</p>
      </div>
    `;
  },

  /**
   * Render why chosen section
   */
  renderWhyChosen(whyChosen: string[]): string {
    return `
      <div class="recommendation-why">
        <h3><i class='bx bx-list-check'></i> Why We Chose This for You</h3>
        <ul class="why-chosen-list">
          ${whyChosen.map(reason => `
            <li><i class='bx bx-check'></i> ${reason}</li>
          `).join('')}
        </ul>
      </div>
    `;
  },

  /**
   * Render action buttons with conditional prepopulate data
   */
  renderActionButtons(recommendation: Recommendation): string {
    const primaryButton = recommendation.prepopulateData
      ? `<a href="/frameworks/${recommendation.frameworkId}?fromWizard=true&prepopulate=${encodeURIComponent(JSON.stringify(recommendation.prepopulateData))}" class="btn btn-primary btn-large">
           <i class='bx bx-play'></i>
           Start Creating Your Prompt
         </a>`
      : `<a href="/frameworks/${recommendation.frameworkId}?fromWizard=true" class="btn btn-primary btn-large">
           <i class='bx bx-play'></i>
           Try This Framework
         </a>`;

    return `
      <div class="recommendation-actions">
        ${primaryButton}
        <a href="/frameworks" class="btn btn-secondary">
          <i class='bx bx-list-ul'></i>
          Browse All Frameworks
        </a>
      </div>
    `;
  },

  /**
   * Render alternative recommendations section
   */
  renderAlternatives(alternatives?: AlternativeRecommendation[]): string {
    if (!alternatives || alternatives.length === 0) {
      return '';
    }

    return `
      <div class="recommendation-alternatives">
        <h3><i class='bx bx-collection'></i> Other Good Options</h3>
        <p class="alternatives-intro">Your needs could be met by multiple frameworks. Here are other options to consider:</p>
        
        <div class="alternatives-grid">
          ${alternatives.map(alt => {
            const icon = this.getFrameworkIcon(alt.frameworkId);
            return `
              <div class="alternative-card">
                <i class='bx ${icon} alt-icon'></i>
                <h4>${alt.frameworkName}</h4>
                <div class="alternative-confidence">${alt.confidence}% match</div>
                <a href="/frameworks/${alt.frameworkId}?fromWizard=true" class="btn btn-outline">
                  Try This One
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render warning tip based on confidence
   */
  renderConfidenceTip(confidence: number): string {
    if (confidence < 50) {
      return `
        <div class="recommendation-tip warning-bg">
          <i class='bx bx-info-circle warning-text'></i>
          <p class="warning-text"><strong>Note:</strong> Your answers suggest multiple frameworks could work well. Review the options above or browse all frameworks to find what resonates with you.</p>
        </div>
      `;
    } else {
      return `
        <div class="recommendation-tip">
          <i class='bx bx-lightbulb'></i>
          <p><strong>Pro Tip:</strong> You can always switch to a different framework later if you want to try a different approach.</p>
        </div>
      `;
    }
  },

  /**
   * Render complete recommendation page
   */
  renderRecommendation(recommendation: Recommendation, csrfToken: string): string {
    const heading = this.getRecommendationHeading(recommendation.confidence);
    
    return `
      <div class="wizard-container">
        <div class="wizard-recommendation">
          <!-- Success Animation -->
          <div class="recommendation-icon">
            <i class='bx bx-check-circle'></i>
          </div>

          <h1 class="recommendation-title">${heading.title}</h1>
          <p class="recommendation-subtitle">${heading.subtitle}</p>

          ${this.renderFrameworkCard(recommendation)}
          ${this.renderExplanation(recommendation)}
          ${this.renderWhyChosen(recommendation.whyChosen)}
          ${this.renderActionButtons(recommendation)}
          ${this.renderAlternatives(recommendation.alternativeRecommendations)}
          ${this.renderConfidenceTip(recommendation.confidence)}

          <!-- Reset Options -->
          <div class="wizard-footer">
            <form action="/wizard/reset" method="POST" class="inline">
              <input type="hidden" name="_csrf" value="${csrfToken}">
              <button type="submit" class="btn btn-link">
                <i class='bx bx-refresh'></i>
                Start Over
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
};
