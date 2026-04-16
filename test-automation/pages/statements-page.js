/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/account-info-page.js
 * Purpose: Encapsulates Account Info page interactions and selectors
 * author: Anish Batra
 * Created: February 16, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Account Info page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */

import { expect } from '@playwright/test'

export class StatementsPage {
  constructor(page) {
    this.page = page
    this.accountName = page.locator('[class="v-btn__content"]')
    this.accountInfoText = page.getByText('Account Info')
    this.statementsLink = page.getByText('Statements')
    this.CSVLink = page.getByText('CSV')
    this.PDFLink = page.getByText('PDF')
  }

  async clickStatementsLink() {
    await this.accountName.nth(1).click({timeout: 60000})
    await this.page.waitForTimeout(1000) // Wait for dropdown to appear
    await this.accountInfoText.click({timeout: 60000})
    await this.page.waitForTimeout(4000)
    await this.statementsLink.click({timeout: 60000})
    await expect(this.page).toHaveURL(/\/statements/, { timeout: 60000 })
  }

  async downloadStatementAndVerify(options = { format: 'CSV' }) {
    // Set up download listener before clicking
    const downloadPromise = this.page.waitForEvent('download', { timeout: 50000 })
    // Click the receipt link
    if (options.format === 'CSV') {
      await this.CSVLink.first().click({timeout: 20000})
    } else if (options.format === 'PDF') {
      await this.PDFLink.first().click({timeout: 50000})
    }

    // Wait for download to start
    const download = await downloadPromise

    // Wait for download to complete
    await download.path()

    // Optional: Verify download details
    console.log('Downloaded file:', download.suggestedFilename())
    console.log('Download URL:', download.url())

    return download
  }

}