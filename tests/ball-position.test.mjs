import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordedBallPosition } from '../src/core/rendering/ball-position.ts';

test('both views can sample the same irregular recorded flight without changing evidence', () => {
   const session = {
      phase: 'animating',
      ball: { x: 0, y: 0, z: 2 },
      last: {
         result: {
            duration: 5,
            finish: { x: 40, y: 20, z: 1 },
            trajectory: [
               { t: 0, x: 0, y: 0, z: 2 },
               { t: 2, x: 20, y: 10, z: 12 },
               { t: 5, x: 40, y: 20, z: 1 },
            ],
         },
      },
      shotTime: (t) => Math.min(5, Math.max(0, t)),
   };
   const before = JSON.stringify(session);
   assert.deepEqual(recordedBallPosition(session, 1), { x: 10, y: 5, z: 7 });
   assert.deepEqual(recordedBallPosition(session, 3.5), { x: 30, y: 15, z: 6.5 });
   assert.deepEqual(recordedBallPosition(session, 99), session.last.result.finish);
   assert.equal(JSON.stringify(session), before);
   const result = recordedBallPosition(session, 99);
   result.x = -1;
   assert.equal(session.last.result.finish.x, 40);
   session.phase = 'resolved';
   assert.deepEqual(recordedBallPosition(session, 1), session.ball);
});

test('long recorded shots use bounded lookup while retaining interpolation', () => {
   let reads = 0;
   const points = Array.from({ length: 100000 }, (_, i) => ({ t: i * 0.01, x: i, y: i * 2, z: 3 }));
   const trajectory = new Proxy(points, {
      get(target, key) {
         if (/^\d+$/.test(String(key))) reads++;
         return Reflect.get(target, key);
      },
   });
   const session = {
      phase: 'animating',
      last: { result: { trajectory, duration: 1000, finish: points.at(-1) } },
      shotTime: (t) => t,
   };
   const ball = recordedBallPosition(session, 900.005);
   assert.ok(Math.abs(ball.x - 90000.5) < 0.000001);
   assert.ok(reads < 30, `trajectory reads: ${reads}`);
});
