# Physics development track

The existing point-mass implementation is an initial reference, not a permanent
constraint. Physics development follows the study gate described in Reagan's
email to Bill. Source extraction does not change the current equations.

## Research directions

- Flight: investigate three-dimensional spin-axis evolution and empirically
  supported aerodynamic lift and drag, documenting units and validity ranges.
- Contact: investigate friction-based spin-to-surface impulses, with explicit
  material and moisture assumptions and measured rebound/roll comparisons.
- Environment: improve canopy/structure collision representation and validate
  cup capture as a physical event rather than a proximity decision.

These are research objectives, not claims of validated behavior. Select source
data and validation cases before committing to a model. Establish appropriate
numerical convergence and physical consistency checks for each change, alongside
comparison against independent measurements where available.

Keep launch, flight, contact and collision boundaries independently testable.
Preserve engine versions, seeds, conditions and model provenance in shot records.
Exact reference parity applies to extraction; deliberate physics improvements
must be judged against their new validation evidence.
