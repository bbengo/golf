import { PracticeVisual as Practice } from './practice.js';
import { Contract } from '../contracts/contract.js';
import { Player } from '../simulation/player.js';
import { Course } from '../course/course.js';
import { Conditions } from '../course/conditions.js';
import { createPurityCourse } from '../course/purity-course';
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
   golfer = structuredClone(Shot.player);
   variance = true;
   practice = Practice.begin();
   shapedGround = true;
   course = createPurityCourse();
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
      this.course = Course.selectSetup(createPurityCourse(), this.setup);
      this.course.terrain.authoredLayer.enabled = this.shapedGround;
      this.ball = { ...this.course.tee };
      this.aim = Course.defaultAim(this.course, this.ball).point;
      this.probe = { ...this.aim };
      this.phase = 'plan';
      this.shot = 1;
      this.last = null;
      this.records = [];
      this.practice = Practice.begin();
      this.undoAvailable = false;
      this.weatherStarted = performance.now();
      this.intent = { club: 'D', effort: 1, shape: 0, height: 0 };
      this.revision++;
      this.view = 'hole';
      this.viewRevision++;
   }
   configurePlayer(player: ReturnType<typeof Player.build>, variance: boolean) {
      if (this.phase === 'animating') throw Error('Wait for this shot to finish');
      Player.validateModel(player);
      this.golfer = structuredClone(player);
      this.variance = variance;
      this.revision++;
   }
   study(kind: 'tee' | 'approach' | 'frontApproach' | 'putt') {
      if (this.phase === 'animating') throw Error('Wait for this shot to finish');
      this.reset();
      if (kind !== 'tee') {
         const fixture =
            kind === 'putt' ? this.course.fixtures.greenStart : this.course.fixtures.approach;
         this.ball = { ...fixture };
         if (kind === 'frontApproach')
            this.ball = { x: this.course.pin.x, y: this.course.pin.y - 35 };
         this.aim = { ...this.course.pin };
         this.probe = { ...this.aim };
         this.intent = { club: kind === 'putt' ? 'PUTT' : 'PW', effort: 1, shape: 0, height: 0 };
         this.view = 'ball';
         this.viewRevision++;
         this.revision++;
      }
   }
   chooseGround(enabled: boolean) {
      if (this.phase === 'animating') throw Error('Wait for this shot to finish');
      this.shapedGround = enabled;
      this.reset();
   }
   canConcede() {
      return Practice.canConcede(this.practice, {
         phase: this.phase,
         surface: Course.surfaceAt(this.course, this.ball).type,
         status: this.last?.result.status,
      });
   }
   snapshot(): Snapshot {
      const wind = Wind.presentation(Wind.atDay(this.day(), 0));
      return {
         type: 'STATE',
         revision: this.revision,
         phase: this.phase,
         canMulligan:
            !Practice.closed(this.practice) && this.undoAvailable && this.phase !== 'animating',
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
         result: Practice.closed(this.practice)
            ? { status: 'conceded', carry: 0, total: 0, surface: 'green' }
            : this.last
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
                  b =
                     this.course.boundaryPolicy === 'synthetic-estate-continuation'
                        ? { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity }
                        : this.course.bounds;
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
                  variance: this.variance,
               };
               const shot = Shot.run(this.course, this.day(), this.golfer, intent, ++this.seed, {
                  model: 'fundamentals',
               });
               this.intent = { ...command.intent };
               this.last = shot;
               this.practice = Practice.appendShot(this.practice, this.records.length, shot);
               this.records.push(shot);
               this.undoAvailable = true;
               this.lastShotNumber = this.shot;
               this.phase = 'animating';
               this.animationStarted = performance.now();
               break;
            }
            case 'CONCEDE':
               this.practice = Practice.concede(this.practice, {
                  phase: this.phase,
                  surface: Course.surfaceAt(this.course, this.ball).type,
                  status: this.last?.result.status,
                  lie: this.ball,
                  pin: this.course.pin,
                  courseFingerprint: Contract.fingerprint(Course.physicsSnapshot(this.course)),
               });
               this.phase = 'resolved';
               this.undoAvailable = false;
               break;
            case 'REPLAY':
               if (Practice.closed(this.practice))
                  throw Error('Start a new practice after a concession');
               if (this.phase !== 'resolved' || !this.last)
                  throw Error('Finish a shot before replaying it');
               this.phase = 'animating';
               this.animationStarted = performance.now();
               break;
            case 'NEXT':
               if (Practice.closed(this.practice))
                  throw Error('Start a new practice after a concession');
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
               this.practice = Practice.mulligan(
                  this.practice,
                  this.phase,
                  this.last,
                  this.records.length - 1,
               );
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
