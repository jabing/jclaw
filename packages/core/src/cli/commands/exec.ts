/**
 * jclaw exec command - Execute a task with the given prompt
 *
 * Phase 1: Basic stub implementation
 */

export interface ExecOptions {
  prompt: string;
  verbose?: boolean;
}

export async function execCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error('No prompt provided. Usage: jclaw exec <prompt>');
  }

  // Parse flags
  const verbose = args.includes('--verbose') || args.includes('-V');
  const promptArgs = args.filter((arg) => !arg.startsWith('-'));
  const prompt = promptArgs.join(' ');

  if (verbose) {
    console.log('[verbose] Executing task...');
    console.log(`[verbose] Prompt: ${prompt}`);
  }

  console.log(`Executing: ${prompt}`);

  // Phase 1: Just echo the prompt
  // Future phases will integrate with executor
  console.log('Task execution not yet implemented. This is Phase 1.');

  if (verbose) {
    console.log('[verbose] Task completed (stub)');
  }
}

export function showExecHelp(): void {
  console.log(`
jclaw exec - Execute a task with the given prompt

Usage:
  jclaw exec <prompt> [options]

Options:
  --verbose, -V    Show detailed execution info

Examples:
  jclaw exec "Analyze this project structure"
  jclaw exec "Refactor UserService" --verbose
`);
}
