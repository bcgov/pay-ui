/**
 * ============================================================================
 * Routing Slips Page Tests
 * ============================================================================
 *
 * File: tests/routing-slips-page.spec.js
 * Purpose: End-to-end regression tests for routing slips page
 * Created: August 18, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the routing slips functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (deactivate button)
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.describe.serial('Routing Slips Tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('create routing slip refund request', async ({ page, routingSlipsPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.BASE_URL || 'undefined')
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await routingSlipsPage.createRefundRequestForRoutingSlip()
  })

  test('validate routing slip refund request', async ({ page, routingSlipsPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.BASE_URL || 'undefined')
    //login with idir user that has FAS supervisior role to validate routing slip refund request
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await routingSlipsPage.validateRoutingSlipRefundRequest()
  })

  test('validate routing slip write-off request', async ({ page, routingSlipsPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.BASE_URL || 'undefined')
    //login with idir user that has FAS supervisior role to validate routing slip refund request
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await routingSlipsPage.validateRoutingSlipWriteOffRequest()
  })
})