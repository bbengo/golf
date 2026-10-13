import { DAYLIGHT, type Daylight } from './daylight';

const hash = (x: number, y: number) => {
   let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 419;
   n = Math.imul(n ^ (n >>> 13), 1274126177);
   return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
const noise = (x: number, y: number) => {
   const ix = Math.floor(x),
      iy = Math.floor(y);
   const fx = x - ix,
      fy = y - iy;
   const u = fx * fx * (3 - 2 * fx),
      v = fy * fy * (3 - 2 * fy);
   const a = hash(ix, iy),
      b = hash(ix + 1, iy),
      c = hash(ix, iy + 1),
      d = hash(ix + 1, iy + 1);
   return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

/** Artistic sky reflection and bank absorption, shared by both cached scenery layers.
 * Shore distance is a visual approximation in metres, not bathymetry or physics. */
export function waterColour(x: number, y: number, shore: number, daylight: Daylight): number[] {
   const sun = DAYLIGHT[daylight];
   const warp = noise(x / 73, y / 91) * 25;
   const sky = noise((x + warp) / 155, y / 110);
   // Sparse, faint reflection accents leave most of the water clear.
   const cloud = Math.pow(Math.max(0, (sky - 0.76) / 0.24), 2);
   const ripple = Math.sin(y * 0.48 + noise(x / 18, y / 25) * 8) * 0.65;
   const glint = Math.pow(noise((x * sun.x + y * sun.y) / 95, (y * sun.x - x * sun.y) / 12), 7) * 4;
   const deep =
      daylight === 'evening'
         ? [65, 105, 112]
         : daylight === 'morning'
           ? [66, 119, 126]
           : [57, 111, 120];
   const reflection = daylight === 'evening' ? [173, 157, 145] : [156, 188, 201];
   const shallow = [82, 130, 118];
   const depth = 1 - Math.exp(-Math.max(0, shore) / 7);
   return deep.map((value, i) => {
      const reflected = value + (reflection[i] - value) * cloud * 0.1;
      return Math.round(shallow[i] + (reflected - shallow[i]) * depth + ripple + glint);
   });
}
