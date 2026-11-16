// "He Made Giant Bricks to Pay Half the Tax": Amos's brickyard (home base) + the lean-to moulding shed (the explanation).
// Layout (local metres, ground y = 0): Amos's moulding bench at the origin under a lean-to (tile roof, back wall z -1.35),
// the drying "hacks" (rows of green bricks under board roofs) at x 2.2..8, z -4..3, the excise duty board on a post at
// (2.6, 0, 1.9), the clamp kiln glowing at (-1.5, 0, -9), Silas's yard over the low brick wall at x = -2.4, the yard gate
// at (5.5, 0, 6.5) onto the lane, the village (rooftops, church spire) beyond. Bricks are drawn at 1.6x real size so they
// read on a phone (normal 0.30 x 0.17 x 0.10 m, Amos's "loaf" twice as tall: 0.30 x 0.17 x 0.20 m).
// Controls: mould 0..1 (the hook: the deep mould lifts off the loaf), clay 0..1 (clay fills the deep mould), strike 0..1,
// stack 0..1 (the unsold loaf stack grows), rain 0/1 (grey day: wet ground, puddles, drizzle), spring 0/1 (blossom, green),
// trick 0/1 (the night demo on the bench: scale, model walls, slate), scaleTip -1..1, chalkL 0..8, chalkR 0..4,
// coinL 0..8, coinR 0..4, lift 0..1 (Amos lifts the demo loaf), lantern 0/1, cart 0..1 (cart pushed out of the gate).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, quad, boxGeo, house } from "../build";
import { ctex, rng, rep, beamHD, planksHD, roofHD, facadeHD, stoneHD } from "../paint";
import { realMat } from "../real";
import { NOINK } from "../ink";
import { lamp, flicker, glow, mist, barrel, sack, nightTint, shaft } from "../setkit";
import { swayMaterial } from "../sway";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)")); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
const std = (key: string, o: THREE.MeshStandardMaterialParameters) => mat("byS" + key, () => new THREE.MeshStandardMaterial(o));
const tex = (key: string, t: () => THREE.Texture, c = "#ffffff") => lam("byT" + key + c, () => ({ map: t(), color: c }));

// ---------------- painted textures ----------------
/** trodden yellow-ochre clay with boot prints, straw, brick crumbs, darker wheel ruts */
export const clayGroundTex = (key = "byClay", base = "#b48a5a") => ctex(key + "v2", 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) blot(g, r() * 1024, r() * 1024, 20 + r() * 90, r() < 0.5 ? "rgba(214,176,124,0.35)" : "rgba(120,82,48,0.28)");
  for (let i = 0; i < 60; i++) { const x = r() * 1024, y = r() * 1024, a = r() * TAU; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = "rgba(90,60,36,0.25)"; g.beginPath(); g.ellipse(0, 0, 16, 7, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(26, 0, 9, 7, 0, 0, TAU); g.fill(); g.restore(); }
  g.strokeStyle = "rgba(206,178,116,0.16)"; for (let i = 0; i < 90; i++) {   /* r26b: fewer, fainter straws (the ticks read as flat decals) */   // r10: sparse, dull straw (the bright strokes read as confetti)
 const x = r() * 1024, y = r() * 1024, a = r() * TAU, L = 6 + r() * 18; g.lineWidth = 1 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,96,70,0.4)" : "rgba(98,70,48,0.45)"; const s = 2 + r() * 4; g.fillRect(r() * 1024, r() * 1024, s, s * (0.6 + r() * 0.6)); }
  // r10: packed-earth grain: tiny lit pebbles (light top, dark underside) all over
  /* r26d: fine sand grain and soft mottling instead of painted pebbles (they read as flat grey discs; the real stones are 3D) */
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,40,24,0.22)" : "rgba(236,214,176,0.18)"; g.fillRect(r() * 1024, r() * 1024, 1 + r(), 1 + r()); }
  for (let i = 0; i < 90; i++) blot(g, r() * 1024, r() * 1024, 30 + r() * 120, r() < 0.5 ? "rgba(90,60,36,0.16)" : "rgba(200,170,120,0.14)");
  for (const y0 of [300, 700]) { g.strokeStyle = "rgba(92,62,38,0.22)"; g.lineWidth = 22; g.beginPath(); g.moveTo(0, y0); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y0 + Math.sin(x * 0.01 + y0) * 18); g.stroke(); }
});
/** r26b: a height map for packed earth (soft lumps, ruts, pebbles with lit tops) so the ground has relief, not decals */
export const clayGroundBump = (key = "byClayBump") => ctex(key, 1024, 1024, (g, r) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 320; i++) blot(g, r() * 1024, r() * 1024, 18 + r() * 80, r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)");
  for (let i = 0; i < 1800; i++) { const x = r() * 1024, y = r() * 1024, s = 2 + r() * 4.5; g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(x, y, s, s * 0.75, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(x, y + s * 0.9, s * 0.9, s * 0.4, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 2 + r() * 3; g.beginPath(); const x = r() * 1024, y = r() * 1024; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 30); g.stroke(); }
});
/** r26f: worn brick pavers for the yard's work floor (running bond, sand joints, a few sunken or chipped pavers, dirt drifts):
 *  1024 px = 2.2 m. The bump twin darkens the joints and pits so the floor has real relief. */
const paverDraw = (bump: boolean) => (g: CanvasRenderingContext2D, r: () => number) => {
  const S = 1024, RH = 51, BW = 102, J = 6;
  g.fillStyle = bump ? "#303030" : "#8a7458"; g.fillRect(0, 0, S, S);
  const cols = ["#94604a", "#8e5a44", "#9a6650", "#88583f", "#916250", "#8c6050", "#966a56", "#866048", "#98705c"];   /* r26j: closer tones (the floor read as a high-contrast tile) */
  for (let row = 0; row < S / RH; row++) { const off = row % 2 ? BW / 2 : 0;
    for (let x = -off; x < S; x += BW) { const sunk = r() < 0.06, v = r();
      if (bump) { g.fillStyle = sunk ? "#7a7a7a" : `rgb(${190 + Math.floor(v * 40)},${190 + Math.floor(v * 40)},${190 + Math.floor(v * 40)})`; }
      else g.fillStyle = cols[Math.floor(r() * cols.length)];
      const X = x + J / 2, Y = row * RH + J / 2, W = BW - J - r() * 2, H = RH - J - r() * 2;
      g.beginPath(); g.roundRect ? g.roundRect(X, Y, W, H, 5) : g.rect(X, Y, W, H); g.fill();
      if (!bump) { g.fillStyle = v < 0.5 ? `rgba(30,14,8,${(0.25 * (0.5 - v)).toFixed(3)})` : `rgba(255,224,190,${(0.12 * (v - 0.5)).toFixed(3)})`; g.fillRect(X, Y, W, H);
        g.fillStyle = "rgba(255,230,200,0.14)"; g.fillRect(X + 2, Y + 2, W - 4, 4); g.fillStyle = "rgba(40,18,10,0.2)"; g.fillRect(X + 2, Y + H - 5, W - 4, 4); }
      for (let k = 0; k < 2; k++) { g.fillStyle = bump ? "rgba(60,60,60,0.35)" : "rgba(50,24,14,0.18)"; g.beginPath(); g.arc(X + r() * W, Y + r() * H, 0.6 + r() * 1.2, 0, TAU); g.fill(); }   /* r51: fewer, fainter pits (six dark ones per brick read as cored modern bricks) */
      if (r() < 0.12) { const cx = X + (r() < 0.5 ? 0 : W), cy = Y + r() * H; g.fillStyle = bump ? "rgba(30,30,30,0.9)" : "rgba(120,96,70,0.9)"; g.beginPath(); g.ellipse(cx, cy, 8 + r() * 8, 5 + r() * 5, 0, 0, TAU); g.fill(); }
    } }
  if (!bump) { for (let i = 0; i < 26; i++) blot(g, r() * S, r() * S, 40 + r() * 140, r() < 0.6 ? "rgba(150,120,80,0.28)" : "rgba(60,44,30,0.22)");
    for (let i = 0; i < 70; i++) blot(g, r() * S, r() * S, 4 + r() * 10, "rgba(80,104,52,0.35)"); }
};
export const paverTex = () => ctex("byPavers3", 1024, 1024, paverDraw(false));
export const paverBump = () => ctex("byPaversB3", 1024, 1024, paverDraw(true));
/** one brick face (any size): unfired = buff grey with sand dusting; fired = warm red with darker burnt edges. A maker's
 *  mark "A" pressed into the frog on the loaves (top face only). */
// r16: fired bricks are darker red-brown with four tints (a trailing digit in the key picks one) and chipped edges
export const FIRED_PAL = ["#b05e3a", "#a45636", "#ba6a42", "#965032"];   // r20: warmer terracotta (the cooler set read mauve in the blue fill)
export const brickFaceTex = (key: string, fired: boolean, mark = "") => ctex("byBrick7" + key, 512, 512, (g, r) => {
  g.scale(2, 2);   /* r44: 512 px (the close inserts showed a soft, blown-up 256 face) */
  const base = fired ? FIRED_PAL[/\d$/.test(key) ? +key.slice(-1) % 4 : 0] : "#d9a46c";
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  // r18: clean clay - a few broad soft tone shifts and fine pores (the dense blotches read as foam)
  for (let i = 0; i < (fired ? 26 : 90); i++) blot(g, r() * 256, r() * 256, 30 + r() * 60, fired ? (r() < 0.5 ? "rgba(196,110,80,0.18)" : "rgba(96,40,28,0.16)") : (r() < 0.5 ? "rgba(236,190,130,0.45)" : "rgba(150,94,54,0.3)"));
  for (let i = 0; i < (fired ? 760 : 700); i++) { g.fillStyle = fired ? (r() < 0.75 ? "rgba(50,20,14,0.36)" : "rgba(240,200,170,0.3)") : "rgba(255,236,200,0.45)"; const s = fired ? 0.6 + r() * 0.9 : 1 + r() * 2; g.fillRect(r() * 256, r() * 256, s, s); }
  const ed = g.createLinearGradient(0, 0, 0, 256); ed.addColorStop(0, "rgba(255,240,210,0.1)"); ed.addColorStop(0.08, "rgba(0,0,0,0)"); ed.addColorStop(0.92, "rgba(0,0,0,0)"); ed.addColorStop(1, fired ? "rgba(60,20,12,0.14)" : "rgba(90,66,44,0.35)");   /* r69: faint edges (dark vignettes read as a leather trunk) */
  g.fillStyle = ed; g.fillRect(0, 0, 256, 256);
  // r20: no outlined border (it read as a soap box): soft darker edges, sand-struck grains and a few fold creases instead
  for (const [x0, y0, x1, y1] of [[0, 0, 22, 0], [0, 0, 0, 22], [256, 0, 234, 0], [0, 256, 0, 234]] as const) { const e2 = g.createLinearGradient(x0, y0, x1, y1); e2.addColorStop(0, fired ? "rgba(60,22,12,0.12)" : "rgba(110,70,40,0.3)"); e2.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = e2; g.fillRect(0, 0, 256, 256); }
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? (fired ? "rgba(236,190,150,0.35)" : "rgba(255,240,210,0.4)") : (fired ? "rgba(70,28,16,0.35)" : "rgba(120,80,48,0.3)"); g.fillRect(r() * 256, r() * 256, 1.2, 1.2); }
  // r21: no crease lines (they read as wood grain); mottled firing patches instead
  if (fired) { for (let i = 0; i < 10; i++) blot(g, r() * 256, r() * 256, 30 + r() * 60, r() < 0.5 ? "rgba(70,24,14,0.26)" : "rgba(220,140,96,0.2)"); /* r68b: no dark pin dots (they read as nail holes in a crate) */
    /* r44: kiln flashing - a burnt purple-brown cheek and a pale salt-glaze patch per face, so no two loaves match (the even black speckle read as foam) */
    for (let i = 0; i < 3; i++) blot(g, r() * 256, r() < 0.5 ? r() * 90 : 160 + r() * 96, 50 + r() * 70, r() < 0.6 ? "rgba(70,26,34,0.24)" : "rgba(236,170,120,0.2)");
    /* r68b: a sand-struck face instead of the short dark strokes (they read as wood grain): dense pale sand grains, a few larger grits and lime specks */
    for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.7 ? `rgba(238,206,164,${(0.18 + r() * 0.22).toFixed(2)})` : `rgba(120,52,32,${(0.16 + r() * 0.18).toFixed(2)})`; const z = 0.5 + r() * 0.9; g.fillRect(r() * 256, r() * 256, z, z); }
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.6 ? "rgba(246,226,196,0.55)" : "rgba(90,40,26,0.4)"; g.beginPath(); g.arc(r() * 256, r() * 256, 0.9 + r() * 1.3, 0, TAU); g.fill(); } }   /* r26f: pores and stronger firing mottle (the faces read as soap) */
  if (fired) for (let i = 0; i < 0; i++) {   /* r69: no edge chips (pale specks along the edges read as rivets) */ const e = Math.floor(r() * 4), t = 20 + r() * 216, s = 5 + r() * 9; g.fillStyle = "rgba(236,182,140,0.5)";   /* r68b: chips show paler fresh clay (dark nicks read as joint dots on a box) */   /* r67: shadowed edge nicks (reviewers: smooth plastic bricks) */ g.beginPath(); if (e === 0) g.ellipse(t, 4, s, s * 0.6, 0, 0, 6.3); else if (e === 1) g.ellipse(t, 252, s, s * 0.6, 0, 0, 6.3); else if (e === 2) g.ellipse(4, t, s * 0.6, s, 0, 0, 6.3); else g.ellipse(252, t, s * 0.6, s, 0, 0, 6.3); g.fill(); }
  if (mark) { g.font = "900 96px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(255,226,196,0.4)"; g.fillText(mark, 130, 134); g.fillStyle = "rgba(60,24,14,0.78)"; g.fillText(mark, 128, 130); }   /* r26b: a pressed A, no plate (the plate read as a drawer front) */
});
/** r20: a height map for the hero bricks (pits, sand grains, creases) so the faces stop reading as smooth plastic */
export const brickBumpTex = () => ctex("byBrickBump3", 256, 256, (g, r) => {
  g.fillStyle = "#9a9a9a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) blot(g, r() * 256, r() * 256, 20 + r() * 40, r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)");
  for (let i = 0; i < 1400; i++) { const v = r() < 0.55 ? 40 : 230; g.fillStyle = `rgba(${v},${v},${v},${0.35 + r() * 0.4})`; const z = 1 + r() * 2.2; g.beginPath(); g.arc(r() * 256, r() * 256, z, 0, TAU); g.fill(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = "rgba(40,40,40,0.5)"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, TAU); g.fill(); }   // r21: pits, no crease lines
  for (const [x, y, w, h] of [[0, 0, 256, 6], [0, 250, 256, 6], [0, 0, 6, 256], [250, 0, 6, 256]] as const) { g.fillStyle = "rgba(40,40,40,0.5)"; g.fillRect(x, y, w, h); }
  /* r26b: chipped arrises (the clean bevels read as plastic) */
  for (let i = 0; i < 18; i++) { const e = Math.floor(r() * 4), t = 10 + r() * 236, sz = 5 + r() * 12; g.fillStyle = "rgba(20,20,20,0.7)"; g.beginPath(); if (e === 0) g.ellipse(t, 2, sz, sz * 0.55, 0, 0, TAU); else if (e === 1) g.ellipse(t, 254, sz, sz * 0.55, 0, 0, TAU); else if (e === 2) g.ellipse(2, t, sz * 0.55, sz, 0, 0, TAU); else g.ellipse(254, t, sz * 0.55, sz, 0, 0, TAU); g.fill(); }
});
/** a wall of bricks for textures: brick length bl, course height ch (in px at 256 px/m), with mortar */
export const brickWallTex = (key: string, bw: number, ch: number, fired = true) => ctex("byWall2" + key, 1024, 1024, (g, r) => {
  g.fillStyle = "#d8c4a4"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,130,100,0.25)" : "rgba(250,240,220,0.3)"; g.fillRect(r() * 1024, r() * 1024, 3, 3); }   // gritty mortar
  const pal = fired ? ["#c0583a", "#b44f35", "#c8643f", "#a94a33", "#cf6e45", "#b9603f", "#9e4630", "#d27a50", "#8e3e2c"] : ["#c9ab84", "#bfa07a", "#d2b48c", "#b8996f"];
  for (let y = 0, row = 0; y < 1024; y += ch, row++) for (let x = -(row % 2) * bw / 2 + (r() - 0.5) * 3; x < 1024; x += bw) {
    const burnt = r() < 0.06, jx = (r() - 0.5) * 2, jy = (r() - 0.5) * 2;
    g.fillStyle = burnt ? "#6a2e22" : pal[Math.floor(r() * pal.length)]; g.fillRect(x + 3 + jx, y + 3 + jy, bw - 6, ch - 6);
    for (let k = 0; k < 3; k++) blot(g, x + r() * bw, y + r() * ch, 6 + r() * 10, r() < 0.5 ? "rgba(255,200,160,0.18)" : "rgba(70,24,14,0.2)");
    g.fillStyle = "rgba(255,230,200,0.22)"; g.fillRect(x + 4, y + 3, bw - 8, 3); g.fillStyle = "rgba(60,24,14,0.28)"; g.fillRect(x + 4, y + ch - 7, bw - 8, 3);
    if (r() < 0.08) { g.fillStyle = "rgba(230,214,190,0.8)"; g.beginPath(); g.arc(x + r() * bw, y + (r() < 0.5 ? 4 : ch - 4), 4 + r() * 4, 0, TAU); g.fill(); }   // chipped corner
  }
  const gr = g.createLinearGradient(0, 640, 0, 1024); gr.addColorStop(0, "rgba(60,40,30,0)"); gr.addColorStop(1, "rgba(60,40,30,0.32)"); g.fillStyle = gr; g.fillRect(0, 640, 1024, 384);   // grime toward the ground
  for (let i = 0; i < 26; i++) blot(g, r() * 1024, 940 + r() * 84, 20 + r() * 40, "rgba(80,110,50,0.3)");   // moss at the foot
  for (let i = 0; i < 14; i++) blot(g, r() * 1024, r() * 900, 60 + r() * 120, "rgba(70,40,30,0.1)");
  for (let i = 0; i < 6; i++) { const x = r() * 1024; const gg = g.createLinearGradient(0, 0, 0, 600); gg.addColorStop(0, "rgba(40,30,30,0.18)"); gg.addColorStop(1, "rgba(40,30,30,0)"); g.fillStyle = gg; g.fillRect(x, 0, 18 + r() * 30, 400 + r() * 300); }   // rain streaks
});
const boardTex = () => ctex("byDutyBoard", 1024, 704, (g, r) => {
  g.fillStyle = "#e9d6a6"; g.fillRect(0, 0, 1024, 704);
  for (let i = 0; i < 60; i++) blot(g, r() * 1024, r() * 704, 30 + r() * 90, "rgba(150,110,60,0.12)");
  g.strokeStyle = "#7a2a1e"; g.lineWidth = 14; g.strokeRect(22, 22, 980, 660);
  // the royal cipher in a wreath (the king), top centre
  g.fillStyle = "#b8322a"; g.beginPath(); g.ellipse(512, 132, 120, 92, 0, 0, TAU); g.fill(); g.strokeStyle = "#e8b84a"; g.lineWidth = 9; g.stroke();
  g.fillStyle = "#f6e2a8"; g.font = "italic 900 104px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("GR", 512, 140);
  g.fillStyle = "#e8b84a"; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(452 + k * 30, 46); g.lineTo(467 + k * 30, 18); g.lineTo(482 + k * 30, 46); g.fill(); }
  g.fillStyle = "#2a1a10"; g.font = "900 92px Georgia, serif"; g.fillText("BRICK DUTY", 512, 314);
  g.fillStyle = "#7a2a1e"; g.font = "900 150px Georgia, serif"; g.fillText("2s 6d", 512, 470);
  g.fillStyle = "#2a1a10"; g.font = "900 78px Georgia, serif"; g.fillText("PER 1000 BRICKS", 512, 610);
});
/** the 1606 Union flag (before 1801: no red saltire of St Patrick) */
export const unionTex = () => ctex("byUnion1606", 384, 192, (g) => {
  g.fillStyle = "#1f3b8a"; g.fillRect(0, 0, 384, 192);
  g.strokeStyle = "#f4f0e6"; g.lineWidth = 34; g.beginPath(); g.moveTo(0, 0); g.lineTo(384, 192); g.moveTo(384, 0); g.lineTo(0, 192); g.stroke();
  g.fillStyle = "#f4f0e6"; g.fillRect(162, 0, 60, 192); g.fillRect(0, 66, 384, 60);
  g.fillStyle = "#c8282a"; g.fillRect(174, 0, 36, 192); g.fillRect(0, 78, 384, 36);
});
const slateTex = (nl: number, nr: number) => ctex(`bySlate7_${nl}_${nr}`, 768, 512, (g, r) => {
  g.fillStyle = "#283030";   /* r47: a near-black slate (the blue-grey read as a window) */ g.fillRect(0, 0, 768, 512);
  for (let i = 0; i < 40; i++) blot(g, r() * 768, r() * 512, 20 + r() * 80, "rgba(230,236,240,0.06)");
  g.strokeStyle = "#8a6a44"; g.lineWidth = 26; g.strokeRect(13, 13, 742, 486);
  // r12: chalk pictures instead of a header (no text to crop): a flat brick over the left tally, a tall loaf over the right
  g.fillStyle = "#f4f2ea"; g.textAlign = "center"; g.textBaseline = "middle"; g.strokeStyle = "rgba(244,242,234,0.92)"; g.lineCap = "round";
  // r14: chalky drawings - a small brick (bond lines) over the left tally, one big tall brick over the right
  // r17: broken chalk - each edge drawn as short dashes with gaps and a faint second pass
  const chalkLine = (x0: number, y0: number, x1: number, y1: number, w: number) => { const n = 9; for (let k = 0; k < n; k++) { if (r() < 0.18) continue; const a = k / n, b = (k + 0.85) / n; g.lineWidth = w * (0.7 + r() * 0.5); g.globalAlpha = 0.7 + r() * 0.3; g.beginPath(); g.moveTo(x0 + (x1 - x0) * a + r() * 3, y0 + (y1 - y0) * a + r() * 3); g.lineTo(x0 + (x1 - x0) * b + r() * 3, y0 + (y1 - y0) * b + r() * 3); g.stroke(); } g.globalAlpha = 1; };
  const chalkRect = (x: number, y: number, w: number, h: number) => { for (let k = 0; k < 2; k++) { const wd = 14 - k * 5; chalkLine(x, y, x + w, y, wd); chalkLine(x + w, y, x + w, y + h, wd); chalkLine(x + w, y + h, x, y + h, wd); chalkLine(x, y + h, x, y, wd); } };
  // r24: the clay maths right: two normal bricks STACKED = one loaf of the same size (side by side read as double the clay)
  // r44: smaller pictures with chalk words under them ("2 bricks" = "1 loaf"): the bare boxes read as a window
  g.strokeStyle = "rgba(246,244,236,0.95)"; chalkRect(70, 44, 250, 104); chalkRect(70, 160, 250, 104);   /* r48: the pictures 1.4x (they filled only the top of the slate) */   /* r47: two plain bricks with a gap (the bond lines read as 4-5 cells) */
  g.lineWidth = 15; g.beginPath(); g.moveTo(350, 132); g.lineTo(432, 132); g.moveTo(350, 178); g.lineTo(432, 178); g.stroke();
  g.strokeStyle = "rgba(246,244,236,0.95)"; chalkRect(462, 44, 250, 220); g.lineWidth = 18; g.beginPath(); g.moveTo(532, 232); g.lineTo(587, 82); g.lineTo(642, 232); g.moveTo(552, 186); g.lineTo(622, 186); g.stroke();
  g.globalAlpha = 0.95; g.fillStyle = "#f4f2ea"; g.font = "italic 800 76px Georgia, serif"; g.fillText("2 bricks", 195, 326); g.fillText("1 loaf", 587, 326); g.globalAlpha = 1;
  // r15: no divider line (it read as a stray stroke)
  const ticks = (x0: number, n: number) => { g.lineWidth = 13; g.lineCap = "round"; for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), k = i % 5, x = x0 + grp * 120 + k * 22; if (k === 4) { g.beginPath(); g.moveTo(x - 92, 470); g.lineTo(x + 6, 412); g.stroke(); } else { g.beginPath(); g.moveTo(x, 404); g.lineTo(x - 4, 472); g.stroke(); } } };
  ticks(60, nl); ticks(450, nr); void 0;
  g.font = "900 88px Georgia, serif"; if (nl >= 8) g.fillText("8", 196, 444); if (nr >= 4) g.fillText("4", 542, 444);
});
export const coinTex = () => ctex("byHalfCrown", 128, 128, (g) => { const gr = g.createRadialGradient(54, 50, 6, 64, 64, 62); gr.addColorStop(0, "#f4f2ec"); gr.addColorStop(0.7, "#c4c2bc"); gr.addColorStop(1, "#8a8882"); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill(); g.strokeStyle = "#6a6862"; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke(); g.fillStyle = "#6a6862"; g.font = "900 40px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("GR", 64, 66); });
export const labelTex = (t: string, bg = "#e9d6a6", fg = "#2a1a10", w = 512, h = 160) => ctex("byLabel" + t + bg, w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = "#5a3a20"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = fg; g.font = `900 ${Math.round(h * 0.52)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, w / 2, h / 2 + 4); });
export const blossomTex = () => ctex("byBlossom", 512, 512, (g, r) => { g.clearRect(0, 0, 512, 512); for (let i = 0; i < 520; i++) { const x = r() * 512, y = r() * 512, s = 5 + r() * 9; g.fillStyle = r() < 0.6 ? "#f8d4e2" : r() < 0.7 ? "#fff2f6" : "#5c9a44"; g.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; g.ellipse(x + Math.cos(a) * s * 0.6, y + Math.sin(a) * s * 0.6, s * 0.55, s * 0.4, a, 0, TAU); } g.fill(); g.fillStyle = "#e8a23a"; g.fillRect(x - 1, y - 1, 3, 3); } });
export const leafCut = (k: string, base: string, lite: string, dark: string) => ctex("byLeaf" + k, 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { const x = r() * 512, y = r() * 512, L = 18 + r() * 20, W = L * 0.5, a = r() * TAU, c = r() < 0.33 ? lite : r() < 0.5 ? dark : base;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c; g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -W, L, 0); g.quadraticCurveTo(0, W, -L, 0); g.fill(); g.strokeStyle = "rgba(20,40,16,0.5)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-L * 0.9, 0); g.lineTo(L * 0.9, 0); g.stroke(); g.restore(); }
});
/** r53: an OPAQUE leaf texture for tree crowns (solid stylised leaf clumps: the cut-out cards broke into confetti and holes) */
export const leafSolid = (k: string, base: string, lite: string, dark: string) => ctex("byLeafQ" + k, 512, 512, (g, r) => {
  /* r64: painted leaf clusters on round puffs - soft light/shade blotches, then overlapping rounded leaf dabs with a lit top
   *  edge (r63's smooth wash read as clay balls; r61's outlined leaves on lumpy clumps read as faceted noise) */
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  const wrap = (x: number, y: number, f: (x: number, y: number) => void) => { for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) if (x + dx > -40 && x + dx < 552 && y + dy > -40 && y + dy < 552) f(x + dx, y + dy); };
  for (let i = 0; i < 30; i++) { const x = r() * 512, y = r() * 512, rad = 50 + r() * 70, col = r() < 0.5 ? lite : dark, al = 0.25 + r() * 0.15;
    wrap(x, y, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, rad); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = al; g.fillStyle = gr; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2); }); }
  for (let i = 0; i < 520; i++) { const x = r() * 512, y = r() * 512, rx = 6 + r() * 6, ry = rx * (0.7 + r() * 0.2), a = r() * TAU, q = r(), col = q < 0.4 ? lite : q < 0.75 ? dark : base;
    g.globalAlpha = 0.55 + r() * 0.25;
    wrap(x, y, (X, Y) => { g.save(); g.translate(X, Y); g.rotate(a); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fill();
      if (col !== dark) { g.globalAlpha *= 0.5; g.fillStyle = "rgba(255,255,220,0.5)"; g.beginPath(); g.ellipse(-rx * 0.2, -ry * 0.35, rx * 0.55, ry * 0.3, 0, 0, TAU); g.fill(); } g.restore(); }); }
  g.globalAlpha = 1;
});
export const blossomSolid = () => ctex("byBlossomS", 512, 512, (g, r) => { g.fillStyle = "#d89ab0"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 900; i++) { const x = r() * 512, y = r() * 512, s = 5 + r() * 9; g.fillStyle = r() < 0.55 ? "#f8d4e2" : r() < 0.7 ? "#fff2f6" : r() < 0.85 ? "#e8a8c0" : "#5c9a44"; g.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; g.ellipse(x + Math.cos(a) * s * 0.6, y + Math.sin(a) * s * 0.6, s * 0.55, s * 0.4, a, 0, TAU); } g.fill(); g.fillStyle = "#e8a23a"; g.fillRect(x - 1, y - 1, 3, 3); } });
/** r56: an icosphere with round (smooth) normals - leaf clumps without facets */
export const smoothIco = (r: number, det = 2) => { const g = new THREE.IcosahedronGeometry(r, det), P = g.attributes.position, N = g.attributes.normal; for (let q = 0; q < P.count; q++) { const x = P.getX(q), y = P.getY(q), z = P.getZ(q), l = Math.hypot(x, y, z) || 1; N.setXYZ(q, x / l, y / l, z / l); } return g; };
export const barkTex = () => ctex("byBark", 256, 512, (g, r) => { g.fillStyle = "#6a4a34"; g.fillRect(0, 0, 256, 512); for (let i = 0; i < 70; i++) { g.strokeStyle = r() < 0.5 ? "rgba(40,26,18,0.6)" : "rgba(150,120,90,0.35)"; g.lineWidth = 2 + r() * 4; const x = r() * 256; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y < 512; y += 32) g.lineTo(x + (r() - 0.5) * 14, y); g.stroke(); } });

// ---------------- builders ----------------
/** a leafy deciduous tree: bark trunk + boughs, crown of cutout leaf clusters (alphaTest, depthWrite) over a dark core */
/** r62: canopy volume - vertex colours dark under the crown, light on top, each clump a touch different (the clumps read as flat blobs) */
const crownShade = (g: THREE.BufferGeometry, cyW: number, R0: number, k: number) => { const P = g.attributes.position, C = new Float32Array(P.count * 3); for (let q = 0; q < P.count; q++) { const t = THREE.MathUtils.clamp((P.getY(q) - cyW) / R0, -1.2, 1.2), sh = (0.52 + 0.48 * THREE.MathUtils.smoothstep(t, -1.0, 0.9)) * k; C[q * 3] = sh; C[q * 3 + 1] = sh; C[q * 3 + 2] = Math.min(1, sh * 1.04); } g.setAttribute("color", new THREE.BufferAttribute(C, 3)); return g; };
/** r76i (both reviewers: "toy ball-trees"): a leaf-spray card - a cluster of pointed leaves on a transparent ground, laid
 *  round every clump so the crown edge breaks into leaves (the smooth ball silhouette read as a toy) */
export const leafCardTex = () => ctex("byLeafCard4", 256, 256, (g, r) => { g.clearRect(0, 0, 256, 256);
  const cols = ["#5a9642", "#6eaa4e", "#4c8638", "#7cb85a", "#62a046"];
  for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, d = 20 + r() * 64, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, L = 58 + r() * 40, W = L * (0.36 + r() * 0.12), ang = a + (r() - 0.5) * 1.2;
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.moveTo(-L * 0.5, 0); g.quadraticCurveTo(0, -W, L * 0.5, 0); g.quadraticCurveTo(0, W, -L * 0.5, 0); g.fill();
    g.strokeStyle = "rgba(40,70,28,0.55)"; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-L * 0.45, 0); g.lineTo(L * 0.42, 0); g.stroke(); g.restore(); } });
export const leafCardMat = (key: string) => swayMaterial(lam(key, () => ({ map: leafCardTex(), alphaTest: 0.5, side: THREE.DoubleSide, vertexColors: true })));
/** cards round one clump: centre c, radius rr; normals point outward so they shade with the clump */
export const leafFringe = (b: Batch, c: THREE.Vector3, rr: number, k: number, m: THREE.Material, r: () => number, shadeY: number, R0: number, kk: number) => {
  for (let j = 0; j < k; j++) { const th = r() * Math.PI * 2, ph = Math.acos(1 - 1.85 * r()), d = V(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)), s2 = rr * (0.85 + r() * 0.4);
    const g = new THREE.PlaneGeometry(s2, s2); const t0 = d.clone().cross(Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize(), t1 = d.clone().cross(t0), ph2 = r() * Math.PI * 2, nrm = t0.multiplyScalar(Math.cos(ph2)).add(t1.multiplyScalar(Math.sin(ph2))).normalize(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), nrm);   /* never degenerate (a near-zero random axis gave NaN cards: a sky-coloured hole in the builders' shot) */ g.applyQuaternion(q);   /* the card plane CONTAINS the outward direction, so half of it sticks out past the clump */
    g.translate(c.x + d.x * rr * 0.92, c.y + d.y * rr * 0.92 * 0.85, c.z + d.z * rr * 0.92); const N = g.attributes.normal; for (let q2 = 0; q2 < N.count; q2++) N.setXYZ(q2, d.x, d.y, d.z);
    b.add(crownShade(g, shadeY, R0, kk), m); } };
export const leafyTree = (b: Batch, parent: THREE.Object3D, p: V3, h: number, seed: number, leafM: THREE.Material, coreM: THREE.Material, barkM: THREE.Material, n = 14, fringeM?: THREE.Material) => {
  const r = rng(seed * 31 + 7);
  b.add(new THREE.CylinderGeometry(0.1 * h / 5, 0.17 * h / 5, h * 0.55, 9).translate(p[0], p[1] + h * 0.27, p[2]), barkM);
  for (let k = 0; k < 4; k++) { const a = r() * TAU, A = V(p[0], p[1] + h * 0.45, p[2]), B = V(p[0] + Math.cos(a) * h * 0.22, p[1] + h * 0.7, p[2] + Math.sin(a) * h * 0.22); const L = A.distanceTo(B); const cyl = new THREE.CylinderGeometry(0.03 * h / 5, 0.07 * h / 5, L, 6); cyl.translate(0, L / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize()); cyl.applyQuaternion(q); cyl.translate(A.x, A.y, A.z); b.add(cyl, barkM); }
  const R0 = h * 0.3, cy = h * 0.72;
  b.add(crownShade(new THREE.SphereGeometry(R0 * 0.6, 10, 8).scale(1.1, 0.8, 1.1).translate(p[0], p[1] + cy, p[2]), p[1] + cy, R0, 0.8), leafM); void coreM;   /* r61: the core carries the leaf texture (a smooth green ball showed through the gaps) */
  // r5: an irregular crown of many smaller clusters with gaps (never one round lollipop): 1.7x the clusters, wider and lumpier
  const nn = Math.round(n * 1.7);
  for (let i = 0; i < nn; i++) { const th = r() * TAU, ph = Math.acos(1 - 2 * r()) * 0.85, d = R0 * (0.35 + r() * 0.5), rr = R0 * (0.27 + r() * 0.19); const x = Math.sin(ph) * Math.cos(th) * d * 1.2, y = Math.cos(ph) * d * 0.75 - (r() < 0.25 ? R0 * 0.12 : 0), z = Math.sin(ph) * Math.sin(th) * d * 1.2;   // r5b: every cluster overlaps the core (no floating leaf balls)
    const ico = new THREE.IcosahedronGeometry(rr, 3); { const P = ico.attributes.position, N = ico.attributes.normal, s1 = r() * 9, s2 = r() * 9, s3 = r() * 9; for (let q = 0; q < P.count; q++) { const vx = P.getX(q), vy = P.getY(q), vz = P.getZ(q), l = Math.hypot(vx, vy, vz) || 1, ux = vx / l, uy = vy / l, uz = vz / l; const m = 1 + 0.06 * Math.sin(4.1 * ux + s1) * Math.sin(3.9 * uy + s2) * Math.sin(4.3 * uz + s3);   /* r63: near-round puffs (the lumpy edge read as low-poly facets) */ P.setXYZ(q, vx * m, vy * m, vz * m); N.setXYZ(q, ux, uy, uz); } }   /* r59: a lumpy, leafy edge on every clump (smooth spheres read as blob trees) */   // r53: round leaf clumps (smooth normals)
    const kk = 0.92 + r() * 0.14; b.add(crownShade(ico.scale(1, 0.85, 1).rotateY(r() * TAU).translate(p[0] + x, p[1] + cy + y, p[2] + z), p[1] + cy, R0, kk), leafM);
    if (fringeM) leafFringe(b, V(p[0] + x, p[1] + cy + y, p[2] + z), rr, 16, fringeM, r, p[1] + cy, R0, kk); }
};
/** a box with every face mapped once (bricks, boards) */
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/** Amos's handcart: box bed of loaves (3 x 4 x 2), two big spoked wheels (userData.wheels), handles toward +x */
export const handcart = (parent: THREE.Object3D, firedM: THREE.Material, timber: THREE.Material, plank: THREE.Material, loaves = true) => {
  const cart = new THREE.Group(); parent.add(cart);
  const cb = new Batch(); cb.add(bx(1.3, 0.06, 0.8).translate(0, 0.55, 0), plank); for (const z of [-0.4, 0.4]) cb.add(bx(1.3, 0.28, 0.04).translate(0, 0.72, z), plank); cb.add(bx(0.04, 0.28, 0.8).translate(-0.65, 0.72, 0), plank); cb.add(bx(0.04, 0.28, 0.8).translate(0.65, 0.72, 0), plank);
  for (const z of [-0.3, 0.3]) cb.add(bx(1.0, 0.05, 0.05).translate(1.1, 0.68, z), timber);
  cb.add(bx(0.05, 0.5, 0.05).translate(-0.6, 0.28, -0.3), timber); cb.add(bx(0.05, 0.5, 0.05).translate(-0.6, 0.28, 0.3), timber);
  if (loaves) for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) for (let y = 0; y < 2; y++) { const g = bx(0.3, 0.2, 0.17); g.translate(-0.42 + i * 0.4, 0.68 + y * 0.205, -0.27 + k * 0.18); cb.add(g, firedM); }
  /* r67: the load heaped above the sides (2 + 1 more courses, pyramid), so the cart reads as full of loaves from a low lens */
  if (loaves) { for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) { const g = bx(0.3, 0.2, 0.17); g.rotateY((i + k) % 2 ? 0.04 : -0.03); g.translate(-0.22 + i * 0.4, 0.68 + 2 * 0.205, -0.18 + k * 0.18); cb.add(g, firedM); }
    for (let k = 0; k < 2; k++) { const g = bx(0.3, 0.2, 0.17); g.rotateY(k ? 0.05 : -0.04); g.translate(-0.02, 0.68 + 3 * 0.205, -0.09 + k * 0.18); cb.add(g, firedM); } }
  if (loaves) { const nb = bx(0.3, 0.1, 0.17); nb.rotateY(0.25); nb.translate(0.3, 1.04, 0.2); cb.add(nb, timber === plank ? firedM : firedM); }   /* r54: one ordinary brick lying on the loaves for scale (the cart load read as ordinary bricks) */
  cb.build(cart);
  const wheels: THREE.Group[] = [];
  for (const z of [-0.46, 0.46]) { const w = new THREE.Group(); w.position.set(-0.1, 0.42, z); cart.add(w); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 6, 24), timber); rim.castShadow = true; w.add(rim); for (let k = 0; k < 6; k++) w.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.78, 0.025).rotateZ((k / 6) * Math.PI), timber)); w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10).rotateX(Math.PI / 2), timber)); wheels.push(w); }
  cart.userData.wheels = wheels; return cart;
};

export const YARD = {
  BENCH: [0, 0, 0] as V3, TOP: 0.86,
  DEEP: [0.18, 0.86, 0.06] as V3,        // the deep mould / loaf on the bench (hook)
  NORMAL: [-0.22, 0.86, 0.08] as V3,   /* r20: right beside the loaf */      // the normal brick beside it
  AMOS: [0.15, 0, -0.6] as V3,           // Amos behind the bench, facing +z (the lens side)
  BOARD: [3.0, 0, 3.0] as V3,            // the duty board post at the end of the first drying row (face at y 1.95, turned toward the yard)
  HACK_X: 3.4,                           // first drying row
  TAX: [3.1, 0, 0.9] as V3,              // the taxman counting at the first row
  WALL_X: -2.0,                          // Silas's low wall (top 1.0 m), z -2.9..6
  SILAS: [-2.5, 0, -1.2] as V3,
  CART: [1.2, 0, 2.9] as V3,             // Amos's handcart of loaves (handles toward the gate)
  STACK: [-0.5, 0, 2.7] as V3,
  SEAT: [0.37, 0, 3.52] as V3,          // r5: two loaves Amos sits on (grey day)           // the unsold loaf stack (grey day), out in the open yard
  GATE: [5.6, 0, 6.6] as V3,
  KILN: [-2.9, 0, -13.5] as V3,   /* r59: into the hook's background (at x -4.5 it sat just off the left edge; f_40 did not read as a brickyard) */
  // the night demo on the bench (shed): scale left, model walls right, slate on the back wall
  SCALE: [-0.62, 0.86, -0.1] as V3, WALLS: [0.66, 0.86, -0.05] as V3, SLATE: [0.64, 1.68, -0.36] as V3,   /* r55: up 6 cm (the brick wall's top touched its frame) */   // r12: scale and model walls apart (no pan in front of a wall)
};

export const brickyard = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const groundM = lam("byGround2", () => ({ map: rep(clayGroundTex(), 10, 10), bumpMap: rep(clayGroundBump(), 10, 10), bumpScale: 3.0 } as THREE.MeshLambertMaterialParameters)); { const bm = (groundM as THREE.MeshLambertMaterial).bumpMap; if (bm) bm.wrapS = bm.wrapT = THREE.RepeatWrapping; }   /* r26b: finer tiling and real relief */
  (groundM.map as THREE.Texture).wrapS = (groundM.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
  const groundMesh = new THREE.Mesh(quad(V(-70, 0, 40), V(70, 0, 40), V(70, 0, -90), V(-70, 0, -90), 1, 1), groundM); groundMesh.receiveShadow = true; groundMesh.userData.noTint = true; root.add(groundMesh);
  /* r26f: a worn brick-paved work floor around the shed, the stack and the cart (the bare clay plane read as dead ground) */
  const paveM = lam("byPaveM", () => ({ map: rep(paverTex(), 1, 1), bumpMap: rep(paverBump(), 1, 1), bumpScale: 2.6 } as THREE.MeshLambertMaterialParameters));
  { const pm = paveM as THREE.MeshLambertMaterial; for (const t of [pm.map!, pm.bumpMap!]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14 / 2.2, 14 / 2.2); } }
  const pave = new THREE.Mesh(quad(V(-5, 0.003, 9), V(9, 0.003, 9), V(9, 0.003, -5), V(-5, 0.003, -5), 1, 1), paveM); pave.receiveShadow = true; root.add(pave);
  /* r70: one non-repeating wear layer over the whole paved floor - trodden dark lanes, clay smears, sand drifts, damp patches and two cart ruts
   *  (reviewers: the 2.2 m paver tile repeated visibly and read as flat pastel tiles) */
  { const wt = ctex("byYardWear", 2048, 2048, (g, r) => { g.clearRect(0, 0, 2048, 2048);
      const blob = (x: number, y: number, rad: number, c: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
      for (let i = 0; i < 70; i++) blob(r() * 2048, r() * 2048, 80 + r() * 260, `rgba(${46 + r() * 20},${34 + r() * 14},${26},${0.16 + r() * 0.2})`);
      for (let i = 0; i < 40; i++) blob(r() * 2048, r() * 2048, 60 + r() * 180, `rgba(${170 + r() * 40},${110 + r() * 30},${70},${0.12 + r() * 0.14})`);
      for (let i = 0; i < 30; i++) blob(r() * 2048, r() * 2048, 50 + r() * 160, `rgba(${214 + r() * 30},${196 + r() * 24},${150},${0.12 + r() * 0.14})`);
      for (const off of [-40, 40]) { g.strokeStyle = "rgba(40,28,20,0.22)"; g.lineWidth = 26; g.beginPath(); g.moveTo(1500 + off, 2048); g.bezierCurveTo(1350 + off, 1500, 1100 + off, 1150, 1200 + off, 600); g.stroke(); }
      for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,40,28,0.25)" : "rgba(230,210,170,0.2)"; g.fillRect(r() * 2048, r() * 2048, 2 + r() * 3, 2 + r() * 3); } });
    const wear = new THREE.Mesh(quad(V(-5, 0.0045, 9), V(9, 0.0045, 9), V(9, 0.0045, -5), V(-5, 0.0045, -5), 1, 1), new THREE.MeshLambertMaterial({ map: wt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    wear.receiveShadow = true; wear.renderOrder = 1; root.add(wear); }
  const grassM = lam("byGrass", () => ({ map: rep(ctex("byGrassT", 512, 512, (g, r) => { g.fillStyle = "#6a8a42"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2600; i++) { g.strokeStyle = r() < 0.5 ? "rgba(140,180,80,0.7)" : "rgba(50,80,30,0.6)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 6 - r() * 8); g.stroke(); } }), 1, 1) }));
  (grassM.map as THREE.Texture).wrapS = (grassM.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (grassM.map as THREE.Texture).repeat.set(30, 20);
  b.add(quad(V(-70, 0.005, -14), V(70, 0.005, -14), V(70, 0.005, -90), V(-70, 0.005, -90), 1, 1), grassM);
  // wet puddles (grey day): reflective patches, faded in by c.rain
  const puddleM = std("puddle4", { color: "#3c3634", emissive: "#120f0e",   /* r59: a warm wet darkening of the bricks (the cool sheen read as a blue smear) */   /* r55: a cool wet sheen, not a black hole (reviewers: "an unexplained dark blob on the pavement") */ roughness: 0.03,   /* r48: near-black wet (the slate blue read as a stain) */   /* r44: dark wet mirrors (pale blue read as painted smears) */   /* r35: pale sky reflections (the dark patches read as dry ground) */ metalness: 0.0, transparent: true, opacity: 0, depthWrite: false, alphaMap: ctex("byPuddleA", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 6, 64, 64, 63); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.55, "#d8d8d8"); gr.addColorStop(1, "#000000"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }) });   // r7: soft-edged wet patches   // r6: dark glossy water
  const puddles = new THREE.Group(); root.add(puddles);
  { const r = rng(17); for (let i = 0; i < 14; i++) { const pm = new THREE.Mesh(new THREE.CircleGeometry(0.24 + r() * 0.42, 18).scale(1, 0.6 + r() * 0.4, 1).rotateX(-Math.PI / 2).translate(-3 + r() * 10, 0.012, -5 + r() * 10), puddleM); pm.renderOrder = 1; puddles.add(pm); }
    // r5b: more puddles where the grey-day two-shot stands (sky reflections near the lens)
    for (const [x, z, rr] of [[-0.35, 5.7, 0.42], [0.72, 5.32, 0.3]] as [number, number, number][]) { const pm = new THREE.Mesh(new THREE.CircleGeometry(rr, 24).scale(1.4, 0.7, 1).rotateX(-Math.PI / 2).translate(x, 0.014, z), puddleM); pm.renderOrder = 1; puddles.add(pm); }   /* r76i: two puddles in the near ground of the rain two-shot */
    for (let i = 0; i < 12; i++) { const pm = new THREE.Mesh(new THREE.CircleGeometry(0.15 + r() * 0.28, 18).scale(1, 0.55 + r() * 0.4, 1).rotateX(-Math.PI / 2).translate(-1.6 + r() * 3.6, 0.013, 3.0 + r() * 4.2), puddleM); pm.renderOrder = 1; puddles.add(pm); } }
  // ground detail near the action: brick crumbs, straw, pebbles (instanced, sharp, lit)
  {
    const crumbM = tex("crumb", () => brickFaceTex("crumb", true)), stoneM = lam("byPebble3", () => ({ color: "#ffffff" }));   /* r23: warmer, lighter pebbles (they went navy in the cool shadows) */
    const g1 = (() => { const ig = new THREE.IcosahedronGeometry(0.03, 1); const pa = ig.attributes.position as THREE.BufferAttribute; for (let q = 0; q < pa.count; q++) { const k = 0.82 + 0.36 * Math.abs(Math.sin(q * 12.9898) * 43758.5453 % 1); pa.setXYZ(q, pa.getX(q) * k, pa.getY(q) * k, pa.getZ(q) * k); } ig.computeVertexNormals(); return ig; })(), r = rng(23), N = 110, M4 = new THREE.Matrix4(), PCOL = new THREE.Color();   /* r26b: rough, half-sunk stones of mixed colour (smooth spheres read as stickers) */   // r9: fewer orange crumbs (read as confetti)
    for (const [m, n] of [[crumbM, N], [stoneM, 820]] as [THREE.Material, number][]) {
      const im = new THREE.InstancedMesh(g1, m, n);
      // r5b: clustered, not sprinkled: drifts of crumbs and stones round ~40 centres (by the bench legs, the walls, the stacks)
      const CL: [number, number][] = []; for (let k = 0; k < 42; k++) CL.push([-3 + r() * 11, -4 + r() * 11]);
      for (let i = 0; i < n; i++) { const c0 = CL[Math.floor(r() * CL.length)], rr2 = 0.45 * r() * r(), aa = r() * 6.283, x = c0[0] + Math.cos(aa) * rr2 * 1.6, z = c0[1] + Math.sin(aa) * rr2, s = 0.35 + r() * r() * 2.2; const keep = m !== stoneM || i % 3 === 0;   /* r42: a third of the pebbles (the grey chips read as confetti on the pavers); the rng order is unchanged */ M4.compose(V(x, 0.004 - 0.006 * s, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), keep ? V(s * (0.8 + r()), s * 0.6, s) : V(0.0001 * r(), 0.0001, 0.0001)); im.setMatrixAt(i, M4); if (m === stoneM) im.setColorAt(i, PCOL.set(["#a08a6c", "#8a7a66", "#9a9086", "#7a6a58", "#b09a7a", "#6e665c"][Math.floor(r() * 6)])); }
      im.castShadow = true; im.receiveShadow = true; root.add(im);
    }
    { const hb = new THREE.BoxGeometry(0.12, 0.06, 0.1), im = new THREE.InstancedMesh(hb, crumbM, 36); for (let i = 0; i < 36; i++) { const x = -2 + r() * 8, z = -0.4 + r() * 7.5, s2 = 0.5 + r() * 0.5; const e = new THREE.Euler((r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5), k2 = i % 2 === 0 ? s2 : 0.0001; M4.compose(V(x, 0.03 * s2, z), new THREE.Quaternion().setFromEuler(e), V(k2, k2, k2)); im.setMatrixAt(i, M4); }   /* r42: half the broken bricks */ im.castShadow = true; im.receiveShadow = true; root.add(im); }
    const strawT = ctex("byStraw", 128, 64, (g, r2) => { g.clearRect(0, 0, 128, 64); for (let i = 0; i < 40; i++) { g.strokeStyle = r2() < 0.5 ? "#8e7a52" : "#6e5a3c";   /* r68: darker, trodden straw (a pale tuft read as a white smear on the wet paving) */   /* r12: duller straw */ g.lineWidth = 2 + r2() * 2; const y = 8 + r2() * 48; g.beginPath(); g.moveTo(r2() * 30, y); g.lineTo(98 + r2() * 30, y + (r2() - 0.5) * 20); g.stroke(); } });
    const sm2 = mat("byStrawM", () => new THREE.MeshLambertMaterial({ map: strawT, alphaTest: 0.5, side: THREE.DoubleSide }));
    const sg = new THREE.PlaneGeometry(0.2, 0.09).rotateX(-Math.PI / 2), im = new THREE.InstancedMesh(sg, sm2, 22); im.visible = false;   /* r73: no straw decals (they read as stray yellow streaks) */
    for (let i = 0; i < 22; i++) { M4.compose(V(-2.5 + r() * 9, 0.015, -3 + r() * 9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), V(1, 1, 1)); im.setMatrixAt(i, M4); }
    im.receiveShadow = true; root.add(im);
  }
  // ---- the lean-to moulding shed over Amos's bench ----
  const timber = tex("timber", () => beamHD(), "#a88a68"), plank = tex("plank", () => planksHD(), "#b49474");
  // r25: a worked moulding bench - planks with clay smears, sand dust, crumbs, cut marks and ring stains (the plain planks read as an empty table)
  const benchTop = lam("byWorkTop2", () => ({ color: "#c8b8a8",   /* r76i: a shade darker (its sunlit corner blew out hot) */ map: ctex("byWorkTopT2", 1024, 432, (g, r) => {
    for (let k = 0; k < 6; k++) { const y0 = k * 72; g.fillStyle = ["#a27c54", "#96724c", "#aa865c", "#9c7852", "#8e6c46", "#a6825a"][k];   /* r26: darker, worked wood (the pale planks read as an empty table) */ g.fillRect(0, y0, 1024, 72);
      for (let i = 0; i < 26; i++) { g.strokeStyle = r() < 0.5 ? "rgba(110,72,40,0.22)" : "rgba(240,214,170,0.18)"; g.lineWidth = 1 + r() * 2; g.beginPath(); const yy = y0 + 4 + r() * 64; g.moveTo(0, yy); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, yy + Math.sin(x * 0.01 + i) * 3 + (r() - 0.5) * 2); g.stroke(); }
      g.fillStyle = "rgba(60,36,20,0.75)"; g.fillRect(0, y0, 1024, 3); }
    for (let i = 0; i < 9; i++) { const x = r() * 1024, y = r() * 432, rx = 40 + r() * 110, ry = 14 + r() * 40; g.fillStyle = "rgba(150,92,58,0.42)"; g.beginPath(); g.ellipse(x, y, rx, ry, (r() - 0.5) * 0.6, 0, 6.3); g.fill(); g.fillStyle = "rgba(186,124,84,0.35)"; g.beginPath(); g.ellipse(x + 6, y - 3, rx * 0.6, ry * 0.5, 0, 0, 6.3); g.fill(); }
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.25 ? "rgba(236,214,170,0.22)" : "rgba(110,72,44,0.26)"; g.fillRect(r() * 1024, r() * 432, 1.5 + r() * 1.5, 1.5 + r() * 1.5); }   /* r76i (reviewer): a third of the sand specks (they read as noise) */
    for (let k = 0; k < 6; k++) { let x = 120 + r() * 260; while (x < 1000) { g.fillStyle = "rgba(52,30,16,0.7)"; g.fillRect(x, k * 72 + 2, 3, 70); g.fillStyle = "rgba(240,210,160,0.18)"; g.fillRect(x + 3, k * 72 + 2, 2, 70); x += 300 + r() * 320; } }   /* r76i: plank butt joints (unbroken boards read as one stretched texture) */
    for (let i = 0; i < 12; i++) { const x = r() * 1024, y = r() * 432; g.fillStyle = "rgba(70,42,22,0.5)"; g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 3 + r() * 3, 0, 0, 6.3); g.fill(); g.strokeStyle = "rgba(70,42,22,0.3)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, 11 + r() * 6, 5 + r() * 3, 0, 0, 6.3); g.stroke(); }   /* knots */
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? "rgba(122,86,58,0.55)" : "rgba(146,104,70,0.5)";   /* r35: dull clay crumbs (the red flecks read as blood) */ g.beginPath(); g.ellipse(r() * 1024, r() * 432, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, 6.3); g.fill(); }
    for (let i = 0; i < 14; i++) { g.strokeStyle = "rgba(70,40,22,0.35)"; g.lineWidth = 1.2; const x = r() * 1024, y = r() * 432, a2 = (r() - 0.5) * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a2) * (40 + r() * 90), y + Math.sin(a2) * 20); g.stroke(); }
    /* r35: no ring stains (the outlined ellipses read as debug markers) */
  }) }));
  const wallFired = lam("byWallFired", () => ({ map: rep(brickWallTex("normal", 92, 30), 1, 1) }));
  const wallTiled = lam("byWallTiled3", () => ({ color: "#b0a698", map: (() => { const t = brickWallTex("normal", 92, 30).clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t; })() }));
  b.add(boxGeo(V(-2.4, 0, -3.25), V(2.8, 1.1, -2.95), 1.6), wallTiled); b.add(new THREE.BoxGeometry(5.4, 0.08, 0.4).translate(0.2, 1.14, -3.1), timber);                 // back wall (brick)
  for (const x of [-2.2, 2.6]) b.add(new THREE.BoxGeometry(0.16, 2.75, 0.16).translate(x, 1.37, -0.65), timber);  // front posts
  for (const x of [-2.2, 1.15, 2.6]) b.add(new THREE.BoxGeometry(0.16, 3.1, 0.16).translate(x, 1.55, -2.9), timber); b.add(new THREE.BoxGeometry(5.0, 0.16, 0.16).translate(0.2, 3.05, -2.9), timber);
  b.add(new THREE.BoxGeometry(5.0, 0.16, 0.16).translate(0.2, 2.75, -0.65), timber);                 // front beam
  const roofM = lam("byRoofTile", () => ({ map: rep(roofHD("#9a4a32"), 2, 1) }));
  { const g = new THREE.BoxGeometry(5.6, 0.24, 3.0); g.translate(0, 0.08, 0); g.rotateX(0.13); g.translate(0.2, 3.0, -1.85); b.add(g, roofM); }   /* r61: a thick roof (the thin slab let dashes of sun leak onto the boarded underside in the hook) */
  /* r50: boarded underside and rafters (from below the roof showed the tops of its tiles) */
  { const under = lam("byRoofUnder2", () => ({ map: rep(planksHD(), 3, 1), color: "#8a6a4c", emissive: "#3e2818" })); const pg = new THREE.PlaneGeometry(5.5, 2.95); pg.rotateX(Math.PI / 2); pg.rotateX(0.13); pg.translate(0.2, 2.93, -1.85); b.add(pg, under);   /* r68b: a warm bounce on the boarded underside, 3 cm lower (the top band of the hook was near-black with dashes of sun leaking through) */
    for (let x = -2.45; x <= 2.9; x += 0.89) { const rg = new THREE.BoxGeometry(0.08, 0.11, 2.95); rg.translate(0, -0.1, 0); rg.rotateX(0.13); rg.translate(x, 3.0, -1.85); b.add(rg, timber); } }
  // the bench: thick plank top, trestle legs, sand tray, clay heap, the two moulds, strike stick
  /* r26: work clutter at the near corners of the bench (the lower third read as empty planks): a trowel and a wooden A stamp
   *  at the hook's corners, a cutting wire and a clay pad pressed with the A at the shed's, a second trowel by the towers */
  { const steel = std("benchSteel", { color: "#8a8e94", roughness: 0.35, metalness: 0.8 }), wood = lam("benchToolWood", () => ({ color: "#7a5434" })), clayW = std("benchClayPad", { color: "#a86c4a", roughness: 0.5, metalness: 0 });
    const aPad = new THREE.MeshLambertMaterial({ map: ctex("byAPad", 128, 128, (g) => { g.fillStyle = "#a86c4a"; g.fillRect(0, 0, 128, 128); g.font = "900 92px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(255,214,176,0.5)"; g.fillText("A", 64, 70); g.fillStyle = "#5a2e1a"; g.fillText("A", 64, 66); }), transparent: true });
    const trowel = (x: number, z: number, ry: number) => { const t = new THREE.Group(); t.position.set(x, 0.862, z); t.rotation.y = ry; root.add(t);
      const bl = new THREE.Shape([new THREE.Vector2(0, -0.045), new THREE.Vector2(0.15, 0), new THREE.Vector2(0, 0.045), new THREE.Vector2(-0.01, 0)]);
      const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bl, { depth: 0.004, bevelEnabled: false }).rotateX(-Math.PI / 2), steel); blade.castShadow = true; t.add(blade);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.015, 0.11, 10).rotateZ(Math.PI / 2).translate(-0.075, 0.03, 0), wood); h.castShadow = true; t.add(h);
      t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 5).rotateZ(0.9).translate(-0.01, 0.015, 0), steel)); };
    const stamp = (x: number, z: number, ry: number) => { const t = new THREE.Group(); t.position.set(x, 0.86, z); t.rotation.y = ry; root.add(t);
      const blk = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.04, 0.065, 2, 0.006).translate(0, 0.02, 0), wood); blk.castShadow = true; t.add(blk);
      const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 10).translate(0, 0.075, 0), wood); kn.castShadow = true; t.add(kn); t.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8).translate(0, 0.115, 0), wood)); };
    const pad = (x: number, z: number) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.016, 20).translate(x, 0.868, z), clayW); c.castShadow = true; root.add(c);
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.085).rotateX(-Math.PI / 2).translate(x, 0.8775, z), aPad); root.add(d); };
    const wire = (x: number, z: number) => { for (const dx of [-0.11, 0.11]) { const hh = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.06, 8).rotateX(Math.PI / 2).translate(x + dx, 0.872, z), wood); hh.castShadow = true; root.add(hh); }
      root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.22, 4).rotateZ(Math.PI / 2).translate(x, 0.868, z + 0.012), steel)); };
    void pad; void wire;   /* r35: the stamp joins the day props (below); the pad decal is gone */   /* r26f: the cutting wire read as unexplained pegs */
    /* r26d: story props at the near corners: a finished A-loaf (hook, left) and the two moulds, shallow and double-deep, in front of the towers */
    /* r26e: (the corner loaf in the hook came out as a big blurred block: removed) */
    const mouldM = lam("benchMouldWood", () => ({ map: beamHD(), color: "#9a7650" }));
    const mould = (x: number, z: number, h: number, ry: number) => { const g2 = new THREE.Group(); g2.position.set(x, 0.86, z); g2.rotation.y = ry; root.add(g2); const L = 0.3, D = 0.18, t = 0.022;
      for (const [w, d, px, pz] of [[L + 2 * t, t, 0, D / 2 + t / 2], [L + 2 * t, t, 0, -D / 2 - t / 2], [t, D, L / 2 + t / 2, 0], [t, D, -L / 2 - t / 2, 0]] as const) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(px, h / 2, pz), mouldM); me.castShadow = true; g2.add(me); }
      for (const sx of [-1, 1]) { const hd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.04).translate(sx * (L / 2 + t + 0.03), h - 0.012, 0), mouldM); g2.add(hd); } };
    void mould; }   /* r26e: the corner moulds hid the tower bases in the low insert: not placed */
  b.add(new THREE.BoxGeometry(1.9, 0.09, 0.78).translate(0, 0.815, 0), benchTop);
  for (const x of [-0.8, -0.28, 0.42, 0.8]) for (const z of [-0.3, 0.3]) b.add(new THREE.BoxGeometry(0.09, 0.78, 0.09).rotateZ(x > 0 ? 0.06 : -0.06).translate(x, 0.39, z), timber);   // r5: trestle legs under the middle too (the bench never floats in a close frame)
  b.add(new THREE.BoxGeometry(1.7, 0.05, 0.06).translate(0, 0.3, 0.3), timber);
  // r12: a front skirt board under the bench top (close frames show lit wood, not a dark gap under the bench)
  b.add(new THREE.BoxGeometry(1.86, 0.42, 0.03).translate(0, 0.56, 0.37), benchTop);
  const sandM = lam("bySand", () => ({ map: ctex("bySandT", 256, 256, (g, r) => { g.fillStyle = "#e2cc9c"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,246,220,0.6)" : "rgba(150,120,80,0.4)"; g.fillRect(r() * 256, r() * 256, 2, 2); } }) }));
  // r20: the sand tray and the clay heap are day props (the night demo clears the bench for the scale)
  const dayG = new THREE.Group(); root.add(dayG); dayG.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.32).translate(-0.72 - 0.16, 0.89, -0.2), timber)); dayG.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.28).translate(-0.72 - 0.16, 0.915, -0.2), sandM));   // r12: off the hook frame's left edge
  const clayM = std("clay", { map: ctex("byClayLump", 256, 256, (g, r) => { g.fillStyle = "#a8774e"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 80; i++) blot(g, r() * 256, r() * 256, 10 + r() * 30, r() < 0.5 ? "rgba(200,150,100,0.4)" : "rgba(90,58,36,0.35)"); for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(255,230,190,0.35)"; g.lineWidth = 2; g.beginPath(); g.arc(r() * 256, r() * 256, 8 + r() * 30, 0, 2); g.stroke(); } }), roughness: 0.55, metalness: 0 });
  /* r71: the bench front in the hook is worked: a dusting of sand with finger drags, a small clay lump, a strike stick and a few crumbs (reviewers: a bare plank band under the bricks) */
  { const st = ctex("byBenchSand", 512, 128, (g, r) => { g.clearRect(0, 0, 512, 128); for (let i = 0; i < 2600; i++) { const x = r() * 512, y = 64 + (r() - 0.5) * 120 * r(); g.fillStyle = r() < 0.7 ? `rgba(226,196,140,${0.3 + r() * 0.4})` : `rgba(150,104,66,${0.3 + r() * 0.3})`; g.fillRect(x, y, 1.5 + r() * 2, 1.5 + r() * 2); }
      g.strokeStyle = "rgba(120,84,54,0.35)"; g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(80 + k * 22, 30); g.quadraticCurveTo(120 + k * 22, 70, 100 + k * 20, 104); g.stroke(); } });
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.2).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: st, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); sand.position.set(0.02, 0.862, 0.29); sand.renderOrder = 2; dayG.add(sand);
    const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 2).scale(1.3, 0.62, 1.0), clayM); lump.position.set(-0.2, 0.878, 0.12); lump.visible = true;   /* r76i: back in, inside the hook's lower band (the bench read bare) */ dayG.add(lump);   /* r74: (it was a blurred disc cut by the hook's left edge) */
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.018, 0.028), timber); stick.position.set(-0.06, 0.871, 0.16); stick.rotation.y = 0.18; stick.visible = true; dayG.add(stick);   /* r73: no strike stick (in the sun patch it blew out to an orange smear) */
    /* r76i (both reviewers: the hook's bottom band was an empty plank table): the near bench top dressed - a heap of moulding sand, a
     *  trowel, a spare normal brick and clay crumbs, all low so they never cover the two blocks */
    { const sandM = lam("byBenchSand", () => ({ color: "#c8b08a" })), ironM = lam("byTrowelIron", () => ({ color: "#7a7c82" })), hb2 = new Batch();
      hb2.add(new THREE.SphereGeometry(0.11, 16, 8, 0, TAU, 0, Math.PI / 2).scale(1.4, 0.32, 1.0).translate(-0.24, 0.86, 0.3), sandM);
      hb2.add(new THREE.BoxGeometry(0.16, 0.006, 0.08).translate(0.2, 0.866, 0.3), ironM); hb2.add(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8).rotateZ(Math.PI / 2).translate(0.33, 0.875, 0.3), timber);
      hb2.add(new THREE.BoxGeometry(0.21, 0.065, 0.1).rotateY(0.4).translate(0.02, 0.8925, 0.34), lam("byBenchBrick", () => ({ map: brickFaceTex("firedB2", true) })));
      for (let i = 0; i < 9; i++) hb2.add(new THREE.IcosahedronGeometry(0.008 + (i % 3) * 0.004, 0).translate(-0.1 + i * 0.035, 0.865, 0.24 + (i % 2) * 0.05), clayM);
      hb2.build(dayG); }
    const rc = rng(733); for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.006 + rc() * 0.008, 1), clayM); c.position.set(-0.32 + rc() * 0.62, 0.864, 0.22 + rc() * 0.14); dayG.add(c); } }
  // r22: the clay heap at the bench's front-left corner and three finished loaves at the front-right (the bench read as empty)
  dayG.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 2).scale(1.25, 0.62, 0.95).translate(-0.66, 0.905, 0.16), clayM));   /* r35: the clay heap off the hook frame (near the lens it came out as a soft blob); the A stamp front-right */
  { const sw = lam("benchToolWood", () => ({ color: "#7a5434" })), t = new THREE.Group(); t.position.set(-0.58, 0.86, 0.06); t.rotation.y = 0.3; dayG.add(t);   /* r55: off the hook frame (it was cut by the left edge) */ t.add(new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.04, 0.065, 2, 0.006).translate(0, 0.02, 0), sw)); t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 10).translate(0, 0.075, 0), sw)); t.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8).translate(0, 0.115, 0), sw)); }
  { const lm = tex("fired2", () => brickFaceTex("fired2", true)), lt = tex("loafTopF", () => brickFaceTex("loafTopF", true, "A"));
    for (const [x, y, z, ry] of [] as [number, number, number, number][]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.17).translate(0, 0.1, 0), [lm, lm, lt, lm, lm, lm]); m.position.set(x, 0.86 + y, z); m.rotation.y = ry; dayG.add(m); } }
  /* r37: on the bench's front-right, the trick in miniature: two finished normal bricks stacked beside one stamped loaf, the
   *  same clay in the same light (the lower fifth read as an empty table, and the held pair read as two materials) */
  { const tb = lam("byTB2fired1", () => ({ map: brickFaceTex("fired1", true), bumpMap: brickBumpTex(), bumpScale: 3.4 } as THREE.MeshLambertMaterialParameters)), tl = lam("byTB2firedA1", () => ({ map: brickFaceTex("firedA1", true, "A"), bumpMap: brickBumpTex(), bumpScale: 3.4 } as THREE.MeshLambertMaterialParameters));
    for (let q = 0; q < 2; q++) { const m = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.066, 0.11, 2, 0.006).translate(0, 0.033 + q * 0.068, 0), tb); m.position.set(-0.29, 0.86, -0.16); m.rotation.y = 0.1 + q * 0.05; m.userData.mini = 1;   /* r76: the pair under his held brick, at the bench's left corner (bottom-centre they hid his body) */   /* r48: further back on the bench (they sat in the bottom UI band) */ dayG.add(m); }
    const lm = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.134, 0.11, 2, 0.006).translate(0, 0.067, 0), tl); lm.position.set(0.36, 0.86, -0.16); lm.rotation.y = -0.16; lm.userData.mini = 1;   /* r76: the loaf under his held loaf, right corner */ dayG.add(lm); }
  dayG.traverse((o) => { o.castShadow = o.receiveShadow = true; });
  // normal brick (fired, the comparison) + a normal mould leaning on the back
  const BR = { l: 0.3, d: 0.17, h: 0.1 };   // r22: normal 3:1 face, loaf 1.5:1 (a chunky near-cube) - the 3.6:1 / 1.8:1 pair read as two ordinary bricks
  // r20: hero bricks carry a bump map (pits, grains, creases) on top of the clean clay colour
  const bumpT = brickBumpTex(); const texB = (key: string, t: () => THREE.Texture) => lam("byTB2" + key, () => ({ map: t(), bumpMap: bumpT, bumpScale: 3.4 } as THREE.MeshLambertMaterialParameters));
  const firedV = [0, 1, 2, 3].map((k) => texB("fired" + k, () => brickFaceTex("fired" + k, true)));
  /* r42: the shed's bricks and loaves under the lantern use the same faces multiplied darker (they came out salmon plastic
   *  next to the dark-red fired brick of the day scenes) */
  const texBd = (key: string, t: () => THREE.Texture) => lam("byTB2d" + key, () => ({ map: t(), bumpMap: bumpT, bumpScale: 3.4, color: "#b07c70" } as THREE.MeshLambertMaterialParameters));
  const firedVd = [0, 1, 2, 3].map((k) => texBd("fired" + k, () => brickFaceTex("fired" + k, true)));
  const firedM = texB("fired", () => brickFaceTex("fired", true)), greenM = tex("green", () => brickFaceTex("green", false)), loafTop = tex("loafTop", () => brickFaceTex("loafTop", false, "A")), loafTopF = texB("loafTopF", () => brickFaceTex("loafTopF", true, "A"));
  const brickMesh = (h: number, m: THREE.Material, topM?: THREE.Material) => { const mm = topM ? [m, m, topM, m, m, m] : m; const me = new THREE.Mesh(new RoundedBoxGeometry(BR.l, h, BR.d, 2, 0.01).translate(0, h / 2, 0), mm as THREE.Material);   /* r25: softened arrises catch the light (sharp boxes read as plastic) */ me.castShadow = true; me.receiveShadow = true; return me; };
  const normalBrick = brickMesh(BR.h, firedM); normalBrick.position.set(...YARD.NORMAL); root.add(normalBrick);
  // the deep mould (its own group: lifts off the loaf) + the loaf inside it
  const mouldWood = tex("mould", () => beamHD(), "#8a6040");
  const loaf = brickMesh(BR.h * 2, firedM, loafTopF); loaf.position.set(...YARD.DEEP); root.add(loaf);
  const mould = new THREE.Group(); mould.position.set(...YARD.DEEP); root.add(mould);
  { const mb = new Batch(), t = 0.03, H = BR.h * 2 + 0.01; mb.add(bx(BR.l + 2 * t, H, t).translate(0, H / 2, BR.d / 2 + t / 2), mouldWood); mb.add(bx(BR.l + 2 * t, H, t).translate(0, H / 2, -BR.d / 2 - t / 2), mouldWood); mb.add(bx(t, H, BR.d).translate(BR.l / 2 + t / 2, H / 2, 0), mouldWood); mb.add(bx(t, H, BR.d).translate(-BR.l / 2 - t / 2, H / 2, 0), mouldWood); for (const s of [-1, 1]) mb.add(bx(0.07, 0.04, 0.05).translate(s * (BR.l / 2 + 0.06), H * 0.7, 0), mouldWood); mb.build(mould); }
  const mouldClay = new THREE.Mesh(new THREE.BoxGeometry(BR.l, 1, BR.d).translate(0, 0.5, 0), clayM); mouldClay.scale.y = 0.001; mould.add(mouldClay);   // clay filling the empty deep mould (scene 1, f256..)
  const strike = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.04), mouldWood); strike.position.set(0.2, 0.89, 0.3); strike.rotation.y = 0.3; strike.castShadow = true; root.add(strike);
  const normMould = new THREE.Group(); normMould.position.set(-0.05, 0.86, -0.25); root.add(normMould);
  { const mb = new Batch(), t = 0.03, H = BR.h + 0.01; mb.add(bx(BR.l + 2 * t, H, t).translate(0, H / 2, BR.d / 2 + t / 2), mouldWood); mb.add(bx(BR.l + 2 * t, H, t).translate(0, H / 2, -BR.d / 2 - t / 2), mouldWood); mb.add(bx(t, H, BR.d).translate(BR.l / 2 + t / 2, H / 2, 0), mouldWood); mb.add(bx(t, H, BR.d).translate(-BR.l / 2 - t / 2, H / 2, 0), mouldWood); mb.build(normMould); }
  // tools on the back wall, buckets, a water butt, sacks
  for (let i = 0; i < 3; i++) { const sh = new THREE.Group(); sh.position.set(1.4 + i * 0.32, 0.6, -2.85); sh.visible = false; sh.rotation.z = 0.12 - i * 0.08; root.add(sh); sh.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.2, 6).translate(0, 0.6, 0), timber)); sh.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.02).translate(0, -0.05, 0), std("iron", { color: "#5a5e66", roughness: 0.5, metalness: 0.7 }))); }
  barrel(root, [-2.25, 0, -2.4], 0.46, 0.4); sack(root, [-2.2, 0, -2.65], 0.38);   /* r35: out past the hook frame's left edge (a sliver of them showed there) */   /* r76i: the cream sack behind the builders went (it read as a giant onion behind a cap) */
  // the lantern on the shed post (lit at night; a dim glass by day)
  const wallLamp = lamp(root, [1.3, 1.16, -2.82], "#ffb45a", 0, 3.2, "table");   // r7: a candle lamp on the back wall (night): lights the wall behind Amos
  const lant = lamp(root, [0.42, 2.08, -0.5], "#ffb45a", 0, 11, "hang");   /* r36: brighter (its pool did not reach the scale) */ (lant.userData.light as THREE.PointLight).decay = 2; (lant.userData.light as THREE.PointLight).distance = 3.8; (lant.userData.glow as THREE.Sprite).scale.multiplyScalar(0.36);   /* r76b: smaller still (the lantern outshone the scale) */   /* r21: a smaller halo (it bloomed over a quarter of the shed frame) */   // r12: moved top-left at night (pose), off Amos's hat
  const benchSpot = new THREE.SpotLight("#ffbf70", 0, 3.6, 0.5, 0.6, 1.6); benchSpot.position.set(-0.1, 2.0, 0.7); benchSpot.target.position.set(0.0, 1.25, -0.25);   /* r46: aimed at the scale and the towers (the empty table was the brightest thing in the shed) */ root.add(benchSpot, benchSpot.target);   // the lantern's light on the demo props
  // the slate on the back wall (night demo) + the excise notice with the cipher
  const slateMat = new THREE.MeshBasicMaterial({ map: slateTex(0, 0), toneMapped: true }); const slate = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.64), slateMat); slate.position.set(...YARD.SLATE); root.add(slate);
  const slFrame = new THREE.Group(); slFrame.position.set(...YARD.SLATE); root.add(slFrame);   // a small slate leaning on the bench
  { const fr = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.4, 0.025), timber); slFrame.add(fr); }
  // r12: the slate stands on a little easel behind the model walls (the tallies sit right above each wall)
  for (const x of [-0.27, 0.27]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03).translate(0, -0.25, -0.02), timber); leg.position.set(x, -0.18, 0); slFrame.add(leg); }
  slFrame.rotation.x = -0.12; slFrame.rotation.y = 0; slFrame.scale.setScalar(1.2); /* r20: a bigger slate (the chalk reads in the insert) */ slate.geometry = new THREE.PlaneGeometry(0.48, 0.34); slate.position.set(0, 0, 0.016); root.remove(slate); slFrame.add(slate);
  // ---- the night demo (visible with c.trick): scale "SAME CLAY", two model walls (8 normal / 4 loaves), coins ----
  const trick = new THREE.Group(); root.add(trick);
  /* r54: blue moonlight on the shed's back wall and rafters at night (reviewers: brown murk, no blue night against the warm
   *  lantern pool, a crushed black ceiling) - in the trick group, so only the night shed gets it */
  { const moonW = new THREE.PointLight("#7aa4d8", 3.4, 6.5, 1.1);   /* r76i (both reviewers): a weaker teal moon - the blue on warm planks read lavender */   /* r76f: a stronger cool window side against the lantern */ moonW.position.set(-1.7, 2.3, -1.6); trick.add(moonW);
    const rafter = new THREE.PointLight("#7e98dc", 1.4, 4.5, 1.3); rafter.position.set(0.3, 2.75, 0.4); trick.add(rafter); }
  // r21: at night the shed's shutter boards are up behind the bench (it read as an open table in a yard): planks, a shelf
  // of bricks, loaves, a bucket and a spare mould, tools on pegs - lit by the lantern
  { const sb = new Batch(), z = -2.98, sh = tex("shutter", () => planksHD(), "#9a7a58");
    sb.add(boxGeo(V(-2.2, 0.72, z - 0.04), V(2.6, 3.04, z + 0.02), 1.4), sh);   /* r50: down behind the bench (a cold blue brick band showed under the boards) */   /* r26b: closed to the right post too (the yard showed through beside the towers) */   /* r26b: up to the beam (a sky-blue slit showed above it) */
    for (const x of [-1.6, -0.2]) sb.add(new THREE.BoxGeometry(0.1, 1.8, 0.05).translate(x, 2.02, z + 0.05), timber);
    sb.add(new THREE.BoxGeometry(2.4, 0.04, 0.26).translate(-0.55, 1.78, z + 0.15), timber);
    for (const x of [-1.5, -0.4, 0.5]) sb.add(new THREE.BoxGeometry(0.04, 0.14, 0.2).translate(x, 1.69, z + 0.12), timber);
    const fv = [0, 1, 2, 3].map((k) => tex("fired" + k, () => brickFaceTex("fired" + k, true)));
    for (let i = 0; i < 3; i++) sb.add(new THREE.BoxGeometry(0.3, 0.2, 0.17).translate(-1.45 + i * 0.34, 1.9, z + 0.14), fv[i % 4]);
    for (let i = 0; i < 2; i++) sb.add(new THREE.BoxGeometry(0.3, 0.1, 0.17).translate(-0.25 + i * 0.34, 1.85, z + 0.14), fv[(i + 2) % 4]);
    sb.add(new THREE.CylinderGeometry(0.11, 0.09, 0.2, 14).translate(0.42, 1.9, z + 0.14), lam("byBucket", () => ({ map: beamHD(), color: "#8a6a4a" })));
    // a spare deep mould and a shovel hanging on pegs
    const mw = tex("mould", () => beamHD(), "#8a6040");
    for (const [x0, y0] of [[-1.05, 2.42]] as const) { sb.add(new THREE.BoxGeometry(0.42, 0.03, 0.04).translate(x0, y0, z + 0.06), mw); sb.add(new THREE.BoxGeometry(0.42, 0.03, 0.04).translate(x0, y0 - 0.22, z + 0.06), mw); sb.add(new THREE.BoxGeometry(0.03, 0.25, 0.04).translate(x0 - 0.2, y0 - 0.11, z + 0.06), mw); sb.add(new THREE.BoxGeometry(0.03, 0.25, 0.04).translate(x0 + 0.2, y0 - 0.11, z + 0.06), mw); }
    sb.add(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 6).translate(-1.95, 2.05, z + 0.06), timber); sb.add(new THREE.BoxGeometry(0.22, 0.28, 0.02).translate(-1.95, 1.42, z + 0.06), std("iron", { color: "#5a5e66", roughness: 0.5, metalness: 0.7 }));
    { const rm = lam("byRope2", () => ({ color: "#86683f" })); for (let q = 0; q < 4; q++) sb.add(new THREE.TorusGeometry(0.12 - q * 0.004, 0.026, 7, 20).rotateY(0.15 * q).translate(0.85 + q * 0.006, 2.3 - q * 0.012, z + 0.06 + q * 0.02), rm); sb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6).rotateX(Math.PI / 2).translate(0.85, 2.42, z + 0.03), rm); }   /* r26b: a thick hemp coil on a peg (a thin pale ring read as a stray white circle) */
    sb.build(trick); }
  /* r38: a working shelf right behind the bench at night (z -1.3): moulds, loaves, a bucket, a jug, rope, sacks, a shovel -
   *  near enough to read through the inserts' blur (the far shutter wall read as an empty dark void) */
  { const wb = new Batch(), z = -1.32, tw = tex("timber", () => beamHD(), "#a88a68"), pk = tex("plank", () => planksHD(), "#b49474"), mw = tex("mould", () => beamHD(), "#8a6040");
    for (const x of [-1.3, 1.5]) wb.add(new THREE.BoxGeometry(0.07, 2.0, 0.07).translate(x, 1.0, z), tw);
    for (const y of [0.95, 1.5]) wb.add(new THREE.BoxGeometry(2.86, 0.04, 0.3).translate(0.1, y, z + 0.04), pk);
    const fv = firedVd, fa = [0, 1, 2, 3].map((k) => texBd("firedA" + k, () => brickFaceTex("firedA" + k, true, "A")));
    for (let i = 0; i < 3; i++) wb.add(new RoundedBoxGeometry(0.28, 0.18, 0.15, 2, 0.006).translate(-1.12, 1.61 + i * 0.185, z + 0.03 + (i % 2) * 0.01), fa[i % 4]);   /* r40: away from behind the pans */       // a stack of loaves, top shelf left
    void fv;                    // normal bricks beside them
    wb.add(new THREE.CylinderGeometry(0.1, 0.08, 0.2, 14).translate(-0.66, 1.62, z + 0.04), lam("byBucket", () => ({ map: beamHD(), color: "#8a6a4a" })));
    wb.add(new THREE.CylinderGeometry(0.055, 0.075, 0.2, 12).translate(0.25, 1.62, z + 0.04), lam("byJug", () => ({ color: "#c8b48a" }))); wb.add(new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI).rotateZ(-Math.PI / 2).translate(0.32, 1.64, z + 0.04), lam("byJug", () => ({ color: "#c8b48a" })));
    for (const [x0, y0, h] of [[0.75, 1.52, 0.11], [0.75, 1.64, 0.22]] as const) { wb.add(new THREE.BoxGeometry(0.4, h, 0.025).translate(x0, y0 + h / 2, z - 0.06), mw); wb.add(new THREE.BoxGeometry(0.4, h, 0.025).translate(x0, y0 + h / 2, z + 0.12), mw); wb.add(new THREE.BoxGeometry(0.025, h, 0.16).translate(x0 - 0.19, y0 + h / 2, z + 0.03), mw); wb.add(new THREE.BoxGeometry(0.025, h, 0.16).translate(x0 + 0.19, y0 + h / 2, z + 0.03), mw); }   // two moulds, shallow and double-deep
    for (let q = 0; q < 3; q++) wb.add(new THREE.TorusGeometry(0.1 - q * 0.004, 0.022, 7, 18).rotateX(Math.PI / 2).translate(1.2, 1.535 + q * 0.04, z + 0.03), lam("byRope2", () => ({ color: "#86683f" })));
    /* r40: (the lower-shelf row of loaves merged with the pans) */
    wb.add(new THREE.CylinderGeometry(0.016, 0.016, 1.25, 6).rotateZ(0.18).translate(1.68, 0.62, z + 0.08), tw); wb.add(new THREE.BoxGeometry(0.2, 0.26, 0.02).rotateZ(0.18).translate(1.79, 0.06, z + 0.08), std("iron", { color: "#5a5e66", roughness: 0.5, metalness: 0.7 }));
    /* r42: tools on the back wall above the shelf (a shovel and a saw on pegs), pots and a basket on the lower shelf ends */
    wb.add(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 6).translate(-0.3, 2.12, z - 0.07), tw); wb.add(new THREE.BoxGeometry(0.17, 0.22, 0.012).translate(-0.3, 1.6, z - 0.07), std("iron", { color: "#5a5e66", roughness: 0.5, metalness: 0.7 }));
    wb.add(new THREE.BoxGeometry(0.4, 0.11, 0.006).rotateZ(-0.25).translate(0.42, 2.12, z - 0.075), std("sawIron", { color: "#8a8e96", roughness: 0.35, metalness: 0.75 })); wb.add(new THREE.BoxGeometry(0.1, 0.12, 0.03).rotateZ(-0.25).translate(0.2, 2.18, z - 0.07), tw);
    for (const [x0, h, rr] of [[1.12, 0.17, 0.08], [1.3, 0.13, 0.065]] as const) wb.add(new THREE.CylinderGeometry(rr * 0.75, rr, h, 14).translate(x0, 0.97 + h / 2, z + 0.04), lam("byPot", () => ({ color: "#b0603c" })));
    /* r58: (the basket under the left pan read as weight on one side of the scale: removed) */
    /* r45: more on the shelves - a row of glazed jars and a stack of folded sacks up top, a coil of rope and a mallet on pegs */
    for (let i = 0; i < 4; i++) wb.add(new THREE.CylinderGeometry(0.045, 0.055, 0.12 + (i % 2) * 0.04, 12).translate(-0.42 + i * 0.12, 1.52 + 0.06 + (i % 2) * 0.02, z + 0.05), lam("byJar" + (i % 2), () => ({ color: i % 2 ? "#6e5a3a" : "#8a4a2c" })));
    for (let i = 0; i < 3; i++) wb.add(new THREE.BoxGeometry(0.34, 0.035, 0.22).rotateY((i - 1) * 0.08).translate(0.45, 1.538 + i * 0.036, z + 0.04), lam("bySackF" + (i % 2), () => ({ color: i % 2 ? "#b49a6c" : "#a68c5e" })));
    for (let q = 0; q < 3; q++) wb.add(new THREE.TorusGeometry(0.09 - q * 0.006, 0.016, 6, 16).translate(-0.85, 2.05 - q * 0.02, z - 0.06), lam("byRope2", () => ({ color: "#86683f" })));
    wb.add(new THREE.CylinderGeometry(0.014, 0.014, 0.13, 8).rotateX(Math.PI / 2).translate(-0.85, 2.122, z - 0.05), tw);   /* r62: the peg the rope coil hangs on (it floated on the wall) */
    wb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6).rotateZ(0.15).translate(1.05, 1.98, z - 0.07), tw); wb.add(new THREE.BoxGeometry(0.12, 0.07, 0.07).translate(1.07, 2.14, z - 0.07), tw);
    wb.build(trick); sack(trick, [-1.95, 0, z + 0.05], 0.3, "#b8986a"); sack(trick, [-1.85, 0, z + 0.3], 0.26);
    /* r45: the duty notice pinned to the shed wall (the brick tax itself, in the room where Amos beats it) */
    { const nt = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.44), new THREE.MeshLambertMaterial({ map: ctex("byDutyNotice", 340, 440, (g) => { g.fillStyle = "#efe4c8"; g.fillRect(0, 0, 340, 440); g.fillStyle = "rgba(120,90,50,0.12)"; for (let i = 0; i < 30; i++) g.fillRect(i * 11, 0, 2, 440);
      g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.font = "900 40px Georgia, serif"; g.fillText("BRICK", 170, 70); g.fillText("DUTY", 170, 116); g.fillStyle = "#8a2a1e"; g.fillRect(40, 136, 260, 6); g.fillStyle = "#2a1a10"; g.font = "700 30px Georgia, serif"; g.fillText("2s. 6d.", 170, 196); g.font = "italic 600 26px Georgia, serif"; g.fillText("per thousand", 170, 236); g.fillText("bricks", 170, 270); g.font = "700 22px Georgia, serif"; g.fillText("BY ORDER OF", 170, 340); g.fillText("THE KING  1784", 170, 372); }) }));
      nt.position.set(1.85, 1.95, z - 0.075); nt.rotation.z = 0.04;   /* r47: clear of the slate insert's right edge (it came out cut) */ trick.add(nt); }
    /* r42b: (a barrel here showed only its blue-lit top hoop past the bench end) */ }   /* r44b: (the two sacks past the bench end came out as a cut grey object at the insert's edge) */
  // r21: the demo corner of the bench is a worked surface (it read as an empty table): clay crumbs, a chalk stub, a rag, a
  // tally stick, plus a warm fill on the two model walls so both read as the same clay
  { const cb = new Batch(), crumb = lam("byCrumb", () => ({ color: "#a8603e" })), cr = rng(57);
    for (let i = 0; i < 16; i++) { const x = cr() < 0.5 ? 0.12 + cr() * 0.16 : 1.0 + cr() * 0.14 - 9, z = 0.12 + cr() * 0.24;   /* r44: the right-end crumbs moved away (one floated at the insert's edge) */   /* r22: crumbs at the two ends only (not under the caption) */ if (Math.abs(x - (YARD.WALLS[0] - 0.2)) < 0.09 || Math.abs(x - (YARD.WALLS[0] + 0.21)) < 0.09) continue; const sc = 0.008 + cr() * 0.014; cb.add(new THREE.DodecahedronGeometry(1, 0).scale(sc * 1.3, sc * 0.7, sc).rotateY(cr() * 3).translate(x, 0.862 + sc * 0.5, z), crumb); }
    /* r42b: (the chalk stub kept hanging past the bench edge in the turned insert: removed) */   /* r22: behind the right model wall, clear of the caption */
    cb.add(new THREE.BoxGeometry(0.2, 0.025, 0.14).rotateY(-0.3).translate(0.16, 0.873, 0.27), lam("byRag", () => ({ color: "#c8b48c" })));
    /* r43: the worked bench front in both night inserts (they read as bare tabletops): an empty mould and a clay lump by the
     *  model walls, a lump and a strike stick by the scale's crate */
    { const mw2 = lam("byMouldN", () => ({ map: beamHD(), color: "#8a6040" })), clayN = lam("byClayN", () => ({ color: "#9a5838" }));
      /* r43b: (an empty mould at the insert's lower-left came out cut by the edge and too big) */
      /* r46: centred on the bench front, below the caption: a slab of raw clay with a wire cut through it in front of the scale's
       *  crate, a chalk stub in front of the towers (the corners are off the inserts' edges) */
      /* r47: (the clay slab and wire handles sat mid-frame under the scale insert: removed) */ void clayN; void mw2;
      cb.add(new THREE.CylinderGeometry(0.009, 0.009, 0.06, 8).rotateZ(Math.PI / 2).rotateY(0.5).translate(0.68, 0.869, 0.3), lam("byChalk2", () => ({ color: "#ece8dc" }))); }   /* r44: a cut block of raw clay (the round lumps read as bread rolls; the stick sat cut by the insert's edge) */
    /* r36: (the tally stick at the bench corner came out cut by the turned insert's edge: removed) */
    cb.build(trick);
    const fillW = new THREE.PointLight("#ffc888", 0, 2.6, 1.6); fillW.position.set(YARD.WALLS[0], 1.4, 0.25); trick.add(fillW); trick.userData.fillW = fillW;
    /* r26b: a warm pool on the scale (it sat in murk) */ const scaleL = new THREE.PointLight("#ffc890", 0, 1.8, 1.4); scaleL.position.set(YARD.SCALE[0] + 0.1, 1.75, 0.5);   /* r46b: back out (right over the label it blew it out) */ trick.add(scaleL); trick.userData.scaleL = scaleL;
    /* r48: a low key on the pans themselves, under the label (the scale sat dim under a bright lantern) */ const pansK = new THREE.SpotLight("#ffd2a0", 0, 2.2, 0.32, 0.7, 1.4); pansK.position.set(YARD.SCALE[0] - 0.05, 1.12, 0.75); pansK.target.position.set(YARD.SCALE[0], 1.0, -0.1); trick.add(pansK, pansK.target); trick.userData.pansK = pansK; }
  const brassT = ctex("byBrassT3", 128, 256, (g, r) => { g.fillStyle = "#d2aa52"; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.6 ? `rgba(110,72,20,${0.08 + r() * 0.14})` : `rgba(255,236,170,${0.1 + r() * 0.2})`; g.fillRect(0, r() * 256, 128, 1 + r() * 3); }   // brushed lines
    for (let i = 0; i < 26; i++) { const x = r() * 128, y = r() * 256, rr = 4 + r() * 14, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(70,50,20,0.35)"); gr.addColorStop(1, "rgba(70,50,20,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); } });   // tarnish
  const brass = std("brass3", { color: "#ffffff", map: brassT, roughness: 0.28, metalness: 0.3 });   /* r53: brushed, tarnished brass (the flat yellow read as plastic) */   /* r50: less metal (with no environment to reflect it read flat plastic yellow) */
  const scale = new THREE.Group(); scale.position.set(YARD.SCALE[0], YARD.SCALE[1] + 0.14, YARD.SCALE[2]); scale.scale.setScalar(0.8); trick.add(scale);
  /* r26: the scale stands on an upturned crate so its pans sit above the caption band */
  /* r68: the bench in front of the scale is the demo's workspace: a lump of raw clay with a cut slice, a wooden brick mould,
   *  a cutting wire and crumbs (reviewers: an empty table band under the balance in f_1265) */
  { const S = YARD.SCALE, clay = std("byRawClay2", { color: "#7a4c32", roughness: 0.42, metalness: 0 }),   /* r76i (reviewer): a dark wet-clay lump with a sheen (the pale one under the lantern read as a white egg) */ wood = lam("byMouldW", () => ({ map: beamHD(), color: "#a07850" })), wire = lam("byWire", () => ({ color: "#3a3a3e" })), hnd = lam("byWireH", () => ({ color: "#7a5434" }));
    const g = new THREE.Group(); trick.add(g);
    const lump = new THREE.Mesh(smoothIco(0.06, 3).scale(1.35, 0.7, 1.1), clay); lump.position.set(S[0] - 0.24, S[1] + 0.04, 0.04); lump.visible = false;   /* r76i: back beside the pans (it was a blurred foreground blob) */ g.add(lump);
    const slice = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.035, 0.07, 2, 0.01), clay); slice.position.set(S[0] - 0.12, S[1] + 0.018, 0.12); slice.visible = false; slice.rotation.y = 0.5; g.add(slice);
    const mould = new THREE.Group(); mould.position.set(S[0] + 0.21, S[1], 0.2); mould.rotation.y = -0.35; g.add(mould);
    for (const [w, d, x, z] of [[0.3, 0.018, 0, -0.068], [0.3, 0.018, 0, 0.068], [0.018, 0.12, -0.141, 0], [0.018, 0.12, 0.141, 0]] as const) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.075, d), wood); m.position.set(x, 0.0375, z); mould.add(m); }
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.03), wood); m.position.set(sx * 0.18, 0.06, 0); mould.add(m); }
    const wr = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.26, 4).rotateZ(Math.PI / 2), wire); wr.position.set(S[0] + 0.02, S[1] + 0.006, 0.2); wr.visible = false;   /* r76i (both reviewers): a clean bench under the scale - no clay crumbs or wire in the insert foreground */ wr.rotation.y = 0.2; g.add(wr);
    for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 8).rotateX(Math.PI / 2), hnd); h.position.set(S[0] + 0.02 + sx * 0.128 * Math.cos(0.2), S[1] + 0.009, 0.33 - sx * 0.128 * Math.sin(0.2)); void g; }
    const rr = rng(881); for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(smoothIco(0.006 + rr() * 0.008, 1), clay); c.position.set(S[0] - 0.35 + rr() * 0.6, S[1] + 0.004, 0.2 + rr() * 0.22); void c; }
    g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); }
  { const cm = lam("byScaleCrate", () => ({ map: planksHD(), color: "#9a7652" })); const cr = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.14, 0.26, 2, 0.008).translate(0, 0.07, 0), cm); cr.position.set(YARD.SCALE[0], YARD.SCALE[1], YARD.SCALE[2]); trick.add(cr);
    const sl = lam("byScaleSlat", () => ({ color: "#6a4c32" })); for (const dz of [-0.132, 0.132]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.025, 0.012).translate(0, 0.11, dz), sl); bar.position.copy(cr.position); trick.add(bar); } }
  const beamG = new THREE.Group(); beamG.position.set(0, 0.42, 0); scale.add(beamG);
  { scale.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 16).translate(0, 0.02, 0), brass)); scale.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.42, 8).translate(0, 0.23, 0), brass));
    beamG.add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.024, 0.032), brass)); /* r20: a smaller balance (the whole scale fits the shed frame) */ const pans: THREE.Group[] = [];
    /* r26b: the pans carry ONE stamped loaf (left) and TWO normal bricks (right): the same clay, the same weight (the clay lumps read as bread rolls) */
    const panLoaf = texBd("scaleLoafA", () => brickFaceTex("firedA2", true, "A"));
    for (const s of [-1, 1]) { const pan = new THREE.Group(); pan.position.set(s * 0.22, 0, 0); beamG.add(pan);
      /* r26j: wider pans hung on two cords from the rim (a single centre cord ran into the load) */
      /* r49: a spreader bar above the load with two straight drops to the rim (slanted cords ran through the loaf and the bricks) */
      pan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.06, 5).translate(0, -0.03, 0), brass)); pan.add(new THREE.Mesh(new THREE.BoxGeometry(0.255, 0.009, 0.009).translate(0, -0.06, 0), brass));
      for (const qx of [-1, 1]) pan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.145, 4).translate(qx * 0.122, -0.1325, 0), brass));
      pan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.105, 0.025, 22).translate(0, -0.21, 0), brass));
      const load = new THREE.Group(); load.position.y = -0.1975; pan.add(load);
      if (s < 0) { const m = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.1, 0.09, 2, 0.006).translate(0, 0.05, 0), panLoaf); m.castShadow = true; load.add(m); }
      else for (let q = 0; q < 2; q++) { const m = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.048, 0.09, 2, 0.005).translate(0, 0.024 + q * 0.05, 0), firedVd[q + 1]); m.rotation.y = q * 0.05; m.castShadow = true; load.add(m); }
      pans.push(pan); }
    /* r35: (the spare loaf and bricks at the crate's foot competed with the pans: removed) */
    beamG.userData.pans = pans; }
  const lumps = (beamG.userData.pans as THREE.Group[]).map((p) => p.children[2] as THREE.Mesh);
  const scLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.12), new THREE.MeshBasicMaterial({ map: labelTex("SAME CLAY"), toneMapped: true })); scLabel.position.set(0, 0.57, 0.03); scLabel.scale.setScalar(0.72);   /* r26c: back on its pillar, smaller (Amos stands clear of it now) */   /* r26b: the label on the crate front (on its pillar it covered Amos's face) */ scLabel.rotation.x = 0; scale.add(scLabel); { const st = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), timber); st.position.set(0, 0.57, 0.015); st.scale.set(0.74, 0.74, 1); st.rotation.x = 0; scale.add(st); scale.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6).translate(0, 0.47, 0.0), brass)); }   /* r21: the sign stands on the pillar */
  const walls = new THREE.Group(); walls.position.set(...YARD.WALLS); trick.add(walls);
  { // r25: two towers of the same height (they fit the 9:16 insert): left = 8 normal bricks (0.17 x 0.055), right = 4 loaves (0.17 x 0.11)
    const firedAT = [0, 1, 2, 3].map((k) => texBd("firedA" + k, () => brickFaceTex("firedA" + k, true, "A")));   /* r26: the tower loaves carry the A */
    const add = (x: number, y: number, h: number, w: number, k: number) => { const me = new THREE.Mesh(new RoundedBoxGeometry(w - 0.01, h - 0.0015, 0.11, 2, 0.004).translate(0, (h - 0.0015) / 2, 0), (h > 0.08 ? firedAT : firedVd)[k % 4]); { const mc = (me.material as THREE.MeshLambertMaterial).clone(), v = 0.84 + (((k * 37 + Math.round(y * 1000)) % 13) / 13) * 0.24; mc.color.multiply(new THREE.Color(v * 1.02, v * (0.95 + ((k * 7) % 5) * 0.02), v * 0.93)); me.material = mc; }   /* r76i (both reviewers): every brick its own firing shade (identical blocks read as plastic) */ me.position.set(x + (k % 3 - 1) * 0.004, y, (k % 2) * 0.004); me.rotation.y = ((k * 7) % 5 - 2) * 0.012; me.castShadow = true; me.receiveShadow = true; walls.add(me); };
    /* r54: each model wall is a real bonded wall, a brick and a half wide (single columns read as two pillars, not two walls) */
    const firedBT = [0, 1, 2, 3].map((k) => texBd("firedB" + k, () => brickFaceTex("firedB" + k, true, "")));
    const addH = (x: number, y: number, h: number, w: number, k: number) => { const me = new THREE.Mesh(new RoundedBoxGeometry(w - 0.01, h - 0.0015, 0.11, 2, 0.004).translate(0, (h - 0.0015) / 2, 0), (h > 0.08 ? firedBT : firedVd)[k % 4]); me.position.set(x, y, (k % 2) * 0.004); me.rotation.y = ((k * 5) % 5 - 2) * 0.01; me.castShadow = true; me.receiveShadow = true; walls.add(me); };
    const course = (x0: number, row: number, h: number, k: number) => { if (row % 2 === 0) { add(x0 - 0.0425, row * h, h, 0.17, k); addH(x0 + 0.085, row * h, h, 0.085, k + 1); } else { addH(x0 - 0.085, row * h, h, 0.085, k + 1); add(x0 + 0.0425, row * h, h, 0.17, k); } };
    const TX = 0.165;
    /* r60: whole bricks only, each course set a hand's width off the last (8 bricks vs 4 loaves, countable; the half bats read as 16 pieces vs 8) */ void course;
    for (let row = 0; row < 8; row++) add(-TX, row * 0.055, 0.055, 0.17, row);   /* r61: true, plumb stacks (the hand-set stagger read as a wobbly pile) */
    /* r47: a dark core inside both towers (the bright back wall showed through every seam: the bricks read as floating) */ for (const x of [-0.165, 0.165]) { const core = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.43, 0.085).translate(x, 0.215, 0.002), lam("byTowerCore", () => ({ color: "#2a1610" }))); walls.add(core); }
    /* r40: soft contact shadows under both towers (they floated) */ { const cs = new THREE.MeshBasicMaterial({ map: ctex("byContactSh", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(20,10,6,0.75)"); gr.addColorStop(0.55, "rgba(20,10,6,0.35)"); gr.addColorStop(1, "rgba(20,10,6,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false }); for (const x of [-0.165, 0.165]) { const q = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.26).rotateX(-Math.PI / 2), cs); q.position.set(x, 0.002, 0.0); q.renderOrder = 2; walls.add(q); } }
    for (let row = 0; row < 4; row++) add(TX, row * 0.11, 0.11, 0.17, row + 2);
    const mortar = lam("byModelMortar4", () => ({ color: "#5e4c3c" }));   /* r26: darker (it read as white paper between the courses) */ for (const x0 of [-0.165, 0.165]) walls.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.43, 0.08).translate(x0, 0.215, -0.01), mortar)); }
  const coinM = new THREE.MeshStandardMaterial({ map: coinTex(), roughness: 0.3, metalness: 0.8 });
  const coinsL: THREE.Mesh[] = [], coinsR: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 20), coinM); c.position.set(YARD.WALLS[0] - 0.15, 0.86 + 0.004 + i * 0.0075, 0.1); c.rotation.y = i * 0.7; c.castShadow = true; trick.add(c); coinsL.push(c); c.position.z = 0.27; }
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 20), coinM); c.position.set(YARD.WALLS[0] + 0.15, 0.86 + 0.004 + i * 0.0075, 0.1); c.rotation.y = i * 0.9; c.castShadow = true; trick.add(c); coinsR.push(c); c.position.z = 0.27; }
  // the demo loaf Amos lifts at the end of the explanation (it shape-matches into the inn tankard)
  const demoLoaf = brickMesh(BR.h * 2, firedM, loafTopF); demoLoaf.position.set(-0.85, 0.86, 0.22); demoLoaf.rotation.y = 0.3; trick.add(demoLoaf);
  // ---- drying hacks: rows of green bricks stacked herringbone on boards, each under a little board roof ----
  const hackRows: THREE.Group[] = [];
  for (let row = 0; row < 5; row++) {
    const x = YARD.HACK_X + row * 1.25, hg = new THREE.Group(); hg.position.set(x, 0, 0); root.add(hg); hackRows.push(hg); const hb = new Batch();
    hb.add(bx(0.5, 0.12, 7).translate(0, 0.06, -0.5), plank);
    for (let z = -3.8; z < 2.8; z += 0.2) for (let tier = 0; tier < 6; tier++) { const g = bx(BR.d * 0.9, BR.h * 0.9, BR.l * 0.9); g.rotateY((tier % 2 ? 0.5 : -0.5)); g.translate(0, 0.17 + tier * 0.1, z + (tier % 2) * 0.05); hb.add(g, greenM); }
    hb.add(bx(0.9, 0.04, 7.2).rotateZ(0.12).translate(0, 1.0, -0.5), plank);
    for (const z of [-3.9, -0.5, 2.9]) hb.add(bx(0.06, 0.95, 0.06).translate(-0.38, 0.48, z), timber);
    hb.build(hg);
  }
  /* r53: three more hacks ACROSS the open yard behind the shed (the hook looked past Amos onto bare clay and read as a street) */
  for (const [zz, xs] of [[-5.4, 0.2], [-6.9, -0.4], [-8.4, 0.5]] as [number, number][]) {
    const hg = new THREE.Group(); hg.position.set(xs, 0, zz); hg.rotation.y = Math.PI / 2; root.add(hg); const hb = new Batch();
    hb.add(bx(0.5, 0.12, 7).translate(0, 0.06, -0.5), plank);
    for (let z = -3.8; z < 2.8; z += 0.2) for (let tier = 0; tier < 10; tier++) { const g = bx(BR.d * 0.9, BR.h * 0.9, BR.l * 0.9); g.rotateY((tier % 2 ? 0.5 : -0.5)); g.translate(0, 0.17 + tier * 0.1, z + (tier % 2) * 0.05); hb.add(g, greenM); }
    hb.add(bx(0.9, 0.04, 7.2).rotateZ(0.12).translate(0, 1.42, -0.5), plank);   // taller: they show over the back wall
    for (const z of [-3.9, -0.5, 2.9]) hb.add(bx(0.06, 1.38, 0.06).translate(-0.38, 0.69, z), timber);
    hb.build(hg);
  }
  // the duty board on its post (+ the little 1606 Union flag on a staff) by the first row
  const boardG = new THREE.Group(); boardG.position.set(...YARD.BOARD); boardG.position.y = -0.32; boardG.rotation.y = -0.5; root.add(boardG);   // r5: board face at 1.63 m, beside the taxman's head
  boardG.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12).translate(0, 1.1, -0.04), timber));
  { const fr = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.74, 0.05), timber); fr.position.set(0, 1.95, 0.03); fr.castShadow = true; boardG.add(fr);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.687), new THREE.MeshBasicMaterial({ map: boardTex(), toneMapped: true })); face.position.set(0, 1.95, 0.058); boardG.add(face);
    boardG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6).translate(0.48, 2.6, 0.05), timber));
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21, 8, 2), new THREE.MeshLambertMaterial({ map: unionTex(), side: THREE.DoubleSide })); flag.position.set(0.7, 2.9, 0.05); boardG.add(flag); boardG.userData.flag = flag; }
  // stacks of fired bricks on pallets (for sale) + Silas's side
  const stackFired = (x: number, z: number, w: number, d: number, h: number, yaw = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; root.add(g); const sb = new Batch(); sb.add(bx(w + 0.1, 0.1, d + 0.1).translate(0, 0.05, 0), plank); for (let y = 0; y < h; y++) for (let i = 0; i < Math.floor(w / 0.38); i++) for (let k = 0; k < Math.floor(d / 0.18); k++) sb.add(bx(0.36, 0.1, 0.17).translate(-w / 2 + 0.19 + i * 0.38, 0.15 + y * 0.105, -d / 2 + 0.09 + k * 0.18), firedV[(y * 3 + i * 5 + k * 7) % 4]); sb.build(g); return g; };
  stackFired(-3.4, 5.2, 1.2, 0.72, 7, 0.2);   /* r41: out of the queue shot's foreground */ stackFired(-4.6, -2.8, 1.6, 0.9, 9, -0.1); stackFired(-5.2, 1.4, 1.2, 0.72, 6, 0.4);
  // the unsold loaf stack (grows with c.stack)
  const loafStack = new THREE.Group(); loafStack.position.set(...YARD.STACK); root.add(loafStack); const stackItems: THREE.Mesh[] = [];
  const stackAM = [0, 1, 2, 3].map((k) => texB("stackA" + k, () => brickFaceTex("firedA" + k, true, "A")));   /* r26f: the unsold stack shows its A stamps (it read as ordinary bricks) */
  { const r = rng(41); for (let y = 0; y < 4; y++) for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) { const m = brickMesh(BR.h * 2, stackAM[(y + i * 2 + k * 3) % 4], loafTopF); { const mc = ((Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshLambertMaterial).clone(), v = 0.82 + r() * 0.26; mc.color.multiply(new THREE.Color(v * 1.02, v * (0.94 + r() * 0.08), v * (0.9 + r() * 0.08))); (m as THREE.Mesh).material = (Array.isArray(m.material) ? (m.material as THREE.Material[]).map((q, qi) => qi === 2 ? q : mc) : mc) as unknown as THREE.Material; }   /* r76i (both reviewers): each loaf its own firing shade */ m.position.set(-0.32 + i * 0.32 + (r() - 0.5) * 0.03, y * 0.205, -0.18 + k * 0.185 + (r() - 0.5) * 0.025); m.rotation.y = (r() - 0.5) * 0.08; loafStack.add(m); stackItems.push(m); }
    /* r50: a low front step of three courses that Amos sits on (perched at 0.64 in front of the tall stack he floated) */ for (let y = 0; y < 0; y++) for (let k = 0; k < 3; k++) { const m = brickMesh(BR.h * 2, stackAM[(y + k + 1) % 4], loafTopF); m.position.set(-0.04 + k * 0.32 + (r() - 0.5) * 0.02, y * 0.205, 0.325 + (r() - 0.5) * 0.01);   /* r76i (reviewer): the step runs the stack's full width, a ledge he plainly sits on (one loaf wide it hid behind him and he read as pasted on the stack face) */ m.rotation.y = (r() - 0.5) * 0.06; loafStack.add(m); stackItems.push(m); } }
  /* r35: a hand-painted FOR SALE board propped on the full stack in the drizzle (nothing showed that nobody buys) */
  const saleSign = new THREE.Group(); saleSign.position.set(YARD.STACK[0] + 0.64, 0.16, YARD.STACK[2] + 0.62);   /* r76i: left of Amos, who now stands in front of the stack */   /* r50: propped in front of his dangling legs (behind them it was cut to FOR S) */   /* r47: left (the E was cut by the drizzle shot's right edge) */   /* r42: lower, its stakes in the ground at the stack's foot */   /* r38: on stakes at the stack's foot (Amos now sits on top of the stack) */   /* r35: clear of the taxman's quill */ saleSign.rotation.set(-0.12, 0.49, 0); root.add(saleSign);
  { const bd = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.025).translate(0, 0.15, 0), timber); bd.castShadow = true; saleSign.add(bd);
    const fc = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.18), new THREE.MeshLambertMaterial({ map: labelTex("FOR SALE", "#3a2a1e", "#f2ead8", 768, 240) })); fc.position.set(0, 0.15, 0.0135); saleSign.add(fc);   /* r35: a wider canvas (the 512 px one clipped the F and the E) */
    for (const x of [-0.17, 0.17]) saleSign.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03).translate(x, -0.2, -0.03), timber)); }
  /* r42: the queue shot's near corners (control qfg): a heap of fired loaves bottom-left, a sack and a spade bottom-right, so
   *  the bottom fifth is yard clutter, not bare paving */
  const qfg = new THREE.Group(); qfg.visible = false; root.add(qfg);
  { const qa = [0, 1, 2, 3].map((k) => texB("firedA" + k, () => brickFaceTex("firedA" + k, true, "A"))), qr = rng(77);
    const heap: [number, number, number, number][] = [[-1.17, 0, 5.12, 0.3], [-0.95, 0, 5.22, -0.2], [-1.06, 0.205, 5.15, 0.1], [-1.35, 0, 4.92, 0.6]];   /* r46: further into the corner */   /* r44b: further left, into the outer fifth */
    heap.forEach(([x, y, z, ry], i) => { const m = brickMesh(BR.h * 2, qa[i % 4], loafTopF); m.position.set(x + (qr() - 0.5) * 0.02, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; qfg.add(m); });
    for (const [x, z, ry, k] of [[1.02, 4.86, -0.3, 1], [1.12, 4.66, 0.5, 2]] as const) { const m = brickMesh(BR.h * 2, qa[k], loafTopF); m.position.set(x, 0, z); m.rotation.y = ry; m.castShadow = true; qfg.add(m); }   /* r42b: two loose loaves (the near sack came out as a cut blob at the edge) */
    const sp = new THREE.Group(); sp.position.set(0.86, 0, 4.7); sp.rotation.set(0.12, 0.3, -0.22); qfg.add(sp);
    sp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.95, 6).translate(0, 0.62, 0), lam("byHandle", () => ({ map: beamHD(), color: "#a88a68" }))));
    sp.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.015).translate(0, 0.1, 0), std("iron", { color: "#5a5e66", roughness: 0.5, metalness: 0.7 }))); }
  // r5: Amos's seat on the grey day: two loaves high beside the stack (he sits on his own unsold loaves)
  const seat = new THREE.Group(); seat.position.set(YARD.SEAT[0] - 0.12, YARD.SEAT[1], YARD.SEAT[2] - 0.28); seat.rotation.y = 0.41;   /* r36: square to the two-shot lens and right behind him (its corner stood in front of his legs: he read as standing) */   /* r26j: the seat sits just behind his card (the loaves hid him to the shoulders) */ root.add(seat);
  for (let y = 0; y < 2; y++) for (let i = 0; i < 3; i++) { const m = brickMesh(BR.h * 2, firedM, loafTopF); m.position.set(-0.316 + i * 0.316 + (y ? 0.02 : 0), y * 0.205, 0); m.rotation.y = (y ? 0.05 : -0.03); seat.add(m); }   /* r37: three wide (0.94 m): the seat shows either side of him */   /* r36: two loaves side by side lengthwise (0.62 m): the seat shows either side of him */
  // Amos's handcart with loaves (two big spoked wheels, a box bed, handles toward +x)
  const cart = handcart(root, texB("cartA", () => brickFaceTex("firedA1", true, "A")), timber, plank); cart.position.set(...YARD.CART);   /* r26: stamped loaves */ cart.rotation.y = -0.69;
  // ---- Silas's yard over the low wall: his bench, shovels, a barrow, more hacks ----
  const lowWallM = lam("byLowWall", () => ({ map: rep(brickWallTex("low", 92, 30), 3, 0.5) }));
  b.add(new THREE.BoxGeometry(0.3, 1.0, 8.9).translate(YARD.WALL_X, 0.5, 1.55), lowWallM);
  b.add(new THREE.BoxGeometry(0.4, 0.06, 8.9).translate(YARD.WALL_X, 1.03, 1.55), tex("coping", () => stoneHD("byCoping"), "#c8bca8"));
  b.add(new THREE.BoxGeometry(1.6, 0.09, 0.7).translate(-4.6, 0.82, 0.6), plank); for (const x of [-5.3, -3.9]) for (const z of [0.35, 0.85]) b.add(new THREE.BoxGeometry(0.08, 0.78, 0.08).translate(x, 0.39, z), timber);
  for (let row = 0; row < 3; row++) { const hg = new THREE.Group(); hg.position.set(-6.5 - row * 1.25, 0, -1); root.add(hg); const hb = new Batch(); hb.add(bx(0.5, 0.12, 6).translate(0, 0.06, 0), plank); for (let z = -2.8; z < 2.8; z += 0.2) for (let tier = 0; tier < 5; tier++) { const g = bx(BR.d * 0.9, BR.h * 0.9, BR.l * 0.9); g.rotateY(tier % 2 ? 0.5 : -0.5); g.translate(0, 0.17 + tier * 0.1, z); hb.add(g, greenM); } hb.add(bx(0.9, 0.04, 6.2).rotateZ(-0.12).translate(0, 1.0, 0), plank); hb.build(hg); }
  // ---- the clamp kiln (stepped brick mound, glowing fire arches, smoke) ----
  const kiln = new THREE.Group(); kiln.position.set(...YARD.KILN); root.add(kiln);
  { const kb = new Batch(), kilnM = lam("byKilnFired2", () => ({ map: rep(brickWallTex("normal", 92, 30), 2, 0.2), color: "#a88070" }));   /* r47: real-size bricks, sooty (stretched 1:1 it read as an untextured salmon pyramid) */ void wallFired; for (let i = 0; i < 4; i++) { const w = 5.0 - i * 0.9, d = 3.8 - i * 0.6; kb.add(bx(w, 0.5, d).translate(0, 0.25 + i * 0.5, 0), kilnM); } kb.build(kiln);
    // r5: the fire mouths are dark arched holes with a small ember glow at the bottom (they read as stickers when flat cream)
    const holeM = lam("byKilnHole", () => ({ color: "#2a1812" })), fireM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.2, 0.05), toneMapped: true });
    /* r48: two wide, uneven fire mouths with a low ember (four round glowing holes in a row read as a car's wheels and headlights) */
    for (const [x, rr] of [[-1.25, 0.26], [0.95, 0.21]] as const) { const a = new THREE.Mesh(new THREE.CircleGeometry(rr, 14, 0, Math.PI), holeM); a.position.set(x, 0.14, 2.11); kiln.add(a); const s = new THREE.Mesh(new THREE.PlaneGeometry(rr * 2, 0.14), holeM); s.position.set(x, 0.07, 2.11); kiln.add(s);
      const e = new THREE.Mesh(new THREE.PlaneGeometry(rr * 1.4, 0.05), fireM); e.position.set(x, 0.03, 2.115); kiln.add(e); }
    const kl = new THREE.PointLight("#ff8a3a", 3, 10, 1.4); kl.position.set(0, 0.8, 3.2); kiln.add(kl); kiln.userData.light = kl;
    glow(kiln, [0, 0.2, 2.3], "#ff8a3a", 0.8, 0.3); }
  const smokes: THREE.Sprite[] = []; for (let i = 0; i < 6; i++) { const s = mist(root, [YARD.KILN[0], 3.2 + i * 1.1, YARD.KILN[2]], 2.0 + i * 0.6, "#8a847e", 0.5 - i * 0.06); smokes.push(s); }
  // ---- gate, fence, the lane edge, trees, the village beyond ----
  for (const x of [4.6, 6.6]) b.add(new THREE.BoxGeometry(0.22, 1.9, 0.22).translate(x, 0.95, 6.6), timber);
  b.add(new THREE.BoxGeometry(2.4, 0.14, 0.14).translate(5.6, 1.85, 6.6), timber);
  const gateSign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.32), new THREE.MeshBasicMaterial({ map: labelTex("AMOS · BRICKS", "#e2c890", "#5a2014", 768, 160), toneMapped: true })); gateSign.position.set(5.6, 2.1, 6.69); root.add(gateSign);
  for (let x = -20; x < 22; x += 2.4) if (x < 4.4 || x > 6.8) { b.add(new THREE.BoxGeometry(0.12, 1.1, 0.12).translate(x, 0.55, 6.6), timber); for (const h of [0.35, 0.8]) b.add(new THREE.BoxGeometry(2.4, 0.1, 0.06).translate(x + 1.2, h, 6.62), timber); }
  const barkM = lam("byBarkM", () => ({ map: barkTex() }));
  const leafM = swayMaterial(mat("byLeafMS3", () => new THREE.MeshLambertMaterial({ color: "#64a24a", vertexColors: true })   /* r76i (all reviewers): smooth painted clumps with the canopy shade only (the leaf texture read as noise-dotted blobs) */));   /* r53: solid clumps */
  const coreM = swayMaterial(lam("byCore2", () => ({ color: "#3e7034", emissive: "#14300e" })));
  for (const [x, z, h, s] of [[-9, -6, 7, 1], [9.5, -7, 8, 2], [12, 2, 6.5, 3], [-12, 3, 7.5, 4], [-6, -16, 8, 5], [4, -17, 9, 6], [16, -12, 8, 7], [-16, -10, 7, 8]] as [number, number, number, number][]) leafyTree(b, root, [x, 0, z], h, s, leafM, coreM, barkM, 16, leafCardMat("byLeafCardM"));
  // the blossom tree by the gate (spring)
  const blossomG = new THREE.Group(); root.add(blossomG);
  /* r72: spring only - two spare loaves stacked and a loose brick with straw in the near paving of the builders' shot (reviewers: an empty bottom quarter) */
  { const la = lam("byFgLoafA", () => ({ map: brickFaceTex("firedA2", true, "A") })), lb = lam("byFgBrick", () => ({ map: brickFaceTex("firedB1", true) })); void lb;
    for (const [x, y, z, ry, h, m] of [[-0.1, 0.105, 4.0, 0.25, 0.21, la], [-0.08, 0.316, 4.02, 0.33, 0.21, la]]   /* r76h: the pair between the builders' feet, nearer the lens; no loose brick (their legs ran into the loaves) */ as [number, number, number, number, number, THREE.Material][]) {
      const g = new THREE.Mesh(new RoundedBoxGeometry(0.3, h - 0.004, 0.15, 1, 0.008), m); g.position.set(x, y, z); g.rotation.y = ry; g.castShadow = true; g.receiveShadow = true; blossomG.add(g); } }
  { const bb = new Batch(); const blM = swayMaterial(mat("byBlossomM", () => new THREE.MeshLambertMaterial({ map: blossomTex(), alphaTest: 0.5, side: THREE.DoubleSide }))); leafyTree(bb, blossomG, [-3.9, 0, 3.4], 5.2, 11, blM, lam("byBlCore", () => ({ color: "#d8a8b8" })), barkM, 14); bb.build(blossomG); }
  /* r76i (reviewers: "a sparse yard of plain tables - dress it: kiln, drying racks, barrows"): a brick clamp-kiln with a smoking
   *  chimney beyond the benches, two barrows and covered drying racks, so the yard reads as a working brickworks at three depths */
  { const kb = new Batch(), kM = lam("byKilnM", () => ({ map: rep(brickWallTex("kiln", 92, 30), 3, 1.2), color: "#c8b0a0" })), soot = lam("byKilnSoot", () => ({ color: "#2a2220" })), straw = lam("byRackStraw", () => ({ color: "#c8a85a" }));
    const K = [-6.4, 0, -7.2];
    kb.add(new THREE.CylinderGeometry(1.5, 1.65, 2.2, 24).translate(K[0], 1.1, K[2]), kM);
    kb.add(new THREE.SphereGeometry(1.5, 24, 12, 0, TAU, 0, Math.PI / 2).scale(1, 0.7, 1).translate(K[0], 2.2, K[2]), kM);
    kb.add(new THREE.BoxGeometry(0.55, 2.4, 0.55).translate(K[0] + 0.5, 3.6, K[2] - 0.3), kM);
    kb.add(new THREE.BoxGeometry(0.62, 0.12, 0.62).translate(K[0] + 0.5, 4.8, K[2] - 0.3), soot);
    kb.add(new THREE.BoxGeometry(0.8, 1.0, 0.3).translate(K[0], 0.5, K[2] + 1.5), soot);   // the stoke hole, sooty
    for (const [x, z, ry] of [[-3.6, -5.2, 0.3], [-8.8, -4.6, -0.2], [-4.2, -9.6, 0.1]] as const) {   // drying racks: a slatted roof on posts over stacked green loaves
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); const rb = new Batch();
      for (const sx of [-1.1, 1.1]) for (const sz of [-0.35, 0.35]) rb.add(new THREE.BoxGeometry(0.08, 1.2, 0.08).translate(sx, 0.6, sz), lam("byRackPost", () => ({ map: beamHD(), color: "#8a6a4a" })));
      rb.add(new THREE.BoxGeometry(2.5, 0.06, 1.1).rotateX(0.12).translate(0, 1.25, 0), straw);
      for (let i = 0; i < 9; i++) for (let k = 0; k < 2; k++) rb.add(new THREE.BoxGeometry(0.24, 0.2, 0.12).translate(-1.0 + i * 0.25, 0.1 + k * 0.205, (k % 2) * 0.05), lam("byGreenLoafM", () => ({ color: "#9a7a62" })));
      rb.build(g); }
    for (const [x, z, ry] of [[-2.6, -4.0, 0.6], [-7.6, -2.8, -0.9]] as const) {   // wheelbarrows
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); const wb = new Batch(), wd = lam("byBarrowW", () => ({ map: planksHD(), color: "#8a6a4a" }));
      wb.add(new THREE.BoxGeometry(0.7, 0.3, 0.55).translate(0, 0.55, 0), wd); for (const sz of [-0.2, 0.2]) wb.add(new THREE.BoxGeometry(1.1, 0.04, 0.04).translate(0.25, 0.42, sz), wd);
      wb.add(new THREE.TorusGeometry(0.2, 0.03, 6, 16).translate(-0.45, 0.22, 0), wd); for (const sz of [-0.2, 0.2]) wb.add(new THREE.BoxGeometry(0.04, 0.4, 0.04).translate(0.25, 0.2, sz), wd);
      wb.build(g); }
    kb.build(root);
    const smoke = new THREE.Group(); root.add(smoke); for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35 + i * 0.18, 10, 8), new THREE.MeshLambertMaterial({ color: "#b8b0a8", transparent: true, opacity: 0.38 - i * 0.07, depthWrite: false })); m.position.set(K[0] + 0.5 + i * 0.25, 5.2 + i * 0.55, K[2] - 0.3 - i * 0.1); smoke.add(m); } }
  const sunG = new THREE.Group(); root.add(sunG); glow(sunG, [-6, 7.5, -60], "#ffd38a", 26, 1.2); glow(sunG, [-6, 7.5, -60], "#fff4d8", 7, 1.6);
  const shafts = [-1.4, -0.2, 1.0, 2.2].map((x) => shaft(root, [x, 3.0, -2.6], [x + 0.5, 0.0, 0.8], 0.55, "#ffd9a0", 0.12));
  // village rooftops + church beyond the hedge (z -24..-34), faded by fog
  const houseCols = ["#d8c4a0", "#c9b48e", "#e0d0b0"];
  // r16: real gabled houses (tile roofs, sills, plinths, chimneys) instead of boxes with pyramid caps
  for (let i = 0; i < 11; i++) { const x = -26 + i * 5.2, z = -26 - (i % 3) * 3.5, h = 4 + (i % 4) * 0.8; house(b, x, z, 0, 4.4, 5, h, i, 0); }
  b.add(new THREE.BoxGeometry(3, 9, 3).translate(8, 4.5, -36), lam("byChurch", () => ({ map: rep(stoneHD("byChurchS"), 2, 4) }))); b.add(new THREE.ConeGeometry(1.9, 7, 4).rotateY(Math.PI / 4).translate(8, 12.5, -36), lam("bySpire", () => ({ color: "#6a7a8a" })));
  // hedges along the back
  const hedgeM = swayMaterial(mat("byHedgeS", () => new THREE.MeshLambertMaterial({ map: leafSolid("hedge", "#4a7a36", "#78a84c", "#2e5a28") })));   /* r56: solid clumps */
  { const hf = leafCardMat("byHedgeCardM"), hr = rng(77); for (let x = -40; x < 40; x += 1.6) { b.add(smoothIco(1.0).scale(1.1, 0.8, 0.9).translate(x, 0.6, -14 + Math.sin(x) * 0.4), hedgeM); leafFringe(b, V(x, 0.62, -14 + Math.sin(x) * 0.4), 0.95, 12, hf, hr, 0.6, 1.0, 0.95); } }   /* r76i: leaf sprays break the hedge dome edges */
  b.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK)) { m.receiveShadow = true; if (!(m.material as THREE.Material).transparent) m.castShadow = true; } });
  // drizzle streaks (grey day): a few hundred thin lines in a box round the bench, falling
  /* r35: each streak is two crossed quads ~9 mm wide and 30 cm long (1 px lines vanished at phone size), denser near the two-shot */
  /* r42: varied streaks (length 0.1-0.3, width, brightness) that fade toward their top like a blurred drop, and none in front
   *  of the two-shot's faces (z > 4.4): uniform white lines over everything read as an overlay */
  const rainGeo = new THREE.BufferGeometry(); { const r = rng(5), N = 1500, P: number[] = [], CO: number[] = []; for (let i = 0; i < N; i++) { const near = i < 700, x = near ? -2.5 + r() * 6 : -4 + r() * 12, y = r() * 5, z = near ? 1.6 + r() * 2.8 : -5 + r() * 6.5, L = 0.1 + r() * 0.2, dx = -0.03 * L / 0.26, w = 0.0016 + r() * 0.0022, br = 0.35 + r() * 0.65;
      for (const [ax, az] of [[w, 0], [0, w]]) { const a = [x - ax, y, z - az], b2 = [x + ax, y, z + az], c2 = [x + ax + dx, y - L, z + az], d = [x - ax + dx, y - L, z - az]; P.push(...a, ...b2, ...c2, ...a, ...c2, ...d); for (const al of [0, 0, br, 0, br, br]) CO.push(1, 1, 1, al); } }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(P), 3)); rainGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(CO), 4)); }
  const rainM = new THREE.MeshBasicMaterial({ color: "#dfe7f0", vertexColors: true, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false }); const rain = new THREE.Mesh(rainGeo, rainM); rain.layers.set(NOINK); rain.frustumCulled = false; root.add(rain);

  const marks: Record<string, V3> = {
    amos: YARD.AMOS, amosCart: [3.05, 0, 1.15], amosStack: [0.6, 0, 3.3], amosShed: [0.2, 0, -0.62],
    tax: YARD.TAX, taxStack: [-1.35, 0, 3.2], taxGate: [4.4, 0, 4.6],
    silas: YARD.SILAS, silasPeek: [-3.0, 0, 0.5], hand1: [-4.6, 0, -0.1], hand2: [-6.0, 0, -2.2],
    b1: [3.0, 0, -0.9], b2: [4.1, 0, -1.4], ned: [3.4, 0, 4.4], bq1: [4.2, 0, 4.9], bq2: [5.2, 0, 4.2],
  };
  const cams: SetDef["cams"] = {
    hook: { pos: [0.75, 1.1, 1.75], look: [0.1, 1.05, 0.05], fov: 46 },
    board: { pos: [1.3, 1.6, 4.4], look: [2.9, 1.4, 1.2], fov: 50 },
    yard: { pos: [-1.2, 2.2, 6.5], look: [1.5, 1.0, 0], fov: 55 },
    shed: { pos: [0.3, 1.3, 1.5], look: [0.1, 1.0, -0.2], fov: 46 },
  };
  return {
    name: "yard", root, marks, cams, title: [loaf],
    pose: (t, c) => {
      // the deep mould: on the bench over the loaf (mouldOn, dropped by mouldY m for the slam), full of clay (clay > 0),
      // or gone (in Amos's hands as a 2D prop, or set aside)
      const aside = (c.mouldAside ?? 0) > 0, on = (c.mouldOn ?? 0) > 0 || (c.clay ?? 0) > 0 || aside; mould.visible = on; if (aside && !((c.clay ?? 0) > 0)) { mould.position.set(0.5, 0.86, -0.1); mould.rotation.set(0, -0.35, 0);   /* r76i (both reviewers): into the lower-right corner, mostly out of frame (mid-frame it hid Amos) */   /* r76i: the mould on the bench under his loaf (the lower band read as bare planks) */   /* r76i (reviewer): the brick mould on the bench in the hook's lower band ("making" showed no mould) */   /* r40: past the hook frame's right edge (it showed as a cut crate) */ } else { mould.position.set(YARD.DEEP[0], YARD.DEEP[1] + (c.mouldY ?? 0), YARD.DEEP[2]); mould.rotation.set(0, 0, 0); }   // r22: c.mouldAside: the empty deep mould set down at the bench's right end
      loaf.visible = (c.loaf ?? 1) > 0 && !((c.clay ?? 0) > 0); mouldClay.scale.y = Math.max(0.001, (c.clay ?? 0) * BR.h * 2); mouldClay.visible = (c.clay ?? 0) > 0.01;
      normMould.visible = (c.normMould ?? 1) > 0; normalBrick.visible = (c.brick ?? 1) > 0; dayG.children.forEach((o) => { if (o.userData.mini) o.visible = (c.mini ?? 1) > 0; });   /* r76: the bench miniature can clear (it sat bottom-centre in the hook, hiding Amos) */
      dayG.visible = !((c.trick ?? 0) > 0); strike.visible = dayG.visible && (c.strikeOn ?? 1) > 0; strike.position.x = 0.2 + (c.strike ?? 0) * 0.0 - Math.sin((c.strike ?? 0) * Math.PI) * 0.3; strike.position.y = 0.89 + Math.sin((c.strike ?? 0) * Math.PI) * 0.17;
      const st = cl(c.stack ?? 0); stackItems.forEach((m, i) => { m.visible = i < Math.round(st * stackItems.length); }); seat.visible = false; saleSign.visible = st > 0.97 && (c.rain ?? 0) > 0;
      if ((c.night ?? 0) > 0) nightTint(root, c.night ?? 0); else nightTint(root, 0.6 * (c.rain ?? 0), [0.62, 0.72, 0.95]);
      const wet = c.rain ?? 0; puddleM.opacity = 0.82 * wet;   /* r76i (both reviewers): the rain shot showed no wet ground */   /* r73: wetter puddles in the drizzle (reviewers: dry ground under the rain) */ { const gm = groundMesh.material as unknown as THREE.MeshStandardMaterial; const nk = c.night ?? 0; if (gm.color) gm.color.setRGB((1 - 0.52 * wet) * (1 - 0.5 * nk), (1 - 0.5 * wet) * (1 - 0.42 * nk), (1 - 0.44 * wet) * (1 - 0.05 * nk)); { const pm = realMat(paveM) as THREE.MeshStandardMaterial; pm.color.setRGB((1 - 0.54 * wet) * (1 - 0.5 * nk), (1 - 0.54 * wet) * (1 - 0.42 * nk), (1 - 0.5 * wet) * (1 - 0.05 * nk));   /* r49: neutral wet (the blue-heavy darkening turned the red paving purple) */ if (pm.roughness !== undefined) pm.roughness = wet ? 0.28 : 0.86; }   /* r48: through the real material (the Lambert colour never reached the render: the drizzle paving read dry) */   /* r43: darker, cooler wet pavers */ if (gm.roughness !== undefined) gm.roughness = wet ? 0.3 : 0.9; } rainM.opacity = 0.34 * wet;   /* r36: drizzle, not a downpour */ if (wet) { const pa = rainGeo.attributes.position as THREE.BufferAttribute; void pa; rain.position.y = -((t * 7) % 5); }
      blossomG.visible = (c.spring ?? 0) > 0; sunG.visible = (c.sun ?? 0) > 0; shafts.forEach((m) => { m.visible = (c.sun ?? 0) > 0; });
      trick.visible = (c.trick ?? 0) > 0; slate.visible = slFrame.visible = (c.trick ?? 0) > 0; qfg.visible = (c.qfg ?? 0) > 0;
      lumps[0].visible = (c.lumpL ?? 1) > 0; lumps[1].visible = (c.lumpR ?? 1) > 0;
      const tip = c.scaleTip ?? 0; beamG.rotation.z = -tip * 0.25; (beamG.userData.pans as THREE.Group[]).forEach((p) => { p.rotation.z = tip * 0.25; });   // r12: the loaded (left) pan goes DOWN
      const nl = Math.round(c.chalkL ?? 0), nr = Math.round(c.chalkR ?? 0); const key = `${nl}_${nr}`; if (slate.userData.k !== key) { const sm2 = slate.material as unknown as THREE.MeshStandardMaterial; sm2.map = slateTex(nl, nr); sm2.needsUpdate = true; slate.userData.k = key; }
      const cL = c.coinL ?? 0, cR = c.coinR ?? 0; coinsL.forEach((m, i) => { const a = cl(cL - i); m.visible = a > 0; m.position.y = 0.865 + i * 0.011 + (1 - a) * 0.25; }); coinsR.forEach((m, i) => { const a = cl(cR - i); m.visible = a > 0; m.position.y = 0.865 + i * 0.011 + (1 - a) * 0.25; });
      const lf = c.lift ?? 0; demoLoaf.visible = (c.demoLoaf ?? 0) > 0; demoLoaf.position.set(-0.85 + lf * 0.6, 0.86 + lf * 0.5, 0.22 + lf * 0.3); demoLoaf.rotation.y = 0.3 - lf * 0.3;
      lant.position.set(-0.55, 2.05, -0.8); lant.visible = (c.trick ?? 0) > 0;   // r12: the night demo hangs it top-left of Amos
      const ln = c.lantern ?? 0; (lant.userData.light as THREE.PointLight).intensity = ln * ((c.trick ?? 0) > 0 ? 8.5 : 3.4);   /* r57: the lantern is the key (reviewers: it glowed but lit nothing) */   /* r36: the night demo lantern lights the scale */
      lant.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial; if (m && (m as THREE.Material).type === "MeshBasicMaterial" && !o.userData.on) { o.userData.on = m.color.clone(); } if (o.userData.on) m.color.copy(o.userData.on).multiplyScalar(ln > 0 ? ((c.trick ?? 0) > 0 ? 0.3 : 0.5) : 0.12); }); (lant.userData.glow as THREE.Sprite).visible = ln > 0; (lant.userData.glow as THREE.Sprite).material.opacity = (c.trick ?? 0) > 0 ? 0.28 : 0.55;   /* r76i (reviewer): in the scale shot the lantern no longer out-shines the scale */   /* r76i (both reviewers): the lantern glass no longer clips white or out-shines the scale */ lant.userData.base = ln * 3.4; if (ln) flicker(lant, t);
      (trick.userData.fillW as THREE.PointLight).intensity = (c.trick ?? 0) > 0 ? ln * 2.4 : 0;   /* r76i (reviewers: eight warm frames in a row): less warm wall fill, the moon side reads blue */   /* r53: a warm pool on the two walls (the towers sat in brown murk) */ (trick.userData.scaleL as THREE.PointLight).intensity = (c.trick ?? 0) > 0 ? ln * 5 : 0; (trick.userData.pansK as THREE.SpotLight).intensity = (c.trick ?? 0) > 0 ? ln * 6.5 : 0;   /* r76c: the lantern's pool on the pans */ benchSpot.intensity = (c.trick ?? 0) > 0 ? ln * 6 * (0.95 + 0.05 * Math.sin(t * 11)) : 0;   /* r57: the flat front keys halved */ (wallLamp.userData.light as THREE.PointLight).intensity = 0; wallLamp.visible = false;   /* r26i: off (a glow with no visible source at the towers' edge) */
      const ck = c.cart ?? 0; cart.position.set(YARD.CART[0] + ck * 4.4, 0, YARD.CART[2] + ck * 3.7); cart.rotation.y = -0.69; cart.visible = (c.cartOn ?? 1) > 0;
      (cart.userData.wheels as THREE.Group[]).forEach((w) => { w.rotation.z = -ck * 14; });
      const kl = kiln.userData.light as THREE.PointLight; kl.intensity = 2.6 + Math.sin(t * 9) * 0.4 + Math.sin(t * 3.3) * 0.3;   /* r48: dimmer */
      smokes.forEach((s, i) => { s.position.y = 3.2 + ((i * 1.1 + t * 0.5) % 6.6); s.position.x = YARD.KILN[0] + Math.sin(t * 0.4 + i) * 0.5 + (s.position.y - 3.2) * 0.25; (s.material as THREE.SpriteMaterial).opacity = 0.45 * (1 - (s.position.y - 3.2) / 6.6); });
      const fl = boardG.userData.flag as THREE.Mesh; const pa = fl.geometry.attributes.position as THREE.BufferAttribute; if (!fl.userData.x0) fl.userData.x0 = Float32Array.from(pa.array as Float32Array);
      const x0 = fl.userData.x0 as Float32Array; for (let i = 0; i < pa.count; i++) { const x = x0[i * 3]; pa.setZ(i, Math.sin(x * 9 - t * 4.4) * 0.03 * (x + 0.21) * 4); } pa.needsUpdate = true;
    },
  };
};
