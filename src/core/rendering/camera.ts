import type { Point } from '../contracts/cockpit';
export type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

/** Presentation-only camera. No aim, terrain or physics writes. */
export class CourseCamera {
   x = 0;
   y = 0;
   zoom = 1;
   w = 1;
   h = 1;
   scale = 1;
   angle = 0;
   target = { x: 0, y: 0, zoom: 1 };
   private fitScale = 1;
   private ready = false;
   bounds: Bounds = { minX: 0, maxX: 256.8, minY: 0, maxY: 550.8 };
   resize(w: number, h: number, bounds: Bounds) {
      this.w = w;
      this.h = h;
      this.bounds = bounds;
      this.fitScale = Math.min(
         w / (bounds.maxX - bounds.minX + 30),
         h / (bounds.maxY - bounds.minY + 30),
      );
      if (!this.ready) {
         this.fit();
         this.x = this.target.x;
         this.y = this.target.y;
         this.ready = true;
      }
      this.scale = this.fitScale * this.zoom;
   }
   fit() {
      this.go(
         {
            x: (this.bounds.minX + this.bounds.maxX) / 2,
            y: (this.bounds.minY + this.bounds.maxY) / 2,
         },
         1,
      );
   }
   go(p: Point, zoom = this.target.zoom) {
      this.target = { x: p.x, y: p.y, zoom: Math.max(0.65, Math.min(zoom, 10)) };
   }
   tick(ms: number, reducedMotion = false) {
      const a = reducedMotion ? 1 : 1 - Math.exp(-Math.min(ms, 64) / 140);
      this.x += (this.target.x - this.x) * a;
      this.y += (this.target.y - this.y) * a;
      this.zoom += (this.target.zoom - this.zoom) * a;
      if (Math.abs(this.target.x - this.x) < 0.001) this.x = this.target.x;
      if (Math.abs(this.target.y - this.y) < 0.001) this.y = this.target.y;
      if (Math.abs(this.target.zoom - this.zoom) < 0.0001) this.zoom = this.target.zoom;
      this.scale = this.fitScale * this.zoom;
   }
   world(p: Point) {
      return {
         x: (p.x - this.x) * this.scale + this.w / 2,
         y: this.h / 2 - (p.y - this.y) * this.scale,
      };
   }
   inverse(p: Point) {
      return {
         x: this.x + (p.x - this.w / 2) / this.scale,
         y: this.y - (p.y - this.h / 2) / this.scale,
      };
   }
   pan(dx: number, dy: number) {
      this.target.x -= dx / this.scale;
      this.target.y += dy / this.scale;
      this.clamp();
   }
   zoomAt(p: Point, factor: number) {
      const anchor = {
         x: this.target.x + (p.x - this.w / 2) / (this.fitScale * this.target.zoom),
         y: this.target.y - (p.y - this.h / 2) / (this.fitScale * this.target.zoom),
      };
      const zoom = Math.max(0.65, Math.min(10, this.target.zoom * factor));
      this.target = {
         x: anchor.x - (p.x - this.w / 2) / (this.fitScale * zoom),
         y: anchor.y + (p.y - this.h / 2) / (this.fitScale * zoom),
         zoom,
      };
      this.clamp();
   }
   private clamp() {
      this.target.x = Math.max(
         this.bounds.minX - 160,
         Math.min(this.bounds.maxX + 160, this.target.x),
      );
      this.target.y = Math.max(
         this.bounds.minY - 160,
         Math.min(this.bounds.maxY + 160, this.target.y),
      );
   }
}
