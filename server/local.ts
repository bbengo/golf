import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { validCommand } from '../src/core/contracts/cockpit.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.PORT || 3000);
const token = crypto.randomBytes(24).toString('hex');
const types: Record<string, string> = {
   '.html': 'text/html',
   '.js': 'text/javascript',
   '.css': 'text/css',
   '.png': 'image/png',
   '.jpg': 'image/jpeg',
   '.svg': 'image/svg+xml',
   '.json': 'application/json',
};
const addresses = Object.values(os.networkInterfaces())
   .flat()
   .filter((a) => a && a.family === 'IPv4' && !a.internal)
   .map((a) => a!.address);
const server = http.createServer((req, res) => {
   if (!['GET', 'HEAD'].includes(req.method || '')) {
      res.writeHead(405).end();
      return;
   }
   let url: URL;
   try {
      url = new URL(req.url || '/', 'http://localhost');
   } catch {
      res.writeHead(400).end();
      return;
   }
   res.setHeader('Cache-Control', 'no-store');
   res.setHeader('X-Content-Type-Options', 'nosniff');
   if (url.pathname === '/api/session') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ token, addresses, port }));
      return;
   }
   let pathname: string;
   try {
      pathname = decodeURIComponent(url.pathname);
   } catch {
      res.writeHead(400).end();
      return;
   }
   const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
   if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
   }
   fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) {
         res.writeHead(404).end('Build the app with npm run build first.');
         return;
      }
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      if (req.method === 'HEAD') {
         res.end();
         return;
      }
      fs.createReadStream(file)
         .on('error', () => res.destroy())
         .pipe(res);
   });
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 32768 });
let display: WebSocket | undefined;
let cockpit: WebSocket | undefined;
let latest: string | undefined;
const send = (ws: WebSocket | undefined, message: unknown) => {
   if (ws?.readyState === WebSocket.OPEN)
      ws.send(typeof message === 'string' ? message : JSON.stringify(message));
};
const peers = () => {
   const message = {
      type: 'PEERS',
      display: display?.readyState === WebSocket.OPEN,
      cockpit: cockpit?.readyState === WebSocket.OPEN,
   };
   send(display, message);
   send(cockpit, message);
};
server.on('upgrade', (req, socket, head) => {
   const url = new URL(req.url || '/', 'http://localhost');
   const role = url.searchParams.get('role');
   if (
      url.pathname !== '/relay' ||
      url.searchParams.get('token') !== token ||
      !['display', 'cockpit'].includes(role || '')
   ) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
   }
   if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
   }
   wss.handleUpgrade(req, socket, head, (ws) => {
      if ((role === 'display' ? display : cockpit)?.readyState === WebSocket.OPEN) {
         ws.close(4009, `A ${role} is already connected`);
         return;
      }
      if (role === 'display') {
         display = ws;
         latest = undefined;
      } else cockpit = ws;
      let alive = true;
      let count = 0;
      const heartbeat = setInterval(() => {
         count = 0;
         if (!alive) {
            ws.terminate();
            return;
         }
         alive = false;
         ws.ping();
      }, 10000);
      ws.on('pong', () => {
         alive = true;
      });
      ws.on('error', () => ws.close());
      ws.on('message', (raw) => {
         if (++count > 1500) {
            ws.close(4008, 'Too many messages');
            return;
         }
         let message;
         try {
            message = JSON.parse(raw.toString());
         } catch {
            ws.close(4003, 'Invalid JSON');
            return;
         }
         if (role === 'cockpit') {
            if (!validCommand(message)) {
               send(ws, {
                  type: 'ACK',
                  id: typeof message?.id === 'string' ? message.id.slice(0, 80) : '',
                  ok: false,
                  error: 'Invalid command',
               });
               return;
            }
            if (display?.readyState !== WebSocket.OPEN) {
               send(ws, { type: 'ACK', id: message.id, ok: false, error: 'Display disconnected' });
               return;
            }
            send(display, message);
         } else if (message?.type === 'STATE') {
            latest = raw.toString();
            send(cockpit, latest);
         } else if (message?.type === 'ACK') send(cockpit, message);
      });
      ws.on('close', () => {
         clearInterval(heartbeat);
         if (display === ws) {
            display = undefined;
            latest = undefined;
         }
         if (cockpit === ws) cockpit = undefined;
         peers();
      });
      peers();
      if (role === 'cockpit' && latest) send(ws, latest);
   });
});
server.listen(port, '0.0.0.0', () => {
   console.log(`Local display: http://localhost:${port}/?mode=display`);
   for (const address of addresses)
      console.log(`Wi-Fi display: http://${address}:${port}/?mode=display`);
});
function shutdown() {
   for (const client of wss.clients) client.terminate();
   wss.close();
   server.close();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
