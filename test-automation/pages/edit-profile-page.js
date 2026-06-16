/**
 * ============================================================================
 * Edit Profile Page - Page Object Model
 * ============================================================================
 *
 * File: pages/edit-profile-page.js
 * Purpose: Encapsulates Edit Profile page interactions and selectors
 * author: Anish Batra
 * Created: June 16, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Edit Profile page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */

import { expect } from '@playwright/test'

export class EditProfilePage {
  constructor(page) {
    this.page = page
    this.accountName = page.locator('[class="v-btn__content"]')
    this.editProfileLink = page.getByText('Edit Profile')
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.saveButton = page.getByRole('button', { name: 'Save' })
  }

  async editProfile() {
    await this.accountName.nth(1).click({timeout: 60000})
    await this.editProfileLink.click({timeout: 60000})
    await expect(this.page).toHaveURL(/\/userprofile/, { timeout: 60000 })
    await expect(this.cancelButton).toBeVisible({ timeout: 60000 })
    await this.cancelButton.click({timeout: 60000})
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 60000 })
  }

}