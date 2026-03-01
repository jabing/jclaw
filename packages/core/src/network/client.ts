/**
 * EvoMap Client
 *
 * HTTP client for EvoMap Hub integration.
 *
 * @module @jclaw/core/network/client
 */

import type { Gene } from '../evolution/types.js';
import {
  A2AProtocol,
  GEPProtocol,
  type A2AMessage,
  type GEPPacket,
  type NodeInfo,
  type GeneRequestPayload,
} from './protocol.js';

/**
 * Configuration for EvoMap client
 */
export interface EvoMapConfig {
  /** EvoMap Hub URL */
  hubUrl: string;
  /** Agent/node ID */
  nodeId: string;
  /** Node name */
  nodeName?: string;
  /** Node version */
  nodeVersion?: string;
  /** Node capabilities */
  capabilities?: string[];
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Heartbeat interval in milliseconds (default: 60000) */
  heartbeatInterval?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Gene response from EvoMap
 */
export interface GeneResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Retrieved genes */
  genes: GEPPacket[];
  /** Total available genes */
  total: number;
  /** Response message */
  message?: string;
}

/**
 * EvoMap Client
 *
 * Connects to EvoMap Hub for gene sharing and discovery.
 *
 * @example
 * ```typescript
 * const client = new EvoMapClient({
 *   hubUrl: 'https://evomap.ai/api',
 *   nodeId: 'my-agent-1',
 *   nodeName: 'My Agent'
 * });
 *
 * // Register with the hub
 * await client.register();
 *
 * // Share genes
 * await client.shareGenes(genes);
 *
 * // Request genes
 * const response = await client.requestGenes({ minFitness: 0.8 });
 * ```
 */
export class EvoMapClient {
  private readonly config: Required<Omit<EvoMapConfig, 'capabilities'>> & {
    capabilities: string[];
  };
  private registered = false;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  /**
   * Create a new EvoMap client.
   *
   * @param config - Configuration options
   */
  constructor(config: EvoMapConfig) {
    this.config = {
      nodeName: 'JClaw-Agent',
      nodeVersion: '0.1.0',
      capabilities: [],
      timeout: 30000,
      heartbeatInterval: 60000,
      verbose: false,
      ...config,
    };
  }

  /**
   * Get node info.
   */
  get nodeInfo(): NodeInfo {
    return {
      id: this.config.nodeId,
      name: this.config.nodeName,
      version: this.config.nodeVersion,
      capabilities: this.config.capabilities,
      endpoint: '', // Would be set for server mode
      lastSeen: Date.now(),
    };
  }

  /**
   * Register this node with the EvoMap Hub.
   */
  async register(): Promise<void> {
    const message = A2AProtocol.createGreeting(
      this.config.nodeId,
      'hub',
      this.nodeInfo
    );

    try {
      const response = await this.sendRequest('/register', message);

      if (response.ok) {
        this.registered = true;
        this.startHeartbeat();
        this.log('Registered with EvoMap Hub');
      } else {
        throw new Error(`Registration failed: ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to register with EvoMap Hub: ${message}`);
    }
  }

  /**
   * Unregister from the EvoMap Hub.
   */
  async unregister(): Promise<void> {
    if (!this.registered) {
      return;
    }

    this.stopHeartbeat();

    const message = A2AProtocol.createMessage(
      'goodbye',
      this.config.nodeId,
      'hub',
      { reason: 'shutdown' }
    );

    try {
      await this.sendRequest('/unregister', message);
    } catch {
      // Ignore errors during unregister
    }

    this.registered = false;
    this.log('Unregistered from EvoMap Hub');
  }

  /**
   * Share genes with the EvoMap network.
   *
   * @param genes - Genes to share
   */
  async shareGenes(genes: Gene[]): Promise<void> {
    if (!this.registered) {
      throw new Error('Not registered with EvoMap Hub');
    }

    const packets: GEPPacket[] = genes.map((gene) =>
      GEPProtocol.createPacket(gene.id, gene.type, gene.content, {
        fitness: gene.fitness,
        generation: gene.generation,
        parents: gene.parents,
      })
    );

    const message = A2AProtocol.createGeneShare(
      this.config.nodeId,
      'hub',
      packets,
      false
    );

    try {
      const response = await this.sendRequest('/genes/share', message);
      if (!response.ok) {
        throw new Error(`Share failed: ${response.status}`);
      }
      this.log(`Shared ${genes.length} genes`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to share genes: ${message}`);
    }
  }

  /**
   * Request genes from the EvoMap network.
   *
   * @param request - Gene request parameters
   * @returns Gene response
   */
  async requestGenes(request: GeneRequestPayload = {}): Promise<GeneResponse> {
    if (!this.registered) {
      throw new Error('Not registered with EvoMap Hub');
    }

    const message = A2AProtocol.createGeneRequest(
      this.config.nodeId,
      'hub',
      request
    );

    try {
      const response = await this.sendRequest('/genes/request', message);

      if (!response.ok) {
        return {
          success: false,
          genes: [],
          total: 0,
          message: `Request failed: ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        genes?: GEPPacket[];
        total?: number;
        message?: string;
      };

      return {
        success: true,
        genes: data.genes ?? [],
        total: data.total ?? 0,
        message: data.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        genes: [],
        total: 0,
        message,
      };
    }
  }

  /**
   * Check if the client is registered.
   */
  isRegistered(): boolean {
    return this.registered;
  }

  /**
   * Send an HTTP request to the EvoMap Hub.
   */
  private async sendRequest(path: string, message: A2AMessage): Promise<Response> {
    const url = `${this.config.hubUrl}${path}`;

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(this.config.timeout),
    });
  }

  /**
   * Start heartbeat timer.
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        const message = A2AProtocol.createHeartbeat(this.config.nodeId, 'hub');
        await this.sendRequest('/heartbeat', message);
        this.log('Heartbeat sent');
      } catch (error) {
        this.log(`Heartbeat failed: ${error}`);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Log message if verbose mode is enabled.
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[EvoMapClient] ${message}`);
    }
  }
}

/**
 * Create a new EvoMap client.
 *
 * @param config - Configuration options
 * @returns New EvoMapClient instance
 */
export function createEvoMapClient(config: EvoMapConfig): EvoMapClient {
  return new EvoMapClient(config);
}
