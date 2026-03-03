# Fix Remaining 4 Test Failures

## TL;DR

> **Quick Summary**: Fix 4 failing tests across 3 files (analyze.ts, code-edit.ts, refactor.ts) by correcting implementation logic.
>
> **Deliverables**:
>
> - Fixed `getLanguageId` in analyze.ts (Dockerfile detection)
> - Fixed `findTextPosition` in code-edit.ts (partial line matching)
> - Fixed `parseAIRefactorResponse` in refactor.ts (TextEdit array handling)
> - All 205 tests passing
>
> **Estimated Effort**: Quick (1-2 hours)
> **Parallel Execution**: YES - 3 fixes can run in parallel
> **Critical Path**: Fix all 3 → Verify tests → Commit

---

## Context

### Current State

- **Total tests**: 205 (201 passing, 4 failing)
- **Test suites**: 6 (3 passing, 3 failing)
- **Coverage**: 67.43% overall, handlers 81.1% (already meeting 80% target)

### Failing Tests

| File              | Test Name                                              | Root Cause                                        |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------- |
| analyze.test.ts   | `should detect /test/Dockerfile as dockerfile`         | getLanguageId doesn't extract basename correctly  |
| code-edit.test.ts | `should extract edits from search/replace format`      | findTextPosition requires exact line match        |
| code-edit.test.ts | `should handle find/with format`                       | findTextPosition requires exact line match        |
| refactor.test.ts  | `should handle AI fallback with TextEdit array format` | parseAIRefactorResponse only handles JSON objects |

---

## Root Cause Analysis

### 1. analyze.ts - Dockerfile Detection

**Problem**: `getLanguageId` uses `filePath.split('.').pop()` which returns `/test/dockerfile` for `/test/Dockerfile`

**Current Code** (line 327):

```typescript
const ext = filePath.split('.').pop()?.toLowerCase();
```

**Fix**: Extract basename first, then check for special files

```typescript
// Get the basename (filename without directory)
const basename = filePath.split('/').pop()?.toLowerCase() || '';
const ext = basename.split('.').pop()?.toLowerCase();

// Special handling for files without extension
if (!basename.includes('.')) {
  const specialFiles: Record<string, string> = {
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    gemfile: 'ruby',
    // ... other special files
  };
  if (specialFiles[basename]) {
    return specialFiles[basename];
  }
}
```

### 2. code-edit.ts - Search/Replace Parsing

**Problem**: `findTextPosition` requires exact line match (`contentLine.trim() !== searchLine.trim()`)

**Test Case**:

- File content: `'const oldVar = 1;'`
- Search text: `'const oldVar'` (partial line)
- Current: Fails because `'const oldVar = 1;' !== 'const oldVar'`

**Fix**: Add partial line matching using `includes()`

```typescript
// After exact match fails, try partial match for single-line searches
if (searchLines.length === 1) {
  const searchLine = searchLines[0];
  if (!searchLine) return null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    const charIndex = line.indexOf(searchLine);
    if (charIndex !== -1) {
      return {
        start: { line: i, character: charIndex },
        end: { line: i, character: charIndex + searchLine.length },
      };
    }
  }
}
```

### 3. refactor.ts - TextEdit Array Handling

**Problem**: `parseAIRefactorResponse` regex `/\{[\s\S]*\}/` only matches JSON objects, not arrays

**Test Case**:

- AI response: `[{range: {...}, newText: 'refactored'}]` (JSON array)
- Current regex: Matches first `{...}` only
- Result: Single object fails `Array.isArray()` check

**Fix**: Check for arrays first, then objects

```typescript
function parseAIRefactorResponse(response: string): TextEdit[] {
  try {
    // Try to find JSON array first (TextEdit[] format)
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const editData = JSON.parse(arrayMatch[0]);
        if (Array.isArray(editData)) {
          return editData.filter(isValidTextEdit);
        }
      } catch {
        // Continue to try object format
      }
    }

    // Try to find JSON object (WorkspaceEdit format)
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      return [];
    }

    const editData = JSON.parse(objectMatch[0]);

    // Handle WorkspaceEdit format
    if (editData.changes) {
      const allEdits: TextEdit[] = [];
      for (const uri in editData.changes) {
        const uriEdits = editData.changes[uri];
        if (Array.isArray(uriEdits)) {
          allEdits.push(...uriEdits);
        }
      }
      return allEdits;
    }

    // Handle single TextEdit wrapped in object
    if (isValidTextEdit(editData)) {
      return [editData];
    }

    return [];
  } catch {
    return [];
  }
}
```

---

## Work Objectives

### Core Objective

Fix all 4 failing tests by correcting implementation logic in analyze.ts, code-edit.ts, and refactor.ts.

### Concrete Deliverables

- Modified `packages/extensions/extension-opencode/src/handlers/analyze.ts` (getLanguageId function)
- Modified `packages/extensions/extension-opencode/src/handlers/code-edit.ts` (findTextPosition function)
- Modified `packages/extensions/extension-opencode/src/handlers/refactor.ts` (parseAIRefactorResponse function)
- All 205 tests passing: `cd packages/extensions/extension-opencode && npm test`

### Definition of Done

- [ ] All 4 failing tests pass
- [ ] No regression in 201 passing tests
- [ ] Test coverage remains ≥ 80% for handlers
- [ ] Code follows existing patterns

### Must Have

- Fix all 4 failing tests
- Maintain 80%+ coverage
- No new test failures

### Must NOT Have (Guardrails)

- ❌ Do NOT modify SimpleMemory (stable, per user constraint)
- ❌ Do NOT change existing API interfaces (per user constraint)
- ❌ Do NOT modify test expectations (fix implementation, not tests)
- ❌ Do NOT create new test files

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (Jest configured)
- **Automated tests**: YES (Tests-after - fix implementation, then verify tests pass)
- **Framework**: Jest
- **Test command**: `cd packages/extensions/extension-opencode && npm test`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 3 parallel fixes):
├── Task 1: Fix analyze.ts getLanguageId [quick]
├── Task 2: Fix code-edit.ts findTextPosition [quick]
└── Task 3: Fix refactor.ts parseAIRefactorResponse [quick]

Wave 2 (After Wave 1 — verification):
└── Task 4: Run test suite and verify all pass [quick]

Wave FINAL (After ALL tasks — independent review, 2 parallel):
├── Task F1: Coverage verification (unspecified-high)
└── Task F2: Scope fidelity check (quick)

Critical Path: Task 1, 2, 3 (parallel) → Task 4 → F1, F2
Parallel Speedup: High (3 fixes in parallel)
Max Concurrent: 3 (Wave 1), 1 (Wave 2), 2 (Final)
```

### Agent Dispatch Summary

- **Wave 1**: **3** — T1, T2, T3 → `quick` (parallel)
- **Wave 2**: **1** — T4 → `quick`
- **FINAL**: **2** — F1 → `unspecified-high`, F2 → `quick`

---

## TODOs

- [ ] 1. Fix analyze.ts getLanguageId function

  **What to do**:
  - Open `packages/extensions/extension-opencode/src/handlers/analyze.ts`
  - Navigate to `getLanguageId` function (lines 326-368)
  - Replace with implementation from code-edit.ts (lines 380-443):

    ```typescript
    function getLanguageId(filePath: string): string {
      // Get the basename (filename without directory)
      const basename = filePath.split('/').pop()?.toLowerCase() || '';
      const ext = basename.split('.').pop()?.toLowerCase();

      // Special handling for files without extension (Dockerfile, Makefile, etc.)
      if (!basename.includes('.')) {
        const specialFiles: Record<string, string> = {
          dockerfile: 'dockerfile',
          makefile: 'makefile',
          gemfile: 'ruby',
          rakefile: 'ruby',
          vagrantfile: 'ruby',
          podfile: 'ruby',
          berksfile: 'ruby',
          capfile: 'ruby',
          guardfile: 'ruby',
          jenkinsfile: 'groovy',
        };
        if (specialFiles[basename]) {
          return specialFiles[basename];
        }
      }

      const languageMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescriptreact',
        // ... (keep existing mappings)
      };

      return languageMap[ext || ''] || 'plaintext';
    }
    ```

  **Must NOT do**:
  - Do NOT modify test files
  - Do NOT change function signature
  - Do NOT remove existing language mappings

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `packages/extensions/extension-opencode/src/handlers/code-edit.ts:380-443` - Working implementation to copy

  **Acceptance Criteria**:
  - [ ] Function extracts basename correctly
  - [ ] Special files (Dockerfile, Makefile) handled
  - [ ] All existing language mappings preserved
  - [ ] Test `should detect /test/Dockerfile as dockerfile` passes

  **Commit**: NO (groups with other fixes)

- [ ] 2. Fix code-edit.ts findTextPosition function

  **What to do**:
  - Open `packages/extensions/extension-opencode/src/handlers/code-edit.ts`
  - Navigate to `findTextPosition` function (lines 274-322)
  - Add partial line matching AFTER the exact match loop:

    ```typescript
    // After the existing for loop (lines 284-319), add:

    // Try partial match for single-line searches
    if (searchLines.length === 1) {
      const searchLine = searchLines[0];
      if (!searchLine) return null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;

        const charIndex = line.indexOf(searchLine);
        if (charIndex !== -1) {
          return {
            start: { line: i, character: charIndex },
            end: { line: i, character: charIndex + searchLine.length },
          };
        }
      }
    }
    ```

  **Must NOT do**:
  - Do NOT remove exact match logic (it's still needed for multi-line searches)
  - Do NOT modify test files
  - Do NOT change function signature

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 4
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] Partial line matching works (substring search)
  - [ ] Exact line matching still works (multi-line)
  - [ ] Tests `should extract edits from search/replace format` and `should handle find/with format` pass

  **Commit**: NO (groups with other fixes)

- [ ] 3. Fix refactor.ts parseAIRefactorResponse function

  **What to do**:
  - Open `packages/extensions/extension-opencode/src/handlers/refactor.ts`
  - Navigate to `parseAIRefactorResponse` function (lines 491-522)
  - Replace with:

    ```typescript
    function parseAIRefactorResponse(response: string): TextEdit[] {
      try {
        // Try to find JSON array first (TextEdit[] format)
        const arrayMatch = response.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            const editData = JSON.parse(arrayMatch[0]);
            if (Array.isArray(editData)) {
              return editData.filter(isValidTextEdit);
            }
          } catch {
            // Continue to try object format
          }
        }

        // Try to find JSON object (WorkspaceEdit format)
        const objectMatch = response.match(/\{[\s\S]*\}/);
        if (!objectMatch) {
          return [];
        }

        const editData = JSON.parse(objectMatch[0]);

        // Handle WorkspaceEdit format
        if (editData.changes) {
          const allEdits: TextEdit[] = [];
          for (const uri in editData.changes) {
            const uriEdits = editData.changes[uri];
            if (Array.isArray(uriEdits)) {
              allEdits.push(...uriEdits);
            }
          }
          return allEdits;
        }

        // Handle single TextEdit wrapped in object
        if (isValidTextEdit(editData)) {
          return [editData];
        }

        return [];
      } catch {
        return [];
      }
    }
    ```

  **Must NOT do**:
  - Do NOT modify test files
  - Do NOT change function signature
  - Do NOT remove WorkspaceEdit handling

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 4
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] TextEdit arrays handled (`[{...}]`)
  - [ ] WorkspaceEdit objects still handled (`{changes: {...}}`)
  - [ ] Test `should handle AI fallback with TextEdit array format` passes

  **Commit**: NO (groups with other fixes)

- [ ] 4. Run test suite and verify all tests pass

  **What to do**:
  - Run full test suite: `cd packages/extensions/extension-opencode && npm test`
  - Verify output shows:
    - Test Suites: 0 failed, 6 passed
    - Tests: 0 failed, 205 passed
  - Check for any new failures
  - If any tests fail, investigate and fix

  **Must NOT do**:
  - Do NOT skip running the full test suite
  - Do NOT proceed if any tests fail
  - Do NOT modify test expectations

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: F1, F2
  - **Blocked By**: Task 1, 2, 3

  **Acceptance Criteria**:
  - [ ] Test suite executed successfully
  - [ ] 0 test failures
  - [ ] 205 tests passed
  - [ ] No regression

  **Commit**: YES
  - Message: `fix(handlers): fix remaining test failures`
  - Files: All modified handler files
  - Pre-commit: Run test suite

---

## Final Verification Wave

- [ ] F1. **Coverage Verification** — `unspecified-high`
      Run coverage report and verify ≥80% coverage maintained.
      Output: `Overall Coverage [XX%] | handlers Coverage [XX%] | Target Met [YES/NO] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Scope Fidelity Check** — `quick`
      Verify only intended changes made:
  - Only 3 handler files modified
  - No SimpleMemory changes
  - No API interface changes
  - No test file modifications
    Output: `Files Modified [3/3] | Scope Compliance [PASS] | Constraints Met [YES/YES/YES] | VERDICT: APPROVE/REJECT`

---

## Commit Strategy

- **1**: `fix(handlers): fix remaining test failures` — analyze.ts, code-edit.ts, refactor.ts
  - Groups: Task 1 + Task 2 + Task 3 + Task 4
  - Pre-commit: Run test suite (Task 4)

---

## Success Criteria

### Verification Commands

```bash
# Run test suite
cd packages/extensions/extension-opencode && npm test

# Expected output:
# Test Suites: 0 failed, 6 passed
# Tests:       0 failed, 205 passed

# Run coverage report
npm test -- --coverage

# Expected: Coverage ≥ 80%
```

### Final Checklist

- [ ] All 4 failing tests pass
- [ ] No regression in 201 passing tests
- [ ] Test coverage ≥ 80%
- [ ] SimpleMemory not modified
- [ ] API interfaces unchanged
- [ ] Only 3 handler files modified
