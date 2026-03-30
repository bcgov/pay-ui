/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/transactions-page.js
 * Purpose: Encapsulates Transaction Receipt Download interactions and selectors
 * author: Anish Batra
 * Created: March 30, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Transaction Receipt Download functionality.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */
import { expect } from '@playwright/test'
export class TransactionsPage {
  constructor(page) {
    this.page = page
    this.accountName = page.locator('[data-test="account-name"]')
    this.transactionsText = page.getByText('Transactions')
    this.receiptLink = page.getByText('Receipt')
  }

  async downloadTransactionReceipt() {
    await this.accountName.click({timeout: 10000})
    await this.page.waitForTimeout(1000) // Wait for dropdown to appear
    await this.transactionsText.click({timeout: 10000})
    await this.page.waitForTimeout(4000)
    await expect(this.page).toHaveURL(/transactions/)
    await this.receiptLink.click({timeout: 10000})
  }

  async downloadTransactionReceiptAndVerify() {
    // Set up download listener before clicking
    const downloadPromise = this.page.waitForEvent('download', { timeout: 50000 })
    // Click the receipt link
    await this.receiptLink.first().click({timeout: 10000})

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