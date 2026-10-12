/** Seeded material variation. All inputs and output are atlas pixels, never physics. */
export function terrainVariation(width: number, height: number) {
   const tile = document.createElement('canvas');
   tile.width = Math.ceil(width / 3);
   tile.height = Math.ceil(height / 3);
   const ctx = tile.getContext('2d')!;
   const pixels = ctx.createImageData(tile.width, tile.height);
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
   for (let y = 0; y < tile.height; y++)
      for (let x = 0; x < tile.width; x++) {
         const n =
            noise(x / 85, y / 85) * 0.48 + noise(x / 23, y / 23) * 0.3 + noise(x / 6, y / 6) * 0.22;
         const bright = n > 0.5;
         pixels.data.set(
            bright
               ? [211, 202, 132, Math.round((n - 0.5) * 110)]
               : [13, 35, 27, Math.round((0.5 - n) * 145)],
            (y * tile.width + x) * 4,
         );
      }
   ctx.putImageData(pixels, 0, 0);
   return tile;
}

/** Small procedural canopy stamps keep woodland build cost independent of leaf count. */
export function canopyStamp(variant: number) {
   const canvas = document.createElement('canvas');
   canvas.width = canvas.height = 128;
   const ctx = canvas.getContext('2d')!;
   let seed = variant * 977 + 41;
   const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
   };
   const phase = random() * Math.PI * 2;
   ctx.beginPath();
   for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2,
         r = 56 * (0.92 + 0.055 * Math.sin(a * 7 + phase) + 0.03 * Math.sin(a * 11));
      const x = 64 + Math.cos(a) * r,
         y = 64 + Math.sin(a) * r;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
   }
   ctx.closePath();
   const light = ctx.createRadialGradient(44, 40, 3, 64, 64, 62);
   light.addColorStop(0, variant % 3 ? '#8a9b66' : '#a3a071');
   light.addColorStop(0.55, variant % 3 ? '#4c6843' : '#67774b');
   light.addColorStop(1, '#233d2c');
   ctx.fillStyle = light;
   ctx.fill();
   ctx.clip();
   for (let i = 0; i < 260; i++) {
      const a = random() * Math.PI * 2,
         r = Math.sqrt(random()) * 58;
      const x = 64 + Math.cos(a) * r,
         y = 64 + Math.sin(a) * r;
      ctx.fillStyle = i % 3 === 0 ? '#d3d1a447' : i % 3 === 1 ? '#10271c60' : '#91a36a55';
      ctx.beginPath();
      ctx.ellipse(x, y, 1.5 + random() * 4, 1 + random() * 2, -0.5, 0, Math.PI * 2);
      ctx.fill();
   }
   return canvas;
}
