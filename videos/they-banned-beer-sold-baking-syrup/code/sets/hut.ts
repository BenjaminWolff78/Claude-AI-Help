// THE GUARD HUT at night ("Why He Wanted His Potatoes Stolen", scene 5 = the explanation, light `hutNight`).
// Local frame: floor y = 0. Plank hut, inside faces x -3..3, z -2.5 (back wall, the window) .. 2.5, walls 2.4 high
// under a gable (ridge along x at y 3.4) with exposed rafters + a tie beam.
//   * Left wall: two double bunks (A: z -2.4..-0.4, B: z 0.2..2.2, x -3..-2.1; mattress tops y 0.48 / 1.5, pillows at
//     the -z end of A and the +z end... see marks), striped ticking, wool blankets, ladders.
//   * Back wall: musket rack (4 muskets) left of the window; the WINDOW (x 0.35..1.45, sill y 1.0, top 1.9, open
//     shutters outside) looks OUT (-z) onto the moonlit potato field: soil ridges + plants from z -7 to -24, a dry-stone
//     wall at z -6.2 (top y 0.85), bushes, a torch on a post at the field gate (x -3.2, z -6.6), trees far away, a low
//     moon (x -2, y 6, z -60) + stars. Moonlight shaft through the window onto the floor.
//   * Table x 1.05..2.15, z -1.45..-0.75 (top 0.76) with the candle (ctl candle / smoke), playing cards, coins, a tin
//     mug; two stools; a drum (x 0.15, z 1.45) with dice + coins on its head (the soldiers' bets); coats + tricorns on
//     pegs (right wall), a water barrel, a sack, a broom, a lantern hook by the door. Door on the right wall (x 3,
//     z 0.4..1.4, h 2.05) opening inward (ctl door) onto the dark yard.
// ctl (pose c):
//   candle 0..1  candle lit (flame + glow + warm point light); 0 = out
//   smoke  0..1  age of the smoke curl after the candle is blown out: a thin grey curl rises ~0.6 m and fades by 1
//                (use 0 when the candle is lit)
//   door   0..1  hut door swings open inward (100 deg)
//   moon   0..1  moonlight strength through the window (default 1)
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { rng, stoneHD, grassHD, ctex } from "../paint";
import { NOINK } from "../ink";
import { glow, shaft, barrel, sack } from "../setkit";
import { boardsV, boardsH, beamStain, candle, flameFlick, motes, lamCustom, roundTree, leafTex, TAU } from "./innerkit_b";
import { puff, torch as postTorch, flickerTorch, sparkles, sparkle, stripeTex, cl, lerp, sm } from "./portkit_common";
import { seg, woodTex } from "./hotel";
import type { SetDef, SetBuilder, V3 } from "./types";

const X0 = -3, X1 = 3, Z0 = -2.5, Z1 = 2.5, WH = 2.4, RIDGE = 3.4;
const WIN = { x0: 0.35, x1: 1.45, y0: 1.0, y1: 1.9 };
const DOOR = { z0: 0.4, z1: 1.4, h: 2.05 };

export const hut: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch(), r = rng(1787);
  const wallM = lam("hutWall", () => ({ map: boardsV("hutWall", "#8a6a54", 0.35) }));
  const floorM = lam("hutFloor", () => ({ map: boardsH("hutFloor", "#6a4a3a", 0.4) }));
  const beamM = lam("hutBeam", () => ({ map: beamStain("hutBeam", "#5a3a2a", 0.45) }));
  const roofM = lam("hutRoofIn", () => ({ map: boardsH("hutRoof", "#5a4a5a", 0.45) }));
  const wood = lam("hutWood", () => ({ map: woodTex("hutwood", "#9a6a42", "#5a3a20", "#c89a6a") }));
  const iron = lam("hutIron", () => ({ color: "#4a4658" }));
  const brass = lam("hutBrass", () => ({ color: "#d4a64a" }));
  const ticking = lam("hutTicking", () => ({ map: stripeTex("#efe6d0", "#6a7ab0", 10) }));
  const wool = lam("hutWool", () => ({ color: "#7a6aa0" }));
  const wool2 = lam("hutWool2", () => ({ color: "#b8584a" }));
  const pillowM = lam("hutPillow", () => ({ color: "#f4eedf" }));
  const coatM = lam("hutCoat", () => ({ color: "#2f4f9a" })), coatTrim = lam("hutCoatTrim", () => ({ color: "#c83a3a" })), hatM = lam("hutHat", () => ({ color: "#2e2a3e" }));
  const flames: THREE.Object3D[] = [];

  // ---- shell ----
  b.add(quad(V(X0, 0, Z1), V(X1, 0, Z1), V(X1, 0, Z0), V(X0, 0, Z0), (X1 - X0) / 2, (Z1 - Z0) / 2), floorM);
  b.add(quad(V(X0, 0, Z1), V(X0, 0, Z0), V(X0, WH, Z0), V(X0, WH, Z1), (Z1 - Z0) / 2, WH / 2), wallM);
  b.add(quad(V(X1, 0, Z1), V(X0, 0, Z1), V(X0, WH, Z1), V(X1, WH, Z1), (X1 - X0) / 2, WH / 2), wallM);
  // gable triangles above the x walls (the ridge runs along x)
  for (const x of [X0, X1]) { const g = new THREE.BufferGeometry(); const n = x < 0 ? 1 : -1; const pts = [V(x, WH, x < 0 ? Z1 : Z0), V(x, WH, x < 0 ? Z0 : Z1), V(x, RIDGE, 0)];
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flatMap((p) => [p.x, p.y, p.z]), 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute([n, 0, 0, n, 0, 0, n, 0, 0], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2.5, 0, 1.25, 0.5], 2)); b.add(g, wallM); }
  // back wall with the window hole, right wall with the door hole (extruded planks)
  const zb0 = Z0 - 0.12;
  b.add(boxGeo(V(X0 - 0.12, 0, zb0), V(WIN.x0, WH, Z0), 2), wallM); b.add(boxGeo(V(WIN.x1, 0, zb0), V(X1 + 0.12, WH, Z0), 2), wallM);
  b.add(boxGeo(V(WIN.x0, 0, zb0), V(WIN.x1, WIN.y0, Z0), 2), wallM); b.add(boxGeo(V(WIN.x0, WIN.y1, zb0), V(WIN.x1, WH, Z0), 2), wallM);
  b.add(boxGeo(V(X1, 0, Z0 - 0.12), V(X1 + 0.12, WH, DOOR.z0), 2), wallM);
  b.add(boxGeo(V(X1, 0, DOOR.z1), V(X1 + 0.12, WH, Z1 + 0.12), 2), wallM);
  b.add(boxGeo(V(X1, DOOR.h, DOOR.z0), V(X1 + 0.12, WH, DOOR.z1), 2), wallM);
  for (const z of [DOOR.z0, DOOR.z1]) b.add(boxGeo(V(X1 - 0.06, 0, z - 0.06), V(X1 + 0.14, DOOR.h + 0.08, z + 0.06)), beamM);
  b.add(boxGeo(V(X1 - 0.06, DOOR.h, DOOR.z0 - 0.06), V(X1 + 0.14, DOOR.h + 0.12, DOOR.z1 + 0.06)), beamM);
  // roof (inner faces) + rafters + tie beams + wall plates + corner posts
  b.add(quad(V(X0, WH, Z0), V(X1, WH, Z0), V(X1, RIDGE, 0), V(X0, RIDGE, 0), 3, 1), roofM);
  b.add(quad(V(X1, WH, Z1), V(X0, WH, Z1), V(X0, RIDGE, 0), V(X1, RIDGE, 0), 3, 1), roofM);
  for (let x = X0 + 0.3; x <= X1 - 0.2; x += 0.9) { seg(b, V(x, WH, Z0 + 0.05), V(x, RIDGE - 0.05, 0), 0.06, beamM, 4); seg(b, V(x, WH, Z1 - 0.05), V(x, RIDGE - 0.05, 0), 0.06, beamM, 4); }
  for (const x of [X0 + 1.2, X1 - 1.2]) b.add(boxGeo(V(x - 0.08, WH - 0.1, Z0), V(x + 0.08, WH + 0.06, Z1)), beamM);
  b.add(boxGeo(V(X0, RIDGE - 0.16, -0.08), V(X1, RIDGE, 0.08)), beamM);
  for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) b.add(boxGeo(V(x - 0.1, 0, z - 0.1), V(x + 0.1, WH, z + 0.1)), beamM);
  for (const z of [Z0, Z1]) b.add(boxGeo(V(X0, WH - 0.14, z - 0.08), V(X1, WH, z + 0.08)), beamM);
  for (const x of [X0, X1]) b.add(boxGeo(V(x - 0.08, WH - 0.14, Z0), V(x + 0.08, WH, Z1)), beamM);

  // ---- window: frame, sill, mullions, open shutters, moon shaft ----
  const wz = Z0 - 0.06;
  b.add(boxGeo(V(WIN.x0 - 0.1, WIN.y0 - 0.1, wz - 0.14), V(WIN.x1 + 0.1, WIN.y0, wz + 0.14)), beamM);
  b.add(boxGeo(V(WIN.x0 - 0.1, WIN.y1, wz - 0.08), V(WIN.x1 + 0.1, WIN.y1 + 0.1, wz + 0.08)), beamM);
  for (const x of [WIN.x0, WIN.x1]) b.add(boxGeo(V(x - 0.06, WIN.y0, wz - 0.08), V(x + 0.06, WIN.y1, wz + 0.08)), beamM);
  for (const [x, a] of [[WIN.x0 - 0.1, -1], [WIN.x1 + 0.1, 1]] as [number, number][]) {
    const g = new THREE.Group(); g.position.set(x, WIN.y0, Z0 - 0.14); g.rotation.y = a * 1.9; root.add(g);
    const sb = new Batch(); sb.add(boxGeo(V(a < 0 ? -0.56 : 0, 0, -0.02), V(a < 0 ? 0 : 0.56, WIN.y1 - WIN.y0, 0.02)), wood); sb.build(g);
  }
  const moonShaft = shaft(root, [(WIN.x0 + WIN.x1) / 2, WIN.y1, Z0], [0.4, 0.02, -0.6], 1.0, "#9fb4ff", 0.16);
  const dust = motes(root, [WIN.x0 - 0.4, 0.2, Z0 + 0.1], [WIN.x1 + 0.4, WIN.y1, -0.5], 50, "#c8d4ff", 0.03, 0.55, 7);

  // ---- bunks ----
  const bunk = (z0: number, z1: number, pillowAtStart: boolean) => {
    const xa = X0 + 0.04, xb = X0 + 0.94;
    for (const x of [xa, xb]) for (const z of [z0, z1]) b.add(boxGeo(V(x - 0.045, 0, z - 0.045), V(x + 0.045, 1.95, z + 0.045)), wood);
    for (const y of [0.3, 1.32]) {
      for (const x of [xa, xb]) b.add(boxGeo(V(x - 0.04, y, z0), V(x + 0.04, y + 0.1, z1)), wood);
      for (const z of [z0, z1]) b.add(boxGeo(V(xa, y, z - 0.04), V(xb, y + 0.1, z + 0.04)), wood);
      b.add(boxGeo(V(xa + 0.04, y + 0.06, z0 + 0.04), V(xb - 0.04, y + 0.18, z1 - 0.04)), ticking);
      const pz = pillowAtStart ? z0 + 0.25 : z1 - 0.25;
      b.add(new THREE.SphereGeometry(0.2, 12, 8).scale(1.4, 0.45, 0.85).translate((xa + xb) / 2, y + 0.22, pz), pillowM);
      // rumpled blanket over the foot two thirds
      const bz0 = pillowAtStart ? z0 + 0.5 : z0 + 0.05, bz1 = pillowAtStart ? z1 - 0.05 : z1 - 0.5;
      const bl = new THREE.BoxGeometry(xb - xa, 0.06, bz1 - bz0, 6, 1, 10), p = bl.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + 0.03 * Math.sin(p.getZ(i) * 9 + p.getX(i) * 5));
      bl.computeVertexNormals(); bl.translate((xa + xb) / 2, y + 0.21, (bz0 + bz1) / 2); b.add(bl, y < 1 ? wool : wool2);
      b.add(boxGeo(V(xb - 0.02, y + 0.02, bz0), V(xb + 0.03, y + 0.2, bz1)), y < 1 ? wool : wool2);
    }
    // ladder on the open side
    const lz = pillowAtStart ? z1 - 0.35 : z0 + 0.35;
    for (const dz of [-0.17, 0.17]) b.add(boxGeo(V(xb + 0.06, 0, lz + dz - 0.025), V(xb + 0.11, 1.62, lz + dz + 0.025)), wood);
    for (let y = 0.4; y < 1.6; y += 0.32) b.add(boxGeo(V(xb + 0.06, y, lz - 0.17), V(xb + 0.11, y + 0.04, lz + 0.17)), wood);
  };
  bunk(-2.4, -0.4, true); bunk(0.2, 2.2, false);

  // ---- musket rack ----
  b.add(boxGeo(V(-1.75, 0.15, Z0), V(0.0, 0.25, Z0 + 0.3)), wood); b.add(boxGeo(V(-1.75, 1.45, Z0), V(0.0, 1.55, Z0 + 0.12)), wood);
  for (let i = 0; i < 4; i++) {
    const x = -1.55 + i * 0.42;
    b.add(boxGeo(V(x - 0.05, 0.25, Z0 + 0.12), V(x + 0.05, 0.85, Z0 + 0.22)), lam("hutStock", () => ({ color: "#7a4a2a" })));
    seg(b, V(x, 0.8, Z0 + 0.17), V(x, 1.75, Z0 + 0.12), 0.016, iron, 6);
    seg(b, V(x + 0.01, 1.75, Z0 + 0.12), V(x + 0.01, 2.08, Z0 + 0.11), 0.007, lam("hutSteel", () => ({ color: "#c8ccd8" })), 4);
    b.add(boxGeo(V(x - 0.02, 0.88, Z0 + 0.13), V(x + 0.02, 1.0, Z0 + 0.2)), brass);
  }
  // ---- table, candle, stools, drum with dice ----
  const TX = 1.6, TZ = -1.1, TY = 0.76;
  b.add(boxGeo(V(TX - 0.55, TY - 0.05, TZ - 0.35), V(TX + 0.55, TY, TZ + 0.35)), wood);
  for (const [dx, dz] of [[-0.48, -0.28], [0.48, -0.28], [-0.48, 0.28], [0.48, 0.28]]) b.add(boxGeo(V(TX + dx - 0.04, 0, TZ + dz - 0.04), V(TX + dx + 0.04, TY - 0.05, TZ + dz + 0.04)), wood);
  const cand = candle(root, [TX - 0.18, TY, TZ - 0.08], 1.6, 10, 7.5); flames.push(cand);
  const cardM = lam("hutCard", () => ({ color: "#fbf6ea" })), cardRed = lam("hutCardRed", () => ({ color: "#d84a3a" }));
  for (let i = 0; i < 6; i++) b.add(boxGeo(V(-0.045, 0, -0.065), V(0.045, 0.004, 0.065)).rotateY(i * 0.5).translate(TX + 0.2 + i * 0.045, TY + 0.002 + i * 0.002, TZ + 0.05), i % 2 ? cardRed : cardM);
  for (let i = 0; i < 7; i++) b.add(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 12).translate(TX + 0.05 + (i % 3) * 0.05, TY + 0.004 + Math.floor(i / 3) * 0.008, TZ + 0.2), brass);
  b.add(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 12, 1, true).translate(TX + 0.38, TY + 0.05, TZ - 0.16), iron);
  for (const [x, z] of [[TX - 0.2, TZ + 0.62], [TX + 0.75, TZ - 0.05]]) { b.add(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 14).translate(x, 0.46, z), wood); for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; seg(b, V(x + Math.cos(a) * 0.14, 0, z + Math.sin(a) * 0.14), V(x + Math.cos(a) * 0.1, 0.44, z + Math.sin(a) * 0.1), 0.025, wood, 5); } }
  { const x = 0.15, z = 1.45;
    b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 20, 1, true).translate(x, 0.25, z), lam("hutDrum", () => ({ color: "#2f4f9a", side: THREE.DoubleSide })));
    b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.01, 20).translate(x, 0.5, z), lam("hutSkin", () => ({ color: "#f0e2c4" })));
    for (const y of [0.03, 0.47]) b.add(new THREE.TorusGeometry(0.305, 0.025, 6, 24).rotateX(Math.PI / 2).translate(x, y, z), coatTrim);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, a2 = a + TAU / 16; seg(b, V(x + Math.cos(a) * 0.31, 0.05, z + Math.sin(a) * 0.31), V(x + Math.cos(a2) * 0.31, 0.45, z + Math.sin(a2) * 0.31), 0.006, lam("hutCord", () => ({ color: "#f2e8d0" })), 3); }
    const die = lam("hutDie", () => ({ color: "#fbf8f0" }));
    b.add(boxGeo(V(-0.03, 0, -0.03), V(0.03, 0.06, 0.03)).rotateY(0.4).translate(x - 0.06, 0.505, z + 0.02), die); b.add(boxGeo(V(-0.03, 0, -0.03), V(0.03, 0.06, 0.03)).rotateY(1.1).translate(x + 0.05, 0.505, z - 0.05), die);
    for (let i = 0; i < 6; i++) b.add(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 12).translate(x + 0.1 - (i % 2) * 0.2, 0.51 + Math.floor(i / 2) * 0.008, z + 0.12), brass);
    for (let k = 0; k < 2; k++) seg(b, V(x - 0.1 + k * 0.2, 0.5, z - 0.32), V(x - 0.3 + k * 0.6, 0.64, z - 0.46), 0.014, wood, 5); // drumsticks
  }
  // ---- coats + hats on pegs (right wall), lantern hook by the door, barrel, sack, broom ----
  for (const [z, hat] of [[-1.9, true], [-1.35, false], [-0.8, true]] as [number, boolean][]) {
    seg(b, V(X1, 1.85, z), V(X1 - 0.14, 1.88, z), 0.018, wood, 5);
    b.add(new THREE.CylinderGeometry(0.18, 0.28, 0.95, 10, 1, true).translate(X1 - 0.16, 1.38, z), lam("hutCoatD", () => ({ color: "#2f4f9a", side: THREE.DoubleSide })));
    b.add(boxGeo(V(X1 - 0.19, 0.93, z - 0.29), V(X1 - 0.15, 1.0, z + 0.29)), coatTrim);
    for (let k = 0; k < 4; k++) b.add(new THREE.SphereGeometry(0.018, 6, 4).translate(X1 - 0.38, 1.7 - k * 0.15, z + 0.03), brass);
    if (hat) { b.add(new THREE.ConeGeometry(0.26, 0.12, 3).rotateY(Math.PI / 6).translate(X1 - 0.2, 2.0, z), hatM); }
  }
  void coatM;
  seg(b, V(X1, 1.95, 0.05), V(X1 - 0.22, 1.95, 0.05), 0.014, iron, 5); seg(b, V(X1 - 0.22, 1.95, 0.05), V(X1 - 0.22, 1.85, 0.05), 0.012, iron, 5);
  barrel(root, [2.45, 0, 2.05], 0.42); sack(root, [2.55, 0, -2.05], 0.38);
  seg(b, V(-0.35, 0, Z1 - 0.12), V(-0.15, 1.5, Z1 - 0.06), 0.02, wood, 5); b.add(new THREE.ConeGeometry(0.14, 0.35, 8).translate(-0.38, 0.17, Z1 - 0.12), lam("hutStraw", () => ({ color: "#d8b45a" })));
  // ---- door ----
  const door = new THREE.Group(); door.position.set(X1 - 0.02, 0, DOOR.z1); root.add(door);
  { const db = new Batch(); db.add(boxGeo(V(-0.05, 0, -(DOOR.z1 - DOOR.z0)), V(0.0, DOOR.h, 0)), wood);
    for (const y of [0.3, 1.0, 1.75]) db.add(boxGeo(V(-0.09, y, -(DOOR.z1 - DOOR.z0) + 0.06), V(-0.05, y + 0.1, -0.06)), beamM);
    seg(db, V(-0.07, 0.4, -0.08), V(-0.07, 1.75, -(DOOR.z1 - DOOR.z0) + 0.1), 0.02, beamM, 4);
    db.add(new THREE.TorusGeometry(0.05, 0.012, 6, 12).rotateY(Math.PI / 2).translate(-0.11, 1.0, -(DOOR.z1 - DOOR.z0) + 0.12), iron); db.build(door); }

  // ---- OUTSIDE: yard, the potato field, dry-stone wall, bushes, torch post, trees, moon, stars ----
  const groundM = lam("hutGround", () => ({ map: grassHD(), color: "#46566e" }));
  b.add(quad(V(-40, -0.01, 30), V(40, -0.01, 30), V(40, -0.01, -60), V(-40, -0.01, -60), 16, 18), groundM);
  const soil = lam("hutSoil", () => ({ color: "#7a5a44" })), leaf = lam("hutPotLeaf", () => ({ color: "#4f8a3e" })), leaf2 = lam("hutPotLeaf2", () => ({ color: "#3f7636" })), flower = lam("hutPotFlower", () => ({ color: "#ecdcf6" })), flower2 = lam("hutPotFlower2", () => ({ color: "#b48ae0" }));
  for (let z = -7.0; z > -24; z -= 0.9) {
    b.add(new THREE.CylinderGeometry(0.22, 0.32, 26, 6, 1).rotateZ(Math.PI / 2).scale(1, 0.55, 1).translate(1, 0.05, z), soil);
    for (let x = -11.5; x < 13.5; x += 0.7 + r() * 0.25) {
      const s = 0.85 + r() * 0.4, y = 0.15;
      b.add(new THREE.IcosahedronGeometry(0.2 * s, 0).scale(1.2, 0.8, 1).translate(x, y + 0.12 * s, z), r() < 0.5 ? leaf : leaf2);
      b.add(new THREE.IcosahedronGeometry(0.15 * s, 0).translate(x + 0.14 * s, y + 0.2 * s, z + 0.05), r() < 0.5 ? leaf2 : leaf);
      if (r() < 0.6) b.add(new THREE.IcosahedronGeometry(0.04, 0).translate(x + (r() - 0.5) * 0.2, y + 0.33 * s, z + (r() - 0.5) * 0.15), r() < 0.6 ? flower : flower2);
    }
  }
  const stoneM = lam("hutStone", () => ({ map: stoneHD("hutStoneHD", ["#b8b0a6", "#a8a09a", "#c4bcb0", "#9c948c"]) }));
  for (let x = -12; x < 14; x += 0.42) for (let c = 0; c < 3; c++) {
    const w = 0.34 + r() * 0.16, h = 0.24 + r() * 0.08, y = c * 0.27 + 0.02;
    b.add(new THREE.DodecahedronGeometry(0.5, 0).scale(w, h, 0.36 + r() * 0.1).rotateY((r() - 0.5) * 0.4).translate(x + (c % 2) * 0.21 + (r() - 0.5) * 0.06, y + h / 2, -6.2 + (r() - 0.5) * 0.08), stoneM);
  }
  const bushM = lam("hutBush", () => ({ map: leafTex("hutBush", "#3f7a3a", "#5a9a4a", "#2a5a30"), color: "#8a9ab0" })), barkM = lam("hutBark", () => ({ color: "#4a3a3a" }));
  for (const [x, z, s] of [[-4.2, -5.7, 0.9], [3.6, -5.5, 0.75], [6.8, -5.8, 1.0], [-1.6, -5.4, 0.55]] as [number, number, number][]) for (let k = 0; k < 4; k++) b.add(new THREE.IcosahedronGeometry(0.5 * s, 1).translate(x + (k - 1.5) * 0.35 * s, 0.4 * s + (k % 2) * 0.2 * s, z), bushM);
  for (let i = 0; i < 16; i++) roundTree(b, -30 + i * 4 + r() * 2, -38 - r() * 10, 5 + r() * 4, i, bushM, barkM);
  const tc = postTorch(root, [-3.2, 0, -6.6], 2.0, true, 6, 10);
  b.add(boxGeo(V(-3.25, 0, -6.65), V(-3.15, 2.0, -6.55)), beamM);
  const moonM = new THREE.SpriteMaterial({ map: glowTexMoon(), color: new THREE.Color(1.6, 1.6, 1.7), transparent: true, depthWrite: false, fog: false });
  const moon = new THREE.Sprite(moonM); moon.scale.set(4.2, 4.2, 1); moon.position.set(-2, 6.2, -60); moon.layers.set(NOINK); root.add(moon);
  const moonHalo = glow(root, [-2, 6.2, -59.5], "#a8b8ff", 16, 0.5);
  const stars = sparkles(root, 40, [0, 4, -70], 60, 14, 4, 5, 0.5);
  const moonL = new THREE.DirectionalLight("#9fb2ff", 0.6); moonL.position.set(-2, 6, -20); moonL.target.position.set(0.8, 0, 0); root.add(moonL); root.add(moonL.target);

  b.build(root);
  void puff; void lamCustom; void sm; void lerp;

  // smoke curl after blowing out the candle
  const smokeM = new THREE.MeshBasicMaterial({ map: smokeTex(), color: "#c8c8d8", transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const smoke = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.6), smokeM); smoke.layers.set(NOINK); smoke.position.set(TX - 0.18, TY + 0.6, TZ - 0.08); root.add(smoke);

  const marks: Record<string, V3> = {
    bunk1: [-2.56, 0.48, -2.1], bunk1Foot: [-2.56, 0.48, -0.6], bunk2: [-2.56, 1.5, -2.1], bunk2Foot: [-2.56, 1.5, -0.6],
    bunk3: [-2.56, 0.48, 1.95], bunk3Foot: [-2.56, 0.48, 0.4], bunk4: [-2.56, 1.5, 1.95], bunk4Foot: [-2.56, 1.5, 0.4],
    heroTable: [1.0, 0, -0.55], heroDoor: [2.35, 0, 0.9], candle: [TX - 0.18, TY, TZ - 0.08],
    thiefA: [0.55, 0, -5.7], thiefB: [1.55, 0, -5.75], patrolA: [-2.6, 0, -8.6], patrolB: [4.6, 0, -8.6],
    window: [(WIN.x0 + WIN.x1) / 2, WIN.y0, Z0],
  };
  const cams: SetDef["cams"] = {
    window: { pos: [0.9, 1.5, 0.7], look: [0.9, 1.12, -7], fov: 40 },
    bunks: { pos: [2.7, 1.85, 2.35], look: [-2.5, 0.95, -0.9], fov: 52 },
    bunkA: { pos: [0.9, 1.45, -1.4], look: [-2.55, 1.0, -1.4], fov: 42 },
    bunkB: { pos: [0.9, 1.45, 1.2], look: [-2.55, 1.0, 1.2], fov: 42 },
    door: { pos: [-1.2, 1.6, -1.6], look: [3, 1.15, 1.0], fov: 42 },
    table: { pos: [0.1, 1.45, 1.2], look: [1.5, 1.0, -1.1], fov: 40 },
  };
  return {
    name: "hut", root, marks, cams,
    pose: (t, c) => {
      const cn = cl(c.candle ?? 1), sk = cl(c.smoke ?? 0), dr = sm(cl(c.door ?? 0)), mo = cl(c.moon ?? 1);
      flameFlick(cand, t); const u = cand.userData; u.light.intensity *= cn; (u.glow.material as THREE.SpriteMaterial).opacity *= cn; if (u.flame) (u.flame as THREE.Sprite).visible = cn > 0.02;
      if (u.flame) (u.flame as THREE.Sprite).scale.multiplyScalar(Math.max(0.001, cn));
      smokeM.opacity = sk > 0 && sk < 1 ? 0.55 * Math.sin(Math.PI * sk) : 0; smoke.position.y = TY + 0.4 + 0.5 * sk; smoke.scale.set(1 + sk, 1 + 0.6 * sk, 1); smoke.rotation.y = t * 0.6;
      door.rotation.y = dr * 1.75;
      flickerTorch(tc, t); for (const f of flames) if (f !== cand) flameFlick(f, t);
      (moonShaft.material as THREE.MeshBasicMaterial).opacity = (0.13 + 0.02 * Math.sin(t * 0.5)) * mo; moonL.intensity = 0.6 * mo;
      dust.update(t); sparkle(stars, t * 0.3, 0.7); void moonHalo;
    },
  };
};

// small painted textures local to the hut
function glowTexMoon() {
  return ctex("hutMoon", 256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.36, "rgba(250,248,235,1)"); gr.addColorStop(0.4, "rgba(220,226,255,0.35)"); gr.addColorStop(1, "rgba(200,210,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "rgba(200,196,200,0.35)"; for (const [x, y, rr] of [[110, 112, 14], [146, 140, 10], [124, 150, 8]]) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  });
}
function smokeTex() {
  return ctex("hutSmoke", 64, 256, (g) => {
    g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(32, 250);
    for (let y = 250; y > 10; y -= 8) g.lineTo(32 + Math.sin(y * 0.05) * 14 * (1 - y / 260), y); g.stroke();
    g.globalCompositeOperation = "destination-in"; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  });
}
