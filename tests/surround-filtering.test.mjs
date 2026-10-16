import { paintDaylightGrade } from '../src/core/rendering/daylight-grade.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
   surroundSample,
   SURROUND_TILE_RESOLUTION as N,
} from '../src/core/rendering/landscape-surround.ts';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
import { worldGroundColour, worldWetness } from '../src/core/course/procedural-world.ts';
test('filtered neighbouring tiles share the same physical border samples in every direction', () => {
   const course = createPurityCourse();
   for (const tx of [-3, -1, 0, 2])
      for (const ty of [-2, 0, 3])
         for (const i of [0, 1, 70, N, N + 1]) {
            const pairs = [
               [surroundSample(tx, ty, N + 1, i), surroundSample(tx + 1, ty, 1, i)],
               [surroundSample(tx, ty, N, i), surroundSample(tx + 1, ty, 0, i)],
               [surroundSample(tx, ty, i, 0), surroundSample(tx, ty + 1, i, N)],
               [surroundSample(tx, ty, i, 1), surroundSample(tx, ty + 1, i, N + 1)],
            ];
            for (const [a, b] of pairs) {
               assert.deepEqual(a, b);
               assert.equal(Course.heightAt(course, a), Course.heightAt(course, b));
               assert.equal(worldWetness(course, a.x, a.y), worldWetness(course, b.x, b.y));
               assert.deepEqual(
                  worldGroundColour(course, a.x, a.y),
                  worldGroundColour(course, b.x, b.y),
               );
            }
         }
});

test('atlas and tile daylight gradients reconstruct identical world-space endpoints', () => {
   const reference = { minX: -100, maxX: 400, minY: -100, maxY: 600 };
   for (const daylight of ['morning', 'day', 'evening']) {
      const results = [];
      for (const [bounds, scale] of [
         [{ minX: -450, maxX: 750, minY: -450, maxY: 950 }, 2],
         [{ minX: 510, maxX: 1026, minY: -2, maxY: 514 }, 0.5],
      ]) {
         const ctx = {
            createLinearGradient: (x0, y0, x1, y1) => {
               results.push([
                  x0 / scale + bounds.minX,
                  bounds.maxY - y0 / scale,
                  x1 / scale + bounds.minX,
                  bounds.maxY - y1 / scale,
               ]);
               return { addColorStop() {} };
            },
            fillRect() {},
         };
         paintDaylightGrade(ctx, bounds, reference, scale, daylight);
      }
      for (let i = 0; i < 4; i++) assert.ok(Math.abs(results[0][i] - results[1][i]) < 1e-9);
   }
});
