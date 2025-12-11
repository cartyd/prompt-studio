import { WizardAnswer } from '../src/types';

// Current weights from existing questions.ts
const currentQuestions = [
  {
    id: 'q1',
    options: {
      'explore-ideas': { tot: 5, cot: 2, 'self-consistency': 2 },
      'break-down-problem': { cot: 5, tot: 1 },
      'improve-draft': { reflection: 5, 'self-consistency': 1 },
      'match-style': { role: 5, 'self-consistency': 1 },
      'best-version': { 'self-consistency': 5, tot: 2 },
    },
  },
  {
    id: 'q2',
    options: {
      'very-complex': { tot: 4, cot: 2 },
      'needs-analysis': { cot: 4, tot: 1 },
      refinement: { reflection: 4, 'self-consistency': 2 },
      straightforward: { 'self-consistency': 3, role: 3, cot: 1 },
    },
  },
  {
    id: 'q3',
    options: {
      accuracy: { cot: 3, tot: 2, 'self-consistency': 2 },
      creativity: { tot: 4, 'self-consistency': 2 },
      'tone-style': { role: 4, 'self-consistency': 3, reflection: 2 },
      clarity: { cot: 4, reflection: 2 },
      polish: { reflection: 3, 'self-consistency': 3, tot: 1 },
    },
  },
  {
    id: 'q4',
    options: {
      'have-examples': { role: 5, 'self-consistency': 1 },
      'have-draft': { reflection: 5 },
      'starting-fresh': { tot: 2, cot: 2, 'self-consistency': 2 },
    },
  },
];

// Proposed weights with refinements
const proposedQuestions = [
  {
    id: 'q1',
    options: {
      'explore-ideas': { tot: 5, cot: 1, 'self-consistency': 1 },
      'break-down-problem': { cot: 5, tot: 1 },
      'improve-draft': { reflection: 5 },
      'match-style': { role: 5 },
      'best-version': { 'self-consistency': 5, tot: 1 },
    },
  },
  {
    id: 'q2',
    options: {
      'multiple-approaches': { tot: 5, 'self-consistency': 1 },
      'logical-steps': { cot: 5 },
      'iterative-refinement': { reflection: 5, 'self-consistency': 1 },
      'follow-examples': { role: 5 },
      'generate-synthesize': { 'self-consistency': 5, tot: 1 },
    },
  },
  {
    id: 'q3',
    options: {
      accuracy: { cot: 4, tot: 2, 'self-consistency': 1 },
      creativity: { tot: 5, 'self-consistency': 1 },
      'tone-style': { role: 5, 'self-consistency': 1 },
      clarity: { cot: 5, reflection: 1 },
      polish: { reflection: 4, 'self-consistency': 3 },
    },
  },
  {
    id: 'q4',
    options: {
      'have-examples': { role: 5 },
      'have-draft': { reflection: 4, 'self-consistency': 1 },
      'clear-problem': { cot: 4, tot: 1 },
      'open-exploration': { tot: 4, 'self-consistency': 1 },
      'need-synthesis': { 'self-consistency': 4, reflection: 1 },
    },
  },
];

function calculateScore(
  answers: { questionId: string; optionId: string }[],
  questions: any[]
): { framework: string; confidence: number; scores: Record<string, number> } {
  const scores: Record<string, number> = {
    tot: 0,
    cot: 0,
    'self-consistency': 0,
    role: 0,
    reflection: 0,
  };

  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) return;

    const weights = question.options[answer.optionId];
    if (!weights) return;

    Object.entries(weights).forEach(([framework, weight]) => {
      scores[framework] = (scores[framework] || 0) + (weight as number);
    });
  });

  const sortedFrameworks = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  const [topFramework, topScore] = sortedFrameworks[0];
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = Math.round((topScore / totalScore) * 100);

  return { framework: topFramework, confidence, scores };
}

// Test scenarios covering various user journeys
const testScenarios = [
  {
    name: 'Brainstorming complex decision',
    current: [
      { questionId: 'q1', optionId: 'explore-ideas' },
      { questionId: 'q2', optionId: 'very-complex' },
      { questionId: 'q3', optionId: 'creativity' },
      { questionId: 'q4', optionId: 'starting-fresh' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'explore-ideas' },
      { questionId: 'q2', optionId: 'multiple-approaches' },
      { questionId: 'q3', optionId: 'creativity' },
      { questionId: 'q4', optionId: 'open-exploration' },
    ],
  },
  {
    name: 'Step-by-step problem solving',
    current: [
      { questionId: 'q1', optionId: 'break-down-problem' },
      { questionId: 'q2', optionId: 'needs-analysis' },
      { questionId: 'q3', optionId: 'accuracy' },
      { questionId: 'q4', optionId: 'starting-fresh' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'break-down-problem' },
      { questionId: 'q2', optionId: 'logical-steps' },
      { questionId: 'q3', optionId: 'accuracy' },
      { questionId: 'q4', optionId: 'clear-problem' },
    ],
  },
  {
    name: 'Improving existing draft',
    current: [
      { questionId: 'q1', optionId: 'improve-draft' },
      { questionId: 'q2', optionId: 'refinement' },
      { questionId: 'q3', optionId: 'polish' },
      { questionId: 'q4', optionId: 'have-draft' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'improve-draft' },
      { questionId: 'q2', optionId: 'iterative-refinement' },
      { questionId: 'q3', optionId: 'polish' },
      { questionId: 'q4', optionId: 'have-draft' },
    ],
  },
  {
    name: 'Style-consistent output with examples',
    current: [
      { questionId: 'q1', optionId: 'match-style' },
      { questionId: 'q2', optionId: 'straightforward' },
      { questionId: 'q3', optionId: 'tone-style' },
      { questionId: 'q4', optionId: 'have-examples' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'match-style' },
      { questionId: 'q2', optionId: 'follow-examples' },
      { questionId: 'q3', optionId: 'tone-style' },
      { questionId: 'q4', optionId: 'have-examples' },
    ],
  },
  {
    name: 'Best quality synthesis',
    current: [
      { questionId: 'q1', optionId: 'best-version' },
      { questionId: 'q2', optionId: 'straightforward' },
      { questionId: 'q3', optionId: 'polish' },
      { questionId: 'q4', optionId: 'starting-fresh' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'best-version' },
      { questionId: 'q2', optionId: 'generate-synthesize' },
      { questionId: 'q3', optionId: 'polish' },
      { questionId: 'q4', optionId: 'need-synthesis' },
    ],
  },
  {
    name: 'Mixed signals: explore ideas but straightforward',
    current: [
      { questionId: 'q1', optionId: 'explore-ideas' },
      { questionId: 'q2', optionId: 'straightforward' },
      { questionId: 'q3', optionId: 'accuracy' },
      { questionId: 'q4', optionId: 'starting-fresh' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'explore-ideas' },
      { questionId: 'q2', optionId: 'generate-synthesize' },
      { questionId: 'q3', optionId: 'accuracy' },
      { questionId: 'q4', optionId: 'open-exploration' },
    ],
  },
  {
    name: 'Mixed signals: break down but have examples',
    current: [
      { questionId: 'q1', optionId: 'break-down-problem' },
      { questionId: 'q2', optionId: 'needs-analysis' },
      { questionId: 'q3', optionId: 'tone-style' },
      { questionId: 'q4', optionId: 'have-examples' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'break-down-problem' },
      { questionId: 'q2', optionId: 'logical-steps' },
      { questionId: 'q3', optionId: 'tone-style' },
      { questionId: 'q4', optionId: 'have-examples' },
    ],
  },
  {
    name: 'Unclear goals: best version but complex',
    current: [
      { questionId: 'q1', optionId: 'best-version' },
      { questionId: 'q2', optionId: 'very-complex' },
      { questionId: 'q3', optionId: 'creativity' },
      { questionId: 'q4', optionId: 'starting-fresh' },
    ],
    proposed: [
      { questionId: 'q1', optionId: 'best-version' },
      { questionId: 'q2', optionId: 'multiple-approaches' },
      { questionId: 'q3', optionId: 'creativity' },
      { questionId: 'q4', optionId: 'open-exploration' },
    ],
  },
];

console.log('='.repeat(80));
console.log('WIZARD CONFIDENCE COMPARISON: CURRENT vs PROPOSED');
console.log('='.repeat(80));
console.log();

let currentBelow50 = 0;
let proposedBelow50 = 0;
let currentTotal = 0;
let proposedTotal = 0;

testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log('-'.repeat(80));

  const currentResult = calculateScore(scenario.current, currentQuestions);
  const proposedResult = calculateScore(scenario.proposed, proposedQuestions);

  console.log(`CURRENT:  ${currentResult.framework.padEnd(20)} ${currentResult.confidence}%`);
  console.log(`          ${JSON.stringify(currentResult.scores)}`);
  console.log(
    `PROPOSED: ${proposedResult.framework.padEnd(20)} ${proposedResult.confidence}%`
  );
  console.log(`          ${JSON.stringify(proposedResult.scores)}`);

  const improvement = proposedResult.confidence - currentResult.confidence;
  const arrow = improvement > 0 ? '↑' : improvement < 0 ? '↓' : '→';
  console.log(
    `CHANGE:   ${arrow} ${improvement > 0 ? '+' : ''}${improvement} percentage points`
  );

  if (currentResult.confidence < 50) currentBelow50++;
  if (proposedResult.confidence < 50) proposedBelow50++;
  currentTotal += currentResult.confidence;
  proposedTotal += proposedResult.confidence;

  console.log();
});

console.log('='.repeat(80));
console.log('SUMMARY STATISTICS');
console.log('='.repeat(80));
console.log(`Scenarios below 50% confidence:`);
console.log(`  Current:  ${currentBelow50}/${testScenarios.length}`);
console.log(`  Proposed: ${proposedBelow50}/${testScenarios.length}`);
console.log();
console.log(`Average confidence:`);
console.log(`  Current:  ${Math.round(currentTotal / testScenarios.length)}%`);
console.log(`  Proposed: ${Math.round(proposedTotal / testScenarios.length)}%`);
console.log();
console.log(
  `Overall improvement: ${Math.round((proposedTotal - currentTotal) / testScenarios.length)} percentage points`
);
console.log('='.repeat(80));
