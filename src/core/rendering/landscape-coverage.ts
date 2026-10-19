import { landscapeMaterial } from './landscape-material';
import { landscapeTerrain } from './landscape-terrain';
import { terrainColour, SURFACE_COLOURS } from './terrain-material';
import { distantWoodland } from './distant-woodland';
import type { LandscapeView } from './landscape-projection';
import type { Bounds } from './camera';
import { Course } from '../course/course.js';
import { worldGroundColour, worldWetness } from '../course/procedural-world';
import { waterColour } from './water-material';
import type { Daylight } from './daylight';
import type { CockpitSession } from '../session/cockpit-session';

const surfaceColours = Object.fromEntries(
   Object.entries(SURFACE_COLOURS).map(([key, hex]) => [
      key,
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
   ]),
);

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

/** Bounded adaptive terrain surface plus distant crowns.
 * Samples the shared physical world; this is presentation LOD, never collision data.
 */
export async function landscapeBackdrop(
   c: CockpitSession['course'],
   bounds: Bounds,
   cancelled = () => false,
   daylight: Daylight = 'day',
   detail?: Bounds,
   textureSize = 256,
) {
   if (
      ![256, 384, 512].includes(textureSize) ||
      !Object.values(bounds).every(Number.isFinite) ||
      bounds.maxX <= bounds.minX ||
      bounds.maxY <= bounds.minY
   )
      throw Error('Invalid landscape backdrop bounds');
   const { vertices } = await landscapeTerrain(c, bounds, detail, cancelled);
   const { pixels, refinedPixels } = await landscapeMaterial(
      textureSize,
      (i, j) => {
         const x = bounds.minX + (i / textureSize) * (bounds.maxX - bounds.minX);
         const y = bounds.maxY - (j / textureSize) * (bounds.maxY - bounds.minY);
         const surface = Course.surfaceAt(c, { x, y });
         const colour =
            surface.type === 'water'
               ? waterColour(x, y, Math.max(0, -worldWetness(c, x, y) * 28), daylight)
               : surface.type !== 'rough' && surfaceColours[surface.type]
                 ? surfaceColours[surface.type]
                 : x >= c.bounds.minX &&
                     x <= c.bounds.maxX &&
                     y >= c.bounds.minY &&
                     y <= c.bounds.maxY
                   ? surfaceColours.rough
                   : worldGroundColour(c, x, y);
         return { type: surface.type, colour: terrainColour(colour, x, y) };
      },
      cancelled,
   );
   const woodland = await distantWoodland(c, bounds, cancelled, detail);
   const combined = new Float32Array(vertices.length + woodland.vertices.length);
   combined.set(vertices);
   combined.set(woodland.vertices, vertices.length);
   return {
      vertices: combined,
      pixels,
      textureSize,
      refinedPixels,
      terrainVertices: vertices.length / 9,
      treeCount: woodland.treeCount,
      treeStride: woodland.stride,
   };
}
