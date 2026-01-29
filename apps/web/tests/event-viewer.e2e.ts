import { test, expect } from '@playwright/test';

test('event viewer shows cdc events', async ({ page }) => {
  await page.goto('/events');
  
  const eventList = page.locator('[data-testid="event-list"]');
  await expect(eventList).toBeVisible();
  
  const events = page.locator('[data-testid="event-item"]');
  await expect(events.first()).toBeVisible();
  
  const consoleLink = page.locator('a[href*="8080"]');
  await expect(consoleLink).toBeVisible();
  
  await page.screenshot({ path: '.sisyphus/evidence/task-12-event-viewer.png' });
});
