# JClaw Phase 3 - NanoClaw 扩展完成计划

## TL;DR

> **目标**: 实现 NanoClaw 扩展，提供 WhatsApp 消息入口
>
> **当前状态**: 基础框架存在，消息路由和任务触发待完善
>
> **关键任务**:
>
> - 完善 NanoClawAdapter 通信
> - 实现 MessageRouter 消息路由
> - 实现 TaskTrigger 任务触发
> - 添加消息格式化
> - 完整测试
>
> **预计工期**: 1-2 天
> **并行任务**: Wave 1-2 可并行

---

## 上下文

### 原始需求

根据 PLAN.md Phase 3 规划：

1. NanoClaw 扩展 ⚠️ 基础框架存在，需完善
2. Telegram 扩展 (可选) - 本次不做

### 代码分析结果

**已存在 (60%)**:

- `packages/extensions/extension-nanoclaw/src/` - 基础框架
- `packages/extensions/extension-nanoclaw/README.md` - 文档说明
- 扩展结构和配置已配置

**需完善 (40%)**:

- NanoClawAdapter - 通信实现
- MessageRouter - 路由逻辑
- TaskTrigger - 任务触发
- MessageFormatter - 结果格式化

### 架构设计

```
WhatsApp Message
    ↓
NanoClaw Process
    ↓
NanoClawAdapter (JClaw Extension)
    ↓
MessageRouter
    ↓
TaskTrigger → JClaw Core
    ↓
MessageFormatter
    ↓
WhatsApp Reply
```

---

## 工作目标

### 核心目标

完善 NanoClaw 扩展，使其能够：

1. 通过 NanoClaw 接收 WhatsApp 消息
2. 根据规则路由消息
3. 从消息触发 JClaw 任务
4. 将任务结果格式化为消息回复
5. 通过 NanoClaw 发送回复

### 具体交付物

- 完善的 `packages/extensions/extension-nanoclaw/src/adapter.ts`
- 完善的 `packages/extensions/extension-nanoclaw/src/router.ts`
- 新建的 `packages/extensions/extension-nanoclaw/src/trigger.ts`
- 新建的 `packages/extensions/extension-nanoclaw/src/formatter.ts`
- 更新的 `packages/extensions/extension-nanoclaw/src/index.ts`
- 新增测试文件

### 完成定义

- [ ] 可以接收 WhatsApp 消息
- [ ] 可以根据规则路由消息
- [ ] 可以从消息触发 JClaw 任务
- [ ] 可以发送格式化的回复
- [ ] 所有测试通过
- [ ] 与 JClaw Core 集成成功

### 必须有

- NanoClawAdapter 通信
- MessageRouter 路由
- TaskTrigger 触发器
- MessageFormatter 格式化

### 必须不做的（Guardrails）

- 不实现 NanoClaw 本身（只是适配器）
- 不支持 Telegram（Phase 3 可选部分）
- 不修改 JClaw Core API

---

## 验证策略

### 测试策略

- **框架**: Jest (已配置)
- **测试类型**:
  - 单元测试：Adapter、Router、Trigger
  - 集成测试：与 JClaw Core
  - 端到端测试：完整消息流程

### QA 策略

- 模拟 NanoClaw 消息收发
- 验证路由规则
- 验证任务触发
- 验证结果格式化

---

## 执行策略

### 并行执行波浪

```
Wave 1 (基础通信):
├── Task 1: 完善 NanoClawAdapter
├── Task 2: 实现消息接收和发送
└── Task 3: 添加适配器测试

Wave 2 (路由和触发):
├── Task 4: 完善 MessageRouter
├── Task 5: 实现 TaskTrigger
├── Task 6: 实现 MessageFormatter
└── Task 7: 更新扩展入口

Wave 3 (集成与测试):
├── Task 8: 集成所有组件
├── Task 9: 添加集成测试
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

### Wave 1: 基础通信

- [ ] **1. 完善 NanoClawAdapter**

  **What to do**:
  - 修改 `packages/extensions/extension-nanoclaw/src/adapter.ts`
  - 实现与 NanoClaw 进程的通信（IPC/WebSocket）
  - 实现消息接收接口
  - 实现消息发送接口
  - 添加错误处理和重连逻辑

  **Acceptance Criteria**:
  - [ ] 可以连接到 NanoClaw 进程
  - [ ] 可以接收消息
  - [ ] 可以发送消息
  - [ ] 有错误处理和重连

- [ ] **2. 实现消息接收和发送**

  **What to do**:
  - 在 adapter 中实现消息格式解析
  - 支持 WhatsApp 消息格式
  - 实现消息队列
  - 实现消息确认机制

  **Acceptance Criteria**:
  - [ ] 可以接收 WhatsApp 消息
  - [ ] 可以发送 WhatsApp 消息
  - [ ] 消息格式正确

- [ ] **3. 添加适配器测试**

  **What to do**:
  - 创建/更新 `packages/extensions/extension-nanoclaw/tests/adapter.test.ts`
  - 测试连接功能
  - 测试消息收发
  - 测试错误处理

  **Acceptance Criteria**:
  - [ ] 测试覆盖主要场景
  - [ ] 测试通过

### Wave 2: 路由和触发

- [ ] **4. 完善 MessageRouter**

  **What to do**:
  - 修改 `packages/extensions/extension-nanoclaw/src/router.ts`
  - 实现规则匹配（字符串、正则、函数）
  - 实现优先级路由
  - 实现默认处理器
  - 添加路由统计

  **Acceptance Criteria**:
  - [ ] 支持多种匹配模式
  - [ ] 支持优先级
  - [ ] 支持默认处理器

- [ ] **5. 实现 TaskTrigger**

  **What to do**:
  - 创建 `packages/extensions/extension-nanoclaw/src/trigger.ts`
  - 实现从消息提取任务
  - 调用 JClaw Core 执行任务
  - 处理任务结果
  - 支持异步任务

  **Acceptance Criteria**:
  - [ ] 可以从消息触发任务
  - [ ] 可以获取任务结果
  - [ ] 支持长时间运行任务

- [ ] **6. 实现 MessageFormatter**

  **What to do**:
  - 创建 `packages/extensions/extension-nanoclaw/src/formatter.ts`
  - 将任务结果格式化为消息
  - 支持 Markdown 格式
  - 支持代码块
  - 处理长消息分段

  **Acceptance Criteria**:
  - [ ] 可以格式化文本结果
  - [ ] 可以格式化代码
  - [ ] 支持长消息分段

- [ ] **7. 更新扩展入口**

  **What to do**:
  - 修改 `packages/extensions/extension-nanoclaw/src/index.ts`
  - 初始化所有组件
  - 设置消息路由规则
  - 配置任务触发器
  - 处理扩展生命周期

  **Acceptance Criteria**:
  - [ ] 扩展可以正确初始化
  - [ ] 消息可以正确路由
  - [ ] 任务可以正确触发

### Wave 3: 集成与测试

- [ ] **8. 集成所有组件**

  **What to do**:
  - 确保 Adapter、Router、Trigger、Formatter 协同工作
  - 测试完整消息流程
  - 修复集成问题

  **Acceptance Criteria**:
  - [ ] 组件可以协同工作
  - [ ] 完整流程可用

- [ ] **9. 添加集成测试**

  **What to do**:
  - 创建/更新测试文件
  - 测试完整消息流程
  - 测试与 JClaw Core 集成
  - 测试错误场景

  **Acceptance Criteria**:
  - [ ] 集成测试覆盖主要场景
  - [ ] 测试通过

- [ ] **10. 运行完整测试套件**

  **What to do**:
  - 运行 `npm test` 在 extension-nanoclaw 包
  - 确保所有测试通过
  - 修复失败的测试

  **Acceptance Criteria**:
  - [ ] 所有测试通过
  - [ ] 无类型错误

- [ ] **11. 文档更新**

  **What to do**:
  - 更新 `packages/extensions/extension-nanoclaw/README.md`
  - 添加使用示例
  - 添加配置说明
  - 添加架构图

  **Acceptance Criteria**:
  - [ ] README 完整
  - [ ] 有使用示例

---

## Success Criteria

### 验证命令

```bash
# 构建
cd packages/extensions/extension-nanoclaw
npm run build

# 测试
npm test
# Expected: 100% 通过

# 类型检查
npx tsc --noEmit
# Expected: 0 错误
```

### Final Checklist

- [ ] 可以接收 WhatsApp 消息
- [ ] 可以根据规则路由消息
- [ ] 可以从消息触发 JClaw 任务
- [ ] 可以发送格式化的回复
- [ ] 所有测试通过
- [ ] 文档已更新

---

## 附录

### NanoClaw 参考

| 项目 | 链接 | 说明 |
|------|------|------|
| NanoClaw | https://github.com/qwibitai/nanoclaw | WhatsApp Bot 框架 |
| WhatsApp Web API | whatsapp-web.js | NanoClaw 底层 |

### 消息格式示例

```typescript
// 接收消息
interface IncomingMessage {
  id: string;
  from: string;      // user@s.whatsapp.net
  content: string;   // 消息内容
  timestamp: number;
}

// 发送消息
interface OutgoingMessage {
  to: string;        // user@s.whatsapp.net
  content: string;   // 消息内容
}
```

