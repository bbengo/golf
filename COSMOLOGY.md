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


## 2026-10-16: bounded distant woodland

The angled landscape background now carries simplified crowns sampled from the same worldTree contract as the physical world. Each crown keeps its actual world position, canopy radius, canopy base and top height. Twelve triangles approximate the crown; distant trunks and fine foliage are intentionally omitted. The geometry is appended to the existing background buffer and uses the existing lighting shader, so no additional draw call or retained GPU resource is introduced.

Selection visits at most 65,536 world cells and retains at most 8,192 crowns. Stable world-hash priorities resolve the crown cap independently of traversal order. When the footprint grows, it increases a power-of-two stride on the globally anchored tree grid. This keeps selected identities stable between overlapping regions at the same detail level, without enumerating the entire forest first. Sampling yields and observes the background build's existing close/supersession cancellation. Legacy worlds retain their 32-metre cell spacing; current ecology uses 20 metres. No trees are invented, relocated, enlarged or added to physics snapshots.

Why: the previous distant terrain filled the viewport but the woodland visibly ended at the detailed region. Sparse low-detail crowns preserve some of the regional forest silhouette beyond that boundary without carrying the detailed tree mesh everywhere. Density intentionally falls with larger footprints; this is not a complete forest representation or seamless tree LOD. Changing stride can change which trees are visible. Ground-height interpolation in the distant mesh can also differ from the exact ground under each crown; shared-edge terrain LOD and distant contact shadows remain open work.

Validation: four focused tests passed for bounded sampling, deterministic overlap, physical rough placement, unchanged snapshots, crown height/radius, cancellation, footprint coverage and combined geometry budgeting. Typecheck and build passed. The initial 8,192-candidate capture was too sparse; candidate and render limits were separated to retain fuller regional stands while preserving the original maximum geometry budget. Final browser verification passed both tests, including remote travel, 2560x900 shallow-angle coverage with distant crowns, portrait resizing, unchanged-shot return and unavailable-WebGL recovery. The final wide capture was visually reviewed: regional woodland continues outside the detailed patch, but the distant crowns remain visibly faceted and thinner than the nearby canopy. Formatting and diff checks passed; the existing legacy bundle-size warning remains.


## 2026-10-16: smoother distant crowns and stable world decoration

Distant crowns now use two latitude rings and smooth ellipsoid normals instead of a flat-shaded double cone. Each crown has 24 triangles, with the existing 8,192-crown limit and deterministic tree selection unchanged. The maximum crown vertex payload rises from roughly 10.1 to 20.3 MiB; this is a deliberate geometry tradeoff for smoother silhouettes/lighting, not a free visual improvement. Crown tips remain at physical canopy-base/top heights; the low-detail mesh remains inside the real canopy-radius envelope. Tests check unit normals and geometry bounds.

Meadow gradients, turf fibres, water-highlight marks and fine grain now come from a reusable world-cell decoration iterator. Each cell has stable coordinates and variations independent of atlas origin, canvas size or iteration order. Broad material noise samples physical coordinates; authored shoreline stones seed each segment sample independently and use a physical sampling distance. Animated ripple candidates also have stable world positions/phases, though the existing 160-ripple display cap remains. This fixes broad decoration moving when the streamed texture window is rebuilt. Pixel sampling, lighting raster resolution and different detail levels can still vary; this is not a promise of pixel-identical output at different scales.

Why: procedural geometry alone is not enough if its surface pattern shifts as the camera travels. Anchoring decoration to the same world coordinate system makes regenerated windows describe the same place. These are cosmetic changes; surface classification, ball physics and saved-world contracts remain unchanged. The legacy image renderer is untouched.

Validation: five focused tests passed covering overlapping decoration identity, world-tree selection, crown dimensions/normals and distant coverage/geometry budgets. Typecheck and production build passed. All three final browser checks passed: angled exploration/return, unavailable-WebGL recovery and overhead wide/portrait rotated-pan coverage. The wide angled and overhead captures were visually reviewed. Formatting and diff checks passed. The existing large legacy-data bundle warning remains. Remaining: seamless multi-level terrain joins and vegetation-density transitions, distant contact shadows, angled ball/effects/aim integration, device performance profiling and measured physics calibration.


## 2026-10-16: filtered tile borders and shared daylight grading

Overhead surround tiles now store a one-pixel gutter around their 256x256 visible interior. Every gutter texel samples the neighbouring world location rather than repeating the tile edge. Drawing crops to the interior while retaining those neighbouring samples for filtering. The slope-light grid expands from 17x17 to 19x19, covering the gutter with actual adjacent height samples. Tree/shadow painting receives the same pixel offset. The existing 64-tile cache limit is unchanged; each tile grows from 256x256 to 258x258 (about 1.6 percent more pixel storage).

A shared daylight-grade helper now supplies fixed estate-relative world endpoints to the main atlas and surrounding tiles. This preserves the original grade on the default atlas but prevents the gradient moving with streamed texture windows. It also replaces the surround's separate five-channel-value warmth adjustment. The colour wash is artistic presentation, not a geographic sun or a change to weather/ball physics. Actual terrain illumination still has different raster resolutions between renderers, so this does not eliminate every material/detail transition.

Validation: four focused checks passed for viewport coverage, matching neighbouring physical/wetness/material border coordinates, matching world-space gradient endpoints across atlas origins/scales for all daylight presets, and stable decoration. Typecheck and build passed. All three final browser checks passed: angled exploration/return, unavailable-WebGL fallback and wide/portrait rotated overhead coverage. The final overhead capture was visually reviewed. Formatting and diff checks passed; the existing legacy-data bundle warning remains. Remaining: unified slope-light/material sampling across detail levels, stitched angled terrain LOD, vegetation-density transitions, angled gameplay integration and device profiling. Physics calibration remains a separate research task.


## 2026-10-16: shared distant-water material

The angled preview's distant texture now uses the same waterColour function as the overhead and detailed landscape, including restrained sky tint, bank absorption and sparse glints. Its existing physical water classification determines where the material appears; signed world wetness supplies the same approximate shore distance used by surrounding tiles. The chosen daylight preset now reaches each asynchronous backdrop build instead of distant water always using a fixed RGB colour.

Why: water was losing its natural variation and changing palette when the detailed patch gave way to distant terrain. Sharing the material removes this avoidable mismatch without increasing the 256x256 texture or geometry budgets. Coarse shoreline sampling, different lighting and tree-density transitions remain visible; this does not claim seamless LOD. Shore distance is a visual approximation, not a change to water depth, collision or saved shots.

Validation: typecheck, production build and two focused coverage/material tests passed. The material regression samples real remote water texels in evening light, checks shared colour values and opacity, and retains physical-height, geometry-budget and cancellation checks. Both browser checks passed: angled remote exploration, wide/shallow and portrait views, unchanged-shot return, and unavailable-WebGL recovery. The wide-angle capture was visually reviewed; coarse shoreline and forest-density transitions remain apparent. Formatting and diff checks passed. The existing legacy-data bundle warning remains.


## 2026-10-16: daylight continuity in angled distant terrain

The distant WebGL terrain texture now receives the same estate-relative daylight colour wash as the detailed atlas. A small Canvas 2D adapter applies the existing gradient to the generated 256x256 RGBA texture before its normal raw-byte upload. Scaling each axis independently keeps world alignment for rectangular streaming regions. The raw upload orientation and existing GPU texture allocation remain unchanged; the temporary canvas and pixel copies are bounded to this small texture and are not retained between builds.

Why: the detailed patch already carried a warm/cool wash, while distant ground and water used ungraded materials. Sharing the existing Canvas gradient avoids introducing a second approximation of colour-stop interpolation. This is artistic grading, not a physical sunlight simulation. Mesh-normal lighting, shoreline sampling and vegetation density still differ between detail levels; no seamless-transition claim is made.

Validation: typecheck and production build passed. A browser raster test passed all three daylight presets, comparing the same world point across square and rectangular regions, preserving opacity and leaving the source pixels unchanged. All three browser tests passed, including remote exploration, wide/shallow and portrait resizing, unchanged-shot return and unavailable-WebGL recovery. The final wide capture was visually reviewed. Formatting and diff checks passed; the existing legacy bundle warning remains.


## 2026-10-16: graduated woodland coverage around detailed terrain

Angled exploration now reserves up to 16,384 of the existing 65,536 candidate visits for trees around the detailed mesh. The remaining 49,152 visits cover the wider footprint. Additional real world trees are sampled in a 256-metre band, with a smoothstep probability taper and world-stable hash decisions. Overlapping passes deduplicate by physical tree ID. The detailed interior is excluded from distant crowns. If the render cap is reached, bounded distance-weighted hash priorities favour nearby trees without cutting off the remote forest. The 8,192-crown and 24-triangle-per-crown limits remain unchanged.

Why: uniform sampling across a wide footprint gave nearby peripheral woodland the same sparse density as the horizon, making the detailed patch conspicuous. This reallocates bounded work toward the join without enlarging crowns or adding fake collision objects. Streamed detail-window changes now invalidate the woodland backdrop; superseded builds cancel and coverage readiness includes the matching detail window. This can require an additional asynchronous rebuild after a detailed patch moves. Density and mesh differences remain visible, and tree selection can change when the detail window moves. This is not seamless terrain LOD or a physical-device performance certification.

Validation: physical-tree identity, unchanged snapshots, deterministic selection, deduplication, candidate/render caps, increased nearby coverage and retained remote trees pass. Crown geometry and terrain-coverage checks pass. Typecheck and build pass. Both final browser tests passed: remote travel and detail-window refresh, wide/shallow and portrait views, unchanged-shot return and unavailable-WebGL recovery. The wide capture was visually reviewed: groves now continue more fully into the nearby surround, while the ground-texture boundary remains apparent. Formatting and diff checks passed; the existing legacy bundle warning remains.


## 2026-10-17: shared terrain tone and wider ground blend

Extracted the atlas's existing seeded three-scale tone field (128, 35 and 9 metres) into terrain-material.ts. The detailed Canvas atlas keeps the same colour/alpha formula. Distant texture generation now composites that shared world-space tone over its ground/water palette before daylight grading, rather than using unvaried regional colours. The source-over helper uses the same byte alpha as the Canvas overlay; pixel rounding differences are covered by a browser raster comparison.

The angled shader now blends terrain across a 256-metre perimeter instead of 96 metres. Trees and structures retain the 96-metre fade, avoiding an enlarged translucent-object band. Texture resolution, geometry budgets, physical heights and collision data remain unchanged. This reduces one material mismatch and spreads the resolution transition; the coarse distant mesh/texture is still visible. It does not replace properly stitched terrain LOD or complete playable angled integration.

Validation: typecheck, build and both coverage/material tests passed. All five browser checks passed: world-aligned grading, Canvas/material compositing across grass/sand/water, angled exploration and return, unavailable-WebGL fallback, and wide/portrait rotated overhead coverage. The existing legacy data bundle warning remains.


## 2026-10-17: suspend hidden idle course drawing

The display loop now skips SimpleCourse.draw while the full-screen landscape dialog is open and the session is idle. The first frame always draws. Active shot animation still draws because the current renderer owns session.finish() when the recorded trajectory ends; blindly suspending it would leave phone-triggered shots unfinished. Relay publication remains outside this condition and continues normally. Closing the dialog naturally resumes the next frame, including after preview failure.

Why: two complete landscape renderers were running while only the preview was visible. This removes the hidden idle work without changing session timing or pairing. It is not a full renderer/simulation-loop separation; extracting animation completion from drawing is still a worthwhile engine follow-up. Validation checks the actual underlying canvas redraw count while the preview is open and after return. Both final preview browser tests passed, including the idle redraw-count assertion, resumed drawing, remote travel, resize/return and WebGL fallback. Typecheck, build, formatting and diff checks passed. The final landscape capture was visually reviewed; material detail is more consistent but coarse terrain/shoreline transitions remain visible.


## 2026-10-17: renderer-independent shot completion

CockpitSession.tick(now) now owns recorded-shot completion. It validates the clock input, observes the existing accelerated playback time, and resolves an elapsed shot exactly once through finish(). The display calls it before rendering and publication. SimpleCourse no longer resolves session state while drawing; if queried at the end of a trace it presents the recorded finish. The landscape preview can therefore suppress overhead rendering throughout a shot, while session progression and relay updates continue.

Why: finish() lived inside draw(), so suspending or replacing a renderer could strand a shot in its animating state. Moving that lifecycle step into the session makes another renderer possible without giving it authority over round progression. This does not change trajectory integration, shot evidence, playback speed, replay stroke accounting or simulation coefficients. The display still uses requestAnimationFrame to drive the session clock: a fully backgrounded browser may defer publication until its next frame. This is not a background-worker scheduling guarantee.

Validation: all 15 focused session/study/engine checks passed, including headless completion, invalid/before-end clocks, exactly-once revision, replay without new records/strokes and unchanged evidence. Typecheck and build passed. Both paired-browser tests passed: the normal pairing/reconnect/shot/camera flow and a phone-triggered shot completing with zero underlying course redraws while the actual preview fallback dialog is open. Closing it resumes rendering. The focused hidden-shot test disables WebGL to isolate session progression from expensive preview geometry. Final typecheck, formatting and diff checks passed.


## 2026-10-17: shared ball playback in the angled landscape

Both SimpleCourse and the optional WebGL preview now sample one read-only recordedBallPosition helper. It interpolates irregular trajectory timestamps, clamps to the recorded finish and returns copies without advancing session state or changing evidence. The session clock remains responsible for completion. The preview receives the live session and renders a small depth-tested point marker from that position; a Current ball shortcut frames it without changing aim or the round.

The marker uses one reusable nine-float GPU buffer, released with preview resources. It redraws when the sampled position changes, even if the camera is stationary. A seven-CSS-pixel circular marker and small depth offset keep it readable; this is a visual locator, not a physically scaled golf-ball mesh. Current ball reframes once, rather than enabling automatic follow. If the session changes to a different course while exploration is open, its ball is no longer drawn into the old course.

Why: live angled playback should observe the same authoritative shot as overhead/phone play, not run a second simulation. This is the first gameplay presentation integration, not full angled gameplay: direct aiming, shot controls, camera following, trajectory/effect depth and refined occlusion across terrain LOD remain pending. Existing near/far depth compromises also apply to this marker.

Validation: pure sampling tests pass for irregular-time interpolation, finish clamping, copy isolation, resolved-state sampling and unchanged records. Typecheck and build passed. All three browser tests passed: normal paired gameplay extended with live angled marker movement during a phone-triggered shot, exploration/current-ball framing and unchanged-shot return, and unavailable-WebGL recovery. The estate capture was visually reviewed with the marker visible at the tee. Formatting and diff checks passed; the existing legacy bundle warning remains.


## 2026-10-17: optional angled ball following

The angled landscape now offers an explicit Follow ball toggle alongside Current ball. It follows the shared recorded ball position without changing the simulation or overhead camera. A 320 ms exponential response eases camera position and framing, compared with the existing 200 ms manual response. Framing starts at an 85-metre half-span and widens by up to 75 metres with height above local ground. Orientation remains the player's choice.

Pointer interaction, keyboard navigation, zoom, pan-mode selection, ground inspection and viewpoint buttons turn following off immediately. It remains off after the shot until explicitly enabled again. Enabling reduced motion disables following, including when that preference changes while the dialog is open; Current ball remains available for explicit reframing. The preference listener is removed on close. Following also stops if the live session moves to another course.

Why: an angled live marker is difficult to watch if the camera stays behind. Optional tracking adds useful shot observation while preserving deliberate manual exploration and the accepted gentle camera response. This remains partial angled gameplay: direct aim/shot controls, effects, robust terrain-LOD occlusion and device profiling are still open. No launch, contact or trajectory coefficients change.

Validation: typecheck, production build and the paired-phone browser test passed, including live follow movement, manual handover and live reduced-motion suppression.


## 2026-10-18: covered angled camera and quieter controls

The displayed angled camera advances only when its conservative ground footprint fits the resident distant terrain. Requested navigation still drives streaming beyond the original course image. While terrain catches up, the camera holds its last covered view. Startup and viewport changes that invalidate that view receive an opaque preparation surface; once a distant requested view is resident it can be reframed safely. This prevents exposed rectangular world edges without reintroducing old image-boundary physics restrictions. Coverage includes a 512-metre relief allowance and is independent of woodland detail refresh.

The overlay now uses compact dark surfaces, restrained typography, a unified viewpoint dock and an expandable camera-help panel. Back to options remains visible during preparation and graphics failure. The angled view remains exploration/shot observation; aiming and shot controls remain in the existing overhead/phone interfaces.

Validation: all three browser regressions passed (paired phone/follow, exploration across wide/portrait views and unavailable-WebGL recovery). All three focused ball/coverage checks passed, plus typecheck, production build and formatting. Wide and portrait captures were visually reviewed. A held camera no longer repeatedly redraws unchanged geometry. The first cold-shot test allows 30 seconds for synchronous computation; terrain readiness is awaited before testing following. The existing legacy bundle-size warning remains. Physical device performance and seamless near/far terrain appearance remain open.


## 2026-10-18: shared angled lighting, gameplay and presentation

The angled landscape now offers an explicit Play in this view panel. It uses the existing illustrated caddy, effort and shaping inputs, stock-shot reset, play/result/next-shot actions and mulligan. The display's existing command gate and publication function remain authoritative: the same changes reach the phone and overhead controls. A click picks physical ground to set aim; dragging continues to orbit/pan without moving aim. Closing the panel restores exploration. A course replacement closes the old view, preventing stale-ground input.

Terrain lighting now samples one physical slope normal at each world coordinate for both detailed and distant meshes. Detailed textures no longer bake a second slope-lighting pass; overhead textures retain their established treatment. Distant texture budgets follow render quality (256 economy, 384 balanced, 512 crisp), with validated fixed allocation limits. This reduces lighting discontinuities and distant softness, but does not claim a fully stitched terrain mesh or seamless shoreline textures.

The new landscape-guides module builds the terrain-conforming target ring, a recorded trail capped at 257 vertices and impact particle batches capped at twelve recent events. It reuses the overhead particle generator, never a second simulation. The target ring indicates aim, not predicted carry. Effects use physical elevation and the WebGL depth buffer; the existing near/far depth-reset limitation still applies. Trace visibility, impact preference/reduced motion, ball colour/visibility and render quality now carry into angled viewing. Physics coefficients, collision bounds and recorded evidence are unchanged.

Validation: ten focused geometry, lighting, coverage and effect checks passed, along with typecheck and production build. All three browser regressions passed: paired phone and angled shot actions/aiming, wide/portrait exploration and fallback recovery. Desktop and portrait shot-panel captures were visually reviewed. Physical device performance and full terrain LOD continuity remain outstanding.


## 2026-10-18: connected terrain and continuous depth

The angled world now uses a single adaptive ground mesh across the visible coverage. A 128-by-128 base lattice refines toward the detailed window, with a hard 32,768-leaf ceiling and up to three refinement levels. Shared boundary vertices stitch different cell sizes; triangle fans retain those vertices so there are no unmatched internal edges. Every vertex elevation and normal samples the same physical course/world. This is a bounded presentation approximation, not a change to collision or simulation precision.

The fragment shader blends the detailed atlas and distant texture over the same ground geometry. Detailed object windows now omit their unused ground vertices, and the depth buffer is no longer cleared between distant and near objects. Ball markers, trails and particles therefore share the terrain's continuous depth. Fully transparent object-edge fragments are discarded instead of leaving invisible depth occluders. Textural resolution and vegetation-density differences can still be visible; this fixes geometric/depth discontinuity rather than claiming identical detail at every distance. The distant sampler now shares the atlas surface palette and retains authored fairways, greens, tees and bunkers instead of replacing them with generic regional ground. The opt-in play button also sits below the view heading so it cannot collide with the viewpoint dock at medium desktop widths.

Validation: twelve focused terrain, coverage, object-equivalence, lighting and guide/effect tests passed. The adaptive test checks every interior edge across refinement transitions and validates physical elevations. Typecheck and production build passed. All three browser regressions passed on the connected renderer, including paired angled play, medium-width control separation, wide/shallow coverage, portrait layout and WebGL fallback. Desktop, portrait and wide terrain captures were reviewed. The distant material regression also verifies authored fairways survive outside the detailed window. The final text-only settings update identifies the mode as an angled course with optional local play.


## 2026-10-19: retain authored woodland in distant views

Distant vegetation now includes the course's authored trees as well as deterministic surrounding-world trees. Previously, moving the detail window away could leave a conspicuously bare course rectangle. Both sources share the existing selection budget, bounds filtering and detail-window exclusion; this adds no duplicate physics objects or new collision rules.

Validation: all four distant-woodland regressions pass, including retention of authored course trees after the detailed window moves away. Both final browser regressions passed: wide/portrait exploration with unchanged-shot return, and unavailable-WebGL recovery. The final wide capture confirms authored woodland remains visible. Formatting passed. The connected-terrain checks and paired angled gameplay checks are recorded above. Physical-device performance, shoreline detail and vegetation density transitions remain follow-up work.


## 2026-10-19: subpixel coverage for distant material boundaries

The distant texture previously classified a whole texel from one surface query. At wide camera spans this made water banks, bunkers and fairway margins change in coarse blocks. The new landscape-material module first records centre samples, then identifies differing neighbouring surface types and averages four quarter-pixel samples only at those boundaries. Uniform interiors retain their exact existing colours and the restrained shared water palette.

The texture allocation remains 256/384/512 by quality setting; a temporary bounded label array supports boundary detection. Sampling is capped at five surface queries per texel including the original pass, yields between row groups and checks cancellation in both passes. Terrain elevations, collision, water extent and ball physics are untouched. This improves material coverage, not geometric shoreline resolution. Features too narrow to hit any centre sample can still be missed, and distant vegetation density/material transitions still need further art refinement.

Validation: five focused material/coverage tests pass, covering fractional shoreline colour, unchanged interiors, sample budget, cancellation, authored fairway retention, water colour and camera coverage. Typecheck and production build pass; the existing legacy course bundle-size warning remains.

Final verification: both landscape browser regressions passed, covering wide/portrait exploration, preserved shot state and unavailable-WebGL recovery. The wide capture was reviewed; material boundaries are softened, while the documented coarse distant geometry and density differences remain. Changed source/test files pass formatting.
