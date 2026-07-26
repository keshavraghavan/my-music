import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// Some sandboxed dev environments ship a preinstalled Chromium whose build does
// not match this Playwright version. Point this at that binary to reuse it
// instead of downloading:
//
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium npm run test:e2e
//
// Unset — the normal case, including CI — Playwright uses the browser it
// manages itself via `npx playwright install chromium`.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Left unset off CI so Playwright picks a worker count from the machine.
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],

  // E2E runs against the real production server. With no DATABASE_URL it uses
  // the bundled seed snapshot, just like a fresh clone.
  webServer: {
    command: `npm run preview -- -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
