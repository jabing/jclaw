## Learnings from ESLint parserOptions fix

- Removed parserOptions.project to enable monorepo tsconfig resolution by using tsconfigRootDir and module syntax.
- This approach aligns with Phase 1 linting needs without introducing glob patterns for multiple tsconfig files.
- Key risk: If more strict multi-project linting is required later, may need to switch to a glob-based project array.
