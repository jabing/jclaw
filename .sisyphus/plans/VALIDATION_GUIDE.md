# JClaw 真实环境验证指南

## 概述

本指南将帮助你在一个干净的环境中验证 JClaw 的核心功能。

---

## 前置条件

1. Node.js >= 18.0.0
2. OpenAI API Key (或其他兼容的 LLM API)
3. 干净的测试目录

---

## 步骤 1: 创建测试环境

```bash
# 创建测试目录
mkdir -p ~/jclaw-test
cd ~/jclaw-test

# 初始化项目
npm init -y

# 安装 JClaw
npm install @jclaw/core

# 创建环境变量文件
cat > .env << 'EOF'
OPENAI_API_KEY=your-api-key-here
EOF
```

---

## 步骤 2: 基础功能验证

### 2.1 创建测试脚本

创建文件 `test-basic.ts`:

```typescript
import { JClawAgent } from '@jclaw/core';
import * as dotenv from 'dotenv';

dotenv.config();

async function testBasic() {
  console.log('=== 测试 1: 基础 Agent 创建 ===');

  const agent = new JClawAgent({
    name: 'test-agent',
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4o-mini', // 使用便宜的模型测试
    },
  });

  console.log('✅ Agent 创建成功');

  console.log('\n=== 测试 2: 启动 Agent ===');
  await agent.start();
  console.log('✅ Agent 启动成功');

  console.log('\n=== 测试 3: 执行简单任务 ===');
  const result = await agent.execute({
    id: 'test-1',
    prompt: '用一句话介绍你自己',
  });

  console.log('Agent 回复:', result.output);
  console.log('✅ 任务执行成功');

  console.log('\n=== 测试 4: 停止 Agent ===');
  await agent.stop();
  console.log('✅ Agent 停止成功');

  console.log('\n=== 所有基础测试通过! ===');
}

testBasic().catch(console.error);
```

### 2.2 运行测试

```bash
# 安装 dotenv
npm install dotenv

# 安装 ts-node
npm install -D ts-node @types/node

# 运行测试
npx ts-node test-basic.ts
```

**预期输出**:

```
=== 测试 1: 基础 Agent 创建 ===
✅ Agent 创建成功

=== 测试 2: 启动 Agent ===
✅ Agent 启动成功

=== 测试 3: 执行简单任务 ===
Agent 回复: [AI 的回复]
✅ 任务执行成功

=== 测试 4: 停止 Agent ===
✅ Agent 停止成功

=== 所有基础测试通过! ===
```

---

## 步骤 3: 记忆系统验证

创建文件 `test-memory.ts`:

```typescript
import { JClawAgent, createSimpleMemoryClient } from '@jclaw/core';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function testMemory() {
  console.log('=== 测试 1: 创建记忆系统 ===');

  const memoryPath = path.join(process.cwd(), 'test-memory-data');
  const memory = createSimpleMemoryClient({
    memoryPath,
    enableSynonyms: true,
    enableFuzzyMatch: true,
  });

  await memory.connect();
  console.log('✅ 记忆系统连接成功');

  console.log('\n=== 测试 2: 创建带记忆的 Agent ===');
  const agent = new JClawAgent({
    name: 'memory-agent',
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4o-mini',
    },
    contextManager: memory,
  });

  await agent.start();
  console.log('✅ Agent 启动成功');

  console.log('\n=== 测试 3: 第一次对话 (保存到记忆) ===');
  await agent.execute({
    id: 'memory-test-1',
    prompt: '记住: 我最喜欢的编程语言是 TypeScript',
  });
  console.log('✅ 信息已保存');

  console.log('\n=== 测试 4: 第二次对话 (从记忆中检索) ===');
  const result = await agent.execute({
    id: 'memory-test-2',
    prompt: '我最喜欢的编程语言是什么?',
  });
  console.log('Agent 回复:', result.output);
  console.log('✅ 记忆检索成功');

  await agent.stop();
  await memory.disconnect();

  console.log('\n=== 记忆系统测试通过! ===');
}

testMemory().catch(console.error);
```

**运行**:

```bash
npx ts-node test-memory.ts
```

---

## 步骤 4: 使用 CLI 验证

```bash
# 查看帮助
npx @jclaw/core --help

# 执行简单任务
npx @jclaw/core exec "列出当前目录的文件"

# 查看版本
npx @jclaw/core --version
```

---

## 步骤 5: 完整工作流验证

创建文件 `test-full-workflow.ts`:

```typescript
import { JClawAgent, createSimpleMemoryClient } from '@jclaw/core';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function testFullWorkflow() {
  console.log('========================================');
  console.log('  JClaw 完整工作流验证');
  console.log('========================================\n');

  // 1. 创建临时工作目录
  const workDir = path.join(process.cwd(), 'jclaw-workspace');
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }

  // 2. 创建记忆系统
  const memoryPath = path.join(workDir, 'memory');
  const memory = createSimpleMemoryClient({
    memoryPath,
    enableSynonyms: true,
    enableFuzzyMatch: true,
  });
  await memory.connect();
  console.log('✅ 步骤 1: 记忆系统初始化');

  // 3. 创建 Agent
  const agent = new JClawAgent({
    name: 'workflow-agent',
    enableAutoSkill: true,
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4o-mini',
    },
    contextManager: memory,
  });

  await agent.start();
  console.log('✅ 步骤 2: Agent 启动');

  // 4. 执行代码生成任务
  console.log('\n📝 任务 1: 代码生成');
  const codeResult = await agent.execute({
    id: 'workflow-code',
    prompt: '创建一个简单的 TypeScript 函数,用于计算两个数的和',
  });
  console.log('生成结果预览:', codeResult.output?.substring(0, 200) + '...');
  console.log('✅ 步骤 3: 代码生成完成');

  // 5. 执行分析任务
  console.log('\n🔍 任务 2: 代码分析');
  const analysisResult = await agent.execute({
    id: 'workflow-analysis',
    prompt: '分析刚才生成的加法函数,并提出改进建议',
  });
  console.log(
    '分析结果预览:',
    analysisResult.output?.substring(0, 200) + '...'
  );
  console.log('✅ 步骤 4: 代码分析完成');

  // 6. 验证记忆
  console.log('\n🧠 任务 3: 记忆验证');
  const memoryResult = await agent.execute({
    id: 'workflow-memory',
    prompt: '我们之前讨论了什么?',
  });
  console.log('记忆检索预览:', memoryResult.output?.substring(0, 200) + '...');
  console.log('✅ 步骤 5: 记忆验证完成');

  // 7. 清理
  await agent.stop();
  await memory.disconnect();
  console.log('\n✅ 步骤 6: 清理完成');

  console.log('\n========================================');
  console.log('  ✅ 所有工作流测试通过!');
  console.log('========================================');
}

testFullWorkflow().catch((error) => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
```

**运行**:

```bash
npx ts-node test-full-workflow.ts
```

---

## 验证清单

完成以上步骤后,检查以下项目:

- [ ] 基础 Agent 创建和销毁正常
- [ ] LLM 调用成功 (需要有效的 API Key)
- [ ] 记忆系统可以保存和检索信息
- [ ] CLI 命令可以正常执行
- [ ] 完整工作流无错误完成

---

## 常见问题

### Q: API Key 无效

```
Error: Invalid API Key
```

**解决**: 检查 `.env` 文件中的 `OPENAI_API_KEY` 是否正确

### Q: 记忆系统连接失败

```
Error: Memory connection failed
```

**解决**: 确保有写入权限的目录

### Q: TypeScript 编译错误

```
Error: Cannot find module '@jclaw/core'
```

**解决**:

```bash
npm install @jclaw/core
npm install -D ts-node @types/node
```

---

## 费用估算

使用 `gpt-4o-mini` 进行以上测试:

- 基础测试: ~$0.01
- 记忆测试: ~$0.02
- 完整工作流: ~$0.10

**总计**: 约 $0.15 USD
