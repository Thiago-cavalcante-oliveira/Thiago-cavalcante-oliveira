// Playwright configuration for easier debugging
export default {
  timeout: 120_000,
  use: {
    headless: process.env.HEADLESS === 'true',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
};