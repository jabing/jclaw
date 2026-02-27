# JClaw Phase 3: 消息入口扩展开发计划

## TL;DR

> **Quick Summary**: 为 JClaw 实现消息入口扩展，支持通过 WhatsApp/NanoClaw 触发任务。
>
> **Deliverables**:
>
> - @jclaw/extension-nanoclaw 扩展包
> - NanoClaw 适配器
> - 消息路由器
> - 与 JClaw 核心的集成
>
> **Estimated Effort**: Medium (2 weeks, ~8 tasks)
> **External Dependency**: NanoClaw (https://github.com/qwibitai/nanoclaw)

---

## Context

### Phase 1-2 Recap

- ✅ 核心框架 (ESM, Jest, Executor, Context, Extension System, CLI)
- ✅ OpenCode 扩展 (code_edit, refactor, analyze)
- ✅ 178+ 核心测试通过

### Phase 3 Goals

1. 研究 NanoClaw 架构
2. 实现 @jclaw/extension-nanoclaw 扩展
3. 实现消息路由器
4. 与 JClaw 核心联动

---

## Work Objectives

### Core Objective

实现 NanoClaw 扩展，使用户可以通过 WhatsApp 等消息平台触发 JClaw 任务。

### Concrete Deliverables

- `packages/extensions/extension-nanoclaw/` - 扩展包
- `packages/extensions/extension-nanoclaw/src/index.ts` - 扩展入口
- `packages/extensions/extension-nanoclaw/src/adapter.ts` - NanoClaw 适配器
- `packages/extensions/extension-nanoclaw/src/message-router.ts` - 消息路由
- `packages/extensions/extension-nanoclaw/src/capabilities.ts` - 能力定义

### Definition of Done

- [x] NanoClaw 扩展可以注册到 JClaw
- [x] 扩展提供 message_receive, message_send, task_trigger 能力
- [x] 所有测试通过
- [x] 文档完成

### Must Have

- NanoClaw 扩展入口实现
- 消息路由器
- 能力定义 (message_receive, message_send, task_trigger)
- 与核心扩展系统的集成
- 基本测试

### Must NOT Have (Guardrails)

- ❌ 不实现真实的 WhatsApp 连接 (使用 NanoClaw)
- ❌ 不修改 JClaw 核心
- ❌ 不添加复杂的消息队列

---

## TODOs

- [x] 1. **研究 NanoClaw 架构**
     研究 NanoClaw 项目，了解其 WhatsApp 集成方式。

- [x] 2. **创建 extension-nanoclaw 包结构**
     创建扩展包的基础结构。

- [x] 3. **实现扩展入口和能力定义**
     实现扩展的入口文件和能力定义。

- [x] 4. **实现 NanoClaw 适配器"
     实现 NanoClaw 的适配器，封装调用逻辑。

- [x] 5. **实现消息路由器"
     实现消息路由器，处理消息分发。

- [x] 6. **与 JClaw 核心集成"
     将扩展与 JClaw 核心集成。

- [x] 7. **集成测试"
     编写扩展的集成测试。

- [x] 8. **文档编写"
     编写 NanoClaw 扩展的使用文档。

---

## Success Criteria

### Verification Commands

```bash
# 构建扩展
cd packages/extensions/extension-nanoclaw && npm run build

# 运行测试
npm test -- --testPathPattern=extension-nanoclaw
```

### Final Checklist

- [x] 扩展包创建完成
- [x] 能力定义实现
- [x] 与核心集成成功
- [x] 测试通过
- [x] 文档完成
