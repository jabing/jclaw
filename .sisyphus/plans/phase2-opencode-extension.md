# JClaw Phase 2 - OpenCode 扩展完成计划

## TL;DR

> **目标**: 完善 OpenCode 扩展，提供专业的 LSP 编码能力
>
> **当前状态**: 基础适配器已实现，LSP 桥接功能待完善
>
> **关键任务**:
>
> - 实现 LSP 桥接功能
> - 完善能力处理器（code_edit, refactor, analyze）
> - 添加 LSP 相关测试
>
> **预计工期**: 2-3 天
> **并行任务**: Wave 1-2 可并行

---

## 上下文

### 原始需求

根据 PLAN.md Phase 2 规划：

1. OpenCode 适配器 ✅ 已实现
2. **LSP 桥接** ⚠️ 待完善
3. **扩展测试** ⚠️ 待完善

### 代码分析结果

**已完整实现 (70%)**:

- `packages/extensions/extension-opencode/src/adapter.ts` (157 行) - OpenCode CLI 适配器
- `packages/extensions/extension-opencode/src/capabilities.ts` (76 行) - 能力定义
- `packages/extensions/extension-opencode/src/index.ts` (63 行) - 扩展入口
- `packages/extensions/extension-opencode/tests/adapter.test.ts` (432 行) - 完整测试
- `packages/extensions/extension-opencode/tests/integration.test.ts` (161 行) - 集成测试

**关键缺失 (30%)**:

- LSP 桥接实现 - 需要与 Language Server Protocol 通信
- 能力处理器实现 - code_edit, refactor, analyze 需要实际处理逻辑

### 当前扩展架构

```
OpenCode Extension
├── Adapter (CLI 调用) ✅
├── Capabilities (定义) ✅
├── Extension Interface ✅
└── LSP Bridge ❌ (待实现)
```

---

## 工作目标

### 核心目标

完善 OpenCode 扩展，使其能够：

1. 与 LSP 服务器通信
2. 实现 code_edit 能力（带 LSP 上下文）
3. 实现 refactor 能力
4. 实现 analyze 能力
5. 通过所有测试

### 具体交付物

- `packages/extensions/extension-opencode/src/lsp-bridge.ts` - LSP 桥接
- `packages/extensions/extension-opencode/src/handlers/` - 能力处理器
  - `code-edit.ts` - 代码编辑处理器
  - `refactor.ts` - 重构处理器
  - `analyze.ts` - 分析处理器
- 更新的 `capabilities.ts` - 添加处理器引用
- 新增测试文件

### 完成定义

- [ ] LSP 桥接功能完整
- [ ] 所有能力有实际处理器
- [ ] `npm test` 通过 100%
- [ ] 与 JClaw Core 集成测试通过

### 必须有

- LSP 桥接实现
- code_edit 处理器
- refactor 处理器
- analyze 处理器

### 必须不做的（Guardrails）

- 不实现完整的 LSP 客户端（使用现有库）
- 不修改 JClaw Core API
- 不引入重量级依赖

---

## 验证策略

### 测试策略

- **框架**: Jest (已配置)
- **测试类型**:
  - 单元测试：LSP 桥接、处理器
  - 集成测试：与 JClaw Core
  - 端到端测试：完整工作流

### QA 策略

- LSP 通信验证
- 文件编辑验证
- 重构操作验证

---

## 执行策略

### 并行执行波浪

```
Wave 1 (基础 LSP):
├── Task 1: 实现 LSP 桥接基础
├── Task 2: 实现 LSP 客户端连接
└── Task 3: 添加 LSP 桥接测试

Wave 2 (能力实现):
├── Task 4: 实现 code_edit 处理器
├── Task 5: 实现 refactor 处理器
├── Task 6: 实现 analyze 处理器
└── Task 7: 更新能力定义

Wave 3 (集成与测试):
├── Task 8: 集成处理器到扩展
├── Task 9: 添加处理器测试
├── Task 10: 运行完整测试套件
└── Task 11: 文档更新

Wave FINAL (验证):
├── Task F1: 代码审查
├── Task F2: 集成测试验证
└── Task F3: 示例验证
```

---

## TODOs

---

## TODOs

### Wave 1: LSP 桥接基础

- [ ] **1. 实现 LSP 桥接基础 (lsp-bridge.ts)**

  **What to do**:
  - 创建 `packages/extensions/extension-opencode/src/lsp-bridge.ts`
  - 实现 LSP 客户端连接管理
  - 支持 LSP 初始化、关闭
  - 支持标准 LSP 请求（initialize, shutdown, exit）
  - 支持文件操作通知（textDocument/didOpen, didChange, didSave, didClose）
  - 支持代码补全请求（textDocument/completion）
  - 使用 vscode-languageserver-protocol 或类似库

  **Acceptance Criteria**:
  - [ ] LSP 桥接类实现
  - [ ] 可以连接到 LSP 服务器
  - [ ] 可以发送/接收 LSP 消息
  - [ ] 有基本的错误处理

- [ ] **2. 实现 LSP 客户端连接**

  **What to do**:
  - 在 lsp-bridge.ts 中实现 LSP 客户端
  - 支持通过 stdio 连接到 LSP 服务器
  - 支持 LSP 服务器自动发现（常见语言）
  - 实现消息 ID 管理
  - 实现响应超时处理

  **Acceptance Criteria**:
  - [ ] 可以启动常见 LSP 服务器（typescript-language-server, pylsp 等）
  - [ ] 正确处理 LSP 握手流程
  - [ ] 正确处理消息响应

- [ ] **3. 添加 LSP 桥接测试**

  **What to do**:
  - 创建 `packages/extensions/extension-opencode/tests/lsp-bridge.test.ts`
  - 测试 LSP 连接
  - 测试消息发送/接收
  - 测试错误处理

  **Acceptance Criteria**:
  - [ ] 测试覆盖 LSP 桥接核心功能
  - [ ] 测试通过

### Wave 2: 能力处理器

- [ ] **4. 实现 code_edit 处理器**

  **What to do**:
  - 创建 `packages/extensions/extension-opencode/src/handlers/code-edit.ts`
  - 实现代码编辑逻辑：
    1. 打开文件（通过 LSP）
    2. 获取文件内容和 LSP 上下文
    3. 调用 OpenCode 进行编辑
    4. 应用编辑结果
    5. 保存文件
  - 支持增量编辑（LSP TextEdit）

  **Acceptance Criteria**:
  - [ ] 可以编辑文件
  - [ ] 使用 LSP 上下文
  - [ ] 应用编辑结果

- [ ] **5. 实现 refactor 处理器**

  **What to do**:
  - 创建 `packages/extensions/extension-opencode/src/handlers/refactor.ts`
  - 实现重构逻辑：
    - extract: 提取函数/变量
    - inline: 内联函数/变量
    - rename: 重命名符号
  - 使用 LSP 重构功能（textDocument/rename, workspace/executeCommand）

  **Acceptance Criteria**:
  - [ ] 支持 extract 重构
  - [ ] 支持 inline 重构
  - [ ] 支持 rename 重构

- [ ] **6. 实现 analyze 处理器**

  **What to do**:
  - 创建 `packages/extensions/extension-opencode/src/handlers/analyze.ts`
  - 实现代码分析逻辑：
    - 获取文件符号（textDocument/documentSymbol）
    - 获取悬停信息（textDocument/hover）
    - 获取诊断信息（textDocument/publishDiagnostics）
    - 代码结构分析
  - 返回分析结果

  **Acceptance Criteria**:
  - [ ] 可以分析代码结构
  - [ ] 返回符号信息
  - [ ] 返回诊断信息

- [ ] **7. 更新能力定义**

  **What to do**:
  - 修改 `packages/extensions/extension-opencode/src/capabilities.ts`
  - 为每个能力添加 handler 引用
  - 更新输入/输出 schema

  **Acceptance Criteria**:
  - [ ] 能力定义包含处理器
  - [ ] schema 正确

### Wave 3: 集成与测试

- [ ] **8. 集成处理器到扩展**

  **What to do**:
  - 修改 `packages/extensions/extension-opencode/src/index.ts`
  - 在 install 时初始化 LSP 桥接
  - 注册能力处理器
  - 在 uninstall 时清理资源

  **Acceptance Criteria**:
  - [ ] 扩展安装时初始化 LSP
  - [ ] 能力调用触发处理器
  - [ ] 扩展卸载时清理资源

- [ ] **9. 添加处理器测试**

  **What to do**:
  - 创建 `packages/extensions/extension-opencode/tests/handlers/` 测试文件
  - 测试 code_edit 处理器
  - 测试 refactor 处理器
  - 测试 analyze 处理器

  **Acceptance Criteria**:
  - [ ] 处理器测试覆盖主要场景
  - [ ] 测试通过

- [ ] **10. 运行完整测试套件**

  **What to do**:
  - 运行 `npm test` 在 extension-opencode 包
  - 确保所有测试通过
  - 修复失败的测试

  **Acceptance Criteria**:
  - [ ] 所有测试通过
  - [ ] 无类型错误

- [ ] **11. 文档更新**

  **What to do**:
  - 更新 `packages/extensions/extension-opencode/README.md`
  - 添加使用示例
  - 添加配置说明
  - 添加 LSP 配置说明

  **Acceptance Criteria**:
  - [ ] README 完整
  - [ ] 有使用示例
  - [ ] 有配置说明

---

## Success Criteria

### 验证命令

```bash
# 构建
cd packages/extensions/extension-opencode
npm run build

# 测试
npm test
# Expected: 100% 通过

# 类型检查
npx tsc --noEmit
# Expected: 0 错误
```

### Final Checklist

- [ ] LSP 桥接功能完整
- [ ] code_edit 处理器可用
- [ ] refactor 处理器可用
- [ ] analyze 处理器可用
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 与 JClaw Core 集成测试通过

---

## 附录

### LSP 服务器参考

| 语言 | LSP 服务器 | 安装命令 |
|------|-----------|---------|
| TypeScript | typescript-language-server | `npm i -g typescript-language-server` |
| Python | pylsp | `pip install python-lsp-server` |
| Rust | rust-analyzer | 随 Rust 安装 |
| Go | gopls | `go install golang.org/x/tools/gopls@latest` |

### 参考资源

- [LSP Specification](https://microsoft.github.io/language-server-protocol/)
- [vscode-languageserver-protocol](https://www.npmjs.com/package/vscode-languageserver-protocol)

