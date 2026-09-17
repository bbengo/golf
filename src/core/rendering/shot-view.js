
/* Course Play R0.4.1: deterministic presentation only, never shot selection.
* Inputs are the current lie, existing neutral/user dot, known green and route.
* No wind, golfer, launch, future trajectory or best-shot solver is consulted.
*/
      const ShotView = ((factory) => factory())(function () {
         'use strict';
         const LIMITS = Object.freeze({ minZoom: .25, maxZoom: 24 });
         const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
         function point(p) { if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) throw Error('Invalid view point'); return p; }
         function frame({ ball, aim, pin, green = [], route = [], width, height, angle = 0, baseScale, onGreen = false }) {
            [ball, aim, pin, ...green, ...route].forEach(point);
            if (!Number.isFinite(width) || !Number.isFinite(height) || width < 100 || height < 100 || !Number.isFinite(baseScale) || baseScale <= 0 || !Number.isFinite(angle)) throw Error('Invalid shot viewport: ' + JSON.stringify({ width, height, baseScale, angle }));
            const co = Math.cos(angle), si = Math.sin(angle), rotate = p => ({ x: co * p.x - si * p.y, y: si * p.x + co * p.y }), unrotate = p => ({ x: co * p.x + si * p.y, y: -si * p.x + co * p.y });
            const targets = [ball, aim, pin];
            // An approach includes the complete known green and the remaining yardage-book
            // route. A putt focuses on ball/dot/cup with a generous minimum reading area.
            if (!onGreen) {
               targets.push(...green);
               let nearest = -1, best = Infinity;
               for (let i = 0; i < route.length - 1; i++) {
                  const a = route[i], b = route[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
                  const t = L ? clamp(((ball.x - a.x) * dx + (ball.y - a.y) * dy) / L, 0, 1) : 0;
                  const d = Math.hypot(ball.x - a.x - t * dx, ball.y - a.y - t * dy);
                  if (d < best) { best = d; nearest = i; }
               }
               if (nearest >= 0) targets.push(...route.slice(nearest + 1));
            }
            const ps = targets.map(rotate), remaining = Math.hypot(pin.x - ball.x, pin.y - ball.y);
            const context = onGreen ? clamp(remaining * .12, 3, 7) : clamp(remaining * .045, 10, 23);
            const minSpan = onGreen ? 18 : 50;
            const minX = Math.min(...ps.map(p => p.x)) - context, maxX = Math.max(...ps.map(p => p.x)) + context;
            const minY = Math.min(...ps.map(p => p.y)) - context, maxY = Math.max(...ps.map(p => p.y)) + context;
            const spanX = Math.max(minSpan, maxX - minX), spanY = Math.max(minSpan, maxY - minY);
            const padX = 28, padY = 36, scale = Math.min((width - padX * 2) / spanX, (height - padY * 2) / spanY);
            const center = unrotate({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
            return { ...center, angle, zoom: clamp(scale / baseScale, LIMITS.minZoom, LIMITS.maxZoom), kind: onGreen ? 'putting' : 'approach', remaining, targets: targets.map(p => ({ x: p.x, y: p.y })), context, minSpan };
         }
         function overlap(a, b) { return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)); }
         function labelPosition(anchor, size, viewport, avoid = []) {
            point(anchor);
            if (![size.width, size.height, viewport.width, viewport.height].every(n => Number.isFinite(n) && n > 0)) throw Error('Invalid label bounds');
            const w = size.width, h = size.height, pad = 5, gap = 13;
            const candidates = [{ x: anchor.x + gap, y: anchor.y - h / 2 }, { x: anchor.x - gap - w, y: anchor.y - h / 2 }, { x: anchor.x - w / 2, y: anchor.y - gap - h }, { x: anchor.x - w / 2, y: anchor.y + gap }, { x: anchor.x + gap, y: anchor.y - gap - h }, { x: anchor.x - gap - w, y: anchor.y - gap - h }, { x: anchor.x + gap, y: anchor.y + gap }, { x: anchor.x - gap - w, y: anchor.y + gap }];
            const objects = [...avoid, { x: anchor.x - 9, y: anchor.y - 9, width: 18, height: 18 }];
            let best = null, bestScore = Infinity;
            for (let i = 0; i < candidates.length; i++) {
               const q = candidates[i], r = { x: clamp(q.x, pad, Math.max(pad, viewport.width - w - pad)), y: clamp(q.y, pad, Math.max(pad, viewport.height - h - pad)), width: w, height: h };
               const score = objects.reduce((n, b) => n + overlap(r, b), 0) * 100 + Math.hypot(r.x - q.x, r.y - q.y) + i * .01;
               if (score < bestScore) { best = r; bestScore = score; }
            }
            return best;
         }
         return { LIMITS, frame, labelPosition, overlap };
      });

export { ShotView };
