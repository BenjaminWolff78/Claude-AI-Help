// Victor Lustig's attic workroom, Paris 1925, at night (light `study`). A mansard attic: gable back wall (z -2.8)
// with a big round oeil-de-boeuf window (centre 0, 1.6, r 0.7) over night-blue Paris roofs, the opposite house's lit
// dormer and the Eiffel Tower silhouette (blinking beacon, twinkling lights), moon + stars. Roof slopes come down to
// 1.2 m knee walls at x = +-3.6 (ceiling height h(x) = 3.6 - 0.667 |x|): rafters, ridge beam, purlins, collar ties.
// Right: the press bench running front-back (x 0.45..1.3, z -2.05..-0.7, top 0.82) with the cast-iron hand press
// (lever on its -x side, toward the window axis), ink slab + brayer, fresh prints, envelopes, wax + seal, candle.
// Left: the writing desk (x -1.55..-0.45, z -1.55..-0.85, top 0.78) with the green banker's lamp, typewriter, fat
// rubber stamp + ink pad, the deed, forged letterhead (invented crest "BUREAU DES GRANDS MONUMENTS"). Wardrobe of
// disguises (back left, doors open), coat stand with spare hats (front right), corkboard with a Paris map + tower
// clipping (above the press bench), cat bed under the window, low bookshelf, steamer trunk, rug, drying line of prints.
//
// Story controls (c): press 0..1 lever pulls down + platen lowers | sheet 0..1 the printed sheet slides out of the
// press toward the bench front (+z) | stamp 0..1 the stamp comes down onto the deed | stamped 0..1 shows the purple
// imprint (also on automatically while stamp > 0.97) | lamp 0..1 banker's-lamp level (default 1).
// Marks (feet, set-local): press = in front of the window, left of the press bench; he faces +x to the lever
// (profile, the round window behind him) | stamp = behind the writing desk, faces camera | window = at the window,
// right of the cat bed | guest = a visitor's spot in front of the bench corner | door = by the stair door (front left)
// | cat = the cat bed | neighbour = inside the lit dormer across the street (feet y -0.85: only head + shoulders
// show in its window) | pressTop / stampTop / tower = prop points for focus.
// Room bounds (camera must stay inside): x -3.5..3.5 under the slopes, z -2.7..3.5, y < h(x) - 0.1.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, planksHD } from "../paint";
import { NOINK } from "../ink";
import { glow, shaft, rod, mist } from "../setkit";
import { over, boardsV, boardsH, beamStain, candle, flameFlick, motes, metal, book, TAU } from "./innerkit_b";
import { fitText } from "./portkit_common";
import type { SetDef, V3 } from "./types";

/** keep-out boxes (min, max), set-local: furniture the camera must never enter */
export const STUDY_SOLIDS: [V3, V3][] = [
  [[0.4, 0, -2.1], [1.35, 1.7, -0.65]],     // press bench + press + lever
  [[-1.6, 0, -1.6], [-0.4, 1.3, -0.8]],     // writing desk + lamp + typewriter
  [[-2.6, 0, -2.8], [-1.5, 1.85, -1.75]],   // wardrobe (open doors swing to z -1.8)
  [[1.6, 0, 0.3], [2.1, 1.95, 0.75]],       // coat stand
  [[0.2, 2.2, -1.1], [1.6, 2.65, -0.9]],    // drying line of prints
  [[2.95, 0, -1.6], [3.6, 1.2, 1.6]],       // low bookshelf on the right knee wall
  [[-3.1, 0, 0.55], [-2.1, 0.72, 1.35]],    // steamer trunk
  [[-0.95, 2.82, -1.7], [0.95, 3.6, -1.5]], // collar tie back
  [[-0.95, 2.82, 1.1], [0.95, 3.6, 1.3]],   // collar tie front
  [[0.75, 1.1, -2.8], [1.95, 2.0, -2.7]],   // corkboard
];

const KH = 1.2, RH = 3.6, X1 = 3.6, ZB = -2.8, ZF = 3.6, WY = 1.6, WR = 0.7;
const hAt = (x: number) => RH - ((RH - KH) * Math.abs(x)) / X1;
const INK = "#2a1a22";

// ---------------- painted textures ----------------
const wallpaper = () => ctex("stWallpaper", 1024, 1024, (g, r) => {
  g.fillStyle = "#c9a46a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(140,90,50,0.16)" : "rgba(255,236,190,0.12)"; g.fillRect(i * 128, 0, 128, 1024); g.fillStyle = "rgba(120,70,40,0.35)"; g.fillRect(i * 128 + 62, 0, 4, 1024); }
  for (let y = 40; y < 1024; y += 96) for (let x = 32; x < 1024; x += 128) { const ox = (Math.floor(y / 96) % 2) * 64; g.fillStyle = "rgba(150,80,60,0.45)"; g.beginPath(); g.moveTo(x + ox, y - 14); g.lineTo(x + ox + 10, y); g.lineTo(x + ox, y + 14); g.lineTo(x + ox - 10, y); g.closePath(); g.fill(); g.fillStyle = "rgba(255,240,200,0.4)"; g.beginPath(); g.arc(x + ox, y, 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 26; i++) { const x = r() * 1024, y = r() * 1024, rr = 40 + r() * 140; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(110,70,40,0.16)"); gr.addColorStop(1, "rgba(110,70,40,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
});
const plaster = () => ctex("stPlaster", 1024, 1024, (g, r) => {
  g.fillStyle = "#d8c3a0"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 40; i++) { const x = r() * 1024, y = r() * 1024, rr = 60 + r() * 160; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? "rgba(255,245,220,0.25)" : "rgba(140,100,70,0.16)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.strokeStyle = "rgba(110,80,60,0.35)"; g.lineWidth = 2; for (let i = 0; i < 6; i++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 90; y += 20 + r() * 50; g.lineTo(x, y); } g.stroke(); }
});
const leatherTop = () => ctex("stLeather", 1024, 320, (g, r) => {
  g.fillStyle = "#2f5a3e"; g.fillRect(0, 0, 1024, 320);
  for (let i = 0; i < 30; i++) { const x = r() * 1024, y = r() * 320, rr = 30 + r() * 80; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(120,170,120,0.18)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.strokeStyle = "#d9b45a"; g.lineWidth = 6; g.strokeRect(22, 22, 980, 276); g.lineWidth = 2; g.strokeRect(34, 34, 956, 252);
  for (const [x, y] of [[22, 22], [1002, 22], [22, 298], [1002, 298]]) { g.fillStyle = "#d9b45a"; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
});
/** invented crest: laurel wreath around a shield with a little lattice tower and the monogram B G M */
const crest = (g: CanvasRenderingContext2D, cx: number, cy: number, s: number, ink: string, fill: string | null) => {
  g.save(); g.translate(cx, cy); g.scale(s, s); g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 4; g.lineCap = "round";
  for (const sd of [-1, 1]) { g.beginPath(); g.arc(0, 8, 62, Math.PI / 2 + sd * 0.25, Math.PI / 2 + sd * 2.6, sd < 0); g.stroke(); for (let k = 0; k < 7; k++) { const a = Math.PI / 2 + sd * (0.45 + k * 0.32); const x = Math.cos(a) * 62, y = 8 + Math.sin(a) * 62; g.beginPath(); g.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 11, 5, a + sd * 0.9, 0, TAU); g.fill(); } }
  g.beginPath(); g.moveTo(-36, -40); g.lineTo(36, -40); g.lineTo(36, 4); g.quadraticCurveTo(36, 38, 0, 52); g.quadraticCurveTo(-36, 38, -36, 4); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } g.stroke();
  g.fillStyle = ink; g.beginPath(); g.moveTo(0, -32); g.lineTo(13, 26); g.lineTo(6, 26); g.quadraticCurveTo(0, 12, -6, 26); g.lineTo(-13, 26); g.closePath(); g.fill();
  g.fillRect(-9, -6, 18, 3); g.fillRect(-6, 8, 12, 3);
  g.font = "900 15px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("B", -24, -24); g.fillText("M", 24, -24); g.fillText("G", 0, 40);
  g.beginPath(); g.moveTo(-14, -60); g.lineTo(-10, -48); g.lineTo(0, -56); g.lineTo(10, -48); g.lineTo(14, -60); g.lineTo(8, -44); g.lineTo(-8, -44); g.closePath(); g.fill(); // little crown
  g.restore();
};
const letterTex = () => ctex("stLetterhead", 512, 660, (g, r) => {
  g.fillStyle = "#f6eedb"; g.fillRect(0, 0, 512, 660);
  for (let i = 0; i < 10; i++) { const x = r() * 512, y = r() * 660, rr = 40 + r() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(200,170,120,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  crest(g, 256, 112, 1.05, "#26386a", "#e8c35a");
  g.fillStyle = "#26386a"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "BUREAU DES GRANDS MONUMENTS", 256, 208, 440, 30); g.font = "italic 700 22px Georgia, serif"; fitText(g, "Paris", 256, 240, 300, 22, "italic 700 %spx Georgia, serif");
  g.strokeStyle = "#b8302e"; g.lineWidth = 3; g.beginPath(); g.moveTo(60, 262); g.lineTo(452, 262); g.stroke();
  g.fillStyle = "rgba(50,40,40,0.55)"; for (let i = 0; i < 9; i++) g.fillRect(60, 300 + i * 26, 300 + r() * 92, 7);
  g.strokeStyle = "#26386a"; g.lineWidth = 3; g.beginPath(); g.moveTo(290, 580); g.bezierCurveTo(330, 540, 360, 610, 400, 560); g.bezierCurveTo(420, 540, 430, 590, 460, 570); g.stroke();
  g.strokeStyle = "rgba(90,60,40,0.4)"; g.lineWidth = 3; g.strokeRect(8, 8, 496, 644);
});
const deedTex = () => ctex("stDeed", 512, 660, (g, r) => {
  g.drawImage(letterTex().image as CanvasImageSource, 0, 0);
  g.fillStyle = "#b8302e"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "CONTRAT DE VENTE", 256, 290, 380, 34);
  g.fillStyle = "rgba(50,40,40,0.5)"; for (let i = 0; i < 6; i++) g.fillRect(60, 330 + i * 26, 280 + r() * 110, 7);
  void r;
});
const imprintTex = () => ctex("stImprint", 256, 256, (g) => {
  g.strokeStyle = "rgba(118,40,120,0.9)"; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(128, 128, 94, 0, TAU); g.stroke();
  crest(g, 128, 120, 0.95, "rgba(118,40,120,0.92)", null);
  g.fillStyle = "rgba(118,40,120,0.9)"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "APPROUVÉ", 128, 214, 150, 26);
});
const clippingTex = () => ctex("stClipping", 400, 520, (g, r) => {
  g.fillStyle = "#ece2c8"; g.fillRect(0, 0, 400, 520);
  g.fillStyle = "#2a2226"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LE CRIEUR DE PARIS", 200, 40, 360, 40);
  g.fillRect(20, 66, 360, 4); fitText(g, "LA TOUR EN PÉRIL ?", 200, 104, 360, 40);
  g.fillStyle = "#c9c0a8"; g.fillRect(30, 140, 200, 250);
  g.fillStyle = "#3a3236"; g.beginPath(); g.moveTo(130, 160); g.lineTo(150, 270); g.lineTo(186, 380); g.lineTo(160, 380); g.quadraticCurveTo(130, 330, 100, 380); g.lineTo(74, 380); g.lineTo(110, 270); g.closePath(); g.fill();
  g.fillRect(96, 268, 68, 8); g.fillRect(108, 214, 44, 6);
  g.fillStyle = "rgba(40,30,30,0.5)"; for (let i = 0; i < 16; i++) g.fillRect(246, 150 + i * 15, 120, 6); for (let i = 0; i < 7; i++) g.fillRect(30, 410 + i * 15, 336, 6);
  g.strokeStyle = "rgba(90,70,50,0.6)"; g.lineWidth = 3; g.strokeRect(4, 4, 392, 512); void r;
});
const mapTex = () => ctex("stParisMap", 600, 420, (g, r) => {
  g.fillStyle = "#e6d6ac"; g.fillRect(0, 0, 600, 420);
  g.strokeStyle = "rgba(120,90,60,0.55)"; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { g.beginPath(); const x = r() * 600, y = r() * 420, a = r() * TAU, l = 60 + r() * 160; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(110,150,80,0.35)"; g.beginPath(); g.ellipse(r() * 600, r() * 420, 20 + r() * 30, 12 + r() * 18, r() * 3, 0, TAU); g.fill(); }
  g.strokeStyle = "#5b8fc0"; g.lineWidth = 18; g.lineCap = "round"; g.beginPath(); g.moveTo(-10, 120); g.bezierCurveTo(160, 60, 220, 260, 330, 240); g.bezierCurveTo(440, 220, 470, 330, 610, 300); g.stroke();
  g.strokeStyle = "#c8262e"; g.lineWidth = 6; g.beginPath(); g.arc(200, 210, 30, 0, TAU); g.stroke();
  g.fillStyle = "#3a2216"; g.font = "900 34px Georgia, serif"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("PARIS", 400, 60);
  g.strokeStyle = "#5a3a22"; g.lineWidth = 8; g.strokeRect(4, 4, 592, 412);
});
/** night rooftops silhouette (alpha) for the far layers: mansards, chimneys + pots, domes, lit windows */
const roofsTex = (key: string, col: string, rim: string, seed: number, domes: boolean) => ctex("stRoofs" + key, 2048, 512, (g) => {
  const r = rng(seed); g.fillStyle = col;
  let x = 0;
  while (x < 2048) {
    const w = 90 + r() * 170, h = 120 + r() * 200, m = 30 + r() * 40;
    g.fillStyle = col; g.beginPath(); g.moveTo(x, 512); g.lineTo(x, 512 - h + m); g.lineTo(x + 14, 512 - h); g.lineTo(x + w - 14, 512 - h); g.lineTo(x + w, 512 - h + m); g.lineTo(x + w, 512); g.closePath(); g.fill();
    g.fillStyle = rim; g.fillRect(x + 14, 512 - h, w - 28, 3);
    for (let k = 0; k < 1 + Math.floor(r() * 3); k++) { const cx = x + 20 + r() * (w - 50), ch = 26 + r() * 30; g.fillStyle = col; g.fillRect(cx, 512 - h - ch, 22, ch + 4); for (let p = 0; p < 3; p++) g.fillRect(cx + 2 + p * 7, 512 - h - ch - 10, 5, 10); }
    for (let k = 0; k < Math.floor(w / 46); k++) { const wx = x + 18 + k * 46, wy = 512 - h + m + 20 + r() * (h - m - 60); if (wy > 500) continue; const lit = r() < 0.35; g.fillStyle = lit ? "#ffcf6e" : "rgba(20,24,60,0.6)"; g.fillRect(wx, wy, 14, 20); if (lit) { g.fillStyle = "rgba(255,200,110,0.25)"; g.fillRect(wx - 6, wy - 6, 26, 32); } }
    if (domes && r() < 0.12) { g.fillStyle = col; g.beginPath(); g.arc(x + w / 2, 512 - h, w * 0.32, Math.PI, 0); g.fill(); g.fillRect(x + w / 2 - 3, 512 - h - w * 0.32 - 30, 6, 30); }
    x += w + r() * 10;
  }
});
/** the tower silhouette (alpha), 512 x 1024: curved legs, arch, two platforms, top cabin + mast, lattice hatching */
const towerTex = () => ctex("stTowerSil", 512, 1024, (g) => {
  const B = 1010, H = 940, hw = (f: number) => 7 + 213 * Math.pow(Math.max(0, 1 - f / 0.94), 2.4);
  g.fillStyle = "#1b2152"; g.beginPath();
  for (let i = 0; i <= 60; i++) { const f = (i / 60) * 0.94; g.lineTo(256 - hw(f), B - f * H); }
  for (let i = 60; i >= 0; i--) { const f = (i / 60) * 0.94; g.lineTo(256 + hw(f), B - f * H); }
  g.closePath(); g.fill();
  g.save(); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.ellipse(256, B, 120, 150, 0, Math.PI, 0); g.fill();
  for (const f of [0.31, 0.6]) { const y = B - f * H; g.beginPath(); g.ellipse(256, y + 2, hw(f) * 0.62, f < 0.5 ? 60 : 36, 0, Math.PI, 0); g.fill(); }
  g.restore();
  g.fillStyle = "#1b2152"; for (const [f, k] of [[0.29, 1.25], [0.58, 1.3]] as const) { const y = B - f * H, w = hw(f) * k; g.fillRect(256 - w, y - 12, w * 2, 20); }
  g.fillRect(256 - 18, B - 0.95 * H - 24, 36, 32); g.fillRect(253, B - H - 60, 6, 70);
  g.save(); g.globalCompositeOperation = "source-atop"; g.strokeStyle = "rgba(120,130,200,0.5)"; g.lineWidth = 2;
  for (let y = 0; y < 1024; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + 260); g.stroke(); g.beginPath(); g.moveTo(512, y); g.lineTo(0, y + 260); g.stroke(); }
  g.restore();
  for (let i = 0; i <= 40; i++) { const f = (i / 40) * 0.92; for (const s of [-1, 1]) { g.fillStyle = "#ffd88a"; g.beginPath(); g.arc(256 + s * (hw(f) - 3), B - f * H, 3.2, 0, TAU); g.fill(); } }
});
const zincTex = () => ctex("stZinc", 512, 512, (g, r) => {
  g.fillStyle = "#3b4a86"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = "rgba(160,180,240,0.35)"; g.fillRect(x, 0, 4, 512); g.fillStyle = "rgba(10,14,40,0.35)"; g.fillRect(x + 4, 0, 3, 512); }
  for (let i = 0; i < 20; i++) { g.fillStyle = "rgba(150,170,230,0.12)"; g.fillRect(r() * 512, r() * 512, 60, 120); }
});
const facadeNight = () => ctex("stFacadeN", 1024, 512, (g, r) => {
  g.fillStyle = "#5a5f96"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(40,40,90,0.18)"; g.fillRect(r() * 1024, r() * 512, 80, 60); }
  g.fillStyle = "rgba(30,30,70,0.35)"; for (let y = 0; y < 512; y += 64) g.fillRect(0, y, 1024, 3);
  for (let x = 40; x < 1024; x += 128) for (const y of [60, 300]) { const lit = r() < 0.25; g.fillStyle = lit ? "#ffcf72" : "#252b62"; g.fillRect(x, y, 50, 120); g.fillStyle = "#3a3f78"; g.fillRect(x - 8, y + 120, 66, 10); }
  g.fillStyle = "#2c3168"; g.fillRect(0, 0, 1024, 26);
});


// ---------------- the set ----------------
export const study = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch(), out = new Batch();
  const r = rng(925);
  const floor = lam("stFloor", () => ({ map: over("stFloorT", 1024, 1024, planksHD(), (g, rr) => { g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.4; g.fillStyle = "#9a5a3a"; g.fillRect(0, 0, 1024, 1024); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(40,20,30,0.12)"; g.beginPath(); g.ellipse(rr() * 1024, rr() * 1024, 20 + rr() * 50, 10 + rr() * 30, rr() * 3, 0, TAU); g.fill(); } }) }));
  const wallM = lam("stWall", () => ({ map: wallpaper() }));
  const plasterM = lam("stPlasterM", () => ({ map: plaster() }));
  const beam = lam("stBeam", () => ({ map: beamStain("stBeam", "#5a3424", 0.5) }));
  const wain = lam("stWain", () => ({ map: boardsV("stWain", "#5a2e22", 0.55) }));
  const trim = lam("stTrim", () => ({ color: "#efe0bf" }));
  const deskW = lam("stDeskW", () => ({ map: beamStain("stDeskW", "#6a2a1a", 0.5) }));
  const benchW = lam("stBenchW", () => ({ map: boardsH("stBenchW", "#7a4a2a", 0.4) }));
  const iron = metal("stIron", "#2b2f3c", 60), gold = metal("stGold", "#e0ac44", 70), brass = metal("stBrass", "#c99a3a", 60), chrome = metal("stChrome", "#c9ced8", 90);
  const paperM = lam("stPaper", () => ({ color: "#f3ead4" }));
  const letterM = lam("stLetterM", () => ({ map: letterTex() }));
  const letter2 = lam("stLetter2", () => ({ map: letterTex(), side: THREE.DoubleSide }));
  const deedM = lam("stDeedM", () => ({ map: deedTex() }));
  const deed2 = lam("stDeed2", () => ({ map: deedTex(), side: THREE.DoubleSide }));

  // ================= shell: floor, knee walls, slopes, gables, rafters =================
  shell.add(quad(V(-X1, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(-X1, 0, ZB), (2 * X1) / 2, (ZF - ZB) / 2), floor);
  for (const s of [-1, 1]) {
    shell.add(boxGeo(V(s < 0 ? -X1 - 0.2 : X1, 0, ZB), V(s < 0 ? -X1 : X1 + 0.2, KH, ZF), 2), wallM);
    b.add(boxGeo(V(s < 0 ? -X1 : X1 - 0.05, 0, ZB), V(s < 0 ? -X1 + 0.05 : X1, 0.16, ZF)), trim); // skirting
  }
  const L = ZF - ZB, sl = Math.hypot(X1, RH - KH);
  shell.add(quad(V(-X1, KH, ZF), V(-X1, KH, ZB), V(0, RH, ZB), V(0, RH, ZF), L / 2, sl / 2), plasterM);
  shell.add(quad(V(X1, KH, ZB), V(X1, KH, ZF), V(0, RH, ZF), V(0, RH, ZB), L / 2, sl / 2), plasterM);
  const gable = (z0: number, hole: boolean) => {
    const sh = new THREE.Shape(); sh.moveTo(-X1, 0); sh.lineTo(X1, 0); sh.lineTo(X1, KH); sh.lineTo(0, RH); sh.lineTo(-X1, KH); sh.closePath();
    if (hole) { const hp = new THREE.Path(); hp.absarc(0, WY, WR, 0, TAU, true); sh.holes.push(hp); }
    // r175 ExtrudeGeometry builds NO cap faces when bevelEnabled is false: a hair-thin one-segment bevel keeps the caps
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0, bevelSegments: 1, curveSegments: 40 }); geo.translate(0, 0, z0);
    const uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
    const m = new THREE.Mesh(geo, wallM); m.receiveShadow = true; root.add(m);
  };
  gable(ZB - 0.3, true); gable(ZF, false);
  for (const [z0, z1] of [[ZB, ZB + 0.04], [ZF - 0.04, ZF]]) { b.add(boxGeo(V(-X1, 0, z0), V(X1, 0.72, z1), 2), wain); b.add(boxGeo(V(-X1, 0.72, z0 - 0.01), V(X1, 0.79, z1 + 0.02)), trim); }
  for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -X1 : X1 - 0.04, KH - 0.06, ZB), V(s < 0 ? -X1 + 0.04 : X1, KH, ZF)), trim);
  const rafter = (x0: number, y0: number, x1: number, y1: number, z: number, w = 0.12, d = 0.18) => {
    const a = V(x0, y0, z), c = V(x1, y1, z), dir = c.clone().sub(a), len = dir.length(); dir.normalize();
    const n = V(-dir.y, dir.x, 0); if (n.y > 0) n.negate();
    const m = new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5).addScaledVector(n, d / 2 - 0.01), new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), dir), V(1, 1, 1));
    b.add(new THREE.BoxGeometry(len, d, w), beam, m);
  };
  for (let z = ZB + 0.35; z < ZF; z += 1.05) { rafter(-X1, KH, 0, RH, z); rafter(X1, KH, 0, RH, z); }
  b.add(boxGeo(V(-0.1, RH - 0.24, ZB), V(0.1, RH, ZF), 1.5), beam);
  for (const s of [-1, 1]) b.add(boxGeo(V(s * 1.8 - 0.08, hAt(1.8) - 0.2, ZB), V(s * 1.8 + 0.08, hAt(1.8) + 0.02, ZF), 1.5), beam);
  for (const z of [-1.6, 1.2]) b.add(boxGeo(V(-0.95, 2.85, z - 0.08), V(0.95, 2.97, z + 0.08), 1.5), beam);
  // front gable: the stair door + a framed print
  const door = lam("stDoor", () => ({ map: boardsV("stDoor", "#6a3424", 0.5) }));
  b.add(boxGeo(V(-2.4, 0, ZF - 0.06), V(-1.55, 1.95, ZF - 0.02)), door);
  b.add(boxGeo(V(-2.48, 0, ZF - 0.08), V(-1.47, 2.03, ZF - 0.05)), trim);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), brass); knob.position.set(-1.65, 1.0, ZF - 0.1); root.add(knob);

  // ================= the round window: frame, cross + ring muntins, glass, sill, curtain =================
  const frameM = lam("stFrame", () => ({ color: "#e9dcc0" }));
  for (const [z, rr, tube] of [[ZB + 0.02, WR + 0.05, 0.075], [ZB - 0.29, WR + 0.02, 0.04]] as const) { const t = new THREE.Mesh(new THREE.TorusGeometry(rr, tube, 10, 48), frameM); t.position.set(0, WY, z); t.castShadow = true; root.add(t); }
  const inner = new THREE.Mesh(new THREE.TorusGeometry(WR * 0.5, 0.025, 8, 32), frameM); inner.position.set(0, WY, ZB - 0.16); root.add(inner);
  for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(WR * 2, 0.04, 0.04), frameM); m.position.set(0, WY, ZB - 0.16); m.rotation.z = (k * Math.PI) / 2; root.add(m); }
  const glassM = new THREE.MeshBasicMaterial({ color: "#9fb6ff", transparent: true, opacity: 0.08, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.CircleGeometry(WR, 40), glassM); glass.position.set(0, WY, ZB - 0.15); glass.layers.set(NOINK); root.add(glass);
  for (const [dx, dy, l, a] of [[-0.25, 0.14, 0.42, -0.7], [-0.12, 0.2, 0.22, -0.7]] as const) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.04, l), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.2, depthWrite: false })); s.position.set(dx, WY + dy, ZB - 0.14); s.rotation.z = a; s.layers.set(NOINK); root.add(s); }
  b.add(boxGeo(V(-0.6, WY - WR - 0.1, ZB - 0.02), V(0.6, WY - WR - 0.03, ZB + 0.16)), trim);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 14), lam("stPot", () => ({ color: "#c0603a" }))); pot.position.set(0.4, WY - WR - 0.03 + 0.06, ZB + 0.08); root.add(pot);
  const leafM = lam("stLeaf", () => ({ color: "#3f7a44" })), petal = lam("stPetal", () => ({ color: "#e0303e" }));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), leafM); l.scale.set(1, 0.6, 1); l.position.set(0.4 + Math.cos(a) * 0.05, WY - WR + 0.15, ZB + 0.08 + Math.sin(a) * 0.05); root.add(l); }
  for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), petal); f.position.set(0.37 + k * 0.03, WY - WR + 0.22 + (k % 2) * 0.03, ZB + 0.07); root.add(f); }
  const sillCandle = candle(root, [-0.4, WY - WR - 0.03, ZB + 0.08], 0.8, 1.5, 2.5);
  rod(root, [-1.15, WY + WR + 0.16, ZB + 0.08], [0.85, WY + WR + 0.16, ZB + 0.08], 0.018, brass);
  const curtGeo = new THREE.PlaneGeometry(0.55, 1.95, 10, 14); const cp = curtGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), t = (0.975 - y) / 1.95; cp.setX(i, x * (1 - 0.45 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5)) - 0.1 * t); cp.setZ(i, 0.05 * Math.sin((x / 0.55) * Math.PI * 5)); }
  curtGeo.computeVertexNormals(); curtGeo.translate(0, -0.975, 0);
  const curtain = new THREE.Mesh(curtGeo, lam("stCurtain", () => ({ map: ctex("stCurtainT", 256, 512, (g) => { g.fillStyle = "#7a2234"; g.fillRect(0, 0, 256, 512); for (let x = 0; x < 256; x += 26) { const gr = g.createLinearGradient(x, 0, x + 26, 0); gr.addColorStop(0, "rgba(255,200,200,0.16)"); gr.addColorStop(1, "rgba(40,0,10,0.3)"); g.fillStyle = gr; g.fillRect(x, 0, 26, 512); } g.fillStyle = "#d9b45a"; g.fillRect(0, 490, 256, 12); }), side: THREE.DoubleSide })));
  curtain.position.set(-0.88, WY + WR + 0.14, ZB + 0.12); curtain.castShadow = true; root.add(curtain);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 14), gold); tie.position.set(-0.96, WY - 0.15, ZB + 0.16); root.add(tie);

  // ================= outside: the opposite house (lit dormer), far roof layers, the tower, moon, stars, smoke ======
  const OZ = -7.6, MT = 1.2; // opposite facade plane, its mansard top
  const zinc = new THREE.MeshBasicMaterial({ map: zincTex() }), facN = new THREE.MeshBasicMaterial({ map: facadeNight() });
  const darkN = new THREE.MeshBasicMaterial({ color: "#2a3168" }), stoneN = new THREE.MeshBasicMaterial({ color: "#6a70a8" });
  out.add(quad(V(-14, -14, OZ), V(14, -14, OZ), V(14, 0.0, OZ), V(-14, 0.0, OZ), 2.8, 1.4), facN);
  out.add(boxGeo(V(-14, -0.05, OZ - 0.05), V(14, 0.12, OZ + 0.22)), stoneN);
  out.add(quad(V(-14, 0.12, OZ), V(14, 0.12, OZ), V(14, MT, OZ - 1.3), V(-14, MT, OZ - 1.3), 9, 1), zinc);
  out.add(quad(V(-14, MT, OZ - 1.3), V(14, MT, OZ - 1.3), V(14, MT + 0.2, OZ - 6), V(-14, MT + 0.2, OZ - 6), 9, 1), darkN);
  const NWX = 0.55;
  const dormers: THREE.Mesh[] = [];
  for (const dx of [-3.0, NWX, 4.2]) {
    const lit = dx === NWX, z0 = OZ - 0.75, zf = OZ + 0.02;
    for (const [x0, y0, x1, y1] of [[dx - 0.5, 0.12, dx + 0.5, 0.3], [dx - 0.5, 0.95, dx + 0.5, 1.1], [dx - 0.5, 0.3, dx - 0.36, 0.95], [dx + 0.36, 0.3, dx + 0.5, 0.95]]) out.add(boxGeo(V(x0, y0, z0), V(x1, y1, zf)), stoneN);
    out.add(new THREE.ConeGeometry(0.72, 0.38, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.75).translate(dx, 1.29, OZ - 0.37), zinc);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.66), new THREE.MeshBasicMaterial({ color: lit ? new THREE.Color("#ffc66a").multiplyScalar(1.5) : new THREE.Color("#1e2458") }));
    w.position.set(dx, 0.62, z0 + 0.02); root.add(w); if (lit) dormers.push(w);
    if (!lit) { rod(root, [dx, 0.3, zf - 0.03], [dx, 0.95, zf - 0.03], 0.018, darkN); rod(root, [dx - 0.36, 0.64, zf - 0.03], [dx + 0.36, 0.64, zf - 0.03], 0.018, darkN); }
    else for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.64), new THREE.MeshBasicMaterial({ color: "#c0485a" })); c.position.set(dx + s * 0.27, 0.63, zf - 0.04); root.add(c); }
  }
  const neighGlow = glow(root, [NWX, 0.65, OZ + 0.3], "#ffb860", 2.0, 0.7);
  const chims: V3[] = [[-1.6, MT, OZ - 2.2], [2.6, MT, OZ - 2.6], [-5.2, MT, OZ - 2.0]];
  for (const [x, y, z] of chims) { out.add(boxGeo(V(x - 0.4, y - 0.4, z - 0.3), V(x + 0.4, y + 0.85, z + 0.3)), facN); for (let k = 0; k < 3; k++) out.add(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 8).translate(x - 0.22 + k * 0.22, y + 1.0, z), lam("stChimPot", () => ({ color: "#b8684a" }))); }
  const smoke = chims.flatMap(([x, y, z], i) => [0, 1, 2].map((k) => { const m = mist(root, [x, y + 1.2, z], 0.9, "#8f96c8", 0.4); m.userData = { p: [x, y + 1.2, z], ph: k / 3 + i * 0.21 }; return m; }));
  out.build(root, false);
  const card = (tex: THREE.Texture, w: number, h: number, pos: V3) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: true, alphaTest: 0.02 })); m.geometry.translate(0, h / 2, 0); m.position.set(...pos); root.add(m); return m; };
  card(roofsTex("A", "#323d82", "#7884c8", 3, false), 50, 9, [-4, -8.0, -18]);
  card(roofsTex("B", "#3f4b92", "#8a96d6", 5, true), 80, 12, [-6, -10.8, -30]);
  const TWX = 2.4, TWZ = -32, TWY = -1.0, TWH = 9.0;
  card(towerTex(), TWH / 2, TWH, [TWX, TWY, TWZ]);
  card(roofsTex("C", "#4c5aa2", "#97a2dc", 9, true), 130, 16, [0, -14.6, -46]);
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("stBeacon", 64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,230,180,0.7)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), color: new THREE.Color(2.4, 1.8, 1.2), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  beacon.position.set(TWX, TWY + TWH - 0.08, TWZ + 0.1); beacon.scale.setScalar(1.2); beacon.layers.set(NOINK); root.add(beacon);
  const tglow = glow(root, [TWX, TWY + TWH * 0.55, TWZ + 0.2], "#ffc070", 7, 0.16);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("stMoon", 128, 128, (g) => { g.fillStyle = "#f8f2dc"; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = "rgba(200,190,170,0.5)"; for (const [x, y, rr] of [[44, 50, 12], [80, 76, 9], [70, 40, 6]]) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } }), color: new THREE.Color(1.5, 1.5, 1.45), fog: false, transparent: true }));
  moon.scale.setScalar(2.0); moon.position.set(-4.6, 5.0, -50); moon.layers.set(NOINK); root.add(moon);
  glow(root, [-4.6, 5.0, -50.2], "#a8b8ff", 9, 0.5);
  { const n = 90, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) pos.set([-14 + r() * 28, 1 + r() * 12, -55 - r() * 5], i * 3); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ color: "#e8eeff", size: 0.14, fog: false, transparent: true, opacity: 0.9 })); st.layers.set(NOINK); root.add(st); }

  // ================= moonlight: spot through the window, shaft, floor patch, dust =================
  const moonL = new THREE.SpotLight("#9ab0ff", 7, 7, 0.5, 0.6, 1.2); moonL.position.set(0, WY, ZB - 0.1); moonL.target.position.set(0.1, 0.0, -1.0); root.add(moonL, moonL.target);
  const beamS = shaft(root, [0, WY, ZB + 0.02], [0.08, 0.02, -1.3], 1.1, "#a8bcff", 0.1);
  const patch = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ctex("stMoonPatch", 256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = "destination-out"; g.fillStyle = "black"; g.fillRect(122, 0, 12, 256); g.fillRect(0, 122, 256, 12); g.beginPath(); g.lineWidth = 9; g.strokeStyle = "black"; g.arc(128, 128, 64, 0, TAU); g.stroke(); }), color: "#8fa4ff", transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  patch.scale.set(0.85, 1, 1.4); patch.position.set(0.05, 0.006, -1.25); patch.layers.set(NOINK); root.add(patch);
  const dust = motes(root, [-0.6, 0.3, -2.6], [0.6, 2.2, -1.0], 34, "#c8d6ff", 0.022, 0.7, 9);

  // ================= the rug =================
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.8).rotateX(-Math.PI / 2), lam("stRug", () => ({ map: ctex("stRugT", 1024, 840, (g, rr) => {
    g.fillStyle = "#7a2a34"; g.fillRect(0, 0, 1024, 840); g.strokeStyle = "#d4aa5a"; g.lineWidth = 14; g.strokeRect(30, 30, 964, 780); g.strokeStyle = "#2a3a5a"; g.lineWidth = 30; g.strokeRect(66, 66, 892, 708);
    g.fillStyle = "#d4aa5a"; for (let x = 90; x < 950; x += 40) { g.beginPath(); g.arc(x, 66, 6, 0, TAU); g.arc(x, 774, 6, 0, TAU); g.fill(); }
    for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) { const x = 220 + i * 117, y = 230 + k * 127; g.fillStyle = (i + k) % 2 ? "rgba(212,170,90,0.45)" : "rgba(42,58,90,0.5)"; g.beginPath(); g.moveTo(x, y - 36); g.lineTo(x + 30, y); g.lineTo(x, y + 36); g.lineTo(x - 30, y); g.closePath(); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(40,10,20,0.12)"; g.beginPath(); g.arc(rr() * 1024, rr() * 840, 20 + rr() * 50, 0, TAU); g.fill(); }
  }) })));
  rug.position.set(-0.1, 0.008, -0.5); rug.receiveShadow = true; root.add(rug);

  // ================= the press bench (runs front-back on the right) =================
  const BX0 = 0.45, BX1 = 1.3, BZ0 = -2.05, BZ1 = -0.7, BT = 0.82;
  b.add(boxGeo(V(BX0 - 0.03, BT - 0.07, BZ0 - 0.03), V(BX1 + 0.03, BT, BZ1 + 0.03), 1), benchW);
  for (const x of [BX0 + 0.06, BX1 - 0.06]) for (const z of [BZ0 + 0.06, BZ1 - 0.06]) b.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, BT - 0.07, z + 0.05)), deskW);
  b.add(boxGeo(V(BX0 + 0.04, 0.18, BZ0 + 0.04), V(BX1 - 0.04, 0.22, BZ1 - 0.04), 1), benchW); // low shelf
  for (let k = 0; k < 3; k++) b.add(boxGeo(V(BX0 + 0.12 + k * 0.02, 0.22 + k * 0.05, BZ0 + 0.2), V(BX1 - 0.15, 0.27 + k * 0.05, BZ0 + 0.55)), paperM); // paper reams
  b.add(boxGeo(V(BX0 + 0.1, 0.22, -1.2), V(BX0 + 0.45, 0.48, -0.85)), lam("stCrateInk", () => ({ color: "#5a3a26" }))); // ink crate
  const PX = 0.88, PZ = -1.45, PB = BT;
  b.add(boxGeo(V(PX - 0.3, PB, PZ - 0.32), V(PX + 0.3, PB + 0.07, PZ + 0.32)), iron);
  b.add(boxGeo(V(PX - 0.24, PB + 0.07, PZ - 0.25), V(PX + 0.24, PB + 0.1, PZ + 0.25)), iron);
  for (const s of [-1, 1]) { b.add(boxGeo(V(PX + s * 0.27 - 0.045, PB + 0.07, PZ - 0.07), V(PX + s * 0.27 + 0.045, PB + 0.62, PZ + 0.07)), iron); b.add(boxGeo(V(PX + s * 0.27 - 0.05, PB + 0.3, PZ + 0.07), V(PX + s * 0.27 + 0.05, PB + 0.315, PZ + 0.075)), gold); b.add(boxGeo(V(PX + s * 0.27 - 0.05, PB + 0.5, PZ + 0.07), V(PX + s * 0.27 + 0.05, PB + 0.515, PZ + 0.075)), gold); }
  b.add(new THREE.TorusGeometry(0.28, 0.045, 8, 24, Math.PI).scale(1, 0.38, 1).translate(PX, PB + 0.62, PZ), iron);
  b.add(new THREE.SphereGeometry(0.055, 14, 10).translate(PX, PB + 0.78, PZ), gold);
  b.add(new THREE.ConeGeometry(0.05, 0.08, 8).rotateZ(Math.PI).translate(PX, PB + 0.72, PZ), gold);
  for (const s of [-1, 1]) b.add(new THREE.ConeGeometry(0.03, 0.15, 4).rotateZ(s * 1.2).translate(PX + s * 0.08, PB + 0.77, PZ), gold);
  b.add(boxGeo(V(PX - 0.25, PB + 0.56, PZ - 0.06), V(PX + 0.25, PB + 0.62, PZ + 0.06)), iron);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10), chrome); root.add(screw);
  const platen = new THREE.Group(); root.add(platen);
  { const pm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.36), iron); pm.castShadow = true; platen.add(pm); const gl = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.012, 0.012), gold); gl.position.set(0, 0, 0.182); platen.add(gl); }
  // lever on the -x side (toward the press mark): rest = up-left, pulled = down-left to his hand
  const leverG = new THREE.Group(); leverG.position.set(PX - 0.33, PB + 0.48, PZ + 0.02); root.add(leverG);
  { const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 14).rotateX(Math.PI / 2), iron); leverG.add(hub);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.55, 8), iron); bar.position.set(0, 0.275, 0); leverG.add(bar);
    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.12, 4, 10), lam("stGrip", () => ({ color: "#7a4228" }))); grip.position.set(0, 0.6, 0); leverG.add(grip);
    leverG.traverse((o) => { o.castShadow = true; }); }
  b.add(boxGeo(V(BX0 + 0.04, BT, -0.94), V(BX0 + 0.22, BT + 0.02, -0.76)), lam("stInkSlab", () => ({ color: "#24242c" })));
  const brayer = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12).rotateZ(Math.PI / 2), lam("stBrayer", () => ({ color: "#2a2a34" }))); brayer.position.set(BX0 + 0.13, BT + 0.05, -0.85); root.add(brayer);
  rod(root, [BX0 + 0.13, BT + 0.05, -0.85], [BX0 + 0.13, BT + 0.11, -0.73], 0.008, chrome);
  for (let k = 0; k < 10; k++) b.add(new THREE.BoxGeometry(0.22, 0.004, 0.29).rotateY(0.2 + (r() - 0.5) * 0.08).translate(1.12, BT + 0.002 + k * 0.0045, -0.98), paperM);
  { const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.29).rotateX(-Math.PI / 2), letterM); tp.rotation.y = 0.2; tp.position.set(1.12, BT + 0.05, -0.98); root.add(tp); }
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.39).rotateX(-Math.PI / 2), letterM); sheet.castShadow = true; root.add(sheet);
  // envelopes, wax stick, seal, and the bench candle at the back of the bench
  const envM = lam("stEnv", () => ({ map: ctex("stEnvT", 256, 160, (g) => { g.fillStyle = "#efe3c6"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "rgba(120,90,60,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 80); g.lineTo(256, 0); g.stroke(); g.fillStyle = "#b8302e"; g.beginPath(); g.arc(128, 82, 14, 0, TAU); g.fill(); g.fillStyle = "rgba(50,40,40,0.5)"; g.fillRect(120, 110, 100, 6); g.fillRect(120, 124, 80, 6); }) }));
  for (let k = 0; k < 6; k++) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.006, 0.12), envM); e.position.set(0.66 + (r() - 0.5) * 0.02, BT + 0.004 + k * 0.007, -1.92); e.rotation.y = 1.4 + (r() - 0.5) * 0.3; root.add(e); }
  { const bun = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.12), envM); bun.position.set(1.12, BT + 0.03, -1.88); bun.rotation.y = 0.4; root.add(bun); const st = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.006, 4, 16).scale(1.4, 1, 0.9), lam("stString", () => ({ color: "#b8302e" }))); st.rotation.set(Math.PI / 2, 0, 0.4); st.position.copy(bun.position); root.add(st); }
  const waxM = lam("stWax", () => ({ color: "#b8202e" }));
  b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8).rotateZ(1.3).translate(0.6, BT + 0.012, -0.72 - 0.05), waxM);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 14).translate(0.72, BT + 0.006, -0.78), waxM);
  b.add(new THREE.CylinderGeometry(0.012, 0.016, 0.08, 10).translate(1.22, BT + 0.04, -0.78), brass); b.add(new THREE.SphereGeometry(0.02, 10, 8).translate(1.22, BT + 0.09, -0.78), brass);
  const benchCandle = candle(root, [1.15, BT, -1.95], 1.0, 3.2, 3.5);
  // drying line of fresh prints over the bench front (sways)
  const lineA: V3 = [0.25, 2.62, -1.0], lineB: V3 = [1.55, 2.56, -1.0];
  rod(root, lineA, lineB, 0.005, lam("stLine", () => ({ color: "#e8dcc0" })));
  for (const p of [lineA, lineB]) b.add(new THREE.SphereGeometry(0.02, 8, 6).translate(p[0], p[1], p[2]), brass);
  const drying: THREE.Group[] = [];
  for (let k = 0; k < 4; k++) { const x = 0.42 + k * 0.32, g = new THREE.Group(); g.position.set(x, 2.61 - k * 0.015, -1.0); root.add(g); const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.31), k === 1 ? deed2 : letter2); sh.position.y = -0.165; g.add(sh); const peg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.02), deskW); peg.position.y = -0.01; g.add(peg); drying.push(g); }

  // ================= the writing desk (left): banker's lamp, typewriter, stamp + pad, deed, letterhead =================
  const DX0 = -1.55, DX1 = -0.45, DZ0 = -1.55, DZ1 = -0.85, DT = 0.78;
  b.add(boxGeo(V(DX0 - 0.04, DT - 0.06, DZ0 - 0.04), V(DX1 + 0.04, DT, DZ1 + 0.04), 1), deskW);
  b.add(boxGeo(V(DX0, 0.08, DZ0 + 0.02), V(DX0 + 0.42, DT - 0.06, DZ1)), deskW);
  for (let k = 0; k < 3; k++) { const y0 = 0.14 + k * 0.19; b.add(boxGeo(V(DX0 + 0.04, y0, DZ1), V(DX0 + 0.38, y0 + 0.16, DZ1 + 0.02)), deskW); b.add(new THREE.SphereGeometry(0.02, 8, 6).translate(DX0 + 0.21, y0 + 0.08, DZ1 + 0.035), brass); }
  for (const z of [DZ0 + 0.06, DZ1 - 0.06]) b.add(new THREE.CylinderGeometry(0.035, 0.025, DT - 0.06, 8).translate(DX1 - 0.06, (DT - 0.06) / 2, z), deskW);
  b.add(boxGeo(V(DX0 + 0.42, DT - 0.18, DZ1 - 0.02), V(DX1, DT - 0.06, DZ1 + 0.01)), deskW);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6).rotateX(-Math.PI / 2), lam("stLeatherM", () => ({ map: leatherTop() }))); top.position.set((DX0 + DX1) / 2, DT + 0.002, (DZ0 + DZ1) / 2); top.receiveShadow = true; root.add(top);
  // stamp + pad + the deed
  const SX = -0.72, SZ = -1.08;
  const deed = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.34).rotateX(-Math.PI / 2), deedM); deed.position.set(SX + 0.01, DT + 0.004, SZ - 0.03); deed.rotation.y = 0.08; deed.receiveShadow = true; root.add(deed);
  const imprint = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: imprintTex(), transparent: true, depthWrite: false })); imprint.position.set(SX, DT + 0.007, SZ + 0.02); imprint.layers.set(NOINK); root.add(imprint);
  const pad = new THREE.Group(); pad.position.set(SX + 0.02, DT, SZ - 0.33); root.add(pad);
  const tin = metal("stPadTin", "#3a5a8a", 50);
  pad.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.14).translate(0, 0.0175, 0), tin));
  pad.add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.008, 0.11).translate(0, 0.037, 0), lam("stPadFelt", () => ({ color: "#5a2a6a" }))));
  { const lidP = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.14), tin); lidP.position.set(0, 0.07, -0.1); lidP.rotation.x = -1.2; pad.add(lidP); }
  const stamp = new THREE.Group(); root.add(stamp);
  { const wood = lam("stStampWood", () => ({ color: "#9a5a2e" }));
    stamp.add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.055, 0.12).translate(0, 0.04, 0), wood));
    stamp.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.11).translate(0, 0.007, 0), lam("stRubber", () => ({ color: "#5a2a6a" }))));
    stamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.045, 0.11, 14).translate(0, 0.12, 0), wood));
    stamp.add(new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12).scale(1, 0.8, 1).translate(0, 0.21, 0), lam("stStampKnob", () => ({ color: "#6a3a1e" }))));
    stamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.018, 14).translate(0, 0.17, 0), lam("stStampBand", () => ({ color: "#b8302e" }))));
    stamp.traverse((o) => { o.castShadow = true; }); }
  // typewriter (left on the desk)
  const TW = new THREE.Group(); TW.position.set(-1.2, DT, -1.12); TW.rotation.y = 0.15; root.add(TW);
  { const body = metal("stTypeBody", "#22242c", 70), keyTop = lam("stKeyTop", () => ({ color: "#f2ead8" }));
    const tb = new Batch();
    tb.add(new THREE.BoxGeometry(0.42, 0.06, 0.32).translate(0, 0.03, 0), body);
    const slope = new THREE.BoxGeometry(0.42, 0.16, 0.2); slope.rotateX(0.5); slope.translate(0, 0.1, -0.02); tb.add(slope, body);
    tb.add(new THREE.BoxGeometry(0.46, 0.08, 0.1).translate(0, 0.17, -0.13), body);
    tb.add(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 14).rotateZ(Math.PI / 2).translate(0, 0.22, -0.13), lam("stPlatenR", () => ({ color: "#1a1a20" })));
    for (const s of [-1, 1]) tb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12).rotateZ(Math.PI / 2).translate(s * 0.27, 0.22, -0.13), chrome);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 9 - (row === 3 ? 2 : 0); k++) { const x = -0.17 + k * 0.042 + row * 0.01, z = 0.11 - row * 0.045, y = 0.07 + row * 0.022; tb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8).translate(x, y, z), chrome); tb.add(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 10).translate(x, y + 0.018, z), keyTop); }
    tb.add(new THREE.BoxGeometry(0.22, 0.016, 0.03).translate(0, 0.07, 0.15), keyTop);
    tb.build(TW);
    rod(TW, [-0.25, 0.24, -0.12], [-0.33, 0.27, -0.02], 0.007, chrome);
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.26), letter2); tp.position.set(0, 0.36, -0.15); tp.rotation.x = -0.18; TW.add(tp);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.03), new THREE.MeshBasicMaterial({ map: ctex("stTypeLabel", 256, 56, (g) => { g.fillStyle = "#e8c35a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LUTÈCE", 128, 30, 220, 40); }), transparent: true })); lab.position.set(0, 0.2, -0.075); TW.add(lab); }
  // letterhead stack + inkwell + quill at the back of the desk
  for (let k = 0; k < 12; k++) b.add(new THREE.BoxGeometry(0.22, 0.004, 0.29).rotateY(-0.1 + (r() - 0.5) * 0.06).translate(-0.98, DT + 0.002 + k * 0.0045, -1.38), paperM);
  { const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.29).rotateX(-Math.PI / 2), letterM); tp.rotation.y = -0.1; tp.position.set(-0.98, DT + 0.058, -1.38); root.add(tp); }
  b.add(new THREE.CylinderGeometry(0.035, 0.04, 0.05, 12).translate(-0.56, DT + 0.025, -1.42), lam("stInkwell", () => ({ color: "#1f2a4a" })));
  rod(root, [-0.56, DT + 0.05, -1.42], [-0.5, DT + 0.2, -1.35], 0.004, lam("stQuill", () => ({ color: "#f2ead8" })));
  // banker's lamp (green glass shade, brass stem): the warm key on the desk, back left
  const LX = -1.36, LZ = -1.42;
  b.add(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 18).translate(LX, DT + 0.015, LZ), brass);
  b.add(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8).translate(LX, DT + 0.2, LZ), brass);
  b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8).rotateZ(Math.PI / 2).translate(LX + 0.07, DT + 0.38, LZ), brass);
  const shadeM = metal("stShade", "#1f8a52", 80);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.34, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI), shadeM); shade.position.set(LX + 0.1, DT + 0.43, LZ); root.add(shade);
  for (const s of [-1, 1]) { const cap = new THREE.Mesh(new THREE.CircleGeometry(0.095, 16, 0, Math.PI).rotateY(s * Math.PI / 2).rotateX(Math.PI), shadeM); cap.position.set(LX + 0.1 + s * 0.17, DT + 0.43, LZ); root.add(cap); }
  const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.11).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2a0").multiplyScalar(2.2), side: THREE.DoubleSide })); bulb.position.set(LX + 0.1, DT + 0.425, LZ); bulb.layers.set(NOINK); root.add(bulb);
  const lampL = new THREE.PointLight("#ffbe6a", 7, 6, 1.3); lampL.position.set(LX + 0.12, DT + 0.36, LZ + 0.08); root.add(lampL);
  const lampSpot = new THREE.SpotLight("#ffcf8a", 9, 3, 1.0, 0.7, 1.2); lampSpot.position.set(LX + 0.1, DT + 0.4, LZ); lampSpot.target.position.set(LX + 0.45, DT, LZ + 0.4); root.add(lampSpot, lampSpot.target);
  const lampGlow = glow(root, [LX + 0.1, DT + 0.38, LZ + 0.02], "#ffc46a", 1.2, 0.8);
  book(root, [-0.98, DT + 0.058, -1.38], 0.2, 0.04, 0.26, "#2f5d9a", 0.3);

  // ================= wardrobe of disguises (back left, doors open) =================
  const WX0 = -2.55, WX1 = -1.7, WZ0 = -2.76, WZ1 = -2.2, WH = 1.82;
  const robe = lam("stRobe", () => ({ map: beamStain("stRobe", "#5a2a1a", 0.45) }));
  b.add(boxGeo(V(WX0, 0, WZ0), V(WX1, 0.08, WZ1)), robe); b.add(boxGeo(V(WX0, WH - 0.1, WZ0), V(WX1, WH, WZ1 + 0.04)), robe);
  b.add(boxGeo(V(WX0, 0, WZ0), V(WX0 + 0.04, WH, WZ1)), robe); b.add(boxGeo(V(WX1 - 0.04, 0, WZ0), V(WX1, WH, WZ1)), robe); b.add(boxGeo(V(WX0, 0, WZ0), V(WX1, WH, WZ0 + 0.03)), robe);
  b.add(boxGeo(V(WX0 + 0.04, 1.4, WZ0), V(WX1 - 0.04, 1.43, WZ1 - 0.02)), robe);
  rod(root, [WX0 + 0.05, 1.32, (WZ0 + WZ1) / 2], [WX1 - 0.05, 1.32, (WZ0 + WZ1) / 2], 0.012, brass);
  ["#1c1c26", "#7a2a2a", "#2f5d3a", "#c8b48a"].forEach((c, i) => { const x = WX0 + 0.16 + i * 0.17; const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.6, 4, 10).scale(1, 1, 0.45), lam("stCoat" + c, () => ({ color: c }))); m.position.set(x, 0.92, (WZ0 + WZ1) / 2 + 0.02); m.rotation.z = (i - 1.5) * 0.05; m.castShadow = true; root.add(m); rod(root, [x, 1.32, (WZ0 + WZ1) / 2], [x, 1.25, (WZ0 + WZ1) / 2], 0.006, chrome); });
  { const clr = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14), lam("stPriestCol", () => ({ color: "#f8f6ee" }))); clr.position.set(WX0 + 0.16, 1.2, (WZ0 + WZ1) / 2 + 0.07); root.add(clr); }
  const hatsM = { top: lam("stHatTop", () => ({ color: "#1c1a22" })), bowler: lam("stHatBowler", () => ({ color: "#4a3424" })), band: lam("stHatBand", () => ({ color: "#7a2a3a" })) };
  { const th = new THREE.Group(); th.position.set(WX0 + 0.25, 1.43, (WZ0 + WZ1) / 2); root.add(th); th.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 18), hatsM.top), new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.095, 0.2, 18).translate(0, 0.1, 0), hatsM.top)); }
  { const bh = new THREE.Group(); bh.position.set(WX1 - 0.24, 1.43, (WZ0 + WZ1) / 2); root.add(bh); bh.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, TAU, 0, Math.PI / 2), hatsM.bowler), new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 18), hatsM.bowler)); }
  const doorsW: THREE.Group[] = [];
  const moustM = lam("stMoustaches", () => ({ map: ctex("stMoustT", 256, 96, (g) => { for (const [x, c] of [[64, "#2a1d14"], [190, "#c26a2c"]] as const) { g.fillStyle = c; g.beginPath(); g.ellipse(x - 22, 48, 26, 14, 0.3, 0, TAU); g.ellipse(x + 22, 48, 26, 14, -0.3, 0, TAU); g.fill(); } }), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  for (const s of [-1, 1]) {
    const dg = new THREE.Group(); dg.position.set(s < 0 ? WX0 : WX1, 0.08, WZ1); dg.rotation.y = s < 0 ? -1.9 : 1.9; root.add(dg); doorsW.push(dg);
    const w = (WX1 - WX0) / 2;
    const dm = new THREE.Mesh(new THREE.BoxGeometry(w, WH - 0.18, 0.03), robe); dm.position.set(-s * w / 2, (WH - 0.18) / 2, 0.015); dm.castShadow = true; dg.add(dm);
    if (s > 0) { const mir = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, 1.0), metal("stMirror", "#b8c8e8", 120)); mir.position.set(-w / 2, 0.95, -0.002); mir.rotation.y = Math.PI; dg.add(mir); }
    else { const mo = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), moustM); mo.position.set(w / 2, 1.25, -0.004); mo.rotation.y = Math.PI; dg.add(mo);
      const wig = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, TAU, 0, Math.PI * 0.6), lam("stWig", () => ({ color: "#d8d2c4" }))); wig.position.set(w / 2, 0.9, -0.06); wig.rotation.x = -Math.PI / 2; dg.add(wig); }
    const kb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), brass); kb.position.set(-s * (w - 0.06), 0.95, 0.04); dg.add(kb);
  }

  // ================= corkboard (above the press bench): map, clipping, pins + red string =================
  const CB = { x0: 0.8, x1: 1.9, y0: 1.15, y1: 1.92 };
  b.add(boxGeo(V(CB.x0, CB.y0, ZB), V(CB.x1, CB.y1, ZB + 0.03)), lam("stCork", () => ({ map: ctex("stCorkT", 512, 340, (g, rr) => { g.fillStyle = "#b9874e"; g.fillRect(0, 0, 512, 340); for (let i = 0; i < 2500; i++) { g.fillStyle = rr() < 0.5 ? "rgba(120,80,40,0.4)" : "rgba(230,190,130,0.4)"; g.fillRect(rr() * 512, rr() * 340, 2, 2); } }) })));
  for (const [x0, y0, x1, y1] of [[CB.x0 - 0.04, CB.y0 - 0.04, CB.x1 + 0.04, CB.y0], [CB.x0 - 0.04, CB.y1, CB.x1 + 0.04, CB.y1 + 0.04], [CB.x0 - 0.04, CB.y0, CB.x0, CB.y1], [CB.x1, CB.y0, CB.x1 + 0.04, CB.y1]]) b.add(boxGeo(V(x0, y0, ZB), V(x1, y1, ZB + 0.05)), deskW);
  const pin = (x: number, y: number, c: string) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), lam("stPin" + c, () => ({ color: c }))); p.position.set(x, y, ZB + 0.05); root.add(p); return [x, y] as const; };
  const mapP = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.41), lam("stMapM", () => ({ map: mapTex() }))); mapP.position.set(1.14, 1.52, ZB + 0.035); mapP.rotation.z = -0.03; root.add(mapP);
  const clipP = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.39), lam("stClipM", () => ({ map: clippingTex() }))); clipP.position.set(1.66, 1.52, ZB + 0.036); clipP.rotation.z = 0.05; root.add(clipP);
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.11), lam("stNote", () => ({ color: "#f3e08a" }))); note.position.set(0.98, 1.27, ZB + 0.037); note.rotation.z = 0.12; root.add(note);
  const pA = pin(1.02, 1.45, "#c8262e"), pB = pin(1.66, 1.69, "#c8262e"); pin(1.14, 1.7, "#2f5d9a"); pin(1.66, 1.34, "#e8c14a"); pin(0.98, 1.31, "#3f7a4a");
  rod(root, [pA[0], pA[1], ZB + 0.055], [pB[0], pB[1], ZB + 0.055], 0.004, lam("stRedString", () => ({ color: "#d02a2a" })));

  // ================= cat bed under the window (in the moonlight) =================
  const CATX = -0.42, CATZ = -2.38;
  { const bed = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.085, 10, 24).rotateX(Math.PI / 2), lam("stCatBed", () => ({ map: ctex("stCatBedT", 256, 64, (g) => { g.fillStyle = "#c8742e"; g.fillRect(0, 0, 256, 64); for (let x = 0; x < 256; x += 16) { g.fillStyle = "rgba(90,40,10,0.35)"; g.fillRect(x, 0, 3, 64); } }) }))); bed.position.set(CATX, 0.085, CATZ); bed.castShadow = true; root.add(bed);
    const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 20), lam("stCatCush", () => ({ color: "#d8c09a" }))); cush.position.set(CATX, 0.05, CATZ); root.add(cush);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.04, 14), lam("stBowl", () => ({ color: "#3f6a9a" }))); bowl.position.set(CATX - 0.42, 0.02, CATZ + 0.12); root.add(bowl);
    const yarn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), lam("stYarn", () => ({ color: "#c8262e" }))); yarn.position.set(CATX + 0.32, 0.05, CATZ + 0.3); root.add(yarn); }

  // ================= coat stand with spare hats (front right) =================
  const CSX = 1.85, CSZ = 0.52, wood = lam("stStandWood", () => ({ color: "#5a3020" }));
  b.add(new THREE.CylinderGeometry(0.03, 0.035, 1.8, 10).translate(CSX, 0.9, CSZ), wood);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.4; rod(root, [CSX, 0.25, CSZ], [CSX + Math.cos(a) * 0.24, 0.0, CSZ + Math.sin(a) * 0.24], 0.022, wood); rod(root, [CSX, 1.62, CSZ], [CSX + Math.cos(a) * 0.17, 1.74, CSZ + Math.sin(a) * 0.17], 0.012, wood); }
  b.add(new THREE.SphereGeometry(0.045, 10, 8).translate(CSX, 1.82, CSZ), brass);
  { const fed = new THREE.Group(); fed.position.set(CSX + 0.03, 1.8, CSZ); fed.rotation.set(0.1, 0, 0.15); root.add(fed);
    const fm = lam("stFedora", () => ({ color: "#5a5e6e" })); fed.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 20), fm), new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.12, 16).translate(0, 0.06, 0), fm), new THREE.Mesh(new THREE.CylinderGeometry(0.101, 0.101, 0.03, 16).translate(0, 0.02, 0), hatsM.band)); }
  { const bw = new THREE.Group(); bw.position.set(CSX + 0.16, 1.68, CSZ + 0.08); bw.rotation.set(0.3, 0, -0.5); root.add(bw); bw.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, TAU, 0, Math.PI / 2), hatsM.bowler), new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 18), hatsM.bowler)); }
  { const strawM = lam("stStraw", () => ({ color: "#e6c27a" })); const st = new THREE.Group(); st.position.set(CSX - 0.15, 1.66, CSZ - 0.06); st.rotation.set(-0.2, 0, 0.55); root.add(st); st.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 20), strawM), new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16).translate(0, 0.04, 0), strawM), new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.025, 16).translate(0, 0.02, 0), lam("stStrawBand", () => ({ color: "#26386a" })))); }
  { const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.7, 4, 10).scale(1, 1, 0.45), lam("stOvercoat", () => ({ color: "#3a3f58" }))); coat.position.set(CSX - 0.02, 1.15, CSZ + 0.12); coat.rotation.set(0.05, 0.3, 0.04); coat.castShadow = true; root.add(coat);
    const sc = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.6, 4, 8), lam("stScarf", () => ({ color: "#c8352e" }))); sc.position.set(CSX + 0.1, 1.3, CSZ + 0.14); sc.rotation.z = 0.15; root.add(sc);
    const um = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.85, 8), lam("stUmbrella", () => ({ color: "#1c1c26" }))); um.position.set(CSX + 0.2, 0.42, CSZ - 0.1); um.rotation.z = -0.15; root.add(um); }

  // ================= low bookshelf (right knee wall), steamer trunk, waste basket, floor books =================
  const shelfW = lam("stShelf", () => ({ map: beamStain("stShelf", "#4a2418", 0.5) }));
  b.add(boxGeo(V(3.0, 0, -1.55), V(3.56, 1.02, -1.5)), shelfW); b.add(boxGeo(V(3.0, 0, 1.5), V(3.56, 1.02, 1.55)), shelfW);
  const bookCols = ["#8a2a2a", "#2f5d9a", "#3f7a4a", "#c9a04a", "#6a3a6a", "#b85a2a", "#26386a"];
  for (const y of [0.02, 0.5, 1.0]) { b.add(boxGeo(V(3.0, y, -1.55), V(3.56, y + 0.03, 1.55)), shelfW); if (y > 0.9) continue; let z = -1.48; while (z < 1.42) { const w = 0.04 + r() * 0.045, hb = 0.26 + r() * 0.16; const bk = book(root, [3.3, y + 0.03, z + w / 2], 0.24, hb, w, bookCols[Math.floor(r() * 7)], Math.PI / 2); if (r() < 0.1) bk.rotation.x = 0.2; z += w + 0.006; } }
  for (let k = 0; k < 4; k++) book(root, [-1.92 + (k % 2) * 0.02, k * 0.06, -0.55], 0.3, 0.06, 0.22, bookCols[k + 1], (r() - 0.5) * 0.5);
  { const tr = lam("stTrunk", () => ({ map: ctex("stTrunkT", 512, 256, (g) => { g.fillStyle = "#6a3a22"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#3a2216"; for (const x of [40, 470]) g.fillRect(x, 0, 18, 256); for (const [x, y, c, t] of [[120, 60, "#e8c35a", "NICE"], [260, 140, "#7fb0d0", "VIENNE"], [360, 50, "#e86a5a", "PRAGUE"]] as const) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 60, 36, 0.2, 0, TAU); g.fill(); g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, t, x, y, 90, 26); } }) }));
    b.add(boxGeo(V(-3.05, 0, 0.6), V(-2.15, 0.62, 1.3)), tr); const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.3, 1), tr); tl.position.set(-2.6, 0.62, 0.95); root.add(tl); }
  { const bsk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.36, 16, 1, true), lam("stBasket", () => ({ color: "#a87a42", side: THREE.DoubleSide }))); bsk.position.set(-0.3, 0.18, -0.72); root.add(bsk);
    for (let k = 0; k < 4; k++) { const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), paperM); ball.position.set(-0.3 + (r() - 0.5) * 0.15, 0.36 + (k % 2) * 0.04, -0.72 + (r() - 0.5) * 0.15); root.add(ball); }
    for (let k = 0; k < 3; k++) { const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 1), paperM); ball.position.set(-0.75 + k * 0.28 + (r() - 0.5) * 0.1, 0.05, -0.35 + r() * 0.3); root.add(ball); } }

  // ================= wall sconce candle on the left of the back wall =================
  const scon = candle(root, [-2.9, 0.95, ZB + 0.12], 1.1, 2.4, 3.2);
  b.add(boxGeo(V(-2.98, 0.9, ZB), V(-2.82, 0.95, ZB + 0.16)), brass);

  shell.build(root, false); b.build(root);

  // ================= marks + cams =================
  const marks: Record<string, V3> = {
    press: [-0.02, 0, -1.48], stamp: [-0.95, 0, -2.0], window: [0.32, 0, -2.25], guest: [-0.72, 0, -0.42], door: [-1.95, 0, 2.6],
    cat: [CATX, 0, CATZ], neighbour: [NWX, -0.85, OZ - 0.42], pressTop: [PX, PB + 0.1, PZ], stampTop: [SX, DT, SZ], tower: [TWX, TWY + TWH * 0.6, TWZ],
  };
  const cams = {
    wide: { pos: [0.1, 1.72, 3.35] as V3, look: [-0.2, 1.35, -1.8] as V3, fov: 44 },
    medium: { pos: [0.15, 1.5, 2.1] as V3, look: [-0.3, 1.2, -1.0] as V3, fov: 40 },
    low: { pos: [0.5, 0.38, 0.35] as V3, look: [0.05, 1.5, -1.8] as V3, fov: 42 },
    high: { pos: [-0.45, 2.8, 0.45] as V3, look: [-0.8, 0.75, -1.35] as V3, fov: 42 },
    window: { pos: [-0.3, 1.45, 0.3] as V3, look: [0.0, 1.62, -2.8] as V3, fov: 36 },
    press: { pos: [-0.75, 1.42, -0.2] as V3, look: [0.6, 1.05, -1.45] as V3, fov: 36 },
    stamp: { pos: [-0.72, 1.45, -0.2] as V3, look: [-0.75, 0.8, -1.12] as V3, fov: 34 },
  };
  const cl01 = (x: number) => Math.max(0, Math.min(1, x));
  return {
    name: "study", root, marks, cams,
    pose: (t, c) => {
      flameFlick(benchCandle, t); flameFlick(sillCandle, t); flameFlick(scon, t); dust.update(t);
      const lk = c.lamp ?? 1, hum = 0.97 + 0.03 * Math.sin(t * 31) * Math.sin(t * 7.3);
      lampL.intensity = 7 * lk * hum; lampSpot.intensity = 9 * lk * hum; (lampGlow.material as THREE.SpriteMaterial).opacity = 0.85 * lk; (bulb.material as THREE.MeshBasicMaterial).color.setRGB(2.2 * lk, 1.95 * lk, 1.4 * lk);
      moonL.intensity = 7 * (0.92 + 0.08 * Math.sin(t * 0.5)); (beamS.material as THREE.MeshBasicMaterial).opacity = 0.09 + 0.03 * Math.sin(t * 0.7);
      const bk = Math.max(0, Math.sin(t * 2.2)) ** 4; (beacon.material as THREE.SpriteMaterial).opacity = 0.35 + 0.65 * bk; beacon.scale.setScalar(0.9 + 0.7 * bk);
      (tglow.material as THREE.SpriteMaterial).opacity = 0.75 + 0.25 * Math.sin(t * 1.3);
      const nf = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 2.7); (neighGlow.material as THREE.SpriteMaterial).opacity = nf; dormers.forEach((d) => (d.material as THREE.MeshBasicMaterial).color.setRGB(2.4 * nf, 1.75 * nf, 0.95 * nf));
      smoke.forEach((m) => { const u = (t * 0.18 + m.userData.ph) % 1, p = m.userData.p as V3; m.position.set(p[0] + u * 0.9 + Math.sin(t + u * 4) * 0.1, p[1] + u * 2.2, p[2]); (m.material as THREE.SpriteMaterial).opacity = 0.38 * Math.sin(Math.PI * u); m.scale.set(0.6 + u * 1.4, (0.6 + u * 1.4) * 0.7, 1); });
      curtain.rotation.y = 0.04 * Math.sin(t * 0.6); curtain.rotation.x = 0.02 * Math.sin(t * 0.8 + 1);
      drying.forEach((g, i) => { g.rotation.x = 0.08 * Math.sin(t * 0.9 + i * 0.7); g.rotation.z = 0.03 * Math.sin(t * 0.7 + i); });
      doorsW[0].rotation.y = -1.9 + 0.02 * Math.sin(t * 0.4);
      // press: the lever pulls down toward the press mark, the platen lowers onto the bed, the sheet slides out
      const pr = cl01(c.press ?? 0);
      leverG.rotation.z = 0.3 + 1.75 * pr * pr * (3 - 2 * pr);
      const py = PB + 0.36 - 0.24 * pr; platen.position.set(PX, py, PZ); screw.position.set(PX, (py + PB + 0.56) / 2, PZ); screw.scale.y = (PB + 0.56 - py) / 0.3;
      const sh = cl01(c.sheet ?? 0), se = sh * sh * (3 - 2 * sh);
      sheet.position.set(PX + 0.01 * se, PB + 0.103 + 0.025 * Math.sin(Math.PI * se), PZ + 0.48 * se); sheet.rotation.y = -0.12 * se;
      // stamp: hovers over the deed, comes down
      const sp = cl01(c.stamp ?? 0), sd = sp * sp;
      stamp.position.set(SX, DT + 0.17 * (1 - sd) + 0.004 + 0.006 * Math.sin(t * 2) * (1 - sp), SZ + 0.02); stamp.rotation.set(0.12 * (1 - sp), 0, 0.15 * (1 - sp));
      const imp = Math.max(c.stamped ?? 0, sp > 0.97 ? 1 : 0); imprint.visible = imp > 0.01; (imprint.material as THREE.MeshBasicMaterial).opacity = imp;
    },
  };
};
