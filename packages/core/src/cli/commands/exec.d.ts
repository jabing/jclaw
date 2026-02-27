/**
 * jclaw exec command - Execute a task with the given prompt
 *
 * Phase 1: Basic stub implementation
 */
export interface ExecOptions {
    prompt: string;
    verbose?: boolean;
}
export declare function execCommand(args: string[]): Promise<void>;
export declare function showExecHelp(): void;
//# sourceMappingURL=exec.d.ts.map