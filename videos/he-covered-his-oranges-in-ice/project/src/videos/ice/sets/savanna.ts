// THE SAVANNA ("Why He Painted Eyes on Cows' Butts"), one set, ground y = 0:
//  - home base: the village kraal at the origin, a ring of piled thorn branches (radius 8.2) with a gate gap facing +z,
//    a pole fence just outside the gate (the farmers sit on its top rail, z = 10.6), the hero's tally board on a post at
//    the gate (x = 4.4, z = 9.0, chalk numbers drawn by the shots as cards), paint pots + a stool, a water trough,
//    a fire pit (smoke), lantern posts for the nights;
//  - round mud huts with thatched cones and flat-top acacias around it, a termite mound;
//  - the riverbank to the north-west (x -46, z -40): water, reeds, a termite mound the hero sits on (scene 2);
//  - the tall-grass patch west of the kraal (x -26 .. -12, z -8 .. 8): the lion's cover (scenes 6 + 7);
//  - the open plain east (x 30 .. 110), distant hills, for the payoff herd (scene 9).
// Controls: night 0..1 (lanterns + fire glow + moon), fire 0..1 (flames), dust 0..1 (dust haze over the plain).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rng, rep, planksHD, beamHD } from "../paint";
import { glow, lamp, flicker, barrel, sack } from "../setkit";
import { puff, risePuffs, hill, TAU, torch, flickerTorch } from "./portkit_common";
import { NOINK } from "../ink";
import type { SetDef, SetBuilder, V3 } from "./types";

export const KR = 8.2; // kraal radius
const savTex = () => ctex("svGrass", 1024, 1024, (g, r) => {
  g.fillStyle = "#d6b066"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 60; i++) { const x = r() * 1024, y = r() * 1024, rr = 60 + r() * 160; const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    const c = r() > 0.5 ? "rgba(196,150,82,0.5)" : "rgba(226,196,120,0.5)"; gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024); }
  for (let i = 0; i < 6000; i++) { const x = r() * 1024, y = r() * 1024, h = 6 + r() * 14, lean = (r() - 0.5) * 6;
    g.strokeStyle = r() > 0.6 ? "rgba(150,110,52,0.55)" : r() > 0.5 ? "rgba(240,214,140,0.6)" : "rgba(176,140,70,0.5)"; g.lineWidth = 1.4 + r();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean, y - h); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(120,140,70,0.35)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 10 + r() * 30, 5 + r() * 12, r() * 3, 0, 7); g.fill(); }
});
const dirtTex = () => ctex("svDirt", 1024, 1024, (g, r) => {
  g.fillStyle = "#b48a5c"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 1800; i++) { g.fillStyle = r() > 0.5 ? "rgba(122,86,54,0.35)" : "rgba(222,190,140,0.35)"; g.beginPath(); g.arc(r() * 1024, r() * 1024, 2 + r() * 6, 0, 7); g.fill(); }
  for (let i = 0; i < 160; i++) { const x = r() * 1024, y = r() * 1024; g.strokeStyle = "rgba(110,76,46,0.4)"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 6 + r() * 6, 0.3, 2.8); g.stroke(); } // hoofprints
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(90,62,40,0.5)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 10 + r() * 14, 6 + r() * 8, r() * 3, 0, 7); g.fill(); }
});
const mudTex = () => ctex("svMudWall", 1024, 512, (g, r) => {
  g.fillStyle = "#c98a58"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? "rgba(160,100,62,0.3)" : "rgba(232,180,130,0.35)"; g.beginPath(); g.ellipse(r() * 1024, r() * 512, 8 + r() * 26, 4 + r() * 10, r() * 3, 0, 7); g.fill(); }
  // painted band of triangles (decorated lower wall) + a darker plinth
  g.fillStyle = "#8a4a30"; g.fillRect(0, 430, 1024, 82);
  g.fillStyle = "#f2e2c2"; g.fillRect(0, 330, 1024, 18); g.fillRect(0, 410, 1024, 14);
  for (let x = 0; x < 1024; x += 64) { g.fillStyle = (x / 64) % 2 ? "#3a2a2a" : "#b8462e"; g.beginPath(); g.moveTo(x, 410); g.lineTo(x + 32, 352); g.lineTo(x + 64, 410); g.fill(); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(120,70,40,0.4)"; g.lineWidth = 2; let x = r() * 1024, y = r() * 300; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 40; y += 10 + r() * 20; g.lineTo(x, y); } g.stroke(); } // cracks
});
const thatchTex = () => ctex("svThatch", 1024, 1024, (g, r) => {
  g.fillStyle = "#c9a05a"; g.fillRect(0, 0, 1024, 1024);
  for (let row = 0; row < 18; row++) { const y0 = row * 58; g.fillStyle = row % 2 ? "rgba(120,86,40,0.35)" : "rgba(0,0,0,0)"; g.fillRect(0, y0 + 46, 1024, 12);
    for (let i = 0; i < 260; i++) { const x = r() * 1024; g.strokeStyle = r() > 0.5 ? "rgba(236,200,120,0.85)" : "rgba(150,108,52,0.7)"; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (r() - 0.5) * 6, y0 + 56 + r() * 10); g.stroke(); } }
});
const barkTex = () => ctex("svBark", 256, 512, (g, r) => {
  g.fillStyle = "#6e5240"; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 120; i++) { g.strokeStyle = r() > 0.5 ? "rgba(60,40,30,0.6)" : "rgba(150,120,96,0.45)"; g.lineWidth = 2 + r() * 3; const x = r() * 256; g.beginPath(); g.moveTo(x, r() * 512); g.lineTo(x + (r() - 0.5) * 12, r() * 512); g.stroke(); }
});
const canopyTex = () => ctex("svCanopy", 512, 512, (g, r) => {
  g.fillStyle = "#6f8a3a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.55 ? "#8aa848" : r() > 0.5 ? "#55702c" : "#7c9a40"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 5 + r() * 9, 3 + r() * 5, r() * 3, 0, 7); g.fill(); }
});
const bladeTex = () => ctex("svBlade", 256, 256, (g, r) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { const x = 8 + r() * 240, h = 120 + r() * 130, lean = (r() - 0.5) * 70, w = 3 + r() * 4;
    g.fillStyle = r() > 0.5 ? "#e0bc6a" : r() > 0.5 ? "#c89a4c" : "#b48640";
    g.beginPath(); g.moveTo(x - w, 256); g.quadraticCurveTo(x + lean * 0.4, 256 - h * 0.6, x + lean, 256 - h); g.quadraticCurveTo(x + lean * 0.4 + w * 0.5, 256 - h * 0.6, x + w, 256); g.fill(); }
});
const waterTex = () => ctex("svRiver", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#5a8ab8"); gr.addColorStop(1, "#3f6e9e"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.strokeStyle = "rgba(220,236,250,0.5)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 3, x + 30 + r() * 20, y); g.stroke(); }
});

/** a round mud hut with a thatched cone; door faces `yaw` */
const hut = (b: Batch, x: number, z: number, rad: number, yaw: number, r: () => number) => {
  const wall = lam("svHutWall", () => ({ map: rep(mudTex(), 2, 1) })), th = lam("svHutThatch", () => ({ map: rep(thatchTex(), 3, 1.2) }));
  const h = 2.1 + r() * 0.3;
  b.add(new THREE.CylinderGeometry(rad, rad * 1.04, h, 28, 1, true).translate(x, h / 2, z), wall);
  b.add(new THREE.ConeGeometry(rad * 1.38, rad * 1.15, 28, 1, true).translate(x, h + rad * 0.5, z), th);
  b.add(new THREE.CylinderGeometry(0.12, 0.02, 0.5, 6).translate(x, h + rad * 1.15, z), lam("svFinial", () => ({ color: "#8a6a3a" }))); // roof finial
  const dx = Math.sin(yaw), dz = Math.cos(yaw);
  b.add(new THREE.BoxGeometry(0.9, 1.55, 0.12).rotateY(yaw).translate(x + dx * rad * 1.01, 0.78, z + dz * rad * 1.01), lam("svHutDoor", () => ({ color: "#3a2a2e" })));
  b.add(new THREE.BoxGeometry(1.1, 0.12, 0.2).rotateY(yaw).translate(x + dx * rad * 1.02, 1.6, z + dz * rad * 1.02), lam("svLintel", () => ({ map: beamHD() })));
};
/** a flat-topped acacia: a leaning trunk that forks, wide flat canopy pads */
export type Acacia = { g: THREE.Group; seed: number };
const acacia = (parent: THREE.Object3D, x: number, z: number, h: number, seed: number): Acacia => {
  const r = rng(seed), g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const b = new Batch(), bark = lam("svBark", () => ({ map: barkTex() })), leaf = lam("svCanopy", () => ({ map: canopyTex() }));
  const lean = (r() - 0.5) * 0.25;
  b.add(new THREE.CylinderGeometry(0.16 * h / 6, 0.28 * h / 6, h * 0.6, 8).translate(0, h * 0.3, 0).rotateZ(lean), bark);
  const top = V(-Math.sin(lean) * h * 0.6, h * 0.6, 0);
  const crown = new THREE.Group(); crown.position.copy(top); g.add(crown);
  const cb = new Batch();
  for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + r(), L = h * (0.32 + r() * 0.1);
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7)); const geo = new THREE.CylinderGeometry(0.06 * h / 6, 0.12 * h / 6, L, 6).translate(0, L / 2, 0); geo.applyMatrix4(m); cb.add(geo, bark); }
  const W = h * (0.85 + r() * 0.3);
  for (let k = 0; k < 7; k++) { const a = r() * TAU, d = r() * W * 0.45;
    cb.add(new THREE.IcosahedronGeometry(1, 1).scale(W * (0.32 + r() * 0.18), h * 0.09, W * (0.28 + r() * 0.14)).translate(Math.cos(a) * d, h * 0.28 + r() * h * 0.06, Math.sin(a) * d), leaf); }
  b.build(g); cb.build(crown);
  return { g: crown, seed };
};

export const savanna: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch(), r = rng(9191);
  // ---------------- ground ----------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, 1, 1).rotateX(-Math.PI / 2), lam("svGround", () => ({ map: rep(savTex(), 46, 46) })));
  ground.position.y = -0.01; ground.receiveShadow = true; root.add(ground);
  const kd = new THREE.Mesh(new THREE.CircleGeometry(KR + 0.6, 48).rotateX(-Math.PI / 2), lam("svKraal", () => ({ map: rep(dirtTex(), 2.4, 2.4) })));
  kd.position.y = 0.012; kd.receiveShadow = true; root.add(kd);
  // a trodden dirt yard in front of the gate and the path to the huts
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(16, 9).rotateX(-Math.PI / 2), lam("svYard", () => ({ map: rep(dirtTex(), 2, 1.2), transparent: false })));
  yard.position.set(0, 0.011, 12.5); yard.receiveShadow = true; root.add(yard);

  // ---------------- the kraal: piled thorn branches in a ring, gate gap at +z ----------------
  const thorn = lam("svThorn", () => ({ color: "#5e4636" })), thornL = lam("svThornL", () => ({ color: "#7a5c44" })), dryLeaf = lam("svDryLeaf", () => ({ color: "#8a7a44" }));
  const GATE = 0.34; // half-angle of the gate gap (rad)
  for (let i = 0; i < 420; i++) {
    const a = r() * TAU; if (Math.abs(((a - Math.PI / 2 + TAU) % TAU) - Math.PI) < 0.0001) continue;
    const da = Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2)); if (Math.abs(da) < GATE) continue; // gate gap around +z (a = pi/2 => +z)
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.16) continue; // a low gap in the west thorns (the lion's way in)
    const rr = KR + (r() - 0.5) * 0.9, x = Math.cos(a) * rr, z = Math.sin(a) * rr, L = 0.8 + r() * 1.4;
    const geo = new THREE.CylinderGeometry(0.018, 0.04, L, 4).translate(0, L / 2, 0);
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - 0.5) * 2.2, r() * TAU, (r() - 0.5) * 2.2)).setPosition(x, r() * 0.9, z);
    b.add(geo, r() > 0.4 ? thorn : thornL, m);
    if (i % 3 === 0) b.add(new THREE.IcosahedronGeometry(0.22 + r() * 0.2, 0).scale(1.4, 0.7, 1).translate(x, 0.5 + r() * 0.8, z), dryLeaf);
  }
  // dense lower mass of the thorn ring (so it reads as a wall, not sticks)
  for (let i = 0; i < 90; i++) { const a = (i / 90) * TAU; const da = Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2)); if (Math.abs(da) < GATE) continue;
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.2) continue;
    for (let k = 0; k < 3; k++) { const L = 1.4 + r() * 1.0; const geo = new THREE.CylinderGeometry(0.05, 0.09, L, 5).rotateZ(Math.PI / 2 + (r() - 0.5) * 0.5).rotateY(a + Math.PI / 2 + (r() - 0.5) * 0.6);
      b.add(geo.translate(Math.cos(a) * (KR + (r() - 0.5) * 0.5), 0.15 + k * 0.32 + r() * 0.1, Math.sin(a) * (KR + (r() - 0.5) * 0.5)), r() > 0.5 ? thorn : thornL); } }
  // gate posts
  const pole = lam("svPole", () => ({ map: beamHD() }));
  for (const s of [-1, 1]) { const a = Math.PI / 2 + s * GATE; b.add(new THREE.CylinderGeometry(0.1, 0.12, 2.0, 8).translate(Math.cos(a) * KR, 1.0, Math.sin(a) * KR), pole); }
  // the pole fence outside the gate: posts + two rails (the farmers sit on the top rail at y = 1.0)
  const FZ = 10.6, FX0 = -7.2, FX1 = 1.6;
  for (let x = FX0; x <= FX1 + 0.01; x += 1.47) b.add(new THREE.CylinderGeometry(0.09, 0.1, 1.25, 8).translate(x, 0.6, FZ), pole);
  for (const y of [0.55, 1.02]) b.add(new THREE.CylinderGeometry(0.075, 0.075, FX1 - FX0 + 0.4, 8).rotateZ(Math.PI / 2).translate((FX0 + FX1) / 2, y, FZ), pole);
  // the tally board on a post at the gate (chalk numbers are cards drawn by the shots in front of it)
  const BOARD: V3 = [4.4, 1.55, 9.0];
  b.add(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8).translate(BOARD[0], 0.8, BOARD[2] - 0.08), pole);
  b.add(boxGeo(V(BOARD[0] - 0.62, BOARD[1] - 0.42, BOARD[2] - 0.06), V(BOARD[0] + 0.62, BOARD[1] + 0.42, BOARD[2]), 1), lam("svBoardFrame", () => ({ map: beamHD() })));
  b.add(new THREE.PlaneGeometry(1.08, 0.7).translate(BOARD[0], BOARD[1], BOARD[2] + 0.005), lam("svSlate", () => ({ color: "#2e3a38" })));
  // paint pots + stool + brushes by the board, a water trough inside the kraal, a fire pit by the huts
  const potM = lam("svPot", () => ({ color: "#d8dce2" })), paint = lam("svPaint", () => ({ color: "#19b7b0" })), white = lam("svPaintW", () => ({ color: "#fbf8f0" }));
  for (const [x, z, c] of [[3.0, 9.6, 0], [3.5, 9.9, 1], [2.6, 10.1, 0]] as [number, number, number][]) {
    b.add(new THREE.CylinderGeometry(0.2, 0.18, 0.32, 14).translate(x, 0.16, z), potM);
    b.add(new THREE.CircleGeometry(0.18, 14).rotateX(-Math.PI / 2).translate(x, 0.325, z), c ? paint : white); }
  b.add(new THREE.CylinderGeometry(0.28, 0.24, 0.08, 12).translate(1.6, 0.48, 9.2), pole);
  for (const a of [0, 2.1, 4.2]) b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 5).translate(1.6 + Math.cos(a) * 0.18, 0.22, 9.2 + Math.sin(a) * 0.18), pole);
  { const tw = lam("svTrough", () => ({ map: rep(planksHD(), 0.4, 0.2) })); b.add(boxGeo(V(-4.6, 0, -3.2), V(-2.2, 0.45, -2.5), 1), tw);
    b.add(new THREE.PlaneGeometry(2.3, 0.6).rotateX(-Math.PI / 2).translate(-3.4, 0.38, -2.85), lam("svTroughW", () => ({ color: "#5d8fc0" }))); }
  // fire pit (stones + logs), smoke puffs + glow at night
  const FIRE: V3 = [-6.0, 0, 16.2];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; b.add(new THREE.DodecahedronGeometry(0.2, 0).translate(FIRE[0] + Math.cos(a) * 0.7, 0.12, FIRE[2] + Math.sin(a) * 0.7), lam("svFireStone", () => ({ color: "#8a8a96" }))); }
  for (let i = 0; i < 4; i++) b.add(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 6).rotateZ(Math.PI / 2).rotateY((i / 4) * Math.PI + 0.3).translate(FIRE[0], 0.15, FIRE[2]), lam("svLog", () => ({ map: barkTex() })));
  const flames = torch(root, [FIRE[0], -1.95, FIRE[2]], 2.2, true, 6, 10); flames.flame.scale.set(1.0, 1.5, 1);
  const fireGlow = glow(root, [FIRE[0], 0.6, FIRE[2]], "#ffb050", 2.4, 0.9);
  const smoke = Array.from({ length: 6 }, () => puff(root, [FIRE[0], 1.0, FIRE[2]], 1.2, "#e8e6ee", 0.45));
  barrel(root, [6.2, 0, 11.6], 0.42); sack(root, [5.4, 0, 12.4], 0.34, "#d8bf86"); sack(root, [-8.6, 0, 11.8], 0.3, "#c9a870");
  // lantern posts (nights): at the gate, by the board, on the fence
  const lamps = [lamp(root, [2.6, 2.4, 8.4], "#ffb45a", 5, 9, "post"), lamp(root, [-2.2, 2.4, 8.9], "#ffb45a", 5, 9, "post"), lamp(root, [-7.6, 2.4, 10.2], "#ffb45a", 4, 8, "post")];

  // ---------------- huts, acacias, termite mounds ----------------
  for (const [x, z, rad, yaw] of [[-14, -5, 2.4, 1.2], [-13, 11, 2.2, 2.0], [13.5, -7, 2.5, -1.1], [15, 7.5, 2.3, -2.2], [-3.5, -18, 2.6, 0.1], [8.5, -18.5, 2.3, -0.3], [11, 19, 2.2, 3.4], [-20, 19, 2.0, 2.6]] as [number, number, number, number][]) hut(b, x, z, rad, yaw, r);
  const trees = [[-9.5, 15.5, 6.2, 1], [19, 15, 7, 2], [-21, -3, 6.6, 3], [22, -15, 7.4, 4], [3, -27, 6.8, 5], [-28, 20, 7, 6], [32, 4, 6, 7], [-34, -24, 7.2, 8], [26, 30, 6.6, 9], [-48, -30, 6.8, 10], [-58, -44, 6.2, 11], [55, -18, 7, 12], [78, 14, 6.4, 13], [64, 30, 7.2, 14]]
    .map(([x, z, h, s]) => acacia(root, x, z, h, s));
  const moundM = lam("svMoundM", () => ({ color: "#b8764a" }));
  const mound = (x: number, z: number, h: number) => { b.add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2).scale(h * 0.8, h, h * 0.8).translate(x, 0, z), moundM);
    b.add(new THREE.ConeGeometry(h * 0.25, h * 0.7, 7).translate(x + h * 0.45, h * 0.3, z + h * 0.15), moundM); b.add(new THREE.ConeGeometry(h * 0.2, h * 0.5, 7).translate(x - h * 0.5, h * 0.22, z - h * 0.1), moundM); };
  mound(18, -1, 2.0); mound(-42.5, -29.5, 1.5);
  // the kopje on the payoff plain (the lion sulks on top)
  const rockM = lam("svRock", () => ({ color: "#b8a08a" }));
  for (const [x, z, sx, sy, sz] of [[66, 9, 3.2, 1.6, 2.6], [68.5, 10.4, 1.6, 1.0, 1.4], [64.4, 10.6, 1.2, 0.8, 1.0]] as const) b.add(new THREE.DodecahedronGeometry(1, 1).scale(sx, sy, sz).translate(x, sy * 0.55, z), rockM);
  // ---------------- the riverbank (north-west): water strip, reeds, mud bank ----------------
  const river = new THREE.Mesh(new THREE.PlaneGeometry(140, 16).rotateX(-Math.PI / 2), lam("svRiverM", () => ({ map: rep(waterTex(), 10, 1.4) })));
  river.position.set(-50, 0.02, -52); root.add(river);
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(140, 5).rotateX(-Math.PI / 2), lam("svBank", () => ({ map: rep(dirtTex(), 12, 0.5) })));
  bank.position.set(-50, 0.015, -42.5); root.add(bank);
  const reed = lam("svReed", () => ({ color: "#7c9a46" })), reedTop = lam("svReedTop", () => ({ color: "#8a5a34" }));
  for (let i = 0; i < 160; i++) { const x = -110 + r() * 120, z = -44.5 - r() * 2.2, h = 1.0 + r() * 1.2;
    b.add(new THREE.CylinderGeometry(0.02, 0.03, h, 4).rotateZ((r() - 0.5) * 0.3).translate(x, h / 2, z), reed);
    if (r() < 0.5) b.add(new THREE.CapsuleGeometry(0.05, 0.22, 2, 5).translate(x, h + 0.08, z), reedTop); }

  // ---------------- tall grass (cards of blades in clumps that sway) ----------------
  const blade = new THREE.MeshLambertMaterial({ map: bladeTex(), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
  const clumps: THREE.Group[] = [];
  const grassAt = (x0: number, x1: number, z0: number, z1: number, n: number, h0: number, h1: number) => {
    for (let i = 0; i < n; i++) { const g = new THREE.Group(), x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), h = h0 + r() * (h1 - h0);
      if ((x > -25 && x < -12.5 && z > -8 && z < 3.5) || (x > -16 && z > -0.6 && z < 8.5)) continue; // the clearing (scene 7) + the lion's lane to the west gap
      g.position.set(x, 0, z); root.add(g);
      for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(h * 1.3, h).translate(0, h / 2, 0), blade); m.rotation.y = (k / 3) * Math.PI + r() * 0.4; m.receiveShadow = true; m.castShadow = false; g.add(m); }
      g.userData.ph = r() * TAU; clumps.push(g); } };
  grassAt(-27, -11.5, -9, 8, 230, 1.0, 1.7);    // the lion's cover west of the kraal
  grassAt(-68, -34, -44.5, -42.0, 90, 0.6, 1.1);   // a strip of riverbank grass along the water (scene 2)
  grassAt(-14, 30, 20, 40, 90, 0.6, 1.1);       // behind the village
  // scattered low bushes everywhere
  const bush = lam("svBush", () => ({ map: canopyTex() }));
  for (let i = 0; i < 70; i++) { const a = r() * TAU, d = 14 + r() * 70; const x = Math.cos(a) * d + 10, z = Math.sin(a) * d; if (Math.hypot(x, z) < 26 || (x < -30 && z < -20)) continue;
    b.add(new THREE.IcosahedronGeometry(0.5 + r() * 0.6, 1).scale(1.3, 0.7, 1.1).translate(x, 0.35, z), bush); }
  // distant hills / kopjes
  for (const [x, z, sx, sy, sz, c] of [[-150, -170, 110, 26, 50, "#c79a62"], [90, -190, 130, 34, 60, "#b98c5c"], [200, -20, 70, 22, 110, "#c9a068"], [-200, 60, 80, 20, 90, "#c39a64"], [60, 190, 120, 18, 50, "#c7a06a"]] as const)
    hill(root, [x, -1, z], sx, sy, sz, c, 5);
  // moon (nights)
  const moonTex = ctex("svMoon", 256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, "rgba(255,250,225,1)"); gr.addColorStop(0.55, "rgba(255,250,225,0.9)"); gr.addColorStop(0.6, "rgba(220,230,255,0.25)"); gr.addColorStop(1, "rgba(200,210,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "rgba(210,205,180,0.6)"; for (const [x, y, rr] of [[104, 110, 14], [150, 140, 10], [124, 160, 8]]) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); } });
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, color: new THREE.Color(1.3, 1.3, 1.25), transparent: true, depthWrite: false, fog: false }));
  moon.position.set(-60, 120, -230); moon.scale.set(34, 34, 1); moon.layers.set(NOINK); moon.renderOrder = -0.5; root.add(moon);
  // dust haze over the payoff plain
  const haze = Array.from({ length: 10 }, (_, i) => puff(root, [40 + i * 6, 0.6, (i % 2 ? 6 : -6)], 7, "#f2dcb4", 0.35));
  b.build(root);

  const marks: Record<string, V3> = {
    gate: [0, 0, KR], board: BOARD, boardFace: [BOARD[0], BOARD[1], BOARD[2] + 0.02], stool: [1.6, 0, 9.2], pots: [3.0, 0, 9.6],
    fence1: [-6.4, 0, FZ], fence2: [-4.9, 0, FZ], fence3: [-3.4, 0, FZ], fence4: [-1.9, 0, FZ], fenceRail: [0, 1.02, FZ],
    fire: FIRE, trough: [-3.4, 0, -2.85], mound: [-42.5, 1.5, -29.5], kopje: [66, 1.65, 9], riverLion: [-51, 0, -36.5], riverImpala: [-56.5, 0, -40.5],
  };
  const cams: SetDef["cams"] = {
    kraal: { pos: [3.5, 3.2, 21], look: [0, 1.0, 2], fov: 44 },
    gate: { pos: [6.5, 1.7, 15.5], look: [1.5, 1.1, 8.5], fov: 42 },
    high: { pos: [10, 16, 26], look: [0, 0, 0], fov: 46 },
    river: { pos: [-38, 2.2, -27], look: [-52, 1.0, -38], fov: 42 },
    grass: { pos: [-15, 0.9, 3], look: [-20, 0.6, -2], fov: 42 },
    plain: { pos: [30, 6, 26], look: [60, 0.8, 0], fov: 46 },
  };
  return {
    name: "savanna", root, marks, cams,
    pose: (t, c) => {
      const nk = c.night ?? 0, fk = c.fire ?? 1;
      lamps.forEach((l) => { l.visible = nk > 0.05; flicker(l, t); const L = l.userData.light as THREE.PointLight; L.intensity = (l.userData.base as number) * nk; });
      flames.flame.visible = fk > 0.05; flames.glow.visible = fk > 0.05; if (fk > 0.05) flickerTorch(flames, t); if (flames.light) flames.light.intensity = flames.base * fk * (0.4 + 0.6 * nk);
      fireGlow.visible = nk > 0.3 && fk > 0.05;
      risePuffs(smoke, t, 3.0, 0.1, 1.8, (c.smoke ?? 1) * (1 - 0.5 * nk));
      moon.visible = nk > 0.05; (moon.material as THREE.SpriteMaterial).opacity = nk;
      risePuffs(haze, t, 0.6, 0.04, 0.6, c.dust ?? 0);
      for (const g of clumps) { const ph = g.userData.ph as number; g.rotation.x = Math.sin(t * 1.3 + ph) * 0.04; g.rotation.z = Math.sin(t * 0.9 + ph * 1.7) * 0.06; }
      for (const tr of trees) tr.g.rotation.set(Math.sin(t * 0.8 + tr.seed) * 0.012, 0, Math.sin(t * 0.6 + tr.seed * 2) * 0.016);
    },
  };
};
