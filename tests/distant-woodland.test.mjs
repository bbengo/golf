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
      const authored = course.objects.find((object) => object.id === tree.id);
      assert.deepEqual(tree, authored ?? worldTree(course, Number(x), Number(y)));
      if (!authored)
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

test('transition woodland increases nearby coverage within the existing budgets', async () => {
   const course = createPurityCourse();
   const bounds = { minX: -4096, maxX: 4096, minY: -4096, maxY: 4096 };
   const detail = { minX: 800, maxX: 2336, minY: -768, maxY: 768 };
   const before = JSON.stringify(Course.physicsSnapshot(course));
   const baseline = await distantTrees(course, bounds);
   const selected = await distantTrees(course, bounds, () => false, detail);
   const repeated = await distantTrees(course, bounds, () => false, detail);
   assert.ok(selected.candidates <= 65536);
   assert.ok(selected.trees.length <= 8192);
   assert.equal(new Set(selected.trees.map((t) => t.id)).size, selected.trees.length);
   assert.deepEqual(selected, repeated);
   const distance = (t) =>
      Math.hypot(
         Math.max(detail.minX - t.x, 0, t.x - detail.maxX),
         Math.max(detail.minY - t.y, 0, t.y - detail.maxY),
      );
   assert.ok(
      selected.trees.every((t) => distance(t) > 0),
      'do not duplicate the detailed interior',
   );
   assert.ok(
      selected.trees.filter((t) => distance(t) < 256).length >
         baseline.trees.filter((t) => distance(t) > 0 && distance(t) < 256).length * 1.5,
   );
   assert.ok(
      selected.trees.some((t) => distance(t) > 2000),
      'retain remote woodland',
   );
   for (const tree of selected.trees) {
      const [, x, y] = tree.id.split(':');
      assert.deepEqual(
         tree,
         course.objects.find((object) => object.id === tree.id) ??
            worldTree(course, Number(x), Number(y)),
      );
   }
   assert.equal(JSON.stringify(Course.physicsSnapshot(course)), before);
});

test('authored course trees remain in distant views after the detailed window moves away', async () => {
   const c = createPurityCourse(),
      bounds = c.bounds;
   const selected = await distantTrees(c, bounds, () => false, {
      minX: 2000,
      maxX: 3500,
      minY: 2000,
      maxY: 3500,
   });
   const ids = new Set(selected.trees.map((tree) => tree.id));
   const authored = c.objects.filter(
      (tree) =>
         tree.kind === 'tree' &&
         tree.x >= bounds.minX &&
         tree.x <= bounds.maxX &&
         tree.y >= bounds.minY &&
         tree.y <= bounds.maxY,
   );
   assert.ok(authored.length > 20);
   for (const tree of authored) assert.ok(ids.has(tree.id), `missing authored tree ${tree.id}`);
});
