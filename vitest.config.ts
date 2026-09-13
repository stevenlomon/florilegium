import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node', // Optimal for pure unit tests & API mappers
    globals: true, // injects `describe`, `it`, `test`, `expect`, `vi`, and hooks globally into the test environment
  },
});