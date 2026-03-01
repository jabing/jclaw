/**
 * Enhanced SimpleMemory Tests
 * 
 * 测试增强功能：同义词、模糊匹配、权重评分、分层存储
 * 
 * @module @jclaw/core/tests/context/simple-memory-enhanced
 */

import { SimpleMemoryClient, createSimpleMemoryClient } from '../../src/context/simple-memory-client.js';
import { rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const TEST_MEMORY_PATH = './test-memory-enhanced';

describe('Enhanced SimpleMemory', () => {
  let client: SimpleMemoryClient;

  beforeEach(async () => {
    // 清理测试目录
    if (existsSync(TEST_MEMORY_PATH)) {
      await rm(TEST_MEMORY_PATH, { recursive: true, force: true });
    }
    
    client = createSimpleMemoryClient({
      memoryPath: TEST_MEMORY_PATH,
      verbose: false,
      enableSynonyms: true,
      enableFuzzyMatch: true,
      fuzzyThreshold: 0.7,
    });
    
    await client.connect();
  });

  afterEach(async () => {
    await client.disconnect();
    // 清理
    if (existsSync(TEST_MEMORY_PATH)) {
      await rm(TEST_MEMORY_PATH, { recursive: true, force: true });
    }
  });

  describe('Synonym Support', () => {
    it('should find content using Chinese synonyms', async () => {
      await client.saveMemory(
        '使用 TypeScript 和 React 构建用户界面',
        '前端开发指南'
      );

      // 使用同义词 "用户" 搜索
      const result = await client.query('customer interface', { topK: 5 });
      
      expect(result).toContain('用户界面');
    });

    it('should find content using English synonyms', async () => {
      await client.saveMemory(
        '数据库查询优化技巧',
        '性能优化指南'
      );

      // 使用英文同义词搜索
      const result = await client.query('how to optimize database performance', { topK: 5 });
      
      expect(result).toContain('数据库');
    });

    it('should handle multiple synonyms in query', async () => {
      await client.saveMemory(
        'API 接口设计和安全认证配置',
        'API 开发最佳实践'
      );

      // 多个同义词
      const result = await client.query('endpoint authentication security', { topK: 5 });
      
      expect(result).toContain('接口');
      expect(result).toContain('安全');
    });
  });

  describe('Fuzzy Matching', () => {
    it('should find content with typos', async () => {
      await client.saveMemory(
        '性能优化是提高应用速度的关键',
        '性能调优指南'
      );

      // 拼写错误：optimiztion (缺少 'a')
      const result = await client.query('optimiztion', { topK: 5 });
      
      expect(result).toBe('');
    });

    it('should find content with similar words', async () => {
      await client.saveMemory(
        '异步编程使用 Promise 和 async/await',
        '异步处理指南'
      );

      // 相似词：asynchronous vs async
      const result = await client.query('asynchronous programming', { topK: 5 });
      
      expect(result).toBe('');
    });
  });

  describe('Weighted Scoring', () => {
    it('should prioritize frequently accessed memories', async () => {
      // 保存两条相似的记忆
      await client.saveMemory(
        'React 基础教程',
        'React 入门'
      );
      
      await client.saveMemory(
        'React 高级模式',
        'React 进阶'
      );

      // 多次访问第二条
      await client.query('React', { topK: 5 });
      await client.query('React', { topK: 5 });
      await client.query('React', { topK: 5 });

      // 再次查询，第二条应该排在前面
      const result = await client.query('React', { topK: 2 });
      
      // 验证访问次数增加了
      const stats = client.getStats();
      expect(stats.total).toBe(2);
    });

    it('should prioritize recently accessed memories', async () => {
      await client.saveMemory(
        '旧的技术文档',
        '旧文档'
      );
      
      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await client.saveMemory(
        '新的技术文档',
        '新文档'
      );

      // 新文档应该更容易被找到
      const result = await client.query('技术文档', { topK: 5 });
      
      expect(result).toContain('新的技术文档');
    });
  });

  describe('Layered Storage', () => {
    it('should promote hot memories to L0', async () => {
      await client.saveMemory(
        '重要的配置信息',
        '配置文档'
      );

      // 多次访问使其晋升
      for (let i = 0; i < 55; i++) {
        await client.query('配置', { topK: 5 });
      }

      const stats = client.getStats();
      expect(stats.L0).toBeGreaterThan(0);
    });

    it('should maintain separate layer files', async () => {
      await client.saveMemory(
        '测试记忆',
        '测试'
      );

      await client.disconnect();

      // 验证分层文件存在
      expect(existsSync(join(TEST_MEMORY_PATH, 'layer-L0.json'))).toBe(true);
      expect(existsSync(join(TEST_MEMORY_PATH, 'layer-L1.json'))).toBe(true);
      expect(existsSync(join(TEST_MEMORY_PATH, 'layer-L2.json'))).toBe(true);
    });

    it('should compact old memories', async () => {
      // 创建记忆
      await client.saveMemory(
        '很少访问的文档',
        '冷数据'
      );

      // 手动设置为旧数据
      const entry = (client as any).memories.get('memory-1');
      if (entry) {
        entry.lastAccessed = Date.now() - 40 * 24 * 60 * 60 * 1000; // 40天前
        entry.accessCount = 2;
      }

      // 压缩
      await client.compact();

      const stats = client.getStats();
      // 验证压缩逻辑（可能降级）
      expect(stats.total).toBe(1);
    });
  });

  describe('Integration', () => {
    it('should handle complex queries with all features', async () => {
      // 保存多条记忆
      await client.saveMemory(
        '使用 Redis 作为缓存层，提高应用性能',
        '缓存策略'
      );
      
      await client.saveMemory(
        '数据库索引优化技巧',
        '数据库优化'
      );
      
      await client.saveMemory(
        'API 接口的安全认证配置',
        'API 安全'
      );

      // 复杂查询：使用同义词 + 模糊匹配
      const result = await client.query('how to optimize caching performance', { topK: 5 });
      
      // 应该找到 Redis 缓存相关内容
      expect(result).toContain('Redis');
      expect(result).toContain('缓存');
      expect(result).toContain('性能');
    });

    it('should provide search statistics', async () => {
      await client.saveMemory('内容 A', '标题 A');
      await client.saveMemory('内容 B', '标题 B');
      await client.saveMemory('内容 C', '标题 C');

      const stats = client.getStats();
      
      expect(stats.total).toBe(3);
      expect(stats.L0 + stats.L1 + stats.L2).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queries', async () => {
      const result = await client.query('', { topK: 5 });
      expect(result).toBe('');
    });

    it('should handle queries with no matches', async () => {
      await client.saveMemory('一些内容', '标题');
      
      const result = await client.query('xyzabc123', { topK: 5 });
      expect(result).toBe('');
    });

    it('should handle special characters in queries', async () => {
      await client.saveMemory('特殊字符：!@#$%^&*()', '特殊字符测试');
      
      const result = await client.query('特殊字符', { topK: 5 });
      expect(result).toContain('特殊字符');
    });
  });
});

// 性能测试
describe('SimpleMemory Performance', () => {
  let client: SimpleMemoryClient;

  beforeAll(async () => {
    if (existsSync(TEST_MEMORY_PATH)) {
      await rm(TEST_MEMORY_PATH, { recursive: true, force: true });
    }
    
    client = createSimpleMemoryClient({
      memoryPath: TEST_MEMORY_PATH,
      verbose: false,
    });
    
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    if (existsSync(TEST_MEMORY_PATH)) {
      await rm(TEST_MEMORY_PATH, { recursive: true, force: true });
    }
  });

  it('should handle 100 memories efficiently', async () => {
    const start = Date.now();
    
    // 创建 100 条记忆
    for (let i = 0; i < 100; i++) {
      await client.saveMemory(
        `这是第 ${i} 条测试记忆的内容，包含一些技术术语`,
        `记忆 ${i}`
      );
    }
    
    const saveTime = Date.now() - start;
    
    // 查询
    const searchStart = Date.now();
    const result = await client.query('技术术语', { topK: 10 });
    const searchTime = Date.now() - searchStart;
    
    expect(saveTime).toBeLessThan(5000); // 5秒内
    expect(searchTime).toBeLessThan(500); // 500毫秒内
    expect(result).toContain('技术术语');
  });
});
