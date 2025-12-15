/**
 * Data mapping utilities for wizard functionality
 * Extracts lookup data and mapping functions from main wizard logic
 */

/**
 * Framework name mappings for display
 */
export const FRAMEWORK_NAMES: Record<string, string> = {
  'tot': 'Tree-of-Thought (ToT)',
  'cot': 'Chain-of-Thought (CoT)',
  'self-consistency': 'Self-Consistency',
  'role': 'Few-Shot / Role Prompting',
  'reflection': 'Reflection / Revision'
};

/**
 * Framework explanations
 */
export const FRAMEWORK_EXPLANATIONS: Record<string, string> = {
  'tot': 'Explores multiple reasoning paths simultaneously and evaluates each approach to find the optimal solution. Perfect for complex problems with multiple possible solutions.',
  'cot': 'Breaks down complex problems into clear, sequential steps. Excellent for logical reasoning and problems that benefit from systematic analysis.',
  'self-consistency': 'Generates multiple independent reasoning paths and selects the most consistent answer. Ideal when you need high confidence in uncertain situations.',
  'role': 'Defines a specific role and provides examples to guide AI behavior. Great for creative tasks and content generation with specific style requirements.',
  'reflection': 'Creates an initial response, then critically evaluates and improves it. Perfect for high-quality content that benefits from iterative refinement.'
};

/**
 * Reasons why each framework was chosen based on user input
 */
export const FRAMEWORK_SELECTION_REASONS: Record<string, Record<string, string[]>> = {
  'tot': {
    'high_complexity': [
      'Your problem appears complex and could benefit from exploring multiple solution approaches',
      'Tree-of-Thought excels at evaluating different strategies side-by-side'
    ],
    'decision_type': [
      'For decision-making problems, comparing multiple reasoning paths helps identify the best choice',
      'This framework helps weigh pros and cons systematically'
    ],
    'experienced_user': [
      'Given your experience level, you can leverage the sophisticated analysis ToT provides',
      'This framework offers the depth of analysis that matches your expertise'
    ]
  },
  'cot': {
    'analytical_problem': [
      'Analytical problems benefit greatly from step-by-step reasoning',
      'Chain-of-Thought provides the logical structure your problem needs'
    ],
    'beginner_friendly': [
      'This framework is excellent for those new to prompt engineering',
      'It provides clear structure that\'s easy to follow and understand'
    ],
    'general_purpose': [
      'Chain-of-Thought is versatile and works well for most problem types',
      'It\'s a reliable choice that delivers consistent results'
    ]
  },
  'self-consistency': {
    'unclear_problem': [
      'When problem requirements are unclear, multiple reasoning paths help find the right approach',
      'This framework excels in ambiguous situations where you need confidence'
    ],
    'high_stakes': [
      'For important decisions, generating multiple solutions increases confidence',
      'The consensus approach reduces the risk of incorrect reasoning'
    ],
    'complex_decision': [
      'Complex decisions benefit from multiple independent analyses',
      'This helps identify the most reliable and consistent solution'
    ]
  },
  'role': {
    'creative_task': [
      'Creative tasks benefit from specific role definition and style examples',
      'This framework excels at generating content with particular voices or styles'
    ],
    'content_creation': [
      'Role prompting is ideal for content generation and writing tasks',
      'It helps establish the right tone and approach for your specific needs'
    ],
    'style_specific': [
      'When you need specific formatting or style, role prompting provides clear guidance',
      'Examples and role definition ensure consistent output quality'
    ]
  },
  'reflection': {
    'quality_focus': [
      'When output quality is paramount, the revision process ensures excellence',
      'Multiple iterations typically produce significantly better results'
    ],
    'creative_content': [
      'Creative work benefits greatly from initial creation followed by critical review',
      'This framework is perfect for content that needs refinement and polish'
    ],
    'experienced_user': [
      'Your experience level means you can provide effective revision criteria',
      'This sophisticated approach matches your ability to guide the process'
    ]
  }
};

/**
 * Pre-populate data for each framework based on user answers
 */
export interface PrepopulateDataResult {
  [key: string]: string | string[];
}

export function generatePrepopulateData(frameworkId: string, answers: any): PrepopulateDataResult {
  const generators: Record<string, (answers: any) => PrepopulateDataResult> = {
    'tot': generateToTData,
    'cot': generateCoTData,
    'self-consistency': generateSelfConsistencyData,
    'role': generateRoleData,
    'reflection': generateReflectionData
  };

  const generator = generators[frameworkId];
  return generator ? generator(answers) : {};
}

function generateToTData(answers: any): PrepopulateDataResult {
  const roleMap: Record<string, string> = {
    'analytical': 'expert analyst specializing in systematic problem-solving',
    'decision': 'strategic decision-maker with expertise in complex scenarios',
    'creative': 'innovative problem solver with creative thinking expertise',
    'content': 'strategic content planner with analytical skills',
    'other': 'expert problem solver'
  };

  const approachesMap: Record<string, string> = {
    'very-clear': '3',
    'clear': '3',
    'somewhat-clear': '4',
    'unclear': '5'
  };

  const criteriaMap: Record<string, string[]> = {
    'analytical': ['Accuracy/Correctness', 'Logic/Reasoning', 'Completeness/Thoroughness'],
    'decision': ['Feasibility/Practicality', 'Cost/Resource Impact', 'Risk/Safety'],
    'creative': ['Innovation/Creativity', 'Originality/Uniqueness', 'Feasibility/Practicality'],
    'content': ['Clarity/Coherence', 'Engagement/Interest', 'Quality/Excellence'],
    'other': ['Accuracy/Correctness', 'Feasibility/Practicality', 'Completeness/Thoroughness']
  };

  return {
    role: roleMap[answers.problem_type] || roleMap['other'],
    approaches: approachesMap[answers.clarity] || '3',
    criteria: criteriaMap[answers.problem_type] || criteriaMap['other']
  };
}

function generateCoTData(answers: any): PrepopulateDataResult {
  const roleMap: Record<string, string> = {
    'analytical': 'systematic analyst focused on logical problem-solving',
    'decision': 'decision analyst with expertise in structured thinking',
    'creative': 'logical thinker who approaches creative problems systematically',
    'content': 'structured content strategist',
    'other': 'logical thinker'
  };

  return {
    role: roleMap[answers.problem_type] || roleMap['other']
  };
}

function generateSelfConsistencyData(answers: any): PrepopulateDataResult {
  const roleMap: Record<string, string> = {
    'analytical': 'analytical expert generating multiple solution paths',
    'decision': 'decision analyst creating independent reasoning approaches',
    'creative': 'creative problem solver exploring diverse perspectives',
    'content': 'content strategist examining multiple approaches',
    'other': 'analytical reasoner'
  };

  const versionsMap: Record<string, string> = {
    'very-clear': '3',
    'clear': '3',
    'somewhat-clear': '4',
    'unclear': '5'
  };

  return {
    role: roleMap[answers.problem_type] || roleMap['other'],
    versions: versionsMap[answers.clarity] || '3'
  };
}

function generateRoleData(answers: any): PrepopulateDataResult {
  const roleMap: Record<string, string> = {
    'analytical': 'professional analyst with expertise in clear communication',
    'decision': 'strategic consultant specializing in decision frameworks',
    'creative': 'creative professional with expertise in innovative thinking',
    'content': 'professional content creator and strategist',
    'other': 'expert professional'
  };

  const toneMap: Record<string, string> = {
    'highly-creative': 'Innovative and engaging, uses vivid language, thinks outside conventional boundaries',
    'creative': 'Professional yet creative, balances analytical rigor with innovative thinking',
    'somewhat-creative': 'Clear and professional, incorporates creative elements when appropriate',
    'not-creative': 'Clear, direct, and professional with focus on accuracy and practicality'
  };

  return {
    role: roleMap[answers.problem_type] || roleMap['other'],
    tone: toneMap[answers.creativity] || toneMap['somewhat-creative']
  };
}

function generateReflectionData(answers: any): PrepopulateDataResult {
  const roleMap: Record<string, string> = {
    'analytical': 'critical analyst specializing in rigorous evaluation and improvement',
    'decision': 'strategic reviewer with expertise in decision quality assessment',
    'creative': 'creative director focused on iterative improvement and excellence',
    'content': 'editorial expert specializing in content refinement and quality',
    'other': 'critical reviewer'
  };

  const criteriaMap: Record<string, string> = {
    'analytical': 'Accuracy of analysis, clarity of reasoning, completeness of coverage, logical consistency',
    'decision': 'Thoroughness of options considered, quality of evaluation criteria, clarity of reasoning, practical feasibility',
    'creative': 'Originality and creativity, clarity and coherence, audience engagement, practical feasibility',
    'content': 'Clarity and flow, engagement and interest, accuracy and relevance, professional quality',
    'other': 'Clarity and coherence, accuracy and completeness, logical consistency, practical value'
  };

  return {
    role: roleMap[answers.problem_type] || roleMap['other'],
    criteria: criteriaMap[answers.problem_type] || criteriaMap['other']
  };
}

/**
 * Get framework name for display
 */
export function getFrameworkName(frameworkId: string): string {
  return FRAMEWORK_NAMES[frameworkId] || frameworkId;
}

/**
 * Get framework explanation
 */
export function getFrameworkExplanation(frameworkId: string): string {
  return FRAMEWORK_EXPLANATIONS[frameworkId] || 'A specialized prompting framework for your specific needs.';
}

/**
 * Get reasons why a framework was chosen based on scoring context
 */
export function getFrameworkSelectionReasons(frameworkId: string, answers: any): string[] {
  const frameworkReasons = FRAMEWORK_SELECTION_REASONS[frameworkId];
  if (!frameworkReasons) return [];

  const reasons: string[] = [];
  
  // Determine which reasons apply based on answers
  switch (frameworkId) {
    case 'tot':
      if (answers.problem_type === 'analytical' || answers.problem_type === 'decision') {
        reasons.push(...(frameworkReasons.high_complexity || []));
      }
      if (answers.problem_type === 'decision') {
        reasons.push(...(frameworkReasons.decision_type || []));
      }
      if (answers.experience === 'expert' || answers.experience === 'experienced') {
        reasons.push(...(frameworkReasons.experienced_user || []));
      }
      break;
      
    case 'cot':
      if (answers.problem_type === 'analytical') {
        reasons.push(...(frameworkReasons.analytical_problem || []));
      }
      if (answers.experience === 'beginner') {
        reasons.push(...(frameworkReasons.beginner_friendly || []));
      }
      if (reasons.length === 0) {
        reasons.push(...(frameworkReasons.general_purpose || []));
      }
      break;
      
    case 'self-consistency':
      if (answers.clarity === 'unclear' || answers.clarity === 'somewhat-clear') {
        reasons.push(...(frameworkReasons.unclear_problem || []));
      }
      if (answers.problem_type === 'decision') {
        reasons.push(...(frameworkReasons.high_stakes || []));
      }
      if (answers.problem_type === 'analytical') {
        reasons.push(...(frameworkReasons.complex_decision || []));
      }
      break;
      
    case 'role':
      if (answers.creativity === 'highly-creative' || answers.creativity === 'creative') {
        reasons.push(...(frameworkReasons.creative_task || []));
      }
      if (answers.output_type === 'creative' || answers.output_type === 'content') {
        reasons.push(...(frameworkReasons.content_creation || []));
      }
      if (reasons.length === 0) {
        reasons.push(...(frameworkReasons.style_specific || []));
      }
      break;
      
    case 'reflection':
      if (answers.creativity === 'creative' || answers.creativity === 'highly-creative') {
        reasons.push(...(frameworkReasons.creative_content || []));
      }
      if (answers.experience === 'expert' || answers.experience === 'experienced') {
        reasons.push(...(frameworkReasons.experienced_user || []));
      }
      if (reasons.length === 0) {
        reasons.push(...(frameworkReasons.quality_focus || []));
      }
      break;
  }
  
  // Return first 2-3 most relevant reasons
  return reasons.slice(0, 3);
}