import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landscapeMesh } from '../src/core/rendering/landscape-mesh.ts';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
test('preview mesh uses physical terrain and structures without changing the course', async () => {
   const c = createPurityCourse();
   const before = JSON.stringify(Course.physicsSnapshot(c));
   const mesh = await landscapeMesh(c, { minX: -190, maxX: -160, minY: -100, maxY: -70 }, 5);
   assert.equal(mesh.vertices.length, mesh.triangles * 27);
   assert.ok(mesh.vertices.every(Number.isFinite));
   assert.ok(mesh.triangles > 72);
   assert.equal(JSON.stringify(Course.physicsSnapshot(c)), before);
   const first = mesh.vertices.slice(0, 3);
   assert.ok(Math.abs(first[2] - Course.heightAt(c, { x: first[0], y: first[1] })) < 0.0001);
   await assert.rejects(
      landscapeMesh(c, { minX: 0, maxX: 100000, minY: 0, maxY: 100000 }, 100000),
      /budget/,
   );
   await assert.rejects(
      landscapeMesh(c, { minX: 0, maxX: 30, minY: 0, maxY: 30 }, 5, () => true),
      /closed/,
   );
});

test('adaptive terrain shares every interior edge without cracks or unmatched coarse edges', async () => {
   const c = createPurityCourse();
   const bounds = { minX: -250, maxX: -100, minY: -160, maxY: 0 };
   const mesh = await landscapeMesh(c, bounds, 10);
   assert.ok(mesh.refinedCells > 0 && mesh.refinedCells < 240);
   const edges = new Map();
   for (let t = 0; t < mesh.terrainTriangles; t++) {
      const ps = [0, 1, 2].map((i) =>
         Array.from(mesh.vertices.slice(t * 27 + i * 9, t * 27 + i * 9 + 3)),
      );
      for (let i = 0; i < 3; i++) {
         const a = ps[i],
            b = ps[(i + 1) % 3];
         const key = [a.join(','), b.join(',')].sort().join('|');
         const old = edges.get(key);
         edges.set(key, { count: (old?.count ?? 0) + 1, a, b });
      }
   }
   for (const { count, a, b } of edges.values()) {
      if (count === 2) continue;
      assert.equal(count, 1);
      assert.ok(
         [0, 1].some((axis) =>
            [axis ? bounds.minY : bounds.minX, axis ? bounds.maxY : bounds.maxX].some(
               (v) => a[axis] === v && b[axis] === v,
            ),
         ),
         `unmatched interior edge ${a} -> ${b}`,
      );
   }
});
