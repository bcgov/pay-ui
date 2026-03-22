/**
 * ============================================================================
 * Account Info Page Tests
 * ============================================================================
 *
 * File: tests/account-Info-page.spec.js
 * Purpose: End-to-end regression tests for Account Info page
 * Created: March 23, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the refund request functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (deactivate button)
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.describe.serial.only('Refund Request Tests', () => {
  test('validate refund request functionality @regression', async ({ page, refundRequestPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.TRANSACTIONS_URL || 'undefined')
    await loginPage.loginWithBCSC(process.env.TEST_USERNAME_BCSC_IDIR, process.env.TEST_PASSWORD_BCSC_IDIR)
    await refundRequestPage.refundRequest()
  })
  test.use({ storageState: { cookies: [], origins: [] } })  // clears saved cookies
  test('validate refund approve functionality @regression', async ({ page, refundApprovePage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    await page.goto(process.env.TRANSACTIONS_URL || 'undefined')
    // eslint-disable-next-line max-len
    await loginPage.loginWithBCSC(process.env.REFUND_APPROVER_USERNAME_BCSC_IDIR, process.env.REFUND_APPROVER_PASSWORD_BCSC_IDIR)
    await refundApprovePage.approveRefundRequest()
  })
})