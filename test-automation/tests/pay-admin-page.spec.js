/**
 * ============================================================================
 * Pay Admin Page Tests
 * ============================================================================
 *
 * File: tests/pay-admin-page.spec.js
 * Purpose: End-to-end regression tests for Pay Admin page
 * Created: June 26, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the pay admin functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (deactivate button)
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.describe.serial('Pay Admin Tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('validate pay admin functionality-create fee code', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.createFeeCode()
  })

    test('validate pay admin functionality-edit fee code and save', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin (IDIR)
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.editFeeCodeAndSave()
  })

  test.use({ storageState: { cookies: [], origins: [] } })
  test('validate pay admin functionality-validate fee schedule', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.validateFeeSchedule()
  })

  test('validate pay admin functionality-create corp type', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin (IDIR)
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.createCorpType()
  })

   test('validate pay admin functionality-create distribution code', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin (IDIR)
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.createDistributionCode()
  })

    test('validate pay admin functionality-create filling type and save', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin (IDIR)
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.createAndSaveFillingType()
  })

    test('validate pay admin functionality-edit filling type and save', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin (IDIR)
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.editFillingTypeAndSave()
  })
  test('validate pay admin functionality-edit distribution code and save', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin (IDIR)
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.editDistributionCodeAndSave()
  })

  test('validate pay admin functionality-edit fee schedule and save', async ({ page, payAdminPage , loginPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    // use credentials for Pay admin (IDIR)
    await loginPage.loginWithIDIR(process.env.TEST_USERNAME_IDIR, process.env.TEST_PASSWORD_IDIR)
    await payAdminPage.editFeeScheduleAndSave()
  })
})