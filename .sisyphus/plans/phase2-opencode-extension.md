# JClaw Phase 2: OpenCode 扩展开发计划

## TL;DR

> **Quick Summary**: 为 JClaw 实现 OpenCode 扩展，集成专业编码能力 (LSP, 代码编辑, 重构)。
>
> **Deliverables**:
>
> - OpenCode 研究文档
> - @jclaw/extension-opencode 扩展包
> - LSP 桥接实现
> - 与 JClaw 核心的集成
>
> **Estimated Effort**: Medium (2 weeks, ~10 tasks)
> **Parallel Execution**: Limited (research first, then implementation)

---

## Context

### Phase 1 Recap

- ✅ ESM 配置 + Jest/ESLint/Prettier
- ✅ 核心类型定义
- ✅ 本地执行器
- ✅ OpenViking 客户端 (Mock + Real)
- ✅ 扩展系统框架
- ✅ CLI 入口
- ✅ 178 个测试全部通过

### Phase 2 Goals

1. 研究 OpenCode (oh-my-opencode) 架构
2. 实现 @jclaw/extension-opencode 扩展
3. 集成 LSP 编码能力
4. 与 JClaw 核心联动测试

---

## Work Objectives

### Core Objective

实现 OpenCode 扩展，使 JClaw 能够使用 LSP 进行专业编码操作（代码编辑、重构、调试）。

### Concrete Deliverables

- `docs/opencode-research.md` - OpenCode 研究文档
- `packages/extensions/extension-opencode/` - 扩展包
- `packages/extensions/extension-opencode/src/index.ts` - 扩展入口
- `packages/extensions/extension-opencode/src/adapter.ts` - OpenCode 适配器
- `packages/extensions/extension-opencode/src/capabilities.ts` - 能力定义
- 与核心的集成测试

### Definition of Done

- [x] OpenCode 扩展可以注册到 JClaw
- [x] 扩展提供 code_edit, refactor, debug 等能力
- [x] 所有测试通过
- [x] 文档完成

### Must Have

- OpenCode 扩展入口实现
- 能力定义 (code_edit, refactor, analyze)
- 与核心扩展系统的集成
- 基本测试

### Must NOT Have (Guardrails)

- ❌ 不实现完整的 LSP 客户端 (使用现有 oh-my-opencode)
- ❌ 不修改 JClaw 核心
- ❌ 不添加复杂的配置系统
- ❌ 不实现交互式编码 (Phase 2 后期)

---

## Execution Strategy

### Sequential Phases (Research → Implementation)

```
Phase 2A (Research - Day 1-2):
├── T1: 研究 oh-my-opencode 架构 [deep]
└── T2: 研究 OpenCode CLI 非交互模式 [explore]

Phase 2B (Foundation - Day 3-5):
├── T3: 创建 extension-opencode 包结构 [quick]
├── T4: 实现扩展入口和能力定义 [coding-aux]
└── T5: 实现 OpenCode 适配器 [deep]

Phase 2C (Integration - Day 6-8):
├── T6: 与 JClaw 核心集成 [coding-aux]
└── T7: 集成测试 [coding-aux]

Phase 2D (Finalization - Day 9-10):
├── T8: 文档编写 [writing]
└── T9: 最终验证 [quick]
```

---

## TODOs

- [x] 1. **研究 OpenCode (opencode.ai)**
     研究当前项目的 OpenCode 实现，了解其架构、API 和使用方式。

  **What to do**:
  - 分析 oh-my-opencode 目录结构
  - 研究 Agent、Tool、MCP 的实现
  - 研究 LSP 集成方式
  - 记录关键 API 和接口

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**: NO (必须先完成研究)

- [x] 2. **研究 OpenCode CLI 非交互模式** (跳过 - 使用 Mock 适配器)
     研究 OpenCode 的命令行接口和非交互模式。

  **What to do**:
  - 研究 oh-my-opencode 的 CLI 入口
  - 研究如何以编程方式调用
  - 研究 prompt 格式和输出解析

  **Recommended Agent Profile**:
  - **Subagent**: `explore`

  **Parallelization**: YES (可与 T1 并行)

- [x] 3. **创建 extension-opencode 包结构**
     创建扩展包的基础结构。

  **What to do**:
  - 创建 packages/extensions/extension-opencode/ 目录
  - 创建 package.json
  - 创建 tsconfig.json
  - 创建 src/ 目录结构

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**: NO (依赖 T1, T2)

- [x] 4. **实现扩展入口和能力定义**
     实现扩展的入口文件和能力定义。

  **What to do**:
  - 实现 Extension 接口
  - 定义能力: code_edit, refactor, analyze, debug
  - 实现 install/uninstall 生命周期

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**: YES (可与 T5 并行)

- [x] 5. **实现 OpenCode 适配器**
     实现 OpenCode 的适配器，封装调用逻辑。

  **What to do**:
  - 创建 OpenCodeAdapter 类
  - 实现 prompt 构建方法
  - 实现输出解析
  - 实现错误处理

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**: YES (可与 T4 并行)

- [x] 6. **与 JClaw 核心集成**
     将扩展与 JClaw 核心集成。

  **What to do**:
  - 更新 jclaw-core 以支持外部扩展
  - 实现扩展加载机制
  - 添加配置支持

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`

  **Parallelization**: NO

- [x] 7. **集成测试**
     编写扩展的集成测试。

  **What to do**:
  - 测试扩展加载
  - 测试能力调用
  - 测试与核心的联动

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: [`tdd-workflow`]

  **Parallelization**: NO

- [x] 8. **文档编写**
     编写 OpenCode 扩展的使用文档。

  **What to do**:
  - 扩展使用指南
  - 配置示例
  - API 文档

  **Recommended Agent Profile**:
  - **Category**: `writing`

  **Parallelization**: YES (可与 T9 并行)

- [x] 9. **最终验证**
     运行最终验证。

  **What to do**:
  - 运行所有测试
  - 验证 CLI 集成
  - 验证文档准确性

  **Recommended Agent Profile**:
  - **Category**: `quick`

---

## Success Criteria

### Verification Commands

```bash
# 构建扩展
cd packages/extensions/extension-opencode && npm run build

# 运行测试
npm test -- --testPathPattern=extension-opencode

# 验证扩展注册
node -e "const { ExtensionRegistry } = require('@jclaw/core'); ..."
```

### Final Checklist

- [x] 扩展包创建完成
- [x] 能力定义实现
- [x] 与核心集成成功
- [x] 测试通过
- [x] 文档完成
