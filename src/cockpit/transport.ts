import type { Message } from '../core/contracts/cockpit';

/** The same controls can talk to a local session or the Wi-Fi relay. */
export type ControlTransport = (
   receive: (message: Message) => void,
   status: (connected: boolean, reason: string) => void,
) => { send(message: Message): boolean; close(): void };
