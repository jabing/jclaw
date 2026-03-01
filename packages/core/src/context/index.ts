/**
 * Context Module
 */

// MemSearch-TS (推荐 - 纯 TypeScript，零 Python 依赖，语义搜索)
export { MemSearchTsClient, type MemSearchTsConfig, createMemSearchTsClient } from './memsearch-ts-client.js';

// SimpleMemory (备选 - 纯 JavaScript，无需向量数据库)
export { SimpleMemoryClient, type SimpleMemoryConfig, createSimpleMemoryClient } from './simple-memory-client.js';

// MemSearch (已弃用 - 需要 Python)
// export { MemSearchClient, type MemSearchConfig, createMemSearchClient } from './memsearch-client.js';

// OpenViking (已弃用 - 需要 Docker)
// export { OpenVikingClient, type OpenVikingConfig } from './openviking-client.js';

export { MockClient } from './mock-client.js';
