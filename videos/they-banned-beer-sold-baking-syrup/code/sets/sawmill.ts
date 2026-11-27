// Hollow Creek sawmill (S12-S15). Bright spring green. The river runs along z (x 1.5..6.5) and recedes into the
// distance; the path runs along the near (left) bank toward a MOUNTAIN of sawdust (x -2.6..1.6, z -8..-4, ~5.5 m);
// two workers shovel it into the river. The mill (open front: circular saw + log) and its water wheel sit on the far bank.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri, house } from "../build";
import { grassHD, roofHD, stoneHD, beamHD, ctex, rng, rep } from "../paint";
import { NOINK } from "../ink";
import { lamp, flicker, glow, mist, sign, waterPlane, sawdustTex, WATER_U, rod, crate, barrel, sack } from "../setkit";
import { boardsV, beamStain, roundTree, leafTex, birds, metal, openBox, dotTex, TAU } from "./innerkit_b";
import type { SetDef, V3 } from "./types";

const dirtTex = () => ctex("millDirtB", 512, 512, (g, r) => {
  g.fillStyle = "#c79a64"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30; i++) { const x = r() * 512, y = r() * 512, rr = 30 + r() * 80; g.fillStyle = r() < 0.5 ? "rgba(150,108,62,0.25)" : "rgba(226,190,140,0.3)"; g.beginPath(); g.ellipse(x, y, rr, rr * 0.6, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "rgba(110,80,50,0.5)" : "rgba(245,226,190,0.7)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 5, 2 + r() * 3, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 8; i++) { g.strokeStyle = "rgba(120,86,50,0.35)"; g.lineWidth = 6; g.beginPath(); const x = r() * 512; g.moveTo(x, 0); g.bezierCurveTo(x + 20, 170, x - 20, 340, x + 10, 512); g.stroke(); } // cart ruts
});
const barkTex = () => ctex("millBarkB", 256, 256, (g, r) => {
  g.fillStyle = "#7a5236"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.strokeStyle = r() < 0.5 ? "rgba(60,36,22,0.6)" : "rgba(150,110,76,0.5)"; g.lineWidth = 2 + r() * 4; const x = r() * 256; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, 80, x - 10, 170, x + 6, 256); g.stroke(); }
});
const endTex = () => ctex("millEndB", 256, 256, (g) => {
  g.fillStyle = "#e9c88e"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(170,120,60,0.6)"; g.lineWidth = 3; for (let r = 12; r < 120; r += 12) { g.beginPath(); g.arc(128, 128, r, 0, TAU); g.stroke(); }
  g.strokeStyle = "#7a5236"; g.lineWidth = 16; g.beginPath(); g.arc(128, 128, 120, 0, TAU); g.stroke();
});
const sawBladeTex = () => ctex("millBladeB", 256, 256, (g) => {
  g.fillStyle = "#c9ced8"; g.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * TAU, rr = i % 2 ? 118 : 128; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); } g.fill();
  g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 80, -0.5, 1); g.stroke();
  g.strokeStyle = "rgba(90,96,110,0.6)"; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(128, 128, 30 + i * 14, i, i + 1.5); g.stroke(); }
  g.fillStyle = "#4b5468"; g.beginPath(); g.arc(128, 128, 18, 0, TAU); g.fill();
});

export const sawmill = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), shell = new Batch();
  const grass = lam("millGrass", () => ({ map: grassHD() }));
  const dirt = lam("millDirt", () => ({ map: dirtTex() }));
  const dust = lam("millDust", () => ({ map: rep(sawdustTex(), 5, 3) }));
  const dustFlat = lam("millDustFlat", () => ({ map: sawdustTex() }));
  const bark = lam("millBark", () => ({ map: barkTex() }));
  const endM = lam("millEnd", () => ({ map: endTex() }));
  const plank = lam("millBoards", () => ({ map: boardsV("millBoards", "#c0583c", 0.55) }));
  const trim = lam("millTrim", () => ({ map: beamStain("millTrim", "#f2e2c8", 0.0) }));
  const stone = lam("millStone", () => ({ map: stoneHD("millStoneRaw", ["#b8b0a2", "#aca496", "#c2baac", "#a29a8e"], "#7e766a") }));
  const roof = lam("millRoof", () => ({ map: roofHD("#6e5a8a", true) }));
  const iron = metal("millIron", "#4b5468", 40);
  const leaf = [lam("millLeafA", () => ({ map: leafTex("a", "#5fae46", "#8fd060", "#3f8a3a") })), lam("millLeafB", () => ({ map: leafTex("b", "#74b84a", "#a6dc6a", "#4f9a3e") }))];
  const trunk = lam("millTrunk", () => ({ color: "#8a5a3c" }));
  const r = rng(91);
  // ---- ground: near bank (left), far bank (right), sloped banks, the river (x 1.5..6.5, flows toward +z) ----
  shell.add(quad(V(-40, 0, 25), V(1.4, 0, 25), V(1.4, 0, -80), V(-40, 0, -80), 41.4 / 4, 105 / 4), grass);
  shell.add(quad(V(1.4, 0, 25), V(2.0, -0.55, 25), V(2.0, -0.55, -80), V(1.4, 0, -80), 0.3, 26), dirt);
  shell.add(quad(V(6.1, -0.55, 25), V(6.6, 0.1, 25), V(6.6, 0.1, -80), V(6.1, -0.55, -80), 0.3, 26), dirt);
  shell.add(quad(V(6.6, 0.1, 25), V(50, 0.1, 25), V(50, 0.1, -80), V(6.6, 0.1, -80), 43.4 / 4, 105 / 4), grass);
  const river = waterPlane(root, 1.0, 7.0, -90, 30, -0.3);
  // the dirt path along the near bank
  shell.add(quad(V(-1.25, 0.01, 22), V(0.6, 0.01, 22), V(0.6, 0.01, -3.5), V(-1.25, 0.01, -3.5), 0.6, 8), dirt);
  // ---- the MOUNTAIN of sawdust (scale gag) with a tiny flag on top, slide streaks, a spill into the river ----
  const prof: THREE.Vector2[] = []; for (let i = 0; i <= 16; i++) { const u = i / 16; prof.push(new THREE.Vector2(Math.max(0.001, 4.3 * Math.pow(1 - u, 1.3) * (1 + 0.05 * Math.sin(u * 23))), u * 9.2)); }
  const mg = new THREE.LatheGeometry(prof, 48); const mp = mg.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < mp.count; i++) { const x = mp.getX(i), y = mp.getY(i), z = mp.getZ(i), a = Math.atan2(z, x); const k = 1 + 0.07 * Math.sin(a * 5 + y) + 0.05 * Math.sin(a * 11 - y * 2); mp.setXYZ(i, x * k, y, z * k); }
  mg.computeVertexNormals();
  const mountain = new THREE.Mesh(mg, dust); mountain.position.set(-1.7, -0.05, -7.6); mountain.scale.set(1, 1, 0.9); mountain.castShadow = mountain.receiveShadow = true; root.add(mountain);
  const spill = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 8, 0, TAU, 0, Math.PI / 2), dust); spill.scale.set(1.8, 0.7, 3.2); spill.position.set(2.0, -0.35, -7.4); root.add(spill);
  for (let i = 0; i < 6; i++) { const lump = new THREE.Mesh(new THREE.SphereGeometry(0.4 + r() * 0.5, 14, 8, 0, TAU, 0, Math.PI / 2), dust); lump.scale.y = 0.5; const a = r() * TAU; lump.position.set(-1.7 + Math.cos(a) * 4.2, 0, -7.6 + Math.sin(a) * 3.8); root.add(lump); }
  rod(root, [-1.7, 9.0, -7.6], [-1.7, 9.9, -7.6], 0.025, trunk);
  const flagM = lam("millFlag", () => ({ color: "#e0453a", side: THREE.DoubleSide }));
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25, 6, 1).translate(0.2, 0, 0), flagM); flag.position.set(-1.7, 9.75, -7.6); root.add(flag);
  // a shovel stuck high up, a ladder leaning on it
  rod(root, [0.0, 4.6, -5.9], [0.3, 5.7, -5.5], 0.03, trunk); b.add(new THREE.BoxGeometry(0.28, 0.34, 0.04).rotateZ(-0.3).translate(-0.08, 4.5, -5.95), iron);
  for (const s of [-1, 1]) rod(root, [-2.6 + s * 0.22, 0, -3.4], [-2.3 + s * 0.22, 3.6, -5.1], 0.035, trunk);
  for (let k = 1; k < 10; k++) { const u = k / 10; rod(root, [-2.6 - 0.22 + 0.3 * u, 3.6 * u, -3.4 - 1.7 * u], [-2.6 + 0.22 + 0.3 * u, 3.6 * u, -3.4 - 1.7 * u], 0.025, trunk); }
  // a little plank jetty over the river where the second worker shovels from the slump
  const jetty = lam("millJetty", () => ({ map: beamStain("millJetty", "#b08a60", 0.2) }));
  b.add(boxGeo(V(1.3, -0.05, -5.7), V(3.0, 0.02, -4.3), 1.5), jetty);
  for (const [x, z] of [[1.45, -5.55], [2.85, -5.55], [1.45, -4.45], [2.85, -4.45]]) b.add(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8).translate(x, -0.5, z), trunk);
  // ---- wheelbarrow full of sawdust, log piles, crates, barrels, fence, flowers ----
  const wb = new THREE.Group(); wb.position.set(-1.9, 0, -2.6); wb.rotation.y = 0.7; root.add(wb);
  const wbb = new Batch(); const wbm = lam("millBarrow", () => ({ color: "#3f7fb8" }));
  openBox(wbb, V(-0.45, 0.35, -0.3), V(0.45, 0.7, 0.3), 0.04, wbm); wbb.build(wb);
  const wbd = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 8, 0, TAU, 0, Math.PI / 2), dustFlat); wbd.scale.set(1, 0.45, 0.68); wbd.position.y = 0.66; wb.add(wbd);
  const wh = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 18), lam("millTyre", () => ({ color: "#3a3440" }))); wh.position.set(0.62, 0.22, 0); wb.add(wh);
  for (const s of [-1, 1]) { rod(wb, [0.6, 0.25, s * 0.06], [-0.9, 0.62, s * 0.28], 0.025, trunk); rod(wb, [-0.2, 0.35, s * 0.25], [-0.25, 0, s * 0.25], 0.025, trunk); }
  const logPile = (x: number, z: number, yaw: number, n: number) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; root.add(g);
    let k = 0; for (let row = 0; row < n; row++) for (let i = 0; i < n - row; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.6, 14).rotateZ(Math.PI / 2), [bark, endM, endM]); lg.position.set(0, 0.22 + row * 0.38, (i - (n - row - 1) / 2) * 0.45); lg.castShadow = lg.receiveShadow = true; g.add(lg); k++; }
  };
  logPile(-3.2, -0.6, 0.15, 4); logPile(10.5, -6.5, Math.PI / 2, 3); logPile(-4.2, -10, 0.4, 3);
  crate(b, root, [-2.2, 0, 2.6], 0.7, "HOLLOW\nCREEK", 0.4); barrel(root, [-2.7, 0, 1.6], 0.38); sack(root, [-1.85, 0, 1.4], 0.26, "#d9b46a");
  const fenceM = lam("millFence", () => ({ map: beamHD() }));
  for (let z = 22; z > -2; z -= 1.6) b.add(boxGeo(V(-1.75, 0, z - 0.06), V(-1.63, 1.05, z + 0.06)), fenceM);
  for (const y of [0.45, 0.85]) b.add(boxGeo(V(-1.73, y, -2), V(-1.65, y + 0.09, 22), 3), fenceM);
  const fl = ["#f4d24a", "#f3a9bb", "#ffffff", "#c88ae8", "#ff8a5a"].map((c) => lam("millFlower" + c, () => ({ color: c })));
  const stem = lam("millStem", () => ({ color: "#3f8a3a" }));
  for (let i = 0; i < 70; i++) { const x = -1.6 - r() * 6, z = 22 - r() * 26, h = 0.15 + r() * 0.2; b.add(new THREE.CylinderGeometry(0.008, 0.008, h, 4).translate(x, h / 2, z), stem); b.add(new THREE.IcosahedronGeometry(0.05 + r() * 0.03, 0).translate(x, h, z), fl[i % 5]); }
  for (let i = 0; i < 40; i++) { const x = 7 + r() * 8, z = 10 - r() * 30, h = 0.2 + r() * 0.2; b.add(new THREE.CylinderGeometry(0.01, 0.01, h, 4).translate(x, 0.1 + h / 2, z), stem); b.add(new THREE.IcosahedronGeometry(0.06, 0).translate(x, 0.1 + h, z), fl[(i + 2) % 5]); }
  // ---- round stylised trees on both banks + hills ----
  for (const [x, z, h] of [[-4.5, 4, 4.2], [-6, -3, 5], [-3.8, -13, 4.6], [-7, -18, 5.5], [-5, 12, 4.8], [-9, 2, 6], [-2.5, -16, 4], [-8.5, -8, 5.2], [-11, -14, 6.5]] as [number, number, number][]) roundTree(b, x, z, h, Math.round(x * 3 - z), leaf[Math.abs(Math.round(x + z)) % 2], trunk);
  for (const [x, z, h] of [[13.0, 3, 4.6], [13.5, -6, 5.4], [8, -20, 5], [12, -18, 6], [15, -28, 6.5], [9, -32, 5], [4, -40, 6], [-1, -36, 5.5], [11, 6, 5]] as [number, number, number][]) roundTree(b, x, z, h, Math.round(x * 5 + z), leaf[Math.abs(Math.round(x - z)) % 2], trunk, x > 6.5 ? 0.1 : 0);
  const hill = lam("millHill", () => ({ map: rep(grassHD(), 8, 4) }));
  for (let i = 0; i < 6; i++) b.add(new THREE.SphereGeometry(1, 24, 10, 0, TAU, 0, Math.PI / 2).scale(16 + r() * 8, 6 + r() * 5, 10).translate(-30 + i * 14, 0, -70 - r() * 10), hill);
  house(b, -10, -26, 0.3, 6, 5, 5.5, 3, 0);
  // ---- the mill on the far bank: stone base, red board walls, slate roof, open front (+z) with saw + log ----
  const MX0 = 6.9, MX1 = 12.2, MZ0 = -15.5, MZ1 = -9.6, MH = 3.6, MR = 6.0, MRX = (MX0 + MX1) / 2;
  b.add(boxGeo(V(MX0 - 0.1, -0.6, MZ0 - 0.1), V(MX1 + 0.1, 0.6, MZ1 + 0.1), 2), stone);
  shell.add(boxGeo(V(MX0, 0.6, MZ0), V(MX0 + 0.15, MH, MZ1), 2.5), plank);
  shell.add(boxGeo(V(MX1 - 0.15, 0.6, MZ0), V(MX1, MH, MZ1), 2.5), plank);
  shell.add(boxGeo(V(MX0, 0.6, MZ0), V(MX1, MH, MZ0 + 0.15), 2.5), plank);
  shell.add(tri(V(MX0, MH, MZ1), V(MX1, MH, MZ1), V(MRX, MR, MZ1)), plank); shell.add(tri(V(MX1, MH, MZ0), V(MX0, MH, MZ0), V(MRX, MR, MZ0)), plank);
  b.add(boxGeo(V(MX0, MH - 0.25, MZ1 - 0.1), V(MX1, MH, MZ1 + 0.05), 3), trim); // header over the open front
  for (const x of [MX0 + 0.1, MX1 - 0.1, MRX]) b.add(boxGeo(V(x - 0.1, 0.6, MZ1 - 0.1), V(x + 0.1, MH, MZ1 + 0.1), 3), trim);
  const rq = (a: THREE.Vector3, bb: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) => shell.add(quad(a, bb, c, d, 2, 1.6), roof);
  rq(V(MX0 - 0.4, MH - 0.25, MZ1 + 0.5), V(MX0 - 0.4, MH - 0.25, MZ0 - 0.5), V(MRX, MR + 0.15, MZ0 - 0.5), V(MRX, MR + 0.15, MZ1 + 0.5));
  rq(V(MX1 + 0.4, MH - 0.25, MZ0 - 0.5), V(MX1 + 0.4, MH - 0.25, MZ1 + 0.5), V(MRX, MR + 0.15, MZ1 + 0.5), V(MRX, MR + 0.15, MZ0 - 0.5));
  b.add(boxGeo(V(MX1 - 1.4, 4.0, MZ0 + 0.8), V(MX1 - 0.8, 6.8, MZ0 + 1.4), 2), stone); // chimney
  const smoke = [0, 1, 2, 3].map(() => mist(root, [MX1 - 1.1, 7, MZ0 + 1.1], 1.2, "#f2f0f6", 0.5));
  const floorM = lam("millFloor", () => ({ map: beamStain("millFloor", "#d8a878", 0.15) }));
  b.add(boxGeo(V(MX0, 0.6, MZ0), V(MX1, 0.66, MZ1), 2), floorM);
  sign(root, "HOLLOW CREEK MILL", 3.6, 0.62, [MRX, 4.55, MZ1 + 0.06], 0, "#f3e2b2", "#5a1e10");
  // inside: saw bench, the big circular saw (spins), the log on its carriage, sawdust spray, a lamp + lit back window
  b.add(boxGeo(V(MRX - 1.8, 0.66, -12.9), V(MRX + 1.8, 1.45, -12.1), 2), floorM);
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.025, 40).rotateX(Math.PI / 2), [iron, new THREE.MeshLambertMaterial({ map: sawBladeTex() }), new THREE.MeshLambertMaterial({ map: sawBladeTex() })]);
  blade.position.set(MRX + 0.2, 1.75, -12.5); blade.rotation.y = Math.PI / 2; root.add(blade);
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 3.0, 16).rotateZ(Math.PI / 2), [bark, endM, endM]); log.position.set(MRX - 0.6, 1.8, -12.0); log.castShadow = true; root.add(log);
  const sawL = lamp(root, [MRX - 1.4, 2.9, -11.2], "#ffc46a", 5, 7, "hang");
  const bw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffcf7a").multiplyScalar(1.5) })); bw.position.set(MX0 + 1.4, 2.3, MZ0 + 0.17); bw.layers.set(NOINK); root.add(bw);
  glow(root, [MX0 + 1.4, 2.3, MZ0 + 0.3], "#ffc46a", 2.2, 0.6);
  const winL = new THREE.PointLight("#ffc46a", 4, 6, 1.4); winL.position.set(MX0 + 1.4, 2.3, MZ0 + 1.0); root.add(winL);
  const sprayN = 80, sp = new Float32Array(sprayN * 3); const sprayG = new THREE.BufferGeometry(); sprayG.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const dustPM = new THREE.PointsMaterial({ map: dotTex(), size: 0.09, color: "#f0c070", transparent: true, depthWrite: false });
  const spray = new THREE.Points(sprayG, dustPM); spray.layers.set(NOINK); spray.frustumCulled = false; root.add(spray);
  // the water wheel on the river side of the mill (axle along x, turns with the flow)
  const wheel = new THREE.Group(); wheel.position.set(6.55, 1.0, -12.4); root.add(wheel);
  const wwM = lam("millWheel", () => ({ map: beamStain("millWheel", "#a0704a", 0.2) }));
  for (const s of [-0.35, 0.35]) { const rimM = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.07, 8, 40).rotateY(Math.PI / 2), wwM); rimM.position.x = s; wheel.add(rimM); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; const pd = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.06), wwM); pd.position.set(0, Math.cos(a) * 1.7, Math.sin(a) * 1.7); pd.rotation.x = -a; pd.castShadow = true; wheel.add(pd); const sk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.4, 0.06), wwM); sk.rotation.x = a / 2; if (i < 6) wheel.add(sk); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 12).rotateZ(Math.PI / 2), iron); wheel.add(hub);
  const splash = [0, 1, 2].map((i) => mist(root, [6.55, -0.1, -11.6 + i * 0.6], 1.0, "#ffffff", 0.5));
  rod(root, [6.0, 1.0, -12.4], [MX0, 1.0, -12.4], 0.1, iron);
  // a lantern post by the path + a road sign
  const postL = lamp(root, [-1.35, 2.6, 2.2], "#ffc46a", 4, 6, "post");
  sign(root, "HOLLOW CREEK MILL  >", 1.3, 0.27, [-1.5, 1.3, 1.2], 0.35, "#f3e2b2", "#5a1e10");
  rod(root, [-1.5, 0, 1.18], [-1.5, 1.18, 1.18], 0.05, fenceM);
  // ---- sawdust flying off the shovels into the river and floating downstream (+z) ----
  const W = [[1.15, -3.25], [2.35, -5.0]] as const;
  const N = 240, pp = new Float32Array(N * 3), pseed = new Float32Array(N);
  for (let i = 0; i < N; i++) pseed[i] = r();
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const specks = new THREE.Points(pg, new THREE.PointsMaterial({ map: dotTex(), size: 0.075, color: "#f2c46e", transparent: true, depthWrite: false }));
  specks.layers.set(NOINK); specks.frustumCulled = false; root.add(specks);
  const rafts = Array.from({ length: 14 }, (_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.3 + (i % 3) * 0.12, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: sawdustTex(), color: new THREE.Color("#ffe0a0"), transparent: true, opacity: 0.85, depthWrite: false })); m.scale.set(1, 1, 0.6 + (i % 2) * 0.4); m.layers.set(NOINK); root.add(m); return m; });
  const bird = birds(root, 3, [3, 9, -14], 9);
  shell.build(root, true); b.build(root);
  const marks: Record<string, V3> = { pathA: [-0.35, 0, 8.0], pathB: [-0.3, 0, -1.6], mill1: [W[0][0], 0, W[0][1]], mill2: [W[1][0], 0, W[1][1]], magnifier: [-0.25, 0, -2.3], wheel: [6.55, 0, -12.4] };
  const cams = {
    walk: { pos: [-0.9, 1.7, 10.5] as V3, look: [0.3, 3.5, -6.0] as V3, fov: 56 },
    mountain: { pos: [8.2, 1.8, 4.2] as V3, look: [-0.6, 4.1, -6.8] as V3, fov: 58 },
    close: { pos: [-0.7, 1.45, 0.4] as V3, look: [-0.3, 1.2, -2.3] as V3, fov: 46 },
  };
  return {
    name: "sawmill", root, marks, cams,
    pose: (t, c) => {
      WATER_U.wFlow.value.set(0, 0.55);
      flicker(sawL, t); flicker(postL, t); winL.intensity = 4 * (0.92 + 0.08 * Math.sin(t * 9));
      wheel.rotation.x = t * 0.6; blade.rotation.z = -t * 14;
      log.position.z = -12.0 + 0.25 * Math.sin(t * 0.5);
      const fp = flag.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i); fp.setZ(i, 0.06 * (x / 0.4) * Math.sin(t * 6 - x * 10)); } fp.needsUpdate = true;
      smoke.forEach((m, i) => { const u = (t * 0.15 + i * 0.25) % 1; m.position.set(MX1 - 1.1 + u * 1.5, 7 + u * 4, MZ0 + 1.1); (m.material as THREE.SpriteMaterial).opacity = 0.5 * (1 - u); m.scale.set(0.9 + u * 2.5, (0.9 + u * 2.5) * 0.7, 1); });
      splash.forEach((m, i) => { const u = (t * 0.8 + i / 3) % 1; m.position.y = -0.2 + u * 0.6; (m.material as THREE.SpriteMaterial).opacity = 0.55 * (1 - u); m.scale.set(0.6 + u, 0.4 + u * 0.6, 1); });
      for (let i = 0; i < sprayN; i++) { const u = (t * 1.5 + i / sprayN) % 1, a = -0.4 + (i % 7) * 0.13; sp[i * 3] = MRX + 0.2 - Math.cos(a) * 0.2 * (1 + u * 3); sp[i * 3 + 1] = 1.3 + Math.sin(a) * 0.4 + u * 0.4 - u * u * 0.9; sp[i * 3 + 2] = -12.0 + u * 1.2 + (i % 5) * 0.05; }
      sprayG.attributes.position.needsUpdate = true;
      // shovel throws: each worker every 1.6 s; specks fly 0.9 s then float with the flow, fading at the end of their 8 s life
      const L = 8, P = 1.6, per = N / 2, bursts = L / P;
      for (let i = 0; i < N; i++) {
        const w = i < per ? 0 : 1, j = i % per, k = Math.floor(j / (per / bursts)), s = pseed[i];
        const age = (t + k * P + w * 0.8) % L;
        const [wx, wz] = W[w], sx = wx + 0.35, sy = 1.1, sz = wz;
        const vx = 1.6 + s * 1.8, vz = (s - 0.5) * 1.4 + 0.3, vy = 2.0 + ((s * 7) % 1) * 1.2;
        let x, y, z;
        if (age < 0.9) { x = sx + vx * age; y = sy + vy * age - 4.9 * age * age; z = sz + vz * age; if (y < -0.27) y = -0.27; }
        else { const a2 = age - 0.9; x = sx + vx * 0.9 + Math.sin(a2 + s * 9) * 0.1; y = -0.27; z = sz + vz * 0.9 + a2 * 0.55; }
        pp[i * 3] = x; pp[i * 3 + 1] = y; pp[i * 3 + 2] = z;
      }
      pg.attributes.position.needsUpdate = true;
      rafts.forEach((m, i) => { const zz = -9 + (((t * 0.55 + i * 2.3) % 30)); m.position.set(2.4 + (i * 1.37) % 3.4, -0.285, zz); m.rotation.y = i + t * 0.05; (m.material as THREE.MeshBasicMaterial).opacity = 0.85 * Math.min(1, (30 - (zz + 9)) / 6); });
      bird(t);
      void river; void c;
    },
  };
};
