import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright Config for K-View "Frozen Views" Audit
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Results and Screenshots go here
  outputDir: '../tmp/playwright-results',
  
  // HTML Report configuration
  reporter: [
    ['html', { 
      outputFolder: '../tmp/playwright-report/' + new Date().toISOString().split('T')[0],
      open: 'never' 
    }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
