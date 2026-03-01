/**
 * A2A/GEP Protocol
 *
 * Protocol definitions for agent-to-agent communication.
 *
 * @module @jclaw/core/network/protocol
 */

/**
 * A2A Message types
 */
export type A2AMessageType =
  | 'greeting'
  | 'gene_share'
  | 'gene_request'
  | 'gene_response'
  | 'task_delegate'
  | 'task_result'
  | 'heartbeat'
  | 'goodbye';

/**
 * A2A Protocol message
 */
export interface A2AMessage {
  /** Protocol version */
  version: string;
  /** Message type */
  type: A2AMessageType;
  /** Sender agent ID */
  from: string;
  /** Recipient agent ID (or 'broadcast') */
  to: string;
  /** Message payload */
  payload: unknown;
  /** Message timestamp */
  timestamp: number;
  /** Message ID for tracking */
  messageId: string;
}

/**
 * GEP (Gene Exchange Protocol) packet
 */
export interface GEPPacket {
  /** Protocol version */
  version: string;
  /** Gene ID */
  geneId: string;
  /** Gene type */
  geneType: 'behavior' | 'knowledge' | 'skill';
  /** Gene data (compressed/encoded) */
  data: string;
  /** Gene metadata */
  metadata: {
    fitness: number;
    generation: number;
    parents: string[];
    checksum: string;
  };
  /** Timestamp */
  timestamp: number;
}

/**
 * Node registration info
 */
export interface NodeInfo {
  /** Node ID */
  id: string;
  /** Node name */
  name: string;
  /** Node version */
  version: string;
  /** Node capabilities */
  capabilities: string[];
  /** Endpoint URL */
  endpoint: string;
  /** Last heartbeat */
  lastSeen: number;
}

/**
 * Gene share payload
 */
export interface GeneSharePayload {
  /** Genes to share */
  genes: GEPPacket[];
  /** Request acknowledgment */
  requireAck: boolean;
}

/**
 * Gene request payload
 */
export interface GeneRequestPayload {
  /** Gene types to request */
  types?: ('behavior' | 'knowledge' | 'skill')[];
  /** Minimum fitness threshold */
  minFitness?: number;
  /** Maximum genes to return */
  limit?: number;
  /** Specific gene IDs to request */
  geneIds?: string[];
}

/**
 * Task delegation payload
 */
export interface TaskDelegatePayload {
  /** Task ID */
  taskId: string;
  /** Task description */
  description: string;
  /** Required capabilities */
  requiredCapabilities: string[];
  /** Task deadline */
  deadline?: number;
  /** Priority (1-10) */
  priority?: number;
}

/**
 * A2A Protocol helper functions
 */
export class A2AProtocol {
  private static VERSION = '1.0.0';

  /**
   * Create a new A2A message.
   */
  static createMessage(
    type: A2AMessageType,
    from: string,
    to: string,
    payload: unknown
  ): A2AMessage {
    return {
      version: A2AProtocol.VERSION,
      type,
      from,
      to,
      payload,
      timestamp: Date.now(),
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
  }

  /**
   * Create a greeting message.
   */
  static createGreeting(from: string, to: string, nodeInfo: NodeInfo): A2AMessage {
    return A2AProtocol.createMessage('greeting', from, to, nodeInfo);
  }

  /**
   * Create a gene share message.
   */
  static createGeneShare(
    from: string,
    to: string,
    genes: GEPPacket[],
    requireAck = false
  ): A2AMessage {
    const payload: GeneSharePayload = { genes, requireAck };
    return A2AProtocol.createMessage('gene_share', from, to, payload);
  }

  /**
   * Create a gene request message.
   */
  static createGeneRequest(
    from: string,
    to: string,
    request: GeneRequestPayload
  ): A2AMessage {
    return A2AProtocol.createMessage('gene_request', from, to, request);
  }

  /**
   * Create a task delegation message.
   */
  static createTaskDelegate(
    from: string,
    to: string,
    task: TaskDelegatePayload
  ): A2AMessage {
    return A2AProtocol.createMessage('task_delegate', from, to, task);
  }

  /**
   * Create a heartbeat message.
   */
  static createHeartbeat(from: string, to: string): A2AMessage {
    return A2AProtocol.createMessage('heartbeat', from, to, { timestamp: Date.now() });
  }

  /**
   * Validate an A2A message.
   */
  static validate(message: A2AMessage): boolean {
    if (!message.version || !message.type || !message.from || !message.to) {
      return false;
    }
    if (!message.timestamp || !message.messageId) {
      return false;
    }
    return true;
  }
}

/**
 * GEP Protocol helper functions
 */
export class GEPProtocol {
  private static VERSION = '1.0.0';

  /**
   * Create a GEP packet from gene data.
   */
  static createPacket(
    geneId: string,
    geneType: 'behavior' | 'knowledge' | 'skill',
    data: string,
    metadata: Omit<GEPPacket['metadata'], 'checksum'>
  ): GEPPacket {
    const checksum = GEPProtocol.calculateChecksum(data);
    return {
      version: GEPProtocol.VERSION,
      geneId,
      geneType,
      data,
      metadata: { ...metadata, checksum },
      timestamp: Date.now(),
    };
  }

  /**
   * Validate a GEP packet.
   */
  static validate(packet: GEPPacket): boolean {
    if (!packet.version || !packet.geneId || !packet.geneType || !packet.data) {
      return false;
    }
    if (!packet.metadata || !packet.timestamp) {
      return false;
    }
    // Verify checksum
    const expectedChecksum = GEPProtocol.calculateChecksum(packet.data);
    return packet.metadata.checksum === expectedChecksum;
  }

  /**
   * Calculate checksum for data integrity.
   */
  private static calculateChecksum(data: string): string {
    // Simple hash function for checksum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
