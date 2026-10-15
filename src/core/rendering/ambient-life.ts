import type { CourseCamera } from './camera';
/** Sparse world-anchored bird silhouettes. Decorative only; never part of collision. */
export function paintBirds(ctx: CanvasRenderingContext2D, camera: CourseCamera, time: number) {
   const centre = camera.inverse({ x: camera.w / 2, y: camera.h / 2 });
   const cell = 700,
      gx = Math.floor(centre.x / cell),
      gy = Math.floor(centre.y / cell),
      t = time / 1000;
   let visible = 0;
   ctx.save();
   ctx.strokeStyle = '#23372c99';
   ctx.lineWidth = 1;
   ctx.lineCap = 'round';
   for (let y = gy - 2; y <= gy + 2; y++)
      for (let x = gx - 2; x <= gx + 2; x++) {
         if ((((x * 17 + y * 31) % 5) + 5) % 5 !== 0) continue;
         const phase = x * 2.71 + y * 1.91,
            turn = t * 0.025 + phase;
         const p = camera.world({
            x: x * cell + 350 + Math.cos(turn) * 180,
            y: y * cell + 350 + Math.sin(turn) * 95,
         });
         if (p.x < 20 || p.x > camera.w - 20 || p.y < 20 || p.y > camera.h - 20 || visible >= 3)
            continue;
         visible++;
         for (let i = 0; i < 3; i++) {
            const size = Math.max(1.2, Math.min(3.2, camera.scale * 0.9)),
               wing = Math.sin(t * 5 + phase + i * 0.8) * size * 0.65;
            ctx.save();
            ctx.translate(p.x + i * 7, p.y + i * 4);
            ctx.rotate(turn - camera.angle);
            ctx.beginPath();
            ctx.moveTo(-size, wing);
            ctx.quadraticCurveTo(-size * 0.4, -size * 0.35, 0, 0);
            ctx.quadraticCurveTo(size * 0.4, -size * 0.35, size, wing);
            ctx.stroke();
            ctx.restore();
         }
      }
   ctx.restore();
}
