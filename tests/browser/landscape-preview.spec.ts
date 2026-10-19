import { expect, test } from '@playwright/test';
test('angled landscape preview opens, orbits, visits landmarks and returns without changing the shot', async ({
   page,
}) => {
   test.setTimeout(180000);
   const errors: string[] = [];
   page.on('pageerror', (e) => errors.push(e.message));
   await page.addInitScript(() => {
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
         if (this.canvas.id === 'course')
            this.canvas.dataset.drawCount = String(Number(this.canvas.dataset.drawCount || 0) + 1);
         return clear.apply(this, args);
      };
   });
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await page.goto('/?profile3d=1#play');
   await expect(page.locator('#desktopPlay')).toBeVisible({ timeout: 30000 });
   const club = await page.locator('#selectedClubName').textContent();
   await page.keyboard.press('Escape');
   await page.locator('#openGameOptions').click();
   await page.locator('[data-option-tab=world]').click();
   await page.locator('#openLandscapePreview').click();
   const dialog = page.locator('#landscapePreview'),
      canvas = dialog.locator('canvas');
   await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
   await expect(dialog).toHaveAttribute('data-world-ready', 'true', { timeout: 60000 });
   expect(Number(await canvas.getAttribute('data-triangles'))).toBeGreaterThan(10000);
   const courseCanvas = page.locator('#course');
   const hiddenDraws = await courseCanvas.getAttribute('data-draw-count');
   await page.waitForTimeout(350);
   await expect(courseCanvas).toHaveAttribute('data-draw-count', hiddenDraws!);
   const idleFrames = await canvas.getAttribute('data-rendered-frames');
   await page.waitForTimeout(350);
   await expect(canvas).toHaveAttribute('data-rendered-frames', idleFrames!);
   await expect(canvas).toHaveAttribute('data-ball-shadow', 'true');
   await expect(canvas).toHaveAttribute('data-performance', /cpuDrawP95Ms/);
   const diagnostics = JSON.parse((await canvas.getAttribute('data-performance'))!);
   expect(diagnostics.samples).toBeGreaterThan(0);
   expect(diagnostics.samples).toBeLessThanOrEqual(120);
   await expect
      .poll(
         async () =>
            JSON.parse((await canvas.getAttribute('data-performance'))!).lastBackdropBuildMs,
      )
      .toBeGreaterThan(0);

   await page.screenshot({ path: 'test-results/landscape-preview-estate.png' });
   await expect(canvas).toHaveAttribute('data-ball-x', /^-?\d/);
   await expect(dialog.getByRole('button', { name: 'Follow ball', exact: true })).toBeDisabled();
   const ballX = await canvas.getAttribute('data-ball-x');
   await dialog.getByRole('button', { name: 'Current ball', exact: true }).click();
   await expect(dialog.locator('.preview-status')).toContainText('Live ball position');
   await expect(canvas).toHaveAttribute('data-ball-x', ballX!);

   await dialog.getByRole('button', { name: 'Woodland pavilion', exact: true }).click();
   await canvas.focus();
   await canvas.press('ArrowLeft');
   await canvas.press('+');
   await page.screenshot({ path: 'test-results/landscape-preview-pavilion.png' });
   const box = await canvas.boundingBox();
   await canvas.dblclick({ position: { x: box!.width * 0.52, y: box!.height * 0.55 } });
   await expect(canvas).toHaveAttribute('data-pick-x', /^-?\d/);
   await expect(dialog.locator('.preview-status')).toContainText('Your shot target is unchanged');

   await dialog.getByRole('button', { name: 'Whole estate', exact: true }).click();
   await canvas.focus();
   for (let i = 0; i < 12; i++) await canvas.press('Shift+ArrowRight');
   await expect(canvas).toHaveAttribute('data-region-x', /^\d{4,}$/, { timeout: 60000 });
   await expect(canvas).toHaveAttribute('data-streaming', 'false', { timeout: 60000 });
   await expect(canvas).toHaveAttribute('data-coverage', 'true', { timeout: 60000 });
   await page.screenshot({ path: 'test-results/landscape-preview-surround.png' });
   await page.setViewportSize({ width: 2560, height: 900 });
   await canvas.focus();
   for (let i = 0; i < 8; i++) await canvas.press('ArrowDown');
   await expect(canvas).toHaveAttribute('data-coverage', 'true', { timeout: 60000 });
   const terrainVertices = Number(await canvas.getAttribute('data-backdrop-terrain-vertices'));
   expect(terrainVertices).toBeGreaterThanOrEqual(196608);
   expect(terrainVertices).toBeLessThanOrEqual(32768 * 8 * 3);
   expect(Number(await canvas.getAttribute('data-distant-trees'))).toBeGreaterThan(0);
   await page.screenshot({ path: 'test-results/landscape-preview-wide-shallow.png' });

   await dialog.getByRole('button', { name: 'Pan landscape', exact: true }).click();
   await expect(dialog.getByRole('button', { name: 'Pan landscape', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
   );

   await page.setViewportSize({ width: 390, height: 844 });
   await page.screenshot({ path: 'test-results/landscape-preview-phone.png' });
   await page.keyboard.press('Escape');
   await expect(dialog).toHaveCount(0);
   await expect
      .poll(async () => Number(await courseCanvas.getAttribute('data-draw-count')))
      .toBeGreaterThan(Number(hiddenDraws));
   await expect(page.locator('#gameOptions')).toBeVisible();
   await expect(page.locator('#openLandscapePreview')).toBeFocused();
   await page.locator('#closeGameOptions').click();
   await expect(page.locator('#selectedClubName')).toHaveText(club!);
   expect(errors).toEqual([]);
});

test('unavailable WebGL leaves a clear return path to the overhead game', async ({ page }) => {
   test.setTimeout(90000);
   await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
         this: HTMLCanvasElement,
         kind: string,
         ...args: unknown[]
      ) {
         if (kind === 'webgl') return null;
         return original.apply(this, [kind, ...args] as Parameters<typeof original>);
      } as typeof original;
   });
   await page.goto('/#play');
   await expect(page.locator('#desktopPlay')).toBeVisible({ timeout: 30000 });
   await page.keyboard.press('Escape');
   await page.locator('#openGameOptions').click();
   await page.locator('[data-option-tab=world]').click();
   await page.locator('#openLandscapePreview').click();
   await expect(page.locator('#landscapePreview [role=status]')).toContainText(
      'overhead game remains available',
   );
   await page.getByRole('button', { name: 'Return to game options' }).click();
   await expect(page.locator('#landscapePreview')).toHaveCount(0);
   await expect(page.locator('#gameOptions')).toBeVisible();
});
