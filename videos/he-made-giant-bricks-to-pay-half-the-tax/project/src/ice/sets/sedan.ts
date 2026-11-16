// "He Made Cars Easier to Crush": the cars. One parametric sedan builder from SIDE PROFILES (extruded across the width
// with rounded bevels, real wheel arches, window frames with the glass openings cut as holes), three styles:
//  - "fin"   THE PAPER CAR, a 1959 four-door fintail: cream body, mint roof, small tail fins, chrome. The passenger
//            cell is framed in safety-cage YELLOW (window frames, roof rails, belt + sill rails, door edges), the "steel
//            cage in the middle". The nose is cut into slices of the same profile: `crush` folds them into accordion
//            pleats against the wall (hood peaks, bulging fenders, grille + lamps pushed back) while the yellow cell
//            stays square and the driver's door still opens.
//  - "tank"  THE TANK CAR, the 1950s "safe" car: glossy black, high bulging fenders, a huge chrome grille with teeth, a
//            thick chrome bumper, whitewall tyres, a sun visor. It never crushes (crush is ignored; shake rattles it).
//  - "modern" today's compact hatchback (teal / red) with a short sloping nose that also crumples (the ending).
// Local frame: forward = +z, ground y = 0, origin on the ground midway between the axles. Left-hand drive: the driver
// sits on the car's LEFT = local +x; the driver's door is on +x, hinged at its front edge.
// API: const car = sedan(parent, { style, body?, roof? });
//      car.set({ crush, dent, door, dist, bob, shake, paint, steam, t })   (see Sedan below)
//      car.SEATS { driver, passenger, rear } seat-top marks (local) for sitting cards; car.NOSE bumper z; car.WHEEL,
//      car.DOOR (handle), car.HOOD (front-of-hood point for the palm), car.len
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch } from "../build";
import { ctex } from "../paint";
import { col, shiny, mat, rodGeo, cl, SANS } from "./desertkit";
import { fitText } from "./portkit_common";
import { glow } from "../setkit";
import type { V3 } from "./types";

export const CAGE_YELLOW = "#f2c230";
export type SedanStyle = "fin" | "tank" | "modern";
export type Sedan = {
  g: THREE.Group; len: number; NOSE: number; SEATS: { driver: V3; passenger: V3; rear: V3 }; WHEEL: V3; DOOR: V3; HOOD: V3; W: number;
  /** crush 0..1 nose folded flat (fin/modern) | dent 0..1 palm dent in the hood | door 0..1 driver's door open |
   *  dist metres driven | bob idle bounce | shake impact rattle | paint 0..1 "PAPER CAR" brushed on the door | steam 0..1 */
  set: (o: { crush?: number; dent?: number; door?: number; dist?: number; bob?: number; shake?: number; paint?: number; steam?: number; t?: number }) => void;
};

const glassM = () => mat("sdGlass", () => new THREE.MeshPhongMaterial({ color: "#a8d0ee", specular: "#ffffff", shininess: 140, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
/** door lettering: "PAPER CAR" in red sign-writer's capitals, revealed left to right by k (a brush is doing it) */
const letterTex = (k: number, base: string) => ctex("sdLetter" + Math.round(k * 24) + base, 512, 160, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 160);
  if (k <= 0) return;
  g.save(); g.beginPath(); g.rect(0, 0, 30 + 452 * k, 160); g.clip();
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(60,20,20,0.3)"; fitText(g, "PAPER CAR", 260, 84, 440, 96, SANS);
  g.fillStyle = "#c8352e"; fitText(g, "PAPER CAR", 256, 80, 440, 96, SANS);
  g.fillStyle = "#c8352e"; for (const x of [96, 182, 300, 388]) { g.beginPath(); g.ellipse(x, 124 + (x % 7), 4, 10, 0, 0, 6.3); g.fill(); }
  g.restore();
});
/** extrude a (z, y) outline across the width: the shape's x -> local z, extrusion -> local x (centred) */
const sideExtrude = (pts: [number, number][], width: number, bevel = 0.06, holes: [number, number][][] = []) => {
  const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  for (const h of holes) sh.holes.push(new THREE.Path(h.map(([z, y]) => new THREE.Vector2(z, y))));
  const d = Math.max(0.01, width - 2 * bevel);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 3, curveSegments: 6 });
  geo.rotateY(-Math.PI / 2); geo.translate(d / 2, 0, 0); geo.computeVertexNormals();
  return geo;
};

export const sedan = (parent: THREE.Object3D, o: { style?: SedanStyle; body?: string; roof?: string } = {}): Sedan => {
  const style = o.style ?? "fin";
  const fin = style === "fin", tank = style === "tank", modern = style === "modern";
  const g = new THREE.Group(); parent.add(g);
  const shell = new THREE.Group(); g.add(shell);
  const bodyC = o.body ?? (fin ? "#f0e4c4" : tank ? "#22212b" : "#2a9d9a"), roofC = o.roof ?? (fin ? "#8fd4bc" : tank ? "#22212b" : "#2a9d9a");
  const paintM = shiny("sdBody" + bodyC, bodyC, tank ? 110 : 60), roofM = shiny("sdRoof" + roofC, roofC, 60);
  const cageM = fin ? shiny("sdCage", CAGE_YELLOW, 50) : tank ? shiny("sdTankTrim", "#2c2b36", 90) : shiny("sdModTrim", "#22252e", 60);
  const chrome = shiny("sdChrome", "#eef0f6", 130), dark = col("#2c2834"), tyre = col("#2b2733"), white = col("#f4f1ea");
  const seatM = col(fin ? "#b8352e" : tank ? "#7a3a2a" : "#3a3f4a"), trimM = col(fin ? "#c9b48a" : "#3a3440");
  const b = new Batch();
  const rb = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material, bb = b) => bb.add(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)).translate(x, y, z), m);
  // ---------------- proportions ----------------
  const W = tank ? 1.94 : modern ? 1.8 : 1.82;
  const R = tank ? 0.39 : modern ? 0.34 : 0.36, AX = tank ? 1.5 : modern ? 1.3 : 1.4;
  const CF = modern ? 0.65 : 0.95, CB = modern ? -1.4 : -1.1;          // the cell (cage): front / back z
  const FL = modern ? 1.05 : tank ? 1.6 : 1.55, RL = modern ? 0.55 : tank ? 1.3 : 1.35;
  const NOSE = CF + FL, TAIL = CB - RL;
  const SILL = 0.32, BELT = tank ? 1.0 : modern ? 0.98 : 0.94, ROOF = tank ? 1.56 : modern ? 1.52 : 1.46;
  // body top line y(z) and bottom line (wheel arches)
  const topY = (z: number) => {
    if (z > CF) { const u = (z - CF) / FL; return modern ? BELT - 0.32 * u * u - 0.1 * u : tank ? BELT + 0.02 - 0.1 * u * u : BELT - 0.05 * u - 0.03 * u * u; }
    if (z < CB) { const u = (CB - z) / RL; return modern ? BELT - 0.05 * u : tank ? BELT - 0.06 * u * u - 0.04 * u : BELT - 0.03 * u; }
    return BELT;
  };
  const Ra = R + 0.07;
  const botY = (z: number) => { let y = SILL; for (const ax of [AX, -AX]) { const d = Math.abs(z - ax); if (d < Ra) y = Math.max(y, R + Math.sqrt(Ra * Ra - d * d) * 0.98); } return y; };
  /** outline of the body between za and zb (top line forward, bottom line back), rounded nose / tail caps at the ends */
  const slab = (za: number, zb: number, n = 10, capFront = false, capRear = false): [number, number][] => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) { const z = za + ((zb - za) * i) / n; pts.push([z, topY(z)]); }
    if (capFront) { const yT = topY(zb), yB = Math.max(SILL + 0.04, 0.38); for (let k = 1; k < 6; k++) { const a = (k / 6) * Math.PI / 2; pts.push([zb + 0.08 * Math.sin(a * 2) * 0.5, yT - (yT - yB) * (1 - Math.cos(a))]); } }
    for (let i = n; i >= 0; i--) { const z = za + ((zb - za) * i) / n; pts.push([z, botY(z)]); }
    if (capRear) { const yT = topY(za), yB = SILL + 0.06; for (let k = 5; k > 0; k--) { const a = (k / 6) * Math.PI / 2; pts.push([za - 0.06 * Math.sin(a * 2) * 0.5, yB + (yT - yB) * (1 - Math.cos(a))]); } }
    return pts;
  };
  // ---------------- the cell (cage): floor, passenger side, rear-door section, dash, greenhouse ----------------
  const zB = modern ? -0.35 : -0.12;                                    // B-pillar z (driver's door = zB .. CF)
  b.add(sideExtrude(slab(CB, CF, 8), W, 0.05).scale(1, 1, 1), paintM);  // cell body (full width; the driver's door covers +x)
  // the greenhouse: side window frames (glass openings as holes), roof panel, header + rear bars = THE CAGE
  const zA1 = modern ? CF - 0.95 : CF - 0.5, zC1 = modern ? CB + 0.35 : CB + 0.32, zC0 = modern ? CB - 0.3 : CB - 0.12;
  const yR = ROOF, pw = fin ? 0.085 : 0.07;
  const frameOuter: [number, number][] = [[zC0, BELT], [CF - 0.02, BELT], [zA1, yR], [zC1, yR]];
  const win1: [number, number][] = [[zB + pw / 2, BELT + 0.04], [CF - 0.02 - pw * 1.6, BELT + 0.04], [zA1 - pw * 0.5, yR - pw], [zB + pw / 2, yR - pw]];
  const win2: [number, number][] = [[zC0 + pw * 1.6, BELT + 0.04], [zB - pw / 2, BELT + 0.04], [zB - pw / 2, yR - pw], [zC1 + pw * 0.4, yR - pw]];
  for (const s of [-1, 1]) { const fg = sideExtrude(frameOuter, 0.07, 0.015, [win1, win2]); fg.translate(s * (W / 2 - 0.09), 0, 0); b.add(fg, cageM); }
  b.add(new RoundedBoxGeometry(W - 0.1, 0.07, zA1 - zC1 + 0.12, 3, 0.03).translate(0, yR + 0.02, (zA1 + zC1) / 2), roofM);
  if (fin) for (const s of [-1, 1]) rb(0.08, 0.08, zA1 - zC1 + 0.14, 0.03, s * (W / 2 - 0.08), yR + 0.03, (zA1 + zC1) / 2, cageM);
  b.add(rodGeo([-(W / 2 - 0.09), yR - 0.02, zA1], [W / 2 - 0.09, yR - 0.02, zA1], 0.035), cageM);
  b.add(rodGeo([-(W / 2 - 0.09), yR - 0.02, zC1], [W / 2 - 0.09, yR - 0.02, zC1], 0.035), cageM);
  if (fin) for (const s of [-1, 1]) { rb(0.06, 0.07, CF - CB + 0.02, 0.025, s * (W / 2 + 0.005), SILL + 0.07, (CF + CB) / 2, cageM); rb(0.06, 0.06, CF - CB + 0.02, 0.025, s * (W / 2 + 0.005), BELT - 0.03, (CF + CB) / 2, cageM); }
  // glass
  const gm = glassM();
  const gl = (a: V3, bb: V3, c: V3, d: V3) => { const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...bb, ...c, ...a, ...c, ...d], 3)); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, gm); m.renderOrder = 2; shell.add(m); };
  const gx = W / 2 - 0.1;
  gl([-gx, BELT, CF - 0.04], [gx, BELT, CF - 0.04], [gx, yR - 0.03, zA1], [-gx, yR - 0.03, zA1]);
  gl([-gx, BELT, zC0 + 0.03], [gx, BELT, zC0 + 0.03], [gx, yR - 0.03, zC1], [-gx, yR - 0.03, zC1]);
  for (const s of [-1, 1]) { const x = s * (W / 2 - 0.09); gl([x, BELT, zC0 + 0.05], [x, BELT, CF - 0.05], [x, yR - 0.02, zA1], [x, yR - 0.02, zC1]); }
  // interior: benches, dash, steering wheel (driver +x)
  const DX = 0.42;
  rb(W - 0.34, 0.14, 0.5, 0.06, 0, 0.56, CF - 0.98, seatM); rb(W - 0.34, 0.5, 0.13, 0.06, 0, 0.84, CF - 1.25, seatM);
  if (!modern) { rb(W - 0.34, 0.14, 0.45, 0.06, 0, 0.56, CB + 0.5, seatM); rb(W - 0.34, 0.5, 0.13, 0.06, 0, 0.84, CB + 0.24, seatM); }
  rb(W - 0.22, 0.16, 0.3, 0.05, 0, BELT - 0.02, CF - 0.14, trimM);
  const WHEEL: V3 = [DX, BELT + 0.12, CF - 0.44];
  b.add(new THREE.TorusGeometry(0.18, 0.022, 6, 24).rotateX(-0.5).translate(WHEEL[0], WHEEL[1], WHEEL[2]), dark);
  b.add(rodGeo([DX, BELT - 0.02, CF - 0.2], [DX, WHEEL[1], WHEEL[2] + 0.02], 0.02), dark);
  // ---------------- the tail ----------------
  const rearG = new THREE.Group(); shell.add(rearG);
  { const rb2 = new Batch();
    rb2.add(sideExtrude(slab(TAIL, CB + 0.02, 8, false, true), W, 0.07), paintM);
    if (fin) for (const s of [-1, 1]) { const fp: [number, number][] = [[TAIL + 0.02, topY(TAIL + 0.02) - 0.02], [CB - 0.25, topY(CB - 0.25) - 0.02], [TAIL + 0.12, topY(TAIL) + 0.2], [TAIL + 0.02, topY(TAIL) + 0.16]];
      const fg = sideExtrude(fp, 0.07, 0.02); fg.translate(s * (W / 2 - 0.06), 0, 0); rb2.add(fg, paintM); rb(0.06, 0.2, 0.05, 0.02, s * (W / 2 - 0.06), topY(TAIL) + 0.03, TAIL - 0.02, col("#e8402e"), rb2); }
    else for (const s of [-1, 1]) rb(0.14, 0.12, 0.06, 0.03, s * (W / 2 - 0.14), topY(TAIL) - 0.12, TAIL - 0.04, col("#e8402e"), rb2);
    rb(W + 0.06, 0.12, 0.14, 0.05, 0, 0.42, TAIL - 0.05, modern ? paintM : chrome, rb2);
    rb2.build(rearG); }
  // ---------------- the soft nose: profile slices that fold into pleats ----------------
  const N = modern ? 5 : 6, s0 = FL / N;
  const slices: THREE.Group[] = [];
  for (let i = 0; i < N; i++) {
    const za = CF + i * s0, zb = za + s0, grp = new THREE.Group(); shell.add(grp);
    const sb = new Batch();
    const geo = sideExtrude(slab(za - 0.01, zb + 0.01, 6, i === N - 1, false), W, 0.05); geo.translate(0, 0, -(za + zb) / 2);
    sb.add(geo, paintM);
    if (tank) for (const s of [-1, 1]) { const fz = (za + zb) / 2, fy = topY(fz) - 0.16; rb(0.32, 0.4, s0 + 0.05, 0.15, s * (W / 2 - 0.12), fy, 0, paintM, sb); }
    sb.build(grp);
    grp.position.set(0, 0, (za + zb) / 2); slices.push(grp);
  }
  // the hood dent (hook): a soft dimple card that darkens the hood's front where he presses
  const HOOD: V3 = [0, topY(NOSE - 0.35) + 0.02, NOSE - 0.35];
  // ---------------- the face: grille, bumper, lamps, ornament, plate ----------------
  const face = new THREE.Group(); shell.add(face);
  { const fb = new Batch(), yG = modern ? 0.62 : tank ? 0.7 : 0.64, zf = 0.04;
    if (tank) { rb(1.46, 0.46, 0.1, 0.06, 0, yG, zf, chrome, fb); for (let k = 0; k < 9; k++) rb(0.06, 0.38, 0.1, 0.025, -0.6 + k * 0.15, yG, zf + 0.05, chrome, fb); rb(1.3, 0.05, 0.08, 0.02, 0, yG, zf + 0.06, dark, fb); }
    else if (fin) { rb(1.2, 0.24, 0.06, 0.03, 0, yG + 0.04, zf, chrome, fb); for (let k = 0; k < 4; k++) rb(1.1, 0.022, 0.04, 0.01, 0, yG - 0.04 + k * 0.055, zf + 0.03, dark, fb); }
    else { rb(1.0, 0.13, 0.06, 0.05, 0, yG + 0.14, zf, dark, fb); rb(1.3, 0.2, 0.06, 0.06, 0, yG - 0.12, zf, dark, fb); }
    rb(W + 0.1, tank ? 0.22 : 0.13, 0.17, 0.06, 0, tank ? 0.44 : 0.42, zf + 0.06, modern ? paintM : chrome, fb);
    if (tank) for (const s of [-1, 1]) rb(0.14, 0.2, 0.14, 0.06, s * 0.42, 0.5, zf + 0.15, chrome, fb);
    for (const s of [-1, 1]) {
      if (modern) rb(0.34, 0.09, 0.05, 0.04, s * 0.66, yG + 0.24, zf - 0.03, mat("sdLed", () => new THREE.MeshBasicMaterial({ color: "#f6faff" })), fb);
      else { const lx = s * (tank ? 0.74 : 0.7), ly = yG + (tank ? 0.18 : 0.12); fb.add(new THREE.CylinderGeometry(0.12, 0.13, 0.1, 20).rotateX(Math.PI / 2).translate(lx, ly, zf - 0.02), chrome); fb.add(new THREE.CircleGeometry(0.095, 20).translate(lx, ly, zf + 0.035), mat("sdLens", () => new THREE.MeshBasicMaterial({ color: "#fff4d6" }))); }
    }
    if (!modern) { const yo = topY(NOSE) + 0.02; fb.add(rodGeo([0, yo - 0.04, -0.2], [0, yo + 0.07, -0.08], 0.018), chrome); fb.add(new THREE.SphereGeometry(0.035, 8, 6).translate(0, yo + 0.07, -0.08), chrome); }
    fb.add(new THREE.PlaneGeometry(0.42, 0.11).translate(0, tank ? 0.44 : 0.42, zf + 0.16), mat("sdPlate" + style, () => new THREE.MeshBasicMaterial({ map: ctex("sdPlateT" + style, 256, 64, (gg) => { gg.fillStyle = "#f2e2a0"; gg.fillRect(0, 0, 256, 64); gg.strokeStyle = "#2a2230"; gg.lineWidth = 6; gg.strokeRect(3, 3, 250, 58); gg.fillStyle = "#2a2230"; gg.textAlign = "center"; gg.textBaseline = "middle"; fitText(gg, tank ? "TNK 1955" : modern ? "SAFE 24" : "TEST 59", 128, 34, 220, 44, SANS); }) })));
    fb.build(face);
  }
  // ---------------- the driver's door (+x, hinged at its front edge) ----------------
  const doorPivot = new THREE.Group(); doorPivot.position.set(W / 2 + 0.005, 0, CF - 0.03); shell.add(doorPivot);
  const dLen = CF - 0.03 - zB;
  { const db = new Batch();
    const dp: [number, number][] = [[zB + 0.01, BELT - 0.005], [CF - 0.03, BELT - 0.005], [CF - 0.03, Math.max(SILL + 0.02, botY(CF - 0.03))], [zB + 0.01, SILL + 0.02]];
    const dg = sideExtrude(dp, 0.07, 0.015); dg.translate(0.0, 0, -(CF - 0.03)); db.add(dg, paintM);
    // the door's window frame (part of the cage) rides on the door
    const wf: [number, number][] = [[zB + 0.01, BELT], [CF - 0.05, BELT], [zA1 + 0.02, yR - 0.04], [zB + 0.01, yR - 0.04]];
    const wh: [number, number][] = [[zB + pw * 0.9, BELT + 0.04], [CF - 0.05 - pw * 1.6, BELT + 0.04], [zA1 - pw * 0.4, yR - 0.04 - pw], [zB + pw * 0.9, yR - 0.04 - pw]];
    const wg = sideExtrude(wf, 0.06, 0.012, [wh]); wg.translate(-0.03, 0, -(CF - 0.03)); db.add(wg, cageM);
    if (fin) { rb(0.065, 0.07, dLen, 0.025, 0.02, SILL + 0.07, -dLen / 2, cageM, db); rb(0.065, 0.06, dLen, 0.025, 0.02, BELT - 0.03, -dLen / 2, cageM, db); }
    rb(0.05, 0.03, 0.14, 0.012, 0.05, BELT - 0.12, -dLen + 0.16, chrome, db);
    db.build(doorPivot); }
  const letterPanel = new THREE.Mesh(new THREE.PlaneGeometry(dLen * 0.82, (BELT - SILL) * 0.42), new THREE.MeshBasicMaterial({ map: letterTex(0, bodyC) }));
  letterPanel.rotation.y = Math.PI / 2; letterPanel.position.set(0.06, (BELT + SILL) / 2 - 0.02, -dLen / 2 - 0.02); doorPivot.add(letterPanel); letterPanel.visible = fin;
  b.build(shell);
  // ---------------- wheels ----------------
  const spin: THREE.Group[] = [];
  for (const [x, z] of [[W / 2 - 0.15, AX], [-(W / 2 - 0.15), AX], [W / 2 - 0.15, -AX], [-(W / 2 - 0.15), -AX]] as [number, number][]) {
    const h = new THREE.Group(); h.position.set(x, R, z); g.add(h); const w = new THREE.Group(); h.add(w);
    const wb = new Batch(); wb.add(new THREE.CylinderGeometry(R, R, 0.24, 24).rotateZ(Math.PI / 2), tyre);
    if (!modern) wb.add(new THREE.CylinderGeometry(R * 0.74, R * 0.74, 0.246, 24).rotateZ(Math.PI / 2), white);
    wb.add(new THREE.CylinderGeometry(R * 0.52, R * 0.52, 0.25, 20).rotateZ(Math.PI / 2), modern ? col("#a2a8b4") : chrome);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; wb.add(new THREE.BoxGeometry(0.02, 0.05, 0.05).translate(Math.sign(x) * 0.127, Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3), dark); }
    wb.build(w); spin.push(w);
  }
  g.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh && mm.material !== gm) { m.castShadow = true; m.receiveShadow = true; } });
  const steamG = glow(shell, [0, BELT + 0.15, NOSE - 0.2], "#f6f2ec", 1.0, 0);
  let lastPaint = -1;
  return {
    g, len: NOSE - TAIL, NOSE, W, HOOD,
    SEATS: { driver: [DX, 0.64, CF - 0.98], passenger: [-DX, 0.64, CF - 0.98], rear: [0, 0.64, CB + 0.5] },
    WHEEL, DOOR: [W / 2 + 0.06, BELT - 0.12, zB + 0.16],
    set: ({ crush = 0, dent = 0, door = 0, dist = 0, bob = 0, shake = 0, paint = 0, steam = 0, t = 0 }) => {
      const c = tank ? 0 : cl(crush);
      // accordion: each slice keeps its length s0 but tilts so the zone's projected length shrinks to 35 %
      const L = FL * (1 - 0.65 * c), l = L / N, th = Math.acos(Math.min(1, l / s0));
      for (let i = 0; i < N; i++) {
        const sl = slices[i], sgn = i % 2 ? 1 : -1;
        sl.position.set(0, (s0 / 2) * Math.sin(th * 0.85) + (i % 2 ? 0.03 : 0) * c, CF + (i + 0.5) * l); // lifted so the pleats never dip into the floor
        sl.rotation.set(sgn * th * 0.85, (i % 3 - 1) * 0.07 * c, sgn * 0.035 * c);
        sl.scale.set(1 + 0.06 * c * (i % 2 ? 1 : 0.4), 1 - 0.1 * c * (i / N), 1);
      }
      // the hook dent: the front slice sags under his palm
      if (dent > 0 && c === 0) { for (const [j, w] of [[N - 1, 1], [N - 2, 0.55]] as [number, number][]) { const s = slices[j]; s.scale.y = 1 - 0.16 * w * cl(dent); s.rotation.x = -0.1 * w * cl(dent); s.position.y -= 0.02 * w * cl(dent); } } // a palm-sized sag in the front of the hood
      face.position.set(0, 0.06 * c, CF + L + 0.01); face.rotation.set(-0.24 * c, 0.08 * c, 0.05 * c);
      const sh = shake * Math.sin(t * 60) * 0.012;
      shell.position.y = bob * (0.012 * Math.sin(t * 6.3) + 0.006 * Math.sin(t * 11.1 + 1)) + sh; shell.rotation.x = sh * 0.6;
      doorPivot.rotation.y = 1.15 * cl(door);
      spin.forEach((w) => { w.rotation.x = dist / R; });
      (steamG.material as THREE.SpriteMaterial).opacity = 0.75 * cl(steam) * (0.8 + 0.2 * Math.sin(t * 7));
      steamG.position.set(0, BELT + 0.3 + 0.15 * Math.sin(t * 2), CF + L - 0.15);
      const pq = Math.round(cl(paint) * 24) / 24;
      if (fin && pq !== lastPaint) { lastPaint = pq; const m = letterPanel.material as THREE.MeshBasicMaterial; m.map = letterTex(pq, bodyC); m.needsUpdate = true; }
    },
  };
};
