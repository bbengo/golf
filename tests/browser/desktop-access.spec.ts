import { expect, test } from '@playwright/test';
test('desktop controls are recoverable and distribute without duplicating inputs', async ({
   page,
}) => {
   test.setTimeout(120000);
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await page.addInitScript(() => localStorage.setItem('purity-display-mode', 'clear'));
   await page.goto('/#play');
   await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 30000 });
   await page.keyboard.press('Escape');
   await page.locator('#useDesktopControls').click();
   await expect(page.locator('.shot-dock')).toBeVisible();
   await expect(page.locator('#desktopStrategy')).toBeVisible();
   await expect(page.locator('#desktopStrategy #desktopTune')).toHaveCount(1);
   await page.locator('#desktopTune').click();
   await expect(page.locator('#desktopStrategy #desktopShape')).toBeVisible();
   await page.screenshot({ path: 'test-results/distributed-desktop.png' });
   await page.locator('#desktopPlay').click();
   await page.locator('#desktopPlay').click();
   await page.locator('#revealTools').click();
   await page.locator('#openShotAnalysis').click();
   await expect(page.locator('#analysisMetrics')).toContainText('Carry');
   const download = page.waitForEvent('download');
   await page.locator('#exportShotEvidence').click();
   expect((await download).suggestedFilename()).toBe('purity-shot-evidence.json');
   await page.locator('#closeShotAnalysis').click();
   await page.locator('#quietView').click();
   await page.setViewportSize({ width: 700, height: 900 });
   await expect(page.locator('#desktopStrategy')).toBeHidden();
   await expect(page.locator('.shot-dock #desktopTune')).toHaveCount(1);
   await expect(page.locator('#desktopShape')).toHaveCount(1);
});
