# JClaw 测试指南

## 快速测试

### 1. 运行所有测试

```bash
# 根目录
npm test

# 或单独测试某个包
cd packages/core
npm test

# 查看测试覆盖率
npm run test:coverage
```

### 2. 测试 CLI

```bash
cd packages/core

# 查看帮助
node dist/cli/index.js --help

# 查看版本
node dist/cli/index.js --version

# 执行任务（Phase 1 为占位符）
node dist/cli/index.js exec "分析项目结构"

# 配置管理
node dist/cli/index.js config
node dist/cli/index.js config get execution.mode
node dist/cli/index.js config set execution.mode local
```

### 3. 测试构建

```bash
# 构建所有包
npm run build

# 单独构建核心包
cd packages/core
npm run build

# 检查 TypeScript 编译
npx tsc --noEmit
```

### 4. 测试代码质量

```bash
# ESLint 检查
npm run lint

# Prettier 格式检查
npm run format
```

---

## 单元测试测试范围

### @jclaw/core

| 模块                  | 测试文件                                           | 测试内容                 |
| --------------------- | -------------------------------------------------- | ------------------------ |
| **LocalExecutor**     | `tests/executor/local.test.ts`                     | 命令执行、超时、错误处理 |
| **MockClient**        | `tests/context/mock-client.test.ts`                | 上下文管理、内存存储     |

| **ExtensionRegistry** | `tests/extension-system/registry.test.ts`          | 扩展注册、查询           |
| **ExtensionLoader**   | `tests/extension-system/loader.test.ts`            | 扩展加载、卸载           |
| **CapabilityRouter**  | `tests/extension-system/capability-router.test.ts` | 能力路由                 |
| **CLI**               | `tests/cli/index.test.ts`                          | 命令行参数解析           |
| **集成测试**          | `tests/integration/executor-context.test.ts`       | 组件联动                 |

### @jclaw/extension-opencode

| 模块                | 测试文件                    | 测试内容           |
| ------------------- | --------------------------- | ------------------ |
| **OpenCodeAdapter** | `tests/adapter.test.ts`     | CLI 调用封装       |
| **Extension**       | `tests/index.test.ts`       | 扩展入口、能力定义 |
| **集成测试**        | `tests/integration.test.ts` | 与核心集成         |

### @jclaw/extension-nanoclaw

| 模块                | 测试文件                       | 测试内容           |
| ------------------- | ------------------------------ | ------------------ |
| **NanoClawAdapter** | `tests/adapter.test.ts`        | WhatsApp 消息发送  |
| **MessageRouter**   | `tests/message-router.test.ts` | 消息路由、模式匹配 |
| **Extension**       | `tests/index.test.ts`          | 扩展入口、能力定义 |
| **集成测试**        | `tests/integration.test.ts`    | 与核心集成         |

---

## 手动测试场景

### 场景 1: 测试 LocalExecutor

```typescript
import { LocalExecutor } from '@jclaw/core';

const executor = new LocalExecutor();

// 测试基本命令
const result = await executor.execute('echo hello');
console.log(result.stdout); // "hello"

// 测试超时
try {
  await executor.execute('sleep 10', { timeout: 1000 });
} catch (error) {
  console.log('Timeout error:', error.message);
}
```

### 场景 2: 测试 MockClient

```typescript
import { MockClient } from '@jclaw/core';

const client = new MockClient();

// 测试连接
await client.connect();
console.log(client.isConnected()); // true

// 测试查询
const response = await client.query('test question');
console.log(response); // "Mock response for: test question"

// 测试添加资源
const id = await client.addResource('/test/path');
console.log(id); // "mock-xxx"

await client.disconnect();
```

### 场景 3: 测试扩展系统

```typescript
import {
  ExtensionRegistry,
  ExtensionLoader,
  CapabilityRouter,
  opencodeExtension,
  nanoclawExtension,
} from '...';

// 注册扩展
const registry = new ExtensionRegistry();
await registry.register(opencodeExtension);

// 查询能力
const hasCapability = registry.hasCapability('code_edit');
console.log(hasCapability); // true

// 解析能力
const resolved = registry.getCapability('code_edit');
console.log(resolved.extension); // "opencode"
```

### 场景 4: 测试消息路由器

```typescript
import { MessageRouter } from '@jclaw/extension-nanoclaw';

const router = new MessageRouter();

// 添加规则
router.addRule({
  pattern: '@jclaw',
  handler: async (msg) => {
    console.log('JClaw mentioned:', msg.content);
  },
});

// 路由消息
await router.route({
  from: 'user@s.whatsapp.net',
  content: '@jclaw 检查测试覆盖率',
});
```

---

## 集成测试

### 测试完整工作流

```typescript
import {
  LocalExecutor,
  MockClient,
  ExtensionRegistry,
  opencodeExtension,
} from '...';

async function testFullWorkflow() {
  // 1. 初始化组件
  const executor = new LocalExecutor();
  const context = new MockClient();
  const registry = new ExtensionRegistry();

  // 2. 连接上下文
  await context.connect();

  // 3. 注册扩展
  await registry.register(opencodeExtension);

  // 4. 执行命令
  const result = await executor.execute('echo test');
  console.log('Executor:', result.stdout.trim());

  // 5. 存储到上下文
  await context.addResource('/test/result.txt');

  // 6. 验证能力
  const hasEdit = registry.hasCapability('code_edit');
  console.log('Has code_edit:', hasEdit);

  // 7. 清理
  await context.disconnect();
}

testFullWorkflow();
```

---

## 性能测试

### 测试执行器性能

```typescript
import { LocalExecutor } from '@jclaw/core';

const executor = new LocalExecutor();
const iterations = 100;

console.time('executor-performance');

for (let i = 0; i < iterations; i++) {
  await executor.execute('echo test');
}

console.timeEnd('executor-performance');
// 预期：100 次执行 < 5 秒
```

---

## Windows 兼容性测试

在 Windows 上运行以下测试：

```bash
# 1. 构建
npm run build

# 2. 运行测试
npm test

# 3. 测试 CLI
cd packages/core
node dist/cli/index.js --help

# 4. 测试路径处理
node -e "console.log(require('path').join('test', 'path'))"
```

---

## 持续集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm test

      - name: Lint
        run: npm run lint
```

---

## 常见问题

### Q: 测试失败怎么办？

```bash
# 1. 清理缓存
npm run clean

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 重新构建
npm run build

# 4. 运行测试
npm test
```

### Q: 如何调试测试？

```bash
# 使用 --verbose 模式
npm test -- --verbose

# 使用 --testNamePattern 运行特定测试
npm test -- --testNamePattern="should execute basic command"

# 使用 --coverage 查看覆盖率
npm test -- --coverage
```


---

## 测试清单

- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] CLI 命令正常工作
- [ ] 构建成功无错误
- [ ] ESLint 检查通过
- [ ] 代码覆盖率 > 80%
- [ ] Windows 兼容性验证
- [ ] macOS 兼容性验证
- [ ] Linux 兼容性验证

---

**参考**: [JClaw GitHub](https://github.com/jabing/jclaw)
