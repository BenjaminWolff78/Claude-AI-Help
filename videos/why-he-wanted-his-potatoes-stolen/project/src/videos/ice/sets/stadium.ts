// St. Louis, August 1904: the world's-fair athletics stadium, start and finish of the marathon. A rust-red cinder
// track round a green infield, a long covered wooden grandstand (painted posts, pitched roof, railings, red-white-blue
// bunting swags, waving roof pennants, invented banners) packed with a cartoon crowd (instanced bean heads + hats that
// wave handkerchiefs), a brass band on the infield, a back-straight bleacher, the MARATHON GATE (a stone tunnel where
// the course leaves and returns), and behind it all white world's-fair palaces with domes and towers, a Ferris wheel,
// trees, puffy clouds and a drifting hot-air balloon.
//
// LAYOUT (set-local metres, ground y = 0). The track centre line is a stadium shape: straights along x (-50..50),
// bends of radius 30 round (+-50, 0, -30). Track width 9: the HOME STRAIGHT is z -4.5..4.5, the infield is -z.
//   Apron (packed sand) z 4.5..10.2 along the home straight. Grandstand x -44..28 (front wall z 10.2, rows z 10.6..21.6,
//   roof eave y 7.6 at z 9.4, ridge y 10.9 at z 16). East wall z 10.2..10.6 from x 28 to 60, then the GATEHOUSE
//   x 60..66 (tunnel opening z -1..5, 7.2 m high); the dusty course road leaves through it toward +x.
//   START (east end of the home straight): chalk line at x = 34, runners face +x (toward the gate).
//     starter's stand on the apron [34.9, 0, 6.9] (top y 1.0); the COURSE MAP board on two posts in front of the east
//     wall (face z 9.75, x 39.4..44.6, y 1.0..7.0); the THERMOMETER post [49, 0, 9.0] (4.6 m); the ORGANIZER'S TABLE
//     under a striped umbrella [55, 0, 7.4].
//   FINISH (middle of the home straight, in front of the centre of the stand): tape at x = -8 (runners arrive from +x,
//     moving -x); FINISH banner gantry above (y 4.3..5.5, poles at z -6 / 6.2); timekeepers' table [-3.6, 0, 7.6];
//     medal table [-13.5, 0, 7.8]; podium [-17.6, 0, 7.4]; carPark on the infield grass [-12, 0, -10.5] (clear area
//     x -14.2..-9.8, z -11.6..-9.4, the car is built elsewhere); brass band on the infield [16, 0, -16].
// CTL (pose c):
//   c.smoke 0..1     starter's pistol: 0 = nothing, then one puff lifecycle (flash at 0..0.08, biggest ~0.35, gone at 1)
//   c.wellGlow 0..1  the well icon on the map glows + pulses (gold ring + halo)
//   c.temp 0..1      thermometer mercury: 0 = 50 deg, 1 = 90 deg (default 1); heat glow + shimmer at the top when > 0.6
//   c.tape 0..1      finish tape: 0 = intact, the tape breaks in the middle and the two ends flutter down (1 = on the ground)
//   c.confetti 0..1  payoff: confetti, thrown hats and streamers rain over the finish (amount; they loop with t)
//   c.crowd 0..1     crowd cheering: arms + handkerchiefs up, jumping (default 0.15 = idle waving)
// AMBIENT: roof pennants + flags wave, bunting swags + valances sway, crowd idles, balloon drifts, Ferris wheel turns,
//   birds circle, band bobs and its brass glints, string bulbs twinkle, clocks tick, heat shimmer over the track.
// EXPORTS: stadium (SetDef), STADIUM_SOLIDS, STADIUM_WELL (world-space centre of the well icon on the map board, the
//   camera's push-in target; the icon is 0.56 m across, facing -z).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "../build";
import { ctex, rng, roofHD, beamHD, grassHD, cloudHD, stoneHD } from "../paint";
import { glow } from "../setkit";
import { cl, TAU, fitText, stringLights, twinkle, sparkles, sparkle } from "./portkit_common";
import { leafTex, birds, roundTree, boardsH, boardsV } from "./innerkit_b";
import { cloth, wave, bunting, flutter, type Cloth, type Bunting } from "./towerkit";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import type { SetDef, V3 } from "./types";
import { autocar } from "./autocar";
/** Lorz's parked motor car on the infield (faces -x, its passenger side toward +z); seat tops for cards in mode "sit" */
export const STADIUM_CAR_SEATS = { front: [-12.4, 1.05, -10.2] as V3, driver: [-12.4, 1.05, -10.8] as V3 };

// ---------------- layout ----------------
const SX = 50, BR = 30, HW = 4.5, BZ = -30;            // straights, bend radius, half track width, bend centre z
const FR = 10.2, GS0 = -44, GS1 = 28, ROW0 = 10.6, NROW = 11, ROWD = 1.0, RISE = 0.45, STEP0 = 1.1;
const EAVE_Y = 7.6, EAVE_Z = 9.4, RIDGE_Y = 10.9, RIDGE_Z = 16, BACK_Z = 22.0, BACK_Y = 8.3;
const START_X = 34, FIN_X = -8;
const MAP_C: V3 = [42, 0, 9.75], MAP_W = 5.2, MAP_H = 6.0, MAP_Y0 = 1.0;
const THERMO: V3 = [46.8, 0, 9.4], TABLE: V3 = [49.4, 0, 7.2], STARTER: V3 = [34.9, 0, 6.9];
const TIMEK: V3 = [-3.6, 0, 7.6], MEDAL: V3 = [-13.5, 0, 7.8], PODIUM: V3 = [-17.6, 0, 7.4], CARPARK: V3 = [-12, 0, -10.5];
const BAND: V3 = [16, 0, -16], GATE_X = 60;
// well icon: fraction of the board (u from left, v from top) -> world
const WELL_UV: [number, number] = [0.56, 0.3], WELL_S = 0.56;
export const STADIUM_WELL: V3 = [MAP_C[0] + MAP_W / 2 - WELL_UV[0] * MAP_W, MAP_Y0 + MAP_H * (1 - WELL_UV[1]), MAP_C[2] - 0.06];
const box3 = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): [V3, V3] => [[x0, y0, z0], [x1, y1, z1]];
export const STADIUM_SOLIDS: [V3, V3][] = [
  box3(GS0, 0, FR, GS1, 11.2, BACK_Z + 0.6),                 // grandstand + roof (front posts at z 10.35)
  box3(GS1, 0, FR, GATE_X, 3.4, 10.8),                         // east wall
  box3(GATE_X, 0, -6, GATE_X + 6, 9.5, -1), box3(GATE_X, 0, 5, GATE_X + 6, 9.5, 10.8), box3(GATE_X, 7.2, -1, GATE_X + 6, 9.5, 5), // gatehouse
  box3(MAP_C[0] - 2.8, 0, 9.6, MAP_C[0] + 2.8, 7.6, 10.2),   // map board + posts
  box3(THERMO[0] - 0.55, 0, THERMO[2] - 0.35, THERMO[0] + 0.55, 5.6, THERMO[2] + 0.45),
  box3(TABLE[0] - 1.0, 0, TABLE[2] - 1.4, TABLE[0] + 2.4, 2.9, TABLE[2] + 1.95),       // umbrella canopy (table under it)
  box3(STARTER[0] - 0.75, 0, STARTER[2] - 0.75, STARTER[0] + 1.6, 2.1, STARTER[2] + 0.75),
  box3(FIN_X - 0.2, 0, -6.2, FIN_X + 0.2, 5.7, -5.8), box3(FIN_X - 0.2, 0, 5.9, FIN_X + 0.2, 5.7, 6.4), box3(FIN_X - 0.15, 4.2, -6.2, FIN_X + 0.15, 5.6, 6.4), // gantry + banner
  box3(FIN_X - 0.12, 0, -5.25, FIN_X + 0.12, 1.5, -4.95), box3(FIN_X - 0.12, 0, 4.95, FIN_X + 0.12, 1.5, 5.25),          // tape posts
  box3(TIMEK[0] - 1.3, 0, TIMEK[2] - 0.5, TIMEK[0] + 1.3, 1.7, TIMEK[2] + 0.5),
  box3(MEDAL[0] - 0.8, 0, MEDAL[2] - 0.45, MEDAL[0] + 0.8, 1.4, MEDAL[2] + 0.45),
  box3(PODIUM[0] - 0.7, 0, PODIUM[2] - 0.55, PODIUM[0] + 0.7, 0.45, PODIUM[2] + 0.55),
  box3(BAND[0] - 3.6, 0, BAND[2] - 3.6, BAND[0] + 3.6, 4.6, BAND[2] + 3.6),
  box3(-44, 0, -79, 44, 7, -68.3),                             // back bleacher + wall
  box3(-30, 0, 120, 14, 70, 210),                              // festival hall (dome)
];

// ---------------- materials ----------------
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
const col = (c: string) => lam("stdC" + c, () => ({ color: c }));
const tx = (key: string, t: () => THREE.Texture) => lam("stdT" + key, () => ({ map: t() }));
const cut = (key: string, t: () => THREE.Texture) => mat("stdCut" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: t(), alphaTest: 0.5, side: THREE.DoubleSide })));
const ds = (key: string, t: () => THREE.Texture) => mat("stdDs" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: t(), side: THREE.DoubleSide })));
const shiny = (key: string, color: string, sh = 60) => mat("stdSh" + key, () => twoTone(new THREE.MeshPhongMaterial({ color, specular: "#ffffff", shininess: sh })));
/** sign faces: unlit so they read under any sun direction (setkit note); k dims them a little */
const unlit = (key: string, t: () => THREE.Texture, k = 0.96, alpha = false) => mat("stdUl" + key, () => new THREE.MeshBasicMaterial({ map: t(), color: new THREE.Color(k, k, k), alphaTest: alpha ? 0.5 : 0, side: alpha ? THREE.DoubleSide : THREE.FrontSide }));
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const scaleUV = <G extends THREE.BufferGeometry>(geo: G, su: number, sv: number) => { const uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
const rodGeo = (a: V3, c: V3, r: number, seg = 6) => {
  const A = V(...a), C = V(...c), geo = new THREE.CylinderGeometry(r, r, A.distanceTo(C), seg);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize())); return geo.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2);
};
/** quad in the plane z facing -z (toward the track), uv left->right as seen from -z */
const faceZ = (x0: number, x1: number, y0: number, y1: number, z: number, u0 = 0, u1 = 1) => quad(V(x1, y0, z), V(x0, y0, z), V(x0, y1, z), V(x1, y1, z), u1, 1, u0, 0);
const SERIF = "900 %spx Georgia, 'Times New Roman', serif", ITAL = "italic 700 %spx Georgia, serif";
const INK = "#3a2418";
/** centred text panel (always fits): bg, border, outline */
const textTex = (key: string, text: string, w: number, h: number, bg: string | null, fg: string, o: { font?: string; size?: number; border?: string; shadow?: string } = {}) => ctex("stdTxt|" + key, w, h, (g, r) => {
  if (bg) {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) blot(g, r() * w, r() * h, h * (0.3 + r() * 0.5), r() < 0.5 ? "rgba(255,250,235,0.12)" : "rgba(90,60,40,0.08)");
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0.1)"); gr.addColorStop(1, "rgba(0,0,0,0.12)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = Math.max(4, h * 0.05); g.strokeRect(h * 0.09, h * 0.09, w - h * 0.18, h - h * 0.18); }
  g.textAlign = "center"; g.textBaseline = "middle";
  const lines = text.split("\n"), size = (o.size ?? 0.6) * h / lines.length;
  lines.forEach((l, i) => {
    const y = h / 2 + (i - (lines.length - 1) / 2) * size * 1.12 + size * 0.05;
    if (o.shadow) { g.fillStyle = o.shadow; fitText(g, l, w / 2 + size * 0.05, y + size * 0.05, w * 0.84, size, o.font ?? SERIF); }
    g.fillStyle = fg; fitText(g, l, w / 2, y, w * 0.84, size, o.font ?? SERIF);
  });
});

// ---------------- painted textures ----------------
/** rust-red cinders: grain specks, rake lines, spike prints (1024 px = 4 m) */
const cinderTex = () => ctex("stdCinder", 1024, 1024, (g, r) => {
  g.fillStyle = "#a8473a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26; i++) blot(g, r() * 1024, r() * 1024, 80 + r() * 200, r() < 0.5 ? "rgba(200,104,80,0.35)" : "rgba(120,48,44,0.3)");
  g.lineWidth = 2; for (let y = 6; y < 1024; y += 11 + r() * 6) { g.strokeStyle = r() < 0.5 ? "rgba(120,52,38,0.22)" : "rgba(230,150,110,0.2)"; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + (r() - 0.5) * 3); g.stroke(); }
  for (let i = 0; i < 5200; i++) { const s = 1 + r() * 3; g.fillStyle = ["#7e3426", "#d27a5a", "#5e2a24", "#e8a07a", "#9a4632"][Math.floor(r() * 5)]; g.fillRect(r() * 1024, r() * 1024, s, s); }
  for (let k = 0; k < 14; k++) { // spike prints in pairs
    const x = r() * 1024, y = r() * 1024; g.fillStyle = "rgba(110,46,34,0.35)";
    g.beginPath(); g.ellipse(x, y, 13, 6, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 46, y + 20, 13, 6, 0, 0, TAU); g.fill();
  }
});
/** packed sand apron with grit and scuffs */
const sandTex = () => ctex("stdSand", 1024, 1024, (g, r) => {
  g.fillStyle = "#dcc596"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 22; i++) blot(g, r() * 1024, r() * 1024, 90 + r() * 180, r() < 0.5 ? "rgba(240,222,180,0.4)" : "rgba(170,140,96,0.22)");
  for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,118,80,0.5)" : "rgba(250,240,214,0.5)"; g.fillRect(r() * 1024, r() * 1024, 2, 2); }
  g.strokeStyle = "rgba(160,128,88,0.25)"; g.lineWidth = 3; for (let i = 0; i < 18; i++) { const x = r() * 1024, y = r() * 1024; g.beginPath(); g.arc(x, y, 20 + r() * 50, r() * 3, r() * 3 + 1.4); g.stroke(); }
});
/** dusty course road */
const roadTex = () => ctex("stdRoad", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9b47a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26; i++) blot(g, r() * 1024, r() * 1024, 80 + r() * 160, r() < 0.5 ? "rgba(240,214,160,0.45)" : "rgba(160,118,70,0.25)");
  g.strokeStyle = "rgba(140,100,60,0.35)"; g.lineWidth = 10; for (const x of [330, 690]) { g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 1024; y += 64) g.lineTo(x + Math.sin(y * 0.02) * 8, y); g.stroke(); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,100,64,0.5)" : "rgba(255,240,206,0.5)"; g.fillRect(r() * 1024, r() * 1024, 3, 2); }
});
/** red-white-blue bunting swag (half-moon drape with pleats + stars), alpha outside */
const swagTex = () => ctex("stdSwag", 512, 192, (g) => {
  const W = 512, path = (k: number) => { g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.quadraticCurveTo(W * 0.5, 2 * 186 * k, 0, 0); g.closePath(); };
  path(1); g.fillStyle = "#c8352e"; g.fill();
  path(0.78); g.fillStyle = "#f6f0e2"; g.fill();
  path(0.5); g.fillStyle = "#2b4f9a"; g.fill();
  g.save(); path(1); g.clip();
  for (let x = 16; x < W; x += 38) { const gr = g.createLinearGradient(x - 16, 0, x + 16, 0); gr.addColorStop(0, "rgba(40,20,40,0)"); gr.addColorStop(0.5, "rgba(40,20,40,0.2)"); gr.addColorStop(1, "rgba(255,255,255,0.12)"); g.fillStyle = gr; g.fillRect(x - 16, 0, 32, 192); }
  g.fillStyle = "#ffffff"; for (let x = 60; x < W - 40; x += 56) { const y = 26 + 40 * Math.sin((x / W) * Math.PI); star(g, x, y, 9); }
  g.restore();
  g.strokeStyle = "#7a1e22"; g.lineWidth = 4; path(1); g.stroke();
});
const star = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
/** rosette medallion (post tops) */
const rosetteTex = () => ctex("stdRosette", 256, 256, (g) => {
  for (const [r0, c] of [[124, "#c8352e"], [100, "#f6f0e2"], [74, "#2b4f9a"], [36, "#f2c84a"]] as [number, string][]) {
    g.fillStyle = c; g.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU, rr = r0 * (1 - 0.06 * (i % 2)); g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); } g.fill();
  }
  g.fillStyle = "#ffffff"; star(g, 128, 128, 22);
});
/** advert panels for the grandstand front wall (4 invented ads in a 4x1 atlas) */
const advertTex = () => ctex("stdAdverts", 2048, 384, (g, r) => {
  const ads: [string, string, string, string][] = [["ZING!", "GINGER POP", "#2f6b4f", "#f6e7b8"], ["HARTWELL'S", "FINE HATS", "#7a2a3a", "#f2d27a"], ["GOLDEN GRAIN", "FLAKES", "#2b4f9a", "#ffffff"], ["FAIRGROUND", "ICE CREAM", "#c86a2c", "#fff4dc"]];
  ads.forEach(([a, b, bg, fg], i) => {
    const x0 = i * 512; g.fillStyle = bg; g.fillRect(x0, 0, 512, 384);
    for (let k = 0; k < 5; k++) blot(g, x0 + r() * 512, r() * 384, 80 + r() * 100, "rgba(255,250,230,0.1)");
    g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(x0 + 18, 18, 476, 348);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    fitText(g, a, x0 + 256, 140, 420, 110, SERIF); fitText(g, b, x0 + 256, 262, 400, 70, ITAL);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x0, 0, 512, 6);
  });
});
/** stars-and-stripes flag (1904: 45 stars as dots) */
const usFlagTex = () => ctex("stdUSFlag", 380, 200, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f6f0e2" : "#c8352e"; g.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1); }
  g.fillStyle = "#2b4f9a"; g.fillRect(0, 0, 160, 108); g.fillStyle = "#ffffff";
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) if (!(y % 2 && x === 7)) { g.beginPath(); g.arc(12 + x * 19 + (y % 2) * 9, 11 + y * 17, 3.6, 0, TAU); g.fill(); }
});
/** long pennant (triangle, alpha outside) in one of 5 colours */
const PEN_COLS = ["#c8352e", "#2b4f9a", "#f2c84a", "#f6f0e2", "#2f8a5a"];
const pennantTex = (c: string) => ctex("stdPennant" + c, 512, 128, (g) => {
  g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.lineTo(512, 64); g.lineTo(0, 128); g.closePath(); g.fill();
  g.fillStyle = c === "#f6f0e2" ? "#c8352e" : "#ffffff"; g.beginPath(); g.moveTo(0, 50); g.lineTo(300, 64); g.lineTo(0, 78); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.15)"; g.fillRect(0, 0, 512, 10);
});
/** world's-fair palace facade: cream staff, two arcades, pilasters, frieze, cornice (1024 px = 16 m, 1152 = 18 m) */
const palaceTex = (tint: string) => ctex("stdPalace" + tint, 1024, 1152, (g, r) => {
  g.fillStyle = tint; g.fillRect(0, 0, 1024, 1152);
  for (let i = 0; i < 10; i++) blot(g, r() * 1024, r() * 1152, 120 + r() * 200, r() < 0.5 ? "rgba(255,252,240,0.25)" : "rgba(170,150,120,0.12)");
  const sh = "rgba(150,120,96,0.45)", lt = "rgba(255,255,250,0.7)";
  g.fillStyle = sh; g.fillRect(0, 120, 1024, 10); g.fillRect(0, 600, 1024, 14); g.fillStyle = lt; g.fillRect(0, 112, 1024, 8); g.fillRect(0, 590, 1024, 10);
  for (let k = 0; k < 16; k++) { g.fillStyle = "rgba(150,120,96,0.3)"; g.beginPath(); g.arc(32 + k * 64, 60, 18, 0, TAU); g.fill(); } // frieze medallions
  for (let k = 0; k < 4; k++) { // pilasters + arches, two storeys
    const x = k * 256;
    for (const [y0, y1, aw] of [[180, 560, 150], [660, 1110, 170]] as [number, number, number][]) {
      const cx = x + 128, top = y0 + aw / 2;
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, "#5a6a8a"); gr.addColorStop(1, "#3a3f5a"); g.fillStyle = gr;
      g.beginPath(); g.moveTo(cx - aw / 2, y1); g.lineTo(cx - aw / 2, top); g.arc(cx, top, aw / 2, Math.PI, 0); g.lineTo(cx + aw / 2, y1); g.closePath(); g.fill();
      g.strokeStyle = lt; g.lineWidth = 10; g.beginPath(); g.arc(cx, top, aw / 2 + 8, Math.PI, 0); g.stroke();
      g.strokeStyle = "rgba(240,236,224,0.8)"; g.lineWidth = 6; for (let yy = top; yy < y1; yy += 64) { g.beginPath(); g.moveTo(cx - aw / 2, yy); g.lineTo(cx + aw / 2, yy); g.stroke(); } g.beginPath(); g.moveTo(cx, top - aw / 2); g.lineTo(cx, y1); g.stroke();
      g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(cx - aw / 2 + 10, y1); g.lineTo(cx - aw / 2 + 40, top); g.lineTo(cx - aw / 2 + 70, top); g.lineTo(cx - aw / 2 + 40, y1); g.fill();
      g.fillStyle = "#f2c84a"; g.beginPath(); g.arc(cx, top - aw / 2 - 18, 9, 0, TAU); g.fill(); // gilt keystone
    }
    g.fillStyle = lt; g.fillRect(x - 14, 140, 28, 1012); g.fillStyle = sh; g.fillRect(x + 12, 140, 6, 1012);
  }
  g.fillStyle = "rgba(140,120,100,0.25)"; g.fillRect(0, 1110, 1024, 42);
});
const domeTex = () => ctex("stdDome", 512, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#f8f4ea"); gr.addColorStop(1, "#ddd3bf"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = "#d9a83a"; g.fillRect(x, 0, 6, 512); g.fillStyle = "rgba(120,100,80,0.18)"; g.fillRect(x + 6, 0, 10, 512); }
  for (let y = 60; y < 512; y += 90) { g.fillStyle = "rgba(200,160,70,0.6)"; g.fillRect(0, y, 512, 5); }
});
/** crowd face: two dot eyes + smile centred at u 0.75 (faces -z on a three SphereGeometry) */
const faceTex = () => ctex("stdCrowdFace", 256, 128, (g) => {
  g.fillStyle = "#fbf7f0"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#2a1c2c"; for (const x of [181, 203]) { g.beginPath(); g.ellipse(x, 57, 3.6, 6.5, 0, 0, TAU); g.fill(); }
  g.strokeStyle = "#2a1c2c"; g.lineWidth = 3.4; g.lineCap = "round"; g.beginPath(); g.arc(192, 68, 10, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
  g.fillStyle = "rgba(240,140,140,0.35)"; for (const x of [172, 212]) { g.beginPath(); g.ellipse(x, 70, 6, 4, 0, 0, TAU); g.fill(); }
});
const cloudSprite = (parent: THREE.Object3D, seed: number, pos: V3, w: number) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudHD(seed), transparent: true, depthWrite: false, fog: false }));
  s.scale.set(w, w / 2, 1); s.position.set(...pos); s.layers.set(NOINK); s.renderOrder = -0.5; parent.add(s); return s;
};
const balloonTex = () => ctex("stdBalloon", 512, 512, (g) => {
  const cols = ["#c8352e", "#f2c84a", "#2b4f9a", "#f6f0e2"]; for (let i = 0; i < 16; i++) { g.fillStyle = cols[i % 4]; g.fillRect(i * 32, 0, 33, 512); }
  for (let i = 0; i < 16; i++) { const gr = g.createLinearGradient(i * 32, 0, i * 32 + 32, 0); gr.addColorStop(0, "rgba(255,255,255,0.2)"); gr.addColorStop(1, "rgba(40,20,40,0.2)"); g.fillStyle = gr; g.fillRect(i * 32, 0, 32, 512); }
  g.fillStyle = "#7a1e22"; g.fillRect(0, 236, 512, 20); g.fillStyle = "#f2c84a"; for (let x = 8; x < 512; x += 32) { g.beginPath(); g.arc(x, 246, 6, 0, TAU); g.fill(); }
});
const heatTex = () => ctex("stdHeatLines", 256, 256, (g) => {
  g.lineCap = "round";
  for (const [x, a] of [[70, 0.9], [128, 1], [186, 0.9]] as [number, number][]) { g.strokeStyle = `rgba(255,150,80,${a})`; g.lineWidth = 12; g.beginPath(); for (let y = 230; y > 30; y -= 6) g.lineTo(x + Math.sin(y * 0.06 + x) * 14, y); g.stroke(); g.strokeStyle = `rgba(255,236,190,${a})`; g.lineWidth = 4; g.stroke(); }
});
const warmGlowTex = () => ctex("stdWarmGlow", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,190,110,0.9)"); gr.addColorStop(0.45, "rgba(255,150,80,0.4)"); gr.addColorStop(1, "rgba(255,140,70,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const shimmerTex = () => ctex("stdShimmer", 256, 128, (g) => {
  for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(255,248,230,${0.35 - k * 0.03})`; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 24 + k * 13 + Math.sin(x * 0.07 + k) * 5); g.stroke(); }
  g.globalCompositeOperation = "destination-in"; const gr = g.createRadialGradient(128, 64, 10, 128, 64, 128); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
});

// ---------------- THE COURSE MAP (high-res painted board) ----------------
const MW = 3072, MH = Math.round((3072 * MAP_H) / MAP_W);
/** the route in canvas px (start stadium bottom-left, out through hills + farms, the well, back to the finish stadium bottom-right) */
const routePts = (): [number, number][] => {
  const k: [number, number][] = [[600, 3080], [560, 2760], [820, 2560], [520, 2300], [700, 1980], [460, 1700], [760, 1420], [620, 1140], [900, 900],
    [1300, 980], [1560, 1240], [1720, 1050], [1880, 1100], [2140, 1000], [2420, 860], [2620, 1120], [2420, 1440], [2700, 1700], [2520, 1980], [2720, 2260], [2440, 2560], [2500, 2860], [2470, 3080]];
  // centripetal-ish Catmull-Rom sampling
  const out: [number, number][] = [];
  for (let i = 0; i < k.length - 1; i++) {
    const p0 = k[Math.max(0, i - 1)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(k.length - 1, i + 2)];
    for (let s = 0; s < 16; s++) {
      const t = s / 16, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as [number, number]);
    }
  }
  out.push(k[k.length - 1]); return out;
};
const along = (pts: [number, number][], f: number): [number, number, number] => {
  const L: number[] = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const target = f * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < target) i++;
  const u = (target - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])];
};
const mapTex = () => ctex("stdCourseMap", MW, MH, (g, r) => {
  const W = MW, H = MH;
  // parchment
  g.fillStyle = "#f0e2bc"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) blot(g, r() * W, r() * H, 200 + r() * 500, r() < 0.6 ? "rgba(200,160,100,0.1)" : "rgba(255,250,232,0.22)");
  const vg = g.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.85); vg.addColorStop(0, "rgba(150,100,50,0)"); vg.addColorStop(1, "rgba(150,100,50,0.35)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,245,0.35)"; g.fillRect(W / 2 - 3, 0, 6, H); g.fillRect(0, H / 2 - 3, W, 6); g.fillStyle = "rgba(160,120,70,0.18)"; g.fillRect(W / 2 + 3, 0, 4, H); g.fillRect(0, H / 2 + 3, W, 4);
  // terrain: fields (patchwork), hills, orchard, creek, woods
  const field = (x: number, y: number, w: number, h: number, a: number, c: string) => {
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c; g.fillRect(-w / 2, -h / 2, w, h); g.strokeStyle = "rgba(90,70,40,0.45)"; g.lineWidth = 6; g.strokeRect(-w / 2, -h / 2, w, h);
    g.strokeStyle = "rgba(90,70,40,0.2)"; g.lineWidth = 4; for (let k = -w / 2 + 22; k < w / 2; k += 30) { g.beginPath(); g.moveTo(k, -h / 2 + 8); g.lineTo(k, h / 2 - 8); g.stroke(); } g.restore();
  };
  const FC = ["#e8cf7a", "#b9c86a", "#d8b468", "#9fbe62", "#e2c28a", "#c7d27c"];
  for (let i = 0; i < 44; i++) { const x = 1050 + r() * 1300, y = 1500 + r() * 1500; field(x, y, 180 + r() * 220, 140 + r() * 180, (r() - 0.5) * 0.5, FC[i % FC.length]); }
  for (let i = 0; i < 14; i++) { const x = r() < 0.5 ? 160 + r() * 260 : 2760 + r() * 240, y = 1300 + r() * 1700; field(x, y, 150 + r() * 120, 120 + r() * 140, (r() - 0.5) * 0.4, FC[(i + 2) % FC.length]); }
  const hill = (x: number, y: number, w: number, h: number) => {
    g.fillStyle = "#a9c27a"; g.strokeStyle = "#5e6e3a"; g.lineWidth = 8; g.beginPath(); g.moveTo(x - w / 2, y); g.bezierCurveTo(x - w / 3, y - h, x + w / 3, y - h, x + w / 2, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "rgba(255,255,230,0.35)"; g.beginPath(); g.moveTo(x - w / 2.6, y - 6); g.bezierCurveTo(x - w / 4, y - h * 0.86, x - w / 16, y - h * 0.8, x, y - h * 0.74); g.lineTo(x - w / 6, y - 6); g.fill();
    g.strokeStyle = "rgba(80,90,50,0.45)"; g.lineWidth = 4; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x + (k * w) / 12, y - 8); g.lineTo(x + (k * w) / 10, y - h * 0.5 + k * 10); g.stroke(); }
  };
  for (const [x, y, w, h] of [[1200, 640, 520, 300], [1600, 560, 640, 380], [2050, 650, 560, 300], [2400, 560, 460, 260], [980, 1280, 380, 200], [2150, 1500, 420, 220], [1700, 1500, 360, 180], [420, 1100, 360, 180], [2850, 900, 300, 170]]) hill(x, y, w, h);
  const tree = (x: number, y: number, s: number, c = "#6f9a48") => { g.fillStyle = "#7a5634"; g.fillRect(x - 5 * s, y, 10 * s, 26 * s); g.fillStyle = c; g.strokeStyle = "#3e5a2a"; g.lineWidth = 4; g.beginPath(); g.arc(x, y - 6 * s, 30 * s, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "rgba(255,255,220,0.3)"; g.beginPath(); g.arc(x - 10 * s, y - 16 * s, 11 * s, 0, TAU); g.fill(); };
  for (let i = 0; i < 46; i++) tree(220 + r() * 2650, 820 + r() * 2300, 0.8 + r() * 0.5, ["#6f9a48", "#5f8c3e", "#86a852"][i % 3]);
  // orchard (apples) next to the road on the way back
  for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { const px = 2830 + x * 46 - y * 8, py = 1840 + y * 70; tree(px, py, 0.62, "#6a9a44"); g.fillStyle = "#d8402e"; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(px - 10 + k * 10, py - 8 + (k % 2) * 8, 5, 0, TAU); g.fill(); } }
  // creek
  g.strokeStyle = "#6fa6c8"; g.lineWidth = 26; g.lineCap = "round"; g.beginPath(); g.moveTo(80, 1500); g.bezierCurveTo(700, 1700, 1100, 1300, 1500, 1800); g.bezierCurveTo(1800, 2100, 2300, 1700, 3000, 2050); g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 6; g.stroke();
  // barns + farmhouses
  const barn = (x: number, y: number, s: number) => {
    g.fillStyle = "#b8442e"; g.strokeStyle = INK; g.lineWidth = 5; g.fillRect(x - 40 * s, y - 40 * s, 80 * s, 40 * s); g.strokeRect(x - 40 * s, y - 40 * s, 80 * s, 40 * s);
    g.fillStyle = "#6e4a3a"; g.beginPath(); g.moveTo(x - 48 * s, y - 38 * s); g.lineTo(x, y - 74 * s); g.lineTo(x + 48 * s, y - 38 * s); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#f6ead0"; g.fillRect(x - 10 * s, y - 28 * s, 20 * s, 28 * s); g.strokeStyle = "#f6ead0"; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 10 * s, y - 28 * s); g.lineTo(x + 10 * s, y); g.moveTo(x + 10 * s, y - 28 * s); g.lineTo(x - 10 * s, y); g.stroke();
  };
  for (const [x, y, s] of [[1250, 1700, 1.2], [1900, 2300, 1.1], [1500, 2600, 1.3], [2150, 2000, 1.0], [300, 1500, 1.0], [2900, 1400, 1.1], [1150, 2300, 0.9]]) barn(x, y, s);
  // road
  const pts = routePts();
  const strokeRoute = (w: number, c: string, dash: number[] = []) => { g.setLineDash(dash); g.strokeStyle = c; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.setLineDash([]); };
  strokeRoute(118, "#6e4a2c"); strokeRoute(92, "#e2c088"); strokeRoute(10, "rgba(140,96,56,0.7)", [36, 30]);
  for (let i = 0; i < 70; i++) { const [x, y] = along(pts, r()); blot(g, x + (r() - 0.5) * 90, y + (r() - 0.5) * 90, 40 + r() * 50, "rgba(230,200,150,0.55)"); } // dust
  // mile stones every 5 miles
  for (let m = 5; m < 25; m += 5) {
    const [x, y, a] = along(pts, m / 25), nx = -Math.sin(a), ny = Math.cos(a), px = x + nx * 120, py = y + ny * 120;
    g.fillStyle = "#f8f0dc"; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(px, py, 50, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, String(m), px, py + 3, 70, 54, SERIF);
  }
  for (let m = 1; m < 25; m++) if (m % 5 && m !== 12) { const [x, y] = along(pts, m / 25); g.fillStyle = "#8a5a34"; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); }
  // stadiums at both ends
  const stad = (x: number, y: number, label: string) => {
    g.save(); g.translate(x, y);
    g.fillStyle = "#c96a4a"; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.ellipse(0, 0, 210, 120, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#86b85a"; g.beginPath(); g.ellipse(0, 0, 150, 72, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#f2e2b8"; g.fillRect(-170, -158, 340, 48); g.strokeRect(-170, -158, 340, 48);
    g.fillStyle = "#c8352e"; g.beginPath(); g.moveTo(-190, -156); g.lineTo(0, -210); g.lineTo(190, -156); g.closePath(); g.fill(); g.stroke();
    for (const fx of [-120, 0, 120]) { g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(fx, -200 + Math.abs(fx) * 0.25); g.lineTo(fx, -262 + Math.abs(fx) * 0.25); g.stroke(); g.fillStyle = "#2b4f9a"; g.beginPath(); g.moveTo(fx, -262 + Math.abs(fx) * 0.25); g.lineTo(fx + 46, -250 + Math.abs(fx) * 0.25); g.lineTo(fx, -238 + Math.abs(fx) * 0.25); g.fill(); }
    g.fillStyle = "#c8352e"; g.fillRect(-150, 140, 300, 78); g.strokeStyle = INK; g.lineWidth = 7; g.strokeRect(-150, 140, 300, 78);
    g.fillStyle = "#fff6e0"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, label, 0, 182, 260, 58, SERIF);
    g.restore();
  };
  stad(600, 3110 - 140, "START"); stad(2470, 3110 - 140, "FINISH");
  // tiny cars + dust on the road (officials driving ahead)
  for (const f of [0.14, 0.7]) {
    const [x, y, a] = along(pts, f); g.save(); g.translate(x, y); g.rotate(a);
    for (let k = 0; k < 4; k++) blot(g, -90 - k * 50, (k % 2) * 16 - 8, 46, "rgba(220,190,140,0.7)");
    g.fillStyle = "#2f3f6a"; g.strokeStyle = INK; g.lineWidth = 5; g.fillRect(-40, -22, 80, 44); g.strokeRect(-40, -22, 80, 44);
    g.fillStyle = "#26232b"; for (const [wx, wy] of [[-26, -26], [26, -26], [-26, 26], [26, 26]]) { g.beginPath(); g.arc(wx, wy, 10, 0, TAU); g.fill(); } g.restore();
  }
  // a little dog off the course
  { const [x, y] = along(pts, 0.86); const dx = x + 230, dy = y - 60; g.fillStyle = "#c9a06a"; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.ellipse(dx, dy, 44, 22, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(dx + 44, dy - 22, 18, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(dx - 40, dy - 8); g.lineTo(dx - 66, dy - 34); g.stroke(); for (const lx of [-26, -10, 14, 30]) { g.beginPath(); g.moveTo(dx + lx, dy + 18); g.lineTo(dx + lx, dy + 40); g.stroke(); } g.setLineDash([16, 14]); g.strokeStyle = "rgba(90,60,40,0.7)"; g.beginPath(); g.moveTo(x + 40, y - 10); g.quadraticCurveTo(dx - 40, dy - 120, dx - 90, dy - 20); g.stroke(); g.setLineDash([]); }
  // labels
  g.fillStyle = "rgba(70,46,30,0.85)"; g.textAlign = "center"; g.textBaseline = "middle";
  for (const [t, x, y, s] of [["HILLS", 1640, 400, 80], ["FARMS", 1700, 2900, 70], ["ORCHARD", 2900, 2160, 54], ["WOODS", 330, 1950, 58], ["CREEK", 1180, 1450, 52]] as [string, number, number, number][]) fitText(g, t, x, y, 520, s, ITAL);
  // sun (hot day) top-left + compass rose top-right
  g.save(); g.translate(330, 640); g.fillStyle = "#f2b43a"; g.strokeStyle = "#a86a1a"; g.lineWidth = 7;
  for (let i = 0; i < 12; i++) { g.save(); g.rotate((i / 12) * TAU); g.beginPath(); g.moveTo(-26, -150); g.lineTo(0, -210); g.lineTo(26, -150); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  g.beginPath(); g.arc(0, 0, 140, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#a8501a"; fitText(g, "90°", 0, 8, 200, 110, SERIF); g.restore();
  g.save(); g.translate(2760, 560); g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 150, 0, TAU); g.stroke();
  for (let i = 0; i < 4; i++) { g.save(); g.rotate((i * Math.PI) / 2); g.fillStyle = i ? "#f6ead0" : "#c8352e"; g.beginPath(); g.moveTo(0, -190); g.lineTo(36, 0); g.lineTo(-36, 0); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  g.fillStyle = INK; fitText(g, "N", 0, -238, 80, 70, SERIF); g.restore();
  // scale bar
  g.fillStyle = INK; g.fillRect(1100, 3230, 860, 14); for (let k = 0; k <= 5; k++) g.fillRect(1100 + k * 172 - 3, 3206, 6, 50);
  g.fillStyle = "#c8352e"; for (let k = 0; k < 5; k += 2) g.fillRect(1100 + k * 172, 3230, 172, 14);
  g.fillStyle = INK; fitText(g, "0          1          2          3          4          5 MILES", 1530, 3300, 980, 44, SERIF);
  // title ribbon
  const ty = 230, tw2 = 1300;
  g.fillStyle = "#8e2220"; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(W / 2 + s * (tw2 - 40), ty - 70); g.lineTo(W / 2 + s * (tw2 + 170), ty - 70); g.lineTo(W / 2 + s * (tw2 + 100), ty + 20); g.lineTo(W / 2 + s * (tw2 + 170), ty + 110); g.lineTo(W / 2 + s * (tw2 - 40), ty + 110); g.closePath(); g.fill(); }
  g.fillStyle = "#c8352e"; g.strokeStyle = "#6a1a18"; g.lineWidth = 10; g.beginPath(); g.moveTo(W / 2 - tw2, ty - 130); g.quadraticCurveTo(W / 2, ty - 170, W / 2 + tw2, ty - 130); g.lineTo(W / 2 + tw2, ty + 80); g.quadraticCurveTo(W / 2, ty + 40, W / 2 - tw2, ty + 80); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(W / 2 - tw2 + 20, ty - 120, tw2 * 2 - 40, 30);
  g.fillStyle = "#5a1412"; fitText(g, "THE COURSE - 25 MILES", W / 2 + 6, ty - 18, tw2 * 1.8, 160, SERIF);
  g.fillStyle = "#fff6e0"; fitText(g, "THE COURSE - 25 MILES", W / 2, ty - 24, tw2 * 1.8, 160, SERIF);
  // frame
  g.strokeStyle = INK; g.lineWidth = 22; g.strokeRect(40, 40, W - 80, H - 80); g.lineWidth = 7; g.strokeRect(84, 84, W - 168, H - 168);
  for (const [cx, cy] of [[84, 84], [W - 84, 84], [84, H - 84], [W - 84, H - 84]]) { g.fillStyle = "#c8352e"; g.beginPath(); g.arc(cx, cy, 34, 0, TAU); g.fill(); g.stroke(); }
});
/** the well medallion: its own 1024 canvas so the push-in stays crisp (alpha outside the round badge) */
const wellTex = () => ctex("stdWellIcon2", 2048, 2048, (g) => {
  g.scale(2, 2); const C = 512, ink = "#3a2418";
  g.fillStyle = "#c79a3a"; g.beginPath(); g.arc(C, C, 500, 0, TAU); g.fill();
  for (let k = 0; k < 48; k++) { const a = (k / 48) * TAU; g.fillStyle = k % 2 ? "#e2b84a" : "#a87a2a"; g.beginPath(); g.arc(C + Math.cos(a) * 486, C + Math.sin(a) * 486, 7, 0, TAU); g.fill(); }
  g.fillStyle = "#7a4a1e"; g.beginPath(); g.arc(C, C, 470, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(C, C, 452, 0, TAU); g.clip();
  const sky = g.createLinearGradient(0, 60, 0, 640); sky.addColorStop(0, "#7fb8ec"); sky.addColorStop(1, "#e6f2f6"); g.fillStyle = sky; g.fillRect(0, 0, 1024, 1024);
  // sun haze + cloud
  blot(g, 830, 230, 160, "rgba(255,236,170,0.8)"); g.fillStyle = "#ffe08a"; g.beginPath(); g.arc(830, 230, 52, 0, TAU); g.fill();
  g.fillStyle = "rgba(255,255,255,0.9)"; for (const [x, y, rr] of [[200, 210, 46], [250, 190, 60], [310, 214, 44], [160, 228, 34]]) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  // far hills + fields
  g.fillStyle = "#8fb46a"; g.beginPath(); g.moveTo(0, 600); g.bezierCurveTo(200, 500, 380, 560, 560, 580); g.bezierCurveTo(740, 560, 880, 500, 1024, 590); g.lineTo(1024, 700); g.lineTo(0, 700); g.fill();
  g.fillStyle = "#e2cc82"; g.fillRect(0, 640, 1024, 400);
  g.fillStyle = "#b6c86a"; g.beginPath(); g.moveTo(0, 650); g.lineTo(1024, 630); g.lineTo(1024, 700); g.lineTo(0, 720); g.fill();
  g.strokeStyle = "rgba(120,96,50,0.35)"; g.lineWidth = 3; for (let y = 735; y < 1024; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y - 10); g.stroke(); }
  // dusty road to the well
  const rd = g.createLinearGradient(0, 640, 0, 1024); rd.addColorStop(0, "#e8cc94"); rd.addColorStop(1, "#d2ae70"); g.fillStyle = rd;
  g.beginPath(); g.moveTo(250, 1024); g.quadraticCurveTo(470, 800, 690, 650); g.lineTo(740, 655); g.quadraticCurveTo(640, 820, 760, 1024); g.fill();
  for (let i = 0; i < 9; i++) blot(g, 420 + i * 40, 980 - i * 38, 40, "rgba(250,236,200,0.6)");
  // posts (grain), crossbar, crank
  g.lineWidth = 12; g.strokeStyle = ink; g.lineJoin = "round";
  for (const x of [330, 656]) { const pg = g.createLinearGradient(x, 0, x + 38, 0); pg.addColorStop(0, "#a8703e"); pg.addColorStop(1, "#6e4424"); g.fillStyle = pg; g.fillRect(x, 300, 38, 360); g.strokeRect(x, 300, 38, 360); g.strokeStyle = "rgba(60,30,14,0.45)"; g.lineWidth = 3; for (const dx of [10, 22, 30]) { g.beginPath(); g.moveTo(x + dx, 310); g.bezierCurveTo(x + dx - 4, 420, x + dx + 4, 520, x + dx, 650); g.stroke(); } g.lineWidth = 12; g.strokeStyle = ink; }
  // roof with shingle rows
  const rg = g.createLinearGradient(0, 150, 0, 350); rg.addColorStop(0, "#d8583a"); rg.addColorStop(1, "#9a3422"); g.fillStyle = rg;
  g.beginPath(); g.moveTo(260, 330); g.lineTo(512, 150); g.lineTo(764, 330); g.lineTo(720, 350); g.lineTo(512, 205); g.lineTo(304, 350); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = "rgba(80,24,14,0.55)"; g.lineWidth = 4; for (let k = 1; k < 7; k++) { const t = k / 7; g.beginPath(); g.moveTo(512 - t * 252, 150 + t * 180); g.lineTo(512 - t * 208, 205 + t * 145); g.stroke(); g.beginPath(); g.moveTo(512 + t * 252, 150 + t * 180); g.lineTo(512 + t * 208, 205 + t * 145); g.stroke(); }
  g.fillStyle = "rgba(255,220,190,0.35)"; g.beginPath(); g.moveTo(272, 326); g.lineTo(512, 156); g.lineTo(512, 176); g.lineTo(290, 334); g.fill();
  g.strokeStyle = ink; g.lineWidth = 12; g.fillStyle = "#7a4c2a"; g.fillRect(350, 372, 324, 30); g.strokeRect(350, 372, 324, 30);
  g.fillStyle = "#c9a26a"; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(410 + k * 34, 387, 10, 15, 0, 0, TAU); g.fill(); } // rope coils on the axle
  g.strokeStyle = ink; g.lineWidth = 10; g.beginPath(); g.moveTo(700, 386); g.lineTo(770, 386); g.lineTo(770, 446); g.stroke(); g.fillStyle = "#7a4c2a"; g.beginPath(); g.arc(770, 452, 14, 0, TAU); g.fill(); g.stroke();
  g.lineWidth = 6; g.strokeStyle = "#8a6a3a"; g.beginPath(); g.moveTo(512, 402); g.lineTo(512, 520); g.stroke();
  g.lineWidth = 10; g.strokeStyle = ink; const bg = g.createLinearGradient(468, 0, 556, 0); bg.addColorStop(0, "#c08a4a"); bg.addColorStop(1, "#8a5a30"); g.fillStyle = bg;
  g.beginPath(); g.moveTo(468, 520); g.lineTo(556, 520); g.lineTo(546, 600); g.lineTo(478, 600); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#5a3a22"; g.fillRect(472, 538, 80, 9); g.fillRect(476, 574, 72, 9);
  g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.arc(512, 520, 30, Math.PI, 0); g.stroke();
  // stone drum: shaded blocks
  const sg = g.createLinearGradient(280, 0, 744, 0); sg.addColorStop(0, "#c4b9a8"); sg.addColorStop(0.45, "#ada290"); sg.addColorStop(1, "#8e8474"); g.fillStyle = sg;
  g.lineWidth = 12; g.beginPath(); g.moveTo(280, 640); g.lineTo(280, 800); g.quadraticCurveTo(512, 880, 744, 800); g.lineTo(744, 640); g.closePath(); g.fill(); g.stroke();
  g.save(); g.beginPath(); g.moveTo(286, 640); g.lineTo(286, 798); g.quadraticCurveTo(512, 874, 738, 798); g.lineTo(738, 640); g.clip();
  const rr2 = rng(12); for (let row = 0; row < 4; row++) { const y0 = 680 + row * 44; for (let k = -1; k < 9; k++) { const x = 280 + k * 62 + (row % 2) * 31, cy = y0 + Math.sin(((x - 280) / 464) * Math.PI) * 50; g.fillStyle = `rgba(${rr2() < 0.5 ? "255,250,240" : "80,70,60"},${0.08 + rr2() * 0.12})`; g.fillRect(x + 3, cy - 18, 56, 38); g.strokeStyle = "rgba(60,44,34,0.6)"; g.lineWidth = 4; g.strokeRect(x + 3, cy - 18, 56, 38); } }
  g.restore();
  g.lineWidth = 12; g.strokeStyle = ink; g.fillStyle = "#cfc6b6"; g.beginPath(); g.ellipse(512, 640, 232, 62, 0, 0, TAU); g.fill(); g.stroke();
  const wg = g.createRadialGradient(470, 636, 10, 512, 646, 190); wg.addColorStop(0, "#3c6aa8"); wg.addColorStop(1, "#1c2c52"); g.fillStyle = wg; g.beginPath(); g.ellipse(512, 646, 186, 40, 0, 0, TAU); g.fill();
  g.fillStyle = "rgba(190,226,255,0.75)"; g.beginPath(); g.ellipse(462, 638, 70, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(580, 652, 30, 5, 0, 0, TAU); g.fill();
  // grass tufts + flowers at the base
  g.strokeStyle = "#4f7a2e"; g.lineWidth = 5; g.lineCap = "round"; for (const bx of [250, 300, 720, 770, 210, 820]) for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(bx + k * 6, 860); g.lineTo(bx + k * 12, 820 - Math.abs(k) * -4 - 16); g.stroke(); }
  for (const [x, y, c] of [[236, 836, "#f2d23a"], [300, 846, "#ffffff"], [760, 840, "#f2d23a"], [800, 850, "#e86a8a"]] as [number, number, string][]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
  g.restore();
  // label ribbon
  g.fillStyle = "#8e2220"; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(512 + s2 * 200, 850); g.lineTo(512 + s2 * 270, 850); g.lineTo(512 + s2 * 245, 890); g.lineTo(512 + s2 * 270, 940); g.lineTo(512 + s2 * 200, 940); g.fill(); }
  g.fillStyle = "#c8352e"; g.strokeStyle = "#5a1412"; g.lineWidth = 10; g.beginPath(); g.moveTo(290, 830); g.lineTo(734, 830); g.lineTo(712, 928); g.lineTo(312, 928); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fff6e0"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "THE WELL", 512, 882, 350, 74, SERIF);
  g.strokeStyle = "#f2d27a"; g.lineWidth = 10; g.beginPath(); g.arc(C, C, 462, 0, TAU); g.stroke();
});
const ringTex = () => ctex("stdGlowRing", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 70, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.55, "rgba(255,255,255,1)"); gr.addColorStop(0.7, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** thermometer face: white enamel, scale 50-100 F (y 0.7 .. 3.5 m of a 4.0 m board, 128 px / m) */
const THERM_B = 4.0, T_LO = 0.7, T_HI = 3.5;
const thermoTex = () => ctex("stdThermo", 256, 512, (g) => {
  const W = 256, H = 512, y = (deg: number) => H - (T_LO + ((deg - 50) / 50) * (T_HI - T_LO)) * (H / THERM_B);
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#e9e2d2"); gr.addColorStop(0.5, "#fbf8f0"); gr.addColorStop(1, "#e4dccb"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // hot band behind the high numbers
  const hb = g.createLinearGradient(0, y(100), 0, y(75)); hb.addColorStop(0, "rgba(232,96,50,0.45)"); hb.addColorStop(1, "rgba(232,96,50,0)"); g.fillStyle = hb; g.fillRect(0, y(100), W, y(75) - y(100));
  g.fillStyle = "#3a2418"; g.textAlign = "right"; g.textBaseline = "middle";
  for (let d = 50; d <= 100; d += 5) { const yy = y(d), big = d % 10 === 0; g.fillRect(W / 2 + 22, yy - (big ? 3 : 2), big ? 52 : 30, big ? 6 : 4); g.fillRect(W / 2 - 22 - (big ? 52 : 30), yy - (big ? 3 : 2), big ? 52 : 30, big ? 6 : 4); if (big) { g.textAlign = "left"; fitText(g, String(d), W / 2 + 82, yy, 50, 30, SERIF); } }
  g.fillStyle = d90Col; g.fillRect(W / 2 - 80, y(90) - 4, 160, 8);
  g.fillStyle = "#c8352e"; g.textAlign = "center"; fitText(g, "°F", W / 2, H - 20, 80, 26, SERIF);
  g.fillStyle = "#3a2418"; fitText(g, "HEAT", W / 2, 22, 140, 30, SERIF);
  g.strokeStyle = "#8a6a3a"; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
});
const d90Col = "rgba(200,40,30,0.75)";
const dialTex = () => ctex("stdDial", 256, 256, (g) => {
  g.fillStyle = "#c79a3a"; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
  g.fillStyle = "#fbf6e8"; g.beginPath(); g.arc(128, 128, 110, 0, TAU); g.fill();
  g.fillStyle = "#2a1c2c"; for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, l = i % 5 ? 8 : 18; g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-1.5, -104, i % 5 ? 3 : 5, l); g.restore(); }
  g.textAlign = "center"; g.textBaseline = "middle"; for (const [t, a] of [["60", 0], ["15", 0.25], ["30", 0.5], ["45", 0.75]] as [string, number][]) fitText(g, t, 128 + Math.sin(a * TAU) * 70, 128 - Math.cos(a * TAU) * 70, 40, 26, SERIF);
});
const ledgerTex = () => ctex("stdLedger", 512, 320, (g, r) => {
  g.fillStyle = "#f6eed6"; g.fillRect(0, 0, 512, 320); g.fillStyle = "rgba(120,90,50,0.25)"; g.fillRect(252, 0, 8, 320);
  for (const x0 of [16, 272]) {
    g.fillStyle = "#c8352e"; g.fillRect(x0, 34, 224, 3); g.fillStyle = "rgba(60,90,140,0.4)"; for (let y = 60; y < 310; y += 22) g.fillRect(x0, y, 224, 2); g.fillStyle = "rgba(200,60,50,0.5)"; g.fillRect(x0 + 150, 20, 2, 290);
    g.fillStyle = "#2a2a44"; g.textAlign = "left"; g.textBaseline = "alphabetic";
    for (let y = 56; y < 300; y += 22) { if (r() < 0.2) continue; fitText(g, ["No." + (1 + Math.floor(r() * 30)), "dry", "thirsty", "v. thirsty"][Math.floor(r() * 4)], x0 + 6, y, 130, 16, ITAL); fitText(g, ["—", "0 cups", "none", "0"][Math.floor(r() * 4)], x0 + 158, y, 60, 16, ITAL); }
  }
  g.fillStyle = "#3a2418"; g.textAlign = "center"; fitText(g, "THIRST", 128, 22, 200, 22, SERIF); fitText(g, "OBSERVATIONS", 384, 22, 200, 22, SERIF);
});
const confettiTex = () => ctex("stdConfetti", 64, 64, (g) => { g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(6, 14, 52, 36, 6); g.fill(); g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(6, 38, 52, 12); });
const streamerTex = () => ctex("stdStreamer", 64, 512, (g) => { g.strokeStyle = "#ffffff"; g.lineWidth = 14; g.lineCap = "round"; g.beginPath(); for (let y = 10; y < 500; y += 4) g.lineTo(32 + Math.sin(y * 0.045) * 20, y); g.stroke(); g.strokeStyle = "rgba(0,0,0,0.15)"; g.lineWidth = 4; g.beginPath(); for (let y = 10; y < 500; y += 4) g.lineTo(36 + Math.sin(y * 0.045) * 20, y); g.stroke(); });
const hatCardTex = (kind: 0 | 1) => ctex("stdHatCard" + kind, 256, 160, (g) => {
  g.lineWidth = 8; g.strokeStyle = "#241726"; g.lineJoin = "round";
  if (kind === 0) { // straw boater
    g.fillStyle = "#ecc878"; g.beginPath(); g.ellipse(128, 118, 118, 26, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(58, 116); g.lineTo(66, 40); g.quadraticCurveTo(128, 28, 190, 40); g.lineTo(198, 116); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#2b4f9a"; g.fillRect(62, 84, 132, 22); g.strokeRect(62, 84, 132, 22);
  } else { // bowler
    g.fillStyle = "#3a3440"; g.beginPath(); g.ellipse(128, 122, 112, 22, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(52, 118); g.bezierCurveTo(52, 10, 204, 10, 204, 118); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#7a2a3a"; g.fillRect(56, 92, 144, 16);
    g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.ellipse(100, 56, 22, 12, -0.4, 0, TAU); g.fill();
  }
});

// ---------------- the crowd (instanced cartoon spectators) ----------------
type Seat = { x: number; y: number; z: number; yaw: number; wav: number; ph: number; side: number; hat: number; jump: number };
const COATS = ["#c8352e", "#2f5d9a", "#e8b04a", "#3a7a4f", "#7a2a3a", "#ece6d6", "#5a4a6e", "#d8742e", "#26386a", "#f2efe6", "#8a5a2b", "#c0476a", "#4a8ab8", "#e8dcc0", "#2f8a8a"];
const HATS = ["#e6c27a", "#ecd08a", "#2a2a38", "#6b4a2f", "#f4efe6", "#34303a", "#e6c27a", "#c0476a", "#8a8f9e"];
const FLAGS = ["#ffffff", "#ffffff", "#c8352e", "#2b4f9a", "#f2c84a", "#ffffff"];
const crowd = (parent: THREE.Object3D, seats: Seat[]) => {
  const n = seats.length, r = rng(1904);
  const body = new THREE.CapsuleGeometry(0.19, 0.3, 4, 10).scale(1.15, 1, 0.8).translate(0, 0.33, 0);
  const head = new THREE.SphereGeometry(0.165, 16, 12).scale(1, 1.2, 1);
  const hat = (() => { const a = new THREE.CylinderGeometry(0.23, 0.23, 0.025, 14).translate(0, 0, 0), c = new THREE.CylinderGeometry(0.135, 0.145, 0.14, 12).translate(0, 0.07, 0); const g = new THREE.BufferGeometry(); const m = [a, c].map((x) => x.toNonIndexed()); g.setAttribute("position", new THREE.Float32BufferAttribute([...m[0].attributes.position.array, ...m[1].attributes.position.array], 3)); g.computeVertexNormals(); return g; })();
  const arm = new THREE.CylinderGeometry(0.042, 0.05, 0.48, 6).translate(0, 0.24, 0);
  const flag = new THREE.BoxGeometry(0.26, 0.2, 0.012).translate(0.13, 0.56, 0);
  const mkMesh = (geo: THREE.BufferGeometry, m: THREE.Material, cast = true) => { const im = new THREE.InstancedMesh(geo, m, n); im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false; parent.add(im); return im; };
  const white = mat("stdCrowdW", () => twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff" })));
  const B = mkMesh(body, white), Hd = mkMesh(head, mat("stdCrowdFaceM", () => twoTone(new THREE.MeshLambertMaterial({ map: faceTex() })))), Ht = mkMesh(hat, white), A = mkMesh(arm, white), F = mkMesh(flag, mat("stdCrowdFlag", () => twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff", side: THREE.DoubleSide }))), false);
  // parasols over a few ladies (main stand only), tilting gently
  const pIdx = seats.map((s, i) => (s.yaw === 0 && r() < 0.035 ? i : -1)).filter((i) => i >= 0), np = pIdx.length;
  const paraGeo = new THREE.ConeGeometry(0.46, 0.24, 12, 1, true).translate(0, 1.62, 0), stickGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.0, 4).translate(0, 1.2, 0);
  const PA = new THREE.InstancedMesh(paraGeo, mat("stdParasol", () => twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff", side: THREE.DoubleSide }))), np); PA.castShadow = true; PA.receiveShadow = true; PA.frustumCulled = false; parent.add(PA);
  const PS = new THREE.InstancedMesh(stickGeo, white, np); PS.frustumCulled = false; parent.add(PS);
  const PCOL = ["#f6c8d4", "#fff4dc", "#c8e0f4", "#f2d27a", "#e88aa8", "#ffffff"];
  const c = new THREE.Color();
  pIdx.forEach((si, j) => { PA.setColorAt(j, c.set(PCOL[j % PCOL.length])); PS.setColorAt(j, c.set("#5a4a3a")); seats[si].wav = 2; seats[si].hat = 7; });
  seats.forEach((s, i) => {
    const coat = COATS[Math.floor(r() * COATS.length)];
    B.setColorAt(i, c.set(coat)); A.setColorAt(i, c.set(coat)); Ht.setColorAt(i, c.set(HATS[Math.max(0, s.hat)])); F.setColorAt(i, c.set(FLAGS[Math.floor(r() * FLAGS.length)]));
  });
  const d = new THREE.Object3D(), off = new THREE.Vector3();
  const update = (t: number, k: number) => {
    const raiseK = 0.1 + 0.85 * k;
    for (let i = 0; i < n; i++) {
      const s = seats[i];
      const jumpA = k * s.jump * Math.max(0, Math.sin(t * (5.2 + s.ph % 1.6) + s.ph * 7)) * 0.2 + Math.sin(t * 1.3 + s.ph * 5) * 0.012;
      const y = s.y + jumpA, sway = Math.sin(t * 0.9 + s.ph * 3) * 0.05 + k * Math.sin(t * 4 + s.ph) * 0.08;
      d.position.set(s.x, y, s.z); d.rotation.set(0, s.yaw, sway * 0.5); d.scale.set(1, 1, 1); d.updateMatrix(); B.setMatrixAt(i, d.matrix);
      d.position.set(s.x - Math.cos(s.yaw) * sway * 0.4, y + 0.88, s.z + Math.sin(s.yaw) * sway * 0.4); d.rotation.set(0, s.yaw + Math.sin(t * 0.5 + s.ph * 9) * 0.15, sway); d.updateMatrix(); Hd.setMatrixAt(i, d.matrix);
      d.position.y = y + 0.88 + 0.15; d.updateMatrix(); Ht.setMatrixAt(i, s.hat < 0 ? zero : d.matrix);
      const raise = cl((raiseK - s.wav) * 5), a = THREE.MathUtils.lerp(Math.PI - 0.22, 0.32 + 0.32 * Math.sin(t * (6 + k * 3) + s.ph * 11), raise);
      off.set(s.side * 0.21, 0.55, 0).applyAxisAngle(UP, s.yaw);
      d.position.set(s.x + off.x, y + off.y, s.z + off.z); d.rotation.set(0, s.yaw, -s.side * a); d.scale.set(1, 1, 1); d.updateMatrix(); A.setMatrixAt(i, d.matrix);
      d.scale.set(s.side * Math.max(0.001, raise), Math.max(0.001, raise), 1); d.updateMatrix(); F.setMatrixAt(i, d.matrix);
    }
    pIdx.forEach((si, j) => { const s = seats[si]; d.position.set(s.x + 0.12, s.y, s.z - 0.05); d.rotation.set(-0.25 + 0.05 * Math.sin(t * 0.8 + s.ph), t * 0.3 + s.ph, 0.18 + 0.04 * Math.sin(t * 1.1 + s.ph)); d.scale.set(1, 1, 1); d.updateMatrix(); PA.setMatrixAt(j, d.matrix); PS.setMatrixAt(j, d.matrix); });
    PA.instanceMatrix.needsUpdate = true; PS.instanceMatrix.needsUpdate = true;
    for (const m of [B, Hd, Ht, A, F]) m.instanceMatrix.needsUpdate = true;
  };
  return { update };
};
const UP = V(0, 1, 0);
const zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);

// ---------------- props ----------------
const palace = (b: Batch, x: number, z: number, w: number, d: number, s: number, yaw: number, o: { dome?: number; towers?: boolean; tint?: string; flags?: V3[] } = {}) => {
  const H = 18 * s, M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z), f = mat("stdPalF" + (o.tint ?? "c"), () => twoTone(new THREE.MeshLambertMaterial({ map: palaceTex(o.tint ?? "#efe6d2") })));
  const add = (g: THREE.BufferGeometry, m: THREE.Material) => b.add(g, m, M);
  const hw = w / 2, hd = d / 2, u = w / (16 * s), ud = d / (16 * s);
  add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, H, hd), V(-hw, H, hd), u, 1), f); add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, H, -hd), V(hw, H, -hd), u, 1), f);
  add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, H, -hd), V(hw, H, hd), ud, 1), f); add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, H, hd), V(-hw, H, -hd), ud, 1), f);
  const cream = col("#f2ead8"), gold = shiny("gold", "#e2b24a", 70);
  add(boxGeo(V(-hw - 0.6, H, -hd - 0.6), V(hw + 0.6, H + 1.2 * s, hd + 0.6)), cream); add(quad(V(-hw, H + 1.2 * s, hd), V(hw, H + 1.2 * s, hd), V(hw, H + 1.2 * s, -hd), V(-hw, H + 1.2 * s, -hd)), col("#d8cfbc"));
  for (let k = -hw; k <= hw; k += 4 * s) add(boxGeo(V(k - 0.4 * s, H + 1.2 * s, hd - 0.6), V(k + 0.4 * s, H + 2.6 * s, hd + 0.2)), cream); // roof urns / balustrade posts
  if (o.dome) {
    const R = o.dome * s, y0 = H + 1.2 * s;
    add(new THREE.CylinderGeometry(R * 1.02, R * 1.06, R * 0.55, 32).translate(0, y0 + R * 0.27, 0), f);
    add(new THREE.CylinderGeometry(R * 1.1, R * 1.1, R * 0.08, 32).translate(0, y0 + R * 0.57, 0), cream);
    add(scaleUV(new THREE.SphereGeometry(R, 32, 16, 0, TAU, 0, Math.PI / 2), 3, 1).scale(1, 1.18, 1).translate(0, y0 + R * 0.6, 0), tx("dome", domeTex));
    add(new THREE.CylinderGeometry(R * 0.16, R * 0.2, R * 0.4, 12).translate(0, y0 + R * 1.98, 0), cream); add(new THREE.SphereGeometry(R * 0.14, 12, 8).translate(0, y0 + R * 2.3, 0), gold);
    add(new THREE.ConeGeometry(R * 0.05, R * 0.5, 8).translate(0, y0 + R * 2.6, 0), gold);
  }
  if (o.towers) for (const sx of [-1, 1]) {
    const tx0 = sx * (hw - 3 * s), th = H * 1.7;
    add(boxGeo(V(tx0 - 3 * s, 0, hd - 6 * s), V(tx0 + 3 * s, th, hd + 0.6)), f);
    add(boxGeo(V(tx0 - 3.4 * s, th, hd - 6.4 * s), V(tx0 + 3.4 * s, th + 0.8 * s, hd + 1)), cream);
    add(scaleUV(new THREE.SphereGeometry(3 * s, 20, 10, 0, TAU, 0, Math.PI / 2), 2, 1).scale(1, 1.4, 1).translate(tx0, th + 0.8 * s, hd - 2.7 * s), tx("dome", domeTex));
    add(new THREE.ConeGeometry(0.3 * s, 3 * s, 8).translate(tx0, th + 6 * s, hd - 2.7 * s), gold);
  }
};
const tableGeo = (b: Batch, M: THREE.Matrix4, w: number, d: number, h: number, top: THREE.Material, leg: THREE.Material) => {
  b.add(boxGeo(V(-w / 2, h - 0.05, -d / 2), V(w / 2, h, d / 2)), top, M);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(boxGeo(V(sx * (w / 2 - 0.08) - 0.03, 0, sz * (d / 2 - 0.08) - 0.03), V(sx * (w / 2 - 0.08) + 0.03, h - 0.05, sz * (d / 2 - 0.08) + 0.03)), leg, M);
  b.add(boxGeo(V(-w / 2 + 0.05, h - 0.18, -d / 2 + 0.04), V(w / 2 - 0.05, h - 0.05, -d / 2 + 0.07)), leg, M);
};
const chairGeo = (b: Batch, M: THREE.Matrix4, m: THREE.Material) => {
  b.add(boxGeo(V(-0.22, 0.44, -0.22), V(0.22, 0.48, 0.22)), m, M);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(boxGeo(V(sx * 0.19 - 0.02, 0, sz * 0.19 - 0.02), V(sx * 0.19 + 0.02, sz > 0 ? 0.95 : 0.44, sz * 0.19 + 0.02)), m, M);
  for (const y of [0.62, 0.76, 0.9]) b.add(boxGeo(V(-0.2, y, 0.18), V(0.2, y + 0.05, 0.21)), m, M);
};

// ---------------- the set ----------------
export const stadium = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), r = rng(1904);
  const lorzCar = autocar(root, { colour: "blue" }); lorzCar.g.position.set(CARPARK[0], 0, CARPARK[2]); lorzCar.g.rotation.set(0, -Math.PI / 2, 0, "YXZ");
  const at = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  // ===== ground =====
  const grassM = lam("stdGrassM", () => ({ map: grassHD(), color: "#94a888" }));
  b.add(scaleUV(quad(V(-700, -0.02, 700), V(700, -0.02, 700), V(700, -0.02, -700), V(-700, -0.02, -700)), 175, 175), grassM);
  const cinder = tx("cinder", cinderTex), sand = tx("sand", sandTex), chalk = col("#fbf8f0");
  for (const z0 of [0, -60]) b.add(quad(V(-SX, 0, z0 + HW), V(SX, 0, z0 + HW), V(SX, 0, z0 - HW), V(-SX, 0, z0 - HW), (2 * SX) / 4, (2 * HW) / 4), cinder);
  for (const s of [-1, 1]) {
    const ring = new THREE.RingGeometry(BR - HW, BR + HW, 64, 1, s > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
    const uv = ring.attributes.uv as THREE.BufferAttribute, p = ring.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4);
    b.add(ring.translate(s * SX, 0, BZ), cinder);
  }
  // straight-out runway to the gate + the dusty course road beyond
  b.add(quad(V(SX - 2, 0.004, 5.2), V(GATE_X + 6.5, 0.004, 5.2), V(GATE_X + 6.5, 0.004, -1.2), V(SX - 2, 0.004, -1.2), 4.6, 1.6), cinder);
  b.add(scaleUV(quad(V(GATE_X + 6.5, 0.003, 6), V(420, 0.003, 14), V(420, 0.003, -10), V(GATE_X + 6.5, 0.003, -2)), 1.6, (420 - GATE_X) / 8), tx("road", roadTex));
  { const g = b; for (let x = GATE_X + 8; x < 400; x += 6 + r() * 8) g.add(new THREE.CircleGeometry(0.4 + r() * 0.8, 10).rotateX(-Math.PI / 2).translate(x, 0.006, (r() - 0.5) * 12), col("#c9a46a")); }
  // apron (sand) along the home straight
  b.add(scaleUV(quad(V(-SX - 4, 0.006, FR), V(GATE_X, 0.006, FR), V(GATE_X, 0.006, HW), V(-SX - 4, 0.006, HW)), (GATE_X + SX + 4) / 5, (FR - HW) / 5), sand);
  // white inner kerb (wooden) + chalk outer line
  const kerbM = col("#f4efe4");
  for (const z0 of [-HW, -60 + HW]) for (let x = -SX; x < SX; x += 2) b.add(boxGeo(V(x + 0.02, 0, z0 - 0.07), V(x + 1.98, 0.1, z0 + 0.07)), kerbM);
  for (const s of [-1, 1]) for (let k = 0; k < 40; k++) {
    const a0 = (k / 40) * Math.PI - Math.PI / 2, a1 = ((k + 0.92) / 40) * Math.PI - Math.PI / 2, rr = BR - HW;
    const p0 = V(s * SX + s * Math.cos(a0) * rr, 0, BZ - Math.sin(a0) * rr), p1 = V(s * SX + s * Math.cos(a1) * rr, 0, BZ - Math.sin(a1) * rr);
    b.add(rodGeo([p0.x, 0.05, p0.z], [p1.x, 0.05, p1.z], 0.07, 4), kerbM);
  }
  b.add(quad(V(-SX, 0.008, HW + 0.04), V(SX, 0.008, HW + 0.04), V(SX, 0.008, HW - 0.04), V(-SX, 0.008, HW - 0.04)), chalk);
  // START line + runner toe marks; FINISH line (chalk)
  b.add(quad(V(START_X - 0.07, 0.009, HW), V(START_X + 0.07, 0.009, HW), V(START_X + 0.07, 0.009, -HW), V(START_X - 0.07, 0.009, -HW)), chalk);
  b.add(quad(V(FIN_X - 0.09, 0.009, HW), V(FIN_X + 0.09, 0.009, HW), V(FIN_X + 0.09, 0.009, -HW), V(FIN_X - 0.09, 0.009, -HW)), chalk);
  const RUN_Z = [-3.6, -1.8, 0, 1.8, 3.6], RUN_X = [START_X - 1.0, START_X - 2.5];
  for (const x of RUN_X) for (const z of RUN_Z) b.add(quad(V(x + 0.35, 0.009, z + 0.25), V(x + 0.45, 0.009, z + 0.25), V(x + 0.45, 0.009, z - 0.25), V(x + 0.35, 0.009, z - 0.25)), chalk);
  // ===== GRANDSTAND =====
  const wood = tx("standWood", () => boardsH("stdStand", "#c9a070", 0.25)), greenB = tx("standGreen", () => boardsH("stdGreen", "#3f7a52", 0.85));
  const creamB = tx("standCream", () => boardsV("stdCream", "#fff4dc", 0.6)), roofM = tx("standRoof", () => roofHD("#8a5a4a")), under = ds("standUnder", () => boardsH("stdUnder", "#a87a52", 0.35));
  const postM = col("#f2ead8"), postBand = col("#2f6b4f"), goldM = shiny("gold", "#e2b24a", 70), redM = col("#b3262e");
  const SL = GS1 - GS0;
  // front wall (green planks) with advert panels between posts
  b.add(scaleUV(boxGeo(V(GS0, 0, FR), V(GS1, 1.1, FR + 0.3)), SL / 2, 0.5), greenB);
  const advM = unlit("adverts", advertTex, 0.92);
  let ai = 0;
  for (let x = GS0 + 3; x + 3 < GS1; x += 6) { if (Math.abs(x + 3 - FIN_X) < 4) continue; const k = ai++ % 4; b.add(faceZ(x + 0.4, x + 2.6, 0.15, 0.97, FR - 0.01, k / 4, (k + 1) / 4), advM); }
  b.add(boxGeo(V(GS0, 1.1, FR - 0.05), V(GS1, 1.2, FR + 0.35)), postM);
  // railing on the front wall
  for (let x = GS0; x <= GS1; x += 1.2) b.add(boxGeo(V(x - 0.04, 1.2, FR + 0.1), V(x + 0.04, 2.1, FR + 0.18)), postM);
  b.add(boxGeo(V(GS0, 2.05, FR + 0.06), V(GS1, 2.15, FR + 0.22)), postM); b.add(boxGeo(V(GS0, 1.6, FR + 0.1), V(GS1, 1.66, FR + 0.18)), postM);
  // stepped rows + benches
  for (let i = 0; i < NROW; i++) {
    const z0 = ROW0 + i * ROWD, y = STEP0 + i * RISE;
    b.add(scaleUV(boxGeo(V(GS0, 0, z0 - (i ? 0 : 0.3)), V(GS1, y, z0 + ROWD)), SL / 2.5, 1), wood);
    b.add(boxGeo(V(GS0, y + 0.38, z0 + 0.12), V(GS1, y + 0.44, z0 + 0.48)), creamB);
    for (let x = GS0 + 1; x < GS1; x += 3) b.add(boxGeo(V(x, y, z0 + 0.25), V(x + 0.08, y + 0.38, z0 + 0.35)), wood);
  }
  const AISLES = [-30, -17, 1, 15];
  for (const ax of AISLES) for (let i = 0; i < NROW; i++) { const z0 = ROW0 + i * ROWD, y = STEP0 + i * RISE; b.add(boxGeo(V(ax - 0.6, y, z0), V(ax + 0.6, y + 0.03, z0 + 0.06)), postM); b.add(boxGeo(V(ax - 0.6, y - RISE / 2, z0 - 0.5), V(ax + 0.6, y - RISE / 2 + 0.03, z0)), wood); }
  // back wall + end walls
  const topY = STEP0 + NROW * RISE;
  b.add(scaleUV(boxGeo(V(GS0, 0, BACK_Z - 0.4), V(GS1, BACK_Y, BACK_Z)), SL / 3, 3), creamB);
  for (const x of [GS0, GS1]) {
    const s = x === GS0 ? -1 : 1, xx = x + s * 0.01;
    b.add(scaleUV(boxGeo(V(Math.min(x, x + s * 0.3), 0, FR), V(Math.max(x, x + s * 0.3), topY + 1.2, BACK_Z)), 4, 2), creamB);
    const tg = tri(V(xx, EAVE_Y, EAVE_Z), V(xx, RIDGE_Y, RIDGE_Z), V(xx, BACK_Y, BACK_Z)); if (s < 0) { const p = tg.attributes.position as THREE.BufferAttribute; p.setXYZ(1, xx, BACK_Y, BACK_Z); p.setXYZ(2, xx, RIDGE_Y, RIDGE_Z); tg.computeVertexNormals(); }
    b.add(tg, ds("gable", () => boardsV("stdGable", "#fff4dc", 0.6)));
    b.add(scaleUV(quad(V(xx, topY + 1.2, FR), V(xx, topY + 1.2, BACK_Z), V(xx, BACK_Y, BACK_Z), V(xx, EAVE_Y, EAVE_Z)), 3, 1), ds("gable", () => boardsV("stdGable", "#fff4dc", 0.6)));
  }
  // posts (painted: cream shaft, green base band, gilt capital) + roof
  const POSTS: number[] = []; for (let x = GS0; x <= GS1 + 0.01; x += 6) POSTS.push(x);
  for (const x of POSTS) {
    b.add(new THREE.CylinderGeometry(0.13, 0.15, EAVE_Y - 1.2, 10).translate(x, 1.2 + (EAVE_Y - 1.2) / 2, FR + 0.15), postM);
    b.add(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 10).translate(x, 1.45, FR + 0.15), postBand);
    b.add(new THREE.CylinderGeometry(0.22, 0.14, 0.25, 10).translate(x, EAVE_Y - 0.15, FR + 0.15), goldM);
    b.add(rodGeo([x, EAVE_Y - 1.4, FR + 0.15], [x + 0.9, EAVE_Y - 0.15, FR + 0.15], 0.05), postM); b.add(rodGeo([x, EAVE_Y - 1.4, FR + 0.15], [x - 0.9, EAVE_Y - 0.15, FR + 0.15], 0.05), postM); // brackets
    for (let i = 3; i < NROW; i += 4) b.add(new THREE.CylinderGeometry(0.11, 0.11, BACK_Y, 8).translate(x, BACK_Y / 2, ROW0 + i * ROWD + 0.05), postM);
  }
  const rf = (a: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, e: THREE.Vector3) => { b.add(scaleUV(quad(a, c, d, e), SL / 4, a.distanceTo(e) / 4), roofM); b.add(scaleUV(quad(c, a, e, d), SL / 3, 2), under); };
  rf(V(GS0 - 0.4, EAVE_Y, EAVE_Z), V(GS1 + 0.4, EAVE_Y, EAVE_Z), V(GS1 + 0.4, RIDGE_Y, RIDGE_Z), V(GS0 - 0.4, RIDGE_Y, RIDGE_Z));
  rf(V(GS1 + 0.4, BACK_Y, BACK_Z + 0.4), V(GS0 - 0.4, BACK_Y, BACK_Z + 0.4), V(GS0 - 0.4, RIDGE_Y, RIDGE_Z), V(GS1 + 0.4, RIDGE_Y, RIDGE_Z));
  b.add(boxGeo(V(GS0 - 0.4, RIDGE_Y - 0.1, RIDGE_Z - 0.2), V(GS1 + 0.4, RIDGE_Y + 0.15, RIDGE_Z + 0.2)), redM);
  b.add(boxGeo(V(GS0, EAVE_Y - 0.15, FR - 0.1), V(GS1, EAVE_Y, FR + 0.4)), postM); // beam on the posts
  // fascia valance (cream with scallops) along the eave
  const valM = cut("valance", () => ctex("stdValance", 512, 96, (g) => { g.fillStyle = "#f6efe0"; g.fillRect(0, 0, 512, 60); for (let x = 0; x < 512; x += 64) { g.beginPath(); g.arc(x + 32, 60, 32, 0, Math.PI); g.fill(); } g.fillStyle = "#2f6b4f"; g.fillRect(0, 0, 512, 12); g.fillStyle = "#c8352e"; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.arc(x + 32, 40, 9, 0, TAU); g.fill(); } }));
  b.add(scaleUV(quad(V(GS0 - 0.4, EAVE_Y - 0.6, EAVE_Z - 0.02), V(GS1 + 0.4, EAVE_Y - 0.6, EAVE_Z - 0.02), V(GS1 + 0.4, EAVE_Y + 0.02, EAVE_Z - 0.02), V(GS0 - 0.4, EAVE_Y + 0.02, EAVE_Z - 0.02)), SL / 4, 1), valM);
  // centre pavilion gable (judges' box) over the finish
  {
    const cx = FIN_X, gw = 7, gz = EAVE_Z - 0.6, gy = EAVE_Y + 0.02;
    b.add(boxGeo(V(cx - gw, gy, gz), V(cx + gw, gy + 2.2, gz + 6.6)), creamB);
    b.add(tri(V(cx + gw + 0.4, gy + 2.2, gz - 0.02), V(cx - gw - 0.4, gy + 2.2, gz - 0.02), V(cx, gy + 5.0, gz - 0.02)), ds("gableP", () => boardsV("stdGableP", "#fff4dc", 0.6)));
    const xL = cx - gw - 0.5, xR = cx + gw + 0.5, yE = gy + 2.1, yR = gy + 5.15;
    b.add(quad(V(xL, yE, gz - 0.2), V(xL, yE, gz + 7), V(cx, yR, gz + 7), V(cx, yR, gz - 0.2), 3, 2), roofM);
    b.add(quad(V(xR, yE, gz + 7), V(xR, yE, gz - 0.2), V(cx, yR, gz - 0.2), V(cx, yR, gz + 7), 3, 2), roofM);
    const sgn = unlit("pavSign", () => textTex("pav", "GAMES OF 1904", 1024, 200, "#2b4f9a", "#fff6e0", { border: "#f2c84a", shadow: "#16284e" }));
    b.add(faceZ(cx - 5.6, cx + 5.6, gy + 0.3, gy + 1.9, gz - 0.04), sgn);
    b.add(new THREE.CircleGeometry(0.9, 24).rotateY(Math.PI).translate(cx, gy + 3.25, gz - 0.06), unlit("rosette", rosetteTex, 1, true));
  }
  // banners on the end gables
  for (const [x, t] of [[GS0 + 10, "WORLD'S FAIR"], [GS1 - 10, "MARATHON DAY"]] as [number, string][]) b.add(quad(V(x + 5, EAVE_Y + 0.15, EAVE_Z + 0.25), V(x - 5, EAVE_Y + 0.15, EAVE_Z + 0.25), V(x - 5, EAVE_Y + 1.25, EAVE_Z + 1.2), V(x + 5, EAVE_Y + 1.25, EAVE_Z + 1.2)), unlit("ban" + t, () => textTex("ban" + t, t, 1024, 120, "#c8352e", "#fff6e0", { border: "#f6efe0", shadow: "#6a1a18" })));
  // ===== east wall (posters) + gatehouse =====
  const wallM = tx("wallCream", () => boardsV("stdWall", "#f0e2c0", 0.55));
  b.add(scaleUV(boxGeo(V(GS1, 0, FR), V(GATE_X, 3.2, FR + 0.4)), (GATE_X - GS1) / 2.5, 1.3), wallM);
  b.add(boxGeo(V(GS1, 3.2, FR - 0.08), V(GATE_X, 3.4, FR + 0.48)), postBand);
  for (let x = GS1 + 2; x < GATE_X; x += 4) b.add(boxGeo(V(x - 0.12, 0, FR - 0.12), V(x + 0.12, 3.5, FR)), postBand);
  b.add(faceZ(GS1 + 4.6, GS1 + 7.6, 0.6, 2.6, FR - 0.01), unlit("posterA", () => textTex("posterA", "GRAND\nEXPOSITION\n1904", 512, 340, "#f2d27a", "#7a1e22", { border: "#7a1e22" })));
  b.add(faceZ(50.6, 52.6, 0.6, 2.6, FR - 0.01), unlit("posterB", () => textTex("posterB", "RUN!\n25\nMILES", 300, 300, "#2b4f9a", "#fff6e0", { border: "#f2c84a" })));
  {
    const gb = new Batch(); // the gatehouse casts no shadow (its shadow would fall over the map / thermometer / table area with a camera-relative sun)
    const stone = tx("gateStone", () => stoneHD("stdGateStone", ["#e6dcc8", "#ddd2bc", "#efe6d4", "#d6c9b0"], "#a89a84"));
    const sh = new THREE.Shape(); sh.moveTo(-3.5, 0); sh.lineTo(-3.5, 9.4); sh.lineTo(3.5, 9.4); sh.lineTo(3.5, 0); sh.lineTo(3.0, 0); sh.lineTo(3.0, 4.2); sh.absarc(0, 4.2, 3.0, 0, Math.PI, false); sh.lineTo(-3.0, 0); sh.closePath();
    const ag = new THREE.ExtrudeGeometry(sh, { depth: 6, bevelEnabled: false, curveSegments: 24 }); scaleUV(ag, 0.25, 0.25); ag.rotateY(Math.PI / 2).translate(GATE_X, 0, 2);
    gb.add(ag, stone);
    for (const [z0, z1] of [[-6, -1.5], [5.5, 10.8]]) {
      gb.add(scaleUV(boxGeo(V(GATE_X - 0.3, 0, z0), V(GATE_X + 6.3, 10.6, z1)), 1.4, 2.6), stone);
      gb.add(boxGeo(V(GATE_X - 0.6, 10.6, z0 - 0.3), V(GATE_X + 6.6, 11.1, z1 + 0.3)), col("#d6c9b0"));
      const zc = (z0 + z1) / 2;
      gb.add(new THREE.CylinderGeometry(2.0, 2.0, 1.0, 16).translate(GATE_X + 3, 11.6, zc), col("#e6dcc8"));
      gb.add(new THREE.SphereGeometry(2.0, 16, 8, 0, TAU, 0, Math.PI / 2).scale(1, 1.3, 1).translate(GATE_X + 3, 12.1, zc), tx("dome", domeTex));
      gb.add(new THREE.CylinderGeometry(0.06, 0.06, 4, 6).translate(GATE_X + 3, 15.5, zc), col("#4a4050"));
      for (const y of [3, 6.5]) gb.add(quad(V(GATE_X - 0.31, y, zc - 0.7), V(GATE_X - 0.31, y, zc + 0.7), V(GATE_X - 0.31, y + 1.8, zc + 0.7), V(GATE_X - 0.31, y + 1.8, zc - 0.7)), col("#4a5a7a"));
    }
    gb.add(boxGeo(V(GATE_X - 0.5, 9.4, -1.6), V(GATE_X + 6.5, 9.9, 5.6)), col("#d6c9b0"));
    const gs = unlit("gateSign", () => textTex("gate", "MARATHON GATE", 1024, 180, "#2f6b4f", "#fff6e0", { border: "#f2c84a", shadow: "#173a28" }));
    gb.add(quad(V(GATE_X - 0.32, 7.45, -1.2), V(GATE_X - 0.32, 7.45, 5.2), V(GATE_X - 0.32, 8.95, 5.2), V(GATE_X - 0.32, 8.95, -1.2)), gs);
    gb.add(quad(V(GATE_X + 6.02, 7.45, 5.2), V(GATE_X + 6.02, 7.45, -1.2), V(GATE_X + 6.02, 8.95, -1.2), V(GATE_X + 6.02, 8.95, 5.2)), gs);
    gb.build(root, false);
  }
  // outer wall round the bends + back straight
  const wallPts: THREE.Vector3[] = [V(GATE_X + 6, 0, -6)];
  for (let k = 0; k <= 24; k++) { const a = THREE.MathUtils.degToRad(30 - (k / 24) * 120); wallPts.push(V(SX + Math.cos(a) * (BR + HW + 4), 0, BZ + Math.sin(a) * (BR + HW + 4))); }
  wallPts.push(V(-SX, 0, BZ - (BR + HW + 4)));
  for (let k = 1; k <= 24; k++) { const a = THREE.MathUtils.degToRad(-90 - (k / 24) * 180); wallPts.push(V(-SX + Math.cos(a) * (BR + HW + 4), 0, BZ + Math.sin(a) * (BR + HW + 4))); }
  wallPts.push(V(GS0, 0, FR));
  for (let i = 0; i < wallPts.length - 1; i++) {
    const a = wallPts[i], c = wallPts[i + 1], L = a.distanceTo(c), n = V(c.z - a.z, 0, a.x - c.x).normalize().multiplyScalar(0.2);
    b.add(scaleUV(quad(a.clone().add(n), c.clone().add(n), c.clone().add(n).setY(2.6), a.clone().add(n).setY(2.6)), L / 2.5, 1), wallM);
    b.add(scaleUV(quad(c.clone().sub(n), a.clone().sub(n), a.clone().sub(n).setY(2.6), c.clone().sub(n).setY(2.6)), L / 2.5, 1), wallM);
    b.add(rodGeo([a.x, 2.7, a.z], [c.x, 2.7, c.z], 0.2, 4), postBand);
    if (i % 3 === 0) b.add(boxGeo(V(a.x - 0.18, 0, a.z - 0.18), V(a.x + 0.18, 2.9, a.z + 0.18)), postBand);
  }
  // back-straight bleacher (open, no roof)
  const BB = { x0: -42, x1: 42, z0: -69.2, rows: 6 };
  for (let i = 0; i < BB.rows; i++) { const z = BB.z0 - i * 0.9, y = 1.9 + i * 0.5; b.add(scaleUV(boxGeo(V(BB.x0, 0, z - 0.9), V(BB.x1, y, z)), 84 / 2.5, 1), wood); b.add(boxGeo(V(BB.x0, y + 0.38, z - 0.5), V(BB.x1, y + 0.44, z - 0.15)), creamB); }
  // ===== crowd =====
  const seats: Seat[] = [];
  const addSeat = (x: number, y: number, z: number, yaw: number) => seats.push({ x, y, z, yaw, wav: r(), ph: r() * 10, side: r() < 0.5 ? -1 : 1, hat: r() < 0.08 ? -1 : Math.floor(r() * HATS.length), jump: 0.4 + r() * 0.6 });
  for (let i = 0; i < NROW; i++) { const y = STEP0 + i * RISE + 0.4, z = ROW0 + i * ROWD + 0.3; for (let x = GS0 + 0.5; x < GS1 - 0.4; x += 0.6 + r() * 0.14) { if (AISLES.some((a) => Math.abs(x - a) < 0.85) || r() < 0.05) continue; addSeat(x, y, z, 0); } }
  for (let i = 0; i < BB.rows; i++) { const y = 1.9 + i * 0.5 + 0.4, z = BB.z0 - i * 0.9 - 0.32; for (let x = BB.x0 + 0.5; x < BB.x1 - 0.4; x += 0.62 + r() * 0.18) { if (r() < 0.08) continue; addSeat(x, y, z, Math.PI); } }
  const people = crowd(root, seats);
  // ===== bunting swags, rosettes, string lights, pennants, flags =====
  const swagM = cut("swag", swagTex), rosM = unlit("rosette", rosetteTex, 1, true);
  const swags: THREE.Mesh[] = [];
  for (let i = 0; i < POSTS.length - 1; i++) {
    for (const [y, z, h] of [[EAVE_Y - 0.62, EAVE_Z - 0.05, 1.2], [2.1, FR - 0.06, 0.75]] as [number, number, number][]) {
      const w = 6; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0).rotateY(Math.PI), swagM); m.position.set(POSTS[i] + 3, y, z); m.castShadow = true; root.add(m); swags.push(m);
    }
    const rm = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20).rotateY(Math.PI), rosM); rm.position.set(POSTS[i], EAVE_Y - 0.62, EAVE_Z - 0.1); root.add(rm);
  }
  const bulbs = stringLights(root, [GS0 + 0.5, EAVE_Y - 0.25, FR + 0.3], [FIN_X - 7.5, EAVE_Y - 0.25, FR + 0.3], 0.5, 18, "#ffd27a", ["#ffd27a", "#ffb0a0", "#fff2c0"]);
  const bulbs2 = stringLights(root, [FIN_X + 7.5, EAVE_Y - 0.25, FR + 0.3], [GS1 - 0.5, EAVE_Y - 0.25, FR + 0.3], 0.5, 18, "#ffd27a", ["#ffd27a", "#ffb0a0", "#fff2c0"]);
  const cloths: Cloth[] = [];
  const pole = (x: number, y: number, z: number, h: number, flagW: number, tex: THREE.Material, amp = 0.18) => {
    b.add(new THREE.CylinderGeometry(0.05, 0.07, h, 6).translate(x, y + h / 2, z), col("#f2ead8")); b.add(new THREE.SphereGeometry(0.1, 8, 6).translate(x, y + h, z), goldM);
    const g = new THREE.Group(); g.position.set(x, y + h - 0.12, z); g.rotation.y = 0.5 + r() * 0.4; root.add(g); cloths.push(cloth(g, flagW, flagW * 0.28, tex, amp, r() * 10));
  };
  for (let x = GS0 + 3; x < GS1; x += 8) { if (Math.abs(x - FIN_X) < 6) continue; pole(x, RIDGE_Y, RIDGE_Z, 2.6, 2.4, cut("pen" + (cloths.length % 5), () => pennantTex(PEN_COLS[cloths.length % 5]))); }
  const usM = ds("usflag", usFlagTex);
  { const g = new THREE.Group(); b.add(new THREE.CylinderGeometry(0.06, 0.08, 5, 6).translate(FIN_X, EAVE_Y + 5.0, EAVE_Z + 2.4), col("#f2ead8")); b.add(new THREE.SphereGeometry(0.14, 8, 6).translate(FIN_X, EAVE_Y + 7.55, EAVE_Z + 2.4), goldM); g.position.set(FIN_X, EAVE_Y + 7.3, EAVE_Z + 2.4); g.rotation.y = 0.35; root.add(g); cloths.push(cloth(g, 3.0, 1.6, usM, 0.25, 2)); }
  for (const zc of [-3.75, 8.15]) { const g = new THREE.Group(); g.position.set(GATE_X + 3, 17.3, zc); g.rotation.y = -0.4; root.add(g); cloths.push(cloth(g, 2.2, 1.2, usM, 0.22, zc)); }
  // bunting strings along the east wall + over the gate
  const buntings: Bunting[] = [
    bunting(root, [GS1, 3.4, FR - 0.1], [GATE_X - 0.3, 3.4, FR - 0.1], 0.6, ["#c8352e", "#f6f0e2", "#2b4f9a"], 0.4),
    bunting(root, [GATE_X - 0.5, 10.75, -6], [GATE_X - 0.5, 10.75, 10.6], 0.7, ["#c8352e", "#f6f0e2", "#2b4f9a", "#f2c84a"], 0.45),
    bunting(root, [FIN_X - 7, EAVE_Y + 2.3, EAVE_Z - 0.7], [FIN_X + 7, EAVE_Y + 2.3, EAVE_Z - 0.7], 0.8, ["#c8352e", "#f6f0e2", "#2b4f9a"], 0.4),
  ];
  // ===== START: starter's stand + smoke =====
  {
    const M = at(STARTER[0], 0, STARTER[2]), wd = tx("standBeam", beamHD);
    b.add(boxGeo(V(-0.65, 0.9, -0.65), V(0.65, 1.0, 0.65)), wood, M);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(boxGeo(V(sx * 0.58 - 0.06, 0, sz * 0.58 - 0.06), V(sx * 0.58 + 0.06, 1.95, sz * 0.58 + 0.06)), wd, M);
    for (const y of [1.45, 1.9]) { b.add(boxGeo(V(-0.64, y, 0.52), V(0.64, y + 0.06, 0.6)), postM, M); b.add(boxGeo(V(-0.64, y, -0.6), V(-0.52, y + 0.06, 0.6)), postM, M); }
    for (const sx of [-1, 1]) b.add(rodGeo([sx * 0.58, 0.1, -0.58], [-sx * 0.58, 0.85, -0.58], 0.03), wd, M);
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(0.66 + k * 0.22, 0, -0.45), V(0.9 + k * 0.22, 0.9 - k * 0.22, 0.45)), wood, M);
    b.add(faceZ(-0.6, 0.6, 0.15, 0.8, -0.661), unlit("starterSign", () => textTex("starter", "STARTER", 512, 200, "#c8352e", "#fff6e0", { border: "#f6efe0" })), M);
    b.add(boxGeo(V(-0.66, 0.0, -0.66), V(0.66, 0.06, 0.66)), wood, M);
  }
  const smokeCen: V3 = [STARTER[0] - 0.25, 3.05, STARTER[2] - 0.35];
  const puffM = mat("stdPuff", () => new THREE.MeshBasicMaterial({ color: "#f3efe8" })), puffG = new THREE.IcosahedronGeometry(0.5, 2);
  const smoke = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Mesh(puffG, puffM); m.scale.setScalar(0.001); m.userData = { dx: Math.cos(i * 2.1) * 0.4, dy: Math.sin(i * 1.7) * 0.28 + 0.12, dz: Math.sin(i * 3.3) * 0.2, s: 0.32 + (i % 3) * 0.12 }; root.add(m); return m; });
  const flash = glow(root, smokeCen, "#ffd27a", 1.2, 0);
  // ===== the COURSE MAP board =====
  const mapG = new THREE.Group(); mapG.position.set(MAP_C[0], 0, MAP_C[2]); mapG.rotation.y = Math.PI; root.add(mapG);
  {
    const mb = new Batch(), wd = tx("standBeam", beamHD);
    for (const sx of [-1, 1]) mb.add(boxGeo(V(sx * 2.4 - 0.16, 0, -0.4), V(sx * 2.4 + 0.16, MAP_Y0 + MAP_H + 0.5, -0.08)), wd);
    mb.add(boxGeo(V(-MAP_W / 2 - 0.18, MAP_Y0 - 0.18, -0.08), V(MAP_W / 2 + 0.18, MAP_Y0 + MAP_H + 0.18, 0.0)), tx("mapFrame", () => boardsH("stdMapFrame", "#7a4a2a", 0.5)));
    mb.add(boxGeo(V(-MAP_W / 2 - 0.25, MAP_Y0 + MAP_H + 0.18, -0.4), V(MAP_W / 2 + 0.25, MAP_Y0 + MAP_H + 0.3, 0.25)), postBand);
    mb.add(quad(V(-MAP_W / 2 - 0.4, MAP_Y0 + MAP_H + 0.3, 0.55), V(MAP_W / 2 + 0.4, MAP_Y0 + MAP_H + 0.3, 0.55), V(MAP_W / 2 + 0.4, MAP_Y0 + MAP_H + 0.85, -0.25), V(-MAP_W / 2 - 0.4, MAP_Y0 + MAP_H + 0.85, -0.25), 2, 1), roofM);
    mb.add(boxGeo(V(-MAP_W / 2 - 0.1, MAP_Y0 - 0.32, -0.05), V(MAP_W / 2 + 0.1, MAP_Y0 - 0.2, 0.3)), wd);
    mb.build(mapG);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(MAP_W, MAP_H), unlit("courseMap", mapTex, 0.97)); face.position.set(0, MAP_Y0 + MAP_H / 2, 0.012); mapG.add(face);
  }
  const wellIcon = new THREE.Mesh(new THREE.PlaneGeometry(WELL_S, WELL_S), unlit("wellIcon", wellTex, 0.98, true)); wellIcon.position.set(...STADIUM_WELL); wellIcon.position.z -= 0.005; wellIcon.rotation.y = Math.PI; root.add(wellIcon);
  const ringM = new THREE.MeshBasicMaterial({ map: ringTex(), color: new THREE.Color("#ffd27a").multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const wellRing = new THREE.Mesh(new THREE.PlaneGeometry(WELL_S * 1.5, WELL_S * 1.5), ringM); wellRing.position.set(STADIUM_WELL[0], STADIUM_WELL[1], STADIUM_WELL[2] - 0.02); wellRing.rotation.y = Math.PI; wellRing.layers.set(NOINK); wellRing.renderOrder = 5; root.add(wellRing);
  const wellHalo = glow(root, [STADIUM_WELL[0], STADIUM_WELL[1], STADIUM_WELL[2] - 0.05], "#ffcf6a", WELL_S * 3, 0);
  // ===== THERMOMETER =====
  const thermoG = new THREE.Group(); thermoG.position.set(...THERMO); thermoG.rotation.y = Math.PI; root.add(thermoG);
  let mercury: THREE.Mesh;
  {
    const tb = new Batch(), wd = tx("standBeam", beamHD), Y0 = 0.6;
    tb.add(boxGeo(V(-0.13, 0, -0.34), V(0.13, Y0 + THERM_B + 0.3, -0.08)), wd);
    tb.add(boxGeo(V(-0.48, Y0 - 0.06, -0.08), V(0.48, Y0 + THERM_B + 0.06, 0.0)), tx("thermoFrame", () => boardsV("stdThermoFrame", "#2f6b4f", 0.85)));
    tb.add(boxGeo(V(-0.6, Y0 + THERM_B + 0.06, -0.12), V(0.6, Y0 + THERM_B + 0.16, 0.16)), goldM);
    tb.add(boxGeo(V(-0.26, 0, -0.06), V(0.26, 0.12, 0.5)), wd);
    tb.build(thermoG);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.88, THERM_B), unlit("thermoFace", thermoTex, 0.97)); face.position.set(0, Y0 + THERM_B / 2, 0.01); thermoG.add(face);
    const glass = mat("stdGlassT", () => twoTone(new THREE.MeshPhongMaterial({ color: "#e8f4fa", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.16, depthWrite: false })));
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, T_HI - T_LO + 0.3, 14).translate(0, Y0 + (T_HI + T_LO) / 2 + 0.05, 0), glass); tube.position.z = 0.11; thermoG.add(tube);
    const red = mat("stdMercury", () => new THREE.MeshBasicMaterial({ map: ctex("stdMercuryT", 128, 32, (g) => { const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, "#9a1a1e"); gr.addColorStop(0.3, "#e8382c"); gr.addColorStop(0.45, "#ff9a80"); gr.addColorStop(0.6, "#e8382c"); gr.addColorStop(1, "#8a1618"); g.fillStyle = gr; g.fillRect(0, 0, 128, 32); }) }));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), red); bulb.position.set(0, Y0 + T_LO - 0.12, 0.12); bulb.castShadow = true; thermoG.add(bulb);
    mercury = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 1, 10).translate(0, 0.5, 0), red); mercury.position.set(0, Y0 + T_LO - 0.05, 0.11); thermoG.add(mercury);
    // sun emblem on top
    const sun = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), unlit("thermoSun", () => ctex("stdThermoSun", 256, 256, (g) => { g.fillStyle = "#f2b43a"; for (let i = 0; i < 12; i++) { g.save(); g.translate(128, 128); g.rotate((i / 12) * TAU); g.beginPath(); g.moveTo(-14, -80); g.lineTo(0, -124); g.lineTo(14, -80); g.fill(); g.restore(); } g.beginPath(); g.arc(128, 128, 82, 0, TAU); g.fill(); g.strokeStyle = "#a8501a"; g.lineWidth = 6; g.stroke(); g.fillStyle = "#7a3a12"; for (const x of [104, 152]) { g.beginPath(); g.arc(x, 116, 9, 0, TAU); g.fill(); } g.lineWidth = 7; g.strokeStyle = "#7a3a12"; g.beginPath(); g.arc(128, 140, 28, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }), 1, true));
    sun.position.set(0, Y0 + THERM_B + 0.62, 0.17); thermoG.add(sun);
  }
  const THERM_TOP: V3 = [THERMO[0], 0.6 + THERM_B + 0.6, THERMO[2] - 0.2];
  const heatGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: warmGlowTex(), transparent: true, opacity: 0, depthWrite: false, fog: false })); heatGlow.scale.set(2.2, 2.2, 1); heatGlow.position.set(THERM_TOP[0], THERM_TOP[1], THERM_TOP[2] + 0.3); heatGlow.layers.set(NOINK); heatGlow.renderOrder = 3; root.add(heatGlow);
  const heatLines = new THREE.SpriteMaterial({ map: heatTex(), transparent: true, opacity: 0, depthWrite: false, fog: false });
  const shimM = new THREE.SpriteMaterial({ map: shimmerTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const shimmers = Array.from({ length: 2 }, (_, i) => { const s = new THREE.Sprite(heatLines.clone()); s.scale.set(0.9, 0.9, 1); s.layers.set(NOINK); s.renderOrder = 4; s.userData.ph = i / 2; root.add(s); return s; });
  // ===== ORGANIZER'S TABLE (umbrella, jug, glasses, ledger, THIRST STUDY) =====
  const UMB: V3 = [TABLE[0] + 0.72, 0, TABLE[2] + 0.28]; const umbr = new THREE.Group(); umbr.position.set(...UMB); root.add(umbr);
  {
    const M = at(TABLE[0], 0, TABLE[2]), wd = tx("tableWood", () => boardsH("stdTable", "#8a5a34", 0.45));
    tableGeo(b, M, 1.8, 0.9, 0.78, wd, wd);
    b.add(boxGeo(V(-0.9, 0.36, -0.47), V(0.9, 0.74, -0.44)), wd, M);
    b.add(quad(V(0.82, 0.38, -0.475), V(-0.82, 0.38, -0.475), V(-0.82, 0.73, -0.475), V(0.82, 0.73, -0.475)), unlit("thirst", () => textTex("thirst", "THIRST STUDY", 1024, 220, "#f6eed6", "#7a1e22", { border: "#7a1e22" })));
    chairGeo(b, at(TABLE[0] + 0.55, 0, TABLE[2] + 0.95, Math.PI + 0.25), wd);
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 2.75, 8).translate(UMB[0], 1.375, UMB[2]), col("#f2ead8")); b.add(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 12).translate(UMB[0], 0.06, UMB[2]), col("#4a4050"));
    // jug (glass with water), glasses, ledger, spare bucket + crates
    const glassM = mat("stdGlassJ", () => twoTone(new THREE.MeshPhongMaterial({ color: "#d8eef6", specular: "#ffffff", shininess: 100, transparent: true, opacity: 0.55 })));
    const waterM = mat("stdWaterJ", () => twoTone(new THREE.MeshPhongMaterial({ color: "#4a9ad8", specular: "#ffffff", shininess: 90 })));
    const prof = [V(0, 0, 0), V(0.09, 0, 0), V(0.11, 0.06, 0), V(0.11, 0.2, 0), V(0.08, 0.27, 0), V(0.07, 0.31, 0), V(0.085, 0.34, 0)].map((p) => new THREE.Vector2(p.x, p.y));
    const jug = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), glassM); jug.position.set(TABLE[0] + 0.35, 0.78, TABLE[2] - 0.22); jug.castShadow = true; root.add(jug);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.085, 0.2, 18).translate(0, 0.11, 0), waterM); water.position.copy(jug.position); root.add(water);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 12, Math.PI), glassM); handle.rotation.z = -Math.PI / 2; handle.position.set(TABLE[0] + 0.47, 0.98, TABLE[2] - 0.22); root.add(handle);
    for (const [dx, dz, full] of [[0.6, -0.1, 0], [0.12, -0.25, 0], [0.7, 0.15, 1]] as [number, number, number][]) {
      const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.034, 0.11, 12, 1, true).translate(0, 0.055, 0), glassM); gl.position.set(TABLE[0] + dx, 0.78, TABLE[2] + dz); root.add(gl);
      if (full) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.033, 0.08, 12).translate(0, 0.04, 0), waterM); w.position.copy(gl.position); root.add(w); }
    }
    const led = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.39).rotateX(-Math.PI / 2), lam("stdLedgerM", () => ({ map: ledgerTex() }))); led.position.set(TABLE[0] - 0.35, 0.795, TABLE[2] + 0.08); led.rotation.y = Math.PI; root.add(led);
    b.add(boxGeo(V(-0.33, 0.78, -0.21), V(0.33, 0.792, 0.21)), col("#7a1e22"), at(TABLE[0] - 0.35, 0, TABLE[2] + 0.08));
    b.add(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 4).rotateZ(1.3).translate(TABLE[0] - 0.05, 0.81, TABLE[2] + 0.12), col("#2a2030")); // pen
    b.add(new THREE.CylinderGeometry(0.2, 0.17, 0.32, 14).translate(TABLE[0] + 1.25, 0.16, TABLE[2] + 0.3), tx("bucket", () => boardsV("stdBucket", "#6a4a30", 0.6)));
    for (const [dx, dz, s] of [[1.3, 0.95, 0.55], [1.25, 1.0, 0.4]] as [number, number, number][]) b.add(boxGeo(V(-s / 2, 0, -s / 2), V(s / 2, s, s / 2)), tx("crate", beamHD), at(TABLE[0] + dx, dz > 0.97 ? 0.55 : 0, TABLE[2] + dz, 0.3));
    // striped umbrella (canopy + scalloped valance, wobbles in the breeze)
    const canopyM = ds("umbr", () => ctex("stdUmbr", 512, 256, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f6efe0" : "#c8352e"; g.fillRect(i * 32, 0, 33, 256); } const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,0.2)"); gr.addColorStop(1, "rgba(60,20,20,0.15)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); }));
    const can = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 16, 1, true).translate(0, 2.5, 0), canopyM); can.castShadow = true; umbr.add(can);
    const val = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.22, 16, 1, true).translate(0, 2.09, 0), cut("umbrVal", () => ctex("stdUmbrVal", 512, 64, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f6efe0" : "#c8352e"; g.fillRect(i * 32, 0, 33, 40); g.beginPath(); g.arc(i * 32 + 16, 40, 16, 0, Math.PI); g.fill(); } }))); val.castShadow = true; umbr.add(val);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), goldM); tip.position.y = 2.82; umbr.add(tip);
  }
  // ===== FINISH: posts, tape, gantry + banner, timekeepers, medal table, podium =====
  for (const z of [-5.1, 5.1]) { b.add(new THREE.CylinderGeometry(0.07, 0.08, 1.4, 10).translate(FIN_X, 0.7, z), postM); for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.085, 0.085, 0.1, 10).translate(FIN_X, 0.2 + k * 0.33, z), redM); b.add(new THREE.SphereGeometry(0.1, 10, 8).translate(FIN_X, 1.43, z), goldM); }
  for (const z of [-6.0, 6.2]) { b.add(new THREE.CylinderGeometry(0.1, 0.12, 5.6, 10).translate(FIN_X, 2.8, z), postM); b.add(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 10).translate(FIN_X, 0.25, z), postBand); b.add(new THREE.SphereGeometry(0.16, 10, 8).translate(FIN_X, 5.68, z), goldM); }
  const finBanner = new THREE.Group(); finBanner.position.set(FIN_X, 5.5, 0.1); root.add(finBanner);
  {
    const banTex = unlit("finishBan", () => textTex("finish", "FINISH", 1600, 160, "#c8352e", "#fff6e0", { border: "#f6efe0", shadow: "#6a1a18", size: 0.74 }), 0.96);
    const fb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.2, 12.1).translate(0, -0.6, 0), col("#7a1e22")); fb.castShadow = true; finBanner.add(fb);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.1).rotateY(s * Math.PI / 2).translate(s * 0.04, -0.6, 0), banTex); finBanner.add(f); }
    for (const z of [-5.6, 0, 5.6]) finBanner.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 4).translate(0, 0.1, z), col("#3a3440")));
  }
  // tape: two ribbons anchored at the posts
  const TAPE_Y = 1.18, NS = 22;
  const tapeM = mat("stdTape", () => twoTone(new THREE.MeshLambertMaterial({ color: "#fbf6ea", side: THREE.DoubleSide })));
  const tapes = [-1, 1].map((s) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(NS * 2 * 3), 3)); const idx: number[] = []; for (let i = 0; i < NS - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); g.setIndex(idx); const m = new THREE.Mesh(g, tapeM); m.castShadow = true; m.frustumCulled = false; root.add(m); return { m, s }; });
  // timekeepers' table + three big clocks
  const hands: THREE.Group[] = [];
  {
    const M = at(TIMEK[0], 0, TIMEK[2]), wd = tx("tableWood", () => boardsH("stdTable", "#8a5a34", 0.45));
    tableGeo(b, M, 2.4, 0.8, 0.78, tx("baize", () => ctex("stdBaize", 256, 256, (g, r) => { g.fillStyle = "#2f6b4f"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"; g.fillRect(r() * 256, r() * 256, 2, 2); } })), wd);
    b.add(boxGeo(V(-1.2, 0.36, -0.42), V(1.2, 0.74, -0.39)), wd, M);
    b.add(quad(V(1.1, 0.38, -0.425), V(-1.1, 0.38, -0.425), V(-1.1, 0.73, -0.425), V(1.1, 0.73, -0.425)), unlit("timeSign", () => textTex("timek", "OFFICIAL TIME", 1024, 160, "#f6eed6", "#2b2a4a", { border: "#2b2a4a" })), M);
    const dialM = unlit("dial", dialTex, 0.98);
    for (const dx of [-0.75, 0, 0.75]) {
      b.add(boxGeo(V(dx - 0.05, 0.78, -0.05), V(dx + 0.05, 1.05, 0.05)), goldM, M);
      const cg = new THREE.Group(); cg.position.set(TIMEK[0] + dx, 1.33, TIMEK[2]); cg.rotation.set(-0.12, Math.PI, 0); root.add(cg);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 28).rotateX(Math.PI / 2), goldM); rim.position.z = 0.03; rim.castShadow = true; cg.add(rim);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.28, 28), dialM); face.position.z = 0.075; cg.add(face);
      const hand = new THREE.Group(); hand.position.z = 0.085; cg.add(hand);
      const hm = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.24, 0.006).translate(0, 0.1, 0), col("#c8352e")); hand.add(hm);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.16, 0.006).translate(0, 0.07, -0.004), col("#2a1c2c")); hb.rotation.z = 1.1 + dx; cg.add(hb); hb.position.z = 0.08;
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10), goldM); knob.position.y = 0.34; cg.add(knob);
      hands.push(hand);
    }
    chairGeo(b, at(TIMEK[0] + 1.6, 0, TIMEK[2] + 0.5, Math.PI + 0.5), wd);
    b.add(new THREE.CylinderGeometry(0.07, 0.09, 0.1, 12).translate(TIMEK[0] + 1.0, 0.83, TIMEK[2] + 0.2), goldM); b.add(new THREE.SphereGeometry(0.05, 10, 8).translate(TIMEK[0] + 1.0, 0.9, TIMEK[2] + 0.2), goldM);
  }
  // medal table: velvet cushion, gold medal with ribbon, trophy cup, laurel wreath
  let medal: THREE.Group;
  {
    const M = at(MEDAL[0], 0, MEDAL[2]), wd = tx("tableWood", () => boardsH("stdTable", "#8a5a34", 0.45));
    tableGeo(b, M, 1.5, 0.8, 0.82, wd, wd);
    b.add(boxGeo(V(-0.78, 0.4, -0.43), V(0.78, 0.82, 0.43)), cut("tableCloth", () => ctex("stdTCloth", 256, 128, (g) => { g.fillStyle = "#f6efe0"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#2b4f9a"; g.fillRect(0, 0, 256, 18); g.fillStyle = "#c8352e"; g.fillRect(0, 18, 256, 8); for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(120,100,80,0.15)"; g.fillRect(x, 26, 8, 102); } })), M);
    const vel = mat("stdVelvet", () => twoTone(new THREE.MeshPhongMaterial({ color: "#8e1a2a", specular: "#e08090", shininess: 12 })));
    const cush = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 10).scale(1, 0.38, 0.8), vel); cush.position.set(MEDAL[0] - 0.15, 0.9, MEDAL[2]); cush.castShadow = true; root.add(cush); const pip = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.014, 6, 32).rotateX(Math.PI / 2).scale(1, 1, 0.8), goldM); pip.position.set(MEDAL[0] - 0.15, 0.9, MEDAL[2]); root.add(pip);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const ts = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 8), goldM); ts.position.set(MEDAL[0] - 0.15 + sx * 0.25, 0.86, MEDAL[2] + sz * 0.19); ts.rotation.x = Math.PI; root.add(ts); }
    medal = new THREE.Group(); medal.position.set(MEDAL[0] - 0.15, 1.085, MEDAL[2] - 0.1); medal.rotation.x = -0.55; root.add(medal);
    const goldBright = shiny("goldBright", "#f2c84a", 110);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.018, 32).rotateX(Math.PI / 2), goldBright); disc.castShadow = true; medal.add(disc);
    const mface = new THREE.Mesh(new THREE.CircleGeometry(0.094, 32).rotateY(Math.PI), mat("stdMedalFace", () => twoTone(new THREE.MeshPhongMaterial({ map: ctex("stdMedalT", 256, 256, (g) => {
      const gr = g.createRadialGradient(100, 90, 10, 128, 128, 128); gr.addColorStop(0, "#fff0a8"); gr.addColorStop(0.6, "#f2c84a"); gr.addColorStop(1, "#b8862a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "#9a6a1a"; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.stroke();
      g.fillStyle = "#a8781e"; for (let k = 0; k < 14; k++) { for (const sd of [-1, 1]) { const a = Math.PI / 2 + sd * (0.35 + k * 0.17); g.save(); g.translate(128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); g.rotate(a + sd * 0.6); g.beginPath(); g.ellipse(0, 0, 13, 6, 0, 0, TAU); g.fill(); g.restore(); } }
      g.fillStyle = "#7a5212"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "1904", 128, 112, 130, 52, SERIF); fitText(g, "MARATHON", 128, 160, 120, 22, SERIF);
    }), specular: "#fff4c8", shininess: 80 })))); mface.position.z = -0.0095; medal.add(mface);
    
    const rib = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.24).translate(0, 0.17, 0), ds("ribbon", () => ctex("stdRibbon", 64, 128, (g) => { g.fillStyle = "#2b4f9a"; g.fillRect(0, 0, 64, 128); g.fillStyle = "#f6f0e2"; g.fillRect(18, 0, 28, 128); g.fillStyle = "#c8352e"; g.fillRect(26, 0, 12, 128); }))); medal.add(rib);
    // trophy cup
    const cupProf = [[0, 0], [0.09, 0], [0.09, 0.03], [0.03, 0.06], [0.025, 0.16], [0.06, 0.2], [0.11, 0.3], [0.12, 0.38], [0.11, 0.38]].map(([x, y]) => new THREE.Vector2(x, y));
    const cup = new THREE.Mesh(new THREE.LatheGeometry(cupProf, 22), goldBright); cup.position.set(MEDAL[0] + 0.45, 0.82, MEDAL[2] + 0.05); cup.castShadow = true; root.add(cup);
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), goldBright); h.position.set(MEDAL[0] + 0.45 + s * 0.12, 1.1, MEDAL[2] + 0.05); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; root.add(h); }
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 20).rotateX(Math.PI / 2), col("#4f8a3a")); wreath.position.set(MEDAL[0] - 0.55, 0.85, MEDAL[2] + 0.12); root.add(wreath);
  }
  // podium
  {
    const M = at(PODIUM[0], 0, PODIUM[2]), wd = tx("podium", () => boardsH("stdPodium", "#f6efe0", 0.7));
    b.add(boxGeo(V(-0.65, 0, -0.5), V(0.65, 0.42, 0.5)), wd, M);
    b.add(boxGeo(V(-0.68, 0.42, -0.53), V(0.68, 0.46, 0.53)), col("#2b4f9a"), M);
    b.add(quad(V(0.6, 0.04, -0.505), V(-0.6, 0.04, -0.505), V(-0.6, 0.4, -0.505), V(0.6, 0.4, -0.505)), unlit("podium1", () => textTex("podium1", "1st", 400, 120, "#f2c84a", "#7a1e22", { border: "#7a1e22" })), M);
  }
  // ===== infield: brass band on a bandstand, hurdles, roller, judge's bell =====
  const band: { g: THREE.Group; ph: number; inst: THREE.Object3D | null }[] = [];
  let glints: THREE.Sprite[] = [];
  {
    const M = at(BAND[0], 0, BAND[2]);
    b.add(new THREE.CylinderGeometry(3.4, 3.5, 0.5, 8).translate(0, 0.25, 0), tx("bandDeck", () => boardsH("stdBandDeck", "#f6efe0", 0.55)), M);
    b.add(new THREE.CylinderGeometry(3.45, 3.45, 0.06, 8).translate(0, 0.52, 0), postBand, M);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + Math.PI / 8; if (k === 2) continue; b.add(new THREE.CylinderGeometry(0.07, 0.07, 3.3, 8).translate(Math.cos(a) * 3.2, 2.15, Math.sin(a) * 3.2), postM, M); }
    b.add(new THREE.ConeGeometry(3.9, 1.3, 8, 1, true).translate(0, 4.4, 0), ds("bandRoof", () => ctex("stdBandRoof", 512, 256, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f6efe0" : "#2b4f9a"; g.fillRect(i * 32, 0, 33, 256); } })), M);
    b.add(new THREE.SphereGeometry(0.16, 10, 8).translate(0, 5.1, 0), goldM, M);
    const goldI = shiny("brass", "#e8b84a", 100), uni = col("#b3262e"), white = col("#f6f2ea"), dark = col("#2a2440");
    const headM = mat("stdBandFace", () => twoTone(new THREE.MeshLambertMaterial({ map: faceTex() })));
    const players = 7, bells: V3[] = [];
    for (let k = 0; k < players; k++) {
      const a = (k / players) * TAU * 0.75 + Math.PI * 0.6, rr = k === 3 ? 0.4 : 1.9, g = new THREE.Group();
      g.position.set(BAND[0] + Math.cos(a) * rr, 0.53, BAND[2] + Math.sin(a) * rr);
      g.rotation.y = k === 3 ? Math.PI : Math.atan2(-Math.cos(a), -Math.sin(a)); root.add(g);
      const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; g.add(me); return me; };
      for (const sx of [-0.1, 0.1]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.62, 6).translate(sx, 0.31, 0), dark);
      add(new THREE.CapsuleGeometry(0.22, 0.38, 4, 10).scale(1.05, 1, 0.8).translate(0, 0.86, 0), uni);
      add(new THREE.BoxGeometry(0.06, 0.5, 0.02).rotateZ(0.6).translate(0, 0.9, -0.17), white);
      const hd = add(new THREE.SphereGeometry(0.2, 16, 12).scale(1, 1.2, 1).translate(0, 1.48, 0), headM); hd.rotation.y = 0;
      add(new THREE.CylinderGeometry(0.19, 0.19, 0.14, 12).translate(0, 1.72, 0), white); add(new THREE.BoxGeometry(0.26, 0.02, 0.14).translate(0, 1.66, -0.2), dark);
      let inst: THREE.Object3D | null = null;
      const ig = new THREE.Group(); ig.position.set(0, 1.1, -0.26); g.add(ig); inst = ig;
      const ia = (geo: THREE.BufferGeometry) => { const me = new THREE.Mesh(geo, goldI); me.castShadow = true; ig.add(me); };
      if (k === 0 || k === 5) { ia(new THREE.TorusGeometry(0.2, 0.06, 8, 18)); ia(new THREE.ConeGeometry(0.22, 0.4, 16, 1, true).translate(0, 0.4, 0.05)); bells.push([0, 0.6, 0]); }
      else if (k === 3) { const dm = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 24).rotateX(Math.PI / 2), lam("stdDrum", () => ({ map: ctex("stdDrumF", 256, 256, (gg) => { gg.fillStyle = "#f6efe0"; gg.fillRect(0, 0, 256, 256); gg.fillStyle = "#c8352e"; gg.fillRect(0, 0, 256, 40); gg.fillRect(0, 216, 256, 40); gg.fillStyle = "#2b4f9a"; gg.textAlign = "center"; gg.textBaseline = "middle"; fitText(gg, "FAIR BAND", 128, 128, 220, 46, SERIF); }) }))); dm.castShadow = true; ig.add(dm); ig.position.set(0, 0.95, -0.4); }
      else { ia(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8).rotateX(Math.PI / 2 - 0.3).translate(0, 0.08, -0.2)); ia(new THREE.ConeGeometry(0.08, 0.16, 12, 1, true).rotateX(-Math.PI / 2 - 0.3).translate(0, 0.16, -0.48)); bells.push([0, 0.16, -0.5]); }
      g.traverse((o) => { (o as THREE.Mesh).receiveShadow = true; });
      band.push({ g, ph: k * 0.9, inst });
    }
    glints = sparkles(root, 10, [BAND[0], 1.6, BAND[2]], 3.4, 0.8, 3.4, 7, 0.45);
    // hurdles + lawn roller
    for (let k = 0; k < 3; k++) { const hM = at(BAND[0] - 7 + k * 0.25, 0, BAND[2] + 4.5 + k * 0.1, 0.1); b.add(boxGeo(V(-0.6, 0.72, -0.03), V(0.6, 0.86, 0.03)), postM, hM); for (const sx of [-1, 1]) { b.add(boxGeo(V(sx * 0.58 - 0.03, 0, -0.03), V(sx * 0.58 + 0.03, 0.86, 0.03)), wood, hM); b.add(boxGeo(V(sx * 0.58 - 0.03, 0, -0.3), V(sx * 0.58 + 0.03, 0.05, 0.1)), wood, hM); } }
    b.add(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16).rotateZ(Math.PI / 2).translate(BAND[0] - 8, 0.35, BAND[2] - 3), col("#5a6070")); b.add(rodGeo([BAND[0] - 8, 0.35, BAND[2] - 3], [BAND[0] - 8, 1.1, BAND[2] - 4.4], 0.03), col("#3a3440"));
    void bells;
  }
  // ===== background: trees, palaces, Ferris wheel, balloon, clouds =====
  const leafM = tx("leafStd", () => leafTex("stdLeaf", "#5e9a46", "#86bc5a", "#3f7a36")), bark = col("#6e5040");
  for (let k = 0; k < 64; k++) { const a = (k / 64) * TAU + r() * 0.05, R = 115 + r() * 30, x = Math.cos(a) * R * 1.15, z = BZ + Math.sin(a) * R; if (x > 60 && Math.abs(z) < 16) continue; roundTree(b, x, z, 9 + r() * 6, k, leafM, bark); }
  for (let k = 0; k < 18; k++) { const x = GATE_X + 14 + k * 9 + r() * 3, s = k % 2 ? 1 : -1; roundTree(b, x, s * (12 + r() * 6), 7 + r() * 4, 200 + k, leafM, bark); }
  palace(b, -8, 165, 64, 30, 1.25, Math.PI, { dome: 15, towers: true });
  palace(b, -95, 150, 60, 26, 1.0, Math.PI + 0.35, { towers: true });
  palace(b, 80, 150, 56, 26, 1.0, Math.PI - 0.35, { dome: 9 });
  palace(b, -10, -215, 90, 30, 1.2, 0, { dome: 13, towers: true, tint: "#f4ecdc" });
  palace(b, -150, -175, 60, 28, 1.0, 0.5, { dome: 9 });
  palace(b, 150, -210, 64, 28, 1.0, -0.4, { towers: true, tint: "#f4ecdc" });
  palace(b, -200, -40, 60, 26, 1.0, Math.PI / 2, { dome: 10 });
  palace(b, 200, 70, 50, 26, 1.0, -Math.PI / 2 - 0.3, { towers: true });
  // Ferris wheel (turns slowly, cars hang level)
  const wheel = new THREE.Group(); wheel.position.set(118, 46, -175); wheel.rotation.y = 0.5; root.add(wheel);
  const wheelCars: THREE.Mesh[] = [];
  {
    const WR = 38, iron = col("#5a6a8a"), wb = new Batch();
    for (const zz of [-1.5, 1.5]) { wb.add(new THREE.TorusGeometry(WR, 0.35, 6, 64).translate(0, 0, zz), iron); wb.add(new THREE.TorusGeometry(WR * 0.92, 0.2, 6, 64).translate(0, 0, zz), iron); }
    for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; for (const zz of [-1.5, 1.5]) wb.add(rodGeo([0, 0, zz], [Math.cos(a) * WR, Math.sin(a) * WR, zz], 0.14, 4), iron); }
    wb.add(new THREE.CylinderGeometry(1.4, 1.4, 4, 12).rotateX(Math.PI / 2), col("#c8352e"));
    const spin = new THREE.Group(); wheel.add(spin); wb.build(spin); wheel.userData.spin = spin;
    for (let k = 0; k < 18; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 2.2).translate(0, -1.6, 0), col(["#c8352e", "#f2c84a", "#2b4f9a"][k % 3])); c.userData.a = (k / 18) * TAU; spin.add(c); wheelCars.push(c); }
    const legs = col("#4a5a7a"); for (const zz of [-3, 3]) for (const sx of [-1, 1]) b.add(rodGeo([0, 0, 0], [sx * 26, -46, zz * 2.5], 0.5, 6).applyMatrix4(new THREE.Matrix4().makeRotationY(0.5).setPosition(118, 46, -175)), legs);
  }
  const balloon = new THREE.Group(); balloon.position.set(-55, 52, -150); root.add(balloon);
  {
    const env = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16).scale(1, 1.18, 1), lam("stdBalloonM", () => ({ map: balloonTex() }))); env.castShadow = true; balloon.add(env);
    const neck = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.6, 16, 1, true).rotateX(Math.PI).translate(0, -6.4, 0), col("#c8352e")); balloon.add(neck);
    const bask = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4).translate(0, -10.4, 0), lam("stdBasket", () => ({ map: beamHD() }))); balloon.add(bask);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) balloon.add(new THREE.Mesh(rodGeo([sx * 1.9, -6.6, sz * 1.9], [sx * 0.65, -9.85, sz * 0.65], 0.04, 4), col("#5a4a3a")));
  }
  [[-250, 110, -520, 260, 1], [120, 95, -560, 220, 2], [380, 120, -300, 240, 3], [-420, 100, 120, 260, 0], [80, 130, 520, 280, 2], [420, 105, 300, 220, 1], [-380, 115, -360, 200, 3]].forEach(([x, y, z, w, s]) => cloudSprite(root, s, [x, y, z], w));
  const flock = birds(root, 7, [5, 22, -25], 26, "#f4f4f8", 1.2);
  // heat shimmer over the track (faint, additive)
  const trackShim = Array.from({ length: 6 }, (_, i) => { const s = new THREE.Sprite(shimM.clone()); s.scale.set(9, 1.6, 1); s.layers.set(NOINK); s.renderOrder = 4; s.userData = { x: -40 + i * 16, z: (i % 2 ? -2 : 2) }; root.add(s); return s; });
  // ===== payoff: confetti, streamers, thrown hats (flat cartoon sprites) =====
  const NC = 420, NSTR = 30, NHAT = 14;
  const confM = new THREE.MeshBasicMaterial({ map: confettiTex(), alphaTest: 0.4, side: THREE.DoubleSide });
  const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.14), confM, NC); conf.layers.set(NOINK); conf.frustumCulled = false; root.add(conf);
  const strM = new THREE.MeshBasicMaterial({ map: streamerTex(), alphaTest: 0.4, side: THREE.DoubleSide });
  const strs = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 1.2), strM, NSTR); strs.layers.set(NOINK); strs.frustumCulled = false; root.add(strs);
  const hatIM = [0, 1].map((k) => { const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.62, 0.39), new THREE.MeshBasicMaterial({ map: hatCardTex(k as 0 | 1), alphaTest: 0.4, side: THREE.DoubleSide }), NHAT / 2); m.layers.set(NOINK); m.frustumCulled = false; root.add(m); return m; });
  const CC = ["#ff4a3a", "#ffd23a", "#3a8aff", "#ffffff", "#3ad07a", "#ff7ac0", "#ff9a2a"], cc = new THREE.Color();
  const cParts = Array.from({ length: NC }, (_, i) => { conf.setColorAt(i, cc.set(CC[i % CC.length])); return { x: FIN_X - 9 + r() * 18, z: -6 + r() * 15, ph: r(), sp: 0.12 + r() * 0.08, rx: r() * 6, ry: r() * 6, sw: 0.4 + r() * 0.8 }; });
  const sParts = Array.from({ length: NSTR }, (_, i) => { strs.setColorAt(i, cc.set(CC[(i * 3) % CC.length])); return { x: FIN_X - 8 + r() * 16, z: -5 + r() * 13, ph: r(), sp: 0.07 + r() * 0.04, ry: r() * 6 }; });
  const hParts = Array.from({ length: NHAT }, () => ({ x0: FIN_X - 9 + r() * 18, ph: r(), sp: 0.28 + r() * 0.1, spin: (r() - 0.5) * 8, dz: 6 + r() * 5 }));
  const dd = new THREE.Object3D();
  // ===== build =====
  b.build(root);
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.layers.mask === 1) { (o as THREE.Mesh).receiveShadow = true; } });

  // ---------------- marks + cams ----------------
  const marks: Record<string, V3> = {
    // start: two rows of five behind the line (feet), facing +x
    ...Object.fromEntries(RUN_X.flatMap((x, ri) => RUN_Z.map((z, zi) => ["runner" + (ri * 5 + zi + 1), [x, 0, z] as V3]))),
    starter: [STARTER[0], 1.0, STARTER[2]], starterGround: [STARTER[0] - 1.2, 0, STARTER[2] - 0.6], startLine: [START_X, 0, 0],
    mapBoard: [MAP_C[0] - 1.8, 0, 8.1], mapViewer: [MAP_C[0] + 1.4, 0, 7.6], well: STADIUM_WELL,
    thermometer: [THERMO[0] - 0.9, 0, 8.2], organizer: [TABLE[0] - 0.35, 0, TABLE[2] + 0.92], thirstyRunner: [TABLE[0] + 0.32, 0, TABLE[2] - 0.98], jug: [TABLE[0] + 0.35, 0.78, TABLE[2] - 0.22],
    gate: [GATE_X + 3, 0, 2], gateOut: [GATE_X + 14, 0, 2],
    // finish (runners arrive from +x)
    winnerRun: [4, 0, 0.3], winner: [FIN_X - 0.9, 0, 0], handlerL: [FIN_X - 0.7, 0, -0.85], handlerR: [FIN_X - 0.7, 0, 0.85], judge: [FIN_X - 0.6, 0, 6.6],
    timekeeper1: [TIMEK[0] - 0.5, 0, TIMEK[2] + 0.85], timekeeper2: [TIMEK[0] + 0.6, 0, TIMEK[2] + 0.85],
    official1: [FIN_X + 2.2, 0, 6.3], official2: [FIN_X - 2.7, 0, 6.4], official3: [FIN_X - 4.0, 0, 5.8], medalOfficial: [MEDAL[0], 0, MEDAL[2] + 0.9], medal: [MEDAL[0] - 0.15, 0.95, MEDAL[2]],
    podium: [PODIUM[0], 0.46, PODIUM[2]], podiumFront: [PODIUM[0], 0, PODIUM[2] - 1.2],
    carPark: CARPARK, carSide: [CARPARK[0] + 0.4, 0, CARPARK[2] + 1.75], band: BAND,
    // extras at the front rail (feet on the apron, facing the track)
    ...Object.fromEntries([-41, -37, -33, -27, -23, -20.5, 3.5, 7, 11, 18, 22, 25.5].map((x, i) => ["rail" + (i + 1), [x, 0, FR - 0.55] as V3])),
  };
  const cams = {
    startWide: { pos: [23.5, 2.6, -9.5] as V3, look: [36, 1.6, 2.5] as V3, fov: 42 },
    starterLow: { pos: [32.6, 0.45, 3.6] as V3, look: [34.9, 2.4, 6.9] as V3, fov: 40 },
    mapBoard: { pos: [MAP_C[0], 3.6, -3.4] as V3, look: [MAP_C[0], 3.9, 9.7] as V3, fov: 40 },
    mapWell: { pos: [STADIUM_WELL[0], STADIUM_WELL[1], STADIUM_WELL[2] - 0.82] as V3, look: STADIUM_WELL, fov: 32 },
    thermometer: { pos: [51.0, 1.5, 4.7] as V3, look: [53.3, 2.9, 9.4] as V3, fov: 40 },
    thermoTable: { pos: [54.9, 1.95, -1.8] as V3, look: [54.75, 2.25, 8.6] as V3, fov: 42 },
    organizerOTS: { pos: [TABLE[0] - 0.1, 1.85, TABLE[2] + 2.3] as V3, look: [TABLE[0] - 0.18, 1.15, TABLE[2] - 0.7] as V3, fov: 44 },
    finishWide: { pos: [1.2, 2.5, -12.2] as V3, look: [-8.0, 2.8, 4.0] as V3, fov: 44 },
    finishLow: { pos: [-13.5, 0.35, -2.2] as V3, look: [-8.4, 1.9, 0.4] as V3, fov: 40 },
    finishHigh: { pos: [2, 13, -9] as V3, look: [-8.5, 0.6, 1.5] as V3, fov: 42 },
    medalClose: { pos: [MEDAL[0] - 0.05, 1.42, MEDAL[2] - 1.05] as V3, look: [MEDAL[0] - 0.12, 1.0, MEDAL[2]] as V3, fov: 34 },
    carParkTwo: { pos: [-6.5, 1.65, -15.5] as V3, look: [-11.2, 1.2, -9.6] as V3, fov: 40 },
    stadiumHigh: { pos: [40, 22, -40] as V3, look: [0, 2, 0] as V3, fov: 42 },
    gate: { pos: [43, 1.8, -1.5] as V3, look: [62, 4.2, 2] as V3, fov: 40 },
  };

  return {
    name: "stadium", root, marks, cams,
    pose: (t, c) => {
      lorzCar.set({ dist: 0, t, bob: 0.15, steer: 0, horn: c.horn ?? 0 });
      const crowdK = c.crowd ?? 0.15, temp = cl(c.temp ?? 1), tape = cl(c.tape ?? 0), confK = cl(c.confetti ?? 0), smokeK = c.smoke ?? 0, wg = cl(c.wellGlow ?? 0);
      people.update(t, cl(crowdK));
      cloths.forEach((cc2, i) => wave(cc2, t + i * 0.37, 5.5));
      finBanner.rotation.z = 0.025 * Math.sin(t * 1.1);
      buntings.forEach((bt) => flutter(bt, t));
      swags.forEach((m, i) => { m.rotation.x = 0.05 * Math.sin(t * 1.6 + i * 0.7); });
      twinkle(bulbs.glows, t); twinkle(bulbs2.glows, t + 1);
      umbr.rotation.z = 0.012 * Math.sin(t * 1.3); umbr.children[1].rotation.y = 0.02 * Math.sin(t * 2.1);
      // band: bob in time, instruments tilt, brass glints
      band.forEach((p) => { p.g.position.y = 0.53 + Math.abs(Math.sin(t * 3.4 + p.ph)) * 0.04; if (p.inst) p.inst.rotation.x = 0.12 * Math.sin(t * 3.4 + p.ph); });
      sparkle(glints, t, 1);
      hands.forEach((h, i) => { h.rotation.z = -Math.floor(t * 4 + i * 17) * (TAU / 240); });
      // balloon drifts, wheel turns, birds, clouds creep
      balloon.position.set(-55 + Math.sin(t * 0.05) * 6 + t * 0.15, 52 + Math.sin(t * 0.3) * 1.2, -150);
      balloon.rotation.y = t * 0.05;
      { const sp = wheel.userData.spin as THREE.Group; sp.rotation.z = t * 0.04; wheelCars.forEach((cr) => { const a = cr.userData.a; cr.position.set(Math.cos(a) * 38, Math.sin(a) * 38, 0); cr.rotation.z = -sp.rotation.z; }); }
      flock(t);
      // starter's smoke + flash
      const sk = cl(smokeK);
      (flash.material as THREE.SpriteMaterial).opacity = sk > 0 && sk < 0.1 ? Math.sin((sk / 0.1) * Math.PI) * 1.2 : 0;
      smoke.forEach((m, i) => {
        const u = m.userData, grow = 1 - (1 - sk) ** 3, life = sk > 0 ? Math.min(1, sk * 14) * (1 - cl((sk - 0.45 - (i % 3) * 0.08) / 0.4)) : 0;
        m.position.set(smokeCen[0] + u.dx * grow * 1.1, smokeCen[1] + u.dy * grow + sk * 0.6, smokeCen[2] - grow * 0.2 + u.dz * grow);
        m.scale.setScalar(Math.max(0.001, (0.15 + u.s * grow) * life));
      });
      // well glow
      const pulse = 0.75 + 0.25 * Math.sin(t * 5);
      ringM.opacity = wg * pulse; wellRing.scale.setScalar(1 + 0.06 * Math.sin(t * 5)); (wellHalo.material as THREE.SpriteMaterial).opacity = wg * 0.7 * pulse;
      // thermometer
      const deg = 50 + 40 * temp, top = T_LO + ((deg - 50) / 50) * (T_HI - T_LO);
      mercury.scale.y = Math.max(0.02, top - T_LO + 0.05 + Math.sin(t * 2) * 0.004);
      const hot = cl((temp - 0.6) / 0.4);
      heatGlow.material.opacity = hot * (0.7 + 0.2 * Math.sin(t * 3));
      shimmers.forEach((s) => { const u = (t * 0.35 + s.userData.ph) % 1; s.position.set(THERM_TOP[0] + Math.sin(t + s.userData.ph * 9) * 0.08, THERM_TOP[1] + 0.55 + u * 0.9, THERM_TOP[2]); (s.material as THREE.SpriteMaterial).opacity = hot * 0.95 * Math.sin(Math.PI * u); s.material.rotation = Math.sin(t * 2 + u * 5) * 0.1; });
      trackShim.forEach((s, i) => { const u = (t * 0.15 + i * 0.17) % 1; s.position.set(s.userData.x + Math.sin(t * 0.3 + i) * 2, 0.35 + u * 0.8, s.userData.z); (s.material as THREE.SpriteMaterial).opacity = 0.12 * hot * Math.sin(Math.PI * u); });
      // finish tape
      const e = tape * tape * (3 - 2 * tape);
      tapes.forEach(({ m, s }) => {
        const p = m.geometry.attributes.position as THREE.BufferAttribute, z0 = s * 5.1;
        for (let i = 0; i < NS; i++) {
          const q = i / (NS - 1), k = cl(e * 1.5 - (1 - q) * 0.5);
          const rest = V(FIN_X, TAPE_Y, z0 * (1 - q) - s * 0.0 * q);
          const hang = Math.min(q * 5.1, 1.12), rest2 = q * 5.1 - hang;
          const fall = V(FIN_X - 0.25 * q - rest2 * 0.55, TAPE_Y - hang + 0.02, z0 - s * rest2 * 0.4);
          const whip = Math.sin(Math.PI * k) * q;
          const P = rest.lerp(fall, k);
          P.x -= whip * 0.9; P.y += Math.sin(t * 13 + q * 9) * 0.07 * q * (k > 0 && k < 1 ? 1 : 0) + Math.sin(t * 3 + q * 4) * 0.006;
          P.z += Math.sin(t * 9 + q * 7) * 0.05 * q * k * (1 - k) * 4;
          p.setXYZ(i * 2, P.x, P.y + 0.028, P.z); p.setXYZ(i * 2 + 1, P.x, P.y - 0.028, P.z);
        }
        p.needsUpdate = true; m.geometry.computeVertexNormals();
      });
      // confetti, streamers, thrown hats
      conf.count = Math.floor(NC * confK); strs.count = Math.floor(NSTR * confK);
      cParts.forEach((q, i) => {
        if (i >= conf.count) return; const u = (t * q.sp + q.ph) % 1;
        dd.position.set(q.x + Math.sin(t * 1.3 + q.rx) * q.sw, 11 - u * 11.5, q.z + Math.cos(t * 1.1 + q.ry) * q.sw * 0.6);
        dd.rotation.set(t * 3 + q.rx, t * 2.2 + q.ry, t * 1.7); dd.scale.setScalar(u > 0.97 ? 0.001 : 1); dd.updateMatrix(); conf.setMatrixAt(i, dd.matrix);
      });
      sParts.forEach((q, i) => {
        if (i >= strs.count) return; const u = (t * q.sp + q.ph) % 1;
        dd.position.set(q.x + Math.sin(t * 0.7 + q.ry) * 0.6, 12 - u * 12.6, q.z); dd.rotation.set(Math.sin(t * 1.4 + q.ry) * 0.3, t * 1.2 + q.ry, Math.sin(t * 0.9 + q.ry) * 0.25); dd.scale.setScalar(u > 0.96 ? 0.001 : 1); dd.updateMatrix(); strs.setMatrixAt(i, dd.matrix);
      });
      const hK = cl((confK - 0.2) / 0.5);
      hatIM.forEach((im, k) => {
        im.count = Math.ceil((NHAT / 2) * hK);
        for (let j = 0; j < im.count; j++) {
          const q = hParts[k * (NHAT / 2) + j], u = (t * q.sp + q.ph) % 1;
          dd.position.set(q.x0 + (u - 0.5) * 1.5, 3.4 + Math.sin(Math.PI * Math.min(1, u * 1.15)) * 6 - u * 3, 11.5 - u * q.dz);
          dd.rotation.set(0.3, Math.PI + Math.sin(t + j) * 0.4, t * q.spin); dd.scale.setScalar(u > 0.95 ? 0.001 : 1); dd.updateMatrix(); im.setMatrixAt(j, dd.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
      });
      conf.instanceMatrix.needsUpdate = true; strs.instanceMatrix.needsUpdate = true;
    },
  };
};
