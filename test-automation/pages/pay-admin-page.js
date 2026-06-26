/**
 * ============================================================================
 * Pay Admin Page - Page Object Model
 * ============================================================================
 *
 * File: pages/pay-admin-page.js
 * Purpose: Encapsulates Pay Admin page interactions and selectors
 * author: Anish Batra
 * Created: June 26, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Pay Admin page.
 *   It follows the Page Object Model (POM) pattern for maintainable test code.
 * ============================================================================
    */
export class PayAdminPage {
  constructor(page) {
    this.page = page
    this.ammount = page.locator('[id="amount"]')
    this.code = page.locator('[id="code"]')
    this.comments = page.locator('[id="comments"]')
    this.saveButton = page.locator('[class="btn btn-primary"]')
  }

  async createFeeCode() {
    //TODO- will update later to use env variable for url
    await this.page.goto(process.env.FEECODEURL)
    await this.code.fill('220')
    await this.ammount.fill('100')
    await expect(this.comments).toBeVisible({ timeout: 10000 })
    await this.comments.fill('Test comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
  }
}