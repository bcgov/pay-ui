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
    this.readMoreButtonBCA = page.locator('[data-test="span-readmore-BCA"]')
    this.reportsAvailableText = page.getByText('Three reports are available for purchase:')
    this.bcaExpandedReports = page.locator('[data-test="div-expanded-product-BCA"]');
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

  async validateBCAReports(){
    await this.accountName.nth(1).click({ timeout: 60000 })
    await this.editProfileLink.click({ timeout: 60000 })
    await this.accountInfoText.click({ timeout: 60000 })
    await this.productsAndPaymentLink.click({ timeout: 60000 })
    await expect(this.BCAssessment).toBeVisible({ timeout: 60000 })
    await expect(this.supportedPaymentMethods).toBeVisible({ timeout: 60000 })
    await this.readMoreButtonBCA.click({ timeout: 60000 })
    await this.page.waitForTimeout(3000)
    const reports = await this.bcaExpandedReports.locator('ul li').allTextContents();
    // Assert all 3 are present
    expect(reports).toContain('Owner Location Report');
    expect(reports).toContain('Assessment Roll Report');
    expect(reports).toContain('Assessment Inventory Report');
}
}