import { paintDaylightGrade } from './daylight-grade';
import { worldDecoration } from './world-decoration';
import { paintEstateLandmarks } from './estate-landmarks';
import { wetCell } from './shoreline';
import { worldTrees, worldWetness, worldGroundColour, worldHash } from '../course/procedural-world';
import { waterColour } from './water-material';
import { LandscapeSurround } from './landscape-surround';
import { DAYLIGHT, type Daylight } from './daylight';
import { terrainVariation, canopyStamp } from './terrain-detail';
import { Course } from '../course/course.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point, Snapshot } from '../contracts/cockpit';
import type { Bounds, CourseCamera } from './camera';

const colors: Record<string, string> = {
   rough: '#51763e',
   'deep-rough': '#294f36',
   fairway: '#83a951',
   fringe: '#699044',
   green: '#a7bf70',
   tee: '#9bb966',
   sand: '#d9c9a5',
   water: '#386e70',
   path: '#aa9e7d',
};

/** World-anchored colour and texture, cached independently of the camera. */
export class CourseAtlas {
   private surround = new LandscapeSurround();
   private canvas = document.createElement('canvas');
   private course: CockpitSession['course'] | null = null;
   private scale = 2;
   private margin = 350;
   private daylight: Daylight = 'day';
   private crowns = Array.from({ length: 12 }, (_, i) => canopyStamp(i));
   private turfMask = new Path2D();
   private ripples: { x: number; y: number; phase: number }[] = [];
   private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
   paint(
      ctx: CanvasRenderingContext2D,
      c: CockpitSession['course'],
      camera: CourseCamera,
      wind: Snapshot['wind'],
      daylight: Daylight,
   ) {
      if (this.course !== c || daylight !== this.daylight) {
         this.daylight = daylight;
         this.crowns = Array.from({ length: 12 }, (_, i) => canopyStamp(i, DAYLIGHT[daylight]));
         this.course = c;
         this.build(c);
      }
      this.surround.paint(
         ctx,
         camera,
         daylight,
         {
            minX: c.bounds.minX - this.margin + 100,
            maxX: c.bounds.maxX + this.margin - 100,
            minY: c.bounds.minY - this.margin + 100,
            maxY: c.bounds.maxY + this.margin - 100,
         },
         c,
      );
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
      const strength = Math.min(1, wind.fraction * 2);
      const bearing = (wind.rotation * Math.PI) / 180;
      const dx = Math.sin(bearing),
         dy = -Math.cos(bearing);
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      const time =
         this.reducedMotion.matches || strength === 0
            ? 0
            : (performance.now() / 2400) * (0.4 + strength);
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = `rgba(205,224,211,${0.035 + strength * 0.07 + strength * 0.02 * Math.sin(time)})`;
      ctx.beginPath();
      for (const ripple of this.ripples) {
         const t = time + ripple.phase;

         const drift = this.reducedMotion.matches ? 0 : Math.sin(t) * strength * 2;
         const x = ripple.x + dx * drift,
            y = ripple.y + dy * drift;
         const radius = 4 + strength * 2;
         ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
         ctx.ellipse(x, y, radius, 1.2, angle, 0, Math.PI);
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
                  ctx.lineTo(px + 0.18 + dx * strength * 0.35, py - 0.6 + dy * strength * 0.15);
               }
            }
         ctx.stroke();
         ctx.restore();
      }
      ctx.restore();
   }
   groundTexture(c: CockpitSession['course'], daylight: Daylight, region?: Bounds) {
      this.daylight = daylight;
      this.scale = region ? 1 : 2;
      this.build(c, false, region);
      return {
         canvas: this.canvas,
         bounds: region ?? {
            minX: c.bounds.minX - this.margin,
            maxX: c.bounds.maxX + this.margin,
            minY: c.bounds.minY - this.margin,
            maxY: c.bounds.maxY + this.margin,
         },
      };
   }
   private build(c: CockpitSession['course'], includeObjects = true, region?: Bounds) {
      const sun = DAYLIGHT[this.daylight];
      const bounds = region ?? {
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
      if (c.world?.ecologyVersion) {
         const regions = document.createElement('canvas');
         regions.width = Math.ceil(w / 8);
         regions.height = Math.ceil(h / 8);
         const rc = regions.getContext('2d')!,
            pixels = rc.createImageData(regions.width, regions.height);
         for (let py = 0; py < regions.height; py++)
            for (let px = 0; px < regions.width; px++) {
               const x = bounds.minX + ((px + 0.5) * 8) / s,
                  y = bounds.maxY - ((py + 0.5) * 8) / s;
               const clearance = Math.hypot(
                  Math.max(c.bounds.minX - x, 0, x - c.bounds.maxX),
                  Math.max(c.bounds.minY - y, 0, y - c.bounds.maxY),
               );
               if (!clearance) continue;
               const colour = worldGroundColour(c, x, y);
               pixels.data.set(
                  [...colour, Math.min(1, clearance / 24) * 255],
                  (py * regions.width + px) * 4,
               );
            }
         rc.putImageData(pixels, 0, 0);
         ctx.drawImage(regions, 0, 0, w, h);
      }
      // Quiet meadow variation, kept subordinate to the authored hole.
      for (const mark of worldDecoration(bounds, 100, 731, 104)) {
         const { x, y } = point(mark),
            r = (18 + mark.c * 85) * s;
         const g = ctx.createRadialGradient(x, y, 0, x, y, r);
         g.addColorStop(0, mark.a > 0.5 ? '#90a85b18' : '#203f3016');
         g.addColorStop(1, '#52794a00');
         ctx.fillStyle = g;
         ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // A continuous water silhouette avoids seams between authored creek quads.
      const water = new Path2D();
      for (const surface of c.surfaces.filter(
         (surface: { type: string }) => surface.type === 'water',
      )) {
         const area = surface.polygon.reduce(
            (sum: number, p: Point, i: number, points: Point[]) => {
               const q = points[(i + 1) % points.length];
               return sum + p.x * q.y - q.x * p.y;
            },
            0,
         );
         // World Y is flipped on the canvas: clockwise world polygons match positive canvas rectangles.
         const polygon = area > 0 ? [...surface.polygon].reverse() : surface.polygon;
         polygon.forEach((p: Point, i: number) => {
            const q = point(p);
            if (i) water.lineTo(q.x, q.y);
            else water.moveTo(q.x, q.y);
         });
         water.closePath();
      }
      // Interpolate the shared field's zero contour instead of painting square shoreline cells.
      const spacing = 4,
         columns = Math.ceil((bounds.maxX - bounds.minX) / spacing);
      const row = (y: number) =>
         Array.from({ length: columns + 1 }, (_, i) => {
            const x = bounds.minX + i * spacing;
            return { x, y, value: worldWetness(c, x, y) };
         });
      let bottom = row(bounds.minY);
      for (let y = bounds.minY; y < bounds.maxY; y += spacing) {
         const top = row(y + spacing);
         for (let i = 0; i < columns; i++) {
            const x = bottom[i].x;
            if (
               x >= c.bounds.minX &&
               x <= c.bounds.maxX &&
               y >= c.bounds.minY &&
               y <= c.bounds.maxY
            )
               continue;
            for (const polygon of wetCell([bottom[i], top[i], top[i + 1], bottom[i + 1]])) {
               polygon.forEach((p, j) => {
                  const q = point(p);
                  if (j) water.lineTo(q.x, q.y);
                  else water.moveTo(q.x, q.y);
               });
               water.closePath();
            }
         }
         bottom = top;
      }

      this.ripples = [];
      for (const mark of worldDecoration(bounds, 50, 919)) {
         const { x, y } = point(mark);
         if (
            ctx.isPointInPath(water, x, y) &&
            ctx.isPointInPath(water, x - 11, y) &&
            ctx.isPointInPath(water, x + 11, y) &&
            ctx.isPointInPath(water, x, y - 3) &&
            ctx.isPointInPath(water, x, y + 3)
         )
            this.ripples.push({ x, y, phase: mark.c * Math.PI * 2 });
         if (this.ripples.length >= 160) break;
      }
      const waterLayer = document.createElement('canvas');
      waterLayer.width = w;
      waterLayer.height = h;
      const wc = waterLayer.getContext('2d')!;
      wc.fillStyle = colors.water;
      wc.fill(water);
      // Sample a small union mask: shore distance follows banks, never lake centres.
      const step = 4;
      const material = document.createElement('canvas');
      material.width = Math.ceil(w / step);
      material.height = Math.ceil(h / step);
      const mc = material.getContext('2d')!;
      mc.scale(1 / step, 1 / step);
      mc.fill(water);
      const mask = mc.getImageData(0, 0, material.width, material.height);
      const mw = material.width,
         mh = material.height;
      const distance = new Float32Array(mw * mh);
      for (let i = 0; i < distance.length; i++) distance[i] = mask.data[i * 4 + 3] > 127 ? 1000 : 0;
      for (let y = 0; y < mh; y++)
         for (let x = 0; x < mw; x++) {
            const i = y * mw + x;
            distance[i] = Math.min(
               distance[i],
               x ? distance[i - 1] + 1 : 0,
               y ? distance[i - mw] + 1 : 0,
            );
         }
      for (let y = mh - 1; y >= 0; y--)
         for (let x = mw - 1; x >= 0; x--) {
            const i = y * mw + x;
            distance[i] = Math.min(
               distance[i],
               x < mw - 1 ? distance[i + 1] + 1 : 0,
               y < mh - 1 ? distance[i + mw] + 1 : 0,
            );
            const colour = waterColour(
               bounds.minX + ((x + 0.5) * step) / s,
               bounds.maxY - ((y + 0.5) * step) / s,
               (distance[i] * step) / s,
               this.daylight,
            );
            mask.data.set([...colour, 255], i * 4);
         }
      mc.putImageData(mask, 0, 0);
      wc.globalCompositeOperation = 'source-in';
      wc.drawImage(material, 0, 0, w, h);
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
      ctx.drawImage(
         terrainVariation(w, h, { minX: bounds.minX, maxY: bounds.maxY, scale: s }),
         0,
         0,
         w,
         h,
      );
      // Fine directional turf fibres; world-anchored so they do not swim on pan.
      for (let shade = 0; shade < 3; shade++) {
         ctx.strokeStyle = ['#e4dfaa18', '#152c2020', '#91a76424'][shade];
         ctx.lineWidth = 0.55;
         ctx.beginPath();
         for (const mark of worldDecoration(bounds, 13, 101 + shade)) {
            const { x, y } = point(mark);
            ctx.moveTo(x, y);
            ctx.lineTo(x + (0.15 + mark.a * 0.5) * s, y - (0.4 + mark.c) * s);
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
      for (const mark of worldDecoration(bounds, 32, 237, 8)) {
         const { x, y } = point(mark);
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
      // Remote lakes can merge with drainage; only authored banks receive rock outlines.
      for (const polygon of [
         ...c.surfaces
            .filter((v: { id: string }) => v.id.startsWith('estate-lake-'))
            .map((v: { polygon: Point[] }) => v.polygon),
      ]) {
         for (let i = 0; i < polygon.length; i++) {
            const a = point(polygon[i]),
               b = point(polygon[(i + 1) % polygon.length]);
            const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / s);
            for (let j = 0; j < steps; j++) {
               const t = j / steps,
                  x = a.x + (b.x - a.x) * t,
                  y = a.y + (b.y - a.y) * t;
               seed = Math.floor(
                  worldHash(Math.floor(polygon[i].x * 10) + j, Math.floor(polygon[i].y * 10)) *
                     4294967295,
               );
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
            if (Course.surfaceAt(c, p).type === 'water') continue;
            const slope = Course.slopeAt(c, p),
               shade = Math.max(
                  -0.055,
                  Math.min(0.055, -(slope.x * sun.x + slope.y * sun.y) * 0.12),
               );
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
      for (const mark of worldDecoration(bounds, 5, 613, 2)) {
         const { x, y } = point(mark);
         ctx.fillStyle = mark.c > 0.5 ? '#fff5ca0b' : '#143e3210';
         ctx.fillRect(x, y, (0.25 + mark.a) * s, (0.25 + mark.b) * s);
      }
      const scenicTrees = worldTrees(c, bounds);
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
               const x = p.x - r * sun.x * sun.length + Math.cos(a) * r * rr;
               const y = p.y + r * sun.y * sun.length + Math.sin(a) * r * rr * 0.85;
               if (k) ctx.lineTo(x, y);
               else ctx.moveTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            const variant =
               Math.abs(Math.floor(object.x * 31 + object.y * 17)) % this.crowns.length;
            if (includeObjects) ctx.drawImage(this.crowns[variant], p.x - r, p.y - r, r * 2, r * 2);
            ctx.restore();
         } else if (includeObjects && object.kind === 'bridge') {
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
      paintEstateLandmarks(
         ctx,
         c.objects,
         c.places ?? [],
         point,
         s,
         this.daylight,
         !includeObjects,
      );
      // One world-anchored grade for both the estate atlas and surrounding tiles.
      paintDaylightGrade(ctx, bounds, c.bounds, s, this.daylight);
      if (!includeObjects) return;
      // Fade only the remote cache perimeter; the playable course remains fully opaque.
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      const fade = 100 * s;
      for (const [x0, y0, x1, y1] of [
         [0, 0, fade, 0],
         [w, 0, w - fade, 0],
         [0, 0, 0, fade],
         [0, h, 0, h - fade],
      ]) {
         const mask = ctx.createLinearGradient(x0, y0, x1, y1);
         mask.addColorStop(0, '#0000');
         mask.addColorStop(1, '#000');
         ctx.fillStyle = mask;
         ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
   }
}
