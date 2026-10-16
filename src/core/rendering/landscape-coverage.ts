import type { LandscapeView } from './landscape-projection';
import type { Bounds } from './camera';
import { Course } from '../course/course.js';
import { worldGroundColour } from '../course/procedural-world';
import type { CockpitSession } from '../session/cockpit-session';

/** Conservative ground footprint across yaw, allowing 512 m of relative relief.
 * The supported estate's height envelope is much smaller than this allowance.
 */
export function landscapeFootprint(view: LandscapeView): Bounds {
   if (
      !Object.values(view).every(Number.isFinite) ||
      view.width <= 0 ||
      view.height <= 0 ||
      view.span <= 0 ||
      view.pitch < 0.2 ||
      view.pitch > Math.PI / 2
   )
      throw Error('Invalid landscape coverage view');
   const halfWidth = (view.span * view.width) / view.height;
   const halfDepth = (view.span + 512 * Math.cos(view.pitch)) / Math.sin(view.pitch);
   const radius = Math.hypot(halfWidth, halfDepth);
   return {
      minX: view.x - radius,
      maxX: view.x + radius,
      minY: view.y - radius,
      maxY: view.y + radius,
   };
}
export function containsLandscape(outer: Bounds, inner: Bounds) {
   return (
      outer.minX <= inner.minX &&
      outer.maxX >= inner.maxX &&
      outer.minY <= inner.minY &&
      outer.maxY >= inner.maxY
   );
}
export function paddedLandscape(bounds: Bounds): Bounds {
   return {
      minX: Math.floor(bounds.minX / 512) * 512 - 512,
      maxX: Math.ceil(bounds.maxX / 512) * 512 + 512,
      minY: Math.floor(bounds.minY / 512) * 512 - 512,
      maxY: Math.ceil(bounds.maxY / 512) * 512 + 512,
   };
}

/** Fixed-budget distant terrain: 128 squared cells, no trees or object meshes.
 * Samples the shared physical world; this is presentation LOD, never collision data.
 */
export async function landscapeBackdrop(
   c: CockpitSession['course'],
   bounds: Bounds,
   cancelled = () => false,
) {
   if (
      !Object.values(bounds).every(Number.isFinite) ||
      bounds.maxX <= bounds.minX ||
      bounds.maxY <= bounds.minY
   )
      throw Error('Invalid landscape backdrop bounds');
   const size = 128;
   const points: { x: number; y: number; z: number }[] = [];
   for (let j = 0; j <= size; j++) {
      if (cancelled()) throw Error('Preview closed');
      for (let i = 0; i <= size; i++) {
         const x = bounds.minX + ((bounds.maxX - bounds.minX) * i) / size;
         const y = bounds.minY + ((bounds.maxY - bounds.minY) * j) / size;
         const surface = Course.surfaceAt(c, { x, y });
         points.push({
            x,
            y,
            z: surface.type === 'water' ? surface.waterHeight : Course.heightAt(c, { x, y }),
         });
      }
      if (j % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   }
   const vertices = new Float32Array(size * size * 6 * 9);
   let offset = 0;
   const triangle = (ia: number, ib: number, ic: number) => {
      for (const index of [ia, ib, ic]) {
         const p = points[index],
            row = Math.floor(index / (size + 1)),
            col = index % (size + 1);
         const left = points[row * (size + 1) + Math.max(0, col - 1)];
         const right = points[row * (size + 1) + Math.min(size, col + 1)];
         const down = points[Math.max(0, row - 1) * (size + 1) + col];
         const up = points[Math.min(size, row + 1) * (size + 1) + col];
         const nx = -(right.z - left.z) / (right.x - left.x),
            ny = -(up.z - down.z) / (up.y - down.y);
         const length = Math.hypot(nx, ny, 1);
         vertices.set([p.x, p.y, p.z, nx / length, ny / length, 1 / length, -1, 0, 0], offset);
         offset += 9;
      }
   };
   for (let j = 0; j < size; j++) {
      if (cancelled()) throw Error('Preview closed');
      for (let i = 0; i < size; i++) {
         const a = j * (size + 1) + i,
            b = a + 1,
            d = b + size + 1,
            e = a + size + 1;
         triangle(a, b, d);
         triangle(a, d, e);
      }
      if (j % 16 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   }
   const textureSize = 256;
   const pixels = new Uint8Array(textureSize * textureSize * 4);
   for (let j = 0; j < textureSize; j++) {
      if (cancelled()) throw Error('Preview closed');
      for (let i = 0; i < textureSize; i++) {
         const x = bounds.minX + ((i + 0.5) / textureSize) * (bounds.maxX - bounds.minX);
         const y = bounds.maxY - ((j + 0.5) / textureSize) * (bounds.maxY - bounds.minY);
         const surface = Course.surfaceAt(c, { x, y });
         const colour = surface.type === 'water' ? [56, 110, 112] : worldGroundColour(c, x, y);
         const pixel = (j * textureSize + i) * 4;
         pixels.set([...colour, 255], pixel);
      }
      if (j % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   }
   return { vertices, pixels, textureSize };
}
