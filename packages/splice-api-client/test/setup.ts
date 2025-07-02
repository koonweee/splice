// Jest setup file for global test configuration

// Mock fetch globally - use any to avoid Bun type conflicts
(global as any).fetch = jest.fn();

// Reset mocks after each test
afterEach(() => {
  jest.resetAllMocks();
});
