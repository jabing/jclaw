/**
 * MessageFormatter - Formats JClaw task results for WhatsApp
 *
 * Converts TaskResult into WhatsApp-friendly formatted messages
 * with support for text formatting, code blocks, and long message
 * segmentation.
 */

import type { TaskResult } from '@jclaw/core';

/**
 * Configuration options for MessageFormatter
 */
export interface MessageFormatterConfig {
  /** Maximum characters per WhatsApp message (default: 4096) */
  maxMessageLength?: number;
  /** Enable emoji indicators (default: true) */
  useEmoji?: boolean;
  /** Enable markdown-style formatting (default: true) */
  useMarkdown?: boolean;
  /** Number of characters to reserve for segmentation indicators */
  segmentReserve?: number;
}

/**
 * Formatted message segment
 */
export interface FormattedSegment {
  /** Segment index (0-based) */
  index: number;
  /** Total number of segments */
  total: number;
  /** Formatted content for this segment */
  content: string;
}

/**
 * MessageFormatter converts JClaw task results into WhatsApp-friendly format
 *
 * Features:
 * - Emoji indicators for success/failure
 * - Code block formatting
 * - List formatting (bullets)
 * - Duration formatting
 * - Long message segmentation
 * - Markdown support
 */
export class MessageFormatter {
  private maxMessageLength: number;
  private useEmoji: boolean;
  private useMarkdown: boolean;
  private segmentReserve: number;

  /**
   * Emoji constants for formatting
   */
  private readonly EMOJI = {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    CLOCK: '⏱️',
    TASK: '📝',
    CODE: '💻',
    BULLET: '•',
    ARROW: '→',
    SEPARATOR: '─',
  } as const;

  /**
   * Create a new MessageFormatter
   * @param config - Configuration options
   */
  constructor(config: MessageFormatterConfig = {}) {
    this.maxMessageLength = config.maxMessageLength ?? 4096;
    this.useEmoji = config.useEmoji ?? true;
    this.useMarkdown = config.useMarkdown ?? true;
    this.segmentReserve = config.segmentReserve ?? 50;
  }

  /**
   * Format a TaskResult into WhatsApp-friendly message(s)
   *
   * @param result - The task result to format
   * @returns Formatted message string or array of segments if message is long
   *
   * Example:
   * ```typescript
   * const result = {
   *   success: true,
   *   output: "Files:\n- file1.ts\n- file2.ts",
   *   duration: 1500
   * };
   * const formatted = formatter.format(result);
   * // Returns: "✅ *Task Complete*\n\nFiles:\n• file1.ts\n• file2.ts\n\n⏱️ 1.5s"
   * ```
   */
  format(result: TaskResult): string | FormattedSegment[] {
    const formatted = this.buildFormattedMessage(result);

    if (this.needsSegmentation(formatted)) {
      return this.segmentMessage(formatted);
    }

    return formatted;
  }

  /**
   * Format a TaskResult into a single string (always returns string)
   * Use this when you don't want segments
   *
   * @param result - The task result to format
   * @returns Formatted message string
   */
  formatToString(result: TaskResult): string {
    const formatted = this.buildFormattedMessage(result);
    return formatted;
  }

  /**
   * Build the formatted message content
   */
  private buildFormattedMessage(result: TaskResult): string {
    const lines: string[] = [];

    // Header with status
    lines.push(this.formatHeader(result));

    // Empty line after header
    lines.push('');

    // Main content
    if (result.success && result.output) {
      lines.push(this.formatOutput(result.output));
    } else if (!result.success && result.error) {
      lines.push(this.formatError(result.error));
    }

    // Empty line before footer
    lines.push('');

    // Footer with duration
    lines.push(this.formatDuration(result.duration));

    // Task ID (small, less prominent)
    if (result.taskId) {
      lines.push(this.formatTaskId(result.taskId));
    }

    return lines.join('\n');
  }

  /**
   * Format the message header with status indicator
   */
  private formatHeader(result: TaskResult): string {
    const emoji = result.success
      ? this.EMOJI.SUCCESS
      : this.EMOJI.ERROR;

    const status = result.success ? 'Task Complete' : 'Task Failed';

    if (this.useEmoji && this.useMarkdown) {
      return `${emoji} *${status}*`;
    } else if (this.useEmoji) {
      return `${emoji} ${status}`;
    } else if (this.useMarkdown) {
      return `*${status}*`;
    } else {
      return status;
    }
  }

  /**
   * Format the task output content
   */
  private formatOutput(output: string): string {
    let formatted = output;

    // Convert markdown lists to WhatsApp-friendly format
    formatted = this.formatLists(formatted);

    // Format code blocks
    formatted = this.formatCodeBlocks(formatted);

    // Format inline code
    formatted = this.formatInlineCode(formatted);

    // Format bold/italic
    formatted = this.formatTextStyles(formatted);

    return formatted;
  }

  /**
   * Format error message
   */
  private formatError(error: string): string {
    let formatted = error;

    if (this.useEmoji) {
      formatted = `${this.EMOJI.WARNING} ${formatted}`;
    }

    // Wrap error in code block if it's multi-line or technical
    if (formatted.includes('\n') || this.looksTechnical(formatted)) {
      formatted = this.wrapInCodeBlock(formatted, 'Error');
    }

    return formatted;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(durationMs: number): string {
    const emoji = this.useEmoji ? `${this.EMOJI.CLOCK} ` : '';

    if (durationMs < 1000) {
      return `${emoji}${durationMs}ms`;
    } else if (durationMs < 60000) {
      const seconds = (durationMs / 1000).toFixed(1);
      return `${emoji}${seconds}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = ((durationMs % 60000) / 1000).toFixed(0);
      return `${emoji}${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format task ID (small, less prominent)
   */
  private formatTaskId(taskId: string): string {
    // Truncate long task IDs
    const displayId = taskId.length > 20 ? `...${taskId.slice(-17)}` : taskId;
    return `_ID: ${displayId}_`;
  }

  /**
   * Convert markdown lists to WhatsApp-friendly bullets
   */
  private formatLists(text: string): string {
    // Replace "- " or "* " at line start with bullet
    return text
      .replace(/^[\s]*[-*][\s]/gm, `${this.EMOJI.BULLET} `)
      .replace(/^[\s]*\d+\.[\s]/gm, `${this.EMOJI.ARROW} `);
  }

  /**
   * Format code blocks for WhatsApp
   */
  private formatCodeBlocks(text: string): string {
    // WhatsApp uses triple backticks for code blocks
    // Just ensure proper formatting
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

    return text.replace(codeBlockRegex, (match, lang, code) => {
      const language = lang || '';
      const trimmedCode = code.trim();

      if (this.useEmoji) {
        return `${this.EMOJI.CODE} *${language || 'Code'}*\n\`\`\`\n${trimmedCode}\n\`\`\``;
      } else {
        return `\`\`\`\n${trimmedCode}\n\`\`\``;
      }
    });
  }

  /**
   * Wrap text in code block
   */
  private wrapInCodeBlock(text: string, label?: string): string {
    const prefix = label && this.useEmoji
      ? `${this.EMOJI.CODE} *${label}*\n`
      : '';

    return `${prefix}\`\`\`\n${text.trim()}\n\`\`\``;
  }

  /**
   * Format inline code
   */
  private formatInlineCode(text: string): string {
    // WhatsApp uses single backticks for inline code
    // Ensure proper spacing
    return text.replace(/`([^`]+)`/g, ' `$1` ');
  }

  /**
   * Format bold and italic text
   */
  private formatTextStyles(text: string): string {
    if (!this.useMarkdown) {
      return text;
    }

    // WhatsApp uses * for bold and _ for italic
    // Ensure we don't double-format
    return text;
  }

  /**
   * Check if text looks technical (contains code-like content)
   */
  private looksTechnical(text: string): boolean {
    const technicalPatterns = [
      /Error:/i,
      /Exception:/i,
      /\bat\s+\S+:\d+/,
      /\b\w+Error\b/,
      /\b\w+Exception\b/,
      /Stack trace/i,
      /\s+\.\.\/|\s+\.\//,
    ];

    return technicalPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check if message needs segmentation
   */
  private needsSegmentation(text: string): boolean {
    return text.length > this.maxMessageLength;
  }

  /**
   * Segment a long message into multiple parts
   */
  private segmentMessage(text: string): FormattedSegment[] {
    const effectiveLimit = this.maxMessageLength - this.segmentReserve;
    const segments: string[] = [];

    // Try to split at natural boundaries
    let remaining = text;
    while (remaining.length > effectiveLimit) {
      const splitPoint = this.findSplitPoint(remaining, effectiveLimit);
      segments.push(remaining.slice(0, splitPoint).trim());
      remaining = remaining.slice(splitPoint).trim();
    }

    // Add remaining content
    if (remaining.length > 0) {
      segments.push(remaining);
    }

    // Add segment indicators
    return segments.map((content, index) => ({
      index,
      total: segments.length,
      content: this.addSegmentIndicator(content, index + 1, segments.length),
    }));
  }

  /**
   * Find a good point to split the message
   */
  private findSplitPoint(text: string, limit: number): number {
    // Look for natural break points before the limit
    const searchStart = Math.max(0, limit - 500);
    const searchText = text.slice(searchStart, limit);

    // Priority: double newline > single newline > space > hard limit
    const breakPoints = [
      searchText.lastIndexOf('\n\n'),
      searchText.lastIndexOf('\n'),
      searchText.lastIndexOf(' '),
    ];

    for (const point of breakPoints) {
      if (point > 0) {
        return searchStart + point;
      }
    }

    // Hard limit if no natural break found
    return limit;
  }

  /**
   * Add segment indicator to message part
   */
  private addSegmentIndicator(content: string, current: number, total: number): string {
    if (total === 1) {
      return content;
    }

    const indicator = this.useEmoji
      ? `${this.EMOJI.INFO} Part ${current}/${total}\n${this.EMOJI.SEPARATOR.repeat(10)}\n\n`
      : `[Part ${current}/${total}]\n---\n\n`;

    return indicator + content;
  }

  /**
   * Format a simple text message (not a TaskResult)
   *
   * @param text - Text to format
   * @param options - Formatting options
   * @returns Formatted message
   */
  formatText(
    text: string,
    options: {
      bold?: boolean;
      italic?: boolean;
      code?: boolean;
      emoji?: string;
    } = {}
  ): string {
    let formatted = text;

    if (options.code) {
      formatted = `\`${formatted}\``;
    }

    if (options.bold && this.useMarkdown) {
      formatted = `*${formatted}*`;
    }

    if (options.italic && this.useMarkdown) {
      formatted = `_${formatted}_`;
    }

    if (options.emoji && this.useEmoji) {
      formatted = `${options.emoji} ${formatted}`;
    }

    return formatted;
  }

  /**
   * Create a formatted list from items
   *
   * @param items - List items
   * @param title - Optional list title
   * @returns Formatted list string
   */
  formatList(items: string[], title?: string): string {
    const lines: string[] = [];

    if (title) {
      lines.push(this.useMarkdown ? `*${title}*` : title);
      lines.push('');
    }

    const bullet = this.useEmoji ? this.EMOJI.BULLET : '-';
    items.forEach((item) => {
      lines.push(`${bullet} ${item}`);
    });

    return lines.join('\n');
  }

  /**
   * Format a code block
   *
   * @param code - Code content
   * @param language - Programming language (optional)
   * @returns Formatted code block
   */
  formatCodeBlock(code: string, language?: string): string {
    const lang = language || '';
    const prefix = this.useEmoji && lang
      ? `${this.EMOJI.CODE} *${lang}*\n`
      : '';

    return `${prefix}\`\`\`${lang}\n${code.trim()}\n\`\`\``;
  }

  /**
   * Format a success message
   *
   * @param message - Success message
   * @returns Formatted success message
   */
  formatSuccess(message: string): string {
    if (this.useEmoji) {
      return `${this.EMOJI.SUCCESS} ${message}`;
    }
    return message;
  }

  /**
   * Format an error message
   *
   * @param message - Error message
   * @returns Formatted error message
   */
  formatErrorMessage(message: string): string {
    if (this.useEmoji) {
      return `${this.EMOJI.ERROR} ${message}`;
    }
    return message;
  }

  /**
   * Format an info message
   *
   * @param message - Info message
   * @returns Formatted info message
   */
  formatInfo(message: string): string {
    if (this.useEmoji) {
      return `${this.EMOJI.INFO} ${message}`;
    }
    return message;
  }
}

/**
 * Create a MessageFormatter instance with default settings
 *
 * @param config - Optional configuration
 * @returns MessageFormatter instance
 */
export function createMessageFormatter(
  config?: MessageFormatterConfig
): MessageFormatter {
  return new MessageFormatter(config);
}

/**
 * Default formatter instance
 */
export const defaultFormatter = new MessageFormatter();

export default MessageFormatter;
