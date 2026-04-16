/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/account-info-page.js
 * Purpose: Encapsulates Account Info page interactions and selectors
 * author: Anish Batra
 * Created: February 16, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Account Info page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */

import { expect } from '@playwright/test'

export class AccountInfoPage {
  constructor(page) {
    this.page = page
    this.accountName = page.locator('[class="v-btn__content"]')
    this.accountInfoText = page.getByText('Account Info')
    this.deactivateAccountButton = page.locator('[data-test="deactivate-btn"]')
    this.authenticationLink = page.getByText('Authentication')
    this.manageAccount = page.getByText(' MANAGE ACCOUNT ')
    this.teamMembersLink = page.getByText('Team Members')
    this.productsAndPaymentsLink = page.getByText('Products and Payment')
    this.accountActivity = page.getByText(' ACCOUNT ACTIVITY ')
    this.statementsLink = page.getByText('Statements')
    this.transactionsLink = page.getByText('Transactions')
    this.activityLogLink = page.getByText('Activity Log')
    this.advancedSettings = page.getByText(' ADVANCED SETTINGS ')
    this.developerAccessLink = page.getByText('Developer Access')
  }

  async accountInfo() {
    await this.accountName.nth(1).click({timeout: 60000})
    await this.page.waitForTimeout(1000) // Wait for dropdown to appear
    await this.accountInfoText.click({timeout: 60000})
    await this.page.waitForTimeout(4000)
    await expect(this.page).toHaveURL(/\/account-info/, { timeout: 60000 })
    await this.page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(this.deactivateAccountButton).toBeVisible({ timeout: 60000 })
    await expect(this.authenticationLink).toBeVisible({ timeout: 60000 })
    await expect(this.manageAccount.last()).toBeVisible({ timeout: 60000 })
    await expect(this.teamMembersLink.last()).toBeVisible({ timeout: 60000 })
    await expect(this.productsAndPaymentsLink).toBeVisible({ timeout: 60000 })
    await expect(this.accountActivity).toBeVisible({ timeout: 60000 })
    await expect(this.statementsLink).toBeVisible({ timeout: 60000 })
    await expect(this.transactionsLink.last()).toBeVisible({ timeout: 60000 })
    await expect(this.activityLogLink).toBeVisible({ timeout: 60000 })
    await expect(this.advancedSettings).toBeVisible({ timeout: 60000 })
    await expect(this.developerAccessLink).toBeVisible({ timeout: 60000 })
  }

}