# Purity Mobile Cockpit — Decoupled Display Architecture

## Concept

> Implementation note (2026-09-18): this is the original proposal. The owner's
> later instructions explicitly retain physics development as essential and limit
> only visual realism. The unchanged-physics constraint below is superseded by
> [the current cosmology](../COSMOLOGY.md). Pairing now uses `mode=cockpit` and a
> random session token. GitHub is source sync; runtime remains local.

Split the UCG-50 golf interface into two physically separate surfaces on the same local network:

- **Big screen (Display Mode):** shows the course only. No sidebar, no controls, no HUD. It exists purely as a visual field, in line with Purity's no-interface doctrine — the screen is the course, not a dashboard.
- **Phone (Cockpit Mode):** carries every control. Club selection, effort, shape, height, terrain inspection, wind, and the shot trigger all live here instead of on the main display.

The phone is the cockpit. The screen is the place. Nothing about a player's decision-making should ever appear on the big screen.

## Why this split, not just a UI toggle

This isn't cosmetic. It's the same principle already staked for Purity/Odysseus more broadly: the primary screen earns its purity by giving up every piece of interface that doesn't belong to the course itself. Building this against UCG-50 first proves the doctrine on a system that's already live, before it has to be carried into Unreal.

## Base structure (from UCG50_R06_Play.html)

The existing app already separates concerns reasonably cleanly, which is what makes this split viable without a rewrite:

| Existing element | Becomes |
|---|---|
| `#coursePanel` / `<canvas id="map">` | Big screen — overhead course view, terrain, shot result animation |
| `#shotPanel` | Phone — club, effort, shape, height, "Play this shot" |
| `#contextPanel` | Phone — terrain inspection, wind compass, readouts |

Two build targets from one codebase: a **display build** that mounts only `#coursePanel` and hides the sidebar entirely, and a **cockpit build** that mounts only `#shotPanel` + `#contextPanel` and drops the canvas.

## Sync architecture

**Local WebSocket relay. Nothing else.** No cloud service, no external relay, no internet dependency for this proof of concept — see scope constraints below.

- A small Node script (`http` + `ws`, no framework beyond that) runs on the same machine driving the big screen. It does two things: serves the app, and relays messages between connected clients.
- The **big screen** connects as a display client. The **phone** connects as a cockpit client, over the same Wi-Fi network.
- The phone emits state deltas on every meaningful input change; the display listens, recalculates the shot, and updates the aim line in real time before the shot fires.

### Message format

```json
{
  "event": "INTENT_UPDATE",
  "club": "6I",
  "effort": 92.5,
  "shape": -10,
  "height": 5
}
```

Keep this flat and cheap to serialize — this fires on every slider movement, not just on submit, so payload size and JSON.parse cost matter more than they would for a one-shot request.

### Pairing

The display renders a QR code encoding its own local address and a session token:

```
http://192.168.1.50:3000/?room=ucg50
```

Phone scans it, joins the room, done. No account, no app install, no manual IP typing.

## Latency

Target a realistic **10–20ms end to end** on ordinary Wi-Fi. Don't quote anything below that as a hard number — sub-5ms figures assume ideal, low-jitter conditions that consumer Wi-Fi doesn't reliably deliver, and total responsiveness also has to include the browser's own render cycle (~16ms at 60fps) on top of the network hop.

## Scope constraints — read before building

These aren't style preferences, they're load-bearing:

1. **Everything stays local for this proof of concept.** Development and runtime both run on the local machine. No cloud dev environment, no cloud deploy target, until this is explicitly revisited later.
2. **All shot/physics calculation must stay client-side, in the browser.** If any of this logic ends up running server-side later (e.g. behind a hosted deploy), that reintroduces a network round-trip into the shot calculation itself and defeats the entire point of the local sync — the phone-to-screen latency budget assumes nothing between phone and screen touches the internet. Do not add a server-side physics call without treating that as an architecture change, not an implementation detail.
3. **This is a proof of concept, not the production cockpit.** No account system, no persistent session beyond the QR pairing, no multi-room support. One display, one phone, one session at a time is enough to prove the doctrine.
4. **Reuse the existing UCG-50 simulation modules as-is.** Don't rewrite `Shot.buildLaunch()` or the underlying physics to build this — the point of this proof of concept is the display/input split and the sync layer, not new physics. Physics module work is a separate, already-staked-out track.

## What "done" looks like

- Big screen shows only the course canvas, live, on its own device.
- Phone shows only the cockpit controls, on its own device, same Wi-Fi network.
- Adjusting a slider on the phone visibly updates the aim line on the big screen within the latency target.
- Scanning the QR code is the entire pairing flow — no manual configuration.
- Killing the phone connection doesn't crash the display; it just stops receiving updates.
