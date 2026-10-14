type Sample = { x: number; y: number; z: number; t: number };
type Result = {
   trajectory: Sample[];
   firstContact: Omit<Sample, 't'> | null;
   events: { type: string; t: number; incomingVelocityMps?: { x: number; y: number; z: number } }[];
   carry: number;
   total: number;
   apexAboveLaunch: number;
   status: string;
};
/** Derived exclusively from a saved trajectory and contact evidence; never resimulates. */
export function analyseShot(result: Result) {
   const landing = result.events.find((e) => e.type === 'landing');
   const bounce = result.events.find((e) => e.type === 'bounce' && e.incomingVelocityMps);
   const velocity = bounce?.incomingVelocityMps;
   const landingAngle = velocity
      ? (Math.atan2(-velocity.z, Math.hypot(velocity.x, velocity.y)) * 180) / Math.PI
      : null;
   let rollout = 0;
   if (landing && result.firstContact) {
      let previous = result.firstContact;
      for (const point of result.trajectory.filter((p) => p.t > landing.t)) {
         rollout += Math.hypot(point.x - previous.x, point.y - previous.y);
         previous = point;
      }
   }
   return {
      schema: 'purity-shot-analysis/1',
      carry: result.carry,
      total: result.total,
      apex: result.apexAboveLaunch,
      landingAngleDeg: landingAngle,
      rolloutM: landing ? rollout : null,
      rolloutBasis: 'sampled horizontal travel after first ground contact, including bounces',
      status: result.status,
   };
}
export function compareShots(current: Result, previous: Result) {
   const a = analyseShot(current),
      b = analyseShot(previous);
   return {
      carryM: a.carry - b.carry,
      totalM: a.total - b.total,
      apexM: a.apex - b.apex,
      landingAngleDeg:
         a.landingAngleDeg === null || b.landingAngleDeg === null
            ? null
            : a.landingAngleDeg - b.landingAngleDeg,
   };
}
