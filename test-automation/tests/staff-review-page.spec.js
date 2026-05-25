/**
 * ============================================================================
 * Staff Review Page Tests
 * ============================================================================
 *
 * File: tests/staff-review-page.spec.js
 * Purpose: End-to-end regression tests for Staff Review page
 * Created: MAy 20, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the staff review functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (deactivate button)
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.describe.serial('Staff Review Tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('validate staff review functionality-approve account', async ({ page, staffReviewPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.BASE_URL || 'undefined')
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await staffReviewPage.ApproveAnAccount()
  })

  test('validate staff review functionality-decline account', async ({ page, staffReviewPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.BASE_URL || 'undefined')
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await staffReviewPage.DeclineAnAccount()
  })
})