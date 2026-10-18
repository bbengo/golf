import { caddyMarkup, clubArt, clubNames } from '../cockpit/caddy';
import type { Club, Intent, Point } from '../core/contracts/cockpit';
import type { CockpitSession } from '../core/session/cockpit-session';
import type { DesktopAction } from './desktop-controls';
import type { LandscapeInteraction } from '../core/rendering/landscape-preview';

/** An alternate desktop surface; commands use the same relay publication and session gate. */
export function mountLandscapeControls(
   dialog: HTMLDialogElement,
   session: CockpitSession,
   send: (action: DesktopAction) => boolean,
   aim: (point: Point, target: 'aim' | 'probe') => void,
): LandscapeInteraction {
   const course = session.course;
   const root = document.createElement('section');
   root.className = 'landscape-play';
   root.setAttribute('aria-label', 'Angled shot controls');
   root.innerHTML = `<button class="landscape-play-toggle" aria-expanded="false">Play in this view</button>
   <div class="landscape-shot-panel" hidden>
      <div class="landscape-shot-heading"><span class="hud-eyebrow">YOUR NEXT SHOT</span><button data-close aria-label="Hide shot controls">&times;</button></div>
      <p class="landscape-shot-readout"></p>
      <div class="landscape-shot-main"><button data-club aria-expanded="false" aria-label="Choose angled club"></button>
      <label>Effort <output data-effort-value></output><input data-effort aria-label="Angled effort" type="range" min="15" max="110" step="1"></label>
      <button data-play class="landscape-shot-action">Play shot</button></div>
      <div data-caddy-panel hidden>${caddyMarkup()}</div>
      <details class="landscape-shaping"><summary>Shape &amp; flight</summary><div><label>Shape <output data-shape-value></output><input data-shape aria-label="Angled shape" type="range" min="-100" max="100"></label><label>Height <output data-height-value></output><input data-height aria-label="Angled height" type="range" min="-100" max="100"></label><button data-stock>Stock shot</button></div></details>
      <div class="landscape-shot-footer"><span role="status" data-notice>Click ground to aim. Drag to explore.</span><button data-mulligan>Mulligan</button></div>
   </div>`;
   dialog.append(root);
   const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
   const panel = get<HTMLElement>('.landscape-shot-panel');
   const toggle = get<HTMLButtonElement>('.landscape-play-toggle');
   let active = false,
      key = '',
      club: Club | undefined;
   const activate = (value: boolean) => {
      active = value;
      panel.hidden = !value;
      toggle.hidden = value;
      toggle.setAttribute('aria-expanded', String(value));
      dialog.dataset.playing = String(value);
      if (value) dialog.querySelector('canvas')?.focus();
      else toggle.focus();
   };
   toggle.onclick = () => activate(true);
   get('[data-close]').onclick = () => activate(false);
   const apply = (action: DesktopAction) => {
      const ok = send(action);
      get('[data-notice]').textContent = ok
         ? 'Click ground to aim. Drag to explore.'
         : 'That action is unavailable. Check the current shot.';
      key = '';
      render();
      return ok;
   };
   const change = (patch: Partial<Intent>) =>
      apply({ action: 'INTENT', intent: { ...session.intent, ...patch } });
   for (const field of ['effort', 'shape', 'height'] as const)
      get<HTMLInputElement>(`[data-${field}]`).oninput = (event) =>
         change({ [field]: Number((event.target as HTMLInputElement).value) / 100 });
   get('[data-club]').onclick = () => {
      const caddy = get('[data-caddy-panel]');
      caddy.hidden = !caddy.hidden;
      get('[data-club]').setAttribute('aria-expanded', String(!caddy.hidden));
   };
   for (const button of root.querySelectorAll<HTMLButtonElement>('[data-caddy]'))
      button.onclick = () => {
         if (change({ club: button.dataset.caddy as Club })) {
            get('[data-caddy-panel]').hidden = true;
            get('[data-club]').setAttribute('aria-expanded', 'false');
            get('[data-club]').focus();
         }
      };
   get('[data-stock]').onclick = () => change({ effort: 1, shape: 0, height: 0 });
   get('[data-mulligan]').onclick = () => apply({ action: 'MULLIGAN' });
   get('[data-play]').onclick = () => {
      if (session.phase === 'plan')
         apply({ action: 'PLAY', shot: session.shot, intent: { ...session.intent } });
      else apply({ action: session.phase === 'animating' ? 'SKIP' : 'NEXT' });
   };
   function render() {
      const signature = `${session.revision}:${session.phase}:${JSON.stringify(session.intent)}:${session.aim.x}:${session.aim.y}`;
      if (signature === key) return;
      key = signature;
      const state = session.snapshot();
      const planning = state.phase === 'plan';
      if (club !== state.intent.club) {
         club = state.intent.club;
         get('[data-club]').innerHTML = `${clubArt(club)}<span>${clubNames[club]}</span>`;
      }
      for (const field of ['effort', 'shape', 'height'] as const) {
         const input = get<HTMLInputElement>(`[data-${field}]`);
         input.value = String(Math.round(state.intent[field] * 100));
         input.disabled = !planning;
         get(`[data-${field}-value]`).textContent =
            field === 'effort'
               ? `${input.value}%`
               : Number(input.value) === 0
                 ? 'Stock'
                 : input.value;
      }
      get<HTMLButtonElement>('[data-club]').disabled = !planning;
      get<HTMLButtonElement>('[data-stock]').disabled = !planning;
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-caddy]')) {
         button.disabled = !planning;
         button.setAttribute('aria-pressed', String(button.dataset.caddy === club));
      }
      get<HTMLButtonElement>('[data-mulligan]').disabled =
         !state.canMulligan || state.phase === 'animating';
      const play = get<HTMLButtonElement>('[data-play]');
      play.textContent = planning
         ? 'Play shot'
         : state.phase === 'animating'
           ? 'Show result'
           : 'Next shot';
      play.disabled = state.phase === 'resolved' && state.result?.status !== 'settled';
      get('.landscape-shot-readout').textContent =
         `Shot ${state.shot} / ${state.lie} / ${Math.round(state.distance)} yd to aim / Wind ${state.wind.direction}`;
      if (state.result && state.phase === 'resolved')
         get('[data-notice]').textContent =
            `${state.result.carry.toFixed(0)} yd carry / ${state.result.total.toFixed(0)} yd total / ${state.result.status}`;
   }
   render();
   return {
      aiming: () => active && session.course === course && session.phase === 'plan',
      aim: (point) => {
         if (active && session.course === course && session.phase === 'plan') aim(point, 'aim');
      },
      render,
      dispose: () => root.remove(),
   };
}
