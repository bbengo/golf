import { recordedBallPosition } from './ball-position';
import { paintBirds } from './ambient-life';
import { CourseStudyLayers } from './course-study-layers';
import { paintTarget } from './target-reticle';
import { ViewportSurface } from './viewport';
import { BallRenderer } from './ball-renderer';
import { ShotEffects } from './shot-effects';
import { readPresentation } from './presentation';
import { daylightChoice } from './daylight';
import { Wind } from '../course/wind.js';
import { EnvironmentRenderer } from './environment-renderer';
import { CourseCamera } from './camera';
import { Course } from '../course/course.js';
import { Shot } from '../simulation/shot.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';

export class SimpleCourse {
   private canvas: HTMLCanvasElement;
   private viewport: ViewportSurface;
   private ctx: CanvasRenderingContext2D;
   private ballRenderer = new BallRenderer();
   private effects = new ShotEffects();
   private studyLayers = new CourseStudyLayers();
   private atlas = new EnvironmentRenderer();
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
      this.viewport = new ViewportSurface(canvas);
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
         if (e.altKey) return;
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
   setView(action: 'north' | 'fit' | 'left' | 'right' | 'in' | 'out') {
      this.following = false;
      this.canvas.dataset.cameraMode = 'manual';
      if (action === 'in' || action === 'out')
         this.camera.zoomAt(
            { x: this.camera.w / 2, y: this.camera.h / 2 },
            action === 'in' ? 1.25 : 0.8,
         );
      else if (action === 'north') this.camera.north();
      else if (action === 'fit') {
         this.camera.north();
         this.camera.fit();
      } else this.camera.rotate(action === 'left' ? Math.PI / 12 : -Math.PI / 12);
   }
   draw(session: CockpitSession, time: number) {
      const settings = readPresentation(document.body.dataset);
      this.camera.feel = settings.cameraFeel;
      const { rect, dpr } = this.viewport.prepare(settings.renderQuality);
      const c = session.course;
      const frameMs = this.lastTime ? Math.max(0, time - this.lastTime) : 16;
      const layoutEase = this.reducedMotion.matches
         ? 1
         : 1 - Math.exp(-Math.min(frameMs, 64) / 190);
      const desiredOffset =
         rect.width > 900 ? (document.body.classList.contains('controls-open') ? -175 : 0) : 0;
      this.camera.offsetX += (desiredOffset - this.camera.offsetX) * layoutEase;
      const dock = document.querySelector<HTMLElement>('.shot-dock');
      const dockSpace =
         document.body.dataset.displayMode === 'desktop' && document.body.dataset.route === 'play'
            ? (dock?.offsetHeight || 190) + (rect.width < 600 ? 90 : 36)
            : 0;
      const desiredY = -Math.min(rect.height * 0.24, dockSpace / 2);
      this.camera.offsetY += (desiredY - this.camera.offsetY) * layoutEase;
      this.camera.restrictPan = c.boundaryPolicy !== 'synthetic-estate-continuation';
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
      const ball = recordedBallPosition(session, time);
      if (session.phase === 'animating' && session.last) {
         if (this.shotStarted !== session.animationStarted) {
            this.shotStarted = session.animationStarted;
            this.following =
               !this.reducedMotion.matches && document.body.dataset.followBall !== 'false';
         }
      }

      if (
         this.following &&
         !this.reducedMotion.matches &&
         document.body.dataset.followBall !== 'false'
      ) {
         const height = Math.max(0, (ball.z ?? 0) - Course.heightAt(c, ball));
         // Broad flight framing eases into a modest landing view; avoid aggressive bounce zoom.
         this.camera.go(ball, 2.35 - 0.6 * (1 - Math.exp(-height / 22)));
         this.canvas.dataset.cameraMode = 'follow';
      }
      this.camera.motion = this.following ? 'follow' : 'manual';
      this.camera.tick(this.lastTime ? time - this.lastTime : 16, this.reducedMotion.matches);
      if (
         session.phase !== 'animating' &&
         Math.abs(this.camera.zoom - this.camera.target.zoom) < 0.005
      )
         this.following = false;
      this.lastTime = time;
      this.canvas.dataset.cameraZoom = this.camera.zoom.toFixed(3);
      this.canvas.dataset.cameraX = this.camera.x.toFixed(2);
      this.canvas.dataset.cameraAngle = this.camera.angle.toFixed(4);
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      const day = session.viewDay();
      const wind = Wind.presentation(Wind.atDay(day, 0));
      const daylight = daylightChoice(day.environment?.daylight ?? session.environment.daylight);
      this.canvas.dataset.daylight = daylight;
      const route = document.body.dataset.route || 'title';
      if (!['play', 'pair'].includes(route)) {
         const view = this.menuCamera;
         const drift = this.reducedMotion.matches ? 0 : Math.sin(time / 24000);
         view.angle = -0.28 + drift * 0.025;
         view.offsetX = route === 'title' || rect.width < 700 ? 0 : rect.width * 0.16;
         view.resize(rect.width, rect.height, c.plate.worldBounds);
         view.go({ x: 155 + drift * 8, y: 355 }, 1.45);
         view.tick(16, this.reducedMotion.matches);
         this.atlas.paint(ctx, c, view, wind, daylight);
         if (settings.ambientLife === 'subtle' && !this.reducedMotion.matches)
            paintBirds(ctx, view, time);
         return;
      }
      if (session.renderer !== 'procedural' && !this.photoLoading) {
         this.photoLoading = true;
         void import('./photo-renderer.js').then(({ PhotoRenderer, PhotoAssets }) => {
            this.photo = PhotoRenderer.create(PhotoAssets, () => {});
         });
      }
      this.atlas.paint(ctx, c, this.camera, wind, daylight);
      if (
         session.renderer === 'procedural' &&
         settings.ambientLife === 'subtle' &&
         !this.reducedMotion.matches
      )
         paintBirds(ctx, this.camera, time);
      this.canvas.dataset.environment = session.renderer;
      this.canvas.dataset.imageReady = String(!!this.photo?.ready());
      if (session.renderer !== 'procedural' && this.photo?.ready()) {
         const cam = this.camera,
            co = Math.cos(cam.angle),
            si = Math.sin(cam.angle);
         ctx.save();
         if (session.renderer === 'comparison') {
            ctx.beginPath();
            ctx.rect(0, 0, rect.width / 2, rect.height);
            ctx.clip();
         }
         this.photo.paint(
            ctx,
            c,
            {
               ...cam,
               x: cam.x + (-co * cam.offsetX + si * cam.offsetY) / cam.scale,
               y: cam.y + (si * cam.offsetX + co * cam.offsetY) / cam.scale,
            },
            dpr,
         );
         ctx.restore();
         if (session.renderer === 'comparison') {
            ctx.fillStyle = '#edf0dc';
            ctx.fillRect(rect.width / 2 - 1, 0, 2, rect.height);
            ctx.font = '12px Onest, sans-serif';
            for (const [label, x] of [
               ['Original image', rect.width / 2 - 130],
               ['Procedural', rect.width / 2 + 12],
            ] as const) {
               ctx.fillStyle = '#13241de6';
               ctx.fillRect(x - 8, 16, 122, 28);
               ctx.fillStyle = '#edf0dc';
               ctx.fillText(label, x, 34);
            }
         }
      }
      if (document.body.dataset.displayMode !== 'clear')
         this.studyLayers.paint(ctx, session, this.camera, document.body.dataset);
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
      const bearing = (wind.rotation * Math.PI) / 180 - this.camera.angle;
      const flutter =
         this.reducedMotion.matches || wind.calm
            ? 0
            : Math.sin(time / 170) * Math.min(2, wind.fraction * 6);
      const reach = wind.calm ? 3 : 8 + wind.fraction * 14;
      ctx.lineTo(
         pin.x + Math.sin(bearing) * reach + Math.cos(bearing) * 3 + flutter,
         pin.y - 19 - Math.cos(bearing) * reach * 0.55 + (wind.calm ? 6 : 0),
      );
      ctx.lineTo(pin.x, pin.y - 15);
      ctx.fill();
      if (session.phase === 'plan' && document.body.dataset.displayMode !== 'clear') {
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
         paintTarget(ctx, this.camera, ball, session.aim, time, this.reducedMotion.matches);
         // Show the deterministic launch vector, not an invented landing prediction.
         // Club, effort and height affect it through the actual launch calculation.
         if (this.previewRevision !== session.revision) {
            this.previewRevision = session.revision;
            try {
               this.preview = Shot.buildLaunch(
                  c,
                  session.day(),
                  session.golfer,
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
      if (session.last && document.body.dataset.displayMode !== 'clear') {
         const elapsed = session.shotTime(time, false);
         this.effects.paint(
            ctx,
            this.camera,
            session.last.result.trajectory,
            session.last.result.events,
            elapsed,
            settings,
            this.reducedMotion.matches,
         );
      }
      if (session.last?.result.status !== 'holed' || session.phase !== 'resolved') {
         this.ballRenderer.paint(
            ctx,
            this.camera,
            ball,
            Course.heightAt(c, ball),
            settings,
            daylight,
         );
      }
   }
}
