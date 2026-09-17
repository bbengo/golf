

/* Wind state is authoritative; presentation is deliberately approximate.
* x=east, y=north, z=up. Direction is TOWARD, clockwise from north.
* The readout does not reveal a current numeric speed. Evidence retains it.
*/
      const Wind = ((factory) => factory())(function () {
         'use strict';
         const MAX_MPH = 40, MPH_TO_MPS = .44704;
         function validate(w) { if (!w || !Number.isFinite(w.speedMph) || w.speedMph < 0 || w.speedMph > MAX_MPH || !Number.isFinite(w.towardDeg)) throw Error('Wind requires 0–40 mph and a finite toward bearing.'); return true; }
         function state(speedMph = 12, towardDeg = 0) { const w = { speedMph, towardDeg }; validate(w); w.towardDeg = ((towardDeg % 360) + 360) % 360; return w; }
         function vector(w) { validate(w); const a = w.towardDeg * Math.PI / 180, s = w.speedMph * MPH_TO_MPS; return { x: s * Math.sin(a), y: s * Math.cos(a), z: 0 }; }
         function presentation(w) { validate(w); const dir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(w.towardDeg / 45) % 8]; const strength = w.speedMph === 0 ? 'Calm' : w.speedMph < 7 ? 'Light' : w.speedMph < 16 ? 'Moderate' : w.speedMph < 28 ? 'Strong' : 'Very strong'; return { fraction: w.speedMph / MAX_MPH, rotation: w.towardDeg, calm: w.speedMph === 0, direction: dir, strength, description: w.speedMph === 0 ? 'Calm. No wind direction.' : `${strength} wind blowing toward ${dir}. Estimate strength from the unmarked bar.` }; }

         const PROGRAM_VERSION = 'wind-program/0.3.0';
         const regimes = { calm: { label: 'Calm', base: 0, swing: 0 }, light: { label: 'Light', base: 4.5, swing: 1.5 }, moderate: { label: 'Moderate', base: 11, swing: 3 }, strong: { label: 'Strong', base: 22.5, swing: 2.5 } };
         function program(regime = 'moderate', towardDeg = 0, seed = 270919) { if (!regimes[regime]) throw Error('Unknown wind regime.'); if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw Error('Invalid wind program seed.'); const w = state(0, towardDeg); return { schema: PROGRAM_VERSION, regime, towardDeg: w.towardDeg, seed, gustPeriodSeconds: 84 + (seed % 19), gustWidthSeconds: 8 }; }
         function validateProgram(p) { if (!p || p.schema !== PROGRAM_VERSION) throw Error('Unsupported wind program.'); const expected = program(p.regime, p.towardDeg, p.seed); if (Object.keys(p).length !== Object.keys(expected).length || Object.keys(expected).some(k => p[k] !== expected[k])) throw Error('Wind program parameters are not canonical.'); return true; }
         function sample(p, seconds) {
            if (!Number.isFinite(seconds) || seconds < 0) throw Error('Wind time must be finite and nonnegative.'); if (!p || p.schema !== PROGRAM_VERSION || !regimes[p.regime]) throw Error('Invalid wind program.');
            const r = regimes[p.regime]; if (p.regime === 'calm') return { ...state(0, p.towardDeg), gust: false, regime: p.regime };
            const phase = (p.seed % 997) / 997 * 2 * Math.PI, base = r.base + r.swing * Math.sin(seconds * 2 * Math.PI / 21 + phase);
            const local = ((seconds + (p.seed % 23)) % p.gustPeriodSeconds), center = p.gustPeriodSeconds * .66;
            const distance = Math.abs(local - center), pulse = p.regime === 'strong' && distance < p.gustWidthSeconds / 2 ? Math.cos(distance * Math.PI / p.gustWidthSeconds) ** 2 : 0;
            const speed = base + (40 - base) * pulse, drift = (p.regime === 'light' ? 7 : p.regime === 'moderate' ? 10 : 14) * Math.sin(seconds * 2 * Math.PI / 47 + phase * .8) + pulse * 5 * Math.sin(seconds * .8);
            return { ...state(Math.min(MAX_MPH, Math.max(0, speed)), p.towardDeg + drift), gust: pulse > .04, regime: p.regime };
         }
         function atDay(day, elapsed = 0) { if (day.windProgram) return sample(day.windProgram, (day.windStartSeconds || 0) + elapsed); return day.windMetadata ? state(day.windMetadata.speedMph, day.windMetadata.towardDeg) : state(0, 0); }
         return { PROGRAM_VERSION, regimes, program, validateProgram, sample, atDay, MAX_MPH, MPH_TO_MPS, validate, state, vector, presentation };
      });

export { Wind };
