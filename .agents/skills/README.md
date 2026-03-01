# JClaw Skills Directory

This directory contains JClaw skills in the standard `.agents/skills/` format.

## Directory Structure

```
.agents/skills/
├── http-client/
│   └── SKILL.md
├── json-tools/
│   └── SKILL.md
├── file-manager/
│   └── SKILL.md
└── README.md
```

## Skill Format

Each skill follows the standard SKILL.md format:

```yaml
---
name: skill-name
description: Brief description
version: 1.0.0
author: author-name
categories: [category1, category2]
tags: [tag1, tag2]
agents: [jclaw, claude-code, codex]
minJClawVersion: 0.8.0
permissions: [permission1]
---

# Skill Title

Detailed description...

## Capabilities
...

## Usage Examples
...
```

## Path Priority

JClaw searches for skills in this order:

1. **Project-level** (highest priority):
   - `.agents/skills/` (standard)
   - `.claude/skills/` (Claude compatible)
   - `.codex/skills/` (Codex compatible)
   - `.skills/` (generic)
   - `.jclaw/skills/` (legacy)

2. **Global-level**:
   - `~/.agents/skills/`
   - `~/.claude/skills/`
   - `~/.jclaw/skills/`

## Adding a New Skill

1. Create a directory: `.agents/skills/my-skill/`
2. Add `SKILL.md` with frontmatter and documentation
3. Implement the skill capabilities in your extension

## Compatibility

These skills are compatible with:
- JClaw Agent
- Claude Code
- Codex
- Any agent supporting the `.agents/skills/` format
