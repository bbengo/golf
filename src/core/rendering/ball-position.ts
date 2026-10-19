import type { Point } from '../contracts/cockpit';
import type { CockpitSession } from '../session/cockpit-session';

/** Read-only sampling of the authoritative recorded trajectory for every renderer. */
export function recordedBallPosition(session: CockpitSession, time: number): Point {
   if (session.phase !== 'animating' || !session.last) return { ...session.ball };
   const { trajectory, duration, finish } = session.last.result;
   const elapsed = session.shotTime(time);
   if (elapsed >= duration || !trajectory.length) return { ...finish };
   if (elapsed <= trajectory[0].t) return { ...trajectory[0] };
   let low = 1,
      high = trajectory.length - 1;
   while (low < high) {
      const middle = (low + high) >>> 1;
      if (trajectory[middle].t < elapsed) low = middle + 1;
      else high = middle;
   }
   const i = low;
   if (trajectory.length === 1) return { ...trajectory[0] };
   const a = trajectory[i - 1],
      b = trajectory[i];
   const f = Math.max(0, Math.min(1, (elapsed - a.t) / (b.t - a.t || 1)));
   return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f };
}
