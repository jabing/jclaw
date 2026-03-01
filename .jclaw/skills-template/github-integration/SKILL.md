---
name: github-integration
description: Complete GitHub API integration for JClaw - manage repositories, issues, PRs, and workflows
version: 1.0.0
author: jclaw-ai
categories: [devops, git, automation]
tags: [github, git, api, repository]
agents: [jclaw, openclaw, claude-code, codex]
minJClawVersion: 0.1.0
permissions: [github-api, repo-read, repo-write]
---

# GitHub Integration Skill

Comprehensive GitHub operations for JClaw agents.

## Capabilities

- Repository management (create, clone, fork)
- Issue operations (create, update, close, label)
- Pull request workflows (create, review, merge)
- Workflow automation (Actions, checks)
- Release management
- Code search and analysis

## When to Use

Use this skill when:
- User mentions "GitHub", "repo", "pull request", "issue"
- Need to interact with GitHub repositories
- Automating GitHub workflows
- Managing open source projects

## Installation

```bash
npx skills add jclaw-ai/github-integration
```

## Configuration

Set environment variable:
```bash
export GITHUB_TOKEN=your_token_here
```

## Usage Examples

### Create a repository
```
@jclaw Create a new GitHub repo called "my-project" with README
```

### Manage issues
```
@jclaw List open issues in this repo and close stale ones
```

### Pull request workflow
```
@jclaw Create PR from feature branch to main with description
```
