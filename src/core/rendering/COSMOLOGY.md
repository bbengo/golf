# Course presentation

The display is a full-viewport canvas behind the clubhouse and during play. `simple-course.ts` coordinates
the camera, actual recorded shot trajectory, ground and ball/cup/intent marks.
It writes no aim or physical terrain state. The original lab retains its renderer
and the reference HTML remains unchanged.

## Colour and ground

`course-atlas.ts` draws authored polygons and physical tree/bridge objects into a
cached world-space canvas. Muted olive fairways, pale greens, cooler rough,
quiet blue-green water and warm sand establish a value and temperature hierarchy.
These are deliberate sRGB art-direction choices, not measured spectral materials,
HDR or physically based lighting.

Mowing bands, seeded grain, meadow variation and layered tree
crowns create detail without bitmap assets. Illumination comes from the simulation's
slope field, clamped softly so sampled terrain seams do not dominate. Polygon
edges remain the authored playable edges; decoration creates no obstacles and
changes no material coefficients. Deep-rough colour transitions are softened
without changing the underlying physical polygons. The creek is drawn as a union
of authored water quads, with an offset shoreline highlight; this avoids painting
internal quad seams. Meadow variation and daylight grading are colour treatments,
not surveyed hills. Purity uses its own versioned woodland course; added creek
segments, bunkers and trees belong to physical geometry, not decoration.

The atlas rebuilds when the course object changes, not during camera motion. It
uses two pixels per metre with a 350 m decorative surround (roughly 32 MB RGBA for
this course, excluding browser/GPU copies and a similarly sized temporary water
mask while rebuilding). The surround does not expand playable
bounds. A viewport-driven procedural surround now covers views beyond this detailed cache. The playable world remains bounded; the background is scenery, not additional simulation. Display
device pixel ratio is capped at two.

## Camera and animation

`camera.ts` contains world/screen transforms, bounded zoom, panning and exponential
time-based easing. All screens begin north-up. Shift-drag or right-drag rotates;
rotation survives viewport resizing. Fit scale accounts for rotated bounds.
A north indicator appears while controls or the menu are open. The controller receives the
camera angle and transforms screen-relative aim deltas back into world coordinates,
so right still moves right on the display. The ground atlas, photographic renderer,
markers, pointer anchoring and panning share the same orientation.

The desktop camera toolbar owns the rotating north indicator and reset action.
It is separate from the bottom-left game menu. Minimal and Clear modes hide it.

Title and menu screens use a separate presentation camera over the same atlas.
Its slow drift stops with reduced motion. It renders terrain without aim/ball HUD
marks and never overwrites the playing camera or physics state. Menu input is
intercepted by the shell so it cannot accidentally pan the hidden playing camera.
Desktop mode reserves vertical camera space above the shot dock using offsetY
and the corresponding fit scale. World/inverse/zoom transforms include this offset;
the canvas still fills the screen. Reduced-motion preference also snaps this offset.
Initial framing uses the course plate, not invented multi-hole geometry.

Drag pans; wheel zoom keeps its world anchor beneath the cursor. Double-click,
Home fits north-up. N restores north; brackets rotate. Escape opens or closes the
course menu. Arrows pan and plus/minus zoom when the canvas has
focus. Phone hole/ball/green commands reframe even when choosing the same view
twice: `viewRevision` distinguishes a new request from unchanged current state.
Mulligans reframe the restored ball; a fresh hole returns to whole-hole framing.

Each shot starts following with altitude-sensitive zoom. Manual camera input or
a phone view request interrupts following until the next shot. Reduced-motion
preference disables following and makes requested framing immediate. Ball animation
remains visible and can be skipped from the phone. Camera coordinates never enter
the shot solver.

Game Options can disable following independently of interface mode. Desktop, Minimal
and Clear affect presentation only. Clear also suppresses aim/launch guides; the
actual flag and moving ball remain visible.

The launch indicator uses deterministic launch velocity and a symbolic curve cue.
It is not a predicted landing point or optimiser. Ball motion comes from the actual
trajectory at three times simulation speed; cosmetic lift distinguishes flight.

The photographic study remains in the original lab. Purity rejects photographic
mode because the reference image no longer matches its woodland geometry.
The retained `plate-renderer.js` is not the active procedural renderer.

## Estate colour direction

Warmer mown greens and pale sand contrast with turquoise lakes and cooler tree shadows. Lake colour gradients suggest depth artistically, not measured bathymetry; shoreline strokes are decorative banks around the physical water polygon. The cache remains two pixels per metre to limit rebuild cost and memory. Lawns use rounded ribbon ends and denser spline sampling, with identical geometry in the renderer and simulation. This remains a procedural overhead Canvas renderer, not a 3D landscape.

## October 2026: material detail and the wider landscape

The direction moves away from diagram-like fills toward layered overhead landscape materials. `terrain-detail.ts` creates deterministic value noise at three spatial scales. This is overlaid on authored surfaces, with seeded directional turf fibres and subtler mowing bands. At close zoom, visible fairway/green/tee regions receive a world-anchored vector blade pass so fine turf detail does not rely solely on magnifying the two-pixels-per-metre atlas. The clipping mask derives from those physical surface polygons.

Water uses muted depth colours, broken shoreline grain and small ripples whose full footprint is checked against the water union at build time. Ripples are batched into one stroke and freeze under reduced motion. Depth gradients are artistic, not excavated bathymetry. Small shoreline flecks are material texture, not collidable boulders. Trees use irregular crown/shadow outlines and denser light/shade clusters rather than smooth disks.

Two scenic lakes, interrupted woodland clusters and creek continuation occupy the existing 350-metre surround. Scenic tree crowns remain outside the playable rectangle; scenic lakes are also fully outside it. Creek extensions begin at the authored endpoints beyond playable bounds. These decorations are built only in the renderer, never added to the physical snapshot, and do not expand playable space. Within the course, visible trees and surface geometry continue to come from the simulation. Scenery is subordinate in colour and framing to the hole.

Performance: the base cache remains two pixels/metre (roughly 32 MB RGBA); the temporary water mask is similar in size, plus a one-third-resolution material buffer. Distant trees and leaf clusters are bounded. Twelve 128-pixel procedural canopy stamps replace repeated leaf construction; visible physical trees reuse these sharper stamps at close zoom. The per-frame additions are capped, batched ripples, visible close-view crowns and a viewport-limited close-view grass pass. No image assets, external services or new dependencies are needed. The detailed cache has finite extent; the viewport-driven surround now covers its outer edges. This is an improved overhead 2D renderer, not photorealistic 3D terrain, true volumetric grass or ray-traced reflection. Higher-resolution close-view terrain and tree detail remain future work.

## Wind cues and daylight

The renderer samples the same authoritative Wind.atDay(session.day(), 0) presentation used by the live readout. Ripple orientation, drift and intensity follow its toward bearing and fraction; the flag follows that bearing in camera coordinates, with a small flutter. Calm removes drift/flutter. Reduced motion freezes oscillation while retaining directional information. Near-view turf leans with the wind. These cues remain approximate rather than numeric wind-speed instruments.

Game options offers morning, daylight and late-afternoon art-directed sun positions, persisted on this display. Selecting one rebuilds the cached terrain once: physical and scenic tree shadows, canopy highlights, slope illumination and colour grade use the same east/north sun vector. This is an explicit visual preference, not a geographic sun ephemeris, automatic day/night cycle or changed weather/physics. Shadow silhouettes are a 2D approximation; changing light does not restart the round.

## October 13: viewport coverage beyond the detailed atlas

`landscape-surround.ts` inverse-projects all four viewport corners to select 512-metre world patches. This handles rotation, offsets, aspect ratio and the full allowed pan/zoom range without using a screen-sized flat fallback. Each patch is a 256-pixel procedural raster, cached in a 64-entry LRU (16 MiB RGBA maximum, excluding browser/GPU copies). Fully hidden patches are skipped. This is distant scenery; detailed playable terrain retains its existing atlas and physical geometry.

Noise, drainage and woodland placement use global world coordinates and stable hashes. Adjacent patches sample the same fields; neighbouring tree cells are included when crowns or shadows cross an edge. Morning/day/evening selections invalidate this backdrop cache and use the same sun vectors as the course. The outer 100 metres of the 350-metre detailed surround fade into the background, entirely outside playable bounds. This avoids a hard rectangular end to the course canvas. The overlap is an artistic blend, not a newly surveyed or playable landscape.

The new view coverage test checks extreme wide and portrait viewports at minimum zoom, rotated and panned; corner pixels must remain opaque and varied, detecting both holes and the old flat fallback. The unit test independently checks inverse-projected corner coverage at camera limits. Arbitrarily extreme aspect ratios can exceed the tile cache's working set and cause regeneration; typical desktop/phone views remain the intended target.
`wetness` also continues the remote north/south creek curves from woodland revision 0.2 into the patch field; those artistic endpoint constants must be revisited if that course layout changes.

## 2026-10-13 - Shared water material

`water-material.ts` samples smooth seeded world-space noise for sky/cloud colour, warped small ripples and sun-oriented glints. Morning/day/evening palettes follow the existing daylight selection. `course-atlas.ts` downsamples the union water mask to one sample per two world metres and makes two distance-transform passes. An exponential blend transitions bank green into reflected sky, avoiding lake-centred rings. The distance transform uses grid neighbours and is an approximate artistic distance, not physical depth. The resulting colour texture is clipped by the original full-resolution union mask.

`landscape-surround.ts` shares the same sampler, with approximate shore distance from its drainage field; water grain is reduced to keep reflections smooth. This adds cache-build work only, not per-frame pixel processing. Existing wind-driven ripple animation remains. Cloud reflections are static and stylised; no live sky, ray tracing or view-dependent Fresnel is claimed. The surrounding and detailed rough palettes were lifted together to retain their blend.

## 2026-10-13 - Clearer water, quieter reflections

User review clarified that sky reflection should explain the blue palette, not cover lakes in cloud-like bands. Kept the daylight palettes and bank-following shallows; restricted cloud accents to the highest noise values (above 0.76), squared their falloff and reduced maximum colour mixing from 75% to 10%. Reduced elongated glints from 15 to 4 intensity levels with a tighter falloff, and fine ripple contrast from 1.4 to 0.65. Both scenery layers share this change. The existing animated ripples remain; geometry and physics are untouched.

## 2026-10-13 - Water balance and camera easing

Reduced water blue relative to green for a more muted natural hue, retaining shoreline absorption and sparse reflections. Separated camera translation (190 ms exponential response) from slower zoom (420 ms). Flight zoom now varies smoothly between 1.75 and 2.35 using altitude rather than the steeper clamped 1.65-to-3 range; landing/bounce changes are less abrupt. HUD offsets use elapsed-time easing for consistent response across frame rates.

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

## 15 October 2026 - shoreline contours

Remote drainage now uses `shoreline.ts` to clip two triangles per mixed wet/dry cell against the sampled zero contour. Fully wet cells stay single polygons. Clockwise world winding keeps the union consistent after the canvas Y flip. Rows share field samples, avoiding repeated noise evaluation at each corner. This is presentation sampling of the existing physical field, not a new water boundary. A geometry regression checks exact linear crossings, polygon area and winding; the wide/rotated landscape browser scenario covers rendering. Small features below the 4 m grid remain approximate.

## 15 October 2026 - daylight transitions

`EnvironmentRenderer` crossfades the old and new cached lighting states over 650 ms. Both atlases use the current camera on each frame, so pan/rotation/zoom stay registered during the fade. A temporary full-viewport canvas composites the new state without fading HUD elements. The transition begins after terrain generation; the old atlas and buffer are released on completion. Reduced-motion preference skips the transition. This deliberately blends art-directed presets, not continuous astronomical sun travel. Peak memory temporarily includes two terrain caches; target-device performance remains a review item.

## 15 October 2026 - event-driven surface feedback

`impact-particles.ts` generates bounded, deterministic visual offsets from recorded bounce/water contacts. Sand and turf have different colours/counts; low-speed rebounds and hard surfaces do not eject decorative soil. Water droplets and two spreading rings distinguish a hazard from a grass landing. Recorded cup capture uses a restrained contracting ring. These are artistic cues, not extra physics. `ShotEffects` retains the existing trace and landing markers, limits active event rendering to 12 recent events, and honours impact-off/reduced-motion preferences. Clear course still omits the effect layer. No random timers or replay-dependent particle state were introduced. The root cosmology records the reference study and why a proper angled renderer would need terrain geometry and picking rather than a CSS transform.


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
