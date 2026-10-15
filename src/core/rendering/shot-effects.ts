import { impactParticles, type ImpactEvent } from './impact-particles';
import type { CourseCamera } from './camera';
import type { Point } from '../contracts/cockpit';
import type { Presentation } from './presentation';
type TracePoint = Point & { t: number; mode?: string };
type Event = ImpactEvent;
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
         // Bound per-frame work even for recordings containing many small rebounds.
         const recent = events
            .filter((event) => elapsed >= event.t && elapsed - event.t <= 2.4)
            .slice(-12);
         for (const event of recent) {
            const age = elapsed - event.t,
               p = camera.world(event.position);
            for (const particle of impactParticles(event, age)) {
               const q = camera.world(particle);
               ctx.globalAlpha = particle.alpha;
               ctx.fillStyle = particle.colour;
               ctx.beginPath();
               ctx.ellipse(
                  q.x,
                  q.y - Math.min(14, particle.lift * camera.scale),
                  particle.size,
                  particle.size * 0.65,
                  0,
                  0,
                  Math.PI * 2,
               );
               ctx.fill();
            }
            ctx.globalAlpha = 1;
            const water = event.type === 'water',
               cup = event.type === 'cup-capture';
            if (!water && !cup && event.type !== 'landing') continue;
            const duration = water ? 2.4 : 1.8,
               progress = age / duration;
            if (progress > 1) continue;
            const rings = water ? 2 : 1;
            for (let i = 0; i < rings; i++) {
               const phase = Math.max(0, progress - i * 0.18);
               if (i && phase === 0) continue;
               ctx.strokeStyle = water
                  ? `rgba(192,220,212,${(1 - progress) * 0.5})`
                  : `rgba(247,236,200,${(1 - progress) * 0.55})`;
               ctx.lineWidth = 1;
               const radius = cup ? 4 + (1 - progress) * 9 : 4 + phase * (water ? 23 : 15);
               ctx.beginPath();
               ctx.ellipse(p.x, p.y, radius, radius * 0.62, 0, 0, Math.PI * 2);
               ctx.stroke();
            }
         }
      }
      ctx.restore();
   }
}
