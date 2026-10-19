import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crownPoint, treeWood } from '../src/core/rendering/tree-geometry.ts';

test('shared crown silhouettes are deterministic, continuous and within the physical envelope', () => {
   for (const phase of [0, 1, 4])
      for (let j = 0; j <= 12; j++)
         for (let i = 0; i <= 24; i++) {
            const latitude = -Math.PI / 2 + (j * Math.PI) / 12,
               angle = (i * Math.PI) / 12;
            const p = crownPoint(latitude, angle, phase);
            assert.ok(Math.hypot(...p) <= 1.000001);
            assert.deepEqual(p, crownPoint(latitude, angle, phase));
            const q = crownPoint(latitude, angle + Math.PI * 2, phase);
            assert.ok(Math.hypot(...p.map((v, k) => v - q[k])) < 1e-10);
         }
   assert.notDeepEqual(crownPoint(0, 0, 0), crownPoint(0, 0, 1));
});

test('forked tapered wood stays at a fixed budget without mutating the tree', () => {
   const tree = Object.freeze({
      x: 0,
      y: 0,
      trunkRadius: 0.3,
      canopyRadius: 5,
      canopyBase: 3,
      height: 12,
   });
   const triangles = treeWood(tree, 100, 0.7);
   assert.equal(triangles.length, 40);
   assert.deepEqual(triangles, treeWood(tree, 100, 0.7));
   assert.ok(triangles.flat(2).every(Number.isFinite));
   assert.ok(triangles.flat().some(([x, y]) => Math.hypot(x, y) > 1));
   assert.ok(triangles.flat().every(([x, y, z]) => Math.hypot(x, y) < 5 && z >= 99.99 && z < 112));
});
