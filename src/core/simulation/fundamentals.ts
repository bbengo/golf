/** Experimental rigid-sphere mechanics. SI units throughout; see docs/physics-roadmap.md. */
export type Vec3 = { x: number; y: number; z: number };
export const G = 9.80665,
   R = 0.02135,
   M = 0.04593,
   INERTIA = 0.4 * M * R * R;
export const VERSION = 'purity-rigid-sphere/0.1.0';
export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const scale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
export const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 => ({
   x: a.y * b.z - a.z * b.y,
   y: a.z * b.x - a.x * b.z,
   z: a.x * b.y - a.y * b.x,
});
export const length = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
export const unit = (a: Vec3) => scale(a, 1 / (length(a) || 1));
const sub = (a: Vec3, b: Vec3) => add(a, scale(b, -1));

// Point-contact impulse, with Coulomb friction opposing velocity at the contact
// patch. Translational and rotational momentum are changed by the same impulse.
export function contact(v: Vec3, spin: Vec3, normal: Vec3, restitution: number, friction: number) {
   const n = unit(normal),
      vn = dot(v, n);
   if (vn >= 0)
      return { velocity: { ...v }, spin: { ...spin }, normalImpulse: 0, tangentImpulse: 0 };
   const normalImpulse = -(1 + restitution) * M * vn;
   return frictionImpulse(v, spin, n, normalImpulse, friction, scale(n, normalImpulse));
}
function frictionImpulse(
   v: Vec3,
   spin: Vec3,
   n: Vec3,
   normalImpulse: number,
   friction: number,
   normalChange: Vec3,
) {
   const arm = scale(n, -R);
   const patch = add(v, cross(spin, arm));
   const slip = sub(patch, scale(n, dot(patch, n)));
   const tangentImpulse = Math.min(
      length(slip) / (1 / M + (R * R) / INERTIA),
      Math.max(0, friction) * normalImpulse,
   );
   const jt = scale(unit(slip), -tangentImpulse);
   return {
      velocity: add(v, scale(add(normalChange, jt), 1 / M)),
      spin: add(spin, scale(cross(arm, jt), 1 / INERTIA)),
      normalImpulse,
      tangentImpulse,
   };
}
export function sliding(v: Vec3, spin: Vec3, normal: Vec3, friction: number, dt: number) {
   const n = unit(normal),
      gravity = { x: 0, y: 0, z: -G };
   const tangentGravity = sub(gravity, scale(n, dot(gravity, n)));
   const accelerated = add(v, scale(tangentGravity, dt));
   const result = frictionImpulse(accelerated, spin, n, M * G * n.z * dt, friction, {
      x: 0,
      y: 0,
      z: 0,
   });
   const slip = add(result.velocity, cross(result.spin, scale(n, -R)));
   return { ...result, rolling: length(sub(slip, scale(n, dot(slip, n)))) < 0.01 };
}
export function friction(surface: string) {
   // Declared trial coefficients, NOT fitted turf measurements. Moisture affects
   // existing restitution/rolling resistance; no invented wet-green spin bonus.
   return (
      (
         {
            green: 0.25,
            fairway: 0.3,
            fringe: 0.3,
            tee: 0.3,
            rough: 0.45,
            'deep-rough': 0.5,
            sand: 0.6,
            path: 0.2,
         } as Record<string, number>
      )[surface] ?? 0.3
   );
}

type FlightState = { p: Vec3; v: Vec3; spin: Vec3 };
export function flightStep(
   state: { p: Vec3; v: Vec3 },
   spin: Vec3,
   dt: number,
   windAt: (time: number) => Vec3,
   density: number,
   time: number,
   vacuum = false,
) {
   function derivative(s: FlightState, t: number): FlightState {
      const rel = sub(s.v, windAt(t)),
         speed = length(rel);
      let acceleration: Vec3 = { x: 0, y: 0, z: -G },
         torque: Vec3 = { x: 0, y: 0, z: 0 };
      if (!vacuum && speed > 1e-8) {
         const axis = unit(rel),
            transverse = sub(s.spin, scale(axis, dot(s.spin, axis)));
         const spinRatio = (length(transverse) * R) / speed;
         // Baseline coefficient family retained and explicitly uncalibrated.
         const cd = 0.235 + 0.04 * Math.min(spinRatio, 1),
            cl = Math.min(0.29, 1.8 * spinRatio);
         const q = ((0.5 * density * Math.PI * R * R) / M) * speed * speed;
         acceleration = add(
            acceleration,
            add(scale(axis, -q * cd), scale(unit(cross(transverse, rel)), q * cl)),
         );
         // Smits/Smith spin-down as reported by Nathan (2008), eq.5 and SI footnote:
         // dω/dt = -2e-5 |v_air| ω/R. Integrated with velocity at every RK4 stage.
         torque = scale(s.spin, (-2e-5 * speed) / R);
      }
      return { p: s.v, v: acceleration, spin: torque };
   }
   const s = { ...state, spin };
   const offset = (a: FlightState, b: FlightState, h: number): FlightState => ({
      p: add(a.p, scale(b.p, h)),
      v: add(a.v, scale(b.v, h)),
      spin: add(a.spin, scale(b.spin, h)),
   });
   const a = derivative(s, time),
      b = derivative(offset(s, a, dt / 2), time + dt / 2),
      c = derivative(offset(s, b, dt / 2), time + dt / 2),
      d = derivative(offset(s, c, dt), time + dt);
   const mix = (k: keyof FlightState) =>
      scale(add(add(a[k], scale(b[k], 2)), add(scale(c[k], 2), d[k])), dt / 6);
   return { p: add(s.p, mix('p')), v: add(s.v, mix('v')), spin: add(spin, mix('spin')) };
}

/** Swept ball-centre vs a finite expanded trunk cylinder; rounded cap corners remain approximate. */
export function cylinderHit(
   a: Vec3,
   b: Vec3,
   center: { x: number; y: number },
   radius: number,
   zMin: number,
   zMax: number,
) {
   const d = sub(b, a),
      x = a.x - center.x,
      y = a.y - center.y,
      r = radius + R;
   const candidates: { t: number; p: Vec3; normal: Vec3 }[] = [];
   const aa = d.x * d.x + d.y * d.y,
      bb = 2 * (x * d.x + y * d.y),
      cc = x * x + y * y - r * r,
      disc = bb * bb - 4 * aa * cc;
   if (aa > 1e-12 && disc >= 0) {
      for (const t of [(-bb - Math.sqrt(disc)) / (2 * aa), (-bb + Math.sqrt(disc)) / (2 * aa)]) {
         const p = add(a, scale(d, t));
         const normal = unit({ x: p.x - center.x, y: p.y - center.y, z: 0 });
         if (t >= 0 && t <= 1 && p.z >= zMin && p.z <= zMax && dot(d, normal) < 0)
            candidates.push({ t, p, normal });
      }
   }
   if (Math.abs(d.z) > 1e-12)
      for (const [z, nz] of [
         [zMin - R, -1],
         [zMax + R, 1],
      ]) {
         const t = (z - a.z) / d.z,
            p = add(a, scale(d, t));
         if (t >= 0 && t <= 1 && Math.hypot(p.x - center.x, p.y - center.y) <= r && d.z * nz < 0)
            candidates.push({ t, p, normal: { x: 0, y: 0, z: nz } });
      }
   return candidates.sort((a, b) => a.t - b.t)[0] ?? null;
}

/** Conservative free-fall capture, Holmes/Penner eq.22. Does not model rim rebounds/lip-outs. */
export function cupEntry(
   a: Vec3,
   b: Vec3,
   pin: { x: number; y: number },
   velocity: Vec3,
   slope: { x: number; y: number },
) {
   const dx = b.x - a.x,
      dy = b.y - a.y,
      len = Math.hypot(dx, dy),
      holeR = 0.054;
   if (len < 1e-10) return null;
   const ux = dx / len,
      uy = dy / len,
      px = pin.x - a.x,
      py = pin.y - a.y;
   const along = px * ux + py * uy,
      impact = Math.abs(px * uy - py * ux);
   if (impact >= holeR) return null;
   const near = along - Math.sqrt(holeR * holeR - impact * impact);
   if (near < 0 || near > len) return null; // Actual crossing of the near rim, never a nearby resting ball.
   const normalGravity = G / Math.sqrt(1 + slope.x * slope.x + slope.y * slope.y);
   const clearance = holeR - R;
   const available =
      impact < clearance
         ? Math.sqrt(holeR * holeR - impact * impact) +
           Math.sqrt(clearance * clearance - impact * impact)
         : 0;
   const speed = length(velocity),
      critical = available * Math.sqrt(normalGravity / (2 * R));
   return {
      captured: speed < critical,
      impactM: impact,
      speedMps: speed,
      criticalMps: critical,
      crossing: near / len,
      model: 'free-fall-clearance/0.1',
   };
}
