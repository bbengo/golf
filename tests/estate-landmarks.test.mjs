import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
import { Shot } from '../src/core/simulation/shot.js';

test('estate places are dry, connected, explicit saved geometry', () => {
   const c = createPurityCourse();
   assert.deepEqual(
      c.places.map((p) => p.id),
      ['welcome', 'rest', 'camp'],
   );
   assert.equal(Course.validate(c).passed, true);
   const saved = JSON.parse(JSON.stringify(Course.physicsSnapshot(c)));
   assert.deepEqual(saved.places, c.places);
   assert.deepEqual(saved.objects, c.objects);
   for (const p of c.places) {
      assert.equal(Course.surfaceAt(c, p).type, 'path');
      assert.ok(c.surfaces.some((s) => s.id === `${p.id}-approach`));
   }
});

test('pavilion roof supports a landing ball while its open centre remains traversable', () => {
   const c = createPurityCourse();
   const o = c.objects.find((o) => o.id === 'welcome-roof');
   const p = { x: (o.minX + o.maxX) / 2, y: (o.minY + o.maxY) / 2 };
   const z = Course.heightAt(c, p) + 1;
   const under = Shot.objectHit(
      c,
      { x: o.minX - 1, y: p.y, z },
      { x: o.maxX + 1, y: p.y, z },
      new Set(),
      true,
   );
   assert.equal(under, null);
   const result = Shot.simulate(
      c,
      Course.days.normal,
      {
         position: { ...p, z: o.deckZ + 2 },
         velocity: { x: 0, y: 0, z: -1 },
         spin: { x: 0, y: 0, z: 0 },
         mode: 'flight',
      },
      { model: 'fundamentals' },
   );
   assert.equal(result.status, 'settled');
   assert.ok(Math.abs(result.trajectory.at(-1).z - o.deckZ - 0.02135) < 0.002);
   assert.ok(result.events.some((e) => e.kind === 'structure' || e.type === 'structure'));
});

test('cabins and pavilion posts intercept swept and rolling balls at their visible walls', () => {
   const c = createPurityCourse();
   const cabin = c.objects.find((o) => o.id === 'camp-cabin-0');
   const y = (cabin.minY + cabin.maxY) / 2;
   const z = cabin.deckZ - 1;
   const hit = Shot.objectHit(
      c,
      { x: cabin.minX - 2, y, z },
      { x: cabin.maxX + 2, y, z },
      new Set(),
      true,
   );
   assert.equal(hit.id, cabin.id);
   assert.ok(Math.abs(hit.p.x - (cabin.minX - 0.02135)) < 1e-6);
   const post = c.objects.find((o) => o.id === 'welcome-post-0');
   const py = (post.minY + post.maxY) / 2,
      x = post.minX - 0.2;
   const result = Shot.simulate(
      c,
      Course.days.normal,
      {
         position: { x, y: py, z: Course.heightAt(c, { x, y: py }) + 0.02135 },
         velocity: { x: 2, y: 0, z: 0 },
         spin: { x: 0, y: 0, z: 0 },
         mode: 'roll',
      },
      { model: 'fundamentals', maxSeconds: 3 },
   );
   assert.ok(
      result.events.some(
         (e) => (e.kind === 'structure' || e.type === 'structure') && e.objectId === post.id,
      ),
   );
});
