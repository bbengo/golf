import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LandscapePerformance } from '../src/core/rendering/landscape-performance.ts';

test('CPU diagnostic window is bounded and reports only its retained samples', () => {
   const metrics = new LandscapePerformance();
   for (let i = 1; i <= 240; i++) metrics.recordDraw(i);
   metrics.recordDraw(NaN);
   metrics.recordDraw(-1);
   const snapshot = metrics.snapshot();
   assert.equal(snapshot.samples, 120);
   assert.equal(snapshot.cpuDrawMedianMs, 180);
   assert.equal(snapshot.cpuDrawP95Ms, 234);
   metrics.recordBuild('detail', 123);
   metrics.recordBuild('backdrop', 456);
   metrics.cancelBuild();
   assert.equal(metrics.snapshot().lastDetailBuildMs, 123);
   assert.equal(metrics.snapshot().lastBackdropBuildMs, 456);
   assert.equal(metrics.snapshot().cancelledDetailBuilds, 1);
   assert.equal(new LandscapePerformance().snapshot().cpuDrawP95Ms, 0);
});
