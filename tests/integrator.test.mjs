import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Shot } from '../src/core/simulation/shot.js';
import { Course } from '../src/core/course/course.js';
import { R, G } from '../src/core/simulation/fundamentals.ts';
import { cupMotion } from '../src/core/simulation/cup.ts';
const zero = { x: 0, y: 0, z: 0 };
const flat = (type = 'fairway') => ({
   ...structuredClone(Course.demo),
   terrain: { base: 0, xGrade: 0, yGrade: 0, features: [] },
   objects: [],
   zones: [],
   pin: { x: 900, y: 900 },
   surfaces: [
      {
         id: 'test',
         type,
         polygon: [
            { x: -1000, y: -1000 },
            { x: 1000, y: -1000 },
            { x: 1000, y: 1000 },
            { x: -1000, y: 1000 },
         ],
      },
   ],
});
const day = Course.days.normal;
test('impact continues through the remainder of the same timestep', () => {
   const c = flat(),
      launch = {
         position: { x: 0, y: 0, z: R + 0.001 },
         velocity: { x: 0, y: 0, z: -1 },
         spin: zero,
      };
   const r = Shot.simulate(c, day, launch, {
      model: 'fundamentals',
      dt: 0.02,
      maxSeconds: 0.02,
      vacuum: true,
   });
   const hitTime = (-1 + Math.sqrt(1 + 2 * G * 0.001)) / G;
   const e = Course.groundAt(c, zero, day).bounce;
   const rest = 0.02 - hitTime;
   const expected = R + e * (1 + G * hitTime) * rest - 0.5 * G * rest * rest;
   assert.ok(Math.abs(r.finish.z - expected) < 0.0001, `${r.finish.z} vs ${expected}`);
   assert.ok(r.events[0].t < 0.002);
   assert.ok(Math.abs(r.duration - 0.02) < 1e-8);
});
test('full flight, repeated bounces and rest converge with timestep refinement', () => {
   for (const surface of ['fairway', 'rough', 'sand', 'green']) {
      const c = flat(surface),
         launch = {
            position: { x: 0, y: 0, z: R + 0.1 },
            velocity: { x: 12, y: 2, z: 15 },
            spin: { x: 0, y: -100, z: 0 },
         };
      const runs = [0.02, 0.01, 0.005].map((dt) =>
         Shot.simulate(c, day, launch, { model: 'fundamentals', dt }),
      );
      assert.ok(
         runs.every((r) => r.status === 'settled'),
         surface + ': ' + runs.map((r) => r.status),
      );
      const distance = (a, b) => Math.hypot(a.finish.x - b.finish.x, a.finish.y - b.finish.y);
      assert.ok(distance(runs[0], runs[2]) < 0.12, surface + ': ' + distance(runs[0], runs[2]));
      assert.ok(distance(runs[1], runs[2]) < 0.06, surface + ': ' + distance(runs[1], runs[2]));
      for (const r of runs) {
         assert.ok(Math.abs(r.finish.z - R) < 0.0001);
         assert.ok(r.events.filter((e) => e.type === 'bounce').length > 1);
         for (let i = 1; i < r.trajectory.length; i++)
            assert.ok(r.trajectory[i].t >= r.trajectory[i - 1].t);
      }
   }
});
test('cup distinguishes falling capture from a moving lip exit and is timestep stable', () => {
   for (const dt of [0.001, 0.0005, 0.00025]) {
      const run = (speed, y) =>
         cupMotion(
            { x: -0.058, y, z: R },
            { x: speed, y: 0, z: 0 },
            { x: 0, y: speed / R, z: 0 },
            dt,
         );
      const slow = run(0.7, 0),
         fast = run(4, 0),
         edge = run(1, 0.045);
      assert.equal(slow.kind, 'capture');
      assert.ok(slow.p.z < -R);
      assert.equal(fast.kind, 'lip-out');
      assert.ok(Math.hypot(fast.v.x, fast.v.y) > 0);
      assert.equal(edge.kind, 'lip-out');
      assert.ok(edge.impacts > 0);
   }
});
test('old fundamentals recordings retain their original integration path', () => {
   const c = flat(),
      launch = { position: { x: 0, y: 0, z: 1 }, velocity: { x: 2, y: 0, z: 2 }, spin: zero };
   const expected = Shot.simulate(c, day, launch, {
      model: 'fundamentals',
      legacyIntegration: true,
   });
   assert.deepEqual(
      Shot.replay({ version: 'purity-rigid-sphere/0.1.0', course: c, day, launch }),
      expected,
   );
   assert.equal(expected.engineVersion, 'purity-rigid-sphere/0.1.0');
});

test('complete putts resolve at the cup and simulation deadlines remain bounded', () => {
   const c = flat('green');
   c.pin = { x: 0, y: 0 };
   const launch = {
      position: { x: -0.15, y: 0, z: R },
      velocity: { x: 0.7, y: 0, z: 0 },
      spin: { x: 0, y: 0.7 / R, z: 0 },
      mode: 'roll',
   };
   const r = Shot.simulate(c, day, launch, { model: 'fundamentals' });
   assert.equal(r.status, 'holed');
   assert.ok(r.events.some((e) => e.type === 'cup-capture'));
   for (let i = 1; i < r.trajectory.length; i++)
      assert.ok(r.trajectory[i].t >= r.trajectory[i - 1].t);
   const limited = Shot.simulate(
      c,
      day,
      { ...launch, position: { x: 10, y: 10, z: 100 }, mode: 'flight' },
      { model: 'fundamentals', maxSeconds: 0.101, dt: 0.015 },
   );
   assert.equal(limited.status, 'unresolved-time-limit');
   assert.ok(limited.duration <= 0.101 + 1e-9);
});

test('sloped putting support feeds a falling cup capture without a proximity snap', () => {
   const c = flat('green');
   c.pin = { x: 0, y: 0 };
   c.terrain.xGrade = 0.02;
   const r = Shot.simulate(
      c,
      day,
      {
         position: { x: -0.15, y: 0, z: R - 0.003 },
         velocity: { x: 0.7, y: 0, z: 0.014 },
         spin: { x: 0, y: 0.7 / R, z: 0 },
         mode: 'roll',
      },
      { model: 'fundamentals' },
   );
   assert.equal(r.status, 'holed');
   assert.ok(r.finish.z < -R);
   assert.ok(r.trajectory.some((p) => p.mode === 'cup'));
});
