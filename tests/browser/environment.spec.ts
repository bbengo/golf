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
   await page.locator('[data-option-tab=camera]').click();
   await page
      .getByRole('group', { name: 'Camera response', exact: true })
      .getByRole('radio', { name: 'Responsive', exact: true })
      .check();
   await page
      .getByRole('group', { name: 'Ball visibility', exact: true })
      .getByRole('radio', { name: 'Enhanced', exact: true })
      .check();
   await page
      .getByRole('group', { name: 'Ball finish', exact: true })
      .getByRole('radio', { name: 'Tour yellow', exact: true })
      .check();
   await page
      .getByRole('group', { name: 'Last-shot trace', exact: true })
      .getByRole('radio', { name: 'Show last shot', exact: true })
      .check();
   await page.screenshot({ path: 'test-results/camera-ball-options.png' });
   await page.locator('[data-option-tab=world]').click();
   const selection = page.getByRole('group', { name: 'Environment', exact: true });
   await selection.getByRole('radio', { name: 'Original image', exact: true }).check();
   await expect(canvas).toHaveAttribute('data-image-ready', 'true', { timeout: 30000 });
   await expect(canvas).toHaveAttribute('data-environment', 'photo');
   await selection.getByRole('radio', { name: 'Both - split comparison', exact: true }).check();
   await page.locator('#closeGameOptions').click();
   await expect(canvas).toHaveAttribute('data-environment', 'comparison');
   await page.screenshot({ path: 'test-results/environment-comparison.png' });
   await page.reload();
   await expect(canvas).toHaveAttribute('data-environment', 'comparison', { timeout: 30000 });
   await expect(canvas).toHaveAttribute('data-image-ready', 'true', { timeout: 30000 });
   await expect(page.locator('body')).toHaveAttribute('data-ball-colour', 'yellow');
   await expect(page.locator('body')).toHaveAttribute('data-camera-feel', 'responsive');
   await expect(page.locator('body')).toHaveAttribute('data-shot-trace', 'last');
   expect(errors).toEqual([]);
});
