import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
   distantTrees,
   distantWoodland,
   DISTANT_CROWN_TRIANGLES,
} from '../src/core/rendering/distant-woodland.ts';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { worldTree } from '../src/core/course/procedural-world.ts';
import { Course } from '../src/core/course/course.js';

test('distant woodland is bounded and samples real deterministic world trees', async () => {
   const course = createPurityCourse();
   const before = JSON.stringify(Course.physicsSnapshot(course));
   const bounds = { minX: -4096, maxX: 4096, minY: -4096, maxY: 4096 };
   const first = await distantTrees(course, bounds);
   const shifted = await distantTrees(course, { ...bounds, minX: -3968, maxX: 4224 });
   assert.ok(first.trees.length > 0 && first.trees.length <= 8192);
   assert.ok(first.candidates <= 65536 && shifted.candidates <= 65536);
   assert.equal(first.stride, shifted.stride);
   const overlap = new Map(shifted.trees.map((tree) => [tree.id, tree]));
   let shared = 0;
   for (const tree of first.trees) {
      const [, x, y] = tree.id.split(':');
      assert.deepEqual(tree, worldTree(course, Number(x), Number(y)));
      assert.ok(['rough', 'deep-rough'].includes(Course.surfaceAt(course, tree).type));
      if (overlap.has(tree.id)) {
         assert.deepEqual(tree, overlap.get(tree.id));
         shared++;
      }
   }
   assert.ok(shared > first.trees.length * 0.8);
   assert.equal(JSON.stringify(Course.physicsSnapshot(course)), before);
   await assert.rejects(
      distantTrees(course, bounds, () => true),
      /closed/,
   );
});

test('distant crowns retain physical height and radius with smooth unit normals', async () => {
   const course = createPurityCourse();
   const bounds = { minX: 600, maxX: 1000, minY: 600, maxY: 1000 };
   const { trees } = await distantTrees(course, bounds);
   const mesh = await distantWoodland(course, bounds);
   assert.ok(trees.length > 0);
   assert.equal(mesh.treeCount, trees.length);
   assert.equal(mesh.vertices.length, trees.length * DISTANT_CROWN_TRIANGLES * 27);
   for (let i = 0; i < trees.length; i++) {
      const tree = trees[i],
         ground = Course.heightAt(course, tree);
      let highest = -Infinity;
      for (
         let j = i * DISTANT_CROWN_TRIANGLES * 27;
         j < (i + 1) * DISTANT_CROWN_TRIANGLES * 27;
         j += 9
      ) {
         const [x, y, z] = mesh.vertices.slice(j, j + 3);
         const normal = mesh.vertices.slice(j + 3, j + 6);
         assert.ok(Math.abs(Math.hypot(...normal) - 1) < 0.00001);
         assert.ok(Math.hypot(x - tree.x, y - tree.y) <= tree.canopyRadius + 0.001);
         assert.ok(z >= ground + tree.canopyBase - 0.001);
         highest = Math.max(highest, z);
      }
      assert.ok(Math.abs(highest - ground - tree.height) < 0.001);
   }
});
