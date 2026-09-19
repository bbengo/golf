# Purity woodland course

`purity-course.ts` clones HoleVisual into a separate synthetic design, versioned
`purity-woodland/0.2.0`. The original lab and reference HTML stay unchanged.

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
