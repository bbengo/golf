import type { CourseCamera } from './camera';
import type { Point } from '../contracts/cockpit';
import type { Presentation } from './presentation';
import { DAYLIGHT, type Daylight } from './daylight';

/** Visibility magnification is artistic; physical ball radius remains in the solver. */
export function ballScreenRadius(zoom: number, visibility: Presentation['ballVisibility']) {
   const radius = 3.5 + Math.max(0, Math.log2(Math.max(1, zoom))) * 1.7;
   return Math.min(12, radius * (visibility === 'enhanced' ? 1.35 : 1));
}
export function ballProjection(camera: CourseCamera, ball: Point, ground: number) {
   const p = camera.world(ball),
      height = Math.max(0, (ball.z ?? ground) - ground);
   return { x: p.x, y: p.y - Math.min(32, height * 0.4), height };
}
export class BallRenderer {
   paint(
      ctx: CanvasRenderingContext2D,
      camera: CourseCamera,
      ball: Point,
      ground: number,
      settings: Presentation,
      daylight: Daylight,
   ) {
      const p = ballProjection(camera, ball, ground),
         q = camera.world(ball);
      const r = ballScreenRadius(camera.zoom, settings.ballVisibility);
      const sun = DAYLIGHT[daylight];
      const co = Math.cos(camera.angle),
         si = Math.sin(camera.angle);
      const lx = sun.x * co - sun.y * si,
         ly = -(sun.x * si + sun.y * co);
      ctx.save();
      ctx.fillStyle = `rgba(12,30,24,${0.3 / (1 + p.height * 0.02)})`;
      ctx.beginPath();
      ctx.ellipse(
         q.x - lx * 3,
         q.y - ly * 3,
         r * (1 + Math.min(p.height, 30) * 0.01),
         r * 0.58,
         0,
         0,
         Math.PI * 2,
      );
      ctx.fill();
      const g = ctx.createRadialGradient(p.x + lx * r * 0.3, p.y + ly * r * 0.3, 0, p.x, p.y, r);
      g.addColorStop(0, settings.ballColour === 'yellow' ? '#fff8b1' : '#ffffff');
      g.addColorStop(0.65, settings.ballColour === 'yellow' ? '#e8cd52' : '#ecece2');
      g.addColorStop(1, settings.ballColour === 'yellow' ? '#927c28' : '#889a90');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (r > 6) {
         ctx.fillStyle = '#33493f25';
         for (let i = 0; i < 18; i++) {
            const angle = i * 2.39996,
               distance = Math.sqrt((i + 0.5) / 18) * r * 0.75;
            ctx.beginPath();
            ctx.arc(
               p.x + Math.cos(angle) * distance,
               p.y + Math.sin(angle) * distance,
               0.48,
               0,
               Math.PI * 2,
            );
            ctx.fill();
         }
      }
      ctx.restore();
   }
}
