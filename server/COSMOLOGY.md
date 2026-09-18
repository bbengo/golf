# Local relay and pairing

`local.ts` uses Node HTTP and `ws`, without a web framework. It serves only the
built `dist/` directory, provides `/api/session`, and upgrades `/relay`. The same
origin carries the page, assets and socket, avoiding phone-side localhost mistakes
and cross-origin configuration. The relay never imports or runs the shot engine.

## Pairing and authority

Startup generates a random session token. The display builds a QR URL containing
the LAN address, cockpit mode and token. One display and one cockpit are allowed;
another occupied role is rejected. If multiple network adapters exist, the player
may need to choose the Wi-Fi adapter on the display. A QR cannot bypass router
client isolation or the host firewall.

This is a trusted local network session, not internet authentication. Devices on
the LAN can reach the session endpoint. There is no account identity, durable token,
TLS termination, multi-room allocation or ownership transfer system. The server
checks browser Origin against its own host before accepting socket upgrades.

## Message flow and failure policy

Cockpit commands are validated and forwarded to the display. The display returns
acknowledgements and snapshots. Only the latest snapshot is held in relay memory
for phone reconnection. Display disconnect clears it, preventing a newly connected
phone from receiving an obsolete round. Physics and shot history live in the display.

WebSocket payloads are capped at 32 KiB. A coarse per-connection message limit and
ping/pong heartbeat bound broken or flooding clients. Malformed JSON closes the
connection; invalid commands receive a rejection. No commands are stored for later
execution. Duplicate-shot protection lives in the authoritative session, not a
server physics handler.

The client reconnects with bounded exponential backoff. A closed phone socket
releases its role; a new connection receives fresh state. Occupied-role and
malformed-message closures do not automatically retry. Server restart invalidates
old QR tokens. Display reload starts a new round. These limits are intentional for
one local proof-of-concept session.

## Running

`npm run local` builds once and starts the relay on all interfaces at port 3000.
Set `PORT` to change the port. This is separate from `npm run dev`, which is the
Vite desktop-lab development server. The source repository and documentation are
not served. No cloud process or external relay is needed at runtime.
