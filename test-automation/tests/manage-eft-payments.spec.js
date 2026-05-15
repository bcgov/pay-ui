/**
 * ============================================================================
 * Manage EFT Payments Page Tests
 * ============================================================================
 *
 * File: tests/manage-eft-payments.spec.js
 * Purpose: End-to-end regression tests for Manage EFT Payments page
 * Created: May 01, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the Manage EFT Payments page functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (deactivate button)
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.describe('Manage EFT Payments Page Tests', () => {

  //use login type as idir to run this test
  test.use({ storageState: { cookies: [], origins: [] } })  // clears saved cookies
  // eslint-disable-next-line max-len
  test('should validate account linkage and unlink for EFT Payments correctly', async ({ page, loginPage, manageEFTPaymentsPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.EFT_PAYMENTS_URL,{timeout: 180000})
    await loginPage.loginWithIDIR('<use test idir username >','<use test idir password>')
    await manageEFTPaymentsPage.accountUnlinkAndLink()
  })
})