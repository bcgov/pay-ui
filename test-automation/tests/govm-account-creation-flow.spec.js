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
test('validate govm account creation  flow ', async ({ page, govmAccountCreationPage , loginPage }) => {
  console.log('Test: Current URL before navigation:', page.url())
  console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
  await page.goto('https://test.bcregistry.gov.bc.ca/en-CA/dashboard',{timeout: 180000})
  await loginPage.loginWithIDIR(process.env.TEST_USERNAME_BCSC_IDIR, process.env.TEST_PASSWORD_BCSC_IDIR)
  await govmAccountCreationPage.govmAccountCreation()
})
