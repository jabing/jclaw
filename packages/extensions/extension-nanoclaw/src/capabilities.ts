/**
 * NanoClaw Extension Capabilities
 *
 * Defines the capabilities provided by the NanoClaw extension.
 * Each capability represents a distinct feature that can be invoked.
 *
 * @module @jclaw/extension-nanoclaw/capabilities
 */

import type { Capability } from '@jclaw/core';

/**
 * Message receive capability for WhatsApp messages
 */
export const MESSAGE_RECEIVE_CAPABILITY: Capability = {
  name: 'message_receive',
  description: 'Receive messages from WhatsApp via NanoClaw',
  inputSchema: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'Sender JID' },
      content: { type: 'string', description: 'Message content' },
      timestamp: { type: 'number', description: 'Message timestamp' },
    },
    required: ['from', 'content'],
  },
};

/**
 * Message send capability for WhatsApp messages
 */
export const MESSAGE_SEND_CAPABILITY: Capability = {
  name: 'message_send',
  description: 'Send messages to WhatsApp via NanoClaw',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient JID' },
      content: { type: 'string', description: 'Message content' },
    },
    required: ['to', 'content'],
  },
};

/**
 * Task trigger capability for JClaw task execution
 */
export const TASK_TRIGGER_CAPABILITY: Capability = {
  name: 'task_trigger',
  description: 'Trigger JClaw tasks from messages',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Task prompt' },
      context: { type: 'object', description: 'Additional context' },
    },
    required: ['prompt'],
  },
};

/**
 * All capabilities provided by the NanoClaw extension
 */
export const NANOCLAW_CAPABILITIES: Capability[] = [
  MESSAGE_RECEIVE_CAPABILITY,
  MESSAGE_SEND_CAPABILITY,
  TASK_TRIGGER_CAPABILITY,
];
