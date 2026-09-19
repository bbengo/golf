import { Contract } from '../contracts/contract.js';
import { HoleVisual } from './hole.js';
import { Course } from './course.js';
import type { Point } from '../contracts/cockpit';

export const PURITY_COURSE_REVISION = 'purity-woodland/0.2.0';
const interpolate = (a: Point, b: Point, c: Point, d: Point, t: number): Point => ({
   x:
      0.5 *
      (2 * b.x +
         (-a.x + c.x) * t +
         (2 * a.x - 5 * b.x + 4 * c.x - d.x) * t * t +
         (-a.x + 3 * b.x - 3 * c.x + d.x) * t * t * t),
   y:
      0.5 *
      (2 * b.y +
         (-a.y + c.y) * t +
         (2 * a.y - 5 * b.y + 4 * c.y - d.y) * t * t +
         (-a.y + 3 * b.y - 3 * c.y + d.y) * t * t * t),
});
function smooth(points: Point[]) {
   const result: Point[] = [];
   for (let i = 0; i < points.length - 1; i++)
      for (let j = 0; j < 4; j++)
         result.push(
            interpolate(
               points[Math.max(0, i - 1)],
               points[i],
               points[i + 1],
               points[Math.min(points.length - 1, i + 2)],
               j / 4,
            ),
         );
   result.push(points[points.length - 1]);
   return result;
}
function bunker(x: number, y: number, rx: number, ry: number, phase: number) {
   return Array.from({ length: 64 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2,
         r = 1 + 0.14 * Math.sin(a * 3 + phase) + 0.06 * Math.cos(a * 5);
      return { x: x + Math.cos(a) * rx * r, y: y + Math.sin(a) * ry * r };
   });
}
function ribbon(points: Point[], width: number) {
   const line = smooth(smooth(points));
   const banks = line.map((p, i) => {
      const a = line[Math.max(0, i - 1)],
         b = line[Math.min(line.length - 1, i + 1)];
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = (-(b.y - a.y) / length) * width,
         ny = ((b.x - a.x) / length) * width;
      return [
         { x: p.x + nx, y: p.y + ny },
         { x: p.x - nx, y: p.y - ny },
      ];
   });
   const cap = (end: number, neighbour: number) => {
      const p = line[end],
         q = line[neighbour];
      const heading = Math.atan2(p.y - q.y, p.x - q.x);
      return Array.from({ length: 17 }, (_, i) => {
         const a = heading + Math.PI / 2 - (i * Math.PI) / 16;
         return { x: p.x + Math.cos(a) * width, y: p.y + Math.sin(a) * width };
      });
   };
   const closed = points[0].x === points.at(-1)!.x && points[0].y === points.at(-1)!.y;
   return [
      ...banks.map((b) => b[0]),
      ...(closed ? [] : cap(line.length - 1, line.length - 2)),
      ...banks.map((b) => b[1]).reverse(),
      ...(closed ? [] : cap(0, 1)),
   ];
}

/** A versioned Purity layout. All authored features enter both rendering and simulation. */
export function createPurityCourse() {
   const c = Contract.clone(HoleVisual.course);
   c.id = 'purity-creek-woodland';
   c.revision = PURITY_COURSE_REVISION;
   c.provenance = {
      ...c.provenance,
      kind: 'synthetic_design',
      author: 'Purity woodland study',
      sourceCourse: HoleVisual.course.id,
   };
   const water = c.surfaces.filter((s: { type: string }) => s.type === 'water');
   const left = smooth([
      { x: 196, y: 720 },
      { x: 203, y: 646 },
      ...water.map((s: { polygon: Point[] }) => s.polygon[0]),
      water.at(-1).polygon[1],
      { x: 129, y: 92 },
      { x: 155, y: 25 },
      { x: 134, y: -68 },
      { x: 159, y: -190 },
   ]);
   const right = smooth([
      { x: 211, y: 720 },
      { x: 218, y: 646 },
      ...water.map((s: { polygon: Point[] }) => s.polygon[3]),
      water.at(-1).polygon[2],
      { x: 139, y: 92 },
      { x: 166, y: 25 },
      { x: 146, y: -68 },
      { x: 172, y: -190 },
   ]);
   c.surfaces = c.surfaces.filter((s: { type: string }) => s.type !== 'water');
   for (let i = 0; i < left.length - 1; i++)
      c.surfaces.push({
         id: `woodland-creek-${i}`,
         type: 'water',
         polygon: [left[i], left[i + 1], right[i + 1], right[i]],
         waterHeight:
            water[Math.max(0, Math.min(water.length - 1, Math.floor(i / 4) - 2))].waterHeight,
         provenance: 'Purity smoothed bank geometry; shared with the renderer',
      });
   for (const [id, x, y, rx, ry, phase] of [
      ['approach', 72, 267, 7, 16, 0.5],
      ['shoulder', 111, 355, 8, 17, 1.8],
      ['greenside', 144, 501, 8, 12, 2.4],
   ] as const) {
      c.surfaces.push({
         id: `purity-bunker-${id}`,
         type: 'sand',
         polygon: bunker(x, y, rx, ry, phase),
      });
   }
   // The neighbouring practice lawns and estate hazards are real surfaces, not extra holes.
   for (const [id, points, width] of [
      [
         'west',
         [
            [-55, 20],
            [-82, 95],
            [-43, 175],
            [-59, 260],
         ],
         26,
      ],
      [
         'east',
         [
            [292, 50],
            [334, 135],
            [298, 220],
            [328, 315],
            [301, 391],
         ],
         34,
      ],
   ] as const) {
      c.surfaces.push({
         id: `estate-lawn-${id}`,
         type: 'fairway',
         polygon: ribbon(
            points.map(([x, y]) => ({ x, y })),
            width,
         ),
         provenance: 'Purity estate practice lawn; no additional playable cup',
      });
   }
   for (const [id, x, y, rx, ry] of [
      ['west', -76, 434, 55, 78],
      ['east', 354, 507, 43, 63],
   ] as const) {
      c.surfaces.push({
         id: `estate-lake-${id}`,
         type: 'water',
         polygon: bunker(x, y, rx, ry, 1.4),
         waterHeight: Course.heightAt(c, { x, y }),
         provenance: 'Authored estate lake; water elevation sampled at centre',
      });
   }
   for (const [id, x, y, rx, ry] of [
      ['west', -18, 217, 11, 21],
      ['east', 364, 324, 12, 23],
   ] as const)
      c.surfaces.push({ id: `estate-sand-${id}`, type: 'sand', polygon: bunker(x, y, rx, ry, 2) });
   const estatePath = [
      [-145, -65],
      [-157, 140],
      [-149, 470],
      [-40, 602],
      [185, 624],
      [393, 555],
      [410, 320],
      [386, 57],
      [242, -74],
      [10, -99],
      [-145, -65],
   ].map(([x, y]) => ({ x, y }));
   c.surfaces.push({
      id: 'estate-walk',
      type: 'path',
      polygon: ribbon(estatePath, 3.2),
      provenance: 'Shared visual and physical estate path',
   });
   let seed = 90417;
   const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
   };
   const clusters = [
      [-48, 40, 85, 90],
      [-35, 230, 90, 110],
      [15, 420, 100, 90],
      [113, 604, 115, 75],
      [330, 495, 78, 100],
      [327, 277, 72, 105],
      [290, 75, 83, 92],
   ];
   let n = 0;
   for (const [x, y, rx, ry] of clusters)
      for (let i = 0; i < 48; i++) {
         const a = random() * Math.PI * 2,
            r = Math.sqrt(random()),
            p = { x: x + Math.cos(a) * rx * r, y: y + Math.sin(a) * ry * r };
         const radius = 4 + random() * 5.5;
         if (
            !Course.inBounds(c, p) ||
            !['rough', 'deep-rough'].includes(Course.surfaceAt(c, p).type)
         )
            continue;
         if (
            c.objects.some(
               (o: { kind: string; x: number; y: number; canopyRadius: number }) =>
                  o.kind === 'tree' &&
                  Math.hypot(o.x - p.x, o.y - p.y) < (o.canopyRadius + radius) * 0.72,
            )
         )
            continue;
         // Keep a generous clear route around every authored tee and pin.
         if (
            Object.values(c.tees).some(
               (v: any) => Math.hypot(v.point.x - p.x, v.point.y - p.y) < 32,
            ) ||
            Math.hypot(c.greenCenter.x - p.x, c.greenCenter.y - p.y) < 43
         )
            continue;
         c.objects.push({
            id: `woodland-tree-${n++}`,
            kind: 'tree',
            ...p,
            trunkRadius: 0.22 + radius * 0.035,
            canopyRadius: radius,
            canopyBase: 4.5,
            height: 11 + radius,
            provenance: 'Purity authored woodland; physical trunk and canopy',
         });
      }
   return c;
}
