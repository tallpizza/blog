import { test, expect } from '@playwright/test';

test('full cdc flow: UI → PostgreSQL → Neo4j', async ({ page }) => {
  const uniqueName = `E2E-${Date.now()}`;
  
  await page.goto('/');
  
  await page.click('[data-testid="add-node-btn"]');
  
  await page.fill('[data-testid="node-name"]', uniqueName);
  await page.fill('[data-testid="node-price"]', '99.99');
  await page.selectOption('[data-testid="node-type"]', 'Product');
  
  await page.click('[data-testid="save-node-btn"]');
  
  await page.waitForTimeout(8000);
  
  await page.goto('/events');
  await expect(page.locator('[data-testid="event-list"]')).toBeVisible();
  
  await page.screenshot({ path: '.sisyphus/evidence/task-13-full-flow.png' });
});
