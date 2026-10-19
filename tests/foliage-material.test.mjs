import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foliageTone } from '../src/core/rendering/foliage-material.ts';

test('foliage colour remains continuous at triangle boundaries and shaded underneath', () => {
   const centre = [12, 34, 8];
   const at = (p) => foliageTone(p, centre, 5, 4);
   assert.ok(at([12, 34, 12]) > at([12, 34, 4]));
   for (let i = 0; i < 100; i++) {
      const p = [12 + Math.cos(i) * 5, 34 + Math.sin(i) * 5, 8 + Math.sin(i * 2) * 4];
      const tone = at(p);
      assert.ok(tone >= 0.735 && tone <= 1.085);
      assert.ok(Math.abs(tone - at([p[0] + 1e-5, p[1], p[2]])) < 1e-5);
      assert.equal(tone, at(p));
   }
});
