# JClaw Agent Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装基本工具
RUN apk add --no-cache git curl

# 复制 package.json
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 暴露端口（如果需要）
EXPOSE 3000

# 工作目录
WORKDIR /workspace

# 默认命令
CMD ["node", "dist/index.js"]
