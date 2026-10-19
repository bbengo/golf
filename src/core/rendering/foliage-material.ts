/** Continuous crown variation shared by near and distant geometry.
 * Smooth broad patches avoid exposing individual triangles as random colour facets. */
export function foliageTone(
   position: readonly number[],
   centre: readonly number[],
   radius: number,
   verticalRadius: number,
) {
   const x = (position[0] - centre[0]) / Math.max(0.01, radius);
   const y = (position[1] - centre[1]) / Math.max(0.01, radius);
   const z = (position[2] - centre[2]) / Math.max(0.01, verticalRadius);
   const phase = Math.sin(centre[0] * 0.17 + centre[1] * 0.13) * Math.PI;
   const patches = Math.sin(x * 3 + phase) * Math.cos(y * 3 - phase) * Math.cos(z * 2);
   return 0.91 + Math.max(-1, Math.min(1, z)) * 0.13 + patches * 0.045;
}
