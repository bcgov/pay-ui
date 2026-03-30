/**
 * ============================================================================
 * Playwright Test Fixtures
 * ============================================================================
 *
 * File: fixture.js
 * Purpose: Define reusable test fixtures for all tests
 * Created: February 16, 2026
 *
 * Description:
 *   This file extends Playwright's base test fixture with custom fixtures,
 *   providing page objects to all tests without manual instantiation.
 *   Fixtures enable DRY (Don't Repeat Yourself) test code and consistent setup.
 * ============================================================================
 */

import { test as base, expect } from '@playwright/test'
import { LoginPage } from './pages/login-page.js'
import { AccountInfoPage } from './pages/account-info-page.js'
import {RefundRequestPage} from './pages/refund-request-page.js'
import{RefundDeclinePage} from './pages/refund-decline-page.js'
import {RefundApprovePage} from './pages/refund-approve-page.js'
import { TransactionsPage } from './pages/transactions-page.js'

const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  accountInfoPage: async ({ page }, use) => {
    await use(new AccountInfoPage(page))
  },
  refundRequestPage: async ({ page }, use) => {
    await use(new RefundRequestPage(page))
  },
  refundDeclinePage: async ({ page }, use) => {
    await use(new RefundDeclinePage(page))
  },
  refundApprovePage: async ({ page }, use) => {
    await use(new RefundApprovePage(page))
  },
  transactionsPage: async ({ page }, use) => {
    await use(new TransactionsPage(page))
  }
})

export {
  test,
  expect
}