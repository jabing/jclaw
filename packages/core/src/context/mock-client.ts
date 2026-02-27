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
export class MockClient implements ContextManager {
  private connected = false;
  private resources: Map<string, MockResource> = new Map();
  private queryResponses: Map<string, string> = new Map();

  /**
   * Establish connection to the mock context backend.
   * Simply sets internal connected flag to true.
   */
  async connect(): Promise<void> {
    this.connected = true;
  }

  /**
   * Disconnect from the mock context backend.
   * Simply sets internal connected flag to false.
   * Does not clear stored resources or query responses.
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Query the mock context for relevant information.
   *
   * @param question - The question to query
   * @param options - Query options (topK is ignored in mock)
   * @returns Mock response or custom response if set via setQueryResponse
   * @throws Error if client is not connected
   */
  async query(question: string, options?: { topK?: number }): Promise<string> {
    if (!this.connected) {
      throw new Error('Client not connected');
    }

    // Options are available for future use (topK for limiting results)
    const _topK = options?.topK; // Available for future implementation
    void _topK; // mark as used

    // Check for custom response first
    const customResponse = this.queryResponses.get(question);
    if (customResponse !== undefined) {
      return customResponse;
    }

    // Return default mock response
    return `Mock response for: ${question}`;
  }

  /**
   * Add a resource to the mock context.
   *
   * @param resourcePath - Path to the resource to add
   * @returns Generated resource identifier
   * @throws Error if client is not connected
   */
  async addResource(resourcePath: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Client not connected');
    }

    const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.resources.set(id, {
      id,
      path: resourcePath,
      content: '',
      addedAt: new Date(),
    });

    return id;
  }

  // ===== Test Helper Methods =====

  /**
   * Set a custom response for a specific query.
   * Useful for testing specific scenarios.
   *
   * @param question - The question to set a response for
   * @param response - The response to return
   */
  setQueryResponse(question: string, response: string): void {
    this.queryResponses.set(question, response);
  }

  /**
   * Clear a previously set query response.
   *
   * @param question - The question to clear the response for
   */
  clearQueryResponse(question: string): void {
    this.queryResponses.delete(question);
  }

  /**
   * Get all stored resources.
   * Useful for verifying addResource calls in tests.
   *
   * @returns Array of all stored resources
   */
  getResources(): MockResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get a specific resource by ID.
   *
   * @param id - The resource ID
   * @returns The resource or undefined if not found
   */
  getResourceById(id: string): MockResource | undefined {
    return this.resources.get(id);
  }

  /**
   * Clear all stored resources.
   * Useful for test cleanup.
   */
  clearResources(): void {
    this.resources.clear();
  }

  /**
   * Check if the client is currently connected.
   *
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Reset the client to initial state.
   * Disconnects, clears all resources and query responses.
   */
  reset(): void {
    this.connected = false;
    this.resources.clear();
    this.queryResponses.clear();
  }
}
