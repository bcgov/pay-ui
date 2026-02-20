/**
 * ============================================================================
 * Global Setup - Authentication & Session Initialization
 * ============================================================================
 *
 * File: globalSetup.js
 * Purpose: Runs before all tests to authenticate and cache sessions
 * Author: Anish Batra
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

function loadEnvironmentConfig() {
    const envName = process.env.ENV_NAME || 'dev';
    const envFilePath = path.join(__dirname, 'env', `.env.${envName}`);

    console.log(`Global setup: Loading environment '${envName}'`);

    // In CI, pick BASE_URL based on ENV_NAME
    if (process.env.BASE_URL_TEST || process.env.BASE_URL_DEV) {
        process.env.BASE_URL = envName === 'test'
            ? process.env.BASE_URL_TEST
            : process.env.BASE_URL_DEV;
        console.log(`Global setup: Using BASE_URL for '${envName}': ${process.env.BASE_URL}`);
        return { envName, envFilePath };
    }

    // Locally, load from env file
    if (!fs.existsSync(envFilePath)) {
        throw new Error(`Environment file not found: ${envFilePath}`);
    }

    dotenv.config({ path: envFilePath });
    return { envName, envFilePath };
}

function getCredentials() {
    const loginType = (process.env.LOGIN_TYPE || 'idir').toLowerCase();

    const username = loginType === 'idir'
        ? (process.env.TEST_USERNAME_IDIR || process.env.TEST_USERNAME)
        : (process.env.TEST_USERNAME_BCSC || process.env.TEST_USERNAME);

    const password = loginType === 'idir'
        ? (process.env.TEST_PASSWORD_IDIR || process.env.TEST_PASSWORD)
        : (process.env.TEST_PASSWORD_BCSC || process.env.TEST_PASSWORD);

    return { username, password, loginType };
}

function validateCredentialsAreProvided(username, password, baseURL, loginType, envFilePath) {
    if (!username || !password || !baseURL) {
        console.error(`Global setup: Missing required environment variables in ${envFilePath}`);
        console.error(`  BASE_URL: ${baseURL ? '✓' : '✗'}`);
        console.error(`  LOGIN_TYPE: ${loginType}`);
        console.error(`  TEST_USERNAME_BCSC: ${process.env.TEST_USERNAME_BCSC ? '✓' : '✗'}`);
        console.error(`  TEST_PASSWORD_BCSC: ${process.env.TEST_PASSWORD_BCSC ? '✓' : '✗'}`);
        console.error(`  TEST_USERNAME_IDIR: ${process.env.TEST_USERNAME_IDIR ? '✓' : '✗'}`);
        console.error(`  TEST_PASSWORD_IDIR: ${process.env.TEST_PASSWORD_IDIR ? '✓' : '✗'}`);
        throw new Error('Missing required environment variables for login');
    }
}

async function launchBrowser() {
    const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
    console.log('Global setup: Launching Chromium browser...');
    try {
        const browser = await chromium.launch({ headless: isCI });
        console.log(`Global setup: Chromium browser launched successfully (headless=${isCI})`);
        return browser;
    } catch (launchError) {
        console.error('Global setup: Failed to launch Chromium browser!', launchError.message);
        throw new Error(`Browser launch failed: ${launchError.message}. Make sure to run: npx playwright install`);
    }
}

async function performLoginAndSaveSession(page, context, baseURL, loginType, username, password) {
    await page.goto(baseURL);

    const loginPage = new LoginPage(page);

    if (loginType === 'idir') {
        console.log('Global setup: Using IDIR login flow');
        await loginPage.loginWithIDIR(username, password);
    } else {
        console.log('Global setup: Using BCSC login flow');
        await loginPage.loginWithBCSC(username, password);
    }

    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    try {
        await page.waitForURL(`**/unauthorized`, { timeout: 5000 });
    } catch (e) {
        // ignore - not all auth flows land on /unauthorized
    }

    console.log('Global setup: Login completed, URL:', page.url());

    const authFileName = `.auth-${loginType}.json`;
    const authFile = path.join(__dirname, authFileName);
    await context.storageState({ path: authFile });

    console.log(`Global setup: Storage state saved to ${authFile}`);
}

async function globalSetup() {
    const { envFilePath } = loadEnvironmentConfig();
    const baseURL = process.env.BASE_URL;
    const { username, password, loginType } = getCredentials();

    validateCredentialsAreProvided(username, password, baseURL, loginType, envFilePath);

    console.log(`Global setup: Starting login process for ${baseURL}...`);

    const browser = await launchBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await performLoginAndSaveSession(page, context, baseURL, loginType, username, password);
    } catch (error) {
        console.error('Global setup: Login failed!', error);
        console.error('Current URL:', page.url());
        throw error;
    } finally {
        await browser.close();
    }

    console.log('Global setup completed.');
}

export default globalSetup;