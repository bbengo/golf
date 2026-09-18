# Changelog

## 2026-09-18: modern cockpit, natural colour and interactive display

- Rebuilt the phone layout around aim, club/effort and a persistent play action.
  Added rounded light surfaces, native sans typography, progressive shape/height
  controls, a settings sheet, larger touch targets and focused result/recovery states.
- Made the course canvas fill the display with mouse pan, cursor-anchored zoom,
  keyboard navigation and repeatable phone framing commands. Shots follow the
  recorded ball with smooth zoom; manual input takes over. Reduced-motion
  preference disables automatic following and camera easing.
- Added a cached world-space procedural atlas: natural surface colour hierarchy,
  mowing stripes, meadow variation, fine seeded texture, gentle terrain shading,
  layered tree canopies, water detail and bridge planks. No image downloads are
  required. Physical surfaces, shot equations and original HTML are unchanged.
- Exposed authoritative mulligan availability and clearer restart actions for
  finished/failed holes. Updated cosmologies, usage instructions and handoff.
- Added camera mathematics tests and expanded paired browser coverage for display
  size, camera/aim isolation, manual follow interruption, reduced motion and results.

Validation: 21 reference/mechanics/session/camera checks, both browser flows,
TypeScript, formatting and production build pass. Physical-device colour,
Safari behaviour and display frame-time measurements remain follow-up work.

## 2026-09-18: local paired-play proof of concept

- Added display and cockpit entry routes with separate module loading. The phone
  receives controls/readouts and does not load the course engine or mount a canvas.
- Added local HTTP/WebSocket hosting, QR pairing, a random session token, one
  display/phone per session, heartbeat, reconnect snapshots and command validation.
- Added authoritative browser session state, input acknowledgements, duplicate-shot
  protection, touchpad/keyboard aiming and inspection, fine movement, camera views,
  course conditions, shot/next/mulligan/restart actions and appearance switching.
- Added simple image-free terrain presentation using existing physical geometry,
  smoothed slope shading, mowing bands, basic canopies and a cached background.
  The photographic reference is loaded only when selected.
- Added experimental versioned mechanics: coupled flight/spin integration,
  airspeed-dependent spin-down, Coulomb contact impulses, sliding-to-rolling
  transition, swept cylindrical trunks and conservative free-fall cup entry.
  Preserved original desktop physics and its exact reference comparisons.
- Added analytical mechanics and session tests plus a two-context browser test for
  pairing, controls, a shot, reconnect, renderer choice and display/phone isolation.
- Initialised local Git on `main`, linked the private `bbengo/golf` repository,
  and established cosmology documentation, this changelog and a session handoff.
- Added consistent formatting for new TypeScript, paired-mode CSS and tests;
  retained the original JavaScript formatting to keep physics changes reviewable.

Verification: TypeScript/build/format checks, 18 passing reference/mechanics/session
tests, and two passing browser lab/paired-play checks. Real phone/Wi-Fi
latency and empirical ball/turf/cup calibration remain unverified. See the
[test cosmology](tests/COSMOLOGY.md) for exactly what each check establishes.

## 2026-09-17: reference extraction

- Replaced the Vite starter with the UCG-50 lab; preserved the original HTML.
- Extracted 19 JavaScript ES modules, styles and local image files.
- Introduced strict TypeScript for new code with gradual JavaScript migration.
- Added seeded original-versus-extracted comparisons and a browser setup/shot check.
