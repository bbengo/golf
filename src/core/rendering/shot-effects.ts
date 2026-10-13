import type { CourseCamera } from './camera';
import type { Point } from '../contracts/cockpit';
import type { Presentation } from './presentation';
type TracePoint = Point & { t: number; mode?: string };
type Event = { type: string; t: number; position: Point };
/** Consumes recorded simulation evidence only. Never predicts or modifies a shot. */
export class ShotEffects {
   paint(
      ctx: CanvasRenderingContext2D,
      camera: CourseCamera,
      trace: TracePoint[],
      events: Event[],
      elapsed: number,
      settings: Presentation,
      reducedMotion: boolean,
   ) {
      ctx.save();
      if (settings.shotTrace === 'last') {
         ctx.strokeStyle = '#fff3cc88';
         ctx.lineWidth = 1.5;
         ctx.beginPath();
         let started = false;
         for (const sample of trace) {
            if (sample.t > elapsed) break;
            const p = camera.world(sample);
            if (!started) {
               ctx.moveTo(p.x, p.y);
               started = true;
            } else ctx.lineTo(p.x, p.y);
         }
         ctx.stroke();
      }
      if (settings.impactCue === 'subtle' && !reducedMotion) {
         for (const event of events) {
            const age = elapsed - event.t;
            if (event.type !== 'landing' || age < 0 || age > 1.8) continue;
            const p = camera.world(event.position),
               progress = age / 1.8;
            ctx.strokeStyle = `rgba(247,236,200,${(1 - progress) * 0.55})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 5 + progress * 15, 3 + progress * 9, 0, 0, Math.PI * 2);
            ctx.stroke();
         }
      }
      ctx.restore();
   }
}
