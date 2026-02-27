#!/usr/bin/env node
/**
 * JClaw CLI Runner
 *
 * This is the main entry point when running JClaw from the command line.
 * It imports and executes the main() function from index.ts.
 */
import { main } from './index.js';
main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
//# sourceMappingURL=run.js.map