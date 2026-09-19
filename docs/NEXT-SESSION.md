# Next session: unfinished work

## Game-shell direction

The 19 September direction replaces the website-style clubhouse with a fixed game
viewport: title, prominent Purity/UCG-50 experience selection, in-world menu,
internally scrolling panels and optional browser full
screen. A separate presentation camera uses the live course while preserving the
playing camera. A loading surface prevents the retained lab HTML flashing on entry.
Check title/menu transitions and panel scrolling on physical phones, short windows,
larger text, browser zoom and device safe areas. The attached references establish
world-first composition, not a claim that this Canvas 2D scene matches 3D studio art.
Terrain depth, close-range detail and richer lighting remain subsequent rendering work.

The owner's subsequent golfee reference sharpens that direction: readable elevation,
recessed sand, substantial banks, volumetric trees with directional shadows, water
shallows/depth and mowing that describes terrain. A flat colour atlas cannot achieve
that by palette changes alone. Explore a depth-aware terrain renderer using the
existing physical height field and surface polygons before adding more decorative
detail. The reference image establishes appearance, not evidence of its implementation.
Keep floating panels compact and high-contrast; preserve Purity's single-menu quiet
play and phone controller instead of importing the reference's entire statistics HUD.

## Woodland presentation pass

Purity uses `purity-woodland/0.1.0`, a separate deterministic layout with shared
rendering/collision geometry. The original remains in the lab. Onest loads locally.
The play menu is a single button; controls fold away on launch. Rotate with
Shift-drag/right-drag or brackets, restore north with N, or use the course menu.

Review the full-hole composition and green close-up on the actual display. Browser
screenshots establish what rendered, not whether the art meets the owner's quality
bar. Continue refining creek transitions, vegetation variety and terrain depth.
Profile added tree/water collision cost before expanding the layout further.
The experimental physics calibration roadmap remains essential and unfinished.

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
- Assess north-up composition, free rotation and screen-relative aiming. Check aiming
  during a display resize/orientation change, including the 300 ms snapshot interval.

- Evaluate sunlight readability, colour on the actual display, and phone thumb
  reach. Try landscape, larger text and an iPhone with a home indicator.
- Assess shot-follow speed and manual handover with several clubs.
- Profile atlas memory and frame times during pan/zoom and course setup changes.
  Extreme zoom exposes authored polygon/texture limits;
  do not change playable geometry merely to hide them.
- Physics calibration remains essential. Richer presentation does not close it.
  No cloud hosting is implied by this visual redesign.
