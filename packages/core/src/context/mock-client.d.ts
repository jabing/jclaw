/**
 * Mock OpenViking Client
 *
 * In-memory mock implementation of ContextManager interface for offline testing.
 *
 * @module @jclaw/core/context/mock-client
 */
import type { ContextManager } from '../types.js';
/**
 * Internal resource representation for mock client
 */
interface MockResource {
    id: string;
    path: string;
    content: string;
    addedAt: Date;
}
/**
 * Mock implementation of ContextManager for testing purposes.
 *
 * Provides in-memory storage and retrieval without requiring a real
 * OpenViking server connection. Useful for unit tests and offline development.
 *
 * @example
 * ```typescript
 * const client = new MockClient();
 * await client.connect();
 *
 * // Set custom query responses for testing
 * client.setQueryResponse('What is JClaw?', 'JClaw is a self-evolving agent framework');
 *
 * const result = await client.query('What is JClaw?');
 * console.log(result); // 'JClaw is a self-evolving agent framework'
 * ```
 */
export declare class MockClient implements ContextManager {
    private connected;
    private resources;
    private queryResponses;
    /**
     * Establish connection to the mock context backend.
     * Simply sets internal connected flag to true.
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the mock context backend.
     * Simply sets internal connected flag to false.
     * Does not clear stored resources or query responses.
     */
    disconnect(): Promise<void>;
    /**
     * Query the mock context for relevant information.
     *
     * @param question - The question to query
     * @param options - Query options (topK is ignored in mock)
     * @returns Mock response or custom response if set via setQueryResponse
     * @throws Error if client is not connected
     */
    query(question: string, options?: {
        topK?: number;
    }): Promise<string>;
    /**
     * Add a resource to the mock context.
     *
     * @param resourcePath - Path to the resource to add
     * @returns Generated resource identifier
     * @throws Error if client is not connected
     */
    addResource(resourcePath: string): Promise<string>;
    /**
     * Set a custom response for a specific query.
     * Useful for testing specific scenarios.
     *
     * @param question - The question to set a response for
     * @param response - The response to return
     */
    setQueryResponse(question: string, response: string): void;
    /**
     * Clear a previously set query response.
     *
     * @param question - The question to clear the response for
     */
    clearQueryResponse(question: string): void;
    /**
     * Get all stored resources.
     * Useful for verifying addResource calls in tests.
     *
     * @returns Array of all stored resources
     */
    getResources(): MockResource[];
    /**
     * Get a specific resource by ID.
     *
     * @param id - The resource ID
     * @returns The resource or undefined if not found
     */
    getResourceById(id: string): MockResource | undefined;
    /**
     * Clear all stored resources.
     * Useful for test cleanup.
     */
    clearResources(): void;
    /**
     * Check if the client is currently connected.
     *
     * @returns True if connected, false otherwise
     */
    isConnected(): boolean;
    /**
     * Reset the client to initial state.
     * Disconnects, clears all resources and query responses.
     */
    reset(): void;
}
export {};
//# sourceMappingURL=mock-client.d.ts.map