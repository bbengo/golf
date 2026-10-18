import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';
import { impactParticles, type ImpactEvent } from './impact-particles';
type CourseState = CockpitSession['course'];
const vertex = (p: Point & { z: number }, lift = 0) => [
   p.x,
   p.y,
   p.z + lift,
   0,
   0,
   1,
   0.88,
   0.93,
   0.74,
];
/** Terrain-conforming locator; it marks intent, not a predicted landing location. */
export function landscapeAimRing(course: CourseState, aim: Point, span: number) {
   const points: number[] = [],
      radius = Math.max(1.5, span * 0.018);
   for (let i = 0; i <= 64; i++) {
      const angle = (i * Math.PI * 2) / 64;
      const x = aim.x + Math.cos(angle) * radius,
         y = aim.y + Math.sin(angle) * radius;
      const surface = Course.surfaceAt(course, { x, y });
      points.push(
         ...vertex(
            {
               x,
               y,
               z:
                  surface.type === 'water'
                     ? surface.waterHeight
                     : Course.heightAt(course, { x, y }),
            },
            0.25,
         ),
      );
   }
   return new Float32Array(points);
}
/** At most 257 vertices; never expose future trajectory points or mutate a recording. */
export function landscapeTrail(
   trace: (Point & { z: number; t: number })[],
   elapsed: number,
   ball: Point & { z: number },
) {
   const points: number[] = [],
      stride = Math.max(1, Math.ceil(trace.length / 256));
   if (!Number.isFinite(elapsed) || elapsed < 0) return new Float32Array();
   for (let i = 0; i < trace.length && trace[i].t <= elapsed; i += stride)
      points.push(...vertex(trace[i], 0.08));
   points.push(...vertex(ball, 0.08));
   return new Float32Array(points);
}
/** Reuse the overhead effect generator, with real elevation and at most 12 recent events. */
export function landscapeImpacts(course: CourseState, events: ImpactEvent[], elapsed: number) {
   if (!Number.isFinite(elapsed)) return [];
   return events
      .filter((event) => elapsed >= event.t && elapsed - event.t < 1.5)
      .slice(-12)
      .flatMap((event) => {
         const particles = impactParticles(event, elapsed - event.t);
         if (!particles.length) return [];
         const data: number[] = [];
         const z = event.position.z ?? Course.heightAt(course, event.position);
         for (const particle of particles) {
            const rgb = [1, 3, 5].map((i) => parseInt(particle.colour.slice(i, i + 2), 16) / 255);
            data.push(particle.x, particle.y, z + particle.lift + 0.1, 0, 0, 1, ...rgb);
         }
         return [{ vertices: new Float32Array(data), alpha: particles[0].alpha }];
      });
}
