/**
 * Message Router
 *
 * Routes incoming WhatsApp messages to appropriate handlers based on rules.
 * Supports string matching, regex matching, function matching, and priority-based routing.
 */

import type { WhatsAppMessage } from './adapter.js';

/**
 * Pattern types supported by the router
 */
export type PatternType =
  | string
  | RegExp
  | ((message: WhatsAppMessage) => boolean);

/**
 * Route rule with pattern, handler, and optional priority
 */
export interface RouteRule {
  /** Pattern to match: string, RegExp, or function */
  pattern: PatternType;
  /** Handler function to call when pattern matches */
  handler: (message: WhatsAppMessage) => Promise<void>;
  /** Priority (higher = first), default: 0 */
  priority?: number;
}

/**
 * Router configuration options
 */
export interface RouterOptions {
  /** Default handler for unmatched messages */
  defaultHandler?: (message: WhatsAppMessage) => Promise<void>;
}

/**
 * Internal rule storage with priority
 */
interface InternalRule {
  pattern: PatternType;
  handler: (message: WhatsAppMessage) => Promise<void>;
  priority: number;
}

/**
 * MessageRouter - Routes WhatsApp messages to handlers based on configurable rules.
 *
 * @example
 * ```typescript
 * const router = new MessageRouter();
 *
 * // String pattern matching
 * router.addRule({
 *   pattern: '@jclaw',
 *   handler: async (msg) => console.log('JClaw mentioned:', msg.content),
 * });
 *
 * // Regex pattern matching
 * router.addRule({
 *   pattern: /\d+/,
 *   handler: async (msg) => console.log('Number detected'),
 * });
 *
 * // Function pattern matching
 * router.addRule({
 *   pattern: (msg) => msg.content.length > 100,
 *   handler: async (msg) => console.log('Long message'),
 *   priority: 10, // Higher priority = checked first
 * });
 *
 * // With default handler
 * const router = new MessageRouter({
 *   defaultHandler: async (msg) => console.log('Unknown message'),
 * });
 *
 * // Route a message
 * await router.route(message);
 * ```
 */
export class MessageRouter {
  private rules: InternalRule[] = [];
  private defaultHandler?: (message: WhatsAppMessage) => Promise<void>;

  /**
   * Creates a new MessageRouter instance.
   * @param options - Router configuration options
   */
  constructor(options: RouterOptions = {}) {
    this.defaultHandler = options.defaultHandler;
  }

  /**
   * Adds a routing rule with pattern matching and optional priority.
   *
   * @param rule - The route rule to add
   *
   * @example
   * ```typescript
   * // String pattern - checks if message content includes the string
   * router.addRule({
   *   pattern: 'hello',
   *   handler: async (msg) => console.log('Hello found'),
   * });
   *
   * // Regex pattern - tests against message content
   * router.addRule({
   *   pattern: /@\w+/,
   *   handler: async (msg) => console.log('Mention found'),
   * });
   *
   * // Function pattern - custom matching logic
   * router.addRule({
   *   pattern: (msg) => msg.from.includes('admin'),
   *   handler: async (msg) => console.log('Admin message'),
   *   priority: 100, // High priority
   * });
   * ```
   */
  addRule(rule: RouteRule): void {
    const internalRule: InternalRule = {
      pattern: rule.pattern,
      handler: rule.handler,
      priority: rule.priority ?? 0,
    };

    this.rules.push(internalRule);
    this.sortRulesByPriority();
  }

  /**
   * Routes a WhatsApp message to the first matching handler.
   * Rules are checked in priority order (highest first).
   *
   * @param message - The WhatsApp message to route
   * @returns Promise<boolean> - True if a handler was found and executed, false otherwise
   *
   * @example
   * ```typescript
   * const message: WhatsAppMessage = {
   *   id: '123',
   *   from: 'user@s.whatsapp.net',
   *   content: 'Hello @jclaw',
   *   timestamp: Date.now(),
   * };
   *
   * const handled = await router.route(message);
   * console.log('Message handled:', handled);
   * ```
   */
  async route(message: WhatsAppMessage): Promise<boolean> {
    for (const rule of this.rules) {
      if (this.matchesPattern(message, rule.pattern)) {
        await rule.handler(message);
        return true;
      }
    }

    if (this.defaultHandler) {
      await this.defaultHandler(message);
      return true;
    }

    return false;
  }

  /**
   * Removes a routing rule by its pattern.
   * Compares patterns by string representation for strings/regex,
   * or by reference for functions.
   *
   * @param pattern - The pattern to remove
   * @returns boolean - True if a rule was removed, false otherwise
   */
  removeRule(pattern: PatternType): boolean {
    const index = this.rules.findIndex((rule) => {
      // For functions, compare by reference
      if (typeof pattern === 'function' && typeof rule.pattern === 'function') {
        return rule.pattern === pattern;
      }
      // For strings and regex, compare by string representation
      return rule.pattern.toString() === pattern.toString();
    });

    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Clears all routing rules.
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Returns the number of routing rules.
   */
  getRuleCount(): number {
    return this.rules.length;
  }

  /**
   * Returns a copy of all routing rules.
   */
  getRules(): InternalRule[] {
    return [...this.rules];
  }

  /**
   * Sets or updates the default handler for unmatched messages.
   *
   * @param handler - The default handler function
   */
  setDefaultHandler(
    handler: (message: WhatsAppMessage) => Promise<void>
  ): void {
    this.defaultHandler = handler;
  }

  /**
   * Removes the default handler.
   */
  removeDefaultHandler(): void {
    this.defaultHandler = undefined;
  }

  /**
   * Checks if a message matches a given pattern.
   *
   * @param message - The WhatsApp message
   * @param pattern - The pattern to match against
   * @returns boolean - True if the message matches the pattern
   *
   * @private
   */
  private matchesPattern(
    message: WhatsAppMessage,
    pattern: PatternType
  ): boolean {
    if (typeof pattern === 'string') {
      // String pattern: check if content includes the pattern
      return message.content.includes(pattern);
    }

    if (pattern instanceof RegExp) {
      // RegExp pattern: test against content
      return pattern.test(message.content);
    }

    if (typeof pattern === 'function') {
      // Function pattern: call with message, expect boolean return
      try {
        return pattern(message);
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Sorts rules by priority in descending order (highest priority first).
   *
   * @private
   */
  private sortRulesByPriority(): void {
    this.rules.sort((a, b) => b.priority - a.priority);
  }
}

export default MessageRouter;
