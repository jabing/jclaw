/**
 * OpenViking Client
 *
 * HTTP client implementation of ContextManager interface for connecting
 * to OpenViking MCP Server.
 *
 * @module @jclaw/core/context/openviking-client
 */

import type { ContextManager } from '../types.js';

/**
 * Configuration options for OpenViking client.
 */
export interface OpenVikingConfig {
  /** URL of the OpenViking MCP server */
  serverUrl: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Response structure from OpenViking server.
 */
interface OpenVikingResponse {
  result?: string | { id: string };
  content?: string;
  id?: string;
}

/**
 * HTTP client implementation of ContextManager for OpenViking MCP Server.
 *
 * Provides connection management and context operations via HTTP requests.
 * For Phase 1, this uses a basic HTTP client approach. Full MCP SDK
 * integration can be added in later phases.
 *
 * @example
 * ```typescript
 * const client = new OpenVikingClient({
 *   serverUrl: 'http://localhost:2033/mcp'
 * });
 *
 * await client.connect();
 * const result = await client.query('What is the project structure?');
 * await client.disconnect();
 * ```
 */
export class OpenVikingClient implements ContextManager {
  private connected = false;
  private readonly config: Required<OpenVikingConfig>;

  /**
   * Create a new OpenViking client instance.
   *
   * @param config - Configuration options including server URL and timeout
   */
  constructor(config: OpenVikingConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Establish connection to the OpenViking server.
   *
   * Performs a health check GET request to verify the server is available.
   *
   * @throws Error if connection fails or server is not available
   */
  async connect(): Promise<void> {
    try {
      const response = await fetch(this.config.serverUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      this.connected = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect to OpenViking: ${message}`);
    }
  }

  /**
   * Disconnect from the OpenViking server.
   *
   * Simply sets the internal connected flag to false.
   * No explicit disconnect request is sent to the server.
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Query the OpenViking context for relevant information.
   *
   * @param question - The question to query
   * @param options - Query options including topK for result count
   * @returns Relevant context as string
   * @throws Error if client is not connected or query fails
   */
  async query(question: string, options?: { topK?: number }): Promise<string> {
    if (!this.connected) {
      throw new Error('Client not connected');
    }

    try {
      const response = await fetch(this.config.serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'query',
          params: { question, topK: options?.topK ?? 5 },
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.status}`);
      }

      const data = (await response.json()) as OpenVikingResponse;

      // Handle various response formats
      if (typeof data.result === 'string') {
        return data.result;
      }
      if (data.content !== undefined) {
        return data.content;
      }
      if (typeof data.result === 'object' && data.result !== null) {
        return JSON.stringify(data.result);
      }

      return '';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Query failed: ${message}`);
    }
  }

  /**
   * Add a resource to the OpenViking context.
   *
   * @param resourcePath - Path to the resource to add
   * @returns Resource identifier returned by the server
   * @throws Error if client is not connected or add operation fails
   */
  async addResource(resourcePath: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Client not connected');
    }

    try {
      const response = await fetch(this.config.serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'add_resource',
          params: { resource_path: resourcePath },
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Add resource failed: ${response.status}`);
      }

      const data = (await response.json()) as OpenVikingResponse;

      // Handle various response formats for resource ID
      if (
        typeof data.result === 'object' &&
        data.result !== null &&
        'id' in data.result
      ) {
        return data.result.id;
      }
      if (data.id !== undefined) {
        return data.id;
      }

      return '';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Add resource failed: ${message}`);
    }
  }

  /**
   * Check if the client is currently connected.
   *
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }
}
