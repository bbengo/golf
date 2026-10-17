const hash = (x: number, y: number) => {
   let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 731;
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
/** Shared world-space material variation; cosmetic only, never terrain displacement. */
export function terrainTone(x: number, y: number): number[] {
   const n =
      noise(x / 128, y / 128) * 0.48 + noise(x / 35, y / 35) * 0.3 + noise(x / 9, y / 9) * 0.22;
   return n > 0.5
      ? [211, 202, 132, Math.round((n - 0.5) * 110)]
      : [13, 35, 27, Math.round((0.5 - n) * 145)];
}
/** Source-over the same byte-alpha overlay used by the detailed Canvas atlas. */
export function terrainColour(base: number[], x: number, y: number): number[] {
   const tone = terrainTone(x, y),
      alpha = tone[3] / 255;
   return base.map((value, i) => Math.round(value * (1 - alpha) + tone[i] * alpha));
}
