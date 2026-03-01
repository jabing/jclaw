/**
 * Sandbox Validator
 *
 * Validates mutations in an isolated environment.
 *
 * @module @jclaw/core/evolution/sandbox
 */

import type { Executor } from '../types.js';
import type { Mutation, ValidationResult } from './types.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

/**
 * Configuration for sandbox validator
 */
export interface SandboxConfig {
  /** Command executor */
  executor: Executor;
  /** Validation timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Temporary directory for sandbox (default: os.tmpdir()) */
  tempDir?: string;
  /** Test command to run for validation */
  testCommand?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Default test command template
 */
const DEFAULT_TEST_COMMAND = 'npm test -- --passWithNoTests';

/**
 * Sandbox Validator
 *
 * Validates mutations by running tests in an isolated environment.
 * Supports both local and docker execution modes.
 *
 * @example
 * ```typescript
 * const sandbox = new SandboxValidator({
 *   executor: localExecutor,
 *   testCommand: 'npm test'
 * });
 *
 * const result = await sandbox.validate(mutation);
 * if (result.passed) {
 *   console.log('Mutation is safe to apply');
 * }
 * ```
 */
export class SandboxValidator {
  private readonly config: Required<Omit<SandboxConfig, 'tempDir'>> & { tempDir: string };

  /**
   * Create a new sandbox validator.
   *
   * @param config - Configuration options
   */
  constructor(config: SandboxConfig) {
    this.config = {
      timeout: 30000,
      tempDir: os.tmpdir(),
      testCommand: DEFAULT_TEST_COMMAND,
      verbose: false,
      ...config,
    };
  }

  /**
   * Validate a mutation in the sandbox.
   *
   * @param mutation - The mutation to validate
   * @param targetPath - Path to the target file to mutate (optional)
   * @returns Validation result
   */
  async validate(mutation: Mutation, targetPath?: string): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Create sandbox directory
      const sandboxDir = await this.createSandbox();

      // Apply mutation to sandbox
      if (targetPath) {
        await this.applyMutation(mutation, sandboxDir, targetPath);
      } else {
        // Create a test file for the mutation
        const testFile = path.join(sandboxDir, 'mutation-test.ts');
        await fs.writeFile(testFile, mutation.mutated, 'utf-8');
      }

      // Run validation tests
      const result = await this.runTests(sandboxDir);

      // Cleanup sandbox
      await this.cleanup(sandboxDir);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration,
      };
    }
  }

  /**
   * Validate multiple mutations.
   *
   * @param mutations - Mutations to validate
   * @param targetPath - Target file path
   * @returns Array of validation results
   */
  async validateBatch(
    mutations: Mutation[],
    targetPath?: string
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const mutation of mutations) {
      const result = await this.validate(mutation, targetPath);
      results.set(mutation.id, result);
    }

    return results;
  }

  /**
   * Create a sandbox directory.
   */
  private async createSandbox(): Promise<string> {
    const sandboxDir = path.join(
      this.config.tempDir,
      `jclaw-sandbox-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(sandboxDir, { recursive: true });
    this.log(`Created sandbox: ${sandboxDir}`);
    return sandboxDir;
  }

  /**
   * Apply mutation to the sandbox.
   */
  private async applyMutation(
    mutation: Mutation,
    sandboxDir: string,
    targetPath: string
  ): Promise<void> {
    // Get relative path
    const fileName = path.basename(targetPath);
    const sandboxTarget = path.join(sandboxDir, fileName);

    // Write mutated content
    await fs.writeFile(sandboxTarget, mutation.mutated, 'utf-8');
    this.log(`Applied mutation to: ${sandboxTarget}`);
  }

  /**
   * Run tests in the sandbox.
   */
  private async runTests(sandboxDir: string): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let output = '';

    try {
      const result = await this.config.executor.execute(this.config.testCommand, {
        cwd: sandboxDir,
        timeout: this.config.timeout,
      });

      output = result.stdout + '\n' + result.stderr;

      if (result.exitCode === 0) {
        this.log('Tests passed');
        return {
          passed: true,
          errors: [],
          output,
          duration: Date.now() - startTime,
        };
      } else {
        this.log(`Tests failed with exit code ${result.exitCode}`);
        errors.push(`Test command exited with code ${result.exitCode}`);
        return {
          passed: false,
          errors,
          output,
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        passed: false,
        errors,
        output,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Cleanup sandbox directory.
   */
  private async cleanup(sandboxDir: string): Promise<void> {
    try {
      await fs.rm(sandboxDir, { recursive: true, force: true });
      this.log(`Cleaned up sandbox: ${sandboxDir}`);
    } catch (error) {
      this.log(`Warning: Failed to cleanup sandbox: ${error}`);
    }
  }

  /**
   * Log message if verbose mode is enabled.
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[SandboxValidator] ${message}`);
    }
  }
}

/**
 * Create a new sandbox validator.
 *
 * @param config - Configuration options
 * @returns New SandboxValidator instance
 */
export function createSandbox(config: SandboxConfig): SandboxValidator {
  return new SandboxValidator(config);
}
