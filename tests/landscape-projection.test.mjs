import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectLandscape, pickLandscape } from '../src/core/rendering/landscape-projection.ts';
test('angled ground picking round trips flat and sloped terrain across rotations and viewports', () => {
   for (const yaw of [-2, -0.3, 0, 1.7])
      for (const pitch of [0.28, 0.82, 1.5])
         for (const [width, height] of [
            [1440, 900],
            [390, 844],
         ]) {
            const view = { x: 100, y: 300, z: 190, yaw, pitch, span: 180, width, height };
            for (const gradient of [0, 0.12, -0.08]) {
               const h = (p) => 190 + (p.x - 100) * gradient + (p.y - 300) * 0.03;
               const p = { x: 120, y: 310, z: h({ x: 120, y: 310 }) };
               const q = pickLandscape(projectLandscape(p, view), view, h);
               assert.ok(q);
               assert.ok(Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) < 0.00001);
            }
         }
});
test('picking selects the near terrain crossing and rejects invalid projection state', () => {
   const view = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0.3, span: 100, width: 1000, height: 800 };
   const height = (p) => 35 * Math.exp(-(((p.y + 70) / 25) ** 2));
   const picked = pickLandscape({ x: 500, y: 400 }, view, height);
   assert.ok(picked.y < -40);
   assert.ok(Math.abs(picked.z - height(picked)) < 0.00001);
   assert.throws(() => pickLandscape({ x: 0, y: 0 }, { ...view, pitch: 0 }, height), /Invalid/);
});
