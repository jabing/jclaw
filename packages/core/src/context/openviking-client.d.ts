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
export declare class OpenVikingClient implements ContextManager {
    private connected;
    private readonly config;
    /**
     * Create a new OpenViking client instance.
     *
     * @param config - Configuration options including server URL and timeout
     */
    constructor(config: OpenVikingConfig);
    /**
     * Establish connection to the OpenViking server.
     *
     * Performs a health check GET request to verify the server is available.
     *
     * @throws Error if connection fails or server is not available
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the OpenViking server.
     *
     * Simply sets the internal connected flag to false.
     * No explicit disconnect request is sent to the server.
     */
    disconnect(): Promise<void>;
    /**
     * Query the OpenViking context for relevant information.
     *
     * @param question - The question to query
     * @param options - Query options including topK for result count
     * @returns Relevant context as string
     * @throws Error if client is not connected or query fails
     */
    query(question: string, options?: {
        topK?: number;
    }): Promise<string>;
    /**
     * Add a resource to the OpenViking context.
     *
     * @param resourcePath - Path to the resource to add
     * @returns Resource identifier returned by the server
     * @throws Error if client is not connected or add operation fails
     */
    addResource(resourcePath: string): Promise<string>;
    /**
     * Check if the client is currently connected.
     *
     * @returns True if connected, false otherwise
     */
    isConnected(): boolean;
}
//# sourceMappingURL=openviking-client.d.ts.map