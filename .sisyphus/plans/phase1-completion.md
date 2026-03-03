# JClaw Phase 1 核心框架完成计划

## TL;DR

> **目标**: 完成 JClaw Phase 1 核心框架开发，达到生产就绪状态
>
> **当前状态**: 82% 完成 - 核心组件已实现，关键集成和测试待完善
>
> **关键任务**:
>
> - 修复 TaskExecutor 与 LocalExecutor 的集成
> - 实现 Docker 执行器
> - 连接 CLI exec 命令到 JClawAgent
> - 修复失败的测试并添加安全内核测试
>
> **预计工期**: 3-4 天
> **并行任务**: Wave 1-3 可并行，Wave 4 依赖前置

---

## 上下文

### 原始需求

根据 PLAN.md Phase 1 规划，需要完成 8 个核心组件：

1. 基础运行时 (runtime/)
2. 本地执行器 (executor/local.ts) ✅
3. Docker 执行器 (executor/docker.ts) ❌ 缺失
4. OpenViking 集成 (context/) ✅ 已替换为 SimpleMemory
5. Evolver 集成 (evolution/) ✅
6. EvoMap 集成 (network/) ✅
7. 扩展系统框架 (extension-system/) ✅
8. CLI 入口 (cli/) ⚠️ 部分实现

### 代码分析结果

**已完整实现 (85%)**:

- `packages/core/src/runtime/agent.ts` (227 行) - JClawAgent 完整实现
- `packages/core/src/executor/local.ts` (113 行) - LocalExecutor 跨平台支持
- `packages/core/src/context/simple-memory-client.ts` (313 行) - 增强记忆系统
- `packages/core/src/evolution/engine.ts` (227 行) - 进化引擎完整
- `packages/core/src/network/protocol.ts` (266 行) - A2A/GEP 协议
- `packages/core/tests/` (35 个测试文件) - 良好测试覆盖

**关键缺失 (15%)**:

- `packages/core/src/executor/docker.ts` - **文件不存在**
- `packages/core/src/cli/commands/exec.ts` - **Stub 实现**
- TaskExecutor 与 LocalExecutor 未正确连接
- EvolutionEngine 使用 mock 执行器
- 3 个失败的测试（中文关键词检测）
- 安全内核组件无测试

### Metis 审查建议

**关键风险**:

1. TaskExecutor 返回而不是执行命令（高风险）
2. EvolutionEngine 使用 mock 执行器（高风险）
3. CLI exec 命令未连接到 JClawAgent（高风险）
4. Logger 变量未定义（中等风险）

**Guardrails（执行约束）**:

- 修复 TaskExecutor 后才能实现 DockerExecutor
- 必须添加集成测试验证端到端工作流
- 安全内核组件必须有测试覆盖
- 不修改 SimpleMemory（已稳定运行）

---

## 工作目标

### 核心目标

完成 Phase 1 所有组件，使其能够：

1. 通过 CLI 执行本地任务
2. 支持 Docker 隔离执行
3. 自动技能发现和生成
4. 代码自我进化
5. 通过所有测试

### 具体交付物

- `packages/core/src/executor/docker.ts` - Docker 执行器
- `packages/core/src/executor/hybrid.ts` - 混合执行器（可选）
- 修复的 `packages/core/src/runtime/task-executor.ts`
- 完整的 `packages/core/src/cli/commands/exec.ts`
- 新增测试文件 5-8 个
- 更新的 `README.md` 使用说明

### 完成定义

- [ ] 所有 8 个 Phase 1 组件完整实现
- [ ] `npm test` 通过 100%（当前 3 个失败）
- [ ] `jclaw exec "echo hello"` 成功执行
- [ ] `jclaw exec "docker run hello-world"` 成功执行（Docker 模式）
- [ ] 测试覆盖率 > 80%

### 必须有

- Docker 执行器实现
- CLI 到 Agent 的连接
- TaskExecutor 修复
- 安全内核测试

### 必须不做的（Guardrails）

- 不重构 SimpleMemory（已稳定）
- 不添加 Phase 2/3 功能
- 不改变现有 API 接口
- 不引入新的外部依赖

---

## 验证策略

### 测试策略

- **框架**: Jest (已配置)
- **测试文件**: 35 个已有，新增 5-8 个
- **测试类型**:
  - 单元测试：每个修复的组件
  - 集成测试：端到端工作流
  - 安全测试：内核组件

### QA 策略

每个任务必须包含 Agent-Executed QA Scenarios：

- **前端/UI**: N/A（后端框架）
- **CLI/TUI**: tmux 运行命令，验证输出和退出码
- **API/库**: curl 或 bun 调用，验证响应
- **集成**: Playwright（如有 Web 界面）或 bash 脚本

---

## 执行策略

### 并行执行波浪

```
Wave 1 (立即开始 - 基础修复):
├── Task 1: 修复 TaskExecutor 与 LocalExecutor 集成
├── Task 2: 修复 EvolutionEngine mock 执行器问题
├── Task 3: 修复 complexity-assessor 中文测试失败
└── Task 4: 修复 logger 未定义问题

Wave 2 (Wave 1 完成后 - Docker 实现):
├── Task 5: 实现 DockerExecutor
├── Task 6: 实现 HybridExecutor (可选)
├── Task 7: 添加 DockerExecutor 测试
└── Task 8: 添加 HybridExecutor 测试 (可选)

Wave 3 (Wave 1 完成后 - CLI 集成):
├── Task 9: 连接 CLI exec 到 JClawAgent
├── Task 10: 添加 CLI 配置解析 (jclaw.yaml)
├── Task 11: 添加 CLI exec 测试
└── Task 12: 更新 CLI 文档

Wave 4 (所有前置完成后 - 安全与集成):
├── Task 13: 添加安全内核测试 (emergency-brake, rollback, sandbox)
├── Task 14: 添加 logger 工具测试
├── Task 15: 添加 agent-discovery 测试
├── Task 16: 运行完整集成测试套件
└── Task 17: 生成测试覆盖率报告

Wave FINAL (验证):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review
├── Task F3: End-to-end manual QA
└── Task F4: Documentation review

关键路径: Task 1 → Task 5 → Task 9 → Task 16 → F1-F4
并行加速: ~60% 快于顺序执行
```

### Agent 分配摘要

- **Wave 1**: 4 个任务 → `quick` (简单修复)
- **Wave 2**: 4 个任务 → `deep` (Docker 实现复杂)
- **Wave 3**: 4 个任务 → `quick` + `unspecified-high` (CLI 集成)
- **Wave 4**: 5 个任务 → `unspecified-high` (测试编写)
- **FINAL**: 4 个任务 → `oracle`, `unspecified-high`, `deep`

---

## TODOs

- [ ] **1. 修复 TaskExecutor 与 LocalExecutor 集成**

  **What to do**:
  - 读取 `packages/core/src/runtime/task-executor.ts` 第 93-96 行
  - 当前代码直接返回结果而不执行命令（`return result;`）
  - 修改为用 `LocalExecutor` 实际执行命令
  - 确保 stdout/stderr/exitCode 正确传递
  - 添加单元测试验证命令实际执行

  **Must NOT do**:
  - 不改变现有接口签名
  - 不删除现有重试逻辑
  - 不引入新的依赖

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 2, Task 5
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] TaskExecutor 使用 LocalExecutor 执行命令
  - [ ] `tests/runtime/task-executor.test.ts` 通过
  - [ ] 新增测试：验证 `echo hello` 返回 stdout="hello\\n"

  **Commit**: YES
  - Message: `fix(runtime): wire LocalExecutor to TaskExecutor`

- [ ] **2. 修复 EvolutionEngine mock 执行器问题**

  **What to do**:
  - 读取 `packages/core/src/evolution/engine.ts` 第 65-82 行
  - 当前使用 `options.executor` 但未验证是否为 mock
  - 修改为用传入的真实执行器
  - 确保 SandboxValidator 使用正确的执行器

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Acceptance Criteria**:
  - [ ] EvolutionEngine 使用真实的 LocalExecutor
  - [ ] `tests/evolution/engine.test.ts` 通过

  **Commit**: YES
  - Message: `fix(evolution): use real LocalExecutor instead of mock`

- [ ] **3. 修复 complexity-assessor 中文测试失败**

  **What to do**:
  - 读取 `packages/core/src/runtime/complexity-assessor.ts` 第 24-30 行
  - 问题：中文关键词检测使用 `.toLowerCase()`，但中文无大小写
  - 修复匹配逻辑，移除中文的 case 转换
  - 运行测试验证修复

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Acceptance Criteria**:
  - [ ] 3 个失败的测试全部通过
  - [ ] 保留中文关键词检测功能

  **Commit**: YES
  - Message: `fix(runtime): fix Chinese keyword detection`

- [ ] **4. 修复 logger 未定义问题**

  **What to do**:
  - 搜索使用 `logger` 但未导入的文件
  - 特别检查 `packages/core/src/runtime/task-executor.ts`
  - 添加正确的 logger 导入
  - 确保所有 logger 调用都有定义

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Acceptance Criteria**:
  - [ ] 所有使用 logger 的文件都有正确导入
  - [ ] `npm run build` 无错误
  - [ ] `npm test` 无 logger 相关错误

  **Commit**: YES
  - Message: `fix(utils): fix undefined logger`

---

## Final Verification Wave

- [ ] **5. 实现 DockerExecutor**

  **What to do**:
  - 创建 `packages/core/src/executor/docker.ts`
  - 实现 Executor 接口，使用 Docker API 或 child_process spawn docker
  - 支持容器创建、执行、日志获取、清理
  - 支持镜像拉取、环境变量、工作目录映射
  - 参考 LocalExecutor 的实现模式
  - 添加完整的单元测试

  **Must NOT do**:
  - 不引入 dockerode 等重依赖（使用 child_process 调用 CLI）
  - 不支持 Docker Compose（Phase 1 仅基础容器）

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Task 1)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] DockerExecutor 类实现 Executor 接口
  - [ ] 支持 `docker run` 执行命令
  - [ ] 支持超时控制
  - [ ] `tests/executor/docker.test.ts` 通过
  - [ ] `jclaw exec --mode docker "echo hello"` 成功

  **Commit**: YES
  - Message: `feat(executor): implement DockerExecutor for containerized execution`

- [ ] **6. 实现 HybridExecutor（可选）**

  **What to do**:
  - 创建 `packages/core/src/executor/hybrid.ts`
  - 根据任务复杂度或配置选择 Local 或 Docker 执行器
  - 实现策略模式切换

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Task 5)
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] HybridExecutor 根据规则选择执行器
  - [ ] `tests/executor/hybrid.test.ts` 通过

  **Commit**: YES (optional)

- [ ] **7. 连接 CLI exec 到 JClawAgent**

  **What to do**:
  - 修改 `packages/core/src/cli/commands/exec.ts`（当前是 stub）
  - 实现完整的 exec 命令逻辑：
    1. 解析命令行参数
    2. 加载 jclaw.yaml 配置
    3. 初始化 JClawAgent
    4. 调用 agent.execute()
    5. 输出结果到控制台
  - 支持 `--mode` 参数（local/docker）
  - 支持 `--config` 参数指定配置文件

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Task 1)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `jclaw exec "echo hello"` 输出 "hello"
  - [ ] `jclaw exec --mode docker "echo hello"` 在容器中执行
  - [ ] 支持配置文件加载
  - [ ] `tests/cli/exec.test.ts` 通过

  **Commit**: YES
  - Message: `feat(cli): implement exec command with JClawAgent integration`

- [ ] **8. 添加 CLI 配置解析 (jclaw.yaml)**

  **What to do**:
  - 实现 jclaw.yaml 配置文件解析
  - 支持配置：LLM、执行模式、扩展、日志级别等
  - 集成到 CLI 和 JClawAgent
  - 参考 `jclaw.yaml.example` 中的配置项

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 Task 7 并行)
  - **Parallel Group**: Wave 3

  **Acceptance Criteria**:
  - [ ] 解析 jclaw.yaml 配置文件
  - [ ] 配置项正确传递给 JClawAgent
  - [ ] 测试覆盖配置解析

  **Commit**: YES
  - Message: `feat(cli): add jclaw.yaml configuration parsing`

---

## Final Verification Wave

- [ ] **F1. 添加安全内核测试 (emergency-brake)**

  **What to do**:
  - 创建 `packages/core/tests/evolution/kernel/emergency-brake.test.ts`
  - 测试紧急制动功能：
    - 检测到危险操作时的立即停止
    - 制动后的状态清理
    - 制动日志记录
  - 参考 `packages/core/src/evolution/kernel/emergency-brake.ts`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Acceptance Criteria**:
  - [ ] 紧急制动测试覆盖所有场景
  - [ ] 测试通过

  **Commit**: YES
  - Message: `test(evolution): add emergency-brake tests`

- [ ] **F2. 添加安全内核测试 (rollback-manager)**

  **What to do**:
  - 创建 `packages/core/tests/evolution/kernel/rollback-manager.test.ts`
  - 测试状态回滚功能

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Acceptance Criteria**:
  - [ ] 回滚管理器测试覆盖

  **Commit**: YES
  - Message: `test(evolution): add rollback-manager tests`

- [ ] **F3. 添加 logger 工具测试**

  **What to do**:
  - 创建 `packages/core/tests/utils/logger.test.ts`
  - 测试日志级别、格式化、输出

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Acceptance Criteria**:
  - [ ] logger 测试通过

  **Commit**: YES

- [ ] **F4. 运行完整集成测试套件**

  **What to do**:
  - 运行 `npm test` 验证所有测试
  - 确保 0 失败
  - 生成覆盖率报告

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Acceptance Criteria**:
  - [ ] `npm test` 100% 通过
  - [ ] 覆盖率 > 80%

  **Commit**: NO

- [ ] **F5. Plan compliance audit (oracle)**

  **What to do**:
  - 检查所有 TODO 任务是否完成
  - 验证交付物存在
  - 检查代码质量

  **Recommended Agent Profile**:
  - **Category**: `oracle`
  - **Skills**: []

  **Acceptance Criteria**:
  - [ ] 所有 Must Have 完成
  - [ ] 代码质量检查通过

  **Commit**: NO

- [ ] **F6. End-to-end manual QA**

  **What to do**:
  - 手动测试完整工作流：
    1. `npm run build` 成功
    2. `jclaw exec "echo hello"` 成功
    3. `jclaw exec --mode docker "echo hello"` 成功（如有 Docker）
    4. 自动技能生成工作

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Acceptance Criteria**:
  - [ ] 端到端测试通过

  **Commit**: NO

---

## Commit Strategy

### 提交规范
- **Type**: feat|fix|test|docs|refactor
- **Scope**: runtime|executor|evolution|cli|network|context|extension-system|tests
- **Message**: `<type>(<scope>): <description>`

### 提交序列

```
Wave 1:
1. fix(runtime): wire LocalExecutor to TaskExecutor
2. fix(evolution): use real LocalExecutor instead of mock
3. fix(runtime): fix Chinese keyword detection
4. fix(utils): fix undefined logger

Wave 2:
5. feat(executor): implement DockerExecutor
6. feat(executor): implement HybridExecutor (optional)

Wave 3:
7. feat(cli): implement exec command with JClawAgent integration
8. feat(cli): add jclaw.yaml configuration parsing

Wave 4:
9. test(evolution): add emergency-brake tests
10. test(evolution): add rollback-manager tests
11. test(utils): add logger tests
12. test: add integration tests for end-to-end workflow
```

---

## Success Criteria

### 验证命令

```bash
# 1. 构建
npm run build

# 2. 测试
npm test
# Expected: 0 failures, coverage > 80%

# 3. CLI 本地执行
jclaw exec "echo hello"
# Expected: 输出 "hello"

# 4. CLI Docker 执行（如有 Docker）
jclaw exec --mode docker "echo hello"
# Expected: 在容器中执行并输出 "hello"

# 5. 配置文件
jclaw --config ./jclaw.yaml exec "echo test"
# Expected: 使用指定配置执行

# 6. 覆盖率报告
npm run test:coverage
# Expected: 终端显示覆盖率 > 80%
```

### Final Checklist

- [ ] 所有 8 个 Phase 1 组件完整实现
- [ ] `npm test` 100% 通过
- [ ] 测试覆盖率 > 80%
- [ ] `jclaw exec "echo hello"` 成功
- [ ] `jclaw exec --mode docker "echo hello"` 成功（可选）
- [ ] 代码质量检查通过
- [ ] 文档已更新

---

## 附录

### 关键文件清单

| 组件 | 文件路径 | 状态 |
|------|----------|------|
| Runtime | `src/runtime/agent.ts` | ✅ 存在 |
| TaskExecutor | `src/runtime/task-executor.ts` | ⚠️ 需修复 |
| LocalExecutor | `src/executor/local.ts` | ✅ 完整 |
| DockerExecutor | `src/executor/docker.ts` | ❌ 缺失 |
| SimpleMemory | `src/context/simple-memory-client.ts` | ✅ 完整 |
| EvolutionEngine | `src/evolution/engine.ts` | ✅ 完整 |
| A2A Protocol | `src/network/protocol.ts` | ✅ 完整 |
| ExtensionRegistry | `src/extension-system/registry.ts` | ✅ 完整 |
| CLI Entry | `src/cli/commands/exec.ts` | ⚠️ Stub |

### 测试文件清单

| 模块 | 测试文件 | 状态 |
|------|----------|------|
| Runtime | `tests/runtime/agent.test.ts` | ✅ 存在 |
| LocalExecutor | `tests/executor/local.test.ts` | ✅ 存在 |
| DockerExecutor | `tests/executor/docker.test.ts` | ❌ 缺失 |
| Evolution | `tests/evolution/engine.test.ts` | ✅ 存在 |
| EmergencyBrake | `tests/evolution/kernel/emergency-brake.test.ts` | ❌ 缺失 |
| RollbackManager | `tests/evolution/kernel/rollback-manager.test.ts` | ❌ 缺失 |
| CLI | `tests/cli/exec.test.ts` | ❌ 缺失 |




