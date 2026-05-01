/**
 * ============================================================================
 * Manage EFT Payments Page - Page Object Model
 * ============================================================================
 *
 * File: pages/manage-eft-payments-page.js
 * Purpose: Encapsulates Manage EFT Payments page interactions and selectors
 * author: Anish Batra
 * Created: May 01, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Manage EFT Payments page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */

import { expect } from '@playwright/test'

export class ManageEFTPaymentsPage {
  constructor(page) {
    this.page = page
    this.manageEFTPaymentsButton = page.getByText('Manage EFT Payments')
    this.bankShortNameFilterInput = page.locator('[placeholder="Bank Short Name"]')
    this.viewDetailsButton = page.getByText(' View Details ')
    this.unlinkAccountButton = page.getByText('Unlink Account')
    this.unlinkAccountConfirmationText = page.getByText(' The link with this account will be removed. ')
    this.confirmButton = page.getByText(' Confirm ')
    this.linkToAccountButton = page.getByText(' Link to Account ')
    this.accountID = page.locator('[class="v-select__selections"]>input')
    this.arrowWithApplyPaymentButton = page.locator('[class="more-actions"]')
    this.selectAccountToLink = page.locator('[role="option"]')
    this.linkAccountButtonOnConfirmationPopup = page.getByText(' Link Account ')
    this.cancelPaymentButton = page.getByText(' Cancel Payment ')
  }

  async accountUnlinkAndLink() {
    await this.manageEFTPaymentsButton.click({timeout: 60000})
    await this.page.waitForTimeout(8000)
    await this.bankShortNameFilterInput.first().pressSequentially('KENLI013')
    await this.page.waitForTimeout(5000) // wait for filter to apply
    await this.viewDetailsButton.click({timeout: 60000})
    await this.arrowWithApplyPaymentButton.click({timeout: 60000})
    await this.unlinkAccountButton.click({timeout: 60000})
    await expect(this.unlinkAccountConfirmationText).toBeVisible({timeout: 60000})
    await this.confirmButton.click({timeout: 60000})
    await this.linkToAccountButton.click({timeout: 60000})
    await this.accountID.click({timeout: 60000})
    await this.accountID.fill('2955')
    await this.selectAccountToLink.click({timeout: 60000})
    await this.page.waitForTimeout(2000)
    await this.linkAccountButtonOnConfirmationPopup.click({timeout: 60000})
    await expect(this.page.locator('tbody').first()).toContainText('2955',{timeout: 60000})
    await this.cancelPaymentButton.click({timeout: 60000})
    await this.page.waitForTimeout(3000)
    await this.confirmButton.click({timeout: 60000})
    await this.page.waitForTimeout(2000)
  }
}