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

import { expect } from "@playwright/test";

export class AccountInfoPage {
    constructor(page) {
        this.page = page;
        this.accountName = page.locator('[data-test="account-name"]');
        this.accountInfoText = page.getByText('Account Info');
        this.deactivateAccountButton = page.locator('[data-test="deactivate-btn"]');
    }

    async accountInfo() {
        await this.page.goto(process.env.BASE_URL || 'undefined');
        await this.accountName.click({timeout: 10000});
        await this.page.waitForTimeout(1000); // Wait for dropdown to appear    
        await this.accountInfoText.click({timeout: 10000});
         await this.page.waitForTimeout(4000);
        await expect(this.page).toHaveURL(/\/account-info/, { timeout: 10000 });
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        await expect(this.deactivateAccountButton).toBeVisible({ timeout: 60000 });
    }

}