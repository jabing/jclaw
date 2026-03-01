# JClaw 真实服务部署指南

## TL;DR (30秒快速开始)

```bash
# 1. 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/jabing/jclaw/main/scripts/deploy-local.sh | bash

# 2. 设置 API Key
export OPENAI_API_KEY=sk-your-api-key

# 3. 启动服务
./start-services.sh

# 4. 验证安装
./scripts/verify-integration.sh
```

---

## 需要部署什么？

| 服务 | 部署方式 | 复杂度 | 时间 |
|------|---------|--------|------|
| **OpenViking** | 本地部署 | ⭐⭐⭐ | 5-10分钟 |
| **Evolver** | npm 全局安装 | ⭐ | 1分钟 |
| **EvoMap** | 使用云服务 | ⭐ | 无需部署 |

---

## 详细部署步骤

### 步骤1: 部署 OpenViking (必须)

**系统要求：**
- Python 3.10+
- 8GB+ RAM
- 10GB+ 磁盘

**一键部署：**
```bash
curl -fsSL https://raw.githubusercontent.com/jabing/jclaw/main/scripts/deploy-local.sh | bash
```

**手动部署：**
```bash
# 1. 创建虚拟环境
python3 -m venv ~/.openviking-env
source ~/.openviking-env/bin/activate  # Linux/Mac
# 或: .\openviking-env\Scripts\activate  # Windows

# 2. 安装
pip install openviking

# 3. 配置
mkdir -p ~/.openviking
cat > ~/.openviking/ov.conf << 'CONFIG'
{
  "storage": { "workspace": "~/.openviking/workspace" },
  "embedding": {
    "dense": {
      "api_base": "https://api.openai.com/v1",
      "api_key": "YOUR_OPENAI_API_KEY",
      "provider": "openai",
      "dimension": 3072,
      "model": "text-embedding-3-large"
    }
  },
  "vlm": {
    "api_base": "https://api.openai.com/v1",
    "api_key": "YOUR_OPENAI_API_KEY",
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
CONFIG

# 4. 启动
export OPENVIKING_CONFIG_FILE=~/.openviking/ov.conf
python -m openviking.server --port 2033
```

---

### 步骤2: 安装 Evolver (必须)

```bash
npm install -g evolver

# 验证
evolver --version
```

---

### 步骤3: 连接 EvoMap (云服务，无需部署)

EvoMap 使用官方云服务，只需要注册账号：

1. 访问 https://evomap.ai
2. 注册账号
3. 获取 API Key
4. 在 JClaw 中配置

```typescript
const client = createEvoMapClient({
  hubUrl: 'https://evomap.ai/api',
  nodeId: 'my-node',
});
```

---

## Docker 部署 (更简单)

```bash
# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f openviking
```

---

## 验证部署

```bash
./scripts/verify-integration.sh
```

预期输出：
```
====================================
🔍 JClaw 集成验证
====================================
[TEST] 检查环境变量...
  ✅ OPENAI_API_KEY 已设置
[TEST] 测试 OpenViking 连接...
  ✅ OpenViking 连接正常
[TEST] 测试 Evolver...
  ✅ Evolver 已安装: v1.20.0
[TEST] 测试 EvoMap 连接...
  ✅ EvoMap 可访问

====================================
📊 测试结果
====================================
  通过: 4
  失败: 0

✅ 所有测试通过!
```

---

## 运行示例

```bash
cd examples/real-integration
npm install

# 测试各个服务
npm run openviking
npm run evolver
npm run evomap

# 完整集成测试
npm run full
```

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `scripts/deploy-local.sh` | 一键部署脚本 |
| `scripts/verify-integration.sh` | 集成验证脚本 |
| `scripts/start-local.sh` | 服务启动脚本 |
| `docker-compose.yml` | Docker 部署配置 |
| `LOCAL_DEPLOYMENT_GUIDE.md` | 详细部署指南 |
| `REAL_INTEGRATION_GUIDE.md` | 集成使用指南 |

---

## 常见问题

**Q: OpenViking 启动失败？**
```bash
# 检查 Python 版本
python --version  # 需要 3.10+

# 检查端口占用
lsof -i :2033

# 查看详细日志
python -m openviking.server --port 2033 --verbose
```

**Q: Evolver 命令找不到？**
```bash
# 使用 npx
npx evolver --version

# 或检查 npm 全局路径
npm config get prefix
export PATH="$PATH:$(npm config get prefix)/bin"
```

**Q: 内存不足？**
- OpenViking 需要 8GB+ RAM
- 可以关闭其他应用释放内存
- 或使用 Docker 限制资源

---

## 下一步

部署完成后：
1. 运行验证脚本 `./scripts/verify-integration.sh`
2. 运行示例 `cd examples/real-integration && npm run full`
3. 开始开发你的 JClaw 应用！
