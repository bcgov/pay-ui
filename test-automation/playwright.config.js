/**
 * ============================================================================
 * Playwright Test Configuration
 * ============================================================================
 *
 * File: playwright.config.js
 * Purpose: Central configuration for Playwright test execution
 * author: Anish Batra
 * Created: February 16, 2026
 *
 * Description:
 *   Defines all Playwright test settings including:
 *   - Global setup/teardown (authentication)
 *   - Browser projects and configurations
 *   - Test directory and naming patterns
 *   - Reporting formats (Allure, HTML, JSON, JUnit)
 *   - Retry and timeout policies
 *   - Storage state for session management
 *   - Traces for debugging
 * ============================================================================
 */

// @ts-check
import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  globalSetup: path.join(__dirname, 'globalSetup.js'),
  testDir: './tests',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(
          __dirname,
          (process.env.LOGIN_TYPE || 'idir').toLowerCase() === 'bcsc' ? '.auth-bcsc.json' : '.auth-idir.json'
        )
      }
    }
  ]
})
