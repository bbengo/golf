# Architecture and migration

## Current milestone

The Vite starter is replaced by the combined desktop lab. The original standalone
HTML remains unchanged. Its reusable modules now have explicit ES imports and
exports. Embedded images are local files under `public/assets/reference/`;
sampled terrain data remains part of the course module.

| Location | Responsibility |
| --- | --- |
| `src/main.ts` | Typed application entry point |
| `src/lab/` | Existing combined desktop controls and interaction wiring |
| `src/core/contracts/` | Existing deterministic data utilities |
| `src/core/course/` | Course data, terrain queries, wind and conditions |
| `src/core/simulation/` | Player model, launch, flight, contact and shot results |
| `src/core/session/` | Journey and practice accounting |
| `src/core/rendering/` | Canvas renderers, camera transforms and presentation |
| `src/core/style/` | Extracted baseline styles |
| `tests/` | Original-versus-extracted simulation comparisons and browser checks |

TypeScript is strict for new TypeScript code. `allowJs` permits gradual migration;
`checkJs` is initially disabled. A successful type check does not imply that the
legacy JavaScript is fully typed. The desktop lab still couples DOM controls to
session state; extraction makes that remaining work explicit, rather than
claiming the two-device architecture is already complete.

## Next milestones

1. Separate session commands and state from the lab's DOM event handlers. Define
   typed shot intent, results and session state from actual engine behavior.
2. Add display and cockpit routes with separate module loading. The display
   browser owns simulation and round state; the phone sends input commands and
   receives authoritative snapshots and results.
3. Add a local Node HTTP/WebSocket relay, temporary QR pairing, one display and
   one phone per session. Validate incoming messages at runtime; TypeScript types
   do not validate network data. Reconnects receive a fresh snapshot, and repeated
   shot commands must not create duplicate shots.
4. Prototype phone touchpad aiming and terrain inspection. Treat the aiming
   marker/line as an explicit course-overlay exception; pairing UI disappears
   after joining. Measure message delivery separately from visible response on
   actual Wi-Fi devices. The 10–20 ms figure remains an experimental target.
5. Integrate independently validated physics revisions through the simulation
   boundary and record their versions in shot evidence.

No cloud services, hosted physics calls, accounts or multi-room platform are
required for this proof of concept. The current baseline requires no runtime
network connection beyond its local web server.
