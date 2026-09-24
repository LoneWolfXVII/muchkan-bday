import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/results',
  timeout: 90_000,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false, // a stale preview would test an old build
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4173' },
})
