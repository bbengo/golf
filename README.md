# Golf / Purity local cockpit

One course, with dedicated desktop controls and a separate phone interface. The display
owns the simulation. A local Node server serves the app and
relays WebSocket messages. GitHub is for source-code sync; gameplay needs no
internet service. `UCG50_R06_Play.html` is the unchanged reference.

## Play on two devices

Use Node 22 or later:

```sh
npm ci
npm run local
```

Open `http://localhost:3000/` for the title screen. Choose **Purity** or **UCG-50
Original**. In Purity, choose **Play** for desktop controls or use **Game options**
to connect a phone and choose your interface.
The world fills the viewport throughout; longer menus scroll inside their panels.
The game menu also offers optional browser full screen and resumes your current round.
Scan its QR with your phone on the same Wi-Fi. The pairing dialog closes after joining.
The direct pairing route `/?mode=display` still works.
If the machine has several network adapters, choose the Wi-Fi address on the
pairing panel. Allow Node on your private network if Windows Firewall prompts.
Guest Wi-Fi with client isolation prevents the devices from connecting.

The phone controller opens in dark mode; Settings offers an ivory alternative. Use
**Shot** for aim/effort, **My bag** to choose a club, and **Round** for camera views
and conditions. Read ground shows terrain information. Expand Shape & flight
for curve and height. The bottom play
button stays within reach and changes to the next action after a shot. Settings
holds conditions and theme; applying conditions restarts the practice hole.
Procedural graphics load no image assets.

On the display, drag to pan, scroll to zoom at the pointer, and double-click to
see the whole hole. With the canvas focused, arrows pan, plus/minus zoom, and Home
reframes north-up. Shift-drag or right-drag rotates; N restores north and brackets
rotate with the keyboard. Escape toggles the course menu. Shots follow until you use the mouse
or a phone camera button. Reduced-motion preference disables automatic following.
The course fills the screen. **Game options** offers Desktop controls, Minimal HUD
or Clear course. Desktop uses a bottom shot dock: click the course to aim, Alt-arrow
to fine aim, Space to play. Minimal retains readouts; Clear hides interface and aim
guides. Click the course or press Escape to recover the menu. Phone controls work
with all three modes; pairing does not override the saved display preference.
Home/course/guide navigation preserves the current round without reloading.

Phone reconnection preserves the round.
Reloading the display starts a fresh round. Restarting the server creates a new
pairing token.

Paired play uses experimental physics and a balanced baseline golfer. Custom
player editing remains in the original lab at `/?mode=lab`, which uses the original model.
This is a practice proof of concept, not tournament scoring.

## Development and checks

```sh
npm install
npx playwright install chromium  # once, for browser checks
npm run dev
npm run typecheck
npm run format:check
npm test
npm run test:e2e
npm run build
```

`npm run dev` serves Purity and local desktop controls with hot reload (phone
pairing requires the local server). `npm run local` builds and
serves both devices and the relay from one local origin. New code uses strict
TypeScript; existing JavaScript is migrated gradually.

## Documentation

- [COSMOLOGY.md](COSMOLOGY.md): purpose, boundaries, decisions, and documentation map.
- [Application topology](src/COSMOLOGY.md): surfaces, loading and ownership.
- [Simulation](src/core/simulation/COSMOLOGY.md): equations, assumptions and sources.
- [Relay](server/COSMOLOGY.md): pairing, message flow and reconnect policy.
- [Physics roadmap](docs/physics-roadmap.md): remaining essential research.
- [CHANGELOG.md](CHANGELOG.md): implemented work and verification.
- [Next session](docs/NEXT-SESSION.md): unfinished work only.

The extraction comparison tests execute the original simulation separately and
compare complete seeded shot records. They verify preserved behavior, not
physical accuracy. Mechanics checks cover energy, spin transfer, sliding,
vacuum flight, convergence, swept collision and analytical cup thresholds.
Browser tests cover the lab and paired play, including reconnection, shared controls
and menu navigation. Real phone/Wi-Fi latency remains to be measured; command round trip is
not input-to-visible-response latency.
The baseline build still reports a large JavaScript chunk because sampled terrain
data is embedded in the course module; separating that data is follow-up work.

The one-time `scripts/extract-reference.mjs` records how the baseline was migrated.
It refuses to overwrite the extracted application; do not rerun it as a build step.
