// Saint-Pierre, Martinique (1806), hot noon. Bleached dock running away from camera along -z; the brig FAVORITE moored
// on the LEFT (x < -4.4, turquoise water), the market + colourful plaster houses on the RIGHT, green hills behind.
// Ice on the deck by the hatch: a half-melted block next to a dashed ghost of its full size; water gushes out.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { beamHD, cobbleHD, stoneHD, ctex } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { brig, lamp, flicker, glow, crate, barrel, sack, ropeCoil, sign, iceBlock, waterPlane, rod } from "../setkit";
import { M, palm, swayPalm, gullFlock, stall, flutterStall, tropicHouse, TROPIC_HOUSES, hill, hillTex, basket, pineapple, fruitPile, bananas, foamPatch, waterStream, ghostBox, sailBoat, sm, puff, risePuffs, TAU } from "./portkit_common";
import type { SetDef, V3 } from "./types";

export const martinique = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const WY = -0.6; // sea level
  // ---- dock: bleached planks on a beam frame, pilings, stone quay further right ----
  const dockM = M.bleach();
  b.add(quad(V(-4.4, 0, 12), V(4.6, 0, 12), V(4.6, 0, -34), V(-4.4, 0, -34), 4.5, 23), dockM);
  b.add(boxGeo(V(-4.55, -0.75, -34), V(-4.4, 0.02, 12), 1.5), lam("dockEdge", () => ({ map: beamHD() })));
  b.add(boxGeo(V(-4.6, 0.0, -34), V(-4.3, 0.12, 12), 1.5), lam("dockEdge", () => ({ map: beamHD() })));
  const pileM = lam("mPile", () => ({ map: beamHD() }));
  for (let z = -33; z < 12; z += 1.8) b.add(new THREE.CylinderGeometry(0.17, 0.2, 2.2, 9).translate(-4.5, -0.7, z), pileM);
  const iron = M.iron();
  for (const z of [-1.5, -8.5, -15]) { b.add(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 12).translate(-3.9, 0.25, z), iron); b.add(new THREE.SphereGeometry(0.18, 12, 8).translate(-3.9, 0.52, z), iron); }
  // sandy cobbled street + stone quay wall towards the houses
  const cob = lam("mCobble", () => ({ map: cobbleHD() }));
  b.add(quad(V(4.6, 0.01, 12), V(30, 0.01, 12), V(30, 0.01, -60), V(4.6, 0.01, -60), 6, 18), cob);
  b.add(quad(V(-4.4, 0.01, -34), V(4.6, 0.01, -34), V(4.6, 0.01, -60), V(-4.4, 0.01, -60), 2.5, 6.5), cob);
  const curb = lam("mCurb", () => ({ map: stoneHD("mCurbHD", ["#efe2c6", "#e6d6b6", "#f3e8d0", "#dfcdab"], "#b9a682") }));
  b.add(boxGeo(V(4.5, 0, -34), V(4.8, 0.14, 12), 1), curb);
  // ---- houses: right side facing the dock (-x), the back row facing +z, a hillside row ----
  const R: [number, number, number, number][] = [[3, 7.2, 7, 0], [-4.4, 6.4, 5.6, 1], [-11, 8.0, 7.2, 2], [-18.4, 6.6, 6, 3], [-25.4, 7.4, 7, 4], [-32.4, 6.2, 6, 5]];
  R.forEach(([z, h, w, si]) => tropicHouse(b, 11.0, z, -Math.PI / 2, w, 6, h, TROPIC_HOUSES[si], true, "r"));
  for (let i = 0; i < 6; i++) tropicHouse(b, -2 + i * 7.4, -40, 0, 6.8, 6, 6.2 + (i % 3) * 1.1, TROPIC_HOUSES[(i + 2) % 6], i % 2 === 0, "b");
  for (let i = 0; i < 7; i++) { const x = -6 + i * 8.5, z = -58 - (i % 2) * 5, y = 4 + (i % 3) * 2.5; const g = new THREE.Group(); g.position.y = y; root.add(g); const hb = new Batch(); tropicHouse(hb, x, z, 0.1 * (i % 3 - 1), 6, 5, 5.6, TROPIC_HOUSES[(i + 4) % 6], false, "h"); hb.build(g); }
  // church tower with a bell (landmark on the skyline)
  const tw = lam("mTower", () => ({ map: stoneHD("mTowerHD", ["#f6ead2", "#efe0c4", "#f8efdc", "#e9d8b8"], "#c4ae88") }));
  b.add(boxGeo(V(20, 0, -50), V(23.4, 15, -46.6), 2), tw);
  b.add(new THREE.ConeGeometry(2.6, 4.5, 4).rotateY(Math.PI / 4).translate(21.7, 17.25, -48.3), lam("mTowerRoof", () => ({ color: "#c75a3a" })));
  b.add(boxGeo(V(20.9, 11, -46.7), V(22.5, 13.2, -46.4)), lam("mBellHole", () => ({ color: "#5a3a3a" })));
  // ---- hills + headland across the bay ----
  hill(root, [34, -1, -130], 70, 30, 34, "#5fa548", 8); hill(root, [-14, -1, -150], 60, 24, 28, "#4f9a44", 7); hill(root, [78, -1, -112], 40, 20, 22, "#6aae4c", 5);
  hill(root, [-95, WY, -110], 45, 12, 22, "#5a9e48", 6); hill(root, [-50, WY, -170], 60, 18, 26, "#4d9447", 7);
  // Mont Pelee: the green volcano behind the town, a cloud cap on top
  const volc = new THREE.Mesh(new THREE.ConeGeometry(120, 95, 48, 8, true), lam("volcano", () => { const t = hillTex("#4f9a44", "volc").clone(); t.repeat.set(10, 3); t.needsUpdate = true; return { map: t }; }));
  { const p = volc.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 40) { p.setX(i, p.getX(i) * 1.5); p.setZ(i, p.getZ(i) * 1.5); p.setY(i, 40 + (y - 40) * 0.6); } } volc.geometry.computeVertexNormals(); }
  volc.position.set(10, 30, -300); root.add(volc);
  const capCloud = [0, 1, 2].map((i) => puff(root, [10 + (i - 1) * 25, 82 + i * 3, -290], 60, "#ffffff", 0.8));
  // ---- water ----
  waterPlane(root, -220, -4.4, -260, 60, WY); waterPlane(root, -4.4, 220, -260, -62, WY);
  // ---- the brig, moored (stern towards the camera, name board facing the dock) ----
  const ship = brig(root, "FAVORITE", { sails: "furled" }); ship.g.rotation.y = Math.PI / 2; ship.g.position.set(-6.6, WY - 0.05, -5);
  const deckY = WY - 0.05 + ship.deckY + 0.06; // deck top (world, set-local)
  ship.shrouds[1].forEach((m) => (m.visible = false)); // dock-side shrouds would cross Tudor in the deck / block shots
  const lid = ship.hatch.userData.lid as THREE.Group;
  const gp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 2.2), lam("mGang", () => ({ map: beamHD() }))); gp.position.set(-4.4, (deckY + 0.06) / 2, -2.6); gp.rotation.set(0, Math.PI / 2, 0); gp.rotation.z = 0; root.add(gp);
  gp.rotation.set(0, Math.PI / 2, -Math.atan2(deckY, 2.0)); gp.position.set(-4.5, deckY / 2 + 0.04, -2.6); gp.castShadow = true;
  const ropeM = M.rope();
  rod(root, [-3.9, 0.5, -1.5], [-5.4, deckY + 0.5, 0.6], 0.025, ropeM); rod(root, [-3.9, 0.5, -15], [-5.6, deckY + 0.5, -11.0], 0.025, ropeM);
  for (const z of [-2.5, -6, -9.5]) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.35, 4, 8), lam("fender", () => ({ color: "#b5894e" }))); f.position.set(-4.62, -0.15, z); root.add(f); }
  // ---- ice on deck: half block, dashed ghost of the full block, puddles, gushes ----
  const BW = 1.0, BH = 0.9, BD = 0.9, bx = -5.95, bz = -5.3;
  const block = iceBlock(root, BW, BH, BD, [bx, deckY, bz], { mist: true, seed: 3 });
  const ghost = ghostBox(root, BW + 0.04, BH + 0.02, BD + 0.04, [bx, deckY + 0.005, bz]);
  const pudM = twoTone(new THREE.MeshPhongMaterial({ color: "#8fd6ee", specular: "#ffffff", shininess: 140, transparent: true, opacity: 0.8 }));
  const pShape = new THREE.Shape(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU, rr = 1 + 0.22 * Math.sin(a * 3 + 1) + 0.12 * Math.sin(a * 5); i ? pShape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : pShape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const deckPud = new THREE.Mesh(new THREE.ShapeGeometry(pShape, 4).rotateX(-Math.PI / 2), pudM); deckPud.position.set(bx - 0.15, deckY + 0.012, bz - 0.6); deckPud.receiveShadow = true; root.add(deckPud);
  const dockPud = new THREE.Mesh(new THREE.ShapeGeometry(pShape, 4).rotateX(-Math.PI / 2), pudM); dockPud.position.set(-3.6, 0.012, -5.6); root.add(dockPud);
  const shine = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.06).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.8 })); shine.layers.set(NOINK); root.add(shine);
  const gushes = [-4.2, -5.4, -6.6].map((z, i) => { const g = new THREE.Group(); g.position.set(-4.78, deckY - 0.02, z); root.add(g); const s = waterStream(g, [0, 0, 0], [0.95, -deckY - 0.02 + 0.01, (i - 1) * 0.1], 0.18, 0.06); return { g, s }; });
  const scupM = lam("scupper", () => ({ color: "#3e2c30" }));
  for (const z of [-4.2, -5.4, -6.6]) { const sc = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.26), scupM); sc.position.set(-4.76, deckY - 0.02, z); root.add(sc); }
  const hatchW = [0, 1, 2, 3].map((i) => { const g = new THREE.Group(); g.position.set(-6.6 + (i - 1.5) * 0.32, deckY + 0.22, -6.4 + 0.62); root.add(g); const s = waterStream(g, [0, 0, 0], [(i - 1.5) * 0.1, -0.21, 0.45], 0.12, 0.045); return { g, s }; });
  const splash = [0, 1, 2, 3, 4, 5].map((i) => puff(root, [-4.0 + (i % 2) * 0.2, 0.05, -4.2 - (i % 3) * 1.2], 0.6, "#eafaff", 0.5));
  // ---- market: two stalls, a table with an ice lump, crates of fruit, baskets ----
  const s1 = stall(root, [2.4, 0, -6.4], -0.55, 2.4, "#e8463a", "#fff1d6", 1);
  const s2 = stall(root, [3.0, 0, -13.5], -0.8, 2.2, "#2aa6a0", "#fff1d6", 4);
  const s3 = stall(root, [2.6, 0, -21], -0.7, 2.2, "#f2b134", "#fff1d6", 7);
  const tab = new Batch();
  tab.add(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20).translate(0.3, 0.8, -3.2), lam("mTable", () => ({ map: beamHD() })));
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; tab.add(new THREE.CylinderGeometry(0.03, 0.035, 0.8, 6).translate(0.3 + Math.cos(a) * 0.38, 0.4, -3.2 + Math.sin(a) * 0.38), lam("mTableLeg", () => ({ color: "#6a4527" }))); }
  tab.add(new THREE.CylinderGeometry(0.6, 0.62, 0.02, 20, 1, true).translate(0.3, 0.75, -3.2), lam("mCloth", () => ({ color: "#f2e6c4", side: THREE.DoubleSide })));
  tab.build(root);
  const lump = iceBlock(root, 0.22, 0.18, 0.2, [0.3, 0.83, -3.2], { seed: 6 }); lump.set(0.35, 0);
  const crates: [number, number, number, string | undefined][] = [[-1.2, -10.5, 0.2, "ST. PIERRE"], [-0.4, -11.4, -0.3, undefined], [5.4, -8.8, 0.4, "FRUITS"], [5.6, -16.6, -0.2, undefined], [-2.2, 1.0, 0.1, "SUCRE"]];
  crates.forEach(([x, z, yaw, lab]) => crate(b, root, [x, 0, z], 0.72, lab, yaw));
  const fb = new Batch();
  fruitPile(fb, [-0.4, 0.72, -11.4], "mango", 0.62, 0.62, 0.08, 11); fruitPile(fb, [5.6, 0.72, -16.6], "orange", 0.62, 0.62, 0.075, 12);
  bananas(fb, [-1.0, 0.72, -10.4], 0.5, 1.1); fb.build(root);
  basket(root, [1.6, 0, -9.0], 0.32, 0.3, "#c99a52"); basket(root, [4.6, 0, -11.2], 0.28, 0.26, "#b98a42"); basket(root, [-0.6, 0, -8.6], 0.3, 0.32, "#d4a862"); basket(root, [4.3, 0, -3.0], 0.34, 0.3, "#c99a52");
  const bb = new Batch(); fruitPile(bb, [1.6, 0.18, -9.0], "lime", 0.36, 0.36, 0.06, 13); fruitPile(bb, [4.6, 0.15, -11.2], "mango", 0.32, 0.32, 0.07, 14); fruitPile(bb, [-0.6, 0.2, -8.6], "coconut", 0.3, 0.3, 0.08, 15); fruitPile(bb, [4.3, 0.17, -3.0], "orange", 0.4, 0.4, 0.065, 16); bb.build(root);
  pineapple(root, [1.2, 0, -8.5], 1.4); pineapple(root, [1.35, 0, -8.85], 1.3);
  barrel(root, [-2.8, 0, -12.6], 0.4); barrel(root, [-3.4, 0, -13.3], 0.4, 1); barrel(root, [5.2, 0, -0.8], 0.42);
  sack(root, [-2.3, 0, -13.6], 0.32, "#d9b67a"); sack(root, [5.8, 0, -1.6], 0.3); ropeCoil(root, [-3.5, 0, -9.2], 0.4); ropeCoil(root, [-3.3, 0, 2.4], 0.35);
  // foreground: a fruit handcart (right), crates + barrel + fishing net (left)
  const cart = new THREE.Group(); cart.position.set(1.4, 0, 3.4); cart.rotation.y = -0.5; root.add(cart);
  const cw = lam("mCart", () => ({ map: beamHD() }));
  const cbed = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 1.0), cw); cbed.position.y = 0.62; cbed.castShadow = true; cart.add(cbed);
  for (const sz of [-1, 1]) { const sideB = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.25, 0.06), cw); sideB.position.set(0, 0.78, sz * 0.5); cart.add(sideB); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 18), lam("mWheel", () => ({ color: "#b5452e" }))); wh.rotation.x = Math.PI / 2; wh.position.set(-0.2, 0.38, sz * 0.58); cart.add(wh); }
  rod(cart, [0.85, 0.65, -0.35], [1.7, 0.35, -0.35], 0.035, cw); rod(cart, [0.85, 0.65, 0.35], [1.7, 0.35, 0.35], 0.035, cw);
  const cfb = new Batch(); fruitPile(cfb, [-0.1, 0.67, 0], "mango", 1.4, 0.8, 0.085, 21); bananas(cfb, [0.5, 1.0, 0.1], 0.3, 1.3); cfb.build(cart);
  pineapple(cart, [-0.55, 1.0, 0.1], 1.3);
  crate(b, root, [-3.3, 0, 4.4], 0.8, "SUCRE", 0.25); crate(b, root, [-3.4, 0.8, 4.4], 0.62, undefined, -0.1); crate(b, root, [-2.4, 0, 5.2], 0.7, "RHUM", -0.3);
  barrel(root, [-1.6, 0, 3.6], 0.42, 1);
  const net = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 8, 0, TAU, 0, Math.PI / 2), lam("mNet", () => ({ map: netTex(), side: THREE.DoubleSide, alphaTest: 0.4 }))); net.scale.set(1.2, 0.45, 0.9); net.position.set(-3.6, 0, 1.6); root.add(net);
  // ---- palms ----
  const palms = [palm(root, [6.2, 0, -1.4], 6.8, [-0.9, 0.3], 1), palm(root, [6.6, 0, -17.5], 7.6, [-0.6, -0.4], 2), palm(root, [6.8, 0, -29], 6.4, [0.5, 0.2], 3),
    palm(root, [6.4, 0, 5.2], 7.2, [-1.8, -0.6], 4), palm(root, [-2.5, 0, -36], 7.0, [0.4, 0.4], 5), palm(root, [14, 0, -36], 8.2, [-0.5, 0.3], 6),
    palm(root, [30, 4, -62], 7.0, [0.4, 0], 7), palm(root, [12, 6, -66], 7.4, [-0.4, 0], 8), palm(root, [-9, 0, -40], 7.0, [0.7, 0.2], 9)];
  // ---- lights: hanging lanterns under the awnings, a glowing shop window, a wall lamp ----
  const lamps = [lamp(root, [2.35, 2.0, -5.65], "#ffb860", 5, 6, "hang"), lamp(root, [2.95, 2.0, -12.8], "#ffb860", 4, 6, "hang"), lamp(root, [7.8, 3.0, -8.6], "#ffc46b", 5, 7, "wall")];
  const winM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffcf7a").multiplyScalar(1.5) });
  const shopWin = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), winM); shopWin.rotation.y = -Math.PI / 2; shopWin.position.set(7.97, 1.25, -12.6); shopWin.layers.set(NOINK); root.add(shopWin);
  glow(root, [7.8, 1.3, -12.6], "#ffc070", 2.6, 0.8);
  const shopL = new THREE.PointLight("#ffbe70", 4, 6, 1.4); shopL.position.set(7.3, 1.4, -12.6); root.add(shopL);
  sign(root, "CAFÉ CRÉOLE", 2.4, 0.5, [7.92, 3.0, -12.6], -Math.PI / 2, "#2a6fb0", "#fff1c8");
  sign(root, "MARCHÉ", 1.6, 0.42, [2.4, 2.92, -5.45], -0.55, "#fff1d6", "#b5282e");
  sign(root, "QUAI ST-PIERRE", 2.8, 0.5, [7.92, 3.1, 2.8], -Math.PI / 2, "#f6e7c0", "#2f6f8a");
  // bunting across the street (colour + motion)
  const bunt: THREE.Mesh[] = [];
  const bCols = ["#e8463a", "#f2c230", "#2aa6a0", "#f28c3a", "#3a7fd0"];
  for (let i = 0; i < 14; i++) {
    const u = i / 13, x = lerpN(-1.5, 9.4, u), y = 5.4 - Math.sin(Math.PI * u) * 1.0, z = lerpN(-17, -11, u);
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute([-0.18, 0, 0, 0.18, 0, 0, 0, -0.42, 0], 3)); tg.computeVertexNormals();
    const m = new THREE.Mesh(tg, lam("bunt" + bCols[i % 5], () => ({ color: bCols[i % 5], side: THREE.DoubleSide }))); m.position.set(x, y, z); m.rotation.y = -0.5; root.add(m); bunt.push(m);
  }
  rod(root, [-1.5, 5.45, -17], [7.9, 5.45, -11], 0.012, lam("wire", () => ({ color: "#3d3640" })));
  b.add(new THREE.CylinderGeometry(0.06, 0.08, 5.6, 8).translate(-1.5, 2.8, -17), lam("mPole", () => ({ map: beamHD() })));
  // laundry lines along the right-hand balconies (colour + flutter)
  const laundry: THREE.Mesh[] = [];
  const lCols = ["#f4f1ea", "#e8463a", "#f2c230", "#3a7fd0", "#2aa6a0", "#f28c3a", "#d6336c"];
  for (const [za, zb] of [[-2.2, -9.4], [-13.6, -21.0]] as [number, number][]) {
    rod(root, [7.0, 4.75, za], [7.0, 4.75, zb], 0.01, lam("wire", () => ({ color: "#3d3640" })));
    for (let k = 0; k < 7; k++) { const z = za + (zb - za) * (k + 0.5) / 7, w = 0.35 + (k % 3) * 0.12, h = 0.45 + (k % 2) * 0.25; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0), lam("cloth" + lCols[k % 7], () => ({ color: lCols[k % 7], side: THREE.DoubleSide }))); m.position.set(7.0, 4.74 - Math.sin(Math.PI * (k + 0.5) / 7) * 0.25, z); m.rotation.y = Math.PI / 2; m.castShadow = true; root.add(m); laundry.push(m); }
  }
  // ---- other boats ----
  const boats = [sailBoat(root, [-15, WY - 0.2, -22], 0.6, 1, "#2a6fb0", "#f6ead2", "#f2c230"), sailBoat(root, [-32, WY - 0.2, -48], -0.4, 1.1, "#c8352e", "#fff3d6", "#f2f2f2"), sailBoat(root, [-12, WY - 0.2, 8], 2.2, 0.9, "#3f8a5a", "#f3e6c8", "#e8463a")];
  const foams = [foamPatch(root, 0.7, 46, [-4.15 - 0.6, WY + 0.02, -11], 0, 0.7)];
  const gulls = gullFlock(root, 5, [-4, 8.5, -12], 7);
  const steam = [0, 1, 2].map((i) => puff(root, [bx + (i - 1) * 0.25, deckY + 0.6, bz], 0.7, "#f2fbff", 0.45));
  b.build(root);

  const marks: Record<string, V3> = {
    tudorDeck: [-7.0, deckY, -4.6], hatch: [-6.6, deckY, -6.4],
    local1: [-2.9, 0, -3.9], local2: [-1.9, 0, -4.9], local3: [-3.3, 0, -6.3], local4: [-2.1, 0, -7.2],
    lumpTable: [0.3, 0.83, -3.2], block: [bx, deckY, bz], gang: [-3.4, 0, -2.6],
  };
  const cams = {
    wide: { pos: [0.6, 2.3, 8.0] as V3, look: [-4.0, 2.7, -9] as V3, fov: 50 },
    deck: { pos: [-2.0, 2.5, -1.2] as V3, look: [-6.6, 1.5, -5.0] as V3, fov: 42 },
    locals: { pos: [1.5, 1.5, 1.3] as V3, look: [-3.2, 1.15, -5.5] as V3, fov: 40 },
    block: { pos: [-5.15, deckY + 0.65, -3.45] as V3, look: [-6.0, deckY + 0.42, -5.35] as V3, fov: 40 },
  };
  return {
    name: "martinique", root, marks, cams,
    pose: (t, c) => {
      ship.pose(t, 0.004 * Math.sin(t * 0.8)); lamps.forEach((l) => flicker(l, t));
      palms.forEach((p) => swayPalm(p, t)); [s1, s2, s3].forEach((s) => flutterStall(s, t)); gulls(t);
      bunt.forEach((m, i) => { m.rotation.x = Math.sin(t * 3 + i * 0.7) * 0.35; });
      laundry.forEach((m, i) => { m.rotation.z = Math.sin(t * 2.2 + i * 0.9) * 0.18; });
      boats.forEach((bt, i) => { bt.rotation.z = Math.sin(t * 0.9 + i) * 0.04; bt.position.y = WY - 0.2 + Math.sin(t * 1.1 + i * 2) * 0.05; });
      foams.forEach((f) => { (f.material as THREE.MeshBasicMaterial).map!.offset.set(Math.sin(t * 0.6) * 0.05, t * 0.02); });
      // story controls
      lid.rotation.z = 1.9 * (c.hatch ?? 0);
      const melt = c.melt ?? 0.5; block.set(melt, t); ghost.visible = (c.ghost ?? 1) > 0.5;
      const pd = c.puddle ?? 0.5; deckPud.scale.setScalar(0.25 + 1.0 * pd); deckPud.visible = pd > 0.01;
      shine.position.set(bx - 0.5, deckY + 0.02, bz + 0.1); shine.visible = pd > 0.2;
      const gu = sm(c.gush ?? 0);
      gushes.forEach((s, i) => { const k = sm((c.gush ?? 0) * 1.6 - i * 0.2); s.g.visible = k > 0.01; s.g.scale.set(1, 1, 1).multiplyScalar(Math.max(0.01, k)); s.s.run(t + i * 0.3, k); });
      hatchW.forEach((s, i) => { s.g.visible = gu > 0.05; s.g.scale.setScalar(Math.max(0.01, gu)); s.s.run(t + i * 0.2, gu); });
      dockPud.visible = gu > 0.05; dockPud.scale.setScalar(0.3 + 0.9 * gu);
      risePuffs(splash, t, 0.5, 0.9, 1.2, gu);
      risePuffs(steam, t, 0.9, 0.25, 1.4, 0.6 * (1 - melt * 0.5));
      capCloud.forEach((m, i) => { m.position.x = 10 + (i - 1) * 25 + Math.sin(t * 0.05 + i) * 4; });
    },
  };
};
const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;
const netTex = () => ctex("fishNet", 256, 256, (g) => { g.strokeStyle = "#7a6a52"; g.lineWidth = 4; for (let i = -256; i < 512; i += 26) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke(); } });
