# Simulation mechanics and evidence

## Two engines, one launch contract

The original `research-point-mass/0.4.3` path in `shot.js` remains the desktop lab
baseline. `options.model = 'fundamentals'` selects `purity-rigid-sphere/0.1.0`, used
by paired play. Launch, course and conditions contracts stay shared. Versioned
shot records retain the seed, inputs, launch and result; replay selects the model
by version. Original-reference comparisons must continue to pass for the baseline.

All mechanics use SI units. Ball radius is 0.02135 m, mass 0.04593 kg, and inertia
is approximated as `I = 2/5 mR²`. Numerical/physical constants are separate from
display percentages and pixels. These are research models, not calibrated claims
about a particular golfer, ball or equipment manufacturer.

## Flight

The experimental path integrates position, velocity and all three spin components
together with RK4. Aerodynamic forces use velocity relative to the time-varying
wind. Only spin transverse to that relative velocity contributes to Magnus lift;
axial spin alone cannot produce that force.

Spin-down uses `dω/dt = -2e-5 |v_air| ω/R`, the Smits/Smith law reported in
[Nathan (2008), equation 5 and its SI-units footnote](https://baseball.physics.illinois.edu/spindown.pdf).
The torque is parallel to spin for this spherical approximation. Contact can
change the axis; arbitrary precession is not added without a torque model.
The reported measurement range is not validation of all low-speed states.

The old drag/lift coefficient family is still used. It is explicitly uncalibrated,
not an empirical coefficient table. Selecting, fitting and testing measured
lift/drag curves remains essential work.

## Surface contact

`fundamentals.contact()` resolves the incoming normal velocity using restitution.
The contact patch's tangential velocity includes `ω × r`. Friction opposes that
slip and is limited by `|Jt| <= μ Jn`; the effective tangential mass includes the
ball's rotational inertia. The same impulse updates linear and angular momentum.
This permits spin to change the outgoing speed/direction instead of applying an
independent scripted backspin multiplier.

After small bounces, a sliding phase evolves friction and spin until rolling
contact is reached. Existing terrain-aware rolling resistance then applies.
Friction coefficients are declared trial values by surface. Moisture still affects
the baseline restitution and rolling resistance; no wet-green spin bonus is added.
Real turf deforms, and a rigid impulse is not the final calibration model. The
experimental context is discussed in
[Measurements and linearized models for golf ball bounce](https://arxiv.org/abs/2302.02758).

## Objects and cup

Trunks use swept finite cylinders. The expanded-cylinder cap corners approximate
the rounded sphere/cylinder Minkowski boundary. Canopies remain solid ellipsoids,
bridges boxes; individual branches, piers and deformable foliage are not represented.

Cup capture requires crossing the near rim and satisfying ball-clearance/free-fall
geometry as in
[Penner, The physics of putting, equation 22](https://www.waddengolfacademy.com/putting/Penner_The%20Physics%20of%20Putting.pdf).
It considers speed and lateral offset, rather than declaring any nearby slow ball
holed. It is a conservative subset of captures. Rim rebounds and lip-outs are
not implemented. The local normal-gravity slope correction is an approximation,
not a validated sloped-rim solver.

## What the tests prove

Mechanics tests cover vacuum trajectories, flight timestep convergence, axial
versus transverse spin, energy and impulse constraints, backspin transfer,
sliding-to-rolling speed (5/7 for the flat non-spinning case), swept cylinder
contact and the centred free-fall cup threshold (about 1.31 m/s). Recorded
experimental shots replay deterministically. This is analytical and numerical
evidence, not field validation.

## Limits that must remain visible

The whole-shot integrator retains baseline contact-step scheduling. Resolving a
collision does not yet integrate the entire remaining fractional timestep with
multiple impacts. Full-shot convergence and accurate event-time refinement remain
necessary. Small vertical rebounds are collapsed into a sliding contact state.
Current restitution, friction, canopy loss and aerodynamic coefficients require
independent measurement-based validation. Water/unresolved/outside-survey states
are reported; the paired practice session offers restart/mulligan rather than
inventing competition rules.

See [the physics roadmap](../../../docs/physics-roadmap.md) for the outstanding
work. Simple graphics must not be used as a reason to remove these requirements.


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
