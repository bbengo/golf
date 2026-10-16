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
