/**
 * ============================================================================
 * Global Setup - Authentication & Session Initialization
 * ============================================================================
 *
 * File: globalSetup.js
 * Purpose: Runs before all tests to authenticate and cache sessions
 * author: Anish Batra
 * Created: February 17, 2026
 *
 * Description:
 *   This script executes globally before any tests run. It:
 *   1. Loads environment configuration (dev/test)
 *   2. Selects login method (BCSC or IDIR) via LOGIN_TYPE env var
 *   3. Authenticates against the application
 *   4. Saves authenticated session to .auth-<loginType>.json
 *   5. All tests then reuse this cached session
 * ============================================================================
 */

import dotenv from 'dotenv';
import { chromium } from '@playwright/test';
import { LoginPage } from './pages/login-page.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup() {
    // Get environment name from CLI or default to 'dev'
    // Usage: ENV_NAME=test npx playwright test
    const envName = process.env.ENV_NAME || 'dev';
    const envFilePath = path.join(__dirname, 'env', `.env.${envName}`);

    console.log(`Global setup: Loading environment '${envName}'`);

    // Check if env file exists
    if (!fs.existsSync(envFilePath)) {
        throw new Error(`Environment file not found: ${envFilePath}`);
    }

    // Load environment variables from the specified .env file
    dotenv.config({ path: envFilePath });

    const baseURL = process.env.BASE_URL;
    // Which login flow to use: 'bcsc' or 'idir' (default: idir)
    const loginType = (process.env.LOGIN_TYPE || 'idir').toLowerCase();

    // Pick credentials based on loginType. Support explicit vars for each flow,
    // with fallbacks to generic TEST_USERNAME / TEST_PASSWORD for backwards compatibility.
    const username = loginType === 'idir'
        ? (process.env.TEST_USERNAME_IDIR || process.env.TEST_USERNAME)
        : (process.env.TEST_USERNAME_BCSC || process.env.TEST_USERNAME);

    const password = loginType === 'idir'
        ? (process.env.TEST_PASSWORD_IDIR || process.env.TEST_PASSWORD)
        : (process.env.TEST_PASSWORD_BCSC || process.env.TEST_PASSWORD);

    // Validate that credentials are provided
    if (!username || !password || !baseURL) {
        console.error(`Global setup: Missing required environment variables in ${envFilePath}`);
        console.error(`  BASE_URL: ${baseURL ? '✓' : '✗'}`);
        console.error(`  LOGIN_TYPE: ${loginType}`);
        console.error(`  TEST_USERNAME_BCSC: ${process.env.TEST_USERNAME_BCSC ? '✓' : '✗'}`);
        console.error(`  TEST_PASSWORD_BCSC: ${process.env.TEST_PASSWORD_BCSC ? '✓' : '✗'}`);
        console.error(`  TEST_USERNAME_IDIR: ${process.env.TEST_USERNAME_IDIR ? '✓' : '✗'}`);
        console.error(`  TEST_PASSWORD_IDIR: ${process.env.TEST_PASSWORD_IDIR ? '✓' : '✗'}`);
        console.error(`  TEST_USERNAME (fallback): ${process.env.TEST_USERNAME ? '✓' : '✗'}`);
        console.error(`  TEST_PASSWORD (fallback): ${process.env.TEST_PASSWORD ? '✓' : '✗'}`);
        throw new Error('Missing required environment variables for login');
    }

    console.log(`Global setup: Starting login process for ${baseURL}...`);

    // Launch browser
    console.log('Global setup: Launching Chromium browser...');
    let browser;
    try {
        // Run headed locally, headless in CI (GitHub Actions sets GITHUB_ACTIONS env)
        const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
        browser = await chromium.launch({ headless: isCI });
        console.log(`Global setup: Chromium browser launched successfully (headless=${isCI})`);
    } catch (launchError) {
        console.error('Global setup: Failed to launch Chromium browser!', launchError.message);
        throw new Error(`Browser launch failed: ${launchError.message}. Make sure to run: npx playwright install`);
    }
    
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to login page
        await page.goto(`${baseURL}`);

        // Perform login using LoginPage
        const loginPage = new LoginPage(page);

        if (loginType === 'idir') {
            console.log('Global setup: Using IDIR login flow');
            await loginPage.loginwithidir(username, password);
        } else {
            console.log('Global setup: Using BCSC login flow');
            await loginPage.loginwithbcsc(username, password);
        }

        // Wait for navigation / network idle after login. Some flows redirect differently,
        // so prefer waiting for networkidle then log the resulting URL.
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        // Try to wait for expected URL if present, but don't fail if it doesn't appear.
        try {
            await page.waitForURL(`**/unauthorized`, { timeout: 5000 });
        } catch (e) {
            // ignore - not all auth flows land on /unauthorized
        }
        console.log('Global setup: Login completed, URL:', page.url());

        // Save storage state (cookies + localStorage + sessionStorage) using Playwright's recommended method
        const authFileName = `.auth-${loginType}.json`;
        const authFile = path.join(__dirname, authFileName);
        await context.storageState({ path: authFile });
        
        console.log(`Global setup: Storage state saved to ${authFile}`);

    } catch (error) {
        console.error('Global setup: Login failed!', error);
        console.error('Current URL:', page.url());
        throw error;
    } finally {
        // Close browser
        await browser.close();
    }

    console.log('Global setup completed.');
}

export default globalSetup;