// "He Covered His Oranges in Ice to Stop Them Freezing": two Florida orange groves on a freeze night (home base).
// Earl's grove on the left (x < 0) with over-tree sprinklers on tall risers; Duane's grove on the right (x > 0) with
// smudge pots (fire pots) between the trees; a split-rail fence on x = 0 between them. Earl's farmhouse (back door +
// steps toward the grove, the scarecrow's kitchen garden), his pump shed and valve, a dirt road with Earl's gate at the
// front (z ~ 14) and a parked farm truck.
//
// LAYOUT (set-local metres, ground y = 0):
//   fence        x = 0, z 13 .. -70, posts every 2.5 m (z = 12.5, 10, 7.5 ... ), rails at 0.30 / 0.62 / 0.92 (v13 rig: a 1.65 m figure looks over the 1.1 m fence)
//   Earl's trees columns x = -3.2, -8.7, -14.2, -19.7, -25.2 ...; rows z = 8 (only x > -6), 2, -4, -10 ... -64
//                HERO tree at (-3.2, 0, -4): the hook, the snapping bough (toward Earl's 3 a.m. mark), the macro orange
//                (HERO_ORANGE) and Earl's tree thermometer (ETHERMO) on its fence-side face
//   Duane's trees columns x = 3.4, 8.9, 14.4, 19.9 ...; rows z = 2.5, -3.5, -9.5 ... ; smudge pots between them
//   Duane's thermometer on the fence post at z -0.5, facing +x (DTHERMO); the bet crate sits on the top rail (c.crate)
//   valve        (-1.5, 0, 2.6): riser + red handwheel (c.valve turns it); main pipe on the ground along x = -1.5
//   pump shed    (-5.6, 0, 6.4); farmhouse (-11.5, 0, 9.6) with the BACK DOOR on its +x wall (door sill y 0.62, z 9.6),
//                porch lamp, lit kitchen window; scarecrow garden in front of the steps
//   road         z 15.2 .. 19.2 (centre 17.2), Earl's front fence on z = 14 for x < 0 with the gate at x -3.6 .. -1.6;
//                the hand-painted POPSICLE EARL board on the right gate post (c.sign 0..1 letters painted)
//   truck        (-9.0, 0, 17.6) heading +x, headlamps lit by c.truck
// CONTROLS (c.*): ice 0..1 (Earl's glaze: leaves, ice balls, icicles, glints), melt 0..1 (sunrise: the ice slides off
//   in sheets and bursts into sparkle), spray 0..1 (sprinklers running), valve (wheel turns), frost 0..1 (rime on the
//   ground / fence), dFrost 0..1 (Duane's oranges + leaves frost over), pots 0..1 (fire pots lit), potsOut 0..9 (how
//   many have guttered out, front first), snap 0..1 (the iced bough breaks and crashes down), temp (Duane's reading
//   in deg F), etemp (Earl's), crate 0/1, sign 0..1, truck 0/1, moon 0..1, stars 0..1, house 0..1 (windows lit),
//   door 0..1 (back door swings open), drops 0..1 (macro: drops land + freeze on the hero orange), heat 0..1 (macro:
//   warm pulse in the freezing skin), lamp1 / lamp2 + l1x l1y l1z / l2x l2y l2z (the lanterns Earl and Duane carry:
//   a warm point light + glow where the shot code puts the hand), shedLamp 0..1, juice 0..1 (sunrise: wet glossy
//   oranges), scare 0/1 (the scarecrow on its pole; 0 = pole empty, the scarecrow is a card at the door).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "../build";
import { ctex, rng, rep, beamHD, planksHD, roofHD, stoneHD } from "../paint";
import { NOINK } from "../ink";
import { glow, mist, rod, crate, barrel, sack, lamp, flicker } from "../setkit";
import { sparkles, sparkle, fitText, TAU, streamTex } from "./portkit_common";
import { leafTex } from "./innerkit_b";
import { swayMaterial } from "../sway";
import { flatbed } from "./flatbed";
import type { SetDef, V3 } from "./types";

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
const col = (c: string) => lam("gvC" + c, () => ({ color: c }));
const tex = (key: string, t: () => THREE.Texture, c = "#ffffff") => lam("gvT" + key + c, () => ({ map: t(), color: c }));
const std = (key: string, o: THREE.MeshStandardMaterialParameters) => mat("gvS" + key, () => new THREE.MeshStandardMaterial(o));

// ---------------- painted textures ----------------
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
/** sandy grove soil: pale grey-tan sand, darker drip rings, grass clumps, leaf litter, pebbles (1024 px = 4 m) */
const soilTex = () => ctex("gvSoil", 1024, 1024, (g, r) => {
  g.fillStyle = "#b8a684"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 140; i++) blot(g, r() * 1024, r() * 1024, 30 + r() * 110, r() < 0.5 ? "rgba(214,200,168,0.35)" : "rgba(120,100,70,0.22)");
  for (let i = 0; i < 90; i++) { const x = r() * 1024, y = r() * 1024; for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(${70 + r() * 40},${110 + r() * 50},${50 + r() * 30},0.8)`; g.lineWidth = 2 + r() * 2; const a = -Math.PI / 2 + (r() - 0.5) * 1.6, L = 8 + r() * 18; g.beginPath(); g.moveTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 16); g.lineTo(x + Math.cos(a) * L + (r() - 0.5) * 30, y + Math.sin(a) * L); g.stroke(); } }
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "#6a7a3a" : "#8a6a3a"; g.save(); g.translate(r() * 1024, r() * 1024); g.rotate(r() * TAU); g.beginPath(); g.ellipse(0, 0, 7 + r() * 5, 3, 0, 0, TAU); g.fill(); g.restore(); }
  for (let i = 0; i < 900; i++) { const v = 140 + r() * 90; g.fillStyle = `rgba(${v},${v - 10},${v - 30},0.85)`; g.beginPath(); g.arc(r() * 1024, r() * 1024, 1 + r() * 2.6, 0, TAU); g.fill(); g.fillStyle = "rgba(60,45,30,0.35)"; g.fillRect(r() * 1024, r() * 1024, 2, 2); }
});
/** rime frost: white crystal feathers with alpha (overlay on the ground / fence) */
const frostTex = () => ctex("gvFrost", 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) blot(g, r() * 512, r() * 512, 20 + r() * 60, "rgba(236,246,255,0.35)");
  g.strokeStyle = "rgba(250,253,255,0.9)";
  for (let i = 0; i < 520; i++) { const x = r() * 512, y = r() * 512, a = r() * TAU, L = 3 + r() * 9; g.lineWidth = 0.8 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.moveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5); g.lineTo(x + Math.cos(a + 0.7) * L * 0.9, y + Math.sin(a + 0.7) * L * 0.9); g.stroke(); }
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; g.fillRect(r() * 512, r() * 512, 1.5, 1.5); }
});
/** orange peel: dimpled skin, a soft highlight band, a green-brown stem dot (uv sphere map) */
const peelTex = (k: string, base: string, lite: string, dark: string) => ctex("gvPeel" + k, 256, 128, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 128);
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "rgba(90,110,40,0.35)"); gr.addColorStop(0.12, "rgba(0,0,0,0)"); gr.addColorStop(0.85, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(120,60,10,0.3)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? lite : dark; g.globalAlpha = 0.35; g.beginPath(); g.arc(r() * 256, r() * 128, 0.8 + r() * 1.6, 0, TAU); g.fill(); }
  g.globalAlpha = 1; g.fillStyle = "#4a5a20"; g.beginPath(); g.ellipse(128, 3, 30, 3, 0, 0, TAU); g.fill();
});
const barkTex = () => ctex("gvBark", 256, 512, (g, r) => {
  g.fillStyle = "#6a5444"; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 70; i++) { g.strokeStyle = r() < 0.5 ? "rgba(40,28,20,0.6)" : "rgba(150,130,110,0.35)"; g.lineWidth = 2 + r() * 4; let x = r() * 256, y = 0; g.beginPath(); g.moveTo(x, y); while (y < 512) { x += (r() - 0.5) * 14; y += 20 + r() * 30; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 40; i++) blot(g, r() * 256, r() * 512, 10 + r() * 30, "rgba(110,130,90,0.25)"); // lichen
});
const tinTex = () => ctex("gvTin", 512, 512, (g, r) => {
  g.fillStyle = "#9aa0a6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) { const x = i * 32; const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, "rgba(255,255,255,0.35)"); gr.addColorStop(0.5, "rgba(0,0,0,0.1)"); gr.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = gr; g.fillRect(x, 0, 32, 512); }
  for (let i = 0; i < 50; i++) blot(g, r() * 512, r() * 512, 10 + r() * 50, "rgba(150,70,30,0.35)"); // rust
});
const clapTex = (base: string) => ctex("gvClap" + base, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) { const y = i * 32; g.fillStyle = "rgba(60,40,30,0.35)"; g.fillRect(0, y + 29, 512, 3); g.fillStyle = "rgba(255,255,255,0.2)"; g.fillRect(0, y, 512, 2); }
  for (let i = 0; i < 60; i++) blot(g, r() * 512, r() * 512, 10 + r() * 40, "rgba(120,100,80,0.18)");
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(90,70,50,0.25)"; g.fillRect(r() * 512, r() * 512, 1 + r() * 6, 1); } // peeling paint
});
const winTex = () => ctex("gvWin", 128, 192, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, "#ffe6a8"); gr.addColorStop(1, "#ffb860"); g.fillStyle = gr; g.fillRect(0, 0, 128, 192);
  g.fillStyle = "rgba(200,90,60,0.55)"; g.fillRect(0, 0, 30, 192); g.fillRect(98, 0, 30, 192); // curtains
  g.fillStyle = "#4a3426"; g.fillRect(60, 0, 8, 192); g.fillRect(0, 92, 128, 8); g.strokeStyle = "#4a3426"; g.lineWidth = 10; g.strokeRect(0, 0, 128, 192);
});
/** a tin thermometer plate: 16-40 deg F, big numbers, the red FREEZE line at 28 (plate faces +z) */
const thermoTex = (k: string) => ctex("gvThermo" + k, 256, 768, (g) => {
  g.fillStyle = "#f3ead2"; g.fillRect(0, 0, 256, 768);
  g.strokeStyle = "#8a6a3a"; g.lineWidth = 14; g.strokeRect(7, 7, 242, 754);
  const yOf = (deg: number) => 700 - ((deg - 16) / 24) * 620;
  g.fillStyle = "#2a1a12"; g.textAlign = "left"; g.textBaseline = "middle"; g.font = "900 52px Georgia, serif";
  for (let d = 16; d <= 40; d += 2) { const y = yOf(d), big = d % 4 === 0; g.fillRect(118, y - 2, big ? 44 : 26, 4); if (big && d !== 28) g.fillText(String(d), 166, y + 2); }
  g.fillStyle = "#c8261e"; g.fillRect(96, yOf(28) - 5, 150, 10); g.font = "900 54px Georgia, serif"; g.fillText("28", 166, yOf(28) - 30);
  g.font = "900 26px Georgia, serif"; g.textAlign = "center"; g.fillText("FREEZE", 176, yOf(28) + 30); g.textAlign = "left";
  g.fillStyle = "#2a1a12"; g.font = "900 40px Georgia, serif"; g.textAlign = "center"; g.fillText("°F", 128, 40);
});
const signTex = (k: number) => ctex("gvSign" + Math.round(k * 12), 768, 288, (g, r) => {
  g.fillStyle = "#cfb58a"; g.fillRect(0, 0, 768, 288);
  for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(80,50,30,0.5)"; g.fillRect(0, i * 48, 768, 3); }
  for (let i = 0; i < 40; i++) blot(g, r() * 768, r() * 288, 20 + r() * 50, "rgba(110,80,50,0.2)");
  if (k <= 0) return;
  g.save(); g.beginPath(); g.rect(0, 0, 40 + 690 * k, 288); g.clip();
  g.fillStyle = "#c8261e"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "POPSICLE", 384, 92, 680, 112, "900 %spx Georgia, serif"); fitText(g, "EARL", 384, 210, 400, 120, "900 %spx Georgia, serif");
  for (const x of [120, 300, 520, 640]) { g.beginPath(); g.ellipse(x, 140 + (x % 9), 5, 14, 0, 0, TAU); g.fill(); } // drips
  // a little popsicle doodle
  g.fillStyle = "#f28a1e"; g.fillRect(610, 170, 52, 70); g.fillStyle = "#c99a5a"; g.fillRect(630, 238, 12, 34);
  g.restore();
});

/** leafy cut-out shell: dozens of pointed glossy leaves with midribs on a transparent canvas (alphaTest) */
const leafCutTex = (k: string, base: string, lite: string, dark: string) => ctex("gvLeafCut" + k, 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 230; i++) {
    const x = r() * 512, y = r() * 512, L = 22 + r() * 22, W = L * 0.42, a = r() * TAU, c = r() < 0.33 ? lite : r() < 0.5 ? dark : base;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c; g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -W, L, 0); g.quadraticCurveTo(0, W, -L, 0); g.fill();
    g.strokeStyle = "rgba(20,40,16,0.55)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-L * 0.9, 0); g.lineTo(L * 0.9, 0); g.stroke();
    g.fillStyle = "rgba(255,255,255,0.22)"; g.beginPath(); g.ellipse(-L * 0.2, -W * 0.35, L * 0.45, W * 0.18, 0, 0, TAU); g.fill(); g.restore();
  }
});
const oneLeafTex = () => ctex("gvOneLeaf", 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#5a9a40"); gr.addColorStop(0.5, "#3a7a30"); gr.addColorStop(1, "#24562a");
  g.fillStyle = gr; g.beginPath(); g.moveTo(6, 64); g.quadraticCurveTo(110, -6, 250, 64); g.quadraticCurveTo(110, 134, 6, 64); g.fill();
  g.strokeStyle = "#b8d088"; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 64); g.lineTo(244, 64); g.stroke();
  g.lineWidth = 1.5; g.strokeStyle = "rgba(200,230,150,0.6)"; for (let i = 1; i < 8; i++) { const x = 20 + i * 28; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 22, 64 - 30 + i * 2); g.moveTo(x, 64); g.lineTo(x + 22, 64 + 30 - i * 2); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.ellipse(100, 46, 70, 8, -0.1, 0, TAU); g.fill();
});
const glintTex = () => ctex("gvGlint", 64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(235,248,255,0.8)"); gr.addColorStop(1, "rgba(200,230,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 4); g.lineTo(32, 60); g.moveTo(4, 32); g.lineTo(60, 32); g.stroke(); });
// ---------------- builders ----------------
type Tree = { crown: THREE.Group; lumps: [number, number, number, number][]; fruit: V3[]; seed: number };
const LEAF = () => swayMaterial(lam("gvLeaf", () => ({ map: leafTex("gvOrange", "#2f6a2c", "#5a9a3e", "#1f4a22") })));
const LEAF_D = () => swayMaterial(lam("gvLeafD", () => ({ map: leafTex("gvDuane", "#346e2e", "#62a044", "#22502a") })));
/** an orange tree: short trunk, 3-4 boughs, a round dense crown of leaf clusters skirted low, oranges on the surface */
const orangeTree = (b: Batch, parent: THREE.Object3D, p: V3, h: number, seed: number, detail: number, nFruit: number, leafM: THREE.Material, fruitM: THREE.Material, skip?: (q: V3) => boolean, cutM?: THREE.Material): Tree => {
  const r = rng(seed * 37 + 11), bark = tex("bark", barkTex);
  const top: V3 = [p[0] + (r() - 0.5) * 0.15, p[1] + h * 0.3, p[2] + (r() - 0.5) * 0.15];
  b.add(new THREE.CylinderGeometry(0.07 * h / 3.6, 0.11 * h / 3.6, h * 0.32, 9).translate(p[0], p[1] + h * 0.16, p[2]), bark);
  for (let k = 0; k < 4; k++) { const a = r() * TAU + k * 1.6; const e: V3 = [top[0] + Math.cos(a) * h * 0.22, top[1] + h * 0.22, top[2] + Math.sin(a) * h * 0.22]; const A = V(...top), B = V(...e); b.add(new THREE.CylinderGeometry(0.035 * h / 3.6, 0.06 * h / 3.6, A.distanceTo(B), 6).translate(0, A.distanceTo(B) / 2, 0).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize()))).translate(A.x, A.y, A.z), bark); }
  const crown = new THREE.Group(); crown.position.set(p[0], p[1], p[2]); parent.add(crown);
  const cb = new Batch(), lumps: [number, number, number, number][] = [], R0 = h * 0.42, cy = h * 0.6;
  const n = detail >= 2 ? 26 : detail === 1 ? 16 : 8;
  for (let i = 0; i < n; i++) {
    const th = r() * TAU, ph = Math.acos(1 - 2 * r()) * 0.82, rr = R0 * (0.26 + r() * 0.16), d = R0 * (0.55 + r() * 0.2);
    const L: [number, number, number, number] = [Math.sin(ph) * Math.cos(th) * d, cy + Math.cos(ph) * d * 0.82 - (ph > 1.3 ? 0.1 : 0), Math.sin(ph) * Math.sin(th) * d, rr];
    if (L[1] - rr < h * 0.22) L[1] = h * 0.22 + rr;
    if (skip && skip([p[0] + L[0], L[1], p[2] + L[2]])) continue;
    lumps.push(L);
    cb.add(new THREE.IcosahedronGeometry(rr, detail >= 2 ? 2 : 1).scale(1, 0.86, 1).translate(L[0], L[1], L[2]), leafM);
    if (detail >= 1 && cutM) cb.add(new THREE.IcosahedronGeometry(rr * 1.13, 1).scale(1, 0.88, 1).rotateY(r() * TAU).translate(L[0], L[1], L[2]), cutM);
  }
  cb.add(new THREE.SphereGeometry(R0 * 0.62, 10, 8).scale(1, 0.8, 1).translate(0, cy, 0), leafM); // dense core (no see-through gaps to the trunk)
  const fruit: V3[] = [];
  for (let i = 0; i < nFruit; i++) {
    const L = lumps[Math.floor(r() * lumps.length)]; if (!L) break;
    const th = r() * TAU, ph = 0.5 + r() * 1.6, rad = L[3] * (1.06 + r() * 0.06);
    const q: V3 = [L[0] + Math.cos(th) * Math.sin(ph) * rad, L[1] + Math.cos(ph) * rad * 0.86, L[2] + Math.sin(th) * Math.sin(ph) * rad];
    if (Math.hypot(q[0], q[2]) < R0 * 0.55) continue;
    fruit.push(q); cb.add(new THREE.SphereGeometry(0.062, detail >= 2 ? 9 : 6, detail >= 2 ? 7 : 4).translate(q[0], q[1], q[2]), fruitM);   // render speed: fewer tris on far fruit
  }
  cb.build(crown); crown.traverse((m) => { (m as THREE.Mesh).castShadow = true; m.receiveShadow = true; });
  return { crown, lumps, fruit, seed };
};
/** the ice coat of one tree: a glassy shell over every leaf lump, a ball round every orange, icicles under the crown */
const iceCoat = (crown: THREE.Group, t: Tree, iceM: THREE.Material, ballM: THREE.Material, icM: THREE.Material, glintM: THREE.PointsMaterial, nIcicle: number) => {
  const g = new THREE.Group(); crown.add(g);
  const ib = new Batch(), r = rng(t.seed * 19 + 5);
  for (const L of t.lumps) ib.add(new THREE.IcosahedronGeometry(L[3] * 1.16, 1).scale(1, 0.9, 1).rotateY(r() * TAU).translate(L[0], L[1], L[2]), iceM);
  for (const q of t.fruit) ib.add(new THREE.SphereGeometry(0.082, 9, 7).translate(q[0], q[1] - 0.006, q[2]), ballM);
  for (let i = 0; i < nIcicle; i++) {
    const L = t.lumps[Math.floor(r() * t.lumps.length)]; if (!L || L[1] - L[3] < 0.9) continue;
    const th = r() * TAU, x = L[0] + Math.cos(th) * L[3] * 0.8, z = L[2] + Math.sin(th) * L[3] * 0.8, y = L[1] - L[3] * 0.78, len = 0.05 + r() * 0.1;
    ib.add(new THREE.ConeGeometry(0.009 + r() * 0.006, len, 5).rotateX(Math.PI).translate(x, y - len / 2, z), icM);
  }
  ib.build(g); g.traverse((m) => { (m as THREE.Mesh).castShadow = false; m.renderOrder = 2; });
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(t.fruit.flatMap((q) => [q[0] - 0.025, q[1] + 0.05, q[2] + 0.02]), 3));
  const pts = new THREE.Points(pg, glintM); pts.layers.set(NOINK); pts.renderOrder = 6; g.add(pts);
  return g;
};
/** a smudge pot: squat round iron bowl on a ring foot, a tall stack with a vented cap; flame + smoke + light at the top */
const smudgePot = (b: Batch, parent: THREE.Object3D, p: V3, light: boolean) => {
  const iron = std("potIron", { color: "#3a3b42", roughness: 0.55, metalness: 0.5 }), rust = std("potRust", { color: "#6a4430", roughness: 0.9, metalness: 0.1 });
  b.add(new THREE.CylinderGeometry(0.26, 0.3, 0.06, 16).translate(p[0], p[1] + 0.03, p[2]), rust);
  b.add(new THREE.SphereGeometry(0.3, 16, 10, 0, TAU, 0, Math.PI * 0.62).rotateX(Math.PI).scale(1, 0.95, 1).translate(p[0], p[1] + 0.36, p[2]), iron);
  b.add(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 16).translate(p[0], p[1] + 0.37, p[2]), rust);
  b.add(new THREE.CylinderGeometry(0.075, 0.085, 0.85, 10).translate(p[0], p[1] + 0.8, p[2]), iron);
  b.add(new THREE.CylinderGeometry(0.11, 0.09, 0.12, 10, 1, true).translate(p[0], p[1] + 1.24, p[2]), iron);
  const top: V3 = [p[0], p[1] + 1.3, p[2]];
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameCard(), color: new THREE.Color(1.7, 1.3, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  flame.center.set(0.5, 0.06); flame.position.set(...top); flame.scale.set(0.34, 0.62, 1); flame.layers.set(NOINK); flame.renderOrder = 4; parent.add(flame);
  const gl = glow(parent, [top[0], top[1] + 0.25, top[2]], "#ff9a40", 1.6, 1);
  const L = light ? new THREE.PointLight("#ff8f3c", 0, 9, 1.5) : null; if (L) { L.position.set(top[0], top[1] + 0.3, top[2]); parent.add(L); }
  const smoke = [0, 1, 2, 3].map((i) => mist(parent, [top[0], top[1] + 0.6 + i * 0.7, top[2]], 0.9, "#4c4650", 0.35));
  return { flame, glow: gl, light: L, smoke, top, seed: p[0] * 3.1 + p[2] * 1.7 };
};
const flameCard = () => ctex("gvFlame", 128, 256, (g) => {
  const gr = g.createRadialGradient(64, 190, 4, 64, 160, 116); gr.addColorStop(0, "rgba(255,255,226,1)"); gr.addColorStop(0.3, "rgba(255,214,96,1)"); gr.addColorStop(0.62, "rgba(255,128,36,0.92)"); gr.addColorStop(1, "rgba(255,80,20,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(64, 8); g.bezierCurveTo(104, 84, 122, 160, 102, 212); g.quadraticCurveTo(64, 252, 26, 212); g.bezierCurveTo(6, 160, 24, 84, 64, 8); g.fill();
});
const dropTex = () => ctex("gvDrop", 64, 64, (g) => { const gr = g.createRadialGradient(28, 26, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(220,240,255,0.9)"); gr.addColorStop(1, "rgba(180,220,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const heatTex = () => ctex("gvHeat", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,190,90,0.95)"); gr.addColorStop(0.45, "rgba(255,140,50,0.45)"); gr.addColorStop(1, "rgba(255,120,40,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });

/** one over-tree sprinkler: riser pipe (4.3 m), a rotating impact head, a spray arc of droplets (Points, NOINK) */
type Spr = { head: THREE.Group; pts: THREE.Points; pos: V3; ph: number };
const SPR_N = 90;
const sprinkler = (b: Batch, parent: THREE.Object3D, p: V3, ph: number): Spr => {
  const galv = std("galv", { color: "#8e949c", roughness: 0.35, metalness: 0.75 }), brass = std("brass", { color: "#c49a3a", roughness: 0.3, metalness: 0.85 });
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 4.25, 8).translate(p[0], 2.125, p[2]), galv);
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8).translate(p[0], 2.1, p[2]), galv);
  const head = new THREE.Group(); head.position.set(p[0], 4.28, p[2]); parent.add(head);
  const hb = new Batch(); hb.add(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10).translate(0, 0.02, 0), brass); hb.add(new THREE.CylinderGeometry(0.022, 0.03, 0.26, 8).rotateZ(-1.2).translate(0.11, 0.08, 0), brass); hb.add(new THREE.BoxGeometry(0.16, 0.025, 0.03).translate(-0.04, 0.12, 0), brass); hb.build(head);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPR_N * 3), 3));
  const pts = new THREE.Points(geo, mat("gvSprayM", () => new THREE.PointsMaterial({ map: dropTex(), color: new THREE.Color(1.15, 1.25, 1.4), size: 0.075, sizeAttenuation: true, transparent: true, depthWrite: false, opacity: 0.9, fog: true })));
  pts.layers.set(NOINK); pts.frustumCulled = false; pts.renderOrder = 5; parent.add(pts);
  return { head, pts, pos: [p[0], 4.36, p[2]], ph };
};
const runSprinkler = (s: Spr, t: number, k: number) => {
  const a = s.pts.geometry.attributes.position as THREE.BufferAttribute; s.pts.visible = k > 0.01;
  const az = t * 1.4 + s.ph; s.head.rotation.y = -az;
  for (let i = 0; i < SPR_N; i++) {
    const u = ((t * 0.9 + i / SPR_N + s.ph) % 1), lag = az - u * 0.5 + Math.sin(i * 12.9) * 0.08, d = u * 3.9 * k;
    const j = Math.sin(i * 78.2) * 0.12;
    a.setXYZ(i, s.pos[0] + Math.cos(lag) * d + j, s.pos[1] + (1.1 * u - 3.3 * u * u) * k + Math.sin(i * 31.7) * 0.05, s.pos[2] + Math.sin(lag) * d - j);
  }
  a.needsUpdate = true; (s.pts.material as THREE.PointsMaterial).opacity = 0.9 * k;
};

export const GROVE = {
  HERO: [-3.2, 0, -4] as V3,
  HERO_ORANGE: [-1.62, 1.86, -3.32] as V3,     // the macro orange (fence-side face of the hero tree)
  ETHERMO: [-1.5, 1.6, -3.78] as V3,           // Earl's tree thermometer (plate centre), faces +x
  DTHERMO: [0.13, 1.15, -2.5] as V3,            // Duane's thermometer on a board nailed to the fence post at z 0, faces +x
  VALVE: [-1.5, 0, 2.6] as V3, WHEEL: [-1.5, 1.02, 2.6] as V3,
  DOOR: [-8.05, 0.62, 9.6] as V3,              // back-door sill centre (door in the +x wall)
  SIGN: [-2.6, 1.45, 14.85] as V3,          // the POPSICLE EARL board the kid holds up (c.sgx/sgy/sgz move it)
  CRATE_POST: [0.36, 0, 0.05] as V3,        // Duane's bet crate on the ground by the fence (scene 10 lifts it onto the rail)
  SNAP_BASE: [-3.0, 1.55, -3.4] as V3,
};
const SNAP_TIP: V3 = [-1.2, 2.45, -1.55];

export const grove = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  // ---- ground: sandy soil + grass + rime overlay ----
  const soil = lam("gvSoilM", () => ({ map: rep(soilTex(), 1, 1) }));
  (soil.map as THREE.Texture).wrapS = (soil.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
  b.add(quad(V(-90, 0, 40), V(90, 0, 40), V(90, 0, -140), V(-90, 0, -140), 45, 45), soil);
  const roadM = lam("gvRoad", () => ({ map: ctex("gvRoadT", 1024, 512, (g, r) => { g.fillStyle = "#c8b48c"; g.fillRect(0, 0, 1024, 512); for (let i = 0; i < 120; i++) blot(g, r() * 1024, r() * 512, 30 + r() * 90, r() < 0.5 ? "rgba(230,214,180,0.4)" : "rgba(130,105,75,0.25)"); for (const y of [150, 360]) { g.fillStyle = "rgba(110,88,62,0.45)"; g.fillRect(0, y - 22, 1024, 44); g.fillStyle = "rgba(240,226,196,0.35)"; g.fillRect(0, y - 26, 1024, 4); } for (let i = 0; i < 1400; i++) { const v = 150 + r() * 90; g.fillStyle = `rgba(${v},${v - 12},${v - 34},0.9)`; g.beginPath(); g.arc(r() * 1024, r() * 512, 1 + r() * 3, 0, TAU); g.fill(); } }) }));
  b.add(quad(V(-90, 0.01, 19.2), V(90, 0.01, 19.2), V(90, 0.01, 15.2), V(-90, 0.01, 15.2), 22, 1), roadM);
  const frostM = std("frostGround", { map: rep(frostTex(), 1, 1), color: "#f4fbff", transparent: true, opacity: 0, roughness: 0.3, metalness: 0, depthWrite: false });
  (frostM.map as THREE.Texture).wrapS = (frostM.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (frostM.map as THREE.Texture).repeat.set(40, 40);
  const frostG = new THREE.Mesh(new THREE.PlaneGeometry(180, 160).rotateX(-Math.PI / 2).translate(0, 0.012, -50), frostM); frostG.renderOrder = 1; frostG.receiveShadow = true; root.add(frostG);
  // grass tufts round the action zone (instanced crossed cards)
  {
    const tuftT = ctex("gvTuft", 128, 128, (g, r) => { g.clearRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { g.strokeStyle = `rgb(${60 + r() * 50},${100 + r() * 60},${40 + r() * 30})`; g.lineWidth = 3 + r() * 3; const x = 20 + r() * 88; g.beginPath(); g.moveTo(x, 128); g.quadraticCurveTo(x + (r() - 0.5) * 30, 70, x + (r() - 0.5) * 50, 10 + r() * 50); g.stroke(); } });
    const tm = swayMaterial(mat("gvTuftM", () => new THREE.MeshLambertMaterial({ map: tuftT, alphaTest: 0.45, side: THREE.DoubleSide })));
    const geo = new THREE.PlaneGeometry(0.4, 0.32).translate(0, 0.16, 0); const g2 = geo.clone().rotateY(Math.PI / 2);
    const merged = new Batch(); merged.add(geo, tm); merged.add(g2, tm); const grp = new THREE.Group(); merged.build(grp);
    const base = (grp.children[0] as THREE.Mesh).geometry; const r = rng(91), N = 900;
    const im = new THREE.InstancedMesh(base, tm, N); const M4 = new THREE.Matrix4(); let k = 0;
    for (let i = 0; i < N * 3 && k < N; i++) { const x = -14 + r() * 30, z = -16 + r() * 31; if (z > 14 && z < 19.5) continue; const s = 0.6 + r() * 0.9; M4.compose(V(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), V(s, s * (0.7 + r() * 0.6), s)); im.setMatrixAt(k++, M4); }
    im.count = k; im.receiveShadow = true; root.add(im);
  }
  // ---- the fence between the groves (x = 0) + Earl's front fence (z = 14) with the gate ----
  const wood = tex("fence", () => beamHD(), "#b8a68a"), r0 = rng(5);
  const postsZ: number[] = []; for (let z = 12.5; z >= -70; z -= 2.5) postsZ.push(z);
  for (const z of postsZ) { b.add(new THREE.BoxGeometry(0.14, 1.1, 0.14).rotateZ((r0() - 0.5) * 0.06).translate((r0() - 0.5) * 0.04, 0.53, z), wood); b.add(new THREE.ConeGeometry(0.1, 0.1, 4).rotateY(Math.PI / 4).translate(0, 1.13, z), wood); }
  for (let i = 0; i < postsZ.length - 1; i++) for (const h of [0.3, 0.62, 0.92]) { const z0 = postsZ[i], z1 = postsZ[i + 1], sag = (r0() - 0.5) * 0.05; b.add(new THREE.BoxGeometry(0.09, 0.11, Math.abs(z1 - z0) + 0.1).translate(0.08, h + sag, (z0 + z1) / 2), wood); }
  const frontX: number[] = []; for (let x = -3.6; x >= -60; x -= 2.5) frontX.push(x);
  for (const x of [0, ...frontX]) b.add(new THREE.BoxGeometry(0.14, 1.1, 0.14).translate(x, 0.53, 14), wood);
  b.add(new THREE.BoxGeometry(0.16, 1.3, 0.16).translate(-1.6, 0.63, 14), wood); b.add(new THREE.BoxGeometry(0.16, 1.3, 0.16).translate(-3.6, 0.63, 14), wood);
  const fx = [0, -1.6]; for (let i = 0; i < fx.length - 1; i++) for (const h of [0.3, 0.62, 0.92]) b.add(new THREE.BoxGeometry(Math.abs(fx[1] - fx[0]), 0.11, 0.09).translate((fx[0] + fx[1]) / 2, h, 14.06), wood);
  const fxs = frontX; for (let i = 0; i < fxs.length - 1; i++) for (const h of [0.3, 0.62, 0.92]) b.add(new THREE.BoxGeometry(Math.abs(fxs[i + 1] - fxs[i]), 0.11, 0.09).translate((fxs[i] + fxs[i + 1]) / 2, h, 14.06), wood);
  // the gate (open, swung in) + the hand-painted sign board on the right gate post
  const gate = new THREE.Group(); gate.position.set(-1.6, 0, 14.05); gate.rotation.y = -1.19; root.add(gate);
  { const gb = new Batch(); for (const h of [0.28, 0.6, 0.9]) gb.add(new THREE.BoxGeometry(1.95, 0.1, 0.07).translate(0.98, h, 0), wood); gb.add(new THREE.BoxGeometry(0.1, 0.85, 0.07).rotateZ(0.6).translate(0.98, 0.6, 0.01), wood); for (const x of [0.06, 1.9]) gb.add(new THREE.BoxGeometry(0.09, 1.0, 0.08).translate(x, 0.55, 0), wood); gb.build(gate); }
  const signM = new THREE.MeshBasicMaterial({ map: signTex(1), color: new THREE.Color(1.7, 1.6, 1.5), toneMapped: true });   // readable at night (lit by the headlights)
  const signG = new THREE.Group(); signG.position.set(...GROVE.SIGN); root.add(signG);
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.38, 0.035), tex("signWood", () => beamHD(), "#cfb58a")); signBoard.castShadow = true; signG.add(signBoard);
  for (const sx of [-0.28, 0.28]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.03), tex("signWood", () => beamHD(), "#cfb58a")); st.position.set(sx, -0.38, 0.03); signG.add(st); }
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(0.97, 0.36), signM); signFace.position.set(0, 0, -0.019); signFace.rotation.y = Math.PI; signG.add(signFace);   // the painted face looks -z (into the grove)
  // ---- Earl's grove: the hero tree, the rows, sprinklers, the ice coat ----
  const peelE = std("peelE", { map: peelTex("E", "#f08a1c", "#ffb24a", "#c8600e"), roughness: 0.55, metalness: 0 });
  const peelD = std("peelD", { map: peelTex("D", "#e88a24", "#ffb44c", "#b8600e"), roughness: 0.6, metalness: 0 });
  const cutT = leafCutTex("E", "#2f6a2c", "#5c9c40", "#1f4a22"), cutTD = leafCutTex("D", "#346e2e", "#64a244", "#22502a");
  const cutE = swayMaterial(mat("gvCutE", () => new THREE.MeshLambertMaterial({ map: cutT, alphaTest: 0.5, side: THREE.DoubleSide })));
  const cutD = swayMaterial(mat("gvCutD", () => new THREE.MeshLambertMaterial({ map: cutTD, alphaTest: 0.5, side: THREE.DoubleSide })));
  const iceM = new THREE.MeshStandardMaterial({ color: "#eaf7ff", alphaMap: cutT, emissive: "#6a9ac8", emissiveIntensity: 0.22, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const ballM = new THREE.MeshStandardMaterial({ color: "#f2faff", emissive: "#7aa6d0", emissiveIntensity: 0.12, roughness: 0.02, metalness: 0.3, transparent: true, opacity: 0, depthWrite: false });
  const glintM = new THREE.PointsMaterial({ map: glintTex(), color: new THREE.Color(1.6, 1.7, 1.9), size: 0.03, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false });
  const icM = new THREE.MeshStandardMaterial({ color: "#f2fbff", emissive: "#7aa8d0", emissiveIntensity: 0.3, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0 });
  const leafE = LEAF(), leafD = LEAF_D();
  const earlTrees: Tree[] = [], iceGroups: THREE.Group[] = [], sprs: Spr[] = [];
  const snapSkip = (q: V3) => { const A = V(...GROVE.SNAP_BASE), B = V(...SNAP_TIP), P = V(...q); const ab = B.clone().sub(A), u = cl(P.clone().sub(A).dot(ab) / ab.lengthSq()); return P.distanceTo(A.clone().addScaledVector(ab, u)) < 0.55 && u > 0.35; };
  const heroSkip = (q: V3) => snapSkip(q) || V(...q).distanceTo(V(...GROVE.HERO_ORANGE)) < 0.32 || V(...q).distanceTo(V(...GROVE.ETHERMO)) < 0.3;
  const COLS_E = [-3.2, -8.7, -14.2, -19.7, -25.2, -30.7, -36.2];
  const ROWS_E = [8, 2, -4, -10, -16, -22, -28, -34, -40, -46, -52, -58, -64];
  let ti = 0;
  for (const z of ROWS_E) for (const x of COLS_E) {
    if ((z === 8 && x < -5) || (z === 2 && x === -3.2)) continue;   // the valve yard by the fence stays open
    const near = Math.abs(x) < 10 && z > -18, det = Math.abs(x) < 6 && z > -11 ? 2 : near ? 1 : Math.abs(x) < 20 && z > -40 ? 1 : 0;
    const h = 3.5 + rng(ti * 7 + 1)() * 0.5, hero = x === -3.2 && z === -4;
    const t = orangeTree(b, root, [x, 0, z], hero ? 3.7 : h, 100 + ti, hero ? 2 : det, det === 0 ? 0 : hero ? 46 : near ? 34 : 18, leafE, peelE, hero ? heroSkip : undefined, cutE);
    earlTrees.push(t); ti++;
    if (hero) { const o = V(...GROVE.HERO_ORANGE).sub(t.crown.position); for (const [dx, dy, dz, rr] of [[-0.22, -0.04, -0.04, 0.27], [-0.2, 0.12, 0.26, 0.22], [-0.16, -0.2, -0.3, 0.24]] as [number, number, number, number][]) { const sup = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 2).scale(1, 0.86, 1), leafE); sup.position.set(o.x + dx, o.y + dy, o.z + dz); sup.castShadow = true; t.crown.add(sup); t.lumps.push([o.x + dx, o.y + dy, o.z + dz, rr]); } }
    if (det > 0) iceGroups.push(iceCoat(t.crown, t, iceM, ballM, icM, glintM, near ? 30 : 8));
    if (z > -30 && x > -22 && z < 5) sprs.push(sprinkler(b, root, [x - 2.75, 0, z + 3.0], ti * 0.77));
  }
  // the main pipe on the ground + the valve riser with the red handwheel
  const galv = std("galv", { color: "#8e949c", roughness: 0.35, metalness: 0.75 }), red = std("wheelRed", { color: "#c8302a", roughness: 0.45, metalness: 0.3 });
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 40, 10).rotateX(Math.PI / 2).translate(-1.5, 0.07, -16), galv);
  for (const z of ROWS_E.filter((z) => z > -30 && z < 5)) b.add(new THREE.CylinderGeometry(0.045, 0.045, 24, 8).rotateZ(Math.PI / 2).translate(-13.5, 0.06, z + 3.0), galv);
  b.add(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 10).translate(-1.5, 0.5, 2.6), galv);
  b.add(new THREE.SphereGeometry(0.12, 16, 12).scale(1, 0.9, 1.2).translate(-1.5, 0.95, 2.6), galv); for (const dz of [-0.16, 0.16]) b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 16).rotateX(Math.PI / 2).translate(-1.5, 0.95, 2.6 + dz), galv); b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8).rotateZ(Math.PI / 2).translate(-1.4, 1.02, 2.6), galv);
  const wheel = new THREE.Group(); wheel.position.set(...GROVE.WHEEL); wheel.position.x += 0.17; root.add(wheel);
  { const wb = new Batch(); wb.add(new THREE.TorusGeometry(0.21, 0.026, 8, 28).rotateY(Math.PI / 2), red); for (let k = 0; k < 4; k++) wb.add(new THREE.BoxGeometry(0.02, 0.4, 0.03).rotateX((k * Math.PI) / 4), red); wb.add(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10).rotateZ(Math.PI / 2), red); wb.build(wheel); }
  // a coiled hose by the valve, a crate seat, the thermos
  for (let i = 0; i < 4; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34 - i * 0.04, 0.03, 6, 26), std("hose", { color: "#3f9a4a", roughness: 0.45 })); ring.rotation.x = Math.PI / 2; ring.position.set(-2.3, 0.04 + i * 0.05, 3.3); ring.castShadow = true; root.add(ring); }
  crate(b, root, [-2.0, 0, 3.75], 0.5, undefined, 0.3, { seed: 7 });
  // the snapping bough on the hero tree (its own group, hinged at its base)
  const snapG = new THREE.Group(); snapG.position.set(...GROVE.SNAP_BASE); root.add(snapG);
  const snapIce = new THREE.Group(); snapG.add(snapIce);
  {
    const sb = new Batch(), ib2 = new Batch(), A = V(0, 0, 0), B = V(...SNAP_TIP).sub(V(...GROVE.SNAP_BASE)), len = A.distanceTo(B), bark = tex("bark", barkTex);
    sb.add(new THREE.CylinderGeometry(0.035, 0.07, len, 7).translate(0, len / 2, 0).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), B.clone().normalize()))), bark);
    const r = rng(404);
    for (let i = 0; i < 9; i++) { const u = 0.35 + (i / 8) * 0.68, c = B.clone().multiplyScalar(u).add(V((r() - 0.5) * 0.25, (r() - 0.3) * 0.25, (r() - 0.5) * 0.25)), rr = 0.24 + r() * 0.12; sb.add(new THREE.IcosahedronGeometry(rr, 2).scale(1, 0.85, 1).translate(c.x, c.y, c.z), leafE); sb.add(new THREE.IcosahedronGeometry(rr * 1.13, 1).scale(1, 0.88, 1).translate(c.x, c.y, c.z), cutE); ib2.add(new THREE.IcosahedronGeometry(rr * 1.16, 1).scale(1, 0.9, 1).translate(c.x, c.y, c.z), iceM);
      for (let k = 0; k < 2; k++) { const q = c.clone().add(V((r() - 0.5) * rr * 1.6, -rr * 0.6, (r() - 0.5) * rr * 1.6)); sb.add(new THREE.SphereGeometry(0.062, 10, 8).translate(q.x, q.y, q.z), peelE); ib2.add(new THREE.SphereGeometry(0.082, 12, 10).translate(q.x, q.y, q.z), ballM); }
      for (let k = 0; k < 3; k++) { const L = 0.06 + r() * 0.1; ib2.add(new THREE.ConeGeometry(0.011, L, 5).rotateX(Math.PI).translate(c.x + (r() - 0.5) * rr, c.y - rr * 0.85 - L / 2, c.z + (r() - 0.5) * rr), icM); } }
    sb.build(snapG); ib2.build(snapIce); snapG.traverse((m) => { (m as THREE.Mesh).castShadow = true; });
  }
  const snapDust = [0, 1, 2, 3, 4].map((i) => mist(root, [SNAP_TIP[0], 0.3, SNAP_TIP[2]], 1.0, "#e8f4ff", 0));
  const shards = sparkles(root, 24, [-1.4, 0.05, -1.4], 1.8, 0.5, 1.8, 41, 0.3);
  // the macro orange: a big-poly orange with its own ice skin, drops landing, a warm heat pulse; the tree thermometer
  const heroOr = new THREE.Group(); heroOr.position.set(...GROVE.HERO_ORANGE); root.add(heroOr);
  const hoPeel = std("peelHero", { map: peelTex("H", "#f28a1a", "#ffbe58", "#c45c0c"), roughness: 0.5, metalness: 0, bumpMap: peelTex("Hb", "#808080", "#a0a0a0", "#606060"), bumpScale: 0.6 });
  const ho = new THREE.Mesh(new THREE.SphereGeometry(0.075, 40, 28), hoPeel); ho.castShadow = true; heroOr.add(ho);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.07, 6).translate(0, 0.1, 0), col("#4a5a2a")); heroOr.add(stem);
  const leafOne = new THREE.MeshStandardMaterial({ map: oneLeafTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.42, metalness: 0 });
  const leafGlaze = new THREE.MeshStandardMaterial({ color: "#f0f9ff", alphaMap: oneLeafTex(), emissive: "#6a9ac8", emissiveIntensity: 0.2, roughness: 0.03, metalness: 0.3, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const heroLeaves = new THREE.Group(); heroOr.add(heroLeaves);
  { const r = rng(808); for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + r() * 0.3, el = -0.3 + r() * 0.9, L = 0.11 + r() * 0.05; const geo = new THREE.PlaneGeometry(L, L * 0.45, 6, 2); const pp = geo.attributes.position as THREE.BufferAttribute; for (let k = 0; k < pp.count; k++) { const x = pp.getX(k); pp.setZ(k, -0.25 * (x / L) ** 2 * L); } geo.computeVertexNormals(); geo.translate(L / 2 + 0.05, 0, 0);
      const m = new THREE.Mesh(geo, leafOne); m.rotation.set(r() * 0.6 - 0.3, -a, el); m.position.set(-0.03 - r() * 0.04, 0.06 + r() * 0.06, 0); m.castShadow = true; heroLeaves.add(m);
      const gz = new THREE.Mesh(geo, leafGlaze); gz.rotation.copy(m.rotation); gz.position.copy(m.position); gz.scale.setScalar(1.03); gz.renderOrder = 3; heroLeaves.add(gz); } }
  const hoIceM = new THREE.MeshPhysicalMaterial({ color: "#eef8ff", roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0, depthWrite: false });   // no transmission: it re-rendered the whole grove every frame (software GL)
  const hoIce = new THREE.Mesh(new THREE.SphereGeometry(0.1, 48, 32), hoIceM); hoIce.renderOrder = 3; heroOr.add(hoIce);
  const hoIcicles = new THREE.Group(); heroOr.add(hoIcicles);
  { const ib3 = new Batch(); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3, L = 0.025 + (k % 3) * 0.015; ib3.add(new THREE.ConeGeometry(0.007, L, 6).rotateX(Math.PI).translate(Math.cos(a) * 0.05, -0.1 - L / 2, Math.sin(a) * 0.05), icM); } ib3.build(hoIcicles); }
  const dropM = new THREE.SpriteMaterial({ map: dropTex(), color: new THREE.Color(1.2, 1.3, 1.5), transparent: true, depthWrite: false, fog: false });
  const drops = Array.from({ length: 6 }, (_, i) => { const s = new THREE.Sprite(dropM); s.scale.setScalar(0.026); s.layers.set(NOINK); s.renderOrder = 6; heroOr.add(s); s.userData = { a: (i / 6) * TAU + 0.4, ph: i / 6 }; return s; });
  const heatM = new THREE.SpriteMaterial({ map: heatTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  const heats = Array.from({ length: 6 }, (_, i) => { const s = new THREE.Sprite(heatM.clone()); s.layers.set(NOINK); s.renderOrder = 7; heroOr.add(s); s.userData = { a: (i / 6) * TAU + 0.4, ph: i / 6 }; return s; });
  const heatCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: heatTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); heatCore.scale.setScalar(0.32); heatCore.layers.set(NOINK); heatCore.renderOrder = 7; heroOr.add(heatCore);
  const thermo = (pos: V3, yaw: number, key: string) => {
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; root.add(g);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.012), std("thermoTin", { color: "#a8a49a", roughness: 0.35, metalness: 0.6 })); plate.castShadow = true; g.add(plate);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.128, 0.384), new THREE.MeshBasicMaterial({ map: thermoTex(key), toneMapped: true })); face.position.z = 0.0065; g.add(face);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.33, 8), new THREE.MeshStandardMaterial({ color: "#eef6fa", transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false })); tube.position.set(-0.012, 0.0, 0.016); g.add(tube);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), new THREE.MeshBasicMaterial({ color: "#d42a20" })); bulb.position.set(-0.012, -0.175, 0.016); g.add(bulb);
    const liq = new THREE.Mesh(new THREE.BoxGeometry(0.011, 1, 0.006).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: "#e0201a" })); liq.position.set(-0.012, -0.17, 0.02); g.add(liq);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 4, 12), galv); hook.position.y = 0.23; g.add(hook);
    // 16 deg at -0.161, 40 deg at +0.161 (matches thermoTex: y 700 -> 80 of 768 on a 0.384 face)
    const set = (deg: number) => { const y = -0.161 + (cl((deg - 16) / 24)) * 0.323; liq.scale.y = Math.max(0.001, y + 0.17); };
    return { g, set };
  };
  const eTh = thermo(GROVE.ETHERMO, Math.PI / 2, "E"); rod(root, [GROVE.ETHERMO[0], GROVE.ETHERMO[1] + 0.24, GROVE.ETHERMO[2]], [GROVE.ETHERMO[0] - 0.25, GROVE.ETHERMO[1] + 0.45, GROVE.ETHERMO[2] - 0.1], 0.008, tex("bark", barkTex));
  const dTh = thermo(GROVE.DTHERMO, Math.PI / 2, "D"); b.add(new THREE.BoxGeometry(0.03, 0.66, 0.2).translate(0.1, GROVE.DTHERMO[1] - 0.07, GROVE.DTHERMO[2]), wood);
  // ---- Duane's grove: trees (frost overlay), smudge pots ----
  const dFrostM = new THREE.MeshStandardMaterial({ map: frostTex(), alphaMap: cutTD, color: "#f6fbff", transparent: true, opacity: 0, roughness: 0.4, depthWrite: false, side: THREE.DoubleSide });
  const dTrees: Tree[] = [], dFrostG: THREE.Group[] = [];
  const COLS_D = [4.0, 9.5, 15.0, 20.5, 26.0, 31.5];
  const ROWS_D = [8.5, 2.5, -3.5, -9.5, -15.5, -21.5, -27.5, -33.5, -39.5, -45.5, -51.5, -57.5, -63.5];
  ROWS_D.forEach((z, zi) => COLS_D.forEach((x, xi) => {
    const near = x < 12 && z > -18, det = x < 6 && z > -6 ? 2 : near ? 1 : x < 22 && z > -40 ? 1 : 0;
    const t = orangeTree(b, root, [x, 0, z], 3.4 + rng(zi * 13 + xi)() * 0.5, 500 + zi * 10 + xi, det, det === 0 ? 0 : near ? 32 : 16, leafD, peelD, undefined, cutD); dTrees.push(t);
    if (det > 0) { const fg = new THREE.Group(); t.crown.add(fg); const fb = new Batch(); for (const L of t.lumps) fb.add(new THREE.IcosahedronGeometry(L[3] * 1.15, 1).scale(1, 0.89, 1).translate(L[0], L[1], L[2]), dFrostM); for (const q of t.fruit) fb.add(new THREE.SphereGeometry(0.067, 8, 6).translate(q[0], q[1], q[2]), dFrostM); fb.build(fg); dFrostG.push(fg); }
  }));
  const POTS: [number, number][] = [[2.0, 0.4], [2.0, -6.4], [6.75, 2.5], [6.75, -3.5], [6.75, -9.5], [12.25, -0.5], [12.25, -6.5], [4.0, -12.5], [9.5, -12.5], [6.75, -15.5], [12.25, -18.5], [4.0, -18.5], [6.75, -21.5], [12.25, -24.5], [4.0, -24.5], [17.75, -3.5], [17.75, -9.5], [17.75, 2.5], [2.0, -12.4], [2.0, -18.4]];
  const pots = POTS.map(([x, z], i) => smudgePot(b, root, [x, 0, z], i < 6));
  // ---- the pump shed, the farmhouse, the scarecrow garden ----
  const tin = tex("tin", tinTex), clapE = tex("clapE", () => clapTex("#d9cba8")), clapS = tex("clapS", () => clapTex("#8a6a4a")), trim = col("#5a6e7a");
  b.add(boxGeo(V(-6.7, 0, 5.3), V(-4.5, 2.3, 7.5), 1), clapS);
  b.add(new THREE.BoxGeometry(2.7, 0.06, 2.8).rotateX(0.18).translate(-5.6, 2.45, 6.4), tin);
  b.add(boxGeo(V(-4.52, 0, 6.0), V(-4.48, 1.9, 6.9)), tex("shedDoor", () => planksHD(), "#7a5a3a"));
  const shedLamp = lamp(root, [-4.35, 2.0, 7.25], "#ffb45a", 6, 8, "wall");
  barrel(root, [-4.1, 0, 5.2], 0.38); sack(root, [-4.2, 0, 7.9], 0.3);
  // the farmhouse: a Florida cracker house raised on piers, tin roof, back door + steps on the +x wall
  const HX0 = -15.0, HX1 = -8.2, HZ0 = 6.6, HZ1 = 12.6, FL = 0.6;
  for (const x of [HX0, (HX0 + HX1) / 2, HX1]) for (const z of [HZ0, (HZ0 + HZ1) / 2, HZ1]) b.add(new THREE.BoxGeometry(0.3, FL, 0.3).translate(x, FL / 2, z), tex("pier", () => stoneHD("gvPier", ["#b8a898", "#a89888", "#c4b4a4", "#9c8c7c"], "#7a6a5a")));
  b.add(boxGeo(V(HX0, FL - 0.1, HZ0), V(HX1, FL, HZ1), 1), tex("floorP", () => planksHD(), "#9a7a5a"));
  b.add(boxGeo(V(HX0, FL, HZ0), V(HX0 + 0.12, FL + 2.8, HZ1), 1), clapE); b.add(boxGeo(V(HX0, FL, HZ0), V(HX1, FL + 2.8, HZ0 + 0.12), 1), clapE); b.add(boxGeo(V(HX0, FL, HZ1 - 0.12), V(HX1, FL + 2.8, HZ1), 1), clapE);
  b.add(boxGeo(V(HX1 - 0.12, FL, HZ0), V(HX1, FL + 2.8, 9.12), 1), clapE); b.add(boxGeo(V(HX1 - 0.12, FL, 10.08), V(HX1, FL + 2.8, HZ1), 1), clapE); b.add(boxGeo(V(HX1 - 0.12, FL + 2.15, 9.12), V(HX1, FL + 2.8, 10.08), 1), clapE);
  // the kitchen inside the back door: warm wallpaper, a dresser with plates, a hanging pan
  b.add(quad(V(HX1 - 2.6, FL, 8.0), V(HX1 - 2.6, FL, 11.2), V(HX1 - 2.6, FL + 2.8, 11.2), V(HX1 - 2.6, FL + 2.8, 8.0), 2, 2), lam("gvPaper", () => ({ map: ctex("gvPaperT", 256, 256, (g, r) => { g.fillStyle = "#c98a5a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(255,230,190,0.35)"; g.fillRect(i * 32, 0, 10, 256); } for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(120,60,40,0.4)"; g.beginPath(); g.arc(r() * 256, r() * 256, 5, 0, TAU); g.fill(); } }) })));
  b.add(boxGeo(V(HX1 - 2.6, FL, 9.1), V(HX1 - 2.1, FL + 1.8, 10.3)), tex("dresser", () => planksHD(), "#7a4a2e"));
  for (let i = 0; i < 4; i++) b.add(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16).rotateZ(Math.PI / 2).translate(HX1 - 2.1, FL + 1.2 + (i % 2) * 0.3, 9.35 + Math.floor(i / 2) * 0.5), col("#e8e2d0"));
  b.add(boxGeo(V(HX0 - 0.1, FL + 2.8, HZ0 - 0.1), V(HX1 + 0.1, FL + 2.9, HZ1 + 0.1)), trim);
  { const rf = roofHD("#8a9098"); const rm = tex("roofTin", () => rf); const cx = (HX0 + HX1) / 2, hw = (HX1 - HX0) / 2 + 0.6, y0 = FL + 2.85;
    b.add(quad(V(cx - hw, y0, HZ0 - 0.6), V(cx + hw, y0, HZ0 - 0.6), V(cx + hw, y0 + 1.7, (HZ0 + HZ1) / 2), V(cx - hw, y0 + 1.7, (HZ0 + HZ1) / 2), 4, 2), rm);
    b.add(quad(V(cx + hw, y0, HZ1 + 0.6), V(cx - hw, y0, HZ1 + 0.6), V(cx - hw, y0 + 1.7, (HZ0 + HZ1) / 2), V(cx + hw, y0 + 1.7, (HZ0 + HZ1) / 2), 4, 2), rm);
    for (const x of [HX0 + 0.02, HX1 - 0.02]) { b.add(tri(V(x, y0, HZ0 - 0.1), V(x, y0, HZ1 + 0.1), V(x, y0 + 1.55, (HZ0 + HZ1) / 2)), clapE); b.add(tri(V(x, y0, HZ1 + 0.1), V(x, y0, HZ0 - 0.1), V(x, y0 + 1.55, (HZ0 + HZ1) / 2)), clapE); }
    b.add(new THREE.BoxGeometry(0.5, 1.6, 0.5).translate(HX0 + 1.4, y0 + 1.4, HZ0 + 1.6), tex("chimney", () => stoneHD("gvChim", ["#9a5a44", "#8a4e3a", "#a8644c", "#7e4634"], "#5a3a2a"))); }
  // back door (+x wall, z 9.6): frame, hinged door (opens inward), steps, porch light; kitchen window beside it
  b.add(boxGeo(V(HX1 - 0.02, FL, 9.05), V(HX1 + 0.06, FL + 2.15, 9.12)), trim); b.add(boxGeo(V(HX1 - 0.02, FL, 10.08), V(HX1 + 0.06, FL + 2.15, 10.15)), trim); b.add(boxGeo(V(HX1 - 0.02, FL + 2.1, 9.05), V(HX1 + 0.06, FL + 2.2, 10.15)), trim);
  const doorWarm = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 2.08).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb85a").multiplyScalar(1.3) })); doorWarm.position.set(HX1 - 0.05, FL + 1.04, 9.6); root.add(doorWarm);
  const door = new THREE.Group(); door.position.set(HX1 + 0.01, FL, 10.08); root.add(door);
  { const dm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.08, 0.96).translate(0, 1.04, -0.48), tex("doorP", () => planksHD(), "#4f7a8a")); dm.castShadow = true; door.add(dm); const kb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), std("brass", { color: "#c49a3a", roughness: 0.3, metalness: 0.85 })); kb.position.set(0.05, 1.0, -0.85); door.add(kb); }
  for (let i = 0; i < 3; i++) b.add(new THREE.BoxGeometry(0.34, 0.06, 1.2).translate(HX1 + 0.2 + i * 0.3, FL - 0.2 - i * 0.2, 9.6), tex("step", () => planksHD(), "#a88a6a"));
  for (let i = 0; i < 3; i++) b.add(new THREE.BoxGeometry(0.3, FL - 0.2 - i * 0.2, 1.1).translate(HX1 + 0.2 + i * 0.3, (FL - 0.2 - i * 0.2) / 2, 9.6), tex("stepR", () => planksHD(), "#8a6a4a"));
  const porchLamp = lamp(root, [HX1 + 0.12, FL + 2.3, 10.5], "#ffbe6a", 7, 7, "wall");
  const winM = new THREE.MeshBasicMaterial({ map: winTex(), toneMapped: true });
  const wins = [[HX1 + 0.01, FL + 1.2, 11.6, Math.PI / 2], [HX1 + 0.01, FL + 1.2, 7.6, Math.PI / 2], [-11.6, FL + 1.2, HZ0 - 0.01, Math.PI]].map(([x, y, z, ry]) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.1), winM); w.position.set(x, y, z); w.rotation.y = ry; root.add(w); const xs = ry === Math.PI ? 0.45 : 0.06, zs = ry === Math.PI ? 0.06 : 0.45; b.add(boxGeo(V(x - xs, y - 0.62, z - zs), V(x + xs, y - 0.56, z + zs)), trim); return w; });
  const houseLight = new THREE.PointLight("#ffb860", 0, 7, 1.4); houseLight.position.set(HX1 - 1.2, FL + 1.9, 9.6); root.add(houseLight);
  const spill = new THREE.PointLight("#ffb860", 0, 5, 1.6); spill.position.set(HX1 + 0.7, FL + 1.2, 9.6); root.add(spill);
  // the scarecrow's garden: a cross pole, collard rows, a bucket
  const scarePole = new THREE.Group(); scarePole.position.set(-6.0, 0, 10.6); root.add(scarePole);
  { const pb = new Batch(); pb.add(new THREE.CylinderGeometry(0.04, 0.05, 1.9, 6).translate(0, 0.95, 0), tex("bark", barkTex)); pb.add(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6).rotateX(Math.PI / 2).translate(0, 1.55, 0), tex("bark", barkTex)); pb.build(scarePole); }
  for (let i = 0; i < 10; i++) b.add(new THREE.IcosahedronGeometry(0.2, 1).scale(1, 0.6, 1).translate(-7.2 + (i % 5) * 0.55, 0.12, 11.6 + Math.floor(i / 5) * 0.6), lam("collard", () => ({ map: leafTex("gvCol", "#4a8a5a", "#7ab07a", "#2a5a3a") })));
  // ---- the farm truck on the road (townsfolk at midnight) ----
  const truck = flatbed(root, { load: false, cab: "#c86a2a", doorText: "OKEE FEED & SEED" }); truck.g.position.set(-9.0, 0, 17.6); truck.g.rotation.y = Math.PI / 2;
  const headL = [-1, 1].map((s) => { const L = new THREE.SpotLight("#ffe6b0", 0, 22, 0.55, 0.6, 1.2); L.position.set(-9.0 + 4.05, 1.28, 17.6 + s * 0.95); L.target.position.set(4, 0, 17.6 + s * 2); root.add(L, L.target); return L; });
  const headG = [-1, 1].map((s) => glow(root, [-9.0 + 4.1, 1.28, 17.6 + s * 0.95], "#fff0c0", 1.2, 0));
  const truckFill = new THREE.PointLight("#9ab0e0", 0, 9, 1.2); truckFill.position.set(-8.0, 3.2, 13.8); root.add(truckFill);
  // background: distant tree lines, a water tower, the moon, stars
  for (let i = 0; i < 26; i++) { const x = -120 + i * 10 + rng(i)() * 4, z = -150 - rng(i + 50)() * 20; b.add(new THREE.IcosahedronGeometry(5 + rng(i + 9)() * 3, 1).scale(1.4, 0.9, 1).translate(x, 3.5, z), leafE); }
  { const tw = new THREE.Group(); tw.position.set(-40, 0, -110); root.add(tw); const tb = new Batch(); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tb.add(new THREE.CylinderGeometry(0.15, 0.2, 14, 6).translate(sx * 2, 7, sz * 2), galv); tb.add(new THREE.CylinderGeometry(3, 3, 3.5, 20).translate(0, 15.5, 0), col("#b8bcc4")); tb.add(new THREE.ConeGeometry(3.2, 1.6, 20).translate(0, 18.1, 0), col("#9aa0a8")); tb.build(tw);
    const tl = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.1), new THREE.MeshBasicMaterial({ map: ctex("gvTowerT", 512, 112, (g) => { g.clearRect(0, 0, 512, 112); g.fillStyle = "#3a4a8a"; g.font = "900 80px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("OKEE", 256, 60); }), transparent: true })); tl.position.set(0, 15.6, 3.02); tw.add(tl); }
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("gvMoon", 256, 256, (g, r) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,252,236,1)"); gr.addColorStop(0.36, "rgba(250,246,226,1)"); gr.addColorStop(0.4, "rgba(200,214,255,0.35)"); gr.addColorStop(1, "rgba(160,180,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) blot(g, 100 + r() * 60, 100 + r() * 60, 6 + r() * 12, "rgba(190,190,180,0.35)"); }), transparent: true, depthWrite: false, fog: false }));
  moon.position.set(-60, 75, -160); moon.scale.setScalar(26); moon.layers.set(NOINK); moon.renderOrder = -0.5; root.add(moon);
  const starG = new THREE.BufferGeometry(); { const r = rng(77), a = new Float32Array(900 * 3); for (let i = 0; i < 900; i++) { const th = r() * Math.PI - Math.PI, el = 0.12 + r() * 1.3, R = 380; a.set([Math.cos(th) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(th) * Math.cos(el) * R], i * 3); } starG.setAttribute("position", new THREE.BufferAttribute(a, 3)); }
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: "#eef2ff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false })); stars.layers.set(NOINK); stars.frustumCulled = false; root.add(stars);
  // ---- the bet crate on the fence rail ----
  const betCrate = new THREE.Group(); root.add(betCrate); { const cb2 = new Batch(); crate(cb2, betCrate, [0, 0, 0], 0.46, "DUANE'S", Math.PI / 2, { seed: 3, w: 0.58, d: 0.42 }); cb2.build(betCrate); }
  betCrate.position.set(GROVE.CRATE_POST[0], GROVE.CRATE_POST[1], GROVE.CRATE_POST[2]);
  const chips = sparkles(root, 10, [0, 0, 0], 0.1, 0.1, 0.1, 71, 0.08); chips.forEach((sp) => (sp.visible = false));
  // ---- carried lanterns (lights follow the hands) ----
  const lanterns = [0, 1].map(() => { const L = new THREE.PointLight("#ffb050", 0, 7, 1.5); root.add(L); const gl2 = glow(root, [0, 0, 0], "#ffb050", 0.9, 0); return { L, gl: gl2 }; });
  // spray mist over Earl's canopy (lit by the lanterns), sparkles on the ice
  const sprayMist = sprs.slice(0, 8).flatMap((s) => [0, 1].map((k) => mist(root, [s.pos[0] - 1.4, 3.6 + k * 0.6, s.pos[2] - 2.9], 3.0, "#dcecff", 0)));
  const glints = sparkles(root, 70, [-6, 0.9, -6], 12, 3, 18, 12, 0.26);
  const meltSparks = sparkles(root, 90, [-8, 0.2, -6], 16, 3.6, 20, 33, 0.4);
  // falling ice sheets (sunrise melt): flat glassy shards under the near crowns
  const sheetM = new THREE.MeshStandardMaterial({ color: "#eaf8ff", emissive: "#8ab8e0", emissiveIntensity: 0.25, roughness: 0.03, metalness: 0.35, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const sheets = earlTrees.filter((t) => t.lumps.length > 12).slice(0, 10).flatMap((t, ti2) => Array.from({ length: 6 }, (_, k) => { const L = t.lumps[(k * 5 + ti2) % t.lumps.length], m = new THREE.Mesh(new THREE.CircleGeometry(0.09 + (k % 3) * 0.04, 5), sheetM); const p0 = t.crown.position.clone().add(V(L[0], L[1], L[2])); m.userData = { p0, ph: (k * 0.13 + ti2 * 0.07) % 0.5, sp: 0.8 + (k % 4) * 0.2, rot: k * 1.3 }; m.renderOrder = 4; root.add(m); return m; }));
  // Earl's hose stream: a jet of droplets from the nozzle (c.hx/hy/hz) arcing to the target (c.tx/ty/tz), splash mist there
  const HN = 110, hoseG = new THREE.BufferGeometry(); hoseG.setAttribute("position", new THREE.BufferAttribute(new Float32Array(HN * 3), 3));
  const hoseP = new THREE.Points(hoseG, new THREE.PointsMaterial({ map: dropTex(), color: new THREE.Color(1.2, 1.3, 1.45), size: 0.028, sizeAttenuation: true, transparent: true, depthWrite: false, opacity: 0.95, fog: true }));
  hoseP.layers.set(NOINK); hoseP.frustumCulled = false; hoseP.renderOrder = 5; root.add(hoseP);
  const hoseMist = [0, 1, 2].map(() => mist(root, [0, 0, 0], 0.35, "#e8f4ff", 0));
  // the jet itself: a thin tube along the arc with a streaming water texture (rebuilt only when its ends move)
  const jetT = streamTex().clone(); jetT.needsUpdate = true; jetT.wrapS = jetT.wrapT = THREE.RepeatWrapping; jetT.repeat.set(1, 4);
  const jetM = new THREE.MeshStandardMaterial({ map: jetT, color: "#e6f6ff", emissive: "#6aa8d0", emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85, depthWrite: false });
  const jet = new THREE.Mesh(new THREE.BufferGeometry(), jetM); jet.renderOrder = 5; root.add(jet); let jetKey = "";
  b.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK)) { if (!(m.material as THREE.Material).transparent) m.castShadow = true; m.receiveShadow = true; } });
  // render speed (software GL): crowns more than ~14 m from the action cast no shadow (the shadow pass renders every caster)
  for (const t of [...earlTrees, ...dTrees]) { const p = t.crown.position; if (Math.abs(p.x) > 14 || p.z < -20) t.crown.traverse((o) => { (o as THREE.Mesh).castShadow = false; }); }
  frostG.castShadow = false;

  const marks: Record<string, V3> = {
    earlHook: [-0.95, 0, -2.2], earlValve: [-0.95, 0, 2.6], earlSeat: [-2.0, 0.5, 3.75], earl3am: [-1.25, 0, -1.25], earlMacro: [-0.85, 0, -2.75],
    duaneFence: [0.78, 0, 0.55], duanePots: [2.6, 0, -0.9], duaneThermo: [0.85, 0, -1.25], hand1: [0.85, 0, -2.2], hand2: [1.75, 0, -3.3], hand3: [1.6, 0, -1.1],
    scare: [-7.1, 0, 9.55], june: [-8.35, FL, 9.6], gateEarl: [-2.9, 0, 11.6], town1: [-3.3, 0, 15.9], town2: [-2.2, 0, 16.6], town3: [-1.05, 0, 15.6], town4: [-4.5, 0, 16.9],
  };
  const cams = {
    hook: { pos: [-0.2, 1.55, 0.2] as V3, look: [-2.0, 1.55, -3.0] as V3, fov: 44 },
    fence: { pos: [-3.2, 1.9, 4.2] as V3, look: [0.6, 1.2, -0.6] as V3, fov: 48 },
    duane: { pos: [-1.1, 1.7, 2.6] as V3, look: [2.6, 1.0, -1.5] as V3, fov: 46 },
    macro: { pos: [-1.15, 1.95, -2.75] as V3, look: [-1.62, 1.86, -3.32] as V3, fov: 34 },
    gate: { pos: [-3.0, 1.75, 10.4] as V3, look: [-2.4, 1.3, 16.0] as V3, fov: 50 },
    door: { pos: [-4.6, 1.6, 9.2] as V3, look: [-8.0, 1.3, 9.7] as V3, fov: 46 },
    aerial: { pos: [-2.0, 9.0, 8.0] as V3, look: [-6.0, 1.5, -10.0] as V3, fov: 55 },
    dthermo: { pos: [0.7, 1.4, -0.35] as V3, look: [0.12, 1.32, -0.5] as V3, fov: 34 },
  };
  let lastSign = -1;
  return {
    name: "grove", root, marks, cams, title: [heroOr, ...iceGroups.slice(0, 4)],
    pose: (t, c) => {
      const ice = cl(c.ice ?? 0), melt = cl(c.melt ?? 0), iceK = ice * (1 - sm(melt * 1.4));
      iceM.opacity = 0.55 * iceK; ballM.opacity = 0.34 * iceK; glintM.opacity = iceK * (c.glint ?? 1); icM.opacity = 0.85 * (ice > 0.35 ? sm((ice - 0.35) / 0.4) : 0) * (1 - sm(melt * 1.6));
      hoIceM.opacity = 0.1 * iceK; leafGlaze.opacity = 0.6 * iceK;
      iceGroups.forEach((g) => (g.visible = iceK > 0.01)); snapIce.visible = iceK > 0.01;
      hoIce.visible = iceK > 0.01; hoIcicles.visible = ice > 0.5 && melt < 0.6;
      sparkle(glints, t, iceK * (c.glint ?? 1)); glints.forEach((s) => (s.visible = iceK > 0.05));
      // melt: sheets slide off and fall, sparkle bursts on landing
      sheets.forEach((m) => { const u = cl((melt - m.userData.ph) * 1.6 * m.userData.sp); m.visible = melt > 0.01 && u > 0 && u < 0.97; const p0 = m.userData.p0 as THREE.Vector3; m.position.set(p0.x + u * 0.5, Math.max(0.02, p0.y - 4.9 * (u * 0.9) ** 2), p0.z + u * 0.3); m.rotation.set(1.2 * u + m.userData.rot, m.userData.rot, 0.6 * u); });
      sparkle(meltSparks, t * 1.6, melt > 0.05 && melt < 0.95 ? Math.sin(Math.PI * melt) * 1.4 : 0); meltSparks.forEach((s) => (s.visible = melt > 0.02 && melt < 0.98));
      peelE.roughness = 0.55 - 0.35 * cl(c.juice ?? 0);
      // sprinklers + spray mist
      const spray = cl(c.spray ?? 0); sprs.forEach((s) => runSprinkler(s, t, spray));
      sprayMist.forEach((m, i) => { (m.material as THREE.SpriteMaterial).opacity = 0.18 * spray * (0.7 + 0.3 * Math.sin(t * 0.7 + i)); m.position.y = 3.4 + (i % 2) * 0.6 + 0.2 * Math.sin(t * 0.4 + i); });
      wheel.rotation.x = (c.valve ?? 0) * Math.PI * 2.2;
      const hoK = cl(c.hose ?? 0); hoseP.visible = hoK > 0.01;
      if (hoK > 0.01) { const A = V(c.hx ?? 0, c.hy ?? 1, c.hz ?? 0), B = V(c.tx ?? 0, c.ty ?? 1, c.tz ?? 0), a = hoseG.attributes.position as THREE.BufferAttribute;
        const arc = (u: number) => { const P = A.clone().lerp(B, u); P.y += 0.22 * Math.sin(Math.PI * u) * A.distanceTo(B); return P; };
        for (let i = 0; i < HN; i++) { const u = 0.55 + 0.45 * ((t * 1.6 + i / HN) % 1), P = arc(u * hoK); const j = 0.02 + 0.09 * (u - 0.55); a.setXYZ(i, P.x + Math.sin(i * 12.9) * j, P.y + Math.sin(i * 7.3) * j, P.z + Math.sin(i * 3.1) * j); }
        const key = [A.x, A.y, A.z, B.x, B.y, B.z, Math.round(hoK * 20)].map((v) => v.toFixed(2)).join(",");
        if (key !== jetKey) { jetKey = key; jet.geometry.dispose(); const pts = Array.from({ length: 13 }, (_, i) => arc((i / 12) * hoK)); jet.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.014, 8, false); }
        jetT.offset.y = -t * 3.2;
        a.needsUpdate = true; hoseMist.forEach((m, i) => { const u = (t * 0.8 + i / 3) % 1; m.position.set(B.x + 0.1 * Math.sin(i * 2), B.y + u * 0.3, B.z); (m.material as THREE.SpriteMaterial).opacity = 0.1 * hoK * Math.sin(Math.PI * u); m.scale.set(0.1 + u * 0.18, (0.1 + u * 0.18) * 0.7, 1); }); }   // faint: it read as a white blob in close shots
      else hoseMist.forEach((m) => ((m.material as THREE.SpriteMaterial).opacity = 0));
      jet.visible = hoK > 0.01;
      // frost on the ground, Duane's frost
      frostM.opacity = 0.75 * cl(c.frost ?? 0); dFrostM.opacity = 0.85 * cl(c.dFrost ?? 0); dFrostG.forEach((g) => (g.visible = (c.dFrost ?? 0) > 0.01));
      peelD.color.set((c.dFrost ?? 0) > 0.5 ? "#d8c0a8" : "#ffffff");
      // fire pots: lit (pots), guttering out front-first (potsOut)
      const potK = cl(c.pots ?? 0), out = c.potsOut ?? 0;
      pots.forEach((p, i) => {
        const k = potK * cl((c.potsN ?? 99) - i) * cl(out - i >= 1 ? 0 : out - i > 0 ? 1 - (out - i) : 1), f = 0.85 + 0.15 * Math.sin(t * 17 + p.seed) * Math.sin(t * 6.3 + p.seed * 2);
        p.flame.visible = k > 0.02; p.flame.scale.set(0.34 * (0.9 + 0.12 * Math.sin(t * 11 + p.seed)) * (0.5 + 0.5 * k), 0.62 * f * (0.4 + 0.6 * k), 1);
        (p.glow.material as THREE.SpriteMaterial).opacity = k * (0.7 + 0.3 * f); if (p.light) p.light.intensity = 9 * k * f;
        p.smoke.forEach((m, j) => { const u = (t * 0.22 + j / 4 + p.seed * 0.1) % 1; m.position.set(p.top[0] + 0.3 * u + 0.05 * Math.sin(t + j), p.top[1] + 0.4 + u * 3.2, p.top[2]); (m.material as THREE.SpriteMaterial).opacity = 0.32 * Math.max(k, 0.25 * potK) * Math.sin(Math.PI * u); m.scale.set(0.6 + u * 1.8, (0.6 + u * 1.8) * 0.7, 1); });
      });
      // the snap: the bough tips at its base and crashes down (u 0..1), shards + powder burst on impact
      const sn = cl(c.snap ?? 0), fall = sn < 0.15 ? 0.04 * Math.sin(sn / 0.15 * Math.PI * 3) * (sn / 0.15) : sm((sn - 0.15) / 0.5) ** 1.6;
      snapG.rotation.set(0, 0, 0); snapG.rotateOnAxis(V(1.85, 0, -1.8).normalize(), fall * 0.37); snapG.position.set(GROVE.SNAP_BASE[0] + fall * 0.12, GROVE.SNAP_BASE[1] - fall * 1.2, GROVE.SNAP_BASE[2] + fall * 0.12);
      const hit = cl((sn - 0.62) / 0.38);
      snapDust.forEach((m, i) => { (m.material as THREE.SpriteMaterial).opacity = hit > 0 ? 0.55 * (1 - hit) : 0; m.position.set(SNAP_TIP[0] + 0.3 * Math.cos(i * 1.3) * (0.4 + hit), 0.25 + hit * 0.6 + i * 0.05, SNAP_TIP[2] + 0.3 * Math.sin(i * 1.3) * (0.4 + hit)); m.scale.set(0.8 + hit * 1.6, (0.8 + hit * 1.6) * 0.6, 1); });
      sparkle(shards, t * 2, hit > 0 && hit < 1 ? 1.4 * (1 - hit) : 0); shards.forEach((s) => (s.visible = hit > 0 && hit < 1));
      // macro: drops land on the hero orange and freeze, each with a warm pulse
      const dk = cl(c.drops ?? 0), hk = cl(c.heat ?? 0);
      drops.forEach((s) => { const u = (t * 0.55 + s.userData.ph) % 1, a = s.userData.a; s.visible = dk > 0.01; const fallY = u < 0.5 ? 0.22 - u * 0.24 : 0.1; s.position.set(Math.cos(a) * 0.075, fallY + (u < 0.5 ? 0 : -0.01), Math.sin(a) * 0.075 + 0.02); s.scale.setScalar(0.024 * (u < 0.5 ? 1 : 1 - (u - 0.5))); });
      heats.forEach((s) => { const u = (t * 0.55 + s.userData.ph) % 1, a = s.userData.a, k = u > 0.5 ? Math.sin(Math.PI * (u - 0.5) * 2) : 0; s.material.opacity = hk * k * 0.9; s.position.set(Math.cos(a) * 0.05, 0.09 - (u - 0.5) * 0.06, Math.sin(a) * 0.05 + 0.03); s.scale.setScalar(0.1 + 0.06 * k); });
      heatCore.material.opacity = hk * (0.35 + 0.12 * Math.sin(t * 5));
      // thermometers
      eTh.set(c.etemp ?? 32); dTh.set(c.temp ?? 34);
      // lanterns carried by Earl / Duane
      ([[c.lamp1 ?? 0, c.l1x, c.l1y, c.l1z], [c.lamp2 ?? 0, c.l2x, c.l2y, c.l2z]] as [number, number | undefined, number | undefined, number | undefined][]).forEach(([k, x, y, z], i) => {
        const L = lanterns[i], f = 0.9 + 0.1 * Math.sin(t * 13 + i * 3) * Math.sin(t * 5.3 + i);
        L.L.intensity = 7 * k * f; L.L.position.set(x ?? 0, y ?? 1, z ?? 0); L.gl.position.set(x ?? 0, y ?? 1, z ?? 0); (L.gl.material as THREE.SpriteMaterial).opacity = 0.8 * k;
      });
      shedLamp.visible = (c.shedLamp ?? 0) > 0.5; flicker(shedLamp, t);
      const hl = cl(c.house ?? 0); winM.color.setScalar(0.25 + 0.95 * hl); houseLight.intensity = 5 * hl; porchLamp.visible = hl > 0.5; flicker(porchLamp, t + 1);
      door.rotation.y = 1.45 * sm(c.door ?? 0); doorWarm.visible = false; spill.intensity = 4 * hl * sm(c.door ?? 0);
      scarePole.visible = true;
      betCrate.visible = (c.crate ?? 0) > 0.5;
      if (c.cx !== undefined) { betCrate.position.set(c.cx, c.cy ?? GROVE.CRATE_POST[1], c.cz ?? GROVE.CRATE_POST[2]); betCrate.rotation.z = c.crot ?? 0; } else { betCrate.position.set(GROVE.CRATE_POST[0], GROVE.CRATE_POST[1], GROVE.CRATE_POST[2]); betCrate.rotation.z = 0; }
      // the clonk: ice chips off the frozen orange at (c.chx, c.chy, c.chz), c.chip 0..1 age
      chips.forEach((sp, i) => { const u = cl(c.chip ?? 0), a = (i / chips.length) * TAU; sp.visible = u > 0.01 && u < 0.99; sp.position.set((c.chx ?? 0) + Math.cos(a) * 0.35 * u, (c.chy ?? 1.4) + 0.3 * u - 0.9 * u * u, (c.chz ?? 0) + Math.sin(a) * 0.35 * u); sp.scale.setScalar(0.09 * (1 - u) + 0.01); sp.material.rotation = a + u * 3; });
      const sk = Math.round(cl(c.sign ?? 1) * 12) / 12; if (sk !== lastSign) { lastSign = sk; signM.map = signTex(sk); signM.needsUpdate = true; }
      signG.visible = (c.sgOn ?? 0) > 0; signG.position.set(c.sgx ?? GROVE.SIGN[0], c.sgy ?? GROVE.SIGN[1], c.sgz ?? GROVE.SIGN[2]); signG.rotation.set(0, c.sgYaw ?? 0, c.sgRoll ?? 0);
      const tr = (c.truck ?? 0) > 0.5; headL.forEach((L) => (L.intensity = tr ? 30 : 0)); truckFill.intensity = tr ? 5 : 0; headG.forEach((g) => ((g.material as THREE.SpriteMaterial).opacity = tr ? 0.9 : 0));
      (moon.material as THREE.SpriteMaterial).opacity = cl(c.moon ?? 0); moon.visible = (c.moon ?? 0) > 0.01;
      (stars.material as THREE.PointsMaterial).opacity = cl(c.stars ?? 0); stars.visible = (c.stars ?? 0) > 0.01;
    },
  };
};
