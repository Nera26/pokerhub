import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 2,
  testIgnore: /mobile\.smoke\.spec\.ts/,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    proxy: undefined,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    {
      name: 'webkit-mobile',
      testMatch: /mobile\.smoke\.spec\.ts/,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'firefox-mobile',
      testMatch: /mobile\.smoke\.spec\.ts/,
      use: {
        browserName: 'firefox',
        viewport: { width: 393, height: 851 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Android 12; Mobile; rv:109.0) Gecko/109.0 Firefox/109.0',
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start -- -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      http_proxy: '',
      https_proxy: '',
      HTTP_PROXY: '',
      HTTPS_PROXY: '',
      NO_PROXY: 'localhost,127.0.0.1',
      NEXT_PUBLIC_E2E: '1',
    },
  },
});
