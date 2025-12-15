/**
 * Home page utility functions
 */

export interface User {
  id: string;
  email?: string;
  name?: string;
}

export interface GetStartedButton {
  href: string;
  text: string;
}

/**
 * Determines the appropriate CTA button based on user authentication status
 * @param user - User object (null/undefined for unauthenticated users)
 * @returns Object with href and text for the CTA button
 */
export function getStartedButtonLogic(user: User | null | undefined): GetStartedButton {
  return !user 
    ? { href: '/auth/register', text: 'Get Started' }
    : { href: '/frameworks', text: 'Explore Frameworks' };
}

/**
 * Feature card data for the home page
 */
export const HOME_FEATURES = [
  {
    icon: 'bx-trees',
    title: 'Multiple Frameworks',
    description: 'Choose from Tree-of-Thought, Chain-of-Thought, Self-Consistency, Role-Based, and Reflection prompting strategies.'
  },
  {
    icon: 'bx-edit',
    title: 'Guided Forms',
    description: 'Fill out simple forms tailored to each framework to generate professional, structured prompts.'
  },
  {
    icon: 'bx-book',
    title: 'Prompt Library',
    description: 'Save your prompts to a personal library for easy access and reuse.'
  },
  {
    icon: 'bx-bolt',
    title: 'Real-Time Preview',
    description: 'See your prompt generated in real-time as you fill out the form.'
  },
  {
    icon: 'bx-rocket',
    title: 'Premium Features',
    description: 'Upgrade for unlimited saved prompts and export capabilities.'
  },
  {
    icon: 'bx-lock',
    title: 'Secure & Private',
    description: 'Your prompts are private and secure, accessible only to you.'
  }
] as const;