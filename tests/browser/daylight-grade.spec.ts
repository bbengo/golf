import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { expect, test } from '@playwright/test';

test('distant daylight grade stays world aligned across rectangular regions', async ({ page }) => {
   test.setTimeout(90000);
   await page.route('**/__test/daylight*', async (route) => {
      const name = new URL(route.request().url()).pathname.split('/').pop()!;
      const source = readFileSync(`src/core/rendering/${name}.ts`, 'utf8');
      const compiled = stripTypeScriptTypes(source);
      await route.fulfill({ contentType: 'text/javascript', body: compiled });
   });
   // Isolate the material check from the game's expensive landscape initialization.
   await page.route('**/material-test', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<html></html>' }),
   );
   await page.goto('/material-test');
   const result = await page.evaluate(async () => {
      const path = '/__test/daylight-grade';
      const { gradeDaylightPixels, daylightGradeLine } = await import(path);
      const reference = { minX: -100, maxX: 100, minY: -200, maxY: 200 };
      const errors: number[] = [];
      const colours: string[] = [];
      for (const preset of ['morning', 'day', 'evening']) {
         const line = daylightGradeLine(reference, preset);
         // Place the same physical point at the centre of a texel in two differently
         // proportioned windows. Comparing their colours catches screen-relative grades.
         const x = line.start.x,
            y = line.start.y;
         const render = (dx: number, dy: number) => {
            const size = 65;
            const pixels = new Uint8Array(size * size * 4);
            for (let i = 0; i < pixels.length; i += 4) pixels.set([80, 110, 70, 255], i);
            const original = pixels.slice();
            const graded: Uint8Array = gradeDaylightPixels(
               pixels,
               size,
               { minX: x - dx, maxX: x + dx, minY: y - dy, maxY: y + dy },
               reference,
               preset,
            );
            if (!pixels.every((v, i) => v === original[i])) throw Error('Input texture mutated');
            if (!graded.every((v, i) => i % 4 !== 3 || v === 255)) throw Error('Lost opacity');
            return Array.from(
               graded.slice((32 * size + 32) * 4, (32 * size + 32) * 4 + 3),
            ) as number[];
         };
         const a = render(300, 300),
            b = render(700, 180);
         errors.push(...a.map((v, i) => Math.abs(v - b[i])));
         colours.push(a.join(','));
      }
      return { errors, colours };
   });
   expect(Math.max(...result.errors)).toBeLessThanOrEqual(2);
   expect(new Set(result.colours).size).toBe(3);
   expect(result.colours).not.toContain('80,110,70');
});
