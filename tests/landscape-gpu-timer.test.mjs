import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LandscapeGpuTimer } from '../src/core/rendering/landscape-gpu-timer.ts';

function fixture(supported = true) {
   const state = {
      available: false,
      disjoint: false,
      lost: false,
      created: 0,
      deleted: 0,
      ended: 0,
      resultReads: 0,
   };
   const ext = {
      TIME_ELAPSED_EXT: 1,
      GPU_DISJOINT_EXT: 2,
      QUERY_RESULT_AVAILABLE_EXT: 3,
      QUERY_RESULT_EXT: 4,
      createQueryEXT() {
         state.created++;
         return {};
      },
      beginQueryEXT() {},
      endQueryEXT() {
         state.ended++;
      },
      deleteQueryEXT() {
         state.deleted++;
      },
      getQueryObjectEXT(query, key) {
         if (key === 3) return state.available;
         state.resultReads++;
         return 2500000;
      },
   };
   const samples = [];
   const timer = new LandscapeGpuTimer(
      {
         getExtension: () => (supported ? ext : null),
         getParameter: () => state.disjoint,
         isContextLost: () => state.lost,
      },
      (ms) => samples.push(ms),
   );
   return { state, timer, samples };
}
test('GPU timing is asynchronous and holds only one pending query', () => {
   const { state, timer, samples } = fixture();
   timer.begin();
   timer.end();
   for (let i = 0; i < 10; i++) {
      timer.poll();
      timer.begin();
   }
   assert.equal(state.created, 1);
   assert.equal(state.resultReads, 0);
   state.available = true;
   timer.poll();
   assert.deepEqual(samples, [2.5]);
   assert.equal(state.deleted, 1);
   timer.begin();
   timer.dispose();
   timer.dispose();
   assert.equal(state.deleted, 2);
   assert.equal(state.ended, 2);
   timer.begin();
   assert.equal(state.created, 2);
});
test('invalid GPU clock periods are discarded and unsupported/lost contexts stay safe', () => {
   const { state, timer, samples } = fixture();
   timer.begin();
   timer.end();
   state.disjoint = true;
   timer.poll();
   assert.equal(state.deleted, 1);
   assert.equal(state.resultReads, 0);
   assert.deepEqual(samples, []);
   timer.begin();
   assert.equal(state.created, 1);
   state.disjoint = false;
   timer.begin();
   timer.end();
   state.lost = true;
   timer.dispose();
   assert.equal(state.deleted, 1);
   const unavailable = fixture(false);
   unavailable.timer.begin();
   unavailable.timer.end();
   unavailable.timer.poll();
   unavailable.timer.dispose();
   assert.equal(unavailable.state.created, 0);
   assert.equal(unavailable.timer.supported, false);
});
