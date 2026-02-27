# JClaw Phase 1: 核心框架开发计划

## TL;DR

> **Quick Summary**: 为 JClaw 自我进化 Agent 框架实现 Phase 1 核心基础设施，包括配置系统、类型定义、本地执行器、OpenViking 客户端、扩展系统框架和 CLI 入口。采用 TDD 开发模式，优先支持 Windows 本地执行。
>
> **Deliverables**:
>
> - ESM 模块配置
> - Jest/ESLint/Prettier 配置文件
> - 核心类型接口定义
> - 本地命令执行器
> - OpenViking MCP 客户端 (含 Mock)
> - 扩展系统框架
> - CLI 入口 (jclaw exec/config)
>
> **Estimated Effort**: Medium (4 waves, ~15-20 tasks)
> **Parallel Execution**: YES - 5 waves with parallel tasks
> **Critical Path**: Config → Types → Executor → Runtime → CLI

---

## Context

### Original Request

开始 Phase 1 核心框架开发，为 JClaw 自我进化 Agent 框架建立基础设施。

### Interview Summary

**Key Discussions**:

- **测试策略**: TDD (RED-GREEN-REFACTOR 模式)
- **执行环境**: Windows 本地优先，Docker 可选
- **OpenViking**: 需要部署指导，使用 MCP HTTP Server
- **Evolver/EvoMap**: 排除在本次计划之外 (Phase 2)
- **模块系统**: ESM (因为 @modelcontextprotocol/sdk 要求)

**Research Findings**:

- packages/core 目录结构已创建，但所有源文件为空
- Jest/ESLint/Prettier 依赖存在但缺少配置文件
- 根目录 tsconfig.json 已配置 NodeNext (ESM-ready)
- 需要在 package.json 添加 `"type": "module"`

### Metis Review

**Identified Gaps** (addressed):

- **ESM 配置缺失**: 添加 `"type": "module"` 到 packages/core/package.json
- **OpenViking 服务可用性**: 添加 Mock Client 用于离线开发
- **范围蔓延风险**: 明确 "Must NOT Have" 边界
- **配置管理策略**: 添加默认配置初始化
- **Windows 路径兼容性**: 强制使用 path.join()/path.resolve()

---

## Work Objectives

### Core Objective

实现 JClaw Phase 1 核心框架，建立可独立运行、支持 Windows 本地执行的自我进化 Agent 基础设施。

### Concrete Deliverables

- `packages/core/package.json` (ESM 配置)
- `jest.config.js`, `.eslintrc.cjs`, `.prettierrc`
- `packages/core/src/types.ts` (核心类型定义)
- `packages/core/src/executor/local.ts` (本地执行器)
- `packages/core/src/context/openviking-client.ts` (OpenViking 客户端)
- `packages/core/src/context/mock-client.ts` (Mock 客户端)
- `packages/core/src/extension-system/` (扩展系统)
- `packages/core/src/cli/index.ts` (CLI 入口)

### Definition of Done

- [x] 所有测试通过 (`npm test`)
- [x] TypeScript 编译成功 (`npm run build`)
- [x] ESLint 无错误 (`npm run lint`)
- [x] 代码覆盖率 > 80%
- [x] Windows 环境下所有命令执行正常
- [x]TypeScript 编译成功 (`npm run build`)
- [x]ESLint 无错误 (`npm run lint`)
- [x]代码覆盖率 > 80%
- [x]Windows 环境下所有命令执行正常

### Must Have

- ESM 模块系统支持
- TDD 开发流程 (测试先行)
- 本地命令执行器 (Windows 优先)
- OpenViking MCP 客户端
- Mock 客户端 (离线测试)
- 扩展系统基础框架
- CLI 入口 (exec, config 命令)

### Must NOT Have (Guardrails)

- ❌ Docker 执行器 (Phase 1 后期)
- ❌ Evolver/EvoMap 集成 (Phase 2)
- ❌ 缓存层 (除非测试证明必要)
- ❌ 连接池
- ❌ 复杂重试策略
- ❌ 性能监控
- ❌ CLI 交互模式/历史/自动补全
- ❌ 热重载扩展
- ❌ 扩展市场/版本管理

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: NO (需要创建)
- **Automated tests**: YES (TDD)
- **Framework**: Jest + ts-jest
- **TDD Workflow**: 每个任务遵循 RED (失败测试) → GREEN (最小实现) → REFACTOR

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **CLI/Executor**: Use interactive_bash (tmux) — Run command, validate output, check exit code
- **Library/Module**: Use Bash (node REPL) — Import, call functions, compare output
- **TypeScript**: Use Bash (tsc) — Compile, check for errors

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: ESM Module Configuration [quick]
├── Task 2: Jest/ESLint/Prettier Configuration [quick]
└── Task 3: TypeScript Source Structure [quick]

Wave 2 (After Wave 1 — core types + executor):
├── Task 4: Core Type Interfaces [coding-aux]
└── Task 5: Local Executor [deep]

Wave 3 (After Wave 2 — OpenViking clients):
├── Task 6: Mock OpenViking Client [coding-aux]
└── Task 7: Real OpenViking Client [deep]

Wave 4 (After Wave 3 — extension + CLI):
├── Task 8: Extension System Framework [deep]
└── Task 9: CLI Entry Point [coding-aux]

Wave 5 (Final — integration):
└── Task 10: Integration Test Suite [coding-aux]

Critical Path: T1 → T4 → T5 → T9 → T10
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 3 (Wave 1)
```

### Dependency Matrix

- **1**: — — 4, 5, 2
- **2**: 1 — 4, 5, 3
- **3**: 1 — 4, 5, 3
- **4**: 1, 2, 3 — 5, 6, 7, 8
- **5**: 4 — 9, 6
- **6**: 4 — 7, 9
- **7**: 4, 6 — 9, 8
- **8**: 4 — 9, 10
- **9**: 5, 6, 7, 8 — 10
- **10**: 9 — F1-F4

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 2**: **2** — T4 → `coding-aux`, T5 → `deep`
- **Wave 3**: **2** — T6 → `coding-aux`, T7 → `deep`
- **Wave 4**: **2** — T8 → `deep`, T9 → `coding-aux`
- **Wave 5**: **1** — T10 → `coding-aux`

---

- [x] 1. **ESM Module Configuration**

  **What to do**:
  - 修改 `packages/core/package.json`，添加 `"type": "module"`
  - 添加 tsconfig.json (继承根配置)
  - 验证 Node.js >= 18.0.0
  - 验证 ESM import 工作正常

  **Must NOT do**:
  - 不修改根目录 package.json
  - 不添加任何源代码文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: 4, 5
  - **Blocked By**: None

  **References**:
  - `package.json:1-43` - 根目录配置
  - `tsconfig.json` - 根目录 TypeScript 配置

  **Acceptance Criteria**:
  - [x]`packages/core/package.json` 包含 `"type": "module"`
  - [x]ESM import 工作正常

  **QA Scenarios**:
  ```
  Scenario: ESM import works
    Tool: Bash
    Steps: node -e "import('fs').then(() => console.log('ESM OK'))"
    Expected Result: Output contains "ESM OK"
    Evidence: .sisyphus/evidence/task-01-esm.txt
  ```

  **Commit**: NO (groups with Wave 1)

- [x] 2. **Jest/ESLint/Prettier Configuration**

  **What to do**:
  - 创建 `jest.config.js` (支持 ESM + ts-jest)
  - 创建 `.eslintrc.cjs` (TypeScript 规则)
  - 创建 `.prettierrc` (基础格式化规则)

  **Must NOT do**:
  - 不配置复杂的 ESLint 规则

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: 4, 5
  - **Blocked By**: Task 1

  **References**:
  - `package.json:32-42` - Jest, ESLint, Prettier 依赖版本

  **Acceptance Criteria**:
  - [x]`npm test -- --passWithNoTests` 退出码 0
  - [x]`npm run lint` 退出码 0

  **QA Scenarios**:
  ```
  Scenario: Jest works
    Tool: Bash
    Steps: npm test -- --passWithNoTests
    Expected Result: Exit code 0
    Evidence: .sisyphus/evidence/task-02-jest.txt
  ```

  **Commit**: NO (groups with Wave 1)

- [x] 3. **TypeScript Source Structure**

  **What to do**:
  - 创建 `packages/core/src/` 目录结构
  - 创建子目录: runtime/, executor/, context/, evolution/, network/, extension-system/
  - 创建 `index.ts` 导出占位模块

  **Must NOT do**:
  - 不创建任何实现代码

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: 4, 5
  - **Blocked By**: Task 1

  **References**:
  - `PLAN.md:659-686` - 项目结构定义

  **Acceptance Criteria**:
  - [x]所有子目录存在
  - [x]`src/index.ts` 存在

  **QA Scenarios**:
  ```
  Scenario: Directory structure exists
    Tool: Bash
    Steps: ls packages/core/src/
    Expected Result: Shows all subdirectories
    Evidence: .sisyphus/evidence/task-03-structure.txt
  ```

  **Commit**: NO (groups with Wave 1)

- [x]4. **Core Type Interfaces**

  **What to do**:
  - 创建 `src/types.ts` 包含所有核心接口
  - 定义 AgentRuntime, Task, TaskResult 接口
  - 定义 Executor, ExecuteOptions 接口
  - 定义 ContextManager 接口
  - 定义 Extension, Capability 接口
  - 为每个接口添加 JSDoc 注释

  **Must NOT do**:
  - 不使用 `any` 类型
  - 不添加实现代码

  **Recommended Agent Profile**:
  - **Category**: `coding-aux`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: 5, 6, 7, 8
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - `PLAN.md:484-576` - 核心接口设计

  **Acceptance Criteria**:
  - [x]`npx tsc --noEmit` 成功
  - [x]所有接口有 JSDoc

  **QA Scenarios**:
  ```
  Scenario: TypeScript compiles
    Tool: Bash
    Steps: cd packages/core && npx tsc --noEmit
    Expected Result: Exit code 0
    Evidence: .sisyphus/evidence/task-04-tsc.txt
  ```

  **Commit**: NO (groups with Wave 2)

- [x]5. **Local Executor**

  **What to do**:
  - 创建 `src/executor/interface.ts`
  - 创建 `src/executor/local.ts`
  - 实现 `execute(command, options)` 方法
  - 实现超时控制
  - 实现 Windows/Unix 命令兼容

  **Must NOT do**:
  - 不实现 Docker 执行器

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: 9
  - **Blocked By**: Task 4

  **References**:
  - `PLAN.md:519-551` - Executor 接口设计

  **Acceptance Criteria**:
  - [x]基本命令执行成功
  - [x]超时功能正常
  - [x]Windows 命令兼容

  **QA Scenarios**:
  ```
  Scenario: Basic command execution
    Tool: Bash
    Steps: npm test -- --testNamePattern="basic command"
    Expected Result: Test passes
    Evidence: .sisyphus/evidence/task-05-executor.txt
  ```

  - [x]6. **Mock OpenViking Client**

  **What to do**:
  - 创建 `src/context/mock-client.ts`
  - 实现 ContextManager 接口
  - 提供内存存储用于离线测试
  - 支持基本操作: connect, disconnect, query, addResource

  **Must NOT do**:
  - 不连接真实服务器
  - 不实现高级搜索功能

  **Recommended Agent Profile**:
  - **Category**: `coding-aux`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: 7, 9
  - **Blocked By**: Task 4

  **References**:
  - `PLAN.md:243-335` - OpenViking 集成指南
  - `src/types.ts` - ContextManager 接口

  **Acceptance Criteria**:
  - [x]Mock client 实现所有 ContextManager 方法
  - [x]测试无需网络连接
  - [x]内存存储正常工作

  **QA Scenarios**:
  ```
  Scenario: Mock client works offline
    Tool: Bash
    Steps: npm test -- --testNamePattern="mock client"
    Expected Result: All tests pass without network
    Evidence: .sisyphus/evidence/task-06-mock.txt
  ```

  **Commit**: NO (groups with Wave 3)

- [x]7. **Real OpenViking Client**

  **What to do**:
  - 创建 `src/context/openviking-client.ts`
  - 使用 `@modelcontextprotocol/sdk` 连接 OpenViking MCP Server
  - 实现连接/断开/重连逻辑
  - 实现 query, addResource 方法

  **Must NOT do**:
  - 不实现 search 高级功能
  - 不添加缓存层

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: 9
  - **Blocked By**: Tasks 4, 6

  **References**:
  - `PLAN.md:243-335` - OpenViking 集成指南
  - https://modelcontextprotocol.io/docs/sdk - MCP SDK 文档

  **Acceptance Criteria**:
  - [x]可连接 OpenViking MCP Server
  - [x]query 方法返回结果
  - [x]连接失败时抛出正确错误
  - [x]Mock 模式可用

  **QA Scenarios**:
  ```
  Scenario: Client connects to server
    Tool: Bash
    Steps: npm test -- --testNamePattern="openviking client connect"
    Expected Result: Test passes (with mocked server)
    Evidence: .sisyphus/evidence/task-07-openviking.txt
  ```

  **Commit**: NO (groups with Wave 3)

- [x]8. **Extension System Framework**

  **What to do**:
  - 创建 `src/extension-system/registry.ts`
  - 创建 `src/extension-system/loader.ts`
  - 创建 `src/extension-system/capability-router.ts`
  - 实现扩展注册/加载/卸载
  - 实现能力路由

  **Must NOT do**:
  - 不实现热重载
  - 不实现扩展市场
  - 不实现版本管理

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 9)
  - **Blocks**: 9
  - **Blocked By**: Task 4

  **References**:
  - `PLAN.md:553-576` - Extension 接口设计
  - `src/types.ts` - Extension, Capability 接口

  **Acceptance Criteria**:
  - [x]扩展可动态加载
  - [x]能力路由正常工作
  - [x]扩展生命周期完整

  **QA Scenarios**:
  ```
  Scenario: Extension loads successfully
    Tool: Bash
    Steps: npm test -- --testNamePattern="extension load"
    Expected Result: Test passes
    Evidence: .sisyphus/evidence/task-08-extension.txt
  ```

  **Commit**: NO (groups with Wave 4)

- [x]9. **CLI Entry Point**

  **What to do**:
  - 创建 `src/cli/index.ts`
  - 实现 `jclaw exec <prompt>` 命令
  - 实现 `jclaw config get/set` 命令
  - 实现错误处理和退出码
  - 添加 --help 和 --version

  **Must NOT do**:
  - 不实现交互模式
  - 不实现命令历史
  - 不实现自动补全

  **Recommended Agent Profile**:
  - **Category**: `coding-aux`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 8)
  - **Blocks**: 10
  - **Blocked By**: Tasks 5, 6, 7, 8

  **References**:
  - `PLAN.md:577-655` - 配置规范
  - Commander.js 或类似库 - CLI 框架

  **Acceptance Criteria**:
  - [x]`jclaw --help` 显示用法
  - [x]`jclaw exec "echo test"` 执行成功
  - [x]`jclaw config get` 正常工作
  - [x]错误时退出码非 0

  **QA Scenarios**:
  ```
  Scenario: CLI help works
    Tool: Bash
    Steps: node dist/cli/index.js --help
    Expected Result: Shows usage information
    Evidence: .sisyphus/evidence/task-09-cli-help.txt

  Scenario: CLI exec works
    Tool: Bash
    Steps: node dist/cli/index.js exec "echo test"
    Expected Result: Output contains "test"
    Evidence: .sisyphus/evidence/task-09-cli-exec.txt
  ```

  **Commit**: NO (groups with Wave 4)

- [x]10. **Integration Test Suite**

  **What to do**:
  - 创建 `tests/integration/` 目录
  - 创建端到端测试覆盖完整工作流
  - 测试 CLI → Executor → OpenViking 流程
  - 测试扩展加载和调用

  **Must NOT do**:
  - 不依赖外部服务
  - 不添加性能测试

  **Recommended Agent Profile**:
  - **Category**: `coding-aux`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (Sequential)
  - **Blocks**: None
  - **Blocked By**: Task 9

  **References**:
  - All previous tasks - 集成测试覆盖

  **Acceptance Criteria**:
  - [x]所有集成测试通过
  - [x]覆盖率 > 80%
  - [x]Windows 环境测试通过

  **QA Scenarios**:
  ```
  Scenario: Full integration test
    Tool: Bash
    Steps: npm test
    Expected Result: All tests pass, coverage > 80%
    Evidence: .sisyphus/evidence/task-10-integration.txt
  ```

  **Commit**: YES
  - Message: `test(core): add integration tests`
  - Files: `tests/integration/**`
  - Pre-commit: `npm test`

---


- [x]F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x]F2. **Code Quality Review** — `unspecified-high`
      Run `tsc --noEmit` + `npm run lint` + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod.
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | VERDICT`

- [x]F3. **Windows Compatibility QA** — `unspecified-high`
      Execute EVERY QA scenario on Windows. Verify all shell commands work. Test path handling with Windows paths.
      Output: `Scenarios [N/N pass] | Windows Commands [N/N] | Path Handling [CLEAN/N issues] | VERDICT`

- [x]F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec. Check "Must NOT do" compliance.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **Wave 1 Complete**: `chore(core): setup project configuration (ESM, Jest, ESLint, Prettier)`
- **Wave 2 Complete**: `feat(core): add type definitions and local executor`
- **Wave 3 Complete**: `feat(core): add OpenViking client with mock support`
- **Wave 4 Complete**: `feat(core): add extension system and CLI`
- **Wave 5 Complete**: `test(core): add integration tests`

---

## Success Criteria

### Verification Commands

```bash
npm run build          # TypeScript 编译成功
npm test               # 所有测试通过
npm run lint           # ESLint 无错误
npm run test:coverage  # 覆盖率 > 80%
```

### Final Checklist

- [x]All "Must Have" present
- [x]All "Must NOT Have" absent
- [x]All tests pass
- [x]Windows compatibility verified
- [x]Code coverage > 80%
