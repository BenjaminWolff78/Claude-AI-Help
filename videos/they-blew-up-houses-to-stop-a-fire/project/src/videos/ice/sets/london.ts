// LONDON, evening fog (scenes 3 + 4 of "Why He Put a Bridge in the Desert"): the 1831 granite bridge (oldbridge.ts,
// variant "london") over the river at the set origin. The river flows along z under the arches between embankment
// walls at x = +-29.5 (water y = 0); arches 0 and 4 stand over the stone quays (y = QY = 2.6) that run along both
// banks in front of brick + stone warehouses (fronts at x = +-46, lit windows), with raised approach roads at deck
// level (x beyond +-48). Downstream (+z) of pier 1 river stairs come down the left embankment to a stone landing at
// the water next to the pier's cutwater (the inspector's spot; painted level marks + a measuring staff on the pier).
// A crane barge is moored by pier 3 (downstream), a tug towing a lighter passes slowly far downstream, fog banks,
// gulls, a domed skyline far upstream in the fog, lamp reflections on the water.
// Deck (scene 3): red double-decker (ctl bus), a parked black cab, the deal table + two chairs on the downstream
// pavement (x = -13), the easel price board, a FOR SALE banner hung on the river face over the centre arch, a bus stop.
// Scene 4 (ctl later = 1, months later): table / board / banner / cab gone; the bridge's parapet + top courses lifted
// off from the +x end (ctl dismantle), pallet stacks of numbered blocks along the roadway, tarpaulins, tool boxes,
// a rope barrier on the open edge, a scaffold on the downstream face of arch 4, and the crane's crate (ctl crate).
//
// Controls (c):
//   bus        0..1  the double-decker drives across the bridge (+x, upstream lane z = -1.9; x = -120 .. +120)
//   later      0/1   scene-4 dressing (default: 1 when dismantle > 0, else 0)
//   dismantle  0..1  passed to the bridge (0.42 = everything east of x ~ 8 lifted off)
//   numbered   0..1  passed to the bridge (white stencil numbers on the facing stones); default = later
//   lamps      0..1  bridge + quay lamps lit (default 1)
//   crate      0..1  the crane lifts the crate off the deck pavement at x 14.2 (0-0.35), slews it out over the
//                    river towards -x/+z (0.35-0.75: away from + screen-left of the deck track looking -x, ends
//                    above the water at about (5.5, 13, 11.5)) and it keeps swinging
//   sink       0..1  the bridge sinks 0.12 m into the river (the "notch" gag at the ruler; everything on the bridge moves)
//   ruler      0/1   a set measuring staff stood against the pier (default 0: the inspector carries the cast prop "ruler")
//   built      0..1  passed to the bridge (default 1)
//   solo       0/1   test only: hides London and shows the "desert" bridge alone on plain sand (use light "desert")
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { cobbleHD, stoneHD, rng } from "../paint";
import { waterPlane, crate as crateProp, barrel, sign, lamp, flicker } from "../setkit";
import { gullFlock, risePuffs, sm, cl } from "./portkit_common";
import { oldBridge, OldBridge, riverStoneMat } from "./oldbridge";
import {
  warehouse, WSTYLES, styleH, skyline, bollard, railing, lampPostL, streak, dealTable, chair, priceBoard, saleBanner,
  gauge, ruler, blockStack, toolBox, tarpHeap, scaffold, ropeBarrier, fogBank, iron,
} from "./londonkit";
import { bus as makeBus, cab as makeCab, tug as makeTug, lighter as makeLighter, craneBarge, tarpTex } from "./londonkit_v";
import type { SetDef, V3 } from "./types";

const QY = 2.6, EMB = 29.5, DECK = 10.5, ROAD = 10.38;
// table / inspector geometry (also used by marks + cams)
const TX = -20.5, TZ = 5.1; // next to the inspector landing; the tall FOR SALE banner hangs on the river face right below it
const NOSE: V3 = [-27.25, 0, 9.7]; // pier 1 downstream cutwater nose
const CWD: [number, number] = [0.64, -0.768], CWN: [number, number] = [0.768, 0.64]; // river-side cutwater face: along, normal
const onCW = (k: number, off = 0): V3 => [NOSE[0] + CWD[0] * 3.515 * k + CWN[0] * off, 0, NOSE[2] + CWD[1] * 3.515 * k + CWN[1] * off];
const RULER = onCW(0.12, 0.07);
const CRATE_REST: V3 = [14.2, DECK, 5.2];
const BARGE: V3 = [17.4, 0, 14.4];

export const LONDON_SOLIDS: [V3, V3][] = [];

export const london = (): SetDef => {
  const root = new THREE.Group();
  const lon = new THREE.Group(); root.add(lon);
  const sinkG = new THREE.Group(); lon.add(sinkG);
  const br = oldBridge(sinkG, { variant: "london", skipLamps: [{ x: -27.25, side: 1 }] });
  const b = new Batch();
  const r = rng(77);
  // ---------------- river, embankments, quays ----------------
  waterPlane(lon, -EMB, EMB, -420, 420, 0);
  const embTex = stoneHD("lonEmbHD", ["#bdb5a8", "#b2aa9c", "#c4bcb0", "#aaa294"], "#6e665c");
  const embM = riverStoneMat("london", embTex, "#a29b92");
  const copeM = lam("lonCope", () => ({ map: stoneHD("lonCopeHD", ["#c8c0b2", "#beb6a8", "#d0c8ba", "#b6ae9f"], "#7a7266") }));
  for (const s of [-1, 1]) {
    const x = s * EMB;
    for (const [z0, z1] of [[-420, -7], [7, 420]] as [number, number][]) {
      // face (normal towards the river), coping, quay surface
      const a = V(x, -1.5, s < 0 ? z1 : z0), c = V(x, -1.5, s < 0 ? z0 : z1);
      b.add(quad(a, c, c.clone().setY(QY - 0.3), a.clone().setY(QY - 0.3), Math.abs(z1 - z0) / 4, (QY + 1.2) / 4), embM);
      b.add(boxGeo(V(Math.min(x, x - s * 0.6), QY - 0.3, z0), V(Math.max(x + s * -0.6, x + s * 0.12), QY + 0.04, z1), 1.6), copeM);
    }
  }
  const quayM = lam("lonQuay", () => ({ map: cobbleHD(), color: "#8f8c96" }));
  for (const s of [-1, 1]) b.add(quad(V(s < 0 ? -160 : EMB, QY, 420), V(s < 0 ? -EMB : 160, QY, 420), V(s < 0 ? -EMB : 160, QY, -420), V(s < 0 ? -160 : EMB, QY, -420), (160 - EMB) / 4, 840 / 4), quayM);
  // ---------------- river stairs + landing by pier 1 (downstream) ----------------
  const landM = riverStoneMat("london", stoneHD("lonLandHD", ["#c4bcae", "#b8b0a2", "#cdc5b8", "#aea698"], "#716a60"), "#a8a198");
  const LX0 = -EMB, LX1 = -26.3, LZ0 = 9.75, LZ1 = 13.4, LY = 0.35;
  b.add(boxGeo(V(LX0, -1.5, LZ0), V(LX1, LY, LZ1), 1.2), landM);
  b.add(boxGeo(V(LX1 - 0.25, LY, LZ0), V(LX1, LY + 0.12, LZ1), 1.2), landM); // edge kerb
  const NST = 11, SR = (QY - LY) / NST, ST = 0.33;
  for (let i = 0; i < NST; i++) b.add(boxGeo(V(LX0, LY, LZ1 + i * ST), V(-27.9, LY + (i + 1) * SR, LZ1 + NST * ST), 1.0), landM);
  b.add(boxGeo(V(-27.9, -1.5, LZ1), V(-27.6, QY - 0.3, LZ1 + NST * ST), 1.2), embM); // stair side wall
  // stair handrail (posts + sloped rail) and a mooring ring
  const ir = iron();
  for (let i = 0; i <= NST; i += 2) b.add(new THREE.CylinderGeometry(0.03, 0.035, 1.0, 6).translate(-27.75, LY + i * SR + 0.5 + (i ? 0 : 0), LZ1 + i * ST + 0.15), ir);
  { const A = V(-27.75, LY + 1.0, LZ1 + 0.15), C = V(-27.75, QY + 1.0, LZ1 + NST * ST + 0.15), L = A.distanceTo(C), m = A.clone().add(C).multiplyScalar(0.5); const geo = new THREE.CylinderGeometry(0.03, 0.03, L, 6); geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize())); geo.translate(m.x, m.y, m.z); b.add(geo, ir); }
  b.add(new THREE.TorusGeometry(0.2, 0.035, 6, 14).translate(-EMB + 0.05, 0.75, 11.6).rotateY(0), ir);
  b.add(new THREE.TorusGeometry(0.16, 0.03, 6, 12).rotateX(Math.PI / 2).translate(-26.75, LY + 0.04, 12.8), ir);
  bollard(b, -26.8, LY, 13.0);
  // a wall lantern on the embankment over the landing (warm key on the inspector + the cutwater)
  const landLamp = lamp(lon, [-29.05, 3.9, 11.2], "#ffb45a", 9, 13, "wall"); landLamp.rotation.y = Math.PI / 2;
  // iron ladder down the embankment by the landing, a drain outlet, mooring rings along the walls
  for (const s of [-1, 1]) for (let z = -400; z < 400; z += 23) { if (Math.abs(z) < 20) continue; b.add(new THREE.TorusGeometry(0.2, 0.035, 6, 14).rotateY(Math.PI / 2).translate(s * (EMB - 0.05), 1.0, z), ir); }
  b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.4, 14, 1, true).rotateZ(Math.PI / 2).translate(-EMB + 0.15, 0.9, 30), lam("lonDrain", () => ({ color: "#2a2a30", side: THREE.DoubleSide })));
  // quay railings (gaps for the stairs and under the bridge), bollards, lamp posts
  const quayLamps: { glow: THREE.Sprite; light: THREE.PointLight | null; glass: THREE.Mesh }[] = [];
  for (const s of [-1, 1]) {
    const x = s * (EMB + 0.35) * -1 * -1;
    const segs: [number, number][] = s < 0 ? [[-400, -9.8], [9.8, 15.6], [17.6, 400]] : [[-400, -9.8], [9.8, 400]];
    for (const [z0, z1] of segs) railing(b, [s * (EMB + 0.35), QY, z0], [s * (EMB + 0.35), QY, z1]);
    for (let z = -380; z < 400; z += 9.5) { if (Math.abs(z) < 12 || (s < 0 && z > 14 && z < 19)) continue; bollard(b, s * (EMB + 1.0), QY, z); }
    for (const z of [-118, -86, -54, -22, 18.6, 50, 82, 114]) quayLamps.push(lampPostL(b, lon, s * (EMB + 1.2), QY, z, 4.4, s < 0 && z === 18.6 ? 7 : 0));
    void x;
  }
  // ---------------- approaches at deck level (x beyond +-48) ----------------
  const appWall = lam("lonAppWall", () => ({ map: stoneHD("lonAppHD", ["#aaa296", "#a09888", "#b4ac9e", "#988f82"], "#625a50") }));
  const setts = lam("lonAppSetts", () => ({ map: cobbleHD(), color: "#8e8c94" }));
  const flags = lam("lonAppFlags", () => ({ map: stoneHD("lonFlagsHD", ["#a7a29a", "#9d988f", "#b0aba2", "#958f86"], "#5f5a54"), color: "#c6c2bc" }));
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -170 : 48, x1 = s < 0 ? -48 : 170;
    for (const z of [-7, 7]) b.add(quad(V(z > 0 ? x0 : x1, QY, z), V(z > 0 ? x1 : x0, QY, z), V(z > 0 ? x1 : x0, DECK, z), V(z > 0 ? x0 : x1, DECK, z), (x1 - x0) / 4, (DECK - QY) / 4), appWall);
    b.add(quad(V(x0, ROAD, 3.75), V(x1, ROAD, 3.75), V(x1, ROAD, -3.75), V(x0, ROAD, -3.75), (x1 - x0) / 4, 7.5 / 4), setts);
    for (const z of [-1, 1]) {
      b.add(boxGeo(V(x0, ROAD, Math.min(z * 3.75, z * 4.05)), V(x1, DECK, Math.max(z * 3.75, z * 4.05)), 1.5), copeM);
      b.add(quad(V(x0, DECK, z * 6.45), V(x1, DECK, z * 6.45), V(x1, DECK, z * 4.05), V(x0, DECK, z * 4.05), (x1 - x0) / 4, 0.6), flags);
      b.add(boxGeo(V(x0, DECK, Math.min(z * 6.45, z * 7.0)), V(x1, DECK + 1.0, Math.max(z * 6.45, z * 7.0)), 1.6), appWall);
      b.add(boxGeo(V(x0, DECK + 1.0, Math.min(z * 6.4, z * 7.1)), V(x1, DECK + 1.15, Math.max(z * 6.4, z * 7.1)), 1.6), copeM);
      for (let x = x0 + 8; x < x1 - 4; x += 16) quayLamps.push(lampPostL(b, lon, x, DECK, z * 6.1, 4.0, 0));
    }
  }
  // ---------------- warehouses on both banks, second row, far skyline ----------------
  const rowSpec: [number, number, number, "gable" | "flat"][] = [[9.5, 18, 0, "gable"], [28, 16, 3, "flat"], [44.5, 18, 1, "gable"], [63, 16, 2, "flat"], [79.5, 20, 5, "gable"], [100, 18, 4, "gable"], [118.5, 22, 0, "flat"], [141, 20, 3, "gable"], [161.5, 22, 1, "flat"], [184, 20, 2, "gable"], [204.5, 24, 5, "flat"]];
  const whSolids: [V3, V3][] = [];
  for (const s of [-1, 1]) for (const zs of [1, -1]) rowSpec.forEach(([z0, w, si0, roof], i) => {
    const si = (si0 + (s > 0 ? 2 : 0) + (zs < 0 ? 1 : 0)) % WSTYLES.length, d = 14, zc = zs * (z0 + w / 2), x = s * (46 + d / 2);
    warehouse(b, x, zc, s < 0 ? Math.PI / 2 : -Math.PI / 2, w - 0.4, d, si, QY, { roof: i % 3 === 1 ? "flat" : roof, seed: i * 7 + (s > 0 ? 3 : 0) + (zs > 0 ? 1 : 0) });
    whSolids.push([[x - d / 2, QY, zc - w / 2], [x + d / 2, QY + styleH(WSTYLES[si]) + 6, zc + w / 2]]);
    if (i < 6) { // second row, taller, behind
      const s2 = (si + 3) % WSTYLES.length;
      warehouse(b, s * (66 + 8), zc + zs * 4, s < 0 ? Math.PI / 2 : -Math.PI / 2, w + 2, 16, s2, QY + 6, { roof: "gable", seed: 100 + i, cathead: false });
    }
  });
  skyline(b, -40, -230, QY, 260, 11, { dome: true });
  skyline(b, 10, 260, QY, 260, 23);
  skyline(b, -150, -40, QY + 8, 120, 31);
  skyline(b, 150, 30, QY + 8, 120, 37);
  // a few riverside props on the quays: crates, barrels, a hand cart, signs
  for (const [x, z, s2, lbl] of [[-44.2, 24, 0.8, "TEA"], [-44.5, 25.2, 0.7, undefined], [-43.6, 30.5, 0.8, "HOPS"], [44, -26, 0.8, "WOOL"], [43.6, -27.3, 0.7, undefined], [-44, -33, 0.8, undefined]] as [number, number, number, string | undefined][]) crateProp(b, lon, [x, QY, z], s2, lbl, r() * 0.4);
  for (const [x, z] of [[-43.8, 21.4], [-44.6, 21.9], [44.2, -30.5], [43.6, 40]] as [number, number][]) barrel(lon, [x, QY, z], 0.42, r() * 3);
  sign(lon, "CARRAWAY WHARF", 7.6, 1.0, [-45.9, QY + 4.6, 18.2], Math.PI / 2, "#2c3a52", "#f2e2b0");
  sign(lon, "J. PELLOW & SONS  TEA", 8.2, 1.0, [45.9, QY + 4.4, -17.8], -Math.PI / 2, "#5a2e22", "#f6e6c0");
  sign(lon, "HOLLOWAY STORES", 7.0, 0.95, [-45.9, QY + 4.6, -19.2], Math.PI / 2, "#3a3a2a", "#f2e2b0");
  sign(lon, "BRIDGEWATER MILLS", 7.4, 0.95, [45.9, QY + 4.6, 19.6], -Math.PI / 2, "#2f4a3c", "#f6e6c0");
  b.build(lon);

  // ---------------- on / around the bridge ----------------
  // tide gauge on pier 1 (downstream cutwater, river face) + the measuring staff
  const gp = onCW(0.36);
  gauge(br.g, [gp[0], 0, gp[2]], [CWN[0], 0, CWN[1]], -0.6, 4.2);
  const staff = ruler(lon, [RULER[0], -0.4, RULER[2]], Math.atan2(CWN[0], CWN[1]), -0.03);
  // lamp reflections on the water (bridge lamps + quay lamps)
  const refl: THREE.Mesh[] = [];
  for (const [x, , z] of br.LAMPS) refl.push(streak(lon, x, z > 0 ? 7.6 : -7.6, 16, z > 0 ? 1 : -1, "#ffb860", 0.55, 1.1));
  for (const z of [-54, -22, 18.6, 50]) for (const s of [-1, 1]) refl.push(streak(lon, s * (EMB - 0.6), z, 9, 1, "#ffb860", 0.4, 0.8));
  // deck dressing, scene 3
  const s3 = new THREE.Group(); lon.add(s3);
  dealTable(s3, TX, DECK, TZ);
  chair(s3, TX + 0.95, DECK, TZ, Math.PI); chair(s3, TX - 0.95, DECK, TZ, 0);
  priceBoard(s3, TX - 1.85, DECK, TZ - 0.55, -0.4);
  const banner = saleBanner(sinkG, TX, 11.55, 7.52, 2.4, 3.2);
  const bannerG = banner.m;
  for (const x of [TX - 1.1, TX + 1.1, TX]) { const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5), lam("lonBarRope", () => ({ color: "#c94a2e" }))); rp.position.set(x, 11.45, 7.3); rp.rotation.x = 0.9; s3.add(rp); }
  const theCab = makeCab(s3); theCab.position.set(-4.2, ROAD, 2.75); theCab.rotation.y = Math.PI;
  // bus stop (upstream pavement)
  { const pb = new Batch(); pb.add(new THREE.CylinderGeometry(0.045, 0.05, 2.8, 8).translate(-2.6, DECK + 1.4, -4.4), iron()); pb.build(lon);
    const stop = sign(lon, "BUS STOP", 0.8, 0.5, [-2.6, DECK + 2.6, -4.4], 0, "#c8302a", "#ffffff"); stop.scale.set(1, 1, 0.6);
    const back = sign(lon, "BUS STOP", 0.8, 0.5, [-2.6, DECK + 2.6, -4.44], Math.PI, "#c8302a", "#ffffff"); back.scale.set(1, 1, 0.2); }
  const theBus = makeBus(lon);
  // scene 4 dressing
  const s4 = new THREE.Group(); lon.add(s4);
  const stacks: { x: number; z: number; yaw: number; n: number; cover?: boolean }[] = [
    { x: 30.5, z: 2.5, yaw: 0.05, n: 2 }, { x: 27.6, z: 2.6, yaw: -0.04, n: 3 }, { x: 24.4, z: 2.4, yaw: 0.06, n: 2 }, { x: 21.4, z: 2.6, yaw: 0.0, n: 2, cover: true },
    { x: 18.2, z: 2.5, yaw: -0.05, n: 1 }, { x: 34.0, z: -1.2, yaw: 0.02, n: 2, cover: true }, { x: 15.2, z: 2.5, yaw: 0.04, n: 2 }, { x: 12.2, z: 2.6, yaw: -0.03, n: 3 }, { x: 27.0, z: 0.0, yaw: 0.1, n: 2 }, { x: 22.6, z: -0.1, yaw: -0.08, n: 1 },
    { x: 36.6, z: -4.9, yaw: 0, n: 2 }, { x: 30.0, z: -5.0, yaw: 0.03, n: 2 }, { x: 19.6, z: -5.0, yaw: -0.02, n: 3 },
  ];
  const stackTops: Record<string, number> = {};
  stacks.forEach((st2, i) => { const { top } = blockStack(s4, st2.x, st2.z < -4 ? DECK : ROAD, st2.z, st2.yaw + Math.PI / 2, st2.n, 40 + i, st2.cover); stackTops["s" + i] = top; });
  toolBox(s4, 25.9, DECK, 4.5, 0.3); toolBox(s4, 20.2, DECK, 4.3, -0.2); toolBox(s4, 31.8, ROAD, 0.6, 1.2);
  tarpHeap(s4, 35.6, ROAD, 0.4, 0.4, "#5a7a4a"); tarpHeap(s4, 16.6, DECK, 4.4, -0.3, "#3c5a86");
  ropeBarrier(s4, [8.6, DECK, 6.3], [47.4, DECK, 6.3]); ropeBarrier(s4, [8.6, DECK, -6.3], [47.4, DECK, -6.3]);
  scaffold(s4, 30.2, 42.0, 7.5, 9.0, QY, 12.8);
  { const t = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 6.0), lam("lonScafTarp", () => ({ map: tarpTex("#4a6a8e"), side: THREE.DoubleSide }))); t.position.set(39.4, 7.6, 9.06); s4.add(t); }
  // ---------------- boats ----------------
  const crane = craneBarge(lon); crane.g.position.set(...BARGE);
  const restLocal = V(CRATE_REST[0] - BARGE[0], CRATE_REST[1], CRATE_REST[2] - BARGE[2]);
  // mooring lines from the crane barge to pier 3
  for (const [a, c] of [[[12.1, 1.6, 12.4], [9.8, 2.6, 8.6]], [[12.1, 1.6, 16.4], [9.2, 2.6, 8.9]]] as [V3, V3][]) { const A = V(...a), C = V(...c), m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, A.distanceTo(C), 5), lam("lonRopeM", () => ({ color: "#c2a46a" }))); m.position.copy(A.clone().add(C).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize()); lon.add(m); }
  const theTug = makeTug(lon), theLighter = makeLighter(lon, 15);
  const towRope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 5), lam("lonRopeM", () => ({ color: "#c2a46a" }))); lon.add(towRope);
  // ---------------- ambient: gulls, fog, mist ----------------
  const gulls = gullFlock(lon, 4, [-6, 17, 22], 11, "#b9c2e2");
  const banks = [fogBank(lon, [-8, 6, 75], 90, 0.32), fogBank(lon, [18, 5, 130], 120, 0.38), fogBank(lon, [-20, 7, -95], 100, 0.36), fogBank(lon, [25, 6, -160], 140, 0.4),
    fogBank(lon, [-62, 12, 70], 60, 0.3), fogBank(lon, [60, 12, -70], 60, 0.3), fogBank(lon, [-70, 14, -40], 70, 0.28), fogBank(lon, [70, 14, 40], 70, 0.28)];
  const wisps = [fogBank(lon, [-17, 0.9, 13], 10, 0.22, "#9aa6d6"), fogBank(lon, [3, 0.8, -15], 12, 0.2, "#9aa6d6"), fogBank(lon, [19, 0.7, 24], 9, 0.2, "#9aa6d6"), fogBank(lon, [-6, 0.8, 30], 11, 0.18, "#9aa6d6")];
  const wispBase = wisps.map((w) => w.position.clone());
  void banks;
  // ---------------- solid list ----------------
  LONDON_SOLIDS.length = 0;
  LONDON_SOLIDS.push(...br.SOLIDS);
  for (const s of [-1, 1]) { LONDON_SOLIDS.push([[s < 0 ? -170 : EMB, -1.5, -420], [s < 0 ? -EMB : 170, QY + 0.05, 420]]); LONDON_SOLIDS.push([[s < 0 ? -170 : 48, QY, -7.1], [s < 0 ? -48 : 170, DECK + 1.15, 7.1]]); }
  LONDON_SOLIDS.push([[LX0, -1.5, LZ0], [LX1, LY + 0.12, LZ1]], [[LX0, -1.5, LZ1], [-27.6, QY, LZ1 + NST * ST]]);
  LONDON_SOLIDS.push(...whSolids);
  LONDON_SOLIDS.push([[BARGE[0] - 6, -1, BARGE[2] - 2.6], [BARGE[0] + 6, 4.6, BARGE[2] + 2.6]]);
  LONDON_SOLIDS.push([[TX - 0.55, DECK, TZ - 0.4], [TX + 0.55, DECK + 0.8, TZ + 0.4]], [[TX - 2.4, DECK, TZ - 1.1], [TX - 1.3, DECK + 2.0, TZ - 0.1]]);
  // scene 4: stacks, scaffold (only present while c.later = 1), the landing lantern, the quay lamp posts
  for (const st2 of stacks) LONDON_SOLIDS.push([[st2.x - 0.7, ROAD, st2.z - 1.0], [st2.x + 0.7, DECK + 1.8, st2.z + 1.0]]);
  LONDON_SOLIDS.push([[30.1, QY, 7.4], [42.1, 12.9, 9.1]]);
  LONDON_SOLIDS.push([[-29.5, 3.4, 10.8], [-28.6, 4.5, 11.6]]);

  // ---------------- marks + cams ----------------
  const marks: Record<string, V3> = {
    inspector: [-27.05, LY, 10.2], ruler: [RULER[0], 0, RULER[2]], riverCam: [-20.6, 1.0, 14.6], riverWide: [3, 1.2, 30],
    boss: [TX + 1.0, DECK, TZ + 0.62], cityman: [TX - 1.0, DECK, TZ + 0.62], bossSeat: [TX + 0.95, DECK, TZ], citySeat: [TX - 0.95, DECK, TZ],
    cake: [TX, DECK + 0.78, TZ], priceBoard: [TX - 1.85, DECK, TZ - 0.55],
    ped1: [-6.4, DECK, 5.5], ped2: [-18.5, DECK, -5.3], ped3: [6.5, DECK, -5.0], busStop: [-1.7, DECK, -4.9],
    painter: [21.4, DECK, 4.35], boxLid: [25.0, DECK, 5.4], crateMan: [15.9, DECK, 4.5], paintPot: [21.9, DECK, 4.05],
    crateRest: [...CRATE_REST], crateHook: [CRATE_REST[0], CRATE_REST[1] + 2.0, CRATE_REST[2]],
    stairsTop: [-28.7, QY, LZ1 + NST * ST - 0.15], quayLamp: [-30.7, QY, 18.6],
  };
  const cams = {
    river: { pos: [-20.6, 1.0, 14.6] as V3, look: [-27.4, 3.0, 9.9] as V3, fov: 44 },          // low angle: ruler + inspector at pier 1
    twoShot: { pos: [-17.4, 13.4, 9.7] as V3, look: [-12.2, 11.1, 4.9] as V3, fov: 38 },    // over the parapet onto the deal table
    ots: { pos: [-16.2, 12.25, 6.25] as V3, look: [-12.0, 11.35, 5.55] as V3, fov: 38 },       // over the cityman's shoulder at the boss
    wide: { pos: [26, 7.5, 58] as V3, look: [-4, 7.5, 0] as V3, fov: 42 },                        // the bridge in fog from downstream
    riverLow: { pos: [3, 1.2, 30] as V3, look: [0, 7.2, 7] as V3, fov: 42 },                     // low river view of the FOR SALE banner
    high: { pos: [-3, 22, 17] as V3, look: [-12.5, 10.6, 4.8] as V3, fov: 40 },                  // high angle over the table + bus lane
    track0: { pos: [31.5, 12.1, 5.1] as V3, look: [15.0, 11.4, 5.4] as V3, fov: 40 },            // dismantling track start (scene 4)
    track1: { pos: [20.2, 12.0, 4.9] as V3, look: [10.5, 12.6, 8.2] as V3, fov: 42 },            // ... ends at the crate
  };
  // ---------------- pose ----------------
  let solo: { g: THREE.Group; br: OldBridge } | null = null;
  const tmp = new THREE.Vector3();
  return {
    name: "london", root, marks, cams,
    pose: (t, c) => {
      if ((c.solo ?? 0) > 0.5) {
        if (!solo) {
          const g = new THREE.Group(); root.add(g);
          const sand = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), lam("lonSoloSand", () => ({ color: "#e6c896" })));
          sand.receiveShadow = true; g.add(sand);
          solo = { g, br: oldBridge(g, { variant: "desert" }) };
        }
        solo.g.visible = true; lon.visible = false;
        solo.br.set({ built: c.built ?? 1, numbered: c.numbered ?? 0, lamps: c.lamps ?? 0, t });
        return;
      }
      if (solo) solo.g.visible = false;
      lon.visible = true;
      const dis = c.dismantle ?? 0, later = (c.later ?? (dis > 0 ? 1 : 0)) > 0.5, lamps = c.lamps ?? 1;
      sinkG.position.y = -0.12 * sm(c.sink ?? 0);
      br.set({ built: c.built ?? 1, numbered: c.numbered ?? (later ? 1 : 0), lamps, dismantle: dis, t });
      s3.visible = !later; { const bk = Math.max(0, Math.min(1, c.banner ?? 1)); bannerG.visible = !later && bk > 0.01; bannerG.scale.y = Math.max(0.01, bk); } s4.visible = later; staff.visible = (c.ruler ?? 0) > 0.5;
      // banner: a soft billow, tied along its top
      { const p = bannerG.geometry.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array;
        for (let i = 0; i < p.count; i++) { const x = banner.base[i * 3], y = banner.base[i * 3 + 1], dn = -y / 3.2; a[i * 3 + 2] = (0.05 + 0.1 * dn) * Math.sin(t * 1.3 + x * 0.9) + 0.06 * dn; a[i * 3 + 1] = y + 0.03 * dn * Math.sin(t * 0.9 + x); }
        p.needsUpdate = true; bannerG.geometry.computeVertexNormals(); }
      // bus
      const bu = c.bus ?? 0; theBus.g.visible = bu > 0.001 && bu < 0.999; theBus.g.position.set(-120 + 240 * bu, ROAD, -1.9);
      // tug + lighter heading upstream far downstream (slow)
      const tz = 96 - 0.55 * t; theTug.g.position.set(15, 0.05 * Math.sin(t * 0.9), tz); theTug.g.rotation.set(0.01 * Math.sin(t * 0.7), Math.PI / 2, 0.015 * Math.sin(t * 1.1));
      theLighter.position.set(15.5, 0.04 * Math.sin(t * 0.8 + 1), tz + 19); theLighter.rotation.y = Math.PI / 2 + 0.02 * Math.sin(t * 0.3);
      { const A = V(15, 1.0, tz + 5.6), C = V(15.5, 0.9, tz + 11.6); towRope.position.copy(A).add(C).multiplyScalar(0.5); towRope.scale.set(1, A.distanceTo(C), 1); towRope.quaternion.setFromUnitVectors(V(0, 1, 0), tmp.copy(C).sub(A).normalize()); }
      risePuffs(theTug.puffs, t, 3.2, 0.22, 2.2, 1);
      // crane barge: rocks gently; the crate (scene 4)
      crane.g.position.y = 0.04 * Math.sin(t * 0.8); crane.g.rotation.z = 0.006 * Math.sin(t * 0.6);
      crane.crate.visible = later; crane.hook.visible = true;
      crane.place(later ? cl(c.crate ?? 0) : 0.62, t, later ? restLocal : V(restLocal.x + 6, 6.0, restLocal.z + 6));
      // ambient
      gulls(t); flicker(landLamp, t); (landLamp.userData.light as THREE.PointLight).intensity *= lamps;
      wisps.forEach((w, i) => { w.position.set(wispBase[i].x + Math.sin(t * 0.05 + i) * 3 + t * 0.12, wispBase[i].y, wispBase[i].z + Math.cos(t * 0.04 + i * 2) * 2); (w.material as THREE.SpriteMaterial).opacity = 0.17 + 0.05 * Math.sin(t * 0.3 + i); });
      quayLamps.forEach((q, i) => { const f = 0.93 + 0.07 * Math.sin(t * 7 + i * 1.7) * Math.sin(t * 3.1 + i); (q.glow.material as THREE.SpriteMaterial).opacity = 0.8 * lamps * f; if (q.light) q.light.intensity = 7 * lamps * f; });
      refl.forEach((m, i) => { (m.material as THREE.MeshBasicMaterial).opacity = lamps * (0.75 + 0.25 * Math.sin(t * 2.3 + i * 1.9)); });
    },
  };
};
