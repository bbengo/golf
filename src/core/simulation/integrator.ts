import { Course as Q } from '../course/course.js';
import { Wind } from '../course/wind.js';
import * as F from './fundamentals';
import { cupMotion, cupFrame, CUP_RADIUS, CUP_VERSION } from './cup';
import type { Vec3 } from './fundamentals';
export const INTEGRATOR_VERSION = 'purity-rigid-sphere/0.2.0';
type Helpers = {
   objectHit: Function;
   groundHit: Function;
   rollingForces: Function;
   supportAt: Function;
   contactVelocity: Function;
};
const copy = <T>(v: T): T => structuredClone(v);
const sub = (a: Vec3, b: Vec3) => F.add(a, F.scale(b, -1));
/** Collision-time splitting. Every remainder is integrated or reported unresolved. */
export function integrate(course: any, day: any, launch: any, options: any, h: Helpers) {
   const dt = options.dt ?? 0.015,
      maxSeconds = options.maxSeconds ?? 60;
   if (
      !Number.isFinite(dt) ||
      dt <= 0 ||
      dt > 0.05 ||
      !Number.isFinite(maxSeconds) ||
      maxSeconds <= 0 ||
      maxSeconds > 300
   )
      throw Error('Invalid integration limits');
   if (day.windProgram) Wind.validateProgram(day.windProgram);
   let p: Vec3 = copy(launch.position),
      v: Vec3 = copy(launch.velocity),
      spin: Vec3 = copy(launch.spin),
      mode = launch.mode || 'flight';
   const start = copy(p),
      trajectory: any[] = [{ t: 0, ...p, mode }],
      events: any[] = [];
   let lastSurface = Q.surfaceAt(course, p).type;
   let t = 0,
      status = 'unresolved-time-limit',
      carry: number | null = null,
      firstContact: Vec3 | null = null,
      apex = p.z,
      pathLength = 0,
      cupCooldown = 0;
   const event = (type: string, extra = {}) =>
      events.push({ type, t: Number(t.toFixed(7)), position: copy(p), ...extra });
   const save = () => trajectory.push({ t: Number(t.toFixed(7)), ...p, mode });
   const wind = (seconds: number) =>
      day.windProgram ? Wind.vector(Wind.atDay(day, seconds)) : day.wind;
   const finish = (s: string) => {
      status = s;
   };
   for (let frame = 0; t < maxSeconds - 1e-9 && status === 'unresolved-time-limit'; frame++) {
      let remaining = Math.min(dt, maxSeconds - t),
         collisions = 0;
      while (remaining > 1e-9 && status === 'unresolved-time-limit') {
         const before = copy(p),
            startTime = t;
         if (mode === 'flight') {
            const predicted = F.flightStep(
               { p, v },
               spin,
               remaining,
               wind,
               day.airDensity,
               t,
               options.vacuum,
            );
            const object = h.objectHit(course, p, predicted.p, new Set(), true),
               ground = h.groundHit(course, p, predicted.p);
            const hit = object && (!ground || object.t < ground.t) ? object : ground;
            if (!hit) {
               p = predicted.p;
               v = predicted.v;
               spin = predicted.spin;
               t += remaining;
               remaining = 0;
            } else {
               if (++collisions > 24) {
                  finish('unresolved-contact-limit');
                  event(status);
                  break;
               }
               const used = remaining * Math.max(0, Math.min(1, hit.t));
               const at = F.flightStep(
                  { p, v },
                  spin,
                  used,
                  wind,
                  day.airDensity,
                  t,
                  options.vacuum,
               );
               p = hit.p;
               v = at.v;
               spin = at.spin;
               t += used;
               remaining -= used;
               if (hit.kind === 'water') {
                  if (carry === null) {
                     carry = Math.hypot(p.x - start.x, p.y - start.y);
                     firstContact = copy(p);
                  }
                  event('water');
                  finish('water');
               } else if (hit.kind === 'ground') {
                  const g = Q.groundAt(course, p, day);
                  if (carry === null) {
                     carry = Math.hypot(p.x - start.x, p.y - start.y);
                     firstContact = copy(p);
                     event('landing', { surface: g.type, zone: g.zone });
                  }
                  if (options.stopAtFirstContact) {
                     finish('reference-landing');
                     break;
                  }
                  const incoming = copy(v),
                     incomingSpin = copy(spin),
                     out = F.contact(v, spin, hit.normal, g.bounce, F.friction(g.type));
                  v = out.velocity;
                  spin = out.spin;
                  event('bounce', {
                     surface: g.type,
                     normal: hit.normal,
                     incomingVelocityMps: incoming,
                     outgoingVelocityMps: copy(v),
                     incomingSpinRadps: incomingSpin,
                     outgoingSpinRadps: copy(spin),
                     contactModel: 'Coulomb impulse with fractional-step continuation',
                  });
                  p = F.add(p, F.scale(hit.normal, 1e-5));
                  if (F.dot(v, hit.normal) < 0.12) {
                     mode = 'slide';
                     v = sub(v, F.scale(hit.normal, F.dot(v, hit.normal)));
                  }
               } else {
                  v = h.contactVelocity(v, hit.normal, hit.restitution, hit.tangent);
                  spin = F.scale(spin, 0.5);
                  p = F.add(p, F.scale(hit.normal, 1e-5));
                  event(hit.kind, { objectId: hit.id });
                  if (hit.kind === 'bridge' && hit.normal.z > 0.5 && v.z < 0.12) {
                     mode = 'roll';
                     v.z = 0;
                  }
               }
               save();
            }
         } else {
            const support = h.supportAt(course, p),
               g = Q.groundAt(course, p, day),
               s = support.bridge ? { x: 0, y: 0 } : g.slope;
            if (g.type === 'water' && !support.bridge) {
               p.z = Q.surfaceAt(course, p).waterHeight + F.R;
               event('water');
               finish('water');
               break;
            }
            const forces = h.rollingForces(course, p, v, g, !!support.bridge);
            if (mode !== 'slide' && forces.speed < 0.025 && forces.canRest) {
               v = { x: 0, y: 0, z: 0 };
               event('settled');
               finish('settled');
               break;
            }
            // Small ground steps resolve changes in surface, slope, trunks and the cup.
            const step = Math.min(remaining, 0.005, 0.025 / Math.max(0.1, forces.speed));
            const oldSpin = copy(spin),
               oldMode = mode;
            let nextV: Vec3;
            if (mode === 'slide') {
               const slide = F.sliding(
                  v,
                  spin,
                  F.unit({ x: -s.x, y: -s.y, z: 1 }),
                  F.friction(g.type),
                  step,
               );
               nextV = slide.velocity;
               spin = slide.spin;
               if (slide.rolling) {
                  mode = 'roll';
               }
            } else {
               nextV = { x: v.x + forces.x * step, y: v.y + forces.y * step, z: v.z };
               if (nextV.x * v.x + nextV.y * v.y < 0 && forces.canRest)
                  nextV = { x: 0, y: 0, z: 0 };
            }
            const next = {
               x: p.x + ((v.x + nextV.x) * step) / 2,
               y: p.y + ((v.y + nextV.y) * step) / 2,
               z: p.z,
            };
            const ns = h.supportAt(course, next);
            next.z = ns.z + F.R;
            const trunk = h.objectHit(course, p, next, new Set(), true);
            if (trunk?.kind === 'trunk') {
               const used = step * trunk.t;
               spin = F.add(oldSpin, F.scale(sub(spin, oldSpin), trunk.t));
               mode = oldMode;
               v = F.add(v, F.scale(sub(nextV, v), trunk.t));
               p = F.add(trunk.p, F.scale(trunk.normal, 1e-5));
               v = h.contactVelocity(v, trunk.normal, trunk.restitution, trunk.tangent);
               t += used;
               remaining -= used;
               event('trunk', { objectId: trunk.id });
               if (++collisions > 24) {
                  finish('unresolved-contact-limit');
                  break;
               }
            } else {
               p = next;
               v = nextV;
               t += step;
               remaining -= step;
               if (oldMode === 'slide' && mode === 'roll') event('rolling-contact');
               if (support.bridge && !ns.bridge) {
                  mode = 'flight';
                  p.z = before.z;
                  v.z = 0;
                  event('bridge-exit');
               } else {
                  const slope = ns.bridge ? { x: 0, y: 0 } : Q.slopeAt(course, p);
                  v.z = slope.x * v.x + slope.y * v.y;
                  if (mode === 'roll') {
                     const normal = F.unit({ x: -slope.x, y: -slope.y, z: 1 });
                     spin = F.add(
                        F.scale(F.cross(normal, v), 1 / F.R),
                        F.scale(normal, F.dot(spin, normal)),
                     );
                  }
               }
               if (
                  g.type === 'green' &&
                  !support.bridge &&
                  t >= cupCooldown &&
                  Math.hypot(p.x - course.pin.x, p.y - course.pin.y) <= CUP_RADIUS + 0.005
               ) {
                  const z = Q.heightAt(course, course.pin),
                     origin = { ...course.pin, z };
                  const frame = cupFrame(Q.slopeAt(course, course.pin));
                  const cup = cupMotion(
                     frame.local(sub(p, origin)),
                     frame.local(v),
                     frame.local(spin),
                     0.0005,
                     maxSeconds - t,
                     frame.local({ x: 0, y: 0, z: -F.G }),
                  );
                  for (const q of cup.trace)
                     trajectory.push({ t: t + q.t, ...F.add(origin, frame.world(q)), mode: 'cup' });
                  p = F.add(origin, frame.world(cup.p));
                  v = frame.world(cup.v);
                  spin = frame.world(cup.w);
                  t += cup.time;
                  remaining = Math.max(0, remaining - cup.time);
                  cupCooldown = t + 0.05;
                  event(cup.kind === 'capture' ? 'cup-capture' : cup.kind, {
                     model: CUP_VERSION,
                     impacts: cup.impacts,
                  });
                  if (cup.kind === 'capture') finish('holed');
                  else if (cup.kind === 'unresolved') finish('unresolved-cup');
                  else mode = v.z > 0.12 ? 'flight' : 'slide';
               }
            }
         }
         const surface = Q.surfaceAt(course, p).type;
         if (mode !== 'flight' && surface !== lastSurface)
            event('surface-transition', { from: lastSurface, to: surface });
         lastSurface = surface;
         pathLength += Math.hypot(p.x - before.x, p.y - before.y);
         apex = Math.max(apex, p.z);
         if (![p.x, p.y, p.z, v.x, v.y, v.z, t].every(Number.isFinite))
            throw Error('Non-finite physical state');
         if (t === startTime && status === 'unresolved-time-limit' && collisions === 0)
            throw Error('Integrator made no progress');
         if (course.boundaryPolicy === 'source-coverage-limit-not-OB' && !Q.inBounds(course, p)) {
            event('source-coverage-limit');
            finish('outside-survey');
         }
      }
      if (frame % 4 === 0) save();
   }
   save();
   return {
      engineVersion: INTEGRATOR_VERSION,
      status,
      start,
      finish: copy(p),
      carry: carry ?? 0,
      firstContact,
      total: Math.hypot(p.x - start.x, p.y - start.y),
      pathLength,
      apexAboveLaunch: apex - start.z,
      duration: t,
      finalSurface: Q.surfaceAt(course, p).type,
      events,
      trajectory,
      limits: [
         'Experimental aerodynamic and turf coefficients',
         'Rigid lip with trial restitution/friction; not measured cup validation',
         'Small rebounds transition to sliding; no compliant turf deformation',
         'Swept chord contact approximation; bounded repeated-contact solver',
      ],
   };
}
