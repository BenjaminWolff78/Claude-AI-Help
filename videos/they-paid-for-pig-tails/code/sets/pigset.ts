// "They Paid for Pig Tails and Got a Pig Farm" (2026-11-25, master prompt v28). ORIGINAL set from REAL CC0 Poly Haven
// assets (photo-textured splat ground, thinned real pines / oaks + impostor cards for the far woods, grass, weeds,
// dandelions) + code-modelled shed, boards, fence, gate, corn, pickup and props. Local metres, y up. A Georgia clearing.
//  P1 THE BOUNTY SHED (home base) at the origin: plank shed x -4..4, z 0..4 (front wall z 0 faces -z, onto the lot).
//     Front, from +x (screen LEFT when the camera looks +z) to -x: the TAIL WALL x 1.5..3.9, the PRICE BOARD x -0.45..1.35
//     (newspaper below it), the COUNTER WINDOW x -2.6..-0.6 (counter shelf outside, awning propped up), the door
//     x -3.7..-2.9; the BASE HOG CONTROL sign over the window; the PIGS SEEN flip board on a post at x -5.
//     The gravel lot x -8..9, z -15..0 (the pickup parks at x 5, z -7.5); the corn FIELD x -44..-9; the back yard
//     z 4..9 (the ranger's chalk on the back wall, x -3.1..0); the ranch fence x 9 (z -15..9) with the BACK GATE
//     (hinge z -5.6, latch z -3.1) and z 9 behind the yard. Tall weeds + dandelions along the inside of the x 9 fence.
//  P3 THE HILLSIDE: the meadow beyond the gate, rising toward +x (15 m by x 70), oaks, woods on its flanks.
//  P2 THE WOODS ROAD: leaves the lot at z -15 and runs south (-z) through the pines to z -125 (roadX(z)).
import * as THREE from "three";
import { ctex } from "../paint";
import { glow } from "../setkit";
import { phModel, phMat, boxM, planeM, type PhModel } from "../ph";
import { MB, TAU, cl, sm, lerp, hsh, col, mat, cylM } from "./mailkit";
import { pickup } from "./pickup";
import { priceTex, seenTex, hogSignTex, paperTex, wantedTex, chalkTex, CHALK, tailGeo, tailMat, mower, padlock, fence, farmGate, cornGeo, cornMat, phInst, splatGround, herd, impostor, forest, pineTree, pineLOD, pineImpMat } from "./pigkit";
import type { SetDef, V3, Ctl } from "./types";

const FL = 0.12;
/** the woods road's centre line (x) for z < -15 */
export const roadX = (z: number) => (z > -15 ? 1.5 : 1.5 + 3.4 * Math.sin((-15 - z) * 0.042) + 1.2 * Math.sin((-15 - z) * 0.011));
export const hfPig = (x: number, z: number) => {
  const hill = x > 9.3 ? 15 * sm((x - 11) / 62) + 0.8 * Math.sin(z * 0.07 + x * 0.04) * sm((x - 16) / 14) + 0.22 * sm((x - 9.3) / 2.5) : 0;
  let w = 0;
  if (z < -16) { const d = Math.abs(x - roadX(z)); w = (0.5 * Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.08) + 0.35 * Math.sin(x * 0.05 - z * 0.03) + 0.3) * sm((d - 2.6) / 6) * sm((-16 - z) / 6); }
  if (z > 10) w += (z - 10) * 0.05 * sm((z - 10) / 4) + 0.4 * Math.sin(x * 0.09) * sm((z - 12) / 6);
  if (x < -46) w += (0.5 * Math.sin(z * 0.1) + 0.3) * sm((-46 - x) / 6);
  return hill + w;
};
export const PG0 = {
  FL,
  // the shed front
  WIN: [-1.6, FL, 0] as V3, COUNTER_Y: 1.06, INSIDE: [-1.9, 0.42, 0.62] as V3, CTR_TAIL: [-1.62, 1.075, -0.27] as V3, OUTSIDE: [-1.55, 0, -0.62] as V3,
  PRICE: [0.45, 1.86, -0.035] as V3, PAPER: [0.51, 0.8, -0.03] as V3, TAILW: { x0: 1.5, x1: 3.9, y0: 0.5, y1: 2.5 }, HOGSIGN: [-1.6, 2.4, -0.04] as V3,
  SEEN: [-5.0, 1.62, -0.8] as V3, BULB: [-1.6, 2.5, -0.42] as V3, DOOR: [-3.3, FL, -0.1] as V3,
  // the back
  CHALK: [-1.55, 1.3, 4.112] as V3, CHALK_W: 3.1, CHALK_H: 1.94, RANGER: [-1.2, 0, 4.62] as V3, CORNER: [-4.15, 0, 4.25] as V3,
  // the lot, fence, gate
  TRUCK: [7.8, 0, 3.0] as V3, ENTRANCE: [1.5, 0, -15] as V3, GATE_HINGE: [9.0, 0, -5.6] as V3, GATE_W: 2.4, LOCK: [9.06, 1.0, -3.24] as V3,
  QUEUE: [[-1.55, 0, -0.75], [-1.3, 0, -1.75], [-0.8, 0, -2.7], [-0.1, 0, -3.6], [0.6, 0, -4.6], [1.1, 0, -5.7], [1.4, 0, -6.9], [1.5, 0, -8.2], [1.5, 0, -9.6]] as V3[],
  WEEDS: { x0: 7.2, x1: 8.75, z0: -14.2, z1: -6.6 },
  // the woods road marks
  BOAR_Z: -27.5, POSTER_Z: -44, SOW_Z: -62,
};
const NAIL_ORDER = (() => { const L: [number, number, number][] = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 28; c++) L.push([r, c, Math.hypot((c - 13.5) * 0.085, (r - 3) * 0.29) + hsh(r * 28 + c, 11) * 0.06]); return L.sort((a, b) => a[2] - b[2]); })();
export const tailSlot = (i: number): { p: V3; rz: number } => {
  const W = PG0.TAILW, cols = 28, nail = Math.floor(i / 5), k = i % 5, [r, c] = NAIL_ORDER[Math.min(nail, NAIL_ORDER.length - 1)];
  const x = W.x0 + 0.04 + (c + (r % 2) * 0.5) * ((W.x1 - W.x0 - 0.1) / cols) + (hsh(nail, 4) - 0.5) * 0.02, y = W.y1 - r * 0.29 + (hsh(nail, 7) - 0.5) * 0.03;
  return { p: [x + (k - 2) * 0.006, y, -0.03 - k * 0.004], rz: (k - 2) * 0.16 + (hsh(i, 9) - 0.5) * 0.12 };
};
export const TAIL_N = 980;

export const pigset = (): SetDef => {
  const root = new THREE.Group(); root.name = "pigset";
  const mb = new MB();
  const add = (o: THREE.Object3D, p: V3, yaw = 0) => { o.position.set(...p); o.rotation.y = yaw; root.add(o); return o; };
  const ph = (n: PhModel, p: V3, yaw = 0, o: { h?: number; s?: number; filt?: string; env?: number; noCast?: boolean } = {}) => add(phModel(n, { center: true, ...o }), p, yaw);
  const hf = hfPig;

  // ===================== THE GROUND =====================
  const B = { x0: -76, x1: 132, z0: -132, z1: 62, nx: 208, nz: 194 };
  const road = (g: CanvasRenderingContext2D, px: (x: number, z: number) => [number, number], s: number, w: number) => { g.lineWidth = w * s; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); for (let z = -12; z >= -131; z -= 1.5) { const [a, b] = px(roadX(z), z); if (z === -12) g.moveTo(a, b); else g.lineTo(a, b); } g.stroke(); };
  const rect = (g: CanvasRenderingContext2D, px: (x: number, z: number) => [number, number], x0: number, z0: number, x1: number, z1: number) => { const [a, b] = px(x0, z0), [c, d] = px(x1, z1); g.fillRect(a, b, c - a, d - b); };
  const blots = (g: CanvasRenderingContext2D, px: (x: number, z: number) => [number, number], s: number, n: number, seed: number, area: (r: () => number) => [number, number], rmin: number, rmax: number) => { let k = seed * 9301; const r = () => { k = (k * 16807) % 2147483647; return k / 2147483647; }; for (let i = 0; i < n; i++) { const [x, z] = area(r), [a, b] = px(x, z); g.beginPath(); g.ellipse(a, b, (rmin + r() * (rmax - rmin)) * s, (rmin + r() * (rmax - rmin)) * s * (0.6 + r() * 0.8), r() * 3, 0, TAU); g.fill(); } };
  splatGround(root, B, hf, [
    { name: "leafy_grass", tile: 2.6, tint: "#d8e0a8" },
    { name: "forest_leaves_02", tile: 3.2, tint: "#e8dcc8" },
    { name: "withered_grass", tile: 3.5, tint: "#f0e4c4" },
    { name: "farm_soil", tile: 3.2, tint: "#f0dcc4" },
    { name: "raked_dirt", tile: 2.4, tint: "#e8d0b4" },
    { name: "gravel_road", tile: 2.6, tint: "#f2e8d8" },
    { name: "muddy_tracks", tile: 3.6, tint: "#f0d4b0" },
  ], [
    // 1 forest floor: the woods south (off the road), north and west
    (g, px, s) => { g.filter = `blur(${3 * s}px)`; rect(g, px, -76, -132, 132, -18.5); rect(g, px, -76, 12.5, 132, 62); rect(g, px, -76, -132, -47, 62); g.fillStyle = "#000"; g.filter = `blur(${2 * s}px)`; road(g, px, s, 5.6); rect(g, px, 12, -60, 132, 9); },
    // 2 withered grass patches (meadow + hill + lot edges)
    (g, px, s) => { g.filter = `blur(${2.5 * s}px)`; blots(g, px, s, 90, 3, (r) => [9 + r() * 100, -55 + r() * 100], 1.5, 6); blots(g, px, s, 30, 5, (r) => [-9 + r() * 18, -17 + r() * 30], 1, 3); },
    // 3 farm soil: the field
    (g, px, s) => { g.filter = `blur(${1.2 * s}px)`; rect(g, px, -44, -15, -9.6, 9.6); },
    // 4 raked dirt: the hogs' rooting in the field + a few holes at the woods edge
    (g, px, s) => { g.filter = `blur(${1.0 * s}px)`; blots(g, px, s, 26, 7, (r) => [-42 + r() * 31, -14 + r() * 23], 0.8, 2.6); blots(g, px, s, 8, 11, (r) => [-12 + r() * 20, 10.5 + r() * 3], 0.5, 1.4); },
    // 5 gravel: the lot + the yard path round the shed
    (g, px, s) => { g.filter = `blur(${0.9 * s}px)`; rect(g, px, -7.5, -15.5, 8.6, -0.15); rect(g, px, -5.2, -0.4, -4.1, 8.4); g.globalAlpha = 0.55; rect(g, px, -4.6, 4.05, 8.4, 8.6); g.globalAlpha = 1; },
    // 6 mud: the woods road + the tyre tracks into the lot
    (g, px, s) => { g.filter = `blur(${0.8 * s}px)`; road(g, px, s, 3.8); g.lineWidth = 0.55 * s; for (const dx of [-0.8, 0.8]) { g.beginPath(); const [a, b] = px(1.5 + dx, -15), [c, d] = px(3.4 + dx, -10), [e, f] = px(5 + dx, -6); g.moveTo(a, b); g.quadraticCurveTo(c, d, e, f); g.stroke(); } },
  ], "pgGround");

  // ===================== THE SHED =====================
  const siding = mat("weathered_plank_siding", 1.6, "#fff0dc", { rough: 1, env: 0.7 }), trim = mat("weathered_planks", 1.2, "#e0d0b8", { rough: 1, env: 0.6 });
  const darkIn = col("#2a221c", 0.95, 0, 0.3), floorM = mat("dark_wooden_planks", 1.4, "#a89078"), roofM = phMat("rusty_corrugated_iron", 1 / 1.6, 1 / 1.6, { tint: "#c8b8a8", rough: 0.7, metal: 0.45, env: 0.8, key: "pgRoof" });
  const HF = 2.7, HB = 2.3, WT = 0.1;
  const topAt = (z: number) => lerp(HF, HB, z / 4);
  // piers + floor
  for (const x of [-3.7, 0, 3.7]) for (const z of [0.3, 3.7]) mb.box(0.3, 0.14, 0.3, mat("concrete_wall_008", 1, "#b8b0a4"), [x, 0.05, z]);
  mb.span([-4, 0.06, 0], [4, FL, 4], floorM);
  // front wall pieces (z 0..0.1)
  const fw = (x0: number, x1: number, y0: number, y1: number) => mb.span([x0, y0, 0], [x1, y1, WT], siding);
  fw(-4, -3.7, FL, HF); fw(-2.9, -2.6, FL, HF); fw(-0.6, 4, FL, HF); fw(-2.6, -0.6, FL, 1.0); fw(-2.6, -0.6, 2.1, HF); fw(-3.7, -2.9, 2.1, HF);
  // side + back walls (the sides slope with the roof)
  // (boxes, not extrusions: the extruded caps faced inward and z-fought the dark inner lining)
  for (const x of [-4, 3.9]) { mb.span([x, FL, 0], [x + WT, HB, 4], siding); const a = Math.atan2(HF - HB, 4); mb.add(boxM(WT - 0.012, 0.44, 4.04), siding, [x + WT / 2, HB + 0.2 - 0.22 * Math.cos(a) + 0.02, 2], [a, 0, 0]); }
  mb.span([-4, FL, 3.9], [4, HB, 4.0], siding);
  // corner posts + trim
  for (const [x, z] of [[-4.02, -0.02], [3.92, -0.02], [-4.02, 3.92], [3.92, 3.92]]) mb.span([x, 0, z], [x + 0.1, z < 1 ? HF : HB, z + 0.1], trim);
  mb.span([-2.66, 0.95, -0.03], [-0.54, 1.0, 0.11], trim); mb.span([-2.66, 2.1, -0.03], [-0.54, 2.16, 0.11], trim);
  for (const x of [-2.66, -0.6]) mb.span([x, 1.0, -0.03], [x + 0.06, 2.1, 0.11], trim);
  mb.span([-3.76, 2.1, -0.03], [-2.84, 2.16, 0.11], trim); for (const x of [-3.76, -2.9]) mb.span([x, FL, -0.03], [x + 0.06, 2.1, 0.11], trim);
  // the tail board: pale whitewashed planks behind the tails (dark tails read against it)
  { const wt = ctex("pgTailBoard", 512, 512, (g, r) => { for (let i = 0; i < 4; i++) { g.fillStyle = ["#ebe3cf", "#e4dcc6", "#eee6d4", "#e1d8c2"][i]; g.fillRect(0, i * 128, 512, 128); g.fillStyle = "rgba(70,52,36,0.55)"; g.fillRect(0, i * 128, 512, 3); }
      for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(120,96,70,${0.05 + r() * 0.08})`; g.lineWidth = 1 + r() * 2; const y = r() * 512; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + (r() - 0.5) * 6, 340, y + (r() - 0.5) * 6, 512, y); g.stroke(); }
      for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(110,84,60,${r() * 0.07})`; g.fillRect(r() * 512, r() * 512, 3 + r() * 20, 1 + r() * 3); } });
    wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(1 / 1.3, 1 / 1.3); wt.colorSpace = THREE.SRGBColorSpace;
    mb.span([PG0.TAILW.x0 - 0.06, 0.28, -0.028], [PG0.TAILW.x1 + 0.06, 2.66, -0.004], new THREE.MeshStandardMaterial({ map: wt, roughness: 0.92, envMapIntensity: 0.6 })); }   // the whitewashed tail board
  // the counter shelf + brackets
  mb.span([-2.72, 1.0, -0.44], [-0.48, 1.06, 0.04], mat("wood_table_worn", 1.2, "#d0b898"));
  for (const x of [-2.5, -0.7]) { const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.36, 0), new THREE.Vector2(0, -0.36)]); const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); eg.rotateY(Math.PI / 2); mb.add(eg, trim, [x - 0.025, 1.0, 0]); }
  // inside: dark back wall, a shelf of jars + boxes, the inner counter
  mb.span([-3.9, FL, 3.85], [3.9, HB, 3.9], darkIn); mb.span([-3.9, FL, 0.1], [-3.85, HF, 3.85], darkIn); mb.span([3.85, FL, 0.1], [3.9, HF, 3.85], darkIn);
  mb.span([-3.4, 1.5, 3.4], [0.2, 1.54, 3.85], trim); mb.span([-3.4, 1.0, 3.4], [0.2, 1.04, 3.85], trim);
  mb.span([-2.7, FL, 0.12], [-0.5, 0.98, 0.4], mat("wood_table_worn", 1.2, "#9a8068"));
  mb.span([-3.85, FL, 0.4], [-0.3, 0.42, 2.0], floorM);   // the raised floor behind the counter (the shed guy stands on it)
  // roof: corrugated sheet from the front eave (y 2.78, z -0.62) to the back (y 2.36, z 4.35), side overhang
  { const L = Math.hypot(4.97, 0.42), a = Math.atan2(0.42, 4.97); const g = boxM(8.9, 0.04, L); mb.add(g, roofM, [0, (2.8 + 2.36) / 2, (-0.62 + 4.35) / 2], [a, 0, 0]);
    mb.box(8.9, 0.16, 0.05, trim, [0, 2.72, -0.63]); for (const x of [-4.45, 4.45]) mb.add(boxM(0.05, 0.16, L), trim, [x, 2.5, 1.86], [a, 0, 0]); }
  // the awning flap over the window (propped open) + two sticks
  { const aw = new THREE.Group(); aw.position.set(-1.6, 2.16, -0.02); aw.rotation.x = 0.18; root.add(aw); const ab = new MB(); ab.box(2.3, 0.04, 0.95, siding, [0, 0, -0.48]); ab.box(2.3, 0.08, 0.06, trim, [0, 0.02, -0.94]); ab.flush(aw);
    for (const x of [-2.55, -0.65]) mb.add(cylM(0.02, 0.02, 1.36, 6), trim, [x, 1.7, -0.66], [-0.36, 0, 0]); }
  // the door (plank, closed) + latch
  mb.span([-3.7, FL, 0.02], [-2.9, 2.1, 0.07], mat("wooden_gate", 1.2, "#c0a888")); mb.box(0.03, 0.12, 0.04, col("#2a2a2e", 0.5, 0.7), [-2.98, 1.05, -0.01]);
  // signs: BASE HOG CONTROL over the window; the PIGS SEEN board on a post
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.84, 0.46), new THREE.MeshStandardMaterial({ map: hogSignTex(), roughness: 0.9, envMapIntensity: 0.6 })); m.position.set(...PG0.HOGSIGN); m.rotation.y = Math.PI; m.receiveShadow = true; root.add(m); mb.box(1.92, 0.52, 0.03, trim, [PG0.HOGSIGN[0], PG0.HOGSIGN[1], -0.02]); }
  const seenM = new THREE.MeshStandardMaterial({ map: seenTex(0), roughness: 0.85, envMapIntensity: 0.6 });
  { const S = PG0.SEEN; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.72), seenM); m.position.set(S[0], S[1], S[2] - 0.035); m.rotation.y = Math.PI; m.receiveShadow = true; root.add(m);
    mb.box(0.98, 0.78, 0.05, trim, [S[0], S[1], S[2]]); mb.box(0.1, 2.0, 0.1, trim, [S[0], 0.95, S[2] + 0.06]); }
  // the flap of the flip board (a tile-sized card swinging down when c.flipK runs 0..1)
  const flap = new THREE.Group(); flap.position.set(PG0.SEEN[0], PG0.SEEN[1] - 0.04, PG0.SEEN[2] - 0.05); root.add(flap);
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.2), col("#f0ece0", 0.8)); f.position.y = 0.1; f.rotation.y = Math.PI; flap.add(f); flap.visible = false; }
  // the price board (hung on its nails; c.board 0 = held up at chest height in front of the wall .. 1 = on the wall)
  const priceM = new THREE.MeshStandardMaterial({ map: priceTex(0), roughness: 0.9, envMapIntensity: 0.6 });
  const priceG = new THREE.Group(); root.add(priceG);
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.125), priceM); m.rotation.y = Math.PI; m.position.z = -0.026; m.receiveShadow = true; m.castShadow = true; priceG.add(m); const bb = new MB(); bb.box(1.86, 1.18, 0.04, trim, [0, 0, 0]); bb.flush(priceG); }
  // the newspaper (taped on below the board when c.paper > 0.5)
  const paperG = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.69), new THREE.MeshStandardMaterial({ map: paperTex(), roughness: 0.95, envMapIntensity: 0.5 })); paperG.position.set(...PG0.PAPER); paperG.rotation.set(0, Math.PI, 0.03); paperG.receiveShadow = true; root.add(paperG);
  for (const [dx, dy] of [[-0.22, 0.3], [0.22, 0.3]]) { const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.035), col("#e8dcb0", 0.6)); tp.position.set(PG0.PAPER[0] + dx, PG0.PAPER[1] + dy, PG0.PAPER[2] - 0.003); tp.rotation.set(0, Math.PI, 0.5 * Math.sign(dx)); paperG.userData[dx] = tp; root.add(tp); (paperG.userData.tapes ??= []).push(tp); }
  // the chalk on the back wall
  const chalkM = new THREE.MeshStandardMaterial({ map: chalkTex(0), transparent: true, roughness: 1, envMapIntensity: 0.3, depthWrite: false });
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(PG0.CHALK_W, PG0.CHALK_H), chalkM); m.position.set(...PG0.CHALK); m.renderOrder = 2; root.add(m); }
  // the tail wall (instanced hog tails on nails; c.tails = how many)
  const tails = new THREE.InstancedMesh(tailGeo(), tailMat(), TAIL_N); tails.name = "tails"; tails.castShadow = true; tails.receiveShadow = true; root.add(tails);
  { const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(); for (let i = 0; i < TAIL_N; i++) { const s = tailSlot(i); M.compose(new THREE.Vector3(...s.p), Q.setFromEuler(E.set(0.12 + (hsh(i, 3) - 0.5) * 0.1, (hsh(i, 5) - 0.5) * 0.5, s.rz)), new THREE.Vector3(1, 0.9 + hsh(i, 6) * 0.25, 1)); tails.setMatrixAt(i, M); } }
  // the tail slapped on the counter (c.ctrTail)
  const ctrTail = new THREE.Mesh(tailGeo(), tailMat()); ctrTail.position.set(...PG0.CTR_TAIL); ctrTail.rotation.set(Math.PI / 2, 0, 1.2); ctrTail.castShadow = true; root.add(ctrTail);
  // the boars' WANTED poster on the roadside pine (c.poster 0 = not there .. 1 = pinned flat on the trunk)
  const posterM = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.87), new THREE.MeshStandardMaterial({ map: wantedTex(), roughness: 0.95, envMapIntensity: 0.5, side: THREE.DoubleSide })); posterM.receiveShadow = true; root.add(posterM);
  const POST = { x: roadX(PG0.POSTER_Z) - 4.5 + 0.42, y: 1.55, z: PG0.POSTER_Z };
  // the counter: cash box (open) + a stack of twenties; the inside bulb + the eave bulb
  mb.box(0.36, 0.12, 0.24, col("#3a4a3e", 0.5, 0.5), [-1.05, 1.12, -0.2]); mb.box(0.32, 0.02, 0.2, col("#7a9a6a", 0.8), [-1.05, 1.185, -0.2]);
  ph("lightbulb_01", [-1.6, 2.38, 1.6]); ph("lightbulb_01", [PG0.BULB[0], PG0.BULB[1] - 0.08, PG0.BULB[2]]);
  mb.add(cylM(0.004, 0.004, 0.2, 4), col("#1a1a1a"), [PG0.BULB[0], PG0.BULB[1] + 0.1, PG0.BULB[2]]);
  const bulbL = new THREE.PointLight("#ffc070", 0, 9, 1.6); bulbL.position.set(PG0.BULB[0], PG0.BULB[1] - 0.12, PG0.BULB[2] - 0.05); root.add(bulbL);
  const bulbG = glow(root, [PG0.BULB[0], PG0.BULB[1] - 0.1, PG0.BULB[2]], "#ffd090", 0.5, 0);
  const inL = new THREE.PointLight("#ffb860", 0, 6, 1.5); inL.position.set(-1.6, 2.2, 1.7); root.add(inL);
  // props round the shed: barrels, a bench, feed sacks, a spade, rubber boots by the door, a picnic table in the lot
  ph("Barrel_01", [4.5, 0, 0.6], 0.3); ph("Barrel_01", [4.55, 0, 1.25], 1.1); ph("compost_bags", [-4.6, 0, 1.6], 1.4, { filt: "floorstacked" });
  ph("rusted_spade_01", [4.25, 0.55, 2.3], 0.2); ph("rubber_boots", [-4.35, 0, 0.35], 0.4, { filt: "dirt" }); ph("wooden_picnic_table", [-6.2, 0, -6.5], 0.25);
  ph("modified_thermos", [-5.95, 0.76, -6.2], 0.6); ph("wooden_bucket_01", [3.4, 0, 4.5], 0.4); ph("metal_jerrycan", [5.4, 0, -10.6], 0.9);
  ph("wooden_crate_02", [-4.7, 0, -0.9], 0.2, { filt: "crate" });
  // the yard: the ranger's bench by the back wall + a water barrel
  mb.box(1.6, 0.06, 0.38, trim, [1.6, 0.45, 4.35]); for (const x of [0.95, 2.25]) mb.box(0.07, 0.45, 0.32, trim, [x, 0.22, 4.35]);
  ph("Barrel_01", [3.4, 0, 5.0], 2.0);

  // ===================== FENCE + THE BACK GATE =====================
  const gateG = farmGate(root, PG0.GATE_HINGE, 0, PG0.GATE_W);
  fence(mb, [[9, 0, -15.5], [9, 0, -5.9]], hf); fence(mb, [[9, 0, -2.7], [9, 0, 9], [-4.5, 0, 9]], hf);
  fence(mb, [[-9.5, 0, 5], [-9.5, 0, -15.5]], hf, (_x, z) => z > -4 && z < 6);
  const lock = padlock(root, PG0.LOCK, Math.PI / 2);
  // the gate lantern on its post (lit at dusk)
  ph("wooden_lantern_01", [9.0, 1.42, -2.75], Math.PI / 2);
  const lanL = new THREE.PointLight("#ffb860", 0, 7, 1.6); lanL.position.set(9.0, 1.65, -2.75); root.add(lanL); const lanG = glow(root, [9.0, 1.62, -2.75], "#ffc070", 0.42, 0);

  // ===================== THE FIELD: young corn in rows, rooted up in patches =====================
  { const geo = cornGeo(), cm = cornMat(); const spots: THREE.Matrix4[] = []; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    const holes = [[-24, -6, 2.4], [-27, -2.5, 2.2], [-22, 1.5, 2.2], [-29, -8.5, 2.0], [-25.5, 4, 2.2], ...Array.from({ length: 20 }, (_, i) => [-42 + hsh(i, 71) * 31, -14 + hsh(i, 73) * 23, 0.8 + hsh(i, 75) * 1.6])];
    for (let x = -43.5; x < -10; x += 1.05) for (let z = -14.6; z < 9.2; z += 0.6) {
      const jx = x + (hsh(x * 7 + z, 1) - 0.5) * 0.12, jz = z + (hsh(x + z * 3, 2) - 0.5) * 0.18; let dmg = 0; for (const [hx, hz, hr] of holes) { const d = Math.hypot(jx - hx, jz - hz); if (d < hr * 1.15) dmg = Math.max(dmg, 1 - d / (hr * 1.15)); }
      if (dmg > 0.42) continue;
      const fall = dmg > 0.12 ? (0.4 + dmg) * 1.3 : 0, s = 0.55 + hsh(jx * 3, jz) * 0.3;
      M.compose(new THREE.Vector3(jx, 0, jz), Q.setFromEuler(E.set(fall * (hsh(jz, 5) - 0.5) * 2, hsh(jx, 6) * TAU, fall * (hsh(jx, 8) - 0.5) * 2, "YXZ")), new THREE.Vector3(s, s * (0.85 + hsh(jz, 9) * 0.3), s)); spots.push(M.clone()); }
    const im = new THREE.InstancedMesh(geo, cm, spots.length); im.name = "corn"; spots.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere(); root.add(im);
    // dirt clods where the hogs rooted
    const clod = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.07, 0), phMat("farm_soil", 4, 4, { tint: "#c8a888", rough: 1, env: 0.4, key: "pgClod" }), 600); const C = new THREE.Matrix4(); let k = 0;
    for (const [hx, hz, hr] of holes) for (let j = 0; j < 23 && k < 600; j++) { const a = hsh(j, hx) * TAU, rr = hr * (0.4 + 0.8 * hsh(j, hz)), s = 0.5 + hsh(j, 3) * 1.1; C.compose(new THREE.Vector3(hx + Math.cos(a) * rr, 0.02, hz + Math.sin(a) * rr), Q.setFromEuler(E.set(a, a * 2, 0)), new THREE.Vector3(s, s * 0.7, s)); clod.setMatrixAt(k++, C); }
    clod.count = k; clod.castShadow = true; clod.receiveShadow = true; root.add(clod); }

  // ===================== TREES =====================
  // near hero trees (real, thinned pines that cast shadows) + mid pines (real, lighter) + far woods (impostor cards)
  const imp = impostor((i) => pineTree(i, 20, false), 3, "pgPine");
  const tree = (x: number, z: number, h: number, v: number, cast: boolean) => { const t = pineLOD(v, h, cast, imp); t.position.set(x, hf(x, z) - 0.15, z); t.rotation.y = hsh(x, z) * TAU; root.add(t); return t; };
  const near: [number, number, number][] = [[-6.5, 14.5, 0], [-1.2, 16.5, 1], [4.2, 13.6, 2], [9.5, 15.5, 0], [14, 12.5, 1], [-12, 13, 2],
    [roadX(PG0.POSTER_Z) - 4.5, PG0.POSTER_Z, 1], [roadX(-23) + 5.8, -23, 0], [roadX(-33) - 6.2, -33, 2], [roadX(-50) + 6, -50, 1], [roadX(-56) - 5.5, -56, 0], [roadX(-70) + 5.5, -70, 2], [roadX(-80) - 6, -80, 1],
    [-7.6, 10.2, 2], [7.0, 11.0, 0]];
  near.forEach(([x, z, v], i) => tree(x, z, 18 + hsh(i, 3) * 5, v, true));
  const occupied: [number, number][] = near.map(([x, z]) => [x, z]);
  const free = (x: number, z: number, r: number) => occupied.every(([a, b]) => Math.hypot(a - x, b - z) > r);
  const mids: [number, number][] = [];
  for (let z = -19; z > -124; z -= 5.2) for (const side of [-1, 1]) { const off = 5.2 + hsh(z, side + 2) * 7, x = roadX(z) + side * off; if (free(x, z, 4.5)) mids.push([x, z]); }
  for (let x = -24; x < 30; x += 5.5) { const z = 19 + hsh(x, 4) * 5; if (free(x, z, 4.5)) mids.push([x, z]); }
  mids.forEach(([x, z], i) => { tree(x, z, 17 + hsh(i, 5) * 6, i % 3, hsh(i, 9) < 0.35); occupied.push([x, z]); });
  // far woods: impostor cards everywhere in the woods regions, kept off the road, the lot, the field and the open hill
  { const spots: { p: V3; s: number; v: number; yaw: number }[] = [];
    let k = 0; const R = () => { k++; return hsh(k, 31); };
    for (let i = 0; i < 1400 && spots.length < 560; i++) { const x = -76 + R() * 208, z = -132 + R() * 194;
      const inLot = x > -10 && x < 10 && z > -16 && z < 9.5, inField = x > -46 && x < -9 && z > -16 && z < 11, onHill = x > 9 && z > -40 && z < 32 && x < 120, nearRoad = z < -14 && Math.abs(x - roadX(z)) < 13;
      if (inLot || inField || onHill || nearRoad || !free(x, z, 4)) continue;
      spots.push({ p: [x, hf(x, z) - 0.2, z], s: (0.85 + R() * 0.4) * (20 / imp.h[0]) * imp.h[0] / 20, v: Math.floor(R() * 3), yaw: R() * TAU }); }
    // the hill's wooded flanks + crest
    for (let i = 0; i < 260; i++) { const x = 22 + R() * 108, side = R() < 0.5 ? -1 : 1, z = side > 0 ? 30 + R() * 30 : -40 - R() * 30; spots.push({ p: [x, hf(x, z) - 0.2, z], s: 0.85 + R() * 0.4, v: Math.floor(R() * 3), yaw: R() * TAU }); }
    for (let i = 0; i < 140; i++) { const x = 92 + R() * 38, z = -40 + R() * 72; spots.push({ p: [x, hf(x, z) - 0.2, z], s: 0.8 + R() * 0.45, v: Math.floor(R() * 3), yaw: R() * TAU }); }
    const fr = forest(root, imp, spots, pineImpMat(imp)); root.userData.forestMat = fr.mat; }
  // the hill: oaks + scattered bushes
  for (const [x, z, h, n] of [[24, -16, 7.5, 0], [33, 9, 9, 0], [48, -22, 8, 0], [56, 14, 10, 0], [66, -2, 8.5, 0]] as [number, number, number, number][]) { const t = phModel(n ? "island_lite" : "oak_lite", { center: true, h, noCast: true }); t.position.set(x, hf(x, z) - 0.1, z); t.rotation.y = hsh(x, z) * TAU; root.add(t); }
  // the woods edge shrubs (they shake when the hogs come through: c.shake)
  const shrubs: THREE.Object3D[] = [];
  for (const [x, z, v] of [[-8, 11.6, "a"], [-3.5, 12.2, "b"], [2, 11.8, "c"], [6.5, 12.4, "d"], [11.5, 11.2, "a"], [-14, 10.8, "b"], [-11, -17.5, "c"], [5.5, -17.2, "d"], [-4.5, -17.8, "a"], [4.6, 11.4, "b"], [9.0, 11.9, "c"], [-6.8, 8.8, "d"], [-9.4, 7.6, "a"], [12.6, 10.6, "d"]] as [number, number, string][]) shrubs.push(ph("shrub_02", [x, hf(x, z), z], hsh(x, z) * TAU, { filt: "shrub_02_" + v, h: 1.5 + hsh(z, x) * 0.6 }));
  for (let i = 0; i < 26; i++) { const z = -18 - hsh(i, 41) * 100, side = hsh(i, 43) < 0.5 ? -1 : 1, x = roadX(z) + side * (3.0 + hsh(i, 45) * 3); ph("fern_02", [x, hf(x, z), z], hsh(i, 47) * TAU, { filt: "fern_02_" + "abcd"[i % 4], s: 1.2 + hsh(i, 49) }); }
  ph("tree_stump_01", [roadX(-40) + 4.2, hf(roadX(-40) + 4.2, -40), -40], 0.6); ph("dead_tree_trunk", [roadX(-58) + 4.5, hf(roadX(-58) + 4.5, -58) + 0.1, -58], 1.2);

  // ===================== GRASS, WEEDS, DANDELIONS =====================
  { const spots: { p: V3; yaw: number; s: number }[] = []; let k = 0; const R = () => { k++; return hsh(k, 57); };
    const put = (x: number, z: number, s: number) => spots.push({ p: [x, hf(x, z), z], yaw: R() * TAU, s });
    for (let i = 0; i < 90; i++) { const x = 9.6 + R() * 16, z = -13 + R() * 21; put(x, z, 1.1 + R() * 1.2); }                         // meadow by the gate
    for (let i = 0; i < 30; i++) { const z = -15 + R() * 24; put(9.2 + R() * 0.6, z, 1.4 + R()); put(8.4 + R() * 0.6, z, 1.2 + R()); } // along the fence
    for (let i = 0; i < 40; i++) { const a = R() * TAU, x = Math.cos(a) * (4.3 + R() * 0.5), z = 2 + Math.sin(a) * (2.4 + R() * 0.5); if (z > 0.6) put(x, z, 1 + R()); }      // round the shed (not on the gravel in front)
    for (let i = 0; i < 40; i++) { const z = -16 - R() * 60; put(roadX(z) + (R() < 0.5 ? -1 : 1) * (2.1 + R() * 1.6), z, 1 + R() * 1.4); } // road shoulders
    phInst(root, "grass_medium_02", spots); }
  // tall weeds (nettles x3) + dandelion clocks along the inside of the east fence: the mower cuts the weeds (c.mowZ)
  const W = PG0.WEEDS; const weeds: { x: number; z: number; yaw: number; s: number }[] = [];
  for (let i = 0; i < 30; i++) weeds.push({ x: W.x0 + hsh(i, 61) * (W.x1 - W.x0), z: W.z0 + hsh(i, 63) * (W.z1 - W.z0), yaw: hsh(i, 65) * TAU, s: 2.2 + hsh(i, 67) * 0.9 });
  const weedIM = phInst(root, "nettle_plant", weeds.map((w) => ({ p: [w.x, 0, w.z] as V3, yaw: w.yaw, s: w.s })), { filt: "medium_a" });
  const weedBase = weedIM.map((im) => Array.from({ length: weeds.length }, (_, i) => { const m = new THREE.Matrix4(); im.getMatrixAt(i, m); return m; }));
  const dands: { x: number; z: number }[] = []; for (let i = 0; i < 18; i++) dands.push({ x: W.x0 + hsh(i, 71) * (W.x1 - W.x0), z: W.z0 + hsh(i, 73) * (W.z1 - W.z0) });
  phInst(root, "dandelion_01", dands.map((d, i) => ({ p: [d.x, 0, d.z] as V3, yaw: hsh(i, 75) * TAU, s: 1.3 + hsh(i, 77) * 0.5 })), { filt: "dandelion_01_a" });
  // drifting dandelion seeds (c.seeds 0..1)
  const seedT = ctex("pgSeed", 64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 1.5; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; g.beginPath(); g.moveTo(32, 36); g.lineTo(32 + Math.cos(a) * 20, 30 + Math.sin(a) * 14 - 8); g.stroke(); } g.fillStyle = "#c8b890"; g.fillRect(31, 34, 2, 18); });
  const seeds: THREE.Sprite[] = []; for (let i = 0; i < 70; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: seedT, transparent: true, depthWrite: false, opacity: 0 })); s.scale.set(0.05, 0.05, 1); s.visible = false; root.add(s); seeds.push(s); }

  // ===================== THE PICKUP, THE MOWER =====================
  const truck = pickup(root, { paint: "#8e3a2e" }); truck.g.position.set(...PG0.TRUCK); truck.g.rotation.y = Math.PI;
  const mow = mower(root); mow.g.position.set(2.4, 0, 5.0); mow.g.rotation.y = 0.4;

  // ===================== THE HERD (instanced pig cards: the hillside reveal + the living family tree) =====================
  const HERD_N = 420; const hd = herd(root, HERD_N);
  const herdSpots = Array.from({ length: HERD_N }, (_, i) => { const r1 = hsh(i, 81), r2 = hsh(i, 83), r3 = hsh(i, 85);
    // scattered over the hillside beyond the gate, nearer ones first (i small = nearest)
    const d = 4 + Math.pow(i / HERD_N, 0.8) * 62, a = -0.75 + r1 * 1.5, x = 9.5 + d * Math.cos(a) + 2, z = -4.4 + d * Math.sin(a) * 1.1;
    const kind = r2 < 0.42 ? (r3 < 0.5 ? 2 : 3) : r2 < 0.82 ? (r3 < 0.5 ? 0 : 1) : r2 < 0.92 ? 5 : 4;
    return { x, z, kind, ph: r3, dir: r1 < 0.5, spd: 0.25 + r2 * 0.5 }; });
  // the family tree layout: one sow at the bottom (near the gate), trails branching up the hill (gen 0 -> 3 -> 9 -> 27 trails)
  const treeSpots: [number, number][] = []; { const branch = (x: number, z: number, ang: number, len: number, gen: number) => { const n = Math.round(len / 1.2);
      for (let j = 1; j <= n; j++) treeSpots.push([x + Math.cos(ang) * j * 1.2, z + Math.sin(ang) * j * 1.2]);
      if (gen < 3) for (const da of [-0.5, 0, 0.5]) branch(x + Math.cos(ang) * len, z + Math.sin(ang) * len, ang + da * (1 - gen * 0.15), len * 0.72, gen + 1); };
    treeSpots.push([13, -4.4]); branch(13, -4.4, 0, 12, 0); }
  const herdTint = new THREE.Color(1, 1, 1);

  // ===================== MARKS + CAMS =====================
  const marks: Record<string, V3> = {
    window: PG0.OUTSIDE, inside: PG0.INSIDE, price: PG0.PRICE, seen: PG0.SEEN, chalk: PG0.CHALK, ranger: PG0.RANGER, corner: PG0.CORNER,
    truck: PG0.TRUCK, gate: [PG0.GATE_HINGE[0] - 0.7, 0, -4.4], lock: PG0.LOCK, entrance: PG0.ENTRANCE,
    boar: [roadX(PG0.BOAR_Z) + 5, hf(roadX(PG0.BOAR_Z) + 5, PG0.BOAR_Z), PG0.BOAR_Z], poster: [roadX(PG0.POSTER_Z) - 4.5, 0, PG0.POSTER_Z], sow: [roadX(PG0.SOW_Z) + 3.6, hf(roadX(PG0.SOW_Z) + 3.6, PG0.SOW_Z), PG0.SOW_Z],
  };
  const cams: SetDef["cams"] = {
    front: { pos: [-0.6, 1.6, -7.5], look: [-0.2, 1.45, 0], fov: 46 },
    window: { pos: [-1.0, 1.55, -2.6], look: [-1.55, 1.4, 0.2], fov: 44 },
    tailwall: { pos: [1.6, 1.5, -3.2], look: [2.7, 1.5, 0], fov: 44 },
    field: { pos: [-17, 6.5, -16], look: [-24, 0.5, -2], fov: 46 },
    back: { pos: [-1.0, 1.55, 7.8], look: [-1.5, 1.3, 4.1], fov: 46 },
    gate: { pos: [6.2, 1.6, -4.0], look: [20, 3.5, -4.0], fov: 46 },
    hill: { pos: [7.8, 2.4, -4.2], look: [32, 6.5, -4], fov: 46 },
    road: { pos: [roadX(-40), 1.7, -34], look: [roadX(-55), 1.6, -52], fov: 46 },
    poster: { pos: [roadX(-62) - 0.8, 1.6, -60.6], look: [roadX(-62) - 3.2, 1.5, -62], fov: 44 },
  };
  mb.flush(root);

  // ===================== POSE =====================
  const Mt = new THREE.Matrix4();
  let lastSeen = -1, lastPrice = -1, lastChalk = -1;
  const pose = (t: number, c: Ctl, light?: string) => {
    const dusk = light === "pgDusk" ? 1 : 0;
    // tails on the wall
    tails.count = Math.max(0, Math.min(TAIL_N, Math.round(c.tails ?? TAIL_N)));
    ctrTail.visible = (c.ctrTail ?? 0) > 0.5;
    { const k = sm(cl(c.poster ?? 1)); posterM.visible = k > 0.01; posterM.position.set(POST.x + 0.002, POST.y - (1 - k) * 0.25, POST.z); posterM.rotation.set(0, Math.PI / 2, (1 - k) * 0.5); }
    // the price board: held (c.board 0) .. on the wall (1); paint-over c.price
    { const k = sm(cl(c.board ?? 1)), held: V3 = [c.bx ?? 0.5, c.by ?? 1.35, c.bz ?? -0.55], hung: V3 = [PG0.PRICE[0], PG0.PRICE[1], -0.01];
      priceG.position.set(lerp(held[0], hung[0], k), lerp(held[1], hung[1], k), lerp(held[2], hung[2], k)); priceG.rotation.set(0, 0, (1 - k) * (c.btilt ?? 0.04));
      const pv = Math.round(cl(c.price ?? 0) * 16); if (pv !== lastPrice) { priceM.map = priceTex(pv / 16); priceM.needsUpdate = true; lastPrice = pv; } }
    // the flip board
    { const v = Math.round(c.seen ?? 312); if (v !== lastSeen) { seenM.map = seenTex(v); seenM.needsUpdate = true; lastSeen = v; } const fk = c.flipK ?? 0; flap.visible = fk > 0.01 && fk < 0.99; flap.rotation.x = -fk * Math.PI; }
    // newspaper
    { const on = (c.paper ?? 1) > 0.5; paperG.visible = on; for (const tp of (paperG.userData.tapes as THREE.Mesh[])) tp.visible = on; }
    // chalk
    { const n = Math.round(c.chalk ?? CHALK.length); if (n !== lastChalk) { chalkM.map = chalkTex(n); chalkM.needsUpdate = true; lastChalk = n; } }
    // gate, padlock
    gateG.set(c.gate ?? 0); lock.set(c.lockO ?? 0, c.lockD ?? 0); lock.g.visible = (c.lockD ?? 0) < 0.999;
    // shrubs shake (the hogs coming through the woods edge)
    { const sk = c.shake ?? 0; shrubs.forEach((s, i) => { s.rotation.z = sk * 0.09 * Math.sin(t * 17 + i * 2.1) * Math.sin(t * 5.3 + i); s.rotation.x = sk * 0.06 * Math.sin(t * 13 + i * 1.3); }); }
    // the mower (c.mowOn): pushed along -z inside the east fence; weeds behind it are cut short, the dandelions survive
    { const on = (c.mowOn ?? 0) > 0.5; const mz = c.mowZ ?? -6.4, mx = c.mowX ?? 7.95;
      if (on) { mow.g.position.set(mx, 0, mz); mow.g.rotation.y = Math.PI; mow.set(c.mowSpin ?? 0, 0); } else { mow.g.position.set(2.4, 0, 5.0); mow.g.rotation.y = 0.4; mow.set(0, 0); }
      weeds.forEach((w, i) => { const cut = (on && w.z > mz - 0.15 && Math.abs(w.x - mx) < 0.6) || ((c.weedsCut ?? 0) > 0.5 && Math.abs(w.x - mx) < 0.6); weedIM.forEach((im, j) => { Mt.copy(weedBase[j][i]); if (cut) { const e = Mt.elements; for (const k of [4, 5, 6]) e[k] *= 0.22; } im.setMatrixAt(i, Mt); im.instanceMatrix.needsUpdate = true; }); });
      const sd = c.seeds ?? 0; seeds.forEach((s, i) => { const d = dands[i % dands.length], rise = sd * (0.6 + hsh(i, 3) * 1.4); s.visible = sd > 0.01; if (!s.visible) return;
        s.position.set(d.x + Math.sin(t * 0.9 + i) * 0.25 * sd + sd * 0.8 * hsh(i, 5), 0.25 + rise + 0.08 * Math.sin(t * 2 + i), d.z + sd * (hsh(i, 7) - 0.5) * 1.6); (s.material as THREE.SpriteMaterial).opacity = Math.min(1, sd * 3) * (1 - cl((sd - 0.8) / 0.2) * 0.5); }); }
    // the pickup (c.tOn 1 = driven by the shots: c.tx, c.tz, c.tyaw, c.tdist ...)
    if ((c.tOn ?? 0) > 0.5) { truck.g.position.set(c.tx ?? PG0.TRUCK[0], hf(c.tx ?? PG0.TRUCK[0], c.tz ?? PG0.TRUCK[2]), c.tz ?? PG0.TRUCK[2]); truck.g.rotation.y = c.tyaw ?? Math.PI; }
    else { truck.g.position.set(...PG0.TRUCK); truck.g.rotation.y = Math.PI; }
    truck.set({ dist: c.tdist ?? 0, t, bob: c.tbob ?? 0, steer: c.tsteer ?? 0, brake: c.tbrake ?? 0, doorL: c.tdoor ?? 0, lamps: dusk * 0.3 });
    truck.g.visible = (c.tVis ?? 1) > 0.5;
    // dusk lights
    const bl = c.bulb ?? dusk; bulbL.intensity = bl * 5.5; (bulbG.material as THREE.SpriteMaterial).opacity = bl; inL.intensity = bl * 2.6 + 3.0; lanL.intensity = bl * 4; (lanG.material as THREE.SpriteMaterial).opacity = bl;
    // far woods tint by the light
    const fm = root.userData.forestMat as THREE.MeshBasicMaterial; if (fm) fm.color.set(dusk ? "#5a4e54" : light === "pgWoods" ? "#9a9c84" : "#a8a88c");
    // the herd: c.herd 0..1 (share of the herd in view, nearest first), c.treeK 0 scattered .. 1 the branching trails
    // (a pig never pops in: each one stands up out of the grass over the next RS pigs' worth of c.herd)
    { const RS = 110, nf = cl(c.herd ?? 0) * (HERD_N + RS), n = Math.min(HERD_N, Math.ceil(nf)), tk = sm(cl(c.treeK ?? 0)), list: { p: V3; kind: number; ph: number; flip: boolean; s: number; on: boolean }[] = [];
      for (let i = 0; i < n; i++) { const h = herdSpots[i]; const wob = (c.herdWalk ?? 1) * Math.sin(t * h.spd + i) * 0.6, up = sm(cl((nf - i) / RS));
        let x = h.x + wob * (h.dir ? 1 : -1), z = h.z + 0.3 * Math.cos(t * h.spd * 0.7 + i);
        if (tk > 0 && i < treeSpots.length) { const [tx, tz] = treeSpots[i]; x = lerp(x, tx, tk); z = lerp(z, tz, tk); }
        const piglet = h.kind === 2 || h.kind === 3, s = (piglet ? 0.42 : h.kind === 4 ? 0.95 : 0.78) * (1 + 0.1 * hsh(i, 2));
        list.push({ p: [x, hf(x, z) - (1 - up) * 0.75 * s, z], kind: tk > 0.5 && i > 0 ? (i % 4 === 0 ? 0 : 2 + (i % 2)) : h.kind, ph: t * (0.9 + h.spd) + h.ph, flip: tk > 0.5 ? false : h.dir, s: s * (0.75 + 0.25 * up), on: up > 0.02 }); }
      herdTint.set(dusk ? "#8a7676" : "#d8d0c0"); hd.set(list, herdTint); }
    void Mt;
  };
  const sun = { pgAft: [-0.38, 0.56, -0.74] as V3, pgWoods: [-0.3, 0.42, -0.86] as V3, pgDusk: [0.86, 0.13, -0.49] as V3 };
  const env = { pgAft: { hdri: "farm_field", i: 0.35 }, pgWoods: { hdri: "forest_grove", i: 0.3 }, pgDusk: { hdri: "qwantani_dusk_2", i: 0.32 } };
  void planeM; void mat;
  return { name: "pigset", root, marks, cams, pose, sunW: sun, env, title: [tails] } as SetDef;
};
