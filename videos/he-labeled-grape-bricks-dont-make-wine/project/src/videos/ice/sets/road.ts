// St. Louis, August 1904: the Olympic marathon course on a hot afternoon. One long ochre dirt road (wheel ruts,
// pebbles, footprints, ragged grassy edges) through rolling yellow-green farmland, telegraph poles with sagging wires,
// weathered split-rail fences, haystacks, hedgerows, distant blue hills, a deep blue sky with painted cumulus.
//
// LAYOUT (set-local metres). The runners go toward -z. The road centre line is x = roadX(z) (gentle S-bends, straight
// through the dust zone); ground height y = groundY(x, z) (flat up to z -38, then the road climbs ~6 m to the crest at
// z -112). Road surface x = roadX +-3.1 (dirt), verges to the fences at offset -5.6 (left) / +5.8 (right).
// "offset" below = x - roadX(z) (negative = runner's left / west side when running toward -z... i.e. world -x).
//   1 WELL   z 98..78   round stone well at offset +6.6, z 88 (stone apron r 2.6, gable roof, windlass, bucket, rope),
//                       trough (+8.7), sign "WATER - 1 CUP" (+4.3, z 92.6), bench, milk churns, shade oak.
//   2 DUST   z 75..36   straight; ditch on the right (offset 3.9..5.4, z 38..72, 0.55 m deep), MILE 9 post (-4.0, z 66),
//                       farmer + wheelbarrow (-4.5, z 47), spectators behind the fences, telegraph poles (offset -7.2).
//   3 ORCHARD z 31..1  (left) apple trees behind the fence, fence gap z 15.5..23.5, ladder tree, nap tree, baskets,
//                       fallen + rotten apples, a cow; enclosure fences at z 31 / z 0 / offset -32.
//   4 FARM   z 8..-52  (right) farmhouse (+17, z 3), farm gate z -6.5..-11 (bunting + flag), red barn (+19, z -14) with a
//                       weathervane, doghouse (+10.8, z -13.5), chickens, windmill (+27, z -3), cornfield offset 6.6..31,
//                       z -20.5..-52 with the DOG LANE cut into it from the road at z -27, signpost "COURSE ->".
//   5 HILL   z -40..-125 the road climbs; MILE 19 (-3.9, z -80), spectators + lemonade table + bunting on the left,
//                       an oak on the crest. Light: roadLate.
// CARS (ctl): c.carA 0..1 red officials' car ("JUDGES" pennant), z 112 -> 26, lane offset +1.0 (dust zone).
//             c.carB 0..1 green coach's car, z -46 -> -114, lane offset +0.9, meant to move at runner speed (hill).
//             c.carC 0..1 blue third car, z 140 -> -140, lane -1.2 (hidden unless c.carC is given).
//             c.hornA / c.hornB 0..1 bulb squeeze, c.steerA / c.steerB extra steering, c.carAHide / c.carBHide = 1 hides.
//             Helpers for shot code: roadCar(which, u) (pos, yaw, pitch, dir), roadSeats(which, u) (seat-top marks for
//             cards in mode "sit": driver, front, rear, rearL, rearR), roadRunner(u) (feet of the runner jogging beside car
//             B's front passenger seat, same u), roadTrack(which, u, mode) (camera framings: side / front / rear / low).
// DUST: c.dustA / c.dustB 0..1 painted dust clouds behind each car's rear wheels (world-anchored: they stay where they
//       were kicked up, rise, drift downwind (+x) and swell; trail ~24 m for A, ~10 m for B), c.dustBank 0..1 a thick
//       billowing dust bank around the pack marks dustPack1..4 (z 63..67, just behind car A at u 0.6), c.haze 0..1 (default 1) low dust haze + a
//       heat shimmer above the road.
// OTHER CTL: c.bucket 0..1 (1 = bucket up at the windlass, 0 = down in the well; the crank turns with it),
//       c.dog 0..1 the farm dog runs the dog lane (0 = at home by the doghouse), c.dogHide = 1 hides it,
//       c.cowHide = 1 hides the cow.
// AMBIENT: corn + grass tufts sway (CPU vertex wind, ink-safe), apple crowns sway, crows circle + perch on the wires,
//       windmill rotor turns, weathervane swings, gate bunting + flag flutter, farmhouse chimney smoke, chickens peck,
//       cow grazes + swishes, clouds drift, dust haze drifts, heat shimmer wobbles, car lamp glints.
// KEEP-OUT: ROAD_SOLIDS (buildings, well, trees, poles, fences, corn block, props, hills). CAMERA LANES kept free:
//   both verges (offset -2.5..-5.2 and +2.5..+3.8 / +5.2 outside the ditch zone) at 1-2 m, all air above the road,
//   and the corridor from the dust zone over the left fence into the orchard (offset -4..-11, z 24..36, y > 1.5).
import * as THREE from "three";
import { swayMaterial } from "../sway";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rng, stoneHD, roofHD, beamHD, cloudHD, CLOUD_DAY, CLOUD_GOLD } from "../paint";
import { glow, mist } from "../setkit";
import { cl, TAU, fitText, basket, weaveTex } from "./portkit_common";
import { leafTex, birds, strawTex } from "./innerkit_b";
import { bunting, flutter, cloth, wave } from "./towerkit";
import { twoTone, TONE } from "../shade";
import { NOINK } from "../ink";
import { autocar, type AutoCar } from "./autocar";
import { limo } from "./limo";
import type { SetDef, V3 } from "./types";
export { autocar } from "./autocar";

// ---------------- layout functions (pure, module level) ----------------
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const KZ0 = 275, KS = 25;
const KX = [10, 6, 2, -2, -5, -5.5, -3, -0.4, 0, 0, 0.3, 1.4, 1.2, -0.6, -3.2, -5.2, -6, -5, -2, 2, 6, 10, 14];
const kx = (i: number) => KX[Math.max(0, Math.min(KX.length - 1, i))];
/** road centre line x at z (uniform Catmull-Rom through knots every 25 m) */
export const roadX = (z: number) => {
  const s = (KZ0 - z) / KS, k = Math.floor(s), t = s - k, p0 = kx(k - 1), p1 = kx(k), p2 = kx(k + 1), p3 = kx(k + 2);
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
};
const roadXd = (z: number) => (roadX(z + 0.05) - roadX(z - 0.05)) / 0.1;
/** road surface height (the hill: flat to z -38, crest 6.2 m at z -112, down again beyond) */
export const roadY = (z: number) => z > -38 ? 0 : z > -112 ? 6.2 * sm((-38 - z) / 74) : z > -170 ? 6.2 - 1.2 * sm((-112 - z) / 58) : 5 - 5 * sm((-170 - z) / 90);
const roll = (x: number, z: number) => 3.2 * Math.sin(x * 0.019 + 0.7) * Math.sin(z * 0.016 + 1.9) + 1.6 * Math.sin(x * 0.043 - z * 0.027 + 0.4) + 0.7 * Math.sin(x * 0.09 + z * 0.07);
const DITCH = { z0: 38, z1: 72, off: 4.65, half: 0.78, depth: 0.55 };
const ditchAt = (x: number, z: number) => {
  if (z < DITCH.z0 - 2 || z > DITCH.z1 + 2) return 0;
  const u = (x - roadX(z) - DITCH.off) / DITCH.half; if (Math.abs(u) >= 1) return 0;
  const ends = sm((z - DITCH.z0 + 2) / 3) * sm((DITCH.z1 + 2 - z) / 3);
  return -DITCH.depth * Math.pow(1 - u * u, 1.4) * ends;
};
/** ground height anywhere (terrain): the road profile + rolling fields beyond ~26 m + the ditch */
export const groundY = (x: number, z: number) => {
  const d = Math.abs(x - roadX(z));
  return roadY(z) + sm((d - 26) / 40) * roll(x, z) + ditchAt(x, z) - 0.05 * (1 - sm((d - 3.2) / 0.6));
};
/** a point at a road offset (x - roadX) and z, on the ground (+dy) */
const at = (off: number, z: number, dy = 0): V3 => { const x = roadX(z) + off; return [x, groundY(x, z) + dy, z]; };
/** travel direction (toward -z) at z */
const dirAt = (z: number) => { const d = V(-roadXd(z), 0, -1).normalize(); return d; };

// ---------------- cars ----------------
type Which = "A" | "B" | "C";
const CARP: Record<Which, { z0: number; z1: number; off: number }> = { A: { z0: 112, z1: 26, off: 1.0 }, B: { z0: -46, z1: -114, off: 0.9 }, C: { z0: 140, z1: -140, off: -1.2 } };
/** the car's set-local transform at u: ground point under the car origin, yaw (local +z -> travel), pitch (nose up > 0) */
export const roadCar = (which: Which, u: number) => {
  const P = CARP[which], z = P.z0 + (P.z1 - P.z0) * cl(u), x = roadX(z) + P.off, dir = dirAt(z);
  const yaw = Math.atan2(dir.x, dir.z), slope = (roadY(z - 1) - roadY(z + 1)) / 2; // rise per metre travelled
  return { pos: [x, roadY(z), z] as V3, yaw, pitch: Math.atan(slope), dir: [dir.x, 0, dir.z] as V3, dist: Math.abs(z - P.z0) };
};
const carMatrix = (which: Which, u: number) => {
  const c = roadCar(which, u), e = new THREE.Euler(-c.pitch, c.yaw, 0, "YXZ");
  return new THREE.Matrix4().compose(V(...c.pos), new THREE.Quaternion().setFromEuler(e), V(1, 1, 1));
};
const SEAT_LOCAL = { driver: [-0.3, 1.05, 0.4], front: [0.3, 1.05, 0.4], rear: [0, 1.48, -0.8], rearL: [0.32, 1.48, -0.8], rearR: [-0.32, 1.48, -0.8] } as const;
/** seat-top marks (set-local) of a car at u, for cards in mode "sit" (driver = right-hand drive) */
export const roadSeats = (which: Which, u: number) => {
  const m = carMatrix(which, u), out = {} as Record<keyof typeof SEAT_LOCAL, V3>;
  (Object.keys(SEAT_LOCAL) as (keyof typeof SEAT_LOCAL)[]).forEach((k) => { const v = V(...(SEAT_LOCAL[k] as unknown as V3)).applyMatrix4(m); out[k] = [v.x, v.y, v.z]; });
  return out;
};
/** feet of the runner jogging beside car B's front passenger seat (car's left = world -x when heading -z) */
export const roadRunner = (u: number, gap = 1.6): V3 => {
  const c = roadCar("B", u), d = V(...c.dir), left = V(d.z, 0, -d.x), p = V(...c.pos).addScaledVector(d, 0.4).addScaledVector(left, gap);
  return [p.x, groundY(p.x, p.z), p.z];
};
/** camera framings that follow a car (pass the same u as the ctl). side = from the left verge, a little ahead (a two-shot
 *  of car + roadside runner); front = on the road ahead, looking back; rear = behind, into the dust; low = worm's-eye
 *  from the left verge. */
export const roadTrack = (which: Which, u: number, mode: "side" | "front" | "rear" | "low" = "side"): { pos: V3; look: V3; fov: number } => {
  const c = roadCar(which, u), d = V(...c.dir), left = V(d.z, 0, -d.x), P = V(...c.pos);
  const cam = (ahead: number, off: number, h: number) => { const p = P.clone().addScaledVector(d, ahead); const x = roadX(p.z) + off; return [x, groundY(x, p.z) + h, p.z] as V3; };
  const lk = (ahead: number, lat: number, h: number) => { const p = P.clone().addScaledVector(d, ahead).addScaledVector(left, lat); return [p.x, p.y + h, p.z] as V3; };
  if (mode === "front") return { pos: cam(9, -0.2, 1.75), look: lk(0, 0.2, 1.05), fov: 36 };
  if (mode === "rear") return { pos: cam(-11, -3.0, 2.6), look: lk(1, -0.4, 1.1), fov: 38 };
  if (mode === "low") return { pos: cam(4.2, -3.6, 0.4), look: lk(0, 0.6, 1.45), fov: 40 };
  return { pos: cam(3.6, -4.1, 1.55), look: lk(-0.2, 0.7, 1.15), fov: 38 };
};

// ---------------- prop spots (module level so ROAD_SOLIDS can use them) ----------------
const WELL = at(6.6, 88), WELL_R = 0.95;
const TROUGH = at(8.75, 88.3);
const SIGN_W = at(4.3, 92.6);
const OAK_W = at(13.5, 96);
const BARROW = at(-4.95, 47.6);
const MILE9 = at(-5.2, 66);
type TreeSpot = { off: number; z: number; h: number; seed: number };
const APPLES: TreeSpot[] = [
  { off: -9.6, z: 19.5, h: 4.6, seed: 1 }, { off: -14, z: 11.5, h: 5.0, seed: 2 }, { off: -17.5, z: 25.5, h: 5.2, seed: 3 },
  { off: -21.5, z: 16, h: 4.8, seed: 4 }, { off: -24, z: 6, h: 4.6, seed: 5 }, { off: -10.5, z: 4.2, h: 4.4, seed: 6 },
  { off: -27.5, z: 23, h: 4.9, seed: 7 }, { off: -29, z: 12, h: 4.5, seed: 8 }, { off: -18.5, z: 3, h: 4.7, seed: 9 },
];
const HOUSE = at(17, 3), BARN = at(19, -14), DOGHOUSE = at(10.8, -13.5), WINDMILL = at(27, -3);
const CORN = { off0: 6.6, off1: 31, z0: -20.5, z1: -52 };
const LANE: [number, number][] = [[2.6, -27], [5.8, -27.6], [9.5, -29.6], [15, -32.5], [21, -36], [26.5, -39.3]];
const lanePts = () => LANE.map(([o, z]) => V(...at(o, z)));
/** a point on the dog lane (same curve the set's dog runs on with c.dog = u), feet on the ground */
export const roadDogLane = (() => { let c: THREE.CatmullRomCurve3 | null = null; return (u: number): V3 => { if (!c) c = new THREE.CatmullRomCurve3(lanePts()); const p = c.getPointAt(Math.min(1, Math.max(0, u))); return [p.x, groundY(p.x, p.z), p.z]; }; })();
/** a road-relative point (offset from the centre line, z), feet on the ground */
export const roadAt = (off: number, z: number, dy = 0): V3 => { const x = roadX(z) + off; return [x, groundY(x, z) + dy, z]; };
const COURSE_SIGN = at(4.6, -24.6);
const MILE19 = at(-5.2, -80);
const STAND = at(-8.6, -71);
const OAK_H = at(-14, -118);
const POLES = Array.from({ length: 13 }, (_, i) => 150 - i * 25).map((z) => at(-7.2, z));
type FenceRun = { side: number; off: number; z0: number; z1: number };
const FENCES: FenceRun[] = [
  { side: -1, off: 5.6, z0: 150, z1: 23.5 }, { side: -1, off: 5.6, z0: 15.5, z1: -150 },
  { side: 1, off: 5.8, z0: 150, z1: 98 }, { side: 1, off: 5.8, z0: 78, z1: -6.5 }, { side: 1, off: 5.8, z0: -11, z1: -24.2 }, { side: 1, off: 5.8, z0: -30.4, z1: -150 },
];
const box3 = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): [V3, V3] => [[Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)]];
const around = (p: V3, rx: number, h: number, rz = rx, y0 = 0): [V3, V3] => box3(p[0] - rx, p[1] + y0, p[2] - rz, p[0] + rx, p[1] + h, p[2] + rz);
export const ROAD_SOLIDS: [V3, V3][] = (() => {
  const s: [V3, V3][] = [];
  s.push(around(WELL, 1.0, 2.95), around(TROUGH, 0.4, 0.75, 1.25), around(SIGN_W, 0.7, 2.3, 0.3), around(OAK_W, 0.6, 3.5), around(OAK_W, 3.6, 9, 3.6, 3.2));
  s.push(around(BARROW, 0.5, 1.1, 1.0), around(MILE9, 0.25, 1.4));
  for (const t of APPLES) { const p = at(t.off, t.z); s.push(around(p, 0.35, t.h * 0.5), around(p, t.h * 0.58, t.h * 1.05, t.h * 0.58, t.h * 0.42)); }
  s.push(around(HOUSE, 4.6, 8.8, 4.2), around(BARN, 5.6, 9.6, 5.0), around(DOGHOUSE, 0.7, 1.1, 0.6), around(WINDMILL, 1.6, 11.5));
  { const a = at(CORN.off0, CORN.z0), b = at(CORN.off1, CORN.z1); s.push(box3(a[0], a[1], a[2], b[0], b[1] + 2.7, b[2])); }
  s.push(around(COURSE_SIGN, 0.5, 2.3, 0.5), around(MILE19, 0.25, 1.4), around(STAND, 1.2, 2.6), around(OAK_H, 0.7, 4), around(OAK_H, 4.5, 11, 4.5, 3.5));
  for (const p of POLES) s.push(around(p, 0.25, 7.8), box3(p[0] - 0.2, p[1] + 6.6, p[2] - 1.1, p[0] + 0.2, p[1] + 7.3, p[2] + 1.1));
  for (const f of FENCES) for (let z = f.z0; z > f.z1; z -= 5) { const a = at(f.side * f.off, z), b = at(f.side * f.off, Math.max(f.z1, z - 5)); s.push(box3(a[0] - 0.15, Math.min(a[1], b[1]), a[2], b[0] + 0.15, Math.max(a[1], b[1]) + 1.4, b[2])); }
  s.push(box3(roadX(31) - 5.6, 0, 30.8, roadX(31) - 32, 1.4, 31.2), box3(roadX(0) - 5.6, 0, -0.2, roadX(0) - 32, 1.4, 0.2), box3(roadX(15) - 32.2, 0, 31, roadX(15) - 31.8, 1.4, 0));
  return s;
})();

// ---------------- materials ----------------
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
const col = (c: string) => lam("rdC" + c, () => ({ color: c }));
const cut = (key: string, tex: () => THREE.Texture) => mat("rdCut" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: tex(), alphaTest: 0.5, side: THREE.DoubleSide })));
const tex = (key: string, t: () => THREE.Texture) => lam("rdT" + key, () => ({ map: t() }));
const shiny = (key: string, c: string, sh = 60) => mat("rdSh" + key, () => twoTone(new THREE.MeshPhongMaterial({ color: c, specular: "#ffffff", shininess: sh })));
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
/** draw at (x, y) and its wrapped copies so a tile repeats seamlessly */
const wrap = (S: number, x: number, y: number, rad: number, f: (x: number, y: number) => void, H = S) => {
  for (const dx of [-S, 0, S]) for (const dy of [-H, 0, H]) { const xx = x + dx, yy = y + dy; if (xx > -rad && xx < S + rad && yy > -rad && yy < H + rad) f(xx, yy); }
};
const rodGeo = (a: V3, c: V3, r: number, seg = 6) => {
  const A = V(...a), C = V(...c), geo = new THREE.CylinderGeometry(r, r, A.distanceTo(C), seg);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize())); return geo.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2);
};
/** a rectangular beam between two points (rails, braces), w x h section */
const beamGeo = (a: THREE.Vector3, b: THREE.Vector3, w: number, h: number) => {
  const len = a.distanceTo(b), g = new THREE.BoxGeometry(w, h, len);
  const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * Math.max(1, len / 2));
  const m = new THREE.Matrix4().lookAt(a, b, V(0, 1, 0)); g.applyMatrix4(m); const mid = a.clone().add(b).multiplyScalar(0.5); return g.translate(mid.x, mid.y, mid.z);
};
const SERIF = "900 %spx Georgia, 'Times New Roman', serif";

// ---------------- painted textures ----------------
const roadTex = () => ctex("rdRoad", 1024, 1024, (g, r) => {
  const W = 1024, H = 1024, PX = W / 7.4, U = (d: number) => (d + 3.7) * PX;
  const per = (y: number, k: number, ph: number) => Math.sin((TAU * k * y) / H + ph);
  const edge = (s: number, y: number) => 3.1 + 0.16 * per(y, 3, s * 1.7) + 0.1 * per(y, 7, s * 0.4) + 0.06 * per(y, 17, s * 2.2);
  g.clearRect(0, 0, W, H);
  // dirt body
  g.save(); g.beginPath(); g.moveTo(U(-edge(-1, 0)), 0); for (let y = 0; y <= H; y += 8) g.lineTo(U(-edge(-1, y)), y); for (let y = H; y >= 0; y -= 8) g.lineTo(U(edge(1, y)), y); g.closePath(); g.clip();
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#d8a96c"); gr.addColorStop(0.3, "#e8bf82"); gr.addColorStop(0.5, "#efca8e"); gr.addColorStop(0.7, "#e8bf82"); gr.addColorStop(1, "#d6a66a");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, rr = 60 + r() * 160; wrap(H, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.55 ? "rgba(250,222,168,0.35)" : "rgba(196,140,96,0.22)")); }
  // wheel ruts: shaded trough (violet-brown on the sun-away side) + a light ridge
  for (const [d, k] of [[-0.72, 1], [0.72, 1], [-2.05, 0.55], [2.05, 0.55]] as [number, number][]) {
    for (let y = 0; y < H; y += 2) {
      const x = U(d) + 5 * per(y, 2, d * 3) + 2 * per(y, 9, d);
      g.fillStyle = `rgba(150,96,92,${0.3 * k})`; g.fillRect(x - 13, y, 12, 2);
      g.fillStyle = `rgba(176,120,92,${0.32 * k})`; g.fillRect(x - 1, y, 10, 2);
      g.fillStyle = `rgba(255,236,196,${0.42 * k})`; g.fillRect(x + 9, y, 5, 2);
    }
  }
  // footprints (runners) + hoof prints + tyre tread dashes
  for (let i = 0; i < 60; i++) { const x = U(-2.6 + r() * 5.2), y = r() * H, a = (r() - 0.5) * 0.4, s = r() < 0.5 ? -1 : 1; wrap(H, x, y, 20, (xx, yy) => { g.save(); g.translate(xx + s * 7, yy); g.rotate(a); g.fillStyle = "rgba(160,104,84,0.32)"; g.beginPath(); g.ellipse(0, 0, 5, 11, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(255,236,200,0.35)"; g.beginPath(); g.ellipse(1.5, -2, 3, 6, 0, 0, TAU); g.fill(); g.restore(); }); }
  for (let i = 0; i < 26; i++) { const x = U(-1.5 + r() * 3), y = r() * H; wrap(H, x, y, 16, (xx, yy) => { g.strokeStyle = "rgba(150,96,84,0.4)"; g.lineWidth = 3.5; g.beginPath(); g.arc(xx, yy, 7, 0.2, Math.PI - 0.2, true); g.stroke(); }); }
  // pebbles (lit top, violet shadow)
  for (let i = 0; i < 230; i++) {
    const x = U((r() - 0.5) * 6.0), y = r() * H, rr = 2 + r() * 5.5;
    wrap(H, x, y, rr * 2, (xx, yy) => { g.fillStyle = "rgba(130,90,110,0.45)"; g.beginPath(); g.ellipse(xx + 1.5, yy + 2, rr, rr * 0.7, 0, 0, TAU); g.fill(); g.fillStyle = ["#f4e2c0", "#d9c2a0", "#c9a888", "#e9d4b6"][i % 4]; g.beginPath(); g.ellipse(xx, yy, rr, rr * 0.7, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(255,252,236,0.7)"; g.beginPath(); g.ellipse(xx - rr * 0.3, yy - rr * 0.25, rr * 0.4, rr * 0.25, 0, 0, TAU); g.fill(); });
  }
  // sun-baked cracks near the edges
  g.strokeStyle = "rgba(150,100,80,0.45)"; g.lineWidth = 1.6;
  for (let i = 0; i < 40; i++) { let x = U((r() < 0.5 ? -1 : 1) * (2.4 + r() * 0.6)), y = r() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 26; y += 6 + r() * 14; g.lineTo(x, y); } g.stroke(); }
  g.restore();
  // ragged grassy edges: tufts that overhang the dirt and run out past it (alpha-tested boundary)
  for (const s of [-1, 1]) {
    for (let y = 0; y < H; y += 2) { const e = U(s * edge(s, y)); g.fillStyle = "#b9bc5e"; if (s < 0) g.fillRect(0, y, e, 2); else g.fillRect(e, y, W - e, 2); }
    for (let i = 0; i < 520; i++) {
      const y = r() * H, e = s * edge(s, y), x = U(e + s * (r() * 0.55 - 0.2)), h = 8 + r() * 16, c = ["#7fa83e", "#9cbc4a", "#b9c95a", "#6c9a38", "#c8cf6a"][i % 5];
      wrap(H, x, y, 24, (xx, yy) => { g.strokeStyle = c; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); for (const k of [-1, 0, 1]) { g.moveTo(xx + k * 3, yy); g.lineTo(xx + k * 3 - s * h * 0.5 + k * 4, yy - h * 0.6); } g.stroke(); });
    }
  }
});
const grassTex = () => ctex("rdGrass", 1024, 1024, (g, r) => {
  const S = 1024; g.fillStyle = "#e4ead2"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 22; i++) { const x = r() * S, y = r() * S, rr = 90 + r() * 220; wrap(S, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.5 ? "rgba(255,255,228,0.4)" : "rgba(150,186,110,0.22)")); }
  g.lineWidth = 2.4; g.lineCap = "round";
  for (let i = 0; i < 2200; i++) {
    const x = r() * S, y = r() * S, h = 8 + r() * 16, lean = (r() - 0.5) * 7, k = r();
    wrap(S, x, y, 24, (xx, yy) => { g.strokeStyle = k < 0.45 ? "rgba(84,132,48,0.34)" : k < 0.8 ? "rgba(255,255,226,0.5)" : "rgba(196,170,84,0.35)"; g.beginPath(); g.moveTo(xx - 3 + lean, yy - h); g.lineTo(xx, yy); g.lineTo(xx + 3 + lean, yy - h * 0.8); g.stroke(); });
  }
  for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S, c = ["#ffffff", "#ffe14a", "#c58ae0", "#ffffff"][i % 4]; wrap(S, x, y, 8, (xx, yy) => { g.fillStyle = c; g.beginPath(); g.arc(xx, yy, 3.6, 0, TAU); g.fill(); g.fillStyle = "#f2b02a"; g.beginPath(); g.arc(xx, yy, 1.3, 0, TAU); g.fill(); }); }
});
type Field = "wheat" | "rows" | "mown" | "plow" | "corn" | "pasture" | "soil" | "lane";
const FIELD_COL: Record<Field, [string, string, string]> = {
  wheat: ["#eebf4c", "#cf9a30", "#fde08a"], rows: ["#8cc44e", "#5e9e3c", "#b4dc72"], mown: ["#c4d268", "#a8b84a", "#e8dc7a"],
  plow: ["#e0a878", "#b8806e", "#f2c696"], corn: ["#5aa442", "#3f8638", "#86c45a"], pasture: ["#86c654", "#64a644", "#aedc74"],
  soil: ["#c99a70", "#a8786a", "#ddb488"], lane: ["#d9ad74", "#b98a66", "#efca90"],
};
const fieldTex = (k: Field) => ctex("rdField" + k, 512, 512, (g, r) => {
  const [base, dk, lt] = FIELD_COL[k], S = 512; g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 14; i++) { const x = r() * S, y = r() * S, rr = 50 + r() * 120; wrap(S, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.5 ? "rgba(255,250,215,0.2)" : "rgba(80,60,70,0.12)")); }
  if (k === "pasture" || k === "lane") { g.lineWidth = 2; for (let i = 0; i < 900; i++) { const x = r() * S, y = r() * S, h = 6 + r() * 9; wrap(S, x, y, 14, (xx, yy) => { g.strokeStyle = r() < 0.5 ? dk : lt; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + (r() - 0.5) * 6, yy - h); g.stroke(); }); } return; }
  const rows = k === "mown" ? 6 : k === "plow" || k === "soil" ? 16 : 12, rw = S / rows;
  for (let i = 0; i < rows; i++) {
    const x = i * rw;
    if (k === "plow" || k === "soil") { g.fillStyle = dk; g.fillRect(x, 0, rw * 0.38, S); g.fillStyle = lt; g.fillRect(x + rw * 0.5, 0, rw * 0.18, S); }
    else if (k === "mown") { g.fillStyle = lt; g.fillRect(x + rw * 0.25, 0, rw * 0.5, S); g.strokeStyle = dk; g.lineWidth = 2; for (let y = 0; y < S; y += 7) { g.beginPath(); g.moveTo(x + rw * 0.3, y); g.lineTo(x + rw * 0.7, y + 5); g.stroke(); } }
    else { g.fillStyle = dk; g.fillRect(x, 0, rw * 0.3, S); for (let y = 0; y < S; y += 9) { g.fillStyle = r() < 0.5 ? lt : dk; g.beginPath(); g.ellipse(x + rw * (0.45 + r() * 0.3), y, rw * 0.22, 4, 0, 0, TAU); g.fill(); } }
  }
  if (k === "corn") for (let i = 0; i < 160; i++) { g.fillStyle = "#f2d266"; g.beginPath(); g.arc(r() * S, r() * S, 2.5, 0, TAU); g.fill(); }
  if (k === "wheat") for (let i = 0; i < 40; i++) { g.fillStyle = "#e05a3a"; g.beginPath(); g.arc(r() * S, r() * S, 2.6, 0, TAU); g.fill(); } // poppies
});
const cornTex = () => ctex("rdCorn", 128, 512, (g, r) => {
  g.clearRect(0, 0, 128, 512);
  g.strokeStyle = "#5e9a3a"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(64, 512); g.lineTo(62, 70); g.stroke();
  g.strokeStyle = "#8cc456"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(66, 512); g.lineTo(64, 74); g.stroke();
  for (let i = 0; i < 9; i++) {
    const y = 470 - i * 46, s = i % 2 ? 1 : -1, L = 54 + r() * 18;
    g.fillStyle = i % 3 === 0 ? "#6aa646" : "#7cb850"; g.beginPath(); g.moveTo(64, y); g.quadraticCurveTo(64 + s * L * 0.6, y - 46, 64 + s * L, y + 6 + r() * 26); g.quadraticCurveTo(64 + s * L * 0.55, y - 30, 64, y - 12); g.fill();
    g.strokeStyle = "rgba(220,240,160,0.6)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(64, y - 4); g.quadraticCurveTo(64 + s * L * 0.6, y - 40, 64 + s * L * 0.95, y + 4 + r() * 20); g.stroke();
    g.fillStyle = "#d8c860"; g.beginPath(); g.arc(64 + s * L * 0.98, y + 10 + r() * 16, 3, 0, TAU); g.fill();
  }
  g.fillStyle = "#88b850"; g.beginPath(); g.ellipse(72, 250, 10, 32, 0.25, 0, TAU); g.fill(); g.fillStyle = "#f2d266"; g.beginPath(); g.ellipse(76, 222, 5, 10, 0.25, 0, TAU); g.fill(); g.strokeStyle = "#c87a3a"; g.lineWidth = 2; g.beginPath(); g.moveTo(77, 214); g.lineTo(82, 200); g.stroke();
  g.fillStyle = "#cfae5e"; g.beginPath(); g.moveTo(59, 80); g.lineTo(46, 40); g.lineTo(55, 44); g.lineTo(58, 22); g.lineTo(64, 42); g.lineTo(71, 24); g.lineTo(71, 46); g.lineTo(80, 42); g.lineTo(67, 80); g.closePath(); g.fill(); g.fillStyle = "#ead08a"; g.beginPath(); g.moveTo(61, 72); g.lineTo(58, 30); g.lineTo(65, 50); g.closePath(); g.fill();
});
const tuftTex = () => ctex("rdTuft", 128, 128, (g, r) => {
  g.clearRect(0, 0, 128, 128); g.lineCap = "round";
  for (let i = 0; i < 26; i++) { const x = 30 + r() * 68, h = 50 + r() * 70, lean = (r() - 0.5) * 50; g.strokeStyle = ["#7aa83e", "#a6c252", "#c9c862", "#5e9238", "#d6c66e"][i % 5]; g.lineWidth = 4 + r() * 3; g.beginPath(); g.moveTo(x, 128); g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h); g.stroke(); }
  for (let i = 0; i < 3; i++) { g.fillStyle = ["#ffffff", "#ffd84a", "#e8a0d8"][i]; g.beginPath(); g.arc(30 + r() * 68, 30 + r() * 30, 5, 0, TAU); g.fill(); }
});
const puffTex = (k: number) => ctex("rdPuff" + k, 256, 256, (g) => {
  const r = rng(k * 97 + 11), lobes: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) { const a = r() * TAU, d = 10 + r() * 32; lobes.push([128 + Math.cos(a) * d * 1.15, 138 + Math.sin(a) * d * 0.7 - (r() < 0.4 ? 14 : 0), 30 + r() * 22]); } // stays > 20 px inside the 256 tile (no clipped edges)
  const layer = (dx: number, dy: number, k2: number, c: string, blur: number) => { g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = c; g.beginPath(); for (const [x, y, rr] of lobes) { g.moveTo(x + dx + rr * k2, y + dy); g.arc(x + dx, y + dy, rr * k2, 0, TAU); } g.fill(); g.restore(); };
  layer(5, 8, 1.0, "rgba(190,138,120,0.96)", 5);
  layer(-2, -3, 0.86, "rgba(226,180,124,0.98)", 5);
  layer(-9, -15, 0.6, "rgba(250,226,176,0.98)", 6);
  layer(-14, -22, 0.32, "rgba(255,246,222,0.9)", 6);
});
const shimmerTex = () => ctex("rdShimmer", 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 9; i++) { const y = 14 + i * 12; g.strokeStyle = `rgba(255,252,240,${0.5 - Math.abs(i - 4) * 0.08})`; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + 3 * Math.sin(x * 0.07 + i)); g.stroke(); }
  const m = g.createLinearGradient(0, 0, 256, 0); m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(0.2, "rgba(0,0,0,0)"); m.addColorStop(0.8, "rgba(0,0,0,0)"); m.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = m; g.fillRect(0, 0, 256, 128);
});
const dappleTex = () => ctex("rdDapple", 256, 256, (g, r) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 34; i++) { const x = 30 + r() * 196, y = 30 + r() * 196; if (Math.hypot(x - 128, y - 128) > 110) continue; const rr = 5 + r() * 12; g.fillStyle = "rgba(255,246,196,0.85)"; g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, TAU); g.fill(); }
});
const barnTex = () => ctex("rdBarn", 512, 512, (g, r) => {
  for (let i = 0; i < 16; i++) {
    const x = i * 32, c = new THREE.Color("#d2462c").offsetHSL((r() - 0.5) * 0.02, (r() - 0.5) * 0.08, (r() - 0.5) * 0.06);
    g.fillStyle = "#" + c.getHexString(); g.fillRect(x, 0, 32, 512);
    g.strokeStyle = "rgba(120,26,34,0.35)"; g.lineWidth = 1.5; for (let k = 0; k < 5; k++) { const xx = x + 5 + r() * 22; g.beginPath(); g.moveTo(xx, 0); g.bezierCurveTo(xx + 4, 170, xx - 4, 340, xx + 2, 512); g.stroke(); }
    g.fillStyle = "rgba(255,210,190,0.18)"; g.fillRect(x + 3, 0, 4, 512);
    g.fillStyle = "#5a1a2a"; g.fillRect(x + 29, 0, 3, 512);
    g.fillStyle = "#3a2430"; for (const y of [60, 300]) { g.beginPath(); g.arc(x + 16, y, 2, 0, TAU); g.fill(); }
    if (r() < 0.35) { g.fillStyle = "rgba(240,200,170,0.22)"; g.fillRect(x + 6, 380 + r() * 60, 20, 60); } // weathered paint
  }
  const gr = g.createLinearGradient(0, 400, 0, 512); gr.addColorStop(0, "rgba(200,150,110,0)"); gr.addColorStop(1, "rgba(200,150,110,0.35)"); g.fillStyle = gr; g.fillRect(0, 400, 512, 112);
});
const clapTex = () => ctex("rdClap", 512, 512, (g, r) => {
  g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) { g.fillStyle = "rgba(160,150,190,0.45)"; g.fillRect(0, y + 26, 512, 6); g.fillStyle = "rgba(255,255,255,0.7)"; g.fillRect(0, y, 512, 3); for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(200,190,170,0.25)"; g.fillRect(r() * 512, y + 6, 40 + r() * 80, 2); } }
});
const winTex = () => ctex("rdWin", 128, 192, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, "#9ab8dc"); gr.addColorStop(0.5, "#56709c"); gr.addColorStop(1, "#33406a"); g.fillStyle = gr; g.fillRect(0, 0, 128, 192);
  g.fillStyle = "rgba(255,255,255,0.3)"; g.beginPath(); g.moveTo(20, 0); g.lineTo(60, 0); g.lineTo(12, 192); g.lineTo(-28, 192); g.fill();
  g.fillStyle = "#f2ece0"; g.fillRect(0, 140, 128, 52); g.fillStyle = "rgba(170,150,170,0.5)"; for (let x = 6; x < 128; x += 12) { g.beginPath(); g.arc(x, 140, 5, 0, Math.PI); g.fill(); }
  g.fillStyle = "#fbf7ee"; g.fillRect(0, 0, 128, 8); g.fillRect(0, 184, 128, 8); g.fillRect(0, 0, 8, 192); g.fillRect(120, 0, 8, 192); g.fillRect(60, 0, 8, 192); g.fillRect(0, 92, 128, 7);
});
const barkTex = () => ctex("rdBark", 256, 512, (g, r) => {
  g.fillStyle = "#93684a"; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 70; i++) { g.strokeStyle = ["#74503e", "#b08a68", "#62443e", "#c09c78"][i % 4]; g.lineWidth = 3 + r() * 5; const x = r() * 256; g.beginPath(); g.moveTo(x, r() * 512); g.bezierCurveTo(x + 10, r() * 512, x - 10, r() * 512, x + (r() - 0.5) * 20, r() * 512); g.stroke(); }
});
const cowTex = () => ctex("rdCow", 256, 256, (g, r) => {
  g.fillStyle = "#f6f2ea"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 7; i++) { g.fillStyle = "#3a3048"; g.beginPath(); const x = r() * 256, y = r() * 256; for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, rr = 22 + r() * 22; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
});
const roosterTex = () => ctex("rdRooster", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.fillStyle = "#3a3448";
  g.beginPath(); g.moveTo(60, 170); g.quadraticCurveTo(70, 110, 120, 110); g.quadraticCurveTo(130, 60, 160, 64); g.lineTo(186, 76); g.lineTo(166, 86); g.quadraticCurveTo(170, 120, 160, 150); g.lineTo(150, 196); g.lineTo(100, 196); g.quadraticCurveTo(40, 200, 24, 120); g.quadraticCurveTo(50, 140, 60, 170); g.fill();
  g.beginPath(); g.moveTo(150, 64); g.lineTo(156, 44); g.lineTo(164, 58); g.lineTo(172, 46); g.lineTo(174, 66); g.fill();
});
/** hand-painted board face: cream boards, red/blue lettering, always fits */
const boardFace = (key: string, lines: string[], w: number, h: number, o: { bg?: string; fg?: string; fg2?: string; arrow?: boolean; cup?: boolean } = {}) => ctex("rdBoard" + key, w, h, (g, r) => {
  const bg = o.bg ?? "#f4e6c4"; g.clearRect(0, 0, w, h);
  if (o.arrow) { g.fillStyle = bg; g.beginPath(); g.moveTo(0, h * 0.12); g.lineTo(w * 0.78, h * 0.12); g.lineTo(w * 0.78, 0); g.lineTo(w, h / 2); g.lineTo(w * 0.78, h); g.lineTo(w * 0.78, h * 0.88); g.lineTo(0, h * 0.88); g.closePath(); g.fill(); }
  else { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.save(); if (o.arrow) g.clip();
  for (let y = h / 4; y < h; y += h / 4) { g.fillStyle = "rgba(120,86,70,0.35)"; g.fillRect(0, y - 2, w, 3); }
  for (let i = 0; i < 30; i++) blot(g, r() * w, r() * h, 20 + r() * 50, "rgba(190,150,110,0.12)");
  g.restore();
  g.textAlign = "center"; g.textBaseline = "middle";
  const n = lines.length, tw = o.arrow ? w * 0.66 : o.cup ? w * 0.64 : w * 0.86, cx = o.arrow ? w * 0.4 : o.cup ? w * 0.6 : w / 2;
  lines.forEach((l, i) => { const size = (i === 0 ? 0.5 : 0.3) * h * (n === 1 ? 1.25 : 1), y = n === 1 ? h * 0.53 : h * (i === 0 ? 0.36 : 0.74); g.fillStyle = "rgba(60,30,30,0.25)"; fitText(g, l, cx + 3, y + 3, tw, size, SERIF); g.fillStyle = i === 0 ? (o.fg ?? "#b42a2a") : (o.fg2 ?? "#24407a"); fitText(g, l, cx, y, tw, size, SERIF); });
  if (o.cup) { const x = w * 0.16, y = h * 0.52, s = h * 0.24; g.fillStyle = "#9aa6c0"; g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y - s); g.lineTo(x + s * 0.75, y + s); g.lineTo(x - s * 0.75, y + s); g.closePath(); g.fill(); g.strokeStyle = "#9aa6c0"; g.lineWidth = s * 0.25; g.beginPath(); g.arc(x + s * 1.05, y, s * 0.45, -1.3, 1.3); g.stroke(); g.fillStyle = "#e6ecf6"; g.fillRect(x - s * 0.8, y - s * 0.95, s * 0.35, s * 1.6); g.fillStyle = "#5aa8e0"; g.fillRect(x - s * 0.9, y - s * 0.9, s * 1.8, s * 0.3); }
});
const flagTex = () => ctex("rdFlag", 384, 220, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f6f1e6" : "#c8323a"; g.fillRect(0, (i * 220) / 13, 384, 220 / 13 + 1); }
  g.fillStyle = "#2c3a7a"; g.fillRect(0, 0, 160, 118); g.fillStyle = "#f6f1e6";
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc(12 + x * 19, 11 + y * 19, 3.4, 0, TAU); g.fill(); }
});

// ---------------- builders ----------------
/** wind-swayed cut-out cards (corn, grass tufts): CPU vertex wind so the ink pass (static override material) sees the
 *  same geometry. Normals point up so a field reads evenly lit. */
class Sway {
  private p: number[] = []; private uv: number[] = []; private w: number[] = []; private idx: number[] = [];
  mesh: THREE.Mesh | null = null; private base: Float32Array | null = null; private wt: Float32Array | null = null; private ph: Float32Array | null = null;
  card(x: number, y: number, z: number, wd: number, h: number, yaw: number, lean = 0, u0 = 0, u1 = 1) {
    const c = Math.cos(yaw) * wd / 2, s = Math.sin(yaw) * wd / 2, n = this.p.length / 3;
    const lx = Math.sin(lean) * h * Math.cos(yaw + 1.2), lz = Math.sin(lean) * h * Math.sin(yaw + 1.2);
    this.p.push(x - c, y, z - s, x + c, y, z + s, x + c + lx, y + h, z + s + lz, x - c + lx, y + h, z - s + lz);
    this.uv.push(u0, 0, u1, 0, u1, 1, u0, 1); this.w.push(0, 0, 1, 1); this.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  build(parent: THREE.Object3D, m: THREE.Material, shadow = true) {
    const g = new THREE.BufferGeometry(), pa = new Float32Array(this.p);
    g.setAttribute("position", new THREE.BufferAttribute(pa, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(this.p.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); g.setIndex(this.idx);
    this.mesh = new THREE.Mesh(g, m); this.mesh.castShadow = shadow; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false; parent.add(this.mesh);
    this.base = pa.slice(); this.wt = Float32Array.from(this.w); this.ph = new Float32Array(this.w.length).map((_, i) => this.base![i * 3] * 0.21 + this.base![i * 3 + 2] * 0.13);
  }
  update(t: number, amp: number) {
    if (!this.mesh) return; const a = (this.mesh.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array, b = this.base!, w = this.wt!, ph = this.ph!;
    for (let i = 0; i < w.length; i++) { if (!w[i]) continue; const s = Math.sin(t * 1.9 + ph[i]) + 0.45 * Math.sin(t * 4.3 + ph[i] * 1.7); a[i * 3] = b[i * 3] + amp * (0.55 + 0.45 * s); a[i * 3 + 2] = b[i * 3 + 2] + amp * 0.35 * Math.sin(t * 1.3 + ph[i] * 0.8); }
    (this.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
/** drape a rotated rectangle onto the terrain (fields, lanes) */
const drape = (b: Batch, m: THREE.Material, cx: number, cz: number, w: number, d: number, ang: number, lift: number, res: number, tile = 6) => {
  const nu = Math.max(1, Math.ceil(w / res)), nv = Math.max(1, Math.ceil(d / res)), pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const s = -w / 2 + (w * i) / nu, t = -d / 2 + (d * j) / nv, x = cx + s * ca - t * sa, z = cz + s * sa + t * ca;
    pos.push(x, groundY(x, z) + lift, z); uv.push(s / tile, t / tile);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, bb = a + 1, c = a + nu + 1, dd = c + 1; idx.push(a, c, bb, bb, c, dd); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  b.add(g, m);
};
/** haystack: straw cylinder + dome + a pole */
const haystack = (b: Batch, p: V3, s = 1) => {
  const straw = tex("straw", strawTex);
  b.add(new THREE.CylinderGeometry(1.25 * s, 1.45 * s, 1.5 * s, 16).translate(p[0], p[1] + 0.75 * s, p[2]), straw);
  b.add(new THREE.SphereGeometry(1.26 * s, 16, 8, 0, TAU, 0, Math.PI / 2).scale(1, 1.25, 1).translate(p[0], p[1] + 1.5 * s, p[2]), straw);
  b.add(rodGeo([p[0], p[1] + 2.6 * s, p[2]], [p[0] + 0.05, p[1] + 3.3 * s, p[2]], 0.05), col("#8a6a52"));
};
const bush = (b: Batch, m: THREE.Material, p: V3, r: number) => b.add(new THREE.IcosahedronGeometry(r, 1).scale(1, 0.8, 1).translate(p[0], p[1] + r * 0.6, p[2]), m);
type Crown = { g: THREE.Group; seed: number; k: number };
/** a round shade tree (oak / elm): trunk + lumpy crown in its own swaying group */
const shadeTree = (b: Batch, parent: THREE.Object3D, p: V3, h: number, seed: number): Crown => {
  const r = rng(seed * 31 + 7), bark = tex("bark", barkTex), leaf = tex("oakLeaf", () => leafTex("rdOak", "#4f9a3e", "#7cc052", "#357a36"));
  b.add(new THREE.CylinderGeometry(0.06 * h, 0.1 * h, h * 0.55, 9).translate(p[0], p[1] + h * 0.27, p[2]), bark);
  const g = new THREE.Group(); g.position.set(p[0], p[1] + h * 0.45, p[2]); parent.add(g);
  const cb = new Batch();
  for (let i = 0; i < 6; i++) { const rr = h * (0.2 + r() * 0.12), a = r() * TAU, d = i ? h * 0.2 : 0; cb.add(new THREE.IcosahedronGeometry(rr, 2).scale(1, 0.82, 1).translate(Math.cos(a) * d, h * (0.22 + r() * 0.24), Math.sin(a) * d), leaf); }
  cb.build(g); return { g, seed, k: 1 };
};
/** apple tree: crooked trunk + boughs, lumpy crown studded with red apples (own swaying group) */
const appleTree = (b: Batch, parent: THREE.Object3D, p: V3, h: number, seed: number): Crown => {
  const r = rng(seed * 17 + 3), bark = tex("bark", barkTex), leaf = tex("appleLeaf", () => leafTex("rdApple", "#5aa443", "#8acb5a", "#3b8038"));
  const apple = shiny("apple", "#e03a32", 70), appleY = shiny("appleY", "#f0a03a", 60);
  const lean = (r() - 0.5) * 0.4, top: V3 = [p[0] + lean * 0.6, p[1] + h * 0.42, p[2] + (r() - 0.5) * 0.3];
  b.add(rodGeo(p, top, 0.16 * h / 4.6, 9), bark);
  for (let k = 0; k < 3; k++) { const a = r() * TAU + k * 2.1; b.add(rodGeo(top, [top[0] + Math.cos(a) * h * 0.24, top[1] + h * 0.2, top[2] + Math.sin(a) * h * 0.24], 0.07 * h / 4.6, 6), bark); }
  const g = new THREE.Group(); g.position.set(top[0], top[1], top[2]); parent.add(g);
  const cb = new Batch(), lumps: [number, number, number, number][] = [];
  for (let i = 0; i < 7; i++) { const rr = h * (0.17 + r() * 0.1), a = r() * TAU, d = i ? h * (0.16 + r() * 0.1) : 0; const L: [number, number, number, number] = [Math.cos(a) * d, h * (0.24 + r() * 0.16), Math.sin(a) * d, rr]; lumps.push(L); cb.add(new THREE.IcosahedronGeometry(rr, 2).scale(1, 0.8, 1).translate(L[0], L[1], L[2]), leaf); }
  for (let i = 0; i < 34; i++) { const L = lumps[i % lumps.length], th = r() * TAU, ph = r() * Math.PI * 0.75 + 0.3; cb.add(new THREE.SphereGeometry(0.075, 8, 6).translate(L[0] + Math.cos(th) * Math.sin(ph) * L[3] * 1.0, L[1] + Math.cos(ph) * L[3] * 0.8, L[2] + Math.sin(th) * Math.sin(ph) * L[3]), i % 5 ? apple : appleY); }
  cb.build(g); return { g, seed, k: 1.3 };
};
/** split-rail fence along a road offset (posts every ~2.5 m, three rough rails, a few sagging / broken) */
const fence = (b: Batch, f: FenceRun) => {
  const wood = tex("fence", () => beamHD()), r = rng(Math.round(f.z0 * 7 + f.off * 13 + f.side * 3));
  const n = Math.max(1, Math.round((f.z0 - f.z1) / 2.5)), posts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) { const z = f.z0 + ((f.z1 - f.z0) * i) / n, p = V(...at(f.side * f.off + (r() - 0.5) * 0.08, z)); posts.push(p); b.add(new THREE.BoxGeometry(0.15, 1.42, 0.15).rotateZ((r() - 0.5) * 0.08).rotateX((r() - 0.5) * 0.06).translate(p.x, p.y + 0.66, p.z), wood); b.add(new THREE.ConeGeometry(0.11, 0.12, 4).rotateY(Math.PI / 4).translate(p.x, p.y + 1.42, p.z), wood); }
  for (let i = 0; i < n; i++) { const A = posts[i], B = posts[i + 1]; for (const h of [0.38, 0.8, 1.2]) { if (r() < 0.04) continue; const sag = r() < 0.08 ? -0.35 : (r() - 0.5) * 0.06; b.add(beamGeo(V(A.x, A.y + h + (r() - 0.5) * 0.04, A.z), V(B.x, B.y + h + sag, B.z), 0.09, 0.11), wood); } }
};
/** a hand-painted sign on a post (face unlit, so it always reads) */
const signPost = (b: Batch, parent: THREE.Object3D, key: string, lines: string[], p: V3, yaw: number, w: number, h: number, postH: number, o: Parameters<typeof boardFace>[4] = {}) => {
  const wood = tex("fence", () => beamHD());
  b.add(new THREE.BoxGeometry(0.13, postH + h * 0.5, 0.13).translate(p[0], p[1] + (postH + h * 0.5) / 2, p[2]), wood);
  const g = new THREE.Group(); g.position.set(p[0], p[1] + postH, p[2]); g.rotation.y = yaw; parent.add(g);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat("rdSignM" + key, () => new THREE.MeshBasicMaterial({ map: boardFace(key, lines, 768, Math.round((768 * h) / w), o), transparent: !!o.arrow, alphaTest: o.arrow ? 0.4 : 0, side: THREE.DoubleSide })));
  face.position.z = 0.075; g.add(face);
  if (!o.arrow) { const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.07), wood); fr.position.z = 0.03; fr.castShadow = true; g.add(fr); }
  else { const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat("rdSignB" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: boardFace(key, lines, 768, Math.round((768 * h) / w), o), alphaTest: 0.4, side: THREE.DoubleSide })))); back.position.z = 0.06; back.castShadow = true; g.add(back); }
  return g;
};


// ---------------- "He Labeled Grape Bricks" vineyard (VINE variant) ----------------
// Brick Boy's vines: the old cornfield parcel behind the barn (offset 7..31, z -20..-52) + two rows along his road fence
// (offset 7.2..8.8, z 6..-4, so the hook frames vines behind the press). Hank's vines: the old orchard across the road
// (offset -7..-30, z 31..1); the rows nearest the road (offset -7.5..-12.5, z 15..1) are half ripped out (stumps, holes,
// a heap of uprooted vines at offset -9.6, z 8.6; Hank yanks at offset -7.9, z 4.2). The press yard sits inside the farm gate: the basket press at offset 8.4,
// z -8.4 (Brick Boy cranks it from the road side, mark brickPress), the brick table at offset 10.8, z -11.4 (mark
// brickTable), the GRAPE BRICKS sign by the gate. Controls: c.press (crank turns, plate sinks 0..1 per pressing),
// c.bricks (0..36 bricks stacked on the table), c.agentCar (-1 hidden, 0..1 the black sedan drives from z 46 to the
// gate, stops at z -3.6 on the near lane), c.carDoor 0..1 (rear door opens), c.juice 0..1 (juice runs from the spout).
const vineLeaf = () => swayMaterial(tex("vineLeaf", () => leafTex("rdVine", "#4f9a3a", "#7cbd4e", "#2f6e30")));   // remake: leaves ripple in the breeze (sway.ts)
const vinePlant = (b: Batch, p: V3, seed: number, ripe = true, h = 1.0) => {
  const r = rng(seed), bark = col("#6e4a32"), grape = shiny("grape", "#5a2470", 70), grape2 = shiny("grape2", "#7a3a8e", 70);
  const top: V3 = [p[0] + (r() - 0.5) * 0.12, p[1] + 0.8 * h, p[2] + (r() - 0.5) * 0.12];
  b.add(rodGeo(p, top, 0.06, 6), bark);
  for (const s of [-1, 1]) b.add(rodGeo(top, [top[0], top[1] + 0.12, top[2] + s * 0.55], 0.035, 5), bark);
  for (let k = 0; k < 6; k++) { const rr = 0.26 + r() * 0.12; b.add(new THREE.IcosahedronGeometry(rr, 1).scale(1.05, 0.72, 1.5).translate(top[0] + (r() - 0.5) * 0.18, top[1] + 0.18 + (k % 2) * 0.22 + r() * 0.1, top[2] + (k - 2.5) * 0.3), vineLeaf()); } // a continuous leafy hedge along the wires
  if (ripe) for (let k = 0; k < 3; k++) { const gx = top[0] + (r() > 0.5 ? 0.34 : -0.34), gz = top[2] + (k - 1) * 0.42, gy = top[1] + 0.05;
    for (let q = 0; q < 6; q++) b.add(new THREE.SphereGeometry(0.05, 7, 5).translate(gx + (r() - 0.5) * 0.06, gy - q * 0.035 - (q % 2) * 0.01, gz + ((q % 3) - 1) * 0.04), q % 2 ? grape : grape2); }
};
const vineRow = (b: Batch, off: number, z0: number, z1: number, seed: number, skip?: (o: number, z: number) => boolean) => {
  const r = rng(seed), wood = tex("fence", () => beamHD()), wire = col("#7d7f88"), n = Math.max(2, Math.round(Math.abs(z1 - z0) / 1.55));
  for (let i = 0; i <= n; i++) { const z = z0 + ((z1 - z0) * i) / n, p = at(off + (r() - 0.5) * 0.06, z); if (skip?.(off, z)) continue; vinePlant(b, p, seed * 97 + i, true); if (i % 3 === 0) b.add(new THREE.BoxGeometry(0.08, 1.7, 0.08).translate(p[0], p[1] + 0.85, p[2]), wood); }
  for (const hh of [0.95, 1.4]) { const A = at(off, z0), B = at(off, z1); if (!skip) b.add(rodGeo([A[0], A[1] + hh, A[2]], [B[0], B[1] + hh, B[2]], 0.008, 3), wire); }
};
const buildVineyard = (b: Batch, root: THREE.Object3D) => {
  // Brick Boy's big vineyard behind the barn (the old corn parcel) + the two rows inside his road fence
  for (let k = 0; k < 10; k++) vineRow(b, 7.2 + k * 2.4, -21, -52, 300 + k);
  for (let k = 0; k < 2; k++) vineRow(b, 7.4 + k * 1.6, 7.5, 3.5, 330 + k);
  // Hank's vineyard across the road; the near rows half ripped out
  const ripped = (o: number, z: number) => o > -13 && z < 15 && z > 0.8;
  for (let k = 0; k < 10; k++) { const off = -7.6 - k * 2.4; if (off > -13) { vineRow(b, off, 31, 1, 400 + k, ripped); vineRow(b, off, 31, 15.5, 450 + k); } else vineRow(b, off, 31, 1, 400 + k); }
  { const rr = rng(77), bark = col("#6e4a32"), dirt = col("#8a6446"), leaf = vineLeaf();
    for (let k = 0; k < 2; k++) for (let z = 14.4; z > 1.2; z -= 1.55) { const p = at(-7.6 - k * 2.4 + (rr() - 0.5) * 0.1, z); if (rr() < 0.5) b.add(rodGeo(p, [p[0], p[1] + 0.18, p[2]], 0.06, 6), bark); else b.add(new THREE.SphereGeometry(0.32, 8, 5, 0, TAU, 0, Math.PI / 2).scale(1, 0.35, 1).translate(p[0], p[1] - 0.02, p[2]), dirt); }
    // the heap of uprooted vines (tangled trunks + wilting leaves + dirt clods)
    const H = at(-9.6, 8.6);
    for (let k = 0; k < 16; k++) { const a = rr() * TAU, L = 0.9 + rr() * 0.6, y = H[1] + 0.15 + rr() * 0.6; b.add(rodGeo([H[0] - Math.cos(a) * L / 2, y, H[2] - Math.sin(a) * L / 2], [H[0] + Math.cos(a) * L / 2, y + (rr() - 0.5) * 0.3, H[2] + Math.sin(a) * L / 2], 0.045, 5), bark); }
    for (let k = 0; k < 9; k++) b.add(new THREE.IcosahedronGeometry(0.28 + rr() * 0.12, 1).scale(1, 0.6, 1).translate(H[0] + (rr() - 0.5) * 1.4, H[1] + 0.5 + rr() * 0.4, H[2] + (rr() - 0.5) * 1.4), leaf);
    for (let k = 0; k < 6; k++) b.add(new THREE.IcosahedronGeometry(0.12 + rr() * 0.06, 0).translate(H[0] + (rr() - 0.5) * 1.6, H[1] + 0.08, H[2] + (rr() - 0.5) * 1.6), dirt);
  }
  // ---- the spreading vineyards (payoff "vineyards almost double"): rows that grow out of the fields with c.spread 0..1 ----
  const spread: THREE.Group[] = [];
  { const parcels: [number, number, number, number][] = [[33, 58, 12, -48], [-32, -58, -8, -60], [-34, -60, 60, 20]];
    let n = 0;
    for (const [o0, o1, z0, z1] of parcels) for (let off = o0; Math.sign(o1 - o0) * (o1 - off) > 0; off += Math.sign(o1 - o0) * 2.6) {
      const g = new THREE.Group(); root.add(g); const gb = new Batch(); vineRow(gb, off, z0, z1, 600 + n); gb.build(g);
      const c0 = at(off, (z0 + z1) / 2); g.userData = { k: n, base: c0 }; spread.push(g); n++; }
  }
  // ---- the press yard ----
  const wood = tex("porch", () => beamHD()), iron = shiny("pressIron", "#3a3a46", 40), mash = shiny("mash", "#4a1a5a", 50), juiceM = shiny("juice", "#6a1f78", 90);
  const P = at(8.4, -8.4), press = { plate: new THREE.Group(), crank: new THREE.Group(), screw: new THREE.Group(), stream: null as THREE.Mesh | null };
  b.add(boxGeo(V(P[0] - 0.85, P[1], P[2] - 0.85), V(P[0] + 0.85, P[1] + 0.28, P[2] + 0.85)), wood);                // the base
  for (let k = 0; k < 20; k++) { const a = (k / 20) * TAU; b.add(new THREE.BoxGeometry(0.1, 0.78, 0.05).rotateY(-a).translate(P[0] + Math.cos(a) * 0.52, P[1] + 0.68, P[2] + Math.sin(a) * 0.52), wood); }
  for (const hh of [0.42, 0.95]) b.add(new THREE.TorusGeometry(0.55, 0.025, 6, 28).rotateX(Math.PI / 2).translate(P[0], P[1] + hh, P[2]), iron);
  b.add(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 20).translate(P[0], P[1] + 0.52, P[2]), mash);                    // the grape mash inside
  for (const s of [-1, 1]) b.add(boxGeo(V(P[0] - 0.08, P[1] + 0.28, P[2] + s * 0.78 - 0.08), V(P[0] + 0.08, P[1] + 2.05, P[2] + s * 0.78 + 0.08)), iron);
  b.add(boxGeo(V(P[0] - 0.12, P[1] + 1.92, P[2] - 0.92), V(P[0] + 0.12, P[1] + 2.12, P[2] + 0.92)), iron);         // the crossbeam
  b.add(boxGeo(V(P[0] - 1.1, P[1] + 0.12, P[2] - 0.12), V(P[0] - 0.75, P[1] + 0.2, P[2] + 0.12)), wood);             // the spout toward the road
  b.add(new THREE.CylinderGeometry(0.36, 0.3, 0.42, 18).translate(P[0] - 1.35, P[1] + 0.21, P[2]), wood);            // the tub under it
  b.add(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 18).translate(P[0] - 1.35, P[1] + 0.38, P[2]), juiceM);
  press.plate.position.set(P[0], P[1] + 1.02, P[2]); root.add(press.plate);
  { const pb = new Batch(); pb.add(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 20), wood); pb.add(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8).translate(0, 0.62, 0), iron); pb.build(press.plate); }
  press.crank.position.set(P[0], P[1] + 1.78, P[2]); root.add(press.crank);
  { const cb = new Batch(); cb.add(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 10), iron); cb.add(new THREE.BoxGeometry(1.5, 0.05, 0.05), iron); for (const s of [-1, 1]) cb.add(new THREE.SphereGeometry(0.06, 8, 6).translate(s * 0.75, 0, 0), iron); cb.build(press.crank); }
  press.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.3, 8).translate(0, -0.15, 0), juiceM); press.stream.position.set(P[0] - 1.18, P[1] + 0.2, P[2]); root.add(press.stream);
  // grape lugs (crates heaped with grapes) by the press
  const grapeM = shiny("grape", "#5a2470", 70), grapeM2 = shiny("grape2", "#7a3a8e", 70), rr = rng(5);
  for (const [o, z, hh] of [[9.9, -7.0, 0], [10.5, -7.2, 0], [10.2, -7.1, 0.34]] as [number, number, number][]) { const c = at(o, z);
    b.add(boxGeo(V(c[0] - 0.28, c[1] + hh, c[2] - 0.2), V(c[0] + 0.28, c[1] + hh + 0.3, c[2] + 0.2)), wood);
    for (let k = 0; k < 14; k++) b.add(new THREE.SphereGeometry(0.06, 7, 5).translate(c[0] + (rr() - 0.5) * 0.46, c[1] + hh + 0.31 + rr() * 0.05, c[2] + (rr() - 0.5) * 0.3), k % 2 ? grapeM : grapeM2); }
  // the brick table (trestle) + the stack of bricks (count = c.bricks)
  const T = at(9.6, -11.6);
  b.add(boxGeo(V(T[0] - 0.5, T[1] + 0.86, T[2] - 1.3), V(T[0] + 0.5, T[1] + 0.92, T[2] + 1.3)), wood);
  for (const s of [-1, 1]) { b.add(beamGeo(V(T[0] - 0.45, T[1], T[2] + s * 1.1), V(T[0] + 0.0, T[1] + 0.86, T[2] + s * 1.1), 0.06, 0.08), wood); b.add(beamGeo(V(T[0] + 0.45, T[1], T[2] + s * 1.1), V(T[0] + 0.0, T[1] + 0.86, T[2] + s * 1.1), 0.06, 0.08), wood); }
  const brickTex = ctex("grBrickSide", 256, 128, (g) => { g.fillStyle = "#6a2c7e"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#fbf3dc"; g.fillRect(30, 20, 196, 88); g.fillStyle = "#5a1f6e"; g.font = "900 34px DejaVu Sans, Arial"; g.textAlign = "center"; g.fillText("GRAPE", 128, 58); g.fillText("BRICK", 128, 92); g.fillStyle = "#c8352e"; g.fillRect(30, 100, 196, 8); });
  const brickM = [lam("grBrickTop", () => ({ color: "#8a4aa0" })), lam("grBrickFace", () => ({ map: brickTex }))];
  const bricks: THREE.Mesh[] = [];
  for (let k = 0; k < 36; k++) { const layer = Math.floor(k / 12), i = k % 12, col2 = i % 3, row = Math.floor(i / 3);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), [brickM[0], brickM[0], brickM[0], brickM[0], brickM[0], brickM[0]]);
    (m.material as THREE.Material[])[1] = brickM[1]; // -x face (toward the road) shows the label
    m.position.set(T[0] - 0.25 + col2 * 0.21, T[1] + 0.98 + layer * 0.125, T[2] - 0.75 + row * 0.42 + (layer % 2) * 0.05); m.castShadow = true; root.add(m); bricks.push(m); }
  // the GRAPE BRICKS sign at the gate + a smaller "$1" board on the table
  signPost(b, root, "grBricks", ["GRAPE BRICKS", "$1"], at(6.5, -5.7), -Math.PI / 2, 1.9, 0.9, 1.3, { bg: "#fbf3dc", fg: "#6a2c7e", fg2: "#c8352e" });
  // the agents' black 1920s sedan (federal car); hidden unless c.agentCar >= 0
  const car = limo(root, [0, 0, 0], 0, "#1c1e26"), CZ0 = 46, CZ1 = -7.0, CO = 1.25;
  const exhaust = [0, 1, 2, 3].map(() => mist(root, [0, -10, 0], 0.5, "#d8d4dc", 0.3));
  const carAt = (u: number) => { const z = CZ0 + (CZ1 - CZ0) * (1 - (1 - cl(u)) ** 2.2), x = roadX(z) + CO; return { pos: [x, groundY(x, z), z] as V3, yaw: Math.atan2(-roadXd(z), -1), dist: Math.abs(z - CZ0) }; };
  const marks: Record<string, V3> = {
    brickPress: at(7.55, -8.4), pressTop: [P[0], P[1] + 1.8, P[2]], brickTable: at(8.8, -11.6), brickStack: [T[0], T[1] + 1.0, T[2]], gateSign: at(6.5, -5.7),
    hankYank: at(-7.9, 4.2), hankFence: at(-6.3, 3.0), vineHeap: at(-9.6, 8.6), heroFence: at(6.3, -1.2),
    fence1: at(4.9, -6.1), fence2: at(4.1, -4.8), fence3: at(5.0, -3.6), fence4: at(3.8, -2.3), fence5: at(4.6, -1.0), bbTable: at(10.55, -11.6), agentTable: at(8.65, -11.3), lawyerGate: at(6.2, -9.0), bbGate: at(7.2, -10.2),
    carStop: carAt(1).pos, agentOut: at(3.7, -7.6), agentRead: at(8.65, -11.3),
  };
  const pose = (t: number, c: Record<string, number>) => {
    const pr = c.press ?? 0, cyc = pr % 1;
    press.crank.rotation.y = pr * TAU * 2.5; press.plate.position.y = P[1] + 1.02 - 0.32 * Math.sin(Math.PI * cyc) ** 0.6;
    const ju = c.juice ?? 0; press.stream!.visible = ju > 0.02; press.stream!.scale.set(1, 0.6 + 0.4 * Math.sin(t * 9) ** 2, 1);
    const nb = Math.round(c.bricks ?? 18); bricks.forEach((m, i) => (m.visible = i < nb));
    const sp = c.spread ?? 0; spread.forEach((g, i) => { const k = cl(sp * 1.6 - (i / Math.max(1, spread.length)) * 0.6); g.visible = k > 0.001; g.position.y = -2.3 * (1 - k * k * (3 - 2 * k)); }); // rows rise out of the ground
    const u = c.agentCar ?? -1; car.g.visible = u >= 0;
    if (u >= 0) { const q = carAt(u); car.g.position.set(...q.pos); car.g.rotation.y = q.yaw; car.set(q.dist, t, { bob: u > 0.001 && u < 0.999 ? 0.8 : 0.45, lights: 0 }); }
    // remake: the parked sedan idles (engine running): exhaust puffs drift up from the tailpipe
    exhaust.forEach((m, i) => { const on = u >= 0.98 ? 1 : 0, k = (t * 0.55 + i / exhaust.length) % 1; m.visible = on > 0;
      if (!on) return; const back = 2.9 + k * 0.9, side = -0.45; const yaw = car.g.rotation.y;
      m.position.set(car.g.position.x + side * Math.cos(yaw) - back * Math.sin(yaw), car.g.position.y + 0.32 + k * 0.9, car.g.position.z - side * Math.sin(yaw) - back * Math.cos(yaw));   // local (side, -back): behind the rear bumper
      (m.material as THREE.SpriteMaterial).opacity = 0.38 * Math.sin(Math.PI * k); const sc = 0.35 + k * 0.9; m.scale.set(sc, sc * 0.75, 1); });
  };
  return { marks, pose, car };
};
// ---------------- the set ----------------
export const road = (o: { vine?: boolean } = {}): SetDef => {
  // VINE = "He Labeled Grape Bricks" variant (California, 1920s): vine rows instead of the corn + the orchard, a grape-press
  // yard by the farm gate, no marathon signs, a black 1920s sedan for the federal agents instead of the 1904 cars.
  const VINE = !!(o && (o as { vine?: boolean }).vine);
  const root = new THREE.Group(), b = new Batch(), r = rng(1904);
  const crowns: Crown[] = [];
  // ======== terrain (one tensor grid, dense near the road) ========
  {
    const axis = (sp: [number, number, number][]) => { const o: number[] = []; for (const [a, c, s] of sp) for (let v = a; v < c - 1e-6; v += s) o.push(v); o.push(sp[sp.length - 1][1]); return o; };
    const XS = axis([[-340, -130, 12], [-130, -48, 3], [-48, -14, 1.0], [-14, 14, 0.5], [14, 48, 1.0], [48, 130, 3], [130, 340, 12]]);
    const ZS = axis([[-430, -150, 12], [-150, -132, 3], [-132, 132, 0.9], [132, 160, 3], [160, 430, 12]]);
    const nx = XS.length, nz = ZS.length, pos = new Float32Array(nx * nz * 3), colA = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
    const cA = new THREE.Color("#8fae50"), cB = new THREE.Color("#669a42"), cC = new THREE.Color("#bab460"), cV = new THREE.Color("#b6b45e"), cD = new THREE.Color("#729a42"), tmp = new THREE.Color();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = XS[i], z = ZS[j], k = j * nx + i, d = Math.abs(x - roadX(z));
      pos[k * 3] = x; pos[k * 3 + 1] = groundY(x, z); pos[k * 3 + 2] = z; uv[k * 2] = x / 6; uv[k * 2 + 1] = z / 6;
      const n = 0.5 + 0.25 * Math.sin(x * 0.11 + z * 0.07) + 0.25 * Math.sin(x * 0.031 - z * 0.05 + 1.3), n2 = 0.5 + 0.5 * Math.sin(x * 0.27 + Math.sin(z * 0.2) * 2);
      tmp.copy(cA).lerp(cB, n * 0.7).lerp(cC, Math.max(0, n2 - 0.6) * 0.8);
      tmp.lerp(cV, 1 - sm((d - 3.6) / 3.0));                          // dry verges by the dust
      if (ditchAt(x, z) < -0.05) tmp.lerp(cD, 0.6);                   // greener in the ditch
      colA[k * 3] = tmp.r; colA[k * 3 + 1] = tmp.g; colA[k * 3 + 2] = tmp.b;
    }
    const idx: number[] = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, c = a + nx; idx.push(a, c, a + 1, a + 1, c, c + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(colA, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const gm = new THREE.Mesh(geo, lam("rdTerrain", () => ({ map: grassTex(), vertexColors: true }))); gm.receiveShadow = true; gm.matrixAutoUpdate = false; root.add(gm);
  }
  // ======== the road ribbon (z 270 .. -270) ========
  {
    const offs = [-3.7, -2.6, -1.3, 0, 1.3, 2.6, 3.7], pos: number[] = [], uv: number[] = [], idx: number[] = [], Z0 = 270, Z1 = -270, st = 1.0, nr = Math.round((Z0 - Z1) / st);
    for (let j = 0; j <= nr; j++) { const z = Z0 - j * st, x0 = roadX(z), y0 = roadY(z); offs.forEach((o) => { pos.push(x0 + o, y0 + 0.03 + 0.05 * (1 - (o / 3.7) ** 2), z); uv.push((o + 3.7) / 7.4, (j * st) / 8); }); }
    const n = offs.length; for (let j = 0; j < nr; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, c = a + n; idx.push(a, a + 1, c, a + 1, c + 1, c); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const rm = new THREE.Mesh(geo, mat("rdRoadM", () => twoTone(new THREE.MeshLambertMaterial({ map: roadTex(), alphaTest: 0.5 })))); rm.receiveShadow = true; rm.matrixAutoUpdate = false; root.add(rm);
  }
  // ======== fields (draped parcels), hedgerows, far trees, haystacks ========
  const fm = (k: Field) => tex("field" + k, () => fieldTex(k));
  const near: [number, number, number, number, number, Field][] = [ // centre (offset, z), size (w along x, d along z), angle, kind
    [-40, 60, 60, 46, 0, "wheat"], [-46, 116, 70, 46, 0.08, "mown"], [-52, -21, 72, 38, 0.04, "rows"], [-44, -84, 62, 52, -0.06, "wheat"],
    [40, 59, 58, 44, 0, "mown"], [44, 116, 64, 44, -0.08, "plow"], [52, -12, 40, 44, 0, "pasture"], [44, -90, 62, 56, 0.08, "rows"],
    [18.8, -36.3, 24.4, 31.6, 0, "soil"],
  ];
  for (const [o, z, w, d, a, k] of near) drape(b, fm(k), roadX(z) + o, z, w, d, a, 0.06, 2.0);
  { // far patchwork
    const kinds: Field[] = ["wheat", "rows", "mown", "plow", "corn", "pasture", "wheat", "mown"], rr = rng(77);
    for (let cx = -315; cx <= 315; cx += 70) for (let cz = -400; cz <= 400; cz += 70) {
      if (Math.abs(cx) < 80 && Math.abs(cz) < 150) continue;
      drape(b, fm(kinds[Math.floor(rr() * kinds.length)]), cx + (rr() - 0.5) * 10, cz + (rr() - 0.5) * 10, 56 + rr() * 8, 56 + rr() * 8, (rr() - 0.5) * 0.24, 0.12, 9);
    }
  }
  const hedge = tex("hedge", () => leafTex("rdHedge", "#3f8a3a", "#62ac48", "#2e6e34")), farLeaf = tex("farLeaf", () => leafTex("rdFar", "#4a9640", "#70b450", "#357a36"));
  { const rr = rng(88); // hedgerows on the patchwork borders + tree clumps
    for (let k = 0; k < 26; k++) {
      const vert = rr() < 0.5, c = -315 + Math.floor(rr() * 10) * 70 + 35, s0 = -390 + rr() * 500, L = 60 + rr() * 140;
      for (let s = s0; s < s0 + L; s += 3.2) { const x = vert ? c : s, z = vert ? s : c; if (Math.abs(x - roadX(z)) < 40 && Math.abs(z) < 160) continue; bush(b, hedge, [x, groundY(x, z), z], 1.6 + rr() * 1.1); }
    }
    for (let k = 0; k < 70; k++) { const a = rr() * TAU, d = 90 + rr() * 220, x = Math.cos(a) * d, z = Math.sin(a) * d * 1.3; if (Math.abs(x - roadX(z)) < 45 && Math.abs(z) < 160) continue; const p: V3 = [x, groundY(x, z), z], h = 6 + rr() * 6; b.add(new THREE.CylinderGeometry(0.25, 0.4, h * 0.5, 6).translate(x, p[1] + h * 0.25, z), tex("bark", barkTex)); for (let i = 0; i < 3; i++) bush(b, farLeaf, [x + (rr() - 0.5) * 3, p[1] + h * 0.45, z + (rr() - 0.5) * 3], h * 0.32); }
    const stacks: [number, number, number][] = [[14, 52, 1], [22, 66, 1.1], [33, 48, 0.9], [27, 76, 1], [-30, 102, 1], [-48, 112, 1.1], [16, 108, 0.9], [-34, -80, 1], [36, -96, 1], [48, -70, 0.9]];
    for (const [o, z, s] of stacks) haystack(b, at(o, z), s);
    for (let k = 0; k < 30; k++) { const x = (rr() - 0.5) * 520, z = (rr() - 0.5) * 700; if (Math.abs(x - roadX(z)) < 60) continue; haystack(b, [x, groundY(x, z), z], 0.9 + rr() * 0.3); }
  }
  // distant rings: green hills (hide the terrain edge) and blue hills on the horizon
  {
    const ringHill = (rad: number, n: number, sy: [number, number], colr: string, ph: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + ph, x = Math.cos(a) * rad, z = Math.sin(a) * rad * 1.18, sx = rad * (0.32 + 0.12 * Math.sin(i * 2.7)), syy = sy[0] + (sy[1] - sy[0]) * (0.5 + 0.5 * Math.sin(i * 1.9 + ph));
        const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12, 0, TAU, 0, Math.PI / 2), lam("rdHill" + colr, () => ({ map: (() => { const t = ctex("rdHillT" + colr, 512, 256, (g, rq) => { g.fillStyle = colr; g.fillRect(0, 0, 512, 256); const c = new THREE.Color(colr); for (let k = 0; k < 160; k++) { const xx = rq() * 512, yy = rq() * 256, rr2 = 4 + rq() * 9; g.fillStyle = "#" + c.clone().multiplyScalar(0.78 + rq() * 0.12).getHexString(); g.beginPath(); g.arc(xx, yy, rr2, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,230,0.25)"; g.beginPath(); g.arc(xx - rr2 * 0.3, yy - rr2 * 0.3, rr2 * 0.5, 0, TAU); g.fill(); } for (let k = 0; k < 10; k++) { g.fillStyle = "rgba(255,240,170,0.25)"; g.fillRect(rq() * 512, rq() * 256, 40 + rq() * 60, 20 + rq() * 30); } }); t.repeat.set(4, 1); return t; })() })));
        m.scale.set(sx, syy, sx * 0.55); m.position.set(x, -2, z); m.rotation.y = -a + Math.PI / 2; root.add(m);
      }
    };
    ringHill(372, 22, [16, 34], "#7fb04c", 0.1);
    ringHill(520, 18, [45, 95], "#6f92c8", 0.3);
    ringHill(470, 16, [26, 52], "#6fa08a", 0.05);
  }
  // ======== fences + telegraph line ========
  for (const f of FENCES) fence(b, f);
  { const wood = tex("fence", () => beamHD()); // orchard enclosure (z 31 / z 0 / offset -32)
    const run = (a: V3, c: V3) => { const A = V(...a), C = V(...c), n = Math.round(A.distanceTo(C) / 2.6); let prev = A; for (let i = 1; i <= n; i++) { const p = A.clone().lerp(C, i / n); p.y = groundY(p.x, p.z); b.add(new THREE.BoxGeometry(0.15, 1.42, 0.15).translate(p.x, p.y + 0.66, p.z), wood); for (const h of [0.38, 0.8, 1.2]) b.add(beamGeo(V(prev.x, prev.y + h, prev.z), V(p.x, p.y + h, p.z), 0.09, 0.11), wood); prev = p; } };
    run(at(-5.6, 31), at(-32, 31)); run(at(-5.6, 0), at(-32, 0)); run(at(-32, 31), at(-32, 0));
  }
  const wires: { crows: THREE.Group[] } = { crows: [] };
  {
    const pole = tex("pole", () => beamHD()), wireM = col("#3a3248"), glass = shiny("insul", "#7ad0c8", 90);
    const tops: THREE.Vector3[][] = [];
    for (const p of POLES) {
      b.add(new THREE.CylinderGeometry(0.11, 0.15, 7.8, 8).translate(p[0], p[1] + 3.9, p[2]), pole);
      b.add(new THREE.BoxGeometry(0.14, 0.14, 2.2).translate(p[0], p[1] + 7.0, p[2]), pole);
      b.add(rodGeo([p[0], p[1] + 6.2, p[2] - 0.7], [p[0], p[1] + 6.95, p[2]], 0.03), wireM);
      const row: THREE.Vector3[] = [];
      for (const dz of [-0.95, -0.4, 0.4, 0.95]) { b.add(new THREE.CylinderGeometry(0.045, 0.06, 0.16, 8).translate(p[0], p[1] + 7.15, p[2] + dz), glass); row.push(V(p[0], p[1] + 7.22, p[2] + dz)); }
      tops.push(row);
    }
    for (let i = 0; i < tops.length - 1; i++) for (let k = 0; k < 4; k++) {
      const A = tops[i][k], C = tops[i + 1][k], pts = Array.from({ length: 12 }, (_, s) => { const u = s / 11; return A.clone().lerp(C, u).add(V(0, -1.1 * 4 * u * (1 - u), 0)); });
      b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.016, 4, false), wireM);
      if (i === 3 && k === 1) for (const u of [0.32, 0.4, 0.62]) { // three crows perched on the wire over the dust zone
        const p = A.clone().lerp(C, u).add(V(0, -1.1 * 4 * u * (1 - u), 0)), g = new THREE.Group(); g.position.copy(p); root.add(g);
        const dk = col("#2e2a40"); const bd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8).scale(0.8, 0.85, 1.4), dk); bd.position.y = 0.11; g.add(bd);
        const hd = new THREE.Group(); hd.position.set(0, 0.24, 0.12); g.add(hd); hd.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), dk)); const bk = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 6).rotateX(Math.PI / 2), col("#4a4458")); bk.position.z = 0.09; hd.add(bk);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.18), dk); tl.position.set(0, 0.07, -0.2); tl.rotation.x = 0.5; g.add(tl);
        g.rotation.y = u * 6; g.userData.hd = hd; g.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); wires.crows.push(g);
      }
    }
  }
  // ======== 1 WELL ========
  const W = WELL, well = { bucket: null as THREE.Group | null, rope: null as THREE.Mesh | null, crank: null as THREE.Group | null };
  {
    const stone = tex("wellStone", () => stoneHD("rdWellStone", ["#d8ccc0", "#cbbcb0", "#e2d8cc", "#bfb2aa"], "#8f8296")), cap = tex("wellCap", () => stoneHD("rdWellCap", ["#e8dccd", "#ddd0c0", "#f0e6d8", "#d2c4b4"], "#9a8c98"));
    const wood = tex("wellWood", () => beamHD()), shingle = tex("wellRoof", () => roofHD("#b4664a")), water = shiny("wellWater", "#2c4a8a", 90);
    // flagstone apron (reads as a circle from above)
    { const t = ctex("rdApron", 512, 512, (g, rq) => { g.fillStyle = "#b8a49a"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 70; i++) { const x = rq() * 512, y = rq() * 512, rr = 26 + rq() * 30; g.fillStyle = ["#e2d4c4", "#d6c6b4", "#ecdfcf", "#cfbcae"][i % 4]; g.beginPath(); for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU + rq() * 0.4; g.lineTo(x + Math.cos(a) * rr * (0.8 + rq() * 0.3), y + Math.sin(a) * rr * (0.8 + rq() * 0.3)); } g.closePath(); g.fill(); g.strokeStyle = "rgba(120,100,120,0.5)"; g.lineWidth = 3; g.stroke(); } });
      const ap = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40).rotateX(-Math.PI / 2), lam("rdApronM", () => ({ map: t }))); ap.position.set(W[0], W[1] + 0.035, W[2]); ap.receiveShadow = true; root.add(ap);
      const wet = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24).rotateX(-Math.PI / 2), mat("rdWet", () => new THREE.MeshBasicMaterial({ color: "#6a5a70", transparent: true, opacity: 0.25, depthWrite: false }))); wet.position.set(W[0] + 1.55, W[1] + 0.045, W[2] + 0.5); wet.layers.set(NOINK); root.add(wet); }
    // stone drum (lathe: outer wall, rounded cap, inner wall)
    const prof = [V(0.7, -0.2, 0), V(WELL_R, 0, 0), V(WELL_R, 0.72, 0), V(WELL_R + 0.06, 0.78, 0), V(WELL_R + 0.04, 0.88, 0), V(0.72, 0.9, 0), V(0.7, 0.82, 0), V(0.7, 0.1, 0)].map((v) => new THREE.Vector2(v.x, v.y));
    const drum = new THREE.LatheGeometry(prof.slice(0, 3), 40); b.add(drum.translate(W[0], W[1], W[2]), stone);
    b.add(new THREE.LatheGeometry(prof.slice(2), 40).translate(W[0], W[1], W[2]), cap);
    b.add(new THREE.CircleGeometry(0.71, 28).rotateX(-Math.PI / 2).translate(W[0], W[1] + 0.32, W[2]), water);
    // posts, roof (ridge along z), windlass + crank
    for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.14, 2.45, 0.14).translate(W[0], W[1] + 1.2, W[2] + s * 0.86), wood);
    b.add(new THREE.BoxGeometry(0.16, 0.12, 2.1).translate(W[0], W[1] + 2.42, W[2]), wood);
    for (const s of [-1, 1]) { const sl = new THREE.BoxGeometry(0.78, 0.05, 2.15); sl.rotateZ(s * 0.9); sl.translate(W[0] + s * 0.26, W[1] + 2.72, W[2]); b.add(sl, shingle); }
    b.add(new THREE.BoxGeometry(0.1, 0.08, 2.2).translate(W[0], W[1] + 3.02, W[2]), wood);
    const crank = new THREE.Group(); crank.position.set(W[0], W[1] + 1.55, W[2]); root.add(crank); well.crank = crank;
    { const cb = new Batch(); cb.add(new THREE.CylinderGeometry(0.11, 0.11, 1.62, 12).rotateX(Math.PI / 2), wood); cb.add(new THREE.CylinderGeometry(0.135, 0.135, 0.5, 12).rotateX(Math.PI / 2), tex("rope", () => weaveTex("#c9a870"))); cb.add(new THREE.BoxGeometry(0.06, 0.4, 0.05).translate(0, -0.18, 0.95), col("#4a4050")); cb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6).rotateX(Math.PI / 2).translate(0, -0.36, 1.06), wood); cb.build(crank); }
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 5).translate(0, -0.5, 0), col("#c9a870")); rope.position.set(W[0], W[1] + 1.44, W[2]); rope.castShadow = true; root.add(rope); well.rope = rope;
    const bucket = new THREE.Group(); root.add(bucket); well.bucket = bucket;
    { const bb = new Batch(); bb.add(new THREE.CylinderGeometry(0.17, 0.13, 0.28, 14, 1, true).translate(0, -0.18, 0), mat("rdBucketM", () => twoTone(new THREE.MeshLambertMaterial({ map: beamHD(), side: THREE.DoubleSide })))); for (const y of [-0.08, -0.27]) bb.add(new THREE.TorusGeometry(y > -0.1 ? 0.168 : 0.135, 0.012, 4, 18).rotateX(Math.PI / 2).translate(0, y, 0), col("#5a5266")); bb.add(new THREE.TorusGeometry(0.17, 0.008, 4, 16, Math.PI).translate(0, -0.04, 0), col("#5a5266")); bb.add(new THREE.CircleGeometry(0.15, 14).rotateX(-Math.PI / 2).translate(0, -0.1, 0), water); bb.build(bucket); }
    // trough, cups, churns, bench, sign
    const T = TROUGH, boards = tex("trough", () => beamHD());
    b.add(boxGeo(V(T[0] - 0.32, T[1], T[2] - 1.15), V(T[0] + 0.32, T[1] + 0.62, T[2] + 1.15)), boards);
    b.add(new THREE.PlaneGeometry(0.52, 2.2).rotateX(-Math.PI / 2).translate(T[0], T[1] + 0.56, T[2]), shiny("troughWater", "#5aa8d8", 90));
    for (const s of [-1, 1]) b.add(boxGeo(V(T[0] - 0.4, T[1], T[2] + s * 1.0 - 0.06), V(T[0] + 0.4, T[1] + 0.3, T[2] + s * 1.0 + 0.06)), boards);
    const tin = shiny("tin", "#c9d0dc", 80);
    for (const [dx, dz] of [[-0.2, 0.62], [0.15, 0.74], [0.0, -0.55]]) b.add(new THREE.CylinderGeometry(0.045, 0.038, 0.1, 10).translate(W[0] + dx * 1, W[1] + 0.95, W[2] + dz), tin);   // tin cups on the rim
    for (const [dx, dz] of [[2.1, -1.6], [2.4, -1.25]]) { const p = [W[0] + dx, W[1], W[2] + dz]; b.add(new THREE.CylinderGeometry(0.2, 0.22, 0.6, 14).translate(p[0], p[1] + 0.3, p[2]), tin); b.add(new THREE.CylinderGeometry(0.12, 0.2, 0.16, 14).translate(p[0], p[1] + 0.68, p[2]), tin); b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.07, 10).translate(p[0], p[1] + 0.79, p[2]), tin); }
    b.add(boxGeo(V(W[0] + 2.1, W[1] + 0.42, W[2] + 0.9), V(W[0] + 2.45, W[1] + 0.48, W[2] + 2.5)), boards);
    for (const z of [1.05, 2.35]) b.add(boxGeo(V(W[0] + 2.12, W[1], W[2] + z - 0.05), V(W[0] + 2.43, W[1] + 0.42, W[2] + z + 0.05)), boards);
    signPost(b, root, "water", ["WATER", "1 CUP ONLY"], SIGN_W, -Math.PI / 4, 1.25, 0.66, 1.45, { cup: true });
    crowns.push(shadeTree(b, root, OAK_W, 9.5, 11));
    // a lantern hook + a gourd dipper on the post
    b.add(new THREE.SphereGeometry(0.1, 10, 8).scale(1, 1.3, 1).translate(W[0] + 0.12, W[1] + 1.95, W[2] + 0.86), col("#d8a24a"));
  }
  // ======== 2 DUST zone ========
  {
    if (!VINE) signPost(b, root, "mile9", ["MILE 9"], MILE9, Math.PI / 2 + 0.6, 0.62, 0.3, 0.95, { bg: "#f6f1e6", fg: "#24305a" });
    // wheelbarrow (points +z, the farmer stands behind its handles at z - 1.6) loaded with hay and two pumpkins
    const B = BARROW, wood = tex("barrow", () => beamHD()), wb = new Batch();
    wb.add(boxGeo(V(-0.34, 0.42, -0.5), V(0.34, 0.47, 0.42)), wood);
    for (const s of [-1, 1]) wb.add(beamGeo(V(s * 0.36, 0.48, -0.5), V(s * 0.42, 0.78, 0.44), 0.05, 0.36), wood);
    wb.add(beamGeo(V(-0.36, 0.62, 0.48), V(0.36, 0.62, 0.48), 0.05, 0.3), wood);
    for (const s of [-1, 1]) { wb.add(beamGeo(V(s * 0.22, 0.27, 0.72), V(s * 0.3, 0.68, -1.25), 0.06, 0.06), wood); wb.add(beamGeo(V(s * 0.26, 0.45, -0.45), V(s * 0.28, 0.0, -0.55), 0.05, 0.05), wood); }
    wb.add(new THREE.TorusGeometry(0.24, 0.035, 6, 20).rotateY(Math.PI / 2).translate(0, 0.27, 0.74), col("#4a4050"));
    for (let k = 0; k < 8; k++) wb.add(new THREE.BoxGeometry(0.02, 0.44, 0.03).rotateX((k / 8) * Math.PI).translate(0, 0.27, 0.74), wood);
    wb.add(new THREE.SphereGeometry(0.42, 12, 8).scale(1, 0.55, 1.3).translate(0, 0.62, -0.05), tex("straw", strawTex));
    for (const [x, z] of [[0.12, 0.18], [-0.14, -0.28]]) { wb.add(new THREE.SphereGeometry(0.17, 12, 8).scale(1, 0.8, 1).translate(x, 0.86, z), col("#ee8a2a")); wb.add(new THREE.CylinderGeometry(0.02, 0.025, 0.07, 5).translate(x, 1.0, z), col("#5a7a34")); }
    const bg = new THREE.Group(); bg.position.set(...B); bg.rotation.y = Math.atan2(-roadXd(B[2]), 1) + 0.12; root.add(bg); wb.build(bg);
    // an old cart wheel leaning on the left fence, a pitchfork on a haystack, a water jug by the right fence
    const cw = new THREE.Group(), cwp = at(-5.4, 53); cw.position.set(cwp[0], cwp[1] + 0.58, cwp[2]); cw.rotation.set(0, 0, -0.22); root.add(cw);
    { const cb = new Batch(); cb.add(new THREE.TorusGeometry(0.6, 0.05, 6, 24).rotateY(Math.PI / 2), wood); for (let k = 0; k < 6; k++) cb.add(new THREE.BoxGeometry(0.03, 1.14, 0.05).rotateX((k / 6) * Math.PI), wood); cb.add(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 10).rotateZ(Math.PI / 2), wood); cb.build(cw); }
    const fk = at(14, 52); b.add(rodGeo([fk[0] - 0.9, fk[1] + 0.2, fk[2] + 0.4], [fk[0] - 1.25, fk[1] + 2.0, fk[2] + 0.9], 0.03), wood);
  }
  // ======== 3 ORCHARD ========
  const dapple: THREE.Mesh[] = [];
  if (!VINE) {
    for (const t of APPLES) crowns.push(appleTree(b, root, at(t.off, t.z), t.h, t.seed));
    // ladder against the ladder tree (road side), baskets, fallen + rotten apples
    const L0 = V(...at(-15.5, 24.2)), L1 = V(...at(-17.1, 25.2)).add(V(0, 3.2, 0)), wood = tex("ladder", () => beamHD());
    const side = V(-(L1.z - L0.z), 0, L1.x - L0.x).normalize().multiplyScalar(0.24);
    for (const s of [-1, 1]) b.add(beamGeo(L0.clone().addScaledVector(side, s), L1.clone().addScaledVector(side, s), 0.06, 0.08), wood);
    for (let k = 1; k < 10; k++) { const p = L0.clone().lerp(L1, k / 10); b.add(beamGeo(p.clone().addScaledVector(side, -1.1), p.clone().addScaledVector(side, 1.1), 0.04, 0.04), wood); }
    for (const [o, z, rad] of [[-14.6, 26.9, 0.3], [-14.4, 23.0, 0.26], [-8.3, 21.4, 0.28], [-19.5, 21.5, 0.3]] as [number, number, number][]) {
      const p = at(o, z); basket(root, p, rad, 0.3, "#c99a52");
      for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(0.075, 8, 6).translate(p[0] + (r() - 0.5) * rad, p[1] + 0.3 + r() * 0.06, p[2] + (r() - 0.5) * rad), shiny("apple", "#e03a32", 70));
    }
    const rot = col("#8a5a3e"), rotSpot = col("#5a3e3a");
    for (let k = 0; k < 70; k++) {
      const t = APPLES[k % APPLES.length], a = r() * TAU, d = 0.6 + r() * 2.2, p = at(t.off + Math.cos(a) * d, t.z + Math.sin(a) * d), rotten = k % 3 === 0;
      if (Math.hypot(p[0] - (roadX(13.6) - 12.6), p[2] - 13.6) < 1.4) continue; // keep the nap patch clear
      b.add(new THREE.SphereGeometry(0.075, 8, 6).scale(1, rotten ? 0.75 : 0.9, 1).translate(p[0], p[1] + 0.06, p[2]), rotten ? rot : shiny("apple", "#e03a32", 70));
      if (rotten) b.add(new THREE.SphereGeometry(0.04, 6, 5).translate(p[0] + 0.04, p[1] + 0.09, p[2]), rotSpot);
    }
    for (let k = 0; k < 9; k++) { const p = at(-7.6 + (r() - 0.5) * 2.4, 19.2 + (r() - 0.5) * 3); b.add(new THREE.SphereGeometry(0.075, 8, 6).scale(1, 0.7, 1).translate(p[0], p[1] + 0.05, p[2]), rot); } // rotten heap by the gap
    // dappled sun flecks under the nap tree and the gap tree (lit spots on the shade)
    for (const [o, z, s] of [[-13.4, 12.6, 5.2], [-9.6, 19.5, 4.4]] as [number, number, number][]) { const p = at(o, z), m = new THREE.Mesh(new THREE.PlaneGeometry(s, s).rotateX(-Math.PI / 2), mat("rdDappleM", () => new THREE.MeshBasicMaterial({ map: dappleTex(), transparent: true, opacity: 0.3, depthWrite: false, color: new THREE.Color(1.0, 0.95, 0.62) }))); m.position.set(p[0], p[1] + 0.05, p[2]); m.layers.set(NOINK); root.add(m); dapple.push(m); }
  }
  // the cow (inside the orchard fence, grazing near the road)
  const cow = { g: new THREE.Group(), head: new THREE.Group(), tail: new THREE.Group() };
  {
    const p = at(-8.4, 8.6); cow.g.position.set(...p); cow.g.rotation.y = 0.6; root.add(cow.g);
    const hide = tex("cow", cowTex), pink = col("#f2a6b0"), horn = col("#f2e6c8"), hoof = col("#3a3048");
    const cb = new Batch();
    cb.add(new RoundedBoxGeometry(0.75, 0.75, 1.7, 3, 0.28).translate(0, 1.05, 0), hide);
    for (const [x, z] of [[-0.25, 0.6], [0.25, 0.6], [-0.25, -0.6], [0.25, -0.6]]) { cb.add(new THREE.CylinderGeometry(0.09, 0.08, 0.72, 8).translate(x, 0.36, z), hide); cb.add(new THREE.CylinderGeometry(0.085, 0.09, 0.1, 8).translate(x, 0.05, z), hoof); }
    cb.add(new THREE.SphereGeometry(0.17, 10, 8).translate(0, 0.66, -0.35), pink);
    cb.build(cow.g);
    cow.head.position.set(0, 1.25, 0.82); cow.g.add(cow.head);
    const hb = new Batch(); hb.add(new RoundedBoxGeometry(0.38, 0.4, 0.55, 2, 0.14).translate(0, -0.12, 0.25), hide); hb.add(new RoundedBoxGeometry(0.34, 0.24, 0.22, 2, 0.09).translate(0, -0.24, 0.52), pink);
    for (const s of [-1, 1]) { hb.add(new THREE.ConeGeometry(0.035, 0.18, 6).rotateZ(-s * 1.1).translate(s * 0.22, 0.12, 0.12), horn); hb.add(new THREE.SphereGeometry(0.08, 8, 6).scale(1.4, 0.5, 0.9).translate(s * 0.27, 0.0, 0.12), hide); hb.add(new THREE.SphereGeometry(0.035, 8, 6).translate(s * 0.13, 0.0, 0.42), col("#2e2840")); }
    hb.build(cow.head);
    cow.tail.position.set(0, 1.3, -0.85); cow.g.add(cow.tail);
    const tb = new Batch(); tb.add(new THREE.CylinderGeometry(0.025, 0.02, 0.8, 5).translate(0, -0.4, 0), hide); tb.add(new THREE.SphereGeometry(0.07, 6, 5).scale(1, 1.6, 1).translate(0, -0.82, 0), hoof); tb.build(cow.tail);
  }
  // ======== 4 FARM ========
  const farm = { rotor: null as THREE.Group | null, vane: null as THREE.Group | null, tail: null as THREE.Group | null, gateBunt: null as ReturnType<typeof bunting> | null, flag: null as ReturnType<typeof cloth> | null, smoke: [] as THREE.Sprite[], chickens: [] as { g: THREE.Group; head: THREE.Group; home: V3; s: number }[] };
  {
    const barnM = tex("barn", barnTex), white = col("#f4efe6"), roofB = tex("barnRoof", () => roofHD("#6c7a9c", true)), clap = tex("clap", clapTex), roofH = tex("houseRoof", () => roofHD("#9a4a44"));
    // --- farmhouse (front porch toward the road = -x) ---
    { const H = HOUSE, x0 = H[0] - 4, x1 = H[0] + 4, z0 = H[2] - 3.5, z1 = H[2] + 3.5, y = H[1], h = 5.6;
      b.add(boxGeo(V(x0, y - 0.3, z0), V(x1, y + 0.55, z1)), tex("found", () => stoneHD("rdFound", ["#c8b8b0", "#b8a8a4", "#d6c8bc", "#aea0a0"], "#887a8c")));
      b.add(boxGeo(V(x0, y + 0.55, z0), V(x1, y + h, z1), 4), clap);
      for (const s of [-1, 1]) { const zz = s > 0 ? z1 : z0, g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y + h, zz, x1, y + h, zz, H[0], y + h + 2.6, zz], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 1, 0.65], 2)); if (s < 0) g.setIndex([0, 2, 1]); else g.setIndex([0, 1, 2]); g.computeVertexNormals(); b.add(g, clap); }
      for (const s of [-1, 1]) { const sl = new THREE.BoxGeometry(5.2, 0.12, 7.6); sl.rotateZ(s * 0.575); sl.translate(H[0] + s * 2.12, y + h + 1.35, H[2]); b.add(sl, roofH); }
      b.add(boxGeo(V(H[0] + 1.6, y + h + 0.5, H[2] - 1.9), V(H[0] + 2.3, y + h + 3.6, H[2] - 1.2)), tex("chim", () => stoneHD("rdChim", ["#c86a50", "#b85a46", "#d47a5c", "#a85044"], "#8a6a78")));
      const win = mat("rdWinM", () => twoTone(new THREE.MeshLambertMaterial({ map: winTex() }))), shut = col("#3f7a5a");
      for (const yy of [1.3, 3.7]) for (const zz of [-2.1, 2.1]) { b.add(new THREE.PlaneGeometry(0.85, 1.3).rotateY(-Math.PI / 2).translate(x0 - 0.01, y + yy + 0.6, H[2] + zz), win); for (const s of [-1, 1]) b.add(boxGeo(V(x0 - 0.06, y + yy - 0.05, H[2] + zz + s * 0.65 - 0.2), V(x0 - 0.02, y + yy + 1.25, H[2] + zz + s * 0.65 + 0.2)), shut); }
      b.add(boxGeo(V(x0 - 0.05, y + 0.55, H[2] - 0.55), V(x0 - 0.01, y + 2.75, H[2] + 0.55)), col("#4a6aa0"));
      b.add(boxGeo(V(x0 - 2.4, y + 0.3, z0 + 0.4), V(x0, y + 0.45, z1 - 0.4)), tex("porch", () => beamHD()));
      for (const zz of [z0 + 0.5, H[2] - 1.2, H[2] + 1.2, z1 - 0.5]) b.add(boxGeo(V(x0 - 2.3, y + 0.45, zz - 0.07), V(x0 - 2.16, y + 2.95, zz + 0.07)), white);
      { const sl = new THREE.BoxGeometry(2.7, 0.08, 6.4); sl.rotateZ(0.22); sl.translate(x0 - 1.15, y + 3.15, H[2]); b.add(sl, roofH); }
      for (let k = 0; k < 13; k++) b.add(boxGeo(V(x0 - 2.28, y + 0.45, z0 + 0.6 + k * 0.48), V(x0 - 2.22, y + 1.35, z0 + 0.64 + k * 0.48)), white);
      b.add(boxGeo(V(x0 - 2.3, y + 1.3, z0 + 0.5), V(x0 - 2.18, y + 1.38, z1 - 0.5)), white);
      for (let i = 0; i < 4; i++) farm.smoke.push(mist(root, [H[0] + 1.95, y + h + 3.8, H[2] - 1.55], 1.2, "#f2eef4", 0.5));
      // rocking chair + a pail on the porch
      b.add(boxGeo(V(x0 - 1.6, y + 0.85, H[2] + 1.7), V(x0 - 1.1, y + 0.9, H[2] + 2.2)), tex("porch", () => beamHD())); b.add(boxGeo(V(x0 - 1.15, y + 0.9, H[2] + 1.7), V(x0 - 1.1, y + 1.6, H[2] + 2.2)), tex("porch", () => beamHD()));
    }
    // --- the red barn (gambrel roof, door gable toward the road) ---
    { const B = BARN, x0 = B[0] - 5, x1 = B[0] + 5, z0 = B[2] - 4.5, z1 = B[2] + 4.5, y = B[1], h = 4.6;
      b.add(boxGeo(V(x0, y, z0), V(x1, y + h, z1), 4), barnM);
      const prof: [number, number][] = [[-4.5, 0], [-3.4, 2.1], [0, 3.9], [3.4, 2.1], [4.5, 0]];
      for (const xx of [x0, x1]) { const pos: number[] = [], uv: number[] = []; for (let i = 1; i < prof.length - 1; i++) { for (const k of [0, i, i + 1]) { const [zz, yy] = prof[k]; pos.push(xx, y + h + yy, B[2] + zz); uv.push((zz + 4.5) / 4, yy / 4); } } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); if (xx === x0) { const a = g.attributes.position.array as Float32Array; for (let i = 0; i < a.length; i += 9) for (let c = 0; c < 3; c++) { const tmp = a[i + 3 + c]; a[i + 3 + c] = a[i + 6 + c]; a[i + 6 + c] = tmp; } const u = g.attributes.uv.array as Float32Array; for (let i = 0; i < u.length; i += 6) for (let c = 0; c < 2; c++) { const tmp = u[i + 2 + c]; u[i + 2 + c] = u[i + 4 + c]; u[i + 4 + c] = tmp; } } g.computeVertexNormals(); b.add(g, barnM); }
      for (let i = 0; i < prof.length - 1; i++) { const [za, ya] = prof[i], [zb, yb] = prof[i + 1], A = V(x0 - 0.35, y + h + ya, B[2] + za * 1.04), C = V(x1 + 0.35, y + h + yb, B[2] + zb * 1.04); const L = Math.hypot(zb - za, yb - ya) * 1.04 + 0.1, mid = V((x0 + x1) / 2, y + h + (ya + yb) / 2 + 0.05, B[2] + (za + zb) / 2 * 1.04); const g = new THREE.BoxGeometry(x1 - x0 + 0.7, 0.12, L); g.rotateX(-Math.atan2(yb - ya, zb - za)); g.translate(mid.x, mid.y, mid.z); b.add(g, roofB); void A; void C; }
      // big door with white X braces, hayloft door with hay, trim
      const dx = x0 - 0.03, dw = 3.2;
      b.add(boxGeo(V(dx - 0.05, y, B[2] - dw / 2), V(dx, y + 3.4, B[2] + dw / 2)), barnM);
      const tr = (a: [number, number], c: [number, number], xx: number) => b.add(beamGeo(V(xx, y + a[1], B[2] + a[0]), V(xx, y + c[1], B[2] + c[0]), 0.08, 0.14), white);
      for (const s of [-1, 1]) { const zc = s * dw / 4, xx = dx - 0.1; tr([zc - dw / 4, 0.1], [zc + dw / 4, 3.3], xx); tr([zc - dw / 4, 3.3], [zc + dw / 4, 0.1], xx); tr([zc - dw / 4, 0.1], [zc - dw / 4, 3.4], xx); tr([zc + dw / 4, 0.1], [zc + dw / 4, 3.4], xx); tr([zc - dw / 4, 3.35], [zc + dw / 4, 3.35], xx); tr([zc - dw / 4, 0.08], [zc + dw / 4, 0.08], xx); }
      b.add(boxGeo(V(dx - 0.06, y + 5.0, B[2] - 0.8), V(dx, y + 6.6, B[2] + 0.8)), col("#5a2e34"));
      b.add(new THREE.SphereGeometry(0.7, 10, 6, 0, TAU, 0, Math.PI / 2).scale(0.5, 0.6, 1).translate(dx - 0.05, y + 5.0, B[2]), tex("straw", strawTex));
      for (const zz of [z0, z1]) b.add(boxGeo(V(x0 - 0.05, y, zz - 0.08), V(x0 + 0.08, y + h, zz + 0.08)), white);
      b.add(rodGeo([dx - 0.2, y + 7.4, B[2]], [dx - 0.2, y + 6.95, B[2]], 0.025), col("#3a3448"));
      // cupola + weathervane
      b.add(boxGeo(V(B[0] - 0.6, y + h + 3.8, B[2] - 0.6), V(B[0] + 0.6, y + h + 4.8, B[2] + 0.6)), white);
      b.add(new THREE.ConeGeometry(0.98, 0.8, 4).rotateY(Math.PI / 4).translate(B[0], y + h + 5.2, B[2]), roofB);
      b.add(rodGeo([B[0], y + h + 5.5, B[2]], [B[0], y + h + 6.6, B[2]], 0.025), col("#3a3448"));
      const vane = new THREE.Group(); vane.position.set(B[0], y + h + 6.3, B[2]); root.add(vane); farm.vane = vane;
      { const ro = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75).translate(0, 0.3, 0), cut("rooster", roosterTex)); ro.castShadow = true; vane.add(ro); const ar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.03), col("#3a3448")); ar.position.y = 0.0; vane.add(ar); }
      { const lt = at(9.2, -15.8); glow(root, [B[0] - 5.3, y + 3.75, B[2] + 1.9], "#ffd28a", 0.45, 0.6); b.add(new THREE.BoxGeometry(0.16, 0.24, 0.16).translate(B[0] - 5.25, y + 3.75, B[2] + 1.9), shiny("lantern", "#e8b84e", 70)); void lt; }
      // barrels + a hand pump by the barn
      for (const [o, z] of [[13.2, -8.8], [13.9, -8.4]] as [number, number][]) { const p = at(o, z); b.add(new THREE.CylinderGeometry(0.33, 0.33, 0.85, 14).translate(p[0], p[1] + 0.43, p[2]), tex("barrel", () => beamHD())); b.add(new THREE.TorusGeometry(0.335, 0.02, 4, 18).rotateX(Math.PI / 2).translate(p[0], p[1] + 0.68, p[2]), col("#4a4458")); }
    }
    // --- farm gate (gap z -6.5..-11): tall posts, an open gate, bunting + a flag ---
    { const wood = tex("fence", () => beamHD()), a = at(5.8, -6.5), c = at(5.8, -11);
      for (const p of [a, c]) b.add(new THREE.BoxGeometry(0.22, 2.7, 0.22).translate(p[0], p[1] + 1.35, p[2]), wood);
      const gg = new THREE.Group(); gg.position.set(c[0], c[1], c[2]); gg.rotation.y = 1.9; root.add(gg);
      { const gb = new Batch(); for (const h of [0.3, 0.75, 1.2]) gb.add(boxGeo(V(-0.05, h, 0), V(0.05, h + 0.12, 3.9)), wood); gb.add(beamGeo(V(0, 0.3, 0.1), V(0, 1.3, 3.8), 0.07, 0.1), wood); for (const z of [0.05, 3.85]) gb.add(boxGeo(V(-0.06, 0.2, z - 0.06), V(0.06, 1.4, z + 0.06)), wood); gb.build(gg); }
      farm.gateBunt = bunting(root, [a[0], a[1] + 2.55, a[2]], [c[0], c[1] + 2.55, c[2]], 0.5, ["#c8323a", "#f6f1e6", "#2c4a9a"], 0.42);
      const fp = new THREE.Group(); fp.position.set(a[0] + 0.15, a[1] + 2.55, a[2] + 0.1); root.add(fp);
      b.add(rodGeo([a[0] + 0.15, a[1] + 2.4, a[2] + 0.1], [a[0] + 0.15, a[1] + 3.7, a[2] + 0.1], 0.03), col("#e8e2d6"));
      const fg = new THREE.Group(); fg.position.set(a[0] + 0.15, a[1] + 3.65, a[2] + 0.1); fg.rotation.y = 0.9; root.add(fg);
      farm.flag = cloth(fg, 1.1, 0.64, mat("rdFlagM", () => twoTone(new THREE.MeshLambertMaterial({ map: flagTex(), side: THREE.DoubleSide }))), 0.12, 1.3);
    }
    // --- doghouse ---
    { const D = DOGHOUSE, red = tex("barn", barnTex), x0 = D[0] - 0.5, x1 = D[0] + 0.5, z0 = D[2] - 0.55, z1 = D[2] + 0.55, y = D[1];
      b.add(boxGeo(V(x0, y, z0), V(x1, y + 0.7, z1)), red);
      for (const s of [-1, 1]) { const sl = new THREE.BoxGeometry(0.7, 0.05, 1.3); sl.rotateX(0); sl.rotateZ(s * 0.7); sl.translate(D[0] + s * 0.25, y + 0.95, D[2]); b.add(sl, tex("houseRoof", () => roofHD("#9a4a44"))); }
      for (const xx of [x0, x1]) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([xx, y + 0.7, z0, xx, y + 0.7, z1, xx, y + 1.18, D[2]], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 0.5], 2)); g.setIndex(xx === x0 ? [0, 1, 2] : [0, 2, 1]); g.computeVertexNormals(); b.add(g, red); }
      b.add(new THREE.CircleGeometry(0.26, 16, 0, Math.PI).rotateY(-Math.PI / 2).translate(x0 - 0.01, y + 0.02, D[2]), col("#2e2638"));
      b.add(new THREE.PlaneGeometry(0.4, 0.13).rotateY(-Math.PI / 2).translate(x0 - 0.012, y + 0.84, D[2]), mat("rdRex", () => new THREE.MeshBasicMaterial({ map: boardFace("rex", ["REX"], 256, 84, { bg: "#f4e6c4" }) })));
      b.add(new THREE.CylinderGeometry(0.16, 0.13, 0.1, 12).translate(D[0] - 1.0, y + 0.05, D[2] + 0.75), shiny("dish", "#c9d0dc", 70));
    }
    // --- windmill (lattice tower, multi-blade rotor, tail vane) ---
    { const M = WINDMILL, iron = col("#7a7088"), y = M[1], top = 9.2;
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.add(rodGeo([M[0] + sx * 1.3, y, M[2] + sz * 1.3], [M[0] + sx * 0.3, y + top, M[2] + sz * 0.3], 0.05), iron);
      for (let k = 0; k < 4; k++) { const h0 = k * 2.2, h1 = h0 + 2.2, w0 = 1.3 - (h0 / top) * 1.0, w1 = 1.3 - (h1 / top) * 1.0; for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { b.add(rodGeo([M[0] + ax * w0, y + h0, M[2] + az * w0], [M[0] + bx * w1, y + h1, M[2] + bz * w1], 0.02), iron); b.add(rodGeo([M[0] + bx * w0, y + h0, M[2] + bz * w0], [M[0] + ax * w1, y + h1, M[2] + az * w1], 0.02), iron); } }
      b.add(boxGeo(V(M[0] - 0.5, y + top, M[2] - 0.5), V(M[0] + 0.5, y + top + 0.1, M[2] + 0.5)), tex("porch", () => beamHD()));
      const head = new THREE.Group(); head.position.set(M[0], y + top + 0.5, M[2]); head.rotation.y = -Math.PI / 2 - 0.3; root.add(head); farm.tail = head;
      const rotor = new THREE.Group(); rotor.position.set(0, 0, 0.55); head.add(rotor); farm.rotor = rotor;
      { const rb = new Batch(), blade = col("#e8e2d6"), bladeR = col("#c8323a"); for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU, g = new THREE.BoxGeometry(0.22, 1.25, 0.02).rotateY(0.45).translate(0, 1.05, 0).rotateZ(a); rb.add(g, k % 6 === 0 ? bladeR : blade); } for (const rr of [0.42, 1.68]) rb.add(new THREE.TorusGeometry(rr, 0.025, 4, 30), iron); rb.add(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 10).rotateX(Math.PI / 2), iron); rb.build(rotor); }
      const hb = new Batch(); hb.add(boxGeo(V(-0.12, -0.12, -0.3), V(0.12, 0.12, 0.5)), iron); hb.add(beamGeo(V(0, 0, -0.3), V(0, 0.1, -2.0), 0.05, 0.05), iron);
      hb.add(new THREE.PlaneGeometry(1.3, 0.62).rotateY(Math.PI / 2).translate(0, 0.25, -2.0), mat("rdVaneM", () => new THREE.MeshBasicMaterial({ map: boardFace("vane", ["PRAIRIE KING"], 512, 248, { bg: "#e8e2d6", fg: "#c8323a" }), side: THREE.DoubleSide })));
      hb.build(head);
      b.add(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 18, 1, true).translate(M[0] + 2.0, y + 0.4, M[2] - 1.0), mat("rdTankM", () => twoTone(new THREE.MeshLambertMaterial({ map: beamHD(), side: THREE.DoubleSide }))));
      b.add(new THREE.CircleGeometry(1.05, 18).rotateX(-Math.PI / 2).translate(M[0] + 2.0, y + 0.66, M[2] - 1.0), shiny("tankWater", "#5aa8d8", 90));
    }
    // --- chickens in the yard ---
    for (const [o, z, s] of [[8.6, -7.6, 0], [9.6, -9.0, 1], [11.6, -7.2, 2], [12.4, -9.6, 3], [8.8, -10.6, 4], [10.4, -5.6, 5]] as [number, number, number][]) {
      const g = new THREE.Group(); root.add(g); const home = at(o, z), feath = col(s % 3 === 1 ? "#c86a3a" : "#f6f2ea"), red = col("#e0343a"), yel = col("#f2b02a");
      const bd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8).scale(0.85, 0.85, 1.15), feath); bd.position.y = 0.26; g.add(bd);
      const tl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 6).rotateX(-0.9), feath); tl.position.set(0, 0.36, -0.17); g.add(tl);
      for (const sx of [-1, 1]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 4), yel); lg.position.set(sx * 0.05, 0.07, 0); g.add(lg); }
      const head = new THREE.Group(); head.position.set(0, 0.38, 0.14); g.add(head);
      head.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), feath)); const cm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.09), red); cm.position.set(0, 0.08, 0); head.add(cm);
      const bk = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 6).rotateX(Math.PI / 2), yel); bk.position.set(0, -0.01, 0.09); head.add(bk); const wt = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), red); wt.position.set(0, -0.06, 0.06); head.add(wt);
      g.traverse((q) => { (q as THREE.Mesh).castShadow = true; }); farm.chickens.push({ g, head, home, s });
    }
    // --- the cornfield (wind-swayed cards) with the dog lane, the lane's trampled dirt, the COURSE sign ---
    const lp = lanePts();
    const laneDist = (x: number, z: number) => { let d = 1e9; for (let i = 0; i < lp.length - 1; i++) { const A = lp[i], C = lp[i + 1], ax = C.x - A.x, az = C.z - A.z, t = cl(((x - A.x) * ax + (z - A.z) * az) / (ax * ax + az * az)); d = Math.min(d, Math.hypot(x - A.x - ax * t, z - A.z - az * t)); } return d; };
    if (!VINE) { const corn = new Sway(), rc = rng(1904 * 3);
    for (let z = CORN.z0; z > CORN.z1; z -= 0.56) for (let o = CORN.off0; o < CORN.off1; o += 0.82) {
      const oo = o + (rc() - 0.5) * 0.3, zz = z + (rc() - 0.5) * 0.25, x = roadX(zz) + oo; if (laneDist(x, zz) < 1.05) continue;
      const y = groundY(x, zz), h = 2.25 + rc() * 0.5, yaw = rc() * Math.PI, lean = (rc() - 0.5) * 0.12;
      corn.card(x, y, zz, 0.8, h, yaw, lean); corn.card(x, y, zz, 0.8, h, yaw + Math.PI / 2, lean);
    }
    corn.build(root, cut("corn", cornTex)); corn.mesh!.layers.set(NOINK); // a dense field of inked cards reads as a dark block in wide shots
    for (let i = 0; i < lp.length - 1; i++) { const A = lp[i], C = lp[i + 1], mid = A.clone().add(C).multiplyScalar(0.5); drape(b, tex("laneDirt", () => fieldTex("lane")), mid.x, mid.z, A.distanceTo(C) + 1.2, 1.7, Math.atan2(C.z - A.z, C.x - A.x), 0.07, 0.8, 3); }
    // broken stalks lying in the lane
    for (let k = 0; k < 6; k++) { const t = 0.35 + k * 0.1, i = Math.min(lp.length - 2, Math.floor(t * (lp.length - 1))), u = t * (lp.length - 1) - i, p = lp[i].clone().lerp(lp[i + 1], u); b.add(rodGeo([p.x - 0.5, p.y + 0.1, p.z + (k % 2 ? 0.4 : -0.4)], [p.x + 0.5, p.y + 0.12, p.z + (k % 2 ? -0.2 : 0.3)], 0.03), col("#9ab85a")); }
    signPost(b, root, "course", ["COURSE →"], COURSE_SIGN, -Math.PI / 2, 1.3, 0.42, 1.55, { arrow: true, bg: "#f4e6c4", fg: "#b42a2a" });
    (root.userData as { corn?: Sway }).corn = corn; }
  }
  const vy = VINE ? buildVineyard(b, root) : null;
  // grass tufts along verges, fence lines and the ditch (wind-swayed)
  const tufts = new Sway();
  { const rt = rng(5150);
    for (let z = 140; z > -140; z -= 0.9) for (const s of [-1, 1]) {
      const n = 1 + Math.floor(rt() * 2);
      for (let k = 0; k < n; k++) { const off = s * (s > 0 && z < DITCH.z1 + 1 && z > DITCH.z0 - 1 ? 3.5 + rt() * 2.4 : 3.4 + rt() * 2.8), zz = z + rt() * 0.9, x = roadX(zz) + off;
        if (Math.hypot(x - WELL[0], zz - WELL[2]) < 2.9) continue; if (s > 0 && zz < -19 && zz > -53 && off > 6.2) continue;
        if (Math.abs(off) < 4.6 && rt() < 0.6) continue; if (s > 0 && zz < -23.5 && zz > -31) continue; // keep the camera verge mostly clear (tufts are ~0.5 m)
        const h = 0.3 + rt() * 0.4; tufts.card(x, groundY(x, zz) - 0.03, zz, 0.55, h, rt() * Math.PI, 0); tufts.card(x, groundY(x, zz) - 0.03, zz, 0.55, h, rt() * Math.PI + 1.6, 0); }
    }
    for (let k = 0; k < 260; k++) { const z = DITCH.z0 + rt() * (DITCH.z1 - DITCH.z0), off = DITCH.off + (rt() - 0.5) * 1.7, x = roadX(z) + off; if (z > 44 && z < 54) continue; /* the ditch low-angle camera + the collapse spot */ const h = 0.45 + rt() * 0.5; tufts.card(x, groundY(x, z) - 0.03, z, 0.6, h, rt() * Math.PI, 0); }
    tufts.build(root, cut("tuft", tuftTex), false); tufts.mesh!.layers.set(NOINK);
  }
  // ======== 5 HILL ========
  const hill = { bunt: null as ReturnType<typeof bunting> | null, umb: null as THREE.Group | null };
  {
    if (!VINE) signPost(b, root, "mile19", ["MILE 19"], MILE19, Math.PI / 2 + 0.6, 0.66, 0.3, 0.95, { bg: "#f6f1e6", fg: "#24305a" });
    crowns.push(shadeTree(b, root, OAK_H, 10.5, 21), shadeTree(b, root, at(15, -132), 9, 22), shadeTree(b, root, at(-16, -60), 8, 23));
    // lemonade table for the spectators (outside the left fence), a striped umbrella, bunting on two poles
    const S = STAND, wood = tex("porch", () => beamHD());
    b.add(boxGeo(V(S[0] - 0.9, S[1] + 0.82, S[2] - 0.45), V(S[0] + 0.9, S[1] + 0.88, S[2] + 0.45)), wood);
    for (const [dx, dz] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) b.add(boxGeo(V(S[0] + dx - 0.04, S[1], S[2] + dz - 0.04), V(S[0] + dx + 0.04, S[1] + 0.82, S[2] + dz + 0.04)), wood);
    b.add(new THREE.CylinderGeometry(0.12, 0.14, 0.32, 14).translate(S[0] - 0.3, S[1] + 1.04, S[2]), mat("rdJug", () => twoTone(new THREE.MeshPhongMaterial({ color: "#f6e27a", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.85 }))));
    for (const dx of [0.1, 0.3, 0.5]) b.add(new THREE.CylinderGeometry(0.045, 0.04, 0.12, 10).translate(S[0] + dx, S[1] + 0.94, S[2] + 0.1), shiny("glass", "#e8f2f8", 90));
    const lem = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), mat("rdLemM", () => new THREE.MeshBasicMaterial({ map: boardFace("lemon", ["LEMONADE 5¢"], 768, 205, { bg: "#fff4c8", fg: "#c8323a" }) }))); lem.position.set(S[0] + 0.92, S[1] + 0.62, S[2]); lem.rotation.y = Math.PI / 2; root.add(lem);
    b.add(rodGeo([S[0], S[1], S[2]], [S[0], S[1] + 2.4, S[2]], 0.025), col("#e8e2d6"));
    const umb = new THREE.Group(); umb.position.set(S[0], S[1] + 2.35, S[2]); root.add(umb); hill.umb = umb;
    { const um = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.55, 12, 1, true).translate(0, 0, 0), mat("rdUmbM", () => twoTone(new THREE.MeshLambertMaterial({ map: ctex("rdUmbT", 512, 128, (g) => { for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? "#f6f1e6" : "#e0503a"; g.fillRect((i * 512) / 12, 0, 512 / 12 + 1, 128); } }), side: THREE.DoubleSide })))); um.castShadow = true; umb.add(um); }
    const p0 = at(-5.75, -66), p1 = at(-5.75, -77.5);
    for (const p of [p0, p1]) b.add(rodGeo([p[0], p[1], p[2]], [p[0], p[1] + 2.5, p[2]], 0.05), tex("fence", () => beamHD()));
    hill.bunt = bunting(root, [p0[0], p0[1] + 2.4, p0[2]], [p1[0], p1[1] + 2.4, p1[2]], 0.55, ["#c8323a", "#f6f1e6", "#2c4a9a", "#f2c230"], 0.45);
    for (let k = 0; k < 3; k++) haystack(b, at(18 + k * 9, -64 - k * 13), 0.95);
  }
  // ======== painted clouds (sprites far away) ========
  const clouds: THREE.Sprite[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.4, d = 520 + (i % 3) * 70, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudHD(20 + i, CLOUD_DAY), transparent: true, depthWrite: false, fog: false }));
    const w = 120 + (i % 4) * 40; s.scale.set(w, w / 2, 1); s.position.set(Math.cos(a) * d, 70 + (i % 4) * 26, Math.sin(a) * d * 1.1); s.userData = { a, d, y: s.position.y };
    s.layers.set(NOINK); s.renderOrder = -0.4; root.add(s); clouds.push(s);
  }
  const crowFlock = birds(root, 5, [-20, 22, 40], 26, "#2e2a40", 0.9);
  const crowFlock2 = birds(root, 3, [30, 26, -60], 20, "#2e2a40", 0.8);
  // ======== build statics ========
  b.build(root);
  // ======== cars ========
  const carA = autocar(root, { colour: "red", flag: "JUDGES" }), carB = autocar(root, { colour: "green" }), carC = autocar(root, { colour: "blue", door: true });
  // ======== the farm dog ========
  const dog = { g: new THREE.Group(), legs: [] as THREE.Group[], tail: new THREE.Group(), head: new THREE.Group() };
  {
    root.add(dog.g); const fur = col("#d08a48"), wht = col("#f6eee0"), dk = col("#5a3a3a");
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.5, 6, 12).rotateX(Math.PI / 2), fur); body.position.y = 0.5; dog.g.add(body);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), wht); chest.position.set(0, 0.47, 0.3); dog.g.add(chest);
    dog.head.position.set(0, 0.72, 0.42); dog.g.add(dog.head);
    dog.head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), fur)); const sn = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8).scale(1, 0.8, 1.3), wht); sn.position.set(0, -0.05, 0.15); dog.head.add(sn);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), col("#2e2638")); nose.position.set(0, -0.02, 0.27); dog.head.add(nose);
    for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6).scale(0.6, 1.4, 0.5), dk); ear.position.set(s * 0.13, 0.02, -0.02); ear.rotation.z = s * 0.4; dog.head.add(ear); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), col("#2e2638")); eye.position.set(s * 0.065, 0.05, 0.13); dog.head.add(eye); }
    for (const [x, z] of [[-0.1, 0.25], [0.1, 0.25], [-0.1, -0.25], [0.1, -0.25]]) { const lg = new THREE.Group(); lg.position.set(x, 0.42, z); dog.g.add(lg); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.4, 6).translate(0, -0.2, 0), fur); lg.add(m); const paw = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), wht); paw.position.y = -0.4; lg.add(paw); dog.legs.push(lg); }
    dog.tail.position.set(0, 0.6, -0.4); dog.g.add(dog.tail); const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.32, 6).translate(0, 0.16, 0), fur); tl.rotation.x = -0.7; dog.tail.add(tl);
    dog.g.traverse((q) => { (q as THREE.Mesh).castShadow = true; });
  }
  const dogPath = new THREE.CatmullRomCurve3(lanePts().map((p) => V(p.x, p.y, p.z))), dogHome = at(10.0, -13.5);
  // ======== dust FX ========
  const puffM = [0, 1, 2, 3].map((k) => puffTex(k));
  // each puff has a depth-only twin (alpha-tested core) so the world ink never draws through a thick dust cloud
  const allPuffs: THREE.Sprite[] = [];
  const sprite = (k: number, ro = 3) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffM[k % 4], transparent: true, depthWrite: false, fog: true, opacity: 0 })); s.layers.set(NOINK); s.renderOrder = ro; s.visible = false; root.add(s);
    const tw = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffM[k % 4], transparent: true, alphaTest: 0.6, colorWrite: false, depthWrite: true, fog: false })); tw.layers.set(NOINK); tw.renderOrder = 2.5; tw.visible = false; root.add(tw);
    s.userData.twin = tw; allPuffs.push(s); return s;
  };
  const syncTwins = () => allPuffs.forEach((s) => { const tw = s.userData.twin as THREE.Sprite; tw.visible = s.visible && s.material.opacity > 0.3; if (!tw.visible) return; tw.position.copy(s.position); tw.scale.copy(s.scale).multiplyScalar(0.92); tw.material.rotation = s.material.rotation; });
  type Trail = { which: Which; slots: { d: number; s: THREE.Sprite[]; ph: number }[]; L: number };
  const mkTrail = (which: Which, L: number, step: number): Trail => {
    const P = CARP[which], len = Math.abs(P.z1 - P.z0) + 4, slots: Trail["slots"] = [];
    for (let d = -2; d < len; d += step) slots.push({ d, s: [sprite(slots.length), sprite(slots.length + 1)], ph: slots.length * 1.37 });
    return { which, slots, L };
  };
  const trails = { A: mkTrail("A", 22, 2.1), B: mkTrail("B", 10, 1.6) };
  const bankC = at(0, 65.5), bank = Array.from({ length: 22 }, (_, i) => { const s = sprite(i, 4), rr = rng(i * 13 + 1), a = rr() * TAU, d = 0.35 + 0.65 * Math.sqrt(rr()); Object.assign(s.userData, { x: bankC[0] + Math.cos(a) * d * 4.6, y: bankC[1] + 0.4 + rr() * 2.2, z: bankC[2] + Math.sin(a) * d * 5.5, sz: 2.2 + rr() * 2.2, ph: rr() * TAU }); return s; });
  const haze = Array.from({ length: 34 }, (_, i) => { const s = sprite(i, 2), rr = rng(i * 7 + 99), z = 125 - i * 7.6, off = (rr() - 0.5) * 9; Object.assign(s.userData, { off, z, y: 0.5 + rr() * 0.6, sz: 7 + rr() * 6, ph: rr() * TAU }); return s; });
  const shimmer = [80, 68, 56, 44, 34, -52, -64, -76, -88, -100].map((z, i) => {
    const p = at(0, z), m = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.1, 12, 2), mat("rdShimM", () => new THREE.MeshBasicMaterial({ map: shimmerTex(), transparent: true, opacity: 0.1, depthWrite: false, color: new THREE.Color(1.1, 1.06, 0.98) })));
    m.position.set(p[0], p[1] + 0.75, p[2]); m.rotation.y = Math.atan2(-roadXd(z), 1) * 0; m.layers.set(NOINK); m.renderOrder = 2; root.add(m); m.userData = { base: (m.geometry.attributes.position.array as Float32Array).slice(), ph: i * 1.7 }; return m;
  });
  // ======== marks + cams ========
  const seatsB = roadSeats("B", 0.5), seatsA = roadSeats("A", 0.6);
  const ring = (k: number): V3 => { const a = Math.PI + (k - 2.5) * 0.5, d = 1.62; const x = W[0] + Math.cos(a) * d, z = W[2] + Math.sin(a) * d; return [x, groundY(x, z) + 0.035, z]; };
  const marks: Record<string, V3> = {
    // 1 well
    well: WELL, wellDrinker: [W[0] - 1.25, W[1] + 0.035, W[2] + 0.05], wellCrowd1: ring(0), wellCrowd2: ring(1), wellCrowd3: ring(2), wellCrowd4: ring(3), wellCrowd5: ring(4), wellCrowd6: [W[0] + 0.6, W[1] + 0.035, W[2] + 1.6],
    wellTrough: [TROUGH[0] - 0.75, TROUGH[1] + 0.035, TROUGH[2] + 0.2], wellSign: SIGN_W, wellBench: [W[0] + 2.27, W[1] + 0.48, W[2] + 1.7],
    // 2 dust
    dustPack1: at(-1.5, 66.8), dustPack2: at(-0.3, 65.2), dustPack3: at(1.0, 66.0), dustPack4: at(0.1, 63.6), dustRunner: at(2.0, 52.6),
    ditchEdge: at(3.15, 51.3), ditch: at(DITCH.off, 51.0), barrow: BARROW, barrowFarmer: at(-4.95, 45.9), mile9: MILE9,
    fenceSpec1: at(-6.5, 70), fenceSpec2: at(-6.6, 63.2), fenceSpec3: at(6.8, 58), fenceSpec4: at(-6.5, 41.5),
    // 3 orchard
    fenceGap: at(-5.6, 19.5), appleEat: at(-8.0, 20.6), appleTree: at(-9.6, 19.5), ladderBase: at(-14.9, 23.6), ladderFarmer: (() => { const p = at(-16.0, 24.75); return [p[0], p[1] + 1.25, p[2]] as V3; })(),
    napPatch: at(-12.6, 13.6), napTree: at(-14, 11.5), orchardBasket: at(-14.6, 26.9), cow: at(-8.4, 8.6),
    // 4 farm
    dogLaneStart: at(LANE[0][0], LANE[0][1]), dogLaneGap: at(LANE[1][0], LANE[1][1]), dogLaneMid: at(LANE[2][0], LANE[2][1]), dogLaneEnd: at(LANE[5][0], LANE[5][1]), courseSign: COURSE_SIGN,
    doghouse: DOGHOUSE, dogHome, farmGate: at(5.0, -8.8), farmYard: at(9.8, -8.0), barnDoor: at(13.2, -14), porch: at(11.8, 3.2),
    // 5 hill (runner path = left lane, car B = right lane)
    hillRun0: at(-0.7, -50), hillRun1: at(-0.7, -65), hillRun2: at(-0.7, -80), hillRun3: at(-0.7, -95), hillRun4: at(-0.7, -110),
    hillHero: roadRunner(0.5), hillSpec1: at(-6.5, -70.2), hillSpec2: at(-6.4, -73), hillSpec3: at(6.6, -88), mile19: MILE19, lemonade: STAND,
    carBDriver: seatsB.driver, carBFront: seatsB.front, carBRear: seatsB.rear, carADriver: seatsA.driver, carAFront: seatsA.front, carARear: seatsA.rear,
    carAStart: roadCar("A", 0).pos, carAEnd: roadCar("A", 1).pos, carBStart: roadCar("B", 0).pos, carBEnd: roadCar("B", 1).pos,
  };
  if (vy) Object.assign(marks, vy.marks);
  const cy = (x: number, z: number, h: number): V3 => [x, groundY(x, z) + h, z];
  const cams: SetDef["cams"] = {
    wellTop: { pos: [W[0] - 0.5, W[1] + 15.5, W[2] + 1.4], look: [W[0] - 0.5, W[1], W[2] - 0.2], fov: 40 },
    wellHigh: { pos: cy(roadX(94.5) + 1.0, 94.5, 6.2), look: [W[0] - 0.6, W[1] + 0.8, W[2] - 0.3], fov: 38 },
    wellWide: { pos: cy(roadX(96) - 1.2, 96, 2.5), look: [W[0] - 0.4, W[1] + 1.0, W[2] - 0.6], fov: 38 },
    dustTrack: roadTrack("A", 0.6), dustRear: roadTrack("A", 0.6, "rear"),
    dustChase: (() => { const c = roadCar("A", 0.6), z = c.pos[2] - 9.5; return { pos: cy(roadX(z) - 3.6, z, 2.1), look: [c.pos[0] - 0.2, c.pos[1] + 1.2, c.pos[2] + 3.0] as V3, fov: 38 }; })(),
    dustWide: { pos: cy(roadX(36) - 3.5, 36, 8.5), look: [roadX(56), 0.6, 56], fov: 40 },
    ditchLow: { pos: cy(roadX(47.2) + 4.6, 47.2, 0.32), look: [roadX(51.3) + 3.0, 1.3, 51.3], fov: 40 },
    orchardMed: { pos: cy(roadX(15.5) - 7.0, 15.5, 1.4), look: [roadX(13.6) - 12.6, 0.55, 13.6], fov: 38 },
    orchardEat: { pos: cy(roadX(17.4) - 6.3, 17.4, 1.55), look: [roadX(20.6) - 8.0, 1.15, 20.6], fov: 38 },
    orchardOTS: { pos: cy(roadX(19.4) - 6.6, 19.4, 1.85), look: [roadX(24.75) - 16.0, 2.2, 24.75], fov: 36 },
    orchardGap: { pos: cy(roadX(21) - 2.4, 21, 1.6), look: [roadX(16.5) - 11.5, 0.9, 16.5], fov: 40 },
    farmTrack: { pos: cy(roadX(-25.6) + 0.4, -25.6, 1.5), look: [roadX(-32.5) + 15, 1.0, -32.5], fov: 38 },
    farmCorn: { pos: cy(roadX(-38) - 2.6, -38, 1.7), look: [roadX(-27) + 8, 1.6, -27], fov: 40 },
    farmWide: { pos: cy(roadX(-1) - 3.2, -1, 7.5), look: [roadX(-22) + 13, 1.2, -22], fov: 40 },
    hillLow: { pos: cy(roadX(-74.5) - 3.4, -74.5, 0.35), look: [roadX(-80) + 0.2, roadY(-80) + 1.7, -80], fov: 40 },
    hillTrack: roadTrack("B", 0.5), hillFront: roadTrack("B", 0.5, "front"),
    crane: { pos: [roadX(150) + 14, 72, 150], look: [roadX(-15), 0, -15], fov: 40 },
  };
  // ======== pose ========
  const corn = (root.userData as { corn?: Sway }).corn;
  const placeCar = (car: AutoCar, which: Which, u: number, t: number, horn: number, steer: number) => {
    const c = roadCar(which, u); car.g.position.set(...c.pos); car.g.rotation.set(-c.pitch, c.yaw, 0, "YXZ");
    const curv = (roadXd(c.pos[2] - 2) - roadXd(c.pos[2] + 2)) * 2.5;
    car.set({ dist: c.dist, t, bob: u > 0.001 && u < 0.999 ? 1 : 0.15, steer: cl(curv + steer, -1, 1), horn });
    return c;
  };
  return {
    name: VINE ? "vineyard" : "road", root, marks, cams,
    pose: (t, c) => {
      const golden = TONE.uLitCol.value.z < 1.0, dustCol = golden ? new THREE.Color(1.0, 0.86, 0.72) : new THREE.Color(1, 1, 1);
      // cars
      const uA = c.carA ?? 0, uB = c.carB ?? 0.5;
      carA.g.visible = !(c.carAHide ?? (VINE ? 1 : 0)); carB.g.visible = !(c.carBHide ?? (VINE ? 1 : 0)); carC.g.visible = c.carC !== undefined;
      vy?.pose(t, c);
      placeCar(carA, "A", uA, t, c.hornA ?? 0, c.steerA ?? 0); placeCar(carB, "B", uB, t, c.hornB ?? 0, c.steerB ?? 0); placeCar(carC, "C", c.carC ?? 0, t, 0, 0);
      // dust trails (world-anchored slots along the path; age = distance the car has gone past the slot / trail length)
      for (const [which, tr, amt] of [["A", trails.A, c.dustA ?? 0], ["B", trails.B, c.dustB ?? 0]] as [Which, Trail, number][]) {
        const P = CARP[which], u = which === "A" ? uA : uB, carDist = Math.abs(P.z1 - P.z0) * cl(u), sgn = Math.sign(P.z1 - P.z0);
        for (const sl of tr.slots) {
          const age = (carDist - sl.d - 1.6) / tr.L, on = amt > 0.001 && age > 0 && age < 1;
          sl.s.forEach((s, k) => {
            s.visible = on; if (!on) return;
            const z = P.z0 + sgn * sl.d, side = k ? 1 : -1, x = roadX(z) + P.off + side * (0.75 + age * 1.4) + age * 2.6 + Math.sin(t * 0.6 + sl.ph) * 0.3 * age;
            const sz = (1.0 + 3.0 * Math.pow(age, 0.55)) * (0.75 + 0.25 * amt) * (1 + 0.06 * Math.sin(t * 0.8 + sl.ph + k));
            s.position.set(x, roadY(z) + 0.35 + age * 1.5 + sz * 0.22, z + Math.sin(t * 0.5 + sl.ph) * 0.2);
            s.scale.set(sz * 1.25, sz, 1); s.material.rotation = sl.ph + k + t * 0.05 * (k ? 1 : -1);
            s.material.opacity = amt * cl(age / 0.05) * cl((1 - age) / 0.35); s.material.color.copy(dustCol);
          });
        }
      }
      // dust bank (thick, churning)
      const bk = c.dustBank ?? 0;
      bank.forEach((s, i) => { const d = s.userData; s.visible = bk > 0.001; if (!s.visible) return; const sw = Math.sin(t * 0.35 + d.ph); s.position.set(d.x + sw * 0.8 + t * 0.15 % 3, d.y + Math.sin(t * 0.5 + d.ph * 2) * 0.3, d.z + Math.cos(t * 0.3 + d.ph) * 0.6); const sz = d.sz * (0.45 + 0.55 * bk) * (1 + 0.08 * Math.sin(t * 0.7 + i)); s.scale.set(sz * 1.3, sz, 1); s.material.opacity = cl(bk * 1.8) * (i < Math.round(bank.length * (0.4 + 0.6 * bk)) ? 1 : 0); s.material.rotation = d.ph + t * 0.04; s.material.color.copy(dustCol); });
      // haze + heat shimmer
      const hz = c.haze ?? 1;
      haze.forEach((s) => { const d = s.userData, z = d.z + Math.sin(t * 0.07 + d.ph) * 3, x = roadX(z) + d.off + ((t * 0.4 + d.ph * 5) % 10) - 5; s.visible = hz > 0.01; s.position.set(x, roadY(z) + d.y, z); s.scale.set(d.sz * 1.6, d.sz * 0.32, 1); s.material.opacity = 0.08 * hz * (0.7 + 0.3 * Math.sin(t * 0.4 + d.ph)); s.material.color.copy(dustCol); });
      shimmer.forEach((m) => { const p = m.geometry.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array, base = m.userData.base as Float32Array; for (let i = 0; i < p.count; i++) { a[i * 3 + 1] = base[i * 3 + 1] + 0.05 * Math.sin(t * 6 + base[i * 3] * 2 + m.userData.ph); } p.needsUpdate = true; (m.material as THREE.MeshBasicMaterial).opacity = 0.09 * hz * (golden ? 0.6 : 1); m.visible = hz > 0.01; });
      // well: bucket up/down (crank turns with it), bucket swings
      { const bu = cl(c.bucket ?? 1), y = W[1] + 0.25 + bu * 1.0, len = W[1] + 1.44 - y; well.crank!.rotation.z = (1 - bu) * TAU * 3; well.rope!.scale.y = Math.max(0.02, len); well.bucket!.position.set(W[0] + Math.sin(t * 1.3) * 0.03 * bu, y, W[2] + Math.sin(t * 1.1 + 1) * 0.02 * bu); well.bucket!.rotation.z = Math.sin(t * 1.3) * 0.05 * bu; }
      // vegetation
      corn?.update(t, 0.07); tufts.update(t * 1.2, 0.04);
      crowns.forEach((cr) => cr.g.rotation.set(Math.sin(t * 0.9 + cr.seed) * 0.016 * cr.k, 0, Math.sin(t * 0.7 + cr.seed * 2) * 0.022 * cr.k));
      dapple.forEach((m, i) => { m.rotation.y = Math.sin(t * 0.6 + i) * 0.05; (m.material as THREE.MeshBasicMaterial).opacity = 0.24 + 0.06 * Math.sin(t * 1.7 + i); });
      // farm life
      farm.rotor!.rotation.z = t * 2.6; farm.tail!.rotation.y = -Math.PI / 2 - 0.3 + 0.08 * Math.sin(t * 0.4);
      farm.vane!.rotation.y = 0.6 + 0.35 * Math.sin(t * 0.5) + 0.1 * Math.sin(t * 1.7);
      flutter(farm.gateBunt!, t); flutter(hill.bunt!, t + 1); wave(farm.flag!, t, 5);
      hill.umb!.rotation.z = 0.02 * Math.sin(t * 1.4);
      farm.smoke.forEach((m, i) => { const u = (t * 0.12 + i / farm.smoke.length) % 1, H = HOUSE; m.position.set(H[0] + 1.95 + u * 2.4, H[1] + 9.4 + u * 4, H[2] - 1.55 + u * 0.5); m.material.opacity = 0.45 * Math.sin(Math.PI * u); const sc = 1 + u * 2.4; m.scale.set(sc, sc * 0.75, 1); });
      farm.chickens.forEach((ch, i) => {
        const s = ch.s, ph = (t * 0.6 + s * 0.29) % 1, step = Math.floor(t * 0.6 + s * 0.29), hop = ph < 0.2 ? Math.sin((ph / 0.2) * Math.PI) : 0, a = s * 1.7 + step * 0.9 + (ph < 0.2 ? (ph / 0.2) * 0.9 : 0.9), rr = 0.6;
        ch.g.position.set(ch.home[0] + Math.cos(a) * rr, ch.home[1] + hop * 0.08, ch.home[2] + Math.sin(a) * rr); ch.g.rotation.y = -a; ch.head.rotation.x = ph >= 0.2 ? 0.9 * Math.max(0, Math.sin((ph - 0.2) * TAU * 2.2 + i)) : -0.1;
      });
      // cow
      cow.g.visible = !(c.cowHide ?? (VINE ? 1 : 0)); cow.head.rotation.x = 0.55 + 0.12 * Math.sin(t * 1.1); cow.head.rotation.y = 0.15 * Math.sin(t * 0.3); cow.tail.rotation.z = 0.35 * Math.sin(t * 2.3); cow.tail.rotation.x = 0.15 + 0.1 * Math.sin(t * 1.7);
      // dog: 0 = home by the doghouse (tail wags), 0..1 = runs the lane into the corn
      { const u = c.dog ?? 0; dog.g.visible = !(c.dogHide ?? 0);
        if (u <= 0.001) { dog.g.position.set(dogHome[0], dogHome[1], dogHome[2]); dog.g.rotation.y = -Math.PI / 2 + 0.3 * Math.sin(t * 0.4); dog.legs.forEach((l) => (l.rotation.x = 0)); dog.tail.rotation.z = 0.6 * Math.sin(t * 9); dog.head.rotation.y = 0.3 * Math.sin(t * 0.7); }
        else { const p = dogPath.getPointAt(cl(u)), tg = dogPath.getTangentAt(cl(u)); dog.g.position.set(p.x, groundY(p.x, p.z) + Math.abs(Math.sin(t * 14)) * 0.06, p.z); dog.g.rotation.y = Math.atan2(tg.x, tg.z); dog.legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 14 + (i < 2 ? 0 : Math.PI) + (i % 2) * 0.5) * 0.8)); dog.tail.rotation.z = 0.3 * Math.sin(t * 12); dog.head.rotation.y = 0; }
      }
      // birds, crows on the wire, clouds
      crowFlock(t); crowFlock2(t + 3);
      wires.crows.forEach((g, i) => { const hd = g.userData.hd as THREE.Group; hd.rotation.x = 0.25 * Math.max(0, Math.sin(t * 1.3 + i * 2)) ** 3; hd.rotation.y = 0.5 * Math.sin(t * 0.5 + i); g.position.y += 0; });
      const cpal = golden ? CLOUD_GOLD : CLOUD_DAY;
      syncTwins();
      clouds.forEach((s, i) => { const d = s.userData, a = d.a + t * 0.003; s.position.set(Math.cos(a) * d.d, d.y, Math.sin(a) * d.d * 1.1); s.material.map = cloudHD(20 + i, cpal); });
    },
  };
};
