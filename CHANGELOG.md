## 2026-10-18: play directly in the angled landscape

- Added an opt-in angled shot panel, illustrated caddy, effort/shaping and synchronized phone controls.
- Added physical-ground aiming, a target ring, optional recorded flight trail and bounded impact particles.
- Shared world-space terrain normals across resolutions and removed duplicate angled texture lighting.
- Applied quality-aware distant textures, ball visibility/colour and effect preferences to the angled view.
- Close stale angled views when practice setup changes the course.

## 2026-10-18: angled view coverage and interface polish

- Hold camera motion at rendered coverage while the requested landscape streams.
- Cover initial preparation and invalidated resize views instead of exposing world edges.
- Unify dark viewpoint controls, compact course heading and expandable navigation help.

# Changelog

## 2026-10-17: optional angled ball following

- Added smooth Follow ball tracking with height-aware framing in landscape exploration.
- Handed camera control back on manual input and disabled automatic following under reduced motion.
- Preserved the authoritative recorded shot and overhead camera.

## 2026-10-17: live ball in angled exploration

- Shared read-only recorded-ball sampling between overhead and angled views.
- Added a depth-tested live ball marker and Current ball camera shortcut to landscape exploration.
- Kept simulation, aiming and shot commands in the existing authoritative session.

## 2026-10-17: session-owned shot progression

- Moved shot completion from course drawing into the session clock.
- Kept phone updates and shot completion running while the landscape preview suspends overhead rendering.
- Added headless timing/replay and paired hidden-renderer regression coverage.

## 2026-10-17: shared ground texture treatment

- Reused the detailed atlas earth-tone field in distant terrain and water.
- Widened the ground-only perimeter blend while retaining the existing object fade.
- Added a browser comparison of Canvas and distant colour compositing.
- Suspended hidden idle overhead redraws during angled exploration, retaining active shot completion and relay updates.

## 2026-10-16: graduated woodland transitions

- Reserved part of the distant tree sampling budget for a tapered band around detailed terrain.
- Kept physical tree identities and the existing candidate/crown limits, with no duplicate distant trees in the detailed interior.
- Regenerated woodland coverage when the streamed detail window moves.

## 2026-10-16: consistent distant daylight

- Applied the detailed atlas daylight wash to distant angled terrain and water.
- Preserved world alignment across rectangular streamed textures, raw texture orientation and existing GPU budgets.
- Added a browser raster check for all three daylight presets.

## 2026-10-16: natural distant water

- Reused the shared shoreline/reflection palette for distant water in angled exploration.
- Passed the selected daylight preset through streamed backdrop builds.
- Kept the existing texture and geometry budgets, physical water geometry and shot state.

## 2026-10-16: smoother tile joins and consistent daylight grading

- Added neighbouring-pixel gutters and expanded lighting samples to cached overhead terrain tiles.
- Unified the atlas/surround daylight grade in world coordinates so it stays fixed during streamed exploration.
- Preserved the default atlas grade and the 64-tile cache limit.
- Four focused tests, three browser checks, typecheck, formatting and build passed.

## 2026-10-16: stable surface details and smoother distant crowns

- Replaced angular distant crowns with rounded, smoothly lit 24-triangle meshes under the existing tree-count cap.
- Anchored meadow patches, turf fibres, water marks, grain and broad texture variation to world coordinates.
- Made shoreline-stone variation independent of texture-window generation order.
- Five focused tests, three browser checks, typecheck, formatting and build passed.

## 2026-10-16: distant woodland continuity

- Added simplified, physically positioned crowns beyond the detailed landscape region.
- Bound sampling to 65,536 real world-tree candidates and 8,192 rendered crowns with deterministic thinning and cancellation.
- Reused the existing background buffer and lighting; no physics or saved-world changes.
- Four focused tests, both preview browser checks, typecheck, formatting and build passed.

## 2026-10-16: camera-aware distant landscape

- Added a bounded distant terrain layer that expands coverage for ultrawide displays, zoom and shallow camera angles.
- Reused physical terrain/water heights and regional ground colours with a fixed 32,768-triangle budget, asynchronous generation and GPU cleanup.
- Detailed terrain continues to own foreground rendering; seamless detail transitions and angled gameplay remain pending.

## 2026-10-16: explorable angled surroundings

- Added Shift-drag/Shift-arrow panning and a touch-friendly pan toggle.
- Added bounded moving terrain windows, shared physical outer-world materials and elevations, periodic cancellation, and replacement of the resident GPU buffer.
- Regenerate the procedural ground texture for each region, preserving detailed outer ground and water colours. Angled gameplay and seamless multiresolution coverage remain unfinished.

- Validation: five focused unit tests and both preview browser tests passed; typecheck, formatting and build passed.

## 2026-10-15: adaptive preview terrain, vegetation and ground picking

- Added stitched terrain refinement around landmarks and elevation changes.
- Added lobed canopy variation and rough-grass tufts near estate places.
- Added shared projection/ray helpers and double-click ground exploration with surface/elevation readouts; shot aim stays unchanged.
- Four focused tests and two browser tests passed, alongside typecheck, formatting and build. Angled gameplay remains a separate unfinished integration.

## 2026-10-15: estate landmarks and optional WebGL landscape preview

- Added connected welcome and pavilion courts plus a small cabin camp, with shared rigid structures and roof support.
- Added Environment / Explore landscape: an isolated angled estate preview with procedural texture, upright trees, orbit/zoom, place shortcuts and keyboard return. Gameplay remains overhead.
- Added bounded GPU resources, draw-on-change behaviour, cleanup and WebGL fallback.
- Added saved-geometry, structural-contact and preview tests. All 74 unit tests passed; focused tests passed after rendering refinements. Final browser checks passed for the angled preview, missing-WebGL recovery, paired gameplay and landscape coverage; typecheck, formatting, build and diff checks passed. See COSMOLOGY for design, validation and remaining angled-gameplay work.

## 2026-10-15: physical uplands and sandy clearings

Woodland 0.8.0 adds two explicitly versioned world layers. `purity-terrain/2` supplies broad winding uplands with smaller folds outside the surveyed DEM. Relief is bounded to 22 additional metres and blends in with zero edge derivative. The existing water-bed solver still owns submerged ground and shoreline transitions. The height field is shared by lighting, inspection, ball support and tree collision elevations; these are not painted mountain silhouettes. Version 1 remains supported without the additional relief, and recorded snapshots retain their version.

`purity-ground/1` turns the driest regional patches into sandy heath clearings, at least 90 metres outside the authored estate and away from water. The same signed field drives both atlas/tile colour, tree exclusion and the sand material returned by course queries. A narrow colour blend softens the boundary; the physical material boundary is at zero, like existing surface boundaries. Saved worlds without this opt-in retain rough. This reuses the existing experimental sand contact coefficients; it is not a calibrated desert-soil or dune simulation.

Why: broad woodland alone still leaves a flat green sheet. Landform and ground response should vary coherently, without changing the original surveyed hole or making reachable visual surfaces physically false. The renderer remains overhead Canvas 2D: hill shading is subtle, with no vertical silhouette or mesh occlusion. No new dependencies or raster assets were introduced.

Validation: all 68 pre-sand unit tests passed; after sand integration 69/70 passed, with the new ground test incorrectly omitting its required day fixture. Correcting the fixture made both new sand tests pass, including a complete dropped-ball settle. Regression coverage includes DEM heights/derivatives, terrain tile seams, fixed legacy heights, bounded relief, saved ground identity, tree exclusions and shoreline contact. Typecheck and production build passed; the wide/portrait rotated-pan browser test passed and the wide capture was visually reviewed. Formatting and diff checks passed. The paired-phone browser test also passed (pairing, live controls, full shot, reconnect and isolation). The existing large legacy-data bundle warning remains.

Still pending: route-connected camps/pavilions/branded places with appropriate collision/support, true mountain silhouettes and upright close-range vegetation via an optional angled renderer, physical-device performance measurement, and measured physics calibration. These are not represented as completed by this terrain pass.


## 2026-10-15: regional woodland and ambient life

- Added `purity-ecology/1` and woodland revision 0.7.0: broad woodland stands, open clearings and warmer dry-grass areas share a continuous distribution/colour field.
- Concentrated course-side groves and overlapped remote crowns more naturally; shared tree queries continue to drive both rendering and collisions. Older snapshots retain their prior generator.
- Built larger connected foliage masses into procedural crowns and retained finer meadow variation across the surround.
- Added sparse decorative birds and Environment / Wildlife controls, respecting reduced motion and image-view isolation.
- Documented the next structural layers: physical ridges, sand/desert regions, route-connected camps/pavilions and branded places. Those landmarks and the optional angled renderer are not implemented in this pass.

Validation: the 65-test suite passed after the distribution change; two additional regional tests and focused collision/presentation reruns passed. Typecheck, formatting, production build and diff checks pass. Browser validation covers desktop controls/Wildlife, paired gameplay and wide/rotated landscape coverage. Meadow texture was refined after capture review. The coverage test now rejects opaque flat fallback patches rather than requiring 13 distinct colours in every corner: quiet meadow/water patches legitimately contained 10-11. Opacity and non-flat coverage remain checked in all corners. Existing legacy-data bundle warning remains.

## 2026-10-15: surface feedback and visual reference study

- Added replay-stable turf/sand impact particles, water droplets and spreading rings, and a restrained cup-capture cue from recorded simulation events.
- Suppressed tiny rebound particles and bounded active effects; preserved effects-off, reduced-motion and Clear course behaviour.
- Documented lessons from the owner's My Little Universe references, a natural colour direction and the requirements for a future optional 2.5D renderer. No renderer migration or global palette change is claimed in this pass; reference images remain ignored.

Validation: two focused effects tests pass, including determinism, preference suppression and event budgets. Paired browser gameplay/reconnection scenario passes. Typecheck, formatting, production build and diff checks pass. Existing legacy-data bundle warning remains.

## 2026-10-15: contact continuation, cup interactions and scenery transitions

- Added the versioned 0.2.0 Purity integrator: fractional collision continuation, bounded repeated impacts, smaller ground steps and rolling-spin consistency.
- Added slope-aware circular-rim contact with falling capture and moving lip exits; trial coefficients remain explicitly uncalibrated.
- Preserved the original UCG solver and the 0.1.0 replay path.
- Replaced rectangular outer-water shoreline cells with interpolated wetness contours.
- Added a 650 ms world-aligned daylight crossfade with reduced-motion support and temporary-cache cleanup; retained camera timings.
- Added analytic collision-remainder, four-material timestep refinement, cup refinement, complete flat/sloped putt, deadline, old-replay and shoreline geometry checks.
- Updated cosmologies and the remaining-work ledger. Empirical aero/turf/cup calibration, optional rainfall and physical-device/performance review remain open.

Validation: 63 unit/simulation tests pass; all 12 browser scenarios passed across the full run and focused reruns. The first browser run hit a five-second readiness timeout on daylight; focused runs also exposed cold-load timing on return from the original experience. Those two readiness assertions now allow up to 30 seconds, with an additional immediate settings-state check. This is not a claim that generation latency is solved. Typecheck, formatting, production build and diff checks pass. Reviewed the late-afternoon capture. The existing legacy-data chunk warning remains; daylight transitions temporarily retain two terrain caches.

## 2026-10-15: water, physics profiles, environment and practice engines

- Unified outer water elevations across lake/drainage intersections and extended bed/bank shaping to remote waterways; woodland revision 0.6.0.
- Extracted consumed ball/aero/contact baseline profiles and captured them in shot records with replay validation.
- Centralized weather time and sunlight state; recorded weather follows the same accelerated timeline as ball playback.
- Added recorded landing angle, post-landing travel and previous-shot comparison to Shot analysis.
- Added a cancellable, exportable 12-shot seeded consistency study under Course & player tools / Research.
- Documented remaining empirical calibration, rim physics, rainfall and broader numerical-validation work.

Validation: all 56 unit/simulation tests pass; the seven engine checks were rerun after the final timing adjustment. All 12 browser scenarios passed across the full existing suite and focused new/changed-feature runs. Build, typecheck, formatting and diff checks pass. Reviewed analysis and study captures. The existing large legacy-data chunk warning remains.

## 2026-10-14: outer terrain slopes and lake banks

- Added opt-in, versioned terrain continuation beyond the source raster, preserving surveyed ground and old saved-course behaviour.
- Continued boundary slopes into bounded procedural relief, shared by collision, inspection and landscape lighting.
- Shaped submerged beds and smooth landward banks for the two outer lakes; retained their level water-contact surfaces.
- Bumped the woodland course to 0.5.0; stored terrain identity in physics evidence.
- Connected drainage elevations and river beds remain unfinished; see COSMOLOGY for the limits of this pass.

Validation: 49 unit/simulation tests and both paired-play and wide/rotated landscape browser scenarios pass. Production build, typecheck, formatting and diff checks pass. Reviewed the wide landscape capture. The existing large legacy-data chunk warning remains.

## 2026-10-14: shared procedural surroundings

- Added versioned, camera-independent drainage and tree queries shared by rendering and physics.
- Promoted atlas-only scenic lakes and creek extensions into physical course surfaces; bumped woodland to 0.4.0.
- Replaced separate scenic tree placement with shared canopy/trunk definitions and nearby swept-collision queries, including neighbouring cells at tile edges.
- Preserved original UCG course behaviour and saved the world version/seed with shot course evidence.
- Outer terrain height continuation remains approximate; remote water follows that terrain until a coherent water/terrain model is developed.

Validation: 40 existing unit/simulation tests and four new shared-world tests pass. Paired-play and wide/rotated landscape browser scenarios pass, along with typecheck, formatting and production build. Remote shoreline geometry remains sampled for rendering; continuous queries govern physical contact.

## 2026-10-14: softer manual camera movement

- Tuned drag easing from 85 to 160 ms and manual zoom easing from 125 to 280 ms, aiming for the requested 2?2.5 feel between the earlier slow camera and the recent snappy version. These are exponential time constants, not fixed animation durations.
- Retained existing camera-response choices, input distances, zoom limits, ball-follow timing and reduced-motion behaviour.
- Validation: existing camera/presentation regression checks, typecheck and production build.

## 2026-10-14: restore UCG tools and clarify control choices

- Compared the original sidebar and research menus against Purity; documented capability destinations in COSMOLOGY.
- Restored pin distance, tee yardages, live wind indicator, zoom buttons and stock-shot reset/reference on desktop.
- Added Course & player tools: terrain contours/slope/mesh, route and boundary layers, shot profile, stock yardages, validated player allocation/import/export/local persistence, practice journal and starting points.
- Added recorded-trajectory replay and original practice-ledger accounting for mulligans and concessions. Physical shot records remain intact.
- Restored source/shaped-ground study, four-way ground-response comparison, course/plate exports and bounded local input diagnostics.
- Consolidated desktop mode under Controls; replaced short presentation dropdowns with visible native radio choices. Wide desktop controls remain distributed.

Validation: 40 unit/simulation tests pass. All 11 browser scenarios were verified across the full run and focused reruns after correcting a broad dialog selector and startup readiness waits. Build, typecheck and formatting pass. Reviewed desktop and shot-profile captures. Physical-device trials remain necessary; the existing large legacy-data chunk warning remains.


## 2026-09-19: distinct desktop HUD and player-controlled interface

- Replaced the embedded phone controller with desktop round information, camera
  toolbar and a horizontal club/effort/shot dock. Added direct course aiming,
  inspection, Alt-arrow fine aim and Space for the current shot action.
- Replaced the control-filled menu with Resume, Game options and game navigation.
  Options owns Desktop controls, Minimal HUD, Clear course, phone pairing, ball
  following and practice conditions. Display preferences persist locally.
- Phone controls retain their mobile layout; both interfaces share authoritative
  commands and snapshots. Pairing no longer overrides the chosen interface mode.
- Clear course hides interface and aim guides; clicking or Escape restores the menu.
  Camera framing reserves room for the desktop dock. Double-click reframe cancels
  delayed single-click targeting; dragging never changes aim.

Validation: production build, TypeScript, formatting, five camera checks and all
five browser flows pass. Browser coverage includes bidirectional desktop/phone
edits, mode persistence/recovery, local play without a relay, original experience
navigation and the original lab. Desktop HUD and Options screenshots were reviewed.
Physical-device input/legibility trials and the existing terrain-rendering roadmap
remain follow-up work; this change does not alter simulation equations.

## 2026-09-19: world-first game entry and menu shell

- Replaced the scrolling clubhouse website with a title screen, game menu and
  bounded course/guide/about panels over the live, full-viewport course.
- Made Purity and UCG-50 Original prominent, equal experience choices immediately
  after the title, with a direct return path from the original and game menu.
- Removed the site header, promotional page structure and decorative course card.
  Scrolling belongs to panel interiors; back/actions stay anchored.
- Added an independent, slowly moving menu camera, reduced-motion support,
  play/resume wording, optional browser full screen and contextual pairing return.
- Retained phone pairing, shared desktop controls, quiet play and original lab.
  The rendering remains the procedural 2D woodland atlas; this is not a 3D engine migration.

Validation: production build, TypeScript, formatting and five browser flows pass
(paired phone, experience selection/original return, desktop round, narrow-screen
local play, original lab). Title, menu, panel and desktop/mobile selection screenshots
were inspected. Shared-runner timeouts required larger overall journey budgets;
individual assertion deadlines remain unchanged. Physical-device full-screen and
frame-time checks, deeper terrain detail and the existing large data chunk remain follow-up work.

## 2026-09-18: compass/menu overlap correction

- Moved the compass beside the menu button and placed its north label inside
  its disc, keeping both clear of the menu panel. Quiet-play behaviour is unchanged.

## 2026-09-18: woodland course, Onest and uninterrupted play

- Added a deterministic Purity woodland layout: connected creek banks, three
  shaped bunkers and tree clusters shared by rendering and physics. Kept the
  original in the lab. This changes hazards, not simulation equations.
- Refined the atlas with warmer mowing bands, water depth colour, shoreline
  highlights, raked sand, varied leaf crowns and softly blended rough transitions.
- Bundled Onest and its OFL license locally. Refined headline weight, navigation
  sizing, numeric typography and small readout labels.
- Made gameplay collapse into one menu button; desktop controls fold away when
  a shot starts. The menu restores controls, pairing, home and view actions.
- Made north-up the default. Added Shift/right-drag rotation, bracket shortcuts,
  N reset and menu rotation/reset controls. Rotation survives viewport resizing.
- Kept photography in the original lab because its imagery no longer matches the
  woodland geometry. Reference inspiration stays ignored.

Validation: production build, TypeScript, formatting, nine targeted course/camera/
session tests and all four browser flows pass. Whole-hole, green and controller
screenshots were inspected. The original HTML and ignored references are unchanged.
Deep-zoom texture resolution and physical-device performance remain limitations;
the baseline large terrain chunk warning remains. See docs/NEXT-SESSION.md.

## 2026-09-18: Purity clubhouse and shared dark controller

- Replaced the default legacy entry with Home, course selection, How to play and
  The story. Native fragment navigation preserves the active round; the original
  lab is explicitly available at `/?mode=lab`. The original HTML stays untouched.
- Mounted the same controller inside a collapsible desktop overlay. Local commands
  use the same authoritative session and validation as phone commands, without an
  iframe, another window or another controller socket. Pairing folds the overlay
  away; it can be reopened at any time. Local controls work without the relay.
- Made dark forest controls the default, with a saved ivory option. Added distinct
  Shot, My bag and Round destinations, back/menu actions, consistent SVG icons,
  a settings sheet and refreshed authoritative conditions when opening settings.
- Reframed wide-screen play diagonally with a north indicator, rotated pointer/aim
  transforms and layout-aware camera offset. Added illustrated tonal ground layers,
  stronger surface separation and a continuous creek shoreline. Physics geometry
  and equations remain unchanged.
- Used the owner's local visual references for direction without importing or
  committing them. Preserved the owner's cosmology wording and ignore rules.
- Documented navigation/session lifetime, shared transport, themes and composition.

Verification: production build, TypeScript, six targeted camera/session checks and
four browser flows (phone pairing, desktop journey, no-relay narrow screen, original
lab) pass. Real iOS/Safari behaviour, visual preference and physical-device frame
times still need a hands-on trial.

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

## 2026-09-19 ? Estate surroundings and Purity identity

- Added physical estate lakes, practice lawns, sand areas and perimeter path; retained the single playable hole and original UCG-50 implementation.
- Refined mowing contrast, tree lighting, turquoise water and warm banks; rounded the new lawn outlines.
- Added a flag-and-ball Purity mark across loading, title, lobby and phone, plus brighter citron actions, mint selections and ivory readouts.
- Kept procedural assets, local Onest, reduced-motion support, desktop/phone controls and player-selected UI modes.
- Validation: TypeScript and production build pass; 26 unit tests pass, followed by all 3 course tests after outline refinement; all 5 browser flows pass. Inspected desktop and phone screenshots. Existing legacy bundle-size warning remains.

## 2026-09-19 ? Elegant controls and illustrated caddy

- Unified dark readouts and controls, muted bright accents and tightened desktop spacing with rounder shapes.
- Replaced visible club dropdowns with illustrated caddy cards on desktop and phone, including the selected club in shot preparation.
- Added purpose labels, selection indicators, keyboard dismissal and phase-aware desktop picker availability.
- Browser coverage now selects through the visible caddy and checks selection, illustration, Escape and focus restoration.
- Validation: TypeScript and production build pass; all five browser flows pass, including visible desktop/phone caddy selection, keyboard focus return, sync and gameplay. Inspected caddy and HUD screenshots.

## 2026-09-19 ? Consistent loading and arrival

- Matched loading/title typography and mark scale, introduced restrained contour artwork and shared sage/forest tokens, and removed remaining bright lime UI accents.
- Kept loading visible through the first rendered course frame; added a short reduced-motion-aware reveal without delaying for phone pairing.
- Added startup import-error retry and browser checks for slow startup, small-screen overflow and recovery.
- Validation: TypeScript and production build pass; all seven browser tests pass. Inspected desktop and phone loading screenshots. Existing legacy bundle-size warning remains.

## 2026-10-12 ? Procedural landscape materials and surroundings

- Added deterministic multiscale terrain variation, fine turf fibres and a close-view vector grass layer; subdued flat colours and mowing contrast.
- Refined tree crowns/shadow silhouettes, broken shore texture and water depth colours, with batched, reduced-motion-aware ripples.
- Extended the scene outside playable bounds with scenic lakes, woodland glades and continued creek. Course geometry and physics remain unchanged.
- Retained the two-pixels/metre cache, bounded surrounding foliage and cached procedural canopy stamps; redraw visible crowns sharply at close zoom.
- Validation: TypeScript and production build pass. Six of seven browser flows passed in the final full run; the remaining short-screen startup check timed out and then passed in isolation (12.5 s test duration). Reviewed whole-course and green close-up screenshots. Target-device frame time remains unmeasured; the legacy bundle-size warning remains.

## 2026-10-12 ? Wind cues and sun direction

- Linked flag flutter, water ripple direction/intensity and near-view grass lean to the current authoritative wind. Calm and reduced-motion settings suppress oscillation.
- Added persistent Morning / Daylight / Late afternoon choices under Game options > Experience.
- Changed tree shadows, canopy highlights, slope lighting and colour warmth together for each sun position, without resetting the round or changing physical conditions.
- Daylight uses art-directed presets, not an automatic geographic day/night simulation.
- Validation: TypeScript and production build pass; the desktop gameplay/options browser flow passes with daylight selection and round-preservation checks. Reviewed the late-afternoon screenshot.

## 2026-10-13 ? Landscape through the full camera range

- Replaced the flat outer fallback with world-anchored procedural grass, water and woodland patches covering the visible viewport.
- Added a bounded background cache, daylight-aware shadows and a distant blend around the detailed course atlas.
- Preserved course geometry, physics, camera limits and existing controls.
- Added camera-coverage unit checks and browser pixel/screenshot checks at rotated pan limits in wide and portrait views.
- Validation: TypeScript, production build and viewport-coverage unit test pass. Desktop gameplay/options and the new wide/portrait landscape browser checks pass; landscape coverage was rerun after creek continuation. Inspected both viewport screenshots. Existing legacy bundle-size warning remains.

## 2026-10-13 - Landscape colour and water refinement

- Brighter natural turf palette shared across the course and surroundings.
- Replaced circular lake shading with procedural sky/cloud colour, bank-following shallows and restrained directional highlights.
- Shared water shading across detailed and distant scenery, including daylight-specific reflection tones.
- TypeScript and production build pass (existing legacy bundle-size warning remains).
- Wide-screen and portrait landscape browser checks pass; both captures visually inspected.

## 2026-10-13 - Smooth estate path closure

- Rounded the bottom-left loop join using cyclic spline interpolation and continuous bank normals.
- Versioned the shared course geometry as woodland 0.2.1.
- TypeScript, production build and all four course regression tests pass.
- Wide-screen/portrait browser coverage passes; rendered loop visually inspected.

## 2026-10-13 - Clearer procedural water

- Retained the improved blue/daylight palette and shoreline shallows while making cloud accents sparse and faint.
- Reduced stretched highlights and fine ripple contrast for a cleaner water surface.
- TypeScript and production build pass; existing legacy bundle warning remains.
- Wide/portrait browser coverage passes; clearer water visually checked in the wide capture.

## 2026-10-13 - Continuous estate shots and calmer presentation

- Muted water to a natural blue-green.
- Fixed Purity shots terminating at the inherited survey edge; flight, landing and roll continue to rest, and controller aim can move beyond the old rectangle. Original course behaviour remains unchanged.
- Versioned Purity geometry/policy as 0.3.0; documented approximate terrain continuation and decorative scenery limits.
- Smoothed camera follow/landing zoom and made HUD framing independent of frame rate.
- TypeScript, production build and 20 course/camera/flight/contact regression tests pass.

- Removed the image-frame pan clamp and terrain-inspection clipping for Purity; preserved original-course rules.
- Restored Environment settings: procedural, original image, or split comparison. Preferences persist without resetting the round.
- Corrected image-camera registration for vertical as well as horizontal HUD offsets.
- Documented remaining physical/scenic mismatch and DEM extension work in COSMOLOGY.
- Final validation: all 32 unit tests pass, including legacy parity; environment switching/reload browser test passes. Prior desktop gameplay and wide/portrait landscape checks pass. Split comparison visually inspected.

## 2026-10-13 - Camera, ball and effects foundation

- Separated ball drawing, recorded-shot effects, viewport allocation and validated presentation preferences from display coordination.
- Added fast manual versus smooth follow camera responses with Balanced, Responsive and Cinematic settings.
- Ball grows with zoom, with daylight shading, close-up dimples, ivory/yellow finish and enhanced visibility. Physics radius and performance unchanged.
- Optional last-shot ground track and landing cue use recorded simulation evidence and respect Clear course/reduced motion.
- Organised options into Experience, Camera & ball, Environment and Practice conditions; added render quality and persistent display preferences.
- Documented the ordered physical-world, ball-profile, weather and practice-analysis roadmap.
- Validation: TypeScript, production build, all 36 unit tests and both targeted gameplay/settings browser tests pass. Settings capture visually inspected. Existing legacy bundle-size warning remains.

## 2026-10-13 - Aiming and desktop feature recovery

- Restored explicit desktop controls from local-play links and a direct in-game menu action.
- Added distributed wide-desktop panels with compact-screen fallback and Single dock preference.
- Added animated target crosshair and nearby yardage label; respects reduced motion and Clear course.
- Added Shot analysis with carry, total, apex, duration, contact evidence and JSON export.
- Audited original UCG features and documented destinations and remaining parity work.
- Validation: TypeScript and production build pass; desktop recovery/layout/export regression and existing desktop gameplay browser checks pass. Distributed layout and target label visually inspected. Existing legacy bundle-size warning remains.
