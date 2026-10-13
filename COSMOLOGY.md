# Purity golf: why this project exists

UCG-50 is the local test bed for separating a golf experience into a course-only
display and a phone cockpit, before carrying the pattern into Odysseus/Unreal.
The phone carries decisions; the screen carries the place. The original
`UCG50_R06_Play.html` is retained as evidence and an executable baseline.

The next experience is not obliged to inherit the original entry flow. Purity now
opens with a clubhouse, course selection, guidance and a short account of that
transition. A collapsible controller can also live directly over the course. The
owner explicitly requested this desktop alternative; the full-screen course is
still available by collapsing controls and hiding navigation.

## Decisions and their reasons

**Vanilla TypeScript and Vite.** This follows the owner's pattern: explicit application surfaces, shared core, native DOM and CSS. New
code uses strict TypeScript because messages and physics refactors cross module
boundaries. Existing JavaScript remains allowed so extraction does not require a
simultaneous language rewrite. `checkJs` is off; those files are not fully typed.

**One display owns simulation.** The phone sends intent, not authoritative shot
results. A relay delivers messages without calculating physics. This avoids two
independent engines drifting and keeps the complete shot calculation local to the
display browser. The shared engine is reusable without the lab's DOM controls.

**One session, distinct interfaces.** Phone and desktop have their own control layouts.
Desktop commands go directly to the authoritative session; phone commands arrive
through the relay. Both use the same validation, shot gates and snapshots. A second
window, iframe or second simulation is unnecessary. Local controls work even when
the pairing server is unavailable.

**Dark by default.** Indoor play motivated the owner's explicit preference for
dark controls. Forest/charcoal surfaces, warm ivory text and restrained lime actions
replace the washed-out light stack. An ivory option is saved per browser. The
provided sports-interface references informed hierarchy, navigation and distinct
screens; the illustrated landscape informed composition and layered ground colour.
The reference images stay review-only and ignored, never imported by the app.

**Local WebSocket relay.** One Node process serves the built app and joins one
display to one phone. There is no signalling service, cloud session database,
account system, multi-room platform, or server-side physics. GitHub is source
history and synchronisation, not game networking or hosting. Tests also run locally.

**Natural presentation, essential mechanics.** The successful paired trial led
to an expanded presentation brief: rounded phone controls, sans typography,
a full-viewport course and an interactive shot camera. Warm fairways, pale greens,
cooler rough and muted blue-green water establish a readable colour hierarchy.
Procedural detail gives the course character without image downloads or
photorealism. This presentation work does not reduce the
requirements for flight, contact, collision, cup behaviour or reliable controls.
The procedural renderer is a small experiment. Purity has a versioned woodland
course with shared visual and physical hazards. The photographic version remains
in the original lab because it depicts the original layout.

**Quiet, intentional presentation.** Onest is bundled locally with its OFL license,
so typography works without Google Fonts requests. Variable weights distinguish
headlines, actions and supporting information; numeric readouts use tabular figures.
The course starts north-up and supports manual rotation. During uninterrupted play,
the player chooses Desktop controls, Minimal HUD or Clear course in Game Options.
Clear course has no interface or aim guides; clicking or Escape opens the menu.
Desktop controls remain available through shots. Pairing preserves that choice.

**Two physics versions.** The desktop lab preserves the original engine. Paired
play uses the experimental fundamentals model. Versioned shot evidence makes the
distinction explicit. Analytical checks are evidence of mechanical/numerical
consistency; they do not establish agreement with real turf or measured ball flight.

The initial email placed new work after the study gate. The owner subsequently
authorised implementation in this session. No later scope change should silently
turn this proof of concept into a hosted service or treat experimental coefficients
as measured data.

## Documentation ownership

**The world comes first.** The September 19 direction replaces the website-style
clubhouse with a game entry and overlay menus. The viewport never becomes a scrolling
page: long information belongs inside bounded panels. The title and menus share the
live course atlas through an independent presentation camera, preserving gameplay
state and the player's chosen camera. Phone control is an input option within that
game, not the reason to present the experience as a website.


Settled architecture and its reasons belong in the nearest `COSMOLOGY.md`. Keep
code comments for equations, units and non-obvious local behaviour. Update the
cosmology when changing a boundary, dependency, physical assumption or failure
policy. Record shipped changes in the changelog and unfinished work in the handoff.

| Document | Questions it answers |
| --- | --- |
| [src/COSMOLOGY.md](src/COSMOLOGY.md) | Which app runs, what loads, and what owns state? |
| [core/COSMOLOGY.md](src/core/COSMOLOGY.md) | How commands become shots, and where do contracts belong? |
| [simulation/COSMOLOGY.md](src/core/simulation/COSMOLOGY.md) | Which equations, evidence, approximations and missing physics? |
| [rendering/COSMOLOGY.md](src/core/rendering/COSMOLOGY.md) | How is the course drawn without image assets? |
| [server/COSMOLOGY.md](server/COSMOLOGY.md) | How do pairing, relay, duplicate clients and reconnects work? |
| [tests/COSMOLOGY.md](tests/COSMOLOGY.md) | What do passing tests prove, and what remains untested? |
| [docs/physics-roadmap.md](docs/physics-roadmap.md) | What physics work remains essential? |
| [CHANGELOG.md](CHANGELOG.md) | What changed and what was checked? |
| [docs/NEXT-SESSION.md](docs/NEXT-SESSION.md) | What should the next session resolve? |

Documentation stays outside `public/`, so the local static server does not serve
it. The original Markdown spec is historical input; its unchanged-physics rule is
superseded by the owner's instruction and these implementation documents.

## Estate and identity refinement

The landscape references informed a broader golf estate around the single practice hole: lawns, water and a connecting path give the course context. New surfaces participate in physical lie queries rather than existing only as painted scenery. Colour hierarchy now connects the original Purity mark, loading screen and distinct desktop/phone layouts. Inspiration images remain ignored and are not shipped as course artwork. See course, rendering and display cosmologies for geometry and rendering limitations.

## A quieter equipment experience

The HUD now shares dark forest surfaces and restrained sage accents; distance no longer sits on an unrelated light card. Compact spacing and rounder controls support an equipment-focused interaction. Club selection is an illustrated caddy on desktop and phone, with the chosen silhouette visible during shot preparation.

## One arrival sequence

Loading and title now use matching Onest wordmark proportions, mark size, spacing and shared forest/sage colour tokens. The loading layer persists across application mounting until the first course frame has drawn, then fades into the scene without an artificial minimum wait. Subtle procedural contour lines introduce the landscape before the live course appears.

## October 2026: landscape instead of a diagram

The procedural render now layers material variation, turf fibres, softer mowing, irregular tree detail and subdued moving water. The existing scene surround gains woodland, lakes and continued creek so the playable hole has a landscape around it. Gameplay bounds, course revision and physics stay unchanged; the extra scenery is explicitly outside playable space. Rendering cosmology records the caching budget, artistic water depth and remaining 2D/close-zoom limits.

## Living environmental cues

Wind now has visible consequences in flag flutter, water ripple direction and fine grass lean, driven by the actual simulation wind presentation. A separate display preference offers three art-directed sun positions with coherent shadow direction, canopy lighting and warmth. It does not alter physics or force a new practice round.

## October 13: environment coverage follows the camera

The scenery now extends through procedural world patches selected from the visible camera area, including maximum zoom-out and rotation. Grass, water and woodland continue past the detailed course atlas, with a blended distant transition. The original gameplay bounds remain authoritative; background expansion adds no playable holes or invisible physical obstacles.

## 2026-10-13 - Sky-coloured water and livelier terrain

The water's concentric lake gradients made it read as an illustration. Replaced these with a shared, world-anchored water material: blue sky, irregular pale cloud reflections, directional small glints and green bank shallows. The detailed atlas derives a visual shore-distance field from its combined water mask, preserving creek joins and actual bank outlines. Distant tiles use their existing drainage field for approximate depth and the same colour sampler. This is an artistic reflection approximation, not a rendered sky or measured bathymetry.

Raised green-channel separation in rough and maintained brighter fairways/greens against deeper woodland. Reflections respond to the existing daylight presets. Geometry, collision and shot physics are unchanged. Materials remain cached and procedural with no downloaded images. User requested review before pushing; keep this change local.

## 2026-10-13 - Rounded estate-loop closure

The estate walk repeated its first point but used open-ended spline interpolation and end normals. That produced a sharp bottom-left join. Closed ribbons now interpolate cyclic neighbours on both smoothing passes and use wrapped tangent normals, closing each bank before connecting the polygon. Open lawns retain their existing round caps. This changes shared visual/physical path geometry, so the woodland revision advances to 0.2.1. A regression checks both bank closures, tangent continuity and path/interior surface queries.

## 2026-10-13 - Clearer water, quieter reflections

User review clarified that sky reflection should explain the blue palette, not cover lakes in cloud-like bands. Kept the daylight palettes and bank-following shallows; restricted cloud accents to the highest noise values (above 0.76), squared their falloff and reduced maximum colour mixing from 75% to 10%. Reduced elongated glints from 15 to 4 intensity levels with a tighter falloff, and fine ripple contrast from 1.4 to 0.65. Both scenery layers share this change. The existing animated ripples remain; geometry and physics are untouched.

## 2026-10-13 - Natural water, continuous shots and quieter camera

The invisible wall was the inherited `source-coverage-limit-not-OB` rule: simulation stopped as soon as a ball crossed the source rectangle, even in flight. Purity now declares `synthetic-estate-continuation` (woodland 0.3.0). It uses existing ground/contact/rolling integration beyond that rectangle and accepts a naturally settled lie there; phone aim movement also stops clamping to the old rectangle. Original UCG-50 keeps its survey-stop rule. Regression fixtures cross the actual western edge in flight and rolling, then check landing and supported rest; a control fixture retains the legacy stop.

This is not new surveyed ground. The DEM adapter extends its outermost samples outside the grid, and undeclared ground defaults to rough. Authored estate paths/lakes retain physical polygons, but distant scenic water and vegetation remain decorative. Shared physical/procedural surroundings are still future work. No collision, aerodynamics or turf coefficients were tuned to disguise the boundary bug.

Water shifts toward muted blue-green while preserving clear shallows. Camera translation eases over 190 ms and zoom separately over 420 ms; a gentler height-to-zoom curve reduces bounce-driven zoom pulses. HUD framing now uses elapsed time rather than a per-frame factor. Manual interruption and reduced-motion behaviour remain.

## 2026-10-13 - Image-era limits audit and environment selection

Removed three additional restrictions for the synthetic estate: controller MOVE clamp (aim and probe), image-frame camera pan clamp, and clipped terrain-inspection mesh bounds. Keeping the initial whole-hole composition based on the image registration is intentional framing, not a movement or simulation boundary. Zoom remains bounded for performance/readability, and the integration time limit remains an explicit unresolved result rather than fabricated rest.

Game options now offers procedural, original image, and both as a split comparison with one shared camera and simulation. Preference persists locally; the additive renderer enum travels through the existing command/snapshot validation. Restored the existing locally served photo assets, fixed both camera offset axes in their adapter, and kept procedural scenery available while assets load. Image landmarks represent the older study and do not overwrite current physics or reset play. Menu/title remain procedural.

Remaining architectural work: distant procedural water/trees are presentation only; promote them to a deterministic shared world sampler before claiming physical parity. The DEM's clamped extension is continuous in height but not necessarily slope; replace it with a smoothly blended authored terrain extension. Photo-only surroundings still have finite texture detail and a plain renderer background; the image cannot supply new detail. These are explicit remaining tasks, not reasons to reimpose image boundaries on Purity.
