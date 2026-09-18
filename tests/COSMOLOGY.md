# Verification and its limits

`npm test` uses Node's test runner with `tsx` for gradual TS/JS imports.
`npm run test:e2e` builds the app and starts the actual local relay for Playwright.
Tests run locally; no hosted workflow is required by this proof of concept.

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
- `browser/lab.spec.ts` exercises the original setup journey, renderer readiness
  and a completed shot, asserting no page errors or external network requests.
- `browser/cockpit.spec.ts` uses separate display and phone contexts. It exercises
  pairing, intent/aim changes, phone reload, shot resolution, appearance switching,
  and phone disconnect. It checks the phone has no course canvas/heavy engine
  request and the procedural display requests no reference images.

Screenshots and traces are disposable test evidence under ignored `test-results/`.
The browser check uses a desktop Chromium mobile viewport, not an actual iPhone
or Android device. It does not establish Wi-Fi latency, thermal performance,
background suspension behaviour, or camera QR scanning success on real hardware.

Passing mechanics tests prove stated analytical cases and numerical consistency.
They do not calibrate lift/drag, turf compliance or cup lip interactions. Those need
independent measured datasets and full-shot convergence evidence. Keep that
distinction in changelog entries and user-facing progress reports.
