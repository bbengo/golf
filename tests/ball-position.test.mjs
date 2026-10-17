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
