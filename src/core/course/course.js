import { Contract } from '../contracts/contract.js';
import { DEM } from './dem.js';

/* Coursecraft canonical course data and LATTICE Course presentation contract.
A diagnostic original hole, not a surveyed real course or an architect emulation. */
      const Course = ((factory) => factory(Contract, DEM))(function (C, DEM) {
         'use strict';
         const VERSION = 'course-contract/0.3.0';
         const G = 9.80665, STIMP_REFERENCE_MPS = 1.8288; // Declared six-ft/s model test input; not an instrument certification.
         function greenRoll(stimpFt) { if (!Number.isFinite(stimpFt) || stimpFt < 5 || stimpFt > 18) throw Error('Green Stimp model range is 5–18 feet.'); return STIMP_REFERENCE_MPS ** 2 / (2 * stimpFt * .3048 * G); }
         const p = (x, y) => ({ x, y });
         const poly = a => a.map(([x, y]) => p(x, y));
         function ellipse(x, y, rx, ry, n = 40) { return Array.from({ length: n }, (_, i) => p(x + rx * Math.cos(i * 2 * Math.PI / n), y + ry * Math.sin(i * 2 * Math.PI / n))); }
         const demo = {
            schema: VERSION, id: 'groundwork-crosswind-bend', revision: '0.3.0', title: 'Crosswind Bend', par: 4,
            provenance: { kind: 'synthetic_design', author: 'Coursecraft development study', date: '2026-09-09', review: 'experimental_not_release_approved', architectAttribution: null },
            units: { length: 'm', time: 's', speed: 'm/s', spin: 'rad/s', angle: 'rad', axes: 'x east along plate, y north, z up; wind is a TO vector' },
            bounds: { minX: 0, minY: 0, maxX: 430, maxY: 175 }, tee: p(23, 40), greenCenter: p(378, 119), pin: p(381, 119),
            route: [p(23, 40), p(241, 60), p(378, 119)],
            baseline: { greenStimpFt: 10.5, fairwayFirmness: 'medium-firm', fairwayRoll: 0.075, fairwayBounce: 0.31, source: 'authored_test_course_defaults_not_surveyed', editableByPlayer: false },
            setupPolicy: { tee: { red: 'shorter — reserved', white: 'middle — reserved', blue: 'longest — reserved' }, pin: { easy: 'accessible — reserved', moderate: 'balanced — reserved', challenging: 'demanding — reserved' }, physicalTeesImplemented: 1, physicalPinsImplemented: 1, pinNeighborhoodRadiusM: 3, pinMaxSlopeDeg: 3, pinSampleSpacingM: .25 },
            terrain: {
               base: 3, xGrade: 0.0015, yGrade: 0.001, greenPatch: { x: 378, y: 119, rx: 24, ry: 17, inner: .84, outer: 1.18, z: 5.40, xGrade: .006, yGrade: .005, tierStartX: 383, tierEndX: 391, tierRise: .14 }, features: [
                  { id: 'natural-shoulder', kind: 'gaussian', x: 170, y: 91, sx: 60, sy: 45, height: 2 },
                  { id: 'lane-fall', kind: 'ramp', x0: 215, x1: 290, y: 52, sy: 10, drop: 3.6 },
                  { id: 'green-platform', kind: 'gaussian', x: 379, y: 119, sx: 31, sy: 24, height: 1.7 },
                  { id: 'green-backstop', kind: 'gaussian', x: 398, y: 119, sx: 9, sy: 21, height: 1.3 }
               ]
            },
            surfaces: [
               { id: 'fairway', type: 'fairway', polygon: poly([[48, 26], [142, 23], [218, 26], [249, 31], [278, 45], [337, 79], [371, 89], [398, 105], [393, 133], [364, 141], [332, 124], [280, 104], [242, 91], [208, 80], [140, 67], [52, 56]]) },
               { id: 'tee', type: 'tee', polygon: poly([[13, 32], [35, 32], [35, 48], [13, 48]]) },
               { id: 'collar', type: 'fringe', polygon: ellipse(378, 119, 28, 21) },
               { id: 'green', type: 'green', polygon: ellipse(378, 119, 24, 17) },
               { id: 'bunker-turn', type: 'sand', polygon: poly([[236, 23], [249, 21], [259, 27], [263, 39], [254, 42], [247, 35], [238, 34]]) },
               { id: 'bunker-green-short', type: 'sand', polygon: poly([[353, 93], [364, 91], [373, 97], [370, 105], [359, 107], [351, 102]]) },
               { id: 'bunker-green-high', type: 'sand', polygon: poly([[387, 137], [397, 131], [406, 133], [408, 144], [397, 149], [389, 144]]) },
               { id: 'pond', type: 'water', polygon: ellipse(323, 46, 30, 20), waterHeight: 2.65 },
               { id: 'path', type: 'path', polygon: poly([[0, 155], [425, 155], [425, 159], [0, 159]]) }
            ],
            zones: [
               { id: 'speed-lane', name: 'Running shoulder', polygon: poly([[211, 42], [275, 42], [292, 54], [279, 65], [215, 64]]), rollFactor: 0.63, bounceFactor: 1.18, moistureDelta: -0.12, note: 'A falling, firmer shoulder can carry a running ball forward. Entry angle and today’s moisture still matter.' },
               { id: 'soft-pocket', name: 'Soft pocket', polygon: ellipse(250, 82, 25, 11), rollFactor: 2.3, bounceFactor: 0.55, moistureDelta: 0.3, note: 'This low, damp pocket absorbs bounce and run. A fairway lie here need not be the best next position.' }
            ],
            objects: [
               { id: 'tree-bend-1', kind: 'tree', x: 289, y: 102, trunkRadius: 0.6, canopyRadius: 8, canopyBase: 4, height: 17 },
               { id: 'tree-bend-2', kind: 'tree', x: 307, y: 113, trunkRadius: 0.5, canopyRadius: 7, canopyBase: 5, height: 16 },
               { id: 'tree-left', kind: 'tree', x: 180, y: 94, trunkRadius: 0.55, canopyRadius: 8, canopyBase: 4, height: 18 },
               { id: 'bridge', kind: 'bridge', minX: 315, maxX: 329, minY: 25, maxY: 67, deckZ: 4.8, thickness: 0.55, description: 'Simplified solid deck; no piers or rails in R0.1.' }
            ],
            architecture: {
               thesis: 'Earn a useful next position through ground response and angle, while preserving a conservative fairway route.',
               evidence: [{ source: 'Fazio_course architecture.md', kind: 'Bill firsthand recollection', principle: 'speed lanes', status: 'recovered_recollection_not_measured' },
               { source: 'Fazio_course architecture.md', kind: 'assistant interpretive synthesis', principle: 'linked consequences; preserve distinct design lenses', status: 'hypothesis_not_architect_certification' }],
               lenses: [{ name: 'ground response', role: 'primary' }, { name: 'next-shot angle', role: 'supporting' }],
               nonGoals: ['not a Fazio, Ross, or MacKenzie signature imitation', 'no quantitative yardage promise', 'not a mapped Sawgrass reproduction']
            },
            plate: { kind: 'diagnostic_cartographic', resolution: { width: 2580, height: 1050 }, worldToPixel: [6, 0, 0, -6, 0, 1050], status: 'registered_geometry_only_not_final_art' },
            fixtures: { laneLanding: { x: 226, y: 52 }, softLanding: { x: 240, y: 82 }, greenStart: { x: 371, y: 117 } }
         };
         const materials = {
            'deep-rough': { roll: 0.27, bounce: 0.07, tangent: 0.15, launch: 0.68 },
            rough: { roll: 0.17, bounce: 0.13, tangent: 0.2, launch: 0.83 },
            fairway: { roll: 0.075, bounce: 0.31, tangent: 0.45, launch: 0.985 },
            tee: { roll: 0.07, bounce: 0.27, tangent: 0.45, launch: 1 },
            fringe: { roll: 0.078, bounce: 0.27, tangent: 0.4, launch: 0.98 },
            green: { roll: greenRoll(10.5), bounce: 0.32, tangent: 0.36, launch: 1 },
            sand: { roll: 0.42, bounce: 0.045, tangent: 0.15, launch: 0.65 },
            path: { roll: 0.014, bounce: 0.68, tangent: 0.86, launch: 0.9 },
            water: { roll: 1, bounce: 0, tangent: 0, launch: 0 }
         };
         const days = {
            normal: { id: 'normal', name: 'Moderate', greenStimpFt: 10.5, moisture: 0.32, rollFactor: 1, bounceFactor: 1, wind: { x: 0, y: 0, z: 0 }, airDensity: 1.225 },
            firm: { id: 'firm', name: 'Dry', greenStimpFt: 11.5, moisture: 0.12, rollFactor: 0.74, bounceFactor: 1.14, wind: { x: 0, y: 0, z: 0 }, airDensity: 1.225 },
            soft: { id: 'soft', name: 'Wet', greenStimpFt: 9, moisture: 0.75, rollFactor: 1.85, bounceFactor: 0.65, wind: { x: 0, y: 0, z: 0 }, airDensity: 1.225 }
         };
         function surfaceAt(course, q) { for (let i = course.surfaces.length - 1; i >= 0; i--)if (C.inside(q, course.surfaces[i].polygon)) return course.surfaces[i]; return { id: 'rough', type: 'rough' }; }
         function inBounds(course, q) { const b = course.bounds; return q.x >= b.minX && q.x <= b.maxX && q.y >= b.minY && q.y <= b.maxY; }
         function smooth(t) { t = C.clamp(t, 0, 1); return t * t * (3 - 2 * t); }
         function heightAt(course, q) {
            const t = course.terrain; if (t.kind === 'government-dem-grid') return DEM.heightAt(t, q); let z = t.base + t.xGrade * q.x + t.yGrade * q.y;
            for (const f of t.features) {
               if (f.kind === 'gaussian') z += f.height * Math.exp(-0.5 * (((q.x - f.x) / f.sx) ** 2 + ((q.y - f.y) / f.sy) ** 2));
               else if (f.kind === 'ramp') z -= f.drop * smooth((q.x - f.x0) / (f.x1 - f.x0)) * Math.exp(-0.5 * ((q.y - f.y) / f.sy) ** 2);
            }
            const g = t.greenPatch;
            if (g) {
               const r = Math.hypot((q.x - g.x) / g.rx, (q.y - g.y) / g.ry), w = 1 - smooth((r - g.inner) / (g.outer - g.inner));
               const putting = g.z + g.xGrade * (q.x - g.x) + g.yGrade * (q.y - g.y) + g.tierRise * smooth((q.x - g.tierStartX) / (g.tierEndX - g.tierStartX));
               z = z * (1 - w) + putting * w;
            }
            return z;
         }
         function slopeAt(course, q) { const e = 0.05; return { x: (heightAt(course, { x: q.x + e, y: q.y }) - heightAt(course, { x: q.x - e, y: q.y })) / (2 * e), y: (heightAt(course, { x: q.x, y: q.y + e }) - heightAt(course, { x: q.x, y: q.y - e })) / (2 * e) }; }
         function groundAt(course, q, day) {
            const s = surfaceAt(course, q); const m = { ...materials[s.type] }; if (s.type === 'fairway' && course.baseline) { m.roll = course.baseline.fairwayRoll; m.bounce = course.baseline.fairwayBounce; } let zone = null; for (const z of course.zones) if (C.inside(q, z.polygon)) { m.roll *= z.rollFactor; m.bounce *= z.bounceFactor; zone = z; }
            if (s.type === 'green') m.roll = greenRoll(day.greenStimpFt ?? course.baseline?.greenStimpFt ?? 10.5);
            else m.roll *= day.rollFactor;
            m.bounce = C.clamp(m.bounce * day.bounceFactor, 0, 0.85);
            return { ...m, type: s.type, id: s.id, zone: zone?.id || null, height: heightAt(course, q), slope: slopeAt(course, q) };
         }
         function routeProgress(course, q) { let offset = 0, best = { distance: Infinity, s: 0, index: 0 }; for (let i = 0; i < course.route.length - 1; i++) { const a = course.route[i], b = course.route[i + 1], l = C.hypot(a, b), r = C.project(q, a, b); if (r.distance < best.distance) { best = { ...r, s: offset + l * r.t, index: i }; } offset += l; } return best; }
         function yardageBookAim(course, ball) {
            // Route geometry ONLY: never wind, risk, modeled carry, golfer dispersion or optimal strategy.
            const r = routeProgress(course, ball); let offset = 0;
            for (let i = 1; i < course.route.length; i++) { offset += C.hypot(course.route[i - 1], course.route[i]); if (offset > r.s + 12) return { point: C.clone(course.route[i]), routeIndex: i, basis: 'next yardage-book waypoint; not an optimized shot' }; }
            return { point: C.clone(course.greenCenter), routeIndex: course.route.length - 1, basis: 'green center; not an optimized shot' };
         }
         function defaultAim(course, ball) {
            // Bill's R0.4.3 direction: every new shot starts at the selected cup center.
            // This is a reference, not wind, break, elevation or club-reach compensation.
            if (!course.pin || ![course.pin.x, course.pin.y].every(Number.isFinite)) throw Error('Invalid selected cup');
            return { point: C.clone(course.pin), basis: 'selected cup center; uncompensated; user may change target' };
         }
         function inspectLine(course, a, b) {
            const touched = new Set(); for (let i = 0; i <= 100; i++) { const q = { x: a.x + (b.x - a.x) * i / 100, y: a.y + (b.y - a.y) * i / 100 }; if (surfaceAt(course, q).type === 'water') touched.add('water'); }
            for (const o of course.objects) { if (o.kind === 'tree' && C.project(o, a, b).distance < o.canopyRadius) touched.add('tree'); }
            return [...touched];
         }
         function slopeDegrees(course, p) { const s = slopeAt(course, p); return Math.atan(Math.hypot(s.x, s.y)) * 180 / Math.PI; }
         function pinAreaReport(course) {
            const p = course.pin, r = course.setupPolicy?.pinNeighborhoodRadiusM ?? 3, spacing = course.setupPolicy?.pinSampleSpacingM ?? .25, maxAllowed = course.setupPolicy?.pinMaxSlopeDeg ?? 3;
            let maxSlopeDeg = 0, count = 0, inside = true, worst = null; const points = [];
            for (let dx = -r; dx <= r + .0001; dx += spacing)for (let dy = -r; dy <= r + .0001; dy += spacing)if (dx * dx + dy * dy <= r * r + .0001) points.push({ x: p.x + dx, y: p.y + dy });
            for (let i = 0; i < 96; i++) { const a = i * Math.PI / 48; points.push({ x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) }); }
            for (const q of points) { const deg = slopeDegrees(course, q); count++; inside = inside && surfaceAt(course, q).type === 'green'; if (deg > maxSlopeDeg) { maxSlopeDeg = deg; worst = q; } }
            return { passed: inside && maxSlopeDeg <= maxAllowed, allSamplesOnGreen: inside, maxSlopeDeg, limitDegrees: maxAllowed, radiusM: r, spacingM: spacing, samples: count, worst, method: 'dense disk and perimeter sampling; not a continuous mathematical proof' };
         }
         function validate(course) {
            const errors = []; const num = (v, k) => { if (!C.finite(v)) errors.push(k + ':not_finite'); };
            if (![VERSION, 'course-contract/0.4.0'].includes(course.schema)) errors.push('schema_version'); if (course.units?.length !== 'm' || course.units?.speed !== 'm/s') errors.push('units');
            if (!course.bounds || course.bounds.maxX <= course.bounds.minX || course.bounds.maxY <= course.bounds.minY) errors.push('bounds');
            if (!Array.isArray(course.route) || course.route.length < 2) errors.push('route');
            else for (let i = 0; i < course.route.length; i++) { const p = course.route[i]; num(p.x, 'route.x'); num(p.y, 'route.y'); if (!inBounds(course, p)) errors.push('waypoint_outside'); if (i && C.hypot(p, course.route[i - 1]) < 1) errors.push('degenerate_route'); }
            const ids = new Set(); for (const s of course.surfaces || []) { if (ids.has(s.id)) errors.push('duplicate_id:' + s.id); ids.add(s.id); if (!materials[s.type]) errors.push('unknown_surface'); if (!s.polygon || s.polygon.length < 3) errors.push('invalid_polygon'); else for (const p of s.polygon) { num(p.x, 'surface.x'); num(p.y, 'surface.y'); } }
            for (const z of course.zones || []) { if (z.bonusYards !== undefined || z.distanceBonus !== undefined) errors.push('scripted_distance_bonus_forbidden'); if (!(z.rollFactor > 0) || !(z.bounceFactor >= 0 && z.bounceFactor <= 2)) errors.push('zone_coefficients'); }
            if (surfaceAt(course, course.pin).type !== 'green') errors.push('pin_not_on_green');
            const t = course.terrain; if (!t) errors.push('terrain'); else { for (const k of ['base', 'xGrade', 'yGrade']) num(t[k], k); for (const f of t.features || []) { if (f.kind === 'gaussian' && !(f.sx > 0 && f.sy > 0)) errors.push('gaussian_scale'); else if (f.kind === 'ramp' && !(f.x1 > f.x0 && f.sy > 0)) errors.push('ramp_scale'); else if (!['gaussian', 'ramp'].includes(f.kind)) errors.push('unknown_terrain_feature'); } }
            for (const o of course.objects || []) { if (o.kind === 'tree' && !(o.height > o.canopyBase && o.canopyBase >= 0 && o.trunkRadius > 0 && o.canopyRadius > o.trunkRadius)) errors.push('tree_dimensions'); if (o.kind === 'bridge' && !(o.maxX > o.minX && o.maxY > o.minY && o.thickness > 0)) errors.push('bridge_dimensions'); }
            if (course.terrain?.greenPatch) { const g = course.terrain.greenPatch; if (![g.x, g.y, g.rx, g.ry, g.z, g.xGrade, g.yGrade, g.tierRise, g.inner, g.outer, g.tierStartX, g.tierEndX].every(Number.isFinite) || !(g.rx > 0 && g.ry > 0 && g.outer > g.inner && g.tierEndX > g.tierStartX)) errors.push('green_patch'); }
            if (course.baseline) { const b = course.baseline; if (!(b.greenStimpFt >= 5 && b.greenStimpFt <= 18 && b.fairwayRoll > 0 && b.fairwayRoll < 1 && b.fairwayBounce >= 0 && b.fairwayBounce <= .85)) errors.push('course_baseline'); }
            if (course.setupPolicy) { const p = course.setupPolicy; if (!(p.pinNeighborhoodRadiusM >= 3 && p.pinNeighborhoodRadiusM <= 10 && p.pinSampleSpacingM > 0 && p.pinSampleSpacingM <= .5 && p.pinMaxSlopeDeg > 0 && p.pinMaxSlopeDeg <= 3)) errors.push('pin_policy'); }
            if (course.terrain?.kind === 'government-dem-grid') { const d = DEM.validate(course.terrain); errors.push(...d.errors); }
            if (!errors.length && course.setupPolicy) { const area = pinAreaReport(course); if (!area.passed) errors.push('pin_neighborhood_exceeds_3_degrees_or_leaves_green'); }
            return { passed: errors.length === 0, errors };
         }
         function physicsSnapshot(course) { const { plate, architecture, title, ...truth } = course; return C.clone(truth); }
         function plateContract(course) {
            const landmarks = [{ id: 'tee', world: course.tee }, { id: 'turn', world: course.route[1] }, { id: 'green', world: course.greenCenter }].map(v => ({ ...v, pixel: C.affinePoint(v.world, course.plate.worldToPixel) }));
            return {
               schema: 'lattice-course-plate/0.1.0', courseId: course.id, geometryFingerprint: C.fingerprint(physicsSnapshot(course)), registration: C.clone(course.plate), landmarks,
               requiredCriteria: ['surface_boundary_alignment', 'object_alignment', 'no_false_playable_surfaces', 'no_text_or_golfer_avatar'],
               artworkStatus: course.plate.kind === 'registered-art-prototype' ? 'registered_prototype_requires_human_review' : 'not_generated', physicalTruthSource: 'course-contract; never image colors', modelSelection: 'provider adapter; no image API invoked'
            };
         }
         function selectSetup(course, setup) {
            if (!course.tees || !course.pins) return course;
            if (!course.tees[setup.tee] || !course.pins[setup.pin]) throw Error('Unknown physical tee or pin');
            return {
               ...course, tee: C.clone(course.tees[setup.tee].point), pin: C.clone(course.pins[setup.pin].point),
               selectedTee: setup.tee, selectedPin: setup.pin, route: [C.clone(course.tees[setup.tee].point), ...course.route.slice(1).map(p => C.clone(p))]
            };
         }
         function holeLength(course) { return course.route.slice(1).reduce((v, p, i) => v + C.hypot(course.route[i], p), 0); }
         return { selectSetup, holeLength, VERSION, G, STIMP_REFERENCE_MPS, greenRoll, slopeDegrees, pinAreaReport, demo, materials, days, ellipse, surfaceAt, inBounds, heightAt, slopeAt, groundAt, routeProgress, yardageBookAim, defaultAim, inspectLine, validate, physicsSnapshot, plateContract };
      });

export { Course };
