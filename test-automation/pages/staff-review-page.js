/**
 * ============================================================================
 * Staff Review Page - Page Object Model
 * ============================================================================
 *
 * File: pages/staff-review-page.js
 * Purpose: Encapsulates Staff Review page interactions and selectors
 * author: Anish Batra
 * Created: May 20, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Staff Review page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
    */
export class StaffReviewPage {
  constructor(page) {
    this.page = page
    this.pendingReviewTab = page.getByRole('tab', { name: ' Pending Review ' })
    this.reviewButton = page.getByRole('button', { name: 'Review' })
    this.approveButton = page.getByRole('button', { name: 'Approve' })
  }

  async ApproveAnAccount() {
    await this.pendingReviewTab.click({timeout: 10000})
    await this.reviewButton.click({timeout: 10000})
    await this.approveButton.click({timeout: 10000})
    await this.page.waitForTimeout(3000)
    await this.approveButton.click({timeout: 10000})
  }
}