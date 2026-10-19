import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landscapeMaterial } from '../src/core/rendering/landscape-material.ts';

test('subpixel shoreline coverage blends edges while preserving interiors and allocation', async () => {
   let calls = 0;
   const { pixels, refinedPixels } = await landscapeMaterial(8, (x) => {
      calls++;
      return x < 3.5
         ? { type: 'water', colour: [40, 100, 120] }
         : { type: 'rough', colour: [80, 140, 60] };
   });
   assert.equal(pixels.length, 8 * 8 * 4);
   assert.equal(refinedPixels, 16);
   assert.equal(calls, 64 + 16 * 4);
   const pixel = (x, y) => Array.from(pixels.slice((y * 8 + x) * 4, (y * 8 + x + 1) * 4));
   assert.deepEqual(pixel(3, 4), [60, 120, 90, 255]);
   assert.deepEqual(pixel(0, 4), [40, 100, 120, 255]);
   assert.deepEqual(pixel(7, 4), [80, 140, 60, 255]);
});

test('uniform materials avoid extra samples and cancellation applies during refinement', async () => {
   let calls = 0;
   const sample = () => {
      calls++;
      return { type: 'water', colour: [42, 101, 119] };
   };
   const result = await landscapeMaterial(8, sample);
   assert.equal(result.refinedPixels, 0);
   assert.equal(calls, 64);
   calls = 0;
   await assert.rejects(
      landscapeMaterial(8, sample, () => calls >= 64),
      /closed/,
   );
   assert.equal(calls, 64);
   await assert.rejects(landscapeMaterial(1024, sample), /Invalid/);
});
