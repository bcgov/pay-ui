/**
 * ============================================================================
 * Account Info Page Tests
 * ============================================================================
 *
 * File: tests/account-Info-page.spec.js
 * Purpose: End-to-end regression tests for Account Info page
 * Created: February 17, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the Account Info page functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (deactivate button)
 * ============================================================================
 */

import { test } from '../fixtures.js';

test.describe('Account Info Page Tests', () => {
    test('should display account info page correctly @regression', async ({ page, accountInfoPage }) => {
        // Cookies from .auth.json are automatically loaded via storageState in config
        console.log('Test: Current URL before navigation:', page.url());
        console.log('Test: Cookies loaded:', (await page.context().cookies()).length);
        await accountInfoPage.accountInfo();
    });
});