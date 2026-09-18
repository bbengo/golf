import test from 'node:test';
import assert from 'node:assert/strict';
import { CourseCamera } from '../src/core/rendering/camera.ts';

const bounds = { minX: 0, maxX: 256.8, minY: 0, maxY: 550.8 };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} differs from ${b}`);
function camera() {
   const c = new CourseCamera();
   c.resize(1440, 900, bounds);
   return c;
}

test('camera coordinates round-trip after zoom, pan and viewport resize', () => {
   const c = camera();
   assert.equal(c.angle, 0);
   c.rotate(0.7);
   c.go({ x: 170, y: 400 }, 4);
   c.tick(16, true);
   c.pan(70, -45);
   c.tick(16, true);
   c.resize(900, 600, bounds);
   const p = { x: 123.4, y: 321.7 },
      result = c.inverse(c.world(p));
   close(result.x, p.x);
   close(result.y, p.y);
});
test('manual rotation survives resizing and north reset restores the cardinal axes', () => {
   const c = camera();
   c.rotate(-1.1);
   c.resize(390, 844, bounds);
   close(c.angle, -1.1);
   c.north();
   close(c.angle, 0);
   const center = c.world({ x: c.x, y: c.y }),
      north = c.world({ x: c.x, y: c.y + 10 });
   close(center.x, north.x);
   assert.ok(north.y < center.y);
});
test('zoom keeps the world point under the cursor, including accumulated wheel input', () => {
   const c = camera(),
      p = { x: 830, y: 250 },
      anchor = c.inverse(p);
   c.zoomAt(p, 1.5);
   c.zoomAt(p, 1.25);
   c.tick(16, true);
   const actual = c.inverse(p);
   close(actual.x, anchor.x);
   close(actual.y, anchor.y);
});
test('camera easing is time-based and reduced motion snaps to the requested view', () => {
   const a = camera(),
      b = camera();
   a.go({ x: 170, y: 400 }, 3);
   b.go({ x: 170, y: 400 }, 3);
   for (let i = 0; i < 10; i++) a.tick(16);
   for (let i = 0; i < 5; i++) b.tick(32);
   close(a.x, b.x);
   close(a.y, b.y);
   close(a.zoom, b.zoom);
   assert.ok(a.zoom > 1 && a.zoom < 3);
   a.tick(16, true);
   close(a.zoom, 3);
   close(a.y, 400);
   a.zoomAt({ x: 720, y: 450 }, 1e9);
   a.tick(16, true);
   close(a.zoom, 10);
   a.zoomAt({ x: 720, y: 450 }, 1e-9);
   a.tick(16, true);
   close(a.zoom, 0.65);
});
