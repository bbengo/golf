import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ballScreenRadius } from '../src/core/rendering/ball-renderer.ts';
import { viewportResolution } from '../src/core/rendering/viewport.ts';
import { presentationChoice } from '../src/core/rendering/presentation.ts';
import { CourseCamera } from '../src/core/rendering/camera.ts';

test('ball readability increases with zoom and remains bounded', () => {
   assert.ok(ballScreenRadius(8, 'standard') > ballScreenRadius(1, 'standard') * 2);
   assert.ok(ballScreenRadius(8, 'enhanced') > ballScreenRadius(8, 'standard'));
   assert.ok(ballScreenRadius(10000, 'enhanced') <= 12);
});
test('ultrawide and high density canvas allocations respect the pixel budget', () => {
   for (const [w, h] of [
      [5120, 1440],
      [7680, 4320],
      [390, 844],
   ]) {
      const size = viewportResolution(w, h, 3, 'crisp');
      assert.ok(size.width * size.height <= 16000000);
      assert.ok(Math.abs(size.width / size.height - w / h) < 0.01);
   }
   assert.equal(viewportResolution(1920, 1080, 2, 'economy').ratio, 1);
});
test('manual camera input responds faster than follow without overshoot', () => {
   const a = new CourseCamera(),
      b = new CourseCamera();
   for (const c of [a, b]) {
      c.resize(1440, 900, { minX: 0, maxX: 300, minY: 0, maxY: 600 });
      c.go({ x: 200, y: 400 }, 4);
   }
   b.motion = 'follow';
   a.tick(32);
   b.tick(32);
   assert.ok(a.zoom > b.zoom && a.zoom < 4);
   assert.ok(a.x > b.x && a.x < 200);
});
test('invalid saved presentation values recover to defaults', () => {
   assert.equal(presentationChoice('cameraFeel', 'extreme'), 'balanced');
   assert.equal(presentationChoice('renderQuality', null), 'balanced');
});
