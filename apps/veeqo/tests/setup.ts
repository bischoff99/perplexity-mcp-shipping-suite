// Test setup file for Veeqo MCP Server
// This file is used by Jest for test configuration

// Global test setup
beforeAll(() => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterAll(() => {
  // Clean up after tests
});
