import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
import { Shot } from '../src/core/simulation/shot.js';
import { worldSand, worldTrees, worldGroundColour } from '../src/core/course/procedural-world.ts';

test('sandy clearings share material, colour, tree exclusion and saved-world identity', () => {
   const c = createPurityCourse();
   const saved = JSON.parse(JSON.stringify(Course.physicsSnapshot(c)));
   let sample;
   let count = 0;
   for (let x = -1500; x < 1500; x += 35)
      for (let y = -1500; y < 1500; y += 35) {
         if (worldSand(c, x, y) <= 0) continue;
         const p = { x, y };
         count++;
         sample ??= p;
         assert.equal(Course.surfaceAt(c, p).type, 'sand');
         assert.equal(Course.groundAt(c, p, Course.days.normal).type, 'sand');
         assert.equal(worldSand(c, x, y), worldSand(saved, x, y));
         assert.deepEqual(worldGroundColour(c, x, y), worldGroundColour(saved, x, y));
      }
   assert.ok(count > 20);
   const trees = worldTrees(c, { minX: -1500, maxX: 1500, minY: -1500, maxY: 1500 });
   for (const tree of trees) assert.ok(worldSand(c, tree.x, tree.y) <= -0.04);
   delete saved.world.groundVersion;
   assert.equal(Course.surfaceAt(saved, sample).type, 'rough');
   c.world.groundVersion = 'unknown';
   assert.equal(Course.validate(c).passed, false);
});

test('a ball dropped onto an outer sand clearing uses sand contact and supported rest', () => {
   const c = createPurityCourse();
   let p;
   for (let x = -1400; x < 1400 && !p; x += 35)
      for (let y = -1400; y < 1400 && !p; y += 35)
         if (
            worldSand(c, x, y) > 0.05 &&
            Math.hypot(...Object.values(Course.slopeAt(c, { x, y }))) < 0.05
         )
            p = { x, y };
   assert.ok(p);
   const result = Shot.simulate(
      c,
      Course.days.normal,
      {
         position: { ...p, z: Course.heightAt(c, p) + 2 },
         velocity: { x: 0, y: 0, z: -1 },
         spin: { x: 0, y: 0, z: 0 },
         mode: 'flight',
      },
      { model: 'fundamentals' },
   );
   assert.equal(result.status, 'settled');
   assert.equal(result.finalSurface, 'sand');
   const end = result.trajectory.at(-1);
   assert.ok(Math.abs(end.z - Course.heightAt(c, end) - 0.02135) < 0.01);
});
