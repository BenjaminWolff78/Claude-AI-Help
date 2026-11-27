// "He Set the Ice Cream on Fire and It Didn't Melt" (2026-11-27, master prompt v33). ONE connected set built from real CC0
// Poly Haven assets (photo textures, models, HDRI light) plus modelled kitchen steel. Local metres, y up.
//  THE STREET (z < 0): sidewalk z -3.2..0 (y 0.12), road z -10..-3.2 in fresh snow, the far side's shopfronts at z -10.4.
//  THE COPPER SPOON, front at z = 0: the DINING ROOM x -6..2.2, z 0..7 (front window x -5.6..-1.7, entry door x -1.25..-0.25).
//    The critic's table T1 at (-2.6, 5.3), just in front of the kitchen swing door (round porthole, back wall z = 7,
//    x -2.6..-1.7): he sits with his back to the door, facing the window (-z), so the porthole is behind him in his shots.
//    The specials chalkboard beside the door.
//  THE KITCHEN x -6..6, z 7..13.5: the deck oven against the front wall just east of the door (body x -0.8..0.9,
//    z 7.3..8.6, the mouth on its north face at z 8.6, centre x 0.05, y 1.2), the pastry bench east of it (x 1.2..2.5),
//    the dish pit beyond (x 3.2..4.6), the stove line on the back wall z 13.5 (x -3.2..2.2), the framed "TOO WET."
//    review on the wall left of the door.
//  NEXT DOOR (x 2.4..8.6): the boarded-up restaurant with the one-star review taped to its plywood.
//  THE CUTAWAY at x = 400: a giant slice through the dessert (sponge, frozen ice cream, a meringue of man-sized bubbles,
//    the browning crust and the oven's heat above), for the scale gag: the kid and the chef stand inside it.
// Controls (pose c.*): oven (fire 0..1), ovenDoorSmoke (s since the smoke started, -1 off), alK* (the kitchen dessert:
//  alKx/y/z, alKbake, alKchar, alKheap, alKon), peel* (peelX/Y/Z/ry, peelOn), bucket (0 at the dish pit .. 1 under the oven,
//  bucketY lift while carried), door (kitchen door swing -1..1), alT* (the critic's dessert: crack, frost, bake),
//  alF* (the finale dessert: on, flame 0..1, boom 0..1), panOn/panX/Y/Z/panTilt, rum (pour stream 0..1), chalk (letters),
//  heat (cutaway heat waves 0..1), crust (0..1 browning), frostCut, snowK, sweat (s since a sweat flick, -1 off), flare (pan flare).
import * as THREE from "three";
import { phModel, phMat, boxM, planeM, type PhModel } from "../ph";
import { TAU, cl, sm, lerp, hsh, std, gloss, canvasTex, rbox, tubeAlong } from "./harborkit";
import { glow } from "../setkit";
import { alaska, flames, puffs, snow, mopBucket, peel, meringueBowl, copperPan, tooWetTex, avoidTex, chalkTex, menuTex, dialTex, windowNameTex, SERIF } from "./bistrokit";
import type { SetDef, V3, Ctl } from "./types";
import { stockShelf, panRail, poster, pipeRun, wallLamp, ceilingTileMat } from "./dress";
import { countdown, counter, splitFlap, dial, tube, tally } from "./screens";
import { getInputProps } from "remotion";

export const BS = {
  SW: 0.12, CEIL: 3.3, KCEIL: 3.2,
  T1: [-3.6, 0, 5.2] as V3, CRITIC: [-4.18, 0, 5.2] as V3, MENU: [-3.5, 0.78, 5.44] as V3, ALT: [-3.62, 0.765, 4.98] as V3, KID_T: [-3.2, 0, 5.42] as V3, PILLAR: [-2.6, 0, 10.45] as V3,
  KDOOR: [-2.15, 0, 7.0] as V3, PORT: [-2.15, 1.55, 7.0] as V3, CHALK: [-0.95, 0, 6.45] as V3, HOST: [1.3, 0, 0.95] as V3,
  OVEN_MOUTH: [0.05, 1.2, 8.6] as V3, BENCH: [1.85, 0, 7.9] as V3, BENCH_TOP: 0.9,
  KID_BENCH: [1.85, 0, 8.72] as V3, KID_OVEN: [0.05, 0, 9.5] as V3,
  CHEF_READ: [-2.3, 0, 9.3] as V3, CH_W: [-1.7, 0, 9.4] as V3, DISH_SPOT: [2.4, 0, 9.2] as V3, CLIP: [-3.3, 1.62, 6.9] as V3,
  COOK1: [-0.75, 0, 12.05] as V3, COOK2: [0.55, 0, 12.05] as V3, DISH: [3.9, 0, 8.65] as V3,
  BUCKET0: [3.05, 0, 8.8] as V3, BUCKET1: [0.05, 0, 8.92] as V3,
  CX: 400, CUT_ICE: 4.2,   // the cutaway: the ice cream's top at y 4.2 (people stand on it inside the meringue)
};

export const bistro = (): SetDef => {
  const root = new THREE.Group(); root.name = "bistro";
  const add = <T extends THREE.Object3D>(o: T, p: V3, yaw = 0): T => { o.position.set(...p); o.rotation.y = yaw; root.add(o); return o; };
  const ph = (n: PhModel, p: V3, yaw = 0, o: { h?: number; s?: number; filt?: string } = {}) => add(phModel(n, { center: true, ...o }), p, yaw);
  const box = (w: number, h: number, d: number, m: THREE.Material, p: V3, yaw = 0, cast = true) => { const me = new THREE.Mesh(boxM(w, h, d), m); me.castShadow = cast; me.receiveShadow = true; return add(me, p, yaw); };
  const rb = (w: number, h: number, d: number, r: number, m: THREE.Material, p: V3, yaw = 0) => { const me = new THREE.Mesh(rbox(w, h, d, r), m); me.castShadow = true; me.receiveShadow = true; return add(me, p, yaw); };
  const anim: ((t: number, c: Ctl, light: string) => void)[] = [];

  // ---------------- materials ----------------
  const brushT = canvasTex("bsBrush", 256, 256, (g) => { g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { const v = 100 + 70 * hsh(i); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(hsh(i + 0.7) * 256, 0, 1 + 2 * hsh(i + 1.9), 256); } });
  brushT.wrapS = brushT.wrapT = THREE.RepeatWrapping; brushT.repeat.set(3, 1);
  const steel = new THREE.MeshStandardMaterial({ color: "#c4c8ce", roughness: 0.38, metalness: 1, roughnessMap: brushT, envMapIntensity: 1.1 });
  const steelDark = new THREE.MeshStandardMaterial({ color: "#7a7e86", roughness: 0.45, metalness: 0.9 });
  const blackIron = std("#1e1e22", 0.55, 0.6);
  const brass = new THREE.MeshStandardMaterial({ color: "#c89a3a", roughness: 0.3, metalness: 1 });
  const greenPaint = std("#1f4a3a", 0.55);
  const goldTrim = new THREE.MeshStandardMaterial({ color: "#c8a040", roughness: 0.35, metalness: 0.9 });
  const wallTile = phMat("long_white_tiles", 1 / 0.6, 1 / 0.6, { tint: "#d6cdbc", rough: 0.35, env: 0.8 });
  const kFloor = phMat("worn_tile_floor", 1 / 1.2, 1 / 1.2, { tint: "#c88a6a", rough: 0.8 });
  const dFloor = phMat("herringbone_parquet", 1 / 1.6, 1 / 1.6, { tint: "#c89a6a", rough: 0.55, env: 0.6 });
  const plasterG = phMat("painted_plaster_wall", 1 / 2.5, 1 / 2.5, { tint: "#5a8a72", rough: 0.9 });
  const plasterK = phMat("painted_plaster_wall", 1 / 2.5, 1 / 2.5, { tint: "#c9bba4", rough: 0.9 });
  const panel = phMat("dark_paneled_wood", 1 / 1.4, 1 / 1.4, { tint: "#8a5a3a", rough: 0.6 });
  const brick = phMat("brick_wall_001", 1 / 2.2, 1 / 2.2, { tint: "#c87a5a", rough: 0.9 });
  const darkWood = phMat("dark_wood", 1 / 1.5, 1 / 1.5, { tint: "#6a4a32", rough: 0.6 });
  const kWood = phMat("kitchen_wood", 1 / 0.6, 1 / 0.6, { tint: "#d8b890", rough: 0.7 });
  const marble = phMat("marble_01", 1 / 0.8, 1 / 0.8, { tint: "#f2eee6", rough: 0.25, env: 0.9 });
  const leather = phMat("leather_red_02", 1 / 0.7, 1 / 0.7, { tint: "#a8323a", rough: 0.5 });
  const plywood = phMat("plywood", 1 / 1.2, 1 / 1.2, { tint: "#d8b888", rough: 0.85 });
  const snowM = phMat("snow_02", 1 / 2.5, 1 / 2.5, { tint: "#eef4ff", rough: 0.75, env: 0.7 });
  const roadM = phMat("asphalt_snow", 1 / 4, 1 / 4, { tint: "#e8eef8", rough: 0.8 });
  const pave = phMat("concrete_pavement", 1 / 1.6, 1 / 1.6, { tint: "#b8bcc4", rough: 0.95 });
  const ceilM = std("#f2ede2", 0.95);
  const glassM = new THREE.MeshPhysicalMaterial({ color: "#a8c0d0", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false });

  // =============================================== THE DINING ROOM ===============================================
  { const fl = new THREE.Mesh(planeM(8.4, 7.2), dFloor); fl.rotation.x = -Math.PI / 2; fl.position.set(-1.9, 0.002, 3.5); fl.receiveShadow = true; root.add(fl);
    const ce = new THREE.Mesh(planeM(8.4, 7.2), ceilM); ce.rotation.x = Math.PI / 2; ce.position.set(-1.9, BS.CEIL, 3.5); root.add(ce);
    for (let i = 0; i < 5; i++) box(0.18, 0.22, 7.0, darkWood, [-5.4 + i * 1.75, BS.CEIL - 0.11, 3.5], 0, false);   // ceiling beams
    // west wall: exposed brick; east wall x 2.2: green plaster over a wood wainscot; back wall z 7 the same
    box(0.2, BS.CEIL, 7.0, brick, [-6.1, BS.CEIL / 2, 3.5]);
    box(0.2, BS.CEIL - 1.05, 7.0, plasterG, [2.3, 1.05 + (BS.CEIL - 1.05) / 2, 3.5]); box(0.22, 1.05, 7.0, panel, [2.29, 0.525, 3.5]);
    // back wall z 7 with the kitchen door opening x -2.6..-1.7
    for (const [x0, x1] of [[-6.0, -2.6], [-1.7, 2.2]]) { const w = x1 - x0, cx = (x0 + x1) / 2;
      box(w, BS.CEIL - 1.05, 0.2, plasterG, [cx, 1.05 + (BS.CEIL - 1.05) / 2, 7.1]); box(w, 1.05, 0.22, panel, [cx, 0.525, 7.09]); box(w, 0.06, 0.26, darkWood, [cx, 1.08, 7.09]); }
    box(0.9, BS.CEIL - 2.15, 0.2, plasterG, [-2.15, 2.15 + (BS.CEIL - 2.15) / 2, 7.1]);
    for (const x of [-2.66, -1.64]) box(0.12, 2.2, 0.3, darkWood, [x, 1.1, 7.1]); box(1.14, 0.12, 0.3, darkWood, [-2.15, 2.2, 7.1]);
    // the front wall z 0: wainscot under the window, the window x -5.6..-1.7 (y 0.75..2.7), the entry door x -1.25..-0.25
    const fz = 0.0;
    box(0.4, BS.CEIL, 0.24, greenPaint, [-5.8, BS.CEIL / 2, fz]); box(0.45, BS.CEIL, 0.24, greenPaint, [-1.475, BS.CEIL / 2, fz]);
    box(3.9, 0.75, 0.24, greenPaint, [-3.65, 0.375, fz]); box(3.9, BS.CEIL - 2.7, 0.24, greenPaint, [-3.65, 2.7 + (BS.CEIL - 2.7) / 2, fz]);
    box(2.45, BS.CEIL, 0.24, greenPaint, [1.0, BS.CEIL / 2, fz]);
    box(1.0, BS.CEIL - 2.3, 0.24, greenPaint, [-0.75, 2.3 + (BS.CEIL - 2.3) / 2, fz]);
    // window glass + mullions + the gold name
    const win = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 1.95), glassM); win.position.set(-3.65, 1.725, fz); root.add(win);
    for (const x of [-4.95, -3.65, -2.35]) box(0.05, 1.95, 0.08, greenPaint, [x, 1.725, fz]); box(3.9, 0.05, 0.08, greenPaint, [-3.65, 2.25, fz]);
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshStandardMaterial({ map: windowNameTex(), transparent: true, roughness: 0.3, metalness: 0.6, depthWrite: false })); nm.position.set(-3.65, 1.62, fz - 0.012); nm.rotation.y = Math.PI; root.add(nm);
    // the entry door (green, a glass panel, a brass handle) slightly open inward when used: c.frontDoor 0..1
    const fd = new THREE.Group(); fd.position.set(-1.25, 0, fz); root.add(fd);
    { const leaf = new THREE.Mesh(boxM(1.0, 2.3, 0.06), greenPaint); leaf.position.set(0.5, 1.15, 0); leaf.castShadow = true; fd.add(leaf);
      const gl2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), glassM); gl2.position.set(0.5, 1.45, -0.035); fd.add(gl2);
      const gl3 = gl2.clone(); gl3.position.z = 0.035; fd.add(gl3);
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 10), brass); hd.position.set(0.88, 1.1, -0.06); fd.add(hd);
      const hd2 = hd.clone(); hd2.position.z = 0.06; fd.add(hd2); }
    anim.push((_t, c) => { fd.rotation.y = -1.25 * sm(c.frontDoor ?? 0); });
    // pendant lamps + candles; tables; chairs; diners' plates and glasses
    const pend: V3[] = [[-3.6, 2.55, 5.2], [-0.4, 2.55, 2.4], [-4.6, 2.55, 2.0], [0.9, 2.55, 4.6], [-5.1, 2.55, 3.6]];
    for (const p of pend) { const lm = ph("modern_ceiling_lamp_01", [p[0], p[1] - 0.2, p[2]], 0, { h: 0.95 }); void lm; const L = new THREE.PointLight("#ffd29a", 4.2, 6.5, 1.7); L.position.set(p[0], p[1] - 0.15, p[2]); root.add(L); }
    const bistroTable = (p: V3, top = marble) => {
      const t = new THREE.Group(); t.position.set(...p); root.add(t);
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.035, 48), top); tp.position.y = 0.745; tp.castShadow = tp.receiveShadow = true; t.add(tp);
      const ed = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.012, 8, 48), brass); ed.rotation.x = Math.PI / 2; ed.position.y = 0.745; t.add(ed);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.72, 16), blackIron); col.position.y = 0.37; col.castShadow = true; t.add(col);
      for (let k = 0; k < 3; k++) { const leg = new THREE.Mesh(boxM(0.34, 0.03, 0.05), blackIron); leg.position.set(Math.cos(k * TAU / 3) * 0.16, 0.02, Math.sin(k * TAU / 3) * 0.16); leg.rotation.y = -k * TAU / 3; t.add(leg); }
      const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.004, 32), std("#f4f0e6", 0.9)); cloth.position.set(0.12, 0.765, 0.08); t.add(cloth);
      const cs = phModel("wooden_candlestick", { h: 0.2, center: true }); cs.position.set(-0.18, 0.765, -0.14); t.add(cs);
      const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 10), std("#f4ecd8", 0.8)); cand.position.set(-0.18, 0.765 + 0.2 + 0.04, -0.14); t.add(cand);
      const fl2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: "#ffd890" })); fl2.scale.set(1, 1.8, 1); fl2.position.set(-0.18, 0.765 + 0.3, -0.14); t.add(fl2);
      const L = new THREE.PointLight("#ffb060", 0.9, 2.2, 1.8); L.position.set(p[0] - 0.18, 1.1, p[2] - 0.14); root.add(L);
      anim.push((tt) => { const f = 0.85 + 0.15 * Math.sin(tt * 13 + p[0]) * Math.sin(tt * 7.3 + p[2]); L.intensity = 0.9 * f; fl2.scale.set(1, 1.6 + 0.4 * f, 1); });
      return t;
    };
    bistroTable(BS.T1); bistroTable([-0.4, 0, 2.4]); bistroTable([-4.6, 0, 1.6]); bistroTable([0.9, 0, 4.6]); bistroTable([-5.1, 0, 3.6]);
    const chair = (p: V3, yaw: number) => ph("dining_chair_02", p, yaw, { h: 0.97 });
    chair([-4.18, 0, 5.2], Math.PI / 2);   // the critic sits on the west side of T1, facing east (the kitchen door is to his left)
    chair([-0.4, 0, 2.95], Math.PI); chair([-0.4, 0, 1.85], 0); chair([-4.6, 0, 2.15], Math.PI); chair([-4.6, 0, 1.05], 0);
    chair([0.9, 0, 5.15], Math.PI); chair([0.35, 0, 4.6], Math.PI / 2); chair([-5.1, 0, 4.15], Math.PI); chair([-4.55, 0, 3.6], -Math.PI / 2);
    // a red leather banquette along the brick wall, picture frames, plants, a wine shelf, the host stand + register
    rb(0.55, 0.45, 5.2, 0.06, leather, [-5.65, 0.225, 3.9]); rb(0.18, 0.75, 5.2, 0.06, leather, [-5.88, 0.75, 3.9]);
    ph("hanging_picture_frame_01", [-5.98, 1.95, 2.6], Math.PI / 2, { h: 0.84 }); ph("hanging_picture_frame_02", [-5.98, 2.0, 4.9], Math.PI / 2, { h: 0.5 });
    ph("fancy_picture_frame_01", [2.18, 1.95, 2.5], -Math.PI / 2, { h: 0.46 }); ph("hanging_picture_frame_01", [2.18, 1.9, 4.6], -Math.PI / 2, { h: 0.84 });
    ph("potted_plant_01", [-5.55, 0, 0.55], 0.4, { h: 1.34 }); ph("potted_plant_02", [1.85, 0, 6.6], 1.1, { h: 0.84 }); ph("potted_plant_02", [-5.6, 0, 6.6], 2.0, { h: 0.84 });
    { box(1.6, 0.04, 0.3, darkWood, [0.9, 1.75, 6.88]); for (let i = 0; i < 4; i++) { const wb = phModel("wine_bottles_01", { center: true, h: 0.33 }); wb.position.set(0.25 + i * 0.42, 1.77, 6.86); wb.rotation.y = i; root.add(wb); } }
    { rb(0.7, 1.05, 0.45, 0.03, darkWood, [BS.HOST[0], 0.525, BS.HOST[2]]); ph("CashRegister_01", [BS.HOST[0], 1.05, BS.HOST[2]], Math.PI, { h: 0.45, filt: "CashRegister_01_body" }); }
    // the specials chalkboard by the kitchen door
    const chalk = ph("standing_chalkboard_01", BS.CHALK, Math.PI - 0.1, { h: 1.51 });   // faces the dining room (-z)
    const chalkFace = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.0), new THREE.MeshStandardMaterial({ map: chalkTex(0), roughness: 0.9 })); chalkFace.position.set(0, 0.92, 0.02); chalk.add(chalkFace);
    chalkFace.rotation.x = -0.24; chalkFace.position.z = -0.12;
    let chalkN = 0;
    anim.push((_t, c) => { const n = Math.round(cl(c.chalk ?? 0) * 11); if (n !== chalkN) { (chalkFace.material as THREE.MeshStandardMaterial).map = chalkTex(n); (chalkFace.material as THREE.MeshStandardMaterial).needsUpdate = true; chalkN = n; } });
    // the critic's menu stand (DESSERT) on T1
    const menu = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.2), new THREE.MeshStandardMaterial({ map: menuTex(), roughness: 0.7, side: THREE.DoubleSide })); menu.position.set(...BS.MENU); menu.position.y += 0.1; menu.rotation.set(-0.2, -Math.PI / 2 + 0.35, 0, "YXZ"); root.add(menu);
  }
  // the kitchen swing door with its round porthole (hinge at x -2.6; c.door -1..1 swings into the kitchen / the dining room)
  const kd = new THREE.Group(); kd.position.set(-2.6, 0, 7.0); root.add(kd);
  { const leafM = std("#7a3a2a", 0.5);
    for (const [w, h, x, y] of [[0.9, 1.36, 0.45, 0.68], [0.9, 0.42, 0.45, 1.91], [0.27, 0.36, 0.135, 1.54], [0.27, 0.36, 0.765, 1.54]] as [number, number, number, number][]) {
      const pc = new THREE.Mesh(boxM(w, h, 0.05), leafM); pc.position.set(x, y, 0); pc.castShadow = true; pc.receiveShadow = true; kd.add(pc); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 10, 40), steel); ring.position.set(0.45, 1.55, -0.03); kd.add(ring); const ring2 = ring.clone(); ring2.position.z = 0.03; kd.add(ring2);
    const pg = new THREE.Mesh(new THREE.CircleGeometry(0.17, 40), glassM); pg.position.set(0.45, 1.55, 0); kd.add(pg);
    const kick = new THREE.Mesh(boxM(0.9, 0.3, 0.06), steel); kick.position.set(0.45, 0.16, 0); kd.add(kick); }
  anim.push((_t, c) => { kd.rotation.y = 1.45 * (c.door ?? 0); });

  // =============================================== THE KITCHEN ===============================================
  { const fl = new THREE.Mesh(planeM(12.2, 6.6), kFloor); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.003, 10.25); fl.receiveShadow = true; root.add(fl);
    const ce = new THREE.Mesh(planeM(12.2, 6.6), ceilingTileMat(12.2, 6.6)); ce.rotation.x = Math.PI / 2; ce.position.set(0, BS.KCEIL, 10.25); root.add(ce);
    // tiled walls to 2.2 m, cream plaster above; the kitchen side of the dining wall z 7.2
    const kwall = (w: number, cx: number, cz: number, yaw: number) => { box(w, 2.2, 0.12, wallTile, [cx, 1.1, cz], yaw); box(w, BS.KCEIL - 2.2, 0.12, plasterK, [cx, 2.2 + (BS.KCEIL - 2.2) / 2, cz], yaw); box(w, 0.06, 0.16, steelDark, [cx, 2.22, cz], yaw, false); };
    kwall(12.2, 0, 13.56, 0); kwall(6.6, -6.06, 10.25, Math.PI / 2); kwall(6.6, 6.06, 10.25, Math.PI / 2);
    kwall(3.4, -4.3, 7.26, 0); kwall(7.7, 2.15, 7.26, 0); box(0.9, BS.KCEIL - 2.15, 0.12, plasterK, [-2.15, 2.15 + (BS.KCEIL - 2.15) / 2, 7.26]);
    // fluorescent tubes + caged lights
    for (const [x, z] of [[-3.5, 9.2], [0, 9.2], [3.5, 9.2], [-3.5, 11.8], [0, 11.8], [3.5, 11.8]]) { ph("mounted_fluorescent_lights", [x, BS.KCEIL - 0.04, z], 0, { h: 0.04 }); const L = new THREE.PointLight("#fff4e4", 2.0, 7.5, 1.6); L.position.set(x, BS.KCEIL - 0.25, z); root.add(L); }
    ph("caged_hanging_light", [3.0, BS.KCEIL, 10.3], Math.PI / 2, { h: 0.75 });
    // ---- THE DECK OVEN against the front wall east of the door: brick-and-steel body x -0.8..0.9, z 7.3..8.6, mouth facing +z
    { const ox = 0.05, mz = 8.6, zb = 7.3;
      box(1.7, 0.12, 1.3, steelDark, [ox, 0.66, (mz + zb) / 2]);
      for (const [dx, dz] of [[-0.78, 0.06], [0.78, 0.06], [-0.78, 1.24], [0.78, 1.24]]) box(0.07, 0.66, 0.07, steelDark, [ox + dx, 0.33, zb + dz]);
      box(1.7, 1.3, 1.25, steel, [ox, 1.37, zb + 0.6]);
      // the brass front plate is a frame round the mouth hole (x -0.4..0.5, y 0.98..1.42), not a solid sheet over it
      box(0.43, 1.36, 0.04, brass, [ox - 0.665, 1.37, mz + 0.015], 0, false); box(0.43, 1.36, 0.04, brass, [ox + 0.665, 1.37, mz + 0.015], 0, false);
      box(0.9, 0.63, 0.04, brass, [ox, 1.735, mz + 0.015], 0, false); box(0.9, 0.29, 0.04, brass, [ox, 0.835, mz + 0.015], 0, false);
      box(1.6, 0.08, 0.06, steelDark, [ox, 0.85, mz + 0.04]); box(1.6, 0.08, 0.06, steelDark, [ox, 1.92, mz + 0.04]);
      const mouthBack = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshStandardMaterial({ color: "#3a1a10", emissive: "#ff3c0c", emissiveIntensity: 1.1, roughness: 0.9 }));
      mouthBack.position.set(ox, 1.2, mz - 0.9); root.add(mouthBack);
      for (const s2 of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshStandardMaterial({ color: "#5a2a14", emissive: "#d8380a", emissiveIntensity: 0.7, roughness: 0.9, side: THREE.DoubleSide })); side.position.set(ox + s2 * 0.45, 1.2, mz - 0.45); side.rotation.y = Math.PI / 2; root.add(side); }
      const roofIn = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ color: "#4a2010", emissive: "#b03a0c", emissiveIntensity: 0.6, roughness: 1, side: THREE.DoubleSide })); roofIn.rotation.x = Math.PI / 2; roofIn.position.set(ox, 1.41, mz - 0.45); root.add(roofIn);
      const floorIn = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ color: "#6a3018", emissive: "#c84010", emissiveIntensity: 0.7, roughness: 1 })); floorIn.rotation.x = -Math.PI / 2; floorIn.position.set(ox, 1.0, mz - 0.45); root.add(floorIn);
      box(1.0, 0.05, 0.1, steelDark, [ox, 0.985, mz + 0.03], 0, false);
      // the steel face around the mouth hole (left, right, above, below panels)
      box(0.4, 0.44, 0.02, steel, [ox - 0.65, 1.2, mz + 0.005], 0, false); box(0.4, 0.44, 0.02, steel, [ox + 0.65, 1.2, mz + 0.005], 0, false);
      const ovenFl = flames(40, 7, 0.45); root.add(ovenFl.mesh);
      const ovenL = new THREE.PointLight("#ff7a2a", 5, 4.5, 1.6); ovenL.position.set(ox, 1.2, mz + 0.3); root.add(ovenL);
      const ovenG = glow(root, [ox, 1.2, mz + 0.05], "#ff8a3a", 0.8, 0.35);
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.13, 40), new THREE.MeshStandardMaterial({ map: dialTex(), roughness: 0.4 })); dial.position.set(ox, 1.72, mz + 0.035); root.add(dial);
      const bez = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.015, 8, 40), brass); bez.position.copy(dial.position); root.add(bez);
      const ndl = new THREE.Mesh(boxM(0.006, 0.1, 0.004), std("#c8342a", 0.4)); ndl.geometry.translate(0, 0.045, 0); ndl.position.set(ox, 1.72, mz + 0.04); root.add(ndl);
      const timer = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 24), gloss("#e8e4dc", 1, 0.3)); timer.rotation.x = Math.PI / 2; timer.position.set(ox + 0.55, 1.72, mz + 0.02); root.add(timer);
      const tk = new THREE.Mesh(boxM(0.004, 0.05, 0.004), std("#1a1a1a", 0.5)); tk.geometry.translate(0, 0.022, 0); tk.position.set(ox + 0.55, 1.72, mz + 0.045); root.add(tk);
      anim.push((t, c) => { const k = c.oven ?? 1; ovenFl.set(t, 0.9 * k, [ox, 1.0, mz - 0.28], 0.4, 0.46);   // the flames lick out of the top of the mouth ovenL.intensity = (4.5 + 1.2 * Math.sin(t * 17) * Math.sin(t * 6.1)) * k; ovenG.visible = k > 0.1;
        (mouthBack.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1 * (1.0 + 0.25 * Math.sin(t * 13.1) * Math.sin(t * 5.3)) * k;
        const a = ((c.dial ?? 500) / 600) * Math.PI * 1.5 - Math.PI * 0.75; ndl.rotation.z = -a; tk.rotation.z = -(c.timer ?? 0) * TAU; });
      box(0.5, BS.KCEIL - 2.02, 0.5, brick, [ox, 2.02 + (BS.KCEIL - 2.02) / 2, zb + 0.4]);
    }
    // ---- the pastry bench east of the oven (steel, an undershelf with sheet pans), the meringue bowl, the ticket rail
    { const [bx, , bz] = BS.BENCH, T = BS.BENCH_TOP;
      box(1.3, 0.04, 0.9, steel, [bx, T - 0.02, bz]); box(1.3, 0.03, 0.85, steel, [bx, 0.22, bz]);
      for (const [dx, dz] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) box(0.04, T - 0.04, 0.04, steel, [bx + dx, (T - 0.04) / 2, bz + dz]);
      ph("wooden_cutting_board", [bx + 0.4, T, bz - 0.15], 0.2, { h: 0.04 }); ph("croissant", [bx + 0.42, T + 0.04, bz - 0.15], 0.6, { h: 0.06 });
      ph("lemon", [bx - 0.5, T, bz - 0.3], 0, { h: 0.09 }); ph("lemon", [bx - 0.42, T, bz - 0.36], 1, { h: 0.09 });
      for (let i = 0; i < 4; i++) box(0.5, 0.012, 0.35, steelDark, [bx, 0.25 + i * 0.015, bz]);
      const bowl = meringueBowl(); bowl.position.set(bx + 0.2, T, bz + 0.1); root.add(bowl);
      ph("jug_01", [bx + 0.55, T, bz - 0.32], 0.5, { h: 0.21 }); ph("metal_jug", [bx - 0.15, T, bz - 0.34], 0, { h: 0.29 });
      // the ticket rail over the bench with order tickets
      box(1.3, 0.02, 0.03, steel, [bx, 1.62, 7.36]);
      for (let i = 0; i < 5; i++) { const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.14), std("#f4f0e0", 0.9, 0, { side: THREE.DoubleSide })); tk.position.set(bx - 0.5 + i * 0.25, 1.54, 7.38); tk.rotation.z = 0.06 * (hsh(i + 3) - 0.5); root.add(tk); }
      // the head chef's own plain scoop in a dish on the bench, melting into a puddle in the kitchen heat
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.03, 24), gloss("#f4f2ec", 1, 0.2)); dish.position.set(bx - 0.35, T + 0.015, bz + 0.25); root.add(dish);
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshStandardMaterial({ color: "#f2ead8", roughness: 0.15 })); puddle.rotation.x = -Math.PI / 2; puddle.position.set(bx - 0.35, T + 0.032, bz + 0.25); root.add(puddle);
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 12), std("#f4ecdc", 0.5)); scoop.position.set(bx - 0.35, T + 0.06, bz + 0.25); root.add(scoop);
      anim.push((_t, c) => { const m = cl(c.melt ?? 0); scoop.scale.set(1 + 0.3 * m, 1 - 0.75 * m, 1 + 0.3 * m); scoop.position.y = T + 0.06 - 0.02 * m; puddle.scale.setScalar(0.6 + 0.6 * m); });
      ph("strawberry_chocolate_cake", [bx - 0.05, T, bz + 0.28], 0, { h: 0.08 });
    }
    // ---- the stove line along the back wall: three ranges, burners with flames, pots and pans, the steel hood
    const burnerFl: { f: ReturnType<typeof flames>; p: V3 }[] = [];
    { for (let i = 0; i < 3; i++) { const cx = -2.3 + i * 1.6;
        box(1.55, 0.86, 0.8, steel, [cx, 0.43, 13.05]); box(1.55, 0.06, 0.82, blackIron, [cx, 0.89, 13.05]);
        box(1.5, 0.06, 0.04, steelDark, [cx, 0.75, 12.64]);
        for (let k = 0; k < 4; k++) { const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 14), blackIron); kn.rotation.x = Math.PI / 2; kn.position.set(cx - 0.5 + k * 0.33, 0.8, 12.63); root.add(kn); }
        for (const [dx, dz] of [[-0.38, -0.18], [0.38, -0.18], [-0.38, 0.18], [0.38, 0.18]]) { const gr = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 20), blackIron); gr.rotation.x = Math.PI / 2; gr.position.set(cx + dx, 0.93, 13.05 + dz); root.add(gr);
          const f = flames(14, i * 4 + dx * 10 + dz * 3, 0.65); root.add(f.mesh); burnerFl.push({ f, p: [cx + dx, 0.92, 13.05 + dz] }); }
        box(0.06, 0.3, 0.8, steelDark, [cx - 0.78, 0.6, 13.05]); }
      ph("brass_pot_01", [-2.68, 0.95, 12.87], 0, { h: 0.29 }); ph("pot_enamel_01", [-1.92, 0.95, 13.23], 0.5, { h: 0.18 }); ph("brass_pot_02", [-0.32, 0.95, 12.87], 0.2, { h: 0.11 });
      ph("brass_pot_01", [0.48, 0.95, 13.23], 1.2, { h: 0.29 }); ph("brass_pan_01", [1.0, 0.95, 12.87], 0.4, { h: 0.05 }); ph("pot_enamel_01", [1.68, 0.95, 13.23], 2.0, { h: 0.18 });
      // the hood
      const hood = box(5.0, 0.55, 1.1, steel, [-0.7, 2.5, 13.0]); void hood; box(5.0, 0.04, 1.12, steelDark, [-0.7, 2.22, 13.0], 0, false);
      for (let i = 0; i < 6; i++) box(0.7, 0.02, 0.5, steelDark, [-2.85 + i * 0.86, 2.21, 13.0], 0, false);
      // shelves over the line: plates and jars
      box(5.0, 0.04, 0.3, steel, [-0.7, 1.75, 13.38]); for (let i = 0; i < 9; i++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), gloss("#f2f0ea", 1, 0.2)); pl.position.set(-3.0 + i * 0.55, 1.81, 13.38); root.add(pl); }
      const stoveL = new THREE.PointLight("#ffa060", 2.2, 4.5, 1.6); stoveL.position.set(-0.7, 1.3, 12.6); root.add(stoveL);
      anim.push((t, c) => { burnerFl.forEach((b, i) => b.f.set(t + i * 0.37, 0.55, b.p, 0.1, 0.1)); stoveL.intensity = 2.2 + 0.4 * Math.sin(t * 11); void c; });
    }
    // a pan flare on cook2's pan (c.flare = seconds since the flip, -1 off)
    const flare = flames(30, 31, 0.3); root.add(flare.mesh);
    const flareL = new THREE.PointLight("#ff9a3a", 0, 4, 1.6); flareL.position.set(1.0, 1.4, 12.7); root.add(flareL);
    anim.push((t, c) => { const a = c.flare ?? -1; const k = a < 0 ? 0 : sm(a, 0, 0.15) * (1 - sm(a, 0.6, 1.4)); flare.set(t, 1.6 * k, [1.0, 1.0, 12.87], 0.14, 0.55); flareL.intensity = 6 * k; });
    // ---- the dish pit (front wall, east): a deep sink, a dish rack, stacks of plates, cleaners, the wet-floor sign
    { box(1.4, 0.86, 0.7, steel, [3.9, 0.43, 7.65]); box(1.2, 0.02, 0.55, steelDark, [3.9, 0.7, 7.65], 0, false);
      const tap = tubeAlong([[3.9, 0.9, 7.36], [3.9, 1.25, 7.36], [3.9, 1.3, 7.55], [3.9, 1.18, 7.7]], 0.018, steel); root.add(tap);
      ph("worn_metal_rack", [5.4, 0, 8.4], -Math.PI / 2, { h: 1.9 });
      for (let i = 0; i < 3; i++) for (let k = 0; k < 9; k++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 22), gloss("#f4f2ec", 1, 0.2)); pl.position.set(5.4, 0.42 + i * 0.6 + k * 0.016, 8.4 + (i - 1) * 0.05); root.add(pl); }
      ph("WetFloorSign_01", [2.75, 0, 9.0], 0.6, { h: 0.63 });
    }
    const bucket = mopBucket(); root.add(bucket);
    anim.push((_t, c) => { const k = sm(c.bucket ?? 0); const a = BS.BUCKET0, b = BS.BUCKET1; bucket.position.set(lerp(a[0], b[0], k), (c.bucketY ?? 0), lerp(a[2], b[2], k)); bucket.rotation.y = lerp(0.3, 1.57, k); });
    // the wall clock, extinguisher and shelving
    ph("steel_frame_shelves_01", [-5.75, 0, 9.6], Math.PI / 2, { h: 2.0 }); ph("steel_frame_shelves_01", [-5.75, 0, 11.4], Math.PI / 2, { h: 2.0 });
    for (let i = 0; i < 4; i++) ph("plastic_crate_01", [-5.7, 0.02 + (i % 2) * 0.95, 9.2 + Math.floor(i / 2) * 1.6], 0, { h: 0.26 });
    ph("yellow_onion", [-5.7, 0.3, 9.2], 0, { h: 0.09 }); ph("sweet_potato", [-5.65, 1.23, 10.85], 0, { h: 0.1 }); ph("food_lime_01", [-5.75, 1.23, 9.2], 0, { h: 0.08 });
    ph("wooden_crate_02", [-4.6, 0, 12.9], 0.1, { h: 0.45 }); ph("CheeseBox_01", [-5.7, 0.98, 10.0], 0, { h: 0.07 });
    ph("wall_clock", [2.6, 2.55, 7.33], 0, { h: 0.32 }); ph("korean_fire_extinguisher_01", [-5.9, 0, 12.8], Math.PI / 2, { h: 0.66 });
    
    // ---- v34 DRESSING PASS (R&D 2026-11-27): the east and back walls the kitchen shots look at were bare tile
    { const W = 5.98, HW = -Math.PI / 2;
      stockShelf(root, [W, 0, 9.55], HW, { w: 1.3, seed: 11, bulkBottom: true });
      stockShelf(root, [W, 0, 11.2], HW, { w: 1.2, seed: 23, wood: true, levels: [0.1, 0.5, 0.9, 1.3, 1.7] });
      panRail(root, [W, 2.05, 12.65], HW, 1.4, 5);
      poster(root, [W - 0.02, 2.45, 10.4], HW, 0.42, 0.56, "#f4efe2", [["KITCHEN", 52, "#a02a20"], ["RULES", 52, "#a02a20"], ["1. CLEAN AS", 30], ["YOU GO", 30], ["2. HOT PANS", 30], ["SHOUT 'BEHIND'", 30], ["3. TASTE", 30], ["EVERYTHING", 30]], { tilt: 0.03, border: "#a02a20" });
      poster(root, [W - 0.02, 2.5, 8.6], HW, 0.36, 0.3, "#fff6c8", [["FRIDAY", 40], ["DELIVERY", 40], ["6 AM", 56, "#1d4f8a"]], { tilt: -0.05 });
      poster(root, [W - 0.02, 1.95, 12.05], HW, 0.22, 0.3, "#ffffff", [["TEMP", 34], ["LOG", 34], ["38°F", 30, "#1d4f8a"], ["37°F", 30, "#1d4f8a"], ["38°F", 30, "#1d4f8a"]], { tilt: 0.02 });
      pipeRun(root, [W - 0.08, 2.95, 7.5], [W - 0.08, 2.95, 13.4], 0.04);
      pipeRun(root, [W - 0.16, 2.8, 7.5], [W - 0.16, 2.8, 13.4], 0.025, "#b87333");
      pipeRun(root, [W - 0.08, 0.2, 13.25], [W - 0.08, 2.95, 13.25], 0.04);
      ph("power_box_01", [W - 0.06, 1.55, 13.0], HW, { h: 0.5, filt: "_box$" });
      wallLamp(root, [W - 0.02, 2.2, 10.9], HW, "#ffcf8a", 1.4, 3.0);
      // back wall z 13.5 east of the hood: a pan rail, a menu-ticket board, a clipboard
      panRail(root, [3.9, 1.95, 13.44], Math.PI, 1.6, 9);
      poster(root, [3.6, 2.55, 13.46], Math.PI, 0.7, 0.34, "#2a2a2a", [["ORDER UP", 60, "#f4d35e"]], { tilt: 0 });
      ph("clipboard", [4.9, 1.45, 13.47], Math.PI, { h: 0.34 });
      // the ceiling: caged work lights and a duct run
      for (const [x, z] of [[1.5, 9.6], [3.8, 11.6], [-1.6, 11.0]] as [number, number][]) { const L = ph("caged_hanging_light", [x, BS.KCEIL - 0.55, z], 0, { h: 0.55 }); void L; }
      pipeRun(root, [-5.5, BS.KCEIL - 0.25, 9.2], [5.6, BS.KCEIL - 0.25, 9.2], 0.16, "#a9adb0");
      // the floor: rubber mats, a crate stack and a sack by the shelves
      for (const [x, z, w] of [[0.1, 11.6, 3.6], [3.9, 8.45, 1.4]] as [number, number, number][]) { const m = new THREE.Mesh(boxM(w, 0.012, 0.8), std("#2b2b2b", 0.95)); m.position.set(x, 0.006, z); m.receiveShadow = true; root.add(m); }
      ph("wooden_crate_01", [5.35, 0, 12.75], 0.2, { h: 0.42 }); ph("wooden_crate_01", [5.4, 0.42, 12.78], -0.1, { h: 0.42 }); ph("cardboard_box_01", [4.75, 0, 12.95], 0.4, { h: 0.35 });
    }
    // dining back wall z 7 west of the swing door (the critic's shots): a small wine shelf, two frames and a sconce
    { const Z = 6.93;
      box(0.9, 0.035, 0.22, darkWood, [-4.45, 1.5, Z - 0.1]); for (let i = 0; i < 2; i++) { const wb = phModel("wine_bottles_01", { center: true, h: 0.3 }); wb.position.set(-4.7 + i * 0.48, 1.52, Z - 0.1); wb.rotation.y = i * 2; root.add(wb); }
      ph("hanging_picture_frame_03", [-3.55, 1.75, Z], Math.PI, { h: 0.5 }); ph("fancy_picture_frame_02", [-5.2, 1.95, Z], Math.PI, { h: 0.5 });
      wallLamp(root, [-3.0, 1.95, Z], Math.PI, "#ffc27a", 0.9, 2.4);
    }
    // a tiled pillar in the kitchen, straight ahead of the swing door, with the framed "TOO WET." review on its south face
    // (the pillar is gone: the framed TOO WET review hangs in the dining room on the back wall west of the swing door, facing -z)
    { const fr = new THREE.Group(); fr.position.set(BS.CLIP[0], BS.CLIP[1], BS.CLIP[2]); fr.rotation.y = Math.PI; root.add(fr);
      const backing = new THREE.Mesh(boxM(0.56, 0.7, 0.03), darkWood); fr.add(backing);
      const pap = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.6), new THREE.MeshStandardMaterial({ map: tooWetTex(), roughness: 0.85 })); pap.position.z = 0.02; fr.add(pap);
      const gl2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), glassM); gl2.position.z = 0.03; fr.add(gl2); }
  }

  // =============================================== THE STREET ===============================================
  { const sw = new THREE.Mesh(boxM(60, BS.SW, 3.2), pave); sw.position.set(-2, BS.SW / 2, -1.6); sw.receiveShadow = true; root.add(sw);
    const swSnow = new THREE.Mesh(planeM(60, 3.2), snowM); swSnow.rotation.x = -Math.PI / 2; swSnow.position.set(-2, BS.SW + 0.004, -1.6); swSnow.receiveShadow = true; root.add(swSnow);
    const road = new THREE.Mesh(planeM(60, 7), roadM); road.rotation.x = -Math.PI / 2; road.position.set(-2, 0.002, -6.7); road.receiveShadow = true; root.add(road);
    // snowbank along the kerb (lumpy)
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5 + 0.3 * hsh(i), 14, 10), snowM); m.scale.set(1.4, 0.38, 0.7); m.position.set(-30 + i * 1.5, 0.12, -3.3); m.receiveShadow = true; root.add(m); }
    // our facade above the shopfront: brick, the gold sign board, an awning; snow on the sill and the awning
    box(8.6, 3.4, 0.3, brick, [-1.9, BS.CEIL + 1.7, -0.02]);
    const sign = new THREE.Mesh(boxM(4.4, 0.6, 0.08), greenPaint); sign.position.set(-3.0, 3.05, -0.16); root.add(sign);
    const sT = canvasTex("bsSign", 1024, 140, (g) => { g.fillStyle = "#1f4a3a"; g.fillRect(0, 0, 1024, 140); g.strokeStyle = "#c8a040"; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 120); g.fillStyle = "#e8c060"; g.font = `bold 84px ${SERIF}`; g.textAlign = "center"; g.fillText("THE COPPER SPOON", 512, 102); });
    const sf = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 0.56), new THREE.MeshStandardMaterial({ map: sT, roughness: 0.5, metalness: 0.2 })); sf.position.set(-3.0, 3.05, -0.205); sf.rotation.y = Math.PI; root.add(sf);
    for (const x of [-5.3, -0.7]) { const lp = ph("street_lamp_02", [x, 2.95, -0.25], Math.PI, { h: 1.0 }); void lp; const L = new THREE.SpotLight("#ffcf8a", 9, 8, 0.9, 0.6, 1.6); L.position.set(x, 3.2, -0.8); L.target.position.set(x, 0, -1.6); root.add(L, L.target); glow(root, [x, 3.15, -0.75], "#ffd8a0", 0.7, 0.8); }
    box(3.95, 0.06, 0.3, snowM, [-3.65, 0.79, -0.15]);                                         // snow on the sill
    // the warm spill from our window onto the snow
    const spill = new THREE.PointLight("#ffc890", 4, 6, 1.5); spill.position.set(-3.6, 1.6, 0.6); root.add(spill);
    // NEXT DOOR: the boarded-up restaurant (grey plaster, plywood over the windows and door, the review taped on, CLOSED)
    { box(6.2, 6.6, 0.3, phMat("painted_plaster_wall", 1 / 2.5, 1 / 2.5, { tint: "#8a8a92", rough: 0.95 }), [5.5, 3.3, -0.02]);
      box(3.4, 1.9, 0.06, plywood, [4.6, 1.65, -0.2]); box(1.0, 2.2, 0.06, plywood, [7.5, 1.1, -0.2]);
      for (const [x, y, r] of [[3.2, 1.0, 0.4], [6.0, 2.2, -0.3], [7.5, 1.6, 0.6]]) box(0.06, 1.0, 0.03, std("#8a8a80", 0.6, 0.5), [x, y, -0.25], 0, false), void r;
      const rev = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.73), new THREE.MeshStandardMaterial({ map: avoidTex(), roughness: 0.85, side: THREE.DoubleSide })); rev.position.set(4.3, 1.7, -0.24); rev.rotation.set(0, Math.PI, 0.04); root.add(rev);
      const cT = canvasTex("bsClosed", 512, 160, (g) => { g.fillStyle = "#f2ece0"; g.fillRect(0, 0, 512, 160); g.fillStyle = "#b02a24"; g.font = "bold 92px sans-serif"; g.textAlign = "center"; g.fillText("CLOSED", 256, 112); });
      const cs = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), new THREE.MeshStandardMaterial({ map: cT, roughness: 0.8 })); cs.position.set(5.6, 2.05, -0.24); cs.rotation.set(0, Math.PI, -0.08); root.add(cs);
      const old = canvasTex("bsGoldFork", 1024, 140, (g) => { g.fillStyle = "#3a3a3e"; g.fillRect(0, 0, 1024, 140); g.fillStyle = "#9a8a6a"; g.font = `bold 80px ${SERIF}`; g.textAlign = "center"; g.fillText("THE GOLDEN FORK", 512, 100); });
      const os = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.55), new THREE.MeshStandardMaterial({ map: old, roughness: 0.8 })); os.position.set(5.5, 3.05, -0.2); os.rotation.y = Math.PI; root.add(os); }
    // the west neighbours (lit shop windows) and the far side of the street
    const shopfront = (x0: number, x1: number, z: number, facing: number, tint: string, seed: number) => {
      const w = x1 - x0, cx = (x0 + x1) / 2;
      box(w, 6.6, 0.3, phMat("painted_plaster_wall", 1 / 2.5, 1 / 2.5, { tint, rough: 0.95 }), [cx, 3.3, z]);
      for (let k = 0; k < Math.floor(w / 1.6); k++) { const wx = x0 + 0.9 + k * 1.6; for (const wy of [1.6, 4.4]) { const lit = hsh(seed + k * 3 + wy) > 0.35;
        const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, wy < 2 ? 1.7 : 1.2), new THREE.MeshStandardMaterial({ color: lit ? "#ffd8a0" : "#2a3048", emissive: lit ? "#ffb860" : "#000000", emissiveIntensity: lit ? 0.9 : 0, roughness: 0.3 }));
        wm.position.set(wx, wy, z - facing * 0.16); wm.rotation.y = facing > 0 ? 0 : Math.PI; root.add(wm);
        box(1.12, 0.06, 0.2, snowM, [wx, wy - (wy < 2 ? 0.88 : 0.63), z - facing * 0.2], 0, false); } }
    };
    shopfront(-16, -6.2, -0.02, 1, "#c8a878", 11); shopfront(8.8, 18, -0.02, 1, "#a8b4c4", 13);
    shopfront(-18, -6, -10.4, -1, "#b8907a", 17); shopfront(-6, 4, -10.4, -1, "#90a8b0", 19); shopfront(4, 18, -10.4, -1, "#c8b088", 23);
    const sn = snow(2600, [[-12, 0, -9], [9, 6, 0.0]], 3); root.add(sn.mesh);
    anim.push((t, c, light) => { sn.set(t, (c.snowK ?? 1) * (light === "bsSnow" || light === "bsDin" ? 1 : 0)); });
  }

  // =============================================== THE CUTAWAY (x 400) ===============================================
  const CX = BS.CX;
  const heatWaves: THREE.Mesh[] = [];
  const cutCrust: THREE.MeshStandardMaterial = std("#f4ece0", 0.7);
  { const D = 7, W = 18;
    const cake = new THREE.Mesh(boxM(W, 1.6, D), std("#d8a04e", 0.9)); cake.position.set(CX, 0.8, 0); cake.receiveShadow = true; root.add(cake);
    // sponge pores on the cut face
    for (let i = 0; i < 140; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.05 + 0.12 * hsh(i + 4), 12), std("#a8702e", 0.95)); p.position.set(CX - W / 2 + hsh(i + 1) * W, 0.15 + hsh(i + 2) * 1.3, D / 2 + 0.005); root.add(p); }
    const ice = new THREE.Mesh(boxM(W, 2.6, D), new THREE.MeshStandardMaterial({ color: "#f6eedc", roughness: 0.45, emissive: "#c8dcf0", emissiveIntensity: 0.08 })); ice.position.set(CX, 1.6 + 1.3, 0); ice.receiveShadow = true; root.add(ice);
    const ribbon = tubeAlong(Array.from({ length: 24 }, (_, i) => [CX - W / 2 + i * (W / 23), 2.3 + 0.35 * Math.sin(i * 0.8), D / 2 + 0.05] as V3), 0.16, std("#d8607a", 0.5)); root.add(ribbon);
    for (let i = 0; i < 160; i++) { const g2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.03 + 0.05 * hsh(i + 8), 0), new THREE.MeshStandardMaterial({ color: "#e8f6ff", roughness: 0.1, metalness: 0.2, emissive: "#a8d8ff", emissiveIntensity: 0.5 })); g2.position.set(CX - W / 2 + hsh(i + 3) * W, 1.7 + hsh(i + 5) * 2.4, D / 2 + 0.03); root.add(g2); }
    // the meringue: a white back wall + layers of glossy man-sized bubbles
    // the meringue wall reads as foam: a pore texture (open bubble pockets with toasted-cream rims), not a flat cream sheet
    const porT = canvasTex("merPores", 512, 512, (c) => { c.fillStyle = "#ece0cb"; c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) { const x = hsh(i + 0.7) * 512, y = hsh(i + 3.1) * 512, r = 3 + 20 * Math.pow(hsh(i + 5.3), 2.2);
        c.fillStyle = `rgba(255,251,242,${0.55 + 0.35 * hsh(i + 8.8)})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        c.strokeStyle = `rgba(160,124,82,${0.35 + 0.3 * hsh(i + 2.2)})`; c.lineWidth = 1 + 1.5 * hsh(i + 6.6); c.beginPath(); c.arc(x, y, r, 0.4, 0.4 + 4.2); c.stroke(); } });
    porT.wrapS = porT.wrapT = THREE.RepeatWrapping; porT.repeat.set(5, 1.3);
    const mer = new THREE.Mesh(boxM(W, 4.2, 0.3), new THREE.MeshStandardMaterial({ map: porT, roughness: 0.75 })); mer.position.set(CX, BS.CUT_ICE + 2.1, -D / 2); root.add(mer);
    const bubM = new THREE.MeshPhysicalMaterial({ color: "#e4f0ff", roughness: 0.05, metalness: 0, clearcoat: 1, iridescence: 0.8, iridescenceIOR: 1.3, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    const bubs: { m: THREE.Mesh; p: V3; r: number }[] = [];
    for (let i = 0; i < 70; i++) { const r = 0.3 + 0.75 * Math.pow(hsh(i + 0.4), 1.4); const p: V3 = [CX - W / 2 + hsh(i + 9.2) * W, BS.CUT_ICE + r * 0.9 + hsh(i + 2.7) * (4.0 - 2 * r), -D / 2 + 0.5 + hsh(i + 5.5) * (D - 1.2)];
      if (Math.abs(p[0] - (CX - 0.75)) < 0.75 && p[2] > 0.5 && p[1] < BS.CUT_ICE + 2.2) continue; if (Math.abs(p[0] - (CX + 0.85)) < 0.75 && p[2] > 0.5 && p[1] < BS.CUT_ICE + 2.2) continue;
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), bubM); m.position.set(...p); m.renderOrder = 2; root.add(m); bubs.push({ m, p, r }); }
    // the matrix between bubbles: little white foam blobs
    for (let i = 0; i < 260; i++) { const r = 0.06 + 0.16 * hsh(i + 30); const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), std("#f2eadc", 0.6)); m.position.set(CX - W / 2 + hsh(i + 31) * W, BS.CUT_ICE + 0.05 + hsh(i + 32) * 4.0, -D / 2 + 0.3 + hsh(i + 33) * (D - 0.8)); root.add(m); }
    // the crust on top (browns with c.crust) with peaks, and the oven heat above it
    const cr = new THREE.Mesh(new THREE.PlaneGeometry(W, D, 90, 30), cutCrust); { const p = cr.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, 0.25 * Math.pow(Math.max(0, Math.sin(p.getX(i) * 2.3) * Math.sin(p.getY(i) * 2.7)), 3) + 0.06 * Math.sin(p.getX(i) * 9)); cr.geometry.computeVertexNormals(); }
    cr.rotation.x = -Math.PI / 2; cr.position.set(CX, BS.CUT_ICE + 4.15, 0); cr.castShadow = true; root.add(cr);
    const heatSky = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.4, 6), new THREE.MeshBasicMaterial({ color: "#b8501a" })); heatSky.position.set(CX, BS.CUT_ICE + 7.0, -D / 2 - 0.4); root.add(heatSky);
    const cutFl = flames(80, 51, 0.25); root.add(cutFl.mesh);
    const heatL = new THREE.PointLight("#ff8a3a", 6, 14, 1.4); heatL.position.set(CX, BS.CUT_ICE + 6.2, 2.5); root.add(heatL);
    const coldL = new THREE.PointLight("#9fcaff", 2.4, 9, 1.5); coldL.position.set(CX, 2.6, 4.0); root.add(coldL);
    // heat waves: glowing orange ribbons that come down from the crust and stall in the top band of bubbles
    for (let i = 0; i < 9; i++) { const x0 = CX - 7 + i * 1.75, pts: V3[] = Array.from({ length: 12 }, (_, k) => [x0 + 0.22 * Math.sin(k * 1.3 + i), BS.CUT_ICE + 4.1 - k * 0.12, 1.2 + 0.6 * hsh(i)] as V3);
      const m = tubeAlong(pts, 0.05, new THREE.MeshBasicMaterial({ color: "#ff9a3a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.renderOrder = 4; root.add(m); heatWaves.push(m); }
    // cold fog at the ice cream
    const fogM = new THREE.MeshBasicMaterial({ color: "#d8ecff", transparent: true, opacity: 0, depthWrite: false });
    const fogs: THREE.Mesh[] = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.6 + 0.4 * hsh(i + 70), 12, 8), fogM.clone()); m.scale.set(1.6, 0.4, 1); m.position.set(CX - 7 + i * 1.3, BS.CUT_ICE + 0.15, 2.0 + hsh(i + 71)); root.add(m); fogs.push(m); }
    anim.push((t, c) => {
      const h = cl(c.heat ?? 0), crust = cl(c.crust ?? 0), fr = cl(c.frostCut ?? 1);
      heatWaves.forEach((m, i) => { const ph2 = (t * 0.55 + i * 0.13) % 1; m.position.y = -ph2 * 0.9 * h; (m.material as THREE.MeshBasicMaterial).opacity = h * (0.85 - 0.8 * ph2); m.scale.set(1, 1 - 0.4 * ph2, 1); });
      cutCrust.color.set("#f4ece0").lerp(new THREE.Color("#a0602a"), crust);
      cutFl.set(t, 0.55, [CX, BS.CUT_ICE + 4.35, 0], 8.5, 1.1); heatL.intensity = 2.6 + 2.0 * h;
      bubs.forEach((b, i) => { const s = 1 + 0.025 * Math.sin(t * 2.2 + i) + (c.boing && i === 0 ? 0.12 * Math.exp(-c.boing * 3) * Math.sin(c.boing * 22) : 0); b.m.scale.setScalar(s); });
      fogs.forEach((m, i) => { (m.material as THREE.MeshBasicMaterial).opacity = 0.18 * fr; m.position.x = CX - 7 + i * 1.3 + 0.3 * Math.sin(t * 0.4 + i); });
    });
  }

  // =============================================== THE DESSERTS + FX ===============================================
  const wood = phMat("kitchen_wood", 1 / 0.5, 1 / 0.5, { tint: "#d8b48a", rough: 0.7 });
  const alK = alaska(0.2); root.add(alK.g);                    // the kitchen one: heaped, baked in the oven, carried out, cracked by the critic
  const alF = alaska(0.2); root.add(alF.g);                    // the finale one (and the flash-forward): flambéed at the table
  const tray: ReturnType<typeof alaska>[] = [0, 1, 2].map(() => { const a = alaska(0.1); root.add(a.g); a.set({ bake: 0.85, heap: 1 }); return a; });
  const trayM = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 40), new THREE.MeshStandardMaterial({ color: "#c8ccd2", roughness: 0.25, metalness: 1 })); root.add(trayM);
  const pe = peel(wood); pe.scale.setScalar(1.5); root.add(pe);
  const pan = copperPan(); root.add(pan);
  const flK = flames(70, 61, 0.55); root.add(flK.mesh);       // flambé flames over a dessert
  const boom = puffs(36, "fire", 71); root.add(boom.g);
  const smoke = puffs(26, "smoke", 81); root.add(smoke.g);
  const flameL = new THREE.PointLight("#ff8a3a", 0, 6, 1.6); root.add(flameL);
  const rumStream = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 1, 8, 1, true), new THREE.MeshStandardMaterial({ color: "#9a4a14", roughness: 0.1, transparent: true, opacity: 0.85, emissive: "#3a1004" })); rumStream.geometry.translate(0, -0.5, 0); root.add(rumStream);
  const sweat: THREE.Mesh[] = Array.from({ length: 6 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012 + 0.006 * hsh(i), 10, 8), new THREE.MeshPhysicalMaterial({ color: "#d8ecff", roughness: 0.05, transparent: true, opacity: 0.8, clearcoat: 1 })); m.scale.set(1, 1.5, 1); root.add(m); return m; });
  anim.push((t, c) => {
    // kitchen dessert
    alK.g.visible = (c.alKon ?? 0) > 0.5; alK.g.position.set(c.alKx ?? 0, c.alKy ?? 0, c.alKz ?? 0); alK.g.rotation.y = c.alKry ?? 0;
    alK.set({ bake: c.alKbake ?? 0, char: c.alKchar ?? 0, heap: c.alKheap ?? 1, crack: c.alKcrack ?? 0, frost: c.alKfrost ?? 0 });
    alF.g.visible = (c.alFon ?? 0) > 0.5; alF.g.position.set(c.alFx ?? 0, c.alFy ?? 0, c.alFz ?? 0); alF.g.rotation.y = c.alFry ?? 0;
    alF.set({ bake: c.alFbake ?? 0.85, char: 0, heap: 1, crack: c.alFcrack ?? 0, frost: c.alFfrost ?? 0 });
    const tOn = (c.trayOn ?? 0) > 0.5; trayM.visible = tOn; tray.forEach((a, i) => { a.g.visible = tOn; const ang = i * TAU / 3 + 0.4; a.g.position.set((c.trayX ?? 0) + Math.cos(ang) * 0.2, (c.trayY ?? 0) + 0.012, (c.trayZ ?? 0) + Math.sin(ang) * 0.2); });
    trayM.position.set(c.trayX ?? 0, c.trayY ?? 0, c.trayZ ?? 0);
    pe.visible = (c.peelOn ?? 0) > 0.5; pe.position.set(c.peelX ?? 0, c.peelY ?? 0, c.peelZ ?? 0); pe.rotation.set(0, c.peelRy ?? 0, c.peelRz ?? 0);
    pan.visible = (c.panOn ?? 0) > 0.5; pan.position.set(c.panX ?? 0, c.panY ?? 0, c.panZ ?? 0); pan.rotation.set(c.panTilt ?? 0, c.panRy ?? 0, 0);
    // flames over the finale dessert (c.flame 0..1) and the burst (c.boomAge s, -1 off)
    const fk = cl(c.flame ?? 0), fx = c.alFx ?? 0, fy = (c.alFy ?? 0) + 0.2, fz = c.alFz ?? 0, bk = cl(c.boomK ?? 0);
    flK.set(t, fk * (0.42 + 0.3 * bk), [fx, fy, fz], 0.11 * (1 + 0.35 * bk), 0.38 * (1 + 1.5 * bk));
    flameL.position.set(fx, fy + 0.35, fz); flameL.intensity = (fk * 2.0 + bk * 5.0) * (0.85 + 0.15 * Math.sin(t * 19) * Math.sin(t * 7.7));
    boom.set(c.boomAge ?? -1, [fx, fy + 0.05, fz], 0.6 + 0.3 * bk);
    smoke.set(c.smokeAge ?? -1, [BS.OVEN_MOUTH[0], BS.OVEN_MOUTH[1] + 0.05, BS.OVEN_MOUTH[2] + 0.06], 1.0, [0, 1, 0.9]);
    const rs = cl(c.rum ?? 0); rumStream.visible = rs > 0.02 && pan.visible; if (rumStream.visible) { const lipP = new THREE.Vector3(-0.075, 0.04, 0).applyEuler(pan.rotation).add(pan.position); const top = fy + 0.12; rumStream.position.copy(lipP); rumStream.scale.set(1, Math.max(0.02, lipP.y - top), 1); }
    const sw = c.sweat ?? -1; sweat.forEach((m, i) => { const a = sw - i * 0.07; m.visible = sw >= 0 && a > 0 && a < 0.8; if (!m.visible) return; const ang = (i / 6 - 0.5) * 2.2; m.position.set((c.sweatX ?? 0) + Math.sin(ang) * a * 0.7, (c.sweatY ?? 0) + a * 1.1 - 3.2 * a * a, (c.sweatZ ?? 0) - Math.cos(ang) * a * 0.25); });
  });

  // ---------------- marks, cams, pose ----------------
  const marks: Record<string, V3> = { critic: BS.CRITIC, kidBench: BS.KID_BENCH, kidOven: BS.KID_OVEN, chef: BS.CHEF_READ, dish: BS.DISH, cook1: BS.COOK1, cook2: BS.COOK2, chalk: BS.CHALK, cut: [CX, BS.CUT_ICE, 2] };
  const cams: SetDef["cams"] = {
    dining: { pos: [-2.0, 1.55, -0.8 + 1.4], look: [-3.4, 1.1, 2.4], fov: 46 },
    kitchen: { pos: [0.0, 1.7, 8.0], look: [3.5, 1.1, 10.6], fov: 50 },
    oven: { pos: [0.9, 1.25, 9.1], look: [-0.2, 1.2, 9.4], fov: 46 },
    street: { pos: [-6.5, 1.55, -3.0], look: [-2.0, 1.4, 0.0], fov: 46 },
    cut: { pos: [CX, BS.CUT_ICE + 1.7, 9.5], look: [CX, BS.CUT_ICE + 1.4, 0], fov: 46 },
  };
  const pose = (t: number, c: Ctl, light = "bsKit") => { for (const a of anim) a(t, c, light); };
  const sunW = { bsKit: [0.3, 0.9, -0.3] as V3, bsDin: [0.25, 0.6, -0.75] as V3, bsSnow: [0.4, 0.75, -0.5] as V3, bsCut: [0.2, 0.95, 0.25] as V3 };
  const env = { bsKit: { hdri: "warm_restaurant", i: 0.35 }, bsDin: { hdri: "warm_restaurant_night", i: 0.5 }, bsSnow: { hdri: "winter_evening", i: 0.4 }, bsCut: { hdri: "warm_restaurant", i: 0.5 } };
  if ((getInputProps() as { testScene?: boolean }).testScene) ph("folding_wooden_stool", [-1.0, 0, 10.5], 0.3, { h: 0.44 });   // kit test seat (top 0.44)
  // ---- kit test (inputProps.screensTest): the in-world motion-graphics helpers on a board in the dining room, facing west
  if ((getInputProps() as { screensTest?: boolean }).screensTest) {
    const X = 2.05, RY = -Math.PI / 2, g = new THREE.Group(); root.add(g);
    const cd = countdown(0.9, 0.42, "OVEN TIMER").place(g, [X, 2.05, 1.2], RY);
    const ct = counter(0.7, 0.7, "DAYS WITHOUT A", "BAD REVIEW").place(g, [X, 1.95, 2.2], RY);
    const sf = splitFlap(1.1, 0.24, 6); sf.sign.place(g, [X, 2.45, 2.75], RY);
    const dl = dial(0.5, ["0", "20", "40", "60", "80", "100"], "TONS").place(g, [X, 1.35, 1.25], RY);
    const tb = tube(0.22, 0.8, ["1", "2", "3", "4", "5", "6", "7", "8", "9"], "#4a90d9", "INCHES").place(g, [X, 1.3, 2.05], RY);
    const ty = tally(0.7, 0.45, "PIES SENT BACK").place(g, [X, 1.3, 2.75], RY);
    anim.push((t) => {
      cd.set(Math.round((185 - t * 9) * 10) / 10); ct.set(Math.max(0, 12 - Math.floor(t * 1.5))); sf.flip("OPEN", "CLOSED", (t - 2) / 2.5);
      dl.set(Math.round(Math.min(0.82, t / 8) * 200) / 200); tb.set(Math.round(Math.min(1, t / 8) * 90) / 90); ty.set(Math.min(23, Math.floor(t * 3)));
    });
  }
  return { name: "bistro", root, marks, cams, pose, sunW, env } as SetDef;
};
