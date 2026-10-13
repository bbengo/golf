import { test, expect } from '@playwright/test';

test('environment choices load, align with the same camera and persist', async ({ page }) => {
   test.setTimeout(180000);
   const errors: string[] = [];
   page.on('pageerror', (error) => errors.push(error.message));
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await page.goto('/#play');
   await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 30000 });
   const canvas = page.locator('#course');
   await page.keyboard.press('Escape');
   await page.locator('#openGameOptions').click();
   const selection = page.getByLabel('Environment', { exact: true });
   await selection.selectOption('photo');
   await expect(canvas).toHaveAttribute('data-image-ready', 'true', { timeout: 30000 });
   await expect(canvas).toHaveAttribute('data-environment', 'photo');
   await selection.selectOption('comparison');
   await page.locator('#closeGameOptions').click();
   await expect(canvas).toHaveAttribute('data-environment', 'comparison');
   await page.screenshot({ path: 'test-results/environment-comparison.png' });
   await page.reload();
   await expect(canvas).toHaveAttribute('data-environment', 'comparison', { timeout: 30000 });
   await expect(canvas).toHaveAttribute('data-image-ready', 'true', { timeout: 30000 });
   expect(errors).toEqual([]);
});
