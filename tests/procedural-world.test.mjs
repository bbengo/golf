import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
import { Shot } from '../src/core/simulation/shot.js';
import { worldTrees, worldWetness, WORLD_VERSION } from '../src/core/course/procedural-world.ts';

test('procedural water used by rendering produces physical water contact beyond the estate', () => {
   const c = createPurityCourse();
   const p = { x: -460 - Math.sin(1500 * 0.004) * -90 - Math.sin(1500 * 0.011) * -18, y: 1500 };
   assert.ok(worldWetness(c, p.x, p.y) < 0);
   const surface = Course.surfaceAt(c, p);
   assert.equal(surface.type, 'water');
   const result = Shot.simulate(
      c,
      Course.days.normal,
      {
         position: { ...p, z: surface.waterHeight + 3 },
         velocity: { x: 0, y: 0, z: -1 },
         spin: { x: 0, y: 0, z: 0 },
         mode: 'flight',
      },
      { model: 'fundamentals' },
   );
   assert.equal(result.status, 'water');
   assert.ok(result.events.some((e) => e.kind === 'water' || e.type === 'water'));
   assert.equal(result.finalSurface, 'water');
});

test('promoted scenic lakes are part of the physics snapshot with finite water levels', () => {
   const c = createPurityCourse();
   for (const p of [
      { x: c.bounds.minX - 175, y: 400 },
      { x: c.bounds.maxX + 220, y: -20 },
   ]) {
      const surface = Course.surfaceAt(c, p);
      assert.match(surface.id, /world-lake/);
      assert.equal(surface.type, 'water');
      assert.ok(Number.isFinite(surface.waterHeight));
   }
   const saved = JSON.parse(JSON.stringify(Course.physicsSnapshot(c)));
   assert.equal(saved.world.version, WORLD_VERSION);
   assert.deepEqual(
      worldTrees(saved, { minX: -900, maxX: -600, minY: 700, maxY: 1000 }),
      worldTrees(c, { minX: -900, maxX: -600, minY: 700, maxY: 1000 }),
   );
});

test('tree collision broadphase includes canopies and trunks straddling a tile boundary', () => {
   const c = createPurityCourse();
   const trees = worldTrees(c, { minX: -1040, maxX: -1000, minY: -1400, maxY: 1400 });
   const tree = trees.find((t) => Math.abs(t.x + 1024) < t.canopyRadius);
   assert.ok(tree);
   const z = Course.heightAt(c, tree) + 1;
   const a = { x: tree.x - 3, y: tree.y, z },
      b = { x: tree.x + 3, y: tree.y, z };
   const hit = Shot.objectHit(c, a, b, new Set(), true);
   assert.equal(hit.id, tree.id);
   assert.equal(hit.kind, 'trunk');
   const canopy = Shot.objectHit(
      c,
      { x: tree.x - 30, y: tree.y, z: z - 1 + (tree.height + tree.canopyBase) / 2 },
      { x: tree.x + 30, y: tree.y, z: z - 1 + (tree.height + tree.canopyBase) / 2 },
      new Set(),
      true,
   );
   assert.equal(canopy.id, tree.id);
   assert.equal(canopy.kind, 'canopy');
   const original = { ...c };
   delete original.world;
   assert.equal(Shot.objectHit(original, a, b, new Set(), true), null);
});

test('world identity is validated and queries do not mutate saved course evidence', () => {
   const c = createPurityCourse(),
      before = JSON.stringify(c);
   worldTrees(c, { minX: 2000, maxX: 2100, minY: -2000, maxY: -1900 });
   worldTrees(c, { minX: -800, maxX: -700, minY: 2000, maxY: 2100 });
   assert.equal(JSON.stringify(c), before);
   c.world.version = 'unknown-world';
   assert.equal(Course.validate(c).passed, false);
});
