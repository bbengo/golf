import {
   worldHash as hash,
   worldNoise as noise,
   worldWetness,
   worldTrees,
   type WorldCourse,
} from '../course/procedural-world';
import { waterColour } from './water-material';
import type { CourseCamera, Bounds } from './camera';
import { canopyStamp } from './terrain-detail';
import { DAYLIGHT, type Daylight } from './daylight';

export const SURROUND_TILE_SIZE = 512;
/** Covers the inverse-projected viewport, including rotated and offset cameras. */
export function surroundTileRange(camera: CourseCamera) {
   const points = [
      [0, 0],
      [camera.w, 0],
      [0, camera.h],
      [camera.w, camera.h],
   ].map(([x, y]) => camera.inverse({ x, y }));
   return {
      minX: Math.floor(Math.min(...points.map((p) => p.x)) / SURROUND_TILE_SIZE),
      maxX: Math.floor(Math.max(...points.map((p) => p.x)) / SURROUND_TILE_SIZE),
      minY: Math.floor(Math.min(...points.map((p) => p.y)) / SURROUND_TILE_SIZE),
      maxY: Math.floor(Math.max(...points.map((p) => p.y)) / SURROUND_TILE_SIZE),
   };
}
/** Low-resolution, bounded-memory scenery behind the authoritative course atlas. */
export class LandscapeSurround {
   private tiles = new Map<string, HTMLCanvasElement>();
   private daylight: Daylight | undefined;
   private course: WorldCourse | undefined;
   private crowns: HTMLCanvasElement[] = [];
   paint(
      ctx: CanvasRenderingContext2D,
      camera: CourseCamera,
      daylight: Daylight,
      core: Bounds,
      course: WorldCourse,
   ) {
      if (this.daylight !== daylight || this.course !== course) {
         this.daylight = daylight;
         this.course = course;
         this.tiles.clear();
         this.crowns = Array.from({ length: 6 }, (_, i) => canopyStamp(i, DAYLIGHT[daylight]));
      }
      // Opaque undercoat prevents fractional rotated tile edges from exposing transparency.
      ctx.fillStyle = '#51763e';
      ctx.fillRect(0, 0, camera.w, camera.h);
      const range = surroundTileRange(camera),
         size = SURROUND_TILE_SIZE;
      const origin = camera.world({ x: 0, y: 0 });
      ctx.save();
      ctx.translate(origin.x, origin.y);
      ctx.rotate(-camera.angle);
      ctx.scale(camera.scale, camera.scale);
      for (let y = range.minY; y <= range.maxY; y++)
         for (let x = range.minX; x <= range.maxX; x++) {
            // Fully covered patches do not need generation or painting.
            if (
               x * size >= core.minX &&
               (x + 1) * size <= core.maxX &&
               y * size >= core.minY &&
               (y + 1) * size <= core.maxY
            )
               continue;
            const key = `${x}:${y}`;
            let tile = this.tiles.get(key);
            if (!tile) tile = this.build(x, y, daylight);
            this.tiles.delete(key);
            this.tiles.set(key, tile);
            if (this.tiles.size > 64) this.tiles.delete(this.tiles.keys().next().value!);
            ctx.drawImage(
               tile,
               x * size,
               -(y + 1) * size,
               size + 0.15 / camera.scale,
               size + 0.15 / camera.scale,
            );
         }
      ctx.restore();
   }
   private build(tx: number, ty: number, daylight: Daylight) {
      const size = SURROUND_TILE_SIZE,
         resolution = 256,
         factor = resolution / size;
      const tile = document.createElement('canvas');
      tile.width = tile.height = resolution;
      const ctx = tile.getContext('2d')!,
         pixels = ctx.createImageData(resolution, resolution);
      const sun = DAYLIGHT[daylight];
      for (let py = 0; py < resolution; py++)
         for (let px = 0; px < resolution; px++) {
            const x = tx * size + (px + 0.5) / factor,
               y = (ty + 1) * size - (py + 0.5) / factor;
            const wet = worldWetness(this.course!, x, y),
               n = noise(x / 65, y / 65) - 0.5;
            const fine = (hash(Math.floor(x), Math.floor(y)) - 0.5) * (wet < 0 ? 1.5 : 9);
            let colour: number[];
            if (wet < 0) colour = waterColour(x, y, -wet * 28, daylight);
            else if (wet < 0.12) colour = [114 + n * 20, 121 + n * 20, 90 + n * 15];
            else colour = [75 + n * 35, 111 + n * 38, 57 + n * 23];
            const warmth = wet < 0 || daylight === 'day' ? 0 : 5;
            pixels.data.set(
               [colour[0] + fine + warmth, colour[1] + fine, colour[2] + fine - warmth, 255],
               (py * resolution + px) * 4,
            );
         }
      ctx.putImageData(pixels, 0, 0);
      // Query the same deterministic trees used by swept ball collisions.
      for (const tree of worldTrees(this.course!, {
         minX: tx * size - 70,
         maxX: (tx + 1) * size + 70,
         minY: ty * size - 70,
         maxY: (ty + 1) * size + 70,
      })) {
         const { x, y, canopyRadius: r } = tree;
         const px = (x - tx * size) * factor,
            py = ((ty + 1) * size - y) * factor;
         ctx.fillStyle = '#10251e45';
         ctx.beginPath();
         ctx.ellipse(
            px - r * sun.x * sun.length * factor,
            py + r * sun.y * sun.length * factor,
            r * factor,
            r * 0.85 * factor,
            0,
            0,
            Math.PI * 2,
         );
         ctx.fill();
         const stamp =
            this.crowns[Math.floor(hash(Math.floor(x), Math.floor(y)) * this.crowns.length)];
         ctx.drawImage(stamp, px - r * factor, py - r * factor, r * 2 * factor, r * 2 * factor);
      }
      return tile;
   }
}
