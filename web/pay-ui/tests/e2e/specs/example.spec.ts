import { test, expect } from '@playwright/test'

test.describe('Example', () => {
  test('should show mock account name', async ({ page }) => {
    await page.goto('./protected')
    await expect(page.getByText('Hello Playwright')).toBeVisible()
  })
})
