import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';

/** Section of recorded flight or the unsolved aim line, sampled in world metres. */
export function paintShotProfile(canvas: HTMLCanvasElement, session: CockpitSession) {
   const ctx = canvas.getContext('2d')!;
   const trajectory = session.last?.result.trajectory;
   const points: { s: number; z: number | null; ground: number }[] = [];
   let distance = 0;
   if (trajectory?.length) {
      let previous = trajectory[0];
      for (const p of trajectory) {
         distance += Math.hypot(p.x - previous.x, p.y - previous.y);
         points.push({ s: distance, z: p.z, ground: Course.heightAt(session.last!.course, p) });
         previous = p;
      }
   } else {
      distance = Math.hypot(session.aim.x - session.ball.x, session.aim.y - session.ball.y);
      for (let i = 0; i <= 100; i++) {
         const t = i / 100;
         points.push({
            s: distance * t,
            z: null,
            ground: Course.heightAt(session.course, {
               x: session.ball.x + (session.aim.x - session.ball.x) * t,
               y: session.ball.y + (session.aim.y - session.ball.y) * t,
            }),
         });
      }
   }
   const heights = points.flatMap((p) => [p.ground, p.z ?? p.ground]);
   const low = Math.min(...heights) - 1,
      high = Math.max(low + 8, Math.max(...heights) + 2);
   const x = (s: number) => 55 + (s / Math.max(1, distance)) * 590;
   const y = (z: number) => 270 - ((z - low) / (high - low)) * 240;
   ctx.fillStyle = '#14271e';
   ctx.fillRect(0, 0, 680, 310);
   ctx.font = '12px Onest, sans-serif';
   ctx.fillStyle = '#d3dec6';
   for (let i = 0; i < 4; i++) {
      const z = low + ((high - low) * i) / 3;
      ctx.fillText(`${Math.round(z / 0.3048)} ft`, 4, y(z));
   }
   for (let i = 0; i < 5; i++)
      ctx.fillText(
         `${Math.round((distance * i) / 4 / 0.9144)} yd`,
         x((distance * i) / 4) - 15,
         300,
      );
   for (const key of ['ground', 'z'] as const) {
      if (key === 'z' && !trajectory) continue;
      ctx.strokeStyle = key === 'ground' ? '#93b284' : '#f2d39c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
         if (i) ctx.lineTo(x(p.s), y(p[key]!));
         else ctx.moveTo(x(p.s), y(p[key]!));
      });
      ctx.stroke();
   }
}
