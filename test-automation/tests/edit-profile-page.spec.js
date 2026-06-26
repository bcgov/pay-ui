/**
 * ============================================================================
 * Edit  Page Tests
 * ============================================================================
 *
 * File: tests/edit-profile-page.spec.js
 * Purpose: End-to-end regression tests for Edit Profile page
 * Created: June 17, 2026
 * author: Anish Batra
 * Tagged: @regression (runs in npm run e2e:regression:test)
 *
 * Description:
 *   This test suite validates the Edit Profile page functionality including:
 *   - Page navigation and URL verification
 *   - Element visibility (deactivate button)
 * ============================================================================
 */

import { test } from '../fixtures.js'

test.describe('Edit Profile Page Tests', () => {

  //use login type as bcsc to run this test
  test('should display edit profile page correctly', async ({ page, editProfilePage }) => {
    console.log('Test: Current URL before navigation:', page.url())
    console.log('Test: Cookies loaded:', (await page.context().cookies()).length)
    await page.goto(process.env.BASE_URL,{timeout: 180000})
    await editProfilePage.editProfile()
  })
})