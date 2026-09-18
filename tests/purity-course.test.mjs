import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPurityCourse, PURITY_COURSE_REVISION } from '../src/core/course/purity-course.ts';
import { HoleVisual } from '../src/core/course/hole.js';
import { Course } from '../src/core/course/course.js';

test('woodland geometry is deterministic and leaves the original course unchanged', () => {
   const baseline = JSON.stringify(HoleVisual.course),
      a = createPurityCourse(),
      b = createPurityCourse();
   assert.deepEqual(a, b);
   assert.equal(JSON.stringify(HoleVisual.course), baseline);
   assert.equal(a.revision, PURITY_COURSE_REVISION);
   assert.ok(a.objects.length > 100);
   assert.equal(a.surfaces.filter((s) => s.type === 'sand').length, 3);
   for (const p of [
      { x: 72, y: 267 },
      { x: 111, y: 355 },
      { x: 144, y: 501 },
   ])
      assert.equal(Course.surfaceAt(a, p).type, 'sand');
   for (const tee of Object.values(a.tees)) {
      assert.equal(Course.surfaceAt(a, tee.point).type, 'tee');
      for (const tree of a.objects.filter((o) => o.id.startsWith('woodland-tree')))
         assert.ok(Math.hypot(tree.x - tee.point.x, tree.y - tee.point.y) >= 32);
   }
});
test('refined creek has finite connected banks and belongs to the physical snapshot', () => {
   const c = createPurityCourse(),
      water = c.surfaces.filter((s) => s.type === 'water');
   for (let i = 0; i < water.length; i++) {
      for (const p of water[i].polygon) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      if (i) {
         assert.deepEqual(water[i - 1].polygon[1], water[i].polygon[0]);
         assert.deepEqual(water[i - 1].polygon[2], water[i].polygon[3]);
      }
   }
   const snapshot = Course.physicsSnapshot(c);
   assert.equal(snapshot.objects.length, c.objects.length);
   assert.deepEqual(snapshot.surfaces, c.surfaces);
});
