import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
   contact,
   sliding,
   flightStep,
   cupEntry,
   cylinderHit,
   G,
   R,
   M,
   INERTIA,
   length,
   cross,
} from '../src/core/simulation/fundamentals.ts';
const n = { x: 0, y: 0, z: 1 },
   zero = { x: 0, y: 0, z: 0 };
const energy = (v, w) => 0.5 * M * length(v) ** 2 + 0.5 * INERTIA * length(w) ** 2;
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);

test('frictionless elastic normal impact preserves energy and spin', () => {
   const v = { x: 5, y: 2, z: -4 },
      spin = { x: 40, y: -200, z: 7 },
      r = contact(v, spin, n, 1, 0);
   near(r.velocity.z, 4);
   near(r.velocity.x, 5);
   assert.deepEqual(r.spin, spin);
   near(energy(v, spin), energy(r.velocity, r.spin));
});
test('friction impulse opposes patch slip, exchanges spin, and does not add energy', () => {
   const v = { x: 8, y: 3, z: -5 },
      w = { x: 30, y: -250, z: 20 },
      r = contact(v, w, n, 0.35, 0.3);
   assert.ok(r.tangentImpulse <= 0.3 * r.normalImpulse + 1e-10);
   assert.ok(energy(r.velocity, r.spin) < energy(v, w));
   assert.notDeepEqual(r.spin, w);
   const before = cross(w, { x: 0, y: 0, z: -R }),
      after = cross(r.spin, { x: 0, y: 0, z: -R });
   assert.ok(
      Math.hypot(r.velocity.x + after.x, r.velocity.y + after.y) <
         Math.hypot(v.x + before.x, v.y + before.y),
   );
});
test('strong backspin can reverse tangential motion through contact', () => {
   const r = contact({ x: 1, y: 0, z: -10 }, { x: 0, y: -1000, z: 0 }, n, 0.2, 0.6);
   assert.ok(r.velocity.x < 0);
   assert.ok(r.spin.y > -1000);
});
test('sliding converges to rolling at 5/7 of initial speed for a non-spinning sphere', () => {
   let v = { x: 7, y: 0, z: 0 },
      w = zero;
   for (let i = 0; i < 2000; i++) {
      const r = sliding(v, w, n, 0.3, 0.001);
      v = r.velocity;
      w = r.spin;
      if (r.rolling) break;
   }
   near(v.x, 5, 0.004);
   near(w.y * R, v.x, 0.01);
});
test('vacuum flight is analytic and preserves all three spin components', () => {
   const s = { p: { x: 1, y: 2, z: 10 }, v: { x: 4, y: 3, z: 5 } },
      w = { x: 1, y: 2, z: 3 };
   const r = flightStep(s, w, 0.2, () => zero, 1.225, 0, true);
   near(r.p.x, 1.8);
   near(r.p.z, 10 + 5 * 0.2 - 0.5 * G * 0.2 ** 2);
   near(r.v.z, 5 - G * 0.2);
   assert.deepEqual(r.spin, w);
});
test('axial spin produces no Magnus force, transverse spin does', () => {
   // Vertical flight keeps velocity parallel to axial spin even as gravity acts.
   const state = { p: zero, v: { x: 0, y: 0, z: -40 } };
   const axial = flightStep(state, { x: 0, y: 0, z: 200 }, 0.001, () => zero, 1.225, 0);
   const transverse = flightStep(state, { x: 0, y: 200, z: 0 }, 0.001, () => zero, 1.225, 0);
   near(axial.v.x, 0);
   near(axial.v.y, 0);
   assert.ok(transverse.v.x < 0);
   assert.ok(length(transverse.spin) < 200);
});
test('coupled flight converges under timestep halving', () => {
   const run = (dt) => {
      let s = {
         p: { x: 0, y: 0, z: 1 },
         v: { x: 45, y: 1, z: 20 },
         spin: { x: 20, y: -400, z: 60 },
      };
      for (let i = 0; i < Math.round(2 / dt); i++)
         s = flightStep(s, s.spin, dt, () => ({ x: 1, y: 2, z: 0 }), 1.225, i * dt);
      return s;
   };
   const a = run(0.02),
      b = run(0.01);
   assert.ok(Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y, a.p.z - b.p.z) < 0.0001);
});
test('cup free-fall threshold matches the centered analytic 1.31 m/s case', () => {
   const a = { x: -0.06, y: 0, z: R },
      b = { x: -0.04, y: 0, z: R },
      pin = { x: 0, y: 0 },
      slope = { x: 0, y: 0 };
   const slow = cupEntry(a, b, pin, { x: 1, y: 0, z: 0 }, slope),
      fast = cupEntry(a, b, pin, { x: 2, y: 0, z: 0 }, slope);
   near(slow.criticalMps, (0.108 - R) * Math.sqrt(G / (2 * R)));
   assert.ok(slow.captured);
   assert.equal(fast.captured, false);
   assert.equal(
      cupEntry(
         { x: -0.06, y: 0.04, z: R },
         { x: -0.02, y: 0.04, z: R },
         pin,
         { x: 0.2, y: 0, z: 0 },
         slope,
      ).captured,
      false,
   );
   assert.equal(cupEntry(a, a, pin, zero, slope), null);
});
test('swept cylinder catches a trunk crossing but permits a near miss', () => {
   assert.ok(cylinderHit({ x: -2, y: 0, z: 1 }, { x: 2, y: 0, z: 1 }, { x: 0, y: 0 }, 0.2, 0, 4));
   assert.equal(
      cylinderHit({ x: -2, y: 0.3, z: 1 }, { x: 2, y: 0.3, z: 1 }, { x: 0, y: 0 }, 0.2, 0, 4),
      null,
   );
});
