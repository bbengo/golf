import { Terrain } from '../course/terrain.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { CourseCamera } from './camera';
import type { Point } from '../contracts/cockpit';

/** Cached diagnostic geometry. Paint only; never changes physical surfaces. */
export class CourseStudyLayers {
   private course: unknown;
   private key = '';
   private chart: ReturnType<typeof Terrain.contours> | undefined;
   paint(
      ctx: CanvasRenderingContext2D,
      session: CockpitSession,
      camera: CourseCamera,
      flags: DOMStringMap,
   ) {
      const course = session.course;
      const line = (points: Point[], close = false) => {
         ctx.beginPath();
         points.forEach((point, i) => {
            const p = camera.world(point);
            if (i) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
         });
         if (close) ctx.closePath();
      };
      ctx.save();
      if (flags.contours === 'true' || flags.slopes === 'true') {
         const key = `${session.probe.x}/${session.probe.y}`;
         if (this.course !== course || this.key !== key) {
            this.chart = Terrain.contours(
               course,
               Terrain.clippedBounds(course, session.probe, 40),
               3,
               0.3048,
            );
            this.course = course;
            this.key = key;
         }
         if (flags.slopes === 'true')
            for (const cell of this.chart!.cells) {
               const steepness = Math.min(1, cell.sample.gradePercent / 15);
               ctx.fillStyle = `hsla(${110 - steepness * 85},50%,60%,0.32)`;
               line(cell.polygon, true);
               ctx.fill();
            }
         if (flags.contours === 'true') {
            ctx.strokeStyle = '#f2ebc8b0';
            ctx.lineWidth = 1;
            for (const segment of this.chart!.segments) {
               line([segment.a, segment.b]);
               ctx.stroke();
            }
         }
      }
      if (flags.route === 'true') {
         ctx.strokeStyle = '#f5dfa7';
         ctx.lineWidth = 2;
         ctx.setLineDash([5, 5]);
         line(course.route);
         ctx.stroke();
         ctx.setLineDash([]);
      }
      if (flags.boundaries === 'true') {
         ctx.strokeStyle = '#f4e6c3';
         ctx.lineWidth = 1.5;
         for (const surface of course.surfaces) {
            line(surface.polygon, true);
            ctx.stroke();
         }
      }
      if (flags.zones === 'true') {
         ctx.strokeStyle = '#ebbc79';
         ctx.fillStyle = '#ebbc7925';
         ctx.lineWidth = 2;
         for (const zone of course.zones) {
            line(zone.polygon, true);
            ctx.fill();
            ctx.stroke();
         }
      }
      ctx.restore();
   }
}
