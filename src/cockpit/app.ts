import {
   CLUBS,
   type Command,
   type Intent,
   type Snapshot,
   type Setup,
} from '../core/contracts/cockpit';
import { connectRelay } from '../core/network/relay-client';

export function startCockpit() {
   document.body.className = 'cockpit';
   document.body.innerHTML = `<main class="cockpit-shell"><header><p class="eyebrow">PURITY · COCKPIT</p><h1>Your next shot.</h1><p id="connection" role="status">Connecting…</p></header>
    <div class="readings"><div><span id="distance">—</span><small>yards to aim</small></div><div><span id="shot">1</span><small>shot</small></div><div><span id="lie">—</span><small>lie</small></div></div>
    <p id="wind" class="wind">Waiting for the display</p><progress id="windBar" max="1" value="0" aria-label="Wind strength"></progress>
    <fieldset id="controls" disabled><label>Club<select id="club">${CLUBS.map((c) => `<option value="${c}">${c === 'D' ? 'Driver' : c === 'PUTT' ? 'Putter' : c === 'CHIP' ? 'Chip' : c}</option>`).join('')}</select></label>
    <label>Effort <output id="effortValue">100%</output><input id="effort" type="range" min="15" max="110" step="0.5" value="100"></label>
    <label>Shape <output id="shapeValue">Straight</output><input id="shape" type="range" min="-100" max="100" value="0"></label>
    <label>Height <output id="heightValue">Stock</output><input id="height" type="range" min="-100" max="100" value="0"></label>
    <div class="segmented"><button type="button" id="aimMode" aria-pressed="true">Aim</button><button type="button" id="inspectMode" aria-pressed="false">Inspect</button></div>
    <div id="touchpad" role="group" tabindex="0" aria-label="Drag or use arrow keys to move the aim point"><span>Drag to aim</span><small>Up is toward the top of the course</small></div>
    <label class="fine"><input id="fine" type="checkbox">Fine adjustment</label>
    <div class="nudges" aria-label="Move target"><button type="button" data-dx="-1" data-dy="0" aria-label="Move left">←</button><button type="button" data-dx="0" data-dy="1" aria-label="Move up">↑</button><button type="button" data-dx="0" data-dy="-1" aria-label="Move down">↓</button><button type="button" data-dx="1" data-dy="0" aria-label="Move right">→</button></div>
    <p id="terrain" class="terrain">Terrain readings appear here</p>
    <div class="views"><button type="button" data-view="hole">Whole hole</button><button type="button" data-view="ball">Ball</button><button type="button" data-view="green">Green</button></div>
    <button type="button" id="play" class="primary">Play this shot</button>
    <p id="result" role="status"></p><div class="actions"><button type="button" id="mulligan">Mulligan</button><button type="button" id="reset">Restart hole</button></div>
    <details><summary>Course setup & appearance</summary>
    <label>Tee<select id="tee"><option>red</option><option selected>white</option><option>blue</option></select></label>
    <label>Pin<select id="pin"><option>easy</option><option selected>moderate</option><option>challenging</option></select></label>
    <label>Wind<select id="windChoice"><option>calm</option><option>light</option><option selected>moderate</option><option>strong</option></select></label>
    <label>Wind toward (degrees)<input id="towardDeg" type="number" min="0" max="359" value="0"></label>
    <label>Ground<select id="moisture"><option>dry</option><option selected>moderate</option><option>wet</option></select></label>
    <button type="button" id="applySetup">Start with these conditions</button>
    <label>Course appearance<select id="renderer"><option value="procedural">Simple terrain</option><option value="photo">Photographic reference</option></select></label>
    </details></fieldset><p id="notice" role="alert"></p><footer>One course · one phone · one local session</footer></main>`;
   const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
   const token = new URLSearchParams(location.search).get('token');
   if (!token) {
      $('connection').textContent = 'Scan the QR code on the display to join.';
      return;
   }
   let state: Snapshot | undefined,
      connected = false,
      display = false,
      sequence = 0,
      target: 'aim' | 'probe' = 'aim';
   const client = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
   let dirty = false,
      pendingInput = false,
      pointer: { x: number; y: number; id: number } | null = null;
   const pending = new Map<string, number>();
   let latestInput = '';
   type Action = Command extends infer C
      ? C extends Command
         ? Omit<C, 'type' | 'id'>
         : never
      : never;
   function send(action: Action) {
      if (!connected || !display) {
         $('notice').textContent = 'Wait for the display connection.';
         return;
      }
      const command = { type: 'COMMAND', id: `${client}-${++sequence}`, ...action } as Command;
      if (relay.send(command)) {
         pending.set(command.id, performance.now());
         return command.id;
      }
   }
   function intent(): Intent {
      return {
         club: $<HTMLSelectElement>('club').value as Intent['club'],
         effort: Number($<HTMLInputElement>('effort').value) / 100,
         shape: Number($<HTMLInputElement>('shape').value) / 100,
         height: Number($<HTMLInputElement>('height').value) / 100,
      };
   }
   function labels() {
      const i = intent();
      $('effortValue').textContent = `${Math.round(i.effort * 1000) / 10}%`;
      $('shapeValue').textContent =
         i.shape === 0
            ? 'Straight'
            : `${Math.abs(Math.round(i.shape * 100))}% ${i.shape > 0 ? 'draw' : 'fade'}`;
      $('heightValue').textContent =
         i.height === 0
            ? 'Stock'
            : `${Math.abs(Math.round(i.height * 100))}% ${i.height > 0 ? 'higher' : 'lower'}`;
   }
   function availability() {
      $<HTMLFieldSetElement>('controls').disabled = !connected || !display || !state;
   }
   const relay = connectRelay(
      'cockpit',
      token,
      (message) => {
         if (message.type === 'PEERS') {
            display = message.display;
            $('connection').textContent = display
               ? 'Connected to your course'
               : 'Waiting for the display…';
            availability();
         }
         if (message.type === 'ACK') {
            const started = pending.get(message.id);
            pending.delete(message.id);
            if (message.id === latestInput) dirty = false;
            if (!message.ok) $('notice').textContent = message.error || 'Command rejected';
            else if (started !== undefined)
               $('connection').textContent =
                  `Connected · ${Math.round(performance.now() - started)} ms command round trip`;
         }
         if (message.type === 'STATE') {
            const first = !state;
            state = message;
            availability();
            $('distance').textContent = Math.round(state.distance / 0.9144).toString();
            $('shot').textContent = String(state.shot);
            $('lie').textContent = state.lie;
            $('wind').textContent = `${state.wind.strength} wind toward ${state.wind.direction}`;
            $<HTMLProgressElement>('windBar').value = state.wind.fraction;
            $('terrain').textContent =
               `Inspection: ${state.terrain.surface} · ${(state.terrain.z / 0.3048).toFixed(1)} ft · ${state.terrain.gradePercent.toFixed(1)}% slope · downhill ${state.terrain.downhillLabel}`;
            $('play').textContent =
               state.phase === 'animating'
                  ? 'Show result'
                  : state.phase === 'resolved'
                    ? 'Next shot'
                    : 'Play this shot';
            $<HTMLButtonElement>('play').disabled =
               state.phase === 'resolved' && state.result?.status !== 'settled';
            $('result').textContent = state.result
               ? `${state.result.status} · carry ${(state.result.carry / 0.9144).toFixed(0)} yd · total ${(state.result.total / 0.9144).toFixed(0)} yd · ${state.result.surface}`
               : '';
            for (const id of ['club', 'effort', 'shape', 'height'])
               $<HTMLInputElement>(id).disabled = state.phase !== 'plan';
            if (!dirty && !pendingInput) {
               $<HTMLSelectElement>('club').value = state.intent.club;
               $<HTMLInputElement>('effort').value = String(state.intent.effort * 100);
               $<HTMLInputElement>('shape').value = String(state.intent.shape * 100);
               $<HTMLInputElement>('height').value = String(state.intent.height * 100);
               labels();
            }
            if (first) {
               for (const key of ['tee', 'pin', 'moisture', 'towardDeg'] as const)
                  $<HTMLInputElement>(key).value = String(state.setup[key]);
               $<HTMLSelectElement>('windChoice').value = state.setup.wind;
            }
            $<HTMLSelectElement>('renderer').value = state.renderer;
         }
      },
      (ok, reason) => {
         connected = ok;
         if (!ok) {
            display = false;
            state = undefined;
            pending.clear();
            dirty = false;
            pendingInput = false;
         }
         $('connection').textContent = reason;
         availability();
      },
   );
   for (const id of ['club', 'effort', 'shape', 'height']) {
      $(id).addEventListener('input', () => {
         labels();
         dirty = true;
         if (pendingInput) return;
         pendingInput = true;
         requestAnimationFrame(() => {
            latestInput = send({ action: 'INTENT', intent: intent() }) || '';
            pendingInput = false;
         });
      });
   }
   $('play').onclick = () => {
      if (!state) return;
      $('notice').textContent = '';
      send(
         state.phase === 'plan'
            ? { action: 'PLAY', shot: state.shot, intent: intent() }
            : { action: state.phase === 'animating' ? 'SKIP' : 'NEXT' },
      );
   };
   $('mulligan').onclick = () => send({ action: 'MULLIGAN' });
   $('reset').onclick = () => send({ action: 'RESET' });
   const mode = (next: 'aim' | 'probe') => {
      target = next;
      $('aimMode').setAttribute('aria-pressed', String(next === 'aim'));
      $('inspectMode').setAttribute('aria-pressed', String(next === 'probe'));
      $('touchpad').firstElementChild!.textContent =
         next === 'aim' ? 'Drag to aim' : 'Drag to inspect';
   };
   $('aimMode').onclick = () => mode('aim');
   $('inspectMode').onclick = () => mode('probe');
   function move(dx: number, dy: number) {
      const factor = $<HTMLInputElement>('fine').checked ? 0.1 : 1;
      send({ action: 'MOVE', target, dx: dx * factor, dy: dy * factor });
   }
   const touchpad = $('touchpad');
   touchpad.onpointerdown = (e) => {
      pointer = { x: e.clientX, y: e.clientY, id: e.pointerId };
      touchpad.setPointerCapture(e.pointerId);
   };
   touchpad.onpointermove = (e) => {
      if (!pointer || pointer.id !== e.pointerId) return;
      move(
         Math.max(-100, Math.min(100, (e.clientX - pointer.x) * 0.6)),
         Math.max(-100, Math.min(100, (pointer.y - e.clientY) * 0.6)),
      );
      pointer = { x: e.clientX, y: e.clientY, id: e.pointerId };
   };
   touchpad.onpointerup = touchpad.onpointercancel = () => {
      pointer = null;
   };
   touchpad.onkeydown = (e) => {
      const delta = (
         { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] } as Record<
            string,
            number[]
         >
      )[e.key];
      if (delta) {
         e.preventDefault();
         move(delta[0], delta[1]);
      }
   };
   for (const button of document.querySelectorAll<HTMLButtonElement>('[data-dx]'))
      button.onclick = () => move(Number(button.dataset.dx), Number(button.dataset.dy));
   for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view]'))
      button.onclick = () =>
         send({ action: 'VIEW', view: button.dataset.view as 'hole' | 'ball' | 'green' });
   $('renderer').onchange = () =>
      send({
         action: 'RENDERER',
         renderer: $<HTMLSelectElement>('renderer').value as 'procedural' | 'photo',
      });
   $('applySetup').onclick = () =>
      send({
         action: 'SETUP',
         setup: {
            tee: $<HTMLSelectElement>('tee').value as Setup['tee'],
            pin: $<HTMLSelectElement>('pin').value as Setup['pin'],
            wind: $<HTMLSelectElement>('windChoice').value as Setup['wind'],
            moisture: $<HTMLSelectElement>('moisture').value as Setup['moisture'],
            towardDeg: Number($<HTMLInputElement>('towardDeg').value),
         },
      });
   window.addEventListener('pagehide', () => relay.close(), { once: true });
}
