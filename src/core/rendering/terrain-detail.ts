import { terrainTone } from './terrain-material'; /** Cosmetic material variation sampled in world coordinates, rasterized to atlas pixels. */
export function terrainVariation(
   width: number,
   height: number,
   origin: { minX: number; maxY: number; scale: number },
) {
   const tile = document.createElement('canvas');
   tile.width = Math.ceil(width / 3);
   tile.height = Math.ceil(height / 3);
   const ctx = tile.getContext('2d')!;
   const pixels = ctx.createImageData(tile.width, tile.height);
   for (let y = 0; y < tile.height; y++)
      for (let x = 0; x < tile.width; x++) {
         const wx = origin.minX + (x * 3) / origin.scale,
            wy = origin.maxY - (y * 3) / origin.scale;
         pixels.data.set(terrainTone(wx, wy), (y * tile.width + x) * 4);
      }
   ctx.putImageData(pixels, 0, 0);
   return tile;
}

/** Small procedural canopy stamps keep woodland build cost independent of leaf count. */
export function canopyStamp(variant: number, sun = { x: -0.45, y: 0.8 }) {
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
   const light = ctx.createRadialGradient(64 + sun.x * 24, 64 - sun.y * 24, 3, 64, 64, 62);
   light.addColorStop(0, variant % 3 ? '#8a9b66' : '#a3a071');
   light.addColorStop(0.55, variant % 3 ? '#4c6843' : '#67774b');
   light.addColorStop(1, '#233d2c');
   ctx.fillStyle = light;
   ctx.fill();
   ctx.clip();
   // Connected boughs and overlapping leaf masses give the crown structure before fine texture.
   const boughs = 7 + (variant % 4);
   for (let i = 0; i < boughs; i++) {
      const a = (i * Math.PI * 2) / boughs + phase,
         r = 28 + random() * 16;
      const x = 64 + Math.cos(a) * r,
         y = 64 + Math.sin(a) * r;
      ctx.strokeStyle = '#33412cc0';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(64, 68);
      ctx.quadraticCurveTo(
         64 + Math.cos(a - 0.2) * r * 0.45,
         64 + Math.sin(a - 0.2) * r * 0.45,
         x,
         y,
      );
      ctx.stroke();
      const radius = 17 + random() * 10;
      const lobe = ctx.createRadialGradient(
         x + sun.x * radius * 0.4,
         y - sun.y * radius * 0.4,
         1,
         x,
         y,
         radius,
      );
      lobe.addColorStop(0, variant % 3 ? '#91a569' : '#acac77');
      lobe.addColorStop(0.65, '#526f43');
      lobe.addColorStop(1, '#294c36');
      ctx.fillStyle = lobe;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.82, a, 0, Math.PI * 2);
      ctx.fill();
   }
   for (let i = 0; i < 160; i++) {
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
