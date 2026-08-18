/**
 * ============================================================================
 * Edit Profile Page - Page Object Model
 * ============================================================================
 *
 * File: pages/routing-slips-page.js
 * Purpose: Encapsulates Routing Slips page interactions and selectors
 * author: Anish Batra
 * Created: August 18, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Routing Slips page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
 */

import { expect } from '@playwright/test'

export class RoutingSlipsPage {
  constructor(page) {
    this.page = page
    this.manageRoutingSlipsLink = page.getByText('Manage Routing Slips')
    this.openRSButton = page.getByText('Open')
    this.editStatusButton = page.getByText('Edit Status')
    this.refundRequestLink = page.getByText('Refund request')
    this.doneButton = page.getByText('Done')
    this.ReviewRefundRequest = page.getByText('Review refund request')
    this.authorizeRefundButton = page.getByText('Authorize Refund')
    this.cancelButton = page.getByText('Cancel')
    
  }

  async createRefundRequestForRoutingSlip() {
    await this.manageRoutingSlipsLink.click({timeout: 60000})
    await expect(this.page).toHaveURL('https://test.pay.bcregistry.gov.bc.ca/home', { timeout: 60000 })
    await this.openRSButton.click({timeout: 60000})
    await this.editStatusButton.click({timeout: 60000})
    await this.refundRequestLink.click({timeout: 60000})
    await expect(this.page).toHaveURL('https://test.pay.bcregistry.gov.bc.ca/home', { timeout: 60000 })
    await this.doneButton.click({timeout: 60000})
  }

  async validateRoutingSlipRefundRequest() {
    await this.manageRoutingSlipsLink.click({timeout: 60000})
    await expect(this.page).toHaveURL('https://test.pay.bcregistry.gov.bc.ca/home', { timeout: 60000 })
    await this.openRSButton.click({timeout: 60000})
    await this.editStatusButton.click({timeout: 60000})
    await this.ReviewRefundRequest.click({timeout: 60000})
    await expect(this.authorizeRefundButton).toBeVisible({ timeout: 60000 })
    await this.cancelButton.click({timeout: 60000})
  }
}

  
