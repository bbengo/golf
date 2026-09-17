import { expect, test } from '@playwright/test';

test('local lab completes setup, renders the course, and plays a shot', async ({ page }) => {
  const errors: string[] = [];
  const failedAssets: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedAssets.push(response.url());
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.hostname !== '127.0.0.1') {
      externalRequests.push(url.href);
    }
  });

  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-state', '0');
  await page.locator('#proceedProfile').click();
  await expect(page.locator('body')).toHaveAttribute('data-state', '1');
  await page.locator('#enterGame').click();
  await expect(page.locator('body')).toHaveAttribute('data-state', '2');
  await page.locator('#startRound').click();
  await expect(page.locator('body')).toHaveAttribute('data-state', '3');
  await expect(page.locator('#map')).toBeVisible();

  await page.waitForFunction(() => {
    const lab = (window as unknown as { UCGLab: { plateReady(): boolean } }).UCGLab;
    return lab.plateReady();
  });
  await page.locator('#play').click();
  await page.waitForFunction(() => {
    const lab = (window as unknown as {
      UCGLab: { getState(): { phase: string; records: unknown[] } };
    }).UCGLab;
    const state = lab.getState();
    return state.records.length === 1 && state.phase === 'resolved';
  });
  await expect(page.locator('#play')).toBeEnabled();
  await page.screenshot({ path: 'test-results/lab-desktop.png', fullPage: true });

  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
  expect(externalRequests).toEqual([]);
});
