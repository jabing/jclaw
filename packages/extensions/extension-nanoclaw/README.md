# @jclaw/extension-nanoclaw

NanoClaw extension for JClaw - provides WhatsApp messaging entry point.

## Installation

```bash
npm install @jclaw/extension-nanoclaw

# Also requires NanoClaw to be installed
# See: https://github.com/qwibitai/nanoclaw
```

## Capabilities

| Capability        | Description                                 |
| ----------------- | ------------------------------------------- |
| `message_receive` | Receive messages from WhatsApp via NanoClaw |
| `message_send`    | Send messages to WhatsApp via NanoClaw      |
| `task_trigger`    | Trigger JClaw tasks from messages           |

## Usage

```typescript
import {
  nanoclawExtension,
  NanoClawAdapter,
  MessageRouter,
  getAdapter,
  getRouter,
} from '@jclaw/extension-nanoclaw';
import { ExtensionRegistry } from '@jclaw/core';

// Register extension
const registry = new ExtensionRegistry();
await registry.register(nanoclawExtension);

// Use adapter directly
const adapter = new NanoClawAdapter();
const result = await adapter.sendMessage({
  to: 'user@s.whatsapp.net',
  content: 'Hello from JClaw!',
});

// Use message router
const router = new MessageRouter();
router.addRule({
  pattern: '@jclaw',
  handler: async (message) => {
    // Handle message
    console.log('Received:', message.content);
  },
});
```

## Message Router

The `MessageRouter` allows you to route incoming messages to different handlers based on patterns:

```typescript
const router = new MessageRouter();

// String pattern matching
router.addRule({
  pattern: '@jclaw',
  handler: async (msg) => console.log('JClaw mentioned:', msg.content),
});

// Regex pattern matching
router.addRule({
  pattern: /\d+/,
  handler: async (msg) => console.log('Number detected'),
});

// Default handler for unmatched messages
const routerWithDefault = new MessageRouter({
  defaultHandler: async (msg) => console.log('Unknown message'),
});
```

## Requirements

- Node.js >= 18.0.0
- NanoClaw (optional, for real WhatsApp usage)

## License

MIT
