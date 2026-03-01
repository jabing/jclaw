/**
 * GitHub Integration Extension for JClaw
 * 
 * @module github-integration
 */

import type { Extension, AgentRuntime } from '@jclaw/core';
import { GITHUB_CAPABILITIES } from './capabilities.js';
import { GitHubClient } from './github-client.js';

let client: GitHubClient | null = null;

export const githubExtension: Extension = {
  name: 'github-integration',
  version: '1.0.0',
  description: 'Complete GitHub API integration for JClaw',
  capabilities: GITHUB_CAPABILITIES,

  async install(runtime: AgentRuntime): Promise<void> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable required');
    }
    
    client = new GitHubClient(token);
    console.log('✅ GitHub extension installed');
  },

  async uninstall(): Promise<void> {
    client = null;
    console.log('GitHub extension uninstalled');
  },
};

export function getClient(): GitHubClient {
  if (!client) {
    throw new Error('GitHub extension not installed');
  }
  return client;
}

export default githubExtension;
