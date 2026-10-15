import { CourseAtlas } from './course-atlas';
import type { Daylight } from './daylight';
/** Crossfade two world-aligned lighting states; release the old atlas after transition. */
export class EnvironmentRenderer {
   private atlas = new CourseAtlas();
   private daylight: Daylight | undefined;
   private previous: { atlas: CourseAtlas; daylight: Daylight; started: number } | null = null;
   private buffer: HTMLCanvasElement | null = null;
   private reduced = matchMedia('(prefers-reduced-motion: reduce)');
   paint(...args: Parameters<CourseAtlas['paint']>) {
      const [ctx, course, camera, wind, daylight] = args;
      if (this.daylight !== undefined && this.daylight !== daylight && !this.reduced.matches) {
         this.previous = { atlas: this.atlas, daylight: this.daylight, started: -1 };
         this.atlas = new CourseAtlas();
      }
      this.daylight = daylight;
      if (this.reduced.matches) this.previous = null;
      const previous = this.previous;
      const elapsed = previous && previous.started >= 0 ? performance.now() - previous.started : 0;
      if (!previous || elapsed >= 650) {
         this.previous = null;
         this.buffer = null;
         this.atlas.paint(...args);
         return;
      }
      const buffer = this.buffer ?? (this.buffer = document.createElement('canvas'));
      if (buffer.width !== ctx.canvas.width || buffer.height !== ctx.canvas.height) {
         buffer.width = ctx.canvas.width;
         buffer.height = ctx.canvas.height;
      }
      const scratch = buffer.getContext('2d')!;
      scratch.resetTransform();
      scratch.clearRect(0, 0, buffer.width, buffer.height);
      scratch.setTransform(ctx.getTransform());
      this.atlas.paint(scratch, course, camera, wind, daylight);
      // Begin after the new cached terrain is built, not before its generation cost.
      if (previous.started < 0) previous.started = performance.now();
      previous.atlas.paint(ctx, course, camera, wind, previous.daylight);
      const t = Math.min(1, elapsed / 650),
         alpha = t * t * (3 - 2 * t);
      ctx.save();
      ctx.resetTransform();
      ctx.globalAlpha = alpha;
      ctx.drawImage(buffer, 0, 0);
      ctx.restore();
   }
}
