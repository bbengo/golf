# Verification and its limits

`npm test` uses Node's test runner with `tsx` for gradual TS/JS imports.
`npm run test:e2e` builds the app and starts the actual local relay for Playwright.
Tests run locally; no hosted workflow is required by this proof of concept.

The woodland checks cover deterministic construction, preservation of the original,
finite connected creek banks, bunker lies, tee clearance and replay geometry.
Camera checks include north-up defaults, rotation and resize preservation. Browser
flows exercise menu collapse, reopening after a shot, local Onest loading, view
reset and original-lab isolation. Screenshots include a whole-hole and green view;
they are inspection artifacts, not visual-regression baselines or proof of realism.

## Independent checks

- `reference-parity.test.mjs` executes the first original HTML simulation scripts
  in a separate VM and compares course data and complete seeded driver, iron,
  wedge, chip and putt records against the baseline ES modules. This catches
  extraction regressions; it does not validate realism.
- `fundamentals.test.mjs` checks analytical mechanics: energy in an elastic impact,
  dissipative friction and spin exchange, friction impulse bounds, backspin reversal,
  the 5/7 sliding-to-rolling result, exact vacuum motion, transverse/axial spin,
  timestep convergence, swept trunk collision and free-fall cup clearance.
- `cockpit-session.test.mjs` checks malformed inputs, duplicate/replayed shots,
  phase gating, one-shot mulligan and independent inspection/setup state.
- `camera.test.mjs` checks coordinate round trips, cursor anchoring across wheel
  inputs, time-based easing, zoom limits and reduced-motion snap.
- `browser/lab.spec.ts` exercises the original setup journey, renderer readiness
  and a completed shot, asserting no page errors or external network requests.
- `browser/cockpit.spec.ts` uses separate display and phone contexts. It exercises
  pairing, intent/aim changes, phone reload, shot resolution, renderer availability,
  and phone disconnect. It checks the phone has no course canvas/heavy engine
  request and the procedural display requests no reference images.
  It also checks viewport coverage, phone overflow, mouse pan/zoom without aim
  changes, phone reframing, automatic follow/manual interruption, reduced-motion
  framing, results/mulligan and the settings dialog.
- `browser/experience.spec.ts` covers the new clubhouse and native history,
  single-screen controls, preservation of intent/shot count through navigation and
  collapse, club selection, theme selection, reopening pairing, narrow-screen
  layout and local control when `/api/session` is unavailable.

Camera round-trip and pointer-anchor checks now exercise the landscape rotation.
The browser aim nudge follows the screen's horizontal direction; one perpendicular
metre need not change a rounded yards-to-aim reading.

Screenshots and traces are disposable test evidence under ignored `test-results/`.
The browser check uses a desktop Chromium mobile viewport, not an actual iPhone
or Android device. It does not establish Wi-Fi latency, thermal performance,
background suspension behaviour, or camera QR scanning success on real hardware.

Passing mechanics tests prove stated analytical cases and numerical consistency.
They do not calibrate lift/drag, turf compliance or cup lip interactions. Those need
independent measured datasets and full-shot convergence evidence. Keep that
distinction in changelog entries and user-facing progress reports.
