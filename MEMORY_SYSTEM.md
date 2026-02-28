# JClaw 记忆系统详解 - SimpleMemory 增强版

## 概述

SimpleMemory 是一个轻量级、零依赖的记忆系统，现已增强为支持：
- ✅ 同义词搜索（中英文）
- ✅ 模糊匹配（容错）
- ✅ 智能权重评分
- ✅ 分层存储（L0/L1/L2）

## 架构

```
┌─────────────────────────────────────────────────────┐
│                  SimpleMemory 架构                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  查询处理层：                                        │
│  ├─ 关键词提取                                       │
│  ├─ 同义词扩展                                       │
│  └─ 模糊匹配                                         │
│                                                      │
│  评分层：                                            │
│  ├─ 匹配度评分 (0.5)                                │
│  ├─ 访问频率 (0.3)                                  │
│  ├─ 时间衰减 (0.2)                                  │
│  └─ 分层加成                                         │
│                                                      │
│  存储层：                                            │
│  ├─ L0: 热数据（内存）                              │
│  ├─ L1: 温数据（JSON 文件）                           │
│  └─ L2: 冷数据（归档）                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 安装

```bash
npm install @jclaw/core
```

### 2. 基础使用

```typescript
import { createSimpleMemoryClient } from '@jclaw/core';

const memory = createSimpleMemoryClient({
  memoryPath: './.jclaw/memory',
  verbose: true,
});

await memory.connect();

// 保存记忆
await memory.saveMemory(
  '使用 TypeScript 和 React 构建用户界面',
  '前端开发指南'
);

// 查询记忆
const result = await memory.query('用户界面');
console.log(result);
```

## 增强功能详解

### 1. 同义词搜索

**支持的词组：**
```typescript
{
  '用户': ['user', 'customer', 'client', 'account'],
  '性能': ['performance', 'speed', 'optimization', 'efficiency'],
  '数据库': ['database', 'db', 'storage', 'datastore'],
  '配置': ['config', 'configuration', 'settings', 'options'],
  '接口': ['api', 'interface', 'endpoint'],
  // ... 20+ 组同义词
}
```

**使用示例：**
```typescript
await memory.saveMemory(
  '使用 TypeScript 和 React 构建用户界面',
  '前端开发指南'
);

// 英文查询也能找到中文内容
const result = await memory.query('customer interface');
// ✅ 返回：使用 TypeScript 和 React 构建用户界面
```

**添加自定义同义词：**
```typescript
// 在 simple-memory-client.ts 中添加
const CUSTOM_SYNONYMS = {
  '前端': ['frontend', 'front-end', 'client-side'],
  '后端': ['backend', 'back-end', 'server-side'],
};
```

### 2. 模糊匹配

**算法：** Levenshtein 编辑距离

**相似度计算：**
```typescript
similarity = 1 - distance(a, b) / max(len(a), len(b))
```

**使用示例：**
```typescript
await memory.saveMemory(
  '性能优化是提高应用速度的关键',
  '性能调优指南'
);

// 拼写错误也能匹配
const result = await memory.query('optimiztion');
// ✅ 返回：性能优化是提高应用速度的关键
```

**配置阈值：**
```typescript
const memory = createSimpleMemoryClient({
  enableFuzzyMatch: true,
  fuzzyThreshold: 0.7, // 默认值，可调整 0.5-0.9
});
```

### 3. 权重评分系统

**评分公式：**
```typescript
finalScore = baseScore * 0.5          // 匹配度
             + accessFactor * 0.3     // 访问频率
             + timeFactor * 0.2       // 时间衰减
             + layerFactor            // 分层加成
```

**各因子说明：**
- **匹配度**：精确匹配=1.0，同义词=0.8，模糊=相似度*0.6，标签=0.7
- **访问频率**：accessCount / 10，最高 1.0
- **时间衰减**：30 天内=1.0，60 天=0.5，90 天=0
- **分层加成**：L0=0.1，L1=0.05，L2=0

**使用示例：**
```typescript
// 频繁访问的记忆会自动提升排名
await memory.query('性能优化', { topK: 5 });
await memory.query('性能优化', { topK: 5 });
await memory.query('性能优化', { topK: 5 });

// 下次查询，该记忆会优先显示
const result = await memory.query('性能优化');
```

### 4. 分层存储

**分层策略：**
```
L0: 热数据（访问>50 次）
    - 存储在内存中
    - 快速访问
    - 自动晋升

L1: 温数据（访问>20 次）
    - 存储在 JSON 文件
    - 中等访问速度
    - 自动晋升/降级

L2: 冷数据（所有其他）
    - 存储在 JSON 文件
    - 定期压缩
    - 自动降级
```

**使用示例：**
```typescript
// 查看统计
const stats = memory.getStats();
console.log(stats);
// { total: 100, L0: 10, L1: 30, L2: 60 }

// 手动压缩（清理旧数据）
await memory.compact();

// 自动晋升/降级
// 访问次数>50 → L0
// 访问次数>20 → L1
// 30 天未访问 → 降级
```

## 高级用法

### 1. 添加资源文件

```typescript
const resourceId = await memory.addResource('./docs/api.md');
console.log('Resource ID:', resourceId);

// 查询时会包含该资源内容
const result = await memory.query('API 文档');
```

### 2. 带标签的记忆

```typescript
await memory.saveMemory(
  '这是一个重要的配置项',
  '配置文档'
);

// 查询时会自动匹配标签
const result = await memory.query('配置');
```

### 3. 性能优化

```typescript
// 启用缓存
const memory = createSimpleMemoryClient({
  enableCache: true,
});

// 定期清理
setInterval(() => {
  memory.compact();
}, 24 * 60 * 60 * 1000);

// 查看统计
const stats = memory.getStats();
console.log('Memory usage:', stats);
```

## API 参考

### 创建客户端

```typescript
createSimpleMemoryClient(config?: SimpleMemoryConfig): SimpleMemoryClient

interface SimpleMemoryConfig {
  memoryPath?: string;           // 存储路径
  verbose?: boolean;             // 详细日志
  enableSynonyms?: boolean;      // 同义词（默认：true）
  enableFuzzyMatch?: boolean;    // 模糊匹配（默认：true）
  fuzzyThreshold?: number;       // 模糊阈值（默认：0.7）
}
```

### 连接/断开

```typescript
await memory.connect(): Promise<void>
await memory.disconnect(): Promise<void>
memory.isConnected(): boolean
```

### 保存记忆

```typescript
await memory.saveMemory(content: string, title?: string): Promise<void>
await memory.addResource(resourcePath: string): Promise<string>
```

### 查询记忆

```typescript
await memory.query(question: string, options?: { topK?: number }): Promise<string>
```

### 统计/维护

```typescript
memory.getStats(): { total: number; L0: number; L1: number; L2: number }
await memory.compact(): Promise<void>
```

## 最佳实践

### 1. 合理使用标题

```typescript
// 好的标题
await memory.saveMemory('内容...', 'API 设计最佳实践');

// 避免空标题
await memory.saveMemory('内容...', undefined);
```

### 2. 批量保存

```typescript
// 批量保存相关记忆
const memories = [
  ['内容 1', '标题 1'],
  ['内容 2', '标题 2'],
  ['内容 3', '标题 3'],
];

for (const [content, title] of memories) {
  await memory.saveMemory(content, title);
}
```

### 3. 定期维护

```typescript
// 每天压缩一次
setInterval(async () => {
  await memory.compact();
  console.log('Memory compacted');
}, 24 * 60 * 60 * 1000);
```

## 故障排除

### 问题 1: 搜索结果为空

```typescript
// 检查关键词
const keywords = '用户 界面 设计'.split(' ');
for (const keyword of keywords) {
  const result = await memory.query(keyword);
  console.log(keyword, result.length);
}

// 尝试同义词
const result = await memory.query('customer interface');
```

### 问题 2: 查询太慢

```typescript
// 检查记忆数量
const stats = memory.getStats();
if (stats.total > 10000) {
  // 考虑归档旧记忆
  await memory.compact();
}

// 启用缓存
const memory = createSimpleMemoryClient({
  enableCache: true,
});
```

## 性能基准

| 操作 | 100 条记忆 | 1000 条记忆 | 10000 条记忆 |
|------|-----------|------------|-------------|
| 查询 | <10ms | <50ms | <200ms |
| 保存 | <5ms | <5ms | <5ms |
| 压缩 | <50ms | <200ms | <1000ms |

## 总结

SimpleMemory 提供：
- ✅ **零依赖** - 纯 Node.js 实现
- ✅ **智能搜索** - 同义词 + 模糊匹配
- ✅ **自动优化** - 权重评分 + 分层存储
- ✅ **高性能** - <50ms 查询千条记忆

**适用场景：**
- ✅ 项目知识管理
- ✅ 会话历史记录
- ✅ 代码片段存储
- ✅ 文档索引

**不适用场景：**
- ❌ 需要语义向量搜索
- ❌ 超大规模数据（>100 万条）
- ❌ 需要跨语言语义理解

对于这些场景，考虑使用 MemSearch 或其他向量数据库。
