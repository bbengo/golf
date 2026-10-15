import { R, G, add, scale, dot, unit, cross, contact, type Vec3 } from './fundamentals';
export const CUP_VERSION = 'purity-cup/1';
export const CUP_RADIUS = 0.054;
/** Local circular rigid lip, gravity and friction. Coefficients are trial values. */
export function cupMotion(
   position: Vec3,
   velocity: Vec3,
   spin: Vec3,
   step = 0.0005,
   maxSeconds = 1.5,
   gravity: Vec3 = { x: 0, y: 0, z: -G },
) {
   if (
      ![
         ...Object.values(position),
         ...Object.values(velocity),
         ...Object.values(spin),
         ...Object.values(gravity),
         maxSeconds,
      ].every(Number.isFinite) ||
      maxSeconds < 0
   )
      throw Error('Invalid cup state');
   if (!(step > 0 && step <= 0.002)) throw Error('Invalid cup timestep');
   let p = { ...position },
      v = { ...velocity },
      w = { ...spin },
      time = 0,
      impacts = 0;
   const trace: { t: number; x: number; y: number; z: number }[] = [];
   let entered = false;
   for (let i = 0; i < Math.floor(Math.min(1.5, maxSeconds) / step); i++) {
      const old = { ...p };
      v = add(v, scale(gravity, step));
      p = add(p, scale(v, step));
      time += step;
      const rho = Math.hypot(p.x, p.y),
         er = { x: p.x / (rho || 1), y: p.y / (rho || 1), z: 0 };
      if (rho < CUP_RADIUS) entered = true;
      if (rho < CUP_RADIUS - R && p.z < -R && v.z < 0)
         return { kind: 'capture' as const, p, v, w, time, impacts, trace };
      // Sphere versus circular lip. Geometry supplies the normal; no proximity capture.
      const delta = { x: er.x * (rho - CUP_RADIUS), y: er.y * (rho - CUP_RADIUS), z: p.z };
      const distance = Math.hypot(delta.x, delta.y, delta.z);
      if (distance < R && p.z >= -R) {
         const n = unit(delta);
         p = add(p, scale(n, R - distance + 1e-7));
         if (dot(v, n) < 0) {
            const hit = contact(v, w, n, 0.18, 0.22);
            v = hit.velocity;
            w = hit.spin;
            impacts++;
         }
      }
      if (rho >= CUP_RADIUS && p.z < R) {
         p.z = R;
         const hit = contact(v, w, { x: 0, y: 0, z: 1 }, 0.12, 0.25);
         v = hit.velocity;
         w = hit.spin;
      }
      if (entered && rho > CUP_RADIUS + R * 0.25 && p.z >= R - 1e-5)
         return { kind: 'lip-out' as const, p, v, w, time, impacts, trace };
      if (!entered && time > 0.05 && rho > CUP_RADIUS + R)
         return { kind: 'pass' as const, p, v, w, time, impacts, trace };
      if (i % 4 === 0) trace.push({ t: time, ...p });
      if (![p.x, p.y, p.z, v.x, v.y, v.z].every(Number.isFinite))
         throw Error('Non-finite cup state');
      if (time > 0.2 && Math.hypot(p.x - old.x, p.y - old.y, p.z - old.z) < 1e-9) break;
   }
   return { kind: 'unresolved' as const, p, v, w, time, impacts, trace };
}

/** Orthonormal frame aligned with the local green, including gravity along its slope. */
export function cupFrame(slope: { x: number; y: number }) {
   const normal = unit({ x: -slope.x, y: -slope.y, z: 1 });
   const east = unit({ x: 1, y: 0, z: slope.x }),
      north = cross(normal, east);
   return {
      local: (v: Vec3): Vec3 => ({ x: dot(v, east), y: dot(v, north), z: dot(v, normal) }),
      world: (v: Vec3): Vec3 => add(add(scale(east, v.x), scale(north, v.y)), scale(normal, v.z)),
   };
}
