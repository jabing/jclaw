# JClaw 实施任务清单

> 本文档用于追踪实施进度，按阶段组织

---

## 架构概览

```
packages/
├── core/                    # 核心包 (jclaw-core) - 必需
│   ├── runtime/             # 基础 Agent 运行时
│   ├── executor/            # 执行器 (支持多种模式)
│   │   ├── local.ts         # 本地执行 (Windows 友好)
│   │   ├── docker.ts        # Docker 执行 (可选)
│   │   └── hybrid.ts        # 混合执行 (可选)
│   ├── context/             # OpenViking 集成
│   ├── evolution/           # Evolver 集成
│   ├── network/             # EvoMap 集成
│   └── extension-system/    # 扩展系统
│
└── extensions/              # 扩展包 - 可选
    ├── extension-opencode/  # OpenCode 扩展
    └── extension-nanoclaw/  # NanoClaw 扩展
```

---

## Phase 1: 核心框架 (Week 1-4)

### Week 1: 项目初始化

#### Day 1-2: Monorepo 设置
- [ ] 初始化 monorepo
  ```bash
  mkdir jclaw && cd jclaw
  npm init -y
  mkdir -p packages/core packages/extensions
  ```
- [ ] 配置 TypeScript
- [ ] 配置构建系统
- [ ] 配置测试框架

**验收标准**:
- [ ] `npm ls` 不报错
- [ ] `packages/core` 目录存在
- [ ] `npm run build` 成功
- [ ] TypeScript 编译无错误


#### Day 3-4: 类型定义
- [ ] `packages/core/src/types.ts`
  - [ ] AgentRuntime 接口
  - [ ] ContextManager 接口
  - [ ] EvolutionEngine 接口
  - [ ] NetworkClient 接口
  - [ ] Extension 接口
  - [ ] Executor 接口 (新增)

#### Day 5-7: 基础运行时
- [ ] `packages/core/src/runtime/`
  - [ ] agent.ts - 基础 Agent 实现
  - [ ] task-executor.ts - 任务执行器
  - [ ] llm-client.ts - LLM 客户端 (不依赖 OpenCode)

**验收标准**:
- [ ] 所有接口有 JSDoc 注释
- [ ] TypeScript 编译通过
- [ ] 接口之间引用正确


---

### Week 2: 执行器 + 上下文管理

#### Day 8-10: 执行器实现 (重要!)
- [ ] `packages/core/src/executor/`
  - [ ] interface.ts - 执行器接口
  - [ ] local.ts - **本地执行器 (优先，Windows 友好)**
  - [ ] docker.ts - Docker 执行器 (可选)
  - [ ] hybrid.ts - 混合执行器 (可选)

**验收标准**:
- [ ] 本地执行器可以执行 shell 命令
- [ ] 支持 Windows/macOS/Linux
- [ ] 超时控制正常工作
- [ ] 错误处理完善

  - [ ] factory.ts - 执行器工厂

#### Day 11-14: OpenViking 集成
- [ ] `packages/core/src/context/`
  - [ ] manager.ts - 上下文管理器
  - [ ] openviking-adapter.ts - OpenViking 适配
  - [ ] session.ts - 会话管理
  - [ ] memory-extractor.ts - 记忆提取

**验收标准**:
- [ ] HTTP 客户端可以连接 OpenViking MCP Server
- [ ] 支持 add_resource, search, query 操作
- [ ] 错误处理和重试机制
- [ ] 连接断开后可自动重连


---

### Week 3: 进化引擎

#### Day 15-17: Evolver 研究
- [ ] 研究变异机制
- [ ] 研究沙箱验证 (本地模式可用进程限制)
- [ ] 研究 Capsule 打包

**验收标准**:
- [ ] 完成技术调研文档
- [ ] 确定集成方案 (子进程调用)
- [ ] 识别需要修改的部分


#### Day 18-21: Evolver 集成
- [ ] `packages/core/src/evolution/`
  - [ ] engine.ts - 进化引擎
  - [ ] mutation.ts - 变异生成
  - [ ] sandbox.ts - 沙箱验证 (支持本地/Docker)
  - [ ] capsule.ts - Capsule 打包

**验收标准**:
- [ ] 可以调用 Evolver 子进程
- [ ] 进化循环可以运行
- [ ] 支持 repair/optimize/innovate 策略


---

### Week 4: 网络层 + 扩展系统

#### Day 22-24: EvoMap 集成
- [ ] `packages/core/src/network/`
  - [ ] client.ts - EvoMap 客户端
  - [ ] protocol.ts - A2A/GEP 协议

**验收标准**:
- [ ] 可以向 EvoMap Hub 注册节点
- [ ] 支持 publish/fetch 操作
- [ ] A2A 协议消息格式正确


#### Day 25-28: 扩展系统
- [ ] `packages/core/src/extension-system/`
  - [ ] registry.ts - 扩展注册
  - [ ] loader.ts - 扩展加载
  - [ ] capability-router.ts - 能力路由

**验收标准**:
- [ ] 扩展可以动态加载
- [ ] 能力路由正常工作
- [ ] 扩展生命周期管理完善


---

## Phase 2: OpenCode 扩展 (Week 5-6)

### Week 5: OpenCode 集成

#### Day 29-31: OpenCode 研究
- [ ] 研究 OpenCode CLI
- [ ] 研究非交互模式
- [ ] 研究 LSP 集成

#### Day 32-35: 扩展实现
- [ ] `packages/extensions/extension-opencode/`
  - [ ] index.ts - 扩展入口
  - [ ] adapter.ts - OpenCode 适配
  - [ ] lsp-bridge.ts - LSP 桥接
  - [ ] capabilities.ts - 能力定义

---

### Week 6: 测试与文档

#### Day 36-38: 扩展测试
- [ ] OpenCode 扩展单元测试
- [ ] OpenCode 扩展集成测试
- [ ] 与核心的联动测试

#### Day 39-42: 文档
- [ ] OpenCode 扩展使用文档
- [ ] 配置示例
- [ ] API 文档

---

## Phase 3: 消息入口扩展 (Week 7-8)

### Week 7: NanoClaw 扩展

#### Day 43-45: NanoClaw 研究
- [ ] 研究 NanoClaw 架构
- [ ] 研究 WhatsApp 集成

#### Day 46-49: 扩展实现
- [ ] `packages/extensions/extension-nanoclaw/`
  - [ ] index.ts - 扩展入口
  - [ ] adapter.ts - NanoClaw 适配
  - [ ] message-router.ts - 消息路由

---

### Week 8: 其他入口 + 集成

#### Day 50-52: Telegram 扩展 (可选)
- [ ] `packages/extensions/extension-telegram/`

#### Day 53-56: 集成测试
- [ ] 多扩展共存测试
- [ ] 端到端测试
- [ ] 文档

---

## Phase 4: 发布准备 (Week 9)

#### Day 57-60: 测试与优化
- [ ] 核心测试覆盖率 > 80%
- [ ] 扩展测试覆盖率 > 70%
- [ ] **Windows 兼容性测试**
- [ ] 性能优化

#### Day 61-63: 发布
- [ ] npm 包发布
  - [ ] jclaw-core
  - [ ] @jclaw/extension-opencode
  - [ ] @jclaw/extension-nanoclaw
- [ ] 文档网站
- [ ] 示例项目

---

## 包依赖关系

```
jclaw-core (独立)
    │
    ├── 内置: OpenViking 客户端
    ├── 内置: Evolver 核心
    ├── 内置: EvoMap 客户端
    └── 内置: 执行器 (local/docker/hybrid)

@jclaw/extension-opencode
    │
    ├── peerDependency: jclaw-core
    └── 需要: OpenCode CLI (用户自行安装)

@jclaw/extension-nanoclaw
    │
    ├── peerDependency: jclaw-core
    └── 需要: NanoClaw (用户自行安装)
```

---

## 安装场景测试

```bash
# 场景 A: 最小化 (Windows 友好)
npm install jclaw-core
jclaw exec "任务"
# 应该能运行，无 Docker 依赖

# 场景 B: +OpenCode
npm install jclaw-core @jclaw/extension-opencode
jclaw config set extensions.opencode.enabled true
# 应该能用 LSP 编码

# 场景 C: 完整
npm install jclaw-core @jclaw/extension-opencode @jclaw/extension-nanoclaw
# 应该全部可用

# 场景 D: +Docker 隔离 (可选)
jclaw config set execution.mode docker
# 需要 Docker，但不是必需的
```

---

## 里程碑

| 阶段 | 时间 | 里程碑 | 验收标准 |
|-----|------|-------|---------|
| M1 | Week 4 | 核心可用 | 独立运行，本地模式，Windows 支持 |
| M2 | Week 6 | OpenCode 可用 | 能用 LSP 编码 |
| M3 | Week 8 | 消息入口可用 | 能通过 WhatsApp 触发 |
| M4 | Week 9 | 发布就绪 | npm 发布，文档完整 |

---

## 优先级

| 优先级 | 模块 | 说明 |
|-------|------|------|
| **P0** | 核心运行时 | 必需，无外部依赖 |
| **P0** | 本地执行器 | 必需，Windows 友好 |
| **P0** | OpenViking 集成 | 必需，核心能力 |
| **P0** | Evolver 集成 | 必需，核心能力 |
| **P0** | 扩展系统 | 必需，架构基础 |
| **P1** | EvoMap 集成 | 高优先级，网络层 |
| **P2** | Docker 执行器 | 可选，需要隔离时 |
| **P2** | OpenCode 扩展 | 可选，编码增强 |
| **P3** | NanoClaw 扩展 | 可选，消息入口 |

---

## Windows 兼容性检查清单

- [ ] 路径处理使用 `path.join()` 而非硬编码 `/`
- [ ] 命令执行兼容 Windows (PowerShell/CMD)
- [ ] 本地执行器默认启用
- [ ] Docker 执行器标记为可选
- [ ] 配置文件路径兼容 Windows (`C:/xxx`)
- [ ] 文件权限处理兼容
- [ ] 测试在 Windows 环境下运行

---

## 测试后补阶段 (Phase 5)

> 在功能开发完成后，补充自动化测试

### 测试策略
- **单元测试**: Jest + ts-jest
- **集成测试**: 各模块联动测试
- **E2E 测试**: 完整流程测试

### 测试目标
- [ ] 核心模块测试覆盖率 > 80%
- [ ] 扩展模块测试覆盖率 > 70%
- [ ] 所有 E2E 场景通过

### 测试优先级

| 优先级 | 模块 | 测试类型 |
|-------|------|---------|
| P0 | 执行器 | 单元 + 集成 |
| P0 | OpenViking 客户端 | 单元 + 集成 |
| P0 | 进化引擎 | 单元 + 集成 |
| P1 | EvoMap 客户端 | 单元 |
| P1 | 扩展系统 | 单元 |
| P2 | CLI | E2E |


---

**创建日期**: 2026-02-26
**更新日期**: 2026-02-26
**版本**: v4.0
**更新说明**: 新增本地执行器优先，Windows 兼容性
