import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';
import type { CourseCamera } from './camera';

const colors: Record<string, string> = {
   rough: '#54794b',
   'deep-rough': '#365d42',
   fairway: '#91b171',
   fringe: '#719754',
   green: '#b7cb86',
   tee: '#a6bb7e',
   sand: '#e6d9b4',
   water: '#527f78',
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
      // Quiet meadow variation, kept subordinate to the authored hole.
      for (let i = 0; i < 220; i++) {
         const x = random() * w,
            y = random() * h,
            r = (18 + random() * 85) * s;
         const g = ctx.createRadialGradient(x, y, 0, x, y, r);
         g.addColorStop(0, i % 2 ? '#90a85b18' : '#203f3016');
         g.addColorStop(1, '#52794a00');
         ctx.fillStyle = g;
         ctx.fillRect(x - r, y - r, r * 2, r * 2);
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
      const depth = wc.createLinearGradient(0, 0, w, h);
      depth.addColorStop(0, '#72988b');
      depth.addColorStop(0.5, '#48786e');
      depth.addColorStop(1, '#6a9c8e');
      wc.fillStyle = depth;
      wc.fillRect(0, 0, w, h);
      for (const surface of c.surfaces) {
         if (surface.type === 'water') continue;
         path(surface.polygon);
         ctx.fillStyle = colors[surface.type] || colors.rough;
         if (surface.type === 'deep-rough') {
            ctx.save();
            ctx.globalAlpha = 0.3;
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
            const wash = ctx.createLinearGradient(0, 0, w, h);
            wash.addColorStop(0, '#f1e2a81f');
            wash.addColorStop(1, '#1d523b18');
            ctx.fillStyle = wash;
            ctx.fillRect(0, 0, w, h);
            ctx.translate(w / 2, h / 2);
            ctx.rotate(-0.38);
            ctx.fillStyle = '#fff3c510';
            for (let x = -h - w; x < h + w; x += 14 * s)
               ctx.fillRect(x, -h - w, 7 * s, 2 * (h + w));
         } else if (surface.type === 'sand') {
            ctx.fillStyle = '#e3d7b0';
            ctx.fill();
            ctx.strokeStyle = '#687b4055';
            ctx.lineWidth = 3 * s;
            ctx.stroke();
            ctx.strokeStyle = '#faf0d24a';
            ctx.lineWidth = 0.4 * s;
            for (let y = 0; y < h; y += 2.3 * s) {
               ctx.beginPath();
               ctx.moveTo(0, y);
               ctx.lineTo(w, y + 40 * s);
               ctx.stroke();
            }
            ctx.shadowColor = '#74683f55';
            ctx.shadowBlur = 2 * s;
            ctx.shadowOffsetY = 2 * s;
            ctx.strokeStyle = '#b3a77a';
            ctx.lineWidth = 0.7 * s;
            path(surface.polygon);
            ctx.stroke();
            ctx.shadowColor = 'transparent';
         }
         ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = '#1e453d66';
      ctx.shadowBlur = 3 * s;
      ctx.shadowOffsetY = 2 * s;
      ctx.drawImage(waterLayer, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.clip(water);
      ctx.strokeStyle = '#dfebc92b';
      ctx.lineWidth = 0.45 * s;
      for (let i = 0; i < 2200; i++) {
         const x = random() * w,
            y = random() * h;
         ctx.beginPath();
         ctx.moveTo(x, y);
         ctx.quadraticCurveTo(x + 3 * s, y + s, x + 7 * s, y);
         ctx.stroke();
      }
      ctx.restore();
      // Inset shore highlight derives from the union mask, so quad joins stay invisible.
      wc.globalCompositeOperation = 'source-in';
      wc.fillStyle = '#d8d7a4';
      wc.fillRect(0, 0, w, h);
      wc.globalCompositeOperation = 'destination-out';
      wc.translate(0, 1.6 * s);
      wc.fill(water);
      ctx.globalAlpha = 0.65;
      ctx.drawImage(waterLayer, 0, 0);
      ctx.globalAlpha = 1;
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
            ctx.save();
            ctx.fillStyle = '#152f2c40';
            ctx.beginPath();
            ctx.ellipse(p.x + r * 0.65, p.y + r * 0.85, r * 1.1, r * 0.8, 0.55, 0, Math.PI * 2);
            ctx.fill();
            const phase = random() * 6.28;
            ctx.beginPath();
            for (let k = 0; k <= 64; k++) {
               const a = (k / 64) * Math.PI * 2,
                  rr = r * (0.88 + 0.065 * Math.sin(5 * a + phase) + 0.045 * Math.sin(9 * a));
               const x = p.x + Math.cos(a) * rr,
                  y = p.y + Math.sin(a) * rr;
               if (k) ctx.lineTo(x, y);
               else ctx.moveTo(x, y);
            }
            ctx.closePath();
            const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, 0, p.x, p.y, r);
            const warm = random() > 0.55;
            g.addColorStop(0, warm ? '#91a466' : '#7d9b68');
            g.addColorStop(0.55, warm ? '#57794d' : '#416e4f');
            g.addColorStop(1, '#284f3d');
            ctx.fillStyle = g;
            ctx.fill();
            ctx.clip();
            for (let k = 0; k < 60; k++) {
               const a = random() * Math.PI * 2,
                  rr = Math.sqrt(random()) * r,
                  x = p.x + Math.cos(a) * rr,
                  y = p.y + Math.sin(a) * rr;
               const size = (0.09 + random() * 0.14) * r;
               ctx.fillStyle = k % 3 === 0 ? '#d2d58a28' : k % 3 === 1 ? '#133f343d' : '#97b17630';
               ctx.beginPath();
               ctx.ellipse(x, y, size, size * 0.6, -0.5, 0, Math.PI * 2);
               ctx.fill();
            }
            ctx.restore();
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
      // A restrained warm-to-cool daylight grade unifies grass, sand and crowns.
      const daylight = ctx.createLinearGradient(0, 0, w, h);
      daylight.addColorStop(0, '#f8d3940b');
      daylight.addColorStop(0.55, '#ebedb200');
      daylight.addColorStop(1, '#123b3620');
      ctx.fillStyle = daylight;
      ctx.fillRect(0, 0, w, h);
   }
}
