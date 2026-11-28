// "Why He Took His Car Battery to Bed" (p15, 2026-11-28, master prompt v34). ONE set file, three zones far apart in local
// metres (y up), built from Poly Haven assets plus modelled story objects (battkit.ts):
//  THE LOT (around the origin): a logging camp in snowy pines. The BUNKHOUSE (x -7..5, z -8.2..-1.2, floor CP.FB) faces +z
//    with its porch (deck CP.FB, z -1.2..0.7, x -2.2..2.2, one step to z 1.2), the door at x 0 (hinge x -0.48, swings OUT),
//    the porch thermometer on the right post (CP.THERMO). The truck lot is packed snow x -19..14, z 1.2..15. The row of
//    vehicles at z CP.ROW_Z, noses toward the bunkhouse (-z): the plow, three crew pickups, the hero's small car (CP.CAR,
//    hood + engine bay, battery tray CP.TRAY_W), the foreman's giant red truck (CP.GIANT, 1.28x, hood, frosted battery,
//    dipstick). The MESS HALL across the lot (x -7..7, z 19..27, front z 19, the 6:00 clock over the door). The yard light
//    pole at CP.YARD. Log decks, a diesel tank, drums, pines all round.
//  THE BUNKHOUSE INSIDE (x 96..104, z -4.5..3): the hero's double bunk A on the west wall (centre CP.BUNK_A, lower mattress top
//    CP.MAT_LO, upper CP.MAT_HI, head at z -1.9), the bunkmates' bunk B on the east wall, the foreman's bunk F behind it (it
//    collapses), the barrel stove on the back wall, a card table, a clothesline with long johns.
//  THE MESS HALL INSIDE (x 193..207, z -4..4): two long tables with benches, the cook's counter and the old fridge at the back,
//    the chalk menu board (BATTERY BABYSITTER), pendant lamps.
// Controls (pose c.*): bDoor 0..1 (bunkhouse door), therm (deg F on the porch thermometer), frost 0..1 (rime on the trucks and
//  the thermometer glass), snow 0..1 (falling snow), fog 0..1 (ice fog), lotBat 0/1 + lbX/lbY/lbZ/lbYaw (the hero's battery in
//  the lot), lbSteam 0..1, lbCut 0..1, lbGlow 0..1 (the cutaway), carHood 0..1, carRun 0..1 (headlights + exhaust), clamps 0/1,
//  giant: gtX/gtZ/gtYaw/gtDist/gtHood/gtDip/gtRun, crewRun0..2 0..1, crewHood 0..1, cables 0..1 (the jump-start chain),
//  bunkBat 0/1 + bbX/bbY/bbZ/bbYaw (the battery in the bunkhouse), blkA/blkB/blkLift (the blanket on bunk A, local z from its
//  centre), cap 0/1 (knit cap on the battery), pillowB 0/1, bag 0/1 (the hero's sleeping bag on the floor), fbat 0/1 +
//  fbX/fbY/fbZ/fbYaw (the foreman's truck battery), fblk 0..1 (his blanket), collapse 0..1, honey 0..1 (the blob),
//  hbX/hbY/hbZ/hbRoll (the honey bottle), tester 0/1 + tsX/tsY/tsZ, needle 0..1, stoveF 0..1.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { phModel, phMat, boxM, planeM, type PhModel } from "../ph";
import { TAU, cl, sm, hsh, std, canvasTex } from "./harborkit";
import { glow, mist } from "../setkit";
import { farPines, pine } from "./mailkit";
import { LiveSign, fitText } from "./screens";
import { pickup } from "./pickup";
import { cabinCar } from "./cabincar";
import { carBattery, knitCap, pillow, blanket, honeyBottle, pancakes, tester, cable } from "./battkit";
import type { SetDef, V3, Ctl } from "./types";

export const CP = {
  FB: 0.45, BH_Z: -1.2, DOOR: [0, 0.45, -1.2] as V3, PORCH_Z1: 0.7, THERMO: [-2.06, 1.25, 0.72] as V3, PORCH_HERO: [0.45, 0.45, -0.35] as V3,
  ROW_Z: 8.0, CAR: [0, 0, 7.55] as V3, GIANT: [4.6, 0, 8.0] as V3, GK: 1.28, CREW: [[-4.4, 0, 8.0], [-8.0, 0, 8.0], [-11.6, 0, 8.0]] as V3[], PLOW: [-15.4, 0, 8.0] as V3,
  TRAY_W: [0.46, 0.56, 5.7] as V3, HERO_HOOD: [0.28, 0, 5.4] as V3, YARD: [-1.6, 0, 12.2] as V3, MESS_Z: 19, GDIP: [4.29, 1.203, 5.73] as V3, GTRAY: [3.99, 1.1, 5.47] as V3, GPOST_R: [4.1, 1.38, 5.4] as V3, GPOST_B: [3.88, 1.38, 5.4] as V3,
  BX: 100, BUNK_A: [96.95, 0, -0.9] as V3, MAT_LO: 0.5, MAT_HI: 1.62, BUNK_B: [96.95, 0, -3.3] as V3, BUNK_F: [103.05, 0, -0.9] as V3, BUNK_E: [103.05, 0, 1.75] as V3,
  STOVE: [99.3, 0, -3.85] as V3, TABLE_B: [100.5, 0, 1.75] as V3,
  MX: 200, T1Z: -0.5, T2Z: 2.3, TT: 0.76, BENCH: 0.45, COUNTER: [200, 0, -3.1] as V3, CT: 0.98, FRIDGE: [205.7, 0, -3.35] as V3, BOARD: [196.4, 1.95, -3.94] as V3, HONEY_STACK: [204.62, 1.02, -2.95] as V3, COOK: [204.98, 0, -3.28] as V3,
};
/** seats for the guard (G9): [x, y(top), z, half width x, half depth z] */
export const CAMP_SEATS: [number, number, number, number, number][] = [];

const SANS = `"DejaVu Sans", Arial, sans-serif`;
const chalkTex = (key: string, W: number, H: number, lines: [string, number, number, string?][]) => canvasTex("chalk_" + key, W, H, (g) => {
  g.fillStyle = "#24302a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(255,255,255,${0.012 + 0.03 * hsh(i)})`; g.fillRect(hsh(i + 0.2) * W, hsh(i + 0.6) * H, 2 + 18 * hsh(i + 1.1), 1 + 3 * hsh(i + 1.7)); }
  g.strokeStyle = "#7a5a36"; g.lineWidth = W * 0.035; g.strokeRect(0, 0, W, H);
  for (const [t, y, s, c] of lines) { g.fillStyle = c ?? "#f2efe6"; g.globalAlpha = 0.92; fitText(g, t, W / 2, y * H, W * 0.86, s * H, "800", `"Comic Sans MS", "DejaVu Sans", Arial, sans-serif`); }
  g.globalAlpha = 1;
});

export const camp = (): SetDef => {
  const root = new THREE.Group(); root.name = "camp";
  const add = <T extends THREE.Object3D>(o: T, p: V3, yaw = 0, par: THREE.Object3D = root): T => { o.position.set(...p); o.rotation.y = yaw; par.add(o); return o; };
  const ph = (n: PhModel, p: V3, yaw = 0, o: { h?: number; s?: number; filt?: string } = {}, par: THREE.Object3D = root) => add(phModel(n, { center: true, ...o }), p, yaw, par);
  const box = (w: number, h: number, d: number, m: THREE.Material, p: V3, yaw = 0, par: THREE.Object3D = root, cast = true) => { const me = new THREE.Mesh(boxM(w, h, d), m); me.castShadow = cast; me.receiveShadow = true; return add(me, p, yaw, par); };
  const span = (a: V3, b: V3, m: THREE.Material, par: THREE.Object3D = root) => box(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]), m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], 0, par);
  const plane = (w: number, h: number, m: THREE.Material, p: V3, ry = 0, rx = 0, par: THREE.Object3D = root) => { const me = new THREE.Mesh(planeM(w, h), m); me.position.set(...p); me.rotation.set(rx, ry, 0); me.receiveShadow = true; par.add(me); return me; };
  const cyl = (r0: number, r1: number, h: number, m: THREE.Material, p: V3, n = 16, par: THREE.Object3D = root) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, n), m); me.castShadow = true; me.receiveShadow = true; return add(me, p, 0, par); };
  const anim: ((t: number, c: Ctl, light: string) => void)[] = [];
  const lamps: { L: THREE.PointLight; base: number; zone: string }[] = [];
  const pl = (p: V3, col: string, I: number, d: number, zone: string, par: THREE.Object3D = root) => { const L = new THREE.PointLight(col, I, d, 1.6); L.position.set(...p); par.add(L); lamps.push({ L, base: I, zone }); return L; };
  const label = (key: string, w: number, h: number, bg: string, fg: string, lines: [string, number][], p: V3, yaw = 0, par: THREE.Object3D = root, o: { emis?: number; font?: string; border?: string } = {}) => {
    const PX = 1024, PH = Math.round(PX * h / w);
    const tex = canvasTex("cpl_" + key, PX, PH, (g) => {
      g.fillStyle = bg; g.fillRect(0, 0, PX, PH);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 2 ? "0,0,0" : "255,255,255"},${0.03 + 0.04 * hsh(i)})`; g.fillRect(hsh(i + 0.3) * PX, hsh(i + 0.8) * PH, 3 + 10 * hsh(i + 1.3), 2); }
      if (o.border) { g.strokeStyle = o.border; g.lineWidth = PH * 0.07; g.strokeRect(PH * 0.06, PH * 0.06, PX - PH * 0.12, PH - PH * 0.12); }
      g.fillStyle = fg; const tot = lines.reduce((s, l) => s + l[1], 0); let y = (PH - tot * PH * 1.05) / 2;
      for (const [t, s] of lines) { y += s * PH * 1.05 / 2; fitText(g, t, PX / 2, y, PX * 0.84, s * PH, "900", o.font ?? SANS); y += s * PH * 1.05 / 2; }
    });
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, emissive: o.emis ? "#ffffff" : "#000000", emissiveMap: o.emis ? tex : null, emissiveIntensity: o.emis ?? 0 });
    const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.receiveShadow = true; return add(me, p, yaw, par);
  };

  // ===================== MATERIALS =====================
  const snowM = phMat("snow_02", 1 / 2.4, 1 / 2.4, { tint: "#f4f8ff", rough: 0.85, env: 0.9, key: "cpSnow" });
  const snowRoof = phMat("snow_03", 1 / 1.8, 1 / 1.8, { tint: "#f6f9ff", rough: 0.8, env: 0.9, key: "cpSnowR" });
  const lotM = phMat("snow_02", 1 / 3.2, 1 / 3.2, { tint: "#e2e6ee", rough: 0.8, env: 0.85, key: "cpLot" });
    const siding = phMat("weathered_plank_siding", 1 / 2.2, 1 / 2.2, { tint: "#a8784c", rough: 0.9, key: "cpSide" });
  const sidingMess = phMat("weathered_plank_siding", 1 / 2.2, 1 / 2.2, { tint: "#8a3a2c", rough: 0.9, key: "cpSideM" });
  const trim = std("#e8e0cc", 0.7), darkTrim = std("#3a2a1e", 0.8);
  const roofM = phMat("rusty_corrugated_iron", 1 / 1.6, 1 / 1.6, { tint: "#9a8070", rough: 0.6, metal: 0.4, key: "cpRoof" });
  const deckM = phMat("weathered_planks", 1 / 1.4, 1 / 1.4, { tint: "#b08a60", rough: 0.9, key: "cpDeck" });
  const logM = phMat("pine_bark", 1 / 1.0, 1 / 1.0, { tint: "#8a6a50", rough: 0.95, key: "cpLog" });
  const endGrain = new THREE.MeshStandardMaterial({ map: canvasTex("logEnd", 128, 128, (g) => { g.fillStyle = "#d8b07a"; g.fillRect(0, 0, 128, 128); for (let r = 6; r < 64; r += 5) { g.strokeStyle = `rgba(120,80,40,${0.25 + 0.2 * hsh(r)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(64, 64, r, 0, 6.3); g.stroke(); } g.strokeStyle = "#5a3a20"; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 60, 0, 6.3); g.stroke(); }), roughness: 0.9 });
  const glassWarm = new THREE.MeshStandardMaterial({ color: "#3a2a1a", emissive: "#ffb060", emissiveIntensity: 1.2, roughness: 0.2 });
  const wallIn = phMat("wood_plank_wall", 1 / 2.0, 1 / 2.0, { tint: "#c89060", rough: 0.9, key: "cpWallIn" });
  const floorIn = phMat("old_wooden_floor_01", 1 / 1.6, 1 / 1.6, { tint: "#b48a62", rough: 0.85, key: "cpFloorIn" });
  const beamM = phMat("rough_wood", 1 / 1.2, 1 / 1.2, { tint: "#7a5838", rough: 0.9, key: "cpBeam" });
  const ceilM = phMat("roof_planks", 1 / 1.6, 1 / 1.6, { tint: "#9a7452", rough: 0.9, key: "cpCeil" });
  const messWall = phMat("wood_plank_wall", 1 / 2.0, 1 / 2.0, { tint: "#e8dcc0", rough: 0.85, key: "cpMessW" });
  const messLow = phMat("weathered_planks", 1 / 1.4, 1 / 1.4, { tint: "#4f7a6a", rough: 0.85, key: "cpMessL" });
  const tableM = phMat("wood_table_worn", 1 / 1.4, 1 / 1.4, { tint: "#c89a6a", rough: 0.7, key: "cpTable" });

  // ===================== THE LOT: ground, snowbanks, ruts =====================
  plane(140, 120, snowM, [0, 0, 10], 0, -Math.PI / 2);
  plane(33, 13.8, lotM, [-2.5, 0.006, 8.1], 0, -Math.PI / 2);
  { // soft tyre tracks: a canvas alpha strip (two worn lanes with slush), laid along the lot's driving lines
    const rt = canvasTex("cpRuts", 512, 128, (g) => { g.clearRect(0, 0, 512, 128);
      for (const y0 of [34, 94]) for (let i = 0; i < 700; i++) { const x = hsh(i + y0) * 512, y = y0 + (hsh(i + y0 + 0.5) - 0.5) * 26 * (0.4 + hsh(i + 3.3)); g.fillStyle = `rgba(70,66,64,${0.05 + 0.1 * hsh(i + 1.7)})`; g.beginPath(); g.ellipse(x, y, 6 + 18 * hsh(i + 2.1), 2 + 4 * hsh(i + 2.9), 0, 0, 6.3); g.fill(); } });
    rt.wrapS = THREE.RepeatWrapping;
    const rm = new THREE.MeshStandardMaterial({ map: rt, transparent: true, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
    for (const [x, z, w, d, a] of [[-6, 3.7, 28, 1.9, 0], [-2.5, 11.0, 24, 1.9, 0], [3.4, 2.4, 3.6, 1.9, Math.PI / 2], [-1.5, 2.4, 3.6, 1.9, Math.PI / 2 + 0.2]] as number[][]) {
      const m = rm.clone(); m.map = rt.clone(); m.map.repeat.set(w / 6, 1); m.map.needsUpdate = true; plane(w, d, m, [x, 0.012, z], a, -Math.PI / 2); }
  }
  const bank = new THREE.SphereGeometry(1, 16, 9, 0, TAU, 0, Math.PI / 2);
  const bankAt = (x: number, z: number, sx: number, sy: number, sz: number, yaw = 0) => { const me = new THREE.Mesh(bank, snowM); me.scale.set(sx, sy, sz); me.castShadow = true; me.receiveShadow = true; add(me, [x, 0, z], yaw); };
  for (let i = 0; i < 16; i++) bankAt(-19 + i * 2.2 + hsh(i) * 0.8, 13.6 + hsh(i + 3) * 0.6, 1.4 + hsh(i + 5) * 0.8, 0.45 + hsh(i + 7) * 0.4, 0.8, i);   // behind the row
  for (let i = 0; i < 6; i++) bankAt(14.6 + hsh(i + 11) * 0.6, 2 + i * 2.3, 0.9, 0.5 + hsh(i) * 0.3, 1.4, i);
  for (let i = 0; i < 6; i++) bankAt(-19.8 - hsh(i + 13) * 0.6, 2 + i * 2.3, 0.9, 0.45 + hsh(i + 1) * 0.3, 1.4, i);
  for (let i = 0; i < 8; i++) bankAt(-6.5 + i * 1.6, -0.45 + (i > 2 && i < 6 ? 1.6 : 0), 0.7 + hsh(i) * 0.3, 0.32, 0.55, i);   // along the bunkhouse front (clear of the porch)
  // footprints and tyre prints are in the ruts texture; a few lumps near the lens areas
  for (let i = 0; i < 40; i++) { const x = -18 + hsh(i + 30) * 32, z = 1.5 + hsh(i + 31) * 13; if (Math.abs(z - CP.ROW_Z) < 3.6) continue; const me = new THREE.Mesh(new THREE.SphereGeometry(0.12 + 0.12 * hsh(i), 8, 6), snowM); me.scale.y = 0.4; me.castShadow = true; add(me, [x, 0, z]); }

  // ===================== THE BUNKHOUSE (outside) =====================
  const BX0 = -7, BX1 = 5, BZ0 = -8.2, BZ1 = CP.BH_Z, FB = CP.FB, BH = 3.1;
  span([BX0 - 0.1, 0, BZ0 - 0.1], [BX1 + 0.1, FB, BZ1 + 0.1], std("#5a4a3c", 0.9));                    // skirt / blocks
  const holes: [number, number, number, number][] = [[-0.48, 0.48, FB, FB + 2.05], [-5.1, -3.9, FB + 0.95, FB + 2.05], [-2.9, -1.9, FB + 0.95, FB + 2.05], [2.0, 3.0, FB + 0.95, FB + 2.05]];
  { // front wall with holes (door + windows); thin, hollow behind the door
    let x = BX0; const sorted = [...holes].sort((a, b) => a[0] - b[0]);
    for (const [a, b, y0, y1] of sorted) { span([x, FB, BZ1 - 0.14], [a, BH + FB, BZ1], siding); span([a, FB, BZ1 - 0.14], [b, y0, BZ1], siding); span([a, y1, BZ1 - 0.14], [b, BH + FB, BZ1], siding); x = b; }
    span([x, FB, BZ1 - 0.14], [BX1, BH + FB, BZ1], siding);
    for (const [a, b, y0, y1] of sorted) { span([a - 0.07, y1, BZ1], [b + 0.07, y1 + 0.08, BZ1 + 0.05], trim); if (y0 > FB + 0.1) span([a - 0.07, y0 - 0.06, BZ1], [b + 0.07, y0, BZ1 + 0.07], trim); for (const xx of [a - 0.07, b]) span([xx, y0, BZ1], [xx + 0.07, y1, BZ1 + 0.05], trim); }
  }
  span([BX0, FB, BZ0], [BX1, BH + FB, BZ0 + 0.14], siding); span([BX0, FB, BZ0], [BX0 + 0.14, BH + FB, BZ1], siding); span([BX1 - 0.14, FB, BZ0], [BX1, BH + FB, BZ1], siding);
  span([BX0, BH + FB - 0.02, BZ0], [BX1, BH + FB, BZ1], darkTrim);
  // windows: warm panes with mullions and checked curtains
  const panes: THREE.Mesh[] = [];
  for (const [a, b, y0, y1] of holes.slice(1)) {
    const pn = plane(b - a, y1 - y0, glassWarm.clone(), [(a + b) / 2, (y0 + y1) / 2, BZ1 - 0.1]); panes.push(pn);
    span([(a + b) / 2 - 0.025, y0, BZ1 - 0.09], [(a + b) / 2 + 0.025, y1, BZ1 - 0.05], trim); span([a, (y0 + y1) / 2 - 0.025, BZ1 - 0.09], [b, (y0 + y1) / 2 + 0.025, BZ1 - 0.05], trim);
    for (const s of [-1, 1]) { const cur = plane((b - a) * 0.3, (y1 - y0) * 0.95, std("#c84a3a", 0.95), [(a + b) / 2 + s * (b - a) * 0.36, (y0 + y1) / 2, BZ1 - 0.12]); void cur; }
    span([a - 0.1, y0 - 0.12, BZ1], [b + 0.1, y0 - 0.06, BZ1 + 0.2], snowM);   // snow on the sill
  }
  // the vestibule behind the door: a warm lit box (the door opens onto it)
  span([-0.9, FB, BZ1 - 2.2], [0.9, FB + 0.02, BZ1 - 0.14], floorIn); span([-0.9, FB, BZ1 - 2.2], [0.9, FB + 2.5, BZ1 - 2.1], wallIn);
  span([-0.9, FB, BZ1 - 2.2], [-0.8, FB + 2.5, BZ1 - 0.14], wallIn); span([0.8, FB, BZ1 - 2.2], [0.9, FB + 2.5, BZ1 - 0.14], wallIn); span([-0.9, FB + 2.45, BZ1 - 2.2], [0.9, FB + 2.55, BZ1 - 0.14], wallIn);
  ph("caged_hanging_light", [0, FB + 2.2, BZ1 - 1.2], 0, { h: 0.4 }); const vestL = pl([0, FB + 1.9, BZ1 - 1.0], "#ffb468", 4.5, 5, "lot");
  ph("rubber_boots", [-0.55, FB + 0.02, BZ1 - 1.8], 0.3, { h: 0.36 }); ph("wooden_broom", [0.62, FB + 0.75, BZ1 - 1.9], 0.2, { h: 1.4 });
  // the door (hinge at x -0.48, swings OUT onto the porch)
  const door = new THREE.Group(); door.position.set(-0.48, FB, BZ1 + 0.02); root.add(door);
  { const dm = phMat("weathered_planks", 1 / 1.2, 1 / 1.2, { tint: "#7a4a2a", rough: 0.9, key: "cpDoor" });
    const d = new THREE.Mesh(boxM(0.96, 2.05, 0.06), dm); d.position.set(0.48, 1.025, 0.03); d.castShadow = true; door.add(d);
    for (const y of [0.4, 1.6]) { const z = new THREE.Mesh(boxM(0.9, 0.12, 0.03), darkTrim); z.position.set(0.48, y, 0.075); door.add(z); }
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), std("#c49a48", 0.3, 0.9)); kn.position.set(0.86, 1.05, 0.1); door.add(kn); }
  // porch: deck, step, posts, little roof, rail, lantern, thermometer
  span([-2.2, FB - 0.08, BZ1], [2.2, FB, CP.PORCH_Z1], deckM); span([-1.0, 0, CP.PORCH_Z1], [1.0, FB * 0.5, CP.PORCH_Z1 + 0.5], deckM);
  for (const x of [-2.06, 2.06]) span([x - 0.07, FB, CP.PORCH_Z1 - 0.14], [x + 0.07, FB + 2.55, CP.PORCH_Z1], std("#6a4a30", 0.85));
  { const pr = new THREE.Mesh(boxM(4.7, 0.08, 2.3), roofM); pr.position.set(0, FB + 2.62, BZ1 + 0.95); pr.rotation.x = 0.16; pr.castShadow = true; root.add(pr);
    const ps = new THREE.Mesh(boxM(4.7, 0.12, 2.3), snowRoof); ps.position.set(0, FB + 2.71, BZ1 + 0.94); ps.rotation.x = 0.16; ps.castShadow = true; root.add(ps);
    for (let i = 0; i < 14; i++) { const ic = new THREE.Mesh(new THREE.ConeGeometry(0.025 + 0.02 * hsh(i), 0.15 + 0.3 * hsh(i + 2), 6), std("#dff0ff", 0.1, 0, { transparent: true, opacity: 0.8 })); ic.rotation.x = Math.PI; add(ic, [-2.2 + i * 0.33, FB + 2.34 - 0.1 * hsh(i + 2), CP.PORCH_Z1 + 0.15]); } }
  for (const s of [-1, 1]) span([s * 2.06 - 0.03 + (s < 0 ? 0 : -0.0), FB + 0.9, BZ1 + 0.1], [s * 2.06 + 0.03, FB + 0.96, CP.PORCH_Z1 - 0.1], std("#6a4a30", 0.85));
  const lanternL = pl([0.78, FB + 2.05, BZ1 + 0.25], "#ffb060", 3.5, 7, "lot"); ph("Lantern_01", [0.78, FB + 1.86, BZ1 + 0.18], 0, { h: 0.34 }); const lanG = glow(root, [0.78, FB + 2.0, BZ1 + 0.24], "#ffb060", 0.8, 1);
  label("bhSign", 2.1, 0.42, "#2e5a3e", "#f2e6c8", [["BUNKHOUSE 2", 0.62]], [0, FB + 2.35, BZ1 + 0.03], 0, root, { border: "#f2e6c8" });
  // the porch thermometer: an enamel sign with a glass tube, -40..+40 F; value "temp|frost"
  const thermo = new LiveSign(0.16, 0.62, (g, v, W, H) => {
    const [ts, fs] = String(v).split("|"), T = Number(ts), F = Number(fs);
    g.fillStyle = "#f4f1e8"; g.fillRect(0, 0, W, H); g.strokeStyle = "#b3261e"; g.lineWidth = W * 0.06; g.strokeRect(W * 0.04, W * 0.04, W * 0.92, H - W * 0.08);
    const top = H * 0.08, bot = H * 0.82, tx = W * 0.5, y = (t: number) => bot - (bot - top) * ((t + 50) / 100);
    g.fillStyle = "#1b1b1b"; g.textAlign = "right";
    for (const t of [40, 20, 0, -20, -40]) { g.fillRect(tx - W * 0.2, y(t) - 1.5, W * 0.12, 3); fitText(g, (t > 0 ? "+" : "") + t, W * 0.2, y(t), W * 0.3, W * 0.15, "900"); }
    g.fillStyle = "#cfd8dc"; g.fillRect(tx - W * 0.06, top, W * 0.12, bot - top);
    g.fillStyle = "#d42a1e"; g.fillRect(tx - W * 0.045, y(T), W * 0.09, bot - y(T)); g.beginPath(); g.arc(tx, bot + W * 0.12, W * 0.14, 0, 6.3); g.fill();
    g.fillStyle = "#1b1b1b"; fitText(g, "°F", W * 0.78, H * 0.92, W * 0.4, W * 0.16, "900");
    if (F > 0) { g.globalAlpha = Math.min(1, F); for (let i = 0; i < 900; i++) { const fx = hsh(i) * W, fy = hsh(i + 0.4) * H, fr = 1 + 4 * hsh(i + 0.8); if (F < 0.9 && hsh(i + 2) < 0.4 && Math.abs(fx - tx) < W * 0.25 && fy > H * 0.3) continue; g.fillStyle = `rgba(235,245,255,${0.35 + 0.5 * hsh(i + 1.3)})`; g.beginPath(); g.arc(fx, fy, fr, 0, 6.3); g.fill(); } g.globalAlpha = 1; }
  }, { px: 256, frame: "#9aa3a8" }).place(root, CP.THERMO, 0);
  // firewood stack, chopping block with an axe, the generator, a shovel, drums
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.55, 10), [logM, endGrain, endGrain]); lg.rotation.x = Math.PI / 2; lg.castShadow = true; lg.receiveShadow = true; add(lg, [2.7 + i * 0.2 + (r % 2) * 0.1, 0.1 + r * 0.17, BZ1 + 0.35]); }
  span([2.6, 0.8, BZ1 + 0.05], [4.6, 0.86, BZ1 + 0.68], snowM);
  ph("tree_stump_01", [4.4, 0, 1.6], 0.4, { h: 0.5 }); { const axe = new THREE.Group(); const hd = new THREE.Mesh(boxM(0.06, 0.12, 0.2), std("#8a9096", 0.35, 0.8)); hd.position.set(0, 0, 0.06); axe.add(hd); const hn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.75, 8), std("#c89a5a", 0.6)); hn.position.set(0, 0.32, -0.04); hn.rotation.x = -0.35; axe.add(hn); axe.rotation.z = 0.3; add(axe, [4.4, 0.52, 1.6]); }
  ph("portable_generator", [5.8, 0, -1.6], -1.2, { h: 0.6 }); ph("rusted_spade_01", [-2.5, 0.65, CP.PORCH_Z1 - 0.1], 0.1, { h: 1.3 });
  for (const [x, z] of [[6.3, 0.6], [7.0, 0.9], [6.6, 1.6]]) ph("Barrel_01", [x, 0, z], hsh(x) * 3, { h: 0.9 });
  ph("metal_jerrycan", [7.6, 0, 1.3], 0.5, { h: 0.45 }); ph("old_tyre", [-8.0, 0, 0.4], 0, { h: 0.25 }); ph("old_tyre", [-8.0, 0.24, 0.45], 0.3, { h: 0.25 });
  // the roof (gable along x), snow on it, the stovepipe + smoke
  for (const s of [-1, 1]) { const w = (BZ1 - BZ0) / 2 + 0.5, rf = new THREE.Mesh(boxM(BX1 - BX0 + 0.8, 0.08, w / Math.cos(0.5)), roofM); rf.position.set((BX0 + BX1) / 2, BH + FB + Math.tan(0.5) * w / 2 - 0.05, (BZ0 + BZ1) / 2 + s * w / 2); rf.rotation.x = s * 0.5; rf.castShadow = true; root.add(rf);
    const sn = new THREE.Mesh(boxM(BX1 - BX0 + 0.8, 0.18, w / Math.cos(0.5)), snowRoof); sn.position.copy(rf.position); sn.position.y += 0.12; sn.rotation.x = s * 0.5; sn.castShadow = true; root.add(sn); }
  for (const s of [-1, 1]) { const g = new THREE.Shape(); const w = (BZ1 - BZ0) / 2; g.moveTo(-w, 0); g.lineTo(w, 0); g.lineTo(0, Math.tan(0.5) * w); g.closePath(); const me = new THREE.Mesh(new THREE.ShapeGeometry(g), siding); me.rotation.y = Math.PI / 2; me.position.set(s < 0 ? BX0 : BX1, BH + FB, (BZ0 + BZ1) / 2); root.add(me); }
  cyl(0.11, 0.11, 2.2, std("#2a2a2c", 0.5, 0.6), [-3.2, BH + FB + 1.4, -5.2]);
  { // CAMP 9 painted on the bunkhouse's front roof slope (read from the lot and the air)
    const w = (BZ1 - BZ0) / 2 + 0.5, cz = (BZ0 + BZ1) / 2 + w / 2, cy = BH + FB + Math.tan(0.5) * w / 2 + 0.2;
    const cp = label("camp9b", 6.0, 1.5, "#f4f6fa", "#8a2a22", [["CAMP 9", 0.8]], [0, 0, 0], 0, root); cp.position.set(1.0, cy + 0.02, cz + 0.11); cp.rotation.set(-Math.PI / 2 + 0.5, 0, 0); }
  const smoke: THREE.Sprite[] = []; for (let i = 0; i < 7; i++) smoke.push(mist(root, [-3.2, BH + FB + 2.6, -5.2], 1.2, "#d8dce4", 0.5));
  // ===================== THE MESS HALL (outside, across the lot) =====================
  const MZ = CP.MESS_Z, MX0 = -7, MX1 = 7, MZ1 = MZ + 8, MH = 3.5, MF = 0.3;
  span([MX0, 0, MZ], [MX1, MF, MZ1], std("#4a3e34", 0.9));
  const mholes: [number, number, number, number][] = [[-0.6, 0.6, MF, MF + 2.1], [-5.0, -3.4, MF + 1.0, MF + 2.2], [-2.6, -1.2, MF + 1.0, MF + 2.2], [1.2, 2.6, MF + 1.0, MF + 2.2], [3.4, 5.0, MF + 1.0, MF + 2.2]];
  { let x = MX0; for (const [a, b, y0, y1] of mholes) { span([x, MF, MZ], [a, MH + MF, MZ + 0.14], sidingMess); span([a, MF, MZ], [b, y0, MZ + 0.14], sidingMess); span([a, y1, MZ], [b, MH + MF, MZ + 0.14], sidingMess); x = b;
      plane(b - a, y1 - y0, y0 > MF + 0.1 ? glassWarm : std("#5a3a22", 0.85), [(a + b) / 2, (y0 + y1) / 2, MZ + 0.08], Math.PI);
      for (const xx of [a - 0.07, b]) span([xx, y0, MZ - 0.05], [xx + 0.07, y1, MZ], trim); span([a - 0.07, y1, MZ - 0.05], [b + 0.07, y1 + 0.08, MZ], trim); }
    span([x, MF, MZ], [MX1, MH + MF, MZ + 0.14], sidingMess); }
  span([MX0, MF, MZ1 - 0.14], [MX1, MH + MF, MZ1], sidingMess); span([MX0, MF, MZ], [MX0 + 0.14, MH + MF, MZ1], sidingMess); span([MX1 - 0.14, MF, MZ], [MX1, MH + MF, MZ1], sidingMess);
  for (const s of [-1, 1]) { const w = 4.5, rf = new THREE.Mesh(boxM(MX1 - MX0 + 0.8, 0.08, w / Math.cos(0.55)), roofM); rf.position.set(0, MH + MF + Math.tan(0.55) * w / 2 - 0.05, MZ + 4 + s * w / 2); rf.rotation.x = s * 0.55; rf.castShadow = true; root.add(rf);
    const sn = new THREE.Mesh(boxM(MX1 - MX0 + 0.8, 0.16, w / Math.cos(0.55)), snowRoof); sn.position.copy(rf.position); sn.position.y += 0.11; sn.rotation.x = s * 0.55; root.add(sn);
    if (s < 0) { const cp = label("camp9", 7, 1.6, "#f4f6fa", "#8a2a22", [["CAMP 9", 0.8]], [0, 0, 0], 0, root); cp.position.set(0, MH + MF + Math.tan(0.55) * w / 2 + 0.07, MZ + 4 - w / 2); cp.rotation.set(-Math.PI / 2 + 0.55, 0, Math.PI); } }
  for (const s of [-1, 1]) { const g = new THREE.Shape(); g.moveTo(-4.4, 0); g.lineTo(4.4, 0); g.lineTo(0, Math.tan(0.55) * 4.4); g.closePath(); const me = new THREE.Mesh(new THREE.ShapeGeometry(g), sidingMess); me.rotation.y = Math.PI / 2; me.position.set(s < 0 ? MX0 : MX1, MH + MF, MZ + 4); root.add(me); }
  { const gz = new THREE.Shape(); gz.moveTo(-7, 0); gz.lineTo(7, 0); gz.lineTo(0, Math.tan(0.55) * 4.4 * 0.0 + 3.0); gz.closePath(); }
  label("messSign", 2.8, 0.5, "#f2e6c8", "#5a1e14", [["MESS HALL", 0.6]], [0, MF + 2.45, MZ - 0.02], Math.PI, root, { border: "#5a1e14" });
  // the clock over the door (6:00)
  const clk = new LiveSign(0.62, 0.62, (g, v, W, H) => {
    const cx = W / 2, cy = H / 2, R = W * 0.46, hh = Number(v);
    g.clearRect(0, 0, W, H); g.fillStyle = "#2a2a2a"; g.beginPath(); g.arc(cx, cy, W * 0.5, 0, 6.3); g.fill(); g.fillStyle = "#f6f1e4"; g.beginPath(); g.arc(cx, cy, R, 0, 6.3); g.fill();
    g.fillStyle = "#1b1b1b"; for (let i = 1; i <= 12; i++) { const a = (i / 12) * 6.283 - Math.PI / 2; fitText(g, String(i), cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78, R * 0.3, W * 0.09, "900"); }
    const ha = ((hh % 12) / 12) * 6.283 - Math.PI / 2, ma = ((hh % 1)) * 6.283 - Math.PI / 2;
    g.strokeStyle = "#1b1b1b"; g.lineCap = "round"; g.lineWidth = W * 0.035; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ha) * R * 0.5, cy + Math.sin(ha) * R * 0.5); g.stroke();
    g.lineWidth = W * 0.022; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ma) * R * 0.75, cy + Math.sin(ma) * R * 0.75); g.stroke();
  }, { px: 256, round: true, frame: "#2a2a2a" }).place(root, [0, MF + 3.05, MZ - 0.05], Math.PI); clk.set(6);
  ph("caged_hanging_light", [0, MF + 2.3, MZ - 0.3], 0, { h: 0.35 }); const messL = pl([0, MF + 2.1, MZ - 0.6], "#ffb468", 3, 7, "lot");
  cyl(0.13, 0.13, 2.4, std("#2a2a2c", 0.5, 0.6), [4.2, MH + MF + 2.2, MZ + 5.5]);
  for (let i = 0; i < 5; i++) smoke.push(mist(root, [4.2, MH + MF + 3.4, MZ + 5.5], 1.3, "#d8dce4", 0.45));

  // ===================== THE YARD LIGHT, the diesel tank, log decks =====================
  cyl(0.13, 0.17, 7.2, phMat("rough_wood", 1, 1, { tint: "#6a5040", key: "cpPole" }), [CP.YARD[0], 3.6, CP.YARD[2]], 10);
  span([CP.YARD[0] - 0.05, 6.6, CP.YARD[2] - 1.4], [CP.YARD[0] + 0.05, 6.7, CP.YARD[2]], std("#3a3a3c", 0.5, 0.6));
  { const sh = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 18, 1, true), std("#3a5a4a", 0.5, 0.4, { side: THREE.DoubleSide })); add(sh, [CP.YARD[0], 6.5, CP.YARD[2] - 1.35]); }
  const yardL = new THREE.SpotLight("#ffc890", 0, 26, 0.95, 0.6, 1.4); yardL.position.set(CP.YARD[0], 6.35, CP.YARD[2] - 1.35); yardL.target.position.set(CP.YARD[0] + 0.5, 0, CP.YARD[2] - 6.5); yardL.castShadow = true; yardL.shadow.mapSize.set(1024, 1024); root.add(yardL); root.add(yardL.target);
  const yardG = glow(root, [CP.YARD[0], 6.3, CP.YARD[2] - 1.35], "#ffcf98", 2.4, 1);
  { const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 3.2, 26), std("#b8b4a8", 0.55, 0.4)); tk.rotation.z = Math.PI / 2; tk.castShadow = true; add(tk, [10.6, 1.35, 3.2]);
    for (const x of [9.5, 11.7]) span([x - 0.08, 0, 2.7], [x + 0.08, 0.7, 3.7], std("#3a3a3c", 0.6, 0.5)); label("diesel", 1.4, 0.36, "#c8342a", "#ffffff", [["DIESEL", 0.7]], [10.6, 1.35, 2.43], Math.PI, root); }
  for (let r = 0; r < 5; r++) for (let i = 0; i < 7 - r; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.29, 7.5, 12), [logM, endGrain, endGrain]); lg.rotation.x = Math.PI / 2; lg.castShadow = true; lg.receiveShadow = true; add(lg, [-23.5 + i * 0.56 + r * 0.28, 0.28 + r * 0.48, 4.0]); }
  span([-23.8, 2.55, 0.3], [-19.5, 2.7, 7.7], snowM);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 6, 12), [logM, endGrain, endGrain]); lg.rotation.z = Math.PI / 2; lg.castShadow = true; add(lg, [12.5, 0.26 + r * 0.44, 22.5 + i * 0.52 + r * 0.26]); }
  ph("wooden_ladder", [-7.3, 1.4, -1.9], 0.0, { h: 2.9 }); ph("sledgehammer_01", [-6.2, 0.3, 0.5], 0.8, { h: 0.85 });
  // the pines: a near ring of modelled pines (snow on the tiers) + a far ring of silhouettes
  const pineSpots: V3[] = [[-14, 0, -9], [-18, 0, -4], [12, 0, -8], [16, 0, -3], [-26, 0, 12], [24, 0, 10], [-12, 0, 32], [14, 0, 33], [9, 0, -14], [-9, 0, -15], [19, 0, 20], [-20, 0, 24], [27, 0, -2], [-28, 0, 0]];
  pineSpots.forEach(([x, , z], i) => { const h = 9 + 5 * hsh(i + 40); const pn = pine(h, i); pn.position.set(x, 0, z); pn.rotation.y = hsh(i) * 6; root.add(pn);
    for (let t = 0; t < 5; t++) { const u = t / 4, r = h * (0.24 * (1 - u) + 0.05) * 0.8, sc = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.05, 10), snowRoof); sc.position.set(x, h * (0.24 + 0.7 * u) + h * 0.015, z); sc.castShadow = true; root.add(sc); } });
  const far: V3[] = []; for (let i = 0; i < 90; i++) { const a = (i / 90) * TAU, R = 42 + 22 * hsh(i + 5); far.push([Math.cos(a) * R, 0, 10 + Math.sin(a) * R * 0.9]); }
  farPines(root, far, 11, 22);

  // ===================== THE VEHICLES =====================
  const doorLogo = (key: string) => new THREE.MeshStandardMaterial({ map: canvasTex("halv_" + key, 512, 256, (g) => { g.clearRect(0, 0, 512, 256); g.fillStyle = "#f2e6c8"; g.beginPath(); g.arc(256, 128, 118, 0, 6.3); g.fill(); g.strokeStyle = "#2a1e14"; g.lineWidth = 10; g.stroke(); g.fillStyle = "#2a5a3a"; g.beginPath(); g.moveTo(256, 30); g.lineTo(320, 150); g.lineTo(192, 150); g.closePath(); g.fill(); g.fillStyle = "#2a1e14"; fitText(g, "HALVORSEN", 256, 180, 210, 38, "900"); fitText(g, "TIMBER", 256, 214, 160, 34, "900"); }), transparent: true, roughness: 0.6 });
  const exh: { at: () => V3; run: () => number; puffs: THREE.Sprite[] }[] = [];
  const frostable: THREE.MeshStandardMaterial[] = [];
  const frostTexV = canvasTex("vehFrost", 256, 256, (g) => { g.clearRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(240,248,255,${0.3 + 0.5 * hsh(i)})`; g.beginPath(); g.arc(hsh(i + 0.3) * 256, hsh(i + 0.7) * 256, 1 + 3 * hsh(i + 1.1), 0, 6.3); g.fill(); } });
  const frostSkin = (par: THREE.Object3D, w: number, h: number, d: number, p: V3) => { const m = new THREE.MeshStandardMaterial({ map: frostTexV, transparent: true, opacity: 0, depthWrite: false, roughness: 0.9 }); frostable.push(m); const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(...p); me.renderOrder = 2; par.add(me); return me; };
  // the crew pickups (and the plow): parked noses -z
  const crew = CP.CREW.map((p, i) => {
    const pk = pickup(root, { paint: ["#6a4a32", "#3a5a7a", "#4a6a3a"][i], hood: true }); pk.g.position.set(...p); pk.g.rotation.y = Math.PI;
    for (const s of [-1, 1]) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), doorLogo("c")); lg.position.set(s * 0.98, 1.0, 0.5); lg.rotation.y = s * Math.PI / 2; pk.body.add(lg); }
    frostSkin(pk.body, 1.72, 0.03, 1.28, [0, 1.87, 0.12]); frostSkin(pk.body, 1.66, 0.48, 0.02, [0, 1.56, 0.86]).rotation.x = -0.42;
    const puffs: THREE.Sprite[] = []; for (let k = 0; k < 5; k++) puffs.push(mist(root, [p[0], 0.4, p[2] + 2.7], 0.6, "#e8ecf2", 0));
    exh.push({ at: () => [p[0] + 0.6, 0.35, p[2] + 2.75], run: () => 0, puffs });
    return pk;
  });
  const plow = pickup(root, { paint: "#e0a820" }); plow.g.position.set(...CP.PLOW); plow.g.rotation.y = Math.PI;
  { const bl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.6, 24, 1, true, -0.6, 1.2), std("#d8a020", 0.5, 0.3, { side: THREE.DoubleSide })); bl.rotation.z = Math.PI / 2; bl.position.set(0, 0.62, 3.6); bl.scale.set(0.42, 1, 0.42); plow.body.add(bl);
    const bc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 14), std("#ff9a20", 0.2, 0, { emissive: "#ff8a10", emissiveIntensity: 0.8 })); bc.position.set(0, 1.92, 0.1); plow.body.add(bc); }
  // the foreman's giant truck
  const giant = pickup(root, { paint: "#b02a22", hood: true }); giant.g.scale.setScalar(CP.GK); giant.g.position.set(...CP.GIANT); giant.g.rotation.y = Math.PI;
  for (const s of [-1, 1]) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), doorLogo("g")); lg.position.set(s * 0.98, 1.0, 0.5); lg.rotation.y = s * Math.PI / 2; giant.body.add(lg); }
  const gBat = carBattery({ truck: true, frost: true, key: "giant" }); gBat.g.scale.setScalar(1 / CP.GK * 1.0); gBat.g.position.set(...(giant.TRAY as V3)); gBat.g.rotation.y = Math.PI; giant.body.add(gBat.g);
  frostSkin(giant.body, 1.72, 0.03, 1.28, [0, 1.87, 0.12]); frostSkin(giant.body, 1.66, 0.48, 0.02, [0, 1.56, 0.86]).rotation.x = -0.42;
  const gPuffs: THREE.Sprite[] = []; for (let k = 0; k < 6; k++) gPuffs.push(mist(root, [0, 0.4, 0], 0.8, "#e8ecf2", 0));
  // the hero's small old car (hollow cabin, hood, engine bay); his brass key on a red string hangs in the ignition
  const car = cabinCar(root, { paint: "#3f8a86", seat: "#6a4a3a", hood: true }); car.g.position.set(...CP.CAR); car.g.rotation.y = Math.PI;
  const key = new THREE.Group(); key.position.set(0.24, 0.8, 0.09); car.body.add(key);
  { const brass = std("#d4a84a", 0.28, 0.9); const bow = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 14), brass); key.add(bow); const blade = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.032, 0.004), brass); blade.position.y = -0.026; key.add(blade);
    const str = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0025, 5, 20), std("#d42a1e", 0.7)); str.position.y = -0.045; str.rotation.x = 0.3; key.add(str); }
  const headM = new THREE.MeshBasicMaterial({ color: "#555048" }); const heads: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.08), headM); h.position.set(s * 0.6, 0.78, 2.095); car.body.add(h); heads.push(h); }
  const headG = [-1, 1].map((s) => glow(root, [CP.CAR[0] - s * 0.6, 0.78, CP.CAR[2] - 2.15], "#fff4d8", 1.4, 0));
  const carPuffs: THREE.Sprite[] = []; for (let k = 0; k < 6; k++) carPuffs.push(mist(root, [CP.CAR[0] - 0.5, 0.35, CP.CAR[2] + 2.1], 0.6, "#e8ecf2", 0));
  frostSkin(car.body, 1.6, 0.02, 1.2, [0, 1.575, -0.6]);
  // the hero's battery in the lot (carried, in the tray; the cutaway opens its front wall)
  const lotBat = carBattery({ cutaway: true, key: "lot" }); root.add(lotBat.g);
  const lbSteam: THREE.Sprite[] = []; for (let k = 0; k < 5; k++) lbSteam.push(mist(root, [0, 0, 0], 0.35, "#ffffff", 0));
  // the battery tester and its leads (held by the hero on the giant truck's battery)
  const dialSign = new LiveSign(0.1, 0.1, (g, v, W, H) => {
    const k = Math.min(1, Math.max(0, Number(v))), cx = W / 2, cy = H * 0.58, R = W * 0.42; g.fillStyle = "#f6f1e4"; g.fillRect(0, 0, W, H);
    const seg = (a0: number, a1: number, c: string) => { g.strokeStyle = c; g.lineWidth = W * 0.11; g.beginPath(); g.arc(cx, cy, R * 0.82, Math.PI + a0 * Math.PI, Math.PI + a1 * Math.PI); g.stroke(); };
    seg(0, 0.33, "#d42a1e"); seg(0.33, 0.62, "#f2c21a"); seg(0.62, 1, "#2f9a4a");
    g.fillStyle = "#1b1b1b"; fitText(g, "BAD", cx - R * 0.62, cy + R * 0.28, R * 0.6, W * 0.1, "900"); fitText(g, "WEAK", cx, cy - R * 0.38, R * 0.8, W * 0.1, "900"); fitText(g, "GOOD", cx + R * 0.62, cy + R * 0.28, R * 0.7, W * 0.1, "900");
    const a = Math.PI + k * Math.PI; g.strokeStyle = "#111"; g.lineWidth = W * 0.03; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); g.stroke();
    g.fillStyle = "#111"; g.beginPath(); g.arc(cx, cy, W * 0.045, 0, 6.3); g.fill();
  }, { px: 256 });
  const tst = tester((dialSign.mesh.material as THREE.MeshStandardMaterial[])[4].map as THREE.Texture); root.add(tst); tst.visible = false;
  // the tester's two leads (red, black) to the giant's battery posts: two straight segments each, re-aimed per frame
  const leads = ["#d42a1e", "#1a1a1c"].map((col) => { const g = new THREE.Group(); for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1, 6), std(col, 0.6)); m.castShadow = true; g.add(m); } root.add(g); g.visible = false; return g; });
  // the giant truck's dipstick pulled out (handheld copy: rod 0.64 m, yellow loop, a blob of cold oil hanging off the tip)
  const hdip = new THREE.Group(); root.add(hdip); hdip.visible = false;
  { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.64, 6), std("#9aa0a6", 0.35, 0.8)); rod.position.y = -0.32; hdip.add(rod);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 16), std("#f2c21a", 0.5)); loop.position.y = 0.035; hdip.add(loop);
    const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), std("#3a2008", 0.1, 0, { envMapIntensity: 1.5 })); oil.position.y = -0.54; hdip.add(oil); }
  const hgoo = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), std("#4a2a0a", 0.08, 0, { envMapIntensity: 1.6 })); hdip.add(hgoo);
  // jumper cables daisy-chained from the hero's car to every truck (the lunch aerial)
  const chain = new THREE.Group(); root.add(chain); chain.visible = false;
  { const hoods: V3[] = [[0.3, 0.95, 5.85], [4.1, 1.55, 5.5], [-4.75, 1.2, 6.05], [-8.35, 1.2, 6.05], [-11.95, 1.2, 6.05]];
    const order = [0, 1, 2, 3, 4]; for (let i = 0; i < order.length - 1; i++) { const a = hoods[order[i]], b = hoods[order[i + 1]]; const lo: V3 = [a[0], a[1], a[2] - 0.05], lo2: V3 = [b[0], b[1], b[2] - 0.05];
      chain.add(cable(lo, lo2, 0.7, "#d42a1e")); chain.add(cable([lo[0] + 0.12, lo[1], lo[2]], [lo2[0] + 0.12, lo2[1], lo2[2]], 0.75, "#1a1a1c")); } }
  // falling snow (night) and ice fog (dawn)
  const flakes = new THREE.BufferGeometry(); const NF = 1400, fp = new Float32Array(NF * 3); for (let i = 0; i < NF; i++) { fp[i * 3] = -22 + 44 * hsh(i); fp[i * 3 + 1] = 12 * hsh(i + 0.5); fp[i * 3 + 2] = -10 + 34 * hsh(i + 0.9); }
  flakes.setAttribute("position", new THREE.BufferAttribute(fp, 3));
  const flakeM = new THREE.PointsMaterial({ color: "#ffffff", size: 0.06, transparent: true, opacity: 0, depthWrite: false }); const snowP = new THREE.Points(flakes, flakeM); root.add(snowP);
  const fogS: THREE.Sprite[] = []; for (let i = 0; i < 22; i++) fogS.push(mist(root, [-16 + 32 * hsh(i + 70), 0.6 + 0.9 * hsh(i + 71), 0 + 18 * hsh(i + 72)], 6 + 4 * hsh(i + 73), "#f4e8ec", 0));

  // ===================== THE BUNKHOUSE INSIDE (x 96..104) =====================
  const BXI0 = 96, BXI1 = 104, BZI0 = -4.5, BZI1 = 3.0, BHI = 2.8;
  span([BXI0, -0.02, BZI0], [BXI1, 0, BZI1], floorIn);
  span([BXI0, 0, BZI0 - 0.14], [BXI1, BHI, BZI0], wallIn); span([BXI0 - 0.14, 0, BZI0], [BXI0, BHI, BZI1], wallIn); span([BXI1, 0, BZI0], [BXI1 + 0.14, BHI, BZI1], wallIn); span([BXI0, 0, BZI1], [BXI1, BHI, BZI1 + 0.14], wallIn);
  span([BXI0, BHI, BZI0], [BXI1, BHI + 0.05, BZI1], ceilM);
  for (let i = 0; i < 5; i++) span([BXI0 + 0.4 + i * 1.8, BHI - 0.22, BZI0], [BXI0 + 0.6 + i * 1.8, BHI, BZI1], beamM);
  // the back window (blue night) and its frost
  const winB = plane(1.0, 0.9, new THREE.MeshStandardMaterial({ color: "#1a2a4a", emissive: "#3a5a9a", emissiveIntensity: 0.9, roughness: 0.2 }), [98.1, 1.55, BZI0 + 0.02]);
  for (const [a, b] of [[[97.55, 1.07, BZI0], [98.65, 1.13, BZI0 + 0.1]], [[97.55, 1.97, BZI0], [98.65, 2.03, BZI0 + 0.1]], [[97.55, 1.07, BZI0], [97.61, 2.03, BZI0 + 0.1]], [[98.59, 1.07, BZI0], [98.65, 2.03, BZI0 + 0.1]], [[98.07, 1.07, BZI0], [98.13, 2.03, BZI0 + 0.1]]] as [V3, V3][]) span(a, b, trim);
  void winB;
  // the stove (barrel stove) on a tin plate, its pipe, a kettle, the wood box, the stove's fire light
  span([CP.STOVE[0] - 0.7, 0.0, -4.45], [CP.STOVE[0] + 0.7, 0.02, -3.2], std("#7a7e84", 0.4, 0.7));
  ph("barrel_stove", [CP.STOVE[0], 0.02, CP.STOVE[2]], 0, { h: 0.95 });
  cyl(0.08, 0.08, 1.9, std("#2a2a2c", 0.5, 0.6), [CP.STOVE[0], 1.9, CP.STOVE[2] - 0.2]);
  ph("metal_jug", [CP.STOVE[0] + 0.1, 0.98, CP.STOVE[2] + 0.05], 0.4, { h: 0.24 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.42, 8), [logM, endGrain, endGrain]); lg.rotation.z = Math.PI / 2; lg.castShadow = true; add(lg, [100.6, 0.07 + r * 0.12, -4.25 + i * 0.13 + (r % 2) * 0.06]); }
  const fireL = pl([CP.STOVE[0], 0.55, CP.STOVE[2] + 0.45], "#ff8a3a", 6, 7, "bunk"); const fireG = glow(root, [CP.STOVE[0], 0.36, CP.STOVE[2] + 0.48], "#ff9a40", 0.32, 1);
  // a lantern on an upturned crate by the foreman's bunk (lights the back corner for the payoff)
  ph("wooden_crate_01", [101.95, 0, -2.75], 0.3, { h: 0.42 }); ph("Lantern_01", [101.95, 0.43, -2.75], 0, { h: 0.3 });
  const lanB = pl([101.95, 0.75, -2.7], "#ffb868", 5.5, 6, "bunk"); glow(root, [101.95, 0.62, -2.75], "#ffc078", 0.22, 1); void lanB;
  // the hanging bulb over the card table + its light
  ph("caged_hanging_light", [CP.TABLE_B[0], 2.35, CP.TABLE_B[2] - 0.2], 0, { h: 0.36 }); const bulbL = pl([CP.TABLE_B[0], 2.1, CP.TABLE_B[2] - 0.2], "#ffc078", 5, 8, "bunk"); glow(root, [CP.TABLE_B[0], 2.15, CP.TABLE_B[2] - 0.2], "#ffd090", 0.5, 1);
  // a double bunk: posts, rails, two mattresses with wool blankets, a ladder; returns the lower deck group (it can collapse)
  const bunk = (c: V3, side: 1 | -1, blanketCol: string, owner: string) => {
    const g = new THREE.Group(); g.position.set(...c); root.add(g);
    const wood = std("#8a5a36", 0.8), w = 0.92, L = 2.0, low = new THREE.Group(); g.add(low);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.Mesh(boxM(0.08, 2.15, 0.08), wood); p.position.set(sx * w / 2, 1.075, sz * L / 2); p.castShadow = true; g.add(p); }
    for (const [y, grp] of [[CP.MAT_LO - 0.14, low], [CP.MAT_HI - 0.14, g]] as [number, THREE.Object3D][]) {
      for (const sx of [-1, 1]) { const r = new THREE.Mesh(boxM(0.05, 0.12, L), wood); r.position.set(sx * w / 2, y, 0); r.castShadow = true; grp.add(r); }
      for (const sz of [-1, 1]) { const r = new THREE.Mesh(boxM(w, 0.12, 0.05), wood); r.position.set(0, y, sz * L / 2); grp.add(r); }
      const m = new THREE.Mesh(new RoundedBoxGeometry(w - 0.06, 0.16, L - 0.08, 3, 0.05), std("#e8e0cc", 0.95)); m.position.set(0, y + 0.1, 0); m.castShadow = true; m.receiveShadow = true; grp.add(m);
    }
    // the upper bunk's blanket (a folded wool slab) and pillow; the lower ones are dynamic for bunk A
    { const b = new THREE.Mesh(new RoundedBoxGeometry(w - 0.04, 0.06, L * 0.62, 2, 0.02), std(blanketCol, 0.95)); b.position.set(0, CP.MAT_HI + 0.03, L * 0.15); b.castShadow = true; g.add(b);
      const pw = pillow(0.55, 0.32, 0.11); pw.position.set(0, CP.MAT_HI - 0.005, -L / 2 + 0.25); g.add(pw); }
    for (let i = 0; i < 5; i++) { const rg = new THREE.Mesh(boxM(0.04, 0.03, 0.36), wood); rg.position.set(side * (w / 2 + 0.01), 0.3 + i * 0.32, L / 2 - 0.25); rg.rotation.y = Math.PI / 2; g.add(rg); }
    CAMP_SEATS.push([c[0], CP.MAT_LO, c[2], w / 2, L / 2], [c[0], CP.MAT_HI, c[2], w / 2, L / 2]);
    void owner; return { g, low };
  };
  const bunkA = bunk(CP.BUNK_A, 1, "#3a5aa0", "hero"), bunkB = bunk(CP.BUNK_B, 1, "#7a4a2a", "crew"), bunkF = bunk(CP.BUNK_F, -1, "#2e6b3a", "foreman"), bunkE = bunk(CP.BUNK_E, -1, "#5a4a7a", "crew");
  void bunkA; void bunkB; void bunkE;
  { const b = new THREE.Mesh(new RoundedBoxGeometry(0.88, 0.07, 1.2, 2, 0.02), std("#5a4a7a", 0.95)); b.position.set(CP.BUNK_E[0], CP.MAT_LO + 0.04, CP.BUNK_E[2] + 0.35); b.castShadow = true; root.add(b); const pw = pillow(0.55, 0.32, 0.11); pw.position.set(CP.BUNK_E[0], CP.MAT_LO - 0.005, CP.BUNK_E[2] - 0.75); root.add(pw); }
  // bunk B's lower blanket + pillow (static), bunk F's lower pillow (static) + blanket (pulled up)
  { const b = new THREE.Mesh(new RoundedBoxGeometry(0.88, 0.07, 1.2, 2, 0.02), std("#7a4a2a", 0.95)); b.position.set(CP.BUNK_B[0], CP.MAT_LO + 0.04, CP.BUNK_B[2] + 0.35); b.castShadow = true; root.add(b);
    const pw = pillow(0.55, 0.32, 0.11); pw.position.set(CP.BUNK_B[0], CP.MAT_LO - 0.005, CP.BUNK_B[2] - 0.75); root.add(pw);
    const pf = pillow(0.55, 0.32, 0.11); pf.position.set(0, CP.MAT_LO - 0.005, -0.75); bunkF.low.add(pf); }
  const fBlk = blanket(0.9, 1.5, "#2e6b3a"); bunkF.low.add(fBlk.mesh);
  // the hero's lower bunk: a pillow, the blanket (draped), the knit cap, his sleeping bag on the floor
  const pA = pillow(0.55, 0.32, 0.11); pA.position.set(CP.BUNK_A[0], CP.MAT_LO - 0.005, CP.BUNK_A[2] - 0.75); root.add(pA);
  const aBlk = blanket(0.9, 1.5, "#b8302a"); const aBlkG = new THREE.Group(); aBlkG.position.set(CP.BUNK_A[0], 0, CP.BUNK_A[2]); aBlkG.add(aBlk.mesh); root.add(aBlkG);
  const bunkBat = carBattery({ key: "bunk" }); root.add(bunkBat.g);
  const cap = knitCap(0.075); root.add(cap); cap.visible = false;
  const fBat = carBattery({ truck: true, key: "fbunk" }); root.add(fBat.g); fBat.g.visible = false;
  const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.4, 6, 14), std("#3f6a3a", 0.85)); bag.rotation.x = Math.PI / 2; bag.scale.set(1, 1, 0.5); bag.castShadow = true; bag.receiveShadow = true; add(bag, [97.95, 0.15, -0.95]); bag.visible = false;
  // the chalk tally on bunk A's foot post (room side): I / II / III
  const tallySign = new LiveSign(0.09, 0.3, (g, v, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = "rgba(0,0,0,0)"; g.fillRect(0, 0, W, H); const n = Number(v); g.strokeStyle = "rgba(245,242,232,0.95)"; g.lineWidth = W * 0.14; g.lineCap = "round"; for (let i = 0; i < n; i++) { const x = W * (0.22 + 0.28 * i); g.beginPath(); g.moveTo(x, H * 0.1); g.lineTo(x + W * 0.03, H * 0.9); g.stroke(); } }, { px: 96, frame: "#8a5a36" });
  ((tallySign.mesh.material as THREE.MeshStandardMaterial[])[4]).transparent = true;
  tallySign.place(root, [CP.BUNK_A[0] + 0.465, 1.05, CP.BUNK_A[2] - 1.0], Math.PI / 2);
  // the card table, chairs, lantern, cards, mugs; the clothesline with long johns and socks
  ph("WoodenTable_01", [CP.TABLE_B[0], 0, CP.TABLE_B[2]], 0, { h: 0.76 }); ph("dining_chair_02", [CP.TABLE_B[0] - 0.75, 0, CP.TABLE_B[2]], Math.PI / 2, { h: 0.9 }); ph("dining_chair_02", [CP.TABLE_B[0] + 0.75, 0, CP.TABLE_B[2] + 0.1], -Math.PI / 2, { h: 0.9 });
  ph("Lantern_01", [CP.TABLE_B[0] + 0.25, 0.77, CP.TABLE_B[2] - 0.15], 0, { h: 0.3 }); ph("metal_jug", [CP.TABLE_B[0] - 0.2, 0.77, CP.TABLE_B[2] + 0.1], 0, { h: 0.16 });
  for (let i = 0; i < 6; i++) { const cd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.003, 0.09), std(i % 3 ? "#f4f1e8" : "#c8342a", 0.6)); cd.rotation.y = hsh(i) * 3; add(cd, [CP.TABLE_B[0] - 0.15 + 0.3 * hsh(i + 1), 0.775, CP.TABLE_B[2] - 0.1 + 0.25 * hsh(i + 2)], hsh(i) * 3); }
  { const line = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 5.2, 4), std("#d8d0c0", 0.8)); line.rotation.z = Math.PI / 2; add(line, [100, 2.3, 2.55]);
    const cloth = (x: number, w: number, h: number, col: string) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 4, 4), std(col, 0.95, 0, { side: THREE.DoubleSide })); m.position.set(x, 2.3 - h / 2, 2.55); m.castShadow = true; root.add(m); return m; };
    const lj = cloth(98.2, 0.5, 1.1, "#b8302a"); const lj2 = cloth(101.6, 0.5, 1.0, "#c84a3a"); const s1 = cloth(99.3, 0.12, 0.3, "#d8d0c0"), s2 = cloth(99.55, 0.12, 0.3, "#8a8a92"), sh = cloth(102.6, 0.55, 0.7, "#3a5aa0");
    anim.push((t) => { [lj, lj2, s1, s2, sh].forEach((m, i) => { m.rotation.y = 0.08 * Math.sin(t * 0.9 + i); m.rotation.x = 0.04 * Math.sin(t * 1.3 + i * 2); }); }); }
  // wall dressing: pegs with jackets and hats, crossed axes, a calendar, a map, a shelf of tins, boots, a washstand
  for (const [x, col] of [[97.3, "#a8322a"], [97.9, "#6e7078"], [102.1, "#d8a43a"], [102.7, "#3a5a7a"]] as [number, string][]) { span([x - 0.02, 1.85, BZI1 - 0.06], [x + 0.02, 1.9, BZI1], darkTrim); const jk = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.7, 0.12, 2, 0.05), std(col, 0.95)); jk.position.set(x, 1.5, BZI1 - 0.1); jk.castShadow = true; root.add(jk); }
  { const ax = (x: number, rot: number) => { const g = new THREE.Group(); const hd = new THREE.Mesh(boxM(0.06, 0.13, 0.22), std("#8a9096", 0.35, 0.8)); hd.position.set(0, 0.36, 0.08); g.add(hd); const hn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.8, 8), std("#c89a5a", 0.6)); g.add(hn); g.rotation.set(0, Math.PI / 2, rot); add(g, [BXI1 - 0.08, 1.9, x]); }; ax(1.4, 0.6); ax(1.9, -0.6); }
  label("calendar", 0.36, 0.5, "#f4f1e8", "#8a2a22", [["DECEMBER", 0.12], ["HALVORSEN", 0.08], ["TIMBER", 0.08]], [100.9, 1.7, BZI0 + 0.02], 0, root);
  label("map", 0.8, 0.6, "#d8c8a0", "#2a3a2a", [["BLOCK 14", 0.14], ["NORTH RIDGE", 0.1]], [102.5, 1.75, BZI0 + 0.02], 0, root);
  { const sh = new THREE.Mesh(boxM(1.2, 0.04, 0.26), std("#7a5636", 0.8)); add(sh, [96.15, 1.95, 1.9], Math.PI / 2); for (let i = 0; i < 6; i++) ph((["russian_food_cans_01", "oil_tin", "jug_01", "wooden_bowl_01", "alarm_clock_01", "modified_thermos"] as PhModel[])[i], [96.2, 1.97, 1.4 + i * 0.2], hsh(i) * 2, { h: 0.12 + 0.08 * hsh(i + 2) }); }
  for (const [x, z] of [[97.1, 0.35], [102.9, 0.6], [102.9, -2.1]]) ph("rubber_boots", [x, 0, z], hsh(x) * 2, { h: 0.34 });
  ph("pot_enamel_01", [96.3, 0.82, 2.6], 0, { h: 0.18 }); span([96.05, 0, 2.35], [96.6, 0.8, 2.85], std("#6a4a30", 0.85));
  ph("wooden_bucket_01", [101.2, 0, 2.6], 0, { h: 0.32 }); ph("wooden_broom", [103.6, 0.7, 2.7], 0.3, { h: 1.4 });

  // ===================== THE MESS HALL INSIDE (x 193..207) =====================
  const MI0 = 193, MI1 = 207, MZI0 = -4.0, MZI1 = 4.0, MHI = 3.1;
  span([MI0, -0.02, MZI0], [MI1, 0, MZI1], phMat("old_planks_02", 1 / 1.6, 1 / 1.6, { tint: "#a8845e", rough: 0.85, key: "cpMessF" }));
  for (const [a, b] of [[[MI0, 0, MZI0 - 0.14], [MI1, MHI, MZI0]], [[MI0, 0, MZI1], [MI1, MHI, MZI1 + 0.14]], [[MI0 - 0.14, 0, MZI0], [MI0, MHI, MZI1]], [[MI1, 0, MZI0], [MI1 + 0.14, MHI, MZI1]]] as [V3, V3][]) span(a, b, messWall);
  span([MI0, 0, MZI0], [MI1, 1.0, MZI0 + 0.02], messLow); span([MI0, 0, MZI1 - 0.02], [MI1, 1.0, MZI1], messLow); span([MI0, 0, MZI0], [MI0 + 0.02, 1.0, MZI1], messLow); span([MI1 - 0.02, 0, MZI0], [MI1, 1.0, MZI1], messLow);
  span([MI0, 1.0, MZI0], [MI1, 1.05, MZI0 + 0.05], trim); span([MI0, 1.0, MZI1 - 0.05], [MI1, 1.05, MZI1], trim);
  span([MI0, MHI, MZI0], [MI1, MHI + 0.05, MZI1], ceilM); for (let i = 0; i < 7; i++) span([MI0 + 0.5 + i * 2.1, MHI - 0.22, MZI0], [MI0 + 0.7 + i * 2.1, MHI, MZI1], beamM);
  // side windows (snow light)
  for (const z of [-1.6, 1.6]) for (const x of [MI0 + 0.02, MI1 - 0.02]) { const w = plane(1.2, 1.0, new THREE.MeshStandardMaterial({ color: "#c8d8ec", emissive: "#d8e8ff", emissiveIntensity: 1.1, roughness: 0.2 }), [x, 1.75, z], x < 200 ? Math.PI / 2 : -Math.PI / 2); void w;
    span([x - 0.05, 1.22, z - 0.65], [x + 0.05, 1.28, z + 0.65], trim); span([x - 0.05, 2.22, z - 0.65], [x + 0.05, 2.28, z + 0.65], trim); }
  const winLs = [pl([MI0 + 0.6, 1.8, -1.6], "#d8e4ff", 2.5, 6, "mess"), pl([MI1 - 0.6, 1.8, 1.6], "#d8e4ff", 2.5, 6, "mess")];
  // two long tables with benches (seats listed for G9)
  for (const tz of [CP.T1Z, CP.T2Z]) {
    span([195.4, CP.TT - 0.05, tz - 0.42], [204.6, CP.TT, tz + 0.42], tableM);
    for (const x of [195.8, 200, 204.2]) for (const s of [-1, 1]) span([x - 0.05, 0, tz + s * 0.3 - 0.05], [x + 0.05, CP.TT - 0.05, tz + s * 0.3 + 0.05], std("#6a4a30", 0.85));
    for (const s of [-1, 1]) { const bz = tz + s * 0.78; span([195.4, CP.BENCH - 0.05, bz - 0.15], [204.6, CP.BENCH, bz + 0.15], tableM); for (const x of [195.8, 200, 204.2]) span([x - 0.05, 0, bz - 0.12], [x + 0.05, CP.BENCH - 0.05, bz + 0.12], std("#6a4a30", 0.85));
      CAMP_SEATS.push([200, CP.BENCH, bz, 4.6, 0.15]); }
    for (let i = 0; i < 6; i++) { const pk = pancakes(3 + (i % 2)); pk.position.set(196.3 + i * 1.6, CP.TT, tz + (i % 2 ? 0.2 : -0.2)); root.add(pk); ph("metal_jug", [196.8 + i * 1.6, CP.TT, tz + (i % 2 ? -0.18 : 0.2)], i, { h: 0.12 }); }
  }
  // the cook's counter, pots, the coffee urn, the old fridge, the range
  span([196.0, 0, CP.COUNTER[2] - 0.35], [205.2, CP.CT, CP.COUNTER[2] + 0.35], phMat("weathered_planks", 1 / 1.4, 1 / 1.4, { tint: "#8a5a3a", rough: 0.85, key: "cpCounter" }));
  span([195.95, CP.CT, CP.COUNTER[2] - 0.38], [205.25, CP.CT + 0.04, CP.COUNTER[2] + 0.38], std("#c8ccd2", 0.35, 0.6));
  cyl(0.18, 0.18, 0.5, std("#c8ccd2", 0.25, 0.9), [197.0, CP.CT + 0.29, CP.COUNTER[2]], 24); label("coffee", 0.28, 0.1, "#2a1a10", "#f2e6c8", [["COFFEE", 0.7]], [197.0, CP.CT + 0.33, CP.COUNTER[2] + 0.185], 0, root);
  ph("pot_enamel_01", [198.4, CP.CT + 0.02, CP.COUNTER[2] - 0.1], 0.3, { h: 0.22 }); ph("metal_jug", [202.6, CP.CT + 0.02, CP.COUNTER[2] - 0.05], 0, { h: 0.2 });
  for (let i = 0; i < 4; i++) { const pk = pancakes(5); pk.position.set(199.2 + i * 0.55, CP.CT + 0.04, CP.COUNTER[2] + 0.12); root.add(pk); }
  { const pk = pancakes(4); pk.position.set(...CP.HONEY_STACK); root.add(pk); }   // the stack the cook drizzles (S21)
  ph("barrel_stove", [205.0, 0, MZI0 + 0.6], 0, { h: 0.9 }); cyl(0.07, 0.07, 2.1, std("#2a2a2c", 0.5, 0.6), [205.0, 2.0, MZI0 + 0.45]);
  { const fr = new THREE.Group(); fr.position.set(...CP.FRIDGE); root.add(fr); const wm = std("#f2efe6", 0.35, 0.05, { envMapIntensity: 1.1 });
    const bd = new THREE.Mesh(new RoundedBoxGeometry(0.8, 1.7, 0.7, 4, 0.14), wm); bd.position.y = 0.85; bd.castShadow = true; bd.receiveShadow = true; fr.add(bd);
    const ln = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.01, 0.02), std("#b8b4a8", 0.5)); ln.position.set(0, 1.2, 0.355); fr.add(ln);
    const hd = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.32, 0.06, 2, 0.02), std("#d8dde4", 0.18, 1.0)); hd.position.set(-0.3, 1.0, 0.38); fr.add(hd);
    label("fridgeBadge", 0.22, 0.06, "#c8342a", "#ffffff", [["POLAR", 0.8]], [0, 1.55, 0.356], 0, fr); }
  // the chalk menu board (back wall, left): MENU / PANCAKES / BEANS / COFFEE + BATTERY BABYSITTER with an arrow
  { const tex = chalkTex("menu", 640, 720, [["MENU", 0.1, 0.12], ["PANCAKES", 0.24, 0.09], ["BEANS & BACON", 0.34, 0.075], ["COFFEE", 0.44, 0.08], ["BATTERY", 0.66, 0.1, "#ffe28a"], ["BABYSITTER", 0.78, 0.1, "#ffe28a"], ["->", 0.9, 0.08, "#ffe28a"]]);
    const me = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.35, 0.04), [darkTrim, darkTrim, darkTrim, darkTrim, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), darkTrim]); add(me, CP.BOARD); }
  // antlers, a wall clock, a crosscut saw, posters, pendant lamps
  { const ant = new THREE.Group(); const bm = std("#e8dcc0", 0.7); for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const tn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.28 - i * 0.04, 6), bm); tn.position.set(s * (0.08 + i * 0.08), 0.1 + i * 0.05, 0.03); tn.rotation.z = s * (0.4 + i * 0.2); ant.add(tn); } add(ant, [202.2, 2.4, MZI0 + 0.05]); }
  ph("wall_clock", [203.6, 2.35, MZI0 + 0.06], 0, { h: 0.36 });
  { const saw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.01), std("#a8acb2", 0.3, 0.9)); add(saw, [199.0, 2.5, MZI0 + 0.04]); }
  label("safety", 0.6, 0.8, "#f2e6c8", "#8a2a22", [["SAFETY", 0.12], ["FIRST", 0.12], ["DAYS: 41", 0.09]], [194.2, 1.9, MZI0 + 0.02], 0, root, { border: "#8a2a22" });
  const pend: THREE.PointLight[] = [];
  for (const x of [196.5, 200, 203.5]) for (const z of [CP.T1Z, CP.T2Z]) { ph("hanging_industrial_lamp", [x, 2.55, z], 0, { h: 0.5 }); pend.push(pl([x, 2.2, z], "#ffcf8a", 2.8, 6, "mess")); glow(root, [x, 2.28, z], "#ffd8a0", 0.45, 1); }
  // the cook's honey bottle (held / squeezed) + the slow blob
  const honey = honeyBottle(); root.add(honey); honey.visible = false;
  const blob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), new THREE.MeshStandardMaterial({ color: "#d88a1a", roughness: 0.12, transparent: true, opacity: 0.95, envMapIntensity: 1.6 })); root.add(blob); blob.visible = false;

  // ===================== POSE (per frame) =====================
  const sideP: V3 = [0, 0, 0];
  anim.push((t, c, light) => {
    const night = light === "campNight", dawn = light === "campDawn", day = light === "campDay";
    // lamps by light
    yardL.intensity = night ? 160 : dawn ? 20 : 0; yardG.visible = night || dawn; (yardG.material as THREE.SpriteMaterial).opacity = night ? 1 : 0.5;
    lanternL.intensity = night ? 3.5 : dawn ? 1.5 : 0; lanG.visible = night || dawn; vestL.intensity = night ? 4.5 : 3; messL.intensity = night ? 3 : 1;
    panes.forEach((p) => { const m = p.material as THREE.MeshStandardMaterial; m.emissiveIntensity = day ? 0.15 : dawn ? 0.7 : 1.2 * (0.95 + 0.05 * Math.sin(t * 9)); });
    // door, thermometer, frost
    door.rotation.y = -sm(cl(c.bDoor ?? 0)) * 1.5;
    thermo.set(`${Math.round(c.therm ?? (dawn ? -40 : night ? -22 : 5))}|${(c.frost ?? (dawn ? 1 : 0)).toFixed(1)}`);
    const fr = c.frost ?? (dawn ? 1 : 0); frostable.forEach((m) => (m.opacity = 0.85 * fr)); gBat.set({ frost: 0.15 + 0.35 * fr });
    // snow + fog + smoke
    flakeM.opacity = (c.snow ?? (night ? 1 : 0)) * 0.85;
    { const P = flakes.attributes.position as THREE.BufferAttribute; for (let i = 0; i < NF; i++) { const y = (12 * hsh(i + 0.5) - t * (0.6 + 0.5 * hsh(i + 2.2))) % 12; P.setY(i, y < 0 ? y + 12 : y); P.setX(i, -22 + 44 * hsh(i) + 0.3 * Math.sin(t * 0.7 + i)); } P.needsUpdate = true; }
    fogS.forEach((s, i) => { (s.material as THREE.SpriteMaterial).opacity = (c.fog ?? (dawn ? 1 : 0)) * 0.32; s.position.x = -16 + 32 * hsh(i + 70) + 0.4 * Math.sin(t * 0.2 + i); });
    smoke.forEach((s, i) => { const k = ((t * 0.18 + i / smoke.length) % 1), base = i < 7 ? [-3.2, BH + FB + 2.5, -5.2] : [4.2, MH + MF + 3.5, MZ + 5.5]; s.position.set(base[0] + k * 1.6 + 0.3 * Math.sin(t + i), base[1] + k * 3.2, base[2] - k * 0.6); s.scale.set(0.8 + 2.2 * k, (0.8 + 2.2 * k) * 0.7, 1); (s.material as THREE.SpriteMaterial).opacity = (night ? 0.28 : 0.42) * (1 - k); });
    // the crew trucks: running (exhaust puffs, a bob), hoods
    crew.forEach((pk, i) => { const run = c[`crewRun${i}`] ?? 0; pk.set({ t: t + i, bob: run, hood: c.crewHood ?? 0, clamps: 1 }); exh[i].puffs.forEach((s, k) => { const a = ((t * 1.1 + k / 5) % 1); const p = exh[i].at(); s.position.set(p[0] + a * 0.3, p[1] + a * 0.6, p[2] + a * 0.9); s.scale.set(0.3 + a, (0.3 + a) * 0.7, 1); (s.material as THREE.SpriteMaterial).opacity = run * 0.5 * (1 - a); }); });
    plow.set({ t, bob: 0 });
    // the giant truck (it drives out on the first cold morning)
    giant.g.position.set(c.gtX ?? CP.GIANT[0], 0, c.gtZ ?? CP.GIANT[2]); giant.g.rotation.y = c.gtYaw ?? Math.PI;
    giant.set({ dist: c.gtDist ?? 0, t, bob: c.gtRun ?? 0, hood: c.gtHood ?? 0, dip: c.gtDip ?? 0, steer: c.gtSteer ?? 0, doorL: 0 });
    { const run = c.gtRun ?? 0, yaw = giant.g.rotation.y, bx = giant.g.position.x + Math.sin(yaw) * -3.4 * CP.GK + Math.cos(yaw) * 0.6, bz = giant.g.position.z + Math.cos(yaw) * -3.4 * CP.GK - Math.sin(yaw) * 0.6;
      gPuffs.forEach((s, k) => { const a = ((t * 1.2 + k / 6) % 1); s.position.set(bx - Math.sin(yaw) * a * 1.2, 0.45 + a * 0.7, bz - Math.cos(yaw) * a * 1.2); s.scale.set(0.4 + 1.2 * a, (0.4 + 1.2 * a) * 0.7, 1); (s.material as THREE.SpriteMaterial).opacity = (run + (c.gtCough ?? 0) * 2) * 0.45 * (1 - a); }); }
    // the hero's car: hood, headlights, exhaust, cutaway, the key
    car.set({ t, bob: c.carRun ?? 0, hood: c.carHood ?? 0, cut: c.carCut ?? 0, clamps: c.clamps ?? 1 });
    { const on = cl(c.carRun ?? 0); headM.color.setRGB(0.33 + 2.2 * on, 0.31 + 2.1 * on, 0.28 + 1.8 * on); headG.forEach((g) => { g.visible = on > 0.05; (g.material as THREE.SpriteMaterial).opacity = on; });
      carPuffs.forEach((s, k) => { const a = ((t * 1.1 + k / 6) % 1); s.position.set(CP.CAR[0] - 0.5 + a * 0.2, 0.32 + a * 0.6, CP.CAR[2] + 2.15 + a * 1.1); s.scale.set(0.3 + a * 1.2, (0.3 + a * 1.2) * 0.7, 1); (s.material as THREE.SpriteMaterial).opacity = on * 0.55 * (1 - a); });
      key.rotation.z = (c.keyTurn ?? 0) * 0.9; key.rotation.x = 0.15 * Math.sin(t * 4) * (0.2 + on); }
    // the hero's battery in the lot
    lotBat.g.visible = (c.lotBat ?? 0) > 0.5; lotBat.g.position.set(c.lbX ?? CP.TRAY_W[0], c.lbY ?? CP.TRAY_W[1], c.lbZ ?? CP.TRAY_W[2]); lotBat.g.rotation.y = c.lbYaw ?? Math.PI;
    lotBat.set({ cut: c.lbCut ?? 0, glow: c.lbGlow ?? 0, t, frost: 0 });
    lbSteam.forEach((s, k) => { const a = ((t * 0.7 + k / 5) % 1); s.position.set(lotBat.g.position.x + 0.08 * Math.sin(k * 2 + t), lotBat.g.position.y + 0.22 + a * 0.5, lotBat.g.position.z + 0.05 * Math.cos(k)); s.scale.set(0.15 + 0.35 * a, (0.15 + 0.35 * a) * 0.8, 1); (s.material as THREE.SpriteMaterial).opacity = lotBat.g.visible ? (c.lbSteam ?? 0) * 0.55 * (1 - a) : 0; });
    // the tester
    tst.visible = (c.tester ?? 0) > 0.5; tst.position.set(c.tsX ?? 0, c.tsY ?? 0, c.tsZ ?? 0); tst.rotation.y = c.tsYaw ?? 0; dialSign.set(((c.needle ?? 0) * 100 | 0) / 100);
    chain.visible = (c.cables ?? 0) > 0.5;
      tallySign.set(Math.round(c.tally ?? 3));
    { const on = tst.visible && (c.leads ?? 1) > 0.5; leads.forEach((ld, i) => { ld.visible = on; if (!on) return;
        const A = new THREE.Vector3(tst.position.x + (i ? 0.04 : -0.04), tst.position.y + 0.02, tst.position.z), B = new THREE.Vector3(...(i ? CP.GPOST_B : CP.GPOST_R));
        const M = A.clone().lerp(B, 0.5); M.y -= 0.12; const seg = (m: THREE.Mesh, P: THREE.Vector3, Q: THREE.Vector3) => { const d = Q.clone().sub(P); m.position.copy(P).addScaledVector(d, 0.5); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
        seg(ld.children[0] as THREE.Mesh, A, M); seg(ld.children[1] as THREE.Mesh, M, B); }); }
    hdip.visible = (c.hdip ?? 0) > 0.5; hdip.position.set(c.dsX ?? 0, c.dsY ?? 0, c.dsZ ?? 0); hdip.rotation.set(0, 0, c.dsRoll ?? 0);
    { const k = c.goo ?? 0; hgoo.scale.set(1 + 0.3 * k, 2.6 + 5 * k + 0.4 * Math.sin(t * 2.1) * k, 1 + 0.3 * k); hgoo.position.y = -0.64 - 0.012 * (2.6 + 5 * k); }
  // the bunkhouse: the battery, the blanket, the cap, the bag, the foreman's battery and bunk
    bunkBat.g.visible = (c.bunkBat ?? 0) > 0.5; bunkBat.g.position.set(c.bbX ?? 97.0, c.bbY ?? CP.MAT_LO + 0.06, c.bbZ ?? -1.35); bunkBat.g.rotation.y = c.bbYaw ?? Math.PI / 2;
    cap.visible = (c.cap ?? 0) > 0.5; cap.position.set(bunkBat.g.position.x, bunkBat.g.position.y + bunkBat.top - 0.012, bunkBat.g.position.z); cap.rotation.set(0.15, 0.4, 0.12);
    bag.visible = (c.bag ?? 0) > 0.5;
    pA.position.y = CP.MAT_LO - 0.005;
    { // the hero's blanket: local z along the bunk (head -1), drapes over the mattress, the pillow and the battery
      const bx = bunkBat.g.visible ? bunkBat.g.position.x - CP.BUNK_A[0] : 99, bz = bunkBat.g.visible ? bunkBat.g.position.z - CP.BUNK_A[2] : 99, bt = bunkBat.g.position.y + bunkBat.top;
      const hf = (x: number, z: number) => { let y = CP.MAT_LO + 0.02; if (Math.abs(z - -0.75 - 0) < 0.2 && Math.abs(x) < 0.3) y = Math.max(y, CP.MAT_LO + 0.1 * Math.cos(((z + 0.75) / 0.2) * 1.57)); const dx = Math.abs(x - bx) - 0.08, dz = Math.abs(z - bz) - 0.12; const d = Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(0, Math.max(dx, dz)); if (d < 0.34) { const k = d < 0 ? 0 : d / 0.34; y = Math.max(y, CP.MAT_LO + 0.02 + (bt + 0.015 - CP.MAT_LO) * (1 - k) ** 2 * (1 + 2 * k) * (d < 0 ? 1 : 0.97)); } return y; };
      aBlk.mesh.visible = (c.blk ?? 0) > 0.5; if (aBlk.mesh.visible) aBlk.set(c.blkA ?? 0.9, c.blkB ?? -0.6, hf, c.blkLift ?? 0); }
    fBat.g.visible = (c.fbat ?? 0) > 0.5; fBat.g.position.set(c.fbX ?? 103.0, c.fbY ?? 0.8, c.fbZ ?? -1.6); fBat.g.rotation.set(c.fbRoll ?? 0, c.fbYaw ?? Math.PI / 2, 0);
    { const k = sm(cl(c.collapse ?? 0)); bunkF.low.position.y = -0.36 * k; bunkF.low.rotation.z = 0.06 * k * Math.sin(Math.min(1, (c.collapse ?? 0)) * 9) * (1 - 0.5 * k);
      const fx = fBat.g.visible ? fBat.g.position.x - CP.BUNK_F[0] : 99, fz = fBat.g.visible ? fBat.g.position.z - CP.BUNK_F[2] : 99, ft = fBat.g.position.y + 0.3 - bunkF.low.position.y;
      const hfF = (x: number, z: number) => { let y = CP.MAT_LO + 0.02; const d = Math.max(Math.abs(x - fx) - 0.14, Math.abs(z - fz) - 0.19); if (d < 0.18) y = Math.max(y, d < 0 ? ft : ft - (ft - CP.MAT_LO) * Math.min(1, d / 0.18)); return y; };
      fBlk.mesh.visible = (c.fblk ?? 0) > 0.01; if (fBlk.mesh.visible) fBlk.set(0.9, 0.9 - 1.6 * cl(c.fblk ?? 0), hfF, 0); }
    void sideP;
    fireL.intensity = 6 * (c.stoveF ?? 1) * (0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 7.3 + 1)); (fireG.material as THREE.SpriteMaterial).opacity = 0.45 + 0.12 * Math.sin(t * 13);
    bulbL.intensity = 5 * (0.97 + 0.03 * Math.sin(t * 17));
    // the mess hall: the honey bottle + blob
    honey.visible = (c.honey ?? 0) > 0.5; honey.position.set(c.hbX ?? 201, c.hbY ?? 1.3, c.hbZ ?? -2.6); honey.rotation.set(0, 0, c.hbRoll ?? Math.PI);
    blob.visible = honey.visible && (c.blob ?? 0) > 0.02; { const k = c.blob ?? 0; blob.position.set(honey.position.x, honey.position.y - 0.19 - 0.06 * k, honey.position.z); blob.scale.set(0.8 + 0.4 * k, 1 + 2.4 * k, 0.8 + 0.4 * k); }
    winLs.forEach((L) => (L.intensity = 2.5)); pend.forEach((L, i) => (L.intensity = 2.8 * (0.98 + 0.02 * Math.sin(t * 13 + i))));
    void lamps;
  });

  // ---------------- marks, cams, pose ----------------
  const marks: Record<string, V3> = { door: CP.DOOR, hood: CP.HERO_HOOD, bunkA: CP.BUNK_A, bunkF: CP.BUNK_F, stove: CP.STOVE };
  const cams: SetDef["cams"] = {
    lotWide: { pos: [-2, 2.2, -0.2], look: [1.5, 1.0, 9.5], fov: 55 },
    porch: { pos: [1.2, 1.55, 3.6], look: [0.2, 1.4, -0.5], fov: 50 },
    row: { pos: [-6, 1.5, 4.6], look: [-6, 1.4, 9.5], fov: 58 },
    aerial: { pos: [8, 16, 30], look: [-1, 0, 4], fov: 50 },
    bunkA: { pos: [99.2, 1.15, -0.3], look: [97.0, 0.75, -1.1], fov: 52 },
    bunkRoom: { pos: [98.4, 1.4, 2.4], look: [101.5, 0.9, -2.6], fov: 60 },
    messWide: { pos: [200, 1.7, 3.6], look: [200, 1.1, -2.5], fov: 62 },
    messCook: { pos: [201.5, 1.45, -1.3], look: [201.0, 1.2, -3.3], fov: 50 },
  };
  const pose = (t: number, c: Ctl, light = "campNight") => { for (const a of anim) a(t, c, light); };
  const sunW = { campNight: [0.35, 0.75, -0.55] as V3, campDay: [-0.42, 0.62, -0.66] as V3, campDawn: [-0.72, 0.16, 0.68] as V3, bunkNight: [0.3, 0.8, -0.5] as V3, messMorn: [-0.4, 0.6, 0.7] as V3 };
  const env = { campNight: { hdri: "rogland_moonlit_night", i: 0.45 }, campDay: { hdri: "snowy_field", i: 0.6 }, campDawn: { hdri: "winter_evening", i: 0.55 }, bunkNight: { hdri: "warm_restaurant", i: 0.3 }, messMorn: { hdri: "warm_restaurant", i: 0.45 } };
  return { name: "camp", root, marks, cams, pose, sunW, env } as SetDef;
};
