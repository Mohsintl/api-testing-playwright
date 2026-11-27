import { defineConfig } from '@playwright/test';

// API tests only: Playwright's `request` fixture needs no browser.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Both targets are shared public demo APIs, so a network blip can fail one call.
  // One retry on CI; locally a failure shows straight away.
  retries: process.env.CI ? 1 : 0,
  // Keep the load on the public APIs low.
  workers: 2,
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'restful-booker',
      testDir: './tests/restful-booker',
      use: { baseURL: 'https://restful-booker.herokuapp.com' },
    },
    {
      name: 'dummyjson',
      testDir: './tests/dummyjson',
      use: { baseURL: 'https://dummyjson.com' },
    },
    {
      // No network: proves the contract schemas reject broken responses.
      name: 'contracts',
      testDir: './tests/contracts',
    },
  ],
});
