import type { Message } from '../contracts/cockpit';

export function connectRelay(
   role: 'display' | 'cockpit',
   token: string,
   receive: (message: Message) => void,
   status: (connected: boolean, reason: string) => void,
) {
   let socket: WebSocket | undefined;
   let stopped = false;
   let delay = 500;
   let timer: ReturnType<typeof setTimeout>;
   function open() {
      const url = new URL('/relay', location.href);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      url.searchParams.set('role', role);
      url.searchParams.set('token', token);
      socket = new WebSocket(url);
      socket.onopen = () => {
         delay = 500;
         status(true, 'Connected');
      };
      socket.onmessage = (event) => {
         try {
            receive(JSON.parse(event.data) as Message);
         } catch {
            status(true, 'Invalid relay message');
         }
      };
      socket.onclose = (event) => {
         status(false, event.reason || 'Reconnecting…');
         if (!stopped && event.code !== 4003 && event.code !== 4009) {
            timer = setTimeout(open, delay);
            delay = Math.min(delay * 2, 5000);
         }
      };
      socket.onerror = () => socket?.close();
   }
   open();
   return {
      send(message: Message) {
         if (socket?.readyState !== WebSocket.OPEN) return false;
         socket.send(JSON.stringify(message));
         return true;
      },
      close() {
         stopped = true;
         clearTimeout(timer);
         socket?.close();
      },
   };
}
