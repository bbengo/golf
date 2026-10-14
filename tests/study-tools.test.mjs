import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CockpitSession } from '../src/core/session/cockpit-session.ts';
import { Player } from '../src/core/simulation/player.js';
import { Course } from '../src/core/course/course.js';

test('replay reuses evidence and never counts a new stroke or changes the player record', () => {
   const s = new CockpitSession();
   s.configurePlayer(Player.build(Player.draft('touch')), false);
   assert.equal(
      s.apply({ type: 'COMMAND', id: 'play-test', action: 'PLAY', shot: s.shot, intent: s.intent })
         .ok,
      true,
   );
   s.finish();
   const record = JSON.stringify(s.last),
      shot = s.shot,
      count = s.records.length;
   assert.equal(s.last.intent.variance, false);
   assert.equal(s.last.golfer.configuration.points.power, 8);
   assert.equal(s.apply({ type: 'COMMAND', id: 'replay-test', action: 'REPLAY' }).ok, true);
   assert.equal(s.phase, 'animating');
   s.finish();
   assert.equal(s.shot, shot);
   assert.equal(s.records.length, count);
   assert.equal(JSON.stringify(s.last), record);
});
test('player configuration rejects invalid allocation and study starts are finite', () => {
   const s = new CockpitSession();
   const player = Player.build(Player.draft());
   player.configuration.points.power = 101;
   assert.throws(() => s.configurePlayer(player, true));
   for (const kind of ['tee', 'approach', 'frontApproach', 'putt']) {
      s.study(kind);
      assert.ok(Number.isFinite(Course.heightAt(s.course, s.ball)));
      assert.equal(s.records.length, 0);
   }
   assert.equal(Course.surfaceAt(s.course, s.ball).type, 'green');
});

test('concession retains the physical lie and evidence and closes practice exactly once', () => {
   const s = new CockpitSession();
   assert.equal(s.canConcede(), false);
   assert.equal(s.apply({ type: 'COMMAND', id: 'bad-gimme', action: 'CONCEDE' }).ok, false);
   s.study('putt');
   const ball = structuredClone(s.ball);
   assert.equal(s.canConcede(), true);
   assert.equal(s.apply({ type: 'COMMAND', id: 'gimme', action: 'CONCEDE' }).ok, true);
   assert.deepEqual(s.ball, ball);
   assert.equal(s.last, null);
   assert.equal(s.records.length, 0);
   assert.equal(s.snapshot().result.status, 'conceded');
   assert.equal(s.apply({ type: 'COMMAND', id: 'gimme-again', action: 'CONCEDE' }).ok, false);
   assert.equal(s.apply({ type: 'COMMAND', id: 'next-after-gimme', action: 'NEXT' }).ok, false);
   assert.equal(s.practice.actions.filter((a) => a.type === 'gimme').length, 1);
   s.reset();
   assert.equal(s.phase, 'plan');
   assert.equal(s.snapshot().result, null);
});

test('mulligan accounting retains attempts and source ground survives practice resets', () => {
   const s = new CockpitSession();
   s.chooseGround(false);
   s.study('putt');
   assert.equal(s.course.terrain.authoredLayer.enabled, false);
   assert.equal(
      s.apply({ type: 'COMMAND', id: 'putt', action: 'PLAY', shot: 1, intent: s.intent }).ok,
      true,
   );
   s.finish();
   const record = JSON.stringify(s.last);
   assert.equal(s.apply({ type: 'COMMAND', id: 'undo', action: 'MULLIGAN' }).ok, true);
   assert.equal(s.records.length, 1);
   assert.equal(JSON.stringify(s.last), record);
   assert.equal(s.practice.actions.filter((a) => a.type === 'mulligan').length, 1);
   assert.equal(s.apply({ type: 'COMMAND', id: 'undo-twice', action: 'MULLIGAN' }).ok, false);
});
