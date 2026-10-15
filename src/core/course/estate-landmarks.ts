import { Course } from './course.js';
import type { CockpitSession } from '../session/cockpit-session';
import type { Point } from '../contracts/cockpit';

export type Structure = {
   id: string;
   kind: 'structure';
   part: 'roof' | 'post' | 'cabin';
   minX: number;
   maxX: number;
   minY: number;
   maxY: number;
   deckZ: number;
   thickness: number;
   place: string;
};
export type EstatePlace = { id: string; name: string; x: number; y: number };
const rectangle = (x: number, y: number, w: number, h: number): Point[] => [
   { x: x - w / 2, y: y - h / 2 },
   { x: x + w / 2, y: y - h / 2 },
   { x: x + w / 2, y: y + h / 2 },
   { x: x - w / 2, y: y + h / 2 },
];
/** Saved explicit geometry, never generated from the current viewport. */
export function addEstateLandmarks(c: CockpitSession['course']) {
   const places: EstatePlace[] = [];
   const structures: Structure[] = [];
   const route = (a: Point, b: Point, width: number) => {
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const nx = ((-(b.y - a.y) / length) * width) / 2,
         ny = (((b.x - a.x) / length) * width) / 2;
      return [
         { x: a.x + nx, y: a.y + ny },
         { x: b.x + nx, y: b.y + ny },
         { x: b.x - nx, y: b.y - ny },
         { x: a.x - nx, y: a.y - ny },
      ];
   };
   const part = (
      id: string,
      place: string,
      kind: Structure['part'],
      x: number,
      y: number,
      w: number,
      h: number,
      bottom: number,
      top: number,
   ) => {
      structures.push({
         id,
         kind: 'structure',
         part: kind,
         place,
         minX: x - w / 2,
         maxX: x + w / 2,
         minY: y - h / 2,
         maxY: y + h / 2,
         deckZ: top,
         thickness: top - bottom,
      });
   };
   const candidates = [
      { id: 'welcome', name: 'Purity welcome court', anchor: { x: -145, y: -65 }, x: -179, y: -86 },
      { id: 'rest', name: 'Woodland pavilion', anchor: { x: -40, y: 602 }, x: -65, y: 640 },
      { id: 'camp', name: 'Creekside cabins', anchor: { x: 410, y: 320 }, x: 447, y: 320 },
   ];
   for (const site of candidates) {
      const samples = [site, ...rectangle(site.x, site.y, 30, 26)];
      for (let i = 0; i <= 20; i++)
         samples.push({
            ...site,
            x: site.anchor.x + ((site.x - site.anchor.x) * i) / 20,
            y: site.anchor.y + ((site.y - site.anchor.y) * i) / 20,
         });
      if (samples.some((p) => Course.surfaceAt(c, p).type === 'water')) continue;
      const heights = samples.slice(0, 5).map((p) => Course.heightAt(c, p));
      if (Math.max(...heights) - Math.min(...heights) > 5) continue;
      places.push({ id: site.id, name: site.name, x: site.x, y: site.y });
      c.surfaces.push({
         id: `${site.id}-approach`,
         type: 'path',
         polygon: route(site.anchor, site, 3.2),
      });
      c.surfaces.push({
         id: `${site.id}-court`,
         type: 'path',
         polygon: rectangle(site.x, site.y, 30, 26),
      });
      if (site.id === 'camp') {
         for (const [i, dx, dy] of [
            [0, -8, -5],
            [1, 7, -5],
            [2, 0, 7],
         ]) {
            const x = site.x + dx,
               y = site.y + dy;
            const zs = rectangle(x, y, 7, 6).map((p) => Course.heightAt(c, p));
            part(
               `${site.id}-cabin-${i}`,
               site.id,
               'cabin',
               x,
               y,
               7,
               6,
               Math.min(...zs) - 0.2,
               Math.max(...zs) + 3,
            );
         }
      } else {
         const top = Math.max(...heights) + 3.6;
         part(`${site.id}-roof`, site.id, 'roof', site.x, site.y, 16, 10, top - 0.3, top);
         for (const [i, p] of rectangle(site.x, site.y, 14, 8).entries())
            part(
               `${site.id}-post-${i}`,
               site.id,
               'post',
               p.x,
               p.y,
               0.5,
               0.5,
               Course.heightAt(c, p) - 0.2,
               top - 0.3,
            );
      }
   }
   c.objects = c.objects.filter(
      (o: { kind: string; x: number; y: number; canopyRadius: number }) =>
         o.kind !== 'tree' ||
         !places.some((p) => Math.hypot(o.x - p.x, o.y - p.y) < 24 + o.canopyRadius),
   );
   c.objects.push(...structures);
   c.places = places;
}
