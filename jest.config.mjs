import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
  modulePaths: ['<rootDir>/node_modules'],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  transformIgnorePatterns: ['node_modules/(?!(next-intl|intl-messageformat)/)'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 35,
      lines: 40,
      statements: 40,
    },
  },
};

export default createJestConfig(customJestConfig);
