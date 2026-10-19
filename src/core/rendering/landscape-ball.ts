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
