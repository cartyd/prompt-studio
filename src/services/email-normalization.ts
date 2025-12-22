/**
 * Service for email-related operations
 * Handles email normalization and validation
 */
export class EmailNormalizationService {
  /**
   * Normalize email for consistent storage and lookups
   * - Trims whitespace
   * - Converts to lowercase
   * 
   * @param email - The email to normalize
   * @returns Normalized email string
   */
  static normalize(email: string | undefined | null): string {
    if (!email) {
      return '';
    }
    
    return email.trim().toLowerCase();
  }

  /**
   * Check if an email string is empty or whitespace-only
   */
  static isEmpty(email: string | undefined | null): boolean {
    return !email || email.trim().length === 0;
  }
}
