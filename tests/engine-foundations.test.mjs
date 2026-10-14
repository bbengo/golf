import { dispersionStudy } from '../src/core/simulation/dispersion-study.ts';
import { CockpitSession } from '../src/core/session/cockpit-session.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
import { Shot } from '../src/core/simulation/shot.js';
import { waterElevation, waterShore } from '../src/core/course/water-system.ts';
import { worldWetness } from '../src/core/course/procedural-world.ts';
import { Environment } from '../src/core/course/environment.ts';
import {
   physicsProfiles,
   validatePhysicsProfiles,
} from '../src/core/simulation/physics-profiles.ts';
import { analyseShot, compareShots } from '../src/core/simulation/shot-analysis.ts';

test('outer water intersections share elevation and their bed stays submerged', () => {
   const c = createPurityCourse();
   const lake = c.world.waters.find((w) => w.id === 'world-lake-west');
   for (const p of [
      { x: -350, y: 400 },
      { x: -460 + Math.sin(1500 * 0.004) * 90 + Math.sin(1500 * 0.011) * 18, y: 1500 },
   ]) {
      assert.ok(worldWetness(c, p.x, p.y) < 0);
      assert.equal(Course.surfaceAt(c, p).waterHeight, waterElevation(c, p));
      assert.ok(Course.heightAt(c, p) < waterElevation(c, p));
   }
   for (const p of lake.polygon.filter((_, i) => i % 10 === 0)) {
      assert.ok(
         Math.abs(
            waterElevation(c, { x: p.x - 0.001, y: p.y }) -
               waterElevation(c, { x: p.x + 0.001, y: p.y }),
         ) < 0.001,
      );
   }
   const copy = JSON.parse(JSON.stringify(Course.physicsSnapshot(c)));
   assert.equal(waterShore(copy, { x: -350, y: 400 }), waterShore(c, { x: -350, y: 400 }));
   copy.world.hydrology.version = 'unknown';
   assert.equal(Course.validate(copy).passed, false);
});

test('environment uses one clock and captured conditions are independent of later changes', () => {
   let now = 1000;
   const env = new Environment(() => now),
      c = createPurityCourse();
   const setup = { tee: 'white', pin: 'moderate', wind: 'moderate', moisture: 'wet', towardDeg: 0 };
   now = 4500;
   env.daylight = 'morning';
   const day = env.day(c, setup);
   assert.equal(day.windStartSeconds, 3.5);
   assert.equal(day.environment.seconds, 3.5);
   assert.equal(day.environment.moisture, day.moisture);
   now = 20000;
   env.daylight = 'evening';
   env.reset();
   assert.equal(day.environment.daylight, 'morning');
   assert.equal(env.day(c, setup).windStartSeconds, 0);
   env.advanceTo(30);
   assert.equal(env.day(c, setup).windStartSeconds, 30);
   env.advanceTo(10);
   assert.equal(env.day(c, setup).windStartSeconds, 30);
});

test('profile copies preserve the baseline and reject altered replay evidence', () => {
   const profile = physicsProfiles();
   validatePhysicsProfiles(profile);
   profile.ball.massKg = 0.1;
   assert.throws(() => validatePhysicsProfiles(profile), /profile evidence/);
   assert.equal(physicsProfiles().ball.massKg, 0.04593);
});

test('analysis measures post-contact travel along a curved path rather than total minus carry', () => {
   const result = {
      carry: 10,
      total: 12,
      apexAboveLaunch: 4,
      status: 'settled',
      firstContact: { x: 10, y: 0, z: 0 },
      events: [
         { type: 'landing', t: 1 },
         { type: 'bounce', t: 1, incomingVelocityMps: { x: 3, y: 0, z: -3 } },
      ],
      trajectory: [
         { x: 0, y: 0, z: 0, t: 0 },
         { x: 10, y: 0, z: 0, t: 1 },
         { x: 10, y: 3, z: 0, t: 2 },
         { x: 14, y: 3, z: 0, t: 3 },
      ],
   };
   const a = analyseShot(result);
   assert.equal(a.rolloutM, 7);
   assert.equal(a.landingAngleDeg, 45);
   assert.equal(compareShots(result, result).carryM, 0);
   assert.equal(analyseShot({ ...result, firstContact: null, events: [] }).landingAngleDeg, null);
   assert.equal(analyseShot({ ...result, firstContact: null, events: [] }).rolloutM, null);
});

test('complete baseline shot remains consistent as the integration step halves', () => {
   const c = createPurityCourse();
   c.objects = [];
   delete c.world;
   const p = { x: 440, y: 350 };
   const launch = {
      position: { ...p, z: Course.heightAt(c, p) + 2 },
      velocity: { x: 5, y: 0, z: 2 },
      spin: { x: 0, y: 0, z: 0 },
      mode: 'flight',
   };
   const a = Shot.simulate(c, Course.days.normal, launch, { model: 'fundamentals', dt: 0.015 });
   const b = Shot.simulate(c, Course.days.normal, launch, { model: 'fundamentals', dt: 0.0075 });
   assert.equal(a.status, 'settled');
   assert.equal(b.status, 'settled');
   assert.ok(Math.hypot(a.finish.x - b.finish.x, a.finish.y - b.finish.y) < 0.5);
});

test('dispersion study is deterministic, cancellable and does not mutate the round', async () => {
   const session = new CockpitSession();
   session.study('putt');
   const input = {
      course: session.course,
      day: session.day(),
      golfer: session.golfer,
      intent: { ...session.intent, start: session.ball, aim: session.aim },
   };
   const before = JSON.stringify(input);
   const a = await dispersionStudy(input),
      b = await dispersionStudy(input);
   assert.deepEqual(a.summary, b.summary);
   assert.equal(a.shots.length, 12);
   assert.deepEqual(
      a.shots.map((s) => s.result.finish),
      b.shots.map((s) => s.result.finish),
   );
   assert.equal(JSON.stringify(input), before);
   assert.equal(session.records.length, 0);
   const abort = new AbortController();
   abort.abort();
   await assert.rejects(() => dispersionStudy(input, abort.signal), /cancelled/);
});

test('recorded weather follows the same accelerated shot timeline as ball presentation', () => {
   const session = new CockpitSession();
   session.last = { result: { duration: 20 }, day: session.day() };
   session.animationStarted = 1000;
   assert.equal(session.shotTime(2000), 3);
   assert.equal(session.shotTime(11000), 20);
   assert.equal(session.shotTime(11000, false), 30);
});
