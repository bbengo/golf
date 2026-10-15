import { Course } from '../course/course.js';
import { worldTrees, worldGroundColour, worldHash } from '../course/procedural-world';
import type { CockpitSession } from '../session/cockpit-session';
import type { Bounds } from './camera';
export type Mesh = { vertices: Float32Array; triangles: number };
const palette: Record<string, number[]> = {
   fairway: [0.46, 0.61, 0.27],
   green: [0.63, 0.74, 0.38],
   tee: [0.55, 0.68, 0.33],
   sand: [0.78, 0.72, 0.56],
   path: [0.64, 0.6, 0.47],
   water: [0.22, 0.43, 0.44],
};
type V = [number, number, number];
/** Bounded preview mesh. Physical coordinates/elevations, never CSS perspective. */
export async function landscapeMesh(
   c: CockpitSession['course'],
   bounds: Bounds,
   step = 8,
   cancelled = () => false,
   textured = false,
): Promise<Mesh> {
   const nx = Math.ceil((bounds.maxX - bounds.minX) / step),
      ny = Math.ceil((bounds.maxY - bounds.minY) / step);
   if (
      !Object.values(bounds).every(Number.isFinite) ||
      !Number.isFinite(step) ||
      step <= 0 ||
      nx < 1 ||
      ny < 1 ||
      nx * ny > 80000 ||
      bounds.maxX - bounds.minX > 4000 ||
      bounds.maxY - bounds.minY > 4000
   )
      throw Error('Invalid preview mesh budget');
   const data: number[] = [];
   let canopyNormal: { centre: V; r: number; rz: number } | null = null;
   const triangle = (a: V, b: V, d: V, colour: number[]) => {
      const u = b.map((v, i) => v - a[i]),
         v = d.map((v, i) => v - a[i]);
      let normal = [
         u[1] * v[2] - u[2] * v[1],
         u[2] * v[0] - u[0] * v[2],
         u[0] * v[1] - u[1] * v[0],
      ];
      const length = Math.hypot(...normal) || 1;
      normal = normal.map((n) => n / length);
      for (const p of [a, b, d]) {
         let n = normal;
         if (canopyNormal) {
            const c = canopyNormal;
            n = [
               (p[0] - c.centre[0]) / (c.r * c.r),
               (p[1] - c.centre[1]) / (c.r * c.r),
               (p[2] - c.centre[2]) / (c.rz * c.rz),
            ];
            const length = Math.hypot(...n) || 1;
            n = n.map((v) => v / length);
         }
         data.push(...p, ...n, ...colour);
      }
   };
   const quad = (a: V, b: V, d: V, e: V, colour: number[]) => {
      triangle(a, b, d, colour);
      triangle(a, d, e, colour);
   };
   const points: V[][] = [];
   for (let j = 0; j <= ny; j++) {
      if (cancelled()) throw Error('Preview closed');
      const row: V[] = [];
      for (let i = 0; i <= nx; i++) {
         const x = bounds.minX + ((bounds.maxX - bounds.minX) * i) / nx,
            y = bounds.minY + ((bounds.maxY - bounds.minY) * j) / ny;
         const surface = Course.surfaceAt(c, { x, y });
         row.push([
            x,
            y,
            surface.type === 'water' ? surface.waterHeight : Course.heightAt(c, { x, y }),
         ]);
      }
      points.push(row);
      if (j % 24 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   }
   for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
         const a = points[j][i],
            b = points[j][i + 1],
            d = points[j + 1][i + 1],
            e = points[j + 1][i];
         const x = (a[0] + d[0]) / 2,
            y = (a[1] + d[1]) / 2;
         const type = Course.surfaceAt(c, { x, y }).type;
         const colour = palette[type] ?? worldGroundColour(c, x, y).map((v: number) => v / 255);
         const variation = type === 'water' ? 1 : 0.95 + worldHash(i, j) * 0.1;
         quad(a, b, d, e, textured ? [-1, 0, 0] : colour.map((v) => v * variation));
      }
   const box = (
      x0: number,
      y0: number,
      z0: number,
      x1: number,
      y1: number,
      z1: number,
      col: number[],
   ) => {
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col);
      quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col);
      quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], col);
      quad([x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], col);
      quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], col);
      quad([x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0], col);
   };
   const trees = [
      ...c.objects.filter((o: { kind: string }) => o.kind === 'tree'),
      ...worldTrees(c, bounds),
   ];
   for (const tree of trees) {
      if (
         tree.x < bounds.minX ||
         tree.x > bounds.maxX ||
         tree.y < bounds.minY ||
         tree.y > bounds.maxY
      )
         continue;
      canopyNormal = null;
      const z = Course.heightAt(c, tree),
         r = tree.canopyRadius;
      box(
         tree.x - tree.trunkRadius,
         tree.y - tree.trunkRadius,
         z,
         tree.x + tree.trunkRadius,
         tree.y + tree.trunkRadius,
         z + tree.canopyBase + 1,
         [0.27, 0.25, 0.17],
      );
      const centre = z + (tree.height + tree.canopyBase) / 2,
         rz = (tree.height - tree.canopyBase) / 2;
      const crown = (latitude: number, angle: number): V => [
         tree.x + Math.cos(latitude) * Math.cos(angle) * r,
         tree.y + Math.cos(latitude) * Math.sin(angle) * r,
         centre + Math.sin(latitude) * rz,
      ];
      const tint = worldHash(Math.floor(tree.x), Math.floor(tree.y));
      const col = [0.23 + tint * 0.09, 0.37 + tint * 0.14, 0.18 + tint * 0.05];
      canopyNormal = { centre: [tree.x, tree.y, centre], r, rz };
      for (let j = 0; j < 6; j++)
         for (let i = 0; i < 16; i++) {
            const a = -Math.PI / 2 + (j * Math.PI) / 6,
               b = a + Math.PI / 6,
               u = (i * Math.PI) / 8,
               v = u + Math.PI / 8;
            quad(crown(a, u), crown(a, v), crown(b, v), crown(b, u), col);
         }
   }
   canopyNormal = null;
   for (const o of c.objects)
      if (o.kind === 'structure' || o.kind === 'bridge')
         box(
            o.minX,
            o.minY,
            o.deckZ - o.thickness,
            o.maxX,
            o.maxY,
            o.deckZ,
            o.kind === 'bridge'
               ? [0.65, 0.57, 0.41]
               : o.part === 'post'
                 ? [0.35, 0.29, 0.19]
                 : [0.46, 0.5, 0.39],
         );
   return { vertices: new Float32Array(data), triangles: data.length / 27 };
}
