/**
 * Network Module
 *
 * Provides networking capabilities for EvoMap integration.
 *
 * @module @jclaw/core/network
 */

export {
  A2AProtocol,
  GEPProtocol,
  type A2AMessage,
  type A2AMessageType,
  type GEPPacket,
  type NodeInfo,
  type GeneSharePayload,
  type GeneRequestPayload,
  type TaskDelegatePayload,
} from './protocol.js';

export { EvoMapClient, createEvoMapClient, type EvoMapConfig, type GeneResponse } from './client.js';
