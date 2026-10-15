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
   dialog.innerHTML = `<canvas tabindex="0" aria-label="Angled landscape preview. Drag to orbit; scroll to zoom. Use arrow keys to orbit, plus or minus to zoom."></canvas><header><div><p class="hud-eyebrow">LANDSCAPE STUDY</p><h1 id="landscapePreviewTitle">A different perspective.</h1><p>Preview only. Your round stays in the overhead view.</p></div><button type="button" aria-label="Return to game options">Back to options</button></header><nav aria-label="Landscape viewpoints"></nav><p class="preview-status" role="status">Preparing terrain and woodland...</p><footer>Drag to orbit &middot; Scroll to zoom &middot; Arrow keys to orbit &middot; + / - to zoom &middot; Escape to return</footer>`;
   document.body.append(dialog);
   dialog.showModal();
   const canvas = dialog.querySelector('canvas')!,
      status = dialog.querySelector<HTMLElement>('.preview-status')!;
   let closed = false,
      frame = 0;
   const resources: {
      buffer?: WebGLBuffer;
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
            `attribute vec3 position;attribute vec3 normal;attribute vec3 colour;uniform vec3 centre;uniform vec4 view;uniform vec3 sun;uniform vec4 bounds;varying vec3 tint;varying vec2 uv;varying float terrain;varying float lighting;
 void main(){vec3 p=position-centre;float co=cos(view.x),si=sin(view.x);float x=co*p.x-si*p.y,y=si*p.x+co*p.y;float sy=sin(view.y),cy=cos(view.y);gl_Position=vec4(x/(view.z*view.w),(y*sy+p.z*cy)/view.z,(y*cy-p.z*sy)/4000.0,1.0);float light=0.60+0.40*max(0.0,dot(normalize(normal),normalize(sun)));tint=colour*light;lighting=light;terrain=colour.r<0.0?1.0:0.0;uv=vec2((position.x-bounds.x)/(bounds.z-bounds.x),(bounds.w-position.y)/(bounds.w-bounds.y));}`,
         ),
      );
      gl.attachShader(
         program,
         compile(
            gl.FRAGMENT_SHADER,
            `precision mediump float;varying vec3 tint;varying vec2 uv;varying float terrain;varying float lighting;uniform sampler2D ground;void main(){gl_FragColor=vec4(terrain>0.5?texture2D(ground,uv).rgb*lighting:tint,1.0);}`,
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
      const mesh = await landscapeMesh(course, ground.bounds, 8, () => closed, true);
      if (closed) return;
      const buffer = gl.createBuffer()!;
      resources.buffer = buffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
      for (const [i, name] of ['position', 'normal', 'colour'].entries()) {
         const a = gl.getAttribLocation(program, name);
         gl.enableVertexAttribArray(a);
         gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12);
      }
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.12, 0.19, 0.18, 1);
      const centre = gl.getUniformLocation(program, 'centre'),
         view = gl.getUniformLocation(program, 'view'),
         sun = gl.getUniformLocation(program, 'sun');
      const light = DAYLIGHT[daylight];
      gl.uniform3f(sun, light.x, light.y, 1 / light.length);
      const current = { x: 150, y: 300, z: 190, yaw: -0.3, pitch: 0.82, span: 580 };
      const target = { ...current };
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
            Object.assign(target, { x: stop.x, y: stop.y, span: stop.span });
            target.z = 190;
            for (const b of nav.querySelectorAll('button'))
               b.setAttribute('aria-pressed', String(b === button));
         };
         nav.append(button);
         button.setAttribute('aria-pressed', String(nav.children.length === 1));
      }
      let pointer: { x: number; y: number } | null = null;
      canvas.onpointerdown = (e) => {
         pointer = { x: e.clientX, y: e.clientY };
         canvas.setPointerCapture(e.pointerId);
         canvas.focus();
      };
      canvas.onpointermove = (e) => {
         if (!pointer) return;
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
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      let last = performance.now();
      let firstFrame = true;
      const draw = (now: number) => {
         if (closed) return;
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
            gl.drawArrays(gl.TRIANGLES, 0, mesh.vertices.length / 9);
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
