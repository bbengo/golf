import { expect, test } from '@playwright/test';

test('landscape reaches viewport edges at widest zoom and rotated pan limits', async ({ page }) => {
   test.setTimeout(120000);
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await page.addInitScript(() => localStorage.setItem('purity-display-mode', 'clear'));
   await page.setViewportSize({ width: 2560, height: 900 });
   await page.goto('/#play');
   await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 20000 });
   const canvas = page.locator('#course');
   await canvas.focus();
   for (let i = 0; i < 8; i++) await canvas.press('-');
   await expect(canvas).toHaveAttribute('data-camera-zoom', '0.650');
   for (let i = 0; i < 4; i++) await canvas.press(']');
   for (const [name, width, height, key] of [
      ['wide', 2560, 900, 'ArrowLeft'],
      ['portrait', 390, 844, 'ArrowRight'],
   ] as const) {
      await page.setViewportSize({ width, height });
      for (let i = 0; i < 16; i++) await canvas.press(key);
      await page.screenshot({ path: `test-results/landscape-${name}.png` });
      const detail = await canvas.evaluate((el) => {
         const c = el as HTMLCanvasElement,
            ctx = c.getContext('2d')!;
         return [
            [2, 2],
            [c.width - 34, 2],
            [2, c.height - 34],
            [c.width - 34, c.height - 34],
         ].map(([x, y]) => {
            const pixels = ctx.getImageData(x, y, 32, 32).data;
            const colours = new Set<string>();
            let opaque = true;
            for (let i = 0; i < pixels.length; i += 4) {
               colours.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
               if (pixels[i + 3] !== 255) opaque = false;
            }
            return { opaque, colours: colours.size };
         });
      });
      for (const corner of detail) {
         expect(corner.opaque).toBe(true);
         // Quiet meadows and open water may use few colours. Reject a flat fallback,
         // not an arbitrary palette count that requires adding visual noise.
         expect(corner.colours).toBeGreaterThan(1);
      }
   }
});
