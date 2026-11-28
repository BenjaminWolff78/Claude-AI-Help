// Modern beach joke set (S15: "It's why a cooler keeps your drinks cold"). Hot saturated noon. The kid lounges in a
// deck chair under a striped umbrella (mark chair) next to a red picnic cooler with a hinged white lid (ctl lid 0..1):
// ice cubes + soda cans inside, cold fog spilling out when open. Sea behind (-z), snack shack, palm, sailboats, gulls.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, beamHD } from "../paint";
import { NOINK } from "../ink";
import { lamp, flicker, glow, mist, sign, waterPlane, iceMaterial, rod, WATER_U } from "../setkit";
import { birds, boardsV, beamStain, metal, roundTree, leafTex, TAU } from "./innerkit_b";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { SetDef, V3 } from "./types";

const sandTex = () => ctex("beachSandB", 1024, 1024, (g, r) => {
  g.fillStyle = "#f2d49a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26; i++) { const x = r() * 1024, y = r() * 1024, rr = 80 + r() * 200; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? "rgba(255,236,190,0.5)" : "rgba(214,170,110,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.lineCap = "round";
  for (let i = 0; i < 70; i++) { g.strokeStyle = "rgba(196,150,92,0.35)"; g.lineWidth = 3 + r() * 3; const x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 60, y - 12, x + 120, y + 12, x + 180, y); g.stroke(); g.strokeStyle = "rgba(255,244,214,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 5); g.bezierCurveTo(x + 60, y - 17, x + 120, y + 7, x + 180, y - 5); g.stroke(); } // ripples
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(170,120,70,0.45)" : "rgba(255,250,230,0.7)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 2, 2 + r() * 2); }
  for (let i = 0; i < 10; i++) { const x = r() * 1024, y = r() * 1024; g.fillStyle = ["#f7d6e0", "#ffffff", "#f3c49a"][i % 3]; g.beginPath(); g.ellipse(x, y, 9, 6, r() * 3, 0, TAU); g.fill(); g.strokeStyle = "rgba(150,100,80,0.6)"; g.lineWidth = 1.5; g.stroke(); } // shells
  for (let i = 0; i < 8; i++) { const x = 200 + i * 80, y = 300 + Math.sin(i) * 60; g.fillStyle = "rgba(190,140,86,0.4)"; g.beginPath(); g.ellipse(x + (i % 2) * 30, y, 14, 24, 0.2, 0, TAU); g.fill(); } // footprints
});
const stripeTex = (key: string, a: string, bb: string, n: number, vertical = true) => ctex("beachStripe_" + key, 512, 512, (g) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? bb : a; if (vertical) g.fillRect((i * 512) / n, 0, 512 / n + 1, 512); else g.fillRect(0, (i * 512) / n, 512, 512 / n + 1); }
  g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(0, 0, 512, 40);
});
const ballTex = () => ctex("beachBallB", 512, 256, (g) => { const cols = ["#e8423a", "#ffffff", "#2f7fd1", "#ffffff", "#f6c445", "#ffffff"]; cols.forEach((c, i) => { g.fillStyle = c; g.fillRect((i * 512) / 6, 0, 512 / 6 + 1, 256); }); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 18); g.fillRect(0, 238, 512, 18); });
const canTex = (name: string, col: string, fg: string) => ctex("beachCan_" + name, 256, 128, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(30, 0, 14, 128);
  g.fillStyle = fg; g.font = "900 44px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, 150, 66);
  g.fillStyle = "#d9dde6"; g.fillRect(0, 0, 256, 10); g.fillRect(0, 118, 256, 10);
});
const foamTex = () => ctex("beachFoamB", 512, 64, (g, r) => {
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.6 + r() * 0.4})`; g.beginPath(); g.ellipse(r() * 512, 26 + (r() - 0.5) * 20, 10 + r() * 30, 5 + r() * 8, 0, 0, TAU); g.fill(); }
  g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(0, 22, 512, 10);
});

export const beach = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const r = rng(321);
  const sand = lam("beachSand", () => ({ map: sandTex() }));
  const wet = lam("beachWet", () => ({ map: sandTex(), color: "#c9a878" }));
  // ---- sand, wet band, sea, surf ----
  b.add(quad(V(-30, 0, 20), V(30, 0, 20), V(30, 0, -5.2), V(-30, 0, -5.2), 15, 6.3), sand);
  b.add(quad(V(-30, -0.02, -5.2), V(30, -0.02, -5.2), V(30, -0.1, -8), V(-30, -0.1, -8), 15, 0.7), wet);
  waterPlane(root, -200, 200, -400, -5.9, -0.06);
  const foamM = new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false, opacity: 0.9 });
  const foams = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.6).rotateX(-Math.PI / 2), foamM.clone()); m.position.set(i * 3 - 3, -0.03, -6); m.layers.set(NOINK); root.add(m); return m; });
  // distant headland with trees + rocks
  const hill = lam("beachHill", () => ({ color: "#6fae5a" }));
  b.add(new THREE.SphereGeometry(1, 24, 10, 0, TAU, 0, Math.PI / 2).scale(28, 7, 10).translate(-40, -0.5, -85), hill);
  b.add(new THREE.SphereGeometry(1, 24, 10, 0, TAU, 0, Math.PI / 2).scale(18, 4.5, 8).translate(35, -0.5, -95), hill);
  const rock = lam("beachRock", () => ({ color: "#9a8f9e" }));
  for (let i = 0; i < 5; i++) b.add(new THREE.DodecahedronGeometry(0.5 + r() * 0.6, 0).translate(-6 + i * 0.9, 0.1, -6.5 - r()), rock);
  // ---- the deck chair (wood frame + striped sling), the kid sits here ----
  const wood = lam("beachWood", () => ({ map: beamStain("beachWood", "#e8b07a", 0.15) }));
  const chair = new THREE.Group(); chair.position.set(-0.15, 0, 0.0); chair.rotation.y = 0.25; root.add(chair);
  const cw = (a: V3, bb: V3) => rod(chair, a, bb, 0.03, wood);
  for (const s of [-1, 1]) { cw([s * 0.3, 0, 0.45], [s * 0.3, 0.95, -0.45]); cw([s * 0.3, 0, -0.35], [s * 0.3, 0.42, 0.42]); cw([s * 0.32, 0.45, 0.42], [s * 0.32, 0.45, -0.05]); }
  for (const [y, z] of [[0.95, -0.45], [0.02, 0.45], [0.45, 0.42]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.66, 8).rotateZ(Math.PI / 2), wood); m.position.set(0, y, z); chair.add(m); }
  const sling = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.25, 1, 12), lam("beachSling", () => ({ map: stripeTex("sling", "#2f9ad1", "#ffffff", 7), side: THREE.DoubleSide })));
  { const sp = sling.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < sp.count; i++) { const v = sp.getY(i) / 1.25 + 0.5; sp.setXYZ(i, sp.getX(i), 0, 0); const y = 0.25 + v * 0.68 - 0.12 * Math.sin(v * Math.PI), z = 0.4 - v * 0.82; sp.setY(i, y); sp.setZ(i, z); } sling.geometry.computeVertexNormals(); }
  sling.castShadow = true; chair.add(sling);
  // ---- the umbrella (striped canopy, scalloped fringe) ----
  const umb = new THREE.Group(); umb.position.set(-0.45, 0, -0.55); umb.rotation.z = 0.12; umb.rotation.x = 0.08; root.add(umb);
  rod(umb, [0, -0.2, 0], [0, 2.45, 0], 0.035, metal("beachPole", "#f4f4f4", 60));
  const canopyM = lam("beachCanopy", () => ({ map: stripeTex("canopy", "#ef4b3a", "#fff4e0", 16), side: THREE.DoubleSide }));
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.6, 16, 1, true), canopyM); canopy.position.y = 2.25; canopy.castShadow = true; umb.add(canopy);
  const fringe = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.56, 0.12, 16, 1, true), canopyM); fringe.position.y = 1.9; umb.add(fringe);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), lam("beachKnob", () => ({ color: "#ffd84a" }))); knob.position.y = 2.58; umb.add(knob);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; const tas = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), lam("beachKnob", () => ({ color: "#ffd84a" }))); tas.position.set(Math.cos(a) * 1.55, 1.8, Math.sin(a) * 1.55); umb.add(tas); }
  // ---- the red cooler (hinged white lid), ice + soda inside, cold fog ----
  const cooler = new THREE.Group(); cooler.position.set(0.72, 0, 0.42); cooler.rotation.y = -0.35; root.add(cooler);
  const red = lam("beachCoolerRed", () => ({ color: "#e23a32" })), white = lam("beachCoolerWhite", () => ({ color: "#f6f4ee" }));
  const CW = 0.62, CD = 0.42, CH = 0.4, T = 0.05;
  const cbt = new Batch();
  cbt.add(boxGeo(V(-CW / 2, 0.03, -CD / 2), V(CW / 2, 0.03 + T, CD / 2)), red);
  cbt.add(boxGeo(V(-CW / 2, 0.03, -CD / 2), V(CW / 2, CH, -CD / 2 + T)), red); cbt.add(boxGeo(V(-CW / 2, 0.03, CD / 2 - T), V(CW / 2, CH, CD / 2)), red);
  cbt.add(boxGeo(V(-CW / 2, 0.03, -CD / 2), V(-CW / 2 + T, CH, CD / 2)), red); cbt.add(boxGeo(V(CW / 2 - T, 0.03, -CD / 2), V(CW / 2, CH, CD / 2)), red);
  cbt.add(boxGeo(V(-CW / 2 + T, 0.03, -CD / 2 + T), V(CW / 2 - T, CH - 0.02, CD / 2 - T)), white); // white liner (inner box faces)
  cbt.add(boxGeo(V(-CW / 2 - 0.01, 0, -CD / 2 - 0.01), V(CW / 2 + 0.01, 0.05, CD / 2 + 0.01)), white); // base trim
  cbt.add(boxGeo(V(-CW / 2 - 0.01, CH - 0.06, -CD / 2 - 0.01), V(CW / 2 + 0.01, CH, CD / 2 + 0.01)), white); // rim stripe
  for (const s of [-1, 1]) cbt.add(boxGeo(V(s * CW / 2 - 0.02, 0.2, -0.08), V(s * CW / 2 + s * 0.04, 0.26, 0.08)), white); // handles
  cbt.build(cooler);
  const liner = new THREE.Mesh(new THREE.BoxGeometry(CW - 2 * T - 0.004, 0.02, CD - 2 * T - 0.004), white); liner.position.y = 0.09; cooler.add(liner);
  const lidG = new THREE.Group(); lidG.position.set(0, CH, -CD / 2); cooler.add(lidG);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(CW + 0.04, 0.07, CD + 0.04, 2, 0.025), white); lid.position.set(0, 0.035, CD / 2); lid.castShadow = true; lidG.add(lid);
  const lidStripe = new THREE.Mesh(new THREE.BoxGeometry(CW + 0.045, 0.02, 0.06), red); lidStripe.position.set(0, 0.05, CD / 2); lidG.add(lidStripe);
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.1), new THREE.MeshBasicMaterial({ map: ctex("beachBrand", 256, 76, (g) => { g.fillStyle = "#ffffff"; g.font = "italic 900 54px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CHILLER", 128, 40); }), transparent: true }));
  brand.position.set(0, 0.24, CD / 2 + 0.003); cooler.add(brand);
  // contents: ice cubes and cans packed in
  const cubes: THREE.Mesh[] = [];
  for (let i = 0; i < 26; i++) { const c = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.075, 0.075, 2, 0.015), iceMaterial()); c.position.set(-0.24 + r() * 0.48, CH - 0.07 + r() * 0.05, -0.15 + r() * 0.3); c.rotation.set(r() * 3, r() * 3, r() * 3); cooler.add(c); cubes.push(c); }
  const cans: [string, string, string][] = [["FIZZO", "#2f7fd1", "#ffffff"], ["COLA-K", "#c8262e", "#ffffff"], ["LIMEY", "#6cc04a", "#1f3a12"], ["FIZZO", "#2f7fd1", "#ffffff"], ["ORANJ", "#ff8a1e", "#ffffff"]];
  cans.forEach(([n, c, f], i) => { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16), [lam("beachCan" + n, () => ({ map: canTex(n, c, f) })), metal("beachCanTop", "#d9dde6", 80), metal("beachCanTop", "#d9dde6", 80)]); can.position.set(-0.2 + i * 0.1, CH - 0.06, -0.08 + (i % 2) * 0.13); can.rotation.set((i % 2) * 0.4 - 0.2, 0, (i - 2) * 0.15); cooler.add(can); });
  const coldL = new THREE.PointLight("#bfe6ff", 0, 2.5, 1.2); coldL.position.set(0, CH + 0.15, 0.05); cooler.add(coldL);
  const coldGlow = glow(cooler, [0, CH + 0.05, 0], "#cfefff", 0.9, 0.0);
  const fog = [0, 1, 2, 3, 4].map((i) => mist(root, [0.72, 0.5, 0.42], 0.6, "#f0fbff", 0));
  // a can already out on the sand next to the chair (sweating)
  const outCan = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16), [lam("beachCanORANJ", () => ({ map: canTex("ORANJ", "#ff8a1e", "#ffffff") })), metal("beachCanTop", "#d9dde6", 80), metal("beachCanTop", "#d9dde6", 80)]); outCan.position.set(0.42, 0.06, 0.82); root.add(outCan);
  // ---- towel, beach ball, sandcastle, bucket + spade, flip-flops ----
  const towel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.7).rotateX(-Math.PI / 2), lam("beachTowel", () => ({ map: stripeTex("towel", "#ffd166", "#f25f8a", 9, false) }))); towel.position.set(-1.35, 0.008, 0.9); towel.rotation.y = 0.35; towel.receiveShadow = true; root.add(towel);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), lam("beachBall", () => ({ map: ballTex() }))); ball.position.set(1.4, 0.22, 1.5); ball.castShadow = true; root.add(ball);
  const castle = lam("beachCastle", () => ({ map: sandTex(), color: "#e2bf84" }));
  const CX = -1.25, CZ = -1.55;
  b.add(boxGeo(V(CX - 0.35, 0, CZ - 0.25), V(CX + 0.35, 0.22, CZ + 0.25)), castle);
  for (const [dx, dz, h] of [[-0.35, -0.25, 0.42], [0.35, -0.25, 0.42], [-0.35, 0.25, 0.36], [0.35, 0.25, 0.36], [0, 0, 0.58]] as [number, number, number][]) {
    b.add(new THREE.CylinderGeometry(0.11, 0.13, h, 12).translate(CX + dx, h / 2, CZ + dz), castle);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; b.add(new THREE.BoxGeometry(0.04, 0.05, 0.04).translate(CX + dx + Math.cos(a) * 0.09, h + 0.025, CZ + dz + Math.sin(a) * 0.09), castle); }
  }
  rod(root, [CX, 0.58, CZ], [CX, 0.85, CZ], 0.006, wood);
  const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.08, 4, 1).translate(0.07, 0, 0), lam("beachPennant", () => ({ color: "#2f7fd1", side: THREE.DoubleSide }))); pennant.position.set(CX, 0.8, CZ); root.add(pennant);
  const moat = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 28).rotateX(-Math.PI / 2), lam("beachMoat", () => ({ color: "#3fb8d0" }))); moat.position.set(CX, 0.004, CZ); root.add(moat);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.2, 16, 1, true), lam("beachBucket", () => ({ color: "#ffd84a", side: THREE.DoubleSide }))); bucket.position.set(-0.6, 0.1, -1.25); bucket.castShadow = true; root.add(bucket);
  const bh = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.008, 4, 16, Math.PI), lam("beachKnob", () => ({ color: "#ffd84a" }))); bh.position.set(-0.6, 0.2, -1.25); root.add(bh);
  rod(root, [-0.85, 0.05, -1.0], [-0.72, 0.42, -1.18], 0.015, lam("beachSpade", () => ({ color: "#2f7fd1" })));
  b.add(new THREE.BoxGeometry(0.1, 0.13, 0.015).rotateX(-1.2).translate(-0.88, 0.02, -0.95), lam("beachSpadeBlade", () => ({ color: "#e8423a" })));
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.09, 0.015, 0.22).rotateY(0.3 + s * 0.2).translate(-0.25 + s * 0.08, 0.008, 0.85), lam("beachFlop", () => ({ color: "#ff5fa2" })));
  // ---- palm tree ----
  const palm = new THREE.Group(); palm.position.set(-2.3, 0, -3.2); root.add(palm);
  const palmBark = lam("beachPalmBark", () => ({ map: ctex("palmBarkB", 128, 256, (g) => { g.fillStyle = "#b08050"; g.fillRect(0, 0, 128, 256); for (let y = 0; y < 256; y += 22) { g.fillStyle = "#8a5e38"; g.fillRect(0, y, 128, 6); g.fillStyle = "rgba(255,230,190,0.3)"; g.fillRect(0, y + 6, 128, 3); } }) }));
  const pts: THREE.Vector3[] = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(V(Math.sin(u * 1.3) * 0.9, u * 5.2, -Math.sin(u * 1.0) * 0.2)); }
  const tc = new THREE.CatmullRomCurve3(pts), trunkGeo = new THREE.TubeGeometry(tc, 20, 0.16, 10); const tp = trunkGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); const k = 1.25 - y / 10; const c = tc.getPoint(Math.min(1, Math.max(0, y / 5.2))); tp.setX(i, c.x + (tp.getX(i) - c.x) * k); tp.setZ(i, c.z + (tp.getZ(i) - c.z) * k); }
  trunkGeo.computeVertexNormals();
  const trunk = new THREE.Mesh(trunkGeo, palmBark); trunk.castShadow = true; palm.add(trunk);
  const frondM = lam("beachFrond", () => ({ map: ctex("frondB", 512, 128, (g) => { g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, 512, 128); g.fillStyle = "#3f9a4a"; for (let x = 0; x < 512; x += 18) { const w = 60 * Math.sin((x / 512) * Math.PI) + 6; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 26, 64 - w); g.lineTo(x + 30, 64); g.lineTo(x + 26, 64 + w); g.closePath(); g.fill(); } g.fillStyle = "#2c6f36"; g.fillRect(0, 60, 512, 8); }), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
  const top = V(Math.sin(1.3) * 0.9, 5.2, -Math.sin(1.0) * 0.2);
  const fronds: THREE.Group[] = [];
  for (let i = 0; i < 8; i++) { const fg = new THREE.Group(); fg.position.copy(top); fg.rotation.y = (i / 8) * TAU; palm.add(fg); const fgeo = new THREE.PlaneGeometry(2.4, 0.6, 10, 1).translate(1.2, 0, 0).rotateX(-Math.PI / 2); const fp = fgeo.attributes.position as THREE.BufferAttribute; for (let k = 0; k < fp.count; k++) { const x = fp.getX(k); fp.setY(k, -0.18 * x * x + 0.35 * x); } fgeo.computeVertexNormals(); const fm = new THREE.Mesh(fgeo, frondM); fm.layers.set(NOINK); fg.add(fm); fronds.push(fg); }
  for (let i = 0; i < 3; i++) { const co = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lam("beachCoco", () => ({ color: "#6a4a2a" }))); co.position.copy(top).add(V(Math.cos(i * 2) * 0.15, -0.15, Math.sin(i * 2) * 0.15)); palm.add(co); }
  // ---- beach shack with its sign, a glowing lamp + string of bulbs ----
  const shackW = lam("beachShack", () => ({ map: boardsV("beachShack", "#5fc0c8", 0.55) }));
  const thatch = lam("beachThatch", () => ({ map: ctex("thatchB", 256, 256, (g, rr) => { g.fillStyle = "#d9b46a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 400; i++) { g.strokeStyle = rr() < 0.5 ? "#b88a40" : "#f0d090"; g.lineWidth = 2; const x = rr() * 256; g.beginPath(); g.moveTo(x, rr() * 256); g.lineTo(x + (rr() - 0.5) * 6, rr() * 256); g.stroke(); } }) }));
  const SX = 2.6, SZ = -3.6;
  b.add(boxGeo(V(SX - 1.2, 0, SZ - 1.0), V(SX + 1.2, 2.2, SZ + 0.6), 2), shackW);
  b.add(boxGeo(V(SX - 1.3, 0.95, SZ + 0.6), V(SX + 1.3, 1.05, SZ + 0.95)), lam("beachCounter", () => ({ map: beamHD() })));
  b.add(new THREE.ConeGeometry(2.1, 1.0, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.85).translate(SX, 2.7, SZ - 0.2), thatch);
  const hatch = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9a0").multiplyScalar(1.1) })); hatch.position.set(SX, 1.5, SZ + 0.605); root.add(hatch);
  sign(root, "SALTY'S SNACKS", 1.9, 0.42, [SX, 2.35, SZ + 0.68], 0, "#fff3c4", "#d0342c");
  const shackL = lamp(root, [SX - 1.05, 1.95, SZ + 0.78], "#ffcf7a", 4, 6, "wall");
  const bulbs: THREE.Sprite[] = [];
  for (let i = 0; i < 9; i++) { const u = i / 8, x = SX - 1.25 + u * 2.5, y = 2.12 - 0.12 * Math.sin(u * Math.PI); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(["#ffd25a", "#ff7a5a", "#7ad8ff"][i % 3]).multiplyScalar(2) })); bl.position.set(x, y, SZ + 0.85); bl.layers.set(NOINK); root.add(bl); bulbs.push(glow(root, [x, y, SZ + 0.86], ["#ffd25a", "#ff7a5a", "#7ad8ff"][i % 3], 0.35, 0.8)); }
  for (const s of [-1, 1]) rod(root, [SX + s * 1.25, 0, SZ + 0.9], [SX + s * 1.25, 2.2, SZ + 0.9], 0.04, lam("beachCounter", () => ({ map: beamHD() })));
  // surfboard leaning on the shack
  const board = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.5, 6, 12).scale(1, 1, 0.18), lam("beachSurf", () => ({ map: stripeTex("surf", "#ffffff", "#ff7a3d", 3) }))); board.position.set(SX - 1.55, 0.95, SZ + 0.4); board.rotation.z = 0.18; board.castShadow = true; root.add(board);
  // little tropical bushes
  const bushM = lam("beachBush", () => ({ map: leafTex("beach", "#4fae4a", "#7fd060", "#2f8a3a") })), bt = lam("beachTrunk", () => ({ color: "#8a5a3c" }));
  roundTree(b, -3.8, -4.5, 2.0, 5, bushM, bt); roundTree(b, 4.6, -4.8, 2.4, 6, bushM, bt);
  // ---- sailboats (bob), gulls ----
  const sail = lam("beachSail", () => ({ color: "#ffffff", side: THREE.DoubleSide })), hullM = lam("beachHull", () => ({ color: "#2f5d9a" }));
  const boats = [[-6, -38, 1.0], [9, -60, 1.3]].map(([x, z, s]) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); root.add(g); const h = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.7), hullM); h.position.y = 0.1; g.add(h); const sl = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([V(-0.8, 0.35, 0), V(0.7, 0.35, 0), V(0.1, 3.0, 0)]), sail); sl.geometry.computeVertexNormals(); g.add(sl); const s2 = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([V(0.15, 0.35, 0.02), V(1.0, 0.35, 0.02), V(0.15, 2.4, 0.02)]), lam("beachSail2", () => ({ color: "#ff7a3d", side: THREE.DoubleSide }))); s2.geometry.computeVertexNormals(); g.add(s2); return g; });
  const gulls = birds(root, 3, [0, 5.5, -10], 6);
  b.build(root);
  const marks: Record<string, V3> = { chair: [-0.15, 0.0, 0.05], cooler: [0.72, 0, 0.42], shack: [SX, 0, SZ + 1.4] };
  const cams = { gag: { pos: [0.45, 1.2, 3.3] as V3, look: [0.25, 1.0, -0.2] as V3, fov: 48 } };
  return {
    name: "beach", root, marks, cams,
    pose: (t, c) => {
      WATER_U.wFlow.value.set(0.15, 0.25);
      flicker(shackL, t); bulbs.forEach((g, i) => ((g.material as THREE.SpriteMaterial).opacity = 0.6 + 0.4 * Math.abs(Math.sin(t * 1.5 + i))));
      foams.forEach((m, i) => { const u = (t * 0.18 + i / 3) % 1; m.position.z = -6.3 + Math.sin(u * Math.PI) * 1.1; (m.material as THREE.MeshBasicMaterial).opacity = 0.9 * Math.sin(u * Math.PI); m.scale.z = 1 + u; });
      boats.forEach((g, i) => { g.position.y = 0.06 * Math.sin(t * 1.3 + i); g.rotation.z = 0.04 * Math.sin(t * 1.1 + i * 2); g.position.x += 0; });
      fronds.forEach((f, i) => { f.rotation.z = 0.06 * Math.sin(t * 1.4 + i); });
      fringe.rotation.y = 0.02 * Math.sin(t * 3);
      const pp = pennant.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i); pp.setZ(i, 0.02 * (x / 0.14) * Math.sin(t * 7 - x * 30)); } pp.needsUpdate = true;
      ball.rotation.y = 0.15 * Math.sin(t * 0.7);
      gulls(t);
      // the lid and the cold fog
      const L = c.lid ?? 0; lidG.rotation.x = -L * 1.95;
      coldL.intensity = 3 * L; (coldGlow.material as THREE.SpriteMaterial).opacity = 0.7 * L;
      fog.forEach((m, i) => { const u = (t * 0.35 + i / 5) % 1, side = i % 2 ? 1 : -1; m.position.set(0.72 + side * u * 0.35, 0.42 + Math.sin(u * Math.PI) * 0.12 - u * 0.3, 0.42 + u * 0.35); (m.material as THREE.SpriteMaterial).opacity = 0.6 * L * Math.sin(u * Math.PI); m.scale.set(0.45 + u * 0.6, (0.45 + u * 0.6) * 0.6, 1); });
      cubes.forEach((cb, i) => (cb.visible = true || i));
    },
  };
};
