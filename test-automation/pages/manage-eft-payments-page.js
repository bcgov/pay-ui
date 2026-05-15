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
    this.initiateRefundButton = page.getByText(' Initiate Refund ')
    this.issueACheckButton = page.getByText('Issue a cheque')
    this.directDepositButton = page.getByText('Direct Deposit (using CAS information)')
    this.nextButton = page.getByText('Next')
    this.refundAmountInput = page.locator('[data-test="refundAmount"]')
    this.streetAddressInput = page.locator('[id="street-address-1"]')
    this.firstAddressOption = page.getByText('1st-290 Dupuis St')
    this.emailInput = page.locator('[data-test="email"]')
    this.entityNameInput = page.locator('[data-test="entityName"]')
    this.refundReasonInput = page.locator('[data-test="staffComment"]')
    this.submitRefundRequestButton = page.getByText('Submit Refund Request')
    this.declineButton = page.getByText(' Decline ')
    this.declineBtnOnConfirmationPopup = page.locator('[data-test="btn-confirm-confirmation-dialog"]')
    this.casSupplierNumber = page.locator('[data-test="casSupplierNumber"]')
    this.casSupplierSite = page.locator('[data-test="casSupplierSite"]')
  }

  async accountUnlinkAndLink() {
    await this.manageEFTPaymentsButton.click({timeout: 60000})
    await this.page.waitForTimeout(8000)
    await this.bankShortNameFilterInput.first().pressSequentially('TSTDESPOSITDATE001')
    await this.page.waitForTimeout(5000) // wait for filter to apply
    await this.viewDetailsButton.click({timeout: 60000})
    //await this.arrowWithApplyPaymentButton.click({timeout: 60000})
    await this.unlinkAccountButton.click({timeout: 60000})
    await expect(this.unlinkAccountConfirmationText).toBeVisible({timeout: 60000})
    await this.confirmButton.click({timeout: 60000})
    await this.linkToAccountButton.click({timeout: 60000})
    await this.accountID.click({timeout: 60000})
    await this.accountID.fill('3738')
    await this.selectAccountToLink.click({timeout: 60000})
    await this.page.waitForTimeout(2000)
    await this.linkAccountButtonOnConfirmationPopup.click({timeout: 60000})
    await expect(this.page.locator('tbody').first()).toContainText('3738',{timeout: 60000})
    await this.cancelPaymentButton.click({timeout: 60000})
    await this.page.waitForTimeout(3000)
    await this.confirmButton.click({timeout: 60000})
    await this.page.waitForTimeout(2000)
  }

  async initiateRefund(option) {
    await this.manageEFTPaymentsButton.click({timeout: 60000})
    await this.page.waitForTimeout(8000)
    await this.bankShortNameFilterInput.first().pressSequentially('FEDERAL PAYMENT CANADA 1')
    await this.page.waitForTimeout(5000) // wait for filter to apply
    await this.viewDetailsButton.click({timeout: 60000})
    await this.page.waitForTimeout(2000)
    await this.initiateRefundButton.last().click({timeout: 60000})
    await this.page.waitForTimeout(3000) // wait for refund options to load
    if (option === 'Check') {
      await this.issueACheckButton.click({timeout: 60000})
      await this.page.waitForTimeout(2000)
      await this.nextButton.click({timeout: 60000})
      await this.page.waitForTimeout(2000)
      await this.refundAmountInput.fill('5')
      await this.page.waitForTimeout(1000)
      await this.streetAddressInput.fill('1 street')
      await this.page.waitForTimeout(1000)
      await this.page.keyboard.press('Space')
      await this.page.waitForTimeout(1000)
      await this.firstAddressOption.click({timeout: 10000})
      await this.page.waitForTimeout(1000)
      await this.emailInput.fill('anish@test.com')
      await this.entityNameInput.fill('anishTestEntity')
      await this.refundReasonInput.fill('Test Refund')
    }
    if(option === 'DD') {
      await this.directDepositButton.click({timeout: 60000})
      await this.nextButton.click({timeout: 60000})
      await this.refundAmountInput.fill('5')
      await this.emailInput.fill('anish@test.com')
      await this.casSupplierNumber.fill('12345')
      await this.casSupplierSite.fill('anish-test-site')
      await this.refundReasonInput.fill('Test Refund')
    }
    await this.submitRefundRequestButton.click({timeout: 60000})
    await this.page.waitForTimeout(10000)
    //await expect(this.declineButton).toBeVisible({timeout: 60000})
    await this.declineButton.click({timeout: 60000})
    await this.declineBtnOnConfirmationPopup.click({timeout: 60000})
    await this.page.waitForTimeout(2000)
  }
}