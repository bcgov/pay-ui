/**
 * ============================================================================
 * Account Info Page - Page Object Model
 * ============================================================================
 *
 * File: pages/refund-request-page.js
 * Purpose: Encapsulates Refund Request and Approve page interactions and selectors
 * author: Anish Batra
 * Created: March 23, 2026
 *
 * Description:
 *   This page object provides methods and locators for the Refund Request and Approve page.
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


    // this.viewMoreLink = page.getByText('View More')
    // this.nextButton = page.getByText('Next')
    // this.downLoadAffidavitButton = page.getByText(' Next: Download Affidavit ')
    // this.registerANewBceidButton = page.getByText(' Register a new BCeID ')
    // this.surName = page.locator('[data-np-autofill-field-type="lastName"]')
    // this.firstName = page.locator('[data-np-autofill-field-type="firstName"]')
    // this.email = page.locator('[id="contactEmailTextBox"]')
    // this.userID = page.locator('[name="otherTextBox"]')
    // this.password = page.locator('[id="passwordControl_password"]')
    // this.passwordConfirmation = page.locator('[id="passwordControl_passwordConfirmation"]')
    // this.answerOne = page.locator('[name="questionsAnswersControl$answerToQuestionTxtBox"]')
    // this.answerTwo = page.locator('[name="[name="questionsAnswersControl$answerToPersonTxtBox"]')
  }

  async govmAccountCreation() {
    //await this.page.goto('https://test.bcregistry.gov.bc.ca/en-CA/dashboard')
    await this.createAccountButton.click({timeout: 180000})
    await this.govmRadioButton.click({timeout: 10000})
    await this.continueButton.click({timeout: 10000})
    await this.ministryName.fill('Anish-govm-test')
    await this.email.fill('anish-test@gmail.com')
    await this.confirmEmail.fill('anish-test@gmail.com')
    await this.sendInviteButton.click({timeout: 10000})
    await this.page.waitForTimeout(5000)
    expect(this.successMessage).toBeVisible({timeout: 180000})


    // await this.viewMoreLink.first().click({timeout: 10000})
    // await this.nextButton.click({timeout: 10000})
    // await this.downLoadAffidavitButton.click({timeout: 10000})
    // await this.registerANewBceidButton.click({timeout: 10000})
    // await this.surName.fill('anish-Test')
    // await this.firstName.fill('batra-Test')
    // await this.email.fill('anish.b@gmail.com')
    // await this.userID.fill('anish.batra-Test')
    // await this.password.fill('Test@12345678')
    // await this.passwordConfirmation.fill('Test@12345678')
    // eslint-disable-next-line max-len
    // await this.page.selectOption('select[name="questionsAnswersControl$questionDropDownList"]', { value: 'What is your least favourite food?' })
    // await this.answerOne.fill('pizza')
    // eslint-disable-next-line max-len
    // await this.page.selectOption('select[name="questionsAnswersControl$questionDropDownList"]', { value: 'What is your favourite food?' })
    // await this.answerTwo.fill('roti')


  }
}