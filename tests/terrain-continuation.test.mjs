import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Course } from '../src/core/course/course.js';
import { DEM } from '../src/core/course/dem.js';
import { createPurityCourse } from '../src/core/course/purity-course.ts';
import { continuedHeight, TERRAIN_VERSION } from '../src/core/course/terrain-continuation.ts';
import { Shot } from '../src/core/simulation/shot.js';

test('terrain continuation preserves surveyed heights and joins all four edges continuously', () => {
   const c = createPurityCourse(),
      g = c.terrain.grid;
   const x1 = g.originX + (g.width - 1) * g.step,
      y1 = g.originY + (g.height - 1) * g.step;
   for (let y = g.originY; y <= y1; y += 29)
      for (let x = g.originX; x <= x1; x += 31)
         assert.equal(Course.heightAt(c, { x, y }), DEM.heightAt(c.terrain, { x, y }));
   for (const [p, n] of [
      [
         { x: g.originX, y: 300 },
         { x: -1, y: 0 },
      ],
      [
         { x: x1, y: 300 },
         { x: 1, y: 0 },
      ],
      [
         { x: 100, y: g.originY },
         { x: 0, y: -1 },
      ],
      [
         { x: 100, y: y1 },
         { x: 0, y: 1 },
      ],
   ]) {
      const e = 0.001,
         h = continuedHeight(c, p);
      const inner = continuedHeight(c, { x: p.x - n.x * e, y: p.y - n.y * e });
      const outer = continuedHeight(c, { x: p.x + n.x * e, y: p.y + n.y * e });
      assert.ok(Math.abs(outer - inner) < 0.001);
      assert.ok(Math.abs((outer - h) / e - (h - inner) / e) < 0.002);
   }
});

test('outer relief remains bounded and survives course serialization', () => {
   const c = createPurityCourse(),
      saved = JSON.parse(JSON.stringify(Course.physicsSnapshot(c)));
   assert.equal(saved.world.terrainVersion, TERRAIN_VERSION);
   for (const x of [-10000, -1000, 1000, 10000])
      for (const y of [-10000, -1000, 1000, 10000]) {
         const p = { x, y },
            h = Course.heightAt(c, p),
            s = Course.slopeAt(c, p);
         assert.ok(Number.isFinite(h) && h > 150 && h < 230);
         assert.ok(Math.hypot(s.x, s.y) < 0.5);
         assert.equal(Course.heightAt(saved, p), h);
      }
   delete saved.world.terrainVersion;
   assert.equal(
      Course.heightAt(saved, { x: -1000, y: 1000 }),
      DEM.heightAt(saved.terrain, { x: -1000, y: 1000 }),
   );
});

test('outer lakes have submerged beds, continuous banks and water-level impact', () => {
   const c = createPurityCourse();
   for (const lake of c.world.waters.filter((w) => w.id.startsWith('world-lake-'))) {
      const p = {
         x: lake.polygon.reduce((v, q) => v + q.x, 0) / lake.polygon.length,
         y: lake.polygon.reduce((v, q) => v + q.y, 0) / lake.polygon.length,
      };
      assert.ok(Course.heightAt(c, p) < lake.waterHeight - 1);
      const a = lake.polygon[0],
         b = lake.polygon[1],
         edge = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      assert.ok(Math.abs(Course.heightAt(c, edge) - lake.waterHeight) < 0.001);
      assert.ok(
         Math.abs(
            Course.heightAt(c, { x: edge.x + 0.001, y: edge.y }) -
               Course.heightAt(c, { x: edge.x - 0.001, y: edge.y }),
         ) < 0.001,
      );
      const result = Shot.simulate(
         c,
         Course.days.normal,
         {
            position: { ...p, z: lake.waterHeight + 3 },
            velocity: { x: 0, y: 0, z: -1 },
            spin: { x: 0, y: 0, z: 0 },
            mode: 'flight',
         },
         { model: 'fundamentals' },
      );
      assert.equal(result.status, 'water');
      assert.ok(Math.abs(result.trajectory.at(-1).z - lake.waterHeight) < 0.05);
   }
});

test('rolling across the actual DEM edge continues to supported rest', () => {
   const c = createPurityCourse();
   // Clear nearby test trees to isolate terrain contact, retaining world surface queries.
   c.objects = [];
   const p = { x: 443, y: 350 },
      z = Course.heightAt(c, p) + 0.02135;
   const result = Shot.simulate(
      c,
      Course.days.normal,
      {
         position: { ...p, z },
         velocity: { x: 5, y: 0, z: 0 },
         spin: { x: 0, y: 0, z: 0 },
         mode: 'roll',
      },
      { model: 'fundamentals' },
   );
   assert.equal(result.status, 'settled');
   const end = result.trajectory.at(-1);
   assert.ok(end.x > 445);
   assert.ok(Math.abs(end.z - Course.heightAt(c, end) - 0.02135) < 0.01);
});

test('unknown terrain contracts are rejected instead of silently changing saved shots', () => {
   const c = createPurityCourse();
   c.world.terrainVersion = 'unknown';
   assert.equal(Course.validate(c).passed, false);
   assert.throws(() => Course.heightAt(c, { x: 1000, y: 1000 }), /Unsupported procedural terrain/);
});

test('uplands are physical, continuous and preserve legacy terrain snapshots', () => {
   const current = createPurityCourse();
   const legacy = JSON.parse(JSON.stringify(Course.physicsSnapshot(current)));
   legacy.world.terrainVersion = 'purity-terrain/1';
   for (const [x, height] of [
      [-800, 191.75338841034215],
      [900, 188.08053655039362],
      [1400, 188.58056321481783],
   ]) {
      assert.ok(Math.abs(Course.heightAt(legacy, { x, y: 1100 }) - height) < 1e-9);
   }
   let raised = 0;
   for (let x = -1400; x <= 1400; x += 37) {
      for (let y = -1400; y <= 1400; y += 41) {
         const p = { x, y };
         const difference = Course.heightAt(current, p) - Course.heightAt(legacy, p);
         assert.ok(difference >= -1e-9 && difference <= 22.000001);
         if (difference > 8) raised++;
      }
   }
   assert.ok(raised > 100, 'substantial uplands must exist outside the protected playing ground');
   // Cross render tile boundaries at 512 m: no tile-local height seams.
   for (const x of [-1024, -512, 512, 1024]) {
      const a = Course.heightAt(current, { x: x - 0.001, y: 1100 });
      const b = Course.heightAt(current, { x: x + 0.001, y: 1100 });
      assert.ok(Math.abs(a - b) < 0.01);
   }
});
