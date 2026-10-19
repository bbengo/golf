import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ballLight, ballDiameter, ballShadow } from '../src/core/rendering/landscape-ball.ts';

test('ball light rotates into the camera basis and stays normalized', () => {
   for (const yaw of [-2, 0, 1.5])
      for (const pitch of [0.28, 0.82, 1.5]) {
         const light = ballLight(0.4, -0.7, 1, yaw, pitch);
         assert.ok(Math.abs(Math.hypot(...light) - 1) < 1e-10);
      }
   const overhead = ballLight(0, 0, 1, 0, Math.PI / 2);
   assert.ok(Math.abs(overhead[2] - 1) < 1e-10);
   assert.ok(Math.abs(overhead[1]) < 1e-10);
});

test('ball grows on approach with bounded and optional enhanced visibility', () => {
   assert.equal(ballDiameter(580, false), 7);
   assert.ok(ballDiameter(85, false) > ballDiameter(580, false));
   assert.ok(ballDiameter(85, true) >= ballDiameter(85, false));
   assert.equal(ballDiameter(0, true), 24);
   assert.equal(ballDiameter(5000, false), 7);
});

test('contact shadow follows sloped ground, projects away from sun and stays bounded', () => {
   const height = (x, y) => 0.1 * x + 0.05 * y;
   const mesh = ballShadow({ x: 0, y: 0, z: 4 }, 0.5, { x: 1, y: 0, z: 1 }, height, () => false);
   assert.equal(mesh.length, 24 * 3 * 9);
   assert.ok(mesh[0] < -4 && mesh[0] > -5);
   assert.ok(mesh[6] > 0 && mesh[6] <= 0.32);
   for (let i = 0; i < mesh.length; i += 9)
      assert.ok(Math.abs(mesh[i + 2] - height(mesh[i], mesh[i + 1]) - 0.06) < 1e-6);
   const high = ballShadow(
      { x: 0, y: 0, z: 30 },
      0.5,
      { x: 0, y: 0, z: 1 },
      () => 0,
      () => false,
   );
   assert.ok(high[6] < mesh[6]);
   assert.equal(
      ballShadow(
         { x: 0, y: 0, z: 40 },
         1,
         { x: 0, y: 0, z: 1 },
         () => 0,
         () => false,
      ).length,
      0,
   );
   assert.equal(
      ballShadow(
         { x: 0, y: 0, z: 0 },
         1,
         { x: 0, y: 0, z: 1 },
         () => 0,
         () => true,
      ).length,
      0,
   );
});
