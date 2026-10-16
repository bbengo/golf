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


## Shared procedural world ? 14 October 2026

The previous landscape had two independent decorative generators: atlas lakes/creek extensions/scenic trees and distant tile drainage/trees. Physics could see rough where the renderer showed water, or pass through visible trees. `course/procedural-world.ts` now owns a versioned drainage field and deterministic 32 m tree cells. Both renderers consume those queries. The former atlas lakes and creek extensions are stored as course polygons, including declared water levels. The course revision is now `purity-woodland/0.4.0`, with `purity-world/1` and seed 839 in its physics snapshot.

Authored surfaces retain priority and the main course retains a clear perimeter before generic drainage starts. Generated trees avoid authored playing surfaces and water. Collision broadphase queries the swept XY bounds plus a 16 m canopy margin, rather than serializing an unbounded forest or making collision depend on visible tiles. Stable cell IDs allow existing impact-ignore handling to work. The original course has no world descriptor, so its surface and object paths retain their original behaviour.

The existing DEM height adapter remains the ground source for collision, tree bases and inspection. Finite authored lakes have declared water elevations; remote drainage currently uses sampled ground height as its water-contact sheet. This is an explicit intermediate approximation, not hydrologically level lakes or excavated beds. Smooth outer height/slope continuation and coherent shoreline elevation remain the next task. Tree collisions remain cylinders/ellipsoids, not individual branches. Raster shorelines have 2?4 m display sampling; physical queries use the continuous field and stored polygons. Normalised water polygon winding prevents overlapping drainage cells and lake polygons cancelling in the atlas mask.

Detailed and distant tree populations now share positions/radii; the atlas no longer makes an unrelated random decorative forest. Tile caches remain bounded to 64 entries and invalidate when the course or daylight changes. Queries do not mutate course evidence, and world versions other than the implemented version are rejected. This supersedes earlier notes describing distant water/trees as decorative; it does not close the terrain or physics-calibration roadmap.


## Outer terrain continuation - 14 October 2026

The source DEM clamps at its rectangular edge. Removing the ball's survey stop alone left a flat extension with a discontinuous normal derivative. Purity now opts into `purity-terrain/1`, recorded in the world contract and shot snapshots; the course revision is `purity-woodland/0.5.0`. Courses without that field retain the previous adapter behaviour, including saved version-1 world evidence.

`terrain-continuation.ts` preserves the surveyed heights and continues one-sided boundary derivatives outside the raster. Extrapolated travel saturates over 80 m rather than carrying an edge grade into an infinite ramp. A mixed derivative term joins corners, and deterministic broad relief fades in over 180 m with zero initial blend derivative. These are synthetic design dimensions, not a surveyed reconstruction. Collision, inspection, tree bases and slope lighting use the same height query. Distant tile lighting samples this field on a 32 m lattice and interpolates the result; it is cached with the tile rather than recalculated every animation frame.

The two `world-lake-*` polygons receive levels sampled from the continued terrain at their centres. Signed distance to each bank shapes a bed tending toward 2 m below the surface and a 30 m landward transition. A 24 m estate clearance fade protects authored ground. Nearby bank selection is deterministic; bounding-box rejection avoids scanning every lake edge for distant samples. Water contact remains at the lake level, above the submerged bed. The displayed shoreline remains the saved polygon.

This is not complete hydrology: remote implicit drainage still uses a terrain-draped contact sheet, and authored creek/river elevations are retained. Connected water bodies can therefore have inconsistent levels where procedural drainage meets a lake. Resolving connected drainage elevations, junctions and river beds is the next water task; this pass does not claim globally level connected water. Polygon-distance banks can also retain small normal changes at polygon corners. The original survey, original UCG simulation and softer camera timing are preserved.

Validation: 49 unit/simulation tests pass, including surveyed-height preservation, four edge derivative joins, bounded distant samples, serialized terrain identity, submerged lake beds, lake-level impact, actual DEM-edge rolling/rest and rejection of unknown terrain versions. Browser and final build results are recorded in CHANGELOG.


## Engine foundations completed - 14 October 2026

This pass addresses all four implementation tracks in the engine roadmap. It does not close the separate empirical physics research track.

**Outer water.** Woodland 0.6.0 saves `purity-water/1`: a designed common outer basin level (189.2 m in this synthetic course datum) with smooth 240 m grades from the two source creek outlet levels. A single elevation function handles overlaps, so crossing a lake polygon into implicit water no longer switches from a fixed lake level to a ground-draped sheet. Both outer lakes use the basin level. Signed polygon/implicit-field union queries shape beds and banks for the whole outer drainage, not just lake centres. Excavation fades over 24 m beyond the DEM to preserve surveyed ground and edge derivatives. Earlier saved worlds without hydrology retain their previous model. This is authored water geometry, not a mass-conserving fluid solver or geographic watershed. The protected survey collar remains a blend rather than a fully excavated channel; shoreline display sampling and polygon corner normals remain approximate.

**Physics profiles.** `physics-profiles.ts` owns immutable, versioned ball dimensions, aerodynamic coefficients and contact-friction values consumed by fundamentals. The coefficients are unchanged. New shot records include copies of these profiles and a launch-rules identity alongside the existing full golfer/club/intent evidence. Numerical replay rejects modified or unsupported profile evidence, while older records without profile fields retain their supported baseline path. There are no invented commercial ball performance variants. Measured aerodynamic tables and turf-response fitting still require source data and independent validation.

**Environment.** `Environment` owns the monotonic weather epoch, seed and chosen sunlight preset. Day snapshots include wind program time, moisture, sunlight identity and model provenance. Atlas lighting, ball lighting and live wind read that state rather than independent DOM lighting values. Animation/replay consumes the recorded day and advances wind on the same 3x timeline as the ball; changing settings later cannot rewrite an earlier shot's conditions. Completing or skipping a shot advances the live clock to at least its recorded end, preventing a gust from jumping back to pre-shot time. Effect ages may continue past the trajectory end so landing rings fade away. Sun positions remain art-directed presets, not astronomical motion. Rain is explicitly absent; no rainfall-to-moisture law is invented.

**Practice evidence.** Shot analysis adds landing angle from recorded incoming velocity, sampled horizontal travel after first landing (including bounces), previous-shot carry difference and profile identity. Missing contacts are reported as unavailable, not zero-angle landings. Previous shots may have different conditions and the UI says so. Research now offers a cancellable 12-shot seeded consistency study: frozen course/player/intent/weather, forced execution variance, no mutation of the round, explicit hazard outcomes and exportable evidence. RMS spread is around mean final position, includes hazard stops and is neither a confidence interval nor a real-player measurement. Rendering an estimated target ellipse remains unnecessary; the study exposes computed outcomes directly.

Validation includes existing reference parity and mechanics checks, outer-water overlap/bed tests, environment snapshot isolation, profile tamper rejection, curved rollout analysis, one complete-shot step-halving check, repeatable seeded studies and cancellation. The single convergence case does not establish global solver convergence across rim or repeated-collision cases. Browser results are recorded in CHANGELOG.


## 15 October 2026 - collision continuation and cup contact

The Purity solver is now `purity-rigid-sphere/0.2.0`, isolated in `integrator.ts`. The previous loop charged a full frame at contact but discarded its remaining motion. The new loop advances to impact, resolves velocity/spin and consumes the remaining time, with a bounded repeated-contact count and explicit unresolved outcomes. Ground substeps are capped at 5 ms and 25 mm travel to resolve trunks, surface changes and cup entry. Rolling spin follows velocity and the support normal; it no longer retains stale launch spin when entering the cup. Old 0.1.0 records explicitly select the retained old solver; UCG baseline/reference parity is preserved.

`cup.ts` adds a finite-radius circular rim, gravity and Coulomb contact. Capture requires the centre to descend below the lip with ball-radius clearance. Exiting balls keep their motion instead of snapping into the cup. The local frame follows green slope and transforms gravity, velocity and spin together. Cup motion has a bounded time budget and records its trace/model identity. The 0.18 rim restitution and 0.22 friction are trial coefficients; this is a rigid circular opening, not measured turf deformation, a detailed cup liner or validated lip-out performance. Flight into the cup is still resolved through the ground/contact path; complex airborne rim approaches need further cases.

Checks cover analytic post-impact remainder, complete repeated-bounce/slide/rest trajectories on four materials at 20/10/5 ms, cup captures and exits at 1/0.5/0.25 ms, a complete holed putt, bounded deadlines and old-version replay. These establish bounded behaviour and agreement for the tested cases, not universal convergence or real-world calibration.

The outer drainage renderer now interpolates the zero contour of the same wetness field used by physics. Shared sample rows and clockwise clipped triangles replace block-shaped wet cells; authored polygons retain their union winding. Four-metre sampling still limits tiny features, but bank intersections no longer snap to four-metre squares. No collision surfaces or camera timing were changed by this visual refinement.

Research follow-up: Biber et al., *Measurements and linearized models for golf ball bounce on a green* (2023), https://doi.org/10.1007/s12283-023-00442-4, is a candidate source for contact fitting. Its compact supplementary archive could not be retrieved in this session; the much larger video dataset was not downloaded. Lyu et al., *Aerodynamics of Golf Balls in Still Air* (2018), https://doi.org/10.3390/proceedings2060238, supplies an aerodynamic measurement reference, but no raw coefficient table or independent hold-out trajectories have been imported. No coefficients were relabelled as calibrated. Usable measurements, their reuse terms and validation cases remain prerequisites for that work.

## 15 October 2026 - My Little Universe reference study

Reviewed the owner's numbered local references 1-7 and IMG_0084, plus SayGames' official game announcement (https://say.games/news/my-little-universe-steam/). The numbered sequence establishes publisher/developer identity, an illustrative splash and play. Frames 3-7 visibly carry advertisement/install overlays; their composition and visible effect shapes are useful references, but are not evidence of exact shipped animation timing. No reference artwork is imported, and the ignored screenshots remain local.

The useful transfer is legibility and responsiveness. Upright tree trunks, visible bank faces, coherent cast shadows and quieter backgrounds separate objects from ground. Bright actions remain readable against those materials. For Purity, favour warm grass highlights, cool woodland shadows, mineral blue-green water, pale sand and occasional warm accents around the ball/flag. Avoid a global saturation boost, neon outlines everywhere, resource counters or collection-style rewards. Larger colour changes need a shared core/surround material pass and review at whole-hole and ball scale, not independent tweaks to each renderer.

The opening should communicate identity, place and readiness in that order: a brief brand presence during actual loading, the live course/title composition, then a clear entry into play. Preserve repeat-visit speed and truthful readiness; do not add forced waits or invented progress percentages. Microinteractions should confirm intent (pressed club, persistent selection, committed shot, settled result) and avoid moving the aiming target or shifting nearby controls. Keep the accepted camera timing. Prefer a gentle completion response to score fireworks.

Implemented first slice: recorded-contact feedback in `impact-particles.ts` and `shot-effects.ts`. Sand, turf and water have separate quiet palettes and bounded particle counts; small rebounds are suppressed. Water gets two widening rings, and a recorded cup capture gets a contracting cue. A deterministic event-derived pattern supports replay without allocating a persistent particle simulation or changing ball physics. Existing effects-off, reduced-motion and Clear course choices remain authoritative. The particles' trajectories and scale are artistic; they are not a material-ejection simulation or a claim of turf deformation. The event renderer keeps at most 12 recent events (up to 120 particles). Pairing/gameplay smoke coverage and focused determinism/preference/budget tests accompany this change.

**Angled-view direction.** HTML is the application shell, not the rendering ceiling. Canvas 2D can support an orthographic 2.5D projection with hand-managed depth ordering. For this growing terrain, an optional WebGL scene is the stronger candidate: terrain mesh from the existing height queries, upright procedural trees, shared water elevation, depth-tested ball/objects and pointer ray-to-terrain aiming. WebGL renders hardware-accelerated graphics in an HTML canvas (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API). Keep the current overhead renderer as a tactical view/fallback and reuse the existing simulation and phone protocol. A CSS tilt of the finished atlas is insufficient: it flattens the trees, cannot reveal bank faces and breaks current screen-to-ground assumptions. A future small angled-view prototype should first prove camera rotation, terrain picking, ball occlusion, boundary continuity and performance before replacing the live renderer. This study does not claim that prototype is already implemented.


## 15 October 2026 - regional landscape structure

Woodland revision 0.7.0 opts into `purity-ecology/1`. `landscape-regions.ts` defines broad, warped woodland patches, smaller clearings and warmer dry-grass areas in world coordinates. The same field supplies outer terrain colour and tree acceptance. This replaces broadly scattered remote trees with concentrated stands and genuine treeless areas. It is an authored regional pattern, not a climate/soil succession simulation; dry grass is not a new sand lie or a desert biome.

New-world trees use 20 m candidate cells with 6-13 m crowns; acceptance follows the regional density and existing water/estate clearance exclusions. Rendering and swept collision still query the same generator. Old snapshots without an ecology identity keep the original 32 m generator and coordinates; unknown identities are rejected. Course-side groves use more candidates concentrated toward each stand centre, with controlled crown overlap and unchanged clearances around tees and green. The revision captures those changed physical tree positions. Existing reference geometry is not rewritten.

The detailed atlas and surrounding tiles read the same regional colour field. Tree stamps now build connected boughs and overlapping lit foliage masses before fine texture, improving crown structure within the current overhead view. This does not create upright 3D trees or change tree collision dimensions. Tiny grass fibres remain a presentation texture; a future close-range renderer needs explicit clumps and level-of-detail budgets.

Sparse bird silhouettes follow world-anchored paths and are limited to three visible groups of three. Environment options owns Wildlife / Subtle or Off; reduced-motion users see no birds. Birds are decorative, with no collision or aerodynamic influence, and are omitted in image/comparison gameplay views. Their paths remain bounded within world cells; this is a modest ambient pass, not flock ecology.

Next structural layers remain: designed ridges/mountain relief using the physical height field, sand/desert regions with correct surface response, route-connected clearings and camps/pavilions, and restrained Purity-branded places. Do not scatter all these as unrelated props. Any reachable solid structure requires shared physical geometry. An optional angled renderer should reveal their height and occlusion using the existing course/simulation contract. Current delivery is regional vegetation, colour structure, crown detail and ambient birds; it does not claim those future landmarks are implemented.


## 2026-10-15: physical uplands and sandy clearings

Woodland 0.8.0 adds two explicitly versioned world layers. `purity-terrain/2` supplies broad winding uplands with smaller folds outside the surveyed DEM. Relief is bounded to 22 additional metres and blends in with zero edge derivative. The existing water-bed solver still owns submerged ground and shoreline transitions. The height field is shared by lighting, inspection, ball support and tree collision elevations; these are not painted mountain silhouettes. Version 1 remains supported without the additional relief, and recorded snapshots retain their version.

`purity-ground/1` turns the driest regional patches into sandy heath clearings, at least 90 metres outside the authored estate and away from water. The same signed field drives both atlas/tile colour, tree exclusion and the sand material returned by course queries. A narrow colour blend softens the boundary; the physical material boundary is at zero, like existing surface boundaries. Saved worlds without this opt-in retain rough. This reuses the existing experimental sand contact coefficients; it is not a calibrated desert-soil or dune simulation.

Why: broad woodland alone still leaves a flat green sheet. Landform and ground response should vary coherently, without changing the original surveyed hole or making reachable visual surfaces physically false. The renderer remains overhead Canvas 2D: hill shading is subtle, with no vertical silhouette or mesh occlusion. No new dependencies or raster assets were introduced.

Validation: all 68 pre-sand unit tests passed; after sand integration 69/70 passed, with the new ground test incorrectly omitting its required day fixture. Correcting the fixture made both new sand tests pass, including a complete dropped-ball settle. Regression coverage includes DEM heights/derivatives, terrain tile seams, fixed legacy heights, bounded relief, saved ground identity, tree exclusions and shoreline contact. Typecheck and production build passed; the wide/portrait rotated-pan browser test passed and the wide capture was visually reviewed. Formatting and diff checks passed. The paired-phone browser test also passed (pairing, live controls, full shot, reconnect and isolation). The existing large legacy-data bundle warning remains.

Still pending: route-connected camps/pavilions/branded places with appropriate collision/support, true mountain silhouettes and upright close-range vegetation via an optional angled renderer, physical-device performance measurement, and measured physics calibration. These are not represented as completed by this terrain pass.


## 2026-10-15: estate places and the first angled landscape study

Woodland 0.9.0 introduces a welcome court, a woodland pavilion and a three-cabin camp. The courts have physical path approaches to the existing estate walk. Placement rejects water crossings and excessive corner elevation spread; explicit geometry and place names travel in the course snapshot. Tree clearances leave room around the sites. Purity lettering is painted into the welcome court rather than added as a persistent gameplay badge.

Structures are deliberately simple and physically explicit: flat pavilion roofs with four separate support posts, and closed rectangular cabins. The shared swept-box solver already expands a box by the ball radius, so structure callers do not expand it a second time. The integrator recognises structure contact during both flight and rolling, and the existing flat-deck support path keeps a settled ball on a roof. Pavilion interiors remain open. Original courses/snapshots have no structure objects and keep their prior contact behaviour. These are rigid boxes with trial restitution, not detailed architecture or calibrated building materials.

Environment options now expose Explore landscape, a separately loaded native WebGL preview. It uses the same terrain heights, physical water levels, explicit structures and tree placement, with the procedural ground atlas uploaded as a texture. Upright canopy meshes use smooth normals and share the overhead shadow treatment. No external 3D library, downloaded artwork or image service was added. Mouse/touch orbit, wheel/keyboard zoom, viewpoint buttons and Escape/Back return are implemented; reduced motion removes easing. The main game stays overhead. This is a bounded estate study, not a replacement for the unlimited overhead world or a playable angled camera.

The preview uses an 8-metre terrain mesh, a bounded texture allocation (up to 2048 px and the device texture limit), and depth testing. Narrow banks and steep slopes are approximated at that mesh resolution; tree geometry remains an early procedural representation. Static views do not submit repeated GPU draws. Closing releases buffers, textures, shaders, program and context, restores focus, and cancels the animation loop. Mesh construction supports cancellation. WebGL-unavailable and context-loss messages retain a route back to options. No physical-device performance certification is implied.

Validation: all 74 unit tests passed; focused geometry/contact tests passed again after preview refinements. Tests cover saved landmarks, dry connected sites, roof landing/rest, passage underneath a pavilion, post/cabin impacts, finite mesh data, budget rejection and cancellation. Typecheck and production build passed. The preview was captured at desktop and phone sizes and visually reviewed: the initial blocky material sampling was replaced by the existing procedural atlas; later refinements added smooth canopy normals and shadows. Browser navigation confirms orbit/zoom, viewpoint selection, Escape, focus restoration and unchanged selected club. Final browser runs also passed paired-phone gameplay/reconnect/isolation, WebGL-unavailable recovery and wide/portrait rotated-pan coverage (four tests). Final formatting and diff checks passed. The existing legacy-data bundle-size warning remains.

Remaining: production angled gameplay (ray-to-terrain picking, accurate ball/target projection, shot-follow and HUD integration), adaptive mesh/shoreline detail, richer close-range foliage/grass geometry, more varied architecture and true mountain silhouettes. The current preview makes the rendering approach reviewable; it does not complete those tasks. Measured physics calibration and real-device trials also remain open.


## 2026-10-15: preview detail and terrain picking

The angled study now refines its 8-metre base mesh to half-cell detail around places and where centre elevation differs from corner interpolation by more than 0.18 m. Refined edges share cached midpoint samples with neighbouring coarse cells. Up to 12,000 cells receive refinement; this remains a bounded preview approximation, not a replacement for the physical height sampler. An edge-incidence regression checks that every non-boundary terrain edge has exactly two incident triangles, including coarse/fine joins.

Procedural crowns now have lobed silhouettes and stable foliage colour variation. Sparse upright grass tufts occupy rough near the estate places, excluding paths, water and mown surfaces. These are cosmetic meshes rooted in the physical terrain, not additional ball colliders. The trees remain an early representation; close-range botanical detail and branch-level physics are not claimed.

A reusable orthographic projection/ray module matches the WebGL view transform. Double-clicking ground in the preview finds the first above-to-below crossing of the shared physical terrain/water height function, then bisects it and recentres the view. Status text reports surface and elevation. This intentionally picks ground beneath trees and structures; it is not an object-selection tool. The 2-metre ray march is approximate and can miss features narrower than the march interval. The shot aim and round are never changed. Tests cover tilted/sloping planes, yaw, portrait and desktop sizes, and the near crossing of a ridge.

Validation: four focused geometry/projection tests and both preview browser tests passed, including ground double-click and the unavailable-WebGL return path. Typecheck, formatting, build and diff checks passed. The refined desktop capture was visually reviewed. The previous milestone's 74-test suite and paired-gameplay coverage remain applicable; this pass changes only the isolated preview and its geometry/projection helpers.

Remaining production work: streamed terrain/vegetation for unrestricted angled exploration, depth-tested ball and effects, gameplay aiming through the new camera, phone/desktop camera coordination, and target-device profiling. Ground picking is now implemented in the study, but angled gameplay is still unfinished. Measured physics calibration remains separate from this visual work.


## 2026-10-16: exploring beyond the angled estate

The landscape study now supports Shift-drag and Shift-arrow panning, plus a Pan landscape toggle for touch users. Moving more than 240 metres from the loaded region triggers a replacement window, centred on a 128-metre grid. Each replacement covers 1,536 metres square with a 16-metre base grid and the existing adaptive half-cell refinement. One GPU buffer is reused, one CPU build runs at a time, and obsolete results are discarded if the target has moved on. Tree generation yields periodically so closing the dialog can cancel work. Failed updates retain the previous region and back off before retrying.

Why: a fixed estate preview recreated the old image boundary. Exploration should query the continuous physical world rather than clamp the camera to that image. Terrain, water elevations, trees and materials come from the existing shared course queries; no physics or saved-world version changes are required. Each replacement also regenerates the procedural ground atlas for that exact region at one pixel per metre, replacing the existing texture. This avoids stretching estate pixels or exposing flat material cells at outer shorelines. The first browser capture revealed those flat cells, so that approach was replaced before delivery. Remote structures are culled from the mesh.

Limits: this is bounded moving-window regeneration, not production multiresolution tile streaming. Very wide views or shallow angles can still reveal the window edge, transitions can change geometric detail, and small decorative texture details can shift between atlas windows because their existing noise is canvas-local. Seamless textured LOD coverage and target-device memory/performance profiling remain open. The preview still does not control shots or render the ball/effects in depth.

Validation: five focused geometry/projection tests passed, alongside typecheck, formatting and production build. Both preview browser tests passed after fixing an asynchronous status overwrite: navigation, remote-region loading, ground inspection, pan-toggle state, portrait resizing, focus restoration, unchanged club and unavailable-WebGL recovery. The outer-region capture was visually reviewed. The existing legacy-data bundle-size warning remains.


## 2026-10-16: camera-aware distant terrain coverage

The angled preview now has a separate low-detail surrounding terrain mesh. Coverage comes from the orthographic camera footprint, including aspect ratio, zoom, pitch and a conservative 512-metre relative-height allowance. A yaw-independent radius encloses the screen corners; snapped 512-metre padding provides room for camera motion before another build. Tests cover portrait, 2560x900 and 5120x1440 displays at shallow and steep angles, across rotations and the full relief allowance.

The background uses a fixed 128x128-cell grid (32,768 triangles; approximately 3.4 MiB of vertex storage), physical heights/water levels, interpolated terrain normals and a separately sampled 256x256 material texture (256 KiB RGBA) using shared regional ground colour. It deliberately omits trees and structures. It adds one reusable GPU buffer/texture pair and one asynchronous CPU build at a time. The detailed moving window remains responsible for nearby vegetation, places and the textured surface. Both geometry/texture pairs are released on exit. Builds yield for cancellation; retries back off on failure. Resize, pitch and zoom changes can request a larger footprint, even when the camera centre does not move.

The distant terrain is drawn first, then depth is cleared before drawing the detailed window so the coarse height approximation cannot protrude through the playable surface. This is a presentation layering choice, not a collision or physics change. The detail perimeter blends over 96 metres to soften its rectangular edge. The depth range expands to accommodate the broader landscape. Large camera jumps can temporarily outrun an asynchronous build. The 512-metre allowance applies to the current supported physical world, not arbitrary imported mountain data.

Remaining: transitions between detailed and distant terrain still differ in texture and vegetation density; this is not seamless stitched multiresolution terrain. Distant shorelines are coarse, atmospheric perspective and distant tree representation need refinement, and world-anchored decorative atlas noise remains unfinished. Angled ball/effects/aim integration, measured physics calibration and physical-device profiling remain separate pending tasks.

Performance correction: the 512x512 material pass caused the wide-angle browser journey to time out while obsolete camera footprints rebuilt. The distant texture now samples 256x256, requests wait for 180 ms of stable target camera state, and builds cancel when a newer footprint no longer fits their region. This reduces physical material queries by four times and avoids finishing obsolete work.

Validation: the seven focused coverage/mesh/projection tests passed; the two coverage tests were rerun successfully after material and cancellation refinements. Typecheck, formatting and production build passed. The final browser journey passed remote-region loading, 2560x900 shallow-angle coverage, fixed geometry budget, portrait resizing and unchanged-shot return navigation. Its wide capture was visually reviewed: the dark exterior is covered and the foreground boundary softened, while the distant layer remains visibly lower detail. The existing legacy bundle-size warning remains.
