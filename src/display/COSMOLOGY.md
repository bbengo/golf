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
