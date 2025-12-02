import { Framework, DEFAULT_EVALUATION_CRITERIA } from './types';
import { validateAndGenerate } from './prompt-generators';

export const frameworks: Framework[] = [
  {
    id: 'tot',
    name: 'Tree-of-Thought (ToT)',
    description: 'Explore multiple reasoning paths and evaluate approaches to find the best solution.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., expert problem solver', required: true, defaultValue: 'expert problem solver' },
      { name: 'objective', label: 'Objective', type: 'textarea', placeholder: 'What problem needs to be solved?', required: true },
      { name: 'approaches', label: 'Number of Approaches', type: 'number', placeholder: '3', required: true, defaultValue: '3' },
      { name: 'criteria', label: 'Evaluation Criteria', type: 'multi-select-criteria', placeholder: 'Select or add criteria', required: true, options: [...DEFAULT_EVALUATION_CRITERIA], defaultValue: ['Accuracy/Correctness', 'Feasibility/Practicality', 'Completeness/Thoroughness', 'Clarity/Coherence'] },
    ],
    examples: {
      general: {
        role: 'decision-making expert specializing in life transitions',
        objective: 'I received a job offer paying $95k in Austin, TX (cost of living index: 119) versus staying in my current role in Cleveland, OH (cost of living index: 84) with a promotion to $85k. I have aging parents 2 hours from Cleveland and a partner who works remotely.',
        approaches: '3',
        criteria: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Risk/Safety', 'Completeness/Thoroughness'],
      },
      business: {
        role: 'strategic business analyst with expertise in market expansion',
        objective: 'Our SaaS company ($12M ARR, 45% growth) can invest $2M in expansion. Option A: Enter Southeast Asian market (200M potential users, 15 competitors). Option B: Double down on North American enterprise segment (50M users, 8 major competitors, 25% market penetration).',
        approaches: '3',
        criteria: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Risk/Safety', 'Innovation/Creativity'],
      },
    },
  },
  {
    id: 'self-consistency',
    name: 'Self-Consistency',
    description: 'Generate multiple reasoning paths and select the most consistent answer.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., analytical reasoner', required: true, defaultValue: 'analytical reasoner' },
      { name: 'goal', label: 'Goal', type: 'textarea', placeholder: 'What question needs to be answered?', required: true },
      { name: 'versions', label: 'Number of Versions', type: 'number', placeholder: '3', required: true, defaultValue: '3' },
    ],
    examples: {
      general: {
        role: 'certified financial planner analyzing debt vs. investment strategies',
        goal: 'I have $30,000 in student loans at 5.5% interest and $500/month available. Should I: (A) Pay loans aggressively and finish in 3 years, or (B) Pay minimum ($250/month) and invest remaining $250/month in index funds, assuming 7% average annual return?',
        versions: '5',
      },
      business: {
        role: 'VP of Finance evaluating resource allocation strategies',
        goal: 'We have a $1.2M Q4 surplus. Option A: Increase marketing budget by 40% (current CAC: $450, LTV: $2,100, targeting 30% CAC reduction). Option B: Hire 3 senior engineers ($400k total) to accelerate our AI features roadmap by 6 months, potentially capturing emerging market segment.',
        versions: '5',
      },
    },
  },
  {
    id: 'cot',
    name: 'Chain-of-Thought (CoT)',
    description: 'Break down complex problems into step-by-step reasoning.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., logical thinker', required: true, defaultValue: 'logical thinker' },
      { name: 'problem', label: 'Problem', type: 'textarea', placeholder: 'Describe the problem to solve', required: true },
      { name: 'context', label: 'Context', type: 'textarea', placeholder: 'Any relevant background information', required: false, optional: true },
    ],
    examples: {
      general: {
        role: 'optimization specialist focused on scheduling and priorities',
        problem: 'Calculate the optimal schedule: I have exactly 8 hours on Saturday (9am-5pm). Tasks: (A) Presentation prep: 3-4 hours, cannot be interrupted, (B) Gym: 1 hour, must be before 2pm when partner needs car, (C) Grocery shopping: 1 hour, store open until 8pm, (D) Family time: minimum 3 hours, ideally continuous block.',
        context: 'Presentation is due Monday 9am and is 40% complete. Family time is non-negotiable priority. I work best on cognitive tasks in morning hours. Grocery store is 15 minutes away.',
      },
      business: {
        role: 'agile project manager solving resource allocation problems',
        problem: 'Sprint capacity: 40 developer-hours. Developer A: backend expert (Java/SQL). Developer B: full-stack (React/Node/SQL). Tasks: (1) User auth system: 15hrs (8hrs backend, 7hrs frontend), (2) Database query optimization: 12hrs (backend only), (3) Critical bugs: 8hrs (4hrs backend, 4hrs frontend), (4) API documentation: 10hrs (either developer). Calculate optimal task assignment.',
        context: 'Auth system blocks QA team starting Wednesday. Database issues affect 300 enterprise customers (P0 severity). Bug fixes needed for release. Documentation can slip to next sprint if needed. Developer A is 30% faster on backend tasks.',
      },
    },
  },
  {
    id: 'role',
    name: 'Few-Shot / Role Prompting',
    description: 'Provide examples and define a specific role for the AI to embody.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., professional copywriter', required: true, defaultValue: 'professional copywriter' },
      { name: 'tone', label: 'Tone Sample', type: 'textarea', placeholder: 'Example of desired tone/style', required: true },
      { name: 'task', label: 'Task', type: 'textarea', placeholder: 'What should be produced?', required: true },
      { name: 'examples', label: 'Examples', type: 'textarea', placeholder: 'Provide 2-3 examples', required: false, optional: true },
    ],
    examples: {
      general: {
        role: 'award-winning children\'s book author specializing in ages 5-7',
        tone: 'Whimsical and engaging, uses short sentences (5-10 words), includes repetition and rhythm, speaks directly to young readers, builds anticipation',
        task: 'Write the opening paragraph (3-4 sentences) for a story where a shy child discovers their goldfish can grant wishes, but only silly ones',
        examples: 'Input: "story about a magic backpack"\nOutput: "Emma\'s backpack was old. Very, very old. But one Tuesday, something strange happened. The backpack began to glow!"\n\nInput: "story about a boy who can talk to clouds"\nOutput: "Tommy looked up. Way, way up. The clouds were talking! And they were talking to him!"',
      },
      business: {
        role: 'senior corporate communications manager with expertise in change management',
        tone: 'Professional yet warm, uses active voice, starts with benefits, acknowledges concerns proactively, ends with clear next steps',
        task: 'Draft an email (200-250 words) to all employees announcing a transition to hybrid work model (3 days office, 2 days remote) starting next quarter',
        examples: 'Input: "We are implementing a new expense reporting system"\nOutput: "Starting March 1st, submitting expenses will be faster and simpler. Our new system lets you photograph receipts from your phone and get approval within 48 hours instead of 2 weeks. I know change can be frustrating, so we\'re offering live training sessions every Tuesday in February..."\n\nInput: "Annual performance review cycle is changing"\nOutput: "You asked for more frequent feedback, and we listened. Beginning in Q2, we\'re moving from annual reviews to quarterly check-ins. This means more opportunities to discuss your growth, adjust goals in real-time, and celebrate wins throughout the year..."',
      },
    },
  },
  {
    id: 'reflection',
    name: 'Reflection / Revision',
    description: 'Generate an initial response, then critically evaluate and improve it.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., critical editor', required: true, defaultValue: 'critical editor' },
      { name: 'task', label: 'Task', type: 'textarea', placeholder: 'What needs to be created?', required: true },
      { name: 'criteria', label: 'Revision Criteria', type: 'textarea', placeholder: 'What should be improved?', required: true },
    ],
    examples: {
      general: {
        role: 'professional speech writer specializing in wedding toasts',
        task: 'Write a 3-4 minute best man speech for my brother Jake\'s wedding. Include: our childhood as skateboarding buddies, how he met Sarah through my college roommate, his terrible cooking that improved for her.',
        criteria: '(1) Opening hook grabs attention in first 15 seconds, (2) Humor is self-deprecating or situational, never at couple\'s expense, (3) Include exactly 2 specific anecdotes with sensory details, (4) Transition smoothly from funny to heartfelt, (5) Toast is original and references couple\'s shared values, (6) Overall length: 400-500 words when spoken',
      },
      business: {
        role: 'executive communications consultant for Fortune 500 companies',
        task: 'Write a 15-minute keynote for our SaaS company\'s annual conference announcing a pivot from horizontal platform to industry-specific solutions. Audience: 200 employees, investors, and key customers.',
        criteria: '(1) Opening establishes credibility with market data (cite 2-3 specific metrics), (2) Explains "why now" with competitive landscape analysis, (3) Presents 5-year roadmap with clear phases and success metrics, (4) Addresses obvious concerns (current customer impact, resource requirements), (5) Includes concrete example of one vertical solution, (6) Closes with inspirational vision tied to company mission, (7) Tone balances ambition with realism',
      },
    },
  },
];

export function getFrameworkById(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

export function generatePrompt(frameworkId: string, data: Record<string, string | string[]>): string {
  return validateAndGenerate(frameworkId, data);
}
