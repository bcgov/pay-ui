/**
 * ============================================================================
 * BCA Validation Page - Page Object Model
 * ============================================================================
 *
 * File: pages/bca-validation-page.js
 * Purpose: Encapsulates BCA validation page interactions and selectors
 * author: Anish Batra
 * Created: July 30, 2026
 *
 * Description:
 *   This page object provides methods and locators for the BCA validation page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */

import { expect } from '@playwright/test'

export class BcaValidationPage {
  constructor(page) {
    this.page = page
    this.accountName = page.locator('[class="v-btn__content"]')
    this.accountInfoText = page.getByText('Account Info')
    this.productsAndPaymentLink = page.getByText('Products and Payment')
    this.BCAssessment = page.locator('[data-test="BCA"]')
    this.supportedPaymentMethods = page.getByText(' Supported payment methods: ')
    this.saveButton = page.getByRole('button', { name: 'Save' })
    this.bcaCard = page.locator('[data-test="div-product-BCA"]')
    this.bcaPaymentMethods = this.bcaCard.locator('.product-payment-icons')
    this.productCheckbox = page.locator('[type="checkbox"]')
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.BCAssessmentAccess = page.getByText('This account has access to BC Assessment.')
    this.removeProduct = page.getByText(' Remove Product ')
    this.closeButton = page.getByText(' Close ')
    this.dateSubmitted = page.locator('[placeholder="Date Submitted"]')
    this.nameFilter = page.locator('[id="name"]')
    this.pendingReviewTab = page.getByRole('tab', { name: ' Pending Review ' })
    this.noActiveAccountsText = page.getByText('No Active Accounts') 
  }

  async getBcaPaymentMethods() {
    const texts = await this.bcaPaymentMethods.allTextContents()
    return texts.map(t => t.trim())
  }

  async validateBcaPaymentMethods() {
    await this.accountName.nth(1).click({ timeout: 60000 })
    await this.editProfileLink.click({ timeout: 60000 })
    await this.accountInfoText.click({ timeout: 60000 })
    await this.productsAndPaymentLink.click({ timeout: 60000 })
    await expect(this.BCAssessment).toBeVisible({ timeout: 60000 })
    await expect(this.supportedPaymentMethods).toBeVisible({ timeout: 60000 })

    const methods = await this.getBcaPaymentMethods()
    expect(methods).toEqual([
      'PRE-AUTHORIZED DEBIT',
      'CREDIT CARD',
      'BC ONLINE',
    ])
  }

  async validateProductsandServices() {
    await this.accountName.nth(1).click({ timeout: 60000 })
    await this.editProfileLink.click({ timeout: 60000 })
    await this.accountInfoText.click({ timeout: 60000 })
    await this.productsAndPaymentLink.click({ timeout: 60000 })
    await this.productCheckbox.first().check({ timeout: 60000 })
    await this.waitForTimeout(3000)
    await this.cancelButton.click({ timeout: 60000 })
  }

   async addRemoveBCAProduct() {
    await this.accountName.nth(1).click({ timeout: 60000 })
    await this.editProfileLink.click({ timeout: 60000 })
    await this.accountInfoText.click({ timeout: 60000 })
    await this.productsAndPaymentLink.click({ timeout: 60000 })
    if(this.BCAssessmentAccess.isVisible({ timeout: 60000 })) {
      await this.BCAssessment.click({ timeout: 60000 })
       await this.page.waitForTimeout(3000)
      await this.removeProduct.click({ timeout: 60000 })
      await this.BCAssessment.click({ timeout: 60000 })
      await this.page.waitForTimeout(3000)
      await this.closeButton.click({ timeout: 60000 })
      await this.page.waitForTimeout(3000)
      await expect(this.BCAssessmentAccess).toBeVisible({ timeout: 60000 })

    } else
    {
      await this.BCAssessment.click({ timeout: 60000 })
      await this.page.waitForTimeout(3000)
      await this.closeButton.click({ timeout: 60000 })
      await this.page.waitForTimeout(3000)
      await expect(this.BCAssessmentAccess).toBeVisible({ timeout: 60000 })
    }
  }

  async noReviewTaskForBCAProduct(accountName) {
    await this.pendingReviewTab.click({timeout: 10000})
    await this.dateSubmitted.fill(new Date().toISOString().split('T')[0], {timeout: 10000})
    await this.nameFilter.fill(accountName, {timeout: 10000})
    await expect(this.noActiveAccountsText).toBeVisible({timeout: 10000})
  }
}