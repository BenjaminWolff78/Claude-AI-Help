// "The Skull That Was Worth More in Pieces" (2026-11-20): Java, 1937. ORIGINAL set (no real place copied). Local metres, y up.
//  THE STATION (x -6..6, z -6..2): Ralph's open-sided pendopo (joglo roof on 8 posts), his table at the front edge (top y 0.8,
//    centre (0, 0.8, 0)) with the COUNTING TRAY (12 numbered slots, "10¢ A PIECE"), coin stacks, ledger, scale, hurricane lamp,
//    specimen jars; the SIGN on an easel behind Ralph (-0.72, 1.5, -1.15) "10¢ PER PIECE" (c.repaint 0..1 -> "WHOLE SKULLS ONLY");
//    the dirt yard in front where the queue stands; rice terraces behind the yard (+z), palms, the volcano far off (-z).
//  RALPH'S SHED (x 7..11, z -3.6..0.4): bamboo walls, thatch roof, door at z 0.4 (x 9), crates of shards, the TALLY BOARD on
//    the back wall (9, 1.5, -3.45) "PIECES" + c.tally.
//  THE VILLAGE LANE (x 12..44, z 1..7): kampung houses (woven bamboo walls, tiled roofs) on both sides, Agus's porch bench
//    (20.5, 0, 0.4) with the PAPAYA plate (c.papCut 0..1), the breakfast mat (15.5, 0, 3.4) with rice bowls and the "10¢" tin,
//    the new BICYCLE (26.4, 0, 4.4), flat hammering stones along the lane, the elder's bone pile, a well, laundry.
//  THE RIVERBANK (x 128..152): an eroded clay bank (face at z -3.5, 3.6 m high, coloured layers), the ledge (y 0, z -3.5..1.2),
//    the river below (y -0.55, z 1.6..60), the far bank with palms and bamboo, morning mist.
//  STORY OBJECTS (controls): the SKULL (c.skX/skY/skZ/skRY, c.skVis) and its 12 PIECES (c.shatter 0..1 flies them from the skull
//    into the tray slots), two loose SHARDS for the lamp test (c.shA*, c.shFit), the 12-coin COLUMN (c.colX, c.colVis), per-slot
//    COINS (c.coins 0..12), the tray mechanism (c.trayWhole 0..1 = a whole skull sits in slot 1), the PAYOFF heap (c.payoff),
//    the PUZZLE BOX lid, the GLUED SKULL (c.gX/gY/gZ/gRY, c.gVis), the coin POUR (c.pour 0..1, c.pourHX/HY/HZ hands).
import * as THREE from "three";
import { Batch, V, lam, quad } from "../build";
import { ctex, rng, rep, roofHD, planksHD, grassHD } from "../paint";
import { NOINK } from "../ink";
import { glow, mist, lamp, flicker, crate, waterPlane } from "../setkit";
import { palm, swayPalm, weaveTex, hill, fruitPile, type Palm } from "./portkit_common";
import { clayGroundTex } from "./brickyard";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const M = (key: string, color: string, map?: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) => lam("jv" + key, () => ({ color, ...(map ? { map } : {}), ...extra }));
/** painted boards: a white MeshBasic with a map is converted to a lit material by realify (so signs take the scene light) */
const unlit = (map: THREE.Texture, _k = 1) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(1, 1, 1), toneMapped: true });
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0: number, r1: number, h: number, n = 28) => new THREE.CylinderGeometry(r0, r1, h, n);

export const JV = {
  TABLE: [0, 0.8, 0] as V3, RALPH: [0.15, 0, -0.85] as V3, FRONT: [0.35, 0, 0.95] as V3, SIGN: [-0.72, 1.5, -1.15] as V3,
  TRAY: [0.1, 0.82, 0.12] as V3, LAMP: [1.2, 0.8, -0.3] as V3, SMASH: [-0.35, 0.95, 0.3] as V3,
  QUEUE: [[0.35, 0, 0.95], [1.35, 0, 1.75], [2.15, 0, 2.55], [3.05, 0, 3.3], [3.85, 0, 4.15], [4.6, 0, 5.0]] as V3[],
  SHED: [9, 0, 0.4] as V3, TALLY: [9, 1.85, -3.42] as V3,
  PORCH: [20.5, 0, 0.4] as V3, PLATE: [21.1, 0.5, 0.42] as V3, MAT: [16.8, 0, 6.3] as V3, TIN: [17.75, 0, 5.85] as V3, BIKE: [26.4, 0, 4.4] as V3,
  PILE: [23.6, 0, 2.6] as V3, LANE: [30, 0, 4] as V3,
  BANK: [140, 0, -2.6] as V3, BANKSKULL: [140.25, 0.95, -3.42] as V3, JOKO_R: [141.35, 0, -2.15] as V3,
};
/** tray slot k (0..11) centre on the table (pieces sit here) */
export const slotAt = (k: number): V3 => [JV.TRAY[0] - 0.88 + k * 0.16, JV.TRAY[1] + 0.05, JV.TRAY[2]];

// ---------------- textures ----------------
/** fossil bone: cream-brown mottling, mineral stains, sutures; u = 0.5 at the front (+z), v = 0 at the top */
const fossilTex = (glued = false) => ctex("jvFossil" + (glued ? "G" : ""), 1024, 512, (g, r) => {
  g.fillStyle = "#cdb48a"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i++) { const x = r() * 1024, y = r() * 512, s = 8 + r() * 46; g.fillStyle = `rgba(${r() < 0.5 ? "120,84,44" : "232,214,176"},${0.08 + r() * 0.14})`; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(70,46,22,${0.2 + r() * 0.25})`; g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * 1024, y = r() * 300; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 30; y += r() * 18; g.lineTo(x, y); } g.stroke(); }
  // the face (front, u 0.5): brow ridge, two deep sockets, the nasal hole, a row of worn teeth
  const fx = 512; g.fillStyle = "rgba(140,104,60,0.55)"; g.fillRect(fx - 150, 196, 300, 20);
  for (const s of [-1, 1]) { const gr = g.createRadialGradient(fx + s * 62, 252, 6, fx + s * 62, 252, 50); gr.addColorStop(0, "#1e140c"); gr.addColorStop(0.7, "#3a2616"); gr.addColorStop(1, "rgba(90,60,30,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(fx + s * 62, 252, 48, 40, 0, 0, TAU); g.fill(); }
  g.fillStyle = "#2a1a10"; g.beginPath(); g.moveTo(fx, 290); g.lineTo(fx - 18, 334); g.lineTo(fx + 18, 334); g.closePath(); g.fill();
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 4 === 2 ? "#8a6a3a" : "#e8dcbc"; g.fillRect(fx - 72 + i * 16, 360, 13, 26 - (i % 3) * 4); g.strokeStyle = "#4a3018"; g.lineWidth = 2; g.strokeRect(fx - 72 + i * 16, 360, 13, 26 - (i % 3) * 4); }
  // sutures on the dome
  g.strokeStyle = "rgba(60,40,20,0.5)"; g.lineWidth = 2; for (const y0 of [70, 120]) { g.beginPath(); for (let x = 0; x <= 1024; x += 8) g.lineTo(x, y0 + Math.sin(x * 0.12) * 4 + (r() - 0.5) * 3); g.stroke(); }
  if (glued) { g.strokeStyle = "#3a2410"; g.lineWidth = 5; for (let k = 0; k <= 4; k++) { const x = k * 256 + 28; g.beginPath(); for (let y = 0; y < 512; y += 10) g.lineTo(x + (r() - 0.5) * 10, y); g.stroke(); }
    for (const y0 of [150, 310]) { g.beginPath(); for (let x = 0; x <= 1024; x += 10) g.lineTo(x, y0 + (r() - 0.5) * 10); g.stroke(); }
    g.strokeStyle = "rgba(216,140,30,0.85)"; g.lineWidth = 9; for (let k = 0; k <= 4; k++) { const x = k * 256 + 28; g.beginPath(); for (let y = 0; y < 512; y += 10) g.lineTo(x + 6 + (r() - 0.5) * 6, y); g.stroke(); } }
});
const signTex = (k: number) => ctex("jvSign" + Math.round(k * 24), 1024, 560, (g) => {
  g.fillStyle = "#efe0b8"; g.fillRect(0, 0, 1024, 560); for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(150,110,60,${0.06 + (i % 3) * 0.03})`; g.fillRect(0, i * 64, 1024, 30); }
  g.strokeStyle = "#5a3a20"; g.lineWidth = 16; g.strokeRect(10, 10, 1004, 540);
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#2a1a10"; g.font = "900 168px Georgia, serif"; g.fillText("10¢", 512, 160); g.font = "900 128px Georgia, serif"; g.fillText("PER PIECE", 512, 360);
  if (k > 0) { // the repaint: a cross through the old words (0..0.25), then a cream panel with the new rule, painted left to right
    const c = cl(k / 0.25); g.strokeStyle = "#b3262e"; g.lineWidth = 30; g.lineCap = "round"; g.beginPath(); g.moveTo(80, 120); g.lineTo(80 + 860 * c, 120 + 300 * c); g.stroke();
    if (k > 0.25) { const p = cl((k - 0.25) / 0.75); g.fillStyle = "#f6ecd2"; g.fillRect(40, 60, 944 * Math.min(1, p * 1.3), 440); g.save(); g.beginPath(); g.rect(40, 60, 944 * p, 440); g.clip();
      g.fillStyle = "#b3262e"; g.font = "900 150px Georgia, serif"; g.fillText("WHOLE", 512, 170); g.font = "900 110px Georgia, serif"; g.fillText("SKULLS ONLY", 512, 370); g.restore(); } }
});
const trayTex = () => ctex("jvTray", 1024, 128, (g) => { g.fillStyle = "#7a5230"; g.fillRect(0, 0, 1024, 128); g.fillStyle = "#f2e2b8"; g.font = "900 46px Georgia"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let k = 0; k < 12; k++) g.fillText(String(k + 1), 42 + k * 85.3, 40); g.font = "900 40px Georgia"; g.fillText("10¢  A  PIECE", 512, 100); });
const tallyTex = (n: number) => ctex("jvTally" + n, 512, 384, (g, r) => { g.fillStyle = "#24302a"; g.fillRect(0, 0, 512, 384); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(240,240,230,${0.03 + r() * 0.04})`; g.fillRect(r() * 512, r() * 384, 60, 20); }
  g.strokeStyle = "#6a4a2a"; g.lineWidth = 18; g.strokeRect(9, 9, 494, 366); g.fillStyle = "rgba(240,238,226,0.92)"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "900 70px Georgia"; g.fillText("PIECES", 256, 92); g.font = "900 150px Georgia"; g.fillText(String(n), 256, 240);
  for (let k = 0; k < 8; k++) { g.strokeStyle = "rgba(240,238,226,0.7)"; g.lineWidth = 5; const x = 40 + k * 56; for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(x + j * 9, 318); g.lineTo(x + j * 9, 352); g.stroke(); } g.beginPath(); g.moveTo(x - 4, 346); g.lineTo(x + 32, 322); g.stroke(); } });
const lidTex = () => ctex("jvLid", 768, 512, (g) => { g.fillStyle = "#c04a3c"; g.fillRect(0, 0, 768, 512); g.strokeStyle = "#f2c94c"; g.lineWidth = 14; g.strokeRect(14, 14, 740, 484);
  g.fillStyle = "#f4ead2"; g.fillRect(150, 60, 468, 300); g.strokeStyle = "#5a3a20"; g.lineWidth = 6; g.strokeRect(150, 60, 468, 300); g.setLineDash([16, 12]); g.strokeStyle = "rgba(90,60,30,0.4)"; g.strokeRect(176, 86, 416, 248); g.setLineDash([]);
  g.fillStyle = "#f2c94c"; g.font = "900 64px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ANCIENT HUMAN", 384, 410); g.font = "900 44px Georgia"; g.fillText("3000 PIECES", 384, 466); });
const tinTex = () => ctex("jvTin", 256, 128, (g) => { g.fillStyle = "#c8352e"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#f2e2b8"; g.font = "900 64px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("10¢", 128, 66); });
const bagTex = () => ctex("jvBag", 256, 256, (g, r) => { g.fillStyle = "#c8a46a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,60,30,${r() * 0.15})`; g.fillRect(r() * 256, r() * 256, 3, 1); }
  g.fillStyle = "#5a2a1a"; g.font = "900 96px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("100", 128, 140); });
const strataTex = () => ctex("jvStrata", 1024, 1024, (g, r) => { const bands = ["#a8784a", "#c49a62", "#8a6a4a", "#b88a5a", "#6e5a48", "#c8a06a", "#9a7048", "#7a6650"];
  let y = 0, i = 0; while (y < 1024) { const h = 40 + r() * 120; g.fillStyle = bands[i % bands.length]; g.fillRect(0, y, 1024, h + 2); y += h; i++; }
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "60,40,24" : "236,214,170"},${0.08 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 2 + r() * 10, 1 + r() * 5, 0, 0, TAU); g.fill(); }
  for (let k = 0; k < 60; k++) { g.strokeStyle = "rgba(50,32,20,0.35)"; g.lineWidth = 1 + r() * 3; let x = r() * 1024, yy = r() * 300; g.beginPath(); g.moveTo(x, yy); for (let s = 0; s < 10; s++) { x += (r() - 0.5) * 14; yy += 20 + r() * 40; g.lineTo(x, yy); } g.stroke(); } });
const paddyTex = () => ctex("jvPaddy", 1024, 1024, (g, r) => { g.fillStyle = "#6a8a5a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(160,200,220,${0.1 + r() * 0.12})`; g.fillRect(0, r() * 1024, 1024, 10 + r() * 30); }
  for (let y = 8; y < 1024; y += 22) for (let x = 6 + (y % 44 ? 0 : 10); x < 1024; x += 20) { g.strokeStyle = r() < 0.5 ? "#7fae4e" : "#9ac260"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x - 3, y - 4); g.moveTo(x, y + 8); g.lineTo(x + 3, y - 5); g.moveTo(x, y + 8); g.lineTo(x, y - 7); g.stroke(); } });
const thatchTex = () => ctex("jvThatch", 512, 512, (g, r) => { g.fillStyle = "#9a7a4a"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 1600; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = r() < 0.5 ? "#c8a46a" : "#6e5230"; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y + 22 + r() * 20); g.stroke(); }
  for (let y = 0; y < 512; y += 64) { g.fillStyle = "rgba(40,28,14,0.35)"; g.fillRect(0, y, 512, 5); } });
const leafTex = () => ctex("jvBanLeaf", 128, 512, (g, r) => { g.clearRect(0, 0, 128, 512); g.fillStyle = "#4e8a34"; g.beginPath(); g.moveTo(64, 4); g.bezierCurveTo(124, 120, 124, 400, 64, 508); g.bezierCurveTo(4, 400, 4, 120, 64, 4); g.fill();
  g.strokeStyle = "#c8d878"; g.lineWidth = 4; g.beginPath(); g.moveTo(64, 6); g.lineTo(64, 506); g.stroke(); for (let y = 30; y < 500; y += 14) { g.strokeStyle = "rgba(40,80,30,0.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(64, y); g.lineTo(10, y + 16); g.moveTo(64, y); g.lineTo(118, y + 16); g.stroke(); }
  for (let i = 0; i < 6; i++) { const y = 60 + r() * 400; g.clearRect(r() < 0.5 ? 0 : 92, y, 36, 3); } });
const clothTex = (a: string, b: string) => ctex("jvCloth" + a + b, 128, 256, (g) => { g.fillStyle = a; g.fillRect(0, 0, 128, 256); g.fillStyle = b; for (let i = 0; i < 8; i++) g.fillRect(0, i * 32, 128, 12); for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 8, 0, 8, 256); });

/** a unit sphere patch with UVs taken from its direction (so each piece shows its part of the skull texture) */
const patch = (r: number, p0: number, pl: number, t0: number, tl: number, sx = 1, sy = 0.84, sz = 1.24) => {
  const geo = new THREE.SphereGeometry(r, 10, 6, p0, pl, t0, tl), P = geo.attributes.position as THREE.BufferAttribute, U = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), l = Math.hypot(x, y, z) || 1; U.setXY(i, 0.5 + Math.atan2(x, z) / TAU, 1 - Math.acos(cl(y / l, -1, 1)) / Math.PI); P.setXYZ(i, x * sx, y * sy, z * sz); }
  geo.computeVertexNormals(); return geo;
};
const PIECES: { p0: number; pl: number; t0: number; tl: number }[] = [];
for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) PIECES.push({ p0: (a * TAU) / 4 + 0.4, pl: TAU / 4, t0: [0, 0.36, 0.7][b] * Math.PI, tl: [0.36, 0.34, 0.3][b] * Math.PI });
const SKR = 0.17;   // skull radius (m): cartoon scale (the heads are 0.52 m wide), 34 cm wide x 42 cm long

export const javaset = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), nc = new Batch(), bc = new Batch();
  const sway: THREE.Mesh[] = [], palms: Palm[] = [], cloths: THREE.Mesh[] = [], smoke: THREE.Sprite[] = [];
  const clayM = M("Clay", "#ffffff", rep(clayGroundTex("jvClay", "#a07a52"), 18, 18)), grassM = M("Grass", "#ffffff", rep(grassHD(), 30, 30));
  const wood = M("Wood", "#d8c4a8", rep(planksHD(), 0.5, 0.5)), darkWood = M("DarkWood", "#5a3a22"), postM = M("Post", "#6a4428");
  const tileM = M("Tile", "#ffffff", roofHD("#a8502e")), tileM2 = M("Tile2", "#ffffff", roofHD("#8e4a30")), thatchM = M("Thatch", "#ffffff", rep(thatchTex(), 3, 3));
  const weaveM = M("Weave", "#ffffff", rep(weaveTex("#c8a468"), 4, 3)), weaveM2 = M("Weave2", "#ffffff", rep(weaveTex("#b08a52"), 4, 3));
  // ======================= GROUND: station + village + rice terraces + volcano =======================
  b.add(quad(V(-30, 0, 12), V(50, 0, 12), V(50, 0, -12), V(-30, 0, -12), 1, 1), clayM);
  nc.add(quad(V(-120, -0.04, 120), V(120, -0.04, 120), V(120, -0.04, -120), V(-120, -0.04, -120), 1, 1), grassM);
  { const pm = M("Paddy", "#ffffff", rep(paddyTex(), 4, 2)), dike = M("Dike", "#6a5a3a");   // terraces stepping down toward +z
    for (let i = 0; i < 6; i++) { const z0 = 13 + i * 9, y = -0.12 - i * 0.55; nc.add(quad(V(-40, y, z0 + 9), V(60, y, z0 + 9), V(60, y, z0), V(-40, y, z0), 1, 1), pm); nc.add(bx(100, 0.6, 0.5).translate(10, y + 0.05, z0), dike); }
    for (let i = 0; i < 4; i++) { const z0 = -16 - i * 9, y = -0.12 - i * 0.4; nc.add(quad(V(-40, y, z0), V(60, y, z0), V(60, y, z0 - 9), V(-40, y, z0 - 9), 1, 1), pm); nc.add(bx(100, 0.5, 0.5).translate(10, y + 0.05, z0), dike); } }
  { const vm = M("Volcano", "#ffffff", rep(ctex("jvVolc", 512, 512, (g, r) => { g.fillStyle = "#5a7a64"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "40,70,50" : "120,140,110"},0.25)`; g.fillRect(r() * 512, r() * 512, 4 + r() * 30, 30 + r() * 120); } }), 6, 2));
    nc.add(new THREE.ConeGeometry(140, 70, 64, 1, true).translate(-30, 33, -330), vm); nc.add(new THREE.ConeGeometry(110, 36, 64, 1, true).translate(160, 14, -300), vm);
    hill(root, [60, -2, 140], 90, 14, 40, "#5f9a48"); hill(root, [-80, -2, 150], 110, 18, 50, "#5a9446"); }
  // ======================= THE STATION (pendopo) =======================
  nc.add(bx(9.2, 0.06, 6.6).translate(0, 0.03, -1.8), M("Floor", "#a8a49a", rep(planksHD(), 2, 1.5)));
  /* 2026-11-20: the inner posts moved out to +-2.6 so they never stand between the camera and the table */ for (const x of [-4.2, -2.6, 2.6, 4.2]) for (const z of [-4.8, 1.2]) { b.add(cyl(0.11, 0.13, 3.1, 24).translate(x, 1.55, z), postM); b.add(bx(0.34, 0.12, 0.34).translate(x, 0.06, z), M("PostBase", "#8a8478")); }
  for (const x of [-1.6, 1.6]) for (const z of [-3.6, -2.2]) b.add(cyl(0.12, 0.14, 4.2, 24).translate(x, 2.1, z), postM);
  { // joglo roof: a wide low hip (eaves y 3.05, ridge band y 3.9) and a steep central pyramid to 5.6
    const e = 3.05, X0 = -5.4, X1 = 5.4, Z0 = -6.0, Z1 = 2.4, x0 = -2.2, x1 = 2.2, z0 = -3.6, z1 = 0.0, yb = 3.9;
    const q = (a: THREE.Vector3, bb: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, m: THREE.Material, u = 3) => b.add(quad(a, bb, c, d, u, 1), m);
    q(V(X0, e, Z1), V(X1, e, Z1), V(x1, yb, z1), V(x0, yb, z1), tileM); q(V(X1, e, Z0), V(X0, e, Z0), V(x0, yb, z0), V(x1, yb, z0), tileM);
    q(V(X1, e, Z1), V(X1, e, Z0), V(x1, yb, z0), V(x1, yb, z1), tileM, 2); q(V(X0, e, Z0), V(X0, e, Z1), V(x0, yb, z1), V(x0, yb, z0), tileM, 2);
    const t = 5.7, ax0 = -0.5, ax1 = 0.5;
    q(V(x0, yb, z1), V(x1, yb, z1), V(ax1, t, -1.8), V(ax0, t, -1.8), tileM2, 2); q(V(x1, yb, z0), V(x0, yb, z0), V(ax0, t, -1.8), V(ax1, t, -1.8), tileM2, 2);
    q(V(x1, yb, z1), V(x1, yb, z0), V(ax1, t, -1.8), V(ax1, t, -1.8), tileM2, 1); q(V(x0, yb, z0), V(x0, yb, z1), V(ax0, t, -1.8), V(ax0, t, -1.8), tileM2, 1);
    nc.add(bx(10.8, 0.18, 8.4).translate(0, e - 0.09, -1.8), M("Ceil", "#a08468"));   // the soffit (the underside reads as dark wood rafters)
    for (let k = 0; k < 14; k++) b.add(bx(0.08, 0.1, 8.2).translate(-5 + k * 0.77, e - 0.2, -1.8), darkWood);
    b.add(bx(11, 0.16, 0.16).translate(0, e - 0.05, Z1 + 0.02), darkWood); b.add(cyl(0.1, 0.1, 0.3, 16).translate(0, t + 0.1, -1.8), M("Finial", "#8a4a2a")); }
  // back wall (woven bamboo) with a doorway, shelves of specimen jars, a cot, maps
  nc.add(bx(9.0, 2.9, 0.12).translate(0, 1.45, -4.95), M("WeaveBack", "#d4ccc0", rep(weaveTex("#9c8668"), 3, 2)));   // calmer, darker back wall (the bright weave was too busy behind the faces)
  { const sh = M("Shelf", "#6a4a2e"); for (const y of [1.1, 1.6, 2.1]) b.add(bx(2.4, 0.05, 0.32).translate(-2.6, y, -4.72), sh);
    const r = rng(31); for (let k = 0; k < 18; k++) { const x = -3.6 + (k % 6) * 0.4, y = 1.1 + Math.floor(k / 6) * 0.5; b.add(cyl(0.07, 0.07, 0.2 + r() * 0.08, 20).translate(x, y + 0.13, -4.7), M("Jar" + (k % 3), ["#9ab8a4", "#c8b07a", "#a8a0b8"][k % 3], undefined, { transparent: true, opacity: 0.85 }));
      b.add(new THREE.SphereGeometry(0.035, 16, 10).translate(x, y + 0.1, -4.7), M("JarBone", "#d8c49a")); }
    b.add(bx(1.9, 0.08, 0.8).translate(2.7, 0.5, -4.2), M("Cot", "#8a6a44")); b.add(bx(1.8, 0.1, 0.7).translate(2.7, 0.58, -4.2), M("Blanket", "#3a5a7a")); for (const s of [-0.85, 0.85]) for (const t of [-0.32, 0.32]) b.add(bx(0.06, 0.46, 0.06).translate(2.7 + s, 0.23, -4.2 + t), darkWood);
    const map = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), unlit(ctex("jvMap", 512, 352, (g, r) => { g.fillStyle = "#e8d8b0"; g.fillRect(0, 0, 512, 352); g.strokeStyle = "#6a8ab0"; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 210); g.bezierCurveTo(140, 160, 300, 260, 512, 190); g.stroke();
      for (let i = 0; i < 9; i++) { g.strokeStyle = "rgba(120,90,50,0.6)"; g.lineWidth = 2; g.beginPath(); g.ellipse(250, 170, 40 + i * 22, 24 + i * 14, 0, 0, TAU); g.stroke(); } g.fillStyle = "#b3262e"; for (const [x, y] of [[200, 150], [260, 200], [320, 130]]) { g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); } void r; }), 0.92));
    map.position.set(0.2, 1.75, -4.87); root.add(map); }
  // ---- Ralph's table + the counting tray + the props on it ----
  { const [tx, ty, tz] = JV.TABLE; b.add(bx(2.7, 0.07, 0.95).translate(tx, ty - 0.035, tz), wood); for (const s of [-1.25, 1.25]) for (const t of [-0.4, 0.4]) b.add(bx(0.08, ty - 0.07, 0.08).translate(tx + s, (ty - 0.07) / 2, tz + t), darkWood);
    b.add(bx(2.6, 0.12, 0.04).translate(tx, ty - 0.13, tz + 0.46), darkWood);
    // the counting tray: a long box, 12 slot walls, numbers + "10¢ A PIECE" on the front edge
    const [rx, ry, rz] = JV.TRAY, tw = M("TrayW", "#8a5c34"); b.add(bx(1.94, 0.03, 0.24).translate(rx, ry + 0.0, rz), tw); b.add(bx(1.96, 0.09, 0.02).translate(rx, ry + 0.045, rz - 0.12), tw);
    for (let k = 0; k <= 12; k++) b.add(bx(0.014, 0.08, 0.24).translate(rx - 0.96 + k * 0.16, ry + 0.04, rz), tw);
    const tf = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 0.16), unlit(trayTex(), 0.95)); tf.position.set(rx, ry + 0.03, rz + 0.126); root.add(tf);
    // ledger (open, columns of ticks), scale, cash box, pen pot, magnifier
    const led = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.32), M("Ledger", "#ffffff", ctex("jvLedger", 512, 352, (g, r) => { g.fillStyle = "#f4ecd6"; g.fillRect(0, 0, 512, 352); g.fillStyle = "#c8b890"; g.fillRect(252, 0, 8, 352);
      for (let y = 24; y < 352; y += 22) { g.strokeStyle = "rgba(90,120,170,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(10, y); g.lineTo(500, y); g.stroke(); g.strokeStyle = "#2a2018"; g.lineWidth = 2; for (let k = 0; k < 2 + r() * 8; k++) { g.beginPath(); g.moveTo(20 + k * 9 + (y > 176 ? 250 : 0), y - 14); g.lineTo(20 + k * 9 + (y > 176 ? 250 : 0), y - 2); g.stroke(); } } })));
    led.rotation.x = -Math.PI / 2; led.rotation.z = 0.12; led.position.set(-0.85, ty + 0.012, tz - 0.12); root.add(led);
    b.add(bx(0.47, 0.02, 0.33).rotateY(0.12).translate(-0.85, ty + 0.005, tz - 0.12), M("LedCover", "#5a2a24"));
    const brass = M("Brass", "#c8a04a"); const sx0 = -1.12, sz0 = tz - 0.3; b.add(cyl(0.05, 0.07, 0.04, 24).translate(sx0, ty + 0.02, sz0), brass); b.add(cyl(0.012, 0.012, 0.3, 12).translate(sx0, ty + 0.18, sz0), brass); b.add(bx(0.34, 0.012, 0.012).translate(sx0, ty + 0.33, sz0), brass);
    for (const s of [-1, 1]) { b.add(cyl(0.004, 0.004, 0.14, 6).translate(sx0 + s * 0.16, ty + 0.26, sz0), brass); b.add(cyl(0.06, 0.05, 0.015, 24).translate(sx0 + s * 0.16, ty + 0.19, sz0), brass); }
    b.add(bx(0.3, 0.14, 0.2).translate(-0.35, ty + 0.07, tz - 0.3), M("CashBox", "#2f4a3a")); b.add(bx(0.31, 0.02, 0.21).translate(-0.35, ty + 0.15, tz - 0.3), M("CashLid", "#3a5a48"));
    b.add(cyl(0.035, 0.03, 0.1, 18).translate(0.6, ty + 0.05, tz - 0.32), M("PenPot", "#6a3a24")); b.add(cyl(0.004, 0.004, 0.16, 6).rotateZ(0.2).translate(0.61, ty + 0.12, tz - 0.32), M("Pen", "#1a1a1a"));
    b.add(cyl(0.05, 0.05, 0.008, 24).rotateX(Math.PI / 2).translate(1.2, ty + 0.06, tz + 0.05), M("MagGlass", "#cce4f0", undefined, { transparent: true, opacity: 0.5 })); b.add(cyl(0.008, 0.008, 0.12, 8).rotateZ(Math.PI / 2).translate(1.3, ty + 0.06, tz + 0.05), darkWood);
    // a woven basket of shards on the floor beside the table, and a pith-helmet box
    b.add(cyl(0.26, 0.2, 0.3, 28).translate(-1.6, 0.15, -0.6), M("Basket", "#ffffff", rep(weaveTex("#c99a52"), 2, 1))); }
  const lampG = lamp(root, JV.LAMP.map((v, i) => v + (i === 1 ? 0.14 : 0)) as V3, "#ffb45a", 5, 7, "table");
  // the sign on an easel
  const signMat = unlit(signTex(0), 0.95); let signMesh: THREE.Mesh | null = null; { const [sx, sy, sz] = JV.SIGN; const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.6), signMat); sg.position.set(sx, sy, sz + 0.035); root.add(sg); signMesh = sg;
    b.add(bx(1.18, 0.68, 0.05).translate(sx, sy, sz), darkWood); for (const s of [-0.42, 0.42]) b.add(bx(0.05, sy + 0.3, 0.05).rotateX(s > 0 ? 0 : 0).translate(sx + s, (sy + 0.3) / 2, sz - 0.04), darkWood); b.add(bx(0.05, 1.6, 0.05).rotateX(-0.35).translate(sx, 0.75, sz - 0.3), darkWood); }
  // ======================= RALPH'S SHED =======================
  { const X = 9, Z = -1.6; nc.add(bx(4.2, 2.5, 0.1).translate(X, 1.25, Z - 2.0), weaveM2); nc.add(bx(0.1, 2.5, 4.0).translate(X - 2.1, 1.25, Z), weaveM2); nc.add(bx(0.1, 2.5, 4.0).translate(X + 2.1, 1.25, Z), weaveM2);
    nc.add(bx(1.5, 2.5, 0.1).translate(X - 1.35, 1.25, Z + 2.0), weaveM2); nc.add(bx(1.5, 2.5, 0.1).translate(X + 1.35, 1.25, Z + 2.0), weaveM2); nc.add(bx(1.2, 0.4, 0.1).translate(X, 2.3, Z + 2.0), weaveM2);
    for (const [px, pz] of [[-2.1, -2], [2.1, -2], [-2.1, 2], [2.1, 2], [-0.6, 2], [0.6, 2]]) b.add(bx(0.12, 2.6, 0.12).translate(X + px, 1.3, Z + pz), postM);
    nc.add(quad(V(X - 2.5, 2.5, Z + 2.4), V(X + 2.5, 2.5, Z + 2.4), V(X + 2.5, 3.6, Z), V(X - 2.5, 3.6, Z), 2, 1), thatchM); nc.add(quad(V(X + 2.5, 2.5, Z - 2.4), V(X - 2.5, 2.5, Z - 2.4), V(X - 2.5, 3.6, Z), V(X + 2.5, 3.6, Z), 2, 1), thatchM);
    nc.add(bx(4.2, 0.04, 4.0).translate(X, 0.02, Z), M("ShedFloor", "#7a5a3a")); nc.add(bx(4.4, 0.06, 4.4).translate(X, 2.56, Z), M("ShedCeil", "#8a6a48"));
    b.add(bx(0.06, 0.8, 0.6).translate(X + 2.07, 1.6, Z - 0.4), M("ShedWin", "#f2d8a0", undefined, { emissive: "#6a4a20" }));
    // shelves of labelled crates full of shards along the back + the left wall
    const r = rng(77); for (let k = 0; k < 6; k++) { const cx = X - 1.5 + (k % 3) * 1.0, cy = k < 3 ? 0.3 : 0.95, cz = Z - 1.5; crate(b, root, [cx, cy, cz], 0.6, "PIECES", 0, { seed: 90 + k }); }
    for (let k = 0; k < 3; k++) crate(b, root, [X - 1.6, 0.3, Z - 0.3 + k * 0.7], 0.55, "BONE", Math.PI / 2, { seed: 120 + k });
    b.add(bx(3.4, 0.05, 0.6).translate(X - 0.5, 0.62, Z - 1.5), M("ShedShelf", "#6a4a2e")); void r; }
  const tallyMat = unlit(tallyTex(0), 0.92); { const t = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.94), tallyMat); t.position.set(...JV.TALLY); t.layers.set(NOINK); root.add(t); b.add(bx(1.35, 1.04, 0.04).translate(JV.TALLY[0], JV.TALLY[1], JV.TALLY[2] - 0.03), darkWood); }
  // ======================= THE VILLAGE LANE =======================
  const kampung = (x0: number, zf: number, dir: 1 | -1, w: number, h: number, i: number) => {   // woven walls on a timber frame, hip tile roof, door, shuttered window
    const d = 4.2, cx = x0 + w / 2, zc = zf - dir * d / 2, wm = i % 2 ? weaveM : weaveM2;
    nc.add(bx(w, h, d).translate(cx, h / 2, zc), wm);
    for (const fx of [0, w]) for (const fz of [0, d]) b.add(bx(0.14, h + 0.05, 0.14).translate(x0 + fx, h / 2, zf - dir * fz), postM);
    b.add(bx(w + 0.1, 0.14, 0.14).translate(cx, h, zf), postM);
    const ov = 0.7, e = h, rt = h + 1.9, zz0 = zf + dir * ov, zz1 = zf - dir * (d + ov);
    const A = V(x0 - ov, e, zz0), B2 = V(x0 + w + ov, e, zz0), C2 = V(x0 + w + ov, e, zz1), D = V(x0 - ov, e, zz1), R0 = V(x0 + 0.9, rt, zc), R1 = V(x0 + w - 0.9, rt, zc);
    const rm = i % 2 ? tileM : tileM2;
    if (dir > 0) { b.add(quad(A, B2, R1, R0, 3, 1), rm); b.add(quad(C2, D, R0, R1, 3, 1), rm); b.add(quad(B2, C2, R1, R1, 1, 1), rm); b.add(quad(D, A, R0, R0, 1, 1), rm); }
    else { b.add(quad(B2, A, R0, R1, 3, 1), rm); b.add(quad(D, C2, R1, R0, 3, 1), rm); b.add(quad(C2, B2, R1, R1, 1, 1), rm); b.add(quad(A, D, R0, R0, 1, 1), rm); }
    nc.add(bx(w + 1.2, 0.08, d + 1.2).translate(cx, e - 0.04, zc), M("Soffit", "#6a4a30"));
    const zz = zf + dir * 0.05; b.add(bx(0.95, 1.95, 0.08).translate(cx - w * 0.2, 0.98, zz), M("KDoor" + (i % 3), ["#5a3a24", "#3a5a4a", "#7a4a2a"][i % 3]));
    b.add(bx(0.9, 0.7, 0.06).translate(cx + w * 0.22, 1.5, zz), M("KWin", "#2a2018", undefined, { emissive: "#140e08" }));
    for (const s of [-1, 1]) b.add(bx(0.46, 0.74, 0.05).translate(cx + w * 0.22 + s * 0.69, 1.5, zz + dir * 0.01), M("KShut" + (i % 3), ["#3f6a5a", "#7a5a2a", "#4a6a8a"][i % 3]));
    // a clay pot by the door, a broom, a woven mat on the wall
    b.add(new THREE.SphereGeometry(0.22, 24, 16).scale(1, 0.85, 1).translate(cx - w * 0.2 - 0.85, 0.2, zf + dir * 0.45), M("Pot", "#a8643a"));
  };
  [[13, 5.2, 2.7], [18.6, 5.4, 2.8], [24.6, 5.0, 2.6], [30.2, 5.6, 2.9], [36.4, 5.2, 2.7]].forEach(([x, w, h], i) => kampung(x, -1.2, 1, w, h, i));
  [[14, 5.6, 2.8], [20.4, 5.0, 2.6], [26, 5.4, 2.8], [32, 5.8, 2.9], [38.4, 5.0, 2.7]].forEach(([x, w, h], i) => kampung(x, 8.6, -1, w, h, i + 5));
  // Agus's porch bench (bale) with the papaya plate; the breakfast mat; the bicycle; stones; the elder's bone pile; well; laundry
  { const [px, , pz] = JV.PORCH, bam = M("Bamboo", "#c8a85a"); for (let k = 0; k < 9; k++) b.add(cyl(0.035, 0.035, 1.9, 14).rotateZ(Math.PI / 2).translate(px, 0.45, pz - 0.35 + k * 0.088), bam);
    for (const s of [-0.85, 0.85]) for (const t of [-0.35, 0.35]) b.add(cyl(0.04, 0.04, 0.45, 12).translate(px + s, 0.225, pz + t), bam);
    b.add(cyl(0.2, 0.17, 0.025, 40).translate(JV.PLATE[0], JV.PLATE[1] + 0.012, JV.PLATE[2]), M("Plate", "#e8e2d4")); }
  { const [mx, , mz] = JV.MAT; nc.add(bx(2.0, 0.02, 1.3).translate(mx, 0.01, mz), M("Mat", "#ffffff", rep(weaveTex("#d8b46a"), 3, 2)));
    for (const [dx, dz] of [[-0.6, -0.3], [-0.1, 0.35], [0.5, -0.25], [0.7, 0.3]]) { b.add(cyl(0.08, 0.05, 0.06, 24).translate(mx + dx, 0.05, mz + dz), M("Bowl", "#e8e0cc")); b.add(new THREE.SphereGeometry(0.07, 18, 10, 0, TAU, 0, Math.PI / 2).scale(1, 0.5, 1).translate(mx + dx, 0.07, mz + dz), M("Rice", "#f6f2e6")); }
    for (const [dx, dz] of [[-0.35, 0.05], [0.2, 0.05]]) b.add(new THREE.IcosahedronGeometry(0.16, 1).scale(1.2, 0.45, 1).translate(mx + dx, 0.06, mz + dz), M("Stone", "#7a7268"));
    b.add(cyl(0.11, 0.11, 0.2, 28).translate(JV.TIN[0], 0.1, JV.TIN[2]), M("TinBody", "#c8352e")); const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.12, 28, 1, true), new THREE.MeshLambertMaterial({ map: tinTex() })); tl.position.set(JV.TIN[0], 0.1, JV.TIN[2]); root.add(tl);
    b.add(new THREE.CylinderGeometry(0.4, 0.45, 0.4, 24).translate(mx - 1.6, 0.2, mz - 0.6), M("Hearth", "#6a5a4a")); smoke.push(mist(root, [mx - 1.6, 0.9, mz - 0.6], 0.8, "#d8d0c8", 0.35), mist(root, [mx - 1.55, 1.5, mz - 0.65], 1.1, "#d8d0c8", 0.25)); }
  { const [kx, , kz] = JV.BIKE, iron = M("BikeFrame", "#1f4a3a"), chrome = M("Chrome", "#c8ccd0"), tyre = M("Tyre", "#2a2624");   // leaning on its stand, facing +x
    for (const s of [-0.52, 0.52]) { b.add(new THREE.TorusGeometry(0.33, 0.025, 10, 40).translate(kx + s, 0.36, kz), tyre); b.add(new THREE.TorusGeometry(0.3, 0.008, 6, 40).translate(kx + s, 0.36, kz), chrome);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; b.add(cyl(0.003, 0.003, 0.6, 4).rotateZ(a).translate(kx + s, 0.36, kz), chrome); } b.add(cyl(0.03, 0.03, 0.06, 12).rotateX(Math.PI / 2).translate(kx + s, 0.36, kz), chrome); }
    const tube = (a: V3, c: V3, r = 0.022, m = iron) => { const A = V(...a), C = V(...c), mm = new THREE.Mesh(cyl(r, r, A.distanceTo(C), 12), m); mm.position.copy(A.clone().add(C).multiplyScalar(0.5)); mm.quaternion.setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize()); mm.castShadow = true; root.add(mm); };
    tube([kx - 0.52, 0.36, kz], [kx - 0.05, 0.36, kz]); tube([kx - 0.05, 0.36, kz], [kx - 0.12, 0.82, kz]); tube([kx - 0.12, 0.82, kz], [kx + 0.38, 0.84, kz]); tube([kx + 0.38, 0.84, kz], [kx + 0.52, 0.36, kz]); tube([kx - 0.05, 0.36, kz], [kx + 0.38, 0.84, kz]); tube([kx - 0.52, 0.36, kz], [kx - 0.12, 0.82, kz]);
    tube([kx + 0.42, 0.84, kz], [kx + 0.44, 1.0, kz], 0.016, chrome); tube([kx + 0.44, 1.0, kz - 0.26], [kx + 0.44, 1.0, kz + 0.26], 0.014, chrome); b.add(new THREE.SphereGeometry(0.04, 16, 10).translate(kx + 0.44, 1.03, kz + 0.2), M("Bell", "#f2c94c"));
    b.add(bx(0.22, 0.05, 0.1).translate(kx - 0.14, 0.88, kz), M("Saddle", "#5a2a1a")); b.add(cyl(0.07, 0.07, 0.03, 24).rotateX(Math.PI / 2).translate(kx - 0.05, 0.36, kz + 0.04), chrome); }
  { const [ex, , ez] = JV.PILE, r = rng(5); for (const [x, z] of [[27.8, 2.4], [30.6, 5.2], [33.2, 3.0], [35.6, 5.6], [38.0, 2.6], [29.2, 6.4], [31.4, 1.8]] as number[][]) b.add(new THREE.IcosahedronGeometry(0.28, 1).scale(1.3, 0.45, 1.1).translate(x, 0.1, z), M("Stone", "#7a7268"));
    void ex; void ez; void r;
    nc.add(cyl(0.7, 0.75, 0.7, 32).translate(33, 0.35, 7.6), M("Well", "#9a8e7e")); b.add(cyl(0.6, 0.6, 0.02, 32).translate(33, 0.68, 7.6), M("WellW", "#2a3a44")); for (const s of [-0.7, 0.7]) b.add(bx(0.08, 1.7, 0.08).translate(33 + s, 0.85, 7.6), postM); b.add(bx(1.6, 0.1, 0.1).translate(33, 1.7, 7.6), postM);
    const rope = M("Rope", "#9a7a4a"); b.add(cyl(0.01, 0.01, 2.6, 6).rotateZ(Math.PI / 2).translate(18.2, 1.9, 6.4), rope);
    for (let k = 0; k < 5; k++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.62, 2, 4), lam("jvCl" + k, () => ({ map: clothTex(["#c8352e", "#2f5a9a", "#e8b84a", "#3a7a4a", "#f2ead8"][k], "rgba(255,255,255,0.35)"), side: THREE.DoubleSide })));
      c.position.set(17.2 + k * 0.5, 1.58, 6.4); c.userData.ph = k * 0.9; root.add(c); cloths.push(c); }
    for (let k = 0; k < 4; k++) b.add(bx(1.6, 0.02, 1.0).translate(36 + (k % 2) * 1.8, 0.012, 1.6 + Math.floor(k / 2) * 1.3), M("RiceMat", "#ffffff", rep(ctex("jvDryRice", 256, 256, (g, rr) => { g.fillStyle = "#d8b85a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { g.fillStyle = rr() < 0.5 ? "#e8cc70" : "#b89a48"; g.fillRect(rr() * 256, rr() * 256, 3, 2); } }), 2, 1))); }
  // banana plants and palms round the yard and the lane
  { const bl = new THREE.MeshLambertMaterial({ map: leafTex(), alphaTest: 0.5, side: THREE.DoubleSide }), stem = M("BanStem", "#7a9a44");
    const banana = (x: number, z: number, s: number, seed: number) => { const r = rng(seed); b.add(cyl(0.09 * s, 0.13 * s, 1.6 * s, 14).translate(x, 0.8 * s, z), stem);
      for (let k = 0; k < 7; k++) { const geo = new THREE.PlaneGeometry(0.55 * s, 1.9 * s, 2, 8), P = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < P.count; i++) { const yy = P.getY(i) / (1.9 * s) + 0.5; P.setXYZ(i, P.getX(i) * (1 - 0.2 * Math.abs(P.getX(i)) / s), P.getY(i) + 0.95 * s, -0.75 * s * yy * yy + 0.08 * s * Math.abs(P.getX(i)) / (0.275 * s)); }
        geo.computeVertexNormals(); const L = new THREE.Mesh(geo, bl); L.layers.set(NOINK); const gg = new THREE.Group(); gg.position.set(x, 1.45 * s, z); gg.rotation.y = (k / 7) * TAU + r(); L.rotation.x = -(0.25 + r() * 0.35); gg.add(L); root.add(gg); sway.push(L); } };
    [[-6.5, 2.8, 1.1], [-7.2, -2.2, 1.2], [7.6, 6.4, 1.0], [12.2, 0.9, 1.1], [17.6, -0.4, 0.9], [24.0, 0.2, 1.1], [29.4, 8.0, 1.0], [35.6, -0.2, 1.2], [42, 3, 1.2], [143, 2.6, 1.1], [133, -1.4, 1.2]].forEach(([x, z, s], i) => banana(x, z, s, 300 + i));
    [[-8, 0, 8.2], [-10, -6, 9.4], [6.5, -6.5, 8.8], [-5, 9, 7.6], [11.6, 10.4, 8.4], [16, -8, 9.2], [22, 10.6, 8.0], [28, -7.6, 9.6], [34, 10.8, 8.6], [40, -7, 9], [44, 6, 8.2], [-14, 12, 9.6], [2, -12, 10], [-18, -4, 8.8],
     [128, -6.8, 8.6], [134, -7.2, 9.4], [146, -6.9, 9.0], [152, -7.4, 8.2], [120, 44, 9], [132, 46, 10], [148, 45, 8.6], [160, 47, 9.6], [172, 44, 8.4],
     [48, -4, 9], [52, 5, 8.4], [56, -2, 10], [61, 8, 9.2], [66, 1, 8.6]].forEach(([x, z, h], i) => palms.push(palm(root, [x, i > 13 && i < 18 && z < 0 ? 3.6 : 0, z], h, [((i * 37) % 7 - 3) * 0.25, ((i * 53) % 5 - 2) * 0.25], 40 + i, ["#4f9a3a", "#5aa040", "#468e34"][i % 3])));
    palms.forEach((p) => p.fronds.forEach((f) => f.traverse((o) => { o.layers.set(NOINK); }))); }
  { // the lane goes on east: more kampung roofs among trees, so the far end is never an empty field
    [[44.5, 5.0, 2.7], [50.8, 5.4, 2.8], [57.2, 4.8, 2.6]].forEach(([x, w, h], i) => kampung(x, -1.2, 1, w, h, i + 10));
    [[45.4, 5.6, 2.8], [51.6, 5.2, 2.7], [58, 5.6, 2.9]].forEach(([x, w, h], i) => kampung(x, 8.6, -1, w, h, i + 13));
    hill(root, [120, -2, 10], 60, 16, 70, "#5a9446"); hill(root, [-70, -2, -20], 50, 12, 60, "#5f9a48"); }
  // ======================= THE RIVERBANK =======================
  { const X = 140, sM = M("Strata", "#ffffff", rep(strataTex(), 3, 1));   // the bank face: a displaced plane (gullies, overhangs) z ~ -3.5
    const face = new THREE.PlaneGeometry(26, 3.8, 80, 16), P = face.attributes.position as THREE.BufferAttribute, r = rng(19);
    const nz: number[] = []; for (let i = 0; i < 81; i++) nz.push((r() - 0.5) * 0.25 + Math.sin(i * 0.37) * 0.18 + Math.sin(i * 0.11) * 0.3);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), col = Math.round((x + 13) / 26 * 80); P.setXYZ(i, X + x, y + 1.9, -3.5 + nz[col] * (0.6 + 0.4 * Math.sin(y * 2.3)) + (y > 1.6 ? 0.12 : 0)); }
    face.computeVertexNormals(); b.add(face, sM);
    nc.add(bx(26, 2, 6).translate(X, 3.8 + 1.0 - 0.02, -6.6), M("BankTop", "#5a7a3a")); nc.add(quad(V(X - 13, 3.8, -3.6), V(X + 13, 3.8, -3.6), V(X + 13, 3.8, -10), V(X - 13, 3.8, -10), 1, 1), grassM);
    b.add(quad(V(X - 13, 0, 1.4), V(X + 13, 0, 1.4), V(X + 13, 0, -3.6), V(X - 13, 0, -3.6), 1, 1), M("Ledge", "#ffffff", rep(clayGroundTex("jvLedge", "#9a7450"), 6, 2)));
    nc.add(quad(V(X - 13, 0, 1.4), V(X - 13, -0.8, 2.4), V(X + 13, -0.8, 2.4), V(X + 13, 0, 1.4), 1, 1), M("Slope", "#7a5a3c"));
    waterPlane(root, X - 40, X + 40, 1.6, 44, -0.55);
    for (let k = 0; k < 26; k++) b.add(new THREE.IcosahedronGeometry(0.12 + r() * 0.28, 2).scale(1.2, 0.5 + r() * 0.25, 1).translate(X - 12 + r() * 24, -0.1 + r() * 0.1, 1.0 + r() * 1.5), M("RiverStone" + (k % 3), ["#7a7268", "#6a645c", "#8a8274"][k % 3]));
    for (let k = 0; k < 40; k++) b.add(new THREE.IcosahedronGeometry(0.03 + r() * 0.06, 2).scale(1.2, 0.55, 1).translate(X - 4 + r() * 8, 0.03, -3.3 + r() * 4), M("Pebble" + (k % 2), k % 2 ? "#8a7a64" : "#b8a080"));
    // a hoe leaning on the bank, a basket on the ledge, bamboo clumps on the far bank
    b.add(cyl(0.02, 0.02, 1.3, 10).rotateZ(-0.35).translate(X + 2.4, 0.6, -3.1), darkWood); b.add(bx(0.22, 0.03, 0.18).translate(X + 2.62, 0.08, -3.05), M("HoeBlade", "#5a5e66"));
    b.add(cyl(0.24, 0.19, 0.28, 28).translate(X - 0.9, 0.14, -2.0), M("Basket", "#ffffff", rep(weaveTex("#c99a52"), 2, 1)));
    const bam = M("BamStalk", "#9ab84a"); for (let c = 0; c < 6; c++) { const cx = X - 18 + c * 7, cz = 44 + (c % 2) * 2; for (let k = 0; k < 9; k++) b.add(cyl(0.06, 0.07, 7 + r() * 3, 10).rotateZ((r() - 0.5) * 0.3).translate(cx + (r() - 0.5) * 1.2, 3.5, cz + (r() - 0.5) * 1.2), bam); }
    for (let k = 0; k < 8; k++) smoke.push(mist(root, [X - 14 + k * 4, 0.1, 6 + (k % 3) * 5], 7, "#f2e4dc", 0.32)); }

  // ======================= STORY OBJECTS =======================
  const fossilM = new THREE.MeshLambertMaterial({ map: fossilTex(false), side: THREE.DoubleSide }), gluedM = new THREE.MeshLambertMaterial({ map: fossilTex(true), side: THREE.DoubleSide });
  const innerM = M("BoneIn", "#8a6a44", undefined, { side: THREE.BackSide });
  /** the whole skull: 12 patches (shared with the flying pieces) */
  const skull = new THREE.Group(); root.add(skull);
  const pieceGeo = PIECES.map((q) => patch(SKR, q.p0, q.pl, q.t0, q.tl));
  pieceGeo.forEach((g) => { const m = new THREE.Mesh(g, fossilM); m.castShadow = true; skull.add(m); const m2 = new THREE.Mesh(g, innerM); skull.add(m2); });
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(SKR * 0.55, 20, 10, 0, TAU, Math.PI * 0.5, Math.PI * 0.4).scale(1.1, 0.7, 1.0).translate(0, -SKR * 0.62, SKR * 0.62), fossilM); skull.add(jaw);
  // the flying pieces: each patch recentred on its own centroid so it can tumble
  const pieces: { m: THREE.Mesh; c: THREE.Vector3; seed: number }[] = pieceGeo.map((g, i) => { const gg = g.clone(); gg.computeBoundingBox(); const c = new THREE.Vector3(); gg.boundingBox!.getCenter(c); gg.translate(-c.x, -c.y, -c.z);
    const m = new THREE.Mesh(gg, fossilM); m.castShadow = true; m.visible = false; root.add(m); return { m, c, seed: i * 1.7 + 0.3 }; });
  // the glued skull (cracks + amber sap drips)
  const glued = new THREE.Group(); glued.visible = false; root.add(glued);
  pieceGeo.forEach((g) => { const m = new THREE.Mesh(g, gluedM); m.castShadow = true; glued.add(m); }); glued.add(new THREE.Mesh(jaw.geometry, gluedM));
  { const sap = M("Sap", "#e0962a", undefined, { emissive: "#3a1a00" }); const r = rng(8); for (let k = 0; k < 14; k++) { const a = (Math.floor(r() * 4) * TAU) / 4 + 0.4 + (r() - 0.5) * 0.08, t = 0.3 + r() * 1.6;
      const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.02 + r() * 0.03, 4, 10), sap); d.position.set(-Math.cos(a) * Math.sin(t) * SKR * 1.02, Math.cos(t) * SKR * 0.86 - 0.01, Math.sin(a) * Math.sin(t) * SKR * 1.26); glued.add(d); } }
  // two loose shards for the lamp test
  const shA = new THREE.Mesh(pieces[1].m.geometry, fossilM), shB = new THREE.Mesh(pieces[4].m.geometry, fossilM); shA.visible = shB.visible = false; root.add(shA, shB);
  // coins: per-slot coins in front of the tray, the 12-coin column (hook), the pour stream
  const coinM = M("Coin", "#c8a446", undefined, { emissive: "#2a1a00" }), coinG = cyl(0.026, 0.026, 0.006, 28);
  const slotCoins: THREE.Mesh[] = []; for (let k = 0; k < 72; k++) { const m = new THREE.Mesh(coinG, coinM); m.position.set(slotAt(k % 12)[0], JV.TRAY[1] - 0.012 + Math.floor(k / 12) * 0.0065, JV.TRAY[2] + 0.21); m.visible = false; m.castShadow = true; root.add(m); slotCoins.push(m); }
  const column = new THREE.Group(); root.add(column); for (let k = 0; k < 12; k++) { const m = new THREE.Mesh(coinG, coinM); m.position.set((k % 2) * 0.003, 0.003 + k * 0.0066, 0); m.castShadow = true; column.add(m); }
  const pour: THREE.Mesh[] = []; for (let k = 0; k < 36; k++) { const m = new THREE.Mesh(coinG, coinM); m.visible = false; root.add(m); pour.push(m); }
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16).scale(1, 1.25, 0.9), M("Bag", "#ffffff", bagTex())); bag.visible = false; root.add(bag);
  // the payoff heap: 700 shards over the table + 4 heaps; the puzzle box lid leaning on the lamp
  const shardG = patch(0.05, 0, 1.1, 0.4, 0.9, 1, 0.9, 1.1); const heap = new THREE.InstancedMesh(shardG, fossilM, 700); heap.castShadow = true; heap.visible = false; root.add(heap);
  { const r = rng(123), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), mtx = new THREE.Matrix4(); for (let k = 0; k < 700; k++) { const pile = k < 300 ? -1 : Math.floor((k - 300) / 100); let x: number, z: number, y: number;
      if (pile < 0) { x = -1.25 + r() * 2.5; z = -0.42 + r() * 0.84; y = 0.81; } else { const c = [[-0.8, -0.1], [-0.15, 0.15], [0.5, -0.12], [0.95, 0.22]][pile], rr = Math.sqrt(r()) * 0.22, a = r() * TAU; x = c[0] + Math.cos(a) * rr; z = c[1] + Math.sin(a) * rr * 0.8; y = 0.81 + (0.22 - rr) * 0.45; }
      e.set(r() * TAU, r() * TAU, r() * TAU); q.setFromEuler(e); const sc = 0.55 + r() * 0.9; s.set(sc, sc, sc); mtx.compose(V(x, y, z), q, s); heap.setMatrixAt(k, mtx); } heap.instanceMatrix.needsUpdate = true; }
  const lid = new THREE.Group(); lid.visible = false; root.add(lid); { const l = new THREE.Mesh(bx(0.5, 0.34, 0.03), M("LidSide", "#b04436")); lid.add(l); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.32), M("LidFace", "#ffffff", lidTex())); f.position.z = 0.016; lid.add(f); lid.position.set(0.75, 0.97, -0.28); lid.rotation.set(-0.35, -0.25, 0); }
  // crates in the shed get shard heaps on top; the queue's baskets are 2D props
  { const sh = new THREE.InstancedMesh(shardG, fossilM, 160), r = rng(9), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); for (let k = 0; k < 160; k++) { const c = k % 6, cx = 9 - 1.5 + (c % 3) * 1.0, cy = c < 3 ? 0.62 : 1.27, cz = -1.6 - 1.5;
      e.set(r() * TAU, r() * TAU, r() * TAU); q.setFromEuler(e); mtx.compose(V(cx + (r() - 0.5) * 0.45, cy + r() * 0.08, cz + (r() - 0.5) * 0.45), q, V(1, 1, 1)); sh.setMatrixAt(k, mtx); } root.add(sh); }
  // a woven basket you can carry (hand-held positions come from the shot code: c.bkX/bkY/bkZ, c.bkTilt)
  const basketO = new THREE.Group(); basketO.visible = false; root.add(basketO);
  { const bm = M("BasketC", "#ffffff", rep(weaveTex("#c99a52"), 2, 1)); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.24, 32, 1, true), bm); body.material = bm; (body.material as THREE.Material).side = THREE.DoubleSide; basketO.add(body);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.18, 32).rotateX(-Math.PI / 2).translate(0, -0.12, 0), M("BasketB", "#8a6430")); basketO.add(bottom);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 8, 40).rotateX(Math.PI / 2).translate(0, 0.12, 0), M("BasketRim", "#7a5426")); basketO.add(rim);
    basketO.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); }
  { const pl = new THREE.InstancedMesh(shardG, fossilM, 60), r = rng(15), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); for (let k = 0; k < 60; k++) { const rr = Math.sqrt(r()) * 0.4, a = r() * TAU;
      e.set(r() * TAU, r() * TAU, r() * TAU); q.setFromEuler(e); mtx.compose(V(JV.PILE[0] + Math.cos(a) * rr, 0.04 + (0.4 - rr) * 0.3, JV.PILE[2] + Math.sin(a) * rr), q, V(1.3, 1.3, 1.3)); pl.setMatrixAt(k, mtx); } pl.castShadow = true; root.add(pl);
    const stoneM = M("Stone", "#7a7268"); for (const [x, z] of [[13.9, 3.6], [15.4, 5.6], [17.0, 2.9], [18.7, 5.0], [20.3, 3.6], [21.9, 5.7]] as number[][]) { const st = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1).scale(1.3, 0.42, 1.1), stoneM); st.position.set(x, 0.09, z); st.castShadow = true; root.add(st); } }
  // the papaya: whole (an orange-yellow ellipsoid) or 12 slices fanned round the plate (c.papCut)
  // 2026-11-20 v2: readable from above - 12 ring-sector slices (flesh-orange faces, yellow-green skin rim, black seeds on the
  // inner edge) that sit flat round the plate centre like a cut fruit and fan apart as c.papCut grows
  const papM = M("PapSkin", "#d8b23a"), fleshM = M("PapFlesh", "#f27a2e"), seedM = M("PapSeed", "#1e1a18");
  const papWhole = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 20).scale(1, 0.8, 1.7), papM); papWhole.rotation.y = 0.3; papWhole.castShadow = true; root.add(papWhole);
  const R0 = 0.15, R1 = 0.06, HA = TAU / 24 - 0.025;
  const sliceG = new THREE.CylinderGeometry(R0, R0, 0.022, 10, 1, false, Math.PI / 2 - HA, 2 * HA).translate(0, 0.011, 0);   // a pie wedge with real caps (the extruded ring rendered pale)
  const slices: THREE.Group[] = []; for (let k = 0; k < 12; k++) { const g = new THREE.Group(); const w = new THREE.Mesh(sliceG, fleshM); w.castShadow = true; g.add(w); const rim = new THREE.Mesh(new THREE.TorusGeometry(R0, 0.012, 6, 10, 2 * HA).rotateX(-Math.PI / 2).rotateY(-HA).translate(0, 0.012, 0), papM); g.add(rim);
    for (const t of [-0.5, 0.5]) { const sd = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), seedM); sd.position.set(R1 + 0.012, 0.024, t * 0.03); g.add(sd); }
    g.visible = false; root.add(g); slices.push(g); }
  // ======================= ambient lights =======================
  for (const [x, y, z, i, d, col] of [[9, 2.2, -1.4, 0.9, 6, "#ffd8a0"], [0, 2.6, -2.4, 0.6, 8, "#ffe0b0"]] as [number, number, number, number, number, string][]) { const pl = new THREE.PointLight(col, i, d, 2); pl.position.set(x, y, z); root.add(pl); }
  glow(root, [JV.TALLY[0] + 1.9, 1.6, JV.TALLY[2] + 1.2], "#ffd8a0", 1.3, 0.9);   // a warm lamp inside the shed (it measured 24% near-black)
  b.build(root); bc.build(root);
  { const ncG = new THREE.Group(); root.add(ncG); nc.build(ncG, false); ncG.traverse((o) => { o.userData.noCast = true; }); }

  const marks: Record<string, V3> = { ralph: JV.RALPH, front: JV.FRONT, bank: JV.BANK, porch: JV.PORCH };
  const cams: SetDef["cams"] = {
    table: { pos: [0.4, 1.45, 2.6], look: [0.1, 1.0, -0.3], fov: 52 },
    yard: { pos: [4.5, 2.2, 7.5], look: [0.5, 1.2, 0], fov: 56 },
    shed: { pos: [9.2, 1.5, 1.6], look: [9, 1.4, -3.2], fov: 56 },
    lane: { pos: [22, 1.8, 6.0], look: [30, 1.2, 3.0], fov: 56 },
    porch: { pos: [21.2, 1.2, 2.4], look: [20.5, 0.8, 0.3], fov: 50 },
    bank: { pos: [140.6, 1.4, 0.6], look: [140.2, 1.0, -3.2], fov: 56 },
  };
  let lastSign = -1, lastTally = -1;
  const slotPos = (k: number) => slotAt(k);
  return {
    name: "javaset", root, marks, cams, title: [skull, heap],
    pose: (t, c) => {
      // skull + its 12 pieces flying into the tray slots (c.shatter), or scattered on the table (c.scatter: payoff layout off)
      const sk = V(c.skX ?? 0, c.skY ?? 0.92, c.skZ ?? 0.1), u = cl(c.shatter ?? 0);
      skull.position.copy(sk); skull.rotation.set(c.skRX ?? 0, c.skRY ?? 0, c.skRZ ?? 0); skull.visible = (c.skVis ?? 0) > 0.5 && u <= 0;
      pieces.forEach((p, i) => { p.m.visible = (c.skVis ?? 0) > 0.5 && u > 0; if (!p.m.visible) return;
        const from = p.c.clone().applyEuler(skull.rotation).add(sk), to = V(...slotPos(i)), k = sm(cl(u * 1.25 - (i % 6) * 0.04));
        const pos = from.clone().lerp(to, k); pos.y += Math.sin(Math.PI * k) * (0.18 + (i % 4) * 0.05);
        p.m.position.copy(pos); p.m.rotation.set(k * (2 + p.seed) * (1 - k * 0.2), k * 3 * (i % 2 ? 1 : -1), k * (1 + p.seed * 0.3)); if (k >= 1) p.m.rotation.set(-1.3, i * 0.7, 0); });
      // the tray mechanism: c.trayWhole 0..1 = a whole skull resting in slot 1 (insert); c.coins 0..12 coins popped in front of the slots
      const nCoin = c.coins ?? 0, nSt = c.coinStack ?? 1; slotCoins.forEach((m, k) => { const slot = k % 12, lay = Math.floor(k / 12), a = lay === 0 ? cl(nCoin - slot) : cl(nSt - lay - slot / 12); m.visible = a > 0.01; m.position.y = JV.TRAY[1] - 0.012 + lay * 0.0065 + 0.04 * Math.sin(Math.PI * cl(a)); m.scale.setScalar(0.6 + 0.4 * a); });
      // the 12-coin column (hook): slides along x at the table front
      column.visible = (c.colVis ?? 0) > 0.5; column.position.set(c.colX ?? 0.4, 0.8, c.colZ ?? 0.32);
      // two shards for the lamp test: positions from the hands (shAx..), c.shFit 0..1 slides them together
      const sv = (c.shVis ?? 0) > 0.5; shA.visible = shB.visible = sv; if (sv) { const fit = sm(c.shFit ?? 0), A = V(c.shAx ?? 0, c.shAy ?? 1.4, c.shAz ?? 0), B = V(c.shBx ?? 0.2, c.shBy ?? 1.4, c.shBz ?? 0);
        const mid = A.clone().lerp(B, 0.5); shA.position.copy(A.clone().lerp(mid.clone().add(V(-0.03, 0, 0)), fit)); shB.position.copy(B.clone().lerp(mid.clone().add(V(0.03, 0, 0)), fit)); shA.rotation.set(0.4, 0.6 + t * 0.2 * (1 - fit), 0.2); shB.rotation.set(0.4, 0.6 + Math.PI * 0.25 * (1 - fit), 0.2 + fit * 0.1); }
      // coin bag + pour: the bag at c.bag*, coins fall in an arc into the hands at c.hand*
      const pu = c.pour ?? 0; bag.visible = (c.bagVis ?? 0) > 0.5; bag.position.set(c.bagX ?? 0, c.bagY ?? 1.2, c.bagZ ?? 0); bag.rotation.z = -2.2 * sm(cl(pu * 3));
      pour.forEach((m, k) => { const ph = pu * 1.6 - k / 36; m.visible = bag.visible && ph > 0 && ph < 1; if (!m.visible) return; const A = V(bag.position.x + 0.08, bag.position.y - 0.05, bag.position.z), Bh = V(c.handX ?? 0, c.handY ?? 1.0, c.handZ ?? 0);
        const p = A.clone().lerp(Bh, ph); p.y += 0.12 * Math.sin(Math.PI * ph) - 0.05 * ph; p.x += 0.02 * Math.sin(k * 3.1); m.position.copy(p); m.rotation.set(k + t * 9, k * 0.7, 0); });
      // the payoff heap + the lid; the glued skull
      const pay = (c.payoff ?? 0) > 0.5, hn = c.heapN ?? 700; heap.visible = pay || hn < 700; heap.count = Math.round(cl(hn, 0, 700)); lid.visible = pay;
      basketO.visible = (c.bkVis ?? 0) > 0.5; basketO.position.set(c.bkX ?? 0, c.bkY ?? 0.5, c.bkZ ?? 0); basketO.rotation.set(0, c.bkRY ?? 0, c.bkTilt ?? 0);
      glued.visible = (c.gVis ?? 0) > 0.5; glued.position.set(c.gX ?? 0, c.gY ?? 0.92, c.gZ ?? 0.1); glued.rotation.set(c.gRX ?? 0, c.gRY ?? 0, 0);
      // the papaya: whole <-> 12 fanned slices
      const pc = sm(c.papCut ?? 0), wk = cl(1 - pc / 0.22); papWhole.visible = wk > 0.01; papWhole.scale.setScalar(Math.max(0.01, wk)); papWhole.position.set(JV.PLATE[0], JV.PLATE[1] + 0.09 * wk, JV.PLATE[2]);
      slices.forEach((g, k) => { g.visible = pc > 0.01; g.scale.setScalar(Math.max(0.01, cl(pc / 0.22))); const a = (k / 12) * TAU, r = 0.055 * pc; g.position.set(JV.PLATE[0] + Math.cos(a) * r, JV.PLATE[1] + 0.026, JV.PLATE[2] - Math.sin(a) * r); g.rotation.set(0, a + 0.25 * pc * Math.sin(k * 1.7), 0); });
      // the sign repaint + the tally
      { const k = Math.round(cl(c.repaint ?? 0) * 24); if (k !== lastSign) { const tx = signTex(k / 24); signMat.map = tx; signMat.needsUpdate = true; const mm = signMesh?.material as THREE.MeshStandardMaterial | undefined; if (mm && mm !== (signMat as unknown)) { mm.map = tx; mm.needsUpdate = true; } lastSign = k; } }   // realify swaps the sign's material: update the live one
      { const n = Math.round(c.tally ?? 2964); if (n !== lastTally) { tallyMat.map = tallyTex(n); tallyMat.needsUpdate = true; lastTally = n; } }
      flicker(lampG, t);
      palms.forEach((p) => swayPalm(p, t, 0.7)); sway.forEach((m, i) => { m.rotation.z = 0.06 * Math.sin(t * 1.2 + i * 1.3); });
      cloths.forEach((m) => { const P = m.geometry.attributes.position as THREE.BufferAttribute, ph = m.userData.ph as number; for (let i = 0; i < P.count; i++) { const y = P.getY(i); P.setZ(i, (0.31 - y) * 0.12 * Math.sin(t * 4.4 + ph + y * 3)); } P.needsUpdate = true; });
      smoke.forEach((s, i) => { s.position.y += 0; (s.material as THREE.SpriteMaterial).opacity = 0.22 + 0.1 * Math.sin(t * 0.7 + i); s.position.x += 0.0008 * Math.sin(t * 0.3 + i); });
    },
  };
};
