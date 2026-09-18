export const CLUBS = ['D', '3W', '4I', '6I', '8I', 'PW', 'SW', 'CHIP', 'PUTT'] as const;
export type Club = (typeof CLUBS)[number];
export type Point = { x: number; y: number; z?: number };
export type Intent = { club: Club; effort: number; shape: number; height: number };
export type Setup = {
   tee: 'red' | 'white' | 'blue';
   pin: 'easy' | 'moderate' | 'challenging';
   wind: 'calm' | 'light' | 'moderate' | 'strong';
   moisture: 'dry' | 'moderate' | 'wet';
   towardDeg: number;
};
export type Command = { type: 'COMMAND'; id: string } & (
   | { action: 'INTENT'; intent: Intent }
   | { action: 'MOVE'; target: 'aim' | 'probe'; dx: number; dy: number }
   | { action: 'PLAY'; shot: number; intent: Intent }
   | { action: 'NEXT' | 'MULLIGAN' | 'RESET' | 'SKIP' }
   | { action: 'VIEW'; view: 'hole' | 'ball' | 'green' }
   | { action: 'SETUP'; setup: Setup }
   | { action: 'RENDERER'; renderer: 'procedural' | 'photo' }
);
export type Snapshot = {
   type: 'STATE';
   revision: number;
   phase: 'plan' | 'animating' | 'resolved';
   canMulligan: boolean;
   cameraAngle: number;
   shot: number;
   intent: Intent;
   ball: Point;
   aim: Point;
   probe: Point;
   setup: Setup;
   renderer: 'procedural' | 'photo';
   engine: string;
   wind: { direction: string; strength: string; rotation: number; fraction: number };
   terrain: { surface: string; z: number; gradePercent: number; downhillLabel: string };
   lie: string;
   distance: number;
   result: null | { status: string; carry: number; total: number; surface: string };
};
export type Peers = { type: 'PEERS'; display: boolean; cockpit: boolean };
export type Reply = { type: 'ACK'; id: string; ok: boolean; error?: string };
export type Message = Snapshot | Peers | Reply | Command;
const record = (v: unknown): v is Record<string, unknown> =>
   !!v && typeof v === 'object' && !Array.isArray(v);
const range = (v: unknown, low: number, high: number): v is number =>
   typeof v === 'number' && Number.isFinite(v) && v >= low && v <= high;
export function validIntent(v: unknown): v is Intent {
   return (
      record(v) &&
      Object.keys(v).every((key) => ['club', 'effort', 'shape', 'height'].includes(key)) &&
      CLUBS.includes(v.club as Club) &&
      range(v.effort, 0.15, 1.1) &&
      range(v.shape, -1, 1) &&
      range(v.height, -1, 1)
   );
}
export function validSetup(v: unknown): v is Setup {
   return (
      record(v) &&
      Object.keys(v).every((key) =>
         ['tee', 'pin', 'wind', 'moisture', 'towardDeg'].includes(key),
      ) &&
      ['red', 'white', 'blue'].includes(v.tee as string) &&
      ['easy', 'moderate', 'challenging'].includes(v.pin as string) &&
      ['calm', 'light', 'moderate', 'strong'].includes(v.wind as string) &&
      ['dry', 'moderate', 'wet'].includes(v.moisture as string) &&
      range(v.towardDeg, 0, 359)
   );
}
export function validCommand(v: unknown): v is Command {
   if (
      !record(v) ||
      v.type !== 'COMMAND' ||
      typeof v.id !== 'string' ||
      !/^[\w-]{1,80}$/.test(v.id)
   )
      return false;
   switch (v.action) {
      case 'INTENT':
         return validIntent(v.intent);
      case 'PLAY':
         return validIntent(v.intent) && Number.isInteger(v.shot) && range(v.shot, 1, 100000);
      case 'MOVE':
         return (
            ['aim', 'probe'].includes(v.target as string) &&
            range(v.dx, -100, 100) &&
            range(v.dy, -100, 100)
         );
      case 'SETUP':
         return validSetup(v.setup);
      case 'VIEW':
         return ['hole', 'ball', 'green'].includes(v.view as string);
      case 'RENDERER':
         return ['procedural', 'photo'].includes(v.renderer as string);
      case 'NEXT':
      case 'MULLIGAN':
      case 'RESET':
      case 'SKIP':
         return true;
      default:
         return false;
   }
}
