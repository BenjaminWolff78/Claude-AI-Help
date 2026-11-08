// THE PALACE ("Why He Wanted His Potatoes Stolen"): one long royal hall + a side corridor, used by scene 3 (throne
// room, light `palace`), scene 6 (STAFF ONLY corridor, light `corridor`) and the payoff scene 8 (banquet, light
// `banquet`). Local frame: floor y = 0.
//   Hall x -7..7 (inside faces), z -14 (throne wall) .. 14 (door wall), ceiling 7.5. Cream/rose checker marble floor,
//   red carpet runner x -1.2..1.2 from the dais (z -9.6) to the doors (z 14). Side walls: duck-egg panels over a rose
//   marble wainscot, four tall arched windows each side (z -9, -3, 3, 9; sill 1.2, apex 5.8) onto a formal garden
//   (unlit backdrop), gold velvet curtains tied back, gilt pelmets, sun shafts + dust. Freestanding marble columns
//   (x +-5.2, z -11.5, -6, 0, 6, 11.5) with gilt capitals and wall sconces. Three crystal chandeliers (z -8, 0, 8).
//   * Throne end: 3-step dais (top y 0.6, front edge z -10.8; steps to z -9.6), a gilded throne (seat top y 1.12,
//     z -12.4) under a canopy, a royal-blue fleur-de-lis drape behind it, two banners, a side table with a gold goblet
//     + decanter, two tall candelabra stands.
//   * Banquet end: table x -0.75..0.75, z 3.6..10.4 (cloth top y 0.8), 10 gilded chairs, plates + goblets, four
//     candelabra, three huge potato dishes under silver cloches (ctl dishes), the menu easel (ctl menu), the double
//     doors (x -1.7..1.7, h 4.8) in the end wall onto a golden anteroom (ctl doors).
//   Corridor (a separate room, framed tight): x 17..20.5, z -4 (door wall) .. 4.5, ceiling 3.8, lavender panelled walls,
//   two sconces, an invented landscape painting, a potted palm, a runner rug, the STAFF ONLY door (x 18.2..19.3, h 2.4)
//   with a brass knob; behind it a blinding warm room (ctl door).
// ctl (pose c):
//   dishes 0..1  the three silver cloches lift off one after another (0-0.33 gratin, 0.33-0.66 mash, 0.66-1 roast
//                potatoes): each rises 0.8 m and tips back toward the doors, revealing the food + a steam loop
//   menu   0..1  the easel board turns round from its plain back to the MENU (HACHIS / POTAGE PARMENTIER) face
//   doors  0..1  the hall's double doors swing open (outward, 100 deg) onto the golden anteroom (light pours in)
//   door   0..1  the corridor STAFF ONLY door swings open (away from the camera, 85 deg): the light behind grows to
//                fill a close frame at 1 (spill glow 6.5 m wide at the doorway + a floor light patch)
//   lamps  0..1  chandeliers / candles lit (default 1)
//   clochesGone 0/1 hides the three cloches (after a servant has carried them off)
// The cloche of dish i lifts straight up (0.95 m), then swings out sideways to x = +-1.05 (gratin/roast to +x, mash
// to -x), tilted, at about y = TY + 0.95 = hand height of a servant standing beside the table (marks clocheHand1..3).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { rng } from "../paint";
import { NOINK } from "../ink";
import { glow, shaft, sign } from "../setkit";
import { motes, flameFlick, TAU } from "./innerkit_b";
import { sparkles, sparkle, puff, risePuffs, cl, lerp, sm } from "./portkit_common";
import { seg, lathe, woodTex, marbleTex } from "./hotel";
import {
  checkerTex, wallTex, carpetTex, lysFieldTex, goldVelvetTex, gardenTex, ceilTex, menuTex, clothTex, landscapeTex, lavWallTex, parquetTex,
  gilt, silver, chandelier, candelabra, sconce, banner, curtainGeo, chair, dish,
} from "./palacekit";
import type { SetDef, SetBuilder, V3 } from "./types";

const X0 = -7, X1 = 7, ZB = -14, ZF = 14, H = 7.5, WT = 0.5;
const WINZ = [-9, -3, 3, 9], WW = 2.0, WY0 = 1.2, WY1 = 4.8;
const DOOR = { w: 1.7, h: 4.8 };
const CX0 = 17, CX1 = 20.5, CZ0 = -4, CZ1 = 4.5, CH = 3.8, CDX = 18.75, CDW = 0.55, CDH = 2.4;

export const palace: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch(), r = rng(1786);
  const flames: THREE.Object3D[] = [];
  // ---- materials ----
  const floorM = lam("palFloor", () => ({ map: checkerTex() }));
  const wallM = lam("palWallM", () => ({ map: wallTex() }));
  const ceilM = lam("palCeilM", () => ({ map: ceilTex() }));
  const carpetM = lam("palCarpetM", () => ({ map: carpetTex() }));
  const gold = gilt(), sv = silver();
  const cream = lam("palCream", () => ({ color: "#f4ead6" }));
  const marbleCol = lam("palMarbleCol", () => ({ map: marbleTex("palcol", "#efe6da", "#9a8a90", "rgba(214,196,170,0.35)", 14) }));
  const marbleRose = lam("palMarbleRose", () => ({ map: marbleTex("palrose", "#c98a82", "#f4dcd2", "rgba(130,60,60,0.35)") }));
  const marbleBlue = lam("palMarbleBlue", () => ({ map: marbleTex("palblue", "#3a5a9a", "#d8e2f4", "rgba(20,40,90,0.4)") }));
  const red = lam("palRed", () => ({ color: "#b5203a" }));
  const velvetRed = lam("palVelvetRed", () => ({ color: "#9c1830" }));
  const lysM = lam("palLysM", () => ({ map: lysFieldTex("drape", 3), side: THREE.DoubleSide }));
  const curtM = lam("palCurtM", () => ({ map: goldVelvetTex(), side: THREE.DoubleSide }));
  const wood = lam("palWood", () => ({ map: woodTex("palwood", "#8a4a2a", "#4a2010", "#c8784a") }));
  const clothM = lam("palClothM", () => ({ map: clothTex() }));

  // ---- shell ----
  b.add(quad(V(X0, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(X0, 0, ZB), (X1 - X0) / 1.6, (ZF - ZB) / 1.6), floorM);
  b.add(quad(V(X0, H, ZB), V(X1, H, ZB), V(X1, H, ZF), V(X0, H, ZF), (X1 - X0) / 4, (ZF - ZB) / 4), ceilM);
  const wallShape = (len0: number, len1: number) => { const s = new THREE.Shape(); s.moveTo(len0, 0); s.lineTo(len1, 0); s.lineTo(len1, H); s.lineTo(len0, H); s.closePath(); return s; };
  const archHole = (c: number, w: number, y0: number, y1: number) => { const p = new THREE.Path(); p.moveTo(c - w / 2, y0); p.lineTo(c + w / 2, y0); p.lineTo(c + w / 2, y1); p.absarc(c, y1, w / 2, 0, Math.PI, false); p.lineTo(c - w / 2, y0); return p; };
  const extrude = (s: THREE.Shape) => {
    const geo = new THREE.ExtrudeGeometry(s, { depth: WT, bevelEnabled: false, curveSegments: 28 });
    const p = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 4, p.getY(i) / H);
    return geo;
  };
  // side walls (shape x = world z), extruded outward
  for (const side of [-1, 1]) {
    const s = wallShape(ZB, ZF); for (const z of WINZ) s.holes.push(archHole(z, WW, WY0, WY1));
    const geo = extrude(s); geo.rotateY(-Math.PI / 2); geo.translate(side < 0 ? X0 : X1 + WT, 0, 0);
    const m = new THREE.Mesh(geo, wallM); m.receiveShadow = true; m.castShadow = true; root.add(m);
  }
  // throne wall (plain) + door wall (double door hole)
  { const s = wallShape(X0 - WT, X1 + WT); const geo = extrude(s); geo.translate(0, 0, ZB - WT); const m = new THREE.Mesh(geo, wallM); m.receiveShadow = true; root.add(m); }
  // wall faces with the texture mapped in metres (u = x / uw, v = y / vh); dir = +1 faces +z, -1 faces -z
  const faceZ = (x0: number, x1: number, y0: number, y1: number, z: number, dir: number, m: THREE.Material, uw: number, vh: number) =>
    b.add(dir > 0 ? quad(V(x0, y0, z), V(x1, y0, z), V(x1, y1, z), V(x0, y1, z), x1 / uw, y1 / vh, x0 / uw, y0 / vh) : quad(V(x1, y0, z), V(x0, y0, z), V(x0, y1, z), V(x1, y1, z), x0 / uw, y1 / vh, x1 / uw, y0 / vh), m);
  for (const [x0, x1] of [[X0, -DOOR.w], [DOOR.w, X1]]) { faceZ(x0, x1, 0, H, ZF, -1, wallM, 4, H); b.add(boxGeo(V(x0 - (x0 === X0 ? WT : 0), 0, ZF + 0.02), V(x1 + (x1 === X1 ? WT : 0), H, ZF + WT)), cream); }
  faceZ(-DOOR.w, DOOR.w, DOOR.h, H, ZF, -1, wallM, 4, H); b.add(boxGeo(V(-DOOR.w, DOOR.h, ZF + 0.02), V(DOOR.w, H, ZF + WT)), cream);
  // cornice + skirting all round
  const ring = (y0: number, y1: number, out: number, m: THREE.Material) => {
    b.add(boxGeo(V(X0, y0, ZB), V(X1, y1, ZB + out)), m); b.add(boxGeo(V(X0, y0, ZF - out), V(X1, y1, ZF)), m);
    b.add(boxGeo(V(X0, y0, ZB), V(X0 + out, y1, ZF)), m); b.add(boxGeo(V(X1 - out, y0, ZB), V(X1, y1, ZF)), m);
  };
  ring(H - 0.35, H, 0.3, cream); ring(H - 0.5, H - 0.35, 0.18, gold); ring(H - 0.6, H - 0.5, 0.1, cream); ring(0, 0.16, 0.05, marbleRose);

  // ---- windows: reveals, frames, glazing bars, garden backdrop, curtains, pelmets, sun shafts ----
  const garden = new THREE.MeshBasicMaterial({ map: gardenTex(), color: new THREE.Color(0.97, 0.97, 0.97), fog: false });
  const glassM = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending });
  const shafts: THREE.Mesh[] = [];
  for (const side of [-1, 1]) for (const z of WINZ) {
    const xw = side < 0 ? X0 - WT * 0.5 : X1 + WT * 0.5, hw = WW / 2, inner = side < 0 ? X0 : X1;
    // frame + bars
    for (const s2 of [-1, 1]) b.add(boxGeo(V(xw - 0.05, WY0, z + s2 * hw - (s2 > 0 ? 0.08 : 0)), V(xw + 0.05, WY1, z + s2 * hw + (s2 < 0 ? 0.08 : 0))), cream);
    b.add(boxGeo(V(xw - 0.05, WY0, z - hw), V(xw + 0.05, WY0 + 0.1, z + hw)), cream);
    b.add(boxGeo(V(xw - 0.03, WY0, z - 0.04), V(xw + 0.03, WY1 + hw, z + 0.04)), cream);
    for (let y = WY0 + 0.7; y < WY1; y += 0.7) b.add(boxGeo(V(xw - 0.025, y - 0.02, z - hw), V(xw + 0.025, y + 0.02, z + hw)), cream);
    for (let k = 1; k < 6; k++) { const a = (k / 6) * Math.PI; seg(b, V(xw, WY1, z), V(xw, WY1 + Math.sin(a) * (hw - 0.04), z + Math.cos(a) * (hw - 0.04)), 0.02, cream, 5); }
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(WW, WY1 - WY0 + hw), glassM); gl.position.set(xw, (WY0 + WY1 + hw) / 2, z); gl.rotation.y = side * -Math.PI / 2; gl.layers.set(NOINK); root.add(gl);
    // gilt architrave on the room side
    b.add(new THREE.TorusGeometry(hw + 0.08, 0.07, 6, 28, Math.PI).rotateY(Math.PI / 2).translate(inner + side * -0.03, WY1, z), gold);
    for (const s2 of [-1, 1]) b.add(boxGeo(V(inner - 0.08, WY0 - 0.05, z + s2 * (hw + 0.08) - 0.07), V(inner + 0.08, WY1, z + s2 * (hw + 0.08) + 0.07)), gold);
    b.add(boxGeo(V(inner - 0.12, WY0 - 0.12, z - hw - 0.2), V(inner + 0.12, WY0, z + hw + 0.2)), marbleRose);
    // garden backdrop (unlit) 3 m outside
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), garden); bd.position.set(side < 0 ? X0 - 4 : X1 + 4, 3.2, z); bd.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; root.add(bd);
    // curtains tied back + pelmet
    for (const s2 of [-1, 1]) {
      const c = new THREE.Mesh(curtainGeo(1.0, 5.6, 4, 0.07, 0.42), curtM); c.position.set(inner - side * 0.18, 6.6, z + s2 * (hw + 0.45)); c.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      if (side * s2 > 0) c.scale.x = -1;
      c.castShadow = true; c.receiveShadow = true; root.add(c);
      b.add(new THREE.SphereGeometry(0.09, 10, 8).translate(inner - side * 0.25, 2.9, z + s2 * (hw + 0.4)), gold);
    }
    b.add(boxGeo(V(inner - side * 0.02 - 0.18, 6.4, z - hw - 1.0), V(inner - side * 0.02 + 0.18, 6.8, z + hw + 1.0)), gold);
    // sun shaft from the window onto the floor (toward the room centre)
    const sh = shaft(root, [inner, 4.6, z], [inner - side * 3.6, 0.05, z + 1.2], 1.9, "#fff0c8", 0.14); shafts.push(sh);
  }
  const dust = motes(root, [X0 + 0.5, 0.4, ZB + 2], [X1 - 0.5, 5.5, ZF - 2], 260, "#fff4d8", 0.035, 0.6, 3);

  // ---- columns with sconces ----
  const column = (x: number, z: number) => {
    b.add(boxGeo(V(x - 0.42, 0, z - 0.42), V(x + 0.42, 0.5, z + 0.42)), marbleRose);
    b.add(new THREE.CylinderGeometry(0.36, 0.38, 0.12, 28).translate(x, 0.56, z), gold);
    b.add(new THREE.CylinderGeometry(0.29, 0.31, 5.3, 28).translate(x, 0.62 + 2.65, z), marbleCol);
    b.add(new THREE.TorusGeometry(0.31, 0.03, 6, 28).rotateX(Math.PI / 2).translate(x, 0.66, z), gold);
    b.add(new THREE.TorusGeometry(0.3, 0.03, 6, 28).rotateX(Math.PI / 2).translate(x, 5.85, z), gold);
    b.add(new THREE.CylinderGeometry(0.44, 0.29, 0.42, 28).translate(x, 6.12, z), gold);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; b.add(new THREE.SphereGeometry(0.08, 8, 6).scale(1, 1.4, 0.6).translate(x + Math.cos(a) * 0.36, 6.2, z + Math.sin(a) * 0.36), gold); }
    b.add(boxGeo(V(x - 0.5, 6.33, z - 0.5), V(x + 0.5, 6.48, z + 0.5)), gold);
    flames.push(...sconce(root, [x - Math.sign(x) * 0.3, 2.7, z], Math.sign(x) < 0 ? Math.PI / 2 : -Math.PI / 2, 3));
  };
  for (const z of [-11.5, -6, 0, 6, 11.5]) { column(-5.2, z); column(5.2, z); }

  // ---- carpet runner + dais ----
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 23.6).rotateX(-Math.PI / 2), carpetM); carpet.position.set(0, 0.012, (-9.6 + ZF) / 2); carpet.receiveShadow = true; root.add(carpet);
  (carpetM.map as THREE.Texture).repeat.set(1, 2.1);
  const steps = [{ y: 0.2, z: -9.6, w: 3.4 }, { y: 0.4, z: -10.2, w: 3.0 }, { y: 0.6, z: -10.8, w: 2.6 }];
  for (const s of steps) {
    b.add(boxGeo(V(-s.w, s.y - 0.2, ZB), V(s.w, s.y, s.z)), marbleBlue);
    b.add(boxGeo(V(-s.w - 0.02, s.y - 0.03, s.z - 0.04), V(s.w + 0.02, s.y + 0.01, s.z + 0.02)), gold);
    b.add(boxGeo(V(-1.2, s.y, s.z - 0.6), V(1.2, s.y + 0.012, s.z)), red);
    b.add(boxGeo(V(-1.2, s.y - 0.2, s.z), V(1.2, s.y, s.z + 0.012)), red);
  }
  // drape behind the throne + canopy
  const drape = new THREE.Mesh(curtainGeo(6.2, 6.2, 9, 0.06), lysM); drape.position.set(0, 6.9, ZB + 0.25); drape.receiveShadow = true; root.add(drape);
  b.add(boxGeo(V(-3.4, 6.6, ZB), V(3.4, 7.1, ZB + 0.5)), gold);
  b.add(boxGeo(V(-1.6, 5.1, ZB), V(1.6, 5.45, -11.4)), gold);
  b.add(boxGeo(V(-1.55, 4.95, -11.48), V(1.55, 5.1, -11.4)), velvetRed);
  for (let x = -1.5; x <= 1.5; x += 0.12) b.add(new THREE.ConeGeometry(0.035, 0.12, 5).rotateX(Math.PI).translate(x, 4.89, -11.42), gold);
  for (const d of [-1, 1]) { const c = new THREE.Mesh(curtainGeo(0.9, 4.4, 3, 0.06, 0.55), curtM); c.position.set(d * 1.45, 5.05, -11.6); if (d > 0) c.scale.x = -1; c.castShadow = true; root.add(c); }
  // the throne (seat top y 1.12, front edge z -12.0)
  {
    const tb = new Batch(), y0 = 0.6, z0 = -12.4;
    tb.add(boxGeo(V(-0.62, y0, z0 - 0.45), V(0.62, y0 + 0.46, z0 + 0.42)), gold);
    tb.add(boxGeo(V(-0.52, y0 + 0.46, z0 - 0.38), V(0.52, y0 + 0.54, z0 + 0.4)), velvetRed);
    tb.add(boxGeo(V(-0.6, y0 + 0.5, z0 - 0.5), V(0.6, y0 + 2.9, z0 - 0.36)), gold);
    tb.add(boxGeo(V(-0.48, y0 + 0.62, z0 - 0.37), V(0.48, y0 + 2.7, z0 - 0.33)), velvetRed);
    tb.add(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 28, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(0, y0 + 2.9, z0 - 0.43), gold);
    for (const d of [-1, 1]) {
      tb.add(boxGeo(V(d * 0.62 - 0.08, y0 + 0.46, z0 - 0.45), V(d * 0.62 + 0.08, y0 + 0.86, z0 + 0.42)), gold);
      tb.add(new THREE.SphereGeometry(0.11, 12, 10).translate(d * 0.62, y0 + 0.9, z0 + 0.4), gold);
      tb.add(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 10).translate(d * 0.62, y0 + 3.1, z0 - 0.43), gold);
      tb.add(new THREE.SphereGeometry(0.1, 12, 10).translate(d * 0.62, y0 + 3.32, z0 - 0.43), gold);
      tb.add(new THREE.CylinderGeometry(0.07, 0.09, 0.46, 10).translate(d * 0.55, y0 + 0.23, z0 + 0.36), gold);
    }
    // crown finial
    tb.add(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 16).translate(0, y0 + 3.6, z0 - 0.43), gold);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; tb.add(new THREE.ConeGeometry(0.05, 0.18, 6).translate(Math.cos(a) * 0.22, y0 + 3.78, z0 - 0.43 + Math.sin(a) * 0.22), gold); }
    tb.add(new THREE.SphereGeometry(0.06, 10, 8).translate(0, y0 + 3.82, z0 - 0.43), red);
    tb.add(boxGeo(V(-0.4, y0, z0 + 0.42), V(0.4, y0 + 0.14, z0 + 0.8)), velvetRed); // foot stool
    tb.build(root);
  }
  // banners on the throne wall + candelabra stands + side table with goblet and decanter
  for (const d of [-1, 1]) banner(root, [d * 4.6, 6.3, ZB + 0.3], 0, 1.3, 3.4);
  for (const d of [-1, 1]) banner(root, [d * 3.7, 6.3, ZF - 0.3], Math.PI, 1.3, 3.4);
  for (const d of [-1, 1]) {
    const x = d * 2.1, z = -10.6;
    b.add(lathe([[0, 0], [0.22, 0], [0.24, 0.05], [0.08, 0.12], [0.05, 1.4], [0.1, 1.46], [0.16, 1.5], [0, 1.52]], 18).translate(x, 0.6, z), gold);
    flames.push(...candelabra(root, [x, 2.12, z], 1.3, 2.5));
  }
  {
    const x = 1.55, z = -11.6, y = 0.6;
    b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 24).translate(x, y + 0.74, z), marbleRose);
    b.add(lathe([[0, 0], [0.2, 0], [0.12, 0.08], [0.05, 0.6], [0.12, 0.72], [0, 0.72]], 14).translate(x, y, z), gold);
    b.add(lathe([[0, 0], [0.06, 0], [0.03, 0.02], [0.015, 0.12], [0.06, 0.16], [0.07, 0.26], [0, 0.25]], 16).translate(x - 0.1, y + 0.76, z), gold);
    b.add(lathe([[0, 0], [0.09, 0.01], [0.11, 0.12], [0.05, 0.26], [0.03, 0.36], [0.04, 0.4], [0, 0.4]], 16).translate(x + 0.12, y + 0.76, z - 0.05), lam("palDecanter", () => ({ color: "#a8304a" })));
    b.add(new THREE.SphereGeometry(0.06, 10, 8).translate(x + 0.02, y + 0.82, z + 0.15), lam("palGrape", () => ({ color: "#6a3a8a" })));
  }

  // ---- chandeliers ----
  const chans = [-8, 0, 8].map((z) => chandelier(root, 0, z, H - 0.02, 1.05, 2.1, 22, 18));
  const chanSpark = chans.map((c, i) => sparkles(c.g, 18, [0, -2.9, 0], 1.8, 1.2, 1.8, 20 + i, 0.24));

  // ---- banquet table, chairs, settings, candelabra ----
  const TZ0 = 3.6, TZ1 = 10.4, TY = 0.8;
  for (const [x, z] of [[-0.62, TZ0 + 0.2], [0.62, TZ0 + 0.2], [-0.62, TZ1 - 0.2], [0.62, TZ1 - 0.2], [-0.62, 7], [0.62, 7]]) b.add(lathe([[0, 0], [0.06, 0], [0.04, 0.1], [0.05, 0.4], [0.03, 0.7], [0, 0.7]], 10).translate(x, 0, z), gold);
  b.add(boxGeo(V(-0.78, TY - 0.06, TZ0 - 0.03), V(0.78, TY, TZ1 + 0.03)), clothM);
  for (const d of [-1, 1]) b.add(quad(V(d * 0.78, TY - 0.06, d > 0 ? TZ0 : TZ1), V(d * 0.78, TY - 0.06, d > 0 ? TZ1 : TZ0), V(d * 0.8, 0.22, d > 0 ? TZ1 : TZ0), V(d * 0.8, 0.22, d > 0 ? TZ0 : TZ1), 6, 1), clothM);
  for (const z of [TZ0 - 0.03, TZ1 + 0.03]) b.add(boxGeo(V(-0.79, 0.24, z - 0.01), V(0.79, TY - 0.06, z + 0.01)), clothM);
  for (const d of [-1, 1]) b.add(boxGeo(V(d * 0.8 - 0.01, 0.2, TZ0), V(d * 0.8 + 0.01, 0.26, TZ1)), gold);
  const chairsB = new Batch();
  for (const z of [4.4, 5.6, 6.8, 8.0, 9.2]) {
    chair(chairsB, [-1.2, 0, z], Math.PI / 2, velvetRed); chair(chairsB, [1.2, 0, z], -Math.PI / 2, velvetRed);
    for (const d of [-1, 1]) {
      b.add(new THREE.CylinderGeometry(0.15, 0.13, 0.015, 24).translate(d * 0.5, TY + 0.008, z), sv);
      b.add(lathe([[0, 0], [0.05, 0], [0.012, 0.02], [0.01, 0.12], [0.05, 0.16], [0.055, 0.24], [0, 0.23]], 14).translate(d * 0.5, TY, z + 0.2), gold);
      b.add(boxGeo(V(d * 0.5 - 0.012, TY, z - 0.25), V(d * 0.5 + 0.012, TY + 0.006, z - 0.17)), sv);
    }
  }
  chairsB.build(root);
  for (const z of [4.4, 6.15, 7.75, 9.6]) flames.push(...candelabra(root, [0, TY, z], 1.05, 1.8));
  // fruit bowls at the two ends
  for (const z of [3.9, 10.1]) {
    b.add(lathe([[0, 0], [0.08, 0], [0.04, 0.06], [0.24, 0.14], [0.26, 0.17], [0, 0.12]], 18).translate(0, TY, z), gold);
    for (let i = 0; i < 9; i++) { const a = i * 2.3, rr = i < 6 ? 0.15 : 0.06; b.add(new THREE.SphereGeometry(0.06, 10, 8).translate(Math.cos(a) * rr, TY + 0.18 + (i < 6 ? 0 : 0.07), z + Math.sin(a) * rr), lam("palFruit" + (i % 3), () => ({ color: ["#e85a3a", "#f2c84a", "#7ab84a"][i % 3] }))); }
  }
  const dishes = [dish(root, [0, TY, 5.25], "gratin", 1.1), dish(root, [0, TY, 6.95], "mash", 1.15), dish(root, [0, TY, 8.6], "roast", 1.1)];
  const steams = dishes.map((d, i) => Array.from({ length: 4 }, (_, k) => puff(root, [d.g.position.x + (k - 1.5) * 0.12, TY + 0.4, d.g.position.z], 0.45, "#fbf6ee", 0.55)).map((m) => { m.userData.dish = i; return m; }));

  // ---- the menu easel (front faces -z toward the throne end) ----
  const EAS: V3 = [2.55, 0, 1.6];
  const easel = new THREE.Group(); easel.position.set(...EAS); easel.rotation.y = Math.PI + 0.35; root.add(easel);
  { const eb = new Batch();
    seg(eb, V(-0.45, 0, 0.12), V(-0.08, 2.4, 0), 0.03, gold, 6); seg(eb, V(0.45, 0, 0.12), V(0.08, 2.4, 0), 0.03, gold, 6); seg(eb, V(0, 0, -0.55), V(0, 2.3, -0.02), 0.03, gold, 6);
    eb.add(boxGeo(V(-0.6, 0.86, 0.04), V(0.6, 0.92, 0.2)), gold); eb.build(easel); }
  const board = new THREE.Group(); board.position.set(0, 1.62, 0.12); easel.add(board);
  { const bb = new Batch(); bb.add(boxGeo(V(-0.58, -0.7, -0.03), V(0.58, 0.7, 0.03)), wood); bb.add(boxGeo(V(-0.62, -0.74, 0.02), V(0.62, -0.68, 0.06)), gold); bb.add(boxGeo(V(-0.62, 0.68, 0.02), V(0.62, 0.74, 0.06)), gold);
    for (const d of [-1, 1]) bb.add(boxGeo(V(d * 0.6 - 0.04, -0.74, 0.02), V(d * 0.6 + 0.04, 0.74, 0.06)), gold); bb.build(board);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.36), new THREE.MeshBasicMaterial({ map: menuTex(), toneMapped: true })); face.position.z = 0.062; board.add(face); }

  // ---- double doors + golden anteroom ----
  b.add(boxGeo(V(-DOOR.w - 0.25, 0, ZF - 0.12), V(-DOOR.w, DOOR.h + 0.25, ZF)), gold); b.add(boxGeo(V(DOOR.w, 0, ZF - 0.12), V(DOOR.w + 0.25, DOOR.h + 0.25, ZF)), gold);
  b.add(boxGeo(V(-DOOR.w - 0.3, DOOR.h, ZF - 0.16), V(DOOR.w + 0.3, DOOR.h + 0.3, ZF)), gold);
  b.add(new THREE.ConeGeometry(2.3, 0.7, 3, 1).rotateZ(0).scale(1, 1, 0.08).translate(0, DOOR.h + 0.65, ZF - 0.1), gold);
  const leafM = lam("palLeaf", () => ({ map: woodTex("palleaf", "#f2e8d4", "#c8b48a", "#ffffff") }));
  const leaves = [-1, 1].map((d) => {
    const g = new THREE.Group(); g.position.set(d * DOOR.w, 0, ZF + 0.25); root.add(g); const lb = new Batch(), w = DOOR.w;
    lb.add(boxGeo(V(d < 0 ? 0 : -w, 0, -0.05), V(d < 0 ? w : 0, DOOR.h, 0.05)), leafM);
    for (const [y0, y1] of [[0.3, 2.0], [2.3, 4.5]]) { const x0 = d < 0 ? 0.2 : -w + 0.2, x1 = d < 0 ? w - 0.2 : -0.2; for (const [a, c] of [[V(x0, y0, -0.07), V(x1, y0 + 0.05, -0.05)], [V(x0, y1 - 0.05, -0.07), V(x1, y1, -0.05)], [V(x0, y0, -0.07), V(x0 + 0.05, y1, -0.05)], [V(x1 - 0.05, y0, -0.07), V(x1, y1, -0.05)]]) lb.add(boxGeo(a, c), gold); }
    lb.add(new THREE.SphereGeometry(0.06, 10, 8).translate(d < 0 ? w - 0.15 : -w + 0.15, 1.3, -0.08), gold);
    lb.build(g); return g;
  });
  const ante = new THREE.Mesh(new THREE.PlaneGeometry(5, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.05, 0.55), fog: false })); ante.position.set(0, 3, ZF + 3.5); ante.rotation.y = Math.PI; root.add(ante);
  b.add(quad(V(-2.5, 0, ZF + 0.5), V(2.5, 0, ZF + 0.5), V(2.5, 0, ZF + 3.5), V(-2.5, 0, ZF + 3.5), 3, 2), floorM);
  const anteGlow = glow(root, [0, 2.2, ZF + 0.6], "#ffd28a", 5, 0.0);
  const anteL = new THREE.PointLight("#ffcf8a", 0, 14, 1.2); anteL.position.set(0, 2.4, ZF - 0.4); root.add(anteL);

  // ---- corridor (separate tight room) ----
  const lavM = lam("palLav", () => ({ map: lavWallTex() })), parqM = lam("palParq", () => ({ map: parquetTex() })), corCeil = lam("palCorCeil", () => ({ color: "#efe6f2" }));
  b.add(quad(V(CX0, 0, CZ1), V(CX1, 0, CZ1), V(CX1, 0, CZ0), V(CX0, 0, CZ0), (CX1 - CX0) / 1.6, (CZ1 - CZ0) / 1.6), parqM);
  b.add(quad(V(CX0, CH, CZ0), V(CX1, CH, CZ0), V(CX1, CH, CZ1), V(CX0, CH, CZ1), 2, 4), corCeil);
  b.add(quad(V(CX0, 0, CZ1), V(CX0, 0, CZ0), V(CX0, CH, CZ0), V(CX0, CH, CZ1), (CZ1 - CZ0) / 3, CH / 3.8), lavM);
  b.add(quad(V(CX1, 0, CZ0), V(CX1, 0, CZ1), V(CX1, CH, CZ1), V(CX1, CH, CZ0), (CZ1 - CZ0) / 3, CH / 3.8), lavM);
  b.add(quad(V(CX1, 0, CZ1), V(CX0, 0, CZ1), V(CX0, CH, CZ1), V(CX1, CH, CZ1), 1.2, 1), lavM);
  for (const [x0, x1] of [[CX0, CDX - CDW], [CDX + CDW, CX1]]) { faceZ(x0, x1, 0, CH, CZ0, 1, lavM, 3, CH); b.add(boxGeo(V(x0, 0, CZ0 - 0.2), V(x1, CH, CZ0 - 0.02)), cream); }
  faceZ(CDX - CDW, CDX + CDW, CDH, CH, CZ0, 1, lavM, 3, CH); b.add(boxGeo(V(CDX - CDW, CDH, CZ0 - 0.2), V(CDX + CDW, CH, CZ0 - 0.02)), cream);
  // cornice + skirting + door casing
  for (const [a, c] of [[V(CX0, CH - 0.2, CZ0), V(CX0 + 0.16, CH, CZ1)], [V(CX1 - 0.16, CH - 0.2, CZ0), V(CX1, CH, CZ1)], [V(CX0, CH - 0.2, CZ0), V(CX1, CH, CZ0 + 0.16)]]) b.add(boxGeo(a, c), cream);
  for (const [a, c] of [[V(CX0, 0, CZ0), V(CX0 + 0.04, 0.15, CZ1)], [V(CX1 - 0.04, 0, CZ0), V(CX1, 0.15, CZ1)]]) b.add(boxGeo(a, c), cream);
  b.add(boxGeo(V(CDX - CDW - 0.14, 0, CZ0), V(CDX - CDW, CDH + 0.14, CZ0 + 0.06)), cream); b.add(boxGeo(V(CDX + CDW, 0, CZ0), V(CDX + CDW + 0.14, CDH + 0.14, CZ0 + 0.06)), cream);
  b.add(boxGeo(V(CDX - CDW - 0.2, CDH + 0.1, CZ0), V(CDX + CDW + 0.2, CDH + 0.26, CZ0 + 0.1)), cream);
  const doorM = lam("palCorDoor", () => ({ map: woodTex("palcordoor", "#7a4426", "#3e1e0e", "#b86a3e") }));
  const cdoor = new THREE.Group(); cdoor.position.set(CDX - CDW, 0, CZ0 - 0.06); root.add(cdoor);
  { const db = new Batch(); db.add(boxGeo(V(0, 0, -0.04), V(2 * CDW, CDH, 0.04)), doorM);
    for (const [y0, y1] of [[0.25, 1.05], [1.35, 2.2]]) { for (const [a, c] of [[V(0.14, y0, 0.03), V(2 * CDW - 0.14, y0 + 0.04, 0.06)], [V(0.14, y1 - 0.04, 0.03), V(2 * CDW - 0.14, y1, 0.06)], [V(0.14, y0, 0.03), V(0.18, y1, 0.06)], [V(2 * CDW - 0.18, y0, 0.03), V(2 * CDW - 0.14, y1, 0.06)]]) db.add(boxGeo(a, c), lam("palCorDoorD", () => ({ color: "#5a2e16" }))); }
    db.add(new THREE.SphereGeometry(0.045, 12, 10).translate(2 * CDW - 0.12, 1.0, 0.08), gilt()); db.add(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10).rotateX(Math.PI / 2).translate(2 * CDW - 0.12, 1.0, 0.05), gilt());
    db.add(boxGeo(V(2 * CDW - 0.17, 0.82, 0.04), V(2 * CDW - 0.07, 1.12, 0.055)), gilt());
    db.build(cdoor);
    sign(cdoor, "STAFF ONLY", 0.72, 0.2, [CDW, 1.6, 0.08], 0, "#f6ead0", "#4a1e10"); }
  // the blinding room behind the door
  const behind = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 3.3, 1.9), fog: false })); behind.position.set(CDX, 1.8, CZ0 - 1.4); root.add(behind);
  const spill = glow(root, [CDX, 1.25, CZ0 + 0.1], "#ffd890", 1, 1.6);
  const patchM = new THREE.MeshBasicMaterial({ color: "#ffd89a", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1).rotateX(-Math.PI / 2), patchM); patch.position.set(CDX, 0.02, CZ0 + 0.5); patch.layers.set(NOINK); root.add(patch);
  const doorL = new THREE.PointLight("#ffd89a", 0, 9, 1.2); doorL.position.set(CDX, 1.3, CZ0 + 0.3); root.add(doorL);
  // dressing: sconces, painting, palm, rug, bench, side table with a vase
  for (const z of [-1.8, 2.2]) { flames.push(...sconce(root, [CX0 + 0.08, 2.15, z], Math.PI / 2, 3)); flames.push(...sconce(root, [CX1 - 0.08, 2.15, z], -Math.PI / 2, 3)); }
  { const pf = new THREE.Group(); pf.position.set(CX0 + 0.06, 2.0, 0.3); pf.rotation.y = Math.PI / 2; root.add(pf);
    const fb = new Batch(); fb.add(boxGeo(V(-0.78, -0.58, 0), V(0.78, 0.58, 0.07)), gold); fb.build(pf);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.0), lam("palLandM", () => ({ map: landscapeTex() }))); pic.position.z = 0.075; pf.add(pic); }
  { const x = CX1 - 0.5, z = CZ0 + 0.55; b.add(lathe([[0, 0], [0.22, 0], [0.3, 0.45], [0.26, 0.5], [0, 0.5]], 16).translate(x, 0, z), lam("palPot", () => ({ color: "#3a6ab0" })));
    b.add(lathe([[0, 0], [0.31, 0], [0.33, 0.06], [0, 0.06]], 16).translate(x, 0.46, z), gold);
    const leafM = lam("palPalmLeaf", () => ({ color: "#4f9a3a", side: THREE.DoubleSide }));
    for (let i = 0; i < 9; i++) { const a = i * 0.7, L = 0.8 + 0.3 * ((i * 7) % 3); const lg = new THREE.PlaneGeometry(0.2, L).translate(0, L / 2, 0).rotateX(-0.9 + 0.1 * (i % 3)).rotateY(a); lg.translate(x, 0.5, z); b.add(lg, leafM); } }
  { const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 7.4).rotateX(-Math.PI / 2), lam("palRunner", () => ({ map: carpetTex() }))); rug.position.set(CDX, 0.01, 0.6); rug.receiveShadow = true; root.add(rug); }
  { const x = CX0 + 0.35, z = -2.9; b.add(boxGeo(V(x - 0.25, 0.72, z - 0.4), V(x + 0.25, 0.76, z + 0.4)), marbleRose);
    for (const [dx, dz] of [[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.35], [0.2, 0.35]]) b.add(new THREE.CylinderGeometry(0.02, 0.015, 0.72, 8).translate(x + dx, 0.36, z + dz), gold);
    b.add(lathe([[0, 0], [0.08, 0], [0.12, 0.16], [0.06, 0.3], [0.09, 0.36], [0, 0.36]], 14).translate(x, 0.76, z), lam("palVase", () => ({ color: "#f2f0f8" })));
    for (let i = 0; i < 5; i++) b.add(new THREE.SphereGeometry(0.06, 8, 6).translate(x + Math.cos(i * 1.3) * 0.08, 1.2 + (i % 2) * 0.06, z + Math.sin(i * 1.3) * 0.08), lam("palFlower", () => ({ color: "#f07aa8" }))); }

  b.build(root);
  void r; void sm;

  const marks: Record<string, V3> = {
    king: [0, 1.12, -12.15], heroThrone: [0, 0, -8.55], guardL: [-3.3, 0, -10.0], guardR: [3.3, 0, -10.0],
    kingBanquet: [-0.5, 0, 2.5], heroBanquet: [0.5, 0, 2.5],
    noble1: [-1.75, 0, 2.1], noble2: [1.75, 0, 2.1], noble3: [-2.1, 0, 3.4], noble4: [2.1, 0, 3.4], lady: [-1.15, 0, 1.25],
    servant1: [-0.8, 0, 13.3], servant2: [0.8, 0, 13.3], servant1End: [-1.45, 0, 7.6], servant2End: [1.45, 0, 6.3],
    menu: EAS, clocheHand1: [1.05, 1.75, 5.25], clocheHand2: [-1.05, 1.75, 6.95], clocheHand3: [1.05, 1.75, 8.6],
    servantDish1: [1.55, 0, 5.25], servantDish2: [-1.55, 0, 6.95], servantDish3: [1.55, 0, 8.6],
    ladyDoor: [CDX, 0, CZ0 + 0.55], ladyStart: [CDX - 0.2, 0, CZ0 + 3.5],
  };
  const cams: SetDef["cams"] = {
    throne: { pos: [1.9, 2.1, -3.2], look: [0, 1.6, -11.2], fov: 40 },
    throneKing: { pos: [0.9, 2.05, -9.0], look: [0, 1.9, -12.2], fov: 38 },
    throneHero: { pos: [-2.6, 1.7, -5.6], look: [0.4, 1.35, -9.4], fov: 40 },
    banquet: { pos: [0.9, 2.3, -2.4], look: [0, 1.4, 4.8], fov: 40 },
    banquetHigh: { pos: [3.1, 5.3, -0.6], look: [0, 0.9, 7.2], fov: 42 },
    banquetTable: { pos: [2.6, 2.2, 4.0], look: [0, 1.0, 7.6], fov: 40 },
    corridor: { pos: [19.35, 1.6, 2.8], look: [CDX, 1.35, CZ0], fov: 40 },
    doorClose: { pos: [18.95, 1.45, -1.6], look: [CDX, 1.3, CZ0], fov: 40 },
  };

  return {
    name: "palace", root, marks, cams,
    pose: (t, c) => {
      const lamps = cl(c.lamps ?? 1), dk = cl(c.dishes ?? 0), mk = sm(cl(c.menu ?? 0)), dr = sm(cl(c.doors ?? 0)), cd = sm(cl(c.door ?? 0));
      for (const f of flames) { flameFlick(f, t); const u = f.userData; u.light.intensity *= lamps; }
      chans.forEach((ch, i) => { ch.light.intensity = ch.base * lamps * (0.95 + 0.05 * Math.sin(t * 2 + i)); ch.g.rotation.y = 0.02 * Math.sin(t * 0.4 + i); });
      chanSpark.forEach((s) => sparkle(s, t, lamps));
      dust.update(t);
      shafts.forEach((s, i) => { (s.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.03 * Math.sin(t * 0.5 + i); });
      // cloches lift one after another; steam over revealed dishes
      dishes.forEach((d, i) => {
        const k = sm(cl((dk - i / 3) * 3)), side = i === 1 ? -1 : 1, up = Math.sin(Math.min(1, k * 1.6) * Math.PI / 2);
        d.cloche.position.set(side * 1.05 * sm(cl(k * 1.6 - 0.6)), 0.95 * up, 0); d.cloche.rotation.z = -side * 0.5 * k; d.cloche.visible = (c.clochesGone ?? 0) < 0.5;
        const steam = steams[i]; risePuffs(steam, t + i * 0.7, 0.9, 0.35, 1.4, k * 0.9);
      });
      board.rotation.y = Math.PI * (1 - mk);
      leaves[0].rotation.y = -dr * 1.75; leaves[1].rotation.y = dr * 1.75;
      (anteGlow.material as THREE.SpriteMaterial).opacity = 0.6 * dr; anteGlow.scale.setScalar(3 + 3 * dr); anteL.intensity = 10 * dr;
      cdoor.rotation.y = cd * 1.48;
      (spill.material as THREE.SpriteMaterial).opacity = Math.min(1, cd * 1.6); spill.scale.setScalar(lerp(0.6, 6.5, cd)); doorL.intensity = 18 * cd;
      const pl = lerp(0.2, 3.2, cd); patchM.opacity = 0.65 * cd; patch.scale.set(1, 1, pl); patch.position.z = CZ0 + 0.05 + pl / 2;
      void TAU;
    },
  };
};
