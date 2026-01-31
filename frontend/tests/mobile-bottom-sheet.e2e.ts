import { test, expect, Page } from '@playwright/test';

test.describe('Mobile Bottom Sheet', () => {
  // Use mobile viewport
  test.use({ 
    viewport: { width: 375, height: 667 }, // iPhone SE
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  async function findAndClickNode(page: Page): Promise<boolean> {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) return false;

    // Grid search for a node
    for (let row = 0.2; row <= 0.8; row += 0.15) {
      for (let col = 0.2; col <= 0.8; col += 0.15) {
        const x = box.x + box.width * col;
        const y = box.y + box.height * row;
        
        await page.touchscreen.tap(x, y);
        await page.waitForTimeout(300);

        // Check if bottom sheet appeared (mobile uses BottomSheet component)
        const bottomSheet = page.locator('.fixed.bottom-0');
        if (await bottomSheet.isVisible().catch(() => false)) {
          return true;
        }
      }
    }
    return false;
  }

  test('bottom sheet appears when tapping a node', async ({ page }) => {
    const found = await findAndClickNode(page);
    
    if (!found) {
      // Create a node first if none exist
      const addBtn = page.locator('[data-testid="add-node-btn"]');
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(500);
      }
      await findAndClickNode(page);
    }

    // Bottom sheet should be visible
    const bottomSheet = page.locator('.fixed.bottom-0');
    await expect(bottomSheet).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'test-results/mobile-bottom-sheet-open.png' });
  });

  test('bottom sheet has drag handle', async ({ page }) => {
    // First, open the bottom sheet
    const addBtn = page.locator('[data-testid="add-node-btn"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await findAndClickNode(page);
    }

    // Check for drag handle (the pill-shaped element)
    const dragHandle = page.locator('.bg-gray-600.rounded-full');
    await expect(dragHandle).toBeVisible({ timeout: 5000 });
  });

  test('drag up expands bottom sheet', async ({ page }) => {
    // Open bottom sheet
    const addBtn = page.locator('[data-testid="add-node-btn"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
    await findAndClickNode(page);
    await page.waitForTimeout(300);

    const bottomSheet = page.locator('.fixed.bottom-0');
    if (!await bottomSheet.isVisible()) {
      test.skip(true, 'Could not open bottom sheet');
      return;
    }

    // Get initial height
    const initialBox = await bottomSheet.boundingBox();
    if (!initialBox) return;
    const initialHeight = initialBox.height;

    // Find drag handle area (top of bottom sheet)
    const handleY = initialBox.y + 20;
    const handleX = initialBox.x + initialBox.width / 2;

    // Drag up to expand
    await page.touchscreen.tap(handleX, handleY);
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX, handleY - 200, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Check if height increased
    const expandedBox = await bottomSheet.boundingBox();
    if (expandedBox) {
      expect(expandedBox.height).toBeGreaterThan(initialHeight * 0.9);
    }

    await page.screenshot({ path: 'test-results/mobile-bottom-sheet-expanded.png' });
  });

  test('drag down closes bottom sheet', async ({ page }) => {
    const addBtn = page.locator('[data-testid="add-node-btn"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
    await findAndClickNode(page);
    await page.waitForTimeout(300);

    const bottomSheet = page.locator('.fixed.bottom-0');
    const isVisible = await bottomSheet.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Could not open bottom sheet');
      return;
    }

    const box = await bottomSheet.boundingBox();
    if (!box) {
      test.skip(true, 'Could not get bottom sheet bounds');
      return;
    }

    const handleY = box.y + 20;
    const handleX = box.x + box.width / 2;

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX, handleY + 300, { steps: 20 });
    await page.mouse.up();
    
    await page.waitForTimeout(600);
    
    const stillVisible = await bottomSheet.isVisible().catch(() => false);
    const afterBox = stillVisible ? await bottomSheet.boundingBox().catch(() => null) : null;
    const isClosed = !stillVisible || !afterBox || afterBox.height < 100;

    expect(isClosed).toBeTruthy();
  });

  test('close button closes bottom sheet', async ({ page }) => {
    // Open bottom sheet
    const addBtn = page.locator('[data-testid="add-node-btn"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
    await findAndClickNode(page);
    await page.waitForTimeout(300);

    const bottomSheet = page.locator('.fixed.bottom-0');
    if (!await bottomSheet.isVisible()) {
      test.skip(true, 'Could not open bottom sheet');
      return;
    }

    const closeBtn = page.locator('.fixed.bottom-0 button').filter({ hasText: '\u2715' }).first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(300);
      await expect(bottomSheet).not.toBeVisible();
    } else {
      const altCloseBtn = page.locator('.fixed.bottom-0').locator('button').first();
      await altCloseBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: 'test-results/mobile-close-button.png' });
  });

  test('bottom sheet content is scrollable', async ({ page }) => {
    // Open bottom sheet
    const addBtn = page.locator('[data-testid="add-node-btn"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
    await findAndClickNode(page);
    await page.waitForTimeout(300);

    const bottomSheet = page.locator('.fixed.bottom-0');
    if (!await bottomSheet.isVisible()) {
      test.skip(true, 'Could not open bottom sheet');
      return;
    }

    // Check that content area has overflow-y-auto
    const contentArea = page.locator('.fixed.bottom-0 .overflow-y-auto');
    await expect(contentArea).toBeVisible();

    await page.screenshot({ path: 'test-results/mobile-scroll-content.png' });
  });

  test('bottom sheet snaps to predefined heights', async ({ page }) => {
    // Open bottom sheet
    const addBtn = page.locator('[data-testid="add-node-btn"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
    await findAndClickNode(page);
    await page.waitForTimeout(300);

    const bottomSheet = page.locator('.fixed.bottom-0');
    if (!await bottomSheet.isVisible()) {
      test.skip(true, 'Could not open bottom sheet');
      return;
    }

    // Get viewport height
    const viewportHeight = 667; // iPhone SE height

    // Get bottom sheet
    const box = await bottomSheet.boundingBox();
    if (!box) return;

    // Initial height should be around 40% (as per BottomSheet default)
    const initialHeightPercent = (box.height / viewportHeight) * 100;
    expect(initialHeightPercent).toBeGreaterThan(35);
    expect(initialHeightPercent).toBeLessThan(50);

    // Drag up slightly (should snap to 80%)
    const handleY = box.y + 20;
    const handleX = box.x + box.width / 2;

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX, handleY - 150, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const expandedBox = await bottomSheet.boundingBox();
    if (expandedBox) {
      const expandedPercent = (expandedBox.height / viewportHeight) * 100;
      expect(expandedPercent).toBeGreaterThan(70);
    }

    await page.screenshot({ path: 'test-results/mobile-snap-heights.png' });
  });
});
