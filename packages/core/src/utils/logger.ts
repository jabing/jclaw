/**
 * Structured Logger
 *
 * Provides structured logging with module prefixes, log levels, and metadata support
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  includeTimestamp?: boolean;
  includeModule?: boolean;
}

/**
 * Default log level - can be overridden by environment variable
 */
const DEFAULT_LEVEL: LogLevel =
  (process.env.JCLAW_LOG_LEVEL as LogLevel) || 'info';

/**
 * Log level priorities for filtering
 */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Create a structured logger instance
 */
export function createLogger(
  module: string,
  options: LoggerOptions = {}
): Logger {
  const {
    level = DEFAULT_LEVEL,
    prefix = 'jclaw',
    includeTimestamp = true,
    includeModule = true,
  } = options;

  const levelPriority = LEVEL_PRIORITY[level];

  function formatEntry(
    logLevel: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): string {
    const parts: string[] = [];

    // Add timestamp
    if (includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    // Add prefix
    parts.push(`[${prefix}]`);

    // Add module
    if (includeModule) {
      parts.push(`[${module}]`);
    }

    // Add level
    parts.push(`[${logLevel.toUpperCase()}]`);

    // Add message
    parts.push(message);

    // Add metadata if present
    if (meta && Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }

    return parts.join(' ');
  }

  function log(
    logLevel: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    // Check if this log level should be output
    if (LEVEL_PRIORITY[logLevel] < levelPriority) {
      return;
    }

    const formattedMessage = formatEntry(logLevel, message, meta);

    // Output to appropriate console method
    switch (logLevel) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  return {
    debug: (message: string, meta?: Record<string, unknown>) =>
      log('debug', message, meta),
    info: (message: string, meta?: Record<string, unknown>) =>
      log('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) =>
      log('warn', message, meta),
    error: (message: string, meta?: Record<string, unknown>) =>
      log('error', message, meta),
  };
}

/**
 * Default logger for general use
 */
export const defaultLogger = createLogger('core');

/**
 * Parse log level from string
 */
export function parseLogLevel(level: string): LogLevel {
  const normalized = level.toLowerCase() as LogLevel;
  if (['debug', 'info', 'warn', 'error'].includes(normalized)) {
    return normalized;
  }
  return 'info';
}

/**
 * Set global log level
 */
export function setLogLevel(level: LogLevel): void {
  // This would need to be used with a logger registry to affect all loggers
  // For now, use environment variable: JCLAW_LOG_LEVEL
  console.info(`[jclaw] Log level set to: ${level}`);
}
