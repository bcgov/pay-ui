/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/govm-account-creation-page.js
 * Purpose: Encapsulates Government Account Creation page interactions and selectors
 * author: Anish Batra
 * Created: March 23, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Government Account Creation page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */
import { expect } from '@playwright/test'
export class GovmAccountCreationPage {
  constructor(page) {
    this.page = page
    this.createAccountButton = page.getByText('Create Account')
    this.govmRadioButton = page.getByText('BC Provincial Government Ministry/Employee')
    this.continueButton = page.getByText('Continue')
    this.ministryName = page.locator('[data-test="input-ministry-name"]')
    this.email = page.locator('[data-test="input-email-address"]')
    this.confirmEmail = page.locator('[data-test="input-confirm-email-address"]')
    this.sendInviteButton = page.locator('[data-test="save-button"]')
    this.successMessage = page.getByText(' Invitation has been successfully sent ')
  }

  async govmAccountCreation() {
    await this.createAccountButton.click({timeout: 180000})
    await this.govmRadioButton.click({timeout: 10000})
    await this.continueButton.click({timeout: 10000})
    await this.ministryName.fill('Anish-govm-test')
    await this.email.fill('anish-test@gmail.com')
    await this.confirmEmail.fill('anish-test@gmail.com')
    await this.sendInviteButton.click({timeout: 10000})
    await this.page.waitForTimeout(5000)
    expect(this.successMessage).toBeVisible({timeout: 180000})
  }
}