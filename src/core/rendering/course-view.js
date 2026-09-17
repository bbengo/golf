

/* Pure view transforms: never mutate course coordinates, time, wind or shots. */
      const CourseView = ((factory) => factory())(function () {
         'use strict';
         function world(p, c) { const a = c.angle || 0, co = Math.cos(a), si = Math.sin(a), dx = p.x - c.x, dy = p.y - c.y; return { x: (co * dx - si * dy) * c.scale + c.w / 2, y: c.h / 2 - (si * dx + co * dy) * c.scale }; }
         function inverse(p, c) { const a = c.angle || 0, co = Math.cos(a), si = Math.sin(a), dx = (p.x - c.w / 2) / c.scale, dy = (c.h / 2 - p.y) / c.scale; return { x: c.x + co * dx + si * dy, y: c.y - si * dx + co * dy }; }
         function vector(v, c) { const a = c.angle || 0; return { x: Math.cos(a) * v.x - Math.sin(a) * v.y, y: -(Math.sin(a) * v.x + Math.cos(a) * v.y) }; }
         function fitScale(b, c) { const a = c.angle || 0, w = b.maxX - b.minX, h = b.maxY - b.minY, rw = Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h, rh = Math.abs(Math.sin(a)) * w + Math.abs(Math.cos(a)) * h; return Math.min((c.w - 32) / rw, (c.h - 28) / rh); }
         function visibleBounds(c, b) { const ps = [inverse({ x: 0, y: 0 }, c), inverse({ x: c.w, y: 0 }, c), inverse({ x: 0, y: c.h }, c), inverse({ x: c.w, y: c.h }, c)]; return { minX: Math.max(b.minX, Math.min(...ps.map(p => p.x))), maxX: Math.min(b.maxX, Math.max(...ps.map(p => p.x))), minY: Math.max(b.minY, Math.min(...ps.map(p => p.y))), maxY: Math.min(b.maxY, Math.max(...ps.map(p => p.y))) }; }
         return { world, inverse, vector, fitScale, visibleBounds };
      });

export { CourseView };
