import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';
/** World-space normals shared by every terrain resolution. Water remains level.
 * This changes illumination only; collision and mesh elevations are untouched. */
export function landscapeNormal(
   course: CockpitSession['course'],
   x: number,
   y: number,
): [number, number, number] {
   if (Course.surfaceAt(course, { x, y }).type === 'water') return [0, 0, 1];
   const slope = Course.slopeAt(course, { x, y });
   const length = Math.hypot(slope.x, slope.y, 1);
   return [-slope.x / length, -slope.y / length, 1 / length];
}
