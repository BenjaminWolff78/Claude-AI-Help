// "They Banned Beer, So He Sold It as Bread Syrup" (2026-11-27, master prompt v34). ONE set file, four zones far apart
// in local metres (y up), built from Poly Haven assets plus modelled story objects (beerkit.ts):
//  THE BREWERY (x -6..6, z 0..12, ceiling 5.5): the copper kettle on its plinth (centre BR.KETTLE) spouts into cans on the
//    canning line (table x -1.6..2.8, z 8.6..9.2, top 0.92; cans at z 9.0 move +x); the brewer works behind it at z 9.32
//    facing -z. The big wall sign (BEER crossed out, BAKING SYRUP) on the back wall z 12. The beer barrel the agents tip
//    over the floor drain at BR.BARREL. Arched windows on the west wall (x -6), the street door in the south wall (z 0).
//  THE GROCERY (x 96..104, z 0..7, ceiling 3.4): front window/door in the south wall (z 0), the counter x 97.2..101.4 at
//    z 3.1..3.7 (top 0.95, the grocer behind it at z 4.15 facing -z), the SYRUP WALL on the back wall z 7 (x 99.6..103.6),
//    the flour sacks against the east wall next to it, the empty bread rack on the west wall, the count board.
//  MAIN STREET (x 170..250): road z -4..4, sidewalks (y 0.15) z 4..7 and -7..-4. North: the agents' office (x 184..192),
//    houses H1..H5 (x 194..224, 6 m each, fronts at z 8.5, porches z 7..8.5 deck 0.6), the church (x 236..244). South:
//    shopfronts at z -8.5. Granny = H1 (door x 197); the agent = H5 (bulkhead cellar doors at x 219..220.4).
//    Cellars under H1 (granny) and H5 (the agent): rooms y -2.5..0, z 8.6..12.6.
// Controls (pose c.*): line (canning line speed 0..1), pour (syrup stream 0..1), tip (beer barrel 0..1), gush (beer foam
//  0..1), pyr (the 3-can pyramid on the table end, 0/1), wall (syrup wall fill 0..1), board (count board value), yeast
//  (yeast tower on the hand truck 0/1), pancake (the counter demo 0..1), night (0/1), chalk (BAKER on the truck 0..1),
//  loaf (giant loaf 0..1), pop1..pop5 (s since that house's cellar popped, -1 off), cut1 (granny's cellar cutaway 0/1),
//  crockFoam (0..1), crockFill (0..1), crockOpen (0/1), capAge (s since the granny's shelf started blowing caps, -1 off),
//  wifeAge (s since the agent's cellar shelf blew, -1 off), bulk (the agent's cellar doors 0..1).
import * as THREE from "three";
import { phModel, phMat, boxM, planeM, type PhModel } from "../ph";
import { TAU, cl, sm, hsh, std, canvasTex } from "./harborkit";
import { glow, shaft, sack } from "../setkit";
import type { SetDef, V3, Ctl } from "./types";
import { pipeRun, poster } from "./dress";
import { counter } from "./screens";
import { syrupCan, CanField, BottleRack, crock, kettle, truck, chalkWordTex, loaf, FoamBurst, brassM } from "./beerkit";

const SERIF = "Georgia, 'Times New Roman', serif";
export const BR = {
  KETTLE: [-3.6, 0, 8.7] as V3, LINE_Z: 9.0, TABLE_TOP: 0.92, BREWER: [0.15, 0, 9.36] as V3, BARREL: [2.7, 0, 4.4] as V3, DRAIN: [2.7, 0.006, 3.35] as V3,
  DOOR: [0, 0, 0.6] as V3, AGENT_STOP: [0.9, 0, 8.25] as V3, AG1: [3.45, 0, 4.7] as V3, AG2: [1.95, 0, 4.75] as V3, AGENT_W: [3.4, 0, 3.6] as V3,
  GX: 100, COUNTER_Z: 3.4, COUNTER_TOP: 0.95, GROCER: [99.4, 0, 4.15] as V3, CUSTOMER: [99.2, 0, 2.55] as V3, WALL_X0: 99.6, WALL_X1: 103.6,
  FLOUR: [103.55, 0, 5.6] as V3, BREAD: [96.25, 0, 5.2] as V3, BOARD: [98.1, 2.05, 6.96] as V3, YEAST: [102.4, 0, 2.3] as V3, GDOOR: [102.1, 0, 0.4] as V3,
  MX: 200, H1: 197, H5: 221, PORCH_Y: 0.6, HOUSE_Z: 8.5, GRANNY_DOOR: [197, 0.6, 8.35] as V3, AGENT_KNOCK: [197.25, 0.6, 7.55] as V3,
  OFFICE: [188, 0, 10] as V3, BULK: [219.7, 0.15, 7.9] as V3, CELLAR_Y: -2.5,
};

export const beer = (): SetDef => {
  const root = new THREE.Group(); root.name = "beer";
  const add = <T extends THREE.Object3D>(o: T, p: V3, yaw = 0, par: THREE.Object3D = root): T => { o.position.set(...p); o.rotation.y = yaw; par.add(o); return o; };
  const ph = (n: PhModel, p: V3, yaw = 0, o: { h?: number; s?: number; filt?: string } = {}, par: THREE.Object3D = root) => add(phModel(n, { center: true, ...o }), p, yaw, par);
  const box = (w: number, h: number, d: number, m: THREE.Material, p: V3, yaw = 0, par: THREE.Object3D = root, cast = true) => { const me = new THREE.Mesh(boxM(w, h, d), m); me.castShadow = cast; me.receiveShadow = true; return add(me, p, yaw, par); };
  const plane = (w: number, h: number, m: THREE.Material, p: V3, ry = 0, rx = 0, par: THREE.Object3D = root) => { const me = new THREE.Mesh(planeM(w, h), m); me.position.set(...p); me.rotation.set(rx, ry, 0); me.receiveShadow = true; par.add(me); return me; };
  const anim: ((t: number, c: Ctl, light: string) => void)[] = [];
  const lamps: { L: THREE.PointLight; base: number; zone: string }[] = [];
  const pl = (p: V3, col: string, I: number, d: number, zone: string, par: THREE.Object3D = root) => { const L = new THREE.PointLight(col, I, d, 1.6); L.position.set(...p); par.add(L); lamps.push({ L, base: I, zone }); return L; };
  const label = (key: string, w: number, h: number, bg: string, fg: string, lines: [string, number][], p: V3, yaw = 0, par: THREE.Object3D = root, o: { strike?: number; px?: number; alpha?: boolean } = {}) => {
    const PX = o.px ?? 1024, PH = Math.round(PX * h / w);
    const tex = canvasTex(key, PX, PH, (g) => {
      if (!o.alpha) { g.fillStyle = bg; g.fillRect(0, 0, PX, PH); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${i % 2 ? "0,0,0" : "255,255,255"},${0.025 + 0.03 * hsh(i)})`; g.fillRect(hsh(i + 0.3) * PX, hsh(i + 0.8) * PH, 3 + 8 * hsh(i + 1.3), 2); } }
      g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
      const tot = lines.reduce((s, l) => s + l[1], 0); let y = (PH - tot * PH * 1.05) / 2;
      for (const [t, s] of lines) { let fs = s * PH; g.font = `900 ${fs}px ${SERIF}`; const mw = g.measureText(t).width; if (mw > PX * 0.86) { fs *= PX * 0.86 / mw; g.font = `900 ${fs}px ${SERIF}`; } y += s * PH * 1.05 / 2; g.fillText(t, PX / 2, y); y += s * PH * 1.05 / 2; }
      if (o.strike !== undefined) { const yy = o.strike * PH; g.strokeStyle = "#c0281c"; g.lineCap = "round"; g.lineWidth = PH * 0.06; g.beginPath(); g.moveTo(PX * 0.24, yy - PH * 0.08); g.lineTo(PX * 0.76, yy + PH * 0.06); g.moveTo(PX * 0.25, yy + PH * 0.08); g.lineTo(PX * 0.75, yy - PH * 0.07); g.stroke(); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: !!o.alpha }));
    return add(m, p, yaw, par);
  };

  // ---------------- materials ----------------
  const brick = phMat("red_brick_03", 1 / 1.4, 1 / 1.4, { tint: "#d8b4a0", rough: 0.95 });
  const brick2 = phMat("brick_wall_02", 1 / 1.6, 1 / 1.6, { tint: "#c8a090", rough: 0.95 });
  const concrete = phMat("concrete_floor_worn_001", 1 / 3, 1 / 3, { tint: "#d8c8b4", rough: 0.85 });
  const beams = phMat("dark_wooden_planks", 1 / 2, 1 / 2, { tint: "#a07858", rough: 0.85 });
  const roofPl = phMat("roof_planks", 1 / 2.5, 1 / 2.5, { tint: "#8a6a50", rough: 0.9 });
  const plaster = phMat("beige_wall_001", 1 / 2.2, 1 / 2.2, { tint: "#e8d8b8", rough: 0.9 });
  const woodFloor = phMat("old_wooden_floor_01", 1 / 1.6, 1 / 1.6, { tint: "#c89a70", rough: 0.8 });
  const darkWood = phMat("dark_wood", 1 / 1.2, 1 / 1.2, { tint: "#9a7050", rough: 0.6 });
  const cabinet = phMat("wood_cabinet_worn_long", 1 / 1.5, 1 / 1.5, { tint: "#b08868", rough: 0.7 });
  const cobble = phMat("cobblestone_floor_001", 1 / 2.4, 1 / 2.4, { tint: "#b0a49a", rough: 0.9 });
  const pave = phMat("concrete_pavement", 1 / 1.5, 1 / 1.5, { tint: "#c8c0b4", rough: 0.9 });
  const stone = phMat("stone_wall", 1 / 1.8, 1 / 1.8, { tint: "#b0a090", rough: 0.95 });
  const sidingCols = ["#e8dcc4", "#c8d8e0", "#e8d0b0", "#d0e0c8", "#e0c8c0"];
  const siding = sidingCols.map((t) => phMat("weathered_plank_siding", 1 / 2.4, 1 / 2.4, { tint: t, rough: 0.85, key: t }));
  const shingle = phMat("red_slate_roof_tiles_01", 1 / 2.2, 1 / 2.2, { tint: "#a08880", rough: 0.85 });
  const trimWhite = std("#e8e2d4", 0.6), trimDark = std("#3a3028", 0.6), iron = std("#2a2a2e", 0.5, 0.6);
  const paneDay = new THREE.MeshStandardMaterial({ color: "#2a3440", roughness: 0.08, metalness: 0.4, envMapIntensity: 1.2 });
  const paneNight = new THREE.MeshStandardMaterial({ color: "#3a2a1a", emissive: "#ffb060", emissiveIntensity: 0, roughness: 0.3 });

  // =====================================================================================================
  // THE BREWERY
  // =====================================================================================================
  {
    box(12.4, 0.1, 12.4, concrete, [0, -0.05, 6]);
    box(12.4, 5.8, 0.3, brick, [0, 2.9, 12.15]);                                     // back wall
    box(0.3, 5.8, 12.4, brick, [-6.15, 2.9, 6]); box(0.3, 5.8, 12.4, brick, [6.15, 2.9, 6]);
    box(4.6, 5.8, 0.3, brick, [-3.9, 2.9, -0.15]); box(4.6, 5.8, 0.3, brick, [3.9, 2.9, -0.15]); box(3.2, 2.0, 0.3, brick, [0, 4.8, -0.15]);
    box(12.4, 0.12, 12.4, roofPl, [0, 5.86, 6]);
    for (let z = 1.2; z < 12; z += 2.2) box(12.2, 0.32, 0.24, beams, [0, 5.62, z]);
    for (const x of [-3, 3]) box(0.24, 0.3, 12.2, beams, [x, 5.36, 6]);
    for (const x of [-3, 3]) for (const z of [3.8, 8.2]) box(0.28, 5.4, 0.28, beams, [x === -3 ? -5.7 : 5.7, 2.7, z]);
    // street door (one leaf open) with the federal notice
    const leaf = (x: number, yaw: number) => { const g = new THREE.Group(); add(g, [x, 0, 0.02], yaw); const d = box(1.55, 3.6, 0.08, phMat("old_planks_02", 1 / 1.2, 1 / 1.2, { tint: "#7a5a40" }), [x < 0 ? 0.78 : -0.78, 1.8, 0], 0, g); for (const y of [0.6, 1.8, 3.0]) box(1.5, 0.08, 0.04, iron, [x < 0 ? 0.78 : -0.78, y, 0.06], 0, g); return d; };
    leaf(-1.6, 0); leaf(1.6, -1.25);
    label("closedNotice", 0.9, 1.1, "#f2ecd8", "#2a1a10", [["CLOSED", 0.2], ["BY ORDER", 0.12], ["NO BEER", 0.2], ["U.S. PROHIBITION", 0.09]], [-0.8, 1.7, 0.08], 0);
    label("closedNotice2", 0.9, 1.1, "#f2ecd8", "#2a1a10", [["CLOSED", 0.2], ["BY ORDER", 0.12], ["NO BEER", 0.2], ["U.S. PROHIBITION", 0.09]], [5.98, 1.9, 5.6], -Math.PI / 2);
    // arched windows (west wall) + daylight shafts
    for (const z of [2.6, 5.6]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: "#f4ead2" })); add(win, [-5.99, 3.0, z], Math.PI / 2);
      for (const y of [2.1, 3.0, 3.9]) box(0.06, 0.06, 1.6, trimDark, [-5.96, y, z]); box(0.06, 2.6, 0.06, trimDark, [-5.96, 3.0, z]);
      const arch = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: "#f8f0dc" })); add(arch, [-5.99, 4.3, z], Math.PI / 2);
      shaft(root, [-5.9, 4.0, z], [-1.6, 0.0, z + 1.6], 1.3, "#ffe8c0", 0.16);
    }
    // the copper kettle + spout + canning line
    const K = kettle(root, BR.KETTLE, brick2);
    const tbl = new THREE.Group(); add(tbl, [0.6, 0, BR.LINE_Z - 0.1]);
    box(4.4, 0.08, 0.62, darkWood, [0, BR.TABLE_TOP - 0.04, 0], 0, tbl);
    for (const x of [-2.1, -0.7, 0.7, 2.1]) for (const z of [-0.26, 0.26]) box(0.07, BR.TABLE_TOP - 0.08, 0.07, iron, [x, (BR.TABLE_TOP - 0.08) / 2, z], 0, tbl);
    for (let x = -2.1; x <= 2.1; x += 0.18) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), std("#9aa0a6", 0.35, 0.8)); r.rotation.x = Math.PI / 2; r.position.set(x, BR.TABLE_TOP + 0.005, 0.03); tbl.add(r); }
    box(4.4, 0.06, 0.04, iron, [0, BR.TABLE_TOP + 0.04, 0.28], 0, tbl); box(4.4, 0.06, 0.04, iron, [0, BR.TABLE_TOP + 0.04, -0.22], 0, tbl);
    const NC = 16, cans: THREE.Group[] = [];
    for (let i = 0; i < NC; i++) { const plain = syrupCan(false), lab = syrupCan(true); const g = new THREE.Group(); g.add(plain, lab); g.userData = { plain, lab }; root.add(g); cans.push(g); }
    const pyr = [syrupCan(), syrupCan(), syrupCan()]; pyr.forEach((p, i) => add(p, i < 2 ? [2.52 + i * 0.15, BR.TABLE_TOP + 0.01, BR.LINE_Z] : [2.595, BR.TABLE_TOP + 0.172, BR.LINE_Z]));
    // crates of finished cans (labelled) + stacks of cans beside the line
    const crateLab = (key: string) => canvasTex(key, 512, 256, (g) => { g.fillStyle = "#c8a878"; g.fillRect(0, 0, 512, 256); for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(80,50,20,0.25)"; g.fillRect(0, i * 44 + 20, 512, 3); } g.fillStyle = "#3a1e10"; g.font = `900 64px ${SERIF}`; g.textAlign = "center"; g.fillText("BAKING", 256, 110); g.fillText("SYRUP", 256, 180); });
    const crM = new THREE.MeshStandardMaterial({ map: crateLab("crateBS"), roughness: 0.85 });
    for (const [x, y, z, r] of [[3.6, 0.25, 9.4, 0.1], [4.25, 0.25, 9.6, -0.05], [3.8, 0.75, 9.5, 0.2], [4.9, 0.25, 9.1, 0.3], [4.4, 0.75, 9.3, -0.15], [3.6, 0.25, 10.4, 0]] as [number, number, number, number][]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.46), crM); c.castShadow = c.receiveShadow = true; add(c, [x, y, z], r); }
    const field = new CanField(root, 60); let k = 0;
    for (let row = 0; row < 4; row++) for (let i = 0; i < 6 - row; i++) field.set(k++, [3.35 + i * 0.14 + row * 0.07, 1.0 + row * 0.165, 8.85], i * 0.7);
    for (let i = 0; i < 18; i++) field.set(k++, [-0.6 + (i % 6) * 0.15, 0.0, 10.0 + Math.floor(i / 6) * 0.15], i);
    field.count(k);
    // the big wall sign on the back wall
    label("wallSign", 5.2, 2.6, "#d6bf8c", "#3a1e10", [["HOLLOW CREEK BREWING CO.", 0.15], ["BEER", 0.34], ["BAKING SYRUP", 0.2]], [0.9, 3.05, 11.94], Math.PI, root, { strike: 0.5 });
    box(5.4, 2.8, 0.06, darkWood, [0.9, 3.05, 12.0]);
    // the beer barrel the agents tip (pivot at its front-bottom edge) + the drain + the foam gush
    const piv = new THREE.Group(); add(piv, [BR.BARREL[0], 0, BR.BARREL[2] - 0.42]);
    const bb = phModel("wine_barrel_01", { center: true, h: 0.95 }); bb.position.set(0, 0, 0.42); piv.add(bb);
    const drain = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), std("#1a1a1c", 0.4, 0.8)); drain.rotation.x = -Math.PI / 2; add(drain, BR.DRAIN);
    for (let i = -3; i <= 3; i++) box(0.5, 0.012, 0.03, iron, [BR.DRAIN[0], 0.012, BR.DRAIN[2] + i * 0.07]);
    const gushM = new THREE.MeshStandardMaterial({ color: "#d8a440", roughness: 0.2, transparent: true, opacity: 0.85 });
    const gush = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 1, 14, 1, true).translate(0, -0.5, 0), gushM); root.add(gush);
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: "#c89030", roughness: 0.1, transparent: true, opacity: 0.8 })); puddle.rotation.x = -Math.PI / 2; add(puddle, [BR.DRAIN[0], 0.008, BR.DRAIN[2] + 0.1]);
    const gfoam = new FoamBurst(root, [BR.DRAIN[0], 0.25, BR.DRAIN[2] + 0.25], [0, 0.25, -0.2], 10, 0.3);
    // barrels along the east wall, hop sacks by the kettle, pipes, gauges, lamps, tools
    for (const [x, z, y] of [[5.4, 1.4, 0], [5.4, 2.4, 0], [4.5, 1.4, 0], [5.4, 1.9, 0.95], [5.4, 6.6, 0], [5.4, 7.6, 0], [4.6, 6.9, 0]] as V3[]) ph("wine_barrel_01", [x, y, z], hsh(x + z) * 3, { h: 0.95 });
    ph("wooden_barrels_01", [-1.4, 0, 1.2], 0.4, { h: 1.6 });
    const hops = (p: V3) => { sack(root, p, 0.34, "#a08850"); const l = label("hops" + p[0], 0.36, 0.2, "#a08850", "#3a2a14", [["HOPS", 0.7]], [p[0], p[1] + 0.36, p[2] - 0.28], 0.15); l.renderOrder = 2; };
    hops([-5.3, 0, 5.2]); hops([-4.7, 0, 5.4]); hops([-5.1, 0, 6.0]); hops([-5.2, 0.62, 5.6]);
    pipeRun(root, [-6, 4.6, 11.8], [6, 4.6, 11.8], 0.07, "#b06a40"); pipeRun(root, [-6, 4.25, 11.8], [6, 4.25, 11.8], 0.045, "#7a7e86");
    pipeRun(root, [5.9, 4.4, 1], [5.9, 4.4, 11.8], 0.05, "#b06a40");
    for (const x of [-2.4, 4.1]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 24), new THREE.MeshStandardMaterial({ color: "#f4efe2", roughness: 0.5 })); d.rotation.x = Math.PI / 2; add(d, [x, 2.4, 11.95]); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.018, 6, 24), brassM()); add(rim, [x, 2.4, 11.95]); }
    for (const [x, z] of [[-1.2, 4.5], [1.0, 7.6], [-3.2, 2.8], [3.0, 2.4], [3.4, 9.2], [-1.6, 10.6]] as [number, number][]) { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 8, 0, TAU, 0, Math.PI / 2), std("#2a4a3a", 0.45)); add(sh, [x, 3.6, z]); const inner = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#f4efe2", roughness: 0.6, side: THREE.BackSide })); add(inner, [x, 3.6, z]); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshStandardMaterial({ color: "#fff4d8", emissive: "#ffe0a0", emissiveIntensity: 3 })); add(bulb, [x, 3.6, z]); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.0, 4), iron); add(c, [x, 4.6, z]); pl([x, 3.45, z], "#ffc070", 12, 12, "brew"); glow(root, [x, 3.55, z], "#ffc070", 0.28); }
    ph("standing_chalkboard_01", [-1.9, 0, 10.6], 0.2, { h: 1.2 });
    label("chalkToday", 0.55, 0.4, "#2a2e2a", "#eeeedd", [["TODAY:", 0.24], ["SYRUP", 0.3]], [-1.88, 0.86, 10.52], 0.2);
    ph("wooden_broom", [5.75, 0, 10.8], 0.3, { h: 1.4 }); ph("wooden_bucket_01", [-0.8, 0, 9.9], 0, { h: 0.34 });
    ph("wall_clock", [-3.5, 3.6, 11.97], Math.PI, { h: 0.45 });
    ph("Shelf_01", [-5.75, 0, 9.6], Math.PI / 2, { h: 1.9 });
    for (let i = 0; i < 9; i++) ph(i % 3 ? "wooden_bucket_02" : "metal_jug", [-5.65, 0.42 + Math.floor(i / 3) * 0.55, 9.1 + (i % 3) * 0.4], i, { h: 0.26 });
    anim.push((t, c, light) => {
      if (light !== "brew") return;
      const sp = cl(c.line ?? 0), off = t * 0.33 * sp;
      cans.forEach((g, i) => {
        const x = -1.6 + ((i * 0.27 + off) % (NC * 0.27)); const on = x < 2.35; g.visible = on;
        g.position.set(x, BR.TABLE_TOP + 0.01, BR.LINE_Z); g.rotation.y = i * 1.3;
        g.userData.plain.visible = x < -0.05; g.userData.lab.visible = x >= -0.05;
      });
      const pour = cl(c.pour ?? 0); K.stream.visible = pour > 0.02; K.stream.scale.set(1, Math.max(0.02, 1.26 - BR.TABLE_TOP - 0.17) * pour, 1);
      pyr.forEach((p) => (p.visible = (c.pyr ?? 0) > 0.5));
      const tip = sm(c.tip ?? 0); piv.rotation.x = -tip * 1.25;
      const gs = cl(c.gush ?? 0); gush.visible = gs > 0.02; gush.position.set(BR.BARREL[0], 0.62, BR.DRAIN[2] + 0.12); gush.scale.set(gs, 0.62 * gs + 0.01, gs);
      puddle.scale.setScalar(0.1 + 0.8 * gs); puddle.visible = gs > 0.02; gfoam.set(gs > 0.05 ? (t * 0.7) % 1.4 : -1);
    });
  }

  // =====================================================================================================
  // THE GROCERY (x 96..104)
  // =====================================================================================================
  {
    const X = BR.GX;
    box(8.4, 0.1, 7.4, woodFloor, [X, -0.05, 3.5]);
    box(8.4, 3.6, 0.2, plaster, [X, 1.8, 7.1]); box(0.2, 3.6, 7.4, plaster, [X - 4.1, 1.8, 3.5]); box(0.2, 3.6, 7.4, plaster, [X + 4.1, 1.8, 3.5]);
    for (const [w, x, z, yaw] of [[8.2, X, 6.98, 0], [7.2, X - 3.98, 3.5, Math.PI / 2], [7.2, X + 3.98, 3.5, -Math.PI / 2]] as [number, number, number, number][]) box(w, 1.0, 0.04, cabinet, [x, 0.5, z], yaw);
    // front wall with the big window and the door
    box(0.6, 3.6, 0.2, plaster, [X - 3.8, 1.8, -0.1]); box(1.0, 3.6, 0.2, plaster, [X + 1.25, 1.8, -0.1]); box(1.4, 3.6, 0.2, plaster, [X + 3.4, 1.8, -0.1]);
    box(4.2, 0.85, 0.2, cabinet, [X - 1.4, 0.42, -0.1]); box(4.2, 0.8, 0.2, plaster, [X - 1.4, 3.2, -0.1]); box(1.0, 1.1, 0.2, plaster, [X + 2.25, 3.05, -0.1]);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.95), new THREE.MeshStandardMaterial({ color: "#dfe8ee", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.12 })); add(win, [X - 1.4, 1.83, -0.08]);
    for (const x of [-3.5, -1.4, 0.7]) box(0.08, 1.95, 0.1, trimDark, [X + x, 1.83, -0.05]); box(4.2, 0.08, 0.1, trimDark, [X - 1.4, 2.4, -0.05]);
    label("grocWin", 3.0, 0.55, "#000000", "#e8c060", [["CORNER GROCERY", 0.6]], [X - 1.4, 2.62, -0.02], Math.PI, root, { alpha: true });
    // what you see through the window: the street's far side
    for (let i = 0; i < 4; i++) box(3.2, 6, 0.4, i % 2 ? brick : brick2, [X - 6 + i * 3.4, 3, -8.5]);
    box(16, 0.1, 9, pave, [X - 1, -0.06, -4]);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshBasicMaterial({ color: "#c8dcec" })); add(sky, [X - 1, 6, -8.8]);
    // ceiling: pressed tin tiles + pendant lamps
    const tin = new THREE.MeshStandardMaterial({ color: "#c8c0b0", roughness: 0.4, metalness: 0.6, map: canvasTex("tinCeil", 256, 256, (g) => { g.fillStyle = "#a8a090"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#e8e0d0"; g.lineWidth = 6; g.strokeRect(10, 10, 236, 236); g.beginPath(); g.arc(128, 128, 60, 0, TAU); g.stroke(); g.beginPath(); g.arc(128, 128, 30, 0, TAU); g.stroke(); }) });
    (tin.map as THREE.Texture).wrapS = (tin.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (tin.map as THREE.Texture).repeat.set(14, 12);
    plane(8.2, 7.2, tin, [X, 3.4, 3.5], 0, Math.PI / 2);
    for (const [x, z] of [[X - 2, 2.2], [X + 1.5, 2.2], [X - 0.2, 5.4]] as [number, number][]) { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, TAU, 0, Math.PI / 2), std("#2a4a3a", 0.5)); add(sh, [x, 2.75, z]); const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 4), iron); add(cord, [x, 3.08, z]); glow(root, [x, 2.7, z], "#ffd090", 0.35); pl([x, 2.65, z], "#ffd090", 3, 7, "groc"); }
    // the counter (dark wood, panelled front), register, jars, scale
    box(4.2, 0.92, 0.6, cabinet, [X - 0.6, 0.46, BR.COUNTER_Z]); box(4.4, 0.05, 0.7, darkWood, [X - 0.6, BR.COUNTER_TOP - 0.025, BR.COUNTER_Z]);
    for (let i = 0; i < 5; i++) box(0.7, 0.55, 0.02, darkWood, [X - 2.3 + i * 0.85, 0.45, BR.COUNTER_Z - 0.31]);
    ph("CashRegister_01", [X + 0.95, BR.COUNTER_TOP, BR.COUNTER_Z], Math.PI, { h: 0.42 });
    for (let i = 0; i < 4; i++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 16), new THREE.MeshStandardMaterial({ color: ["#c84a3a", "#e8c050", "#6a3a1a", "#e8e0d0"][i], roughness: 0.2, transparent: true, opacity: 0.85 })); add(j, [X - 2.5 + i * 0.22, BR.COUNTER_TOP + 0.12, BR.COUNTER_Z + 0.15]); }
    ph("wicker_basket_01", [X - 1.6, BR.COUNTER_TOP, BR.COUNTER_Z - 0.05], 0.3, { h: 0.18 });
    // back-wall shelving: general stock (left) and the SYRUP WALL (right)
    const shelfAt = (x0: number, x1: number, z: number, n = 6, h = 2.7) => { const g = new THREE.Group(); root.add(g); const W = x1 - x0; box(W, h, 0.04, darkWood, [(x0 + x1) / 2, h / 2, z + 0.16], 0, g); for (const x of [x0, x1]) box(0.05, h, 0.38, darkWood, [x, h / 2, z], 0, g); const ys: number[] = []; for (let i = 0; i < n; i++) { const y = 0.25 + i * (h - 0.35) / (n - 1); ys.push(y); box(W, 0.03, 0.38, darkWood, [(x0 + x1) / 2, y, z], 0, g); } return ys; };
    const genY = shelfAt(X - 3.8, X - 0.6, 6.78);
    const STOCK: [PhModel, number, number][] = [["russian_food_cans_01", 0.12, 0.1], ["oil_tin", 0.2, 0.14], ["jug_01", 0.2, 0.15], ["ceramic_pot", 0.16, 0.16], ["wooden_bowl_01", 0.08, 0.28], ["pot_enamel_01", 0.16, 0.26], ["brass_pot_01", 0.18, 0.26]];
    genY.forEach((y, li) => { let x = X - 3.7; let s = li * 7 + 1; while (x < X - 0.75) { const it = STOCK[Math.floor(hsh(s++) * STOCK.length)]; if (x + it[2] > X - 0.7) break; ph(it[0], [x + it[2] / 2, y + 0.015, 6.78 + (hsh(s) - 0.5) * 0.1], hsh(s + 2) * 2, { h: it[1] }); x += it[2] + 0.03 + 0.06 * hsh(s + 5); } });
    const wallY = shelfAt(BR.WALL_X0, BR.WALL_X1, 6.78);
    const wf = new CanField(root, 26 * wallY.length); const wallPts: V3[] = [];
    for (let li = 0; li < wallY.length; li++) for (let i = 0; i < 26; i++) wallPts.push([BR.WALL_X0 + 0.1 + i * 0.148 + (li % 2) * 0.03, wallY[li] + 0.016, 6.72 + 0.06 * hsh(li * 26 + i)]);
    // fill order: the shelves at eye height first, then up and down (3 cans, then a shelf, then the wall)
    const order = [...wallPts.keys()].sort((a, b) => { const la = Math.floor(a / 26), lb = Math.floor(b / 26); const ra = Math.abs(la - 2.5), rb = Math.abs(lb - 2.5); return ra - rb || a - b; });
    order.forEach((pi, k) => wf.set(k, wallPts[pi], pi * 0.9));
    label("syrupSign", 3.8, 0.42, "#3a1e10", "#f2d38a", [["MALT SYRUP ~ FOR BAKING", 0.62]], [(BR.WALL_X0 + BR.WALL_X1) / 2, 2.95, 6.95], Math.PI);
    // flour sacks next to it (dusty, a cobweb, a spider) + the empty bread rack + the count board + the wink poster
    const flourTex = canvasTex("flourSack", 512, 512, (g) => { g.fillStyle = "#e8e0cc"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 5) { g.fillStyle = "rgba(120,100,70,0.12)"; g.fillRect(0, y, 512, 1); } g.fillStyle = "#3a5aa8"; g.font = `900 110px ${SERIF}`; g.textAlign = "center"; g.fillText("FLOUR", 256, 250); g.font = `700 50px ${SERIF}`; g.fillText("25 LB", 256, 330); });
    const flourM = new THREE.MeshStandardMaterial({ map: flourTex, roughness: 0.95 });
    for (const [x, y, z, r] of [[103.55, 0, 5.0, 0.1], [103.5, 0, 5.75, -0.1], [103.55, 0, 6.45, 0.05], [103.55, 0.62, 5.4, 0.2], [103.5, 0.62, 6.1, -0.15]] as [number, number, number, number][]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.6, 0.42, 4, 4, 2), flourM); const pa = m.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pa.count; i++) { const px = pa.getX(i), py = pa.getY(i), pz = pa.getZ(i); const k2 = 1 - 0.18 * (Math.abs(py) / 0.3) ** 2; pa.setXYZ(i, px * k2 * (1 + 0.06 * Math.sin(py * 9)), py, pz * k2); } m.geometry.computeVertexNormals(); m.castShadow = m.receiveShadow = true; add(m, [x, y + 0.3, z], Math.PI / 2 + r); }
    const web = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex("cobweb", 256, 256, (g) => { g.strokeStyle = "rgba(240,240,240,0.7)"; g.lineWidth = 1.5; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a * 0.2) * 256, Math.sin(a * 0.2) * 256); g.stroke(); } for (let r = 30; r < 256; r += 28) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI / 2); g.stroke(); } }), transparent: true, depthWrite: false }));
    add(web, [103.98, 1.35, 4.75], -Math.PI / 2);
    const spider = new THREE.Group(); const sb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), std("#1a1a1a", 0.6)); spider.add(sb);
    for (let i = 0; i < 8; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 3), std("#1a1a1a", 0.6)); l.position.set((i < 4 ? -1 : 1) * 0.03, 0, (i % 4 - 1.5) * 0.015); l.rotation.z = (i < 4 ? 1 : -1) * 1.0; spider.add(l); }
    root.add(spider);
    const rack = new THREE.Group(); add(rack, [BR.BREAD[0], 0, BR.BREAD[2]], Math.PI / 2);
    for (let i = 0; i < 4; i++) box(1.4, 0.03, 0.4, darkWood, [0, 0.4 + i * 0.42, 0], 0, rack); for (const x of [-0.7, 0.7]) box(0.04, 1.8, 0.4, darkWood, [x, 0.9, 0], 0, rack);
    label("breadSign", 0.9, 0.3, "#f2ecd8", "#3a1e10", [["BREAD", 0.7]], [BR.BREAD[0] + 0.22, 1.95, BR.BREAD[2]], Math.PI / 2);
    ph("croissant", [BR.BREAD[0] + 0.05, 0.43, BR.BREAD[2] + 0.4], 1, { h: 0.04 });
    const board = counter(0.8, 0.8, "SYRUP SOLD", "THIS WEEK"); board.place(root, BR.BOARD, Math.PI);
    poster(root, [X - 2.0, 2.05, 6.93], Math.PI, 0.8, 1.05, "#f2e2b0", [["MALT SYRUP", 0.13, "#b3261e"], ["for BAKING", 0.1, "#3a1e10"], [";)", 0.24, "#3a1e10"], ["ask your grocer", 0.07, "#3a1e10"]], { key: "winkPoster" });
    // the yeast tower on the hand truck, the pancake demo on the counter
    const yeastG = new THREE.Group(); add(yeastG, BR.YEAST, 0.5);
    yeastG.add(phModel("hand_truck", { center: true, h: 1.35 }));
    const ytex = canvasTex("yeastBox", 512, 256, (g) => { g.fillStyle = "#f2d860"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#b3261e"; g.fillRect(0, 0, 512, 50); g.fillStyle = "#3a1e10"; g.font = `900 92px ${SERIF}`; g.textAlign = "center"; g.fillText("YEAST", 256, 150); g.font = `700 40px ${SERIF}`; g.fillText("FOR BREAD", 256, 215); });
    for (let i = 0; i < 9; i++) { const bx = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.3), new THREE.MeshStandardMaterial({ map: ytex, roughness: 0.8 })); bx.position.set((hsh(i) - 0.5) * 0.04, 0.2 + i * 0.245, 0.12); bx.rotation.y = (hsh(i + 3) - 0.5) * 0.15; bx.castShadow = true; yeastG.add(bx); }
    const pan = new THREE.Group(); add(pan, [X - 2.0, BR.COUNTER_TOP, BR.COUNTER_Z + 0.05]);
    const pbox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.07), new THREE.MeshStandardMaterial({ map: canvasTex("pancakeBox", 256, 368, (g) => { g.fillStyle = "#e86a2a"; g.fillRect(0, 0, 256, 368); g.fillStyle = "#fff2d8"; g.font = `900 52px ${SERIF}`; g.textAlign = "center"; g.fillText("PANCAKE", 128, 90); g.fillText("MIX", 128, 150); g.font = `700 30px ${SERIF}`; g.fillText("JUST ADD", 128, 250); g.fillText("WATER", 128, 290); }), roughness: 0.7 }));
    pbox.position.set(-0.25, 0.13, 0); pan.add(pbox);
    const bowl = phModel("wooden_bowl_01", { center: true, h: 0.09 }); bowl.position.set(0.05, 0, 0); pan.add(bowl);
    const batter = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), std("#e8d2a0", 0.5)); batter.rotation.x = -Math.PI / 2; batter.position.set(0.05, 0.06, 0); pan.add(batter);
    const mug = phModel("metal_jug", { center: true, h: 0.22 }); mug.position.set(0.32, 0, 0.02); pan.add(mug);
    const froth = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 8), std("#f6efe0", 0.9)); froth.position.set(0.32, 0.2, 0.02); pan.add(froth);
    const demoCan = syrupCan(); demoCan.position.set(0.55, 0, 0.0); pan.add(demoCan);
    anim.push((t, c, light) => {
      if (light !== "groc") return;
      const n = Math.round(cl(c.wall ?? 0) * wf.n); wf.count(n);
      board.set(String(Math.round(c.board ?? 0)));
      yeastG.visible = (c.yeast ?? 0) > 0.5;
      const pk = cl(c.pancake ?? 0); pan.visible = (c.pancakeOn ?? 0) > 0.5; batter.scale.setScalar(0.2 + 0.8 * sm(pk, 0, 0.4)); froth.scale.setScalar(0.01 + sm(pk, 0.5, 0.9) * (1 + 0.08 * Math.sin(t * 9)));
      const sa = (t * 0.06) % 1; spider.position.set(103.25, 1.18 - 0.05 * Math.sin(t * 1.3), 4.95 + 0.35 * sa); spider.rotation.y = 0.2;
    });
  }

  // =====================================================================================================
  // MAIN STREET (x 170..250) + the two cellars
  // =====================================================================================================
  const houses: { x: number; pane: THREE.Mesh[]; foam: FoamBurst; cw: THREE.Mesh }[] = [];
  const nightLamps: THREE.PointLight[] = []; const nightGlows: THREE.Sprite[] = [];
  {
    const X = BR.MX;
    box(84, 0.1, 8, cobble, [X + 10, -0.05, 0]);
    for (const z of [5.5, -5.5]) { box(84, 0.15, 3, pave, [X + 10, 0.075, z]); box(84, 0.17, 0.12, std("#a8a49c", 0.85), [X + 10, 0.085, z > 0 ? 4.0 : -4.0]); }
    box(84, 0.1, 12, phMat("sparse_grass", 1 / 3, 1 / 3, { tint: "#9aa070" }), [X + 10, 0.03, 13]);
    // the agents' office (two storeys of brick, the big window with the gold lettering, a desk inside)
    {
      const ox = 188; box(0.9, 7, 0.3, brick, [184.45, 3.5, 8.6]); box(2.5, 7, 0.3, brick, [190.75, 3.5, 8.6]); box(4.6, 0.8, 0.3, brick, [187.2, 0.4, 8.6]); box(4.6, 4.0, 0.3, brick, [187.2, 5.0, 8.6]); box(8, 7, 0.3, brick, [ox, 3.5, 14]); box(0.3, 7, 5.6, brick, [ox - 4, 3.5, 11.3]); box(0.3, 7, 5.6, brick, [ox + 4, 3.5, 11.3]);
      box(8.2, 0.2, 5.8, roofPl, [ox, 7.05, 11.3]); box(7.6, 0.1, 5.3, woodFloor, [ox, 0.1, 11.3]);
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), new THREE.MeshStandardMaterial({ color: "#c8d8e0", roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.1 })); add(hole, [ox - 0.8, 1.9, 8.42]);
      label("agentWin", 4.0, 0.5, "#000000", "#e8c060", [["PROHIBITION AGENTS", 0.62]], [ox - 0.8, 2.6, 8.41], Math.PI, root, { alpha: true });
      // window frame (cut out of the wall visually: frame over the wall face)
      box(4.8, 0.14, 0.12, trimDark, [ox - 0.8, 3.05, 8.4]); box(4.8, 0.14, 0.12, trimDark, [ox - 0.8, 0.78, 8.4]); for (const x of [-3.2, 1.6]) box(0.12, 2.3, 0.12, trimDark, [ox + x, 1.92, 8.4]);
      box(1.8, 0.06, 0.9, darkWood, [ox - 0.8, 0.78, 10.2]); for (const [dx, dz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) box(0.06, 0.72, 0.06, darkWood, [ox - 0.8 + dx, 0.39, 10.2 + dz]);
      ph("vintage_oil_lamp", [ox - 1.4, 0.81, 10.1], 0, { h: 0.35 }); ph("office_notepads", [ox - 0.5, 0.81, 10.0], 0.4, { h: 0.03 });
      ph("vintage_telephone_wall_clock", [ox + 1.5, 1.8, 13.8], Math.PI, { h: 0.6 }); ph("drawer_cabinet", [ox + 2.6, 0.1, 13.4], Math.PI, { h: 1.3 });
      pl([ox - 0.8, 2.6, 10.5], "#ffd8a0", 3, 8, "street");
      // dressing (look-dev 5: the window shot read as bare plaster): the raid board, a wanted poster, a framed map, evidence barrels, a shelf of seized jugs, chairs, a ceiling lamp
      label("raidBoard", 1.5, 0.95, "#2a2e2a", "#eeeedd", [["RAIDS THIS WEEK:", 0.15], ["0", 0.46]], [ox + 0.2, 2.45, 13.76], Math.PI);
      poster(root, [ox - 2.3, 2.3, 13.78], Math.PI, 0.75, 1.0, "#efe4c4", [["WANTED", 0.2, "#7a1a12"], ["BOOTLEGGERS", 0.09, "#2a1a10"], ["$500", 0.18, "#2a1a10"]], { key: "wantedP" });
      poster(root, [ox + 2.3, 2.5, 13.78], Math.PI, 1.0, 0.7, "#d9cfa6", [["COUNTY MAP", 0.1, "#3a2a1a"], ["~ ~ + ~ ~", 0.14, "#5a4a32"]], { key: "mapP", border: "#4a3020" });
      ph("wooden_barrels_01", [ox - 3.05, 0.1, 12.6], 0.4, { h: 1.0 });
      label("evidence", 0.9, 0.22, "#e8dcb8", "#7a1a12", [["EVIDENCE", 0.15]], [ox - 3.0, 1.25, 11.95], Math.PI * 0.85);
      ph("Shelf_01", [ox + 3.55, 0.1, 11.6], -Math.PI / 2, { h: 1.9 });
      for (let i = 0; i < 6; i++) ph(i % 2 ? "jug_01" : "metal_jug", [ox + 3.5, 0.55 + Math.floor(i / 3) * 0.6, 11.1 + (i % 3) * 0.45], i, { h: 0.28 });
      for (const dx of [-1.5, 0.0]) ph("dining_chair_02", [ox - 0.8 + dx, 0.1, 11.05], Math.PI, { h: 0.95 });
      ph("caged_hanging_light", [ox - 0.8, 5.0, 11.0], 0, { h: 0.45 }); glow(root, [ox - 0.8, 5.18, 11.0], "#ffd8a0", 0.3);
      // the office's own wall behind the window: plaster
      plane(7.6, 6.6, plaster, [ox, 3.4, 13.82], Math.PI);
      // NOTE the front wall box above is solid: punch the window by hiding a slice (the window area is drawn by the hole plane)
    }
    // houses H1..H5
    const house = (i: number, x: number) => {
      const z0 = BR.HOUSE_Z, mat = siding[i % siding.length], g = new THREE.Group(); root.add(g);
      box(6, 5.2, 6, mat, [x, 2.6 + 0.4, z0 + 3], 0, g);
      box(6.2, 0.4, 6.2, stone, [x, 0.2, z0 + 3], 0, g);                                       // foundation
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 4.4, 2.6, 4, 1), shingle); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 1.05); roof.position.set(x, 6.9, z0 + 3); roof.castShadow = true; g.add(roof);
      // porch: deck, steps, posts, rail, roof
      box(3.4, 0.12, 1.5, phMat("old_planks_02", 1 / 1.2, 1 / 1.2, { tint: "#a08060", key: "porch" }), [x, BR.PORCH_Y - 0.06, z0 - 0.75], 0, g);
      box(3.4, BR.PORCH_Y - 0.12, 0.05, trimWhite, [x, (BR.PORCH_Y - 0.12) / 2, z0 - 1.5], 0, g);
      for (let s = 0; s < 3; s++) box(1.2, 0.15, 0.3, phMat("old_planks_02", 1 / 1.2, 1 / 1.2, { tint: "#a08060", key: "porch" }), [x, 0.15 + s * 0.15 + 0.075 - 0.075, z0 - 1.5 - (2 - s) * 0.3 - 0.15 + 0.3], 0, g);
      for (const dx of [-1.6, 1.6]) box(0.12, 2.6, 0.12, trimWhite, [x + dx, BR.PORCH_Y + 1.3, z0 - 1.42], 0, g);
      box(3.6, 0.1, 1.7, shingle, [x, BR.PORCH_Y + 2.65, z0 - 0.7], 0, g);
      for (const dx of [-1.05, 1.05]) { box(1.0, 0.06, 0.06, trimWhite, [x + dx, BR.PORCH_Y + 0.85, z0 - 1.44], 0, g); for (let k = 0; k < 6; k++) box(0.04, 0.85, 0.04, trimWhite, [x + dx - 0.45 + k * 0.18, BR.PORCH_Y + 0.42, z0 - 1.44], 0, g); }
      // door + windows (day panes / lit at night)
      box(1.0, 2.1, 0.08, std(["#6a2a2a", "#2a4a6a", "#3a5a3a", "#5a4a2a", "#2a3a5a"][i], 0.5), [x, BR.PORCH_Y + 1.05, z0 - 0.02], 0, g);
      ph("gate_latch_01", [x + 0.38, BR.PORCH_Y + 1.0, z0 - 0.07], 0, { h: 0.08 }, g);
      const panes: THREE.Mesh[] = [];
      for (const [dx, y] of [[-1.9, 1.9], [1.9, 1.9], [-1.5, 4.1], [1.5, 4.1], [0, 4.1]] as [number, number][]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), paneDay.clone()); add(p, [x + dx, y, z0 - 0.015], Math.PI, g); panes.push(p);
        box(1.16, 0.1, 0.1, trimWhite, [x + dx, y - 0.7, z0 - 0.05], 0, g); box(1.16, 0.08, 0.08, trimWhite, [x + dx, y + 0.69, z0 - 0.04], 0, g); for (const ex of [-0.55, 0, 0.55]) box(ex ? 0.08 : 0.05, 1.3, 0.08, trimWhite, [x + dx + ex, y, z0 - 0.04], 0, g); box(1.0, 0.05, 0.06, trimWhite, [x + dx, y, z0 - 0.04], 0, g);
      }
      // the cellar window in the foundation, right of the porch
      const cw = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshStandardMaterial({ color: "#2a2010", emissive: "#ff9a40", emissiveIntensity: 0, roughness: 0.2 })); add(cw, [x + 2.3, 0.22, z0 - 0.11], Math.PI, g);
      box(0.82, 0.06, 0.08, trimDark, [x + 2.3, 0.4, z0 - 0.13], 0, g); box(0.82, 0.06, 0.08, trimDark, [x + 2.3, 0.05, z0 - 0.13], 0, g);
      const foam = new FoamBurst(root, [x + 2.3, 0.25, z0 - 0.2], [0, 0.35, -1], 14, 0.4);
      houses.push({ x, pane: panes, foam, cw });
      return g;
    };
    for (let i = 0; i < 5; i++) house(i, 197 + i * 6);
    // the agent's bulkhead cellar doors (H5): two slanted leaves hinged on the outside edges
    const bulk = new THREE.Group(); add(bulk, BR.BULK);
    box(1.5, 0.5, 1.0, stone, [0, 0.08, 0.1], 0, bulk);
    const leafM = phMat("old_planks_02", 1 / 1, 1 / 1, { tint: "#6a4a30", key: "bulk" });
    const lL = new THREE.Group(), lR = new THREE.Group(); lL.position.set(-0.72, 0.34, 0.1); lR.position.set(0.72, 0.34, 0.1); bulk.add(lL, lR);
    const mL = new THREE.Mesh(boxM(0.7, 0.05, 1.0), leafM); mL.position.set(0.35, 0, 0); mL.castShadow = true; lL.add(mL);
    const mR = new THREE.Mesh(boxM(0.7, 0.05, 1.0), leafM); mR.position.set(-0.35, 0, 0); mR.castShadow = true; lR.add(mR);
    const lock = new THREE.Group(); lock.position.set(-0.02, 0.06, -0.3); lR.add(lock);
    const key = new THREE.Group(); lock.add(key);
    { const kb = brassM(); const bow = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 14), kb); bow.rotation.x = Math.PI / 2; key.add(bow); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6), kb); sh.rotation.z = Math.PI / 2; sh.position.x = 0.05; key.add(sh); const str = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.004, 4, 20), std("#c0281c", 0.7)); str.position.set(-0.04, -0.035, 0); str.rotation.y = 0.4; key.add(str); }
    // the church + the giant loaf beside it
    { const cx = 240; box(8, 8, 11, phMat("painted_plaster_wall", 1 / 2, 1 / 2, { tint: "#f4f0e8", key: "church" }), [cx, 4, 14.5]); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.4, 3.6, 4, 1), shingle); r.rotation.y = Math.PI / 4; r.scale.z = 1.5; r.position.set(cx, 9.8, 14.5); r.castShadow = true; root.add(r);
      box(3, 10, 3, phMat("painted_plaster_wall", 1 / 2, 1 / 2, { tint: "#f4f0e8", key: "church" }), [cx, 5, 8.6]); const sp = new THREE.Mesh(new THREE.ConeGeometry(2.2, 8, 4), shingle); sp.rotation.y = Math.PI / 4; sp.position.set(cx, 14, 8.6); sp.castShadow = true; root.add(sp); { const gold = std("#d8b048", 0.35, 0.6); box(0.12, 1.4, 0.12, gold, [cx, 18.7, 8.6]); box(0.8, 0.12, 0.12, gold, [cx, 18.95, 8.6]); const bell = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), std("#2a2420", 0.9)); bell.position.set(cx, 8.4, 7.08); bell.rotation.y = Math.PI; root.add(bell); }
      const bell = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), std("#1a1a20", 0.8)); add(bell, [cx, 8.2, 7.08], Math.PI); const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), std("#5a2a1a", 0.6)); add(door, [cx, 1.3, 7.08], Math.PI); }
    const giant = loaf(root, [228.5, 0, 15.5], 14); giant.rotation.y = 0.25;
    // the shops across the street (south side, fronts at z -8.5)
    const shops: [number, string, string][] = [[187, "BARBER", "#e8d0b0"], [193, "HARDWARE", "#d0d8e8"], [199, "CORNER GROCERY", "#e8c890"], [205, "BAKERY", "#f0d8c8"], [211, "DRUGS", "#d8e8d0"], [217, "SHOES", "#e0d0e0"], [223, "BANK", "#d8d0c0"], [229, "FEED & SEED", "#e8dcc0"]];
    shops.forEach(([x, name, col], i) => {
      box(6, 7, 0.4, i % 2 ? brick : brick2, [x, 3.5, -8.7]);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.9), paneDay.clone()); add(w, [x - 0.4, 1.75, -8.48]); w.userData.shop = true;
      box(4.4, 0.12, 0.12, trimDark, [x - 0.4, 2.75, -8.45]); box(4.4, 0.12, 0.12, trimDark, [x - 0.4, 0.75, -8.45]);
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), new THREE.MeshStandardMaterial({ map: canvasTex("awning" + i, 256, 64, (g) => { for (let k = 0; k < 16; k++) { g.fillStyle = k % 2 ? "#f2ead8" : ["#b3261e", "#2a5a8a", "#3a7a4a", "#c87a2a"][i % 4]; g.fillRect(k * 16, 0, 16, 64); } }), side: THREE.DoubleSide, roughness: 0.8 })); aw.position.set(x - 0.3, 3.1, -7.9); aw.rotation.x = -0.9; aw.castShadow = true; root.add(aw);
      label("shop" + i, 4.6, 0.6, col, "#2a1a10", [[name, 0.7]], [x - 0.3, 3.95, -8.47], 0);
      box(1.0, 2.2, 0.1, std("#4a3020", 0.6), [x + 2.3, 1.1, -8.46]);
    });
    // street lamps (lit at night), a couple of trees, the brewery truck
    for (let x = 182; x <= 236; x += 9) for (const z of [4.4, -4.4]) { ph("street_lamp_01", [x + (z > 0 ? 0 : 4.5), 0.15, z], z > 0 ? Math.PI : 0, { h: 4.2 }); const L = new THREE.PointLight("#ffc080", 0, 14, 1.6); L.position.set(x + (z > 0 ? 0 : 4.5), 3.9, z); root.add(L); nightLamps.push(L); nightGlows.push(glow(root, [x + (z > 0 ? 0 : 4.5), 3.95, z], "#ffc080", 0.9)); }
    for (const [x, z] of [[183, 7.6], [233, 7.4], [212.6, 15]] as [number, number][]) ph("oak_lite", [x, 0, z], hsh(x) * 3, { h: 9 });
const truckG = truck(root, [191.5, 0, 2.6], 0, chalkWordTex());
    // the CELLARS (granny under H1, the agent under H5): stone rooms, shelves of bottles, crocks, a bulb
    const cellar = (cx: number, kind: "granny" | "agent") => {
      const g = new THREE.Group(); root.add(g); const y0 = BR.CELLAR_Y, z0 = 8.6;
      box(5.2, 0.1, 4.2, phMat("old_wooden_floor_01", 1 / 1.6, 1 / 1.6, { tint: "#8a7058", key: "cellarF" }), [cx, y0 - 0.05, z0 + 2.1], 0, g);
      box(5.2, 2.5, 0.3, stone, [cx, y0 + 1.25, z0 + 4.25], 0, g); box(0.3, 2.5, 4.2, stone, [cx - 2.65, y0 + 1.25, z0 + 2.1], 0, g); box(0.3, 2.5, 4.2, stone, [cx + 2.65, y0 + 1.25, z0 + 2.1], 0, g);
      const front = box(5.2, 2.5, 0.3, stone, [cx, y0 + 1.25, z0 - 0.05], 0, g);                // hidden for the cutaway
      box(5.4, 0.25, 4.4, beams, [cx, -0.12, z0 + 2.1], 0, g);
      for (let k = 0; k < 4; k++) box(0.2, 0.22, 4.2, beams, [cx - 2 + k * 1.33, -0.36, z0 + 2.1], 0, g);
      // shelves of bottles on the back wall
      const sx0 = cx - 2.3, sx1 = cx + 1.0, pts: V3[] = [];
      for (let lv = 0; lv < 4; lv++) { const y = y0 + 0.35 + lv * 0.5; box(sx1 - sx0, 0.04, 0.36, darkWood, [(sx0 + sx1) / 2, y, z0 + 3.88], 0, g); for (let i = 0; i < 18; i++) pts.push([sx0 + 0.1 + i * 0.18, y + 0.02, z0 + 3.86 + 0.06 * hsh(lv * 18 + i)]); }
      for (const x of [sx0, sx1]) box(0.05, 2.2, 0.36, darkWood, [x, y0 + 1.1, z0 + 3.88], 0, g);
      const rack = new BottleRack(g, pts);
      const crocks = [crock(g, [cx + 1.6, y0, z0 + 3.6]), crock(g, [cx + 2.1, y0, z0 + 3.0]), crock(g, [cx + 1.9, y0, z0 + 2.3])];
      const hero = crock(g, [cx - 0.2, y0 + 0.62, z0 + 2.2], true);
      box(1.1, 0.06, 0.7, darkWood, [cx - 0.2, y0 + 0.6, z0 + 2.2], 0, g); for (const [dx, dz] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) box(0.06, 0.6, 0.06, darkWood, [cx - 0.2 + dx, y0 + 0.3, z0 + 2.2 + dz], 0, g);
      ph("wooden_bucket_01", [cx + 0.9, y0, z0 + 1.6], 0.4, { h: 0.34 }, g);
      const bulbG = phModel("lightbulb_01", { center: true, h: 0.12 }); bulbG.position.set(cx - 0.3, -0.62, z0 + 2.0); g.add(bulbG);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 4), iron); cord.position.set(cx - 0.3, -0.38, z0 + 2.0); g.add(cord);
      const bulbL = new THREE.PointLight("#ffc070", 4, 9, 1.4); bulbL.position.set(cx - 0.3, -0.72, z0 + 2.0); g.add(bulbL); glow(g, [cx - 0.3, -0.66, z0 + 2.0], "#ffd090", 0.45);
      // steps up to the street side (the agent's come down from the bulkhead)
      for (let s = 0; s < 8; s++) box(0.9, 0.1, 0.32, darkWood, [cx + 2.0, y0 + 0.16 + s * 0.3, z0 + 3.9 - s * 0.32], 0, g);
      box(0.06, 2.6, 2.7, darkWood, [cx + 1.52, y0 + 1.2, z0 + 2.6], 0, g);
      if (kind === "granny") { const soil = phMat("farm_soil", 1 / 1.5, 1 / 1.5, { tint: "#8a6a4a", key: "soilCut" }); box(3.4, 3.2, 4.6, soil, [cx - 4.4, y0 + 1.3, z0 + 2.15], 0, g); box(3.4, 3.2, 4.6, soil, [cx + 4.4, y0 + 1.3, z0 + 2.15], 0, g); box(12, 1.6, 4.6, soil, [cx, y0 - 0.85, z0 + 2.15], 0, g); }
      if (kind === "granny") label("chalk45", 0.5, 0.3, "#000000", "#f0f0e6", [["45", 0.8]], [cx - 1.6, y0 + 2.35, z0 + 4.08], Math.PI, g, { alpha: true });
      const capper = new THREE.Group(); capper.position.set(cx - 0.75, y0 + 0.63, z0 + 2.3); g.add(capper);
      { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.12), iron); capper.add(b); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), iron); p.position.set(0.05, 0.21, 0); capper.add(p); const h = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.03), std("#b3261e", 0.5)); h.position.set(0.0, 0.4, 0); capper.add(h); }
      const fb = new FoamBurst(g, [cx - 0.6, y0 + 1.6, z0 + 3.6], [0, 0.6, -0.6], 18, 0.42);
      return { g, rack, crocks, hero, front, fb, bulbL };
    };
    const cG = cellar(BR.H1, "granny"), cA = cellar(BR.H5, "agent");
    anim.push((t, c, light) => {
      const night = (c.night ?? (light === "stNight" || light === "cellar" ? 1 : 0)) > 0.5;
      for (const h of houses) { h.pane.forEach((p, k) => { const m = p.material as THREE.MeshStandardMaterial; m.emissive.set(night && (k + Math.floor(h.x)) % 3 !== 0 ? "#ffb060" : "#000000"); m.emissiveIntensity = night ? 1.1 : 0; m.color.set(night ? "#3a2a1a" : "#2a3440"); }); (h.cw.material as THREE.MeshStandardMaterial).emissiveIntensity = night ? 0.9 : 0; }
      nightLamps.forEach((L) => (L.intensity = night ? 7 : 0)); nightGlows.forEach((s) => (s.visible = night));
      houses.forEach((h, i) => h.foam.set(c[`pop${i + 1}`] ?? -1));
      giant.visible = (c.loaf ?? 0) > 0.01; giant.scale.setScalar(0.2 + 0.8 * sm(c.loaf ?? 0));
      const ck = cl(c.chalk ?? 0);
      truckG.traverse((o) => { if (o.name === "chalk") ((o as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = ck; });
      const b = sm(c.bulk ?? 0); lL.rotation.z = b * 1.75; lR.rotation.z = -b * 1.75;
      key.rotation.x = Math.sin(t * 5) * 0.25 * (0.3 + b);
      cG.front.visible = (c.cut1 ?? 0) < 0.5; cA.front.visible = true;
      cG.hero.set(cl(c.crockFoam ?? 0), true, cl(c.crockFill ?? 0));
      const ca = c.capAge ?? -1; cG.rack.caps((i) => (ca < 0 ? -1 : ca - (i % 18) * 0.06 - Math.floor(i / 18) * 0.11)); cG.fb.set(ca);
      const wa = c.wifeAge ?? -1; cA.rack.caps((i) => (wa < 0 ? -1 : wa - (i % 18) * 0.035 - Math.floor(i / 18) * 0.05)); cA.fb.set(wa);
      cA.crocks.forEach((k, i) => k.set(cl(wa < 0 ? 0.3 : 0.3 + wa), false)); cG.crocks.forEach((k) => k.set(0.2, false));
      cA.hero.set(0.5 + 0.2 * Math.sin(t * 3), true, 0.9);
      for (const cl2 of [cG, cA]) cl2.bulbL.intensity = 4 * (0.94 + 0.06 * Math.sin(t * 13) * Math.sin(t * 7.3));
    });
  }

  // ---------------- marks, cams, pose ----------------
  const marks: Record<string, V3> = { brewer: BR.BREWER, agentStop: BR.AGENT_STOP, ag1: BR.AG1, ag2: BR.AG2, grocer: BR.GROCER, customer: BR.CUSTOMER, grannyDoor: BR.GRANNY_DOOR, knock: BR.AGENT_KNOCK };
  const cams: SetDef["cams"] = {
    brewLine: { pos: [0.4, 1.55, 6.2], look: [0.0, 1.2, 9.4], fov: 50 },
    brewWide: { pos: [4.8, 3.2, 1.4], look: [-0.5, 1.0, 7.0], fov: 60 },
    grocFront: { pos: [99.6, 1.55, 0.9], look: [100.4, 1.3, 5.5], fov: 55 },
    grocWall: { pos: [100.2, 1.2, 2.2], look: [101.8, 1.6, 6.8], fov: 62 },
    streetDay: { pos: [204, 1.7, -2.5], look: [198, 1.4, 8.0], fov: 55 },
    streetNight: { pos: [204, 1.7, 1.5], look: [197.5, 1.2, 8.0], fov: 52 },
    cellarG: { pos: [197.2, -1.2, 6.9], look: [196.8, -1.5, 11.5], fov: 58 },
    cellarA: { pos: [221.6, -0.7, 9.2], look: [221.0, -1.6, 12.2], fov: 60 },
    aerial: { pos: [214, 16, -14], look: [232, 4, 12], fov: 50 },
  };
  const pose = (t: number, c: Ctl, light = "brew") => { for (const a of anim) a(t, c, light); };
  const sunW = { brew: [-0.75, 0.55, 0.35] as V3, groc: [-0.3, 0.6, -0.75] as V3, stDay: [-0.35, 0.75, -0.55] as V3, stNight: [0.3, 0.75, -0.6] as V3, cellar: [0.3, 0.8, -0.5] as V3 };
  const env = { brew: { hdri: "warm_restaurant", i: 0.45 }, groc: { hdri: "warm_restaurant", i: 0.5 }, stDay: { hdri: "cowboy_town_hall", i: 0.55 }, stNight: { hdri: "rogland_moonlit_night", i: 0.45 }, cellar: { hdri: "warm_restaurant", i: 0.25 } };
  return { name: "beer", root, marks, cams, pose, sunW, env } as SetDef;
};
