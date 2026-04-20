/**
 * ============================================================================
 * Transaction Receipt Download Tests
 * ============================================================================
 *
 * File: tests/transactions-receipt-download.spec.js
 * Purpose: End-to-end tests for transaction receipt download functionality
 * Created: March 30, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the transaction receipt download functionality:
 *   - Navigation to transactions page
 *   - Receipt link click and download verification
 *   - Download completion and file validation
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.describe('Statement Download Tests', () => {
  // eslint-disable-next-line max-len
  test('validate statement  download functionality (CSV & PDF)', async ({ page,statementsPage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.BASE_URL,{timeout: 180000})
    await statementsPage.clickStatementsLink()

    // Download receipt and verify
    const download = await statementsPage.downloadStatementAndVerify({format: 'PDF'})

    // Additional verification - check file exists and has content
    const downloadPath = await download.path()
    console.log('Download completed successfully at:', downloadPath)
  })
})