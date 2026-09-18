# Next session: unfinished work

## Physical-device follow-up

The owner confirmed the initial paired concept works. The redesigned phone UI,
procedural palette and camera now need the same physical-device trial; Chromium
checks are not a substitute for iOS/Safari testing.

- Run `npm run local`, scan the QR on a phone on the same Wi-Fi, and verify
  aiming, fine control, inspection and a complete sequence of shots.
- Check the correct adapter is selected when VPNs/virtual adapters exist.
- Measure real input-to-visible-response latency and jitter. The displayed
  acknowledgement round trip is not that metric. Verify phone sleep/wake and
  browser background suspension on iOS/Android.

## Essential physics

- Complete the work in [physics-roadmap.md](physics-roadmap.md): measured lift/drag,
  turf contact calibration/compliance, rim/lip-out dynamics and whole-shot
  convergence. Current mechanical unit tests do not close these items.
- Review contact remainder-time handling and repeated impacts before claiming
  timestep independence for complete shots.

## Interaction and implementation follow-up

- Paired mode currently fixes the balanced golfer; decide which player-builder
  controls belong on the phone after trying the core loop.
- Inspect paired-mode practice accounting and result flows with several consecutive
  shots, mulligans, water and holed outcomes on real devices.
- Profile simulation duration on the display before deciding whether it needs a
  Web Worker. Keep all computation browser-side.
- Sampled terrain still creates a large display chunk. Separate data loading when
  load time becomes a measured obstacle, without sending it to the phone.
- Improve stale-token guidance after a local server restart if the physical trial
  shows the reconnect message is confusing.

## Presentation follow-up

- Try the new Home/course/guide journey and dark controller on a real indoor phone
  and display. Check the Shot/My bag/Round navigation, controller collapse, phone
  handoff and the optional ivory theme. Reloading or leaving for the original lab
  ends the in-memory round; in-app navigation preserves it.
- Assess the diagonal course composition and screen-relative aiming. Check aiming
  during a display resize/orientation change, including the 300 ms snapshot interval.

- Evaluate sunlight readability, colour on the actual display, and phone thumb
  reach. Try landscape, larger text and an iPhone with a home indicator.
- Assess shot-follow speed and manual handover with several clubs.
- Profile atlas memory and frame times, including the optional photographic
  renderer during pan/zoom. Extreme zoom exposes authored polygon/texture limits;
  do not change playable geometry merely to hide them.
- Physics calibration remains essential. Richer presentation does not close it.
  No cloud hosting is implied by this visual redesign.
