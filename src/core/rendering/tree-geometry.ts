type V = [number, number, number];
/** Shared asymmetric crown envelope. Both LODs stay inside the physical canopy. */
export function crownPoint(latitude: number, angle: number, phase: number): V {
   const c = Math.cos(latitude);
   const lobe =
      0.82 + 0.1 * Math.cos(angle * 3 + phase + latitude) + 0.06 * Math.sin(angle * 5 - phase) * c;
   return [c * Math.cos(angle) * lobe, c * Math.sin(angle) * lobe, Math.sin(latitude)];
}
/** Four tapered, five-sided wood segments: fixed 40 triangles per detailed tree.
 * Ends are buried in ground/foliage; no cap faces or new colliders are needed. */
export function treeWood(
   tree: {
      x: number;
      y: number;
      trunkRadius: number;
      canopyRadius: number;
      canopyBase: number;
      height: number;
   },
   z: number,
   phase: number,
) {
   const triangles: V[][] = [];
   const tube = (a: V, b: V, ra: number, rb: number) => {
      const d = b.map((v, i) => v - a[i]);
      const length = Math.hypot(...d);
      const n = d.map((v) => v / length);
      const reference = Math.abs(n[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
      let u = [
         n[1] * reference[2] - n[2] * reference[1],
         n[2] * reference[0] - n[0] * reference[2],
         n[0] * reference[1] - n[1] * reference[0],
      ];
      const ul = Math.hypot(...u);
      u = u.map((v) => v / ul);
      const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      const ring = (p: V, r: number, i: number): V => {
         const angle = phase + (i * Math.PI * 2) / 5;
         return p.map(
            (value, axis) => value + r * (Math.cos(angle) * u[axis] + Math.sin(angle) * v[axis]),
         ) as V;
      };
      for (let i = 0; i < 5; i++) {
         const p = ring(a, ra, i),
            q = ring(a, ra, (i + 1) % 5),
            r = ring(b, rb, (i + 1) % 5),
            s = ring(b, rb, i);
         triangles.push([p, q, r], [p, r, s]);
      }
   };
   tube(
      [tree.x, tree.y, z],
      [tree.x, tree.y, z + tree.canopyBase + 1],
      tree.trunkRadius,
      tree.trunkRadius * 0.48,
   );
   for (let i = 0; i < 3; i++) {
      const angle = phase + (i * Math.PI * 2) / 3;
      tube(
         [tree.x, tree.y, z + tree.canopyBase * 0.72],
         [
            tree.x + Math.cos(angle) * tree.canopyRadius * 0.42,
            tree.y + Math.sin(angle) * tree.canopyRadius * 0.42,
            z + tree.canopyBase + (tree.height - tree.canopyBase) * 0.28,
         ],
         tree.trunkRadius * 0.42,
         tree.trunkRadius * 0.12,
      );
   }
   return triangles;
}
