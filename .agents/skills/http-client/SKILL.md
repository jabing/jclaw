---
name: http-client
description: HTTP client for making API requests
version: 1.0.0
author: jclaw-ai
categories: [network, api]
tags: [http, client, api, fetch]
agents: [jclaw, claude-code, codex]
minJClawVersion: 0.8.0
permissions: [network-access]
---

# HTTP Client Skill

A simple HTTP client skill for making API requests.

## Capabilities

- **http_get**: Make HTTP GET requests
- **http_post**: Make HTTP POST requests
- **http_request**: Make generic HTTP requests with custom method

## When to Use

Use this skill when:
- User mentions "HTTP request", "API call", "fetch"
- Need to interact with REST APIs
- Making web requests

## Usage Examples

### GET request
```
@jclaw Make a GET request to https://api.example.com/users
```

### POST request
```
@jclaw POST data to https://api.example.com/users with JSON body
```

## Configuration

No configuration required. Uses built-in fetch API.
