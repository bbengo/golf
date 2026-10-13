import { Terrain } from '../src/core/course/terrain.js';
import { Shot } from '../src/core/simulation/shot.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPurityCourse, PURITY_COURSE_REVISION } from '../src/core/course/purity-course.ts';
import { HoleVisual } from '../src/core/course/hole.js';
import { Course } from '../src/core/course/course.js';

test('woodland geometry is deterministic and leaves the original course unchanged', () => {
   const baseline = JSON.stringify(HoleVisual.course),
      a = createPurityCourse(),
      b = createPurityCourse();
   assert.deepEqual(a, b);
   assert.equal(JSON.stringify(HoleVisual.course), baseline);
   assert.equal(a.revision, PURITY_COURSE_REVISION);
   assert.ok(a.objects.length > 100);
   assert.equal(a.surfaces.filter((s) => s.type === 'sand').length, 5);
   for (const p of [
      { x: 72, y: 267 },
      { x: 111, y: 355 },
      { x: 144, y: 501 },
   ])
      assert.equal(Course.surfaceAt(a, p).type, 'sand');
   for (const tee of Object.values(a.tees)) {
      assert.equal(Course.surfaceAt(a, tee.point).type, 'tee');
      for (const tree of a.objects.filter((o) => o.id.startsWith('woodland-tree')))
         assert.ok(Math.hypot(tree.x - tee.point.x, tree.y - tee.point.y) >= 32);
   }
});
test('refined creek has finite connected banks and belongs to the physical snapshot', () => {
   const c = createPurityCourse(),
      water = c.surfaces.filter((s) => s.id.startsWith('woodland-creek-'));
   for (let i = 0; i < water.length; i++) {
      for (const p of water[i].polygon) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      if (i) {
         assert.deepEqual(water[i - 1].polygon[1], water[i].polygon[0]);
         assert.deepEqual(water[i - 1].polygon[2], water[i].polygon[3]);
      }
   }
   const snapshot = Course.physicsSnapshot(c);
   assert.equal(snapshot.objects.length, c.objects.length);
   assert.deepEqual(snapshot.surfaces, c.surfaces);
});

test('estate lakes and practice lawns participate in physical lie queries', () => {
   const c = createPurityCourse();
   for (const p of [
      { x: -76, y: 434 },
      { x: 354, y: 507 },
   ])
      assert.equal(Course.surfaceAt(c, p).type, 'water');
   for (const p of [
      { x: -82, y: 95 },
      { x: 298, y: 220 },
   ])
      assert.equal(Course.surfaceAt(c, p).type, 'fairway');
   assert.deepEqual(c.pin, HoleVisual.course.pin);
   assert.deepEqual(c.pins, HoleVisual.course.pins);
});

test('estate loop closes with continuous banks and a smooth seam', () => {
   const course = createPurityCourse();
   const polygon = course.surfaces.find((s) => s.id === 'estate-walk').polygon;
   const half = polygon.length / 2;
   for (const bank of [polygon.slice(0, half), polygon.slice(half)]) {
      assert.deepEqual(bank[0], bank.at(-1));
      const a = bank.at(-2),
         b = bank[0],
         c = bank[1];
      const ux = b.x - a.x,
         uy = b.y - a.y,
         vx = c.x - b.x,
         vy = c.y - b.y;
      const cosine = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
      assert.ok(cosine > 0.97, 'closing tangent must not form a sharp corner');
   }
   assert.equal(Course.surfaceAt(course, { x: -145, y: -65 }).type, 'path');
   assert.notEqual(Course.surfaceAt(course, { x: 120, y: 200 }).type, 'path');
});

test('Purity flight crosses the old west survey edge and lands before settling', () => {
   const c = createPurityCourse();
   const start = { x: c.bounds.minX + 2, y: -65 };
   const launch = {
      position: { ...start, z: Course.heightAt(c, start) + 4 },
      velocity: { x: -12, y: 0, z: 2 },
      spin: { x: 0, y: 0, z: 0 },
      mode: 'flight',
   };
   const result = Shot.simulate(c, Course.days.normal, launch, {
      model: 'fundamentals',
   });
   assert.equal(result.status, 'settled');
   assert.ok(result.events.some((e) => e.type === 'landing'));
   assert.ok(!result.events.some((e) => e.type === 'source-coverage-limit'));
   assert.ok(result.trajectory.at(-1).x < c.bounds.minX);
   assert.ok(result.trajectory.at(-1).t > 1);
   const legacy = Shot.simulate(
      { ...c, boundaryPolicy: 'source-coverage-limit-not-OB' },
      Course.days.normal,
      launch,
      { model: 'fundamentals' },
   );
   assert.equal(legacy.status, 'outside-survey');
});

test('a rolling ball crosses the Purity survey edge and reaches supported rest', () => {
   const c = createPurityCourse(),
      start = { x: c.bounds.minX + 0.5, y: -65 };
   const result = Shot.simulate(
      c,
      Course.days.normal,
      {
         position: { ...start, z: Course.heightAt(c, start) + Shot.R },
         velocity: { x: -4, y: 0, z: 0 },
         spin: { x: 0, y: -4 / Shot.R, z: 0 },
         mode: 'roll',
      },
      { model: 'fundamentals' },
   );
   assert.equal(result.status, 'settled');
   const rest = result.trajectory.at(-1);
   assert.ok(rest.x < c.bounds.minX);
   assert.ok(Math.abs(rest.z - Course.heightAt(c, rest) - Shot.R) < 0.001);
   assert.ok(!result.events.some((e) => e.type === 'source-coverage-limit'));
});

test('terrain inspection remains ordered and finite beyond the original survey', () => {
   const c = createPurityCourse();
   const center = { x: c.bounds.minX - 150, y: c.bounds.minY - 80 };
   const mesh = Terrain.mesh(c, center, 28, 4);
   assert.equal(mesh.bounds.minX, center.x - 28);
   assert.equal(mesh.bounds.maxX, center.x + 28);
   for (const row of mesh.rows) for (const p of row) assert.ok(Number.isFinite(p.z));
});
