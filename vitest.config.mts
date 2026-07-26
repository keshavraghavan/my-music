import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias from tsconfig.json, so tests import the same way
  // the app does.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Playwright specs live in tests/e2e and are driven by `npm run test:e2e`.
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
});
