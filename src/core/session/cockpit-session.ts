import { Contract } from '../contracts/contract.js';
import { Course } from '../course/course.js';
import { Conditions } from '../course/conditions.js';
import { HoleVisual } from '../course/hole.js';
import { Terrain } from '../course/terrain.js';
import { Wind } from '../course/wind.js';
import { Shot } from '../simulation/shot.js';
import { VERSION } from '../simulation/fundamentals';
import {
   validCommand,
   type Command,
   type Intent,
   type Point,
   type Reply,
   type Setup,
   type Snapshot,
} from '../contracts/cockpit';

export class CockpitSession {
   course = Contract.clone(HoleVisual.course);
   setup: Setup = {
      tee: 'white',
      pin: 'moderate',
      wind: 'moderate',
      moisture: 'moderate',
      towardDeg: 0,
   };
   intent: Intent = { club: 'D', effort: 1, shape: 0, height: 0 };
   ball: Point = { ...this.course.tee };
   aim: Point = { ...this.course.pin };
   probe: Point = { ...this.course.pin };
   phase: Snapshot['phase'] = 'plan';
   renderer: Snapshot['renderer'] = 'procedural';
   view: 'hole' | 'ball' | 'green' = 'hole';
   viewRevision = 0;
   cameraAngle = 0;
   shot = 1;
   revision = 0;
   records: ReturnType<typeof Shot.run>[] = [];
   last: ReturnType<typeof Shot.run> | null = null;
   animationStarted = 0;
   private weatherStarted = performance.now();
   private seed = 270919;
   private acknowledgements = new Map<string, Reply>();
   private undoAvailable = false;
   private lastShotNumber = 1;
   constructor() {
      this.reset();
   }
   day() {
      return Conditions.makeDay(
         this.course,
         Conditions.setup(this.setup),
         270919,
         (performance.now() - this.weatherStarted) / 1000,
      );
   }
   reset() {
      this.course = Course.selectSetup(Contract.clone(HoleVisual.course), this.setup);
      this.ball = { ...this.course.tee };
      this.aim = Course.defaultAim(this.course, this.ball).point;
      this.probe = { ...this.aim };
      this.phase = 'plan';
      this.shot = 1;
      this.last = null;
      this.records = [];
      this.undoAvailable = false;
      this.weatherStarted = performance.now();
      this.intent = { club: 'D', effort: 1, shape: 0, height: 0 };
      this.revision++;
      this.view = 'hole';
      this.viewRevision++;
   }
   snapshot(): Snapshot {
      const wind = Wind.presentation(Wind.atDay(this.day(), 0));
      return {
         type: 'STATE',
         revision: this.revision,
         phase: this.phase,
         canMulligan: this.undoAvailable && this.phase !== 'animating',
         cameraAngle: this.cameraAngle,
         shot: this.shot,
         intent: { ...this.intent },
         ball: { ...this.ball },
         aim: { ...this.aim },
         probe: { ...this.probe },
         setup: { ...this.setup },
         renderer: this.renderer,
         engine: VERSION,
         wind: {
            direction: wind.direction,
            strength: wind.strength,
            rotation: wind.rotation,
            fraction: wind.fraction,
         },
         terrain: Terrain.point(this.course, this.probe),
         lie: Course.surfaceAt(this.course, this.ball).type,
         distance: Math.hypot(this.aim.x - this.ball.x, this.aim.y - this.ball.y),
         result: this.last
            ? {
                 status: this.last.result.status,
                 carry: this.last.result.carry,
                 total: this.last.result.total,
                 surface: this.last.result.finalSurface,
              }
            : null,
      };
   }
   finish() {
      if (this.phase === 'animating') {
         this.phase = 'resolved';
         this.ball = { ...this.last!.result.finish };
         this.revision++;
      }
   }
   apply(command: Command): Reply {
      const prior = this.acknowledgements.get(command.id);
      if (prior) return prior;
      let response: Reply = { type: 'ACK', id: command.id, ok: true };
      try {
         if (!validCommand(command)) throw Error('Invalid command');
         if (this.phase === 'animating' && !['SKIP', 'VIEW', 'RENDERER'].includes(command.action))
            throw Error('Wait for this shot to finish');
         switch (command.action) {
            case 'INTENT':
               if (this.phase !== 'plan') throw Error('Choose next shot first');
               this.intent = { ...command.intent };
               break;
            case 'MOVE': {
               if (command.target === 'aim' && this.phase !== 'plan')
                  throw Error('Choose next shot first');
               const point = this[command.target],
                  b = this.course.bounds;
               const next = {
                  x: Math.max(b.minX, Math.min(b.maxX, point.x + command.dx)),
                  y: Math.max(b.minY, Math.min(b.maxY, point.y + command.dy)),
               };
               if (
                  command.target === 'aim' &&
                  Math.hypot(next.x - this.ball.x, next.y - this.ball.y) < 0.2
               )
                  throw Error('Aim farther from the ball');
               this[command.target] = next;
               break;
            }
            case 'PLAY': {
               if (this.phase !== 'plan' || command.shot !== this.shot)
                  throw Error('Shot state changed; check the controls');
               const intent = {
                  ...command.intent,
                  start: { ...this.ball },
                  aim: { ...this.aim },
                  variance: true,
               };
               const shot = Shot.run(this.course, this.day(), Shot.player, intent, ++this.seed, {
                  model: 'fundamentals',
               });
               this.intent = { ...command.intent };
               this.last = shot;
               this.records.push(shot);
               this.undoAvailable = true;
               this.lastShotNumber = this.shot;
               this.phase = 'animating';
               this.animationStarted = performance.now();
               break;
            }
            case 'NEXT':
               if (this.phase !== 'resolved') throw Error('Play a shot first');
               if (this.last!.result.status !== 'settled')
                  throw Error('Restart the hole or take a mulligan after this result');
               this.phase = 'plan';
               this.shot++;
               this.aim = Course.defaultAim(this.course, this.ball).point;
               if (Course.surfaceAt(this.course, this.ball).type === 'green') {
                  this.intent = { club: 'PUTT', effort: 1, shape: 0, height: 0 };
                  this.aim = { ...this.course.pin };
               }
               break;
            case 'MULLIGAN':
               if (!this.last || !this.undoAvailable) throw Error('No shot available to undo');
               this.ball = { ...this.last.intent.start };
               this.aim = { ...this.last.intent.aim };
               this.intent = {
                  club: this.last.intent.club,
                  effort: this.last.intent.effort,
                  shape: this.last.intent.shape,
                  height: this.last.intent.height,
               };
               this.shot = this.lastShotNumber;
               this.phase = 'plan';
               this.undoAvailable = false;
               this.view = 'ball';
               this.viewRevision++;
               break;
            case 'SKIP':
               this.finish();
               break;
            case 'RESET':
               this.reset();
               break;
            case 'SETUP':
               this.setup = { ...command.setup };
               this.reset();
               break;
            case 'VIEW':
               this.view = command.view;
               this.viewRevision++;
               break;
            case 'RENDERER':
               this.renderer = command.renderer;
               break;
         }
         this.revision++;
      } catch (error) {
         response = {
            ...response,
            ok: false,
            error: error instanceof Error ? error.message : 'Command failed',
         };
      }
      this.acknowledgements.set(command.id, response);
      if (this.acknowledgements.size > 1024)
         this.acknowledgements.delete(this.acknowledgements.keys().next().value!);
      return response;
   }
}
