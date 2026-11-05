// THE GIANT FLOOR MAP (scale gag), "Why He Put a Bridge in the Desert", light key `mapRoom`.
// A big 1960s planning hall (x -11..11, z -8..10.5, ceiling 11): parquet floor, walnut wainscot + cream plaster walls,
// five tall steel-framed windows on the north wall (z -8) full of evening sky, eight enamel pendant lamps (y 5.4, rows z -3.1 / 3.5) over the map
// making warm pools, rolled maps in racks on the west wall, a drafting table + stool + swing lamp and a globe at the east
// edge, a wall clock, a bin of rolled plans.
// The painted world map lies on the floor, x -7..7, z -4.5..4.5 (paint top y = MAPY = 0.02), north = -z (the far
// side for cameras on the south side, so labels read from there). Mercator (mapkit_geo.ts) with two storybook
// exaggerations so the toys fit: a fat Panama isthmus crossed by a real 3D toy canal, and South America pushed south.
//   London (tiny clock tower, dome, houses, a tiny five-arch bridge over the painted Thames) at (3.09, -2.10);
//   the Atlantic with painted waves and the dotted shipping route; the Caribbean; the canal from the Caribbean
//   (-1.12, 0.47) to the Pacific (-0.8, 2.25): concrete lock walls, two pairs of mitre gates, water raised 4 cm in the
//   lock chamber (the little water step); the Pacific coast up to a tiny harbour at Los Angeles (-3.1, -0.83: piers, a
//   crane, sheds); the orange American Southwest with a toy town and a tiny toy bridge (on dry sand) around
//   (-1.05, -1.2). Labels: ATLANTIC OCEAN, PACIFIC OCEAN, PANAMA CANAL. Route London -> harbour ~10.3 m.
// Moving toys: toy cargo ship 1.2 m (red hull, white bridge, numbered granite blocks), toy flatbed truck 1.0 m.
//
// ctl (pose c):
//   ship   0..1  the ship along the route: 0 at London (bossStart behind it) .. 1 docked at the harbour. Through the
//                canal at SHIP_U.lock1 .. SHIP_U.lock2 (exported), it rises onto the lock chamber's water and down again.
//   locks  0..1  0..0.5 opens the north (Caribbean) gate pair, 0.5..1 the south (Pacific) pair (foam spills at the step)
//   cargo  0..1  the numbered blocks hop from the ship's deck onto the truck bed one by one (default: 1 once truck > 0)
//   truck  0..1  the truck rolls from the harbour dock into the painted desert to the toy town
// Ambient: ship funnel smoke, bow foam + ripple rings, canal water shimmer, lamp pools breathe, dust in the window
//   light, a clock.
// Exports for the story builder: worldmapShip(u) / worldmapBoss(u) (ship pose and the boss's pushing spot for a ship
//   value u), worldmapTrack(u) (a side-tracking camera for that u), SHIP_U (route params of the canal + harbour).
// Camera lanes kept clear: the whole floor over the map is free above y 0.35 except the lamps (y > 5.0); the boss's
//   walking lane (behind the ship, the east bank of the canal) has no 3D toys. WORLDMAP_SOLIDS lists what the camera
//   must never enter.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, jit } from "../paint";
import { twoTone } from "../shade";
import { glow, shaft } from "../setkit";
import { motes, lamCustom } from "./innerkit_b";
import { fitText, cl, sm, lerp, puff, risePuffs } from "./portkit_common";
import { seg, lathe, brassM, dialTex, clockHands } from "./hotel";
import { blot, center, noink, phong, mesh, TAU, tinyBridge, tinyHouse, lotFlag, tinyCactus, tinyPalm, toyShip, toyTruck, stoneBlock } from "./mapkit";
import * as GEO from "./mapkit_geo";
import type { SetDef, V3 } from "./types";

const MAPY = 0.02, MX = 7, MZ = 4.5;
const HX0 = -11, HX1 = 11, HZ0 = -8, HZ1 = 10.5, HH = 11;
type P2 = [number, number];

// ---------------- route ----------------
const A = GEO.CANAL_A, B = GEO.CANAL_B;
const CD = (() => { const dx = B[0] - A[0], dz = B[1] - A[1], l = Math.hypot(dx, dz); return { x: dx / l, z: dz / l, L: l }; })();
const along = (k: number): P2 => [A[0] + CD.x * k, A[1] + CD.z * k];
const ROUTE: P2[] = [[2.0, -1.33], [1.1, -0.8], [0.2, -0.22], [-0.45, 0.06], [-0.92, 0.1], along(-0.25), A, along(0.3), along(0.9), along(1.5), B, along(CD.L + 0.22),
  [-1.35, 2.68], [-2.35, 2.12], [-3.05, 1.22], [-3.48, 0.42], [-3.58, -0.15]];
const curve = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => V(x, 0, z)), false, "centripetal");
const CURVE_LEN = curve.getLength();
const uOfPoint = (p: P2) => { let best = 0, bd = 1e9; for (let i = 0; i <= 600; i++) { const q = curve.getPointAt(i / 600); const d = Math.hypot(q.x - p[0], q.z - p[1]); if (d < bd) { bd = d; best = i / 600; } } return best; };
const G1 = 0.22, G2 = 1.6; // gate positions along the canal axis
/** route parameters (ship value) of the canal mouths, the two gate pairs and the harbour */
export const SHIP_U = { canalIn: uOfPoint(A), lock1: uOfPoint(along(G1)), lock2: uOfPoint(along(G2)), canalOut: uOfPoint(B), harbour: 1, length: CURVE_LEN };
const canalCoord = (x: number, z: number) => { const dx = x - A[0], dz = z - A[1]; return { s: dx * CD.x + dz * CD.z, lat: dx * CD.z - dz * CD.x }; }; // lat > 0 = east bank
const LV_LO = 0.035, LV_HI = 0.075;
const waterLevel = (s: number) => {
  if (s < -0.3 || s > CD.L + 0.3) return 0;
  const ramp = s < 0 ? sm((s + 0.3) / 0.25) : s > CD.L ? sm((CD.L + 0.3 - s) / 0.25) : 1;
  const lift = sm((s - G1 + 0.03) / 0.06) * (1 - sm((s - G2 + 0.03) / 0.06));
  return ramp * LV_LO + lift * (LV_HI - LV_LO);
};
const yAt = (x: number, z: number) => { const c = canalCoord(x, z); return Math.abs(c.lat) < 0.35 ? Math.max(0, waterLevel(c.s) - 0.012) : 0; };
/** ship pose on the route at u (set-local): position (keel) + yaw + pitch */
export const worldmapShip = (u: number) => {
  const k = cl(u), p = curve.getPointAt(k), t = curve.getTangentAt(k), yaw = Math.atan2(-t.z, t.x);
  const L = 1.2, bow = [p.x + t.x * L * 0.45, p.z + t.z * L * 0.45], st = [p.x - t.x * L * 0.45, p.z - t.z * L * 0.45];
  const yb = yAt(bow[0], bow[1]), ys = yAt(st[0], st[1]);
  return { pos: [p.x, MAPY + (yb + ys) / 2, p.z] as V3, yaw, pitch: Math.atan2(yb - ys, L * 0.9), dir: [t.x, t.z] as P2 };
};
/** where the boss stands to push the ship at u: behind the stern, or on the canal's east bank */
export const worldmapBoss = (u: number): V3 => {
  const sp = worldmapShip(u), [tx, tz] = sp.dir;
  const behind: P2 = [sp.pos[0] - tx * 0.92, sp.pos[2] - tz * 0.92];
  const c = canalCoord(sp.pos[0], sp.pos[2]), inC = sm((c.s + 0.9) / 0.4) * (1 - sm((c.s - CD.L - 0.5) / 0.4)) * (Math.abs(c.lat) < 0.6 ? 1 : 0);
  const bank: P2 = [sp.pos[0] - tx * 0.45 + CD.z * 0.66, sp.pos[2] - tz * 0.45 - CD.x * 0.66];
  return [lerp(behind[0], bank[0], inC), MAPY, lerp(behind[1], bank[1], inC)];
};
/** side-tracking camera for ship value u: south of the boss, 1.55 m up, looking at the boss + ship */
export const worldmapTrack = (u: number, dist = 3.2, h = 1.55) => {
  const b = worldmapBoss(u), s = worldmapShip(u), mx = (b[0] + s.pos[0]) / 2, mz = (b[2] + s.pos[2]) / 2;
  const [tx, tz] = s.dir; let px = -tz, pz = tx; if (pz < 0) { px = -px; pz = -pz; } // perpendicular toward the south side
  const sx = 0.35 * px + 0.15, sz = Math.max(0.6, pz); const n = Math.hypot(sx, sz);
  return { pos: [mx + (sx / n) * dist, h, mz + (sz / n) * dist] as V3, look: [mx, 0.75, mz] as V3, fov: 38 };
};

// ---------------- the painted map (2 x 2 tiles of 7 x 4.5 m, 4096 x 2633 px each = 585 px/m) ----------------
const TW = 4096, TH = 2633;
type Poly = { pts: P2[]; skip?: Set<number> };
const dens = (ll: P2[], closed = true, n = 5): P2[] => {
  const out: P2[] = [], N = ll.length;
  for (let i = 0; i < (closed ? N : N - 1); i++) {
    const p0 = ll[(i - 1 + N) % N], p1 = ll[i], p2 = ll[(i + 1) % N], p3 = ll[(i + 2) % N];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  return out;
};
const P = (l: GEO.LL[], shift = true) => l.map(([lo, la]) => GEO.proj(lo, la, shift) as P2);
/** desert Southwest (orange) + the Sahara, floor metres (clipped to land) */
const SOUTHWEST: P2[] = [[-3.4, -1.75], [-2.6, -1.95], [-1.6, -1.85], [-0.75, -1.75], [-0.55, -1.2], [-0.8, -0.72], [-1.5, -0.58], [-2.1, -0.4], [-2.7, -0.2], [-3.1, -0.4], [-3.35, -1.0]];
const SAHARA: P2[] = [[2.2, -0.15], [3.3, -0.55], [4.4, -0.62], [5.4, -0.5], [5.5, 0.4], [4.2, 0.55], [3.0, 0.45], [2.3, 0.3]];
const drawMap = (g: CanvasRenderingContext2D, ox: number, oz: number, kx: number) => {
  const r = rng(1831);
  const T = () => g.setTransform(kx, 0, 0, kx, -ox * kx, -oz * kx), I = () => g.setTransform(1, 0, 0, 1, 0, 0);
  const px = (x: number, z: number): P2 => [(x - ox) * kx, (z - oz) * kx];
  const path = (pts: P2[], closed = true) => { const p = new Path2D(); pts.forEach(([x, z], i) => (i ? p.lineTo(x, z) : p.moveTo(x, z))); if (closed) p.closePath(); return p; };
  T();
  // ocean: deep blue with a lighter middle, latitude / longitude grid
  const og = g.createLinearGradient(0, -MZ, 0, MZ); og.addColorStop(0, "#2f6ea8"); og.addColorStop(0.45, "#3f8ac0"); og.addColorStop(1, "#2c66a0"); g.fillStyle = og; g.fillRect(-MX, -MZ, 2 * MX, 2 * MZ);
  for (let k = 0; k < 60; k++) { const x = -MX + r() * 2 * MX, z = -MZ + r() * 2 * MZ; I(); const [a, b] = px(x, z); blot(g, a, b, (0.6 + r()) * kx, "rgba(120,200,235,0.12)"); T(); }
  g.strokeStyle = "rgba(220,240,255,0.22)"; g.lineWidth = 0.008;
  for (let lo = -180; lo <= 45; lo += 15) { const x = GEO.merc(lo, 0)[0]; g.beginPath(); g.moveTo(x, -MZ); g.lineTo(x, MZ); g.stroke(); }
  for (let la = -45; la <= 75; la += 15) { const z = GEO.merc(0, la)[1]; g.beginPath(); g.moveTo(-MX, z); g.lineTo(MX, z); g.stroke(); }
  // land
  const NA = dens(P(GEO.NORTH_AMERICA)), SA = dens(P(GEO.SOUTH_AMERICA)), EA = dens(P(GEO.EURAFRICA)), NK = dens(GEO.NECK);
  const naSeam = GEO.NORTH_AMERICA.findIndex(([lo, la]) => lo === -83.5 && la === 12.5);
  const lands: { poly: P2[]; col: string; skip?: (i: number, n: number) => boolean }[] = [
    { poly: NA, col: "#d8d49a", skip: (i) => Math.floor(i / 5) === naSeam },
    { poly: SA, col: "#a9c878", skip: (i, n) => i >= n - 5 },
    { poly: NK, col: "#b9cf86", skip: (i, n) => (i >= 25 && i < 50) || i >= n - 5 },
    { poly: EA, col: "#d6cf96" },
    { poly: dens(P(GEO.GREENLAND)), col: "#eef2f2" }, { poly: dens(P(GEO.ICELAND)), col: "#d8e0c8" }, { poly: dens(P(GEO.NEWFOUNDLAND)), col: "#c8d090" },
    { poly: dens(P(GEO.BRITAIN), true, 6), col: "#a6cc7e" }, { poly: dens(P(GEO.IRELAND), true, 6), col: "#9cc878" },
    { poly: dens(P(GEO.CUBA)), col: "#bcd48a" }, { poly: dens(P(GEO.HISPANIOLA)), col: "#bcd48a" },
    ...GEO.SMALL_ISLES.map((l) => ({ poly: dens(P(l), true, 3), col: "#c4d68e" })),
    ...GEO.MED_ISLES.map((l) => ({ poly: dens(P(l), true, 3), col: "#d6cf96" })),
  ];
  // shallow water halo along every coast
  for (const L of lands) { g.strokeStyle = "rgba(150,215,235,0.55)"; g.lineWidth = 0.07; g.lineJoin = "round"; g.stroke(path(L.poly)); g.strokeStyle = "rgba(190,235,245,0.6)"; g.lineWidth = 0.03; g.stroke(path(L.poly)); }
  const landPath = new Path2D(); for (const L of lands) landPath.addPath(path(L.poly));
  for (const L of lands) { g.fillStyle = L.col; g.fill(path(L.poly)); }
  // regional tints (clipped to land): greener east of the US + Europe, the orange Southwest and Sahara, Mexico ochre
  g.save(); g.clip(landPath);
  const tint = (pts: P2[], col: string) => { g.fillStyle = col; g.fill(path(dens(pts, true, 6))); };
  tint([[-2.6, -2.4], [-0.6, -2.6], [-0.4, -1.2], [-1.0, -0.4], [-2.0, -0.7], [-2.6, -1.4]], "rgba(140,190,100,0.55)");
  tint([[2.6, -4.4], [5.6, -4.4], [5.6, -1.2], [3.6, -1.3], [2.6, -2.2]], "rgba(150,195,105,0.5)");
  tint([[-2.9, 0.1], [-1.9, -0.45], [-1.5, 0.3], [-1.9, 0.45]], "rgba(225,175,95,0.55)");
  tint(SOUTHWEST, "#e9a054"); tint(SAHARA, "#ebbd6e");
  tint([[-1.0, 2.0], [1.2, 1.9], [1.8, 3.4], [0.4, 4.5], [-0.8, 4.5]], "rgba(110,175,90,0.45)");
  // inner light rim (soft painted edge) + speckle texture on land
  for (const L of lands) { g.strokeStyle = "rgba(255,250,225,0.35)"; g.lineWidth = 0.05; g.stroke(path(L.poly)); }
  for (let k = 0; k < 9000; k++) { const x = -MX + r() * 2 * MX, z = -MZ + r() * 2 * MZ; g.fillStyle = r() < 0.5 ? "rgba(120,100,60,0.18)" : "rgba(255,250,230,0.25)"; g.fillRect(x, z, 0.012, 0.012); }
  // painted desert details: dunes on the Southwest, a dry wash where the toy town is
  g.strokeStyle = "rgba(190,110,50,0.45)"; g.lineWidth = 0.012; g.lineCap = "round";
  for (let k = 0; k < 40; k++) { const x = -3.2 + r() * 2.5, z = -1.8 + r() * 1.3; g.beginPath(); g.arc(x, z + 0.06, 0.06, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  g.strokeStyle = "#d9b47c"; g.lineWidth = 0.09; g.beginPath(); g.moveTo(-1.6, -1.78); g.bezierCurveTo(-1.2, -1.5, -1.0, -1.75, -0.6, -1.5); g.stroke();
  g.strokeStyle = "rgba(150,100,60,0.5)"; g.lineWidth = 0.008; g.setLineDash([0.02, 0.015]); g.stroke(); g.setLineDash([]);
  // forests (dabs) on the green parts
  for (let k = 0; k < 500; k++) { const x = -MX + r() * 2 * MX, z = -MZ + r() * 2 * MZ; if ((x > -2.6 && x < -0.5 && z > -2.6 && z < -0.6) || (x > 2.7 && x < 5.5 && z > -3.5 && z < -1.4) || (x > -0.8 && x < 1.6 && z > 2.0 && z < 4.4)) { g.fillStyle = r() < 0.5 ? "rgba(80,140,70,0.55)" : "rgba(100,160,80,0.5)"; g.beginPath(); g.arc(x, z, 0.018 + r() * 0.012, 0, TAU); g.fill(); } }
  g.restore();
  // inland water: Hudson Bay, Great Lakes, Mediterranean, Black / Red / Caspian Sea
  const waters = [dens(P(GEO.HUDSON)), ...GEO.GREAT_LAKES.map((l) => dens(P(l), true, 3)), dens(P(GEO.MEDITERRANEAN), true, 4), dens(P(GEO.BLACK_SEA)), dens(P(GEO.RED_SEA), true, 3), dens(P(GEO.CASPIAN))];
  for (const w of waters) { g.fillStyle = "#3f8ac0"; g.fill(path(w)); g.strokeStyle = "rgba(190,235,245,0.6)"; g.lineWidth = 0.02; g.stroke(path(w)); }
  for (const l of GEO.MED_ISLES) { g.fillStyle = "#d6cf96"; g.fill(path(dens(P(l), true, 3))); }
  // mountains: little painted peaks
  for (const rg of GEO.RIDGES) { const pts = dens(P(rg), false, 8); for (let i = 0; i < pts.length; i += 2) { const [x, z] = pts[i], s = 0.05 + r() * 0.03;
    g.fillStyle = "#a88a62"; g.beginPath(); g.moveTo(x - s, z + s * 0.5); g.lineTo(x, z - s * 0.7); g.lineTo(x + s, z + s * 0.5); g.closePath(); g.fill();
    g.fillStyle = "#7a6248"; g.beginPath(); g.moveTo(x, z - s * 0.7); g.lineTo(x + s, z + s * 0.5); g.lineTo(x + s * 0.2, z + s * 0.5); g.closePath(); g.fill();
    g.fillStyle = "#f6f2ea"; g.beginPath(); g.moveTo(x - s * 0.3, z - s * 0.25); g.lineTo(x, z - s * 0.7); g.lineTo(x + s * 0.3, z - s * 0.25); g.closePath(); g.fill(); } }
  // coastlines (plum ink), skipping the seams where the neck joins the continents
  g.strokeStyle = "#4a2e4a"; g.lineWidth = 0.013; g.lineJoin = "round"; g.lineCap = "round";
  for (const L of lands) { const n = L.poly.length; g.beginPath(); let at = -1;
    for (let i = 0; i < n; i++) { if (L.skip && L.skip(i, n)) continue; const a = L.poly[i], c = L.poly[(i + 1) % n]; if (at !== i) g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); at = i + 1; }
    g.stroke(); }
  for (const w of waters) { g.lineWidth = 0.01; g.stroke(path(w)); }
  // the Thames through London
  { const [lx, lz] = GEO.proj(-0.13, 51.5); g.strokeStyle = "#3f8ac0"; g.lineWidth = 0.016; g.beginPath(); g.moveTo(lx - 0.15, lz - 0.02); g.quadraticCurveTo(lx, lz + 0.03, lx + 0.12, lz - 0.01); g.stroke(); }
  // waves: little painted curls on open ocean
  I();
  g.lineCap = "round";
  for (let k = 0; k < 1400; k++) {
    const x = -MX + 0.2 + r() * (2 * MX - 1.6), z = -MZ + 0.2 + r() * (2 * MZ - 0.4), [a, b] = px(x, z);
    if (g.isPointInPath(landPathPx(), a, b)) continue;
    const s = (0.05 + r() * 0.04) * kx; g.strokeStyle = r() < 0.6 ? "rgba(220,245,255,0.55)" : "rgba(30,80,140,0.35)"; g.lineWidth = 0.008 * kx;
    g.beginPath(); g.moveTo(a - s, b); g.quadraticCurveTo(a - s / 2, b - s * 0.5, a, b); g.quadraticCurveTo(a + s / 2, b + s * 0.5, a + s, b); g.stroke();
  }
  T();
  // the dotted shipping route + the dashed red road from the harbour to the toy town
  g.strokeStyle = "rgba(255,252,240,0.9)"; g.lineWidth = 0.02; g.setLineDash([0.05, 0.05]);
  g.beginPath(); for (let i = 0; i <= 400; i++) { const q = curve.getPointAt(i / 400); if (i) g.lineTo(q.x, q.z); else g.moveTo(q.x, q.z); } g.stroke();
  g.strokeStyle = "#b83a2a"; g.lineWidth = 0.025; g.setLineDash([0.07, 0.04]); g.beginPath(); g.moveTo(-3.0, -0.98); g.bezierCurveTo(-2.4, -1.02, -1.9, -1.08, -1.3, -1.12); g.stroke(); g.setLineDash([]);
  // labels (pixel space so the fonts are crisp), cream with a navy outline, letter-spaced
  I();
  const label = (t: string, x: number, z: number, hM: number, wM: number, fill = "#f6efd8", sp = 0.18) => {
    const [a, b] = px(x, z); g.save(); g.translate(a, b); const fs = hM * kx; g.font = `900 ${fs}px Georgia, serif`; center(g);
    const chars = [...t], ws = chars.map((c) => g.measureText(c).width), tot = ws.reduce((p, q) => p + q, 0) + sp * fs * (chars.length - 1), k = Math.min(1, (wM * kx) / tot);
    g.scale(k, 1); let xx = -tot / 2; g.lineJoin = "round";
    chars.forEach((c, i) => { const cx = xx + ws[i] / 2; g.lineWidth = fs * 0.14; g.strokeStyle = "rgba(25,40,80,0.85)"; g.strokeText(c, cx, 0); g.fillStyle = fill; g.fillText(c, cx, 0); xx += ws[i] + sp * fs; });
    g.restore();
  };
  label("ATLANTIC OCEAN", 1.0, 1.0, 0.2, 2.5); label("PACIFIC OCEAN", -4.75, 1.85, 0.22, 2.7);
  label("PANAMA", -2.15, 0.98, 0.11, 0.8, "#fff2c8", 0.12); label("CANAL", -2.15, 1.14, 0.11, 0.6, "#fff2c8", 0.12);
  // right decorative panel: compass rose + a sea-chart cartouche without words; frame
  T();
  g.fillStyle = "#24365e"; g.fillRect(5.55, -MZ, MX - 5.55, 2 * MZ); g.strokeStyle = "#d6a443"; g.lineWidth = 0.03; g.strokeRect(5.65, -MZ + 0.1, MX - 5.75, 2 * MZ - 0.2);
  const rose = (cx: number, cz: number, R: number) => { for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU, long = k % 4 === 0, rr = long ? R : k % 2 ? R * 0.45 : R * 0.7; g.fillStyle = k % 2 ? "#f2d27a" : "#f6efd8";
    g.beginPath(); g.moveTo(cx, cz); g.lineTo(cx + Math.cos(a - 0.12) * rr * 0.25, cz + Math.sin(a - 0.12) * rr * 0.25); g.lineTo(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr); g.lineTo(cx + Math.cos(a + 0.12) * rr * 0.25, cz + Math.sin(a + 0.12) * rr * 0.25); g.closePath(); g.fill(); g.strokeStyle = "rgba(25,40,80,0.8)"; g.lineWidth = 0.008; g.stroke(); }
    g.strokeStyle = "#f2d27a"; g.lineWidth = 0.015; g.beginPath(); g.arc(cx, cz, R * 0.8, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cz, R * 0.85, 0, TAU); g.stroke(); };
  rose(6.27, -2.6, 0.55); rose(-5.9, -2.9, 0.42);
  { const cx = 6.27, cz = 1.0; g.fillStyle = "#f6efd8"; g.fillRect(cx - 0.45, cz - 0.9, 0.9, 1.8); g.strokeStyle = "#d6a443"; g.lineWidth = 0.02; g.strokeRect(cx - 0.4, cz - 0.85, 0.8, 1.7);
    // a little painted ship + waves in the cartouche
    g.fillStyle = "#c8352e"; g.beginPath(); g.moveTo(cx - 0.3, cz - 0.05); g.lineTo(cx + 0.3, cz - 0.05); g.lineTo(cx + 0.22, cz + 0.08); g.lineTo(cx - 0.26, cz + 0.08); g.closePath(); g.fill();
    g.fillStyle = "#f6f1e6"; g.fillRect(cx - 0.22, cz - 0.18, 0.14, 0.13); g.fillStyle = "#2c2a38"; g.fillRect(cx - 0.17, cz - 0.3, 0.05, 0.12);
    g.strokeStyle = "#3f8ac0"; g.lineWidth = 0.015; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx - 0.34, cz + 0.14 + k * 0.08); for (let q = 0; q < 6; q++) g.quadraticCurveTo(cx - 0.34 + q * 0.12 + 0.03, cz + 0.1 + k * 0.08, cx - 0.34 + (q + 1) * 0.12 - 0.0, cz + 0.14 + k * 0.08); g.stroke(); }
    g.fillStyle = "#24365e"; for (let k = 0; k < 4; k++) g.fillRect(cx - 0.3, cz + 0.45 + k * 0.08, 0.6 - (k % 2) * 0.2, 0.02); }
  g.strokeStyle = "#24365e"; g.lineWidth = 0.18; g.strokeRect(-MX + 0.09, -MZ + 0.09, 2 * MX - 0.18, 2 * MZ - 0.18);
  g.strokeStyle = "#d6a443"; g.lineWidth = 0.025; g.strokeRect(-MX + 0.22, -MZ + 0.22, 2 * MX - 0.44, 2 * MZ - 0.44);
  for (let k = 0; k < 40; k++) { I(); const [a, b] = px(-MX + r() * 2 * MX, -MZ + r() * 2 * MZ); blot(g, a, b, (0.3 + r() * 0.8) * kx, "rgba(90,70,40,0.07)"); T(); } // wear
  function landPathPx() { return LPX ?? (LPX = (() => { const p = new Path2D(); const m = new DOMMatrix([kx, 0, 0, kx, -ox * kx, -oz * kx]); p.addPath(landPath, m); return p; })()); }
};
let LPX: Path2D | null = null;
const mapTile = (i: number, j: number) => ctex(`wmTile${i}${j}`, TW, TH, (g) => { LPX = null; drawMap(g, -MX + i * MX, -MZ + j * MZ, TW / MX); });

// ---------------- hall textures ----------------
const parquetTex = () => ctex("wmParquet", 1024, 1024, (g, r) => {
  g.fillStyle = "#5a3420"; g.fillRect(0, 0, 1024, 1024);
  const s = 64; // herringbone blocks 1024 px = 2 m
  for (let y = -2; y < 18; y++) for (let x = -2; x < 18; x++) {
    const ox = x * s * 2 + (y % 2) * s, oy = y * s;
    for (const rot of [0, 1]) { g.save(); g.translate(ox + rot * s, oy); g.rotate(rot ? Math.PI / 2 : 0); g.fillStyle = jit(r, "#9a6438", 0.1, 4, 0.12); g.fillRect(1, 1, s * 2 - 2, s - 2);
      for (let k = 0; k < 3; k++) { g.strokeStyle = "rgba(60,30,14,0.25)"; g.lineWidth = 1.2; g.beginPath(); const yy = 6 + r() * (s - 12); g.moveTo(4, yy); g.bezierCurveTo(40, yy + (r() - 0.5) * 6, 90, yy + (r() - 0.5) * 6, s * 2 - 4, yy); g.stroke(); }
      g.fillStyle = "rgba(255,210,160,0.1)"; g.fillRect(1, 1, s * 2 - 2, 3); g.restore(); }
  }
  for (let k = 0; k < 20; k++) blot(g, r() * 1024, r() * 1024, 60 + r() * 120, "rgba(40,20,10,0.12)");
});
const plasterTex = () => ctex("wmPlaster", 512, 512, (g, r) => {
  g.fillStyle = "#e6d6b6"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 3000; k++) { g.fillStyle = r() < 0.5 ? "rgba(150,120,80,0.12)" : "rgba(255,250,235,0.2)"; g.fillRect(r() * 512, r() * 512, 2, 2); }
  for (let k = 0; k < 20; k++) blot(g, r() * 512, r() * 512, 40 + r() * 100, "rgba(160,120,80,0.08)");
});
const wainscotTex = () => ctex("wmWainscot", 1024, 512, (g, r) => {
  g.fillStyle = "#4a2a18"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 4; i++) { const x = 20 + i * 256; g.fillStyle = jit(r, "#6e4024", 0.06); g.fillRect(x, 60, 216, 360);
    for (let k = 0; k < 10; k++) { g.strokeStyle = "rgba(30,12,6,0.25)"; g.lineWidth = 1.5; g.beginPath(); const xx = x + 8 + r() * 200; g.moveTo(xx, 62); g.bezierCurveTo(xx + 8, 200, xx - 8, 300, xx + 2, 418); g.stroke(); }
    g.fillStyle = "rgba(255,210,160,0.16)"; g.fillRect(x, 60, 216, 5); g.fillRect(x, 60, 5, 360); g.fillStyle = "rgba(20,8,4,0.45)"; g.fillRect(x, 415, 216, 5); g.fillRect(x + 211, 60, 5, 360); }
  g.fillStyle = "#3a2014"; g.fillRect(0, 0, 1024, 30); g.fillRect(0, 470, 1024, 42);
});
const skyTex = () => ctex("wmEveningSky", 1024, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#7a6aa8"); gr.addColorStop(0.35, "#e48a78"); gr.addColorStop(0.65, "#ffbe7a"); gr.addColorStop(0.85, "#ffd99a"); gr.addColorStop(1, "#f2b27a");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  blot(g, 620, 800, 260, "rgba(255,240,190,0.85)"); g.fillStyle = "#fff4d0"; g.beginPath(); g.arc(620, 800, 60, 0, TAU); g.fill();
  for (let k = 0; k < 9; k++) { const y = 150 + r() * 450, x = r() * 1024, w = 200 + r() * 300; g.fillStyle = "rgba(255,200,170,0.45)"; g.beginPath(); g.ellipse(x, y, w / 2, 12 + r() * 10, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(170,110,140,0.35)"; g.beginPath(); g.ellipse(x + 10, y + 8, w / 2.2, 8, 0, 0, TAU); g.fill(); }
  // rooftops of the town across the street
  g.fillStyle = "#6a4a6a"; let x = 0; while (x < 1024) { const w = 60 + r() * 120, h = 40 + r() * 90; g.fillRect(x, 1024 - h, w, h); if (r() < 0.4) g.fillRect(x + w * 0.3, 1024 - h - 30, 10, 30); x += w + 4; }
});
const windowPatchTex = () => ctex("wmWinPatch", 256, 512, (g) => {
  g.clearRect(0, 0, 256, 512);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) { const gr = g.createLinearGradient(0, j * 85, 0, j * 85 + 75); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(1, "rgba(255,255,255,0.75)"); g.fillStyle = gr; g.fillRect(8 + i * 82, 6 + j * 85, 72, 75); }
  g.globalCompositeOperation = "destination-in"; const e = g.createLinearGradient(0, 0, 0, 512); e.addColorStop(0, "rgba(0,0,0,0.2)"); e.addColorStop(0.3, "rgba(0,0,0,1)"); e.addColorStop(1, "rgba(0,0,0,0.35)"); g.fillStyle = e; g.fillRect(0, 0, 256, 512); g.globalCompositeOperation = "source-over";
});
const poolTex = () => ctex("wmPool", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.5, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const foamTex = () => ctex("wmFoam", 256, 256, (g, r) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineCap = "round";
  for (let k = 0; k < 5; k++) { g.lineWidth = 9 - k; g.beginPath(); g.arc(128, 150 + k * 6, 70 + k * 16, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); }
  for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(40 + r() * 176, 70 + r() * 70, 2 + r() * 4, 0, TAU); g.fill(); }
});
const wakeTex = () => ctex("wmWake", 128, 512, (g, r) => {
  g.clearRect(0, 0, 128, 512);
  for (let y = 0; y < 512; y += 4) { const a = 0.85 * (1 - y / 512); g.fillStyle = `rgba(255,255,255,${a * (0.4 + 0.6 * r())})`; g.fillRect(10 + (y / 512) * 10, y, 10, 3); g.fillRect(108 - (y / 512) * 10, y, 10, 3); }
  for (let k = 0; k < 60; k++) { g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(30 + r() * 68, r() * 300, 2 + r() * 3, 0, TAU); g.fill(); }
});
const ringTex = () => ctex("wmRing", 128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke(); });
const concreteTex = () => ctex("wmConcrete", 256, 256, (g, r) => { g.fillStyle = "#a8a29a"; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 1500; k++) { g.fillStyle = r() < 0.5 ? "rgba(120,110,100,0.2)" : "rgba(255,255,250,0.3)"; g.fillRect(r() * 256, r() * 256, 2, 2); } g.fillStyle = "rgba(90,80,80,0.4)"; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 2, 256); g.fillStyle = "#e8b030"; g.fillRect(0, 0, 256, 10); g.fillStyle = "#2c2a38"; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 16, 10); });
const draftTex = () => ctex("wmDraft", 512, 384, (g, r) => {
  g.fillStyle = "#eef2f6"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "rgba(90,130,190,0.25)"; g.lineWidth = 1; for (let x = 0; x < 512; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 384); g.stroke(); } for (let y = 0; y < 384; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.strokeStyle = "#2a3a6a"; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 260); g.lineTo(470, 260); g.stroke();
  for (let k = 0; k < 5; k++) { const cx = 90 + k * 82, w = 34 + (k === 2 ? 10 : k === 1 || k === 3 ? 5 : 0); g.beginPath(); g.ellipse(cx, 260, w, w * 0.65, 0, Math.PI, TAU); g.stroke(); }
  g.beginPath(); g.moveTo(40, 190); g.lineTo(470, 190); g.stroke(); g.lineWidth = 1.5; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(40, 300); g.lineTo(470, 300); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#2a3a6a"; center(g); fitText(g, "ELEVATION", 256, 60, 300, 36, "700 %spx Georgia, serif"); void r;
});

// ---------------- the set ----------------
export const WORLDMAP_SOLIDS: [V3, V3][] = [];
export const worldmap = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch(), r = rng(1969);
  const add = <T extends THREE.Object3D>(o: T) => { root.add(o); return o; };
  const brass = brassM();
  // ---------------- hall shell ----------------
  shell.add(quad(V(HX0, 0, HZ1), V(HX1, 0, HZ1), V(HX1, 0, HZ0), V(HX0, 0, HZ0), (HX1 - HX0) / 2, (HZ1 - HZ0) / 2), lam("wmParquetM", () => ({ map: parquetTex() })));
  shell.add(quad(V(HX0, HH, HZ0), V(HX1, HH, HZ0), V(HX1, HH, HZ1), V(HX0, HH, HZ1), (HX1 - HX0) / 2, (HZ1 - HZ0) / 2), lam("wmCeil", () => ({ map: plasterTex() })));
  const plaster = lam("wmPlasterM", () => ({ map: plasterTex() })), wain = lam("wmWainM", () => ({ map: wainscotTex() }));
  const WH = 2.4; // wainscot height
  const wall = (a: THREE.Vector3, c: THREE.Vector3, len: number) => { // a -> c along the floor, facing into the hall
    const up = V(0, 1, 0), d = c.clone().sub(a);
    shell.add(quad(a, c, c.clone().add(up.clone().multiplyScalar(WH)), a.clone().add(up.clone().multiplyScalar(WH)), len / 4, 1), wain);
    shell.add(quad(a.clone().setY(WH), c.clone().setY(WH), c.clone().setY(HH), a.clone().setY(HH), len / 2, (HH - WH) / 2), plaster); void d;
  };
  wall(V(HX1, 0, HZ0), V(HX1, 0, HZ1), HZ1 - HZ0); wall(V(HX0, 0, HZ1), V(HX0, 0, HZ0), HZ1 - HZ0); wall(V(HX1, 0, HZ1), V(HX0, 0, HZ1), HX1 - HX0);
  // north wall with five tall windows
  const WINX = [-8.4, -4.2, 0, 4.2, 8.4], WW = 2.6, WY0 = 1.4, WY1 = 8.6;
  { const sh = new THREE.Shape(); sh.moveTo(HX0, 0); sh.lineTo(HX1, 0); sh.lineTo(HX1, HH); sh.lineTo(HX0, HH); sh.closePath();
    for (const x of WINX) { const p = new THREE.Path(); p.moveTo(x - WW / 2, WY0); p.lineTo(x + WW / 2, WY0); p.lineTo(x + WW / 2, WY1); p.lineTo(x - WW / 2, WY1); p.closePath(); sh.holes.push(p); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: false }); geo.translate(0, 0, HZ0 - 0.45);
    const p = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 2, p.getY(i) / 2);
    mesh(root, geo, plaster, undefined, false);
    // wainscot strips between the windows (below the sills), sills, steel frames, mullions
    shell.add(quad(V(HX0, 0, HZ0 + 0.01), V(HX1, 0, HZ0 + 0.01), V(HX1, WY0 - 0.1, HZ0 + 0.01), V(HX0, WY0 - 0.1, HZ0 + 0.01), (HX1 - HX0) / 4, (WY0 - 0.1) / WH), wain);
    const steel = lam("wmSteel", () => ({ color: "#3a4048" }));
    for (const x of WINX) {
      shell.add(boxGeo(V(x - WW / 2 - 0.08, WY0 - 0.1, HZ0 - 0.05), V(x + WW / 2 + 0.08, WY0, HZ0 + 0.25)), lam("wmSill", () => ({ color: "#efe2c4" })));
      for (let k = 0; k <= 3; k++) shell.add(boxGeo(V(x - WW / 2 + (k * WW) / 3 - 0.03, WY0, HZ0 - 0.25), V(x - WW / 2 + (k * WW) / 3 + 0.03, WY1, HZ0 - 0.19)), steel);
      for (let k = 0; k <= 6; k++) shell.add(boxGeo(V(x - WW / 2, WY0 + (k * (WY1 - WY0)) / 6 - 0.03, HZ0 - 0.25), V(x + WW / 2, WY0 + (k * (WY1 - WY0)) / 6 + 0.03, HZ0 - 0.19)), steel);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(WW, WY1 - WY0), new THREE.MeshBasicMaterial({ color: "#ffe2b8", transparent: true, opacity: 0.12, depthWrite: false })); gl.position.set(x, (WY0 + WY1) / 2, HZ0 - 0.22); noink(gl); add(gl);
      // pilaster + cornice between windows
    }
    for (const x of [-6.3, -2.1, 2.1, 6.3]) shell.add(boxGeo(V(x - 0.3, 0, HZ0), V(x + 0.3, HH, HZ0 + 0.18), 2), plaster);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshBasicMaterial({ map: skyTex(), fog: false })); sky.position.set(0, 5.5, HZ0 - 3); noink(sky); add(sky); }
  // cornice + skirting + ceiling beams
  for (const [a, c] of [[V(HX0, HH - 0.45, HZ0), V(HX1, HH, HZ0 + 0.3)], [V(HX0, HH - 0.45, HZ1 - 0.3), V(HX1, HH, HZ1)], [V(HX0, HH - 0.45, HZ0), V(HX0 + 0.3, HH, HZ1)], [V(HX1 - 0.3, HH - 0.45, HZ0), V(HX1, HH, HZ1)]] as [THREE.Vector3, THREE.Vector3][]) shell.add(boxGeo(a, c), lam("wmCornice", () => ({ color: "#d8c6a2" })));
  for (let z = -6; z <= 9; z += 3) shell.add(boxGeo(V(HX0, HH - 0.6, z - 0.2), V(HX1, HH, z + 0.2)), lam("wmBeam", () => ({ color: "#6a4228" })));
  b.add(boxGeo(V(HX0, WH - 0.04, HZ0), V(HX0 + 0.06, WH + 0.06, HZ1)), lam("wmRail", () => ({ color: "#3a2014" }))); b.add(boxGeo(V(HX1 - 0.06, WH - 0.04, HZ0), V(HX1, WH + 0.06, HZ1)), lam("wmRail", () => ({ color: "#3a2014" })));
  // ---------------- the map ----------------
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(MX, MZ).rotateX(-Math.PI / 2), lam(`wmTileM${i}${j}`, () => ({ map: (() => { const t = mapTile(i, j); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 16; return t; })() })));
    m.position.set(-MX / 2 + i * MX, MAPY, -MZ / 2 + j * MZ); m.receiveShadow = true; add(m);
  }
  b.add(boxGeo(V(-MX - 0.04, 0, -MZ - 0.04), V(MX + 0.04, MAPY - 0.002, MZ + 0.04)), lam("wmMapEdge", () => ({ color: "#1c2a4a" })));
  for (const [a, c] of [[V(-MX - 0.06, 0, -MZ - 0.06), V(MX + 0.06, MAPY + 0.006, -MZ - 0.03)], [V(-MX - 0.06, 0, MZ + 0.03), V(MX + 0.06, MAPY + 0.006, MZ + 0.06)], [V(-MX - 0.06, 0, -MZ - 0.06), V(-MX - 0.03, MAPY + 0.006, MZ + 0.06)], [V(MX + 0.03, 0, -MZ - 0.06), V(MX + 0.06, MAPY + 0.006, MZ + 0.06)]] as [THREE.Vector3, THREE.Vector3][]) b.add(boxGeo(a, c), brass);
  // ---------------- tiny London ----------------
  const [LX, LZ] = GEO.proj(-0.13, 51.5);
  { const stone = lam("wmLondonStone", () => ({ color: "#d8cdb6" })), roofG = lam("wmLondonRoof", () => ({ color: "#7a8296" }));
    b.add(boxGeo(V(LX - 0.06, MAPY, LZ - 0.075), V(LX - 0.04, MAPY + 0.1, LZ - 0.055)), stone); b.add(new THREE.ConeGeometry(0.016, 0.04, 4).rotateY(Math.PI / 4).translate(LX - 0.05, MAPY + 0.12, LZ - 0.065), roofG); // clock tower
    b.add(new THREE.PlaneGeometry(0.014, 0.014).translate(LX - 0.05, MAPY + 0.085, LZ - 0.0545), lam("wmClockFace", () => ({ color: "#f6f1e0" })));
    b.add(new THREE.CylinderGeometry(0.022, 0.024, 0.03, 12).translate(LX + 0.06, MAPY + 0.015, LZ - 0.06), stone); b.add(new THREE.SphereGeometry(0.022, 12, 8, 0, TAU, 0, Math.PI / 2).translate(LX + 0.06, MAPY + 0.03, LZ - 0.06), roofG); // dome
    for (let k = 0; k < 9; k++) { const x = LX - 0.1 + (k % 5) * 0.045, z = LZ - 0.13 + Math.floor(k / 5) * 0.05 + (k % 2) * 0.01; b.add(boxGeo(V(x, MAPY, z), V(x + 0.03, MAPY + 0.02 + (k % 3) * 0.008, z + 0.025)), lam("wmLondonHouse" + (k % 3), () => ({ color: ["#c8735a", "#d8cdb6", "#b8a088"][k % 3] }))); }
    const lb = tinyBridge(root, 0.09, { W: 0.016, H: 0.013, lamps: false }); lb.position.set(LX + 0.01, MAPY, LZ + 0.01); lb.rotation.y = Math.PI / 2 - 0.1; }
  // ---------------- the toy canal ----------------
  const canal = new THREE.Group(); canal.position.set(A[0], MAPY, A[1]); canal.rotation.y = Math.atan2(-CD.z, CD.x); add(canal);
  const HW = 0.23, WT = 0.1, WHt = 0.12, Lc = CD.L;
  const conc = lam("wmCanalConc", () => ({ map: concreteTex() }));
  { const cb = new Batch();
    for (const s of [-1, 1]) cb.add(boxGeo(V(-0.25, 0, s > 0 ? HW : -HW - WT), V(Lc + 0.25, WHt, s > 0 ? HW + WT : -HW)), conc);
    cb.add(boxGeo(V(-0.25, 0, -HW), V(Lc + 0.25, 0.004, HW)), lam("wmCanalBed", () => ({ color: "#1e4a6a" })));
    // gate piers + catwalk bridges at both gates, lock houses on the west bank, bollards and lamps
    for (const gs of [G1, G2]) { for (const s of [-1, 1]) cb.add(boxGeo(V(gs - 0.07, 0, s > 0 ? HW - 0.01 : -HW - WT - 0.03), V(gs + 0.07, WHt + 0.03, s > 0 ? HW + WT + 0.03 : -HW + 0.01)), conc);
      tinyHouse(cb, gs + 0.02, HW + WT + 0.12, 0.12, 0.09, 0.07, 2, Math.PI / 2); }
    for (let k = 0; k < 7; k++) { const s = 0.0 + k * (Lc / 6); for (const sd of [-1, 1]) cb.add(new THREE.CylinderGeometry(0.008, 0.01, 0.025, 8).translate(s, WHt + 0.012, sd * (HW + 0.03)), lam("wmBollard", () => ({ color: "#2c2a38" }))); }
    // jungle hills on the west bank (away from the boss's lane)
    const hill = lam("wmHill", () => ({ color: "#6aa84e" })), hill2 = lam("wmHill2", () => ({ color: "#5a9a44" }));
    for (let k = 0; k < 9; k++) { const s = -0.1 + k * 0.24, d = HW + WT + 0.3 + (k % 3) * 0.12; cb.add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2).scale(0.16 + (k % 2) * 0.05, 0.07 + (k % 3) * 0.02, 0.13), k % 2 ? hill : hill2, new THREE.Matrix4().makeTranslation(s, 0, d)); }
    for (let k = 0; k < 10; k++) tinyPalm(cb, -0.05 + k * 0.2, HW + WT + 0.08 + (k % 2) * 0.05, 0.08);
    cb.build(canal); }
  const water = (s0: number, s1: number, y: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s1 - s0, 2 * HW).rotateX(-Math.PI / 2), phong("wmCanalWater", { color: "#4aa8d8", emissive: "#1a4a7a", emissiveIntensity: 0.35, specular: "#ffffff", shininess: 140, transparent: true, opacity: 0.7 })); m.position.set((s0 + s1) / 2, y, 0); noink(m); canal.add(m); return m; };
  const waters = [water(-0.25, G1, LV_LO), water(G1, G2, LV_HI), water(G2, Lc + 0.25, LV_LO)];
  for (const gs of [G1, G2]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(2 * HW, LV_HI - LV_LO).rotateY(gs === G1 ? -Math.PI / 2 : Math.PI / 2), phong("wmCanalWater", { color: "#4aa8d8" })); st.position.set(gs, (LV_LO + LV_HI) / 2, 0); noink(st); canal.add(st); }
  // mitre gates: leaves hinged at the walls; gate 1 points downstream (+s) closed, both open into the chamber
  const gateM = lam("wmGate", () => ({ color: "#2f5a7a" })), gateTop = lam("wmGateTop", () => ({ color: "#f2c230" }));
  const leafLen = HW / Math.cos(0.33);
  const gates: { g: THREE.Group; c: number; o: number }[][] = [[], []];
  [G1, G2].forEach((gs, gi) => { for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(gs, 0, s * HW); canal.add(lg);
    const dir = s > 0 ? -1 : 1; // leaf runs from the hinge toward the axis
    mesh(lg, boxGeo(V(-0.011, 0.004, dir > 0 ? 0 : -leafLen), V(0.011, WHt + 0.01, dir > 0 ? leafLen : 0)), gateM);
    mesh(lg, boxGeo(V(-0.02, WHt + 0.01, dir > 0 ? 0 : -leafLen), V(0.02, WHt + 0.024, dir > 0 ? leafLen : 0)), gateTop, undefined, false);
    for (let q = 1; q < 4; q++) mesh(lg, boxGeo(V(-0.013, 0.02 + q * 0.028, dir > 0 ? 0 : -leafLen), V(0.013, 0.028 + q * 0.028, dir > 0 ? leafLen : 0)), gateTop, undefined, false);
    const c = gi === 0 ? (s > 0 ? -0.33 : 0.33) : (s > 0 ? 0.33 : -0.33), o = gi === 0 ? (s > 0 ? -Math.PI / 2 + 0.05 : Math.PI / 2 - 0.05) : (s > 0 ? Math.PI / 2 - 0.05 : -Math.PI / 2 + 0.05);
    gates[gi].push({ g: lg, c, o });
  } });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false, opacity: 0 })); spill.position.set(G2 + 0.12, LV_LO + 0.003, 0); spill.rotation.y = -Math.PI / 2; noink(spill); canal.add(spill);
  // ---------------- the harbour (Los Angeles) ----------------
  { const hx = -2.95, hz = -0.45, shed = lam("wmShed", () => ({ color: "#c8b088" })), shedRoof = lam("wmShedRoof", () => ({ color: "#8a4a3a" })), pier = lam("wmPier", () => ({ color: "#8a6a4a" }));
    for (const [x, z] of [[hx + 0.12, hz - 0.08], [hx + 0.32, hz + 0.02]]) { b.add(boxGeo(V(x - 0.08, MAPY, z - 0.05), V(x + 0.08, MAPY + 0.07, z + 0.05)), shed); b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 3, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.5, 1).translate(x, MAPY + 0.07, z), shedRoof); }
    for (const z of [hz - 0.15, hz + 0.25]) { b.add(boxGeo(V(hx - 0.42, MAPY, z - 0.025), V(hx - 0.05, MAPY + 0.025, z + 0.025)), pier); for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 5).translate(hx - 0.4 + k * 0.1, MAPY + 0.012, z + 0.03), pier); }
    // a toy dockside crane (lattice look from bars)
    const crane = lam("wmCrane", () => ({ color: "#e8b030" })), cx = hx - 0.02, cz = hz + 0.45;
    for (const [a, c] of [[V(cx - 0.04, MAPY, cz - 0.04), V(cx - 0.04, MAPY + 0.3, cz - 0.04)], [V(cx + 0.04, MAPY, cz - 0.04), V(cx + 0.04, MAPY + 0.3, cz - 0.04)], [V(cx - 0.04, MAPY, cz + 0.04), V(cx - 0.04, MAPY + 0.3, cz + 0.04)], [V(cx + 0.04, MAPY, cz + 0.04), V(cx + 0.04, MAPY + 0.3, cz + 0.04)],
      [V(cx + 0.06, MAPY + 0.3, cz), V(cx - 0.36, MAPY + 0.32, cz)], [V(cx - 0.04, MAPY + 0.1, cz - 0.04), V(cx + 0.04, MAPY + 0.2, cz + 0.04)]] as [THREE.Vector3, THREE.Vector3][]) seg(b, a, c, 0.008, crane, 5);
    b.add(boxGeo(V(cx - 0.05, MAPY + 0.3, cz - 0.04), V(cx + 0.08, MAPY + 0.36, cz + 0.04)), lam("wmCraneCab", () => ({ color: "#2f6ab8" })));
    seg(b, V(cx - 0.3, MAPY + 0.31, cz), V(cx - 0.3, MAPY + 0.16, cz), 0.002, lam("wmCable", () => ({ color: "#2c2a38" })), 4);
    // a little lighthouse on the breakwater
    b.add(lathe([[0.03, 0], [0.022, 0.16], [0, 0.16]], 12).translate(hx - 0.48, MAPY, hz + 0.75), lam("wmLight", () => ({ color: "#f6f1e6" }))); b.add(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 12).translate(hx - 0.48, MAPY + 0.05, hz + 0.75), lam("wmLightBand", () => ({ color: "#d8362a" })));
    glow(root, [hx - 0.48, MAPY + 0.17, hz + 0.75], "#fff0b0", 0.12, 0.8); }
  // ---------------- the toy town in the desert + the tiny bridge (on dry sand) ----------------
  const tb = new Batch();
  const TOWN: [number, number][] = [[-1.2, -1.25], [-1.05, -1.3], [-0.9, -1.22], [-1.25, -1.05], [-0.95, -1.0], [-0.8, -1.12], [-1.12, -0.88], [-0.84, -0.86]];
  TOWN.forEach(([x, z], i) => tinyHouse(tb, x, z, 0.09, 0.07, 0.035, i));
  for (let k = 0; k < 10; k++) tinyCactus(tb, -1.6 + r() * 1.0, -1.9 + r() * 0.35, 0.05 + r() * 0.03, k);
  for (const [x, z] of [[-1.32, -1.2], [-0.72, -1.0], [-1.0, -0.75]] as [number, number][]) tinyPalm(tb, x, z, 0.1);
  { const wx = -0.7, wz = -1.38; for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.78; seg(tb, V(wx + Math.cos(a) * 0.035, MAPY, wz + Math.sin(a) * 0.035), V(wx + Math.cos(a) * 0.02, MAPY + 0.13, wz + Math.sin(a) * 0.02), 0.004, lam("wmTowerLeg", () => ({ color: "#5a5a66" })), 4); }
    tb.add(new THREE.SphereGeometry(0.045, 14, 10).scale(1, 0.8, 1).translate(wx, MAPY + 0.16, wz), lam("wmTower", () => ({ color: "#e8e4dc" }))); }
  tb.build(root);
  const townFlags = [[-1.4, -0.92], [-1.38, -1.4], [-0.66, -1.25], [-0.62, -0.9], [-1.0, -1.45]].map(([x, z]) => { const f = lotFlag(root, 0.08); f.g.position.set(x, MAPY, z); return f; });
  const toyBr = tinyBridge(root, 0.42, { W: 0.065, H: 0.06 }); toyBr.position.set(-1.1, MAPY, -1.6); toyBr.rotation.y = 0.35;
  // ---------------- the toy ship, its foam, the truck, the cargo ----------------
  const ship = toyShip(root, 1.2); ship.crates.visible = false;
  const shipFx = new THREE.Group(); add(shipFx);
  const bowFoam = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false, opacity: 0.85 })); bowFoam.rotation.y = -Math.PI / 2; bowFoam.position.set(0.55, 0.006, 0); noink(bowFoam); shipFx.add(bowFoam);
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: wakeTex(), transparent: true, depthWrite: false, opacity: 0.8 })); wake.rotation.y = Math.PI / 2; wake.position.set(-1.05, 0.005, 0); noink(wake); shipFx.add(wake);
  const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, depthWrite: false, opacity: 0.5 })); noink(m); shipFx.add(m); return m; });
  const truck = toyTruck(root, 1.0);
  const TR0: P2 = [-2.6, -0.98], TR1: P2 = [-1.85, -1.08];
  const crates = Array.from({ length: 11 }, (_, i) => { const g = new THREE.Group(); add(g); stoneBlock(g, 0.085 * 1.2, i); return g; });
  const shipSlots: THREE.Vector3[] = [], truckSlots: THREE.Vector3[] = [];
  { const L = 1.2, D = 0.14 * L, s = 0.085 * L; for (const cx of [-0.2, -0.08, 0.04, 0.16]) for (const cz of [-0.06, 0.06]) shipSlots.push(V(-0.02 * L + cx * L, D + 0.013 * L, cz * L)); for (const cx of [-0.14, 0.0, 0.12]) shipSlots.push(V(-0.02 * L + cx * L, D + 0.013 * L + s * 0.62, 0));
    for (const cx of [-0.3, -0.18, -0.06, 0.06]) for (const cz of [-0.07, 0.07]) truckSlots.push(V(cx, 0.025, cz)); for (const cx of [-0.24, -0.12, 0.0]) truckSlots.push(V(cx, 0.025 + s * 0.62, 0)); }
  // ---------------- dressing: racks of rolled maps, drafting table, globe, bin, clock, benches ----------------
  const walnut = phong("wmWalnut", { color: "#6a3c22", specular: "#ffd0a0", shininess: 30 }), walnutD = phong("wmWalnutD", { color: "#46261a", specular: "#ffd0a0", shininess: 25 });
  const rollCols = ["#efe2c4", "#e6d2a8", "#d8c8a0", "#c8d8e0", "#f2e6cc", "#e8d0b0"];
  { const x0 = HX0 + 0.05, depth = 0.6; // pigeonhole rack on the west wall z -4..4
    b.add(boxGeo(V(x0, 0, -4.2), V(x0 + depth, 2.6, -4.1)), walnut); b.add(boxGeo(V(x0, 0, 4.1), V(x0 + depth, 2.6, 4.2)), walnut);
    for (let k = 0; k <= 5; k++) b.add(boxGeo(V(x0, 0.1 + k * 0.5, -4.2), V(x0 + depth, 0.14 + k * 0.5, 4.2)), walnut);
    for (let z = -4.2; z <= 4.2; z += 0.6) b.add(boxGeo(V(x0 + depth - 0.04, 0.1, z - 0.02), V(x0 + depth, 2.6, z + 0.02)), walnutD);
    for (let row = 0; row < 5; row++) for (let z = -4.05; z < 4.1; z += 0.13) { if (r() < 0.15) continue; const y = 0.2 + row * 0.5 + r() * 0.12, len = 0.55 + r() * 0.35;
      b.add(new THREE.CylinderGeometry(0.05, 0.05, len, 10).rotateZ(Math.PI / 2).translate(x0 + len / 2 - 0.02, y, z + (r() - 0.5) * 0.02), lam("wmRoll" + (Math.floor(r() * 6)), () => ({ color: rollCols[Math.floor(r() * 6) % 6] }))); } }
  { const bx = -8.3, bz = 3.0; b.add(lathe([[0, 0], [0.32, 0], [0.34, 0.75], [0.3, 0.75], [0, 0.05]], 16).translate(bx, 0, bz), lam("wmBin", () => ({ color: "#8a5a34" })));
    for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, d = 0.15 + (k % 2) * 0.06; seg(b, V(bx + Math.cos(a) * d * 0.5, 0.05, bz + Math.sin(a) * d * 0.5), V(bx + Math.cos(a) * d, 1.3 + (k % 3) * 0.18, bz + Math.sin(a) * d), 0.045, lam("wmRoll" + (k % 6), () => ({ color: rollCols[k % 6] })), 10); } }
  // drafting table (east edge of the map) + stool + swing lamp
  const DTX = 8.4, DTZ = 2.2;
  const dLamp = new THREE.PointLight("#ffd08a", 3, 3.5, 1.2);
  { const dg = new THREE.Group(); dg.position.set(DTX, 0, DTZ); dg.rotation.y = 0.35 + Math.PI / 2; add(dg); const db = new Batch();
    for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) db.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.9, z + 0.04)), walnut);
    db.add(boxGeo(V(-0.75, 0.3, -0.45), V(0.75, 0.34, 0.45)), walnutD);
    const board = new THREE.Group(); board.position.set(0, 0.95, 0); board.rotation.x = -0.35; dg.add(board);
    mesh(board, boxGeo(V(-0.8, -0.02, -0.5), V(0.8, 0.02, 0.5)), walnut);
    mesh(board, new THREE.PlaneGeometry(1.1, 0.75).rotateX(-Math.PI / 2).translate(0.05, 0.022, 0), lam("wmDraftM", () => ({ map: draftTex() })), undefined, false);
    mesh(board, boxGeo(V(-0.78, 0.022, 0.4), V(0.78, 0.04, 0.44)), lam("wmTsquare", () => ({ color: "#c9973e" })), undefined, false);
    mesh(board, new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6).rotateZ(Math.PI / 2).translate(-0.3, 0.03, 0.3), lam("wmPencil", () => ({ color: "#f2c230" })), undefined, false);
    db.build(dg);
    // stool
    const sb = new Batch(); for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; seg(sb, V(0, 0.68, 0.75), V(Math.cos(a) * 0.22, 0, 0.75 + Math.sin(a) * 0.22), 0.018, walnutD, 6); } sb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 18).translate(0, 0.7, 0.75), lam("wmStoolTop", () => ({ color: "#2f6a5a" }))); sb.build(dg);
    // swing-arm lamp clamped to the board's top edge
    const lb = new Batch(); seg(lb, V(0.75, 1.15, -0.45), V(0.6, 1.6, -0.2), 0.012, brass, 6); seg(lb, V(0.6, 1.6, -0.2), V(0.3, 1.5, 0.05), 0.012, brass, 6); lb.build(dg);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 16, 1, true).translate(0, -0.07, 0), phong("wmLampShade", { color: "#2f6a5a", specular: "#ffffff", shininess: 60, side: THREE.DoubleSide })); shade.position.set(0.3, 1.5, 0.05); shade.rotation.x = 0.3; dg.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.7, 1.1) })); bulb.position.set(0.3, 1.43, 0.07); noink(bulb); dg.add(bulb); glow(dg, [0.3, 1.43, 0.07], "#ffd890", 0.5, 0.8);
    dLamp.position.set(0.3, 1.3, 0.1); dg.add(dLamp); }
  // globe on a stand
  { const gx = 8.6, gz = -2.6; b.add(lathe([[0, 0], [0.3, 0], [0.3, 0.05], [0.05, 0.1], [0.04, 0.75], [0, 0.75]], 16).translate(gx, 0, gz), walnutD);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 28, 18), lam("wmGlobe", () => ({ map: ctex("wmGlobeT", 512, 256, (q, rr) => { q.fillStyle = "#3f8ac0"; q.fillRect(0, 0, 512, 256); q.fillStyle = "#d8d49a"; for (let k = 0; k < 14; k++) { q.beginPath(); q.ellipse(rr() * 512, 40 + rr() * 170, 20 + rr() * 50, 14 + rr() * 30, rr() * 3, 0, TAU); q.fill(); } q.strokeStyle = "rgba(255,255,255,0.3)"; for (let y = 32; y < 256; y += 32) { q.beginPath(); q.moveTo(0, y); q.lineTo(512, y); q.stroke(); } }) })));
    globe.position.set(gx, 1.08, gz); globe.rotation.z = 0.4; globe.castShadow = true; add(globe);
    b.add(new THREE.TorusGeometry(0.35, 0.012, 6, 40, Math.PI * 1.2).rotateZ(-1.2).translate(gx, 1.08, gz), brass); }
  // a long reference table with stacked maps (east wall) and benches along the south wall
  b.add(boxGeo(V(9.6, 0.82, -6.5), V(10.6, 0.88, 0.0)), walnut); for (const z of [-6.3, -0.2]) for (const x of [9.7, 10.5]) b.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.82, z + 0.04)), walnutD);
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(9.7, 0.88 + k * 0.03, -6.2 + (k % 2) * 0.1), V(10.45, 0.91 + k * 0.03, -5.0 + (k % 2) * 0.1)), lam("wmPaper" + (k % 3), () => ({ color: ["#efe2c4", "#d8e0e8", "#f2e6cc"][k % 3] })));
  for (const x of [-7, -2, 3, 8]) { b.add(boxGeo(V(x - 1.0, 0.42, HZ1 - 0.6), V(x + 1.0, 0.46, HZ1 - 0.15)), walnut); for (const s of [-0.9, 0.9]) b.add(boxGeo(V(x + s - 0.05, 0, HZ1 - 0.55), V(x + s + 0.05, 0.42, HZ1 - 0.2)), walnutD); }
  // wall clock on the east wall
  const clockG = new THREE.Group(); clockG.position.set(HX1 - 0.06, 4.2, 2.5); clockG.rotation.y = -Math.PI / 2; add(clockG);
  { const cb = new Batch(); cb.add(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 32).rotateX(Math.PI / 2), walnutD); cb.add(new THREE.TorusGeometry(0.5, 0.03, 6, 32).translate(0, 0, 0.055), brass); cb.build(clockG);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.48, 32), new THREE.MeshBasicMaterial({ map: dialTex("wmClock", "#f4ecd6"), color: new THREE.Color(0.9, 0.88, 0.82) })); face.position.z = 0.056; clockG.add(face); }
  const hands = new THREE.Group(); hands.position.z = 0.06; clockG.add(hands); const setClock = clockHands(hands, 0.44, 0.002);
  // a big framed chart on the east wall + a pull-down map on the south wall
  b.add(boxGeo(V(HX1 - 0.06, 2.9, -5.5), V(HX1, 5.6, -1.5)), lam("wmFrame", () => ({ color: "#c9973e" })));
  { const ch = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.5), lam("wmChartM", () => ({ map: ctex("wmChart", 1024, 672, (q, rr) => { q.fillStyle = "#e8dcc0"; q.fillRect(0, 0, 1024, 672); q.fillStyle = "#3f8ac0"; q.fillRect(30, 30, 964, 612); q.fillStyle = "#d8d49a"; for (let k = 0; k < 6; k++) { q.beginPath(); q.ellipse(100 + rr() * 820, 100 + rr() * 470, 60 + rr() * 140, 40 + rr() * 90, rr() * 3, 0, TAU); q.fill(); } q.strokeStyle = "rgba(255,255,255,0.35)"; q.lineWidth = 2; for (let x = 30; x < 1000; x += 80) { q.beginPath(); q.moveTo(x, 30); q.lineTo(x, 642); q.stroke(); } }) }))); ch.rotation.y = -Math.PI / 2; ch.position.set(HX1 - 0.065, 4.25, -3.5); add(ch); }
  // ---------------- lights: pendants over the map, window shafts, pools ----------------
  const pend: { L: THREE.PointLight; gl: THREE.Sprite; pool: THREE.Mesh; seed: number }[] = [];
  const pb = new Batch();
  const shadeM = phong("wmPendShade", { color: "#2f5a4a", specular: "#e8fff0", shininess: 70, side: THREE.DoubleSide }), shadeIn = lam("wmPendIn", () => ({ color: "#f6f1e0" }));
  for (const x of [-4.6, -1.3, 2.0, 5.2]) for (const z of [-3.1, 3.5]) {
    const y = 5.4; seg(pb, V(x, HH, z), V(x, y + 0.12, z), 0.01, lam("wmCord", () => ({ color: "#2c2a30" })), 4);
    pb.add(new THREE.CylinderGeometry(0.06, 0.42, 0.32, 24, 1, true).translate(x, y, z), shadeM); pb.add(new THREE.CylinderGeometry(0.058, 0.415, 0.3, 24, 1, true).translate(x, y - 0.005, z), shadeIn);
    pb.add(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12).translate(x, y + 0.18, z), brass);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 1.2) })); bulb.position.set(x, y - 0.1, z); noink(bulb); add(bulb);
    const gl = glow(root, [x, y - 0.12, z], "#ffd890", 1.4, 0.8);
    const L = new THREE.PointLight("#ffc880", 9, 9, 1.15); L.position.set(x, y - 0.3, z); add(L);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffbe70").multiplyScalar(0.32), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pool.position.set(x, MAPY + 0.004, z); noink(pool); add(pool);
    pend.push({ L, gl, pool, seed: x * 1.3 + z });
  }
  const winPatchM = new THREE.MeshBasicMaterial({ map: windowPatchTex(), color: new THREE.Color("#ffc890").multiplyScalar(0.42), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const winPatches = WINX.map((x) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(WW * 1.05, 4.6).rotateX(-Math.PI / 2), winPatchM); m.position.set(x + 0.4, 0.008, HZ0 + 2.7); m.rotation.y = -0.12; noink(m); add(m); return m; });
  const shafts = WINX.map((x) => shaft(root, [x, WY1 - 0.5, HZ0 - 0.1], [x + 0.6, 0, HZ0 + 4.8], WW * 0.9, "#ffcf98", 0.06));
  const winL = WINX.map((x) => { const L = new THREE.PointLight("#ffb878", 4, 8, 1.2); L.position.set(x, 4.0, HZ0 + 1.0); add(L); return L; });
  const dust = motes(root, [-9, 0.5, -7.5], [9, 6, -3.5], 140, "#ffe0b0", 0.03, 0.55, 5);

  shell.build(root, false); b.build(root); pb.build(root, false);
  void lamCustom; void twoTone; void puff; void risePuffs; void winL; void shafts; void townFlags;

  // ---------------- marks + cams ----------------
  const marks: Record<string, V3> = {
    bossStart: worldmapBoss(0),
    ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((k) => ["bossPush" + k, worldmapBoss(k / 6)])),
    bossLock1: worldmapBoss(SHIP_U.lock1), bossLock2: worldmapBoss(SHIP_U.lock2),
    london: [LX, MAPY, LZ], locks: [along((G1 + G2) / 2)[0], MAPY, along((G1 + G2) / 2)[1]], lock1: [along(G1)[0], MAPY, along(G1)[1]], lock2: [along(G2)[0], MAPY, along(G2)[1]],
    harbour: [-3.25, MAPY, -1.14], truckStart: [TR0[0], MAPY, TR0[1]], truckEnd: [TR1[0], MAPY, TR1[1]], bossTruckEnd: [TR1[0] - 0.72, MAPY, TR1[1] - 0.12],
    toyBridge: [-1.1, MAPY, -1.6], toyTown: [-1.02, MAPY, -1.1], drafting: [DTX - 0.8, 0, DTZ + 0.5],
  };
  const cams: SetDef["cams"] = {
    high: { pos: [-0.9, 10.6, 10.2], look: [-0.35, 0.0, -0.6], fov: 45 },
    london: { pos: [3.45, 1.55, 1.4], look: [2.5, 0.7, -1.55], fov: 38 },
    locks: { pos: [-1.35, 2.15, 4.45], look: [-0.95, 0.72, 0.85], fov: 40 },
    harbour: { pos: [-1.2, 1.75, 1.9], look: [-2.85, 0.75, -0.85], fov: 40 },
    town: { pos: [-0.9, 1.7, 2.6], look: [-1.75, 0.5, -1.2], fov: 42 },
    track: worldmapTrack(0.3),
    lowShip: { pos: [0.4, 0.35, 0.6], look: [1.3, 0.25, -0.75], fov: 36 },
  };
  const tmp = V(0, 0, 0);
  return {
    name: "worldmap", root, marks, cams,
    pose: (t, c) => {
      // ship
      const sp = worldmapShip(c.ship ?? 0);
      ship.g.position.set(...sp.pos); ship.g.rotation.set(0, sp.yaw, sp.pitch); ship.pose(t);
      shipFx.position.set(sp.pos[0], Math.max(MAPY, sp.pos[1] + 0.012), sp.pos[2]); shipFx.rotation.y = sp.yaw;
      rings.forEach((m, i) => { const u = (t * 0.45 + i / 3) % 1; m.position.set(0.5 - u * 0.3, 0.004, 0); m.scale.setScalar(0.25 + u * 0.7); (m.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - u); });
      (bowFoam.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.1 * Math.sin(t * 3); bowFoam.scale.set(1 + 0.05 * Math.sin(t * 4), 1, 1);
      // locks
      const lk = cl(c.locks ?? 0), k1 = sm(lk / 0.5), k2 = sm((lk - 0.5) / 0.5);
      gates[0].forEach((q) => (q.g.rotation.y = lerp(q.c, q.o, k1))); gates[1].forEach((q) => (q.g.rotation.y = lerp(q.c, q.o, k2)));
      (spill.material as THREE.MeshBasicMaterial).opacity = 0.8 * Math.sin(Math.PI * Math.min(1, k2 * 1.3)) + 0.2 * k2; spill.scale.set(1, 1, 0.9 + 0.1 * Math.sin(t * 5));
      waters.forEach((w, i) => (w.position.y = (i === 1 ? LV_HI : LV_LO) + 0.002 * Math.sin(t * 1.3 + i)));
      // truck + cargo
      const tk = sm(cl(c.truck ?? 0)), tx = lerp(TR0[0], TR1[0], tk), tz = lerp(TR0[1], TR1[1], tk);
      truck.g.position.set(tx, MAPY, tz); truck.g.rotation.y = Math.atan2(-(TR1[1] - TR0[1]), TR1[0] - TR0[0]);
      const dist = Math.hypot(tx - TR0[0], tz - TR0[1]); truck.wheels.forEach((w) => (w.rotation.z = -dist / 0.075));
      const cg = cl(c.cargo ?? ((c.truck ?? 0) > 0 ? 1 : 0));
      ship.g.updateMatrix(); truck.g.updateMatrix(); truck.bed.updateMatrix();
      crates.forEach((cr, i) => {
        const ki = sm(cl(cg * 1.6 - (i / crates.length) * 0.6));
        const a = shipSlots[i].clone().applyMatrix4(ship.g.matrix), bb = tmp.copy(truckSlots[i]).applyMatrix4(truck.bed.matrix).applyMatrix4(truck.g.matrix);
        cr.position.lerpVectors(a, bb, ki); cr.position.y += Math.sin(Math.PI * ki) * 0.35; cr.rotation.set(0, lerp(sp.yaw, truck.g.rotation.y, ki) + Math.sin(Math.PI * ki) * 0.6, 0);
      });
      // ambient
      pend.forEach(({ L, gl, pool, seed }) => { const f = 0.96 + 0.04 * Math.sin(t * 1.7 + seed); L.intensity = 9 * f; gl.material.opacity = 0.75 + 0.2 * f; (pool.material as THREE.MeshBasicMaterial).opacity = 0.9 + 0.1 * f; });
      shafts.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.06 + 0.012 * Math.sin(t * 0.4 + i)));
      winPatches.forEach((m) => (m.visible = true));
      dust.update(t); setClock(18 + 40 / 60 + t / 60, t);
    },
  };
};
WORLDMAP_SOLIDS.push(
  [[HX0, 0, HZ0 - 0.5], [HX1, HH, HZ0 + 0.3]], [[HX0, 0, HZ1 - 0.6], [HX1, HH, HZ1]], [[HX0, 0, HZ0], [HX0 + 0.7, HH, HZ1]], [[HX1 - 0.2, 0, HZ0], [HX1, HH, HZ1]],
  [[HX0, HH - 0.7, HZ0], [HX1, HH, HZ1]],
  [[7.5, 0, 1.1], [9.3, 1.9, 3.3]], [[8.2, 0, -3.0], [9.0, 1.5, -2.2]], [[-8.7, 0, 2.6], [-7.9, 1.8, 3.4]], [[9.5, 0, -6.6], [10.7, 1.1, 0.1]],
  ...[-4.6, -1.3, 2.0, 5.2].flatMap((x) => [-3.1, 3.5].map((z) => [[x - 0.45, 5.0, z - 0.45], [x + 0.45, HH, z + 0.45]] as [V3, V3])),
);
