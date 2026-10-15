import { expect, test } from '@playwright/test';
test('angled landscape preview opens, orbits, visits landmarks and returns without changing the shot', async ({
   page,
}) => {
   test.setTimeout(180000);
   const errors: string[] = [];
   page.on('pageerror', (e) => errors.push(e.message));
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await page.goto('/#play');
   await expect(page.locator('#desktopPlay')).toBeVisible({ timeout: 30000 });
   const club = await page.locator('#selectedClubName').textContent();
   await page.keyboard.press('Escape');
   await page.locator('#openGameOptions').click();
   await page.locator('[data-option-tab=world]').click();
   await page.locator('#openLandscapePreview').click();
   const dialog = page.locator('#landscapePreview'),
      canvas = dialog.locator('canvas');
   await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
   expect(Number(await canvas.getAttribute('data-triangles'))).toBeGreaterThan(10000);
   await page.screenshot({ path: 'test-results/landscape-preview-estate.png' });
   await dialog.getByRole('button', { name: 'Woodland pavilion', exact: true }).click();
   await canvas.focus();
   await canvas.press('ArrowLeft');
   await canvas.press('+');
   await page.screenshot({ path: 'test-results/landscape-preview-pavilion.png' });
   await page.setViewportSize({ width: 390, height: 844 });
   await page.screenshot({ path: 'test-results/landscape-preview-phone.png' });
   await page.keyboard.press('Escape');
   await expect(dialog).toHaveCount(0);
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
