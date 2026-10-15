/** Linear zero-contour clipping for a sampled shoreline. Clockwise world winding. */
export type ShoreVertex = { x: number; y: number; value: number };
export function wetCell(corners: ShoreVertex[]): ShoreVertex[][] {
   if (corners.length !== 4) throw Error('A shoreline cell needs four corners');
   if (corners.every((p) => p.value < 0)) return [corners];
   if (corners.every((p) => p.value >= 0)) return [];
   const clip = (triangle: ShoreVertex[]) => {
      const out: ShoreVertex[] = [];
      triangle.forEach((b, i) => {
         const a = triangle[(i + 2) % 3],
            ai = a.value < 0,
            bi = b.value < 0;
         if (ai !== bi) {
            const t = a.value / (a.value - b.value);
            out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, value: 0 });
         }
         if (bi) out.push(b);
      });
      return out;
   };
   return [
      clip([corners[0], corners[1], corners[2]]),
      clip([corners[0], corners[2], corners[3]]),
   ].filter((p) => p.length >= 3);
}
