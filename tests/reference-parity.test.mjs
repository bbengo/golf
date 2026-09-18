import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { Shot } from '../src/core/simulation/shot.js';
import { Player } from '../src/core/simulation/player.js';
import { Conditions } from '../src/core/course/conditions.js';
import { HoleVisual } from '../src/core/course/hole.js';

// Execute the original physics independently of the extracted ES modules.
// Equality here proves migration parity, not real-world physical accuracy.
const html = fs.readFileSync(new URL('../UCG50_R06_Play.html', import.meta.url), 'utf8');
const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const reference = vm.createContext({ atob, btoa, console });
for (const block of blocks.slice(0, 9)) vm.runInContext(block, reference);
const plain = (value) => JSON.parse(JSON.stringify(value));

test('course data survives module extraction exactly', () => {
   assert.deepEqual(plain(HoleVisual), plain(reference.HoleVisual));
});

const cases = [
   { name: 'driver from tee', club: 'D', start: 'tee', moisture: 'moderate', shape: 0, height: 0 },
   {
      name: 'shaped iron in dry conditions',
      club: '6I',
      start: 'tee',
      moisture: 'dry',
      shape: 0.4,
      height: -0.3,
   },
   {
      name: 'wedge in wet conditions',
      club: 'PW',
      start: 'approach',
      moisture: 'wet',
      shape: -0.25,
      height: 0.5,
   },
   {
      name: 'chip toward green',
      club: 'CHIP',
      start: 'approach',
      moisture: 'moderate',
      shape: 0,
      height: 0,
   },
   {
      name: 'putt on green',
      club: 'PUTT',
      start: 'greenStart',
      moisture: 'moderate',
      shape: 0,
      height: 0,
   },
];
for (const fixture of cases) {
   test(`reference parity: ${fixture.name}`, () => {
      const course = plain(HoleVisual.course);
      const intent = {
         start: plain(fixture.start === 'tee' ? course.tee : course.fixtures[fixture.start]),
         aim: plain(course.pin),
         club: fixture.club,
         effort: 0.9,
         shape: fixture.shape,
         height: fixture.height,
         variance: true,
      };
      const setup = Conditions.setup({ moisture: fixture.moisture });
      const day = Conditions.makeDay(course, setup, 270919, 0);
      const golfer = Player.build(Player.draft());
      const actual = Shot.run(course, day, golfer, intent, 12345);
      const expected = reference.Shot.run(
         plain(course),
         plain(day),
         plain(golfer),
         plain(intent),
         12345,
      );
      assert.deepEqual(plain(actual), plain(expected));
      assert.ok(actual.result.trajectory.length > 1);
   });
}
