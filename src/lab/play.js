import { Contract } from '../core/contracts/contract.js';
import { Course } from '../core/course/course.js';
import { Player } from '../core/simulation/player.js';
import { Wind } from '../core/course/wind.js';
import { Conditions } from '../core/course/conditions.js';
import { Terrain } from '../core/course/terrain.js';
import { Shot } from '../core/simulation/shot.js';
import { HoleVisual } from '../core/course/hole.js';
import { CourseView } from '../core/rendering/course-view.js';
import { GolfPresentation } from '../core/rendering/golf-presentation.js';
import { ShotView } from '../core/rendering/shot-view.js';
import { MapInput } from './map-input.js';
import { InputTrace } from './input-trace.js';
import { PhotoRenderer } from '../core/rendering/photo-renderer.js';
import { PhotoAssets } from '../core/rendering/photo-renderer.js';
import { UCGJourney } from '../core/session/journey.js';
import { PracticeVisual } from '../core/session/practice.js';

(function () {
         'use strict';
         const C = Contract, Q = Course, S = Shot, P = Player, W = Wind, D = Conditions, T = Terrain, V = CourseView, GP = GolfPresentation, SV = ShotView, MI = MapInput, PA = PracticeVisual, $ = id => document.getElementById(id), course = C.clone(HoleVisual.course);
         const fitBounds = course.plate.worldBounds, fitCenter = { x: (fitBounds.minX + fitBounds.maxX) / 2, y: (fitBounds.minY + fitBounds.maxY) / 2 };
         const plateImage = new Image(); plateImage.onload = () => draw(); plateImage.src = '/assets/reference/4e9da92209ceeb8b.jpg';
         const nativePlate = PhotoRenderer.create(PhotoAssets, () => { if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => draw()); });
         const inputTrace = InputTrace.create(512); let previewAim = null, traceEpoch = performance.now();
         function trace(kind, detail = {}) { return inputTrace.append(kind, { ms: Math.round((performance.now() - traceEpoch) * 10) / 10, phase: typeof phase === 'undefined' ? 'startup' : phase, mode: typeof mapMode === 'undefined' ? 'aim' : mapMode, ...detail }); }
         function nativeContract() { return { schema: 'lattice-course-plate/0.4.4', courseId: course.id, geometryFingerprint: C.fingerprint(Q.physicsSnapshot(course)), scene: PhotoAssets.manifest, renderer: PhotoRenderer.VERSION, postWarp: false, artisticAcceptance: 'working photographic fantasy course plus generated turf microdetail; visual review, not survey certification', runtime: nativePlate.stats() }; }
         function diagnostics() { return { schema: 'coursecraft-input-diagnostic/0.4.4', build: 'R0.6.0', buildSourceFingerprint: PhotoAssets.buildFingerprint, exportedAt: new Date().toISOString(), environment: { userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, protocol: location.protocol }, trace: inputTrace.read(), state: { screen: journey.screen, phase, mapMode, terrainOn, camera: C.clone(camera), ball: C.clone(ball), aim: C.clone(aim), gestureActive: !!pan, setup: C.clone(activeSetup), practice: C.clone(practice) }, recentShots: records.slice(-3), renderer: nativePlate.stats(), privacy: 'Local in-page recording; exported only when requested; no automatic upload.' }; }
         const map = $('map'), ctx = map.getContext('2d'), pc = $('profile'), px = pc.getContext('2d');
         const camera = { ...fitCenter, angle: course.plate.viewAngleRad || 0, zoom: 1, scale: 1, w: 640, h: 800 }; let ball = C.clone(course.tee), aim = Q.defaultAim(course, ball).point;
         let practice = PA.begin(null, 'page opened'), records = [], last = null, phase = 'plan', anim = null, frame = null, pan = null, stroke = 1, seed = 270919, viewportInitialized = false;
         let journey = UCGJourney.initial(), setupDraft = null;
         let currentPlayer = P.build(P.draft()), playerDraft = P.draft(), builderOpen = false, hasEntered = false, previewTimer = null, storageNotice = '';
         let activeSetup = D.setup(), setupOpen = false, pendingPlayer = null, roundWindSeed = 270919, weatherEpoch = performance.now(), weatherOffset = 0;
         let cameraMode = 'auto', shotFrameInfo = null;
         let terrainOn = false, mapMode = 'aim', probe = C.clone(course.greenCenter), terrainCache = null, meshCache = null;
         const skins = { meadow: { base: '#dde4ce', rough: '#cbd7b9', fairway: '#a5c68b', stripe: '#9cbd80', green: '#8eaf6f', fringe: '#bccf9e', sand: '#eee0b9', water: '#9bb9b1', path: '#b9b4a2', trees: '#708b58', treeDark: '#486746', line: '#7c906b' }, sepia: { base: '#e9e0cd', rough: '#d8ccb3', fairway: '#bfb693', stripe: '#b6ab8b', green: '#aca176', fringe: '#d5c79e', sand: '#f7ecd4', water: '#a5b2b1', path: '#afa48e', trees: '#9d9970', treeDark: '#706c49', line: '#948564' } };
         skins.art = { ...skins.meadow, base: '#597438', rough: '#597438', 'deep-rough': '#35532d' }; skins.legacy = skins.art; skins.meadow['deep-rough'] = '#758e62'; skins.sepia['deep-rough'] = '#9d9877';
         function weatherElapsed() { return Math.max(0, weatherOffset + (performance.now() - weatherEpoch) / 1000); }
         function day() { return D.makeDay(course, activeSetup, roundWindSeed, weatherElapsed()); }

         function world(p) { return V.world(p, camera); }

         function inverse(p) { return V.inverse(p, camera); }

         function syncCamera() { camera.scale = V.fitScale(fitBounds, camera) * camera.zoom; }

         function resize() { cancelMapGesture(undefined, 'viewport-change'); document.body.classList.toggle('playing', !$('gameShell').hidden); if ($('gameShell').hidden) return; const mapRect = map.getBoundingClientRect(); if (mapRect.width < 100 || mapRect.height < 100) return; for (const [c, context] of [[map, ctx], [pc, px]]) { const r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); context.setTransform(dpr, 0, 0, dpr, 0, 0); if (c === map) { camera.w = r.width; camera.h = r.height; } } syncCamera(); if (cameraMode === 'auto' && phase === 'plan' && !builderOpen && !setupOpen) fitCurrentShot(); draw(); profile(); drawTerrainMesh(); viewportInitialized = true; }
         function polygon(points, fill, stroke, width = 1) { ctx.beginPath(); points.forEach((p, i) => { const q = world(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); } }
         function line(points, color, width = 1, dash = []) { ctx.beginPath(); for (let i = 0; i < points.length; i++) { const q = world(points[i]); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); }
         function circle(q, r, fill, stroke, width = 1) { ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } }
         function label(text, p, color = '#40543d', size = 11) { const q = world(p); ctx.fillStyle = color; ctx.font = `${size}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(text, q.x, q.y); }

         function visibleTerrain() {
            const bounds = V.visibleBounds(camera, course.bounds), spacing = camera.zoom >= 4 ? .75 : camera.zoom >= 2 ? 1.5 : 3.5, interval = camera.zoom >= 4 ? .1524 : .3048, key = JSON.stringify({ bounds, spacing, interval, revision: course.revision });
            if (!terrainCache || terrainCache.key !== key) terrainCache = { key, data: T.contours(course, bounds, spacing, interval) };
            $('contourInterval').textContent = camera.zoom >= 4 ? '½ ft' : '1 ft'; return terrainCache.data;
         }

         function slopeColor(d) { return d < 1 ? '#d9e7d2' : d <= 3 ? '#eddaa2' : '#d7a28e'; }
         function drawTerrainOverlay() {
            const data = visibleTerrain(); if ($('terrainLayer').value === 'slope') { ctx.save(); ctx.globalAlpha = .55; for (const c of data.cells) if (c.sample.surface !== 'water') polygon(c.polygon, slopeColor(c.sample.slopeDeg)); ctx.restore(); }
            for (const e of data.segments) line([e.a, e.b], e.index % 5 === 0 ? '#163b47c0' : '#35545e8a', e.index % 5 === 0 ? 1.2 : .6);
            const labelled = new Set(); for (const e of data.segments) { if (e.index % 5 !== 0 || labelled.has(e.index)) continue; const q = world(e.a); if (q.x < 35 || q.x > camera.w - 50 || q.y < 40 || q.y > camera.h - 45) continue; labelled.add(e.index); ctx.font = '10px system-ui'; ctx.textAlign = 'left'; ctx.fillStyle = '#f4f3e7'; ctx.fillRect(q.x - 2, q.y - 10, 38, 13); ctx.fillStyle = '#365160'; ctx.fillText(Math.round(e.level / .3048) + ' ft', q.x, q.y); }
            // Sampling positions are screen-grid points; gradients are world vectors rotated
            // through the very same transform. This also works at non-zero view angles.
            for (let sx = 35; sx < camera.w - 20; sx += 70)for (let sy = 35; sy < camera.h - 30; sy += 70) { const p = inverse({ x: sx, y: sy }); if (!Q.inBounds(course, p) || Q.surfaceAt(course, p).type === 'water') continue; const d = T.point(course, p), n = Math.hypot(d.slope.x, d.slope.y); if (n < .002) continue; const v = V.vector({ x: -d.slope.x / n, y: -d.slope.y / n }, camera), dx = v.x * 10, dy = v.y * 10; ctx.strokeStyle = '#f9f7e7'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx - dx * .45, sy - dy * .45); ctx.lineTo(sx + dx * .65, sy + dy * .65); ctx.stroke(); ctx.strokeStyle = '#243e3d'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx - dx * .45, sy - dy * .45); ctx.lineTo(sx + dx * .65, sy + dy * .65); ctx.moveTo(sx + dx * .65 - dx * .4 - dy * .28, sy + dy * .65 - dy * .4 + dx * .28); ctx.lineTo(sx + dx * .65, sy + dy * .65); ctx.lineTo(sx + dx * .65 - dx * .4 + dy * .28, sy + dy * .65 - dy * .4 - dx * .28); ctx.stroke(); }
         }

         function inspectPoint(p) { if (!Q.inBounds(course, p)) { $('status').textContent = 'Inspect a point inside the mapped course.'; return; } probe = { x: p.x, y: p.y }; draw(); drawTerrainMesh(); }
         // Terrain visibility and click ownership are independent. Reading the contours
         // must never silently steal aiming from this shot or any subsequent shot.
         function applyMapInput(action) {
            const wasVisible = terrainOn;
            ({ terrainOn, mapMode } = MI.transition({ terrainOn, mapMode }, action));
            cancelMapGesture();
            $('terrainPanel').hidden = !terrainOn; $('terrainGuide').hidden = !terrainOn;
            if (!terrainOn || mapMode === 'aim') closeTerrainDialog();
            if (terrainOn && !wasVisible) { const at = camera.zoom > 2 ? { x: camera.x, y: camera.y } : aim; if (Q.inBounds(course, at)) probe = C.clone(at); }
            syncMapInputUI();
         }
         function syncMapInputUI() {
            const inspecting = mapMode === 'inspect';
            $('terrainToggle').setAttribute('aria-pressed', String(terrainOn));
            $('terrainToggle').textContent = terrainOn ? 'Hide terrain' : 'Read terrain';
            $('terrainToggle').title = 'Show or hide contours. This does not take over aiming.';
            $('aimMode').setAttribute('aria-pressed', String(!inspecting));
            $('inspectMode').setAttribute('aria-pressed', String(inspecting));
            $('terrainModeTitle').textContent = inspecting ? 'Inspecting terrain' : 'Terrain overlay';
            $('terrainInteractionHelp').textContent = inspecting ?
               'Clicks and arrow keys move only the inspection marker. Aim shot or Escape returns to targeting and keeps contours visible.' :
               'Contours stay visible while you aim. Choose Inspect ground in the shot panel to probe elevations without moving your target.';
            const hint = inspecting ? 'Clicks read terrain · Aim shot or Esc to return' :
               phase === 'plan' ? 'Click to place your target' + (terrainOn ? ' · contours on' : '') :
                  phase === 'animating' ? 'Shot in progress · targeting paused' : 'Select Next shot to place a new target';
            $('mapModeHint').textContent = hint;
            $('map').dataset.mode = mapMode;
            $('map').setAttribute('aria-label', inspecting ?
               'Terrain inspection. Click or use arrow keys to inspect without moving the aim dot. Aim shot or Escape returns to targeting.' :
               phase === 'plan' ? 'Top-view course. Click to aim; drag the target to adjust it; drag elsewhere to pan; arrow keys move the target; scroll to zoom.' : hint + '. Drag and zoom still work.');
         }
         function setTerrainMode(on) { applyMapInput({ type: 'overlay', visible: on }); draw(); drawTerrainMesh(); }
         function setMapMode(mode) { applyMapInput({ type: 'mode', mode }); draw(); drawTerrainMesh(); }
         function readyMapForShot() { applyMapInput({ type: 'new-shot' }); trace('new-shot', { ball: C.clone(ball), aim: C.clone(aim), cameraMode }); }
         function drawTerrainMesh() {
            if (!terrainOn || $('gameShell').hidden) return; const canvas = $('terrainMesh'), cx = canvas.getContext('2d'), rect = canvas.getBoundingClientRect(), w = rect.width, h = rect.height; if (!w) return; const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h);
            const radius = Number($('terrainRadius').value), exaggeration = Number($('terrainExaggeration').value), yawDeg = Number($('terrainYaw').value), key = JSON.stringify({ probe, radius });
            if (!meshCache || meshCache.key !== key) meshCache = { key, data: T.mesh(course, probe, radius, 30) }; const data = meshCache.data, center = T.point(course, probe), all = data.rows.flat(), range = Math.max(...all.map(p => p.z)) - Math.min(...all.map(p => p.z));
            const scale = Math.min((w - 35) / (radius * 2.8), (h - 45) / (radius * 1.25 + range * exaggeration)), options = { width: w, height: h, yawDeg, exaggeration, scale }; const project = p => T.project(p, center, options), faces = [];
            for (let j = 0; j < data.divisions; j++)for (let i = 0; i < data.divisions; i++) { const ps = [data.rows[j][i], data.rows[j][i + 1], data.rows[j + 1][i + 1], data.rows[j + 1][i]], ss = ps.map(project); faces.push({ ps, ss, depth: ss.reduce((v, p) => v + p.depth, 0) / 4 }); } faces.sort((a, b) => a.depth - b.depth);
            for (const f of faces) { cx.beginPath(); f.ss.forEach((p, i) => i ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y)); cx.closePath(); const p = f.ps[0]; cx.fillStyle = p.surface === 'water' ? '#9bb9b1' : $('terrainLayer').value === 'slope' ? slopeColor(p.slopeDeg) : (skins[$('skin').value][p.surface] || skins[$('skin').value].rough); cx.fill(); cx.strokeStyle = '#425c5659'; cx.lineWidth = .55; cx.stroke(); }
            const q = project(center); cx.strokeStyle = '#993f2f'; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(q.x - 6, q.y); cx.lineTo(q.x + 6, q.y); cx.moveTo(q.x, q.y - 7); cx.lineTo(q.x, q.y + 7); cx.stroke();
            if (Math.abs(course.pin.x - probe.x) < radius && Math.abs(course.pin.y - probe.y) < radius) { const p = project(T.point(course, course.pin)); cx.fillStyle = '#263d37'; cx.beginPath(); cx.arc(p.x, p.y, 3, 0, 2 * Math.PI); cx.fill(); cx.font = '11px system-ui'; cx.fillText('Selected pin', p.x + 6, p.y - 4); }
            // Axis markers carry the actual horizontal orientation of this rotated view.
            for (const [name, dx, dy] of [['E', radius * .82, 0], ['N', 0, radius * .82]]) { const p = project({ ...center, x: center.x + dx, y: center.y + dy }); cx.fillStyle = '#233e3d'; cx.font = 'bold 12px system-ui'; cx.fillText(name, p.x, p.y); }
            const read = `${center.surface} · elevation ${(center.z / .3048).toFixed(1)} ft · slope ${center.slopeDeg.toFixed(1)}° (${center.gradePercent.toFixed(1)}%) · downhill ${center.downhillLabel}`;
            $('terrainReadout').textContent = read; canvas.setAttribute('aria-label', `${read}. Height display ${exaggeration} times actual. Terrain only, not object tops.`);
            $('terrainFoot').textContent = `Height scale ${exaggeration}×${exaggeration === 1 ? ' (true scale)' : ' — deliberately exaggerated'}. Elevation derives from the preserved NAVD88 DEM, adapted into this fantasy layout. The wireframe and ball use the same ground. Trees and bridge decks are separate. No shot prediction is shown.`;
         }

         function drawAimDistance() {
            const el = $('aimDistanceLabel');
            if (phase !== 'plan') { el.hidden = true; return; }
            const target = previewAim || aim, a = world(target);
            if (a.x < 0 || a.x > camera.w || a.y < 0 || a.y > camera.h) { el.hidden = true; return; }
            const d = GP.distance(C.hypot(ball, target), Q.surfaceAt(course, ball).type === 'green');
            if (el.textContent !== d.text) el.textContent = d.text;
            el.setAttribute('aria-label', d.value + ' ' + d.unitLong + ' from the ball to your aiming dot');
            el.dataset.unit = d.unit; el.dataset.metres = String(C.hypot(ball, target)); el.hidden = false;
            const pin = world(course.pin), b = world(ball), size = { width: el.offsetWidth, height: el.offsetHeight };
            const pos = SV.labelPosition(a, size, { width: camera.w, height: camera.h }, [{ x: pin.x - 8, y: pin.y - 34, width: 40, height: 44 }, { x: b.x - 9, y: b.y - 9, width: 18, height: 18 }]);
            el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
         }
         function fitCurrentShot() {
            const info = SV.frame({ ball, aim, pin: course.pin, green: course.surfaces.filter(s => s.type === 'green').flatMap(s => s.polygon), route: course.route, width: camera.w, height: camera.h, angle: camera.angle, baseScale: V.fitScale(fitBounds, camera), onGreen: Q.surfaceAt(course, ball).type === 'green' });
            camera.x = info.x; camera.y = info.y; camera.zoom = info.zoom; shotFrameInfo = info; cameraMode = 'auto'; syncCamera();
         }
         function autoShotView() { if (phase !== 'plan') return; fitCurrentShot(); draw(); }
         function drawCupFlag() {
            const p = world(course.pin), detail = C.clamp(camera.zoom / 5, .65, 1), h = 24 + 8 * detail, r = 3 + 2 * detail;
            ctx.save();
            // Light liner surrounding the shaded cup; physical cup location is its center.
            circle(p, r + 1, '#627052'); circle(p, r, '#fffced', '#3c4932', .7);
            const well = ctx.createRadialGradient(p.x - 1, p.y - 1, .2, p.x, p.y, r - .9);
            well.addColorStop(0, '#596251'); well.addColorStop(1, '#16241d'); circle(p, r - 1, well);
            // Restrained pole shadow and fine high-contrast pole.
            ctx.beginPath(); ctx.moveTo(p.x + 1, p.y + 1); ctx.lineTo(p.x + 15, p.y + 9); ctx.strokeStyle = '#20352750'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x, p.y - 1); ctx.lineTo(p.x, p.y - h); ctx.strokeStyle = '#283a2a'; ctx.lineWidth = 2.4; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x - .4, p.y - 1); ctx.lineTo(p.x - .4, p.y - h); ctx.strokeStyle = '#faf6df'; ctx.lineWidth = 1.2; ctx.stroke();
            // A small cloth pennant, not a map pin or a giant label.
            ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.bezierCurveTo(p.x + 7, p.y - h - 3, p.x + 14, p.y - h + 5, p.x + 22, p.y - h + 2);
            ctx.lineTo(p.x + 20, p.y - h + 13); ctx.bezierCurveTo(p.x + 13, p.y - h + 15, p.x + 7, p.y - h + 7, p.x, p.y - h + 10); ctx.closePath();
            ctx.fillStyle = '#f6ecd0'; ctx.fill(); ctx.strokeStyle = '#59684c'; ctx.lineWidth = .8; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x + 2, p.y - h + 2); ctx.quadraticCurveTo(p.x + 10, p.y - h + 1, p.x + 16, p.y - h + 5); ctx.strokeStyle = '#be694b'; ctx.lineWidth = 2.1; ctx.stroke();
            ctx.restore();
         }
         function draw() {
            if ($('gameShell').hidden || !camera.w) return;
            const skin = skins[$('skin').value] || skins.art, useNative = $('skin').value === 'art', useArt = useNative || $('skin').value === 'legacy';
            ctx.clearRect(0, 0, camera.w, camera.h); ctx.fillStyle = skin.base; ctx.fillRect(0, 0, camera.w, camera.h);
            if (useNative) { nativePlate.paint(ctx, course, camera, Math.min(devicePixelRatio || 1, 2)); }
            else if ($('skin').value === 'legacy' && plateImage.complete && plateImage.naturalWidth) {
               const inv = C.inverseAffine(course.plate.worldToPixel), w = course.plate.resolution.width, h = course.plate.resolution.height, a = world(C.affinePoint({ x: 0, y: 0 }, inv)), b = world(C.affinePoint({ x: w, y: 0 }, inv)), c = world(C.affinePoint({ x: 0, y: h }, inv));
               ctx.save(); ctx.transform((b.x - a.x) / w, (b.y - a.y) / w, (c.x - a.x) / h, (c.y - a.y) / h, a.x, a.y); ctx.drawImage(plateImage, 0, 0, w, h); ctx.restore();
            } else {
               for (const f of course.surfaces) polygon(f.polygon, skin[f.type] || skin.rough, f.type === 'water' ? '#6c9693' : null);
               for (const o of course.objects) { if (o.kind === 'bridge') polygon([{ x: o.minX, y: o.minY }, { x: o.maxX, y: o.minY }, { x: o.maxX, y: o.maxY }, { x: o.minX, y: o.maxY }], skin.path, '#807a66'); else { const p = world(o), r = o.canopyRadius * camera.scale; circle(p, r, skin.trees, skin.treeDark, .7); circle(p, Math.max(1, o.trunkRadius * camera.scale), skin.treeDark); } }
            }
            if ($('masks').checked) for (const f of course.surfaces) line([...f.polygon, f.polygon[0]], f.type === 'water' ? '#65e4f0' : f.type === 'green' ? '#fff9c9' : '#f6efe6b8', 1, [3, 2]);
            if (terrainOn) drawTerrainOverlay();
            if ($('zones').checked) for (const z of course.zones) { ctx.save(); ctx.globalAlpha = .16; polygon(z.polygon, '#f7e9a0'); ctx.restore(); line([...z.polygon, z.polygon[0]], '#f5edbd', 1.3, [4, 3]); }
            if ($('routeLayer').checked) { line(course.route, useArt ? '#fff9d375' : '#50694885', 1, [7, 8]); for (const p of course.route.slice(1, -1)) circle(world(p), 2, '#f1f0dc', '#526149'); }

            let current = { ...ball, z: Number.isFinite(ball.z) ? ball.z : Q.heightAt(course, ball) + S.R };
            if (last) {
               let tr = last.result.trajectory; if (anim) { tr = tr.filter(p => p.t <= anim.t); current = interpolate(last.result.trajectory, anim.t); } else current = last.result.finish;
               if (tr.length > 1) { let flight = [], ground = []; for (const p of tr) { if (p.mode === 'roll') { if (flight.length > 1) { line(flight, '#fffdf0', 2.2); flight = []; } ground.push(p); } else { if (ground.length > 1) { line(ground, '#f2d789', 1.6, [3, 3]); ground = []; } flight.push(p); } } if (flight.length > 1) line(flight, '#fffdf0', 2.2); if (ground.length > 1) line(ground, '#f2d789', 1.6, [3, 3]); }
            }
            if (phase === 'plan') {
               const target = previewAim || aim;
               line([ball, target], '#20392b88', 3.2, []); line([ball, target], '#fffce2d9', 1.25, []);
            }
            drawCupFlag();
            if (phase === 'plan') {
               const target = previewAim || aim, a = world(target); ctx.save();
               // Same recognizable target silhouette whether or not the target is at cup.
               ctx.beginPath(); ctx.arc(a.x, a.y, 12, 0, 2 * Math.PI); ctx.strokeStyle = '#233529'; ctx.lineWidth = 5; ctx.stroke();
               ctx.strokeStyle = '#ffdc70'; ctx.lineWidth = 2.5; ctx.stroke();
               for (let i = 0; i < 4; i++) { const t = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(a.x + Math.cos(t) * 15, a.y + Math.sin(t) * 15); ctx.lineTo(a.x + Math.cos(t) * 20, a.y + Math.sin(t) * 20); ctx.strokeStyle = '#213829'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#fffbed'; ctx.lineWidth = 2; ctx.stroke(); }
               if (C.hypot(target, course.pin) >= .01) circle(a, 2.6, '#fffbed', '#213829', 1);
               ctx.restore();
            }
            const q = world(current), clear = Math.max(0, current.z - Q.heightAt(course, current)), radius = S.apparentRadius(clear, camera.zoom); ctx.save(); ctx.globalAlpha = .25; ctx.beginPath(); ctx.ellipse(q.x + 3 + clear * .045, q.y + 4 + clear * .035, radius * .8, radius * .43, 0, 0, Math.PI * 2); ctx.fillStyle = '#203728'; ctx.fill(); ctx.restore(); circle(q, radius, '#fffef4', '#415741', 1.3);
            if (terrainOn && mapMode === 'inspect') { const mark = world(probe); ctx.strokeStyle = '#ba4d38'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mark.x - 7, mark.y); ctx.lineTo(mark.x + 7, mark.y); ctx.moveTo(mark.x, mark.y - 7); ctx.lineTo(mark.x, mark.y + 7); ctx.stroke(); }
            syncMapInputUI();
            $('mapCaption').textContent = mapMode === 'inspect' ? 'Inspecting ground · aim is unchanged · choose Aim shot or press Esc to return' :
               anim ? `${current.mode === 'roll' ? 'On the ground' : 'In flight'} · ${Math.round(clear * 3.28084)} ft above local terrain` :
                  phase === 'resolved' ? 'Result recorded · select Next shot to aim again' :
                     'Click to place target · drag the target to refine · drag elsewhere to pan · Auto shot at each new shot';
            drawAimDistance();
            $('scale').textContent = `${cameraMode === 'auto' ? 'Auto shot' : 'Manual view'} · ${camera.zoom.toFixed(1)}×`;
            $('shotView').setAttribute('aria-pressed', String(cameraMode === 'auto')); $('shotView').disabled = phase !== 'plan';
            $('shotView').title = cameraMode === 'auto' ? 'Automatic framing at each new shot. Manual zoom stays until the next shot.' : 'Return to automatic framing now. It also resumes at the next shot.';
         }

         function profile() {
            if ($('gameShell').hidden) return; const r = pc.getBoundingClientRect(), w = r.width, h = r.height; if (!w) return; px.clearRect(0, 0, w, h); const left = 42, right = 14, top = 12, bottom = 28; let arr = [];
            if (last) { let d = 0, prev = last.result.trajectory[0]; for (const p of last.result.trajectory) { d += C.hypot(prev, p); arr.push({ s: d, z: p.z, ground: Q.heightAt(course, p) }); prev = p; } $('profileTitle').textContent = 'Last shot · terrain and actual modelled height'; }
            else { const length = C.hypot(ball, aim); for (let i = 0; i <= 100; i++) { const t = i / 100, p = { x: ball.x + (aim.x - ball.x) * t, y: ball.y + (aim.y - ball.y) * t }; arr.push({ s: length * t, z: null, ground: Q.heightAt(course, p) }); } $('profileTitle').textContent = 'Terrain along your aim line'; }
            const length = Math.max(1, arr[arr.length - 1]?.s || 1), zs = arr.flatMap(p => [p.ground, p.z ?? p.ground]); let lo = Math.floor(Math.min(...zs) - 1), hi = Math.ceil(Math.max(...zs) + 3); if (hi - lo < 8) hi = lo + 8;
            const x = v => left + (w - left - right) * v / length, y = v => h - bottom - (v - lo) / (hi - lo) * (h - top - bottom);
            px.font = '10px system-ui'; px.textAlign = 'right'; px.fillStyle = '#65715d'; px.strokeStyle = '#d5d9cb'; px.lineWidth = .7;
            for (let i = 0; i < 4; i++) { const z = lo + (hi - lo) * i / 3; px.beginPath(); px.moveTo(left, y(z)); px.lineTo(w - right, y(z)); px.stroke(); px.fillText(Math.round(z * 3.28084), left - 6, y(z) + 3); }
            px.beginPath(); px.moveTo(left, h - bottom); for (const p of arr) px.lineTo(x(p.s), y(p.ground)); px.lineTo(x(length), h - bottom); px.closePath(); px.fillStyle = '#c6d2b4'; px.fill(); px.beginPath(); arr.forEach((p, i) => i ? px.lineTo(x(p.s), y(p.ground)) : px.moveTo(x(p.s), y(p.ground))); px.strokeStyle = '#6b8355'; px.lineWidth = 1.3; px.stroke();
            if (last) { px.beginPath(); arr.forEach((p, i) => i ? px.lineTo(x(p.s), y(p.z)) : px.moveTo(x(p.s), y(p.z))); px.strokeStyle = '#334f43'; px.lineWidth = 1.8; px.stroke(); }
            px.textAlign = 'center'; for (let i = 0; i <= 4; i++) { const s = length * i / 4; px.fillStyle = '#64705e'; px.fillText(GP.distance(s, Q.surfaceAt(last ? last.course : course, last ? last.intent.start : ball).type === 'green').text, x(s), h - 9); } if (!last) { px.textAlign = 'right'; px.fillText('No solved shot preview', w - right, top + 8); }
         }
         function update() {
            const current = GP.restingBall(ball, last, phase), onGreen = Q.surfaceAt(course, current).type === 'green', distance = C.hypot(current, aim), dotDistance = GP.distance(distance, onGreen), pinDistance = GP.distance(C.hypot(current, course.pin), onGreen); $('distance').textContent = dotDistance.value; $('toPin').textContent = pinDistance.value; $('distanceUnit').textContent = dotDistance.unit; $('toPinUnit').textContent = pinDistance.unit; $('stroke').textContent = stroke;
            const type = Q.surfaceAt(course, current).type; $('shotHeading').textContent = phase === 'resolved' ? 'Ball at rest' : type === 'tee' ? 'From the tee' : `From the ${type.replace('-', ' ')}`;
            $('carryLabel').textContent = $('club').value === 'PUTT' ? 'flat-distance pace' : Math.round(S.stockYardages(currentPlayer).find(k => k.id === $('club').value).carryYards) + ' yd stock*';
            const effort = +$('effort').value, shape = +$('shape').value, height = +$('height').value;
            $('effortValue').textContent = effort + '%'; $('shapeValue').textContent = shape === 0 ? 'My stock curve' : `${Math.abs(shape)}% more ${shape > 0 ? 'R → L' : 'L → R'}`; $('heightValue').textContent = height === 0 ? 'My stock height' : `${Math.abs(height)}% ${height > 0 ? 'higher' : 'lower'}`;
            $('shotStockNote').textContent = ['PUTT', 'CHIP'].includes($('club').value) ? 'Stock full-shot style does not bend a putt or chip.' : ('Your stock: ' + P.styleLabel(currentPlayer) + '.');
            const neutralShort = ['PUTT', 'CHIP'].includes($('club').value); if (neutralShort) { $('shapeValue').textContent = 'Not used'; $('heightValue').textContent = 'Fixed shot type'; }
            const ref = $('shotReference'), id = $('club').value;
            if (id === 'PUTT') {
               ref.textContent = 'Pace is the flat-green distance at the course baseline. Read the break and uphill/downhill pace yourself.'; ref.dataset.unreachable = 'false';
            } else {
               const n = S.referenceCarry(currentPlayer, id, effort / 100, { shape: shape / 100, height: height / 100 }), max = S.referenceCarry(currentPlayer, id, S.EFFORT.max);
               ref.textContent = `Flat-calm carry at this effort: ${(n / .9144).toFixed(1)} yd. ` + (distance > max + .1 ? 'The dot is beyond this club’s stock reference range. ' : '') + 'Elevation, wind and lie are not compensated.';
               ref.dataset.unreachable = String(distance > max + .1);
            }
            const count = PA.summary(practice), eligible = !builderOpen && !setupOpen && PA.candidate(practice, phase);
            $('mulligan').disabled = !eligible;
            $('gimme').disabled = builderOpen || setupOpen || !PA.canConcede(practice, { phase, surface: Q.surfaceAt(course, current).type, status: last?.result.status });
            $('practiceCount').textContent = `Practice · ${count.counted} counted / ${count.attempts} played`;
            $('mulliganHelp').textContent = eligible ? 'Redo the most recent shot from its exact start; no counted stroke. Old evidence stays; the next attempt uses live wind.' :
               phase === 'animating' ? 'Mulligan is available after this shot finishes.' : count.attempts ? 'No eligible new shot to redo. Previous evidence is retained.' : 'Mulligan becomes available after your first shot.';
            const wd = activeSetup.wind !== 'calm'; updateWind(); syncQuickReadout();
            const g = Q.groundAt(course, aim, day()), lineRisks = Q.inspectLine(course, ball, aim); let note = `At your dot: ${g.type}${g.zone === 'speed-lane' ? ' on the running shoulder' : g.zone === 'soft-pocket' ? ' in the soft pocket' : ''}. `;
            if (g.zone) note += course.zones.find(z => z.id === g.zone).note + ' '; else note += 'Fairway width is not the same as a good next approach. ';
            if (lineRisks.length) note += `The straight plan line crosses ${lineRisks.join(' and ')}. This is a map observation, not a solved clearance test. `;
            if (wd) note += 'The wind is active; your aim has not been compensated. ';
            $('caddie').textContent = note; $('learning').textContent = S.learning(records.filter((r, i) => r.golfer.id === currentPlayer.id && !PA.discarded(practice).has(i))).text;
            // One primary action stays in the same place throughout the shot cycle.
            // Skipping animation reveals the already computed result; it cannot change the shot.
            const resolved = ['resolved', 'conceded'].includes(phase), running = phase === 'animating';
            const nextLabel = phase === 'conceded' || last?.result.status === 'holed' ? 'Start a new hole' :
               last && ['water', 'out-of-bounds', 'outside-survey', 'unresolved-time-limit'].includes(last.result.status) ? 'Practice retry' : `Next shot · ${stroke + 1}`;
            $('play').disabled = journey.screen !== 3 || builderOpen || setupOpen || !['plan', 'animating', 'resolved', 'conceded'].includes(phase);
            $('play').textContent = running ? 'Show result' : resolved ? nextLabel : 'Play this shot';
            $('next').hidden = !resolved; $('next').disabled = !resolved; $('next').textContent = nextLabel;
            $('replay').disabled = phase !== 'resolved';
            for (const id of ['club', 'effort', 'shape', 'height', 'stockShot', 'variance']) $(id).disabled = builderOpen || phase !== 'plan';
            if (neutralShort) { $('shape').disabled = true; $('height').disabled = true; }
            $('editPlayer').disabled = phase === 'animating'; for (const id of ['editConditions', 'editConditionsSide']) $(id).disabled = phase === 'animating';
            for (const id of ['laneOn', 'laneOff']) $(id).disabled = phase === 'animating'; $('laneOn').setAttribute('aria-pressed', String(course.terrain.authoredLayer.enabled)); $('laneOff').setAttribute('aria-pressed', String(!course.terrain.authoredLayer.enabled));
            draw(); profile();
         }
         function autoClub() { const s = S.suggestClub(Math.max(.005, C.hypot(ball, aim)), Q.surfaceAt(course, ball).type, currentPlayer); $('club').value = s.club; $('effort').value = Math.round(s.effort * 1000) / 10; }
         function setAim(p, origin = 'programmatic') {
            if (journey.screen !== 3 || builderOpen || setupOpen) return false; if (phase !== 'plan') {
               $('status').textContent = phase === 'animating' ? 'This shot is in progress. Select Show result, then Next shot to place a new target.' :
                  last?.result.status === 'holed' ? 'The hole is complete. Select Start a new hole to aim again.' :
                     last && ['water', 'out-of-bounds', 'outside-survey', 'unresolved-time-limit'].includes(last.result.status) ? 'Select Practice retry to place a new target from the previous position.' :
                        'Select Next shot to place a new target from the ball’s recorded finish.';
               return false;
            } if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x) > 10000 || Math.abs(p.y) > 10000) { $('status').textContent = 'Aim is outside this lab’s declared coordinate range.'; return; } if (C.hypot(ball, p) < (Q.surfaceAt(course, ball).type === 'green' ? .005 : .2)) { $('status').textContent = 'Place the dot away from the ball.'; return; } aim = { x: p.x, y: p.y }; const tick = performance.now(); autoClub(); update(); trace('aim-accepted', { origin, world: C.clone(aim), distanceM: C.hypot(ball, aim), processingMs: performance.now() - tick }); return true;
         }
         function getIntent() { return { start: C.clone(ball), aim: C.clone(aim), club: $('club').value, effort: +$('effort').value / 100, shape: +$('shape').value / 100, height: +$('height').value / 100, variance: $('variance').checked, styleAdjustmentSemantics: 'relative_to_profile_stock', aimSemantics: $('club').value === 'PUTT' ? 'direction_and_flat_pace_at_course_baseline_speed_no_daily_compensation' : 'direction_and_nominal_carry_no_condition_compensation', inputMode: 'management_only' }; }
         function interpolate(tr, t) { if (t <= 0) return tr[0]; let lo = 0, hi = tr.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tr[mid].t < t) lo = mid; else hi = mid; } const a = tr[lo], b = tr[hi], f = C.clamp((t - a.t) / (b.t - a.t || 1), 0, 1); return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f, mode: a.mode }; }
         function showResult() {
            const r = last.result; $('resultPanel').hidden = false; $('resultHeading').textContent = r.status === 'water' ? 'In the water' : r.status === 'outside-survey' ? 'Beyond terrain coverage' : r.status === 'out-of-bounds' ? 'Out of bounds' : r.status === 'holed' ? 'Holed in the study model' : r.status === 'unresolved-time-limit' ? 'Unresolved: simulation limit' : 'A new position';
            const greenStart = Q.surfaceAt(last.course, last.intent.start).type === 'green', carryText = GP.distance(r.carry, greenStart), totalText = GP.distance(r.total, greenStart); $('carry').textContent = carryText.value; $('total').textContent = totalText.value; $('carryUnit').textContent = carryText.unit; $('totalUnit').textContent = totalText.unit; $('apex').textContent = (r.apexAboveLaunch * 3.28084).toFixed(1); $('lie').textContent = r.finalSurface;
            const landing = r.events.find(e => e.type === 'landing'); let text = landing ? `First landing: ${landing.surface}${landing.zone ? ' / ' + landing.zone : ''}. ` : 'Ground-start shot. ';
            const hits = r.events.filter(e => ['canopy', 'trunk', 'bridge'].includes(e.type)); if (hits.length) text += 'Recorded contacts: ' + hits.map(e => e.type).join(', ') + '. ';
            text += `Final position is ${GP.distance(C.hypot(r.finish, last.course.pin), Q.surfaceAt(last.course, r.finish).type === 'green').text} from the pin. `;
            if (['water', 'out-of-bounds', 'outside-survey'].includes(r.status)) text += 'This lab replays from the previous position; it does not apply competition relief or penalties.';
            else text += 'This is an experimental model outcome, not calibrated performance evidence.';
            $('explanation').textContent = text; $('log').textContent = r.events.map(e => `${e.t.toFixed(2)}s  ${e.type}${e.surface ? ' · ' + e.surface : ''}${e.zone ? ' · ' + e.zone : ''}${e.objectId ? ' · ' + e.objectId : ''}`).join('\n');
         }
         function finishAnimation() {
            if (!last || phase !== 'animating') return;
            if (frame) cancelAnimationFrame(frame); frame = null; anim = null; phase = 'resolved';
            const simulatedEnd = (last.day.windStartSeconds || 0) + last.result.duration; if (weatherElapsed() < simulatedEnd) { weatherOffset = simulatedEnd; weatherEpoch = performance.now(); }
            const status = last.result.status;
            $('status').textContent = status === 'holed' ? 'Hole complete in the study model. Start a new hole when ready.' :
               ['water', 'out-of-bounds', 'outside-survey', 'unresolved-time-limit'].includes(status) ? 'Result recorded. Practice retry returns to the previous position; no competition scoring.' :
                  `Shot ${stroke} complete. Select Next shot to plan shot ${stroke + 1} from the ball’s finish.`;
            $('mapCaption').textContent = 'Result recorded · choose Next shot or replay'; showResult(); update();
         }
         function animate() { phase = 'animating'; anim = { t: 0, start: performance.now() }; $('status').textContent = 'Intent committed. Execution is automatic; Show result skips only the animation.'; update(); const duration = Math.max(3, Math.min(9, last.result.duration * .55)); const tick = now => { if (!anim) return; anim.t = C.animationElapsed(now, anim.start, duration, last.result.duration); draw(); updateWind(); if (anim.t >= last.result.duration) finishAnimation(); else frame = requestAnimationFrame(tick); }; if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finishAnimation(); return; } frame = requestAnimationFrame(tick); }
         function play() { if (journey.screen !== 3 || builderOpen || setupOpen || phase !== 'plan') return; cancelMapGesture(undefined, 'shot-commit'); try { last = S.run(course, day(), currentPlayer, getIntent(), seed++); records.push(last); practice = PA.appendShot(practice, records.length - 1, last); stroke = PA.summary(practice).counted; $('resultPanel').hidden = true; animate(); } catch (e) { $('status').textContent = 'Shot not run: ' + e.message; phase = 'plan'; update(); } }

         function planningMessage(message) {
            $('status').textContent = message; $('mapCaption').textContent = 'Click to place target · drag the target to refine · drag elsewhere to pan · Auto shot at each new shot';
         }
         function next() {
            if (journey.screen !== 3) return;
            if (phase === 'conceded') { resetTo(course.tee); return; }
            if (!last || phase !== 'resolved') return;
            const r = last.result, retry = ['water', 'out-of-bounds', 'outside-survey', 'unresolved-time-limit'].includes(r.status);
            if (r.status === 'holed') { resetTo(course.tee); return; }
            // Settled shots use the exact recorded finish, including height. Practice
            // retries retain the previous position and never silently relocate the ball.
            if (!retry) ball = C.clone(r.finish);
            stroke = PA.summary(practice).counted + 1; last = null; aim = Q.defaultAim(course, ball).point; phase = 'plan'; readyMapForShot();
            $('resultPanel').hidden = true; $('shape').value = 0; $('height').value = 0;
            autoClub(); fitCurrentShot();
            planningMessage(retry ? `Practice attempt ${stroke} ready from the previous position. No competition score.` :
               `Shot ${stroke} ready. Move the dot, choose your shot, then select Play this shot.`);
            update();
         }
         function primaryAction() {
            if (journey.screen !== 3) return;
            if (['resolved', 'conceded'].includes(phase)) next(); else if (phase === 'animating') finishAnimation(); else if (phase === 'plan') play();
         }
         function resetTo(p) { if (journey.screen !== 3) return false; practice = PA.begin(practice, 'new hole, setup or study position'); if (frame) cancelAnimationFrame(frame); anim = null; frame = null; ball = C.clone(p); aim = Q.defaultAim(course, ball).point; last = null; phase = 'plan'; stroke = 1; readyMapForShot(); $('resultPanel').hidden = true; $('shape').value = 0; $('height').value = 0; planningMessage('Practice setup; earlier records are retained in this page.'); autoClub(); fitCurrentShot(); update(); }
         function mulligan() {
            if (journey.screen !== 3 || builderOpen || setupOpen) return false;
            const ref = PA.candidate(practice, phase); if (!ref) return false;
            const original = records[ref.index];
            try { practice = PA.mulligan(practice, phase, original, ref.index); } catch (e) { $('status').textContent = e.message; return false; }
            if (frame) cancelAnimationFrame(frame); frame = null; anim = null; last = null; phase = 'plan';
            ball = C.clone(original.intent.start); aim = Q.defaultAim(course, ball).point; stroke = PA.summary(practice).counted + 1; readyMapForShot();
            for (const [id, value] of Object.entries({ club: original.intent.club, effort: original.intent.effort * 100, shape: original.intent.shape * 100, height: original.intent.height * 100 })) $(id).value = value;
            $('variance').checked = original.intent.variance !== false; $('resultPanel').hidden = true; fitCurrentShot();
            planningMessage('Mulligan: exact starting lie restored; aim reset to the cup. Adjust your shot settings. Original shot retained; the next commit uses a fresh seed and live wind.'); update(); return true;
         }
         function download(name, obj) { const b = new Blob([typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
         function view(center, zoom) { cancelMapGesture(undefined, 'view-change'); cameraMode = 'manual'; camera.x = center.x; camera.y = center.y; camera.zoom = zoom; syncCamera(); draw(); }
         function zoom(f, at) { cancelMapGesture(undefined, 'zoom-change'); cameraMode = 'manual'; const pos = at || { x: camera.w / 2, y: camera.h / 2 }, before = inverse(pos); camera.zoom = C.clamp(camera.zoom * f, SV.LIMITS.minZoom, SV.LIMITS.maxZoom); syncCamera(); const after = inverse(pos); camera.x += before.x - after.x; camera.y += before.y - after.y; draw(); }
         function compare() {
            const f = course.fixtures.laneLanding, a = course.terrain.authoredLayer.start, b = course.terrain.authoredLayer.end, L = C.hypot(a, b), ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, d = day(), source = C.clone(course); source.terrain.authoredLayer.enabled = false;
            const rows = []; for (const [name, q, p] of [['Shaped receiving side', course, f], ['Same entry / source ground', source, f], ['Too far left', course, { x: f.x - uy * 14, y: f.y + ux * 14 }], ['Ordinary fairway', course, course.fixtures.ordinaryLanding]]) { const launch = { position: { ...p, z: Q.heightAt(q, p) + S.R }, velocity: { x: ux * 8, y: uy * 8, z: 0 }, spin: { x: 0, y: 0, z: 0 }, mode: 'roll' }, r = S.simulate(q, d, launch); rows.push(`${name}: ${(r.total / .9144).toFixed(1)} yd · ${r.finalSurface} · ${r.status}`); }
            $('groundStudy').style.display = 'block'; $('groundStudy').textContent = 'Same incoming speed: 8 m/s, up the hole.\nThe first two use the exact same position and day.\n' + rows.join('\n') + '\nExperimental response—not a promised drive gain.';
         }

         function eventPosition(e) { const r = map.getBoundingClientRect(); return { x: (e.clientX - r.left) * camera.w / r.width, y: (e.clientY - r.top) * camera.h / r.height }; }
         function cancelMapGesture(pointerId, reason = 'cancelled') {
            if (!pan || (pointerId !== undefined && pointerId !== pan.pointer)) return;
            const id = pan.pointer; trace('gesture-cancel', { reason, pointerId: id, owner: pan.owner, distancePx: pan.moveDist }); pan = null; previewAim = null; map.style.cursor = 'crosshair';
            try { if (map.hasPointerCapture(id)) map.releasePointerCapture(id); } catch (_) { }
         }
         function pointerDetail(e) { return { pointerId: e.pointerId, pointerType: e.pointerType || 'mouse', client: [e.clientX, e.clientY], local: eventPosition(e), camera: { x: camera.x, y: camera.y, scale: camera.scale, zoom: camera.zoom, w: camera.w, h: camera.h, angle: camera.angle }, rect: (() => { const r = map.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; })(), capture: map.hasPointerCapture(e.pointerId) }; }
         map.addEventListener('pointerdown', e => {
            if (e.isPrimary === false) { cancelMapGesture(undefined, 'additional-pointer'); return; }
            const p = eventPosition(e), a = world(aim), targetHit = phase === 'plan' && mapMode === 'aim' && Math.hypot(p.x - a.x, p.y - a.y) <= MI.TARGET_HIT_RADIUS;
            const next = MI.begin(e, camera, { targetHit }); if (!next) { trace('press-rejected', { reason: 'non-primary-or-invalid', ...pointerDetail(e) }); return; }
            cancelMapGesture(undefined, 'new-primary-press'); pan = next; pan.startAim = C.clone(aim); pan.captureRequested = false;
            map.focus({ preventScroll: true });
            try { map.setPointerCapture(e.pointerId); pan.captureRequested = true; } catch (_) { trace('capture-unavailable', { pointerId: e.pointerId, policy: 'window release fallback; press remains valid' }); }
            trace('press', { ...pointerDetail(e), owner: pan.owner, threshold: pan.threshold, aimBefore: C.clone(aim) });
         });
         window.addEventListener('pointermove', e => {
            if (!pan || pan.pointer !== e.pointerId) { if (e.target === map) { const q = eventPosition(e), a = world(aim); map.style.cursor = mapMode === 'aim' && phase === 'plan' && Math.hypot(q.x - a.x, q.y - a.y) <= MI.TARGET_HIT_RADIUS ? 'grab' : 'crosshair'; } return; }
            pan = MI.move(pan, e); trace('move', { ...pointerDetail(e), owner: pan.owner, maximumMotionPx: pan.moveDist }); if (pan.moveDist <= pan.threshold) return;
            const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
            if (pan.owner === 'target' && phase === 'plan' && mapMode === 'aim') {
               previewAim = inverse(eventPosition(e)); map.style.cursor = 'grabbing'; draw();
            } else {
               cameraMode = 'manual'; map.style.cursor = 'grabbing';
               const before = V.inverse({ x: 0, y: 0 }, { ...camera, x: pan.cx, y: pan.cy }), after = V.inverse({ x: dx, y: dy }, { ...camera, x: pan.cx, y: pan.cy });
               camera.x = pan.cx + before.x - after.x; camera.y = pan.cy + before.y - after.y; draw();
            }
         });
         window.addEventListener('pointerup', e => {
            const result = MI.finish(pan, e); if (result.kind === 'ignore') return;
            const previous = pan, info = pointerDetail(e), pos = eventPosition(e), inside = pos.x >= 0 && pos.y >= 0 && pos.x <= camera.w && pos.y <= camera.h;
            // Explicitly released pending capture is a cancelled gesture; an unsupported
            // capture API is different and uses the window-owned release fallback.
            if (previous.captureRequested && !map.hasPointerCapture(e.pointerId)) { cancelMapGesture(e.pointerId, 'capture-released-before-up'); draw(); return; }
            pan = null; previewAim = null; map.style.cursor = 'crosshair';
            try { if (map.hasPointerCapture(e.pointerId)) map.releasePointerCapture(e.pointerId); } catch (_) { }
            trace('release', { ...info, action: result.kind, owner: previous.owner, distancePx: previous.moveDist, inside });
            if (!inside) { trace('input-rejected', { reason: 'released-outside-map' }); draw(); return; }
            if (result.kind === 'tap' || result.kind === 'target-drag') {
               const p = inverse(pos); if (mapMode === 'inspect') { inspectPoint(p); trace('inspection', { world: p }); }
               else if (!setAim(p, 'pointer')) trace('input-rejected', { reason: phase === 'plan' ? 'invalid-target' : 'not-planning', world: p, message: $('status').textContent });
            } else draw();
         });
         map.addEventListener('pointercancel', e => { cancelMapGesture(e.pointerId, 'pointercancel'); draw(); });
         map.addEventListener('lostpointercapture', e => { if (pan?.pointer === e.pointerId) { cancelMapGesture(e.pointerId, 'lostpointercapture'); draw(); } });
         window.addEventListener('blur', () => { cancelMapGesture(undefined, 'window-blur'); draw(); });
         document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMapGesture(undefined, 'page-hidden'); });
         map.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.14 : 1 / 1.14, eventPosition(e)); }, { passive: false });
         map.addEventListener('keydown', e => { const d = 5 / camera.zoom; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const target = mapMode === 'inspect' ? probe : aim; (() => { const q = world(target); q.x += (e.key === 'ArrowRight' ? d : e.key === 'ArrowLeft' ? -d : 0) * camera.scale; q.y += (e.key === 'ArrowDown' ? d : e.key === 'ArrowUp' ? -d : 0) * camera.scale; if (mapMode === 'inspect') inspectPoint(inverse(q)); else setAim(inverse(q), 'keyboard'); })(); } if (e.key === '+' || e.key === '=') zoom(1.25); if (e.key === '-') zoom(.8); });
         document.addEventListener('keydown', e => { if (e.key === 'Escape' && !builderOpen && !setupOpen) { cancelMapGesture(undefined, 'escape'); if (mapMode === 'inspect') setMapMode('aim'); else draw(); } });
         for (const k of S.clubs) { const o = document.createElement('option'); o.value = k.id; o.textContent = k.name; $('club').appendChild(o); }
         for (const id of ['club', 'effort', 'shape', 'height', 'variance', 'skin', 'zones', 'masks', 'routeLayer']) $(id).addEventListener('input', update);
         $('stockShot').onclick = () => { $('shape').value = 0; $('height').value = 0; update(); }; $('editPlayer').onclick = () => openBuilder();
         $('mulligan').onclick = mulligan; $('play').onclick = primaryAction; $('next').onclick = () => { next(); $('play').focus({ preventScroll: true }); $('play').scrollIntoView({ block: 'nearest', behavior: 'auto' }); }; $('replay').onclick = () => { if (last && phase === 'resolved') animate(); }; $('reset').onclick = () => resetTo(course.tee); $('approach').onclick = () => resetTo(course.fixtures.approach); $('putt').onclick = () => { resetTo(course.fixtures.greenStart); aim = C.clone(course.pin); autoClub(); fitCurrentShot(); update(); };
         $('frontApproach').onclick = () => resetTo({ x: course.greenCenter.x - 2, y: course.greenCenter.y - 30 });
         $('shotView').onclick = autoShotView;
         $('fit').onclick = () => view(fitCenter, 1); $('ballView').onclick = () => view(anim ? interpolate(last.result.trajectory, anim.t) : (last?.result.finish || ball), 3.5); $('greenView').onclick = () => view(course.greenCenter, 5); $('zoomIn').onclick = () => zoom(1.35); $('zoomOut').onclick = () => zoom(1 / 1.35); $('compare').onclick = compare;
         $('export').onclick = () => download('UCG50_Local_Shot_Evidence.json', { schema: 'ucg50-local-evidence/0.4.3', practice: C.clone(practice), roundSetup: C.clone(activeSetup), courseRevision: course.revision, player: P.toJSON(currentPlayer), records, learning: S.learning(records.filter((r, i) => r.golfer.id === currentPlayer.id && !PA.discarded(practice).has(i))), warning: 'Simulation only. No real-world golfer measurements.' });
         $('exportLast').onclick = () => { const r = records.at(-1); if (!r) { $('status').textContent = 'Play a shot before exporting it.'; return; } download('UCG50_Last_Shot.json', { schema: 'coursecraft-shot-diagnostic/0.4.3', practice: C.clone(practice), record: r }); };
         $('plateExport').onclick = () => download('Creek_and_Shoulder_Plate_Contract.json', nativeContract()); $('courseExport').onclick = () => download('Creek_and_Shoulder_Course_Contract.json', course);

         function updateWind() {
            const committed = phase !== 'plan' && last, wd = committed ? last.day : day(), elapsed = committed ? (anim ? anim.t : last.result.duration) : 0, w = W.atDay(wd, elapsed), v = W.presentation(w);
            $('windArrow').setAttribute('transform', `rotate(${v.rotation - (camera.angle || 0) * 180 / Math.PI} 60 60)`); $('windArrow').style.opacity = v.calm ? '0' : '1';
            $('windCompass').setAttribute('aria-label', v.description); $('windStrength').setAttribute('aria-label', v.description);
            $('windFill').style.width = (v.fraction * 100) + '%'; $('windDirectionText').textContent = v.calm ? 'Calm' : 'Toward ' + v.direction; $('windGust').textContent = w.gust ? 'Gust' : '';
            $('windHelp').textContent = phase === 'plan' ? 'Live wind · arrow shows where it is blowing. Judge the unmarked strength bar.' : anim ? 'Recorded wind at this moment in the shot · same on replay.' : 'Recorded wind at the end of this shot. Next shot returns to the live wind.';
         }
         function presentScreen(focus = true) {
            const n = journey.screen; builderOpen = n === 1; setupOpen = n === 2;
            for (const [id, num] of [['welcomeScreen', 0], ['playerBuilder', 1], ['roundSetup', 2], ['gameShell', 3]]) $(id).hidden = n !== num;
            $('entryHeader').hidden = n === 0 || n === 3; document.body.dataset.state = String(n); document.body.classList.toggle('playing', n === 3);
            $('journeyStep').textContent = 'State ' + n + ' · ' + UCGJourney.labels[n];
            $('cancelBuilder').hidden = !hasEntered; $('cancelSetup').hidden = !hasEntered; $('backToOpening').hidden = hasEntered;
            if (n !== 3) { cancelMapGesture(undefined, 'screen-change'); closeTerrainDialog(); }
            window.scrollTo(0, 0);
            if (n === 3) { resize(); update(); }
            if (focus) { const id = ['welcomeTitle', 'builderHeading', 'setupHeading', 'map'][n]; requestAnimationFrame(() => $(id).focus({ preventScroll: true })); }
            trace('screen', { screen: n });
         }
         function readSetupFields() { return { tee: $('teeChoice').value, pin: $('pinChoice').value, wind: $('windChoice').value, moisture: $('moistureChoice').value, towardDeg: Number($('windDirection').value) }; }
         function fillSetupFields(s) { for (const [id, key] of [['teeChoice', 'tee'], ['pinChoice', 'pin'], ['windChoice', 'wind'], ['moistureChoice', 'moisture'], ['windDirection', 'towardDeg']]) $(id).value = s[key]; }
         function resumeRound() {
            if (!hasEntered) return; pendingPlayer = null; playerDraft = C.clone(currentPlayer.configuration); setupDraft = null; journey = UCGJourney.transition(journey, 'cancel');
            populateActivePlayer(); populateConditions(); presentScreen();
         }
         function previewSetup() {
            try {
               const s = D.setup({ tee: $('teeChoice').value, pin: $('pinChoice').value, wind: $('windChoice').value, moisture: $('moistureChoice').value, towardDeg: Number($('windDirection').value) }), d = D.makeDay(course, s, roundWindSeed, 0), dir = W.presentation(W.state(10, s.towardDeg)).direction;
               $('setupSurfacePreview').textContent = `${d.name}: green reference ${d.greenStimpFt.toFixed(1)} ft; ${d.fairwayDescription.toLowerCase()} fairways. ${s.moisture === 'wet' ? 'Less bounce and shorter run.' : s.moisture === 'dry' ? 'More release and firmer bounce.' : 'The course’s baseline response.'}`;
               $('setupDirection').textContent = dir; $('windDirection').setAttribute('aria-valuetext', 'Blowing toward ' + dir); $('windDirection').disabled = s.wind === 'calm';
               $('setupWindNote').textContent = s.wind === 'strong' ? 'Strong wind normally moves around 20–25 mph, with occasional brief gusts reaching 40 mph. Direction also varies. The on-course display never gives the current exact speed.' : s.wind === 'calm' ? 'No wind. The compass arrow is hidden in calm conditions.' : 'Wind strength and direction vary gently. The compass and unmarked strength bar show the live conditions.';
               const selected = Q.selectSetup(course, s), pin = Q.pinAreaReport(selected); $('setupPinCheck').textContent = `${s.pin[0].toUpperCase() + s.pin.slice(1)} pin: ${pin.maxSlopeDeg.toFixed(2)}° maximum sampled slope across its 3 m neighborhood. ${Math.round(Q.holeLength(selected) / .9144)} yards from the ${s.tee} tee along the neutral route. Cup locations remain reviewable prototypes.`;
               $('startRound').disabled = false; $('setupStatus').textContent = hasEntered ? 'Applying a setup starts a new practice hole. Existing shot records remain unchanged.' : 'Your golfer is ready. Choose the conditions, then start.';
               return s;
            } catch (e) { $('startRound').disabled = true; $('setupStatus').textContent = e.message; return null; }
         }
         function openSetup() {
            if (phase === 'animating' || ![1, 3].includes(journey.screen)) return;
            if (journey.screen === 3) { pendingPlayer = null; playerDraft = C.clone(currentPlayer.configuration); setupDraft = C.clone(activeSetup); journey = UCGJourney.transition(journey, 'edit-setup'); }
            else journey = UCGJourney.transition(journey, 'setup', P.validate(playerDraft).passed);
            if (journey.screen !== 2) return;
            fillSetupFields(setupDraft || activeSetup); presentScreen(); previewSetup();
         }
         function populateConditions() {
            syncTeeStrip(); $('holeYardage').textContent = Math.round(Q.holeLength(course) / .9144); const d = D.makeDay(course, activeSetup, roundWindSeed, 0), wind = W.regimes[activeSetup.wind].label;
            $('roundHeadline').textContent = `${wind} wind · ${d.name} ground`; $('roundSubline').textContent = `Greens ${d.greenStimpFt.toFixed(1)} ft Stimp reference · ${d.fairwayDescription.toLowerCase()} fairways`;
            $('roundPreferenceLine').textContent = `${activeSetup.tee[0].toUpperCase() + activeSetup.tee.slice(1)} tee · ${activeSetup.pin} pin`;
            $('activeConditions').textContent = `${wind} wind, ${d.name.toLowerCase()} ground. Today’s model green speed: ${d.greenStimpFt.toFixed(1)} ft. Fairways: ${d.fairwayDescription.toLowerCase()}.`;
         }
         function startRound() {
            if (journey.screen !== 2) return; const chosen = previewSetup(); if (!chosen) return;
            if (pendingPlayer) { currentPlayer = pendingPlayer; pendingPlayer = null; }
            try { localStorage.setItem(P.STORAGE_KEY, JSON.stringify(P.toJSON(currentPlayer))); storageNotice = 'Golfer saved in this browser. Export for a portable copy.'; } catch (e) { storageNotice = 'Browser storage is unavailable. Your golfer works in this page; use Export golfer to keep a copy.'; }
            activeSetup = C.clone(chosen); Object.assign(course, Q.selectSetup(course, chosen)); terrainCache = null; meshCache = null; roundWindSeed = (roundWindSeed + 101) >>> 0; weatherOffset = 0; weatherEpoch = performance.now(); setupOpen = false; builderOpen = false; hasEntered = true; journey = UCGJourney.transition(journey, 'play', true); setupDraft = null; $('roundSetup').hidden = true; $('playerBuilder').hidden = true; $('gameShell').hidden = false; document.body.classList.add('playing');
            presentScreen(false); populateActivePlayer(); populateConditions(); resize(); resetTo(course.tee); setTerrainMode(false); planningMessage('Your round is ready. Read the wind, inspect the terrain, then choose your shot.'); $('saveNotice').textContent = storageNotice; update(); window.scrollTo(0, 0); requestAnimationFrame(() => map.focus({ preventScroll: true }));
         }

         function tableYardages(id, rows) { const body = $(id); body.replaceChildren(); for (const k of rows) { const tr = document.createElement('tr'), name = document.createElement('td'), num = document.createElement('td'); name.textContent = k.name; num.textContent = Math.round(k.carryYards); tr.append(name, num); body.append(tr); } }
         function populateActivePlayer() {
            $('currentPlayerName').textContent = currentPlayer.displayName; $('currentPlayerStyle').textContent = P.styleLabel(currentPlayer);
            $('currentPlayerStrengths').textContent = 'Strengths: ' + P.strengths(currentPlayer).join(' and ') + '.'; tableYardages('activeYardages', S.stockYardages(currentPlayer));
         }
         function synchronizeBuilder() {
            $('playerName').value = playerDraft.name; $('stockCurve').value = playerDraft.style.curve; $('stockFlight').value = playerDraft.style.flight;
            for (const s of P.skills) { $('points-' + s.id).value = playerDraft.points[s.id]; $('range-' + s.id).value = playerDraft.points[s.id]; }
            renderBuilder();
         }
         function renderBuilder() {
            const check = P.validate(playerDraft); $('pointsTotal').textContent = check.total;
            $('pointsTotal').parentElement.classList.toggle('bad', !check.passed);
            $('budgetFill').style.width = Math.min(100, check.total) + '%'; $('budgetFill').classList.toggle('bad', check.total > 100);
            $('budgetStatus').textContent = check.passed ? 'All 100 points allocated.' : check.errors.join(' ');
            $('enterGame').disabled = !check.passed; $('exportPlayer').disabled = !check.passed;
            $('previewName').textContent = typeof playerDraft.name === 'string' ? playerDraft.name || 'Your golfer' : 'Your golfer';
            if (previewTimer) clearTimeout(previewTimer);
            if (!check.passed) { $('previewCarry').textContent = 'Complete a valid 100-point allocation to refresh your yardage card.'; $('previewYardages').replaceChildren(); $('previewStyle').textContent = ''; $('previewStrengths').textContent = ''; return; }
            const p = P.build(playerDraft); $('previewStyle').textContent = P.styleLabel(p); $('previewStrengths').textContent = 'Strengths: ' + P.strengths(p).join(' and ') + '.';
            // Batch rapid slider input into one small reference calculation. It uses no network.
            $('previewCarry').textContent = 'Updating model reference…'; previewTimer = setTimeout(() => { if (!P.validate(playerDraft).passed || P.build(playerDraft).revision !== p.revision) return; const y = S.stockYardages(p); tableYardages('previewYardages', y); $('previewCarry').textContent = `Stock driver carry: ${Math.round(y[0].carryYards)} yards · calm, flat model reference.`; }, 70);
         }
         function openBuilder() {
            if (phase === 'animating' || ![0, 2, 3].includes(journey.screen)) return;
            const from = journey.screen;
            if (from === 2) { setupDraft = readSetupFields(); journey = UCGJourney.transition(journey, 'back'); }
            else if (from === 3) { setupDraft = C.clone(activeSetup); playerDraft = C.clone(currentPlayer.configuration); pendingPlayer = null; journey = UCGJourney.transition(journey, 'edit-profile'); }
            else journey = UCGJourney.transition(journey, 'profile');
            $('enterGame').textContent = 'Proceed to course setup.';
            $('profileNotice').textContent = hasEntered ? 'Applying a new profile and setup starts a new practice hole. Keep current round discards these edits; original shot records stay intact.' : storageNotice;
            synchronizeBuilder(); presentScreen();
         }
         function enterGame() { if (journey.screen !== 1) return; const check = P.validate(playerDraft); if (!check.passed) { renderBuilder(); return; } pendingPlayer = P.build(playerDraft); openSetup(); }

         function initBuilder() {
            try { const raw = localStorage.getItem(P.STORAGE_KEY); if (raw) { currentPlayer = P.parse(raw); playerDraft = C.clone(currentPlayer.configuration); storageNotice = 'Your saved golfer is loaded for review. It stays on this browser; nothing is uploaded.'; } else storageNotice = 'Start balanced or choose a preset. Your accepted golfer will be saved locally.'; }
            catch (e) { storageNotice = 'No usable saved golfer was loaded. Start here, or import an exported player file.'; }
            for (const s of P.skills) {
               const row = document.createElement('div'); row.className = 'skill-row';
               const title = document.createElement('div'); title.className = 'skill-title'; const label = document.createElement('label'); label.htmlFor = 'points-' + s.id; label.textContent = s.name;
               const n = document.createElement('input'); n.id = 'points-' + s.id; n.type = 'number'; n.min = 0; n.max = 100; n.step = 1; n.setAttribute('aria-label', s.name + ' points');
               title.append(label, n); const text = document.createElement('p'); text.id = 'help-' + s.id; text.textContent = s.text;
               const r = document.createElement('input'); r.id = 'range-' + s.id; r.type = 'range'; r.min = 0; r.max = 100; r.step = 1; r.setAttribute('aria-label', s.name + ' allocation'); r.setAttribute('aria-describedby', text.id); n.setAttribute('aria-describedby', text.id);
               function change(e) { const val = e.target.value === '' ? NaN : Number(e.target.value); playerDraft.points[s.id] = val; if (e.target === r) n.value = val; else if (Number.isFinite(val) && val >= 0 && val <= 100) r.value = val; renderBuilder(); }
               n.addEventListener('input', change); r.addEventListener('input', change); row.append(title, text, r); $('skillRows').append(row);
            }
            for (const b of document.querySelectorAll('[data-preset]')) b.onclick = () => { playerDraft.points = C.clone(P.presets[b.dataset.preset]); synchronizeBuilder(); };
            $('clearPoints').onclick = () => { for (const s of P.skills) playerDraft.points[s.id] = 0; synchronizeBuilder(); };
            $('playerName').oninput = () => { playerDraft.name = $('playerName').value; renderBuilder(); };
            $('stockCurve').oninput = () => { playerDraft.style.curve = Number($('stockCurve').value); renderBuilder(); };
            $('stockFlight').oninput = () => { playerDraft.style.flight = Number($('stockFlight').value); renderBuilder(); };
            $('enterGame').onclick = enterGame;
            $('cancelBuilder').onclick = resumeRound;
            $('exportPlayer').onclick = () => { try { download('UCG50_My_Golfer.json', P.toJSON(P.build(playerDraft))); } catch (e) { $('profileNotice').textContent = e.message; } };
            $('importPlayer').onclick = () => $('playerFile').click();
            $('playerFile').onchange = async () => { const file = $('playerFile').files[0]; if (!file) return; try { if (file.size > 50000) throw Error('Player file must be smaller than 50 KB.'); const p = P.parse(await file.text()); playerDraft = C.clone(p.configuration); synchronizeBuilder(); $('profileNotice').textContent = 'Golfer imported for review. Proceed to course setup to use this profile.'; } catch (e) { $('profileNotice').textContent = 'Import rejected: ' + e.message; } finally { $('playerFile').value = ''; } };
            $('profileNotice').textContent = storageNotice; synchronizeBuilder(); populateActivePlayer();
         }

         function chooseGround(enabled) {
            if (phase === 'animating') return;
            if (course.terrain.authoredLayer.enabled === enabled) return;
            course.terrain.authoredLayer.enabled = enabled; course.revision = '0.5.0-photo-layout.1-' + (enabled ? 'shaped' : 'source'); terrainCache = null; meshCache = null;
            $('laneStatus').textContent = enabled ? 'Authored shoulder active. A new practice hole has started.' : 'Adapted base ground without the authored shoulder. Original survey files remain unchanged.';
            resetTo(course.tee); populateConditions(); update();
         }
         function closeTerrainDialog() { const d = $('terrainDialog'); if (d.open) d.close(); $('terrainPanelSlot').appendChild($('terrainPanel')); drawTerrainMesh(); }
         $('laneOn').onclick = () => chooseGround(true); $('laneOff').onclick = () => chooseGround(false);
         $('terrainExpand').onclick = () => { setMapMode('inspect'); $('terrainDialogBody').appendChild($('terrainPanel')); $('terrainDialog').showModal(); drawTerrainMesh(); };
         $('closeTerrainDialog').onclick = closeTerrainDialog; $('terrainDialog').addEventListener('close', () => { if ($('terrainPanel').parentElement.id === 'terrainDialogBody') $('terrainPanelSlot').appendChild($('terrainPanel')); drawTerrainMesh(); });
         $('profileDetails').addEventListener('toggle', resize);

         // Export the very same compositor as local plates/tiles; no UI layers baked in.
         function renderPlate(bounds, ppm = 4) {
            if (!nativePlate.ready()) throw Error('Materials are not ready');
            if (!bounds || ![bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, ppm].every(Number.isFinite) || bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY || ppm <= 0 || ppm > 256) throw Error('Invalid plate bounds or density');
            const w = Math.round((bounds.maxX - bounds.minX) * ppm), h = Math.round((bounds.maxY - bounds.minY) * ppm);
            if (w < 16 || h < 16 || w * h > 16777216) throw Error('Plate tile exceeds the 16 megapixel limit; split into smaller tiles');
            const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
            const cam = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2, scale: ppm, angle: 0, w, h, zoom: 1 };
            nativePlate.paint(cx, course, cam, 1); const out = { dataURL: cv.toDataURL('image/png'), width: w, height: h, worldBounds: C.clone(bounds), pixelsPerMetre: ppm, worldToPixel: [ppm, 0, 0, -ppm, -bounds.minX * ppm, bounds.maxY * ppm], geometryFingerprint: C.fingerprint(Q.physicsSnapshot(course)), photographicOverview: true, proceduralTurfDetail: true, overlaysPainted: false };
            cv.width = cv.height = 1; return out;
         }

         function syncTeeStrip() {
            for (const name of ['blue', 'white', 'red']) { const el = $('quickTee-' + name); if (!el) continue; const t = Q.selectSetup(course, { tee: name, pin: activeSetup.pin }); el.querySelector('strong').textContent = Math.round(Q.holeLength(t) / .9144); el.setAttribute('aria-pressed', String(name === activeSetup.tee)); el.disabled = phase === 'animating'; }
         }
         function syncQuickReadout() {
            const cur = GP.restingBall(ball, last, phase), q = terrainOn ? probe : cur, t = T.point(course, q);
            $('quickElevation').textContent = (t.z / .3048).toFixed(1) + ' ft'; $('quickSlope').textContent = t.gradePercent.toFixed(1) + '%'; $('quickSurface').textContent = t.surface.replace('deep-rough', 'Deep rough');
            $('quickTerrainCaption').textContent = terrainOn ? 'At the terrain probe' : 'At your ball';
         }
         for (const name of ['blue', 'white', 'red']) $('quickTee-' + name).onclick = () => { openSetup(); $('teeChoice').value = name; previewSetup(); };
         $('terrainShortcut').onclick = () => { setMapMode('inspect'); syncQuickReadout(); };


         function gimme() {
            const cur = GP.restingBall(ball, last, phase), context = { phase, surface: Q.surfaceAt(course, cur).type, status: last?.result.status, lie: C.clone(cur), pin: C.clone(course.pin), courseFingerprint: C.fingerprint(Q.physicsSnapshot(course)) };
            if (journey.screen !== 3 || builderOpen || setupOpen || !PA.canConcede(practice, context)) return false;
            cancelMapGesture(undefined, 'gimme'); practice = PA.concede(practice, context); ball = C.clone(cur); phase = 'conceded'; stroke = PA.summary(practice).counted;
            $('resultPanel').hidden = true; $('status').textContent = 'Gimme accepted: one conceded practice stroke. The ball and original shot evidence were not changed. Start a new hole when ready.';
            trace('gimme', { lie: cur, pin: C.clone(course.pin), practiceSummary: PA.summary(practice) }); update(); return true;
         }
         $('gimme').onclick = gimme;

         // Deliberate offline test surface, no network or hidden real-player inference.
         window.UCGLab = { getState: () => ({ screen: journey.screen, hasEntered, setup: C.clone(activeSetup), setupOpen, terrainOn, mapMode, gestureActive: !!pan, previewAim: C.clone(previewAim), probe: C.clone(probe), ball: C.clone(ball), aim: C.clone(aim), phase, stroke, records: C.clone(records), camera: C.clone(camera), cameraMode, practice: C.clone(practice), practiceSummary: PA.summary(practice), shotFrameInfo: C.clone(shotFrameInfo), presentationVersion: 'ucg50-play/0.6.0', player: C.clone(currentPlayer), builderOpen }), setAim, play, next, mulligan, gimme, finishAnimation, resetTo, compare, world, inverse, view, autoShotView, resize, chooseGround, course, day, startRound, openSetup, openBuilder, enterGame, setTerrainMode, setMapMode, inspectPoint, weatherElapsed, renderPlate, nativeContract, diagnostics, renderStats: () => nativePlate.stats(), draw, plateReady: () => nativePlate.ready(), validate: () => Q.validate(course) };
         $('exportDiagnostic').onclick = () => download('UCG50_Input_Diagnostic_R06.json', diagnostics());
         for (const id of ['teeChoice', 'pinChoice', 'windChoice', 'moistureChoice', 'windDirection']) $(id).addEventListener('input', previewSetup);
         $('startRound').onclick = startRound; $('editConditions').onclick = openSetup; $('editConditionsSide').onclick = openSetup;
         $('cancelSetup').onclick = resumeRound;
         $('backToGolfer').onclick = openBuilder;
         $('terrainToggle').onclick = () => setTerrainMode(!terrainOn);
         $('aimMode').onclick = () => setMapMode('aim'); $('inspectMode').onclick = () => setMapMode('inspect');
         $('terrainClose').onclick = () => { setMapMode('aim'); $('aimMode').focus({ preventScroll: true }); };
         $('probeBall').onclick = () => inspectPoint(last ? last.result.finish : ball); $('probeAim').onclick = () => inspectPoint(aim); $('probeGreen').onclick = () => { inspectPoint(course.greenCenter); view(course.greenCenter, 5); };
         for (const id of ['terrainLayer', 'terrainRadius', 'terrainYaw', 'terrainExaggeration']) $(id).addEventListener('input', () => { draw(); drawTerrainMesh(); });
         setInterval(() => { if (journey.screen === 3 && !builderOpen && !setupOpen && phase === 'plan' && !document.hidden) updateWind(); }, 200);
         initBuilder(); autoClub(); window.addEventListener('resize', resize); new ResizeObserver(() => resize()).observe(map.parentElement); resize(); update();
         // Each fresh visit begins with State 0, including when a valid profile is saved.
         $('proceedProfile').onclick = e => { e.preventDefault(); openBuilder(); };
         $('backToOpening').onclick = () => { if (journey.screen !== 1 || hasEntered) return; journey = UCGJourney.transition(journey, 'back'); presentScreen(); };
         presentScreen(false);
      })();
