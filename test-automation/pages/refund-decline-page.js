/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/refund-request-page.js
 * Purpose: Encapsulates Refund Request and Decline page interactions and selectors
 * author: Anish Batra
 * Created: March 15, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Refund Request and Decline page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */
import { expect } from '@playwright/test'
export class RefundDeclinePage {
  constructor(page) {
    this.page = page
    this.pendingRequestsTab = page.getByRole('tab', { name: 'Pending Requests' })
    this.refundTestAutomationText = page.getByText('Testing refund request test automation')
    this.viewDetailsButton = page.locator('#action-menu-0 button')
    this.declineButton = page.getByRole('button', { name: 'Decline' })
    this.reasonsForDecline = page.locator('[required="required"]')
  }

  async declineRefundRequest() {
    await this.pendingRequestsTab.click({timeout: 10000})
    await expect(this.refundTestAutomationText).toBeVisible({ timeout: 10000 })
    await this.viewDetailsButton.nth(1).click({timeout: 10000})
    await expect(this.refundTestAutomationText).toBeVisible({ timeout: 10000 })
    await this.declineButton.click({timeout: 10000})
    await this.reasonsForDecline.fill('Testing refund request decline functionality-Test Automation')
    await this.declineButton.last().click({timeout: 10000})
    await this.page.waitForTimeout(3000) // wait for the decline action to process
  }

}