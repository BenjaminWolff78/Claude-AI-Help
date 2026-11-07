// BELLWEATHER DRUG CO., St. Louis 1904, at night ("The Rat Poison Gold Medal": the "That's the trick" explanation).
// Light key `drugNight`. A narrow, tall shop: x -6.2 (tonic end) .. 6.2 (soda fountain end), z -2.8 (back wall,
// shelves to the ceiling) .. 3.0 (front wall: big display window, glazed door with a bell, second window), ceiling 4.6
// (pressed tin). Floor: octagon-and-dot tiles.
//   * Back wall, x -6.2..1.3: labelled drawer cabinets (top 1.06) under dark walnut shelves (boards every 0.42 m up to
//     4.3) packed with coloured apothecary glass (amber, green, cobalt, ruby, clear) and porcelain jars, a rolling ladder
//     at x -2.2, a frieze "PRESCRIPTIONS CAREFULLY COMPOUNDED". Bay x -6.0..-4.6 holds the big PEP-O-LIGHTNING poster.
//     x 1.3..2.3: back-room doorway with a velvet curtain under a wall clock.
//   * Pharmacy counter x -4.7..1.3, z -1.3..-0.55, marble top at CY = 1.02. On it (left to right): the tonic display
//     (stepped stand of PEP-O-LIGHTNING TONIC bottles, x -4.35), brass cash register (x -3.0), RAT-B-GONE tin +
//     powder packets (x -2.0), the brass apothecary SCALE (x -1.45, ctl scale), the rat spot (x -0.85), mortar and
//     pestle (x -0.4), magnifying glass on a stand (x 0.05), candy jars (x 0.6..1.1). Glass showcase in its front.
//   * Soda fountain x 2.4..5.9 (same line as the counter): marble bar with a brass tap tower, syrup pumps, the tower of
//     stacked coffee cups (x 4.6, ctl rattle), the coffee customer's cups, a cake stand; back bar with a mirror, syrup
//     jars, a steaming brass coffee urn, "SODA FOUNTAIN" sign + menu board; three stools (x 3.0 / 3.9 / 4.8).
//   * Front: display window x -5.7..-0.3 (gold-leaf "BELLWEATHER DRUG CO.", two show globes red + green, tonic
//     pyramid), door x 0.5..1.6 with bell (ctl door), window x 2.5..5.6. Outside: night-blue street, gas street lamp,
//     brick block opposite with lit windows, a passer-by silhouette walking, a cat on the outside sill.
//   * Ceiling: five hanging gas globe lamps over the counters (warm pools, slight flicker), two ceiling fans turning.
//
// ctl (pose c):
//   scale  0..1   the apothecary scale: 0 level and empty; 0.5 right pan dips slightly with a tiny pinch of white powder;
//                 0.5 -> 1 too much powder, the right pan crashes down onto the base (fast drop, one bounce at the end)
//                 and a little powder puff rises
//   rattle 0..1   the stacked coffee-cup tower and the customer's cups + spoon rattle on their saucers (jittery coffee)
//   door   0..1   the front door swings open into the shop (bell jingles while it moves)
//   bolt   0..1   the lightning bolt on the poster flashes / glows (the "energy drink" beat)
// Ambient (always): fans turn, gas globes + street lamp flicker, coffee steam (urn + cup), dust motes in the lamp light,
//   bottle glints twinkle, curtain sways, clock runs, passer-by walks past, cat flicks its tail, lit windows across
//   the street twinkle, window light shafts breathe.
//
// Camera lanes kept clear: customer side of both counters z 0.35..2.45, x -5.8..5.8, y 0.3..3.2 (tracking lane from
// the poster/scale end to the soda fountain); the space over the counter top around the scale (high angle) and the
// counter top at rat level from the customer edge (low angle). DRUGSTORE_SOLIDS lists what the camera must never enter.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, jit } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow, shaft } from "../setkit";
import { motes, lamCustom, TAU, boardsV } from "./innerkit_b";
import { fitText, cl, sm, lerp, puff, risePuffs } from "./portkit_common";
import { seg, lathe, goldM, brassM, glassM, woodTex, marbleTex, skyTex, dialTex, clockHands } from "./hotel";
import type { SetDef, V3 } from "./types";

const X0 = -6.2, X1 = 6.2, ZB = -2.8, ZF = 3.0, H = 4.6, CY = 1.02;
const PX0 = -4.7, PX1 = 1.3, FX0 = 2.4, FX1 = 5.9, CZ0 = -1.3, CZ1 = -0.55;

export const DRUGSTORE_SOLIDS: [V3, V3][] = [
  [[X0, 0, ZB], [2.3, H, -2.2]],              // back cabinets + shelves (pharmacy)
  [[-2.5, 0, -2.4], [-1.9, 4.3, -1.55]],      // rolling ladder
  [[PX0 - 0.05, 0, CZ0 - 0.05], [PX1 + 0.05, 1.5, CZ1 + 0.12]],   // pharmacy counter + low props
  [[-4.65, CY, -1.25], [-4.0, CY + 0.62, -0.62]],  // tonic display
  [[-3.3, CY, -1.25], [-2.7, CY + 0.62, -0.75]],   // cash register
  [[-1.85, CY, -1.15], [-1.05, CY + 0.72, -0.72]], // the scale (beam + pans)
  [[FX0 - 0.05, 0, CZ0 - 0.05], [FX1 + 0.05, 1.75, CZ1 + 0.12]],  // soda fountain bar + tap tower + cup tower
  [[2.3, 0, ZB], [X1, 3.9, -2.1]],            // fountain back bar, mirror, sign
  [[2.75, 0, -0.38], [5.05, 0.8, 0.14]],      // the three stools
  [[-5.75, 0, 2.4], [-0.25, 1.45, ZF]],       // window display platform + show globes
  [[5.2, 0, 2.35], [6.0, 1.9, ZF]],           // penny scale
  [[-6.2, 0, 1.6], [-5.75, 1.0, 2.4]],        // chair by the window
  [[-2.75, 3.75, 0.55], [-1.65, H, 1.45]], [[2.45, 3.75, 0.55], [3.55, H, 1.45]], // ceiling fans
  ...[-3.9, -1.45, 0.6, 3.2, 5.0].map((x) => [[x - 0.25, 2.75, -1.2], [x + 0.25, H, -0.7]] as [V3, V3]), // globe lamps
];

// ---------------- textures ----------------
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const center = (g: CanvasRenderingContext2D) => { g.textAlign = "center"; g.textBaseline = "middle"; };
/** octagon-and-dot floor: 1024 px = 1.6 m (8 x 8 octagons of 0.2 m), cream + teal/oxblood dots, worn */
const floorTex = () => ctex("drgFloor", 1024, 1024, (g, r) => {
  g.fillStyle = "#8a8070"; g.fillRect(0, 0, 1024, 1024);
  const n = 8, s = 1024 / n, c = s * 0.29, i3 = 3;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = i * s, y = j * s; g.fillStyle = jit(r, "#e9dfc6", 0.05, 4, 0.1);
    g.beginPath(); g.moveTo(x + c, y + i3); g.lineTo(x + s - c, y + i3); g.lineTo(x + s - i3, y + c); g.lineTo(x + s - i3, y + s - c); g.lineTo(x + s - c, y + s - i3); g.lineTo(x + c, y + s - i3); g.lineTo(x + i3, y + s - c); g.lineTo(x + i3, y + c); g.closePath(); g.fill();
    blot(g, x + s * (0.3 + r() * 0.4), y + s * (0.3 + r() * 0.4), s * 0.45, "rgba(255,250,235,0.35)");
  }
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const x = i * s, y = j * s; g.fillStyle = (i + j) % 3 === 0 ? jit(r, "#7a2a2c", 0.08) : jit(r, "#1f4c4a", 0.08);
    g.beginPath(); g.moveTo(x, y - c + 6); g.lineTo(x + c - 6, y); g.lineTo(x, y + c - 6); g.lineTo(x - c + 6, y); g.closePath(); g.fill();
  }
  for (let k = 0; k < 26; k++) blot(g, r() * 1024, r() * 1024, 50 + r() * 140, "rgba(70,55,40,0.09)");
  g.strokeStyle = "rgba(60,50,40,0.25)"; g.lineWidth = 1.5; for (let k = 0; k < 10; k++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
});
/** big non-repeating grime layer over the floor (worn path along the counters, scuffs) */
const grimeTex = () => ctex("drgGrime", 1024, 512, (g, r) => {
  g.clearRect(0, 0, 1024, 512);
  for (let k = 0; k < 40; k++) blot(g, r() * 1024, 200 + r() * 140, 60 + r() * 120, "rgba(60,40,30,0.12)");
  for (let k = 0; k < 30; k++) blot(g, r() * 1024, r() * 512, 30 + r() * 90, "rgba(50,35,25,0.08)");
  g.strokeStyle = "rgba(40,28,20,0.18)"; g.lineCap = "round"; for (let k = 0; k < 60; k++) { const x = r() * 1024, y = 150 + r() * 260; g.lineWidth = 2 + r() * 4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 8, x + 30 + r() * 40, y + (r() - 0.5) * 10); g.stroke(); }
});
/** end/front walls: 512 x 1024 = 2 m x 4.6 m. beadboard wainscot (1.1 m), chair rail, teal damask paper, stencil frieze */
const wallTex = () => ctex("drgWall", 512, 1024, (g, r) => {
  const ppm = 1024 / H, Y = (m: number) => 1024 - m * ppm;
  const gr = g.createLinearGradient(0, 0, 0, Y(1.1)); gr.addColorStop(0, "#24504a"); gr.addColorStop(1, "#2e5e56"); g.fillStyle = gr; g.fillRect(0, 0, 512, Y(1.1));
  g.fillStyle = "rgba(214,176,96,0.32)";
  for (let y = Y(4.1) + 30; y < Y(1.2); y += 96) for (let x = (Math.round(y / 96) % 2) * 64; x < 560; x += 128) {
    g.beginPath(); g.moveTo(x, y - 34); g.bezierCurveTo(x + 26, y - 14, x + 18, y + 12, x, y + 34); g.bezierCurveTo(x - 18, y + 12, x - 26, y - 14, x, y - 34); g.fill();
    g.beginPath(); g.arc(x, y - 40, 5, 0, TAU); g.fill(); g.fillRect(x - 16, y - 2, 32, 4);
  }
  for (let i = 0; i < 24; i++) blot(g, r() * 512, r() * Y(1.1), 30 + r() * 90, r() < 0.5 ? "rgba(10,30,30,0.18)" : "rgba(160,200,180,0.08)");
  // frieze band
  g.fillStyle = "#e3d6b4"; g.fillRect(0, 0, 512, Y(4.1)); g.fillStyle = "#7a2a2c"; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, Y(4.15)); g.lineTo(x + 32, Y(4.45)); g.lineTo(x + 64, Y(4.15)); g.fill(); }
  g.fillStyle = "#3a2216"; g.fillRect(0, Y(4.1), 512, 8);
  // beadboard wainscot, dark stained
  for (let x = 0; x < 512; x += 32) { g.fillStyle = jit(r, "#5a3220", 0.06); g.fillRect(x, Y(1.1), 32, 1.1 * ppm); g.fillStyle = "rgba(20,8,4,0.6)"; g.fillRect(x, Y(1.1), 3, 1.1 * ppm); g.fillStyle = "rgba(255,200,150,0.12)"; g.fillRect(x + 4, Y(1.1), 3, 1.1 * ppm);
    for (let k = 0; k < 4; k++) { g.strokeStyle = "rgba(30,12,6,0.25)"; g.lineWidth = 1; g.beginPath(); const xx = x + 8 + r() * 18; g.moveTo(xx, Y(1.1)); g.bezierCurveTo(xx + 3, Y(0.8), xx - 3, Y(0.4), xx + 1, Y(0)); g.stroke(); } }
  g.fillStyle = "#7a4a2a"; g.fillRect(0, Y(1.16), 512, 12); g.fillStyle = "#2e1a10"; g.fillRect(0, Y(0.16), 512, 0.16 * ppm);
  for (let i = 0; i < 6; i++) blot(g, r() * 512, Y(0.2 + r() * 0.6), 20 + r() * 30, "rgba(20,10,5,0.25)");
});
/** pressed tin ceiling tile: 512 px = 0.6 m */
const ceilTex = () => ctex("drgCeil", 512, 512, (g, r) => {
  g.fillStyle = "#cbb88a"; g.fillRect(0, 0, 512, 512);
  const emb = (x: number, y: number, w: number, h: number) => { g.fillStyle = "rgba(255,245,210,0.45)"; g.fillRect(x, y, w, 5); g.fillRect(x, y, 5, h); g.fillStyle = "rgba(90,70,40,0.45)"; g.fillRect(x, y + h - 5, w, 5); g.fillRect(x + w - 5, y, 5, h); };
  emb(14, 14, 484, 484); emb(70, 70, 372, 372);
  g.strokeStyle = "rgba(90,70,40,0.5)"; g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 120, 0, TAU); g.stroke(); g.strokeStyle = "rgba(255,245,210,0.5)"; g.lineWidth = 3; g.beginPath(); g.arc(254, 254, 116, 0, TAU); g.stroke();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.fillStyle = "rgba(255,245,210,0.4)"; g.beginPath(); g.ellipse(256 + Math.cos(a) * 64, 256 + Math.sin(a) * 64, 34, 14, a, 0, TAU); g.fill(); g.fillStyle = "rgba(90,70,40,0.35)"; g.beginPath(); g.ellipse(258 + Math.cos(a) * 66, 258 + Math.sin(a) * 66, 30, 10, a, 0, TAU); g.fill(); }
  g.fillStyle = "rgba(255,245,210,0.6)"; g.beginPath(); g.arc(256, 256, 22, 0, TAU); g.fill();
  for (let i = 0; i < 8; i++) blot(g, r() * 512, r() * 512, 60 + r() * 100, "rgba(110,90,60,0.12)");
});
const LBL = ["SYR. ROSAE", "AQ. MENTH.", "TR. ZINGIB.", "OL. RICINI", "SP. CAMPH.", "GLYCERIN", "PULV. RHEI", "SAL EPSOM", "LIQ. FERRI", "ELIX. CALI", "OL. CARYOPH.", "TR. ARNICAE", "SEM. ANISI", "FOL. SALVIAE", "RAD. GENT.", "AQ. ROSAE",
  "BORAX", "OL. LAVAND.", "SYR. TOLU", "TR. MYRRHAE", "OL. MENTH.", "EXT. VANILL.", "ALUMEN", "SULPHUR", "MAGNESIA", "LIQ. AMMON.", "TR. BENZOIN", "OL. OLIVAE", "SYR. LIMON.", "AC. CITRIC.", "SODA BICARB.", "CERA ALBA"];
/** label atlas: 8 x 4 labels of 128 x 128 (cream, black-and-gold, white oval) */
const labelAtlas = () => ctex("drgLabels", 1024, 512, (g, r) => {
  for (let i = 0; i < 32; i++) {
    const x = (i % 8) * 128, y = Math.floor(i / 8) * 128, k = i % 3;
    g.fillStyle = k === 1 ? "#1e1a24" : k === 2 ? "#f6f2e8" : "#efe2c0"; g.fillRect(x + 4, y + 18, 120, 92);
    g.strokeStyle = k === 1 ? "#d6a443" : "#2a1a14"; g.lineWidth = 4; g.strokeRect(x + 10, y + 24, 108, 80); g.lineWidth = 1.5; g.strokeRect(x + 15, y + 29, 98, 70);
    if (k === 2) { g.strokeStyle = "#2a4a9a"; g.lineWidth = 6; g.beginPath(); g.ellipse(x + 64, y + 64, 44, 26, 0, 0, TAU); g.stroke(); }
    g.fillStyle = k === 1 ? "#f2d27a" : "#2a1a14"; center(g); fitText(g, LBL[i], x + 64, y + 64, 82, 22, "700 %spx Georgia, serif");
    void r;
  }
});
const atlasUV = (geo: THREE.PlaneGeometry, i: number) => { const col = i % 8, row = Math.floor(i / 8) % 4, uv = geo.attributes.uv as THREE.BufferAttribute; for (let k = 0; k < uv.count; k++) uv.setXY(k, (col + uv.getX(k)) / 8, 1 - (row + 1) / 4 + uv.getY(k) / 4); return geo; };
/** drawer bank: cols x rows walnut drawers, enamel label plates, brass cup pulls */
const drawersTex = (key: string, cols: number, rows: number, w: number, h: number) => ctex("drgDrawers" + key, w, h, (g, r) => {
  g.fillStyle = "#2a140a"; g.fillRect(0, 0, w, h);
  const cw = w / cols, rh = h / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = i * cw, y = j * rh; g.fillStyle = jit(r, "#6a3a22", 0.08); g.fillRect(x + 5, y + 5, cw - 10, rh - 10);
    for (let k = 0; k < 5; k++) { g.strokeStyle = "rgba(30,12,6,0.3)"; g.lineWidth = 1 + r() * 2; const yy = y + 10 + r() * (rh - 20); g.beginPath(); g.moveTo(x + 6, yy); g.bezierCurveTo(x + cw * 0.4, yy + (r() - 0.5) * 6, x + cw * 0.6, yy + (r() - 0.5) * 6, x + cw - 6, yy); g.stroke(); }
    g.fillStyle = "rgba(255,210,160,0.12)"; g.fillRect(x + 5, y + 5, cw - 10, 4);
    g.strokeStyle = "#1a0c06"; g.lineWidth = 2; g.strokeRect(x + 5, y + 5, cw - 10, rh - 10);
    const lw = cw * 0.62, lh = rh * 0.26; g.fillStyle = "#f4efe2"; g.fillRect(x + (cw - lw) / 2, y + rh * 0.18, lw, lh); g.strokeStyle = "#c9a046"; g.lineWidth = 3; g.strokeRect(x + (cw - lw) / 2, y + rh * 0.18, lw, lh);
    g.fillStyle = "#1e1620"; center(g); fitText(g, pick(r, LBL).split(" ")[0], x + cw / 2, y + rh * 0.18 + lh / 2 + 1, lw - 10, lh * 0.7, "700 %spx Georgia, serif");
    g.fillStyle = "#d6a443"; g.beginPath(); g.ellipse(x + cw / 2, y + rh * 0.66, cw * 0.16, rh * 0.09, 0, 0, Math.PI); g.fill(); g.fillStyle = "#6a4a1a"; g.fillRect(x + cw / 2 - cw * 0.16, y + rh * 0.65, cw * 0.32, 3);
  }
});
/** the big wall poster: 768 x 1152 (1.45 x 2.18 m) */
const posterTex = () => ctex("drgPoster", 768, 1152, (g, r) => {
  const bg = g.createLinearGradient(0, 0, 0, 1152); bg.addColorStop(0, "#c2302e"); bg.addColorStop(1, "#8e1e26"); g.fillStyle = bg; g.fillRect(0, 0, 768, 1152);
  // sunburst
  g.save(); g.translate(384, 600); for (let k = 0; k < 24; k++) { g.rotate(TAU / 24); g.fillStyle = k % 2 ? "rgba(255,190,70,0.28)" : "rgba(255,230,140,0.16)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, -900); g.lineTo(90, -900); g.fill(); } g.restore();
  const rad = g.createRadialGradient(384, 600, 20, 384, 600, 420); rad.addColorStop(0, "rgba(255,240,170,0.75)"); rad.addColorStop(1, "rgba(255,200,90,0)"); g.fillStyle = rad; g.fillRect(0, 0, 768, 1152);
  // headline
  g.fillStyle = "#1c2348"; g.fillRect(0, 40, 768, 200); g.fillStyle = "#f2d27a"; g.fillRect(0, 40, 768, 8); g.fillRect(0, 232, 768, 8);
  center(g); g.lineJoin = "round";
  const hl = (t: string, y: number, mw: number, s: number, fill: string) => { g.font = `900 ${s}px Georgia, serif`; let fs = s; const w = g.measureText(t).width; if (w > mw) fs = s * mw / w; g.font = `900 ${fs}px Georgia, serif`; g.lineWidth = fs * 0.16; g.strokeStyle = "#1a0e10"; g.strokeText(t, 384, y); g.fillStyle = fill; g.fillText(t, 384, y); };
  hl("PEP-O-LIGHTNING!", 140, 690, 108, "#ffd84a");
  // bottle in the middle + bolt behind it
  g.save(); g.translate(384, 610);
  g.fillStyle = "#ffe866"; g.strokeStyle = "#1a0e10"; g.lineWidth = 10; g.beginPath(); g.moveTo(60, -330); g.lineTo(-150, 20); g.lineTo(-20, 20); g.lineTo(-90, 330); g.lineTo(170, -60); g.lineTo(30, -60); g.lineTo(120, -330); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#b06a1e"; g.beginPath(); g.moveTo(-70, -60); g.lineTo(70, -60); g.lineTo(70, 220); g.quadraticCurveTo(70, 240, 50, 240); g.lineTo(-50, 240); g.quadraticCurveTo(-70, 240, -70, 220); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-26, -60); g.lineTo(-26, -130); g.lineTo(26, -130); g.lineTo(26, -60); g.fill(); g.stroke(); g.fillStyle = "#e8c48a"; g.fillRect(-30, -160, 60, 32); g.strokeRect(-30, -160, 60, 32);
  g.fillStyle = "#f4ead0"; g.fillRect(-56, 10, 112, 150); g.strokeRect(-56, 10, 112, 150); g.fillStyle = "#c2302e"; center(g); fitText(g, "PEP-O", 0, 50, 96, 30, "900 %spx Georgia, serif"); g.fillStyle = "#1c2348"; fitText(g, "TONIC", 0, 128, 96, 28, "900 %spx Georgia, serif");
  g.fillStyle = "#ffd84a"; g.beginPath(); g.moveTo(8, 66); g.lineTo(-14, 96); g.lineTo(0, 96); g.lineTo(-8, 116); g.lineTo(16, 86); g.lineTo(2, 86); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(40, -40, 14, 240);
  g.restore();
  // little zap lines
  g.strokeStyle = "#fff6c8"; g.lineWidth = 8; g.lineCap = "round"; for (const [x, y, a] of [[150, 420, -0.6], [620, 470, 0.5], [130, 760, 0.4], [640, 800, -0.4]]) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-40, 0); g.lineTo(-10, -10); g.lineTo(10, 10); g.lineTo(40, 0); g.stroke(); g.restore(); }
  // band + footer
  g.fillStyle = "#1c2348"; g.fillRect(0, 900, 768, 130); g.fillStyle = "#f2d27a"; g.fillRect(0, 900, 768, 6); g.fillRect(0, 1024, 768, 6);
  hl("A PINCH FOR PEP!", 966, 660, 76, "#f6efdc");
  g.fillStyle = "#f6efdc"; center(g); fitText(g, "DR. VOLT'S FAMOUS TONIC  ·  25¢", 384, 1088, 680, 40, "700 %spx Georgia, serif");
  // paper wear: border, stains, a torn corner
  g.strokeStyle = "#f2e6c4"; g.lineWidth = 16; g.strokeRect(8, 8, 752, 1136);
  for (let k = 0; k < 18; k++) blot(g, r() * 768, r() * 1152, 30 + r() * 90, "rgba(90,50,20,0.13)");
  g.fillStyle = "#3a1c10"; g.beginPath(); g.moveTo(768, 1152); g.lineTo(700, 1152); g.lineTo(768, 1090); g.fill();
  g.globalCompositeOperation = "destination-out"; for (let k = 0; k < 220; k++) { g.globalAlpha = 0.3 * r(); g.fillRect(r() * 768, r() * 1152, 2 + r() * 8, 1 + r() * 3); }
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
});
/** bolt-only overlay for the poster flash (same layout as posterTex) */
const boltTex = () => ctex("drgBolt", 768, 1152, (g) => {
  g.save(); g.translate(384, 610); const gr = g.createRadialGradient(0, 0, 40, 0, 0, 420); gr.addColorStop(0, "rgba(255,250,200,0.9)"); gr.addColorStop(1, "rgba(255,220,120,0)"); g.fillStyle = gr; g.fillRect(-384, -610, 768, 1152);
  g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(60, -330); g.lineTo(-150, 20); g.lineTo(-20, 20); g.lineTo(-90, 330); g.lineTo(170, -60); g.lineTo(30, -60); g.lineTo(120, -330); g.closePath(); g.fill(); g.restore();
});
/** tonic bottle label */
const tonicLabelTex = () => ctex("drgTonicLbl", 256, 320, (g) => {
  g.fillStyle = "#1c2348"; g.fillRect(0, 0, 256, 320); g.strokeStyle = "#f2d27a"; g.lineWidth = 8; g.strokeRect(8, 8, 240, 304);
  g.fillStyle = "#ffd84a"; center(g); fitText(g, "PEP-O-", 128, 52, 210, 52, "900 %spx Georgia, serif"); fitText(g, "LIGHTNING", 128, 104, 216, 48, "900 %spx Georgia, serif");
  g.beginPath(); g.moveTo(140, 132); g.lineTo(96, 200); g.lineTo(124, 200); g.lineTo(108, 252); g.lineTo(166, 178); g.lineTo(136, 178); g.lineTo(156, 132); g.closePath(); g.fill();
  g.fillStyle = "#f6efdc"; fitText(g, "TONIC", 128, 286, 200, 34, "700 %spx Georgia, serif");
});
/** RAT-B-GONE tin wrap (u = 0.5 faces the lens) */
const ratTinTex = () => ctex("drgRatTin", 512, 192, (g, r) => {
  g.fillStyle = "#e8b832"; g.fillRect(0, 0, 512, 192); g.fillStyle = "#1e1a22"; g.fillRect(0, 0, 512, 16); g.fillRect(0, 176, 512, 16);
  g.fillStyle = "#b8202a"; g.fillRect(150, 20, 212, 36);
  center(g); g.fillStyle = "#f6efdc"; fitText(g, "RAT-B-GONE", 256, 39, 196, 28, "900 %spx Georgia, serif");
  // skull and crossbones
  g.save(); g.translate(256, 112); g.strokeStyle = "#1e1a22"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(-40, -22); g.lineTo(40, 38); g.moveTo(40, -22); g.lineTo(-40, 38); g.stroke();
  g.fillStyle = "#f6efdc"; g.strokeStyle = "#1e1a22"; g.lineWidth = 4; g.beginPath(); g.arc(0, -4, 26, 0, TAU); g.fill(); g.stroke(); g.fillRect(-14, 14, 28, 16); g.strokeRect(-14, 14, 28, 16);
  g.fillStyle = "#1e1a22"; g.beginPath(); g.arc(-10, -6, 7, 0, TAU); g.arc(10, -6, 7, 0, TAU); g.fill(); g.restore();
  g.fillStyle = "#b8202a"; fitText(g, "POISON", 256, 160, 150, 22, "900 %spx Georgia, serif");
  for (let k = 0; k < 40; k++) blot(g, r() * 512, r() * 192, 6 + r() * 16, "rgba(90,50,10,0.25)");
});
/** gold-leaf window lettering (transparent) */
const windowLetterTex = () => ctex("drgWinLetters", 2048, 640, (g) => {
  g.clearRect(0, 0, 2048, 640); g.lineJoin = "round"; center(g);
  // arched main line
  const text = "BELLWEATHER", R = 1500, cx = 1024, cy = 260 + R, span = 0.78;
  g.font = "900 190px Georgia, serif";
  const ws = [...text].map((ch) => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) * 1.06, k = (span * R) / tot;
  let a = -span / 2;
  [...text].forEach((ch, i) => {
    const w = ws[i] * 1.06 * k; a += w / R / 2; g.save(); g.translate(cx + Math.sin(a) * R, cy - Math.cos(a) * R); g.rotate(a); g.scale(k, 1);
    g.lineWidth = 22; g.strokeStyle = "rgba(40,18,10,0.9)"; g.strokeText(ch, 0, 0);
    const gr = g.createLinearGradient(0, -90, 0, 90); gr.addColorStop(0, "#fff0b0"); gr.addColorStop(0.45, "#e8b44a"); gr.addColorStop(0.55, "#b8822a"); gr.addColorStop(1, "#f6d784"); g.fillStyle = gr; g.fillText(ch, 0, 0);
    g.restore(); a += w / R / 2;
  });
  const line = (t: string, y: number, mw: number, s: number) => { g.font = `900 ${s}px Georgia, serif`; const w = g.measureText(t).width; const fs = w > mw ? s * mw / w : s; g.font = `900 ${fs}px Georgia, serif`; g.lineWidth = fs * 0.12; g.strokeStyle = "rgba(40,18,10,0.9)"; g.strokeText(t, 1024, y); const gr = g.createLinearGradient(0, y - fs / 2, 0, y + fs / 2); gr.addColorStop(0, "#fff0b0"); gr.addColorStop(0.5, "#d6a443"); gr.addColorStop(1, "#f6d784"); g.fillStyle = gr; g.fillText(t, 1024, y); };
  line("DRUG CO.", 410, 900, 120); line("PRESCRIPTIONS · SODA · TONICS", 545, 1500, 72);
});
const menuTex = () => ctex("drgMenu", 512, 640, (g, r) => {
  g.fillStyle = "#23302c"; g.fillRect(0, 0, 512, 640); for (let k = 0; k < 20; k++) blot(g, r() * 512, r() * 640, 40 + r() * 80, "rgba(220,230,220,0.05)");
  g.strokeStyle = "#a87a4a"; g.lineWidth = 20; g.strokeRect(10, 10, 492, 620);
  center(g); g.fillStyle = "#f4eedc"; fitText(g, "TODAY", 256, 70, 380, 54, "700 %spx Georgia, serif");
  const items: [string, string][] = [["COFFEE", "5¢"], ["EGG PHOSPHATE", "5¢"], ["CHERRY SODA", "5¢"], ["SARSAPARILLA", "5¢"], ["ICE CREAM", "10¢"]];
  items.forEach(([a, b], i) => { const y = 160 + i * 92; g.textAlign = "left"; g.fillStyle = "#f4eedc"; fitText(g, a, 44, y, 320, 38, "700 %spx Georgia, serif"); g.textAlign = "right"; g.fillStyle = "#f2c86a"; fitText(g, b, 470, y, 90, 40, "700 %spx Georgia, serif"); g.fillStyle = "rgba(244,238,220,0.35)"; g.fillRect(44, y + 30, 424, 2); });
});
const fountainSignTex = () => ctex("drgFountainSign", 1280, 256, (g) => {
  g.fillStyle = "#1f3a30"; g.fillRect(0, 0, 1280, 256); const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, "rgba(255,255,255,0.1)"); v.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = v; g.fillRect(0, 0, 1280, 256);
  g.strokeStyle = "#d6a443"; g.lineWidth = 10; g.strokeRect(14, 14, 1252, 228); g.lineWidth = 3; g.strokeRect(32, 32, 1216, 192);
  g.fillStyle = "#f2d27a"; center(g); fitText(g, "SODA FOUNTAIN", 640, 132, 1100, 120, "700 %spx Georgia, serif");
});
const friezeTex = () => ctex("drgFrieze", 2048, 128, (g) => {
  g.fillStyle = "#1f3a30"; g.fillRect(0, 0, 2048, 128); g.strokeStyle = "#d6a443"; g.lineWidth = 6; g.strokeRect(6, 6, 2036, 116);
  g.fillStyle = "#f2d27a"; center(g); fitText(g, "PRESCRIPTIONS CAREFULLY COMPOUNDED", 1024, 68, 1880, 76, "700 %spx Georgia, serif");
});
const registerTex = () => ctex("drgRegister", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, "#f2cf7a"); gr.addColorStop(0.5, "#c99a45"); gr.addColorStop(1, "#8a5a1c"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(90,55,15,0.85)"; g.lineWidth = 5;
  for (let k = 0; k < 6; k++) { const x = 40 + (k % 3) * 88, y = 70 + Math.floor(k / 3) * 110; g.beginPath(); g.moveTo(x - 30, y); g.bezierCurveTo(x - 30, y - 40, x + 10, y - 40, x, y - 10); g.bezierCurveTo(x - 10, y + 10, x + 30, y + 30, x + 30, y - 10); g.stroke(); g.beginPath(); g.arc(x, y + 30, 8, 0, TAU); g.stroke(); }
  g.strokeStyle = "rgba(255,240,190,0.7)"; g.lineWidth = 3; g.strokeRect(10, 10, 236, 236);
});
const amountTex = () => ctex("drgAmount", 256, 96, (g) => { g.fillStyle = "#f6efdc"; g.fillRect(0, 0, 256, 96); g.strokeStyle = "#2a1a14"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 90); g.fillStyle = "#b8202a"; center(g); fitText(g, "25¢", 128, 50, 200, 66, "900 %spx Georgia, serif"); });
const pennyTex = () => ctex("drgPenny", 256, 512, (g) => {
  g.fillStyle = "#7a1e24"; g.fillRect(0, 0, 256, 512); g.strokeStyle = "#d6a443"; g.lineWidth = 8; g.strokeRect(8, 8, 240, 496);
  g.fillStyle = "#f4ead0"; g.beginPath(); g.arc(128, 150, 92, 0, TAU); g.fill(); g.strokeStyle = "#2a1a14"; g.lineWidth = 3; for (let k = 0; k < 30; k++) { const a = (k / 30) * TAU; g.beginPath(); g.moveTo(128 + Math.cos(a) * 70, 150 + Math.sin(a) * 70); g.lineTo(128 + Math.cos(a) * 86, 150 + Math.sin(a) * 86); g.stroke(); }
  g.strokeStyle = "#b8202a"; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 150); g.lineTo(178, 100); g.stroke();
  g.fillStyle = "#f2d27a"; center(g); fitText(g, "YOUR WEIGHT", 128, 300, 200, 34, "900 %spx Georgia, serif"); fitText(g, "1¢", 128, 370, 120, 64, "900 %spx Georgia, serif");
});
const brickTex = () => ctex("drgBrickNight", 1024, 512, (g, r) => {
  // facade across the street, 20 m x 10 m, painted for night (unlit material)
  g.fillStyle = "#3a2c52"; g.fillRect(0, 0, 1024, 512);
  for (let y = 0; y < 512; y += 7) for (let x = (y / 7) % 2 ? 0 : 7; x < 1024; x += 14) { g.fillStyle = jit(r, "#45335e", 0.1); g.fillRect(x, y, 13, 6); }
  g.fillStyle = "#2a2140"; g.fillRect(0, 40, 1024, 22); g.fillStyle = "#5a4a78"; g.fillRect(0, 36, 1024, 6);
  for (let i = 0; i < 9; i++) for (let f = 0; f < 2; f++) {
    const x = 40 + i * 112, y = 110 + f * 150; g.fillStyle = "#56467a"; g.fillRect(x - 6, y - 12, 66, 10); g.fillRect(x - 4, y + 96, 62, 8);
    const gl = g.createLinearGradient(0, y, 0, y + 96); gl.addColorStop(0, "#1e2450"); gl.addColorStop(1, "#141838"); g.fillStyle = gl; g.fillRect(x, y, 54, 96);
    g.fillStyle = "rgba(160,180,255,0.18)"; g.beginPath(); g.moveTo(x, y + 60); g.lineTo(x + 30, y); g.lineTo(x + 40, y); g.lineTo(x, y + 80); g.fill();
    g.fillStyle = "#56467a"; g.fillRect(x + 25, y, 4, 96); g.fillRect(x, y + 46, 54, 3);
  }
  // shop fronts at street level
  for (let i = 0; i < 4; i++) { const x = 30 + i * 256; g.fillStyle = "#24203a"; g.fillRect(x, 420, 200, 92); g.fillStyle = "#4a3a2a"; g.fillRect(x - 6, 400, 212, 20); g.fillStyle = "#1a1830"; g.fillRect(x + 80, 430, 40, 82); }
});
const brickLitTex = () => ctex("drgBrickLit", 1024, 512, (g, r) => {
  g.clearRect(0, 0, 1024, 512);
  for (let i = 0; i < 9; i++) for (let f = 0; f < 2; f++) {
    if (r() > 0.32) continue; const x = 40 + i * 112, y = 110 + f * 150;
    const gl = g.createLinearGradient(0, y, 0, y + 96); gl.addColorStop(0, "#ffe2a0"); gl.addColorStop(1, "#ffa850"); g.fillStyle = gl; g.fillRect(x, y, 54, 96);
    g.fillStyle = "rgba(120,60,20,0.6)"; g.fillRect(x + 25, y, 4, 96); g.fillRect(x, y + 46, 54, 3);
    if (r() < 0.5) { g.fillStyle = "rgba(90,40,30,0.75)"; g.beginPath(); g.ellipse(x + 14, y + 58, 9, 11, 0, 0, TAU); g.fill(); g.fillRect(x + 4, y + 66, 20, 30); }
  }
  // one lit shop window at street level
  const gl = g.createLinearGradient(0, 420, 0, 512); gl.addColorStop(0, "#ffd890"); gl.addColorStop(1, "#ff9a4a"); g.fillStyle = gl; g.fillRect(542, 424, 72, 80); g.fillRect(646, 424, 72, 80);
});
const silTex = (key: string, draw: (g: CanvasRenderingContext2D) => void) => ctex("drgSil" + key, 256, 512, (g) => { g.clearRect(0, 0, 256, 512); g.fillStyle = "#121630"; draw(g); });
const walkerTex = () => silTex("walker", (g) => {
  g.beginPath(); g.ellipse(128, 110, 34, 40, 0, 0, TAU); g.fill(); g.fillRect(70, 62, 116, 12); g.fillRect(96, 30, 64, 40); // bowler
  g.beginPath(); g.moveTo(80, 150); g.lineTo(176, 150); g.lineTo(190, 360); g.lineTo(66, 360); g.closePath(); g.fill(); // coat
  g.fillRect(84, 360, 30, 140); g.fillRect(144, 360, 30, 140); g.fillRect(186, 170, 10, 250); // legs + cane
});
const catTex = () => ctex("drgCat", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.fillStyle = "#121630";
  g.beginPath(); g.ellipse(128, 190, 58, 62, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(128, 104, 42, 38, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(92, 92); g.lineTo(96, 48); g.lineTo(120, 74); g.fill(); g.beginPath(); g.moveTo(164, 92); g.lineTo(160, 48); g.lineTo(136, 74); g.fill();
  g.fillStyle = "#ffd84a"; g.beginPath(); g.ellipse(112, 104, 9, 7, 0, 0, TAU); g.ellipse(144, 104, 9, 7, 0, 0, TAU); g.fill(); g.fillStyle = "#121630"; g.fillRect(110, 98, 4, 12); g.fillRect(142, 98, 4, 12);
});
const curtainTex = () => ctex("drgCurtain", 512, 512, (g, r) => {
  for (let x = 0; x < 512; x += 64) { const gr = g.createLinearGradient(x, 0, x + 64, 0); gr.addColorStop(0, "#4a1018"); gr.addColorStop(0.5, "#8a2230"); gr.addColorStop(1, "#4a1018"); g.fillStyle = gr; g.fillRect(x, 0, 64, 512); }
  g.fillStyle = "#d6a443"; g.fillRect(0, 470, 512, 16); for (let x = 8; x < 512; x += 16) { g.beginPath(); g.arc(x, 498, 6, 0, TAU); g.fill(); }
  for (let k = 0; k < 10; k++) blot(g, r() * 512, r() * 512, 40 + r() * 60, "rgba(20,0,10,0.15)");
});
const poolTex = () => ctex("drgPool", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.5, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const mirrorTex = () => ctex("drgMirror", 1024, 512, (g, r) => {
  // a painted reflection of the shop: dim room, the far window's blue, warm globe lamps, a shelf line with bottles
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#41507e"); gr.addColorStop(0.55, "#56608a"); gr.addColorStop(1, "#3a3f66"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "rgba(40,60,130,0.6)"; g.fillRect(120, 150, 300, 260); g.fillRect(560, 160, 220, 240); g.fillStyle = "rgba(90,70,60,0.55)"; g.fillRect(260, 150, 12, 260); g.fillRect(660, 160, 12, 240);
  g.fillStyle = "rgba(60,36,30,0.7)"; g.fillRect(0, 420, 1024, 92);
  for (const x of [200, 520, 860]) { blot(g, x, 90, 70, "rgba(255,210,140,0.55)"); g.fillStyle = "rgba(255,240,200,0.9)"; g.beginPath(); g.arc(x, 90, 16, 0, TAU); g.fill(); }
  for (let k = 0; k < 26; k++) { const x = 20 + k * 39, h = 30 + r() * 30; g.fillStyle = pick(r, ["rgba(200,80,60,0.6)", "rgba(80,170,110,0.6)", "rgba(220,150,70,0.6)", "rgba(90,110,210,0.6)"]); g.fillRect(x, 420 - h, 22, h); }
  g.fillStyle = "rgba(235,245,255,0.16)"; g.beginPath(); g.moveTo(80, 512); g.lineTo(330, 0); g.lineTo(420, 0); g.lineTo(170, 512); g.fill(); g.beginPath(); g.moveTo(560, 512); g.lineTo(720, 0); g.lineTo(750, 0); g.lineTo(590, 512); g.fill();
  for (let k = 0; k < 14; k++) blot(g, r() * 1024, r() < 0.5 ? r() * 40 : 512 - r() * 40, 20 + r() * 30, "rgba(30,25,35,0.3)");
});

export const drugstore = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch();
  const r = rng(1904 + 3);
  const add = (o: THREE.Object3D) => { root.add(o); return o; };
  const noink = <T extends THREE.Object3D>(o: T) => { o.traverse((c) => c.layers.set(NOINK)); return o; };
  const phong = (key: string, p: THREE.MeshPhongMaterialParameters) => lamCustom("drg" + key, () => twoTone(new THREE.MeshPhongMaterial(p)));
  const floorM = lam("drgFloorM", () => ({ map: floorTex() }));
  const wallM = lam("drgWallM", () => ({ map: wallTex() }));
  const ceilM = lam("drgCeilM", () => ({ map: ceilTex() }));
  const walnut = phong("Walnut", { map: woodTex("drgWalnut", "#5e3420", "#2a1208", "#8e5634"), specular: "#ffd0a0", shininess: 30 });
  const walnutD = phong("WalnutD", { map: woodTex("drgWalnutD", "#3e2014", "#1e0a04", "#6a3a22"), specular: "#ffd0a0", shininess: 25 });
  const oak = phong("Oak", { map: woodTex("drgOakT", "#8a5230", "#42200e", "#c08050"), specular: "#ffe0b0", shininess: 40 });
  const backBoards = lam("drgBackBoards", () => ({ map: boardsV("drgShelfBack", "#3a1a0c", 0.62) }));
  const panelBoards = lam("drgPanelBoards", () => ({ map: boardsV("drgPanels", "#5a2a14", 0.5) }));
  const marble = phong("Marble", { map: marbleTex("drgWhite", "#d8d0c6", "#6a6878", "rgba(170,160,180,0.25)"), specular: "#ffffff", shininess: 70 });
  const greenMarble = phong("GreenMarble", { map: marbleTex("drgGreen", "#2c5648", "#d8e8dc", "rgba(20,50,40,0.4)"), specular: "#ffffff", shininess: 60 });
  const brass = brassM(), gold = goldM(), glass = glassM();
  const iron = lam("drgIron", () => ({ color: "#2e2c3a" }));
  const paper = lam("drgPaper", () => ({ color: "#f4ecd6" }));
  const porcelain = phong("Porcelain", { color: "#f2ede2", specular: "#ffffff", shininess: 90 });
  const leather = phong("Leather", { color: "#a0262e", specular: "#ffc0b0", shininess: 40 });
  const labelsM = lam("drgLabelsM", () => ({ map: labelAtlas() }));
  const GLASS: Record<string, string> = { amber: "#c8701a", green: "#2f9a4a", cobalt: "#2a52c8", ruby: "#c0283c", clear: "#bfe0ec" };
  const glassOf = (c: string) => phong("Glass" + c, { color: GLASS[c], emissive: GLASS[c], emissiveIntensity: c === "clear" ? 0.12 : 0.34, specular: "#ffffff", shininess: 120 });
  const cork = lam("drgCork", () => ({ color: "#b08458" }));
  const glints: { s: THREE.Sprite; ph: number; k: number }[] = [];

  // ---------------- shell ----------------
  shell.add(quad(V(X0, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(X0, 0, ZB), (X1 - X0) / 1.6, (ZF - ZB) / 1.6), floorM);
  shell.add(quad(V(X0, H, ZB), V(X1, H, ZB), V(X1, H, ZF), V(X0, H, ZF), (X1 - X0) / 0.6, (ZF - ZB) / 0.6), ceilM);
  shell.add(quad(V(X0, 0, ZB), V(X1, 0, ZB), V(X1, H, ZB), V(X0, H, ZB), (X1 - X0) / 2, 1), wallM);
  shell.add(quad(V(X0, 0, ZF), V(X0, 0, ZB), V(X0, H, ZB), V(X0, H, ZF), (ZF - ZB) / 2, 1), wallM);
  shell.add(quad(V(X1, 0, ZB), V(X1, 0, ZF), V(X1, H, ZF), V(X1, H, ZB), (ZF - ZB) / 2, 1), wallM);
  const grime = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, ZF - ZB).rotateX(-Math.PI / 2), lamCustom("drgGrimeM", () => twoTone(new THREE.MeshLambertMaterial({ map: grimeTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }))));
  grime.position.set(0, 0.002, (ZF + ZB) / 2); grime.receiveShadow = true; noink(grime); add(grime);
  // front wall with the display window, the door (+ transom) and the second window
  const WT = 0.3, W1 = [-5.7, -0.3, 0.75, 3.7], DR = [0.5, 1.6, 0, 3.15], W2 = [2.5, 5.6, 0.95, 3.5];
  const fsh = new THREE.Shape(); fsh.moveTo(X0, 0); fsh.lineTo(X1, 0); fsh.lineTo(X1, H); fsh.lineTo(X0, H); fsh.closePath();
  for (const [a, c, y0, y1] of [W1, DR, W2]) { const p = new THREE.Path(); p.moveTo(a, y0); p.lineTo(c, y0); p.lineTo(c, y1); p.lineTo(a, y1); p.closePath(); fsh.holes.push(p); }
  const fg = new THREE.ExtrudeGeometry(fsh, { depth: WT, bevelEnabled: false }); fg.translate(0, 0, ZF);
  { const p = fg.attributes.position as THREE.BufferAttribute, uv = fg.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 2, p.getY(i) / H); }
  const fwm = new THREE.Mesh(fg, wallM); fwm.receiveShadow = true; add(fwm);
  // cornice + skirting
  for (const [a, c] of [[V(X0, H - 0.22, ZB), V(X1, H, ZB + 0.12)], [V(X0, H - 0.22, ZF - 0.12), V(X1, H, ZF)], [V(X0, H - 0.22, ZB), V(X0 + 0.12, H, ZF)], [V(X1 - 0.12, H - 0.22, ZB), V(X1, H, ZF)]] as [THREE.Vector3, THREE.Vector3][]) b.add(boxGeo(a, c), walnutD);

  // ---------------- back wall, pharmacy: drawer cabinets + shelves of glass ----------------
  const SZ0 = ZB, SZ1 = -2.45, CAB1 = -2.22, CABY = 1.0;
  b.add(boxGeo(V(X0, 0, SZ0), V(1.3, CABY, CAB1), 1.2), walnut);
  b.add(boxGeo(V(X0, CABY, SZ0), V(1.33, CABY + 0.06, CAB1 + 0.04)), marble);
  b.add(boxGeo(V(X0, 0, CAB1), V(1.3, 0.12, CAB1 + 0.02)), walnutD);
  for (let x = X0; x < 1.29; x += 1.5) { const x1 = Math.min(1.3, x + 1.5), w = x1 - x; const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, 0.82), lam("drgDrawM" + Math.round(w * 10), () => ({ map: drawersTex("w" + Math.round(w * 10), Math.max(2, Math.round(w / 0.3)), 4, 768, 420) }))); m.position.set(x + w / 2, 0.55, CAB1 + 0.022); m.receiveShadow = true; add(m); b.add(boxGeo(V(x - 0.02, 0.12, CAB1), V(x + 0.03, CABY, CAB1 + 0.035)), walnutD); }
  // upper shelves: back boards, pilasters, boards, cornice + frieze
  const SH0 = 1.45, SH = 0.42, NSH = 7, PIL = [X0, -4.4, -2.95, -1.5, -0.05, 1.3];
  b.add(quad(V(X0, CABY + 0.06, SZ0 + 0.01), V(1.3, CABY + 0.06, SZ0 + 0.01), V(1.3, 4.3, SZ0 + 0.01), V(X0, 4.3, SZ0 + 0.01), (1.3 - X0) / 1.8, (4.3 - CABY) / 1.8), backBoards);
  for (const x of PIL) { b.add(boxGeo(V(x - (x === X0 ? 0 : 0.06), CABY + 0.06, SZ0), V(x + 0.06, 4.3, SZ1 + 0.04)), walnut); b.add(boxGeo(V(x - 0.09, 4.0, SZ1 - 0.02), V(x + 0.09, 4.12, SZ1 + 0.08)), walnutD); }
  const POSTER_X0 = -6.05, POSTER_X1 = -4.55;
  for (let k = 0; k < NSH; k++) {
    const y = SH0 + k * SH; if (y > 4.2) break;
    if (y < 3.8) { b.add(boxGeo(V(-4.4, y - 0.035, SZ0), V(1.3, y, SZ1)), walnut); b.add(boxGeo(V(-4.4, y - 0.05, SZ1 - 0.01), V(1.3, y, SZ1 + 0.015)), walnutD); }
    else { b.add(boxGeo(V(X0, y - 0.035, SZ0), V(1.3, y, SZ1)), walnut); b.add(boxGeo(V(X0, y - 0.05, SZ1 - 0.01), V(1.3, y, SZ1 + 0.015)), walnutD); }
  }
  b.add(boxGeo(V(X0, 4.3, SZ0), V(1.36, 4.62, SZ1 + 0.1)), walnutD);
  const frieze = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.24), new THREE.MeshBasicMaterial({ map: friezeTex(), color: new THREE.Color(0.85, 0.85, 0.85) })); frieze.position.set(-2.4, 4.46, SZ1 + 0.105); add(frieze);
  // bottles + jars on every board
  const P_ROUND: [number, number][] = [[0, 0], [0.3, 0], [0.33, 0.04], [0.33, 0.58], [0.27, 0.7], [0.12, 0.78], [0.1, 0.9], [0.13, 0.93], [0.12, 0.97], [0, 0.97]];
  const P_TALL: [number, number][] = [[0, 0], [0.21, 0], [0.23, 0.04], [0.23, 0.66], [0.16, 0.74], [0.08, 0.8], [0.08, 0.92], [0.1, 0.95], [0, 0.95]];
  const P_JAR: [number, number][] = [[0, 0], [0.42, 0], [0.45, 0.05], [0.45, 0.72], [0.38, 0.8], [0.3, 0.82], [0.3, 0.88], [0, 0.88]];
  const P_KNOB: [number, number][] = [[0, 0.86], [0.34, 0.86], [0.36, 0.9], [0.2, 0.95], [0.1, 1.0], [0.15, 1.05], [0, 1.1]];
  const P_FLASK: [number, number][] = [[0, 0], [0.4, 0], [0.42, 0.06], [0.4, 0.3], [0.28, 0.48], [0.1, 0.6], [0.09, 0.8], [0.12, 0.84], [0, 0.84]];
  const geoCache = new Map<string, THREE.BufferGeometry>();
  const lg = (key: string, pts: [number, number][], segs: number) => { let gg = geoCache.get(key); if (!gg) { gg = lathe(pts, segs); if (segs === 4) gg.rotateY(Math.PI / 4); geoCache.set(key, gg); } return gg; };
  const COLS = ["amber", "green", "cobalt", "ruby", "clear", "amber", "cobalt", "green"];
  let li = 0;
  /** one bottle / jar at (x, y, z), height h; returns its width */
  const bottle = (kind: number, col: string, x: number, y: number, z: number, h: number, label: boolean) => {
    const m4 = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(h, h, h));
    let maxR = 0.33;
    if (kind === 0) { b.add(lg("round", P_ROUND, 12), glassOf(col), m4); b.add(new THREE.CylinderGeometry(0.1, 0.09, 0.08, 8).translate(0, 0.99, 0), cork, m4); }
    if (kind === 1) { b.add(lg("tall4", P_TALL, 4), glassOf(col), m4); b.add(new THREE.CylinderGeometry(0.07, 0.065, 0.08, 8).translate(0, 0.97, 0), cork, m4); maxR = 0.23 * 0.72; }
    if (kind === 2) { b.add(lg("jar", P_JAR, 14), porcelain, m4); b.add(lg("knob", P_KNOB, 14), porcelain, m4); b.add(new THREE.CylinderGeometry(0.455, 0.455, 0.06, 14).translate(0, 0.62, 0), col === "ruby" ? lam("drgBandR", () => ({ color: "#8a2230" })) : lam("drgBandB", () => ({ color: "#2a4a9a" })), m4); maxR = 0.45; }
    if (kind === 3) { b.add(lg("jarG", P_JAR, 14), glassOf(col), m4); b.add(lg("knobG", P_KNOB, 14), glassOf(col), m4); maxR = 0.45; }
    if (kind === 4) { b.add(lg("flask", P_FLASK, 12), glassOf(col), m4); b.add(new THREE.CylinderGeometry(0.11, 0.1, 0.07, 8).translate(0, 0.86, 0), cork, m4); maxR = 0.42; }
    if (label) { const lh = h * (kind === 2 ? 0.3 : 0.26), lw = Math.min(h * maxR * 1.5, lh * 1.25); b.add(atlasUV(new THREE.PlaneGeometry(lw, lh), li++ % 32).translate(x, y + h * (kind === 4 ? 0.18 : 0.36), z + h * maxR + 0.004), labelsM); }
    if (kind !== 2 && r() < 0.12) { const s = glow(root, [x + h * maxR * 0.4, y + h * 0.5, z + h * maxR + 0.01], GLASS[col], 0.16 + r() * 0.1, 0.55); glints.push({ s, ph: r() * 10, k: s.material.opacity }); }
    return 2 * maxR * h;
  };
  const fillRow = (x0: number, x1: number, y: number, z: number, maxH: number) => {
    const uniform = r() < 0.6, kind0 = pick(r, [0, 1, 2, 3, 4, 0, 1]), col0 = pick(r, COLS), h0 = Math.min(maxH, 0.2 + r() * 0.12);
    let x = x0 + 0.04 + r() * 0.04;
    while (true) {
      const kind = uniform ? kind0 : pick(r, [0, 1, 2, 3, 4, 0, 1, 1]), col = uniform ? col0 : pick(r, COLS);
      const h = uniform ? h0 : Math.min(maxH, 0.16 + r() * 0.16), w = 2 * (kind === 2 || kind === 3 ? 0.45 : kind === 4 ? 0.42 : kind === 1 ? 0.166 : 0.33) * h;
      if (x + w > x1 - 0.03) break;
      if (!uniform && r() < 0.06) { x += 0.1; continue; } // a gap where a bottle was taken
      bottle(kind, col, x + w / 2, y, z + (r() - 0.5) * 0.03, h, kind !== 4 || r() < 0.5);
      x += w + (uniform ? 0.025 : 0.015 + r() * 0.03);
    }
  };
  for (let k = 0; k < NSH; k++) {
    const y = SH0 + k * SH; if (y > 4.2) break;
    for (let i = 0; i < PIL.length - 1; i++) { if (PIL[i] === X0 && y < 3.8) continue; fillRow(PIL[i] + 0.06, PIL[i + 1] - 0.06, y, -2.62, 0.34); }
  }
  // on the cabinet top: big carboys, jars, a brass mortar, a stack of ledgers
  for (const [x, kind, col, h] of [[-4.2, 3, "green", 0.36], [-3.6, 2, "cobalt", 0.3], [-2.6, 4, "ruby", 0.34], [-1.1, 2, "ruby", 0.3], [-0.5, 3, "amber", 0.34], [0.5, 4, "cobalt", 0.32], [1.0, 2, "cobalt", 0.28]] as [number, number, string, number][]) bottle(kind, col, x, CABY + 0.06, -2.55, h, true);
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(-2.0, CABY + 0.06 + k * 0.05, -2.7), V(-1.66 - (k % 2) * 0.03, CABY + 0.105 + k * 0.05, -2.42)), lam("drgLedger" + (k % 3), () => ({ color: ["#6a2a2a", "#2a4a3a", "#3a3058"][k % 3] })));
  b.add(lathe([[0, 0], [0.09, 0], [0.12, 0.08], [0.11, 0.12], [0.08, 0.1], [0, 0.06]], 14).translate(0.0, CABY + 0.06, -2.55), brass);
  // back-room doorway (x 1.3..2.3) with a velvet curtain under the wall clock
  b.add(boxGeo(V(1.3, 0, ZB), V(1.42, 2.6, ZB + 0.18)), walnut); b.add(boxGeo(V(2.18, 0, ZB), V(2.3, 2.6, ZB + 0.18)), walnut); b.add(boxGeo(V(1.3, 2.6, ZB), V(2.3, 2.75, ZB + 0.2)), walnutD);
  b.add(boxGeo(V(1.42, 0, ZB - 0.01), V(2.18, 2.6, ZB + 0.005)), basicNoInk("#1c1428"));
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 2.55, 10, 1), lamCustom("drgCurtainM", () => twoTone(new THREE.MeshLambertMaterial({ map: curtainTex(), side: THREE.DoubleSide }))));
  curtain.position.set(1.8, 1.3, ZB + 0.1); add(curtain); const curtBase = (curtain.geometry.attributes.position.array as Float32Array).slice();
  const clockG = new THREE.Group(); clockG.position.set(1.8, 3.45, ZB + 0.08); add(clockG);
  { const cb = new Batch(); cb.add(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 32).rotateX(Math.PI / 2), walnutD); cb.add(new THREE.TorusGeometry(0.31, 0.022, 6, 32).translate(0, 0, 0.055), brass); cb.build(clockG);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({ map: dialTex("drgClock", "#f4ecd6"), color: new THREE.Color(0.9, 0.88, 0.82) })); face.position.z = 0.052; clockG.add(face); }
  const handsG = new THREE.Group(); handsG.position.z = 0.054; clockG.add(handsG); const setClock = clockHands(handsG, 0.28, 0.002);
  // rolling ladder on a brass rail
  b.add(boxGeo(V(X0, 4.1, SZ1 + 0.03), V(1.3, 4.13, SZ1 + 0.07)), brass);
  for (const s of [-1, 1]) seg(b, V(-2.2 + s * 0.22, 4.12, -2.38), V(-2.2 + s * 0.25, 0, -1.62), 0.025, oak, 6);
  for (let k = 1; k < 12; k++) { const u = k / 12; b.add(new THREE.CylinderGeometry(0.014, 0.014, 0.48, 6).rotateZ(Math.PI / 2).translate(-2.2, lerp(0, 4.12, 1 - u), lerp(-1.62, -2.38, 1 - u)), oak); }
  b.add(new THREE.TorusGeometry(0.03, 0.008, 6, 10).translate(-2.42, 4.13, -2.4), brass); b.add(new THREE.TorusGeometry(0.03, 0.008, 6, 10).translate(-1.98, 4.13, -2.4), brass);
  // the poster bay (x -6.05..-4.55)
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(POSTER_X1 - POSTER_X0 - 0.08, 2.1), lam("drgPosterM", () => ({ map: posterTex() }))); poster.position.set((POSTER_X0 + POSTER_X1) / 2, 2.6, SZ0 + 0.04); poster.receiveShadow = true; add(poster);
  const boltOv = new THREE.Mesh(new THREE.PlaneGeometry(POSTER_X1 - POSTER_X0 - 0.08, 2.1), new THREE.MeshBasicMaterial({ map: boltTex(), color: new THREE.Color(1.6, 1.4, 0.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); boltOv.position.set((POSTER_X0 + POSTER_X1) / 2, 2.6, SZ0 + 0.045); noink(boltOv); add(boltOv);
  const boltGlow = glow(root, [(POSTER_X0 + POSTER_X1) / 2, 2.62, SZ0 + 0.3], "#ffe27a", 2.4, 0.0);
  for (const [a, c] of [[V(POSTER_X0, 1.5, SZ0), V(POSTER_X1, 1.55, SZ0 + 0.07)], [V(POSTER_X0, 3.65, SZ0), V(POSTER_X1, 3.7, SZ0 + 0.07)], [V(POSTER_X0, 1.5, SZ0), V(POSTER_X0 + 0.05, 3.7, SZ0 + 0.07)], [V(POSTER_X1 - 0.05, 1.5, SZ0), V(POSTER_X1, 3.7, SZ0 + 0.07)]] as [THREE.Vector3, THREE.Vector3][]) b.add(boxGeo(a, c), gold);
  // wall sconce left end (gas, glass tulip)
  const sconces: THREE.Object3D[] = [];
  const sconce = (pos: V3, yaw: number) => {
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; add(g); const sb = new Batch();
    sb.add(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14).rotateX(Math.PI / 2), brass); seg(sb, V(0, 0, 0), V(0, 0.05, 0.25), 0.012, brass, 6); sb.add(new THREE.CylinderGeometry(0.02, 0.03, 0.06, 10).translate(0, 0.08, 0.25), brass); sb.build(g);
    const tul = new THREE.Mesh(lathe([[0.03, 0], [0.09, 0.06], [0.11, 0.16], [0.1, 0.2], [0.0, 0.2]], 14).translate(0, 0.1, 0.25), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.5, 1.0), side: THREE.DoubleSide })); noink(tul); g.add(tul);
    const gl = glow(g, [0, 0.2, 0.25], "#ffc87a", 1.0, 0.9); const L = new THREE.PointLight("#ffbf70", 4, 4.5, 1.3); L.position.set(0, 0.2, 0.35); g.add(L);
    g.userData = { light: L, glow: gl, base: 4, seed: pos[0] + pos[2] * 3 }; sconces.push(g);
  };
  sconce([X0 + 0.02, 2.3, 1.0], Math.PI / 2); sconce([X1 - 0.02, 2.3, 1.0], -Math.PI / 2);

  // ---------------- the pharmacy counter ----------------
  const CF = CZ1 - 0.03; // front face
  b.add(boxGeo(V(PX0, 0.12, CZ0), V(-0.45, CY - 0.05, CF), 1.2), walnut);
  b.add(boxGeo(V(PX0, 0, CZ0 + 0.05), V(PX1, 0.12, CF - 0.04)), walnutD);
  b.add(boxGeo(V(PX0 - 0.04, CY - 0.05, CZ0 - 0.02), V(PX1 + 0.04, CY, CZ1 + 0.03)), marble);
  // raised front panels
  for (let x = PX0 + 0.06; x < -0.55; x += 0.74) { const x1 = Math.min(x + 0.66, -0.5); b.add(quad(V(x, 0.2, CF + 0.003), V(x1, 0.2, CF + 0.003), V(x1, 0.88, CF + 0.003), V(x, 0.88, CF + 0.003), 0.4, 0.4), panelBoards); for (const [a, c] of [[V(x, 0.2, CF), V(x1, 0.25, CF + 0.03)], [V(x, 0.83, CF), V(x1, 0.88, CF + 0.03)], [V(x, 0.2, CF), V(x + 0.05, 0.88, CF + 0.03)], [V(x1 - 0.05, 0.2, CF), V(x1, 0.88, CF + 0.03)]] as [THREE.Vector3, THREE.Vector3][]) b.add(boxGeo(a, c), walnutD); }
  b.add(boxGeo(V(PX0, 0.92, CF), V(PX1, 0.95, CF + 0.03)), brass);
  seg(b, V(PX0 + 0.1, 0.18, CZ1 + 0.13), V(PX1 - 0.1, 0.18, CZ1 + 0.13), 0.018, brass, 8);
  for (let x = PX0 + 0.3; x < PX1; x += 1.2) seg(b, V(x, 0.18, CZ1 + 0.13), V(x, 0.12, CF + 0.01), 0.012, brass, 6);
  // glass showcase x -0.45..1.3 (frame, glass front + top band, shelf with goods, a warm inner glow)
  b.add(boxGeo(V(-0.45, 0.12, CZ0), V(PX1, 0.3, CF)), walnut); b.add(boxGeo(V(-0.45, 0.3, CZ0), V(PX1, CY - 0.05, CZ0 + 0.04)), backBoards);
  for (const x of [-0.45, 0.42, PX1 - 0.04]) b.add(boxGeo(V(x, 0.3, CF - 0.04), V(x + 0.05, CY - 0.05, CF)), walnutD);
  b.add(boxGeo(V(-0.45, 0.62, CZ0 + 0.04), V(PX1, 0.635, CF - 0.04)), glass);
  const glassFront = new THREE.Mesh(new THREE.PlaneGeometry(PX1 + 0.45, CY - 0.35), glass); glassFront.position.set((PX1 - 0.45) / 2, (CY + 0.25) / 2, CF - 0.01); add(glassFront);
  for (let k = 0; k < 9; k++) { const x = -0.36 + k * 0.18; const kind = k % 3; if (kind === 0) b.add(boxGeo(V(x, 0.3, -1.0), V(x + 0.12, 0.38, -0.85)), lam("drgSoap" + (k % 2), () => ({ color: k % 2 ? "#e89ab0" : "#9ad0e8" }))); if (kind === 1) b.add(lathe([[0, 0], [0.04, 0], [0.045, 0.06], [0.015, 0.09], [0.015, 0.12], [0, 0.12]], 10).translate(x + 0.05, 0.3, -0.95), glassOf(pick(r, ["ruby", "cobalt", "green"]))); if (kind === 2) b.add(boxGeo(V(x, 0.635, -1.05), V(x + 0.14, 0.66, -0.9)), lam("drgComb", () => ({ color: "#3a2a20" }))); }
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-0.4 + k * 0.28, 0.635, -0.95), V(-0.28 + k * 0.28, 0.72, -0.82)), lam("drgBox" + (k % 3), () => ({ color: ["#d8c08a", "#6a8ab0", "#b06a6a"][k % 3] })));
  const caseGlow = glow(root, [0.4, 0.55, -0.85], "#ffcf86", 1.3, 0.4);
  // counter flap / pass-through cap at x 1.3
  b.add(boxGeo(V(PX1 - 0.06, 0.12, CZ0), V(PX1, CY - 0.05, CF)), walnutD);

  // ---- counter props ----
  // tonic display: three stepped tiers of PEP-O-LIGHTNING bottles + a little standee card
  const tonicLbl = lam("drgTonicLblM", () => ({ map: tonicLabelTex() }));
  { const tx = -4.33, tz = -0.95;
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(tx - 0.3 + k * 0.03, CY, tz - 0.27 + k * 0.1), V(tx + 0.3 - k * 0.03, CY + 0.06 + k * 0.12, tz + 0.27 - k * 0.0)), k % 2 ? walnut : oak);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 4 - k; i++) {
      const x = tx - 0.21 + k * 0.07 + i * 0.14, y = CY + 0.06 + k * 0.12, z = tz + 0.18 - k * 0.1 + 0.0;
      b.add(boxGeo(V(x - 0.045, y, z - 0.03), V(x + 0.045, y + 0.17, z + 0.03)), glassOf("amber"));
      b.add(new THREE.CylinderGeometry(0.018, 0.03, 0.05, 8).translate(x, y + 0.195, z), glassOf("amber")); b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 8).translate(x, y + 0.23, z), lam("drgRedCap", () => ({ color: "#b8202a" })));
      b.add(new THREE.PlaneGeometry(0.076, 0.095).translate(x, y + 0.085, z + 0.032), tonicLbl);
      if (r() < 0.5) { const s = glow(root, [x + 0.025, y + 0.11, z + 0.04], "#ffb050", 0.14, 0.5); glints.push({ s, ph: r() * 10, k: s.material.opacity }); }
    }
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), lam("drgCardM", () => ({ map: ctex("drgCard", 340, 200, (g) => { g.fillStyle = "#c2302e"; g.fillRect(0, 0, 340, 200); g.strokeStyle = "#ffd84a"; g.lineWidth = 8; g.strokeRect(6, 6, 328, 188); g.fillStyle = "#ffd84a"; center(g); fitText(g, "PEP-O-LIGHTNING", 170, 70, 300, 40, "900 %spx Georgia, serif"); g.fillStyle = "#f6efdc"; fitText(g, "ONLY 25¢", 170, 140, 240, 40, "900 %spx Georgia, serif"); }) })));
    card.position.set(tx, CY + 0.48, tz - 0.12); card.rotation.x = -0.1; add(card); b.add(boxGeo(V(tx - 0.01, CY + 0.38, tz - 0.16), V(tx + 0.01, CY + 0.58, tz - 0.13)), walnutD); }
  // brass cash register
  { const g = new THREE.Group(); g.position.set(-3.0, CY, -1.0); add(g); const rb = new Batch(); const regM = phong("Register", { map: registerTex(), specular: "#fff0c0", shininess: 70, emissive: "#3a2400", emissiveIntensity: 0.3 });
    rb.add(boxGeo(V(-0.24, 0, -0.2), V(0.24, 0.12, 0.2)), walnut); rb.add(boxGeo(V(-0.22, 0.12, -0.18), V(0.22, 0.42, 0.05)), regM);
    rb.add(new THREE.BoxGeometry(0.44, 0.03, 0.2).rotateX(0.5).translate(0, 0.2, 0.12), regM);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const x = -0.18 + i * 0.072, z = 0.06 + j * 0.05, y = 0.19 + (0.1 - j * 0.05) * 0.55; rb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8).translate(x, y, z), brass); rb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 12).translate(x, y + 0.03, z), porcelain); }
    rb.add(boxGeo(V(-0.17, 0.42, -0.12), V(0.17, 0.56, 0.0)), regM); rb.add(lathe([[0, 0], [0.12, 0], [0.04, 0.05], [0.02, 0.1], [0.04, 0.12], [0, 0.13]], 12).translate(0, 0.56, -0.06), gold);
    seg(rb, V(0.22, 0.2, -0.05), V(0.32, 0.2, -0.05), 0.012, brass, 6); seg(rb, V(0.32, 0.2, -0.05), V(0.32, 0.08, 0.02), 0.012, brass, 6); rb.add(new THREE.SphereGeometry(0.025, 8, 6).translate(0.32, 0.07, 0.03), walnutD);
    rb.add(boxGeo(V(-0.2, 0.01, 0.2), V(0.2, 0.1, 0.22)), walnutD); rb.build(g);
    const amt = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.075), new THREE.MeshBasicMaterial({ map: amountTex(), color: new THREE.Color(0.9, 0.88, 0.82) })); amt.position.set(0, 0.49, 0.002); g.add(amt); }
  // RAT-B-GONE tin + powder packets + a spoon
  { const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.13, 24).rotateY(Math.PI), lam("drgRatTinM", () => ({ map: ratTinTex() }))); tin.position.set(-2.05, CY + 0.065, -0.98); tin.rotation.y = 0.15; tin.castShadow = true; add(tin);
    b.add(new THREE.CylinderGeometry(0.064, 0.064, 0.02, 24).translate(-2.05, CY + 0.14, -0.98), lam("drgTinLid", () => ({ color: "#2a2430" })));
    for (let k = 0; k < 6; k++) { const x = -2.0 + (k % 3) * 0.075 - 0.05, z = -0.74 - Math.floor(k / 3) * 0.07, y = CY + 0.004 + (k % 2) * 0.004; b.add(new THREE.BoxGeometry(0.06, 0.008, 0.045).rotateY((r() - 0.5) * 0.6).translate(x + 0.15, y, z), paper); }
    b.add(new THREE.PlaneGeometry(0.11, 0.11).rotateX(-Math.PI / 2).rotateY(0.3).translate(-1.72, CY + 0.003, -0.68), paper);
    b.add(new THREE.ConeGeometry(0.025, 0.015, 10).translate(-1.72, CY + 0.011, -0.68), lam("drgPowder", () => ({ color: "#fbf8f0" })));
    seg(b, V(-1.95, CY + 0.006, -1.12), V(-1.78, CY + 0.012, -1.18), 0.005, lam("drgSilver", () => ({ color: "#c8ccd6" })), 5); }
  // THE SCALE (centre on the counter at x -1.45): base, pillar, beam (rotates), two pans on hangers, pointer + dial
  const SCX = -1.45, SCZ = -0.95, PIV = 0.46, ARM = 0.27, HANG = 0.34;
  const scaleG = new THREE.Group(); scaleG.position.set(SCX, CY, SCZ); add(scaleG);
  { const sb = new Batch();
    sb.add(boxGeo(V(-0.36, 0, -0.14), V(0.36, 0.035, 0.14)), walnutD); sb.add(boxGeo(V(-0.34, 0.035, -0.12), V(0.34, 0.05, 0.12)), greenMarble);
    sb.add(lathe([[0, 0], [0.07, 0], [0.07, 0.02], [0.04, 0.05], [0.025, 0.08], [0.022, PIV - 0.06], [0.04, PIV - 0.03], [0.02, PIV], [0, PIV]], 14).translate(0, 0.05, 0), brass);
    sb.add(new THREE.RingGeometry(0.11, 0.17, 24, 1, Math.PI * 1.3, Math.PI * 0.4).translate(0, PIV + 0.05, 0.03), lam("drgDial", () => ({ color: "#f4ecd6", side: THREE.DoubleSide })));
    for (let k = -4; k <= 4; k++) { const a = -Math.PI / 2 + k * 0.07; sb.add(new THREE.BoxGeometry(0.004, 0.025, 0.004).rotateZ(a + Math.PI / 2).translate(Math.cos(a) * 0.155, PIV + 0.05 + Math.sin(a) * 0.155, 0.034), iron); }
    sb.build(scaleG); }
  const beam = new THREE.Group(); beam.position.set(0, PIV + 0.05, 0); scaleG.add(beam);
  { const bb = new Batch(); bb.add(new THREE.BoxGeometry(ARM * 2 + 0.04, 0.022, 0.022), brass); bb.add(new THREE.SphereGeometry(0.028, 10, 8), gold);
    for (const s of [-1, 1]) bb.add(new THREE.SphereGeometry(0.018, 8, 6).translate(s * ARM, 0, 0), gold);
    bb.add(new THREE.BoxGeometry(0.008, 0.17, 0.006).translate(0, -0.085, 0.04), lam("drgNeedle", () => ({ color: "#2a1a14" }))); bb.build(beam); }
  const pans = [-1, 1].map((s) => {
    const p = new THREE.Group(); p.position.set(s * ARM, 0, 0); beam.add(p); const pb = new Batch();
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 0.5; seg(pb, V(0, 0, 0), V(Math.cos(a) * 0.1, -HANG + 0.02, Math.sin(a) * 0.1), 0.0035, brass, 4); }
    pb.add(lathe([[0, 0], [0.12, 0.0], [0.125, 0.02], [0.115, 0.022], [0, 0.006]], 20).translate(0, -HANG, 0), brass); pb.build(p);
    return p;
  });
  // left pan: a brass weight; right pan: the pinch heap
  { const wb = new Batch(); wb.add(lathe([[0, 0], [0.03, 0], [0.03, 0.04], [0.012, 0.05], [0.012, 0.065], [0.02, 0.07], [0, 0.075]], 12).translate(0, -HANG + 0.006, 0), gold); wb.build(pans[0]); }
  const heap = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.022, 14).translate(0, 0.011, 0), lam("drgPowder", () => ({ color: "#fbf8f0" }))); heap.position.set(0, -HANG + 0.006, 0); heap.castShadow = true; pans[1].add(heap);
  const scalePuffs = [0, 1, 2].map((i) => puff(root, [SCX + ARM - 0.02 + i * 0.03, CY + 0.12, SCZ + 0.02], 0.2, "#f6f2ea", 0.0));
  // mortar + pestle, magnifying glass, candy jars, rx book + inkwell
  { b.add(lathe([[0, 0], [0.06, 0], [0.065, 0.02], [0.1, 0.06], [0.11, 0.11], [0.1, 0.12], [0.085, 0.07], [0, 0.04]], 18).translate(-0.4, CY, -0.98), porcelain);
    seg(b, V(-0.42, CY + 0.06, -0.98), V(-0.32, CY + 0.25, -1.04), 0.016, porcelain, 8); b.add(new THREE.SphereGeometry(0.026, 10, 8).translate(-0.42, CY + 0.06, -0.98), porcelain);
    const mg = new THREE.Group(); mg.position.set(0.05, CY, -1.02); add(mg); const mb = new Batch();
    mb.add(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 18).translate(0, 0.012, 0), brass); seg(mb, V(0, 0.02, 0), V(0, 0.22, 0), 0.008, brass, 6); seg(mb, V(0, 0.22, 0), V(0.06, 0.3, 0.04), 0.007, brass, 6);
    mb.add(new THREE.TorusGeometry(0.075, 0.009, 8, 24).rotateY(0.5).rotateX(-0.25).translate(0.09, 0.36, 0.06), brass); mb.build(mg);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.072, 24).rotateY(0.5).rotateX(-0.25).translate(0.09, 0.36, 0.06), new THREE.MeshBasicMaterial({ color: "#bfe4ff", transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); noink(lens); mg.add(lens);
    const lg2 = glow(mg, [0.07, 0.38, 0.09], "#ffffff", 0.06, 0.6); void lg2;
    for (const [x, col] of [[0.62, "#e83a4a"], [0.86, "#f2c230"], [1.1, "#3aa36a"]] as [number, string][]) {
      b.add(lathe([[0, 0], [0.07, 0], [0.075, 0.02], [0.075, 0.2], [0.06, 0.22], [0.06, 0.24], [0, 0.24]], 16).translate(x, CY, -1.1), glass);
      for (let k = 0; k < 9; k++) b.add(new THREE.CylinderGeometry(0.007, 0.007, 0.17, 6).rotateZ((r() - 0.5) * 0.4).translate(x + (r() - 0.5) * 0.08, CY + 0.1, -1.1 + (r() - 0.5) * 0.08), lam("drgCandy" + col, () => ({ color: col })));
      b.add(lathe([[0, 0], [0.065, 0], [0.065, 0.02], [0.02, 0.04], [0.02, 0.06], [0, 0.06]], 16).translate(x, CY + 0.24, -1.1), glass);
    }
    b.add(boxGeo(V(0.35, CY, -1.25), V(0.58, CY + 0.05, -1.08)), lam("drgRxBook", () => ({ color: "#2a3a5a" }))); b.add(boxGeo(V(0.355, CY + 0.05, -1.245), V(0.575, CY + 0.052, -1.085)), paper);
  }

  // ---------------- soda fountain ----------------
  // back bar: cabinet, mirror between columns, syrup shelf, sign, menu, coffee urn
  b.add(boxGeo(V(2.3, 0, ZB), V(X1, 1.0, -2.25), 1.2), walnut); b.add(boxGeo(V(2.3, 1.0, ZB), V(X1, 1.06, -2.2)), marble);
  for (let x = 2.45; x < X1 - 0.3; x += 0.95) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), greenMarble); m.position.set(x + 0.4, 0.55, -2.245); add(m); b.add(boxGeo(V(x + 0.38, 0.62, -2.25), V(x + 0.42, 0.64, -2.22)), brass); }
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.5), new THREE.MeshBasicMaterial({ map: mirrorTex(), color: new THREE.Color(0.85, 0.85, 0.95) })); mir.position.set(4.3, 2.0, ZB + 0.03); add(mir);
  for (const [a, c] of [[V(2.5, 2.74, ZB), V(6.1, 2.8, ZB + 0.08)], [V(2.5, 1.25, ZB), V(6.1, 1.3, ZB + 0.08)]] as [THREE.Vector3, THREE.Vector3][]) b.add(boxGeo(a, c), gold);
  for (const x of [2.55, 6.05]) { b.add(lathe([[0.1, 0], [0.1, 0.1], [0.07, 0.15], [0.065, 1.6], [0.1, 1.68], [0.1, 1.74], [0, 1.74]], 14).translate(x, 1.06, ZB + 0.12), walnut); }
  b.add(boxGeo(V(2.4, 2.8, ZB), V(6.2, 2.9, -2.45)), walnutD); b.add(boxGeo(V(2.4, 1.2, ZB), V(6.2, 1.25, -2.62)), walnutD);
  const fs = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.52), new THREE.MeshBasicMaterial({ map: fountainSignTex(), color: new THREE.Color(0.9, 0.9, 0.9) })); fs.position.set(4.3, 3.45, ZB + 0.06); add(fs);
  b.add(boxGeo(V(2.95, 3.15, ZB), V(5.65, 3.75, ZB + 0.05)), walnutD);
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.88), lam("drgMenuM", () => ({ map: menuTex() }))); menu.position.set(X1 - 0.03, 2.2, -1.75); menu.rotation.y = -Math.PI / 2; add(menu);
  // syrup jars on the shelf above the mirror (glowing colours) + glasses on the back bar
  for (let k = 0; k < 11; k++) bottle(k % 3 === 2 ? 4 : 3, pick(r, ["ruby", "green", "amber", "ruby", "cobalt"]), 2.75 + k * 0.32, 2.9, -2.62, 0.3, k % 2 === 0);
  for (let k = 0; k < 14; k++) { const x = 2.8 + k * 0.17; if (x > 4.75 && x < 5.85) continue; b.add(lathe([[0, 0], [0.04, 0], [0.025, 0.02], [0.012, 0.06], [0.05, 0.14], [0.055, 0.17], [0, 0.17]], 12).translate(x, 1.06, -2.4 + (k % 2) * 0.08), glass); }
  // coffee urn
  const urnX = 5.72;
  { b.add(lathe([[0, 0], [0.16, 0], [0.16, 0.05], [0.2, 0.1], [0.21, 0.5], [0.19, 0.58], [0.12, 0.64], [0.08, 0.66], [0.1, 0.7], [0.03, 0.78], [0, 0.8]], 20).translate(urnX, 1.06, -2.5), brass);
    b.add(new THREE.TorusGeometry(0.21, 0.015, 6, 24).rotateX(Math.PI / 2).translate(urnX, 1.36, -2.5), gold);
    seg(b, V(urnX, 1.2, -2.3), V(urnX, 1.2, -2.18), 0.016, brass, 6); seg(b, V(urnX, 1.2, -2.18), V(urnX, 1.14, -2.16), 0.012, brass, 6);
    for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI).rotateY(Math.PI / 2).translate(urnX + s * 0.22, 1.45, -2.5), walnutD); }
  const steam = [0, 1, 2, 3].map((i) => puff(root, [urnX, 1.9 + i * 0.01, -2.5], 0.24, "#e8eef8", 0.32));
  // front bar
  const FF = CZ1 - 0.03;
  b.add(boxGeo(V(FX0, 0.12, CZ0), V(FX1, CY - 0.05, FF), 1.2), walnut); b.add(boxGeo(V(FX0, 0, CZ0 + 0.05), V(FX1, 0.12, FF - 0.04)), walnutD);
  b.add(boxGeo(V(FX0 - 0.04, CY - 0.05, CZ0 - 0.02), V(FX1 + 0.04, CY, CZ1 + 0.03)), marble);
  for (let x = FX0 + 0.08; x < FX1 - 0.4; x += 0.7) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.62), greenMarble); m.position.set(x + 0.31, 0.55, FF + 0.004); add(m); b.add(boxGeo(V(x - 0.02, 0.15, FF), V(x + 0.03, 0.95, FF + 0.035)), marble); }
  b.add(boxGeo(V(FX1 - 0.05, 0.15, FF), V(FX1, 0.95, FF + 0.035)), marble);
  b.add(boxGeo(V(FX0, 0.92, FF), V(FX1, 0.95, FF + 0.03)), brass); seg(b, V(FX0 + 0.1, 0.18, CZ1 + 0.13), V(FX1 - 0.1, 0.18, CZ1 + 0.13), 0.018, brass, 8);
  // tap tower (x 3.2): column, dome, four curved tap arms
  const TX = 3.2, TZ = -1.0;
  { b.add(lathe([[0.12, 0], [0.12, 0.04], [0.08, 0.08], [0.06, 0.35], [0.09, 0.4], [0.1, 0.45], [0.06, 0.52], [0.02, 0.6], [0.04, 0.63], [0, 0.66]], 16).translate(TX, CY, TZ), brass);
    b.add(new THREE.SphereGeometry(0.03, 10, 8).translate(TX, CY + 0.68, TZ), gold);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + Math.PI / 4, dx = Math.cos(a), dz = Math.sin(a); seg(b, V(TX + dx * 0.06, CY + 0.32, TZ + dz * 0.06), V(TX + dx * 0.16, CY + 0.36, TZ + dz * 0.16), 0.014, brass, 6); seg(b, V(TX + dx * 0.16, CY + 0.36, TZ + dz * 0.16), V(TX + dx * 0.18, CY + 0.28, TZ + dz * 0.18), 0.012, brass, 6); seg(b, V(TX + dx * 0.16, CY + 0.37, TZ + dz * 0.16), V(TX + dx * 0.16, CY + 0.46, TZ + dz * 0.16), 0.009, walnutD, 5); }
    for (let k = 0; k < 4; k++) { const x = 2.65 + k * 0.13; b.add(lathe([[0, 0], [0.045, 0], [0.05, 0.16], [0.03, 0.18], [0, 0.18]], 12).translate(x, CY, -1.2), glassOf(["ruby", "amber", "green", "ruby"][k])); seg(b, V(x, CY + 0.18, -1.2), V(x, CY + 0.3, -1.2), 0.008, brass, 5); b.add(new THREE.SphereGeometry(0.018, 8, 6).translate(x, CY + 0.31, -1.2), porcelain); }
    b.add(lathe([[0, 0], [0.04, 0], [0.04, 0.16], [0, 0.16]], 12).translate(2.62, CY, -0.85), glass);
    for (let k = 0; k < 10; k++) seg(b, V(2.62 + (r() - 0.5) * 0.04, CY + 0.02, -0.85 + (r() - 0.5) * 0.04), V(2.62 + (r() - 0.5) * 0.14, CY + 0.26, -0.85 + (r() - 0.5) * 0.1), 0.004, lam("drgStraw", () => ({ color: "#f2ead2" })), 4); }
  // cups: the coffee customer's cups (x 3.9) + the stacked tower (x 4.6); each cup = saucer + cup + handle (rattles)
  const cupM = porcelain, coffeeM = lam("drgCoffee", () => ({ color: "#4a2a18" })), rimM = lam("drgRim", () => ({ color: "#2a6a8a" }));
  const cups: { g: THREE.Group; base: THREE.Vector3; ph: number; k: number }[] = [];
  const cup = (x: number, y: number, z: number, full: boolean, yaw: number, k = 1) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; add(g); const cb = new Batch();
    cb.add(lathe([[0, 0], [0.065, 0.0], [0.075, 0.012], [0.072, 0.016], [0.04, 0.008], [0, 0.008]], 18), cupM); cb.add(new THREE.TorusGeometry(0.073, 0.003, 4, 18).rotateX(Math.PI / 2).translate(0, 0.013, 0), rimM);
    cb.add(lathe([[0, 0.012], [0.03, 0.012], [0.042, 0.03], [0.047, 0.075], [0.044, 0.078], [0.04, 0.07], [0, 0.02]], 16), cupM); cb.add(new THREE.TorusGeometry(0.046, 0.003, 4, 16).rotateX(Math.PI / 2).translate(0, 0.068, 0), rimM);
    cb.add(new THREE.TorusGeometry(0.018, 0.005, 5, 10, Math.PI * 1.3).rotateZ(-Math.PI * 0.65).translate(0.05, 0.048, 0), cupM);
    if (full) cb.add(new THREE.CircleGeometry(0.04, 16).rotateX(-Math.PI / 2).translate(0, 0.066, 0), coffeeM);
    cb.build(g); cups.push({ g, base: g.position.clone(), ph: r() * 10, k }); return g;
  };
  cup(3.9, CY, -0.78, true, 0.3); cup(3.68, CY, -0.85, false, -0.4, 0.8); cup(4.12, CY, -0.9, false, 1.1, 0.8);
  { const g = cup(3.6, CY, -1.02, false, 0.6, 0.7); void g; }
  const spoon = new THREE.Group(); spoon.position.set(3.97, CY + 0.016, -0.74); add(spoon); { const sb = new Batch(); seg(sb, V(0, 0, 0), V(0.08, 0.005, 0.03), 0.004, lam("drgSilver", () => ({ color: "#c8ccd6" })), 5); sb.add(new THREE.SphereGeometry(0.012, 8, 6).scale(1, 0.4, 0.7).translate(0, 0.002, 0), lam("drgSilver", () => ({ color: "#c8ccd6" }))); sb.build(spoon); }
  for (let k = 0; k < 9; k++) cup(4.6 + (r() - 0.5) * 0.012, CY + k * 0.07, -0.98 + (r() - 0.5) * 0.012, false, r() * TAU, 0.9 + k * 0.08);
  const cupSteam = [0, 1, 2].map((i) => puff(root, [3.9, CY + 0.1 + i * 0.01, -0.78], 0.12, "#f2f4fa", 0.38));
  b.add(lathe([[0, 0], [0.05, 0], [0.06, 0.04], [0.055, 0.07], [0.02, 0.09], [0.025, 0.1], [0, 0.11]], 14).translate(4.2, CY, -1.15), porcelain); // sugar bowl
  // cake stand + glass dome
  { b.add(lathe([[0, 0], [0.08, 0], [0.03, 0.03], [0.02, 0.12], [0.16, 0.13], [0.16, 0.14], [0, 0.14]], 18).translate(5.45, CY, -1.0), glass);
    b.add(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 18, 1, false, 0, Math.PI * 1.7).translate(5.45, CY + 0.185, -1.0), lam("drgCake", () => ({ color: "#f2d2b0" }))); b.add(new THREE.CylinderGeometry(0.122, 0.122, 0.02, 18, 1, false, 0, Math.PI * 1.7).translate(5.45, CY + 0.235, -1.0), lam("drgIcing", () => ({ color: "#e86a8a" })));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 10, 0, TAU, 0, Math.PI / 2).scale(1, 1.2, 1).translate(5.45, CY + 0.14, -1.0), glass); add(dome); }
  // stools
  for (const x of [3.0, 3.9, 4.8]) { b.add(new THREE.CylinderGeometry(0.17, 0.2, 0.03, 18).translate(x, 0.015, -0.12), iron); b.add(new THREE.CylinderGeometry(0.03, 0.035, 0.66, 10).translate(x, 0.36, -0.12), brass); b.add(new THREE.CylinderGeometry(0.19, 0.18, 0.06, 20).translate(x, 0.72, -0.12), leather); b.add(new THREE.TorusGeometry(0.19, 0.012, 6, 20).rotateX(Math.PI / 2).translate(x, 0.72, -0.12), brass); b.add(new THREE.TorusGeometry(0.12, 0.01, 6, 16).rotateX(Math.PI / 2).translate(x, 0.24, -0.12), brass); }
  b.add(lathe([[0, 0], [0.12, 0], [0.15, 0.08], [0.11, 0.18], [0.14, 0.2], [0.09, 0.22], [0, 0.18]], 16).translate(5.9, 0, -0.25), brass); // spittoon

  // ---------------- front: windows, door + bell, display, penny scale, chair ----------------
  const winFrame = (x0: number, x1: number, y0: number, y1: number, cols: number) => {
    const z = ZF + 0.12;
    for (const [a, c] of [[V(x0, y0 - 0.05, ZF - 0.04), V(x1, y0 + 0.06, ZF + WT)], [V(x0, y1 - 0.08, z - 0.05), V(x1, y1, z + 0.05)], [V(x0, y0, z - 0.05), V(x0 + 0.08, y1, z + 0.05)], [V(x1 - 0.08, y0, z - 0.05), V(x1, y1, z + 0.05)]] as [THREE.Vector3, THREE.Vector3][]) b.add(boxGeo(a, c), walnutD);
    for (let i = 1; i < cols; i++) { const x = lerp(x0, x1, i / cols); b.add(boxGeo(V(x - 0.03, y0, z - 0.03), V(x + 0.03, y1, z + 0.03)), walnutD); }
    const ty = y1 - (y1 - y0) * 0.22; b.add(boxGeo(V(x0, ty - 0.03, z - 0.03), V(x1, ty + 0.03, z + 0.03)), walnutD);
    for (let k = 0; k < cols; k++) for (const [gy, gx] of [[0.5, 0.25], [0.3, 0.7]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, (y1 - y0) * 0.5), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.set(lerp(x0, x1, (k + gx) / cols), lerp(y0, y1, gy), z - 0.04); m.rotation.z = 0.45; noink(m); add(m); }
  };
  winFrame(W1[0], W1[1], W1[2], W1[3], 3); winFrame(W2[0], W2[1], W2[2], W2[3], 2);
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.44), new THREE.MeshBasicMaterial({ map: windowLetterTex(), transparent: true, depthWrite: false, color: new THREE.Color(1.1, 1.0, 0.85), side: THREE.DoubleSide })); letters.position.set((W1[0] + W1[1]) / 2, 2.55, ZF + 0.07); letters.rotation.y = Math.PI; noink(letters); add(letters);
  // door (hinged at x 0.5), transom, bell on a curly bracket
  const DX0 = DR[0], DX1 = DR[1], DTOP = 2.6;
  b.add(boxGeo(V(DX0 - 0.08, 0, ZF - 0.04), V(DX0, DR[3] + 0.08, ZF + 0.08)), walnutD); b.add(boxGeo(V(DX1, 0, ZF - 0.04), V(DX1 + 0.08, DR[3] + 0.08, ZF + 0.08)), walnutD);
  b.add(boxGeo(V(DX0, DTOP, ZF - 0.04), V(DX1, DTOP + 0.08, ZF + 0.08)), walnutD); b.add(boxGeo(V(DX0 - 0.08, DR[3], ZF - 0.04), V(DX1 + 0.08, DR[3] + 0.08, ZF + 0.08)), walnutD);
  const door = new THREE.Group(); door.position.set(DX0 + 0.01, 0, ZF + 0.02); add(door);
  { const db = new Batch(), w = DX1 - DX0 - 0.02;
    db.add(boxGeo(V(0, 0, -0.025), V(w, 1.0, 0.025)), walnut); db.add(boxGeo(V(0, DTOP - 0.14, -0.025), V(w, DTOP - 0.01, 0.025)), walnut);
    db.add(boxGeo(V(0, 1.0, -0.025), V(0.1, DTOP - 0.14, 0.025)), walnut); db.add(boxGeo(V(w - 0.1, 1.0, -0.025), V(w, DTOP - 0.14, 0.025)), walnut);
    db.add(boxGeo(V(0.1, 0.15, -0.035), V(w - 0.1, 0.85, -0.025)), walnutD); db.add(boxGeo(V(w - 0.16, 0.95, -0.08), V(w - 0.13, 1.15, -0.04)), brass); db.add(boxGeo(V(w - 0.17, 1.0, -0.04), V(w - 0.12, 1.1, -0.025)), brass);
    db.add(boxGeo(V(0.05, 0.98, -0.035), V(w - 0.05, 1.02, -0.025)), brass); db.build(door);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, DTOP - 1.14), new THREE.MeshBasicMaterial({ color: "#3a4c96", transparent: true, opacity: 0.35, depthWrite: false })); pane.position.set(w / 2, (1.0 + DTOP - 0.14) / 2, 0); noink(pane); door.add(pane);
    const pull = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), new THREE.MeshBasicMaterial({ map: ctex("drgPull", 300, 160, (g) => { g.fillStyle = "#f6efdc"; g.fillRect(0, 0, 300, 160); g.strokeStyle = "#7a1e24"; g.lineWidth = 8; g.strokeRect(6, 6, 288, 148); g.fillStyle = "#7a1e24"; center(g); fitText(g, "PULL", 150, 82, 240, 84, "900 %spx Georgia, serif"); }) })); pull.position.set(w - 0.3, 1.25, -0.03); pull.rotation.y = Math.PI; door.add(pull); }
  const bellG = new THREE.Group(); bellG.position.set(DX1 - 0.2, DTOP + 0.0, ZF - 0.12); add(bellG);
  { const bb = new Batch(); seg(bb, V(0, 0.18, 0.12), V(0, 0.18, 0), 0.008, iron, 5); bb.add(new THREE.TorusGeometry(0.05, 0.006, 5, 12, Math.PI * 1.5).translate(0, 0.13, 0), iron); bb.build(bellG); }
  const bell = new THREE.Group(); bell.position.set(0, 0.08, 0); bellG.add(bell);
  { const bb = new Batch(); bb.add(lathe([[0, 0.02], [0.012, 0.02], [0.025, 0.0], [0.035, -0.05], [0.045, -0.075], [0, -0.07]], 14), gold); bb.add(new THREE.SphereGeometry(0.01, 6, 5).translate(0, -0.08, 0), brass); bb.build(bell); }
  // window display platform: show globes (red + green carboys, lit), tonic boxes pyramid
  b.add(boxGeo(V(W1[0], 0, 2.45), V(W1[1], 0.7, ZF)), walnut); b.add(boxGeo(V(W1[0], 0.7, 2.43), V(W1[1], 0.74, ZF)), oak);
  const showGlobes: { L: THREE.PointLight; gl: THREE.Sprite }[] = [];
  for (const [x, col] of [[-5.0, "#e8283a"], [-1.0, "#28c86a"]] as [number, string][]) {
    b.add(lathe([[0.16, 0], [0.16, 0.06], [0.06, 0.12], [0.05, 0.3], [0.1, 0.34], [0, 0.34]], 16).translate(x, 0.74, 2.72), brass);
    const gm = new THREE.Mesh(lathe([[0, 0], [0.12, 0.02], [0.22, 0.14], [0.24, 0.3], [0.18, 0.46], [0.06, 0.54], [0.05, 0.7], [0.08, 0.74], [0, 0.76]], 22).translate(x, 1.08, 2.72), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.6) })); add(gm);
    const gl = glow(root, [x, 1.4, 2.6], col, 1.4, 0.7); const L = new THREE.PointLight(col, 2.5, 3.0, 1.5); L.position.set(x, 1.4, 2.4); add(L); showGlobes.push({ L, gl });
  }
  for (let k = 0; k < 4; k++) for (let i = 0; i < 4 - k; i++) { const x = -3.3 + k * 0.11 + i * 0.22, y = 0.74 + k * 0.16; b.add(boxGeo(V(x - 0.1, y, 2.62), V(x + 0.1, y + 0.16, 2.8)), lam("drgTonicBox", () => ({ color: "#1c2348" }))); b.add(new THREE.PlaneGeometry(0.1, 0.125).rotateY(Math.PI).translate(x, y + 0.08, 2.619), tonicLbl); b.add(new THREE.PlaneGeometry(0.1, 0.125).translate(x, y + 0.08, 2.801), tonicLbl); }
  // penny scale (right front corner) + umbrella stand by the door + chair by the window
  { const g = new THREE.Group(); g.position.set(5.6, 0, 2.7); g.rotation.y = -2.6; add(g); const pb = new Batch();
    pb.add(boxGeo(V(-0.32, 0, -0.25), V(0.32, 0.1, 0.25)), lam("drgPennyM", () => ({ color: "#7a1e24" }))); pb.add(boxGeo(V(-0.1, 0.1, -0.18), V(0.1, 1.2, -0.02)), lam("drgPennyM", () => ({ color: "#7a1e24" })));
    pb.add(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 24).rotateX(Math.PI / 2).translate(0, 1.4, -0.1), lam("drgPennyM", () => ({ color: "#7a1e24" }))); pb.add(new THREE.TorusGeometry(0.24, 0.02, 6, 24).translate(0, 1.4, -0.02), brass); pb.build(g);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.84), new THREE.MeshBasicMaterial({ map: pennyTex(), color: new THREE.Color(0.85, 0.82, 0.8) })); face.position.set(0, 1.35, -0.025); g.add(face); }
  b.add(lathe([[0, 0], [0.13, 0], [0.14, 0.55], [0, 0.55]], 14).translate(1.95, 0, 2.75), lam("drgUmbStand", () => ({ color: "#3a4a5a" }))); seg(b, V(1.93, 0.1, 2.75), V(1.86, 0.98, 2.7), 0.02, lam("drgUmb", () => ({ color: "#1e1e28" })), 6); b.add(new THREE.TorusGeometry(0.05, 0.012, 5, 10, Math.PI).translate(1.86, 1.0, 2.7), walnutD);
  { const g = new THREE.Group(); g.position.set(-5.95, 0, 2.0); g.rotation.y = 1.3; add(g); const cb = new Batch(); cb.add(boxGeo(V(-0.22, 0.44, -0.22), V(0.22, 0.48, 0.22)), oak); for (const sx of [-0.19, 0.19]) for (const sz of [-0.19, 0.19]) seg(cb, V(sx, 0, sz), V(sx, 0.44, sz), 0.018, walnutD, 6); for (const sx of [-0.19, 0.19]) seg(cb, V(sx, 0.48, -0.19), V(sx, 0.95, -0.21), 0.018, walnutD, 6); cb.add(boxGeo(V(-0.2, 0.7, -0.23), V(0.2, 0.9, -0.19)), oak); cb.build(g); }

  // ---------------- ceiling: hanging gas globes + fans ----------------
  const globes: { L: THREE.PointLight; gl: THREE.Sprite; core: THREE.Mesh; seed: number; base: number }[] = [];
  const pools: THREE.Mesh[] = [];
  for (const x of [-3.9, -1.45, 0.6, 3.2, 5.0]) {
    const z = -0.95, gy = 3.0;
    seg(b, V(x, H, z), V(x, gy + 0.32, z), 0.014, brass, 6); b.add(lathe([[0, 0], [0.12, 0], [0.06, 0.04], [0, 0.05]], 12).translate(x, H - 0.05, z), brass);
    b.add(lathe([[0, 0], [0.06, 0.0], [0.11, 0.08], [0.12, 0.1], [0.04, 0.14], [0.02, 0.32], [0, 0.32]], 14).translate(x, gy + 0.08, z), brass);
    for (const s of [-1, 1]) seg(b, V(x, gy + 0.3, z), V(x + s * 0.16, gy + 0.36, z), 0.008, brass, 5);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14).scale(1, 0.9, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.75, 1.42, 1.0) })); core.position.set(x, gy, z); noink(core); add(core);
    const gl = glow(root, [x, gy, z], "#ffcf8a", 1.8, 0.85);
    const L = new THREE.PointLight("#ffc27a", 9, 6.5, 1.15); L.position.set(x, gy - 0.25, z + 0.15); add(L);
    globes.push({ L, gl, core, seed: x * 2.3 + 1, base: 9 });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffb860").multiplyScalar(0.32), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pool.position.set(x, CY + 0.004, z); noink(pool); add(pool); pools.push(pool);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffb060").multiplyScalar(0.18), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); fp.position.set(x, 0.006, 0.25); noink(fp); add(fp); pools.push(fp);
  }
  const fans = [-2.2, 3.0].map((x) => {
    seg(b, V(x, H, 1.0), V(x, 4.05, 1.0), 0.02, brass, 6); b.add(lathe([[0, 0], [0.1, 0.02], [0.13, 0.1], [0.07, 0.17], [0, 0.17]], 14).translate(x, 3.88, 1.0), brass);
    const g = new THREE.Group(); g.position.set(x, 3.92, 1.0); add(g); const fb = new Batch();
    for (let i = 0; i < 4; i++) fb.add(new THREE.BoxGeometry(0.62, 0.012, 0.14).translate(0.38, 0, 0).rotateX(0.12).rotateY((i / 4) * TAU), oak); fb.build(g);
    return g;
  });
  const dust = motes(root, [-5.5, 1.2, -1.6], [5.5, 3.4, 1.4], 90, "#ffe2b0", 0.025, 0.55, 4);

  // ---------------- outside: night street ----------------
  const nb = new Batch(), night = (c: string, map: THREE.Texture | null = null) => new THREE.MeshBasicMaterial({ color: c, map, fog: false });
  nb.add(quad(V(-30, -0.05, 5.4), V(30, -0.05, 5.4), V(30, -0.05, ZF + WT), V(-30, -0.05, ZF + WT), 1, 1), night("#3a3f72"));
  nb.add(boxGeo(V(-30, -0.25, 5.4), V(30, -0.05, 5.55)), night("#5a5e94"));
  nb.add(quad(V(-30, -0.25, 13), V(30, -0.25, 13), V(30, -0.25, 5.55), V(-30, -0.25, 5.55), 1, 1), night("#262a5a"));
  for (let x = -30; x < 30; x += 1.2) nb.add(boxGeo(V(x, -0.049, ZF + WT), V(x + 0.02, -0.048, 5.4)), night("#2c3062"));
  nb.add(boxGeo(V(-30, -0.25, 13), V(30, -0.05, 15)), night("#3a3f72"));
  nb.add(quad(V(20, -0.25, 15), V(-20, -0.25, 15), V(-20, 10, 15), V(20, 10, 15), 1, 1), night("#ffffff", brickTex()));
  nb.add(boxGeo(V(-20, 10, 14.6), V(20, 10.5, 15.3)), night("#5a4a78"));
  // outside wall face of the shop (seen through the windows only at glancing angles)
  nb.build(root, false);
  const lit = new THREE.Mesh(quad(V(20, -0.25, 14.98), V(-20, -0.25, 14.98), V(-20, 10, 14.98), V(20, 10, 14.98), 1, 1), new THREE.MeshBasicMaterial({ map: brickLitTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: new THREE.Color(1.3, 1.15, 0.9) })); noink(lit); add(lit);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(200, 90), new THREE.MeshBasicMaterial({ map: skyTex(true), fog: false, depthWrite: false })); sky.position.set(0, 30, 60); sky.rotation.y = Math.PI; noink(sky); sky.renderOrder = -2; add(sky);
  // gas street lamp on the sidewalk
  const gas = new THREE.Group(); gas.position.set(-2.6, -0.05, 4.9); add(gas);
  { const gb = new Batch(), gm = night("#1a1c36"); gb.add(lathe([[0.12, 0], [0.12, 0.3], [0.06, 0.4], [0.05, 3.1], [0.08, 3.2], [0, 3.2]], 12), gm); gb.add(new THREE.ConeGeometry(0.3, 0.26, 4).rotateY(Math.PI / 4).translate(0, 3.78, 0), gm); gb.add(boxGeo(V(-0.18, 3.2, -0.18), V(0.18, 3.25, 0.18)), gm); gb.build(gas, false); }
  const gasGlass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.28).translate(0, 3.47, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 1.0) })); noink(gasGlass); gas.add(gasGlass);
  const gasGlow = glow(gas, [0, 3.47, 0], "#ffc870", 3.0, 1);
  const gasPool = new THREE.Mesh(new THREE.PlaneGeometry(5, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffb060").multiplyScalar(0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); gasPool.position.set(-2.6, -0.04, 4.6); noink(gasPool); add(gasPool);
  // passer-by + cat on the outside sill
  const walker = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.7).translate(0, 0.85, 0), new THREE.MeshBasicMaterial({ map: walkerTex(), transparent: true, fog: false, depthWrite: false, color: new THREE.Color(0.9, 0.9, 1.0) })); walker.rotation.y = Math.PI; noink(walker); add(walker);
  const cat = new THREE.Group(); cat.position.set(-4.3, 0.74, ZF + WT + 0.12); cat.rotation.y = Math.PI; add(cat);
  { const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34).translate(0, 0.17, 0), new THREE.MeshBasicMaterial({ map: catTex(), transparent: true, fog: false, depthWrite: false })); noink(cm); cat.add(cm); }
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.24).translate(0, 0.12, 0), new THREE.MeshBasicMaterial({ color: "#121630", fog: false, side: THREE.DoubleSide })); tail.position.set(0.1, 0.04, -0.01); noink(tail); cat.add(tail);
  b.add(boxGeo(V(W1[0], 0.62, ZF + WT), V(W1[1], 0.7, ZF + WT + 0.2)), lam("drgSillOut", () => ({ color: "#5a4a6a" })));
  // window light shafts (cool street light falling in)
  const shafts = [-4.3, -1.7, 4.0].map((x) => shaft(root, [x, 3.3, ZF], [x + 0.4, 0, 1.0], 1.3, "#8fa8ff", 0.05));
  const winL = new THREE.PointLight("#8ea4ff", 5, 6, 1.2); winL.position.set(-3.0, 2.4, 2.3); add(winL);

  shell.build(root, false); b.build(root);
  // ink off the glints
  glints.forEach(({ s }) => s.layers.set(NOINK));

  const marks: Record<string, V3> = {
    pharmScale: [-1.45, 0, -1.85],   // pharmacist behind the counter at the scale
    pharmTonic: [-4.05, 0, -1.85],   // pharmacist at the tonic display, poster at his right (screen left)
    customer: [-1.3, 0, 0.05],       // customer at the counter facing the scale / pharmacist
    coffee: [3.9, 0.76, -0.12],      // coffee customer SITTING on the middle stool (y = seat top; use mode "sit")
    rat: [-0.84, CY, -0.8],          // the little rat figure on the counter, right of the scale
    door: [1.05, 0, 2.2],            // just inside the front door (entry)
    scale: [SCX, CY, SCZ], pinch: [SCX + ARM, CY + PIV + 0.05 - HANG, SCZ], tonic: [-4.33, CY, -0.95], poster: [(POSTER_X0 + POSTER_X1) / 2, 2.6, SZ0 + 0.04], cups: [4.6, CY, -0.98], tin: [-2.05, CY, -0.98],
  };
  const cams: SetDef["cams"] = {
    wide: { pos: [-5.5, 2.9, 2.3], look: [2.6, 1.3, -1.2], fov: 44 },
    wideRev: { pos: [5.55, 2.85, 2.35], look: [-2.8, 1.25, -1.0], fov: 42 },
    scaleHigh: { pos: [-0.95, 2.3, 0.45], look: [-1.62, CY + 0.12, -0.95], fov: 38 },
    poster: { pos: [-3.05, 1.55, 1.55], look: [-4.75, 2.0, -2.2], fov: 40 },
    fountain: { pos: [2.7, 1.75, 2.6], look: [4.3, 1.3, -0.75], fov: 38 },
    ratLow: { pos: [-0.25, CY + 0.1, -0.35], look: [-1.45, CY + 0.36, -1.45], fov: 42 },
    ots: { pos: [-0.45, 1.95, 1.5], look: [-1.6, 1.5, -1.8], fov: 38 },
    reverse: { pos: [-0.75, 1.8, -2.0], look: [-1.35, 1.45, 0.5], fov: 40 },
    window: { pos: [-1.2, 1.7, 0.4], look: [-3.4, 1.9, 3.0], fov: 42 },
    trackA: { pos: [-3.3, 1.55, 1.35], look: [-3.9, 1.45, -1.6], fov: 40 },
    trackB: { pos: [3.25, 1.5, 1.35], look: [4.0, 1.2, -0.5], fov: 40 },
  };
  const curtArr = curtain.geometry.attributes.position.array as Float32Array;
  return {
    name: "drugstore", root, marks, cams,
    pose: (t, c) => {
      // ---- scale ----
      const s = cl(c.scale ?? 0), AMAX = Math.asin((PIV - HANG - 0.005) / ARM);
      let a: number;
      if (s <= 0.5) a = 0.08 * sm(s / 0.5);
      else { const u = (s - 0.5) / 0.5; a = u < 0.8 ? 0.08 + (AMAX - 0.08) * (u / 0.8) ** 2 : AMAX - 0.09 * Math.sin(((u - 0.8) / 0.2) * Math.PI); }
      a += 0.004 * Math.sin(t * 1.3) * (1 - s);
      beam.rotation.z = -a; pans.forEach((p) => (p.rotation.z = a));
      heap.visible = s > 0.02; heap.scale.setScalar(s <= 0.5 ? lerp(0.35, 1, s / 0.5) : lerp(1, 3.0, sm((s - 0.5) / 0.4)));
      const pk = s > 0.82 ? sm((s - 0.82) / 0.12) : 0;
      scalePuffs.forEach((m, i) => { const d = m.userData; m.position.set(d.p[0] + Math.sin(t * 0.7 + i) * 0.04, d.p[1] + pk * (0.03 + i * 0.05) + 0.02 * Math.sin(t + i), d.p[2]); (m.material as THREE.SpriteMaterial).opacity = 0.55 * pk * (1 - 0.3 * i / 2); const sz = d.size * (0.6 + pk * (0.8 + i * 0.3)); m.scale.set(sz, sz * 0.7, 1); });
      // ---- rattle ----
      const rt = cl(c.rattle ?? 0);
      cups.forEach(({ g, base, ph, k }) => { const q = rt * k; g.position.set(base.x + q * 0.005 * Math.sin(t * 61 + ph), base.y + q * 0.004 * Math.max(0, Math.sin(t * 43 + ph * 2)), base.z + q * 0.004 * Math.sin(t * 47 + ph)); g.rotation.z = q * 0.07 * Math.sin(t * 53 + ph); g.rotation.x = q * 0.05 * Math.sin(t * 67 + ph * 0.7); });
      spoon.rotation.y = rt * 0.3 * Math.sin(t * 58); spoon.position.y = CY + 0.016 + rt * 0.004 * Math.max(0, Math.sin(t * 71));
      // ---- door + bell ----
      const dr = cl(c.door ?? 0); door.rotation.y = 1.25 * sm(dr);
      bell.rotation.z = (0.45 * Math.sin(Math.PI * dr) + 0.03) * Math.sin(t * 21); bell.rotation.x = 0.2 * Math.sin(Math.PI * dr) * Math.sin(t * 17 + 1);
      // ---- poster bolt ----
      const bo = cl(c.bolt ?? 0), fl = bo * (0.65 + 0.35 * Math.abs(Math.sin(t * 23) * Math.sin(t * 7.1)));
      (boltOv.material as THREE.MeshBasicMaterial).opacity = fl; boltGlow.material.opacity = 0.6 * fl;
      // ---- ambient ----
      fans.forEach((f, i) => (f.rotation.y = t * (1.4 + i * 0.3) + i));
      globes.forEach(({ L, gl, core, seed, base }) => { const f = 0.93 + 0.07 * Math.sin(t * 11 + seed) * Math.sin(t * 4.3 + seed * 2); L.intensity = base * f; gl.material.opacity = 0.75 + 0.25 * f; (core.material as THREE.MeshBasicMaterial).color.setRGB(1.75 * f, 1.42 * f, 1.0 * f); });
      sconces.forEach((g) => { const u = g.userData, f = 0.9 + 0.1 * Math.sin(t * 13 + u.seed) * Math.sin(t * 5.3 + u.seed * 2); u.light.intensity = u.base * f; u.glow.material.opacity = 0.7 + 0.3 * f; });
      showGlobes.forEach(({ L, gl }, i) => { const f = 0.94 + 0.06 * Math.sin(t * 1.7 + i * 2); L.intensity = 2.5 * f; gl.material.opacity = 0.65 + 0.2 * f; });
      pools.forEach((p, i) => ((p.material as THREE.MeshBasicMaterial).opacity = 0.92 + 0.08 * Math.sin(t * 11 + i)));
      glints.forEach(({ s: sp, ph, k }) => (sp.material.opacity = k * (0.55 + 0.45 * Math.max(0, Math.sin(t * 1.6 + ph)) ** 3)));
      caseGlow.material.opacity = 0.85 + 0.1 * Math.sin(t * 2.1);
      risePuffs(steam, t, 0.7, 0.28, 1.6); risePuffs(cupSteam, t, 0.35, 0.35, 1.4, 1 - 0.5 * rt);
      dust.update(t);
      setClock(9 + 52 / 60 + t / 60, t);
      for (let i = 0; i < curtArr.length; i += 3) { const y = curtBase[i + 1], x = curtBase[i]; curtArr[i + 2] = curtBase[i + 2] + 0.02 * Math.sin(t * 1.1 + x * 9) * (1.3 - y) / 2.6 + 0.012 * Math.sin(x * 26); }
      curtain.geometry.attributes.position.needsUpdate = true;
      const gf = 0.88 + 0.12 * Math.sin(t * 9) * Math.sin(t * 3.7); gasGlow.material.opacity = 0.8 + 0.2 * gf; (gasPool.material as THREE.MeshBasicMaterial).opacity = 0.85 + 0.15 * gf;
      (lit.material as THREE.MeshBasicMaterial).opacity = 0.88 + 0.12 * Math.sin(t * 0.37);
      const wx = ((t * 1.05) % 30) - 15; walker.position.set(wx, -0.25 + 0.03 * Math.abs(Math.sin(t * 5.5)), 13.6); walker.rotation.z = 0.03 * Math.sin(t * 5.5);
      tail.rotation.z = 0.5 + 0.45 * Math.sin(t * 1.9) * Math.sin(t * 0.6 + 1);
      cat.children[0].rotation.z = 0.03 * Math.sin(t * 0.8);
      shafts.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.05 + 0.012 * Math.sin(t * 0.5 + i)));
      winL.intensity = 5;
    },
  };
};
const basicNoInk = (c: string) => new THREE.MeshBasicMaterial({ color: c });
