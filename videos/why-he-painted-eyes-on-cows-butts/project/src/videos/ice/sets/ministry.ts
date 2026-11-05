// MINISTÈRE DES POSTES, public hall at night, Paris 1925 ("The Man Who Sold the Eiffel Tower"). Light key `ministry`.
// Hall x -5.5..5.5, z -4.5 (back wall) .. 6.0 (entrance wall), ceiling 4.8. A long oak counter runs along x
// (x -4..4, public face at z -0.2, top 1.05) with a brass grille (z -0.62, up to 2.4) and three arched clerk windows
// ("GUICHET 1/2/3" at x -2.4 / 0 / 2.4). Behind it the clerks' desk (z -1.25..-0.9, top 0.85) with the three bribe
// drawers (right of each clerk), green banker's lamps, stamps, ink pads, folders. Back wall: pigeon holes stuffed with
// papers (left), a safe under a regulator clock (centre), filing cabinets (right), a plain portrait frame and a notice
// board. Left wall: two tall windows on the night street (lit facades, gas lamp). Public side: the queue lane at x 0
// between brass posts with red ropes, benches, a high writing desk, coat stand; entrance doors in the front wall.
//
// ctl (pose c):
//   drawers 0..1  the three desk drawers slide open toward the clerks, staggered (1 opens first, then 2, then 3);
//                 each drawer holds a stack of envelopes + banknotes
//   stamp   0..1  one thump of the big rubber stamp on the middle window: 0 -> 0.5 it comes down, at 0.5 it hits the
//                 paper (the red APPROVÉ mark appears and stays), 0.5 -> 1 it lifts back up
// Ambient (always): regulator clock hands + pendulum, two ceiling fans turn, banker's lamps + pendant globes
// flicker softly, a moth circles a pendant lamp, dust in the moonlight shafts, papers in the pigeon holes and on the
// notice board stir, the gas lamp outside flickers, lit windows across the street twinkle.
//
// Keep-out boxes (camera must never enter): MINISTRY_SOLIDS below (walls are the room bounds themselves).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, jit } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow, shaft } from "../setkit";
import { motes, lamCustom, TAU } from "./innerkit_b";
import { fitText, cl, sm, lerp } from "./portkit_common";
import { seg, lathe, goldM, brassM, glassM, woodTex, marbleTex, docTex, dialTex, clockHands, hausTex, skyTex, basicNo } from "./hotel";
import type { SetDef, V3 } from "./types";

export const MINISTRY_SOLIDS: [V3, V3][] = [
  [[-4.05, 0, -1.3], [4.05, 2.65, -0.12]],    // counter + grille + header
  [[-1.85, 2.6, -0.75], [1.85, 3.25, -0.5]],  // the sign over the counter
  [[-5.5, 0, -4.5], [5.5, 2.6, -3.85]],       // pigeon holes, safe, filing cabinets
  [[-0.75, 0.0, 0.95], [0.75, 1.0, 3.5]],     // queue posts + ropes (lane between them is free floor)
  [[4.75, 0, 0.2], [5.5, 1.0, 3.8]],          // benches (right wall)
  [[-5.5, 0, 3.4], [-4.3, 1.4, 5.0]],         // writing desk (left front)
  [[3.9, 0, 4.6], [4.6, 2.0, 5.4]],           // coat stand
  [[-2.4, 4.2, 1.8], [-1.2, 4.8, 3.0]], [[1.2, 4.2, 1.8], [2.4, 4.8, 3.0]], // ceiling fans
  [[-2.65, 3.3, -0.05], [-2.15, 4.8, 0.45]], [[2.15, 3.3, -0.05], [2.65, 4.8, 0.45]], // pendant globes
];

// ---------------- textures ----------------
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
/** checker tiles: 1024 px = 2.4 m (6 x 6 tiles of 0.4 m), cream + bottle green, worn */
const tileTex = () => ctex("minTiles", 1024, 1024, (g, r) => {
  const n = 6, s = 1024 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = jit(r, (i + j) % 2 ? "#2f5a4c" : "#e6dcc2", 0.06, 3, 0.08); g.fillRect(i * s, j * s, s, s); blot(g, i * s + r() * s, j * s + r() * s, 40 + r() * 50, (i + j) % 2 ? "rgba(120,170,150,0.18)" : "rgba(255,255,240,0.25)"); }
  g.strokeStyle = "rgba(40,40,40,0.5)"; g.lineWidth = 3; for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s, 1024); g.moveTo(0, k * s); g.lineTo(1024, k * s); g.stroke(); }
  for (let i = 0; i < 20; i++) blot(g, r() * 1024, r() * 1024, 60 + r() * 120, "rgba(60,50,40,0.08)");
});
/** wall: dark oak wainscot (to 1.3 m) under sage plaster, 1024 px tall = 4.8 m, 512 px = 2 m */
const wallTex = () => ctex("minWall", 512, 1024, (g, r) => {
  const ppm = 1024 / 4.8, Y = (m: number) => 1024 - m * ppm;
  const gr = g.createLinearGradient(0, 0, 0, Y(1.3)); gr.addColorStop(0, "#a9bba8"); gr.addColorStop(1, "#bccab4"); g.fillStyle = gr; g.fillRect(0, 0, 512, Y(1.3));
  for (let i = 0; i < 26; i++) blot(g, r() * 512, r() * Y(1.3), 30 + r() * 70, r() < 0.5 ? "rgba(120,140,120,0.16)" : "rgba(240,245,225,0.18)");
  g.strokeStyle = "rgba(90,100,90,0.35)"; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { let x = r() * 512, y = r() * 400; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 30; y += 12 + r() * 14; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = "#e8e2cc"; g.fillRect(0, Y(4.8), 512, 0.35 * ppm); g.fillStyle = "#8a9a88"; g.fillRect(0, Y(4.45), 512, 6);
  g.fillStyle = "#6a4426"; g.fillRect(0, Y(1.3), 512, 1.3 * ppm);
  for (let x = 0; x < 512; x += 128) { g.fillStyle = "#5a3820"; g.fillRect(x + 14, Y(1.12), 100, 0.86 * ppm); g.strokeStyle = "#8a5a34"; g.lineWidth = 4; g.strokeRect(x + 14, Y(1.12), 100, 0.86 * ppm); g.strokeStyle = "#3a2210"; g.lineWidth = 2; g.strokeRect(x + 20, Y(1.12) + 6, 88, 0.86 * ppm - 12); }
  g.fillStyle = "#8a5a34"; g.fillRect(0, Y(1.32), 512, 10); g.fillStyle = "#3a2414"; g.fillRect(0, Y(0.15), 512, 0.15 * ppm);
});
const ceilTex = () => ctex("minCeil", 512, 512, (g, r) => {
  g.fillStyle = "#e4dfcc"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 12; i++) blot(g, r() * 512, r() * 512, 60 + r() * 90, "rgba(150,150,130,0.12)");
  g.strokeStyle = "#c4bca4"; g.lineWidth = 10; g.strokeRect(20, 20, 472, 472); g.strokeStyle = "#f4f0e2"; g.lineWidth = 3; g.strokeRect(34, 34, 444, 444);
});
const signTex = () => ctex("minSign", 1280, 256, (g) => {
  g.fillStyle = "#1f3a30"; g.fillRect(0, 0, 1280, 256);
  const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, "rgba(255,255,255,0.08)"); v.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = v; g.fillRect(0, 0, 1280, 256);
  g.strokeStyle = "#d6a443"; g.lineWidth = 10; g.strokeRect(14, 14, 1252, 228); g.lineWidth = 3; g.strokeRect(32, 32, 1216, 192);
  g.fillStyle = "#f2d27a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "MINISTÈRE DES POSTES", 640, 132, 1120, 110, "700 %spx Georgia, serif");
});
const guichetTex = (n: number) => ctex("minGuichet" + n, 256, 72, (g) => {
  g.fillStyle = "#1f3a30"; g.fillRect(0, 0, 256, 72); g.strokeStyle = "#d6a443"; g.lineWidth = 5; g.strokeRect(4, 4, 248, 64);
  g.fillStyle = "#f2d27a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "GUICHET " + n, 128, 38, 216, 44, "700 %spx Georgia, serif");
});
const stampMarkTex = () => ctex("minApprove", 256, 96, (g, r) => {
  g.strokeStyle = "#c81e2a"; g.fillStyle = "#c81e2a"; g.lineWidth = 7; g.strokeRect(8, 8, 240, 80); g.lineWidth = 2; g.strokeRect(16, 16, 224, 64);
  g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "APPROVÉ", 128, 50, 200, 50, "900 %spx Georgia, serif");
  g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 160; i++) { g.globalAlpha = 0.6 * r(); g.fillRect(r() * 256, r() * 96, 2 + r() * 6, 1 + r() * 3); }
});
const cabinetTex = () => ctex("minCabinet", 512, 1024, (g, r) => {
  g.fillStyle = "#7a4a2a"; g.fillRect(0, 0, 512, 1024);
  const cols = 4, rows = 10, cw = 512 / cols, rh = 1024 / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = i * cw, y = j * rh; g.fillStyle = jit(r, "#94603a", 0.08); g.fillRect(x + 6, y + 6, cw - 12, rh - 12);
    g.strokeStyle = "#3a2010"; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, cw - 12, rh - 12);
    g.fillStyle = "#e8dcc0"; g.fillRect(x + cw / 2 - 30, y + 20, 60, 26); g.strokeStyle = "#c9a046"; g.lineWidth = 3; g.strokeRect(x + cw / 2 - 30, y + 20, 60, 26);
    g.fillStyle = "#2a1a10"; g.font = "700 18px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; const a = String.fromCharCode(65 + ((i * rows + j) % 24)); g.fillText(a + "–" + String.fromCharCode(66 + ((i * rows + j) % 24)), x + cw / 2, y + 34);
    g.fillStyle = "#d6a443"; g.beginPath(); g.ellipse(x + cw / 2, y + 70, 24, 9, 0, 0, TAU); g.fill(); g.fillStyle = "#6a4a1a"; g.beginPath(); g.ellipse(x + cw / 2, y + 72, 18, 5, 0, 0, TAU); g.fill();
  }
});
const safeTex = () => ctex("minSafe", 256, 384, (g) => {
  g.fillStyle = "#2c4a3c"; g.fillRect(0, 0, 256, 384); g.strokeStyle = "#d6a443"; g.lineWidth = 6; g.strokeRect(16, 16, 224, 352); g.lineWidth = 2; g.strokeRect(28, 28, 200, 328);
  g.fillStyle = "#d6a443"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "COFFRE", 128, 60, 150, 30, "700 %spx Georgia, serif");
  for (const [x, y] of [[40, 40], [216, 40], [40, 344], [216, 344]]) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
});
const portraitTex = () => ctex("minPortrait", 256, 320, (g) => {
  const bg = g.createRadialGradient(128, 130, 20, 128, 160, 220); bg.addColorStop(0, "#6a5a44"); bg.addColorStop(1, "#2a2220"); g.fillStyle = bg; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#1e1a22"; g.beginPath(); g.ellipse(128, 300, 100, 80, 0, Math.PI, 0); g.fill(); g.beginPath(); g.ellipse(128, 150, 48, 58, 0, 0, TAU); g.fill();
  g.fillStyle = "rgba(200,180,140,0.15)"; g.beginPath(); g.ellipse(112, 136, 22, 30, -0.3, 0, TAU); g.fill();
  g.fillStyle = "#a8282a"; g.fillRect(118, 250, 20, 30);
});
const noticeTex = (key: string, title: string) => ctex("minNotice" + key, 200, 260, (g, r) => {
  g.fillStyle = "#f2ead2"; g.fillRect(0, 0, 200, 260); g.fillStyle = "#1e1a2a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, title, 100, 34, 170, 30, "900 %spx Georgia, serif");
  g.fillStyle = "#c81e2a"; g.fillRect(20, 56, 160, 4); g.strokeStyle = "rgba(30,26,40,0.6)"; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(22, 84 + i * 20); g.lineTo(22 + 120 + r() * 36, 84 + i * 20); g.stroke(); }
});
const corkTex = () => ctex("minCork", 256, 256, (g, r) => { g.fillStyle = "#b08a5a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,80,40,0.4)" : "rgba(220,190,140,0.4)"; g.fillRect(r() * 256, r() * 256, 2, 2); } });
const frostTex = (text: string) => ctex("minFrost" + text, 256, 512, (g) => {
  const gr = g.createRadialGradient(128, 256, 20, 128, 256, 300); gr.addColorStop(0, "#fff0c8"); gr.addColorStop(1, "#e2cf9e"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 4; g.strokeRect(16, 16, 224, 480);
  g.fillStyle = "#3a2a1a"; g.textAlign = "center"; g.textBaseline = "middle"; const ls = text.split("\n"); ls.forEach((l, i) => fitText(g, l, 128, 150 + i * 44, 200, 34, "700 %spx Georgia, serif"));
});
const envTex = () => ctex("minEnvelope", 128, 80, (g) => { g.fillStyle = "#efe3c4"; g.fillRect(0, 0, 128, 80); g.strokeStyle = "rgba(120,90,50,0.7)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 44); g.lineTo(128, 0); g.stroke(); g.fillStyle = "#a8282a"; g.beginPath(); g.arc(64, 44, 8, 0, TAU); g.fill(); });
const noteTex = () => ctex("minBanknote", 128, 64, (g) => { g.fillStyle = "#b8c89a"; g.fillRect(0, 0, 128, 64); g.strokeStyle = "#4a6a3a"; g.lineWidth = 4; g.strokeRect(5, 5, 118, 54); g.fillStyle = "#4a6a3a"; g.beginPath(); g.ellipse(40, 32, 14, 18, 0, 0, TAU); g.fill(); g.font = "900 26px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("100", 88, 33); });

export const ministry = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch();
  const r = rng(1925 + 7);
  const X0 = -5.5, X1 = 5.5, ZB = -4.5, ZF = 6.0, H = 4.8, WT = 0.4;
  const floorM = lam("minFloor", () => ({ map: tileTex() }));
  const wallM = lam("minWallM", () => ({ map: wallTex() }));
  const ceilM = lam("minCeilM", () => ({ map: ceilTex() }));
  const oak = lamCustom("minOak", () => twoTone(new THREE.MeshPhongMaterial({ map: woodTex("oak", "#9a6234", "#5a3418", "#d09060"), specular: "#ffe0b0", shininess: 40 })));
  const oakDark = lamCustom("minOakD", () => twoTone(new THREE.MeshPhongMaterial({ map: woodTex("oakD", "#6a3e22", "#3a1e0e", "#a06a40"), specular: "#ffe0b0", shininess: 35 })));
  const marble = lam("minMarble", () => ({ map: marbleTex("minGreen", "#3a4a44", "#d8e6dc", "rgba(20,40,30,0.4)") }));
  const brass = brassM(), gold = goldM(), iron = lam("minIron", () => ({ color: "#2e2c36" }));
  const paper = lam("minPaper", () => ({ color: "#efe6cc" })), paper2 = lam("minPaper2", () => ({ color: "#e2d6b4" }));
  const folderCols = ["#c9a46a", "#3f6a9a", "#a8323a", "#6a8a4a", "#d8c08a"].map((c) => lam("minFolder" + c, () => ({ color: c })));
  const ribbon = lam("minRibbon", () => ({ color: "#b02a30" }));

  // ---- shell ----
  shell.add(quad(V(X0, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(X0, 0, ZB), (X1 - X0) / 2.4, (ZF - ZB) / 2.4), floorM);
  shell.add(quad(V(X0, H, ZB), V(X1, H, ZB), V(X1, H, ZF), V(X0, H, ZF), (X1 - X0) / 2.4, (ZF - ZB) / 2.4), ceilM);
  shell.add(quad(V(X0, 0, ZB), V(X1, 0, ZB), V(X1, H, ZB), V(X0, H, ZB), (X1 - X0) / 2, 1), wallM);
  shell.add(quad(V(X1, 0, ZB), V(X1, 0, ZF), V(X1, H, ZF), V(X1, H, ZB), (ZF - ZB) / 2, 1), wallM);
  // left wall (two tall windows) + front wall (entrance) as extruded walls with holes
  const WINZ = [-2.6, 2.2], WW = 1.4, WY0 = 0.95, WY1 = 3.95;
  const ls = new THREE.Shape(); ls.moveTo(ZB, 0); ls.lineTo(ZF, 0); ls.lineTo(ZF, H); ls.lineTo(ZB, H); ls.closePath();
  for (const z of WINZ) { const p = new THREE.Path(); p.moveTo(z - WW / 2, WY0); p.lineTo(z + WW / 2, WY0); p.lineTo(z + WW / 2, WY1); p.lineTo(z - WW / 2, WY1); p.closePath(); ls.holes.push(p); }
  // shape (z, y) extruded by WT, remapped to world: x = X0 - depth, y, z = shape x (a proper rotation)
  const lw = new THREE.ExtrudeGeometry(ls, { depth: WT, bevelEnabled: false });
  { const p = lw.attributes.position as THREE.BufferAttribute, uv = lw.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i); p.setXYZ(i, X0 - sz, sy, sx); uv.setXY(i, (sx + sz) / 2, sy / H); } }
  lw.computeVertexNormals();
  const lwm = new THREE.Mesh(lw, lamCustom("minWallDS", () => { const m = new THREE.MeshLambertMaterial({ map: wallTex(), side: THREE.DoubleSide }); return twoTone(m); })); lwm.receiveShadow = true; root.add(lwm);
  const DW = 0.9, DH = 2.9;
  const fsh = new THREE.Shape(); fsh.moveTo(X0, 0); fsh.lineTo(X1, 0); fsh.lineTo(X1, H); fsh.lineTo(X0, H); fsh.closePath(); { const p = new THREE.Path(); p.moveTo(-DW, 0); p.lineTo(DW, 0); p.lineTo(DW, DH); p.lineTo(-DW, DH); p.closePath(); fsh.holes.push(p); }
  const fg = new THREE.ExtrudeGeometry(fsh, { depth: WT, bevelEnabled: false }); fg.translate(0, 0, ZF);
  { const p = fg.attributes.position as THREE.BufferAttribute, uv = fg.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 2, p.getY(i) / H); }
  const fwm = new THREE.Mesh(fg, wallM); fwm.receiveShadow = true; root.add(fwm);
  // cornice + skirting relief
  for (const [a, c] of [[V(X0, H - 0.25, ZB), V(X1, H, ZB + 0.14)], [V(X0, H - 0.25, ZF - 0.14), V(X1, H, ZF)], [V(X0, H - 0.25, ZB), V(X0 + 0.14, H, ZF)], [V(X1 - 0.14, H - 0.25, ZB), V(X1, H, ZF)]] as [THREE.Vector3, THREE.Vector3][]) b.add(boxGeo(a, c), lam("minCornice", () => ({ color: "#ece6d2" })));
  // ceiling beams
  for (const z of [-1.6, 1.6, 4.4]) b.add(boxGeo(V(X0, H - 0.3, z - 0.15), V(X1, H, z + 0.15), 2), lam("minBeam", () => ({ color: "#e0d8c0" })));

  // ---- the counter + brass grille + clerk windows ----
  const CX0 = -4.0, CX1 = 4.0, CZF = -0.2, CZB = -0.9, CY = 1.05, GZ = -0.62, GY1 = 2.4, WINX = [-2.4, 0, 2.4], OW = 0.76, OY0 = 1.1, OY1 = 1.75;
  b.add(boxGeo(V(CX0, 0.12, CZB), V(CX1, CY - 0.06, CZF), 1.6), oak);
  b.add(boxGeo(V(CX0 - 0.05, CY - 0.06, CZB), V(CX1 + 0.05, CY, CZF + 0.06)), marble);
  b.add(boxGeo(V(CX0, 0, CZB + 0.05), V(CX1, 0.12, CZF - 0.04)), oakDark);
  for (let x = CX0 + 0.1; x < CX1 - 0.2; x += 0.8) { b.add(boxGeo(V(x + 0.06, 0.24, CZF), V(x + 0.7, 0.86, CZF + 0.025)), oakDark); b.add(boxGeo(V(x + 0.12, 0.3, CZF + 0.025), V(x + 0.64, 0.8, CZF + 0.04)), oak); }
  b.add(boxGeo(V(CX0, 0.9, CZF), V(CX1, 0.95, CZF + 0.04)), brass);
  // clerk desk behind (lower) + drawers
  const DY = 0.85, DZ0 = -1.25, DZ1 = CZB;
  b.add(boxGeo(V(CX0, 0, DZ0), V(CX1, DY - 0.04, DZ1), 1.6), oakDark);
  b.add(boxGeo(V(CX0 - 0.03, DY - 0.04, DZ0 - 0.04), V(CX1 + 0.03, DY, DZ1)), oak);
  const drawers = WINX.map((wx) => {
    const x = wx + 0.58, g = new THREE.Group(); g.position.set(x, 0, 0); root.add(g);
    const db = new Batch(), w = 0.42, d = 0.32;
    // carcass gap (dark) in the desk front so the open drawer reads as coming out
    b.add(boxGeo(V(x - w / 2 - 0.01, DY - 0.24, DZ0 - 0.004), V(x + w / 2 + 0.01, DY - 0.05, DZ0 + 0.002)), basicNo("#1a1210"));
    db.add(boxGeo(V(-w / 2, DY - 0.23, DZ0 - 0.03), V(w / 2, DY - 0.06, DZ0)), oak);
    db.add(boxGeo(V(-w / 2 + 0.02, DY - 0.22, DZ0), V(w / 2 - 0.02, DY - 0.21, DZ0 + d)), oakDark);
    for (const s of [-1, 1]) db.add(boxGeo(V(s * (w / 2 - 0.02) - 0.01, DY - 0.22, DZ0), V(s * (w / 2 - 0.02) + 0.01, DY - 0.1, DZ0 + d)), oakDark);
    db.add(new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI).rotateZ(Math.PI).translate(0, DY - 0.13, DZ0 - 0.04), brass);
    db.build(g);
    // envelopes + banknotes inside
    const env = lam("minEnvM", () => ({ map: envTex() })), note = lam("minNoteM", () => ({ map: noteTex() }));
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.14), env); m.position.set(-0.06 + (i % 2) * 0.1, DY - 0.2 + i * 0.013, DZ0 + 0.1 + (i % 3) * 0.04); m.rotation.y = (i - 1.5) * 0.25; g.add(m); }
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.006, 0.075), note); m.position.set(0.1, DY - 0.205 + i * 0.007, DZ0 + 0.22); m.rotation.y = 0.3 + i * 0.2; g.add(m); }
    return g;
  });
  // brass grille with arched windows (rods every 7 cm), oak pilasters + header beam
  const inWin = (x: number, y: number) => WINX.some((wx) => Math.abs(x - wx) < OW / 2 && y < OY1 + Math.sqrt(Math.max(0, (OW / 2) ** 2 - (x - wx) ** 2)));
  for (let x = CX0 + 0.06; x < CX1 - 0.03; x += 0.07) {
    const win = WINX.find((wx) => Math.abs(x - wx) < OW / 2);
    if (win !== undefined) { const top = OY1 + Math.sqrt(Math.max(0, (OW / 2) ** 2 - (x - win) ** 2)); seg(b, V(x, top, GZ), V(x, GY1, GZ), 0.007, brass, 5); seg(b, V(x, CY, GZ), V(x, CY + 0.02, GZ), 0.007, brass, 5); }
    else seg(b, V(x, CY, GZ), V(x, GY1, GZ), 0.007, brass, 5);
  }
  void inWin;
  // horizontal rails, skipping the openings
  const rails = (y: number, skipBelow: boolean) => {
    let x = CX0; const stops = WINX.flatMap((w) => [w - OW / 2 - 0.02, w + OW / 2 + 0.02]);
    for (let i = 0; i <= stops.length; i += 2) { const a = i === 0 ? CX0 : stops[i - 1], c = i < stops.length ? stops[i] : CX1; b.add(boxGeo(V(a, y - 0.015, GZ - 0.015), V(c, y + 0.015, GZ + 0.015)), brass); }
    if (!skipBelow) void x;
  };
  rails(1.35, true); rails(1.95, true);
  b.add(boxGeo(V(CX0, GY1 - 0.04, GZ - 0.02), V(CX1, GY1, GZ + 0.02)), brass);
  for (const wx of WINX) {
    b.add(new THREE.TorusGeometry(OW / 2 + 0.01, 0.022, 6, 24, Math.PI).translate(wx, OY1, GZ), brass);
    for (const s of [-1, 1]) b.add(boxGeo(V(wx + s * (OW / 2 + 0.01) - 0.022, CY, GZ - 0.022), V(wx + s * (OW / 2 + 0.01) + 0.022, OY1, GZ + 0.022)), brass);
    b.add(boxGeo(V(wx - OW / 2, CY, GZ - 0.06), V(wx + OW / 2, CY + 0.02, GZ + 0.06)), brass); // the slot sill
    const gs = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.17), new THREE.MeshBasicMaterial({ map: guichetTex(WINX.indexOf(wx) + 1) })); gs.position.set(wx, OY1 + OW / 2 + 0.17, GZ + 0.03); root.add(gs);
    b.add(boxGeo(V(wx - 0.34, OY1 + OW / 2 + 0.07, GZ), V(wx + 0.34, OY1 + OW / 2 + 0.27, GZ + 0.02)), brass);
  }
  for (const x of [CX0, -1.2, 1.2, CX1]) b.add(boxGeo(V(x - 0.08, CY, GZ - 0.08), V(x + 0.08, GY1 + 0.05, GZ + 0.08)), oakDark);
  b.add(boxGeo(V(CX0 - 0.1, GY1, GZ - 0.14), V(CX1 + 0.1, GY1 + 0.22, GZ + 0.14)), oakDark);
  b.add(boxGeo(V(CX0 - 0.14, GY1 + 0.22, GZ - 0.18), V(CX1 + 0.14, GY1 + 0.28, GZ + 0.18)), oak);
  // the sign on top of the header, centre
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.68), new THREE.MeshBasicMaterial({ map: signTex(), color: new THREE.Color(0.92, 0.92, 0.92) })); sign.position.set(0, GY1 + 0.66, GZ + 0.12); root.add(sign);
  b.add(boxGeo(V(-1.78, GY1 + 0.28, GZ + 0.02), V(1.78, GY1 + 1.04, GZ + 0.1)), oakDark);
  b.add(boxGeo(V(-0.25, GY1 + 1.04, GZ + 0.0), V(0.25, GY1 + 1.18, GZ + 0.1)), oakDark);

  // ---- counter props: public side + clerk side ----
  const stamps: { g: THREE.Group }[] = [];
  const docM = (k: string, title: string, o = {}) => lam("minDoc" + k, () => ({ map: docTex("min" + k, title, o) }));
  const flat = (m: THREE.Material, w: number, d: number, x: number, y: number, z: number, yaw: number) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), m); p.position.set(x, y, z); p.rotation.y = yaw; p.receiveShadow = true; root.add(p); return p; };
  // the stamp paper (middle window, clerk side of the grille) + mark + the big stamp
  const SX = 0.05, SZ = -0.77;
  flat(docM("form", "DEMANDE", { lines: 8 }), 0.2, 0.26, SX, CY + 0.002, SZ, 0.08);
  const mark = flat(new THREE.MeshBasicMaterial({ map: stampMarkTex(), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), 0.15, 0.056, SX, CY + 0.004, SZ + 0.04, 0.08 - 0.12);
  mark.layers.set(NOINK);
  const stampG = new THREE.Group(); stampG.position.set(SX, CY, SZ + 0.04); stampG.rotation.y = -0.04; root.add(stampG);
  const stb = new Batch();
  stb.add(boxGeo(V(-0.085, 0.0, -0.035), V(0.085, 0.012, 0.035)), lam("minRubber", () => ({ color: "#7a1a20" })));
  stb.add(boxGeo(V(-0.09, 0.012, -0.04), V(0.09, 0.06, 0.04)), oak);
  stb.add(lathe([[0.012, 0], [0.018, 0.02], [0.014, 0.1], [0.04, 0.14], [0.045, 0.17], [0.02, 0.2], [0, 0.2]], 14).translate(0, 0.06, 0), oakDark);
  stb.build(stampG);
  const pad = new THREE.Group(); pad.position.set(SX + 0.25, CY, SZ - 0.02); root.add(pad);
  const pb = new Batch(); pb.add(boxGeo(V(-0.08, 0, -0.05), V(0.08, 0.02, 0.05)), lam("minTin", () => ({ color: "#3a4a6a" }))); pb.add(boxGeo(V(-0.07, 0.02, -0.04), V(0.07, 0.022, 0.04)), lam("minInk", () => ({ color: "#5a1018" }))); pb.build(pad);
  // public side: pen on a chain, bell, form tray, a citizen's form + envelope at each window
  for (const wx of WINX) {
    flat(docM("pub" + wx, "FORMULAIRE", { lines: 6 }), 0.17, 0.22, wx - 0.18, CY + 0.002, -0.38, 0.2);
    const env = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.008, 0.12), lam("minEnvM", () => ({ map: envTex() }))); env.position.set(wx + 0.15, CY + 0.004, -0.4); env.rotation.y = -0.15; root.add(env);
    seg(b, V(wx + 0.3, CY + 0.005, -0.3), V(wx + 0.42, CY + 0.005, -0.42), 0.006, lam("minPen", () => ({ color: "#1a1a28" })), 6);
  }
  b.add(lathe([[0, 0], [0.045, 0], [0.045, 0.01], [0.035, 0.04], [0.007, 0.06], [0.007, 0.075], [0, 0.075]], 14).translate(1.05, CY, -0.35), brass);
  b.add(boxGeo(V(-3.6, CY, -0.5), V(-3.2, CY + 0.05, -0.25)), oak); for (let i = 0; i < 5; i++) b.add(boxGeo(V(-3.58, CY + 0.05 + i * 0.006, -0.48), V(-3.22 - (i % 2) * 0.01, CY + 0.054 + i * 0.006, -0.27)), i % 2 ? paper : paper2);
  // clerk side: banker's lamps, folder stacks, stamp racks, ink pads, spike file, blotters
  const lamps: { L: THREE.PointLight; gl: THREE.Sprite; base: number; seed: number }[] = [];
  const greenGlass = lamCustom("minGreenGlass", () => { const m = new THREE.MeshPhongMaterial({ color: "#1f7a4a", emissive: "#0e5a30", emissiveIntensity: 0.6, specular: "#d0ffe0", shininess: 90, side: THREE.DoubleSide }); return twoTone(m); });
  for (const wx of WINX) {
    const x = wx - 0.5, g = new THREE.Group(); g.position.set(x, DY, -1.06); root.add(g);
    const lb = new Batch();
    lb.add(boxGeo(V(-0.12, 0, -0.07), V(0.12, 0.025, 0.07)), brass);
    seg(lb, V(0, 0.025, -0.03), V(0, 0.3, -0.03), 0.012, brass, 8); seg(lb, V(-0.08, 0.3, -0.03), V(0.08, 0.3, -0.03), 0.01, brass, 6);
    lb.add(new THREE.CylinderGeometry(0.075, 0.075, 0.32, 18, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).translate(0, 0.34, 0.0), greenGlass);
    lb.add(new THREE.CircleGeometry(0.075, 18, 0, Math.PI).rotateY(Math.PI / 2).rotateX(-Math.PI / 2).translate(-0.16, 0.34, 0), greenGlass);
    lb.build(g);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.3) })); bulb.position.set(0, 0.31, 0); bulb.layers.set(NOINK); g.add(bulb);
    const gl = glow(g, [0, 0.28, 0.02], "#ffcf86", 0.9, 0.9);
    const L = new THREE.PointLight("#ffc87a", 7, 4.2, 1.3); L.position.set(0, 0.25, 0.05); g.add(L);
    lamps.push({ L, gl, base: 7, seed: wx * 3 + 1 });
    // pool of warm light on the desk
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffb860").multiplyScalar(0.55), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pool.position.set(x + 0.1, DY + 0.003, -1.06); pool.layers.set(NOINK); root.add(pool);
    // folder stacks + stamp carousel + ink pad
    let y = DY; for (let i = 0; i < 6; i++) { const h = 0.025 + r() * 0.02; b.add(boxGeo(V(wx - 0.36 - 0.12 + r() * 0.02, y, -1.22), V(wx - 0.36 + 0.13, y + h, -1.2 + 0.26 - r() * 0.02)), pick(r, folderCols)); y += h; } b.add(boxGeo(V(wx - 0.36 - 0.005, DY, -1.13), V(wx - 0.36 + 0.005, y + 0.003, -1.1)), ribbon);
    const rk = new THREE.Group(); rk.position.set(wx + 0.25, DY, -1.12); root.add(rk);
    const rb = new Batch(); rb.add(new THREE.CylinderGeometry(0.1, 0.11, 0.02, 16), brass); seg(rb, V(0, 0, 0), V(0, 0.22, 0), 0.01, brass, 6); rb.add(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 16).translate(0, 0.2, 0), brass);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; rb.add(lathe([[0.01, 0], [0.012, 0.06], [0.02, 0.08], [0, 0.09]], 8).translate(Math.cos(a) * 0.075, 0.12, Math.sin(a) * 0.075), oakDark); rb.add(boxGeo(V(Math.cos(a) * 0.075 - 0.02, 0.1, Math.sin(a) * 0.075 - 0.015), V(Math.cos(a) * 0.075 + 0.02, 0.12, Math.sin(a) * 0.075 + 0.015)), lam("minRubber", () => ({ color: "#7a1a20" }))); }
    rb.build(rk);
    b.add(boxGeo(V(wx + 0.02, DY, -1.04), V(wx + 0.16, DY + 0.018, -0.94)), lam("minTin", () => ({ color: "#3a4a6a" })));
    b.add(boxGeo(V(wx - 0.2, DY, -1.2), V(wx + 0.12, DY + 0.006, -0.97)), lam("minBlotter", () => ({ color: "#2f5a46" })));
    seg(b, V(wx - 0.08, DY, -0.98), V(wx - 0.08, DY + 0.16, -0.98), 0.004, iron, 4); for (let i = 0; i < 4; i++) b.add(new THREE.BoxGeometry(0.1, 0.002, 0.13).rotateY(i * 0.5).translate(wx - 0.08, DY + 0.02 + i * 0.012, -0.98), paper);
    // tall stool tucked aside
    const st = new THREE.Group(); st.position.set(wx - 0.85, 0, -1.75); root.add(st);
    const sb2 = new Batch(); sb2.add(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 18).translate(0, 0.72, 0), oak); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; seg(sb2, V(Math.cos(a) * 0.1, 0.7, Math.sin(a) * 0.1), V(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2), 0.016, oakDark, 6); } sb2.add(new THREE.TorusGeometry(0.16, 0.01, 6, 18).rotateX(Math.PI / 2).translate(0, 0.3, 0), brass); sb2.build(st);
  }

  // ---- back wall: pigeon holes (left), safe + regulator clock (centre), filing cabinets (right), portrait, notices ----
  const PX0 = -5.2, PX1 = -1.45, PY1 = 2.55, PZ = ZB, PD = 0.36, PC = 11, PR = 8;
  const cellW = (PX1 - PX0) / PC, cellH = PY1 / PR;
  for (let i = 0; i <= PC; i++) b.add(boxGeo(V(PX0 + i * cellW - 0.012, 0, PZ), V(PX0 + i * cellW + 0.012, PY1, PZ + PD)), oakDark);
  for (let j = 0; j <= PR; j++) b.add(boxGeo(V(PX0, j * cellH - 0.012, PZ), V(PX1, j * cellH + 0.012, PZ + PD)), oakDark);
  b.add(boxGeo(V(PX0 - 0.05, PY1, PZ), V(PX1 + 0.05, PY1 + 0.1, PZ + PD + 0.05)), oak);
  const flaps: THREE.Mesh[] = [];
  for (let i = 0; i < PC; i++) for (let j = 0; j < PR; j++) {
    if (r() < 0.12) continue;
    const cx = PX0 + (i + 0.5) * cellW, cy = j * cellH + 0.012, n = 1 + Math.floor(r() * 3);
    let y = cy;
    for (let k = 0; k < n; k++) { const h = 0.03 + r() * 0.07, w = cellW * (0.6 + r() * 0.3); if (y + h > cy + cellH - 0.04) break; b.add(boxGeo(V(cx - w / 2, y, PZ + 0.03), V(cx + w / 2, y + h, PZ + PD + 0.02 + r() * 0.05)), r() < 0.55 ? pick(r, [paper, paper2]) : pick(r, folderCols)); if (r() < 0.3) b.add(boxGeo(V(cx - 0.006, y, PZ + PD - 0.05), V(cx + 0.006, y + h + 0.002, PZ + PD + 0.06)), ribbon); y += h; }
    if (r() < 0.18) b.add(new THREE.CylinderGeometry(0.025, 0.025, PD + 0.1, 10).rotateX(Math.PI / 2).translate(cx + (r() - 0.5) * 0.05, y + 0.03, PZ + PD / 2 + 0.05), paper);
    if (r() < 0.14) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2).translate(0, -0.1, 0), lamCustom("minFlap", () => twoTone(new THREE.MeshLambertMaterial({ map: docTex("flap", "NOTE", { lines: 6 }), side: THREE.DoubleSide })))); f.position.set(cx, cy + cellH - 0.05, PZ + PD + 0.02); f.rotation.x = -0.15; f.userData.ph = r() * 6; root.add(f); flaps.push(f); }
  }
  // safe + regulator clock
  const safe = new THREE.Group(); safe.position.set(0, 0, ZB + 0.38); root.add(safe);
  const sfb = new Batch(); sfb.add(boxGeo(V(-0.48, 0.08, -0.38), V(0.48, 1.45, 0.3)), lam("minSafeM", () => ({ color: "#2c4a3c" }))); sfb.add(boxGeo(V(-0.52, 0, -0.4), V(0.52, 0.08, 0.32)), iron);
  sfb.add(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24).rotateX(Math.PI / 2).translate(0.05, 0.85, 0.32), brass); sfb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12).rotateX(Math.PI / 2).translate(0.05, 0.85, 0.35), gold);
  seg(sfb, V(0.25, 0.6, 0.33), V(0.25, 1.05, 0.33), 0.018, brass, 8); sfb.build(safe);
  const sface = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.3), lam("minSafeFace", () => ({ map: safeTex() }))); sface.position.set(0, 0.77, 0.302); safe.add(sface);
  const reg = new THREE.Group(); reg.position.set(0, 2.85, ZB + 0.12); root.add(reg);
  const rgb = new Batch(); rgb.add(boxGeo(V(-0.32, -1.05, -0.1), V(0.32, 0.38, 0.08)), oakDark); rgb.add(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 32).rotateX(Math.PI / 2).translate(0, 0.62, 0), oakDark);
  rgb.add(new THREE.TorusGeometry(0.36, 0.025, 6, 32).translate(0, 0.62, 0.075), brass); rgb.add(boxGeo(V(-0.36, 0.38, -0.1), V(0.36, 0.44, 0.1)), oak); rgb.add(boxGeo(V(-0.36, -1.11, -0.11), V(0.36, -1.05, 0.11)), oak);
  rgb.build(reg);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), new THREE.MeshBasicMaterial({ map: dialTex("regulator", "#f4ecd6"), color: new THREE.Color(0.95, 0.92, 0.86) })); face.position.set(0, 0.62, 0.072); reg.add(face);
  const handsG = new THREE.Group(); handsG.position.set(0, 0.62, 0.074); reg.add(handsG); const setClock = clockHands(handsG, 0.32, 0.002);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.2), new THREE.MeshBasicMaterial({ color: "#2a1c18" })); win.position.set(0, -0.34, 0.081); reg.add(win);
  const glassP = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.2), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending })); glassP.position.set(0, -0.34, 0.1); glassP.layers.set(NOINK); reg.add(glassP);
  const pend = new THREE.Group(); pend.position.set(0, 0.2, 0.085); reg.add(pend);
  pend.add(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.85, 0.008).translate(0, -0.425, 0), brass)); const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24).rotateX(Math.PI / 2), gold); bob.position.y = -0.9; pend.add(bob);
  // filing cabinets
  const cabM = lam("minCabM", () => ({ map: cabinetTex() }));
  for (let i = 0; i < 3; i++) {
    const x0 = 1.45 + i * 1.25, x1 = x0 + 1.2;
    b.add(boxGeo(V(x0, 0, ZB), V(x1, 2.3, ZB + 0.55)), oakDark);
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0), cabM); fm.position.set((x0 + x1) / 2, 1.18, ZB + 0.552); root.add(fm);
    b.add(boxGeo(V(x0 - 0.03, 2.3, ZB), V(x1 + 0.03, 2.38, ZB + 0.6)), oak);
    let y = 2.38; for (let k = 0; k < 3 + i; k++) { const h = 0.05 + r() * 0.06; b.add(boxGeo(V(x0 + 0.15 + r() * 0.1, y, ZB + 0.08), V(x1 - 0.3 - r() * 0.2, y + h, ZB + 0.48)), pick(r, folderCols)); y += h; }
  }
  // one drawer pulled out with index cards
  b.add(boxGeo(V(2.3, 1.0, ZB + 0.55), V(2.5, 1.15, ZB + 0.85)), oak); for (let k = 0; k < 8; k++) b.add(boxGeo(V(2.32, 1.12, ZB + 0.57 + k * 0.035), V(2.48, 1.2, ZB + 0.575 + k * 0.035)), paper);
  // portrait (plain, no one in particular) + notice board + calendar
  const frame = (w: number, h: number, pos: V3, tex: THREE.Texture, m: THREE.Material) => {
    const g = new THREE.Group(); g.position.set(...pos); root.add(g); const fb = new Batch(), t = 0.08;
    fb.add(boxGeo(V(-w / 2 - t, -h / 2 - t, 0), V(w / 2 + t, -h / 2, 0.06)), m); fb.add(boxGeo(V(-w / 2 - t, h / 2, 0), V(w / 2 + t, h / 2 + t, 0.06)), m); fb.add(boxGeo(V(-w / 2 - t, -h / 2, 0), V(-w / 2, h / 2, 0.06)), m); fb.add(boxGeo(V(w / 2, -h / 2, 0), V(w / 2 + t, h / 2, 0.06)), m); fb.build(g);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam("minCanvas" + tex.uuid, () => ({ map: tex }))); c.position.z = 0.02; g.add(c); return g;
  };
  frame(0.8, 1.0, [-3.3, 3.45, ZB + 0.01], portraitTex(), gold);
  frame(1.6, 1.0, [3.3, 3.35, ZB + 0.01], corkTex(), oak);
  const notices: THREE.Mesh[] = [];
  [["AVIS", -0.45, 0.12, 0.08], ["RÈGLEMENT", 0.05, 0.1, -0.05], ["HORAIRES", 0.5, 0.15, 0.1], ["TARIFS", -0.15, -0.25, -0.12], ["AVIS", 0.45, -0.22, 0.05]].forEach(([t2, x, y, rot], i) => {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.39).translate(0, -0.19, 0), lamCustom("minNoticeM" + i, () => twoTone(new THREE.MeshLambertMaterial({ map: noticeTex("n" + i + String(t2), t2 as string), side: THREE.DoubleSide }))));
    n.position.set(3.3 + (x as number), 3.35 + (y as number) + 0.19, ZB + 0.04); n.rotation.z = rot as number; n.userData.ph = i * 1.3; root.add(n); notices.push(n);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), lam("minPin", () => ({ color: "#c81e2a" }))); pin.position.set(3.3 + (x as number), 3.35 + (y as number) + 0.18, ZB + 0.05); root.add(pin);
  });
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), new THREE.MeshBasicMaterial({ map: ctex("minCal", 256, 340, (g) => { g.fillStyle = "#f4ecd6"; g.fillRect(0, 0, 256, 340); g.fillStyle = "#1f3a30"; g.fillRect(0, 0, 256, 110); g.fillStyle = "#f2d27a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "MAI", 128, 58, 200, 76, "900 %spx Georgia, serif"); g.fillStyle = "#2a1a14"; fitText(g, "1925", 128, 140, 180, 34, "700 %spx Georgia, serif"); g.strokeStyle = "rgba(40,30,30,0.5)"; g.lineWidth = 2; for (let rr = 0; rr < 5; rr++) for (let c2 = 0; c2 < 7; c2++) g.strokeRect(14 + c2 * 33, 170 + rr * 32, 30, 28); }), color: new THREE.Color(0.9, 0.88, 0.84) }));
  cal.position.set(-1.1, 3.2, ZB + 0.012); root.add(cal);

  // ---- left wall: two tall windows on the night street ----
  for (const z of WINZ) {
    const xf = X0 - WT / 2;
    for (const s of [-1, 1]) b.add(boxGeo(V(xf - 0.05, WY0, z + s * WW / 2 - 0.06), V(xf + 0.05, WY1, z + s * WW / 2 + 0.06)), oakDark);
    b.add(boxGeo(V(xf - 0.05, WY0, z - WW / 2), V(xf + 0.05, WY0 + 0.08, z + WW / 2)), oakDark); b.add(boxGeo(V(xf - 0.05, WY1 - 0.08, z - WW / 2), V(xf + 0.05, WY1, z + WW / 2)), oakDark);
    b.add(boxGeo(V(xf - 0.04, WY0, z - 0.03), V(xf + 0.04, WY1, z + 0.03)), oakDark); b.add(boxGeo(V(xf - 0.04, 3.2, z - WW / 2), V(xf + 0.04, 3.26, z + WW / 2)), oakDark);
    for (const y of [1.7, 2.45]) b.add(boxGeo(V(xf - 0.02, y - 0.015, z - WW / 2), V(xf + 0.02, y + 0.015, z + WW / 2)), oakDark);
    b.add(boxGeo(V(X0, WY0 - 0.05, z - WW / 2 - 0.08), V(X0 + 0.16, WY0, z + WW / 2 + 0.08)), marble);
    // cast-iron radiator under the window
    for (let k = 0; k < 10; k++) b.add(new THREE.CapsuleGeometry(0.035, 0.5, 3, 8).translate(X0 + 0.16, 0.42, z - 0.5 + k * 0.11), lam("minRadiator", () => ({ color: "#8a9088" })));
    b.add(boxGeo(V(X0 + 0.12, 0.12, z - 0.56), V(X0 + 0.2, 0.16, z + 0.56)), lam("minRadiator", () => ({ color: "#8a9088" })));
    for (const [gy, gz] of [[2.0, -0.3], [3.0, 0.25]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.2), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.set(xf + 0.06, gy, z + gz); m.rotation.y = Math.PI / 2; m.rotation.z = 0.5; m.layers.set(NOINK); root.add(m); }
  }
  const shafts = WINZ.map((z) => shaft(root, [X0 + 0.05, 3.6, z], [X0 + 2.8, 0, z + 0.6], 1.2, "#8fa8ff", 0.07));
  const moonL = new THREE.PointLight("#8aa2ff", 14, 9, 1.0); moonL.position.set(X0 + 1.0, 2.6, -0.2); root.add(moonL);
  const dust = motes(root, [X0 + 0.3, 0.4, -3.4], [X0 + 2.4, 3.6, 3.0], 60, "#c8d6ff", 0.03, 0.7, 6);
  // the street outside (unlit painted night): cobbles, kerb, gas lamp, facades across with lit windows, sky
  const nb = new Batch(), SXF = -15;
  const night = (c: string, map: THREE.Texture | null = null) => new THREE.MeshBasicMaterial({ color: c, map, fog: false });
  nb.add(quad(V(X0 - WT, 0, -30), V(X0 - WT, 0, 30), V(SXF, 0, 30), V(SXF, 0, -30), 1, 1), night("#2a3060"));
  nb.add(boxGeo(V(X0 - WT - 2.2, 0, -30), V(X0 - WT, 0.15, 30)), night("#40487a"));
  nb.add(boxGeo(V(X0 - WT - 2.25, 0, -30), V(X0 - WT - 2.15, 0.17, 30)), night("#5a62a0"));
  const facN = ["#ffffff", "#e6e2ff"].map((c, i) => night("#5a64a2", hausTex("ns" + i, i ? "#e6d4b4" : "#efe2c8")));
  const lits: THREE.MeshBasicMaterial[] = [];
  for (let z = -28, k = 0; z < 28; k++) {
    const w = 8 + r() * 6, top = 13 + r() * 3;
    nb.add(quad(V(SXF, 0, z + w), V(SXF, 0, z), V(SXF, top, z), V(SXF, top, z + w), w / 6, 1), facN[k % 2]);
    nb.add(boxGeo(V(SXF - 1.4, top, z), V(SXF + 0.3, top + 0.4, z + w - 0.2)), night("#6a74b0"));
    nb.add(quad(V(SXF, top + 0.4, z + w), V(SXF, top + 0.4, z), V(SXF - 1.4, top + 3, z), V(SXF - 1.4, top + 3, z + w), 1, 1), night("#3a4476"));
    const lm = new THREE.MeshBasicMaterial({ map: hausTex(k % 2 ? "nL1" : "nL22x", "", true), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: new THREE.Color(1.4, 1.2, 0.9) });
    const lp = new THREE.Mesh(quad(V(SXF + 0.05, 0, z + w), V(SXF + 0.05, 0, z), V(SXF + 0.05, top, z), V(SXF + 0.05, top, z + w), w / 6, 1), lm); lp.layers.set(NOINK); root.add(lp); lits.push(lm);
    z += w;
  }
  nb.build(root, false);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(300, 160), new THREE.MeshBasicMaterial({ map: skyTex(true), fog: false, depthWrite: false })); sky.position.set(-90, 40, 0); sky.rotation.y = Math.PI / 2; sky.layers.set(NOINK); sky.renderOrder = -2; root.add(sky);
  // gas lamp outside between the windows
  const gas = new THREE.Group(); gas.position.set(X0 - WT - 1.6, 0, -0.2); root.add(gas);
  const gb = new Batch(), gm = night("#1a1a2e");
  gb.add(lathe([[0.12, 0], [0.12, 0.3], [0.06, 0.4], [0.05, 3.2], [0.08, 3.3], [0, 3.3]], 12), gm); gb.add(new THREE.ConeGeometry(0.28, 0.25, 4).rotateY(Math.PI / 4).translate(0, 3.85, 0), gm); gb.add(boxGeo(V(-0.17, 3.3, -0.17), V(0.17, 3.35, 0.17)), gm); gb.build(gas);
  const gasGlass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.28).translate(0, 3.55, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 1.0) })); gasGlass.layers.set(NOINK); gas.add(gasGlass);
  const gasGlow = glow(gas, [0, 3.55, 0], "#ffc870", 3.2, 1);
  const gasL = new THREE.PointLight("#ffc070", 6, 7, 1.2); gasL.position.set(X0 + 0.2, 3.0, -0.2); root.add(gasL);

  // ---- public side: queue lane (brass posts + red ropes), benches, writing desk, coat stand, plant, entrance ----
  const ropes: { a: THREE.Vector3; c: THREE.Vector3; m: THREE.Mesh }[] = [];
  const ropeM = lam("minRope", () => ({ color: "#b0202e" }));
  for (const x of [-0.7, 0.7]) {
    const zs = [1.0, 2.2, 3.4];
    for (const z of zs) { b.add(lathe([[0.16, 0], [0.16, 0.03], [0.05, 0.06], [0.025, 0.12], [0.022, 0.86], [0.04, 0.9], [0.045, 0.94], [0.02, 0.98], [0, 0.98]], 16).translate(x, 0, z), brass); }
    for (let i = 0; i < zs.length - 1; i++) {
      const pts: THREE.Vector3[] = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push(V(x, 0.9 - Math.sin(u * Math.PI) * 0.22, zs[i] + 0.04 + u * (zs[i + 1] - zs[i] - 0.08))); }
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018, 6), ropeM); m.castShadow = true; root.add(m);
      ropes.push({ a: pts[0], c: pts[12], m });
    }
  }
  // benches on the right wall
  for (const z0 of [0.3, 2.1]) {
    b.add(boxGeo(V(X1 - 0.5, 0.42, z0), V(X1 - 0.05, 0.47, z0 + 1.6)), oak); b.add(boxGeo(V(X1 - 0.12, 0.47, z0), V(X1 - 0.05, 0.95, z0 + 1.6)), oak);
    for (const z of [z0 + 0.08, z0 + 1.52]) b.add(boxGeo(V(X1 - 0.48, 0, z - 0.03), V(X1 - 0.08, 0.42, z + 0.03)), oakDark);
  }
  const hat = new THREE.Group(); hat.position.set(X1 - 0.3, 0.47, 1.2); root.add(hat);
  const hb = new Batch(); hb.add(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 20), lam("minHat", () => ({ color: "#3a3a48" }))); hb.add(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 18).translate(0, 0.055, 0), lam("minHat", () => ({ color: "#3a3a48" }))); hb.add(new THREE.CylinderGeometry(0.111, 0.111, 0.025, 18).translate(0, 0.02, 0), ribbon); hb.build(hat);
  b.add(boxGeo(V(X1 - 0.42, 0.47, 2.6), V(X1 - 0.2, 0.49, 2.9)), lam("minNews", () => ({ color: "#e8e2d0" })));
  // high writing desk (left front)
  const wd = new THREE.Group(); wd.position.set(-4.9, 0, 4.2); root.add(wd);
  const wb = new Batch(); wb.add(new THREE.BoxGeometry(0.6, 0.04, 1.4).rotateZ(0.2).translate(0, 1.12, 0), oak); for (const z of [-0.6, 0.6]) for (const x of [-0.22, 0.22]) seg(wb, V(x, 0, z), V(x, 1.08 + x * 0.2, z), 0.025, oakDark, 6); wb.add(boxGeo(V(-0.25, 0.3, -0.62), V(0.25, 0.33, 0.62)), oakDark); wb.build(wd);
  for (let i = 0; i < 3; i++) { const p2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.27), docM("wd" + i, "FORMULAIRE", { lines: 6 })); p2.position.set(-4.9 + 0.01, 1.165 + 0.01 * i, 4.2 - 0.4 + i * 0.35); p2.rotation.set(-Math.PI / 2, 0.2, 0); p2.rotation.order = "YXZ"; p2.rotation.set(-Math.PI / 2 + 0.2 * 0, 0, 0); root.add(p2); p2.rotateOnWorldAxis(V(0, 0, 1), 0.2); }
  b.add(lathe([[0, 0], [0.035, 0], [0.04, 0.05], [0.02, 0.06], [0, 0.06]], 12).translate(-4.78, 1.16, 4.75), lamCustom("minInkwell", () => twoTone(new THREE.MeshPhongMaterial({ color: "#1a2a4a", specular: "#ffffff", shininess: 90 }))));
  // coat stand + umbrella stand + potted aspidistra + waste basket
  const cs = new THREE.Group(); cs.position.set(4.25, 0, 5.0); root.add(cs);
  const csb = new Batch(); seg(csb, V(0, 0, 0), V(0, 1.85, 0), 0.03, oakDark, 8); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; seg(csb, V(0, 0.05, 0), V(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3), 0.025, oakDark, 6); seg(csb, V(0, 1.7, 0), V(Math.cos(a + 0.4) * 0.2, 1.82, Math.sin(a + 0.4) * 0.2), 0.012, brass, 6); }
  csb.add(new THREE.CapsuleGeometry(0.17, 0.75, 4, 10).scale(1, 1, 0.5).translate(0.12, 1.2, 0.05), lam("minCoat", () => ({ color: "#4a3a2a" }))); csb.add(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 18).translate(-0.12, 1.86, 0), lam("minHat", () => ({ color: "#3a3a48" }))); csb.add(new THREE.CylinderGeometry(0.09, 0.1, 0.11, 16).translate(-0.12, 1.92, 0), lam("minHat", () => ({ color: "#3a3a48" })));
  csb.build(cs);
  b.add(lathe([[0, 0], [0.12, 0], [0.13, 0.55], [0, 0.55]], 16).translate(3.7, 0, 5.4), lam("minBrassStand", () => ({ color: "#5a6a7a" }))); seg(b, V(3.68, 0.1, 5.4), V(3.62, 0.95, 5.38), 0.018, lam("minUmb", () => ({ color: "#1e1e28" })), 6); seg(b, V(3.74, 0.1, 5.42), V(3.82, 0.9, 5.45), 0.02, lam("minUmb2", () => ({ color: "#2a3a6a" })), 6);
  b.add(lathe([[0, 0], [0.18, 0], [0.24, 0.4], [0.25, 0.45], [0, 0.45]], 18).translate(4.8, 0, -0.05 + 0), lamCustom("minPot", () => twoTone(new THREE.MeshPhongMaterial({ color: "#3a6a8a", specular: "#ffffff", shininess: 60 }))));
  const plant = new THREE.Group(); plant.position.set(4.8, 0.42, -0.05); root.add(plant);
  const leafM = lamCustom("minLeaf", () => twoTone(new THREE.MeshLambertMaterial({ color: "#3f7a3a", side: THREE.DoubleSide })));
  const leaves: THREE.Mesh[] = [];
  for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU + r() * 0.3, l = 0.6 + r() * 0.3; const g2 = new THREE.PlaneGeometry(0.12, l, 1, 4).translate(0, l / 2, 0); const p = g2.attributes.position as THREE.BufferAttribute; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setZ(k, (y / l) ** 2 * 0.25); p.setX(k, p.getX(k) * Math.sin((y / l) * Math.PI) * 1.4); } g2.computeVertexNormals(); const m = new THREE.Mesh(g2, leafM); m.rotation.set(-0.35 - r() * 0.3, a, 0, "YXZ"); m.castShadow = true; plant.add(m); leaves.push(m); }
  b.add(lathe([[0, 0], [0.16, 0], [0.19, 0.42], [0, 0.42]], 14).translate(-1.4, 0, -1.85), lam("minBasket", () => ({ color: "#8a6a3a" })));
  for (let i = 0; i < 4; i++) b.add(new THREE.IcosahedronGeometry(0.06, 0).translate(-1.4 + (i - 1.5) * 0.05, 0.42 + (i % 2) * 0.03, -1.85), paper);
  // entrance doors (closed, glazed; frosted panes lit by the street) + the director's door (right wall)
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -DW : 0, x1 = s < 0 ? 0 : DW;
    b.add(boxGeo(V(x0, 0, ZF + 0.15), V(x1, 0.95, ZF + 0.22)), oakDark); b.add(boxGeo(V(x0, DH - 0.15, ZF + 0.15), V(x1, DH, ZF + 0.22)), oakDark);
    b.add(boxGeo(V(x0, 0, ZF + 0.15), V(x0 + 0.1, DH, ZF + 0.22)), oakDark); b.add(boxGeo(V(x1 - 0.1, 0, ZF + 0.15), V(x1, DH, ZF + 0.22)), oakDark);
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(DW - 0.2, DH - 1.1), new THREE.MeshBasicMaterial({ color: "#5a6aa8", transparent: true, opacity: 0.85 })); gp.position.set((x0 + x1) / 2, (0.95 + DH - 0.15) / 2, ZF + 0.18); gp.rotation.y = Math.PI; root.add(gp);
    b.add(boxGeo(V(s * 0.12 - 0.015, 1.0, ZF + 0.1), V(s * 0.12 + 0.015, 1.3, ZF + 0.15)), brass);
  }
  const sortie = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.24), new THREE.MeshBasicMaterial({ map: ctex("minSortie", 384, 102, (g) => { g.fillStyle = "#1f3a30"; g.fillRect(0, 0, 384, 102); g.strokeStyle = "#d6a443"; g.lineWidth = 6; g.strokeRect(5, 5, 374, 92); g.fillStyle = "#f2d27a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "SORTIE", 192, 54, 300, 62, "700 %spx Georgia, serif"); }) })); sortie.position.set(0, DH + 0.3, ZF - 0.02); sortie.rotation.y = Math.PI; root.add(sortie);
  const ddz = -3.2, ddoor = new THREE.Group(); ddoor.position.set(X1 - 0.02, 0, ddz); root.add(ddoor);
  const ddb = new Batch(); ddb.add(boxGeo(V(-0.06, 0, -0.55), V(0, 2.5, 0.55)), oakDark); ddb.add(boxGeo(V(-0.1, 2.5, -0.65), V(0, 2.62, 0.65)), oak); for (const s of [-1, 1]) ddb.add(boxGeo(V(-0.1, 0, s * 0.6 - 0.05), V(0, 2.5, s * 0.6 + 0.05)), oak); ddb.add(new THREE.SphereGeometry(0.035, 8, 6).translate(-0.09, 1.05, 0.38), brass); ddb.build(ddoor);
  const frost = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.3), new THREE.MeshBasicMaterial({ map: frostTex("BUREAU DU\nDIRECTEUR"), color: new THREE.Color(1.05, 1.0, 0.9) })); frost.position.set(-0.065, 1.75, 0); frost.rotation.y = -Math.PI / 2; ddoor.add(frost);
  b.add(boxGeo(V(X1 - 0.07, 0.95, ddz - 0.43), V(X1 - 0.06, 1.05, ddz + 0.43)), oak);

  // ---- ceiling: pendant globes + fans ----
  const globes: { L: THREE.PointLight; gl: THREE.Sprite }[] = [];
  for (const x of [-2.4, 2.4]) {
    const g = new THREE.Group(); g.position.set(x, H, 0.2); root.add(g);
    seg(b, V(x, H, 0.2), V(x, 3.75, 0.2), 0.012, brass, 6); b.add(lathe([[0, 0], [0.09, 0], [0.04, 0.05], [0, 0.06]], 12).translate(x, 3.68, 0.2), brass);
    const gm2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.5, 1.15) })); gm2.position.set(0, 3.5 - H, 0); gm2.layers.set(NOINK); g.add(gm2);
    const gl = glow(g, [0, 3.5 - H, 0], "#ffd9a0", 1.6, 0.8);
    const L = new THREE.PointLight("#ffdca8", 9, 7, 1.2); L.position.set(0, 3.3 - H, 0); g.add(L); globes.push({ L, gl });
  }
  const fans = [-1.8, 1.8].map((x) => {
    seg(b, V(x, H, 2.4), V(x, 4.42, 2.4), 0.02, brass, 6); b.add(lathe([[0, 0], [0.1, 0.02], [0.12, 0.1], [0.06, 0.16], [0, 0.16]], 14).translate(x, 4.26, 2.4), brass);
    const g = new THREE.Group(); g.position.set(x, 4.3, 2.4); root.add(g);
    const fb = new Batch(); for (let i = 0; i < 4; i++) fb.add(new THREE.BoxGeometry(0.6, 0.012, 0.13).translate(0.36, 0, 0).rotateX(0.12).rotateY((i / 4) * TAU), oak); fb.build(g);
    return g;
  });
  const moth = new THREE.Group(); root.add(moth);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.025).translate(s * 0.0175, 0, 0), new THREE.MeshBasicMaterial({ color: "#d8ccb0", side: THREE.DoubleSide })); w.name = s < 0 ? "L" : "R"; moth.add(w); }
  moth.traverse((o) => o.layers.set(NOINK));

  shell.build(root, false); b.build(root);

  const marks: Record<string, V3> = {
    clerk1: [-2.4, 0, -1.62], clerk2: [0, 0, -1.62], clerk3: [2.4, 0, -1.62],      // behind GUICHET 1 / 2 / 3
    queue1: [0, 0, 0.42], queue2: [0, 0, 1.3], queue3: [0, 0, 2.15], queue4: [0, 0, 3.0], // the lane to GUICHET 2 (queue1 at the window)
    lustig: [0, 0, 3.85],                                                             // end of the queue
    citizen1: [-2.4, 0, 0.42], citizen3: [2.4, 0, 0.42],                             // at GUICHET 1 and 3 (bribing citizens)
    stamp: [SX, CY, SZ + 0.04], drawer1: [WINX[0] + 0.58, DY, DZ0], drawer2: [WINX[1] + 0.58, DY, DZ0], drawer3: [WINX[2] + 0.58, DY, DZ0],
  };
  const cams: SetDef["cams"] = {
    wide: { pos: [4.9, 2.9, 5.5], look: [-0.9, 1.3, -1.2], fov: 45 },
    counter: { pos: [1.15, 1.72, 2.1], look: [0.0, 1.38, -0.9], fov: 38 },
    over: { pos: [1.05, 2.15, -3.35], look: [0.1, 0.95, 0.4], fov: 42 },
    low: { pos: [-1.6, 0.5, 1.6], look: [-0.2, 1.75, -1.0], fov: 40 },
    high: { pos: [3.3, 4.1, 3.7], look: [0.0, 0.7, -0.6], fov: 42 },
    stamp: { pos: [0.55, 1.48, 0.1], look: [0.05, 1.2, -0.8], fov: 38 },
  };
  return {
    name: "ministry", root, marks, cams,
    pose: (t, c) => {
      const dr = cl(c.drawers ?? 0);
      drawers.forEach((g, i) => { g.position.z = -0.32 * sm(cl(dr * 1.6 - i * 0.3)); });
      // stamp: 0 -> 0.5 down, hit at 0.5 (+ a little squash), back up to 1
      const s = cl(c.stamp ?? 0), down = s <= 0.5 ? sm(s / 0.5) : 1 - sm((s - 0.5) / 0.5);
      stampG.position.y = CY + 0.32 * (1 - down) + 0.002; stampG.rotation.z = 0.06 * (1 - down);
      stampG.scale.y = s > 0.47 && s < 0.56 ? 0.94 : 1;
      (mark.material as THREE.MeshBasicMaterial).opacity = s >= 0.5 ? 0.92 : 0;
      // ambient
      setClock(9 + 40 / 60 + t / 60, t); pend.rotation.z = 0.14 * Math.sin(t * Math.PI * 0.8);
      fans.forEach((f, i) => (f.rotation.y = t * (1.6 + i * 0.25) + i));
      lamps.forEach(({ L, gl, base, seed }) => { const f = 0.94 + 0.06 * Math.sin(t * 11 + seed) * Math.sin(t * 4.3 + seed * 2); L.intensity = base * f; gl.material.opacity = 0.8 + 0.2 * f; });
      globes.forEach(({ L, gl }, i) => { const f = 0.95 + 0.05 * Math.sin(t * 7 + i * 3) * Math.sin(t * 2.7 + i); L.intensity = 9 * f; gl.material.opacity = 0.75 + 0.2 * f; });
      gasL.intensity = 6 * (0.88 + 0.12 * Math.sin(t * 9) * Math.sin(t * 3.7)); gasGlow.material.opacity = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 3.7);
      lits.forEach((m, i) => (m.opacity = 0.85 + 0.15 * Math.sin(t * 0.4 + i * 2)));
      shafts.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.07 + 0.015 * Math.sin(t * 0.5 + i)));
      dust.update(t);
      flaps.forEach((f) => (f.rotation.x = -0.12 - 0.12 * Math.max(0, Math.sin(t * 1.3 + f.userData.ph)) * Math.sin(t * 5 + f.userData.ph)));
      notices.forEach((n) => (n.rotation.x = -0.06 * Math.max(0, Math.sin(t * 0.9 + n.userData.ph)) - 0.02));
      leaves.forEach((l, i) => (l.rotation.z = 0.03 * Math.sin(t * 1.1 + i)));
      ropes.forEach(({ m }, i) => (m.rotation.x = 0.0 * i));
      const a = t * 2.3; moth.position.set(2.4 + Math.cos(a) * 0.35, 3.45 + Math.sin(t * 3.1) * 0.12, 0.2 + Math.sin(a) * 0.35); moth.rotation.y = -a;
      const fl = Math.sin(t * 40) * 0.9; moth.children.forEach((w) => (w.rotation.y = w.name === "L" ? fl : -fl));
      void lerp;
    },
  };
};
const poolTex = () => ctex("minPool", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
