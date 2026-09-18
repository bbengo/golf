# Application topology

`main.ts` chooses the application by query parameter. Purity is the default;
preserving the original lab does not mean inheriting its entry journey.

| Route | Owner | Behaviour |
| --- | --- | --- |
| `/` | `display/app.ts` | Clubhouse, course selection, guidance, story and live course |
| `/#play` | `display/app.ts` | Same session, with collapsible on-screen controls |
| `/#pair` or `/?mode=display` | `display/app.ts` | QR pairing over the live course |
| `/?mode=cockpit&token=…` | `cockpit/app.ts` | Phone controller, no course/physics bundle |
| `/?mode=lab` | `lab/play.js` | Original setup journey and original physics |

## Navigation is presentation state

Home, course, guide, story, play and pairing use native fragment history. In-page
navigation never replaces `CockpitSession`, so choosing Home and returning to the
course keeps ball, shot count, intent and conditions. Reloading or opening the
separate original lab is a different lifetime and starts a new round on return.
There is no persistence database. The original standalone HTML remains untouched.

`display/markup.ts` owns the clubhouse and course shell. The story explains the
single-file origin and two-screen direction without requiring a player to read
implementation details. There is only one playable course, explicitly labelled as
single-hole practice; the interface does not invent locked courses or fake progress.
The course-card SVG is a decorative study, not simulation geometry.

Desktop navigation exposes Home, phone pairing and Controls. The controller can
collapse without leaving the course, and navigation can hide for a quiet view.
The canvas remains full viewport; its camera composition leaves room for the
controller. Native dialogs manage pairing and settings, including Escape/back.

## One session, interchangeable controllers

`startCockpit(root, transport?)` mounts into either the phone body or a desktop
overlay. Queries and datasets are scoped to that root. `ControlTransport` supplies
the same send/receive/status interface for direct commands and WebSocket commands.
The desktop never opens a second socket in the cockpit role. Local acknowledgements
are delivered in a microtask so input bookkeeping completes before responses.
Every accepted action publishes a snapshot to both controllers. Expected shot
numbers and existing phase checks protect simultaneous play attempts.

The display computes physics and renders the recorded trajectory. The relay only
delivers messages. QR pairing folds the desktop controller away on a new phone join;
it can be reopened while the phone stays connected. Disconnecting a phone preserves
the round. Pairing can be reopened from navigation. If the server is unavailable,
local controls still work and pairing explains how to start the local server.
Only one display and one phone may occupy the relay; a rejected display hides its
QR/link rather than offering a link to somebody else's active display.

## Controller destinations

- **Shot:** live lie/distance/wind, aim/read-ground pad, current club, effort,
  optional shape/height, play/result/mulligan.
- **My bag:** select a club and explicitly return to the shot.
- **Round:** current shot/phase, hole information, camera destinations and settings.

Phone tabs also use fragment history; desktop tabs stay local so they do not
overwrite the clubhouse's route. The back button returns to Shot from another tab,
collapses the desktop controller from Shot, or opens a phone menu with a clear
leave-controller action. No separate window or embedded document is required.

Settings uses authoritative conditions when opened so changes from the other
controller do not leave stale setup fields. Changing conditions starts a new hole.
Shape/effort input acknowledgement handling prevents older snapshots overwriting
pending local edits. The Play command carries current intent and expected shot.

## Visual and loading boundaries

Dark forest controls are the default for indoor play. An ivory alternative is saved
in localStorage; unavailable storage falls back safely. Native sans typography,
consistent SVG icons, large actions, focus outlines, safe-area spacing and reduced
motion are implemented without a UI library or font downloads.

`cockpit.css` styles the shared controller. `experience.css` styles the clubhouse
and desktop shell. `reference.css` belongs only to the original lab. Dynamic imports
keep course data and physics out of the phone; that separation remains tested.
The original index markup is retained for the lab and replaced by Purity surfaces.
The paired and desktop Purity modes use the same experimental fundamentals engine;
the balanced golfer is still fixed. The lab's player builder remains separate.
