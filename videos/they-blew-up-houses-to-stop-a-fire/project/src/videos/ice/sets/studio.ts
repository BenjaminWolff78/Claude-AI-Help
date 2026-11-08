// THE PAINTER'S ATTIC STUDIO, Amsterdam, at night (home base B of "He Saved His Life by Proving His Masterpiece Was Fake";
// light `study` / `studioBlue` for the explanation). Built on the 1925 attic workroom (mansard attic, round window), with
// Amsterdam outside: stepped and bell gables of canal houses, a church tower with a lit clock, moon + stars.
// Room: back wall z -2.8 (round window centre 0, 1.6, r 0.7), slopes down to 1.2 m knee walls at x = +-3.6
// (h(x) = 3.6 - 0.667 |x|): characters stay inside |x| < 1.9.
//   * the EASEL (x -0.32, z -1.32) holds THE PAINTING (title object, masterpiece.ts states) facing the camera
//   * the OVEN (x 0.7..1.9, z -2.76..-1.75): cast iron on a brick plinth, bottom-hinged door with a glass window, rack,
//     cookie tray inside, chimney pipe; RESIN + INK bottles on its top rail
//   * the PIPE ROLLER (x 0.5..1.5, y 0.98, z -1.0) on two trestles
//   * side table (left) with the green banker's lamp, paint tubes, rag, lilacs; old canvases on the left knee wall
//   * wall clock right of the window (hands = c.clock hours); corkboard left of the window with the critic's review
//     "EVERY VIRTUE EXCEPT ORIGINALITY" (ending callback); waste basket; coat stand; trunk; wardrobe; cat bed
// Controls (c): paint/crack/ink/age/wet/blank = painting state | cv = where the painting is (0 easel, 0..1 lift to the
// oven door and slide in, 2 inside, 2..3 out and up onto the roller, 3..4 tips over the pipe, 4..5 back to the easel)
// | door 0..1 oven door open | heat 0..1 oven glow | clock hours (e.g. 1 -> 5) | shine 0..1 glow on the painting
// | lamp 0..1 desk lamp | review 0..1 the review on the corkboard (0 hidden: it is in his hand in scene 4)
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, planksHD } from "../paint";
import { NOINK } from "../ink";
import { glow, shaft, rod, mist } from "../setkit";
import { over, boardsV, boardsH, beamStain, candle, flameFlick, motes, metal, book, TAU } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { framedPainting, shineCard } from "./masterpiece";
import type { SetDef, V3 } from "./types";

/** keep-out boxes (min, max), set-local: furniture the camera must never enter */
export const STUDIO_SOLIDS: [V3, V3][] = [
  [[0.65, 0, -2.8], [1.95, 1.4, -1.7]],     // oven
  [[-0.8, 0, -1.9], [0.2, 2.2, -1.1]],      // easel + painting
  [[0.35, 0, -1.15], [1.65, 1.1, -0.85]],   // pipe roller
  [[-2.1, 0, -1.8], [-1.1, 1.3, -1.0]],     // side table + lamp
  [[-2.6, 0, -2.8], [-1.5, 1.85, -1.75]],   // wardrobe (open doors swing to z -1.8)
  [[2.15, 0, -2.6], [2.65, 1.95, -2.1]],    // coat stand (back right corner, behind the oven)
  [[2.95, 0, -1.6], [3.6, 1.2, 1.6]],       // low bookshelf on the right knee wall
  [[-3.1, 0, 0.55], [-2.1, 0.72, 1.35]],    // steamer trunk
  [[-0.95, 2.82, -1.7], [0.95, 3.6, -1.5]], // collar tie back
  [[-0.95, 2.82, 1.1], [0.95, 3.6, 1.3]],   // collar tie front
  [[-1.85, 1.1, -2.8], [-0.85, 2.0, -2.7]], // corkboard
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


/** the critic's review (newspaper clipping): headline + the one-line verdict, readable from a medium shot */
export const reviewTex = () => ctex("sdReview", 460, 580, (g, r) => {
  g.fillStyle = "#efe6cc"; g.fillRect(0, 0, 460, 580);
  g.fillStyle = "#2a2226"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "900 30px Georgia, serif"; fitText(g, "DE KUNSTKRANT", 230, 34, 420, 36);
  g.fillRect(20, 58, 420, 4); g.font = "700 22px Georgia, serif"; fitText(g, "ART REVIEW", 230, 80, 300, 24);
  g.fillStyle = "#b32a2a"; fitText(g, "EVERY VIRTUE", 230, 150, 420, 64); fitText(g, "EXCEPT", 230, 222, 300, 60); fitText(g, "ORIGINALITY", 230, 294, 420, 64);
  g.fillStyle = "rgba(40,30,30,0.45)"; for (let i = 0; i < 12; i++) g.fillRect(30, 352 + i * 16, 180 + r() * 220, 7);
  g.strokeStyle = "rgba(90,70,50,0.6)"; g.lineWidth = 3; g.strokeRect(4, 4, 452, 572);
});
/** night canal houses (alpha): tall narrow fronts with stepped, bell and neck gables, hoist beams, lit windows */
const gablesTex = (key: string, col: string, rim: string, seed: number) => ctex("sdGables" + key, 2048, 512, (g) => {
  const r = rng(seed); let x = 0;
  while (x < 2048) {
    const w = 70 + r() * 70, h = 230 + r() * 200, kind = Math.floor(r() * 3), top = 512 - h;
    g.fillStyle = col; g.beginPath(); g.moveTo(x, 512); g.lineTo(x, top + 70);
    if (kind === 0) { const n = 4, sw = w / (2 * n + 1); for (let k = 0; k < n; k++) { g.lineTo(x + k * sw, top + 70 - k * 18); g.lineTo(x + (k + 1) * sw, top + 70 - k * 18); } g.lineTo(x + n * sw, top - 6); g.lineTo(x + w - n * sw, top - 6); for (let k = n - 1; k >= 0; k--) { g.lineTo(x + w - (k + 1) * sw, top + 70 - k * 18); g.lineTo(x + w - k * sw, top + 70 - k * 18); } }
    else if (kind === 1) { g.quadraticCurveTo(x + w * 0.1, top + 20, x + w * 0.3, top + 10); g.lineTo(x + w * 0.35, top - 10); g.lineTo(x + w * 0.65, top - 10); g.lineTo(x + w * 0.7, top + 10); g.quadraticCurveTo(x + w * 0.9, top + 20, x + w, top + 70); }
    else { g.lineTo(x + w * 0.25, top + 60); g.lineTo(x + w * 0.25, top); g.lineTo(x + w * 0.75, top); g.lineTo(x + w * 0.75, top + 60); }
    g.lineTo(x + w, top + 70); g.lineTo(x + w, 512); g.closePath(); g.fill();
    g.fillStyle = rim; g.fillRect(x + w * 0.45, top + 18, w * 0.1, 6);
    for (let row = 0; row < 6; row++) for (let k = 0; k < 2; k++) { const wx = x + w * (0.22 + k * 0.38), wy = top + 90 + row * 58; if (wy > 490) continue; const lit = r() < 0.3; g.fillStyle = lit ? "#ffcf6e" : "rgba(20,24,60,0.6)"; g.fillRect(wx, wy, w * 0.2, 34); }
    x += w + 2;
  }
});
/** an Amsterdam church tower (alpha) with a lit clock face, 256 x 1024 */
const spireTex = () => ctex("sdSpire", 256, 1024, (g) => {
  g.fillStyle = "#1b2152";
  g.fillRect(78, 520, 100, 504); g.fillRect(90, 380, 76, 150); g.fillRect(100, 260, 56, 130); g.fillRect(110, 170, 36, 100);
  g.beginPath(); g.moveTo(128, 20); g.lineTo(146, 172); g.lineTo(110, 172); g.closePath(); g.fill();
  for (const [y, w] of [[520, 120], [380, 92], [260, 72], [170, 50]]) g.fillRect(128 - w / 2, y - 10, w, 14);
  g.fillStyle = "#ffe2a0"; g.beginPath(); g.arc(128, 450, 30, 0, TAU); g.fill(); g.strokeStyle = "#1b2152"; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 450); g.lineTo(128, 428); g.moveTo(128, 450); g.lineTo(144, 456); g.stroke();
  g.fillStyle = "#ffcf6e"; for (const y of [300, 600, 700, 800]) { g.fillRect(118, y, 20, 34); }
});

// ---------------- the set ----------------
export const studio = (): SetDef => {
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
  card(gablesTex("A", "#323d82", "#7884c8", 3), 50, 12, [-4, -9.5, -18]);
  card(gablesTex("B", "#3f4b92", "#8a96d6", 5), 80, 16, [-6, -12.8, -30]);
  const TWX = 2.4, TWZ = -32, TWY = -2.0, TWH = 12.0;
  card(spireTex(), TWH / 4, TWH, [TWX, TWY, TWZ]);
  card(gablesTex("C", "#4c5aa2", "#97a2dc", 9), 130, 20, [0, -16.6, -46]);
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("stBeacon", 64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,230,180,0.7)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), color: new THREE.Color(2.4, 1.8, 1.2), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  beacon.position.set(TWX, TWY + TWH * (1 - 450 / 1024), TWZ + 0.1); beacon.scale.setScalar(1.2); beacon.layers.set(NOINK); root.add(beacon);
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

  // ================= THE OVEN (back right, front face z = -1.95): cast-iron baking oven on brick, bottom-hinged door with
  // a little glass window, an inner rack, the glow inside (c.ovenHeat 0..1), chimney pipe to the roof =================
  const OX0 = 0.7, OX1 = 1.9, OZ0 = -2.76, OZ1 = -1.75, OXC = (OX0 + OX1) / 2;
  const brickM = lam("sdBrick", () => ({ map: ctex("sdBrickT", 512, 512, (g, rr) => { g.fillStyle = "#8a4632"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 512; x += 64) { g.fillStyle = ["#b0583c", "#a24e36", "#bd6a48", "#94442e"][Math.floor(rr() * 4)]; g.fillRect(x + 3, y + 3, 58, 26); } g.fillStyle = "rgba(255,220,180,0.08)"; for (let i = 0; i < 80; i++) g.fillRect(rr() * 512, rr() * 512, 20, 4); }) }));
  const castM = metal("sdCast", "#2a2b33", 40), nickel = metal("sdNickel", "#d9dde4", 90);
  b.add(boxGeo(V(OX0 - 0.05, 0, OZ0), V(OX1 + 0.05, 0.36, OZ1 + 0.06)), brickM);            // brick plinth
  // hollow iron body: back, sides, top + bottom slabs (the door opens onto a real cavity)
  b.add(boxGeo(V(OX0, 0.36, OZ0), V(OX1, 1.32, OZ0 + 0.05)), castM);
  b.add(boxGeo(V(OX0, 0.36, OZ0), V(OX0 + 0.12, 1.32, OZ1 - 0.02)), castM); b.add(boxGeo(V(OX1 - 0.12, 0.36, OZ0), V(OX1, 1.32, OZ1 - 0.02)), castM);
  b.add(boxGeo(V(OX0, 1.12, OZ0), V(OX1, 1.32, OZ1 - 0.02)), castM); b.add(boxGeo(V(OX0, 0.36, OZ0), V(OX1, 0.44, OZ1 - 0.02)), castM);
  b.add(boxGeo(V(OX0 - 0.04, 1.32, OZ0), V(OX1 + 0.04, 1.37, OZ1 + 0.02)), nickel);        // nickel top rail
  b.add(boxGeo(V(OX0 + 0.02, 0.36, OZ1 - 0.02), V(OX0 + 0.12, 1.32, OZ1 + 0.02)), castM); b.add(boxGeo(V(OX1 - 0.12, 0.36, OZ1 - 0.02), V(OX1 - 0.02, 1.32, OZ1 + 0.02)), castM);
  b.add(boxGeo(V(OX0 + 0.12, 1.12, OZ1 - 0.02), V(OX1 - 0.12, 1.32, OZ1 + 0.02)), castM); b.add(boxGeo(V(OX0 + 0.12, 0.36, OZ1 - 0.02), V(OX1 - 0.12, 0.44, OZ1 + 0.02)), castM);
  for (const x of [OX0 + 0.2, OXC, OX1 - 0.2]) b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12).rotateX(Math.PI / 2).translate(x, 1.22, OZ1 + 0.03), nickel); // dials
  { const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.07), new THREE.MeshBasicMaterial({ map: ctex("sdOvenLbl", 256, 48, (g) => { g.fillStyle = "#d9c27a"; g.fillRect(0, 0, 256, 48); g.fillStyle = "#2a2014"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "HOLLANDIA", 128, 26, 230, 34); }) }));
    lbl.position.set(OXC, 1.17, OZ1 + 0.035); root.add(lbl); }
  // the inside (a glowing cavity seen when the door opens), rack + the cookie tray
  const cavM = new THREE.MeshBasicMaterial({ color: "#2a1410" });
  const cav = new THREE.Mesh(new THREE.PlaneGeometry(OX1 - OX0 - 0.24, 0.68), cavM); cav.position.set(OXC, 0.78, OZ0 + 0.06); root.add(cav);
  b.add(boxGeo(V(OX0 + 0.12, 0.44, OZ1 - 0.3), V(OX0 + 0.14, 1.12, OZ1 - 0.02)), castM); b.add(boxGeo(V(OX1 - 0.14, 0.44, OZ1 - 0.3), V(OX1 - 0.12, 1.12, OZ1 - 0.02)), castM);
  for (let k = 0; k < 22; k++) rod(root, [OX0 + 0.14, 0.7, OZ0 + 0.1 + k * 0.04], [OX1 - 0.14, 0.7, OZ0 + 0.1 + k * 0.04], 0.004, nickel);
  const tray = new THREE.Group(); tray.position.set(OXC, 0.46, OZ1 - 0.3); root.add(tray);
  tray.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.22), metal("sdTray", "#9aa0aa", 60)));
  const cookieM = lam("sdCookie", () => ({ map: ctex("sdCookieT", 64, 64, (g, rr) => { g.fillStyle = "#d9a85a"; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 8; i++) { g.fillStyle = "#4a2a14"; g.beginPath(); g.arc(rr() * 64, rr() * 64, 4, 0, TAU); g.fill(); } }) }));
  for (let i = 0; i < 6; i++) { const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 14), cookieM); ck.position.set(-0.09 + (i % 3) * 0.09, 0.014, -0.05 + Math.floor(i / 3) * 0.1); tray.add(ck); }
  const heatL = new THREE.PointLight("#ff8a3a", 0, 3, 1.4); heatL.position.set(OXC, 0.8, OZ1 + 0.2); root.add(heatL);
  const heatGlow = glow(root, [OXC, 0.8, OZ1 + 0.06], "#ff9a4a", 1.6, 0);
  // the door: hinged at its bottom edge (rotation.x 0 = shut, -1.45 = open flat)
  const doorG = new THREE.Group(); doorG.position.set(OXC, 0.44, OZ1 + 0.02); root.add(doorG);
  { const dw = OX1 - OX0 - 0.24, dh = 0.68;
    const dm = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.04).translate(0, dh / 2, 0.02), castM); dm.castShadow = true; doorG.add(dm);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(dw * 0.5, dh * 0.34, 0.012).translate(0, dh * 0.56, 0.046), nickel); doorG.add(fr);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(dw * 0.42, dh * 0.26), new THREE.MeshBasicMaterial({ color: "#3a1a10" })); win.position.set(0, dh * 0.56, 0.054); win.name = "ovenWin"; doorG.add(win);
    rod(doorG, [-dw * 0.32, dh * 0.92, 0.07], [dw * 0.32, dh * 0.92, 0.07], 0.016, nickel);
    for (const s of [-1, 1]) rod(doorG, [s * dw * 0.32, dh * 0.92, 0.04], [s * dw * 0.32, dh * 0.92, 0.07], 0.01, nickel); }
  const ovenWin = doorG.getObjectByName("ovenWin") as THREE.Mesh;
  // chimney pipe up through the roof slope
  rod(root, [OXC + 0.3, 1.37, OZ0 + 0.25], [OXC + 0.3, 2.35, OZ0 + 0.25], 0.07, castM);
  const ovenSmoke = [0, 1, 2].map((k) => { const m = mist(root, [OXC + 0.3, 2.4, OZ0 + 0.25], 0.35, "#c8b8a8", 0); m.userData = { ph: k / 3 }; return m; });

  // ================= THE EASEL + THE PAINTING (centre left, facing the camera) =================
  const EX = -0.32, EZ = -1.32, EY = 1.38, CW = 0.72, CH = 0.9;
  const easelW = lam("sdEasel", () => ({ map: beamStain("sdEasel", "#8a5a32", 0.4) }));
  rod(root, [EX - 0.42, 0, EZ + 0.18], [EX - 0.05, 2.15, EZ - 0.05], 0.028, easelW);
  rod(root, [EX + 0.42, 0, EZ + 0.18], [EX + 0.05, 2.15, EZ - 0.05], 0.028, easelW);
  rod(root, [EX, 0, EZ - 0.55], [EX, 2.05, EZ - 0.08], 0.026, easelW);
  b.add(boxGeo(V(EX - 0.5, EY - CH / 2 - 0.06, EZ - 0.02), V(EX + 0.5, EY - CH / 2 - 0.02, EZ + 0.12)), easelW); // ledge
  b.add(boxGeo(V(EX - 0.06, EY + CH / 2 - 0.01, EZ - 0.06), V(EX + 0.06, EY + CH / 2 + 0.05, EZ + 0.06)), easelW); // top clamp
  const PAINT = framedPainting(root, [EX, EY, EZ + 0.06], 0, CW, CH, 0);
  const shine = shineCard(PAINT.g, CW, CH);
  // a paint-smeared palette + brush jar + pots on a stool by the easel
  const stoolX = EX + 0.75, stoolZ = EZ + 0.15;
  b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16).translate(stoolX, 0.62, stoolZ), easelW);
  for (let k = 0; k < 3; k++) { const a = k * 2.1; rod(root, [stoolX + Math.cos(a) * 0.15, 0, stoolZ + Math.sin(a) * 0.15], [stoolX + Math.cos(a) * 0.1, 0.61, stoolZ + Math.sin(a) * 0.1], 0.02, easelW); }
  { const pal = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 20).scale(1.3, 1, 1), lam("sdPalette", () => ({ map: ctex("sdPaletteT", 128, 128, (g, rr) => { g.fillStyle = "#c8a070"; g.fillRect(0, 0, 128, 128); for (const c of ["#c8262e", "#e8c23a", "#2f4fa0", "#f2f0e6", "#3a2014", "#2f7a5a"]) { g.fillStyle = c; g.beginPath(); g.arc(20 + rr() * 90, 20 + rr() * 90, 9, 0, TAU); g.fill(); } }) })));
    pal.position.set(stoolX - 0.04, 0.645, stoolZ); pal.rotation.y = 0.4; root.add(pal);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.12, 12), new THREE.MeshLambertMaterial({ color: "#8ab0b8", transparent: true, opacity: 0.7 })); jar.position.set(stoolX + 0.1, 0.70, stoolZ - 0.06); root.add(jar);
    for (let k = 0; k < 4; k++) rod(root, [stoolX + 0.1, 0.66, stoolZ - 0.06], [stoolX + 0.1 + (k - 1.5) * 0.025, 0.86, stoolZ - 0.06 + (k % 2 - 0.5) * 0.03], 0.006, lam("sdBrushH" + k, () => ({ color: ["#c8262e", "#3a2014", "#e8c23a", "#2f4fa0"][k] }))); }
  // the RESIN bottle + the INK bottle on the oven's top rail (readable labels)
  const bottle = (x: number, label: string, col: string) => {
    const g = new THREE.Group(); g.position.set(x, 1.37, OZ1 - 0.12); root.add(g);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 14).translate(0, 0.1, 0), new THREE.MeshLambertMaterial({ color: col })));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.06, 10).translate(0, 0.23, 0), new THREE.MeshLambertMaterial({ color: col })));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 10).translate(0, 0.27, 0), lam("sdCork", () => ({ color: "#b98a52" }))));
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.08), new THREE.MeshBasicMaterial({ map: ctex("sdLbl" + label, 160, 116, (gg) => { gg.fillStyle = "#f2ead2"; gg.fillRect(0, 0, 160, 116); gg.strokeStyle = "#3a2014"; gg.lineWidth = 6; gg.strokeRect(5, 5, 150, 106); gg.fillStyle = "#2a1a10"; gg.textAlign = "center"; gg.textBaseline = "middle"; fitText(gg, label, 80, 58, 136, 52); }) }));
    l.position.set(0, 0.1, 0.061); g.add(l); return g;
  };
  bottle(OX0 + 0.18, "RESIN", "#c9a24a"); bottle(OX0 + 0.38, "INK", "#1e2030");

  // ================= THE PIPE ROLLER (in front of the oven): an iron pipe on two trestles; the canvas tips over it =================
  const RX0 = 0.5, RX1 = 1.5, RY = 0.98, RZ = -1.0;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, RX1 - RX0 + 0.2, 16).rotateZ(Math.PI / 2), metal("sdPipe", "#5a5e6a", 50)); pipe.position.set((RX0 + RX1) / 2, RY, RZ); pipe.castShadow = true; root.add(pipe);
  for (const x of [RX0, RX1]) { rod(root, [x - 0.12, 0, RZ + 0.12], [x, RY - 0.05, RZ], 0.025, easelW); rod(root, [x + 0.12, 0, RZ - 0.12], [x, RY - 0.05, RZ], 0.025, easelW); }

  // ================= painter's side table (left): banker's lamp (warm practical light), paint tubes, rag, lilacs =================
  const DX0 = -2.05, DX1 = -1.15, DZ0 = -1.75, DZ1 = -1.05, DT = 0.78;
  b.add(boxGeo(V(DX0 - 0.04, DT - 0.06, DZ0 - 0.04), V(DX1 + 0.04, DT, DZ1 + 0.04), 1), deskW);
  for (const x of [DX0 + 0.05, DX1 - 0.05]) for (const z of [DZ0 + 0.05, DZ1 - 0.05]) b.add(boxGeo(V(x - 0.035, 0, z - 0.035), V(x + 0.035, DT - 0.06, z + 0.035)), deskW);
  for (let k = 0; k < 7; k++) { const tc = ["#c8262e", "#e8c23a", "#2f4fa0", "#f2f0e6", "#3a2014", "#2f7a5a", "#c86a2a"][k]; const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.08, 4, 8).rotateZ(Math.PI / 2), metal("sdTube" + k, "#d9dde4", 60)); t.position.set(DX0 + 0.25 + k * 0.05, DT + 0.02, DZ1 - 0.12 - (k % 2) * 0.05); t.rotation.y = 0.3 * (k % 3 - 1); root.add(t); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.025, 8).rotateZ(Math.PI / 2), lam("sdTubeCap" + k, () => ({ color: tc }))); cap.position.set(t.position.x + 0.065, DT + 0.02, t.position.z); root.add(cap); }
  { const rag = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1).scale(1.4, 0.45, 1), lam("sdRag", () => ({ map: ctex("sdRagT", 64, 64, (g, rr) => { g.fillStyle = "#e8e0cc"; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 12; i++) { g.fillStyle = ["#c8262e", "#2f4fa0", "#3a2014"][i % 3]; g.beginPath(); g.arc(rr() * 64, rr() * 64, 3 + rr() * 5, 0, TAU); g.fill(); } }) }))); rag.position.set(DX1 - 0.18, DT + 0.03, DZ0 + 0.2); root.add(rag); }
  { const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.2, 14), lam("sdVase", () => ({ color: "#3a6a9a" }))); vase.position.set(DX0 + 0.16, DT + 0.1, DZ0 + 0.18); root.add(vase);
    const lil = lam("sdLilac", () => ({ color: "#b47ad8" })), lil2 = lam("sdLilac2", () => ({ color: "#d8b0f2" }));
    for (let k = 0; k < 5; k++) { const a = k * 1.3, x = DX0 + 0.16 + Math.cos(a) * 0.08, z = DZ0 + 0.18 + Math.sin(a) * 0.06, y = DT + 0.32 + (k % 2) * 0.05; const cone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 1).scale(1, 1.6, 1), k % 2 ? lil : lil2); cone.position.set(x, y, z); root.add(cone); rod(root, [DX0 + 0.16, DT + 0.18, DZ0 + 0.18], [x, y - 0.05, z], 0.005, lam("sdStem", () => ({ color: "#4a7a3a" }))); } }
  const LX = DX0 + 0.62, LZ = DZ0 + 0.16;
  const brass2 = metal("sdBrass", "#c99a3a", 60);
  b.add(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 18).translate(LX, DT + 0.015, LZ), brass2);
  b.add(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8).translate(LX, DT + 0.2, LZ), brass2);
  const shadeM = metal("stShade", "#1f8a52", 80);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.34, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI), shadeM); shade.position.set(LX + 0.1, DT + 0.43, LZ); root.add(shade);
  for (const s of [-1, 1]) { const cap = new THREE.Mesh(new THREE.CircleGeometry(0.095, 16, 0, Math.PI).rotateY(s * Math.PI / 2).rotateX(Math.PI), shadeM); cap.position.set(LX + 0.1 + s * 0.17, DT + 0.43, LZ); root.add(cap); }
  const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.11).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2a0").multiplyScalar(2.2), side: THREE.DoubleSide })); bulb.position.set(LX + 0.1, DT + 0.425, LZ); bulb.layers.set(NOINK); root.add(bulb);
  const lampL = new THREE.PointLight("#ffbe6a", 7, 6, 1.3); lampL.position.set(LX + 0.12, DT + 0.36, LZ + 0.08); root.add(lampL);
  const lampSpot = new THREE.SpotLight("#ffcf8a", 9, 3, 1.0, 0.7, 1.2); lampSpot.position.set(LX + 0.1, DT + 0.4, LZ); lampSpot.target.position.set(LX + 0.45, DT, LZ + 0.4); root.add(lampSpot, lampSpot.target);
  const lampGlow = glow(root, [LX + 0.1, DT + 0.38, LZ + 0.02], "#ffc46a", 1.2, 0.8);
  // old canvases leaning against the left knee wall (backs + one turned round)
  for (let k = 0; k < 4; k++) { const w = 0.5 + k * 0.12, h = 0.6 + k * 0.1; const cvs = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), lam("sdOldCv" + (k % 2), () => ({ color: k % 2 ? "#c9b48a" : "#a8875e" }))); cvs.position.set(-2.55 + k * 0.06, h / 2 + 0.02, 0.2 - k * 0.32); cvs.rotation.set(0, Math.PI / 2 - 0.05, 0.16); root.add(cvs); }
  const oldPic = framedPainting(root, [-2.42, 0.48, 0.6], Math.PI / 2 - 0.25, 0.5, 0.62, 0.06, 0); oldPic.g.rotation.z = 0.12;

  // ================= wall clock (back wall, right of the window): its hands sweep through the afternoon (c.clock) =====
  const CKX = 1.25, CKY = 1.92, CKZ = ZB + 0.06;
  { const face = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshBasicMaterial({ map: ctex("sdClock", 256, 256, (g) => { g.fillStyle = "#f6efdc"; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill(); g.fillStyle = "#2a2014"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 30px Georgia"; for (let i = 1; i <= 12; i++) { const a = (i / 12) * TAU - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98); } }) }));
    face.position.set(CKX, CKY, CKZ + 0.03); root.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 8, 32), brass2); rim.position.set(CKX, CKY, CKZ + 0.03); root.add(rim); }
  const hand = (len: number, w: number) => { const g = new THREE.Group(); g.position.set(CKX, CKY, CKZ + 0.045); root.add(g); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len).translate(0, len / 2 - 0.015, 0), new THREE.MeshBasicMaterial({ color: "#1c1612" })); g.add(m); return g; };
  const hourH = hand(0.09, 0.022), minH = hand(0.135, 0.014);

  // ================= corkboard (back wall, left of the window): the critic's review (ending) + sketches =================
  const CB = { x0: -1.78, x1: -0.92, y0: 1.18, y1: 1.92 };
  b.add(boxGeo(V(CB.x0, CB.y0, ZB), V(CB.x1, CB.y1, ZB + 0.03)), lam("stCork", () => ({ map: ctex("stCorkT", 512, 340, (g, rr) => { g.fillStyle = "#b9874e"; g.fillRect(0, 0, 512, 340); for (let i = 0; i < 2500; i++) { g.fillStyle = rr() < 0.5 ? "rgba(120,80,40,0.25)" : "rgba(230,190,130,0.25)"; g.fillRect(rr() * 512, rr() * 340, 3, 3); } }) })));
  for (const [x0, y0, x1, y1] of [[CB.x0 - 0.04, CB.y0 - 0.04, CB.x1 + 0.04, CB.y0], [CB.x0 - 0.04, CB.y1, CB.x1 + 0.04, CB.y1 + 0.04], [CB.x0 - 0.04, CB.y0, CB.x0, CB.y1], [CB.x1, CB.y0, CB.x1 + 0.04, CB.y1]]) b.add(boxGeo(V(x0, y0, ZB), V(x1, y1, ZB + 0.05)), lam("stCorkFrame", () => ({ color: "#5a3424" })));
  const reviewM = lam("sdReviewM", () => ({ map: reviewTex() }));
  const review = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.58), reviewM); review.position.set(-1.38, 1.6, ZB + 0.036); review.rotation.z = -0.04; root.add(review);
  const sketchM = lam("sdSketchM", () => ({ map: ctex("sdSketch", 200, 260, (g) => { g.fillStyle = "#f2ead4"; g.fillRect(0, 0, 200, 260); g.strokeStyle = "#5a3a22"; g.lineWidth = 4; g.beginPath(); g.ellipse(100, 100, 40, 50, 0, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(40, 250); g.quadraticCurveTo(100, 150, 160, 250); g.stroke(); g.beginPath(); g.ellipse(100, 60, 80, 16, 0, 0, TAU); g.stroke(); }) }));
  for (const [x, y, rz] of [[-1.66, 1.76, 0.08], [-1.02, 1.3, -0.1]] as [number, number, number][]) { const sk = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2), sketchM); sk.position.set(x, y, ZB + 0.035); sk.rotation.z = rz; root.add(sk); }
  const pin = (x: number, y: number, c: string) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), lam("stPin" + c, () => ({ color: c }))); p.position.set(x, y, ZB + 0.05); root.add(p); };
  pin(-1.33, 1.82, "#c8262e"); pin(-1.69, 1.82, "#2f5d9a"); pin(-1.02, 1.45, "#e8c14a");

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

  // ================= cat bed under the window (in the moonlight) =================
  const CATX = -0.42, CATZ = -2.38;
  { const bed = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.085, 10, 24).rotateX(Math.PI / 2), lam("stCatBed", () => ({ map: ctex("stCatBedT", 256, 64, (g) => { g.fillStyle = "#c8742e"; g.fillRect(0, 0, 256, 64); for (let x = 0; x < 256; x += 16) { g.fillStyle = "rgba(90,40,10,0.35)"; g.fillRect(x, 0, 3, 64); } }) }))); bed.position.set(CATX, 0.085, CATZ); bed.castShadow = true; root.add(bed);
    const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 20), lam("stCatCush", () => ({ color: "#d8c09a" }))); cush.position.set(CATX, 0.05, CATZ); root.add(cush);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.04, 14), lam("stBowl", () => ({ color: "#3f6a9a" }))); bowl.position.set(CATX - 0.42, 0.02, CATZ + 0.12); root.add(bowl);
    const yarn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), lam("stYarn", () => ({ color: "#c8262e" }))); yarn.position.set(CATX + 0.32, 0.05, CATZ + 0.3); root.add(yarn); }

  // ================= coat stand with spare hats (back right corner) =================
  const CSX = 2.4, CSZ = -2.35, wood = lam("stStandWood", () => ({ color: "#5a3020" }));
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
  for (let k = 0; k < 4; k++) book(root, [-2.3 + (k % 2) * 0.02, k * 0.06, -0.75], 0.3, 0.06, 0.22, bookCols[k + 1], (r() - 0.5) * 0.5);
  { const tr = lam("stTrunk", () => ({ map: ctex("stTrunkT", 512, 256, (g) => { g.fillStyle = "#6a3a22"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#3a2216"; for (const x of [40, 470]) g.fillRect(x, 0, 18, 256); for (const [x, y, c, t] of [[120, 60, "#e8c35a", "NICE"], [260, 140, "#7fb0d0", "VIENNE"], [360, 50, "#e86a5a", "PRAGUE"]] as const) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 60, 36, 0.2, 0, TAU); g.fill(); g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, t, x, y, 90, 26); } }) }));
    b.add(boxGeo(V(-3.05, 0, 0.6), V(-2.15, 0.62, 1.3)), tr); const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.3, 1), tr); tl.position.set(-2.6, 0.62, 0.95); root.add(tl); }
  { const bsk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.36, 16, 1, true), lam("stBasket", () => ({ color: "#a87a42", side: THREE.DoubleSide }))); bsk.position.set(-0.98, 0.18, -0.55); root.add(bsk);
    for (let k = 0; k < 4; k++) { const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), paperM); ball.position.set(-0.98 + (r() - 0.5) * 0.15, 0.36 + (k % 2) * 0.04, -0.55 + (r() - 0.5) * 0.15); root.add(ball); }
    for (let k = 0; k < 3; k++) { const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 1), paperM); ball.position.set(-1.4 + k * 0.22 + (r() - 0.5) * 0.1, 0.05, -0.2 + r() * 0.3); root.add(ball); } }

  // ================= wall sconce candle on the left of the back wall =================
  const scon = candle(root, [-2.9, 0.95, ZB + 0.12], 1.1, 2.4, 3.2);
  b.add(boxGeo(V(-2.98, 0.9, ZB), V(-2.82, 0.95, ZB + 0.16)), brass);

  shell.build(root, false); b.build(root);

  // ================= marks + cams =================
  const RXc = (RX0 + RX1) / 2;
  const marks: Record<string, V3> = {
    paint: [0.36, 0, -1.0], oven: [OX0 - 0.22, 0, -1.4], roll: [RX1 + 0.3, 0, RZ - 0.32], board: [-0.75, 0, -1.95], read: [-0.62, 0, -0.55],
    bin: [-0.98, 0, -0.55], window: [0.32, 0, -2.25], door: [-1.95, 0, 2.6],
    canvas: [EX, EY, EZ + 0.08], ovenDoor: [OXC, 0.78, OZ1], pipe: [RXc, RY, RZ], review: [-1.38, 1.6, ZB + 0.04], clock: [CKX, CKY, CKZ],
  };
  const cams = {
    wide: { pos: [0.1, 1.72, 3.35] as V3, look: [0.1, 1.25, -1.6] as V3, fov: 44 },
    easel: { pos: [0.05, 1.5, 1.2] as V3, look: [0.0, 1.3, -1.2] as V3, fov: 40 },
    oven: { pos: [-0.4, 1.45, 1.4] as V3, look: [0.9, 1.0, -1.5] as V3, fov: 42 },
    board: { pos: [-0.35, 1.55, 0.6] as V3, look: [-1.1, 1.4, -2.3] as V3, fov: 40 },
    canvas: { pos: [EX + 0.05, EY + 0.02, EZ + 1.25] as V3, look: [EX, EY, EZ + 0.08] as V3, fov: 40 },
  };
  const cl01 = (x: number) => Math.max(0, Math.min(1, x));
  const ss = (x: number) => { const u = cl01(x); return u * u * (3 - 2 * u); };
  // where the painting is: keyframes on c.cv
  type PR = { p: V3; r: V3 };
  const KE: PR = { p: [EX, EY, EZ + 0.06], r: [0, 0, 0] };
  const KA: PR = { p: [OXC, 1.0, OZ1 + 0.42], r: [-0.7, 0, Math.PI / 2] };
  const KO: PR = { p: [OXC, 0.735, OZ1 - 0.5], r: [-Math.PI / 2, 0, Math.PI / 2] };
  const KR: PR = { p: [RXc, RY + CH / 2 + 0.08, RZ - 0.03], r: [0, 0, 0] };
  const keys: [number, PR][] = [[0, KE], [0.5, KA], [1, KO], [2, KO], [2.5, KA], [3, KR], [4.5, KR], [5, KE]];
  const at = (cv: number): PR => {
    if (cv <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (cv <= keys[i][0]) { const [a0, A] = keys[i - 1], [a1, B] = keys[i], k = ss((cv - a0) / (a1 - a0)); return { p: [0, 1, 2].map((j) => A.p[j] + (B.p[j] - A.p[j]) * k) as V3, r: [0, 1, 2].map((j) => A.r[j] + (B.r[j] - A.r[j]) * k) as V3 }; }
    return keys[keys.length - 1][1];
  };
  return {
    name: "studio", root, marks, cams,
    pose: (t, c) => {
      flameFlick(sillCandle, t); flameFlick(scon, t); dust.update(t);
      const lk = c.lamp ?? 1, hum = 0.97 + 0.03 * Math.sin(t * 31) * Math.sin(t * 7.3);
      lampL.intensity = 7 * lk * hum; lampSpot.intensity = 9 * lk * hum; (lampGlow.material as THREE.SpriteMaterial).opacity = 0.85 * lk; (bulb.material as THREE.MeshBasicMaterial).color.setRGB(2.2 * lk, 1.95 * lk, 1.4 * lk);
      moonL.intensity = 7 * (0.92 + 0.08 * Math.sin(t * 0.5)); (beamS.material as THREE.MeshBasicMaterial).opacity = 0.09 + 0.03 * Math.sin(t * 0.7);
      (beacon.material as THREE.SpriteMaterial).opacity = 0.75; beacon.scale.setScalar(0.8);
      (tglow.material as THREE.SpriteMaterial).opacity = 0.35 + 0.1 * Math.sin(t * 1.3);
      const nf = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 2.7); (neighGlow.material as THREE.SpriteMaterial).opacity = nf; dormers.forEach((d) => (d.material as THREE.MeshBasicMaterial).color.setRGB(2.4 * nf, 1.75 * nf, 0.95 * nf));
      smoke.forEach((m) => { const u = (t * 0.18 + m.userData.ph) % 1, p = m.userData.p as V3; m.position.set(p[0] + u * 0.9 + Math.sin(t + u * 4) * 0.1, p[1] + u * 2.2, p[2]); (m.material as THREE.SpriteMaterial).opacity = 0.38 * Math.sin(Math.PI * u); m.scale.setScalar(0.6 + u * 1.2); });
      curtain.rotation.y = 0.04 * Math.sin(t * 0.6); curtain.rotation.x = 0.02 * Math.sin(t * 0.8 + 1);
      doorsW[0].rotation.y = -1.9 + 0.02 * Math.sin(t * 0.4);
      if (doorsW[1]) doorsW[1].rotation.y = c.wardR ?? 1.9;   // shot 11 closes the right door so it never covers the pinned review
      // the painting: state + where it is (+ the tip over the pipe for cv 3..4.5)
      PAINT.set({ paint: c.paint ?? 1, crack: c.crack ?? 0, ink: c.ink ?? 0, age: c.age ?? 0, wet: c.wet ?? 0, blank: c.blank ?? 0 });
      const cv = c.cv ?? 0, P = at(cv);
      if (cv > 3 && cv < 4.5) {
        const a = 1.15 * (cv < 4 ? ss(cv - 3) : 1 - ss((cv - 4) / 0.5)), L = CH / 2 + 0.08;
        PAINT.g.position.set(RXc, RY + Math.cos(a) * L, RZ - 0.03 + Math.sin(a) * L); PAINT.g.rotation.set(a, 0, 0);
      } else { PAINT.g.position.set(...P.p); PAINT.g.rotation.set(P.r[0], P.r[1], P.r[2]); }
      (shine.material as THREE.MeshBasicMaterial).opacity = cl01(c.shine ?? 0);
      // the oven: door, glow through the window and out of the open door, chimney smoke while hot
      const dr = ss(c.door ?? 0), ht = cl01(c.heat ?? 0), fl = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.1);
      doorG.rotation.x = 1.45 * dr;
      (ovenWin.material as THREE.MeshBasicMaterial).color.setRGB(0.23 + 2.4 * ht * fl, 0.1 + 1.1 * ht * fl, 0.06 + 0.25 * ht);
      cavM.color.setRGB(0.16 + 1.6 * ht * fl, 0.08 + 0.7 * ht * fl, 0.06 + 0.15 * ht);
      heatL.intensity = 6 * ht * fl * (0.3 + 0.7 * dr) + 1.2 * ht; (heatGlow.material as THREE.SpriteMaterial).opacity = ht * (0.25 + 0.75 * dr) * fl;
      ovenSmoke.forEach((m) => { const u = (t * 0.3 + m.userData.ph) % 1; m.position.set(OXC + 0.3 + u * 0.15, 2.4 + u * 1.1, OZ0 + 0.25); (m.material as THREE.SpriteMaterial).opacity = 0.45 * ht * Math.sin(Math.PI * u); m.scale.setScalar(0.3 + u * 0.7); });
      // the clock (hours; minute hand 12x)
      const hr = c.clock ?? (1 + t / 3600);
      hourH.rotation.z = -((hr % 12) / 12) * TAU; minH.rotation.z = -(hr % 1) * TAU;
      review.visible = (c.review ?? 1) > 0.5;
    },
  };
};
