import { paintShotProfile } from '../core/rendering/shot-profile';
import { Course } from '../core/course/course.js';
import { PracticeVisual as Practice } from '../core/session/practice.js';
import { Player } from '../core/simulation/player.js';
import { Shot } from '../core/simulation/shot.js';
import { Terrain } from '../core/course/terrain.js';
import type { CockpitSession } from '../core/session/cockpit-session';

export function downloadEvidence(value: unknown, name: string) {
   const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
   );
   const a = document.createElement('a');
   a.href = url;
   a.download = name;
   a.click();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** UI adapter over existing course, player and evidence APIs; no duplicate simulation. */
export function startStudyTools(
   session: CockpitSession,
   changed: () => void,
   diagnostic: () => unknown,
) {
   const dialog = document.createElement('dialog');
   dialog.className = 'game-options study-tools';
   dialog.setAttribute('aria-labelledby', 'studyTitle');
   dialog.innerHTML = `<header><div><p class="hud-eyebrow">PRACTICE WORKSHOP</p><h1 id="studyTitle">Course & player tools</h1></div><button data-close aria-label="Close course tools">&times;</button></header>
   <nav class="options-tabs" aria-label="Study sections"><button data-study="terrain">Read terrain</button><button data-study="profile">Shot profile</button><button data-study="bag">Club yardages</button><button data-study="player">Player</button><button data-study="journal">Journal & studies</button><button data-study="research">Research</button></nav>
   <div class="options-scroll">
   <section data-study-page="terrain"><h2>The shape of the ground</h2><div class="tool-actions"><label><input type="checkbox" data-layer="contours"> Contours on course</label><label><input type="checkbox" data-layer="slopes"> Slope shading</label><label><input type="checkbox" data-layer="route"> Yardage route</label><label><input type="checkbox" data-layer="boundaries"> Physical surface outlines</label><label><input type="checkbox" data-layer="zones"> Study zones</label></div><p>Inspect the same height field used by the ball. Select a location, then compare contours and the terrain mesh.</p><div class="tool-actions"><button data-center="ball">At ball</button><button data-center="aim">At target</button><button data-center="probe">At inspected point</button><button data-center="green">At green</button></div><label>Area radius <input id="studyRadius" type="range" min="14" max="60" value="28"></label><label>Rotate mesh <input id="studyYaw" type="range" min="0" max="359" value="35"></label><label>Height exaggeration <input id="studyHeight" type="range" min="1" max="6" value="3"></label><p id="terrainStudyReadout"></p><canvas id="studyCanvas" width="680" height="430" aria-label="Ground contours and perspective mesh"></canvas><p>Upper: one-foot contours, closer lines mean steeper ground. Lower: terrain mesh; height exaggeration is visual only.</p></section>
   <section data-study-page="profile" hidden><h2>Terrain & shot profile</h2><p id="profileContext"></p><canvas id="studyProfile" width="680" height="310" aria-label="Terrain and shot elevation section"></canvas><p>Green: ground. Gold: recorded ball height. Vertical scale is exaggerated. Horizontal distance follows the shot path.</p></section><section data-study-page="bag" hidden><h2>Know your stock shot</h2><p>Original model reference: flat, calm, full effort, no execution variance. These are not condition-adjusted predictions or real-world measurements.</p><div id="stockTable"></div></section>
   <section data-study-page="player" hidden><h2>Your player profile</h2><p>Allocate exactly 100 points. These are simulation capabilities, not measured golf skills. Changes apply to future shots.</p><div class="tool-actions"><button data-preset="balanced">Balanced</button><button data-preset="longGame">Long game</button><button data-preset="touch">Touch</button></div><p id="playerBudget" role="status"></p><form id="playerForm"><label>Name <input id="playerName" maxlength="40" required></label><div class="player-skills">${Player.skills.map((skill: { id: string; name: string }) => `<label>${skill.name}<input data-skill="${skill.id}" type="number" min="0" max="100" required></label>`).join('')}</div><label>Stock curve (fade - / draw +)<input id="playerCurve" type="range" min="-2" max="2" value="0"></label><label>Stock flight (low / normal / high)<input id="playerFlight" type="range" min="-1" max="1" value="0"></label><label><input id="playerVariance" type="checkbox" checked> Execution variation</label><button type="submit">Apply player</button></form><div class="tool-actions"><button id="exportPlayer">Export player</button><label class="import-player">Import player<input id="importPlayer" type="file" accept="application/json,.json"></label></div><p id="playerNotice" role="status"></p></section>
   <section data-study-page="journal" hidden><h2>Practice journal</h2><p id="practiceAccounting"></p><button id="concedePractice">Gimme: concede one practice stroke</button><p>Available on a resting green lie, with no distance cap. A concession closes practice; it does not count as a physically holed putt.</p><p id="learningSummary"></p><div id="journalTable"></div><button id="exportRound">Export round evidence</button><h2>Study starting points</h2><p>Each starts a new practice and clears the current in-memory journal. Export it first if needed.</p><div class="tool-actions"><button data-start="tee">Tee</button><button data-start="approach">Approach</button><button data-start="frontApproach">Front slope</button><button data-start="putt">Putting</button></div></section>
   <section data-study-page="research" hidden><div class="tool-actions"><button id="exportCourse">Export course data</button><button id="exportPlate">Export plate contract</button></div><h2>Course notes & research</h2><p id="courseResearchNotes"></p><p>Changing ground starts a new practice and clears its journal. Export first if needed.</p><div class="tool-actions"><button data-ground="shaped">Shaped ground</button><button data-ground="source">Source ground</button><button id="compareGround">Compare ground response</button><button id="exportDiagnostic">Export input diagnostic</button></div><pre id="groundComparison" role="status"></pre><p>Procedural woodland shares its playing geometry with simulation. Distant scenery is still decorative; flight and turf coefficients remain experimental.</p></section></div><footer><p id="studyNotice" role="status">Original tools, shared simulation.</p></footer>`;
   document.body.append(dialog);
   const $ = <T extends HTMLElement>(id: string) => dialog.querySelector<T>('#' + id)!;
   const val = (id: string) => Number($<HTMLInputElement>(id).value);
   let actionSequence = 0;
   let center: 'ball' | 'aim' | 'probe' | 'green' = 'aim';
   try {
      const saved = localStorage.getItem('purity-player');
      if (saved)
         session.configurePlayer(
            Player.parse(saved),
            localStorage.getItem('purity-variance') !== 'false',
         );
   } catch {
      /* Invalid or unavailable local storage leaves the baseline intact. */
   }
   const savePlayer = () => {
      try {
         localStorage.setItem('purity-player', JSON.stringify(Player.toJSON(session.golfer)));
         localStorage.setItem('purity-variance', String(session.variance));
      } catch {}
   };
   const budget = () => {
      const total = Array.from(dialog.querySelectorAll<HTMLInputElement>('[data-skill]')).reduce(
         (sum, input) => sum + Number(input.value),
         0,
      );
      $('playerBudget').textContent =
         `${total} / 100 points allocated. ${total === 100 ? 'Ready to apply.' : `${100 - total} remaining.`}`;
   };
   for (const input of dialog.querySelectorAll<HTMLInputElement>('[data-skill]'))
      input.oninput = budget;
   const fillPlayer = (draft: ReturnType<typeof Player.draft>) => {
      $<HTMLInputElement>('playerName').value = draft.name;
      for (const input of dialog.querySelectorAll<HTMLInputElement>('[data-skill]'))
         input.value = draft.points[input.dataset.skill!];
      $<HTMLInputElement>('playerCurve').value = String(draft.style.curve);
      $<HTMLInputElement>('playerFlight').value = String(draft.style.flight);
      $<HTMLInputElement>('playerVariance').checked = session.variance;
      budget();
   };
   function terrain() {
      const point = center === 'green' ? session.course.greenCenter : session[center];
      const radius = val('studyRadius'),
         mesh = Terrain.mesh(session.course, point, radius, 24),
         origin = Terrain.point(session.course, point);
      $('terrainStudyReadout').textContent =
         `${origin.surface} - ${origin.z.toFixed(1)} m elevation - ${origin.gradePercent.toFixed(1)}% slope ${origin.downhillLabel}. Radius ${radius} m; mesh ${val('studyHeight')}x height.`;
      const canvas = $<HTMLCanvasElement>('studyCanvas'),
         ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 680, 430);
      ctx.fillStyle = '#1b3025';
      ctx.fillRect(0, 0, 680, 430);
      const chart = Terrain.contours(session.course, mesh.bounds, radius / 12, 0.3048);
      ctx.strokeStyle = '#ccd9ad';
      ctx.lineWidth = 1;
      // Contour segments use the same sampled ground as inspection and play.
      for (const segment of chart.segments) {
         const a = segment.a,
            b = segment.b;
         ctx.beginPath();
         ctx.moveTo(340 + (a.x - point.x) * 3, 110 - (a.y - point.y) * 3);
         ctx.lineTo(340 + (b.x - point.x) * 3, 110 - (b.y - point.y) * 3);
         ctx.stroke();
      }
      const project = (p: { x: number; y: number; z: number }) =>
         Terrain.project(p, origin, {
            yawDeg: val('studyYaw'),
            exaggeration: val('studyHeight'),
            scale: 3,
            width: 680,
            height: 230,
         });
      ctx.strokeStyle = '#96bda4';
      const draw = (line: { x: number; y: number; z: number }[]) => {
         ctx.beginPath();
         line.forEach((p, i) => {
            const q = project(p);
            if (i) ctx.lineTo(q.x, q.y + 205);
            else ctx.moveTo(q.x, q.y + 205);
         });
         ctx.stroke();
      };
      mesh.rows.forEach(draw);
      for (let i = 0; i < mesh.rows[0].length; i++) draw(mesh.rows.map((row: any[]) => row[i]));
   }
   function table(target: HTMLElement, headings: string[], rows: string[][]) {
      const t = document.createElement('table'),
         head = t.createTHead().insertRow();
      for (const text of headings) {
         const th = document.createElement('th');
         th.textContent = text;
         head.append(th);
      }
      for (const values of rows) {
         const row = t.insertRow();
         for (const text of values) row.insertCell().textContent = text;
      }
      target.replaceChildren(t);
   }
   function select(name: string) {
      for (const page of dialog.querySelectorAll<HTMLElement>('[data-study-page]'))
         page.hidden = page.dataset.studyPage !== name;
      for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-study]'))
         button.setAttribute('aria-pressed', String(button.dataset.study === name));
      if (name === 'terrain') terrain();
      if (name === 'profile') {
         paintShotProfile($<HTMLCanvasElement>('studyProfile'), session);
         $('profileContext').textContent = session.last
            ? 'Last recorded shot, using its saved terrain.'
            : 'Terrain along your aim line. No solved shot preview.';
      }
      if (name === 'player') fillPlayer(session.golfer.configuration);
      if (name === 'bag')
         table(
            $('stockTable'),
            ['Club', 'Carry (yd)', 'Total (yd)'],
            Shot.stockYardages(session.golfer).map((r: any) => [
               r.name,
               r.carryYards.toFixed(0),
               r.totalYards.toFixed(0),
            ]),
         );
      if (name === 'journal') {
         const summary = Practice.summary(session.practice);
         $('practiceAccounting').textContent =
            `${summary.attempts} attempts / ${summary.counted} counted / ${summary.mulligans} mulligans / ${summary.concessions} concessions`;
         $<HTMLButtonElement>('concedePractice').disabled = !session.canConcede();
         $('learningSummary').textContent = Shot.learning(session.records).text;
         table(
            $('journalTable'),
            ['Shot', 'Club', 'Carry (yd)', 'Result'],
            session.records.map((r: any, i: number) => [
               String(i + 1),
               r.intent.club,
               (r.result.carry / 0.9144).toFixed(1),
               r.result.status,
            ]),
         );
      }
   }
   dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick = () => dialog.close();
   for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-study]'))
      button.onclick = () => select(button.dataset.study!);
   for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-center]'))
      button.onclick = () => {
         center = button.dataset.center as typeof center;
         session.probe = { ...(center === 'green' ? session.course.greenCenter : session[center]) };
         session.revision++;
         changed();
         terrain();
      };
   for (const id of ['studyRadius', 'studyYaw', 'studyHeight']) $(id).oninput = terrain;
   for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-preset]'))
      button.onclick = () => fillPlayer(Player.draft(button.dataset.preset));
   $('playerForm').onsubmit = (event) => {
      event.preventDefault();
      try {
         const draft = Player.draft();
         draft.name = $<HTMLInputElement>('playerName').value;
         for (const input of dialog.querySelectorAll<HTMLInputElement>('[data-skill]'))
            draft.points[input.dataset.skill!] = Number(input.value);
         draft.style = { curve: val('playerCurve'), flight: val('playerFlight') };
         session.configurePlayer(
            Player.build(draft),
            $<HTMLInputElement>('playerVariance').checked,
         );
         changed();
         savePlayer();
         $('playerNotice').textContent = 'Player applied to future shots.';
      } catch (error) {
         $('playerNotice').textContent = String(error);
      }
   };
   for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-ground]'))
      button.onclick = () => {
         try {
            session.chooseGround(button.dataset.ground === 'shaped');
            changed();
            terrain();
            $('studyNotice').textContent = `${button.textContent} active. New practice started.`;
         } catch (error) {
            $('studyNotice').textContent = String(error);
         }
      };
   $('exportDiagnostic').onclick = () =>
      downloadEvidence(diagnostic(), 'purity-input-diagnostic.json');
   $('compareGround').onclick = () => {
      const shaped = structuredClone(session.course),
         source = structuredClone(session.course);
      shaped.terrain.authoredLayer.enabled = true;
      source.terrain.authoredLayer.enabled = false;
      const p = shaped.fixtures.laneLanding,
         a = shaped.terrain.authoredLayer.start,
         b = shaped.terrain.authoredLayer.end;
      const length = Math.hypot(b.x - a.x, b.y - a.y),
         ux = (b.x - a.x) / length,
         uy = (b.y - a.y) / length,
         day = session.day();
      const rows = [
         ['Shaped receiving side', shaped, p],
         ['Same entry / source ground', source, p],
         ['Too far left', shaped, { x: p.x - uy * 14, y: p.y + ux * 14 }],
         ['Ordinary fairway', shaped, shaped.fixtures.ordinaryLanding],
      ] as const;
      $('groundComparison').textContent =
         'Experimental ground study: same 8 m/s incoming roll.\n' +
         rows
            .map(([name, course, point]) => {
               const result = Shot.simulate(
                  course,
                  day,
                  {
                     position: { ...point, z: Course.heightAt(course, point) + Shot.R },
                     velocity: { x: ux * 8, y: uy * 8, z: 0 },
                     spin: { x: 0, y: 0, z: 0 },
                     mode: 'roll',
                  },
                  { model: 'fundamentals' },
               );
               return `${name}: ${(result.total / 0.9144).toFixed(1)} yd / ${result.finalSurface} / ${result.status}`;
            })
            .join('\n');
   };
   $('exportCourse').onclick = () => downloadEvidence(session.course, 'purity-course.json');
   $('exportPlate').onclick = () =>
      downloadEvidence(Course.plateContract(session.course), 'purity-plate.json');
   for (const input of dialog.querySelectorAll<HTMLInputElement>('[data-layer]'))
      input.onchange = () => {
         document.body.dataset[input.dataset.layer!] = String(input.checked);
      };
   $('exportPlayer').onclick = () =>
      downloadEvidence(Player.toJSON(session.golfer), 'purity-player.json');
   $('importPlayer').onchange = async () => {
      const file = $<HTMLInputElement>('importPlayer').files?.[0];
      if (!file) return;
      try {
         if (file.size > 50000) throw Error('Player file is too large.');
         const player = Player.parse(await file.text());
         session.configurePlayer(player, session.variance);
         fillPlayer(player.configuration);
         changed();
         savePlayer();
         $('playerNotice').textContent = 'Player imported.';
      } catch (error) {
         $('playerNotice').textContent = String(error);
      }
   };
   $('concedePractice').onclick = () => {
      const ack = session.apply({
         type: 'COMMAND',
         id: `study-${++actionSequence}`,
         action: 'CONCEDE',
      });
      $('studyNotice').textContent = ack.ok
         ? 'Practice conceded. Physical shot evidence is unchanged.'
         : ack.error!;
      changed();
      select('journal');
   };
   $('exportRound').onclick = () =>
      downloadEvidence(
         {
            schema: 'purity-round-evidence/1',
            records: session.records,
            practice: session.practice,
         },
         'purity-round.json',
      );
   for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-start]'))
      button.onclick = () => {
         try {
            session.study(button.dataset.start as any);
            changed();
            dialog.close();
         } catch (error) {
            $('studyNotice').textContent = String(error);
         }
      };
   return {
      open() {
         $('courseResearchNotes').textContent =
            session.course.architecture?.thesis ||
            'Explore landing position, ground response and next-shot angle.';
         select('terrain');
         dialog.showModal();
      },
   };
}
