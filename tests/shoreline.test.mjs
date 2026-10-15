import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wetCell } from '../src/core/rendering/shoreline.ts';
test('shoreline intersections follow the zero contour and keep clockwise union winding', () => {
   const corners = [
      { x: 0, y: 0 },
      { x: 0, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 0 },
   ].map((p) => ({ ...p, value: p.x - 1.25 }));
   const polygons = wetCell(corners);
   assert.equal(polygons.length, 2);
   let area = 0;
   for (const polygon of polygons) {
      for (const p of polygon) {
         assert.ok(p.x <= 1.25);
         if (p.value === 0) assert.equal(p.x, 1.25);
      }
      const signed =
         polygon.reduce((sum, p, i) => {
            const q = polygon[(i + 1) % polygon.length];
            return sum + p.x * q.y - q.x * p.y;
         }, 0) / 2;
      assert.ok(signed < 0);
      area -= signed;
   }
   assert.equal(area, 5);
   assert.equal(wetCell(corners.map((p) => ({ ...p, value: 1 }))).length, 0);
   assert.equal(wetCell(corners.map((p) => ({ ...p, value: -1 }))).length, 1);
});
