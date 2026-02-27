# JClaw - 通用自我进化 Agent 框架

> **项目定位**: 通用的自我进化 Agent 框架，可扩展，不绑定任何特定工具
>
> **核心理念**: 记忆 + 进化 + 可扩展架构 + 跨平台支持
>
> **平台支持**: Windows / macOS / Linux，Docker 可选

---

## 项目概述

### 核心理念

JClaw 是一个**通用的自我进化 Agent 框架**，提供：

1. **持久记忆** - OpenViking 分层上下文管理
2. **自我进化** - Evolver 变异验证 + EvoMap 基因继承
3. **可扩展架构** - 按需选择编码引擎、消息入口等扩展
4. **跨平台支持** - Windows/macOS/Linux，本地或容器执行

### 设计原则

- **核心独立** - 不依赖 OpenCode、NanoClaw、Docker 等任何外部工具
- **按需扩展** - 需要什么能力就安装什么扩展
- **零强制依赖** - 用户可以选择最小化安装
- **跨平台友好** - Windows 本地执行优先，Docker 可选

### 分层架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        JClaw 通用自我进化 Agent 框架                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      核心层 (JClaw Core)                             │  │
│   │                      所有用户必需安装                                │  │
│   │                                                                       │  │
│   │   ┌─────────────────────────────────────────────────────────────┐   │  │
│   │   │                    OpenViking                                │   │  │
│   │   │              上下文管理 (L0/L1/L2 + Session)                 │   │  │
│   │   └────────────────────────┬────────────────────────────────────┘   │  │
│   │                            │                                         │  │
│   │   ┌────────────────────────▼────────────────────────────────────┐   │  │
│   │   │              Evolver + EvoMap                               │   │  │
│   │   │         进化引擎 (变异 + 验证 + 基因继承)                    │   │  │
│   │   └─────────────────────────────────────────────────────────────┘   │  │
│   │                                                                       │  │
│   │   + 基础 Agent 运行时 (支持 Windows/macOS/Linux 本地执行)           │   │  │
│   │                                                                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      扩展层 (Extensions)                             │  │
│   │                      按需选择，可选安装                              │  │
│   │                                                                       │  │
│   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │  │
│   │   │ OpenCode  │ │ NanoClaw  │ │  Claude   │ │  Custom   │         │  │
│   │   │ Extension │ │ Extension │ │  Desktop  │ │ Extension │         │  │
│   │   │           │ │           │ │ Extension │ │           │         │  │
│   │   │ 专业编码   │ │ WhatsApp  │ │  集成     │ │  自定义   │         │  │
│   │   │ (可选)    │ │  (可选)   │ │  (可选)   │ │  (可选)   │         │  │
│   │   └───────────┘ └───────────┘ └───────────┘ └───────────┘         │  │
│   │                                                                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      执行模式 (可选)                                 │  │
│   │                                                                       │  │
│   │   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │  │
│   │   │   本地模式    │ │  Docker 模式  │ │  混合模式     │            │  │
│   │   │   (默认)     │ │   (可选)      │ │   (可选)      │            │  │
│   │   │              │ │              │ │              │            │  │
│   │   │ ✅ Windows   │ │ ✅ Linux/Mac │ │ ✅ 按任务选择 │            │  │
│   │   │ ✅ 快速      │ │ ✅ 安全隔离  │ │ ✅ 灵活      │            │  │
│   │   │ ⚠️ 无隔离    │ │ ⚠️ 需 Docker │ │ ⚠️ 复杂     │            │  │
│   │   └───────────────┘ └───────────────┘ └───────────────┘            │  │
│   │                                                                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 执行模式

### 模式对比

| 模式 | 隔离 | 性能 | Windows | 适用场景 |
|-----|------|------|---------|---------|
| **本地模式** | 无 | 最快 | ✅ 完美 | 日常开发、可信环境、Windows |
| **Docker 模式** | 完整 | 较慢 | ⚠️ 需配置 | 生产环境、不可信代码、Linux/Mac |
| **混合模式** | 可选 | 中等 | ✅ 可用 | 灵活选择、按任务切换 |

### 本地模式 (默认，Windows 推荐)

```
┌─────────────────────────────────────────────────────────────┐
│                      本地执行模式                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   优点:                                                     │
│   ✅ 无需安装 Docker                                        │
│   ✅ 执行速度最快                                           │
│   ✅ 直接访问本地文件系统                                   │
│   ✅ Windows 完美支持                                       │
│                                                             │
│   限制 (可选配置):                                          │
│   ├── allowed_paths: 只允许访问指定目录                     │
│   ├── blocked_commands: 阻止危险命令                        │
│   └── timeout: 执行超时限制                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Docker 模式 (可选，需要隔离时)

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker 执行模式                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   优点:                                                     │
│   ✅ 完整隔离，安全                                         │
│   ✅ 可限制资源 (CPU/内存)                                  │
│   ✅ 可重现环境                                             │
│                                                             │
│   缺点:                                                     │
│   ⚠️ 需要安装 Docker / Docker Desktop                       │
│   ⚠️ Windows 上配置复杂                                    │
│   ⚠️ 执行速度较慢                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 使用模式

### 模式 A: 最小化安装 (通用用户)

```bash
# 只安装核心，无任何扩展
npm install jclaw-core

# 使用内置的基础 Agent 运行时 (本地模式)
jclaw exec "任务描述"
```

**适用场景**：
- 普通用户，不需要专业编码
- Windows 用户，不想装 Docker
- 通过 API 使用 Agent

---

### 模式 B: +OpenCode 扩展 (开发者)

```bash
# 安装核心 + OpenCode 扩展
npm install jclaw-core @jclaw/extension-opencode

# 配置启用
echo "extensions:\n  opencode: true" >> jclaw.yaml

# 使用 OpenCode 的 LSP 编码能力
jclaw exec "重构 UserService"

# 你的 OpenCode + JClaw 的记忆和进化能力
```

**适用场景**：
- 专业开发者
- 需要 LSP 支持
- 复杂代码重构
- **在电脑前工作**

---

### 模式 C: +NanoClaw 扩展 (移动办公)

```bash
# 安装核心 + NanoClaw 扩展
npm install jclaw-core @jclaw/extension-nanoclaw

# 配置 WhatsApp
jclaw config set entrypoints.nanoclaw.enabled true

# 通过 WhatsApp 触发
# WhatsApp: @jclaw 任务描述
```

**适用场景**：
- 移动办公
- 需要消息通知
- **随时随地触发任务**

---

### 模式 D: 完整安装 (高级用户)

```bash
# 安装核心 + 所有扩展
npm install jclaw-core @jclaw/extension-opencode @jclaw/extension-nanoclaw
```

---

## 技术栈

### 核心层 (必需)

| 组件 | 职责 | 依赖 |
|-----|------|-----|
| OpenViking | 上下文管理 | Python 3.10+ |
| Evolver | 本地进化引擎 | Docker (可选) |
| 组件 | 职责 | 依赖 |
|-----|------|-----|
| OpenViking | 上下文管理 | Python 3.10+ (HTTP MCP Server) |
| Evolver | 本地进化引擎 | Node.js 子进程 |
| EvoMap | 网络层进化 | HTTP API (无需 SDK) |
| 基础运行时 | Agent 执行 | 无外部依赖 |

### 扩展层 (可选)

| 扩展 | 职责 | 额外依赖 |
|-----|------|---------|
| @jclaw/extension-opencode | 专业编码 (LSP) | OpenCode CLI |
| @jclaw/extension-nanoclaw | WhatsApp 入口 | NanoClaw |
| @jclaw/extension-telegram | Telegram 入口 | Telegram Bot Token |

### 执行模式 (可选)

| 模式 | 依赖 | 说明 |
|-----|------|------|
| 本地模式 | 无 | 默认，Windows 友好 |
| Docker 模式 | Docker | 可选，需要隔离时 |
# SR|---
# HS|

## OpenViking 集成指南

### 集成方式

JClaw 通过 **HTTP MCP Server** 与 OpenViking 通信，而非直接调用 Python。

```
┌─────────────────────────────────────────────────────────────┐
│                   OpenViking 集成架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────────┐         HTTP/MCP         ┌───────────┐ │
│   │  JClaw Core   │ ───────────────────────> │ OpenViking│ │
│   │  (Node.js)    │ <─────────────────────── │  Server   │ │
│   │               │         JSON-RPC         │ (Python)  │ │
│   └───────────────┘                          └───────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 部署步骤

1. **安装 OpenViking**:
   ```bash
   pip install openviking
   ```

2. **创建配置文件** `~/.openviking/ov.conf`:
   ```json
   {
     "storage": {
       "workspace": "/path/to/openviking_workspace"
     },
     "embedding": {
       "dense": {
         "api_base": "https://api.openai.com/v1",
         "api_key": "your-api-key",
         "provider": "openai",
         "dimension": 3072,
         "model": "text-embedding-3-large"
       }
     },
     "vlm": {
       "api_base": "https://api.openai.com/v1",
       "api_key": "your-api-key",
       "provider": "openai",
       "model": "gpt-4-vision-preview"
     }
   }
   ```

3. **启动 MCP Server**:
   ```bash
   uv run examples/mcp-query/server.py --config ~/.openviking/ov.conf --data ./data --port 2033
   ```

4. **配置环境变量** (JClaw 使用):
   ```bash
   export OPENVIKING_URL=http://localhost:2033/mcp
   ```

### Node.js 客户端

JClaw 使用 `@modelcontextprotocol/sdk` 连接 OpenViking：

```typescript
// packages/core/src/context/openviking-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export class OpenVikingClient {
  private client: Client;
  
  constructor(private config: { serverUrl: string }) {
    this.client = new Client({ name: "jclaw-openviking", version: "1.0.0" });
  }
  
  async connect(): Promise<void> {
    // 连接到 OpenViking MCP Server
  }
  
  async query(question: string, options?: { topK?: number }): Promise<string> {
    // 调用 query 工具
  }
  
  async search(query: string, options?: { topK?: number }): Promise<any[]> {
    // 调用 search 工具
  }
  
  async addResource(resourcePath: string): Promise<string> {
    // 调用 add_resource 工具
  }
}
```

### 为什么选择 HTTP MCP

| 方案 | 优点 | 缺点 |
|-----|------|------|
| **HTTP MCP** | 解耦、可扩展、性能好 | 需要单独部署服务 |
| Python 子进程 | 部署简单 | 进程管理复杂、性能差 |
| 直接嵌入 | 无网络开销 | 需要在 Node.js 中嵌入 Python |

### 依赖说明

| 依赖 | 类型 | 说明 |
|-----|------|------|
| Python 3.10+ | **服务依赖** | OpenViking MCP Server 需要 |
| @modelcontextprotocol/sdk | **NPM 依赖** | JClaw 客户端需要 |
| OpenAI/Volcengine API Key | **运行时依赖** | Embedding 和 VLM 模型 |

# SR|---
# HS|
---

## 集成策略

### 核心原则

**能适配就适配，需要深度定制才嵌入。**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JClaw 集成架构                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      JClaw Core (你的代码)                           │  │
│   │                                                                       │  │
│   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │  │
│   │   │  Runtime  │ │ Executor  │ │ Evolution │ │ Extension │         │  │
│   │   │  运行时   │ │  执行器   │ │   引擎    │ │   系统    │         │  │
│   │   │           │ │           │ │ (嵌入)    │ │           │         │  │
│   │   └───────────┘ └───────────┘ └───────────┘ └───────────┘         │  │
│   │                                                                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│          │                           │                    │                │
│          ▼                           ▼                    ▼                │
│   ┌─────────────┐            ┌─────────────┐      ┌─────────────┐        │
│   │ OpenViking  │            │   EvoMap    │      │  NanoClaw   │        │
│   │  (适配层)   │            │  (适配层)   │      │  (扩展层)   │        │
│   │             │            │             │      │   可选      │        │
│   │ HTTP/CLI    │            │ HTTP API    │      │ Extension   │        │
│   └─────────────┘            └─────────────┘      └─────────────┘        │
│        原项目保留               原项目保留           原项目保留            │
│        独立更新                 独立更新             独立更新              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 各项目集成方式

| 项目 | 集成方式 | 理由 | 实现方式 |
|-----|---------|------|---------|
| **OpenViking** | 适配层 | 功能完整、更新频繁、Python 项目 | HTTP API / CLI 调用 |
| **EvoMap** | 适配层 | 网络服务，本身就是 C/S 架构 | HTTP API 调用 |
| **Evolver** | **嵌入** | 需要深度定制进化逻辑、与执行器集成 | Fork + 修改 + 内置 |
| **NanoClaw** | 适配层 | 扩展层、可选安装 | Extension API |

### 详细说明

#### OpenViking → 适配层

```
理由：
├── Python 项目，通过 HTTP/CLI 调用
├── 功能已经很完整
├── 火山引擎维护，更新频繁
├── 适配层简单（已有 HTTP API）
└── 不需要修改核心

实现方式：
JClaw ──HTTP──> OpenViking Server (:1933)
        或
JClaw ──CLI───> ov add-resource / ov search
```

#### EvoMap → 适配层

```
理由：
├── 网络服务架构（Hub + Client）
├── 本来就是通过 API 通信
├── 协议已定义（A2A/GEP）
└── 不需要修改

实现方式：
JClaw ──HTTP──> EvoMap Hub (https://evomap.ai)
```

#### Evolver → 嵌入 (需要深度定制)

```
理由：
├── 进化逻辑可能需要深度定制
├── 需要与 JClaw 的执行器集成
├── 需要修改沙箱验证逻辑（支持本地模式）
└── 本地运行，不需要网络

实现方式：
├── Fork Evolver 仓库
├── 集成到 jclaw-core/src/evolution/
├── 修改为支持本地执行模式
└── 保持与上游同步（定期 merge）
```

#### NanoClaw → 适配层 (扩展层)

```
理由：
├── 扩展层，可选安装
├── 本身就是独立进程
├── 通过 IPC/API 通信
└── 用户自己安装，不需要修改

实现方式：
JClaw ──Extension API──> NanoClaw Process
```

### 依赖关系

```yaml
# package.json

dependencies:
  # 无强制依赖 - 核心独立运行

peerDependencies:
  # OpenViking - 用户自行安装
  # pip install openviking
  # 或使用 Docker 镜像

optionalDependencies:
  # 可选扩展
  "@jclaw/extension-nanoclaw": "*"  # 需要 NanoClaw

# 内置 (Fork + 嵌入)
# - Evolution 引擎 (基于 Evolver 修改)
```

---

## 核心接口设计

### 1. AgentRuntime (核心)

```typescript
/**
 * 基础 Agent 运行时 - 不依赖任何扩展
 */
interface AgentRuntime {
  // 执行任务
  execute(task: Task): Promise<TaskResult>;
  
  // 生命周期
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // 上下文访问
  context: ContextManager;
  
  // 进化控制
  evolution: EvolutionEngine;
  
  // 执行模式
  executionMode: 'local' | 'docker' | 'hybrid';
}

interface Task {
  id: string;
  prompt: string;
  context?: Record<string, any>;
  executionMode?: 'local' | 'docker';  // 可临时指定
}
```

### 2. Executor (执行器)

```typescript
/**
 * 执行器接口 - 支持多种执行模式
 */
interface Executor {
  // 执行命令
  execute(command: string, options?: ExecuteOptions): Promise<ExecuteResult>;
  
  // 执行模式
  mode: 'local' | 'docker' | 'hybrid';
}

interface ExecuteOptions {
  mode?: 'local' | 'docker';      // 临时指定模式
  timeout?: number;               // 超时秒数
  cwd?: string;                   // 工作目录
  env?: Record<string, string>;   // 环境变量
  
  // 本地模式限制
  restrictions?: {
    allowedPaths?: string[];      // 允许访问的路径
    blockedCommands?: string[];   // 阻止的命令
  };
  
  // Docker 模式配置
  container?: {
    image?: string;               // 镜像名
    memory?: string;              // 内存限制
    cpu?: string;                 // CPU 限制
  };
}
```

### 3. Extension (扩展接口)

```typescript
/**
 * 扩展接口 - 所有扩展必须实现
 */
interface Extension {
  // 扩展信息
  name: string;
  version: string;
  description: string;
  
  // 依赖声明
  dependencies?: string[];
  optionalDependencies?: string[];
  
  // 生命周期
  install(runtime: AgentRuntime): Promise<void>;
  uninstall(): Promise<void>;
  
  // 能力声明
  capabilities: Capability[];
}
```

---

## 配置规范

### jclaw.yaml - 主配置

```yaml
# JClaw 主配置文件

agent:
  name: "jclaw-agent"
  version: "0.1.0"

# 核心配置 (必需)
core:
  context:
    provider: "openviking"
    workspace: "./jclaw-workspace"
  evolution:
    enabled: true
  network:
    enabled: true
    hub_url: "https://evomap.ai"

# 执行模式配置 (重要!)
execution:
  # 默认模式: local | docker | hybrid
  mode: "local"              # Windows 推荐 local
  
  # 本地模式配置
  local:
    enabled: true
    # 可选的安全限制
    restrictions:
      allowed_paths:
        - "C:/dev_projects"  # Windows 路径
        - "~/projects"       # 或使用 ~
      blocked_commands:
        - "rm -rf /"
        - "format"
        - "del /s"
      timeout_seconds: 300
  
  # Docker 模式配置 (可选)
  docker:
    enabled: false           # 默认关闭
    image: "jclaw-sandbox:latest"
    resources:
      memory: "512m"
      cpu: "0.5"
    timeout_seconds: 300
  
  # 混合模式配置
  hybrid:
    # 根据任务类型自动选择
    rules:
      - task_type: "code_execution"
        use: "local"
      - task_type: "untrusted_input"
        use: "docker"
      - task_type: "evolution_mutation"
        use: "docker"        # 进化变异建议用沙箱

# 扩展配置 (可选)
extensions:
  # OpenCode 扩展
  opencode:
    enabled: false           # 默认关闭
    path: "opencode"
    lsp:
      auto_start: true
  
  # NanoClaw 扩展
  nanoclaw:
    enabled: false
    whatsapp:
      enabled: false
```

---

## 项目结构

```
jclaw/
├── packages/
│   ├── core/                          # 核心包 (必需)
│   │   ├── src/
│   │   │   ├── runtime/               # 基础运行时
│   │   │   ├── executor/              # 执行器 (支持多种模式)
│   │   │   │   ├── local.ts           # 本地执行
│   │   │   │   ├── docker.ts          # Docker 执行
│   │   │   │   └── hybrid.ts          # 混合执行
│   │   │   ├── context/               # OpenViking 集成
│   │   │   ├── evolution/             # Evolver 集成
│   │   │   └── network/               # EvoMap 集成
│   │   └── package.json
│   │
│   └── extensions/                    # 扩展包 (可选)
│       ├── extension-opencode/        # OpenCode 扩展
│       └── extension-nanoclaw/        # NanoClaw 扩展
│
├── config/
│   └── jclaw.yaml.example
├── docs/
├── tests/
└── PLAN.md
```

---

## 实施阶段

### Phase 1: 核心框架 (Week 1-4)

**目标**: 独立的自我进化 Agent 核心，支持本地执行

**任务清单**:
- [ ] 基础运行时实现
- [ ] **本地执行器 (优先)**
- [ ] Docker 执行器 (可选)
- [ ] OpenViking 集成
- [ ] Evolver 集成
- [ ] EvoMap 集成
- [ ] 扩展系统框架
- [ ] CLI 入口

**交付物**:
```
packages/core/
├── runtime/      ✅ 基础运行时
├── executor/     ✅ 多模式执行器
│   ├── local.ts  ✅ 本地执行 (Windows 友好)
│   └── docker.ts ✅ Docker 执行 (可选)
├── context/      ✅ OpenViking
├── evolution/    ✅ Evolver
└── network/      ✅ EvoMap
```

---

### Phase 2: OpenCode 扩展 (Week 5-6)

**目标**: 为需要专业编码的用户提供 OpenCode 集成

**任务清单**:
- [ ] OpenCode 适配器
- [ ] LSP 桥接
- [ ] 扩展测试

---

### Phase 3: 消息入口扩展 (Week 7-8)

**目标**: 可选的消息平台入口

**任务清单**:
- [ ] NanoClaw 扩展
- [ ] Telegram 扩展 (可选)

---

### Phase 4: 测试与文档 (Week 9)

**目标**: 生产就绪

**任务清单**:
- [ ] 测试覆盖
- [ ] 文档完善
- [ ] Windows 兼容性测试

---

## 安装对比

| 用户类型 | 安装命令 | 依赖 | Windows |
|---------|---------|------|---------|
| 最小化 | `npm i jclaw-core` | Python | ✅ 完美 |
| +编码 | `+ @jclaw/extension-opencode` | +OpenCode | ✅ 完美 |
| +消息 | `+ @jclaw/extension-nanoclaw` | +NanoClaw | ✅ 完美 |
| +Docker隔离 | 配置 `execution.mode: docker` | +Docker | ⚠️ 需配置 |

---

## 参考资源

- [OpenViking](https://github.com/volcengine/OpenViking) - 核心上下文管理
- [EvoMap](https://evomap.ai) - 进化网络
- [OpenCode](https://opencode.ai) - 可选编码扩展
- [NanoClaw](https://github.com/qwibitai/nanoclaw) - 可选消息扩展

---

## 版本历史

| 版本 | 日期 | 变更 |
|-----|------|------|
| v1.0 | 2026-02-26 | 初始版本：NanoClaw 核心 |
| v2.0 | 2026-02-26 | OpenCode 核心，NanoClaw 降级为可选入口 |
| v3.0 | 2026-02-26 | 通用框架，扩展可选化 |
| v4.0 | 2026-02-26 | Docker 改为可选，新增本地执行模式，Windows 友好 |
| v5.0 | 2026-02-26 | 新增集成策略章节，明确各项目集成方式 |

---

**文档版本**: v5.0
**创建日期**: 2026-02-26
**最后更新**: 2026-02-26
