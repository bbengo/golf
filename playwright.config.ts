import { defineConfig } from '@playwright/test';

export default defineConfig({
   testDir: './tests/browser',
   timeout: 60_000,
   workers: 1,
   use: {
      baseURL: 'http://127.0.0.1:5181',
      browserName: 'chromium',
      viewport: { width: 1440, height: 1000 },
      trace: 'retain-on-failure',
   },
   webServer: {
      command: 'node --import tsx server/local.ts',
      env: { PORT: '5181' },
      url: 'http://127.0.0.1:5181',
      reuseExistingServer: false,
   },
});
