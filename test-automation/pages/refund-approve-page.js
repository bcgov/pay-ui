/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/refund-request-page.js
 * Purpose: Encapsulates Refund Request and Approve page interactions and selectors
 * author: Anish Batra
 * Created: March 23, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Refund Request and Approve page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */
import { expect } from '@playwright/test'
export class RefundApprovePage {
  constructor(page) {
    this.page = page
    this.pendingRequestsTab = page.getByRole('tab', { name: 'Pending Requests' })
    this.refundTestAutomationText = page.getByText('Testing refund request test automation')
    this.viewDetailsButton = page.locator('#action-menu-0 button')
    this.approveButton = page.getByRole('button', { name: 'Approve' })
    this.refundRequestApprovedText = page.getByText('Refund request approved.')
  }

  async approveRefundRequest() {
    await this.pendingRequestsTab.click({timeout: 10000})
    await expect(this.refundTestAutomationText).toBeVisible({ timeout: 10000 })
    await this.viewDetailsButton.nth(1).click({timeout: 10000})
    await expect(this.refundTestAutomationText).toBeVisible({ timeout: 10000 })
    await this.approveButton.click({timeout: 10000})
    await this.page.waitForTimeout(3000) // wait for the approve action to process
    await expect(this.refundRequestApprovedText).toBeVisible({ timeout: 10000 })
  }

}