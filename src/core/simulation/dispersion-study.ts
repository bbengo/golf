import { Shot } from './shot.js';
import { Course } from '../course/course.js';
import { physicsProfiles } from './physics-profiles';
/** A bounded, repeatable experimental study, isolated from the player's round. */
export async function dispersionStudy(
   input: {
      course: Parameters<typeof Shot.run>[0];
      day: Parameters<typeof Shot.run>[1];
      golfer: Parameters<typeof Shot.run>[2];
      intent: Parameters<typeof Shot.run>[3];
   },
   signal?: AbortSignal,
   onProgress?: (done: number) => void,
) {
   const saved = structuredClone(input);
   const shots = [];
   for (let i = 0; i < 12; i++) {
      if (signal?.aborted) throw new Error('Study cancelled');
      const seed = 371001 + i;
      const launch = Shot.buildLaunch(
         saved.course,
         saved.day,
         saved.golfer,
         { ...saved.intent, variance: true },
         seed,
      );
      const result = Shot.simulate(saved.course, saved.day, launch, { model: 'fundamentals' });
      shots.push({ seed, launch, result });
      onProgress?.(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 0));
   }
   if (signal?.aborted) throw new Error('Study cancelled');
   const finishes = shots.map((s) => s.result.finish),
      mean = {
         x: finishes.reduce((s, p) => s + p.x, 0) / 12,
         y: finishes.reduce((s, p) => s + p.y, 0) / 12,
      };
   return {
      schema: 'purity-dispersion-study/1',
      course: Course.physicsSnapshot(saved.course),
      day: saved.day,
      golfer: saved.golfer,
      intent: { ...saved.intent, variance: true },
      physicsProfiles: physicsProfiles(),
      shots,
      summary: {
         count: 12,
         meanFinish: mean,
         rmsRadiusM: Math.sqrt(
            finishes.reduce((s, p) => s + (p.x - mean.x) ** 2 + (p.y - mean.y) ** 2, 0) / 12,
         ),
      },
      assumptions:
         '12 seeded trials with execution variance enabled and the same weather epoch. Includes hazard stops. Describes this experimental model, not real golfer dispersion or a confidence interval.',
   };
}
