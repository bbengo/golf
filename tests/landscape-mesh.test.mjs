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
