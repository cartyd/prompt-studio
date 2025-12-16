/**
 * Framework example builders to eliminate data clumps and repetitive structures
 */

export interface ExampleData {
  general: Record<string, string | string[]>;
  business: Record<string, string | string[]>;
}

/**
 * Base interface for role-based examples
 */
interface BaseRoleExample {
  role: string;
}

/**
 * Specialized example types
 */
interface DecisionExample extends BaseRoleExample {
  objective: string;
  approaches: string;
  criteria: string[];
}

interface AnalysisExample extends BaseRoleExample {
  goal: string;
  versions: string;
}

interface ProblemExample extends BaseRoleExample {
  problem: string;
  context?: string;
}

interface CommunicationExample extends BaseRoleExample {
  task: string;
  tone: string;
  examples?: string;
}

interface ReflectionExample extends BaseRoleExample {
  task: string;
  criteria: string;
}

/**
 * Example builder functions to eliminate repetitive data structures
 */
export class ExampleBuilder {
  /**
   * Build Tree-of-Thought examples
   */
  static buildTotExamples(
    generalExample: DecisionExample,
    businessExample: DecisionExample
  ): ExampleData {
    return {
      general: {
        role: generalExample.role,
        objective: generalExample.objective,
        approaches: generalExample.approaches,
        criteria: generalExample.criteria,
      },
      business: {
        role: businessExample.role,
        objective: businessExample.objective,
        approaches: businessExample.approaches,
        criteria: businessExample.criteria,
      },
    };
  }

  /**
   * Build Self-Consistency examples
   */
  static buildSelfConsistencyExamples(
    generalExample: AnalysisExample,
    businessExample: AnalysisExample
  ): ExampleData {
    return {
      general: {
        role: generalExample.role,
        goal: generalExample.goal,
        versions: generalExample.versions,
      },
      business: {
        role: businessExample.role,
        goal: businessExample.goal,
        versions: businessExample.versions,
      },
    };
  }

  /**
   * Build Chain-of-Thought examples
   */
  static buildCotExamples(
    generalExample: ProblemExample,
    businessExample: ProblemExample
  ): ExampleData {
    return {
      general: {
        role: generalExample.role,
        problem: generalExample.problem,
        ...(generalExample.context && { context: generalExample.context }),
      },
      business: {
        role: businessExample.role,
        problem: businessExample.problem,
        ...(businessExample.context && { context: businessExample.context }),
      },
    };
  }

  /**
   * Build Role Prompting examples
   */
  static buildRoleExamples(
    generalExample: CommunicationExample,
    businessExample: CommunicationExample
  ): ExampleData {
    return {
      general: {
        role: generalExample.role,
        tone: generalExample.tone,
        task: generalExample.task,
        ...(generalExample.examples && { examples: generalExample.examples }),
      },
      business: {
        role: businessExample.role,
        tone: businessExample.tone,
        task: businessExample.task,
        ...(businessExample.examples && { examples: businessExample.examples }),
      },
    };
  }

  /**
   * Build Reflection examples
   */
  static buildReflectionExamples(
    generalExample: ReflectionExample,
    businessExample: ReflectionExample
  ): ExampleData {
    return {
      general: {
        role: generalExample.role,
        task: generalExample.task,
        criteria: generalExample.criteria,
      },
      business: {
        role: businessExample.role,
        task: businessExample.task,
        criteria: businessExample.criteria,
      },
    };
  }
}