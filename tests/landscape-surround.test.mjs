import test from 'node:test';
import assert from 'node:assert/strict';
import { CourseCamera } from '../src/core/rendering/camera.ts';
import { surroundTileRange, SURROUND_TILE_SIZE } from '../src/core/rendering/landscape-surround.ts';

test('surround covers all viewport corners at minimum zoom, pan limits and rotation', () => {
   for (const [w, h] of [
      [3440, 1440],
      [2560, 720],
      [390, 844],
   ])
      for (const angle of [0, 0.7, 1.57, -2.2]) {
         const camera = new CourseCamera();
         camera.angle = angle;
         camera.offsetY = -80;
         camera.resize(w, h, { minX: 0, maxX: 256, minY: 0, maxY: 550 });
         camera.zoomAt({ x: w / 2, y: h / 2 }, 0.01);
         for (const [dx, dy] of [
            [-100000, -100000],
            [100000, 100000],
         ]) {
            camera.pan(dx, dy);
            camera.tick(16, true);
            const range = surroundTileRange(camera);
            for (const [x, y] of [
               [0, 0],
               [w, 0],
               [0, h],
               [w, h],
            ]) {
               const p = camera.inverse({ x, y });
               assert.ok(
                  p.x >= range.minX * SURROUND_TILE_SIZE &&
                     p.x <= (range.maxX + 1) * SURROUND_TILE_SIZE,
               );
               assert.ok(
                  p.y >= range.minY * SURROUND_TILE_SIZE &&
                     p.y <= (range.maxY + 1) * SURROUND_TILE_SIZE,
               );
            }
         }
      }
});
