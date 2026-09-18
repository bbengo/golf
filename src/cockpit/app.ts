import type { ControlTransport } from './transport';
import { cockpitMarkup } from './markup';
import { type Command, type Intent, type Snapshot, type Setup } from '../core/contracts/cockpit';
import { connectRelay } from '../core/network/relay-client';

export function startCockpit(root: HTMLElement = document.body, transport?: ControlTransport) {
   root.classList.add('cockpit');
   root.innerHTML = cockpitMarkup;
   const $ = <T extends HTMLElement>(id: string) => root.querySelector('#' + id) as T;
   let latestSetup: Setup | undefined;
   let theme = 'dark';
   try {
      theme = localStorage.getItem('purity-theme') || 'dark';
   } catch {}
   const setTheme = (value: string) => {
      root.dataset.theme = value === 'light' ? 'light' : 'dark';
      $<HTMLSelectElement>('theme').value = root.dataset.theme;
      if (root === document.body)
         document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', root.dataset.theme === 'dark' ? '#131b17' : '#f3f4ec');
      try {
         localStorage.setItem('purity-theme', root.dataset.theme);
      } catch {}
   };
   setTheme(theme);
   $('theme').onchange = () => setTheme($<HTMLSelectElement>('theme').value);
   const panels = ['shot', 'bag', 'round'];
   function showPanel(name: string, record = true) {
      const next = panels.includes(name) ? name : 'shot';
      if (root === document.body && record && root.dataset.panel !== next)
         history.pushState({ panel: next }, '', `#${next}`);
      root.dataset.panel = next;
      const backLabel =
         next !== 'shot' ? 'Back to shot' : transport ? 'Collapse controls' : 'Controller menu';
      $('controllerBack').setAttribute('aria-label', backLabel);
      $('controllerBack').title = backLabel;
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-panel]'))
         button.setAttribute('aria-pressed', String(button.dataset.panel === next));
      for (const panel of root.querySelectorAll<HTMLElement>('[data-control-panel]'))
         panel.hidden = panel.dataset.controlPanel !== next;
   }
   for (const button of root.querySelectorAll<HTMLButtonElement>('[data-panel]'))
      button.onclick = () => showPanel(button.dataset.panel!);
   showPanel(root === document.body ? location.hash.slice(1) : 'shot', false);
   if (root === document.body)
      window.addEventListener('popstate', () => showPanel(location.hash.slice(1), false));
   $('controllerBack').onclick = () => {
      if (root.dataset.panel !== 'shot') showPanel('shot');
      else if (transport) root.dispatchEvent(new CustomEvent('collapse-controls'));
      else $<HTMLDialogElement>('controllerMenu').showModal();
   };
   $('closeControllerMenu').onclick = () => $<HTMLDialogElement>('controllerMenu').close();

   const settings = $<HTMLDialogElement>('courseSettings');
   $('openSettings').onclick = () => {
      if (latestSetup) {
         for (const key of ['tee', 'pin', 'moisture', 'towardDeg'] as const)
            $<HTMLInputElement>(key).value = String(latestSetup[key]);
         $<HTMLSelectElement>('windChoice').value = latestSetup.wind;
      }
      settings.showModal();
   };
   $('closeSettings').onclick = () => settings.close();
   settings.addEventListener('click', (event) => {
      const box = settings.getBoundingClientRect();
      if (
         event.target === settings &&
         (event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom)
      )
         settings.close();
   });
   const token = new URLSearchParams(location.search).get('token');
   if (!token && !transport) {
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
      const select = $<HTMLSelectElement>('club');
      $('clubName').textContent = select.selectedOptions[0]?.textContent || i.club;
      if (!state || state.phase === 'plan')
         $('dockHint').textContent =
            `${select.selectedOptions[0]?.textContent || i.club} \u00b7 ${Math.round(i.effort * 100)}% effort`;
      $('effortValue').textContent = `${Math.round(i.effort * 1000) / 10}%`;
      $('shapeValue').textContent =
         i.shape === 0
            ? 'Straight'
            : `${Math.abs(Math.round(i.shape * 100))}% ${i.shape > 0 ? 'draw' : 'fade'}`;
      $('heightValue').textContent =
         i.height === 0
            ? 'Stock'
            : `${Math.abs(Math.round(i.height * 100))}% ${i.height > 0 ? 'higher' : 'lower'}`;
      $('tuningSummary').textContent =
         `${i.shape === 0 ? 'Straight' : i.shape > 0 ? 'Draw' : 'Fade'} · ${i.height === 0 ? 'stock height' : i.height > 0 ? 'high flight' : 'low flight'}`;
      for (const id of ['effort', 'shape', 'height']) {
         const slider = $<HTMLInputElement>(id);
         slider.style.setProperty(
            '--fill',
            `${((Number(slider.value) - Number(slider.min)) / (Number(slider.max) - Number(slider.min))) * 100}%`,
         );
      }
   }
   function availability() {
      $<HTMLFieldSetElement>('controls').disabled = !connected || !display || !state;
      $<HTMLFieldSetElement>('settingsControls').disabled =
         !connected || !display || !state || state.phase === 'animating';
      root.classList.toggle('is-connected', connected && display);
   }
   const connect: ControlTransport =
      transport || ((receive, status) => connectRelay('cockpit', token!, receive, status));
   const relay = connect(
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
               $('latency').textContent =
                  `${Math.round(performance.now() - started)} ms command round trip. Both devices are connected locally.`;
         }
         if (message.type === 'STATE') {
            const first = !state;
            state = message;
            latestSetup = state.setup;
            root.dataset.phase = state.phase;
            availability();
            $('distance').textContent = Math.round(state.distance / 0.9144).toString();
            $('shot').textContent = String(state.shot);
            $('roundShot').textContent = String(state.shot);
            $('roundStatus').textContent =
               state.phase === 'plan'
                  ? 'Ready to play'
                  : state.phase === 'animating'
                    ? 'Ball in motion'
                    : 'Shot complete';
            $('lie').textContent = state.lie;
            $('wind').textContent = `${state.wind.strength} wind toward ${state.wind.direction}`;
            $<HTMLProgressElement>('windBar').value = state.wind.fraction;
            $('terrain').textContent =
               `${state.terrain.surface} · ${state.terrain.gradePercent.toFixed(1)}% slope · falls ${state.terrain.downhillLabel} · ${(state.terrain.z / 0.3048).toFixed(0)} ft elevation`;
            const status = state.result?.status;
            const recover = state.phase === 'resolved' && status !== 'settled';
            $('phaseTitle').textContent =
               state.phase === 'plan'
                  ? 'Your next shot.'
                  : state.phase === 'animating'
                    ? 'Watch it fly.'
                    : status === 'holed'
                      ? 'That’s the hole.'
                      : status === 'water'
                        ? 'A little too wet.'
                        : 'Take it from here.';
            $('phaseHint').textContent =
               state.phase === 'plan'
                  ? 'Set your line, then make your move.'
                  : state.phase === 'animating'
                    ? 'Eyes on the course. We’ll follow the ball.'
                    : status === 'settled'
                      ? 'Your ball is down. Ready for the next one?'
                      : 'Try a mulligan, or start a fresh hole.';
            $('play').textContent =
               state.phase === 'animating'
                  ? 'Show result'
                  : state.phase === 'resolved'
                    ? recover
                       ? status === 'holed'
                          ? 'Play again'
                          : 'Restart hole'
                       : 'Next shot'
                    : 'Play this shot';
            $<HTMLButtonElement>('mulligan').disabled = !state.canMulligan;
            $('dockHint').textContent =
               state.phase === 'plan'
                  ? `${$<HTMLSelectElement>('club').selectedOptions[0]?.textContent || state.intent.club} · ${Math.round(state.intent.effort * 100)}% effort`
                  : state.phase === 'animating'
                    ? 'Shot in progress'
                    : recover
                      ? 'A fresh start is one tap away.'
                      : 'On to the next shot.';
            $('resultCard').hidden = state.phase !== 'resolved';
            $('result').textContent = state.result
               ? `${(state.result.carry / 0.9144).toFixed(0)} yd carry · ${(state.result.total / 0.9144).toFixed(0)} yd total · ${state.result.surface}`
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
         $('connection').textContent = ok ? 'Connected to your course' : reason;
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
            : {
                 action:
                    state.phase === 'animating'
                       ? 'SKIP'
                       : state.result?.status === 'settled'
                         ? 'NEXT'
                         : 'RESET',
              },
      );
   };
   $('mulligan').onclick = () => send({ action: 'MULLIGAN' });
   $('reset').onclick = () => {
      send({ action: 'RESET' });
      settings.close();
   };
   const mode = (next: 'aim' | 'probe') => {
      target = next;
      $('aimMode').setAttribute('aria-pressed', String(next === 'aim'));
      $('inspectMode').setAttribute('aria-pressed', String(next === 'probe'));
      $('padTitle').textContent =
         next === 'aim' ? 'Drag here. Watch the course.' : 'Explore the ground.';
      $('padHelp').textContent =
         next === 'aim'
            ? 'Your aim moves with your finger.'
            : 'Move the pad. Read the slope below.';
      $('terrain').hidden = next === 'aim';
      $('touchpad').setAttribute(
         'aria-label',
         next === 'aim'
            ? 'Drag or use arrow keys to move the aim point'
            : 'Drag or use arrow keys to inspect terrain',
      );
   };
   $('aimMode').onclick = () => mode('aim');
   $('inspectMode').onclick = () => mode('probe');
   function move(dx: number, dy: number) {
      if (
         !connected ||
         !display ||
         !state ||
         state.phase === 'animating' ||
         (target === 'aim' && state.phase !== 'plan')
      )
         return;
      const factor = $<HTMLInputElement>('fine').checked ? 0.1 : 1;
      const angle = state.cameraAngle || 0,
         co = Math.cos(angle),
         si = Math.sin(angle);
      send({
         action: 'MOVE',
         target,
         dx: Math.max(-100, Math.min(100, (co * dx + si * dy) * factor)),
         dy: Math.max(-100, Math.min(100, (-si * dx + co * dy) * factor)),
      });
   }
   const touchpad = $('touchpad');
   touchpad.onpointerdown = (e) => {
      if (
         !connected ||
         !display ||
         !state ||
         state.phase === 'animating' ||
         (target === 'aim' && state.phase !== 'plan')
      )
         return;
      pointer = { x: e.clientX, y: e.clientY, id: e.pointerId };
      touchpad.classList.add('is-dragging');
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
      touchpad.classList.remove('is-dragging');
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
   for (const button of root.querySelectorAll<HTMLButtonElement>('[data-dx]'))
      button.onclick = () => move(Number(button.dataset.dx), Number(button.dataset.dy));
   for (const button of root.querySelectorAll<HTMLButtonElement>('[data-view]'))
      button.onclick = () =>
         send({ action: 'VIEW', view: button.dataset.view as 'hole' | 'ball' | 'green' });
   $('renderer').onchange = () =>
      send({
         action: 'RENDERER',
         renderer: $<HTMLSelectElement>('renderer').value as 'procedural' | 'photo',
      });
   $('applySetup').onclick = () => {
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
      settings.close();
   };
   $('chooseClub').onclick = () => showPanel('bag');
   $('backToShot').onclick = () => showPanel('shot');
   $('roundSettings').onclick = () => $('openSettings').click();
   labels();
   window.addEventListener('pagehide', () => relay.close(), { once: true });
}
