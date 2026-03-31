/**
 * ============================================================================
 * Account Info Page Tests
 * ============================================================================
 *
 * File: tests/authentication-flow-validation.spec.js
 * Purpose: End-to-end regression tests for authentication flow validation
 * Created: March 14, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the authentication functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (authentication link)
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.use({ storageState: { cookies: [], origins: [] } })  // clears saved cookies

//TODO - once authentication code merged to test , validation will be reversed

test('validate authentication flow @regression', async ({ page, accountInfoPage , loginPage }) => {
  console.log('Test: Current URL before navigation:', page.url())
  console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
  await page.goto(process.env.BASE_URL || 'undefined')
  await loginPage.loginWithBCSC(process.env.TEST_USERNAME_BCSC, process.env.TEST_PASSWORD_BCSC)
  await accountInfoPage.accountInfo()
})
