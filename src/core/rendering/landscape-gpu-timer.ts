type TimerExtension = {
   TIME_ELAPSED_EXT: number;
   GPU_DISJOINT_EXT: number;
   QUERY_RESULT_AVAILABLE_EXT: number;
   QUERY_RESULT_EXT: number;
   createQueryEXT(): object | null;
   beginQueryEXT(target: number, query: object): void;
   endQueryEXT(target: number): void;
   deleteQueryEXT(query: object): void;
   getQueryObjectEXT(query: object, parameter: number): number | boolean;
};
/** One asynchronous query at a time. Never waits, flushes or forces GPU completion. */
export class LandscapeGpuTimer {
   private extension: TimerExtension | null;
   private query: object | null = null;
   private active = false;
   private disposed = false;
   readonly supported: boolean;
   constructor(
      private gl: WebGLRenderingContext,
      private record: (ms: number) => void,
   ) {
      this.extension = gl.getExtension('EXT_disjoint_timer_query') as TimerExtension | null;
      this.supported = !!this.extension;
   }
   begin() {
      const ext = this.extension;
      if (!ext || this.query || this.disposed || this.gl.isContextLost()) return;
      if (this.gl.getParameter(ext.GPU_DISJOINT_EXT)) return;
      this.query = ext.createQueryEXT();
      if (!this.query) return;
      ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, this.query);
      this.active = true;
   }
   end() {
      if (!this.active || !this.extension) return;
      this.extension.endQueryEXT(this.extension.TIME_ELAPSED_EXT);
      this.active = false;
   }
   poll() {
      const ext = this.extension;
      if (!ext || !this.query || this.active || this.disposed) return;
      if (this.gl.isContextLost()) {
         this.query = null;
         return;
      }
      const disjoint = this.gl.getParameter(ext.GPU_DISJOINT_EXT);
      if (!disjoint && !ext.getQueryObjectEXT(this.query, ext.QUERY_RESULT_AVAILABLE_EXT)) return;
      if (!disjoint) {
         const ns = Number(ext.getQueryObjectEXT(this.query, ext.QUERY_RESULT_EXT));
         if (Number.isFinite(ns) && ns >= 0) this.record(ns / 1e6);
      }
      ext.deleteQueryEXT(this.query);
      this.query = null;
   }
   dispose() {
      if (this.disposed) return;
      if (!this.gl.isContextLost()) {
         this.end();
         if (this.query) this.extension?.deleteQueryEXT(this.query);
      }
      this.query = null;
      this.active = false;
      this.disposed = true;
   }
}
