import QRCode from 'qrcode';
import { CockpitSession } from '../core/session/cockpit-session';
import { SimpleCourse } from '../core/rendering/simple-course';
import { connectRelay } from '../core/network/relay-client';
import { startCockpit } from '../cockpit/app';
import type { Message } from '../core/contracts/cockpit';
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
   let localReceive: ((message: Message) => void) | undefined;
   let relay: ReturnType<typeof connectRelay> | undefined;
   let controlsOpen = false,
      phoneConnected = false,
      quiet = true;
   const initial =
      new URLSearchParams(location.search).get('mode') === 'display' ? 'pair' : 'title';
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
      localReceive?.(state);
      relay?.send(state);
   }
   startCockpit(controls, (receive, status) => {
      localReceive = receive;
      queueMicrotask(() => {
         status(true, 'Controls on this screen');
         receive({ type: 'PEERS', display: true, cockpit: true });
         receive(session.snapshot());
      });
      return {
         send(message) {
            if (message.type !== 'COMMAND') return false;
            const ack = session.apply(message);
            queueMicrotask(() => {
               receive(ack);
               publish();
            });
            return true;
         },
         close() {
            localReceive = undefined;
         },
      };
   });
   function showControls(open: boolean) {
      controlsOpen = open;
      quiet = true;
      $('toggleControls').setAttribute('aria-expanded', String(open));
      renderRoute();
   }
   controls.addEventListener('collapse-controls', () => {
      showControls(false);
      $('revealTools').focus();
   });
   $('toggleControls').onclick = () => showControls(!controlsOpen);
   $('quietView').onclick = () => {
      showControls(false);
      $('revealTools').focus();
   };
   $('revealTools').onclick = () => {
      controlsOpen = false;
      quiet = !quiet;
      renderRoute();
   };
   for (const [id, action] of [
      ['rotateLeft', 'left'],
      ['rotateRight', 'right'],
      ['northView', 'north'],
      ['fitView', 'fit'],
   ] as const)
      $(id).onclick = () => renderer.setView(action);
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
      if (controlsOpen || !quiet) showControls(false);
      else {
         quiet = false;
         renderRoute();
      }
      $('revealTools').focus();
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
      const onCourse = route === 'play' || route === 'pair';
      document.body.dataset.route = route;
      document.body.dataset.quiet = String(quiet && !controlsOpen);
      $('portal').hidden = onCourse;
      $('course').tabIndex = onCourse ? 0 : -1;
      $('displayTools').hidden = !onCourse || quiet;
      $('revealTools').hidden = !onCourse || route === 'pair';
      $('revealTools').setAttribute('aria-expanded', String(!quiet));
      $('revealTools').setAttribute('aria-label', quiet ? 'Open course menu' : 'Close course menu');
      controls.hidden = !onCourse || !controlsOpen || route === 'pair';
      document.body.classList.toggle('controls-open', onCourse && controlsOpen && route !== 'pair');
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
         quiet = false;
         showControls(true);
      });
   $('playHere').onclick = () => {
      quiet = false;
      showControls(true);
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
   let previousPhase = session.phase;
   function frame(time: number) {
      if (session.phase === 'animating' && previousPhase !== 'animating') showControls(false);
      previousPhase = session.phase;
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
               $('pairButton').textContent = phoneConnected
                  ? 'Phone connected ●'
                  : 'Connect phone ↗';
               if (joined) {
                  showControls(false);
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
