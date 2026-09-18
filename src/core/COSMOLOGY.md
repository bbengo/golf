# Shared core

## Command to result

`contracts/cockpit.ts` defines the small wire vocabulary and validates incoming
commands at runtime. TypeScript alone cannot validate network messages. Controls
use effort 0.15–1.1 and shape/height -1–1; the phone converts displayed percentages.
Physical coordinates are metres, velocities m/s, time seconds, spin radians/s.

`session/cockpit-session.ts` owns course setup, current ball/aim/probe, intent,
shot phase, shot number, records, and renderer/camera choices. It has no DOM or
WebSocket dependency. `apply()` acknowledges a command once, checks the phase,
updates state and increments a revision. `snapshot()` sends only the phone's
readouts, not the large course or trajectory. The renderer samples the recorded
trajectory on the display and calls `finish()` at the end of animation.

Planning, animating and resolved are distinct states. A new Play requires planning
and the expected shot number. Inputs that would change a committed shot are
rejected while animating. A bounded cache retains 1,024 acknowledgements; duplicate
IDs return the original response. A mulligan restores the most recent start once
while retaining the physical attempt record. Next shot currently requires a settled
result; water, holed and unresolved shots can be restarted or undone.

## Ownership

- `course/`: authored course data, height/slope queries, wind and conditions. These
  are the shared physical source for simulation and rendering.
- `simulation/`: launch and trajectory calculation, independent of network/DOM.
- `rendering/`: world-to-screen presentation; never modifies physical course data.
- `network/`: client transport, bounded reconnect delays, no command replay queue.
- `style/`: lab baseline CSS and the smaller paired-mode stylesheet.

The relay client accepts display snapshots from this trusted local application.
Commands are strictly validated; snapshots do not yet have a complete runtime
schema. Public internet hosting would require a separate security review and is
outside this architecture.

## Known limits

Physics currently runs synchronously on the display. Long simulations can delay
rendering and acknowledgements; profiling should establish whether a Web Worker
is needed. The phone displays command round trip, not one-way network latency or
input-to-photon delay. Large sampled terrain remains bundled with the simulation
dependencies. Neither is hidden by a hard latency claim.
