
/* LATTICE reusable sampled-surface adapter. It knows no golfer or golf rules.
Base64 is explicitly little-endian Int16; all returned elevations are metres.
Source rasters and reconstruction parameters remain in the course contract. */
      const DEM = ((factory) => factory())(function () {
         'use strict';
         const VERSION = 'dem-surface/0.4.0', cache = new WeakMap();
         function decode(g) {
            if (cache.has(g)) return cache.get(g);
            if (!g || g.encoding !== 'int16-le-base64' || !Number.isInteger(g.width) || !Number.isInteger(g.height) || g.width < 4 || g.height < 4 || !Number.isFinite(g.step) || !(g.step > 0) || !Number.isFinite(g.offsetM) || !Number.isFinite(g.quantumM) || !(g.quantumM > 0) || ![g.originX, g.originY].every(Number.isFinite)) throw Error('Invalid sampled terrain grid');
            if (g.width * g.height > 20000000 || typeof g.data !== 'string' || !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(g.data)) throw Error('Invalid terrain encoding or excessive grid size');
            const raw = typeof Buffer !== 'undefined' ? Buffer.from(g.data, 'base64') : Uint8Array.from(atob(g.data), c => c.charCodeAt(0));
            if (raw.length !== g.width * g.height * 2) throw Error('Terrain grid byte count mismatch');
            const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength), a = new Int16Array(g.width * g.height);
            for (let i = 0; i < a.length; i++)a[i] = dv.getInt16(i * 2, true);
            cache.set(g, a); return a;
         }
         function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
         function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
         function cubic(a, b, c, d, t) { return b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a))); }
         function gridHeight(g, p) {
            const a = decode(g), x = clamp((p.x - g.originX) / g.step, 0, g.width - 1), y = clamp((p.y - g.originY) / g.step, 0, g.height - 1), ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
            const cell = (i, j) => a[clamp(j, 0, g.height - 1) * g.width + clamp(i, 0, g.width - 1)], row = j => cubic(cell(ix - 1, j), cell(ix, j), cell(ix + 1, j), cell(ix + 2, j), fx);
            return g.offsetM + g.quantumM * cubic(row(iy - 1), row(iy), row(iy + 1), row(iy + 2), fy);
         }
         function sourceHeight(t, p) {
            let z = gridHeight(t.grid, p);
            for (const patch of t.patches || []) {
               const g = patch.grid, d = Math.min(p.x - g.originX, p.y - g.originY, g.originX + (g.width - 1) * g.step - p.x, g.originY + (g.height - 1) * g.step - p.y);
               if (d > 0) { const w = smooth(d / (patch.blendM || 1)); z = z * (1 - w) + gridHeight(g, p) * w; }
            }
            return z;
         }
         function authoredDelta(t, p) {
            const f = t.authoredLayer; if (!f || !f.enabled) return 0;
            if (f.kind !== 'speed-shoulder') throw Error('Unsupported authored terrain layer');
            const dx = f.end.x - f.start.x, dy = f.end.y - f.start.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
            const px = p.x - f.start.x, py = p.y - f.start.y, along = (px * ux + py * uy) / L, cross = px * uy - py * ux;
            if (along <= 0 || along >= 1 || Math.abs(cross) > f.widthM * 3) return 0;
            const envelope = smooth(along / f.taperFraction) * (1 - smooth((along - (1 - f.taperFraction)) / f.taperFraction));
            // A compact additive ridge; the receiving side descends right and forward.
            const edge = 1 - smooth((Math.abs(cross) / f.widthM - 2.4) / .6);
            return Math.max(0, f.heightStartM * (1 - along) + f.heightEndM * along) * Math.exp(-.5 * (cross / f.widthM) ** 2) * envelope * edge;
         }
         function heightAt(t, p) { if (![p.x, p.y].every(Number.isFinite)) throw Error('Terrain query must be finite'); return sourceHeight(t, p) + authoredDelta(t, p); }
         function validate(t) { const errors = []; try { if (t.kind !== 'government-dem-grid' || t.adapterVersion !== VERSION) throw Error('Terrain adapter version'); decode(t.grid); for (const p of t.patches || []) { decode(p.grid); if (!(p.blendM > 0)) throw Error('Invalid terrain blend'); } const a = t.authoredLayer; if (a && (a.kind !== 'speed-shoulder' || typeof a.enabled !== 'boolean' || !['start', 'end'].every(k => a[k] && [a[k].x, a[k].y].every(Number.isFinite)) || Math.hypot(a.end.x - a.start.x, a.end.y - a.start.y) < 1 || !(a.widthM > 0 && a.heightStartM >= 0 && a.heightEndM >= 0 && a.taperFraction > 0 && a.taperFraction < .5))) throw Error('Invalid authored shoulder'); } catch (e) { errors.push(e.message); } return { passed: errors.length === 0, errors }; }
         return { VERSION, decode, gridHeight, sourceHeight, authoredDelta, heightAt, validate };
      });

export { DEM };
