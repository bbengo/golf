import { CourseView } from './course-view.js';

const PlateAssets = { "scene": {}, "images": {}, "retainedModuleOnly": true };

      /* Coursecraft photographic compositor 0.5.0.
       * Single isotropic photograph frame; no post-registration shear. A separately
       * versioned authored course owns every physical query. At close range, short
       * grass gets native-scale procedural microstructure, not false image upscaling.
       * The macro photograph is a prior model-generated landscape, not survey data.
       */
      const PhotoRenderer = ((factory) => factory())(function () {
         'use strict';
         const VERSION = 'photographic-course/0.5.0';
         const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
         function matrix(c) { const co = Math.cos(c.angle || 0), si = Math.sin(c.angle || 0), s = c.scale; return [co * s, -si * s, -si * s, -co * s, c.w / 2 - s * (co * c.x - si * c.y), c.h / 2 + s * (si * c.x + co * c.y)]; }
         function create(data, onReady) {
            const manifest = data.manifest, images = {}, patterns = new Map(), paths = new Map(); let readyCount = 0, failedCount = 0, builds = 0, hits = 0, lastStats = {}, cacheKey = '', pathVersion = '';
            const names = Object.keys(data.images); for (const name of names) { const im = new Image(); im.onload = () => { readyCount++; cacheKey = ''; if (onReady) onReady(); }; im.onerror = () => { failedCount++; cacheKey = ''; if (onReady) onReady(); }; images[name] = im; im.src = data.images[name]; }
            const buffer = document.createElement('canvas');
            function ready() { return readyCount === names.length && failedCount === 0; }
            function updatePaths(c) { const version = c.id + ':' + c.revision; if (pathVersion === version) return; paths.clear(); for (const s of c.surfaces) { const p = new Path2D(); s.polygon.forEach((q, i) => i ? p.lineTo(q.x, q.y) : p.moveTo(q.x, q.y)); p.closePath(); paths.set(s.id, p); } pathVersion = version; }
            function atWorld(ctx, im, b) { ctx.save(); ctx.translate(b.minX, b.maxY); ctx.scale((b.maxX - b.minX) / im.width, -(b.maxY - b.minY) / im.height); ctx.drawImage(im, 0, 0); ctx.restore(); }
            function material(ctx, kind, ppm) { let n = 128; for (const v of [128, 256, 512, 1024]) { n = v; if (v >= ppm * 2) break; } const key = kind + '_' + n + '.png', im = images[key]; if (!im?.naturalWidth) return null; if (patterns.has(key)) return patterns.get(key); const p = ctx.createPattern(im, 'repeat'); p.setTransform(new DOMMatrix([2 / n, 0, 0, 2 / n, 0, 0])); patterns.set(key, p); return p; }
            function paint(ctx, c, cam, dpr) {
               const t = performance.now(), f = Math.min(dpr || 1, 2), w = Math.round(cam.w * f), h = Math.round(cam.h * f), key = JSON.stringify([cam.x, cam.y, cam.scale, cam.angle, cam.w, cam.h, f, c.id, c.revision, readyCount]);
               if (key !== cacheKey) {
                  builds++; if (buffer.width !== w || buffer.height !== h) { buffer.width = w; buffer.height = h; } const bc = buffer.getContext('2d'); bc.setTransform(f, 0, 0, f, 0, 0); bc.clearRect(0, 0, cam.w, cam.h); bc.save(); bc.transform(...matrix(cam));
                  const V = CourseView, vb = V.visibleBounds(cam, c.bounds); bc.fillStyle = '#50633b'; bc.fillRect(vb.minX - 100, vb.minY - 100, vb.maxX - vb.minX + 200, vb.maxY - vb.minY + 200);
                  const photo = images['landscape.jpg']; if (photo?.naturalWidth) atWorld(bc, photo, manifest.photo.worldBounds);
                  updatePaths(c); const ppm = cam.scale * f; const detail = smooth((cam.scale - 3) / 10), greenBlend = smooth((cam.scale - 5) / 12);
                  const macro = images['green_colour_field.png'];
                  for (const s of c.surfaces) {
                     if (!['green', 'fringe', 'fairway', 'tee'].includes(s.type)) continue; const path = paths.get(s.id); bc.save(); bc.clip(path);
                     if (s.type === 'green' && macro?.naturalWidth && greenBlend > 0) { bc.globalAlpha = greenBlend; atWorld(bc, macro, manifest.greenColour.worldBounds); bc.globalAlpha = 1; }
                     if (detail > 0) { const mat = material(bc, s.type === 'green' ? 'green' : 'fairway', ppm); if (mat) { bc.globalCompositeOperation = 'overlay'; bc.globalAlpha = detail * (s.type === 'green' ? .42 : .28); bc.fillStyle = mat; bc.fillRect(vb.minX - 5, vb.minY - 5, vb.maxX - vb.minX + 10, vb.maxY - vb.minY + 10); } }
                     bc.restore();
                  }
                  // On the green, very fine mowing direction is redrawn at the current scale.
                  // It is cosmetic, not friction anisotropy or a modification to the DEM.
                  if (greenBlend > 0) {
                     const green = c.surfaces.find(s => s.type === 'green'); bc.save(); bc.clip(paths.get(green.id)); bc.globalAlpha = .026 * greenBlend; bc.fillStyle = '#eaf0b8'; for (let y = Math.floor(vb.minY / 1.1) * 1.1; y < vb.maxY + 1.1; y += 1.1)bc.fillRect(vb.minX, y, vb.maxX - vb.minX, .52); bc.restore();
                     bc.save(); bc.globalAlpha = .3 * greenBlend; bc.strokeStyle = '#677d3e'; bc.lineWidth = .045; bc.stroke(paths.get(green.id)); bc.restore();
                  }
                  bc.restore(); cacheKey = key; lastStats = { renderer: VERSION, photographicOverview: true, proceduralTurfDetail: true, postWarp: false, sourcePixelsPerM: 1 / manifest.photo.metresPerPixel, detailPixelsPerM: 512, devicePixelsPerM: ppm, detailActive: detail > 0, greenColourReconstruction: greenBlend, materialUnderSampling: ppm > 512 ? ['turf'] : [], macroPhotoLimitIsNotHidden: true, objectsDrawn: 0, syntheticMaterials: false, frameMs: performance.now() - t };
               } else hits++;
               ctx.drawImage(buffer, 0, 0, w, h, 0, 0, cam.w, cam.h);
            }
            function stats() { return { ...lastStats, bufferBuilds: builds, bufferHits: hits, bufferBytes: buffer.width * buffer.height * 4, loadedImageCount: readyCount, failedImageCount: failedCount, imagesReady: ready(), spriteCacheBytes: 0, spriteCacheLimitBytes: 0, sourceSurfaceCount: paths.size }; }
            return { paint, ready, stats, scene: manifest, surfacePaths: paths, dispose: () => { buffer.width = buffer.height = 1; patterns.clear(); paths.clear(); } };
         }
         return { VERSION, matrix, create };
      });

      /* Self-contained, no network access required by the delivered game. */
      const PhotoAssets = { "manifest": { "schema": "photo-assets/0.5.0", "source": { "file": "approved_photo.png", "sha256": "1857c88789eecec560adb6d559c28dac3e7ff36528a0c2764d78d5d2cd6ef122", "native": [856, 1836], "kind": "previously approved model-generated landscape, not aerial survey photograph" }, "photo": { "file": "landscape.jpg", "width": 2456, "height": 2736, "worldBounds": { "minX": -240, "maxX": 496.79999999999995, "minY": -135, "maxY": 685.8 }, "metresPerPixel": 0.3, "postWarp": false, "localCleanup": "one extra mown rectangle; 3 physical tees remain", "context": "photo-patch extension only; no new photographic detail claimed" }, "detail": { "kind": "procedural turf microstructure over preserved macro appearance", "pixelsPerMetre": 512, "metresPerRepeat": 2, "maximumPhotoDetailClaim": false }, "greenColour": { "file": "green_colour_field.png", "worldBounds": { "minX": 142.5, "maxX": 216, "minY": 474.29999999999995, "maxY": 529.8 }, "kind": "smooth colour reconstruction from existing green; not new source photo pixels" }, "courseSHA256": "fec775c926e4fdde4be2be3c20e6c8ea463883c8b2c099a50d74239a15a8ed90", "files": { "course_photo.jpg": "4e9da92209ceeb8b65ea865da45d185818b60a3a18f5882ecce101fe72aca2f3", "fairway_1024.png": "cbc741042757b014136399b78adc2dc3694afd576c53702daec32798e5b167ca", "fairway_128.png": "f1e1e9fac4dc7919100d29b52f17439fad0e8ad0ef68a9e780db43fa7023e9c4", "fairway_256.png": "26220099d3794b59c0f7c7d250b244dee0e404deb0b8e7be0fc775556740bad1", "fairway_512.png": "1ef020bb30609071b0946109626364ac3c8fc6f68a4deea3e1562d7032b90996", "green_1024.png": "7da4f5f34ef8c253eeb4040236ec755de0b09134e85cc5dded49e19b1fb89d59", "green_128.png": "b2469b1244e9a595115f89d25d71d523464db0a5cfcc6eb07b19128e0cb293c6", "green_256.png": "2584125f043a139da2b7d69a0db86762d1466dc43c93af52faed0a3f4f2f1030", "green_512.png": "764c1773c3314480482c45d0c16f0c51a5bb7d44cc9cd85c6f4003132c74c248", "green_colour_field.png": "cbc0d6a2030ad765b738c7f2c4320f9a77dac1c200129bf8e21884728b488d93", "landscape.jpg": "16130af1e4d412eb3868bc6c0bfdaaaffa6490e41760234cb6c9b69fdaef213d", "rectangle_cleanup_mask.png": "bdc123380cf2042f0ce37b4428be6846a8366e146138a6cec487a54df0f3cac2", "rough_1024.png": "ea4ede25c3cc792f9e73c89c593c2bf77c499386564fe926116a4f8a0a8e7280", "rough_128.png": "d66780d20d2607452d424b6cb125e145652c624a9c24154c396c9701033621f5", "rough_256.png": "8e97f0696d484e7ca667a0ca7ea117fdafef7f49a088503c7251fef45f706911", "rough_512.png": "1970464d39960baa2a5844d91350092de64871e68ff8fe0304cc5c3ee4dff6ec" } }, "images": { "fairway_1024.png": "/assets/reference/cbc741042757b014.png", "fairway_128.png": "/assets/reference/f1e1e9fac4dc7919.png", "fairway_256.png": "/assets/reference/26220099d3794b59.png", "fairway_512.png": "/assets/reference/1ef020bb30609071.png", "green_1024.png": "/assets/reference/7da4f5f34ef8c253.png", "green_128.png": "/assets/reference/b2469b1244e9a595.png", "green_256.png": "/assets/reference/2584125f043a139d.png", "green_512.png": "/assets/reference/764c1773c3314480.png", "green_colour_field.png": "/assets/reference/cbc0d6a2030ad765.png", "landscape.jpg": "/assets/reference/16130af1e4d412eb.jpg" }, "buildFingerprint": "b078e50d57efc30a31cd4a61f53d1295c0d01f2bc047508b8fd7329983aaf513" };

export { PhotoRenderer, PhotoAssets };
