import { ballLight, ballDiameter, ballShadow } from './landscape-ball';
import { readPresentation } from './presentation';
import { landscapeAimRing, landscapeTrail, landscapeImpacts } from './landscape-guides';
import type { Point } from '../contracts/cockpit';
import { recordedBallPosition } from './ball-position';
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
export type LandscapeInteraction = {
   aiming: () => boolean;
   aim: (point: Point) => void;
   render: () => void;
   dispose: () => void;
};
/** Depth-tested view; optional UI sends actions through the authoritative session. */
export async function openLandscapePreview(
   course: CockpitSession['course'],
   daylight: Daylight,
   session?: CockpitSession,
   mountControls?: (dialog: HTMLDialogElement) => LandscapeInteraction,
) {
   if (document.getElementById('landscapePreview')) return;
   const previous = document.activeElement as HTMLElement | null;
   const dialog = document.createElement('dialog');
   dialog.id = 'landscapePreview';
   dialog.className = 'landscape-preview';
   dialog.setAttribute('aria-labelledby', 'landscapePreviewTitle');
   dialog.innerHTML = `<canvas tabindex="0" aria-label="Angled course. Drag to orbit; Shift-drag to pan; scroll to zoom. Use arrow keys to orbit, plus or minus to zoom."></canvas><header><div><p class="hud-eyebrow">PURITY / LANDSCAPE</p><h1 id="landscapePreviewTitle">Explore the course.</h1><p>Angled view &middot; Return to overhead to aim and play.</p></div><button type="button" aria-label="Return to game options">Back to options</button></header><nav aria-label="Landscape viewpoints"></nav><p class="preview-status" role="status">Preparing terrain and woodland...</p><aside class="preview-loading" aria-live="polite"><span class="hud-eyebrow">PURITY</span><strong>Preparing your view</strong><span>Bringing the surrounding landscape into view.</span></aside><footer><details><summary>Camera controls</summary><p>Drag to orbit &middot; Shift-drag to pan &middot; Scroll to zoom</p><p>Double-click ground to explore &middot; Arrow keys to orbit &middot; + / &minus; to zoom &middot; Escape to return</p></details></footer>`;
   document.body.append(dialog);
   dialog.showModal();
   const canvas = dialog.querySelector('canvas')!,
      status = dialog.querySelector<HTMLElement>('.preview-status')!;
   let closed = false,
      frame = 0;
   const resources: {
      buffer?: WebGLBuffer;
      ball?: WebGLBuffer;
      shadow?: WebGLBuffer;
      guides?: WebGLBuffer;
      backdrop?: WebGLBuffer;
      backdropTexture?: WebGLTexture;
      texture?: WebGLTexture;
      program?: WebGLProgram;
      shaders: WebGLShader[];
   } = {
      shaders: [],
   };
   let interaction: LandscapeInteraction | undefined;
   const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
   const cleanup = () => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(frame);
      interaction?.dispose();
      if (gl) {
         if (resources.backdropTexture) gl.deleteTexture(resources.backdropTexture);
         if (resources.backdrop) gl.deleteBuffer(resources.backdrop);
         if (resources.shadow) gl.deleteBuffer(resources.shadow);
         if (resources.ball) gl.deleteBuffer(resources.ball);
         if (resources.guides) gl.deleteBuffer(resources.guides);
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
      dialog.dataset.worldReady = 'true';
      status.textContent =
         'This browser could not start the angled preview. The overhead game remains available.';
      return;
   }
   canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      dialog.dataset.worldReady = 'true';
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
            `attribute vec3 position;attribute vec3 normal;attribute vec3 colour;uniform vec3 centre;uniform vec4 view;uniform vec3 sun;uniform vec4 bounds;uniform vec4 detailBounds;uniform float markerSize;varying float shadowOpacity;varying vec3 tint;varying vec2 uv;varying vec2 detailUV;varying vec2 detailExtent;varying vec2 extent;varying float terrain;varying float lighting;
 void main(){shadowOpacity=colour.r;detailExtent=detailBounds.zw-detailBounds.xy;detailUV=vec2((position.x-detailBounds.x)/detailExtent.x,(detailBounds.w-position.y)/detailExtent.y);gl_PointSize=markerSize;extent=bounds.zw-bounds.xy;vec3 p=position-centre;float co=cos(view.x),si=sin(view.x);float x=co*p.x-si*p.y,y=si*p.x+co*p.y;float sy=sin(view.y),cy=cos(view.y);gl_Position=vec4(x/(view.z*view.w),(y*sy+p.z*cy)/view.z,(y*cy-p.z*sy)/32000.0,1.0);float light=0.60+0.40*max(0.0,dot(normalize(normal),normalize(sun)));tint=colour*light;lighting=light;terrain=colour.r<0.0?1.0:0.0;uv=vec2((position.x-bounds.x)/(bounds.z-bounds.x),(bounds.w-position.y)/(bounds.w-bounds.y));}`,
         ),
      );
      gl.attachShader(
         program,
         compile(
            gl.FRAGMENT_SHADER,
            `precision mediump float;varying float shadowOpacity;varying vec3 tint;varying vec2 uv;varying vec2 detailUV;varying vec2 detailExtent;varying vec2 extent;varying float terrain;varying float lighting;uniform sampler2D ground;uniform sampler2D detailGround;uniform float blendDetail;uniform float edgeFade;uniform float ballMarker;uniform vec3 ballTint;uniform vec3 ballSun;uniform float effectAlpha;void main(){if(ballMarker>2.5){gl_FragColor=vec4(0.04,0.08,0.05,shadowOpacity);return;}if(ballMarker>1.5){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;gl_FragColor=vec4(tint,effectAlpha*(1.0-smoothstep(0.25,0.5,d)));return;}if(ballMarker>0.5){vec2 p=(gl_PointCoord-vec2(0.5))*2.0;p.y=-p.y;float r=dot(p,p);if(r>1.0)discard;vec3 n=vec3(p,sqrt(max(0.0,1.0-r)));float diffuse=max(0.0,dot(n,ballSun));vec3 halfLight=normalize(ballSun+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,halfLight)),48.0)*0.22;vec3 shade=ballTint*(0.32+0.68*diffuse)+vec3(spec);gl_FragColor=vec4(shade,1.0);return;}vec2 edge=min(uv,1.0-uv)*extent;float alpha=edgeFade>0.5?smoothstep(0.0,terrain>0.5?256.0:96.0,min(edge.x,edge.y)):1.0;if(alpha<0.01)discard;vec3 material=texture2D(ground,uv).rgb;if(blendDetail>0.5&&terrain>0.5){vec2 de=min(detailUV,1.0-detailUV)*detailExtent;float weight=smoothstep(0.0,128.0,min(de.x,de.y));material=mix(material,texture2D(detailGround,clamp(detailUV,0.0,1.0)).rgb,weight);}gl_FragColor=vec4(terrain>0.5?material*lighting:tint,alpha);}`,
         ),
      );
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Preview linking failed');
      gl.useProgram(program);
      const uniforms = new Map<string, WebGLUniformLocation | null>();
      const uniform = (name: string) => {
         if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(program, name));
         return uniforms.get(name)!;
      };
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
         uniform('bounds'),
         ground.bounds.minX,
         ground.bounds.minY,
         ground.bounds.maxX,
         ground.bounds.maxY,
      );
      let detailBounds = ground.bounds;
      let mesh = await landscapeMesh(course, ground.bounds, 8, () => closed, true, true);
      if (closed) return;
      const buffer = gl.createBuffer()!;
      resources.buffer = buffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
      const attributes = ['position', 'normal', 'colour'].map((name) =>
         gl.getAttribLocation(program, name),
      );
      const bindGeometry = (geometry: WebGLBuffer) => {
         gl.bindBuffer(gl.ARRAY_BUFFER, geometry);
         for (const [i, a] of attributes.entries()) {
            gl.enableVertexAttribArray(a);
            gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12);
         }
      };
      bindGeometry(buffer);
      const ballBuffer = gl.createBuffer()!;
      resources.ball = ballBuffer;
      const ballData = new Float32Array(9);
      gl.bindBuffer(gl.ARRAY_BUFFER, ballBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, ballData.byteLength, gl.DYNAMIC_DRAW);
      const pointRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array;
      const shadowBuffer = gl.createBuffer()!;
      resources.shadow = shadowBuffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, shadowBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, 24 * 3 * 9 * 4, gl.DYNAMIC_DRAW);
      let shadowKey = '',
         shadowCount = 0;
      let aimKey = '',
         aimPoints = new Float32Array();
      let renderedFrames = 0;
      let previousBall = '';
      let previousGuide = '';
      const guideBuffer = gl.createBuffer()!;
      resources.guides = guideBuffer;
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
         gl.uniform4f(uniform('bounds'), area.minX, area.minY, area.maxX, area.maxY);
      };
      bindGround(texture, detailBounds);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.12, 0.19, 0.18, 1);
      const centre = uniform('centre'),
         view = uniform('view'),
         sun = uniform('sun');
      const light = DAYLIGHT[daylight];
      gl.uniform3f(sun, light.x, light.y, 1 / light.length);
      const current = { x: 150, y: 300, z: 190, yaw: -0.3, pitch: 0.82, span: 580 };
      const target = { ...current };
      let inspection = '';
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      let following = false;
      let followButton: HTMLButtonElement | null = null;
      const stopFollowing = () => {
         if (following) {
            inspection = 'Free camera. Follow ball is off.';
            status.textContent = inspection;
         }
         following = false;
         followButton?.setAttribute('aria-pressed', 'false');
         canvas.dataset.following = 'false';
      };
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
            stopFollowing();
            inspection = '';
            Object.assign(target, { x: stop.x, y: stop.y, span: stop.span });
            target.z = 190;
            for (const b of nav.querySelectorAll('button:not([data-pan])'))
               b.setAttribute('aria-pressed', String(b === button));
         };
         nav.append(button);
         button.setAttribute('aria-pressed', String(nav.children.length === 1));
      }
      if (session) {
         const ballButton = document.createElement('button');
         ballButton.type = 'button';
         ballButton.textContent = 'Current ball';
         ballButton.setAttribute('aria-pressed', 'false');
         ballButton.onclick = () => {
            stopFollowing();
            if (session.course !== course) return;
            const ball = recordedBallPosition(session, performance.now());
            Object.assign(target, {
               x: ball.x,
               y: ball.y,
               z: ball.z ?? Course.heightAt(course, ball),
               span: 85,
            });
            inspection = 'Live ball position. Open shot controls here, or play from your phone.';
            status.textContent = inspection;
            for (const button of nav.querySelectorAll('button:not([data-pan])'))
               button.setAttribute('aria-pressed', String(button === ballButton));
         };
         nav.append(ballButton);
         followButton = document.createElement('button');
         followButton.type = 'button';
         followButton.textContent = 'Follow ball';
         followButton.setAttribute('aria-pressed', 'false');
         followButton.onclick = () => {
            if (reduce.matches || session.course !== course) return;
            following = !following;
            for (const button of nav.querySelectorAll('button:not([data-pan])'))
               button.setAttribute('aria-pressed', String(button === followButton && following));
            canvas.dataset.following = String(following);
            inspection = following
               ? 'Following the ball. Pan, orbit or zoom to take control.'
               : 'Free camera. Follow ball is off.';
            status.textContent = inspection;
         };
         const motionChanged = () => {
            followButton!.disabled = reduce.matches;
            followButton!.title = reduce.matches
               ? 'Automatic following is off with reduced motion. Use Current ball to reframe.'
               : 'Smoothly follow the live ball';
            if (reduce.matches) stopFollowing();
         };
         motionChanged();
         reduce.addEventListener('change', motionChanged);
         dialog.addEventListener(
            'close',
            () => reduce.removeEventListener('change', motionChanged),
            { once: true },
         );
         nav.append(followButton);
      }
      let panMode = false;
      const panButton = document.createElement('button');
      panButton.type = 'button';
      panButton.dataset.pan = 'true';
      panButton.textContent = 'Pan landscape';
      panButton.setAttribute('aria-pressed', 'false');
      panButton.onclick = () => {
         stopFollowing();
         panMode = !panMode;
         panButton.setAttribute('aria-pressed', String(panMode));
      };
      nav.append(panButton);
      const pan = (dx: number, dy: number) => {
         stopFollowing();
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
      let press: { x: number; y: number; moved: boolean } | null = null;
      canvas.onpointerdown = (e) => {
         stopFollowing();
         pointer = { x: e.clientX, y: e.clientY };
         press = { ...pointer, moved: false };
         canvas.setPointerCapture(e.pointerId);
         canvas.focus();
      };
      canvas.onpointermove = (e) => {
         if (!pointer) return;
         if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) press.moved = true;
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
      canvas.onpointerup = (event) => {
         if (
            press &&
            !press.moved &&
            interaction?.aiming() &&
            dialog.dataset.worldReady === 'true'
         ) {
            const rect = canvas.getBoundingClientRect();
            const hit = pickLandscape(
               { x: event.clientX - rect.left, y: event.clientY - rect.top },
               { ...current, width: rect.width, height: rect.height },
               (p) => {
                  const surface = Course.surfaceAt(course, p);
                  return surface.type === 'water'
                     ? surface.waterHeight
                     : Course.heightAt(course, p);
               },
            );
            if (hit) interaction.aim(hit);
         }
         pointer = null;
         press = null;
      };
      canvas.onpointercancel = canvas.onlostpointercapture = () => {
         pointer = null;
         press = null;
      };
      const zoom = (factor: number) => {
         stopFollowing();
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
         stopFollowing();
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
      interaction = mountControls?.(dialog);
      if (interaction)
         dialog.querySelector('header p:last-child')!.textContent =
            'Explore, or open shot controls to play here.';
      status.textContent = 'Preview ready. Choose a viewpoint or orbit the estate.';
      canvas.dataset.ready = 'true';
      canvas.dataset.triangles = String(mesh.triangles);
      canvas.ondblclick = (event) => {
         if (interaction?.aiming()) return;
         stopFollowing();
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
      let backdropDetail = '';
      let backdropResolution = 0;
      const detailKey = () => JSON.stringify(detailBounds);
      const refreshBackdrop = async () => {
         if (backdropBuilding || performance.now() < backdropRetry) return;
         const quality = readPresentation(document.body.dataset).renderQuality;
         const resolution = quality === 'crisp' ? 512 : quality === 'economy' ? 256 : 384;
         const rect = canvas.getBoundingClientRect();
         const needed = landscapeFootprint({ ...target, width: rect.width, height: rect.height });
         if (
            backdropBounds &&
            containsLandscape(backdropBounds, needed) &&
            backdropDetail === detailKey() &&
            backdropResolution === resolution
         )
            return;
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
         const requestedDetail = detailKey();
         const treeDetail = { ...detailBounds };
         const superseded = () =>
            requestedDetail !== detailKey() ||
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
               await landscapeBackdrop(
                  course,
                  nextBounds,
                  () => closed || superseded(),
                  daylight,
                  treeDetail,
                  resolution,
               );
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
            backdropDetail = requestedDetail;
            backdropResolution = resolution;
            canvas.dataset.textureResolution = String(resolution);
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
               uniform('bounds'),
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
         if (session && session.course !== course) {
            dialog.close();
            return;
         }
         interaction?.render();
         const presentation = readPresentation(document.body.dataset);
         const effectTime = session?.last ? session.shotTime(now, false) : Infinity;
         const effectsActive =
            !reduce.matches &&
            presentation.impactCue === 'subtle' &&
            session?.phase !== 'plan' &&
            !!session?.last &&
            effectTime < session.last.result.duration + 2.4;
         const ball =
            session && session.course === course ? recordedBallPosition(session, now) : null;
         if (following && (!ball || reduce.matches)) stopFollowing();
         if (following && ball) {
            const ground = Course.heightAt(course, ball);
            const z = ball.z ?? ground;
            Object.assign(target, {
               x: ball.x,
               y: ball.y,
               z,
               span: 85 + Math.min(75, Math.max(0, z - ground) * 0.6),
            });
         }
         void refreshTerrain();
         void refreshBackdrop();
         const ballKey = ball ? `${ball.x}:${ball.y}:${ball.z}` : '';
         const guideKey = `${interaction?.aiming()}:${session?.revision}:${session?.phase}:${JSON.stringify(presentation)}:${effectsActive ? now : 0}`;
         const previousCamera = { ...current };
         const ease = reduce.matches
            ? 1
            : 1 - Math.exp(-Math.min(64, now - last) / (following ? 320 : 200));
         last = now;
         const r = canvas.getBoundingClientRect(),
            ratio = Math.min(
               presentation.renderQuality === 'economy'
                  ? 1
                  : presentation.renderQuality === 'crisp'
                    ? 2
                    : 1.5,
               devicePixelRatio,
               Math.sqrt(4000000 / (r.width * r.height)),
            );
         const next = { ...current };
         for (const key of Object.keys(current) as (keyof typeof current)[])
            next[key] =
               Math.abs(target[key] - current[key]) < 0.0001
                  ? target[key]
                  : current[key] + (target[key] - current[key]) * ease;
         const covered = (camera: typeof current) =>
            !!backdropBounds &&
            containsLandscape(
               backdropBounds,
               landscapeFootprint({ ...camera, width: r.width, height: r.height }),
            );
         // Requested navigation streams terrain independently. Only expose a view
         // once its entire ground footprint fits the resident GPU landscape.
         if (covered(next)) Object.assign(current, next);
         else if (!covered(current) && covered(target)) Object.assign(current, target);
         const changed =
            firstFrame ||
            ballKey !== previousBall ||
            guideKey !== previousGuide ||
            Object.keys(current).some(
               (key) =>
                  current[key as keyof typeof current] !==
                  previousCamera[key as keyof typeof current],
            );
         const visible = covered(current);
         dialog.dataset.worldReady = String(visible);
         canvas.dataset.cameraX = current.x.toFixed(4);
         canvas.dataset.cameraY = current.y.toFixed(4);
         canvas.dataset.coverage = String(visible && backdropDetail === detailKey());
         const w = Math.max(1, Math.round(r.width * ratio)),
            h = Math.max(1, Math.round(r.height * ratio));
         const resized = canvas.width !== w || canvas.height !== h;
         if (resized) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
         }
         if (changed || resized) {
            canvas.dataset.renderedFrames = String(++renderedFrames);
            firstFrame = false;
            previousBall = ballKey;
            previousGuide = guideKey;
            gl.uniform1f(uniform('ballMarker'), 0);
            gl.uniform1i(uniform('ground'), 0);
            gl.uniform1i(uniform('detailGround'), 1);
            gl.uniform4f(
               uniform('detailBounds'),
               detailBounds.minX,
               detailBounds.minY,
               detailBounds.maxX,
               detailBounds.maxY,
            );
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1f(uniform('blendDetail'), 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.uniform3f(centre, current.x, current.y, current.z);
            gl.uniform4f(view, current.yaw, current.pitch, current.span, w / h);
            if (backdropCount && backdropBounds) {
               gl.uniform1f(uniform('edgeFade'), 0);
               bindGround(backdropTexture, backdropBounds);
               bindGeometry(backdropBuffer);
               gl.drawArrays(gl.TRIANGLES, 0, backdropCount);
               // One stitched terrain surface owns depth throughout the visible world.
            }
            gl.uniform1f(uniform('blendDetail'), 0);
            gl.uniform1f(uniform('edgeFade'), backdropCount ? 1 : 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            bindGround(texture, detailBounds);
            bindGeometry(buffer);
            const objectStart = backdropCount ? mesh.terrainTriangles * 3 : 0;
            gl.drawArrays(gl.TRIANGLES, objectStart, mesh.vertices.length / 9 - objectStart);
            gl.disable(gl.BLEND);
            // Presentation-only guides use the same camera/depth buffer as terrain.
            // Bound the trail upload; no second trajectory calculation is performed.
            if (session && session.course === course) {
               gl.uniform1f(uniform('edgeFade'), 0);
               let points = new Float32Array();
               if (interaction?.aiming()) {
                  const key = `${session.aim.x}:${session.aim.y}:${current.span}`;
                  if (key !== aimKey) {
                     aimPoints = landscapeAimRing(course, session.aim, current.span);
                     aimKey = key;
                  }
                  points = aimPoints;
               } else if (
                  presentation.shotTrace === 'last' &&
                  session.phase !== 'plan' &&
                  session.last &&
                  ball
               )
                  points = landscapeTrail(session.last.result.trajectory, session.shotTime(now), {
                     ...ball,
                     z: ball.z ?? Course.heightAt(course, ball),
                  });
               if (points.length) {
                  gl.bindBuffer(gl.ARRAY_BUFFER, guideBuffer);
                  gl.bufferData(gl.ARRAY_BUFFER, points, gl.DYNAMIC_DRAW);
                  bindGeometry(guideBuffer);
                  gl.drawArrays(gl.LINE_STRIP, 0, points.length / 9);
               }
               canvas.dataset.aimX = String(session.aim.x);
               canvas.dataset.aimY = String(session.aim.y);
            }
            if (effectsActive && session?.last) {
               gl.enable(gl.BLEND);
               gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
               gl.depthMask(false);
               gl.uniform1f(uniform('edgeFade'), 0);
               for (const batch of landscapeImpacts(
                  course,
                  session.last.result.events,
                  effectTime,
               )) {
                  gl.bindBuffer(gl.ARRAY_BUFFER, guideBuffer);
                  gl.bufferData(gl.ARRAY_BUFFER, batch.vertices, gl.DYNAMIC_DRAW);
                  bindGeometry(guideBuffer);
                  gl.uniform1f(uniform('ballMarker'), 2);
                  gl.uniform1f(uniform('markerSize'), 4 * ratio);
                  gl.uniform1f(uniform('effectAlpha'), batch.alpha);
                  gl.drawArrays(gl.POINTS, 0, batch.vertices.length / 9);
               }
               gl.depthMask(true);
               gl.disable(gl.BLEND);
            }
            if (ball) {
               const z = ball.z ?? Course.heightAt(course, ball);
               const diameter = Math.min(
                  pointRange[1],
                  ballDiameter(current.span, presentation.ballVisibility === 'enhanced') * ratio,
               );
               // Lift the readable impostor by its apparent world radius so the
               // terrain does not cut its lower hemisphere. Simulation stays at z.
               const visualRadius = (diameter * current.span) / h;
               const key = `${ball.x}:${ball.y}:${z}:${visualRadius}`;
               if (key !== shadowKey) {
                  const vertices = ballShadow(
                     { ...ball, z },
                     visualRadius,
                     { x: light.x, y: light.y, z: 1 / light.length },
                     (x, y) => Course.heightAt(course, { x, y }),
                     (x, y) => Course.surfaceAt(course, { x, y }).type === 'water',
                  );
                  shadowCount = vertices.length / 9;
                  if (vertices.length) {
                     gl.bindBuffer(gl.ARRAY_BUFFER, shadowBuffer);
                     gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
                  }
                  shadowKey = key;
               }
               if (shadowCount) {
                  gl.uniform1f(uniform('ballMarker'), 3);
                  gl.enable(gl.BLEND);
                  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                  gl.depthMask(false);
                  bindGeometry(shadowBuffer);
                  gl.drawArrays(gl.TRIANGLES, 0, shadowCount);
                  gl.depthMask(true);
                  gl.disable(gl.BLEND);
               }
               canvas.dataset.ballShadow = String(shadowCount > 0);
               ballData.set([ball.x, ball.y, z + Math.max(0.04, visualRadius), 0, 0, 1, 1, 1, 1]);
               gl.bindBuffer(gl.ARRAY_BUFFER, ballBuffer);
               gl.bufferSubData(gl.ARRAY_BUFFER, 0, ballData);
               bindGeometry(ballBuffer);
               gl.uniform1f(uniform('ballMarker'), 1);
               gl.uniform3f(
                  uniform('ballTint'),
                  1,
                  presentation.ballColour === 'yellow' ? 0.88 : 0.99,
                  presentation.ballColour === 'yellow' ? 0.25 : 0.91,
               );
               const lighting = ballLight(
                  light.x,
                  light.y,
                  1 / light.length,
                  current.yaw,
                  current.pitch,
               );
               gl.uniform3f(uniform('ballSun'), lighting[0], lighting[1], lighting[2]);

               gl.uniform1f(uniform('markerSize'), diameter);
               canvas.dataset.ballDiameter = String(diameter / ratio);
               gl.drawArrays(gl.POINTS, 0, 1);
               canvas.dataset.ballX = String(ball.x);
               canvas.dataset.ballY = String(ball.y);
               canvas.dataset.ballZ = String(z);
            }
         }
         frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
   } catch (error) {
      if (!closed) {
         dialog.dataset.worldReady = 'true';
         status.textContent =
            'The landscape preview could not load. Return to options to continue playing.';
         console.warn('Landscape preview', error);
      }
   }
}
