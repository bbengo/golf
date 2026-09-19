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
) {
   dialog.innerHTML = `<header><div><p class="hud-eyebrow">MAKE IT YOURS</p><h1 id="optionsTitle">Game options</h1></div><button id="closeGameOptions" aria-label="Close game options">×</button></header>
   <nav class="options-tabs" aria-label="Options sections"><button data-option-tab="experience" aria-pressed="true">Experience</button><button data-option-tab="course" aria-pressed="false">Practice conditions</button></nav>
   <div class="options-scroll">
   <section data-option-page="experience"><h2>Your screen, your choice.</h2><p>Choose how much interface accompanies your round. Phone controls work with every view.</p><fieldset class="display-choices"><legend>Display interface</legend>
   <label><input type="radio" name="displayMode" value="desktop"><span><strong>Desktop controls</strong><small>Mouse aiming, a shot dock and separate course readouts.</small></span></label>
   <label><input type="radio" name="displayMode" value="minimal"><span><strong>Minimal HUD</strong><small>Distance, lie and wind. Play from your phone.</small></span></label>
   <label><input type="radio" name="displayMode" value="clear"><span><strong>Clear course</strong><small>No interface or aim guides. Click the course or press Escape to open the menu.</small></span></label></fieldset>
   <div class="option-row"><div><h3>Phone controller</h3><p id="optionsPhoneStatus">Optional. Same course, touch controls.</p></div><button id="optionsPair">Connect phone</button></div>
   <label class="option-row"><span><strong>Follow the ball</strong><small>Camera follows shots; dragging takes over. Reduced motion takes priority.</small></span><input id="followBall" type="checkbox" checked></label>
   <a href="#guide" id="optionsGuide">Controls & how to play ↗</a>
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
   return {
      open() {
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
