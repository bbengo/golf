# Desktop play and player choice

The desktop no longer mounts the phone cockpit. `desktop-controls.ts` owns a
mouse/keyboard interface: separate round information, camera toolbar and a horizontal
shot dock. The phone retains its touch-first Shot/My bag/Round interface. Sharing
commands and simulation is useful; sharing their layout constrained desktop play.

Both send validated commands to the same CockpitSession. Local desktop input applies
synchronously; authoritative snapshots update both views. Play includes current
intent and expected shot number. No separate desktop socket or second simulation
is created. Display UI preferences never become shared physical shot state.

## Interface modes

Game Options owns Desktop controls, Minimal HUD and Clear course. The choice and
ball-follow preference persist locally when storage is available. Direct pairing
defaults to Clear course if there is no saved choice; normal entry defaults to
Desktop controls. Joining a phone does not replace an explicit preference.

Desktop shows readouts, camera actions and shot inputs. Minimal shows readouts and
the menu button; shot inputs remain available on the phone. Clear hides interface
and aim guides, retaining the actual ball, flag and course. A stationary click or
Escape opens the game menu even in Clear mode, including on a touch display.
Modes can be changed without resetting the round. Practice-condition changes
explicitly start a new hole; their fields refresh from authoritative state on open.

The game menu is navigation: Resume, Game options, guide, experience choice and
main menu. It does not contain a second set of shot controls. Options uses a native
dialog with internally scrolling content and persistent header/close controls.

## Pointer and camera behaviour

A desktop click sets aim or inspection through bounded MOVE commands. Large moves
are broken into protocol-sized steps. A drag is always camera input, including a
drag returning to its start. Single-click targeting waits 240 ms so the existing
double-click reframe can cancel it. This small local gesture delay is separate from
relay latency. Alt-arrow keys nudge aim relative to the camera; Space activates
the current shot action only when focus is on the course/body, not form inputs.

The camera reserves vertical room for the desktop shot dock using a presentation
offset and fit scale. World/screen transforms and cursor-anchored zoom share that
offset. This keeps whole-hole framing above the controls without resizing the canvas
or changing aim. The north indicator belongs to the camera toolbar, not the menu's
corner. Camera-follow can be disabled; reduced motion takes precedence.

## Estate identity and control hierarchy

An original flag-and-ball SVG mark connects loading, title, lobby and phone. Citron identifies the main shot/entry action, mint identifies selected control modes, ivory carries distance readouts, and dark green anchors controls. This separates information from decisions without changing the desktop/phone interaction contracts. Boot animation respects reduced motion and does not invent a progress percentage. Onest is served locally, including during loading.

## Illustrated caddy and restrained HUD

The desktop club control opens a native modal dialog of equipment cards with original family silhouettes and purpose labels. Selection uses the existing INTENT path, closes the dialog and updates the dock from the authoritative snapshot. Escape restores trigger focus; a shot started remotely closes the picker and disables equipment changes. Phone My bag shares the illustrations and choices while retaining touch layout and navigation. Chip is explicitly a technique. Illustrations describe families, not branded models; purpose labels are not numerical carry advice. Hidden selects remain internal value adapters for existing intent handling, not visible menus.

Readouts and actions use a unified dark forest material, muted sage selections, smaller gaps and rounded controls. The phone retains its explicit light-theme option. No simulation or course geometry changes accompany this refinement.

## Loading is part of the experience

The HTML provides a styled, locally-fonted initial screen before JavaScript arrives. Shared root colour tokens also drive controls and menus. The bootstrap preserves this layer outside the body while the app replaces its contents. Display signals readiness only after renderer.draw succeeds; pairing setup does not delay local entry. Phone and original-lab modes reveal after mounting. The handoff lasts 380 ms and is immediate with reduced motion. No simulated percentage or forced wait is shown. Import errors retain the layer with retry rather than leaving an endless indicator. An initial entry-script network failure cannot run this JavaScript recovery and still requires a browser reload.

## Daylight preference

Experience options includes Morning / Daylight / Late afternoon. The value is validated and saved locally as purity-daylight, independently of practice conditions and pairing. Selecting it does not issue a SETUP command or change the current shot. The canvas reports the active choice for browser verification.

## UCG tool restoration, 13 October 2026

Controls is now the first Game options tab and owns desktop/minimal/clear choices and phone pairing. Short presentation settings use native radio choices. Course & player tools is a separate menu destination with terrain, shot profile, yardages, player, journal and research tabs. Shared session/player/terrain/shot APIs provide the behaviour; research controls are not duplicated throughout the settings pages. See the root COSMOLOGY parity table for original-to-Purity destinations and model-reference limits.


## 2026-10-17: suspend hidden idle course drawing

The display loop now skips SimpleCourse.draw while the full-screen landscape dialog is open and the session is idle. The first frame always draws. Active shot animation still draws because the current renderer owns session.finish() when the recorded trajectory ends; blindly suspending it would leave phone-triggered shots unfinished. Relay publication remains outside this condition and continues normally. Closing the dialog naturally resumes the next frame, including after preview failure.

Why: two complete landscape renderers were running while only the preview was visible. This removes the hidden idle work without changing session timing or pairing. It is not a full renderer/simulation-loop separation; extracting animation completion from drawing is still a worthwhile engine follow-up. Validation checks the actual underlying canvas redraw count while the preview is open and after return. Both final preview browser tests passed, including the idle redraw-count assertion, resumed drawing, remote travel, resize/return and WebGL fallback. Typecheck, build, formatting and diff checks passed. The final landscape capture was visually reviewed; material detail is more consistent but coarse terrain/shoreline transitions remain visible.
