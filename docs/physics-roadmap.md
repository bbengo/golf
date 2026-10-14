# Physics development track

The original point-mass model remains the desktop reference. Paired play now uses
an experimental mechanics path with coupled spin integration, friction impulses,
sliding contact, cylindrical trunks and conservative free-fall cup capture.
Implementation, sources, assumptions and limitations live in the
[simulation cosmology](../src/core/simulation/COSMOLOGY.md). The owner authorised
implementation after the original study-gate email. This does not imply empirical
validation of the resulting model.

## Implemented foundations (14 October 2026)

- Versioned ball/aerodynamic/contact profiles are consumed by the fundamentals engine and captured in shot evidence; coefficients remain explicitly uncalibrated.
- Shared procedural terrain, outer water elevation and bed queries participate in collision. The water model is authored geometry, not a fluid solver.
- One weather epoch supplies seeded wind and moisture, with sunlight preset identity captured for shot playback.
- Recorded landing/rollout analysis and a bounded repeatable dispersion study expose model outcomes without claiming real-player calibration.
- One full-shot timestep-halving regression complements existing isolated mechanics tests. Wider convergence coverage remains necessary.

## Remaining essential research

- Flight: select measured lift/drag curves, preserve their provenance and validity
  ranges, and validate trajectories independently. Spin is now three-dimensional;
  the aerodynamic coefficient family still needs empirical replacement.
- Contact: fit material and moisture behaviour against measured velocity/spin
  before and after contact, then evaluate compliant turf beyond a rigid impulse.
- Environment: add rim impact/lip-out dynamics and validate cup behaviour against
  measured captures. Refine object geometry where actual course objects require it.
- Numerics: establish full-shot convergence across flight, bounce, slide and roll;
  resolve remaining contact-time fractions and repeated impacts within a step.

These are research objectives, not claims of validated behaviour. Select source
data and validation cases before committing to a model. Establish appropriate
numerical convergence and physical consistency checks for each change, alongside
comparison against independent measurements where available.

Keep launch, flight, contact and collision boundaries independently testable.
Preserve engine versions, seeds, conditions and model provenance in shot records.
Exact reference parity applies to extraction; deliberate physics improvements
must be judged against their new validation evidence.
