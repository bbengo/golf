# Application topology

`main.ts` selects a surface by query parameter and imports its code and stylesheet
on demand. Query routes keep this local proof of concept small and work with a
plain static server; a general SPA router has no job here yet.

| Route | Owner | Behaviour |
| --- | --- | --- |
| `/` | `lab/play.js` | Original setup journey, desktop panels, original physics |
| `/?mode=display` | `display/app.ts` | Temporary QR setup, then course canvas only |
| `/?mode=cockpit&token=…` | `cockpit/app.ts` | Phone controls and returned readouts, no course canvas |

The existing HTML is the lab's markup. Display/cockpit entry points replace its
body instead of initialising the lab and hiding panels. Dynamic imports keep the
large course/simulation bundle out of the phone. Browser tests assert that the
phone neither mounts a canvas nor requests the simulation/reference-renderer chunks.

## Display

Creates `CockpitSession` and the course renderer, requests the ephemeral pairing
token, generates the QR locally with `qrcode`, and connects to the relay. A LAN
address is selected automatically, with a selector when several adapters exist.
The display responds to commands with an acknowledgement and a fresh snapshot.
It also publishes wind/phase updates periodically. Ball animation uses recorded
trajectory samples; no server computation is involved.

The pairing overlay is removed after the first cockpit joins. Losing the phone
does not crash or cover the course. Reloading the display deliberately creates a
new round; there is no round persistence service. Ball, cup and aim/launch marks
are the explicit exceptions to a course-only display.

## Cockpit

Owns controls and temporary input state, never physics state. Slider updates are
coalesced to animation frames. A pending-input acknowledgement prevents older
snapshots replacing newer local slider values. The Play command includes the
current controls and expected shot number, so a stale slider snapshot cannot
silently commit different intent. Reconnect restores authoritative state.

The touchpad, arrow buttons and keyboard arrows move aim or inspection coordinates.
Fine mode scales movement. Inspection is independent of aim. A phone can request
whole-hole, ball and green camera views; conditions changes start a new hole.
Renderer choice compares procedural and photographic views without changing physics.
The balanced golfer is currently fixed in paired mode; the full player builder
remains available only in the lab.

## Remaining boundaries

The original lab still has coupled DOM/session wiring. Extracting it preserved
behaviour; it did not magically make every original control reusable on the phone.
The new paired session is separate and imports reusable core modules. Further
shared controls should be extracted when actually needed, not replaced by copies
of the whole desktop page.
