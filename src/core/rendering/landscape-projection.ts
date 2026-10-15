import type { Point } from '../contracts/cockpit';
export type LandscapeView = {
   x: number;
   y: number;
   z: number;
   yaw: number;
   pitch: number;
   span: number;
   width: number;
   height: number;
};
/** Matches the orthographic WebGL shader. Depth increases away from the viewer. */
export function projectLandscape(p: Point & { z: number }, view: LandscapeView) {
   const co = Math.cos(view.yaw),
      si = Math.sin(view.yaw),
      s = Math.sin(view.pitch),
      c = Math.cos(view.pitch);
   const dx = p.x - view.x,
      dy = p.y - view.y,
      dz = p.z - view.z;
   const rx = co * dx - si * dy,
      ry = si * dx + co * dy,
      scale = view.height / (2 * view.span);
   return {
      x: view.width / 2 + rx * scale,
      y: view.height / 2 - (ry * s + dz * c) * scale,
      depth: ry * c - dz * s,
   };
}
export function landscapeRay(screen: Point, view: LandscapeView) {
   const scale = view.height / (2 * view.span),
      rx = (screen.x - view.width / 2) / scale,
      sy = (view.height / 2 - screen.y) / scale;
   const co = Math.cos(view.yaw),
      si = Math.sin(view.yaw),
      s = Math.sin(view.pitch),
      c = Math.cos(view.pitch);
   return {
      origin: {
         x: view.x + co * rx + si * sy * s,
         y: view.y - si * rx + co * sy * s,
         z: view.z + sy * c,
      },
      direction: { x: si * c, y: co * c, z: -s },
   };
}
/** First above-to-below crossing, refined against the physical height function.
 * The 2 m march is a terrain approximation, not a triangle/object picking solver.
 */
export function pickLandscape(screen: Point, view: LandscapeView, height: (p: Point) => number) {
   if (
      !Object.values(view).every(Number.isFinite) ||
      view.width <= 0 ||
      view.height <= 0 ||
      view.span <= 0 ||
      view.pitch < 0.2 ||
      view.pitch > Math.PI / 2
   )
      throw Error('Invalid landscape view');
   const ray = landscapeRay(screen, view);
   const at = (d: number) => ({
      x: ray.origin.x + ray.direction.x * d,
      y: ray.origin.y + ray.direction.y * d,
      z: ray.origin.z + ray.direction.z * d,
   });
   let previous = -4000,
      above = at(previous).z - height(at(previous));
   for (let d = -3998; d <= 4000; d += 2) {
      const p = at(d),
         gap = p.z - height(p);
      if (above > 0 && gap <= 0) {
         let lo = previous,
            hi = d;
         for (let i = 0; i < 22; i++) {
            const mid = (lo + hi) / 2,
               q = at(mid);
            if (q.z > height(q)) lo = mid;
            else hi = mid;
         }
         return at((lo + hi) / 2);
      }
      previous = d;
      above = gap;
   }
   return null;
}
