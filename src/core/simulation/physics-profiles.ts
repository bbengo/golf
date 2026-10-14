import { Contract } from '../contracts/contract.js';
/** Versioned trial baseline. No commercial ball variants or measured calibration implied. */
export const BALL_PROFILE = Object.freeze({
   id: 'purity-ball/1',
   radiusM: 0.02135,
   massKg: 0.04593,
   inertiaFactor: 0.4,
});
export const AERO_PROFILE = Object.freeze({
   id: 'purity-aero/1',
   dragBase: 0.235,
   dragSpin: 0.04,
   liftCap: 0.29,
   liftSpin: 1.8,
   spinDecay: 2e-5,
   status: 'experimental-uncalibrated',
});
export const TURF_PROFILE = Object.freeze({
   id: 'purity-contact/1',
   friction: Object.freeze({
      green: 0.25,
      fairway: 0.3,
      fringe: 0.3,
      tee: 0.3,
      rough: 0.45,
      'deep-rough': 0.5,
      sand: 0.6,
      path: 0.2,
   }),
   fallback: 0.3,
   status: 'trial-coefficients',
});
export function physicsProfiles() {
   return structuredClone({
      ball: BALL_PROFILE,
      aerodynamics: AERO_PROFILE,
      contact: TURF_PROFILE,
      launch: {
         id: 'ucg-launch/1',
         source: 'record.golfer and record.intent',
         status: 'game-design-parameters',
      },
   });
}
export function validatePhysicsProfiles(value: unknown) {
   if (Contract.stable(value) !== Contract.stable(physicsProfiles()))
      throw Error('Unsupported or modified physics profile evidence');
}
