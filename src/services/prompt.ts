import { PrismaClient, Prompt } from '@prisma/client';

/**
 * Processed prompt with display fields
 */
export interface ProcessedPrompt extends Prompt {
  truncatedText: string;
  canExport: boolean;
  displayDate: Date;
}

/**
 * Service for prompt-related business operations
 * Handles prompt processing, formatting, and export generation
 */
export class PromptService {
  private static readonly TRUNCATE_LENGTH = 200;

  /**
   * Process prompts for display in the UI
   * Adds truncated text and permission flags
   */
  static processForDisplay(prompts: Prompt[], isPremium: boolean): ProcessedPrompt[] {
    return prompts.map(prompt => ({
      ...prompt,
      truncatedText: this.truncateText(prompt.finalPromptText),
      canExport: isPremium,
      displayDate: prompt.createdAt
    }));
  }

  /**
   * Truncate prompt text for preview
   */
  private static truncateText(text: string | null): string {
    if (!text) return '';
    
    if (text.length > this.TRUNCATE_LENGTH) {
      return text.substring(0, this.TRUNCATE_LENGTH) + '...';
    }
    
    return text;
  }

  /**
   * Generate export content for a prompt
   * Creates a formatted text file with metadata
   */
  static generateExportContent(prompt: Prompt): string {
    return `# ${prompt.title}

Framework: ${prompt.frameworkType}
Created: ${prompt.createdAt.toISOString()}

---

${prompt.finalPromptText}`;
  }

  /**
   * Check if user has reached their prompt limit
   */
  static async hasReachedLimit(
    prisma: PrismaClient,
    userId: string,
    limit: number,
    isPremium: boolean
  ): Promise<boolean> {
    // Premium users have no limit
    if (isPremium) {
      return false;
    }

    const count = await prisma.prompt.count({
      where: { userId },
    });

    return count >= limit;
  }

  /**
   * Get user's prompt by ID with ownership verification
   */
  static async getUserPrompt(
    prisma: PrismaClient,
    promptId: string,
    userId: string
  ): Promise<Prompt | null> {
    return await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId: userId,
      },
    });
  }
}
