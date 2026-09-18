import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';
import type { CourseCamera } from './camera';

const colors: Record<string, string> = {
   rough: '#52794a',
   'deep-rough': '#3d6645',
   fairway: '#8fab62',
   fringe: '#719754',
   green: '#b0c67b',
   tee: '#a6bb7e',
   sand: '#e6d9b4',
   water: '#76a7a2',
   path: '#b5ab90',
};

/** World-anchored colour and texture, cached independently of the camera. */
export class CourseAtlas {
   private canvas = document.createElement('canvas');
   private course: CockpitSession['course'] | null = null;
   private scale = 2;
   private margin = 350;
   paint(ctx: CanvasRenderingContext2D, c: CockpitSession['course'], camera: CourseCamera) {
      if (this.course !== c) {
         this.course = c;
         this.build(c);
      }
      ctx.fillStyle = colors.rough;
      ctx.fillRect(0, 0, camera.w, camera.h);
      const p = camera.world({ x: c.bounds.minX - this.margin, y: c.bounds.maxY + this.margin });
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-camera.angle);
      ctx.drawImage(
         this.canvas,
         0,
         0,
         (this.canvas.width / this.scale) * camera.scale,
         (this.canvas.height / this.scale) * camera.scale,
      );
      ctx.restore();
   }
   private build(c: CockpitSession['course']) {
      const bounds = {
            minX: c.bounds.minX - this.margin,
            maxX: c.bounds.maxX + this.margin,
            minY: c.bounds.minY - this.margin,
            maxY: c.bounds.maxY + this.margin,
         },
         s = this.scale;
      this.canvas.width = Math.ceil((bounds.maxX - bounds.minX) * s);
      this.canvas.height = Math.ceil((bounds.maxY - bounds.minY) * s);
      const ctx = this.canvas.getContext('2d')!,
         w = this.canvas.width,
         h = this.canvas.height;
      const point = (p: Point) => ({ x: (p.x - bounds.minX) * s, y: (bounds.maxY - p.y) * s });
      const path = (points: Point[]) => {
         ctx.beginPath();
         points.forEach((p, i) => {
            const q = point(p);
            if (i) ctx.lineTo(q.x, q.y);
            else ctx.moveTo(q.x, q.y);
         });
         ctx.closePath();
      };
      let seed = 731;
      const random = () => {
         seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
         return seed / 4294967296;
      };
      ctx.fillStyle = colors.rough;
      ctx.fillRect(0, 0, w, h);
      // Illustrated tonal contours in the surrounding grass, not additional hazards.
      for (let i = 0; i < 28; i++) {
         const x = random() * w,
            y = random() * h,
            r = (35 + random() * 115) * s,
            phase = random() * 6;
         for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath();
            for (let j = 0; j <= 100; j++) {
               const a = (j / 100) * Math.PI * 2,
                  rr =
                     r *
                     (1 - layer * 0.17) *
                     (1 + 0.13 * Math.sin(a * 3 + phase) + 0.08 * Math.cos(a * 5 - phase));
               const px = x + Math.cos(a) * rr * 1.6,
                  py = y + Math.sin(a) * rr;
               if (j === 0) ctx.moveTo(px, py);
               else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = ['#6e905930', '#385f422b', '#2e593823'][layer];
            ctx.fill();
            ctx.strokeStyle = '#9eb47312';
            ctx.lineWidth = 0.6 * s;
            ctx.stroke();
         }
      }
      // A continuous water silhouette avoids seams between authored creek quads.
      const water = new Path2D();
      for (const surface of c.surfaces.filter(
         (surface: { type: string }) => surface.type === 'water',
      )) {
         surface.polygon.forEach((p: Point, i: number) => {
            const q = point(p);
            if (i) water.lineTo(q.x, q.y);
            else water.moveTo(q.x, q.y);
         });
         water.closePath();
      }
      const waterLayer = document.createElement('canvas');
      waterLayer.width = w;
      waterLayer.height = h;
      const wc = waterLayer.getContext('2d')!;
      wc.fillStyle = colors.water;
      wc.fill(water);
      wc.globalCompositeOperation = 'source-in';
      wc.fillStyle = '#85b4ac';
      wc.fillRect(0, 0, w, h);
      for (const surface of c.surfaces) {
         if (surface.type === 'water') continue;
         path(surface.polygon);
         ctx.fillStyle = colors[surface.type] || colors.rough;
         if (surface.type === 'deep-rough') {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.filter = `blur(${3 * s}px)`;
            ctx.fill();
            ctx.restore();
         } else {
            if (surface.type === 'fairway' || surface.type === 'green') {
               ctx.strokeStyle = surface.type === 'green' ? '#d7df9c66' : '#759650';
               ctx.lineWidth = (surface.type === 'green' ? 1.8 : 5) * s;
               ctx.stroke();
            }
            ctx.fill();
         }
         ctx.save();
         ctx.clip();
         if (['fairway', 'green', 'tee'].includes(surface.type)) {
            ctx.translate(w / 2, h / 2);
            ctx.rotate(-0.38);
            ctx.fillStyle = '#fff3c518';
            for (let x = -h - w; x < h + w; x += 14 * s)
               ctx.fillRect(x, -h - w, 7 * s, 2 * (h + w));
         } else if (surface.type === 'sand') {
            ctx.strokeStyle = '#9d906433';
            ctx.lineWidth = 3 * s;
            ctx.stroke();
         }
         ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = '#1e453d66';
      ctx.shadowBlur = 3 * s;
      ctx.shadowOffsetY = 2 * s;
      ctx.drawImage(waterLayer, 0, 0);
      ctx.restore();
      // Inset shore highlight derives from the union mask, so quad joins stay invisible.
      wc.globalCompositeOperation = 'source-in';
      wc.fillStyle = '#d5e6c5';
      wc.fillRect(0, 0, w, h);
      wc.globalCompositeOperation = 'destination-out';
      wc.translate(0, 1.6 * s);
      wc.fill(water);
      ctx.globalAlpha = 0.65;
      ctx.drawImage(waterLayer, 0, 0);
      ctx.globalAlpha = 1;
      // Broad tonal variation reads as meadow, not additional physical obstacles.
      for (let i = 0; i < 350; i++) {
         const x = random() * w,
            y = random() * h,
            r = (20 + random() * 85) * s;
         const g = ctx.createRadialGradient(x, y, 0, x, y, r);
         g.addColorStop(0, i % 2 ? '#dacb8420' : '#204b3e18');
         g.addColorStop(1, '#687d5400');
         ctx.fillStyle = g;
         ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // Soft illumination uses the simulation's height field; it changes no geometry.
      const light = document.createElement('canvas');
      light.width = Math.ceil(w / 18);
      light.height = Math.ceil(h / 18);
      const lc = light.getContext('2d')!,
         pixels = lc.createImageData(light.width, light.height);
      for (let y = 0; y < light.height; y++)
         for (let x = 0; x < light.width; x++) {
            const p = { x: bounds.minX + (x * 18) / s, y: bounds.maxY - (y * 18) / s };
            if (!Course.inBounds(c, p)) continue;
            const slope = Course.slopeAt(c, p),
               shade = Math.max(-0.055, Math.min(0.055, (slope.x - slope.y) * 0.12));
            pixels.data.set(
               shade > 0
                  ? [255, 239, 185, Math.round(shade * 255)]
                  : [26, 52, 49, Math.round(-shade * 255)],
               (y * light.width + x) * 4,
            );
         }
      lc.putImageData(pixels, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(light, 0, 0, w, h);
      // Fine, seeded grain stays still when panning and never affects a lie.
      for (let i = 0; i < 95000; i++) {
         ctx.fillStyle = i % 2 ? '#fff5ca0b' : '#143e3210';
         ctx.fillRect(random() * w, random() * h, 0.5 + random() * 2, 0.5 + random() * 2);
      }
      for (const object of c.objects) {
         if (object.kind === 'tree') {
            const p = point(object),
               r = object.canopyRadius * s;
            ctx.fillStyle = '#173e3833';
            ctx.beginPath();
            ctx.ellipse(p.x + r * 0.6, p.y + r * 0.7, r * 1.15, r * 0.9, 0.5, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 10; i++) {
               const a = i * 2.4,
                  rad = i === 0 ? 0 : r * 0.5,
                  x = p.x + Math.cos(a) * rad,
                  y = p.y + Math.sin(a) * rad;
               const g = ctx.createRadialGradient(x - r * 0.22, y - r * 0.3, 0, x, y, r * 0.65);
               g.addColorStop(0, i % 2 ? '#7e975e' : '#6c8957');
               g.addColorStop(0.55, '#4f724e');
               g.addColorStop(1, '#325a47');
               ctx.fillStyle = g;
               ctx.beginPath();
               ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
               ctx.fill();
            }
         } else if (object.kind === 'bridge') {
            const p = point({ x: object.minX, y: object.maxY }),
               bw = (object.maxX - object.minX) * s,
               bh = (object.maxY - object.minY) * s;
            ctx.fillStyle = '#c6b591';
            ctx.fillRect(p.x, p.y, bw, bh);
            ctx.strokeStyle = '#6d655666';
            ctx.lineWidth = 1;
            for (let y = 0; y < bh; y += 2 * s) {
               ctx.beginPath();
               ctx.moveTo(p.x, p.y + y);
               ctx.lineTo(p.x + bw, p.y + y);
               ctx.stroke();
            }
         }
      }
   }
}
