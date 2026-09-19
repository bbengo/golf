# Application topology

`main.ts` chooses the application by query parameter. Purity is the default;
preserving the original lab does not mean inheriting its entry journey.

| Route | Owner | Behaviour |
| --- | --- | --- |
| `/` or `/#title` | `display/app.ts` | Full-viewport title over the live course |
| `/#editions` | `display/app.ts` | Equal, prominent entrances to Purity and UCG-50 Original |
| `/#home` | `display/app.ts` | In-world game menu: play/resume, pairing, course and guide |
| `/#play` | `display/app.ts` | Same session, with collapsible on-screen controls |
| `/#pair` or `/?mode=display` | `display/app.ts` | QR pairing over the live course |
| `/?mode=cockpit&token=…` | `cockpit/app.ts` | Phone controller, no course/physics bundle |
| `/?mode=lab` | `lab/play.js` | Original setup journey and original physics |

## Navigation is presentation state

Title, editions, home, course, guide, story, play and pairing use native fragment history. In-page
navigation never replaces `CockpitSession`, so choosing Home and returning to the
course keeps ball, shot count, intent and conditions. Reloading or opening the
separate original lab is a different lifetime and starts a new round on return.
There is no persistence database. The original standalone HTML remains untouched.

`display/markup.ts` owns the game shell. About Purity explains the
single-file origin and two-screen direction without requiring a player to read
implementation details. There is only one playable course, explicitly labelled as
single-hole practice; the interface does not invent locked courses or fake progress.
The course itself is the backdrop, rather than a separate illustrated course card.

The viewport is a fixed game surface from entry onwards. There is no site header,
marketing page, outer scroll or footer sitemap. Title leads to an experience choice:
Purity and UCG-50 Original have distinct, equally sized sections with real links,
control/physics descriptions and a clear round-lifetime note. The original is not
buried in About. Purity leads to the game menu, which can reopen this choice;
long course/guide/about content scrolls inside bounded panels with fixed back and
action rows. The lobby action region can scroll on short screens. Native browser
full screen is an optional explicit action with a fallback when unavailable.
Pairing cancellation returns to the originating screen. Escape backs out of panels;
from the game menu it resumes an entered round or returns to the title.

The game menu contains Resume, Options and navigation, separate from shot controls.
Options offers Desktop controls, Minimal HUD and Clear course. The canvas remains
full viewport; desktop framing reserves space for its bottom dock. Native dialogs
manage pairing and options, including Escape/back.

## One session, distinct interfaces

`startCockpit` owns the phone interface. `display/desktop-controls.ts` owns the
mouse/keyboard HUD and shot dock; desktop no longer mounts the phone UI. Both use
one command contract and session validation. Desktop commands apply directly and
synchronously, without a second cockpit socket or simulation.
Every accepted action publishes a snapshot to both controllers. Expected shot
numbers and existing phase checks protect simultaneous play attempts.

The display computes physics and renders the recorded trajectory. The relay only
delivers messages. Pairing preserves the player's interface preference; desktop
and phone can both control the round. Disconnecting a phone preserves the round.
Pairing is available in Game Options. If the server is unavailable,
local controls still work and pairing explains how to start the local server.
Only one display and one phone may occupy the relay; a rejected display hides its
QR/link rather than offering a link to somebody else's active display.

## Phone controller destinations

- **Shot:** live lie/distance/wind, aim/read-ground pad, current club, effort,
  optional shape/height, play/result/mulligan.
- **My bag:** select a club and explicitly return to the shot.
- **Round:** current shot/phase, hole information, camera destinations and settings.

Phone tabs use fragment history. The back button returns to Shot from another tab
or opens the phone menu. Desktop controls have no phone-style tabs: information,
camera actions and shot inputs occupy separate screen regions. See
[display/COSMOLOGY.md](display/COSMOLOGY.md) for input and interface-mode decisions.

Settings uses authoritative conditions when opened so changes from the other
controller do not leave stale setup fields. Changing conditions starts a new hole.
Shape/effort input acknowledgement handling prevents older snapshots overwriting
pending local edits. The Play command carries current intent and expected shot.

## Visual and loading boundaries

Dark forest controls are the default for indoor play. The phone's ivory alternative is saved
in localStorage; unavailable storage falls back safely. Locally bundled Onest typography,
consistent SVG icons, large actions, focus outlines, safe-area spacing and reduced
motion are implemented without a UI library or external font requests. The full
variable font and OFL license live in public/assets/fonts/onest. Display headlines
use a stronger weight; numerical readouts use tabular figures to avoid shifting.

Desktop and Minimal modes have a menu button. Clear course hides all interface
and aim guides; clicking the course or pressing Escape restores navigation.
Desktop controls remain available through shots; the selected mode persists locally.
Native dialogs retain their own Escape handling. Camera actions live in the HUD.

`cockpit.css` styles the phone controller. `experience.css` styles the game menus
and desktop shell. `reference.css` belongs only to the original lab. Dynamic imports
keep course data and physics out of the phone; that separation remains tested.
The original index markup is retained for the lab and replaced by Purity surfaces.
The paired and desktop Purity modes use the same experimental fundamentals engine;
the balanced golfer is still fixed. The lab's player builder remains separate.
