// "Why He Let His Tap Drip All Night in the Freeze" (2026-11-25): ONE connected winter street. Local metres, y up.
//  STREET along x (z 9..15, snowy asphalt), north sidewalk z 7..9, south sidewalk z 15..17, snowbanks on both kerbs.
//  THE OLD MAN'S HOUSE (yellow clapboard) x 3..11, z -6..0, floor y FLR, front porch z 0..1.6 facing the street (+z).
//    His KITCHEN x 3..7.5, z -6..-1.5: the sink on the WEST wall (x 3, an outside wall) under a window that looks across
//    the side yard into the neighbour's kitchen window; the chrome gooseneck tap, the steel bucket in the sink, the
//    kitchen table with the ketchup bottle, a dining chair, the rocking chair, the wall clock.
//  THE NEIGHBOUR'S HOUSE (grey-blue clapboard) x -11..-3, mirrored: his KITCHEN x -7.5..-3, sink on the EAST wall (x -3)
//    under the window facing the old man's; a short spout with two cross handles, the dial thermometer on his window (-20).
//  Both sinks are open underneath (an old farmhouse run): the supply pipe comes out of the outside wall under the basin,
//    so the wall under each sink is in plain view, and it is the part that slices open for the cutaways.
//  THE SIDE YARD x -3..3: a low picket fence along x = 0 from z -6 to z 2 (the neighbour leans on it).
//  ACROSS THE STREET (south, fronts at z 18 facing -z): the woman's house x -10..-2, the shovel guy's x 2..10; and two
//    more houses each side further down the street (the ending lights their windows one by one).
// Controls (pose c.*): dripO 0/1 (his tap drips), dripRate (drops a second), dripFrozen 0..1 (the bead freezes),
//  fatT (seconds since the 3 a.m. cough; the bead swells from -1.4 s, falls at 0, a big ripple after; leave unset = off),
//  bucketK 0..1 (water level), tapO 0..1 (his lever open), tapN 0..1 (the neighbour's handles cranked), wrenchN 0/1,
//  burstN 0..1 (the neighbour's wall bursts, the spray), wetN 0..1 (the water across his floor), streetSpray 0..1 (the
//  hook's flash-forward), cutN / cutO 0..1 (each wall section slices open), iceN / iceO 0..1 (the ice plug grows),
//  splitN 0..1 (his pipe swells, cracks at 0.6, sprays), ketchup 0..1 (the squeeze), ketchupSplit 0..1, sign 0..1 (the
//  DRIPPY sign planted), signX/signZ (where it is held before planting), clockH (hours), frost 0..1, thaw 0..1 (icicles
//  shrink and drip), snow 0..1, winLit 0..1 (the street's windows light up in order), dripN 0/1 (the neighbour's own
//  tap drips, the ending), lampO / lampN 0..1 (kitchen lights; default by light), breath + breathX/Y/Z (steam).
import * as THREE from "three";
import { ctex } from "../paint";
import { glow, mist } from "../setkit";
import { NOINK } from "../ink";
import { phModel, type PhModel } from "../ph";
import { MB, TAU, cl, sm, hsh, col, mat, cylM, signBoard } from "./mailkit";
import { dotTex } from "./innerkit_b";
import type { SetDef, V3 } from "./types";

const FLR = 0.3;                       // both houses' floor
const CT = FLR + 0.92;                 // counter top
const H = 3.0;                         // wall height (eaves)
const WIN_Y0 = CT + 0.12, WIN_Y1 = CT + 1.05;   // the kitchen windows
const SEC_Z0 = -4.32, SEC_Z1 = -3.48, SEC_Y1 = CT - 0.25;   // the wall section under each sink (the cutaway)
export const DR0 = {
  FLR, CT,
  TAP_O: [3.42, CT + 0.36, -3.9] as V3,    // the old man's spout outlet (over the bucket's centre)
  TAP_N: [-3.3, CT + 0.3, -3.9] as V3,     // the neighbour's spout outlet
  BUCKET: [3.42, CT - 0.22, -3.9] as V3,   // the bucket's bottom (it stands in the basin)
  THERMO: [-3.06, CT + 0.95, -4.4] as V3,  // the dial thermometer on his window glass, facing into his kitchen (-x)
  CLOCK: [7.44, FLR + 2.0, -4.4] as V3,   // the old man's wall clock (on the partition wall x 7.5, facing -x: seen past the tap from the window)
  TABLE: [5.4, FLR, -3.4] as V3, KETCHUP: [5.2, FLR + 0.78, -3.3] as V3,
  ROCKER: [6.4, FLR, -4.4] as V3,      // the back corner under the clock, facing the window
  SIGN: [7.2, 0, 3.2] as V3,               // the DRIPPY sign in his front yard
  OLD_SINK: [3.95, FLR, -3.9] as V3, NBR_SINK: [-3.95, FLR, -3.9] as V3,  // where each man stands at his sink
  OLD_PORCH: [6.2, FLR + 0.1, 0.9] as V3, NBR_FENCE: [-0.45, 0, -2.6] as V3, OLD_FENCE: [0.45, 0, -2.6] as V3,
  WOMAN_PORCH: [-6.2, FLR + 0.1, 17.2] as V3, SHOVEL: [5.4, 0, 16.4] as V3, NBR_DOOR: [-7.0, FLR + 0.1, 0.9] as V3,
  OLD_WIN: [3, (WIN_Y0 + WIN_Y1) / 2, -3.9] as V3, NBR_WIN: [-3, (WIN_Y0 + WIN_Y1) / 2, -3.9] as V3,
};
// house footprints (for the snowfall to stay outdoors)
const HOUSES: [number, number, number, number][] = [[3, 11, -6, 0], [-11, -3, -6, 0], [13, 19, -6, 0], [-19, -13, -6, 0], [-10, -2, 18, 24], [2, 10, 18, 24], [12, 18, 18, 24], [-18, -12, 18, 24]];

export const dripset = (): SetDef => {
  const root = new THREE.Group(); root.name = "dripset";
  const mb = new MB();
  /** a box between two corners in any order */
  const sp = (a: V3, b: V3, m: THREE.Material, B: MB = mb) => B.span([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], m);
  const add = (o: THREE.Object3D, p: V3, yaw = 0) => { o.position.set(...p); o.rotation.y = yaw; root.add(o); return o; };
  const ph = (n: PhModel, p: V3, yaw = 0, o: { h?: number; s?: number; filt?: string; env?: number; noCast?: boolean } = {}) => add(phModel(n, { center: true, ...o }), p, yaw);

  // ===================== MATERIALS =====================
  const snowM = mat("snow_02", 2.4, "#f4f8ff", { rough: 0.85, env: 0.9 }), snowRoof = mat("snow_03", 1.8, "#f6f9ff", { rough: 0.8, env: 0.9 });
  const road = mat("asphalt_snow", 3.0, "#e8ecf4", { rough: 0.8 }), walk = mat("concrete_tiles", 1.2, "#d8dce4");
  const sideY = mat("weathered_plank_siding", 1.4, "#ffe6a0", { rough: 1, env: 0.7 });       // the old man's yellow
  const sideB = mat("blue_painted_planks", 1.4, "#a8b8c8", { rough: 1, env: 0.7 });          // the neighbour's grey-blue
  const sideW = mat("weathered_plank_siding", 1.4, "#f2efe8"), sideG = mat("blue_painted_planks", 1.4, "#c8d8b8");
  const sideR = mat("weathered_plank_siding", 1.4, "#e8b8a8"), sideP = mat("blue_painted_planks", 1.4, "#c0c8e0");
  const roofM = mat("grey_roof_tiles", 1.4, "#c8c8cc"), trim = col("#f4f2ec", 0.6);
  const lino = mat("old_linoleum_flooring_01", 1.0, "#f2e8d8"), linoN = mat("concrete_tiles", 0.6, "#d8dce2");
  const wallIn = mat("painted_plaster_wall", 1.4, "#f4e6c8"), wallInN = mat("painted_plaster_wall", 1.4, "#cdd6dc");
  const counter = col("#e8e2d6", 0.5), cab = mat("brown_planks_05", 0.8, "#c88a5a"), cabN = col("#8a96a2", 0.6);
  const chrome = col("#d8dde4", 0.18, 1.0, 1.3), steel = col("#b8bec6", 0.32, 0.9, 1.2), porcelain = col("#f4f4f2", 0.25, 0, 1.1);
  const copper = col("#c87a4a", 0.3, 0.8, 1.1), pvc = col("#e8e8e2", 0.5);
  const wood = mat("brown_planks_05", 1.0, "#a87a52");
  const glassM = new THREE.MeshStandardMaterial({ color: "#c8dcec", roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false });

  // ===================== GROUND: yards, street, sidewalks, snowbanks =====================
  mb.span([-34, -0.05, -24], [34, 0, 7], snowM);                    // the north yards (snow)
  mb.span([-34, -0.05, 7], [34, 0.06, 9], walk);                    // north sidewalk
  mb.span([-34, -0.05, 9], [34, 0.01, 15], road);                   // the street
  mb.span([-34, -0.05, 15], [34, 0.06, 17], walk);                  // south sidewalk
  mb.span([-34, -0.05, 17], [34, 0, 40], snowM);                    // the south yards
  const bank = new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2);
  for (let i = 0; i < 26; i++) { const x = -30 + i * 2.4 + (hsh(i, 3) - 0.5); for (const z of [9.15, 14.85]) mb.add(bank, snowM, [x, 0, z], [0, hsh(i, z) * 3, 0], [1.4 + hsh(i, 5) * 0.8, 0.35 + hsh(i, 7) * 0.25, 0.55]); }
  // soft drifts in the yards (not inside the side-yard path of the fence, not on the shovelled paths)
  for (let i = 0; i < 18; i++) { const x = -26 + hsh(i, 11) * 52, z = -16 + hsh(i, 13) * 9; mb.add(bank, snowM, [x, 0, z], [0, i, 0], [1 + hsh(i, 2), 0.18 + hsh(i, 4) * 0.2, 0.8 + hsh(i, 6)]); }
  for (let i = 0; i < 10; i++) { const x = -26 + hsh(i, 21) * 52, z = 26 + hsh(i, 23) * 10; mb.add(bank, snowM, [x, 0, z], [0, i, 0], [1 + hsh(i, 2), 0.18 + hsh(i, 4) * 0.2, 0.8 + hsh(i, 6)]); }

  // ===================== A HOUSE (clapboard box, gable roof along x, porch on the street side) =====================
  type Hole = { axis: "x" | "z"; at: number; a0: number; a1: number; y0: number; y1: number };
  const eaves: { x0: number; x1: number; z: number; y: number }[] = [];
  const house = (x0: number, x1: number, z0: number, z1: number, side: THREE.Material, holes: Hole[], front: number, inner: THREE.Material, facing: 1 | -1, skip: ("x0" | "x1")[] = []) => {
    const WT = 0.14;
    const wall = (axis: "x" | "z", at: number, a0: number, a1: number) => {
      const hs = holes.filter((h) => h.axis === axis && Math.abs(h.at - at) < 0.01).sort((p, q) => p.a0 - q.a0);
      const span = (u0: number, u1: number, y0: number, y1: number) => {
        if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return;
        if (axis === "x") mb.span([at - WT / 2, y0, u0], [at + WT / 2, y1, u1], side); else mb.span([u0, y0, at - WT / 2], [u1, y1, at + WT / 2], side);
      };
      let u = a0;
      for (const h of hs) { span(u, h.a0, 0, H); span(h.a0, h.a1, 0, h.y0); span(h.a0, h.a1, h.y1, H); u = h.a1;
        if (axis === "x") { mb.span([at - 0.1, h.y0 - 0.06, h.a0 - 0.08], [at + 0.1, h.y0, h.a1 + 0.08], trim); mb.span([at - 0.1, h.y1, h.a0 - 0.08], [at + 0.1, h.y1 + 0.08, h.a1 + 0.08], trim); }
        else { if (h.y0 > FLR + 0.01) mb.span([h.a0 - 0.08, h.y0 - 0.06, at - 0.1], [h.a1 + 0.08, h.y0, at + 0.1], trim); mb.span([h.a0 - 0.08, h.y1, at - 0.1], [h.a1 + 0.08, h.y1 + 0.08, at + 0.1], trim);
          for (const a of [h.a0 - 0.08, h.a1]) mb.span([a, h.y0, at - 0.1], [a + 0.08, h.y1, at + 0.1], trim); } }
      span(u, a1, 0, H);
    };
    wall("z", z1, x0, x1); wall("z", z0, x0, x1);
    if (!skip.includes("x0")) wall("x", x0, z0, z1);
    if (!skip.includes("x1")) wall("x", x1, z0, z1);
    // corner boards
    for (const x of [x0, x1]) for (const z of [z0, z1]) mb.span([x - 0.1, 0, z - 0.1], [x + 0.1, H, z + 0.1], trim);
    // foundation, floor, ceiling
    mb.span([x0, 0, z0], [x1, FLR, z1], col("#9a948c", 0.9));
    mb.span([x0 + 0.07, FLR - 0.02, z0 + 0.07], [x1 - 0.07, FLR, z1 - 0.07], inner);
    mb.span([x0, H - 0.05, z0], [x1, H, z1], col("#f4f0e6", 0.8));
    // the gable roof: ridge along x, overhang ov; the planes meet the wall tops at y H
    const hd = (z1 - z0) / 2, zm = (z0 + z1) / 2, rise = 1.5, ov = 0.45, a = Math.atan2(rise, hd), runO = hd + ov, L = Math.hypot(runO, (rise * runO) / hd);
    const eaveY = H - (rise * ov) / hd, cy = H + rise - (rise * runO) / (2 * hd);
    for (const s of [-1, 1]) {
      mb.add(new THREE.BoxGeometry(x1 - x0 + 0.9, 0.08, L), roofM, [(x0 + x1) / 2, cy, zm + s * (runO / 2)], [s * a, 0, 0]);
      mb.add(new THREE.BoxGeometry(x1 - x0 + 0.8, 0.1, L * 0.94), snowRoof, [(x0 + x1) / 2, cy + 0.09 * Math.cos(a), zm + s * (runO / 2) + s * 0.09 * Math.sin(a)], [s * a, 0, 0]);
      const gz = zm + s * (runO - 0.03);
      mb.add(cylM(0.06, 0.06, x1 - x0 + 0.9, 8, true).rotateZ(Math.PI / 2), col("#9aa0a8", 0.4, 0.6), [(x0 + x1) / 2, eaveY - 0.07, gz]);
      eaves.push({ x0: x0 - 0.4, x1: x1 + 0.4, z: gz, y: eaveY - 0.12 });
    }
    for (const x of [x0, x1]) { const sh = new THREE.Shape([new THREE.Vector2(z0 - zm, 0), new THREE.Vector2(z1 - zm, 0), new THREE.Vector2(0, rise)]);
      const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }); eg.rotateY(Math.PI / 2); mb.add(eg, side, [x - 0.07, H, zm]); }
    // a chimney
    mb.span([x1 - 1.6, H + 0.6, zm - 0.9], [x1 - 1.0, H + 2.1, zm - 0.3], mat("brown_planks_05", 0.5, "#8a4a3a"));
    // the porch on the street side: deck, two steps, two posts, rails, a little roof with snow, the front door
    const fz = facing > 0 ? z1 : z0, f = facing, px0 = front - 1.8, px1 = front + 1.8;
    sp([px0, 0, fz], [px1, FLR + 0.1, fz + f * 1.6], wood);
    for (let k = 0; k < 2; k++) sp([front - 0.7, 0, fz + f * (1.6 + k * 0.3)], [front + 0.7, FLR + 0.1 - (k + 1) * 0.13, fz + f * (1.9 + k * 0.3)], wood);
    const pT = eaveY - 0.27;
    for (const x of [px0 + 0.1, px1 - 0.1]) sp([x - 0.06, FLR, fz + f * 1.45], [x + 0.06, pT, fz + f * 1.57], trim);
    for (const r of [[px0 + 0.1, front - 0.75], [front + 0.75, px1 - 0.1]]) sp([r[0], FLR + 0.85, fz + f * 1.48], [r[1], FLR + 0.92, fz + f * 1.55], trim);
    mb.add(new THREE.BoxGeometry(3.8, 0.08, 1.9), roofM, [front, eaveY - 0.2, fz + f * 0.9], [0.15 * f, 0, 0]);
    mb.add(new THREE.BoxGeometry(3.7, 0.08, 1.8), snowRoof, [front, eaveY - 0.13, fz + f * 0.9], [0.15 * f, 0, 0]);
    sp([front - 0.45, FLR, fz - 0.03], [front + 0.45, FLR + 2.05, fz + 0.03], col(f > 0 ? "#7a3a2a" : "#2a4a5a", 0.6));
    mb.add(new THREE.SphereGeometry(0.03, 8, 6), col("#c8a040", 0.3, 0.8), [front + 0.33, FLR + 1.0, fz + f * 0.05]);
    return { eaveY };
  };
  const winF = (x: number, z: number): Hole => ({ axis: "z", at: z, a0: x - 0.7, a1: x + 0.7, y0: FLR + 0.9, y1: FLR + 2.1 });
  const door = (x: number, z: number): Hole => ({ axis: "z", at: z, a0: x - 0.45, a1: x + 0.45, y0: FLR, y1: FLR + 2.05 });
  house(3, 11, -6, 0, sideY, [winF(4.5, 0), winF(8.9, 0), door(6.2, 0)], 6.2, lino, 1, ["x0"]);
  house(-11, -3, -6, 0, sideB, [winF(-4.5, 0), winF(-8.9, 0), door(-7.0, 0)], -7.0, linoN, 1, ["x1"]);
  house(-10, -2, 18, 24, sideW, [winF(-8.5, 18), winF(-3.5, 18), door(-6.2, 18)], -6.2, lino, -1);
  house(2, 10, 18, 24, sideG, [winF(3.5, 18), winF(8.5, 18), door(6.4, 18)], 6.4, lino, -1);
  house(13, 19, -6, 0, sideR, [winF(14.4, 0), winF(17.6, 0), door(16, 0)], 16, lino, 1);
  house(-19, -13, -6, 0, sideP, [winF(-17.6, 0), winF(-14.4, 0), door(-16, 0)], -16, lino, 1);
  house(12, 18, 18, 24, sideP, [winF(13.4, 18), winF(16.6, 18), door(15, 18)], 15, lino, -1);
  house(-18, -12, 18, 24, sideR, [winF(-16.6, 18), winF(-13.4, 18), door(-15, 18)], -15, lino, -1);
  // shovelled paths from each porch to the sidewalk
  for (const x of [6.2, -7.0, 16, -16]) mb.span([x - 0.6, 0.0, 1.9], [x + 0.6, 0.012, 7], walk);
  for (const x of [-6.2, 6.4, 15, -15]) mb.span([x - 0.6, 0.0, 17], [x + 0.6, 0.012, 16.1 + 0.01], walk);

  // ===================== THE TWO KITCHEN WALLS (x 3 and x -3), built by hand: the window and the section under the sink =====================
  // s = the side the room is on (+1: the old man's room is at x > 3; -1: the neighbour's at x < -3). The outer 4 cm of the
  // wall (clapboard) always stays; the inner 10 cm and the paint of the section are a separate group that slices away.
  const kitWall = (xw: number, s: 1 | -1, side: THREE.Material, coatM: THREE.Material) => {
    const o0 = xw - s * 0.07, o1 = xw - s * 0.03, i1 = xw + s * 0.07, c1 = xw + s * 0.08;   // outer face, outer/inner split, inner face, paint face
    const full = (z0: number, z1: number, y0: number, y1: number) => { sp([o0, y0, z0], [i1, y1, z1], side); sp([i1, Math.max(y0, FLR), z0], [c1, y1, z1], coatM); };
    full(-6, -4.6, 0, H); full(-3.2, 0, 0, H);
    full(-4.6, -3.2, WIN_Y1, H);                          // above the window
    full(-4.6, SEC_Z0, 0, WIN_Y0); full(SEC_Z1, -3.2, 0, WIN_Y0);
    full(SEC_Z0, SEC_Z1, SEC_Y1, WIN_Y0);                 // behind the basin
    // the section under the sink: its inner board (the back of the plaster) and the room-side paint always stay
    const bd = xw + s * 0.03, board = col("#d8d0c0", 0.9);
    sp([bd, 0, SEC_Z0], [i1, SEC_Y1, SEC_Z1], board); sp([i1, FLR, SEC_Z0], [c1, SEC_Y1, SEC_Z1], coatM);
    // window trim inside and out + a sill
    for (const x of [[o0 - s * 0.03, o0], [c1, c1 + s * 0.03]] as [number, number][]) {
      sp([x[0], WIN_Y0 - 0.06, -4.68], [x[1], WIN_Y0, -3.12], trim); sp([x[0], WIN_Y1, -4.68], [x[1], WIN_Y1 + 0.08, -3.12], trim);
      sp([x[0], WIN_Y0, -4.68], [x[1], WIN_Y1, -4.6], trim); sp([x[0], WIN_Y0, -3.2], [x[1], WIN_Y1, -3.12], trim); }
    sp([o0, WIN_Y0 - 0.02, -4.6], [c1 + s * 0.08, WIN_Y0, -3.2], trim);
    // the section's OUTER skin (the clapboard, seen from the side yard) is a separate group that slices away (scaled down from
    // the top, anchored at the ground): behind it the pipe in the wall cavity, the studs, frost on the cold board
    const secG = new THREE.Group(); root.add(secG);
    const sb = new MB();
    sp([o0, 0, SEC_Z0], [bd, SEC_Y1, SEC_Z1], side, sb);
    sb.flush(secG);
    const openG = new THREE.Group(); openG.visible = false; root.add(openG);
    const ob = new MB(), face = col("#efe6d2", 0.9), stud = mat("brown_planks_05", 0.6, "#d8b080"), ins = col("#f2c48a", 0.95);
    sp([o0, 0, SEC_Z0 - 0.01], [bd, SEC_Y1, SEC_Z0 + 0.012], face, ob); sp([o0, 0, SEC_Z1 - 0.012], [bd, SEC_Y1, SEC_Z1 + 0.01], face, ob);   // the cut ends of the skin
    sp([o0, SEC_Y1 - 0.012, SEC_Z0], [bd, SEC_Y1 + 0.01, SEC_Z1], face, ob);
    for (const z of [SEC_Z0 + 0.03, SEC_Z1 - 0.03]) sp([o0 + s * 0.01, 0, z - 0.025], [bd, SEC_Y1 - 0.012, z + 0.025], stud, ob);        // two studs
    sp([o0 + s * 0.01, 0, SEC_Z0 + 0.055], [bd, 0.05, SEC_Z1 - 0.055], stud, ob);                                                         // the sole plate
    for (const z of [SEC_Z0 + 0.075, SEC_Z1 - 0.075]) sp([bd - s * 0.012, 0.05, z - 0.02], [bd, SEC_Y1 - 0.012, z + 0.02], ins, ob);     // insulation edges
    ob.flush(openG);
    const frostSkin = new THREE.Mesh(new THREE.PlaneGeometry(SEC_Z1 - SEC_Z0 - 0.16, SEC_Y1 - 0.1), new THREE.MeshBasicMaterial({ map: frostTex, transparent: true, opacity: 0.75, depthWrite: false }));
    frostSkin.position.set(bd - s * 0.002, SEC_Y1 / 2, (SEC_Z0 + SEC_Z1) / 2); frostSkin.rotation.y = -s * Math.PI / 2; frostSkin.layers.set(NOINK); openG.add(frostSkin);
    return { secG, openG };
  };
  // window frost (decal) texture, shared
  const frostTex = ctex("drFrost", 256, 256, (g, r) => { g.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 1100; i++) { const x = r() * 256, y = r() * 256, d = Math.min(x, y, 256 - x, 256 - y); if (r() > 1.4 - d / 80) continue;
      g.strokeStyle = `rgba(240,248,255,${0.25 + r() * 0.5})`; g.lineWidth = 1 + r() * 1.5; g.beginPath(); g.moveTo(x, y); const a = r() * TAU; g.lineTo(x + Math.cos(a) * (6 + r() * 16), y + Math.sin(a) * (6 + r() * 16)); g.stroke(); } });
  const kwO = kitWall(3, 1, sideY, wallIn), kwN = kitWall(-3, -1, sideB, wallInN);

  // glass in every window; front windows glow warm from inside at night (c.winLit lights the far ones in order)
  const winGlow: { m: THREE.Mesh; order: number }[] = [];
  const pane = (p: V3, w: number, h: number, yaw: number, order: number | null) => {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassM); g.position.set(...p); g.rotation.y = yaw; root.add(g);
    if (order !== null) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.96), new THREE.MeshBasicMaterial({ color: "#ffcf80", transparent: true, opacity: 0, depthWrite: false }));
      m.position.set(p[0] - Math.sin(yaw) * 0.03, p[1], p[2] - Math.cos(yaw) * 0.03); m.rotation.y = yaw; m.layers.set(NOINK); root.add(m); winGlow.push({ m, order }); }
  };
  const kGlass = [glassM.clone(), glassM.clone()];
  for (const [i, p, yaw] of [[0, DR0.OLD_WIN, Math.PI / 2], [1, DR0.NBR_WIN, -Math.PI / 2]] as [number, V3, number][]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(1.4, WIN_Y1 - WIN_Y0), kGlass[i]); g.position.set(...p); g.rotation.y = yaw; root.add(g); }
  // order: -1 = always lit at night (the two leads' fronts); 0.. = the ending's sequence, near to far
  for (const [x, z, yaw, o] of [[4.5, 0.03, 0, -1], [8.9, 0.03, 0, -1], [-4.5, 0.03, 0, -1], [-8.9, 0.03, 0, -1],
    [-3.5, 17.97, Math.PI, 0], [3.5, 17.97, Math.PI, 1], [-8.5, 17.97, Math.PI, 2], [8.5, 17.97, Math.PI, 3],
    [14.4, 0.03, 0, 4], [-14.4, 0.03, 0, 5], [13.4, 17.97, Math.PI, 6], [-13.4, 17.97, Math.PI, 7],
    [17.6, 0.03, 0, 8], [-17.6, 0.03, 0, 9], [16.6, 17.97, Math.PI, 10], [-16.6, 17.97, Math.PI, 11]] as [number, number, number, number][])
    pane([x, FLR + 1.5, z], 1.4, 1.2, yaw, o);
  const frostMs = [0, 1].map(() => new THREE.MeshBasicMaterial({ map: frostTex, transparent: true, opacity: 0, depthWrite: false }));
  for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.38, WIN_Y1 - WIN_Y0 - 0.02), frostMs[s > 0 ? 0 : 1]); f.position.set(s * 3.0 + s * 0.035, (WIN_Y0 + WIN_Y1) / 2, -3.9); f.rotation.y = s * Math.PI / 2; f.layers.set(NOINK); root.add(f); }

  // ===================== THE TWO KITCHENS =====================
  // interior partitions with doorways (x 7.5 / -7.5 and z -1.5) and paint on the back wall
  const part = (axis: "x" | "z", at: number, a0: number, a1: number, dr: [number, number], m: THREE.Material) => {
    const s = (u0: number, u1: number, y0: number, y1: number) => axis === "x" ? mb.span([at - 0.05, y0, u0], [at + 0.05, y1, u1], m) : mb.span([u0, y0, at - 0.05], [u1, y1, at + 0.05], m);
    s(a0, dr[0], FLR, H); s(dr[1], a1, FLR, H); s(dr[0], dr[1], FLR + 2.1, H);
  };
  part("x", 7.5, -6, -1.5, [-3.0, -2.1], wallIn); part("z", -1.5, 3, 7.5, [5.6, 6.5], wallIn);
  part("x", -7.5, -6, -1.5, [-3.0, -2.1], wallInN); part("z", -1.5, -7.5, -3, [-6.5, -5.6], wallInN);
  mb.span([3, FLR, -5.93], [7.5, H, -5.92], wallIn); mb.span([-7.5, FLR, -5.93], [-3, H, -5.92], wallInN);
  // a skirting board along the kitchen walls
  mb.span([3.08, FLR, -5.92], [7.45, FLR + 0.1, -5.9], trim); mb.span([-7.45, FLR, -5.92], [-3.08, FLR + 0.1, -5.9], trim);

  // counters along the outside walls with the open farmhouse sink in the middle
  const sinkRun = (s: 1 | -1, cm: THREE.Material) => {
    const xa = s * 3.08, xb = s * 3.72, lo = Math.min(xa, xb), hi = Math.max(xa, xb), fr = s > 0 ? hi : lo;
    sp([lo, FLR, -5.7], [hi, CT - 0.04, SEC_Z0 - 0.03], cm); sp([lo, FLR, SEC_Z1 + 0.03], [hi, CT - 0.04, -2.0], cm);       // the cabinets either side
    sp([lo, CT - 0.04, -5.72], [hi + 0.02, CT, SEC_Z0 - 0.01], counter); sp([lo, CT - 0.04, SEC_Z1 + 0.01], [hi + 0.02, CT, -1.98], counter);
    // the basin: a deep porcelain box (apron front) between the cabinets; open underneath
    const b0 = lo + 0.06, b1 = hi - 0.04, bz0 = SEC_Z0 - 0.01, bz1 = SEC_Z1 + 0.01, bot = CT - 0.25;
    sp([b0, bot, bz0], [b1, bot + 0.03, bz1], porcelain);
    sp([b0, bot, bz0], [b1, CT, bz0 + 0.03], porcelain); sp([b0, bot, bz1 - 0.03], [b1, CT, bz1], porcelain);
    sp([b0, bot, bz0], [b0 + 0.03, CT, bz1], porcelain); sp([b1 - 0.03, bot, bz0], [b1, CT, bz1], porcelain);
    sp([lo, CT - 0.02, bz0], [b0, CT, bz1], counter);                                    // the deck strip the tap stands on
    mb.add(cylM(0.035, 0.035, 0.01, 12), steel, [(b0 + b1) / 2, bot + 0.035, -3.9]);   // the drain
    // the trap under the basin, back into the wall
    const tx = (b0 + b1) / 2;
    mb.add(cylM(0.022, 0.022, 0.16, 10), pvc, [tx, bot - 0.08, -3.9]);
    mb.add(new THREE.TorusGeometry(0.05, 0.022, 8, 14, Math.PI).rotateY(Math.PI / 2), pvc, [tx, bot - 0.16, -3.85]);
    mb.add(cylM(0.022, 0.022, Math.abs(tx - s * 3.07), 10).rotateZ(Math.PI / 2), pvc, [(tx + s * 3.07) / 2, bot - 0.12, -3.8]);
    // cabinet knobs
    for (const z of [-5.35, -4.85, -3.1, -2.6]) mb.add(new THREE.SphereGeometry(0.02, 6, 4), chrome, [fr + s * 0.02, CT - 0.18, z]);
    // the supply pipe as you see it in the room: out of the wall low under the basin, a shutoff valve, up to the tap
    const px = s * 3.13, yOut = SEC_Y1 - 0.22;
    mb.add(cylM(0.014, 0.014, 0.07, 10).rotateZ(Math.PI / 2), copper, [s * 3.1, yOut, -3.98]);
    mb.add(cylM(0.014, 0.014, CT - yOut - 0.02, 10), copper, [px, (CT + yOut) / 2 - 0.01, -3.98]);
    mb.add(new THREE.SphereGeometry(0.024, 10, 8), chrome, [px, yOut + 0.05, -3.98]);
    mb.add(new THREE.BoxGeometry(0.05, 0.012, 0.03), col("#c82a2a", 0.5), [px + s * 0.03, yOut + 0.05, -3.98]);
  };
  sinkRun(1, cab); sinkRun(-1, cabN);

  // THE OLD MAN'S TAP: a chrome gooseneck on the deck strip, one lever (c.tapO turns it)
  const T0x = 3.12;
  const goose = new THREE.CatmullRomCurve3([new THREE.Vector3(T0x, CT, -3.9), new THREE.Vector3(T0x, CT + 0.32, -3.9), new THREE.Vector3(T0x + 0.07, CT + 0.45, -3.9), new THREE.Vector3(3.3, CT + 0.46, -3.9), new THREE.Vector3(3.4, CT + 0.42, -3.9), new THREE.Vector3(DR0.TAP_O[0], DR0.TAP_O[1] + 0.025, -3.9)]);
  mb.add(new THREE.TubeGeometry(goose, 28, 0.018, 10, false), chrome); mb.add(cylM(0.035, 0.04, 0.05, 14), chrome, [T0x, CT + 0.025, -3.9]);
  mb.add(cylM(0.02, 0.017, 0.03, 10), chrome, [DR0.TAP_O[0], DR0.TAP_O[1] + 0.012, -3.9]);
  const leverO = new THREE.Group(); leverO.position.set(T0x, CT + 0.2, -3.9); root.add(leverO);
  { const m = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.15).translate(0, 0, 0.075), chrome); m.castShadow = true; leverO.add(m);
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12), chrome); k.rotation.x = Math.PI / 2; k.position.z = 0.0; leverO.add(k); }
  // THE LOOPHOLE KEY (the channel's signature): a small brass key on a loop of red string, hung on his tap lever; it swings as
  // the lever turns and is in frame at the trick reveal (his open tap, 48.8 s)
  const keyG = new THREE.Group(); keyG.position.set(0, 0, 0.125); leverO.add(keyG);
  const keyPiv = new THREE.Group(); keyG.add(keyPiv);
  { const brass = new THREE.MeshStandardMaterial({ color: "#d2a642", roughness: 0.28, metalness: 0.9, envMapIntensity: 1.4 }), red = new THREE.MeshStandardMaterial({ color: "#c81e1e", roughness: 0.7 });
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0022, 6, 18), red); loop.rotation.y = Math.PI / 2; keyG.add(loop);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.05, 5).translate(0, -0.025, 0), red); str.position.y = -0.012; keyPiv.add(str);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0035, 8, 18), brass); bow.position.y = -0.073; keyPiv.add(bow);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.042, 0.004), brass); shaft.position.y = -0.105; keyPiv.add(shaft);
    for (const [y, w] of [[-0.118, 0.012], [-0.126, 0.008]] as [number, number][]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.005, 0.004), brass); b.position.set(w / 2, y, 0); keyPiv.add(b); }
    keyPiv.position.y = -0.012; keyPiv.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); }
  // THE NEIGHBOUR'S TAPS: a short spout and two cross handles (c.tapN cranks them shut)
  mb.add(cylM(0.04, 0.045, 0.06, 14), chrome, [-3.12, CT + 0.03, -3.9]);
  mb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-3.12, CT + 0.06, -3.9), new THREE.Vector3(-3.13, CT + 0.24, -3.9), new THREE.Vector3(-3.22, CT + 0.32, -3.9), new THREE.Vector3(DR0.TAP_N[0], DR0.TAP_N[1] + 0.025, -3.9)]), 16, 0.02, 10, false), chrome);
  const handlesN = [-4.1, -3.7].map((z) => { const g = new THREE.Group(); g.position.set(-3.12, CT + 0.11, z); root.add(g);
    mb.add(cylM(0.022, 0.022, 0.1, 10), chrome, [-3.12, CT + 0.05, z]);
    for (const a of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.018), chrome); m.rotation.y = a; m.castShadow = true; g.add(m); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), col(z < -3.9 ? "#c82a2a" : "#2a5ac8", 0.4)); cap.position.y = 0.012; g.add(cap);
    return g; });
  // the pipe wrench on his tap (c.wrenchN)
  const wrench = ph("pipe_wrench", [-3.2, CT + 0.13, -4.12], 0, { h: 0.34 }); wrench.rotation.set(0, Math.PI / 2, -0.4);

  // THE STEEL BUCKET in the old man's basin, with its water (c.bucketK)
  const BK = DR0.BUCKET, bucketG = new THREE.Group();
  { const prof = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.115, 0), new THREE.Vector2(0.125, 0.01), new THREE.Vector2(0.15, 0.26), new THREE.Vector2(0.16, 0.265), new THREE.Vector2(0.152, 0.27)];
    const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), new THREE.MeshStandardMaterial({ color: "#c4cad2", roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide, envMapIntensity: 1.2 }));
    bucketG.position.set(...BK); root.add(bucketG); m.castShadow = true; m.receiveShadow = true; bucketG.add(m);
    for (const z of [-0.155, 0.155]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), steel); e.position.set(0, 0.24, z); bucketG.add(e); }
    const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.004, 4, 24, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), steel); hdl.position.y = 0.24; bucketG.add(hdl); }   // the handle, laid down
  const waterM = new THREE.MeshStandardMaterial({ color: "#7aa8cc", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.85, envMapIntensity: 1.5 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), waterM); root.add(water);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#eef6ff", transparent: true, opacity: 0, depthWrite: false })); ripple.layers.set(NOINK); root.add(ripple);
  const ripple2 = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#eef6ff", transparent: true, opacity: 0, depthWrite: false })); ripple2.layers.set(NOINK); root.add(ripple2);
  // the falling drop, the bead hanging at the spout (grows, falls, freezes) and its frost
  const dropM = new THREE.MeshStandardMaterial({ color: "#dceeff", roughness: 0.02, transparent: true, opacity: 0.9, envMapIntensity: 2.2, emissive: "#3a5a7a", emissiveIntensity: 0.25 });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8).scale(1, 1.35, 1), dropM); root.add(drop);
  const beadM = dropM.clone();
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8).scale(1, 1.25, 1).translate(0, -0.011, 0), beadM); bead.position.set(...DR0.TAP_O); root.add(bead);
  const frostCap = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 6), new THREE.MeshStandardMaterial({ color: "#f2f8ff", roughness: 0.9, transparent: true, opacity: 0 })); frostCap.position.set(DR0.TAP_O[0], DR0.TAP_O[1] + 0.012, DR0.TAP_O[2]); root.add(frostCap);
  const dropN = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8).scale(1, 1.35, 1), dropM); root.add(dropN);

  // ===================== FURNITURE AND LIGHTS =====================
  ph("WoodenTable_02", DR0.TABLE, 0, { h: 0.78 });
  ph("dining_chair_02", [5.4, FLR, -4.2], 0, { h: 0.95 });
  ph("Rockingchair_01", DR0.ROCKER, -Math.PI / 2, { h: 1.05 });
  ph("vintage_electric_kettle", [3.4, CT, -5.1], Math.PI / 2, { h: 0.24 });
  ph("Shelf_01", [4.4, FLR + 1.6, -5.85], 0, { h: 0.5 });
  ph("painted_wooden_cabinet_02", [-6.4, FLR, -5.55], 0, { h: 1.9 });
  ph("WoodenTable_02", [-5.6, FLR, -3.7], 0, { h: 0.78 });
  ph("dining_chair_02", [-5.6, FLR, -2.85], Math.PI, { h: 0.95 });
  ph("alarm_clock_01", [-3.4, CT, -5.2], -Math.PI / 2, { h: 0.12 });
  ph("metal_toolbox", [-6.9, FLR, -4.9], 0.3, { h: 0.3 });
  type Fx = { g: THREE.Group; L: THREE.PointLight; gl: THREE.Sprite; base: number; bm: THREE.MeshBasicMaterial; on: THREE.Color; off: THREE.Color };
  const fixture = (p: V3, color: string, I: number, dist: number, kind: "pendant" | "tube" | "porch" | "street"): Fx => {
    const g = new THREE.Group(); g.position.set(...p); root.add(g);
    const on = new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.55), off = new THREE.Color("#8a8a86");
    const bm = new THREE.MeshBasicMaterial({ color: on.clone() });
    const put = (geo: THREE.BufferGeometry, m: THREE.Material, y = 0) => { const me = new THREE.Mesh(geo, m); me.position.y = y; me.castShadow = m !== bm; g.add(me); return me; };
    if (kind === "pendant") {
      put(cylM(0.006, 0.006, H - p[1], 5).translate(0, (H - p[1]) / 2, 0), col("#2a2a2a", 0.6));
      const prof = [[0.022, 0.07], [0.05, 0.06], [0.12, 0.01], [0.17, -0.07], [0.172, -0.075]].map(([x, y]) => new THREE.Vector2(x, y));
      put(new THREE.LatheGeometry(prof, 24), new THREE.MeshStandardMaterial({ color: "#2f5a46", roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide }));
      put(new THREE.SphereGeometry(0.045, 12, 8), bm, -0.05).layers.set(NOINK);
    } else if (kind === "tube") {
      put(new THREE.BoxGeometry(1.0, 0.06, 0.24), col("#e8e8e4", 0.5), 0.03);
      put(new THREE.BoxGeometry(0.94, 0.02, 0.18), bm, -0.005).layers.set(NOINK);
    } else if (kind === "porch") {
      put(new THREE.BoxGeometry(0.14, 0.2, 0.03), col("#2a2a2a", 0.5), 0.0).position.z = -0.08;
      put(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 12), bm, -0.02).layers.set(NOINK);
      put(new THREE.CylinderGeometry(0.07, 0.04, 0.04, 12), col("#2a2a2a", 0.5), 0.08);
    }
    const L = new THREE.PointLight(color, I, dist, 1.4); L.position.set(0, kind === "street" ? -0.15 : -0.12, kind === "porch" ? 0.08 : 0); g.add(L);
    const gl = glow(g, [0, kind === "tube" ? -0.02 : -0.05, 0], color, kind === "street" ? 0.9 : kind === "tube" ? 0.6 : 0.32);
    return { g, L, gl, base: I, bm, on, off };
  };
  const setFx = (f: Fx, k: number) => { f.L.intensity = f.base * k; f.L.visible = k > 0.01; (f.gl.material as THREE.SpriteMaterial).opacity = 0.85 * k; f.gl.visible = k > 0.01; f.bm.color.copy(f.off).lerp(f.on, cl(k)); };
  const penO = fixture([5.4, 2.35, -3.7], "#ffc070", 5, 7, "pendant");
  const tubeN = fixture([-5.4, H - 0.08, -3.7], "#e8f2ff", 4.5, 8, "tube");
  const porches = [fixture([5.55, 2.2, 0.12], "#ffb860", 2.2, 5, "porch"), fixture([-7.65, 2.2, 0.12], "#ffb860", 2.2, 5, "porch")];
  for (const x of [-13, 13]) ph("street_lamp_01", [x, 0, 8.2], 0, { h: 4.2 });
  const streetLights = [-13, 13].map((x) => fixture([x, 4.0, 8.6], "#ffd8a0", 6, 14, "street"));
  ph("covered_car", [-15, 0, 12.2], Math.PI / 2, { h: 1.45 });
  ph("metal_trash_can", [10.2, 0, 1.2], 0, { h: 0.9 }); ph("metal_trash_can", [-10.4, 0, 1.2], 0.6, { h: 0.9 });
  for (const x of [5.0, -8.4]) { mb.span([x - 0.03, 0, 7.3], [x + 0.03, 1.05, 7.36], col("#2a2a2a", 0.5)); mb.span([x - 0.12, 1.05, 7.15], [x + 0.12, 1.3, 7.6], col(x > 0 ? "#2a4a8a" : "#3a3a3a", 0.5, 0.3)); }
  // bare trees between the houses
  for (const [x, z, n] of [[-12, -8, 0], [12, -9, 1], [-20.5, 21, 2], [20.5, 22, 0], [0.4, 26, 1], [-1.5, -10, 0]] as [number, number, number][]) ph(n === 1 ? "pine_bare" : "oak_lite", [x, 0, z], hsh(x, z) * TAU, { h: n === 1 ? 7 : 6.5 });

  // ===================== THE FENCE (side yard) =====================
  for (let z = -6; z <= 2.01; z += 0.16) mb.add(new THREE.BoxGeometry(0.03, 0.95, 0.09), trim, [0, 0.47, z]);
  for (const y of [0.25, 0.75]) mb.span([-0.04, y, -6], [0.04, y + 0.07, 2], trim);
  mb.span([-0.06, 0.95, -6], [0.06, 1.0, 2], snowRoof);                    // a line of snow on the pickets' tops
  mb.span([-0.05, 0, -6], [0.05, 1.05, -5.9], trim); mb.span([-0.05, 0, 1.95], [0.05, 1.05, 2.05], trim);

  // ===================== ICICLES (c.thaw shrinks them) =====================
  const iceM = new THREE.MeshStandardMaterial({ color: "#dff0ff", roughness: 0.05, transparent: true, opacity: 0.8, envMapIntensity: 1.8 });
  const iceSpots: { p: V3; l: number }[] = [];
  for (const e of eaves) for (let x = e.x0; x < e.x1; x += 0.12) iceSpots.push({ p: [x + (hsh(x, e.z) - 0.5) * 0.05, e.y, e.z], l: 0.06 + 0.45 * hsh(x * 7, e.z) ** 2 });
  const icicles = new THREE.InstancedMesh(new THREE.ConeGeometry(0.028, 1, 6).rotateX(Math.PI).translate(0, -0.5, 0), iceM, iceSpots.length); root.add(icicles);
  const IM = new THREE.Matrix4(), IQ = new THREE.Quaternion(), IS = new THREE.Vector3(), IP = new THREE.Vector3();

  // ===================== WATER PARTICLES (points: one draw call per jet) =====================
  type Jet = { o: V3; d: V3; n: number; pts: THREE.Points; a: Float32Array };
  const jet = (o: V3, d: V3, n = 70, color = "#e8f4ff", size = 0.045): Jet => {
    const a = new Float32Array(n * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(a, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: dotTex(), size, color, transparent: true, opacity: 0.9, depthWrite: false }));
    pts.layers.set(NOINK); pts.frustumCulled = false; pts.renderOrder = 3; pts.visible = false; root.add(pts); return { o, d, n, pts, a };
  };
  const runJet = (J: Jet, k: number, t: number, sp2 = 1, g = 4.9) => {
    J.pts.visible = k > 0.001; if (!J.pts.visible) return;
    for (let i = 0; i < J.n; i++) { const u = (t * 1.6 * sp2 + i / J.n) % 1, jit = (hsh(i, 7) - 0.5) * 0.5, jz = (hsh(i, 9) - 0.5) * 0.35, jy = (hsh(i, 5) - 0.5) * 0.3;
      let y = J.o[1] + J.d[1] * (1 + jy) * k * u - g * u * u * 0.55; if (y < 0.01) y = -5;
      J.a.set([J.o[0] + J.d[0] * (1 + jit * 0.3) * k * u, y, J.o[2] + (J.d[2] + jz) * u], i * 3); }
    (J.pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  };
  // the street jets (the hook's flash-forward): the neighbour's side wall and the houses across the street
  const streetJets = [jet([-2.92, 0.7, -2.2], [1.6, 1.4, 0.2], 90, "#e8f4ff", 0.07), jet([-2.92, 1.4, -5.2], [1.4, 1.0, -0.1], 80, "#e8f4ff", 0.07), jet([-2.0, 0.9, 20.5], [1.5, 1.2, 0.1], 80, "#e8f4ff", 0.08), jet([2.0, 1.2, 21.5], [-1.5, 1.1, -0.2], 80, "#e8f4ff", 0.08), jet([-11.08, 0.8, -3.0], [-1.4, 1.2, 0.1], 70, "#e8f4ff", 0.07)];
  // the neighbour's kitchen: the wall under his sink bursts and sprays across his floor (-x)
  const BURST: V3 = [-3.1, FLR + 0.38, -3.95];
  const kitJets = [jet(BURST, [-1.9, 0.9, 0.15], 110), jet([BURST[0], BURST[1] - 0.08, BURST[2] + 0.12], [-1.6, 0.5, -0.25], 80)];
  const crackTex = ctex("drCrack", 256, 256, (g, r) => { g.clearRect(0, 0, 256, 256); g.strokeStyle = "rgba(40,34,30,0.95)"; g.lineCap = "round";
    for (let k = 0; k < 7; k++) { let x = 128, y = 128; const a0 = (k / 7) * TAU + r() * 0.5; g.lineWidth = 5 - k * 0.4; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { const a = a0 + (r() - 0.5) * 0.9; x += Math.cos(a) * (14 + r() * 10); y += Math.sin(a) * (14 + r() * 10); g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = "rgba(30,24,20,1)"; g.beginPath(); g.ellipse(128, 128, 22, 16, 0.3, 0, TAU); g.fill(); });
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false })); crack.position.set(-3.087, BURST[1], BURST[2]); crack.rotation.y = -Math.PI / 2; root.add(crack);
  // the flood on the neighbour's floor (c.wetN)
  const flood = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#a8c8e0", roughness: 0.03, metalness: 0.2, transparent: true, opacity: 0.55, envMapIntensity: 1.6, depthWrite: false }));
  flood.position.set(-3.9, FLR + 0.006, -3.9); flood.layers.set(NOINK); root.add(flood);

  // ===================== THE CUTAWAYS (the pipe inside each wall section) =====================
  const YB = 0.06, YW = SEC_Y1 - 0.22;   // the pipe rises in the wall from YB to YW, then leaves the wall into the room
  const cut = (s: 1 | -1, kw: ReturnType<typeof kitWall>) => {
    const g = new THREE.Group(); g.visible = false; root.add(g);
    const xw = s * 3.0 - s * 0.01, R = 0.036;
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(xw, YB, -3.98), new THREE.Vector3(xw, YW - 0.05, -3.98), new THREE.Vector3(xw + s * 0.04, YW, -3.98), new THREE.Vector3(s * 3.1, YW, -3.98)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 40, R, 16, false), new THREE.MeshStandardMaterial({ color: "#e89a6a", roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide })));
    const waterC = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.78, R * 0.78, 1, 14).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: "#2f86e0", roughness: 0.1, emissive: "#0a3a7a", emissiveIntensity: 0.35 }));
    const iceC = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, 1, 14).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: "#f2faff", roughness: 0.5, emissive: "#a8d4f8", emissiveIntensity: 0.4 }));
    waterC.position.set(xw, YB, -3.98); iceC.position.set(xw, YB, -3.98); g.add(waterC, iceC);
    // the water in the room part (to the tap): always full
    const swell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 16, 10).scale(1, 2.4, 1), new THREE.MeshStandardMaterial({ color: "#d88a5a", roughness: 0.25, metalness: 0.6 }));
    swell.position.set(xw, YW - 0.16, -3.98); g.add(swell);
    const split = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.11), new THREE.MeshBasicMaterial({ color: "#121212" })); split.position.set(xw - s * R * 1.12, YW - 0.16, -3.98); split.rotation.y = -s * Math.PI / 2; g.add(split);
    return { g, kw, waterC, iceC, swell, split, xw };
  };
  const cutN = cut(-1, kwN), cutO = cut(1, kwO);
  const splitJet = jet([-3.0 + 0.06, YW - 0.16, -3.98], [1.0, 0.55, 0.25], 60);

  // ===================== THE KETCHUP BOTTLE (the comparison) =====================
  const KT = DR0.KETCHUP;
  const ketG = new THREE.Group(); ketG.position.set(...KT); root.add(ketG);
  { const prof = [[0, 0], [0.035, 0], [0.042, 0.01], [0.044, 0.1], [0.04, 0.15], [0.022, 0.18], [0.016, 0.2], [0.0, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), new THREE.MeshStandardMaterial({ color: "#c41e1a", roughness: 0.25, envMapIntensity: 1.2 })); body.castShadow = true; ketG.add(body);
    const lbl = ctex("drKetLbl", 256, 128, (g) => { g.fillStyle = "#f6f0e2"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#c41e1a"; g.font = "900 44px DejaVu Sans, Arial"; g.textAlign = "center"; g.fillText("TOMATO", 128, 56); g.font = "700 30px DejaVu Sans, Arial"; g.fillText("KETCHUP", 128, 98); });
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0445, 0.0445, 0.06, 24, 1, true), new THREE.MeshStandardMaterial({ map: lbl, roughness: 0.8 })); lab.position.y = 0.075; ketG.add(lab);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.03, 16), col("#f4f4f2", 0.4)); cap.position.y = 0.212; ketG.add(cap); }
  const ketSplat = jet([KT[0] + 0.045, KT[1] + 0.09, KT[2]], [0.6, 0.35, 0.05], 30, "#c41e1a", 0.03);

  // ===================== THE WALL CLOCK (c.clockH) =====================
  const CK = DR0.CLOCK;
  { const face = ctex("drClock", 256, 256, (g) => { g.fillStyle = "#fbf6e8"; g.beginPath(); g.arc(128, 128, 124, 0, TAU); g.fill(); g.strokeStyle = "#3a2a20"; g.lineWidth = 10; g.stroke();
      g.fillStyle = "#2a2a2a"; g.font = "700 30px DejaVu Serif, Georgia"; g.textAlign = "center"; g.textBaseline = "middle";
      for (let h = 1; h <= 12; h++) { const a = (h / 12) * TAU - Math.PI / 2; g.fillText(String(h), 128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92); } });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ map: face, roughness: 0.7 })); disc.position.set(CK[0] - 0.03, CK[1], CK[2]); disc.rotation.y = -Math.PI / 2; root.add(disc);
    mb.add(new THREE.TorusGeometry(0.205, 0.018, 8, 32).rotateY(Math.PI / 2), wood, [CK[0] - 0.03, CK[1], CK[2]]); }
  const hand = (len: number, w: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.006).translate(0, len / 2, 0), col("#1a1a1a", 0.5)); const g = new THREE.Group(); g.position.set(CK[0] - 0.045, CK[1], CK[2]); g.rotation.y = -Math.PI / 2; g.add(m); root.add(g); return m; };
  const hHand = hand(0.1, 0.018), mHand = hand(0.15, 0.01);

  // ===================== THE THERMOMETER (on the neighbour's window, read from inside) =====================
  { const T = DR0.THERMO, face = ctex("drThermo", 256, 256, (g) => {
      g.fillStyle = "#f4f2ea"; g.beginPath(); g.arc(128, 128, 122, 0, TAU); g.fill(); g.strokeStyle = "#8a8a8a"; g.lineWidth = 8; g.stroke();
      g.strokeStyle = "#2a2a2a"; g.lineWidth = 3; g.fillStyle = "#2a2a2a"; g.font = "700 22px DejaVu Sans, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
      for (let v = -40; v <= 40; v += 10) { const a = Math.PI * 0.75 + ((v + 40) / 80) * Math.PI * 1.5; g.beginPath(); g.moveTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); g.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); g.stroke(); g.fillText(String(v), 128 + Math.cos(a) * 76, 128 + Math.sin(a) * 76); }
      g.fillStyle = "#1a4a8a"; g.font = "900 34px DejaVu Sans, Arial"; g.fillText("-20", 128, 186);
      const a = Math.PI * 0.75 + (20 / 80) * Math.PI * 1.5; g.strokeStyle = "#c8201a"; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); g.stroke();
      g.fillStyle = "#c8201a"; g.beginPath(); g.arc(128, 128, 9, 0, TAU); g.fill(); });
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.11, 32), new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 })); m.position.set(T[0] + (s > 0 ? 0.11 : 0), T[1], T[2]); m.rotation.y = (s * Math.PI) / 2; root.add(m); }
    mb.add(new THREE.CylinderGeometry(0.113, 0.113, 0.11, 32, 1, true).rotateZ(Math.PI / 2), chrome, [T[0] + 0.055, T[1], T[2]]); }

  // ===================== THE DRIPPY SIGN (c.sign: held at signX/signZ, planted at 1) =====================
  const signG = new THREE.Group(); root.add(signG);
  { const tex = ctex("drDrippy", 512, 256, (g) => { g.fillStyle = "#f4ead2"; g.fillRect(0, 0, 512, 256); g.strokeStyle = "#2a4a8a"; g.lineWidth = 10; g.strokeRect(10, 10, 492, 236);
      g.fillStyle = "#2a4a8a"; g.font = "900 104px DejaVu Sans, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("DRIPPY", 230, 132);
      g.fillStyle = "#3a8ad8"; g.beginPath(); g.moveTo(448, 70); g.bezierCurveTo(420, 120, 418, 150, 448, 170); g.bezierCurveTo(478, 150, 476, 120, 448, 70); g.fill(); });
    const sb = new MB(); signBoard(sb, signG, tex, 0.9, 0.45, [0, 0.95, 0], 0, 0.03); sb.span([-0.03, -0.2, -0.03], [0.03, 0.75, 0.03], wood); sb.flush(signG); }

  // ===================== SNOWFALL (points, outdoors only) =====================
  const NS = 900, snowA = new Float32Array(NS * 3), sd: { x: number; z: number; ph: number; v: number }[] = [];
  const indoors = (x: number, z: number) => HOUSES.some(([a, b, c, d]) => x > a - 0.6 && x < b + 0.6 && z > c - 0.6 && z < d + 0.6);
  for (let i = 0, k = 0; sd.length < NS && k < NS * 6; k++) { const x = -18 + hsh(k, 1) * 36, z = -9 + hsh(k, 2) * 33; if (indoors(x, z)) continue; sd.push({ x, z, ph: hsh(k, 3), v: 0.35 + hsh(k, 4) * 0.35 }); i++; }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute("position", new THREE.BufferAttribute(snowA, 3));
  const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: dotTex(), size: 0.045, color: "#ffffff", transparent: true, opacity: 0.9, depthWrite: false }));
  snowPts.layers.set(NOINK); snowPts.frustumCulled = false; snowPts.renderOrder = 3; root.add(snowPts);
  // thaw drips from the gutters (points)
  const thawJet = jet([0, 0, 0], [0, 0, 0], 120, "#e8f4ff", 0.035);
  const breath = mist(root, [0, -10, 0], 0.25, "#f4f8ff", 0);

  // ===================== STICK ARMS for the hand inserts (the cast's thin black limbs and dot hands, in 3D) =====================
  // c.armN 0/1, from the shoulder (armNsx/sy/sz, out of frame) to the hand (armNhx/hy/hz); one elbow bend (armNbend m)
  const inkM = new THREE.MeshBasicMaterial({ color: "#1a1418" });
  const arms = [0, 1].map(() => { const g = new THREE.Group(); g.visible = false; root.add(g);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 10).translate(0, 0.5, 0), inkM), lo = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 10).translate(0, 0.5, 0), inkM);
    const el = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), inkM), hd = new THREE.Mesh(new THREE.SphereGeometry(0.034, 16, 12), inkM);
    g.add(up, lo, el, hd); return { g, up, lo, el, hd }; });
  const Y = new THREE.Vector3(0, 1, 0);
  const seg = (m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) => { const d = b.clone().sub(a), L = d.length() || 1e-4; m.position.copy(a); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(Y, d.normalize()); };
  mb.flush(root);
  const marks: Record<string, V3> = { oldSink: DR0.OLD_SINK, nbrSink: DR0.NBR_SINK, oldPorch: DR0.OLD_PORCH, nbrFence: DR0.NBR_FENCE, oldFence: DR0.OLD_FENCE, woman: DR0.WOMAN_PORCH, shovel: DR0.SHOVEL, rocker: DR0.ROCKER, table: DR0.TABLE, nbrDoor: DR0.NBR_DOOR };
  const cams: SetDef["cams"] = { main: { pos: [0.5, 1.7, 12], look: [0, 1.4, -2], fov: 48 }, oldTap: { pos: [4.2, CT + 0.45, -3.4], look: [3.35, CT + 0.2, -3.9], fov: 44 }, nbrKitchen: { pos: [-6.6, 1.65, -2.2], look: [-3.3, 1.4, -3.9], fov: 46 }, oldCut: { pos: [5.6, 1.3, -3.4], look: [3.0, 0.75, -3.9], fov: 46 } };

  return { name: "dripset", root, marks, cams, sunW: { drNight: [0.4, 0.55, 0.73], dr3am: [0.3, 0.6, 0.74], drMorn: [0.85, 0.16, 0.5], drThaw: [0.35, 0.7, 0.62] },
    env: { drNight: { hdri: "rogland_moonlit_night", i: 0.32 }, dr3am: { hdri: "rogland_moonlit_night", i: 0.22 }, drMorn: { hdri: "winter_evening", i: 0.4 }, drThaw: { hdri: "snowy_field", i: 0.45 } },
    pose: (t, c, light) => {
      const night = light === "drNight" || light === "dr3am", am3 = light === "dr3am";
      // lights: his warm pendant (dim at 3 a.m.), the neighbour's cold tube, porches and street lamps at night
      setFx(penO, c.lampO ?? (am3 ? 0.35 : night ? 1 : 0)); setFx(tubeN, c.lampN ?? (night && !am3 ? 1 : 0));
      porches.forEach((p) => setFx(p, night ? 1 : 0)); streetLights.forEach((p) => setFx(p, night ? 1 : 0));
      const wl0 = c.winLit ?? 1, nOrd = 12;
      winGlow.forEach(({ m, order }) => { (m.material as THREE.MeshBasicMaterial).opacity = !night ? 0 : order < 0 ? (am3 ? 0.15 : 0.55) : 0.55 * cl(wl0 * nOrd - order) * (am3 ? 0.3 : 1); });
      const fr = c.frost ?? (night ? 0.6 : 0.2), gO = cl(c.glassO ?? 1), gN = cl(c.glassN ?? 1);
      frostMs[0].opacity = fr * gO; frostMs[1].opacity = fr * gN; kGlass[0].opacity = 0.16 * gO; kGlass[1].opacity = 0.16 * gN; kGlass[0].visible = gO > 0.01; kGlass[1].visible = gN > 0.01;
      // the old man's lever and his drip
      leverO.rotation.y = (c.tapO ?? 0) * 0.9;
      // the key hangs straight down from the lever (undo the lever's turn) and swings a little: more right after the lever moves
      keyG.rotation.y = -(c.tapO ?? 0) * 0.9; keyPiv.rotation.set(0.18 * Math.sin(t * 2.1) * (0.3 + (c.keySwing ?? 0.4)), 0, 0.12 * Math.sin(t * 1.7 + 1) * (0.3 + (c.keySwing ?? 0.4)));
      keyG.visible = (c.keyOff ?? 0) < 0.5;
      const rate = c.dripRate ?? 1, frozen = cl(c.dripFrozen ?? 0), dOn = (c.dripO ?? 0) > 0.5 && frozen < 0.5;
      // the bucket can be slid along the basin (c.bucketDz, m): off the spout line the drops land on the basin floor by the drain
      const bz = BK[2] + (c.bucketDz ?? 0), under = Math.abs(bz - DR0.TAP_O[2]) < 0.06; bucketG.position.set(BK[0], BK[1], bz);
      const bk = cl(c.bucketK ?? 0.15), wlB = BK[1] + 0.012 + 0.24 * bk; water.position.set(BK[0], wlB, bz); const wr = 0.118 + 0.03 * bk; water.scale.set(wr, 1, wr);
      const wl = under ? wlB : CT - 0.215, rz = under ? bz : DR0.TAP_O[2];
      const fall = DR0.TAP_O[1] - 0.012 - wl, tFall = Math.sqrt((2 * fall) / 9.8);
      const td = t - (c.dripT0 ?? 0), tc = td < 0 ? 1e3 : ((td * rate) % 1) / rate;   // seconds since this drop let go (c.dripT0: the first drop lets go then)
      drop.visible = false; drop.scale.setScalar(1); ripple.visible = false; ripple2.visible = false;
      let bs = 0;
      if (dOn && td >= 0) { bs = 0.35 + 0.65 * sm(tc * rate); if (tc < tFall) { drop.visible = true; drop.position.set(DR0.TAP_O[0], DR0.TAP_O[1] - 0.012 - 0.5 * 9.8 * tc * tc, DR0.TAP_O[2]); }
        const tr = tc - tFall; if (tr > 0 && tr < 0.7) { ripple.visible = true; ripple.position.set(BK[0], wl + 0.002, rz); const r = 0.012 + 0.09 * (tr / 0.7); ripple.scale.set(r, 1, r); (ripple.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - tr / 0.7); } }
      else if ((c.dripO ?? 0) > 0.5) bs = 0.9;                // frozen: the bead stays
      // the 3 a.m. fat drop: swell, shudder, let go, the big plunk
      const ft = c.fatT;
      if (ft !== undefined && ft > -1.4) {
        if (ft < 0) { bs = 0.9 + 0.95 * sm((ft + 1.4) / 1.2); bead.position.x = DR0.TAP_O[0] + 0.002 * Math.sin(t * 70) * sm((ft + 0.8) / 0.6); }
        else { bs = 0; const tt = ft; if (tt < tFall * 1.05) { drop.visible = true; drop.scale.setScalar(1.9); drop.position.set(DR0.TAP_O[0], DR0.TAP_O[1] - 0.02 - 0.5 * 9.8 * tt * tt, DR0.TAP_O[2]); }
          const tr = tt - tFall; if (tr > 0 && tr < 1.2) { for (const [R, d, k] of [[ripple, 0, 0.13], [ripple2, 0.25, 0.1]] as [THREE.Mesh, number, number][]) { const u = (tr - d) / (1.2 - d); if (u <= 0) continue; R.visible = true; R.position.set(BK[0], wl + 0.002, rz); const r = 0.015 + k * u; R.scale.set(r, 1, r); (R.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - u); } } }
      } else bead.position.x = DR0.TAP_O[0];
      bead.visible = bs > 0.01; bead.scale.setScalar(Math.max(0.01, bs));
      const fz = ft !== undefined && ft > -1.4 ? frozen * 0.5 : frozen;
      beadM.roughness = 0.02 + 0.55 * fz; beadM.color.set(fz > 0.5 ? "#f0f6ff" : "#dceeff");
      (frostCap.material as THREE.MeshStandardMaterial).opacity = 0.9 * fz; frostCap.visible = fz > 0.01;
      // the neighbour's handles + wrench + his own drip at the ending
      handlesN.forEach((g, i) => (g.rotation.y = (i === 0 ? c.tapN1 ?? c.tapN ?? 0 : c.tapN2 ?? c.tapN ?? 0) * 2.6)); wrench.visible = (c.wrenchN ?? 0) > 0.5;
      wrench.position.set(-3.2, CT + 0.13, c.wrenchZ ?? -4.12); wrench.rotation.set(0, Math.PI / 2 + (c.wrenchA ?? 0), -0.4);
      const nOn = (c.dripN ?? 0) > 0.5, fallN = DR0.TAP_N[1] - (CT - 0.22), tFN = Math.sqrt((2 * fallN) / 9.8), tdN = t - (c.dripNT0 ?? 0), tcN = tdN < 0 ? 1e3 : (tdN * 0.9 % 1) / 0.9;
      dropN.visible = nOn && tcN < tFN; if (dropN.visible) dropN.position.set(DR0.TAP_N[0], DR0.TAP_N[1] - 0.5 * 9.8 * tcN * tcN, DR0.TAP_N[2]);
      // icicles: the thaw shrinks them; drips fall from the gutters
      const th = cl(c.thaw ?? 0);
      iceSpots.forEach((q, k) => { IP.set(...q.p); IS.set(1, Math.max(0.01, q.l * (1 - 0.6 * th)), 1); IQ.identity(); IM.compose(IP, IQ, IS); icicles.setMatrixAt(k, IM); });
      icicles.instanceMatrix.needsUpdate = true;
      thawJet.pts.visible = th > 0.05;
      if (thawJet.pts.visible) { for (let i = 0; i < thawJet.n; i++) { const q = iceSpots[(i * 37) % iceSpots.length], u = (t * 0.8 + hsh(i, 3)) % 1, tipY = q.p[1] - q.l * (1 - 0.6 * th);
          thawJet.a.set([q.p[0], tipY - 0.5 * 9.8 * (u * 0.7) ** 2, q.p[2]], i * 3); if (thawJet.a[i * 3 + 1] < 0) thawJet.a[i * 3 + 1] = -5; }
        (thawJet.pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true; }
      // sprays
      const ss = c.streetSpray ?? 0; streetJets.forEach((J, i) => runJet(J, ss, t + i * 0.37));
      const bn = cl(c.burstN ?? 0); kitJets.forEach((J, i) => runJet(J, bn, t + i * 0.23, 1.2));
      crack.visible = bn > 0.01; crack.scale.setScalar(0.3 + 0.7 * sm(bn * 3));
      const wn = cl(c.wetN ?? 0); flood.visible = wn > 0.01; flood.scale.set(0.2 + 2.0 * wn, 1, 0.2 + 1.6 * wn);
      // cutaways: the section slices down from the top, the pipe shows, the ice grows and pushes the water
      const doCut = (C: ReturnType<typeof cut>, k0: number, ice: number, split: number, s: number) => {
        const k = cl(k0); C.kw.secG.visible = k < 0.999; C.kw.secG.scale.y = Math.max(0.001, 1 - sm(k)); C.kw.openG.visible = k > 0.001; C.g.visible = k > 0.001;
        const rise = YW - 0.05 - YB, iceH = 0.04 + 0.75 * rise * cl(ice);
        C.iceC.scale.set(1, iceH, 1); C.waterC.position.y = YB + iceH; C.waterC.scale.set(1, Math.max(0.005, rise - iceH), 1);
        C.swell.visible = s < 0 && split > 0.01; C.swell.scale.setScalar(1 + 0.55 * cl(split * 1.6)); C.split.visible = s < 0 && split > 0.6;
      };
      doCut(cutN, c.cutN ?? 0, c.iceN ?? 0, c.splitN ?? 0, -1); doCut(cutO, c.cutO ?? 0, c.iceO ?? 0, 0, 1);
      runJet(splitJet, (c.cutN ?? 0) > 0.5 ? sm(((c.splitN ?? 0) - 0.6) / 0.4) : 0, t, 0.8);
      // the ketchup squeeze
      const kq = cl(c.ketchup ?? 0); ketG.scale.set(1 - 0.22 * kq, 1 + 0.04 * kq, 1 - 0.1 * kq); runJet(ketSplat, sm(((c.ketchupSplit ?? 0) - 0.05) / 0.4) * 0.9, t, 0.6);
      // the clock
      const hr = c.clockH ?? 21.75; hHand.rotation.z = -((hr % 12) / 12) * TAU; mHand.rotation.z = -(hr % 1) * TAU;
      // the sign: held (signX/signZ, 0.35 m up), then planted with a wobble that dies
      const sg = cl(c.sign ?? 0); signG.visible = sg > 0.01;
      if (sg < 0.5) signG.position.set(c.signX ?? DR0.SIGN[0], 0.35, c.signZ ?? DR0.SIGN[2]);
      else { const u = (sg - 0.5) / 0.5; signG.position.set(c.signX ?? DR0.SIGN[0], 0.35 * (1 - sm(u * 2)), c.signZ ?? DR0.SIGN[2]); }
      signG.rotation.set(0, -0.35, 0.1 * Math.max(0, 1 - sg) * Math.sin(t * 9));
      // snowfall
      const sn = cl(c.snow ?? (night ? 1 : 0)); snowPts.visible = sn > 0.02;
      if (snowPts.visible) { const n = Math.floor(sd.length * sn); for (let i = 0; i < sd.length; i++) { const f = sd[i]; const y = i < n ? 7 - ((t * f.v + f.ph * 7) % 7) : -5;
          snowA.set([f.x + 0.3 * Math.sin(t * 0.7 + f.ph * 9), y, f.z + 0.2 * Math.cos(t * 0.5 + f.ph * 5)], i * 3); }
        (snowGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true; }
      // stick arms
      arms.forEach((A, i) => { const on = (c[`arm${i}`] ?? 0) > 0.5; A.g.visible = on; if (!on) return;
        const S = new THREE.Vector3(c[`arm${i}sx`] ?? 0, c[`arm${i}sy`] ?? 0, c[`arm${i}sz`] ?? 0), Hh = new THREE.Vector3(c[`arm${i}hx`] ?? 0, c[`arm${i}hy`] ?? 0, c[`arm${i}hz`] ?? 0);
        const mid = S.clone().lerp(Hh, 0.5); mid.y -= c[`arm${i}bend`] ?? 0.06;
        seg(A.up, S, mid); seg(A.lo, mid, Hh); A.el.position.copy(mid); A.hd.position.copy(Hh); });
      // breath steam
      const br = c.breath ?? 0; breath.visible = br > 0.01; if (br > 0.01) { breath.position.set(c.breathX ?? 0, (c.breathY ?? 0) + 0.15 * br, c.breathZ ?? 0); (breath.material as THREE.SpriteMaterial).opacity = 0.5 * Math.sin(Math.PI * br); breath.scale.set(0.15 + 0.3 * br, 0.1 + 0.2 * br, 1); }
    } } as SetDef;
};
