import { expect, test } from '@playwright/test';

test('loading remains coherent during slow startup and reveals the ready course', async ({
   page,
}) => {
   let release!: () => void;
   const held = new Promise<void>((resolve) => {
      release = resolve;
   });
   await page.route('**/assets/index-*.js', async (route) => {
      await held;
      await route.continue();
   });
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await page.goto('/', { waitUntil: 'commit' });
   await expect(page.locator('#bootScreen')).toBeVisible();
   await expect(page.locator('#bootMessage')).toHaveText('Preparing your experience');
   await expect(page.locator('#welcomeScreen')).not.toBeVisible();
   await page.screenshot({ path: 'test-results/purity-loading.png' });
   await page.setViewportSize({ width: 390, height: 844 });
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   await page.screenshot({ path: 'test-results/purity-loading-mobile.png' });
   release();
   await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 20000 });
   await expect(page.locator('#course')).toBeVisible();
   await expect(page.getByRole('link', { name: 'Enter the course' })).toBeVisible();
});

test('failed application import offers a retry instead of endless loading', async ({ page }) => {
   await page.route('**/assets/app-*.js', (route) => route.abort());
   await page.goto('/');
   await expect(page.locator('#bootMessage')).toHaveText(
      'Unable to open the experience. Please try again.',
   );
   await expect(page.locator('#bootRetry')).toBeVisible();
   await expect(page.locator('.boot-indicator')).not.toBeVisible();
});
