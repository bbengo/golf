/** Camera-space sun for a spherical ball impostor; independent of simulation. */
export function ballLight(x: number, y: number, z: number, yaw: number, pitch: number) {
   const co = Math.cos(yaw),
      si = Math.sin(yaw);
   const across = co * x - si * y,
      along = si * x + co * y;
   const up = along * Math.sin(pitch) + z * Math.cos(pitch);
   const toward = -along * Math.cos(pitch) + z * Math.sin(pitch);
   const length = Math.hypot(across, up, toward) || 1;
   return [across / length, up / length, toward / length];
}
/** A readability aid, deliberately larger than a regulation ball at estate scale. */
export function ballDiameter(span: number, enhanced: boolean) {
   return Math.max(
      enhanced ? 11 : 7,
      Math.min(24, (enhanced ? 11 : 7) * Math.sqrt(580 / Math.max(1, span))),
   );
}

/** Small terrain-conforming contact shadow, fading as the ball rises.
 * Visual aid only; no collision/ray result is fed back into the session. */
export function ballShadow(
   ball: { x: number; y: number; z: number },
   radius: number,
   sun: { x: number; y: number; z: number },
   heightAt: (x: number, y: number) => number,
   waterAt: (x: number, y: number) => boolean,
) {
   const altitude = Math.max(0, ball.z - heightAt(ball.x, ball.y));
   if (altitude >= 40 || sun.z <= 0) return new Float32Array();
   // Trace against the height field, bounded to the nearby contact-shadow range.
   const dx = -sun.x / sun.z,
      dy = -sun.y / sun.z;
   let low = 0,
      high = 80;
   const gap = (t: number) => ball.z - t - heightAt(ball.x + dx * t, ball.y + dy * t);
   if (gap(high) > 0) return new Float32Array();
   for (let i = 0; i < 12; i++) {
      const t = (low + high) / 2;
      if (gap(t) > 0) low = t;
      else high = t;
   }
   const x = ball.x + dx * high,
      y = ball.y + dy * high;
   if (waterAt(x, y)) return new Float32Array();
   const spread = Math.max(0.04, radius) * (1 + altitude * 0.025);
   const alpha = 0.32 * Math.pow(1 - altitude / 40, 2);
   const vertex = (px: number, py: number, opacity: number) => [
      px,
      py,
      heightAt(px, py) + 0.06,
      0,
      0,
      1,
      waterAt(px, py) ? 0 : opacity,
      0,
      0,
   ];
   const centre = vertex(x, y, alpha);
   const ring = Array.from({ length: 24 }, (_, i) => {
      const a = (i * Math.PI) / 12;
      return vertex(x + Math.cos(a) * spread, y + Math.sin(a) * spread, 0);
   });
   const vertices = new Float32Array(24 * 3 * 9);
   for (let i = 0; i < 24; i++)
      vertices.set([...centre, ...ring[i], ...ring[(i + 1) % 24]], i * 27);
   return vertices;
}
