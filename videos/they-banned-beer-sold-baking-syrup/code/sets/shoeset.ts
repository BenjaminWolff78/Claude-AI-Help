// "The Thieves Who Stole 200 Shoes Nobody Can Wear" (2026-11-23, master prompt v27). ORIGINAL set from REAL CC0 Poly
// Haven assets (photo textures on every surface, real models for the props, HDRI bounce) + code-modelled sneakers.
// Local metres, y up. An Andean town street at the foot of brown hills.
//  H  THE SHOE SHOP "PASO FIRME" (home base) at the origin: the street runs along x (road z -10..-3.4, pavement
//     z -3.2..0 at y 0.15). Shop front wall z 0..0.25 (x -4.2..4.2) with the roll-up shutter x -2..2. Sales floor
//     x -3.95..3.95, z 0.25..5.0; the DISPLAY WALL (partition) z 5.0 with 6 rows of single sneakers, the left wall
//     (x -3.95) with 6 more rows; counter on the right (x 2.6..3.5); the security camera high in the front-left corner.
//     The BACK ROOM z 5.12..8.6 behind the display wall: steel shelves of shoe boxes (all the left shoes).
//     The bakery next door (x 4.2..10.5) is the neighbour's.
//  G  THE GARAGE HIDEOUT at x 55..65, z 0..9: roll-up door at z 0 (x 57.5..62.5), window in the west wall (x 55),
//     side door in the east wall (x 65, z 6..6.9), a bare bulb, the covered car, the workbench, the loot.
//  I  THE INSERT at x -60: a car door's inside panel with a door pocket and one lonely glove.
import * as THREE from "three";
import { ctex } from "../paint";
import { glow, shaft } from "../setkit";
import { fitText } from "./portkit_common";
import { phModel, phMat, boxM, planeM, type PhModel, type PhTex } from "../ph";
import { MB, TAU, cl, sm, lerp, hsh, SERIF, mat, col, glass, cylM, terrain, terrainMat } from "./mailkit";
import { ShoeField, SHOE, SHOE_COLS, BOX, lootBox, tricycle, shutter, clockTex, glove, shopSign } from "./shoekit";
import type { SetDef, V3, Ctl } from "./types";

const FL = 0.15;
export const GX = 100, IX = 14;
export const SH0 = {
  FL,
  // the shop
  SHUT_W: 4.0, SHUT_H: 2.6, LOCK: [1.9, FL + 1.0, -0.14] as V3, WALLZ: 5.0, CEIL: 3.4,
  ROWS: [0.45, 0.8, 1.15, 1.5, 1.85, 2.2].map((y) => FL + y),
  COLS: Array.from({ length: 15 }, (_, i) => -3.3 + i * 0.39),          // partition columns (x)
  LCOLS: Array.from({ length: 9 }, (_, i) => 0.95 + i * 0.42),          // left-wall columns (z)
  COUNTER: [3.05, FL, 2.4] as V3, REGISTER: [3.05, FL + 1.02, 1.9] as V3, SECCAM: [3.5, 3.0, 0.75] as V3,
  OWNER_WALL: [0.2, FL, 3.3] as V3, OWNER_CTR: [2.15, FL, 2.3] as V3, DOORWAY: [0.0, FL, 0.9] as V3, NB_DOOR: [-1.2, FL, 0.6] as V3,
  BOX_SPOTS: [[-3.25, FL, 4.45], [-1.55, FL, 4.35], [0.25, FL, 4.4]] as V3[],
  // street
  LAMP: [-3.4, FL, -2.75] as V3, CLOCK: [3.25, FL, -2.85] as V3, TRIKE_PARK: [-0.4, 0, -1.5] as V3, BAKERY_DOOR: [6.0, FL, -0.4] as V3,
  // back room
  BACK_OWNER: [0.4, FL, 7.0] as V3, BACK_SHELF_Z: 8.3,
  // garage
  G_DOOR: [GX, 0.05, 0] as V3, G_BENCH: [GX - 4.45, 0.05, 3.6] as V3, G_BULB: [GX + 0.3, 2.85, 4.2] as V3, G_SIDE: [GX + 5, 0.05, 6.45] as V3,
  G_LOOT: [[GX - 1.5, 0.05, 5.4], [GX - 0.6, 0.05, 6.0], [GX + 0.5, 0.05, 5.5]] as V3[], G_TABLE: [GX + 1.9, 0.05, 3.2] as V3,
  G_SEATS: [[GX - 1.6, 0.05, 3.75], [GX - 0.9, 0.05, 3.05], [GX - 0.2, 0.05, 3.7]] as V3[],
  // insert
  I_DOOR: [IX, 0.25, -5.0] as V3,
};

// ---------------- painted faces: signs, posters, labels (canvas only for these, v26 6.4d) ----------------
const posterTex = (k: number) => ctex("shPoster" + k, 512, 768, (g, r) => {
  const bg = ["#e8622c", "#2a5a9a", "#2f8a5a"][k % 3]; g.fillStyle = bg; g.fillRect(0, 0, 512, 768);
  g.fillStyle = "rgba(255,255,255,0.14)"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(256, 330, 60 + i * 42, 0, TAU); g.lineWidth = 10; g.strokeStyle = "rgba(255,255,255,0.1)"; g.stroke(); }
  // a sneaker silhouette (side view, toe left)
  g.save(); g.translate(256, 360); g.scale(1.25, 1.25); g.fillStyle = "#f4f2ec";
  g.beginPath(); g.moveTo(-150, 40); g.quadraticCurveTo(-160, 0, -110, -10); g.lineTo(-30, -30); g.quadraticCurveTo(20, -90, 90, -95); g.lineTo(130, -90); g.quadraticCurveTo(150, -40, 150, 40); g.closePath(); g.fill();
  g.fillStyle = "#1e1c22"; g.fillRect(-152, 36, 304, 16); g.fillStyle = bg; g.beginPath(); g.moveTo(-40, 10); g.lineTo(120, -50); g.lineTo(125, -30); g.lineTo(-30, 25); g.closePath(); g.fill(); g.restore();
  g.fillStyle = "#f4f2ec"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, ["NEW SEASON", "RUN FREE", "50% OFF"][k % 3], 256, 120, 440, 74, "900 %spx Arial");
  fitText(g, ["SNEAKERS", "TRAINERS", "ALL WEEK"][k % 3], 256, 620, 440, 64, "900 %spx Arial");
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.04})`; g.fillRect(r() * 512, r() * 768, 2 + r() * 20, 1 + r() * 3); }
});
const cheapSign = () => ctex("shCheap", 512, 300, (g, r) => {
  g.fillStyle = "#c8a070"; g.fillRect(0, 0, 512, 300); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(80,50,20,${r() * 0.08})`; g.fillRect(r() * 512, r() * 300, 3 + r() * 40, 1 + r() * 3); }
  g.fillStyle = "#1a1a22"; g.textAlign = "center"; g.textBaseline = "middle"; g.save(); g.rotate(-0.03);
  fitText(g, "CHEAP", 256, 100, 440, 110, "900 %spx 'Comic Sans MS', Arial"); fitText(g, "SNEAKERS!", 256, 210, 460, 96, "900 %spx 'Comic Sans MS', Arial"); g.restore();
});
const plateTex = () => ctex("shPlate", 512, 128, (g) => { g.fillStyle = "#f2f0e8"; g.fillRect(0, 0, 512, 128); g.strokeStyle = "#1a1a22"; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116); g.fillStyle = "#1a1a22"; g.font = "900 78px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ABX-492", 256, 70); });

// ---------------- a row-house facade (plaster storeys, windows, exposed brick + rebar on top) ----------------
type Facade = { x0: number; x1: number; z: number; facing: 1 | -1; storeys: number; tex: PhTex; tint: string; seed: number; shopH?: number; brickTop?: boolean };
const facades = (mb: MB, root: THREE.Object3D, list: Facade[], lit: THREE.Mesh[]) => {
  const winDark = new THREE.MeshStandardMaterial({ color: "#1e2a44", roughness: 0.15, metalness: 0.2, envMapIntensity: 1.6 });
  const winLit = new THREE.MeshBasicMaterial({ color: "#ffc070" }); winLit.color.multiplyScalar(1.1);
  const frame = col("#d8d4c8", 0.6), rebar = col("#5a3a2a", 0.6, 0.6), conc = mat("concrete_wall_008", 1.6, "#c8c0b4");
  for (const f of list) {
    const H = f.storeys * 2.9 + 0.4, d = 0.3, zc = f.z - (f.facing * d) / 2, cx = (f.x0 + f.x1) / 2, w = f.x1 - f.x0;
    mb.box(w, H, d, mat(f.tex, 2.0, f.tint, { rough: 0.95, env: 0.6 }), [cx, H / 2, zc]);
    // storey bands + parapet
    for (let s = 1; s <= f.storeys; s++) mb.box(w + 0.06, 0.14, d + 0.08, conc, [cx, s * 2.9, zc]);
    if (f.brickTop) { mb.box(w * 0.7, 2.2, d * 0.9, mat("red_brick_03", 1.4, "#e0a888", { rough: 1, env: 0.5 }), [cx - w * 0.12, H + 1.1, zc]);
      for (let i = 0; i < 5; i++) mb.add(cylM(0.012, 0.012, 1.0, 5), rebar, [f.x0 + 0.4 + i * (w - 0.8) / 4, H + 2.2 + 0.5, zc], [hsh(i, f.seed) * 0.2, 0, (hsh(i, f.seed + 3) - 0.5) * 0.3]); }
    else mb.box(w + 0.08, 0.5, d + 0.12, conc, [cx, H + 0.25, zc]);
    // windows on the upper storeys (2 per 4 m)
    const nw = Math.max(1, Math.round(w / 2.4));
    for (let s = 1; s < f.storeys; s++) for (let i = 0; i < nw; i++) {
      const x = f.x0 + (w * (i + 0.5)) / nw, y = s * 2.9 + 1.45, ww = 1.1, wh = 1.3;
      const on = hsh(i * 7 + s, f.seed) < 0.22;
      const g = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), on ? winLit : winDark); g.position.set(x, y, f.z + f.facing * 0.012); g.rotation.y = f.facing > 0 ? 0 : Math.PI; root.add(g); if (on) lit.push(g);
      for (const [a, b, c2, dx, dy] of [[ww + 0.16, 0.08, 0.1, 0, wh / 2 + 0.04], [ww + 0.24, 0.1, 0.18, 0, -wh / 2 - 0.05], [0.08, wh, 0.1, -ww / 2 - 0.04, 0], [0.08, wh, 0.1, ww / 2 + 0.04, 0], [0.04, wh, 0.06, 0, 0]] as number[][])
        mb.box(a, b, c2, frame, [x + dx, y + dy, f.z + f.facing * 0.04]);
      if (hsh(i + s * 3, f.seed + 9) < 0.35) { // a small balcony with a rail
        mb.box(ww + 0.6, 0.1, 0.6, conc, [x, y - wh / 2 - 0.16, f.z + f.facing * 0.3]);
        for (let k = 0; k < 7; k++) mb.box(0.025, 0.8, 0.025, rebar, [x - (ww + 0.5) / 2 + k * (ww + 0.5) / 6, y - wh / 2 + 0.25, f.z + f.facing * 0.58]);
        mb.box(ww + 0.55, 0.04, 0.04, rebar, [x, y - wh / 2 + 0.66, f.z + f.facing * 0.58]); }
    }
    // ground storey: a closed shop shutter or a door + window
    if (f.shopH !== undefined) {
      const sw = Math.min(3.2, w - 1.2), sx = cx + (hsh(1, f.seed) - 0.5) * (w - sw - 1);
      mb.box(sw, 2.5, 0.05, phMat("painted_metal_shutter", 1 / 1.2, 1 / 1.2, { tint: ["#9aa4b0", "#a8988a", "#8aa0a0"][f.seed % 3], rough: 0.55, metal: 0.4, env: 1.0, key: "shutF" + (f.seed % 3) }), [sx, FL + 1.25, f.z + f.facing * 0.03]);
      mb.box(sw + 0.3, 0.35, 0.3, phMat("painted_metal_shutter", 1 / 1.2, 1 / 1.2, { tint: "#8a9098", rough: 0.55, metal: 0.4, env: 1.0, key: "shutDrum" }), [sx, FL + 2.68, f.z + f.facing * 0.16]);
    }
  }
};

// ---------------- the shop's display ledges + the walls of sneakers ----------------
/** colour index (SHOE_COLS / SNK_COLS) of the partition shoe in row r, column c (same hash as the set) */
/** the garage floor pile of RIGHT shoes (all toes the same way): position, yaw, roll of shoe i */
export const pileAt = (i: number): { p: V3; yaw: number; roll: number } => { const N = 34, r = Math.sqrt(i / N) * 0.75, a = i * 2.39996, base = SH0.G_LOOT[1];
  return { p: [base[0] + 0.15 + Math.cos(a) * r * 1.2, 0.05 + Math.max(0, 0.32 - r * 0.38) * (i % 3) * 0.5, base[2] - 1.0 + Math.sin(a) * r * 0.7], yaw: Math.PI + (hsh(i, 2) - 0.5) * 0.25, roll: (hsh(i, 3) - 0.5) * 0.3 }; };
export const LEFT_ORDER = (n: number) => { const c = Math.floor(n / 6), r = n % 6; return { r, c }; };
export const wallColIdx = (r: number, c: number) => Math.floor(hsh(r * 15 + c, 5) * 12);
type WallShoe = { p: V3; yaw: number; row: number; i: number; wall: "P" | "L"; chunk: number };

export const shoeset = (): SetDef => {
  const root = new THREE.Group(); root.name = "shoeset";
  const mb = new MB();
  const add = (o: THREE.Object3D, p: V3, yaw = 0) => { o.position.set(...p); o.rotation.y = yaw; root.add(o); return o; };
  const ph = (n: PhModel, p: V3, yaw = 0, o: { h?: number; s?: number; filt?: string; env?: number } = {}) => add(phModel(n, { center: true, ...o }), p, yaw);
  const litWins: THREE.Mesh[] = [];

  // ===================== THE STREET =====================
  { const road = new THREE.Mesh(planeM(140, 6.6, 40, 2), mat("asphalt_02", 3.0, "#b8b4b0", { rough: 0.95, env: 0.6 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -6.7); road.receiveShadow = true; root.add(road);
    // painted centre dashes, worn
    for (let x = -60; x < 60; x += 4) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.12), col("#e8e0c8", 0.8)); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.004, -6.7); d.receiveShadow = true; root.add(d); }
    for (const [z0, z1] of [[-3.2, 0], [-13.2, -10.2]]) {
      mb.span([-70, 0, z0], [70, FL, z1], mat("concrete_pavement", 1.6, "#d4ccc0", { rough: 1, env: 0.6 }));
      const kz = z0 > -5 ? z0 - 0.2 : z1; mb.span([-70, 0, kz], [70, FL + 0.005, kz + 0.2], mat("cracked_concrete", 1.0, "#c8c0b4", { rough: 1, env: 0.6 }));
    }
    // the far side of the street (facing +z) and this side's neighbours (facing -z)
    const far: Facade[] = [];
    let x = -46; const tints = ["#e8c890", "#a8c4d8", "#e8a8a0", "#d8d0b8", "#b8d0a8", "#e8b870"], texs: PhTex[] = ["yellow_plaster", "blue_plaster_weathered", "painted_plaster_wall", "worn_plaster_wall"];
    for (let i = 0; x < 46; i++) { const w = 5 + hsh(i, 2) * 4; far.push({ x0: x, x1: x + w, z: -13.2, facing: 1, storeys: 2 + Math.floor(hsh(i, 4) * 2.2), tex: texs[i % 4], tint: tints[i % 6], seed: 10 + i, shopH: 1, brickTop: hsh(i, 6) < 0.45 }); x += w; }
    const near: Facade[] = [
      { x0: -46, x1: -31, z: 0, facing: -1, storeys: 2, tex: "worn_plaster_wall", tint: "#d8c8a8", seed: 71, shopH: 1, brickTop: true },
      { x0: -31, x1: -17.5, z: 0, facing: -1, storeys: 3, tex: "painted_plaster_wall", tint: "#b8cce0", seed: 72, shopH: 1 },
      { x0: -17.5, x1: -10.5, z: 0, facing: -1, storeys: 2, tex: "yellow_plaster", tint: "#e8d0a0", seed: 73, shopH: 1, brickTop: true },
      { x0: -10.5, x1: -4.2, z: 0, facing: -1, storeys: 2, tex: "blue_plaster_weathered", tint: "#c4d4dc", seed: 74, shopH: 1 },
      { x0: 10.5, x1: 22, z: 0, facing: -1, storeys: 3, tex: "painted_plaster_wall", tint: "#e8b8a8", seed: 75, shopH: 1 },
      { x0: 22, x1: 46, z: 0, facing: -1, storeys: 2, tex: "worn_plaster_wall", tint: "#d0c4b0", seed: 76, shopH: 1, brickTop: true },
    ];
    facades(mb, root, [...far, ...near], litWins);
    // the hills behind both rows (dry Andean slopes)
    const hf = (x: number, z: number) => { const d = Math.max(0, Math.abs(z) - (z > 0 ? 70 : 60)); return d * 0.42 + Math.sin(x * 0.03 + (z > 0 ? 1 : 3)) * Math.min(d, 60) * 0.35 + Math.abs(Math.sin(x * 0.11 + z * 0.05)) * Math.min(d, 40) * 0.12 + Math.max(0, d - 120) * 0.5 - 0.5; };
    const tm = terrainMat();
    terrain(root, -420, 420, 60, 420, 70, 30, hf, tm); terrain(root, -420, 420, -420, -60, 70, 30, hf, tm);
    { const back = new THREE.Mesh(planeM(140, 60), mat("brown_mud_dry", 4, "#b8a084")); back.rotation.x = -Math.PI / 2; back.position.set(0, -0.02, 33); back.receiveShadow = true; root.add(back);
      const back2 = back.clone(); back2.position.set(0, -0.02, -42); root.add(back2); }
    // electricity poles + sagging wires along this pavement
    const poles: V3[] = [];
    for (const px of [-22, -9.5, 9.0, 21.5]) { ph("modular_electricity_poles", [px, FL, -2.95], 0, { filt: "^preset_02_", h: 7.2 }); poles.push([px, FL + 6.9, -2.95]); }
    const wireM = col("#1e1c22", 0.6);
    for (let i = 0; i < poles.length - 1; i++) for (const dz of [-0.25, 0.25]) {
      const a = poles[i], b = poles[i + 1], pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 16; k++) { const u = k / 16; pts.push(new THREE.Vector3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - 0.6 * Math.sin(Math.PI * u) - 0.15 + (dz > 0 ? 0.25 : 0), a[2] + dz)); }
      const w = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 4), wireM); root.add(w);
    }
  }
  // street lamp (warm sodium) + the clock post
  const lampHead: V3 = [SH0.LAMP[0], FL + 4.15, SH0.LAMP[2]];
  ph("street_lamp_01", SH0.LAMP, 0, { h: 4.4 });
  const lampL = new THREE.SpotLight("#ffaa60", 60, 22, 0.95, 0.6, 1.6); lampL.position.set(...lampHead); lampL.target.position.set(SH0.LAMP[0] + 1.5, 0, SH0.LAMP[2] + 1.4); root.add(lampL, lampL.target);
  const lampGlow = glow(root, lampHead, "#ffb070", 1.6, 1.2);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), new THREE.MeshStandardMaterial({ map: clockTex(3, 0), roughness: 0.5, emissive: "#ffe8c0", emissiveIntensity: 0.0 }));
  { const cm = col("#2a3a34", 0.4, 0.6, 1.2), p = SH0.CLOCK;
    mb.add(cylM(0.06, 0.08, 3.2, 14), cm, [p[0], FL + 1.6, p[2]]); mb.add(cylM(0.12, 0.12, 0.2, 14), cm, [p[0], FL + 0.1, p[2]]);
    mb.add(cylM(0.4, 0.4, 0.16, 32), cm, [p[0], FL + 3.55, p[2]], [Math.PI / 2, 0, 0]);
    clockFace.position.set(p[0], FL + 3.55, p[2] - 0.085); clockFace.rotation.y = Math.PI; root.add(clockFace);
    const back = clockFace.clone(); back.position.z = p[2] + 0.085; back.rotation.y = 0; root.add(back); }
  ph("trashbag", [-2.6, FL, -0.5], 0.4); ph("trashbag", [-2.25, FL, -0.35], 2.1, { h: 0.5 }); ph("metal_trash_can", [4.6, FL, -0.45], 0.2, { filt: "^metal_trash_can_rust" });
  ph("utility_box_01", [-4.5, FL, -0.25], Math.PI); ph("potted_plant_04", [-2.75, FL, -0.3], 0, { h: 0.6 }); ph("planter_pot_clay", [-2.15, FL, -0.2], 0, { h: 0.35 });

  // ===================== THE SHOE SHOP (H) =====================
  const IX0 = -3.95, IX1 = 3.95, IZ0 = 0.25, WZ = SH0.WALLZ, BZ1 = 8.6, CE = SH0.CEIL, OW = 2.0, OH = SH0.SHUT_H;
  { // front wall with the opening, fascia, upper storey
    const wallM = mat("yellow_plaster", 2.0, "#f0d49a", { rough: 0.95, env: 0.6 }), inM = mat("painted_plaster_wall", 2.0, "#62a494", { rough: 0.95, env: 0.5 });
    mb.span([-4.2, 0, 0], [-OW, 6.2, 0.25], wallM); mb.span([OW, 0, 0], [4.2, 6.2, 0.25], wallM); mb.span([-OW, FL + OH, 0], [OW, 6.2, 0.25], wallM);
    mb.span([-4.2, 6.2, -0.05], [4.2, 6.7, 0.3], mat("concrete_wall_008", 1.6, "#c8c0b4"));
    mb.span([-4.2, 2.86, -0.06], [4.2, 3.0, 0.0], mat("concrete_wall_008", 1.6, "#c8c0b4"));
    for (let i = 0; i < 3; i++) { const x = -2.6 + i * 2.6, y = 4.6; const g = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshStandardMaterial({ color: "#1e2a44", roughness: 0.15, metalness: 0.2, envMapIntensity: 1.6 })); g.position.set(x, y, -0.012); g.rotation.y = Math.PI; root.add(g);
      for (const [a, b, dx, dy] of [[1.26, 0.08, 0, 0.69], [1.34, 0.1, 0, -0.7], [0.08, 1.3, -0.59, 0], [0.08, 1.3, 0.59, 0]] as number[][]) mb.box(a, b, 0.1, col("#d8d4c8", 0.6), [x + dx, y + dy, -0.04]); }
    // the shop sign over the shutter (lit from below at night by the lamp)
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.75), new THREE.MeshStandardMaterial({ map: shopSign("paso", "PASO FIRME", "ZAPATILLAS · SNEAKERS", "#1f3a5a", "#f4d27a"), roughness: 0.7 }));
    sg.position.set(0, 3.42, -0.09); sg.rotation.y = Math.PI; sg.receiveShadow = true; root.add(sg);
    mb.box(3.92, 0.86, 0.06, col("#e8d8b0", 0.5, 0.3), [0, 3.42, -0.05]);
    // inside: floor, walls, ceiling
    mb.span([IX0, FL - 0.05, IZ0], [IX1, FL, BZ1], phMat("floor_tiles_06", 1 / 1.6, 1 / 1.6, { tint: "#d4ccc0", rough: 0.7, env: 0.8, key: "shopfloor" }));
    mb.span([-4.2, 0, IZ0], [IX0, CE + 0.3, BZ1 + 0.2], inM); mb.span([IX1, 0, IZ0], [4.2, CE + 0.3, BZ1 + 0.2], inM);
    mb.span([-4.2, 0, BZ1], [4.2, CE + 0.3, BZ1 + 0.25], inM);
    mb.span([-4.2, CE, IZ0], [4.2, CE + 0.12, BZ1 + 0.2], mat("painted_plaster_wall", 2.0, "#d8ccb8", { rough: 1, env: 0.4 }));
    // skirting
    for (const [a, b] of [[[IX0, FL, IZ0], [IX0 + 0.02, FL + 0.12, BZ1]], [[IX1 - 0.02, FL, IZ0], [IX1, FL + 0.12, BZ1]]] as [V3, V3][]) mb.span(a, b, col("#5a4a3e", 0.6));
    // posters on the right wall above the counter, the entrance mat
    for (let i = 0; i < 2; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.93), new THREE.MeshStandardMaterial({ map: posterTex(i), roughness: 0.7 })); p.position.set(IX1 - 0.012, 2.25, 1.0 + i * 2.6); p.rotation.y = -Math.PI / 2; root.add(p); }
    const m2 = new THREE.Mesh(planeM(1.8, 0.9), phMat("fabric_pattern_05", 1 / 0.4, 1 / 0.4, { tint: "#7a3a3a", rough: 1, env: 0.4, key: "mat" })); m2.rotation.x = -Math.PI / 2; m2.position.set(0, FL + 0.006, 0.85); m2.receiveShadow = true; root.add(m2);
  }
  // the display wall (partition z WZ..WZ+0.12), with the doorway to the back room at x 2.95..3.75 (a curtain)
  const wallCut: THREE.Mesh[] = [];
  const partM = mat("painted_plaster_wall", 2.0, "#f0e2c8", { rough: 0.95, env: 0.55 });
  const clipA = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100), clipB = new THREE.Plane(new THREE.Vector3(1, 0, 0), -100);
  const partClip = partM.clone(); partClip.clippingPlanes = [clipA, clipB]; partClip.clipIntersection = true; partClip.side = THREE.DoubleSide;
  const partL = new THREE.Mesh(boxM(2.95 - IX0, CE - FL, 0.12), partClip); partL.position.set((IX0 + 2.95) / 2, FL + (CE - FL) / 2, WZ + 0.06); partL.castShadow = partL.receiveShadow = true; root.add(partL);
  const partR = partL;
  const capM = new THREE.MeshStandardMaterial({ color: "#c8bca8", roughness: 1 });
  const capA = new THREE.Mesh(new THREE.PlaneGeometry(0.12, CE - FL), capM), capB = capA.clone(); for (const c of [capA, capB]) { c.position.set(0, FL + (CE - FL) / 2, WZ + 0.06); root.add(c); }
  void wallCut; void partR;
  mb.span([3.75, FL, WZ], [IX1, CE, WZ + 0.12], partM); mb.span([2.95, 2.35, WZ], [3.75, CE, WZ + 0.12], partM);
  const curtain = new THREE.Mesh(planeM(0.8, 2.2, 16, 1), phMat("fabric_pattern_05", 1 / 0.5, 1 / 0.5, { tint: "#8a2a2a", rough: 1, env: 0.4, key: "curtain", side: THREE.DoubleSide }));
  { const p = curtain.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.025); curtain.geometry.computeVertexNormals(); }
  curtain.position.set(3.35, FL + 1.1, WZ + 0.06); root.add(curtain);
  // slats + ledges: wooden slats behind each row (partition + left wall)
  const slatM = mat("brown_planks_05", 0.8, "#a87e58", { rough: 0.9, env: 0.55 }), ledgeM = col("#3a3c42", 0.35, 0.6, 1.1);
  const partSlats = new MB(), partLedges: THREE.Mesh[] = []; const slatClip = slatM.clone(); slatClip.clippingPlanes = [clipA, clipB]; slatClip.clipIntersection = true;
  for (const y of SH0.ROWS) {
    partSlats.box(6.25, 0.05, 0.02, slatClip, [-0.28, y + 0.12, WZ - 0.012]);
    for (const x of SH0.COLS) { const l = new THREE.Mesh(boxM(0.31, 0.018, 0.13), ledgeM); l.position.set(x, y - 0.009, WZ - 0.07); l.castShadow = l.receiveShadow = true; root.add(l); partLedges.push(l); }
    mb.box(0.03, 0.05, 3.9, slatM, [IX0 + 0.012, y + 0.12, 2.75]);
    for (const z of SH0.LCOLS) mb.box(0.13, 0.018, 0.31, ledgeM, [IX0 + 0.07, y - 0.009, z]);
  }
  const partSlatG = new THREE.Group(); root.add(partSlatG); partSlats.flush(partSlatG);
  // the shoes on the walls (all RIGHT shoes: toes pointing left on the partition, toward the front on the left wall)
  const wallShoes: WallShoe[] = [];
  SH0.ROWS.forEach((y, r) => SH0.COLS.forEach((x, i) => wallShoes.push({ p: [x + 0.01, y, WZ - 0.075], yaw: Math.PI, row: r, i, wall: "P", chunk: 0 })));
  SH0.ROWS.forEach((y, r) => SH0.LCOLS.forEach((z, i) => wallShoes.push({ p: [IX0 + 0.085, y, z], yaw: Math.PI / 2, row: r, i, wall: "L", chunk: 0 })));
  // removal chunks: 5 shoes of one row each, in sweeping order (partition rows from the corner box outwards, then the left wall)
  { let c = 0; for (const r of [2, 3, 1, 4, 0, 5]) for (let s = 0; s < 3; s++) { for (const w of wallShoes) if (w.wall === "P" && w.row === r && Math.floor(w.i / 5) === s) w.chunk = c; c++; }
    for (const r of [2, 3, 1, 4, 0, 5]) for (let s = 0; s < 2; s++) { for (const w of wallShoes) if (w.wall === "L" && w.row === r && Math.floor(w.i / 5) === s) w.chunk = c; c++; } }
  const NCH = 30;
  void 0;
  const shoeCol = (i: number) => SHOE_COLS[Math.floor(hsh(i, 5) * SHOE_COLS.length)];
  const wallF = new ShoeField(root, wallShoes.length, (i) => shoeCol(i));
  // the LEFT shoes the owner puts out after the robbery (toes to +x), filling the partition column by column from the left
  const NP = SH0.ROWS.length * SH0.COLS.length, leftF = new ShoeField(root, NP, (i) => shoeCol(i));
  const leftOrder: number[] = []; for (let c = 0; c < SH0.COLS.length; c++) for (let r = 0; r < SH0.ROWS.length; r++) leftOrder.push(r * SH0.COLS.length + c);
  // front display table with a few shoes, counter + register, benches, mirror, ceiling lamps, security camera
  { const tm = mat("wood_table_worn", 1.0, "#d8b890", { rough: 0.7, env: 0.8 });
    mb.box(1.5, 0.05, 0.7, tm, [-1.4, FL + 0.62, 1.6]); for (const [dx, dz] of [[-0.68, -0.3], [0.68, -0.3], [-0.68, 0.3], [0.68, 0.3]]) mb.box(0.05, 0.62, 0.05, col("#2a2a30", 0.4, 0.6), [-1.4 + dx, FL + 0.31, 1.6 + dz]);
    // counter (x 2.6..3.5, z 1.0..3.6)
    const cm = mat("wood_table_worn", 1.0, "#a87a52", { rough: 0.7, env: 0.8 });
    mb.span([2.6, FL, 1.0], [3.5, FL + 0.97, 3.6], mat("brown_planks_05", 0.9, "#8a6040", { rough: 0.9, env: 0.6 }));
    mb.span([2.55, FL + 0.97, 0.95], [3.55, FL + 1.02, 3.65], cm);
    ph("CashRegister_01", SH0.REGISTER, -Math.PI / 2, { h: 0.42 });
    // try-on benches (padded) + stools
    const pad = phMat("fabric_pattern_05", 1 / 0.3, 1 / 0.3, { tint: "#2f6a8a", rough: 1, env: 0.5, key: "pad" });
    for (const z of [3.1]) { mb.box(2.0, 0.12, 0.45, pad, [-1.0, FL + 0.43, z]); mb.box(2.0, 0.37, 0.4, mat("brown_planks_05", 0.9, "#6a4a32"), [-1.0, FL + 0.185, z]); }
    ph("metal_stool_01", [1.2, FL, 3.2], 0.3, { h: 0.62 }); ph("metal_stool_01", [1.85, FL, 2.4], 1.1, { h: 0.62 });
    // the tall floor mirror on the left wall
    mb.box(0.05, 1.7, 0.62, col("#2a2a30", 0.4, 0.6), [IX0 + 0.04, FL + 1.0, 0.55]);
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.6), new THREE.MeshStandardMaterial({ color: "#c8d4dc", roughness: 0.05, metalness: 1.0, envMapIntensity: 1.4 })); mir.position.set(IX0 + 0.068, FL + 1.0, 0.55); mir.rotation.y = Math.PI / 2; root.add(mir);
    for (const z of [1.3, 3.6]) ph("mounted_fluorescent_lights", [0, CE - 0.04, z], 0, { filt: "_a$", h: 0.04 });
    for (const x of [-2.4, 0.0, 2.2]) { const l = phModel("modern_ceiling_lamp_01", { center: true, h: 0.7 }); l.position.set(x, CE - 0.7, 4.3); root.add(l); }
    ph("potted_plant_04", [-3.6, FL, 4.7], 0, { h: 0.7 }); ph("plastic_crate_01", [3.7, FL, 4.6], 0.2, { h: 0.3 });
  }
  const secCam = phModel("security_camera_01", { center: true, h: 0.3 }); secCam.position.copy(new THREE.Vector3(...SH0.SECCAM)); secCam.rotation.set(0, -Math.PI * 0.8, 0); root.add(secCam);
  mb.box(0.45, 0.05, 0.05, col("#d8d8dc", 0.4, 0.5), [SH0.SECCAM[0] + 0.24, SH0.SECCAM[1] + 0.16, SH0.SECCAM[2]]); mb.box(0.04, 0.24, 0.04, col("#d8d8dc", 0.4, 0.5), [SH0.SECCAM[0] + 0.02, SH0.SECCAM[1] + 0.06, SH0.SECCAM[2]]);   // the wall bracket
  const secLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: "#ff3020" })); secLed.position.set(SH0.SECCAM[0] - 0.08, SH0.SECCAM[1] + 0.12, SH0.SECCAM[2] + 0.12); root.add(secLed);
  // shop lights: the display spots (dim night lights) + ceiling lights (morning) + the back room tube
  const dispL = [-2.2, 0.0, 2.0].map((x) => { const l = new THREE.SpotLight("#ffd8a8", 6, 7, 0.9, 0.7, 1.6); l.position.set(x, CE - 0.25, 3.6); l.target.position.set(x, 1.3, WZ); root.add(l, l.target); return l; });
  const ceilL = [-2.4, 0.0, 2.2].map((x) => { const l = new THREE.PointLight("#fff0dc", 3.5, 9, 1.6); l.position.set(x, CE - 0.8, 2.6); root.add(l); return l; });
  const backL = new THREE.PointLight("#f0f4ff", 5, 8, 1.6); backL.position.set(0.0, CE - 0.3, 6.8); root.add(backL);
  // the roll-up shutter + padlock, outside the facade
  const sh = shutter(SH0.SHUT_W, OH, true, [1.9, 1.0]); sh.G.position.set(0, FL + OH, -0.07); root.add(sh.G);

  // ===================== THE BACK ROOM (the left shoes) =====================
  { const shelfSpots: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) { const x = -3.3 + i * 1.18; ph("steel_frame_shelves_01", [x, FL, BZ1 - 0.32], 0, { h: 2.3 }); shelfSpots.push([x, BZ1 - 0.32, 0]); }
    for (let i = 0; i < 2; i++) ph("steel_frame_shelves_01", [IX0 + 0.32, FL, 6.0 + i * 1.18], Math.PI / 2, { h: 2.3 });
    // boxes: instanced bodies + lids by colour, packed on the shelf levels (lids facing out, labels toward the room)
    const levels = [0.08, 0.6, 1.12, 1.64].map((y) => FL + y + 0.02), spots: { p: V3; yaw: number }[] = [];
    for (const [x, z] of shelfSpots) for (const y of levels) for (let k = 0; k < 3; k++) for (let s = 0; s < 2; s++) spots.push({ p: [x - 0.36 + k * 0.36, y + s * BOX.h, z + 0.02], yaw: 0 });
    for (let i = 0; i < 2; i++) for (const y of levels) for (let k = 0; k < 3; k++) for (let s = 0; s < 2; s++) spots.push({ p: [IX0 + 0.34, y + s * BOX.h, 6.0 + i * 1.18 - 0.36 + k * 0.36], yaw: Math.PI / 2 });
    const cols = ["#e8622c", "#2a5a9a", "#d8c8a8", "#3a3a44", "#c8352e", "#f2c230"];
    const bodyG = boxM(BOX.w, BOX.h - 0.012, BOX.d); bodyG.translate(0, (BOX.h - 0.012) / 2, 0);
    const bm = new THREE.InstancedMesh(bodyG, phMat("painted_plaster_wall", 3, 3, { rough: 0.85, env: 0.6, key: "boxI" }), spots.length);
    const lab = new THREE.PlaneGeometry(0.12, 0.05); lab.translate(0.09, (BOX.h - 0.012) / 2, BOX.d / 2 + 0.002);
    const lm = new THREE.InstancedMesh(lab, new THREE.MeshStandardMaterial({ color: "#f4f2ea", roughness: 0.9 }), spots.length);
    const M = new THREE.Matrix4(), C = new THREE.Color();
    spots.forEach((s, i) => { M.compose(new THREE.Vector3(...s.p), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw + (hsh(i, 2) - 0.5) * 0.05), new THREE.Vector3(1, 1, 1)); bm.setMatrixAt(i, M); lm.setMatrixAt(i, M); C.set(cols[Math.floor(hsh(i, 8) * 6)]); bm.setColorAt(i, C); });
    bm.castShadow = bm.receiveShadow = true; root.add(bm, lm);
    ph("cardboard_box_01", [2.4, FL, 6.0], 0.3, { h: 0.34 }); ph("cardboard_box_01", [2.7, FL + 0.34, 6.05], 1.2, { h: 0.34 }); ph("metal_stool_01", [1.5, FL, 6.3], 0, { h: 0.62 });
    ph("mounted_fluorescent_lights", [0, CE - 0.04, 6.8], 0, { filt: "_a$", h: 0.04 });
  }
  // the box the owner opens in the back room (lid + the left shoe inside)
  const backBox = new THREE.Group(); root.add(backBox);
  { const b = lootBoxSmall("#e8622c"); b.position.set(0.0, FL + 0.78, 6.45); backBox.add(b); backBox.userData.lid = b.userData.lid;
    ph("WoodenTable_01", [0.0, FL, 6.45], 0, { h: 0.78 }); }

  // ===================== THE BAKERY NEXT DOOR (the neighbour's) =====================
  { const bm = mat("painted_plaster_wall", 2.0, "#f2e2c8", { rough: 0.95, env: 0.6 });
    mb.span([4.2, 0, 0], [10.5, 6.2, 0.3], bm); mb.span([4.2, 6.2, -0.05], [10.5, 6.7, 0.35], mat("concrete_wall_008", 1.6, "#c8c0b4"));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.7), new THREE.MeshStandardMaterial({ map: shopSign("pan", "PANADERÍA", "PAN CALIENTE", "#8a2a2a", "#f4e2b0"), roughness: 0.7 }));
    sg.position.set(7.35, 3.3, -0.05); sg.rotation.y = Math.PI; root.add(sg);
    // a shop window with bread on shelves (warm-lit inside), and the door
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ color: "#ffd8a0" })); win.position.set(8.4, FL + 1.55, -0.01); win.rotation.y = Math.PI; win.userData.always = true; root.add(win); litWins.push(win);
    for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), col(["#c8843a", "#b8742e", "#d89a4a"][i % 3], 0.7)); l.scale.set(1.4, 0.7, 0.8); l.position.set(7.4 + (i % 5) * 0.45, FL + 1.12 + Math.floor(i / 5) * 0.55, -0.06); root.add(l); }
    for (const [a, b, c2, x, y] of [[2.6, 0.1, 0.12, 8.4, FL + 2.35], [2.6, 0.14, 0.2, 8.4, FL + 0.78], [0.1, 1.5, 0.12, 7.15, FL + 1.55], [0.1, 1.5, 0.12, 9.65, FL + 1.55]] as number[][]) mb.box(a, b, c2, col("#5a2a22", 0.6), [x, y, -0.04]);
    mb.box(1.0, 2.2, 0.06, mat("wood_peeling_paint_weathered", 1.0, "#5a7a8a"), [5.6, FL + 1.1, -0.02]);
    mb.box(1.2, 0.08, 0.1, col("#5a2a22", 0.6), [5.6, FL + 2.26, -0.05]);
    ph("plastic_monobloc_chair_01", [6.6, FL, -0.75], 2.6, { h: 0.82 }); }
  const breadGlow = new THREE.PointLight("#ffc080", 4, 6, 1.6); breadGlow.position.set(8.4, FL + 1.6, -0.8); root.add(breadGlow);

  // ===================== THE TRICYCLE + THE LOOT =====================
  const trike = tricycle(); root.add(trike);
  const loot = [0, 1, 2].map((k) => { const b = lootBox(k); root.add(b); return b; });
  // heaps inside the loot boxes (shoes in random tumbles, filling up to the rim) + the shoes flying into them
  const HEAP = 16;
  const heapF = new ShoeField(root, HEAP * 3, (i) => shoeCol(i * 3 + 1));
  const heapPose = Array.from({ length: HEAP }, (_, j) => ({ x: (hsh(j, 1) - 0.5) * 0.42, z: (hsh(j, 2) - 0.5) * 0.26, y: 0.05 + (j / HEAP) * 0.5, yaw: hsh(j, 3) * TAU, pitch: (hsh(j, 4) - 0.5) * 1.6, roll: (hsh(j, 6) - 0.5) * 2.0 }));
  // the garage floor pile (all rights, toes the same way) and the shoes laid out on the table
  const PILE = 34;
  const pileF = new ShoeField(root, PILE, (i) => shoeCol(i * 7 + 3));
  const tableF = new ShoeField(root, 12, (i) => shoeCol(i * 11 + 5));

  // ===================== THE GARAGE HIDEOUT (G) =====================
  const gDoor = new THREE.Group(); const sideDoor = new THREE.Group(); const gBulbL = new THREE.PointLight("#ffc48a", 7, 12, 1.6);
  { const G0 = GX - 5, G1 = GX + 5, GZ1 = 9, GH = 3.4, GF = 0.05;
    const iron = mat("worn_corrugated_iron", 1.4, "#c8c4bc", { rough: 0.7, metal: 0.35, env: 0.9 }), ironR = mat("rusty_corrugated_iron", 1.4, "#d0b8a0", { rough: 0.8, metal: 0.3, env: 0.8 });
    mb.span([G0 - 0.5, 0, -6], [G1 + 0.5, GF, GZ1 + 0.5], mat("concrete_floor_worn_001", 2.2, "#c8c4bc", { rough: 0.9, env: 0.7 }));
    // walls (west wall with the window x G0, z 3..5, y 1.2..2.3; east wall with the side door z 6..6.9)
    mb.span([G0 - 0.08, 0, 0], [G0, GH, 3.0], iron); mb.span([G0 - 0.08, 0, 5.0], [G0, GH, GZ1], iron); mb.span([G0 - 0.08, 0, 3.0], [G0, 1.2, 5.0], iron); mb.span([G0 - 0.08, 2.3, 3.0], [G0, GH, 5.0], iron);
    mb.span([G1, 0, 0], [G1 + 0.08, GH, 6.0], ironR); mb.span([G1, 0, 6.9], [G1 + 0.08, GH, GZ1], ironR); mb.span([G1, 2.15, 6.0], [G1 + 0.08, GH, 6.9], ironR);
    mb.span([G0, 0, GZ1], [G1, GH, GZ1 + 0.08], iron);
    mb.span([G0, 2.6, -0.04], [G1, GH, 0.04], iron); mb.span([G0, 0, -0.04], [GX - 2.5, 2.6, 0.04], iron); mb.span([GX + 2.5, 0, -0.04], [G1, 2.6, 0.04], iron);
    // roof (corrugated, slightly sloped) with a skylight gap of dirty plastic
    mb.add(boxM(10.6, 0.04, 9.6), mat("rusty_corrugated_iron", 1.4, "#b0a090", { rough: 0.8, metal: 0.3 }), [GX, GH + 0.05, 4.5], [0.03, 0, 0]);
    for (let i = 0; i < 6; i++) mb.box(10.2, 0.12, 0.1, mat("rough_wood", 0.6, "#8a6a4a"), [GX, GH - 0.06, 0.6 + i * 1.6]);
    // window: frame + dusty glass
    for (const [a, b, c2, y, z] of [[0.1, 0.08, 2.1, 2.34, 4.0], [0.14, 0.1, 2.2, 1.16, 4.0], [0.1, 1.1, 0.08, 1.75, 2.97], [0.1, 1.1, 0.08, 1.75, 5.03], [0.06, 1.1, 0.05, 1.75, 4.0]] as number[][]) mb.box(a, b, c2, mat("wood_peeling_paint_weathered", 1.0, "#8aa0a0"), [G0 - 0.02, y, z]);
    const dusty = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), new THREE.MeshStandardMaterial({ color: "#d8d0b8", roughness: 0.4, transparent: true, opacity: 0.22, depthWrite: false })); dusty.position.set(G0 - 0.03, 1.75, 4.0); dusty.rotation.y = Math.PI / 2; root.add(dusty);
    // the roll-up garage door, rolled up (curtain hidden in the drum) + guides
    { const d = shutter(5.0, 2.6, false); d.set(0.92); d.G.position.set(GX, 2.6, -0.06); gDoor.add(d.G); gDoor.userData.set = d.set; root.add(gDoor); }
    // the side door (hinged at z 6.0): planks
    { const dm = new MB(); dm.box(0.05, 2.05, 0.88, mat("wood_peeling_paint_weathered", 1.0, "#6a8a5a"), [0, 1.025, 0.44]); dm.box(0.07, 0.05, 0.05, col("#c8b070", 0.3, 0.9), [-0.04, 1.05, 0.8]); dm.flush(sideDoor); sideDoor.position.set(G1 + 0.04, GF, 6.0); root.add(sideDoor); }
    // the workbench under the window + vice, tools, jerrycans, tyres, tool cart, chest, shelves, generator, the covered car
    const bt = mat("wood_table_worn", 1.0, "#a88a62", { rough: 0.8, env: 0.7 });
    mb.span([G0 + 0.05, GF + 0.9, 2.2], [G0 + 0.85, GF + 0.96, 5.8], bt);
    for (const z of [2.3, 5.7]) for (const x of [G0 + 0.1, G0 + 0.8]) mb.box(0.07, 0.9, 0.07, mat("rough_wood", 0.6, "#7a5a3a"), [x, GF + 0.45, z]);
    mb.span([G0 + 0.1, GF + 0.2, 2.3], [G0 + 0.8, GF + 0.24, 5.7], mat("rough_wood", 0.6, "#7a5a3a"));
    ph("bench_vice_01", [G0 + 0.4, GF + 0.96, 5.3], Math.PI / 2, { h: 0.26 });
    ph("metal_tool_chest", [G0 + 0.45, GF + 0.96, 2.6], Math.PI / 2, { h: 0.36 });
    ph("metal_jerrycan", [G0 + 0.35, GF, 6.4], 0.3); ph("metal_jerrycan", [G0 + 0.36, GF, 6.85], 1.2);
    for (let i = 0; i < 4; i++) { const t = phModel("old_tyre", { center: true }); t.rotation.set(Math.PI / 2, 0, 0); t.position.set(G1 - 0.6, GF + 0.08 + i * 0.16, GZ1 - 0.7); t.rotation.z = i * 0.6; root.add(t); }
    { const t = phModel("old_tyre", { center: true }); t.rotation.set(0.12, 0.4, 0); t.position.set(G1 - 1.5, GF, GZ1 - 0.45); root.add(t); }
    ph("tool_cart", [G1 - 0.8, GF, 1.4], -Math.PI / 2); ph("portable_generator", [G0 + 1.2, GF, GZ1 - 0.6], 0.2);
    for (let i = 0; i < 3; i++) ph("steel_frame_shelves_01", [G0 + 1.6 + i * 1.18, GF, GZ1 - 0.32], 0, { h: 2.3 });
    ph("covered_car", [G1 - 2.5, GF, 7.85], 0.04);   // back-right corner: at z 5.6 it blocked the neighbour's path from the side door and filled the follow shot
    ph("hanging_industrial_lamp", [GX - 2.8, GH - 1.36, 6.6], 0, { h: 1.36 });
    // the bare bulb: socket + bulb on a cord from the beam
    { const p = SH0.G_BULB; const cord = new THREE.Mesh(cylM(0.006, 0.006, GH - p[1] - 0.12, 5), col("#1e1c22", 0.6)); cord.position.set(p[0], (GH + p[1] + 0.12) / 2, p[2]); root.add(cord);
      const sk = phModel("pull_chain_light_socket", { center: true, h: 0.17 }); sk.position.set(p[0], p[1] + 0.02, p[2]); root.add(sk);
      const bu = phModel("lightbulb_01", { center: true, h: 0.1 }); bu.rotation.x = Math.PI; bu.position.set(p[0], p[1] + 0.02, p[2]); root.add(bu);
      gBulbL.position.set(p[0], p[1] - 0.08, p[2]); root.add(gBulbL); glow(root, [p[0], p[1] - 0.06, p[2]], "#ffd8a0", 0.5, 1.4); }
    // seats: plastic crates + a monobloc chair; the selling table (a door on two crates) with the cheap sign
    for (const [i, s] of SH0.G_SEATS.entries()) { if (i === 1) ph("plastic_monobloc_chair_01", s, Math.PI, { h: 0.82 }); else { ph("plastic_crate_01", s, Math.PI / 2, { h: 0.3 }); ph("plastic_crate_01", [s[0], s[1] + 0.3, s[2]], Math.PI / 2 + 0.1, { h: 0.3 }); } }
    { const t = SH0.G_TABLE; mb.span([t[0] - 0.9, GF + 0.6, t[2] - 0.45], [t[0] + 0.9, GF + 0.66, t[2] + 0.45], mat("wood_peeling_paint_weathered", 1.0, "#c8b8a0"));
      for (const dx of [-0.65, 0.65]) { ph("plastic_crate_01", [t[0] + dx, GF, t[2]], 0, { h: 0.3 }); ph("plastic_crate_01", [t[0] + dx, GF + 0.3, t[2]], 0.05, { h: 0.3 }); }
      const cs = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.46), new THREE.MeshStandardMaterial({ map: cheapSign(), roughness: 0.95 })); cs.position.set(t[0] + 0.2, GF + 0.95, t[2] + 0.38); cs.rotation.set(-0.2, Math.PI, 0); root.add(cs);
      mb.box(0.8, 0.48, 0.02, mat("painted_plaster_wall", 2, "#b8905a"), [t[0] + 0.2, GF + 0.95, t[2] + 0.39], [0.2, 0, 0]); }
    // a wooden crate as the money table by the bench (the boss counts here)
    ph("wooden_crate_01", [G0 + 1.6, GF, 3.2], 0.2, { h: 0.5 });
    // outside the garage door: the alley at sunrise (dirt, a wall opposite, a pole)
    mb.span([G0 - 6, 0, -9], [G1 + 6, 0.02, 0], mat("stony_dirt_path", 2.4, "#c8b49c"));
    mb.span([G0 - 6, 0, -9.3], [G1 + 6, 3.0, -9], mat("brick_wall_02", 2.0, "#d8b8a0"));
    mb.span([G0 - 3.2, 0, -2], [G0 - 2.9, 2.3, 12], mat("red_brick_03", 1.4, "#d8a890", { rough: 1, env: 0.5 }));   // the neighbouring wall seen through the window
    ph("modular_electricity_poles", [GX - 3.5, 0.02, -2.2], 0, { filt: "^preset_02_", h: 7.2 });
  }
  const shaftG = shaft(root, [GX - 5.2, 2.2, 4.0], [GX - 2.4, 0.1, 4.6], 1.6, "#ffe0b0", 0.2);

  // ===================== THE INSERT (I): a car door's inside panel + its pocket =====================
  const gloveM = glove();
  const insG = new THREE.Group(); root.add(insG);
  { const p = SH0.I_DOOR, D = new MB(), pl = col("#b8ae9c", 0.6, 0.05, 0.9), pk = col("#8a8478", 0.7, 0.05, 0.8), rub = col("#2a2a30", 0.7), chrome = col("#c8ccd4", 0.22, 0.95, 1.5);
    const fab = phMat("fabric_pattern_05", 1 / 0.18, 1 / 0.18, { tint: "#d8d0c0", rough: 1, env: 0.5, key: "carfab" });
    D.span([-0.6, 0, 0], [0.6, 0.95, 0.06], pl);                       // the lower door card
    D.span([-0.48, 0.42, -0.012], [0.42, 0.66, 0.0], fab);              // fabric insert
    D.span([-0.55, 0.62, -0.13], [0.32, 0.7, 0.0], pk);                 // arm rest
    D.span([0.22, 0.7, -0.03], [0.44, 0.8, 0.0], pk); D.span([0.26, 0.735, -0.05], [0.4, 0.755, -0.03], chrome);   // handle
    D.span([-0.52, 0.06, -0.11], [0.38, 0.09, 0.0], pk);                // pocket floor
    D.span([-0.52, 0.09, -0.12], [0.38, 0.3, -0.1], pk);                // pocket lip
    D.span([-0.54, 0.06, -0.12], [-0.52, 0.3, 0.0], pk); D.span([0.38, 0.06, -0.12], [0.4, 0.3, 0.0], pk);
    D.add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 28), rub, [-0.32, 0.2, -0.004], [Math.PI / 2, 0, 0]);   // speaker grille
    D.span([-0.6, 0.95, -0.02], [0.6, 1.0, 0.06], rub); D.span([-0.62, 0.95, -0.02], [-0.56, 1.5, 0.06], rub); D.span([0.56, 0.95, -0.02], [0.62, 1.5, 0.06], rub); D.span([-0.62, 1.5, -0.02], [0.62, 1.56, 0.06], rub);
    D.span([0.62, -0.05, -0.05], [0.72, 1.6, 0.08], pl);               // the B-pillar edge
    D.span([-0.7, -0.25, -0.5], [0.75, 0.0, 0.06], pl);                // the sill / floor edge
    D.span([0.15, -0.25, -1.1], [0.75, 0.38, -0.45], fab);             // the seat edge (foreground)
    D.flush(insG);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.52), glass()); gl.position.set(0, 1.24, 0.03); insG.add(gl);
    insG.position.set(...p); }
  insG.add(gloveM); gloveM.scale.setScalar(1.1); const gloveRest = new THREE.Vector3(-0.1, 0.3, -0.12);
  mb.flush(root);

  // ---------------- marks + tested cameras ----------------
  const marks: Record<string, V3> = { wall: [0, FL, 3.4], lock: SH0.LOCK, counter: SH0.OWNER_CTR, back: SH0.BACK_OWNER, garage: [GX, 0.05, 4], bench: SH0.G_BENCH, insert: SH0.I_DOOR };
  const cams: SetDef["cams"] = {
    sh_wall: { pos: [0.4, 1.6, 1.4], look: [-0.4, 1.3, 5.0], fov: 54 },
    sh_shoes: { pos: [0.1, 1.42, 4.05], look: [-0.5, 1.15, 5.0], fov: 40 },
    sh_hook: { pos: [-1.2, 1.45, 2.2], look: [-2.9, 1.2, 4.6], fov: 54 },
    sh_cam: { pos: [3.82, 3.1, 0.35], look: [1.2, 1.55, 2.45], fov: 50 },
    sh_ctr: { pos: [-1.6, 1.6, 1.0], look: [2.6, 1.2, 2.4], fov: 54 },
    sh_front: { pos: [1.2, 1.7, -6.0], look: [0, 1.6, 0], fov: 56 },
    sh_lock: { pos: [0.6, 0.55, -1.6], look: [0, 0.35, 0], fov: 50 },
    sh_street: { pos: [-7.5, 1.7, -5.5], look: [0, 1.8, -1], fov: 56 },
    sh_back: { pos: [1.6, 1.6, 5.6], look: [-0.2, 1.2, 8.3], fov: 56 },
    sh_cut: { pos: [0.6, 1.7, 1.2], look: [0.2, 1.4, 6.5], fov: 56 },
    g_wide: { pos: [GX + 2.6, 1.8, 0.8], look: [GX - 1.5, 1.0, 5.0], fov: 56 },
    g_bench: { pos: [GX - 1.8, 1.5, 1.8], look: [GX - 4.5, 1.1, 3.6], fov: 54 },
    g_loot: { pos: [GX - 0.2, 1.7, 3.2], look: [GX - 0.6, 0.4, 5.7], fov: 54 },
    g_door: { pos: [GX + 1.2, 1.6, -4.5], look: [GX, 1.3, 2.0], fov: 56 },
    ins: { pos: [IX + 0.25, 0.95, -4.05], look: [IX - 0.05, 0.62, -5.0], fov: 46 },
  };

  // ---------------- pose: story controls ----------------
  const Q = new THREE.Quaternion(), E = new THREE.Euler();
  const boxTop = (b: number) => { const g = loot[b]; return new THREE.Vector3(g.position.x, g.position.y + 0.56, g.position.z); };   // root-local
  const lootHome = (k: number, mode: number): { p: V3; yaw: number } => mode < 0.5 ? { p: SH0.BOX_SPOTS[k], yaw: 0 } : { p: SH0.G_LOOT[k], yaw: [0.3, -0.2, 0.5][k] };
  const pose = (t: number, c: Ctl, light?: string) => {
    // --- the shutter (c.shut 0 closed .. 1 rolled up), the padlock (c.snap 0/1, c.lockFall 0..1), the cutters' bite (c.bite)
    sh.set(c.shut ?? 0, c.snap ?? 0, c.lockFall ?? 0);
    // --- the walls of sneakers: c.gone = chunks removed (float; the active chunk flies into the nearest box)
    const gone = c.gone ?? 0, cur = Math.floor(gone), kk = gone - cur;
    const fill = [0, 0, 0];
    wallShoes.forEach((w, i) => {
      const bx = c.toBox ?? -1;
      if (w.chunk < cur) { wallF.hide(i); const b = bx >= 0 ? bx : nearestBox(w); fill[b] += 1; return; }
      if (w.chunk > cur || kk <= 0) { wallF.set(i, w.p, w.yaw); return; }
      // the active chunk: slide along the ledge (0..0.4), then arc into the box (0.4..1), staggered by position
      const j = w.i % 5, st = j * 0.06, u = cl((kk - st) / (1 - 0.24));
      const b = bx >= 0 ? bx : nearestBox(w), tgt = boxTop(b);
      if (u < 0.4) { const s = sm(u / 0.4); const p: V3 = w.wall === "P" ? [w.p[0] - s * 0.3 * (j + 1) * 0.3, w.p[1], w.p[2] + s * 0.02] : [w.p[0], w.p[1], w.p[2] - s * 0.09 * (j + 1)]; wallF.set(i, p, w.yaw, 0, s * 0.3); }
      else { const v = (u - 0.4) / 0.6; if (v >= 1) { wallF.hide(i); fill[b] += 1; return; }
        const a = new THREE.Vector3(...w.p), q = a.clone().lerp(tgt, v); q.y = lerp(a.y, tgt.y, v) + Math.sin(v * Math.PI) * 0.45 - v * v * 0.1;
        wallF.set(i, [q.x, q.y, q.z], w.yaw + v * 2.2 * (j % 2 ? 1 : -1), v * 3.0, v * 1.7); }
    });
    wallF.done();
    { const nl = c.lefts ?? 0; leftOrder.forEach((slot, n) => { const w = wallShoes[slot]; if (n < nl) leftF.set(slot, [w.p[0] - 0.01, w.p[1], w.p[2]], 0, 0, 0, true); else leftF.hide(slot); }); leftF.done(); }
    // --- the tricycle: c.trX/c.trZ/c.trYaw, c.trRoll (wheel turns), c.trOn
    trike.visible = (c.trOn ?? 0) > 0.5;
    trike.position.set(c.trX ?? SH0.TRIKE_PARK[0], c.trY ?? 0, c.trZ ?? SH0.TRIKE_PARK[2]); trike.rotation.set(0, c.trYaw ?? 0, (c.trWob ?? 0) * Math.sin(t * 5.2) * 0.025);
    (trike.userData.wheels as THREE.Group[]).forEach((w, i) => { w.rotation.z = -(c.trRoll ?? 0) * (i < 2 ? 1 : 0.91); });
    trike.updateMatrixWorld(true);
    // --- the loot boxes: c.loot 0 in the shop, 1 on the tricycle, 2 in the garage; c.fill0..2 override the heap counts
    const lm = c.loot ?? 0;
    loot.forEach((g, k) => {
      g.visible = (c.lootOn ?? 1) > 0.5;
      if (lm > 0.5 && lm < 1.5) { // stacked on the tricycle's cargo box (box 0 in it, 1 and 2 on top), wobbling
        const cb = trike.userData.cargo as THREE.Group; cb.updateWorldMatrix(true, false);
        const wob = (c.trWob ?? 0) * Math.sin(t * 5.2 + k * 0.7) * (0.02 + k * 0.03);
        const lp = root.worldToLocal(new THREE.Vector3((k - 1) * 0.04 * Math.sin(t * 3 + k), 0.03 + k * 0.555, 0).applyMatrix4(cb.matrixWorld)); g.position.copy(lp);
        g.quaternion.copy(trike.quaternion).multiply(Q.setFromEuler(E.set(wob, 0.08 * (k - 1), wob * 0.6))); }
      else { const h = lootHome(k, lm); g.position.set(...h.p); g.rotation.set(0, h.yaw, 0);
        if (k === 2 && (c.dump ?? 0) > 0) { const d = sm(c.dump ?? 0); g.rotation.set(0, h.yaw, -d * 1.75); g.position.y += Math.sin(d * Math.PI) * 0.12; g.position.x += d * 0.25; } }
    });
    for (let k = 0; k < 3; k++) {
      const n = Math.min(HEAP, Math.round(c["fill" + k] ?? Math.min(HEAP, fill[k] * HEAP / 25)));
      const g = loot[k]; g.updateWorldMatrix(true, false);
      for (let j = 0; j < HEAP; j++) { const id = k * HEAP + j; if (j >= n || !g.visible) { heapF.hide(id); continue; }
        const hp = heapPose[j], p = root.worldToLocal(new THREE.Vector3(hp.x, hp.y, hp.z).applyMatrix4(g.matrixWorld));
        heapF.set(id, [p.x, p.y, p.z], hp.yaw + g.rotation.y, hp.pitch, hp.roll + (k === 2 ? g.rotation.z : 0)); }
    }
    heapF.done();
    // --- the garage pile (c.pile shoes shown: all rights, toes pointing -x, a loose heap) and the selling table (c.table)
    const pn = c.pile ?? 0;
    for (let i = 0; i < PILE; i++) { if (i >= pn || i === c.pileHide) { pileF.hide(i); continue; }
      const q = pileAt(i); pileF.set(i, q.p, q.yaw, 0, q.roll); }
    pileF.done();
    const tn = c.table ?? 12, T0 = SH0.G_TABLE;
    for (let i = 0; i < 12; i++) { if (i >= tn) { tableF.hide(i); continue; } tableF.set(i, [T0[0] - 0.72 + (i % 6) * 0.29, 0.71, T0[2] - 0.2 + Math.floor(i / 6) * 0.3], Math.PI + (hsh(i, 4) - 0.5) * 0.1); }
    tableF.done();
    // --- the partition cutaway (c.cut 0..1: a vertical slot from x CX-w/2..CX+w/2 is sliced out of the display wall)
    { const k = sm(c.cut ?? 0), cx = c.cutX ?? 0.4, hw = k * 2.0, a = cx - hw, b = cx + hw;
      const R0 = 2.95;
      if (k <= 0.001) { clipA.constant = 100; clipB.constant = -100; capA.visible = capB.visible = false; }
      else { const ox = root.position.x; clipA.constant = a + ox; clipB.constant = -(b + ox); capA.visible = a > IX0; capA.position.x = a; capA.rotation.y = Math.PI / 2; capB.visible = b < R0; capB.position.x = b; capB.rotation.y = -Math.PI / 2; }
      partLedges.forEach((l) => { l.visible = k <= 0.001 || l.position.x < a - 0.16 || l.position.x > b + 0.16; });
      if (k > 0.001) wallShoes.forEach((w, i) => { if (w.wall === "P" && w.p[0] > a - 0.2 && w.p[0] < b + 0.2) wallF.hide(i); }); wallF.done(); }
    // the back-room box: lid open (c.backLid 0..1)
    (backBox.userData.lid as THREE.Object3D).rotation.x = -(c.backLid ?? 0) * 1.9;
    // --- the garage: c.side (side door 0 shut .. 1 open), c.gdoor (garage door 0 shut .. 1 up)
    sideDoor.rotation.y = (c.side ?? 0) * 1.5;
    (gDoor.userData.set as (u: number) => void)(c.gdoor ?? 0.92);
    // --- lights: c.nite 1 at night (display spots dim, lamp + bakery glow on, ceiling off), morning: ceiling on
    const nite = c.nite ?? (light === "shNight" ? 1 : 0);
    dispL.forEach((l) => { l.intensity = nite > 0.5 ? 2.0 : 1.3; });
    ceilL.forEach((l) => { l.intensity = nite > 0.5 ? 0 : 0.8; });
    lampL.intensity = nite > 0.5 ? 9 : 0; lampGlow.visible = nite > 0.5; breadGlow.intensity = nite > 0.5 ? 0 : 3;
    litWins.forEach((m) => { m.visible = nite > 0.5 || !!m.userData.always; });
    backL.intensity = (c.backOn ?? (nite > 0.5 ? 0 : 1)) * 5;
    gBulbL.intensity = 7 * (0.97 + 0.03 * Math.sin(t * 11.3) * Math.sin(t * 4.1)) * (c.bulb ?? 1);
    secLed.visible = Math.sin(t * 3.0) > -0.2;
    clockFace.material.emissiveIntensity = nite > 0.5 ? 0.12 : 0;
    // --- the glove (insert): c.gl 0 in the pocket .. 1 pulled out and held up (the hand is a card)
    { const p = SH0.I_DOOR, k = sm(c.gl ?? 0), fl = Math.sin(cl(c.glFlop ?? 0) * Math.PI);
      void p; gloveM.position.set(gloveRest.x + k * 0.04, gloveRest.y + k * 0.3 + fl * 0.03, gloveRest.z - k * 0.2);
      gloveM.rotation.set(0.35 + fl * 0.5, Math.PI + 0.15, 0.25 - fl * 0.3); insG.visible = (c.ins ?? 0) > 0.5; gloveM.visible = insG.visible && (c.glOn ?? 1) > 0.5; }
    void shaftG;
  };
  const nearestBox = (w: WallShoe) => { const x = w.wall === "P" ? w.p[0] : -3.4; let b = 0, d = 1e9; SH0.BOX_SPOTS.forEach((s, k) => { const dd = Math.abs(s[0] - x); if (dd < d) { d = dd; b = k; } }); return b; };
  const sun = { shNight: [0.35, 0.8, -0.48] as V3, shMorn: [0.42, 0.62, -0.68] as V3, shGar: [-0.8, 0.42, 0.3] as V3, shIns: [-0.5, 0.6, -0.6] as V3 };
  const env = { shNight: { hdri: "cowboy_town_hall", i: 0.08 }, shMorn: { hdri: "kloofendal_38d_partly_cloudy", i: 0.3 }, shGar: { hdri: "cowboy_town_hall", i: 0.24 }, shIns: { hdri: "kloofendal_38d_partly_cloudy", i: 0.55 } };
  void NCH; void SERIF;
  return { name: "shoeset", root, marks, cams, pose, sunW: sun, env, title: [wallF.upper, heapF.upper, pileF.upper, leftF.upper] } as SetDef;
};

/** the small shoe box the owner opens in the back room (with the LEFT shoe inside, toe pointing right) */
const lootBoxSmall = (c: string) => {
  const G = new THREE.Group(), w = BOX.w * 1.3, h = BOX.h * 1.2, d = BOX.d * 1.3;
  const m = phMat("painted_plaster_wall", 3, 3, { tint: c, rough: 0.85, env: 0.6, key: "bbox" + c });
  const body = new THREE.Mesh(boxM(w, h, d), m); body.position.y = h / 2; G.add(body);
  const lid = new THREE.Group(); const lmsh = new THREE.Mesh(boxM(w + 0.014, 0.04, d + 0.014), m); lmsh.position.set(0, 0.02, d / 2 + 0.007); lid.add(lmsh); lid.position.set(0, h, -d / 2 - 0.007); G.add(lid);
  G.userData.lid = lid;
  G.traverse((o) => { (o as THREE.Mesh).castShadow = (o as THREE.Mesh).receiveShadow = true; });
  void SHOE;
  return G;
};
