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
    this.description = page.locator('[id="description"]')
    this.comments = page.locator('[id="comments"]')
    this.saveButton = page.locator('[class="btn btn-primary"]')
    this.feeSchedule = page.getByText('Fee Schedule')
    this.createLink = page.getByRole('link', { name: 'Create' })
    this.variableFeeFlag = page.getByText('Variable Fee Flag')
    this.showOnPriceListFlag = page.getByText('Show on Price List')
    this.gstAddedToStatutoryFeesFlag = page.getByText('GST Added to Statutory Fees')
    this.gstAddedToServicesFeesFlag = page.getByText('GST Added to Services Fees')
    this.corpTypeLink = page.getByRole('link', { name: 'Corp Type' })
    this.successMessage = page.getByText('Record was successfully created.')


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

   async validateFeeSchedule() {
    //TODO- will update later to use env variable for url
    await this.page.goto(process.env.FEECODEURL)
    await this.feeSchedule.click({timeout: 10000})
    await this.createLink.click({timeout: 10000})
    await this.variableFeeFlag.click({timeout: 10000})
    await this.showOnPriceListFlag.click({timeout: 10000})
    await this.gstAddedToStatutoryFeesFlag.click({timeout: 10000})
    await this.gstAddedToServicesFeesFlag.click({timeout: 10000})
  }

   async createCorpType() {
    //TODO- will update later to use env variable for url
    await this.page.goto(process.env.FEECODEURL)
    await this.corpTypeLink.click({timeout: 10000})
    await this.createLink.click({timeout: 10000})
    await this.code.fill('220')
    await this.description.fill('anish test automation', {timeout: 10000})
    await this.comments.fill('anish test automation comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }
}