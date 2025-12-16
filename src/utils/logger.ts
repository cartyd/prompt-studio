/**
 * Logger utility for standalone functions that don't have access to Fastify request context
 * Falls back to basic console logging in development, structured logging in production
 */

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error | unknown): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Create a structured logger for standalone utilities
 */
function createLogger(module: string): Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    info(message: string, ...args: unknown[]) {
      if (isTest) return; // Suppress logs in tests
      if (isProduction) {
        console.log(JSON.stringify({ level: 'info', module, message, args, timestamp: new Date().toISOString() }));
      } else {
        console.log(`[${module}] INFO: ${message}`, ...args);
      }
    },
    
    warn(message: string, ...args: unknown[]) {
      if (isTest) return;
      if (isProduction) {
        console.warn(JSON.stringify({ level: 'warn', module, message, args, timestamp: new Date().toISOString() }));
      } else {
        console.warn(`[${module}] WARN: ${message}`, ...args);
      }
    },
    
    error(message: string, error?: Error | unknown) {
      if (isTest) return;
      const errorDetails = error instanceof Error ? { 
        name: error.name, 
        message: error.message, 
        stack: error.stack 
      } : error;
      
      if (isProduction) {
        console.error(JSON.stringify({ level: 'error', module, message, error: errorDetails, timestamp: new Date().toISOString() }));
      } else {
        console.error(`[${module}] ERROR: ${message}`, errorDetails);
      }
    },
    
    debug(message: string, ...args: unknown[]) {
      if (isTest || isProduction) return; // Only show debug in development
      console.debug(`[${module}] DEBUG: ${message}`, ...args);
    }
  };
}

export const emailLogger = createLogger('email');
export const analyticsLogger = createLogger('analytics');
export const versionLogger = createLogger('version');