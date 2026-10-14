import { Shot } from '../core/simulation/shot.js';
import { Course } from '../core/course/course.js';
import type { CockpitSession } from '../core/session/cockpit-session';
import { caddyMarkup, clubArt, mountCaddy } from '../cockpit/caddy';
import {
   CLUBS,
   type Command,
   type Intent,
   type Snapshot,
   type Point,
} from '../core/contracts/cockpit';

export type DesktopAction = Command extends infer C
   ? C extends Command
      ? Omit<C, 'type' | 'id'>
      : never
   : never;
const names: Record<string, string> = {
   D: 'Driver',
   '3W': '3 wood',
   '4I': '4 iron',
   '6I': '6 iron',
   '8I': '8 iron',
   PW: 'Pitching wedge',
   SW: 'Sand wedge',
   CHIP: 'Chip',
   PUTT: 'Putter',
};

/** Desktop presentation; all commands still pass through the authoritative session. */
export function startDesktop(
   root: HTMLElement,
   send: (action: DesktopAction) => void,
   aim: (point: Point, target: 'aim' | 'probe') => void,
   session: CockpitSession,
) {
   root.innerHTML = `
   <section id="desktopStrategy" class="desktop-strategy" aria-label="Aim and shot shaping" hidden></section>
   <aside class="course-info" aria-label="Round information"><p class="hud-eyebrow">CREEK & SHOULDER <span>01</span></p><div class="hud-distance"><strong id="desktopDistance">—</strong><span>yds to aim</span></div><div class="hud-facts"><span>SHOT <b id="desktopShot">1</b></span><span id="desktopLie">Tee</span></div><p id="desktopPinDistance"></p><p id="desktopSetupSummary"></p><p id="desktopWind" class="hud-weather"></p><div class="wind-instrument" aria-label="Live wind"><span id="desktopWindNeedle" aria-hidden="true">&#8593;</span><meter id="desktopWindStrength" min="0" max="1" aria-label="Wind strength"></meter></div><p id="desktopTeeYardages"></p><p id="desktopProbe" hidden></p></aside>
   <nav class="view-toolbar" aria-label="Course view"><button data-view="hole">Whole hole</button><button data-view="ball">Ball</button><button data-view="green">Green</button><button id="desktopZoomOut" aria-label="Zoom out">&minus;</button><button id="desktopZoomIn" aria-label="Zoom in">+</button><button id="desktopNorth" aria-label="Reset north up">N <span id="northNeedle" aria-hidden="true">↑</span></button></nav>
   <dialog id="desktopCaddy" class="caddy-dialog" aria-labelledby="caddyTitle"><header><div><p class="eyebrow">YOUR CADDY</p><h2 id="caddyTitle">Choose your next club.</h2></div><button id="closeCaddy" aria-label="Close caddy">&times;</button></header><p class="caddy-intro">Woods for distance. Irons for approach. Touch around the green.</p>${caddyMarkup()}</dialog><section class="shot-dock" aria-label="Desktop shot controls">
    <header><div class="aim-switch" role="group" aria-label="Pointer action"><button id="desktopAim" aria-pressed="true">Aim</button><button id="desktopInspect" aria-pressed="false">Inspect ground</button></div><span class="desktop-hint">Click the course · Drag to explore · Alt + arrows to fine aim</span><button id="desktopTune" aria-expanded="false" aria-controls="desktopTuning">Shape & flight</button></header>
    <div id="desktopTuning" class="desktop-tuning" hidden><label>Shape <output id="desktopShapeValue">Straight</output><input id="desktopShape" type="range" min="-100" max="100" value="0"></label><label>Flight <output id="desktopHeightValue">Normal</output><input id="desktopHeight" type="range" min="-100" max="100" value="0"></label><button id="desktopNeutral">Reset shaping</button></div>
    <p id="desktopCarryGuide" class="desktop-carry-guide"></p><button id="desktopStock" class="stock-action">Use my stock shot</button><div class="shot-dock-main"><div class="desktop-club"><button id="openCaddy" aria-haspopup="dialog"><span id="selectedClubArt"></span><span><small>IN YOUR HAND</small><strong id="selectedClubName">Driver</strong></span><span aria-hidden="true">&#8963;</span></button><select id="desktopClub" hidden aria-label="Selected club">${CLUBS.map((c) => `<option value="${c}">${names[c]}</option>`).join('')}</select></div><label class="desktop-effort">EFFORT <output id="desktopEffortValue">100%</output><input id="desktopEffort" type="range" min="15" max="110" value="100"></label><button id="desktopPlay" class="desktop-play">Play shot <kbd>Space</kbd></button></div>
    <footer><span id="desktopResult" role="status">Set your line and choose your club.</span><button id="desktopGimme" title="Concede one practice stroke on the green; not a physical putt" disabled>Gimme</button><button id="desktopMulligan" disabled>Mulligan</button></footer>
   </section><p id="desktopNotice" role="status" class="desktop-notice" hidden></p>`;
   const $ = <T extends HTMLElement>(id: string) => root.querySelector('#' + id) as T;
   const dock = root.querySelector<HTMLElement>('.shot-dock')!;
   const strategy = $('desktopStrategy');
   const shotHeader = dock.querySelector<HTMLElement>('header')!;
   const tuning = $('desktopTuning');
   const guide = $('desktopCarryGuide'),
      stock = $('desktopStock');
   const wide = matchMedia('(min-width: 1200px)');
   const layout = () => {
      const split = wide.matches && document.body.dataset.desktopLayout === 'distributed';
      if (split && shotHeader.parentElement !== strategy)
         strategy.append(shotHeader, tuning, guide, stock);
      else if (!split && shotHeader.parentElement !== dock)
         dock.prepend(shotHeader, tuning, guide, stock);
      strategy.hidden = !split;
   };
   wide.addEventListener('change', layout);
   new MutationObserver(layout).observe(document.body, {
      attributes: true,
      attributeFilter: ['data-desktop-layout'],
   });
   layout();
   const caddy = $<HTMLDialogElement>('desktopCaddy');
   const refreshCaddy = mountCaddy(root, $<HTMLSelectElement>('desktopClub'), () => caddy.close());
   $('openCaddy').onclick = () => {
      refreshCaddy();
      caddy.showModal();
   };
   $('closeCaddy').onclick = () => caddy.close();
   caddy.onclick = (event) => {
      if (event.target === caddy) {
         const r = caddy.getBoundingClientRect();
         if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
         )
            caddy.close();
      }
   };
   let state: Snapshot | undefined;
   let target: 'aim' | 'probe' = 'aim';
   const intent = (): Intent => ({
      club: $<HTMLSelectElement>('desktopClub').value as Intent['club'],
      effort: Number($<HTMLInputElement>('desktopEffort').value) / 100,
      shape: Number($<HTMLInputElement>('desktopShape').value) / 100,
      height: Number($<HTMLInputElement>('desktopHeight').value) / 100,
   });
   const update = () => send({ action: 'INTENT', intent: intent() });
   for (const id of ['desktopClub', 'desktopEffort', 'desktopShape', 'desktopHeight'])
      $(id).oninput = update;
   $('desktopStock').onclick = () => {
      if (state?.phase === 'plan')
         send({ action: 'INTENT', intent: { ...state.intent, effort: 1, shape: 0, height: 0 } });
   };
   const teeLengths = ['blue', 'white', 'red']
      .map(
         (tee) =>
            `${tee}: ${Math.round(Course.holeLength(Course.selectSetup(session.course, { ...session.setup, tee })) / 0.9144)} yd`,
      )
      .join(' / ');
   $('desktopTeeYardages').textContent = teeLengths;
   let carryKey = '';
   let carryTimer: ReturnType<typeof setTimeout> | undefined;
   $('desktopNeutral').onclick = () => {
      $<HTMLInputElement>('desktopShape').value = '0';
      $<HTMLInputElement>('desktopHeight').value = '0';
      update();
   };
   $('desktopTune').onclick = () => {
      const panel = $('desktopTuning');
      panel.hidden = !panel.hidden;
      $('desktopTune').setAttribute('aria-expanded', String(!panel.hidden));
   };
   for (const [id, value] of [
      ['desktopAim', 'aim'],
      ['desktopInspect', 'probe'],
   ] as const)
      $(id).onclick = () => {
         target = value;
         $('desktopAim').setAttribute('aria-pressed', String(target === 'aim'));
         $('desktopInspect').setAttribute('aria-pressed', String(target === 'probe'));
         $('desktopProbe').hidden = target !== 'probe';
         root.dataset.pointer = target;
      };
   for (const button of root.querySelectorAll<HTMLButtonElement>('[data-view]'))
      button.onclick = () =>
         send({ action: 'VIEW', view: button.dataset.view as 'hole' | 'ball' | 'green' });
   const play = () => {
      if (!state) return;
      if (state.phase === 'plan') send({ action: 'PLAY', shot: state.shot, intent: intent() });
      else if (state.phase === 'animating') send({ action: 'SKIP' });
      else send({ action: state.result?.status === 'settled' ? 'NEXT' : 'RESET' });
   };
   $('desktopPlay').onclick = play;
   $('desktopGimme').onclick = () => send({ action: 'CONCEDE' });
   $('desktopMulligan').onclick = () => send({ action: 'MULLIGAN' });
   return {
      play,
      pick(point: Point) {
         if (state && (state.phase === 'plan' || target === 'probe')) aim(point, target);
      },
      notice(message: string) {
         $('desktopNotice').textContent = message;
         $('desktopNotice').hidden = !message;
      },
      render(next: Snapshot) {
         state = next;
         root.dataset.phase = next.phase;
         $('northNeedle').style.transform = `rotate(${-next.cameraAngle}rad)`;
         $('desktopDistance').textContent = String(Math.round(next.distance / 0.9144));
         $('desktopPinDistance').textContent =
            `${Math.round(Math.hypot(session.course.pin.x - next.ball.x, session.course.pin.y - next.ball.y) / 0.9144)} yd to pin`;
         $('desktopSetupSummary').textContent =
            `${next.setup.tee} tee - ${next.setup.pin} pin - ${next.setup.moisture} ground`;
         const key = JSON.stringify([session.golfer.revision, next.intent]);
         if (key !== carryKey) {
            carryKey = key;
            clearTimeout(carryTimer);
            $('desktopCarryGuide').textContent =
               next.intent.club === 'PUTT'
                  ? 'Putter: pace depends on distance and ground.'
                  : 'Updating stock reference...';
            if (next.intent.club !== 'PUTT')
               carryTimer = setTimeout(() => {
                  $('desktopCarryGuide').textContent =
                     `Original flat-calm reference: ${(Shot.referenceCarry(session.golfer, next.intent.club, next.intent.effort, next.intent) / 0.9144).toFixed(0)} yd carry. Wind, elevation and lie are not compensated.`;
               }, 180);
         }
         $<HTMLButtonElement>('desktopStock').disabled = next.phase !== 'plan';
         $('desktopShot').textContent = String(next.shot);
         $('desktopLie').textContent = next.lie;
         $('desktopWind').textContent =
            `${next.wind.strength} wind · toward ${next.wind.direction}`;
         $('desktopWindNeedle').style.transform = `rotate(${next.wind.rotation}deg)`;
         $<HTMLMeterElement>('desktopWindStrength').value = next.wind.fraction;
         $('desktopProbe').textContent =
            `${next.terrain.surface} · ${next.terrain.gradePercent.toFixed(1)}% slope · ${next.terrain.downhillLabel}`;
         for (const [id, value] of [
            ['desktopClub', next.intent.club],
            ['desktopEffort', Math.round(next.intent.effort * 100)],
            ['desktopShape', Math.round(next.intent.shape * 100)],
            ['desktopHeight', Math.round(next.intent.height * 100)],
         ] as const) {
            const input = $<HTMLInputElement>(id);
            input.value = String(value);
            input.disabled = next.phase !== 'plan';
         }
         $('selectedClubArt').innerHTML = clubArt(next.intent.club);
         $('selectedClubName').textContent = names[next.intent.club];
         $<HTMLButtonElement>('openCaddy').disabled = next.phase !== 'plan';
         refreshCaddy();
         if (next.phase !== 'plan' && caddy.open) caddy.close();
         $<HTMLButtonElement>('desktopNeutral').disabled = next.phase !== 'plan';
         $('desktopEffortValue').textContent = `${Math.round(next.intent.effort * 100)}%`;
         $('desktopShapeValue').textContent =
            next.intent.shape === 0
               ? 'My stock curve'
               : `${Math.abs(Math.round(next.intent.shape * 100))}% ${next.intent.shape > 0 ? 'draw' : 'fade'}`;
         $('desktopHeightValue').textContent =
            next.intent.height === 0
               ? 'My stock height'
               : `${Math.abs(Math.round(next.intent.height * 100))}% ${next.intent.height < 0 ? 'low' : 'high'}`;
         $('desktopPlay').textContent =
            next.phase === 'plan'
               ? 'Play shot'
               : next.phase === 'animating'
                 ? 'Show result'
                 : next.result?.status === 'settled'
                   ? 'Next shot'
                   : 'Play again';
         $<HTMLButtonElement>('desktopGimme').disabled = !session.canConcede();
         $<HTMLButtonElement>('desktopMulligan').disabled = !next.canMulligan;
         $('desktopResult').textContent =
            next.result?.status === 'conceded'
               ? 'Practice conceded: one stroke. Ball was not physically holed.'
               : next.result && next.phase === 'resolved'
                 ? `${next.result.status} · ${Math.round(next.result.carry / 0.9144)} yd carry · ${Math.round(next.result.total / 0.9144)} yd total`
                 : next.phase === 'animating'
                   ? 'Shot in flight'
                   : 'Click to aim. Space to play.';
      },
   };
}
