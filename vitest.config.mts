import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // Native path resolution without third-party plugins
  },
  test: {
    environment: 'node', // Optimal for pure unit tests & API mappers
    globals: true, // injects `describe`, `it`, `test`, `expect`, `vi`, and hooks globally into the test environment
  },
});