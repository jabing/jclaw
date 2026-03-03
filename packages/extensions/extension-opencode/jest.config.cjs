/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^(\.\./src/.+)\.js$': '$1',
    '^(\./[^/]+)\.js$': '$1',
    '^(\./handlers/[^/]+)\.js$': '$1',
    '^@jclaw/core$': '<rootDir>/../../core/src/index.ts',
    '^(\\./[^/]+)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
        },
      },
    ],
  },
};
