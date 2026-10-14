# Purity woodland course

`purity-course.ts` clones HoleVisual into a separate synthetic design, versioned
`purity-woodland/0.3.0`. The original lab and reference HTML stay unchanged.

The creek banks are interpolated into connected quadrilaterals and extended through
the surroundings. Water elevations inherit the nearest original segment. Three
organic sand polygons and deterministic woodland trees enter the same data used by
rendering, lie queries, collisions and replay snapshots. Trees avoid tee clearances
and the green complex. The seed makes resets reproducible.

This changes playable geometry and therefore can change shot outcomes. It does not
change flight/contact equations or claim measured course design. Sand has a material
boundary, not a newly excavated terrain mesh; bank shading is artistic. Water levels,
hazard placement and collision cost need continued playtesting. Original photographic
imagery is unavailable in Purity because it depicts different geometry.

## Estate surroundings (September 2026)

Revision `purity-woodland/0.2.0` adds two curved practice lawns, two lakes, two sand areas and an estate walking loop. Their polygons are shared by rendering, lie queries and the physics snapshot; seeded woodland avoids these surfaces. The original tees, pins, main hole and reference implementation remain intact. These are surroundings for one playable hole, not additional playable holes. Lakes use a constant water height sampled at their centre; the underlying DEM is not excavated. Off-line shots can encounter the new surfaces.

## 2026-10-13 - Rounded estate-loop closure

The estate walk repeated its first point but used open-ended spline interpolation and end normals. That produced a sharp bottom-left join. Closed ribbons now interpolate cyclic neighbours on both smoothing passes and use wrapped tangent normals, closing each bank before connecting the polygon. Open lawns retain their existing round caps. This changes shared visual/physical path geometry, so the woodland revision advances to 0.2.1. A regression checks both bank closures, tangent continuity and path/interior surface queries.

## 2026-10-13 - Synthetic estate continuation

Purity 0.3.0 explicitly opts out of the original source-survey termination policy. Boundary crossing no longer ends flight or roll, and supported rest beyond the old rectangle is a playable settled lie. Bounds still define the authored region and renderer cache layout; changing them would shift scenery. Outside the DEM, existing clamped grid sampling supplies approximate ground; undeclared surfaces are rough. Decorative distant lakes/trees are not physical hazards. Legacy courses retain their existing stop/out-of-bounds semantics.


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
