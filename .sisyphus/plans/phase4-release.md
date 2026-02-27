# JClaw Phase 4: 发布准备计划

## TL;DR

> **Quick Summary**: 准备 JClaw 发布到 npm，包括测试覆盖率、文档完善和发布配置。
>
> **Deliverables**:
>
> - 测试覆盖率 > 80% (核心)
> - 测试覆盖率 > 70% (扩展)
> - 发布配置完善
> - 根 README 文档
> - 示例配置文件
>
> **Estimated Effort**: Low (6 tasks)

---

## Context

### Phase 1-3 Recap

- ✅ Phase 1: 核心框架 (178 测试)
- ✅ Phase 2: OpenCode 扩展
- ✅ Phase 3: NanoClaw 扩展

### Phase 4 Goals

1. 确保测试覆盖率达标
2. 完善发布配置
3. 添加根目录文档
4. 验证 Windows 兼容性

---

## TODOs

- [x] 1. **运行测试并检查覆盖率**
     运行所有测试并生成覆盖率报告。

- [x] 2. **完善 package.json 发布配置**
     为所有包添加发布所需的配置。

- [x] 3. **创建根目录 README**
     创建项目根目录的 README.md。

- [x] 4. **添加示例配置文件**
     创建示例配置文件供用户参考。

- [x] 5. **Windows 兼容性验证**
     验证所有功能在 Windows 上正常工作。

- [x] 6. **最终验证**
     运行所有检查确保发布就绪。
---

## Success Criteria

### Verification Commands

```bash
# 运行所有测试
npm test

# 构建所有包
npm run build

# 检查覆盖率
npm run test:coverage
```

### Final Checklist

- [x] 所有测试通过
- [x] 构建成功
- [x] 发布配置完善
- [x] 文档完整
- [x] Windows 兼容
