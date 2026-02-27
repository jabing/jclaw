# JClaw

> 通用自我进化 Agent 框架 - 记忆 + 进化 + 可扩展 + 跨平台

## 项目定位

JClaw 是一个**通用的自我进化 Agent 框架**：

- **核心独立** - 不强制依赖任何外部工具
- **持久记忆** - OpenViking 分层上下文
- **自我进化** - Evolver + EvoMap 变异继承
- **按需扩展** - OpenCode/NanoClaw 等可选
- **跨平台** - Windows/macOS/Linux，Docker 可选

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      JClaw 架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   核心层 (必需):                                            │
│   ├── OpenViking (上下文管理)                               │
│   ├── Evolver (进化引擎)                                    │
│   ├── EvoMap (基因继承)                                     │
│   └── 基础运行时 (无外部依赖)                               │
│                                                             │
│   扩展层 (可选):                                            │
│   ├── @jclaw/extension-opencode (专业编码)                  │
│   ├── @jclaw/extension-nanoclaw (WhatsApp)                  │
│   └── ... 自定义扩展                                        │
│                                                             │
│   执行模式 (可选):                                          │
│   ├── 本地模式 (默认，Windows 完美)                         │
│   ├── Docker 模式 (可选，需要隔离时)                        │
│   └── 混合模式 (可选，灵活切换)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 使用模式

### 模式 A: 最小化 (通用用户)

```bash
# 只安装核心
npm install jclaw-core

# 使用基础 Agent (本地模式)
jclaw exec "帮我分析这个项目结构"
```

### 模式 B: +编码 (开发者)

```bash
# 核心 + OpenCode 扩展
npm install jclaw-core @jclaw/extension-opencode

# 启用 OpenCode
jclaw config set extensions.opencode.enabled true

# 使用 LSP 编码能力
jclaw exec "重构 UserService，添加缓存"
```

### 模式 C: +消息 (移动办公)

```bash
# 核心 + NanoClaw 扩展
npm install jclaw-core @jclaw/extension-nanoclaw

# 通过 WhatsApp 触发
# WhatsApp: @jclaw 检查项目测试覆盖率
```

## 执行模式

| 模式 | Windows | 隔离 | 适用场景 |
|-----|---------|------|---------|
| **本地模式** | ✅ 完美 | 无 | 日常开发、可信环境 |
| **Docker 模式** | ⚠️ 需配置 | 完整 | 不可信代码、生产环境 |
| **混合模式** | ✅ 可用 | 可选 | 灵活切换 |

## 技术栈

### 核心 (必需)
- [OpenViking](https://github.com/volcengine/OpenViking) - 上下文管理
- [Evolver](https://github.com/autogame-17/evolver) - 进化引擎
- [EvoMap](https://evomap.ai) - 基因继承

### 扩展 (可选)
- [OpenCode](https://opencode.ai) - 专业编码 (LSP)
- [NanoClaw](https://github.com/qwibitai/nanoclaw) - WhatsApp 入口

## 文档

- [实施计划](./PLAN.md) - 完整架构和路线图 (v4.0)
- [任务清单](./TASKS.md) - 详细任务追踪

## 核心特性

### 🧠 持久记忆
- L0/L1/L2 三层上下文
- 混合检索（语义 + 关键词）
- 跨会话保持知识

### 🧬 自我进化
- 自动检测进化机会
- 沙箱验证变异
- EvoMap 基因继承

### 🔌 可扩展
- 统一扩展接口
- 按需安装
- 自定义扩展开发

### 💻 跨平台
- Windows 本地执行 (默认)
- Docker 可选
- macOS / Linux 支持

### 📦 零强制依赖
- 核心独立运行
- 扩展可选安装
- Docker 可选

## 项目结构

```
jclaw/
├── packages/
│   ├── core/                  # 核心包 (必需)
│   │   ├── runtime/           # 基础运行时
│   │   ├── executor/          # 执行器 (local/docker)
│   │   ├── context/           # OpenViking
│   │   ├── evolution/         # Evolver
│   │   └── network/           # EvoMap
│   └── extensions/            # 扩展包 (可选)
│       ├── extension-opencode/
│       └── extension-nanoclaw/
├── config/
└── docs/
```

## 开发状态

✅ **Phase 1 完成** - 核心框架
✅ **Phase 2 完成** - OpenCode 扩展
✅ **Phase 3 完成** - NanoClaw 扩展
🔄 **Phase 4 进行中** - 发布准备

## 许可证

MIT License

---

**Version**: v4.0
**Updated**: 2026-02-26
