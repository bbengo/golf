# Purity golf: why this project exists

UCG-50 is the local test bed for separating a golf experience into a course-only
display and a phone cockpit, before carrying the pattern into Odysseus/Unreal.
The phone carries decisions; the screen carries the place. The original
`UCG50_R06_Play.html` is retained as evidence and an executable baseline.

The next experience is not obliged to inherit the original entry flow. Purity now
opens with a clubhouse, course selection, guidance and a short account of that
transition. A collapsible controller can also live directly over the course. The
owner explicitly requested this desktop alternative; the full-screen course is
still available by collapsing controls and hiding navigation.

## Decisions and their reasons

**Vanilla TypeScript and Vite.** This follows the owner's pattern: explicit application surfaces, shared core, native DOM and CSS. New
code uses strict TypeScript because messages and physics refactors cross module
boundaries. Existing JavaScript remains allowed so extraction does not require a
simultaneous language rewrite. `checkJs` is off; those files are not fully typed.

**One display owns simulation.** The phone sends intent, not authoritative shot
results. A relay delivers messages without calculating physics. This avoids two
independent engines drifting and keeps the complete shot calculation local to the
display browser. The shared engine is reusable without the lab's DOM controls.

**One session, distinct interfaces.** Phone and desktop have their own control layouts.
Desktop commands go directly to the authoritative session; phone commands arrive
through the relay. Both use the same validation, shot gates and snapshots. A second
window, iframe or second simulation is unnecessary. Local controls work even when
the pairing server is unavailable.

**Dark by default.** Indoor play motivated the owner's explicit preference for
dark controls. Forest/charcoal surfaces, warm ivory text and restrained lime actions
replace the washed-out light stack. An ivory option is saved per browser. The
provided sports-interface references informed hierarchy, navigation and distinct
screens; the illustrated landscape informed composition and layered ground colour.
The reference images stay review-only and ignored, never imported by the app.

**Local WebSocket relay.** One Node process serves the built app and joins one
display to one phone. There is no signalling service, cloud session database,
account system, multi-room platform, or server-side physics. GitHub is source
history and synchronisation, not game networking or hosting. Tests also run locally.

**Natural presentation, essential mechanics.** The successful paired trial led
to an expanded presentation brief: rounded phone controls, sans typography,
a full-viewport course and an interactive shot camera. Warm fairways, pale greens,
cooler rough and muted blue-green water establish a readable colour hierarchy.
Procedural detail gives the course character without image downloads or
photorealism. This presentation work does not reduce the
requirements for flight, contact, collision, cup behaviour or reliable controls.
The procedural renderer is a small experiment. Purity has a versioned woodland
course with shared visual and physical hazards. The photographic version remains
in the original lab because it depicts the original layout.

**Quiet, intentional presentation.** Onest is bundled locally with its OFL license,
so typography works without Google Fonts requests. Variable weights distinguish
headlines, actions and supporting information; numeric readouts use tabular figures.
The course starts north-up and supports manual rotation. During uninterrupted play,
the player chooses Desktop controls, Minimal HUD or Clear course in Game Options.
Clear course has no interface or aim guides; clicking or Escape opens the menu.
Desktop controls remain available through shots. Pairing preserves that choice.

**Two physics versions.** The desktop lab preserves the original engine. Paired
play uses the experimental fundamentals model. Versioned shot evidence makes the
distinction explicit. Analytical checks are evidence of mechanical/numerical
consistency; they do not establish agreement with real turf or measured ball flight.

The initial email placed new work after the study gate. The owner subsequently
authorised implementation in this session. No later scope change should silently
turn this proof of concept into a hosted service or treat experimental coefficients
as measured data.

## Documentation ownership

**The world comes first.** The September 19 direction replaces the website-style
clubhouse with a game entry and overlay menus. The viewport never becomes a scrolling
page: long information belongs inside bounded panels. The title and menus share the
live course atlas through an independent presentation camera, preserving gameplay
state and the player's chosen camera. Phone control is an input option within that
game, not the reason to present the experience as a website.


Settled architecture and its reasons belong in the nearest `COSMOLOGY.md`. Keep
code comments for equations, units and non-obvious local behaviour. Update the
cosmology when changing a boundary, dependency, physical assumption or failure
policy. Record shipped changes in the changelog and unfinished work in the handoff.

| Document | Questions it answers |
| --- | --- |
| [src/COSMOLOGY.md](src/COSMOLOGY.md) | Which app runs, what loads, and what owns state? |
| [core/COSMOLOGY.md](src/core/COSMOLOGY.md) | How commands become shots, and where do contracts belong? |
| [simulation/COSMOLOGY.md](src/core/simulation/COSMOLOGY.md) | Which equations, evidence, approximations and missing physics? |
| [rendering/COSMOLOGY.md](src/core/rendering/COSMOLOGY.md) | How is the course drawn without image assets? |
| [server/COSMOLOGY.md](server/COSMOLOGY.md) | How do pairing, relay, duplicate clients and reconnects work? |
| [tests/COSMOLOGY.md](tests/COSMOLOGY.md) | What do passing tests prove, and what remains untested? |
| [docs/physics-roadmap.md](docs/physics-roadmap.md) | What physics work remains essential? |
| [CHANGELOG.md](CHANGELOG.md) | What changed and what was checked? |
| [docs/NEXT-SESSION.md](docs/NEXT-SESSION.md) | What should the next session resolve? |

Documentation stays outside `public/`, so the local static server does not serve
it. The original Markdown spec is historical input; its unchanged-physics rule is
superseded by the owner's instruction and these implementation documents.

## Estate and identity refinement

The landscape references informed a broader golf estate around the single practice hole: lawns, water and a connecting path give the course context. New surfaces participate in physical lie queries rather than existing only as painted scenery. Colour hierarchy now connects the original Purity mark, loading screen and distinct desktop/phone layouts. Inspiration images remain ignored and are not shipped as course artwork. See course, rendering and display cosmologies for geometry and rendering limitations.

## A quieter equipment experience

The HUD now shares dark forest surfaces and restrained sage accents; distance no longer sits on an unrelated light card. Compact spacing and rounder controls support an equipment-focused interaction. Club selection is an illustrated caddy on desktop and phone, with the chosen silhouette visible during shot preparation.

## One arrival sequence

Loading and title now use matching Onest wordmark proportions, mark size, spacing and shared forest/sage colour tokens. The loading layer persists across application mounting until the first course frame has drawn, then fades into the scene without an artificial minimum wait. Subtle procedural contour lines introduce the landscape before the live course appears.

## October 2026: landscape instead of a diagram

The procedural render now layers material variation, turf fibres, softer mowing, irregular tree detail and subdued moving water. The existing scene surround gains woodland, lakes and continued creek so the playable hole has a landscape around it. Gameplay bounds, course revision and physics stay unchanged; the extra scenery is explicitly outside playable space. Rendering cosmology records the caching budget, artistic water depth and remaining 2D/close-zoom limits.

## Living environmental cues

Wind now has visible consequences in flag flutter, water ripple direction and fine grass lean, driven by the actual simulation wind presentation. A separate display preference offers three art-directed sun positions with coherent shadow direction, canopy lighting and warmth. It does not alter physics or force a new practice round.

## October 13: environment coverage follows the camera

The scenery now extends through procedural world patches selected from the visible camera area, including maximum zoom-out and rotation. Grass, water and woodland continue past the detailed course atlas, with a blended distant transition. The original gameplay bounds remain authoritative; background expansion adds no playable holes or invisible physical obstacles.

## 2026-10-13 - Sky-coloured water and livelier terrain

The water's concentric lake gradients made it read as an illustration. Replaced these with a shared, world-anchored water material: blue sky, irregular pale cloud reflections, directional small glints and green bank shallows. The detailed atlas derives a visual shore-distance field from its combined water mask, preserving creek joins and actual bank outlines. Distant tiles use their existing drainage field for approximate depth and the same colour sampler. This is an artistic reflection approximation, not a rendered sky or measured bathymetry.

Raised green-channel separation in rough and maintained brighter fairways/greens against deeper woodland. Reflections respond to the existing daylight presets. Geometry, collision and shot physics are unchanged. Materials remain cached and procedural with no downloaded images. User requested review before pushing; keep this change local.

## 2026-10-13 - Rounded estate-loop closure

The estate walk repeated its first point but used open-ended spline interpolation and end normals. That produced a sharp bottom-left join. Closed ribbons now interpolate cyclic neighbours on both smoothing passes and use wrapped tangent normals, closing each bank before connecting the polygon. Open lawns retain their existing round caps. This changes shared visual/physical path geometry, so the woodland revision advances to 0.2.1. A regression checks both bank closures, tangent continuity and path/interior surface queries.

## 2026-10-13 - Clearer water, quieter reflections

User review clarified that sky reflection should explain the blue palette, not cover lakes in cloud-like bands. Kept the daylight palettes and bank-following shallows; restricted cloud accents to the highest noise values (above 0.76), squared their falloff and reduced maximum colour mixing from 75% to 10%. Reduced elongated glints from 15 to 4 intensity levels with a tighter falloff, and fine ripple contrast from 1.4 to 0.65. Both scenery layers share this change. The existing animated ripples remain; geometry and physics are untouched.

## 2026-10-13 - Natural water, continuous shots and quieter camera

The invisible wall was the inherited `source-coverage-limit-not-OB` rule: simulation stopped as soon as a ball crossed the source rectangle, even in flight. Purity now declares `synthetic-estate-continuation` (woodland 0.3.0). It uses existing ground/contact/rolling integration beyond that rectangle and accepts a naturally settled lie there; phone aim movement also stops clamping to the old rectangle. Original UCG-50 keeps its survey-stop rule. Regression fixtures cross the actual western edge in flight and rolling, then check landing and supported rest; a control fixture retains the legacy stop.

This is not new surveyed ground. The DEM adapter extends its outermost samples outside the grid, and undeclared ground defaults to rough. Authored estate paths/lakes retain physical polygons, but distant scenic water and vegetation remain decorative. Shared physical/procedural surroundings are still future work. No collision, aerodynamics or turf coefficients were tuned to disguise the boundary bug.

Water shifts toward muted blue-green while preserving clear shallows. Camera translation eases over 190 ms and zoom separately over 420 ms; a gentler height-to-zoom curve reduces bounce-driven zoom pulses. HUD framing now uses elapsed time rather than a per-frame factor. Manual interruption and reduced-motion behaviour remain.

## 2026-10-13 - Image-era limits audit and environment selection

Removed three additional restrictions for the synthetic estate: controller MOVE clamp (aim and probe), image-frame camera pan clamp, and clipped terrain-inspection mesh bounds. Keeping the initial whole-hole composition based on the image registration is intentional framing, not a movement or simulation boundary. Zoom remains bounded for performance/readability, and the integration time limit remains an explicit unresolved result rather than fabricated rest.

Game options now offers procedural, original image, and both as a split comparison with one shared camera and simulation. Preference persists locally; the additive renderer enum travels through the existing command/snapshot validation. Restored the existing locally served photo assets, fixed both camera offset axes in their adapter, and kept procedural scenery available while assets load. Image landmarks represent the older study and do not overwrite current physics or reset play. Menu/title remain procedural.

Remaining architectural work: distant procedural water/trees are presentation only; promote them to a deterministic shared world sampler before claiming physical parity. The DEM's clamped extension is continuous in height but not necessarily slope; replace it with a smoothly blended authored terrain extension. Photo-only surroundings still have finite texture detail and a plain renderer background; the image cannot supply new detail. These are explicit remaining tasks, not reasons to reimpose image boundaries on Purity.

## 2026-10-13 - Self-contained presentation systems and engine roadmap

The existing flight/contact solver (`simulation/shot.js` and `fundamentals.ts`), course contract and atlas caches already own distinct responsibilities. Preserve their deterministic evidence and original-course parity rather than renaming every utility an engine. This pass removes ball/effects/allocation responsibilities from the display coordinator:

- `rendering/viewport.ts`: viewport/backing-store allocation, quality caps and a 16-million-pixel ceiling. World coverage remains in CourseAtlas/LandscapeSurround; camera composition keeps the hole visible while wider displays reveal more surroundings. It re-evaluates on resize, not only initial load.
- `rendering/camera.ts`: independent manual and follow response. Balanced uses 85/125 ms position/zoom response for input and 190/420 ms for follow. Responsive and Cinematic scale those times. Reduced motion snaps, manual input interrupts follow, and landing convergence keeps the follow response until settled.
- `rendering/ball-renderer.ts`: daylight-directed shading, close-up dimples, visual finish and bounded zoom-dependent visibility. Screen magnification is deliberate accessibility/readability, not a change to the ball's physical radius or aerodynamic coefficients.
- `rendering/shot-effects.ts`: optional last-shot ground track revealed from recorded trajectory timestamps; first-contact cue from the actual landing event. No predicted carry or dispersion is fabricated. Clear-course hides effects and reduced-motion suppresses the expanding impact cue.
- `rendering/presentation.ts`: validated, defaulted display preferences. Storage/DOM binding belongs to options, not the engine modules. A preference never mutates the authoritative shot.

Settings now separates Experience, Camera & ball, Environment, and Practice conditions. New preferences are display-local and persistent; they do not reset practice or change the phone's shot intent. Render quality controls resolution, not terrain/physics.

### Ordered next work

1. Shared world model: one deterministic coordinate sampler for heights, water, materials and vegetation, consumed by renderers, collision, inspection and serialized replay. Replace decorative distant lakes/trees with real shared features. Blend DEM derivatives into authored outside terrain. Acceptance: the same world point gives the same water/ground/tree result across a tile seam, renderer and replay; shots land on what is drawn.
2. Flight/ball profiles: formalize existing launch, aerodynamic and contact inputs as versioned ball/club/material profiles. Keep a baseline profile and label uncalibrated coefficients. Real ball variants need reference measurements and regression trajectories; visual yellow/ivory must never masquerade as performance types.
3. Environment/weather: one clock and weather state for wind vectors, sunlight and surface moisture. Add rainfall only with clear separation between visual droplets, wind and physically justified wet-ground changes. Preserve deterministic shot snapshots when conditions change between shots.
4. Practice analysis: carry/total/apex, landing angle and rollout overlays from recorded results, shot comparison and replay. Add dispersion only from repeated seeded simulation with stated assumptions, not an ornamental target ellipse.
5. Presentation polish: predictive camera look-ahead using recorded trajectory, terrain-aware landing framing, quiet material-specific impact audio and optional replay controls. Respect manual override, reduced motion and Clear course throughout.

Deferred systems above are not claimed implemented. In particular, distant scenery remains decorative and ground beyond the sampled terrain remains an approximation. This pass builds usable, testable presentation modules while retaining that audit as the next physics priority.

## 2026-10-13 - UCG-50 feature recovery and desktop ownership

The controls were not removed: the lobby's on-screen-controls entry retained a saved Minimal/Clear preference, making them effectively undiscoverable. Explicit local-play links now select desktop mode, and Game menu has a direct Use desktop controls action. The preference still persists for ordinary reload/resume. Phone pairing remains optional.

The default desktop layout distributes the same live DOM controls at 1200px and above: round info left, aim/inspection/shaping right, club/effort/commit below. No duplicate inputs, command routes or mobile cockpit were added. Resizing or selecting Single dock reparents the existing header and tuning controls; focus/state and the authoritative session remain shared. Clear and Minimal suppress the strategy panel. Layout selection lives in Controls settings.

Target reticle is a presentation-only module with a slow rotating four-arm crosshair, restrained radius breathing, and yards from the ball beside the chosen target. Reduced motion removes both animations; Clear course hides the reticle. Distance is intent, not a predicted carry/landing promise, and the camera is never animated by the reticle. Offscreen targets do not acquire misleading edge labels.

Shot analysis is a direct menu destination, with actual recorded carry, start-to-finish distance, apex, simulation duration and ordered contact events. Export downloads the full recorded shot JSON, preserving engine/course/intent/seed evidence. Replay animates this same record; it does not resimulate the shot.

### UCG-50 parity inventory (reviewed 14 October 2026)

Compared the original controls in `index.html` and `src/lab/play.js` against the Purity shell, including tools below the fold in the supplied screenshot.

| Original capability | Purity destination |
| --- | --- |
| Target crosshair, aim and pin distances | Course reticle and left round panel |
| Club, effort, curve, flight and stock reset | Caddy, shot dock, distributed strategy panel |
| Tee yardages and live wind strength/direction | Left round panel; changes in Practice conditions |
| Desktop/phone choice | Game options / Controls; no separate desktop-mode shortcut |
| Framing, zoom, north and follow | Course toolbar and Camera & ball options |
| Image/procedural view and comparison | Environment options |
| Terrain point, contours, slope shading, rotatable exaggerated mesh | Course & player tools / Read terrain; overlays stay visible during aiming |
| Yardage route, surface outlines and study zones | Read terrain layer switches; hidden in Clear course |
| Stock carry/total yardages | Club yardages; explicitly original flat-calm model reference |
| Player presets, 100-point allocation, stock style, variance, files | Player; validated local persistence and import/export |
| Carry/total/apex/contact evidence and recorded replay | Shot analysis; replay animates saved trajectory without another simulated shot |
| Terrain and shot elevation profile | Course & player tools / Shot profile; recorded terrain for recorded flight |
| Mulligan and gimme accounting | Dock and Journal; shared original practice ledger preserves physical records |
| Learning record and full round export | Journal & studies; attempt records plus practice actions |
| Tee/approach/front-slope/putting starts | Journal & studies; explicit new practice |
| Source/shaped ground and ground-response comparison | Research; uses current experimental fundamentals, labels outcomes as model results |
| Course and plate contracts, local input diagnostics | Research exports; bounded 512-event trace, no automatic upload |
| Course design notes and research limits | Research, with original lab retained as a prominent experience |

Functional destinations replace the old sidebar arrangement; this is not a pixel-for-pixel port. The original lab retains its historical presentation and reference equations. Purity's stock-yardage table is deliberately labelled as an original-model reference, while played shots and ground-response comparisons use fundamentals. Current-conditions carry prediction/calibration is not established by exposing that table. Physical phone trials and professional golfer review remain necessary.

### Why this restoration uses existing contracts

The simplified shell had omitted working research and player tools, not merely relocated them. `study-tools.ts` adapts the existing Player, Terrain, Shot and Practice APIs. Native radio groups expose short presentation choices without changing their validated backing values; native selects remain for practice condition forms. Desktop mode belongs under Controls. Wide screens distribute the same live control elements rather than duplicate state or embed the phone.

`course-study-layers.ts` caches sampled contour geometry until the course or inspected point changes. `shot-profile.ts` draws a section from actual records or the unsolved aim line. Neither changes physics. Selecting a study origin synchronises the inspected point. Clear-course mode suppresses diagnostic overlays as well as controls.

The session now owns the selected golfer and variance, and each shot retains that profile. Player changes affect future shots and save locally; they do not rewrite prior evidence. Replay restarts animation of an existing record, with no new seed, attempt or stroke. The original practice ledger separately records mulligans and one-stroke concessions. A gimme leaves the true ball location untouched, closes the practice, and is never presented as physical cup capture. Practice resets intentionally clear the in-memory journal; the interface explains this beside study/ground actions and provides an export.

Input diagnostics contain only recent course input/command events, camera values and current state; the 512-row buffer stays local until explicitly exported. Reference images remain ignored and are not added to Git.

Stock-reference calculation is debounced by 180 ms so slider movement coalesces and initial control construction does not synchronously wait for the original flat-calm solve. The reference is still computed on the display; moving expensive calculations to workers remains a profiling decision.

### Softer manual camera response ? 14 October 2026

The owner preferred a return toward the earlier glide, around 2?2.5 on their slow-to-fast scale rather than the recent 5. Manual pan now uses a 160 ms exponential time constant (previously 85); manual zoom uses 280 ms (previously 125). This softens the approach to the target without reducing gesture travel or adding artificial momentum. Shot follow retains 190/420 ms; response presets still scale these values and reduced motion still snaps. The subjective target needs the owner?s feel check; it is not a calibrated five-point speed scale.
