/**
 * ============================================================================
 * Bcros Account Creation Page - Page Object Model
 * ============================================================================
 *
 * File: pages/bcros-account-creation-page.js
 * Purpose: Encapsulates Bcros Account Creation page interactions and selectors
 * author: Anish Batra
 * Created: April 23, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Bcros Account Creation page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */
import { expect } from '@playwright/test'
export class BcrosAccountCreationPage {
  constructor(page) {
    this.page = page
    this.accountName = page.getByText('JyotiKumar')
    this.createAccountButton = page.getByText('Create Account')
    this.createAnotherAccountButton = page.getByText(' Create Another Account ')
    this.individualAccount = page.locator('[data-test="radio-individual-account-type"]')
    this.accountNameInput = page.locator('[data-test="input-org-name"]')
    this.businessType = page.getByText('Business Type')
    this.bank = page.getByText('BANK')
    this.smallBusiness = page.getByText('11-20 Employees')
    this.businessSize = page.getByText('Business Size')
    this.streetAddressInput = page.locator('[id="street-address-1"]')
    this.firstAddressOption = page.getByText('1st-290 Dupuis St')
    this.nextButton = page.getByText('Next')
    this.businessRegistryProductSelection = page.getByText(' Business Registry & Name Request ')
    this.creditCardPaymentOption = page.locator('//h3[contains(text(), "Credit Card")]')
    // eslint-disable-next-line max-len
    this.successMessage = page.getByText('Your BC Registries and Online Services account has successfully been created.')
  }

  async bcrosAccountCreation(accountType) {
    await this.accountName.click({timeout: 60000})
    await this.page.waitForTimeout(1000) // Wait for dropdown to appear
    await this.createAccountButton.click({timeout: 180000})
    await this.createAnotherAccountButton.last().click({timeout: 180000})
    await this.page.waitForTimeout(10000)
    await this.page.waitForLoadState('domcontentloaded')
    await this.page.waitForLoadState('load')
    if(accountType === 'individual')
    {
    // eslint-disable-next-line max-len
      await this.page.locator('[class="v-label theme--light"]', { hasText: 'Individual Person' }).click({force:true, timeout: 180000})
      await this.page.waitForTimeout(1000)
    }
    await this.accountNameInput.fill('Anish-bcros-automation-test')
    if(accountType === 'business') {
      await this.businessType.click({timeout: 10000})
      await this.bank.click({timeout: 10000})
      await this.businessSize.click({timeout: 10000})
      await this.smallBusiness.click({timeout: 10000})
    }
    await this.streetAddressInput.fill('1 street')
    await this.page.waitForTimeout(1000)
    await this.page.keyboard.press('Space')
    await this.page.waitForTimeout(2000)
    await this.firstAddressOption.click({timeout: 10000})
    await this.page.waitForTimeout(2000)
    await this.accountNameInput.clear()
    await this.page.waitForTimeout(1000)
    await this.accountNameInput.pressSequentially('Anish-bcros-automation-testing')
    await this.nextButton.click({timeout: 180000})
    await this.page.waitForTimeout(1000)
    await this.nextButton.click({timeout: 10000})
    await this.page.waitForTimeout(1000)
    await this.businessRegistryProductSelection.click({timeout: 10000})
    await this.creditCardPaymentOption.click({timeout: 10000})
    await this.createAccountButton.click({timeout: 180000})
    await expect(this.successMessage).toBeVisible({timeout: 280000})
  }
}