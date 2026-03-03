# Fix Refactor Tests - Achieve 80% Coverage

## TL;DR

> **Quick Summary**: Fix 18 failing tests in refactor.test.ts by correcting implementation to use public LSP API instead of private method access.
>
> **Deliverables**:
>
> - Fixed `sendLSPRequest` function in refactor.ts (lines 534-550)
> - All 18 tests passing in refactor.test.ts
> - 80%+ test coverage achieved
>
> **Estimated Effort**: Quick (1-2 hours)
> **Parallel Execution**: NO - sequential single task
> **Critical Path**: Fix → Test → Verify Coverage

---

## Context

### Original Request

Fix 18 failing tests in `packages/extensions/extension-opencode/tests/handlers/refactor.test.ts` to achieve 80% test coverage as part of Phase 4 Testing & Documentation.

### Interview Summary

**Key Discussions**:

- Root Cause: Implementation uses `sendRequest` (private method via `as any`), but tests mock `request` (public API)
- Error Message: "LSP bridge does not support sendRequest" confirms private method is undefined in mock
- Fix Strategy: Change implementation to use public `lspBridge.request()` instead of accessing private `sendRequest`

**Research Findings**:

- Metis Consultation: Confirmed root cause through explore agents analyzing both test and implementation code
- LSPBridge Design: Public `request()` method (line 663-665) was specifically designed to delegate to `sendRequest()`
- Code Smell: Current implementation uses `as any` type assertion to access private method

### Metis Review

**Identified Gaps** (addressed):

- **Root Cause**: Implementation accesses private `sendRequest` via reflection, tests mock public `request` method
- **Blocking Condition**: Line 543 check `typeof bridge.sendRequest === 'function'` fails because mock doesn't have `sendRequest`
- **Solution**: Use public API `lspBridge.request()` instead of `bridge.sendRequest`

---

## Work Objectives

### Core Objective

Fix the `sendLSPRequest` function in refactor.ts to use the public LSP API, resolving the mock mismatch and making all 18 failing tests pass.

### Concrete Deliverables

- Modified `packages/extensions/extension-opencode/src/handlers/refactor.ts` (lines 534-550)
- All tests passing: `cd packages/extensions/extension-opencode && npm test`
- 80%+ test coverage: `npm test -- --coverage`

### Definition of Done

- [ ] All 18 tests in refactor.test.ts pass
- [ ] No regression in other tests (187 currently passing)
- [ ] Test coverage ≥ 80%
- [ ] Code smell removed (no more `as any` accessing private methods)

### Must Have

- Fix `sendLSPRequest` to use `lspBridge.request()` public API
- All 18 failing tests must pass
- Test coverage must reach 80%

### Must NOT Have (Guardrails)

- ❌ Do NOT modify SimpleMemory (stable, per user constraint)
- ❌ Do NOT change existing API interfaces (per user constraint)
- ❌ Do NOT add `sendRequest` to test mocks (tests private implementation, makes tests brittle)
- ❌ Do NOT create new test files (only fix existing tests)
- ❌ Do NOT modify any other handler files besides refactor.ts

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (Jest configured)
- **Automated tests**: YES (Tests-after - fix implementation, then verify tests pass)
- **Framework**: Jest
- **Test command**: `cd packages/extensions/extension-opencode && npm test`

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend/Tests**: Use Bash — Run test commands, check exit codes, verify output

---

## Execution Strategy

### Parallel Execution Waves

> Single task - sequential execution.

```
Wave 1 (Start Immediately — fix implementation):
└── Task 1: Fix sendLSPRequest function [quick]

Wave 2 (After Wave 1 — verification):
└── Task 2: Run test suite and verify all pass [quick]

Wave FINAL (After ALL tasks — independent review, 2 parallel):
├── Task F1: Coverage verification (unspecified-high)
└── Task F2: Scope fidelity check (quick)

Critical Path: Task 1 → Task 2 → F1, F2
Parallel Speedup: None (sequential by design)
Max Concurrent: 1 (Wave 1), 1 (Wave 2), 2 (Final)
```

### Dependency Matrix

- **1**: — — 2
- **2**: 1 — F1, F2

### Agent Dispatch Summary

- **1**: **1** — T1 → `quick`
- **2**: **1** — T2 → `quick`
- **FINAL**: **2** — F1 → `unspecified-high`, F2 → `quick`

---

## TODOs

- [x] 1. Fix sendLSPRequest to use public API ✅ DONE

  **What to do**:
  - Open `packages/extensions/extension-opencode/src/handlers/refactor.ts`
  - Navigate to `sendLSPRequest` function (lines 534-550)
  - Replace the entire function body with:
    ```typescript
    async function sendLSPRequest<T>(
      lspBridge: LSPBridge,
      method: string,
      params: unknown
    ): Promise<T> {
      return await lspBridge.request<T>(method, params);
    }
    ```
  - This removes:
    - The `as any` type assertion (code smell)
    - The private method access via `bridge.sendRequest`
    - The error throw for unsupported sendRequest
  - Uses the public API `request()` which is already mocked in tests

  **Must NOT do**:
  - Do NOT modify any other functions in refactor.ts
  - Do NOT modify test files
  - Do NOT change the function signature or parameter types
  - Do NOT add additional error handling (the public API handles it)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple function replacement, no complex logic, clear before/after state
  - **Skills**: []
    - No special skills needed for code modification

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (single task)
  - **Blocks**: Task 2 (test verification)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `packages/extensions/extension-opencode/src/bridge.ts:663-665` - Public `request()` method signature and implementation
  - `packages/extensions/extension-opencode/tests/handlers/refactor.test.ts:18-33` - Mock setup showing `request: jest.fn()`

  **API/Type References** (contracts to implement against):
  - `packages/extensions/extension-opencode/src/bridge.ts:LSPBridge` - Interface showing public `request<T>()` method

  **Test References** (testing patterns to follow):
  - `packages/extensions/extension-opencode/tests/handlers/refactor.test.ts:826-841` - Test expecting `mockLSPBridge.request` to be called
  - `packages/extensions/extension-opencode/tests/handlers/refactor.test.ts:869-884` - Another test expecting `request` call

  **WHY Each Reference Matters**:
  - `bridge.ts:663-665`: Shows the public API method exists and delegates to `sendRequest()` - this is what we should use
  - `refactor.test.ts:18-33`: Shows tests mock `request` method, not `sendRequest` - confirms our fix approach
  - `refactor.test.ts:826-841, 869-884`: Shows exactly what tests expect - `mockLSPBridge.request` to be called

  **Acceptance Criteria**:
  - [ ] Function `sendLSPRequest` modified at lines 534-550
  - [ ] Function now uses `lspBridge.request<T>(method, params)` instead of `bridge.sendRequest`
  - [ ] No `as any` type assertion present
  - [ ] No private method access present
  - [ ] Function signature unchanged

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Verify function uses public API
    Tool: Bash
    Preconditions: File refactor.ts exists
    Steps:
      1. grep -n "lspBridge.request<T>(method, params)" packages/extensions/extension-opencode/src/handlers/refactor.ts
      2. Verify output shows the function at line ~537
    Expected Result: Grep output shows the new implementation at the correct line
    Failure Indicators: Grep returns empty or shows old implementation
    Evidence: .sisyphus/evidence/task-1-public-api.txt

  Scenario: Verify no private method access
    Tool: Bash
    Preconditions: File refactor.ts modified
    Steps:
      1. grep -n "bridge.sendRequest" packages/extensions/extension-opencode/src/handlers/refactor.ts
    Expected Result: Grep returns no output (no matches)
    Failure Indicators: Grep finds any matches
    Evidence: .sisyphus/evidence/task-1-no-private-access.txt
  ```

  **Evidence to Capture**:
  - [ ] Grep output showing new public API usage
  - [ ] Grep output showing no private method access

  **Commit**: YES
  - Message: `fix(refactor): use public LSP API instead of private sendRequest`
  - Files: `packages/extensions/extension-opencode/src/handlers/refactor.ts`
  - Pre-commit: None (will verify with tests in Task 2)

- [ ] 2. Run test suite and verify all tests pass

  **What to do**:
  - Navigate to extension-opencode directory
  - Run full test suite: `npm test`
  - Verify output shows:
    - Test Suites: 1 failed, X passed (was 1 failed, now 0 failed)
    - Tests: 18 failed, 187 passed (was 18 failed, now 205 passed)
    - All tests in refactor.test.ts passing
  - Check for any new failures introduced by the change
  - If any tests fail, investigate and fix before proceeding

  **Must NOT do**:
  - Do NOT skip running the full test suite
  - Do NOT proceed if any tests fail
  - Do NOT modify test expectations
  - Do NOT mark task complete until ALL tests pass

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Running tests and verifying output is straightforward
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (single task)
  - **Blocks**: F1, F2 (final verification)
  - **Blocked By**: Task 1 (fix must be in place)

  **References** (CRITICAL):

  **Test References** (expected results):
  - Previous test run: 18 failed, 187 passed, 3 suites failed
  - Expected after fix: 0 failed, 205 passed, 0 suites failed
  - Test file: `packages/extensions/extension-opencode/tests/handlers/refactor.test.ts`

  **WHY Each Reference Matters**:
  - Previous test run data: Provides baseline to verify fix worked
  - Test file path: Identifies which tests should now pass

  **Acceptance Criteria**:
  - [ ] Test suite executed successfully
  - [ ] Output shows 0 test failures
  - [ ] Output shows 205 tests passed (187 + 18)
  - [ ] Output shows 0 test suites failed
  - [ ] No regression in previously passing tests

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Verify all tests pass
    Tool: Bash
    Preconditions: Task 1 completed, code modified
    Steps:
      1. cd packages/extensions/extension-opencode && npm test 2>&1 | tee /tmp/test-output.txt
      2. Check exit code: echo $?
      3. grep "Test Suites:" /tmp/test-output.txt
      4. grep "Tests:" /tmp/test-output.txt
    Expected Result: Exit code 0, "Test Suites: 1 failed" changed to "0 failed", "Tests: 18 failed" changed to "0 failed"
    Failure Indicators: Exit code non-zero, or any test failures reported
    Evidence: .sisyphus/evidence/task-2-test-results.txt

  Scenario: Verify refactor.test.ts specifically passes
    Tool: Bash
    Preconditions: Full test suite passed
    Steps:
      1. cd packages/extensions/extension-opencode && npm test -- refactor.test.ts 2>&1
      2. Check for "PASS tests/handlers/refactor.test.ts"
    Expected Result: Output shows "PASS" for refactor.test.ts
    Failure Indicators: Output shows "FAIL" for refactor.test.ts
    Evidence: .sisyphus/evidence/task-2-refactor-test-pass.txt
  ```

  **Evidence to Capture**:
  - [ ] Full test suite output
  - [ ] Test summary showing 0 failures
  - [ ] Specific refactor.test.ts pass confirmation

  **Commit**: NO (groups with Task 1)

---

## Final Verification Wave (MANDATORY)

- [ ] F1. **Coverage Verification** — `unspecified-high`
      Run coverage report and verify ≥80% coverage achieved. Check coverage for:
  - Overall project coverage percentage
  - Specific coverage for handlers/refactor.ts
  - Generate coverage report: `npm test -- --coverage`
  - Review coverage report at `docs/coverage/coverage-summary.json`
    Output: `Overall Coverage [XX%] | refactor.ts Coverage [XX%] | Target Met [YES/NO] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Scope Fidelity Check** — `quick`
      Verify only the intended changes were made:
  - Check git diff: only refactor.ts modified, only sendLSPRequest function changed
  - Verify no changes to SimpleMemory
  - Verify no API interface changes
  - Verify no test file modifications
  - Verify no other handler files modified
    Output: `Files Modified [1/1] | Scope Compliance [PASS] | Constraints Met [YES/YES/YES] | VERDICT: APPROVE/REJECT`

---

## Commit Strategy

- **1**: `fix(refactor): use public LSP API instead of private sendRequest` — refactor.ts
  - Groups: Task 1 + Task 2 (implementation + verification)
  - Pre-commit: Run test suite (Task 2)

---

## Success Criteria

### Verification Commands

```bash
# Run test suite
cd packages/extensions/extension-opencode && npm test

# Expected output:
# Test Suites: 0 failed, X passed
# Tests:       0 failed, 205 passed

# Run coverage report
npm test -- --coverage

# Expected: Coverage ≥ 80%
```

### Final Checklist

- [ ] All 18 tests in refactor.test.ts pass
- [ ] No regression in other tests (187 remain passing)
- [ ] Test coverage ≥ 80%
- [ ] Code smell removed (`as any` and private method access gone)
- [ ] SimpleMemory not modified (constraint met)
- [ ] API interfaces unchanged (constraint met)
- [ ] Only refactor.ts modified (scope controlled)
