# Course presentation

The display is a full-viewport canvas behind the clubhouse and during play. `simple-course.ts` coordinates
the camera, actual recorded shot trajectory, ground and ball/cup/intent marks.
It writes no aim or physical terrain state. The original lab retains its renderer
and the reference HTML remains unchanged.

## Colour and ground

`course-atlas.ts` draws authored polygons and physical tree/bridge objects into a
cached world-space canvas. Warm yellow-green fairways, pale greens, cooler rough,
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
bounds. Extreme wide/distant views can reach the flat-colour fallback. This is a
bounded cache, not a streaming world or close-range grass simulation. Display
device pixel ratio is capped at two.

## Camera and animation

`camera.ts` contains world/screen transforms, bounded zoom, panning and exponential
time-based easing. All screens begin north-up. Shift-drag or right-drag rotates;
rotation survives viewport resizing. Fit scale accounts for rotated bounds.
A north indicator appears while controls or the menu are open. The controller receives the
camera angle and transforms screen-relative aim deltas back into world coordinates,
so right still moves right on the display. The ground atlas, photographic renderer,
markers, pointer anchoring and panning share the same orientation.

The welcome view offsets the composition to give the landscape space beside the
copy. Opening desktop controls shifts the course into the remaining visual area;
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

The launch indicator uses deterministic launch velocity and a symbolic curve cue.
It is not a predicted landing point or optimiser. Ball motion comes from the actual
trajectory at three times simulation speed; cosmetic lift distinguishes flight.

The photographic study remains in the original lab. Purity rejects photographic
mode because the reference image no longer matches its woodland geometry.
The retained `plate-renderer.js` is not the active procedural renderer.
