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

export {
  EvoMapClient,
  createEvoMapClient,
  type EvoMapConfig,
  type GeneResponse,
} from './client.js';

// A2A Network Components (Wave 4)
export {
  A2AClient,
  type A2AClientConfig,
  type ConnectionStatus,
} from './a2a-client.js';
export {
  A2AServer,
  type A2AServerConfig,
  type ConnectedAgent,
} from './a2a-server.js';
export {
  AgentDiscovery,
  type DiscoveryResult,
  type DiscoveryConfig,
} from './agent-discovery.js';
