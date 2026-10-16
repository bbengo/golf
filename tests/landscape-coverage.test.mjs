import { DISTANT_CROWN_TRIANGLES } from '../src/core/rendering/distant-woodland.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
   landscapeFootprint,
   paddedLandscape,
   containsLandscape,
   landscapeBackdrop,
} from '../src/core/rendering/landscape-coverage.ts';
import { landscapeRay } from '../src/core/rendering/landscape-projection.ts';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { Course } from '../src/core/course/course.js';
import { worldWetness } from '../src/core/course/procedural-world.ts';
import { waterColour } from '../src/core/rendering/water-material.ts';

test('coverage encloses every corner ray across wide screens, shallow pitch and relief', () => {
   for (const [width, height] of [
      [390, 844],
      [2560, 900],
      [5120, 1440],
   ])
      for (const pitch of [0.28, 0.82, 1.5])
         for (const yaw of [-2, -0.3, 0, 2.8]) {
            const view = { x: 1500, y: -2700, z: 190, span: 720, width, height, pitch, yaw };
            const bounds = landscapeFootprint(view);
            assert.ok(containsLandscape(paddedLandscape(bounds), bounds));
            for (const x of [0, width])
               for (const y of [0, height])
                  for (const dz of [-512, 0, 512]) {
                     const ray = landscapeRay({ x, y }, view);
                     const t = (view.z + dz - ray.origin.z) / ray.direction.z;
                     const p = {
                        x: ray.origin.x + t * ray.direction.x,
                        y: ray.origin.y + t * ray.direction.y,
                     };
                     assert.ok(
                        p.x >= bounds.minX &&
                           p.x <= bounds.maxX &&
                           p.y >= bounds.minY &&
                           p.y <= bounds.maxY,
                     );
                  }
         }
   assert.throws(
      () =>
         landscapeFootprint({
            x: 0,
            y: 0,
            z: 0,
            yaw: 0,
            pitch: 0,
            span: 720,
            width: 0,
            height: 100,
         }),
      /Invalid/,
   );
});

test('distant terrain has a fixed geometry budget and physical heights, including water', async () => {
   const course = createPurityCourse();
   const bounds = { minX: -4096, maxX: 4096, minY: -4096, maxY: 4096 };
   const { vertices, pixels, textureSize, terrainVertices, treeCount } = await landscapeBackdrop(
      course,
      bounds,
      () => false,
      'evening',
   );
   assert.equal(textureSize, 256);
   assert.equal(pixels.length, 256 * 256 * 4);
   assert.equal(terrainVertices, 128 * 128 * 6);
   assert.ok(treeCount > 0 && treeCount <= 8192);
   assert.equal(vertices.length, terrainVertices * 9 + treeCount * DISTANT_CROWN_TRIANGLES * 27);
   assert.ok(vertices.every(Number.isFinite));
   for (let i = 0; i < terrainVertices * 9; i += 9 * 97) {
      const [x, y, z] = vertices.slice(i, i + 3);
      const surface = Course.surfaceAt(course, { x, y });
      const expected =
         surface.type === 'water' ? surface.waterHeight : Course.heightAt(course, { x, y });
      assert.ok(Math.abs(z - expected) < 0.001);
   }
   let waterSamples = 0;
   const waterColours = new Set();
   for (let row = 0; row < textureSize; row += 3)
      for (let col = 0; col < textureSize; col += 3) {
         const x = bounds.minX + ((col + 0.5) / textureSize) * (bounds.maxX - bounds.minX);
         const y = bounds.maxY - ((row + 0.5) / textureSize) * (bounds.maxY - bounds.minY);
         if (Course.surfaceAt(course, { x, y }).type !== 'water') continue;
         const offset = (row * textureSize + col) * 4;
         const actual = Array.from(pixels.slice(offset, offset + 3));
         assert.deepEqual(
            actual,
            waterColour(x, y, Math.max(0, -worldWetness(course, x, y) * 28), 'evening'),
         );
         assert.equal(pixels[offset + 3], 255);
         waterColours.add(actual.join(','));
         waterSamples++;
      }
   assert.ok(waterSamples > 10, 'exercise distant physical water');
   assert.ok(waterColours.size > 3, 'preserve subtle variation instead of one flat colour');
   await assert.rejects(
      landscapeBackdrop(course, bounds, () => true),
      /closed/,
   );
});
