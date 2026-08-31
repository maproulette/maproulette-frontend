import { defineConfig, devices } from '@playwright/test'
import { BACKEND_URL } from './e2e/fixtures'

const FRONTEND_URL = 'http://localhost:3005'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: [
    {
      command:
        'if command -v docker >/dev/null 2>&1; then docker compose -f docker-compose.test.yaml up; else podman compose -f docker-compose.test.yaml up; fi',
      url: `${BACKEND_URL}/api/v2/service/info`,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'vite --mode test --port 3005',
      url: FRONTEND_URL,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
