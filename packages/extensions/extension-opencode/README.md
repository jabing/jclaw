# @jclaw/extension-opencode

OpenCode extension for JClaw - provides AI-powered coding capabilities with LSP support.

## Installation

```bash
npm install @jclaw/extension-opencode

# Also requires OpenCode CLI to be installed
# See: https://opencode.ai
```

## Capabilities

| Capability  | Description                           |
| ----------- | ------------------------------------- |
| `code_edit` | Edit code using AI with LSP context   |
| `refactor`  | Refactor code (extract/inline/rename) |
| `analyze`   | Analyze code structure and patterns   |

## Usage

```typescript
import { opencodeExtension, OpenCodeAdapter } from '@jclaw/extension-opencode';
import { ExtensionRegistry } from '@jclaw/core';

// Register extension
const registry = new ExtensionRegistry();
await registry.register(opencodeExtension);

// Use adapter directly
const adapter = new OpenCodeAdapter();
const result = await adapter.run('Explain this code');
```

## Requirements

- Node.js >= 18.0.0
- OpenCode CLI (optional, for real usage)

## License

MIT
