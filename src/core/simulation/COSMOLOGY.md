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
