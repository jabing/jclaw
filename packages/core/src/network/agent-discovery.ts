/**
 * Agent Discovery
 *
 * Mechanism for discovering agents by capability
 *
 * @module @jclaw/core/network/agent-discovery
 */

import type { A2AClient } from './a2a-client.js';
import type { NodeInfo } from './protocol.js';

export interface DiscoveryResult {
  agentId: string;
  agentInfo: NodeInfo;
  matchScore: number;
  matchedCapabilities: string[];
}

export interface DiscoveryConfig {
  client: A2AClient;
  cacheTimeout?: number;
}

export class AgentDiscovery {
  private client: A2AClient;
  private cacheTimeout: number;
  private capabilityCache: Map<string, { agents: DiscoveryResult[]; cachedAt: number }> = new Map();

  constructor(config: DiscoveryConfig) {
    this.client = config.client;
    this.cacheTimeout = config.cacheTimeout || 60000; // 1 minute default
  }

  async findByCapability(capability: string): Promise<DiscoveryResult[]> {
    // Check cache first
    const cached = this.capabilityCache.get(capability);
    if (cached && Date.now() - cached.cachedAt < this.cacheTimeout) {
      return cached.agents;
    }

    // Query network for agents with this capability
    // In production, this would send a discovery request via A2A
    const results: DiscoveryResult[] = [];

    // Cache results
    this.capabilityCache.set(capability, {
      agents: results,
      cachedAt: Date.now(),
    });

    return results;
  }

  async findByCapabilities(capabilities: string[]): Promise<DiscoveryResult[]> {
    const results: Map<string, DiscoveryResult> = new Map();

    for (const capability of capabilities) {
      const agents = await this.findByCapability(capability);
      for (const agent of agents) {
        const existing = results.get(agent.agentId);
        if (existing) {
          existing.matchedCapabilities.push(capability);
          existing.matchScore = existing.matchedCapabilities.length / capabilities.length;
        } else {
          results.set(agent.agentId, {
            ...agent,
            matchedCapabilities: [capability],
            matchScore: 1 / capabilities.length,
          });
        }
      }
    }

    return Array.from(results.values()).sort((a, b) => b.matchScore - a.matchScore);
  }

  async findBest(capability: string): Promise<DiscoveryResult | null> {
    const results = await this.findByCapability(capability);
    if (results.length === 0) return null;
    return results[0] ?? null;
  }

  broadcastCapability(capability: string): void {
    // Announce this agent's capability to the network
    // In production, this would use A2A client to broadcast
    console.log(`Broadcasting capability: ${capability}`);
  }

  clearCache(): void {
    this.capabilityCache.clear();
  }
}

export function createAgentDiscovery(config: DiscoveryConfig): AgentDiscovery {
  return new AgentDiscovery(config);
}
