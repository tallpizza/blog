import { test, expect } from '@playwright/test';

test('create node via UI', async ({ page }) => {
  await page.goto('/');
  
  await page.click('[data-testid="add-node-btn"]');
  
  await page.fill('[data-testid="node-name"]', 'E2E Test Product');
  await page.fill('[data-testid="node-price"]', '123.45');
  await page.selectOption('[data-testid="node-type"]', 'Product');
  
  await page.click('[data-testid="save-node-btn"]');
  
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '.sisyphus/evidence/task-10-node-create.png' });
});
