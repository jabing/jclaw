#!/usr/bin/env node
/**
 * JClaw CLI Entry Point
 *
 * Universal Self-Evolving Agent Framework
 */
import { execCommand, showExecHelp } from './commands/exec.js';
import { configCommand, showConfigHelp } from './commands/config.js';
const VERSION = '0.1.0';
function showHelp() {
    console.log(`
JClaw - Universal Self-Evolving Agent Framework

Usage:
  jclaw <command> [options]

Commands:
  exec <prompt>    Execute a task with the given prompt
  config           Configuration management

Options:
  --help, -h       Show this help message
  --version, -v    Show version number

Examples:
  jclaw exec "Analyze this project structure"
  jclaw config get execution.mode
  jclaw config set execution.mode local

Documentation:
  https://github.com/autogame-17/jclaw
`);
}
function showVersion() {
    console.log(`jclaw v${VERSION}`);
}
export async function main() {
    const args = process.argv.slice(2);
    // No arguments or help flag
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        process.exit(0);
    }
    // Version flag
    if (args[0] === '--version' || args[0] === '-v') {
        showVersion();
        process.exit(0);
    }
    const command = args[0];
    const commandArgs = args.slice(1);
    try {
        switch (command) {
            case 'exec':
                // Handle exec-specific help
                if (commandArgs.includes('--help') || commandArgs.includes('-h')) {
                    showExecHelp();
                    break;
                }
                await execCommand(commandArgs);
                break;
            case 'config':
                // Handle config-specific help
                if (commandArgs.includes('--help') || commandArgs.includes('-h')) {
                    showConfigHelp();
                    break;
                }
                await configCommand(commandArgs);
                break;
            default:
                console.error(`Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error: ${message}`);
        process.exit(1);
    }
}
// CLI entry point - main() is exported for programmatic use
// When run directly via 'node cli/index.js', main() should be called explicitly
export { VERSION };
//# sourceMappingURL=index.js.map