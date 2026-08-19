/**
 * ============================================================================
 * BCA validation test suite
 * ============================================================================
 *
 * File: tests/bca-validation.spec.js
 * Purpose: End-to-end regression tests for BCA validation
 * Created: July 29, 2026
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


test('validate authentication flow', async ({ page, bcaValidationPage , loginPage }) => {
  console.log('Test: Current URL before navigation:', page.url())
  console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
  await page.goto(process.env.BASE_URL || 'undefined')
  await loginPage.loginWithBCSC(process.env.TEST_USERNAME_BCSC, process.env.TEST_PASSWORD_BCSC)
  await bcaValidationPage.validateBcaPaymentMethods()
})
test('validate products and services flow', async ({ page, bcaValidationPage , loginPage }) => {
  console.log('Test: Current URL before navigation:', page.url())
  console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
  await page.goto(process.env.BASE_URL || 'undefined')
  await loginPage.loginWithBCSC(process.env.TEST_USERNAME_BCSC, process.env.TEST_PASSWORD_BCSC)
  await bcaValidationPage.validateProductsandServices()
})

test('add / remove  BCA product', async ({ page, bcaValidationPage , loginPage }) => {
  console.log('Test: Current URL before navigation:', page.url())
  console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
  await page.goto(process.env.BASE_URL || 'undefined')
  await loginPage.loginWithBCSC(process.env.TEST_USERNAME_BCSC, process.env.TEST_PASSWORD_BCSC)
  await bcaValidationPage.addRemoveBCAProduct(process.env.TEST_USERNAME_BCSC)
})

test('validate no review task for BCA product', async ({ page, bcaValidationPage , loginPage }) => {
  console.log('Test: Current URL before navigation:', page.url())
  console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
  await page.goto(process.env.BASE_URL || 'undefined')
  //login with IDIR credentials to validate that there is no review task for BCA product
  await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
  await bcaValidationPage.noReviewTaskForBCAProduct(process.env.TEST_USERNAME_BCSC)
})
