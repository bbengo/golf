import type { Point } from '../contracts/cockpit';
export type ImpactEvent = {
   type: string;
   t: number;
   position: Point;
   surface?: string;
   incomingVelocityMps?: { x: number; y: number; z: number };
   normal?: { x: number; y: number; z: number };
};
export type ImpactParticle = {
   x: number;
   y: number;
   lift: number;
   size: number;
   alpha: number;
   colour: string;
};
const palettes = {
   sand: ['#e4d5ac', '#c8b88f'],
   water: ['#bad8d3', '#8dbdbd'],
   turf: ['#bac17c', '#739650'],
};
/** Replay-stable presentation particles. Distances are visual metres, not simulated debris. */
export function impactParticles(event: ImpactEvent, age: number): ImpactParticle[] {
   if (!Number.isFinite(age) || age < 0 || age >= 1.5) return [];
   const water = event.type === 'water';
   if (!water && event.type !== 'bounce') return [];
   if (
      !water &&
      !['sand', 'rough', 'deep-rough', 'fairway', 'tee', 'green', 'fringe'].includes(
         event.surface || '',
      )
   )
      return [];
   const v = event.incomingVelocityMps,
      n = event.normal ?? { x: 0, y: 0, z: 1 };
   const speed = v ? Math.abs(v.x * n.x + v.y * n.y + v.z * n.z) : 3;
   if (!water && speed < 0.8) return [];
   const strength = Math.min(1, speed / 16),
      sand = event.surface === 'sand';
   const palette = water ? palettes.water : sand ? palettes.sand : palettes.turf;
   const count = water ? 10 : sand ? 9 : 5,
      progress = age / 1.5;
   const seed = event.position.x * 12.31 + event.position.y * 4.17 + event.t * 7.91;
   return Array.from({ length: count }, (_, i) => {
      const variation = (Math.sin(seed + i * 73.19) * 43758.5453) % 1;
      const u = variation - Math.floor(variation),
         angle = (i / count) * Math.PI * 2 + u * 0.6;
      const travel = (0.25 + u * 0.65) * (water ? 1.7 : 1) * (0.4 + strength) * progress;
      return {
         x: event.position.x + Math.cos(angle) * travel,
         y: event.position.y + Math.sin(angle) * travel,
         lift: Math.sin(progress * Math.PI) * (0.15 + u * 0.4) * (water ? 1.6 : 1),
         size: (water ? 1.3 : 0.8) + u * 0.6,
         alpha: (1 - progress) ** 2 * (water ? 0.7 : 0.65),
         colour: palette[i % 2],
      };
   });
}
