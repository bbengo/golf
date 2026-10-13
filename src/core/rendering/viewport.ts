/** Canvas allocation is independent of world extent and physics. */
export function viewportResolution(
   width: number,
   height: number,
   deviceRatio: number,
   quality: 'balanced' | 'economy' | 'crisp',
) {
   width = Math.max(1, Number.isFinite(width) ? width : 1);
   height = Math.max(1, Number.isFinite(height) ? height : 1);
   const cap = quality === 'economy' ? 1 : quality === 'crisp' ? 3 : 2;
   const requested = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1;
   const ratio = Math.min(cap, requested, Math.sqrt(16000000 / (width * height)));
   return {
      width: Math.max(1, Math.floor(width * ratio)),
      height: Math.max(1, Math.floor(height * ratio)),
      ratio,
   };
}
export class ViewportSurface {
   constructor(private canvas: HTMLCanvasElement) {}
   prepare(quality: 'balanced' | 'economy' | 'crisp') {
      const rect = this.canvas.getBoundingClientRect();
      const size = viewportResolution(rect.width, rect.height, devicePixelRatio, quality);
      if (this.canvas.width !== size.width) this.canvas.width = size.width;
      if (this.canvas.height !== size.height) this.canvas.height = size.height;
      return { rect, dpr: size.ratio };
   }
}
