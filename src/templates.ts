import { Template } from './types';

// Tree-of-Thought Templates
export const totTemplates: Template[] = [
  {
    id: 'tot-career-decision',
    name: 'Career Decision',
    description: 'Evaluate job offers or career moves',
    category: 'personal',
    fields: {
      role: 'career counselor with 15 years experience',
      objective: 'Compare two career opportunities and recommend the best path',
      approaches: '3',
      criteria: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Risk/Safety', 'Completeness/Thoroughness'],
    },
  },
  {
    id: 'tot-business-strategy',
    name: 'Business Strategy',
    description: 'Strategic business decisions and market expansion',
    category: 'business',
    fields: {
      role: 'strategic business analyst',
      objective: 'Evaluate strategic options for business growth or market entry',
      approaches: '3',
      criteria: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Innovation/Creativity', 'Risk/Safety'],
    },
  },
  {
    id: 'tot-technical-architecture',
    name: 'Technical Architecture',
    description: 'Evaluate technical solutions or system designs',
    category: 'technical',
    fields: {
      role: 'senior software architect',
      objective: 'Compare technical approaches for a system design decision',
      approaches: '3',
      criteria: ['Efficiency/Performance', 'Feasibility/Practicality', 'Completeness/Thoroughness', 'Risk/Safety'],
    },
  },
  {
    id: 'tot-product-feature',
    name: 'Product Feature Decision',
    description: 'Prioritize and evaluate product features',
    category: 'business',
    fields: {
      role: 'product manager',
      objective: 'Evaluate which product features to build next',
      approaches: '3',
      criteria: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Innovation/Creativity', 'Efficiency/Performance'],
    },
  },
];

// Self-Consistency Templates
export const selfConsistencyTemplates: Template[] = [
  {
    id: 'sc-financial-planning',
    name: 'Financial Planning',
    description: 'Investment and financial decisions',
    category: 'personal',
    fields: {
      role: 'certified financial planner',
      goal: 'Determine the best financial strategy for a specific situation',
      versions: '3',
    },
  },
  {
    id: 'sc-pricing-strategy',
    name: 'Pricing Strategy',
    description: 'Determine optimal pricing',
    category: 'business',
    fields: {
      role: 'pricing strategist',
      goal: 'Calculate optimal pricing strategy for a product or service',
      versions: '3',
    },
  },
  {
    id: 'sc-resource-allocation',
    name: 'Resource Allocation',
    description: 'Budget and resource distribution',
    category: 'business',
    fields: {
      role: 'operations manager',
      goal: 'Determine optimal allocation of budget or resources',
      versions: '3',
    },
  },
  {
    id: 'sc-data-analysis',
    name: 'Data Analysis',
    description: 'Analyze data and draw conclusions',
    category: 'technical',
    fields: {
      role: 'data analyst',
      goal: 'Analyze data and provide evidence-based recommendations',
      versions: '3',
    },
  },
];

// Chain-of-Thought Templates
export const cotTemplates: Template[] = [
  {
    id: 'cot-scheduling',
    name: 'Schedule Optimization',
    description: 'Complex scheduling and time management',
    category: 'personal',
    fields: {
      role: 'time management expert',
      problem: 'Create an optimal schedule with multiple constraints',
    },
  },
  {
    id: 'cot-task-assignment',
    name: 'Task Assignment',
    description: 'Assign tasks to team members',
    category: 'business',
    fields: {
      role: 'project manager',
      problem: 'Assign project tasks to team members based on skills and capacity',
    },
  },
  {
    id: 'cot-debugging',
    name: 'Debugging Problem',
    description: 'Debug code or technical issues',
    category: 'technical',
    fields: {
      role: 'senior software engineer',
      problem: 'Debug and resolve a technical issue step by step',
    },
  },
  {
    id: 'cot-math-problem',
    name: 'Math Problem Solving',
    description: 'Solve complex mathematical problems',
    category: 'technical',
    fields: {
      role: 'mathematics tutor',
      problem: 'Solve a mathematical problem with detailed steps',
    },
  },
];

// Role Prompting Templates
export const roleTemplates: Template[] = [
  {
    id: 'role-copywriting',
    name: 'Marketing Copy',
    description: 'Write marketing and sales copy',
    category: 'business',
    fields: {
      role: 'senior copywriter specializing in conversion',
      tone: 'Persuasive, benefit-focused, uses power words, creates urgency',
      task: 'Write compelling marketing copy',
    },
  },
  {
    id: 'role-creative-writing',
    name: 'Creative Writing',
    description: 'Write stories, poems, or creative content',
    category: 'creative',
    fields: {
      role: 'award-winning author',
      tone: 'Engaging, vivid imagery, emotional depth, strong voice',
      task: 'Write creative content with compelling narrative',
    },
  },
  {
    id: 'role-technical-docs',
    name: 'Technical Documentation',
    description: 'Write technical documentation',
    category: 'technical',
    fields: {
      role: 'technical writer',
      tone: 'Clear, concise, uses examples, structured with headings',
      task: 'Write technical documentation',
    },
  },
  {
    id: 'role-email-communication',
    name: 'Professional Email',
    description: 'Write professional business emails',
    category: 'business',
    fields: {
      role: 'corporate communications specialist',
      tone: 'Professional, warm, action-oriented, clear subject lines',
      task: 'Write a professional email',
    },
  },
];

// Reflection Templates
export const reflectionTemplates: Template[] = [
  {
    id: 'reflection-presentation',
    name: 'Presentation',
    description: 'Create and refine presentations',
    category: 'business',
    fields: {
      role: 'presentation coach',
      task: 'Create a compelling presentation',
      criteria: 'Clear structure, strong opening, data-driven, memorable conclusion',
    },
  },
  {
    id: 'reflection-essay',
    name: 'Essay Writing',
    description: 'Write and improve essays',
    category: 'personal',
    fields: {
      role: 'writing tutor',
      task: 'Write an essay',
      criteria: 'Clear thesis, logical flow, strong evidence, proper citations',
    },
  },
  {
    id: 'reflection-code-review',
    name: 'Code Review',
    description: 'Review and improve code',
    category: 'technical',
    fields: {
      role: 'senior code reviewer',
      task: 'Review code for quality and improvements',
      criteria: 'Readability, performance, security, maintainability, test coverage',
    },
  },
  {
    id: 'reflection-proposal',
    name: 'Business Proposal',
    description: 'Create business proposals',
    category: 'business',
    fields: {
      role: 'business development consultant',
      task: 'Write a business proposal',
      criteria: 'Clear value proposition, addresses objections, includes ROI, strong call-to-action',
    },
  },
];
