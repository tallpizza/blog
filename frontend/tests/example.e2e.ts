import { test, expect } from '@playwright/test'

test('should navigate to home page and verify title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Create Next App/)
})

test('should have main content on home page', async ({ page }) => {
  await page.goto('/')
  const heading = page.locator('h1')
  await expect(heading).toBeVisible()
})
