# JClaw Official Skills

Official skill repository for JClaw Agent - optimized for the JClaw ecosystem.

## Quick Start

```bash
# Add skill to your JClaw agent
npx skills add jclaw-ai/github-integration
```

## Available Skills

| Skill | Description | Version | Downloads |
|-------|-------------|---------|-----------|
| github-integration | GitHub API operations | 1.0.0 | 1.2k |
| docker-management | Docker container management | 1.0.0 | 890 |
| kubernetes-deploy | K8s deployment automation | 1.0.0 | 650 |
| database-tools | Database operations | 1.0.0 | 540 |
| cloud-aws | AWS service integration | 1.0.0 | 430 |
| testing-framework | Test automation | 1.0.0 | 380 |
| documentation-gen | Documentation generation | 1.0.0 | 320 |
| security-scan | Security vulnerability scanning | 1.0.0 | 290 |
| ci-cd-automation | CI/CD pipeline automation | 1.0.0 | 250 |
| monitoring-setup | Monitoring and alerting | 1.0.0 | 210 |

## Skill Structure

```
skills/
├── github-integration/
│   ├── SKILL.md              # Skill definition (skill.sh standard)
│   ├── jclaw-extension/      # JClaw native extension
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── capabilities.ts
│   │   │   └── handlers/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── tests/
│   │   └── integration.test.ts
│   └── examples/
│       └── basic-usage.ts
```

## Creating a New Skill

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

MIT
