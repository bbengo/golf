

/* Generic, provider-independent contract primitives. No golf or brand defaults. */
      const Contract = ((factory) => factory())(function () {
         'use strict';
         const clone = v => JSON.parse(JSON.stringify(v));
         function stable(v) {
            if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
            if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
            return JSON.stringify(v);
         }
         // Lightweight change fingerprint, NOT a cryptographic signature. Archive manifests use SHA-256.
         function fingerprint(v) { const s = stable(v); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
         const finite = v => typeof v === 'number' && Number.isFinite(v);
         const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
         const hypot = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
         function inside(p, poly) {
            let c = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
               const a = poly[i], b = poly[j], cross = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
               if (Math.abs(cross) < 1e-8 && p.x >= Math.min(a.x, b.x) - 1e-8 && p.x <= Math.max(a.x, b.x) + 1e-8 && p.y >= Math.min(a.y, b.y) - 1e-8 && p.y <= Math.max(a.y, b.y) + 1e-8) return true;
               if (((a.y > p.y) !== (b.y > p.y)) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c;
            }
            return c;
         }
         function project(p, a, b) {
            const dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
            const t = d ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / d, 0, 1) : 0;
            const q = { x: a.x + t * dx, y: a.y + t * dy }; return { ...q, t, distance: hypot(p, q) };
         }
         function rng(seed) {
            let a = seed >>> 0;
            function uniform() { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
            return { uniform, normal() { return Math.sqrt(-2 * Math.log(Math.max(uniform(), 1e-12))) * Math.cos(2 * Math.PI * uniform()); } };
         }
         function requiredCriteria(report, names, threshold = 0.8) {
            const errors = [];
            if (!report || !finite(report.score) || report.score < 0 || report.score > 1 || report.score < threshold) errors.push('invalid_or_insufficient_score');
            for (const name of names) if (report?.criteria?.[name]?.pass !== true) errors.push('missing_or_failed:' + name);
            return { passed: errors.length === 0, errors };
         }
         function affinePoint(p, m) { return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] }; }
         function inverseAffine(m) { const d = m[0] * m[3] - m[1] * m[2]; if (!finite(d) || Math.abs(d) < 1e-12) throw Error('Singular registration'); return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; }
         function validateRegistration(reg, landmarks, tolerance = 0.25) {
            const errors = [];
            if (!reg || !Array.isArray(reg.worldToPixel) || reg.worldToPixel.length !== 6 || !reg.worldToPixel.every(finite)) return { passed: false, errors: ['invalid_affine'] };
            try { inverseAffine(reg.worldToPixel); } catch (e) { errors.push('singular_affine'); }
            if (!Array.isArray(landmarks) || landmarks.length < 3) errors.push('need_three_landmarks');
            else {
               let area = false;
               for (let i = 2; i < landmarks.length; i++) {
                  const a = landmarks[0].world, b = landmarks[1].world, c = landmarks[i].world;
                  if (Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) > 1e-6) area = true;
               }
               if (!area) errors.push('collinear_landmarks');
               for (const l of landmarks) { if (!l.world || !l.pixel || ![l.world.x, l.world.y, l.pixel.x, l.pixel.y].every(finite)) { errors.push('invalid_landmark'); continue; } const q = affinePoint(l.world, reg.worldToPixel); if (hypot(q, l.pixel) > tolerance) errors.push('landmark_drift:' + l.id); }
            }
            return { passed: errors.length === 0, errors };
         }
         function animationElapsed(now, start, presentationSeconds, recordSeconds) {
            if (![now, start, presentationSeconds, recordSeconds].every(finite) || presentationSeconds <= 0 || recordSeconds < 0) throw Error('Invalid playback clock.');
            return clamp((now - start) / 1000 / presentationSeconds, 0, 1) * recordSeconds;
         }
         return { animationElapsed, clone, stable, fingerprint, finite, clamp, hypot, inside, project, rng, requiredCriteria, affinePoint, inverseAffine, validateRegistration };
      });

export { Contract };
