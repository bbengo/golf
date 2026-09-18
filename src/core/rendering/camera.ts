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
   offsetX = 0;
   target = { x: 0, y: 0, zoom: 1 };
   private fitScale = 1;
   private ready = false;
   bounds: Bounds = { minX: 0, maxX: 256.8, minY: 0, maxY: 550.8 };
   resize(w: number, h: number, bounds: Bounds) {
      this.w = w;
      this.h = h;
      this.bounds = bounds;
      const co = Math.abs(Math.cos(this.angle)),
         si = Math.abs(Math.sin(this.angle));
      const bw = bounds.maxX - bounds.minX,
         bh = bounds.maxY - bounds.minY;
      this.fitScale = Math.min(
         (w - Math.abs(this.offsetX) * 1.3) / (co * bw + si * bh + 30),
         h / (si * bw + co * bh + 45),
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
   rotate(delta: number) {
      this.angle = Math.atan2(Math.sin(this.angle + delta), Math.cos(this.angle + delta));
   }
   north() {
      this.angle = 0;
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
      const co = Math.cos(this.angle),
         si = Math.sin(this.angle),
         dx = p.x - this.x,
         dy = p.y - this.y;
      return {
         x: (co * dx - si * dy) * this.scale + this.w / 2 + this.offsetX,
         y: this.h / 2 - (si * dx + co * dy) * this.scale,
      };
   }
   inverse(p: Point) {
      const co = Math.cos(this.angle),
         si = Math.sin(this.angle),
         dx = (p.x - this.w / 2 - this.offsetX) / this.scale,
         dy = (this.h / 2 - p.y) / this.scale;
      return {
         x: this.x + co * dx + si * dy,
         y: this.y - si * dx + co * dy,
      };
   }
   pan(dx: number, dy: number) {
      const co = Math.cos(this.angle),
         si = Math.sin(this.angle);
      this.target.x -= (co * dx - si * dy) / this.scale;
      this.target.y += (si * dx + co * dy) / this.scale;
      this.clamp();
   }
   zoomAt(p: Point, factor: number) {
      const co = Math.cos(this.angle),
         si = Math.sin(this.angle);
      const dx = p.x - this.w / 2 - this.offsetX,
         dy = this.h / 2 - p.y;
      const vx = co * dx + si * dy,
         vy = -si * dx + co * dy;
      const anchor = {
         x: this.target.x + vx / (this.fitScale * this.target.zoom),
         y: this.target.y + vy / (this.fitScale * this.target.zoom),
      };
      const zoom = Math.max(0.65, Math.min(10, this.target.zoom * factor));
      this.target = {
         x: anchor.x - vx / (this.fitScale * zoom),
         y: anchor.y - vy / (this.fitScale * zoom),
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
