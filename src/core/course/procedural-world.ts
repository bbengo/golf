import { Contract } from '../contracts/contract.js';
import type { Point } from '../contracts/cockpit';
export const WORLD_VERSION = 'purity-world/1';
export type WorldBounds = { minX: number; maxX: number; minY: number; maxY: number };
type Water = { id: string; type: 'water'; polygon: Point[]; waterHeight: number };
export type WorldCourse = {
   world?: { version: string; seed: number; waters: Water[]; terrainVersion?: string };
   bounds: WorldBounds;
   surfaces: { polygon: Point[]; type: string }[];
};
export const worldHash = (x: number, y: number) => {
   let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 839;
   n = Math.imul(n ^ (n >>> 13), 1274126177);
   return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
export const worldNoise = (x: number, y: number) => {
   const ix = Math.floor(x),
      iy = Math.floor(y),
      fx = x - ix,
      fy = y - iy;
   const u = fx * fx * (3 - 2 * fx),
      v = fy * fy * (3 - 2 * fy);
   const a = worldHash(ix, iy),
      b = worldHash(ix + 1, iy),
      c = worldHash(ix, iy + 1),
      d = worldHash(ix + 1, iy + 1);
   return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
// One continuous drainage pattern, sampled identically on both sides of every tile edge.
const drainage = (x: number, y: number) => {
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
   return Math.min(creek, (stream - 24) / 35, (worldNoise(x / 240 + 71, y / 240 - 38) - 0.23) * 15);
};

export function worldEnabled(course: WorldCourse) {
   if (!course.world) return false;
   if (course.world.version !== WORLD_VERSION || course.world.seed !== 839)
      throw Error('Unsupported procedural world contract');
   return true;
}
/** Positive distance outside the authored estate. Keep the playing layout authoritative. */
function clearance(course: WorldCourse, p: Point) {
   const b = course.bounds;
   return Math.hypot(
      Math.max(b.minX - p.x, 0, p.x - b.maxX),
      Math.max(b.minY - p.y, 0, p.y - b.maxY),
   );
}
const waterBounds = new WeakMap<Water, WorldBounds>();
export function worldWater(course: WorldCourse, p: Point): Water | null {
   if (!worldEnabled(course)) return null;
   for (const water of course.world!.waters) {
      let b = waterBounds.get(water);
      if (!b) {
         b = {
            minX: Math.min(...water.polygon.map((p) => p.x)),
            maxX: Math.max(...water.polygon.map((p) => p.x)),
            minY: Math.min(...water.polygon.map((p) => p.y)),
            maxY: Math.max(...water.polygon.map((p) => p.y)),
         };
         waterBounds.set(water, b);
      }
      if (
         p.x >= b.minX &&
         p.x <= b.maxX &&
         p.y >= b.minY &&
         p.y <= b.maxY &&
         Contract.inside(p, water.polygon)
      )
         return water;
   }
   return null;
}
export function worldWetness(course: WorldCourse, x: number, y: number) {
   if (!worldEnabled(course)) return 1;
   if (worldWater(course, { x, y })) return -1;
   return Math.max(drainage(x, y), (28 - clearance(course, { x, y })) / 28);
}
export function worldTree(course: WorldCourse, gx: number, gy: number) {
   if (!worldEnabled(course)) return null;
   const x = gx * 32 + worldHash(gx, gy) * 26,
      y = gy * 32 + worldHash(gx + 27, gy - 18) * 26;
   const canopyRadius = 6 + worldHash(gx - 11, gy + 63) * 9;
   if (
      clearance(course, { x, y }) < canopyRadius + 8 ||
      worldNoise(x / 125, y / 125) < 0.43 ||
      worldWetness(course, x, y) < 0.65
   )
      return null;
   if (
      course.surfaces.some(
         (s) => !['rough', 'deep-rough'].includes(s.type) && Contract.inside({ x, y }, s.polygon),
      )
   )
      return null;
   return {
      id: `world-tree:${gx}:${gy}`,
      kind: 'tree',
      x,
      y,
      canopyRadius,
      trunkRadius: 0.22 + canopyRadius * 0.035,
      canopyBase: 4.5,
      height: 11 + canopyRadius,
   };
}
/** Cell-indexed query, independent of viewport, cache and order of exploration. */
export function worldTrees(course: WorldCourse, bounds: WorldBounds) {
   const trees: NonNullable<ReturnType<typeof worldTree>>[] = [];
   if (!worldEnabled(course)) return trees;
   for (
      let gy = Math.floor((bounds.minY - 16) / 32);
      gy <= Math.floor((bounds.maxY + 16) / 32);
      gy++
   )
      for (
         let gx = Math.floor((bounds.minX - 16) / 32);
         gx <= Math.floor((bounds.maxX + 16) / 32);
         gx++
      ) {
         const tree = worldTree(course, gx, gy);
         if (tree) trees.push(tree);
      }
   return trees;
}
