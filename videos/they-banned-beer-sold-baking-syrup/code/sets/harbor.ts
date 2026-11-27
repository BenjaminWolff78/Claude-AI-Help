// "He Loosened His Boat's Ropes Before the Hurricane" (2026-11-26): ONE connected marina set. Local metres, y up, normal water y = 0.
//  THE MAIN PIER (fixed, Poly Haven modular_wooden_pier sections) along x at z -1.25..1.25, deck y 1.4, against the seawall (z 1.3).
//  SLIPS south of it (bow-in, bows toward +z): finger piers along z at x = 0, +-6.2, +-12.4 (z -1.25..-10.3).
//    THE NEIGHBOUR's white cruiser TIGHT SHIP in the slip x -3.1 (short black lines + a chain and a padlock to the pier cleats);
//    THE OLD GUY's blue wooden fishing boat SLACK TIDE in the slip x +3.1 (long yellow lines: ten feet of slack on each);
//    two more boats (all tied tight) in the slips x -9.3 / +9.3. Tall pilings at every slip corner; the tide gauge (feet) on the
//    piling x 1.35, z -10.55.
//  THE SHORE north of the seawall: land y 1.55 (parking + sand), the BAIT & ICE shack on stilts (porch y 3.4) x -9.6..-3.4,
//    the harbour flag pole with the two hurricane-warning flags, lamp posts, a picnic table, palms; the town beyond.
// Controls (pose c.*): level (water above normal, m; the surge peaks at 3.05 = ten feet), waveA (wave amplitude), storm 0..1
//  (rain, wind, foam, dark), hSwing 0..1 (the old guy's boat swings into the neighbour's railing), slam 0..1 (the dent + chips),
//  sink 0..1 (the neighbour's boat floods and goes down), heroSlack 0..1 (how much of the extra rope is let out: 0 = tight
//  as everyone's at first, 1 = ten more feet), knot 0..1 (the neighbour's double knot), chain 0..1, lock 0..1 (the padlock
//  snaps shut), noodle 0..1 (the pool noodle hung on his rail), cut 0..1 (the cutaway: the near water sliced away, the
//  section face shown), bucket 0..1 (the duck demo: water level in the clear bucket), hose 0/1, keyShow 0/1, lampsOn 0/1.
import * as THREE from "three";
import { phMat, phModel, boxM, planeM } from "../ph";
import type { SetDef, V3, Ctl } from "./types";
import { TAU, cl, sm, lerp, hsh, waveH, std, gloss, chrome, galv, glassDark, signTex, canvasTex, Rope, hang, hullGeo, deckGeo, rbox, tubeAlong, cleat, waterMesh, foamTex, wood, type HullSpec } from "./harborkit";

export const HB = {
  DECK: 1.4, LAND: 1.55, PORCH: 3.4, SURGE: 3.05, FOOT: 0.3048,
  HERO_C: [3.1, 0, -6.0] as V3, NBR_C: [-3.1, 0, -6.2] as V3, B3_C: [-9.3, 0, -6.0] as V3, B4_C: [9.3, 0, -6.1] as V3,
  GAUGE: [1.35, 0, -10.55] as V3,                       // the piling with the tide gauge (feet painted from the normal waterline)
  PORCH_X0: -9.6, PORCH_X1: -3.4, PORCH_Z0: 2.75, PORCH_Z1: 4.55,
  BUCKET: [3.55, 0, -7.6] as V3,                        // the duck demo, boat-local on the old guy's aft deck (x, -, z)
};
export const HERO_H: HullSpec = { L: 8.4, B: 2.9, fb: 0.95, bowRise: 0.5, draft: 0.75, deckDrop: 0.34, stern: 0.84 };
export const NBR_H: HullSpec = { L: 9.0, B: 3.0, fb: 1.15, bowRise: 0.35, draft: 0.7, deckDrop: 0.32, stern: 0.92 };
const B3_H: HullSpec = { L: 7.4, B: 2.6, fb: 0.9, bowRise: 0.4, draft: 0.6, deckDrop: 0.3, stern: 0.86 };
const B4_H: HullSpec = { L: 7.8, B: 2.7, fb: 1.0, bowRise: 0.36, draft: 0.65, deckDrop: 0.3, stern: 0.9 };
export type BoatK = "hero" | "nbr" | "b3" | "b4";
const SPEC: Record<BoatK, { H: HullSpec; C: V3; tight: boolean }> = {
  hero: { H: HERO_H, C: HB.HERO_C, tight: false }, nbr: { H: NBR_H, C: HB.NBR_C, tight: true }, b3: { H: B3_H, C: HB.B3_C, tight: true }, b4: { H: B4_H, C: HB.B4_C, tight: true },
};
const gunAt = (H: HullSpec, s: number) => H.fb + H.bowRise * s * s;
const halfAt = (H: HullSpec, s: number) => s < 0.5 ? (H.B / 2) * (H.stern + (1 - H.stern) * Math.sin((s / 0.5) * Math.PI / 2)) : (H.B / 2) * Math.pow(Math.cos(((s - 0.5) / 0.5) * Math.PI / 2), 0.7);
/** boat-local cleat points: bow port/starboard, stern port/starboard (on the gunwale) */
export const cleatsOf = (k: BoatK): V3[] => {
  const H = SPEC[k].H, sb = 0.86, ss = 0.06, zb = -H.L / 2 + sb * H.L, zs = -H.L / 2 + ss * H.L;
  const wb = halfAt(H, sb) * 0.72, ws = halfAt(H, ss) * 0.8;
  return [[wb, gunAt(H, sb) + 0.02, zb], [-wb, gunAt(H, sb) + 0.02, zb], [ws, gunAt(H, ss) + 0.02, zs], [-ws, gunAt(H, ss) + 0.02, zs]];
};
/** the deck floor height of a boat at a local z (for standing marks) */
export const deckY = (k: BoatK, z: number) => { const H = SPEC[k].H, s = (z + H.L / 2) / H.L; return gunAt(H, s) - H.deckDrop; };
/** the pier / piling tie points of each boat's four lines (set coordinates) */
const TIE: Record<BoatK, V3[]> = {
  nbr: [[-2.15, 1.5, -1.12], [-4.05, 1.5, -1.12], [-1.15, 1.5, -9.7], [-5.05, 1.5, -9.7]],
  hero: [[4.05, 1.5, -1.12], [2.15, 1.5, -1.12], [4.85, 4.35, -10.55], [1.35, 4.35, -10.55]],
  b3: [[-8.35, 1.5, -1.12], [-10.25, 1.5, -1.12], [-7.35, 1.5, -9.7], [-11.25, 1.5, -9.7]],
  b4: [[10.25, 1.5, -1.12], [8.35, 1.5, -1.12], [11.25, 1.5, -9.7], [7.35, 1.5, -9.7]],
};
/** the extra rope beyond the resting distance (m): the old guy lets out ten more feet on the bow lines */
const extraOf = (k: BoatK, i: number, c: Ctl) => k === "hero" ? (i < 2 ? 0.12 + 3.05 * (c.heroSlack ?? 1) : 0.6 + 0.8 * (c.heroSlack ?? 1)) : 0.1;
// resting cleat positions (level 0, no waves) -> rope lengths
const rest = (k: BoatK, i: number): V3 => { const p = cleatsOf(k)[i], C = SPEC[k].C; return [C[0] + p[0], p[1], C[2] + p[2]]; };
const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const REST_D: Record<BoatK, number[]> = { hero: [0, 1, 2, 3].map((i) => dist3(rest("hero", i), TIE.hero[i])), nbr: [0, 1, 2, 3].map((i) => dist3(rest("nbr", i), TIE.nbr[i])), b3: [0, 1, 2, 3].map((i) => dist3(rest("b3", i), TIE.b3[i])), b4: [0, 1, 2, 3].map((i) => dist3(rest("b4", i), TIE.b4[i])) };
export const ropeLen = (k: BoatK, i: number, c: Ctl) => REST_D[k][i] + extraOf(k, i, c);

export type BoatX = { pos: V3; rx: number; ry: number; rz: number; pin: number };
/** where a boat is (pure: the shots call it for the people standing on the decks) */
export const boatX = (k: BoatK, t: number, c: Ctl): BoatX => {
  const S = SPEC[k], L = c.level ?? 0, A = c.waveA ?? 0.06, storm = c.storm ?? 0, C = S.C;
  let x = C[0], z = C[2], ry = 0;
  if (k === "hero") {
    const hs = c.hSwing ?? 0; x += -2.85 * hs + storm * 0.32 * Math.sin(0.9 * t + 0.4) * (1 - hs); ry = 0.16 * hs + storm * 0.07 * Math.sin(0.7 * t + 1.2) * (1 - hs);
    z += storm * 0.25 * Math.sin(0.6 * t);
  } else ry = storm * 0.025 * Math.sin(0.8 * t + C[0]);
  const w = waveH(x, z, t, A), wf = waveH(x, z + 2.5, t, A), wb = waveH(x, z - 2.5, t, A), wl = waveH(x + 1.2, z, t, A), wr = waveH(x - 1.2, z, t, A);
  let pitch = -(wf - wb) / 5 * 0.8, roll = (wl - wr) / 2.4 * 0.6;
  let y = L + w * 0.85, pin = 0;
  if (S.tight) {
    // the bow lines are short: the bow cleat can rise only to Hb; past that the boat pitches nose-down about its stern
    const Lr = ropeLen(k, 0, c), cb = cleatsOf(k)[0], tie = TIE[k][0], horiz = Math.hypot(C[0] + cb[0] - tie[0], C[2] + cb[2] - tie[2]);
    const Hb = tie[1] + Math.sqrt(Math.max(0, Lr * Lr - horiz * horiz));
    const sink = k === "nbr" ? (c.sink ?? 0) : (c.sinkB ?? 0), yf = y;
    const zs = -S.H.L / 2 + 0.5, zb = cb[2], hb = cb[1], R = Math.hypot(zb - zs, hb), ph0 = Math.atan2(hb, zb - zs);
    const yfree = y, drop = sink * (k === "nbr" ? 4.6 : 3.2);
    const need = yfree + hb - Hb;   // how far the free-floating bow cleat would rise above what its line allows
    if (need > 0) {
      const th = Math.max(0, Math.min(0.62, ph0 + Math.asin(cl((yfree - Hb) / R, -1, 1))));
      pitch += th; pin = cl(need / 1.5);
      y = yfree + zs * Math.sin(th) - drop;   // the stern stays on the water (origin = stern point minus its rotated offset), then it floods down
    } else y = yfree - drop;
    void yf;
    roll += 0.16 * pin * (k === "nbr" ? 1 : -1) + storm * 0.04 * Math.sin(1.1 * t + C[0]) + (k === "nbr" ? -(c.jolt ?? 0) * 0.16 : 0);
  } else roll += storm * 0.06 * Math.sin(1.3 * t);
  return { pos: [x, y, z], rx: pitch, ry, rz: roll, pin };
};
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();
/** a boat-local point in set coordinates */
export const onBoat = (k: BoatK, p: V3, t: number, c: Ctl): V3 => {
  const b = boatX(k, t, c); _e.set(b.rx, b.ry, b.rz, "YXZ"); _q.setFromEuler(_e); _v.set(p[0], p[1], p[2]).applyQuaternion(_q);
  return [b.pos[0] + _v.x, b.pos[1] + _v.y, b.pos[2] + _v.z];
};
/** a person's feet on a boat deck at boat-local (x, z) */
export const onDeck = (k: BoatK, x: number, z: number, t: number, c: Ctl): V3 => onBoat(k, [x, deckY(k, z), z], t, c);

// =============================================================== the set =========================================================
export const harbor = (): SetDef => {
  const root = new THREE.Group(); root.name = "harbor";
  const add = <T extends THREE.Object3D>(o: T, p: V3 = [0, 0, 0], yaw = 0): T => { o.position.set(...p); o.rotation.y = yaw; root.add(o); return o; };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: V3 = [0, 0, 0], cast = true) => { const me = new THREE.Mesh(g, m); me.position.set(...p); me.castShadow = cast; me.receiveShadow = true; root.add(me); return me; };
  const anim: ((t: number, c: Ctl, light: string) => void)[] = [];

  // ------------------------------------------------------------ water, seabed --------------------------------------------------
  const W = waterMesh(420, 220); root.add(W.mesh);
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 11.3);   // keeps z > -11.3 (the near water is sliced away in the cutaway)
  const sand = phMat("damp_beach_sand", 1 / 4, 1 / 4, { tint: "#8a8070" });
  mesh(planeM(80, 60, 1, 1).rotateX(-Math.PI / 2), sand, [0, -3.1, -20], false);
  // the cutaway face: a lit blue section of the water in front of the slips
  const faceMat = new THREE.MeshPhysicalMaterial({ color: "#2a7f95", roughness: 0.15, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide });
  const face = mesh(new THREE.PlaneGeometry(1, 1), faceMat, [0, 0, -11.3], false); face.visible = false; face.renderOrder = 2;
  const faceEdge = mesh(new THREE.BoxGeometry(1, 0.05, 0.06), std("#d8f2f8", 0.3, 0, { emissive: "#7ad0e0", emissiveIntensity: 0.4 }), [0, 0, -11.3], false); faceEdge.visible = false;
  const seabed = mesh(boxM(64, 0.6, 12), sand, [0, -3.4, -5.4], false); seabed.visible = false;

  // ------------------------------------------------------------ the main pier + fingers (Poly Haven sections) ------------------
  const SEC_TOP = 3.61, SEC_DY = HB.DECK - SEC_TOP;
  const secs = ["section_02", "section_03", "section_04"];
  for (let i = 0; i < 12; i++) { const s = phModel("modular_wooden_pier", { filt: secs[i % 3] }); add(s, [-16.06 + i * 2.92, SEC_DY, 0], Math.PI / 2); }
  for (const fx of [-12.4, -6.2, 0, 6.2, 12.4]) for (let j = 0; j < 3; j++) { const s = phModel("modular_wooden_pier", { filt: secs[(j + 1) % 3] }); add(s, [fx, SEC_DY, -2.75 - j * 2.92], 0); }
  // tall pilings at every slip corner (round, weathered, a galvanised cap); tie points for the long lines
  const pileM = phMat("rough_wood", 1, 1, { tint: "#8c7a66" }), capM = galv();
  const pileAt = (x: number, z: number, top = 4.6) => {
    const g = new THREE.CylinderGeometry(0.165, 0.18, top + 3.2, 18, 1); const uvs = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * 1.1, uvs.getY(i) * (top + 3.2) / 1.6);
    mesh(g, pileM, [x, (top - 3.2) / 2, z]);
    mesh(new THREE.ConeGeometry(0.2, 0.16, 18), capM, [x, top + 0.08, z]);
    // barnacles / dark tide band near the old waterline
    mesh(new THREE.CylinderGeometry(0.182, 0.19, 0.7, 18, 1, true), std("#3e3a30", 0.95), [x, 0.05, z], false);
  };
  for (const fx of [-12.4, -6.2, 0, 6.2, 12.4]) for (const side of [-1.35, 1.35]) { if (Math.abs(fx + side) > 13.8) continue; pileAt(fx + side, -10.55); }
  // cleats on the pier edge and the finger ends
  const gm = galv();
  for (const k of ["nbr", "hero", "b3", "b4"] as BoatK[]) TIE[k].forEach((p, i) => { if (p[1] > 2) return; const c = add(cleat(gm), [p[0], HB.DECK + 0.07, p[2] + (i < 2 ? 0 : 0)], i < 2 ? 0 : Math.PI / 2); void c; });
  // the tide gauge: a white board in feet on the gauge piling, facing the slips' open water (south-east)
  const gaugeT = canvasTex("gauge_ft", 160, 1600, (g) => {
    g.fillStyle = "#f2efe6"; g.fillRect(0, 0, 160, 1600); g.strokeStyle = "#20242c"; g.lineWidth = 8; g.strokeRect(4, 4, 152, 1592);
    for (let f = 0; f <= 12; f++) {
      const y = 1600 - 40 - f * 128;
      g.fillStyle = f % 2 ? "#d22a2a" : "#20242c"; g.fillRect(8, y - 6, 70, 12);
      for (let q = 1; q < 4; q++) g.fillRect(8, y - 3 - q * 32, 36, 6);
      g.font = '900 86px "DejaVu Sans", Arial'; g.textAlign = "right"; g.textBaseline = "middle"; g.fillStyle = f % 2 ? "#d22a2a" : "#20242c"; g.fillText(String(f), 150, y - 8);
    }
  });
  const gauge = mesh(new THREE.PlaneGeometry(0.3, 3.0), std("#ffffff", 0.6, 0, { map: gaugeT }), [0, 0, 0], false);
  // 0 ft at y = 0 (normal water): 128 canvas px per foot, the 0 line 40 px above the canvas bottom
  gauge.geometry = new THREE.PlaneGeometry(0.3, 1600 * (HB.FOOT / 128)); gauge.position.set(HB.GAUGE[0] + 0.13, 760 * (HB.FOOT / 128), HB.GAUGE[2] - 0.13); gauge.rotation.y = Math.PI * 0.75;

  // ------------------------------------------------------------ the seawall, the land, the shack ---------------------------------
  const conc = phMat("concrete_floor_02", 1 / 2.2, 1 / 2.2, { tint: "#b8b2a6" });
  mesh(boxM(90, 4.75, 0.6), conc, [0, HB.LAND - 2.375, 1.55]);
  mesh(boxM(90, 0.14, 0.7), phMat("concrete_pavement", 1 / 2, 1 / 2, { tint: "#cfc8bc" }), [0, HB.LAND + 0.06, 1.6]);
  const asph = phMat("asphalt_02", 1 / 5, 1 / 5, { tint: "#8a8784" });
  mesh(planeM(90, 26).rotateX(-Math.PI / 2), asph, [0, HB.LAND, 14.8], false);
  mesh(planeM(90, 40).rotateX(-Math.PI / 2), phMat("coast_sand_01", 1 / 5, 1 / 5, { tint: "#c4b49a" }), [0, HB.LAND - 0.02, 47], false);
  // parking lines
  for (let i = 0; i < 9; i++) mesh(new THREE.PlaneGeometry(0.1, 4.6).rotateX(-Math.PI / 2), std("#e8e4d8", 0.8), [4 + i * 2.7, HB.LAND + 0.012, 12], false);
  // the bait shack on stilts (porch y 3.4) facing the slips
  const sid = phMat("weathered_plank_siding", 1 / 2.4, 1 / 2.4, { tint: "#9cc4d4" }), trim = std("#f2ede2", 0.7), roofM = phMat("rusty_corrugated_iron", 1 / 1.6, 1 / 1.6, { tint: "#b8a090" });
  const P = HB.PORCH, X0 = HB.PORCH_X0, X1 = HB.PORCH_X1, xc = (X0 + X1) / 2;
  for (const sx of [X0 + 0.2, xc, X1 - 0.2]) for (const sz of [HB.PORCH_Z0 + 0.15, 6.4, 9.2]) mesh(boxM(0.22, P - HB.LAND, 0.22), pileM, [sx, (P + HB.LAND) / 2, sz]);
  mesh(boxM(X1 - X0, 0.22, 9.6 - HB.PORCH_Z0), wood(1 / 2.5, 1 / 2.5, "#a89070"), [xc, P - 0.11, (9.6 + HB.PORCH_Z0) / 2]);
  mesh(boxM(X1 - X0 - 0.4, 2.9, 5.0), sid, [xc, P + 1.45, 7.05]);
  { const rg = new THREE.BoxGeometry(X1 - X0 + 0.9, 0.08, 6.6); const r = mesh(rg, roofM, [xc, P + 3.15, 6.2]); r.rotation.x = -0.12; }
  // front wall details: door, two windows (lit at night), the BAIT & ICE sign
  const winLit = std("#ffd9a0", 0.4, 0, { emissive: "#ffb25e", emissiveIntensity: 0 });
  const wins = [mesh(new THREE.PlaneGeometry(1.2, 0.9), winLit, [X0 + 1.2, P + 1.65, 4.53], false), mesh(new THREE.PlaneGeometry(1.2, 0.9), winLit, [X1 - 1.4, P + 1.65, 4.53], false)]; wins.forEach((w) => (w.rotation.y = Math.PI));
  for (const w of wins) { mesh(boxM(1.34, 0.08, 0.08), trim, [w.position.x, P + 1.16, 4.58]); mesh(boxM(1.34, 0.08, 0.08), trim, [w.position.x, P + 2.14, 4.58]); }
  mesh(boxM(0.95, 2.05, 0.06), std("#5a3a2a", 0.8), [xc + 0.2, P + 1.03, 4.53]);
  const baitT = signTex("baitice", 1024, 256, "#1f3c5a", "#f4ecd8", [{ t: "BAIT & ICE", s: 150, y: 128 }], "#f4ecd8");
  mesh(new THREE.PlaneGeometry(3.6, 0.9), std("#ffffff", 0.7, 0, { map: baitT }), [xc, P + 2.62, 4.52], false).rotation.y = Math.PI;
  // porch railing + posts + stairs down to the lot
  const rail = std("#e8e2d4", 0.75);
  for (let i = 0; i <= 8; i++) mesh(boxM(0.08, 1.0, 0.08), rail, [X0 + 0.1 + i * (X1 - X0 - 0.2) / 8, P + 0.5, HB.PORCH_Z0 + 0.05]);
  mesh(boxM(X1 - X0, 0.08, 0.1), rail, [xc, P + 1.0, HB.PORCH_Z0 + 0.05]); mesh(boxM(X1 - X0, 0.06, 0.06), rail, [xc, P + 0.5, HB.PORCH_Z0 + 0.05]);
  for (const sx of [X0 + 0.12, X1 - 0.12]) mesh(boxM(0.14, 2.9, 0.14), rail, [sx, P + 1.45, HB.PORCH_Z0 + 0.06]);
  for (let i = 0; i < 9; i++) mesh(boxM(1.1, 0.06, 0.3), wood(1, 1, "#9a8466"), [X1 + 0.65, HB.LAND + 0.2 + i * (P - HB.LAND) / 9, 3.0 + i * 0.27]);
  // the hurricane warning notice on the porch post + a life ring on the wall + crates, a barrel and an ice chest on the porch
  const warnT = signTex("hwarn", 512, 640, "#f6f0e0", "#1a1a1a", [{ t: "HURRICANE", s: 74, y: 90, c: "#c41f1f" }, { t: "WARNING", s: 74, y: 170, c: "#c41f1f" }, { t: "SECURE ALL", s: 56, y: 300 }, { t: "VESSELS", s: 56, y: 370 }, { t: "HARBOR OFFICE", s: 34, y: 520, font: "700" }], "#c41f1f");
  mesh(new THREE.PlaneGeometry(0.62, 0.78), std("#ffffff", 0.75, 0, { map: warnT }), [X1 - 0.12, P + 1.75, HB.PORCH_Z0 - 0.03], false).rotation.y = Math.PI;
  add(phModel("lifebuoy", { s: 1.0 }), [X0 + 2.4, P + 1.7, 4.6]);
  add(phModel("wooden_crate_01", { h: 0.55 }), [X0 + 0.6, P, 4.1]); add(phModel("wooden_crate_02", { h: 0.45 }), [X0 + 0.65, P + 0.55, 4.1], 0.3);
  add(phModel("Barrel_01", { h: 0.88 }), [X0 + 1.5, P, 3.95]); add(phModel("plastic_crate_01", { h: 0.35 }), [X1 - 0.9, P, 4.15], 0.5);
  add(phModel("folding_wooden_stool", { h: 0.6 }), [X1 - 1.6, P, 3.7]);
  // ------------------------------------------------------------ the flag pole with two hurricane-warning flags ----------------
  const pole = mesh(new THREE.CylinderGeometry(0.06, 0.09, 9, 12), std("#e8e8e8", 0.5, 0.3), [7.6, HB.LAND + 4.5, 4.2]); void pole;
  const flagT = canvasTex("hflag", 128, 128, (g) => { g.fillStyle = "#d42020"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#151515"; g.fillRect(40, 40, 48, 48); });
  const flagG = new THREE.PlaneGeometry(1.1, 1.1, 10, 4); flagG.translate(0.55, 0, 0);
  const flags: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) { const f = mesh(flagG.clone(), std("#ffffff", 0.85, 0, { map: flagT, side: THREE.DoubleSide }), [7.66, HB.LAND + 8.3 - i * 1.35, 4.2], false); flags.push(f); }
  const flagBase = flags.map((f) => (f.geometry.attributes.position.array as Float32Array).slice());
  anim.push((t, c) => {
    const wind = 0.6 + 1.4 * (c.storm ?? 0);
    flags.forEach((f, i) => {
      const a = f.geometry.attributes.position as THREE.BufferAttribute, b = flagBase[i];
      for (let k = 0; k < a.count; k++) { const x = b[k * 3]; a.setZ(k, Math.sin(x * 4.2 - t * 7 * wind + i) * 0.09 * x * wind); a.setY(k, b[k * 3 + 1] - 0.04 * x * x * (1.5 - wind * 0.5)); }
      a.needsUpdate = true; f.geometry.computeVertexNormals(); f.rotation.y = -0.6 + 0.15 * Math.sin(t * 0.8 + i);
    });
  });
  // lamps (street lamps with a warm point light at night), a picnic table, a trash can, rocks, palms
  const lamps: THREE.PointLight[] = [];
  for (const [lx, lz] of [[1.6, 2.4], [-12.6, 2.4], [12.4, 2.4]]) {
    add(phModel("street_lamp_01", { h: 3.9 }), [lx, HB.LAND, lz], Math.PI);
    const pl = new THREE.PointLight("#ffb86a", 0, 16, 1.6); pl.position.set(lx, HB.LAND + 3.6, lz - 0.35); root.add(pl); lamps.push(pl);
  }
  { // a dock lamp on a bracket at the top of the gauge post (lights the gauge and the sterns at night; clear of the swinging boats)
    const gx = HB.GAUGE[0], gz = HB.GAUGE[2], ly = 4.95;
    mesh(boxM(0.5, 0.05, 0.05), std("#3a3a3a", 0.5, 0.4), [gx + 0.22, ly + 0.12, gz - 0.12]);
    mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.22, 12), std("#2a2a2a", 0.5, 0.3), [gx + 0.45, ly, gz - 0.22]);
    mesh(new THREE.SphereGeometry(0.1, 12, 8), std("#fff2d0", 0.3, 0, { emissive: "#ffcf80", emissiveIntensity: 2 }), [gx + 0.45, ly - 0.14, gz - 0.22], false);
    const dl = new THREE.PointLight("#ffc880", 0, 14, 1.4); dl.position.set(gx + 0.5, ly - 0.3, gz - 0.45); root.add(dl); lamps.push(dl); }
  const flashL = new THREE.DirectionalLight("#dfe8ff", 0); flashL.position.set(-20, 60, -40); root.add(flashL); flashL.target.position.set(0, 0, -5); root.add(flashL.target);
  const porchL = new THREE.PointLight("#ffbf78", 0, 9, 1.6); porchL.position.set(xc, P + 2.4, 3.4); root.add(porchL); lamps.push(porchL);
  add(phModel("wooden_picnic_table", { h: 0.78 }), [4.6, HB.LAND, 6.0], 0.2); add(phModel("metal_trash_can", { h: 0.95 }), [2.6, HB.LAND, 3.0]);
  add(phModel("wooden_barrels_01", { h: 1.0 }), [-1.6, HB.LAND, 3.4], 0.5); add(phModel("metal_jerrycan", { h: 0.45 }), [-0.9, HB.LAND, 2.6], 1.2);
  add(phModel("utility_box_01", { h: 1.1 }), [-11.2, HB.LAND, 3.6], 0.0); add(phModel("painted_wooden_bench", { h: 0.85 }), [9.6, HB.LAND, 3.2], Math.PI);
  const palms: THREE.Group[] = [];
  for (const [px, pz, h, r] of [[-15.5, 5.5, 5.2, 0.3], [11.5, 7.5, 4.6, 2.1], [15.8, 4.2, 5.6, 4.4], [-1.5, 8.5, 4.4, 1.0]]) { const p = add(phModel("island_tree_02", { h }), [px, HB.LAND, pz], r); palms.push(p); }
  anim.push((t, c) => { const wd = 0.012 + 0.06 * (c.storm ?? 0); palms.forEach((p, i) => { p.rotation.z = wd * Math.sin(t * (1.6 + 0.9 * (c.storm ?? 0)) + i * 1.7); p.rotation.x = wd * 0.6 * Math.sin(t * 1.3 + i); }); });
  add(phModel("coast_rocks_01", { s: 0.34 }), [-30, -0.4, -6], 0.4); add(phModel("coast_rocks_02", { s: 0.3 }), [30, -0.5, -8], 2.2);
  add(phModel("boulder_01", { h: 1.2 }), [-17.5, HB.LAND - 0.3, 2.6], 0.4);
  // ------------------------------------------------------------ the town beyond the lot, the headland and the light -------------
  const house = (x: number, z: number, w: number, d: number, h: number, colr: string, yaw: number) => {
    const g = new THREE.Group(); g.position.set(x, HB.LAND, z); g.rotation.y = yaw; root.add(g);
    const body = new THREE.Mesh(boxM(w, h, d), phMat("weathered_plank_siding", 1 / 2.4, 1 / 2.4, { tint: colr })); body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.62, 1.6, 4, 1), std("#6a5650", 0.9)); roof.rotation.y = Math.PI / 4; roof.scale.z = d / w; roof.position.y = h + 0.8; roof.castShadow = true; g.add(roof);
    for (const wx of [-w / 4, w / 4]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), winLit); wn.position.set(wx, h * 0.6, -d / 2 - 0.01); wn.rotation.y = Math.PI; g.add(wn); }
  };
  [[-14, 20, 7, 6, 4.2, "#e8c49a", 0.05], [-5, 23, 6, 6, 4.6, "#b8d4c8", -0.04], [5, 22, 7, 6, 3.8, "#f0e0b8", 0.0], [15, 21, 6.5, 6, 4.4, "#c8b8d8", 0.06], [24, 24, 6, 6, 4, "#e4b0a0", -0.1], [-24, 24, 6, 6, 4.2, "#a8c0dc", 0.1]]
    .forEach(([x, z, w, d, h, c, y]) => house(x as number, z as number, w as number, d as number, h as number, c as string, y as number));
  for (let i = 0; i < 5; i++) { const x = -24 + i * 12; mesh(new THREE.CylinderGeometry(0.11, 0.14, 8, 10), pileM, [x, HB.LAND + 4, 17.5]); mesh(boxM(1.8, 0.12, 0.12), pileM, [x, HB.LAND + 7.4, 17.5]); }
  // the lighthouse on the far breakwater + the channel marker + a buoy
  { const lx = 46, lz = -70; mesh(new THREE.CylinderGeometry(1.4, 2.2, 14, 24), std("#f0ede6", 0.6), [lx, 7, lz]);
    for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(1.42 - i * 0.18 + 0.02, 1.62 - i * 0.18, 2, 24, 1, true), std("#c42828", 0.6), [lx, 2.5 + i * 4.2, lz], false);
    mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.6, 16), glassDark(), [lx, 14.8, lz]); mesh(new THREE.ConeGeometry(1.3, 1.2, 16), std("#2a2a2a", 0.5), [lx, 16.2, lz]);
    add(phModel("coast_rocks_02", { s: 0.5 }), [lx - 6, -0.8, lz + 4], 1.0); }
  const marker = add(phModel("lateral_sea_marker", { h: 4.5 }), [-15, -1.0, -30], 0.4);
  const buoy = add(phModel("ocean_buoy", { h: 1.8 }), [9, -0.6, -26], 0.0);
  anim.push((t, c) => { const L = c.level ?? 0, A = c.waveA ?? 0.06; marker.position.y = L - 1.0 + waveH(-15, -30, t, A) * 0.9; marker.rotation.z = 0.05 * Math.sin(t * 1.1) * (1 + 3 * (c.storm ?? 0)); buoy.position.y = L - 0.6 + waveH(9, -26, t, A); buoy.rotation.x = 0.08 * Math.sin(t * 1.4) * (1 + 3 * (c.storm ?? 0)); });

  // ------------------------------------------------------------ the boats --------------------------------------------------------
  type BoatObj = { k: BoatK; g: THREE.Group; ropes: Rope[] };
  const boats: BoatObj[] = [];
  const nameT = (txt: string, bg: string, fg: string) => signTex("name_" + txt, 1024, 200, bg, fg, [{ t: txt, s: 120, y: 104, font: "900 italic" }]);
  const makeBoat = (k: BoatK) => {
    const S = SPEC[k], H = S.H, g = new THREE.Group(); g.name = "boat_" + k; root.add(g);
    const hero = k === "hero", nbr = k === "nbr";
    const top = hero ? "#ffffff" : nbr ? "#ffffff" : k === "b3" ? "#f0e6d0" : "#e8eef2";
    const hm = hero ? phMat("blue_painted_planks", 1 / 1.4, 1 / 1.4, { tint: "#a8c4e0", rough: 0.75, key: "herohull" }) : gloss(nbr ? "#eeeeea" : top, nbr ? 1 : 0.5, nbr ? 0.18 : 0.35);
    (hm as THREE.MeshStandardMaterial).vertexColors = true;
    const { g: hg, halfW, gun } = hullGeo(H, hero ? "#ffffff" : top, hero ? "#2a2a30" : nbr ? "#1c2c5a" : "#3a5a8a", hero ? "#a8302a" : "#2a3a5c");
    const hull = new THREE.Mesh(hg, hm); hull.castShadow = hull.receiveShadow = true; g.add(hull);
    const dm = hero ? phMat("weathered_planks", 1 / 1.2, 1 / 1.2, { tint: "#c8b090" }) : std(nbr ? "#e8e2d6" : "#d8d2c4", 0.6);
    const dk = new THREE.Mesh(deckGeo(H, halfW, gun), dm); dk.receiveShadow = true; dk.castShadow = true; g.add(dk);
    // rub rail along the sheer
    const sheer: V3[] = [], sheer2: V3[] = [];
    for (let i = 0; i <= 18; i++) { const s = 0.02 + (i / 18) * 0.95, z = -H.L / 2 + s * H.L, w = halfW(s) + 0.02; sheer.push([w, gun(s) - 0.05, z]); sheer2.push([-w, gun(s) - 0.05, z]); }
    const rr = hero ? std("#3a2a20", 0.6) : nbr ? std("#1c2c5a", 0.4) : std("#5a5a5a", 0.5);
    g.add(tubeAlong(sheer, 0.045, rr)); g.add(tubeAlong(sheer2, 0.045, rr));
    // name on the transom
    const nm = hero ? "SLACK TIDE" : nbr ? "TIGHT SHIP" : k === "b3" ? "REEL DEAL" : "SEAS THE DAY";
    const tr = new THREE.Mesh(new THREE.PlaneGeometry(H.B * 0.66, H.B * 0.13), std("#ffffff", 0.6, 0, { map: nameT(nm, hero ? "#ffffff" : top, hero ? "#1e4a8a" : nbr ? "#1c2c5a" : "#2a4a6a"), transparent: false }));
    tr.position.set(0, H.fb * 0.62, -H.L / 2 - 0.012); tr.rotation.y = Math.PI; g.add(tr);
    if (hero) {
      // the wheelhouse: plank walls, white trim, windows, a door with the brass key on red string, roof, mast, radar, light
      const wy = H.fb + 0.4 * 0.36 - H.deckDrop, wz = 0.9;
      const wh = new THREE.Mesh(rbox(1.9, 1.75, 2.1, 0.05), phMat("distressed_painted_planks", 1 / 1.4, 1 / 1.4, { tint: "#f4f0e6" })); wh.position.set(0, wy + 0.875, wz); wh.castShadow = wh.receiveShadow = true; g.add(wh);
      for (const [x, z, ry, w] of [[0, wz + 1.06, 0, 1.6], [0.96, wz + 0.3, Math.PI / 2, 1.1], [-0.96, wz + 0.3, -Math.PI / 2, 1.1]] as [number, number, number, number][]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.62), glassDark()); wn.position.set(x, wy + 1.25, z); wn.rotation.y = ry; g.add(wn); }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.45), std("#2a3a4a", 0.7)); door.position.set(0.35, wy + 0.76, wz - 1.06); door.rotation.y = Math.PI; g.add(door);
      const roof = new THREE.Mesh(rbox(2.15, 0.1, 2.4, 0.03), std("#1e4a8a", 0.55)); roof.position.set(0, wy + 1.8, wz - 0.05); roof.castShadow = true; g.add(roof);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 10), std("#e8e4da", 0.5)); mast.position.set(0, wy + 3.1, wz - 0.4); g.add(mast);
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), std("#e8e4da", 0.5)); yard.rotation.z = Math.PI / 2; yard.position.set(0, wy + 3.7, wz - 0.4); g.add(yard);
      const radar = new THREE.Mesh(rbox(0.7, 0.12, 0.18, 0.04), std("#f0f0f0", 0.4)); radar.position.set(0, wy + 2.05, wz + 0.4); g.add(radar);
      const lampG = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), std("#fff2d0", 0.3, 0, { emissive: "#ffd28a", emissiveIntensity: 0.0 })); lampG.position.set(0, wy + 4.45, wz - 0.4); g.add(lampG); lampG.name = "mastLamp";
      // stern gear: tyres hung as fenders, a wooden bucket, crates, a coiled rope, a life ring on the wheelhouse
      for (const [x, z] of [[1.42, -1.2], [1.42, 1.0], [-1.42, -1.2], [-1.42, 1.0]] as [number, number][]) { const ty = phModel("old_tyre", { s: 1.0 }); ty.position.set(x, H.fb - 0.35, z); ty.rotation.y = Math.PI / 2; g.add(ty); }
      const bk = phModel("wooden_bucket_01", { h: 0.36 }); bk.position.set(0.85, deckY("hero", -1.6), -1.6); g.add(bk);
      const cr = phModel("plastic_crate_01", { h: 0.33 }); cr.position.set(0.7, deckY("hero", -3.3), -3.3); cr.rotation.y = 0.3; g.add(cr);
      const lb = phModel("lifebuoy", { s: 0.8 }); lb.position.set(0.97, wy + 1.0, wz - 0.4); lb.rotation.y = Math.PI / 2; g.add(lb);
      const boots = phModel("rubber_boots", { h: 0.42 }); boots.position.set(-0.8, deckY("hero", -1.0), -1.0); boots.rotation.y = 0.8; g.add(boots);
      const ch = phModel("folding_wooden_stool", { h: 0.55 }); ch.position.set(0.2, deckY("hero", -2.1), -2.1); g.add(ch);
      // the Loophole Key: a brass key on a loop of red string, hanging on a hook by the wheelhouse door
      const key = new THREE.Group(); key.name = "loopKey";
      key.add(tubeAlong([[0, 0, 0], [-0.05, -0.08, 0], [0, -0.16, 0], [0.05, -0.08, 0], [0, 0, 0]], 0.006, std("#c41f1f", 0.7), false));
      const kb = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 14), std("#c8a040", 0.3, 0.9)); kb.position.set(0, -0.19, 0); key.add(kb);
      const ks = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.07, 0.006), std("#c8a040", 0.3, 0.9)); ks.position.set(0, -0.25, 0); key.add(ks);
      key.position.set(-0.25, wy + 1.55, wz - 1.065); g.add(key);
    } else if (nbr) {
      // the cruiser: a sleek cabin with a raked windscreen, dark glass band, a flybridge with a chrome rail, a radar arch
      const cy0 = H.fb - H.deckDrop + 0.02;
      const prof = new THREE.Shape(); prof.moveTo(-0.6, 0); prof.lineTo(3.0, 0); prof.lineTo(2.4, 0.55); prof.lineTo(1.2, 1.25); prof.lineTo(-0.6, 1.3); prof.closePath();
      const cab = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3 }), gloss("#eeeeea", 1, 0.2));
      cab.geometry.translate(0, 0, -1.1); cab.rotation.y = -Math.PI / 2; cab.position.set(0, cy0, 0); cab.castShadow = cab.receiveShadow = true; g.add(cab);
      const band = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-0.4, 0.62); s.lineTo(2.2, 0.62); s.lineTo(1.25, 1.12); s.lineTo(-0.4, 1.15); s.closePath(); return s; })(), { depth: 2.3, bevelEnabled: false }), glassDark());
      band.geometry.translate(0, 0, -1.15); band.rotation.y = -Math.PI / 2; band.position.set(0, cy0, 0); g.add(band);
      const fly = new THREE.Mesh(rbox(2.2, 0.5, 2.2, 0.08), gloss("#eeeeea", 1, 0.2)); fly.position.set(0, cy0 + 1.55, -0.1); fly.castShadow = true; g.add(fly);
      const rpts: V3[] = [[-1.05, cy0 + 2.2, -1.1], [-1.05, cy0 + 2.2, 0.9], [1.05, cy0 + 2.2, 0.9], [1.05, cy0 + 2.2, -1.1]];
      g.add(tubeAlong(rpts, 0.022, chrome()));
      for (const p of rpts) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 8), chrome()); st.position.set(p[0], p[1] - 0.2, p[2]); g.add(st); }
      g.add(tubeAlong([[-1.25, cy0 + 1.3, -1.6], [-1.15, cy0 + 2.9, -1.55], [0, cy0 + 3.1, -1.5], [1.15, cy0 + 2.9, -1.55], [1.25, cy0 + 1.3, -1.6]], 0.05, gloss("#eeeeea", 1, 0.2)));
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 1.4, 6), std("#f0f0f0", 0.4)); ant.position.set(0.6, cy0 + 3.6, -1.5); g.add(ant);
      // bow rail (chrome) on stanchions + white fenders
      const br: V3[] = []; for (let i = 0; i <= 10; i++) { const s = 0.5 + i * 0.047, z = -H.L / 2 + s * H.L, w = halfW(s) * 0.9; br.push([w, gun(s) + 0.5, z]); }
      const brL = br.map(([x, y, z]) => [-x, y, z] as V3).reverse();
      g.add(tubeAlong([...brL, ...br.slice(1)], 0.02, chrome()));
      for (let i = 0; i <= 10; i += 2) for (const sg of [1, -1]) { const s = 0.5 + i * 0.047, st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), chrome()); st.position.set(sg * halfW(s) * 0.9, gun(s) + 0.25, -H.L / 2 + s * H.L); g.add(st); }
      for (const z of [-2.2, 0.0, 2.0]) for (const sg of [1, -1]) { const fd = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 4, 12), gloss("#f4f4f4", 0.6, 0.3)); fd.position.set(sg * (halfW((z + H.L / 2) / H.L) + 0.12), H.fb - 0.45, z); g.add(fd); }
      // the deck chair + a cooler on the aft deck
      const chair = phModel("plastic_monobloc_chair_01", { h: 0.8 }); chair.position.set(0.5, deckY("nbr", -3.3), -3.3); chair.rotation.y = 2.6; g.add(chair);
    } else {
      // generic boats: a centre console / small cabin + a T-top
      const cy0 = H.fb - H.deckDrop;
      const con = new THREE.Mesh(rbox(1.2, 1.0, 1.0, 0.06), gloss(k === "b3" ? "#f0e6d0" : "#e8eef2", 0.5, 0.3)); con.position.set(0, cy0 + 0.5, 0.2); con.castShadow = true; g.add(con);
      const tt = new THREE.Mesh(rbox(1.8, 0.08, 1.8, 0.03), std(k === "b3" ? "#2a6a4a" : "#8a2a2a", 0.6)); tt.position.set(0, cy0 + 2.1, 0.0); tt.castShadow = true; g.add(tt);
      for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), chrome()); p.position.set(x, cy0 + 1.3, z); g.add(p); }
    }
    // the boat's own cleats
    for (const p of cleatsOf(k)) { const c = cleat(gm); c.position.set(...p); c.position.y -= 0.02; c.rotation.y = Math.PI / 2; g.add(c); }
    // the four lines
    const ropeM = hero ? std("#f2c21b", 0.75, 0, { emissive: "#3a2a00", emissiveIntensity: 0.15 }) : std("#1c1c1e", 0.8);
    const ropes = [0, 1, 2, 3].map(() => { const r = new Rope(28, hero ? 0.024 : 0.02, ropeM); root.add(r.mesh); return r; });
    boats.push({ k, g, ropes });
    return g;
  };
  (["hero", "nbr", "b3", "b4"] as BoatK[]).forEach(makeBoat);
  const heroG = boats[0].g, nbrG = boats[1].g;
  const handRope = new Rope(16, 0.024, std("#f2c21b", 0.75, 0, { emissive: "#3a2a00", emissiveIntensity: 0.15 })); root.add(handRope.mesh);
  const handRopeN = new Rope(12, 0.02, std("#1c1c1e", 0.8)); root.add(handRopeN.mesh);
  const mastLamp = heroG.getObjectByName("mastLamp") as THREE.Mesh;
  const cabinL = new THREE.PointLight("#ffc888", 0, 7, 1.6); cabinL.position.set(0, 2.0, 0.5); heroG.add(cabinL);

  // the neighbour's chain (galvanised links) along his starboard bow line, and the brass padlock on the pier cleat
  const linkG = new THREE.TorusGeometry(0.035, 0.011, 6, 12); linkG.scale(1.5, 1, 1);
  const NL = 26, links = new THREE.InstancedMesh(linkG, galv(), NL); links.castShadow = true; root.add(links);
  const lock = new THREE.Group(); root.add(lock);
  { const body = new THREE.Mesh(rbox(0.085, 0.07, 0.035, 0.012), std("#c8a040", 0.28, 0.95)); lock.add(body); const sh = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 16, Math.PI), std("#c8ccd2", 0.2, 1)); sh.position.y = 0.035; sh.name = "shackle"; lock.add(sh); }
  // the double knot: a fat knot bump on the starboard bow line at the pier cleat
  const knotM = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), std("#1c1c1e", 0.8)); knotM.scale.set(1.3, 1, 1); root.add(knotM);

  // the pool noodle (bright lime) hung along his port rail, with a cardboard "CAPT. NOODLE" tag
  const noodleM = std("#86e03a", 0.6, 0, { emissive: "#2a5a00", emissiveIntensity: 0.12 });
  const noodle = new THREE.Group(); heroG.add(noodle);
  { const pts: V3[] = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([1.25 - 0.1 * Math.sin(u * Math.PI), HERO_H.fb + 0.05 - 0.35 * (u < 0.15 ? (0.15 - u) / 0.15 : u > 0.85 ? (u - 0.85) / 0.15 : 0), -2.8 + u * 2.4]); }
    const nt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, 0.035, 10), noodleM); nt.castShadow = true; noodle.add(nt);
    const tagT = signTex("noodletag", 512, 256, "#c8a878", "#2a1a10", [{ t: "CAPT.", s: 80, y: 80, font: "900" }, { t: "NOODLE", s: 96, y: 180, font: "900" }]);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.23), std("#ffffff", 0.9, 0, { map: tagT, side: THREE.DoubleSide })); tag.position.set(1.5, HERO_H.fb - 0.12, -1.6); tag.rotation.y = Math.PI / 2 + 0.9; tag.rotation.z = 0.06; noodle.add(tag); }

  // the duck demo (on his aft deck): a clear bucket, the water rising in it, a brick, a short string, a yellow rubber duck;
  // a green hose nozzle in a sweater sleeve + ball hand pouring a stream into it
  const demo = new THREE.Group(); heroG.add(demo);
  const DZ = -3.0, DX = -0.5, dy0 = deckY("hero", DZ);
  demo.position.set(DX, dy0, DZ);
  const BR = 0.17, BH = 0.34;
  { const bm = new THREE.MeshPhysicalMaterial({ color: "#e8f4ff", roughness: 0.05, transmission: 0, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 });
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(BR, BR * 0.86, BH, 32, 1, true), bm); bucket.position.y = BH / 2; bucket.renderOrder = 3; demo.add(bucket);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(BR, 0.008, 8, 32), std("#dfe8f0", 0.3)); rim.rotation.x = Math.PI / 2; rim.position.y = BH; demo.add(rim);
    const brick = new THREE.Mesh(rbox(0.12, 0.05, 0.07, 0.01), std("#a8442e", 0.9)); brick.position.y = 0.025; demo.add(brick); }
  const dWater = new THREE.Mesh(new THREE.CylinderGeometry(BR * 0.97, BR * 0.84, 1, 32), new THREE.MeshPhysicalMaterial({ color: "#58b4d0", roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false })); dWater.renderOrder = 2; demo.add(dWater);
  const duck = new THREE.Group(); demo.add(duck);
  { const y = std("#ffd21a", 0.35); const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), y); b.scale.set(1.25, 0.8, 1); duck.add(b);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.031, 14, 10), y); hd.position.set(0.04, 0.045, 0); duck.add(hd);
    const bill = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 8), std("#ff8a1a", 0.4)); bill.rotation.z = -Math.PI / 2; bill.position.set(0.075, 0.042, 0); duck.add(bill);
    for (const z of [-0.016, 0.016]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), std("#111111", 0.3)); e.position.set(0.062, 0.055, z); duck.add(e); } }
  const dStr = new Rope(8, 0.003, std("#f4f0e0", 0.8), 4); demo.add(dStr.mesh);
  const hose = new THREE.Group(); demo.add(hose);
  { const nz = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.16, 12), std("#2a8a3a", 0.5)); nz.rotation.z = 1.0; hose.add(nz);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.5, 14), std("#24304e", 0.85)); sleeve.rotation.z = 1.25; sleeve.position.set(0.32, 0.16, 0); hose.add(sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), std("#241726", 0.6)); hand.position.set(0.08, 0.04, 0); hose.add(hand);
    const tube = tubeAlong([[0.06, 0.03, 0], [0.4, 0.0, 0.1], [0.7, -0.25, 0.25], [0.9, -0.5, 0.2]], 0.014, std("#2a8a3a", 0.6)); hose.add(tube); }
  hose.position.set(-0.08, BH + 0.2, 0.0);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 1, 10, 1, true), new THREE.MeshPhysicalMaterial({ color: "#bfe8f4", roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false })); demo.add(stream);

  // ------------------------------------------------------------ foam at every piling, whitecaps, rain, gulls --------------------
  const fT = foamTex(), fm = new THREE.MeshBasicMaterial({ color: "#f4f8fc", map: fT, transparent: true, depthWrite: false, opacity: 0.6 });
  const piles: [number, number][] = []; for (const fx of [-12.4, -6.2, 0, 6.2, 12.4]) for (const side of [-1.35, 1.35]) { if (Math.abs(fx + side) > 13.8) continue; piles.push([fx + side, -10.55]); }
  const foamI = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2), fm, piles.length); foamI.renderOrder = 1; root.add(foamI);
  const rainM = new THREE.MeshBasicMaterial({ color: "#c8d8ee", transparent: true, opacity: 0.38, depthWrite: false });
  rainM.onBeforeCompile = (sh) => {   // streaks fade out within 4 m of the lens (a streak on the lens read as a white bar)
    sh.vertexShader = "varying float vRd;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n  vRd = -mvPosition.z;");
    sh.fragmentShader = "varying float vRd;\n" + sh.fragmentShader.replace("#include <opaque_fragment>", "diffuseColor.a *= smoothstep(2.5, 6.0, vRd);\n#include <opaque_fragment>");
  };
  const RN = 4200, rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.007, 0.5, 0.007), rainM, RN);
  rain.frustumCulled = false; rain.renderOrder = 4; root.add(rain);
  const rainSeed = Array.from({ length: RN }, (_, i) => [hsh(i) * 34 - 17, hsh(i + 7.1) * 16, hsh(i + 3.3) * 34 - 26, 0.8 + hsh(i + 1.9) * 0.5]);
  // the final splash: 90 real 3D droplets thrown up from where the sea closes over the roof, plus a spreading foam disc
  const SPN = 240, spl = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), std("#eef8ff", 0.25, 0, { emissive: "#9fd8f0", emissiveIntensity: 0.25 }), SPN);
  spl.frustumCulled = false; spl.castShadow = false; root.add(spl);
  const splV = Array.from({ length: SPN }, (_, i) => { const a = hsh(i + 0.5) * TAU, h = 1.2 + 3.4 * hsh(i + 9.1); return [Math.cos(a) * h * 1.3, 5.0 + 8.0 * Math.pow(hsh(i + 4.4), 0.7), Math.sin(a) * h * 1.3, 0.06 + 0.12 * hsh(i + 2.2)]; });
  const splFoam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#f4fbff", map: foamTex(), transparent: true, depthWrite: false })); splFoam.renderOrder = 2; root.add(splFoam);
  const gulls: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const gg = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), std("#f4f4f2", 0.6)); body.scale.set(0.8, 0.7, 2.2); gg.add(body);
    for (const sgn of [1, -1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.012, 0.18), std("#e8e8e4", 0.6)); w.geometry.translate(sgn * 0.28, 0, 0); w.name = "w" + sgn; const tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.013, 0.12), std("#2a2a2e", 0.6)); tip.position.set(sgn * 0.5, 0, 0.02); w.add(tip); gg.add(w); }
    root.add(gg); gulls.push(gg);
  }

  // ------------------------------------------------------------ pose ------------------------------------------------------------
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sx = new THREE.Vector3(), Px = new THREE.Vector3(), E = new THREE.Euler();
  let clipOn = false;
  const pose = (t: number, c: Ctl, light = "hbEve") => {
    const L = c.level ?? 0, A = c.waveA ?? 0.06, storm = c.storm ?? 0, night = light === "hbStorm" ? 1 : 0;
    W.mesh.position.y = L; W.U.uTime.value = t; W.U.uAmp.value = A;
    W.normalTex.offset.set((t * 0.018) % 1, (t * 0.011) % 1);
    W.mat.normalScale.setScalar(0.8 + 0.6 * storm);
    W.U.uDeep.value.set(night ? "#06141c" : light === "hbDawn" ? "#124454" : "#0f3a48"); W.U.uShallow.value.set(night ? "#123440" : light === "hbDawn" ? "#2a7888" : "#1e6070");
    W.U.uEnvK.value = night ? 0.34 : 0.72; W.mat.roughness = night ? 0.2 : 0.11;
    // the cutaway
    const cut = c.cut ?? 0;
    const wantClip = cut > 0; if (wantClip !== clipOn) { W.mat.clippingPlanes = wantClip ? [cutPlane] : []; W.mat.needsUpdate = true; clipOn = wantClip; }
    face.visible = faceEdge.visible = seabed.visible = cut > 0;
    if (cut > 0) { const cz = c.cutZ ?? -11.3, top = L + 0.02 + waveH(0, cz, t, A), bot = -3.1; cutPlane.constant = -cz; face.position.z = cz; faceEdge.position.z = cz;
      face.scale.set(64, top - bot, 1); face.position.y = (top + bot) / 2; faceMat.opacity = 0.7 * cut; faceEdge.scale.x = 64; faceEdge.position.y = top; seabed.position.z = cz + 6; }
    // boats + their lines
    for (const b of boats) {
      const x = boatX(b.k, t, c); b.g.position.set(...x.pos); E.set(x.rx, x.ry, x.rz, "YXZ"); b.g.quaternion.setFromEuler(E);
      const cl4 = cleatsOf(b.k).map((p) => onBoat(b.k, p, t, c));
      b.ropes.forEach((r, i) => {
        const tie = TIE[b.k][i], Lr = ropeLen(b.k, i, c), floor = L + 0.03 + waveH(tie[0], tie[2], t, A);
        const held = c.hx !== undefined && (c.hk ?? 0) === (b.k === "hero" ? 0 : b.k === "nbr" ? 1 : -1) && (c.hr ?? 0) === i;
        if (held) {
          // the line runs from the boat's cleat to the person's hand, then hangs from the hand down to the pier cleat
          const H3: V3 = [c.hx!, c.hy!, c.hz!], dT = dist3(H3, [tie[0], tie[1] + 0.06, tie[2]]);
          r.set(hang(cl4[i], H3, Math.max(dist3(cl4[i], H3) + 0.02, Lr - dT), 28, floor));
          (b.k === "hero" ? handRope : handRopeN).set(hang(H3, [tie[0], tie[1] + 0.06, tie[2]], dT * 1.08 + 0.05, b.k === "hero" ? 16 : 12, floor));
        } else r.set(hang(cl4[i], [tie[0], tie[1] + 0.06, tie[2]], Lr, 28, floor));
      });
    }
    handRope.mesh.visible = c.hx !== undefined && (c.hk ?? 0) === 0; handRopeN.mesh.visible = c.hx !== undefined && (c.hk ?? 0) === 1;
    // the neighbour's chain (on his starboard bow line, cleat 0) + padlock + knot
    { const cb = onBoat("nbr", cleatsOf("nbr")[0], t, c), tie = TIE.nbr[0], chainK = c.chain ?? 1;
      const n = Math.round(NL * chainK);
      for (let i = 0; i < NL; i++) {
        const u = (i + 0.5) / NL, p: V3 = [lerp(tie[0], cb[0], u), lerp(tie[1] + 0.07, cb[1], u), lerp(tie[2], cb[2], u)];
        const dir = new THREE.Vector3(cb[0] - tie[0], cb[1] - tie[1], cb[2] - tie[2]).normalize();
        Q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir); const q2 = new THREE.Quaternion().setFromAxisAngle(dir, i % 2 ? Math.PI / 2 : 0);
        Q.premultiply(q2); Sx.setScalar(i < n ? 1 : 0.0001); Px.set(p[0], p[1], p[2]); M4.compose(Px, Q, Sx); links.setMatrixAt(i, M4);
      }
      links.instanceMatrix.needsUpdate = true;
      const lk = c.lock ?? 1; lock.position.set(tie[0] + 0.12, tie[1] + 0.08, tie[2] - 0.02); lock.visible = (c.chain ?? 1) > 0.5;
      const sh = lock.getObjectByName("shackle") as THREE.Mesh; sh.position.y = 0.035 + 0.03 * (1 - lk); sh.rotation.y = (1 - lk) * 0.9;
      const kn = c.knot ?? 1; knotM.visible = kn > 0.01; knotM.scale.set(1.3 * kn, kn, kn); knotM.position.set(TIE.nbr[1][0], TIE.nbr[1][1] + 0.12, TIE.nbr[1][2] - 0.05); }
    // noodle, key, demo
    noodle.visible = (c.noodle ?? 0) > 0.01; noodle.position.y = 0.25 * (1 - sm(c.noodle ?? 0, 0, 1)) ; noodle.position.x = 0.1 * (1 - (c.noodle ?? 0));
    demo.visible = (c.bucket ?? -1) >= 0;
    if (demo.visible) {
      const k = c.bucket ?? 0, wl = 0.02 + k * (BH - 0.04);
      dWater.scale.y = Math.max(0.002, wl); dWater.position.y = Math.max(0.001, wl) / 2;
      const SL = 0.15, dy = Math.min(wl - 0.012 + 0.006 * Math.sin(t * 3), 0.05 + SL);   // the string holds the duck under once the water passes 0.2
      duck.position.set(0.02 * Math.sin(t * 1.7), dy, 0.01 * Math.cos(t * 2.1)); duck.rotation.z = 0.08 * Math.sin(t * 2.3) + (wl > 0.05 + SL + 0.02 ? 0.25 : 0);
      { const pts: V3[] = []; const ex = duck.position.x, ez = duck.position.z, ey = dy - 0.025, taut = wl > 0.05 + SL;
        for (let i = 0; i < 8; i++) { const u = i / 7; pts.push([ex * u + (taut ? 0 : 0.02 * Math.sin(u * Math.PI)), 0.05 + (ey - 0.05) * u, ez * u]); }
        dStr.set(pts); }
      hose.visible = (c.hose ?? 1) > 0.5; stream.visible = hose.visible && k < 0.995;
      const top = BH + 0.16, sl = top - wl; stream.scale.y = Math.max(0.01, sl); stream.position.set(-0.11, wl + sl / 2, 0.0);
    }
    (heroG.getObjectByName("loopKey") as THREE.Object3D).visible = (c.keyShow ?? 1) > 0.5;
    (heroG.getObjectByName("loopKey") as THREE.Object3D).rotation.z = 0.15 * Math.sin(t * 1.6) * (1 + 3 * storm);
    // foam rings, rain, gulls, lamps
    piles.forEach(([x, z], i) => { M4.compose(Px.set(x, L + 0.015 + waveH(x, z, t, A), z), Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t * 0.3 + i), Sx.setScalar(0.9 + 0.6 * storm + 0.1 * Math.sin(t * 2 + i))); foamI.setMatrixAt(i, M4); });
    foamI.instanceMatrix.needsUpdate = true; fm.opacity = 0.26 + 0.4 * storm;
    rain.visible = storm > 0.5;
    if (rain.visible) {
      const fall = 14, wind = 3.2;
      for (let i = 0; i < RN; i++) { const s = rainSeed[i], y = ((s[1] - t * fall * s[3]) % 16 + 16) % 16; Px.set(s[0] + wind * (y / fall) - 2, y, s[2]); Q.setFromEuler(E.set(0, 0, -0.22)); Sx.set(1, 1, 1); M4.compose(Px, Q, Sx); rain.setMatrixAt(i, M4); }
      rain.instanceMatrix.needsUpdate = true; (rain.material as THREE.MeshBasicMaterial).opacity = 0.32 * storm;
    }
    gulls.forEach((g, i) => { g.visible = !night && storm < 0.2; const a = t * (0.18 + 0.03 * i) + i * 1.6, r = 9 + i * 2.5;
      g.position.set(Math.cos(a) * r + (i - 1.5) * 3, 7.5 + i * 0.8 + Math.sin(t * 0.7 + i), Math.sin(a) * r * 0.6 - 8); g.rotation.y = -a + Math.PI; g.rotation.z = 0.25 * Math.sin(a);
      const fl = Math.sin(t * 7 + i * 2) * 0.55; (g.getObjectByName("w1") as THREE.Mesh).rotation.z = fl; (g.getObjectByName("w-1") as THREE.Mesh).rotation.z = -fl; });
    const on = (c.lampsOn ?? night) > 0.5 ? 1 : 0;
    lamps.forEach((l, i) => { l.intensity = on * (i >= 3 ? 10 : 14) * (0.92 + 0.08 * Math.sin(t * 13 + i * 3)); });
    winLit.emissiveIntensity = on * 1.6 + (light === "hbEve" ? 0.25 : 0);
    cabinL.intensity = on * 5; (mastLamp.material as THREE.MeshStandardMaterial).emissiveIntensity = on * 2.5;
    flashL.intensity = 7 * (c.flash ?? 0);
    { const age = c.bsAge ?? -1, bx = c.bsx ?? 0, bz = c.bsz ?? 0; spl.visible = splFoam.visible = age >= 0 && age < 2.2;
      if (spl.visible) {
        for (let i = 0; i < SPN; i++) { const v = splV[i], tt = Math.max(0, age - hsh(i + 7.7) * 0.12), y = L + v[1] * tt - 4.9 * tt * tt;
          const sc = y < L - 0.05 ? 0.0001 : v[3] * (1 - 0.3 * tt); Px.set(bx + v[0] * tt, Math.max(y, L), bz + v[2] * tt); M4.compose(Px, Q.identity(), Sx.set(sc, sc * 1.8, sc)); spl.setMatrixAt(i, M4); }
        spl.instanceMatrix.needsUpdate = true;
        const r = 1.6 + 6.5 * Math.sqrt(age); splFoam.position.set(bx, L + 0.03, bz); splFoam.scale.set(r, 1, r); (splFoam.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - age * 0.4);
      } }
    for (const f of anim) f(t, c, light);
  };

  // ------------------------------------------------------------ marks + cams -----------------------------------------------------
  const marks: Record<string, V3> = {
    nbrPierKneel: [-2.4, HB.DECK, -0.5], heroAft: [3.1, 0, -8.3], porchA: [-6.0, HB.PORCH, 3.4], porchB: [-4.4, HB.PORCH, 3.6],
  };
  const cams: SetDef["cams"] = {
    overview: { pos: [12, 9, -22], look: [0, 1.5, -4], fov: 50 },
    slips: { pos: [0.2, 3.2, -17], look: [0, 1.6, -5], fov: 46 },
    shack: { pos: [-2, 4.5, -8], look: [-6.5, 4.2, 4.5], fov: 46 },
  };
  return {
    name: "harbor", root, marks, cams, pose: pose as SetDef["pose"],
    env: { hbEve: { hdri: "small_harbour_sunset", i: 0.55 }, hbStorm: { hdri: "rogland_moonlit_night", i: 0.6 }, hbDawn: { hdri: "small_harbour_morning", i: 0.6 } },
    sunW: { hbEve: [-0.35, 0.2, -0.92], hbStorm: [0.4, 0.62, 0.68], hbDawn: [0.75, 0.22, -0.62] },
  };
};
void TAU;
