import type { CourseCamera } from './camera';
import type { Point } from '../contracts/cockpit';
/** Target intent, not a simulated landing guarantee. Motion never changes aim. */
export function paintTarget(
   ctx: CanvasRenderingContext2D,
   camera: CourseCamera,
   ball: Point,
   aim: Point,
   time: number,
   reducedMotion: boolean,
) {
   const p = camera.world(aim);
   if (p.x < -20 || p.x > camera.w + 20 || p.y < -20 || p.y > camera.h + 20) return;
   const pulse = reducedMotion ? 1 : 1 + Math.sin(time / 800) * 0.055;
   ctx.save();
   ctx.translate(p.x, p.y);
   ctx.strokeStyle = '#f1f3dc';
   ctx.lineWidth = 1.4;
   ctx.beginPath();
   ctx.arc(0, 0, 9 * pulse, 0, Math.PI * 2);
   ctx.stroke();
   ctx.save();
   ctx.rotate(reducedMotion ? 0 : time / 14000);
   for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(13 * pulse, 0);
      ctx.lineTo(20 * pulse, 0);
      ctx.stroke();
   }
   ctx.restore();
   ctx.restore();
   const label = `${Math.round(Math.hypot(aim.x - ball.x, aim.y - ball.y) / 0.9144)} yd to target`;
   ctx.save();
   ctx.font = '500 12px Onest, sans-serif';
   const w = ctx.measureText(label).width + 20;
   const x = Math.max(8, Math.min(camera.w - w - 8, p.x - w / 2));
   const y = Math.max(8, Math.min(camera.h - 32, p.y + 27));
   ctx.fillStyle = '#13261de8';
   ctx.beginPath();
   ctx.roundRect(x, y, w, 25, 10);
   ctx.fill();
   ctx.fillStyle = '#edf1de';
   ctx.fillText(label, x + 10, y + 17);
   ctx.restore();
}
