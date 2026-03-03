# JClaw Deployment Guide

Complete guide for deploying JClaw in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Deployment](#local-deployment)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Performance Tuning](#performance-tuning)

---

## Prerequisites

### System Requirements

| Requirement | Minimum             | Recommended |
| ----------- | ------------------- | ----------- |
| Node.js     | 18.0.0              | 20.0.0+     |
| Memory      | 512MB               | 2GB+        |
| Disk Space  | 100MB               | 1GB+        |
| OS          | Windows/macOS/Linux | -           |

### External Dependencies

| Component      | Required | Description                 |
| -------------- | -------- | --------------------------- |
| OpenAI API Key | Yes      | For LLM functionality       |
| Evolver        | Optional | For evolution features      |
| Docker         | Optional | For containerized execution |

---

## Local Deployment

### Quick Start

```bash
# 1. Install JClaw
npm install @jclaw/core

# 2. Set environment variables
export OPENAI_API_KEY=sk-your-key

# 3. Create configuration file
cat > jclaw.yaml << EOF
agent:
  name: my-agent
  version: 1.0.0

llm:
  apiBase: https://api.openai.com/v1
  model: gpt-4

execution:
  mode: local

memory:
  provider: simple
  path: ./data/memory
EOF

# 4. Run agent
npx jclaw start
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/jabing/jclaw.git
cd jclaw

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Configuration File

Create `jclaw.yaml` in your project root:

```yaml
# Agent Configuration
agent:
  name: jclaw-agent
  version: 1.0.0

# LLM Configuration
llm:
  apiBase: https://api.openai.com/v1
  apiKey: ${OPENAI_API_KEY}
  model: gpt-4
  temperature: 0.7
  maxTokens: 4096

# Execution Configuration
execution:
  mode: local # local, docker, hybrid

  local:
    restrictions:
      allowedPaths:
        - ./src
        - ./tests
      blockedCommands:
        - rm -rf
        - npm publish
      timeout: 30000

# Memory Configuration
memory:
  provider: simple
  path: ./data/memory
  enableSynonyms: true
  enableFuzzyMatch: true

# AutoSkill Configuration
autoSkill:
  enabled: true
  maxAttempts: 3
  qualityThreshold: 0.7
```

---

## Docker Deployment

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  jclaw:
    build: .
    ports:
      - '3000:3000'
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./data:/app/data
      - ./config:/app/config
    restart: unless-stopped
```

Run with:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f jclaw

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t jclaw:latest .

# Run container
docker run -d \
  --name jclaw-agent \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-key \
  -v $(pwd)/data:/app/data \
  jclaw:latest

# View logs
docker logs -f jclaw-agent
```

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Build
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start agent
CMD ["node", "dist/cli/index.js", "start"]
```

---

## Production Deployment

### High Availability Setup

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jclaw-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jclaw
  template:
    metadata:
      labels:
        app: jclaw
    spec:
      containers:
        - name: jclaw
          image: jclaw:latest
          ports:
            - containerPort: 3000
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef: jclaw-secrets
                key: openai-api-key
          resources:
            requests:
              memory: '512Mi'
              cpu: '500m'
            limits:
              memory: '1Gi'
              cpu: '1'
---
apiVersion: v1
kind: Service
metadata:
  name: jclaw-service
spec:
  selector:
    app: jclaw
  ports:
    - port: 80
      targetPort: 3000
```

### Horizontal Scaling

```yaml
# kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: jclaw-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: jclaw-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      resource:
        name: jclaw-pods
        target:
          type: AverageValue
          averageValue: 5
```

---

## Environment Variables

### Required Variables

| Variable         | Description      | Example                     |
| ---------------- | ---------------- | --------------------------- |
| `OPENAI_API_KEY` | OpenAI API key   | `sk-...`                    |
| `JCLAW_LLM_BASE` | LLM API endpoint | `https://api.openai.com/v1` |
| `JCLAW_MODEL`    | Model to use     | `gpt-4`                     |

### Optional Variables

| Variable               | Description            | Default         |
| ---------------------- | ---------------------- | --------------- |
| `JCLAW_MEMORY_PATH`    | Memory storage path    | `./data/memory` |
| `JCLAW_EXECUTION_MODE` | Execution mode         | `local`         |
| `JCLAW_VERBOSE`        | Enable verbose logging | `false`         |
| `JCLAW_MAX_TOKENS`     | Max response tokens    | `4096`          |

### Setting Environment Variables

```bash
# Linux/macOS
export OPENAI_API_KEY=sk-your-key
export JCLAW_MODEL=gpt-4

# Windows PowerShell
$env:OPENAI_API_KEY = "sk-your-key"
$env:JCLAW_MODEL = "gpt-4"

# Docker
docker run -e OPENAI_API_KEY=sk-your-key jclaw:latest

# Kubernetes
kubectl create secret generic jclaw-secrets \
  --from-literal=openai-api-key=sk-your-key
```

---

## Monitoring

### Health Checks

```typescript
// Health check endpoint
import { createAgent } from '@jclaw/core';

const agent = createAgent({
  /* config */
});

// Check agent health
async function healthCheck() {
  return {
    status: agent.isRunning() ? 'healthy' : 'stopped',
    timestamp: new Date().toISOString(),
    memory: agent.context?.getStats?.() || null,
  };
}

// Express endpoint
app.get('/health', async (req, res) => {
  const health = await healthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Metrics Collection

```typescript
// Prometheus metrics
import client from 'prom-client';

// Define metrics
const taskCounter = new client.Counter({
  name: 'jclaw_tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status'],
});

const taskDuration = new client.Histogram({
  name: 'jclaw_task_duration_seconds',
  help: 'Task duration in seconds',
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
});

// Track metrics
agent.on('task:completed', (result) => {
  taskCounter.inc({ status: 'success' });
  taskDuration.observe(result.duration / 1000);
});

agent.on('task:failed', (error) => {
  taskCounter.inc({ status: 'failed' });
});
```

### Logging

```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'jclaw.log' }),
  ],
});

const agent = createAgent({
  // ... config
  verbose: true,
});

// Agent logs to winston
agent.on('log', (message) => {
  logger.info(message);
});
```

---

## Troubleshooting

### Common Issues

#### Agent Won't Start

``bash

# Check environment variables

echo $OPENAI_API_KEY

# Check Node.js version

node --version

# Check dependencies

npm ls @jclaw/core

# Check configuration

cat jclaw.yaml

````

#### Memory Issues
```bash
# Check memory stats
curl http://localhost:3000/api/stats

# Clear memory cache
rm -rf ./data/memory/*.cache

# Restart agent
npm run restart
````

#### Connection Issues

```bash
# Test LLM connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check network connectivity
ping api.openai.com
```

### Debug Mode

```bash
# Enable debug logging
export JCLAW_VERBOSE=true

# Run with debug output
npm run start

# View detailed logs
tail -f logs/jclaw.log
```

---

## Security Considerations

### API Key Protection

```bash
# Never commit API keys
# Add to .gitignore
echo "OPENAI_API_KEY=*" >> .gitignore

# Use environment variables
export OPENAI_API_KEY=$(cat .env | grep OPENAI_API_KEY | cut -d'=' -f2)
```

### Network Security

```yaml
# Restrict network access
execution:
  local:
    restrictions:
      allowedPaths:
        - ./project
      blockedCommands:
        - curl
        - wget
        - npm publish
```

### Container Security

```yaml
# Docker security options
services:
  jclaw:
    securityContext:
      runAsNonRoot: true
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
```

---

## Performance Tuning

### Memory Optimization

```yaml
memory:
  provider: simple
  enableSynonyms: true
  enableFuzzyMatch: true
  cacheSize: 1000 # Number of cached queries
  compactInterval: 86400000 # Compact every 24 hours (ms)
```

### Execution Optimization

```yaml
execution:
  mode: local
  timeout: 30000 # 30 seconds
  maxConcurrent: 5 # Max concurrent tasks
  retryAttempts: 3
  retryDelay: 1000 # 1 second between retries
```

### LLM Optimization

```yaml
llm:
  temperature: 0.7 # Lower for more consistent outputs
  maxTokens: 2048 # Limit response size
  timeout: 30000 # 30 second timeout
  retries: 2
```

### Scaling Guidelines

| Concurrent Tasks | Memory | CPU |
| ---------------- | ------ | --- |
| 1-5              | 512MB  | 0.5 |
| 5-10             | 1GB    | 1   |
| 10-20            | 2GB    | 2   |
| 20-50            | 4GB    | 4   |

---

## Quick Reference

### Useful Commands

```bash
# Start agent
npm run start

# Stop agent
npm run stop

# Run tests
npm test

# Build
npm run build

# Check logs
tail -f logs/jclaw.log

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down

# Kubernetes
kubectl apply -f k8s/
kubectl get pods
kubectl logs -f deployment/jclaw-deployment
```

### Health Endpoints

| Endpoint       | Description        |
| -------------- | ------------------ |
| `GET /health`  | Basic health check |
| `GET /ready`   | Readiness check    |
| `GET /stats`   | Memory statistics  |
| `GET /metrics` | Prometheus metrics |
