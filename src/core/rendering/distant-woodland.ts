import { foliageTone } from './foliage-material';
import { Course } from '../course/course.js';
import { worldTree, worldHash } from '../course/procedural-world';
import { ECOLOGY_VERSION } from '../course/landscape-regions';
import type { CockpitSession } from '../session/cockpit-session';
import type { Bounds } from './camera';

/** Stable power-of-two thinning of real world trees, never decorative new colliders. */
export async function distantTrees(
   c: CockpitSession['course'],
   bounds: Bounds,
   cancelled = () => false,
   detail?: Bounds,
) {
   if (
      !Object.values(bounds).every(Number.isFinite) ||
      bounds.maxX <= bounds.minX ||
      bounds.maxY <= bounds.minY
   )
      throw Error('Invalid distant woodland bounds');
   if (
      detail &&
      (!Object.values(detail).every(Number.isFinite) ||
         detail.maxX <= detail.minX ||
         detail.maxY <= detail.minY)
   )
      throw Error('Invalid woodland detail bounds');
   const cell = c.world?.ecologyVersion === ECOLOGY_VERSION ? 20 : 32;
   let stride = 1;
   const range = () => ({
      x0: Math.ceil(bounds.minX / cell / stride),
      x1: Math.floor(bounds.maxX / cell / stride),
      y0: Math.ceil(bounds.minY / cell / stride),
      y1: Math.floor(bounds.maxY / cell / stride),
   });
   let r = range();
   while ((r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) > (detail ? 49152 : 65536)) {
      stride *= 2;
      r = range();
   }
   const trees: NonNullable<ReturnType<typeof worldTree>>[] = [];
   let candidates = 0;
   const seen = new Set<string>();
   const visit = (
      x: number,
      y: number,
      transition = false,
      authored?: NonNullable<ReturnType<typeof worldTree>>,
   ) => {
      if (!authored) candidates++;
      const tree = authored ?? worldTree(c, x, y);
      if (
         !tree ||
         seen.has(tree.id) ||
         tree.x < bounds.minX ||
         tree.x > bounds.maxX ||
         tree.y < bounds.minY ||
         tree.y > bounds.maxY
      )
         return;
      // Detailed trees already own the interior; spend the distant cap outside it.
      if (
         detail &&
         tree.x > detail.minX &&
         tree.x < detail.maxX &&
         tree.y > detail.minY &&
         tree.y < detail.maxY
      )
         return;
      if (detail && transition) {
         const distance = Math.hypot(
            Math.max(detail.minX - tree.x, 0, tree.x - detail.maxX),
            Math.max(detail.minY - tree.y, 0, tree.y - detail.maxY),
         );
         const t = Math.min(1, distance / 256);
         const weight = 1 - t * t * (3 - 2 * t);
         if (worldHash(Math.floor(tree.x) + 919, Math.floor(tree.y) - 431) >= weight) return;
      }
      seen.add(tree.id);
      trees.push(tree);
   };
   for (let y = r.y0; y <= r.y1; y++) {
      if (cancelled()) throw Error('Preview closed');
      for (let x = r.x0; x <= r.x1; x++) {
         visit(x * stride, y * stride);
      }
      if ((y - r.y0) % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   }
   if (detail) {
      // Reserve 16,384 candidate visits for the 256 m transition band. Enumerating
      // its bounding rectangle keeps cancellation and the worst-case cost explicit.
      let nearStride = 1;
      const nearRange = () => ({
         x0: Math.floor(Math.max(bounds.minX, detail.minX - 256) / cell / nearStride),
         x1: Math.ceil(Math.min(bounds.maxX, detail.maxX + 256) / cell / nearStride),
         y0: Math.floor(Math.max(bounds.minY, detail.minY - 256) / cell / nearStride),
         y1: Math.ceil(Math.min(bounds.maxY, detail.maxY + 256) / cell / nearStride),
      });
      let near = nearRange();
      while (Math.max(0, near.x1 - near.x0 + 1) * Math.max(0, near.y1 - near.y0 + 1) > 16384) {
         nearStride *= 2;
         near = nearRange();
      }
      for (let y = near.y0; y <= near.y1; y++) {
         if (cancelled()) throw Error('Preview closed');
         for (let x = near.x0; x <= near.x1; x++) visit(x * nearStride, y * nearStride, true);
         if ((y - near.y0) % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      }
   }
   // The authored hole must survive leaving the detailed window too. These are
   // existing colliders, not a second set of decorative trees. The render cap is shared.
   for (const object of c.objects) {
      if (cancelled()) throw Error('Preview closed');
      if (object.kind === 'tree') visit(0, 0, false, object);
   }
   const priority = (tree: (typeof trees)[number]) => {
      const distance = detail
         ? Math.hypot(
              Math.max(detail.minX - tree.x, 0, tree.x - detail.maxX),
              Math.max(detail.minY - tree.y, 0, tree.y - detail.maxY),
           )
         : 0;
      return worldHash(Math.floor(tree.x), Math.floor(tree.y)) * (1 + Math.min(4, distance / 512));
   };
   // A separate render cap avoids making the candidate budget dictate sparse forests.
   // Stable priorities keep the cap independent of traversal order.
   if (trees.length > 8192)
      trees.sort((a, b) => priority(a) - priority(b) || a.id.localeCompare(b.id));
   return { trees: trees.slice(0, 8192), stride, candidates };
}

export const DISTANT_CROWN_TRIANGLES = 24;
/** Rounded low-detail crowns with analytic ellipsoid normals. */
export async function distantWoodland(
   c: CockpitSession['course'],
   bounds: Bounds,
   cancelled = () => false,
   detail?: Bounds,
) {
   const selection = await distantTrees(c, bounds, cancelled, detail);
   const vertices = new Float32Array(selection.trees.length * DISTANT_CROWN_TRIANGLES * 27);
   let offset = 0;
   type V = [number, number, number];
   let centre: V = [0, 0, 0],
      radius = 1,
      verticalRadius = 1;
   const triangle = (a: V, b: V, d: V, colour: number[]) => {
      for (const p of [a, b, d]) {
         const nx = (p[0] - centre[0]) / (radius * radius),
            ny = (p[1] - centre[1]) / (radius * radius),
            nz = (p[2] - centre[2]) / (verticalRadius * verticalRadius);
         const length = Math.hypot(nx, ny, nz) || 1;
         const tone = foliageTone(p, centre, radius, verticalRadius);
         vertices.set(
            [...p, nx / length, ny / length, nz / length, ...colour.map((c) => c * tone)],
            offset,
         );
         offset += 9;
      }
   };
   for (let i = 0; i < selection.trees.length; i++) {
      if (i % 64 === 0) {
         await new Promise((resolve) => setTimeout(resolve, 0));
         if (cancelled()) throw Error('Preview closed');
      }
      const tree = selection.trees[i],
         z = Course.heightAt(c, tree);
      const tint = worldHash(Math.floor(tree.x), Math.floor(tree.y));
      const colour = [0.23 + tint * 0.09, 0.37 + tint * 0.14, 0.18 + tint * 0.05];
      const top: V = [tree.x, tree.y, z + tree.height],
         bottom: V = [tree.x, tree.y, z + tree.canopyBase];
      radius = tree.canopyRadius;
      verticalRadius = (tree.height - tree.canopyBase) / 2;
      centre = [tree.x, tree.y, z + tree.canopyBase + verticalRadius];
      const ring = (k: number, latitude: number): V => {
         const angle = (k * Math.PI) / 3 + tint * Math.PI * 2;
         return [
            tree.x + Math.cos(angle) * radius * Math.cos(latitude),
            tree.y + Math.sin(angle) * radius * Math.cos(latitude),
            centre[2] + verticalRadius * Math.sin(latitude),
         ];
      };
      for (let k = 0; k < 6; k++) {
         const upper = ring(k, Math.PI / 6),
            upperNext = ring(k + 1, Math.PI / 6);
         const lower = ring(k, -Math.PI / 6),
            lowerNext = ring(k + 1, -Math.PI / 6);
         triangle(top, upper, upperNext, colour);
         triangle(upper, lower, lowerNext, colour);
         triangle(upper, lowerNext, upperNext, colour);
         triangle(bottom, lowerNext, lower, colour);
      }
   }
   return { vertices, treeCount: selection.trees.length, stride: selection.stride };
}
