import { Course } from '../course/course.js';
import { Shot } from '../simulation/shot.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';

const palette: Record<string, string> = {
   rough: '#65764b',
   'deep-rough': '#3d5942',
   fairway: '#91ad66',
   green: '#b3c685',
   fringe: '#9ab773',
   tee: '#a8bd79',
   sand: '#ded2ae',
   water: '#507e85',
   path: '#afa88c',
};
export class SimpleCourse {
   private canvas: HTMLCanvasElement;
   private ctx: CanvasRenderingContext2D;
   private base = document.createElement('canvas');
   private cache = '';
   private photo: { paint: Function; ready: Function } | null = null;
   private photoLoading = false;
   private previewRevision = -1;
   private preview: { x: number; y: number; z: number } | null = null;
   camera = { x: 0, y: 0, w: 0, h: 0, scale: 1, angle: 0, zoom: 1 };
   constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d')!;
   }
   private world(p: Point) {
      return {
         x: (p.x - this.camera.x) * this.camera.scale + this.camera.w / 2,
         y: this.camera.h / 2 - (p.y - this.camera.y) * this.camera.scale,
      };
   }
   private path(ctx: CanvasRenderingContext2D, points: Point[]) {
      ctx.beginPath();
      points.forEach((p, i) => {
         const q = this.world(p);
         if (i) ctx.lineTo(q.x, q.y);
         else ctx.moveTo(q.x, q.y);
      });
      ctx.closePath();
   }
   draw(session: CockpitSession, time: number) {
      const rect = this.canvas.getBoundingClientRect(),
         dpr = Math.min(devicePixelRatio || 1, 2),
         c = session.course;
      const bounds = c.plate.worldBounds;
      // A fixed overhead camera keeps the touchpad axes intuitive. Camera changes are phone commands.
      const center =
         session.view === 'ball'
            ? session.ball
            : session.view === 'green'
              ? c.greenCenter
              : { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
      const zoom = session.view === 'hole' ? 1 : session.view === 'green' ? 5 : 3;
      this.camera = {
         x: center.x,
         y: center.y,
         w: rect.width,
         h: rect.height,
         angle: 0,
         zoom,
         scale:
            Math.min(
               (rect.width - 50) / (bounds.maxX - bounds.minX),
               (rect.height - 50) / (bounds.maxY - bounds.minY),
            ) * zoom,
      };
      if (
         this.canvas.width !== Math.round(rect.width * dpr) ||
         this.canvas.height !== Math.round(rect.height * dpr)
      ) {
         this.canvas.width = Math.round(rect.width * dpr);
         this.canvas.height = Math.round(rect.height * dpr);
      }
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (session.renderer === 'photo' && !this.photoLoading) {
         this.photoLoading = true;
         void import('./photo-renderer.js').then(({ PhotoRenderer, PhotoAssets }) => {
            this.photo = PhotoRenderer.create(PhotoAssets, () => {});
         });
      }
      if (session.renderer === 'photo' && this.photo?.ready())
         this.photo.paint(ctx, c, this.camera, dpr);
      else {
         const key = JSON.stringify([this.camera, c.revision, session.setup]);
         if (key !== this.cache) {
            this.cache = key;
            this.base.width = this.canvas.width;
            this.base.height = this.canvas.height;
            const b = this.base.getContext('2d')!;
            b.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.paintGround(b, c);
         }
         ctx.drawImage(
            this.base,
            0,
            0,
            this.canvas.width,
            this.canvas.height,
            0,
            0,
            rect.width,
            rect.height,
         );
      }
      const pin = this.world(c.pin);
      ctx.fillStyle = '#263b31';
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f8efcd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(pin.x, pin.y - 23);
      ctx.stroke();
      ctx.fillStyle = '#e6aa73';
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y - 23);
      ctx.lineTo(pin.x + 15, pin.y - 19);
      ctx.lineTo(pin.x, pin.y - 15);
      ctx.fill();
      let ball = session.ball;
      if (session.phase === 'animating' && session.last) {
         const trace = session.last.result.trajectory,
            elapsed = ((time - session.animationStarted) / 1000) * 3;
         if (elapsed >= session.last.result.duration) {
            session.finish();
            ball = session.ball;
         } else {
            let i = 1;
            while (i < trace.length - 1 && trace[i].t < elapsed) i++;
            const a = trace[i - 1],
               b = trace[i],
               f = Math.min(1, (elapsed - a.t) / (b.t - a.t || 1));
            ball = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f };
         }
      }
      if (session.phase === 'plan') {
         const a = this.world(ball),
            p = this.world(session.aim);
         ctx.strokeStyle = '#fcf4d5aa';
         ctx.lineWidth = 1.5;
         ctx.setLineDash([5, 5]);
         ctx.beginPath();
         ctx.moveTo(a.x, a.y);
         ctx.lineTo(p.x, p.y);
         ctx.stroke();
         ctx.setLineDash([]);
         ctx.strokeStyle = '#fff6da';
         ctx.beginPath();
         ctx.arc(p.x, p.y, 5 + session.intent.effort * 2, 0, Math.PI * 2);
         ctx.stroke();
         // Show the deterministic launch vector, not an invented landing prediction.
         // Club, effort and height affect it through the actual launch calculation.
         if (this.previewRevision !== session.revision) {
            this.previewRevision = session.revision;
            try {
               this.preview = Shot.buildLaunch(
                  c,
                  session.day(),
                  Shot.player,
                  { ...session.intent, start: session.ball, aim: session.aim, variance: false },
                  0,
               ).velocity;
            } catch {
               this.preview = null;
            }
         }
         if (this.preview) {
            const end = this.world({
               x: ball.x + this.preview.x * 0.8,
               y: ball.y + this.preview.y * 0.8,
            });
            const shape = session.intent.shape * 12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo((a.x + end.x) / 2 + shape, (a.y + end.y) / 2, end.x, end.y);
            ctx.stroke();
         }
      }
      const q = this.world(ball),
         height = Math.max(0, (ball.z ?? 0) - Course.heightAt(c, ball));
      ctx.fillStyle = '#20392b55';
      ctx.beginPath();
      ctx.ellipse(q.x + 3, q.y + 3, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      if (session.last?.result.status !== 'holed' || session.phase !== 'resolved') {
         ctx.fillStyle = '#fffdf1';
         ctx.beginPath();
         ctx.arc(
            q.x,
            q.y - Math.min(22, height * 0.3),
            4 + Math.min(4, height * 0.05),
            0,
            Math.PI * 2,
         );
         ctx.fill();
      }
   }
   private paintGround(ctx: CanvasRenderingContext2D, c: CockpitSession['course']) {
      ctx.fillStyle = palette.rough;
      ctx.fillRect(0, 0, this.camera.w, this.camera.h);
      for (const s of c.surfaces) {
         this.path(ctx, s.polygon);
         ctx.fillStyle = palette[s.type] || palette.rough;
         ctx.fill();
         if (['fairway', 'green', 'tee'].includes(s.type)) {
            ctx.save();
            ctx.clip();
            ctx.fillStyle = '#f6efc710';
            for (let x = 0; x < this.camera.w; x += 26) ctx.fillRect(x, 0, 13, this.camera.h);
            ctx.restore();
         }
      }
      // Coarse terrain illumination from the same height field used by the ball.
      const light = document.createElement('canvas');
      light.width = Math.ceil(this.camera.w / 12);
      light.height = Math.ceil(this.camera.h / 12);
      const lighting = light.getContext('2d')!,
         pixels = lighting.createImageData(light.width, light.height);
      for (let x = 0; x < light.width; x++)
         for (let y = 0; y < light.height; y++) {
            const p = {
               x: this.camera.x + (x * 12 - this.camera.w / 2) / this.camera.scale,
               y: this.camera.y - (y * 12 - this.camera.h / 2) / this.camera.scale,
            };
            if (!Course.inBounds(c, p)) continue;
            const s = Course.slopeAt(c, p),
               shade = Math.max(-0.1, Math.min(0.1, (s.x - s.y) * 0.25)),
               i = (y * light.width + x) * 4;
            pixels.data.set(
               shade > 0
                  ? [255, 249, 219, Math.round(shade * 255)]
                  : [16, 36, 28, Math.round(-shade * 255)],
               i,
            );
         }
      lighting.putImageData(pixels, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(light, 0, 0, this.camera.w, this.camera.h);
      ctx.restore();
      for (const o of c.objects) {
         if (o.kind === 'tree') {
            const p = this.world(o),
               r = Math.max(2, o.canopyRadius * this.camera.scale);
            ctx.fillStyle = '#20372d38';
            ctx.beginPath();
            ctx.arc(p.x + r * 0.25, p.y + r * 0.35, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#365841';
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#66825a';
            ctx.beginPath();
            ctx.arc(p.x - r * 0.2, p.y - r * 0.2, r * 0.65, 0, Math.PI * 2);
            ctx.fill();
         } else if (o.kind === 'bridge') {
            const p = this.world({ x: o.minX, y: o.maxY });
            ctx.fillStyle = '#c4b58d';
            ctx.fillRect(
               p.x,
               p.y,
               (o.maxX - o.minX) * this.camera.scale,
               (o.maxY - o.minY) * this.camera.scale,
            );
         }
      }
   }
}
