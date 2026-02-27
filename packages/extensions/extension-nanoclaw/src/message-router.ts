/**
 * Message Router
 *
 * Routes incoming messages to appropriate handlers based on rules.
 */

import type { Message } from './adapter.js';

export interface RouteRule {
  pattern: string | RegExp;
  handler: (message: Message) => Promise<void>;
}

export interface RouterOptions {
  defaultHandler?: (message: Message) => Promise<void>;
}

/**
 * 消息路由器 - 处理消息分发
 */
export class MessageRouter {
  private rules: RouteRule[] = [];
  private defaultHandler?: (message: Message) => Promise<void>;

  constructor(options: RouterOptions = {}) {
    this.defaultHandler = options.defaultHandler;
  }

  /**
   * 添加路由规则
   */
  addRule(rule: RouteRule): void {
    this.rules.push(rule);
  }

  /**
   * 移除路由规则
   */
  removeRule(pattern: string | RegExp): boolean {
    const index = this.rules.findIndex(
      (r) => r.pattern.toString() === pattern.toString()
    );
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 路由消息到对应的处理器
   */
  async route(message: Message): Promise<boolean> {
    for (const rule of this.rules) {
      const pattern = rule.pattern;
      const content = message.content;

      const matches =
        typeof pattern === 'string'
          ? content.includes(pattern)
          : pattern.test(content);

      if (matches) {
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
   * 清除所有路由规则
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * 获取当前规则数量
   */
  getRuleCount(): number {
    return this.rules.length;
  }
}
