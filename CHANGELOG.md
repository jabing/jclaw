# Changelog

All notable changes to the JClaw project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-03

### Added

#### Core Framework (@jclaw/core)

- **JClawAgent** - Main agent class with task execution capabilities
- **SimpleMemory** - Hierarchical L0/L1/L2 memory system with synonym support
- **AutoSkill** - Self-evolution engine with code generation
- **SkillDiscovery** - Integration with skill.sh community (250k+ skills)
- **Execution Modes** - OODA and OOPS loop executors
- **CLI** - Command-line interface for agent execution
- **A2A Protocol** - Agent-to-agent communication support

#### OpenCode Extension (@jclaw/extension-opencode)

- **LSP Integration** - Full Language Server Protocol support
- **Code Editing** - Search/replace with partial line matching
- **Refactoring** - Extract/inline/rename operations
- **Analysis** - Code structure and pattern analysis
- **Git Operations** - Seamless git integration

#### NanoClaw Extension (@jclaw/extension-nanoclaw)

- **WhatsApp Integration** - Message flow handlers
- **Router** - Message routing system
- **Trigger** - Event-driven execution
- **Formatter** - Message formatting utilities

### Changed

- Improved error handling across all handlers
- Optimized memory usage in SimpleMemory layers
- Enhanced test coverage to 86.8%

### Fixed

- `sendLSPRequest` now uses public `lspBridge.request()` API
- Dockerfile language detection in analyze handler
- Partial line matching in search/replace operations
- TextEdit array handling in AI response parser

### Technical Details

- **Test Coverage**: 86.8% (target: 80%)
- **TypeScript**: Strict mode enabled
- **Node.js**: Requires >= 18.0.0
- **License**: MIT

### Documentation

- API Reference (`docs/API.md`)
- Architecture Guide (`docs/ARCHITECTURE.md`)
- Usage Guide (`docs/USAGE.md`)
- Code Examples (`docs/EXAMPLES.md`)
- Deployment Guide (`docs/DEPLOYMENT.md`)
- Performance Report (`docs/PERFORMANCE.md`)

### CI/CD

- GitHub Actions CI workflow for automated testing
- GitHub Actions Release workflow for npm publishing
- Coverage reporting via Codecov

---

## Phase History

### Phase 1: Core Framework ✅

- JClawAgent implementation
- SimpleMemory system
- AutoSkill evolution
- SkillDiscovery integration
- Base runtime and executors

### Phase 2: OpenCode Extension ✅

- LSP bridge implementation
- Code handlers (edit, analyze, refactor)
- Git integration
- Extension registry

### Phase 3: NanoClaw Extension ✅

- WhatsApp adapter
- Message routing
- Event triggers
- Message formatting

### Phase 4: Testing & Documentation ✅

- 86.8% test coverage achieved
- Comprehensive API documentation
- Architecture documentation
- Usage guides and examples

### Phase 5: Performance & Release ✅

- Memory profiling
- CI/CD pipeline
- npm publication preparation
