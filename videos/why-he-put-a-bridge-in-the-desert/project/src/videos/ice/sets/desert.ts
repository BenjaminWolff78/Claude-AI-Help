// LAKE MIRAGE, Arizona, 1968-71 ("Why He Put a Bridge in the Desert"): the rebuilt granite bridge on dry orange-pink
// sand at the edge of a blue desert lake, the dug channel under it, the empty town grid behind it, the highway with the
// roadside dinosaur. One set for scenes 1, 2 (office exterior + the fly-in), 6, 7, 8 (+9 car follow). Lights: desert
// (midday), desertLate (afternoon highway), payoff (brightest).
//
// LAYOUT (set-local metres; x along the bridge, the lake at -z, the town at +z):
//   BRIDGE   oldBridge() at the origin, x -48..48, z -7..7, deck top y 10.5, arches at x -36 -18 0 18 36. Sand
//            approach embankments (ramps) x 48..112 / -48..-112, top flat to |x| 54 then down to the sand; concrete
//            pier footings y -2.9..0 under the four inner piers (seen once the channel is dug).
//   CHANNEL  centre line x = 0 from the lake (z -50 shore) straight under the middle three arches to z 14, then bending
//            west along z ~40-47 to the lake's west bay (x < -195). Full half-width 25.5 under the bridge (bed +-22,
//            sand slopes to the outer piers), 17 after the bend.
//   LAKE     z < shore(x) ~ -50 (beach down to the water line at ~ -56, water level y -0.6), a west bay north of x < -150;
//            far shore + purple-red mountain ranges all around, flat-topped buttes nearer.
//   SITE     (scene 6, lake side, east): truck crane at (40, 0, -24) with a numbered block on its hook, pallets of
//            numbered blocks (32..38, -36..-31), the site hut (60, 0, -33) with a flag, the chart board (31.5, 0, -10.5),
//            scaffold tower + spandrel walkway on the centre arch's -z face (x 7.4..11.6), the flatbed's haul road along
//            z -15.5 from the east, the bulldozer's lane along x = 0 (z 18 -> -22).
//   TOWN     (+z): Main Street (asphalt, z 98, x -30..135), Bridge Road (asphalt, x 118, z 98 -> 20 -> the +x ramp foot),
//            Mirage Blvd (asphalt, x 10, z 98 -> the highway), graded dirt streets (z 55 / 76 / 124, x -22 / 70), lots
//            with chalk lines, survey stakes + string lines, 13 FOR SALE signs, 4 lonely ranch houses, the water tower
//            "LAKE MIRAGE" (128, 0, 62), the LOTS FOR SALE billboard (60, 0, 46), the street thermometer "110" (31.6, 0, 103.2),
//            the gas station "DESERT STAR" (26, 0, 146), parked 1960s cars, power poles (Bridge Road, Mirage Blvd, the
//            highway; NONE along Main Street). THE SALES OFFICE (salesOffice()) at (40, 0, 108) turned to face -z (its
//            local +z), door at world x 38.6, front z 104; sidewalk z 102.4..104.1 (top y 0.1); a bench (x 42.4..44.3) and the sand-jar table (x 34.3..35.3) flank the door.
//   HIGHWAY  z 160 along x (two lanes, eastbound +x lane z 162.2), the DINO STOP pull-off (x -92..-48, z 165..177) with
//            the green concrete brontosaurus (-70, 0, 183) and kiosk, billboard "SEE THE BRIDGE! NEXT EXIT" (-15, 0, 171),
//            road signs.
//   PAYOFF   the town sign "WELCOME TO LAKE MIRAGE / POP. 300" with a ladder at (38, 0, -30) (faces the lake side).
//
// CTL (pose c; all 0..1 unless noted):
//   built, numbered, lamps   passed to the bridge (defaults 1, 0, 0)
//   dig       the channel: 0 flat sand; 0..0.5 a centre strip |x| < 6.5 (bed |x| < 4.5) cut from the centre arch outward and
//             deepened (0.1 = the frame-1 bite, ~0.5 m); 0.5 -> 1 widens to all three arches (the boss marks bossArch / wetSpot
//             are on dry sand only while dig <= 0.5). Sand berms beside the cut (not under the bridge).
//   water     the flood: 0 dry; 0..0.7 lake water bursts the sand plug at z -45 and its foam front runs along the channel
//             with splashes (the front reaches the bridge's lake face at water ~0.10, the centre ~0.12, the +z face ~0.135);
//             0.7 -> 1 fills to the turquoise canal at lake level (y -0.6), joined to the lake.
//   dozer     the bulldozer along x = 0 from z 18 (dozerStart) to z -22, heading -z (~0.45-0.5 = under the centre arch);
//             dozerBlade (0 = biting, 1 = raised), dust + sand pile in front of the blade while it bites
//   crane     the hook lowers the numbered block from 16 m onto the centre arch deck (stoneDrop) at 1;
//   craneSwing 0 = hook over the pallets, 1 = over stoneDrop (slew + luff)
//   truck     the flatbed drives in along the haul road from the east and stops beside the bridge at (52, 0, -15.5)
//   wagon     the family station wagon: highway (from x -330) -> pulls off at the dinosaur and stops (u 0.30..0.42) ->
//             back on the highway past the billboard -> Mirage Blvd -> Main Street -> pulls up at the kerb in front of the
//             office door (u 1). wagonDoor opens the passenger door (car's right = the office side).
//   wagon2    continues (when > 0): from the office kerb east on Main Street, down Bridge Road, parks at the bridge
//             approach lot (bridgePark) at 1
//   sold      the SOLD lot (west of the office): its hanging FOR SALE board spins to SOLD and slams with a bounce
//   grow      payoff growth: ~22 more ranch houses, shops on Main Street, palms, bunting, crowd cards on the bridge approaches
//             and canal banks, most FOR SALE signs -> SOLD; also flattens the dig berms
//   boats     three motorboats run through the canal under the arches (with wakes); shown when boats > 0 and water > 0.9
//   popPaint  the town sign: 0..0.3 primer covers "300", 0.3..1 "10,000" painted left to right
//   tumbleDeck the tumbleweed rolls along the bridge deck instead (x 40 -> -8, z ~1.6)
//   tumble    the tumbleweed rolls across the frame-1 view, from under the centre arch (8, -3.5) to (-20, -13), passing
//             just behind the boss (in the frame-1 framing at tumble ~0.4-0.55); hidden when not given
//   site      default 1; 0 hides the construction (crane, pallets, hut, chart, scaffold, truck, dozer) for the payoff
//   dozerShow 1 keeps the bulldozer visible while site is 0
//   door, fan, sweat  passed to the sales office (door default 1 = open for the fly-in)
// AMBIENT: heat shimmer (frame-1 view, highway, Main Street), hawk circling over the bridge, flags, two far dust devils,
//   dozer exhaust + dust, crane hook sway, palm sway (payoff), bunting flutter, boat wakes.
// HELPERS: desertWagon(u, u2) / desertWagonSeats(u, u2) (car transform + seat-top marks), desertDozer(u) (dozer pose +
//   operator seat mark), desertBoat(i, u) (boat pose), desertCraneHook(crane, swing) (hook point), desertGround(x, z, dig)
//   (sand height incl. the channel), desertWagonCam(u, u2, side) (a 2-4 m ride-along framing).
// CAMERA LANES (kept free of solids): the frame-1 low angle on the lake side of the centre arch (x -12..8, z -26..-8,
//   y 0.3..9); the scene-1 flight (rise from the arch over the deck at y > 12, across the town at 20-40 m along the line
//   (0, 0) -> (38.6, 104), down onto Main Street at x 35..42 and in through the door x 37.6..40.6, y 0.8..2.6); the drop
//   under the centre arch along the channel (x -6..6, y 0.6..7, z -45..30); the reveal rise (anywhere above y 25); the
//   highway follow (z 150..175, y > 0.8 off the road); Main Street ride-along (z 93..101.8); the payoff glide (lake side
//   above the canal y 1..14, onto the deck).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rng, beamHD } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { mist, waterMaterial, glow } from "../setkit";
import { fitText, palm, swayPalm, type Palm } from "./portkit_common";
import { bunting, flutter, cloth, wave, type Bunting, type Cloth } from "./towerkit";
import { oldBridge } from "./oldbridge";
import { salesOffice } from "./salesoffice";
import { wagon } from "./wagon";
import { dozer } from "./dozer";
import { crane } from "./crane";
import { flatbed, bridgeCrate } from "./flatbed";
import {
  TAU, cl, sm, lerp, hash, mat, col, tex, shiny, rodGeo, beamGeo, blot, SANS, SERIF, SCRIPT,
  sandTex, gradedTex, asphaltTex, rockTex, mountainTex, tinTex, stuccoTex, shimmerTex, treadTex, foamTexD, faceTex, board,
  saguaro, barrelCactus, pricklyPear, scrub, rock, stake, powerPole, wire, ranchHouse, RANCH, shop, tumbleweed, hawk, hawkPose,
  dustDevil, crowdCard, motorboat, type Boat,
} from "./desertkit";
import type { SetDef, V3 } from "./types";

// ================= layout (module level, pure) =================
const DECK = 10.5, BL = 96, BW = 14;
const ARCH_X = [-36, -18, 0, 18, 36], ARCH_W = [13, 15, 16, 15, 13];
const PIERS: [number, number][] = [0, 1, 2, 3].map((i) => [ARCH_X[i] + ARCH_W[i] / 2, ARCH_X[i + 1] - ARCH_W[i + 1] / 2]);
const WL = -0.6; // lake / canal water level
/** lake shore line (sand at y ~0.15 there; the water line is ~6 m further into the lake) */
export const shoreZ = (x: number) => -50 + 2.5 * Math.sin(x * 0.045) + 1.8 * Math.sin(x * 0.11 + 1) + (x < -140 ? Math.min(260, (-140 - x) * 1.5) : 0);
const baseY = (x: number, z: number) => {
  const dl = z - shoreZ(x);
  const r = Math.hypot(x, z - 60), far = sm((r - 600) / 70) * 9.5;
  if (dl < 0) return Math.max(-7, dl * 0.12 + Math.min(0, dl + 12) * 0.05) + far;
  const dune = sm((r - 260) / 160) * (5 * Math.sin(x * 0.012 + 1.3) * Math.sin(z * 0.01 + 0.4) + 3 * Math.sin(x * 0.03 - z * 0.021) + 4);
  return dune + far * 0.2 + 0.18 * Math.sin(x * 0.21 + Math.sin(z * 0.13) * 2) * sm((Math.abs(x) - 30) / 30) * sm((r - 140) / 60);
};
// ---- the channel centre line: samples every 1 m ----
const CANAL_CP: [number, number][] = [[0, -112], [0, -60], [0, -20], [0, 0], [0, 14], [-7, 30], [-28, 42], [-65, 47], [-115, 46], [-165, 42], [-215, 38], [-270, 36]];
const CN = (() => {
  const c = new THREE.CatmullRomCurve3(CANAL_CP.map(([x, z]) => V(x, 0, z)), false, "centripetal"), L = c.getLength(), n = Math.round(L);
  const X: number[] = [], Z: number[] = [], TX: number[] = [], TZ: number[] = [];
  for (let i = 0; i <= n; i++) { const u = i / n, p = c.getPointAt(u), t = c.getTangentAt(u); X.push(p.x); Z.push(p.z); TX.push(t.x); TZ.push(t.z); }
  return { X, Z, TX, TZ, n, ds: L / n, L };
})();
const sOfZ = (z: number) => { let best = 0, bd = 1e9; for (let i = 0; i <= CN.n; i++) { if (Math.abs(CN.X[i]) > 1) break; const d = Math.abs(CN.Z[i] - z); if (d < bd) { bd = d; best = i; } } return best * CN.ds; };
const S_BRIDGE = sOfZ(0), S_MOUTH = sOfZ(-48), S_PLUG = sOfZ(-45), S_BEND = sOfZ(14);
const S_END = (() => { for (let i = 0; i <= CN.n; i++) if (CN.X[i] < -196) return i * CN.ds; return CN.L; })();
/** nearest centre-line sample: s along, d signed lateral (+ = left of travel) */
const canalProj = (x: number, z: number) => {
  let bi = 0, bd = 1e18;
  for (let i = 0; i <= CN.n; i += 4) { const d = (x - CN.X[i]) ** 2 + (z - CN.Z[i]) ** 2; if (d < bd) { bd = d; bi = i; } }
  for (let i = Math.max(0, bi - 4); i <= Math.min(CN.n, bi + 4); i++) { const d = (x - CN.X[i]) ** 2 + (z - CN.Z[i]) ** 2; if (d < bd) { bd = d; bi = i; } }
  const sd = (x - CN.X[bi]) * -CN.TZ[bi] + (z - CN.Z[bi]) * CN.TX[bi];
  return { s: bi * CN.ds, d: sd, dist: Math.sqrt(bd) };
};
const hwFull = (s: number) => lerp(25.5, 17, sm((s - S_BEND - 4) / 30));
/** channel cut at (s, d): returns { y (bed or berm offset), prof (0..1 inside the cut), berm } given dig/water/grow */
const cutAt = (s: number, d: number, dig: number, water: number, grow: number, zc: number) => {
  if (dig <= 0.001) return { cut: 0, berm: 0, prof: 0 };
  const e = sm((dig - 0.5) / 0.5), hw = hwFull(s), edge = lerp(6.5, hw, e), bed = lerp(4.5, hw - 3.5, e);
  const a = Math.abs(s - S_BRIDGE) / 260, reach = sm((dig * 1.8 - a) / 0.15);
  const plug = Math.max(sm((s - S_PLUG - 1) / 6), sm(water / 0.08));
  const D = 2.5 * Math.min(1, dig / 0.45) * reach * plug, ad = Math.abs(d);
  const prof = ad < bed ? 1 : ad < edge ? sm((edge - ad) / (edge - bed)) : 0;
  let berm = 0;
  if (ad > edge && ad < edge + 5) berm = 1.0 * Math.min(1, dig / 0.3) * reach * (1 - grow) * sm((Math.abs(zc) - 12) / 4) * Math.sin((Math.PI * (ad - edge)) / 5) * plug;
  return { cut: D * prof, berm, prof };
};
/** sand height anywhere incl. the channel (for marks / shot code) */
export const desertGround = (x: number, z: number, dig = 0, water = 0, grow = 0) => {
  const b = baseY(x, z), p = canalProj(x, z);
  if (p.dist > 40) return b;
  const k = cutAt(p.s, p.d, dig, water, grow, CN.Z[Math.round(p.s / CN.ds)]);
  return Math.min(b, -k.cut) + k.berm;
};
// ---- paths (polylines with arclength) ----
type Path = { pts: THREE.Vector3[]; cum: number[]; L: number; at: (s: number) => { p: THREE.Vector3; dir: THREE.Vector3; curv: number } };
const mkPath = (cp: [number, number][], step = 0.5): Path => {
  const c = new THREE.CatmullRomCurve3(cp.map(([x, z]) => V(x, 0, z)), false, "centripetal"), L0 = c.getLength(), n = Math.max(2, Math.round(L0 / step));
  const pts = Array.from({ length: n + 1 }, (_, i) => c.getPointAt(i / n)), cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = cum[n];
  const at = (s: number) => {
    const ss = cl(s, 0, L); let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= ss) lo = m; else hi = m; }
    const u = (ss - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]), p = pts[lo].clone().lerp(pts[hi], u);
    const i0 = Math.max(0, lo - 2), i1 = Math.min(n, hi + 2), dir = pts[i1].clone().sub(pts[i0]).normalize();
    const da = pts[Math.min(n, hi + 6)].clone().sub(pts[hi]).normalize(), db = pts[lo].clone().sub(pts[Math.max(0, lo - 6)]).normalize();
    const curv = (db.x * da.z - db.z * da.x);
    return { p, dir, curv };
  };
  return { pts, cum, L, at };
};
// eastbound lane z 162.2; Main Street north lane z 100.2; Bridge Road southbound lane x 120.2
const WAGON_A = mkPath([[-330, 162.2], [-200, 162.2], [-128, 162.2], [-104, 163.2], [-90, 167.5], [-80, 170.2], [-68, 170.6]]);
const WAGON_B = mkPath([[-68, 170.6], [-56, 170.0], [-44, 166.5], [-30, 162.6], [-16, 162.2], [-4, 161.4], [5, 158], [8.2, 151], [8.0, 140], [8.0, 115], [8.4, 106],
  [11, 102.3], [16, 100.5], [24, 100.2], [33, 100.6], [38.6, 100.95]]);
const WAGON_C = mkPath([[38.6, 100.95], [46, 100.4], [70, 100.2], [100, 100.2], [110, 99.6], [116.5, 96.5], [119.6, 90], [120.2, 78], [120.2, 46], [119.6, 34], [116.5, 27.5], [110.5, 22.5], [104, 20.5]]);
const ease = (u: number) => u * u * (3 - 2 * u);
/** the family wagon: u = ctl wagon, u2 = ctl wagon2 -> transform + motion info */
export const desertWagon = (u: number, u2 = 0) => {
  let P: Path, s: number, sp = 0, brake = 0;
  if (u2 > 0.0001) { P = WAGON_C; const k = cl(u2), e = k < 0.12 ? (k / 0.12) ** 2 * 0.12 * 0.5 / 0.5 : k; s = P.L * ease(cl(e)); sp = 1 - Math.abs(2 * k - 1); brake = sm((k - 0.86) / 0.1) * (1 - sm((k - 0.98) / 0.02)); }
  else if (u < 0.3) { P = WAGON_A; const k = u / 0.3; s = P.L * (1 - (1 - k) ** 2.2); sp = 1 - k; brake = sm((k - 0.75) / 0.2) * (1 - sm((k - 0.98) / 0.02)); }
  else if (u < 0.42) { P = WAGON_A; s = P.L; }
  else { P = WAGON_B; const k = (u - 0.42) / 0.58; s = P.L * ease(k); sp = 1 - Math.abs(2 * k - 1); brake = sm((k - 0.84) / 0.12) * (1 - sm((k - 0.985) / 0.015)); }
  const a = P.at(s), yaw = Math.atan2(a.dir.x, a.dir.z);
  const dist = (P === WAGON_A ? 0 : P === WAGON_B ? WAGON_A.L : WAGON_A.L + WAGON_B.L) + s;
  return { pos: [a.p.x, 0, a.p.z] as V3, yaw, dist, moving: sp > 0.02 ? 1 : 0, steer: cl(-a.curv * 6, -1, 1), brake };
};
const SEAT_L = { driver: [0.42, 0.97, 0.38], front: [-0.42, 0.97, 0.38], rearL: [0.42, 0.97, -0.92], rearR: [-0.42, 0.97, -0.92], back: [0, 0.94, -2.05] } as const;
export const desertWagonSeats = (u: number, u2 = 0) => {
  const w = desertWagon(u, u2), c = Math.cos(w.yaw), s = Math.sin(w.yaw), out = {} as Record<keyof typeof SEAT_L, V3>;
  (Object.keys(SEAT_L) as (keyof typeof SEAT_L)[]).forEach((k) => { const [x, y, z] = SEAT_L[k]; out[k] = [w.pos[0] + x * c + z * s, y, w.pos[2] - x * s + z * c]; });
  return out;
};
/** ride-along framing: camera 3 m off the car's left (side "left") or right, a little ahead, looking at the car */
export const desertWagonCam = (u: number, u2 = 0, side: "left" | "right" = "left", gap = 3.2) => {
  const w = desertWagon(u, u2), f = V(Math.sin(w.yaw), 0, Math.cos(w.yaw)), lft = V(f.z, 0, -f.x).multiplyScalar(side === "left" ? -1 : 1);
  const P = V(...w.pos), cam = P.clone().addScaledVector(f, 1.2).addScaledVector(lft, -gap).add(V(0, 1.45, 0)), look = P.clone().addScaledVector(f, 0.3).add(V(0, 1.05, 0));
  return { pos: [cam.x, cam.y, cam.z] as V3, look: [look.x, look.y, look.z] as V3, fov: 38 };
};
// the boss's red convertible (scene 1): parked beside the frame-1 spot, drives under arch 1 into town, up Mirage Blvd,
// along Main Street and pulls up at the kerb west of the office door. ctl bossCar 0..1 (ease in/out along the route).
const BOSS_PATH = mkPath([[-14.5, -9.5], [-14.5, 2], [-14, 16], [-3, 24], [11.5, 32], [15.2, 43], [10.5, 55], [8.0, 66], [8.0, 90], [9.5, 97.5], [14, 99.9], [24, 100.6], [35.2, 100.95]]);
export const desertBossCar = (u: number) => {
  const k = cl(u), e = k * k * k * (k * (6 * k - 15) + 10), s0 = BOSS_PATH.L * e, a = BOSS_PATH.at(s0), yaw = Math.atan2(a.dir.x, a.dir.z);
  const sp = 30 * k * (1 - k) * 4; // rough moving flag
  const c = Math.cos(yaw), sn = Math.sin(yaw), seat = (x: number, y: number, z: number): V3 => [a.p.x + x * c + z * sn, y, a.p.z - x * sn + z * c];
  return { pos: [a.p.x, 0, a.p.z] as V3, yaw, dist: s0, moving: sp > 0.05 ? 1 : 0, steer: cl(-a.curv * 6, -1, 1), brake: k > 0.9 && k < 0.999 ? 1 : 0,
    driver: seat(0.42, 0.97, 0.38), front: seat(-0.42, 0.97, 0.38), L: BOSS_PATH.L };
};
// bulldozer lane
const DZ_Z0 = 18, DZ_Z1 = -22;
export const desertDozer = (u: number, dig = 0.1) => {
  const z = lerp(DZ_Z0, DZ_Z1, cl(u)), y = desertGround(0, z, dig);
  return { pos: [0, y, z] as V3, yaw: Math.PI, dist: Math.abs(z - DZ_Z0), seat: [0, y + 1.62, z + 0.55] as V3 };
};
// boats through the straight canal (z <= 14): A up the centre arch, B down the -x arch, C up the +x arch (delayed)
const BOATS: { x: number; z0: number; z1: number; hull: string; stripe: string; lag: number }[] = [
  { x: 1.5, z0: -95, z1: 12, hull: "#f4efe4", stripe: "#e2453c", lag: 0 },
  { x: -17.5, z0: 12, z1: -95, hull: "#f2c230", stripe: "#2f7fd1", lag: 0.12 },
  { x: 17, z0: -80, z1: 12, hull: "#9fd6cc", stripe: "#c8352e", lag: 0.3 },
];
export const desertBoat = (i: number, u: number) => {
  const B = BOATS[i], k = cl((u - B.lag) / (1 - B.lag) * 1.0 + B.lag * 0.4), z = lerp(B.z0, B.z1, k);
  return { pos: [B.x + Math.sin(z * 0.05 + i) * 1.2, WL, z] as V3, yaw: B.z1 > B.z0 ? 0 : Math.PI };
};
// ---- town grid ----
const MAIN_Z = 98, BLVD_X = 10, BRIDGE_RD_X = 118, HWY_Z = 160;
const OFFICE: V3 = [40, 0, 110.85], OFFICE_YAW = Math.PI; // real office: front z 106.85, overhang walk to 104.1
const officeToSet = (p: V3): V3 => [OFFICE[0] - p[0], p[1], OFFICE[2] - p[2]];
type Lot = { x: number; z: number; w: number; d: number; face: number }; // centre, size, face = +1 street at +z, -1 street at -z
const LOTS: Lot[] = (() => {
  const out: Lot[] = [];
  const blocks: [number, number, number, number][] = [ // x0, x1, z0, z1 (inside the streets)
    [-17.5, 5.5, 59.5, 71.5], [14.5, 65.5, 59.5, 71.5], [74.5, 113.5, 59.5, 71.5],
    [-17.5, 5.5, 80.5, 93.5], [14.5, 65.5, 80.5, 93.5], [74.5, 113.5, 80.5, 93.5],
    [-17.5, 5.5, 102.5, 119.5], [14.5, 65.5, 102.5, 119.5], [74.5, 113.5, 102.5, 119.5],
    [-17.5, 5.5, 128.5, 144.5], [34.5, 65.5, 128.5, 144.5], [74.5, 113.5, 128.5, 144.5],
  ];
  for (const [x0, x1, z0, z1] of blocks) {
    const n = Math.max(1, Math.round((x1 - x0) / 13)), w = (x1 - x0) / n, two = z1 - z0 > 20;
    for (let i = 0; i < n; i++) {
      const x = x0 + w * (i + 0.5);
      if (two) { const d = (z1 - z0) / 2; out.push({ x, z: z0 + d / 2, w, d, face: -1 }, { x, z: z1 - d / 2, w, d, face: 1 }); }
      else out.push({ x, z: (z0 + z1) / 2, w, d: z1 - z0, face: -1 });
    }
  }
  // the office lot is taken by the office itself
  return out.filter((l) => !(Math.abs(l.x - OFFICE[0]) < 9 && Math.abs(l.z - 106) < 6));
})();
const lotNear = (x: number, z: number) => LOTS.reduce((a, l) => (Math.hypot(l.x - x, l.z - z) < Math.hypot(a.x - x, a.z - z) ? l : a), LOTS[0]);
const SOLD_LOT = lotNear(18, 107);
const HOUSE_LOTS = [lotNear(-6, 64), lotNear(92, 86), lotNear(-8, 136), lotNear(98, 136)];
const SIGN_LOTS = [SOLD_LOT, lotNear(31, 64), lotNear(57, 64), lotNear(-8, 87), lotNear(31, 87), lotNear(57, 87), lotNear(80, 66), lotNear(105, 66),
  lotNear(57, 110), lotNear(82, 110), lotNear(-8, 110), lotNear(44, 136), lotNear(82, 136)];
// ---- props with fixed spots (also used by DESERT_SOLIDS) ----
const CRANE_AT: V3 = [40, 0, -24], STONE_DROP: V3 = [4, DECK, -3], PALLET_AT: V3 = [33, 0, -38];
const HUT: V3 = [60, 0, -33], CHART: V3 = [31.5, 0, -10.4], TOWN_SIGN: V3 = [22, 0, 36], TRUCK_STOP: V3 = [52, 0, -15.5];
const WTOWER: V3 = [136, 0, 62], BILL_LOTS: V3 = [60, 0, 46], THERMO: V3 = [31.6, 0.1, 103.2], GAS: V3 = [26, 0, 146];
const DINO: V3 = [-70, 0, 183], KIOSK: V3 = [-52, 0, 181], BILL_HWY: V3 = [-15, 0, 171];
const box3 = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): [V3, V3] => [[Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)]];
const around = (p: V3, rx: number, h: number, rz = rx, y0 = 0): [V3, V3] => box3(p[0] - rx, p[1] + y0, p[2] - rz, p[0] + rx, p[1] + h, p[2] + rz);
/** solids the camera must never enter (set-local). The bridge's and the office's own SOLIDS are appended when the set
 *  is built (desert() pushes oldBridge().SOLIDS and the office's transformed SOLIDS into this same array). */
export const DESERT_SOLIDS: [V3, V3][] = (() => {
  const s: [V3, V3][] = [];
  s.push(around(CRANE_AT, 5.8, 7, 6.6), around(PALLET_AT, 3.5, 1.6, 3), around(HUT, 3.4, 3.6, 2.6), around(CHART, 1.4, 2.6, 0.5), around(TOWN_SIGN, 3.4, 5.2, 1.2));
  s.push(box3(7.2, -3, -9.8, 11.8, DECK + 1.2, -7.2));                      // scaffold tower on the centre arch's -z face
  for (const [a, c] of PIERS) s.push(box3(a - 0.9, -3, -BW / 2 - 1.2, c + 0.9, 0, BW / 2 + 1.2)); // pier footings
  for (const sx of [-1, 1]) s.push(box3(sx * 48, -1, -11.5, sx * 112, DECK, 11.5));             // approach ramps (sand fill, conservative)
  for (const l of HOUSE_LOTS) s.push(around([l.x, 0, l.z], 7.5, 5.5, 5));
  s.push(around(WTOWER, 5.5, 26), around(BILL_LOTS, 8, 9, 1.2), around(THERMO, 1.2, 7.2, 0.6), around(GAS, 9, 6.5, 7), around([GAS[0] - 10, 0, GAS[2] - 6], 1, 10, 1));
  s.push(around(DINO, 11, 14, 4), around(KIOSK, 3, 3.6, 2.4), around(BILL_HWY, 7, 9, 1.5));
  s.push(around([34.8, 0.1, 103.1], 0.6, 1.0, 0.5));   // bench, sand-jar table
  return s;
})();

// ================= painted textures (set specific) =================
const graniteBlockTex = (n: string) => ctex("dsBlock" + n, 512, 256, (g, r) => {
  g.fillStyle = "#cbbfa6"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 20; i++) blot(g, r() * 512, r() * 256, 40 + r() * 70, r() < 0.5 ? "rgba(236,226,206,0.35)" : "rgba(150,136,130,0.22)");
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(90,80,90,0.3)" : "rgba(255,250,236,0.4)"; g.fillRect(r() * 512, r() * 256, 1.5, 1.5); }
  g.strokeStyle = "rgba(110,96,100,0.35)"; g.lineWidth = 1.5; for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8 + r() * 12, y + (r() - 0.5) * 4); g.stroke(); }
  g.strokeStyle = "rgba(90,78,86,0.6)"; g.lineWidth = 6; g.strokeRect(3, 3, 506, 250);
  g.fillStyle = "rgba(244,242,236,0.95)"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, n, 256, 132, 400, 110, SANS);
});
const chartTex = () => ctex("dsChart", 1024, 768, (g, r) => {
  g.fillStyle = "#f4f0e2"; g.fillRect(0, 0, 1024, 768);
  g.strokeStyle = "rgba(120,150,200,0.35)"; g.lineWidth = 1; for (let x = 0; x < 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 768); g.stroke(); } for (let y = 0; y < 768; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  g.fillStyle = "#2a3a6a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "STONE CHART - ARCH 3", 512, 62, 860, 64, SERIF);
  // elevation of an arch with numbered voussoirs
  const cx = 512, cy = 560, R0 = 300, R1 = 370; g.lineWidth = 3; g.strokeStyle = "#2a3a6a";
  const N = 17;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI + (i / N) * Math.PI, a1 = Math.PI + ((i + 1) / N) * Math.PI;
    g.beginPath(); g.moveTo(cx + Math.cos(a0) * R0, cy + Math.sin(a0) * R0 * 0.62); g.lineTo(cx + Math.cos(a0) * R1, cy + Math.sin(a0) * R1 * 0.62); g.lineTo(cx + Math.cos(a1) * R1, cy + Math.sin(a1) * R1 * 0.62); g.lineTo(cx + Math.cos(a1) * R0, cy + Math.sin(a1) * R0 * 0.62); g.closePath();
    if (i < 11) { g.fillStyle = "rgba(90,170,110,0.35)"; g.fill(); } else if (i === 11) { g.fillStyle = "rgba(240,120,70,0.5)"; g.fill(); }
    g.stroke();
    const am = (a0 + a1) / 2; g.fillStyle = "#2a3a6a"; g.font = "700 20px Arial"; g.fillText(String(301 + i), cx + Math.cos(am) * (R0 + R1) / 2, cy + Math.sin(am) * (R0 + R1) * 0.31);
    if (i < 11) { g.strokeStyle = "#2a8a4a"; g.lineWidth = 4; const x = cx + Math.cos(am) * (R1 + 26), y = cy + Math.sin(am) * (R1 + 26) * 0.62; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 2, y + 8); g.lineTo(x + 11, y - 10); g.stroke(); g.strokeStyle = "#2a3a6a"; g.lineWidth = 3; }
  }
  g.fillRect(cx - R1 - 80, cy, 80, 12); g.fillRect(cx + R1, cy, 80, 12);
  g.fillStyle = "#c8352e"; g.font = "700 26px Georgia"; g.fillText("NEXT: 3-14-312", 840, 690);
  g.strokeStyle = "#c8352e"; g.lineWidth = 4; g.beginPath(); g.ellipse(840, 690, 130, 32, 0, 0, TAU); g.stroke();
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(160,120,80,0.08)"; g.beginPath(); g.arc(r() * 1024, r() * 768, 10 + r() * 40, 0, TAU); g.fill(); }
});
const towerTankTex = () => ctex("dsTank", 2048, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#f4f0e8"); gr.addColorStop(1, "#dcd6cc"); g.fillStyle = gr; g.fillRect(0, 0, 2048, 512);
  for (let i = 0; i < 20; i++) { const x = r() * 2048, gg = g.createLinearGradient(0, 0, 0, 512); gg.addColorStop(0, "rgba(180,110,80,0.25)"); gg.addColorStop(1, "rgba(180,110,80,0)"); g.fillStyle = gg; g.fillRect(x, 300, 4 + r() * 8, 200); }
  g.fillStyle = "#2f7fd1"; g.fillRect(0, 40, 2048, 26); g.fillRect(0, 446, 2048, 26);
  g.fillStyle = "#e2453c"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LAKE MIRAGE", 512, 250, 860, 230, SANS);
  g.fillStyle = "#2f7fd1"; g.font = "900 60px Arial"; g.fillText("ARIZONA", 512, 380);
  g.fillStyle = "#e2453c"; fitText(g, "LAKE MIRAGE", 1536, 250, 860, 230, SANS);
});
const billLotsTex = () => ctex("dsBillLots", 1536, 576, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 576); gr.addColorStop(0, "#2f8fd8"); gr.addColorStop(0.62, "#8fd0f0"); gr.addColorStop(0.63, "#f2b27a"); gr.addColorStop(1, "#e88a5a"); g.fillStyle = gr; g.fillRect(0, 0, 1536, 576);
  g.fillStyle = "#ffe08a"; g.beginPath(); g.arc(1300, 150, 90, 0, TAU); g.fill();
  for (let k = 0; k < 14; k++) { g.strokeStyle = "rgba(255,224,138,0.6)"; g.lineWidth = 10; const a = (k / 14) * TAU; g.beginPath(); g.moveTo(1300 + Math.cos(a) * 110, 150 + Math.sin(a) * 110); g.lineTo(1300 + Math.cos(a) * 150, 150 + Math.sin(a) * 150); g.stroke(); }
  // a dream ranch house + pool + palm
  g.fillStyle = "#f4efe4"; g.fillRect(980, 300, 360, 90); g.fillStyle = "#c8352e"; g.beginPath(); g.moveTo(960, 300); g.lineTo(1160, 250); g.lineTo(1360, 300); g.fill();
  g.fillStyle = "#3a8fd8"; g.fillRect(1010, 330, 60, 40); g.fillRect(1230, 330, 70, 40); g.fillStyle = "#2fc4c0"; g.beginPath(); g.ellipse(1160, 470, 150, 34, 0, 0, TAU); g.fill();
  g.fillStyle = "#7a4a2a"; g.fillRect(900, 230, 14, 170); g.fillStyle = "#3a9a4a"; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(907 + Math.cos(k) * 50, 225 + Math.sin(k) * 14, 60, 14, k, 0, TAU); g.fill(); }
  g.fillStyle = "#ffffff"; g.strokeStyle = "#1c3a6a"; g.lineWidth = 14; g.textAlign = "left"; g.textBaseline = "middle";
  g.font = "900 150px 'Arial Black', Arial"; { const t = "LOTS FOR SALE", w = g.measureText(t).width, k = Math.min(1, 860 / w); g.save(); g.translate(60, 140); g.scale(k, 1); g.strokeText(t, 0, 0); g.fillText(t, 0, 0); g.restore(); }
  g.fillStyle = "#fff4c8"; g.font = "italic 900 74px Georgia"; { const t = "Lake Mirage, Arizona", w = g.measureText(t).width, k = Math.min(1, 820 / w); g.save(); g.translate(70, 290); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); }
  g.fillStyle = "#c8352e"; g.fillRect(60, 380, 520, 130); g.fillStyle = "#ffffff"; g.font = "900 84px 'Arial Black', Arial"; { const t = "$99 DOWN!", w = g.measureText(t).width, k = Math.min(1, 480 / w); g.save(); g.translate(80, 448); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); }
  g.fillStyle = "#1c3a6a"; g.font = "900 44px Arial"; { const t = "BUILD YOUR DREAM IN THE SUN", w = g.measureText(t).width, k = Math.min(1, 820 / w); g.save(); g.translate(620, 548); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); }
  for (let i = 0; i < 50; i++) { g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(r() * 1536, r() * 576, 20 + r() * 80, 3); }
});
const billHwyTex = () => ctex("dsBillHwy", 1536, 640, (g, r) => {
  g.fillStyle = "#f2c230"; g.fillRect(0, 0, 1536, 640);
  g.fillStyle = "#1c3a6a"; g.fillRect(0, 0, 1536, 40); g.fillRect(0, 600, 1536, 40);
  // the bridge silhouette over blue water
  g.fillStyle = "#3fb0c8"; g.fillRect(880, 430, 600, 120);
  g.fillStyle = "#8a7a6a"; g.fillRect(880, 360, 600, 34);
  for (let k = 0; k < 5; k++) { const x = 900 + k * 116; g.fillStyle = "#8a7a6a"; g.beginPath(); g.moveTo(x, 394); g.lineTo(x + 116, 394); g.lineTo(x + 116, 470); g.quadraticCurveTo(x + 58, 380, x, 470); g.closePath(); g.fill(); }
  for (let k = 0; k < 12; k++) { g.fillStyle = "#8a7a6a"; g.fillRect(890 + k * 50, 340, 12, 22); }
  g.fillStyle = "#1c3a6a"; g.textAlign = "left"; g.textBaseline = "middle";
  g.font = "900 170px 'Arial Black', Arial"; { const t = "SEE THE", w = g.measureText(t).width, k = Math.min(1, 780 / w); g.save(); g.translate(60, 150); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); }
  g.fillStyle = "#c8352e"; g.font = "900 200px 'Arial Black', Arial"; { const t = "BRIDGE!", w = g.measureText(t).width, k = Math.min(1, 790 / w); g.save(); g.translate(60, 330); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); }
  g.fillStyle = "#1c3a6a"; g.fillRect(60, 440, 720, 130); g.fillStyle = "#f2c230"; g.font = "900 92px 'Arial Black', Arial"; { const t = "NEXT EXIT", w = g.measureText(t).width, k = Math.min(1, 560 / w); g.save(); g.translate(90, 506); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); }
  g.beginPath(); g.moveTo(690, 470); g.lineTo(750, 506); g.lineTo(690, 542); g.closePath(); g.fill();
  g.fillStyle = "#1c3a6a"; g.font = "italic 900 54px Georgia"; { const t = "From London, Stone by Stone", w = g.measureText(t).width, k = Math.min(1, 620 / w); g.save(); g.translate(870, 250); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); }
  for (let i = 0; i < 70; i++) { g.fillStyle = "rgba(255,255,255,0.15)"; g.fillRect(r() * 1536, r() * 640, 20 + r() * 80, 3); }
});
const thermoTex = () => ctex("dsThermo", 384, 1024, (g, r) => {
  g.fillStyle = "#1c3a6a"; g.fillRect(0, 0, 384, 1024);
  g.fillStyle = "#f4efe4"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "MIRAGE", 192, 70, 320, 64, SERIF); fitText(g, "SAVINGS", 192, 130, 320, 50, SERIF);
  // tube + bulb
  g.fillStyle = "#f4efe4"; g.beginPath(); g.roundRect(150, 190, 84, 540, 42); g.fill(); g.beginPath(); g.arc(192, 770, 82, 0, TAU); g.fill();
  g.fillStyle = "#e2302a"; g.beginPath(); g.roundRect(170, 230, 44, 520, 22); g.fill(); g.beginPath(); g.arc(192, 770, 62, 0, TAU); g.fill();
  g.fillStyle = "#f4efe4"; for (let k = 0; k < 10; k++) g.fillRect(240, 240 + k * 50, 26, 6);
  g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(178, 240, 10, 490);
  // the number panel: "110°" in bulbs
  g.fillStyle = "#2a2632"; g.fillRect(24, 870, 336, 140); g.fillStyle = "#ffcf5a"; fitText(g, "110°", 192, 942, 300, 120, SANS);
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(r() * 384, r() * 1024, 10 + r() * 30, 2); }
});
const townSignTex = () => ctex("dsTownSign", 1024, 640, (g, r) => {
  g.fillStyle = "#1f6a5a"; g.beginPath(); g.roundRect(0, 0, 1024, 640, 40); g.fill();
  g.strokeStyle = "#f4efe4"; g.lineWidth = 14; g.beginPath(); g.roundRect(22, 22, 980, 596, 30); g.stroke();
  g.fillStyle = "#f4efe4"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "WELCOME TO", 512, 96, 640, 72, SANS);
  g.fillStyle = "#ffd25a"; fitText(g, "LAKE MIRAGE", 512, 210, 880, 150, SCRIPT);
  g.fillStyle = "#f4efe4"; g.textAlign = "left"; fitText(g, "POP.", 90, 470, 220, 120, SANS);
  g.textAlign = "center"; fitText(g, "300", 560, 470, 380, 140, SANS);
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(r() * 1024, r() * 640, 10 + r() * 60, 2); }
});
const newPopTex = () => ctex("dsNewPop", 1024, 256, (g) => {
  g.fillStyle = "#f4efe4"; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "#c8352e"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "10,000", 512, 132, 900, 200, SANS);
  for (let k = 0; k < 20; k++) { g.fillStyle = "rgba(200,53,46,0.7)"; g.fillRect(80 + k * 44, 220 + (k % 3) * 6, 4, 14 + (k % 4) * 6); } // drips
});
const dinoTex = () => ctex("dsDino", 1024, 512, (g, r) => {
  g.fillStyle = "#5fae5a"; g.fillRect(0, 0, 1024, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(40,100,60,0.0)"); gr.addColorStop(0.7, "rgba(220,240,150,0.0)"); gr.addColorStop(1, "rgba(230,236,150,0.6)"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 70; i++) { const x = r() * 1024, y = r() * 360, rr = 10 + r() * 26; g.fillStyle = "rgba(40,110,60,0.55)"; g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, r(), 0, TAU); g.fill(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(200,190,180,0.7)"; g.beginPath(); g.ellipse(r() * 1024, r() * 512, 2 + r() * 6, 1 + r() * 4, r(), 0, TAU); g.fill(); } // paint chips (concrete shows)
  for (let i = 0; i < 12; i++) { g.strokeStyle = "rgba(60,80,60,0.4)"; g.lineWidth = 2; const x = r() * 1024, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 40, y + r() * 30); g.stroke(); }
});
const hutSignTex = () => faceTex("hut", ["BRIDGE SITE"], 768, 220, { bg: "#f4efe4", fg: "#1c3a6a", sub: "KEEP OUT - HARD HATS", subFg: "#c8352e", border: "#1c3a6a" });

// ================= the set =================
export const desert = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), r = rng(1968);
  // ---------- bridge ----------
  const br = oldBridge(root, { variant: "desert" });
  const addSolids = !solidsDone; solidsDone = true;
  if (addSolids) for (const so of br.SOLIDS) DESERT_SOLIDS.push(so);
  // ---------- terrain (tensor grid, dense around the bridge + channel; channel vertices are re-cut in pose) ----------
  const axis = (sp: [number, number, number][]) => { const o: number[] = []; for (const [a, c, s] of sp) for (let v = a; v < c - 1e-6; v += s) o.push(v); o.push(sp[sp.length - 1][1]); return o; };
  const XS = axis([[-950, -300, 30], [-300, -60, 2.5], [-60, 60, 0.8], [60, 170, 2], [170, 950, 30]]);
  const ZS = axis([[-950, -140, 30], [-140, -60, 2], [-60, 60, 0.8], [60, 200, 2], [200, 950, 30]]);
  const nx = XS.length, nz = ZS.length, NV = nx * nz;
  const pos = new Float32Array(NV * 3), colA = new Float32Array(NV * 3), uv = new Float32Array(NV * 2), base = new Float32Array(NV), baseCol = new Float32Array(NV * 3);
  const cSand = new THREE.Color("#f6d4c4"), cPink = new THREE.Color("#f2bcb8"), cGold = new THREE.Color("#fae0c0"), cDune = new THREE.Color("#e8b0a4"), cWet = new THREE.Color("#b88a7e"), cDeep = new THREE.Color("#5aa0a4"), cBed = new THREE.Color("#d89a8a"), tmp = new THREE.Color();
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = XS[i], z = ZS[j], k = j * nx + i, y = baseY(x, z);
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; base[k] = y; uv[k * 2] = x / 9; uv[k * 2 + 1] = z / 9;
    const n = 0.5 + 0.25 * Math.sin(x * 0.043 + z * 0.031) + 0.25 * Math.sin(x * 0.011 - z * 0.017 + 1.3), n2 = 0.5 + 0.5 * Math.sin(x * 0.09 + Math.sin(z * 0.07) * 2);
    const n3 = 0.5 + 0.5 * Math.sin(x * 0.021 + 2.1) * Math.sin(z * 0.027 + 0.3);
    tmp.copy(cSand).lerp(cPink, n * 0.7).lerp(cGold, Math.max(0, n2 - 0.55) * 1.4).lerp(cDune, sm((n3 - 0.6) / 0.3) * 0.55);
    const dl = z - shoreZ(x);
    if (dl < 2) tmp.lerp(cWet, sm((2 - dl) / 5) * 0.7);
    if (y < WL - 0.3) tmp.lerp(cDeep, sm((WL - 0.3 - y) / 2));
    colA[k * 3] = baseCol[k * 3] = tmp.r; colA[k * 3 + 1] = baseCol[k * 3 + 1] = tmp.g; colA[k * 3 + 2] = baseCol[k * 3 + 2] = tmp.b;
  }
  const tIdx: number[] = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, c = a + nx; tIdx.push(a, c, a + 1, a + 1, c, c + 1); }
  const tGeo = new THREE.BufferGeometry(); tGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); tGeo.setAttribute("color", new THREE.BufferAttribute(colA, 3)); tGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); tGeo.setIndex(tIdx); tGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(tGeo, lam("dsTerrain", () => ({ map: sandTex(), vertexColors: true }))); terrain.receiveShadow = true; terrain.matrixAutoUpdate = false; root.add(terrain);
  // channel vertices (index, s, d, centre z)
  const CV: { k: number; s: number; d: number; zc: number }[] = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = XS[i], z = ZS[j]; if (x > 40 || x < -310 || z < -125 || z > 85) continue;
    const p = canalProj(x, z); if (p.dist < 34 && p.s > S_MOUTH - 14) CV.push({ k: j * nx + i, s: p.s, d: p.d, zc: CN.Z[Math.round(p.s / CN.ds)] });
  }
  let lastCut = "";
  const recut = (dig: number, water: number, grow: number) => {
    const key = `${dig.toFixed(4)}|${water.toFixed(3)}|${grow.toFixed(3)}`; if (key === lastCut) return; lastCut = key;
    for (const v of CV) {
      const c = cutAt(v.s, v.d, dig, water, grow, v.zc), y = Math.min(base[v.k], -c.cut) + c.berm;
      pos[v.k * 3 + 1] = y;
      const wet = water > 0 ? sm((water - 0.05) / 0.4) : 0, dk = sm(c.cut / 1.2);
      tmp.setRGB(baseCol[v.k * 3], baseCol[v.k * 3 + 1], baseCol[v.k * 3 + 2]).lerp(cBed, dk * 0.65).lerp(cWet, dk * wet * 0.8);
      if (c.berm > 0.05) tmp.lerp(cGold, 0.25);
      colA[v.k * 3] = tmp.r; colA[v.k * 3 + 1] = tmp.g; colA[v.k * 3 + 2] = tmp.b;
    }
    tGeo.attributes.position.needsUpdate = true; tGeo.attributes.color.needsUpdate = true; tGeo.computeVertexNormals(); tGeo.computeBoundingSphere();
  };
  // ---------- lake water (south + west bay), shore foam ----------
  const water = waterMaterial();
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(1900, 1000).rotateX(-Math.PI / 2), water); m.position.set(0, WL, -48 - 500); m.receiveShadow = true; root.add(m);
    const m2 = new THREE.Mesh(new THREE.PlaneGeometry(760, 260).rotateX(-Math.PI / 2), water); m2.position.set(-196 - 380, WL, -48 + 130); m2.receiveShadow = true; root.add(m2);
    // foam line along the water edge
    const fp: number[] = [], fu: number[] = [], fi: number[] = []; let n = 0;
    for (let x = -150; x <= 600; x += 2) { if (Math.abs(x) < 27) { continue; } const z = shoreZ(x) - 5.0; for (const dz of [-0.9, 0.7]) { fp.push(x, WL + 0.02, z + dz); fu.push(x / 12, dz < 0 ? 0 : 1); } if (n > 0 && Math.abs(x - (fp[(n - 1) * 6] ?? x)) < 3) fi.push((n - 1) * 2, (n - 1) * 2 + 1, n * 2, n * 2, (n - 1) * 2 + 1, n * 2 + 1); n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(fu, 2)); g.setIndex(fi);
    const fm = new THREE.Mesh(g, mat("dsShoreFoam", () => new THREE.MeshBasicMaterial({ map: foamTexD(), transparent: true, depthWrite: false, opacity: 0.75 }))); fm.layers.set(NOINK); fm.renderOrder = 2; root.add(fm); }
  // ---------- channel water (ribbon, levels set in pose) + flood front ----------
  const RS = 1.5, CROSS = 25;
  const ribS: number[] = []; for (let s = S_MOUTH; s <= S_END; s += RS) ribS.push(s);
  const ribPos = new Float32Array(ribS.length * CROSS * 3), ribIdx: number[] = [];
  ribS.forEach((s, j) => { const i = Math.round(s / CN.ds), hw = hwFull(s) + 1.5; for (let k = 0; k < CROSS; k++) { const d = -hw + (2 * hw * k) / (CROSS - 1), o = (j * CROSS + k) * 3; ribPos[o] = CN.X[i] - CN.TZ[i] * d; ribPos[o + 1] = -6; ribPos[o + 2] = CN.Z[i] + CN.TX[i] * d; } });
  for (let j = 0; j < ribS.length - 1; j++) for (let k = 0; k < CROSS - 1; k++) { const a = j * CROSS + k, c = a + CROSS; ribIdx.push(a, a + 1, c, a + 1, c + 1, c); }
  const ribGeo = new THREE.BufferGeometry(); ribGeo.setAttribute("position", new THREE.BufferAttribute(ribPos, 3)); ribGeo.setIndex(ribIdx); ribGeo.computeVertexNormals();
  ribGeo.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(ribS.length * CROSS * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  const canalW = new THREE.Mesh(ribGeo, water); canalW.receiveShadow = true; canalW.frustumCulled = false; root.add(canalW);
  const frontFoam = new THREE.Mesh(new THREE.PlaneGeometry(1, 3.2).rotateX(-Math.PI / 2), mat("dsFrontFoam", () => new THREE.MeshBasicMaterial({ map: foamTexD(), transparent: true, depthWrite: false }))); frontFoam.layers.set(NOINK); frontFoam.renderOrder = 3; root.add(frontFoam);
  const mouthFoam = new THREE.Mesh(new THREE.PlaneGeometry(1, 5).rotateX(-Math.PI / 2), mat("dsFrontFoam", () => new THREE.MeshBasicMaterial({ map: foamTexD(), transparent: true, depthWrite: false }))); mouthFoam.layers.set(NOINK); mouthFoam.renderOrder = 3; root.add(mouthFoam);
  const splashes = Array.from({ length: 14 }, () => mist(root, [0, 0, 0], 2.2, "#f4fdff", 0.8));
  let lastWater = "";
  const setWater = (dig: number, wv: number) => {
    const key = `${dig.toFixed(4)}|${wv.toFixed(4)}`; if (key === lastWater) return; lastWater = key;
    canalW.visible = wv > 0.001;
    if (!canalW.visible) return;
    const sf = S_PLUG + (S_END - S_PLUG) * cl(wv / 0.7), Lf = -2.05 + 1.45 * sm((wv - 0.55) / 0.45);
    ribS.forEach((s, j) => {
      const D = 2.5 * Math.min(1, dig / 0.45) * sm((dig * 1.8 - Math.abs(s - S_BRIDGE) / 260) / 0.15);
      let y = Lf + (WL - Lf) * Math.exp(-(s - S_MOUTH) / 28);
      if (s > sf) y = -7; else if (s > sf - 12) y = lerp(y, -D - 0.35, sm((s - (sf - 12)) / 12));
      if (wv >= 0.999) y = WL;
      for (let k = 0; k < CROSS; k++) ribPos[(j * CROSS + k) * 3 + 1] = y;
    });
    ribGeo.attributes.position.needsUpdate = true;
  };
  // ---------- pier footings (concrete, under the bridge piers) ----------
  { const conc = tex("concrete", () => ctex("dsConcrete", 512, 512, (g, rr) => { g.fillStyle = "#c8bcae"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 30; i++) blot(g, rr() * 512, rr() * 512, 40 + rr() * 80, rr() < 0.5 ? "rgba(240,232,220,0.3)" : "rgba(130,110,110,0.2)"); g.strokeStyle = "rgba(110,96,100,0.5)"; g.lineWidth = 3; for (let y = 0; y < 512; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); } for (let i = 0; i < 1200; i++) { g.fillStyle = rr() < 0.5 ? "rgba(90,80,90,0.25)" : "rgba(255,250,240,0.3)"; g.fillRect(rr() * 512, rr() * 512, 2, 2); } const gg = g.createLinearGradient(0, 300, 0, 512); gg.addColorStop(0, "rgba(120,140,140,0)"); gg.addColorStop(1, "rgba(120,140,140,0.35)"); g.fillStyle = gg; g.fillRect(0, 300, 512, 212); }));
    for (const [a, c] of PIERS) b.add(boxGeo(V(a - 0.7, -2.9, -BW / 2 - 1.0), V(c + 0.7, 0.02, BW / 2 + 1.0), 2), conc); }
  // ---------- approach embankments (sand fill ramps), payoff paving ----------
  const rampTop = (ax: number) => (ax < 54 ? DECK - 0.02 : DECK * (1 - sm((ax - 54) / 58)) - 0.02);
  const pave = new THREE.Group(); root.add(pave);
  for (const sx of [-1, 1]) {
    const prof: [number, number][] = [[-12, -0.3], [-7.3, 0], [7.3, 0], [12, -0.3]];
    const P: number[] = [], U: number[] = [], I: number[] = [], NXs = 60;
    for (let i = 0; i <= NXs; i++) { const ax = 47.5 + (i / NXs) * 66, h = rampTop(ax), wid = lerp(1, 1.5, sm((ax - 54) / 50));
      for (const [zz, dy] of prof) { const edge = Math.abs(zz) > 8; const y = edge ? Math.max(-0.4, -0.3 + 0 * h) : h; P.push(sx * ax, edge ? y : y, zz * (edge ? wid + (h / 12) * 0.8 : 1)); U.push((sx * ax) / 9, zz / 9); void dy; } }
    for (let i = 0; i < NXs; i++) for (let k = 0; k < 3; k++) { const a = i * 4 + k, c = a + 4; if (sx < 0) I.push(a, c, a + 1, a + 1, c, c + 1); else I.push(a, a + 1, c, a + 1, c + 1, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    b.add(g, lam("dsRampSand", () => ({ map: sandTex(), color: "#f6d4c4" })));
    // payoff paving on the ramp top (asphalt + kerbs), hidden until grow
    const pg: number[] = [], pu: number[] = [], pi: number[] = [];
    for (let i = 0; i <= NXs; i++) { const ax = 48 + (i / NXs) * 64, h = rampTop(ax) + 0.04; for (const zz of [-4.5, 4.5]) { pg.push(sx * ax, h, zz); pu.push(zz < 0 ? 0 : 1, ax / 12); } }
    for (let i = 0; i < NXs; i++) { const a = i * 2, c = a + 2; if (sx < 0) pi.push(a, c, a + 1, a + 1, c, c + 1); else pi.push(a, a + 1, c, a + 1, c + 1, c); }
    const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute("position", new THREE.Float32BufferAttribute(pg, 3)); pgeo.setAttribute("uv", new THREE.Float32BufferAttribute(pu, 2)); pgeo.setIndex(pi); pgeo.computeVertexNormals();
    const pm = new THREE.Mesh(pgeo, mat("dsAsphM", () => twoTone(new THREE.MeshLambertMaterial({ map: asphaltTex(true) })))); pm.receiveShadow = true; pave.add(pm);
  }
  // ---------- roads: asphalt ribbons + graded streets ----------
  const asphM = mat("dsAsphM", () => twoTone(new THREE.MeshLambertMaterial({ map: asphaltTex(true) })));
  const gradM = mat("dsGradM", () => twoTone(new THREE.MeshLambertMaterial({ map: gradedTex() })));
  const ribbon = (cp: [number, number][], w: number, m: THREE.Material, y = 0.03, vLen = 12) => {
    const P = mkPath(cp, 1.0), pts: number[] = [], uu: number[] = [], ii: number[] = [];
    const n = Math.max(2, Math.round(P.L / 1.0));
    for (let i = 0; i <= n; i++) { const a = P.at((i / n) * P.L), nn = V(-a.dir.z, 0, a.dir.x); for (const s of [-1, 1]) { pts.push(a.p.x + nn.x * s * w / 2, y + Math.max(0, baseY(a.p.x + nn.x * s * w / 2, a.p.z + nn.z * s * w / 2)) * 0, a.p.z + nn.z * s * w / 2); uu.push(s < 0 ? 0 : 1, ((i / n) * P.L) / vLen); } }
    for (let i = 0; i < n; i++) { const a = i * 2, c = a + 2; ii.push(a, a + 1, c, a + 1, c + 1, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uu, 2)); g.setIndex(ii); g.computeVertexNormals();
    const me = new THREE.Mesh(g, m); me.receiveShadow = true; me.matrixAutoUpdate = false;
    // flip winding if it faces down
    const nrm = g.attributes.normal as THREE.BufferAttribute; if (nrm.getY(0) < 0) { g.setIndex(ii.map((_, k) => ii[k - (k % 3) + [0, 2, 1][k % 3]])); g.computeVertexNormals(); }
    root.add(me); return me;
  };
  ribbon([[-950, HWY_Z], [950, HWY_Z]], 9, asphM, 0.05, 12);
  ribbon([[-30, MAIN_Z], [135, MAIN_Z]], 9, asphM, 0.06, 12);
  ribbon([[BLVD_X, MAIN_Z], [BLVD_X, 150], [BLVD_X - 0.5, 156], [BLVD_X - 4, HWY_Z]], 8.5, asphM, 0.055, 12);
  ribbon([[BRIDGE_RD_X, MAIN_Z], [BRIDGE_RD_X, 40], [116, 26], [112, 12], [112, 2], [112.5, 0]], 9, asphM, 0.055, 12);
  ribbon([[-60, 165.5], [-92, 166.5], [-92, 176.5], [-48, 176.5], [-48, 165.5], [-60, 165.5]], 1, gradM, 0.04);
  { const lot = new THREE.Mesh(new THREE.PlaneGeometry(44, 11).rotateX(-Math.PI / 2), mat("dsGravelLot", () => twoTone(new THREE.MeshLambertMaterial({ map: gradedTex() })))); lot.position.set(-70, 0.045, 171); lot.receiveShadow = true; root.add(lot);
    const lot2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 14).rotateX(-Math.PI / 2), mat("dsGravelLot", () => twoTone(new THREE.MeshLambertMaterial({ map: gradedTex() })))); lot2.position.set(106, 0.045, 21); lot2.receiveShadow = true; root.add(lot2);
    for (let k = 0; k < 6; k++) { b.add(new THREE.PlaneGeometry(0.15, 4).rotateX(-Math.PI / 2).translate(-88 + k * 6, 0.06, 173), col("#f4f0e6")); b.add(new THREE.PlaneGeometry(0.15, 4.5).rotateX(-Math.PI / 2).translate(98 + k * 3.4, 0.06, 24), col("#f4f0e6")); } }
  for (const [cp, w] of [
    [[[-30, 55], [135, 55]], 9], [[[-30, 76], [135, 76]], 9], [[[-30, 124], [135, 124]], 9], [[[-22, 50], [-22, 150]], 8], [[[70, 50], [70, 150]], 8],
    [[[300, -15.5], [80, -15.5], [62, -15.6], [48, -15.5]], 7], [[[BLVD_X, 50], [BLVD_X, MAIN_Z]], 8],
  ] as [[number, number][], number][]) ribbon(cp, w, gradM, 0.035, 14);
  // sidewalk + kerb in front of the office block
  b.add(boxGeo(V(24, 0, 102.4), V(56, 0.1, 104.1)), tex("sidewalk", () => ctex("dsSidewalk", 512, 128, (g, rr) => { g.fillStyle = "#e0d2c6"; g.fillRect(0, 0, 512, 128); for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(120,100,104,0.5)"; g.fillRect(x, 0, 2, 128); } for (let i = 0; i < 600; i++) { g.fillStyle = rr() < 0.5 ? "rgba(255,255,255,0.3)" : "rgba(120,100,104,0.2)"; g.fillRect(rr() * 512, rr() * 128, 2, 2); } blot(g, 300, 60, 40, "rgba(150,120,110,0.25)"); })));
  b.add(boxGeo(V(24, 0, 102.3), V(56, 0.12, 102.45)), col("#f4f0e6"));
  // ---------- tyre tracks (static decals): haul road, Bridge Road verge, site ----------
  const tyreM = mat("dsTyreT", () => new THREE.MeshBasicMaterial({ map: treadTex("tyre"), transparent: true, depthWrite: false, opacity: 0.9 }));
  const crawlM = mat("dsCrawlT", () => twoTone(new THREE.MeshLambertMaterial({ map: treadTex("crawler"), transparent: true, depthWrite: false })));
  const siteDecals: THREE.Mesh[] = [];
  const decal = (cp: [number, number][], w: number, m: THREE.Material, off: number[], y = 0.045, vl = 3) => {
    for (const o of off) { const P = mkPath(cp, 1.0), n = Math.max(2, Math.round(P.L)), pts: number[] = [], uu: number[] = [], ii: number[] = [];
      for (let i = 0; i <= n; i++) { const a = P.at((i / n) * P.L), nn = V(-a.dir.z, 0, a.dir.x); for (const s of [-1, 1]) { const x = a.p.x + nn.x * (o + s * w / 2), z = a.p.z + nn.z * (o + s * w / 2); pts.push(x, Math.max(baseY(x, z), 0) + y, z); uu.push(s < 0 ? 0 : 1, ((i / n) * P.L) / vl); } }
      for (let i = 0; i < n; i++) { const a = i * 2, c = a + 2; ii.push(a, c, a + 1, a + 1, c, c + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uu, 2)); g.setIndex(ii);
      g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pts.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
      const me = new THREE.Mesh(g, m); me.layers.set(NOINK); me.renderOrder = 1; me.receiveShadow = true; root.add(me); siteDecals.push(me); }
  };
  decal([[60, -21], [40, -12], [26, -10], [14, -11.5], [-14, -13], [-30, -18]], 0.5, tyreM, [-1.0, 1.0]);
  decal([[70, -28], [52, -26], [38, -30], [30, -38], [36, -44]], 0.45, tyreM, [-0.9, 0.9]);
  decal([[-40, -16], [-20, -12], [-12, -11], [-14, 8], [-24, 16], [-40, 20]], 0.7, crawlM, [-1.2, 1.2]);
  decal([[22, 24], [16, 12], [20, -2], [27, -8]], 0.7, crawlM, [-1.2, 1.2]);
  // dozer tracks behind the dozer (dynamic: length + height follow the dozer / the cut)
  const DZT = 48, dzTrackPos = new Float32Array(2 * DZT * 2 * 3), dzTI: number[] = [];
  for (let s = 0; s < 2; s++) for (let i = 0; i < DZT - 1; i++) { const a = s * DZT * 2 + i * 2, c = a + 2; dzTI.push(a, c, a + 1, a + 1, c, c + 1); }
  const dzTGeo = new THREE.BufferGeometry(); dzTGeo.setAttribute("position", new THREE.BufferAttribute(dzTrackPos, 3)); dzTGeo.setIndex(dzTI);
  { const uvT = new Float32Array(2 * DZT * 2 * 2); for (let s = 0; s < 2; s++) for (let i = 0; i < DZT; i++) for (let e = 0; e < 2; e++) { const o = ((s * DZT + i) * 2 + e) * 2; uvT[o] = e; uvT[o + 1] = i * 0.9 / 1.0; } dzTGeo.setAttribute("uv", new THREE.BufferAttribute(uvT, 2)); }
  dzTGeo.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(2 * DZT * 2 * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  const dzTracks = new THREE.Mesh(dzTGeo, crawlM); dzTracks.layers.set(NOINK); dzTracks.renderOrder = 1; dzTracks.frustumCulled = false; root.add(dzTracks);
  // ---------- desert scatter (cacti, scrub, rocks) ----------
  const busy = (x: number, z: number) => {
    if (Math.abs(x) < 120 && z > -12 && z < 12 && Math.abs(x) > 44) return true;              // ramps
    if (Math.abs(x) < 50 && Math.abs(z) < 11) return true;                                      // under the bridge
    if (canalProj(x, z).dist < 34 && x < 40 && z > -60 && z < 80) return true;                  // the channel
    if (z - shoreZ(x) < 3) return true;                                                          // lake + beach
    if (x > -40 && x < 145 && z > 44 && z < 152) return true;                                   // the town grid
    if (Math.abs(z - HWY_Z) < 9 || (x > -95 && x < -44 && z > 163 && z < 190)) return true;     // highway + dino lot
    if (Math.abs(x - BRIDGE_RD_X) < 8 && z > 0 && z < 100) return true;
    if (x > 20 && x < 75 && z < -6 && z > -46) return true;                                     // the site
    if (x > -14 && x < 10 && z < -6 && z > -30) return true;                                    // frame-1 lane
    for (let i = 0; i < BOSS_PATH.pts.length; i += 6) { const q = BOSS_PATH.pts[i]; if (Math.hypot(q.x - x, q.z - z) < 7) return true; } // boss car route
    if (Math.abs(z + 15.5) < 5 && x > 40) return true;                                           // haul road
    return false;
  };
  for (let i = 0; i < 900; i++) {
    const a = r() * TAU, d = 14 + Math.pow(r(), 0.7) * 300, x = Math.cos(a) * d * 1.3, z = 40 + Math.sin(a) * d; if (busy(x, z)) continue;
    const y = baseY(x, z), k = r();
    if (k < 0.5) scrub(b, x, y, z, 0.7 + r() * 0.8, i); else if (k < 0.66) saguaro(b, x, y, z, 3 + r() * 4.5, i); else if (k < 0.78) barrelCactus(b, x, y, z, 0.25 + r() * 0.2, i); else if (k < 0.86) pricklyPear(b, x, y, z, 0.8 + r() * 0.5, i); else rock(b, x, y, z, 0.3 + r() * 1.2, i);
  }
  // hero dressing near the frame-1 view (lake side of the bridge) and the town edge
  for (const [x, z, k, s] of [[-24.5, -17, 0, 5.6], [-21.5, -24, 1, 0.9], [-13.8, -21, 2, 0.4], [14.5, -27, 0, 6.4], [17, -21, 3, 1.2], [-24, -12, 4, 1.4], [12.5, -14.5, 4, 0.8], [-15.5, -27.5, 1, 1.1],
    [-30, 30, 0, 7], [36, 30, 0, 5], [-44, 54, 0, 6], [148, 70, 0, 7.5], [150, 120, 0, 6]] as [number, number, number, number][]) {
    const y = baseY(x, z); if (k === 0) saguaro(b, x, y, z, s, Math.round(x * 7 + z)); else if (k === 1) scrub(b, x, y, z, s, Math.round(x * 3)); else if (k === 2) barrelCactus(b, x, y, z, s, 3); else if (k === 3) pricklyPear(b, x, y, z, s, 4); else rock(b, x, y, z, s, Math.round(z));
  }
  // frame-1 foreground: a rock + barrel cactus (right), a cone + a shovel stuck in the sand + a water jug (left)
  rock(b, -11.6, 0, -12.4, 0.5, 77); barrelCactus(b, -11.0, 0, -13.6, 0.24, 2); scrub(b, -12.6, 0, -11.0, 0.8, 41);
  b.add(new THREE.ConeGeometry(0.2, 0.62, 10).translate(-5.2, 0.33, -12.6), col("#f06a2a")); b.add(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 10).translate(-5.2, 0.42, -12.6), col("#f4efe4")); b.add(new THREE.BoxGeometry(0.44, 0.04, 0.44).translate(-5.2, 0.02, -12.6), col("#f06a2a"));
  b.add(rodGeo([-6.6, 0.0, -13.2], [-6.75, 1.15, -13.05], 0.025), col("#a8724a")); b.add(new THREE.BoxGeometry(0.24, 0.3, 0.03).rotateZ(0.1).translate(-6.6, -0.05, -13.2), col("#7a7488"));
  b.add(new RoundedBoxGeometry(0.3, 0.42, 0.3, 2, 0.08).translate(-5.9, 0.21, -13.9), shiny("dsJug", "#d8302a", 60)); b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8).translate(-5.9, 0.47, -13.9), col("#f4efe4"));
  // ---------- far mesas / buttes and the mountain rings ----------
  { const rk = tex("rock", rockTex);
    for (const [x, z, rad, h] of [[-330, 380, 40, 46], [260, 420, 55, 38], [520, 120, 60, 52], [-520, 60, 50, 40], [420, -380, 45, 30], [-380, -420, 40, 34], [80, 520, 70, 44]] as [number, number, number, number][]) {
      const y = baseY(x, z) - 2; b.add(new THREE.CylinderGeometry(rad * 0.82, rad * 1.25, h, 12).translate(x, y + h / 2, z), rk);
      b.add(new THREE.CylinderGeometry(rad * 1.25, rad * 2.0, h * 0.35, 12).translate(x, y + h * 0.17, z), rk); }
    const ring = (R: number, hmin: number, hmax: number, seed: number, key: string, cols: [string, string, string, string]) => {
      const N = 220, P: number[] = [], U: number[] = [], I: number[] = [], rr = rng(seed);
      const ph = [rr() * 10, rr() * 10, rr() * 10];
      for (let i = 0; i <= N; i++) { const a = (i / N) * TAU, n = 0.5 + 0.28 * Math.sin(a * 5 + ph[0]) + 0.16 * Math.sin(a * 13 + ph[1]) + 0.08 * Math.sin(a * 31 + ph[2]) + 0.05 * Math.sin(a * 67), h = hmin + (hmax - hmin) * Math.max(0, n);
        const x = Math.cos(a) * R, z = 60 + Math.sin(a) * R; P.push(x, -6, z, x * 0.985, h, 60 + (z - 60) * 0.985); U.push((i / N) * 6, 0, (i / N) * 6, 1); }
      for (let i = 0; i < N; i++) { const a = i * 2, c = a + 2; I.push(a, a + 1, c, a + 1, c + 1, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat("dsMtnM" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: (() => { const t = mountainTex(key, ...cols); t.wrapS = THREE.RepeatWrapping; return t; })(), side: THREE.DoubleSide })))); m.matrixAutoUpdate = false; root.add(m);
    };
    ring(700, 20, 95, 3, "near", ["#d0786a", "#b8606a", "#a05a72", "#7a3a5a"]);
    ring(860, 50, 150, 7, "mid", ["#c48296", "#a87098", "#946a9a", "#6a4a7a"]);
    ring(1010, 90, 210, 11, "far", ["#c8a0c4", "#b496c0", "#a690bc", "#8a7aa8"]); }
  // ---------- the bulldozer, sand pile, dust ----------
  const site = new THREE.Group(); root.add(site);
  const sB = new Batch();
  const dzG = new THREE.Group(); root.add(dzG);
  const dz = dozer(dzG);
  const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2).scale(2.0, 0.75, 1.1), lam("dsPile", () => ({ map: sandTex(), color: "#f6d2b2" }))); pile.castShadow = true; pile.receiveShadow = true; dz.g.add(pile); pile.position.set(0, -0.1, 4.0);
  const dzDust = Array.from({ length: 9 }, () => mist(root, [0, 0, 0], 2.4, "#eab89c", 0.32));
  const dzSmoke = Array.from({ length: 6 }, () => mist(root, [0, 0, 0], 0.9, "#7a6e86", 0.45));
  // ---------- the truck crane + numbered block + pallets ----------
  const cr = crane(site, { boomLen: 46 }); cr.g.position.set(...CRANE_AT); cr.g.rotation.y = -0.4;
  for (const so of cr.SOLIDS) void so;
  const blockM = (n: string) => mat("dsBlockM" + n, () => twoTone(new THREE.MeshLambertMaterial({ map: graniteBlockTex(n) })));
  const hookLoad = new THREE.Group(); cr.hook.add(hookLoad);
  { const lb = new Batch(); lb.add(new RoundedBoxGeometry(1.8, 0.9, 1.1, 2, 0.04).translate(0, -2.2, 0), blockM("3-14-312"));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) lb.add(rodGeo([0, 0.05, 0], [sx * 0.8, -1.75, sz * 0.45], 0.02, 4), col("#5a5664"));
    lb.add(new THREE.BoxGeometry(1.84, 0.06, 0.12).translate(0, -1.74, -0.45), col("#c8352e")); lb.add(new THREE.BoxGeometry(1.84, 0.06, 0.12).translate(0, -1.74, 0.45), col("#c8352e"));
    lb.build(hookLoad); hookLoad.traverse((m) => { (m as THREE.Mesh).castShadow = true; }); }
  { const nums = ["3-14-301", "3-14-305", "3-14-309", "3-14-310", "3-14-311", "3-14-313", "3-14-314", "3-14-316", "3-14-318"];
    nums.forEach((n, i) => { const px = PALLET_AT[0] - 2.4 + (i % 3) * 2.4, pz = PALLET_AT[2] - 2.0 + Math.floor(i / 3) * 2.0;
      sB.add(boxGeo(V(px - 1.05, 0, pz - 0.7), V(px + 1.05, 0.16, pz + 0.7)), tex("dsPallet", () => beamHD()));
      const blk = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.9, 1.1, 2, 0.04), blockM(n)); blk.position.set(px, 0.61, pz); blk.rotation.y = (hash(i) - 0.5) * 0.1; blk.castShadow = true; blk.receiveShadow = true; site.add(blk); });
    for (let i = 0; i < 4; i++) { const blk = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.8, 1.0, 2, 0.04), blockM(["2-07-118", "2-07-121", "4-02-033", "4-02-040"][i])); blk.position.set(PALLET_AT[0] + 4.6, 0.4 + (i % 2) * 0.82, PALLET_AT[2] - 1 + Math.floor(i / 2) * 1.2); blk.castShadow = true; site.add(blk); }
    const sb = new Batch(); bridgeCrate(sb, PALLET_AT[0] - 5.2, 0, PALLET_AT[2] + 1.5, 1.6, 1.3, 1.3, 2, 0.3); bridgeCrate(sb, PALLET_AT[0] - 5.4, 0, PALLET_AT[2] - 1.0, 1.2, 1.0, 1.2, 3, -0.2); bridgeCrate(sb, PALLET_AT[0] - 5.3, 1.3, PALLET_AT[2] + 1.5, 1.0, 0.8, 1.0, 1, 0.1); sb.build(site); }
  // ---------- scaffold tower + walkway on the centre arch (-z face) ----------
  { const sb = new Batch(), tube = shiny("dsTube", "#9aa0b0", 60), plank = tex("dsPlank", () => beamHD());
    const xs = [7.6, 9.5, 11.4], zs = [-9.6, -7.5];
    for (const x of xs) for (const z of zs) sb.add(new THREE.CylinderGeometry(0.05, 0.05, DECK + 3.2, 6).translate(x, (DECK + 3.2) / 2 - 2.9, z), tube);
    for (let y = 0.3; y < DECK + 0.3; y += 2.0) { for (const z of zs) sb.add(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6).rotateZ(Math.PI / 2).translate(9.5, y, z), tube); for (const x of xs) sb.add(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6).rotateX(Math.PI / 2).translate(x, y, -8.55), tube);
      sb.add(boxGeo(V(7.5, y + 0.05, -9.7), V(11.5, y + 0.12, -7.4)), plank); sb.add(rodGeo([7.6, y, -9.6], [11.4, y + 2.0, -9.6], 0.035), tube); }
    // ladder inside the tower
    for (const x of [8.0, 8.5]) sb.add(new THREE.BoxGeometry(0.06, DECK, 0.06).translate(x, DECK / 2, -8.0), col("#c8a070"));
    for (let y = 0.3; y < DECK; y += 0.35) sb.add(new THREE.BoxGeometry(0.5, 0.04, 0.04).translate(8.25, y, -8.0), col("#c8a070"));
    // spandrel walkway hung from the parapet across the centre arch: brackets + planks + rail, y 8.7
    for (let x = -7.5; x <= 7.6; x += 2.5) { sb.add(new THREE.BoxGeometry(0.08, 2.6, 0.08).translate(x, DECK - 0.1, -7.75), tube); sb.add(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6).rotateX(Math.PI / 2).translate(x, 8.75, -8.15), tube); }
    sb.add(boxGeo(V(-7.8, 8.7, -8.75), V(11.5, 8.8, -7.55)), plank); sb.add(new THREE.CylinderGeometry(0.035, 0.035, 19.3, 6).rotateZ(Math.PI / 2).translate(1.85, 9.7, -8.7), tube);
    for (let x = -7.5; x <= 11.4; x += 2.5) sb.add(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6).translate(x, 9.2, -8.7), tube);
    // a bucket, a coil of rope, a mortar tub on the walkway
    sb.add(new THREE.CylinderGeometry(0.18, 0.15, 0.3, 10).translate(-3.2, 8.95, -8.2), col("#7a7488")); sb.add(new THREE.BoxGeometry(0.9, 0.25, 0.55).translate(2.2, 8.93, -8.15), col("#6a5a6e"));
    sb.build(site); }
  // ---------- site hut, chart stand, barrels, cones, generator ----------
  { const tin = tex("dsTinR", () => tinTex("#b8b6c2")), wood = tex("dsHutWood", () => beamHD()), H = HUT;
    sB.add(boxGeo(V(H[0] - 3, 0.25, H[2] - 2.2), V(H[0] + 3, 3.0, H[2] + 2.2), 2), tin);
    const roofG = new THREE.BoxGeometry(6.8, 0.1, 5.2); roofG.rotateX(0.08); roofG.translate(H[0], 3.2, H[2]); sB.add(roofG, tex("dsTinRoof", () => tinTex("#a8a2b4")));
    for (const [x, z] of [[-2.8, -2], [2.8, -2], [-2.8, 2], [2.8, 2]]) sB.add(new THREE.BoxGeometry(0.3, 0.3, 0.3).translate(H[0] + x, 0.12, H[2] + z), wood);
    sB.add(boxGeo(V(H[0] + 0.6, 0.25, H[2] + 2.19), V(H[0] + 1.6, 2.3, H[2] + 2.25)), col("#3f7fbf"));
    sB.add(new THREE.PlaneGeometry(1.4, 0.9).translate(H[0] - 1.4, 1.7, H[2] + 2.21), tex("win", () => ctex("dsHutWin", 128, 96, (g) => { g.fillStyle = "#f4efe4"; g.fillRect(0, 0, 128, 96); const gg = g.createLinearGradient(0, 0, 0, 96); gg.addColorStop(0, "#9cc4ea"); gg.addColorStop(1, "#3a5a8e"); g.fillStyle = gg; g.fillRect(8, 8, 112, 80); g.fillStyle = "#f4efe4"; g.fillRect(60, 8, 6, 80); })));
    for (let k = 0; k < 4; k++) sB.add(boxGeo(V(H[0] + 0.3, 0.05 + k * 0.08, H[2] + 2.3 + k * 0.28), V(H[0] + 1.9, 0.13 + k * 0.08, H[2] + 2.6 + k * 0.28)), wood);
    const hs = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.92), unlitM("hutSign", hutSignTex)); hs.position.set(H[0] - 0.6, 2.62, H[2] + 2.23); site.add(hs);
    // flag pole + flag
    sB.add(rodGeo([H[0] - 3.6, 0, H[2] + 1.5], [H[0] - 3.6, 7.5, H[2] + 1.5], 0.05), col("#e8e2d6"));
    const fg = new THREE.Group(); fg.position.set(H[0] - 3.6, 7.4, H[2] + 1.5); site.add(fg); fg.rotation.y = 0.6;
    flags.push(cloth(fg, 1.6, 0.95, mat("dsFlagM", () => twoTone(new THREE.MeshLambertMaterial({ map: flagTex(), side: THREE.DoubleSide }))), 0.14, 1.1));
    // chart board on an easel stand
    const C = CHART;
    for (const sx of [-1, 1]) sB.add(rodGeo([C[0] + sx * 1.0, 0, C[2] + 0.35], [C[0] + sx * 0.85, 2.6, C[2]], 0.05), wood);
    sB.add(rodGeo([C[0], 0, C[2] + 0.95], [C[0], 2.4, C[2] + 0.06], 0.05), wood);
    sB.add(boxGeo(V(C[0] - 1.25, 0.95, C[2] - 0.04), V(C[0] + 1.25, 2.65, C[2] + 0.04)), wood);
    sB.add(boxGeo(V(C[0] - 1.3, 0.88, C[2] - 0.05), V(C[0] + 1.3, 0.96, C[2] + 0.22)), wood);
    const ch = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.6), unlitM("chart", chartTex)); ch.position.set(C[0], 1.8, C[2] - 0.06); ch.rotation.y = Math.PI; site.add(ch);
    // barrels, cones, a generator, a toolbox, a water cooler on a crate
    for (const [x, z, c] of [[56, -29, "#c8352e"], [57, -28.4, "#2f7fd1"], [55.6, -27.8, "#c8352e"], [64, -37.5, "#e8e2d6"]] as [number, number, string][]) { sB.add(new THREE.CylinderGeometry(0.33, 0.33, 0.9, 14).translate(x, 0.45, z), shiny("dsDrum" + c, c, 40)); sB.add(new THREE.TorusGeometry(0.335, 0.025, 4, 18).rotateX(Math.PI / 2).translate(x, 0.6, z), col("#4a4458")); }
    for (const [x, z] of [[24, -8.5], [26, -9.2], [28, -8.6], [48, -12.5], [44, -12.2], [-12.5, -19.5]] as [number, number][]) { sB.add(new THREE.ConeGeometry(0.2, 0.62, 10).translate(x, 0.33, z), col("#f06a2a")); sB.add(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 10).translate(x, 0.42, z), col("#f4efe4")); sB.add(new THREE.BoxGeometry(0.44, 0.04, 0.44).translate(x, 0.02, z), col("#f06a2a")); }
    sB.add(new RoundedBoxGeometry(1.4, 0.9, 0.8, 2, 0.08).translate(66, 0.55, -30), col("#3f7a4a")); sB.add(rodGeo([66.4, 1.0, -30], [66.4, 1.6, -30], 0.05), col("#3a3640"));
    sB.add(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 12).translate(58.2, 1.0, -30.2), shiny("dsCooler", "#e8e2d6", 70)); sB.add(boxGeo(V(57.7, 0, -30.7), V(58.7, 0.72, -29.7)), wood);
    // hard hats on the crate (props)
    sB.add(new THREE.SphereGeometry(0.16, 12, 8, 0, TAU, 0, Math.PI / 2).translate(58.0, 0.73, -29.9), col("#f2c230")); }
  // ---------- the flatbed truck ----------
  const tr = flatbed(site);
  // ---------- town: lots, chalk, stakes, strings, signs, houses ----------
  const chalk = col("#fbfaf4");
  for (const l of LOTS) {
    const x0 = l.x - l.w / 2 + 0.6, x1 = l.x + l.w / 2 - 0.6, z0 = l.z - l.d / 2 + 0.6, z1 = l.z + l.d / 2 - 0.6;
    for (const [a, c] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]] as [number, number][][]) {
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]), g = new THREE.PlaneGeometry(L, 0.14).rotateX(-Math.PI / 2).rotateY(-Math.atan2(c[1] - a[1], c[0] - a[0])).translate((a[0] + c[0]) / 2, 0.03, (a[1] + c[1]) / 2); b.add(g, chalk);
    }
    const seed = Math.round(l.x * 13 + l.z * 7);
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) stake(b, x, 0, z, seed + x);
    if (hash(seed) < 0.45) { const sy = 0.5; b.add(new THREE.CylinderGeometry(0.008, 0.008, x1 - x0, 3).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, sy, l.face > 0 ? z1 : z0), col("#f4e8c8")); }
    for (let q = 0; q < 3; q++) { const hq = hash(seed, 2 + q * 3); if (hq < 0.55) { const px = l.x + (hash(seed, 3 + q * 3) - 0.5) * l.w * 0.7, pz = l.z + (hash(seed, 4 + q * 3) - 0.5) * l.d * 0.6; if (hq < 0.4) scrub(b, px, 0, pz, 0.5 + hq, seed + q); else if (hq < 0.47) rock(b, px, 0, pz, 0.35, seed + q); else barrelCactus(b, px, 0, pz, 0.22, seed + q); } }
  }
  // street furniture of the empty subdivision: name signs + fire hydrants at the corners (no houses yet, all utilities in)
  { const pole = col("#8a8a96"), hyd = shiny("dsHydrant", "#f2c230", 60), cap = col("#c8352e");
    const XST: [number, string][] = [[-22, "PALM AVE"], [BLVD_X, "MIRAGE BLVD"], [70, "SAHARA AVE"], [BRIDGE_RD_X, "BRIDGE RD"]];
    const ZST: [number, string][] = [[55, "CACTUS ST"], [76, "OASIS ST"], [MAIN_Z, "MAIN ST"], [124, "SUNSET ST"]];
    const blade = (txt: string) => mat("dsStreet" + txt, () => new THREE.MeshBasicMaterial({ map: faceTex("st" + txt, [txt], 512, 112, { bg: "#2a7a4a", fg: "#f4f0e6", border: "#f4f0e6" }), side: THREE.DoubleSide }));
    for (const [sx, xn] of XST) for (const [sz, zn] of ZST) {
      if (sx === BRIDGE_RD_X && sz > MAIN_Z) continue;
      const x = sx + 5.6, z = sz - 5.4; if (Math.abs(x - OFFICE[0]) < 8 && Math.abs(z - 106) < 8) continue;
      b.add(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 6).translate(x, 1.5, z), pole);
      const bz = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.33), blade(zn)); bz.position.set(x, 2.75, z); root.add(bz);
      const bx = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.33), blade(xn)); bx.position.set(x, 3.1, z); bx.rotation.y = Math.PI / 2; root.add(bx);
      const hx = sx - 5.4, hz = sz + 5.6;
      if (Math.abs(hx - 38.6) > 4 || Math.abs(hz - 103) > 4) { b.add(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 10).translate(hx, 0.35, hz), hyd); b.add(new THREE.SphereGeometry(0.17, 10, 6, 0, TAU, 0, Math.PI / 2).translate(hx, 0.7, hz), cap); b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6).rotateZ(Math.PI / 2).translate(hx, 0.45, hz), hyd); }
    } }
  // FOR SALE / SOLD signs (post signs; the SOLD lot's board hangs and can spin)
  const forSaleTex = () => faceTex("forsale", ["FOR SALE"], 768, 432, { bg: "#fbf7ec", fg: "#c8282e", border: "#c8282e", sub: "LAKE MIRAGE LOTS · $99 DOWN", subFg: "#1c3a6a" });
  const soldTex = () => faceTex("sold", ["SOLD!"], 768, 432, { bg: "#c8282e", fg: "#fbf7ec", border: "#fbf7ec", sub: "LAKE MIRAGE LOTS", subFg: "#fbf7ec" });
  const saleSigns: { fs: THREE.Mesh[]; sd: THREE.Mesh[]; th: number }[] = [];
  let soldBoard: THREE.Group | null = null;
  SIGN_LOTS.forEach((l, i) => {
    const sx = l.x + (hash(i, 5) - 0.5) * 3, sz = l.z + l.face * (l.d / 2 - 1.6), yaw = l.face > 0 ? 0 : Math.PI;
    const g = new THREE.Group(); g.position.set(sx, 0, sz); g.rotation.y = yaw + (hash(i, 6) - 0.5) * 0.3; root.add(g);
    const wood = tex("dsSignWood", () => beamHD());
    const sbb = new Batch();
    for (const px of [-0.85, 0.85]) sbb.add(new THREE.BoxGeometry(0.1, 2.3, 0.1).translate(px, 1.15, 0), wood);
    sbb.add(new THREE.BoxGeometry(2.0, 0.1, 0.1).translate(0, 2.25, 0), wood);
    sbb.build(g);
    const hang = new THREE.Group(); hang.position.set(0, 2.18, 0); g.add(hang);
    const fsM = unlitM("forsale", forSaleTex), sdM = unlitM("sold", soldTex);
    const f1 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.84).translate(0, -0.55, 0.03), fsM), f2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.84).rotateY(Math.PI).translate(0, -0.55, -0.03), i === 0 ? sdM : fsM);
    const s1 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.84).translate(0, -0.55, 0.031), sdM), s2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.84).rotateY(Math.PI).translate(0, -0.55, -0.031), sdM);
    const backing = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.92, 0.05).translate(0, -0.55, 0), col("#e8e2d6")); backing.castShadow = true;
    for (const m of [f1, f2, s1, s2, backing]) hang.add(m);
    for (const sx2 of [-0.6, 0.6]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 4, 8), col("#5a5664")); ring.position.set(sx2, -0.06, 0); hang.add(ring); }
    s1.visible = s2.visible = false;
    saleSigns.push({ fs: [f1, f2], sd: [s1, s2], th: i === 0 ? 2 : hash(i, 9) < 0.85 ? 0.15 + hash(i, 8) * 0.6 : 2 });
    if (i === 0) soldBoard = hang;
  });
  // the lonely ranch houses (+ one parked car) and the payoff houses
  HOUSE_LOTS.forEach((l, i) => ranchHouse(b, l.x, 0, l.z, l.face > 0 ? 0 : Math.PI, RANCH[i % RANCH.length], i, Math.min(13, l.w - 2), Math.min(7.5, l.d - 5)));
  const growHouses: { g: THREE.Group; th: number }[] = [];
  { const candidates = LOTS.filter((l) => !HOUSE_LOTS.includes(l) && l !== SOLD_LOT);
    candidates.forEach((l, i) => { if (hash(i, 21) > 0.9 || (l.z > 80 && l.z < 94 && l.x < 70)) return; const g = new THREE.Group(); root.add(g); const hb = new Batch(); ranchHouse(hb, l.x, 0, l.z, l.face > 0 ? 0 : Math.PI, RANCH[(i + 2) % RANCH.length], i + 7, Math.min(12.5, l.w - 2), Math.min(7.5, l.d - 5)); hb.build(g); g.visible = false; growHouses.push({ g, th: 0.05 + hash(i, 22) * 0.75 }); }); }
  // ---------- the sales office + its sidewalk props ----------
  const so = salesOffice(root); so.g.position.set(...OFFICE); so.g.rotation.y = OFFICE_YAW;
  if (addSolids) for (const [a, c] of so.SOLIDS) { const A = officeToSet(a), C = officeToSet(c); DESERT_SOLIDS.push(box3(A[0], A[1], A[2], C[0], C[1], C[2])); }
  { // bench (east of the door) + the sand-jar table (west)
    const wood = tex("dsBench", () => beamHD()), steel = col("#3a3640");
    void wood; void steel;
    b.add(boxGeo(V(34.3, 0.82, 102.75), V(35.3, 0.86, 103.45)), col("#e8e2d6")); for (const [x, z] of [[34.4, 102.8], [35.2, 102.8], [34.4, 103.4], [35.2, 103.4]]) b.add(rodGeo([x, 0.1, z], [x, 0.82, z], 0.02), steel);
    const jar = mat("dsJar", () => twoTone(new THREE.MeshPhongMaterial({ color: "#f2c4a0", specular: "#ffffff", shininess: 100, transparent: true, opacity: 0.92 })));
    for (const [x, z] of [[34.5, 103.0], [34.75, 103.2], [35.0, 102.95], [35.15, 103.25]]) { b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12).translate(x, 0.96, z), jar); b.add(new THREE.CylinderGeometry(0.072, 0.072, 0.04, 12).translate(x, 1.08, z), col("#c8352e")); }
    const js = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.36), unlitM("jarSign", () => faceTex("jar", ["GENUINE ARIZONA SAND"], 512, 184, { bg: "#fff6dc", fg: "#c8352e", sub: "25¢ A JAR", subFg: "#1c3a6a" })));
    js.position.set(34.8, 0.62, 102.72); js.rotation.y = Math.PI; root.add(js); }
  // ---------- landmarks: water tower, billboards, thermometer, gas station ----------
  { const W = WTOWER, steel = col("#d8d4dc"), H = 20;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.add(rodGeo([W[0] + sx * 4.2, 0, W[2] + sz * 4.2], [W[0] + sx * 2.4, H, W[2] + sz * 2.4], 0.18, 8), steel);
    for (let k = 0; k < 3; k++) { const y0 = k * 6.5, y1 = y0 + 6.5, w0 = 4.2 - (y0 / H) * 1.8, w1 = 4.2 - (y1 / H) * 1.8; for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { b.add(rodGeo([W[0] + ax * w0, y0, W[2] + az * w0], [W[0] + bx * w1, y1, W[2] + bz * w1], 0.06, 5), steel); b.add(rodGeo([W[0] + bx * w0, y0, W[2] + bz * w0], [W[0] + ax * w1, y1, W[2] + az * w1], 0.06, 5), steel); } }
    b.add(new THREE.CylinderGeometry(0.5, 0.5, H, 10).translate(W[0], H / 2, W[2]), steel);
    b.add(new THREE.CylinderGeometry(5.2, 5.2, 6.5, 32, 1, true).translate(W[0], H + 3.25, W[2]), mat("dsTankM", () => twoTone(new THREE.MeshLambertMaterial({ map: towerTankTex() }))));
    b.add(new THREE.SphereGeometry(5.2, 32, 8, 0, TAU, Math.PI / 2, Math.PI / 2).scale(1, 0.4, 1).translate(W[0], H, W[2]), steel);
    b.add(new THREE.ConeGeometry(5.5, 2.6, 32).translate(W[0], H + 7.8, W[2]), col("#e2453c"));
    b.add(new THREE.SphereGeometry(0.4, 10, 8).translate(W[0], H + 9.2, W[2]), col("#e2453c"));
    b.add(new THREE.TorusGeometry(5.7, 0.06, 4, 40).rotateX(Math.PI / 2).translate(W[0], H + 1.0, W[2]), steel);
    b.add(new THREE.CylinderGeometry(5.7, 5.7, 0.08, 40).translate(W[0], H - 0.05, W[2]), steel);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; b.add(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 4).translate(W[0] + Math.cos(a) * 5.7, H + 0.5, W[2] + Math.sin(a) * 5.7), steel); }
    for (const x of [-0.25, 0.25]) b.add(new THREE.BoxGeometry(0.05, H, 0.05).translate(W[0] + 2.5 + x, H / 2, W[2] - 4.4 + 0), steel); }
  board(b, root, BILL_LOTS, Math.PI, 15, 5.6, 3.4, billLotsTex(), { posts: 4, postCol: "#7a6a6e", lamps: true, catwalk: true });
  board(b, root, BILL_HWY, -1.92, 13, 5.4, 3.0, billHwyTex(), { posts: 3, postCol: "#6a5a5e", lamps: true, catwalk: true });
  board(b, root, THERMO, Math.PI, 1.5, 4.0, 2.9, thermoTex(), { posts: 1, postCol: "#3a3640" });
  { const G = GAS, white = col("#f4f0e6"), red = shiny("dsGasRed", "#d8302a", 50);
    b.add(boxGeo(V(G[0] - 5, 0, G[2] + 1), V(G[0] + 3, 3.4, G[2] + 6.5), 2), tex("stucco#f4f0e6", () => stuccoTex("#f4f0e6")));
    b.add(boxGeo(V(G[0] - 5.1, 2.6, G[2] + 0.9), V(G[0] + 3.1, 3.0, G[2] + 6.6)), red);
    b.add(new THREE.PlaneGeometry(4.5, 2.0).rotateY(Math.PI).translate(G[0] - 0.5, 1.3, G[2] + 0.99), tex("shopWin", () => ctex("dsShopWin2", 256, 128, (g) => { g.fillStyle = "#f4efe4"; g.fillRect(0, 0, 256, 128); const gg = g.createLinearGradient(0, 0, 0, 128); gg.addColorStop(0, "#9cc4ea"); gg.addColorStop(1, "#3a5a8e"); g.fillStyle = gg; g.fillRect(6, 6, 244, 116); g.fillStyle = "#f4efe4"; g.fillRect(124, 6, 8, 116); })));
    b.add(boxGeo(V(G[0] - 7, 4.4, G[2] - 6.5), V(G[0] + 5, 4.75, G[2] + 0.5)), white); b.add(boxGeo(V(G[0] - 7.05, 4.2, G[2] - 6.55), V(G[0] + 5.05, 4.45, G[2] + 0.55)), red);
    for (const x of [G[0] - 6, G[0] + 4]) b.add(new THREE.CylinderGeometry(0.14, 0.14, 4.4, 8).translate(x, 2.2, G[2] - 3.2), white);
    b.add(boxGeo(V(G[0] - 4.5, 0, G[2] - 4.0), V(G[0] + 2.5, 0.18, G[2] - 2.4)), col("#d8ccc4"));
    for (const x of [G[0] - 3, G[0] + 0.8]) { b.add(new RoundedBoxGeometry(0.75, 1.55, 0.55, 2, 0.1).translate(x, 0.95, G[2] - 3.2), red); b.add(new THREE.SphereGeometry(0.26, 14, 10).translate(x, 1.95, G[2] - 3.2), mat("dsGlobe", () => new THREE.MeshBasicMaterial({ color: "#fff4e0" }))); b.add(new THREE.PlaneGeometry(0.5, 0.4).rotateY(Math.PI).translate(x, 1.25, G[2] - 3.48), mat("dsPumpFace", () => new THREE.MeshBasicMaterial({ map: faceTex("pump", ["31.9¢"], 256, 200, { bg: "#f4f0e6", fg: "#1c3a6a" }) }))); }
    // tall star sign + price board
    b.add(new THREE.CylinderGeometry(0.2, 0.25, 9.5, 10).translate(G[0] - 10, 4.75, G[2] - 6), col("#d8d4dc"));
    const star = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU - Math.PI / 2, rr2 = k % 2 ? 0.9 : 2.0; if (k) star.lineTo(Math.cos(a) * rr2, -Math.sin(a) * rr2); else star.moveTo(Math.cos(a) * rr2, -Math.sin(a) * rr2); }
    const sg = new THREE.ExtrudeGeometry(star, { depth: 0.3, bevelEnabled: false }); sg.translate(0, 0, -0.15); sg.rotateY(Math.PI); sg.translate(G[0] - 10, 10.6, G[2] - 6); b.add(sg, shiny("dsStar", "#f2c230", 60));
    const gs = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.2), unlitM("gasSign", () => faceTex("gas", ["DESERT STAR"], 768, 220, { bg: "#1c3a6a", fg: "#f2c230", font: SCRIPT, border: "#f4efe4" }))); gs.position.set(G[0] - 10, 7.8, G[2] - 6.25); gs.rotation.y = Math.PI; root.add(gs);
    const gb = new THREE.Group(); root.add(gb); bunts.push(bunting(gb, [G[0] - 7, 4.6, G[2] - 6.5], [G[0] - 10, 6.8, G[2] - 6], 0.4, ["#d8302a", "#f4f0e6", "#2f7fd1", "#f2c230"], 0.35), bunting(gb, [G[0] + 5, 4.6, G[2] - 6.5], [G[0] + 9, 1.2, G[2] - 8], 0.3, ["#d8302a", "#f4f0e6", "#2f7fd1", "#f2c230"], 0.35));
    // tyre stack, oil cans, ice chest
    for (let k = 0; k < 4; k++) b.add(new THREE.TorusGeometry(0.34, 0.13, 8, 16).rotateX(Math.PI / 2).translate(G[0] + 3.6, 0.13 + k * 0.25, G[2] + 0.2), col("#2e2a36"));
    b.add(new RoundedBoxGeometry(1.2, 0.8, 0.6, 2, 0.06).translate(G[0] - 6, 0.4, G[2] + 0.4), shiny("dsIce", "#4a9ad8", 60));
    b.add(new THREE.PlaneGeometry(1.0, 0.3).rotateY(Math.PI).translate(G[0] - 6, 0.55, G[2] + 0.09), mat("dsIceT", () => new THREE.MeshBasicMaterial({ map: faceTex("ice", ["ICE"], 256, 80, { bg: "#4a9ad8", fg: "#f4f0e6" }) }))); }
  // ---------- highway: dinosaur, kiosk, road signs, poles ----------
  { const D = DINO, dm = mat("dsDinoM", () => twoTone(new THREE.MeshPhongMaterial({ map: dinoTex(), specular: "#e8ffe0", shininess: 25 })));
    const belly = col("#d8e08a"), conc = tex("dsPlinth", () => stuccoTex("#cfc4ba"));
    b.add(boxGeo(V(D[0] - 11, 0, D[2] - 3.5), V(D[0] + 11, 0.7, D[2] + 3.5)), conc);
    b.add(new THREE.SphereGeometry(1, 28, 18).scale(6.2, 3.6, 3.0).translate(D[0], 5.6, D[2]), dm);
    b.add(new THREE.SphereGeometry(1, 20, 10, 0, TAU, Math.PI * 0.55, Math.PI * 0.45).scale(5.6, 3.2, 2.7).translate(D[0], 5.4, D[2]), belly);
    for (const [x, z] of [[-3.4, -1.6], [-3.4, 1.6], [3.2, -1.7], [3.2, 1.7]]) { b.add(new THREE.CylinderGeometry(0.95, 1.1, 4.4, 14).translate(D[0] + x, 2.9, D[2] + z), dm); for (let t = -1; t <= 1; t++) b.add(new THREE.SphereGeometry(0.28, 8, 6).scale(1, 0.6, 1).translate(D[0] + x + t * 0.5, 0.82, D[2] + z - 0.85), col("#f4f0e6")); }
    // neck + head (toward -x and up, the head turned to the highway)
    const neck = new THREE.CatmullRomCurve3([V(D[0] - 5, 6.6, D[2]), V(D[0] - 8.2, 9.2, D[2] - 0.4), V(D[0] - 9.6, 12.4, D[2] - 1.0), V(D[0] - 9.9, 14.6, D[2] - 1.6)]);
    const ng = new THREE.TubeGeometry(neck, 24, 1, 14, false); { const p = ng.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const seg = Math.floor(i / 15) / 24, c = neck.getPointAt(Math.min(1, seg)), v = V(p.getX(i), p.getY(i), p.getZ(i)).sub(c), rr2 = lerp(2.0, 0.85, seg); p.setXYZ(i, c.x + v.x * rr2, c.y + v.y * rr2, c.z + v.z * rr2); } ng.computeVertexNormals(); }
    b.add(ng, dm);
    const H = V(D[0] - 10.2, 15.1, D[2] - 2.2);
    b.add(new THREE.SphereGeometry(1, 20, 14).scale(1.7, 1.15, 1.35).rotateY(0.9).translate(H.x, H.y, H.z), dm);
    b.add(new THREE.SphereGeometry(1, 16, 10).scale(1.1, 0.75, 1.0).rotateY(0.9).translate(H.x - 0.7, H.y - 0.35, H.z - 0.9), dm);
    for (const s of [-1, 1]) { const e = V(H.x + s * 0.55 - 0.2, H.y + 0.45, H.z - 0.95 + s * 0.35); b.add(new THREE.SphereGeometry(0.34, 12, 10).translate(e.x, e.y, e.z), col("#fbfaf4")); b.add(new THREE.SphereGeometry(0.17, 10, 8).translate(e.x - 0.08, e.y + 0.02, e.z - 0.24), col("#2a2236")); }
    b.add(new THREE.TorusGeometry(0.62, 0.07, 6, 16, Math.PI * 0.8).rotateY(0.9).rotateX(0.2).translate(H.x - 1.0, H.y - 0.55, H.z - 1.15), col("#2a2236"));
    // tail sweeping back to the ground + back spikes (friendly rounded plates)
    const tail = new THREE.CatmullRomCurve3([V(D[0] + 5.6, 5.4, D[2]), V(D[0] + 9, 3.6, D[2] + 0.6), V(D[0] + 11.5, 1.6, D[2] + 2.2), V(D[0] + 12.4, 0.9, D[2] + 4.2)]);
    const tg = new THREE.TubeGeometry(tail, 20, 1, 12, false); { const p = tg.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const seg = Math.floor(i / 13) / 20, c = tail.getPointAt(Math.min(1, seg)), v = V(p.getX(i), p.getY(i), p.getZ(i)).sub(c), rr2 = lerp(1.9, 0.3, seg); p.setXYZ(i, c.x + v.x * rr2, c.y + v.y * rr2, c.z + v.z * rr2); } tg.computeVertexNormals(); }
    b.add(tg, dm);
    for (let k = 0; k < 7; k++) { const x = D[0] - 4 + k * 1.4, y = 5.6 + 3.6 * Math.sqrt(Math.max(0, 1 - ((x - D[0]) / 6.2) ** 2)); b.add(new THREE.ConeGeometry(0.42, 0.9, 8).translate(x, y + 0.2, D[2]), col("#f2a23a")); }
    // kiosk "DINO STOP"
    const K = KIOSK; b.add(boxGeo(V(K[0] - 2.2, 0, K[2] - 1.6), V(K[0] + 2.2, 2.6, K[2] + 1.6), 2), tex("dsKiosk", () => stuccoTex("#f6e2b8")));
    const aw = new THREE.BoxGeometry(4.8, 0.06, 1.6); aw.rotateX(0.32); aw.translate(K[0], 2.35, K[2] - 2.2); b.add(aw, tex("awn#3aa36a#f4efe4", () => ctex("dsAwn#3aa36a#f4efe4", 512, 128, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4efe4" : "#3aa36a"; g.fillRect(i * 64, 0, 64, 128); } })));
    b.add(boxGeo(V(K[0] - 2.4, 2.6, K[2] - 1.8), V(K[0] + 2.4, 3.5, K[2] + 1.8)), col("#3aa36a"));
    const ks = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.8), unlitM("dinoStop", () => faceTex("dinostop", ["DINO STOP"], 768, 140, { bg: "#f2c230", fg: "#2a6a3a" }))); ks.position.set(K[0], 3.05, K[2] - 1.82); ks.rotation.y = Math.PI; root.add(ks);
    b.add(new THREE.PlaneGeometry(3.4, 1.0).rotateY(Math.PI).translate(K[0], 1.5, K[2] - 1.61), unlitM("kioskWin", () => faceTex("kioskwin", ["COLD POP · POSTCARDS"], 768, 220, { bg: "#fff6dc", fg: "#c8352e", sub: "ROCKS & FOSSILS", subFg: "#2a6a3a" })));
    b.add(new RoundedBoxGeometry(0.9, 1.4, 0.7, 2, 0.08).translate(K[0] + 2.8, 0.7, K[2] - 1.0), shiny("dsPopBox", "#d8302a", 60));
    for (const x of [-82, -60]) { b.add(boxGeo(V(x - 1, 0.42, 177.8), V(x + 1, 0.5, 178.3)), tex("dsBench", () => beamHD())); for (const xx of [x - 0.8, x + 0.8]) b.add(boxGeo(V(xx - 0.05, 0, 177.8), V(xx + 0.05, 0.42, 178.3)), col("#3a3640")); }
    b.add(new THREE.CylinderGeometry(0.3, 0.26, 0.9, 12).translate(-76, 0.45, 178.5), col("#3f7a4a"));
    const ds = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.3), unlitM("dinoArrow", () => faceTex("dinoarrow", ["DINO STOP →"], 768, 280, { bg: "#2a6a3a", fg: "#f2c230", sub: "FREE PARKING · PHOTOS", subFg: "#f4efe4" })));
    board(b, root, [-150, 0, 168], -1.75, 3.6, 1.3, 2.2, (ds.material as THREE.MeshBasicMaterial).map!, { posts: 2 }); ds.geometry.dispose();
    // road signs along the highway
    board(b, root, [-38, 0, 167.5], -1.5, 2.6, 1.6, 2.1, faceTex("exit", ["LAKE MIRAGE"], 512, 320, { bg: "#2a7a4a", fg: "#f4f0e6", border: "#f4f0e6", sub: "NEXT LEFT  ←" }), { posts: 2, postCol: "#8a8a96" });
    board(b, root, [-240, 0, 167], -1.5, 1.3, 1.7, 1.6, faceTex("speed", ["SPEED", "LIMIT", "65"], 256, 336, { bg: "#f4f0e6", fg: "#2a2632", border: "#2a2632" }), { posts: 1, postCol: "#8a8a96" });
    board(b, root, [60, 0, 153], Math.PI / 2, 1.2, 1.2, 1.8, ctex("dsShield", 256, 256, (g) => { g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#2a2632"; g.beginPath(); g.moveTo(30, 30); g.lineTo(226, 30); g.lineTo(226, 140); g.quadraticCurveTo(226, 220, 128, 240); g.quadraticCurveTo(30, 220, 30, 140); g.closePath(); g.fill(); g.fillStyle = "#f4f0e6"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "77", 128, 130, 150, 120, SANS); }), { posts: 1, postCol: "#8a8a96" });
    // power line along the highway (north side) + Bridge Road + Mirage Blvd
    const line = (pts: V3[], yaw: number) => { let prev: [V3, V3] | null = null; for (const p of pts) { const cur = powerPole(b, p[0], baseY(p[0], p[2]), p[2], yaw); if (prev) { wire(b, prev[0], cur[0]); wire(b, prev[1], cur[1]); } prev = cur; } };
    line(Array.from({ length: 22 }, (_, i) => [-395 + i * 40, 0, 169] as V3).filter((p) => p[0] < -100 || p[0] > -40), 0);
    line(Array.from({ length: 6 }, (_, i) => [125, 0, 94 - i * 15] as V3), Math.PI / 2);
    line(Array.from({ length: 4 }, (_, i) => [3.5, 0, 150 - i * 15] as V3), Math.PI / 2); }
  // ---------- parked 1960s cars ----------
  for (const [x, z, yaw, c] of [[HOUSE_LOTS[1].x + 8.6, HOUSE_LOTS[1].z + 1, 0, "#e86a5a"], [GAS[0] - 1.1, GAS[2] - 3.2, Math.PI / 2, "#3f6ad8"], [60, 95.7, -Math.PI / 2, "#f2e2b4"], [-78, 172.6, 0, "#8ad0a0"]] as [number, number, number, string][]) {
    const w = wagon(root, { colour: c, woody: false, rack: false, roof: "#f4efe4" }); w.g.position.set(x, 0, z); w.g.rotation.y = yaw; w.set({}); }
  // ---------- the family wagon ----------
  const fam = wagon(root, { colour: "#5fb0b4", woody: true, rack: true, roof: "#f4efe4" });
  const bossCar = wagon(root, { colour: "#d8302a", woody: false, rack: false, roof: "#f4efe4", convertible: true });
  // ---------- the town sign + ladder (payoff) ----------
  const T = TOWN_SIGN, tsYaw = -2.1; // faces the road from the bridge (seen in the scene-1 flight and the payoff)
  const signG = new THREE.Group(); signG.position.set(...T); signG.rotation.y = tsYaw; root.add(signG);
  const popPrimer = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat("dsPrimer", () => new THREE.MeshBasicMaterial({ color: "#f4efe4" })));
  const popNew = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), unlitM("newPop", newPopTex));
  { const sb = new Batch(), wood = tex("dsSignWood", () => beamHD());
    for (const x of [-2.6, 2.6]) sb.add(new THREE.BoxGeometry(0.3, 5.0, 0.3).translate(x, 2.5, -0.2), wood);
    sb.add(boxGeo(V(-3.25, 1.35, -0.12), V(3.25, 5.45, -0.03)), col("#14524a"));
    for (let k = 0; k < 6; k++) sb.add(new THREE.SphereGeometry(0.12, 8, 6).translate(-2.7 + k * 1.08, 1.25, 0.05), col("#f4efe4"));
    sb.build(signG);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.0), unlitM("townSign", townSignTex)); face.position.set(0, 3.4, 0); signG.add(face);
    // the number panel region: u 0.33..0.83 of the width, v 0.15..0.38 (the "300")
    popPrimer.position.set(0, 0, 0.01); popNew.position.set(0, 0, 0.02); signG.add(popPrimer, popNew);
    // ladder leaning on the sign (right of the number)
    const lad = new Batch(), lw = col("#c8a070");
    for (const x of [1.5, 2.05]) lad.add(beamGeo(V(x, 0, 1.25), V(x, 4.3, 0.12), 0.07, 0.09), lw);
    for (let k = 1; k < 13; k++) { const u = k / 13; lad.add(new THREE.BoxGeometry(0.55, 0.05, 0.05).translate(1.775, u * 4.3, lerp(1.25, 0.12, u)), lw); }
    lad.add(new THREE.CylinderGeometry(0.16, 0.13, 0.25, 10).translate(2.3, 0.13, 1.4), shiny("dsPaintCan", "#c8352e", 60));
    lad.add(new THREE.CylinderGeometry(0.16, 0.13, 0.25, 10).translate(-2.0, 0.13, 1.0), shiny("dsPaintCan2", "#f4efe4", 60));
    lad.build(signG); }
  const popRect = (m: THREE.Mesh, u: number, u0: number, u1: number, v0: number, v1: number) => {
    const W = 6.4, H = 4.0, x0 = -W / 2 + u0 * W, x1 = -W / 2 + (u0 + (u1 - u0) * u) * W, y0 = 3.4 - H / 2 + v0 * H, y1 = 3.4 - H / 2 + v1 * H;
    const p = m.geometry.attributes.position as THREE.BufferAttribute, t = m.geometry.attributes.uv as THREE.BufferAttribute;
    p.setXYZ(0, x0, y1, 0); p.setXYZ(1, x1, y1, 0); p.setXYZ(2, x0, y0, 0); p.setXYZ(3, x1, y0, 0); p.needsUpdate = true;
    t.setXY(0, 0, 1); t.setXY(1, u, 1); t.setXY(2, 0, 0); t.setXY(3, u, 0); t.needsUpdate = true;
    m.visible = u > 0.002;
  };
  // ---------- payoff growth: shops, palms, bunting, crowds, boats ----------
  const grow = new THREE.Group(); root.add(grow);
  const growB = new Batch();
  const shopDefs: [number, string, string, [string, string]][] = [[-12, "MIRAGE DINER", "#f6e2b8", ["#c8352e", "#f4efe4"]], [-2, "RANCH MARKET", "#bfe4dc", ["#2f7fd1", "#f4efe4"]], [20, "BAIT & TACKLE", "#f6c6a6", ["#3aa36a", "#f4efe4"]], [30, "SUN MOTEL", "#f2df8a", ["#e2623a", "#f4efe4"]],
    [41, "BOATS FOR RENT", "#9fd6cc", ["#1c3a6a", "#f4efe4"]], [52, "HARDWARE", "#e8ecf2", ["#c8352e", "#f2c230"]], [62, "ICE CREAM", "#f8d0dc", ["#d8508a", "#f4efe4"]]];
  for (const [x, name, wc, aw] of shopDefs) shop(growB, grow, x, 0, MAIN_Z - 11.5, 0, name, wc, aw, 9, 7);
  growB.build(grow);
  const palms: Palm[] = [];
  for (let x = -20; x <= 66; x += 10.5) { palms.push(palm(grow, [x, 0, MAIN_Z - 5.7], 7 + hash(x) * 2, [0.5, 0.2], Math.round(x + 30), "#4f9a3a")); }
  for (const z of [-14, -24, -34, -44]) for (const x of [-30, 30]) palms.push(palm(grow, [x, 0, z], 8 + hash(z + x) * 2, [x > 0 ? -0.6 : 0.6, 0], Math.round(z * 3 + x), "#4f9a3a"));
  for (const z of [16, 26]) palms.push(palm(grow, [BRIDGE_RD_X + 6, 0, z + 8], 8, [0.4, 0], z, "#4f9a3a"));
  for (let k = 0; k < 4; k++) bunts.push(bunting(grow, [-10 + k * 34, 6.2, MAIN_Z - 5.4], [6 + k * 34, 6.2, MAIN_Z + 5.4], 0.8, ["#c8352e", "#f4efe4", "#2f7fd1", "#f2c230", "#3aa36a"], 0.45));
  for (const sx of [-1, 1]) for (const zz of [-8, 8]) { const x0 = sx * 50, x1 = sx * 70, y0 = rampTop(50) + 0.1, y1 = rampTop(70) + 0.1; growB.add(rodGeo([x0, y0, zz], [x0, y0 + 4.2, zz], 0.06), col("#e8e2d6")); growB.add(rodGeo([x1, y1, zz], [x1, y1 + 4.2, zz], 0.06), col("#e8e2d6")); bunts.push(bunting(grow, [x0, y0 + 4.1, zz], [x1, y1 + 4.1, zz], 0.6, ["#c8352e", "#f4efe4", "#2f7fd1", "#f2c230"], 0.4)); }
  growB.build(grow);
  // static crowd cards: both approach ramps (along the kerbs) + the lake-side canal banks
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const ax = 50 + k * 4.8, y = rampTop(ax + 2.4); for (const zz of [-6.6, 6.6]) crowdCard(grow, [sx * (ax + 2.4), y, zz], zz > 0 ? Math.PI : 0, 4.6, 1.8, k * 2 + (sx > 0 ? 1 : 0) + (zz > 0 ? 10 : 0)); }
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) crowdCard(grow, [sx * 31, 0, -12 - k * 5.4], sx > 0 ? -Math.PI / 2 : Math.PI / 2, 5.2, 1.8, 20 + k + (sx > 0 ? 6 : 0));
  for (let k = 0; k < 3; k++) crowdCard(grow, [99 + k * 5, 0, 27.5], Math.PI, 4.8, 1.8, 40 + k);
  const boats: Boat[] = BOATS.map((B, i) => motorboat(root, B.hull, B.stripe, i));
  // ---------- ambient: tumbleweed, hawk, dust devils, shimmer ----------
  const tw = tumbleweed(root, 0.48, 5);
  const hk = hawk(root);
  const devils = [dustDevil(root, [-260, 0, 240], 30), dustDevil(root, [330, 0, 330], 38), dustDevil(root, [210, 0, -10], 26)];
  const shimM = mat("dsShimM", () => new THREE.MeshBasicMaterial({ map: shimmerTex(), transparent: true, opacity: 0.12, depthWrite: false, color: new THREE.Color(1.1, 1.05, 1.0) }));
  const shimmer = ([[-2, -20, 9], [-1, -2, 12], [4, 22, 16], [0, 40, 22], [-200, HWY_Z, 20], [-120, HWY_Z, 20], [0, HWY_Z + 0.5, 20], [60, MAIN_Z, 14], [110, 60, 18]] as [number, number, number][]).map(([x, z, w], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.0, 12, 2), shimM); m.position.set(x, 0.55, z); m.layers.set(NOINK); m.renderOrder = 3; m.userData = { base: (m.geometry.attributes.position.array as Float32Array).slice(), ph: i * 1.7 }; root.add(m); return m; });
  // ---------- build the static batches ----------
  b.build(root); sB.build(site);
  // ---------- marks ----------
  const om = so.MARKS, OM: Record<string, V3> = {};
  for (const k of Object.keys(om)) OM["office_" + k] = officeToSet(om[k]);
  const sl = SOLD_LOT, soldSignAt: V3 = [sl.x + (hash(0, 5) - 0.5) * 3, 0, sl.z + sl.face * (sl.d / 2 - 1.6)];
  const kerb = desertWagon(1, 0).pos;
  const marks: Record<string, V3> = {
    bossArch: [-8.2, 0, -11.5], wetSpot: [-7.0, 0, -12.6], dozerStart: [0, 0, DZ_Z0], trenchSpot: [2.5, -2.5, -12],
    chartSpot: [CHART[0] - 0.2, 0, CHART[2] - 2.0], stoneDrop: STONE_DROP, lizardStart: [30, DECK, 1.5], lizardEnd: [51.5, DECK - 0.02, 1.5],
    deckParapet: [3, DECK, -6.0], deckParapetB: [5.2, DECK, -5.9], revealTop: [10, 70, -30], craneOperator: [CRANE_AT[0] + 0.6, 3.9, CRANE_AT[2] + 1.2],
    salesWalkA: officeToSet([-3.0, 0, 5.4]), salesWalkB: officeToSet([3.4, 0, 5.4]), bench: officeToSet([-3.7, 0.45, 4.62]),
    officeDoor: officeToSet([0.9, 0, 5.2]), officeKerb: [kerb[0], 0, kerb[2]], kerbFamilyA: [37.2, 0.1, 102.9], kerbFamilyB: [36.2, 0.1, 103.2], kerbFamilyC: [35.3, 0.1, 102.9], kerbFamilyD: [40.4, 0.1, 102.9],
    lot: soldSignAt, lotHandshake: [soldSignAt[0] + 1.9, 0, soldSignAt[2] - sl.face * 0.9], lotHandshakeB: [soldSignAt[0] + 2.9, 0, soldSignAt[2] - sl.face * 0.9],
    dino: [-70, 0, 174.5], touristA: [-74.2, 0, 173.2], touristB: [-72.4, 0, 172.6], kidA: [-69.4, 0, 173.6], kidB: [-67.9, 0, 173.0],
    painterSign: [T[0] + 1.62, 2.38, T[2] + 0.1], painterGround: [T[0] - 0.2, 0, T[2] + 2.2], townSign: T,
    bridgePark: [104, 0, 20.5], bridgeParkFamily: [104, 0, 17.4], dinoBillboard: BILL_HWY, gasStation: [GAS[0] - 1, 0, GAS[2] - 1],
    boatA: [BOATS[0].x, WL, BOATS[0].z0], boatB: [BOATS[1].x, WL, BOATS[1].z0], boatC: [BOATS[2].x, WL, BOATS[2].z0],
    bankCrowdL: [-31, 0, -20], bankCrowdR: [31, 0, -20], approachEast: [56, DECK, 2], approachWest: [-56, DECK, 2],
    ...OM,
  };
  // painterSign: in sign space (ladder at local x 1.5..2.05, rung at y 2.3) -> set space
  { const c = Math.cos(tsYaw), s = Math.sin(tsYaw), lx = 1.78, lz = 0.62; marks.painterSign = [T[0] + lx * c + lz * s, 2.32, T[2] - lx * s + lz * c]; const gx = -0.6, gz = 2.0; marks.painterGround = [T[0] + gx * c + gz * s, 0, T[2] - gx * s + gz * c]; }
  // ---------- cams ----------
  const cams: SetDef["cams"] = {
    frame1: { pos: [-10.2, 0.4, -16.8], look: [-0.5, 3.3, 2], fov: 40 },
    trench: { pos: [0.5, 1.2, -16], look: [0.2, 0.4, 6], fov: 40 },
    archDrop: { pos: [-1.5, 5.5, -10.5], look: [0, 0.4, 4], fov: 40 },
    chart: { pos: [27.2, 1.6, -16.8], look: [31.0, 1.6, -11.6], fov: 36 },
    stoneDrop: { pos: [-6, 14.5, -14], look: [4, 11.5, -3], fov: 38 },
    lizard: { pos: [44, 10.75, 4.2], look: [51.5, 10.4, 1.5], fov: 36 },
    reveal: { pos: [10, 70, -30], look: [40, 0, 80], fov: 42 },
    townAerial: { pos: [12, 34, 40], look: [40, 2, 104], fov: 40 },
    officeFront: { pos: [38.8, 1.8, 89.5], look: [38.8, 1.5, 103.4], fov: 42 },
    salesWalk: { pos: [44.2, 1.5, 98.2], look: [41.6, 1.25, 103.2], fov: 40 },
    salesJar: { pos: [33.2, 1.5, 98.4], look: [36.0, 1.2, 103.1], fov: 38 },
    highwayDino: { pos: [-48, 2.2, 158], look: [-68, 6, 178], fov: 42 },
    highwayBill: { pos: [-46, 2.0, 157.5], look: [-15, 4.5, 170], fov: 38 },
    mainRide: desertWagonCam(0.9, 0, "left"),
    payoffWide: { pos: [5, 8.5, -60], look: [0, 4.5, 0], fov: 42 },
    parapet: { pos: [6.2, 11.9, -2.0], look: [3, 11.4, -6.4], fov: 36 },
    townSign: { pos: [24, 3.0, -48], look: [38, 3.2, -30], fov: 38 },
  };
  const sun = undefined;
  // ---------- pose ----------
  return {
    name: "desert", root, marks, cams, sun,
    pose: (t, c) => {
      const dig = cl(c.dig ?? 0), wv = cl(c.water ?? 0), gr = cl(c.grow ?? 0), siteOn = (c.site ?? 1) > 0.5;
      br.set({ built: c.built ?? 1, numbered: c.numbered ?? 0, lamps: c.lamps ?? 0, t });
      so.set({ door: c.door ?? 1, fan: c.fan ?? 0.6, sweat: c.sweat ?? 0, t });
      recut(dig, wv, gr); setWater(dig, wv);
      // flood front foam + splashes + mouth
      const fr = wv > 0.002 && wv < 0.72, sf = S_PLUG + (S_END - S_PLUG) * cl(wv / 0.7), fi = Math.min(CN.n, Math.round(sf / CN.ds));
      frontFoam.visible = fr; mouthFoam.visible = wv > 0.002 && wv < 0.95;
      const bedHalf = lerp(4.5, hwFull(sf) - 3.5, sm((dig - 0.5) / 0.5)) + 1.2;
      if (fr) { frontFoam.position.set(CN.X[fi], -2.05 + 0.08, CN.Z[fi]); frontFoam.rotation.y = Math.atan2(CN.TX[fi], CN.TZ[fi]) + Math.PI / 2; frontFoam.scale.set(bedHalf * 2, 1, 1); }
      const mi = Math.round(S_MOUTH / CN.ds) + 2; mouthFoam.position.set(CN.X[mi], WL + 0.04 - 0.6 * sm((wv - 0.1) / 0.6) * 0, CN.Z[mi]); mouthFoam.scale.set(bedHalf * 2, 1, 1);
      splashes.forEach((m, i) => {
        const u = (t * 0.9 + i / splashes.length) % 1, side = ((i * 7) % 5) / 4 - 0.5, at = i % 3 === 0 ? mi : fi;
        const k = (at === mi ? (wv > 0.002 && wv < 0.9 ? 1 : 0) : fr ? 1 : 0);
        m.visible = k > 0; if (!k) return;
        m.position.set(CN.X[at] + side * bedHalf * 1.6, (at === mi ? WL : -2.0) + 0.3 + u * 2.2, CN.Z[at] + (at === mi ? 1.5 : -1.2) + u * 0.8);
        (m.material as THREE.SpriteMaterial).opacity = 0.45 * Math.sin(Math.PI * u); const s = 1.0 + u * 2.0; m.scale.set(s, s * 0.8, 1);
      });
      // site visibility
      site.visible = siteOn; siteDecals.forEach((m) => { m.visible = siteOn; });
      const dzOn = siteOn || (c.dozerShow ?? 0) > 0.5; dzG.visible = dzOn;
      // dozer
      const du = cl(c.dozer ?? 0.45), dzp = desertDozer(du, dig), blade = cl(c.dozerBlade ?? 0), biting = dzOn && dig > 0.02 && dig < 0.98 && blade < 0.5;
      dz.g.position.set(...dzp.pos); dz.g.rotation.y = dzp.yaw; dz.set({ dist: dzp.dist, t, blade, rumble: c.dozer !== undefined ? 1 : 0.35 });
      pile.visible = biting; pile.scale.set(1, 0.5 + 0.6 * Math.min(1, dig / 0.2), 1);
      dzDust.forEach((m, i) => { const u = (t * 0.35 + i / dzDust.length) % 1, side = (i % 3) - 1; m.visible = biting; if (!biting) return;
        m.position.set(dzp.pos[0] + side * 1.9 + Math.sin(i * 2 + t) * 0.4, dzp.pos[1] + 0.3 + u * 2.4, dzp.pos[2] - 4.2 - u * 1.5 + (i % 2) * 5); (m.material as THREE.SpriteMaterial).opacity = 0.45 * Math.sin(Math.PI * u); const s = 1.6 + u * 3.2; m.scale.set(s, s * 0.7, 1); });
      dzSmoke.forEach((m, i) => { const u = (t * 0.5 + i / dzSmoke.length) % 1; m.visible = dzOn; m.position.set(dzp.pos[0] + 0.45 + u * 0.8, dzp.pos[1] + 3.45 + u * 2.6, dzp.pos[2] - 1.45 + u * 0.6); (m.material as THREE.SpriteMaterial).opacity = 0.4 * Math.sin(Math.PI * u); const s = 0.5 + u * 1.6; m.scale.set(s, s * 0.8, 1); });
      // dozer track decals behind it (from dozerStart to the dozer)
      dzTracks.visible = dzOn && du > 0.01;
      if (dzTracks.visible) { const z0 = DZ_Z0 + 2, z1 = dzp.pos[2] + 2.2; for (let s = 0; s < 2; s++) for (let i = 0; i < DZT; i++) { const z = lerp(z1, z0, i / (DZT - 1)); for (let e = 0; e < 2; e++) { const x = (s ? 1.18 : -1.18) + (e ? 0.32 : -0.32), o = ((s * DZT + i) * 2 + e) * 3; dzTrackPos[o] = x; dzTrackPos[o + 1] = desertGround(x, z, dig) + 0.04; dzTrackPos[o + 2] = z; } } dzTGeo.attributes.position.needsUpdate = true; }
      // crane: slew/luff between the pallets and the drop, lower the block
      { const cy = cr.g.rotation.y;
        const aim = (p: V3) => { const dx = p[0] - CRANE_AT[0], dz2 = p[2] - CRANE_AT[2], sw = Math.atan2(dx, dz2) - cy, R = Math.hypot(dx, dz2), el = Math.acos(cl((R - cr.FOOT[0]) / (cr.L + 0.1), -1, 1)); return { sw, el }; };
        const A = aim([PALLET_AT[0], 0, PALLET_AT[2]]), B = aim(STONE_DROP), k = sm(cl(c.craneSwing ?? 1));
        let dsw = B.sw - A.sw; while (dsw > Math.PI) dsw -= TAU; while (dsw < -Math.PI) dsw += TAU;
        const sw = A.sw + dsw * k, el = lerp(A.el, B.el, k), tip = cr.tip(sw, el), low = cl(c.crane ?? 0);
        const hookY = lerp(5.6, lerp(DECK + 6, DECK + 2.65, sm(low)), k);
        cr.set({ swing: sw, el, cable: Math.max(0.5, tip.y - hookY), t, sway: (1 - low) * 0.6 });
        hookLoad.rotation.y = -cy; }
      // truck
      { const k = cl(c.truck ?? 1), x = lerp(240, TRUCK_STOP[0], 1 - (1 - k) ** 2); tr.g.position.set(x, 0, TRUCK_STOP[2]); tr.g.rotation.y = -Math.PI / 2; tr.set({ dist: 240 - x, t, bob: k < 0.999 ? 1 : 0.1, brake: sm((k - 0.8) / 0.15) * (1 - sm((k - 0.99) / 0.01)) }); }
      // family wagon
      { const bc = desertBossCar(c.bossCar ?? 0); bossCar.g.position.set(...bc.pos); bossCar.g.rotation.y = bc.yaw; bossCar.g.visible = (c.bossCarHide ?? 0) < 0.5; bossCar.set({ dist: bc.dist, t, bob: bc.moving ? 0.8 : 0.1, steer: bc.steer, door: c.bossDoor ?? 0, brake: bc.brake }); }
      { const w = desertWagon(cl(c.wagon ?? 0), cl(c.wagon2 ?? 0)); fam.g.position.set(...w.pos); fam.g.rotation.y = w.yaw; fam.set({ dist: w.dist, t, bob: w.moving ? 1 : 0.12, steer: w.steer, door: c.wagonDoor ?? 0, brake: w.brake }); }
      // the SOLD lot sign spin (+ slam / bounce)
      if (soldBoard) { const s = cl(c.sold ?? 0), spin = s < 0.55 ? Math.PI * (1 - (1 - s / 0.55) ** 3) * 1.08 : Math.PI + 0.08 * Math.PI * Math.cos(((s - 0.55) / 0.45) * Math.PI * 5) * Math.exp(-((s - 0.55) / 0.45) * 5);
        const swing = s > 0 && s < 1 ? 0.35 * Math.sin(s * Math.PI * 6) * Math.exp(-s * 3) : 0; (soldBoard as THREE.Group).rotation.set(swing, spin, 0); }
      // grow: houses, SOLD signs, shops, crowds, paving, palms
      grow.visible = gr > 0.02; pave.visible = gr > 0.3;
      growHouses.forEach((h) => { const k = sm((gr - h.th) / 0.12); h.g.visible = k > 0.01; h.g.scale.set(1, Math.max(0.01, k), 1); });
      saleSigns.forEach((s, i) => { const sold = gr > s.th; s.fs.forEach((m, j) => { m.visible = !sold || (i === 0 && j === 1); }); s.sd.forEach((m) => { m.visible = sold && i !== 0; }); });
      if (gr > 0.02) { palms.forEach((p) => swayPalm(p, t, 0.7)); }
      bunts.forEach((bt) => flutter(bt, t)); flags.forEach((f) => wave(f, t, 5));
      // boats
      const bOn = (c.boats ?? 0) > 0 && wv > 0.9;
      boats.forEach((bt, i) => { bt.g.visible = bt.wake.visible = bt.bow.visible = bOn; if (!bOn) return; const p = desertBoat(i, cl(c.boats ?? 0)); bt.g.position.set(p.pos[0], WL + 0.12 + Math.sin(t * 2.3 + i) * 0.04, p.pos[2]); bt.g.rotation.set(-0.06 + Math.sin(t * 1.7 + i) * 0.015, p.yaw, Math.sin(t * 1.3 + i * 2) * 0.02);
        bt.wake.position.set(p.pos[0], WL + 0.03, p.pos[2]); bt.wake.rotation.y = p.yaw; bt.bow.position.set(p.pos[0] + Math.sin(p.yaw) * 2.4, WL + 0.04, p.pos[2] + Math.cos(p.yaw) * 2.4); bt.bow.rotation.y = p.yaw; });
      // the town sign repaint
      { const pp = cl(c.popPaint ?? 0); popRect(popPrimer, sm(pp / 0.3), 0.3, 0.92, 0.12, 0.42); popRect(popNew, cl((pp - 0.3) / 0.7), 0.3, 0.92, 0.12, 0.42); }
      // tumbleweed across the frame-1 view
      tw.visible = c.tumble !== undefined || c.tumbleDeck !== undefined;
      if (c.tumbleDeck !== undefined) { const u = cl(c.tumbleDeck), x = lerp(40, -8, u), z = 1.6 + Math.sin(u * 7) * 0.4, hop = Math.abs(Math.sin(u * Math.PI * 11)) * 0.3; tw.position.set(x, 10.5 + 0.48 + hop, z); tw.rotation.set(0.2, 0.3, (u * 48) / 0.48); }
      else if (tw.visible) { const u = cl(c.tumble ?? 0), x = lerp(8, -20, u), z = lerp(-3.5, -13, u) + Math.sin(u * 9) * 0.3, hop = Math.abs(Math.sin(u * Math.PI * 9)) * 0.32; tw.position.set(x, 0.48 + hop + Math.max(0, desertGround(x, z, dig)), z); tw.rotation.set((u * 29.6) / 0.48 * 0.32, 0.3, (u * 29.6) / 0.48 * 0.95); }
      hawkPose(hk, t, [4, 46, 8], 26);
      devils.forEach((d) => d(t));
      shimmer.forEach((m) => { const p = m.geometry.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array, bs = m.userData.base as Float32Array; for (let i = 0; i < p.count; i++) a[i * 3 + 1] = bs[i * 3 + 1] + 0.05 * Math.sin(t * 6 + bs[i * 3] * 2 + m.userData.ph); p.needsUpdate = true; });
    },
  };
};
// ---- small local helpers (hoisted function declarations used above) ----
let solidsDone = false;
const flags: Cloth[] = [];
const bunts: Bunting[] = [];
function unlitM(key: string, t: () => THREE.Texture) { return mat("dsUnlit" + key, () => new THREE.MeshBasicMaterial({ map: t(), side: THREE.DoubleSide })); }
function flagTex() { return ctex("dsFlag", 256, 160, (g) => { for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? "#f4efe4" : "#e2453c"; g.fillRect(0, i * (160 / 7), 256, 160 / 7 + 1); } g.fillStyle = "#1c3a6a"; g.fillRect(0, 0, 110, 86); g.fillStyle = "#f2c230"; g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU - Math.PI / 2, rr = k % 2 ? 12 : 28; g.lineTo(55 + Math.cos(a) * rr, 43 + Math.sin(a) * rr); } g.fill(); }); }
void glow; void hash;
