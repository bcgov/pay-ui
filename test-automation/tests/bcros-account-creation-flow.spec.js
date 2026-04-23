/**
 * ============================================================================
 * Bcros Account Creation Flow - End-to-End Test
 * ============================================================================
 *
 * File: tests/bcros-account-creation-flow.spec.js
 * Purpose: End-to-end regression tests for bcros account creation flow
 * Created: April 23, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 * ============================================================================
 */

import { test } from '../fixtures.js'
test('validate bcros account creation (individual)  flow', async ({ page, bcrosAccountCreationPage}) => {
  console.log('Test: Current URL before navigation:', page.url())
  console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
  await page.goto('https://test.bcregistry.gov.bc.ca/en-CA/dashboard',{timeout: 180000})
  await bcrosAccountCreationPage.bcrosAccountCreation()
})
