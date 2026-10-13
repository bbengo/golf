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
