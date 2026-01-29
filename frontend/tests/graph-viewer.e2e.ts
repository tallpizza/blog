import { test, expect } from '@playwright/test';

test('graph renders nodes and relationships', async ({ page }) => {
  await page.goto('/');
  
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
  
  await page.screenshot({ path: '.sisyphus/evidence/task-9-graph-render.png' });
});
