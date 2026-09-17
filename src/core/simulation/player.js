import { Contract } from '../contracts/contract.js';

/* Bounded custom golfer. All coefficients are explicit game-design parameters,
* not official ratings, a named golfer fit, or validated scoring predictions.
* Source grouping: PlayerBuild / PlayerTendencies / PlayerCondition, V02–V20.
*/
      const Player = ((factory) => factory(Contract))(function (C) {
         'use strict';
         const VERSION = 'custom-player/0.2.0', BUDGET = 100, STORAGE_KEY = 'ucg50.custom-player.v1';
         const skills = [
            { id: 'power', name: 'Power', text: 'Long-game speed and carry potential. Accuracy is bought separately.' },
            { id: 'driving', name: 'Driving control', text: 'Start-line and strike consistency with driver and fairway wood.' },
            { id: 'approach', name: 'Approach play', text: 'Iron start line, strike and distance control.' },
            { id: 'wedges', name: 'Wedge play', text: 'Pitching- and sand-wedge distance and trajectory consistency.' },
            { id: 'recovery', name: 'Short game & recovery', text: 'Chip control and reduced execution loss from rough and sand.' },
            { id: 'putting', name: 'Putting', text: 'Start-line and pace consistency. You still read the green.' }
         ];
         const presets = {
            balanced: { power: 18, driving: 18, approach: 22, wedges: 14, recovery: 12, putting: 16 },
            longGame: { power: 28, driving: 22, approach: 25, wedges: 8, recovery: 7, putting: 10 },
            touch: { power: 8, driving: 12, approach: 18, wedges: 20, recovery: 20, putting: 22 }
         };
         const curveOptions = [{ value: -2, label: 'Left → right · pronounced' }, { value: -1, label: 'Left → right · gentle' }, { value: 0, label: 'Straight' }, { value: 1, label: 'Right → left · gentle' }, { value: 2, label: 'Right → left · pronounced' }];
         const flightOptions = [{ value: -1, label: 'Low flight' }, { value: 0, label: 'Mid flight' }, { value: 1, label: 'High flight' }];
         function draft(preset = 'balanced') { if (!presets[preset]) throw Error('Unknown preset'); return { schema: VERSION, name: 'My golfer', points: C.clone(presets[preset]), style: { curve: 0, flight: 0 } }; }
         function validate(d) {
            const errors = []; if (!d || d.schema !== VERSION) return { passed: false, total: 0, remaining: 100, errors: ['Unsupported player format.'] };
            if (typeof d.name !== 'string' || !d.name.trim() || d.name.trim().length > 40) errors.push('Use a golfer name of 1–40 characters.');
            if (!d.points || typeof d.points !== 'object') errors.push('Missing skill allocation.');
            let total = 0; for (const s of skills) { const n = d.points?.[s.id]; if (!Number.isInteger(n) || n < 0 || n > 100) errors.push(s.name + ' must be a whole number from 0 to 100.'); else total += n; }
            if (d.points && Object.keys(d.points).some(k => !skills.some(s => s.id === k))) errors.push('Unknown skill category.');
            if (total !== BUDGET) errors.push(total < BUDGET ? `Allocate ${BUDGET - total} more points.` : `Remove ${total - BUDGET} points to return to 100.`);
            if (!d.style || !Number.isInteger(d.style.curve) || d.style.curve < -2 || d.style.curve > 2 || !Number.isInteger(d.style.flight) || Math.abs(d.style.flight) > 1) errors.push('Invalid stock-shot style.');
            return { passed: errors.length === 0, total, remaining: BUDGET - total, errors };
         }
         // Diminishing returns, 0..1. Zero allocation retains a professional-design floor.
         function investment(n) { if (!Number.isInteger(n) || n < 0 || n > 100) throw Error('Invalid points'); return (1 - Math.exp(-n / 28)) / (1 - Math.exp(-100 / 28)); }
         function build(d) {
            const gate = validate(d); if (!gate.passed) throw Error(gate.errors.join(' ')); const config = C.clone(d); config.name = config.name.trim(); const u = Object.fromEntries(skills.map(s => [s.id, investment(config.points[s.id])]));
            const revision = C.fingerprint(config);
            return {
               id: 'custom-' + revision, revision, schema: VERSION, displayName: config.name, evidenceKind: 'synthetic_design', calibrationStatus: 'PRO_DESIGN_ENVELOPE_NOT_STATISTICALLY_CALIBRATED', configuration: config,
               build: {
                  speedScale: (72 + 12 * u.power) / 73, directionSdDeg: 1.20 - .68 * u.driving, speedSdFraction: .020 - .010 * u.driving, launchSdDeg: 1.0 - .48 * u.approach,
                  skills: u, pointBudget: 100
               },
               tendencies: { shapeBias: config.style.curve * .17, heightBias: config.style.flight * .32, source: 'human_selected_game_style_not_observed_real_golfer' },
               condition: { fatigue: 0, pressure: 0 }, limits: ['synthetic professional-design range, not fitted TOUR scoring', 'no score bonuses or perfect execution', 'unspent capability groups remain at explicit professional-design floor']
            };
         }
         function styleLabel(p) { const d = p.configuration || p; return curveOptions.find(x => x.value === d.style.curve).label + ' · ' + flightOptions.find(x => x.value === d.style.flight).label.toLowerCase(); }
         function strengths(p) { const d = p.configuration || p; return [...skills].sort((a, b) => d.points[b.id] - d.points[a.id]).slice(0, 2).map(s => s.name.toLowerCase()); }
         function validateModel(p) {
            if (!p || p.schema !== VERSION) throw Error('Unsupported player model');
            const expected = build(p.configuration);
            for (const k of ['id', 'revision', 'build', 'tendencies']) if (C.stable(p[k]) !== C.stable(expected[k])) throw Error('Player model does not match authorized allocation: ' + k);
            if (!p.condition || !['fatigue', 'pressure'].every(k => C.finite(p.condition[k]) && p.condition[k] >= 0 && p.condition[k] <= 1)) throw Error('Invalid player condition'); return true;
         }
         function parameters(p, club, lie = 'fairway', intent = { shape: 0, height: 0 }) {
            if (p.schema !== VERSION) throw Error('Unsupported player model'); const u = p.build.skills, k = club.id;
            const family = k === 'PUTT' ? 'putting' : k === 'CHIP' ? 'recovery' : ['PW', 'SW'].includes(k) ? 'wedges' : ['D', '3W'].includes(k) ? 'driving' : 'approach';
            const skill = u[family], flight = k !== 'PUTT' && k !== 'CHIP';
            // Style describes stock launch. Deliberate movement away from stock costs consistency,
            // not automatic aim compensation. No style applies to putting; chips use a neutral low shot.
            const shape = flight ? C.clamp((intent.shape || 0) + p.tendencies.shapeBias, -1, 1) : 0;
            const height = flight ? C.clamp((intent.height || 0) + p.tendencies.heightBias, -1, 1) : 0;
            const burden = flight ? 1 + .18 * Math.abs(intent.shape || 0) + .10 * Math.abs(intent.height || 0) : 1;
            const badLie = ['rough', 'sand'].includes(lie), lieSpread = badLie ? 1 + .65 * (1 - u.recovery) : 1;
            const putt = k === 'PUTT';
            return {
               family, skill, shape, height, burden, lieSpread,
               directionSdDeg: (putt ? .62 - .36 * skill : 1.20 - .68 * skill) * burden * lieSpread,
               speedSdFraction: (putt ? .052 - .025 * skill : k === 'CHIP' ? .052 - .025 * skill : .021 - .011 * skill) * burden * lieSpread,
               launchSdDeg: (1.10 - .64 * skill) * burden * lieSpread,
               // Power does not buy chip/putt pace; wedge distance has a smaller power dependence.
               speedScale: putt || k === 'CHIP' ? 1 : ['PW', 'SW'].includes(k) ? 1 + (p.build.speedScale - 1) * .55 : p.build.speedScale,
               recoveryLaunchFactor: badLie ? 1 + (.05 * u.recovery) : 1
            };
         }
         function toJSON(p) { return { schema: 'ucg50-player-export/1', player: C.clone(p.configuration), note: 'Custom simulation profile; not a real-world golfer measurement.' }; }
         function parse(text) { if (typeof text !== 'string' || text.length > 50000) throw Error('Player file is too large or not text.'); const o = JSON.parse(text), d = o.schema === 'ucg50-player-export/1' ? o.player : o; const check = validate(d); if (!check.passed) throw Error(check.errors.join(' ')); return build(d); }
         return { VERSION, BUDGET, STORAGE_KEY, skills, presets, curveOptions, flightOptions, draft, validate, investment, build, validateModel, styleLabel, strengths, parameters, toJSON, parse };
      });

export { Player };
