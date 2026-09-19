import QRCode from 'qrcode';
import { CockpitSession } from '../core/session/cockpit-session';
import { SimpleCourse } from '../core/rendering/simple-course';
import { connectRelay } from '../core/network/relay-client';
import { startDesktop, type DesktopAction } from './desktop-controls';
import { startOptions, savedDisplayMode, type DisplayMode } from './options';
import type { Point } from '../core/contracts/cockpit';
import { displayMarkup } from './markup';

export async function startDisplay() {
   document.body.className = 'experience';
   document.title = 'Purity — A wider view. A closer feel.';
   document.body.innerHTML = displayMarkup;
   const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
   const session = new CockpitSession(),
      renderer = new SimpleCourse($<HTMLCanvasElement>('course'));
   const pairing = $<HTMLDialogElement>('pairing'),
      controls = $('desktopControls');
   let relay: ReturnType<typeof connectRelay> | undefined;
   let phoneConnected = false,
      quiet = true;
   const initial =
      new URLSearchParams(location.search).get('mode') === 'display' ? 'pair' : 'title';
   let displayMode = savedDisplayMode(initial === 'pair' ? 'clear' : 'desktop');
   let previousPage = initial;
   let pairingReturn = 'play';
   let enteredRound = false;
   const fullscreen = $('fullscreenButton');
   fullscreen.hidden = !document.fullscreenEnabled;
   fullscreen.onclick = async () => {
      try {
         if (document.fullscreenElement) await document.exitFullscreen();
         else await document.documentElement.requestFullscreen();
         $('screenStatus').textContent = '';
      } catch {
         $('screenStatus').textContent =
            'Full screen is unavailable here. You can keep playing in this view.';
      }
   };
   document.addEventListener('fullscreenchange', () => {
      fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen ↗';
   });
   function publish() {
      const state = session.snapshot();
      desktop.render(state);
      relay?.send(state);
   }
   let commandSequence = 0;
   function send(action: DesktopAction) {
      const ack = session.apply({ type: 'COMMAND', id: `desktop-${++commandSequence}`, ...action });
      desktop.notice(ack.ok ? '' : ack.error || 'Could not apply that action.');
      publish();
      return ack.ok;
   }
   function aimAt(point: Point, target: 'aim' | 'probe') {
      const current = session[target];
      const dx = point.x - current.x,
         dy = point.y - current.y;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 100));
      for (let i = 0; i < steps; i++)
         if (!send({ action: 'MOVE', target, dx: dx / steps, dy: dy / steps })) break;
   }
   const desktop = startDesktop(controls, send, aimAt);
   function setMode(mode: DisplayMode) {
      displayMode = mode;
      try {
         localStorage.setItem('purity-display-mode', mode);
      } catch {}
      renderRoute();
   }
   const options = startOptions(
      $<HTMLDialogElement>('gameOptions'),
      () => session.snapshot(),
      () => displayMode,
      setMode,
      (setup) => send({ action: 'SETUP', setup }),
      () => navigate('pair'),
   );
   const openOptions = () => {
      quiet = true;
      renderRoute();
      options.open();
   };
   $('openGameOptions').onclick = openOptions;
   $('lobbyOptions').onclick = openOptions;
   $('quietView').onclick = () => {
      quiet = true;
      renderRoute();
      $('course').focus();
   };
   $('menuShade').onclick = () => {
      quiet = true;
      renderRoute();
   };
   $('revealTools').onclick = () => {
      quiet = !quiet;
      renderRoute();
   };
   $('desktopNorth').onclick = () => renderer.setView('north');
   const canvas = $<HTMLCanvasElement>('course');
   let down: { x: number; y: number; moved: boolean } | null = null;
   let pendingAim: ReturnType<typeof setTimeout> | undefined;
   canvas.addEventListener('dblclick', () => clearTimeout(pendingAim));
   canvas.addEventListener('pointerdown', (event) => {
      clearTimeout(pendingAim);
      down = event.button === 0 ? { x: event.clientX, y: event.clientY, moved: false } : null;
   });
   canvas.addEventListener('pointermove', (event) => {
      if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) >= 5)
         down.moved = true;
   });
   canvas.addEventListener('pointercancel', () => {
      down = null;
   });
   canvas.addEventListener('pointerup', (event) => {
      const clicked =
         down && !down.moved && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 5;
      down = null;
      if (
         !clicked ||
         document.body.dataset.route !== 'play' ||
         !quiet ||
         document.querySelector('dialog[open]')
      )
         return;
      if (displayMode === 'clear') {
         quiet = false;
         renderRoute();
         return;
      }
      if (displayMode === 'desktop') {
         const bounds = canvas.getBoundingClientRect();
         const point = renderer.camera.inverse({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
         });
         // Distinguish a target click from the existing double-click camera reset.
         pendingAim = setTimeout(() => {
            if (
               quiet &&
               displayMode === 'desktop' &&
               document.body.dataset.route === 'play' &&
               !document.querySelector('dialog[open]')
            )
               desktop.pick(point);
         }, 240);
      }
   });
   document.addEventListener('keydown', (event) => {
      if (
         document.body.dataset.route !== 'play' ||
         !quiet ||
         displayMode !== 'desktop' ||
         document.querySelector('dialog[open]') ||
         ![document.body, canvas].includes(document.activeElement as HTMLElement)
      )
         return;
      if (event.code === 'Space') {
         event.preventDefault();
         if (!event.repeat) desktop.play();
      }
      if (event.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
         event.preventDefault();
         const x = event.key === 'ArrowLeft' ? -2 : event.key === 'ArrowRight' ? 2 : 0;
         const y = event.key === 'ArrowDown' ? -2 : event.key === 'ArrowUp' ? 2 : 0;
         const angle = renderer.camera.angle;
         send({
            action: 'MOVE',
            target: 'aim',
            dx: Math.cos(angle) * x + Math.sin(angle) * y,
            dy: -Math.sin(angle) * x + Math.cos(angle) * y,
         });
      }
   });
   document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      const route = document.body.dataset.route;
      if (!['play', 'pair'].includes(route || '')) {
         if (route === 'title') return;
         navigate(
            route === 'editions'
               ? 'title'
               : route === 'home'
                 ? enteredRound
                    ? 'play'
                    : 'editions'
                 : 'home',
         );
         return;
      }
      if (!quiet) {
         quiet = true;
         renderRoute();
      } else {
         quiet = false;
         renderRoute();
      }
      if (!quiet) $('quietView').focus();
      else $('course').focus();
   });
   function navigate(route: string) {
      location.hash = route;
   }
   function renderRoute() {
      let route = location.hash.slice(1) || initial;
      if (
         !['title', 'editions', 'home', 'course', 'guide', 'story', 'play', 'pair'].includes(route)
      )
         route = 'title';
      if (route === 'pair' && previousPage !== 'pair') pairingReturn = previousPage;
      pairing.querySelector('.back-link')!.textContent =
         pairingReturn === 'play' ? '← Back to course' : '← Back to game menu';
      if (route === 'play') enteredRound = true;
      $('enterRoundLabel').textContent = enteredRound ? 'Resume practice' : 'Play';
      document.querySelector('.selected-action small')!.textContent =
         displayMode === 'desktop'
            ? 'Mouse & keyboard controls'
            : displayMode === 'minimal'
              ? 'Minimal HUD / phone controls'
              : 'Clear course / phone controls';
      const onCourse = route === 'play' || route === 'pair';
      document.body.dataset.route = route;
      document.body.dataset.quiet = String(displayMode === 'clear' || !quiet);
      document.body.dataset.displayMode = displayMode;
      $('portal').hidden = onCourse;
      $('course').tabIndex = onCourse ? 0 : -1;
      $('displayTools').hidden = !onCourse || quiet;
      $('revealTools').hidden = !onCourse || route === 'pair' || displayMode === 'clear';
      $('menuShade').hidden = !onCourse || quiet || route === 'pair';
      $('revealTools').setAttribute('aria-expanded', String(!quiet));
      $('revealTools').setAttribute('aria-label', quiet ? 'Open course menu' : 'Close course menu');
      controls.hidden = !onCourse || !quiet || displayMode === 'clear' || route === 'pair';
      document.body.classList.toggle('controls-open', false);
      for (const page of document.querySelectorAll<HTMLElement>('[data-page]'))
         page.hidden = page.dataset.page !== route;
      for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-route-link]')) {
         if (link.dataset.routeLink === route) link.setAttribute('aria-current', 'page');
         else link.removeAttribute('aria-current');
      }
      if (route === 'pair' && !pairing.open) pairing.showModal();
      else if (route !== 'pair' && pairing.open) pairing.close();
      if (!onCourse && route !== previousPage) {
         $('portal').scrollTop = 0;
         const heading = document.querySelector<HTMLElement>(`[data-page="${route}"] h1`);
         heading?.setAttribute('tabindex', '-1');
         heading?.focus({ preventScroll: true });
      }
      previousPage = route;
   }
   for (const link of document.querySelectorAll('[data-open-controls]'))
      link.addEventListener('click', () => {
         quiet = true;
         renderRoute();
      });
   $('playHere').onclick = () => {
      quiet = true;
      setMode('desktop');
      navigate('play');
   };
   $('closePairing').onclick = () => navigate(pairingReturn);
   pairing.querySelector<HTMLAnchorElement>('.back-link')!.onclick = (event) => {
      event.preventDefault();
      navigate(pairingReturn);
   };
   $('cockpitLink').onclick = async (event) => {
      event.preventDefault();
      const link = $<HTMLAnchorElement>('cockpitLink').href;
      try {
         await navigator.clipboard.writeText(link);
         $('cockpitLink').textContent = 'Pairing link copied';
      } catch {
         const input = $<HTMLInputElement>('pairUrl');
         input.value = link;
         input.hidden = false;
         input.focus();
         input.select();
      }
   };
   pairing.addEventListener('cancel', (event) => {
      event.preventDefault();
      navigate(pairingReturn);
   });
   window.addEventListener('hashchange', renderRoute);
   renderRoute();
   let lastPublish = 0,
      previousRevision = -1;
   function frame(time: number) {
      renderer.draw(session, time);
      if (time - lastPublish > 300 || session.revision !== previousRevision) {
         lastPublish = time;
         previousRevision = session.revision;
         publish();
      }
      requestAnimationFrame(frame);
   }
   requestAnimationFrame(frame);
   try {
      const response = await fetch('/api/session');
      if (!response.ok) throw Error();
      const { token, addresses, port } = (await response.json()) as {
         token: string;
         addresses: string[];
         port: number;
      };
      const host = ['localhost', '127.0.0.1'].includes(location.hostname)
         ? addresses[0] || location.hostname
         : location.hostname;
      const network = $<HTMLSelectElement>('network');
      for (const address of new Set([host, ...addresses]))
         network.add(new Option(address, address));
      $('networkLabel').hidden = network.options.length < 2;
      async function makeQR() {
         const url = new URL(location.href);
         url.hostname = network.value;
         url.port = String(port);
         url.hash = '';
         url.search = '';
         url.searchParams.set('mode', 'cockpit');
         url.searchParams.set('token', token);
         await QRCode.toCanvas($<HTMLCanvasElement>('qr'), url.href, {
            width: 190,
            margin: 2,
            color: { dark: '#1c2c21', light: '#f0f2e8' },
         });
         $<HTMLAnchorElement>('cockpitLink').href = url.href;
      }
      network.onchange = () => void makeQR();
      await makeQR();
      relay = connectRelay(
         'display',
         token,
         (message) => {
            if (message.type === 'COMMAND') {
               relay?.send(session.apply(message));
               publish();
            } else if (message.type === 'PEERS') {
               const joined = message.cockpit && !phoneConnected;
               phoneConnected = message.cockpit;
               options.phone(phoneConnected);
               if (joined) {
                  quiet = true;
                  renderRoute();
                  if (location.hash === '#pair' || (!location.hash && initial === 'pair'))
                     navigate('play');
               }
               publish();
            }
         },
         (connected, reason) => {
            $('qr').hidden = !connected;
            $('cockpitLink').hidden = !connected;
            $('pairStatus').textContent = connected ? 'Ready to pair · same Wi-Fi' : reason;
            if (connected) publish();
         },
      );
   } catch {
      $('qr').hidden = true;
      $('cockpitLink').hidden = true;
      $('pairStatus').textContent =
         'Phone pairing needs the local server. Run npm run local, then open its address. You can still play on this screen.';
   }
   window.addEventListener('pagehide', () => relay?.close(), { once: true });
}
