# Next session: unfinished work

## Current position - 16 October 2026

The four engine implementation tracks now have working foundations: shared procedural world and outer-water elevations/beds; versioned baseline ball/aero/contact profiles; shared weather/sunlight shot snapshots; recorded-shot comparison and a seeded 12-shot consistency study. Older notes below are chronological history, not the current completion checklist.

New implementation: version 0.2.0 preserves contact-time remainders, bounds repeated impacts, adds slope-aware rigid-rim cup contact and retains 0.1.0 replay. Four-material full-shot and cup timestep refinements pass. Outer shorelines now interpolate wetness contours instead of rectangular cells. Daylight presets crossfade with camera alignment and reduced-motion support.

Remaining research: measured drag/lift datasets and independent flight validation; calibrated moisture/turf response and compliance; measurement validation of the implemented rim/lip-out model; more complex object-contact and airborne-cup numerical cases. No commercial ball variants or rainfall physics should be claimed without evidence. Remaining presentation work includes sub-grid shoreline details, optional rainfall presentation and target-device performance review (including transition peak memory). The DEM protection collar remains a blended bed transition. Preserve the accepted softer camera timing.


## Visual direction - My Little Universe references (15 October)

First slice implemented: deterministic surface-specific contact particles, water rings and cup capture feedback, respecting existing visibility/motion preferences. Next visual steps: coordinated natural material contrast across core/surround; deliberate loading-to-play transitions and control confirmation; then a separate angled terrain-renderer prototype using the same physics/world data. Keep top-down available. A separate native WebGL estate preview is now available through Environment / Explore landscape. It is not yet a playable angled camera. See root COSMOLOGY for reference observations, architecture and acceptance criteria.

## Angled exploration follow-up (16 October)

Implemented: panning and bounded 1,536-metre moving mesh windows with one active build and one resident GPU buffer. Shared world heights/materials continue beyond the estate. A camera-aware 128x128-cell distant terrain mesh now covers wider/shallow views after loading, without expanding the detailed vegetation window. Simplified distant crowns now use bounded deterministic sampling of actual world trees; density falls with footprint size. Still pending: seamless textured multiresolution coverage at all aspect ratios/pitches (the detailed/distant transition still differs in texture and tree density), world-anchored decorative texture noise across regenerated windows, device memory/performance profiling, and playable angled ball/effects/aim/camera integration. This is a preview, not completion of the angled gameplay track.

## Regional landscape follow-up

Implemented in woodland 0.7.0: shared woodland/clearing/dry-grass distribution, denser authored groves, structured crown foliage and optional ambient birds. Woodland 0.8.0 now adds physical upland ridges (terrain/2) and sand-heath clearings with sand response (ground/1), retaining legacy snapshot behaviour. Woodland 0.9.0 adds connected pavilion/welcome courts and a cabin camp with physical structures, plus a bounded WebGL preview with upright trees. Remaining structural work: production angled gameplay (including ball/effects depth and streamed world coverage), mountain silhouettes, detailed vegetation, and more varied architectural forms. The preview now has stitched half-cell terrain refinement, rough-grass tufts, lobed crowns and tested terrain picking; these are not yet integrated into gameplay. Keep coherent regional transitions and test reachable landmarks against collision. Dry grass remains rough; only the new signed sand field changes ground material. A desert biome or dune simulation is not implemented.

## Desktop interface and player choice

Desktop now has its own HUD and horizontal shot dock; the phone retains its touch
layout. Game Options owns Desktop/Minimal/Clear modes, pairing, camera following
and practice conditions. Preferences survive reload; phone joining preserves them.
Clear mode has no interface or aim guides and recovers its menu by click or Escape.
Playtest panel spacing, text sizes, direct aiming, short-screen layouts and the
240 ms single-click/double-click distinction on real hardware. Check keyboard-only
use, touch-display recovery, phone sleep/wake and simultaneous input. The renderer
still needs the previously documented terrain-depth and lighting work.

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

- Display-owned player profiles now affect both desktop and paired shots. Decide which profile-editing controls should also be exposed on the phone after physical-device trials.
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

## Estate refinement follow-up

The new surroundings are physical surfaces in woodland revision 0.2.0. Visually inspect the expanded layout on the target display; retain the single-hole framing and assess loading time on older hardware. Lake depth is colour treatment, not excavated terrain. Future terrain/shoreline relief needs shared geometry and collision work, not only visual displacement. The atlas remains at two pixels/metre.

## October landscape pass

Procedural materials and outside-bounds scenery are implemented in course-atlas.ts and terrain-detail.ts. Validate frame time on the intended display hardware, especially close zoom and rotation; browser automation is not a physical-device performance certification. A near-field grass pass improves turf detail, but the base terrain/tree cache remains two pixels/metre and is not a photorealistic 3D replacement. Any future height/displacement or playable landscape expansion must remain aligned with simulation geometry.

## October 13 coverage update

The previously pending outer-environment coverage is implemented with a viewport-driven procedural patch cache behind the detailed course. Review landscape-wide.png and landscape-portrait.png captures from the new browser test. Remaining art direction concerns are close-range terrain detail and the artistic overlap between the detailed estate and distant procedural scenery, not a plain outer fallback. Validate performance on the target physical display and unusually wide aspect ratios.

## 2026-10-13 - Procedural-world audit

Survey-edge flight/roll termination, controller aim/probe clipping, camera pan caps and terrain-inspection clipping have been removed for Purity. Environment selection restored in Game options with image/procedural split comparison. The 14 October world sampler now supplies distant water and tree positions to rendering, collision and saved course evidence. Next priority: smooth height/slope continuation beyond the DEM and consistent water elevations/banks; this first world version does not supply hydrology or excavated lake beds. Preserve local image study as a presentation option without allowing its dimensions to constrain the synthetic world.

## 2026-10-13 - Engine foundation pass

Camera response modes, ball renderer, recorded-shot effects, validated presentation preferences and viewport allocation are implemented. Settings split into four sections. Follow the ordered engine roadmap in COSMOLOGY: shared procedural world physics first, versioned calibrated ball/club profiles second, shared weather/environment state third, evidence-based practice analysis fourth. Distant water/tree queries are implemented in world version 1; terrain continuation and calibrated profiles remain unfinished.

## 2026-10-13 - UCG feature parity

The restored capability destinations are recorded in the root COSMOLOGY parity inventory. Terrain layers/mesh, profile charts, stock yardages, player allocation/files/variance, recorded replay, journal/actions/export, concessions, study starts, ground comparison and research exports are implemented. Review discoverability with the golfing team and exercise these on real paired devices. Continue the shared physical-world and physics-calibration work; exposing tools does not validate the coefficients.

## 2026-10-14 ? Shared outer world, first implementation

The atlas-only lakes/creek extensions are now course surfaces. Remote drainage and tree placement live in `procedural-world.ts`, shared by detailed atlas, distant tiles and physics. Swept tree queries include neighbouring cells and generate only nearby candidates. Physics snapshots save world version/seed and authored water geometry, so camera exploration/cache eviction does not change collisions.

Next: smooth terrain derivatives beyond source coverage, assign physically coherent water elevations/banks rather than terrain-draped remote drainage, and improve shoreline display resolution (currently 2?4 m sampling). Tree trunks/canopies remain simplified cylinder/ellipsoid colliders. Test feel and frame time on the target hardware; renderer noise is no substitute for calibrated terrain or contact physics.


## 2026-10-14 - Terrain continuation implemented

Purity 0.5.0 uses opt-in purity-terrain/1: preserved survey heights, saturated exterior derivative continuation, broad procedural relief and outer lake beds/banks. Rendering slope lighting now samples the same outer ground as physics. Existing saved worlds without terrainVersion retain their prior heights.

Next water priority: coherent connected drainage elevations and river beds. Remote implicit water still follows sampled ground; joining that field to fixed lake elevations is not yet physically coherent. Then continue versioned ball/club calibration, shared weather state and evidence-based practice analysis from the engine roadmap. Keep the accepted softer camera timing.
