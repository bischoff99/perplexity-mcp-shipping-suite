/** @type {import('jest').Config} */
export default {
  // Test environment
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',

  // TypeScript configuration
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022'
      }
    }
  },

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/src/**/__tests__/**/*.ts',
    '<rootDir>/src/**/*.test.ts'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/index.ts' // Entry point often doesn't need coverage
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test execution
  verbose: true,
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: false,
  maxWorkers: '50%',

  // Test timeout
  testTimeout: 30000,

  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],

  // Error handling
  bail: 0,
  errorOnDeprecated: true,

  // Global variables for tests
  globals: {
    'ts-jest': {
      useESM: true
    },
    TEST_TIMEOUT: 30000,
    VEEQO_TEST_API_KEY: 'test_api_key'
  },

  // Test sequences
  testSequencer: '@jest/test-sequencer',

  // Cache
  cacheDirectory: '<rootDir>/.jest-cache',

  // Clear mocks
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  // Mock configuration
  unmockedModulePathPatterns: [
    '<rootDir>/node_modules/'
  ]
};