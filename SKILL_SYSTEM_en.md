# JClaw Skill System

## Overview

JClaw has a dual skill acquisition mechanism:
1. **skill.sh Community Skills** - Reuse 250k+ existing skills
2. **AutoSkill Self-Generation** - Generate new skills on demand

## Architecture

```
User Request
    ↓
JClawAgent.execute()
    ↓
Execution Failed
    ↓
[Step 1] Skill Discovery
    ├─ Search skill.sh API
    ├─ Search local registry
    ├─ Quality evaluation and ranking
    └─ Recommend best match
    ↓
Confidence > 60%?
    ├─ Yes → Install skill.sh skill → Retry
    └─ No → [Step 2] AutoSkill
                ├─ Discover capability gap
                ├─ Match template (if available)
                ├─ LLM generates code
                ├─ Compile and install
                └─ Retry task
```

## skill.sh Integration

### Configuration

```typescript
const agent = new JClawAgent({
  skillShConfig: {
    apiBase: 'https://api.skills.sh/v1',
    enableCache: true,
    cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
    timeout: 30000,
  }
});
```

### API

```typescript
// Search skills
const results = await skillShAdapter.search({
  query: 'github integration',
  limit: 10,
  sortBy: 'quality',
});

// Get skill details
const detail = await skillShAdapter.getSkill('owner/repo');

// Install skill
const result = await skillShAdapter.installSkill('owner/repo');
```

### Caching System

```typescript
// Cache statistics
const stats = getCacheStats();
console.log(stats); // { size: 50, keys: [...] }

// Clear cache
clearSkillShCache();
```

## AutoSkill System

### Code Templates

Pre-built templates:
- `http_client` - HTTP request capability
- `file_operations` - File operation capability

```typescript
// Use template
const template = CODE_TEMPLATES['http_client'];

// Add custom template
import { addCodeTemplate } from '@jclaw/core/auto-skill';

addCodeTemplate('my_capability', `
  // Template code...
`);

// View available templates
const templates = getAvailableTemplates();
```

### Code Generation Flow

```typescript
// 1. Discover capability gap
const gaps = await autoSkillGenerator.discoverCapabilities(task);

// 2. Generate extension code (template priority)
const result = await autoSkillGenerator.generateExtension(gap);

// 3. Optimize code (EvolutionEngine)
if (config.enableEvolution) {
  code = await autoSkillGenerator.optimizeCode(code, gap);
}

// 4. Validate code
const validation = await autoSkillGenerator.validateCode(code);

// 5. Save extension
const path = await autoSkillGenerator.saveExtension(extension);
```

### Quality Evaluation

6-dimension evaluation system:
1. **Code Quality** - Type safety, error handling
2. **Documentation** - Comments, examples
3. **Test Coverage** - Unit tests
4. **Community Health** - stars, downloads
5. **Security** - No vulnerabilities
6. **Overall Score** - 0-100

## Examples

### Example 1: Automatic Skill Discovery

```typescript
const agent = new JClawAgent({
  enableAutoSkill: true,
  skillShConfig: { enableCache: true }
});

await agent.start();

// Execute task - AutoSkill will automatically discover required skills
await agent.execute({
  id: 'task-1',
  prompt: 'Create a GitHub issue with title and description'
});

// Automatic flow:
// 1. Try execution → Failed (no GitHub capability)
// 2. Search skill.sh → Found github-integration
// 3. Evaluate quality → 85/100
// 4. Install skill → Register to system
// 5. Retry task → Success ✅
```

### Example 2: Custom Skill Generation

```typescript
// When skill.sh doesn't find suitable skills
await agent.execute({
  id: 'task-1',
  prompt: 'Connect to our internal API with custom authentication'
});

// AutoSkill will automatically:
// 1. Search skill.sh → No high-confidence match found
// 2. Analyze requirements → Discover need for custom_auth capability
// 3. Check templates → No match
// 4. LLM generates code → Complete TypeScript extension
// 5. Compile and install → Ready to use
```

### Example 3: Template Priority

```typescript
// Generate using pre-defined template
await agent.execute({
  id: 'task-1',
  prompt: 'Make HTTP requests to external API'
});

// AutoSkill will:
// 1. Discover need for http_client capability
// 2. Match template → http_client template
// 3. Use template → High-quality code
// 4. Optimize code → EvolutionEngine
// 5. Install and use ✅
```

## Best Practices

### 1. Search Community First

```typescript
// Prefer skill.sh community skills
const discovery = await skillDiscovery.discover(query);

if (discovery.confidence > 0.6) {
  // Use community skill
  await skillDiscovery.installSkill(discovery.recommended);
} else {
  // Fallback to AutoSkill
  await agent.executeWithAutoSkill(task);
}
```

### 2. Template Priority

```typescript
// Use templates for common capabilities
const template = findTemplateForCapability(capability);
if (template) {
  // Use pre-defined template (higher quality)
  code = CODE_TEMPLATES[template];
} else {
  // LLM generation
  code = await generateCode(gap);
}
```

### 3. Code Optimization

```typescript
// Enable EvolutionEngine optimization
if (config.enableEvolution) {
  code = await optimizeCode(code, gap);
}

// Optimization focus:
// - Error handling
// - Type safety
// - Performance
// - Readability
```

## Troubleshooting

### Problem 1: skill.sh API Call Failed

```typescript
// Check network
try {
  await skillShAdapter.search({ query: 'test' });
} catch (error) {
  console.error('API call failed:', error);
  // Fallback to AutoSkill
  await agent.executeWithAutoSkill(task);
}
```

### Problem 2: Poor Code Generation Quality

```typescript
// 1. Add more templates
addCodeTemplate('my_cap', highQualityTemplate);

// 2. Enable EvolutionEngine
const agent = new JClawAgent({
  enableAutoSkill: true,
  autoSkillConfig: { enableEvolution: true }
});

// 3. Manual optimization
const result = await autoSkillGenerator.generateExtension(gap);
if (result.quality < 0.7) {
  // Regenerate
  return autoSkillGenerator.generateExtension(gap, attempt + 1);
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Configure caching
const agent = new JClawAgent({
  skillShConfig: {
    enableCache: true,
    cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
  }
});

// Regularly clean expired cache
setInterval(() => {
  clearSkillShCache();
}, 24 * 60 * 60 * 1000);
```

### Parallel Search

```typescript
// Parallel search from multiple sources
const [skillShResults, communityResults, localResults] = await Promise.all([
  searchSkillSh(query),
  searchCommunity(query),
  searchLocal(query),
]);
```

## Summary

JClaw's skill system provides:
- ✅ **Progressive Acquisition** - Community first, then generate
- ✅ **Quality Assurance** - 6-dimension evaluation
- ✅ **High Performance** - Smart caching
- ✅ **Flexible Extension** - Custom templates

**Core Philosophy:** Reuse > Generate
