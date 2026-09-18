# Golf / Purity local cockpit

One course, one display, one phone, on the same Wi-Fi. The display owns the
simulation; the phone owns the controls. A local Node server serves the app and
relays WebSocket messages. GitHub is for source-code sync; gameplay needs no
internet service. `UCG50_R06_Play.html` is the unchanged reference.

## Play on two devices

Use Node 22 or later:

```sh
npm ci
npm run local
```

Open `http://localhost:3000/?mode=display` on the big screen. Scan its QR code
with your phone on the same Wi-Fi. The pairing overlay disappears after joining.
If the machine has several network adapters, choose the Wi-Fi address on the
pairing panel. Allow Node on your private network if Windows Firewall prompts.
Guest Wi-Fi with client isolation prevents the devices from connecting.

Use the touchpad or arrow buttons to aim, switch to Inspect for terrain readings,
and adjust club, effort, shape and height. Course setup restarts the practice hole.
The simple course renderer loads no image assets; the photographic reference is
available under Course setup & appearance. Phone reconnection preserves the round.
Reloading the display starts a fresh round. Restarting the server creates a new
pairing token.

Paired play uses experimental physics and a balanced baseline golfer. Custom
player editing remains in the desktop lab at `/`, which uses the original model.
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

`npm run dev` serves the desktop lab with hot reload. `npm run local` builds and
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
Browser tests cover the lab and paired play, including reconnection and appearance
switching. Real phone/Wi-Fi latency remains to be measured; command round trip is
not input-to-visible-response latency.
The baseline build still reports a large JavaScript chunk because sampled terrain
data is embedded in the course module; separating that data is follow-up work.

The one-time `scripts/extract-reference.mjs` records how the baseline was migrated.
It refuses to overwrite the extracted application; do not rerun it as a build step.
