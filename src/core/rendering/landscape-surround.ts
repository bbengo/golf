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
const hash = (x: number, y: number) => {
   let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 839;
   n = Math.imul(n ^ (n >>> 13), 1274126177);
   return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
const noise = (x: number, y: number) => {
   const ix = Math.floor(x),
      iy = Math.floor(y),
      fx = x - ix,
      fy = y - iy;
   const u = fx * fx * (3 - 2 * fx),
      v = fy * fy * (3 - 2 * fy);
   const a = hash(ix, iy),
      b = hash(ix + 1, iy),
      c = hash(ix, iy + 1),
      d = hash(ix + 1, iy + 1);
   return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
// One continuous drainage pattern, sampled identically on both sides of every tile edge.
const wetness = (x: number, y: number) => {
   const stream = Math.abs(x + 460 - Math.sin(y * 0.004) * 90 - Math.sin(y * 0.011) * 18);
   // Continue this estate's remote creek banks with the same curve as the detailed surround.
   // These starts are already outside the playable bounds of woodland revision 0.2.
   let creek = Infinity;
   if (y >= 720 || y <= -190) {
      const north = y >= 720;
      const t = north ? (y - 720) / 305 : (-190 - y) / 295;
      const spread = Math.min(t, 1);
      const center = (north ? 203.5 : 165.5) + Math.sin(t * 5) * 35 * spread;
      const halfWidth = (north ? 7.5 : 6.5) + spread * 8;
      creek = (Math.abs(x - center) - halfWidth) / 18;
   }
   return Math.min(creek, (stream - 24) / 35, (noise(x / 240 + 71, y / 240 - 38) - 0.23) * 15);
};

/** Low-resolution, bounded-memory scenery behind the authoritative course atlas. */
export class LandscapeSurround {
   private tiles = new Map<string, HTMLCanvasElement>();
   private daylight: Daylight | undefined;
   private crowns: HTMLCanvasElement[] = [];
   paint(ctx: CanvasRenderingContext2D, camera: CourseCamera, daylight: Daylight, core: Bounds) {
      if (this.daylight !== daylight) {
         this.daylight = daylight;
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
            const wet = wetness(x, y),
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
      // Include neighbours so a canopy or shadow crossing a tile edge is rendered on both tiles.
      for (
         let gy = Math.floor((ty * size - 70) / 32);
         gy <= Math.ceil(((ty + 1) * size + 70) / 32);
         gy++
      )
         for (
            let gx = Math.floor((tx * size - 70) / 32);
            gx <= Math.ceil(((tx + 1) * size + 70) / 32);
            gx++
         ) {
            const x = gx * 32 + hash(gx, gy) * 26,
               y = gy * 32 + hash(gx + 27, gy - 18) * 26;
            if (noise(x / 125, y / 125) < 0.43 || wetness(x, y) < 0.65) continue;
            const r = 6 + hash(gx - 11, gy + 63) * 9;
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
            const stamp = this.crowns[Math.floor(hash(gx + 48, gy + 93) * this.crowns.length)];
            ctx.drawImage(stamp, px - r * factor, py - r * factor, r * 2 * factor, r * 2 * factor);
         }
      return tile;
   }
}
