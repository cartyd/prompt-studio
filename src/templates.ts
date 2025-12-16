import { Template } from './types';
import { 
  createTotTemplate, 
  createSelfConsistencyTemplate,
  COMMON_ROLES,
  COMMON_CRITERIA
} from './utils/template-factory';

// Tree-of-Thought Templates
export const totTemplates: Template[] = [
  createTotTemplate({
    id: 'tot-career-decision',
    name: 'Career Decision',
    description: 'Evaluate job offers or career moves',
    category: 'personal',
    role: COMMON_ROLES.CAREER_COUNSELOR,
    objective: 'Compare two career opportunities and recommend the best path',
    criteria: COMMON_CRITERIA.TOT_PERSONAL,
  }),
  createTotTemplate({
    id: 'tot-business-strategy',
    name: 'Business Strategy',
    description: 'Strategic business decisions and market expansion',
    category: 'business',
    role: COMMON_ROLES.BUSINESS_ANALYST,
    objective: 'Evaluate strategic options for business growth or market entry',
    criteria: COMMON_CRITERIA.TOT_BUSINESS,
  }),
  createTotTemplate({
    id: 'tot-technical-architecture',
    name: 'Technical Architecture',
    description: 'Evaluate technical solutions or system designs',
    category: 'technical',
    role: COMMON_ROLES.SOFTWARE_ARCHITECT,
    objective: 'Compare technical approaches for a system design decision',
    criteria: COMMON_CRITERIA.TOT_TECHNICAL,
  }),
  createTotTemplate({
    id: 'tot-product-feature',
    name: 'Product Feature Decision',
    description: 'Prioritize and evaluate product features',
    category: 'business',
    role: COMMON_ROLES.PRODUCT_MANAGER,
    objective: 'Evaluate which product features to build next',
    criteria: COMMON_CRITERIA.TOT_PRODUCT,
  }),
];

// Self-Consistency Templates
export const selfConsistencyTemplates: Template[] = [
  createSelfConsistencyTemplate({
    id: 'sc-financial-planning',
    name: 'Financial Planning',
    description: 'Investment and financial decisions',
    category: 'personal',
    role: COMMON_ROLES.FINANCIAL_PLANNER,
    goal: 'Determine the best financial strategy for a specific situation',
  }),
  createSelfConsistencyTemplate({
    id: 'sc-pricing-strategy',
    name: 'Pricing Strategy',
    description: 'Determine optimal pricing',
    category: 'business',
    role: COMMON_ROLES.PRICING_STRATEGIST,
    goal: 'Calculate optimal pricing strategy for a product or service',
  }),
  createSelfConsistencyTemplate({
    id: 'sc-resource-allocation',
    name: 'Resource Allocation',
    description: 'Budget and resource distribution',
    category: 'business',
    role: COMMON_ROLES.OPERATIONS_MANAGER,
    goal: 'Determine optimal allocation of budget or resources',
  }),
  createSelfConsistencyTemplate({
    id: 'sc-data-analysis',
    name: 'Data Analysis',
    description: 'Analyze data and draw conclusions',
    category: 'technical',
    role: COMMON_ROLES.DATA_ANALYST,
    goal: 'Analyze data and provide evidence-based recommendations',
  }),
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
