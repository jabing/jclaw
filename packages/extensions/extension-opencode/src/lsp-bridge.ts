/**
 * LSP Bridge for OpenCode Extension
 *
 * Provides Language Server Protocol client communication via stdio.
 * Handles initialization, file operations, and message management.
 *
 * @module @jclaw/extension-opencode/lsp-bridge
 */

import { spawn, ChildProcess } from 'child_process';
import type {
  InitializeParams,
  InitializeResult,
  ServerCapabilities,
  TextDocumentItem,
  VersionedTextDocumentIdentifier,
  TextDocumentContentChangeEvent,
  DocumentUri,
  Message,
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from 'vscode-languageserver-protocol';

/**
 * Options for configuring the LSP bridge
 */
export interface LSPBridgeOptions {
  /** Command to start the LSP server */
  command: string;
  /** Arguments for the LSP server command */
  args?: string[];
  /** Working directory for the LSP server */
  cwd?: string;
  /** Environment variables for the LSP server */
  env?: Record<string, string>;
  /** Default timeout for requests in milliseconds */
  requestTimeout?: number;
  /** Root URI for the workspace */
  rootUri?: string;
  /** Client information */
  clientInfo?: {
    name: string;
    version?: string;
  };
}

/**
 * Represents the state of the LSP connection
 */
export enum LSPConnectionState {
  /** Initial state, not yet connected */
  Initial = 'initial',
  /** Server process started, initializing */
  Initializing = 'initializing',
  /** Initialization complete, ready for requests */
  Ready = 'ready',
  /** Shutdown in progress */
  ShuttingDown = 'shuttingDown',
  /** Connection closed */
  Closed = 'closed',
  /** Error state */
  Error = 'error',
}

/**
 * Error thrown when LSP operations fail
 */
export class LSPError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'LSPError';
  }
}

/**
 * Pending request tracking
 */
interface PendingRequest {
  resolve: (value: ResponseMessage) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * LSP Bridge - Manages communication with Language Servers
 *
 * Provides a complete LSP client implementation supporting:
 * - Server process management via stdio
 * - LSP lifecycle (initialize, shutdown, exit)
 * - Text document notifications (didOpen, didChange, didSave, didClose)
 * - Request/response handling with timeout management
 * - Message ID tracking
 */
export class LSPBridge {
  private process: ChildProcess | null = null;
  private state: LSPConnectionState = LSPConnectionState.Initial;
  private messageId = 0;
  private pendingRequests = new Map<number | string, PendingRequest>();
  private buffer = '';
  private serverCapabilities: ServerCapabilities | null = null;
  private options: Required<LSPBridgeOptions>;

  /**
   * Default options
   */
  private static readonly DEFAULT_OPTIONS: Omit<
    Required<LSPBridgeOptions>,
    'command'
  > = {
    args: [],
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
    requestTimeout: 30000,
    rootUri: `file://${process.cwd()}`,
    clientInfo: {
      name: 'jclaw-extension-opencode',
      version: '0.1.0',
    },
  };

  /**
   * Create a new LSP bridge instance
   * @param options - Configuration options
   */
  constructor(options: LSPBridgeOptions) {
    this.options = {
      ...LSPBridge.DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Get the current connection state
   */
  getState(): LSPConnectionState {
    return this.state;
  }

  /**
   * Check if the bridge is ready for requests
   */
  isReady(): boolean {
    return this.state === LSPConnectionState.Ready;
  }

  /**
   * Get server capabilities from initialization
   */
  getServerCapabilities(): ServerCapabilities | null {
    return this.serverCapabilities;
  }

  /**
   * Initialize the LSP connection
   *
   * Starts the server process and performs LSP initialization handshake.
   *
   * @returns Promise resolving to initialization result
   * @throws LSPError if initialization fails
   */
  async initialize(): Promise<InitializeResult> {
    if (this.state !== LSPConnectionState.Initial) {
      throw new LSPError(`Cannot initialize from state: ${this.state}`, -32000);
    }

    this.state = LSPConnectionState.Initializing;

    try {
      // Start the LSP server process
      await this.startProcess();

      // Build initialize parameters
      const params: InitializeParams = {
        processId: process.pid,
        rootUri: this.options.rootUri,
        capabilities: {
          textDocument: {
            synchronization: {
              dynamicRegistration: false,
              willSave: true,
              willSaveWaitUntil: true,
              didSave: true,
            },
            completion: {
              dynamicRegistration: false,
              completionItem: {
                snippetSupport: true,
                commitCharactersSupport: true,
                documentationFormat: ['markdown', 'plaintext'],
                deprecatedSupport: true,
                preselectSupport: true,
              },
            },
            hover: {
              dynamicRegistration: false,
              contentFormat: ['markdown', 'plaintext'],
            },
            definition: {
              dynamicRegistration: false,
              linkSupport: true,
            },
            documentSymbol: {
              dynamicRegistration: false,
              hierarchicalDocumentSymbolSupport: true,
            },
            codeAction: {
              dynamicRegistration: false,
              codeActionLiteralSupport: {
                codeActionKind: {
                  valueSet: ['', 'quickfix', 'refactor', 'source'],
                },
              },
            },
            formatting: {
              dynamicRegistration: false,
            },
            rename: {
              dynamicRegistration: false,
              prepareSupport: true,
            },
          },
          workspace: {
            applyEdit: true,
            workspaceEdit: {
              documentChanges: true,
            },
            didChangeConfiguration: {
              dynamicRegistration: false,
            },
            didChangeWatchedFiles: {
              dynamicRegistration: false,
            },
            workspaceFolders: true,
            configuration: true,
          },
        },
        clientInfo: this.options.clientInfo,
        locale: 'en',
      };

      // Send initialize request
      const result = await this.sendRequest<InitializeResult>(
        'initialize',
        params
      );

      // Store server capabilities
      this.serverCapabilities = result.capabilities;

      // Send initialized notification
      this.sendNotification('initialized', {});

      this.state = LSPConnectionState.Ready;

      return result;
    } catch (error) {
      this.state = LSPConnectionState.Error;
      throw error;
    }
  }

  /**
   * Start the LSP server process
   */
  private startProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(this.options.command, this.options.args, {
          cwd: this.options.cwd,
          env: this.options.env,
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
        });

        // Handle stdout for LSP messages
        this.process.stdout?.on('data', (data: Buffer) => {
          this.handleData(data);
        });

        // Handle stderr for logging
        this.process.stderr?.on('data', (data: Buffer) => {
          console.error(`[LSP Server stderr]: ${data.toString()}`);
        });

        // Handle process errors
        this.process.on('error', (err) => {
          this.state = LSPConnectionState.Error;
          reject(
            new LSPError(`Failed to start LSP server: ${err.message}`, -32000)
          );
        });

        // Handle process exit
        this.process.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            console.error(`LSP server exited with code ${code}`);
          }
          this.cleanup();
        });

        // Give the process a moment to start
        setTimeout(resolve, 100);
      } catch (error) {
        reject(new LSPError(`Failed to spawn LSP server: ${error}`, -32000));
      }
    });
  }

  /**
   * Handle incoming data from the server
   */
  private handleData(data: Buffer): void {
    this.buffer += data.toString();

    // Process complete messages
    while (true) {
      const result = this.parseMessage();
      if (!result) break;

      const { message, rest } = result;
      this.buffer = rest;

      this.handleMessage(message);
    }
  }

  /**
   * Parse a complete LSP message from the buffer
   */
  private parseMessage(): { message: string; rest: string } | null {
    // LSP messages use Content-Length header
    const headerMatch = this.buffer.match(/Content-Length: (\d+)\r\n/);
    if (!headerMatch || !headerMatch[1]) return null;

    const contentLength = parseInt(headerMatch[1], 10);
    const headerEnd = this.buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return null;

    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;

    if (this.buffer.length < messageEnd) return null;

    const message = this.buffer.slice(messageStart, messageEnd);
    const rest = this.buffer.slice(messageEnd);

    return { message, rest };
  }

  /**
   * Handle a parsed LSP message
   */
  private handleMessage(message: string): void {
    try {
      const parsed: Message = JSON.parse(message);

      if ('id' in parsed) {
        if ('method' in parsed) {
          // Server-to-client request (rare, usually window/showMessage)
          this.handleServerRequest(parsed as RequestMessage);
        } else {
          // Response to our request
          this.handleResponse(parsed as ResponseMessage);
        }
      } else {
        // Notification from server
        this.handleNotification(parsed as NotificationMessage);
      }
    } catch (error) {
      console.error('Failed to parse LSP message:', error);
    }
  }

  /**
   * Handle server request (server-to-client)
   */
  private handleServerRequest(request: RequestMessage): void {
    // Most servers don't send requests, but handle common ones
    const requestId = request.id ?? 0;
    switch (request.method) {
      case 'window/showMessage':
      case 'window/logMessage':
        // These are informational, just log them
        console.log(`[LSP Server] ${JSON.stringify(request.params)}`);
        break;
      case 'client/registerCapability':
        // Acknowledge capability registration
        this.sendResponse(requestId, null);
        break;
      default:
        console.warn(`Unhandled server request: ${request.method}`);
        // Send error response
        this.sendResponse(requestId, null, {
          code: -32601,
          message: `Method not found: ${request.method}`,
        });
    }
  }

  /**
   * Handle response to our request
   */
  private handleResponse(response: ResponseMessage): void {
    const responseId = response.id ?? 0;
    const pending = this.pendingRequests.get(responseId);
    if (!pending) {
      console.warn(`Received response for unknown request ID: ${response.id}`);
      return;
    }

    // Clear the timeout
    clearTimeout(pending.timer);
    this.pendingRequests.delete(responseId);

    if (response.error) {
      pending.reject(
        new LSPError(
          response.error.message,
          response.error.code,
          response.error.data
        )
      );
    } else {
      pending.resolve(response);
    }
  }

  /**
   * Handle notification from server
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleNotification(notification: NotificationMessage): void {
    // Handle server notifications
    switch (notification.method) {
      case 'textDocument/publishDiagnostics':
        // Diagnostics published - could emit event here
        console.log(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `[LSP] Diagnostics received for ${(notification.params as any)?.uri}`
        );
        break;
      case 'window/showMessage':
        console.log(`[LSP Server] ${JSON.stringify(notification.params)}`);
        break;
      case 'window/logMessage':
        console.log(`[LSP Log] ${JSON.stringify(notification.params)}`);
        break;
      default:
        console.log(`[LSP Notification] ${notification.method}`);
    }
  }

  /**
   * Send a request to the LSP server
   *
   * @param method - LSP method name
   * @param params - Method parameters
   * @returns Promise resolving to the response result
   */
  private sendRequest<T>(method: string, params?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin?.writable) {
        reject(new LSPError('LSP server not connected', -32000));
        return;
      }

      const id = ++this.messageId;
      const request: RequestMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params: params as object | any[] | undefined,
      };

      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new LSPError(`Request timeout: ${method}`, -32001));
      }, this.options.requestTimeout);

      // Store pending request
      this.pendingRequests.set(id, {
        resolve: (response) => resolve(response.result as T),
        reject,
        timer,
      });

      // Send the message
      this.sendMessage(request);
    });
  }

  /**
   * Send a response to the server
   */
  private sendResponse(
    id: number | string,
    result: unknown,
    error?: { code: number; message: string; data?: unknown }
  ): void {
    const response: ResponseMessage = {
      jsonrpc: '2.0',
      id,
      result: error ? undefined : (result as object | any[] | undefined),
      error: error,
    };

    this.sendMessage(response);
  }

  /**
   * Send a notification to the LSP server
   *
   * @param method - LSP method name
   * @param params - Method parameters
   */
  sendNotification(method: string, params?: unknown): void {
    if (!this.process?.stdin?.writable) {
      console.error('Cannot send notification: LSP server not connected');
      return;
    }

    const notification: NotificationMessage = {
      jsonrpc: '2.0',
      method,
      params: params as object | any[] | undefined,
    };

    this.sendMessage(notification);
  }

  /**
   * Send a raw LSP message
   */
  private sendMessage(message: Message): void {
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;

    this.process?.stdin?.write(header + content);
  }

  /**
   * Notify server that a document was opened
   *
   * @param document - Text document item
   */
  didOpen(document: TextDocumentItem): void {
    this.sendNotification('textDocument/didOpen', {
      textDocument: document,
    });
  }

  /**
   * Notify server that a document was changed
   *
   * @param document - Versioned document identifier
   * @param contentChanges - Array of content changes
   */
  didChange(
    document: VersionedTextDocumentIdentifier,
    contentChanges: TextDocumentContentChangeEvent[]
  ): void {
    this.sendNotification('textDocument/didChange', {
      textDocument: document,
      contentChanges,
    });
  }

  /**
   * Notify server that a document was saved
   *
   * @param uri - Document URI
   * @param text - Optional saved text
   */
  didSave(uri: DocumentUri, text?: string): void {
    const params: { textDocument: { uri: DocumentUri }; text?: string } = {
      textDocument: { uri },
    };
    if (text !== undefined) {
      params.text = text;
    }
    this.sendNotification('textDocument/didSave', params);
  }

  /**
   * Notify server that a document was closed
   *
   * @param uri - Document URI
   */
  didClose(uri: DocumentUri): void {
    this.sendNotification('textDocument/didClose', {
      textDocument: { uri },
    });
  }

  /**
   * Shutdown the LSP connection gracefully
   *
   * Performs the LSP shutdown handshake and exits the server.
   */
  async shutdown(): Promise<void> {
    if (this.state === LSPConnectionState.Closed) {
      return;
    }

    if (this.state === LSPConnectionState.Ready) {
      this.state = LSPConnectionState.ShuttingDown;

      try {
        // Send shutdown request
        await this.sendRequest('shutdown', undefined);

        // Send exit notification
        this.sendNotification('exit', undefined);
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
    }

    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new LSPError('Connection closed', -32000));
    }
    this.pendingRequests.clear();

    // Kill the process if still running
    if (this.process && !this.process.killed) {
      this.process.kill();
    }

    this.process = null;
    this.state = LSPConnectionState.Closed;
    this.serverCapabilities = null;
  }

  /**
   * Dispose of the bridge and clean up resources
   */
  async dispose(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Send a request to the LSP server and return the result
   *
   * @param method - LSP method name
   * @param params - Method parameters
   * @returns Promise resolving to the response result
   */
  async request<T>(method: string, params?: unknown): Promise<T> {
    return this.sendRequest<T>(method, params);
  }
}

export default LSPBridge;
