import { test } from 'node:test';
import assert from 'node:assert/strict';
import { worldDecoration } from '../src/core/rendering/world-decoration.ts';
test('overlapping regenerated regions retain decoration identity, position and variation', () => {
   for (const spacing of [5, 13, 32, 50, 100]) {
      const first = [
         ...worldDecoration({ minX: -350, minY: -350, maxX: 750, maxY: 950 }, spacing, 731, 104),
      ];
      const next = new Map(
         [...worldDecoration({ minX: 0, minY: 0, maxX: 1536, maxY: 1536 }, spacing, 731, 104)].map(
            (p) => [p.id, p],
         ),
      );
      let shared = 0;
      for (const p of first)
         if (p.x > 104 && p.x < 750 && p.y > 104 && p.y < 950) {
            assert.deepEqual(next.get(p.id), p);
            shared++;
         }
      assert.ok(shared > 0);
   }
   assert.throws(
      () => [...worldDecoration({ minX: 0, minY: 0, maxX: 1, maxY: 1 }, 0, 1)],
      /Invalid/,
   );
});
