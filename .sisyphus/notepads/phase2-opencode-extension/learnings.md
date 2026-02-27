# OpenCode Research - Learnings

## Project Overview

- **Name**: OpenCode
- **Website**: https://opencode.ai
- **GitHub**: https://github.com/anomalyco/opencode (100K+ stars)
- **Status**: Active development
- **Note**: Original repo (opencode-ai/opencode) was archived and moved to "Crush" by Charm team

## CLI Usage

### Interactive Mode (TUI)
```bash
opencode                    # Start TUI in current directory
opencode /path/to/project   # Start TUI in specific directory
```

### Non-Interactive Mode (run command)
```bash
opencode run "Explain the use of context in Go"
```

Flags:
- `--continue` / `-c`: Continue last session
- `--session` / `-s`: Continue specific session by ID
- `--fork`: Fork session when continuing
- `--model` / `-m`: Specify model (provider/model)
- `--agent`: Specify agent to use
- `--share`: Share the session
- `--file` / `-f`: Attach files to message
- `--format`: Output format (default/json)
- `--attach`: Attach to running opencode server

### Server Mode (HTTP API)
```bash
opencode serve --port 4096 --hostname 127.0.0.1
```

Options:
- `--port`: Port (default 4096)
- `--hostname`: Hostname (default 127.0.0.1)
- `--mdns`: Enable mDNS discovery
- `--cors`: Additional CORS origins

Authentication:
```bash
OPENCODE_SERVER_PASSWORD=your-password opencode serve
```

### ACP Server Mode (stdin/stdout)
```bash
opencode acp
```
Uses nd-JSON over stdin/stdout for Agent Client Protocol.

## Key Commands Summary

| Command | Description |
|---------|-------------|
| `opencode` | Start TUI |
| `opencode run` | Non-interactive mode |
| `opencode serve` | HTTP API server |
| `opencode web` | Web interface server |
| `opencode acp` | ACP server (stdin/stdout) |
| `opencode auth login` | Configure API keys |
| `opencode models` | List available models |
| `opencode session list` | List sessions |
| `opencode stats` | Show token usage |

## API Endpoints (Server Mode)

Full REST API available at `http://localhost:4096/doc` (OpenAPI spec).

Key endpoints:
- `GET /global/health` - Health check
- `POST /session` - Create session
- `POST /session/:id/message` - Send message
- `GET /session/:id/message` - Get messages
- `GET /file/content?path=<filepath>` - Read file
- `GET /find?pattern=<pat>` - Search files
- `GET /project` - List projects

## Environment Variables

- `OPENCODE_SERVER_PASSWORD`: Basic auth password
- `OPENCODE_SERVER_USERNAME`: Basic auth username (default: opencode)
- `OPENCODE_CONFIG`: Path to config file
- `OPENCODE_CONFIG_DIR`: Path to config directory

## Integration Notes for JClaw

For JClaw extension integration, the recommended approach:
1. Use `opencode run` for simple non-interactive prompts
2. Use `opencode serve` + REST API for more control
3. Use `opencode acp` for programmatic control via stdin/stdout
4. Can attach to existing server with `--attach` flag to avoid MCP cold boot

## References

- CLI Docs: https://opencode.ai/docs/cli/
- Server Docs: https://opencode.ai/docs/server/
- GitHub: https://github.com/anomalyco/opencode
