// Jest configuration with ts-jest for TS projects
// Supports TypeScript with Jest and keeps compatibility with existing TS tooling
module.exports = {
  preset: "ts-jest/presets/default",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": "ts-jest",
  },
  // Map .js imports to their TS source equivalents when running tests
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
