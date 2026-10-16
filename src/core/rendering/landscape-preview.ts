import { gradeDaylightPixels } from './daylight-grade';
import {
   landscapeFootprint,
   paddedLandscape,
   containsLandscape,
   landscapeBackdrop,
} from './landscape-coverage';
import type { Bounds } from './camera';
import { pickLandscape } from './landscape-projection';
import { Course } from '../course/course.js';
import { CourseAtlas } from './course-atlas';
import { landscapeMesh } from './landscape-mesh';
import { DAYLIGHT, type Daylight } from './daylight';
import type { CockpitSession } from '../session/cockpit-session';
/** An isolated, depth-tested WebGL study. It never changes aim, ball or round state. */
export async function openLandscapePreview(course: CockpitSession['course'], daylight: Daylight) {
   if (document.getElementById('landscapePreview')) return;
   const previous = document.activeElement as HTMLElement | null;
   const dialog = document.createElement('dialog');
   dialog.id = 'landscapePreview';
   dialog.className = 'landscape-preview';
   dialog.setAttribute('aria-labelledby', 'landscapePreviewTitle');
   dialog.innerHTML = `<canvas tabindex="0" aria-label="Angled landscape preview. Drag to orbit; Shift-drag to pan; scroll to zoom. Use arrow keys to orbit, plus or minus to zoom."></canvas><header><div><p class="hud-eyebrow">LANDSCAPE STUDY</p><h1 id="landscapePreviewTitle">A different perspective.</h1><p>Preview only. Your round stays in the overhead view.</p></div><button type="button" aria-label="Return to game options">Back to options</button></header><nav aria-label="Landscape viewpoints"></nav><p class="preview-status" role="status">Preparing terrain and woodland...</p><footer>Double-click ground to explore &middot; Drag to orbit &middot; Shift-drag to pan &middot; Scroll to zoom &middot; Arrow keys to orbit &middot; + / - to zoom &middot; Escape to return</footer>`;
   document.body.append(dialog);
   dialog.showModal();
   const canvas = dialog.querySelector('canvas')!,
      status = dialog.querySelector<HTMLElement>('.preview-status')!;
   let closed = false,
      frame = 0;
   const resources: {
      buffer?: WebGLBuffer;
      backdrop?: WebGLBuffer;
      backdropTexture?: WebGLTexture;
      texture?: WebGLTexture;
      program?: WebGLProgram;
      shaders: WebGLShader[];
   } = {
      shaders: [],
   };
   const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
   const cleanup = () => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(frame);
      if (gl) {
         if (resources.backdropTexture) gl.deleteTexture(resources.backdropTexture);
         if (resources.backdrop) gl.deleteBuffer(resources.backdrop);
         if (resources.buffer) gl.deleteBuffer(resources.buffer);
         if (resources.texture) gl.deleteTexture(resources.texture);
         if (resources.program) gl.deleteProgram(resources.program);
         for (const shader of resources.shaders) gl.deleteShader(shader);
         gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      dialog.remove();
      previous?.focus();
   };
   dialog.addEventListener('close', cleanup, { once: true });
   dialog.querySelector('button')!.onclick = () => dialog.close();
   if (!gl) {
      status.textContent =
         'This browser could not start the angled preview. The overhead game remains available.';
      return;
   }
   canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      if (!closed)
         status.textContent =
            'The graphics context was lost. Return to options and reopen the preview.';
   });
   try {
      const compile = (type: number, source: string) => {
         const shader = gl.createShader(type)!;
         resources.shaders.push(shader);
         gl.shaderSource(shader, source);
         gl.compileShader(shader);
         if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw Error('Preview shader failed');
         return shader;
      };
      const program = gl.createProgram()!;
      resources.program = program;
      gl.attachShader(
         program,
         compile(
            gl.VERTEX_SHADER,
            `attribute vec3 position;attribute vec3 normal;attribute vec3 colour;uniform vec3 centre;uniform vec4 view;uniform vec3 sun;uniform vec4 bounds;varying vec3 tint;varying vec2 uv;varying vec2 extent;varying float terrain;varying float lighting;
 void main(){extent=bounds.zw-bounds.xy;vec3 p=position-centre;float co=cos(view.x),si=sin(view.x);float x=co*p.x-si*p.y,y=si*p.x+co*p.y;float sy=sin(view.y),cy=cos(view.y);gl_Position=vec4(x/(view.z*view.w),(y*sy+p.z*cy)/view.z,(y*cy-p.z*sy)/32000.0,1.0);float light=0.60+0.40*max(0.0,dot(normalize(normal),normalize(sun)));tint=colour*light;lighting=light;terrain=colour.r<0.0?1.0:0.0;uv=vec2((position.x-bounds.x)/(bounds.z-bounds.x),(bounds.w-position.y)/(bounds.w-bounds.y));}`,
         ),
      );
      gl.attachShader(
         program,
         compile(
            gl.FRAGMENT_SHADER,
            `precision mediump float;varying vec3 tint;varying vec2 uv;varying vec2 extent;varying float terrain;varying float lighting;uniform sampler2D ground;uniform float edgeFade;void main(){vec2 edge=min(uv,1.0-uv)*extent;float alpha=edgeFade>0.5?smoothstep(0.0,96.0,min(edge.x,edge.y)):1.0;gl_FragColor=vec4(terrain>0.5?texture2D(ground,uv).rgb*lighting:tint,alpha);}`,
         ),
      );
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Preview linking failed');
      gl.useProgram(program);
      await new Promise((resolve) => setTimeout(resolve, 30));
      if (closed) return;
      const ground = new CourseAtlas().groundTexture(course, daylight);
      const textureLimit = Math.min(2048, gl.getParameter(gl.MAX_TEXTURE_SIZE));
      const ratio = Math.min(1, textureLimit / Math.max(ground.canvas.width, ground.canvas.height));
      let textureSource = ground.canvas;
      if (ratio < 1) {
         textureSource = document.createElement('canvas');
         textureSource.width = Math.max(1, Math.floor(ground.canvas.width * ratio));
         textureSource.height = Math.max(1, Math.floor(ground.canvas.height * ratio));
         textureSource
            .getContext('2d')!
            .drawImage(ground.canvas, 0, 0, textureSource.width, textureSource.height);
      }
      const texture = gl.createTexture()!;
      resources.texture = texture;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSource);
      ground.canvas.width = ground.canvas.height = 1;
      if (textureSource !== ground.canvas) textureSource.width = textureSource.height = 1;
      gl.uniform4f(
         gl.getUniformLocation(program, 'bounds'),
         ground.bounds.minX,
         ground.bounds.minY,
         ground.bounds.maxX,
         ground.bounds.maxY,
      );
      let detailBounds = ground.bounds;
      let mesh = await landscapeMesh(course, ground.bounds, 8, () => closed, true);
      if (closed) return;
      const buffer = gl.createBuffer()!;
      resources.buffer = buffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
      const bindGeometry = (geometry: WebGLBuffer) => {
         gl.bindBuffer(gl.ARRAY_BUFFER, geometry);
         for (const [i, name] of ['position', 'normal', 'colour'].entries()) {
            const a = gl.getAttribLocation(program, name);
            gl.enableVertexAttribArray(a);
            gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12);
         }
      };
      bindGeometry(buffer);
      const backdropBuffer = gl.createBuffer()!;
      resources.backdrop = backdropBuffer;
      const backdropTexture = gl.createTexture()!;
      resources.backdropTexture = backdropTexture;
      gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const bindGround = (image: WebGLTexture, area: Bounds) => {
         gl.bindTexture(gl.TEXTURE_2D, image);
         gl.uniform4f(
            gl.getUniformLocation(program, 'bounds'),
            area.minX,
            area.minY,
            area.maxX,
            area.maxY,
         );
      };
      bindGround(texture, detailBounds);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.12, 0.19, 0.18, 1);
      const centre = gl.getUniformLocation(program, 'centre'),
         view = gl.getUniformLocation(program, 'view'),
         sun = gl.getUniformLocation(program, 'sun');
      const light = DAYLIGHT[daylight];
      gl.uniform3f(sun, light.x, light.y, 1 / light.length);
      const current = { x: 150, y: 300, z: 190, yaw: -0.3, pitch: 0.82, span: 580 };
      const target = { ...current };
      let inspection = '';
      const nav = dialog.querySelector('nav')!;
      const stops = [
         { name: 'Whole estate', x: 150, y: 300, span: 580 },
         ...(course.places ?? []).map((p: { name: string; x: number; y: number }) => ({
            ...p,
            span: 85,
         })),
      ];
      for (const stop of stops) {
         const button = document.createElement('button');
         button.type = 'button';
         button.textContent = stop.name;
         button.onclick = () => {
            inspection = '';
            Object.assign(target, { x: stop.x, y: stop.y, span: stop.span });
            target.z = 190;
            for (const b of nav.querySelectorAll('button:not([data-pan])'))
               b.setAttribute('aria-pressed', String(b === button));
         };
         nav.append(button);
         button.setAttribute('aria-pressed', String(nav.children.length === 1));
      }
      let panMode = false;
      const panButton = document.createElement('button');
      panButton.type = 'button';
      panButton.dataset.pan = 'true';
      panButton.textContent = 'Pan landscape';
      panButton.setAttribute('aria-pressed', 'false');
      panButton.onclick = () => {
         panMode = !panMode;
         panButton.setAttribute('aria-pressed', String(panMode));
      };
      nav.append(panButton);
      const pan = (dx: number, dy: number) => {
         inspection = '';
         for (const button of nav.querySelectorAll('button:not([data-pan])'))
            button.setAttribute('aria-pressed', 'false');
         const scale = (2 * target.span) / Math.max(1, canvas.clientHeight);
         const rx = -dx * scale,
            ry = (dy * scale) / Math.sin(target.pitch);
         const co = Math.cos(target.yaw),
            si = Math.sin(target.yaw);
         target.x += co * rx + si * ry;
         target.y += -si * rx + co * ry;
         target.z = Course.heightAt(course, target);
      };
      let pointer: { x: number; y: number } | null = null;
      canvas.onpointerdown = (e) => {
         pointer = { x: e.clientX, y: e.clientY };
         canvas.setPointerCapture(e.pointerId);
         canvas.focus();
      };
      canvas.onpointermove = (e) => {
         if (!pointer) return;
         if (panMode || e.shiftKey) {
            pan(e.clientX - pointer.x, e.clientY - pointer.y);
            pointer = { x: e.clientX, y: e.clientY };
            return;
         }
         target.yaw += (e.clientX - pointer.x) * 0.006;
         target.pitch = Math.max(
            0.28,
            Math.min(1.5, target.pitch + (e.clientY - pointer.y) * 0.004),
         );
         pointer = { x: e.clientX, y: e.clientY };
      };
      canvas.onpointerup =
         canvas.onpointercancel =
         canvas.onlostpointercapture =
            () => {
               pointer = null;
            };
      const zoom = (factor: number) => {
         target.span = Math.max(35, Math.min(720, target.span * factor));
      };
      canvas.addEventListener(
         'wheel',
         (e) => {
            e.preventDefault();
            zoom(Math.exp(Math.max(-200, Math.min(200, e.deltaY)) * 0.002));
         },
         { passive: false },
      );
      canvas.onkeydown = (e) => {
         if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(e.key))
            return;
         e.preventDefault();
         if (e.shiftKey && e.key.startsWith('Arrow')) {
            pan(
               e.key === 'ArrowLeft' ? 80 : e.key === 'ArrowRight' ? -80 : 0,
               e.key === 'ArrowUp' ? 80 : e.key === 'ArrowDown' ? -80 : 0,
            );
            return;
         }
         if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
            target.yaw += e.key === 'ArrowLeft' ? -0.12 : 0.12;
         else if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
            target.pitch = Math.max(
               0.28,
               Math.min(1.5, target.pitch + (e.key === 'ArrowUp' ? 0.08 : -0.08)),
            );
         else zoom(e.key === '-' ? 1.15 : 1 / 1.15);
      };
      status.textContent = 'Preview ready. Choose a viewpoint or orbit the estate.';
      canvas.dataset.ready = 'true';
      canvas.dataset.triangles = String(mesh.triangles);
      canvas.ondblclick = (event) => {
         const rect = canvas.getBoundingClientRect();
         const hit = pickLandscape(
            { x: event.clientX - rect.left, y: event.clientY - rect.top },
            { ...current, width: rect.width, height: rect.height },
            (p) => {
               const surface = Course.surfaceAt(course, p);
               return surface.type === 'water' ? surface.waterHeight : Course.heightAt(course, p);
            },
         );
         if (!hit) return;
         Object.assign(target, { x: hit.x, y: hit.y, z: hit.z, span: Math.min(target.span, 100) });
         const material = Course.surfaceAt(course, hit).type.replaceAll('-', ' ');
         inspection = `Ground: ${material}. Elevation ${hit.z.toFixed(1)} m. Your shot target is unchanged.`;
         status.textContent = inspection;
         canvas.dataset.pickX = hit.x.toFixed(4);
         canvas.dataset.pickY = hit.y.toFixed(4);
         for (const button of nav.querySelectorAll('button:not([data-pan])'))
            button.setAttribute('aria-pressed', 'false');
      };
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      let last = performance.now();
      let firstFrame = true;
      let loadedX = 150,
         loadedY = 300,
         building = false;
      let lastRequest = 0;
      let backdropBounds: Bounds | null = null;
      let backdropCount = 0,
         backdropBuilding = false,
         backdropRetry = 0;
      let backdropRequest = '',
         backdropSettledAt = 0;
      const refreshBackdrop = async () => {
         if (backdropBuilding || performance.now() < backdropRetry) return;
         const rect = canvas.getBoundingClientRect();
         const needed = landscapeFootprint({ ...target, width: rect.width, height: rect.height });
         if (backdropBounds && containsLandscape(backdropBounds, needed)) return;
         const request = [target.x, target.y, target.span, target.pitch, rect.width, rect.height]
            .map((v) => v.toFixed(2))
            .join(':');
         if (request !== backdropRequest) {
            backdropRequest = request;
            backdropSettledAt = performance.now();
            return;
         }
         if (performance.now() - backdropSettledAt < 180) return;
         backdropBuilding = true;
         const nextBounds = paddedLandscape(needed);
         const superseded = () =>
            !containsLandscape(
               nextBounds,
               landscapeFootprint({
                  ...target,
                  width: canvas.clientWidth,
                  height: canvas.clientHeight,
               }),
            );
         try {
            const { vertices, pixels, textureSize, terrainVertices, treeCount } =
               await landscapeBackdrop(course, nextBounds, () => closed || superseded(), daylight);
            if (closed || superseded()) return;
            gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
            gl.texImage2D(
               gl.TEXTURE_2D,
               0,
               gl.RGBA,
               textureSize,
               textureSize,
               0,
               gl.RGBA,
               gl.UNSIGNED_BYTE,
               gradeDaylightPixels(pixels, textureSize, nextBounds, course.bounds, daylight),
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, backdropBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            backdropBounds = nextBounds;
            backdropCount = vertices.length / 9;
            firstFrame = true;
            canvas.dataset.backdropReady = 'true';
            canvas.dataset.backdropVertices = String(backdropCount);
            canvas.dataset.backdropTerrainVertices = String(terrainVertices);
            canvas.dataset.distantTrees = String(treeCount);
         } catch (error) {
            if (!closed && !superseded()) {
               console.warn('Landscape backdrop', error);
               backdropRetry = performance.now() + 5000;
            }
         } finally {
            backdropBuilding = false;
         }
      };
      // One resident buffer and one in-flight CPU mesh. Never retain visited regions.
      const refreshTerrain = async () => {
         if (building || Math.hypot(target.x - loadedX, target.y - loadedY) < 240) return;
         if (performance.now() - lastRequest < 250) return;
         lastRequest = performance.now();
         building = true;
         const x = Math.round(target.x / 128) * 128,
            y = Math.round(target.y / 128) * 128;
         status.textContent = inspection || 'Preparing surrounding terrain...';
         canvas.dataset.streaming = 'true';
         try {
            const next = await landscapeMesh(
               course,
               { minX: x - 768, maxX: x + 768, minY: y - 768, maxY: y + 768 },
               16,
               () => closed,
               true,
            );
            if (closed) return;
            // Discard obsolete work if the player moved on during generation.
            if (Math.hypot(target.x - x, target.y - y) > 240) return;
            const patch = new CourseAtlas().groundTexture(course, daylight, {
               minX: x - 768,
               maxX: x + 768,
               minY: y - 768,
               maxY: y + 768,
            });
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, patch.canvas);
            gl.uniform4f(
               gl.getUniformLocation(program, 'bounds'),
               patch.bounds.minX,
               patch.bounds.minY,
               patch.bounds.maxX,
               patch.bounds.maxY,
            );
            detailBounds = patch.bounds;
            patch.canvas.width = patch.canvas.height = 1;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, next.vertices, gl.STATIC_DRAW);
            mesh = next;
            loadedX = x;
            loadedY = y;
            firstFrame = true;
            canvas.dataset.triangles = String(mesh.triangles);
            canvas.dataset.regionX = String(x);
            canvas.dataset.regionY = String(y);
            status.textContent =
               inspection ||
               'Surrounding landscape ready. Shift-drag or use Pan landscape to explore.';
         } catch (error) {
            if (!closed) {
               lastRequest = performance.now() + 5000;
               status.textContent =
                  'Terrain could not update. Return to a saved viewpoint to retry.';
               console.warn('Landscape streaming', error);
            }
         } finally {
            building = false;
            canvas.dataset.streaming = 'false';
         }
      };
      const draw = (now: number) => {
         if (closed) return;
         void refreshTerrain();
         void refreshBackdrop();
         const changed =
            firstFrame ||
            Object.keys(current).some(
               (key) =>
                  Math.abs(
                     current[key as keyof typeof current] - target[key as keyof typeof target],
                  ) > 0.0001,
            );
         const ease = reduce.matches ? 1 : 1 - Math.exp(-Math.min(64, now - last) / 200);
         last = now;
         for (const key of Object.keys(current) as (keyof typeof current)[])
            current[key] += (target[key] - current[key]) * ease;
         const r = canvas.getBoundingClientRect(),
            ratio = Math.min(1.5, devicePixelRatio, Math.sqrt(4000000 / (r.width * r.height)));
         canvas.dataset.coverage = String(
            !!backdropBounds &&
               containsLandscape(
                  backdropBounds,
                  landscapeFootprint({ ...current, width: r.width, height: r.height }),
               ),
         );
         const w = Math.max(1, Math.round(r.width * ratio)),
            h = Math.max(1, Math.round(r.height * ratio));
         const resized = canvas.width !== w || canvas.height !== h;
         if (resized) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
         }
         if (changed || resized) {
            firstFrame = false;
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.uniform3f(centre, current.x, current.y, current.z);
            gl.uniform4f(view, current.yaw, current.pitch, current.span, w / h);
            if (backdropCount && backdropBounds) {
               gl.uniform1f(gl.getUniformLocation(program, 'edgeFade'), 0);
               bindGround(backdropTexture, backdropBounds);
               bindGeometry(backdropBuffer);
               gl.drawArrays(gl.TRIANGLES, 0, backdropCount);
               // The detailed physical surface owns the foreground. Clearing only
               // depth prevents the coarse approximation poking through it.
               gl.clear(gl.DEPTH_BUFFER_BIT);
            }
            gl.uniform1f(gl.getUniformLocation(program, 'edgeFade'), backdropCount ? 1 : 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            bindGround(texture, detailBounds);
            bindGeometry(buffer);
            gl.drawArrays(gl.TRIANGLES, 0, mesh.vertices.length / 9);
            gl.disable(gl.BLEND);
         }
         frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
   } catch (error) {
      if (!closed) {
         status.textContent =
            'The landscape preview could not load. Return to options to continue playing.';
         console.warn('Landscape preview', error);
      }
   }
}
