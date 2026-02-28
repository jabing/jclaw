# JClaw 技能系统详解

## 概述

JClaw 拥有双重技能获取机制：
1. **skill.sh 社区技能** - 复用 250k+ 现有技能
2. **AutoSkill 自生成** - 按需生成新技能

## 架构

```
用户请求
    ↓
JClawAgent.execute()
    ↓
执行失败
    ↓
[Step 1] Skill Discovery
    ├─ 搜索 skill.sh API
    ├─ 搜索本地注册表
    ├─ 质量评估和排序
    └─ 推荐最佳匹配
    ↓
置信度 > 60%?
    ├─ 是 → 安装 skill.sh skill → 重试
    └─ 否 → [Step 2] AutoSkill
                ├─ 发现能力缺口
                ├─ 匹配模板（如有）
                ├─ LLM 生成代码
                ├─ 编译和安装
                └─ 重试任务
```

## skill.sh 集成

### 配置

```typescript
const agent = new JClawAgent({
  skillShConfig: {
    apiBase: 'https://api.skills.sh/v1',
    enableCache: true,
    cacheTtl: 24 * 60 * 60 * 1000, // 24 小时
    timeout: 30000,
  }
});
```

### API

```typescript
// 搜索技能
const results = await skillShAdapter.search({
  query: 'github integration',
  limit: 10,
  sortBy: 'quality',
});

// 获取技能详情
const detail = await skillShAdapter.getSkill('owner/repo');

// 安装技能
const result = await skillShAdapter.installSkill('owner/repo');
```

### 缓存系统

```typescript
// 缓存统计
const stats = getCacheStats();
console.log(stats); // { size: 50, keys: [...] }

// 清除缓存
clearSkillShCache();
```

## AutoSkill 系统

### 代码模板

预置模板：
- `http_client` - HTTP 请求能力
- `file_operations` - 文件操作能力

```typescript
// 使用模板
const template = CODE_TEMPLATES['http_client'];

// 添加自定义模板
import { addCodeTemplate } from '@jclaw/core/auto-skill';

addCodeTemplate('my_capability', `
  // 模板代码...
`);

// 查看可用模板
const templates = getAvailableTemplates();
```

### 代码生成流程

```typescript
// 1. 发现能力缺口
const gaps = await autoSkillGenerator.discoverCapabilities(task);

// 2. 生成扩展代码（模板优先）
const result = await autoSkillGenerator.generateExtension(gap);

// 3. 优化代码（EvolutionEngine）
if (config.enableEvolution) {
  code = await autoSkillGenerator.optimizeCode(code, gap);
}

// 4. 验证代码
const validation = await autoSkillGenerator.validateCode(code);

// 5. 保存扩展
const path = await autoSkillGenerator.saveExtension(extension);
```

### 质量评估

6 维度评估系统：
1. **代码质量** - 类型安全、错误处理
2. **文档完整性** - 注释、示例
3. **测试覆盖** - 单元测试
4. **社区健康** - stars、downloads
5. **安全性** - 无漏洞
6. **综合评分** - 0-100

## 使用示例

### 示例 1: 自动技能发现

```typescript
const agent = new JClawAgent({
  enableAutoSkill: true,
  skillShConfig: { enableCache: true }
});

await agent.start();

// 执行任务 - AutoSkill 会自动发现所需技能
await agent.execute({
  id: 'task-1',
  prompt: 'Create a GitHub issue with title and description'
});

// 自动流程：
// 1. 尝试执行 → 失败（没有 GitHub 能力）
// 2. 搜索 skill.sh → 找到 github-integration
// 3. 评估质量 → 85/100
// 4. 安装技能 → 注册到系统
// 5. 重试任务 → 成功 ✅
```

### 示例 2: 自定义技能生成

```typescript
// 当 skill.sh 没有找到合适技能时
await agent.execute({
  id: 'task-1',
  prompt: 'Connect to our internal API with custom authentication'
});

// AutoSkill 会自动：
// 1. 搜索 skill.sh → 未找到高置信度匹配
// 2. 分析需求 → 发现需要 custom_auth capability
// 3. 检查模板 → 无匹配
// 4. LLM 生成代码 → 完整的 TypeScript 扩展
// 5. 编译安装 → 立即可用
```

### 示例 3: 模板优先

```typescript
// 使用预定义模板生成
await agent.execute({
  id: 'task-1',
  prompt: 'Make HTTP requests to external API'
});

// AutoSkill 会：
// 1. 发现需要 http_client capability
// 2. 匹配模板 → http_client 模板
// 3. 使用模板 → 高质量代码
// 4. 优化代码 → EvolutionEngine
// 5. 安装使用 ✅
```

## 最佳实践

### 1. 先搜索社区

```typescript
// 优先使用 skill.sh 社区技能
const discovery = await skillDiscovery.discover(query);

if (discovery.confidence > 0.6) {
  // 使用社区技能
  await skillDiscovery.installSkill(discovery.recommended);
} else {
  // 回退到 AutoSkill
  await agent.executeWithAutoSkill(task);
}
```

### 2. 模板优先

```typescript
// 常见能力使用模板
const template = findTemplateForCapability(capability);
if (template) {
  // 使用预定义模板（质量更高）
  code = CODE_TEMPLATES[template];
} else {
  // LLM 生成
  code = await generateCode(gap);
}
```

### 3. 代码优化

```typescript
// 启用 EvolutionEngine 优化
if (config.enableEvolution) {
  code = await optimizeCode(code, gap);
}

// 优化重点：
// - 错误处理
// - 类型安全
// - 性能
// - 可读性
```

## 故障排除

### 问题 1: skill.sh API 调用失败

```typescript
// 检查网络
try {
  await skillShAdapter.search({ query: 'test' });
} catch (error) {
  console.error('API 调用失败:', error);
  // 回退到 AutoSkill
  await agent.executeWithAutoSkill(task);
}
```

### 问题 2: 代码生成质量不佳

```typescript
// 1. 添加更多模板
addCodeTemplate('my_cap', highQualityTemplate);

// 2. 启用 EvolutionEngine
const agent = new JClawAgent({
  enableAutoSkill: true,
  autoSkillConfig: { enableEvolution: true }
});

// 3. 手动优化
const result = await autoSkillGenerator.generateExtension(gap);
if (result.quality < 0.7) {
  // 重新生成
  return autoSkillGenerator.generateExtension(gap, attempt + 1);
}
```

## 性能优化

### 缓存策略

```typescript
// 配置缓存
const agent = new JClawAgent({
  skillShConfig: {
    enableCache: true,
    cacheTtl: 24 * 60 * 60 * 1000, // 24 小时
  }
});

// 定期清理过期缓存
setInterval(() => {
  clearSkillShCache();
}, 24 * 60 * 60 * 1000);
```

### 并行搜索

```typescript
// 并行搜索多个来源
const [skillShResults, communityResults, localResults] = await Promise.all([
  searchSkillSh(query),
  searchCommunity(query),
  searchLocal(query),
]);
```

## 总结

JClaw 的技能系统提供：
- ✅ **渐进式获取** - 先社区再生成
- ✅ **质量保证** - 6 维度评估
- ✅ **高性能** - 智能缓存
- ✅ **灵活扩展** - 自定义模板

**核心理念：** 复用 > 生成
