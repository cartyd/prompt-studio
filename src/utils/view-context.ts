import { FastifyRequest } from 'fastify';
import { AuthUser, SubscriptionInfo } from '../types';

/**
 * Base context that is common to all views
 */
export interface BaseViewContext {
  user?: AuthUser;
  subscription?: SubscriptionInfo;
}

/**
 * Helper to build view context with common fields
 * Eliminates repetitive pattern of passing user and subscription to every view
 */
export class ViewContextBuilder {
  /**
   * Create base context from request (user + subscription)
   */
  static base(request: FastifyRequest): BaseViewContext {
    return {
      user: request.user,
      subscription: request.subscription,
    };
  }

  /**
   * Create context with base fields plus additional data
   */
  static with<T extends Record<string, any>>(
    request: FastifyRequest,
    additionalData: T
  ): BaseViewContext & T {
    return {
      ...this.base(request),
      ...additionalData,
    };
  }

  /**
   * Create context with error message
   */
  static withError(
    request: FastifyRequest,
    error: string,
    additionalData?: Record<string, any>
  ): BaseViewContext & { error: string } {
    return {
      ...this.base(request),
      error,
      ...additionalData,
    };
  }

  /**
   * Create context with success message
   */
  static withSuccess(
    request: FastifyRequest,
    success: string,
    additionalData?: Record<string, any>
  ): BaseViewContext & { success: string } {
    return {
      ...this.base(request),
      success,
      ...additionalData,
    };
  }

  /**
   * Create context with both error and success (common in form pages)
   */
  static withMessages(
    request: FastifyRequest,
    messages: {
      error?: string | null;
      success?: string | null;
      passwordError?: string | null;
      passwordSuccess?: string | null;
    },
    additionalData?: Record<string, any>
  ): BaseViewContext & typeof messages {
    return {
      ...this.base(request),
      ...messages,
      ...additionalData,
    };
  }
}
