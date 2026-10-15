import type { Structure, EstatePlace } from '../course/estate-landmarks';
import { DAYLIGHT, type Daylight } from './daylight';
import type { Point } from '../contracts/cockpit';
/** Render the same flat decks and solid cabins used by collision, in atlas coordinates. */
export function paintEstateLandmarks(
   ctx: CanvasRenderingContext2D,
   objects: Structure[],
   places: EstatePlace[],
   point: (p: Point) => Point,
   scale: number,
   daylight: Daylight,
   shadowsOnly = false,
) {
   const sun = DAYLIGHT[daylight];
   for (const o of objects) {
      if (o.kind !== 'structure' || o.part === 'post') continue;
      const p = point({ x: o.minX, y: o.maxY });
      const w = (o.maxX - o.minX) * scale,
         h = (o.maxY - o.minY) * scale;
      const dx = -sun.x * 4 * sun.length * scale,
         dy = sun.y * 4 * sun.length * scale;
      ctx.fillStyle = '#14281c65';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + w, p.y);
      ctx.lineTo(p.x + w + dx, p.y + h + dy);
      ctx.lineTo(p.x + dx, p.y + h + dy);
      ctx.closePath();
      ctx.fill();
      if (shadowsOnly) continue;
      ctx.fillStyle = o.part === 'cabin' ? '#505b50' : '#8b9178';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#d1c7a5';
      ctx.lineWidth = 0.35 * scale;
      ctx.strokeRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#283c3760';
      ctx.lineWidth = 0.15 * scale;
      for (let y = 1; y < o.maxY - o.minY; y += 1) {
         ctx.beginPath();
         ctx.moveTo(p.x, p.y + y * scale);
         ctx.lineTo(p.x + w, p.y + y * scale);
         ctx.stroke();
      }
      // Low-profile timber edge; no invented pitched roof or false terrain height.
      ctx.fillStyle = '#293d32';
      ctx.fillRect(p.x, p.y + h - 0.4 * scale, w, 0.4 * scale);
   }
   for (const place of places) {
      if (place.id !== 'welcome') continue;
      const p = point({ x: place.x, y: place.y - 9 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${2.5 * scale}px Onest, sans-serif`;
      ctx.fillStyle = '#354d3b';
      ctx.fillText('purity', p.x, p.y);
      ctx.restore();
   }
}
