/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/refund-request-page.js
 * Purpose: Encapsulates Refund Request page interactions and selectors
 * author: Anish Batra
 * Created: March 14, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Refund Request page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */
import { expect } from '@playwright/test'
export class RefundRequestPage {
  constructor(page) {
    this.page = page
    this.moreActionsArrow = page.locator('[class="more-actions"]')
    this.initiateRefund = page.getByText('Initiate Refund')
    this.fullRefund = page.getByText('Full Refund')
    this.notificationemail = page.locator('[type="email"]')
    this.reasonForRefund = page.locator('[placeholder="Enter Reasons for Refund"]')
    this.reviewAndConfirmButton = page.getByRole('button', { name: 'Review and Confirm' })
    this.submitRefundRequestButton = page.getByRole('button', { name: 'Submit Refund Request' })
    this.refundRequestSubmittedText = page.getByText('Refund request submitted.')
    this.paymentStatus = page.getByText('Status')
    this.processingStatus = page.getByText('Processing')
  }

  async refundRequest() {
    await this.page.goto(process.env.TRANSACTIONS_URL || 'undefined')
    await this.paymentStatus.nth(1).click({timeout: 10000})
    await this.processingStatus.click({timeout: 10000})
    await this.moreActionsArrow.first().click({timeout: 10000})
    await this.initiateRefund.click({timeout: 10000})
    await this.fullRefund.click({timeout: 10000})
    await this.notificationemail.fill('anish.batra@gov.bc.ca')
    await this.reasonForRefund.fill('Testing refund request test automation')
    await this.reviewAndConfirmButton.click({timeout: 10000})
    await this.submitRefundRequestButton.click({timeout: 10000})
    await expect(this.refundRequestSubmittedText).toBeVisible({ timeout: 10000 })
  }

}