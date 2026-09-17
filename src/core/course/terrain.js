import { Contract } from '../contracts/contract.js';
import { Course } from './course.js';

/* Numeric terrain inspection, sampled from the exact same height function as play.
Display exaggeration is not a change to elevations or simulation state. */
      const Terrain = ((factory) => factory(Contract, Course))(function (C, Q) {
         'use strict';
         function point(course, p) { const s = Q.slopeAt(course, p), grade = Math.hypot(s.x, s.y), heading = ((Math.atan2(-s.x, -s.y) * 180 / Math.PI) % 360 + 360) % 360; return { x: p.x, y: p.y, z: Q.heightAt(course, p), slope: s, slopeDeg: Math.atan(grade) * 180 / Math.PI, gradePercent: grade * 100, downhillTowardDeg: heading, downhillLabel: grade < 1e-5 ? 'Level' : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(heading / 45) % 8], surface: Q.surfaceAt(course, p).type }; }
         function clippedBounds(course, center, radius) { if (!Number.isFinite(radius) || radius < 1) throw Error('Terrain radius must be positive.'); const b = course.bounds; return { minX: Math.max(b.minX, center.x - radius), maxX: Math.min(b.maxX, center.x + radius), minY: Math.max(b.minY, center.y - radius), maxY: Math.min(b.maxY, center.y + radius) }; }
         function mesh(course, center, radius = 28, divisions = 26) { if (!Number.isInteger(divisions) || divisions < 4 || divisions > 100) throw Error('Invalid terrain sampling size.'); const b = clippedBounds(course, center, radius), rows = []; for (let j = 0; j <= divisions; j++) { const row = []; for (let i = 0; i <= divisions; i++)row.push(point(course, { x: b.minX + (b.maxX - b.minX) * i / divisions, y: b.minY + (b.maxY - b.minY) * j / divisions })); rows.push(row); } return { bounds: b, rows, divisions }; }
         function contours(course, bounds, spacing = 2, interval = .3048) {
            if (!(spacing > 0 && interval > 0)) throw Error('Positive contour spacing required.'); const segments = [], cells = [];
            for (let x = bounds.minX; x < bounds.maxX - 1e-9; x += spacing)for (let y = bounds.minY; y < bounds.maxY - 1e-9; y += spacing) {
               const ps = [{ x, y }, { x: Math.min(x + spacing, bounds.maxX), y }, { x: Math.min(x + spacing, bounds.maxX), y: Math.min(y + spacing, bounds.maxY) }, { x, y: Math.min(y + spacing, bounds.maxY) }], zs = ps.map(p => Q.heightAt(course, p)), center = { x: (ps[0].x + ps[2].x) / 2, y: (ps[0].y + ps[2].y) / 2 }; cells.push({ polygon: ps, sample: point(course, center) });
               for (let k = Math.ceil(Math.min(...zs) / interval); k <= Math.floor(Math.max(...zs) / interval); k++) { const level = k * interval, cross = []; for (let e = 0; e < 4; e++) { const j = (e + 1) % 4; if ((zs[e] < level) !== (zs[j] < level)) { const t = (level - zs[e]) / (zs[j] - zs[e]); cross.push({ x: ps[e].x + t * (ps[j].x - ps[e].x), y: ps[e].y + t * (ps[j].y - ps[e].y) }); } } for (let i = 0; i + 1 < cross.length; i += 2)segments.push({ a: cross[i], b: cross[i + 1], level, index: k }); }
            } return { segments, cells, interval, spacing };
         }
         function project(p, center, options = {}) { const { yawDeg = 35, exaggeration = 3, scale = 1, width = 600, height = 250 } = options; if (![yawDeg, exaggeration, scale, width, height].every(Number.isFinite) || exaggeration <= 0 || scale <= 0) throw Error('Invalid terrain view transform.'); const a = yawDeg * Math.PI / 180, dx = p.x - center.x, dy = p.y - center.y, rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a); return { x: width / 2 + rx * scale, y: height * .54 + ry * scale * .43 - (p.z - center.z) * scale * exaggeration, depth: ry }; }
         return { point, clippedBounds, mesh, contours, project };
      });

export { Terrain };
