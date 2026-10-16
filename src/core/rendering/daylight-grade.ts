import type { Bounds } from './camera';
import { DAYLIGHT, type Daylight } from './daylight';
/** Fixed estate-relative light endpoints, independent of the current atlas/tile. */
export function daylightGradeLine(reference: Bounds, daylight: Daylight) {
   const sun = DAYLIGHT[daylight];
   const x = (reference.minX + reference.maxX) / 2,
      y = (reference.minY + reference.maxY) / 2;
   const rx = (reference.maxX - reference.minX) / 2 + 350,
      ry = (reference.maxY - reference.minY) / 2 + 350;
   return {
      start: { x: x + sun.x * rx, y: y + sun.y * ry },
      end: { x: x - sun.x * rx, y: y - sun.y * ry },
   };
}
export function paintDaylightGrade(
   ctx: CanvasRenderingContext2D,
   bounds: Bounds,
   reference: Bounds,
   scale: number,
   daylight: Daylight,
) {
   const line = daylightGradeLine(reference, daylight);
   const gradient = ctx.createLinearGradient(
      (line.start.x - bounds.minX) * scale,
      (bounds.maxY - line.start.y) * scale,
      (line.end.x - bounds.minX) * scale,
      (bounds.maxY - line.end.y) * scale,
   );
   gradient.addColorStop(0, DAYLIGHT[daylight].warmth);
   gradient.addColorStop(0.55, '#ebedb200');
   gradient.addColorStop(1, '#123b3620');
   ctx.fillStyle = gradient;
   ctx.fillRect(0, 0, (bounds.maxX - bounds.minX) * scale, (bounds.maxY - bounds.minY) * scale);
}

/** Apply the atlas grade to a bounded square GPU texture without changing its UV orientation.
 * World-to-pixel scaling may differ on each axis for rectangular streamed regions.
 */
export function gradeDaylightPixels(
   pixels: Uint8Array,
   size: number,
   bounds: Bounds,
   reference: Bounds,
   daylight: Daylight,
): Uint8Array {
   if (
      !Number.isInteger(size) ||
      size <= 0 ||
      pixels.length !== size * size * 4 ||
      !Object.values(bounds).every(Number.isFinite) ||
      bounds.maxX <= bounds.minX ||
      bounds.maxY <= bounds.minY
   )
      throw Error('Invalid daylight texture');
   const canvas = document.createElement('canvas');
   canvas.width = canvas.height = size;
   const ctx = canvas.getContext('2d')!;
   const data = ctx.createImageData(size, size);
   data.data.set(pixels);
   ctx.putImageData(data, 0, 0);
   ctx.scale(size / (bounds.maxX - bounds.minX), size / (bounds.maxY - bounds.minY));
   paintDaylightGrade(ctx, bounds, reference, 1, daylight);
   // Keep the raw upload path: no browser-dependent DOM texture vertical flip.
   return new Uint8Array(ctx.getImageData(0, 0, size, size).data.buffer);
}
