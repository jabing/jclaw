Actions log for 2026-02-26:

- Modified packages/core/package.json to add "type": "module" to enable ESM module mode.
- Created packages/core/tsconfig.json that extends root tsconfig.json (extends ../../tsconfig.json) and sets compilerOptions: { "module": "NodeNext", "moduleResolution": "NodeNext" }.
- Verification: Ran Node.js dynamic import test; output: ESM OK.
