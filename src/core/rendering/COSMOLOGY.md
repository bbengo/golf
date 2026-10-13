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

The default desktop layout distributes the same live DOM controls at 1200px and above: round info left, aim/inspection/shaping right, club/effort/commit below. No duplicate inputs, command routes or mobile cockpit were added. Resizing or selecting Single dock reparents the existing header and tuning controls; focus/state and the authoritative session remain shared. Clear and Minimal suppress the strategy panel. Layout selection lives in Experience settings.

Target reticle is a presentation-only module with a slow rotating four-arm crosshair, restrained radius breathing, and yards from the ball beside the chosen target. Reduced motion removes both animations; Clear course hides the reticle. Distance is intent, not a predicted carry/landing promise, and the camera is never animated by the reticle. Offscreen targets do not acquire misleading edge labels.

Shot analysis is a direct menu destination, with actual recorded carry, start-to-finish distance, apex, simulation duration and ordered contact events. Export downloads the full recorded shot JSON, preserving engine/course/intent/seed evidence. It does not replay or resimulate the shot.

### UCG-50 parity inventory

| Original capability | Purity destination/status |
| --- | --- |
| Target crosshair and distance | Restored beside the course target; restrained optional-motion behaviour |
| Club/effort/shape/height | Caddy, shot dock and separate desktop strategy panel; phone retains touch controls |
| Desktop local play | Lobby local-play entry and direct Game menu action; no phone requirement |
| Wind, moisture, tees and pin difficulty | Game options / Practice conditions |
| Camera framing, north, image view | Course toolbar and Game options / Camera & ball / Environment |
| Carry/total/apex/contact evidence and export | Game menu / Shot analysis; current-shot evidence export implemented |
| Probe elevation/slope/lie | Existing Inspect ground; richer contour/slope layers and terrain mesh remain queued for a dedicated Course study panel |
| Stock club yardages | Queue within the caddy: clearly label calm flat model reference rather than a promise for current conditions |
| Player fitting, variance and saved player files | Queue Player profile settings with versioned import/export validation; current Purity uses the baseline player |
| Replay, terrain/shot profile chart | Queue in Shot analysis; playback must reuse recorded trajectory rather than consume a new shot/seed |
| Learning record and full round export | Queue Practice journal, distinguish simulated choices from real player measurement |
| Approach/front-slope/putting studies and ground zones | Queue Practice conditions / Study presets; changing start must be explicit and auditable |
| Source provenance/research limits | Existing original lab and COSMOLOGY; queue readable About the model page inside Purity |

This inventory is a delivery checklist, not a claim of full UCG feature parity. Retain the original lab as a first-class experience while each remaining capability gets a discoverable Purity home.
