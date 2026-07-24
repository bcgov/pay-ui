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
    this.editRecord = page.locator('[title="Edit Record"]')
    this.distributionCode = page.getByText('Distribution Code')
    this.distributionCodeName = page.locator('[id="name"]')
    this.distributionClientCode = page.locator('[id="client"]')
    this.description = page.locator('[id="description"]')
    this.comments = page.locator('[id="comments"]')
    this.saveButton = page.locator('[class="btn btn-primary"]')
    this.feeSchedule = page.getByText('Fee Schedule')
    this.feeCodeLink = page.getByRole('link', { name: 'Fee Code' })
    this.createLink = page.getByRole('link', { name: 'Create' })
    this.variableFeeFlag = page.getByText('Variable Fee Flag')
    this.showOnPriceListFlag = page.getByText('Show on Price List')
    this.gstAddedToStatutoryFeesFlag = page.getByText('GST Added to Statutory Fees')
    this.gstAddedToServicesFeesFlag = page.getByText('GST Added to Services Fees')
    this.corpTypeLink = page.getByRole('link', { name: 'Corp Type' })
    this.successMessage = page.getByText('Record was successfully created.')
    this.fillingTypeLink = page.getByRole('link', { name: 'Filing Type' })


  }

  async createFeeCode() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.feeCodeLink.click({timeout: 10000})
    await this.code.fill('220')
    await this.ammount.fill('100')
    await expect(this.comments).toBeVisible({ timeout: 10000 })
    await this.comments.fill('Test comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
  }

   async editFeeCodeAndSave() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.feeCodeLink.click({timeout: 10000})
    await this.editRecord.first().click({timeout: 10000})
    await this.ammount.clear({timeout: 10000})
    await this.ammount.fill('190', {timeout: 10000})
    await this.comments.clear({timeout: 10000})
    await this.comments.fill('edited fee code record', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

   async validateFeeSchedule() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.feeSchedule.click({timeout: 10000})
    await this.createLink.click({timeout: 10000})
    await this.variableFeeFlag.click({timeout: 10000})
    await this.showOnPriceListFlag.click({timeout: 10000})
    await this.gstAddedToStatutoryFeesFlag.click({timeout: 10000})
    await this.gstAddedToServicesFeesFlag.click({timeout: 10000})
  }

   async createCorpType() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.corpTypeLink.click({timeout: 10000})
    await this.createLink.click({timeout: 10000})
    await this.code.fill('220')
    await this.description.fill('anish test automation', {timeout: 10000})
    await this.comments.fill('anish test automation comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

  async createDistributionCode() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.distributionCode.click({timeout: 10000})
    await this.createLink.click({timeout: 10000})
    await this.distributionCodeName.fill('anish test automation', {timeout: 10000})
    await this.distributionClientCode.fill('220', {timeout: 10000})
    await this.comments.fill('anish test automation comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

  

  async createAndSaveFillingType() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.fillingTypeLink.click({timeout: 10000})
    await this.createLink.click({timeout: 10000})
    await this.code.fill('390')
    await this.description.fill('anish test automation', {timeout: 10000})
    await this.comments.fill('anish test automation comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

  async editFillingTypeAndSave() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.fillingTypeLink.click({timeout: 10000})
    await this.editRecord.first().click({timeout: 10000})
    await this.description.clear({timeout: 10000})
    await this.description.fill('automation edited filling type record', {timeout: 10000})
    await this.comments.clear({timeout: 10000})
    await this.comments.fill('automation edited filling type record comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

   async editDistributionCodeAndSave() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.distributionCode.click({timeout: 10000})
    await this.editRecord.first().click({timeout: 10000})
    await this.distributionCodeName.clear({timeout: 10000})
    await this.distributionClientCode.fill('220_anish_automation', {timeout: 10000})
    await this.comments.clear({timeout: 10000})
    await this.comments.fill('automation edited distribution code record comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

   async editFeeScheduleAndSave() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.feeSchedule.click({timeout: 10000})
    await this.editRecord.first().click({timeout: 10000})
    await this.comments.clear({timeout: 10000})
    await this.comments.fill('automation edited fee schedule record comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

  async editCorpTypeAndSave() {
    await this.page.goto(process.env.PAYADMINURL)
    await this.corpTypeLink.click({timeout: 10000})
    await this.editRecord.first().click({timeout: 10000})
    await this.description.clear({timeout: 10000})
    await this.description.fill('automation edited corp type record', {timeout: 10000})
    await this.comments.clear({timeout: 10000})
    await this.comments.fill('automation edited corp type record comments', {timeout: 10000})
    await this.saveButton.click({timeout: 10000})
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }
}