/**
 * Comprehensive Message Formatter Tests
 *
 * Tests all public methods, error scenarios, and edge cases for formatter.ts
 */

import {
  MessageFormatter,
  createMessageFormatter,
  defaultFormatter,
  type MessageFormatterConfig,
  type FormattedSegment,
} from '../src/formatter.js';
import type { TaskResult } from '@jclaw/core';

describe('MessageFormatter - Comprehensive', () => {
  let formatter: MessageFormatter;

  beforeEach(() => {
    formatter = new MessageFormatter();
  });

  describe('constructor', () => {
    it('should create formatter with default options', () => {
      const f = new MessageFormatter();
      expect(f).toBeDefined();
    });

    it('should accept custom maxMessageLength', () => {
      const f = new MessageFormatter({ maxMessageLength: 1000 });
      expect(f).toBeDefined();
    });

    it('should accept custom useEmoji', () => {
      const f = new MessageFormatter({ useEmoji: false });
      expect(f).toBeDefined();
    });

    it('should accept custom useMarkdown', () => {
      const f = new MessageFormatter({ useMarkdown: false });
      expect(f).toBeDefined();
    });

    it('should accept custom segmentReserve', () => {
      const f = new MessageFormatter({ segmentReserve: 100 });
      expect(f).toBeDefined();
    });

    it('should accept complete custom config', () => {
      const f = new MessageFormatter({
        maxMessageLength: 2000,
        useEmoji: false,
        useMarkdown: false,
        segmentReserve: 100,
      });
      expect(f).toBeDefined();
    });

    it('should use default values when config is empty', () => {
      const f = new MessageFormatter({});
      expect(f).toBeDefined();
    });
  });

  describe('format', () => {
    it('should format successful result', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Task completed successfully',
        duration: 1500,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('✅');
      expect(formatted).toContain('Task Complete');
      expect(formatted).toContain('Task completed successfully');
      expect(formatted).toContain('1.5s');
      expect(formatted).toContain('task_123');
    });

    it('should format failed result', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'Something went wrong',
        duration: 500,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('❌');
      expect(formatted).toContain('Task Failed');
      expect(formatted).toContain('Something went wrong');
    });

    it('should format result without output', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('✅');
      expect(formatted).toContain('Task Complete');
      expect(formatted).toContain('1.0s');
    });

    it('should format result without error', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('❌');
      expect(formatted).toContain('Task Failed');
    });

    it('should format result without taskId in output', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('✅');
      expect(formatted).toContain('Done');
      // Should contain task ID line
      expect(formatted).toContain('ID:');
    });
      const result: TaskResult = {
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('✅');
      expect(formatted).toContain('Done');
      // Should not contain task ID line
      expect(formatted).not.toContain('ID:');
    });

    it('should return string for short messages', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Short',
        duration: 1000,
      };

      const formatted = formatter.format(result);

      expect(typeof formatted).toBe('string');
    });

    it('should return segments for long messages', () => {
      const longFormatter = new MessageFormatter({ maxMessageLength: 100 });
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'a'.repeat(200),
        duration: 1000,
      };

      const formatted = longFormatter.format(result);

      expect(Array.isArray(formatted)).toBe(true);
      expect((formatted as FormattedSegment[]).length).toBeGreaterThan(1);
    });
  });

  describe('formatToString', () => {
    it('should always return string', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'a'.repeat(10000),
        duration: 1000,
      };

      const formatted = formatter.formatToString(result);

      expect(typeof formatted).toBe('string');
    });

    it('should not segment message', () => {
      const longFormatter = new MessageFormatter({ maxMessageLength: 100 });
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'a'.repeat(200),
        duration: 1000,
      };

      const formatted = longFormatter.formatToString(result);

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(100);
    });

    it('should format successful result', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = formatter.formatToString(result);

      expect(formatted).toContain('✅');
      expect(formatted).toContain('Done');
    });
  });

  describe('formatText', () => {
    it('should format text with default options', () => {
      const formatted = formatter.formatText('Hello');
      expect(formatted).toBe('Hello');
    });

    it('should format text with bold', () => {
      const formatted = formatter.formatText('Hello', { bold: true });
      expect(formatted).toBe('*Hello*');
    });

    it('should format text with italic', () => {
      const formatted = formatter.formatText('Hello', { italic: true });
      expect(formatted).toBe('_Hello_');
    });

    it('should format text with code', () => {
      const formatted = formatter.formatText('Hello', { code: true });
      expect(formatted).toBe('`Hello`');
    });

    it('should format text with emoji', () => {
      const formatted = formatter.formatText('Hello', { emoji: '🎉' });
      expect(formatted).toBe('🎉 Hello');
    });

    it('should format text with multiple options', () => {
      const formatted = formatter.formatText('Hello', {
        bold: true,
        italic: true,
        code: true,
      });
      expect(formatted).toBe('`*_Hello_*`');
    });

    it('should not apply bold when useMarkdown is false', () => {
      const noMarkdownFormatter = new MessageFormatter({ useMarkdown: false });
      const formatted = noMarkdownFormatter.formatText('Hello', { bold: true });
      expect(formatted).toBe('Hello');
    });

    it('should not apply italic when useMarkdown is false', () => {
      const noMarkdownFormatter = new MessageFormatter({ useMarkdown: false });
      const formatted = noMarkdownFormatter.formatText('Hello', {
        italic: true,
      });
      expect(formatted).toBe('Hello');
    });

    it('should apply emoji even when useMarkdown is false', () => {
      const noMarkdownFormatter = new MessageFormatter({ useMarkdown: false });
      const formatted = noMarkdownFormatter.formatText('Hello', {
        emoji: '👋',
      });
      expect(formatted).toBe('👋 Hello');
    });

    it('should not apply emoji when useEmoji is false', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const formatted = noEmojiFormatter.formatText('Hello', { emoji: '👋' });
      expect(formatted).toBe('Hello');
    });
  });

  describe('formatList', () => {
    it('should format list of items', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const formatted = formatter.formatList(items);

      expect(formatted).toContain('• Item 1');
      expect(formatted).toContain('• Item 2');
      expect(formatted).toContain('• Item 3');
    });

    it('should format list with title', () => {
      const items = ['Item 1', 'Item 2'];
      const formatted = formatter.formatList(items, 'My List');

      expect(formatted).toContain('*My List*');
      expect(formatted).toContain('• Item 1');
    });

    it('should handle empty list', () => {
      const formatted = formatter.formatList([]);
      expect(formatted).toBe('');
    });

    it('should handle single item', () => {
      const formatted = formatter.formatList(['Only Item']);
      expect(formatted).toBe('• Only Item');
    });

    it('should use dash when emoji disabled', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const formatted = noEmojiFormatter.formatList(['Item 1']);

      expect(formatted).toBe('- Item 1');
    });

    it('should not use markdown when disabled', () => {
      const noMarkdownFormatter = new MessageFormatter({ useMarkdown: false });
      const formatted = noMarkdownFormatter.formatList(['Item 1'], 'Title');

      expect(formatted).toContain('Title');
      expect(formatted).not.toContain('*Title*');
    });
  });

  describe('formatCodeBlock', () => {
    it('should format code block', () => {
      const code = 'const x = 1;';
      const formatted = formatter.formatCodeBlock(code);

      expect(formatted).toContain('```');
      expect(formatted).toContain('const x = 1;');
    });

    it('should format code block with language', () => {
      const code = 'const x = 1;';
      const formatted = formatter.formatCodeBlock(code, 'typescript');

      expect(formatted).toContain('```typescript');
      expect(formatted).toContain('💻');
      expect(formatted).toContain('*typescript*');
    });

    it('should trim code', () => {
      const code = '  const x = 1;  \n\n';
      const formatted = formatter.formatCodeBlock(code);

      expect(formatted).toContain('const x = 1;');
    });

    it('should not add emoji when disabled', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const formatted = noEmojiFormatter.formatCodeBlock('code', 'js');

      expect(formatted).not.toContain('💻');
    });
  });

  describe('formatSuccess', () => {
    it('should format success message', () => {
      const formatted = formatter.formatSuccess('Operation completed');

      expect(formatted).toContain('✅');
      expect(formatted).toContain('Operation completed');
    });

    it('should format without emoji when disabled', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const formatted = noEmojiFormatter.formatSuccess('Operation completed');

      expect(formatted).toBe('Operation completed');
      expect(formatted).not.toContain('✅');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error message', () => {
      const formatted = formatter.formatErrorMessage('Something went wrong');

      expect(formatted).toContain('❌');
      expect(formatted).toContain('Something went wrong');
    });

    it('should format without emoji when disabled', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const formatted = noEmojiFormatter.formatErrorMessage('Error');

      expect(formatted).toBe('Error');
      expect(formatted).not.toContain('❌');
    });
  });

  describe('formatInfo', () => {
    it('should format info message', () => {
      const formatted = formatter.formatInfo('Information');

      expect(formatted).toContain('ℹ️');
      expect(formatted).toContain('Information');
    });

    it('should format without emoji when disabled', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const formatted = noEmojiFormatter.formatInfo('Information');

      expect(formatted).toBe('Information');
      expect(formatted).not.toContain('ℹ️');
    });
  });

  describe('format without emoji', () => {
    it('should format success without emoji', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = noEmojiFormatter.format(result) as string;

      expect(formatted).not.toContain('✅');
      expect(formatted).toContain('Task Complete');
    });

    it('should format error without emoji', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'Failed',
        duration: 1000,
      };

      const formatted = noEmojiFormatter.format(result) as string;

      expect(formatted).not.toContain('❌');
      expect(formatted).toContain('Task Failed');
    });

    it('should format duration without emoji', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = noEmojiFormatter.format(result) as string;

      expect(formatted).not.toContain('⏱️');
      expect(formatted).toContain('1.0s');
    });
  });

  describe('format without markdown', () => {
    it('should format without markdown', () => {
      const noMarkdownFormatter = new MessageFormatter({ useMarkdown: false });
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = noMarkdownFormatter.format(result) as string;

      expect(formatted).not.toContain('*Task Complete*');
      expect(formatted).toContain('Task Complete');
    });
  });

  describe('format without emoji and markdown', () => {
    it('should format plain text', () => {
      const plainFormatter = new MessageFormatter({
        useEmoji: false,
        useMarkdown: false,
      });
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = plainFormatter.format(result) as string;

      expect(formatted).toContain('Task Complete');
      expect(formatted).not.toContain('✅');
      expect(formatted).not.toContain('*');
    });
  });

  describe('duration formatting', () => {
    it('should format milliseconds', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 500,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('500ms');
    });

    it('should format seconds', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 5500,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('5.5s');
    });

    it('should format minutes and seconds', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 125000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('2m');
      expect(formatted).toContain('5s');
    });

    it('should format exactly 1 minute', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 60000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('1m');
    });

    it('should format exactly 1 second', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('1.0s');
    });
  });

  describe('task ID formatting', () => {
    it('should truncate long task IDs', () => {
      const longId = 'task_' + 'a'.repeat(50);
      const result: TaskResult = {
        taskId: longId,
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('...');
      expect(formatted.length).toBeLessThan(longId.length + 100);
    });

    it('should show full short task IDs', () => {
      const result: TaskResult = {
        taskId: 'task_123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('task_123');
    });

    it('should format task ID with markdown', () => {
      const result: TaskResult = {
        taskId: 'task_123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('_ID:');
    });
  });

  describe('list formatting', () => {
    it('should convert markdown lists', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '- Item 1\n- Item 2\n- Item 3',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('• Item 1');
      expect(formatted).toContain('• Item 2');
      expect(formatted).toContain('• Item 3');
    });

    it('should convert asterisk lists', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '* Item 1\n* Item 2',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('• Item 1');
      expect(formatted).toContain('• Item 2');
    });

    it('should convert numbered lists', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '1. First\n2. Second\n3. Third',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('→ First');
      expect(formatted).toContain('→ Second');
      expect(formatted).toContain('→ Third');
    });
  });

  describe('code block formatting', () => {
    it('should format code blocks with language', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '```typescript\nconst x = 1;\n```',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('💻');
      expect(formatted).toContain('*typescript*');
    });

    it('should format code blocks without language', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '```\nsome code\n```',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('💻');
      expect(formatted).toContain('*Code*');
    });

    it('should handle inline code', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Use `console.log()` for debugging',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('`console.log()`');
    });
  });

  describe('error formatting', () => {
    it('should format simple error', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'Simple error',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('Simple error');
    });

    it('should wrap multi-line errors in code block', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'Error on line 1\nError on line 2',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('```');
    });

    it('should detect technical errors', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'ReferenceError: x is not defined at app.js:10',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('```');
    });

    it('should detect stack traces', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'Stack trace: at function ./file.ts',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('```');
    });

    it('should detect error patterns', () => {
      const patterns = [
        'TypeError: Cannot read property',
        'SyntaxError: Unexpected token',
        'RangeError: Maximum call stack',
        'Error: Something went wrong',
        'Exception: Critical failure',
      ];

      patterns.forEach((errorMsg) => {
        const result: TaskResult = {
          taskId: 'task-123',
          success: false,
          error: errorMsg,
          duration: 1000,
        };

        const formatted = formatter.format(result) as string;
        expect(formatted).toContain('```');
      });
    });

    it('should format without emoji when disabled', () => {
      const noEmojiFormatter = new MessageFormatter({ useEmoji: false });
      const result: TaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'Error message',
        duration: 1000,
      };

      const formatted = noEmojiFormatter.format(result) as string;

      expect(formatted).not.toContain('⚠️');
    });
  });

  describe('message segmentation', () => {
    it('should segment long messages', () => {
      const shortFormatter = new MessageFormatter({
        maxMessageLength: 100,
        segmentReserve: 10,
      });

      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'a'.repeat(300),
        duration: 1000,
      };

      const segments = shortFormatter.format(result) as FormattedSegment[];

      expect(segments.length).toBeGreaterThan(1);
      expect(segments[0].index).toBe(0);
      expect(segments[0].total).toBe(segments.length);
    });

    it('should add segment indicators', () => {
      const shortFormatter = new MessageFormatter({
        maxMessageLength: 100,
        segmentReserve: 10,
      });

      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'a'.repeat(300),
        duration: 1000,
      };

      const segments = shortFormatter.format(result) as FormattedSegment[];

      segments.forEach((segment, index) => {
        expect(segment.content).toContain(
          `Part ${index + 1}/${segments.length}`
        );
      });
    });

    it('should not add indicator for single segment', () => {
      const formatted = formatter.formatToString({
        taskId: 'task-123',
        success: true,
        output: 'Short message',
        duration: 1000,
      });

      expect(formatted).not.toContain('Part 1/1');
    });

    it('should split at natural boundaries', () => {
      const shortFormatter = new MessageFormatter({
        maxMessageLength: 100,
        segmentReserve: 10,
      });

      const content =
        'First paragraph\n\nSecond paragraph\n\nThird paragraph that is quite long';
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: content,
        duration: 1000,
      };

      const segments = shortFormatter.format(result) as FormattedSegment[];

      // Should split at paragraph boundaries
      expect(segments.length).toBeGreaterThan(1);
    });

    it('should handle hard limit when no natural boundary', () => {
      const shortFormatter = new MessageFormatter({
        maxMessageLength: 100,
        segmentReserve: 10,
      });

      const content = 'a'.repeat(500); // No natural boundaries
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: content,
        duration: 1000,
      };

      const segments = shortFormatter.format(result) as FormattedSegment[];

      expect(segments.length).toBeGreaterThan(1);
      segments.forEach((segment) => {
        expect(segment.content.length).toBeLessThanOrEqual(100);
      });
    });

    it('should use text-only segment indicator when emoji disabled', () => {
      const noEmojiFormatter = new MessageFormatter({
        maxMessageLength: 100,
        segmentReserve: 10,
        useEmoji: false,
      });

      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'a'.repeat(300),
        duration: 1000,
      };

      const segments = noEmojiFormatter.format(result) as FormattedSegment[];

      expect(segments[0].content).toContain('[Part');
      expect(segments[0].content).not.toContain('ℹ️');
    });
  });

  describe('createMessageFormatter factory', () => {
    it('should create formatter with default config', () => {
      const f = createMessageFormatter();
      expect(f).toBeInstanceOf(MessageFormatter);
    });

    it('should create formatter with custom config', () => {
      const f = createMessageFormatter({ useEmoji: false });
      expect(f).toBeInstanceOf(MessageFormatter);
    });
  });

  describe('defaultFormatter', () => {
    it('should be defined', () => {
      expect(defaultFormatter).toBeDefined();
      expect(defaultFormatter).toBeInstanceOf(MessageFormatter);
    });

    it('should format with default settings', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      const formatted = defaultFormatter.format(result) as string;

      expect(formatted).toContain('✅');
      expect(formatted).toContain('Done');
    });
  });

  describe('type exports', () => {
    it('should have correct MessageFormatterConfig interface', () => {
      const config: MessageFormatterConfig = {
        maxMessageLength: 4096,
        useEmoji: true,
        useMarkdown: true,
        segmentReserve: 50,
      };

      expect(config.maxMessageLength).toBe(4096);
      expect(config.useEmoji).toBe(true);
    });

    it('should have correct FormattedSegment interface', () => {
      const segment: FormattedSegment = {
        index: 0,
        total: 3,
        content: 'Segment content',
      };

      expect(segment.index).toBe(0);
      expect(segment.total).toBe(3);
      expect(segment.content).toBe('Segment content');
    });
  });

  describe('edge cases', () => {
    it('should handle empty output', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('✅');
      expect(formatted).toContain('1.0s');
    });

    it('should handle undefined output', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('✅');
    });

    it('should handle zero duration', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 0,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('0ms');
    });

    it('should handle very long duration', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 3600000, // 1 hour
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('60m');
    });

    it('should handle unicode in output', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '🎉 Celebration 🎊 Party 🥳',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('🎉');
      expect(formatted).toContain('🎊');
      expect(formatted).toContain('🥳');
    });

    it('should handle code with special characters', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '```\nconst regex = /[.*+?^${}()|[\]\\]/g;\n```',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('```');
    });

    it('should handle nested code blocks', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output:
          '```javascript\nfunction test() {\n  return "```nested```";\n}\n```',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('javascript');
    });

    it('should handle list with mixed formats', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '- First\n* Second\n1. Third\n- Fourth',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('• First');
      expect(formatted).toContain('• Second');
      expect(formatted).toContain('→ Third');
      expect(formatted).toContain('• Fourth');
    });

    it('should handle output with backticks', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Use `npm install` to install packages',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('`npm install`');
    });

    it('should handle multiline output', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Line 1\nLine 2\n\nLine 3',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('Line 1');
      expect(formatted).toContain('Line 2');
      expect(formatted).toContain('Line 3');
    });

    it('should handle output with only whitespace', () => {
      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: '   \n\t\n   ',
        duration: 1000,
      };

      const formatted = formatter.format(result) as string;

      expect(formatted).toContain('✅');
    });

    it('should handle very short max message length', () => {
      const tinyFormatter = new MessageFormatter({
        maxMessageLength: 50,
        segmentReserve: 10,
      });

      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Short',
        duration: 1000,
      };

      const formatted = tinyFormatter.format(result);

      // Will definitely be segmented
      expect(Array.isArray(formatted)).toBe(true);
    });

    it('should handle segmentReserve larger than maxMessageLength gracefully', () => {
      const weirdFormatter = new MessageFormatter({
        maxMessageLength: 100,
        segmentReserve: 150,
      });

      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'a'.repeat(200),
        duration: 1000,
      };

      // Should not throw
      expect(() => weirdFormatter.format(result)).not.toThrow();
    });
  });
});
