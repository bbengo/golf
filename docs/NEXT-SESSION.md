# Next session: unfinished work

## Physical-device trial

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

Visual work should remain limited to readability and course/physics agreement.
No photorealism expansion or cloud hosting is implied by these follow-ups.
