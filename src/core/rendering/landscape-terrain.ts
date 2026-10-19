import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Bounds } from './camera';
import { landscapeNormal } from './landscape-lighting';
export const LANDSCAPE_LEAF_LIMIT = 32768;
type Cell = { x: number; y: number; size: number };
/** One adaptive surface, with shared edge vertices at every resolution transition.
 * Integer lattice coordinates keep topology exact; all elevations sample the physical world.
 */
export async function landscapeTerrain(
   course: CockpitSession['course'],
   bounds: Bounds,
   detail?: Bounds,
   cancelled = () => false,
) {
   const valid = (b: Bounds) =>
      Object.values(b).every(Number.isFinite) && b.maxX > b.minX && b.maxY > b.minY;
   if (!valid(bounds) || (detail && !valid(detail)))
      throw Error('Invalid landscape terrain bounds');
   const lattice = 1024,
      base = 8;
   const wx = (x: number) => bounds.minX + (x / lattice) * (bounds.maxX - bounds.minX);
   const wy = (y: number) => bounds.minY + (y / lattice) * (bounds.maxY - bounds.minY);
   let cells: Cell[] = [];
   for (let y = 0; y < lattice; y += base)
      for (let x = 0; x < lattice; x += base) cells.push({ x, y, size: base });
   // Broad levels first keep the transition balanced before spending detail budget.
   for (let level = base; detail && level > 1; level /= 2) {
      const next: Cell[] = [];
      let count = cells.length;
      const centreX = (detail.minX + detail.maxX) / 2,
         centreY = (detail.minY + detail.maxY) / 2;
      cells.sort(
         (a, b) =>
            Math.hypot(wx(a.x + a.size / 2) - centreX, wy(a.y + a.size / 2) - centreY) -
            Math.hypot(wx(b.x + b.size / 2) - centreX, wy(b.y + b.size / 2) - centreY),
      );
      for (const cell of cells) {
         const { x, y, size } = cell;
         const overlaps =
            wx(x) < detail.maxX &&
            wx(x + size) > detail.minX &&
            wy(y) < detail.maxY &&
            wy(y + size) > detail.minY;
         const tooCoarse = Math.max(wx(x + size) - wx(x), wy(y + size) - wy(y)) > 8;
         if (size === level && overlaps && tooCoarse && count + 3 <= LANDSCAPE_LEAF_LIMIT) {
            const half = size / 2;
            for (const dy of [0, half])
               for (const dx of [0, half]) next.push({ x: x + dx, y: y + dy, size: half });
            count += 3;
         } else next.push(cell);
      }
      cells = next;
      if (cancelled()) throw Error('Preview closed');
      await new Promise((resolve) => setTimeout(resolve, 0));
   }
   const rows = new Map<number, Set<number>>(),
      columns = new Map<number, Set<number>>();
   const add = (map: Map<number, Set<number>>, line: number, at: number) => {
      if (!map.has(line)) map.set(line, new Set());
      map.get(line)!.add(at);
   };
   for (const { x, y, size } of cells)
      for (const dx of [0, size])
         for (const dy of [0, size]) {
            add(rows, y + dy, x + dx);
            add(columns, x + dx, y + dy);
         }
   const sorted = (map: Map<number, Set<number>>) =>
      new Map([...map].map(([key, values]) => [key, [...values].sort((a, b) => a - b)]));
   const horizontal = sorted(rows),
      vertical = sorted(columns);
   const cache = new Map<string, number[]>();
   const point = (x: number, y: number) => {
      const key = `${x}:${y}`;
      const old = cache.get(key);
      if (old) return old;
      const p = { x: wx(x), y: wy(y) },
         surface = Course.surfaceAt(course, p);
      const value = [
         p.x,
         p.y,
         surface.type === 'water' ? surface.waterHeight : Course.heightAt(course, p),
         ...landscapeNormal(course, p.x, p.y),
         -1,
         0,
         0,
      ];
      cache.set(key, value);
      return value;
   };
   const vertices: number[] = [];
   let index = 0;
   for (const { x, y, size } of cells) {
      if (cancelled()) throw Error('Preview closed');
      const ring: number[][] = [];
      for (const px of horizontal.get(y)!) if (px >= x && px < x + size) ring.push(point(px, y));
      for (const py of vertical.get(x + size)!)
         if (py >= y && py < y + size) ring.push(point(x + size, py));
      for (const px of [...horizontal.get(y + size)!].reverse())
         if (px > x && px <= x + size) ring.push(point(px, y + size));
      for (const py of [...vertical.get(x)!].reverse())
         if (py > y && py <= y + size) ring.push(point(x, py));
      const centre = point(x + size / 2, y + size / 2);
      for (let i = 0; i < ring.length; i++)
         vertices.push(...centre, ...ring[i], ...ring[(i + 1) % ring.length]);
      if (++index % 512 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   }
   return { vertices: new Float32Array(vertices), leaves: cells.length };
}
