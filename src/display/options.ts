import { exposeChoices } from './choice-control';
import {
   DEFAULT_PRESENTATION,
   presentationChoice,
   type Presentation,
} from '../core/rendering/presentation';
import { daylightChoice, type Daylight } from '../core/rendering/daylight';
import type { Setup, Snapshot } from '../core/contracts/cockpit';
export type DisplayMode = 'desktop' | 'minimal' | 'clear';
export function savedDisplayMode(fallback: DisplayMode): DisplayMode {
   try {
      const value = localStorage.getItem('purity-display-mode');
      if (['desktop', 'minimal', 'clear'].includes(value || '')) return value as DisplayMode;
   } catch {}
   return fallback;
}
export function startOptions(
   dialog: HTMLDialogElement,
   state: () => Snapshot,
   mode: () => DisplayMode,
   changeMode: (mode: DisplayMode) => void,
   setup: (setup: Setup) => boolean,
   pair: () => void,
   renderer: (value: Snapshot['renderer']) => boolean,
   sunlight: (value: Daylight) => void,
   preview: () => void,
) {
   dialog.innerHTML = `<header><div><p class="hud-eyebrow">MAKE IT YOURS</p><h1 id="optionsTitle">Game options</h1></div><button id="closeGameOptions" aria-label="Close game options">×</button></header>
   <nav class="options-tabs" aria-label="Options sections"><button data-option-tab="experience" aria-pressed="true">Controls</button><button data-option-tab="camera" aria-pressed="false">Camera & ball</button><button data-option-tab="world" aria-pressed="false">Environment</button><button data-option-tab="course" aria-pressed="false">Practice conditions</button></nav>
   <div class="options-scroll">
   <section data-option-page="experience"><h2>Your screen, your choice.</h2><p>Choose how much interface accompanies your round. Phone controls work with every view.</p><fieldset class="display-choices"><legend>Display interface</legend>
   <label><input type="radio" name="displayMode" value="desktop"><span><strong>Desktop controls</strong><small>Mouse aiming, a shot dock and separate course readouts.</small></span></label>
   <label><input type="radio" name="displayMode" value="minimal"><span><strong>Minimal HUD</strong><small>Distance, lie and wind. Play from your phone.</small></span></label>
   <label><input type="radio" name="displayMode" value="clear"><span><strong>Clear course</strong><small>No interface or aim guides. Click the course or press Escape to open the menu.</small></span></label></fieldset>
   <label class="option-row"><span><strong>Desktop layout</strong><small>Distributed separates aiming tools from the shot dock on wide screens. Compact screens use the dock.</small></span><select data-presentation="desktopLayout" aria-label="Desktop layout"><option value="distributed">Distributed panels</option><option value="dock">Single dock</option></select></label>
   <div class="option-row"><div><h3>Phone controller</h3><p id="optionsPhoneStatus">Optional. Same course, touch controls.</p></div><button id="optionsPair">Connect phone</button></div>
   <a href="#guide" id="optionsGuide">Controls & how to play ↗</a>
   </section>
   <section data-option-page="camera" hidden><h2>Find your feel.</h2><p>Quick decisions, a smooth flight, and a ball you can keep in sight.</p>
   <label class="option-row"><span><strong>Follow the ball</strong><small>Camera follows shots; dragging takes over. Reduced motion takes priority.</small></span><input id="followBall" type="checkbox" checked></label>

   <label class="option-row"><span><strong>Camera response</strong><small>Manual zoom responds faster than automatic shot following.</small></span><select data-presentation="cameraFeel" aria-label="Camera response"><option value="balanced">Balanced</option><option value="responsive">Responsive</option><option value="cinematic">Cinematic</option></select></label>
   <label class="option-row"><span><strong>Ball finish</strong><small>Appearance only. The same ball physics.</small></span><select data-presentation="ballColour" aria-label="Ball finish"><option value="ivory">Ivory</option><option value="yellow">Tour yellow</option></select></label>
   <label class="option-row"><span><strong>Ball visibility</strong><small>The ball grows as you zoom. Enhanced adds a larger visual marker.</small></span><select data-presentation="ballVisibility" aria-label="Ball visibility"><option value="standard">Standard</option><option value="enhanced">Enhanced</option></select></label>
   <label class="option-row"><span><strong>Last-shot trace</strong><small>Follow the recorded ground track as the shot unfolds. Hidden in Clear course.</small></span><select data-presentation="shotTrace" aria-label="Last-shot trace"><option value="off">Off</option><option value="last">Show last shot</option></select></label>
   <label class="option-row"><span><strong>Landing cue</strong><small>A brief ring at first ground contact. Hidden with reduced motion or Clear course.</small></span><select data-presentation="impactCue" aria-label="Landing cue"><option value="subtle">Subtle</option><option value="off">Off</option></select></label>
   </section>
   <section data-option-page="world" hidden><h2>A place to play.</h2><p>Choose your landscape and the light across it.</p>
   <label class="option-row"><span><strong>Render quality</strong><small>Balanced suits most displays. Economy reduces GPU load; Crisp favours high-density screens.</small></span><select data-presentation="renderQuality" aria-label="Render quality"><option value="balanced">Balanced</option><option value="economy">Economy</option><option value="crisp">Crisp</option></select></label>
   <div class="option-row"><span><strong>Angled course</strong><small>Explore in 3D, or open shot controls to play here. Phone controls stay connected.</small></span><button id="openLandscapePreview" type="button">Open 3D course</button></div>
   <label class="option-row"><span><strong>Wildlife</strong><small>Occasional birds over the landscape. Hidden when reduced motion is enabled.</small></span><select data-presentation="ambientLife" aria-label="Wildlife"><option value="subtle">Subtle</option><option value="off">Off</option></select></label>
   <label class="option-row"><span><strong>Daylight</strong><small>Change the sun direction and warmth. Your round and wind stay the same.</small></span><select id="daylight" aria-label="Daylight"><option value="morning">Morning</option><option value="day">Daylight</option><option value="evening">Late afternoon</option></select></label>
   <label class="option-row"><span><strong>Environment</strong><small>Choose the living course or compare it with the original image study. Image landmarks may differ from the current course.</small></span><select id="environment" aria-label="Environment"><option value="procedural">Procedural landscape</option><option value="photo">Original image</option><option value="comparison">Both - split comparison</option></select></label>
   </section>
   <section data-option-page="course" hidden><h2>A different challenge.</h2><p>Applying these conditions starts a new practice hole.</p><form id="desktopSetup" class="desktop-setup">
   <label>Tee<select id="optionTee"><option value="red">Red</option><option value="white">White</option><option value="blue">Blue</option></select></label>
   <label>Pin<select id="optionPin"><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="challenging">Challenging</option></select></label>
   <label>Wind<select id="optionWind"><option value="calm">Calm</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="strong">Strong</option></select></label>
   <label>Wind toward (degrees)<input id="optionDirection" type="number" min="0" max="359" required></label>
   <label>Ground<select id="optionMoisture"><option value="dry">Dry</option><option value="moderate">Moderate</option><option value="wet">Wet</option></select></label>
   <button type="submit" class="desktop-play">Start new practice</button><p id="optionsNotice" role="status"></p></form></section>
   </div><footer>Preferences stay on this display. Escape closes options.</footer>`;
   const $ = <T extends HTMLElement>(id: string) => dialog.querySelector('#' + id) as T;
   $('closeGameOptions').onclick = () => dialog.close();
   for (const tab of dialog.querySelectorAll<HTMLButtonElement>('[data-option-tab]'))
      tab.onclick = () => {
         for (const t of dialog.querySelectorAll<HTMLElement>('[data-option-tab]'))
            t.setAttribute('aria-pressed', String(t === tab));
         for (const p of dialog.querySelectorAll<HTMLElement>('[data-option-page]'))
            p.hidden = p.dataset.optionPage !== tab.dataset.optionTab;
      };
   for (const input of dialog.querySelectorAll<HTMLInputElement>('[name=displayMode]'))
      input.onchange = () => changeMode(input.value as DisplayMode);
   for (const input of dialog.querySelectorAll<HTMLSelectElement>('[data-presentation]')) {
      const key = input.dataset.presentation as keyof Presentation;
      let value: unknown = DEFAULT_PRESENTATION[key];
      try {
         value = localStorage.getItem('purity-' + key);
      } catch {}
      input.value = presentationChoice(key, value);
      document.body.dataset[key] = input.value;
      input.onchange = () => {
         const value = presentationChoice(key, input.value);
         document.body.dataset[key] = value;
         try {
            localStorage.setItem('purity-' + key, value);
         } catch {}
      };
   }
   const follow = $<HTMLInputElement>('followBall');
   try {
      follow.checked = localStorage.getItem('purity-follow-ball') !== 'false';
   } catch {}
   document.body.dataset.followBall = String(follow.checked);
   follow.onchange = () => {
      document.body.dataset.followBall = String(follow.checked);
      try {
         localStorage.setItem('purity-follow-ball', String(follow.checked));
      } catch {}
   };
   const light = $<HTMLSelectElement>('daylight');
   try {
      light.value = daylightChoice(localStorage.getItem('purity-daylight'));
   } catch {
      light.value = 'day';
   }
   document.body.dataset.daylight = light.value;
   sunlight(daylightChoice(light.value));
   light.onchange = () => {
      document.body.dataset.daylight = daylightChoice(light.value);
      sunlight(daylightChoice(light.value));
      try {
         localStorage.setItem('purity-daylight', light.value);
      } catch {}
   };
   const environment = $<HTMLSelectElement>('environment');
   try {
      const saved = localStorage.getItem('purity-environment');
      if (saved && ['procedural', 'photo', 'comparison'].includes(saved))
         renderer(saved as Snapshot['renderer']);
   } catch {}
   environment.onchange = () => {
      if (renderer(environment.value as Snapshot['renderer'])) {
         try {
            localStorage.setItem('purity-environment', environment.value);
         } catch {}
      }
   };
   $('openLandscapePreview').onclick = preview;
   $('optionsPair').onclick = () => {
      dialog.close();
      pair();
   };
   $('optionsGuide').onclick = () => dialog.close();
   $('desktopSetup').onsubmit = (event) => {
      event.preventDefault();
      const value = (id: string) => $<HTMLInputElement>(id).value;
      const ok = setup({
         tee: value('optionTee') as Setup['tee'],
         pin: value('optionPin') as Setup['pin'],
         wind: value('optionWind') as Setup['wind'],
         moisture: value('optionMoisture') as Setup['moisture'],
         towardDeg: Number(value('optionDirection')),
      });
      $('optionsNotice').textContent = ok
         ? 'New practice ready.'
         : 'Could not apply conditions. Try again.';
   };
   const syncChoices = Array.from(
      dialog.querySelectorAll<HTMLSelectElement>('[data-presentation], #daylight, #environment'),
   ).map(exposeChoices);
   return {
      open() {
         dialog.querySelector<HTMLButtonElement>('[data-option-tab="experience"]')!.click();
         environment.value = state().renderer;
         syncChoices.forEach((sync) => sync());
         const s = state().setup;
         for (const [id, value] of [
            ['optionTee', s.tee],
            ['optionPin', s.pin],
            ['optionWind', s.wind],
            ['optionMoisture', s.moisture],
            ['optionDirection', s.towardDeg],
         ] as const)
            $<HTMLInputElement>(id).value = String(value);
         for (const input of dialog.querySelectorAll<HTMLInputElement>('[name=displayMode]'))
            input.checked = input.value === mode();
         $('optionsNotice').textContent = '';
         dialog.showModal();
      },
      phone(connected: boolean) {
         $('optionsPhoneStatus').textContent = connected
            ? 'Phone connected. Both inputs stay available.'
            : 'Optional. Same course, touch controls.';
         $('optionsPair').textContent = connected ? 'Pairing details' : 'Connect phone';
      },
   };
}
