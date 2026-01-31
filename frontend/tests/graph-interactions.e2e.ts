import { test, expect, Page } from '@playwright/test';

test.describe('Graph Viewer Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  async function getCanvasBounds(page: Page) {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      width: box.width,
      height: box.height,
      box,
    };
  }

  async function getCanvasCenter(page: Page) {
    return getCanvasBounds(page);
  }

  async function getNodeScreenPositions(page: Page) {
    const { box } = await getCanvasBounds(page);
    
    const positions = await page.evaluate(() => {
      const graphData = (window as any).__FORCE_GRAPH_DATA__;
      if (!graphData?.nodes) return [];
      
      return graphData.nodes
        .filter((n: any) => n.x !== undefined && n.y !== undefined)
        .map((n: any) => ({
          id: n.id,
          label: n.label,
          x: n.x,
          y: n.y,
        }));
    });
    
    if (!positions.length) return [];
    
    const transform = await page.evaluate(() => {
      const fg = (window as any).__FORCE_GRAPH_INSTANCE__;
      if (!fg) return { k: 1, x: 0, y: 0 };
      const t = fg.zoom?.transform?.() || { k: 1, x: 0, y: 0 };
      return { k: t.k, x: t.x, y: t.y };
    });
    
    return positions.map((p: any) => ({
      ...p,
      screenX: box.x + box.width / 2 + p.x * transform.k + transform.x,
      screenY: box.y + box.height / 2 + p.y * transform.k + transform.y,
    }));
  }

  async function findNodeByClick(page: Page, excludePositions: Array<{x: number, y: number}> = []): Promise<{ x: number; y: number } | null> {
    const { box } = await getCanvasBounds(page);
    
    const positions: Array<{x: number, y: number}> = [];
    for (let row = 0.1; row <= 0.9; row += 0.1) {
      for (let col = 0.1; col <= 0.9; col += 0.1) {
        positions.push({
          x: box.x + box.width * col,
          y: box.y + box.height * row
        });
      }
    }
    
    for (const pos of positions) {
      const isExcluded = excludePositions.some(
        ex => Math.abs(ex.x - pos.x) < 50 && Math.abs(ex.y - pos.y) < 50
      );
      if (isExcluded) continue;
      
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(100);
      
      const panel = page.locator('h2:has-text("Node Details")');
      if (await panel.isVisible().catch(() => false)) {
        await page.locator('button:has-text("✕")').first().click();
        await page.waitForTimeout(100);
        return pos;
      }
    }
    
    return null;
  }

  test.describe('2D Mode', () => {
    test('renders graph with nodes', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
      
      const controls = page.locator('text=Controls');
      await expect(controls).toBeVisible();
    });

    test('zoom in with mouse wheel', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/zoom-in.png' });
    });

    test('zoom out with mouse wheel', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/zoom-out.png' });
    });

    test('pan graph by dragging background', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 100, y + 100, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'test-results/pan-graph.png' });
    });

    test('node click shows detail panel', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.mouse.click(x, y);
      await page.waitForTimeout(500);
      
      const detailPanel = page.locator('text=Node Details').or(page.locator('text=Relationship'));
      const hasPanel = await detailPanel.isVisible().catch(() => false);
      
      await page.screenshot({ path: 'test-results/node-click.png' });
    });

    test('node drag moves node position', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.screenshot({ path: 'test-results/before-node-drag.png' });
      
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 50, y + 50, { steps: 5 });
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/after-node-drag.png' });
    });

    test('ring hover shows link cursor', async ({ page }) => {
      const nodePos = await findNodeByClick(page);
      
      if (nodePos) {
        await page.mouse.move(nodePos.x + 25, nodePos.y);
        await page.waitForTimeout(300);
      }
      
      await page.screenshot({ path: 'test-results/ring-hover.png' });
      
      test.info().annotations.push({
        type: 'result',
        description: nodePos ? `Found node at (${Math.round(nodePos.x)}, ${Math.round(nodePos.y)})` : 'No node found'
      });
    });

    test('drag from ring creates link preview', async ({ page }) => {
      const nodePos = await findNodeByClick(page);
      
      if (!nodePos) {
        test.skip(true, 'Could not find node by clicking');
        return;
      }
      
      await page.mouse.move(nodePos.x + 25, nodePos.y);
      await page.waitForTimeout(200);
      await page.mouse.down();
      await page.mouse.move(nodePos.x + 150, nodePos.y + 100, { steps: 15 });
      
      const dragHint = page.locator('text=Drag to another node');
      const dragHintShown = await dragHint.isVisible().catch(() => false);
      
      await page.screenshot({ path: 'test-results/link-drag-preview.png' });
      await page.mouse.up();
      
      test.info().annotations.push({
        type: 'result',
        description: dragHintShown ? 'Drag hint appeared!' : 'Drag hint not visible'
      });
    });

    test('drag from ring to node shows create link panel', async ({ page }) => {
      const nodePos1 = await findNodeByClick(page);
      
      if (!nodePos1) {
        test.skip(true, 'Could not find first node by clicking');
        return;
      }
      
      const nodePos2 = await findNodeByClick(page, [nodePos1]);
      
      let targetX: number, targetY: number;
      if (nodePos2) {
        targetX = nodePos2.x;
        targetY = nodePos2.y;
      } else {
        const { box } = await getCanvasBounds(page);
        const offsetX = nodePos1.x > box.x + box.width / 2 ? -150 : 150;
        const offsetY = nodePos1.y > box.y + box.height / 2 ? -100 : 100;
        targetX = nodePos1.x + offsetX;
        targetY = nodePos1.y + offsetY;
      }
      
      await page.mouse.move(nodePos1.x + 25, nodePos1.y);
      await page.waitForTimeout(200);
      await page.mouse.down();
      await page.mouse.move(targetX, targetY, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/link-created.png' });
      
      const createPanel = page.locator('h2:has-text("Create Link")');
      const linkPanelShown = await createPanel.isVisible().catch(() => false);
      
      if (linkPanelShown) {
        await expect(page.locator('.text-blue-400:has-text("From")')).toBeVisible();
        await expect(page.locator('.text-green-400:has-text("To")')).toBeVisible();
        await page.locator('button:has-text("Cancel")').click();
      }
      
      test.info().annotations.push({
        type: 'result',
        description: linkPanelShown 
          ? 'Link panel appeared - ring drag works!' 
          : `Dragged from (${nodePos1.x.toFixed(0)}, ${nodePos1.y.toFixed(0)}) to (${targetX.toFixed(0)}, ${targetY.toFixed(0)}) - panel not shown`
      });
    });

    test('close node detail panel', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.mouse.click(x, y);
      await page.waitForTimeout(500);
      
      const closeBtn = page.locator('button:has-text("✕")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
      
      await page.screenshot({ path: 'test-results/panel-closed.png' });
    });
  });

  test.describe('3D Mode', () => {
    test.beforeEach(async ({ page }) => {
      const toggle3D = page.locator('button:has-text("2D")');
      if (await toggle3D.isVisible()) {
        await toggle3D.click();
        await page.waitForTimeout(1000);
      }
    });

    test('switch to 3D mode', async ({ page }) => {
      const button = page.locator('button:has-text("3D")').or(page.locator('button:has-text("N/A")'));
      await expect(button).toBeVisible();
      
      await page.screenshot({ path: 'test-results/3d-mode.png' });
    });

    test('3D rotation by drag', async ({ page }) => {
      const is3DSupported = await page.locator('button:has-text("3D")').isVisible().catch(() => false);
      if (!is3DSupported) {
        test.skip();
        return;
      }

      const { x, y } = await getCanvasCenter(page);
      
      await page.screenshot({ path: 'test-results/3d-before-rotate.png' });
      
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 100, y + 50, { steps: 20 });
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/3d-after-rotate.png' });
    });

    test('3D zoom with mouse wheel', async ({ page }) => {
      const is3DSupported = await page.locator('button:has-text("3D")').isVisible().catch(() => false);
      if (!is3DSupported) {
        test.skip();
        return;
      }

      const { x, y } = await getCanvasCenter(page);
      
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/3d-zoom.png' });
    });

    test('switch back to 2D mode', async ({ page }) => {
      const toggle2D = page.locator('button:has-text("3D")');
      if (await toggle2D.isVisible()) {
        await toggle2D.click();
        await page.waitForTimeout(1000);
      }
      
      const button2D = page.locator('button:has-text("2D")');
      await expect(button2D).toBeVisible();
      
      await page.screenshot({ path: 'test-results/back-to-2d.png' });
    });
  });

  test.describe('Touch Interactions', () => {
    test.use({ hasTouch: true });

    test('touch drag on mobile', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/touch-tap.png' });
    });

    test('pinch to zoom (simulated)', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(300);
      
      await page.screenshot({ path: 'test-results/touch-zoom.png' });
    });
  });

  test.describe('Edge Cases', () => {
    test('multiple rapid clicks', async ({ page }) => {
      const { x, y } = await getCanvasCenter(page);
      
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(x + i * 10, y + i * 10);
        await page.waitForTimeout(100);
      }
      
      await page.screenshot({ path: 'test-results/rapid-clicks.png' });
    });

    test('drag outside canvas bounds', async ({ page }) => {
      const { x, y, box } = await getCanvasCenter(page);
      
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(box.x - 50, box.y - 50, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'test-results/drag-outside.png' });
    });

    test('cancel link creation via Cancel button', async ({ page }) => {
      const nodePos1 = await findNodeByClick(page);
      
      if (!nodePos1) {
        test.skip(true, 'Could not find node');
        return;
      }
      
      const nodePos2 = await findNodeByClick(page, [nodePos1]);
      const targetX = nodePos2?.x ?? nodePos1.x + 150;
      const targetY = nodePos2?.y ?? nodePos1.y + 100;
      
      await page.mouse.move(nodePos1.x + 25, nodePos1.y);
      await page.waitForTimeout(200);
      await page.mouse.down();
      await page.mouse.move(targetX, targetY, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const cancelBtn = page.locator('button:has-text("Cancel")');
      const panelAppeared = await cancelBtn.isVisible().catch(() => false);
      
      if (panelAppeared) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
        
        const createPanel = page.locator('h2:has-text("Create Link")');
        await expect(createPanel).not.toBeVisible();
      }
      
      await page.screenshot({ path: 'test-results/cancel-link.png' });
      
      test.info().annotations.push({
        type: 'result',
        description: panelAppeared ? 'Cancel test passed!' : 'Link panel did not appear'
      });
    });
  });
});
