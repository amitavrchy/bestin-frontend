import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: { baseURL: 'http://localhost:5173', viewport: { width: 1200, height: 800 }, screenshot: 'only-on-failure' },
});
