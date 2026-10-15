import { test } from 'node:test';
import assert from 'node:assert/strict';
import { impactParticles } from '../src/core/rendering/impact-particles.ts';
import { ShotEffects } from '../src/core/rendering/shot-effects.ts';
const event = {
   type: 'bounce',
   t: 2,
   position: { x: 10, y: 20 },
   surface: 'sand',
   normal: { x: 0, y: 0, z: 1 },
   incomingVelocityMps: { x: 10, y: 0, z: -8 },
};
test('surface feedback is replay-stable, bounded and leaves shot evidence untouched', () => {
   const before = structuredClone(event),
      a = impactParticles(event, 0.5);
   assert.deepEqual(a, impactParticles(event, 0.5));
   assert.deepEqual(event, before);
   assert.equal(a.length, 9);
   assert.ok(
      a.every((p) => Object.values(p).every((v) => typeof v !== 'number' || Number.isFinite(v))),
   );
   assert.equal(impactParticles({ ...event, surface: 'fairway' }, 0.5).length, 5);
   assert.equal(impactParticles({ ...event, type: 'water' }, 0.5).length, 10);
   for (const age of [-1, 1.5, 5, NaN]) assert.deepEqual(impactParticles(event, age), []);
   assert.deepEqual(
      impactParticles({ ...event, incomingVelocityMps: { x: 0, y: 0, z: -0.2 } }, 0.5),
      [],
   );
   assert.deepEqual(impactParticles({ ...event, surface: 'path' }, 0.5), []);
   assert.ok(impactParticles(event, 1)[0].alpha < a[0].alpha);
});
test('effects honour off and reduced motion and cap simultaneous event rendering', () => {
   let ellipses = 0;
   const ctx = {
      save() {},
      restore() {},
      beginPath() {},
      stroke() {},
      fill() {},
      ellipse() {
         ellipses++;
      },
   };
   const camera = { world: (p) => p, scale: 3 },
      fx = new ShotEffects();
   const settings = { shotTrace: 'off', impactCue: 'off' };
   fx.paint(ctx, camera, [], [event], 2.5, settings, false);
   assert.equal(ellipses, 0);
   fx.paint(ctx, camera, [], [event], 2.5, { ...settings, impactCue: 'subtle' }, true);
   assert.equal(ellipses, 0);
   fx.paint(
      ctx,
      camera,
      [],
      Array.from({ length: 100 }, () => ({ ...event, type: 'water' })),
      2.5,
      { ...settings, impactCue: 'subtle' },
      false,
   );
   assert.ok(ellipses > 0 && ellipses <= 12 * 12);
});
