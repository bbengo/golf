import type { Bounds } from './camera';
import { worldHash } from '../course/procedural-world';
/** World-cell decoration; identity and variation never depend on atlas dimensions. */
export function* worldDecoration(bounds: Bounds, spacing: number, salt: number, padding = 0) {
   if (!Number.isFinite(spacing) || spacing <= 0 || !Object.values(bounds).every(Number.isFinite))
      throw Error('Invalid decoration bounds');
   for (
      let gy = Math.floor((bounds.minY - padding) / spacing);
      gy <= Math.floor((bounds.maxY + padding) / spacing);
      gy++
   )
      for (
         let gx = Math.floor((bounds.minX - padding) / spacing);
         gx <= Math.floor((bounds.maxX + padding) / spacing);
         gx++
      ) {
         const a = worldHash(gx + salt, gy - salt),
            b = worldHash(gx - salt - 17, gy + salt + 39),
            c = worldHash(gx + salt + 73, gy - salt - 21);
         yield { id: `${gx}:${gy}`, x: (gx + a) * spacing, y: (gy + b) * spacing, a, b, c };
      }
}
