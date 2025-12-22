import { FILE_CONSTANTS } from '../constants';

const DEFAULT_FILENAME = 'prompt';

/**
 * Service for filename operations
 * Handles sanitization and validation of filenames
 */
export class FilenameService {
  /**
   * Sanitize a title string to create a safe filename
   * - Replaces non-alphanumeric characters with underscores
   * - Removes leading/trailing underscores
   * - Collapses multiple underscores
   * - Truncates to filesystem limits
   * 
   * @param title - The title to sanitize
   * @returns A safe filename without extension
   */
  static sanitize(title: string): string {
    // Replace non-alphanumeric characters with underscores
    let sanitized = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Remove leading/trailing underscores
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    
    // Replace multiple consecutive underscores with a single one
    sanitized = sanitized.replace(/_+/g, '_');
    
    // If empty after sanitization, use default
    if (sanitized.length === 0) {
      sanitized = DEFAULT_FILENAME;
    }
    
    // Truncate if too long (reserve space for extension)
    const maxBaseLength = FILE_CONSTANTS.MAX_FILENAME_LENGTH - FILE_CONSTANTS.FILENAME_EXTENSION_LENGTH;
    if (sanitized.length > maxBaseLength) {
      sanitized = sanitized.substring(0, maxBaseLength);
      // Remove trailing underscore if truncation created one
      sanitized = sanitized.replace(/_+$/, '');
    }
    
    return sanitized;
  }

  /**
   * Create a full filename with extension
   * @param title - The title to sanitize
   * @param extension - File extension (with or without dot)
   * @returns Sanitized filename with extension
   */
  static createFilename(title: string, extension: string): string {
    const sanitized = this.sanitize(title);
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return `${sanitized}${ext}`;
  }
}
