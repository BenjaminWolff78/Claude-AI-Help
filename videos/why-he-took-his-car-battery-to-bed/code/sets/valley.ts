// THE VALLEY ("Why He Wanted His Potatoes Stolen"): home base B, the village market square at the origin (cobbles,
// three market stalls, a well, the PIG FEED crate and the pigsty with its trough on the west side of the square), and
// home base A, the royal potato field on a plateau up the hill to the west (y = FY = 4): dry-stone wall, 8 rows of potato
// plants along z, torches on posts, the guards' drum, the guard hut outside the west wall. A dirt path climbs from the
// square to the field gate on the wall's east side, so the camera can ride a tossed potato from the field down into the
// trough (scene 1 -> 2). Houses ring the square (back row z = -13, right row x = 16, front row z = 19).
//
// Controls (c):
//   planted   0..1  rows of plants grow in, row by row from the east (default 1)
//   holes     0..1  picked clean: plants gone, dug holes + loose leaves (default 0)
//   torches   0..1  torch flames + their lights (night)
//   moon      0..1  the moon in the sky (night)
//   trough    0..1  potatoes in the pig's trough (0 = empty)
//   feed      0..1  the PIG FEED crate is full (default 1)
//   gardens   0..1  potato patches in every backyard grow in (scene 7)
//   smoke     0..1  chimney smoke (default 1)
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house } from "../build";
import { ctex, rng, rep, grassHD, cobbleHD, stoneHD, planksHD, beamHD, roofHD } from "../paint";
import { glow, lamp, flicker, sign, crate, barrel, sack } from "../setkit";
import { tree, swayTree, bunting, flutter, pigeons } from "./towerkit";
import { torch, flickerTorch, stripeTex, basket, puff, risePuffs, M, hill, TAU } from "./portkit_common";
import { NOINK } from "../ink";
import type { SetDef, SetBuilder, V3 } from "./types";

export const FY = 4;
const ss = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
/** ground height: the field plateau rises west of x = -14, a gentle back hill north of z = -22 */
export const vH = (x: number, z: number) => Math.max(FY * ss((-x - 14) / 8), 3.2 * ss((-z - 24) / 16) * ss((x + 40) / 20));
// field rectangle (inside the wall), rows along z
export const FIELD = { x0: -34, x1: -23, z0: -27, z1: -15 };
export const ROWS = Array.from({ length: 6 }, (_, i) => -32.6 + i * 1.7);

const soilTex = () => ctex("vlSoil", 1024, 1024, (g, r) => {
  g.fillStyle = "#8a6242"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 16; i++) { const x = i * 64; const gr = g.createLinearGradient(x, 0, x + 64, 0); gr.addColorStop(0, "#6e4a30"); gr.addColorStop(0.5, "#9a7050"); gr.addColorStop(1, "#6e4a30"); g.fillStyle = gr; g.fillRect(x, 0, 64, 1024); }
  for (let i = 0; i < 2200; i++) { g.fillStyle = r() > 0.5 ? "rgba(60,36,22,0.35)" : "rgba(190,150,110,0.3)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 5, 2 + r() * 4); }
});
const dirtTex = () => ctex("vlDirt", 512, 512, (g, r) => {
  g.fillStyle = "#c7a176"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? "rgba(120,86,56,0.3)" : "rgba(236,214,176,0.35)"; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 4, 0, 7); g.fill(); }
});
const mudTex = () => ctex("vlMud", 512, 512, (g, r) => {
  g.fillStyle = "#7a5638"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 512, rr = 20 + r() * 60; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(90,60,40,0.8)"); gr.addColorStop(1, "rgba(90,60,40,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(200,170,130,0.35)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 6 + r() * 12, 3 + r() * 5, r() * 3, 0, 7); g.fill(); }
});
const holeTex = () => ctex("vlHoles", 256, 1024, (g, r) => {
  g.clearRect(0, 0, 256, 1024);
  for (let i = 0; i < 26; i++) { const y = 20 + i * 38.5, x = 128 + (r() - 0.5) * 30;
    g.fillStyle = "rgba(196,152,104,0.95)"; g.beginPath(); g.ellipse(x + 14, y + 6, 46, 22, 0.2, 0, 7); g.fill();
    g.fillStyle = "#3e2618"; g.beginPath(); g.ellipse(x, y, 34, 16, 0.1, 0, 7); g.fill();
    g.fillStyle = "rgba(90,150,70,0.9)"; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x + (r() - 0.5) * 90, y + (r() - 0.5) * 30, 9, 4, r() * 3, 0, 7); g.fill(); } }
});
const leafTex = () => ctex("vlPotLeaf", 256, 256, (g, r) => {
  g.fillStyle = "#4f9a3e"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { g.fillStyle = r() > 0.5 ? "#6cb850" : "#3c7f34"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 14, 5 + r() * 7, r() * 3, 0, 7); g.fill(); }
});
const moonTex = () => ctex("vlMoon", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, "rgba(255,250,225,1)"); gr.addColorStop(0.55, "rgba(255,250,225,0.9)"); gr.addColorStop(0.6, "rgba(220,230,255,0.25)"); gr.addColorStop(1, "rgba(200,210,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(210,205,180,0.6)"; for (const [x, y, rr] of [[104, 110, 14], [150, 140, 10], [124, 160, 8], [146, 96, 7]]) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
});

/** a French market stall: plank counter, posts, striped awning; goods = "veg" | "bread" | "cheese" */
const frenchStall = (parent: THREE.Object3D, pos: V3, yaw: number, w: number, c1: string, c2: string, goods: "veg" | "bread" | "cheese", seed: number) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const b = new Batch(), d = 1.3, wood = M.beam(), r = rng(seed);
  b.add(boxGeo(V(-w / 2, 0, -d / 2 + 0.5), V(w / 2, 0.9, d / 2), 1), lam("vlCounter", () => ({ map: rep(planksHD(), 0.5, 0.5) })));
  b.add(boxGeo(V(-w / 2 - 0.05, 0.9, -d / 2 + 0.45), V(w / 2 + 0.05, 0.96, d / 2 + 0.05), 1), lam("vlCounterTop", () => ({ map: beamHD() })));
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) b.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, z > 0 ? 2.3 : 2.6, z + 0.05)), wood);
  const n = Math.round(w / 0.32);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.2 + (i * (w - 0.4)) / (n - 1);
    for (let j = 0; j < 2; j++) {
      const z = 0.05 + j * 0.36, y = 0.96;
      if (goods === "veg") {
        const k = (i + j) % 3;
        if (k === 0) b.add(new THREE.IcosahedronGeometry(0.15, 1).translate(x, y + 0.13, z), lam("vlCabbage", () => ({ color: "#8cc05a" })));
        else if (k === 1) b.add(new THREE.SphereGeometry(0.1, 10, 8).translate(x, y + 0.1, z), lam("vlTurnip", () => ({ color: "#e8d0e6" })));
        else b.add(new THREE.SphereGeometry(0.09, 10, 8).scale(1, 0.85, 1).translate(x, y + 0.08, z), lam("vlOnion", () => ({ color: "#e8a640" })));
      } else if (goods === "bread") {
        b.add(new THREE.CapsuleGeometry(0.07, 0.34, 4, 8).rotateZ(Math.PI / 2).rotateY((r() - 0.5) * 0.4).translate(x, y + 0.07, z), lam("vlBread", () => ({ color: "#d8964a" })));
      } else {
        b.add(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14).translate(x, y + 0.06, z), lam("vlCheese", () => ({ color: "#f2cf5a" })));
      }
    }
  }
  b.build(g);
  for (let i = 0; i < 2; i++) basket(g, [-w / 2 + 0.4 + i * (w - 0.8), 0, d / 2 + 0.35], 0.26, 0.3, "#c99a52");
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.5, d + 0.6, 8, 4).rotateX(-Math.PI / 2 + 0.28),
    lam(`vlAwning${c1}${c2}`, () => ({ map: stripeTex(c1, c2, 10), side: THREE.DoubleSide })));
  cloth.position.set(0, 2.5, 0.05); cloth.castShadow = true; cloth.receiveShadow = true; g.add(cloth);
  return g;
};

/** one potato plant: three leafy lumps + a few violet-white blossoms */
const plant = (b: Batch, x: number, y: number, z: number, s: number, r: () => number, leaf: THREE.Material, flower: THREE.Material, eye: THREE.Material) => {
  for (let k = 0; k < 3; k++) b.add(new THREE.IcosahedronGeometry(0.2 * s * (0.8 + r() * 0.4), 1).scale(1, 0.8, 1).translate(x + (r() - 0.5) * 0.25, y + 0.18 * s + r() * 0.08, z + (r() - 0.5) * 0.22), leaf);
  if (r() < 0.7) for (let k = 0; k < 2; k++) { const fx = x + (r() - 0.5) * 0.3, fy = y + 0.42 * s + r() * 0.06, fz = z + (r() - 0.5) * 0.3;
    b.add(new THREE.SphereGeometry(0.045, 6, 4).translate(fx, fy, fz), flower); b.add(new THREE.SphereGeometry(0.018, 4, 3).translate(fx, fy + 0.035, fz), eye); }
};

export const valley: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const r = rng(4242);
  // ---------------- ground ----------------
  const gg = new THREE.PlaneGeometry(320, 320, 160, 160).rotateX(-Math.PI / 2);
  { const p = gg.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setY(i, vH(p.getX(i), p.getZ(i)) - 0.02); gg.computeVertexNormals(); }
  const ground = new THREE.Mesh(gg, lam("vlGrass", () => ({ map: rep(grassHD(), 40, 40) }))); ground.receiveShadow = true; root.add(ground);
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(26, 23).rotateX(-Math.PI / 2), lam("vlCobble", () => ({ map: rep(cobbleHD(), 1.6, 1.4) })));
  sq.position.set(0.5, 0.015, 1); sq.receiveShadow = true; root.add(sq);
  // the dirt path from the square up to the field gate (follows the slope)
  { const pts: THREE.Vector3[] = []; for (let i = 0; i <= 24; i++) { const u = i / 24, x = -11 - 11.4 * u, z = -3 - 15.3 * u; pts.push(V(x, vH(x, z) + 0.03, z)); }
    const pos: number[] = [], uv: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], c = pts[i + 1], dx = c.x - a.x, dz = c.z - a.z, L = Math.hypot(dx, dz), nx = (-dz / L) * 1.1, nz = (dx / L) * 1.1;
      const q = [V(a.x + nx, a.y, a.z + nz), V(a.x - nx, a.y, a.z - nz), V(c.x - nx, c.y, c.z - nz), V(c.x + nx, c.y, c.z + nz)];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(q[k].x, q[k].y, q[k].z); uv.push(k === 0 || k === 3 ? 0 : 1, (i + (k >= 2 ? 1 : 0)) * 0.5); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, lam("vlPath", () => ({ map: dirtTex(), side: THREE.DoubleSide }))); m.receiveShadow = true; root.add(m); }

  // ---------------- the royal potato field (plateau, y = FY) ----------------
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.x1 - FIELD.x0 + 1, FIELD.z1 - FIELD.z0 + 1).rotateX(-Math.PI / 2), lam("vlSoil", () => ({ map: rep(soilTex(), 1.1, 1.3) })));
  soil.position.set((FIELD.x0 + FIELD.x1) / 2, FY + 0.02, (FIELD.z0 + FIELD.z1) / 2); soil.receiveShadow = true; root.add(soil);
  const leaf = lam("vlLeaf", () => ({ map: leafTex() })), flower = lam("vlFlower", () => ({ color: "#d9c8fb" })), eye = lam("vlFlowerEye", () => ({ color: "#f6c430" }));
  const rows: THREE.Group[] = [], holes: THREE.Mesh[] = [];
  ROWS.forEach((x, i) => {
    const g = new THREE.Group(); g.position.set(x, FY, 0); root.add(g); rows.push(g);
    const rb = new Batch(), rr = rng(77 + i);
    for (let z = FIELD.z0 + 0.6; z <= FIELD.z1 - 0.6; z += 0.72) plant(rb, 0, 0.02, z, 1, rr, leaf, flower, eye);
    rb.build(g);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(1.3, FIELD.z1 - FIELD.z0 - 0.8).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: holeTex(), transparent: true, alphaTest: 0.3 }));
    h.position.set(x, FY + 0.04, (FIELD.z0 + FIELD.z1) / 2); h.visible = false; root.add(h); holes.push(h);
  });
  // dry-stone wall around the field, a gate gap on the east side (toward the village)
  const wallM = lam("vlWall", () => ({ map: rep(stoneHD("vlWallStone", ["#c9bca4", "#b9ab92", "#d6c9b0", "#a99c86"], "#8e826e"), 2, 0.5) }));
  const wx0 = FIELD.x0 - 1.2, wx1 = FIELD.x1 + 1.0, wz0 = FIELD.z0 - 1.2, wz1 = FIELD.z1 + 1.0, GATE: [number, number] = [-19.8, -16.8];
  const wallSeg = (x0: number, z0: number, x1: number, z1: number) => b.add(boxGeo(V(Math.min(x0, x1) - 0.28, FY - 0.3, Math.min(z0, z1) - 0.28), V(Math.max(x0, x1) + 0.28, FY + 0.85, Math.max(z0, z1) + 0.28), 1), wallM);
  wallSeg(wx0, wz0, wx1, wz0); wallSeg(wx0, wz1, wx1, wz1); wallSeg(wx0, wz0, wx0, wz1);
  wallSeg(wx1, wz0, wx1, GATE[0]); wallSeg(wx1, GATE[1], wx1, wz1);
  for (const z of GATE) b.add(boxGeo(V(wx1 - 0.35, FY - 0.3, z - 0.35), V(wx1 + 0.35, FY + 1.35, z + 0.35), 1), wallM);
  // coping stones on top
  for (let i = 0; i < 70; i++) { const side = i % 4, u = r(); const [x, z] = side === 0 ? [wx0 + u * (wx1 - wx0), wz0] : side === 1 ? [wx0 + u * (wx1 - wx0), wz1] : side === 2 ? [wx0, wz0 + u * (wz1 - wz0)] : [wx1, wz0 + u * (wz1 - wz0)];
    if (side === 3 && z > GATE[0] - 0.4 && z < GATE[1] + 0.4) continue;
    b.add(new THREE.DodecahedronGeometry(0.2 + r() * 0.12, 0).scale(1.3, 0.6, 1).translate(x, FY + 0.92, z), lam("vlCope", () => ({ color: "#b8ab94" }))); }
  // torches on posts: corners + middle of the long sides
  const torchPts: V3[] = [[wx0 + 0.6, FY, wz0 + 0.6], [wx0 + 0.6, FY, wz1 - 0.6], [wx1 - 0.6, FY, wz0 + 0.6], [wx1 - 0.6, FY, wz1 - 0.6], [-28.6, FY, wz0 + 0.6], [-28.6, FY, wz1 - 0.6], [wx1 - 0.6, FY, GATE[0] - 2.8]];
  const torches = torchPts.map((p, i) => torch(root, p, 2.3, i < 4 || i === 6, 9, 14));
  // the guards' drum + a stack of muskets at the south-east corner
  const drumG = new THREE.Group(); drumG.position.set(-24.3, FY, -25.9); root.add(drumG);
  { const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.62, 20, 1, true), lam("vlDrum", () => ({ map: stripeTex("#2f4fa0", "#e8c14a", 12), side: THREE.DoubleSide }))); shell.position.y = 0.31; drumG.add(shell);
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20).rotateX(-Math.PI / 2), lam("vlDrumHead", () => ({ color: "#f2e8d0" }))); head.position.y = 0.62; drumG.add(head);
    for (const y of [0.04, 0.58]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.03, 6, 20).rotateX(Math.PI / 2), lam("vlDrumRim", () => ({ color: "#b3262e" }))); ring.position.y = y; drumG.add(ring); } }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; b.add(new THREE.CylinderGeometry(0.025, 0.03, 1.9, 6).translate(0, 0.95, 0).rotateZ(0.2 * Math.cos(a)).rotateX(0.2 * Math.sin(a)).translate(-23.6, FY, -27.0), lam("vlMusket", () => ({ color: "#7a5a3a" }))); }
  barrel(root, [-25.6, FY, -26.9], 0.38);
  // the guard hut outside the west wall (window + door facing the field, +x)
  const hut = new THREE.Group(); hut.position.set(-39.6, FY, -21.0); root.add(hut);
  { const hb = new Batch(), plank = lam("vlHutPlank", () => ({ map: rep(planksHD(), 0.6, 0.6) })), rf = lam("vlHutRoof", () => ({ map: rep(roofHD("#8a5a44"), 1.5, 1) }));
    hb.add(boxGeo(V(-2.2, 0, -2.6), V(2.2, 2.8, 2.6), 1), plank);
    for (const s of [-1, 1]) hb.add(new THREE.BoxGeometry(5.2, 0.12, 3.4).rotateX(s * 0.52).translate(0, 3.55, s * 1.42), rf);
    hb.add(new THREE.BoxGeometry(0.06, 1.0, 1.1).translate(2.23, 1.65, 0.9), lam("vlHutWin", () => ({ color: "#ffd88a", emissive: "#a06a20" })));
    hb.add(new THREE.BoxGeometry(0.06, 2.0, 1.0).translate(2.23, 1.0, -1.2), lam("vlHutDoor", () => ({ map: beamHD() })));
    hb.build(hut); }
  const hutGlow = glow(root, [-37.3, FY + 1.65, -20.1], "#ffc060", 1.6, 0.8);
  // ---------------- the village (home base B) ----------------
  const H: [number, number, number, number, number, number, number][] = [
    [-6, -13.5, 0, 7, 6, 5.2, 0], [1.5, -14, 0, 6, 6, 6.2, 3], [9, -13.5, 0, 7, 6, 5.0, 4],
    [16.5, -5, -Math.PI / 2, 7, 6, 5.4, 6], [16.5, 3.5, -Math.PI / 2, 6.5, 6, 6.0, 1], [16.5, 11.5, -Math.PI / 2, 6, 6, 5.0, 3],
    [-5, 19.5, Math.PI, 7, 6, 5.2, 5], [3, 19.5, Math.PI, 6.5, 6, 6.0, 0], [11, 19.5, Math.PI, 7, 6, 5.0, 6],
  ];
  for (const [x, z, yaw, w, d, h, si] of H) house(b, x, z, yaw, w, d, h, si, 0);
  // church on the back hill
  { const cx = 7, cz = -40, cy = vH(cx, cz); const tw = lam("vlChurch", () => ({ map: rep(stoneHD("vlChurchStone", ["#efe3c8", "#e2d4b6", "#f4ead2", "#d8c9aa"], "#b8a888"), 1, 2) }));
    b.add(boxGeo(V(cx - 4, cy - 0.5, cz - 3), V(cx + 4, cy + 7, cz + 3), 1), tw);
    b.add(boxGeo(V(cx + 4, cy - 0.5, cz - 1.6), V(cx + 7.2, cy + 14, cz + 1.6), 1), tw);
    b.add(new THREE.ConeGeometry(2.4, 6, 4).rotateY(Math.PI / 4).translate(cx + 5.6, cy + 17, cz), lam("vlSpire", () => ({ color: "#6a7aa8" })));
    for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(9, 0.15, 3.8).rotateX(s * 0.6).translate(cx, cy + 8.2, cz + s * 1.55), lam("vlChurchRoof", () => ({ map: rep(roofHD("#c9775a"), 2, 1) }))); }
  // stalls, well, crate, sacks, barrels
  const stalls = [
    frenchStall(root, [-1.5, 0, -6.6], 0, 3.0, "#c8352e", "#f6efe0", "veg", 1),
    frenchStall(root, [4.6, 0, -6.6], 0, 2.6, "#2f6fc8", "#f6efe0", "bread", 2),
    frenchStall(root, [10.6, 0, 1.2], -Math.PI / 2, 2.6, "#2f9a5a", "#f6efe0", "cheese", 3),
  ];
  { const wc: V3 = [3.4, 0, 5.2], st = lam("vlWell", () => ({ map: rep(stoneHD("vlWellStone"), 1, 0.4) }));
    b.add(new THREE.CylinderGeometry(0.95, 1.0, 0.9, 20, 1, true).translate(wc[0], 0.45, wc[2]), st);
    b.add(new THREE.CircleGeometry(0.9, 20).rotateX(-Math.PI / 2).translate(wc[0], 0.7, wc[2]), lam("vlWellWater", () => ({ color: "#2a4a7a" })));
    for (const s of [-1, 1]) b.add(boxGeo(V(wc[0] + s * 0.85 - 0.07, 0.8, wc[2] - 0.07), V(wc[0] + s * 0.85 + 0.07, 2.4, wc[2] + 0.07)), M.beam());
    for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(2.3, 0.08, 0.9).rotateX(s * 0.55).translate(wc[0], 2.6, wc[2] + s * 0.36), lam("vlWellRoof", () => ({ map: rep(roofHD("#b8644f"), 0.6, 0.3) })));
    b.add(new THREE.CylinderGeometry(0.16, 0.13, 0.26, 10).translate(wc[0] + 0.3, 1.3, wc[2]), lam("vlBucket", () => ({ map: beamHD() }))); }
  crate(b, root, [-5.6, 0, -1.0], 0.85, "PIG FEED", 0.25);
  const feed = new Batch();
  for (let i = 0; i < 18; i++) feed.add(new THREE.SphereGeometry(0.075 + r() * 0.03, 7, 5).scale(1.25, 0.85, 1).translate(-5.6 + (r() - 0.5) * 0.6, 0.86 + r() * 0.1, -1.0 + (r() - 0.5) * 0.6), lam("vlPotato", () => ({ color: "#b88552" })));
  const feedG = new THREE.Group(); root.add(feedG); feed.build(feedG);
  for (const [x, z] of [[-4.7, -0.3], [-6.4, -0.1], [6.6, -5.3]]) sack(root, [x, 0, z], 0.3, "#d8bf86");
  barrel(root, [-3.0, 0, -5.6], 0.38); barrel(root, [8.3, 0, -5.4], 0.36); barrel(root, [13.6, 0, 6.4], 0.4);
  crate(b, root, [12.8, 0, -2.6], 0.7); crate(b, root, [13.4, 0.7, -2.4], 0.55, undefined, 0.4);
  // the pigsty: plank fence pen, mud, the trough on the east side
  const PEN = { x0: -11.2, x1: -7.2, z0: -5.2, z1: -1.6 };
  const mud = new THREE.Mesh(new THREE.PlaneGeometry(PEN.x1 - PEN.x0, PEN.z1 - PEN.z0).rotateX(-Math.PI / 2), lam("vlMud", () => ({ map: mudTex() })));
  mud.position.set((PEN.x0 + PEN.x1) / 2, 0.025, (PEN.z0 + PEN.z1) / 2); mud.receiveShadow = true; root.add(mud);
  { const fw = lam("vlFence", () => ({ map: beamHD() }));
    const run = (x0: number, z0: number, x1: number, z1: number, gap = false) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.1));
      for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n; b.add(new THREE.BoxGeometry(0.13, 1.15, 0.13).rotateZ((r() - 0.5) * 0.08).translate(x, 0.55, z), fw); }
      for (const y of [0.35, 0.8]) { if (gap && y > 0.5) continue; const m = new THREE.Matrix4().makeRotationY(-Math.atan2(z1 - z0, x1 - x0)).setPosition((x0 + x1) / 2, y, (z0 + z1) / 2); b.add(new THREE.BoxGeometry(L, 0.1, 0.06), fw, m); }
    };
    run(PEN.x0, PEN.z0, PEN.x1, PEN.z0); run(PEN.x0, PEN.z1, PEN.x1, PEN.z1); run(PEN.x0, PEN.z0, PEN.x0, PEN.z1); run(PEN.x1, PEN.z0, PEN.x1, PEN.z1, true); }
  const TR = { x: -7.75, z0: -4.3, z1: -2.5 };
  { const tw = lam("vlTrough", () => ({ map: beamHD() }));
    b.add(boxGeo(V(TR.x - 0.3, 0, TR.z0), V(TR.x + 0.3, 0.12, TR.z1)), tw);
    for (const s of [-1, 1]) b.add(boxGeo(V(TR.x + s * 0.3 - 0.05, 0, TR.z0), V(TR.x + s * 0.3 + 0.05, 0.42, TR.z1)), tw);
    for (const z of [TR.z0, TR.z1]) b.add(boxGeo(V(TR.x - 0.35, 0, z - 0.05), V(TR.x + 0.35, 0.42, z + 0.05)), tw); }
  const troughG = new THREE.Group(); root.add(troughG);
  { const tb = new Batch(); for (let i = 0; i < 16; i++) tb.add(new THREE.SphereGeometry(0.08 + r() * 0.03, 7, 5).scale(1.25, 0.85, 1).translate(TR.x + (r() - 0.5) * 0.4, 0.2 + r() * 0.08, TR.z0 + 0.15 + r() * (TR.z1 - TR.z0 - 0.3)), lam("vlPotato", () => ({ color: "#b88552" }))); tb.build(troughG); }
  // backyard potato gardens (scene 7)
  const gardens: THREE.Group[] = [];
  for (const [gx, gz, w, d] of [[-12.5, 13.5, 3.6, 3], [6.8, 13.6, 4, 2.6], [12.8, -9.6, 3, 3.4], [-2.6, -9.8, 3.2, 2.2], [-12.6, 4.2, 2.4, 3.6], [12.8, 14.6, 2.6, 2.4]] as const) {
    const pg = new THREE.Group(); pg.position.set(gx, 0, gz); root.add(pg);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), lam("vlSoilG", () => ({ map: rep(soilTex(), 0.25, 0.3) }))); s.position.y = 0.03; s.receiveShadow = true; root.add(s); s.position.set(gx, 0.03, gz);
    const gb = new Batch(), gr = rng(Math.round(gx * 10 + gz));
    for (let x = -w / 2 + 0.4; x < w / 2 - 0.2; x += 0.8) for (let z = -d / 2 + 0.4; z < d / 2 - 0.2; z += 0.7) plant(gb, x, 0.02, z, 0.85, gr, leaf, flower, eye);
    gb.build(pg); gardens.push(pg);
  }
  // trees, bushes, distant hills
  const trees = [[-13.5, 10.5, 7, 1], [21, -12, 8, 2], [-9, -17, 6.5, 3], [22, 18, 7.5, 4], [-18, 16, 8, 5], [-8, 30, 7, 6], [14, -24, 7, 7], [-52, -6, 8, 8], [-50, -36, 7, 9], [-30, -42, 7.5, 10], [-16, -30, 6, 11]]
    .map(([x, z, h, s]) => { const tg = new THREE.Group(); tg.position.set(0, vH(x, z), 0); root.add(tg); const tb = new Batch(); const t = tree(tb, tg, x, z, h, s); tb.build(tg); return t; });
  for (const [x, z, sx, sy, sz, c] of [[-120, -140, 90, 26, 50, "#6aa64e"], [60, -170, 120, 34, 60, "#5f9e4a"], [170, -40, 60, 20, 90, "#72ae54"], [-170, 40, 70, 22, 80, "#6aa64e"], [40, 150, 110, 18, 40, "#78b45a"]] as const)
    hill(root, [x, -1, z], sx, sy, sz, c, 5);
  // bunting across the square, lamps (glowing lanterns), chimney smoke, pigeons
  const bunts = [bunting(root, [-6, 4.6, -10.4], [9, 4.6, -10.4], 0.6, ["#c8352e", "#f6efe0", "#2f6fc8"], 0.45), bunting(root, [13.3, 4.4, 8.5], [13.3, 4.4, -8.5], 0.8, ["#f2c230", "#2f9a5a", "#c8352e"], 0.45)];
  const lamps = [lamp(root, [-9.8, 2.7, 6.6], "#ffb45a", 4, 8, "post"), lamp(root, [12.9, 2.7, -8.6], "#ffb45a", 4, 8, "post")];
  const smoke = [[-4.3, 8.1, -15.8], [3.4, 9.3, -16.3], [10.6, 7.9, -15.8], [18.8, 8.4, -4.0]].flatMap(([x, y, z]) => Array.from({ length: 4 }, () => puff(root, [x, y, z], 1.3, "#eef0f6", 0.55)));
  const flock = pigeons(root, 6, [2, 13, -4], 9, 3, 1.2, 5);
  // signs: the field's royal board at the gate (invented text, fits)
  sign(root, "ROYAL FIELD", 1.8, 0.5, [wx1 + 0.45, FY + 1.75, GATE[1] + 0.9], Math.PI / 2, "#2f4fa0", "#f6e7b8");
  // moon
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), color: new THREE.Color(1.3, 1.3, 1.25), transparent: true, depthWrite: false, fog: false }));
  moon.position.set(-230, 130, 40); moon.scale.set(34, 34, 1); moon.layers.set(NOINK); moon.renderOrder = -0.5; root.add(moon);
  b.build(root);

  // ---------------- marks ----------------
  const marks: Record<string, V3> = {
    // field (y = FY): the hero in the middle, soldiers ringing it just inside the wall, sergeant at the gate
    heroField: [-28.9, FY, -21], heroKneel: [-28.6, FY, -20.8], heroGate: [-23.6, FY, -19.4], heroLantern: [-25.4, FY, -23.6],
    sergeant: [-23.2, FY, -20.6], sol1: [-33.4, FY, -26.3], sol2: [-33.6, FY, -21.0], sol3: [-33.4, FY, -15.6], sol4: [-30.8, FY, -26.6], sol5: [-26.4, FY, -26.7], sol6: [-28.6, FY, -15.3],
    drum: [-24.3, FY, -25.9], diceA: [-24.3, FY, -24.8], diceB: [-23.2, FY, -25.7], diceC: [-25.4, FY, -26.0], gate: [-22.2, FY, -18.3], hutDoor: [-37.0, FY, -22.2],
    // village (y = 0)
    trough: [TR.x, 0.22, (TR.z0 + TR.z1) / 2], pig: [-9.0, 0, -3.4], feedCrate: [-5.6, 0, -1.0],
    farmer: [-5.9, 0, 0.6], vil1: [-4.2, 0, 1.2], vil2: [-1.2, 0, -4.9], vil3: [4.6, 0, -4.9], vil4: [1.6, 0, 1.6], vil5: [7.4, 0, -0.2], farmer2: [0.4, 0, -2.4], farmer3: [-2.6, 0, 3.4],
    heroSquare: [-2.4, 0, -1.2], heroBeg: [-4.9, 0, -0.1], well: [3.4, 0, 5.2], pathFoot: [-11, 0, -3], heroSty: [-6.2, 0, 1.4],
    gardenA: [-12.5, 0, 13.5], gardenB: [6.8, 0, 13.6], gardenC: [12.8, 0, -9.6], gardenD: [-2.6, 0, -9.8],
  };
  const cams: SetDef["cams"] = {
    field: { pos: [-21.0, FY + 3.4, -12.5], look: [-29, FY + 0.8, -21], fov: 42 },
    fieldLow: { pos: [-22.6, FY + 1.0, -24.6], look: [-31, FY + 1.0, -21.6], fov: 40 },
    square: { pos: [3, 3.2, 14.5], look: [-2, 1.4, -3], fov: 44 },
    sty: { pos: [-3.6, 1.7, 2.4], look: [-8.6, 0.6, -3.2], fov: 40 },
    hill: { pos: [-6, 6.5, 10], look: [-26, 4.5, -20], fov: 42 },
    hutOut: { pos: [-27, FY + 2.2, -18], look: [-38.6, FY + 1.6, -21], fov: 40 },
  };

  return {
    name: "valley", root, marks, cams,
    pose: (t, c) => {
      const planted = c.planted ?? 1, hk = c.holes ?? 0;
      rows.forEach((g, i) => { const k = Math.max(0, Math.min(1, planted * ROWS.length - (ROWS.length - 1 - i))); g.visible = k > 0.01 && hk < 0.5; g.scale.set(1, 0.15 + 0.85 * k, 1); });
      holes.forEach((h) => { h.visible = hk >= 0.5; });
      const tk = c.torches ?? 0;
      torches.forEach((tc) => { tc.flame.visible = tk > 0.05; tc.glow.visible = tk > 0.05; if (tc.light) tc.light.intensity = tk * tc.base; if (tk > 0.05) flickerTorch(tc, t); if (tc.light) tc.light.intensity *= tk; });
      hutGlow.visible = tk > 0.05;
      moon.visible = (c.moon ?? 0) > 0.05; (moon.material as THREE.SpriteMaterial).opacity = c.moon ?? 0;
      troughG.visible = (c.trough ?? 0) > 0.5;
      feedG.visible = (c.feed ?? 1) > 0.5;
      const gk = c.gardens ?? 0; gardens.forEach((g, i) => { const k = Math.max(0, Math.min(1, gk * 1.6 - i * 0.12)); g.visible = k > 0.01; g.scale.set(1, 0.1 + 0.9 * k, 1); });
      for (const tr of trees) swayTree(tr, t, 0.8);
      for (const bt of bunts) flutter(bt, t);
      for (const l of lamps) flicker(l, t);
      risePuffs(smoke, t, 3.2, 0.12, 1.8, c.smoke ?? 1);
      flock(t);
      void stalls; void drumG;
    },
  };
};
