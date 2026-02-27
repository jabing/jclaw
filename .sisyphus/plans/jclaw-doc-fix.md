# JClaw 文档修复计划

> ⚠️ **SUPERSEDED** - 此计划已被 Phase 1-4 完成
> 
> 所有任务已在以下计划中完成:
> - phase1-core-framework.md
> - phase2-opencode-extension.md
> - phase3-nanoclaw-extension.md
> - phase4-release.md

## TL;DR

> **状态**: ✅ 已完成 (通过 Phase 1-4)
>
> **原目标**: 修复项目规划文档的不一致问题
>
> **交付物**: 已在 Phase 1-4 中实现
---

## Context

### 原始需求

用户请求检查当前项目规划是否有问题。

### 发现的问题

#### 🔴 严重问题

1. **package.json 结构冲突**: 单包配置 vs PLAN.md 描述的 monorepo
2. **技术细节缺失**: PLAN.md 未说明 OpenViking 如何与 Node.js 通信

#### 🟡 中等问题

3. **依赖矛盾**: `dockerode` 在依赖中但规划说 Docker 可选
4. **TASKS.md 质量不足**: 缺少验收标准、QA 场景、并行策略

### 用户决策 (已确认)

- **项目结构**: Monorepo (packages/core + packages/extensions)
- **OpenViking 集成**: HTTP MCP Server
- **测试策略**: 测试后补
- **Phase 1 范围**: 完整 (包括所有集成)

### 技术研究结果

| 组件       | 集成方式        | 说明                                |
| ---------- | --------------- | ----------------------------------- |
| OpenViking | HTTP MCP Server | Python 服务，Node.js 通过 HTTP 调用 |
| Evolver    | Node.js 子进程  | `node index.js` 调用                |
| EvoMap     | HTTP API        | SaaS 平台，无需 API Key             |

---

## Work Objectives

### 核心目标

修复规划文档的不一致问题，使项目可以正确初始化和开发。

### 具体交付物

1. `package.json` - monorepo 根配置，使用 workspaces
2. `PLAN.md` - 添加 OpenViking HTTP MCP 集成章节
3. `TASKS.md` - 添加验收标准 + QA 场景 + 依赖关系

### 完成标准

- [x] package.json 使用 workspaces 配置
- [x] PLAN.md 包含 OpenViking HTTP MCP 部署说明
- [x] TASKS.md 每个任务有明确的验收标准

### 必须包含

- monorepo 结构 (workspaces)
- OpenViking HTTP MCP 集成说明
- 每个任务的验收标准

### 禁止包含 (Guardrails)

- 不要改变 Phase 划分
- 不要添加新的核心功能
- 不要修改已有的接口设计

---

## Verification Strategy

### 测试决策

- **测试基础设施存在**: NO (项目尚未初始化)
- **自动化测试**: 测试后补 (先修复文档，后续补充测试)
- **框架**: Jest (待配置)

### QA 策略

每个任务使用 Agent-Executed QA:

- **JSON 配置**: 使用 `jq` 或 Node.js 验证 JSON 有效性
- **Markdown 文档**: 使用 markdownlint 验证格式

---

## Execution Strategy

### 并行执行策略

```
Wave 1 (可并行):
├── Task 1: 更新 package.json [quick]
├── Task 2: 更新 PLAN.md [quick]
└── Task 3: 更新 TASKS.md [quick]

Wave FINAL (顺序):
└── Task F1: 验证文档一致性 [quick]
```

### Agent 分配

- **Task 1-3**: `quick` (简单文件修改)
- **Task F1**: `quick` (验证)

---

## TODOs

- [x] 1. 更新 package.json 为 monorepo 结构

  **做什么**:
  - 将单包配置改为 monorepo 根配置
  - 使用 `workspaces` 管理 `packages/*`
  - 移除 `dockerode` 从 dependencies (Docker 可选)
  - 保留 devDependencies 在根目录

  **禁止做**:
  - 不要删除现有的 devDependencies
  - 不要改变 Node.js 版本要求

  **推荐 Agent**: `quick`

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 1 (with Task 2, 3)
  - **阻塞**: 无
  - **被阻塞**: 无

  **参考**:
  - 当前文件: `C:\dev_projects\jclaw\package.json`
  - 目标结构:
    ```json
    {
      "name": "jclaw",
      "private": true,
      "workspaces": ["packages/*"],
      "scripts": {
        "build": "npm run build --workspaces",
        "test": "npm run test --workspaces"
      }
    }
    ```

  **验收标准**:
  - [x] package.json 包含 `workspaces: ["packages/*"]`
  - [x] `dockerode` 已从 dependencies 移除
  - [x] `npm install --dry-run` 不会报错 (验证 JSON 有效性)

  **QA 场景**:

  ```
  Scenario: 验证 package.json 有效性
    Tool: Bash (node)
    Steps:
      1. node -e "JSON.parse(require('fs').readFileSync('package.json'))"
    Expected: 无输出 (JSON 有效)
    Evidence: .sisyphus/evidence/task-1-json-valid.txt
  ```

  **Commit**: YES
  - Message: `chore: convert to monorepo structure with workspaces`
  - Files: `package.json`

---

- [x] 2. 更新 PLAN.md - 添加 OpenViking HTTP MCP 集成说明

  **做什么**:
  - 在"技术栈"章节添加 OpenViking HTTP MCP 说明
  - 添加新章节 "OpenViking 集成指南":
    - 部署 Python 服务
    - Node.js 客户端配置
    - 环境变量说明
  - 更新依赖表，明确标注 Python 为 OpenViking 服务依赖

  **禁止做**:
  - 不要改变 Phase 划分
  - 不要修改已有的架构图

  **推荐 Agent**: `quick`

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 1 (with Task 1, 3)
  - **阻塞**: 无
  - **被阻塞**: 无

  **参考**:
  - 当前文件: `C:\dev_projects\jclaw\PLAN.md`
  - 添加内容示例:

    ```markdown
    ### OpenViking 集成 (HTTP MCP Server)

    OpenViking 是 Python 服务，JClaw 通过 HTTP MCP 协议调用。

    #### 部署步骤

    1. 安装 OpenViking: `pip install openviking`
    2. 启动 MCP 服务: `uv run examples/mcp-query/server.py --port 2033`
    3. 配置环境变量: `OPENVIKING_URL=http://localhost:2033/mcp`

    #### Node.js 客户端

    使用 `@modelcontextprotocol/sdk` 连接 OpenViking 服务。
    ```

  **验收标准**:
  - [x] PLAN.md 包含 "OpenViking 集成" 章节
  - [x] 包含部署步骤说明
  - [x] 包含环境变量配置说明

  **QA 场景**:

  ```
  Scenario: 验证 PLAN.md 格式
    Tool: Bash
    Steps:
      1. grep -q "OpenViking 集成" PLAN.md
    Expected: 退出码 0 (找到内容)
    Evidence: .sisyphus/evidence/task-2-plan-updated.txt
  ```

  **Commit**: YES (与 Task 3 合并)
  - Message: `docs: update PLAN.md and TASKS.md with technical details`
  - Files: `PLAN.md`, `TASKS.md`

---

- [x] 3. 更新 TASKS.md - 添加验收标准

  **做什么**:
  - 为 Week 1-4 的每个任务添加验收标准
  - 添加 QA 场景 (使用 Agent 执行验证)
  - 明确任务依赖关系 (添加依赖图)
  - 添加测试后补阶段说明

  **禁止做**:
  - 不要改变 Week 划分
  - 不要添加新任务

  **推荐 Agent**: `quick`

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 1 (with Task 1, 2)
  - **阻塞**: 无
  - **被阻塞**: 无

  **参考**:
  - 当前文件: `C:\dev_projects\jclaw\TASKS.md`
  - 验收标准示例:
    ```markdown
    #### Day 1-2: Monorepo 设置

    - [x] 初始化 monorepo
          **验收标准**:
    - [x] `npm ls` 不报错
    - [x] `packages/` 目录存在
    ```

  **验收标准**:
  - [x] TASKS.md 每个任务有验收标准
  - [x] 包含任务依赖图
  - [x] 包含测试后补阶段说明

  **QA 场景**:

  ```
  Scenario: 验证 TASKS.md 更新
    Tool: Bash
    Steps:
      1. grep -q "验收标准" TASKS.md
    Expected: 退出码 0 (找到内容)
    Evidence: .sisyphus/evidence/task-3-tasks-updated.txt
  ```

  **Commit**: YES (与 Task 2 合并)

---

## Final Verification Wave

- [x] F1. **文档一致性验证**

  **做什么**:
  - 验证 package.json 的 workspaces 配置正确
  - 验证 PLAN.md 和 TASKS.md 技术描述一致
  - 验证所有 Markdown 文件格式正确

  **推荐 Agent**: `quick`

  **验收标准**:
  - [x] `cat package.json | jq '.workspaces'` 返回 `["packages/*"]`
  - [x] PLAN.md 和 TASKS.md 都提到 OpenViking HTTP MCP

  **QA 场景**:

  ```
  Scenario: 最终验证
    Tool: Bash
    Steps:
      1. node -e "const p=require('./package.json'); console.log(p.workspaces)"
    Expected: 输出 ["packages/*"]
    Evidence: .sisyphus/evidence/final-verification.txt
  ```

---

## Commit Strategy

| Commit | 消息                                                       | 文件              |
| ------ | ---------------------------------------------------------- | ----------------- |
| 1      | `chore: convert to monorepo structure with workspaces`     | package.json      |
| 2      | `docs: update PLAN.md and TASKS.md with technical details` | PLAN.md, TASKS.md |

---

## Success Criteria

### 验证命令

```bash
# 验证 package.json
node -e "const p=require('./package.json'); console.log(p.workspaces)"
# 预期输出: ["packages/*"]

# 验证 PLAN.md
grep -c "OpenViking" PLAN.md
# 预期输出: >= 5

# 验证 TASKS.md
grep -c "验收标准" TASKS.md
# 预期输出: >= 5
```

### 最终检查清单

- [x] package.json 使用 workspaces
- [x] PLAN.md 包含 OpenViking HTTP MCP 集成说明
- [x] TASKS.md 包含验收标准
- [x] 所有文档格式正确
