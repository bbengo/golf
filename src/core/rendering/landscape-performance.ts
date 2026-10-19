/** Bounded CPU submission diagnostics. These are NOT GPU timings or FPS. */
export class LandscapePerformance {
   private frames = new Float64Array(120);
   private count = 0;
   private cursor = 0;
   private builds = { detail: 0, backdrop: 0 };
   private cancelled = 0;
   recordDraw(milliseconds: number) {
      if (!Number.isFinite(milliseconds) || milliseconds < 0) return;
      this.frames[this.cursor] = milliseconds;
      this.cursor = (this.cursor + 1) % this.frames.length;
      this.count = Math.min(this.frames.length, this.count + 1);
   }
   recordBuild(kind: 'detail' | 'backdrop', milliseconds: number) {
      if (Number.isFinite(milliseconds) && milliseconds >= 0) this.builds[kind] = milliseconds;
   }
   cancelBuild() {
      this.cancelled++;
   }
   snapshot() {
      const samples = Array.from(this.frames.slice(0, this.count)).sort((a, b) => a - b);
      return {
         samples: this.count,
         cpuDrawMedianMs: samples.length ? samples[Math.floor((samples.length - 1) * 0.5)] : 0,
         cpuDrawP95Ms: samples.length ? samples[Math.ceil(samples.length * 0.95) - 1] : 0,
         lastDetailBuildMs: this.builds.detail,
         lastBackdropBuildMs: this.builds.backdrop,
         cancelledDetailBuilds: this.cancelled,
      };
   }
}
