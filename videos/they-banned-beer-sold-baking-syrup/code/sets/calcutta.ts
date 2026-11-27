// Calcutta, sunset (1833): the payoff. A sandstone quay (y = 0) along the Hooghly; the brig TUSCANY (x1.35 scale)
// docked behind it (z < -3.6) with its hatch open, an A-frame hoist and a wooden ramp down to the quay. Three huge
// ice blocks come up out of the hold and slide down the ramp (c.slide 0..1, staggered; they never pop in). A winding
// garland-roped queue (crowd0..crowd21) leads to the biggest block (iceRest); the Ice King's throne of stacked ice
// with the TUDOR ICE CO. route board behind (c.ships 0..1 moves the little ships). Ghat steps + domed palaces on
// the right, more palaces on the left, a domed skyline across the river, sailing boats, string lights, torches.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { stoneHD, beamHD, planksHD } from "../paint";
import { brig, crate, barrel, sack, ropeCoil, iceBlock, waterPlane, rod, sign, lamp, flicker, Ice } from "../setkit";
import { M, palm, swayPalm, gullFlock, sailBoat, sm, cl, lerp, puff, risePuffs, sparkles, sparkle, iceHalo, torch, flickerTorch, stringLights, twinkle, basket, fruitPile, bananas, stall, flutterStall } from "./portkit_common";
import { palace, ghat, parasol, garland, tudorBoard, chhatri } from "./portkit_cal";
import { braceYards } from "./portkit_ship";
import type { SetDef, V3 } from "./types";

export const calcutta = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const WY = -1.4, QZ = -3.6; // river level, quay edge
  // ---- quay: sandstone paving, edge wall + coping, river ----
  const pave = lam("calPave", () => ({ map: stoneHD("calPaveHD", ["#eac9a0", "#e0bd92", "#efd3ae", "#d8b286"], "#b08a64") }));
  b.add(quad(V(-40, 0, 26), V(9, 0, 26), V(9, 0, QZ), V(-40, 0, QZ), 24, 15), pave);
  b.add(quad(V(9, 0, 26), V(60, 0, 26), V(60, 0, -1.2), V(9, 0, -1.2), 25, 14), pave);
  b.add(quad(V(26, 0, -1.2), V(60, 0, -1.2), V(60, 0, -40), V(26, 0, -40), 17, 19), pave);
  const wallS = lam("calQuayWall", () => ({ map: stoneHD("calWallHD", ["#cfa47c", "#c49a72", "#d8b088", "#ba8f68"], "#94704e") }));
  b.add(boxGeo(V(-40, -3, QZ - 0.4), V(9, 0, QZ), 1.6), wallS);
  b.add(boxGeo(V(-40, 0, QZ - 0.45), V(9, 0.18, QZ + 0.35), 1.6), lam("calCope", () => ({ map: stoneHD("calCopeHD", ["#f2dcc0", "#ead2b4", "#f6e4cc", "#e2c8a6"], "#bea07c") })));
  for (let x = -36; x < 8; x += 6) { b.add(new THREE.CylinderGeometry(0.16, 0.22, 0.55, 12).translate(x, 0.45, QZ + 0.05), M.iron()); b.add(new THREE.SphereGeometry(0.19, 12, 8).translate(x, 0.74, QZ + 0.05), M.iron()); }
  waterPlane(root, -400, 400, -500, QZ - 0.2, WY);
  // ---- ghat on the right: steps into the river, parasols, pots, a shrine ----
  ghat(b, 9, 26, -1.2, 9, 0.2, 0.6);
  const parasols = [parasol(root, [12.5, -0.6, -3.4], 1.0, 0.12), parasol(root, [17.5, -1.0, -5.2], 1.1, -0.1), parasol(root, [22.5, -0.4, -2.6], 0.95, 0.08)];
  const brass = lam("brassPot", () => ({ color: "#d9a63a" }));
  for (const [x, y, z] of [[13.6, -0.6, -3.0], [13.9, -0.6, -3.3], [18.6, -1.0, -5.0], [21.4, -0.4, -2.2]] as V3[]) { const pts = [[0, 0], [0.12, 0.02], [0.2, 0.15], [0.16, 0.3], [0.08, 0.36], [0.1, 0.42]].map(([a, c]) => new THREE.Vector2(a, c)); const p = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), brass); p.position.set(x, y, z); root.add(p); }
  chhatri(root, [24.6, 0, 1.6], 1.4, "#f2c09a", "#f6e6cc");
  // ---- palaces ----
  palace(b, root, 25, 9.5, -Math.PI / 2, 15, 9, 9, { wall: "#f2b48a", trim: "#f8ead2", dome: 2.6, chhatris: true, lit: 0.45 });
  palace(b, root, 38, -16, -Math.PI / 2 + 0.25, 14, 10, 11, { wall: "#e8a066", trim: "#f6e3c4", dome: 3.2, minarets: true, lit: 0.4 });
  palace(b, root, -24, 8, Math.PI / 2, 15, 9, 8.5, { wall: "#f4d8a8", trim: "#fbf0dc", dome: 2.4, chhatris: true, lit: 0.45, domeCol: "#f2c09a" });
  palace(b, root, -26, 24, Math.PI / 2, 12, 9, 7, { wall: "#e89a7a", trim: "#f8ead2", lit: 0.5 });
  palace(b, root, 26, 24, -Math.PI / 2, 12, 9, 7.5, { wall: "#e0a85a", trim: "#f8ead2", lit: 0.5, chhatris: true });
  // far bank skyline (haze does the depth)
  const far: [number, number, number, number, number, string, number][] = [[-70, -95, 16, 10, 9, "#eab08a", 3], [-40, -100, 14, 9, 8, "#f2c79a", 0], [-15, -92, 18, 10, 10, "#e8a37c", 3.6], [12, -100, 12, 9, 7, "#f4d2a0", 2.4], [36, -94, 16, 10, 9, "#eab08a", 0], [60, -98, 14, 9, 11, "#e39a70", 3.2], [86, -92, 16, 10, 8, "#f2c79a", 2.6]];
  far.forEach(([x, z, w, d, h, col, dome], i) => palace(b, root, x, z, 0.05 * (i % 3 - 1), w, d, h, { wall: col, trim: "#f8ead2", dome: dome || undefined, minarets: i === 2 || i === 5, chhatris: i % 2 === 1, lit: 0.3 }, -0.5));
  const farGround = new THREE.Mesh(new THREE.BoxGeometry(260, 2, 40), lam("calFarBank", () => ({ color: "#b58a62" }))); farGround.position.set(10, -0.6, -100); root.add(farGround);
  // ---- the brig TUSCANY (scaled up), hatch open, A-frame hoist, ramp to the quay ----
  const S = 1.35, SX = -4, SZ = -6.2;
  const ship = brig(root, "TUSCANY", { sails: "furled" }); ship.g.scale.setScalar(S); ship.g.position.set(SX, WY - 0.05 * S, SZ);
  braceYards(ship, 0.0);
  const deckTop = WY - 0.05 * S + (ship.deckY + 0.06) * S;
  const lid = ship.hatch.userData.lid as THREE.Group;
  const HX = SX + 1.4 * S, HZ = SZ, hatchTop = WY - 0.05 * S + (ship.deckY + 0.06 + 0.14) * S;
  const wood = lam("calRampWood", () => ({ map: planksHD() })), beam = lam("calBeam", () => ({ map: beamHD() }));
  const RT = V(HX, 1.25, HZ + 0.85), RF = V(HX, 0.02, -0.15); // ramp top / foot (surface)
  const rDir = RF.clone().sub(RT), rLen = rDir.length(), rAng = Math.atan2(RT.y - RF.y, RF.z - RT.z);
  const ramp = new THREE.Group(); ramp.position.copy(RT.clone().add(RF).multiplyScalar(0.5)); ramp.rotation.x = rAng; root.add(ramp);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, rLen).translate(0, -0.06, 0), wood); rb.castShadow = true; rb.receiveShadow = true; ramp.add(rb);
  for (const s of [-1, 1]) { const rr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, rLen), beam); rr.position.set(s * 1.1, 0.04, 0); ramp.add(rr); }
  for (let k = -2; k <= 2; k++) { const cleat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.1), beam); cleat.position.set(0, -0.12, k * rLen / 5.5); ramp.add(cleat); }
  for (const s of [-1, 1]) { rod(root, [HX + s * 0.9, deckTop, HZ + 0.9], [HX + s * 0.9, 1.15, HZ + 0.9], 0.07, beam); rod(root, [HX + s * 0.9, 0, -2.6], [HX + s * 0.9, 0.82, -2.6], 0.07, beam); }
  // A-frame hoist with a pulley and a rope (rope length follows the block)
  const apex = V(HX, 5.0, HZ);
  for (const s of [-1, 1]) rod(root, [HX + s * 1.6, deckTop, HZ - 0.2], [apex.x, apex.y + 0.1, apex.z], 0.08, beam);
  rod(root, [HX - 0.4, apex.y - 0.1, HZ], [HX + 0.4, apex.y - 0.1, HZ], 0.05, beam);
  const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), M.iron()); pulley.position.copy(apex).add(V(0, -0.3, 0)); root.add(pulley);
  const hoist = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), M.rope()); root.add(hoist);
  const sling: THREE.Mesh[] = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 5), M.rope()); root.add(m); return m; });
  // ---- the three huge blocks ----
  const BL: [number, number, number][] = [[1.75, 1.5, 1.55], [1.55, 1.32, 1.4], [1.45, 1.22, 1.3]];
  const REST: [number, number, number][] = [[1.4, 3.0, 0.35], [-5.4, 1.4, -0.4], [-2.2, 1.5, 0.15]]; // x, z, yaw
  const blocks = BL.map(([w, h, d], i) => {
    const g = new THREE.Group(); root.add(g);
    const ice = iceBlock(g, w, h, d, [0, 0, 0], { mist: true, seed: 10 + i });
    const sp = sparkles(g, 12, [0, 0, 0], w * 1.1, h * 1.15, d * 1.1, 20 + i, 0.6); iceHalo(g, w, h, d, 1);
    const vap = [0, 1, 2, 3].map((k) => puff(g, [(k - 1.5) * w * 0.3, h * 0.85, d * 0.2], w * 0.9, "#eef9ff", 0.5));
    return { g, ice, sp, vap, w, h, d };
  });
  const groundFog = [0, 1, 2, 3, 4, 5].map((k) => puff(root, [REST[k % 3][0] + (k < 3 ? -0.6 : 0.6), 0.2, REST[k % 3][1] + 0.5], 2.6, "#e6f4ff", 0.35));
  // ---- throne of ice + the route board ----
  const TX = 10.4, TZ = 0.2, TY = -0.3;
  const throne = new THREE.Group(); throne.position.set(TX, 0, TZ); throne.rotation.y = TY; root.add(throne);
  const tb: Ice[] = [
    iceBlock(throne, 2.4, 0.35, 1.8, [0, 0, 0.1], { seed: 31 }), iceBlock(throne, 1.5, 0.55, 1.0, [0, 0.35, 0.05], { seed: 32 }),
    iceBlock(throne, 1.7, 1.05, 0.45, [0, 0.35, -0.65], { seed: 33, mist: true }), iceBlock(throne, 1.35, 0.7, 0.42, [0, 1.4, -0.65], { seed: 34 }),
    iceBlock(throne, 0.75, 0.45, 0.38, [0, 2.1, -0.65], { seed: 35, mist: true }),
    iceBlock(throne, 0.38, 0.8, 1.0, [-0.95, 0.35, 0.05], { seed: 36 }), iceBlock(throne, 0.38, 0.8, 1.0, [0.95, 0.35, 0.05], { seed: 37 }),
  ];
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 0.85), lam("velvet", () => ({ color: "#c0283a" }))); cushion.position.set(0, 0.97, 0.08); cushion.castShadow = true; throne.add(cushion);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const ts = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M.gold()); ts.position.set(sx * 0.62, 0.95, 0.08 + sz * 0.42); throne.add(ts); }
  for (const sx of [-1, 1]) { const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), M.gold()); ball.position.set(sx * 0.95, 1.3, 0.05); throne.add(ball); }
  const crownT = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.2, 12, 1, true), M.gold()); crownT.position.set(0, 2.65, -0.65); throne.add(crownT);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2).rotateX(-Math.PI / 2), lam("carpet", () => ({ color: "#b5283a" }))); carpet.position.set(0, 0.012, 2.9); throne.add(carpet);
  const carpetB = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 4.3).rotateX(-Math.PI / 2), lam("carpetB", () => ({ color: "#e0a83a" }))); carpetB.position.set(0, 0.008, 2.9); throne.add(carpetB);
  const thSp = sparkles(throne, 14, [0, 0.2, 0], 2.6, 2.6, 1.8, 41, 0.5);
  { const hg = new THREE.Group(); hg.position.set(0, 0, -0.3); throne.add(hg); iceHalo(hg, 2.2, 2.4, 1.6, 0.6); }
  const board = tudorBoard(root, [TX - 0.55, 0, TZ - 1.9], TY);
  // ---- queue: winding path, bamboo posts with marigold garlands ----
  const qpath = new THREE.CatmullRomCurve3([V(2.75, 0, 4.0), V(6.2, 0, 5.2), V(7.6, 0, 6.6), V(6.2, 0, 8.0), V(2.6, 0, 8.3), V(0.2, 0, 8.9), V(-0.6, 0, 10.4), V(1.6, 0, 11.4), V(4.8, 0, 11.8)]);
  const QN = 22, qpts = qpath.getSpacedPoints(QN - 1);
  const gb = new Batch(), bamboo = lam("bamboo", () => ({ color: "#c9a25a" }));
  const side = (u: number, s: number) => { const p = qpath.getPointAt(u), tg = qpath.getTangentAt(u); return p.clone().add(V(-tg.z, 0, tg.x).multiplyScalar(0.62 * s)); };
  for (const s of [-1, 1]) {
    let prev: THREE.Vector3 | null = null;
    for (let k = 0; k <= 10; k++) {
      const p = side(k / 10, s); gb.add(new THREE.CylinderGeometry(0.035, 0.045, 1.05, 6).translate(p.x, 0.52, p.z), bamboo);
      gb.add(new THREE.SphereGeometry(0.08, 10, 8).translate(p.x, 1.08, p.z), M.gold());
      if (prev) garland(gb, [prev.x, 0.98, prev.z], [p.x, 0.98, p.z], 0.22);
      prev = p;
    }
  }
  gb.build(root);
  // toy model brig on a crate by the queue (scale gag)
  crate(b, root, [-1.6, 0, 6.6], 0.8, "MODEL", 0.3);
  const toy = brig(root, "", { sails: "set" }); toy.g.scale.setScalar(0.065); toy.g.position.set(-1.6, 0.8 + 0.06, 6.6); toy.g.rotation.y = 0.5;
  toy.g.traverse((o) => { const l = o as THREE.PointLight; if (l.isPointLight) l.intensity = 0; });
  // ---- props on the quay ----
  ([[-8.6, 1.2, 0.2, "TUDOR\nICE CO."], [-9.4, 2.1, -0.3, undefined], [-8.8, 1.2, 0.2, undefined], [5.2, 0.6, 0.4, "CALCUTTA"], [-11.5, 4.5, 0.1, "SAWDUST"]] as [number, number, number, string | undefined][]).forEach(([x, z, yaw, l], i) => crate(b, root, [x, i === 2 ? 0.85 : 0, z], i === 2 ? 0.7 : 0.85, l, yaw));
  barrel(root, [-10.4, 0, 0.0], 0.42); barrel(root, [-11.1, 0, 0.8], 0.42, 1); barrel(root, [4.4, 0, -1.6], 0.42, 2);
  sack(root, [-7.6, 0, 0.6], 0.34, "#d9b67a"); sack(root, [-7.9, 0, 1.3], 0.3); ropeCoil(root, [-6.8, 0, -2.8], 0.42); ropeCoil(root, [3.4, 0, -2.6], 0.38);
  basket(root, [-6.6, 0, 3.8], 0.34, 0.3, "#c99a52"); basket(root, [-7.4, 0, 4.4], 0.3, 0.28, "#b98a42");
  const fb = new Batch(); fruitPile(fb, [-6.6, 0.16, 3.8], "mango", 0.42, 0.42, 0.075, 3); fruitPile(fb, [-7.4, 0.15, 4.4], "orange", 0.36, 0.36, 0.065, 4); bananas(fb, [-7.0, 0, 3.2], 0.4, 1.2); fb.build(root);
  sign(root, "HOOGHLY GHAT", 2.6, 0.5, [17.5, 2.9, -0.9], -0.3, "#2f6b4f", "#ffe7a8");
  rod(root, [16.4, 0, -0.95], [16.4, 2.9, -0.95], 0.06, beam); rod(root, [18.6, 0, -0.85], [18.6, 2.9, -0.85], 0.06, beam);
  // a marigold + mango stall and a sweets stall on the left of the quay
  const stalls = [stall(root, [-8.2, 0, 7.6], 0.55, 2.4, "#d6336c", "#ffe7b0", 31), stall(root, [-9.6, 0, 11.6], 0.75, 2.2, "#2f9a6b", "#ffe7b0", 34)];
  // ---- palms ----
  const palms = [palm(root, [-14, 0, -1.6], 8, [0.7, 0.4], 21), palm(root, [-17.5, 0, 3.0], 7.2, [-0.6, 0.3], 22), palm(root, [15.2, 0, 5.2], 8.4, [-0.8, -0.2], 23),
    palm(root, [19.5, 0, 14], 7.6, [0.5, 0.4], 24), palm(root, [-13, 0, 16], 7.8, [0.9, -0.3], 25), palm(root, [30, 0, -4], 8.6, [-0.5, 0.2], 26), palm(root, [-30, -0.5, -92], 9, [0.4, 0], 27), palm(root, [48, -0.5, -90], 9, [-0.4, 0], 28)];
  // ---- light: torches by the ramp + throne, lantern posts, string lights ----
  const torches = [torch(root, [HX - 1.6, 0, 0.25], 2.1, true, 8, 9), torch(root, [HX + 1.6, 0, 0.25], 2.1, true, 8, 9), torch(root, [TX - 2.6, 0, TZ + 0.4], 2.3, true, 7, 8), torch(root, [TX + 2.0, 0, TZ + 1.4], 2.3, true, 7, 8),
    torch(root, [4.0, 0, 13.0], 2.2, false), torch(root, [-2.5, 0, 12.6], 2.2, false), torch(root, [12.4, -0.8, -4.2], 2.0, false)];
  const lamps = [lamp(root, [-12.4, 3.0, 3.8], "#ffb45a", 4, 8), lamp(root, [8.2, 3.0, 9.6], "#ffb45a", 4, 8)];
  const posts: V3[] = [[-10.5, 0, -3.1], [-0.4, 0, -3.1], [7.6, 0, -3.2], [14.2, 0, -2.6], [9.0, 0, 13.6], [-4.6, 0, 13.8]];
  posts.forEach(([x, , z]) => { b.add(new THREE.CylinderGeometry(0.07, 0.1, 5.0, 8).translate(x, 2.5, z), beam); b.add(new THREE.SphereGeometry(0.13, 10, 8).translate(x, 5.05, z), M.gold()); });
  const mainTop: V3 = [SX + 2.4 * S, WY + (ship.deckY + 8.6) * S, SZ], foreTop: V3 = [SX - 1.6 * S, WY + (ship.deckY + 8.6) * S, SZ];
  const cols = ["#ffd27a", "#ffb04a", "#ff8a5a", "#ffe7a0", "#9fe07a", "#ffd27a", "#ff6a6a"];
  const strings = [stringLights(root, [-10.5, 4.95, -3.1], [-0.4, 4.95, -3.1], 0.9, 18, "", cols), stringLights(root, [-0.4, 4.95, -3.1], [7.6, 4.95, -3.2], 0.8, 14, "", cols),
    stringLights(root, [7.6, 4.95, -3.2], [14.2, 4.95, -2.6], 0.5, 12, "", cols), stringLights(root, [14.2, 4.95, -2.6], [9.0, 4.95, 13.6], 1.0, 22, "", cols),
    stringLights(root, [9.0, 4.95, 13.6], [-4.6, 4.95, 13.8], 1.1, 22, "", cols), stringLights(root, [mainTop[0], mainTop[1], mainTop[2]], [-0.4, 4.95, -3.1], 1.0, 20, "", cols),
    stringLights(root, [foreTop[0], foreTop[1], foreTop[2]], [-10.5, 4.95, -3.1], 1.0, 20, "", cols), stringLights(root, [mainTop[0], mainTop[1], mainTop[2]], [foreTop[0], foreTop[1], foreTop[2]], 0.6, 10, "", cols),
    stringLights(root, [-4.6, 4.95, 13.8], [-10.5, 4.95, -3.1], 1.0, 24, "", cols)];
  const sL = [new THREE.PointLight("#ffc070", 5, 10, 1.4), new THREE.PointLight("#ffc070", 5, 10, 1.4)]; sL[0].position.set(4.4, 4.0, 13.4); sL[1].position.set(-6.0, 4.0, -2.4); root.add(...sL);
  // ---- river: sailing boats, a rowboat, gulls ----
  const boats = [sailBoat(root, [10, WY - 0.2, -18], 0.2, 1.2, "#7a3a2a", "#f3e2c0", "#2f6b4f"), sailBoat(root, [-22, WY - 0.2, -28], -0.3, 1.4, "#3a5a7a", "#f6d8a8", "#c8352e"), sailBoat(root, [30, WY - 0.2, -40], 2.9, 1.6, "#8a4a2e", "#fff0d0", "#f2c230"), sailBoat(root, [-48, WY - 0.2, -55], 0.1, 1.8, "#5a3a2a", "#f3e6c8", "#e8634a")];
  const gulls = gullFlock(root, 4, [2, 12, -14], 9, "#fff3e6");
  b.build(root);
  // ---- marks + cams ----
  const marks: Record<string, V3> = { iceRest: [REST[0][0], 0, REST[0][1]], throne: [TX + 0.12, 0.35, TZ + 0.75], throneSeat: [TX + 0.04, 1.04, TZ + 0.2], rampFoot: [HX, 0, 0.6], hatch: [HX, hatchTop, HZ], toy: [-1.6, 0, 6.6] };
  qpts.forEach((p, i) => { marks["crowd" + i] = [+p.x.toFixed(2), 0, +p.z.toFixed(2)]; });
  const cams = {
    wide: { pos: [4.5, 6.8, 21.5] as V3, look: [-0.8, 2.6, -8] as V3, fov: 52 },
    low: { pos: [HX + 0.45, 0.36, 2.9] as V3, look: [HX - 0.05, 1.2, -4.5] as V3, fov: 44 },
    queue: { pos: [-1.7, 3.0, 0.9] as V3, look: [5.4, 1.0, 6.8] as V3, fov: 48 },
    throne: { pos: [TX - 0.5, 2.3, TZ + 9.4] as V3, look: [TX - 0.55, 2.85, TZ - 1.6] as V3, fov: 46 },
  };
  // block path: hoist out of the hold -> swing over to the ramp -> slide down -> glide to its resting spot
  const rampY = (z: number) => RT.y + (RF.y - RT.y) * cl((z - RT.z) / (RF.z - RT.z));
  const placeBlock = (i: number, u: number, t: number) => {
    const k = blocks[i], g = k.g, [rx, rz, ryaw] = REST[i];
    let x = HX, y = 0, z = HZ, pitch = 0, yaw = 0;
    const a1 = 0.26, a2 = 0.38, a3 = 0.74;
    if (u < a1) { const v = sm(u / a1); y = lerp(hatchTop - k.h - 1.0, 1.42, v); }
    else if (u < a2) { const v = sm((u - a1) / (a2 - a1)); z = lerp(HZ, RT.z + k.d * 0.5, v); y = lerp(1.42, rampY(RT.z + k.d * 0.5) + 0.02, v); pitch = -rAng * v * 0.9; }
    else if (u < a3) { const v = (u - a2) / (a3 - a2), e = v * v; z = lerp(RT.z + k.d * 0.5, RF.z + 0.25, e); y = rampY(z); pitch = -rAng; }
    else { const v = 1 - (1 - (u - a3) / (1 - a3)) ** 3; const z0 = RF.z + 0.25 + 0.8; x = lerp(HX, rx, v); z = lerp(z0, rz, v); y = 0; yaw = ryaw * v; pitch = -rAng * Math.max(0, 1 - (u - a3) / 0.05); }
    g.position.set(x, y, z); g.rotation.set(pitch, yaw, 0);
    k.ice.set(0, t + i); g.visible = u > 0.001 || i === 0;
    return u > 0.001 && u < a2;
  };
  return {
    name: "calcutta", root, marks, cams,
    pose: (t, c) => {
      ship.pose(t, 0); toy.pose(t, 0); lamps.forEach((l) => flicker(l, t)); torches.forEach((tc) => flickerTorch(tc, t));
      strings.forEach((s) => twinkle(s.glows, t)); stalls.forEach((st) => flutterStall(st, t)); palms.forEach((p) => swayPalm(p, t, 0.8)); gulls(t);
      boats.forEach((bt, i) => { bt.position.x += 0; bt.rotation.z = Math.sin(t * 0.8 + i) * 0.04; bt.position.y = WY - 0.2 + Math.sin(t * 1.1 + i * 2) * 0.06; bt.position.x = [10, -22, 30, -48][i] + Math.sin(t * 0.05 + i) * 2 + t * 0.15 * (i % 2 ? 1 : -1); });
      parasols.forEach((p, i) => { p.rotation.y = Math.sin(t * 0.3 + i) * 0.05; });
      lid.rotation.z = 1.9 * (c.hatch ?? 1);
      const sl = c.slide ?? 0;
      let hoisting = -1;
      blocks.forEach((k, i) => { const u = cl(sl * 1.9 - i * 0.45); if (placeBlock(i, u, t)) hoisting = i; sparkle(k.sp, t + i, 1); risePuffs(k.vap, t + i * 0.3, 0.8, 0.3, 1.5, 0.8); });
      if (hoisting >= 0) {
        const k = blocks[hoisting], top = k.g.position.clone().add(V(0, k.h, 0)), p = pulley.position;
        hoist.visible = true; hoist.position.copy(p.clone().add(top).multiplyScalar(0.5)); hoist.scale.set(1, p.distanceTo(top), 1); hoist.quaternion.setFromUnitVectors(V(0, 1, 0), top.clone().sub(p).normalize());
        sling.forEach((m, j) => { const cx = top.x + (j % 2 ? 0.5 : -0.5) * k.w * 0.9, cz = top.z + (j < 2 ? 0.5 : -0.5) * k.d * 0.9; const A = V(cx, top.y, cz), B = top.clone().add(V(0, 0.5, 0)); m.visible = true; m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.scale.set(1, A.distanceTo(B), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize()); });
      } else { hoist.visible = true; const p = pulley.position, e = V(p.x, hatchTop + 0.6, p.z); hoist.position.copy(p.clone().add(e).multiplyScalar(0.5)); hoist.scale.set(1, p.distanceTo(e), 1); hoist.quaternion.identity(); sling.forEach((m) => (m.visible = false)); }
      const settled = blocks.map((_, i) => cl((sl * 1.9 - i * 0.45 - 0.74) / 0.26));
      risePuffs(groundFog, t, 0.3, 0.12, 0.8, 0.9 * Math.max(...settled, 0.15));
      tb.forEach((k, i) => k.set(0, t + i)); sparkle(thSp, t, 1);
      board.place(c.ships ?? 0.5, t);
    },
  };
};
