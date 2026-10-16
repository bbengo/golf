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
) {
   if (
      !Object.values(bounds).every(Number.isFinite) ||
      bounds.maxX <= bounds.minX ||
      bounds.maxY <= bounds.minY
   )
      throw Error('Invalid distant woodland bounds');
   const cell = c.world?.ecologyVersion === ECOLOGY_VERSION ? 20 : 32;
   let stride = 1;
   const range = () => ({
      x0: Math.ceil(bounds.minX / cell / stride),
      x1: Math.floor(bounds.maxX / cell / stride),
      y0: Math.ceil(bounds.minY / cell / stride),
      y1: Math.floor(bounds.maxY / cell / stride),
   });
   let r = range();
   while ((r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) > 65536) {
      stride *= 2;
      r = range();
   }
   const trees: NonNullable<ReturnType<typeof worldTree>>[] = [];
   let candidates = 0;
   for (let y = r.y0; y <= r.y1; y++) {
      if (cancelled()) throw Error('Preview closed');
      for (let x = r.x0; x <= r.x1; x++) {
         candidates++;
         const tree = worldTree(c, x * stride, y * stride);
         if (
            tree &&
            tree.x >= bounds.minX &&
            tree.x <= bounds.maxX &&
            tree.y >= bounds.minY &&
            tree.y <= bounds.maxY
         )
            trees.push(tree);
      }
      if ((y - r.y0) % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   }
   // A separate render cap avoids making the candidate budget dictate sparse forests.
   // Stable priorities keep the cap independent of traversal order.
   if (trees.length > 8192)
      trees.sort(
         (a, b) =>
            worldHash(Math.floor(a.x), Math.floor(a.y)) -
               worldHash(Math.floor(b.x), Math.floor(b.y)) || a.id.localeCompare(b.id),
      );
   return { trees: trees.slice(0, 8192), stride, candidates };
}

/** Twelve triangles per distant crown; actual position, height and canopy radius. */
export async function distantWoodland(
   c: CockpitSession['course'],
   bounds: Bounds,
   cancelled = () => false,
) {
   const selection = await distantTrees(c, bounds, cancelled);
   const vertices = new Float32Array(selection.trees.length * 12 * 27);
   let offset = 0;
   type V = [number, number, number];
   const triangle = (a: V, b: V, d: V, colour: number[]) => {
      const ux = b[0] - a[0],
         uy = b[1] - a[1],
         uz = b[2] - a[2],
         vx = d[0] - a[0],
         vy = d[1] - a[1],
         vz = d[2] - a[2];
      const nx = uy * vz - uz * vy,
         ny = uz * vx - ux * vz,
         nz = ux * vy - uy * vx;
      const length = Math.hypot(nx, ny, nz) || 1;
      for (const p of [a, b, d]) {
         vertices.set([...p, nx / length, ny / length, nz / length, ...colour], offset);
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
      const ring = (k: number): V => {
         const angle = (k * Math.PI) / 3 + tint * Math.PI * 2;
         return [
            tree.x + Math.cos(angle) * tree.canopyRadius,
            tree.y + Math.sin(angle) * tree.canopyRadius,
            z + tree.canopyBase + (tree.height - tree.canopyBase) * 0.45,
         ];
      };
      for (let k = 0; k < 6; k++) {
         triangle(top, ring(k), ring(k + 1), colour);
         triangle(bottom, ring(k + 1), ring(k), colour);
      }
   }
   return { vertices, treeCount: selection.trees.length, stride: selection.stride };
}
