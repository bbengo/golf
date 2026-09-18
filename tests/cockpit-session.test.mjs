import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CockpitSession } from '../src/core/session/cockpit-session.ts';
import { validCommand, validSetup } from '../src/core/contracts/cockpit.ts';
import { Shot } from '../src/core/simulation/shot.js';

test('protocol rejects non-finite inputs, invalid clubs and unsupported commands', () => {
   const command = {
      type: 'COMMAND',
      id: 'a',
      action: 'INTENT',
      intent: { club: '6I', effort: 0.9, shape: 0, height: 0 },
   };
   assert.ok(validCommand(command));
   assert.equal(validCommand({ ...command, intent: { ...command.intent, effort: NaN } }), false);
   assert.equal(validCommand({ ...command, intent: { ...command.intent, club: 'LASER' } }), false);
   assert.equal(validCommand({ ...command, action: 'EXEC' }), false);
   const setup = { tee: 'white', pin: 'moderate', wind: 'calm', moisture: 'dry', towardDeg: 0 };
   assert.ok(validSetup(setup));
   assert.equal(validSetup({ ...setup, tee: ['white'] }), false);
   assert.equal(validSetup({ ...setup, schema: 'unexpected' }), false);
});
test('one committed shot survives duplicate commands and can be replayed', () => {
   const s = new CockpitSession();
   const play = { type: 'COMMAND', id: 'shot-1', action: 'PLAY', shot: 1, intent: s.intent };
   assert.equal(s.apply(play).ok, true);
   assert.equal(s.phase, 'animating');
   assert.equal(s.apply(play).ok, true);
   assert.equal(s.records.length, 1);
   assert.equal(s.apply({ ...play, id: 'shot-2' }).ok, false);
   assert.equal(s.last.version, 'purity-rigid-sphere/0.1.0');
   assert.deepEqual(Shot.replay(s.last), s.last.result);
   s.finish();
   assert.equal(s.phase, 'resolved');
   assert.equal(s.apply({ type: 'COMMAND', id: 'undo', action: 'MULLIGAN' }).ok, true);
   assert.equal(s.shot, 1);
   assert.equal(s.phase, 'plan');
   assert.equal(s.records.length, 1);
   assert.equal(s.apply({ type: 'COMMAND', id: 'undo2', action: 'MULLIGAN' }).ok, false);
});
test('inspection is independent of aiming and setup restarts the round', () => {
   const s = new CockpitSession(),
      aim = { ...s.aim };
   s.apply({ type: 'COMMAND', id: 'move', action: 'MOVE', target: 'probe', dx: 2, dy: 3 });
   assert.deepEqual(s.aim, aim);
   assert.notDeepEqual(s.probe, aim);
   assert.equal(
      s.apply({
         type: 'COMMAND',
         id: 'setup',
         action: 'SETUP',
         setup: { ...s.setup, tee: 'red', moisture: 'wet' },
      }).ok,
      true,
   );
   assert.equal(s.setup.moisture, 'wet');
   assert.equal(s.course.selectedTee, 'red');
   assert.equal(s.snapshot().type, 'STATE');
});
