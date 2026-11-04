
// ---------------- action flow (v10.7 rule 6 + skill "Character continuity") ----------------
// Every change of pose is BLENDED: numbers and arm offsets interpolate over `blend` frames, discrete fields (expr, mode,
// props) switch at the half-way point, so an action always ends in the pose the next one starts from.
import { ACT } from "./acting";
import { desertBossCar, desertDozer, desertWagon, desertWagonSeats, desertBoat, desertWagonCam } from "./sets/desert";
import { worldmapShip, worldmapBoss, worldmapTrack, SHIP_U } from "./sets/worldmap";
const HANG = (side: number): [[number, number], [number, number]] => [[side * 30, 45], [side * 33, 96]];
const mixO = (a: P, b: P, k: number): P => {
  if (k >= 1) return { ...b };
  if (k <= 0) return { ...a };
  const o: Record<string, unknown> = { ...b };
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const va = (a as Record<string, unknown>)[key], vb = (b as Record<string, unknown>)[key];
    const arm = key === "armR" || key === "armL";
    const side = key === "armR" ? 1 : -1;
    const A = arm ? (va ?? HANG(side)) : va, B = arm ? (vb ?? HANG(side)) : vb;
    if (arm && Array.isArray(A) && Array.isArray(B)) {
      const aa = A as number[][], bb = B as number[][];
      o[key] = [[lerp(aa[0][0], bb[0][0], k), lerp(aa[0][1], bb[0][1], k)], [lerp(aa[1][0], bb[1][0], k), lerp(aa[1][1], bb[1][1], k)]];
      if (k < 0.5 && va === undefined) o[key] = o[key]; // stays a smooth path from the hanging arm
    } else if (typeof va === "number" && typeof vb === "number" && key !== "facing") o[key] = lerp(va, vb, k);
    else if (typeof va === "number" && vb === undefined && /^(shake|feetUp|squash|sweat|tilt|headTilt|headBack|lift|monoclePop|wet|look|propK|propRAng|propLAng|hatLift)$/.test(key)) o[key] = lerp(va, 0, k);
    else if (va === undefined && typeof vb === "number" && /^(shake|feetUp|squash|sweat|tilt|headTilt|headBack|lift|monoclePop|wet|look|propK|propRAng|propLAng|hatLift)$/.test(key)) o[key] = lerp(0, vb, k);
    else o[key] = k < 0.5 ? va : vb;
  }
  return o as P;
};
/** a pose timeline: beats [frame, pose]; each beat blends in over `blend` frames from the previous one */
type Beat = [number, P] | [number, P, number];
const flow = (f: number, beats: Beat[], blend = 8): FigOpts => {
  let i = 0;
  for (let j = 0; j < beats.length; j++) if (f >= beats[j][0]) i = j;
  if (i === 0 || f < beats[0][0]) return pose(null, beats[0][1]);
  const bl = beats[i][2] ?? blend;
  return pose(null, mixO(beats[i - 1][1], beats[i][1], sm(f, beats[i][0], beats[i][0] + bl)));
};
/** walking speed helper: stride card moves ~0.52 m per phase unit for the boss */
const walkPh = (dist: number, k = 0.52) => ((dist / k) % 1 + 1) % 1;
/** position along a polyline by fraction u (0..1) */
const polyAt = (pts: V3[], u: number): { p: V3; d: [number, number] } => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const s = clamp01(u) * L[L.length - 1];
  for (let i = 1; i < pts.length; i++) if (s <= L[i] || i === pts.length - 1) { const k = clamp01((s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1])); return { p: lerp3(pts[i - 1], pts[i], k), d: [pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]] }; }
  return { p: pts[0], d: [0, 1] };
};
const polyLen = (pts: V3[]) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]); return L; };
/** a walk along a polyline between frames a and b (eased start/stop), returning position, screen facing, walk phase */
const walkPath = (id: number, s: SetDef, pts: V3[], f: number, a: number, b: number) => {
  const u = sm(f, a, b), w = polyAt(pts, u), dist = u * polyLen(pts), moving = f > a && f < b;
  return { p: w.p, facing: screenSide(id, s, f, w.d[0], w.d[1]), phase: walkPh(dist), moving };
};
void desertWagon; void desertBoat; void worldmapShip; void worldmapBoss; void worldmapTrack; void SHIP_U; void desertDozer; void desertWagonSeats; void desertBossCar; void ACT;
