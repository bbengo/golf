/** Broad ecological patches, independent of camera, tile order and render quality. */
export const ECOLOGY_VERSION = 'purity-ecology/1';
const hash = (x: number, y: number) => {
   let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 19427;
   n = Math.imul(n ^ (n >>> 13), 1274126177);
   return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
const smooth = (x: number) => {
   const t = Math.max(0, Math.min(1, x));
   return t * t * (3 - 2 * t);
};
function noise(x: number, y: number) {
   const ix = Math.floor(x),
      iy = Math.floor(y),
      u = smooth(x - ix),
      v = smooth(y - iy);
   const a = hash(ix, iy),
      b = hash(ix + 1, iy),
      c = hash(ix, iy + 1),
      d = hash(ix + 1, iy + 1);
   return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function landscapeRegion(x: number, y: number) {
   const warp = (noise(x / 430 + 12, y / 430 - 8) - 0.5) * 110;
   const stand = noise((x + warp) / 245, (y - warp) / 245);
   const clearing = smooth((noise(x / 105 - 31, y / 105 + 17) - 0.57) / 0.22);
   const woodland = smooth((stand - 0.37) / 0.26) * (1 - clearing);
   const dry = smooth((noise(x / 380 + 49, y / 380 + 3) - 0.51) / 0.26) * (1 - woodland * 0.8);
   const density = Math.max(0, woodland * 0.92 - clearing * 0.4);
   const meadow = [112, 139, 69],
      forest = [57, 92, 59],
      heath = [151, 145, 93];
   const colour = meadow.map((m, i) => m + (forest[i] - m) * woodland + (heath[i] - m) * dry);
   return { woodland, clearing, dry, density, colour };
}
export function standAccepts(x: number, y: number, choice: number) {
   return choice < landscapeRegion(x, y).density;
}
