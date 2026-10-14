import { Contract } from '../contracts/contract.js';
import { drainageWetness, type WorldCourse } from './procedural-world';
import type { Point } from '../contracts/cockpit';
export const WATER_VERSION = 'purity-water/1';
export type Hydrology = {
   version: string;
   level: number;
   north: { y: number; level: number };
   south: { y: number; level: number };
};
const smooth = (v: number) => {
   const t = Math.max(0, Math.min(1, v));
   return t * t * (3 - 2 * t);
};
const bounds = new WeakMap<object, { minX: number; maxX: number; minY: number; maxY: number }>();
/** One elevation field for all outer water, including overlapping shapes. */
export function waterElevation(c: WorldCourse, p: Point): number {
   const h = c.world?.hydrology;
   if (
      !h ||
      h.version !== WATER_VERSION ||
      ![h.level, h.north.y, h.north.level, h.south.y, h.south.level].every(Number.isFinite)
   )
      throw Error('Unsupported water contract');
   const north = p.y > c.bounds.maxY;
   const end = north ? h.north : h.south;
   const distance = north ? p.y - end.y : end.y - p.y;
   // Anchor the creek outlet to its source level, then grade to the shared basin.
   const channelWeight = 1 - smooth((Math.abs(p.x - 190) - 35) / 85);
   const outletWeight = 1 - smooth(Math.max(0, distance) / 240);
   return h.level + (end.level - h.level) * channelWeight * outletWeight;
}
/** Signed union distance (metres); implicit drainage remains a field approximation. */
export function waterShore(c: WorldCourse, p: Point): number {
   let nearest = drainageWetness(c, p.x, p.y) * 28;
   for (const lake of c.world!.waters) {
      let b = bounds.get(lake);
      if (!b) {
         b = {
            minX: Math.min(...lake.polygon.map((q) => q.x)) - 30,
            maxX: Math.max(...lake.polygon.map((q) => q.x)) + 30,
            minY: Math.min(...lake.polygon.map((q) => q.y)) - 30,
            maxY: Math.max(...lake.polygon.map((q) => q.y)) + 30,
         };
         bounds.set(lake, b);
      }
      if (p.x < b.minX || p.x > b.maxX || p.y < b.minY || p.y > b.maxY) continue;
      let distance = Infinity;
      for (let i = 0; i < lake.polygon.length; i++) {
         const a = lake.polygon[i],
            b = lake.polygon[(i + 1) % lake.polygon.length],
            dx = b.x - a.x,
            dy = b.y - a.y;
         const t = Math.max(
            0,
            Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)),
         );
         distance = Math.min(distance, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
      }
      nearest = Math.min(nearest, Contract.inside(p, lake.polygon) ? -distance : distance);
   }
   return nearest;
}
