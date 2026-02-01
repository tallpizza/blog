import { test, expect } from '@playwright/test';

test('create node via UI', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 10000 });
  
  await page.click('[data-testid="add-node-btn"]');
  await page.waitForSelector('[data-testid="node-detail-panel"]', { timeout: 5000 });
  
  await expect(page.locator('[data-testid="node-detail-panel"]')).toBeVisible();
  await page.screenshot({ path: '.sisyphus/evidence/task-10-node-create.png' });
});
