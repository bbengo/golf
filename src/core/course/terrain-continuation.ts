import { waterShore, waterElevation } from './water-system';
import { DEM } from './dem.js';
import { Contract } from '../contracts/contract.js';
import { worldNoise, type WorldCourse } from './procedural-world';
import type { Point } from '../contracts/cockpit';

export const TERRAIN_VERSION = 'purity-terrain/1';
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => {
   const t = clamp(x, 0, 1);
   return t * t * (3 - 2 * t);
};
const lakeBounds = new WeakMap<
   object,
   { minX: number; maxX: number; minY: number; maxY: number }
>();
type TerrainCourse = WorldCourse & { terrain: Parameters<typeof DEM.heightAt>[0] };

/** Preserve the source exactly, then continue its one-sided edge derivatives. */
export function continuedHeight(course: TerrainCourse, p: Point): number {
   const t = course.terrain,
      g = t.grid;
   const x = clamp(p.x, g.originX, g.originX + (g.width - 1) * g.step);
   const y = clamp(p.y, g.originY, g.originY + (g.height - 1) * g.step);
   const dx = p.x - x,
      dy = p.y - y;
   const z = DEM.heightAt(t, { x, y });
   if (!dx && !dy) return z;
   // A short inward sample avoids the original adapter's zero outside derivative.
   const e = 0.01;
   const sx = Math.sign(dx),
      sy = Math.sign(dy);
   const zx = dx ? DEM.heightAt(t, { x: x - sx * e, y }) : z;
   const zy = dy ? DEM.heightAt(t, { x, y: y - sy * e }) : z;
   const gx = dx ? (z - zx) / (sx * e) : 0;
   const gy = dy ? (z - zy) / (sy * e) : 0;
   const mixed =
      dx && dy
         ? (z - zx - zy + DEM.heightAt(t, { x: x - sx * e, y: y - sy * e })) / (sx * sy * e * e)
         : 0;
   // Saturation prevents an edge grade becoming an unbounded ramp kilometres away.
   const reach = (d: number) => Math.sign(d) * 80 * -Math.expm1(-Math.abs(d) / 80);
   const ex = reach(dx),
      ey = reach(dy);
   const relief = (worldNoise(p.x / 260 + 19, p.y / 260 - 7) - 0.5) * 7;
   return z + gx * ex + gy * ey + mixed * ex * ey + smooth(Math.hypot(dx, dy) / 180) * relief;
}

/** Outer lake beds and banks; authored playing terrain and creek elevations stay intact. */
export function worldHeight(course: TerrainCourse, p: Point): number {
   if (course.world?.terrainVersion !== TERRAIN_VERSION)
      throw Error('Unsupported procedural terrain contract');
   const base = continuedHeight(course, p),
      b = course.bounds;
   const clearance = Math.hypot(
      Math.max(b.minX - p.x, 0, p.x - b.maxX),
      Math.max(b.minY - p.y, 0, p.y - b.maxY),
   );
   if (!clearance) return base;
   if (course.world.hydrology) {
      const distance = waterShore(course, p);
      if (distance >= 30) return base;
      const target = waterElevation(course, p) + 2 * Math.tanh(distance / 12);
      const weight =
         (distance < 0 ? 1 : 1 - smooth(distance / 30)) *
         smooth(
            Math.hypot(
               Math.max(
                  course.terrain.grid.originX - p.x,
                  0,
                  p.x -
                     course.terrain.grid.originX -
                     (course.terrain.grid.width - 1) * course.terrain.grid.step,
               ),
               Math.max(
                  course.terrain.grid.originY - p.y,
                  0,
                  p.y -
                     course.terrain.grid.originY -
                     (course.terrain.grid.height - 1) * course.terrain.grid.step,
               ),
            ) / 24,
         );
      return base + (target - base) * weight;
   }
   let bed = base,
      influence = 0;
   for (const lake of course.world.waters) {
      if (!lake.id.startsWith('world-lake-')) continue;
      // Reject distant samples before visiting polygon edges.
      let bounds = lakeBounds.get(lake);
      if (!bounds) {
         bounds = {
            minX: Math.min(...lake.polygon.map((q) => q.x)) - 30,
            maxX: Math.max(...lake.polygon.map((q) => q.x)) + 30,
            minY: Math.min(...lake.polygon.map((q) => q.y)) - 30,
            maxY: Math.max(...lake.polygon.map((q) => q.y)) + 30,
         };
         lakeBounds.set(lake, bounds);
      }
      if (p.x < bounds.minX || p.x > bounds.maxX || p.y < bounds.minY || p.y > bounds.maxY)
         continue;
      let distance = Infinity;
      for (let i = 0; i < lake.polygon.length; i++) {
         const a = lake.polygon[i],
            c = lake.polygon[(i + 1) % lake.polygon.length];
         const ux = c.x - a.x,
            uy = c.y - a.y;
         const f = clamp(((p.x - a.x) * ux + (p.y - a.y) * uy) / (ux * ux + uy * uy || 1), 0, 1);
         distance = Math.min(distance, Math.hypot(p.x - a.x - f * ux, p.y - a.y - f * uy));
      }
      const inside = Contract.inside(p, lake.polygon);
      if (!inside && distance >= 30) continue;
      const signed = inside ? -distance : distance;
      const target = lake.waterHeight + 2 * Math.tanh(signed / 12);
      const weight = (inside ? 1 : 1 - smooth(distance / 30)) * smooth(clearance / 24);
      // A deterministic strongest-bank rule avoids accumulating multiple excavation offsets.
      if (weight > influence) {
         influence = weight;
         bed = target;
      }
   }
   return base + (bed - base) * influence;
}
