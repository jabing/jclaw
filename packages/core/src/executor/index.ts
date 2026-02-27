/**
 * Executor Module
 *
 * Re-exports executor interfaces and implementations.
 *
 * @module @jclaw/core/executor
 */

// Interface
export type { Executor, ExecuteOptions, ExecuteResult } from './interface.js';

// Implementations
export { LocalExecutor, createLocalExecutor } from './local.js';
