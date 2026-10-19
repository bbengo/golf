import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landscapeTerrain, LANDSCAPE_LEAF_LIMIT } from '../src/core/rendering/landscape-terrain.ts';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';

test('adaptive landscape joins every interior edge and preserves physical elevations', async () => {
   const c = createPurityCourse();
   const bounds = { minX: -1024, maxX: 1024, minY: -1024, maxY: 1024 };
   const mesh = await landscapeTerrain(c, bounds, { minX: -120, maxX: 240, minY: 80, maxY: 400 });
   assert.ok(mesh.leaves > 16384 && mesh.leaves <= LANDSCAPE_LEAF_LIMIT);
   assert.ok(mesh.vertices.every(Number.isFinite));
   const edges = new Map();
   for (let i = 0; i < mesh.vertices.length; i += 27) {
      const ps = [0, 9, 18].map((offset) =>
         Array.from(mesh.vertices.slice(i + offset, i + offset + 3)),
      );
      for (let j = 0; j < 3; j++) {
         const a = ps[j],
            b = ps[(j + 1) % 3];
         const key = [a.join(','), b.join(',')].sort().join('|');
         const old = edges.get(key);
         edges.set(key, { a, b, count: (old?.count || 0) + 1 });
      }
      if (i % (27 * 127) === 0) {
         const p = { x: ps[0][0], y: ps[0][1] },
            surface = Course.surfaceAt(c, p);
         const z = surface.type === 'water' ? surface.waterHeight : Course.heightAt(c, p);
         assert.ok(Math.abs(ps[0][2] - z) < 0.001);
      }
   }
   for (const { a, b, count } of edges.values()) {
      if (count === 2) continue;
      assert.equal(count, 1);
      assert.ok(
         [0, 1].some((axis) => [-1024, 1024].some((edge) => a[axis] === edge && b[axis] === edge)),
         `crack ${a} -> ${b}`,
      );
   }
   await assert.rejects(
      landscapeTerrain(c, bounds, undefined, () => true),
      /closed/,
   );
});
