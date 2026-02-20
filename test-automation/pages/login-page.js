/**
 * ============================================================================
 * Login Page - Page Object Model
 * ============================================================================
 *
 * File: pages/login-page.js
 * Purpose: Encapsulates login interactions for both BCSC and IDIR methods
 * author: Anish Batra
 * Created: February 16, 2026
 *
 * Description:
 *   This page object provides methods for authenticating with two login methods:
 *   1. BCSC (BC Service Card): loginwithbcsc()
 *   2. IDIR (Government of BC Internal ID): loginwithidir()
 * ============================================================================
 */

export class LoginPage {
  constructor(page) {
    this.page = page
    this.bcServiceCard = page.locator('[id="social-bcsc"]')
    this.lgoinWithIDIR = page.locator('#social-idir')
    this.usernamePasswordButton = page.locator('[id="tile_btn_test_with_username_password_device_div_id"]')
    this.usernameInput = page.locator('#username')
    this.passwordInput = page.locator('#password')
    this.idirUsernameInput = page.locator('#user')
    this.idirPasswordInput = page.locator('#password')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
    this.termsOfUseCheckbox = page.getByText('I agree to the BC Login')
  }

  async loginWithBCSC(username, password) {
    await this.bcServiceCard.click()
    await this.usernamePasswordButton.click()
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.continueButton.click()
    await this.termsOfUseCheckbox.check()
    await this.continueButton.click()
  }

  async loginWithIDIR(username, password) {
    await this.lgoinWithIDIR.click()
    await this.idirUsernameInput.fill(username)
    await this.idirPasswordInput.fill(password)
    await this.continueButton.click()
  }
}