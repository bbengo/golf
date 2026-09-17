import { CourseView } from './course-view.js';

/* Coursecraft terrain-native compositor / 0.4.4.
* The scene is painted in physical world coordinates. NO image registration
* warp, geometry fitting, or texture-derived physics. Materials are explicitly
* synthetic, independently mip-filtered, and have a declared world scale.
* Tree silhouettes use only existing physical canopy extents. The appearance
* of branches/leaves is not a claim that those parts are simulated colliders.
*/
      const PlateRenderer = ((factory) => factory())(function () {
         'use strict';
         const VERSION = 'terrain-native-render/0.4.4';
         const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
         function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; }; }
         function matrix(c) { const co = Math.cos(c.angle || 0), si = Math.sin(c.angle || 0), s = c.scale; return [co * s, -si * s, -si * s, -co * s, c.w / 2 - s * (co * c.x - si * c.y), c.h / 2 + s * (si * c.x + co * c.y)]; }
         function density(c, dpr) { return c.scale * Math.min(dpr || 1, 2); }
         function mipSize(required) { for (const n of [16, 32, 64, 128, 256, 512, 1024]) if (n >= required) return n; return 1024; }
         function spriteSize(diameterPx) { return Math.min(4096, Math.max(128, 2 ** Math.ceil(Math.log2(Math.max(1, diameterPx))))); }
         function create(data, onReady) {
            const images = new Map(), patterns = new Map(), sprites = new Map(), scene = data.scene;
            let spriteBytes = 0, painting = false, frames = 0, lastFrameMs = 0, lastStats = {}, drawRequests = 0;
            const maxSpriteBytes = 96 * 1024 * 1024;
            const types = ['rough', 'deep-rough', 'fairway', 'fringe', 'green', 'tee', 'water'];
            const colors = { rough: '#597438', 'deep-rough': '#35532d', fairway: '#729545', fringe: '#61883d', green: '#84a14f', tee: '#7b9b4b', water: '#2c5450' };
            const surfacePaths = {};
            function makePath(polys) { const p = new Path2D(); for (const poly of polys) { for (const ring of [poly.exterior, ...poly.holes]) { ring.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); } } return p; }
            for (const t of Object.keys(scene.paths)) surfacePaths[t] = makePath(scene.paths[t]);
            const entries = Object.entries(data.images);
            for (const [name, url] of entries) { const img = new Image(); img.onload = () => { drawRequests++; if (onReady && !painting) onReady(); }; img.onerror = () => { img.datasetFailed = true; if (onReady) onReady(); }; images.set(name, img); img.src = url; }
            function ready() { return entries.every(([n]) => { const i = images.get(n); return i.complete && i.naturalWidth > 0; }); }
            function pattern(ctx, t, ppm) {
               const m = scene.detail.materials[t], n = mipSize(ppm * m.metresPerRepeat), file = t + '_' + n + '.png'; let img = images.get(file);
               if (!img?.naturalWidth) { img = [1024, 512, 256, 128, 64, 32, 16].map(k => images.get(t + '_' + k + '.png')).find(x => x?.naturalWidth); }
               if (!img) return colors[t];
               let v = patterns.get(file); if (!v || v.image !== img) { const p = ctx.createPattern(img, 'repeat'); p.setTransform(new DOMMatrix([m.metresPerRepeat / img.width, 0, 0, m.metresPerRepeat / img.height, 0, 0])); v = { image: img, pattern: p }; patterns.set(file, v); } return v.pattern;
            }
            function disk(cx, x, y, r, fill) { cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fillStyle = fill; cx.fill(); }
            function treeSprite(kind, variant, n) {
               const key = kind + ':' + variant + ':' + n; if (sprites.has(key)) { const s = sprites.get(key); sprites.delete(key); sprites.set(key, s); return s; }
               const cv = document.createElement('canvas'); cv.width = cv.height = n; const cx = cv.getContext('2d'), r = rng(4773 + variant * 331 + (kind === 'spruce' ? 1409 : 0));
               cx.scale(n, n); cx.save(); cx.beginPath(); cx.arc(.5, .5, .495, 0, 2 * Math.PI); cx.clip();
               if (kind === 'spruce') {
                  const base = cx.createRadialGradient(.42, .4, .02, .5, .5, .51); base.addColorStop(0, '#50745b'); base.addColorStop(.45, '#2a4b3f'); base.addColorStop(1, '#1b382f'); disk(cx, .5, .5, .497, base);
                  for (let tier = 0; tier < 13; tier++) {
                     const rad = .48 * (1 - tier / 14), twist = r() * .42;
                     for (let k = 0; k < 14; k++) {
                        const a = k * Math.PI / 7 + twist, rr = rad * (.7 + r() * .3), tx = .5 + Math.cos(a) * rr, ty = .5 + Math.sin(a) * rr;
                        cx.beginPath(); cx.moveTo(.5, .5); cx.lineTo(tx - Math.sin(a) * rad * .09, ty + Math.cos(a) * rad * .09); cx.lineTo(tx, ty); cx.lineTo(tx + Math.sin(a) * rad * .09, ty - Math.cos(a) * rad * .09); cx.closePath(); cx.fillStyle = ['#355846', '#436c55', '#294f40', '#597b60'][Math.floor(r() * 4)]; cx.fill();
                        cx.strokeStyle = '#73977955'; cx.lineWidth = .0007; for (let j = 1; j < 17; j++) { const f = j / 17, px = .5 + (tx - .5) * f, py = .5 + (ty - .5) * f, l = rad * .045 * (1 - f); cx.beginPath(); cx.moveTo(px - Math.sin(a) * l, py + Math.cos(a) * l); cx.lineTo(px, py); cx.lineTo(px + Math.sin(a) * l, py - Math.cos(a) * l); cx.stroke(); }
                     }
                  }
                  disk(cx, .493, .48, .017, '#84a17a');
               } else {
                  const base = cx.createRadialGradient(.38, .35, .02, .5, .5, .52); base.addColorStop(0, '#6b8745'); base.addColorStop(.7, '#3a582d'); base.addColorStop(1, '#223c28'); disk(cx, .5, .5, .497, base);
                  // Deterministic branching clusters in a fixed circular physical crown.
                  for (let k = 0; k < 165; k++) {
                     const a = r() * 2 * Math.PI, rho = Math.sqrt(r()) * .445, x = .5 + Math.cos(a) * rho, y = .5 + Math.sin(a) * rho, rr = .025 + r() * .08;
                     const gr = cx.createRadialGradient(x - rr * .35, y - rr * .37, rr * .08, x, y, rr);
                     gr.addColorStop(0, ['#829449', '#94a551', '#738a43', '#7c9149'][Math.floor(r() * 4)]); gr.addColorStop(.6, '#5b7537'); gr.addColorStop(1, '#294b2db8'); disk(cx, x, y, rr, gr);
                  }
                  for (let k = 0; k < 15000; k++) {
                     const a = r() * 2 * Math.PI, rho = Math.sqrt(r()) * .488, x = .5 + Math.cos(a) * rho, y = .5 + Math.sin(a) * rho;
                     const l = .0012 + r() * .0026, light = (.5 - x) * .7 + (.5 - y) * .7 + r() * .4;
                     cx.fillStyle = light > .28 ? '#9eac5e88' : light > .02 ? '#71894388' : '#203d2c5f'; cx.beginPath(); cx.ellipse(x, y, l, l * .48, a, 0, 2 * Math.PI); cx.fill();
                  }
               }
               cx.restore(); const bytes = n * n * 4; while (spriteBytes + bytes > maxSpriteBytes && sprites.size) { const [k, s] = sprites.entries().next().value; sprites.delete(k); spriteBytes -= s.width * s.height * 4; s.width = s.height = 1; }
               sprites.set(key, cv); spriteBytes += bytes; return cv;
            }
            function flowers(ctx, c) {
               for (const s of c.surfaces.filter(s => s.type === 'tee')) {
                  const pp = s.polygon, random = rng(s.id.length + Math.round(pp[0].y * 71)); let maxMid = -Infinity, north = 0;
                  pp.forEach((p, i) => { const q = pp[(i + 1) % pp.length], mid = (p.y + q.y) / 2; if (mid > maxMid) { maxMid = mid; north = i; } });
                  const center = pp.reduce((a, p) => ({ x: a.x + p.x / pp.length, y: a.y + p.y / pp.length }), { x: 0, y: 0 });
                  for (let i = 0; i < pp.length; i++) {
                     if (i === north) continue; const a = pp[i], b = pp[(i + 1) % pp.length], length = Math.hypot(b.x - a.x, b.y - a.y), count = Math.max(2, Math.floor(length / 1.25));
                     for (let j = 0; j < count; j++) {
                        const f = (j + .5) / count, x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f, dx = x - center.x, dy = y - center.y, den = Math.hypot(dx, dy), px = x + dx / den * .72, py = y + dy / den * .72;
                        disk(ctx, px + .10, py - .12, .51, '#253b2990'); disk(ctx, px, py, .44, '#3f6437');
                        for (let k = 0; k < 12; k++) { const ag = random() * Math.PI * 2, rr = random() * .36, rx = px + Math.cos(ag) * rr, ry = py + Math.sin(ag) * rr; disk(ctx, rx, ry, .075 + random() * .055, ['#f1e5ce', '#dbc472', '#b683aa', '#e5c3cf', '#ded6ab'][Math.floor(random() * 5)]); }
                     }
                  }
               }
            }
            function paintScene(ctx, c, camera, dpr) {
               if (painting) return; painting = true; const begin = performance.now(), ppm = density(camera, dpr), V = CourseView, b = V.visibleBounds(camera, c.bounds); const st = { renderer: VERSION, syntheticMaterials: true, postWarp: false, ppm, objectsDrawn: 0, materialUnderSampling: [], frame: ++frames };
               try {
                  ctx.save(); ctx.transform(...matrix(camera)); ctx.fillStyle = pattern(ctx, 'rough', ppm); ctx.fillRect(b.minX - 2, b.minY - 2, b.maxX - b.minX + 4, b.maxY - b.minY + 4);
                  for (const t of types.slice(1)) { const path = surfacePaths[t]; if (!path) continue; ctx.fillStyle = pattern(ctx, t, ppm); ctx.fill(path, 'evenodd'); }
                  // Stripes are mowing appearance only. They do not alter height/resistance.
                  const fair = surfacePaths.fairway; if (fair) { ctx.save(); ctx.clip(fair, 'evenodd'); ctx.lineWidth = 4.2; ctx.strokeStyle = 'rgba(222,231,146,.095)'; ctx.beginPath(); for (let x = Math.floor(b.minX / 8.4) * 8.4 - 160; x < b.maxX + 160; x += 8.4) { ctx.moveTo(x, -520); ctx.lineTo(x + 185, 650); } ctx.stroke(); ctx.restore(); }
                  for (const typ of ['green', 'fringe', 'tee']) if (surfacePaths[typ]) { ctx.save(); ctx.clip(surfacePaths[typ], 'evenodd'); ctx.lineWidth = typ === 'green' ? 1.2 : .25; ctx.strokeStyle = typ === 'green' ? 'rgba(225,233,163,.075)' : 'rgba(220,231,150,.045)'; ctx.beginPath(); for (let x = Math.floor(b.minX / 2.4) * 2.4 - 100; x < b.maxX + 100; x += 2.4) { ctx.moveTo(x, -510); ctx.lineTo(x + 80, 650); } ctx.stroke(); ctx.restore(); }
                  const lm = c.terrain.authoredLayer.enabled ? 'shaped' : 'source', light = images.get(lm + '_light.png'), lb = scene[lm + 'TerrainLight'].worldBounds;
                  if (light?.naturalWidth) { ctx.save(); ctx.translate(lb.minX, lb.maxY); ctx.scale((lb.maxX - lb.minX) / light.width, -(lb.maxY - lb.minY) / light.height); ctx.drawImage(light, 0, 0); ctx.restore(); }
                  // Thin, irregular creek-bank accent is clipped outside water, not a shifted
                  // water mask. At highest zoom the class boundary is still the true polygon.
                  if (surfacePaths.water) { ctx.save(); ctx.lineWidth = .18; ctx.strokeStyle = 'rgba(196,185,132,.6)'; ctx.stroke(surfacePaths.water); ctx.restore(); }
                  for (const o of c.objects) {
                     if (o.kind === 'bridge') {
                        ctx.fillStyle = '#3f4434'; ctx.fillRect(o.minX + .12, o.minY - .12, o.maxX - o.minX, o.maxY - o.minY);
                        ctx.fillStyle = '#b8af86'; ctx.fillRect(o.minX, o.minY, o.maxX - o.minX, o.maxY - o.minY);
                        ctx.lineWidth = .03; ctx.strokeStyle = '#807956'; for (let y = o.minY; y < o.maxY; y += .22) { ctx.beginPath(); ctx.moveTo(o.minX, y); ctx.lineTo(o.maxX, y); ctx.stroke(); }
                        ctx.lineWidth = .09; ctx.strokeStyle = '#e1d5b3'; ctx.strokeRect(o.minX, o.minY, o.maxX - o.minX, o.maxY - o.minY);
                     }
                  }
                  flowers(ctx, c);
                  const trees = c.objects.filter(o => o.kind === 'tree');
                  // Shadows remain presentation, not obstacles. No fabricated left-side trees.
                  for (const o of trees) { ctx.save(); ctx.translate(o.x + o.height * .35, o.y - o.height * .35); ctx.rotate(-Math.PI / 4); const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, o.canopyRadius * 1.2); gr.addColorStop(0, '#142f2482'); gr.addColorStop(.72, '#142f245b'); gr.addColorStop(1, '#142f2400'); ctx.scale(1.5, 1); disk(ctx, 0, 0, o.canopyRadius * 1.2, gr); ctx.restore(); }
                  for (const o of trees) {
                     const r = o.canopyRadius; if (o.x + r < b.minX || o.x - r > b.maxX || o.y + r < b.minY || o.y - r > b.maxY) continue; const kind = o.id.startsWith('spruce') ? 'spruce' : 'oak', variant = parseInt(o.id.replace(/\D/g, ''), 10) % 3, n = spriteSize(r * 2 * ppm), im = treeSprite(kind, variant, n);
                     ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1, -1); ctx.drawImage(im, -r, -r, r * 2, r * 2); ctx.restore(); st.objectsDrawn++;
                  }
                  ctx.restore(); for (const [name, m] of Object.entries(scene.detail.materials)) if (ppm > m.sourcePixelsPerMetre) st.materialUnderSampling.push(name);
               } finally { painting = false; lastFrameMs = performance.now() - begin; lastStats = { ...st, frameMs: lastFrameMs, spriteCacheBytes: spriteBytes, spriteCacheLimitBytes: maxSpriteBytes, imagesReady: ready() }; }
            }
            const buffer = document.createElement('canvas'); let bufferKey = null, bufferBuilds = 0, bufferHits = 0;
            function paint(ctx, c, camera, dpr) {
               const factor = Math.min(dpr || 1, 2), w = Math.round(camera.w * factor), h = Math.round(camera.h * factor);
               const key = JSON.stringify([camera.x, camera.y, camera.scale, camera.angle, camera.w, camera.h, factor, c.revision, c.terrain.authoredLayer.enabled, drawRequests]);
               if (bufferKey !== key) {
                  if (buffer.width !== w || buffer.height !== h) { buffer.width = w; buffer.height = h; }
                  const bc = buffer.getContext('2d'); bc.setTransform(factor, 0, 0, factor, 0, 0); bc.clearRect(0, 0, camera.w, camera.h);
                  paintScene(bc, c, camera, factor); bufferKey = key; bufferBuilds++;
               } else bufferHits++;
               ctx.drawImage(buffer, 0, 0, w, h, 0, 0, camera.w, camera.h);
            }
            function stats() { return { ...lastStats, bufferBuilds, bufferHits, bufferBytes: buffer.width * buffer.height * 4, loadedImageCount: [...images.values()].filter(x => x.naturalWidth).length, failedImageCount: [...images.values()].filter(x => x.datasetFailed).length, sourceSurfaceCount: scene.sourceFeatureCount }; }
            return { paint, ready, stats, scene, dispose: () => { for (const s of sprites.values()) s.width = s.height = 1; sprites.clear(); spriteBytes = 0; }, surfacePaths };
         }
         return { VERSION, matrix, density, mipSize, spriteSize, rng, create };
      });

export { PlateRenderer };
