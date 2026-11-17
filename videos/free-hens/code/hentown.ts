// "They Gave Away Free Hens and the Garbage Vanished" (2026-11-17): ONE connected village set. Local metres, y up.
//  STREET along x: asphalt y 0 (z -3..3), north sidewalk y 0.12 (z -5..-3), south sidewalk y 0.12 (z 3..5.5).
//  NORTH SIDE: cream stone cottages with green shutters, fronts at z -8 facing +z, little front gardens z -8..-5 behind a
//    low stone wall (z -5) with a green gate per house. Luc's cottage x -4..4. Between it and the next cottage west
//    (x -18..-12) lies LUC'S SIDE GARDEN x -12..-4, z -5..-16: lawn, a red coop with a padlocked door and a nesting box
//    (x -9.6, z -13.6), a wire run, the family's green bin by the side gate (x -5.6, z -5.8), an upturned crate with the
//    kitchen scale (x -7.4, z -9.6), a laundry line, a vegetable patch, the cottage's garden door in its west wall (x -4).
//  SOUTH SIDE: the café (x -10..-2, front z 9, terrace z 5.5..9 with round tables, striped awning, chalk A-board) and the
//    TOWN HALL (x 6..20, front z 10 facing -z, 5 steps from z 7.4, clock, flag).
//  Bruno's green side-loader drives along x (nose +x), the lift arm and the side readout on its north (-z) side.
// Controls (pose c.*):
//  truckX, truckZ (truck centre), truckYaw, truckBob 0..1, lift 0..1 (arm raises its bin), tip 0..1 (bin upside down over the
//  hopper), dump 0..1 (the bin's load falls in: bags then the bright food third), load 0..1 (hopper fill), heap 0..1
//  (bags heaped above the rim), tons (readout, e.g. 2.40), pay (euros on the meter), coins 0..1 (coins clatter out),
//  lidT 0..1 (lift bin lid flaps), b{i}x/y/z/r/l/v (street bin i offsets, roll, lid, visible 0/1; 0..6 = street bins,
//  7 = Luc's garden bin), spring 0..1 (blossoms pop on the plane trees), petals 0..1, clockH (town-hall clock hours),
//  aboard 0..1 (chalk A-board turned to the street), chalk 0..1 (MAYOR CLUCK written), coopDoor 0..1, lock 0..1 (padlock
//  open), grams (kitchen scale), bowl 0..1 (scraps in the bowl), runScraps 0..1 (scraps tipped in the run), eggT 0..1
//  (egg rolls out of the nesting box), toy 0/1 (toy truck on the ground), toyX, panHung 0/1, bucket 0/1 (scrap bucket on
//  the step), crates 0..1 (stacked hen crates on Odile's cart at cartX/cartZ), cart 0/1, queue 0/1.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, quad } from "../build";
import { ctex, rng, rep, planksHD, stoneHD, facadeHD, roofHD, grassHD, beamHD } from "../paint";
import { NOINK } from "../ink";
import { swayMaterial } from "../sway";
import { barkTex, leafyTree, leafCardMat } from "./brickyard";
import { sedan } from "./sedan";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const M = (key: string, color: string, map?: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) => lam("ht" + key, () => ({ color, ...(map ? { map } : {}), ...extra }));
const unlit = (map: THREE.Texture, k = 1) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k), toneMapped: true });
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
export const HT = {
  SW: 0.12,                                  // sidewalk height
  BINS: [-22, -15, -8.8, 0.9, 7.6, 14.6, 21.6] as number[], BINZ: -3.55,
  LUCBIN: [-5.15, 0.12, -9.9] as V3, NESTGROUND: [-8.25, 0.12, -11.75] as V3, PILE: [-7.2, 0.12, -10.6] as V3, COOP: [-9.6, 0.12, -13.6] as V3, SCALE: [-7.4, 0.12, -9.6] as V3, GARDEN_DOOR: [-4.0, 0.12, -11.0] as V3,
  NEST: [-8.55, 0.12, -13.6] as V3, CAFE_BOARD: [-5.55, 0.12, 5.75] as V3, HALL_STEP: [13, 0.12, 7.4] as V3,
};

// ---------------- textures ----------------
const asphalt = () => ctex("htAsph", 1024, 1024, (g, r) => { g.fillStyle = "#7c7872"; g.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 16000; i++) { const v = 90 + r() * 60; g.fillStyle = `rgba(${v + 4},${v},${v - 4},${0.25 + r() * 0.3})`; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 3, 2 + r() * 3); }
  for (let i = 0; i < 18; i++) { g.strokeStyle = "rgba(40,40,44,0.35)"; g.lineWidth = 2 + r() * 3; g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); } });
const pave = () => ctex("htPave", 512, 512, (g, r) => { g.fillStyle = "#c9c0b0"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) { const v = (r() - 0.5) * 18; g.fillStyle = `rgb(${200 + v},${192 + v},${176 + v})`; g.fillRect(x + 2, y + 2, 60, 60); }
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(90,80,70,${r() * 0.12})`; g.fillRect(r() * 512, r() * 512, 2, 2); } });
const stripeTex = () => ctex("htAwning", 512, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4efe6" : "#c8352e"; g.fillRect(i * 64, 0, 64, 256); } g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(0, 200, 512, 56); });
const shingle = () => roofHD("#b8643a");
const readoutTex = (tons: number, pay: number) => ctex(`htRead_${tons.toFixed(2)}_${Math.round(pay)}`, 512, 256, (g) => {
  g.fillStyle = "#1e2a22"; g.fillRect(0, 0, 512, 256); g.strokeStyle = "#f2efe6"; g.lineWidth = 8; g.strokeRect(6, 6, 500, 244);
  g.fillStyle = "#7af07a"; g.font = "900 104px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(`${tons.toFixed(2)} T`, 256, 92);
  g.fillStyle = "#f4c430"; g.font = "900 40px Arial Black, Arial"; g.fillText("TOWN PAYS", 170, 196); g.fillStyle = "#ffffff"; g.font = "900 48px Arial Black, Arial"; g.fillText(`€${Math.round(pay).toLocaleString("en-US")}`, 390, 198);
});
const scaleTex = (grams: number) => ctex(`htScale_${Math.round(grams)}`, 256, 128, (g) => {
  g.fillStyle = "#cfe8d8"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#1a2a22"; g.font = "900 78px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(`${Math.round(grams)} g`, 128, 68);
});
const chalkTex = () => ctex("htChalk2", 512, 640, (g, r) => {
  g.fillStyle = "#2a2f2c"; g.fillRect(0, 0, 512, 640); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * 512, r() * 640, 30, 2); }
  g.strokeStyle = "#a8743e"; g.lineWidth = 26; g.strokeRect(13, 13, 486, 614);
  g.fillStyle = "#f8f4ea"; g.font = "900 96px 'Comic Sans MS', 'Chalkboard', cursive"; g.textAlign = "center"; g.fillText("MAYOR", 256, 150); g.fillText("CLUCK", 256, 260);
  // a chicken doodle
  g.strokeStyle = "#f8f4ea"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.ellipse(250, 450, 95, 70, 0, 0, TAU); g.stroke(); g.beginPath(); g.arc(340, 372, 34, 0, TAU); g.stroke();
  g.fillStyle = "#e85a4a"; for (const [x, y] of [[326, 330], [344, 324], [362, 332]]) { g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); }
  g.fillStyle = "#f4c430"; g.beginPath(); g.moveTo(372, 370); g.lineTo(410, 382); g.lineTo(372, 392); g.fill();
  g.beginPath(); g.moveTo(230, 520); g.lineTo(222, 590); g.moveTo(272, 520); g.lineTo(280, 590); g.stroke();
  g.fillStyle = "#f8f4ea"; g.beginPath(); g.arc(348, 368, 6, 0, TAU); g.fill();
});
const menuTex = () => ctex("htMenu", 512, 640, (g) => { g.fillStyle = "#2a2f2c"; g.fillRect(0, 0, 512, 640); g.strokeStyle = "#a8743e"; g.lineWidth = 26; g.strokeRect(13, 13, 486, 614);
  g.fillStyle = "#f8f4ea"; g.font = "900 70px 'Comic Sans MS', cursive"; g.textAlign = "center"; g.fillText("CAFÉ", 256, 130); g.font = "700 44px 'Comic Sans MS', cursive"; ["croissant", "omelette", "café crème"].forEach((t, i) => g.fillText(t, 256, 250 + i * 90)); });
const clockTex = () => ctex("htClock", 256, 256, (g) => { g.fillStyle = "#f6f1e2"; g.beginPath(); g.arc(128, 128, 120, 0, TAU); g.fill(); g.strokeStyle = "#2a2028"; g.lineWidth = 10; g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.lineWidth = i % 3 ? 5 : 10; g.beginPath(); g.moveTo(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); g.lineTo(128 + Math.sin(a) * 110, 128 - Math.cos(a) * 110); g.stroke(); } });
const hallSign = () => ctex("htHallSign", 1024, 160, (g) => { g.fillStyle = "#e9dfc8"; g.fillRect(0, 0, 1024, 160); g.fillStyle = "#3a2e26"; g.font = "900 104px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("TOWN HALL", 512, 84); });
const cafeSign = () => ctex("htCafeSign", 1024, 160, (g) => { g.fillStyle = "#2e5a3e"; g.fillRect(0, 0, 1024, 160); g.fillStyle = "#f4e6b8"; g.font = "900 100px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CAFÉ DU COIN", 512, 84); });
const wireTex = () => ctex("htWire", 256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.strokeStyle = "rgba(200,206,214,0.95)"; g.lineWidth = 3; for (let i = -256; i < 512; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke(); } });
const coopWood = () => ctex("htCoop", 512, 512, (g, r) => { g.fillStyle = "#b8342a"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) { g.fillStyle = "rgba(60,10,8,0.5)"; g.fillRect(0, y + 60, 512, 4); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,200,180,${r() * 0.08})`; g.fillRect(r() * 512, y + r() * 60, 40 + r() * 80, 2); } } });

// ---------------- builders ----------------
/** a green wheelie bin (local: wheels at -z back, lid hinge at the back), opening up; returns the group with userData.lid */
const wheelie = (parent: THREE.Object3D, col = "#3f7a4a") => {
  const g = new THREE.Group(); parent.add(g); const body = M("Bin" + col, col), dark = M("BinD" + col, new THREE.Color(col).multiplyScalar(0.7).getStyle()), tyre = M("BinTyre", "#26242a");
  const geo = new THREE.BoxGeometry(0.58, 1.0, 0.72, 1, 1, 1); { const P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i), k = 0.88 + 0.12 * (y + 0.5); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } geo.computeVertexNormals(); }
  const me = new THREE.Mesh(geo.translate(0, 0.56, 0), body); me.castShadow = true; me.receiveShadow = true; g.add(me);
  const rim = new THREE.Mesh(bx(0.62, 0.05, 0.76).translate(0, 1.06, 0), dark); g.add(rim);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8).rotateZ(Math.PI / 2).translate(0, 1.04, -0.42), dark); g.add(handle);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14).rotateZ(Math.PI / 2).translate(s * 0.27, 0.1, -0.3), tyre); w.castShadow = true; g.add(w); }
  const lid = new THREE.Group(); lid.position.set(0, 1.08, -0.38); g.add(lid);
  const lm = new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.06, 0.8, 2, 0.025).translate(0, 0.02, 0.4), body); lm.castShadow = true; lid.add(lm);
  g.userData.lid = lid; return g;
};
/** a plump black / green garbage bag */
const bagGeo = (r: () => number, s: number) => { const g = new THREE.IcosahedronGeometry(0.26 * s, 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = 1 + 0.12 * Math.sin(x * 23 + r()) * Math.cos(z * 19); P.setXYZ(i, x * k * 1.15, y * k * 0.85, z * k); } g.computeVertexNormals(); return g; };

export const hentown = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), bc = new Batch();   // bc: vertex-coloured geometry (tree crowns) kept apart
  const SW = HT.SW;
  // ===================== GROUND =====================
  { const as = M("Asphalt", "#ffffff", rep(asphalt(), 12, 2)); b.add(quad(V(-60, 0, 3), V(60, 0, 3), V(60, 0, -3), V(-60, 0, -3), 1, 1), as);
    const pv = M("Pave", "#ffffff", rep(pave(), 60, 1)), pv2 = M("Pave2", "#ffffff", rep(pave(), 60, 1.25));
    b.add(bx(120, SW, 2).translate(0, SW / 2, -4), pv); b.add(bx(120, SW, 2.5).translate(0, SW / 2, 4.25), pv2);
    const kerb = M("Kerb", "#d8d2c4"); b.add(bx(120, SW + 0.02, 0.16).translate(0, (SW + 0.02) / 2, -3.04), kerb); b.add(bx(120, SW + 0.02, 0.16).translate(0, (SW + 0.02) / 2, 3.04), kerb);
    // lane markings (dashed centre line)
    const paint = M("Paint", "#f2efe6", undefined, { emissive: "#2a2a2a" }); for (let x = -58; x < 60; x += 4) b.add(bx(2, 0.005, 0.12).translate(x, 0.004, 0), paint);
    // front gardens + Luc's garden (lawn)
    const lawn = M("Lawn", "#8a9276", rep(grassHD(), 30, 4)); b.add(bx(120, 0.1, 11).translate(0, 0.07, -10.5), lawn);
    const pv3 = M("Pave3", "#ffffff", rep(pave(), 60, 2.5)); b.add(bx(120, SW, 5).translate(0, SW / 2, 7.9), pv3);
    const far = M("Far", "#9ab87a"); b.add(quad(V(-120, 0, -60), V(120, 0, -60), V(120, 0, 60), V(-120, 0, 60), 1, 1).translate(0, -0.02, 0), far);
  }
  // ===================== NORTH COTTAGES =====================
  const cream = ["#efe3c8", "#f2dcc0", "#e6dcc8", "#f0e6cc", "#e8d4b8", "#f2e8d2"], shut = ["#3f7a5a", "#4a6aa0", "#3f7a5a", "#7a4a6a", "#3f7a5a", "#5a8aa0"];
  const roofM = M("Roof", "#ffffff", shingle()), stoneSide = M("Side", "#e2d6bc", rep(stoneHD("htStone", ["#e6dac2", "#ddd0b6", "#eadfc8", "#d6c8ac"], "#b8aa90"), 2, 2));
  const wallM = M("LowWall", "#ffffff", rep(stoneHD("htLow", ["#d6c8ac", "#cdbfa2", "#ddd0b6", "#c6b796"], "#a89a80"), 8, 1));
  const gateM = M("Gate", "#3f7a5a"), postM = M("Post", "#c6b796");
  const cottage = (x0: number, x1: number, zf: number, depth: number, h: number, i: number) => {
    const w = x1 - x0, cx = (x0 + x1) / 2, fac = M("Fac" + i, "#ffffff", facadeHD("htFac" + i, w, h, { wall: cream[i % 6], shutter: shut[i % 6], door: true }));
    b.add(quad(V(x0, 0, zf), V(x1, 0, zf), V(x1, h, zf), V(x0, h, zf), 1, 1), fac);
    b.add(bx(w, h, depth).translate(cx, h / 2, zf - depth / 2 - 0.01), stoneSide);
    // gable roof running along x (ridge parallel to the street)
    const rh = 2.2, ov = 0.35, z0 = zf + ov, z1 = zf - depth - ov, zm = (z0 + z1) / 2;
    b.add(quad(V(x0 - ov, h, z0), V(x1 + ov, h, z0), V(x1 + ov, h + rh, zm), V(x0 - ov, h + rh, zm), 3, 1), roofM);
    b.add(quad(V(x1 + ov, h, z1), V(x0 - ov, h, z1), V(x0 - ov, h + rh, zm), V(x1 + ov, h + rh, zm), 3, 1), roofM);
    for (const xs of [x0, x1]) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([xs, h, zf, xs, h, zf - depth, xs, h + rh - 0.1, zm], 3)); g.computeVertexNormals(); b.add(g, stoneSide); }
    b.add(bx(0.5, 1.0, 0.5).translate(x0 + w * 0.75, h + rh, zm - 0.6), M("Chimney", "#b8a68a"));
    // front garden wall with a gate in the middle, and a flower bed
    const gx = cx, gw = 1.0; for (const [a, c] of [[x0, gx - gw / 2], [gx + gw / 2, x1]] as [number, number][]) b.add(bx(c - a, 0.7, 0.3).translate((a + c) / 2, SW + 0.35, -5.15), wallM);
    for (const s of [-1, 1]) b.add(bx(0.34, 0.95, 0.34).translate(gx + s * (gw / 2 + 0.05), SW + 0.47, -5.15), postM);
    for (let k = 0; k < 7; k++) b.add(bx(0.08, 0.75, 0.05).translate(gx - gw / 2 + 0.1 + k * 0.135, SW + 0.42, -5.12), gateM);
    b.add(bx(gw - 0.1, 0.07, 0.05).translate(gx, SW + 0.62, -5.1), gateM); b.add(bx(gw - 0.1, 0.07, 0.05).translate(gx, SW + 0.24, -5.1), gateM);
    b.add(bx(w - 0.6, 0.18, 0.7).translate(cx, 0.2, zf + 0.5), M("Bed", "#6a4a32"));
    const r = rng(i * 7 + 3); for (let k = 0; k < Math.round(w * 2.2); k++) b.add(new THREE.IcosahedronGeometry(0.12 + r() * 0.06, 1).translate(x0 + 0.4 + r() * (w - 0.8), 0.36, zf + 0.35 + r() * 0.3), M("Flower" + (k % 4), ["#e8484a", "#f4c040", "#f2f0ea", "#d86ab0"][k % 4]));
    // window boxes on the front
    b.add(bx(1.0, 0.18, 0.22).translate(cx - w * 0.28, 1.05, zf + 0.12), M("WinBox", "#6a4a32")); b.add(bx(1.0, 0.18, 0.22).translate(cx + w * 0.28, 1.05, zf + 0.12), M("WinBox", "#6a4a32"));
  };
  const houses: [number, number, number][] = [[-34, -26, 4.6], [-26, -18, 5.0], [-18, -12, 4.4], [-4, 4, 4.8], [4, 11, 4.4], [11, 18, 5.0], [18, 26, 4.6], [26, 34, 4.8]];
  houses.forEach(([a, c, h], i) => cottage(a, c, -8, 7, h, i));
  // Luc's garden front: low wall with the SIDE GATE (x -6.6), the garden's back wall and side walls
  for (const [a, c] of [[-12, -7.1], [-6.1, -4]] as [number, number][]) b.add(bx(c - a, 0.7, 0.3).translate((a + c) / 2, SW + 0.35, -5.15), wallM);
  for (const s of [-1, 1]) b.add(bx(0.34, 0.95, 0.34).translate(-6.6 + s * 0.55, SW + 0.47, -5.15), postM);
  const sideGate = new THREE.Group(); sideGate.position.set(-7.05, SW, -5.12); root.add(sideGate);
  { const gb = new Batch(); for (let k = 0; k < 7; k++) gb.add(bx(0.08, 0.75, 0.05).translate(0.1 + k * 0.135, 0.42, 0), gateM); gb.add(bx(0.9, 0.07, 0.05).translate(0.45, 0.62, 0.02), gateM); gb.add(bx(0.9, 0.07, 0.05).translate(0.45, 0.24, 0.02), gateM); gb.build(sideGate); }
  const highWall = M("HighWall", "#ffffff", rep(stoneHD("htHigh", ["#d6c8ac", "#cdbfa2", "#ddd0b6", "#c6b796"], "#a89a80"), 4, 1));
  b.add(bx(8, 1.7, 0.35).translate(-8, SW + 0.85, -16.2), highWall);
  // the cottage's garden door in its west wall (x -4) + a step + a hook for the pan
  b.add(bx(0.06, 2.1, 1.0).translate(-4.03, 1.05, HT.GARDEN_DOOR[2]), M("GDoor", "#3f7a5a")); b.add(bx(0.7, 0.16, 1.3).translate(-4.4, 0.16, HT.GARDEN_DOOR[2]), M("Step", "#c6b796"));
  b.add(bx(0.06, 1.0, 1.0).translate(-4.03, 1.6, HT.GARDEN_DOOR[2] + 1.8), M("GWin", "#bcd8e8", undefined, { emissive: "#1a2a34" }));   // a side window (opaque light-blue pane, no see-through)
  const panHook = new THREE.Group(); panHook.position.set(-4.08, 1.55, HT.GARDEN_DOOR[2] - 0.85); root.add(panHook);
  { const pm = M("Pan", "#2e2a2e"); const pan = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.5), pm); pan.position.set(-0.04, -0.12, 0); panHook.add(pan); }
  // ===================== LUC'S GARDEN =====================
  // the coop: red box on legs, sloped roof, front door (hinge on its left) with a padlock, nesting box on the east side
  const coop = new THREE.Group(); coop.position.set(HT.COOP[0], SW, HT.COOP[2]); root.add(coop);
  const coopM = M("CoopW", "#ffffff", rep(coopWood(), 1, 1)), coopTrim = M("CoopT", "#f2efe6"), coopRoof = M("CoopR", "#4a4a52");
  const coopDoor = new THREE.Group(), lockG = new THREE.Group(), nestLid = new THREE.Group();
  { const cb2 = new Batch();
    cb2.add(bx(1.5, 1.1, 1.1).translate(0, 1.05, 0), coopM);
    for (const [x, z] of [[-0.68, -0.48], [0.68, -0.48], [-0.68, 0.48], [0.68, 0.48]]) cb2.add(bx(0.09, 0.5, 0.09).translate(x, 0.25, z), coopTrim);
    cb2.add(bx(1.8, 0.07, 1.45).rotateX(-0.22).translate(0, 1.72, 0.02), coopRoof);
    cb2.add(bx(1.54, 0.08, 0.04).translate(0, 1.6, 0.56), coopTrim); cb2.add(bx(1.54, 0.08, 0.04).translate(0, 0.52, 0.56), coopTrim);
    // ramp
    cb2.add(bx(0.4, 0.04, 0.9).rotateX(0.5).translate(0.2, 0.25, 0.92), M("Ramp", "#a8743e", rep(planksHD(), 0.3, 0.6)));
    for (let k = 0; k < 5; k++) cb2.add(bx(0.4, 0.03, 0.03).translate(0.2, 0.08 + k * 0.08, 0.6 + k * 0.16), coopTrim);
    // nesting box on the east side (+x)
    cb2.add(bx(0.55, 0.5, 0.8).translate(1.02, 0.95, 0), coopM);
    // the dark opening of the door (behind the door panel; seen only when the door swings: a lit straw-floor, not a void)
    cb2.add(bx(0.6, 0.6, 0.02).translate(-0.25, 1.0, 0.552), M("CoopIn", "#6a4a2e", undefined, { emissive: "#3a2a18" }));
    cb2.add(bx(0.56, 0.08, 0.3).translate(-0.25, 0.73, 0.42), M("Straw", "#e8c878", undefined, { emissive: "#3a2a10" }));
    cb2.build(coop); }
  coopDoor.position.set(-0.55, 0.7, 0.57); coop.add(coopDoor);
  { const dm = new THREE.Mesh(bx(0.62, 0.62, 0.04).translate(0.31, 0.31, 0), coopM); dm.castShadow = true; coopDoor.add(dm); const tr = new THREE.Mesh(bx(0.62, 0.05, 0.05).translate(0.31, 0.31, 0.02).rotateZ(0), coopTrim); coopDoor.add(tr);
    const hasp = new THREE.Mesh(bx(0.1, 0.05, 0.03).translate(0.58, 0.34, 0.03), M("Hasp", "#9aa0aa")); coopDoor.add(hasp); }
  lockG.position.set(0.12, 1.04, 0.62); coop.add(lockG);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 8, 16, Math.PI).translate(0, 0.04, 0), M("Shackle", "#c9ced6", undefined, { emissive: "#202428" }));
  { const lb = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.11, 0.05, 2, 0.015).translate(0, -0.02, 0), M("Lock", "#d8a83a", undefined, { emissive: "#3a2a08" })); lockG.add(lb); lockG.add(shackle);
    const kh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8).rotateX(Math.PI / 2).translate(0, -0.03, 0.027), M("KeyHole", "#2a2028")); lockG.add(kh); }
  nestLid.position.set(1.02, 1.21, -0.42); coop.add(nestLid);
  { const nl = new THREE.Mesh(bx(0.6, 0.05, 0.86).translate(0, 0, 0.42), coopRoof); nl.castShadow = true; nestLid.add(nl); }
  // the egg (rolls out of the nesting box's front lip: eggT 0..1)
  const egg = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12).scale(1, 1.28, 1), M("Egg", "#f2e2c4")); egg.castShadow = true; root.add(egg);
  // the wire run in front of the coop (frame + wire panels, alpha-tested)
  { const wm = new THREE.MeshLambertMaterial({ map: rep(wireTex(), 3, 1), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false }), fr = M("RunFr", "#9a6a3a");
    const x0 = -11.7, x1 = -10.6, z0 = -12.6, z1 = -8.8, hh = 1.0;
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) b.add(bx(0.07, hh, 0.07).translate(x, SW + hh / 2, z), fr);
    for (const [a, c] of [[[x0, z0], [x0, z1]], [[x1, z0], [x1, z1]], [[x0, z1], [x1, z1]]] as [number[], number[]][]) { const pl = new THREE.Mesh(quad(V(a[0], SW, a[1]), V(c[0], SW, c[1]), V(c[0], SW + hh, c[1]), V(a[0], SW + hh, a[1]), 3, 1), wm); pl.layers.set(NOINK); root.add(pl); } }
  // the upturned crate + kitchen scale + the scrap bowl on it
  const scale = new THREE.Group(); scale.position.set(HT.SCALE[0], SW, HT.SCALE[2]); root.add(scale);
  const scaleFace = new THREE.MeshBasicMaterial({ map: scaleTex(150) });
  { const cr = M("Crate", "#c8955a", rep(planksHD(), 0.5, 0.5)); const sb = new Batch(); sb.add(bx(0.7, 0.5, 0.5).translate(0, 0.25, 0), cr); sb.build(scale);
    const base = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.08, 0.3, 2, 0.02).translate(0, 0.54, 0), M("ScaleB", "#e8e4dc")); base.castShadow = true; scale.add(base);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 24).translate(0, 0.59, -0.02), M("ScaleP", "#c9ced6")); scale.add(plate);
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), scaleFace); disp.position.set(0, 0.545, 0.152); disp.rotation.x = -0.3; disp.layers.set(NOINK); scale.add(disp); }
  const bowl = new THREE.Group(); bowl.position.set(0, 0.6, -0.02); scale.add(bowl);
  { const bw = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2).scale(1, 0.5, 1).translate(0, 0.08, 0), M("Bowl", "#3a6aa8", undefined, { side: THREE.DoubleSide })); bw.position.y = 0.0; bowl.add(bw); }
  const bowlScraps = new THREE.Group(); bowl.add(bowlScraps);
  const scrapM = { peel: M("Peel", "#f28a1e"), crust: M("Crust", "#c27a34"), pasta: M("Pasta", "#f2d27a"), green: M("Lettuce", "#8ac04a"), core: M("Core", "#f2e2a8") };
  const scrapPiece = (kind: keyof typeof scrapM, r: () => number, s = 1) => {
    if (kind === "peel") return new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 10, 6, 0, Math.PI * (0.8 + r() * 0.6), 0, Math.PI / 2).scale(1, 0.5, 1), scrapM.peel);
    if (kind === "crust") return new THREE.Mesh(new RoundedBoxGeometry(0.11 * s, 0.03 * s, 0.035 * s, 2, 0.01 * s).rotateY(r() * 3), scrapM.crust);
    if (kind === "pasta") { const pts: THREE.Vector3[] = []; const n = 8; for (let i = 0; i < n; i++) pts.push(V((i / n - 0.5) * 0.14 * s, 0.01 * Math.sin(i * 2.3), 0.03 * s * Math.sin(i * 1.7 + r()))); return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.005 * s, 5, false), scrapM.pasta); }
    if (kind === "green") return new THREE.Mesh(new THREE.CircleGeometry(0.05 * s, 7).rotateX(-Math.PI / 2 + (r() - 0.5)), scrapM.green);
    return new THREE.Mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.05 * s, 8), scrapM.core);
  };
  { const r = rng(55); const kinds: (keyof typeof scrapM)[] = ["peel", "crust", "pasta", "green", "peel", "crust", "pasta", "peel", "green", "crust", "pasta", "peel"];
    kinds.forEach((k, i) => { const me = scrapPiece(k, r, 0.9); me.position.set((r() - 0.5) * 0.18, 0.06 + (i % 3) * 0.02, (r() - 0.5) * 0.18); me.rotation.y = r() * TAU; me.castShadow = true; bowlScraps.add(me); }); }
  // scraps tipped into the run (runScraps 0..1)
  const runPile = new THREE.Group(); runPile.position.set(HT.PILE[0], SW + 0.02, HT.PILE[2]); root.add(runPile);
  { const r = rng(77); for (let i = 0; i < 26; i++) { const me = scrapPiece((["peel", "crust", "pasta", "green", "core"] as const)[i % 5], r, 1.4); me.position.set((r() - 0.5) * 0.7, 0.02, (r() - 0.5) * 0.7); me.userData.y0 = 0.02; me.rotation.y = r() * TAU; me.castShadow = true; runPile.add(me); } }
  // a round nest of straw on the lawn by the coop (Neige lays there)
  { const st = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.08, 8, 20).rotateX(Math.PI / 2).translate(HT.NESTGROUND[0], SW + 0.05, HT.NESTGROUND[2]), M("StrawN", "#e8c878")); st.castShadow = true; root.add(st); const sd = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16).rotateX(-Math.PI / 2).translate(HT.NESTGROUND[0], SW + 0.03, HT.NESTGROUND[2]), M("StrawD", "#d8b060")); root.add(sd); }
  // the scrap bucket on the step (bucket 0/1)
  const bucket = new THREE.Group(); bucket.position.set(-4.55, 0.24, HT.GARDEN_DOOR[2] + 0.55); root.add(bucket);
  { const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.3, 18, 1, true).translate(0, 0.15, 0), M("Bucket", "#b8bec8", undefined, { side: THREE.DoubleSide })); bk.castShadow = true; bucket.add(bk);
    const r = rng(91); for (let i = 0; i < 9; i++) { const me = scrapPiece((["peel", "crust", "green"] as const)[i % 3], r, 1.2); me.position.set((r() - 0.5) * 0.2, 0.3, (r() - 0.5) * 0.2); bucket.add(me); } }
  // the toy truck on the grass by the nesting box (toy 0/1, toyX)
  const toy = new THREE.Group(); root.add(toy);
  { const tg = M("ToyG", "#3f8a4a"), tw = M("ToyW", "#e8e4dc"), tt = M("ToyT", "#2c2a2e"); const t1 = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.12, 0.13, 2, 0.02).translate(-0.04, 0.1, 0), tg); const t2 = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.1, 0.13, 2, 0.02).translate(0.13, 0.09, 0), tw); toy.add(t1, t2);
    for (const x of [-0.1, 0.12]) for (const z of [-0.07, 0.07]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12).rotateX(Math.PI / 2).translate(x, 0.035, z), tt); toy.add(w); } }
  // vegetable patch, laundry line, a watering can, a bench by the wall
  b.add(bx(3.2, 0.16, 1.2).translate(-9.4, 0.18, -6.6), M("Soil", "#6a4a32"));
  { const r = rng(12); for (let i = 0; i < 18; i++) b.add(new THREE.ConeGeometry(0.1, 0.32, 6).translate(-10.8 + (i % 9) * 0.35, 0.42, -6.9 + Math.floor(i / 9) * 0.55 + (r() - 0.5) * 0.06), M("Leek", "#5a9a46")); }
  const laundry: THREE.Mesh[] = [];
  { const pm2 = M("LinePost", "#8a6a4a"); for (const x of [-11.6, -6.4]) b.add(bx(0.08, 2.0, 0.08).translate(x, SW + 1.0, -15.4), pm2);
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 5.2, 4).rotateZ(Math.PI / 2).translate(-9, SW + 1.9, -15.4), M("Line", "#f2efe6")); root.add(line);
    [["#f2efe6", 0.7, 0.8], ["#4a7ac0", 0.6, 0.7], ["#e8b030", 0.5, 0.55], ["#c8352e", 0.7, 0.6], ["#f2efe6", 0.45, 0.5]].forEach(([c, w, hh], i) => { const me = new THREE.Mesh(new THREE.PlaneGeometry(w as number, hh as number, 4, 4).translate(0, -(hh as number) / 2, 0), M("Cloth" + i, c as string, undefined, { side: THREE.DoubleSide })); me.position.set(-11 + i * 1.05, SW + 1.9, -15.4); me.castShadow = true; root.add(me); laundry.push(me); }); }
  { const wc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.3, 14).translate(-7.9, SW + 0.15, -14.9), M("WCan", "#4a8ab0")); wc.castShadow = true; root.add(wc); }
  // ===================== SOUTH SIDE: CAFÉ + TOWN HALL =====================
  { const fac = M("CafeFac", "#ffffff", facadeHD("htCafe", 8, 5.2, { wall: "#f2e2c8", shutter: "#2e5a3e", door: true }));
    b.add(quad(V(-2, 0, 9), V(-10, 0, 9), V(-10, 5.2, 9), V(-2, 5.2, 9), 1, 1), fac); b.add(bx(8, 5.2, 6).translate(-6, 2.6, 12.01), stoneSide);
    b.add(bx(8.6, 0.12, 6.6).translate(-6, 5.26, 12), roofM);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.7), unlit(cafeSign(), 0.95)); sign.position.set(-6, 3.55, 8.96); sign.rotation.y = Math.PI; root.add(sign);
    // the awning: striped, sloping out over the terrace
    const aw = new THREE.Mesh(quad(V(-2.2, 3.4, 8.95), V(-9.8, 3.4, 8.95), V(-9.8, 2.9, 7.0), V(-2.2, 2.9, 7.0), 1, 1), M("Awning", "#ffffff", stripeTex(), { side: THREE.DoubleSide })); aw.castShadow = true; root.add(aw);
    for (let i = 0; i < 12; i++) b.add(new THREE.ConeGeometry(0.16, 0.22, 3).rotateX(Math.PI).translate(-9.5 + i * 0.66, 2.81, 7.0), M("Valance" + (i % 2), i % 2 ? "#f4efe6" : "#c8352e"));
    // terrace tables + chairs
    const iron = M("Iron", "#2e3238"), top = M("TableTop", "#f2efe6");
    for (const [x, z] of [[-8.4, 6.6], [-5.8, 7.4], [-3.6, 6.4]] as [number, number][]) { b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 20).translate(x, SW + 0.74, z), top); b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8).translate(x, SW + 0.37, z), iron); b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 14).translate(x, SW + 0.02, z), iron);
      for (const a of [0.3, 2.4, 4.4]) { const cx = x + Math.cos(a) * 0.62, cz = z + Math.sin(a) * 0.62; b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 14).translate(cx, SW + 0.46, cz), M("Seat", "#c8352e")); for (const d of [-1, 1]) b.add(bx(0.03, 0.46, 0.03).translate(cx + d * 0.13, SW + 0.23, cz), iron); b.add(bx(0.36, 0.34, 0.03).rotateY(-a + Math.PI / 2).translate(cx + Math.cos(a) * 0.18, SW + 0.68, cz + Math.sin(a) * 0.18), iron); }
      b.add(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 12).translate(x + 0.1, SW + 0.8, z), M("Cup", "#f6f3ec")); }
    // café windows: light tinted glass (opaque-looking pale blue with a reflection band), never a see-through panel
    for (const x of [-8.6, -3.4]) { b.add(bx(2.0, 1.8, 0.05).translate(x, 1.6, 8.97), M("CafeGlass", "#c8dce8", undefined, { emissive: "#24323c" })); b.add(bx(2.1, 0.08, 0.08).translate(x, 2.54, 8.95), M("Frame", "#2e5a3e")); }
  }
  const cafeClock = new THREE.Group(); cafeClock.position.set(-3.0, 3.15, 8.93); root.add(cafeClock);
  { const cf = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), unlit(clockTex(), 0.95)); cf.rotation.y = Math.PI; cafeClock.add(cf); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 28), M("ClockRim", "#2e5a3e")); cafeClock.add(rim);
    const hm = new THREE.MeshBasicMaterial({ color: "#2a2028" }); const hh = new THREE.Mesh(bx(0.035, 0.19, 0.01).translate(0, 0.08, -0.01), hm), mh = new THREE.Mesh(bx(0.025, 0.28, 0.01).translate(0, 0.13, -0.012), hm); hh.name = "h"; mh.name = "m"; cafeClock.add(hh, mh); }
  // the chalk A-board (aboard 0..1 turns it to face the street, chalk 0..1 draws MAYOR CLUCK)
  const aboard = new THREE.Group(); aboard.position.set(HT.CAFE_BOARD[0], SW, HT.CAFE_BOARD[2]); root.add(aboard);
  const boardFace = new THREE.MeshBasicMaterial({ map: chalkTex(), color: new THREE.Color(0.9, 0.9, 0.9) }), menuFace = new THREE.MeshBasicMaterial({ map: menuTex(), color: new THREE.Color(0.9, 0.9, 0.9) });
  { const wood = M("ABoard", "#a8743e"); const fr = new THREE.Mesh(bx(0.62, 0.86, 0.04).rotateX(-0.18).translate(0, 0.5, -0.08), wood); fr.castShadow = true; aboard.add(fr); const bk2 = new THREE.Mesh(bx(0.62, 0.86, 0.04).rotateX(0.18).translate(0, 0.5, 0.08), wood); aboard.add(bk2);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.72), boardFace); face.position.set(0, 0.52, -0.112); face.rotation.set(-0.18, Math.PI, 0); face.layers.set(NOINK); aboard.add(face);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.72), menuFace); back.position.set(0, 0.52, 0.112); back.rotation.x = 0.18; back.layers.set(NOINK); aboard.add(back); }
  // town hall
  const clockHands = new THREE.Group();
  { const fac = M("HallFac", "#ffffff", facadeHD("htHall", 14, 7, { wall: "#e9dfc8", shutter: "#3a4a6a", door: false }));
    b.add(quad(V(20, 0, 10), V(6, 0, 10), V(6, 7, 10), V(20, 7, 10), 1, 1), fac); b.add(bx(14, 7, 8).translate(13, 3.5, 14.01), stoneSide);
    b.add(quad(V(20.4, 7, 9.6), V(5.6, 7, 9.6), V(5.6, 9.4, 14), V(20.4, 9.4, 14), 3, 1), roofM);
    // central pediment + clock
    const ped = new THREE.BufferGeometry(); ped.setAttribute("position", new THREE.Float32BufferAttribute([16, 7, 9.9, 10, 7, 9.9, 13, 9.0, 9.9], 3)); ped.computeVertexNormals(); b.add(ped, M("Ped", "#efe6d2", undefined, { side: THREE.DoubleSide }));
    const cf = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), unlit(clockTex(), 0.95)); cf.position.set(13, 7.75, 9.86); cf.rotation.y = Math.PI; root.add(cf);
    clockHands.position.set(13, 7.75, 9.84); root.add(clockHands);
    const hm = new THREE.MeshBasicMaterial({ color: "#2a2028" }); const hh = new THREE.Mesh(bx(0.06, 0.34, 0.01).translate(0, 0.15, 0), hm), mh = new THREE.Mesh(bx(0.04, 0.5, 0.01).translate(0, 0.23, 0), hm); hh.name = "h"; mh.name = "m"; clockHands.add(hh, mh);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 0.84), unlit(hallSign(), 0.95)); sign.position.set(13, 5.8, 9.96); sign.rotation.y = Math.PI; root.add(sign);
    // door, windows (light tint), columns, steps
    b.add(bx(2.0, 3.2, 0.1).translate(13, 0.9 + 1.6, 9.96), M("HallDoor", "#8a5a3a", rep(planksHD(), 0.4, 0.6))); for (const x of [12.5, 13.5]) for (const y of [1.7, 3.1]) b.add(bx(0.8, 1.1, 0.04).translate(x, y, 9.9), M("HallPanel", "#a06a44"));
    for (const x of [8.0, 10.2, 15.8, 18.0]) for (const y of [2.3, 4.9]) b.add(bx(1.2, 1.6, 0.05).translate(x, y, 9.97), M("HallGlass", "#c8d8e4", undefined, { emissive: "#24303a" }));
    for (const x of [10.9, 15.1]) b.add(new THREE.CylinderGeometry(0.26, 0.3, 4.4, 16).translate(x, 0.9 + 2.2, 9.7), M("Col", "#f2ead6"));
    const stepM = M("HallStep", "#ffffff", rep(stoneHD("htStep", ["#e2d6bc", "#d8ccb2", "#e6dcc4", "#d2c4a8"], "#b8aa90"), 4, 0.5));
    for (let k = 0; k < 5; k++) b.add(bx(8 - k * 0.4, 0.18, 2.6 - k * 0.52).translate(13, SW + 0.09 + k * 0.18, 8.7 + k * 0.26), stepM);
    // flag pole + flag (blue, white, red)
    b.add(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 8).rotateX(-0.5).translate(13, 6.9, 9.0), M("Pole", "#e8e4dc"));
    const fl = ctex("htFlag", 192, 128, (g) => { g.fillStyle = "#2a4a9a"; g.fillRect(0, 0, 64, 128); g.fillStyle = "#f6f3ec"; g.fillRect(64, 0, 64, 128); g.fillStyle = "#d8282a"; g.fillRect(128, 0, 64, 128); });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8, 8, 2), swayMaterial(lam("htFlagM", () => ({ map: fl, side: THREE.DoubleSide })))); flag.position.set(13.6, 7.9, 8.2); flag.rotation.y = Math.PI; root.add(flag);
  }
  // south-side houses beyond the town hall and café
  for (const [a, c, h, i] of [[-26, -18, 4.8, 10], [-18, -10, 5.2, 11], [-2, 6, 4.6, 12], [20, 28, 5, 13], [28, 36, 4.4, 14]] as [number, number, number, number][]) {
    const fac = M("FacS" + i, "#ffffff", facadeHD("htFacS" + i, c - a, h, { wall: cream[i % 6], shutter: shut[(i + 2) % 6], door: true })); b.add(quad(V(c, 0, 9), V(a, 0, 9), V(a, h, 9), V(c, h, 9), 1, 1), fac); b.add(bx(c - a, h, 7).translate((a + c) / 2, h / 2, 12.51), stoneSide);
    b.add(bx(c - a + 0.6, 0.12, 7.6).translate((a + c) / 2, h + 0.05, 12.5), roofM); b.add(new THREE.CylinderGeometry(0.01, 3.9, 1.6, 4, 1).rotateY(Math.PI / 4).scale((c - a) / 5.6, 1, 1.4).translate((a + c) / 2, h + 0.85, 12.5), roofM); }
  // ===================== TREES (plane trees; spring blossoms pop on them) =====================
  const barkM = lam("byBarkM", () => ({ map: barkTex() }));
  const leafM = swayMaterial(lam("htLeafMS", () => ({ color: "#6aa64e", vertexColors: true }) as THREE.MeshLambertMaterialParameters));
  const coreM = swayMaterial(lam("htCore", () => ({ color: "#3e7034", emissive: "#14300e" })));
  const treeAt: V3[] = [[-19, SW, 4.7], [-0.6, SW, 4.8], [4.6, SW, 4.8], [24, SW, 4.7], [-28, SW, -4.3], [9.2, SW, -4.3], [27, SW, -4.3], [-13, SW, -15], [-16.5, SW, -4.4], [3.4, SW, -4.4]];
  treeAt.forEach((p, i) => { leafyTree(bc, root, p, i === 7 ? 6.0 : 7.2, 60 + i, leafM, coreM, barkM, 14, leafCardMat("vbLeafCardM")); b.add(bx(1.1, 0.04, 1.1).translate(p[0], SW + 0.01, p[2]), M("Pit", "#5a4a3a")); });
  const blossoms: THREE.Mesh[] = []; const blossomM = M("Blossom", "#f2a8c4", undefined, { emissive: "#3a1a26" });
  treeAt.forEach((p, i) => { const r = rng(400 + i); const h = i === 7 ? 6.0 : 7.2; for (let k = 0; k < 16; k++) { const th = r() * TAU, d = h * 0.3 * (0.5 + r() * 0.6); const me = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 + r() * 0.35, 1), blossomM); me.position.set(p[0] + Math.cos(th) * d, p[1] + h * 0.72 + (r() - 0.3) * h * 0.25, p[2] + Math.sin(th) * d); me.userData.k0 = (i % 4) * 0.12 + r() * 0.3; me.castShadow = false; root.add(me); blossoms.push(me); } });
  // drifting petals (small pink cards)
  const petals: THREE.Mesh[] = []; { const pm = new THREE.MeshBasicMaterial({ color: "#f6b8cc", side: THREE.DoubleSide }); const r = rng(808); for (let i = 0; i < 60; i++) { const me = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), pm); me.userData = { x: -30 + r() * 60, z: -5 + r() * 10, y: 2 + r() * 4, s: r() * 9 }; me.layers.set(NOINK); root.add(me); petals.push(me); } }
  // ===================== PARKED CARS + STREET FURNITURE =====================
  for (const [x, col, z] of [[-25, "#2a5a8a", 2.0], [30, "#e0b84a", -2.0], [-36, "#8a8a92", -2.0]] as [number, string, number][]) { const s = sedan(root, { style: "modern", body: col }); s.g.rotation.y = z > 0 ? -Math.PI / 2 : Math.PI / 2; s.g.position.set(x, 0, z); }
  { const lp = M("LampPost", "#2e3238"); for (const x of [-16, 2, 19]) { b.add(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 8).translate(x, SW + 1.8, 5.2), lp); b.add(new THREE.SphereGeometry(0.2, 12, 8).translate(x, SW + 3.7, 5.2), M("LampG", "#f2efe6")); } }
  // ===================== STREET BINS (0..6) + LUC'S GARDEN BIN (7) =====================
  const bins: THREE.Group[] = [];
  HT.BINS.forEach((x, i) => { const w = wheelie(root, i % 3 === 1 ? "#3f6a8a" : "#3f7a4a"); w.position.set(x, SW, HT.BINZ); w.rotation.y = Math.PI; w.userData.base = [x, SW, HT.BINZ]; bins.push(w); });
  { const w = wheelie(root); w.position.set(...HT.LUCBIN); w.rotation.y = Math.PI * 0.95; w.userData.base = [...HT.LUCBIN]; bins.push(w); }
  // bin contents visible when a lid is open: a dark bag top that sinks as it empties (b{i}f 0..1 fill)
  bins.forEach((w) => { const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.62), M("BinIn", "#2a2a2e")); top.position.set(0, 1.0, 0); w.add(top); w.userData.top = top; });
  // a lone eggshell in the near-empty bin (shot 10)
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8, 0, TAU, 0, Math.PI * 0.6).scale(1, 1.25, 1), M("Shell", "#f2e2c4", undefined, { side: THREE.DoubleSide })); root.add(shell);
  // ===================== ODILE'S CART OF HEN CRATES =====================
  const cart = new THREE.Group(); root.add(cart);
  { const cm = M("CartW", "#8a6a4a", rep(beamHD(), 1, 1)), wm = M("CrateW", "#d8b07a", rep(planksHD(), 0.4, 0.3)), wire = new THREE.MeshLambertMaterial({ map: rep(wireTex(), 1, 0.6), transparent: true, alphaTest: 0.3, depthWrite: false, side: THREE.DoubleSide });
    const cb3 = new Batch(); cb3.add(bx(1.3, 0.06, 0.8).translate(0, 0.6, 0), cm); for (const z of [-0.36, 0.36]) cb3.add(bx(1.3, 0.12, 0.04).translate(0, 0.68, z), cm); cb3.add(bx(0.05, 0.05, 0.9).translate(-0.85, 0.95, 0), cm); for (const z of [-0.3, 0.3]) cb3.add(bx(0.35, 0.04, 0.04).translate(-0.68, 0.82, z).rotateZ(0.3), cm);
    for (let k = 0; k < 3; k++) { cb3.add(bx(0.5, 0.04, 0.6).translate(-0.4 + k * 0.42, 0.66, 0), wm); cb3.add(bx(0.5, 0.04, 0.6).translate(-0.4 + k * 0.42, 1.0, 0), wm); }
    cb3.build(cart);
    for (let k = 0; k < 3; k++) for (const z of [-0.3, 0.3]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.34), wire); pl.position.set(-0.4 + k * 0.42, 0.83, z); pl.layers.set(NOINK); cart.add(pl); }
    for (const z of [-0.42, 0.42]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16).rotateX(Math.PI / 2).translate(0.2, 0.3, z), M("CartTyre", "#2c2a2e")); wh.castShadow = true; cart.add(wh); } }
  // ===================== BRUNO'S GARBAGE TRUCK =====================
  const truck = new THREE.Group(); root.add(truck); const tb = new THREE.Group(); truck.add(tb);
  const green = lam("htTruckG", () => ({ color: "#3f8a4a", emissive: "#081a0a" })), white = M("TruckW", "#eef0ea"), tyre = M("Tyre", "#2c2a2e"), chrome = M("Chrome", "#dfe2e8"), dark = M("TruckD", "#2a3a2c");
  const glassT = M("TGlass", "#bcd0dc", undefined, { emissive: "#18242c" });   // v19: a light tint, opaque (no see-through coloured panel)
  const wheels: THREE.Group[] = [];
  const readMat = new THREE.MeshBasicMaterial({ map: readoutTex(2.4, 1240) });
  { const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; tb.add(me); return me; };
    add(bx(6.4, 0.3, 1.9).translate(-0.4, 0.7, 0), dark);                                                  // chassis
    add(new RoundedBoxGeometry(1.7, 1.04, 2.2, 3, 0.1).translate(2.15, 1.3, 0), white);                     // cab lower (white)
    add(new RoundedBoxGeometry(1.7, 0.24, 2.2, 3, 0.08).translate(2.15, 2.6, 0), white);                     // cab roof
    add(bx(0.12, 0.7, 2.2).translate(1.36, 2.15, 0), white);                                                 // cab back wall
    for (const s of [-1, 1]) add(bx(0.12, 0.7, 0.1).translate(2.96, 2.15, s * 1.05), white);                 // A-pillars
    add(new THREE.TorusGeometry(0.2, 0.03, 8, 20).rotateY(Math.PI / 2).rotateZ(0.5).translate(2.7, 1.95, -0.45), M("Wheel", "#2a2a30"));   // steering wheel
    add(bx(0.4, 0.5, 0.9).translate(1.62, 1.95, -0.5), M("SeatBack", "#4a4e58"));
    add(new RoundedBoxGeometry(1.2, 0.5, 2.2, 3, 0.1).translate(2.4, 0.95, 0), white);
    add(bx(0.05, 0.75, 1.9).translate(3.0, 2.15, 0), glassT);                                                // windscreen (tint)
    add(bx(1.5, 0.66, 0.04).translate(2.16, 2.15, 1.08), glassT);                                            // south side window (closed)
    // north side: the driver's window is open (Bruno leans out of it); his body hides behind the cab's lower side
    add(bx(0.06, 0.4, 1.4).translate(3.05, 0.9, 0), M("TGrille", "#3a3a40"));
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16).rotateZ(Math.PI / 2).translate(3.07, 1.0, s * 0.75), M("THead", "#fff4d8", undefined, { emissive: "#7a6a4a" }));
    add(bx(0.2, 0.2, 2.2).translate(3.1, 0.62, 0), chrome);
    // the body: an open-top hopper (green box with a lip) from x -3.4 to 1.2
    const hop = green; add(bx(4.6, 0.12, 2.3).translate(-1.1, 0.9, 0), hop);
    add(bx(4.6, 1.8, 0.1).translate(-1.1, 1.85, 1.12), hop); add(bx(4.6, 1.8, 0.1).translate(-1.1, 1.85, -1.12), hop);
    add(bx(0.1, 1.8, 2.3).translate(1.2, 1.85, 0), hop); add(bx(0.1, 1.8, 2.3).translate(-3.4, 1.85, 0), hop);
    add(bx(4.8, 0.1, 0.18).translate(-1.1, 2.78, 1.12), white); add(bx(4.8, 0.1, 0.18).translate(-1.1, 2.78, -1.12), white);   // rim lip
    for (const x of [-2.8, -1.6, -0.4, 0.8]) for (const s of [-1, 1]) add(bx(0.08, 1.7, 0.06).translate(x, 1.85, s * 1.18), M("Rib", "#367a40"));
    add(bx(1.3, 0.12, 0.04).translate(-2.7, 1.2, -1.19), M("Stripe", "#f4c430", undefined, { emissive: "#3a2a08" }));
    add(bx(1.3, 0.12, 0.04).translate(-2.7, 1.2, 1.19), M("Stripe", "#f4c430", undefined, { emissive: "#3a2a08" }));
    for (const s of [-1, 1]) { add(bx(0.06, 0.22, 0.12).translate(-3.45, 1.0, s * 0.95), M("TTail", "#ff4a3a", undefined, { emissive: "#6a1010" })); }
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), readMat); disp.position.set(-1.7, 1.75, -1.2); disp.rotation.y = Math.PI; disp.layers.set(NOINK); tb.add(disp);
    for (const [x, s] of [[2.2, -1], [2.2, 1], [-1.4, -1], [-1.4, 1], [-2.5, -1], [-2.5, 1]] as [number, number][]) { const w = new THREE.Group(); w.position.set(x, 0.48, s * 0.98); tb.add(w); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 20).rotateX(Math.PI / 2), tyre); t.castShadow = true; w.add(t); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 10).rotateX(Math.PI / 2), chrome); w.add(hub); wheels.push(w); }
  }
  // the coin meter on the cab's back corner: coins clatter out of its slot into a little tray (coins 0..1)
  const coins: THREE.Mesh[] = []; { const cm = M("Coin", "#e0b040", undefined, { emissive: "#4a3410" }); for (let i = 0; i < 10; i++) { const me = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 14), cm); me.rotation.x = Math.PI / 2; tb.add(me); coins.push(me); } }
  // hopper contents: bags (load 0..1 inside, heap 0..1 above the rim)
  const bags: THREE.Mesh[] = []; { const r = rng(333), bm = [M("BagK", "#2a2a2e"), M("BagG", "#3a5a3a"), M("BagW", "#d8d8d0")]; for (let i = 0; i < 60; i++) { const me = new THREE.Mesh(bagGeo(r, 0.85 + r() * 0.4), bm[i % 3]); const lvl = i / 60; me.userData = { x: -3.1 + r() * 4.0, z: (r() - 0.5) * 1.8, y: 1.05 + lvl * 2.3, lvl, rot: r() * TAU }; me.castShadow = true; tb.add(me); bags.push(me); } }
  const tumble = new THREE.Mesh(bagGeo(rng(5), 1.0), M("BagK", "#2a2a2e")); tumble.castShadow = true; root.add(tumble);
  // the lift arm on the north side with its own bin (lift / tip), and the bin's falling load (dump): 8 bags then the food third
  // the arm: a steel bar from its pivot on the body side to the bin's back, re-aimed every frame
  const ARM0 = V(0.55, 1.15, -1.25), armM = new THREE.Mesh(bx(0.14, 1, 0.14).translate(0, 0.5, 0), M("Arm", "#c9ced6")); armM.castShadow = true; armM.position.copy(ARM0); tb.add(armM);
  const liftBin = wheelie(tb); liftBin.position.set(0.55, 0.12, -1.8); liftBin.rotation.y = Math.PI;
  const falling: THREE.Mesh[] = []; const fallData: { from: V3; to: V3; t0: number; spin: number; kind: string }[] = [];
  { const r = rng(919), bm = [M("BagK", "#2a2a2e"), M("BagG", "#3a5a3a")];
    for (let i = 0; i < 8; i++) { const me = new THREE.Mesh(bagGeo(r, 0.75), bm[i % 2]); tb.add(me); falling.push(me); fallData.push({ from: [0.4 + (r() - 0.5) * 0.3, 3.1, -0.9 + r() * 0.3], to: [-0.8 + (r() - 0.5) * 1.8, 2.05 + r() * 0.3, (r() - 0.5) * 1.4], t0: i * 0.04, spin: r() * 4, kind: "bag" }); }
    const food = ["peel", "crust", "pasta", "green", "core"] as const;
    for (let i = 0; i < 34; i++) { const me = scrapPiece(food[i % 5], r, 4.2); tb.add(me); falling.push(me); fallData.push({ from: [0.4 + (r() - 0.5) * 0.4, 3.2, -0.9 + r() * 0.4], to: [-0.6 + (r() - 0.5) * 1.6, 2.45 + r() * 0.2, (r() - 0.5) * 1.3], t0: 0.42 + (i / 34) * 0.35, spin: r() * 6, kind: food[i % 5] }); }
    // one spaghetti strand that dangles from the bin lip (dangle in pose)
  }
  const dangle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.02, -0.18, 0.01), V(-0.02, -0.36, 0), V(0.01, -0.5, 0.02)]), 16, 0.012, 6, false), scrapM.pasta); liftBin.add(dangle); dangle.position.set(0.1, 1.08, 0.36);

  b.build(root); bc.build(root);

  const marks: Record<string, V3> = {
    odileGate: [-0.4, SW, -4.25], lucGate: [0.6, SW, -5.6], cafeHenri: [-5.8, SW, 7.0], cafeReg1: [-8.4, SW, 6.0], cafeReg2: [-3.6, SW, 7.0], baker: [-6.0, SW, 8.6],
    lucDoor: [-4.6, 0.32, HT.GARDEN_DOOR[2]], coopFront: [-9.4, SW, -12.4], nest: [-8.0, SW, -12.9], scale: [-7.4, SW, -9.0], hallTop: [13, 1.02, 8.9], hallFoot: [13, SW, 6.6],
  };
  const cams: SetDef["cams"] = {
    gate: { pos: [0.2, 1.3, -1.4], look: [0.0, 1.1, -4.8], fov: 50 },
    truck: { pos: [-1.0, 1.6, -6.0], look: [-1.2, 1.8, -1.6], fov: 52 },
    hopper: { pos: [-1.4, 5.2, -3.4], look: [-1.2, 2.4, -1.6], fov: 50 },
    street: { pos: [6, 2.4, 1.0], look: [-4, 1.3, -4.4], fov: 54 },
    cafe: { pos: [-5.4, 1.4, 2.8], look: [-5.6, 1.1, 7.2], fov: 54 },
    garden: { pos: [-6.4, 1.2, -7.0], look: [-9.4, 0.8, -12.8], fov: 54 },
    scale: { pos: [-7.3, 1.0, -8.6], look: [-7.4, 0.7, -9.6], fov: 44 },
    hall: { pos: [13, 1.8, 2.6], look: [13, 1.5, 8.6], fov: 54 },
  };
  let lastRead = "", lastGrams = -1;
  return {
    name: "hentown", root, marks, cams, title: [coop],
    pose: (t, c) => {
      // --- truck ---
      truck.visible = (c.truckOn ?? 1) > 0;
      const tx = c.truckX ?? -2, tz = c.truckZ ?? -1.75; truck.position.set(tx, (c.truckBob ?? 0) * 0.03 * Math.sin(t * 38), tz); truck.rotation.y = c.truckYaw ?? 0;
      wheels.forEach((w) => { w.rotation.z = -tx / 0.48; });
      const key = `${(c.tons ?? 2.4).toFixed(2)}|${Math.round(c.pay ?? 1240)}`; if (key !== lastRead) { readMat.map = readoutTex(c.tons ?? 2.4, c.pay ?? 1240); readMat.needsUpdate = true; lastRead = key; }
      const lift = sm(c.lift ?? 0), tip = sm(c.tip ?? 0);
      liftBin.visible = (c.liftBinOn ?? 0) > 0;
      liftBin.position.set(0.55, 0.12 + 3.78 * lift, -1.8 + 0.28 * lift); liftBin.rotation.set(2.6 * tip, Math.PI, 0);
      { const grip = V(0.55, liftBin.position.y + 0.55 + 0.1 * tip, liftBin.position.z + 0.3 - 0.2 * tip), d = grip.clone().sub(ARM0); armM.scale.set(1, d.length(), 1); armM.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); armM.visible = lift > 0.02 || tip > 0.02; }
      (liftBin.userData.lid as THREE.Group).rotation.x = -(0.15 + 2.2 * cl(c.lidT ?? tip)) * (tip > 0.05 || (c.lidT ?? 0) > 0 ? 1 : 0) + 0.12 * Math.sin(t * 9) * (c.lidT ? 0 : 0);
      dangle.visible = (c.dangle ?? 0) > 0; dangle.rotation.z = 0.25 * Math.sin(t * 6);
      const load = c.load ?? 0.4, heap = c.heap ?? 0;
      bags.forEach((m) => { const d = m.userData as { x: number; z: number; y: number; lvl: number; rot: number }; const vis = d.lvl < load * 0.62 + heap * 0.4; m.visible = vis; m.position.set(d.x, d.y > 2.65 ? 2.65 + (d.y - 2.65) * 0.8 + 0.04 * heap * Math.sin(t * 20 + d.rot) * (c.truckBob ?? 0) : d.y, d.z); m.rotation.y = d.rot; });
      const tu = c.tumble ?? -1; tumble.visible = tu >= 0; if (tumble.visible) { const u = cl(tu), x0 = c.tumbleX0 ?? tx; tumble.position.set(x0 - 2.4 - 0.4 * u, Math.max(0.24, 3.05 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 1.6)) - 2.85 * u * u), tz - 0.6 - 1.5 * u); tumble.rotation.set(u * 5, u * 2, u * 4); }
      const dump = c.dump ?? 0;
      falling.forEach((m, i) => { const fd = fallData[i], u = cl((dump - fd.t0) / 0.32); m.visible = dump > 0 && dump > fd.t0; if (!m.visible) return;
        const f = fd.from, e = fd.to, uu = 1 - (1 - u) * (1 - u); m.position.set(f[0] + (e[0] - f[0]) * u, f[1] + (e[1] - f[1]) * uu + 0.5 * Math.sin(Math.PI * u) * 0.2, f[2] + (e[2] - f[2]) * u); m.rotation.set(fd.spin * u, fd.spin * 0.7 * u, 0); });
      const co = c.coins ?? 0; coins.forEach((m, i) => { const u = cl(co * 1.6 - i * 0.06); m.visible = co > 0 && u > 0; m.position.set(1.0 + 0.02 * i, 1.6 - 0.55 * u * u + 0.05 * Math.sin(u * 9 + i), -1.2 - 0.12 * u - 0.01 * i); m.rotation.y = u * 8 + i; });
      // --- bins ---
      bins.forEach((w, i) => { const base = w.userData.base as V3; w.visible = (c[`b${i}v`] ?? 1) > 0; w.position.set(base[0] + (c[`b${i}x`] ?? 0), base[1] + (c[`b${i}y`] ?? 0), base[2] + (c[`b${i}z`] ?? 0)); w.rotation.z = c[`b${i}r`] ?? 0; w.rotation.x = c[`b${i}p`] ?? 0; w.rotation.y = (i === 7 ? Math.PI * 0.95 : Math.PI) + (c[`b${i}yaw`] ?? 0);
        (w.userData.lid as THREE.Group).rotation.x = -2.0 * sm(c[`b${i}l`] ?? 0); (w.userData.top as THREE.Mesh).position.y = 0.2 + 0.8 * (c[`b${i}f`] ?? 1); });
      shell.visible = (c.shell ?? 0) > 0; if (shell.visible) shell.position.set(c.shellX ?? 0, c.shellY ?? 0, c.shellZ ?? 0);
      // --- spring ---
      const sp = c.spring ?? 0; blossoms.forEach((m) => { const k = sm((sp - (m.userData.k0 as number)) / 0.25); m.visible = k > 0.01; m.scale.setScalar(Math.max(0.01, k * (1 + 0.15 * Math.sin(Math.min(1, k) * Math.PI)))); });
      const pe = c.petals ?? sp; petals.forEach((m) => { const d = m.userData as { x: number; z: number; y: number; s: number }; m.visible = pe > 0.05; if (!m.visible) return; const u = (t * 0.25 + d.s) % 1; m.position.set(d.x + Math.sin(t + d.s) * 0.6 + u * 1.2, d.y - u * 3.5, d.z); m.rotation.set(t * 2 + d.s, t * 3, d.s); });
      // --- clock, A-board ---
      const hrs = c.clockH ?? 9.5; for (const ch of [clockHands, cafeClock]) { (ch.getObjectByName("h") as THREE.Mesh).rotation.z = ((hrs % 12) / 12) * TAU; (ch.getObjectByName("m") as THREE.Mesh).rotation.z = (hrs % 1) * TAU; }
      aboard.rotation.y = Math.PI * 0.5 * (1 - sm(c.aboard ?? 1)); boardFace.color.setScalar(0.25 + 0.65 * sm(c.chalk ?? 1));
      // --- garden ---
      coopDoor.rotation.y = -1.9 * sm(c.coopDoor ?? 0); lockG.rotation.z = 0.6 * sm(c.lock ?? 0); shackle.position.y = 0.035 * sm(c.lock ?? 0); lockG.visible = (c.lockOn ?? 1) > 0;
      nestLid.rotation.x = -0.9 * sm(c.nestLid ?? 0);
      const gr = Math.max(0, c.grams ?? 150); if (Math.round(gr) !== lastGrams) { scaleFace.map = scaleTex(gr); scaleFace.needsUpdate = true; lastGrams = Math.round(gr); }
      const bo = c.bowl ?? 1, nB = bowlScraps.children.length; bowlScraps.children.forEach((m, i) => { const k = cl(bo * nB - i); m.visible = k > 0.02; m.scale.setScalar(Math.max(0.02, k)); }); bowl.visible = (c.bowlOn ?? 1) > 0;
      const rs = c.runScraps ?? 0, nR = runPile.children.length, eat = c.pileEat ?? 0; runPile.children.forEach((m, i) => { const p = cl((rs * (nR + 4) - i) / 4); const e = cl(eat * nR - (nR - 1 - i)); m.visible = p > 0 && e < 0.98; m.position.y = 0.02 + 0.85 * (1 - p * p); m.scale.setScalar(Math.max(0.02, 1 - e)); });
      const et = c.eggT ?? -1; egg.visible = et >= 0 && et <= 1; if (egg.visible) { const x0 = HT.NESTGROUND[0], z0 = HT.NESTGROUND[2], dx = c.eggDX ?? 0.45, dz = c.eggDZ ?? 0.3; egg.position.set(x0 + dx * et, SW + 0.045, z0 + dz * et); egg.rotation.set(0, Math.atan2(dx, dz), et * 9); }
      toy.visible = (c.toy ?? 0) > 0; toy.position.set(c.toyX ?? HT.NEST[0] + 0.2, SW + 0.02, c.toyZ ?? HT.NEST[2] + 1.1); toy.rotation.y = c.toyYaw ?? 0;
      panHook.visible = (c.panHung ?? 0) > 0; bucket.visible = (c.bucket ?? 0) > 0; bucket.children.forEach((m, i) => { if (i > 0) m.visible = i / bucket.children.length < (c.bucketFill ?? 1); });
      sideGate.rotation.y = -1.4 * sm(c.sideGate ?? 0);
      laundry.forEach((m, i) => { m.rotation.x = 0.18 * Math.sin(t * 1.7 + i * 0.9) + 0.06; m.rotation.y = 0.08 * Math.sin(t * 1.1 + i); });
      // --- the cart ---
      cart.visible = (c.cart ?? 0) > 0; cart.position.set(c.cartX ?? 0, SW, c.cartZ ?? -4.0); cart.rotation.y = c.cartYaw ?? 0;
    },
  };
};
