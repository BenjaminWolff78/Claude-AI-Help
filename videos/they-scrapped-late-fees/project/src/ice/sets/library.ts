// "They Scrapped Late Fees and Got a Truckload of Books Back" (2026-11-16): ONE connected set so the camera can move
// through doors, slots and windows. Local metres, y up.
//  STREET: near sidewalk y 0 (z -2.6..1.0), kerb at z 1.0, street y -0.15 (z 1.0..10.6), far sidewalk y 0 (z 10.6..13.6),
//    brick row houses with their fronts at z 13.6 facing -z (Dwayne's flat is the 2nd floor at x 0..5 behind a real window).
//  LIBRARY: limestone front wall at z -8 (x -10..10), 8 stone steps from z -2.6 (bottom) to the landing at y 1.44
//    (z -5.6..-8), 4 columns at z -6.4, open double doors x -1.3..1.3. The BOOK RETURN bin stands on the sidewalk at
//    LIB.BIN with the LATE FEES sign on a post beside it.
//  INSIDE (floor y 1.44): main hall z -8..-26, the front desk at z -13 (Gary's chair behind it), shelves along the walls;
//    behind the desk the RETURN ROOM (x -10..-2, z -14..-24: the chute, the book mountain, the tally chart) and the
//    BOARD ROOM behind a glass wall (x 2..10, z -14..-24: the long table, the whiteboard).
// Controls (pose c.*): hatch 0..1 (bin door open), binFill 0..1, flap 0..1 (slot flap pushed in), signP 0..2 (0 on its
//  post, 1 held by Marge at c.signX/Y/Z, 2 tossed away along an arc by c.signFly 0..1), told 0..1 (TOLD YOU sign),
//  jar 0..1 (cookie jar on the bin) + jarLid 0..1 (lid shut), truckZ (rear axle z), truckX, tailgate 0..1, truckBooks 0..1,
//  truckOn 0/1, books 0..1 (book wave down the steps), mountain 0..1, pour 0..1 (books out of the chute), tally 0..1,
//  lamps 0..1 (street lamps), libLit 0..1 (library windows glow at night), blinds 0..1 (Dwayne's blinds shut),
//  closet 0..1 (closet door bursts), envelope 0..1 (the overdue envelope through his mail slot), coffee 0..1 (the spill),
//  ring 0..1 (mug lifted: the coffee ring), board 0..1 (FREE-FOR-ALL MARGE written), ledgerIn 0..1, can 0..1 (Dwayne in
//  the trash can: lid down) + canX, canHop, tv 0..1, dayDust 0..1.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, quad } from "../build";
import { ctex, rng, rep, planksHD, beamHD, stoneHD, facadeHD, roofHD } from "../paint";
import { NOINK } from "../ink";
import { lamp, glow, mist, shaft, crate } from "../setkit";
import { swayMaterial } from "../sway";
import { barkTex, leafyTree, leafCardMat, smoothIco } from "./brickyard";
import { sedan } from "./sedan";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)")); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const M = (key: string, color: string, map?: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) => lam("lb" + key, () => ({ color, ...(map ? { map } : {}), ...extra }));
const unlit = (map: THREE.Texture, k = 1) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k), toneMapped: true });

export const LIB = {
  BIN: [3.0, 0, -1.6] as V3, SIGNPOST: [4.15, 0, -1.45] as V3, STEP0: -2.6, RISE: 0.18, RUN: 0.375, FLOOR: 1.44,
  DESK: [0, 1.44, -13] as V3, GARY_SEAT: [0.7, 1.44, -13.75] as V3, BOARD_HEAD: [6.0, 1.44, -15.2] as V3,
  CHUTE: [-9.6, 4.0, -18.5] as V3, MOUNTAIN: [-7.2, 1.44, -19.0] as V3, TALLY: [-4.6, 3.6, -23.85] as V3,
  APT_WIN: [2.6, 5.2, 13.6] as V3, APT_DOOR: [3.85, 3.6, 17.55] as V3, APT_FLOOR: 3.6,
  MAILBOX: [-3.4, 0, 11.4] as V3, CAN: [-1.6, 0, 11.5] as V3,
};
/** step height under a point on the stairs (z), smooth over 0.12 m at each nosing (wheels roll over the edges) */
export const stepY = (z: number) => {
  let y = 0;
  for (let i = 0; i < 8; i++) { const edge = LIB.STEP0 - LIB.RUN * i; y += LIB.RISE * sm((edge - z) / 0.12 + 0.5); }
  return z < -5.6 ? LIB.FLOOR : y;
};

// ---------------- textures ----------------
const asphalt = () => ctex("lbAsphalt2", 1024, 1024, (g, r) => {
  g.fillStyle = "#5a5a60"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70; i++) blot(g, r() * 1024, r() * 1024, 60 + r() * 160, r() < 0.5 ? "rgba(40,40,46,0.25)" : "rgba(120,118,112,0.16)");
  for (let i = 0; i < 26000; i++) { const v = r() < 0.5 ? 30 + r() * 30 : 120 + r() * 70; g.fillStyle = `rgba(${v},${v},${v + 4},${0.25 + r() * 0.4})`; g.fillRect(r() * 1024, r() * 1024, 1 + r() * 2.5, 1 + r() * 2.5); }
  for (let i = 0; i < 9; i++) { let x = r() * 1024, y = r() * 1024; g.strokeStyle = "rgba(28,28,32,0.6)"; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 4; i++) { const x = r() * 800, y = r() * 800; g.fillStyle = "rgba(36,36,40,0.5)"; g.fillRect(x, y, 120 + r() * 160, 80 + r() * 120); }
});
const concrete = () => ctex("lbConcrete2", 1024, 1024, (g, r) => {
  g.fillStyle = "#bdb6aa"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 60; i++) blot(g, r() * 1024, r() * 1024, 50 + r() * 140, r() < 0.5 ? "rgba(140,130,118,0.2)" : "rgba(230,226,216,0.18)");
  for (let i = 0; i < 16000; i++) { g.fillStyle = r() < 0.5 ? "rgba(90,84,76,0.16)" : "rgba(255,255,250,0.14)"; g.fillRect(r() * 1024, r() * 1024, 1 + r() * 2, 1 + r() * 2); }
  g.strokeStyle = "rgba(80,74,66,0.75)"; g.lineWidth = 5; for (const p of [0, 512]) { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 1024); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(1024, p); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(70,66,60,0.55)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 4 + r() * 6, 3 + r() * 5, 0, 0, TAU); g.fill(); }   // old gum
  for (let i = 0; i < 6; i++) { let x = r() * 1024, y = r() * 1024; g.strokeStyle = "rgba(70,64,56,0.55)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 70; g.lineTo(x, y); } g.stroke(); }
});
const limestone = () => stoneHD("lbLime", ["#e2d6c0", "#d8cbb2", "#e8dcc8", "#d2c4aa"], "#b0a088");
const darkStone = () => stoneHD("lbStep", ["#cfc4b0", "#c4b8a2", "#d6ccb8", "#beb19a"], "#9a8c76");
const spinesTex = (k: number) => ctex("lbSpines" + k, 512, 256, (g, r) => {
  const cols = ["#7a2a24", "#2a3e66", "#3e5a2e", "#6a4a24", "#5a2a4a", "#a0782a", "#24485a", "#8a3a2a", "#3a3a48", "#7a6a3a", "#2a5a5a", "#9a5a3a", "#5a5a7a", "#c4a24a", "#2f6b4f"];
  g.fillStyle = "#3a2a1c"; g.fillRect(0, 0, 512, 256);
  for (let x = 2; x < 510;) { const w = 9 + r() * 20, h = 150 + r() * 100, c = cols[Math.floor(r() * cols.length)]; g.fillStyle = c; g.fillRect(x, 256 - h, w - 1.5, h);
    g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(x, 256 - h, 2.5, h); g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(x + w - 4, 256 - h, 2.5, h);
    if (r() < 0.7) { g.fillStyle = r() < 0.5 ? "rgba(240,214,140,0.85)" : "rgba(250,246,236,0.8)"; g.fillRect(x + 2, 256 - h + 14 + r() * 20, w - 5, 4); g.fillRect(x + 2, 256 - h * 0.4, w - 5, 3); }
    if (r() < 0.3) { g.fillStyle = "#f4f0e2"; g.fillRect(x + 1, 226, w - 3, 14); }   // call-number labels
    x += w + (r() < 0.06 ? 10 + r() * 16 : 0); }
});
const ledgerSheet = () => ctex("lbTally2", 640, 512, (g) => {
  g.fillStyle = "#f6f2e6"; g.fillRect(0, 0, 640, 512); g.strokeStyle = "rgba(90,140,200,0.45)"; g.lineWidth = 2; for (let y = 90; y < 470; y += 38) { g.beginPath(); g.moveTo(40, y); g.lineTo(600, y); g.stroke(); }
  g.fillStyle = "#2a2a3a"; g.font = "900 60px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.fillText("RETURNS", 320, 64);
  g.strokeStyle = "#2a2a3a"; g.lineWidth = 5; g.beginPath(); g.moveTo(70, 90); g.lineTo(70, 470); g.lineTo(610, 470); g.stroke();
  g.font = "700 26px Arial"; g.fillStyle = "#3a3a4a"; ["WK1", "WK2", "WK3"].forEach((t, i) => g.fillText(t, 190 + i * 170, 500));
});
const bookCover = (k: number) => ctex("lbCover" + k, 128, 160, (g, r) => { const c = ["#a83a2c", "#2c5a8a", "#3e7a3a", "#c4902a", "#6a3a6a", "#2a6a6a", "#8a5a2a", "#4a4a6a"][k % 8]; g.fillStyle = c; g.fillRect(0, 0, 128, 160); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(0, 0, 14, 160); g.fillStyle = "rgba(250,240,210,0.85)"; g.fillRect(28, 30 + r() * 20, 76, 10); g.fillRect(36, 52 + r() * 20, 60, 6); g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(0, 150, 128, 10); });
const pageEdge = () => ctex("lbPages", 128, 32, (g, r) => { g.fillStyle = "#efe6d0"; g.fillRect(0, 0, 128, 32); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(150,130,100,${0.15 + r() * 0.2})`; g.fillRect(0, r() * 32, 128, 1); } });

export const library = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), bIn = new Batch();
  const r0 = rng(1611);
  // ===================== STREET =====================
  const asM = M("Asph", "#ffffff", rep(asphalt(), 1, 1)); { const t = asM.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 2); }
  b.add(quad(V(-60, -0.15, 10.6), V(60, -0.15, 10.6), V(60, -0.15, 1.0), V(-60, -0.15, 1.0), 1, 1), asM);
  const cM = M("Conc", "#b9b0a2", concrete()); { const t = cM.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 1.8); }
  b.add(quad(V(-60, 0, 1.0), V(60, 0, 1.0), V(60, 0, -2.6), V(-60, 0, -2.6), 1, 1), cM);
  const cM2 = M("Conc2", "#b2aa9e", concrete()); { const t = cM2.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 1.5); }
  b.add(quad(V(-60, 0, 13.6), V(60, 0, 13.6), V(60, 0, 10.6), V(-60, 0, 10.6), 1, 1), cM2);
  // plaza either side of the stairs (the sidewalk runs back to the building line)
  b.add(quad(V(-60, 0, -2.6), V(-5.6, 0, -2.6), V(-5.6, 0, -8), V(-60, 0, -8), 1, 1), cM); b.add(quad(V(5.6, 0, -2.6), V(60, 0, -2.6), V(60, 0, -8), V(5.6, 0, -8), 1, 1), cM);
  const kerbM = M("Kerb", "#c8c2b6", concrete());
  for (const z of [1.0, 10.6]) b.add(bx(120, 0.17, 0.18).translate(0, -0.065, z + (z < 5 ? -0.05 : 0.05)), kerbM);
  // lane markings: dashed double yellow centre, white edge lines
  const yel = M("Yel", "#e6b83a", undefined, { emissive: "#2a1e00" }), wht = M("Wht", "#ece8de");
  for (let x = -58; x < 58; x += 4) { b.add(bx(2.2, 0.01, 0.1).translate(x, -0.143, 5.72), yel); b.add(bx(2.2, 0.01, 0.1).translate(x, -0.143, 5.92), yel); }
  for (const z of [1.45, 10.15]) b.add(bx(120, 0.01, 0.12).translate(0, -0.143, z), wht);
  // crosswalk in front of the library
  for (let k = 0; k < 8; k++) b.add(bx(0.55, 0.012, 8.8).translate(-8.6 + k * 1.0, -0.142, 5.8), wht);
  // a manhole and a drain grate
  { const mh = M("Manhole", "#4a4848", ctex("lbManhole", 256, 256, (g, r) => { g.fillStyle = "#555352"; g.beginPath(); g.arc(128, 128, 124, 0, TAU); g.fill(); g.strokeStyle = "#3a3838"; g.lineWidth = 6; for (let k = 1; k < 6; k++) { g.beginPath(); g.arc(128, 128, k * 22, 0, TAU); g.stroke(); } g.fillStyle = "rgba(255,255,255,0.12)"; for (let i = 0; i < 400; i++) g.fillRect(r() * 256, r() * 256, 2, 2); })); b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 24).translate(6.5, -0.14, 3.6), mh); }
  // 3D ground near the lens: fallen leaves and grit on the near sidewalk (instanced cards, varied colour)
  { const leafT = ctex("lbLeafFall", 64, 64, (g) => { g.fillStyle = "#c8742a"; g.beginPath(); g.ellipse(32, 32, 26, 14, 0.4, 0, TAU); g.fill(); g.strokeStyle = "#7a3a14"; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 44); g.lineTo(54, 20); g.stroke(); });
    const lfM = new THREE.MeshLambertMaterial({ map: leafT, alphaTest: 0.5, side: THREE.DoubleSide, vertexColors: false }), r = rng(41), M4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const geo = new THREE.PlaneGeometry(0.11, 0.11).rotateX(-Math.PI / 2); const inst = new THREE.InstancedMesh(geo, lfM, 420);
    for (let i = 0; i < 420; i++) { const x = (r() - 0.5) * 30, z = -2.5 + r() * 3.4, far = r() < 0.35; q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, r() * TAU, (r() - 0.5) * 0.4)); M4.compose(V(x, 0.012 + r() * 0.01, far ? 10.8 + r() * 2.6 : z), q, V(0.7 + r() * 0.8, 1, 0.7 + r() * 0.8)); inst.setMatrixAt(i, M4); inst.setColorAt(i, new THREE.Color().setHSL(0.05 + r() * 0.08, 0.6, 0.35 + r() * 0.25)); }
    inst.receiveShadow = true; root.add(inst);
    const peb = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.018, 0), M("Peb", "#8a8478"), 900);
    for (let i = 0; i < 900; i++) { M4.compose(V((r() - 0.5) * 24, 0.008, -2.5 + r() * 3.4), q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), V(0.5 + r() * 1.4, 0.5 + r(), 0.5 + r() * 1.4)); peb.setMatrixAt(i, M4); } peb.castShadow = true; peb.receiveShadow = true; root.add(peb); }

  // ===================== LIBRARY EXTERIOR =====================
  const limeT = limestone(), limeM = M("Lime", "#ffffff", limeT); { (limeM.map as THREE.Texture).wrapS = (limeM.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (limeM.map as THREE.Texture).repeat.set(5, 3); }
  const stepM = M("StepM", "#cfc6b8", darkStone()); { (stepM.map as THREE.Texture).wrapS = (stepM.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (stepM.map as THREE.Texture).repeat.set(4, 0.3); }
  const trimM = M("Trim", "#efe6d4", limestone());
  // the stairs (each step a slab with a rounded nosing shadow line)
  for (let i = 0; i < 8; i++) { const z1 = LIB.STEP0 - LIB.RUN * i, y1 = LIB.RISE * (i + 1); b.add(bx(10, y1, LIB.RUN + 0.01).translate(0, y1 / 2, z1 - LIB.RUN / 2), stepM); b.add(bx(10.02, 0.025, 0.04).translate(0, y1 - 0.02, z1 - 0.015), M("Nose", "#b8ac98")); }
  b.add(bx(20, LIB.FLOOR, 2.4).translate(0, LIB.FLOOR / 2, -6.8), stepM);   // landing
  // cheek walls with bronze lamps
  for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(-2.6, 0); sh.lineTo(-2.6, 0.62); sh.lineTo(-5.6, 0.62 + 1.44); sh.lineTo(-8, 2.06); sh.lineTo(-8, 0); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(s * 5.0 + (s > 0 ? 0.6 : 0), 0, 0); b.add(g, limeM); }
  // facade: front wall with door + window openings (boxes around them), plinth, cornice, frieze, pediment
  const W0 = -10, W1 = 10, FZ = -8, FY0 = LIB.FLOOR, FY1 = 10.2;
  const wallPiece = (x0: number, x1: number, y0: number, y1: number) => b.add(bx(x1 - x0, y1 - y0, 0.5).translate((x0 + x1) / 2, (y0 + y1) / 2, FZ - 0.25), limeM);
  wallPiece(W0, -8.6, FY0, FY1); wallPiece(-6.6, -1.6, FY0, FY1); wallPiece(1.6, 6.6, FY0, FY1); wallPiece(8.6, W1, FY0, FY1);   // piers between window bays (windows x -8.6..-6.6 and 6.6..8.6, door -1.6..1.6)
  for (const [x0, x1] of [[-8.6, -6.6], [6.6, 8.6]]) { wallPiece(x0, x1, FY0, FY0 + 1.2); wallPiece(x0, x1, FY0 + 5.4, FY1); }
  wallPiece(-1.6, 1.6, FY0 + 3.6, FY1);
  b.add(bx(20.6, FY0, 0.7).translate(0, FY0 / 2, FZ - 0.2), trimM);   // plinth band
  b.add(bx(21.2, 0.5, 1.3).translate(0, FY1 + 0.25, FZ + 0.1), trimM); b.add(bx(21.6, 0.18, 1.5).translate(0, FY1 + 0.6, FZ + 0.15), trimM);   // cornice
  // portico: 4 fluted columns, entablature with carved letters, pediment
  const fluteT = ctex("lbFlute", 256, 64, (g) => { g.fillStyle = "#e6dac6"; g.fillRect(0, 0, 256, 64); for (let k = 0; k < 16; k++) { const gr = g.createLinearGradient(k * 16, 0, k * 16 + 16, 0); gr.addColorStop(0, "rgba(120,100,70,0.35)"); gr.addColorStop(0.5, "rgba(255,255,255,0.15)"); gr.addColorStop(1, "rgba(120,100,70,0.35)"); g.fillStyle = gr; g.fillRect(k * 16, 0, 16, 64); } });
  const colM = M("Col", "#ffffff", fluteT);
  for (const x of [-3.9, -1.3, 1.3, 3.9]) { b.add(new THREE.CylinderGeometry(0.34, 0.39, 5.6, 24, 1, true).translate(x, LIB.FLOOR + 2.95, -6.4), colM); b.add(bx(0.95, 0.22, 0.95).translate(x, LIB.FLOOR + 0.11, -6.4), trimM); b.add(new THREE.CylinderGeometry(0.5, 0.36, 0.32, 16).translate(x, LIB.FLOOR + 5.9, -6.4), trimM); b.add(bx(1.0, 0.16, 1.0).translate(x, LIB.FLOOR + 6.13, -6.4), trimM); }
  const friezeT = ctex("lbFrieze", 2048, 256, (g, r) => { g.fillStyle = "#e4d8c2"; g.fillRect(0, 0, 2048, 256); for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,120,90,0.12)" : "rgba(255,255,250,0.12)"; g.fillRect(r() * 2048, r() * 256, 2, 2); }
    g.font = "900 150px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(90,74,54,0.85)"; g.fillText("PUBLIC  LIBRARY", 1024 + 4, 136 + 5); g.fillStyle = "#f4ecdc"; g.fillText("PUBLIC  LIBRARY", 1024, 136); });
  b.add(bx(9.6, 1.1, 1.3).translate(0, LIB.FLOOR + 6.75, -6.55), trimM);
  b.add(quad(V(-4.7, LIB.FLOOR + 6.3, -5.89), V(4.7, LIB.FLOOR + 6.3, -5.89), V(4.7, LIB.FLOOR + 7.2, -5.89), V(-4.7, LIB.FLOOR + 7.2, -5.89), 1, 1), M("Frieze", "#ffffff", friezeT));
  { const sh = new THREE.Shape(); sh.moveTo(-5.0, 0); sh.lineTo(5.0, 0); sh.lineTo(0, 1.6); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 1.3, bevelEnabled: false }); g.translate(0, LIB.FLOOR + 7.3, -7.2); b.add(g, trimM); }
  b.add(bx(10.4, 0.2, 2.6).translate(0, LIB.FLOOR + 7.3, -6.7), trimM);   // portico ceiling slab
  // tall windows with warm interior glow (night: c.libLit), mullions
  const winGlowT = ctex("lbWinGlow", 256, 512, (g, r) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#ffd9a0"); gr.addColorStop(1, "#e89a4a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512); g.fillStyle = "rgba(90,50,24,0.55)"; for (let k = 0; k < 6; k++) g.fillRect(0, 70 + k * 74, 256, 14); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${120 + r() * 80},${60 + r() * 40},30,0.5)`; g.fillRect(r() * 256, 70 + Math.floor(r() * 6) * 74 - 40 * r(), 6, 40); } });
  const winDayT = ctex("lbWinDay", 256, 512, (g, r) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#9ab6d8"); gr.addColorStop(0.5, "#6a7e98"); gr.addColorStop(1, "#5a5048"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512); g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(20, 0); g.lineTo(90, 0); g.lineTo(10, 300); g.lineTo(0, 300); g.fill(); });
  const winDayM = M("WinDay", "#ffffff", winDayT, { emissive: "#101418" }), winNightM = unlit(winGlowT, 1.15); winNightM.visible = false;
  const libWins: THREE.Mesh[] = [];
  for (const x of [-7.6, 7.6]) { for (const m of [winDayM, winNightM]) { const me = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.2), m); me.position.set(x, FY0 + 3.3, FZ + 0.01); root.add(me); if (m === winNightM) libWins.push(me); }
    for (const dx of [-0.5, 0.5]) b.add(bx(0.08, 4.2, 0.1).translate(x + dx, FY0 + 3.3, FZ + 0.05), M("Mull", "#3e4a42")); for (const y of [1.6, 3.0, 4.4]) b.add(bx(2.0, 0.08, 0.1).translate(x, FY0 + y, FZ + 0.05), M("Mull", "#3e4a42"));
    b.add(bx(2.3, 0.18, 0.4).translate(x, FY0 + 1.12, FZ + 0.15), trimM); b.add(bx(2.4, 0.3, 0.35).translate(x, FY0 + 5.55, FZ + 0.12), trimM); }
  // the double doors (oak, glass panes, brass push bars), swung inward and open
  const oak = M("Oak", "#8a5a34", beamHD());
  for (const s of [-1, 1]) { const leaf = new THREE.Group(); leaf.position.set(s * 1.6, FY0, FZ - 0.05); leaf.rotation.y = s * 1.35; root.add(leaf);
    const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; leaf.add(me); };
    add(bx(1.58, 3.55, 0.08).translate(-s * 0.79, 1.78, 0), oak); add(bx(1.2, 1.6, 0.09).translate(-s * 0.79, 2.4, 0), M("DoorGlass", "#8aa4b8", undefined, { emissive: "#182028" })); add(bx(0.9, 0.06, 0.12).translate(-s * 0.79, 1.15, 0.05), M("Brass", "#c49a4a")); }
  b.add(bx(3.4, 0.25, 0.6).translate(0, FY0 + 3.7, FZ + 0.1), trimM);   // door head
  // a bronze plaque and the book-drop sign on the stair wall
  // two bronze lamp posts on the cheek walls (lit at dusk/dawn) + street lamps along the kerbs
  const posts = [[-5.3, 2.06 + 1.6, -6.2], [5.3, 2.06 + 1.6, -6.2]].map((p) => lamp(root, p as V3, "#ffd28a", 0, 7, "post"));
  const street = [[-12, 4.1, 0.6], [12, 4.1, 0.6], [-12, 4.1, 11.0], [12, 4.1, 11.0], [0, 4.1, 11.0]].map((p) => lamp(root, p as V3, "#ffd8a0", 0, 9, "post"));

  // ===================== THE BOOK RETURN BIN =====================
  const binG = new THREE.Group(); binG.position.set(...LIB.BIN); root.add(binG);
  const binM = M("BinTeal", "#2f7a86", undefined, { emissive: "#06161a" }), binDk = M("BinDk", "#1f4e58"), steel = M("Steel", "#9aa0a8");
  const binLabel = ctex("lbBinLabel", 512, 256, (g) => { g.fillStyle = "#2f7a86"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#f4f0e2"; g.font = "900 92px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BOOK", 256, 74); g.fillText("RETURN", 256, 178); });
  { const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3 = [0, 0, 0]) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.castShadow = true; me.receiveShadow = true; binG.add(me); return me; };
    add(new RoundedBoxGeometry(0.92, 1.0, 0.72, 4, 0.05), binM, [0, 0.62, 0]);
    add(new THREE.CylinderGeometry(0.36, 0.36, 0.92, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2), binM, [0, 1.12, 0]);
    for (const sx of [-0.4, 0.4]) for (const sz of [-0.28, 0.28]) add(bx(0.06, 0.12, 0.06), binDk, [sx, 0.06, sz]);
    add(bx(0.62, 0.15, 0.02), unlit(binLabel, 0.9), [0, 0.25, 0.365]);   // a strip under the hatch
    { const sl = add(new THREE.PlaneGeometry(0.62, 0.31), unlit(binLabel, 0.9), [0.462, 0.66, 0]); sl.rotation.y = Math.PI / 2; sl.castShadow = false; }   // big label on the street side
    add(bx(0.58, 0.08, 0.06), binDk, [0, 1.0, 0.36]);   // slot frame
    add(bx(0.5, 0.035, 0.02), M("SlotDark", "#3a2a1e"), [0, 1.0, 0.395]);   // slot (warm dark brown, never black)
  }
  // the slot flap (pushed in by a book: c.flap) and the front hatch (hinged on its left edge: c.hatch), padlock hasp
  const flap = new THREE.Mesh(bx(0.52, 0.11, 0.015), M("Flap", "#3a8a96")); flap.position.set(0, 1.06, 0.39); flap.geometry.translate(0, -0.055, 0); binG.add(flap);
  const hatch = new THREE.Group(); hatch.position.set(-0.3, 0.55, 0.37); binG.add(hatch);
  { const hm = new THREE.Mesh(bx(0.6, 0.36, 0.03).translate(0.3, 0, 0), M("Hatch", "#357f8c")); hm.castShadow = true; hatch.add(hm); const kh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12).rotateX(Math.PI / 2).translate(0.52, 0, 0.02), M("Brass2", "#d8ac4a")); hatch.add(kh); const kh2 = new THREE.Mesh(bx(0.006, 0.022, 0.01).translate(0.52, 0, 0.031), M("KeyHole", "#3a2a1a")); hatch.add(kh2); }
  // inside the bin: warm brown walls (the camera dives in), a spider on a thread, a leaf, the books (binFill)
  const binIn = M("BinIn", "#8a5e3a", undefined, { emissive: "#2a1a0c" }); { const ib = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.9, 0.62), binIn); ib.material.side = THREE.BackSide; ib.position.set(0, 0.62, 0); binG.add(ib); }
  const binBooks = new THREE.Group(); binG.add(binBooks);
  { const r = rng(5); for (let i = 0; i < 26; i++) { const me = new THREE.Mesh(bx(0.17, 0.04 + r() * 0.03, 0.24), M("BkC" + (i % 8), ["#a83a2c", "#2c5a8a", "#3e7a3a", "#c4902a", "#6a3a6a", "#2a6a6a", "#8a5a2a", "#4a4a6a"][i % 8])); me.position.set((r() - 0.5) * 0.55, 0.2 + (i / 26) * 0.7, (r() - 0.5) * 0.35); me.rotation.set((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6); me.userData.k = i / 26; binBooks.add(me); } }
  const spider = new THREE.Group(); binG.add(spider);
  { const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 1, 4).translate(0, -0.5, 0), new THREE.MeshBasicMaterial({ color: "#e8e4dc" })); spider.add(thread); const body = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), M("Spider", "#3a2a24")); body.name = "body"; spider.add(body); for (let k = 0; k < 8; k++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.05, 3), M("Spider", "#3a2a24")); leg.position.set(Math.cos(k / 8 * TAU) * 0.025, 0, Math.sin(k / 8 * TAU) * 0.025); leg.rotation.z = Math.cos(k / 8 * TAU) * 1.0; body.add(leg); } spider.position.set(0.1, 1.1, 0.05); }
  const binLeaf = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshLambertMaterial({ map: ctex("lbLeafFall", 64, 64, () => {}), alphaTest: 0.5, side: THREE.DoubleSide })); binG.add(binLeaf);
  // the LATE FEES sign on its post (c.signP)
  const signG = new THREE.Group(); root.add(signG);
  const signT = ctex("lbLateSign2", 512, 384, (g) => { g.fillStyle = "#f4efe2"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "#a8282a"; g.lineWidth = 22; g.strokeRect(11, 11, 490, 362); g.fillStyle = "#a8282a"; g.font = "900 104px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LATE", 256, 96); g.fillText("FEES", 256, 196); g.fillStyle = "#2a2a3a"; g.font = "900 70px Arial Black, Arial, sans-serif"; g.fillText("10¢ A DAY", 256, 300); });
  { const pl = new THREE.Mesh(bx(0.66, 0.5, 0.025), [M("SignBack", "#c8c2b4"), M("SignBack", "#c8c2b4"), M("SignBack", "#c8c2b4"), M("SignBack", "#c8c2b4"), unlit(signT, 0.95), M("SignBack", "#c8c2b4")]); pl.castShadow = true; signG.add(pl); }
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8).translate(0, 0.675, 0), steel); signPost.position.set(...LIB.SIGNPOST); signPost.castShadow = true; root.add(signPost);
  // TOLD YOU (handwritten, taped across the bin's slot face) and the cookie jar on the lid
  const toldT = ctex("lbTold", 512, 256, (g, r) => { g.fillStyle = "#f8f4e8"; g.fillRect(0, 0, 512, 256); g.fillStyle = "rgba(200,190,170,0.4)"; g.fillRect(0, 0, 70, 30); g.fillRect(442, 0, 70, 30); g.fillStyle = "#1e2a6a"; g.font = "italic 900 92px Comic Sans MS, Arial, sans-serif";   /* r: 118px clipped to "OLD YO" */ g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("TOLD YOU", 256 + (r() - 0.5) * 4, 140); });
  const told = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), unlit(toldT, 0.95)); told.position.set(0, 0.83, 0.375); binG.add(told);
  const jar = new THREE.Group(); jar.position.set(0.22, 1.48, 0.05); binG.add(jar);
  { const jg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.22, 20), new THREE.MeshLambertMaterial({ color: "#d8ecf0", transparent: true, opacity: 0.55 })); jg.position.y = 0.11; jar.add(jg); const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.12, 16), M("Cookies", "#c8904a")); ck.position.y = 0.07; jar.add(ck); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.03, 20), M("JarLid", "#c8352e")); lid.name = "lid"; lid.geometry.translate(0.11, 0, 0); lid.position.set(-0.11, 0.235, 0); jar.add(lid); }

  // ===================== THE PICKUP TRUCK (rear toward the library) =====================
  const truck = new THREE.Group(); root.add(truck); const truckBody = new THREE.Group(); truck.add(truckBody);
  const red = lam("lbTruckRed", () => ({ color: "#c0302a", emissive: "#2a0404" })), chrome = M("Chrome", "#dfe2e8"), tyre = M("Tyre", "#2c2a2e"), glassT = M("TGlass2", "#9ab8d4", undefined, { emissive: "#0c1420", transparent: true, opacity: 0.32, depthWrite: false });   /* Dwayne reads through the cab windows */
  const WB = 3.1;   // wheelbase; truck local: rear axle at z 0, front axle at z +WB (nose toward +z)
  { const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; truckBody.add(me); return me; };
    add(new RoundedBoxGeometry(1.9, 0.62, 1.4, 3, 0.08).translate(0, 0.86, WB + 0.55), red);            // hood
    add(new RoundedBoxGeometry(1.9, 1.05, 1.5, 3, 0.1).translate(0, 1.12, WB - 0.85), red);             // cab
    add(new RoundedBoxGeometry(1.7, 0.45, 1.3, 3, 0.1).translate(0, 1.82, WB - 0.88), red);             // cab roof
    add(bx(1.62, 0.36, 0.04).translate(0, 1.66, WB - 0.17), glassT); add(bx(1.62, 0.32, 0.04).translate(0, 1.7, WB - 1.58), glassT);   // windscreen, rear window
    for (const s of [-1, 1]) add(bx(0.04, 0.38, 1.0).translate(s * 0.96, 1.62, WB - 0.9), glassT);     // side windows (Dwayne seen through)
    add(bx(1.95, 0.1, 2.5).translate(0, 0.62, -0.25), M("BedFloor", "#6a6460"));                        // bed floor
    for (const s of [-1, 1]) add(bx(0.08, 0.55, 2.5).translate(s * 0.95, 0.92, -0.25), red);            // bed sides
    add(bx(1.95, 0.55, 0.08).translate(0, 0.92, 0.98), red);                                              // bed front
    add(bx(2.0, 0.22, 0.18).translate(0, 0.52, WB + 1.3), chrome);                                        // front bumper
    add(bx(1.4, 0.36, 0.06).translate(0, 0.86, WB + 1.27), M("Grille", "#3a3a40"));
    for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16).rotateX(Math.PI / 2).translate(s * 0.68, 0.92, WB + 1.29), M("Head", "#fff4d8", undefined, { emissive: "#7a6a4a" })); add(bx(0.12, 0.2, 0.05).translate(s * 0.88, 0.95, -1.53), M("Tail", "#ff4a3a", undefined, { emissive: "#6a1010" })); }
    add(bx(2.0, 0.2, 0.16).translate(0, 0.5, -1.56), chrome);                                             // rear bumper
    for (const z of [0, WB]) for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.9, 0.38, z); truckBody.add(w); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 20).rotateZ(Math.PI / 2), tyre); t.castShadow = true; w.add(t); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12).rotateZ(Math.PI / 2), chrome); w.add(hub); truckBody.userData.wheels = [...(truckBody.userData.wheels ?? []), w]; }
  }
  const tailgate = new THREE.Group(); tailgate.position.set(0, 0.66, -1.5); truckBody.add(tailgate);
  { const tg = new THREE.Mesh(bx(1.95, 0.55, 0.08).translate(0, 0.27, 0), red); tg.castShadow = true; tailgate.add(tg); const tt = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.2), unlit(ctex("lbTailTxt", 256, 48, (g) => { g.fillStyle = "#c0302a"; g.fillRect(0, 0, 256, 48); g.fillStyle = "#f4f0e2"; g.font = "900 36px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("DWAYNE'S", 128, 26); }), 0.9)); tt.position.set(0, 0.3, -0.045); tt.rotation.y = Math.PI; tailgate.add(tt); }
  // books heaped in the bed
  const bedBooks = new THREE.Group(); truckBody.add(bedBooks);
  { const r = rng(9); for (let i = 0; i < 70; i++) { const c = ["#a83a2c", "#2c5a8a", "#3e7a3a", "#c4902a", "#6a3a6a", "#2a6a6a", "#8a5a2a", "#4a4a6a"][i % 8]; const me = new THREE.Mesh(bx(0.2, 0.05, 0.27), M("BkC" + (i % 8), c)); me.position.set((r() - 0.5) * 1.6, 0.72 + r() * 0.5 * (1 - Math.abs((r() - 0.5))), -1.3 + r() * 2.1); me.rotation.set((r() - 0.5) * 0.8, r() * 3, (r() - 0.5) * 0.8); me.castShadow = true; bedBooks.add(me); } }

  // ===================== FLYING / POURING BOOKS (the hook wave down the steps; the chute pour) =====================
  const covers = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [M("BkSide" + k, ["#a83a2c", "#2c5a8a", "#3e7a3a", "#c4902a", "#6a3a6a", "#2a6a6a", "#8a5a2a", "#4a4a6a"][k]), M("BkPg", "#ffffff", pageEdge()), M("BkCov" + k, "#ffffff", bookCover(k))]);
  const mkBook = (k: number) => { const m = covers[k % 8]; const me = new THREE.Mesh(bx(0.2, 0.05, 0.27), [m[1], m[0], m[2], m[2], m[1], m[1]]); me.castShadow = true; me.receiveShadow = true; return me; };
  const wave: THREE.Mesh[] = []; { const wg = new THREE.Group(); root.add(wg); for (let i = 0; i < 46; i++) { const me = mkBook(i); me.userData = { s: rng(i + 300)() }; wg.add(me); wave.push(me); } }
  const pourB: THREE.Mesh[] = []; { const pg = new THREE.Group(); root.add(pg); for (let i = 0; i < 26; i++) { const me = mkBook(i + 3); pg.add(me); pourB.push(me); } }

  // ===================== FAR SIDE: row houses, Dwayne's flat, mailbox, trash can, cars, trees =====================
  const facT = facadeHD("lbRow1", 12, 9, { wall: "#9a4a3a", shutter: "#2e4a3a", door: true, brick: true }), facT2 = facadeHD("lbRow2", 12, 9, { wall: "#b06a48", shutter: "#4a3a6a", door: true, brick: true });
  // Dwayne's house (x -1..7) has a real opening at the 2nd-floor window; the neighbours are textured fronts
  for (const [x0, x1, t] of [[-25, -13, facT], [-13, -1, facT2], [7, 19, facT], [19, 31, facT2]] as [number, number, THREE.Texture][]) { b.add(quad(V(x1, 0, 13.6), V(x0, 0, 13.6), V(x0, 9, 13.6), V(x1, 9, 13.6), 1, 1), M("Fac" + x0, "#ffffff", t)); b.add(bx(x1 - x0, 0.4, 0.5).translate((x0 + x1) / 2, 9.2, 13.75), M("Corn", "#d8cfc0")); }
  { const brickT = facadeHD("lbDw", 8, 9, { wall: "#8a4636", shutter: "#2e4a3a", door: false, brick: true }), dm = M("DwFac", "#ffffff", brickT);
    const piece = (x0: number, x1: number, y0: number, y1: number) => { b.add(quad(V(x1, y0, 13.6), V(x0, y0, 13.6), V(x0, y1, 13.6), V(x1, y1, 13.6), (x1 + 1) / 8 - (x0 + 1) / 8 + (x0 + 1) / 8, y1 / 9, (x0 + 1) / 8, y0 / 9), dm); };
    piece(-1, 1.6, 0, 9); piece(3.6, 7, 0, 9); piece(1.6, 3.6, 0, 4.4); piece(1.6, 3.6, 6.0, 9);
    b.add(bx(2.3, 0.15, 0.3).translate(2.6, 4.35, 13.5), M("Sill", "#d8cfc0")); b.add(bx(2.3, 0.22, 0.25).translate(2.6, 6.1, 13.5), M("Sill", "#d8cfc0"));
    b.add(bx(0.06, 1.6, 0.06).translate(2.6, 5.2, 13.62), M("Sash", "#f0ece0")); b.add(bx(2.0, 0.06, 0.06).translate(2.6, 5.2, 13.62), M("Sash", "#f0ece0"));
    b.add(bx(8, 0.4, 0.5).translate(3, 9.2, 13.75), M("Corn", "#d8cfc0")); }
  const aptGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.6), new THREE.MeshLambertMaterial({ color: "#a8c4dc", transparent: true, opacity: 0.18, depthWrite: false })); aptGlass.position.set(2.6, 5.2, 13.58); aptGlass.rotation.y = Math.PI; root.add(aptGlass);
  // stoops and a blue mailbox, newspaper box, lidded trash can, bench, bike rack
  for (const x of [-19, -7, 5, 13, 25]) for (let k = 0; k < 3; k++) b.add(bx(1.8, 0.18 * (k + 1), 0.35).translate(x, 0.09 * (k + 1), 13.4 - k * 0.35 + 0.35), M("Stoop", "#b8ada0", darkStone()));
  const mbox = new THREE.Group(); mbox.position.set(...LIB.MAILBOX); root.add(mbox);
  { const blue = M("MailBlue", "#2a4a8a"); const add = (geo: THREE.BufferGeometry, m: THREE.Material, y: number) => { const me = new THREE.Mesh(geo, m); me.position.y = y; me.castShadow = true; mbox.add(me); };
    add(new RoundedBoxGeometry(0.55, 0.85, 0.6, 3, 0.06), blue, 0.75); add(new THREE.CylinderGeometry(0.3, 0.3, 0.55, 18, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), blue, 1.17); for (const s of [-1, 1]) for (const t of [-1, 1]) add(bx(0.05, 0.3, 0.05).translate(s * 0.22, 0, t * 0.24), M("MailLeg", "#1e2a4a"), 0.15);
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.14), unlit(ctex("lbMailLbl", 256, 96, (g) => { g.fillStyle = "#2a4a8a"; g.fillRect(0, 0, 256, 96); g.fillStyle = "#f4f0e2"; g.font = "900 64px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("MAIL", 128, 52); }), 0.9)); lbl.position.set(0, 0.95, -0.305); lbl.rotation.y = Math.PI; mbox.add(lbl); }
  const can = new THREE.Group(); root.add(can); const canLid = new THREE.Group(); can.add(canLid);
  { const galv = M("Galv", "#a8acb0", ctex("lbGalv", 256, 128, (g, r) => { g.fillStyle = "#a8acb0"; g.fillRect(0, 0, 256, 128); for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? "rgba(255,255,255,0.18)" : "rgba(40,40,50,0.18)"; g.fillRect(0, k * 14, 256, 7); } for (let i = 0; i < 40; i++) blot(g, r() * 256, r() * 128, 10 + r() * 20, "rgba(120,100,80,0.18)"); }));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.85, 22, 1, true), galv); body.material.side = THREE.DoubleSide; body.position.y = 0.43; body.castShadow = true; can.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 22), galv); lid.castShadow = true; canLid.add(lid); const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), M("Galv", "#a8acb0")); hdl.position.y = 0.03; canLid.add(hdl); canLid.position.y = 0.87; }
  { const nb = M("NewsBox", "#c8352e"); const g = new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.05, 0.45, 3, 0.03), nb); g.position.set(-5.0, 0.53, 11.4); g.castShadow = true; root.add(g); const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), unlit(ctex("lbNews", 256, 192, (g2) => { g2.fillStyle = "#f2ede0"; g2.fillRect(0, 0, 256, 192); g2.fillStyle = "#2a2a2a"; g2.font = "900 40px Georgia"; g2.textAlign = "center"; g2.fillText("THE DAILY", 128, 50); g2.fillRect(20, 70, 216, 6); for (let k = 0; k < 6; k++) g2.fillRect(20, 92 + k * 15, 100 + (k % 3) * 30, 7); }), 0.9)); lbl.position.set(-5.0, 0.8, 11.17); lbl.rotation.y = Math.PI; root.add(lbl); }
  { const bench = M("BenchW", "#7a5032", beamHD()); for (let k = 0; k < 3; k++) b.add(bx(1.6, 0.05, 0.12).translate(8.8, 0.46, 11.8 + k * 0.15), bench); b.add(bx(1.6, 0.4, 0.05).translate(8.8, 0.75, 12.25), bench); for (const x of [8.1, 9.5]) b.add(bx(0.06, 0.46, 0.5).translate(x, 0.23, 11.95), M("Iron", "#2e3238")); }
  for (let k = 0; k < 4; k++) b.add(new THREE.TorusGeometry(0.35, 0.025, 6, 16, Math.PI).rotateY(Math.PI / 2).translate(-8.2 + k * 0.6, 0.35, -1.9), M("Rack", "#2e3238"));   // bike rack by the steps
  // parked cars along the far kerb (modern sedans), one on the near side
  for (const [x, col, rot] of [[-9.5, "#2a5a8a", 0], [-15, "#e0b84a", 0], [9.8, "#3e7a5a", 0], [16, "#8a8a92", 0], [-18, "#6a2a3a", Math.PI]] as [number, string, number][]) { const s = sedan(root, { style: "modern", body: col }); s.g.rotation.y = Math.PI / 2 + rot; s.g.position.set(x, -0.15, rot ? 2.2 : 9.4); }
  // trees in square pits along both sidewalks + far ones
  const barkM = lam("byBarkM", () => ({ map: barkTex() }));
  const leafM = swayMaterial(lam("lbLeafMS", () => ({ color: "#5e9a46", vertexColors: true }) as THREE.MeshLambertMaterialParameters));
  const coreM = swayMaterial(lam("byCore2", () => ({ color: "#3e7034", emissive: "#14300e" })));
  for (const [x, z, h, s] of [[-9, -0.2, 6.5, 41], [9.2, -0.2, 6.8, 42], [-16, -0.4, 7, 43], [16.5, -0.2, 6.6, 44], [-11, 12.2, 7.2, 45], [11.5, 12.2, 6.8, 46], [-24, 12.2, 7.5, 47], [24, 12.2, 7.2, 48]] as [number, number, number, number][]) { leafyTree(b, root, [x, 0, z], h, s, leafM, coreM, barkM, 16, leafCardMat("vbLeafCardM")); b.add(bx(1.2, 0.06, 1.2).translate(x, 0.02, z), M("Pit", "#5a4a3a")); }

  // ===================== INSIDE: MAIN HALL =====================
  const F = LIB.FLOOR, CEIL = 8.2;
  const floorM = M("Floor", "#c89a6a", planksHD()); { const t = floorM.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); }
  bIn.add(quad(V(-10, F + 0.005, -8), V(10, F + 0.005, -8), V(10, F + 0.005, -26), V(-10, F + 0.005, -26), 1, 1), floorM);
  const plasterT = ctex("lbPlaster", 512, 512, (g, r) => { g.fillStyle = "#e8dcc4"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 70; i++) blot(g, r() * 512, r() * 512, 30 + r() * 90, r() < 0.5 ? "rgba(255,250,236,0.2)" : "rgba(150,120,90,0.14)"); for (let i = 0; i < 6000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.1)" : "rgba(80,60,40,0.08)"; g.fillRect(r() * 512, r() * 512, 2, 2); } });
  const wallM = M("Wall", "#ffffff", plasterT), wainM = M("Wain", "#7a4e2e", beamHD());
  const wallIn = (x0: number, z0: number, x1: number, z1: number, y0 = F, y1 = CEIL) => { bIn.add(quad(V(x0, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z0), 1, 1), wallM); };
  wallIn(10, -8.25, -10, -8.25); wallIn(-10, -8.25, -10, -26); wallIn(10, -26, 10, -8.25); wallIn(-10, -26, 10, -26);
  bIn.add(quad(V(-10, CEIL, -26), V(10, CEIL, -26), V(10, CEIL, -8), V(-10, CEIL, -8), 1, 1), M("Ceil", "#e8dcc8", ctex("lbCoffer", 256, 256, (g) => { g.fillStyle = "#e6d8c0"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "rgba(120,96,64,0.5)"; g.lineWidth = 10; g.strokeRect(10, 10, 236, 236); g.strokeStyle = "rgba(255,250,236,0.6)"; g.lineWidth = 4; g.strokeRect(24, 24, 208, 208); })));
  // wainscot band on every wall
  for (const [x0, z0, x1, z1] of [[-10, -8.3, 10, -8.3], [-9.98, -8, -9.98, -26], [9.98, -8, 9.98, -26], [-10, -25.98, 10, -25.98]] as [number, number, number, number][]) bIn.add(quad(V(x0, F, z0), V(x1, F, z1), V(x1, F + 1.1, z1), V(x0, F + 1.1, z0), 1, 1), wainM);
  // tall side windows (daylight), shelves of spines along the walls
  const spineMs = [0, 1, 2, 3].map((k) => M("Spines" + k, "#ffffff", spinesTex(k)));
  const shelfWood = M("ShelfW", "#6a4228", beamHD());
  const bookcase = (x: number, z: number, yaw: number, w: number, h: number, seed: number) => { const g = new THREE.Group(); g.position.set(x, F, z); g.rotation.y = yaw; root.add(g); const bb = new Batch();
    bb.add(bx(w, h, 0.05).translate(0, h / 2, -0.2), shelfWood); for (const s of [-1, 1]) bb.add(bx(0.06, h, 0.42).translate(s * w / 2, h / 2, 0), shelfWood); bb.add(bx(w + 0.1, 0.08, 0.46).translate(0, h, 0), shelfWood);
    const nsh = Math.floor(h / 0.42); for (let k = 0; k < nsh; k++) { const y = 0.08 + k * 0.42; bb.add(bx(w, 0.035, 0.4).translate(0, y, 0), shelfWood); bb.add(quad(V(-w / 2 + 0.03, y + 0.02, 0.12), V(w / 2 - 0.03, y + 0.02, 0.12), V(w / 2 - 0.03, y + 0.36, 0.12), V(-w / 2 + 0.03, y + 0.36, 0.12), w / 2.2, 1, ((seed + k) * 0.37) % 1, 0), spineMs[(seed + k) % 4]); }
    bb.build(g); return g; };
  for (let k = 0; k < 4; k++) { bookcase(-9.75, -9.6 - k * 1.1, Math.PI / 2, 1.05, 3.2, k); bookcase(9.75, -9.6 - k * 1.1, -Math.PI / 2, 1.05, 3.2, k + 7); }
  for (let k = 0; k < 6; k++) { bookcase(-8.0 + k * 1.1 > -2 ? 0 : -8.0 + k * 1.1, -25.75, 0, 1.05, 3.6, k + 11); }
  // reading tables with green banker's lamps (lit), chairs
  const bankers: THREE.Group[] = [];
  const tableW = M("TableW", "#8a5a34", beamHD());
  for (const [x, z] of [[-6.0, -10.6], [6.0, -10.6]] as [number, number][]) { bIn.add(bx(2.4, 0.06, 1.0).translate(x, F + 0.76, z), tableW); for (const sx of [-1.1, 1.1]) for (const sz of [-0.42, 0.42]) bIn.add(bx(0.07, 0.76, 0.07).translate(x + sx, F + 0.38, z + sz), tableW); for (const sx of [-0.6, 0.6]) { const L = bankers[bankers.push(lamp(root, [x + sx, F + 1.02, z], "#ffe0a0", 1.2, 4, "table")) - 1]; L.scale.setScalar(0.8); } }
  // pendant globes from the ceiling
  const pend = [[-5, -11], [5, -11], [0, -9.8], [-5, -17], [5, -17], [0, -20]].map(([x, z]) => lamp(root, [x, CEIL - 1.6, z] as V3, "#ffe6b8", 1.6, 9, "hang"));
  // ---- THE FRONT DESK ----
  const deskWood = M("DeskW", "#a87244", beamHD()), deskTop = M("DeskTop", "#8a5a34", planksHD());
  for (let k = 0; k < 4; k++) bookcase(-1.65 + k * 1.1, -14.7, 0, 1.05, 3.0, k + 21);
  { const ct = ctex("lbCirc", 512, 128, (g) => { g.fillStyle = "#2a4a3a"; g.fillRect(0, 0, 512, 128); g.strokeStyle = "#d8b45a"; g.lineWidth = 8; g.strokeRect(8, 8, 496, 112); g.fillStyle = "#f2e2b0"; g.font = "900 64px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CIRCULATION", 256, 68); });
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), unlit(ct, 0.95)); cs.position.set(0, F + 3.55, -13.1); root.add(cs); for (const sx of [-0.8, 0.8]) bIn.add(bx(0.015, 3.3, 0.015).translate(sx, CEIL - 1.4, -13.1), M("Brass", "#c49a4a")); }
  bIn.add(bx(6.4, 0.82, 0.12).translate(0, F + 0.41, -12.66), deskWood); bIn.add(bx(6.6, 0.07, 0.75).translate(0, F + 0.855, -12.95), deskTop);
  for (const s of [-1, 1]) bIn.add(bx(0.12, 0.82, 1.6).translate(s * 3.2, F + 0.41, -13.4), deskWood);
  for (let k = 0; k < 8; k++) bIn.add(bx(0.7, 0.6, 0.02).translate(-2.8 + k * 0.8, F + 0.4, -12.59), M("DeskPanel", "#9a6a40", beamHD()));
  bIn.add(bx(6.2, 0.05, 0.6).translate(0, F + 0.55, -13.6), deskTop);   // the clerk's lower work shelf
  // sign on the desk: OWE $10 = CARD BLOCKED (big, on a stand), the card stamps, a monitor, a bell, a book cart
  const blockT = ctex("lbBlockSign", 512, 320, (g) => { g.fillStyle = "#fff6d8"; g.fillRect(0, 0, 512, 320); g.strokeStyle = "#2a2a3a"; g.lineWidth = 12; g.strokeRect(6, 6, 500, 308); g.fillStyle = "#2a2a3a"; g.font = "900 64px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("OWE $10?", 256, 84); g.fillStyle = "#b8282a"; g.font = "900 58px Arial Black, Arial"; g.fillText("CARD", 256, 178); g.fillText("BLOCKED", 256, 254); });
  { const st = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.39), unlit(blockT, 0.95)); st.position.set(-0.15, F + 1.1, -12.7); st.rotation.x = -0.18; root.add(st); bIn.add(bx(0.66, 0.42, 0.03).translate(-0.15, F + 1.1, -12.73).rotateX(0), M("SignBack", "#c8c2b4")); }
  bIn.add(bx(0.5, 0.36, 0.05).translate(1.7, F + 1.15, -13.25), M("Monitor", "#2a2c34")); bIn.add(bx(0.06, 0.2, 0.06).translate(1.7, F + 0.97, -13.25), M("Monitor", "#2a2c34"));
  { const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.32), unlit(ctex("lbScreen", 256, 176, (g) => { g.fillStyle = "#1e3a5a"; g.fillRect(0, 0, 256, 176); g.fillStyle = "#e8f0f8"; g.font = "700 22px Arial"; for (let k = 0; k < 6; k++) g.fillRect(16, 20 + k * 22, 120 + (k * 37) % 90, 8); g.fillStyle = "#ff5a4a"; g.font = "900 26px Arial"; g.fillText("BLOCKED", 120, 160); }), 0.8)); scr.position.set(1.7, F + 1.15, -13.22); root.add(scr); }
  { const cart = M("CartW", "#6a4a2e", beamHD()); bIn.add(bx(1.0, 0.04, 0.45).translate(-2.4, F + 0.45, -12.1), cart); bIn.add(bx(1.0, 0.04, 0.45).translate(-2.4, F + 0.85, -12.1), cart); for (const sx of [-0.46, 0.46]) bIn.add(bx(0.04, 0.9, 0.45).translate(-2.4 + sx, F + 0.47, -12.1), cart); bIn.add(quad(V(-2.86, F + 0.88, -12.0), V(-1.94, F + 0.88, -12.0), V(-1.94, F + 1.18, -12.0), V(-2.86, F + 1.18, -12.0), 0.8, 1), spineMs[2]); bIn.add(quad(V(-2.86, F + 0.48, -12.0), V(-1.94, F + 0.48, -12.0), V(-1.94, F + 0.78, -12.0), V(-2.86, F + 0.78, -12.0), 0.8, 1, 0.3), spineMs[1]); }
  crate(b, root, [2.6, F, -12.0], 0.5, "RETURNS", 0.2);
  // Gary's chair (behind the desk)
  { const ch = M("ChairG", "#3a3a48"); bIn.add(bx(0.5, 0.08, 0.5).translate(LIB.GARY_SEAT[0], F + 0.5, LIB.GARY_SEAT[2]), ch); bIn.add(bx(0.5, 0.55, 0.06).translate(LIB.GARY_SEAT[0], F + 0.82, LIB.GARY_SEAT[2] - 0.25), ch); bIn.add(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 6).translate(LIB.GARY_SEAT[0], F + 0.25, LIB.GARY_SEAT[2]), M("Iron", "#2e3238")); }
  // ---- THE BOARD ROOM (glass wall at z -14, x 2..10) ----
  const glassW = new THREE.MeshLambertMaterial({ color: "#c8dce4", transparent: true, opacity: 0.16, depthWrite: false });
  { const gw = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.0), glassW); gw.position.set(7.5, F + 1.5, -14.0); root.add(gw); for (const x of [2.1, 5.0, 10]) bIn.add(bx(0.08, 3.0, 0.1).translate(x, F + 1.5, -14), M("Frame", "#3e3a36")); bIn.add(bx(8, 0.1, 0.1).translate(6, F + 3.0, -14), M("Frame", "#3e3a36")); bIn.add(bx(8, 0.1, 0.1).translate(6, F + 0.05, -14), M("Frame", "#3e3a36"));
    bIn.add(bx(0.2, CEIL - F, 10).translate(2.0, (CEIL + F) / 2, -19), wallM); bIn.add(bx(8, CEIL - F - 3.05, 0.2).translate(6, F + 3.05 + (CEIL - F - 3.05) / 2, -14), wallM);
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.24), unlit(ctex("lbBoardLbl", 512, 96, (g) => { g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, 512, 96); g.fillStyle = "#3a3a48"; g.font = "700 52px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BOARD ROOM", 256, 50); }), 0.9)); (lbl.material as THREE.MeshBasicMaterial).transparent = true; lbl.position.set(7.5, F + 2.6, -13.98); root.add(lbl); }
  const tblM = M("BoardT", "#6a3e22", planksHD());
  bIn.add(new RoundedBoxGeometry(1.7, 0.08, 6.4, 3, 0.03).translate(6.0, F + 0.76, -18.9), tblM); for (const z of [-16.0, -21.8]) for (const sx of [-0.6, 0.6]) bIn.add(bx(0.08, 0.76, 0.08).translate(6.0 + sx, F + 0.38, z), tblM);
  const chairM = M("Chair", "#2f4a5a");
  for (const z of [-16.4, -17.4, -18.4, -19.4, -20.4]) for (const s of [-1, 1]) { const x = 6.0 + s * 1.05; bIn.add(bx(0.48, 0.06, 0.46).translate(x, F + 0.48, z), chairM); bIn.add(bx(0.06, 0.55, 0.46).translate(x + s * 0.24, F + 0.8, z), chairM); for (const ox of [-0.18, 0.18]) for (const oz of [-0.18, 0.18]) bIn.add(bx(0.04, 0.48, 0.04).translate(x + ox, F + 0.24, z + oz), M("Iron", "#2e3238")); }
  // mugs, sandwiches on plates, papers, the wastebasket by the head of the table
  for (const [x, z, k] of [[5.4, -16.4, 0], [6.6, -17.2, 1], [5.4, -18.2, 2], [6.6, -19.2, 3]] as [number, number, number][]) { bIn.add(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 12).translate(x + 0.15, F + 0.85, z - 0.2), M("Mug" + k, ["#c8352e", "#2f7a86", "#e0b84a", "#f2ede0"][k])); bIn.add(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 18).translate(x, F + 0.81, z + 0.1), M("Plate", "#f4f0e6")); if (k !== 0) bIn.add(bx(0.18, 0.06, 0.1).translate(x, F + 0.85, z + 0.1), M("Sandw", "#e8c88a")); bIn.add(bx(0.22, 0.004, 0.3).translate(x - 0.22, F + 0.805, z + 0.15).rotateY(0.1), M("Paper", "#f6f2e8")); }
  bIn.add(new THREE.CylinderGeometry(0.2, 0.17, 0.42, 16, 1, true).translate(7.05, F + 0.21, -15.2), M("Waste", "#4a5a6a"));
  // Gary's coaster: a library book under his mug (c.coffee splash, c.ring)
  const coaster = new THREE.Group(); coaster.position.set(5.35, F + 0.8, -16.45); coaster.rotation.y = 0.3; root.add(coaster);
  const dueT = ctex("lbDueCard", 256, 320, (g) => { g.fillStyle = "#f2ead0"; g.fillRect(0, 0, 256, 320); g.fillStyle = "#3a3a4a"; g.font = "900 34px Arial"; g.textAlign = "center"; g.fillText("DATE DUE", 128, 42); g.strokeStyle = "rgba(60,90,150,0.6)"; g.lineWidth = 2; for (let y = 64; y < 310; y += 44) { g.beginPath(); g.moveTo(14, y); g.lineTo(242, y); g.stroke(); } g.fillStyle = "#b8282a"; g.font = "900 40px Courier New, monospace"; g.fillText("MAY 03", 128, 104); g.fillText("1994", 128, 146); });
  const coffeeRingT = ctex("lbRing", 256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.strokeStyle = "rgba(110,60,24,0.75)"; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 70, 0, TAU); g.stroke(); g.fillStyle = "rgba(110,60,24,0.22)"; g.beginPath(); g.arc(128, 128, 64, 0, TAU); g.fill(); });
  const spillT = ctex("lbSpill", 256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.fillStyle = "rgba(96,52,20,0.85)"; g.beginPath(); for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU, rr = 70 + Math.sin(k * 2.7) * 26; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr * 0.8); } g.closePath(); g.fill(); });
  { const covM = [M("CoastPg", "#ffffff", pageEdge()), M("CoastPg", "#ffffff", pageEdge()), M("CoastCov", "#ffffff", ctex("lbCoastCover", 256, 320, (g) => { g.fillStyle = "#2c5a8a"; g.fillRect(0, 0, 256, 320); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(0, 0, 24, 320); g.fillStyle = "#f2e2b0"; g.font = "900 40px Georgia"; g.textAlign = "center"; g.fillText("BOATS", 128, 60); g.fillText("OF THE", 128, 104); g.fillText("WORLD", 128, 148); })), M("CoastPg", "#ffffff", pageEdge()), M("CoastPg", "#ffffff", pageEdge()), M("CoastPg", "#ffffff", pageEdge())];
    const bk = new THREE.Mesh(bx(0.26, 0.045, 0.33), covM); bk.position.y = 0.0225; bk.castShadow = true; coaster.add(bk);
    const pocket = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.15), unlit(dueT, 0.95)); pocket.rotation.x = -Math.PI / 2; pocket.position.set(0.05, 0.047, 0.07); coaster.add(pocket); }
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: coffeeRingT, transparent: true, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(-0.04, 0.0465, -0.06); coaster.add(ring);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: spillT, transparent: true, depthWrite: false })); spill.rotation.x = -Math.PI / 2; spill.position.set(0.0, 0.047, 0.0); coaster.add(spill);
  const garyMug = new THREE.Group(); coaster.add(garyMug); { const mm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 14).translate(0, 0.1, 0), M("MugG", "#e0b84a")); mm.castShadow = true; garyMug.add(mm); const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 10), M("MugG", "#e0b84a")); hdl.position.set(0.06, 0.1, 0); garyMug.add(hdl); garyMug.position.set(-0.04, 0.045, -0.06); }
  // the whiteboard (back wall of the board room): c.board writes FREE-FOR-ALL MARGE
  const boardTs = [0, 1, 2, 3, 4].map((n) => ctex("lbWB" + n, 768, 384, (g) => { g.fillStyle = "#f8f8f6"; g.fillRect(0, 0, 768, 384); g.fillStyle = "rgba(200,210,220,0.4)"; g.fillRect(0, 0, 768, 20); g.fillStyle = "#2a4ab0"; g.font = "italic 900 96px Comic Sans MS, Arial"; g.textAlign = "left"; g.textBaseline = "middle"; const t = ["", "FREE-", "FREE-FOR-", "FREE-FOR-ALL", "FREE-FOR-ALL"][n]; g.fillText(t, 40, 130); if (n === 4) { g.fillText("MARGE", 180, 260); g.strokeStyle = "#c8352e"; g.lineWidth = 8; g.beginPath(); g.moveTo(170, 316); g.lineTo(540, 306); g.stroke(); } g.fillStyle = "#6a6a72"; g.font = "700 30px Arial"; g.fillText("BUDGET MTG", 520, 40); }));
  const wbMat = new THREE.MeshBasicMaterial({ map: boardTs[0], color: new THREE.Color(0.92, 0.92, 0.92) });
  { const wb = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), wbMat); wb.position.set(6.0, F + 1.9, -23.0); root.add(wb); bIn.add(bx(2.7, 1.4, 0.04).translate(6.0, F + 1.9, -23.05), M("WBFrame", "#b8bcc4")); bIn.add(bx(2.6, 0.05, 0.12).translate(6.0, F + 1.2, -22.96), M("WBFrame", "#b8bcc4")); for (const lx of [4.75, 7.25]) { bIn.add(bx(0.06, 2.7, 0.06).translate(lx, F + 1.35, -23.08), M("WBFrame", "#b8bcc4")); bIn.add(bx(0.06, 0.04, 0.7).translate(lx, F + 0.02, -23.08), M("WBFrame", "#b8bcc4")); } }
  // board-room window on the outer wall (x 10) with daylight, a portrait, a plant
  { const w = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 3.2), M("BRWin", "#ffffff", winDayT, { emissive: "#262c34" })); w.position.set(9.95, F + 2.3, -19.5); w.rotation.y = -Math.PI / 2; root.add(w); for (const z of [-18.2, -19.5, -20.8]) bIn.add(bx(0.1, 3.2, 0.08).translate(9.9, F + 2.3, z), M("Mull", "#3e4a42")); }
  { const pot = M("Pot", "#a85a3a"); bIn.add(new THREE.CylinderGeometry(0.25, 0.2, 0.45, 14).translate(9.3, F + 0.22, -15.0), pot); bIn.add(smoothIco(0.45).scale(1, 1.3, 1).translate(9.3, F + 0.95, -15.0), M("Plant", "#4a8a3a")); }
  // ---- THE RETURN ROOM (x -10..-2, z -14..-24) ----
  bIn.add(bx(0.2, CEIL - F, 10).translate(-2.0, (CEIL + F) / 2, -19), wallM);
  bIn.add(bx(5.2, CEIL - F, 0.2).translate(-7.4, (CEIL + F) / 2, -14), wallM); bIn.add(bx(1.4, CEIL - F, 0.2).translate(-2.7, (CEIL + F) / 2, -14), wallM); bIn.add(bx(1.6, CEIL - F - 2.8, 0.2).translate(-4.2, F + 2.8 + (CEIL - F - 2.8) / 2, -14), wallM);   // doorway x -5..-3.4
  bIn.add(quad(V(-10, F + 0.01, -14), V(-2, F + 0.01, -14), V(-2, F + 0.01, -24), V(-10, F + 0.01, -24), 1, 1), M("RRFloor", "#a87a4e", planksHD()));
  wallIn(-2, -24, -10, -24);
  // the chute: a steel hood in the outer wall with a ramp down to the heap
  { const st2 = M("Chute", "#8a9098"); bIn.add(bx(0.4, 0.9, 1.3).translate(-9.75, 4.0, -18.5), st2); const ramp = new THREE.Mesh(bx(1.2, 0.05, 2.4), st2); ramp.position.set(-8.9, 3.3, -18.5); ramp.rotation.z = -0.55; ramp.castShadow = true; root.add(ramp); for (const s of [-1, 1]) { const lip = new THREE.Mesh(bx(1.2, 0.18, 0.04), st2); lip.position.set(-8.9, 3.38, -18.5 + s * 1.18); lip.rotation.z = -0.55; root.add(lip); }
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), M("ChuteMouth", "#5a3e26", undefined, { emissive: "#24160a" })); mouth.position.set(-9.53, 4.05, -18.5); mouth.rotation.y = Math.PI / 2; root.add(mouth); }
  // the book mountain: 14 layers (c.mountain shows them bottom up)
  const mountain: THREE.Group[] = [];
  const moundT = ctex("lbMound", 512, 512, (g, r) => { g.fillStyle = "#6a4a34"; g.fillRect(0, 0, 512, 512); const cs = ["#a83a2c", "#2c5a8a", "#3e7a3a", "#c4902a", "#6a3a6a", "#2a6a6a", "#8a5a2a", "#4a4a6a", "#d8c8a0"];
    for (let i = 0; i < 900; i++) { g.save(); g.translate(r() * 512, r() * 512); g.rotate(r() * 6.3); g.fillStyle = cs[Math.floor(r() * cs.length)]; g.fillRect(-14, -10, 28, 20); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-14, 8, 28, 3); g.restore(); } });
  moundT.wrapS = moundT.wrapT = THREE.RepeatWrapping; moundT.repeat.set(3, 1); const moundM = M("Mound", "#ffffff", moundT);
  { const r = rng(77), cx = LIB.MOUNTAIN[0], cz = LIB.MOUNTAIN[2];
    for (let L = 0; L < 14; L++) { const g = new THREE.Group(); root.add(g); const bb = new Batch(); const y0 = L * 0.18, rad = 2.7 * Math.pow(1 - L / 15, 0.85);
      { const core = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.86, rad * 0.97, 0.2, 18), moundM); core.position.set(cx, F + y0 + 0.06, cz); core.scale.z = 0.85; g.add(core); }
      for (let i = 0; i < Math.max(30, 130 - L * 7); i++) { const a = r() * TAU, d = Math.sqrt(r()) * rad, c = covers[Math.floor(r() * 8)]; const m4 = new THREE.Matrix4().compose(V(cx + Math.cos(a) * d, F + y0 + 0.03 + r() * 0.08, cz + Math.sin(a) * d * 0.85), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.7, r() * TAU, (r() - 0.5) * 0.7)), V(1, 1, 1)); bb.add(bx(0.2, 0.05, 0.27), c[0], m4); }
      bb.build(g); mountain.push(g); } }
  // the tally chart on the back wall: the line climbs to +240% with c.tally
  const tallyTs = Array.from({ length: 11 }, (_, n) => ctex("lbTallyN" + n, 640, 512, (g) => { g.drawImage((ledgerSheet().image as unknown) as CanvasImageSource, 0, 0); const k = n / 10; const pts: [number, number][] = [[90, 440], [190, 420], [360, 300], [600, 80]]; g.strokeStyle = "#c8282a"; g.lineWidth = 14; g.lineCap = "round"; g.beginPath(); g.moveTo(...pts[0]); let tot = 0; const seg = [1, 2, 3].map((i) => Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])), all = seg.reduce((a, c) => a + c, 0); for (let i = 1; i < 4; i++) { const want = all * k - tot; if (want <= 0) break; const u = Math.min(1, want / seg[i - 1]); g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); tot += seg[i - 1]; } g.stroke(); if (n === 10) { g.fillStyle = "#c8282a"; g.font = "900 92px Arial Black, Arial"; g.textAlign = "right"; g.fillText("+240%", 600, 190); } }));
  const tallyMat = new THREE.MeshBasicMaterial({ map: tallyTs[0], color: new THREE.Color(0.94, 0.94, 0.94) });
  { const tm = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.52), tallyMat); tm.position.set(LIB.TALLY[0], LIB.TALLY[1], LIB.TALLY[2] + 0.02); root.add(tm); bIn.add(bx(2.0, 1.6, 0.04).translate(LIB.TALLY[0], LIB.TALLY[1], LIB.TALLY[2] - 0.02), M("Cork", "#b88a5a")); }
  // high windows on the back wall + sunbeams onto the heap, dust motes, a book cart
  { for (const x of [-8.2, -6.0]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), M("HiWin", "#ffffff", winDayT, { emissive: "#3a3a30" })); w.position.set(x, 6.4, -23.88); root.add(w); }
    const beams = [shaft(root, [-8.2, 6.4, -23.6], [-7.4, F, -19.6], 1.0, "#fff0c8", 0.16), shaft(root, [-6.0, 6.4, -23.6], [-5.6, F, -19.2], 1.0, "#fff0c8", 0.14)]; root.userData.rrBeams = beams; }
  const dust: THREE.Sprite[] = []; for (let i = 0; i < 26; i++) { const s = mist(root, [-7 + (rng(i + 50)() - 0.5) * 3, F + 1 + rng(i + 90)() * 4, -20 + (rng(i + 70)() - 0.5) * 3], 0.06, "#fff4d0", 0.7); dust.push(s); }
  { const cart = M("CartW", "#6a4a2e", beamHD()); bIn.add(bx(1.2, 0.05, 0.6).translate(-4.0, F + 0.7, -17.0), cart); for (const sx of [-0.55, 0.55]) bIn.add(bx(0.05, 0.7, 0.6).translate(-4.0 + sx, F + 0.35, -17.0), cart); }
  const cartBooks = new THREE.Group(); root.add(cartBooks); { const r = rng(12); for (let i = 0; i < 18; i++) { const me = mkBook(i); me.position.set(-4.0 + (r() - 0.5) * 1.0, F + 0.78 + Math.floor(i / 6) * 0.055, -17.0 + (r() - 0.5) * 0.4); me.rotation.y = (r() - 0.5) * 0.6; cartBooks.add(me); me.userData.k = i / 18; } }
  const rrLamp = lamp(root, [-6.0, CEIL - 1.5, -17.5], "#ffe6b8", 1.4, 9, "hang");

  // ===================== DWAYNE'S FLAT (2nd floor across the street: x -1..7, z 13.6..17.6, floor y 3.6) =====================
  const AF = LIB.APT_FLOOR, AC = AF + 2.8, bA = new Batch();
  bA.add(quad(V(-1, AF + 0.005, 13.6), V(-1, AF + 0.005, 17.6), V(7, AF + 0.005, 17.6), V(7, AF + 0.005, 13.6), 1, 1), M("AptFloor", "#a87a50", planksHD()));
  const wpT = ctex("lbWallpaper", 512, 512, (g, r) => { g.fillStyle = "#c8b88a"; g.fillRect(0, 0, 512, 512); for (let x = 0; x < 512; x += 32) { g.fillStyle = "rgba(120,96,60,0.22)"; g.fillRect(x, 0, 10, 512); } for (let i = 0; i < 40; i++) blot(g, r() * 512, r() * 512, 30 + r() * 80, "rgba(110,80,40,0.12)"); });
  const wpM = M("AptWall", "#ffffff", wpT);
  for (const [x0, z0, x1, z1] of [[-1, 17.6, 7, 17.6], [-1, 13.6, -1, 17.6], [7, 17.6, 7, 13.6]] as [number, number, number, number][]) bA.add(quad(V(x0, AF, z0), V(x1, AF, z1), V(x1, AC, z1), V(x0, AC, z0), 1, 1), wpM);
  bA.add(quad(V(-1, AC, 17.6), V(7, AC, 17.6), V(7, AC, 13.6), V(-1, AC, 13.6), 1, 1), M("AptCeil", "#e8e0d0"));
  bA.add(quad(V(7, AF, 13.65), V(-1, AF, 13.65), V(-1, AC, 13.65), V(7, AC, 13.65), 1, 1), M("AptFront", "#d8c8a0"));   // inner face of the front wall (the window opening is cut by the outside pieces)
  // the door with a mail slot (back wall), the overdue envelope, a doormat
  { const door = M("AptDoor", "#7a4a2e", beamHD()); bA.add(bx(0.95, 2.1, 0.06).translate(LIB.APT_DOOR[0], AF + 1.05, 17.56), door); bA.add(bx(0.32, 0.07, 0.04).translate(LIB.APT_DOOR[0], AF + 1.0, 17.52), M("Brass", "#c49a4a")); bA.add(bx(0.26, 0.025, 0.03).translate(LIB.APT_DOOR[0], AF + 1.0, 17.5), M("SlotDark", "#3a2a1e")); bA.add(bx(0.8, 0.02, 0.5).translate(LIB.APT_DOOR[0], AF + 0.01, 17.2), M("Mat", "#8a3a2a")); }
  const envT = ctex("lbEnv", 320, 192, (g) => { g.fillStyle = "#f4a0b4"; g.fillRect(0, 0, 320, 192); g.strokeStyle = "rgba(120,40,60,0.6)"; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(160, 96); g.lineTo(320, 0); g.stroke(); g.fillStyle = "#7a1a2a"; g.font = "900 44px Arial Black, Arial"; g.textAlign = "center"; g.fillText("OVERDUE", 160, 132); g.font = "900 36px Arial Black, Arial"; g.fillText("$10.40", 160, 174); });
  const envMat = unlit(envT, 0.95);
  const envelope = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), envMat); root.add(envelope);
  const envPile = new THREE.Group(); root.add(envPile); { const r = rng(17); for (let i = 0; i < 9; i++) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), envMat); e.rotation.set(-Math.PI / 2, 0, (r() - 0.5) * 1.5); e.position.set(1.9 + (r() - 0.5) * 0.5, AF + 0.01 + i * 0.003, 16.35 + (r() - 0.5) * 0.35); envPile.add(e); } }
  // couch, coffee table + pizza box, TV with glow, floor lamp, the closet stuffed with books
  { const sofa = M("Sofa", "#5a6a3a"); bA.add(new RoundedBoxGeometry(2.2, 0.42, 0.9, 3, 0.08).translate(2.4, AF + 0.32, 16.85), sofa); bA.add(new RoundedBoxGeometry(2.2, 0.62, 0.25, 3, 0.08).translate(2.4, AF + 0.7, 17.3), sofa); for (const s of [-1, 1]) bA.add(new RoundedBoxGeometry(0.25, 0.55, 0.9, 3, 0.08).translate(2.4 + s * 1.12, AF + 0.45, 16.85), sofa); for (const x of [1.8, 3.0]) bA.add(new RoundedBoxGeometry(0.9, 0.12, 0.7, 2, 0.05).translate(x, AF + 0.58, 16.8), M("Cushion", "#6e7e48"));
    bA.add(bx(1.1, 0.05, 0.55).translate(2.4, AF + 0.42, 15.9), M("CTable", "#6a4228")); for (const sx of [-0.5, 0.5]) for (const sz of [-0.22, 0.22]) bA.add(bx(0.04, 0.42, 0.04).translate(2.4 + sx, AF + 0.21, 15.9 + sz), M("CTable", "#6a4228"));
    bA.add(bx(0.42, 0.05, 0.42).translate(2.25, AF + 0.47, 15.9), M("Pizza", "#d8b888"));
    bA.add(bx(1.4, 0.45, 0.4).translate(2.5, AF + 0.22, 14.0), M("TVStand", "#3a3a40")); bA.add(bx(1.1, 0.65, 0.06).translate(2.5, AF + 0.78, 14.0), M("TVB", "#1e1e24")); }
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), unlit(ctex("lbTV", 256, 144, (g) => { const gr = g.createLinearGradient(0, 0, 256, 144); gr.addColorStop(0, "#4a8ad8"); gr.addColorStop(1, "#2a3a7a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 144); g.fillStyle = "#3ad86a"; g.fillRect(0, 100, 256, 44); g.fillStyle = "#f4f0e2"; g.beginPath(); g.arc(150, 80, 8, 0, TAU); g.fill(); }), 1.0)); tvScreen.position.set(2.5, AF + 0.78, 14.04); root.add(tvScreen);
  const tvLight = new THREE.PointLight("#7aa8ff", 0, 4, 1.6); tvLight.position.set(2.5, AF + 0.9, 14.6); root.add(tvLight);
  const aptLamp = lamp(root, [5.6, AF + 1.6, 17.0], "#ffc878", 0, 6, "table"); aptLamp.scale.setScalar(1.3);
  bA.add(new THREE.CylinderGeometry(0.02, 0.03, 1.5, 6).translate(5.6, AF + 0.75, 17.0), M("Iron", "#2e3238"));
  const closetDoor = new THREE.Group(); closetDoor.position.set(-0.95, AF, 15.0); root.add(closetDoor);
  { const cd = new THREE.Mesh(bx(0.05, 2.1, 1.0).translate(0, 1.05, 0.5), M("ClosetD", "#e8dcc4", beamHD())); cd.castShadow = true; closetDoor.add(cd); const kn = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), M("Brass", "#c49a4a")); kn.position.set(0.06, 1.0, 0.9); closetDoor.add(kn); }
  const closetBooks: THREE.Mesh[] = []; { const r = rng(19); for (let i = 0; i < 30; i++) { const me = mkBook(i + 5); me.userData = { r: r(), r2: r(), r3: r() }; root.add(me); closetBooks.push(me); } }
  // the blinds in his window (c.blinds 0 open .. 1 shut)
  const blinds: THREE.Mesh[] = []; { const bm = M("Blind", "#efe8d8"); for (let k = 0; k < 16; k++) { const s = new THREE.Mesh(bx(2.0, 0.012, 0.09), bm); s.position.set(2.6, 5.98 - k * 0.1, 13.75); s.castShadow = true; root.add(s); blinds.push(s); } }

  // ===================== small 3D story props =====================
  // the Loophole Key in the hatch lock (c.keyOn, c.keyTurn 0..1): brass bow + shaft + bit, red string loop hanging
  const key3 = new THREE.Group(); root.add(key3);
  { const br = M("KeyBrass", "#e0b040", undefined, { emissive: "#3a2a08" }); const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; key3.add(me); return me; };
    add(new THREE.TorusGeometry(0.022, 0.006, 8, 18).translate(0, 0, 0.06), br); add(new THREE.CylinderGeometry(0.0045, 0.0045, 0.055, 8).rotateX(Math.PI / 2).translate(0, 0, 0.025), br); add(bx(0.012, 0.004, 0.012).translate(0.006, 0, 0.004), br);
    const str = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.0025, 6, 24), M("KeyStr", "#c8282a")); str.position.set(0, -0.045, 0.06); str.rotation.y = Math.PI / 2; key3.add(str); }
  // grandma's wheelbarrow (c.barrowOn, barrowX, barrowZ, barrowYaw, barrowTip 0..1)
  const barrow = new THREE.Group(); root.add(barrow); const tray = new THREE.Group(); barrow.add(tray);
  { const gm = M("Barrow", "#3e7a5a"), wood = M("BarrowW", "#8a5a34", beamHD());
    const trayG = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.28, 0.82, 3, 0.05), gm); trayG.position.set(0, 0.48, 0.05); trayG.castShadow = true; tray.add(trayG);
    for (const s2 of [-1, 1]) { const h = new THREE.Mesh(bx(0.04, 0.04, 1.3), wood); h.position.set(s2 * 0.26, 0.42, -0.35); h.rotation.x = -0.18; h.castShadow = true; tray.add(h); const leg = new THREE.Mesh(bx(0.04, 0.32, 0.04), wood); leg.position.set(s2 * 0.24, 0.18, -0.3); tray.add(leg); }
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 16).rotateZ(Math.PI / 2), M("Tyre", "#2c2a2e")); wheel.position.set(0, 0.17, 0.52); tray.add(wheel);
    const r = rng(23); for (let i = 0; i < 9; i++) { const me = mkBook(i + 2); me.position.set((r() - 0.5) * 0.4, 0.62 + i * 0.03, 0.05 + (r() - 0.5) * 0.5); me.rotation.y = (r() - 0.5) * 0.8; tray.add(me); } }
  // the callback book (coffee-stained, 1994) sliding down the return-room chute into Marge's hands (c.cbBook 0..1, c.cbX/Y/Z when held)
  const cbBook = new THREE.Group(); root.add(cbBook);
  { const covT = ctex("lbCbCover", 256, 320, (g) => { g.fillStyle = "#2c5a8a"; g.fillRect(0, 0, 256, 320); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(0, 0, 24, 320); g.fillStyle = "#f2e2b0"; g.font = "900 40px Georgia"; g.textAlign = "center"; g.fillText("BOATS", 128, 60); g.fillText("OF THE", 128, 104); g.fillText("WORLD", 128, 148); g.strokeStyle = "rgba(110,60,24,0.8)"; g.lineWidth = 14; g.beginPath(); g.arc(150, 220, 56, 0, TAU); g.stroke(); });
    const bk = new THREE.Mesh(bx(0.26, 0.045, 0.33), [M("CoastPg", "#ffffff", pageEdge()), M("CoastPg", "#ffffff", pageEdge()), M("CbCov", "#ffffff", covT), M("CoastPg", "#ffffff", pageEdge()), M("CoastPg", "#ffffff", pageEdge()), M("CoastPg", "#ffffff", pageEdge())]); bk.castShadow = true; cbBook.add(bk); }
  b.build(root); bIn.build(root); bA.build(root);

  const marks: Record<string, V3> = {
    marge0: [3.6, 0, -0.6], margeSign: [4.05, 0, -0.85], margeBin: [2.25, 0, -0.75], gary0: [3.95, 0, -0.6], kid: [2.8, 0, -0.8], grandma: [3.2, 0, -0.45],
    truckDwayne: [-1.5, 0, -3.6], deskPatron: [0.35, 1.44, -12.15], gary: [0.7, 1.44, -13.75], deskDoor: [0, 1.44, -8.6],
    margeHead: [6.0, 1.44, -15.25], garySeat: [5.0, 1.44, -16.4], harold: [7.05, 1.44, -17.4], denise: [4.95, 1.44, -18.4], kevin: [7.05, 1.44, -19.4], kevinBoard: [4.9, 1.44, -22.7],
    margeHeap: [-6.3, 1.44, -18.6], kevinTally: [-3.7, 1.44, -23.2], garyDoor: [-4.2, 1.44, -13.6],
    dwCouch: [2.2, 3.6, 16.75], dwCloset: [-0.6, 3.6, 15.5], dwWindow: [2.6, 3.6, 14.25],
    margeWalk0: [-9.5, 0, 11.9], dwMail: [-3.0, 0, 11.9], pruitt: [3.95, 0, -0.35], cyclist: [-12, -0.15, 2.4],
  };
  const cams: SetDef["cams"] = {
    front: { pos: [2.0, 1.4, 4.6], look: [1.0, 2.4, -5.0], fov: 56 },
    bin: { pos: [3.6, 1.2, 1.4], look: [3.0, 0.9, -1.6], fov: 52 },
    desk: { pos: [0.4, 2.9, -9.4], look: [0.4, 2.5, -13.2], fov: 54 },
    board: { pos: [3.4, 3.1, -14.6], look: [6.4, 2.3, -19.0], fov: 58 },
    heap: { pos: [-3.6, 3.2, -15.2], look: [-7.0, 2.2, -19.5], fov: 58 },
    apt: { pos: [3.4, 4.9, 14.2], look: [2.2, 4.4, 17.2], fov: 58 },
    across: { pos: [-1.4, 1.5, 8.6], look: [-3.0, 1.0, 11.8], fov: 56 },
  };
  const camRef = new THREE.Vector3();
  return {
    name: "library", root, marks, cams, title: [binG],
    pose: (t, c) => {
      // street furniture lights
      const lo = c.lamps ?? 0; for (const l of [...posts, ...street]) { (l.userData.light as THREE.PointLight).intensity = lo * 6; (l.userData.glow as THREE.Sprite).visible = lo > 0.05; }
      const lit = c.libLit ?? 0; libWins.forEach((m) => { m.visible = lit > 0.05; });
      pend.forEach((l) => { (l.userData.light as THREE.PointLight).intensity = c.pend ?? 0; });
      // render speed (2026-11-16: 20 point lights made frames 5x slower in software GL): a light that is off is removed
      // from the shaders (visible = false), so each scene only pays for the lights it uses
      const inside = (c.pend ?? 0) > 0.01;
      for (const l of [...posts, ...street]) (l.userData.light as THREE.PointLight).visible = lo > 0.05;
      // c.pm: which pendants are lit (bit i = pend[i]: 0 hall W, 1 hall E, 2 hall C, 3 back W (return room), 4 back E (board room), 5 back C);
      // c.bk: the banker's lamps; c.rr: the return-room lamp. Defaults: all on when inside.
      const pm = c.pm ?? 63;
      pend.forEach((l, i) => { (l.userData.light as THREE.PointLight).visible = inside && ((pm >> i) & 1) === 1; });
      for (const l of bankers) (l.userData.light as THREE.PointLight).visible = inside && (c.bk ?? 1) > 0;
      (rrLamp.userData.light as THREE.PointLight).visible = inside && (c.rr ?? 1) > 0;
      tvLight.visible = (c.tv ?? 0) > 0.01; (aptLamp.userData.light as THREE.PointLight).visible = (c.aptLamp ?? 0) > 0.01;
      // bin
      hatch.rotation.y = -1.9 * sm(c.hatch ?? 0); flap.rotation.x = -1.2 * (c.flap ?? 0);
      const fill = c.binFill ?? 0; binBooks.children.forEach((o) => { o.visible = (o.userData.k as number) < fill; });
      const sp = c.spider ?? 0; spider.visible = sp > 0; spider.position.y = 1.12 - 0.62 * sm(sp); (spider.children[0] as THREE.Mesh).scale.y = 0.62 * sm(sp) + 0.001; (spider.children[0] as THREE.Mesh).position.y = 0; spider.children[0].position.y = 0.62 * sm(sp) * 0 ; spider.rotation.y = t * 0.6;
      { const th = spider.children[0] as THREE.Mesh; th.scale.y = Math.max(0.001, 1.12 - spider.position.y); }
      const lf = c.leaf ?? -1; binLeaf.visible = lf >= 0 && lf <= 1; if (binLeaf.visible) { binLeaf.position.set(-0.3 + 0.6 * lf, 0.3 + Math.sin(lf * Math.PI) * 0.35, 0.05 * Math.sin(t * 7)); binLeaf.rotation.set(t * 3, t * 2, t * 4); }
      told.visible = (c.told ?? 0) > 0; told.scale.setScalar(0.7 + 0.3 * sm((c.told ?? 0) * 3)); told.rotation.z = (1 - sm((c.told ?? 0) * 3)) * 0.2;
      jar.visible = (c.jar ?? 0) > 0; (jar.getObjectByName("lid") as THREE.Mesh).rotation.z = 1.2 * (1 - (c.jarLid ?? 1));
      // LATE FEES sign
      const sP = c.signP ?? 0;
      if (sP < 0.5) { signG.position.set(LIB.SIGNPOST[0], 1.62, LIB.SIGNPOST[2]); signG.rotation.set(0, -0.15, 0); }
      else if (sP < 1.5) { signG.position.set(c.signX ?? 4.0, c.signY ?? 1.4, c.signZ ?? -1.0); signG.rotation.set(c.signRx ?? 0, c.signRy ?? -0.3, c.signRz ?? 0); }
      else { const u = c.signFly ?? 0, x0 = c.signX ?? 4.0, y0 = c.signY ?? 1.4, z0 = c.signZ ?? -1.0; signG.position.set(x0 + (c.signDX ?? 2.6) * u, y0 + 2.0 * Math.sin(Math.PI * u) - 1.4 * u * u, z0 + (c.signDZ ?? -1.6) * u); signG.rotation.set(u * 5.5, u * 2.2, u * 7.0); signG.visible = u < 0.97; }
      if (sP < 1.5) signG.visible = true;
      signPost.rotation.z = sP > 0.5 ? -0.05 * Math.sin(t * 9) * Math.max(0, 1 - (c.postK ?? 0)) : 0;
      // truck (rear axle z, wheels climb the steps)
      truck.visible = (c.truckOn ?? 0) > 0;
      if (truck.visible) { const zr = c.truckZ ?? 2.0, zf = zr + WB, yr = stepY(zr) + (zr > 1.0 ? -0.15 : 0), yf = stepY(zf) + (zf > 1.0 ? -0.15 : 0), pitch = Math.atan2(yr - yf, WB);
        truck.position.set(c.truckX ?? -1.5, (yr + yf) / 2 + (c.truckBob ?? 0) * 0.04 * Math.sin(t * 40), zr + WB / 2); truckBody.position.set(0, 0, -WB / 2); truck.rotation.set(pitch, 0, 0);
        (truckBody.userData.wheels as THREE.Group[]).forEach((w) => { w.rotation.x = -zr / 0.38; });
        tailgate.rotation.x = 1.55 * sm(c.tailgate ?? 0); const tb = c.truckBooks ?? 1; bedBooks.children.forEach((o, i) => { o.visible = i / 70 < tb; }); }
      // the hook wave of books: from the tailgate down the steps (c.books 0..1)
      const wk = c.books ?? 0;
      wave.forEach((me, i) => { const s = (me.userData.s as number), d = wk * 1.6 - (i / 46) * 0.7; me.visible = wk > 0 && d > 0; if (!me.visible) return; const u = cl(d), sx = (c.truckX ?? -1.5) + 1.25 + s * 1.7, z0 = (c.truckZ ?? -4.4) - 0.6, z1 = -1.4 + (s - 0.5) * 1.6;
        const z = lerp(z0, z1, u), y = Math.max(stepY(z) + 0.03, lerp(stepY(z0) + 1.0, 0.03, u) + Math.sin(u * Math.PI) * 0.5 + 0.05 * Math.abs(Math.sin(u * 14 + s * 9)) * (1 - u));
        me.position.set(sx + Math.sin(i) * 0.3 * u, y, z); me.rotation.set(u * (6 + s * 8) * (u < 0.98 ? 1 : 0), s * 6 + u * 3, u * (4 + s * 5) * (u < 0.98 ? 1 : 0)); });
      // the chute pour into the return room (c.pour 0..1 = rate)
      const pr = c.pour ?? 0; pourB.forEach((me, i) => { const per = 1.1, u = ((t * (0.9 + (i % 5) * 0.08) + i / pourB.length * per) % per) / per; me.visible = pr > (i / pourB.length) * 0.95; if (!me.visible) return;
        const p0 = LIB.CHUTE, x = lerp(p0[0] + 0.3, -6.6 + (i % 4) * 0.5 - 1.0, u), y = p0[1] - 0.2 - u * 2.8 + Math.sin(u * Math.PI) * 0.4, z = p0[2] + ((i % 3) - 1) * 0.35 + u * (i % 2 ? 0.6 : -0.4);
        me.position.set(x, Math.max(F + 0.4, y), z); me.rotation.set(u * 9 + i, u * 4, u * 7 + i * 0.5); });
      const mk = c.mountain ?? 0; mountain.forEach((g, i) => { g.visible = i / mountain.length < mk; });
      tallyMat.map = tallyTs[Math.round(cl(c.tally ?? 0) * 10)]; dust.forEach((s, i) => { const u = ((t * 0.05 + i * 0.13) % 1); s.position.y = F + 0.8 + ((i * 0.37 + t * 0.03) % 1) * 4.2; s.position.x += Math.sin(t * 0.7 + i) * 0.0008; (s.material as THREE.SpriteMaterial).opacity = (c.dayDust ?? 1) * 0.5 * Math.sin(u * Math.PI); });
      cartBooks.children.forEach((o) => { o.visible = (o.userData.k as number) < (c.cart ?? 0.3); });
      // the board room
      coaster.visible = true; spill.visible = (c.coffee ?? 0) > 0; spill.scale.setScalar(0.2 + 0.8 * sm(c.coffee ?? 0)); garyMug.position.y = 0.045 + 0.06 * Math.sin(Math.PI * sm(c.ring ?? 0)); garyMug.position.x = -0.04 - 0.3 * sm(c.ring ?? 0);   /* toward Gary, away from the insert lens */ garyMug.rotation.z = (c.slosh ?? 0) * 0.35;
      wbMat.map = boardTs[Math.round(cl(c.board ?? 0) * 4)];
      // Dwayne's flat
      tvLight.intensity = (c.tv ?? 0) * 2.2; (aptLamp.userData.light as THREE.PointLight).intensity = (c.aptLamp ?? 0) * 5;
      const en = c.envelope ?? -1; envelope.visible = en >= 0; if (en >= 0) { const u = sm(en); envelope.position.set(LIB.APT_DOOR[0] + 0.1 * u, AF + 1.0 - 0.95 * u + (u < 0.3 ? 0 : 0), 17.45 - 0.35 * u); envelope.rotation.set(-Math.PI / 2 * u, Math.PI, 0.4 * u); }
      if ((c.envKick ?? 0) > 0) { const u = sm(c.envKick ?? 0); envelope.position.set(lerp(LIB.APT_DOOR[0] + 0.1, 2.0, u), AF + 0.012, lerp(17.1, 16.4, u)); envelope.rotation.set(-Math.PI / 2, 0, u * 3); }
      const cs = c.closet ?? 0; closetDoor.rotation.y = -1.3 * Math.min(1, cs * 2) * (1 - sm((c.closetShut ?? 0))); closetBooks.forEach((me, i) => { const d = me.userData as { r: number; r2: number; r3: number }; const u = cl(cs * 2 - d.r * 0.6); me.visible = cs > 0; me.position.set(-0.6 + u * (0.6 + d.r2 * 1.4), AF + 0.05 + (1 - u) * (0.4 + d.r3 * 1.6) + Math.sin(u * Math.PI) * 0.3, 15.1 + d.r * 0.9); me.rotation.set(u * 6 * d.r2, d.r3 * 6, u * 5 * d.r); });
      const bl = c.blinds ?? 0; blinds.forEach((s, k) => { const top = 5.98, y = Math.max(top - k * 0.1, top - (1 - bl) * 1.5 - k * 0.012); s.position.y = bl > 0 ? lerp(top - k * 0.0125, top - k * 0.1, bl) : top - k * 0.0125; s.rotation.x = 1.2 * (1 - bl); void y; });
      // trash can (Dwayne climbs in: lid down, then it waddles)
      const ck = c.can ?? 0; can.position.set(LIB.CAN[0] + (c.canX ?? 0), Math.abs(Math.sin((c.canX ?? 0) * 9)) * 0.05 * (c.canHop ?? 0), LIB.CAN[2]); can.rotation.z = Math.sin((c.canX ?? 0) * 9) * 0.08 * (c.canHop ?? 0); canLid.position.y = 0.87 + 0.6 * (1 - sm(ck * 1.2)) * (c.canOpen ?? 0); canLid.rotation.z = 0.8 * (1 - sm(ck)) * (c.canOpen ?? 0);
      // key in the hatch lock: it sits at the keyhole and turns a quarter (the hatch carries it when it opens)
      key3.visible = (c.keyOn ?? 0) > 0; if (key3.visible) { const hp = new THREE.Vector3(0.52, 0, 0.05).applyEuler(hatch.rotation).add(hatch.position).add(binG.position); key3.position.copy(hp); key3.rotation.set(0, hatch.rotation.y, (c.keyTurn ?? 0) * Math.PI / 2); }
      barrow.visible = (c.barrowOn ?? 0) > 0; barrow.position.set(c.barrowX ?? 4.0, 0, c.barrowZ ?? -0.4); barrow.rotation.y = c.barrowYaw ?? 0; tray.rotation.x = -0.9 * sm(c.barrowTip ?? 0); tray.position.y = 0.3 * sm(c.barrowTip ?? 0);
      const cb = c.cbBook ?? -1; cbBook.visible = cb >= 0; if (cb >= 0) { if (cb <= 1) { const u = cb, p0 = LIB.CHUTE; cbBook.position.set(lerp(p0[0] + 0.2, c.cbX ?? -7.6, u), lerp(p0[1] - 0.25, c.cbY ?? 2.9, u) + Math.sin(u * Math.PI) * 0.2, lerp(p0[2], c.cbZ ?? -18.9, u)); cbBook.rotation.set(u * 4, 0.6 + u, u * 3); } else { cbBook.position.set(c.cbX ?? -7.6, c.cbY ?? 2.9, c.cbZ ?? -18.9); cbBook.rotation.set(c.cbRx ?? 1.2, c.cbRy ?? 0.4, 0); } }
      void camRef;
    },
  };
};
