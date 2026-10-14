import { Conditions } from './conditions.js';
import type { Setup } from '../contracts/cockpit';
import type { Daylight } from '../rendering/daylight';
export const ENVIRONMENT_VERSION = 'purity-environment/1';
/** A single monotonic clock; a shot captures its own immutable weather epoch. */
export class Environment {
   daylight: Daylight = 'day';
   private epoch: number;
   constructor(
      private now: () => number = () => performance.now(),
      readonly seed = 270919,
   ) {
      this.epoch = now();
   }
   reset() {
      this.epoch = this.now();
   }
   advanceTo(seconds: number) {
      if (!Number.isFinite(seconds) || seconds < 0) throw Error('Invalid environment time');
      const now = this.now();
      this.epoch = now - Math.max((now - this.epoch) / 1000, seconds) * 1000;
   }
   day(course: Parameters<typeof Conditions.makeDay>[0], setup: Setup) {
      const seconds = Math.max(0, (this.now() - this.epoch) / 1000);
      const day = Conditions.makeDay(course, Conditions.setup(setup), this.seed, seconds);
      return {
         ...day,
         environment: {
            version: ENVIRONMENT_VERSION,
            seconds,
            seed: this.seed,
            daylight: this.daylight,
            moisture: day.moisture,
            rain: 'none',
            sunModel: 'art-directed-preset',
         },
      };
   }
}
