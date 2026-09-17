import { Contract } from '../contracts/contract.js';
import { Course } from '../course/course.js';
import { Player } from './player.js';
import { Wind } from '../course/wind.js';

/* Research point-mass flight + simplified contact/rolling adapter.
* NOT calibrated Aero, NOT 6-DOF, NOT validated TOUR or equipment data.
* No screen coordinates, image colors, camera state or art enter this module.
*/
      const Shot = ((factory) => factory(Contract, Course, Player, Wind))(function (C, Q, P, W) {
         'use strict';
         const VERSION = 'research-point-mass/0.4.3', G = 9.80665, R = 0.02135, M = 0.04593, AREA = Math.PI * R * R;
         const norm = v => Math.hypot(v.x, v.y, v.z), dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
         const mul = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
         const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
         const sub = (a, b) => add(a, mul(b, -1));
         const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
         const unit = v => mul(v, 1 / (norm(v) || 1));
         const clubs = [
            { id: 'D', name: 'Driver', speed: 73, angle: 12.5, spin: 2550, nominalCarry: 265 },
            { id: '3W', name: '3 wood', speed: 67, angle: 13, spin: 3400, nominalCarry: 237 },
            { id: '4I', name: '4 iron', speed: 57, angle: 15, spin: 4600, nominalCarry: 199 },
            { id: '6I', name: '6 iron', speed: 51, angle: 19, spin: 6000, nominalCarry: 175 },
            { id: '8I', name: '8 iron', speed: 44, angle: 23, spin: 7500, nominalCarry: 147 },
            { id: 'PW', name: 'Pitching wedge', speed: 37, angle: 28, spin: 8600, nominalCarry: 117 },
            { id: 'SW', name: 'Sand wedge', speed: 30, angle: 34, spin: 8900, nominalCarry: 88 },
            { id: 'CHIP', name: 'Chip', speed: 13, angle: 20, spin: 1900, nominalCarry: 20 },
            { id: 'PUTT', name: 'Putter', speed: 4, angle: 0, spin: 0, nominalCarry: 0 }
         ];
         const player = P.build(P.draft());
         function club(id) { const c = clubs.find(c => c.id === id); if (!c) throw Error('Unknown club ' + id); return c; }
         const referenceCache = new Map();
         function stockYardages(golfer) {
            const key = C.fingerprint({ power: golfer.configuration.points.power, style: golfer.configuration.style });
            if (referenceCache.has(key)) return C.clone(referenceCache.get(key));
            const q = C.clone(Q.demo); q.bounds = { minX: -2000, maxX: 2000, minY: -2000, maxY: 2000 };
            q.terrain = { base: 0, xGrade: 0, yGrade: 0, features: [] }; q.objects = []; q.zones = [];
            q.surfaces = [{ id: 'reference-fairway', type: 'fairway', polygon: [{ x: -2000, y: -2000 }, { x: 2000, y: -2000 }, { x: 2000, y: 2000 }, { x: -2000, y: 2000 }] }]; q.pin = { x: 1900, y: 1900 };
            const d = C.clone(Q.days.normal), p = C.clone(golfer); p.condition = { fatigue: 0, pressure: 0 }; d.wind = { x: 0, y: 0, z: 0 };
            const result = clubs.filter(k => k.id !== 'PUTT').map(k => {
               const i = { start: { x: 0, y: 0 }, aim: { x: 500, y: 0 }, club: k.id, effort: 1, shape: 0, height: 0, variance: false };
               const l = buildLaunch(q, d, p, i, 0), r = simulate(q, d, l);
               return { id: k.id, name: k.name, carryYards: r.carry / .9144, totalYards: r.total / .9144, launchSpeedMps: Math.hypot(l.velocity.x, l.velocity.y, l.velocity.z), basis: 'flat_calm_stock_no_variance_model_not_TOUR_statistic' };
            });
            if (referenceCache.size >= 40) referenceCache.delete(referenceCache.keys().next().value); referenceCache.set(key, result); return C.clone(result);
         }
         // Reference inversion is not a course-shot solver. It uses no live terrain,
         // wind, lie penalty, target elevation, or future landing position.
         const EFFORT = Object.freeze({ min: .15, max: 1.1 }), carryCache = new Map();
         let referenceCourse = null;
         function flatReferenceCourse() {
            if (referenceCourse) return referenceCourse;
            const q = C.clone(Q.demo); q.bounds = { minX: -2000, maxX: 2000, minY: -2000, maxY: 2000 };
            q.terrain = { base: 0, xGrade: 0, yGrade: 0, features: [] }; q.objects = []; q.zones = [];
            q.surfaces = [{ id: 'reference-fairway', type: 'fairway', polygon: [{ x: -2000, y: -2000 }, { x: 2000, y: -2000 }, { x: 2000, y: 2000 }, { x: -2000, y: 2000 }] }]; q.pin = { x: 1900, y: 1900 };
            return referenceCourse = q;
         }
         function referenceCarry(golfer, id, effort, adjust = { shape: 0, height: 0 }) {
            if (id === 'PUTT') throw Error('A putt uses flat-distance pace, not airborne carry');
            if (!Number.isFinite(effort) || effort < EFFORT.min || effort > EFFORT.max) throw Error('Reference effort out of range');
            const key = C.fingerprint({ version: VERSION, p: golfer.configuration, id, effort, adjust });
            if (carryCache.has(key)) return carryCache.get(key);
            const q = flatReferenceCourse(), d = C.clone(Q.days.normal), p = C.clone(golfer); p.condition = { fatigue: 0, pressure: 0 }; d.wind = { x: 0, y: 0, z: 0 };
            const i = { start: { x: 0, y: 0 }, aim: { x: 500, y: 0 }, club: id, effort, shape: adjust.shape || 0, height: adjust.height || 0, variance: false };
            const r = simulate(q, d, buildLaunch(q, d, p, i, 0), { stopAtFirstContact: true });
            if (r.status !== 'reference-landing' || !Number.isFinite(r.carry)) throw Error('Reference carry not resolved');
            if (carryCache.size >= 1000) carryCache.delete(carryCache.keys().next().value);
            carryCache.set(key, r.carry); return r.carry;
         }
         function effortForCarry(golfer, id, distanceM) {
            if (!Number.isFinite(distanceM) || distanceM <= 0) throw Error('Invalid reference distance');
            let lo = EFFORT.min, hi = EFFORT.max;
            const min = referenceCarry(golfer, id, lo), max = referenceCarry(golfer, id, hi);
            if (distanceM <= min) return { effort: lo, referenceCarryM: min, reachability: distanceM < min ? 'below-minimum-reference' : 'within-reference-range' };
            if (distanceM >= max) return { effort: hi, referenceCarryM: max, reachability: distanceM > max ? 'beyond-maximum-reference' : 'within-reference-range' };
            for (let j = 0; j < 15; j++) { const m = (lo + hi) / 2; if (referenceCarry(golfer, id, m) < distanceM) lo = m; else hi = m; }
            const effort = (lo + hi) / 2; return { effort, referenceCarryM: referenceCarry(golfer, id, effort), reachability: 'within-reference-range' };
         }
         function suggestClub(distanceM, lie, golfer = player) {
            if (!Number.isFinite(distanceM) || distanceM <= 0) throw Error('Invalid shot distance');
            if (lie === 'green') return { club: 'PUTT', effort: 1, basis: 'cup direction and flat-distance pace; no break correction' };
            const list = stockYardages(golfer).slice().sort((a, b) => a.carryYards - b.carryYards);
            // Pick a shot type that can actually span the requested flat-calm distance.
            // Never choose the nearer short chip and silently cap it far below the dot.
            const best = list.find(k => referenceCarry(golfer, k.id, EFFORT.max) >= distanceM) || list.at(-1);
            return { club: best.id, ...effortForCarry(golfer, best.id, distanceM), requestedCarryM: distanceM, basis: 'inverted flat-calm stock flight; no condition compensation' };
         }
         function validateIntent(i) {
            if (!i || !i.start || !i.aim || ![i.start.x, i.start.y, i.aim.x, i.aim.y, i.effort, i.shape, i.height].every(C.finite)) throw Error('ShotIntent requires finite start, aim, effort, shape and height.');
            if (C.hypot(i.start, i.aim) < (i.club === 'PUTT' ? .005 : .2)) throw Error('Aim is too close to the ball for this shot type.');
            if (i.effort < 0.15 || i.effort > 1.1 || Math.abs(i.shape) > 1 || Math.abs(i.height) > 1) throw Error('Intent outside declared controls.'); club(i.club);
         }
         function buildLaunch(course, day, golfer, intent, seed) {
            validateIntent(intent); P.validateModel(golfer); const k = club(intent.club), r = C.rng(seed);
            // Bounded random execution: ±2.75 standard-deviation draws. No hidden endpoint corrections.
            const noise = () => intent.variance === false ? 0 : C.clamp(r.normal(), -2.75, 2.75), c = golfer.condition;
            let lie = Q.groundAt(course, intent.start, day);
            const support = supportAt(course, { ...intent.start, z: Number.isFinite(intent.start.z) ? intent.start.z : Q.heightAt(course, intent.start) + R });
            if (support.bridge) lie = { ...Q.materials.path, type: 'path' };
            if (lie.type === 'water') throw Error('Cannot launch from water in this lab. Use the practice restart.');
            const params = P.parameters(golfer, k, lie.type, intent), ang = Math.atan2(intent.aim.y - intent.start.y, intent.aim.x - intent.start.x);
            const spread = params.directionSdDeg * (1 + .45 * c.pressure + .6 * c.fatigue), directionDraw = noise(), speedDraw = noise(), heightDraw = noise();
            const heading = ang + directionDraw * spread * Math.PI / 180, u = { x: Math.cos(heading), y: Math.sin(heading), z: 0 };
            let speed, launchDeg; const speedError = speedDraw * params.speedSdFraction * (1 + .4 * c.pressure + .5 * c.fatigue);
            if (k.id === 'PUTT') {
               // Player chooses line and flat-distance pace. Putting skill changes execution,
               // never green reading or a post-hoc make probability / score adjustment.
               speed = Math.sqrt(2 * G * Q.greenRoll(course.baseline?.greenStimpFt ?? 10.5) * C.hypot(intent.start, intent.aim)) * intent.effort * (1 + speedError); launchDeg = 0;
            } else {
               const launchFactor = Math.min(1, lie.launch * params.recoveryLaunchFactor);
               speed = k.speed * intent.effort * params.speedScale * launchFactor * (1 - .045 * c.fatigue) * (1 + speedError);
               launchDeg = C.clamp(k.angle + params.height * 7 + heightDraw * params.launchSdDeg, 2, 65);
            }
            const a = launchDeg * Math.PI / 180; let v = { x: u.x * speed * Math.cos(a), y: u.y * speed * Math.cos(a), z: speed * Math.sin(a) };
            if (k.id === 'PUTT') {
               // Pace is a speed along the local tangent, not an extra horizontal speed
               // to which the uphill/downhill vertical component is added for free.
               const slope = support.bridge ? { x: 0, y: 0 } : lie.slope;
               v = mul(unit({ x: u.x, y: u.y, z: slope.x * u.x + slope.y * u.y }), speed);
            }
            const back = k.spin * 2 * Math.PI / 60 * intent.effort * (1 + .10 * params.height);
            return {
               position: { ...intent.start, z: Number.isFinite(intent.start.z) ? intent.start.z : Q.heightAt(course, intent.start) + R }, velocity: v,
               spin: { x: u.y * back, y: -u.x * back, z: params.shape * 95 }, mode: k.id === 'PUTT' ? 'roll' : 'flight', source: 'custom_player_synthetic_launch_distribution', partialSpinModel: 'linear_with_effort_not_field_calibrated', inputHeading: ang, realizedHeading: heading,
               execution: { skillFamily: params.family, parameters: params, noise: { direction: directionDraw, speed: speedDraw, height: heightDraw }, noiseBoundSd: 2.75, stockStyle: P.styleLabel(golfer) }
            };
         }
         function acceleration(v, w, day, opt, timeSeconds = 0) {
            const wind = day.windProgram ? W.vector(W.atDay(day, timeSeconds)) : (day.wind || { x: 0, y: 0, z: 0 });
            const rel = sub(v, wind), s = norm(rel); let a = { x: 0, y: 0, z: -G }; if (s < 1e-9 || opt?.vacuum) return a;
            // Declared experimental coefficients, awaiting ball-specific literature/data validation.
            const S = norm(w) * R / s, Cd = 0.235 + 0.04 * Math.min(S, 1), Cl = Math.min(0.29, 1.8 * S);
            const q = 0.5 * day.airDensity * AREA / M * s * s; a = add(a, mul(rel, -q * Cd / s));
            const lv = cross(w, rel); if (norm(lv) > 1e-9) a = add(a, mul(unit(lv), q * Cl)); return a;
         }
         function stepFlight(state, w, dt, day, opt, timeSeconds = 0) {
            const f = (s, time) => ({ p: s.v, v: acceleration(s.v, w, day, opt, time) }), comb = (s, k, h) => ({ p: add(s.p, mul(k.p, h)), v: add(s.v, mul(k.v, h)) });
            const a = f(state, timeSeconds), b = f(comb(state, a, dt / 2), timeSeconds + dt / 2), c = f(comb(state, b, dt / 2), timeSeconds + dt / 2), d = f(comb(state, c, dt), timeSeconds + dt);
            const mix = (k) => mul(add(add(a[k], mul(b[k], 2)), add(mul(c[k], 2), d[k])), dt / 6);
            return { p: add(state.p, mix('p')), v: add(state.v, mix('v')) };
         }
         function sphereHit(a, b, center, radii) {
            const d = sub(b, a), f = sub(a, center); const dx = d.x / radii.x, dy = d.y / radii.y, dz = d.z / radii.z, fx = f.x / radii.x, fy = f.y / radii.y, fz = f.z / radii.z;
            const A = dx * dx + dy * dy + dz * dz, B = 2 * (fx * dx + fy * dy + fz * dz), D = fx * fx + fy * fy + fz * fz - 1; if (D < 0) return null; const det = B * B - 4 * A * D; if (A < 1e-12 || det < 0) return null; const t = (-B - Math.sqrt(det)) / (2 * A); if (t < 0 || t > 1) return null;
            const p = add(a, mul(d, t)); return { t, p, normal: unit({ x: (p.x - center.x) / radii.x ** 2, y: (p.y - center.y) / radii.y ** 2, z: (p.z - center.z) / radii.z ** 2 }) };
         }
         function boxHit(a, b, box) {
            let lo = 0, hi = 1, normal = null; const d = sub(b, a); for (const [axis, min, max] of [['x', box.minX - R, box.maxX + R], ['y', box.minY - R, box.maxY + R], ['z', box.minZ - R, box.maxZ + R]]) {
               if (Math.abs(d[axis]) < 1e-12) { if (a[axis] < min || a[axis] > max) return null; continue; }
               let x = (min - a[axis]) / d[axis], y = (max - a[axis]) / d[axis], sgn = -1; if (x > y) { [x, y] = [y, x]; sgn = 1; } if (x > lo) { lo = x; normal = { x: 0, y: 0, z: 0 }; normal[axis] = sgn; } hi = Math.min(hi, y); if (lo > hi) return null;
            }
            if (!normal || lo < 0 || lo > 1) return null; return { t: lo, p: add(a, mul(d, lo)), normal };
         }
         function objectHit(course, a, b, ignored = new Set()) {
            const hits = []; for (const o of course.objects) {
               if (ignored.has(o.id)) continue;
               if (o.kind === 'bridge') { const h = boxHit(a, b, { ...o, minZ: o.deckZ - o.thickness, maxZ: o.deckZ }); if (h) hits.push({ ...h, id: o.id, kind: 'bridge', restitution: 0.45, tangent: 0.8 }); }
               else if (o.kind === 'tree') {
                  const ground = Q.heightAt(course, o); let hit = sphereHit(a, b, { x: o.x, y: o.y, z: ground + (o.height + o.canopyBase) / 2 }, { x: o.canopyRadius + R, y: o.canopyRadius + R, z: (o.height - o.canopyBase) / 2 + R });
                  if (hit) hits.push({ ...hit, id: o.id, kind: 'canopy', restitution: 0.09, tangent: 0.36 });
                  // A narrow cylinder approximated by a tight rectangular trunk collider, declared in docs.
                  hit = boxHit(a, b, { minX: o.x - o.trunkRadius, maxX: o.x + o.trunkRadius, minY: o.y - o.trunkRadius, maxY: o.y + o.trunkRadius, minZ: ground, maxZ: ground + o.height });
                  if (hit) hits.push({ ...hit, id: o.id, kind: 'trunk', restitution: 0.42, tangent: 0.66 });
               }
            } hits.sort((a, b) => a.t - b.t); return hits[0] || null;
         }
         function groundHit(course, a, b) {
            // Spatial sampling finds a first bracket; bisection resolves the surface intersection.
            const gap = p => { const s = Q.surfaceAt(course, p); return p.z - (s.type === 'water' ? s.waterHeight : Q.heightAt(course, p)) - R; };
            const steps = Math.max(1, Math.ceil(norm(sub(b, a)) / 0.18)); let prev = 0;
            for (let i = 1; i <= steps; i++) { const t = i / steps, p = add(a, mul(sub(b, a), t)); if (gap(p) <= 0) { let lo = prev, hi = t; for (let j = 0; j < 20; j++) { const m = (lo + hi) / 2; if (gap(add(a, mul(sub(b, a), m))) > 0) lo = m; else hi = m; } const h = add(a, mul(sub(b, a), hi)), s = Q.slopeAt(course, h); return { t: hi, p: h, normal: unit({ x: -s.x, y: -s.y, z: 1 }), kind: Q.surfaceAt(course, h).type === 'water' ? 'water' : 'ground' }; } prev = t; }
            return null;
         }
         function supportAt(course, p) { let z = Q.heightAt(course, p), bridge = null; for (const o of course.objects) if (o.kind === 'bridge' && p.x >= o.minX && p.x <= o.maxX && p.y >= o.minY && p.y <= o.maxY && p.z >= o.deckZ - 0.08) { z = Math.max(z, o.deckZ); bridge = o; } return { z, bridge }; }
         function contactVelocity(v, n, e, tangent) { const vn = dot(v, n); if (vn >= 0) return v; return add(mul(sub(v, mul(n, vn)), tangent), mul(n, -e * vn)); }
         // Rolling sphere on z=h(x,y), I/(m r^2)=2/5. The metric term prevents
         // tan(theta) being treated as sin(theta), and the connection term accounts
         // for changing slope without adding energy. Roll coefficient is the existing
         // effective flat deceleration/G (Stimp calibrated), not Coulomb sliding friction.
         function rollingForces(course, p, v, ground, bridge = false) {
            const s = bridge ? { x: 0, y: 0 } : ground.slope, ss = s.x * s.x + s.y * s.y, den = 1 + ss, nz = 1 / Math.sqrt(den);
            const vz = s.x * v.x + s.y * v.y, speed = Math.hypot(v.x, v.y, vz), vh = Math.hypot(v.x, v.y);
            let curvature = 0;
            if (!bridge && vh > 1e-7) {
               const e = .08, dx = e * v.x / vh, dy = e * v.y / vh;
               curvature = (Q.heightAt(course, { x: p.x + dx, y: p.y + dy }) + Q.heightAt(course, { x: p.x - dx, y: p.y - dy }) - 2 * ground.height) / (e * e) * vh * vh;
            }
            const gravity = { x: -G * 5 / 7 * s.x / den, y: -G * 5 / 7 * s.y / den };
            const gravitySpeed = Math.hypot(gravity.x, gravity.y, s.x * gravity.x + s.y * gravity.y);
            const resistance = G * (bridge ? Q.materials.path.roll : ground.roll) * nz;
            const dir = speed > 1e-7 ? { x: v.x / speed, y: v.y / speed } : gravitySpeed > 0 ? { x: gravity.x / gravitySpeed, y: gravity.y / gravitySpeed } : { x: 0, y: 0 };
            return {
               x: gravity.x - s.x * curvature / den - resistance * dir.x, y: gravity.y - s.y * curvature / den - resistance * dir.y,
               speed, canRest: gravitySpeed <= resistance, resistance, gravitySpeed, slope: s, curvature
            };
         }
         function simulate(course, day, launch, options = {}) {
            if (day.windProgram) W.validateProgram(day.windProgram);
            let state = { p: C.clone(launch.position), v: C.clone(launch.velocity) }, spin = C.clone(launch.spin), mode = launch.mode || 'flight', t = 0, carry = null, firstContact = null, status = 'unresolved-time-limit', pathLength = 0;
            const start = C.clone(state.p), trajectory = [{ t: 0, ...state.p, mode }], events = [], cooldown = {}, dt = options.dt || 0.015, maxSeconds = options.maxSeconds || 60;
            if (!(dt > 0 && dt <= 0.05)) throw Error('dt must be >0 and <=0.05 s');
            let lastSurface = Q.surfaceAt(course, state.p).type, apex = state.p.z;
            function recordEvent(type, p, extra = {}) { events.push({ type, t: Number(t.toFixed(5)), position: C.clone(p), ...extra }); }
            const save = () => trajectory.push({ t: Number(t.toFixed(5)), ...state.p, mode });
            for (let step = 0; t < maxSeconds; step++) {
               const old = C.clone(state.p); t += dt;
               if (mode === 'flight') {
                  let next = stepFlight(state, spin, dt, day, options, t - dt); const ignored = new Set(Object.keys(cooldown).filter(k => cooldown[k] > t));
                  const oh = objectHit(course, state.p, next.p, ignored), gh = groundHit(course, state.p, next.p); const h = oh && (!gh || oh.t < gh.t) ? oh : gh;
                  if (h) {
                     state.p = h.p; state.v = add(state.v, mul(sub(next.v, state.v), h.t));
                     if (h.kind === 'water') { if (carry === null) { carry = C.hypot(start, state.p); firstContact = C.clone(state.p); } recordEvent('water', state.p); status = 'water'; save(); break; }
                     if (h.kind === 'ground') {
                        const ground = Q.groundAt(course, state.p, day); if (carry === null) { carry = C.hypot(start, state.p); firstContact = C.clone(state.p); recordEvent('landing', state.p, { surface: ground.type, zone: ground.zone }); }
                        if (options.stopAtFirstContact) { status = 'reference-landing'; save(); break; }
                        const incoming = C.clone(state.v), incomingSpin = C.clone(spin);
                        state.v = contactVelocity(state.v, h.normal, ground.bounce, ground.tangent); spin = mul(spin, 0.55); state.p = add(state.p, mul(h.normal, 0.003));
                        recordEvent('bounce', state.p, { surface: ground.type, zone: ground.zone, normal: h.normal, incomingVelocityMps: incoming, outgoingVelocityMps: C.clone(state.v), incomingSpinRadps: incomingSpin, outgoingSpinRadps: C.clone(spin), contactModel: 'legacy restitution/tangent damping; spin-to-turf calibration pending' });
                        if (dot(state.v, h.normal) < 1.05) { mode = 'roll'; state.v = sub(state.v, mul(h.normal, dot(state.v, h.normal))); }
                     } else {
                        recordEvent(h.kind, state.p, { objectId: h.id }); state.v = contactVelocity(state.v, h.normal, h.restitution, h.tangent); state.p = add(state.p, mul(h.normal, 0.01)); cooldown[h.id] = t + 0.18; spin = mul(spin, 0.5);
                        if (h.kind === 'bridge' && h.normal.z > 0.5 && state.v.z < 1.05) { mode = 'roll'; state.p.z = course.objects.find(o => o.id === h.id).deckZ + R; state.v.z = 0; }
                     }
                  } else state = next;
                  if (!options.vacuum) spin = mul(spin, Math.exp(-0.035 * dt));
               } else {
                  const support = supportAt(course, state.p), g = Q.groundAt(course, state.p, day), s = support.bridge ? { x: 0, y: 0 } : g.slope;
                  if (g.type === 'water' && !support.bridge) { state.p.z = Q.surfaceAt(course, state.p).waterHeight + R; recordEvent('water', state.p); status = 'water'; save(); break; }
                  const forces = rollingForces(course, state.p, state.v, g, !!support.bridge), speed = forces.speed;
                  if (speed < 0.025 && forces.canRest) { state.v = { x: 0, y: 0, z: 0 }; status = Q.inBounds(course, state.p) ? 'settled' : 'out-of-bounds'; recordEvent(status, state.p); save(); break; }
                  let vx = state.v.x + forces.x * dt, vy = state.v.y + forces.y * dt;
                  if (speed > 0 && vx * state.v.x + vy * state.v.y < 0 && forces.canRest) { vx = 0; vy = 0; }
                  const np = { x: state.p.x + (state.v.x + vx) * dt / 2, y: state.p.y + (state.v.y + vy) * dt / 2, z: state.p.z };
                  const ns = supportAt(course, np); if (support.bridge && !ns.bridge) { mode = 'flight'; state.p = np; state.v = { x: vx, y: vy, z: 0 }; recordEvent('bridge-exit', np); } else {
                     np.z = ns.z + R; const hit = objectHit(course, state.p, np, new Set());
                     if (hit && hit.kind === 'trunk') { state.p = add(hit.p, mul(hit.normal, 0.01)); state.v = contactVelocity({ x: vx, y: vy, z: 0 }, hit.normal, hit.restitution, hit.tangent); recordEvent('trunk', state.p, { objectId: hit.id }); }
                     else { state.p = np; const endSlope = ns.bridge ? { x: 0, y: 0 } : Q.slopeAt(course, np); state.v = { x: vx, y: vy, z: endSlope.x * vx + endSlope.y * vy }; }
                  }
                  const cup = C.project(course.pin, old, state.p);
                  if (g.type === 'green' && cup.distance < 0.054 && Math.hypot(vx, vy) < 0.8) { state.p = { ...course.pin, z: Q.heightAt(course, course.pin) }; state.v = { x: 0, y: 0, z: 0 }; recordEvent('cup-capture-heuristic', state.p); status = 'holed'; save(); break; }
               }
               if (course.boundaryPolicy === 'source-coverage-limit-not-OB' && !Q.inBounds(course, state.p)) { status = 'outside-survey'; recordEvent('source-coverage-limit', state.p); save(); break; }
               pathLength += C.hypot(old, state.p); apex = Math.max(apex, state.p.z);
               const surf = Q.surfaceAt(course, state.p).type; if (mode === 'roll' && surf !== lastSurface) { recordEvent('surface-transition', state.p, { from: lastSurface, to: surf }); lastSurface = surf; }
               if (step % 4 === 0) save();
               if (![state.p.x, state.p.y, state.p.z, state.v.x, state.v.y, state.v.z].every(C.finite)) throw Error('Non-finite physical state');
            }
            if (!trajectory.length || trajectory[trajectory.length - 1].t !== Number(t.toFixed(5))) save();
            return {
               engineVersion: VERSION, status, start, finish: C.clone(state.p), carry: carry ?? 0, firstContact, total: C.hypot(start, state.p), pathLength, apexAboveLaunch: apex - start.z, duration: t, finalSurface: Q.surfaceAt(course, state.p).type, events, trajectory,
               limits: ['uncalibrated point-mass drag/lift', 'simplified restitution and rolling friction; no spin-to-ground impulse model', 'simplified solid canopy and bridge; no individual branches/piers', 'cup capture is a heuristic, not validated lip physics']
            };
         }
         function run(course, day, golfer, intent, seed) {
            const gate = Q.validate(course); if (!gate.passed) throw Error('Course contract rejected: ' + gate.errors.join(', ')); const launch = buildLaunch(course, day, golfer, intent, seed), result = simulate(course, day, launch);
            return { schema: 'shot-record/0.3.0', version: VERSION, seed, course: C.clone(Q.physicsSnapshot(course)), day: C.clone(day), golfer: C.clone(golfer), intent: C.clone(intent), launch, result, provenance: { kind: 'simulation', quality: 'experimental_uncalibrated', notPhysicalGolferMeasurement: true } };
         }
         function replay(record) { if (record.version !== VERSION) throw Error('Engine version mismatch'); return simulate(record.course, record.day, record.launch); }
         function apparentRadius(clearance, zoom) { return C.clamp(3.5 + Math.sqrt(Math.max(0, clearance)) * 1.35, 3.5, 16) * C.clamp(Math.sqrt(zoom), 0.8, 1.3); }
         function learning(records) {
            const eligible = records.filter(r => r.provenance?.kind === 'simulation'); const n = eligible.length; if (n < 5) return { n, status: 'insufficient_sample', text: `${n} simulated decisions recorded. No tendency inferred before five shots.`, scope: 'game_decisions_only' };
            const shape = eligible.reduce((s, r) => s + r.intent.shape, 0) / n; const use = new Map(); for (const r of eligible) use.set(r.intent.club, (use.get(r.intent.club) || 0) + 1); const top = [...use].sort((a, b) => b[1] - a[1])[0];
            return { n, status: 'descriptive_only', scope: 'game_decisions_only', text: `In ${n} simulated decisions, ${top[0]} was selected ${top[1]} times. Average curve request: ${shape.toFixed(2)} (fade − / draw +). This describes choices here, not your real swing or skill.`, clubCounts: Object.fromEntries(use), meanRequestedShape: shape };
         }
         return { VERSION, G, R, M, clubs, player, club, stockYardages, EFFORT, referenceCarry, effortForCarry, suggestClub, rollingForces, buildLaunch, validateIntent, acceleration, stepFlight, sphereHit, boxHit, objectHit, groundHit, contactVelocity, simulate, run, replay, apparentRadius, learning };
      });

export { Shot };
