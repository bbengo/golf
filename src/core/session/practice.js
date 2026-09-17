import { Contract } from '../contracts/contract.js';

/* Explicit practice actions; physical ShotRecords are never deleted or rewritten.
* The counters below are practice accounting, not competitive golf scoring.
* Undo policy is deliberately one most-recent shot, once, within one context.
*/
      const Practice = ((factory) => factory(Contract))(function (C) {
         'use strict';
         const VERSION = 'practice-actions/0.4.3';
         function begin(previous = null, reason = 'new practice hole') {
            const p = previous || { schema: VERSION, contextId: 0, shots: [], actions: [] };
            if (p.schema !== VERSION) throw Error('Practice ledger version mismatch');
            const contextId = p.contextId + 1;
            return { ...p, contextId, actions: [...p.actions, { type: 'context-start', contextId, reason, sequence: p.actions.length + 1 }] };
         }
         function appendShot(p, index, record) {
            if (p.schema !== VERSION || !Number.isInteger(index) || index < 0 || !record?.intent?.start || !record.result) throw Error('Invalid practice shot');
            if (p.shots.some(x => x.index === index)) throw Error('Shot already recorded');
            const ref = { index, contextId: p.contextId, fingerprint: C.fingerprint(record) };
            return { ...p, shots: [...p.shots, ref], actions: [...p.actions, { type: 'played-shot', ...ref, sequence: p.actions.length + 1 }] };
         }
         function discarded(p) { return new Set(p.actions.filter(x => x.type === 'mulligan').map(x => x.index)); }
         function summary(p) { const rows = p.shots.filter(x => x.contextId === p.contextId), gone = discarded(p); return { contextId: p.contextId, attempts: rows.length, counted: rows.filter(x => !gone.has(x.index)).length, mulligans: rows.filter(x => gone.has(x.index)).length }; }
         function candidate(p, phase) {
            if (!['plan', 'resolved'].includes(phase)) return null;
            const ref = p.shots.at(-1);
            if (!ref || ref.contextId !== p.contextId || discarded(p).has(ref.index)) return null;
            return C.clone(ref);
         }
         function mulligan(p, phase, record, expectedIndex) {
            const ref = candidate(p, phase);
            if (!ref || ref.index !== expectedIndex || ref.fingerprint !== C.fingerprint(record)) throw Error('No eligible most-recent shot in this practice context');
            const action = { type: 'mulligan', contextId: p.contextId, index: ref.index, fingerprint: ref.fingerprint, restoredStart: C.clone(record.intent.start), countedStrokeChange: -1, originalSeed: record.seed, retryPolicy: 'fresh seed and live weather on next commit', sequence: p.actions.length + 1 };
            return { ...p, actions: [...p.actions, action] };
         }
         return { VERSION, begin, appendShot, discarded, summary, candidate, mulligan };
      });

      /* Gimme is a practice action, never an invented physical putt or deleted record.
         First-pass policy: on a settled green lie, concede one counted practice stroke,
         with no distance cap. Retain the true lie and every ShotRecord. */
      const PracticeVisual = ((factory) => factory(Practice, Contract))(function (P, C) {
         'use strict';
         function closed(p) { return p.actions.some(a => a.contextId === p.contextId && a.type === 'gimme'); }
         function summary(p) { const s = P.summary(p), g = p.actions.filter(a => a.contextId === p.contextId && a.type === 'gimme').length; return { ...s, counted: s.counted + g, concessions: g, closed: g > 0 }; }
         function candidate(p, phase) { return closed(p) ? null : P.candidate(p, phase); }
         function canConcede(p, { phase, surface, status }) { return !closed(p) && ['plan', 'resolved'].includes(phase) && surface === 'green' && status !== 'holed'; }
         function concede(p, context) { if (!canConcede(p, context)) throw Error('Gimme requires a settled green lie in an open practice context'); const { lie, pin, courseFingerprint } = context; if (!lie || !pin || ![lie.x, lie.y, pin.x, pin.y].every(Number.isFinite) || typeof courseFingerprint !== 'string') throw Error('Invalid concession evidence'); return { ...p, actions: [...p.actions, { type: 'gimme', contextId: p.contextId, sequence: p.actions.length + 1, countedStrokeChange: 1, lie: C.clone(lie), pin: C.clone(pin), courseFingerprint, policy: 'concede one practice stroke; no distance cap; ball is not physically holed' }] }; }
         function appendShot(p, index, record) { if (closed(p)) throw Error('Conceded practice context is closed'); return P.appendShot(p, index, record); }
         function mulligan(p, phase, record, index) { if (closed(p)) throw Error('Conceded practice context is closed'); return P.mulligan(p, phase, record, index); }
         return { ...P, closed, summary, candidate, canConcede, concede, appendShot, mulligan };
      });

export { Practice, PracticeVisual };
