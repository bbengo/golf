import { foliageTone } from './foliage-material';
import { landscapeNormal } from './landscape-lighting';
import type { Point } from '../contracts/cockpit';
import { Course } from '../course/course.js';
import { worldTrees, worldGroundColour, worldHash } from '../course/procedural-world';
import type { CockpitSession } from '../session/cockpit-session';
import type { Bounds } from './camera';
export type Mesh = {
   vertices: Float32Array;
   triangles: number;
   terrainTriangles: number;
   refinedCells: number;
};
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
   objectsOnly = false,
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
   const groundNormals = new Map<string, [number, number, number]>();
   let drawingGround = true;
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
         if (drawingGround) {
            const key = `${p[0]}:${p[1]}`;
            let cached = groundNormals.get(key);
            if (!cached) {
               cached = landscapeNormal(c, p[0], p[1]);
               groundNormals.set(key, cached);
            }
            n = cached;
         }
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
         const tint = canopyNormal
            ? foliageTone(p, canopyNormal.centre, canopyNormal.r, canopyNormal.rz)
            : 1;
         data.push(...p, ...n, ...colour.map((v) => v * tint));
      }
   };
   const quad = (a: V, b: V, d: V, e: V, colour: number[]) => {
      triangle(a, b, d, colour);
      triangle(a, d, e, colour);
   };
   let refinedCells = 0;
   if (!objectsOnly) {
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
      // Shared half-grid samples stitch every refined edge to its coarse neighbour.
      const samples = new Map<string, V>();
      const sample = (i: number, j: number): V => {
         if (Number.isInteger(i) && Number.isInteger(j)) return points[j][i];
         const key = `${i}:${j}`;
         const existing = samples.get(key);
         if (existing) return existing;
         const x = bounds.minX + ((bounds.maxX - bounds.minX) * i) / nx,
            y = bounds.minY + ((bounds.maxY - bounds.minY) * j) / ny;
         const surface = Course.surfaceAt(c, { x, y });
         const p: V = [
            x,
            y,
            surface.type === 'water' ? surface.waterHeight : Course.heightAt(c, { x, y }),
         ];
         samples.set(key, p);
         return p;
      };
      const refined = new Uint8Array(nx * ny);
      for (let j = 0; j < ny; j++)
         for (let i = 0; i < nx; i++) {
            const centre = sample(i + 0.5, j + 0.5);
            const average =
               (points[j][i][2] +
                  points[j][i + 1][2] +
                  points[j + 1][i][2] +
                  points[j + 1][i + 1][2]) /
               4;
            const nearPlace = (c.places ?? []).some(
               (p: Point) => Math.hypot(p.x - centre[0], p.y - centre[1]) < 45,
            );
            if (refinedCells < 12000 && (nearPlace || Math.abs(centre[2] - average) > 0.18)) {
               refined[j * nx + i] = 1;
               refinedCells++;
            }
         }
      const detail = (i: number, j: number) =>
         i >= 0 && i < nx && j >= 0 && j < ny && refined[j * nx + i] === 1;
      for (let j = 0; j < ny; j++) {
         if (cancelled()) throw Error('Preview closed');
         for (let i = 0; i < nx; i++) {
            const a = sample(i, j),
               b = sample(i + 1, j),
               d = sample(i + 1, j + 1),
               e = sample(i, j + 1),
               centre = sample(i + 0.5, j + 0.5);
            const own = detail(i, j);
            const edges = [
               own || detail(i, j - 1),
               own || detail(i + 1, j),
               own || detail(i, j + 1),
               own || detail(i - 1, j),
            ];
            let colour: number[] = [-1, 0, 0];
            if (!textured) {
               const type = Course.surfaceAt(c, { x: centre[0], y: centre[1] }).type;
               colour =
                  palette[type] ??
                  worldGroundColour(c, centre[0], centre[1]).map((v: number) => v / 255);
            }
            if (!edges.some(Boolean)) quad(a, b, d, e, colour);
            else {
               const ring = [
                  a,
                  ...(edges[0] ? [sample(i + 0.5, j)] : []),
                  b,
                  ...(edges[1] ? [sample(i + 1, j + 0.5)] : []),
                  d,
                  ...(edges[2] ? [sample(i + 0.5, j + 1)] : []),
                  e,
                  ...(edges[3] ? [sample(i, j + 0.5)] : []),
               ];
               for (let k = 0; k < ring.length; k++)
                  triangle(centre, ring[k], ring[(k + 1) % ring.length], colour);
            }
         }
         if (j % 24 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      }
   }
   const terrainTriangles = data.length / 27;
   drawingGround = false;
   groundNormals.clear();
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
   let treeIndex = 0;
   for (const tree of trees) {
      if (treeIndex++ % 48 === 0) {
         await new Promise((resolve) => setTimeout(resolve, 0));
         if (cancelled()) throw Error('Preview closed');
      }
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
      const phase = worldHash(Math.floor(tree.x), Math.floor(tree.y)) * Math.PI * 2;
      const crown = (latitude: number, angle: number): V => {
         const lobe =
            0.83 + 0.17 * (0.5 + 0.5 * Math.cos(angle * 4 + phase) * Math.cos(latitude * 3));
         return [
            tree.x + Math.cos(latitude) * Math.cos(angle) * r * lobe,
            tree.y + Math.cos(latitude) * Math.sin(angle) * r * lobe,
            centre + Math.sin(latitude) * rz,
         ];
      };
      const tint = worldHash(Math.floor(tree.x), Math.floor(tree.y));
      const col = [0.23 + tint * 0.09, 0.37 + tint * 0.14, 0.18 + tint * 0.05];
      canopyNormal = { centre: [tree.x, tree.y, centre], r, rz };
      for (let j = 0; j < 6; j++)
         for (let i = 0; i < 16; i++) {
            const a = -Math.PI / 2 + (j * Math.PI) / 6,
               b = a + Math.PI / 6,
               u = (i * Math.PI) / 8,
               v = u + Math.PI / 8;
            // Pole quads collapse one triangle to zero area. Emit only the fan.
            if (j === 0) triangle(crown(a, 0), crown(b, v), crown(b, u), col);
            else if (j === 5) triangle(crown(a, u), crown(a, v), crown(b, 0), col);
            else quad(crown(a, u), crown(a, v), crown(b, v), crown(b, u), col);
         }
   }
   canopyNormal = null;
   for (const o of c.objects)
      if (
         (o.kind === 'structure' || o.kind === 'bridge') &&
         o.maxX >= bounds.minX &&
         o.minX <= bounds.maxX &&
         o.maxY >= bounds.minY &&
         o.minY <= bounds.maxY
      )
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
   const seenGrass = new Set<string>();
   for (const place of c.places ?? [])
      for (let gy = Math.floor((place.y - 42) / 3); gy <= Math.ceil((place.y + 42) / 3); gy++)
         for (let gx = Math.floor((place.x - 42) / 3); gx <= Math.ceil((place.x + 42) / 3); gx++) {
            const key = `${gx}:${gy}`;
            if (seenGrass.has(key)) continue;
            seenGrass.add(key);
            const x = gx * 3 + worldHash(gx, gy) * 2,
               y = gy * 3 + worldHash(gx + 41, gy - 12) * 2;
            if (
               x < bounds.minX ||
               x > bounds.maxX ||
               y < bounds.minY ||
               y > bounds.maxY ||
               Course.surfaceAt(c, { x, y }).type !== 'rough'
            )
               continue;
            const z = Course.heightAt(c, { x, y }),
               height = 0.25 + worldHash(gx - 31, gy + 9) * 0.4;
            for (let blade = 0; blade < 3; blade++) {
               const angle = (blade * Math.PI) / 3 + worldHash(gx, gy) * 2,
                  dx = Math.cos(angle) * 0.07,
                  dy = Math.sin(angle) * 0.07;
               triangle(
                  [x - dx, y - dy, z],
                  [x + dx, y + dy, z],
                  [x + dx * 2, y + dy * 2, z + height],
                  [0.4, 0.51, 0.23],
               );
               triangle(
                  [x + dx, y + dy, z],
                  [x - dx, y - dy, z],
                  [x + dx * 2, y + dy * 2, z + height],
                  [0.37, 0.48, 0.21],
               );
            }
         }
   return {
      vertices: new Float32Array(data),
      triangles: data.length / 27,
      terrainTriangles,
      refinedCells,
   };
}
