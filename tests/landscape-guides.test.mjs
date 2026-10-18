import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
   landscapeAimRing,
   landscapeTrail,
   landscapeImpacts,
} from '../src/core/rendering/landscape-guides.ts';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';

test('target ring conforms to physical ground without moving the intended target', () => {
   const course = createPurityCourse(),
      aim = { x: 1700, y: 1200 };
   const before = { ...aim },
      ring = landscapeAimRing(course, aim, 85);
   assert.equal(ring.length, 65 * 9);
   for (let i = 0; i < ring.length; i += 9) {
      const p = { x: ring[i], y: ring[i + 1] },
         surface = Course.surfaceAt(course, p);
      const z = surface.type === 'water' ? surface.waterHeight : Course.heightAt(course, p);
      assert.ok(Math.abs(ring[i + 2] - z - 0.25) < 0.002);
   }
   assert.deepEqual(aim, before);
});

test('recorded trail is bounded, excludes the future and ends at the live ball', () => {
   const trace = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i, z: 180, t: i / 100 }));
   const before = JSON.stringify(trace);
   const trail = landscapeTrail(trace, 20, { x: 2000, y: 2000, z: 180 });
   assert.ok(trail.length <= 257 * 9);
   for (let i = 0; i < trail.length; i += 9) assert.ok(trail[i] <= 2000);
   assert.equal(trail[trail.length - 9], 2000);
   assert.equal(JSON.stringify(trace), before);
   assert.equal(landscapeTrail(trace, -1, { x: 0, y: 0, z: 0 }).length, 0);
});

test('impact batches are bounded and expire, preserving recorded evidence', () => {
   const course = createPurityCourse();
   const events = Array.from({ length: 50 }, () => ({
      type: 'water',
      t: 2,
      position: { x: 100, y: 200, z: 180 },
   }));
   const before = JSON.stringify(events),
      batches = landscapeImpacts(course, events, 2.5);
   assert.equal(batches.length, 12);
   for (const batch of batches) {
      assert.equal(batch.vertices.length, 10 * 9);
      assert.ok(batch.vertices.every(Number.isFinite));
      assert.ok(batch.alpha > 0 && batch.alpha < 1);
      assert.ok(batch.vertices[2] > 180);
   }
   assert.deepEqual(landscapeImpacts(course, events, 1), []);
   assert.deepEqual(landscapeImpacts(course, events, 4), []);
   assert.equal(JSON.stringify(events), before);
});
