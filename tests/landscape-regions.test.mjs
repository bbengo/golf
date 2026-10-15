import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landscapeRegion } from '../src/core/course/landscape-regions.ts';
import { worldTree, worldWetness } from '../src/core/course/procedural-world.ts';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
test('ecological stands concentrate trees and leave genuine open clearings', () => {
   const c = createPurityCourse();
   let forest = 0,
      open = 0,
      trees = 0;
   for (let gx = 40; gx < 85; gx++)
      for (let gy = 40; gy < 85; gy++) {
         const tree = worldTree(c, gx, gy);
         const region = landscapeRegion(gx * 24, gy * 24);
         if (region.density > 0.7) forest++;
         if (region.density === 0) open++;
         if (tree) {
            trees++;
            assert.ok(worldWetness(c, tree.x, tree.y) >= 0.65);
            assert.ok(landscapeRegion(tree.x, tree.y).density > 0);
         }
      }
   assert.ok(forest > 100);
   assert.ok(open > 100);
   assert.ok(trees > 50 && trees < 1000);
   const a = landscapeRegion(512 - 1e-5, -512),
      b = landscapeRegion(512 + 1e-5, -512);
   assert.ok(Math.abs(a.density - b.density) < 1e-5);
   assert.ok(a.colour.every((v, i) => Math.abs(v - b.colour[i]) < 0.001));
});
test('ecology identity survives snapshots and old worlds retain their tree coordinates', () => {
   const c = createPurityCourse(),
      saved = JSON.parse(JSON.stringify(Course.physicsSnapshot(c)));
   for (let x = 30; x < 40; x++) assert.deepEqual(worldTree(c, x, 40), worldTree(saved, x, 40));
   const legacy = structuredClone(c);
   delete legacy.world.ecologyVersion;
   const before = Array.from({ length: 20 }, (_, i) => worldTree(legacy, 30 + i, 40));
   worldTree(c, 35, 40);
   assert.deepEqual(
      before,
      Array.from({ length: 20 }, (_, i) => worldTree(legacy, 30 + i, 40)),
   );
   c.world.ecologyVersion = 'unknown';
   assert.equal(Course.validate(c).passed, false);
});
