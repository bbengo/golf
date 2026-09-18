import QRCode from 'qrcode';
import { CockpitSession } from '../core/session/cockpit-session';
import { SimpleCourse } from '../core/rendering/simple-course';
import { connectRelay } from '../core/network/relay-client';
import type { Command } from '../core/contracts/cockpit';

export async function startDisplay() {
   document.body.className = 'display';
   document.body.innerHTML = `<canvas id="course" tabindex="0" aria-label="Golf course. Drag to explore, scroll to zoom, double click or press Home to see the whole hole."></canvas>
    <section id="pairing" class="pairing"><p class="eyebrow">PURITY · LOCAL PLAY</p><h1>The course is here.<br>The controls are in your hand.</h1>
    <p>Scan with your phone on the same Wi-Fi.</p><canvas id="qr" aria-label="Scan to open the cockpit"></canvas>
    <a id="cockpitLink" target="_blank" rel="noopener">Open cockpit on this device</a>
    <label id="networkLabel" hidden>Wi-Fi address <select id="network"></select></label>
    <p id="connection" role="status">Starting local session…</p><a href="/">Open the desktop lab</a></section>`;
   const session = new CockpitSession(),
      renderer = new SimpleCourse(document.querySelector('#course')!);
   let token: string, addresses: string[], port: number;
   try {
      const response = await fetch('/api/session');
      if (!response.ok) throw Error();
      ({ token, addresses, port } = await response.json());
   } catch {
      document.querySelector('#connection')!.textContent =
         'Run npm run local, then open the address it prints.';
      renderer.draw(session, performance.now());
      return;
   }
   const host = ['localhost', '127.0.0.1'].includes(location.hostname)
      ? addresses[0] || location.hostname
      : location.hostname;
   const network = document.querySelector<HTMLSelectElement>('#network')!;
   for (const address of new Set([host, ...addresses])) network.add(new Option(address, address));
   document.querySelector<HTMLElement>('#networkLabel')!.hidden = network.options.length < 2;
   async function pairing() {
      const url = new URL(location.href);
      url.hostname = network.value;
      url.port = String(port);
      url.search = '';
      url.searchParams.set('mode', 'cockpit');
      url.searchParams.set('token', token);
      await QRCode.toCanvas(document.querySelector('#qr'), url.href, {
         width: 210,
         margin: 2,
         color: { dark: '#132e27', light: '#f5f1e6' },
      });
      document.querySelector<HTMLAnchorElement>('#cockpitLink')!.href = url.href;
   }
   network.onchange = () => void pairing();
   await pairing();
   let paired = false;
   const relay = connectRelay(
      'display',
      token,
      (message) => {
         if (message.type === 'COMMAND') {
            const response = session.apply(message as Command);
            relay.send(response);
            relay.send(session.snapshot());
         } else if (message.type === 'PEERS') {
            if (message.cockpit) paired = true;
            document.querySelector<HTMLElement>('#pairing')!.hidden = paired;
            relay.send(session.snapshot());
         }
      },
      (connected, reason) => {
         document.querySelector('#connection')!.textContent = reason;
         if (connected) relay.send(session.snapshot());
      },
   );
   let lastPublish = 0,
      previousRevision = -1;
   function frame(time: number) {
      renderer.draw(session, time);
      if (time - lastPublish > 300 || session.revision !== previousRevision) {
         lastPublish = time;
         previousRevision = session.revision;
         relay.send(session.snapshot());
      }
      requestAnimationFrame(frame);
   }
   requestAnimationFrame(frame);
   window.addEventListener('pagehide', () => relay.close(), { once: true });
}
