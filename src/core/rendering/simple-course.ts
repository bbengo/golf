import { CourseAtlas } from './course-atlas';
import { CourseCamera } from './camera';
import { Course } from '../course/course.js';
import { Shot } from '../simulation/shot.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';

export class SimpleCourse {
   private canvas: HTMLCanvasElement;
   private ctx: CanvasRenderingContext2D;
   private atlas = new CourseAtlas();
   private lastTime = 0;
   private viewRevision = -1;
   private shotStarted = -1;
   private following = false;
   private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
   private photo: { paint: Function; ready: Function } | null = null;
   private photoLoading = false;
   private previewRevision = -1;
   private preview: { x: number; y: number; z: number } | null = null;
   camera = new CourseCamera();
   private menuCamera = new CourseCamera();
   constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d')!;
      let pointer: { x: number; y: number; id: number; rotate: boolean } | null = null;
      const manual = () => {
         this.following = false;
         canvas.dataset.cameraMode = 'manual';
      };
      canvas.addEventListener('pointerdown', (e) => {
         if (e.button !== 0 && e.button !== 2) return;
         manual();
         pointer = {
            x: e.clientX,
            y: e.clientY,
            id: e.pointerId,
            rotate: e.button === 2 || e.shiftKey,
         };
         canvas.setPointerCapture(e.pointerId);
         canvas.classList.add('is-dragging');
         canvas.focus();
      });
      canvas.addEventListener('pointermove', (e) => {
         if (!pointer || pointer.id !== e.pointerId) return;
         if (pointer.rotate) this.camera.rotate(-(e.clientX - pointer.x) * 0.006);
         else this.camera.pan(e.clientX - pointer.x, e.clientY - pointer.y);
         pointer = { ...pointer, x: e.clientX, y: e.clientY };
      });
      const release = () => {
         pointer = null;
         canvas.classList.remove('is-dragging');
      };
      canvas.addEventListener('pointerup', release);
      canvas.addEventListener('pointercancel', release);
      canvas.addEventListener('lostpointercapture', release);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener(
         'wheel',
         (e) => {
            e.preventDefault();
            manual();
            const r = canvas.getBoundingClientRect();
            const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1);
            this.camera.zoomAt(
               { x: e.clientX - r.left, y: e.clientY - r.top },
               Math.exp(-Math.max(-400, Math.min(400, delta)) * 0.002),
            );
         },
         { passive: false },
      );
      canvas.addEventListener('dblclick', () => {
         manual();
         this.camera.fit();
      });
      canvas.addEventListener('keydown', (e) => {
         if (
            ![
               'ArrowLeft',
               'ArrowRight',
               'ArrowUp',
               'ArrowDown',
               '+',
               '=',
               '-',
               'Home',
               'Escape',
               'n',
               'N',
               '[',
               ']',
            ].includes(e.key)
         )
            return;
         e.preventDefault();
         manual();
         if (e.key.toLowerCase() === 'n') this.camera.north();
         else if (e.key === '[' || e.key === ']') this.camera.rotate(e.key === '[' ? 0.15 : -0.15);
         else if (e.key === 'Home') {
            this.camera.north();
            this.camera.fit();
         } else if (e.key === 'Escape') return;
         else if (['+', '=', '-'].includes(e.key))
            this.camera.zoomAt(
               { x: this.camera.w / 2, y: this.camera.h / 2 },
               e.key === '-' ? 0.8 : 1.25,
            );
         else
            this.camera.pan(
               e.key === 'ArrowLeft' ? 60 : e.key === 'ArrowRight' ? -60 : 0,
               e.key === 'ArrowUp' ? 60 : e.key === 'ArrowDown' ? -60 : 0,
            );
      });
   }
   private world(p: Point) {
      return this.camera.world(p);
   }
   setView(action: 'north' | 'fit' | 'left' | 'right') {
      this.following = false;
      this.canvas.dataset.cameraMode = 'manual';
      if (action === 'north') this.camera.north();
      else if (action === 'fit') {
         this.camera.north();
         this.camera.fit();
      } else this.camera.rotate(action === 'left' ? Math.PI / 12 : -Math.PI / 12);
   }
   draw(session: CockpitSession, time: number) {
      const rect = this.canvas.getBoundingClientRect(),
         dpr = Math.min(devicePixelRatio || 1, 2),
         c = session.course;
      const desiredOffset =
         rect.width > 900 ? (document.body.classList.contains('controls-open') ? -175 : 0) : 0;
      this.camera.offsetX +=
         (desiredOffset - this.camera.offsetX) * (this.reducedMotion.matches ? 1 : 0.08);
      this.camera.resize(rect.width, rect.height, c.plate.worldBounds);
      session.cameraAngle = this.camera.angle;
      if (this.viewRevision !== session.viewRevision) {
         this.viewRevision = session.viewRevision;
         this.following = false;
         this.canvas.dataset.cameraMode = 'framed';
         if (session.view === 'hole') this.camera.fit();
         else
            this.camera.go(
               session.view === 'ball' ? session.ball : c.greenCenter,
               session.view === 'ball' ? 3 : 5,
            );
      }
      let ball = session.ball;
      if (session.phase === 'animating' && session.last) {
         if (this.shotStarted !== session.animationStarted) {
            this.shotStarted = session.animationStarted;
            this.following = !this.reducedMotion.matches;
         }
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
               f = Math.max(0, Math.min(1, (elapsed - a.t) / (b.t - a.t || 1)));
            ball = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f };
         }
      }
      if (this.following && !this.reducedMotion.matches) {
         const height = Math.max(0, (ball.z ?? 0) - Course.heightAt(c, ball));
         this.camera.go(ball, Math.max(1.65, 3 - height * 0.025));
         this.canvas.dataset.cameraMode = 'follow';
         if (session.phase !== 'animating') this.following = false;
      }
      this.camera.tick(this.lastTime ? time - this.lastTime : 16, this.reducedMotion.matches);
      this.lastTime = time;
      this.canvas.dataset.cameraZoom = this.camera.zoom.toFixed(3);
      this.canvas.dataset.cameraX = this.camera.x.toFixed(2);
      this.canvas.dataset.cameraAngle = this.camera.angle.toFixed(4);
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
      const route = document.body.dataset.route || 'title';
      if (!['play', 'pair'].includes(route)) {
         const view = this.menuCamera;
         const drift = this.reducedMotion.matches ? 0 : Math.sin(time / 24000);
         view.angle = -0.28 + drift * 0.025;
         view.offsetX = route === 'title' || rect.width < 700 ? 0 : rect.width * 0.16;
         view.resize(rect.width, rect.height, c.plate.worldBounds);
         view.go({ x: 155 + drift * 8, y: 355 }, 1.45);
         view.tick(16, this.reducedMotion.matches);
         this.atlas.paint(ctx, c, view);
         return;
      }
      if (session.renderer === 'photo' && !this.photoLoading) {
         this.photoLoading = true;
         void import('./photo-renderer.js').then(({ PhotoRenderer, PhotoAssets }) => {
            this.photo = PhotoRenderer.create(PhotoAssets, () => {});
         });
      }
      if (session.renderer === 'photo' && this.photo?.ready())
         this.photo.paint(
            ctx,
            c,
            {
               ...this.camera,
               x:
                  this.camera.x -
                  (Math.cos(this.camera.angle) * this.camera.offsetX) / this.camera.scale,
               y:
                  this.camera.y +
                  (Math.sin(this.camera.angle) * this.camera.offsetX) / this.camera.scale,
            },
            dpr,
         );
      else this.atlas.paint(ctx, c, this.camera);
      if (
         ['play', 'pair'].includes(document.body.dataset.route || '') &&
         document.body.dataset.quiet !== 'true'
      ) {
         ctx.save();
         // Reserve the bottom-left corner for the menu; keep the compass beside it.
         ctx.translate(112, rect.height - 48);
         ctx.fillStyle = '#172c24b3';
         ctx.beginPath();
         ctx.arc(0, 0, 25, 0, Math.PI * 2);
         ctx.fill();
         ctx.font = '9px Onest, sans-serif';
         ctx.textAlign = 'center';
         ctx.fillStyle = '#eef2df';
         ctx.fillText('N', 0, -14);
         ctx.translate(0, 4);
         ctx.rotate(-this.camera.angle);
         ctx.strokeStyle = '#e6eed6';
         ctx.lineWidth = 1.3;
         ctx.beginPath();
         ctx.moveTo(0, 10);
         ctx.lineTo(0, -11);
         ctx.moveTo(-4, -5);
         ctx.lineTo(0, -11);
         ctx.lineTo(4, -5);
         ctx.stroke();
         ctx.restore();
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
}
