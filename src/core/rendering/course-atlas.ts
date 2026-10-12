import { terrainVariation, canopyStamp } from './terrain-detail';
import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';
import type { CourseCamera } from './camera';

const colors: Record<string, string> = {
   rough: '#526c3d',
   'deep-rough': '#314c32',
   fairway: '#7f9b52',
   fringe: '#698246',
   green: '#a2b574',
   tee: '#97ac69',
   sand: '#d9c9a5',
   water: '#386e70',
   path: '#aa9e7d',
};

/** World-anchored colour and texture, cached independently of the camera. */
export class CourseAtlas {
   private canvas = document.createElement('canvas');
   private course: CockpitSession['course'] | null = null;
   private scale = 2;
   private margin = 350;
   private crowns = Array.from({ length: 12 }, (_, i) => canopyStamp(i));
   private turfMask = new Path2D();
   private ripples: { x: number; y: number; phase: number }[] = [];
   private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
      // A small animated pass sits over the cached terrain, clipped to real water.
      ctx.scale(camera.scale / this.scale, camera.scale / this.scale);
      ctx.save();
      if (camera.scale > 2.4) {
         for (const tree of c.objects) {
            if (tree.kind !== 'tree') continue;
            const q = camera.world(tree),
               rr = tree.canopyRadius * camera.scale;
            if (q.x < -rr || q.x > camera.w + rr || q.y < -rr || q.y > camera.h + rr) continue;
            const x = (tree.x - c.bounds.minX + this.margin) * this.scale;
            const y = (c.bounds.maxY + this.margin - tree.y) * this.scale;
            const r = tree.canopyRadius * this.scale;
            const variant = Math.abs(Math.floor(tree.x * 31 + tree.y * 17)) % this.crowns.length;
            ctx.drawImage(this.crowns[variant], x - r, y - r, r * 2, r * 2);
         }
      }
      const time = this.reducedMotion.matches ? 0 : performance.now() / 2400;
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = `rgba(205,224,211,${0.08 + 0.025 * Math.sin(time)})`;
      ctx.beginPath();
      for (const ripple of this.ripples) {
         const t = time + ripple.phase;

         ctx.moveTo(ripple.x + Math.sin(t) * 2 + 5 + Math.sin(t) * 2, ripple.y);
         ctx.ellipse(
            ripple.x + Math.sin(t) * 2,
            ripple.y,
            5 + Math.sin(t) * 2,
            1.2,
            -0.2,
            0,
            Math.PI,
         );
      }
      ctx.stroke();
      ctx.restore();
      if (camera.scale > 2.4) {
         ctx.save();
         ctx.clip(this.turfMask);
         const corners = [
            [0, 0],
            [camera.w, 0],
            [0, camera.h],
            [camera.w, camera.h],
         ].map(([x, y]) => camera.inverse({ x, y }));
         const minX = Math.floor(
            ((Math.min(...corners.map((p) => p.x)) - c.bounds.minX + this.margin) * this.scale) /
               12,
         );
         const maxX = Math.ceil(
            ((Math.max(...corners.map((p) => p.x)) - c.bounds.minX + this.margin) * this.scale) /
               12,
         );
         const minY = Math.floor(
            ((c.bounds.maxY + this.margin - Math.max(...corners.map((p) => p.y))) * this.scale) /
               12,
         );
         const maxY = Math.ceil(
            ((c.bounds.maxY + this.margin - Math.min(...corners.map((p) => p.y))) * this.scale) /
               12,
         );
         ctx.globalAlpha = Math.min(0.2, (camera.scale - 2.4) / 14);
         ctx.strokeStyle = '#9aa975';
         ctx.lineWidth = 0.23;
         ctx.beginPath();
         for (let y = minY; y <= maxY; y++)
            for (let x = minX; x <= maxX; x++) {
               let seed = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
               for (let k = 0; k < 8; k++) {
                  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                  const px = x * 12 + ((seed & 65535) / 65535) * 12;
                  const py = y * 12 + ((seed >>> 16) / 65535) * 12;
                  ctx.moveTo(px, py);
                  ctx.lineTo(px + 0.18, py - 0.6);
               }
            }
         ctx.stroke();
         ctx.restore();
      }
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
      this.turfMask = new Path2D();
      for (const surface of c.surfaces.filter((v: { type: string }) =>
         ['fairway', 'green', 'tee'].includes(v.type),
      )) {
         surface.polygon.forEach((p: Point, i: number) => {
            const q = point(p);
            if (i) this.turfMask.lineTo(q.x, q.y);
            else this.turfMask.moveTo(q.x, q.y);
         });
         this.turfMask.closePath();
      }
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
      const scenicWater: Point[][] = [];
      for (const [cx, cy, rx, ry] of [
         [c.bounds.minX - 175, 400, 115, 240],
         [c.bounds.maxX + 220, -20, 95, 180],
      ]) {
         scenicWater.push(
            Array.from({ length: 100 }, (_, i) => {
               const a = (i / 100) * Math.PI * 2;
               const r = 1 + 0.08 * Math.sin(a * 5) + 0.045 * Math.cos(a * 9);
               return { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r };
            }),
         );
      }
      for (const polygon of scenicWater) {
         polygon.forEach((p, i) => {
            const q = point(p);
            if (i) water.lineTo(q.x, q.y);
            else water.moveTo(q.x, q.y);
         });
         water.closePath();
      }
      // Continue the authored creek beyond its endpoints, never inside playable bounds.
      const creek = c.surfaces.filter((v: { id: string }) => v.id.startsWith('woodland-creek-'));
      if (creek.length) {
         const ends = [
            [creek[0].polygon[0], creek[0].polygon[3], bounds.maxY, 1],
            [creek.at(-1).polygon[1], creek.at(-1).polygon[2], bounds.minY, -1],
         ] as const;
         for (const [left, right, endY, direction] of ends) {
            const bankA: Point[] = [],
               bankB: Point[] = [];
            for (let i = 0; i <= 40; i++) {
               const t = i / 40,
                  drift = Math.sin(t * 5) * 35 * t;
               bankA.push({ x: left.x + drift - t * 8, y: left.y + (endY - left.y) * t });
               bankB.push({ x: right.x + drift + t * 8, y: right.y + (endY - right.y) * t });
            }
            if (
               (direction > 0 && left.y > c.bounds.maxY) ||
               (direction < 0 && left.y < c.bounds.minY)
            ) {
               [...bankA, ...bankB.reverse()].forEach((p, i) => {
                  const q = point(p);
                  if (i) water.lineTo(q.x, q.y);
                  else water.moveTo(q.x, q.y);
               });
               water.closePath();
            }
         }
      }

      this.ripples = [];
      for (let i = 0; i < 900; i++) {
         const x = random() * w,
            y = random() * h;
         if (
            ctx.isPointInPath(water, x, y) &&
            ctx.isPointInPath(water, x - 11, y) &&
            ctx.isPointInPath(water, x + 11, y) &&
            ctx.isPointInPath(water, x, y - 3) &&
            ctx.isPointInPath(water, x, y + 3)
         )
            this.ripples.push({ x, y, phase: random() * Math.PI * 2 });
         if (this.ripples.length >= 160) break;
      }
      const waterLayer = document.createElement('canvas');
      waterLayer.width = w;
      waterLayer.height = h;
      const wc = waterLayer.getContext('2d')!;
      wc.fillStyle = colors.water;
      wc.fill(water);
      wc.globalCompositeOperation = 'source-in';
      const depth = wc.createLinearGradient(0, 0, w, h);
      depth.addColorStop(0, '#658c80');
      depth.addColorStop(0.5, '#305e63');
      depth.addColorStop(1, '#56887d');
      wc.fillStyle = depth;
      wc.fillRect(0, 0, w, h);
      for (const lake of c.surfaces.filter((surface: { id: string }) =>
         surface.id.startsWith('estate-lake-'),
      )) {
         const ps = lake.polygon.map(point);
         const minX = Math.min(...ps.map((p: Point) => p.x)),
            maxX = Math.max(...ps.map((p: Point) => p.x));
         const minY = Math.min(...ps.map((p: Point) => p.y)),
            maxY = Math.max(...ps.map((p: Point) => p.y));
         const x = (minX + maxX) / 2,
            y = (minY + maxY) / 2,
            radius = Math.max(maxX - minX, maxY - minY) / 2;
         wc.save();
         wc.beginPath();
         ps.forEach((p: Point, i: number) => (i ? wc.lineTo(p.x, p.y) : wc.moveTo(p.x, p.y)));
         wc.closePath();
         wc.clip();
         const waterDepth = wc.createRadialGradient(
            x - radius * 0.15,
            y + radius * 0.12,
            0,
            x,
            y,
            radius,
         );
         waterDepth.addColorStop(0, '#203f48');
         waterDepth.addColorStop(0.55, '#315f66');
         waterDepth.addColorStop(0.84, '#568980');
         waterDepth.addColorStop(1, '#8b9e86');
         wc.fillStyle = waterDepth;
         wc.fillRect(minX, minY, maxX - minX, maxY - minY);
         wc.restore();
      }
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
            if (surface.type === 'path') {
               ctx.strokeStyle = '#3b603949';
               ctx.lineWidth = 3 * s;
               ctx.stroke();
            }
            if (surface.type === 'fairway' || surface.type === 'green') {
               ctx.strokeStyle = surface.type === 'green' ? '#aabb8433' : '#607b43';
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
            ctx.fillStyle = '#eef2c211';
            for (let x = -h - w; x < h + w; x += 14 * s)
               ctx.fillRect(x, -h - w, 7 * s, 2 * (h + w));
         } else if (surface.type === 'sand') {
            ctx.fillStyle = '#d9c9a5';
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
      ctx.drawImage(terrainVariation(w, h), 0, 0, w, h);
      // Fine directional turf fibres; world-anchored so they do not swim on pan.
      for (let shade = 0; shade < 3; shade++) {
         ctx.strokeStyle = ['#e4dfaa18', '#152c2020', '#91a76424'][shade];
         ctx.lineWidth = 0.55;
         ctx.beginPath();
         for (let i = 0; i < 14000; i++) {
            const x = random() * w,
               y = random() * h;
            ctx.moveTo(x, y);
            ctx.lineTo(x + 0.3 + random(), y - 0.8 - random() * 2);
         }
         ctx.stroke();
      }
      // Broad, warm banks make the estate lakes readable without changing their footprint.
      for (const lake of c.surfaces.filter((surface: { id: string }) =>
         surface.id.startsWith('estate-lake-'),
      )) {
         path(lake.polygon);
         ctx.strokeStyle = '#365933';
         ctx.lineWidth = 7 * s;
         ctx.stroke();
         ctx.strokeStyle = '#999377';
         ctx.lineWidth = 3 * s;
         ctx.stroke();
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
      for (const polygon of [
         ...c.surfaces
            .filter((v: { id: string }) => v.id.startsWith('estate-lake-'))
            .map((v: { polygon: Point[] }) => v.polygon),
         ...scenicWater,
      ]) {
         for (let i = 0; i < polygon.length; i++) {
            const a = point(polygon[i]),
               b = point(polygon[(i + 1) % polygon.length]);
            const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2);
            for (let j = 0; j < steps; j++) {
               const t = j / steps,
                  x = a.x + (b.x - a.x) * t,
                  y = a.y + (b.y - a.y) * t;
               if (random() < 0.28) continue;
               ctx.fillStyle = ['#a5a38a', '#737d60', '#526545', '#c2b797'][
                  Math.floor(random() * 4)
               ];
               ctx.beginPath();
               ctx.ellipse(
                  x + (random() - 0.5) * 3 * s,
                  y + (random() - 0.5) * 3 * s,
                  (0.35 + random()) * s,
                  (0.2 + random() * 0.5) * s,
                  random() * 3,
                  0,
                  Math.PI * 2,
               );
               ctx.fill();
            }
         }
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
      const scenicTrees: { kind: string; x: number; y: number; canopyRadius: number }[] = [];
      for (let i = 0; i < 1400; i++) {
         const x = bounds.minX + random() * (bounds.maxX - bounds.minX);
         const y = bounds.minY + random() * (bounds.maxY - bounds.minY);
         const radius = 5 + random() * 10;
         if (
            x > c.bounds.minX - radius - 8 &&
            x < c.bounds.maxX + radius + 8 &&
            y > c.bounds.minY - radius - 8 &&
            y < c.bounds.maxY + radius + 8
         )
            continue;
         const p = point({ x, y });
         if (ctx.isPointInPath(water, p.x, p.y)) continue;
         // Broad glades interrupt the forest, avoiding a uniform ring around the bounds.
         if (Math.sin(x * 0.018 + Math.cos(y * 0.009)) + Math.cos(y * 0.025) < -0.45) continue;
         scenicTrees.push({ kind: 'tree', x, y, canopyRadius: radius });
      }
      for (const object of [...scenicTrees, ...c.objects]) {
         if (object.kind === 'tree') {
            const p = point(object),
               r = object.canopyRadius * s;
            ctx.save();
            ctx.fillStyle = '#10251e50';
            ctx.shadowColor = '#10251e55';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            for (let k = 0; k <= 48; k++) {
               const a = (k / 48) * Math.PI * 2;
               const rr = 1 + 0.08 * Math.sin(a * 7) + 0.06 * Math.cos(a * 11);
               const x = p.x + r * 0.68 + Math.cos(a) * r * rr;
               const y = p.y + r * 0.9 + Math.sin(a) * r * rr * 0.85;
               if (k) ctx.lineTo(x, y);
               else ctx.moveTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            const variant =
               Math.abs(Math.floor(object.x * 31 + object.y * 17)) % this.crowns.length;
            ctx.drawImage(this.crowns[variant], p.x - r, p.y - r, r * 2, r * 2);
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
