/** Bounded edge coverage for distant materials. Coordinates are in texture pixels.
 * Only boundary pixels receive four subpixel samples; interiors keep their exact colour.
 * Presentation only: never alters the physical surface queried by the simulation. */
export async function landscapeMaterial(
   size: number,
   sample: (x: number, y: number) => { type: string; colour: number[] },
   cancelled = () => false,
) {
   if (!Number.isInteger(size) || size < 2 || size > 512) throw Error('Invalid material size');
   const pixels = new Uint8Array(size * size * 4);
   const labels: string[] = new Array(size * size);
   const checkpoint = async (row: number) => {
      if (cancelled()) throw Error('Preview closed');
      if (row % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
   };
   for (let y = 0; y < size; y++) {
      await checkpoint(y);
      for (let x = 0; x < size; x++) {
         const value = sample(x + 0.5, y + 0.5);
         const index = y * size + x;
         labels[index] = value.type;
         pixels.set([...value.colour, 255], index * 4);
      }
   }
   let refinedPixels = 0;
   for (let y = 0; y < size; y++) {
      await checkpoint(y);
      for (let x = 0; x < size; x++) {
         const index = y * size + x;
         let boundary = false;
         for (let dy = -1; dy <= 1 && !boundary; dy++)
            for (let dx = -1; dx <= 1; dx++) {
               const nx = x + dx,
                  ny = y + dy;
               if (
                  nx >= 0 &&
                  nx < size &&
                  ny >= 0 &&
                  ny < size &&
                  labels[ny * size + nx] !== labels[index]
               )
                  boundary = true;
            }
         if (!boundary) continue;
         const colour = [0, 0, 0];
         for (const dy of [0.25, 0.75])
            for (const dx of [0.25, 0.75]) {
               const value = sample(x + dx, y + dy).colour;
               for (let channel = 0; channel < 3; channel++) colour[channel] += value[channel] / 4;
            }
         pixels.set(colour.map(Math.round), index * 4);
         refinedPixels++;
      }
   }
   return { pixels, refinedPixels };
}
